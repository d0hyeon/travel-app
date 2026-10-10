import { useSuspenseQuery } from '@tanstack/react-query'
import { communityRouteKey, getCommunityTripRoutes } from './communityRoute.api'
import type { CommunityRoute } from './communityRoute.types'

export function useCommunityRouteDetail(communityKey: string): { data: CommunityRoute[] } {
  const { data } = useSuspenseQuery({
    queryKey: [communityRouteKey, 'detail', communityKey],
    queryFn: () => getCommunityTripRoutes(communityKey),
    staleTime: 10 * 60 * 1000,
  })

  return { data }
}
