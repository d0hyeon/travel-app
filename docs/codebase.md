# 코드베이스 레퍼런스

프로젝트 구조와 주요 패턴을 빠르게 파악하기 위한 참조 문서.

> **경로 표기 규칙**
> 이 문서에서 `src/`로 시작하는 경로는 모두 `apps/waylog-web/` 기준이다.
> (예: `packages/domains/src/api/client.ts` → `apps/waylog-web/src/api/client.ts`)
> 워크스페이스 루트 기준 경로는 `apps/`, `packages/`처럼 최상위 디렉토리부터 적는다.

---

## 기술 스택

공통

| 분류     | 기술                               |
| -------- | ---------------------------------- |
| Monorepo | pnpm workspace                     |
| Language | TypeScript 5.9                     |
| State    | Zustand 5 + TanStack React Query 5 |
| Backend  | Supabase (DB + Storage)            |
| Forms    | React Hook Form 7                  |

웹 (`apps/waylog-web`)

| 분류      | 기술                                          |
| --------- | --------------------------------------------- |
| Framework | React 19 + React Router 7 (CSR, `ssr: false`)  |
| Build     | Vite 7                                        |
| UI        | Material-UI 7 + Tailwind CSS                  |
| Maps      | Kakao Maps / Google Maps (국내외 분기)        |

앱 (`apps/waylog-app`)

| 분류      | 기술                                             |
| --------- | ------------------------------------------------ |
| Native    | Expo SDK 54 + React Native 0.81.5                |
| Routing   | Expo Router 6 (파일 기반)                        |
| UI        | `@emotion/native` 자체 구축 + MUI 호환 shim       |
| Maps      | `react-native-maps` (Google 단일)                |
| Animation | Reanimated 4 + Gesture Handler 2                 |

앱 UI 는 웹 MUI 와 같은 인터페이스를 갖는 얇은 shim(`shared/components/mui/`)을 두어
웹 화면을 복사해 오고 컴포넌트만 바꾸는 방식으로 이관한다.
바텀시트·정렬 목록처럼 손이 많이 가는 것은 직접 구현한다 — 아래 "주요 패턴" 참조.

여행 상세 5개 탭의 웹-앱 대조 기준은
[`docs/app-trip-feature-definition.md`](./app-trip-feature-definition.md)와
[`docs/app-trip-ui-definition.md`](./app-trip-ui-definition.md)에 기록한다.
앱 지도 렌더링은 Google 단일이며, 장소 검색과 경로찾기 provider는 Google/Kakao
양쪽을 지원한다.

---

## 라우팅

```
/                              → TripListPage
/feed                          → FeedPage
/statistics                    → StatisticsPage
/explorer                      → PlaceExplorerPage
/explorer/top-visited          → TopVisitedPage
/explorer/recent-hot           → RecentHotPage
/explorer/most-saved           → MostSavedPage
/trip/:tripId                  → TripDetailPage
/trip/:tripId/chat             → TripChatPage
/trip/:tripId/memo/:memoId     → TripMemoDetailPage
/trip/:tripId/memo/:memoId/edit→ TripMemoEditPage
/trip/new                      → TripCreatePage
/trip/invite/:shareLink        → TripInvitePage
/place/:placeId                → PlaceDetailPage
/u/:userId                     → UserProfilePage
/post/new                      → PostFormPage
/post/:postId                  → PostDetailPage
/admin/trips                   → (어드민 여행 목록)
/login                         → LoginPage
*                              → NotFound
```

**파일 위치:** `src/app/routes.ts` — `AppRoute` 상수로 라우트 경로 관리

**렌더링 모드:** `react-router.config.ts`의 `ssr: false` — 서버 렌더링 없는 CSR(SPA)이다.
서버에서 실행되는 코드가 없으므로 hydration 불일치를 고려할 필요가 없고,
`new Date()`·`window`·`localStorage`를 모듈 최상위에서 써도 안전하다.

레이아웃 구조:

- `AuthGuardLayout` — 인증 필요 라우트를 감싸는 레이아웃
- `HomeLayout` — 하단 탭 네비게이션이 있는 홈 레이아웃 (메인·피드·통계·탐색)
- `TripDetailPage`는 모바일/데스크탑 분기:
  - `src/features/trip/TripDetailPage.mobile.tsx` — 탭 기반 내비게이션
  - `src/features/trip/TripDetailPage.desktop.tsx` — 사이드바 레이아웃

---

## 디렉토리 구조

### 워크스페이스 레이아웃

