import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("trip/TripListPage.tsx"),
  route("trip/:tripId", "trip/TripDetailPage.tsx"),
  route("*", "NotFound.tsx"),
] satisfies RouteConfig;
