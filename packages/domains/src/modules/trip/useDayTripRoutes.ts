import { useMemo } from "react";
import { arrayIncludes, assert } from "../../utils";
import { useTripPlaces } from "./useTripPlaces";
import { useTripRoutes } from "./useTripRoutes";

type Params = {
  tripId: string;
  date: string;
};

export function useDayTripRoutes({ tripId, date }: Params) {
  const { data: allPlaces } = useTripPlaces(tripId);
  const {
    data: { routes: allRoutes, tripDates },
    update,
    ...result
  } = useTripRoutes(tripId);
  assert(arrayIncludes(tripDates, date), "여행 일자에 포함되지 않습니다.");

  const routes = useMemo(() => {
    return allRoutes.filter((x) => x.scheduledDate === date);
  }, [date, allRoutes]);

  const routesWithPlace = useMemo(() => {
    return routes.map(({ placeIds, placeMemos, ...route }) => ({
      ...route,
      placeIds,
      places: placeIds
        .map((id) => allPlaces.find((x) => x.id === id))
        .filter((x) => !!x)
        .map((x) => ({ ...x, routeNotes: placeMemos?.[x.id] ?? [] })),
    }));
  }, [routes, allPlaces]);

  return {
    ...result,
    data: { routes: routesWithPlace, tripDates },
    update,
  };
}
useDayTripRoutes.key = useTripRoutes.key;
