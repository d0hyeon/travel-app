import { useSuspenseQuery } from '~shared/hooks/extends/useSuspenseQuery'
import { getRecommendedPlaces, recommendedPlaceKey } from '../../place/recommended-place.api'
import { tripKey } from '../trip.api'
import { useTrip } from '../useTrip'

export function useRecommendedPlaces(tripId: string, enabled = true) {
  const { data: trip } = useTrip(tripId)

  const { data = [], ...query } =  useSuspenseQuery({
    queryKey: [tripKey, recommendedPlaceKey, tripId],
    queryFn: () => getRecommendedPlaces(tripId, trip.destinations),
    enabled
  })

  return { data, ...query }
}
