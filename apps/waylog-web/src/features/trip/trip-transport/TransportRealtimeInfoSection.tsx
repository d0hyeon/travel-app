import { Skeleton, Stack, Typography } from '@mui/material'
import {
  toFlightStatusView,
  useFlightGateChange,
  useFlightStatus,
  type FlightStatusTone,
} from '@waylog/domains/modules/flight-status'
import { useTripTransportTickets } from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { TransportDetailSectionError } from './transport-detail/TransportDetailSectionError'

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
  const {
    data: { transport },
  } = useTripTransportTickets({ tripId, transportId })
  const { status, isSupported } = useFlightStatus({
    airlineCode: transport.type === 'flight' ? transport.airlineCode : undefined,
    flightNumber: transport.type === 'flight' ? transport.flightNumber : undefined,
    departureAirportCode: transport.departureAirportCode,
    arrivalAirportCode: transport.arrivalAirportCode,
    departureAt: transport.departureAt,
  })

  const gateChange = useFlightGateChange(transport.type === 'flight' ? transportId : undefined)

  // 코드 없이 등록된 교통편과 인천을 지나지 않는 노선은 조회할 곳이 없다.
  // 빈 카드를 남기면 데이터를 기다리는 것처럼 보인다.
  if (!isSupported) return null

  const view = toFlightStatusView(status, gateChange)
  if (view == null) return null

  const color = TONE_COLOR[view.tone]

  return (
    <Stack
      gap={0.75}
      p={2}
      borderRadius={3}
      bgcolor={color.bg}
      aria-label={`${transport.type} 실시간 정보`}
    >
      <Typography fontSize={13} fontWeight={700} color={color.fg}>
        {view.title}
      </Typography>
      <Typography fontSize={13} color="text.primary" lineHeight={1.5}>
        {view.timeChange != null && (
          <>
            출발 시간이{' '}
            <Typography component="span" fontSize="inherit" color="text.disabled" sx={{ textDecoration: 'line-through' }}>
              {view.timeChange.fromClock}
            </Typography>{' '}
            →{' '}
            <Typography component="span" fontSize="inherit" fontWeight={700} color={color.fg}>
              {view.timeChange.toClock}
            </Typography>
            로 변경됐어요.
          </>
        )}
        {view.gateChange != null && (
          <>
            탑승구가{' '}
            <Typography component="span" fontSize="inherit" color="text.disabled" sx={{ textDecoration: 'line-through' }}>
              {view.gateChange.fromGate}
            </Typography>{' '}
            →{' '}
            <Typography component="span" fontSize="inherit" fontWeight={700} color={color.fg}>
              {view.gateChange.toGate}
            </Typography>
            (으)로 변경됐어요.
          </>
        )}
        {view.description}
      </Typography>
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
