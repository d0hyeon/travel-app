import {
  bridgeMethods,
  bridgeVersion,
  type BridgeContract,
  type BridgeMethod,
} from "./contract";
import {
  BridgeTimeoutError,
  BridgeUnavailableError,
  BridgeUnsupportedError,
  toBridgeError,
} from "./errors";
import {
  isBridgeInfoMessage,
  isBridgeResponse,
  parseBridgeMessage,
  type BridgeTransport,
} from "./protocol";

const requestTimeoutMs = 10_000;

interface PendingRequest {
  resolve: () => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

export type BridgeClientApi = Pick<BridgeClient, "ready" | "supports"> &
  BridgeContract;

class BridgeClient {
  private readonly transport: BridgeTransport | undefined;
  private methods = new Set<BridgeMethod>();
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private readonly readyPromise: Promise<void>;
  private readonly unsubscribe: (() => void) | undefined;
  private resolveReady: (() => void) | undefined;
  private rejectReady: ((error: Error) => void) | undefined;
  private bridgeError: Error | undefined;
  private isDisposed = false;
  private isReady = false;

  constructor(transport?: BridgeTransport) {
    this.transport = transport;
    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    this.unsubscribe = transport?.subscribe(this.handleMessage);

    if (!transport) {
      this.bridgeError = new BridgeUnavailableError();
      this.rejectReady?.(this.bridgeError);
      return;
    }

    transport.send(JSON.stringify({ type: "bridge-init" }));
  }

  ready = (): Promise<void> => this.readyPromise;

  supports = <Method extends BridgeMethod>(method: Method): boolean =>
    this.methods.has(method);

  destroy(): void {
    if (this.isDisposed) return;

    this.isDisposed = true;
    this.unsubscribe?.();
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeoutId);
      pending.reject(new BridgeUnavailableError());
    });
    this.pendingRequests.clear();
  }

  expose(): BridgeClientApi {
    return new Proxy(this, {
      get: (client, property) => {
        if (property === "then" || typeof property === "symbol")
          return undefined;
        if (property === "ready" || property === "supports")
          return client[property];
        if (
          typeof property === "string" &&
          bridgeMethods.includes(property as BridgeMethod)
        ) {
          return (params: object) =>
            client.invoke(property as BridgeMethod, params);
        }
        return undefined;
      },
    }) as BridgeClientApi;
  }

  private handleMessage = (message: string): void => {
    const parsed = parseBridgeMessage(message);

    if (isBridgeInfoMessage(parsed)) {
      this.handleBridgeInfo(parsed.info.bridgeVersion, parsed.info.methods);
      return;
    }

    if (!isBridgeResponse(parsed)) return;

    const pending = this.pendingRequests.get(parsed.requestId);
    if (!pending) return;

    this.pendingRequests.delete(parsed.requestId);
    clearTimeout(pending.timeoutId);

    if (parsed.ok) pending.resolve();
    else pending.reject(toBridgeError(parsed.error.code, parsed.error.message));
  };

  private handleBridgeInfo(version: number, methods: BridgeMethod[]): void {
    if (Math.trunc(version) !== bridgeVersion) {
      this.bridgeError = new BridgeUnsupportedError();
      this.rejectReady?.(this.bridgeError);
      return;
    }

    this.methods = new Set(methods);
    this.isReady = true;
    this.resolveReady?.();
  }

  private invoke(method: BridgeMethod, params: object): Promise<void> {
    if (this.bridgeError) return Promise.reject(this.bridgeError);
    if (!this.transport || this.isDisposed || !this.isReady) {
      return Promise.reject(new BridgeUnavailableError());
    }
    if (!this.methods.has(method))
      return Promise.reject(new BridgeUnsupportedError());

    const transport = this.transport;
    if (!transport) return Promise.reject(new BridgeUnavailableError());
    const requestId = crypto.randomUUID();

    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new BridgeTimeoutError());
      }, requestTimeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timeoutId });
      transport.send(
        JSON.stringify({ type: "bridge-request", requestId, method, params }),
      );
    });
  }
}

export function createBridgeClient(
  transport?: BridgeTransport,
): BridgeClientApi {
  return new BridgeClient(transport).expose();
}
