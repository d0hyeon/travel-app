import { useMutation, useSuspenseQuery, type MutationOptions } from "@tanstack/react-query";
import type { PickPartial } from "../../../shared/utils/types";
import { createPlace, deletePlace, getPlacesByTripId, placeKey, updatePlace } from "../../place/place.api";
import type { Place } from "../../place/place.types";
import { tripKey } from "../trip.api";
import { queryClient } from "~app/query-client";

export function useTripPlaces(tripId: string) {
  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripPlaces.key(tripId),
    queryFn: () => getPlacesByTripId(tripId)
  })

  const create = useAddTripPlace(tripId, {  
    onSuccess: () => refetch()
  })

  const update = useMutation({
    mutationFn: async ({ placeId, ...payload }: { placeId: string; } & Partial<Omit<Place, 'id' | 'tripId' | 'createdAt'>>) =>
      updatePlace(placeId, payload),
    onSuccess: () => refetch()
  })

  const remove = useMutation({
    mutationFn: deletePlace,
    onSuccess: () => {
      refetch()
    }
  })

  return {
    data,
    create: Object.assign(create.mutateAsync, create),
    update: Object.assign(update.mutateAsync, update),
    remove: Object.assign(remove.mutateAsync, remove),
    refetch,
    ...queries
  }
}

type AddPayload = PickPartial<Parameters<typeof createPlace>[0], 'memo' | 'status' | 'tags'>;

export function useAddTripPlace(
  tripId: string,
  options?: Omit<MutationOptions<Place, Error, Omit<AddPayload, 'tripId'>>, 'mutationFn'>
) { 
  return useMutation({
    ...options,
    mutationFn: async (data) =>
      createPlace({
        memo: '',
        status: 'wished',
        tags: [],
        tripId,
        ...data,
      }),
  })
}

useTripPlaces.key = (id: string) => [tripKey, placeKey, id];
useTripPlaces.prefetch = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: useTripPlaces.key(id),
    queryFn: () => getPlacesByTripId(id)
  })
}