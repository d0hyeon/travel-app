import { AuthGuard } from '@waylog/domains/clients'
import { TopVisitedScreen } from '../../src/features/explorer/explorer-ranking/TopVisitedScreen'
import { LoginRedirect } from '../../src/features/auth/auth-redirect'

export default function TopVisitedRoute() {
  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <TopVisitedScreen />
    </AuthGuard>
  )
}
