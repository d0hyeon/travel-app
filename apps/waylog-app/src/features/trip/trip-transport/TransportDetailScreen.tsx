import { AsyncBoundary } from '@waylog/react'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBar } from '~/shared/components/design-system/AppBar'
import { palette } from '../../../shared/config/tokens'
import { TransportDetailMenu } from './transport-detail/TransportDetailMenu'
import { TransportDirectionsAction } from './transport-detail/TransportDirectionsAction'
import { TransportOperationalInfoSection } from './transport-detail/TransportOperationalInfoSection'
import { TransportRealtimeInfoSection } from './transport-detail/TransportRealtimeInfoSection'
import { TransportSummarySection } from './transport-detail/TransportSummarySection'
import { TransportTicketsSection } from './transport-detail/TransportTicketsSection'
import { useTripId } from '../useTripId'
import { useTransportId } from './useTransportId'

export function TransportDetailScreen() {
  const tripId = useTripId()
  const transportId = useTransportId()

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
      <ScrollView contentContainerStyle={styles.content}>
        <TransportSummarySection tripId={tripId} transportId={transportId} />
        <TransportRealtimeInfoSection tripId={tripId} transportId={transportId} />
        <TransportOperationalInfoSection tripId={tripId} transportId={transportId} />
        <TransportTicketsSection tripId={tripId} transportId={transportId} />
        <TransportDirectionsAction tripId={tripId} transportId={transportId} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 20, gap: 12 },
})
