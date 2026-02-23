import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoutesByTripId, routeKey, createRoute, updateRoute, deleteRoute } from "../../route/route.api";
import { assert } from "../../../shared/lib/assert";
import { useTrip } from "../useTrip";
import { mergeQueriesStatus } from "../../../shared/utils/merges";
import { useMemo } from "react";
import { addDays, differenceInDays } from "date-fns";
import { formatDateISO } from "../../../shared/utils/formats";

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

  const { mutateAsync: update } = useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Parameters<typeof updateRoute>[1] }) => {
      return updateRoute(routeId, data);
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
    ...mergeQueriesStatus(tripQueries, routeQueries)
  }
}

useTripRoutes.key = (id: string) => [routeKey, id];

type OmitPartial<T, Key extends keyof T> = Partial<Omit<T, Key>> & Pick<T, Key>;