import {
  toFlightStatusView,
  useFlightStatus,
  type FlightStatusTone,
} from '@waylog/domains/modules/flight-status'
import { useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { StyleSheet, View } from 'react-native'
import { Skeleton, Typography } from '~/shared/components/design-system'
import { TransportDetailSectionError } from './TransportDetailSectionError'
import { assert } from '@waylog/utility'
import { TransportType } from '@waylog/domains/modules/transport'

interface Props {
  tripId: string
  transportId: string
}

const TONE_COLOR: Record<FlightStatusTone, { bg: string; fg: string }> = {
  normal: { bg: '#e8f4ff', fg: '#0b6bcb' },
  warning: { bg: '#fff3e0', fg: '#d55a00' },
  error: { bg: '#ffebee', fg: '#c62828' },
  done: { bg: '#f1f3f5', fg: '#5f6b76' },
}

export function TransportRealtimeInfoSection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportRealtimeInfoSkeleton />}
    >
      <Resolved tripId={tripId} transportId={transportId} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const { transport } = useTripTransportDetail({ tripId, transportId })
  assert(transport.type === TransportType.항공, '항공 서비스만 지원됩니다.');

  const { status, provider, isSupported } = useFlightStatus({
    airlineCode: transport.airlineCode,
    flightNumber: transport.flightNumber,
    departureAirportCode: transport.departureAirportCode,
    arrivalAirportCode: transport.arrivalAirportCode,
    departureAt: transport.departureAt,
  })


  // 코드 없이 등록된 교통편과 인천을 지나지 않는 노선은 조회할 곳이 없다.
  // 빈 카드를 남기면 데이터를 기다리는 것처럼 보인다.
  if (!isSupported) return null

  const view = toFlightStatusView(status)
  if (view == null) return null

  const color = TONE_COLOR[view.tone]

  return (
    <View
      style={[styles.card, { backgroundColor: color.bg }]}
      accessibilityLabel={`${transport.type} 실시간 정보`}
    >
      <Typography style={[styles.title, { color: color.fg }]}>실시간 정보</Typography>
      <Typography style={styles.description}>{view.title}</Typography>
      {view.description != null && (
        <Typography style={styles.detail}>{view.description}</Typography>
      )}
      {provider != null && <Typography style={styles.provider}>{provider} 제공</Typography>}
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
  card: { padding: 16, borderRadius: 16, gap: 6 },
  title: { fontSize: 13, fontWeight: '700' },
  description: { fontSize: 14 },
  detail: { fontSize: 12.5, color: '#5f6b76' },
  provider: { fontSize: 11.5, color: '#5f6b76' },
})
