import { useCallback, useMemo } from "react";
import { arrayIncludes,  assert} from "~shared/utils/types";
import { useTripPlaces } from "../trip-place/useTripPlaces";
import { useTripRoutes } from "./useTripRoutes";

type Params = {
  tripId: string;
  date: string;
}

type UpdateMemoParams = {
  routeId: string;
  placeId: string;
  memos: string[];
}

export function useDayTripRoutes({ tripId, date }: Params) {
  const { data: allPlaces } = useTripPlaces(tripId);
  const {
    data: { routes: allRoutes, tripDates },
    update,
    ...result
  } = useTripRoutes(tripId);
  assert(arrayIncludes(tripDates, date), '여행 일자에 포함되지 않습니다.');

  const routes = useMemo(() => {
    return allRoutes.filter(x => x.scheduledDate === date);
  }, [date, allRoutes])

  const routesWithPlace = useMemo(() => {
    return routes.map(({ placeIds, placeMemos, ...route }) => ({
      ...route,
      placeIds,
      places: placeIds
        .map(id => allPlaces.find(x => x.id === id))
        .filter(x => !!x)
        .map((x) => ({ ...x, routeNotes: placeMemos?.[x.id] ?? [] }))
    }))
  }, [routes, allPlaces]);


  const updateNotes = useCallback(({ memos, placeId, routeId }: UpdateMemoParams) => {
    const targetRoute = routes.find(x => x.id === routeId);
    if (targetRoute == null) return;

    return update({
      routeId,
      placeMemos: { ...targetRoute.placeMemos, [placeId]: memos }
    })
  }, [routes]);

  return {
    ...result,
    data: { routes: routesWithPlace, tripDates },
    update,
    updateNotes,
  }
}