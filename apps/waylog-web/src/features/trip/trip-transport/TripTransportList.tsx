import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import { formatDate } from 'date-fns'
import { useMemo, type ReactNode } from 'react'
import { TransportCard } from './TransportCard'
import { generatePath, useNavigate } from 'react-router'
import { AppRoute } from '@waylog/routes'

interface Props extends StackProps {
  tripId: string
  emptyFallback?: ReactNode
}

export function TripTransportList({ tripId, emptyFallback, ...props }: Props) {
  const { data: transports } = useTripScheduledFlights(tripId)
  const airportArrivalGuidances = useAirportArrivalGuidances({
    tripId,
    transportIds: transports.map((transport) => transport.id),
  })

  // 렌더마다 기준 시각이 달라지면 목록이 흔들린다. 조회 결과가 바뀔 때만 다시 가른다.
  const { past, upcoming } = useMemo(() => splitByDeparture(transports, new Date()), [transports])
  const upcomingGroups = useMemo(() => groupByDepartureDate(upcoming), [upcoming])
  const navigate = useNavigate()

  if (transports.length === 0) return emptyFallback;

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
                  onClick={() => navigate(generatePath(AppRoute.여행_교통편_상세, { tripId, transportId: transport.id }))}
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
              onClick={() => navigate(generatePath(AppRoute.여행_교통편_상세, { tripId, transportId: transport.id }))}
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
