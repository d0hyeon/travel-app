# 코드베이스 레퍼런스

프로젝트 구조와 주요 패턴을 빠르게 파악하기 위한 참조 문서.

> **경로 표기 규칙**
> 이 문서에서 `src/`로 시작하는 경로는 모두 `apps/waylog-web/` 기준이다.
> (예: `packages/domains/src/client/client.ts` → `apps/waylog-web/src/api/client.ts`)
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
| UI        | `@emotion/native` 자체 구축 + 자체 디자인 시스템   |
| Maps      | `react-native-maps` (Google 단일)                |
| Animation | Reanimated 4 + Gesture Handler 2                 |

앱 UI 는 `shared/components/design-system/` 의 자체 디자인 시스템을 쓴다.
디자인 어휘(`variant`, `color="text.secondary"`, spacing 8배수)는 웹 theme 에서 승계했지만
인터페이스는 RN 표준(`style`, `onPress`)이다. `~/shared/components/design-system` 별칭으로 임포트한다.
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
│   │   ├── _layout.tsx         # Provider 구성 (QueryClient·Auth·Overlay·AuthErrorBoundary)
│   │   ├── index.tsx           # 여행 목록
│   │   ├── login.tsx
│   │   ├── explorer.tsx        # 장소 탐색 카탈로그/지도
│   │   ├── explorer/           # 탐색 순위 상세 (최다 방문·급상승·저장순)
│   │   ├── u/[userId].tsx      # 사용자 프로필
│   │   └── trip/[tripId]/      # 상세 탭 셸 (정보·장소·계획·정산·사진)
│   ├── ios/                    # prebuild 산출물 (gitignore, 네이티브 빌드용)
│   ├── src/
│   │   ├── features/           # 웹 features 구조를 미러링
│   │   └── shared/
│   │       ├── components/
│   │       │   ├── design-system/ # 자체 디자인 시스템 — 웹 theme 어휘 + RN 표준 인터페이스
│   │       │   ├── Map/        # @rnmapbox/maps 구현. 클러스터 외형은 NativeMapCluster.utils.ts,
│   │       │   │                #   카메라는 useMapCamera, 클러스터 전이는 useClusterTransition
│   │       │   ├── bottom-sheet/ # 자체 구현 (Reanimated) — 웹과 같은 공개 API. Body 레이아웃·ScrollView 제스처
│   │       │   ├── action-sheet/ # 하단 액션 시트 (Modal + 슬라이드업). PopMenu 가 트리거를 얹어 쓴다
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
├── utility/                    # @waylog/utility — 플랫폼·도메인 비의존 순수 유틸리티·공용 타입
├── domains/                    # @waylog/domains — 도메인·데이터 계층
│   └── src/
│       ├── api/                # 앱이 주입한 supabase client 연결, 생성 타입
│       ├── auth/               # 인증 API·useAuth
│       ├── gateways/           # 외부 시스템 연결 계층
│       │   ├── auth/           # 인증 추상화
│       │   ├── client/         # 앱이 주입하는 외부 클라이언트
│       │   └── index.ts        # @waylog/domains/clients 공개 진입점
│       ├── utils/              # 도메인 공용 유틸리티
│       └── modules/            # 도메인별 데이터·로직 모듈
│           ├── expense/        # 지출(순수 로직·데이터 계층)
│           ├── location/       # 위치 vocabulary
│           ├── marine-activity/ # 해양 활동
│           ├── map/             # 좌표·마커 타입, 클러스터링(순수)
│           ├── photo/           # 사진 조회·삭제·수정
│           ├── community-route/ # 커뮤니티 경로
│           ├── open-graph/      # 링크 미리보기
│           ├── place/           # 장소 조회·검색·추가
│           ├── route/           # 경로
│           ├── tourism-trend/   # 관광 트렌드
│           ├── trip/            # 여행
│           ├── trip-chat/       # 여행 채팅
│           ├── trip-recommend/  # 추천 장소
│           ├── trip-checklist/  # 여행 준비물
│           ├── trip-member/     # 여행 멤버
│           ├── trip-memo/       # 여행 메모
│           ├── weather/         # 날씨 예보
│           ├── user-profile/    # 유저 프로필
│           └── utils/           # domains 전용 query 결과 병합 호환 진입점
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
| 플랫폼·도메인 비의존 순수 유틸·공용 타입 | `@waylog/utility` |
| 플랫폼 비의존 React 훅 | `@waylog/react` |
| 컴포넌트, 라우팅, 애니메이션, raw 스토리지, 디바이스 권한 | 각 앱 |

