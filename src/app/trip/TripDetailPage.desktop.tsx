import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Tab,
  Tabs
} from '@mui/material'
import { Suspense } from 'react'
import { useNavigate } from 'react-router'
import { EditableText } from '../../shared/components/EditableText'
import { useQueryParamState } from '../../shared/hooks/useQueryParamState'
import { TripBasicInfoContent } from './trip-basic-info/TripBasicInfoContent.desktop'


import { useTrip } from './useTrip'
import { useTripId } from './useTripId'
import { SwitchCase } from '~shared/components/SwitchCase'
import { lazy } from '~shared/lib/react'

const TripPhotoContent = lazy(async () => {
  const module = await import('./trip-photo/TripPhotoContent.desktop.tsx')
  return module
});

const TripPlaceContent = lazy(async () => {
  const module = await import('./trip-place/TripPlaceContent.desktop');
  return { default: module.TripPlaceContent }
});

const TripRoutesContent = lazy(async () => {
  const module = await import('./trip-route/TripRoutesContent.desktop');
  return { default: module.TripRoutesContent }
});

const TripExpenseContent = lazy(async () => {
  const module = await import('./trip-expense/ExpenseContent.desktop');
  return { default: module.ExpenseContent }
});

type TabType = 'Info' | 'Place' | 'Route' | 'Expense' | 'Photo'

export function TripDetailPageDesktop() {
  const tripId = useTripId()
  const { data: trip, update } = useTrip(tripId)
  const navigate = useNavigate()

  const [currentTab, setCurrentTab] = useQueryParamState<TabType>('content', {
    defaultValue: 'Info'
  })

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        position="sticky"
        top={0}
        zIndex={10}
        sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => navigate('/')}>
            <ArrowBackIcon />
          </IconButton>
          <EditableText
            defaultValue={trip.name}
            variant="h6"
            onSubmit={(name) => update.mutate({ name })}
          />
        </Box>
        <Stack direction="row" alignItems="center">

        </Stack>

      </Stack>
      <Box
        position="sticky"
        top={72}
        paddingX={2}
        paddingY={1}
        width="100%"
        bgcolor="background.paper"
        zIndex={10}
      >
        <Tabs
          value={currentTab} onChange={(_, v) => setCurrentTab(v)}
          sx={{ borderBottom: '1px solid #ddd' }}
        >
          <Tab label="정보" value="Info" />
          <Tab label="장소" value="Place" onMouseEnter={() => TripPlaceContent.preload()} />
          <Tab label="계획" value="Route" onMouseEnter={() => TripRoutesContent.preload()} />
          <Tab label="정산" value="Expense" onMouseEnter={() => TripExpenseContent.preload()} />
          <Tab label="사진" value="Photo" onMouseEnter={() => TripPhotoContent.preload()} />
        </Tabs>
      </Box>
      {/* Content */}
      <Suspense fallback={<Box flex={1} display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>}>
        <SwitchCase
          value={currentTab}
          cases={{
            Info: <TripBasicInfoContent tripId={tripId} />,
            Place: () => <TripPlaceContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />,
            Route: () => <TripRoutesContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />,
            Expense: () => <TripExpenseContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />,
            Photo: () => <TripPhotoContent tripId={tripId} />
          }}
        />
      </Suspense>
    </Box>
  )
}
