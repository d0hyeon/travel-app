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
| Native    | Expo SDK 57 + React Native 0.86.3                |
| Routing   | `@react-navigation` 7 (코드 기반 트리, `src/app/routes.ts`) |
| UI        | `StyleSheet` + 자체 디자인 시스템 + Tamagui 2 (점진 도입) |
| Maps      | `react-native-maps` (Google 단일)                |
| Animation | Reanimated 4 + Gesture Handler 2                 |

앱 UI 는 `shared/components/design-system/` 의 자체 디자인 시스템을 쓴다.
디자인 어휘(`variant`, `color="text.secondary"`, `color="common.white"`, spacing 8배수)는 웹 theme 에서 승계했지만
인터페이스는 RN 표준(`style`, `onPress`)이다. `~/shared/components/design-system` 별칭으로 임포트한다.
`Typography`의 `color`에는 직접 색상값 대신 의미 토큰을 쓴다. 지원 토큰은
`text.primary`·`text.secondary`·`text.disabled`·`primary`·`primary.main`·`common.white`·`error`·`error.main`·`warning`·`success`·`success.main`이다.
바텀시트·정렬 목록처럼 손이 많이 가는 것은 직접 구현한다 — 아래 "주요 패턴" 참조.

기존 화면은 `StyleSheet.create` 로 파일 하단에 모은다. 인라인 객체는 렌더마다
새로 만들어져 `memo` 를 무력화하므로, 런타임 값(`insets`, 측정된 크기)이나
상태에 의존하는 부분만 배열로 합성한다.

Tamagui는 `app/_layout.tsx`의 `TamaguiProvider`에서 라이트 테마로 시작한다.
새로 포팅하는 공용 UI는 `$background`·`$color`처럼 의미 토큰을 사용하며,
`<Theme name="dark">`로 특정 트리만 다크 테마로 덮을 수 있다. 첫 적용처는
TicketViewer 내부의 `ConfirmDialog`와 `ActionSheet`다. 공용 `Button`도 Tamagui
토큰을 내부에서 해석하므로 호출부는 `variant`와 `color`만 선언한다. 기존
`StyleSheet` 컴포넌트는 그대로 유지하고 필요할 때만 Tamagui로 옮긴다.

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

**파일 위치:** `AppRoute`는 `@waylog/routes`(웹/앱 공유 패키지)에서 온다. `src/app/routes.ts`는 라우트 트리 정의만 남아 있다.

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
├── waylog-app/                 # 네이티브 앱 (Expo SDK 57 + RN 0.86)
│   ├── index.ts                 # registerRootComponent(RootNavigator)
│   ├── ios/                    # prebuild 산출물 (gitignore, 네이티브 빌드용)
│   ├── src/
│   │   ├── app/                # 코드 기반 네비게이터 트리 (파일 라우팅 없음)
│   │   │   ├── routes.ts       # RouteParamsRegistry(화면별 declare module 병합 대상) + 매핑 타입으로 합성되는 RootStackParamList·HomeTabParamList·TripDetailTabParamList
│   │   │   ├── AppRoute.ts     # @waylog/routes(콜론 경로)를 언더스코어로 치환한 내부 AppRoute + toScreenName
│   │   │   ├── registerLinkingScreens.ts # linking.config.screens를 내부 AppRoute 키로 생성
│   │   │   ├── RootNavigator.tsx # Provider 구성 + NavigationContainer + RootStack (linking 포함)
│   │   │   └── HomeTabs.tsx    # 홈 4탭(내 여행/피드/탐색/프로필)
│   │   ├── features/           # 웹 features 구조를 미러링. trip/TripDetailStack.tsx·TripDetailTabs.tsx 가
│   │   │   │                    #   여행 상세 스택+탭 중첩을 구성
│   │   └── shared/
│   │       ├── components/
│   │       │   ├── design-system/ # 자체 디자인 시스템 — 웹 theme 어휘 + RN 표준 인터페이스
│   │       │   │   ├── GlassSurface.tsx # 유리 재질. iOS 26 Liquid Glass, 그 아래는 블러로 대체
│   │       │   │   └── menu-fab/ # 탭 기본 동작·롱프레스 보조 메뉴, 순수 모션 계산 분리
│   │       │   ├── Map/        # @rnmapbox/maps 구현. 클러스터 외형은 NativeMapCluster.utils.ts,
│   │       │   │                #   카메라는 useMapCamera, 클러스터 전이는 useClusterTransition
│   │       │   ├── bottom-sheet/ # 자체 구현 (Reanimated) — 웹과 같은 공개 API. Body 레이아웃·ScrollView 제스처
│   │       │   ├── action-sheet/ # 하단 액션 시트 (Modal + 슬라이드업). PopMenu 가 트리거를 얹어 쓴다
│   │       │   ├── tab-navigation/ # 하단 탭바. variant default(라운드+그림자)·apple(블러) 전환.
│   │       │   │                #   RouterTabNavigation 이 react-navigation bottom-tabs 어댑터
│   │       │   ├── date-picker/ # 날짜·기간·시각 선택 (바텀시트 + 스와이프 달력)
│   │       │   ├── photo/      # PhotoBottomSheet(여행·장소 공용 상세 뷰어), usePhotoViewerState,
│   │       │   │                #   ZoomArea, PhotoVisibilityBadge
│   │       │   └── dnd/        # 제스처 기반 정렬 목록 (드래그 핸들)
│   │       ├── config/tokens.ts # 웹 theme.ts 에서 승계한 값
│   │       └── hooks/          # useAppNavigation·useAppRoute(RootStackParamList 스코프),
│   │                            #   useTripDetailTabNavigation·useTripDetailTabRoute(TripDetail 탭 스코프),
│   │                            #   useOverlay·useQueryParamState(route params 기반, 웹과 동일 시그니처)
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
├── routes/                     # @waylog/routes — 웹/앱 공유 URL 경로 상수(AppRoute). 한글 키·콜론 경로(`/trip/:tripId`)
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
│           ├── post/            # 커뮤니티 포스트
│           ├── route/           # 경로
│           ├── storage/         # 스토리지
│           ├── tourism-trend/   # 관광 트렌드
│           ├── transport/       # 이동수단 vocabulary
│           ├── trip/            # 여행
│           ├── trip-chat/       # 여행 채팅
│           ├── trip-recommend/  # 추천 장소
│           ├── trip-checklist/  # 여행 준비물
│           ├── trip-member/     # 여행 멤버
│           ├── trip-memo/       # 여행 메모
│           ├── trip-transport/  # 여행 교통편·티켓
│           ├── weather/         # 날씨 예보
│           ├── user-profile/    # 유저 프로필
│           └── tripPlanRefetch.ts  # 계획 탭 공동 편집 갱신 정책 (모듈 공용)
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