```
apps/
├── waylog-app/                 # 네이티브 앱 (Expo SDK 54 + RN 0.81)
│   ├── app/                    # Expo Router 라우트 (파일 기반)
│   │   ├── _layout.tsx         # Provider 구성 (QueryClient·Auth·Overlay)
│   │   ├── index.tsx           # 여행 목록
│   │   ├── login.tsx
│   │   └── trip/[tripId]/      # 상세 탭 셸 (정보·장소·계획·정산·사진)
│   ├── ios/                    # prebuild 산출물 (gitignore, 네이티브 빌드용)
│   ├── src/
│   │   ├── features/           # 웹 features 구조를 미러링
│   │   └── shared/
│   │       ├── components/
│   │       │   ├── mui/        # MUI 호환 계층 — 웹 코드를 그대로 옮기기 위함
│   │       │   ├── Map/        # react-native-maps 구현
│   │       │   ├── bottom-sheet/ # 자체 구현 (Reanimated) — 웹과 같은 공개 API
│   │       │   ├── date-picker/ # 날짜·기간·시각 선택 (바텀시트 + 스와이프 달력)
│   │       │   └── dnd/        # 제스처 기반 정렬 목록 (드래그 핸들)
│   │       ├── config/tokens.ts # 웹 theme.ts 에서 승계한 값
│   │       └── hooks/          # useOverlay·useQueryParamState (웹과 동일 시그니처)
│   ├── metro.config.js         # 워크스페이스 해석 설정
│   └── app.config.ts
└── waylog-web/                 # 웹 앱 (React Router 7 + Vite)
    ├── src/                    # 아래 "앱 내부 구조" 참조
    ├── e2e/                    # Playwright 스펙
    ├── public/                 # 정적 자산 + 서비스워커 산출물
    ├── package.json            # 앱 의존성·스크립트
    ├── tsconfig.json           # 앱 프로젝트 레퍼런스 루트
    └── vite.config.ts 등       # 앱 빌드·테스트 설정
packages/
├── domains/                    # @waylog/domains — 도메인·데이터 계층
│   └── src/
│       ├── api/                # supabase 클라이언트(initApi 주입), 생성 타입
│       ├── auth/               # 인증 API·useAuth
│       ├── expense/            # 지출(순수 로직·데이터 계층)
│       ├── location/           # 위치 vocabulary
│       ├── marine-activity/    # 해양 활동
│       ├── map/                # 좌표·마커 타입, 클러스터링(순수)
│       ├── photo/              # 사진 조회·삭제·수정
│       ├── place/              # 장소 조회·검색·추가
│       ├── route/              # 경로 (도로 경로 어댑터 포함)
│       ├── tourism-trend/      # 관광 트렌드
│       ├── trip/               # 여행 (목록·경로·장소 데이터 계층, 최근접 장소 탐색)
│       ├── trip-checklist/     # 여행 준비물
│       ├── trip-member/        # 여행 멤버
│       ├── trip-memo/          # 여행 메모
│       ├── user-profile/       # 유저 프로필
│       └── utils/              # 순수 유틸(포맷·좌표·URL·지오)
└── react/                      # @waylog/react — 플랫폼 비의존 훅
supabase/                       # DB 마이그레이션·엣지 함수
tools/                          # eslint 커스텀 룰
package.json                    # 워크스페이스 루트 (앱으로 위임하는 스크립트)
eslint.config.js                # 레포 전역 lint 설정 + 의존성
```

**스크립트 실행:** 루트의 `dev`·`build`·`test`·`test:e2e`·`ts-check`는
`pnpm --filter waylog-web`으로 앱에 위임한다. `lint`만 루트에서 직접 실행한다
(`eslint.config.js`가 레포 전역이라 그 의존성도 루트에 있다).

**환경변수:** 웹은 `apps/waylog-web/.env`(Vite), 앱은 `apps/waylog-app/.env`를
`app.config.ts`가 읽어 `extra`로 넘긴다.

### 공유 경계

> UI 상태·기기 상태는 플랫폼별, 서버 데이터·도메인 규칙은 공유.

| 대상 | 위치 |
| --- | --- |
| Supabase 쿼리, 도메인 로직·타입, 도메인 훅 | `@waylog/domains` |
| 플랫폼 비의존 React 훅 | `@waylog/react` |
| 컴포넌트, 라우팅, 애니메이션, 스토리지, 디바이스 권한 | 각 앱 |

공유 패키지가 지켜야 하는 것:

- 환경변수를 직접 읽지 않는다. 각 앱이 `initApi()` / `initQueryClient()`로 주입한다
- 컴포넌트(`.tsx`)를 두지 않는다
- MUI·react-router·브라우저 전역 API(`window`, `document`, `HTMLElement`,
  `requestAnimationFrame`, `localStorage`, IndexedDB 등)에 의존하지 않는다

이 기준 때문에 웹에 남은 것들:

| 대상 | 이유 |
| --- | --- |
| `photo.api`의 업로드 함수 | HEIC 변환(`heic-to`)·리사이즈 의존 |
| `roadRoute.schema` | IndexedDB(`schema-idb`) 의존 |
| push subscription 함수 3개 | 웹 표준 `PushSubscription` 타입 의존 |
| `useExpenses` 등 일부 훅 | 웹 전용 계층을 물고 있음 |
| 스크롤·포인터·애니메이션 훅 | DOM 이벤트·`requestAnimationFrame` 의존 |

**supabase 클라이언트:** `.api.ts` 전체가 `import { supabase }`로 모듈 스코프
인스턴스를 쓴다. 인스턴스 생성만 앱으로 옮기기 위해 Proxy 지연 초기화를 쓴다.
초기화 전에 접근하면 명확한 에러를 던진다.

### 앱 내부 구조

경로는 `apps/waylog-web/` 기준이다.

