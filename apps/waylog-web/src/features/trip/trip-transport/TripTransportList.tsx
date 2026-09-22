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
import { formatDate } from 'date-fns'
import { useMemo } from 'react'
import { TransportCard } from './TransportCard'

interface Props extends StackProps {
  tripId: string
  onTransportClick?: (transportId: string) => void
}

export function TripTransportList({ tripId, onTransportClick, ...props }: Props) {
  const { data: transports } = useTripScheduledFlights(tripId)

  // 렌더마다 기준 시각이 달라지면 목록이 흔들린다. 조회 결과가 바뀔 때만 다시 가른다.
  const { past, upcoming } = useMemo(() => splitByDeparture(transports, new Date()), [transports])
  const upcomingGroups = useMemo(() => groupByDepartureDate(upcoming), [upcoming])

  if (transports.length === 0) {
    return (
      <Stack alignItems="center" py={6} {...props}>
        <Typography variant="body2" color="text.secondary">
          등록된 교통편이 없어요
        </Typography>
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
