import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { tripKey } from "../trip.api";
import { createPlace, getPlacesByTripId, placeKey, updatePlace, deletePlace } from "../../place/place.api";
import type { Place } from "../../place/place.types";
import type { PickPartial } from "../../../shared/utils/types";

export function useTripPlaces(tripId: string) {
  const queryClient = useQueryClient()

  const { data, ...queries } = useSuspenseQuery({
    queryKey: useTripPlaces.key(tripId),
    queryFn: () => getPlacesByTripId(tripId)
  })

  const { mutate: create } = useMutation({
    mutationFn: async (data: PickPartial<Omit<Place, 'id' | 'tripId' | 'createdAt'>, 'memo' | 'tags' | 'status'>) =>
      createPlace({
        memo: '',
        status: 'wished',
        tags: [],
        tripId,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripPlaces.key(tripId) })
    }
  })

  const { mutate: update } = useMutation({
    mutationFn: async ({ placeId, data }: { placeId: string; data: Partial<Omit<Place, 'id' | 'tripId' | 'createdAt'>> }) =>
      updatePlace(placeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripPlaces.key(tripId) })
    }
  })

  const { mutate: remove } = useMutation({
    mutationFn: deletePlace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripPlaces.key(tripId) })
    }
  })

  return { data, create, update, remove, ...queries }
}

useTripPlaces.key = (id: string) => [tripKey, placeKey, id];