import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import NearMeIcon from '@mui/icons-material/NearMe';
import PhotoIcon from '@mui/icons-material/Photo';
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
import { useNavigate } from 'react-router';
import { BottomNavigation } from '~shared/components/BottomNavigation';
import { useQueryParamState } from '../../shared/hooks/useQueryParamState';
import { TripBasicInfoContent } from './trip-basic-info/TripBasicInfoContent.mobile';
import { ExpenseContent } from './trip-expense/ExpenseContent.mobile';
import { TripPhotoContent } from './trip-photo/TripPhotoContent.mobile';
import { TripPlaceContent } from './trip-place/TripPlaceContent.mobile';
import { TripRoutesContent } from './trip-route/TripRoutesContent.mobile';
import { useTrip } from './useTrip';
import { useTripId } from './useTripId';

type TabType = 'Info' | 'Place' | 'Route' | 'Expense' | 'Photo'

const HEADER_HEIGHT = 50;

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
      <Stack
        height={HEADER_HEIGHT}
        position="fixed"
        top={0}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        sx={{
          p: 1,
          bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider',
          zIndex: 20,
        }}
      >
        <Box display="flex" alignItems="center" gap={0.5}>
          <IconButton onClick={() => navigate('/')} size="small">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box flex={1} minWidth={0}>
            <Typography variant={'subtitle2'} fontWeight={600} noWrap>
              {trip.name}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" alignItems="center">

        </Stack>

      </Stack>

      {/* Content */}
      <Stack
        position="relative"
        paddingTop={`${HEADER_HEIGHT}px`}
        paddingBottom={`calc(${BottomNavigation.HEIGHT}px + env(safe-area-inset-bottom))`}
        height="100%"
        sx={{ overflowY: 'auto', overscrollBehaviorY: 'none' }}
      >
        <Suspense fallback={<Box flex={1} display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>}>
          {currentTab === 'Info' && <TripBasicInfoContent tripId={tripId} />}
          {currentTab === 'Place' && <TripPlaceContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />}
          {currentTab === 'Route' && <TripRoutesContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />}
          {currentTab === 'Expense' && <ExpenseContent tripId={tripId} />}
          {currentTab === 'Photo' && <TripPhotoContent tripId={tripId} />}
        </Suspense>
      </Stack>
      <BottomNavigation>
        <BottomNavigation.Menu
          isActived={currentTab === 'Info'}
          icon={<InfoIcon fontSize="small" color={currentTab === 'Info' ? 'primary' : 'disabled'} />}
          onClick={() => setCurrentTab('Info')}
        >
          정보
        </BottomNavigation.Menu>
        <BottomNavigation.Menu
          isActived={currentTab === 'Place'}
          icon={<PinDropIcon fontSize="small" color={currentTab === 'Place' ? 'primary' : 'disabled'} />}
          onClick={() => setCurrentTab('Place')}
        >
          장소
        </BottomNavigation.Menu>
        <BottomNavigation.Menu
          isActived={currentTab === 'Route'}
          icon={<NearMeIcon fontSize="small" color={currentTab === 'Route' ? 'primary' : 'disabled'} />}
          onClick={() => setCurrentTab('Route')}
        >
          계획
        </BottomNavigation.Menu>
        <BottomNavigation.Menu
          isActived={currentTab === 'Expense'}
          icon={<ReceiptIcon fontSize="small" color={currentTab === 'Expense' ? 'primary' : 'disabled'} />}
          onClick={() => setCurrentTab('Expense')}
        >
          정산
        </BottomNavigation.Menu>
        <BottomNavigation.Menu
          isActived={currentTab === 'Photo'}
          icon={<PhotoIcon fontSize="small" color={currentTab === 'Photo' ? 'primary' : 'disabled'} />}
          onClick={() => setCurrentTab('Photo')}
        >
          사진
        </BottomNavigation.Menu>
      </BottomNavigation>
    </Box>
  )
}