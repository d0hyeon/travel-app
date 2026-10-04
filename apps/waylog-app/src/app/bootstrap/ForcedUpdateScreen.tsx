import * as Linking from 'expo-linking'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Typography } from '~shared/components/design-system'
import { palette } from '~shared/config/tokens'
import type { RequiredAppUpdate } from './appUpdateRequirement'

export function ForcedUpdateScreen({ storeUrl }: RequiredAppUpdate) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.message}>
        <Typography variant="h5" textAlign="center">
          업데이트가 필요해요
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          더 안정적인 사용을 위해 최신 버전으로 업데이트해 주세요.
        </Typography>
      </View>
      <Button variant="contained" size="large" style={styles.button} onPress={() => void Linking.openURL(storeUrl)}>
        업데이트
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background, paddingHorizontal: 24 },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  button: { alignSelf: 'stretch' },
})
