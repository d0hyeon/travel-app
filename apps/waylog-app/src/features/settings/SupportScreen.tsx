import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import { AppRoute } from '~app/AppRoute'
import { WEB_SERVICE_URL } from '~app/env'
import { AppBar } from '~shared/components/design-system/AppBar'
import { palette } from '~shared/config/tokens'

export function SupportScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <AppBar title="문의하기" />
      <WebView source={{ uri: `${WEB_SERVICE_URL}${AppRoute.문의}` }} style={styles.webview} />
    </SafeAreaView>
  )
}

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.문의]: undefined
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  webview: { flex: 1 },
})