**앱 라우팅 규칙:** 화면 파일은 로컬(내부라우트) `AppRoute`(`app/AppRoute.ts`)만 import한다.
원본 패키지라우트(`@waylog/routes`)는 `AppRoute.ts`(치환 로직)와 `RootNavigator.tsx`(스크린 등록·linking)
두 인프라 파일에서만 쓴다.

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
- OAuth(카카오) 로그인은 `signInWithKakao({ redirectTo })` 하나로 공유하고, 실제 인증 창을
  띄우는 방식은 각 앱의 `supabase-auth.ts` adapter가 소유한다. 웹은 `signInWithOAuth`가
  브라우저를 그대로 리다이렉트시키지만, 네이티브에는 리다이렉트할 브라우저 문맥이 없어
  `skipBrowserRedirect`로 URL만 받아 `expo-web-browser`로 띄우고
  `waylog://auth/callback` 딥링크로 돌아온 `code`를 `exchangeCodeForSession`으로 교환한다.
  앱 client만 `flowType: 'pkce'`인 이유다 — 기본값 `implicit`은 토큰을 URL 조각(`#`)에
  실어 보내 딥링크로 받기 어렵다. 콜백 주소는 Supabase Auth의 Redirect URLs에 등록해야 한다.
  로그인 화면은 웹 `IntroFullScreenBanner`와 같은 구성(로고 타일·태그라인이 가운데,
  버튼은 하단)이다. 카카오 버튼만 웹의 `color="info"`(`#333`) 대신 카카오 브랜드 색
  (`#FEE500` + 라벨 `#3C1E1E`)을 쓴다. 노란 배경에서는 `Button` 의 로딩 스피너가
  흰색 고정이라 보이지 않으므로, `loading` 대신 `startIcon` 을 스피너로 바꿔 대기를 표현한다.
  로고는 웹 `public/pwa-512x512.png`와 같은 이미지를 `apps/waylog-app/assets/logo.png`로 둔다. 이미지 모듈 선언은
  `apps/waylog-app/types/assets.d.ts`에 있다 — `expo-env.d.ts`는 Expo가 재생성하는
  gitignore 대상이라 거기에 두면 사라진다
- 인증이 필요한 화면에서 튕겨나갈 때는 돌아올 자리를 `returnTo` 검색 파라미터로
  싣는다(`src/features/auth/auth-redirect.tsx`). 가드 fallback은 `<LoginRedirect />`,
  세션 만료 감지는 `useLoginRedirect()`, 복귀는 `login.tsx`의 `useReturnTo()`가 읽는다.
  로그인 성공 후 별도 이동 코드는 없다 — 세션이 갱신되면 `login.tsx`의 `useAuth`가
  재평가되어 `<Redirect href={returnTo} />`가 스스로 동작한다.
  OAuth의 `redirectTo`(`waylog://auth/callback`)와는 다른 개념이다. 웹은 둘이 같은 URL
  이지만 앱은 콜백이 딥링크 스킴이어야 해 분리된다. 외부에서 심어진 절대 URL로 튕기지
  않도록 `returnTo`는 앱 내부 경로만 받는다
- 초대 링크(`/trip/invite/:shareLink`)는 앱 설치 시 앱이, 아니면 웹이 연다
  (iOS Universal Links). 성립하려면 세 곳이 맞물린다 — 앱의 `associatedDomains`,
  웹이 서빙하는 `public/.well-known/apple-app-site-association`, 그리고 그 파일을
  SPA fallback rewrite에서 제외하는 `vercel.ts` 설정이다. AASA는 확장자가 없어
  rewrite에 걸리면 index.html이 반환되고, iOS는 JSON 파싱에 실패해 조용히 웹으로 빠진다.
  같은 이유로 `Content-Type: application/json`을 헤더로 명시한다.
  iOS는 AASA 조회 시 리다이렉트를 따라가지 않으므로 apex(`waylog.me`)와 `www` 양쪽에
  서빙돼야 한다. AASA의 팀 ID는 Apple Developer Program 가입 후 채워야 하며
  (현재 `APPLE_TEAM_ID` 플레이스홀더), Personal Team으로는 Associated Domains
  entitlement 자체를 쓸 수 없다. Android App Links는 아직 적용하지 않았다
- 지역 경계 geojson(`/visit-layer/*`)은 웹 `public/`이 서빙한다. 웹은 상대 경로로
  받고, 앱은 붙을 origin이 없어 `initializeClient({ boundaryBaseUrl })`로 웹 주소를
  주입받는다. 주입하지 않으면 상대 경로 그대로다.
  값은 `app.config.ts`의 `extra`가 아니라 `process.env.EXPO_PUBLIC_WEB_BASE_URL`을
  직접 읽는다 — `extra`는 네이티브 빌드에 구워져 `.env`를 고쳐도 재빌드 전엔 반영되지
  않는다(Mapbox 토큰이 같은 이유로 직접 읽는다)
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
│   ├── routes.ts               # 라우트 트리 정의. `AppRoute` 상수는 `@waylog/routes`에서 import
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
│   │   ├── explorer-recent/    # 급상승 장소 (byHotRank: 점수 → 최근 담긴 시각)
│   │   ├── explorer-saved/     # 저장 순위 (bySaveRank: 저장 수 → 최근 저장 시각)
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
- `minDate`/`maxDate` 는 `DateBounds` 로 묶여 `DateField` 부터 `CalendarDay` 까지 그대로 내려간다.
  이름은 웹의 MUI `maxDate` 를 승계한다.
  경계는 **하루 단위**다. 경계일에 붙은 시각이 당일을 잘라내지 않는다.
  `dateTime` 의 시각 휠은 제약하지 않는다. 지금 소비처가 모두 날짜 단위 제약이다.
  경계 밖의 날은 `CalendarDay` 가 회색으로 남기고 `Pressable` 자체를 내지 않아
  `toggleRangeSelection` 은 제약을 몰라도 된다.
  기간 배경도 입히지 않는다. 칠하면 고른 것으로 읽혀 눌리지 않는 이유를 설명하지 못한다.
  값이 없을 때 `DatePicker` 의 초기 커서는 `clampToDateBounds` 로 경계 안에 넣는다.
  그러지 않으면 전부 회색인 달이 펼쳐진다.
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
- 원천 타입: `packages/utility/src/coordinate.types.ts` (`@waylog/utility`)
- `shared/components/Map/types.ts`는 이를 re-export만 함

### 이동수단 어휘 (`TransportType`)

- 원천 타입: `packages/domains/src/modules/transport/transport.types.ts`
- `walk` · `car` · `flight` · `train` · `bus` 다섯 값을 한곳에 두고,
  소비자가 `Extract`로 필요한 만큼 좁혀 쓴다.