공유 패키지가 지켜야 하는 것:

- 환경변수를 직접 읽지 않는다. 각 앱이 Supabase client·인증 adapter를 생성해 `initializeClient()`로 주입한다
- 플랫폼 raw storage도 각 앱이 생성해 `initializeClient({ storage })`로 주입한다. 공용 패키지는 동기 캐시 어댑터만 소유한다
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

**supabase 클라이언트:** client 생성과 auth storage 설정은 각 앱이 소유한다.
`@waylog/domains/client`는 앱이 주입한 client를 기존 `.api.ts`에 제공하기 위해 Proxy 지연 참조를 사용한다.
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
│   │   ├── AuthNavigate.tsx
│   │   └── AuthErrorBoundary.tsx  # 세션 만료(AuthError) 시 로그인 화면으로 리다이렉트
│   │                              # 앱 대응: waylog-app/src/features/auth/AuthErrorBoundary.tsx
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
│   │   ├── PostCreationScreen.tsx  # 라우팅·업로드·생성 담당
│   │   └── post-form-funnel/  # 포스트 작성 퍼널 (라우터 비의존)
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
│   │   ├── dayPart.utils.ts    # DayPart(am/pm) 시각 구간 판정 · 구간별 예보 유무 판정
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
│       │   ├── TripWeatherForecastSheet.tsx # DayPart(am/pm) 중 실제 시간별 데이터가 있는 구간만 노출 (판정은 weather/dayPart.utils)
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
    │   ├── EditableText.tsx       # 웹과 동일한 편집 추상화; 기본 앱 필드는 TextOverlayField
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
- DB 타입은 `packages/domains/src/client/_database.types.ts` (자동 생성, 직접 수정 금지)

### 오버레이 시스템

모달/바텀시트는 `useOverlay` 훅을 통해 명령형으로 열고 닫는다.

### 날짜 선택 (앱)

계층은 `DateField > DatePickerBottomSheet > DatePicker > Calendar` 다.
`shared/components/date-picker/` 한 디렉토리에 모여 있다.

- `DateField` — 트리거 필드. `type` 에 따라 `value`/`onChange` 타입이 결정되는 판별 유니온이다.
  `type="range"` 면 `[Date, Date]`, `date`·`dateTime` 이면 `Date` 를 주고받는다.
  `allowSingleDay` 는 `range` 분기에만, `minuteStep` 은 `dateTime` 분기에만 있어
  유효하지 않은 조합은 타입 단계에서 막힌다.
- `useDatePickerBottomSheet` — 시트를 명령형으로 연다.
  돌려주는 모양이 달라 `openDay` 와 `openRange` 로 나뉘어 있다.
  하나로 묶으면 소비자가 받은 값의 모양을 다시 좁혀야 한다.
- `DatePickerBottomSheet` — 확정 시점과 `dateTime` 의 단계 전환을 쥔다.
  `defaultValue`/`onConfirm` 도 `type` 으로 갈린다. `range` 만 `allowSingleDay` 를 받는다.
  하단 버튼과 스냅 포인트가 시트 소유라 단계 상태도 여기 둔다.
  `dateTime` 은 날짜를 누르는 즉시 시각 단계로 넘어간다. 되돌아갈 때는 "이전" 이다.
  단계를 넘기는 버튼이 없으므로 확정 버튼은 항상 "확인" 이다.
  `range` 에 `allowSingleDay` 를 주면 하루만 골라도 `[day, day]` 로 채워 내보내므로
  소비자는 빈 칸을 보지 않는다.
- `DatePicker` — 보여줄 달(커서)과 고르는 중인 날짜를 쥔다. 확정은 위가 맡는다.
  `value`/`onChange` 는 `type` 으로 갈리는 판별 유니온이다.
  `date`·`dateTime` 은 `Date`, `range` 는 `DateSelection` 을 주고받는다.
  하루를 고르는 타입이 빈 둘째 칸을 들고 다니지 않게 한다.
  달력에 넘길 때만 안에서 기간 꼴로 맞춘다.
  `value` 도 옵셔널이라 주면 밖이, 주지 않으면 안에서 쥔다.
  안에서 쥘 때도 상태는 늘 `DateSelection` 튜플이다.
  타입마다 다른 모양을 한 상태에 담으면 다음 렌더에서 구조분해가 깨진다.
  `dateTime` 에서 날짜를 고르면 시각 단계로 넘어가는 전환은 이 컴포넌트가 끝낸다.
  `step` 도 옵셔널이며 `value` 와 별개로 판단한다.
  값만 밖에서 쥐고 단계 전환은 맡기는 조합이 가능해야 한다.
  `step` 을 안 준 경우에만 시각 단계에 `TimeStepHeader` 를 낸다.
  밖이 단계를 쥐면 돌아가는 버튼도 밖에 있어 여기서 또 내면 뒤로가기가 둘이 된다.
