import { AuthGuard } from '@waylog/domains/clients'
import { RequireAuthRedirect } from '../auth/auth-redirect'
import { SettingsWebViewScreen } from './SettingsWebViewScreen'

export function SettingsDetailScreen() {
  return (
    <AuthGuard fallback={<RequireAuthRedirect />}>
      <SettingsWebViewScreen />
    </AuthGuard>
  )
}
