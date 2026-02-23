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
import { useNavigate } from 'react-router-dom'
import { EditableText } from '../../shared/components/EditableText'
import { useQueryParamState } from '../../shared/hooks/useQueryParamState'
import { TripBasicInfoContent } from './trip-basic-info/TripBasicInfoContent.desktop'
import { ExpenseContent } from './trip-expense/ExpenseContent.desktop'
import { TripPlaceContent } from './trip-place/TripPlaceContent.desktop'
import { TripRoutesContent } from './trip-route/TripRoutesContent.desktop'
import { useTrip } from './useTrip'
import { useTripId } from './useTripId'

type TabType = 'Info' | 'Place' | 'Route' | 'Expense'

export function TripDetailPageDesktop() {
  const tripId = useTripId()
  const { data: trip, update } = useTrip(tripId)
  const navigate = useNavigate()

  const [currentTab, setCurrentTab] = useQueryParamState<TabType>('content', {
    defaultValue: 'Info'
  })

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
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
      <Box paddingX={2} paddingY={1}>
        <Tabs
          value={currentTab} onChange={(_, v) => setCurrentTab(v)}
          sx={{ borderBottom: '1px solid #ddd' }}
        >
          <Tab label="정보" value="Info" />
          <Tab label="장소" value="Place" />
          <Tab label="계획" value="Route" />
          <Tab label="정산" value="Expense" />
        </Tabs>
      </Box>
      {/* Content */}
      <Suspense fallback={<Box flex={1} display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>}>
        {currentTab === 'Info' && <TripBasicInfoContent tripId={tripId} />}
        {currentTab === 'Place' && <TripPlaceContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />}
        {currentTab === 'Route' && <TripRoutesContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />}
        {currentTab === 'Expense' && <ExpenseContent tripId={tripId} />}
      </Suspense>
    </Box>
  )
}