- 경로는 `RouteTransportType`(`walk` | `car`)만 받는다
  (`modules/route/route.types.ts`). 도로 경로에 항공이 들어올 수 없다는 것을
  타입으로 강제한다.
- 교통편은 `flight` | `train` | `bus`를 쓴다.
- `TransportTypeLabel`은 다섯 개 전체의 한글 라벨을 갖는다.
  경로 UI는 좁힌 값만 넘기므로 표시되는 라벨은 달라지지 않는다.

### 여행 교통편 (`trip-transport`)

- 모듈: `packages/domains/src/modules/trip-transport/`
- `TripTransport`은 `TripTransportBase & TripTransportCarrier`다.
  `TripTransportCarrier`가 종류별 필드를 가르는 판별 유니온이라
  `type`으로 좁혀야 `airline`에 닿는다. 기차·버스 분기는 `type`만 갖는다 —
  `provider`·`service_number`는 읽는 provider 가 없어 도메인 타입에서 뺐다.
  DB 컬럼(`provider`, `service_number`)은 남아 있지만 쓰기는 항상 `null`로
  고정한다(`toCarrierColumns`) — 종류를 바꿔도 이전 값이 남지 않게 하는
  기존 규칙을 그대로 따른다.
  DB는 종류별 컬럼이 모두 nullable이므로 이 유니온은 코드가 잘못 쓰는 것을
  막는 장치이지 데이터 무결성 보장이 아니다.
- 출발·도착은 `places`가 아니라 **`trip_places`를 참조**한다.
  `routes.place_ids`가 `trip_places.id`만 받으므로, 경로와 같은 것을
  가리켜야 인접 판정을 id 비교만으로 할 수 있다.
- 교통편이 참조하는 공항 `trip_place`는 **삭제가 거부된다**
  (FK가 `no action`, `23503`). 의도한 잠금이다.
  교통편을 지워도 공항은 따라 지우지 않는다 — 참조가 사라지면
  평범한 여행 장소로 돌아간다.
- 티켓은 `trip_transport_tickets` 별도 테이블이다. 일행이 동시에 올릴 때
  jsonb 배열이면 한쪽이 덮어써진다. RLS는 교통편을 거쳐 여행에 닿는다.
- **한 행 = 탑승자 한 명(`member_id`)의 탑승권 한 장(`image`)** 이다.
  처음엔 `images text[]` 였지만 코드가 늘 한 장만 넣었고, 배열을 두면
  "한 행에 두 장"이라는 쓰이지 않는 상태가 스키마에 남았다.
  여러 장은 행을 나눠 표현한다 (`20260916020000_transport_ticket_single_image`).
  기존 데이터는 2번째 이후 이미지를 행으로 펼쳐 옮겼고, 이미지 없는 행은
  지우지 않고 남겨 뒀다 — 그래서 컬럼은 nullable 이고 조회에서 걸러낸다.
- 티켓 이미지는 `photos` 테이블을 쓰지 않는다
  (`is_public`·place 연결·커뮤니티 노출을 물고 있다).
  웹·앱의 `uploadTransportTicketImage`가 기존 스토리지 경로만 타고,
  저장 경로는 `trip-transport-tickets/{transportId}/{uuid}`다.
- **터미널·게이트·좌석은 티켓 행의 컬럼**(`terminal`·`gate`·`seat`)이다.
  탑승권에 인쇄된 값이라 근거인 이미지와 같은 행에 둔다. 교통편에 두면
  일행이 한 값을 공유해 서로 덮어쓴다.
  **`flight-status`가 주는 터미널·게이트와 다른 것이다** — 탑승권은 발권
  시점의 예정, API 는 지금 이 순간이다. 두 값을 섞지 않으며 API 응답으로
  이 컬럼을 덮지 않는다.
- **세 값 모두 OCR 로 뽑는다.** 탑승권 16종의 Vision 결과로 규칙을 맞췄다.
  라벨과 값이 붙어 있지 않다는 것이 이 데이터의 핵심이다 -- ANA 는 라벨 넷을
  먼저 묶어 내놓고(`FLIGHT GATE BOARDING SEAT`) 값을 뒤에 몰아 놓는다.
  그래서 라벨 뒤 넓은 창(10토큰)에서 그 필드 형식에 맞는 첫 값을 고른다.
- 실측에서 드러난 함정들이다. 하나라도 빠지면 틀린 값이 들어간다.
  - `GATE CLOSES 10 MINS BEFORE` 의 GATE 는 라벨이 아니다(캐세이).
  - e-티켓 번호 `025/ICNKG61/002K/J` 의 `002K` 가 좌석으로 잡힌다(아시아나).
  - ANA 는 좌석 앞에 구역을 붙인다: `(Z)1A`.
  - 시각(`10:05`)과 좌석 형식이 게이트·터미널 자리에 들어온다.
  - 에어프랑스는 한 장에 두 구간이 인쇄된다 -- 값이 서로 다르면 어느 구간의
    것인지 정할 수 없어 세 값을 모두 비운다.
- 좌석은 **라벨 없이** 형식으로 찾는다(`\d{1,3}[A-K]`). 라벨 표기가
  `GHE/SEAT`·`좌석번호`·`座位号` 로 갈리고 OCR 이 `CỦA IGATE` 처럼 붙여 읽어
  라벨에 의존할 수 없다.
- 아직 못 읽는 것: 베트남항공(라벨-값 거리 25토큰, 값이 `07/11` 로 합쳐짐),
  싱가포르항공(라벨 5개와 값 5개가 순서로 대응돼 라벨 뒤 첫 값이 틀림).
  텍스트 순서로는 한계이며, Vision 응답의 `boundingPoly` 좌표를 쓰면
  "라벨 바로 아래"로 짝지어 풀 수 있다.
- 좌석 추출은 `getTicketInfo`(`ticket-info` Edge Function)가 한다.
  **업로드 시 1회**만 부르고 저장은 `updateTripTransportTicket`이 맡는다 —
  추출이 티켓 행을 갱신하면 행이 생기기 전에는 쓸 수 없어, 폼 prefill 자리를
  남기려 읽기와 쓰기를 갈랐다.
  조회 시 추출은 실패를 기록할 곳이 없어 못 읽는 티켓에 대해 무한 반복한다.
- 추출 규칙은 `ticketInfo.utils.ts`의 순수 함수이고 테스트가 여기 붙는다.
  `functions/ticket-info/extract.ts`는 그 **사본**이다 (Deno 가 워크스페이스
  패키지를 import 하지 못한다). `flight-status-watch/incheonFlights.ts`와 같은 구조다.
- **같은 값이 여러 번 나오는 것은 정상이다** -- 반쪽이 둘인 탑승권은 좌석이
  두 번 인쇄된다. 값이 같으면 쓰고, 서로 다를 때만 비운다.
  틀린 좌석을 보여주는 것이 빈 카드보다 나쁘다.
  추출 실패는 업로드·등록에 영향을 주지 않는다.
