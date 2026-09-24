import { Box, Chip, Skeleton, Stack, Typography } from '@mui/material'
import { TransportTypeLabel } from '@waylog/domains/modules/transport'
import {
  formatArrivalTime,
  formatDepartureTime,
  useTripTransportTickets,
  useTripScheduledFlights,
} from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { format } from 'date-fns'
import { TransportTypeIcon } from '~features/transport/TransportTypeIcon'
import { toCarrierLabel } from './transportLabel'
import { TransportDetailSectionError } from './transport-detail/TransportDetailSectionError'

const EMPTY_VALUE = '-'

interface Props {
  tripId: string
  transportId: string
}

export function TransportSummarySection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportSummarySkeleton />}
      rejectedFallback={({ error, resetError }) => (
        <TransportDetailSectionError message={error.message} onRetry={resetError} />
      )}
    >
      <Resolved tripId={tripId} transportId={transportId} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const {
    data: { transport: detailTransport },
  } = useTripTransportTickets({ tripId, transportId })
  const { data: transports } = useTripScheduledFlights(tripId)
  const transport = transports.find(({ id }) => id === detailTransport.id) ?? detailTransport

  const carrierLabel = toCarrierLabel(transport) ?? EMPTY_VALUE

  return (
    <Stack gap={1}>
      <Chip
        size="small"
        icon={<TransportTypeIcon type={transport.type} sx={{ fontSize: 15 }} />}
        label={TransportTypeLabel[transport.type]}
        sx={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 700 }}
      />

      <Stack direction="row" alignItems="center" gap={1.5} mt={1}>
        <Typography fontSize={30} lineHeight="38px" fontWeight={700}>
          {formatDepartureTime(transport) || EMPTY_VALUE}
        </Typography>
        <Typography fontSize={22} lineHeight="38px" color="text.secondary">
          →
        </Typography>
        <Typography fontSize={30} lineHeight="38px" fontWeight={700}>
          {formatArrivalTime(transport) ?? EMPTY_VALUE}
        </Typography>
      </Stack>

      <Typography fontSize={15} color="text.secondary">
        {transport.departureName || EMPTY_VALUE} → {transport.arrivalName || EMPTY_VALUE}
      </Typography>

      <Typography fontSize={13} color="text.secondary" mb={1.25}>
        {carrierLabel} · {format(new Date(transport.departureAt), 'M월 d일')}
      </Typography>
    </Stack>
  )
}

function TransportSummarySkeleton() {
  return (
    <Stack gap={1}>
      <Skeleton variant="rounded" width={64} height={28} />
      <Stack direction="row" alignItems="center" gap={1.5} mt={1}>
        <Skeleton width={72} height={38} />
        <Skeleton width={20} height={28} />
        <Skeleton width={72} height={38} />
      </Stack>
      <Skeleton width="72%" height={18} />
      <Box mb={1.25}>
        <Skeleton width="48%" height={16} />
      </Box>
    </Stack>
  )
}
