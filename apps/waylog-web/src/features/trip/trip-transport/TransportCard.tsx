import { Box, Stack, Typography } from '@mui/material'
import { TransportTypeLabel } from '@waylog/domains/modules/transport'
import {
  formatArrivalTime,
  formatDepartureTime,
  type ScheduledTripTransport,
} from '@waylog/domains/modules/trip-transport'
import type { AirportArrivalGuidance } from '@waylog/domains/modules/airport-arrival-guidance'
import { format, formatDate, isSameDay } from 'date-fns'
import { TransportTypeIcon } from '~features/transport/TransportTypeIcon'
import { toCarrierLabel } from './transportLabel'

const EMPTY_TIME = '—'

interface Props {
  transport: ScheduledTripTransport
  airportArrivalGuidance?: AirportArrivalGuidance
  onClick?: () => void
}

export function TransportCard({ transport, airportArrivalGuidance, onClick }: Props) {
  const arrivalTime = formatArrivalTime(transport)
  const carrierLabel = toCarrierLabel(transport)

  const isDiffernceArrivalDay =
    transport.arrivalAt != null && !isSameDay(transport.departureAt, transport.arrivalAt)

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Stack direction="row" alignItems="center" gap={0.5} mb={1}>
        <TransportTypeIcon type={transport.type} sx={{ fontSize: 14 }} color="primary" />
        <Typography variant="caption" fontWeight={700}>
          {TransportTypeLabel[transport.type]}
        </Typography>
      </Stack>

      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          {formatDate(new Date(transport.departureAt), 'M월 d일')}
        </Typography>
        {isDiffernceArrivalDay && (
          <Typography variant="caption" color="text.secondary">
            {formatDate(new Date(transport.arrivalAt!), 'M월 d일')}
          </Typography>
        )}
      </Stack>

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mt={1}>
        <Stack>
          <Typography fontSize={22} fontWeight={700}>
            {formatDepartureTime(transport)}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {transport.departureName}
          </Typography>
        </Stack>

        <Box flex={1} mx={1} mt="14px" borderTop="1px dashed" borderColor="divider" />

        <Stack alignItems="end">
          <Typography fontSize={22} fontWeight={700}>
            {arrivalTime ?? EMPTY_TIME}
          </Typography>
          {transport.departureDelayMinutes != null && (
            <Typography variant="caption" color="warning.main">
              도착 지연 가능
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" noWrap>
            {transport.arrivalName}
          </Typography>
        </Stack>
      </Stack>

      {carrierLabel != null && (
        <Typography variant="caption" color="text.secondary" display="block" mt={1.25}>
          {carrierLabel}
        </Typography>
      )}
      {airportArrivalGuidance != null && (
        <Typography variant="caption" color="primary" display="block" mt={1.25}>
          {format(new Date(airportArrivalGuidance.recommendedArrivalAt), 'HH:mm')}까지 공항 도착을 권장해요
        </Typography>
      )}
    </Box>
  )
}