- `updateTripTransportTicket`은 **넘어온 키만 쓴다**. 세 컬럼을 늘 쓰면
  게이트만 고쳐도 좌석이 지워진다.
- `_database.types.ts`는 손으로 관리된다. 마이그레이션을 더하면 Row/Insert/
  Update 세 곳에 컬럼을 같이 넣어야 앱 타입 검사가 통과한다.
- 시각은 UTC로 저장하고 표기만 각 지점 타임존으로 포맷한다.
  타임존 컬럼은 있지만 **1차에서는 채우지 않으며**, 없으면 기기 로컬로 폴백한다.

### 교통편 UI

- 웹·앱의 순수 교통수단 입력 UI는 `features/transport/`가 소유한다.
  `transport-form/`에는 폼과 필드, `transport-airport/`·`transport-airline/`에는 각각
  공항·항공사 검색과 선택 오버레이를 둔다. `transport-form/transportForm.types.ts`에는
  입력값 인터페이스만 두고, zod 검증과 여행별 저장은 두지 않는다.
- 웹의 `features/trip/trip-transport/`는 여행에 귀속된 목록·라벨·상세 섹션을 소유한다.
  기본정보 탭 진입점은 `TripTransportSection.mobile.tsx`·`TripTransportSection.desktop.tsx`로
  나뉜다. FAB/카드 헤더·여백 같은 기기별 표현은 각 셸이 소유한다.
- 상세 화면 조립과 라우트 셸은 `transport-detail/`에 두고, 탑승권 목록·뷰어·업로드는
  `transport-ticket/`에 둔다. 상세 데이터 섹션(요약·실시간·운행 정보·길찾기)은
  `trip-transport/` 루트에 둔다.
- 앱도 같은 소유권 축을 따른다. 다만 앱의 `TransportCreationScreen.tsx`는 생성 화면과
  제출을 직접 조율하고, `transport-form-funnel/`에는 앱 전용 퍼널 셸과 단계 컴포넌트만 둔다.
- **진입**: 여행 상세 → 정보 탭 → 교통편 서브탭.
  데스크톱은 서브탭이 없어 정보 화면의 카드로 둔다.
- **생성 퍼널**: 종류 → 정보 → 티켓 3스텝. 포스트 생성과 같은 형태다.
  웹은 별도 라우트(`/trip/:tripId/transport/new`)에서 `step` 쿼리 파라미터,
  앱은 `createNativeStackNavigator` 자체 스택으로 push 한다.
- 웹 생성 라우트는 `transport-form-funnel/TransportFormPage.tsx`에서 기기별 청크를 고른다.
  같은 폴더가 단계·zod 검증·여행별 저장을 소유하고, `features/transport/`의 입력 UI와
  타입을 소비한다. 데스크톱은 공용 `TopNavigation.desktop`의 좌측 뒤로가기와 중앙 제한 폭
  입력 패널을 쓴다.
- 폼 값은 평평하게 들고 제출 시 판별 유니온으로 접는다.
  유니온으로 들면 입력 중 종류를 바꿀 때마다 값이 통째로 날아간다.
- **공항·항공사는 목록에서 고른다**. 프리텍스트를 허용하지 않는다 —
  코드 없는 행이 섞이면 운항정보 API 와 매칭할 수 없고, 사용자는 알림이
  오지 않는 이유를 알 수 없다. 목록에 없으면 데이터를 추가한다.
- 공항 선택이 `departure_timezone` 을 함께 채운다. 정적 데이터가 IANA
  타임존을 갖는다.
- 편명은 `airlineCode` + `flightNumber` 로 나눠 든다. 한 필드에 담으면
  `KE721`·`ke 721`·`대한항공 721` 이 모두 들어와 매칭이 흔들린다.
- 기차·버스는 출발·도착을 자유 입력으로 남긴다. `TransportScheduleFields`
  가 클릭 콜백을 받은 필드만 읽기 전용으로 바꾼다.
  사업자·편명 같은 부가 입력은 없다 — 읽는 provider 가 없어 채워도 쓰이지
  않으므로 폼에서 뺐다. `provider`·`service_number` DB 컬럼은 남아 있지만
  더 이상 쓰지 않는다.
- **실시간 운항 상태는 provider 로 가른다**(`flight-status`). 날씨의 축 분리를
  승계해 공항 코드로 provider 를 고르고, provider 가 `getIsAvailability` 로
  자기 기간 제약(인천 D+0~D+6)을 답한다. 김포·김해는 provider 를 더한다.
  조회 가능한 편이 하나도 없으면(기차·버스뿐인 화면 등) 운항 목록 자체를
  받지 않는다 — 목록 API 가 공항 하루치를 통째로 주므로 받을 이유가 없을
  때 건너뛰는 것이 비용을 아낀다.
- 인천공항 API 는 편명을 **제로패딩**(`KE011`)하고 일부에 **접미 문자**(`KE647Y`)를
  붙이며, 코드셰어로 같은 편이 여러 행에 걸친다(Slave 가 절반이다).
  문자열 비교로는 매칭되지 않아 편번호를 수로 비교한다.
- 응답의 92% 는 `remark` 가 비어 온다 — 미래편은 상태가 없다.
  시각은 `YYYYMMDDHHMM` 이고 타임존이 없어 KST 로 읽는다.
- 코드 없이 등록된 교통편과 인천을 지나지 않는 노선은
  `TransportRealtimeInfoSection`을 숨긴다.
  빈 카드를 남기면 데이터를 기다리는 것처럼 보인다.
- `TransportOperationalInfoSection`은 **다른 규칙으로 숨는다** — 값이 탑승권에서
  오므로 공항·노선과 무관하고, 내 티켓이 없을 때만 숨는다. 탑승권 추가 유도는
  하지 않는다. 바로 아래 `TransportTicketsSection`이 이미 하고 있어 같은 버튼이
  둘 뜬다. 티켓은 있고 추출만 실패한 경우는 빈 카드를 보여준다 — 눌러서
  직접 채울 수 있어야 한다.
- 이 구획이 보여주는 칸은 종류마다 다르며 `getOperationalFields(type)`
  (`trip-transport` 도메인)가 답한다. 항공은 터미널·게이트·좌석(나) 세 칸,
  기차·버스는 게이트가 없어 두 칸이고 `terminal` 컬럼의 라벨만 플랫폼으로
  바뀐다 — 컬럼 자체는 그대로다(탑승권에 인쇄된 값을 옮겨 적는 자리라는
  의미가 항공·기차·버스 모두 같아, 새 컬럼을 만들지 않고 라벨만 갈랐다).
