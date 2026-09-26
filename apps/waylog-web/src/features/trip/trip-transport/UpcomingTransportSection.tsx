import { Button, Stack, Typography, type StackProps } from '@mui/material'
import {
  splitByDeparture,
  useTripScheduledFlights,
  type TripTransport,
} from '@waylog/domains/modules/trip-transport'
import {
  useAirportArrivalGuidances,
  type AirportArrivalGuidance,
} from '@waylog/domains/modules/airport-arrival-guidance'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { TransportCard } from './TransportCard'
import { useTicketViewerOverlay } from './transport-ticket/useTicketViewerOverlay'

interface Props extends StackProps {
  tripId: string
}

// 다가오는 교통편만 보딩패스 형태로 보여준다. 다음 카드가 옆에 걸쳐 보이게 해
// 더 있다는 것을 도트 없이 알린다.
export function UpcomingTransportSection({ tripId, sx, ...props }: Props) {
  const { data: transports } = useTripScheduledFlights(tripId)
  const { upcoming } = useMemo(() => splitByDeparture(transports, new Date()), [transports])
  const airportArrivalGuidances = useAirportArrivalGuidances({
    tripId,
    transportIds: upcoming.map((transport) => transport.id),
  })

  if (upcoming.length === 0) return null

  return (
    <Stack gap={1} {...props}>
      <Typography variant="subtitle2" color="text.secondary">
        다가오는 탑승권
      </Typography>
      <Stack
        direction="row"
        spacing={1.5}
        sx={[
          upcoming.length > 1 && {
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            pb: 0.5,
            '::-webkit-scrollbar': { display: 'none' },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {upcoming.map((transport) => (
          <BoardingPassCard
            key={transport.id}
            tripId={tripId}
            transport={transport}
            airportArrivalGuidance={airportArrivalGuidances.find((item) => item.transportId === transport.id)?.guidance}
            isSingleCard={upcoming.length === 1}
          />
        ))}
      </Stack>
    </Stack>
  )
}

function BoardingPassCard({
  tripId,
  transport,
  airportArrivalGuidance,
  isSingleCard,
}: {
  tripId: string
  transport: TripTransport
  airportArrivalGuidance?: AirportArrivalGuidance
  isSingleCard: boolean
}) {
  const navigate = useNavigate()
  const ticketViewer = useTicketViewerOverlay()

  // 티켓 이미지는 카드에 넣지 않는다. 카드가 티켓 자체로 보이면
  // 실제 티켓을 여는 동작과 구분되지 않는다.
  const [firstTicket] = transport.tickets

  return (
    <Stack sx={{ width: isSingleCard ? '100%' : '82%', flexShrink: 0, scrollSnapAlign: 'start' }} gap={1}>
      <TransportCard
        transport={transport}
        airportArrivalGuidance={airportArrivalGuidance}
        onClick={() => navigate(`/trip/${tripId}/transport/${transport.id}`)}
      />

      {firstTicket != null && (
        <Stack px={1}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => ticketViewer.open({ tripId, ticketId: firstTicket.id })}
          >
            탑승권 열기
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