- `TimeStepHeader` — 시각 단계에서 날짜로 돌아가는 길. 고른 날짜도 함께 보여준다.
  달 이동은 `CalendarHeader` 책임이라 섞지 않는다.
  - 주지 않으면 안에서 쥔다. `DateStep` 처럼 하단 버튼이 단계와 무관한 곳이 이렇게 쓴다.
  - 주면 밖이 쥐고 `onStepChange` 로 전환 요청만 받는다.
    `DatePickerBottomSheet` 는 버튼 라벨과 스냅 포인트가 단계를 따라가야 해서 이쪽이다.
- `Calendar` — 앞뒤 달을 양옆에 깔아두고 통째로 미는 스와이프 페이저.
  헤더의 좌우 버튼도 `CalendarRef.slidePrevious/slideNext` 로 같은 애니메이션을 탄다.
- 격자 계산과 기간 선택 규칙은 `calendar.utils.ts` 의 순수 함수로 분리해 두었다.
  웹 `shared/components/date-range/` 의 선택 규칙을 승계했다.
  소비처가 이 디렉토리뿐이라 공유 패키지로 올리지 않는다.
- 한쪽 끝을 풀면 `[null, end]` 처럼 반대쪽 끝만 남는다. 이 상태를 두 곳에서 다룬다.
  - `CalendarDay` 는 고른 끝(`isEdge`)을 기간 포함 여부와 별개로 칠한다.
    `isWithinRange` 는 시작일이 없으면 아무 날도 포함하지 않으므로,
    포함 여부만으로 칠하면 남은 끝이 사라져 초기화된 것처럼 보인다.
  - `toggleRangeSelection` 은 시작일이 빈 채로 종료일보다 뒤를 누르면
    시작일을 채우는 대신 종료일을 옮긴다. 채우면 기간이 뒤집힌다.
    웹은 이 지점에서 역순 기간을 만들 수 있다. 앱만 먼저 고친 차이다.

### 위치 모델링

- `Location` — 실제로 선택/표시/집계하는 구체 지명 단위. 예: `서울`, `도쿄`
- `Region` — `Location`의 상위 지역. 예: `강원도`, `간사이`
- `Country` — `Location`의 국가 메타. 예: `South Korea`, `Japan`
- `Destination` — 별도 베이스 모델이 아니라 여행 생성 UI에서 선택 가능한 `Location` 집합
- 공용 vocabulary: `packages/domains/src/location/location.model.ts`, `location.utils.ts`
- 관계형 상수는 `LocationCountry`, `LocationRegion`처럼 `ByX`보다 목적어 중심 이름을 우선

### 공용 좌표 모델

- `Coordinate`는 지도 컴포넌트 타입이 아니라 공용 값 모델
- 원천 타입: `packages/domains/src/modules/utils/coordinate.ts`
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
- 겹침 순서는 `config/tokens.ts` 의 `zLayer` 로만 정한다. RN 은 `zIndex` 가 같으면
  렌더 순서로 정하므로, 둘 다 `10` 이면 나중에 선언된 시트가 아니라 `BottomArea` 가
  위로 올라와 시트를 뚫고 버튼이 보인다. 시트는 화면을 덮는 층이라 항상 더 높다.
- 여닫는 시트는 화면 안에 직접 두지 말고 `useOverlay` 로 띄운다. 오버레이 층은
  `OverlayProvider` 가 `Stack` 바깥에 두는 형제라 화면의 `BottomArea` 와 아예
  겹칠 일이 없다. 화면에 상주하는 시트만 형제로 둔다 (여행 장소·경로 탭).

**시트 끌기와 본문 스크롤 — 누가 터치를 갖는가**

핸들 바·`Header`·`Body`의 비스크롤 영역에서는 시트를 바로 끌 수 있다.
`ScrollView` 안에서는 아래 규칙으로 스크롤과 시트 중 하나를 고른다.

