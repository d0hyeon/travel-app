import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";
import { AppRoute } from "@waylog/routes";

export default [
  route(AppRoute.로그인, "../features/auth/LoginPage.tsx"),
  layout("../app/HomeLayout.tsx", [
    layout("./AuthGuardLayout.tsx", { id: "HOME_AUTH_LAYOUT" }, [
      index("../features/trip/trip-list/TripListPage.tsx"),
      route(
        AppRoute.유저_프로필,
        "../features/user-profile/UserProfilePage.tsx",
      ),
      route(AppRoute.통계, "../features/statistics/StatisticsPage.tsx"),
    ]),
    route(AppRoute.피드, "../features/post/FeedPage.tsx"),
    route(AppRoute.탐색, "../features/explorer/PlaceExplorerPage.tsx"),
  ]),
  layout("./AuthGuardLayout.tsx", [
    layout("../features/settings/SettingsLayout.tsx", [
      route(AppRoute.설정, "../features/settings/SettingsPage.tsx"),
      route(
        `${AppRoute.설정}/profile`,
        "../features/settings/SettingsProfilePage.tsx",
      ),
    ]),
    route(AppRoute.여행_상세, "../features/trip/TripDetailPage.tsx"),
    route(AppRoute.여행_채팅, "../features/trip/TripChatPage.tsx"),
    route(
      AppRoute.여행_메모_상세,
      "../features/trip/trip-memo/TripMemoDetailPage.tsx",
    ),
    route(
      AppRoute.여행_메모_편집,
      "../features/trip/trip-memo/TripMemoEditPage.tsx",
    ),
    route(
      AppRoute.여행_생성,
      "../features/trip/trip-create/TripCreatePage.tsx",
    ),
    route(
      AppRoute.여행_교통편_추가,
      "../features/trip/trip-transport/transport-creation/TripTransportCreationPage.tsx",
    ),
    route(
      AppRoute.여행_교통편_상세,
      "../features/trip/trip-transport/transport-detail/TransportDetailPage.tsx",
    ),
    route(
      AppRoute.여행_초대,
      "../features/trip/trip-invite/TripInvitePage.tsx",
    ),
    route(AppRoute.포스트_생성, "../features/post/post-form/PostFormPage.tsx"),
  ]),
  route(AppRoute.포스트_상세, "../features/post/PostDetailPage.tsx"),
  route(
    AppRoute.장소_상세,
    "../features/place/place-detail/PlaceDetailPage.tsx",
  ),
  route(
    AppRoute.장소_최다방문순,
    "../features/explorer/explorer-ranking/TopVisitedPage.tsx",
  ),
  route(
    AppRoute.장소_급상승,
    "../features/explorer/explorer-recent/RecentHotPage.tsx",
  ),
  route(
    AppRoute.장소_저장순,
    "../features/explorer/explorer-saved/MostSavedPage.tsx",
  ),

  route("*", "NotFound.tsx"),
] satisfies RouteConfig;
