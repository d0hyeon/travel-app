import { Box, Button, CircularProgress, CssBaseline, Dialog, DialogActions, DialogContent, ThemeProvider, Typography } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useEffect, useTransition } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BottomSheet } from '~shared/components/BottomSheet'
import { useInstallPrompt } from '~shared/hooks/useInstallPrompt'
import { useIsMobile } from '~shared/hooks/useIsMobile'
import { DialogTitle } from '~shared/modules/confirm-dialog/DialogTitle'
import { theme } from '~shared/modules/theme'
import { SearchParamProvider } from '~shared/modules/useSearchParams'
import { OverlayProvider, useOverlay } from './shared/hooks/useOverlay'

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
            <AppInstaller />
          </OverlayProvider>
        </LocalizationProvider>
      </QueryClientProvider>

    </ThemeProvider>
  )
}

function AppInstaller() {
  const { canInstall, install, isInstalled } = useInstallPrompt();
  const overlay = useOverlay();
  const isMobile = useIsMobile();
  const [isDownloading, startDownload] = useTransition();

  useEffect(() => {
    console.log(canInstall, isInstalled)
    if (canInstall && !isInstalled) {
      overlay.open(({ isOpen, close }) => {
        const handleDownload = () => {
          startDownload(async () => {
            await install();
            close();
          })
        }
        if (isMobile) {
          return (
            <BottomSheet isOpen={isOpen} onClose={close}>
              <BottomSheet.Header>앱 설치를 해주세요</BottomSheet.Header>
              <BottomSheet.Body>
                <Typography variant="body2">
                  지금 설치할 경우 향후 서비스 발전에 큰 도움이 되며<br />
                  초기 유저로써 다양한 혜택을 받으실 수 있어요
                </Typography>
              </BottomSheet.Body>
              <BottomSheet.BottomActions>
                <Button variant="contained" loading={isDownloading} onClick={handleDownload}>
                  다운로드
                </Button>
              </BottomSheet.BottomActions>
            </BottomSheet>
          )
        }
        return (
          <Dialog open={isOpen} onClose={close}>
            <DialogTitle>앱 설치를 해주세요</DialogTitle >
            <DialogContent>
              <Typography variant="body2">
                지금 설치할 경우 향후 서비스 발전에 큰 도움이 되며<br />
                초기 유저로써 다양한 혜택을 받으실 수 있어요
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button variant='outlined'>취소</Button>
              <Button variant='contained' onClick={handleDownload}>다운로드</Button>
            </DialogActions>
          </Dialog >
        )
      })
    }
  }, [])

  return null;
}

export default App
