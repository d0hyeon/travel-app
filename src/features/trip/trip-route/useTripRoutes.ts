import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoutesByTripId, routeKey, createRoute, updateRoute, deleteRoute } from "../../route/route.api";
import { assert } from "../../../shared/lib/assert";
import { useTrip } from "../useTrip";
import { mergeQueriesStatus } from "../../../shared/utils/merges";

export function useTripRoutes(id: string) {
  const queryClient = useQueryClient();
  const { data: trip, ...tripQueries } = useTrip(id);

  const { data: routes, ...routeQueries } = useSuspenseQuery({
    queryKey: useTripRoutes.key(id),
    queryFn: async () => {
      const data = await getRoutesByTripId(id);
      assert(!!data, '데이터를 찾을수 없습니다.');
      return data;
    },
  });

  const { mutate: create } = useMutation({
    mutationFn: (params: OmitPartial<Parameters<typeof createRoute>[0], 'name' | 'tripId' | 'scheduledDate'>) => {
      return createRoute({
        placeIds: [],
        isMain: false,
        placeMemos: {},
        ...params,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripRoutes.key(id) });
    },
  });

  const { mutate: update } = useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Parameters<typeof updateRoute>[1] }) =>
      updateRoute(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripRoutes.key(id) });
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripRoutes.key(id) });
    },
  });

  return {
    data: { trip, routes },
    create,
    update,
    remove,
    ...mergeQueriesStatus(tripQueries, routeQueries)
  }
}

useTripRoutes.key = (id: string) => [routeKey, id];

type OmitPartial<T, Key extends keyof T> = Partial<Omit<T, Key>> & Pick<T, Key>;