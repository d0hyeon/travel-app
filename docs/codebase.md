# 코드베이스 레퍼런스

프로젝트 구조와 주요 패턴을 빠르게 파악하기 위한 참조 문서.

---

## 기술 스택

| 분류      | 기술                               |
| --------- | ---------------------------------- |
| Framework | React 19 + React Router 7 (CSR, `ssr: false`) |
| Language  | TypeScript 5.9                     |
| Build     | Vite 7                             |
| UI        | Material-UI 7 + Tailwind CSS       |
| State     | Zustand 5 + TanStack React Query 5 |
| Backend   | Supabase (DB + Storage)            |
| Maps      | Kakao Maps                         |
| Forms     | React Hook Form 7                  |

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
│   │   ├── photo.types.ts
│   │   └── photo.utils.ts
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
│       │   └── useTripClustering.ts
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
│           └── RouteNoteList.tsx          # 날짜 토글 아래에 해양 지수 바를 함께 배치
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
- DB 타입은 `src/api/_database.types.ts` (자동 생성, 직접 수정 금지)

### 오버레이 시스템

모달/바텀시트는 `useOverlay` 훅을 통해 명령형으로 열고 닫는다.

### 위치 모델링

- `Location` — 실제로 선택/표시/집계하는 구체 지명 단위. 예: `서울`, `도쿄`
- `Region` — `Location`의 상위 지역. 예: `강원도`, `간사이`
- `Country` — `Location`의 국가 메타. 예: `South Korea`, `Japan`
- `Destination` — 별도 베이스 모델이 아니라 여행 생성 UI에서 선택 가능한 `Location` 집합
- 공용 vocabulary: `src/features/location/location.model.ts`, `location.utils.ts`
- 관계형 상수는 `LocationCountry`, `LocationRegion`처럼 `ByX`보다 목적어 중심 이름을 우선

### 공용 좌표 모델

- `Coordinate`는 지도 컴포넌트 타입이 아니라 공용 값 모델
- 원천 타입: `src/shared/model/coordinate.model.ts`
- `shared/components/Map/types.ts`는 이를 re-export만 함

### 현재 위치 조회 (`useCurrentCoordinate`)

- `src/shared/hooks/env/useCurrentCoordinate.ts`
- 위치 권한이 `denied`가 아니면(`granted`·`prompt` 모두) `navigator.geolocation`을 호출한다.
  `prompt` 상태에서는 이 호출 자체가 브라우저 권한 팝업을 띄우는 트리거가 된다.
- `denied`일 때만 호출을 건너뛴다.

### 날짜 전용 문자열(`YYYY-MM-DD`) 파싱

- `new Date('YYYY-MM-DD')`는 UTC 자정으로 해석된다. UTC보다 느린(음수 오프셋) 타임존에서는 로컬 날짜가 하루 당겨져, 자정 기준 계산(당일 여부, 진행률 등)이 틀어진다.
- 여행 시작/종료일처럼 날짜 전용 값의 자정 경계가 필요하면 연/월/일을 직접 조합해 로컬 자정 `Date`를 만든다.
- 참고 구현: `features/trip/trip-list/trip-list.utils.ts`의 `parseDate` — `getTripStatus`/`getTripProgress`/`getDaysUntil`/`getTripDuration`이 공유
- 여행 진행률(`getTripProgress`)은 시작일 00:00:00 ~ 종료일 23:59:59.999를 기준으로 현재 시각까지의 경과 비율을 계산한다. 당일 여행(시작일 = 종료일)도 하루(24시간) 안에서 시각에 따라 채워지며, 100%로 고정되지 않는다.

---

## 기능별 탐색 가이드

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
| 체크리스트           | `features/trip/trip-checklist/`                                   |
| 오버레이/모달        | `shared/hooks/useOverlay.tsx`                                     |
| 웹 푸시              | `features/auth/useWebPushSubscription.ts`                         |
