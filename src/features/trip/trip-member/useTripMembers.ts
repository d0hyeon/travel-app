import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { queryClient } from "~app/query-client"
import { tripKey } from "../trip.api"
import {
  leaveTrip,
  getTripMembersByTripId,
  tripMemberKey,
} from "./tripMember.api"

export function useTripMembers(tripId: string) {
  const queryClient = useQueryClient()

  const { data, ...queries } = useSuspenseQuery({
    queryKey: useTripMembers.key(tripId),
    queryFn: () => getTripMembersByTripId(tripId)
  })

  const { mutate: remove } = useMutation({
    mutationFn: leaveTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripMembers.key(tripId) })
    }
  })

  return { data, remove, ...queries }
}

useTripMembers.key = (tripId: string) => [tripKey, tripMemberKey, tripId]
useTripMembers.prefetch = (tripId: string) => {
  queryClient.prefetchQuery({
    queryKey: useTripMembers.key(tripId),
    queryFn: () => getTripMembersByTripId(tripId)
  })
}
