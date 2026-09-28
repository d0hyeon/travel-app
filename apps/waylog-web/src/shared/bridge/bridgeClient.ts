import type { BridgeTransport } from '@waylog/bridge'
import { createBridgeClient } from '@waylog/bridge/client'

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void }
  }
}

function createReactNativeWebViewTransport(): BridgeTransport | undefined {
  if (typeof window === 'undefined') return undefined

  const nativeWebView = window.ReactNativeWebView
  if (!nativeWebView) return undefined

  return {
    send: (message) => nativeWebView.postMessage(message),
    subscribe: (listener) => {
      const handleMessage = (event: MessageEvent<string>) => listener(event.data)
      window.addEventListener('message', handleMessage)
      return () => window.removeEventListener('message', handleMessage)
    },
  }
}

export const bridgeClient = createBridgeClient(createReactNativeWebViewTransport())
