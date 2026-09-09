import { AuthGuard } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { MostSavedScreen } from '../../src/features/explorer/explorer-saved/MostSavedScreen'

export default function MostSavedRoute() {
  return (
    <AuthGuard fallback={<Redirect href="/login" />}>
      <MostSavedScreen />
    </AuthGuard>
  )
}
