import { Box, Skeleton, Stack, Typography } from '@mui/material'
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
    <Stack gap={1.5} p={2} borderRadius={4} bgcolor="#F6F8FF" border="1px solid #EEF3FF">
      <Typography fontSize={12} fontWeight={700} color="primary.main">
        공항 도착 안내
      </Typography>
      <Stack gap={0.5}>
        <Typography fontSize={17} fontWeight={700} letterSpacing={-0.3} lineHeight={1.35}>
          <Typography component="span" fontSize="inherit" fontWeight="inherit" color="primary.main">
            {format(new Date(guidance.recommendedArrivalAt), 'HH:mm')}
          </Typography>
          까지 공항 도착을 권장해요
        </Typography>
        <Typography fontSize={12.5} color="text.secondary">
          {[carrierLabel, toGuidanceTerminalLabel(guidance), `${format(new Date(guidance.appliedDepartureAt), 'M/d HH:mm')} 출발`]
            .filter((value): value is string => value != null)
            .join(' · ')}
        </Typography>
      </Stack>
      <AsyncBoundary
        resetKeys={[guidance.recommendedArrivalAt]}
        pendingFallback={<Skeleton variant="rounded" height={38} />}
        rejectedFallback={() => <CongestionRow guidance={guidance} />}
      >
        <DepartureGateRecommendationRow guidance={guidance} />
      </AsyncBoundary>
    </Stack>
  )
}

function DepartureGateRecommendationRow({ guidance }: { guidance: AirportArrivalGuidance }) {
  const recommendation = useDepartureGateRecommendation(guidance)

  if (recommendation == null) return <CongestionRow guidance={guidance} />

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      bgcolor="#fff"
      borderRadius={2.5}
      px={1.5}
      py={1.125}
    >
      <Box width={8} height={8} borderRadius="50%" bgcolor="#2DB95F" flexShrink={0} />
      <Typography flex={1} fontSize={12} fontWeight={600}>
        현재 {josa(toDepartureGateLabel(recommendation.gate), '이/가')} 가장 여유로워요
      </Typography>
      <Typography fontSize={11} color="text.disabled">
        {format(new Date(recommendation.observedAt), 'HH:mm')} 기준
      </Typography>
    </Stack>
  )
}

const CONGESTION_TONE: Record<AirportCongestionTier, { label: string; fg: string; bg: string }> = {
  calm: { label: '원활', fg: '#2E8B4A', bg: '#E8F5EC' },
  normal: { label: '보통', fg: '#C5631A', bg: '#FFF4E6' },
  crowded: { label: '혼잡', fg: '#D14343', bg: '#FDECEC' },
  veryCrowded: { label: '매우 혼잡', fg: '#D14343', bg: '#FDECEC' },
}

function CongestionRow({ guidance }: { guidance: AirportArrivalGuidance }) {
  return (
    <Stack direction="row" alignItems="center" gap={0.75} fontSize={11.5} color="text.secondary">
      <Typography fontSize="inherit" color="text.primary">
        공항 예측 혼잡도
      </Typography>
      <CongestionChip tier={guidance.congestionTier} />
      <Typography fontSize="inherit" color="text.secondary">
        · {format(new Date(guidance.observedAt), 'M/d HH:mm')} 기준
      </Typography>
    </Stack>
  )
}

function CongestionChip({ tier }: { tier: AirportCongestionTier }) {
  const tone = CONGESTION_TONE[tier]
  return (
    <Typography
      component="span"
      fontSize={11}
      fontWeight={700}
      color={tone.fg}
      bgcolor={tone.bg}
      px={0.875}
      py={0.25}
      borderRadius={999}
      whiteSpace="nowrap"
      flexShrink={0}
    >
      {tone.label}
    </Typography>
  )
}

function AirportArrivalGuidanceSkeleton() {
  return (
    <Stack gap={1.5} p={2} borderRadius={4} bgcolor="#F6F8FF" border="1px solid #EEF3FF">
      <Skeleton width={88} height={16} />
      <Skeleton width="62%" height={22} />
      <Skeleton width="78%" height={16} />
    </Stack>
  )
}
