import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Box,
  Skeleton,
  Stack,
  Typography,
  type StackProps,
} from '@mui/material'
import {
  groupByDepartureDate,
  splitByDeparture,
  useTripScheduledFlights,
} from '@waylog/domains/modules/trip-transport'
import { useAirportArrivalGuidances } from '@waylog/domains/modules/airport-arrival-guidance'
import { getSupportedFlightStatusAirportCodes } from '@waylog/domains/modules/flight-status'
import { findAirport } from '@waylog/domains/modules/airport'
import { formatDate } from 'date-fns'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { TransportCard } from './TransportCard'

interface Props extends StackProps {
  tripId: string
  onTransportClick?: (transportId: string) => void
}

export function TripTransportList({ tripId, onTransportClick, ...props }: Props) {
  const { data: transports } = useTripScheduledFlights(tripId)
  const airportArrivalGuidances = useAirportArrivalGuidances({
    tripId,
    transportIds: transports.map((transport) => transport.id),
  })
  const navigate = useNavigate()

  // 렌더마다 기준 시각이 달라지면 목록이 흔들린다. 조회 결과가 바뀔 때만 다시 가른다.
  const { past, upcoming } = useMemo(() => splitByDeparture(transports, new Date()), [transports])
  const upcomingGroups = useMemo(() => groupByDepartureDate(upcoming), [upcoming])
  const supportedAirportNames = getSupportedFlightStatusAirportCodes()
    .map((airportCode) => findAirport(airportCode)?.nameKo)
    .filter((airportName): airportName is string => airportName != null)

  if (transports.length === 0) {
    return (
      <Stack alignItems="center" p={3} gap={1.5} border="1px solid" borderColor="divider" borderRadius={3} bgcolor="rgba(76, 132, 255, 0.08)" {...props}>
        <Box display="flex" alignItems="center" justifyContent="center" width={56} height={56} borderRadius="50%" bgcolor="background.paper">
          <FlightTakeoffIcon color="primary" />
        </Box>
        <Typography variant="subtitle1" fontWeight={700}>
          탑승권을 등록해보세요
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" lineHeight={1.6}>
          탑승 전, 여정 변동(지연, 결항, 탑승구 변경)등{`\n`}중요한 상황을 놓치지 않도록 알려드려요
        </Typography>
        <Stack direction="row" alignItems="center" gap={0.75} px={1.5} py={0.75} borderRadius={3} bgcolor="background.paper">
          <NotificationsNoneIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            * 여정 변동 알림은 {supportedAirportNames} 출발 항공편에 한해 지원돼요.
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<FlightTakeoffIcon />} onClick={() => navigate(`/trip/${tripId}/transport/new`)}>
          탑승권 등록
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap={2} {...props}>
      {past.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              지난 탑승권 ({past.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack gap={1}>
              {past.map((transport) => (
                <TransportCard
                  key={transport.id}
                  transport={transport}
                  airportArrivalGuidance={airportArrivalGuidances.find((item) => item.transportId === transport.id)?.guidance}
                  onClick={() => onTransportClick?.(transport.id)}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {upcomingGroups.map((group) => (
        <Stack key={group.date} gap={1}>
          <Typography variant="caption" fontWeight={700} color="text.disabled">
            {formatDate(new Date(group.date), 'M/d')}
          </Typography>
          {group.transports.map((transport) => (
            <TransportCard
              key={transport.id}
              transport={transport}
              airportArrivalGuidance={airportArrivalGuidances.find((item) => item.transportId === transport.id)?.guidance}
              onClick={() => onTransportClick?.(transport.id)}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  )
}

TripTransportList.Skeleton = function TripTransportListSkeleton(props: StackProps) {
  return (
    <Stack gap={2} {...props}>
      <Stack gap={1}>
        <Skeleton variant="text" width={32} height={20} />
        <TransportCardSkeleton />
        <TransportCardSkeleton />
      </Stack>
    </Stack>
  )
}

function TransportCardSkeleton() {
  return (
    <Box sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" gap={0.5} mb={1}>
        <Skeleton variant="circular" width={14} height={14} />
        <Skeleton variant="text" width={48} height={20} />
      </Stack>

      <Skeleton variant="text" width={64} height={20} />

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mt={1}>
        <Stack gap={0.5}>
          <Skeleton variant="text" width={56} height={28} />
          <Skeleton variant="text" width={72} height={16} />
        </Stack>

        <Box flex={1} mx={1} mt="14px" borderTop="1px dashed" borderColor="divider" />

        <Stack alignItems="end" gap={0.5}>
          <Skeleton variant="text" width={56} height={28} />
          <Skeleton variant="text" width={72} height={16} />
        </Stack>
      </Stack>

      <Skeleton variant="text" width={96} height={16} sx={{ mt: 1.25 }} />
    </Box>
  )
}
