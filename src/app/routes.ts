import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export const AppRoute = {
  메인: '/',
  전체_지출: '/expenses',
  지도: '/map',
  여행_상세: '/trip/:tripId',
  여행_생성: '/trip/new',
} as const;

export default [
  layout("../features/main/MainLayout.tsx", [
    index("../features/trip/TripListPage.tsx"),
    route(AppRoute.전체_지출, "../features/statistics/StatisticsPage.tsx"),
    route(AppRoute.지도, "../features/map/MapPage.tsx"),
  ]),
  route(AppRoute.여행_상세, "../features/trip/TripDetailPage.tsx"),
  route(AppRoute.여행_생성, "../features/trip/trip-create/TripCreatePage.tsx"),
  route("*", "NotFound.tsx"),
] satisfies RouteConfig;
