import { AppRoute } from '~app/AppRoute'
import { SettingsWebViewScreen } from './SettingsWebViewScreen'

export function SupportScreen() {
  return <SettingsWebViewScreen path={AppRoute.문의} />
}

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.문의]: undefined
  }
}
