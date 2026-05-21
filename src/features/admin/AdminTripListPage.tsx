import { Box, Chip, CircularProgress, Divider, Stack, Typography } from '@mui/material'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { Link } from 'react-router'
import { AppRoute } from '~app/routes'
import { getAllTrips, tripKey } from '../trip/trip.api'
import { formatShortDate } from '../../shared/utils/formats'

export default function AdminTripListPage() {
  return (
    <Box p={3} maxWidth={800} mx="auto">
      <Typography variant="h5" fontWeight={900} mb={1}>
        여행 목록
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        여행 상세에서 경로 장소를 직접 수정할 수 있습니다.
      </Typography>
      <Suspense fallback={<CircularProgress />}>
        <TripList />
      </Suspense>
    </Box>
  )
}

function TripList() {
  const { data: trips } = useSuspenseQuery({
    queryKey: [tripKey, 'all'],
    queryFn: getAllTrips,
  })

  if (trips.length === 0) {
    return <Typography color="text.secondary">여행이 없습니다.</Typography>
  }

  return (
    <Stack divider={<Divider />}>
      {trips.map((trip) => (
        <Box
          key={trip.id}
          component={Link}
          to={AppRoute.여행_상세.replace(':tripId', trip.id)}
          sx={{
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            textDecoration: 'none',
            color: 'inherit',
            '&:hover': { bgcolor: 'action.hover' },
            px: 1,
            borderRadius: 1,
            mx: -1,
          }}
        >
          <Box flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
              <Typography variant="body2" fontWeight={700} noWrap>
                {trip.name}
              </Typography>
              {trip.destinations.map((dest) => (
                <Chip key={dest} label={dest} size="small" sx={{ fontSize: 11, height: 20 }} />
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {formatShortDate(trip.startDate)} ~ {formatShortDate(trip.endDate)}
            </Typography>
          </Box>
          <Typography variant="caption" color="primary" sx={{ flexShrink: 0 }}>
            상세 보기 →
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}
