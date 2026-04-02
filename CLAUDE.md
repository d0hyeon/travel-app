# Travel App — 코드베이스 가이드

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
/                   → TripListPage          (여행 목록)
/trip/new           → TripCreatePage        (여행 생성 마법사)
/trip/:tripId       → TripDetailPage        (여행 상세)
*                   → NotFound
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
│   ├── database.ts             # IndexedDB 초기화
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
│   │   └── road-path/          # 실제 도로 경로 (Google Maps Directions)
│   │       ├── roadPath.api.ts
│   │       └── useRoadPath.ts
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
    │   ├── date-range/         # 날짜 범위 선택기
    │   ├── dnd/                # 드래그 앤 드롭 (@dnd-kit)
    │   ├── layout/             # TopNavigation (mobile / desktop)
    │   ├── photo/              # PhotoUploader, PhotoDialog, PhotoThumbnail
    │   ├── ListItem.tsx
    │   ├── PopMenu.tsx
    │   └── EditableText.tsx
    │
    ├── hooks/
    │   ├── useIsMobile.ts      # 반응형 분기
    │   ├── useOverlay.tsx      # 오버레이/모달 시스템
    │   ├── useQueryParam.ts    # URL 쿼리 파라미터
    │   └── usePlaceSearch.ts   # 장소 검색
    │
    ├── lib/
    │   ├── supabase.ts         # Supabase 클라이언트
    │   ├── query-client.ts     # React Query 설정
    │   ├── database.types.ts   # Supabase 자동 생성 타입 (yarn gen-types)
    │   ├── kakao.ts
    │   └── kakaoMobility.ts
    │
    ├── modules/
    │   ├── theme.ts            # MUI 테마
    │   └── confirm-dialog/     # 확인 다이얼로그 시스템
    │
    └── utils/
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
- DB 타입은 `shared/lib/database.types.ts` (자동 생성, 직접 수정 금지)

### 오버레이 시스템
모달/바텀시트는 `useOverlay` 훅 또는 `@toss/use-overlay`를 통해 명령형으로 열고 닫습니다.

---

## 코드 스타일 가이드

### 아키텍처

- `app/` — 도메인 관심사. Feature Sliced 방식으로 도메인 > 세부 도메인 계층 구조
- `shared/` — 도메인 무관한 범용 모듈 (컴포넌트, 훅, 유틸)
- 외부 어댑터(Supabase 등) 파일명은 `*.api.ts`로 통일

### 모듈 책임

- 각 모듈은 하나의 명확한 책임만 가진다
- 인터페이스가 어색하게 느껴지면 책임 과중 신호 → 분리 검토
- 모듈 이름만으로 역할이 예측 가능해야 한다

### 컴포넌트 인터페이스

**이름은 UI 형태를 표현한다**
```
TripListItem, TripForm, TripTable  ✓
TripComponent, TripWidget          ✗
```

**props 이름은 DOM 표준을 따른다**
```tsx
// ✓
<SomethingForm defaultValue={...} onSubmit={...} />

// ✗
<SomethingForm something={...} onNext={...} />
```

**Box 기반 컴포넌트는 `BoxProps`를 확장해 스타일 재정의를 허용한다**
```tsx
interface Props extends BoxProps {
  tripId: string
}
```

**확장을 의도적으로 차단할 수 있다** — 구현이 복잡해지거나 오해 여지가 있을 때.
반쪽짜리 확장(일부만 동작)이라면 차단하는 게 낫다.

### 데이터 의존성

컴포넌트는 데이터 모델 대신 ID를 받아 내부에서 직접 조회하는 것을 원칙으로 한다.
React Query 캐싱으로 중복 요청 없이 동작한다.

```tsx
// ✓ — 컴포넌트가 필요한 것만 의존
<TripMemberChip memberId={id} />

// ✗ — 호출부가 데이터 구조까지 알아야 함
<TripMemberChip member={member} />
```

**예외**: `shared/components` 하위 순수 표현 컴포넌트(도메인 무관)는 데이터를 직접 받아도 된다.
데이터 레이어 의존이 오히려 재사용성을 해치는 경우에 해당한다.

### 코드 작성 원칙

- 요청을 구현하기 전, 설계 원칙·확장성·인터페이스 적절성을 스스로 검토한다
- 더 나은 방안이 있거나 트레이드오프가 있으면 구현 전에 피드백한다
- 불필요한 추상화·미래 대비 코드는 작성하지 않는다

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