스냅 중 시트의 논리 높이(`sheetH`)는 유지하되, 렌더링은 최대 스냅 높이로 잡고
작아진 만큼 시트 전체를 `translateY`로 아래로 보낸다. 따라서 `BottomActions`도
화면 바닥에 고정되지 않고 헤더·본문과 함께 내려간다.
이때 본문 뷰포트는 최대 높이가 아니라 현재 보이는 높이(핸들 영역 제외)로 제한한다.
그래야 `ScrollView`의 마지막 콘텐츠가 화면 밖에 남지 않는다.

- 본문이 **최상단(`scrollY <= 0`)일 때 아래로 당기면** 시트가 끌린다.
- 그 밖에는 스크롤이 가져간다. 위로 당기면 언제나 스크롤이다.
- 판정은 **활성화 전**에 내린다 (`manualActivation` + `onTouchesMove`).
  `onStart` 는 이미 ACTIVE 로 넘어온 뒤라 늦다. 거기서 물러나도 터치는 제스처가
  붙잡은 채여서 스크롤도 시트도 안 움직이는 먹통 드래그가 된다.
  스크롤 몫이면 `manager.fail()` 로 양보하고, 시트 몫이면 `manager.activate()` 한다.
- 핸들 바·`Header`·스크롤이 아닌 `Body` 영역은 스크롤과 경합하지 않아 판정 없이 바로 끈다.

스크롤 위치는 `useAnimatedScrollHandler` 로 UI 스레드에 둔다. 제스처가 같은 프레임에서
읽어야 최상단 여부를 지연 없이 판정할 수 있다.

**터치를 독점해야 하는 영역 — `BottomSheet.GestureArea`**

순서 변경 목록·지도처럼 자기 제스처를 갖는 것은 `GestureArea` 로 감싼다.
`blocksExternalGesture` 로 본문의 시트 제스처를 지역적으로 이긴다.

```jsx
<BottomSheet.Body>
  <Tabs />                        {/* 여기선 시트가 끌린다 */}
  <ScrollViewContainer>           {/* 정렬 기능이 소유 */}
    <SortableList />
  </ScrollViewContainer>
</BottomSheet.Body>
```

시트 전체를 끄는 `disabled` prop 을 두지 않은 이유는, 실제 요구가 **영역 단위**이기
때문이다. 한 시트 안에 끌어도 되는 영역과 안 되는 영역이 같이 있다 (여행 경로 탭).

`NestedReorderableList` 를 쓸 때는 해당 기능이 `ScrollViewContainer` 컨텍스트를
소유한다. 정렬 라이브러리의 제약은 바텀시트 API에 넣지 않는다.

제스처 인스턴스는 붙이는 곳마다 새로 만든다 (`createPan`). 한 인스턴스를 두 곳에
붙이면 나중에 붙은 쪽이 `handlerTag` 를 가져가 먼저 붙은 쪽이 조용히 죽는다.

**시트 안의 스크롤은 전부 `BottomSheet.ScrollView` 를 쓴다. 가로도 포함이다.**

맨 `ScrollView` 를 쓰면 그 자식이 터치를 독점해 시트 판정까지 오지 않는다.
자식 스크롤은 자기 네이티브 핸들러를 갖는데, 시트 제스처와 관계가 없으면
gesture-handler 는 자식을 우선한다. 그래서 시트 위 빈 자리나 핸들 바에서는
시트가 끌리는데 스크롤 위에서 당기면 스크롤만 되는 증상이 난다.

`BottomSheet.ScrollView` 는 `Gesture.Simultaneous` 로 시트 제스처와 자기를 묶어
둘 다 인식되게 하고, 어느 쪽이 움직일지는 시트의 방향·최상단 판정이 정한다.

**시트 최대 높이는 상단 안전영역(다이나믹 아일랜드 등)을 넘지 않는다**

`sheetStyle`/`bodyStyle` 의 `limit` 계산은 `baseH - lift - insets.top` 이다.
키보드가 시트를 밀어 올릴 때(`lift`)도 상단 안전영역은 항상 남긴다.
100% 스냅이어도 마찬가지라, 스냅 포인트를 정할 때 이 여백을 따로 뺄 필요는 없다.

**입력 필드가 키보드에 가리는 시트 — `BottomSheet.KeyboardAwareBody`**

