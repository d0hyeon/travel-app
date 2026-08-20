import { useAuth } from '@waylog/domains/auth'
import { Redirect } from 'expo-router'
import { TripListScreen } from '../src/features/trip/trip-list/TripListScreen'

export default function IndexRoute() {
  const { data: auth } = useAuth({ required: false })

  if (auth == null) return <Redirect href="/login" />

  return <TripListScreen />
}
