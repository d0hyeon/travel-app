import { AuthGuard } from '@waylog/domains/clients'
import { RecentHotScreen } from '../../src/features/explorer/explorer-recent/RecentHotScreen'
import { LoginRedirect } from '../../src/features/auth/auth-redirect'

export default function RecentHotRoute() {
  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <RecentHotScreen />
    </AuthGuard>
  )
}
