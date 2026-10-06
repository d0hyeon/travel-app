import { bridgeMethods, type BridgeMethod } from "./contract";

export type BridgeErrorCode =
  | "unsupported"
  | "unavailable"
  | "timeout"
  | "protocol"
  | "handler";

export interface BridgeTransport {
  send: (message: string) => void;
  subscribe: (listener: (message: string) => void) => () => void;
}

export interface BridgeRequest {
  type: "bridge-request";
  requestId: string;
  method: BridgeMethod;
  params: object | undefined;
}

export type BridgeResponse =
  | {
      type: "bridge-response";
      requestId: string;
      ok: true;
      result: unknown;
    }
  | {
      type: "bridge-response";
      requestId: string;
      ok: false;
      error: { code: BridgeErrorCode; message: string };
    };

export interface BridgeInfoMessage {
  type: "bridge-info";
  info: import("./contract").BridgeInfo;
}
export interface BridgeInitMessage {
  type: "bridge-init";
}

export function parseBridgeMessage(message: string): unknown {
  try {
    return JSON.parse(message);
  } catch {
    return undefined;
  }
}

export function isBridgeMethod(value: unknown): value is BridgeMethod {
  return (
    typeof value === "string" && bridgeMethods.includes(value as BridgeMethod)
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isBridgeRequest(value: unknown): value is BridgeRequest {
  if (!isPlainObject(value)) return false;
  return (
    value.type === "bridge-request" &&
    typeof value.requestId === "string" &&
    isBridgeMethod(value.method) &&
    (value.params === undefined || isPlainObject(value.params))
  );
}

export function getBridgeRequestId(value: unknown): string | undefined {
  if (
    !isPlainObject(value) ||
    value.type !== "bridge-request" ||
    typeof value.requestId !== "string"
  )
    return undefined;
  return value.requestId;
}

export function isBridgeResponse(value: unknown): value is BridgeResponse {
  if (
    !isPlainObject(value) ||
    value.type !== "bridge-response" ||
    typeof value.requestId !== "string" ||
    typeof value.ok !== "boolean"
  )
    return false;
  if (value.ok) return true;
  return (
    isPlainObject(value.error) &&
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  );
}

export function isBridgeInfoMessage(
  value: unknown,
): value is BridgeInfoMessage {
  if (
    !isPlainObject(value) ||
    value.type !== "bridge-info" ||
    !isPlainObject(value.info)
  )
    return false;
  return (
    typeof value.info.bridgeVersion === "number" &&
    typeof value.info.appVersion === "string" &&
    Array.isArray(value.info.methods) &&
    value.info.methods.every(isBridgeMethod)
  );
}

export function isBridgeInitMessage(
  value: unknown,
): value is BridgeInitMessage {
  return isPlainObject(value) && value.type === "bridge-init";
}
