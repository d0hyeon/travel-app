import { useLocalSearchParams } from 'expo-router'
import { TripChecklistContent } from '../../../src/features/trip/trip-checklist/TripChecklistContent'

export default function TripDetailChecklistRoute() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()

  return <TripChecklistContent tripId={tripId} />
}
