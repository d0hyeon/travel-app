import {
  toDepartureGateLabel,
  toGuidanceTerminalLabel,
  useAirportArrivalGuidance,
  useDepartureGateRecommendation,
  type AirportArrivalGuidance,
  type AirportCongestionTier,
} from '@waylog/domains/modules/airport-arrival-guidance'
import { useTripTransportTickets } from '@waylog/domains/modules/trip-transport'
import { josa } from '@waylog/utility'
import { AsyncBoundary } from '@waylog/react'
import { format } from 'date-fns'
import { StyleSheet, View } from 'react-native'
import { Skeleton, Typography } from '~shared/components/design-system'
import { TransportDetailSectionError } from './transport-detail/TransportDetailSectionError'
import { toCarrierLabel } from './transportLabel'

interface Props {
  tripId: string
  transportId: string
}

export function AirportArrivalGuidanceSection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<AirportArrivalGuidanceSkeleton />}
      rejectedFallback={({ error, resetError }) => (
        <TransportDetailSectionError message={error.message} onRetry={resetError} />
      )}
    >
      <Resolved tripId={tripId} transportId={transportId} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const guidance = useAirportArrivalGuidance({ tripId, transportId })
  const {
    data: { transport },
  } = useTripTransportTickets({ tripId, transportId })

  if (guidance == null) return null

  const carrierLabel = toCarrierLabel(transport)

  return (
    <View style={styles.card}>
      <Typography style={styles.title}>공항 도착 안내</Typography>
      <View style={styles.headline}>
        <Typography style={styles.arrivalTime}>
          <Typography style={[styles.arrivalTime, styles.arrivalTimeAccent]}>
            {format(new Date(guidance.recommendedArrivalAt), 'HH:mm')}
          </Typography>
          까지 공항 도착을 권장해요
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {[carrierLabel, toGuidanceTerminalLabel(guidance), `${format(new Date(guidance.appliedDepartureAt), 'HH:mm')} 출발`]
            .filter((value): value is string => value != null)
            .join(' · ')}
        </Typography>
      </View>
      <AsyncBoundary
        resetKeys={[guidance.recommendedArrivalAt]}
        pendingFallback={<Skeleton width="100%" height={36} />}
        rejectedFallback={() => <CongestionRow tier={guidance.congestionTier} />}
      >
        <DepartureGateRecommendationRow guidance={guidance} />
      </AsyncBoundary>
    </View>
  )
}

function DepartureGateRecommendationRow({ guidance }: { guidance: AirportArrivalGuidance }) {
  const recommendation = useDepartureGateRecommendation(guidance)

  if (recommendation == null) return <CongestionRow tier={guidance.congestionTier} />

  return (
    <View style={styles.realtimeRow}>
      <View style={styles.realtimeDot} />
      <Typography style={styles.realtimeText}>
        현재 {josa(toDepartureGateLabel(recommendation.gate), '이/가')} 가장 여유로워요
      </Typography>
      <Typography style={styles.realtimeTime}>
        {format(new Date(recommendation.observedAt), 'HH:mm')} 기준
      </Typography>
    </View>
  )
}

const CONGESTION_TONE: Record<AirportCongestionTier, { label: string; fg: string; bg: string }> = {
  calm: { label: '원활', fg: '#2E8B4A', bg: '#E8F5EC' },
  normal: { label: '보통', fg: '#C5631A', bg: '#FFF4E6' },
  crowded: { label: '혼잡', fg: '#D14343', bg: '#FDECEC' },
  veryCrowded: { label: '매우 혼잡', fg: '#D14343', bg: '#FDECEC' },
}

function CongestionRow({ tier }: { tier: AirportCongestionTier }) {
  return (
    <View style={styles.congestionRow}>
      <Typography variant="body2">공항 예상 혼잡도</Typography>
      <CongestionChip tier={tier} />
    </View>
  )
}

function CongestionChip({ tier }: { tier: AirportCongestionTier }) {
  const tone = CONGESTION_TONE[tier]
  return (
    <View style={[styles.congestionChip, { backgroundColor: tone.bg }]}>
      <Typography style={[styles.congestionChipText, { color: tone.fg }]}>{tone.label}</Typography>
    </View>
  )
}

function AirportArrivalGuidanceSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={88} height={16} />
      <Skeleton width="62%" height={22} />
      <Skeleton width="78%" height={16} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
    backgroundColor: '#F6F8FF',
    borderWidth: 1,
    borderColor: '#EEF3FF',
  },
  title: { fontSize: 14, fontWeight: '700', color: '#4C84FF' },
  headline: { gap: 4 },
  arrivalTime: { fontSize: 17, lineHeight: 23 },
  arrivalTimeAccent: { color: '#4C84FF' },
  detail: { fontSize: 13 },
  realtimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  realtimeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2DB95F' },
  realtimeText: { flex: 1, fontSize: 12, fontWeight: '700' },
  realtimeTime: { fontSize: 11, color: 'rgba(0,0,0,0.38)' },
  congestionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  congestionChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  congestionChipText: { fontSize: 11, fontWeight: '900' },
})
