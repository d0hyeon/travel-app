import { Skeleton, Stack, Typography } from '@mui/material'
import {
  toFlightStatusView,
  useFlightStatus,
  type FlightStatusTone,
} from '@waylog/domains/modules/flight-status'
import { useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { AirportArrivalGuidanceSection } from './AirportArrivalGuidanceSection'
import { TransportDetailSectionError } from './transport-detail/TransportDetailSectionError'

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
    <>
      <AirportArrivalGuidanceSection tripId={tripId} transportId={transportId} />
      <AsyncBoundary
        resetKeys={[tripId, transportId]}
        pendingFallback={<TransportRealtimeInfoSkeleton />}
        rejectedFallback={({ error, resetError }) => (
          <TransportDetailSectionError message={error.message} onRetry={resetError} />
        )}
      >
        <Resolved tripId={tripId} transportId={transportId} />
      </AsyncBoundary>
    </>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const { transport } = useTripTransportDetail({ tripId, transportId })
  const { status, provider, isSupported } = useFlightStatus({
    airlineCode: transport.type === 'flight' ? transport.airlineCode : undefined,
    flightNumber: transport.type === 'flight' ? transport.flightNumber : undefined,
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
    <Stack
      gap={0.75}
      p={2}
      borderRadius={4}
      bgcolor={color.bg}
      aria-label={`${transport.type} 실시간 정보`}
    >
      <Typography fontSize={13} fontWeight={700} color={color.fg}>
        실시간 정보
      </Typography>
      <Typography fontSize={14}>{view.title}</Typography>
      {view.description != null && (
        <Typography fontSize={12.5} color="text.secondary">
          {view.description}
        </Typography>
      )}
      {provider != null && (
        <Typography fontSize={11.5} color="text.secondary">
          {provider} 제공
        </Typography>
      )}
    </Stack>
  )
}

function TransportRealtimeInfoSkeleton() {
  return (
    <Stack gap={0.75} p={2} borderRadius={4} bgcolor="#f1f3f5">
      <Skeleton width={72} height={16} />
      <Skeleton width="58%" height={18} />
    </Stack>
  )
}
