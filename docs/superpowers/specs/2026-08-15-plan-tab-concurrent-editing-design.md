# 계획 탭 동시 편집 설계

여러 명이 동시에 계획 탭을 수정할 때 서로의 변경이 유실되는 문제를 다룬다.

이번 범위는 **1단계(갱신 주기 단축)와 category 버그 수정**이다. 2~4단계는 실제 문제가 관찰될 때 이행할 전략으로 남긴다.

---

## 1. 문제

### 1.1 증상

여러 명이 동시에 계획 탭을 수정하면 한쪽 변경이 사라진다.

### 1.2 관찰된 직접 원인 — 화면이 갱신되지 않는다

`src/app/query-client.ts` 가 갱신을 전부 꺼두고 있다.

```ts
refetchInterval: false,
refetchIntervalInBackground: false,
refetchOnWindowFocus: false,
```

주기 갱신도, 창 포커스 복귀 시 갱신도 없다. 계획 탭에 Realtime 구독도 없다(구독은 채팅에만 있다 — `tripChat.api.ts:42`).

A가 화면을 연 뒤 B가 저장해도 **A 화면은 영원히 낡은 상태로 남는다.** A는 그 위에서 편집하고 저장하며, 그 순간 B의 작업을 덮어쓴다.

편집 간격이 몇 분이어도 충돌한다. 시간차가 있다고 안전한 것이 아니라, 갱신 자체가 일어나지 않기 때문이다.

### 1.3 구조적 원인 — 클라이언트가 최종 상태를 만든다

경로 상태가 `routes` 한 행의 blob 컬럼에 뭉쳐 있다.

```
routes
  place_ids     uuid[]   경로 구성 + 순서
  place_memos   jsonb    { placeId: string[] }
  hidden_places uuid[]
```

모든 쓰기가 `updateRoute`(`route.api.ts:115`) 하나로 가며, 전달받은 배열/객체를 통째로 덮어쓴다. 그 배열은 클라이언트가 자기 React Query 캐시를 읽어 만든 것이다.

| 동작 | 위치 |
| --- | --- |
| 순서 변경 | `TripRoutesContent.mobile.tsx:263` |
| 장소 추가/제거 | `TripRoutesContent.mobile.tsx:354` |
| 메모 수정 | `useDayTripRoutes.ts:48` |
| 숨김 토글 | `useTripRoutes.ts:51` |

read-modify-write 사이클 전체가 클라이언트에 있고, 버전 컬럼도 낙관적 락도 없다.

**1.2를 고치면 이 구조에서도 충돌 창이 크게 줄어든다.** 화면이 최신이면 대부분의 편집은 겹치지 않는다. 남는 것은 "읽고 → 조작하고 → 저장" 구간이 실제로 겹치는 경우뿐이며, 그 빈도는 아직 관측되지 않았다.

### 1.4 category 유실 버그 (동시 편집과 무관)

`place.api.ts:223` 에서 `patch.category` 대입이 `if` 블록 밖에 있다.

```ts
if (data.tags !== undefined) patch.tags = data.tags;
patch.category = data.category || null;   // ← 항상 실행
```

`updateTripPlace` 를 호출할 때 category를 전달하지 않으면 무조건 null로 덮인다. 메모만 수정해도 카테고리가 지워진다.

**단순히 `if` 가드를 추가하면 미설정 기능이 죽는다.** 호출부가 미설정을 `undefined` 로 표현하고 있기 때문이다.

| 위치 | 코드 |
| --- | --- |
| `PlaceForm.tsx:73` | `data.category === 'none' ? undefined : data.category` |
| `useTripPlaceFormOverlay.tsx:111` | `data.category \|\| undefined` |
| `useTripPlaceFormOverlay.tsx:178` | `data.category \|\| undefined` |

타입도 같은 전제를 갖는다.

```ts
// PlaceForm.tsx:22
export interface PlaceFormValues {
  category?: PlaceCategoryType   // 미설정 = undefined
}
```

"값을 보내지 않음"과 "미설정으로 지정함"이 같은 값으로 표현되어 구분이 불가능하다. 두 의도를 분리해야 가드가 성립한다.

### 1.5 부수 결함

`route.api.ts:134` — `if (data.hiddenPlaces !== null)` 은 `!== undefined` 여야 한다. 항상 참이라 매 update마다 `hidden_places` 를 건드린다.

---

## 2. 이번 범위

