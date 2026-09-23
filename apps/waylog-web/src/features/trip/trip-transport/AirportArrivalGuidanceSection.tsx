import { Skeleton, Stack, Typography } from '@mui/material'
import { useAirportArrivalGuidance } from '@waylog/domains/modules/airport-arrival-guidance'
import { useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { format } from 'date-fns'
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
  const { transport } = useTripTransportDetail({ tripId, transportId })

  if (guidance == null) return null

  const carrierLabel = toCarrierLabel(transport)

  return (
    <Stack gap={0.5} p={2} borderRadius={4} bgcolor="primary.50">
      <Typography fontSize={13} fontWeight={700} color="primary.main">
        공항 도착 안내
      </Typography>
      <Typography fontSize={15} fontWeight={700}>
        {format(new Date(guidance.recommendedArrivalAt), 'HH:mm')}까지 공항 도착을 권장해요
      </Typography>
      <Typography fontSize={12} color="text.secondary">
        {[carrierLabel, `${guidance.terminal} 터미널`, `${format(new Date(guidance.appliedDepartureAt), 'M/d HH:mm')} 출발`]
          .filter((value): value is string => value != null)
          .join(' · ')}
      </Typography>
      <Typography fontSize={12} color="text.secondary">
        기본 여유 {guidance.baseBufferMinutes}분 + {guidance.congestionTier} 혼잡 보정 {guidance.congestionBufferMinutes}분
      </Typography>
      <Typography fontSize={11.5} color="text.secondary">
        {guidance.sourceKind === 'forecast' ? '예고 혼잡도' : '공항 혼잡도'} · {format(new Date(guidance.observedAt), 'M/d HH:mm')} 기준
      </Typography>
      {guidance.recommendedDepartureGate != null && (
        <Typography fontSize={12} color="text.secondary">
          현재 {guidance.recommendedDepartureGate.gate} 출국장이 가장 여유로워요 · {format(new Date(guidance.recommendedDepartureGate.observedAt), 'HH:mm')} 기준
        </Typography>
      )}
    </Stack>
  )
}

function AirportArrivalGuidanceSkeleton() {
  return (
    <Stack gap={0.5} p={2} borderRadius={4} bgcolor="primary.50">
      <Skeleton width={88} height={16} />
      <Skeleton width="62%" height={22} />
      <Skeleton width="78%" height={16} />
    </Stack>
  )
}
