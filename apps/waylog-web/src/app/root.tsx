import { CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { QueryClientProvider, } from '@tanstack/react-query'
import { Suspense } from 'react'
import { Links, Meta, Outlet, Scripts } from 'react-router'
import { queryClient } from '~app/query-client'
import { theme } from '~shared/config/theme'
import { SearchParamProvider } from '~shared/hooks/urls/useSearchParams'
import { OverlayProvider } from '~shared/hooks/useOverlay.context'
import { RouteOverlayRenderer } from '~shared/hooks/extends/route-overlay/RouteOverlayRenderer'


import { AuthErrorBoundary } from '~features/auth/AuthErrorBoundary'
import { CommonErrorBoundary } from '~shared/components/CommonErrorBoundary'
import '~shared/index.css'
import '~shared/reset.css'
import { AppInitializer } from './AppInitializer'
import { SplashScreen } from './SplashScreen'
import { ToastRenderer } from './ToastRenderer'
import { APP_ROOT_NODE_CLASS } from './constants'

export const meta = () => [
  { title: 'WayLog' },
  { property: 'og:title', content: 'WayLog' },
  { property: 'og:type', content: 'website' },
  { property: 'og:url', content: 'https://waylog.me' },
  { property: 'og:image', content: 'https://waylog.me/pwa-512x512.png' },
  { name: 'twitter:card', content: 'summary' },
  { name: 'twitter:title', content: 'WayLog' },
  { name: 'twitter:image', content: 'https://waylog.me/pwa-512x512.png' },
  { name: 'theme-color', content: '#ffffff' },
]

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
        <main className={APP_ROOT_NODE_CLASS}>
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
              <RouteOverlayRenderer />
            </OverlayProvider>
          </CommonErrorBoundary>
        </LocalizationProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

