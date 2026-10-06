import { useMutation, useQueryClient, useSuspenseQuery, type UseSuspenseQueryOptions } from "@tanstack/react-query"
import { tripKey } from "../trip/trip.api"
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
// 소비처가 자기 QueryClient 로 prefetch·ensure 한다.
useTripMembers.query = getQueryOptions
