import { Alert, AlertTitle, Button, CssBaseline, Fade, ThemeProvider, Typography } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { QueryClientProvider } from '@tanstack/react-query'
import { Suspense, useEffect } from 'react'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import { queryClient } from '~app/query-client'
import { AuthStateSync } from '~features/auth/useAuth'
import { IntroFullScreenBanner } from '~features/intro/IntroFullScreenBanner'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { ErrorBoundary } from '~shared/components/ErrorBoundary'
import { theme } from '~shared/config/theme'
import { SearchParamProvider } from '~shared/hooks/urls/useSearchParams'
import { OverlayProvider } from '~shared/hooks/useOverlay'
import '~shared/index.css'



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
              {/* <TouchRippleOverlay /> */}
              <SearchParamProvider>
                <Suspense
                  fallback={
                    <Fade in={true}>
                      <div>
                        <IntroFullScreenBanner />
                      </div>
                    </Fade>
                  }
                >
                  <Outlet />
                  <AuthStateSync />
                </Suspense>
              </SearchParamProvider>
              <Installer />
            </OverlayProvider>
          </ErrorBoundary>
        </LocalizationProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

function Installer() {
  const confirm = useConfirmDialog();

  useEffect(() => {
    const updateSW = registerSW({
      // immediate: true,
      async onNeedRefresh() {
        const isConfirm = await confirm('새로운 버전이 출시되었어요.\n업데이트를 진행할게요');
        if (isConfirm) updateSW(true);
      },
    })
  }, [])

  return null;
}
