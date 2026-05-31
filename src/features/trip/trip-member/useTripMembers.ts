import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { queryClient } from "~app/query-client"
import { tripKey } from "../trip.api"
import {
  leaveTrip,
  getTripMembersByTripId,
  tripMemberKey,
} from "./tripMember.api"

const getQueryOptions = (tripId: string) => {
  return {
    queryKey: [tripKey, tripMemberKey, tripId],
    queryFn: () => getTripMembersByTripId(tripId)
  }
}

export function useTripMembers(tripId: string) {
  const queryClient = useQueryClient()

  const { data, ...queries } = useSuspenseQuery(getQueryOptions(tripId))

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