```
src/
├── app/                        # 애플리케이션 컨텍스트
│   ├── routes.ts               # 라우트 정의 (AppRoute 상수 포함)
│   ├── root.tsx                # 루트 레이아웃 & 전역 Provider
│   ├── AuthGuardLayout.tsx     # 인증 필요 라우트 가드
│   ├── HomeLayout.tsx          # 하단 탭 네비게이션 레이아웃
│   ├── env.ts                  # 환경변수
│   └── query-client.ts         # React Query 설정
│
├── api/                        # 외부 시스템 어댑터
│   ├── client.ts               # Supabase 클라이언트
│   ├── _database.types.ts      # Supabase 자동 생성 타입 (직접 수정 금지)
│   └── tables.types.ts         # 테이블 Row 타입 헬퍼
│
├── features/                   # 도메인별 기능 모듈
│   ├── admin/                  # 어드민 (여행 목록)
│   ├── auth/                   # 인증
│   │   ├── auth.api.ts
│   │   ├── useAuth.ts
│   │   ├── useWebPushSubscription.ts
│   │   ├── LoginPage.tsx
│   │   └── AuthNavigate.tsx
│   │
│   ├── expense/                # 지출 도메인
│   │   ├── expense.api.ts
│   │   ├── expense.types.ts    # Expense, SettlementBalance 등 타입
│   │   ├── expense.utils.ts    # calculateBalancesInKRW, calculateSettlements
│   │   ├── currency.ts         # 환율 변환 (convertToKRW)
│   │   └── useExpenses.ts
│   │
│   ├── explorer/               # 장소 탐색 (방문 기록 기반 지도)
│   │   ├── explorer.api.ts
│   │   ├── explorer.utils.ts
│   │   ├── useAttentionPlaces.ts
│   │   ├── useLocationsCoordinates.ts
│   │   ├── useVisitedPlaces.ts
│   │   ├── PlaceExplorerPage.tsx
│   │   ├── ExplorerMap.tsx
│   │   ├── ExplorerCatalog.tsx
│   │   ├── explorer-detail/    # 장소 상세 오버레이/패널
│   │   ├── explorer-filters/   # 필터 (카테고리·위치)
│   │   ├── explorer-place-item/ # PlaceCard, PlaceListItem
│   │   ├── explorer-ranking/   # 최다 방문 순위
│   │   ├── explorer-recent/    # 급상승 장소
│   │   ├── explorer-saved/     # 저장 순위
│   │   ├── explorer-seasonal-regions/ # 계절 인기 지역 큐레이션
│   │   └── explorer-view/      # 뷰 모드 토글
│   │
│   ├── intro/                  # 인트로 배너
│   ├── location/               # 위치 vocabulary (Location, Region, Country)
│   │   ├── location.model.ts
│   │   ├── location.constants.ts
│   │   ├── location.utils.ts
│   │   ├── country.model.ts
│   │   ├── LocationForm.tsx
│   │   └── index.ts
│   │
│   ├── photo/                  # 사진 도메인
│   │   ├── photo.api.ts
│   │   └── photo.types.ts
│   │
│   ├── place/                  # 장소/POI 도메인
│   │   ├── place.api.ts
│   │   ├── place.types.ts
│   │   ├── usePlace.ts
│   │   ├── usePlacePhotos.ts
│   │   ├── PlaceMap.tsx
│   │   ├── PlacePhotoList.tsx
│   │   ├── PlaceInfoWidget.tsx
│   │   ├── place-detail/       # 장소 상세 (페이지 / 사이드시트·풀스크린 오버레이: usePlaceDetailOverlay)
│   │   └── place-search/       # 장소 검색 (BottomSheet / Dialog)
│   │
│   ├── post/                   # 포스트/피드 도메인
│   │   ├── post.api.ts
│   │   ├── post.types.ts
│   │   ├── useFeed.ts
│   │   ├── usePost.ts
│   │   ├── usePostLikes.ts
│   │   ├── useUserFeed.ts
│   │   ├── FeedPage.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostDetailPage.tsx
│   │   ├── PostFeed.tsx
│   │   ├── PostLikeButton.tsx
│   │   ├── PostMenu.tsx
│   │   ├── PostScreen.tsx
│   │   ├── place-feed/         # 장소별 피드
│   │   └── post-form/          # 포스트 작성 마법사
│   │
│   ├── route/                  # 경로 도메인
│   │   ├── route.api.ts
│   │   ├── route.types.ts
│   │   └── road-route/         # 실제 도로 경로 (Google Maps Directions)
│   │       ├── roadRoute.api.ts
│   │       ├── roadRoute.schema.ts
│   │       ├── useRoadRoute.ts
│   │       └── client-database.ts  # 클라이언트 사이드 캐시 DB
│   │
│   ├── statistics/             # 여행 통계
│   │   ├── statistics.utils.ts
│   │   ├── StatisticsPage.tsx
│   │   ├── StatisticsHeroPanel.tsx
│   │   ├── StatisticsOverviewSection.tsx
│   │   ├── StatisticsExpenseSection.tsx
│   │   ├── StatisticsCurrencySection.tsx
│   │   ├── StatisticsTrendChart.tsx
│   │   ├── StatisticsSectionCard.tsx
│   │   ├── StatisticsSummaryCard.tsx
│   │   ├── StatisticsViewConfigButton.tsx
│   │   └── statistics-expense/
│   │       └── useStatisticsSummary.ts
│   │
│   ├── tracking/               # 위치 추적
│   │   └── tracking.types.ts
│   │
│   ├── marine-activity/        # 해양 활동 지수 (해수욕/스킨스쿠버)
│   │   ├── marineActivity.api.ts          # 국립해양조사원 지수 어댑터
│   │   ├── marineActivity.types.ts        # 정규화 타입/등급/비활성 사유
│   │   ├── marineActivityEligibility.ts   # 국내 섬/해안 목적지 판정
│   │   ├── marineActivityPlaces.ts        # placeCode 카탈로그/최근접 장소 선택
│   │   └── useDailyMarineActivityIndices.ts
│   │
│   ├── tourism-trend/          # 공공 관광 통계 (계절별 지역 방문 추이)
│   │   ├── tourismTrend.api.ts        # 한국관광공사 관광빅데이터 어댑터
│   │   ├── tourismTrend.types.ts      # 도메인 모델/지역 레벨/방문자 구분
│   │   ├── tourismTrend.utils.ts      # 집계·중앙값 게이트·증가율 정렬
│   │   ├── tourismTrendRegions.ts     # Location → 지자체 코드 카탈로그
│   │   ├── season.ts                  # 계절 판정/날짜 범위
│   │   └── useRegionTourismTrends.ts
│   │
│   ├── weather/                # 국내·해외 일별/시간별 날씨 예보
│   │   ├── domestic-weather.api.ts # 기상청 예보 어댑터
│   │   ├── weather.api.ts      # Open-Meteo 예보 어댑터
│   │   ├── weather.types.ts
│   │   ├── useDailyWeatherForecast.ts
│   │   └── useHourlyForecast.ts
│   │
│   ├── user-profile/           # 사용자 프로필
│   │   ├── user-profile.api.ts
│   │   ├── user-profile.type.ts
│   │   ├── user-profile.utils.ts
│   │   ├── userProfile.mock.ts
│   │   ├── useUserProfile.ts
│   │   ├── useUserPhotos.ts
│   │   ├── useUserTrips.ts
│   │   ├── UserProfilePage.tsx
│   │   ├── UserProfile.tsx
│   │   ├── UserTripPhotoList.tsx
│   │   ├── ProfileHeader.tsx
│   │   ├── ProfileFeedTab.tsx
│   │   ├── ProfileRecordsTab.tsx
│   │   └── ProfileStatStrip.tsx
│   │
│   └── trip/                   # 여행 도메인 (메인 기능)
│       ├── trip.api.ts
│       ├── trip.types.ts
│       ├── trip.mock.ts
│       ├── useTrip.ts
│       ├── useTrips.ts
│       ├── useTripId.ts
│       ├── useScheduledTripDestinations.ts  # 예정된 여행 목적지 목록
│       ├── TripDetailPage.tsx              # 반응형 분기 래퍼
│       ├── TripDetailPage.mobile.tsx
│       ├── TripDetailPage.desktop.tsx
│       ├── TripChatPage.tsx                # 채팅 전용 페이지
│       ├── components/                     # 여행 공통 UI 컴포넌트
│       │   ├── TripFormDialog.tsx
│       │   ├── TripDurationEditableText.tsx
│       │   ├── TripNameEditableText.tsx
│       │   ├── TripInviteButton.tsx
│       │   ├── TripLeaveButton.tsx
│       │   └── TripLeavePopMenuItem.tsx
│       ├── hooks/                          # 여행 공통 훅
│       │   └── useTripCluastering.ts
│       │
│       ├── trip-basic-info/               # 기본 정보 탭
│       ├── trip-chat/                     # 채팅 기능
│       │   ├── tripChat.api.ts
│       │   ├── tripChat.types.ts
│       │   ├── tripChat.mock.ts
│       │   ├── useTripChatMessages.ts
│       │   ├── useTripChatOverlay.tsx
│       │   ├── useUnreadChatCount.ts
│       │   ├── ChatFab.tsx
│       │   ├── ChatIconButton.tsx
│       │   ├── ChatPushNoticeCard.tsx
│       │   ├── TripUnreadCountBadge.tsx
│       │   ├── notification/              # 푸시 알림
│       │   └── trip-chat-pannel/          # 채팅 패널 UI
│       ├── trip-marine-activity/          # 여행 계획 탭용 해양 활동 지수 바/상세
│       ├── trip-weather/                  # 여행 날짜별 날씨 UI
│       │   ├── TripWeatherForecastSheet.tsx # DayPart(am/pm) 중 실제 시간별 데이터가 있는 구간만 노출
│       │   └── TripWeatherIconButton.tsx
│       ├── trip-checklist/                # 체크리스트 탭
│       ├── trip-community-routes/         # 커뮤니티 경로 탭
│       │   ├── communityRoute.api.ts
│       │   ├── communityRoute.types.ts
│       │   ├── useCommunityRoutes.ts
│       │   └── useCommunityRouteDetail.ts
│       ├── trip-create/                   # 여행 생성 마법사 (3단계)
│       │   ├── TripCreatePage.tsx
│       │   ├── DestinationStep.tsx
│       │   ├── DateStep.tsx
│       │   └── InfoStep.tsx
│       ├── trip-expense/                  # 지출/정산 탭
│       │   ├── ExpenseForm.tsx
│       │   ├── ExpenseFormDeletationActions.tsx
│       │   ├── TripExchangeRateSettingButton.tsx
│       │   ├── routeExpenseView.utils.tsx  # ROUTE_COLORS, getRouteColor, RoutePath 공유
│       │   ├── useExpenseSummary.ts        # balances/settlements/totalInKRW 계산
│       │   ├── useExpenseFormOverlay.tsx
│       │   ├── useExpensesByPlace.ts
│       │   ├── desktop/
│       │   │   ├── ExpenseContent.desktop.tsx
│       │   │   ├── ExpenseList.desktop.tsx
│       │   │   ├── ExpenseMemberSettlements.desktop.tsx
│       │   │   ├── ExpenseSettlementGuideCard.desktop.tsx
│       │   │   ├── RouteExpenseView.desktop.tsx
│       │   │   └── SettlementSummary.desktop.tsx
│       │   └── mobile/
│       │       ├── ExpenseContent.mobile.tsx
│       │       ├── ExpenseHeader.mobile.tsx    # 총지출 + 환율 편집 헤더
│       │       ├── ExpenseList.mobile.tsx
│       │       ├── RouteExpenseView.mobile.tsx
│       │       └── SettlementSummary.tsx
│       ├── trip-invite/                   # 여행 초대
│       ├── trip-list/                     # 여행 목록 페이지
│       │   ├── TripListPage.tsx
│       │   ├── OngoingHero.tsx
│       │   ├── UpcomingCard.tsx
│       │   ├── PastTripRow.tsx
│       │   ├── CreateTripCardButton.tsx
│       │   └── trip-list.utils.ts
│       ├── trip-member/                   # 멤버 관리
│       │   ├── tripMember.api.ts
│       │   ├── tripMember.types.ts
│       │   ├── useTripMembers.ts
│       │   ├── MemberAvatar.tsx
│       │   ├── TripMemberAutocomplete.tsx
│       │   ├── TripMemberRenderer.tsx
│       │   ├── TripMemberSection.mobile.tsx
│       │   └── TripMemberSection.desktop.tsx
│       ├── trip-memo/                     # 메모 탭
│       │   ├── tripMemo.api.ts
│       │   ├── tripMemo.type.ts
│       │   ├── useTripMemo.ts
│       │   ├── TripMemo.mobile.tsx
│       │   ├── TripMemo.desktop.tsx
│       │   ├── TripMemoDetailPage.tsx
│       │   ├── TripMemoEditPage.tsx
│       │   ├── TripMemoAddButton.tsx
│       │   ├── TripMemoForm.tsx
│       │   └── TripPinnedMemos.tsx
│       ├── trip-photo/                    # 사진 탭
│       │   ├── useTripPhotos.ts
│       │   ├── TripPhotoContent.mobile.tsx
│       │   └── TripPhotoContent.desktop.tsx
│       ├── trip-place/                    # 장소 탭
│       │   ├── useTripPlaces.ts
│       │   ├── useTripPlacePhotos.ts
│       │   ├── TripPlaceContent.tsx
│       │   ├── TripPlaceContent.mobile.tsx
│       │   ├── TripPlaceContent.desktop.tsx
│       │   ├── TripPlaceAdditionButton.tsx
│       │   ├── TripPlaceItemButton.tsx
│       │   ├── TripPlaceMapFloatingControls.tsx
│       │   ├── PlacePhotoSection.tsx
│       │   └── trip-place-form/           # 장소 추가/수정 폼 & 오버레이
│       ├── trip-recommend/                # 추천 장소
│       │   ├── trip-recommend.api.ts
│       │   ├── useRecommendedPlaces.ts
│       │   ├── RecommendedMarkers.tsx
│       │   ├── RecommendedPlaceDetailOverlay.tsx
│       │   └── RecommendedPlaceListSection.tsx
│       └── trip-route/                    # 일정/경로 탭
│           ├── TripRoutesContent.mobile.tsx
│           ├── TripRoutesContent.desktop.tsx
│           ├── useTripRoutes.ts
│           ├── useDayTripRoutes.ts
│           ├── useTripViewConfig.ts
│           ├── usePlaceFormOverlay.tsx
│           ├── PlaceSelectSheet.tsx
│           ├── RouteNoteList.tsx          # 날짜 토글 아래에 해양 지수 바를 함께 배치
│           └── findNearestPlace.utils.ts  # 좌표 기준 최근접 장소 탐색 (순수 함수)
│
└── shared/                     # 공통 모듈
    ├── components/
    │   ├── Map/                # 지도 추상화 (kakao / google 구현 분기)
    │   │   ├── index.tsx       # Map, MapMarker, MapPath 등 공통 인터페이스
    │   │   ├── types.ts        # Coordinate re-export
    │   │   ├── map.constants.ts
    │   │   ├── map.utils.ts
    │   │   ├── MapContext.ts
    │   │   ├── MapTypeContext.ts
    │   │   ├── PolygonLayer.tsx
    │   │   ├── useClusterRegistry.tsx
    │   │   ├── kakao/          # Kakao Maps 구현
    │   │   └── google/         # Google Maps 구현
    │   │       ├── boundary/   # 지역 경계 데이터/지오메트리
    │   │       ├── cluster/    # 클러스터 오버레이
    │   │       └── polygon-layer/
    │   ├── animation/          # AnimatedCountText, Extrude, SlideReveal
    │   ├── bottom-sheet/
    │   ├── confirm-dialog/
    │   ├── date-range/
    │   ├── dnd/                # 드래그 앤 드롭 (@dnd-kit)
    │   ├── layout/             # TopNavigation (mobile / desktop)
    │   ├── notification-card/
    │   ├── photo/              # PhotoUploader, PhotoDialog, PhotoThumbnail, PhotoBottomSheet, PhotoVisibilityBadge, PhotoPlaceSelect
    │   ├── split-view/         # SplitView, useResizableSplit
    │   ├── statistics/         # StatisticsBarChart, StatisticsColumnChart, StatisticsDonutChart
    │   ├── BottomArea.tsx
    │   ├── BottomNavigation.tsx
    │   ├── EditableText.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── FullScreenPopup.tsx
    │   ├── IntersectionArea.tsx
    │   ├── KakaoMap.tsx
    │   ├── ListItem.tsx
    │   ├── MultiSelectDropdown.tsx
    │   ├── PopMenu.tsx
    │   ├── ResizeObserverArea.tsx
    │   ├── SwitchCase.tsx
    │   ├── TouchRippleOverlay.tsx
    │   └── ZoomArea.tsx
    │
    ├── config/
    │   └── theme.ts            # MUI 테마
    │
    ├── hooks/
    │   ├── animation/          # useAnimation, useCountdownAnimation, useDriver
    │   ├── dom/                # useElementSize
    │   ├── env/
    │   │   ├── useIsMobile.ts
    │   │   └── useCurrentCoordinate.ts
    │   ├── extends/            # useBooleanState, useDebouncedValue, useAsyncEffect 등
    │   ├── interaction/        # useScrollStatus, useDismissCallback, useScrollRestore 등
    │   ├── plugins/            # mockStorage
    │   ├── urls/
    │   │   ├── useQueryParam.ts
    │   │   ├── useQueryParamState.ts
    │   │   └── useSearchParams.tsx
    │   ├── useBatchedCallback.ts
    │   ├── useIsMounted.ts
    │   ├── useLoading.ts
    │   ├── useOverlay.tsx      # 오버레이/모달 시스템
    │   ├── useStorageState.ts
    │   └── useStorageStore.ts
    │
    ├── model/
    │   └── coordinate.model.ts # 공용 좌표 타입
    │
    └── utils/
        ├── formats.ts          # 날짜/숫자 포맷
        ├── geo.ts              # 위치 유틸
        ├── common.ts
        ├── sorts.ts
        ├── merges.ts
        ├── exif.ts
        ├── react.ts
        ├── throttle.ts
        └── types.ts
```

