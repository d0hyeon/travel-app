import { Alert, AlertTitle, Box, Button, CircularProgress, CssBaseline, ThemeProvider, Typography } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense } from 'react'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import { theme } from '~shared/modules/theme'
import { SearchParamProvider } from '~shared/modules/useSearchParams'
import { OverlayProvider } from '~shared/hooks/useOverlay'
import '~shared/index.css'
import { ErrorBoundary } from '~shared/components/ErrorBoundary'

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

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <Meta />

        <script type="text/javascript" src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_KEY}&autoload=false&libraries=services`} defer />
        <script src="https://unpkg.com/scheduler-polyfill" defer />

        <link href="https://cdn.jsdelivr.net/gh/sun-typeface/SUIT@2/fonts/static/woff2/SUIT.css" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" sizes="360x360" />
        <link rel="shortcut icon" href="/favicon.png" />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
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
            <OverlayProvider>
              <CssBaseline />
              <SearchParamProvider>
                <Suspense fallback={<Loading />}>
                  <Outlet />
                </Suspense>
              </SearchParamProvider>
            </OverlayProvider>
          </ErrorBoundary>
        </LocalizationProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
