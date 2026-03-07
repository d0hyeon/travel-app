import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { theme } from '~shared/modules/theme'
import { SearchParamProvider } from '~shared/modules/useSearchParams'
import { OverlayProvider } from './shared/hooks/useOverlay'

// Lazy load pages
const TripListPage = lazy(() => import('./features/trip/TripListPage').then(m => ({ default: m.TripListPage })))
const TripDetailPage = lazy(() => import('./features/trip/TripDetailPage').then(m => ({ default: m.TripDetailPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false
    }
  }
})

function Loading() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  )
}


function App() {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <OverlayProvider>
            <CssBaseline />
            <BrowserRouter>
              <SearchParamProvider>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <Route path="/" element={<TripListPage />} />
                    <Route path="/trip/:tripId" element={<TripDetailPage />} />
                  </Routes>
                </Suspense>
              </SearchParamProvider>
            </BrowserRouter>
          </OverlayProvider>
        </LocalizationProvider>
      </QueryClientProvider>

    </ThemeProvider>
  )
}


export default App
