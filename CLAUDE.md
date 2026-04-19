# Travel App — 코드베이스 가이드

@CLAUDE.style.md

---

## Git 컨벤션

- **커밋은 역할 단위로 세분화한다** — 기능 구현·스타일 수정·리팩토링·문서 등 역할이 다르면 커밋을 분리한다
- **기능 단위 작업은 브랜치를 생성한다** — `main`에 직접 커밋하지 않고, 기능별 브랜치(`feat/...`, `fix/...` 등)를 따서 작업한다

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | React 19 + React Router 7 (SSR) |
| Language | TypeScript 5.9 |
| Build | Vite 7 |
| UI | Material-UI 7 + Tailwind CSS |
| State | Zustand 5 + TanStack React Query 5 |
| Backend | Supabase (DB + Storage) |
| Maps | Kakao Maps / Google Maps (선택) |
| Forms | React Hook Form 7 |

---

## 라우팅

```
/               → TripListPage
/trip/:tripId   → TripDetailPage
/trip/new       → TripCreatePage
*               → NotFound
```

**파일 위치:** `src/app/routes.ts`

`TripDetailPage`는 모바일/데스크탑 분기:
- `src/features/trip/TripDetailPage.mobile.tsx` — 탭 기반 내비게이션
- `src/features/trip/TripDetailPage.desktop.tsx` — 사이드바 레이아웃

---

## 디렉토리 구조

```
src/
├── app/                        # 앱 진입점 및 설정
│   ├── routes.ts               # 라우트 정의
│   ├── root.tsx                # 루트 레이아웃 & 전역 Provider
│   └── query-client.ts         # React Query 설정
│
├── api/                        # 외부 시스템 어댑터
│   ├── client.ts               # Supabase 클라이언트
│   ├── _database.types.ts      # Supabase 자동 생성 타입 (직접 수정 금지)
│   └── tables.types.ts         # 테이블 Row 타입 헬퍼
│
├── features/                   # 도메인별 기능 모듈
│   ├── auth/                   # 인증
│   ├── expense/                # 지출 도메인 (공통 로직)
│   │   ├── expense.api.ts      # Supabase CRUD
│   │   ├── expense.types.ts    # Expense, SettlementBalance 등 타입
│   │   ├── expense.utils.ts    # calculateBalancesInKRW, calculateSettlements
│   │   ├── currency.ts         # 환율 변환 (convertToKRW)
│   │   └── useExpenses.ts      # React Query 훅
│   │
│   ├── explorer/               # 장소 탐색 (방문 기록 기반 지도)
│   ├── location/               # 위치 vocabulary (Location, Region, Country)
│   │   ├── location.model.ts
│   │   └── location.utils.ts
│   │
│   ├── photo/                  # 사진 도메인
│   │   ├── photo.api.ts
│   │   └── photo.types.ts
│   │
│   ├── place/                  # 장소/POI 도메인
│   │   ├── place.api.ts
│   │   ├── place.types.ts
│   │   ├── recommended-place.api.ts  # 추천 장소 API
│   │   ├── PlaceForm.tsx
│   │   ├── usePlace.ts
│   │   └── place-search/       # 장소 검색 (BottomSheet / Dialog)
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
│   │
│   └── trip/                   # 여행 도메인 (메인 기능)
│       ├── trip.api.ts
│       ├── trip.types.ts
│       ├── useTrip.ts
│       ├── useTrips.ts
│       ├── TripListPage.tsx
│       ├── TripDetailPage.tsx          # 반응형 분기 래퍼
│       ├── TripDetailPage.mobile.tsx
│       ├── TripDetailPage.desktop.tsx
│       ├── components/                 # 여행 공통 UI 컴포넌트
│       ├── hooks/                      # 여행 공통 훅
│       │
│       ├── trip-basic-info/            # 기본 정보 탭
│       ├── trip-checklist/             # 체크리스트 탭
│       ├── trip-create/                # 여행 생성 마법사 (3단계)
│       │   ├── TripCreatePage.tsx
│       │   ├── DestinationStep.tsx
│       │   ├── DateStep.tsx
│       │   └── InfoStep.tsx
│       ├── trip-expense/               # 지출/정산 탭
│       │   ├── ExpenseContent.mobile.tsx
│       │   ├── ExpenseContent.desktop.tsx
│       │   ├── ExpenseForm.tsx
│       │   ├── SettlementSummary.tsx   # 개인별 정산 현황
│       │   └── RouteExpenseView.tsx    # 경로별 지출 보기
│       ├── trip-invite/                # 여행 초대
│       ├── trip-member/                # 멤버 관리
│       │   ├── tripMember.api.ts
│       │   ├── tripMember.types.ts
│       │   └── useTripMembers.ts
│       ├── trip-memo/                  # 메모 탭
│       ├── trip-photo/                 # 사진 탭
│       ├── trip-place/                 # 장소 탭
│       └── trip-route/                 # 일정/경로 탭
│           ├── TripRoutesContent.mobile.tsx
│           ├── TripRoutesContent.desktop.tsx
│           ├── useTripRoutes.ts
│           └── useDayTripRoutes.ts
│
└── shared/                     # 공통 모듈
    ├── components/
    │   ├── bottom-sheet/       # 재사용 바텀시트
    │   ├── Map/                # 지도 추상화 (Kakao / Google 선택)
    │   │   ├── index.tsx
    │   │   ├── kakao/
    │   │   └── google/
    │   ├── confirm-dialog/     # 확인 다이얼로그 시스템
    │   ├── date-range/         # 날짜 범위 선택기
    │   ├── dnd/                # 드래그 앤 드롭 (@dnd-kit)
    │   ├── layout/             # TopNavigation (mobile / desktop)
    │   ├── photo/              # PhotoUploader, PhotoDialog, PhotoThumbnail
    │   ├── ListItem.tsx
    │   ├── PopMenu.tsx
    │   └── EditableText.tsx
    │
    ├── hooks/
    │   ├── env/
    │   │   └── useIsMobile.ts      # 반응형 분기
    │   ├── urls/
    │   │   ├── useQueryParam.ts    # URL 쿼리 파라미터
    │   │   ├── useQueryParamState.ts
    │   │   └── useSearchParams.tsx # SearchParam 컨텍스트
    │   ├── useOverlay.tsx          # 오버레이/모달 시스템
    │   └── ...
    │
    ├── model/
    │   └── coordinate.model.ts     # 공용 좌표 타입
    │
    └── utils/
        ├── formats.ts          # 날짜/숫자 포맷
        ├── geo.ts              # 위치 유틸
        └── common.ts
```

