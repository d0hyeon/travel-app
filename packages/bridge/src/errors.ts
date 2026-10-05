import type { BridgeErrorCode } from './protocol'

export class BridgeUnsupportedError extends Error { constructor(message = 'This bridge capability is not supported.') { super(message); this.name = 'BridgeUnsupportedError' } }
export class BridgeUnavailableError extends Error { constructor(message = 'This bridge capability is unavailable.') { super(message); this.name = 'BridgeUnavailableError' } }
export class BridgeTimeoutError extends Error { constructor(message = 'The bridge request timed out.') { super(message); this.name = 'BridgeTimeoutError' } }
export class BridgeProtocolError extends Error { constructor(message = 'The bridge protocol message is invalid.') { super(message); this.name = 'BridgeProtocolError' } }
export class BridgeHandlerError extends Error { constructor(message = 'The native bridge handler failed.') { super(message); this.name = 'BridgeHandlerError' } }

export function toBridgeError(code: BridgeErrorCode, message: string): Error {
  if (code === 'unsupported') return new BridgeUnsupportedError(message)
  if (code === 'unavailable') return new BridgeUnavailableError(message)
  if (code === 'timeout') return new BridgeTimeoutError(message)
  if (code === 'handler') return new BridgeHandlerError(message)
  return new BridgeProtocolError(message)
}
