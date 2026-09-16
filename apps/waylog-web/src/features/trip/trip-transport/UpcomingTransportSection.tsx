import { Button, Stack, Typography, type StackProps } from '@mui/material'
import {
  splitByDeparture,
  useTripTransport,
  type TripTransport,
} from '@waylog/domains/modules/trip-transport'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { TransportCard } from './TransportCard'
import { useTicketViewerOverlay } from './useTicketViewerOverlay'

interface Props extends StackProps {
  tripId: string
}

// 다가오는 교통편만 보딩패스 형태로 보여준다. 다음 카드가 옆에 걸쳐 보이게 해
// 더 있다는 것을 도트 없이 알린다.
export function UpcomingTransportSection({ tripId, sx, ...props }: Props) {
  const { data: transports } = useTripTransport(tripId)
  const { upcoming } = useMemo(() => splitByDeparture(transports, new Date()), [transports])

  if (upcoming.length === 0) return null

  return (
    <Stack gap={1} {...props}>
      <Typography variant="subtitle2" color="text.secondary">
        다가오는 교통편
      </Typography>
      <Stack
        direction="row"
        spacing={1.5}
        sx={[
          {
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            pb: 0.5,
            '::-webkit-scrollbar': { display: 'none' },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {upcoming.map((transport) => (
          <BoardingPassCard key={transport.id} tripId={tripId} transport={transport} />
        ))}
      </Stack>
    </Stack>
  )
}

function BoardingPassCard({ tripId, transport }: { tripId: string; transport: TripTransport }) {
  const navigate = useNavigate()
  const ticketViewer = useTicketViewerOverlay()

  // 티켓 이미지는 카드에 넣지 않는다. 카드가 티켓 자체로 보이면
  // 실제 티켓을 여는 동작과 구분되지 않는다.
  const firstTicketImages = transport.tickets.find((ticket) => ticket.images.length > 0)?.images

  return (
    <Stack sx={{ width: '82%', flexShrink: 0, scrollSnapAlign: 'start' }} gap={1}>
      <TransportCard
        transport={transport}
        onClick={() => navigate(`/trip/${tripId}/transport/${transport.id}`)}
      />

      {firstTicketImages != null && (
        <Button
          variant="outlined"
          size="small"
          sx={{ height: 36 }}
          onClick={() => ticketViewer.open(firstTicketImages)}
        >
          탑승권 보기
        </Button>
      )}
    </Stack>
  )
}
