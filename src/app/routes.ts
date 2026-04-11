import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export const AppRoute = {
  메인: '/',
  통계: '/statistics',
  지도: '/explorer',
  여행_상세: '/trip/:tripId',
  여행_생성: '/trip/new',
  여행_초대: '/trip/invite/:shareLink',
  로그인: '/login',
} as const;

export default [
  route(AppRoute.로그인, "../features/auth/LoginPage.tsx"),
  layout("../app/AuthLayout.tsx", [
    layout("../app/MainLayout.tsx", [
      index("../features/trip/TripListPage.tsx"),
      route(AppRoute.통계, "../features/statistics/StatisticsPage.tsx"),
      route(AppRoute.지도, "../features/placeExplorer/PlaceExplorerPage.tsx"),
    ]),
    route(AppRoute.여행_상세, "../features/trip/TripDetailPage.tsx"),
    route(AppRoute.여행_생성, "../features/trip/trip-create/TripCreatePage.tsx"),
    route(AppRoute.여행_초대, "../features/trip/trip-invite/TripInvitePage.tsx"),
  ]),
  route("*", "NotFound.tsx"),
] satisfies RouteConfig;
