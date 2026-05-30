# 코드베이스 레퍼런스

프로젝트 구조와 주요 패턴을 빠르게 파악하기 위한 참조 문서.

---

## 기술 스택

| 분류      | 기술                               |
| --------- | ---------------------------------- |
| Framework | React 19 + React Router 7 (SSR)    |
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
/                         → TripListPage
/feed                     → FeedPage
/statistics               → StatisticsPage
/explorer                 → PlaceExplorerPage
/explorer/top-visited     → TopVisitedPage
/explorer/recent-hot      → RecentHotPage
/explorer/most-saved      → MostSavedPage
/trip/:tripId             → TripDetailPage
/trip/new                 → TripCreatePage
/trip/invite/:shareLink   → TripInvitePage
/place/:placeId           → PlaceDetailPage
/u/:userId                → UserProfilePage
/post/new                 → PostFormPage
/post/:postId             → PostDetailPage
/login                    → LoginPage
*                         → NotFound
```

**파일 위치:** `src/app/routes.ts`

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
│   ├── routes.ts               # 라우트 정의
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
│   │   ├── PlaceExplorerPage.tsx
│   │   ├── ExplorerMap.tsx
│   │   ├── ExplorerCatalog.tsx
│   │   ├── explorer-detail/    # 장소 상세 오버레이/패널
│   │   ├── explorer-filters/   # 필터 (카테고리·위치)
│   │   ├── explorer-place-item/ # PlaceCard, PlaceListItem
│   │   ├── explorer-ranking/   # 최다 방문 순위
│   │   ├── explorer-recent/    # 급상승 장소
│   │   ├── explorer-saved/     # 저장 순위
│   │   └── explorer-view/      # 뷰 모드 토글
│   │
│   ├── intro/                  # 인트로 배너
│   ├── location/               # 위치 vocabulary (Location, Region, Country)
│   │   ├── location.model.ts
│   │   ├── location.constants.ts
│   │   ├── location.utils.ts
│   │   └── country.model.ts
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
│   │   ├── place-detail/       # 장소 상세 페이지
│   │   └── place-search/       # 장소 검색 (BottomSheet / Dialog)
│   │
│   ├── post/                   # 포스트/피드 도메인
│   │   ├── post.api.ts
│   │   ├── post.types.ts
│   │   ├── FeedPage.tsx
│   │   ├── PostDetailPage.tsx
│   │   ├── place-feed/         # 장소별 피드
│   │   └── post-form/          # 포스트 작성 마법사
│   │
│   ├── route/                  # 경로 도메인
│   │   ├── route.api.ts
│   │   ├── route.types.ts
│   │   └── road-route/         # 실제 도로 경로 (Google Maps Directions)
│   │       ├── roadRoute.api.ts
│   │       ├── roadRoute.schema.ts
│   │       └── useRoadRoute.ts
│   │
│   ├── statistics/             # 여행 통계
│   ├── tracking/               # 위치 추적
│   ├── user-profile/           # 사용자 프로필
│   │   ├── user-profile.api.ts
│   │   ├── user-profile.type.ts
│   │   ├── UserProfilePage.tsx
│   │   └── useUserProfile.ts
│   │
│   └── trip/                   # 여행 도메인 (메인 기능)
│       ├── trip.api.ts
│       ├── trip.types.ts
│       ├── useTrip.ts
│       ├── useTrips.ts
│       ├── TripDetailPage.tsx          # 반응형 분기 래퍼
│       ├── TripDetailPage.mobile.tsx
│       ├── TripDetailPage.desktop.tsx
│       ├── components/                 # 여행 공통 UI 컴포넌트
│       ├── hooks/                      # 여행 공통 훅
│       │
│       ├── trip-basic-info/            # 기본 정보 탭
│       ├── trip-checklist/             # 체크리스트 탭
│       ├── trip-community-routes/      # 커뮤니티 경로 탭
│       │   ├── communityRoute.api.ts
│       │   ├── communityRoute.types.ts
│       │   └── useCommunityRoutes.ts
│       ├── trip-create/                # 여행 생성 마법사 (3단계)
│       │   ├── TripCreatePage.tsx
│       │   ├── DestinationStep.tsx
│       │   ├── DateStep.tsx
│       │   └── InfoStep.tsx
│       ├── trip-expense/               # 지출/정산 탭
│       │   ├── ExpenseContent.mobile.tsx
│       │   ├── ExpenseContent.desktop.tsx
│       │   ├── ExpenseForm.tsx
│       │   ├── SettlementSummary.tsx
│       │   └── RouteExpenseView.tsx
│       ├── trip-invite/                # 여행 초대
│       ├── trip-list/                  # 여행 목록 페이지
│       │   ├── TripListPage.tsx
│       │   ├── OngoingHero.tsx
│       │   ├── UpcomingCard.tsx
│       │   └── PastTripRow.tsx
│       ├── trip-member/                # 멤버 관리
│       │   ├── tripMember.api.ts
│       │   ├── tripMember.types.ts
│       │   └── useTripMembers.ts
│       ├── trip-memo/                  # 메모 탭
│       ├── trip-photo/                 # 사진 탭
│       ├── trip-place/                 # 장소 탭
│       │   ├── useTripPlaces.ts
│       │   ├── TripPlaceContent.tsx
│       │   ├── TripPlaceAdditionButton.tsx
│       │   └── trip-place-form/        # 장소 추가/수정 폼 & 오버레이
│       ├── trip-recommend/             # 추천 장소
│       │   ├── trip-recommend.api.ts
│       │   ├── useRecommendedPlaces.ts
│       │   ├── RecommendedMarkers.tsx
│       │   ├── RecommendedPlaceDetailOverlay.tsx
│       │   └── RecommendedPlaceListSection.tsx
│       └── trip-route/                 # 일정/경로 탭
│           ├── TripRoutesContent.mobile.tsx
│           ├── TripRoutesContent.desktop.tsx
│           ├── useTripRoutes.ts
│           └── useDayTripRoutes.ts
│
└── shared/                     # 공통 모듈
    ├── components/
    │   ├── bottom-sheet/
    │   ├── Map/                # 지도 추상화
    │   │   ├── index.tsx
    │   │   └── kakao/
    │   ├── confirm-dialog/
    │   ├── date-range/
    │   ├── dnd/                # 드래그 앤 드롭 (@dnd-kit)
    │   ├── layout/             # TopNavigation (mobile / desktop)
    │   ├── notification-card/
    │   ├── photo/              # PhotoUploader, PhotoDialog, PhotoThumbnail
    │   ├── statistics/         # StatisticsBarChart, StatisticsDonutChart 등
    │   ├── PopMenu.tsx
    │   ├── SwitchCase.tsx
    │   └── MultiSelectDropdown.tsx
    │
    ├── config/
    │   └── theme.ts            # MUI 테마
    │
    ├── hooks/
    │   ├── animation/          # useAnimation, useCountdownAnimation
    │   ├── dom/                # useElementSize, useResizableSplit
    │   ├── env/
    │   │   ├── useIsMobile.ts
    │   │   └── useCurrentCoordinate.ts
    │   ├── extends/            # useBooleanState, useDebouncedValue 등
    │   ├── interaction/        # useScrollStatus, useDismissCallback 등
    │   ├── urls/
    │   │   ├── useQueryParam.ts
    │   │   ├── useQueryParamState.ts
    │   │   └── useSearchParams.tsx
    │   └── useOverlay.tsx      # 오버레이/모달 시스템
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

---

## 기능별 탐색 가이드

| 기능                 | 핵심 파일                                                  |
| -------------------- | ---------------------------------------------------------- |
| 여행 목록            | `features/trip/trip-list/TripListPage.tsx`                 |
| 여행 생성            | `features/trip/trip-create/`                               |
| 위치 vocabulary      | `features/location/location.model.ts`, `location.utils.ts` |
| 여행 상세 레이아웃   | `features/trip/TripDetailPage.*.tsx`                       |
| 지출 내역 UI         | `features/trip/trip-expense/ExpenseContent.*.tsx`          |
| 정산 계산 로직       | `features/expense/expense.utils.ts`                        |
| 정산 현황 UI         | `features/trip/trip-expense/SettlementSummary.tsx`         |
| 멤버 관리            | `features/trip/trip-member/`                               |
| 일정/경로            | `features/trip/trip-route/`, `features/route/`             |
| 커뮤니티 경로        | `features/trip/trip-community-routes/`                     |
| 장소 탭              | `features/trip/trip-place/TripPlaceContent.tsx`            |
| 장소 검색            | `features/place/place-search/`                             |
| 장소 상세            | `features/place/place-detail/PlaceDetailPage.tsx`          |
| 추천 장소            | `features/trip/trip-recommend/`                            |
| 장소 탐색 (Explorer) | `features/explorer/PlaceExplorerPage.tsx`                  |
| 피드/포스트          | `features/post/FeedPage.tsx`, `features/post/post-form/`   |
| 사용자 프로필        | `features/user-profile/UserProfilePage.tsx`                |
| 통계                 | `features/statistics/StatisticsPage.tsx`                   |
| 지도                 | `shared/components/Map/`                                   |
| 사진 업로드          | `shared/components/photo/PhotoUploader.tsx`                |
| 체크리스트           | `features/trip/trip-checklist/`                            |
| 메모                 | `features/trip/trip-memo/`                                 |
