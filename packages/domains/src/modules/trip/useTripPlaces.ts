import {
  keepPreviousData,
  useMutation,
  type MutationOptions,
  type UseMutateAsyncFunction,
  type UseMutationResult,
  type UseSuspenseQueryResult,
} from "@tanstack/react-query";
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
import { TRIP_PLAN_REFETCH } from "../tripPlanRefetch";
import { useSuspenseQuery, type UseSuspenseQueryOptions } from "@waylog/react";

type QueryOptions = Omit<
  UseSuspenseQueryOptions<TripPlace[]>,
  "queryKey" | "queryFn"
>;

type MutationAction<Data, Variables> = UseMutateAsyncFunction<Data, Error, Variables> &
  UseMutationResult<Data, Error, Variables>;

interface UpdateTripPlaceParams {
  id?: string;
  /** @deprecated trip place 식별자는 id를 사용. 구 호출부 호환용 */
  placeId?: string;
  /** null은 미설정. 생략하면 기존 값을 유지한다 */
  category?: PlaceCategoryType | null;
  memo?: string;
  tags?: string[];
  status?: PlaceStatus;
}

type TripPlacesResult<Data> = UseSuspenseQueryResult<Data> & {
  create: MutationAction<TripPlace, AddTripPlacePayload>;
  update: MutationAction<TripPlace | undefined, UpdateTripPlaceParams>;
  remove: MutationAction<boolean, string>;
};

export function useTripPlaces(
  tripId: string,
  options: QueryOptions & { enabled?: true },
): TripPlacesResult<TripPlace[]>;
export function useTripPlaces(
  tripId: string,
  options: QueryOptions & { enabled?: boolean },
): TripPlacesResult<TripPlace[] | undefined>;

export function useTripPlaces(tripId: string): TripPlacesResult<TripPlace[]>;
export function useTripPlaces(tripId: string, options?: QueryOptions) {
  const { data, refetch, ...queries } = useSuspenseQuery(
    useTripPlaces.query(tripId, options),
  );

  const create = useAddTripPlace(tripId, {
    onSuccess: () => refetch(),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      placeId,
      category,
      memo,
      tags,
      status,
    }: UpdateTripPlaceParams) => {
      const tripPlaceId = id ?? placeId;
      if (!tripPlaceId) throw new Error("useTripPlaces.update: id is required");
      return updateTripPlace(tripPlaceId, { category, memo, tags, status });
    },
    onSuccess: () => refetch(),
  });

  const remove = useMutation({
    mutationFn: deleteTripPlace,
    onSuccess: () => refetch(),
  });

  return {
    data,
    create: Object.assign(create.mutateAsync, create),
    update: Object.assign(update.mutateAsync, update),
    remove: Object.assign(remove.mutateAsync, remove),
    refetch,
    ...queries,
  };
}

export interface PlaceDraft {
  provider: string;
  externalId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: PlaceCategoryType;
}

export type AddTripPlacePayload = { placeId: string } | PlaceDraft;

export function useAddTripPlace(
  tripId: string,
  options?: Omit<
    MutationOptions<TripPlace, Error, AddTripPlacePayload>,
    "mutationFn"
  >,
) {
  return useMutation({
    ...options,
    mutationFn: async (payload: AddTripPlacePayload) => {
      if ("placeId" in payload) {
        return createTripPlace({ tripId, placeId: payload.placeId });
      }

      const place = await upsertPlace(payload.provider, payload.externalId, {
        name: payload.name,
        address: payload.address,
        lat: payload.lat,
        lng: payload.lng,
        category: payload.category,
      });
      return createTripPlace({ tripId, placeId: place.id });
    },
  });
}

useTripPlaces.key = (id: string) => [tripKey, placeKey, id];
// 소비처가 자기 QueryClient 로 prefetch 한다.
// 패키지가 QueryClient 를 알 필요가 없다.
useTripPlaces.query = (id: string, options?: QueryOptions) => ({
  queryKey: useTripPlaces.key(id),
  queryFn: () => getTripPlacesByTripId(id),
  // 무효화 뒤 재조회하는 동안 이전 목록을 그대로 보여준다.
  // 이게 없으면 useSuspenseQuery 가 다시 suspend 해서 화면 전체가 폴백으로 바뀐다.
  placeholderData: keepPreviousData,
  ...TRIP_PLAN_REFETCH,
  ...options,
});
