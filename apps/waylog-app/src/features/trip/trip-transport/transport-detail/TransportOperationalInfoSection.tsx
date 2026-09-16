import { AsyncBoundary } from '@waylog/react'
import { useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { StyleSheet, View } from 'react-native'
import { Skeleton, Typography } from '~/shared/components/design-system'
import { palette } from '../../../../shared/config/tokens'
import { TransportDetailSectionError } from './TransportDetailSectionError'

const INFORMATION_CARDS = [
  ['터미널', '2'],
  ['게이트', '23'],
  ['좌석(나)', '32A'],
] as const
interface Props {
  tripId: string
  transportId: string
}

export function TransportOperationalInfoSection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportOperationalInfoSkeleton />}
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
    <View style={styles.grid} accessibilityLabel={`${transport.type} 운행 정보`}>
      {INFORMATION_CARDS.map(([label, value]) => (
        <View key={label} style={styles.card}>
          <Typography style={styles.label}>{label}</Typography>
          <Typography style={styles.value}>{value}</Typography>
        </View>
      ))}
    </View>
  )
}

function TransportOperationalInfoSkeleton() {
  return (
    <View style={styles.grid}>
      {INFORMATION_CARDS.map(([label]) => (
        <View key={label} style={styles.card}>
          <Skeleton width={36} height={14} />
          <Skeleton width={28} height={20} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 10, marginVertical: 8 },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  label: { fontSize: 12, color: palette.textSecondary },
  value: { fontSize: 16, fontWeight: '700' },
})