---

## 주요 패턴

### API / 훅 패턴

- `*.api.ts` — Supabase 직접 호출, DB row → 도메인 모델 변환
- `use*.ts` — React Query 훅으로 감싸서 컴포넌트에 제공
- DB 타입은 `packages/domains/src/api/_database.types.ts` (자동 생성, 직접 수정 금지)

### 오버레이 시스템

모달/바텀시트는 `useOverlay` 훅을 통해 명령형으로 열고 닫는다.

### 날짜 선택 (앱)

계층은 `DateField > DatePickerBottomSheet > DatePicker > Calendar` 다.
`shared/components/date-picker/` 한 디렉토리에 모여 있다.

- `DateField` — 트리거 필드. `mode` 에 따라 `value`/`onChange` 타입이 결정되는 판별 유니온이다.
  `mode="range"` 면 `[Date, Date]`, `single`·`time` 이면 `Date` 를 주고받는다.
- `DatePicker` — 보여줄 달(커서)과 고르는 중인 날짜를 쥔다. 확정은 시트가 맡는다.
- `Calendar` — 앞뒤 달을 양옆에 깔아두고 통째로 미는 스와이프 페이저.
  헤더의 좌우 버튼도 `CalendarRef.slidePrevious/slideNext` 로 같은 애니메이션을 탄다.
