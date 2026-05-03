import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export const AppRoute = {
  메인: '/',
  통계: '/statistics',
  지도: '/explorer',
  여행_상세: '/trip/:tripId',
  여행_생성: '/trip/new',
  여행_초대: '/trip/invite/:shareLink',
  로그인: '/login',
  피드: '/feed',
  사용자_피드: '/u/:userId',
  포스트_생성: '/post/new',
  포스트_상세: '/post/:postId',
} as const;

export default [
  route(AppRoute.로그인, "../features/auth/LoginPage.tsx"),
  layout("../app/AuthGuardLayout.tsx", [
    layout("../app/HomeLayout.tsx", [
      index("../features/trip/TripListPage.tsx"),
      route(AppRoute.통계, "../features/statistics/StatisticsPage.tsx"),
      route(AppRoute.지도, "../features/explorer/PlaceExplorerPage.tsx"),
    ]),
    route(AppRoute.여행_상세, "../features/trip/TripDetailPage.tsx"),
    route(AppRoute.여행_생성, "../features/trip/trip-create/TripCreatePage.tsx"),
    route(AppRoute.여행_초대, "../features/trip/trip-invite/TripInvitePage.tsx"),
    // photo feed (제거 시 아래 4줄과 features/post 폴더만 삭제)
    route(AppRoute.피드, "../features/post/FeedPage.tsx"),
    route(AppRoute.사용자_피드, "../features/post/UserFeedPage.tsx"),
    route(AppRoute.포스트_생성, "../features/post/post-form/PostFormPage.tsx"),
    route(AppRoute.포스트_상세, "../features/post/PostDetailPage.tsx"),
  ]),
  route("*", "NotFound.tsx"),
] satisfies RouteConfig;
