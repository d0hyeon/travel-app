import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Avatar, Button, Skeleton, Stack, Typography } from '@mui/material'
import {
  useTripTransportDetail,
  type TripTransportTicket,
} from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { useTicketViewerOverlay } from '../useTicketViewerOverlay'
import { TransportDetailSectionError } from './TransportDetailSectionError'

interface Props {
  tripId: string
  transportId: string
}

export function TransportTicketsSection({ tripId, transportId }: Props) {
  return (
    <AsyncBoundary
      resetKeys={[tripId, transportId]}
      pendingFallback={<TransportTicketsSkeleton />}
      rejectedFallback={({ error, resetError }) => (
        <TransportDetailSectionError message={error.message} onRetry={resetError} />
      )}
    >
      <Resolved tripId={tripId} transportId={transportId} />
    </AsyncBoundary>
  )
}

function Resolved({ tripId, transportId }: Props) {
  const { primaryTicket, companionTickets } = useTripTransportDetail({ tripId, transportId })
  const ticketViewer = useTicketViewerOverlay()

  const openTicket = (ticket: TripTransportTicket) => {
    if (ticket.images.length === 0) return
    ticketViewer.open(ticket.images)
  }

  return (
    <Stack gap={1} mt={0.75}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography fontSize={16} fontWeight={700}>
          티켓
        </Typography>
        <Typography fontSize={14} fontWeight={700} color="primary.main">
          추가
        </Typography>
      </Stack>

      {primaryTicket != null && (
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => openTicket(primaryTicket)}
        >
          내 티켓 보기
        </Button>
      )}

      {companionTickets.map(({ ticket, owner }) => (
        <Stack
          key={ticket.id}
          direction="row"
          alignItems="center"
          gap={1.5}
          py={1.5}
          onClick={() => openTicket(ticket)}
          sx={{ cursor: 'pointer' }}
        >
          <Avatar
            src={owner.profileUrl ?? undefined}
            sx={{ width: 26, height: 26, fontSize: 12, fontWeight: 700, bgcolor: '#71bbc2' }}
          >
            {owner.name.slice(0, 1)}
          </Avatar>
          <Typography flex={1} fontSize={14}>
            {owner.name}
          </Typography>
          <ChevronRightIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
        </Stack>
      ))}
    </Stack>
  )
}

function TransportTicketsSkeleton() {
  return (
    <Stack gap={1} mt={0.75}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Skeleton width={36} height={20} />
        <Skeleton width={28} height={18} />
      </Stack>
      <Skeleton variant="rounded" width="100%" height={56} />
      <Stack direction="row" alignItems="center" gap={1.5} py={1.5}>
        <Skeleton variant="circular" width={26} height={26} />
        <Skeleton width={72} height={18} />
      </Stack>
    </Stack>
  )
}