---

## 주요 패턴

### 위치 모델링
- `features/location/`은 지리 vocabulary를 담당합니다.
- `Location`은 실제로 선택/표시/집계하는 구체 지명 단위입니다. 예: `서울`, `도쿄`, `오사카`
- `Region`은 `Location`의 상위 지역입니다. 예: `강원도`, `간사이`, `홋카이도`
- `Country`는 `Location`의 국가 메타입니다. 예: `South Korea`, `Japan`
- `Destination`은 별도 베이스 모델이 아니라, 여행 생성 UI에서 선택 가능한 `Location` 집합입니다.
- 공용 위치 vocabulary는 `src/features/location/location.model.ts`와 `src/features/location/location.utils.ts`에서 관리합니다.
- 관계형 상수는 `LocationCountry`, `LocationRegion`, `LocationCoordinate`, `LocationCurrency`, `CountryCode`처럼 `ByX`보다 목적어 중심 이름을 우선합니다.

### 공용 좌표 모델
- `Coordinate`는 지도 컴포넌트 타입이 아니라 공용 값 모델입니다.
- 원천 타입은 `src/shared/model/coordinate.model.ts`에 두고, 지도/위치/훅이 함께 참조합니다.
- `shared/components/Map/types.ts`는 이를 다시 export만 합니다.

### 여행지 선택 UI 모델
- 여행 생성/수정 화면에서 쓰는 선택지 모델은 `src/features/trip/destination-options/`에 둡니다.
- `DestinationOption`, `DestinationGroupOptions`, `Destinations`는 UI 소비를 위한 모델이며, 공용 위치 vocabulary와 분리합니다.

### 반응형 컴포넌트
모바일/데스크탑 파일을 분리하고 래퍼에서 `useIsMobile()`로 분기합니다.
수정 시 `.mobile.tsx`와 `.desktop.tsx` 양쪽 모두 확인할 것.

```
TripDetailPage.tsx          ← 분기 래퍼
TripDetailPage.mobile.tsx   ← 모바일 구현
TripDetailPage.desktop.tsx  ← 데스크탑 구현
```

### API / 훅 패턴
- `*.api.ts` — Supabase 직접 호출, DB row → 도메인 모델 변환
- `use*.ts` — React Query 훅으로 감싸서 컴포넌트에 제공
- DB 타입은 `src/api/_database.types.ts` (자동 생성, 직접 수정 금지)

### 오버레이 시스템
모달/바텀시트는 `useOverlay` 훅 또는 `@toss/use-overlay`를 통해 명령형으로 열고 닫습니다.

---

## 기능별 탐색 가이드

| 기능 | 핵심 파일 |
|------|-----------|
| 여행 목록/생성 | `features/trip/TripListPage.tsx`, `features/trip/trip-create/` |
| 위치 vocabulary | `features/location/location.model.ts`, `features/location/location.utils.ts` |
| 여행 상세 레이아웃 | `features/trip/TripDetailPage.*.tsx` |
| 지출 내역 UI | `features/trip/trip-expense/ExpenseContent.*.tsx` |
| 정산 계산 로직 | `features/expense/expense.utils.ts` |
| 정산 현황 UI | `features/trip/trip-expense/SettlementSummary.tsx` |
| 멤버 관리 | `features/trip/trip-member/` |
| 일정/경로 | `features/trip/trip-route/`, `features/route/` |
| 장소 검색 | `features/place/place-search/` |
| 지도 | `shared/components/Map/` |
| 사진 업로드 | `shared/components/photo/PhotoUploader.tsx` |
| 체크리스트 | `features/trip/trip-checklist/` |
| 메모 | `features/trip/trip-memo/` |
| 추천 장소 | `features/place/recommended-place.api.ts`, `features/trip/trip-place/useRecommendedPlaces.ts` |
