import { useMutation, useSuspenseQuery, type MutationOptions } from "@tanstack/react-query";
import {
  createTripPlace,
  deleteTripPlace,
  getTripPlacesByTripId,
  placeKey,
  updateTripPlace,
  upsertPlace,
} from "../place";
import type { PlaceCategoryType, PlaceStatus, TripPlace } from "../place";
import { tripKey } from "./trip.api";
import { TRIP_PLAN_REFETCH } from "./tripPlanRefetch";

export function useTripPlaces(tripId: string) {
  const { data, refetch, ...queries } = useSuspenseQuery(useTripPlaces.query(tripId))

  const create = useAddTripPlace(tripId, {
    onSuccess: () => refetch(),
  })

  const update = useMutation({
    mutationFn: async ({
      id,
      placeId,
      category,
      memo,
      tags,
      status,
    }: {
      id?: string
      /** @deprecated trip place 식별자는 id를 사용. 구 호출부 호환용 */
      placeId?: string
      /** null은 미설정. 생략하면 기존 값을 유지한다 */
      category?: PlaceCategoryType | null
      memo?: string
      tags?: string[]
      status?: PlaceStatus
    }) => {
      const tripPlaceId = id ?? placeId
      if (!tripPlaceId) throw new Error('useTripPlaces.update: id is required')
      return updateTripPlace(tripPlaceId, { category, memo, tags, status })
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
// 소비처가 자기 QueryClient 로 prefetch 한다.
// 패키지가 QueryClient 를 알 필요가 없다.
useTripPlaces.query = (id: string) => ({
  queryKey: useTripPlaces.key(id),
  queryFn: () => getTripPlacesByTripId(id),
  ...TRIP_PLAN_REFETCH,
})
