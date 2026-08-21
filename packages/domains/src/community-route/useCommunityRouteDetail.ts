import { useSuspenseQuery } from '@tanstack/react-query'
import { communityRouteKey, getRoutesWithPlacesByTripId } from './communityRoute.api'
import type { CommunityRouteWithPlaces } from './communityRoute.types'

export function useCommunityRouteDetail(communityTripId: string): { data: CommunityRouteWithPlaces[] } {
  const { data } = useSuspenseQuery({
    queryKey: [communityRouteKey, 'detail', communityTripId],
    queryFn: () => getRoutesWithPlacesByTripId(communityTripId),
    staleTime: 10 * 60 * 1000,
  })

  return { data }
}
