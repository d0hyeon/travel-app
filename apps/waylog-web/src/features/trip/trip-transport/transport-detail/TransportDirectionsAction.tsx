import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { Skeleton, Stack, Typography } from '@mui/material'
import { useTripTransportDetail } from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { TransportDetailSectionError } from './TransportDetailSectionError'

const EMPTY_VALUE = '-'

interface Props {
  tripId: string
  transportId: string
}

export function TransportDirectionsAction({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportDirectionsSkeleton />}
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
  const departureName = transport.departureName || EMPTY_VALUE

  return (
    <Stack
      component="a"
      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        departureName,
      )}`}
      target="_blank"
      rel="noreferrer"
      direction="row"
      alignItems="center"
      gap={1.25}
      mt={1.75}
      p={2}
      border="1px solid"
      borderColor="divider"
      borderRadius={3.5}
      sx={{ textDecoration: 'none', color: 'inherit' }}
    >
      <LocationOnIcon sx={{ fontSize: 20 }} />
      <Typography flex={1} fontSize={14} fontWeight={700}>
        출발지 길찾기 · {departureName}
      </Typography>
      <ChevronRightIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
    </Stack>
  )
}

function TransportDirectionsSkeleton() {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.25}
      mt={1.75}
      p={2}
      border="1px solid"
      borderColor="divider"
      borderRadius={3.5}
    >
      <Skeleton variant="circular" width={20} height={20} />
      <Skeleton width="65%" height={18} />
      <Skeleton variant="circular" width={20} height={20} />
    </Stack>
  )
}