- 격자 계산과 기간 선택 규칙은 `calendar.utils.ts` 의 순수 함수로 분리해 두었다.
  웹 `shared/components/date-range/` 의 선택 규칙을 승계했다.
  소비처가 이 디렉토리뿐이라 공유 패키지로 올리지 않는다.

### 위치 모델링

- `Location` — 실제로 선택/표시/집계하는 구체 지명 단위. 예: `서울`, `도쿄`
- `Region` — `Location`의 상위 지역. 예: `강원도`, `간사이`
- `Country` — `Location`의 국가 메타. 예: `South Korea`, `Japan`
- `Destination` — 별도 베이스 모델이 아니라 여행 생성 UI에서 선택 가능한 `Location` 집합
- 공용 vocabulary: `packages/domains/src/location/location.model.ts`, `location.utils.ts`
- 관계형 상수는 `LocationCountry`, `LocationRegion`처럼 `ByX`보다 목적어 중심 이름을 우선

### 공용 좌표 모델

- `Coordinate`는 지도 컴포넌트 타입이 아니라 공용 값 모델
- 원천 타입: `packages/domains/src/utils/coordinate.ts`
- `shared/components/Map/types.ts`는 이를 re-export만 함

### 현재 위치 조회 (`useCurrentCoordinate`)

