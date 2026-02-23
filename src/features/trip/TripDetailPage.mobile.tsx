import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NearMeIcon from '@mui/icons-material/NearMe';
import PinDropIcon from '@mui/icons-material/PinDrop';
import {
  Box,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
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
  const [cluastering, setCluastering] = useQueryParamState('cluaster', {
    defaultValue: false,
    parse: value => value === 'true'
  })

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
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
        <Stack direction="row" alignItems="center">
          <FormControlLabel
            control={<Switch size="small" checked={cluastering} onChange={() => setCluastering(!cluastering)} />}
            label="그룹 보기"
            slotProps={{
              typography: { fontSize: 12 }
            }}
          />
        </Stack>

      </Stack>

      {/* Content */}
      <Suspense fallback={<Box flex={1} display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>}>
        {currentTab === 'Place' && <TripPlaceContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} clusterable={cluastering} />}
        {currentTab === 'Route' && <TripRoutesContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} clusterable={cluastering} />}
      </Suspense>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-evenly"
        minHeight={50}
        paddingTop={0.9}
        paddingBottom={0.3}
        sx={theme => ({ borderTop: `1px solid ${theme.palette.divider}` })}
      >
        <Stack
          component="button"
          gap={0.5}
          justifyContent="center"
          alignItems="center"
          onClick={() => setCurrentTab('Place')}
          sx={{ flex: 1 }}
        >
          <PinDropIcon fontSize="small" color={currentTab === 'Place' ? 'primary' : 'disabled'} />
          <Typography variant='caption' fontWeight="bold" color={currentTab === 'Place' ? 'primary' : 'textDisabled'}>장소</Typography>
        </Stack>

        <Box height="28px" width="1px" sx={theme => ({ backgroundColor: theme.palette.divider, opacity: 0.6 })} />

        <Stack
          component="button"
          gap={0.5}
          justifyContent="center"
          alignItems="center"
          onClick={() => setCurrentTab('Route')}
          sx={{ flex: 1 }}
        >
          <NearMeIcon fontSize="small" color={currentTab === 'Route' ? 'primary' : 'disabled'} />
          <Typography variant='caption' fontWeight="bold" color={currentTab === 'Route' ? 'primary' : 'textDisabled'}>경로</Typography>
        </Stack>
      </Stack>

    </Box>
  )
}