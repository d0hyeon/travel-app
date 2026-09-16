import { Skeleton, Stack, Typography } from '@mui/material'
import { useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
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
    <Stack
      gap={0.75}
      p={2}
      borderRadius={4}
      bgcolor="#fff3e0"
      aria-label={`${transport.type} 실시간 정보`}
    >
      <Typography fontSize={13} fontWeight={700} color="#d55a00">
        실시간 정보
      </Typography>
      <Typography fontSize={14}>15분 지연 · 예상 출발 09:25</Typography>
    </Stack>
  )
}

function TransportRealtimeInfoSkeleton() {
  return (
    <Stack gap={0.75} p={2} borderRadius={4} bgcolor="#fff3e0">
      <Skeleton width={72} height={16} />
      <Skeleton width="58%" height={18} />
    </Stack>
  )
}
