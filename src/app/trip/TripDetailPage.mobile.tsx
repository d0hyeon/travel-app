import InfoIcon from '@mui/icons-material/Info';
import NearMeIcon from '@mui/icons-material/NearMe';
import PhotoIcon from '@mui/icons-material/Photo';
import PinDropIcon from '@mui/icons-material/PinDrop';
import ReceiptIcon from '@mui/icons-material/Receipt';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography
} from '@mui/material';
import { Suspense } from 'react';
import { BottomNavigation } from '~shared/components/BottomNavigation';
import { ErrorBoundary } from '~shared/components/ErrorBoundary.tsx';
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile.tsx';
import { SwitchCase } from '~shared/components/SwitchCase.tsx';
import { useActivationSignal } from '~shared/hooks/useActivationSignal.ts';
import { lazy } from '~shared/lib/react.ts';
import { useQueryParamState } from '../../shared/hooks/useQueryParamState';
import { TripBasicInfoContent } from './trip-basic-info/TripBasicInfoContent.mobile';
import { TripNameEditableText } from './TripNameEditableText.tsx';
import { useTripId } from './useTripId';


type TabType = 'Info' | 'Place' | 'Route' | 'Expense' | 'Photo';

const TripPhotoContent = lazy(async () => {
  const module = await import('./trip-photo/TripPhotoContent.mobile.tsx')
  return { default: module.TripPhotoContent }
});

const TripPlaceContent = lazy(() => import('./trip-place/TripPlaceContent.mobile'));

const TripRoutesContent = lazy(async () => {
  const module = await import('./trip-route/TripRoutesContent.mobile');
  return { default: module.TripRoutesContent }
});

const TripExpenseContent = lazy(async () => {
  const module = await import('./trip-expense/ExpenseContent.mobile');
  return { default: module.ExpenseContent }
});


export function TripDetailPageMobile() {
  const tripId = useTripId()

  const [currentTab, setCurrentTab] = useQueryParamState<TabType>('content', {
    defaultValue: 'Info'
  })

  useActivationSignal(() => {
    TripRoutesContent.preload();
    TripPhotoContent.preload();
    TripExpenseContent.preload();
    TripPlaceContent.preload(tripId);
  }, { sensitivity: 'high' })

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <TopNavigation>
        <TripNameEditableText variant="subtitle2" tripId={tripId} fontWeight={600} noWrap />
      </TopNavigation>


      {/* Content */}
      <Stack
        position="relative"
        paddingTop={`${TopNavigation.HEIGHT}px`}
        paddingBottom={`calc(${BottomNavigation.HEIGHT}px + env(safe-area-inset-bottom))`}
        height="100%"
        sx={{ overflowY: 'auto', overscrollBehaviorY: 'none' }}
      >
        <ErrorBoundary
          fallback={({ error, resetError }) => (
            <Alert
              color="error"
              action={(<Button size="small" variant='contained' onClick={resetError}>재시도</Button>)}
              sx={{ margin: 2, marginX: 1.5 }}
            >
              <AlertTitle>에러가 발생했어요!</AlertTitle>
              <Typography variant="caption">{error.message}</Typography>
            </Alert>
          )}
        >
          <Suspense fallback={<Box flex={1} display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>}>
            <SwitchCase
              value={currentTab}
              cases={{
                Info: <TripBasicInfoContent tripId={tripId} />,
                Place: () => <TripPlaceContent tripId={tripId} />,
                Route: () => <TripRoutesContent tripId={tripId} />,
                Expense: () => <TripExpenseContent tripId={tripId} />,
                Photo: () => <TripPhotoContent tripId={tripId} />
              }}
            />
          </Suspense>
        </ErrorBoundary>
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

