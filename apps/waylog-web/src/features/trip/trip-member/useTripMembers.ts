import { useMutation, useQueryClient, useSuspenseQuery, type UseSuspenseQueryOptions } from "@tanstack/react-query"
import { queryClient } from "~app/query-client"
import { tripKey } from "../trip.api"
import {
  leaveTrip,
  getTripMembersByTripId,
  tripMemberKey,
} from "./tripMember.api"
import type { TripMember } from "./tripMember.types"

const getQueryOptions = (tripId: string) => {
  return {
    queryKey: [tripKey, tripMemberKey, tripId],
    queryFn: () => getTripMembersByTripId(tripId)
  }
}

type QueryOptions<T = TripMember[]> = Omit<UseSuspenseQueryOptions<TripMember[], Error, T>, 'queryKey' | 'queryFn'>

export function useTripMembers<T = TripMember[]>(tripId: string, queryOptions?: QueryOptions<T>) {
  const queryClient = useQueryClient()

  const { data, ...queries } = useSuspenseQuery({
    ...getQueryOptions(tripId),
    ...queryOptions
  })

  const { mutate: remove } = useMutation({
    mutationFn: () => leaveTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripMembers.key(tripId) })
    }
  })

  return { data, remove, ...queries }
}

useTripMembers.key = (tripId: string) => getQueryOptions(tripId).queryKey;
useTripMembers.prefetch = (tripId: string) => queryClient.prefetchQuery(getQueryOptions(tripId))
useTripMembers.fetch = (tripId: string) => queryClient.ensureQueryData(getQueryOptions(tripId))