- `src/shared/hooks/env/useCurrentCoordinate.ts`
- 위치 권한이 `denied`가 아니면(`granted`·`prompt` 모두) `navigator.geolocation`을 호출한다.
  `prompt` 상태에서는 이 호출 자체가 브라우저 권한 팝업을 띄우는 트리거가 된다.
- `denied`일 때만 호출을 건너뛴다.

### 계획 탭 동시 편집

`routes.place_ids` / `place_memos` / `hidden_places`는 blob 컬럼이며, 클라이언트가 배열 전체를 만들어 `updateRoute`로 덮어쓴다. 여러 명이 동시에 편집하면 유실이 발생할 수 있다.

- 현재 대응: 갱신 주기 단축 (`trip-route/tripPlanRefetch.ts`의 `TRIP_PLAN_REFETCH`를 `useTripRoutes`·`useTripPlaces`가 공유)
- 단계별 전략: `docs/strategies/plan-tab-concurrency.md`

계획 탭 쓰기 경로를 수정할 때는 위 문서를 먼저 읽는다.

### 부분 업데이트 patch — undefined와 null의 구분

`updateTripPlace`처럼 일부 필드만 수정하는 API는 두 의도를 구분해야 한다.

- `undefined` — 이 필드를 수정하지 않음 (patch에 키를 만들지 않는다)
- `null` — 값을 비움 (미설정으로 지정)

