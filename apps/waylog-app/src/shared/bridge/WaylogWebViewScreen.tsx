
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import { WEB_SERVICE_URL } from '~app/env'
import { useCommonBridgeResolvers } from '~shared/bridge/useCommonBridgeResolvers'
import { useWebViewBridge } from '~shared/bridge/useWebViewBridge'
import { palette } from '~shared/config/tokens'
import { AppRoute } from '~app/AppRoute';
import { ValueOf } from '@waylog/utility'

interface Props {
  route: ValueOf<typeof AppRoute>;
}

export function WaylogWebViewScreen({ route }: Props) {
  const commonResolvers = useCommonBridgeResolvers()
  const { attachWebView, bindMessage } = useWebViewBridge({
    resolvers: commonResolvers,
  })

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <WebView
          ref={attachWebView}
          source={{ uri: `${WEB_SERVICE_URL}${route}` }}
          style={styles.webview}
          onMessage={bindMessage}
        />
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  screen: { flex: 1 },
  webview: { flex: 1 },
})
