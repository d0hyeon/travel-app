import { useSuspenseQuery } from '@tanstack/react-query'
import { useTrip } from '../useTrip'
import { communityRouteKey, getTripsByDestination } from './communityRoute.api'
import type { CommunityTrip } from './communityRoute.types'

export function useCommunityRoutes(tripId: string): { data: CommunityTrip[] } {
  const { data: trip } = useTrip(tripId)

  const { data } = useSuspenseQuery({
    queryKey: [communityRouteKey, 'list', tripId],
    queryFn: () => getTripsByDestination(trip.destinations, tripId),
    staleTime: 5 * 60 * 1000,
  })

  return { data }
}