| | 내용 |
| --- | --- |
| 목표 | 화면이 최신 상태를 유지해 낡은 스냅샷 덮어쓰기를 줄인다 |
| 수단 | React Query 갱신 옵션 조정 |
| 함께 수정 | category 유실 버그 + 미설정 표현 분리 |
| 제외 | RPC 전환, 테이블 분해, 경로 메모 동시성, Realtime 구독 |

### 2.1 왜 갱신부터인가

관찰된 증상(1.2)에 직접 대응한다. RPC와 테이블 분해는 "저장하는 순간"을 고치지, 낡은 화면을 고치지 않는다. 화면이 낡은 채로 남으면 두 가지를 다 해도 증상이 남는다.

반대로 갱신을 먼저 하면 대부분의 충돌이 사라지고, **RPC가 실제로 필요한지 판단할 근거가 생긴다.** 현재 순서 재배치·메모 동시 편집의 빈도는 추측일 뿐 데이터가 없다.

두 작업은 건드리는 파일이 거의 겹치지 않아, 나중에 RPC를 얹어도 이번 작업을 되돌릴 필요가 없다.

### 2.2 트레이드오프

갱신이 잦아지면 편집 중 화면이 바뀔 수 있다. 이를 피하려고 갱신을 끄면 원래 문제로 돌아가므로, 주기를 보수적으로 잡고 실제 사용에서 조정한다.

Realtime 구독은 이번 범위에서 제외한다. 갱신 주기 단축으로 충분한지 먼저 확인한다.

---

## 3. 설계 — 갱신 주기

### 3.1 전역 기본값은 건드리지 않는다

`query-client.ts` 의 기본값은 앱 전체(피드·통계·탐색·프로필)에 영향을 준다. 계획 탭의 요구를 전역에 적용하면 목적과 무관한 화면까지 폴링하게 된다.

**계획 탭이 소비하는 쿼리에만 갱신 옵션을 부여한다.**

예외로 `refetchOnWindowFocus` 는 전역에서 켠다. 다른 탭을 보다 돌아왔을 때 최신 데이터를 보는 것은 앱 전체에 타당한 동작이고, 폴링과 달리 사용자 행동에만 반응하므로 비용이 낮다.

```ts
// src/app/query-client.ts
queries: {
  refetchInterval: false,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,   // false → true
  throwOnError: true,
}
```

### 3.2 계획 탭 쿼리에 주기 갱신을 부여한다

대상은 계획 탭이 읽는 두 쿼리다.

| 훅 | 쿼리 키 |
| --- | --- |
| `useTripRoutes` | `[routeKey, tripId]` |
| `useTripPlaces` | `[tripKey, placeKey, tripId]` |

두 훅에 동일한 갱신 정책을 적용한다. 정책 값이 두 곳에 흩어지면 한쪽만 바뀌는 사고가 생기므로 상수로 공유한다.

```ts
// src/features/trip/trip-route/tripPlanRefetch.ts
/** 계획 탭 공동 편집용 갱신 정책 */
export const TRIP_PLAN_REFETCH = {
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
} as const
```

`refetchIntervalInBackground: false` 를 유지해 백그라운드 탭에서는 폴링하지 않는다. 보이지 않는 화면을 갱신할 이유가 없고, 여러 탭을 열어둔 사용자의 요청량이 배로 늘어난다.

30초는 시작값이다. 실사용에서 조정한다.

### 3.3 파일 위치

`tripPlanRefetch.ts` 는 계획 탭 두 훅이 공유하는 정책이다. `useTripRoutes` 와 `useTripPlaces` 는 서로 다른 디렉토리(`trip-route/`, `trip-place/`)에 있지만, 이 상수는 **계획 탭이라는 소비 맥락에서만 의미를 갖는다.**

`trip-route/` 에 두고 `trip-place/` 에서 import 한다. `shared/` 로 올리면 도메인 무관 유틸처럼 보이지만 실제로는 계획 탭 전용이다.

### 3.4 뮤테이션 후 갱신

현재 `useTripPlaces` 는 `refetch()`, `useTripRoutes` 는 `invalidateQueries()` 를 섞어 쓴다. 이번 범위에서 통일하지 않는다 — 동작에 문제가 없고, 범위를 넓히면 검증 대상이 늘어난다.

---

## 4. 설계 — category

### 4.1 미설정을 null로 표현한다