`BottomSheet.Body` 는 항상 고정 `View` 라 키보드가 열려도 내부 스크롤이 없다.
필드가 여러 개인 폼은 키보드가 뜨면 아래쪽 필드가 가려질 수 있다.

`KeyboardAwareBody` 는 겉보기엔 `Body` 와 같지만 내부는 항상
`SheetScrollView`(`scrollEnabled` 만 다르다)다. 키보드가 없을 땐
`scrollEnabled={false}` 라 스크롤이 죽고 시트 드래그(`pan`)만 산다 — 평소의
`Body` 와 동작이 같다. 키보드가 뜨면 `scrollEnabled={true}` 로 바뀌어
스크롤이 생기고, 포커스된 `TextInput` 으로 자동 스크롤한다
(`TextInput.State.currentlyFocusedInput` + `scrollResponderScrollNativeHandleToKeyboard`,
RN 내장 API — 별도 라이브러리 없이 동작한다).

**컴포넌트 종류(`View` ↔ `ScrollView`)를 조건부로 바꿔치기하지 않는다.**
그 아래 `TextInput` 까지 통째로 리마운트돼 포커스가 끊기고 키보드가 스스로
닫힌다. 그래서 항상 같은 `Animated.ScrollView` 를 렌더하고 `scrollEnabled` 값만
바꾼다. 시트 드래그 결합도 `SheetScrollView` 와 같은 방식
(`Gesture.Native()` + `Gesture.Simultaneous`)을 그대로 쓴다 — `GestureDetector`
에 `pan` 만 걸면 네이티브 스크롤 responder 를 가진 자식을 gesture-handler 가
우선해 드래그가 씹힌다.

```jsx
<BottomSheet.KeyboardAwareBody sx={{ paddingHorizontal: 16 }}>
  <ExpenseForm ... />
</BottomSheet.KeyboardAwareBody>
```

**`GestureArea`(지도·정렬 목록)나 `BottomSheet.ScrollView` 를 이미 품고 있는
시트는 `KeyboardAwareBody` 를 쓰지 않는다.** `scrollY` 는 시트당 하나뿐인
공유 값이라 같은 시트 안에 다른 스크롤 판정 소비자를 또 두면 충돌한다.
단순 입력 폼(`ExpenseForm` 처럼 `TextField`·`Chip`·`DateField` 나열)에만 쓴다.

세로 스크롤은 자기 위치를 시트에 알려 최상단 판정에 쓰이고, 가로 스크롤은
알리지 않는다 (시트가 보는 것은 세로 위치뿐이라 가로 값을 쓰면 어긋난다).
`Body`는 남은 높이를 차지하는 레이아웃 컨테이너다. 스크롤이 필요한 콘텐츠는
반드시 `ScrollView`로 감싼다.

```jsx
<BottomSheet.Body>
  <BottomSheet.ScrollView>…</BottomSheet.ScrollView>
  <BottomSheet.ScrollView horizontal>…</BottomSheet.ScrollView>
</BottomSheet.Body>
```

`scrollTo` 가 필요하면 `ref` 를 그대로 넘긴다 (`Animated.ScrollView` 타입이다).

시트 **밖**의 스크롤은 해당 없다. 화면 본문은 그냥 `ScrollView` 를 쓴다.

`Body` 자체를 중첩하지는 않는다. 스크롤 컨테이너가 겹쳐 높이가 무너진다.

`settle` 은 스냅이 바뀔 때마다 새로 만들어지므로 제스처가 직접 의존하면 안 된다.
ref 로 붙잡아야 끌던 도중 스냅이 바뀌어도 제스처가 갈아끼워지지 않는다.

**시트 닫기 콜백 — `onDismiss` 와 `onClose`**

두 시점을 나눠 둔다. 시트는 지시를 받은 즉시 사라지지 않고 내려가는 동안 화면에 남는다.

| prop | 시점 | 하는 일 |
| --- | --- | --- |
| `onDismiss` | 닫기 **요청** (배경 탭·아래로 끌어내림) | 소비자가 `isOpen` 을 `false` 로 내린다 |
| `onClose` | 닫기 모션이 **끝난** 시점 | 뒷정리 (폼 초기화·언마운트) |

- 여닫는 시트는 `onDismiss` 를 반드시 받는다. 없으면 배경을 눌러도 닫히지 않는다.
- 뒷정리를 `onDismiss` 에서 하면 시트가 내려가는 도중에 내용이 비어 보인다.
  그 일은 `onClose` 로 미룬다.
