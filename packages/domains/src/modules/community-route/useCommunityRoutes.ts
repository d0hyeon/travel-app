import { useSuspenseQuery } from '@tanstack/react-query'
import { useTrip } from '../trip'
import { communityRouteKey, getCommunityTrips } from './communityRoute.api'
import type { CommunityTrip } from './communityRoute.types'

export function useCommunityRoutes(tripId: string): { data: CommunityTrip[] } {
  const { data: trip } = useTrip(tripId)

  const { data } = useSuspenseQuery({
    queryKey: [communityRouteKey, 'list', tripId],
    queryFn: () => getCommunityTrips(trip.destinations, tripId),
    staleTime: 5 * 60 * 1000,
  })

  return { data }
}
