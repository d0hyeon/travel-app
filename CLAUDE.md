# Travel App — 코드베이스 가이드

@CLAUDE.style.md

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
- `src/app/trip/TripDetailPage.mobile.tsx` — 탭 기반 내비게이션
- `src/app/trip/TripDetailPage.desktop.tsx` — 사이드바 레이아웃

---

## 디렉토리 구조

```
src/
├── app/                        # 기능별 모듈
│   ├── routes.ts               # 라우트 정의
│   ├── root.tsx                # 루트 레이아웃 & 전역 Provider
│   ├── client-database.ts      # IndexedDB 초기화
│   │
│   ├── lib/                    # 외부 라이브러리 어댑터
│   │   ├── supabase.ts         # Supabase 클라이언트
│   │   ├── query-client.ts     # React Query 설정
│   │   ├── database.types.ts   # Supabase 자동 생성 타입 (yarn gen-types)
│   │   └── database-row.types.ts
│   │
│   ├── expense/                # 지출 도메인 (공통 로직)
│   │   ├── expense.api.ts      # Supabase CRUD
│   │   ├── expense.types.ts    # Expense, SettlementBalance 등 타입
│   │   ├── expense.utils.ts    # calculateBalancesInKRW, calculateSettlements
│   │   ├── currency.ts         # 환율 변환 (convertToKRW)
│   │   └── useExpenses.ts      # React Query 훅
│   │
│   ├── photo/                  # 사진 도메인
│   │   ├── photo.api.ts
│   │   └── photo.types.ts
│   │
│   ├── place/                  # 장소/POI 도메인
│   │   ├── place.api.ts
│   │   ├── place.types.ts
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
│   └── trip/                   # 여행 도메인 (메인 기능)
│       ├── trip.api.ts
│       ├── trip.types.ts
│       ├── useTrip.ts
│       ├── useTrips.ts
│       ├── TripListPage.tsx
│       ├── TripDetailPage.tsx          # 반응형 분기 래퍼
│       ├── TripDetailPage.mobile.tsx
│       ├── TripDetailPage.desktop.tsx
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
    │   ├── BottomSheet/        # 재사용 바텀시트
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
    ├── config/
    │   └── theme.ts            # MUI 테마
    │
    ├── hooks/
    │   ├── useIsMobile.ts      # 반응형 분기
    │   ├── useOverlay.tsx      # 오버레이/모달 시스템
    │   ├── useQueryParam.ts    # URL 쿼리 파라미터
    │   ├── useSearchParams.tsx # SearchParam 컨텍스트
    │   └── usePlaceSearch.ts   # 장소 검색
    │
    └── utils/
        ├── assert.ts           # 단언 유틸
        ├── formats.ts          # 날짜/숫자 포맷
        ├── geo.ts              # 위치 유틸
        └── common.ts
```

---

## 주요 패턴

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
- DB 타입은 `app/lib/database.types.ts` (자동 생성, 직접 수정 금지)

### 오버레이 시스템
모달/바텀시트는 `useOverlay` 훅 또는 `@toss/use-overlay`를 통해 명령형으로 열고 닫습니다.

---

## 기능별 탐색 가이드

| 기능 | 핵심 파일 |
|------|-----------|
| 여행 목록/생성 | `trip/TripListPage.tsx`, `trip/trip-create/` |
| 여행 상세 레이아웃 | `trip/TripDetailPage.*.tsx` |
| 지출 내역 UI | `trip/trip-expense/ExpenseContent.*.tsx` |
| 정산 계산 로직 | `expense/expense.utils.ts` |
| 정산 현황 UI | `trip/trip-expense/SettlementSummary.tsx` |
| 멤버 관리 | `trip/trip-member/` |
| 일정/경로 | `trip/trip-route/`, `route/` |
| 장소 검색 | `place/place-search/` |
| 지도 | `shared/components/Map/` |
| 사진 업로드 | `shared/components/photo/PhotoUploader.tsx` |
| 체크리스트 | `trip/trip-checklist/` |
| 메모 | `trip/trip-memo/` |
