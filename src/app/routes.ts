import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export const AppRoute = {
  메인: '/',
  통계: '/statistics',
  탐색: '/explorer',
  여행_상세: '/trip/:tripId',
  여행_생성: '/trip/new',
  여행_초대: '/trip/invite/:shareLink',
  로그인: '/login',
  피드: '/feed',
  장소_상세: '/place/:placeId',
  사용자_피드: '/u/:userId',
  포스트_생성: '/post/new',
  포스트_상세: '/post/:postId',
  어드민_여행_목록: '/admin/trips',
  탐색_최다방문: '/explorer/top-visited',
  탐색_최근핫플: '/explorer/recent-hot',
} as const;

export default [
  route(AppRoute.로그인, "../features/auth/LoginPage.tsx"),
  layout("../app/AuthGuardLayout.tsx", [
    layout("../app/HomeLayout.tsx", [
      index("../features/trip/trip-list/TripListPage.tsx"),
      route(AppRoute.피드, "../features/post/FeedPage.tsx"),
      route(AppRoute.사용자_피드, "../features/user-profile/UserProfilePage.tsx"),
      route(AppRoute.통계, "../features/statistics/StatisticsPage.tsx"),
      route(AppRoute.탐색, "../features/explorer/PlaceExplorerPage.tsx"),
    ]),
    route(AppRoute.여행_상세, "../features/trip/TripDetailPage.tsx"),
    route(AppRoute.여행_생성, "../features/trip/trip-create/TripCreatePage.tsx"),
    route(AppRoute.여행_초대, "../features/trip/trip-invite/TripInvitePage.tsx"),
    // photo feed (제거 시 아래 2줄과 features/post 폴더만 삭제)
    route(AppRoute.포스트_생성, "../features/post/post-form/PostFormPage.tsx"),
    route(AppRoute.포스트_상세, "../features/post/PostDetailPage.tsx"),
    route(AppRoute.장소_상세, "../features/place/place-detail/PlaceDetailPage.tsx"),
    route(AppRoute.어드민_여행_목록, "../features/admin/AdminTripListPage.tsx"),
    route(AppRoute.탐색_최다방문, "../features/explorer/explorer-ranking/TopVisitedPage.tsx"),
    route(AppRoute.탐색_최근핫플, "../features/explorer/explorer-recent/RecentHotPage.tsx"),
  ]),
  route("*", "NotFound.tsx"),
] satisfies RouteConfig;
