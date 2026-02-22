import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RouteIcon from '@mui/icons-material/Route';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  CircularProgress,
  IconButton,
  Typography
} from '@mui/material';
import { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryParamState } from '../../shared/hooks/useQueryParamState';
import { TripPlaceContent } from './trip-place/TripPlaceContent.mobile';
import { TripRoutesContent } from './trip-route/TripRoutesContent.mobile';
import { useTrip } from './useTrip';
import { useTripId } from './useTripId';

type TabType = 'Place' | 'Route'

export function TripDetailPageMobile() {
  const tripId = useTripId()
  const { data: trip } = useTrip(tripId)
  const navigate = useNavigate()

  const [currentTab, setCurrentTab] = useQueryParamState<TabType>('content', {
    defaultValue: 'Place'
  })

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => navigate('/')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle1" fontWeight="medium" noWrap>
              {trip.name}
            </Typography>

          </Box>
        </Box>

      </Box>

      {/* Content */}
      <Suspense fallback={<Box flex={1} display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>}>
        {currentTab === 'Place' && <TripPlaceContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />}
        {currentTab === 'Route' && <TripRoutesContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />}
      </Suspense>
      <BottomNavigation
        showLabels
        value={currentTab}
        onChange={(_event, newValue) => {
          setCurrentTab(newValue);
        }}
      >
        <BottomNavigationAction
          label="모든 장소"
          value="Place"
          icon={<LocationOnIcon />}

        />
        <BottomNavigationAction label="경로 설정" value="Route" icon={<RouteIcon />} />
      </BottomNavigation>
    </Box>
  )
}