- `onClose` 는 한 번 열린 적이 있는 시트만 부른다. 닫힌 채 마운트된 시트는 부르지 않는다.

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
| 피드/포스트          | `features/post/FeedPage.tsx`, `features/post/post-form-funnel/`          |
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

네이티브 앱의 탐색·프로필 포팅은 `apps/waylog-app/src/features/explorer/`와
`apps/waylog-app/src/features/user-profile/`에 둔다. 탐색 순위 라우트는
`apps/waylog-app/app/explorer/` 아래에, 사용자 프로필 라우트는
`apps/waylog-app/app/u/[userId].tsx`에 둔다. 앱 지도는 현재 공통 RN 지도 API가
마커·클러스터만 제공하므로, 프로필 기록의 국내 행정구역 폴리곤은 방문지 마커와
상세 바텀시트로 대체한다. 프로필 피드는 공용 포스트 도메인 모델의 첫 사진을
대표 이미지로 사용하고 `/post/[postId]` 상세 화면으로 연결한다.

앱 클러스터 마커의 크기·색·숫자 표기는 `shared/components/Map/NativeMapCluster.utils.ts`가
결정하고 `NativeMapCluster.tsx`는 표현만 담당한다. 개수는 색이 아니라 크기로 나타낸다.
10개 이하는 옅은 배경으로 시각적 우선순위를 낮추고, 11개부터 `palette.primary`를 쓴다.
21개 이상은 개수와 무관하게 같은 외형을 유지하고, 1000 이상은 `1.2k` 형태로 축약한다.
중형과 대형은 배경색이 같고 크기와 링으로 구분한다. 링은 대형에만 두며 `rings` 배열
순서대로 원을 감싸고, 바깥으로 갈수록 좁고 옅어진다.
원은 아래로 떨어지는 그림자와 사방으로 번지는 발광을 겹쳐 지도 배경과 분리한다.
발광은 한 단계 옅은 단계의 배경색을 쓰되, 소형은 아래 단계가 없어 한 단계 진한 색을 쓴다.
클러스터링 계산 자체는 웹과 공유하는 `@waylog/domains`의 `cluster.core.ts`가 담당한다.
좌표→픽셀 투영도 같은 파일의 `createZoomToPixel`(Web Mercator)을 웹·앱이 함께 쓴다.
zoom 이 같으면 지도를 이동해도 픽셀 거리가 보존되어 그룹핑이 흔들리지 않는다.
클러스터 식별자는 소속 마커 전체가 아니라 대표 마커 하나로 정한다. 마커가 드나들어도
같은 클러스터로 남아 이동 모션을 이어갈 수 있다.

`clusterGridSize`는 화면 픽셀을 뜻한다. 투영이 돌려주는 값은 월드 픽셀이므로
`useMapMarkerRegistry.utils.ts`가 뷰포트 폭으로 환산한다. 이 환산이 없으면 줌인할수록
화면 기준 반경이 좁아져 클러스터가 계속 갈라진다.

앱 지도의 카메라는 `useMapCamera`가 다룬다. `useDeferredCamera`는 제스처가 이어지는 동안
반영을 미루고 손을 뗀 순간 확정하며(네이티브 `onMapIdle`은 타일 로딩까지 기다려 늦다),
`useCameraControl`은 이동 명령과 애니메이션 시간을 맡는다. `NativeMap`은 둘을 조립만 한다.
이동 중에 새 이동을 걸면 이전 대기 값을 버린다 — 남겨두면 낡은 값으로 한 번 더 반영해
클러스터가 두 번 갈라진다. 타이머는 `useTimer`가 다루고, 상태는 `useVariation`으로 잡는다.
클러스터링 중에는 카메라를 알기 전까지 마커를 그리지 않는다 — 개별 마커가 먼저 보였다가
클러스터로 바뀌면 깜빡인다.

클러스터 전이는 `useClusterTransition`이 추적한다. 마커 id 교집합으로 흡수처와 출처를 찾아
이동·병합·분산을 잇고, 사라진 클러스터는 빨려들어가는 동안 렌더 목록에 남긴다. 출발점은
렌더 시점에 계산해야 한다 — effect 로 미루면 이미 목적지에 마운트된 뒤라 움직일 구간이 없다.
단일 마커로 갈라지는 경우는 모션 없이 전환한다.

## 2026-08 앱 포팅 현황