- 세 값은 `EditableText`로 직접 고친다. 추출은 입력 보조이며, OCR 이 틀린
  값을 넣었을 때 고칠 길이 없으면 유일 입력이 되어 원칙과 어긋난다.
- **지연·결항·탑승구 변경 알림은 서버가 폴링한다**. `pg_cron`(5분) → `pg_net` →
  `flight-status-watch` Edge Function. 기기 백그라운드는 iOS 에서 앱을
  종료하면 멈추고, 교통편은 출발 직전에만 중요해져 OS 가 가장 홀대하는
  조건에 해당한다.
- cron 은 **하나만** 돈다. 사용자마다 job 을 만들지 않는다 — 교통편을
  등록하면 감시 창(출발 24시간 전)에 들어오고 출발이 지나면 빠진다.
- `trip_transport_flight_status` 가 직전 상태와 발송 이력을 든다.
  직전 상태가 없으면 "변동"을 판단할 수 없고, 발송 이력이 없으면 지연이
  풀릴 때까지 5분마다 같은 알림이 간다. 원본 스케줄은 덮어쓰지 않는다.
  `gate`·`last_notified_gate` 도 같은 이유로 같은 행에 든다.
- **탑승구 변경은 `kind` 와 독립으로 판단한다**(`getIsGateChanged`).
  예정·지연 상태에서만 의미가 있다 — 결항·회항·출발·도착 이후엔 탑승구가
  남아 있어도 이미 지난 일이라 알리지 않는다. 지연 알림과 겹치면 한
  알림 본문에 접미사로 붙어 나간다(`toNotificationText` 세 번째 인자).
  이 `gate` 는 `trip_transport_tickets.gate`(탑승권 인쇄값)와 다른
  컬럼이다 — 실시간 API 값으로 탑승권 값을 덮지 않는다.
- 판정·문구의 원본은 `flightStatusNotify.utils` 다. Edge Function 은
  Deno 라 workspace 를 못 읽어 같은 내용을 옮겨 적었다 — 한쪽만 고치면
  화면은 "지연"이라 말하는데 알림은 오지 않는다.
- `FLIGHT_STATUS_NOTIFY_ALWAYS=true` 면 상태 변경 없이도 매번 보내고
  감시 창을 D+6 까지 넓힌다. 발송 경로를 실기기로 확인할 때만 쓴다.
- 운항 상태 provider는 지원 공항 코드만 공개한다. `flightStatus.utils.ts`가
  provider registry에서 지원 코드를 집계하고, 탑승권 목록 UI는 공항 vocabulary의
  이름을 매핑해 현재 스케줄 변경 알림 대상을 보여준다. provider가 UI 문자열을
  소유하지 않게 해 provider 정책과 표시 정책을 분리한다.
- **공항 도착 안내**는 `airport-arrival-guidance` 도메인 훅이 Edge Function의
  `get-guidance`만 호출한다. 화면은 정책·혼잡 스냅샷을 직접 읽지 않으며, Edge가
  여행 멤버 권한, `trips.is_overseas`, 터미널, 운항 상태, 정책과 혼잡 데이터를
  함께 판단해 표시 결과만 반환한다.
- `trips.is_overseas`가 해외 여부의 단일 기준이다. 생성·목적지 변경 시
  `trip.api.ts`가 `destinations`로 저장값을 갱신하고, 예약 트리거와 Edge Function은
  그 저장값만 읽는다. 국내편은 화면 안내만 만들고 푸시를 예약하지 않는다.
- 운항 상태 푸시는 `tripId`와 `transportId`를 함께 싣고, 채팅 푸시는 `tripId`만
  싣는다. 웹 `src/service-worker.ts`와 앱 `NotificationGateway`는 두 알림
  모듈을 함께 등록할 뿐, 채팅·운항 상태 모듈은 상대 payload를 수용하지 않는다.
  채팅 푸시의 공통 `data` 계약은 `@waylog/domains/modules/trip-chat/tripChatPush`의
  `TripChatPushData`·`isTripChatPushData`가 소유하며, 웹 서비스워커와 앱은 같은
  판별기를 사용한다. 웹 Push API의 제목·본문과 Expo의 알림 봉투는 플랫폼별로
  다르므로 이 공통 모델에 넣지 않는다.
  운항 상태 알림은 탑승권 상세(`/trip/:tripId/transport/:transportId`)로, 채팅
  알림은 기존 채팅 목적지로 이동한다.
- **티켓 뷰어**는 타이틀 없이 어두운 배경에 이미지만 둔다.
  탑승 시 밝기 조절 없이 바코드가 읽히는 것이 목적이다.
  상단은 좌측 닫기 · 우측 `PopMenu`(삭제)다.
- 앱 뷰어는 `open({ tripId, ticketId })` **식별자만** 받고 조회·삭제를 스스로 한다.
  이미지 URL을 받으면 지운 뒤 화면을 갱신할 근거가 호출부에 흩어진다.
  직접 조회하므로 `AsyncBoundary` 가 뷰어 `Modal` **안**에 있다 — 바깥에 두면
  서스펜드하는 동안 Modal 이 열리지 않아 아무것도 보이지 않는다.
- **확인 다이얼로그를 뷰어 안에서 직접 렌더한다**(`ConfirmDialog`).
  `useConfirmDialog` 는 루트 `OverlayProvider` 에 마운트되는데, 뷰어가
  `transparent={false}` 인 불투명 전체화면 `Modal` 이라 그 아래에 깔린다.
  그래서 삭제를 눌러도 확인창이 안 뜨고 뷰어를 닫은 뒤에야 나타났다.
- 생성 퍼널의 드래프트는 저장 전이라 `ticketId` 가 없다.
  `useTicketDraftPreviewOverlay` 로 확인만 하고, 제거는 목록의 ✕ 가 맡는다.
- 티켓의 `memberId`는 `trip_members` 행 id다. 프로필 id로 바로 비교하면
  늘 어긋나므로 `userId`로 내 멤버를 찾아 그 `id`를 쓴다.
- **보딩패스 카드**(`UpcomingTransportSection`)는 정보 탭 기본 화면에 둔다.
  티켓 이미지는 카드에 넣지 않는다 — 카드가 티켓 자체로 보이면 실제
  티켓을 여는 동작과 구분되지 않는다.
  여러 장일 때만 가로 스크롤이고, 한 장이면 스크롤 컨테이너를 두지 않는다.
  가로 스크롤 안에서는 너비 `100%`가 화면이 아니라 콘텐츠 기준이라 닿지 않는다.
- 교통편 목록이 비었을 때는 항공 아이콘·안내 문단·지원 공항 알림 칩과 함께
  `탑승권 등록` 버튼을 표시한다. 목록은 이미 `tripId`를 소유하므로 버튼에서
  기존 등록 경로(`/trip/:tripId/transport/new`)로 직접 이동한다.
