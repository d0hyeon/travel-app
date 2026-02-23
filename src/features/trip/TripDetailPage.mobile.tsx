import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import NearMeIcon from '@mui/icons-material/NearMe';
import PinDropIcon from '@mui/icons-material/PinDrop';
import ReceiptIcon from '@mui/icons-material/Receipt';
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryParamState } from '../../shared/hooks/useQueryParamState';
import { TripBasicInfoContent } from './trip-basic-info/TripBasicInfoContent.mobile';
import { ExpenseContent } from './trip-expense/ExpenseContent.mobile';
import { TripPlaceContent } from './trip-place/TripPlaceContent.mobile';
import { TripRoutesContent } from './trip-route/TripRoutesContent.mobile';
import { useTrip } from './useTrip';
import { useTripId } from './useTripId';

type TabType = 'Info' | 'Place' | 'Route' | 'Expense'

export function TripDetailPageMobile() {
  const tripId = useTripId()
  const { data: trip } = useTrip(tripId)
  const navigate = useNavigate()

  const [currentTab, setCurrentTab] = useQueryParamState<TabType>('content', {
    defaultValue: 'Info'
  })


  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Stack height={59} position="sticky" top={0} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
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

        </Stack>

      </Stack>

      {/* Content */}
      <Stack paddingBottom="60px" height="100%">
        <Suspense fallback={<Box flex={1} display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>}>
          {currentTab === 'Info' && <TripBasicInfoContent tripId={tripId} />}
          {currentTab === 'Place' && <TripPlaceContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />}
          {currentTab === 'Route' && <TripRoutesContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />}
          {currentTab === 'Expense' && <ExpenseContent tripId={tripId} />}
        </Suspense>
      </Stack>
      <Stack
        position="fixed"
        bottom={0}
        height={54}
        width="100%"
        direction="row"
        alignItems="center"
        justifyContent="space-evenly"
        minHeight={50}
        paddingTop={0.9}
        paddingBottom={0.3}
        zIndex={5}
        sx={theme => ({ borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: '#fff' })}
      >
        <Stack
          component="button"
          gap={0.5}
          justifyContent="center"
          alignItems="center"
          onClick={() => setCurrentTab('Info')}
          sx={{ flex: 1 }}
        >
          <InfoIcon fontSize="small" color={currentTab === 'Info' ? 'primary' : 'disabled'} />
          <Typography variant='caption' fontWeight="bold" color={currentTab === 'Info' ? 'primary' : 'textDisabled'}>정보</Typography>
        </Stack>

        <Box height="28px" width="1px" sx={theme => ({ backgroundColor: theme.palette.divider, opacity: 0.6 })} />

        <Stack

          component="button"

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

          justifyContent="center"
          alignItems="center"
          onClick={() => setCurrentTab('Route')}
          sx={{ flex: 1 }}
        >
          <NearMeIcon fontSize="small" color={currentTab === 'Route' ? 'primary' : 'disabled'} />
          <Typography variant='caption' fontWeight="bold" color={currentTab === 'Route' ? 'primary' : 'textDisabled'}>계획</Typography>
        </Stack>

        <Box height="28px" width="1px" sx={theme => ({ backgroundColor: theme.palette.divider, opacity: 0.6 })} />

        <Stack
          component="button"
          gap={0.5}
          justifyContent="center"
          alignItems="center"
          onClick={() => setCurrentTab('Expense')}
          sx={{ flex: 1 }}
        >
          <ReceiptIcon fontSize="small" color={currentTab === 'Expense' ? 'primary' : 'disabled'} />
          <Typography variant='caption' fontWeight="bold" color={currentTab === 'Expense' ? 'primary' : 'textDisabled'}>정산</Typography>
        </Stack>
      </Stack>

    </Box>
  )
}