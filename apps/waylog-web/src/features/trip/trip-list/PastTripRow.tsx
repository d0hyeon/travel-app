import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { alpha, Box, ButtonBase, Chip, Stack, Typography, useTheme } from '@mui/material'
import { Suspense } from 'react'
import { Link, PrefetchPageLinks } from 'react-router'
import { TripUnreadCountBadge } from '../trip-chat/TripUnreadCountBadge'
import type { Trip } from '@waylog/domains/modules/trip'
import { formatTripDate, getTripDuration } from '@waylog/domains/modules/trip'

interface Props {
  trip: Trip
}

export function PastTripRow({ trip }: Props) {
  const { nights, days } = getTripDuration(trip.startDate, trip.endDate)
  const theme = useTheme();

  return (
    <Link
      to={`/trip/${trip.id}`}
      style={{ textDecoration: 'none' }}
      aria-label={`지난 여행: ${trip.name}`}
      viewTransition
    >
      <PrefetchPageLinks page={`/trip/${trip.id}`} />
      <ButtonBase
        component="div"
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 0.5,
          '&:hover': { bgcolor: 'action.hover' },
          borderRadius: '16px',
          p: '14px 16px',
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          position: 'relative',
        }}
      >
        <Suspense fallback={null}>
          <TripUnreadCountBadge
            tripId={trip.id}
            variant="fill"
            position="absolute" right={0.5} top={-1.5}
            sx={{ transform: 'translate(-50%, -50%)' }}
          />
        </Suspense>
        <Box flex={1} pr={1}>
          {trip.destinations.length === 1 ? (
            <Stack direction="row" alignItems="center" gap={0.75}>
              <DestinationChip label={trip.destinations[0]} />
              <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
                {trip.name}
              </Typography>
            </Stack>
          ) : (
            <>
              <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
                {trip.name}
              </Typography>
              {trip.destinations.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                  {trip.destinations.map((dest) => (
                    <DestinationChip key={dest} label={dest} />
                  ))}
                </Stack>
              )}
            </>
          )}
          <Stack direction="row" alignItems="center" gap={0.75} mt={1}>
            <Typography color="textSecondary" sx={{ fontSize: 12, fontWeight: 500 }}>
              {formatTripDate(trip.startDate)} ~ {formatTripDate(trip.endDate)}
            </Typography>
            {nights > 0 && (
              <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                {nights}박 {days}일
              </Typography>
            )}
          </Stack>
        </Box>
        <ChevronRightIcon sx={{ fontSize: 20, color: 'text.disabled', flexShrink: 0 }} />
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
        height: 18,
        fontSize: 11,
        fontWeight: 600,
        bgcolor: 'action.hover',
        color: 'text.secondary',
        '& .MuiChip-label': { px: 0.875 },
      }}
    />
  )
}
