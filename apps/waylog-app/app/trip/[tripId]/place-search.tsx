import { useLocalSearchParams, useRouter } from 'expo-router'
import { PlaceSearchScreen } from '../../../src/features/place/place-search/PlaceSearchScreen'

export default function PlaceSearchRoute() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const router = useRouter()

  return <PlaceSearchScreen tripId={tripId} onAdded={() => router.back()} />
}
