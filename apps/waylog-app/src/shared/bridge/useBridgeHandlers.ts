import type { BridgeContract, BridgeMethod } from '@waylog/bridge/contract'
import type { BridgeHostApi } from '@waylog/bridge/host'
import { useEffect } from 'react'

type BridgeHandlerMap = Partial<BridgeContract>

export function useBridgeHandlers(host: BridgeHostApi | undefined, handlers: BridgeHandlerMap): void {
  useEffect(() => {
    if (!host) return
    const methods = Object.keys(handlers) as BridgeMethod[]
    const unregisterAll = methods.map((method) => host.register(method, handlers[method]!))
    return () => unregisterAll.forEach((unregister) => unregister())
  }, [host, handlers])
}
