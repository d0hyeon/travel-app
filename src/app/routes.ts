import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export const AppRoute = {
  메인: '/',
  통계: '/statistics',
  지도: '/explorer',
  여행_상세: '/trip/:tripId',
  여행_생성: '/trip/new',
} as const;

export default [
  layout("../app/MainLayout.tsx", [
    index("../features/trip/TripListPage.tsx"),
    route(AppRoute.통계, "../features/statistics/StatisticsPage.tsx"),
    route(AppRoute.지도, "../features/placeExplorer/PlaceExplorerPage.tsx"),
  ]),
  route(AppRoute.여행_상세, "../features/trip/TripDetailPage.tsx"),
  route(AppRoute.여행_생성, "../features/trip/trip-create/TripCreatePage.tsx"),
  route("*", "NotFound.tsx"),
] satisfies RouteConfig;
