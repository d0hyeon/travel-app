import { AsyncBoundary } from '@waylog/react'
import { TransportTypeLabel } from '@waylog/domains/modules/transport'
import {
  formatArrivalTime,
  formatDepartureTime,
  useTripTransportDetail,
} from '@waylog/domains/modules/trip-transport'
import { format } from 'date-fns'
import { StyleSheet, View } from 'react-native'
import { Skeleton, Typography } from '~/shared/components/design-system'
import { palette } from '../../../../shared/config/tokens'
import { TransportTypeIcon } from '../TransportTypeIcon'
import { toCarrierLabel } from '../transportLabel'
import { TransportDetailSectionError } from './TransportDetailSectionError'

const EMPTY_VALUE = '-'

interface Props {
  tripId: string
  transportId: string
}

export function TransportSummarySection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportSummarySkeleton />}
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
  const carrierLabel = toCarrierLabel(transport) ?? EMPTY_VALUE

  return (
    <View style={styles.section}>
      <View style={styles.typeBadge}>
        <TransportTypeIcon type={transport.type} size={15} color={palette.textSecondary} />
        <Typography style={styles.typeLabel}>{TransportTypeLabel[transport.type]}</Typography>
      </View>
      <View style={styles.times}>
        <Typography style={styles.time}>{formatDepartureTime(transport) || EMPTY_VALUE}</Typography>
        <Typography style={styles.arrow}>→</Typography>
        <Typography style={styles.time}>{formatArrivalTime(transport) ?? EMPTY_VALUE}</Typography>
      </View>
      <Typography style={styles.route}>
        {transport.departureName || EMPTY_VALUE} → {transport.arrivalName || EMPTY_VALUE}
      </Typography>
      <Typography style={styles.carrier}>
        {carrierLabel} · {format(new Date(transport.departureAt), 'M월 d일')}
      </Typography>
    </View>
  )
}

function TransportSummarySkeleton() {
  return (
    <View style={styles.section}>
      <Skeleton width={64} height={28} variant="rounded" />
      <View style={styles.times}>
        <Skeleton width={72} height={38} />
        <Skeleton width={20} height={28} />
        <Skeleton width={72} height={38} />
      </View>
      <Skeleton width="72%" height={18} />
      <Skeleton width="48%" height={16} />
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  typeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  typeLabel: { fontSize: 12, fontWeight: '700' },
  times: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  time: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  arrow: { fontSize: 22, lineHeight: 38, color: palette.textSecondary },
  route: { fontSize: 15, color: palette.textSecondary },
  carrier: { fontSize: 13, color: palette.textSecondary, marginBottom: 10 },
})