- **상세 화면**은 라우트다. 웹은 `/trip/:tripId/transport/:transportId`,
  앱은 `app/trip/[tripId]/transport/[transportId].tsx`.
  구획(요약·실시간·운항정보·티켓·길찾기)마다 `AsyncBoundary`를 따로 둬
  한 구획이 실패해도 나머지는 보이게 한다.
- 상세의 **삭제**는 앱바 우측 `PopMenu` → `useConfirmDialog` 다.
  지운 뒤 상세에 남아 있으면 `useTripTransportDetail`의 `assert`가 곧바로
  터지므로 `router.back()`으로 목록에 되돌린다.
  이 메뉴는 `useTripTransport`(suspense)를 쓰므로 경계로 감싼다 —
  앱바 안에서 서스펜드되면 뒤로가기 버튼까지 사라진다.
- 티켓이 하나도 없으면 티켓 구획의 **컨텐츠 자리**에 점선 추가 버튼을 둔다.
  타이틀 옆 텍스트 버튼은 올릴 것이 없다는 사실을 드러내지 못한다.
  점선 표기는 생성 퍼널 `TicketStep`의 업로드 자리와 같은 값을 쓴다.
- 티켓이 이미 있을 때의 추가는 타이틀 우측 텍스트 버튼이다.
  일행 몫을 나중에 덧붙일 수 있어야 하므로 점선과 별개로 늘 열어둔다.
- **탑승권 입력부는 `transport-ticket/TransportTicketForm`** 하나다.
  생성 퍼널 `TicketStep`과 상세 오버레이가 같은 것을 쓴다.
  제출 버튼은 폼 밖에 있다 — 퍼널은 "건너뛰기·완료", 오버레이는 "추가"로
  문구와 개수가 다르다. 폼은 `submit()`을 ref로 노출한다.
- 오버레이 푸터의 `fullWidth` Button 은 `flex: 1`을 쓴다. column 컨테이너에
  두면 높이가 0으로 접혀 구분선만 남으므로 푸터를 `row`로 둔다.
  `FullScreenPopup`은 상단 인셋만 주니 하단 인셋은 푸터가 직접 넣는다.
- 상세의 추가는 `useTransportTicketFormOverlay`가 `onSubmit`(업로드)을 받아
  **업로드가 끝날 때까지 열어둔다**. 제출과 함께 닫으면 진행도 실패도 볼
  자리가 없고, 고른 이미지가 사라져 다시 고르는 것부터 해야 한다.
  실패하면 패널에 메시지를 남기고 열린 채로 둬 그대로 다시 누를 수 있다.
- 드래프트 하나가 티켓 행 하나라는 규칙(`이미지 업로드 → 행 생성`)은
  `useTransportTicketUpload`에 둔다. 생성 직후와 상세 추가가 같은 규칙이다.
- `useTripTransportDetail`이 내 티켓과 일행 티켓을 갈라 내려준다.
  화면마다 같은 기준으로 갈라야 하므로 도메인에 둔다.
- 설계 근거: [핸드오프](./design_handoff_transport/README.md)

### 경로 뷰 모델 (`RouteItem`)

- `packages/domains/src/modules/trip/routeItem.types.ts`, `routeItem.utils.ts`
- `useDayTripRoutes`가 `places`와 나란히 `items: RouteItem[]`를 내려준다.
  기존 `places`는 그대로 두었다 — UI 전환은 별개 작업이다.
- 교통편의 출발·도착이 경로에서 **인접하고 방향도 같을 때만** 한 항목으로
  접는다. 접힌 블록은 드래그가 한 세트로 움직이고 내부에 드롭 지점이 없어,
  "교통 구간 사이에 장소를 끼울 수 없다"는 제약이 검사 없이 성립한다.
- 인접하지 않으면 접지 않고 그 교통편을 리스트에서 제외한다.
  사용자가 편집한 경로를 시스템이 자동으로 고치지 않는다.
- `toPlaceIds`는 그 역이며 `toRouteItems` → `toPlaceIds`가 원래 순서를 복원한다.
- 한 경로에 같은 장소가 두 번 들어가지 않는다는 것이 전제다
  (`allPlaces.find`가 같은 객체를 두 번 돌려주고 `key`가 중복된다).

### 지도 경로 분할 (`splitIntoSegments`)

- `packages/domains/src/modules/route/roadRoute.utils.ts`
- `breakIndices`는 "이 인덱스와 다음 인덱스 사이를 잇지 않는다"는 경계다.
  교통 구간이 그 경계이며, 없으면 인천→오사카를 육로로 뚫으려다 실패하고
  `fallbackRoadRoute`가 바다를 가로지르는 직선을 그린다.
- 경계로 먼저 자른 뒤 각 조각에 기존 `maxSize` 분할을 적용한다.
  점이 하나뿐인 조각은 버린다(경계가 연달아 오면 가운데가 그렇게 된다).
- `mergeRoadRoutes`도 경계를 안다. `maxSize` 조각은 끝점을 공유해 첫 점을
  버리지만 경계 조각은 공유하지 않아, 버리면 도착지가 사라진다.
- 웹·앱 `useRoadRoute`가 `breakIndices`를 받으며 캐시 키에 함께 넣는다.
  같은 좌표라도 경계가 다르면 다른 경로다.

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

`Fab`는 `variant`로 형태를 고른다. `circular`(기본)은 지금까지의 원형이고,
`extended`는 `label`을 아이콘 오른쪽에 함께 놓는 알약 형태다. 두 경우 모두
`size`는 높이(small 40 / medium 56 / large 64)를 뜻하며, `extended`의 너비만
내용에 맞춰 늘어난다. 라벨 색은 `color`에 따라 컴포넌트가 정하므로 호출부는
문자열만 넘긴다.

장소 탭은 일반 `Fab`를 사용하고, 탭하면 `useTripPlaceAddition`을 통해
장소 검색 바텀시트를 연다. 메뉴·경로 툴바는 계획 탭에만 둔다.
계획 탭의 `MenuFab`를 탭하면 현재 경로의 장소 선택 시트가 열리고,
롱프레스 메뉴에서 `경로 관리`를 누르면 `trip-route/TripRouteToolbar.tsx`가
지도 상단에 고정된다. 선택 날짜의 경로 칩은 가로로 스크롤하고 추가·닫기 버튼은
오른쪽에 고정한다. 툴바는 계획 탭의 경로 목록·선택·추가 콜백을 받아
지도 및 경로 목록과 같은 선택 상태를 사용한다. 툴바를 닫으면 지도 상단의
날씨·설정 컨트롤을 다시 표시한다.

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

