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

export interface AddTripPlacePayload {
  provider: string
  externalId: string
  name: string
  address: string
  lat: number
  lng: number
}

export function useAddTripPlace(
  tripId: string,
  options?: Omit<MutationOptions<TripPlace, Error, AddTripPlacePayload>, 'mutationFn'>,
) {
  return useMutation({
    ...options,
    mutationFn: async (payload: AddTripPlacePayload) => {
      const place = await upsertPlace(payload.provider, payload.externalId, {
        name: payload.name,
        address: payload.address,
        lat: payload.lat,
        lng: payload.lng,
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