키를 무조건 만들면 다른 사람이 방금 설정한 값을 덮어쓴다. patch 생성은 순수 함수로 분리해 검증한다 (`place.utils.ts`의 `toTripPlacePatch`).

폼 내부 표현(`'none'`)은 경계에서 `null`로 변환한다. 옵셔널(`category?:`)로 두면 "안 보냄"과 "미설정"이 같은 값이 되어 구분이 불가능해진다.

### 날짜 전용 문자열(`YYYY-MM-DD`) 파싱

- `new Date('YYYY-MM-DD')`는 UTC 자정으로 해석된다. UTC보다 느린(음수 오프셋) 타임존에서는 로컬 날짜가 하루 당겨져, 자정 기준 계산(당일 여부, 진행률 등)이 틀어진다.
- 여행 시작/종료일처럼 날짜 전용 값의 자정 경계가 필요하면 연/월/일을 직접 조합해 로컬 자정 `Date`를 만든다.
- 참고 구현: `features/trip/trip-list/trip-list.utils.ts`의 `parseDate` — `getTripStatus`/`getTripProgress`/`getDaysUntil`/`getTripDuration`이 공유
- 여행 진행률(`getTripProgress`)은 시작일 00:00:00 ~ 종료일 23:59:59.999를 기준으로 현재 시각까지의 경과 비율을 계산한다. 당일 여행(시작일 = 종료일)도 하루(24시간) 안에서 시각에 따라 채워지며, 100%로 고정되지 않는다.

---

### 앱 화면 레이아웃 — 시트와 하단 버튼 (RN)

웹을 옮길 때 반복해서 어긋난 지점이다. 구조를 웹과 같게 두는 것이 기준이다.

**최상위는 프래그먼트, 화면은 그 안의 형제로 쌓는다.**

```jsx
<>
  <Box sx={{ flex: 1, position: 'relative' }}>   {/* 지도 등 본문 */}
  <BottomSheet />                                 {/* 본문 위를 덮는다 */}
  <BottomArea position="static" />                {/* 흐름에서 자리를 차지한다 */}
</>
```

- 최상위를 `Box` 로 감싸고 그 안에 `BottomArea` 를 넣으면, 본문이 `absolute` 일 때
  흐름에 남는 것이 버튼뿐이라 화면 위쪽에 붙는다.
- 시트를 `overflow: 'hidden'` 인 부모 안에 두면 그 경계에서 잘린다. RN 은 자식이
  부모의 `overflow` 를 뚫지 못한다.
- 시트 높이 비율은 화면이 아니라 **시트가 놓인 컨테이너**를 기준으로 잰다.
  탭 화면은 탭바만큼 화면보다 작다. `onLayout` 으로 실측한다.
- 하단 안전영역은 화면 바닥에 닿는 쪽에서만 더한다. 시트와 버튼이 각각 더하면
  둘 사이가 벌어진다.

**Reanimated**

- shared value 는 `.value` 직접 대입이 아니라 `.set()` / `.get()` 을 쓴다 (lint 에러).
- 크기·위치를 애니메이션할 때 값을 둘로 쪼개지 않는다. 높이와 오프셋을 나눠 두면
  손을 뗀 순간 한쪽만 튀어 끊겨 보인다.
