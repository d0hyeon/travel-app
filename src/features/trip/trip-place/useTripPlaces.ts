import { useMutation, useSuspenseQuery, type MutationOptions } from "@tanstack/react-query";
import {
  createTripPlace,
  deleteTripPlace,
  getTripPlacesByTripId,
  placeKey,
  updateTripPlace,
  upsertPlace,
} from "../../place/place.api";
import type { PlaceCategoryType, PlaceStatus, TripPlace } from "../../place/place.types";
import type { PlaceResult } from "../../place/place-search/usePlaceSearch";
import { tripKey } from "../trip.api";
import { queryClient } from "~app/query-client";

export function useTripPlaces(tripId: string) {
  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripPlaces.key(tripId),
    queryFn: () => getTripPlacesByTripId(tripId),
  })

  const create = useAddTripPlace(tripId, {
    onSuccess: () => refetch(),
  })

  const update = useMutation({
    mutationFn: async ({
      id,
      category,
      memo,
      tags,
      status,
    }: {
      id: string
      category?: PlaceCategoryType
      memo?: string
      tags?: string[]
      status?: PlaceStatus
    }) => updateTripPlace(id, { category, memo, tags, status }),
    onSuccess: () => refetch(),
  })

  const remove = useMutation({
    mutationFn: deleteTripPlace,
    onSuccess: () => refetch(),
  })

  return {
    data,
    create: Object.assign(create.mutateAsync, create),
    update: Object.assign(update.mutateAsync, update),
    remove: Object.assign(remove.mutateAsync, remove),
    refetch,
    ...queries,
  }
}

export function useAddTripPlace(
  tripId: string,
  options?: Omit<MutationOptions<TripPlace, Error, PlaceResult>, 'mutationFn'>,
) {
  return useMutation({
    ...options,
    mutationFn: async (result: PlaceResult) => {
      const place = await upsertPlace(result.provider, result.externalId, {
        name: result.name,
        address: result.address,
        lat: result.lat,
        lng: result.lng,
      })
      return createTripPlace({
        tripId,
        placeId: place.id,
        status: 'wished' as PlaceStatus,
        memo: '',
        tags: [],
      })
    },
  })
}

useTripPlaces.key = (id: string) => [tripKey, placeKey, id];
useTripPlaces.prefetch = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: useTripPlaces.key(id),
    queryFn: () => getTripPlacesByTripId(id),
  })
}
