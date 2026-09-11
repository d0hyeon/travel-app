import { AuthGuard } from '@waylog/domains/clients'
import { TripListScreen } from '../../src/features/trip/trip-list/TripListScreen'
import { LoginRedirect } from '../../src/features/auth/auth-redirect'

export default function TripListTabRoute() {
  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <TripListScreen />
    </AuthGuard>
  )
}
