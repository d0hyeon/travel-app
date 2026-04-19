import { useSuspenseQuery } from '@tanstack/react-query'
import { getRecommendedPlaces, recommendedPlaceKey } from '../../place/recommended-place.api'
import { tripKey } from '../trip.api'
import { useTrip } from '../useTrip'

export function useRecommendedPlaces(tripId: string) {
  const { data: trip } = useTrip(tripId)

  return useSuspenseQuery({
    queryKey: [tripKey, recommendedPlaceKey, tripId],
    queryFn: () => getRecommendedPlaces(tripId, trip.destinations),
  })
}
