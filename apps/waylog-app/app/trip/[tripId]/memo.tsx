import { useLocalSearchParams } from 'expo-router'
import { TripMemoListContent } from '../../../src/features/trip/trip-memo/TripMemoListContent'

export default function TripDetailMemoRoute() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()

  return <TripMemoListContent tripId={tripId} />
}
