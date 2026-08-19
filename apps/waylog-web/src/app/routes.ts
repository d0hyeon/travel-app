import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export const AppRoute = {
  메인: '/',
  통계: '/statistics',
  탐색: '/explorer',
  여행_상세: '/trip/:tripId',
  여행_채팅: '/trip/:tripId/chat',
  여행_메모_상세: '/trip/:tripId/memo/:memoId',
  여행_메모_편집: '/trip/:tripId/memo/:memoId/edit',
  여행_생성: '/trip/new',
  여행_초대: '/trip/invite/:shareLink',
  로그인: '/login',
  피드: '/feed',
  장소_상세: '/place/:placeId',
  유저_프로필: '/u/:userId',
  포스트_생성: '/post/new',
  포스트_상세: '/post/:postId',
  어드민_여행_목록: '/admin/trips',
  장소_최다방문순: '/explorer/top-visited',
  장소_급상승: '/explorer/recent-hot',
  장소_저장순: '/explorer/most-saved',
} as const;

export default [
  route(AppRoute.로그인, "../features/auth/LoginPage.tsx"),
  layout("../app/HomeLayout.tsx", [
    layout('./AuthGuardLayout.tsx', { id: 'HOME_AUTH_LAYOUT'}, [
      index("../features/trip/trip-list/TripListPage.tsx"),
      route(AppRoute.유저_프로필, "../features/user-profile/UserProfilePage.tsx"),
      route(AppRoute.통계, "../features/statistics/StatisticsPage.tsx"),
    ]),
    route(AppRoute.피드, "../features/post/FeedPage.tsx"),
    route(AppRoute.탐색, "../features/explorer/PlaceExplorerPage.tsx"),
  ]),
  layout("./AuthGuardLayout.tsx", [
    route(AppRoute.여행_상세, "../features/trip/TripDetailPage.tsx"),
    route(AppRoute.여행_채팅, "../features/trip/TripChatPage.tsx"),
    route(AppRoute.여행_메모_상세, "../features/trip/trip-memo/TripMemoDetailPage.tsx"),
    route(AppRoute.여행_메모_편집, "../features/trip/trip-memo/TripMemoEditPage.tsx"),
    route(AppRoute.여행_생성, "../features/trip/trip-create/TripCreatePage.tsx"),
    route(AppRoute.여행_초대, "../features/trip/trip-invite/TripInvitePage.tsx"),
    route(AppRoute.포스트_생성, "../features/post/post-form/PostFormPage.tsx"),
  ]),
  route(AppRoute.포스트_상세, "../features/post/PostDetailPage.tsx"),
  route(AppRoute.장소_상세, "../features/place/place-detail/PlaceDetailPage.tsx"),
  route(AppRoute.장소_최다방문순, "../features/explorer/explorer-ranking/TopVisitedPage.tsx"),
  route(AppRoute.장소_급상승, "../features/explorer/explorer-recent/RecentHotPage.tsx"),
  route(AppRoute.장소_저장순, "../features/explorer/explorer-saved/MostSavedPage.tsx"),
    
  route("*", "NotFound.tsx"),
] satisfies RouteConfig;
