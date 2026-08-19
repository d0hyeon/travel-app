import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, ButtonBase, LinearProgress, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { Link, PrefetchPageLinks } from 'react-router'
import { TripUnreadCountBadge } from '../trip-chat/TripUnreadCountBadge'
import type { Trip } from '@waylog/domains/trip'
import { formatTripDate, getTripDuration, getTripProgress } from './trip-list.utils'
import { differenceInDays, startOfToday, set } from 'date-fns'

interface Props {
  trip: Trip
}


export function OngoingHero({ trip }: Props) {
  const progress = getTripProgress(trip.startDate, trip.endDate)
  const { nights, days } = getTripDuration(trip.startDate, trip.endDate)
  const currDays = differenceInDays(startOfToday(), resetTime(trip.startDate));

  return (
    <Link to={`/trip/${trip.id}`} style={{ textDecoration: 'none' }} aria-label={`진행 중인 여행: ${trip.name}`} viewTransition>
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
          }}
        >
          <Suspense fallback={null}>
            <TripUnreadCountBadge
              tripId={trip.id}
              variant="outline"
              position="absolute" right="-20px" top="0"
              sx={{ transform: 'translate(-50%, -50%)' }}
            />
          </Suspense>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="body2">{currDays + 1}일차</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25, color: '#fff' }}>
                {trip.name}
              </Typography>
            </Stack>
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


function resetTime(value: Date | string) {
  return set(value, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
}