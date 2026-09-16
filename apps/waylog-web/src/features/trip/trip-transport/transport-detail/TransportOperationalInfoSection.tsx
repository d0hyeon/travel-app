import { Skeleton, Stack, Typography } from '@mui/material'
import { useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
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
    <Stack direction="row" gap={1.25} my={1} aria-label={`${transport.type} 운행 정보`}>
      {INFORMATION_CARDS.map(([label, value]) => (
        <Stack
          key={label}
          flex={1}
          alignItems="center"
          gap={0.75}
          py={1.75}
          borderRadius={3}
          bgcolor="rgba(0,0,0,0.04)"
        >
          <Typography fontSize={12} color="text.secondary">
            {label}
          </Typography>
          <Typography fontSize={16} fontWeight={700}>
            {value}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}

function TransportOperationalInfoSkeleton() {
  return (
    <Stack direction="row" gap={1.25} my={1}>
      {INFORMATION_CARDS.map(([label]) => (
        <Stack
          key={label}
          flex={1}
          alignItems="center"
          gap={0.75}
          py={1.75}
          borderRadius={3}
          bgcolor="rgba(0,0,0,0.04)"
        >
          <Skeleton width={36} height={14} />
          <Skeleton width={28} height={20} />
        </Stack>
      ))}
    </Stack>
  )
}
