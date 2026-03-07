import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { tripKey } from "../trip.api"
import {
  getTripMembersByTripId,
  tripMemberKey,
  createTripMember,
  updateTripMember,
  deleteTripMember
} from "./tripMember.api"
import type { TripMember } from "./tripMember.types"
import { getRandomEmoji } from "./tripMember.types"

export function useTripMembers(tripId: string) {
  const queryClient = useQueryClient()

  const { data, ...queries } = useSuspenseQuery({
    queryKey: useTripMembers.key(tripId),
    queryFn: () => getTripMembersByTripId(tripId)
  })

  const { mutate: create } = useMutation({
    mutationFn: async (input: { name: string; emoji?: string }) =>
      createTripMember({
        tripId,
        name: input.name,
        emoji: input.emoji ?? getRandomEmoji(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripMembers.key(tripId) })
    }
  })

  const { mutate: update } = useMutation({
    mutationFn: async ({ memberId, data }: {
      memberId: string
      data: Partial<Pick<TripMember, 'name' | 'emoji'>>
    }) => updateTripMember(memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripMembers.key(tripId) })
    }
  })

  const { mutate: remove } = useMutation({
    mutationFn: deleteTripMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripMembers.key(tripId) })
    }
  })

  return { data, create, update, remove, ...queries }
}

useTripMembers.key = (tripId: string) => [tripKey, tripMemberKey, tripId]