"보내지 않음"과 "미설정으로 지정함"을 다른 값으로 나눈다.

```ts
undefined  →  이 필드를 수정하지 않음
null       →  미설정으로 지정함
```

이 구분이 성립해야 API의 `if` 가드가 의미를 갖는다.

### 4.2 API

```ts
// place.api.ts:215
export async function updateTripPlace(
  id: string,
  data: Partial<Pick<TripPlace, "status" | "memo" | "tags">> & {
    category?: PlaceCategoryType | null
  },
): Promise<TripPlace | undefined> {
  const patch: Record<string, unknown> = {};
  if (data.status !== undefined) patch.status = data.status;
  if (data.memo !== undefined) patch.memo = data.memo || null;
  if (data.tags !== undefined) patch.tags = data.tags;
  if (data.category !== undefined) patch.category = data.category;   // ← 가드 추가
  ...
}
```

`patch.category = data.category` 로 충분하다. `|| null` 이 있으면 빈 문자열 등을 흡수해 의도가 흐려지고, 미설정은 이미 `null` 로 도착한다.

### 4.3 폼

```ts
// PlaceForm.tsx:22
export interface PlaceFormValues {
  name: string;
  address: string;
  category: PlaceCategoryType | null;   // ?: → null 허용 필수 필드
  memo: string;
  tags: string[];
}
```

옵셔널을 없앤다. 폼은 항상 category 상태를 갖고 있으므로 "없음"이 아니라 "미설정(null)"이다.

```ts
// PlaceForm.tsx:73
category: data.category === 'none' ? null : data.category
```

```ts
// useTripPlaceFormOverlay.tsx:111, 178
category: data.category ?? null
```

`|| undefined` 를 `?? null` 로 바꾼다. `||` 는 빈 문자열도 삼키지만 `??` 는 null/undefined만 다룬다.

### 4.4 훅

```ts
// useTripPlaces.ts:36
category?: PlaceCategoryType | null
```

### 4.5 함께 수정

```ts
// route.api.ts:134
if (data.hiddenPlaces !== undefined) updateData.hidden_places = data.hiddenPlaces
```

---

## 5. 검증

### 5.1 단위 — category patch

`src/features/place/__tests__/updateTripPlace.utils.test.ts`

patch 생성 로직을 순수 함수 `toTripPlacePatch` 로 분리해 검증한다. Supabase 호출과 분리해야 테스트가 가능하다.

- category를 전달하지 않으면 patch에 category 키가 없다
- category에 null을 전달하면 patch.category가 null이다
- category에 값을 전달하면 patch.category가 그 값이다
- memo만 전달하면 patch에 category 키가 없다
- 빈 문자열 memo는 null로 변환된다
- status를 전달하지 않으면 patch에 status 키가 없다

### 5.2 UI

컴포넌트 테스트 인프라가 없으므로 빌드와 실제 앱으로 확인한다. dev DB(`uvxpmwxjkjffptsxbqms`)가 프로덕션과 동일한 구조·데이터로 준비되어 있다.

- 카테고리를 지정한 장소의 메모만 수정 → 카테고리가 유지된다
- 카테고리를 미설정으로 변경 → null로 저장되고 화면에 반영된다
- 두 브라우저에서 서로 다른 장소를 편집 → 30초 내 양쪽 화면에 반영된다
- 다른 탭을 보다 돌아옴 → 즉시 최신 데이터가 반영된다
- 편집 중 갱신이 발생해도 입력이 끊기지 않는다

---

## 6. 이후 단계

이번 범위로 해결되지 않는 상황과, 관찰되면 이행할 전략은 별도 문서로 관리한다.

**→ `docs/strategies/plan-tab-concurrency.md`**

| 단계 | 이행 신호 |
| --- | --- |
| 2. RPC 전환 | 갱신을 줄여도 데이터가 사라짐 |
| 3. `route_places` 분해 | 순서가 뒤엉킴 |
| 4. 메모 항목 분해 | 메모 항목이 밀리거나 사라짐 |
| 5. Realtime 구독 | 폴링 반응이 느리다는 요구 |

각 단계는 앞 단계를 되돌리지 않고 얹을 수 있다.

해당 문서에는 프로덕션 데이터 실측값(유령 참조 13건, 고아 메모 11건 등)과 dev DB 구성 정보도 함께 담겨 있다. 계획 탭 쓰기 경로를 수정하기 전에 읽는다.