- 키보드는 `useAnimatedKeyboard` 가 중간 프레임을 주지 않는다. `keyboardWillShow` 의
  최종 높이와 `duration` 을 받아 `withTiming` 으로 직접 보간한다.

**flex 축**

`fullWidth` 처럼 "가로를 채운다" 는 부모의 주축에 달렸다. `direction="row"` 인 부모에서
`alignSelf: 'stretch'` 는 세로를 늘릴 뿐이다. 주축을 채우려면 `flex: 1` 을 쓰고,
지정한 높이를 지켜야 하면 `alignSelf` 는 `center` 로 둔다.

## 기능별 탐색 가이드

여행 상세 웹·앱 시나리오 및 스크린샷 대조 기록은 `docs/app-trip-screenshot-comparison.md`에서 관리한다.

최근 앱 검증 반영: `AnimatedTabBar`는 탭 전환 시 현재 라우트 파라미터를 전달하며, 공용 `Tabs`는 화면 전환 중 레이아웃 상태 갱신을 하지 않는다. 정산 경로 기반 화면은 Google 지도와 일차별 장소·지출 추가 액션을 포함한다.

| 기능                 | 핵심 파일                                                         |
| -------------------- | ----------------------------------------------------------------- |
| 여행 목록            | `features/trip/trip-list/TripListPage.tsx`                        |
| 여행 상태/진행률 계산 | `features/trip/trip-list/trip-list.utils.ts` (`getTripStatus`, `getTripProgress`) |
| 여행 생성            | `features/trip/trip-create/`                                      |
| 위치 vocabulary      | `features/location/location.model.ts`, `location.utils.ts`        |
| 여행 상세 레이아웃   | `features/trip/TripDetailPage.*.tsx`                              |
| 여행 채팅            | `features/trip/trip-chat/`, `features/trip/TripChatPage.tsx`      |
| 안읽은 메시지 뱃지   | `features/trip/trip-chat/TripUnreadCountBadge.tsx`                |
| 예정된 여행 목적지   | `features/trip/useScheduledTripDestinations.ts`                   |
| 지출 내역 UI         | `features/trip/trip-expense/desktop/`, `features/trip/trip-expense/mobile/` |
| 정산 계산 로직       | `features/expense/expense.utils.ts`                               |
| 정산 요약 훅         | `features/trip/trip-expense/useExpenseSummary.ts`                 |
| 정산 현황 UI         | `features/trip/trip-expense/desktop/SettlementSummary.desktop.tsx`, `mobile/SettlementSummary.tsx` |
| 멤버 관리            | `features/trip/trip-member/`                                      |
| 일정/경로            | `features/trip/trip-route/`, `features/route/`                    |
| 계획 탭 동시 편집     | `features/trip/trip-route/tripPlanRefetch.ts`, `docs/strategies/plan-tab-concurrency.md` |
| 해양 활동 지수       | `features/marine-activity/`, `features/trip/trip-marine-activity/` |
| 커뮤니티 경로        | `features/trip/trip-community-routes/`                            |
| 메모 목록/상세/편집  | `features/trip/trip-memo/`                                        |
| 장소 탭              | `features/trip/trip-place/TripPlaceContent.tsx`                   |
| 장소 검색            | `features/place/place-search/`                                    |
| 장소 상세            | `features/place/place-detail/PlaceDetailPage.tsx` (오버레이: `usePlaceDetailOverlay`) |
| 추천 장소            | `features/trip/trip-recommend/`                                   |
| 장소 탐색 (Explorer) | `features/explorer/PlaceExplorerPage.tsx`                         |
| 계절 인기 지역       | `features/tourism-trend/`, `features/explorer/explorer-seasonal-regions/` |
| 피드/포스트          | `features/post/FeedPage.tsx`, `features/post/post-form/`          |
| 사용자 프로필        | `features/user-profile/UserProfilePage.tsx`                       |
| 통계                 | `features/statistics/StatisticsPage.tsx`                          |
| 지도 (공통)          | `shared/components/Map/` (kakao / google 구현 분기)               |
| 사진 업로드          | `shared/components/photo/PhotoUploader.tsx`                       |
| 사진 상세 뷰어       | `shared/components/photo/PhotoBottomSheet.tsx`(모바일), `PhotoDialog.tsx`(데스크탑) |
| 사진 공개 뱃지/장소 변경 | `shared/components/photo/PhotoVisibilityBadge.tsx`, `PhotoPlaceSelect.tsx` |
| 여행 사진 탭         | `features/trip/trip-photo/TripPhotoContent.*.tsx`                 |
| 사진 EXIF 장소 매칭  | 웹 `features/photo/photo.utils.ts` + `shared/utils/exif.ts`(exifr), 앱 `features/photo/exif.utils.ts`(picker 의 `exif: true`). 매칭은 `findNearestPlace(.., { withinMeters: 500 })` 공유 |
| 체크리스트           | `features/trip/trip-checklist/`                                   |
| 오버레이/모달        | `shared/hooks/useOverlay.tsx`                                     |
| 웹 푸시              | `features/auth/useWebPushSubscription.ts`                         |
