import { CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { QueryClientProvider, } from '@tanstack/react-query'
import { Suspense, useEffect } from 'react'
import { Links, Meta, Outlet, Scripts } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import { queryClient } from '~app/query-client'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { theme } from '~shared/config/theme'
import { SearchParamProvider } from '~shared/hooks/urls/useSearchParams'
import { OverlayProvider } from '~shared/hooks/useOverlay'


import { AuthErrorBoundary } from '~features/auth/AuthErrorBoundary'
import { CommonErrorBoundary } from '~shared/components/CommonErrorBoundary'
import '~shared/reset.css'
import '~shared/index.css'
import { AppInitializer } from './AppInitializer'
import { SplashScreen } from './SplashScreen'
import { ToastRenderer } from './ToastRenderer'



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
        <main className="app-root">
          {children}
        </main>
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
          <CommonErrorBoundary>
            <CssBaseline />
            <OverlayProvider>
              <SearchParamProvider>
                <Suspense fallback={<SplashScreen />}>
                  <AuthErrorBoundary>
                    <Outlet />
                  </AuthErrorBoundary>
                </Suspense>
              </SearchParamProvider>

              <AppInitializer />
              <ToastRenderer />
            </OverlayProvider>
          </CommonErrorBoundary>
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
