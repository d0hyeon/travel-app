import { ErrorBoundary } from '@waylog/react'
import { View, StyleSheet } from 'react-native'
import { Button, Stack, Typography } from '~shared/components/design-system'
import { useAppRoute } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { palette } from '~shared/config/tokens'
import { TripDetailHeader } from './components/TripDetailHeader'
import { TripDetailTabs } from './TripDetailTabs'
import { TripLayout } from './trip-layout/TripLayout'

export type TripDetailParams = { tripId: string }

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.여행_상세]: TripDetailParams
  }
}

export function TripDetailScreen() {
  const { params } = useAppRoute<typeof AppRoute.여행_상세>()

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
        <TripLayout header={<TripDetailHeader />}>
          <TripDetailTabs tripId={params.tripId} />
        </TripLayout>
      </ErrorBoundary>
    </View>
  )
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  screen: { flex: 1, backgroundColor: palette.background },
  retryButton: { marginTop: 12 },
})
