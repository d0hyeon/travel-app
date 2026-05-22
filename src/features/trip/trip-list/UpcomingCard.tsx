import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, ButtonBase, Chip, Stack, Typography } from '@mui/material'
import { Link, PrefetchPageLinks } from 'react-router'
import type { Trip } from '../trip.types'
import {
  formatTripDate,
  getDaysUntil,
  getTripDuration,
  upcomingCardBg,
  upcomingCardBorderColor,
  upcomingCardBorderStyle,
} from './trip-list.utils'

interface Props {
  trip: Trip
}

export function UpcomingCard({ trip }: Props) {
  const daysUntil = getDaysUntil(trip.startDate)
  const { nights, days } = getTripDuration(trip.startDate, trip.endDate)
  const cardBg = upcomingCardBg(daysUntil)
  const cardBorderColor = upcomingCardBorderColor(daysUntil)
  const cardBorderStyle = upcomingCardBorderStyle(daysUntil)
  const dDayLabel = daysUntil === 0 ? 'D-Day' : `D-${daysUntil}`

  return (
    <Link
      to={`/trip/${trip.id}`}
      style={{ textDecoration: 'none' }}
      aria-label={`예정된 여행: ${trip.name}, ${dDayLabel}`}
      viewTransition
    >
      <PrefetchPageLinks page={`/trip/${trip.id}`} />
      <ButtonBase
        component="div"
        sx={{ width: '100%', borderRadius: '16px', display: 'block', textAlign: 'left' }}
      >
        <Box
          sx={{
            bgcolor: cardBg,
            border: `1.5px ${cardBorderStyle}`,
            borderColor: cardBorderColor,
            borderRadius: '16px',
            p: '14px 16px',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.75}>
            <Box flex={1} pr={1}>
              {trip.destinations.length === 1 ? (
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <DestinationChip label={trip.destinations[0]} />
                  <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
                    {trip.name}
                  </Typography>
                </Stack>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, mb: 0.5 }}>
                    {trip.name}
                  </Typography>
                  {trip.destinations.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {trip.destinations.map((dest) => (
                        <DestinationChip key={dest} label={dest} />
                      ))}
                    </Stack>
                  )}
                </>
              )}
            </Box>
            <DDayPill label={dDayLabel} />
          </Stack>

          <Typography color="textSecondary" sx={{ fontSize: 13, fontWeight: 500 }}>
            {formatTripDate(trip.startDate)} ~ {formatTripDate(trip.endDate)}
            {nights > 0 && `  ·  ${nights}박 ${days}일`}
          </Typography>
        </Box>
      </ButtonBase>
    </Link>
  )
}

function DestinationChip({ label }: { label: string }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 20,
        fontSize: 11,
        fontWeight: 600,
        bgcolor: 'rgba(76,132,255,0.08)',
        color: '#4C84FF',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}

function DDayPill({ label }: { label: string }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        px: 1,
        py: 0.25,
        borderRadius: 999,
        bgcolor: '#FFF4E6',
        color: '#C5631A',
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
  )
}