- 홈 하단 탭: `apps/waylog-app/app/(tabs)/_layout.tsx`에 내 여행·피드·탐색·프로필 4개 탭을 구성했다. 통계 탭은 제외했다.
- 여행 목록: 웹의 진행 중·예정·지난 여행 분류와 진행률/D-day UI를 RN으로 포팅했다.
- 피드: `/feed` 라우트와 포스트 목록/좋아요/대표 이미지 표시를 추가했고, 포스트 카드를 `/post/[postId]` 상세 화면으로 연결했다. 카드 폭을 실제 레이아웃 측정값으로 계산해 웹과 같은 이미지 비율을 유지한다. 새 포스트 FAB는 `/post/new`로 이동하며, 웹과 같은 여행 선택 → 사진 선택 → 상세 설정 3단계 흐름을 제공한다. 사진은 네이티브 보관함 또는 여행 저장 사진에서 고르고 앱 스토리지 업로드 후 공용 `@waylog/domains`의 `useCreatePost`로 등록한다.
- 탐색: `/explorer`, `top-visited`, `recent-hot`, `most-saved` 라우트와 목록·지도·필터 UI를 추가했다. 장소 선택은 오버레이 대신 `/explorer/[placeId]` 페이지로 이동하며, 상세 페이지는 기본정보·피드 탭으로 구성된다. 필터는 공용 RN `Extrude`가 최초 source/target 좌표를 기준으로 이동·타깃 페이드·레이아웃 높이 축소/복원을 함께 처리한다. 카탈로그는 Y축으로 타이틀에 이동하고, 뒤로가기 타이틀이 있는 큐레이션 상세는 X·Y축으로 대각선 이동한다. 핫플레이스 상세의 기간 필터도 웹처럼 지역·카테고리 필터와 같은 행에서 함께 이동한다. 탭 라우트는 실제 하단 탭바 높이를 카탈로그 스크롤 인셋에 전달해 마지막 콘텐츠가 탭바에 가려지지 않게 한다. 카탈로그 데이터 쿼리는 웹처럼 계절·최근·저장·방문 섹션별 Suspense와 전용 스켈레톤으로 격리하며, 장소 카테고리는 도메인 enum 원값이 아니라 `PlaceCategoryTypeLabel`의 사용자용 라벨로 표시한다.
- 프로필: `/u/[userId]` 라우트와 피드 사진 그리드·기록 탭·로그아웃을 추가했다. 피드 사진 조회는 피드와 동일한 공용 포스트 모델을 사용하며 사진을 누르면 포스트 상세로 이동한다. 기록 탭을 선택하면 지도 상단이 화면 상단에 맞도록 자동 스크롤한다.
- 원격 이미지: `apps/waylog-app/src/shared/components/LoadableImage.tsx`가 이미지 로딩 중 동일한 박스 크기의 스켈레톤을 표시한다. 프로필·피드·포스트 상세·탐색·장소·여행 사진 UI에서 공통으로 사용한다.
- 통계는 요청 범위에서 제외했으며 구현하지 않았다.
- 장소 검색: `features/place/place-search/`를 웹 구조(`PlaceSearchBottomSheet` → 키워드 확정 시 `PlaceSearchSelectScreen` 상세 화면 전환, `useLastSearchKeywords` 최근 검색어)와 동일하게 맞췄다. 상세 화면은 웹의 지도+리스트 `SplitView`(좌우 리사이즈) 대신 지도(상단 고정 비율)+리스트(하단 `FlatList`) 세로 배치로 대체했고, 페이지네이션은 `IntersectionArea` 대신 `FlatList`의 `onEndReached`를 쓴다. 최근 검색어 저장은 웹 `useStorageState`(localStorage 동기) 대신 앱 `useStorageStore`(AsyncStorage 비동기) 위에 만료 필터링을 직접 구현했다. 데스크탑 전용 `PlaceSearchDialog`/`usePlaceSearchDialog`는 이식 대상에서 제외했다.

### 2026-08-29 앱 QA 보완

