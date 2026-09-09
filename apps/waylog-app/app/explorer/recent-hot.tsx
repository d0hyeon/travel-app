import { AuthGuard } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { RecentHotScreen } from '../../src/features/explorer/explorer-recent/RecentHotScreen'

export default function RecentHotRoute() {
  return (
    <AuthGuard fallback={<Redirect href="/login" />}>
      <RecentHotScreen />
    </AuthGuard>
  )
}
