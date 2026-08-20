import { useLocalSearchParams } from 'expo-router'
import { TripRoutesContent } from '../../../src/features/trip/trip-route/TripRoutesContent'

export default function TripDetailRouteRoute() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()

  return <TripRoutesContent tripId={tripId} />
}
