import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoutesByTripId, routeKey, createRoute, updateRoute, deleteRoute } from "../../route/route.api";
import { assert } from "../../../shared/lib/assert";
import { useTrip } from "../useTrip";
import { mergeQueriesStatus } from "../../../shared/utils/merges";
import { useMemo } from "react";
import { addDays, differenceInDays } from "date-fns";
import { formatDateISO } from "../../../shared/utils/formats";
import { queryClient } from "~shared/lib/query-client";

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
  
  const dates = useMemo(() => {
    const diffDays = differenceInDays(trip.endDate, trip.startDate);
    return Array.from({ length: diffDays + 1 }).map((_, day) => (
      formatDateISO(new Date(addDays(trip.startDate, day)))
    ))
  }, [trip.startDate, trip.endDate]);

  const { mutateAsync: create } = useMutation({
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

  const { mutateAsync: toggleVisible } = useMutation({
    mutationFn: (params: { routeId: string, placeId: string }) => {
      const route = routes.find(x => x.id === params.routeId);
      assert(!!route, '존재하지 않는 경로입니다.');

      return updateRoute(params.routeId, {
        hiddenPlaces: route.hiddenPlaces.includes(params.placeId)
          ? route.hiddenPlaces.filter(x => x !== params.placeId)
          : [...route.hiddenPlaces, params.placeId]
      });
    },
    onSuccess: () => {
      routeQueries.refetch();
    }
  })

  const { mutateAsync: update } = useMutation({
    mutationFn: ({ routeId, ...payload }: { routeId: string; } & Parameters<typeof updateRoute>[1]) => {
      return updateRoute(routeId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripRoutes.key(id) });
    },
  });

  const { mutateAsync: remove } = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTripRoutes.key(id) });
    },
  });

  return {
    data: { trip, routes, tripDates: dates },
    create,
    update,
    remove,
    toggleVisible,
    ...mergeQueriesStatus(tripQueries, routeQueries)
  }
}

useTripRoutes.key = (id: string) => [routeKey, id];

useTripRoutes.prefetch = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: useTripRoutes.key(id),
    queryFn: () => getRoutesByTripId(id)
  })
}

type OmitPartial<T, Key extends keyof T> = Partial<Omit<T, Key>> & Pick<T, Key>;