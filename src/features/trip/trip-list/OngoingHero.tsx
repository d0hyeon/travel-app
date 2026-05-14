import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, ButtonBase, LinearProgress, Stack, Typography } from '@mui/material'
import { Link, PrefetchPageLinks } from 'react-router'
import type { Trip } from '../trip.types'
import { formatTripDate, getTripDuration, getTripProgress } from './trip-list.utils'

interface Props {
  trip: Trip
}

export function OngoingHero({ trip }: Props) {
  const progress = getTripProgress(trip.startDate, trip.endDate)
  const { nights, days } = getTripDuration(trip.startDate, trip.endDate)

  return (
    <Link to={`/trip/${trip.id}`} style={{ textDecoration: 'none' }} aria-label={`진행 중인 여행: ${trip.name}`}>
      <PrefetchPageLinks page={`/trip/${trip.id}`} />
      <ButtonBase
        component="div"
        sx={{ width: '100%', borderRadius: '20px', display: 'block', textAlign: 'left' }}
      >
        <Box
          sx={{
            background: 'linear-gradient(155deg, #5E94FF 0%, #3A75F0 100%)',
            borderRadius: '20px',
            p: '20px 20px 18px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            {trip.destinations.length === 1 ? (
              <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                <DestinationBadge label={trip.destinations[0]} />
                <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25, color: '#fff' }}>
                  {trip.name}
                </Typography>
              </Stack>
            ) : (
              <Box mb={0.5}>
                <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25, color: '#fff', mb: 0.5 }}>
                  {trip.name}
                </Typography>
                {trip.destinations.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {trip.destinations.map((dest) => (
                      <DestinationBadge key={dest} label={dest} />
                    ))}
                  </Stack>
                )}
              </Box>
            )}
            <ChevronRightIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', mt: 0.25 }} />
          </Stack>

          <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500, mb: 1.25 }}>
            {formatTripDate(trip.startDate)} ~ {formatTripDate(trip.endDate)}
            {nights > 0 && `  ·  ${nights}박 ${days}일`}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              marginTop: 2,
              height: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.25)',
              '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 2 },
            }}
          />
          <Stack direction="row" justifyContent="space-between" mt={0.5}>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
              {formatTripDate(trip.startDate)}
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
              {Math.round(progress)}%
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
              {formatTripDate(trip.endDate)}
            </Typography>
          </Stack>
        </Box>
      </ButtonBase>
    </Link>
  )
}

function DestinationBadge({ label }: { label: string }) {
  return (
    <Box
      sx={{
        px: 0.75,
        py: 0.125,
        borderRadius: 999,
        bgcolor: 'rgba(255,255,255,0.2)',
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
  )
}