- 여행 상세의 일차 탭·지도 설정은 바텀시트 내부 목록만 스크롤하고, 설정 스위치는 controlled value로 즉시 반영한다.
- 사진 탭은 장소 필터, 선택 상태 오버레이, 공개 뱃지, 사진 상세 확대 영역을 앱 레이아웃에 맞춰 보완했다.
- 피드 작성은 단계별 뒤로가기와 진행률 표시를 제공하고, 포스트 상세는 작성자에게만 메뉴를 노출한다. 앱은 `PostFormFunnel`(`startStep`·`defaultValue`·`onSubmit` 만 받는 라우터 비의존 UI)과 `PostCreationScreen`(라우팅·업로드·생성)으로 나뉜다. 퍼널은 자체 native-stack을 중첩해 스텝을 스택 엔트리로 세우므로 스와이프 백·하드웨어 백이 이전 스텝으로 간다. 부모 스택에서 `post/new`는 엔트리 하나여서 등록 성공 후 `router.replace` 한 번으로 스텝 전체가 함께 걷힌다. 앱 사진은 웹과 달리 `uri` 하나로 통합한다(`source` 구분 없음). 공개 포스트에 쓴 여행 사진의 원본을 공개로 바꾸는 정책은 `createPost` 가 `savedPhotoId` 를 받아 처리하므로 화면은 관여하지 않는다.
- 공용 버튼·스켈레톤·프로그레스바에 로딩/비활성/값 변경 모션을 추가하고 지도 핀의 시각 크기와 터치 영역을 분리했다.
- 홈 탭과 여행 상세 탭에 `backBehavior="history"`를 설정했다. 여행 상세 탭 전환은 구현했지만 iOS Simulator의 `back --system`이 React Navigation의 탭 뒤로가기를 발생시키지 않아 홈 탭의 피드 → 탐색 → 뒤로가기 시나리오는 별도 재검증이 필요하다.
- `Skeleton`의 레이아웃 폭과 셔머 위치를 React state가 아닌 Reanimated shared value로 관리해 마운트 중 state-update 경고를 제거했다. 새 런타임에서 해당 경고는 재현되지 않았다.
- 네이티브 경로 타임라인의 순서 아이콘을 웹과 동일한 20px로 맞췄다. 경로 목록은 중첩 리스트 대신 단일 `ReorderableList`와 스크롤 가능한 header를 사용하며, 실제 바텀시트에서 장소 행이 스크롤되고 새 `VirtualizedLists should never be nested` 경고가 재발하지 않음을 확인했다.
- 경로 행에는 `useIsActive`/`shouldUpdateActiveItem`와 `onDragStart` 상태 동기화 기반 좌우 2px primary 보더를 연결했다. 내부 리스트는 단일 `ReorderableList`로 유지하고 바텀시트 팬과 분리했지만, iOS agent-device에서 핸들 gesture 명령은 성공해도 active lifecycle과 실제 순서 변경이 발생하지 않아 드래그 보더 QA는 실패·재검증 대기 상태다.
- `agent-device 0.20.10`으로 iPhone 17 Simulator의 여행 목록·여행 상세·경로·사진·프로필 기록 화면을 직접 확인했다. 사진 상세는 `사진 메뉴`, 사진 순번, 장소 지정·삭제·닫기 액션을 확인했으며 실제 삭제는 수행하지 않았다. 프로필 기록의 지역 마커는 `제주` 지역 바텀시트를 열고 국가·여행·사진 없음 상태를 표시했다.
- 메모 행의 제목이 빈 문자열·공백이면 내용 미리보기로 대체하고, 내용도 비어 있으면 `메모`를 표시하도록 네이티브·웹 목록과 고정 메모를 통일했다. 전용 Vitest 4개가 통과했다.
- 현재 QA 메모리는 `.omc/qa-memory.json`이 단일 권위 소스이며, 이번 스냅샷의 12개 항목 중 10개를 런타임/코드 증거로 완료했다. 탭 뒤로가기와 드래그 활성 보더는 실패 사유·재작업 조건과 함께 미완료로 유지한다.

### 웹과 동일 구현이 불가능한 항목

- `react-router`의 URL search params/overlay 연동은 Expo Router에 동일 API가 없어 기존 RN의
  `useQueryParamState`와 `useOverlay`로 대체했다.
- 포스트 작성의 브라우저 File/Swiper는 Expo ImagePicker와 네이티브 가로 ScrollView로 대체했다. 포스트 상세는
  Expo Router 페이지 라우트(`/post/[postId]`)로 구현했으며 웹의 링크 오버레이 동작은 페이지 이동으로 대체했다.
- 웹 지도 폴리곤/일부 데스크톱 레이아웃은 RN 지도 API 범위에 맞춰 마커·클러스터와 바텀시트로 대체했다.
- iOS JavaScript 런타임에는 `Object.groupBy`가 없어 여행 목록의 연도별 그룹화는 RN 호환 `reduce` 구현으로 대체했다.
