import { AppRoute } from '~app/AppRoute'
import { WaylogWebViewScreen } from '~shared/bridge/WaylogWebViewScreen'

export function SupportScreen() {
  return <WaylogWebViewScreen route={AppRoute.문의} />
}

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.문의]: undefined
  }
}
