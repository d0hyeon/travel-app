import { AuthGuard } from '@waylog/domains/clients'
import { MostSavedScreen } from '../../src/features/explorer/explorer-saved/MostSavedScreen'
import { LoginRedirect } from '../../src/features/auth/auth-redirect'

export default function MostSavedRoute() {
  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <MostSavedScreen />
    </AuthGuard>
  )
}
