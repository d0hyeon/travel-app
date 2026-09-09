import { AuthGuard } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { TopVisitedScreen } from '../../src/features/explorer/explorer-ranking/TopVisitedScreen'

export default function TopVisitedRoute() {
  return (
    <AuthGuard fallback={<Redirect href="/login" />}>
      <TopVisitedScreen />
    </AuthGuard>
  )
}
