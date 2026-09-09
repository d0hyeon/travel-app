import { AuthGuard } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { ExplorerCatalogScreen } from '../src/features/explorer/ExplorerCatalogScreen'

export default function ExplorerRoute() {
  return (
    <AuthGuard fallback={<Redirect href="/login" />}>
      <ExplorerCatalogScreen />
    </AuthGuard>
  )
}
