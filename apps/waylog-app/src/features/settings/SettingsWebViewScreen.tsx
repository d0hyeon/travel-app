import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import { useCommonBridgeResolvers } from '../../shared/bridge/useCommonBridgeResolvers'
import { useWebViewBridge } from '../../shared/bridge/useWebViewBridge'
import { WEB_SERVICE_URL } from '~app/env'

interface Props {
  path?: string
}

export function SettingsWebViewScreen({ path = '/settings' }: Props) {
  const commonResolvers = useCommonBridgeResolvers()
  const { attachWebView, bindMessage } = useWebViewBridge({
    resolvers: commonResolvers,
  })

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <WebView
        ref={attachWebView}
        source={{ uri: `${WEB_SERVICE_URL}${path}` }}
        style={styles.webview}
        onMessage={bindMessage}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  webview: { flex: 1 },
})
