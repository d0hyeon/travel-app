import { readAuthTokens, signOut } from '@waylog/domains/clients'
import type { BridgeTransport } from '@waylog/bridge'
import { createBridgeHost } from '@waylog/bridge/host'
import { useCallback, useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView, { type WebViewMessageEvent } from 'react-native-webview'
import { useBridgeHandlers } from '../../shared/bridge/useBridgeHandlers'
import { refetchBridgeQueries } from '../../shared/bridge/refetchQueriesHandler'
import { useAppNavigation } from '../../shared/hooks/useAppNavigation'

interface Props {
  path?: string
}

const APP_VERSION = '1.0.0'

interface WebViewBridge {
  transport: BridgeTransport
  dispatchMessage: (message: string) => void
}

function createWebViewBridge(webView: WebView): WebViewBridge {
  const listeners = new Set<(message: string) => void>()
  return {
    transport: {
      send: (message) => webView.postMessage(message),
      subscribe: (listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
    },
    dispatchMessage: (message) => listeners.forEach((listener) => listener(message)),
  }
}

export function SettingsWebViewScreen({ path = '/settings' }: Props) {
  const navigation = useAppNavigation()
  const [bridge, setBridge] = useState<WebViewBridge>()

  const attachWebView = useCallback((instance: WebView | null) => {
    setBridge(instance ? createWebViewBridge(instance) : undefined)
  }, [])

  const host = useMemo(
    () => (bridge ? createBridgeHost(bridge.transport, { appVersion: APP_VERSION }) : undefined),
    [bridge],
  )

  const handlers = useMemo(
    () => ({
      closeWebView: async () => {
        navigation.goBack()
      },
      refetchQueries: refetchBridgeQueries,
      getAuthTokens: async () => {
        const tokens = await readAuthTokens()
        if (!tokens) throw new Error('로그인 세션이 없습니다.')
        return tokens
      },
      notifyAuthSignedOut: async () => {
        await signOut()
      },
    }),
    [navigation],
  )

  useBridgeHandlers(host, handlers)

  const handleMessage = (event: WebViewMessageEvent) => {
    bridge?.dispatchMessage(event.nativeEvent.data)
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <WebView
        ref={attachWebView}
        source={{ uri: `${process.env.EXPO_PUBLIC_WEB_BASE_URL}${path}` }}
        style={styles.webview}
        onMessage={handleMessage}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  webview: { flex: 1 },
})
