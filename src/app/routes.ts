import { type RouteConfig, index, route } from "@react-router/dev/routes";

export const AppRoute = {
  메인: '/',
  여행_상세: '/trip/:tripId',
  여행_생성: '/trip/new',
} as const;

export default [
  index("../features/trip/TripListPage.tsx"),
  route(AppRoute.여행_상세, "../features/trip/TripDetailPage.tsx"),
  route(AppRoute.여행_생성, "../features/trip/trip-create/TripCreatePage.tsx"),
  route("*", "NotFound.tsx"),
] satisfies RouteConfig;
