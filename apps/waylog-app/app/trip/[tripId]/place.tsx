import { useLocalSearchParams } from 'expo-router'
import { TripPlaceContent } from '../../../src/features/trip/trip-place/TripPlaceContent'

export default function TripDetailPlaceRoute() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()

  return <TripPlaceContent tripId={tripId} />
}
