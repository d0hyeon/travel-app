import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import { useQueryParamState } from '../../shared/hooks/useQueryParamState'
import { TripBasicInfoContent } from './trip-basic-info/TripBasicInfoContent.desktop'


import { ErrorBoundary } from '~shared/components/ErrorBoundary.tsx'
import { TopNavigation } from '~shared/components/layout/TopNavigation.desktop.tsx'
import { SwitchCase } from '~shared/components/SwitchCase'
import { lazy } from '~shared/utils/react'
import { TripNameEditableText } from './TripNameEditableText.tsx'
import { useTripId } from './useTripId'

const TripPhotoContent = lazy(async () => {
  const module = await import('./trip-photo/TripPhotoContent.desktop.tsx')
  return { default: module.TripPhotoContent }
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

  const [currentTab, setCurrentTab] = useQueryParamState<TabType>('content', {
    defaultValue: 'Info'
  })

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <TopNavigation>
        <TripNameEditableText tripId={tripId} variant="h6" />
      </TopNavigation>

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

      </ErrorBoundary>
    </Box>
  )
}
