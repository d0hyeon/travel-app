import {
  toFlightStatusView,
  useFlightGateChange,
  useFlightStatus,
  type FlightStatusTone,
} from '@waylog/domains/modules/flight-status'
import { TransportType } from '@waylog/domains/modules/transport'
import { useTripTransportTickets } from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { StyleSheet, View } from 'react-native'
import { Skeleton, Typography } from '~/shared/components/design-system'
import { assert } from '../../../shared/utils/assert'

interface Props {
  tripId: string
  transportId: string
}

const TONE_COLOR: Record<FlightStatusTone, { bg: string; fg: string }> = {
  normal: { bg: '#EEF3FF', fg: '#3A63D8' },
  warning: { bg: '#FFF4E6', fg: '#C5631A' },
  error: { bg: '#FDECEC', fg: '#D14343' },
  done: { bg: '#f1f3f5', fg: '#5f6b76' },
}

export function TransportRealtimeInfoSection({ tripId, transportId }: Props) {
  return (
    <>
      <AsyncBoundary
        resetKeys={[tripId, transportId]}
        pendingFallback={<TransportRealtimeInfoSkeleton />}
      >
        <Resolved tripId={tripId} transportId={transportId} />
      </AsyncBoundary>
    </>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const {
    data: { transport },
  } = useTripTransportTickets({ tripId, transportId })
  assert(transport.type === TransportType.항공, '항공 서비스만 지원됩니다.');

  const { status, isSupported } = useFlightStatus({
    transportId,
    airlineCode: transport.airlineCode,
    flightNumber: transport.flightNumber,
    departureAirportCode: transport.departureAirportCode,
    departureAt: transport.departureAt,
  })


  const gateChange = useFlightGateChange(transportId)

  // 코드 없이 등록된 교통편과 인천에서 출발하지 않는 노선은 조회할 곳이 없다.
  // 빈 카드를 남기면 데이터를 기다리는 것처럼 보인다.
  if (!isSupported) return null

  const view = toFlightStatusView(status, gateChange)
  if (view == null) return null

  const color = TONE_COLOR[view.tone]

  return (
    <View
      style={[styles.card, { backgroundColor: color.bg }]}
      accessibilityLabel={`${transport.type} 실시간 정보`}
    >
      <Typography style={[styles.title, { color: color.fg }]}>{view.title}</Typography>
      <Typography style={styles.description}>
        {view.timeChange != null && (
          <>
            출발 시간이{' '}
            <Typography style={styles.strikeThrough}>{view.timeChange.fromClock}</Typography>{' '}
            →{' '}
            <Typography style={[styles.description, { fontWeight: '900', color: color.fg }]}>
              {view.timeChange.toClock}
            </Typography>
            로 변경됐어요.
          </>
        )}
        {view.gateChange != null && (
          <>
            탑승구가{' '}
            <Typography style={styles.strikeThrough}>{view.gateChange.fromGate}</Typography>{' '}
            →{' '}
            <Typography style={[styles.description, { fontWeight: '900', color: color.fg }]}>
              {view.gateChange.toGate}
            </Typography>
            (으)로 변경됐어요.
          </>
        )}
        {view.description}
      </Typography>
    </View>
  )
}

function TransportRealtimeInfoSkeleton() {
  return (
    <View style={[styles.card, { backgroundColor: '#f1f3f5' }]}>
      <Skeleton width={72} height={16} />
      <Skeleton width="58%" height={18} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, gap: 6 },
  title: { fontSize: 13, fontWeight: '700' },
  description: { fontSize: 13, lineHeight: 19 },
  strikeThrough: { fontSize: 13, color: 'rgba(0,0,0,0.38)', textDecorationLine: 'line-through' },
})