네이티브 `TripChatPanel.tsx`는 새로 추가된 메시지가 아래 40px에서 출발하는 Reanimated 슬라이드업·페이드인 효과를 적용하고, 목록의 레이아웃 전환으로 기존 메시지도 240ms 동안 부드럽게 위로 이동한다. 초기 목록·가상화 재마운트·전송 성공 시 ID 교체에는 진입 효과를 반복하지 않으며, 시스템 동작 줄이기 설정을 따른다. 인증 기능의 `PushNotificationCard`는 채팅 패널과 탑승권 상세가 함께 쓰며, 기본 흰 카드 위에 iOS shadow와 Android elevation을 적용해 화면 배경과 구분한다. `SlideReveal`의 overflow clip 안에서 그림자가 잘리지 않도록 카드 바깥 래퍼가 그림자 여백을 소유한다. 전송 버튼은 기본 고정 너비를 `width: 'auto'`로 덮어써 아이콘과 좌우 패딩에 맞추고, 남는 가로 공간은 입력창이 채운다.

핫플레이스 목록(`explorer-recent`)은 웹·앱 모두 `byHotRank`로 정렬한다. 1차 기준은 `score`(방문·사진·포스트 정규화 합산)이고, 동률이면 `lastSavedAt`(RPC `get_explored_places`의 `last_saved_at` = `max(trip_places.created_at)`) 내림차순으로 최근 담긴 장소를 앞에 둔다. 사진·포스트가 없는 장소는 전부 같은 점수를 받아 동률이 대부분을 차지하며(실측 48건 중 39건), 이전에는 그 구간 순서가 RPC 반환 순서에 따라 임의로 정해져 오래전 여행지가 최근 여행지보다 앞에 왔다.

많이 저장된 장소 목록(`explorer-saved`)은 웹·앱 모두 `bySaveRank`로 정렬한다. 1차 기준은 저장 수이고, 저장 수가 같으면 `lastSavedAt`(RPC `get_most_saved_places`의 `last_saved_at` = `max(trip_places.created_at)`) 내림차순으로 최근 저장된 장소를 앞에 둔다. `saveCount`가 정수라 동률이 많고, 이전에는 그 구간 순서가 RPC 반환 순서에 따라 매번 달라졌다. `lastSavedAt`은 마이그레이션 적용 전 응답에 없을 수 있어 선택 필드이며, 없으면 저장 수 순서를 유지한다.

최근 앱 검증 반영: `RouterTabNavigation`은 탭 전환 시 현재 라우트 파라미터를 전달하며, 공용 `Tabs`는 화면 전환 중 레이아웃 상태 갱신을 하지 않는다. 정산 경로 기반 화면은 Google 지도와 일차별 장소·지출 추가 액션을 포함한다.

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
| 저장 순위 정렬       | `features/explorer/explorer-saved/mostSavedPlaces.utils.ts` (`bySaveRank`) |
| 핫플레이스 정렬      | `features/explorer/explorer-recent/recentHotPlaces.utils.ts` (`byHotRank`) |
| 계절 인기 지역       | `features/tourism-trend/`, `features/explorer/explorer-seasonal-regions/` |
| 피드/포스트          | `features/post/FeedPage.tsx`, `features/post/post-form-funnel/`          |
| 사용자 프로필        | `features/user-profile/UserProfilePage.tsx`                       |
| 통계                 | `features/statistics/StatisticsPage.tsx`                          |
| 지도 (공통)          | `shared/components/Map/` (kakao / google 구현 분기)               |
| 사진 업로드          | `shared/components/photo/PhotoUploader.tsx`                       |
| 사진 상세 뷰어       | 웹 `shared/components/photo/PhotoBottomSheet.tsx`(모바일)·`PhotoDialog.tsx`(데스크탑), 앱 `shared/components/photo/PhotoBottomSheet.tsx`. 웹·앱 모두 여행 탭과 장소 탭이 같은 뷰어를 공유하며, `onDelete`·`onUpdate`·`places` 를 넘긴 만큼만 편집 UI 가 켜진다 |
| 장소 사진 스트립     | 앱 `features/place/PlacePhotoStrip.tsx` — 썸네일 가로 목록과 뷰어 연결을 모은다. 탐색 장소 상세(`explorer/PlaceDetailScreen`)와 장소 상세 시트(`place/PlacePhotoList`)가 읽기 전용으로 쓰고, 여행 장소 탭(`trip/trip-place/PlacePhotoSection`)은 자체 목록에서 편집 가능하게 뷰어를 연다 |
| 환율 설정            | 웹 데스크탑 `features/trip/trip-expense/TripExchangeRateSettingButton.tsx`, 앱 동명 파일. 앱은 지출 등록 전에도 정할 수 있도록 `getUsedCurrencies`(지출 기준) 대신 `getCurrenciesByDestinations`(목적지 기준)로 통화를 뽑는다. `trip.isOverseas` 는 저장값이 아니라 목적지가 `LocationCountry` 의 키일 때만 참이다 |
| 사진 공개 뱃지/장소 변경 | `shared/components/photo/PhotoVisibilityBadge.tsx`, `PhotoPlaceSelect.tsx` |
| 여행 사진 탭         | `features/trip/trip-photo/TripPhotoContent.*.tsx`                 |
| 사진 EXIF 장소 매칭  | 웹 `features/photo/photo.utils.ts` + `shared/utils/exif.ts`(exifr), 앱 `features/photo/exif.utils.ts`(picker 의 `exif: true`). 매칭은 `findNearestPlace(.., { withinMeters: 500 })` 공유 |
| 체크리스트           | `features/trip/trip-checklist/`                                   |
| 공항 정적 데이터 | `packages/domains/src/modules/airport/` |
| 항공사 정적 데이터 | `packages/domains/src/modules/airline/` |
| 항공편 운항 상태 | `packages/domains/src/modules/flight-status/` |
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

개발 빌드에서는 `mapMotionDiagnostics.ts`가 각 클러스터 전이의 참여 클러스터 수, 좌표 갱신 수,
클러스터 렌더 수, rAF 실행 횟수와 25ms를 넘긴 프레임 수·최장 프레임, 겹친 카메라 이벤트 수를 Metro 콘솔의
`[Map motion]` 로그로 기록한다. 각 로그는 MapView 인스턴스별 `mapId`·포커스 상태를 포함한다. `[Map lifecycle]`은 포커스 전환을 기록한다. 카메라 이벤트 묶음도 `[Map camera]` 로그로 별도 기록해 전이와 겹친 횟수와
rAF 지연을 분리해 볼 수 있다. 성능 문제를 조사하기 위한 계측이므로 릴리스 빌드에서는 동작하지 않는다.

## 2026-08 앱 포팅 현황

