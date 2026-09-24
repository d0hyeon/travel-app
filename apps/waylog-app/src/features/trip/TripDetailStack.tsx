import { ErrorBoundary } from '@waylog/react'
import { View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../../shared/config/tokens'
import { TripDetailHeader } from './components/TripDetailHeader'
import { TripDetailTabs } from './TripDetailTabs'

export function TripDetailStack() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      <ErrorBoundary
        fallback={({ resetError }) => (
          <Stack style={styles.error}>
            <Typography color="text.secondary">여행 정보를 불러오지 못했어요</Typography>
            <Button variant="contained" onPress={resetError} style={styles.retryButton}>다시 시도</Button>
          </Stack>
        )}
      >
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TripDetailHeader />
        </View>
        <View style={styles.fill}>
          <TripDetailTabs />
        </View>
      </ErrorBoundary>
    </View>
  )
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fill: { flex: 1 },
  screen: { flex: 1, backgroundColor: palette.background },
  retryButton: { marginTop: 12 },
  header: { backgroundColor: palette.background },
})
