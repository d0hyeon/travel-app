import { AuthGuard } from '@waylog/domains/clients'
import { ExplorerCatalogScreen } from '../src/features/explorer/ExplorerCatalogScreen'
import { LoginRedirect } from '../src/features/auth/auth-redirect'

export default function ExplorerRoute() {
  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <ExplorerCatalogScreen />
    </AuthGuard>
  )
}
