import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Avatar, Button, Skeleton, Stack, Typography } from '@mui/material'
import {
  useTripTransportTickets,
  type TripTransportTicket,
} from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { useTicketViewerOverlay } from './useTicketViewerOverlay'
import { useTransportTicketFormOverlay } from './useTransportTicketFormOverlay'
import { useTransportTicketUpload } from './useTransportTicketUpload'
import { TransportDetailSectionError } from '../transport-detail/TransportDetailSectionError'

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
  const {
    data: { transport, primaryTicket, companionTickets },
  } = useTripTransportTickets({ tripId, transportId })
  const ticketViewer = useTicketViewerOverlay()
  const ticketForm = useTransportTicketFormOverlay()
  const { upload } = useTransportTicketUpload(tripId)

  const openTicket = (ticket: TripTransportTicket) => {
    ticketViewer.open({ tripId, ticketId: ticket.id })
  }

  const addTickets = () => {
    ticketForm.open({
      tripId,
      type: transport.type,
      onSubmit: (tickets) => upload({ transportId, tickets }),
    })
  }

  const hasNoTickets = primaryTicket == null && companionTickets.length === 0

  return (
    <Stack gap={1} mt={0.75}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography fontSize={16} fontWeight={700}>
          티켓
        </Typography>
        {!hasNoTickets && <Button variant="text" onClick={addTickets}>추가</Button>}
      </Stack>

      {hasNoTickets && (
        <Button variant="outlined" size="large" fullWidth onClick={addTickets} sx={{ borderStyle: 'dashed' }}>
          탑승권 추가
        </Button>
      )}

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
