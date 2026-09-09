import { AuthGuard } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { TripListScreen } from '../../src/features/trip/trip-list/TripListScreen'

export default function TripListTabRoute() {
  return (
    <AuthGuard fallback={<Redirect href="/login" />}>
      <TripListScreen />
    </AuthGuard>
  )
}
