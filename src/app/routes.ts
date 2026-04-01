import { type RouteConfig, index, route } from "@react-router/dev/routes";

export const AppRoute = {
  메인: '/',
  여행_상세: '/trip/:tripId'
} as const;

export default [
  index("trip/TripListPage.tsx"),
  route(AppRoute.여행_상세, "trip/TripDetailPage.tsx"),
  route("*", "NotFound.tsx"),
] satisfies RouteConfig;