- 탐색 탭과 여행 상세의 장소·계획 탭은 비활성 상태에서 `freezeOnBlur`로 React 렌더와 지도 갱신을 멈춘다. 비포커스 상태에서는 Mapbox `MapView`도 렌더 트리에서 제거해 네이티브 카메라 이벤트와 렌더 작업을 남기지 않는다. 지도는 탭 복귀 뒤 400ms 동안 클러스터 전이를 기준값으로만 동기화한다. 제스처·관성 중에는 최신 native 이벤트를 ref에 저장하고 100ms마다 한 번만 샘플링하며, 120ms 안정화 시점에 한 번만 다시 묶는다. 화면 가장자리 밖으로 나간 단독 마커는 300ms 뒤 제거해 빠른 카메라 이동 중 `MarkerView` 재생성을 줄인다.
- 홈 하단 탭: `apps/waylog-app/app/(tabs)/_layout.tsx`에 내 여행·피드·탐색·프로필 4개 탭을 구성했다. 통계 탭은 제외했다.
- 여행 목록: 웹의 진행 중·예정·지난 여행 분류와 진행률/D-day UI를 RN으로 포팅했다.
- 피드: `/feed` 라우트와 포스트 목록/좋아요/대표 이미지 표시를 추가했고, 포스트 카드를 `/post/[postId]` 상세 화면으로 연결했다. 카드 폭을 실제 레이아웃 측정값으로 계산해 웹과 같은 이미지 비율을 유지한다. 새 포스트 FAB는 `/post/new`로 이동하며, 웹과 같은 여행 선택 → 사진 선택 → 상세 설정 3단계 흐름을 제공한다. 사진은 네이티브 보관함 또는 여행 저장 사진에서 고르고 앱 스토리지 업로드 후 공용 `@waylog/domains`의 `useCreatePost`로 등록한다.
- 탐색: `/explorer`, `top-visited`, `recent-hot`, `most-saved` 라우트와 목록·지도·필터 UI를 추가했다. 장소 선택은 오버레이 대신 `/explorer/[placeId]` 페이지로 이동하며, 상세 페이지는 기본정보·피드 탭으로 구성된다. 필터는 공용 RN `Extrude`가 최초 source/target 좌표를 기준으로 이동·타깃 페이드·레이아웃 높이 축소/복원을 함께 처리한다. 카탈로그는 Y축으로 타이틀에 이동하고, 뒤로가기 타이틀이 있는 큐레이션 상세는 X·Y축으로 대각선 이동한다. 핫플레이스 상세의 기간 필터도 웹처럼 지역·카테고리 필터와 같은 행에서 함께 이동한다. 탭 라우트는 실제 하단 탭바 높이를 카탈로그 스크롤 인셋에 전달해 마지막 콘텐츠가 탭바에 가려지지 않게 한다. 카탈로그 데이터 쿼리는 웹처럼 계절·최근·저장·방문 섹션별 Suspense와 전용 스켈레톤으로 격리하며, 장소 카테고리는 도메인 enum 원값이 아니라 `PlaceCategoryTypeLabel`의 사용자용 라벨로 표시한다.
- 프로필: `/u/[userId]` 라우트와 피드 사진 그리드·기록 탭·로그아웃을 추가했다. 피드 사진 조회는 피드와 동일한 공용 포스트 모델을 사용하며 사진을 누르면 포스트 상세로 이동한다. 기록 탭을 선택하면 지도 상단이 화면 상단에 맞도록 자동 스크롤한다.
- 원격 이미지: `apps/waylog-app/src/shared/components/LoadableImage.tsx`가 이미지 로딩 중 동일한 박스 크기의 스켈레톤을 표시한다. 프로필·피드·포스트 상세·탐색·장소·여행 사진 UI에서 공통으로 사용한다.
  `source.uri` 가 `http://` 면 `https://` 로 올려 보낸다 — iOS ATS 와 Android cleartext 정책이 평문 HTTP 를 차단하는데, 카카오 로그인이 넘기는 `avatar_url` 이 전부 `http://` 라 앱에서만 아바타가 깨졌다(웹 브라우저는 같은 URL 을 그대로 연다). 스킴 접두사만 잘라내므로 쿼리에 `http%3A%2F%2F` 가 든 `img1.kakaocdn.net` 썸네일 URL 도 안전하다.
  로딩 실패는 스켈레톤이 아니라 `fallback` 으로 그린다. 예전에는 에러도 스켈레톤이라 실패가 영원한 로딩으로 보여 원인을 가렸다. `Avatar` 는 `fallback` 에 이름 첫 글자를 넘긴다.
- 통계는 요청 범위에서 제외했으며 구현하지 않았다.
- 장소 검색: `features/place/place-search/`를 웹 구조(`PlaceSearchBottomSheet` → 키워드 확정 시 `PlaceSearchSelectScreen` 상세 화면 전환, `useLastSearchKeywords` 최근 검색어)와 동일하게 맞췄다. 상세 화면은 웹의 지도+리스트 `SplitView`(좌우 리사이즈) 대신 지도(상단 고정 비율)+리스트(하단 `FlatList`) 세로 배치로 대체했고, 페이지네이션은 `IntersectionArea` 대신 `FlatList`의 `onEndReached`를 쓴다. 최근 검색어 저장은 웹 `useStorageState`(localStorage 동기) 대신 앱 `useStorageStore`(AsyncStorage 비동기) 위에 만료 필터링을 직접 구현했다. 데스크탑 전용 `PlaceSearchDialog`/`usePlaceSearchDialog`는 이식 대상에서 제외했다.
- 계획 탭 장소 추가(`trip-route/PlaceSelectSheet.tsx`): 웹과 같이 이름·주소·태그 검색 필터, 검색 아이콘 버튼, 카테고리 색상 점, 태그 칩, 좌측 `Checkbox` 선택을 갖는다. 검색어를 확정하면 `PlaceSearchSelectScreen` 으로 신규 장소를 검색하고, 선택 시 `useTripPlaces.create` 로 여행 장소를 만든 뒤 그 id 를 곧바로 선택 상태에 넣는다. 웹이 `Slide` 전면 오버레이로 띄우는 검색 화면은 앱에서 `PlaceSearchBottomSheet` 와 같은 형제 시트(`backdrop={false}`)로 옮겼고, 상세 헤더의 입력에서 재검색하면 웹처럼 부모 목록의 검색어도 함께 바뀐다. 앱에서만 필요한 처리 세 가지:
  - `ListItem.Button` 은 `leftAddon` 을 내부 `Pressable` 바깥에 두므로 체크박스에도 같은 토글을 직접 잇는다 — 웹처럼 행 클릭이 버블링되지 않는다.
  - `Chip` 은 `onPress` 없이도 `Pressable` 을 그려 태그 영역이 행 선택의 사각지대가 된다. 태그 `Stack` 에 `pointerEvents="none"` 을 준다.
  - 신규 장소 생성 뒤 검색어를 비운다. 그대로 두면 방금 만든 장소가 필터에 걸려 목록에서 사라지고 "추가 (n)" 만 남는다.

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
