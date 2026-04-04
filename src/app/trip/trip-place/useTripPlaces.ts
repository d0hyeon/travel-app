import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import type { PickPartial } from "../../../shared/utils/types";
import { createPlace, deletePlace, getPlacesByTripId, placeKey, updatePlace } from "../../place/place.api";
import type { Place } from "../../place/place.types";
import { tripKey } from "../trip.api";
import { queryClient } from "~app/lib/query-client";

export function useTripPlaces(tripId: string) {

  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripPlaces.key(tripId),
    queryFn: () => getPlacesByTripId(tripId)
  })

  const { mutateAsync: create } = useMutation({
    mutationFn: async (data: PickPartial<Omit<Place, 'id' | 'tripId' | 'createdAt' | 'isVisible'>, 'memo' | 'tags' | 'status'>) =>
      createPlace({
        memo: '',
        status: 'wished',
        tags: [],
        tripId,
        ...data,
      }),
    onSuccess: () => refetch()
  })

  const { mutateAsync: update } = useMutation({
    mutationFn: async ({ placeId, ...payload }: { placeId: string; } & Partial<Omit<Place, 'id' | 'tripId' | 'createdAt'>>) =>
      updatePlace(placeId, payload),
    onSuccess: () => refetch()
  })

  const { mutateAsync: remove } = useMutation({
    mutationFn: deletePlace,
    onSuccess: () => {
      refetch()
    }
  })

  return { data, create, update, remove, refetch, ...queries }
}

useTripPlaces.key = (id: string) => [tripKey, placeKey, id];

useTripPlaces.prefetch = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: useTripPlaces.key(id),
    queryFn: () => getPlacesByTripId(id)
  })
}