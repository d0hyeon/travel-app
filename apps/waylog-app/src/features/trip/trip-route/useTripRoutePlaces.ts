import { useDayTripRoutes } from "@waylog/domains/modules/trip";
import { useMemo } from "react";
import { useQueryParamState } from "../../../shared/hooks/useQueryParamState";
import { useRouteLegs } from "./trip-route-leg/useRouteLegs";

interface Params {
  tripId: string;
  date: string;
}

// 선택된 route의 도메인 데이터를, 지도·리스트가 그대로 소비할 수 있는 뷰 형태로 만들어 제공한다.
// 숨긴 장소 제외, 도로 경로(leg) 조회 같은 가공 절차는 이 훅 안에서 완결한다.
export function useTripRoutePlaces({ tripId, date }: Params) {
  const {
    data: { routes, tripDates },
    update,
  } = useDayTripRoutes({ tripId, date });

  const [routeId, setRouteId] = useQueryParamState<string>("route-id", {
    defaultValue: () => routes[0]?.id ?? "",
  });

  const currentRoute = useMemo(
    () => routes.find((route) => route.id === routeId) ?? routes[0],
    [routes, routeId],
  );

  const visiblePlaces = useMemo(
    () =>
      currentRoute?.places.filter(
        (place) => !currentRoute.hiddenPlaces.includes(place.id),
      ) ?? [],
    [currentRoute],
  );
  const legs = useRouteLegs(visiblePlaces);

  return {
    data: {
      routes,
      tripDates,
      currentRoute,
      currentPlaces: currentRoute?.places ?? [],
      legs,
    },
    setRouteId,
    update,
  };
}
