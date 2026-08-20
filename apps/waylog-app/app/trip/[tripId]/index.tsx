import { useLocalSearchParams } from 'expo-router'
import { TripBasicInfoContent } from '../../../src/features/trip/trip-basic-info/TripBasicInfoContent'

export default function TripDetailIndexRoute() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()

  return <TripBasicInfoContent tripId={tripId} />
}
