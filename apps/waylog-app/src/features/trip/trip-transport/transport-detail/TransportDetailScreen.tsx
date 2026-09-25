import { AppRoute } from '@waylog/routes'
import { AsyncBoundary } from '@waylog/react'
import { Suspense } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBar } from '~/shared/components/design-system/AppBar'
import { palette } from '../../../../shared/config/tokens'
import { TransportDetailMenu } from './TransportDetailMenu'
import { TransportDirectionsAction } from '../TransportDirectionsAction'
import { TransportOperationalInfoSection } from '../TransportOperationalInfoSection'
import { TransportRealtimeInfoSection } from '../TransportRealtimeInfoSection'
import { TransportSummarySection } from '../TransportSummarySection'
import { TransportTicketsSection } from '../transport-ticket/TransportTicketsSection'
import { useAppRoute } from '../../../../shared/hooks/useAppNavigation'
import { PushNotificationCard } from '../../../auth/PushNotificationCard'
import { Box, Stack } from '~/shared/components/design-system'
import { AirportArrivalGuidanceSection } from '../AirportArrivalGuidanceSection'

export type TransportDetailParams = { tripId: string; transportId: string }

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.여행_교통편_상세]: TransportDetailParams
  }
}

export function TransportDetailScreen() {
  const { params: { tripId, transportId } } = useAppRoute<typeof AppRoute.여행_교통편_상세>()

  return (
    <SafeAreaView style={styles.screen}>
      <AppBar
        title="탑승권 상세"
        rightAddon={
          <AsyncBoundary resetKeys={[tripId, transportId]} pendingFallback={null} rejectedFallback={() => null}>
            <TransportDetailMenu tripId={tripId} transportId={transportId} />
          </AsyncBoundary>
        }
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Suspense>
          <PushNotificationCard />
        </Suspense>
        <Stack gap={3} style={styles.wrapper}>
          <TransportSummarySection tripId={tripId} transportId={transportId} style={{ marginBottom: 10 }} />
          <TransportRealtimeInfoSection tripId={tripId} transportId={transportId} />
          <AirportArrivalGuidanceSection tripId={tripId} transportId={transportId} />
          <TransportOperationalInfoSection tripId={tripId} transportId={transportId} />
          <TransportTicketsSection tripId={tripId} transportId={transportId} />
          <TransportDirectionsAction tripId={tripId} transportId={transportId} />
        </Stack>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { paddingVertical: 20 },
  wrapper: { paddingHorizontal: 20 }
})
