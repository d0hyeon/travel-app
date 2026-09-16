import { AsyncBoundary } from '@waylog/react'
import { useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { StyleSheet, View } from 'react-native'
import { Skeleton, Typography } from '~/shared/components/design-system'
import { TransportDetailSectionError } from './TransportDetailSectionError'

interface Props {
  tripId: string
  transportId: string
}

export function TransportRealtimeInfoSection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportRealtimeInfoSkeleton />}
      rejectedFallback={({ error, resetError }) => (
        <TransportDetailSectionError message={error.message} onRetry={resetError} />
      )}
    >
      <Resolved tripId={tripId} transportId={transportId} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const { transport } = useTripTransportDetail({ tripId, transportId })
  return (
    <View style={styles.card} accessibilityLabel={`${transport.type} 실시간 정보`}>
      <Typography style={styles.title}>실시간 정보</Typography>
      <Typography style={styles.description}>15분 지연 · 예상 출발 09:25</Typography>
    </View>
  )
}

function TransportRealtimeInfoSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={72} height={16} />
      <Skeleton width="58%" height={18} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, backgroundColor: '#fff3e0', gap: 6 },
  title: { fontSize: 13, fontWeight: '700', color: '#d55a00' },
  description: { fontSize: 14 },
})
