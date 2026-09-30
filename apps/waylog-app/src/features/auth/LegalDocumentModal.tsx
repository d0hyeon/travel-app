import { Modal, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import { WEB_SERVICE_URL } from '~app/env'
import { Button, Stack } from '~shared/components/design-system'
import { palette } from '~shared/config/tokens'

interface Props {
  /** 웹의 약관 문서 경로. null 이면 닫힌다. */
  path: string | null
  onClose: () => void
}

export function LegalDocumentModal({ path, onClose }: Props) {
  return (
    <Modal visible={path != null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <Stack direction="row" justifyContent="flex-end" px={1} py={1}>
          <Button variant="text" onPress={onClose}>
            닫기
          </Button>
        </Stack>
        <View style={styles.webview}>
          {path != null && <WebView source={{ uri: `${WEB_SERVICE_URL}${path}` }} />}
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  webview: { flex: 1 },
})
