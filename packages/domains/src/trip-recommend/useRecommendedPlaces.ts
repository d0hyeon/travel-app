import { useSuspenseQuery } from '@waylog/react'
import { getRecommendedPlaces, recommendedPlaceKey } from './tripRecommend.api'
import { tripKey } from '@waylog/domains/trip'
import { useTrip } from '@waylog/domains/trip'

export function useRecommendedPlaces(tripId: string, enabled = true) {
  const { data: trip } = useTrip(tripId)

  const { data = [], ...query } =  useSuspenseQuery({
    queryKey: [tripKey, recommendedPlaceKey, tripId],
    queryFn: () => getRecommendedPlaces(tripId, trip.destinations),
    enabled
  })

  return { data, ...query }
}
