import { useMutation, useSuspenseQuery, type MutationOptions } from "@tanstack/react-query";
import {
  createTripPlace,
  deleteTripPlace,
  getTripPlacesByTripId,
  placeKey,
  updatePlace,
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
      name,
      address,
      category,
      memo,
      tags,
    }: {
      id: string
      name?: string
      address?: string
      category?: PlaceCategoryType
      memo?: string
      tags?: string[]
    }) => {
      const tripPlace = data.find((p) => p.id === id)
      if (!tripPlace) throw new Error('TripPlace not found')

      if (name !== undefined || address !== undefined) {
        await updatePlace(tripPlace.placeId, { name, address })
      }
      return updateTripPlace(id, { category, memo, tags })
    },
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
