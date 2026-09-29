import {
  bridgeMethods,
  bridgeVersion,
  type BridgeInterface,
  type BridgeInfo,
  type BridgeMethod,
} from "./contract";
import {
  BridgeHandlerError,
  BridgeProtocolError,
  BridgeUnavailableError,
} from "./errors";
import {
  getBridgeRequestId,
  isBridgeInitMessage,
  isBridgeRequest,
  parseBridgeMessage,
  type BridgeResponse,
  type BridgeTransport,
} from "./protocol";
type RegisteredHandler = (params: object | undefined) => Promise<unknown>;

class BridgeHost {
  private readonly transport: BridgeTransport;
  private readonly handlerStacks = new Map<
    BridgeMethod,
    Array<{ id: symbol; handler: RegisteredHandler }>
  >();
  private readonly bridgeInfo: BridgeInfo;
  private readonly unsubscribe: () => void;
  private isDisposed = false;

  constructor(
    transport: BridgeTransport,
    {
      appVersion,
      resolvers = {},
    }: { appVersion: string; resolvers?: Partial<BridgeInterface> },
  ) {
    this.transport = transport;
    this.bridgeInfo = {
      bridgeVersion,
      appVersion,
      methods: bridgeMethods.filter((method) => resolvers[method] != null),
    };
    this.unsubscribe = transport.subscribe((message) => {
      void this.handleMessage(message);
    });
    bridgeMethods.forEach((method) => {
      const resolver = resolvers[method];
      if (resolver) this.register(method, resolver);
    });
    this.send({ type: "bridge-info", info: this.bridgeInfo });
  }
  register<Method extends BridgeMethod>(
    method: Method,
    handler: BridgeInterface[Method],
  ): () => void {
    const entry = { id: Symbol(method), handler: handler as RegisteredHandler };
    const stack = this.handlerStacks.get(method) ?? [];
    stack.push(entry);
    this.handlerStacks.set(method, stack);
    return () => this.removeHandler(method, entry.id);
  }

  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.unsubscribe();
    this.handlerStacks.clear();
  }

  private removeHandler(method: BridgeMethod, handlerId: symbol): void {
    const stack = this.handlerStacks.get(method);
    if (!stack) return;
    const remainingHandlers = stack.filter((entry) => entry.id !== handlerId);
    if (remainingHandlers.length)
      this.handlerStacks.set(method, remainingHandlers);
    else this.handlerStacks.delete(method);
  }

  private send(
    message: BridgeResponse | { type: "bridge-info"; info: BridgeInfo },
  ): void {
    this.transport.send(JSON.stringify(message));
  }

  private sendError(requestId: string, error: Error): void {
    const code =
      error instanceof BridgeUnavailableError
        ? "unavailable"
        : error instanceof BridgeProtocolError
          ? "protocol"
          : "handler";

    this.send({
      type: "bridge-response",
      requestId,
      ok: false,
      error: { code, message: error.message },
    });
  }

  private async handleMessage(message: string): Promise<void> {
    if (this.isDisposed) return;
    const parsed = parseBridgeMessage(message);
    if (isBridgeInitMessage(parsed)) {
      this.send({ type: "bridge-info", info: this.bridgeInfo });
      return;
    }
    if (!isBridgeRequest(parsed)) {
      const requestId = getBridgeRequestId(parsed);
      if (requestId) {
        this.sendError(
          requestId,
          new BridgeProtocolError("Bridge request is invalid."),
        );
      }
      return;
    }

    const handler = this.handlerStacks.get(parsed.method)?.at(-1);
    if (!handler) {
      this.sendError(parsed.requestId, new BridgeUnavailableError());
      return;
    }
    try {
      const result = await handler.handler(parsed.params);
      this.send({
        type: "bridge-response",
        requestId: parsed.requestId,
        ok: true,
        result,
      });
    } catch (error) {
      this.sendError(
        parsed.requestId,
        error instanceof Error
          ? new BridgeHandlerError(error.message)
          : new BridgeHandlerError(),
      );
    }
  }
}

export type { BridgeHost };

export function createBridgeHost(
  transport: BridgeTransport,
  options: { appVersion: string; resolvers?: Partial<BridgeInterface> },
): BridgeHost {
  return new BridgeHost(transport, options);
}
