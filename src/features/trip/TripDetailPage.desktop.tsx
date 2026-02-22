import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Box,
  CircularProgress,
  IconButton,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import { Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrip } from './useTrip'
import { useTripId } from './useTripId'
import { useQueryParamState } from '../../shared/hooks/useQueryParamState'
import { TripPlaceContent } from './trip-place/TripPlaceContent.desktop'
import { TripRoutesContent } from './trip-route/TripRoutesContent.desktop'
import { EditableText } from '../../shared/components/EditableText'

type TabType = 'Place' | 'Route'

export function TripDetailPageDesktop() {
  const tripId = useTripId()
  const { data: trip, update } = useTrip(tripId)
  const navigate = useNavigate()

  const [currentTab, setCurrentTab] = useQueryParamState<TabType>('content', {
    defaultValue: 'Place'
  })

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
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
      </Box>
      <Box paddingX={2} paddingY={1}>
        <Tabs
          value={currentTab} onChange={(_, v) => setCurrentTab(v)}
          sx={{ borderBottom: '1px solid #ddd' }}
        >
          <Tab label="전체 장소" value="Place" />
          <Tab label="일자별 경로" value="Route" />
        </Tabs>
      </Box>
      {/* Content */}
      <Suspense fallback={<Box flex={1} display="flex" alignItems="center" justifyContent="center"><CircularProgress /></Box>}>
        {currentTab === 'Place' && <TripPlaceContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />}
        {currentTab === 'Route' && <TripRoutesContent tripId={tripId} defaultCenter={{ lat: trip.lat, lng: trip.lng }} />}
      </Suspense>
    </Box>
  )
}
