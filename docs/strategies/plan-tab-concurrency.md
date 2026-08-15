# 계획 탭 동시 편집 전략

계획 탭에서 여러 명이 동시에 수정할 때 데이터가 유실되는 문제의 단계별 대응 전략.

**이 문서는 실행이 끝나도 유효하다.** 각 단계에 이행 신호가 명시되어 있으며, 해당 증상이 관찰되면 그 단계를 이행한다.

| 단계 | 상태 | 이행 신호 |
| --- | --- | --- |
| 1. 갱신 주기 단축 | **적용됨** (2026-08-15) | — |
| 2. RPC 전환 | 대기 | 갱신을 줄여도 데이터가 사라짐 |
| 3. `route_places` 분해 | 대기 | 순서가 뒤엉킴 |
| 4. 메모 항목 분해 | 대기 | 메모 항목이 밀리거나 사라짐 |
| 5. Realtime 구독 | 대기 | 폴링 반응이 느리다는 요구 |

각 단계는 앞 단계를 되돌리지 않고 얹을 수 있다.

관련 설계 문서: `docs/superpowers/specs/2026-08-15-plan-tab-concurrent-editing-design.md` (1단계 실행 설계)

---

## 문제의 구조

경로 상태가 `routes` 한 행의 blob 컬럼에 뭉쳐 있다.

```
routes
  place_ids     uuid[]   경로 구성 + 순서 (한 컬럼에 두 의미)
  place_memos   jsonb    { placeId: string[] }
  hidden_places uuid[]
```

모든 쓰기가 `updateRoute`(`src/features/route/route.api.ts:115`) 하나로 가며, 전달받은 배열/객체를 통째로 덮어쓴다. 그 배열은 클라이언트가 자기 React Query 캐시를 읽어 만든 것이다.

| 동작 | 위치 |
| --- | --- |
| 순서 변경 | `TripRoutesContent.mobile.tsx:263` |
| 장소 추가/제거 | `TripRoutesContent.mobile.tsx:354` |
| 메모 수정 | `useDayTripRoutes.ts:48` |
| 숨김 토글 | `useTripRoutes.ts:51` |

read-modify-write 사이클 전체가 클라이언트에 있고, 버전 컬럼도 낙관적 락도 없다.

원인이 두 층이다.

**층 1 — 화면이 낡는다.** 갱신이 없으면 A는 오래된 스냅샷 위에서 편집하고, 저장 시 그 사이의 변경을 덮어쓴다. 편집 간격이 몇 분이어도 충돌한다.

**층 2 — 한 컬럼에 전부 들어 있다.** 부분 수정이 불가능해, 장소 하나를 추가해도 컬럼 전체를 새로 써야 한다.

1단계는 층 1을, 2단계는 층 2를 다룬다.

---

## 1단계 — 갱신 주기 단축 (적용됨)

`src/app/query-client.ts` 가 갱신을 전부 꺼두고 있었다.

```ts
refetchInterval: false,
refetchIntervalInBackground: false,
refetchOnWindowFocus: false,   // → true 로 변경
```

계획 탭 쿼리(`useTripRoutes`, `useTripPlaces`)에 주기 갱신을 부여하고, 창 포커스 복귀 시 갱신을 전역으로 켰다.

정책은 `src/features/trip/trip-route/tripPlanRefetch.ts` 의 `TRIP_PLAN_REFETCH` 상수로 공유한다. 값이 흩어지면 한쪽만 바뀌는 사고가 생긴다.

`refetchIntervalInBackground: false` 를 유지해 백그라운드 탭은 폴링하지 않는다.

**해결:** 시간차 편집의 대부분
**미해결:** "읽고 → 조작하고 → 저장" 구간이 실제로 겹치는 경우

---

## 2단계 — RPC 전환

**이행 신호:** 갱신 주기를 줄였는데도 데이터가 사라진다. 특히 두 사람이 같은 시간대에 편집할 때.

클라이언트가 최종 배열을 만들어 보내는 대신 의도만 전달하고, DB 함수가 행을 잠그고 부분 수정한다. **스키마 변경이 없다.**

```sql
add_route_place(route_id, place_id)
remove_route_place(route_id, place_id)
toggle_route_place_hidden(route_id, place_id)
set_place_memo(route_id, place_id, memos)   -- jsonb_set, 해당 키만
```

호출부는 `useTripRoutes` / `useDayTripRoutes` 의 mutation 내부만 바뀐다. 컴포넌트는 `update({ routeId, placeIds })` 대신 `addPlace({ routeId, placeId })` 를 부른다.

**해결:** 장소 추가/제거, 서로 다른 장소의 메모 수정, 숨김 토글의 동시 충돌
**미해결:** 순서 재배치, 메모 항목 밀림

---

## 3단계 — route_places 테이블 분해

**이행 신호:** 순서가 뒤엉키거나, 재배치 중 남이 추가한 장소가 사라진다.

### 왜 RPC로 안 되는가

순서 재배치는 드래그 결과가 필연적으로 목록 전체다.

```
서버가 아는 현재 목록:  [경복궁, 인사동, 북촌, 남산]
B가 보낸 목록:          [북촌, 경복궁, 인사동]
```

남산이 없다. 서버는 이것이 "B가 남산을 제거했다"인지 "B는 남산을 몰랐다"인지 **입력만으로 판별할 수 없다.** 행 잠금으로도 해결되지 않는다 — 락의 한계가 아니라 표현의 한계다.

### 설계

```sql
CREATE TABLE route_places (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id   uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  place_id   uuid NOT NULL REFERENCES trip_places(id) ON DELETE CASCADE,
  order_key  double precision NOT NULL,
  is_hidden  boolean NOT NULL DEFAULT false,
  UNIQUE (route_id, place_id)
);
```

`hidden_places` 는 별도 테이블이 아니라 컬럼이다. 숨김은 경로-장소 관계의 속성이지 독립 개념이 아니다.

### 정렬키는 소수여야 한다

정수는 삽입 시 뒤 행들을 다시 매기게 되어 "여러 행을 한꺼번에 선언"하는 형태가 되고, 그 순간 같은 문제가 되살아난다.

```
정수 — 북촌을 맨 앞으로: 북촌 1, 경복궁 2, 인사동 3   (3행 UPDATE)
소수 — 북촌을 맨 앞으로: 북촌 0.5                      (1행 UPDATE)
```

행 개수가 아니라 **한 번에 몇 행을 선언하는가**가 문제다.

```
맨 앞 삽입:   min(order_key) - 1
맨 뒤 삽입:   max(order_key) + 1
a와 b 사이:   (a.order_key + b.order_key) / 2
빈 경로:      0
```

간격이 임계치(`1e-9`) 미만이면 해당 경로를 `0, 1, 2, ...` 로 재정규화한 뒤 다시 계산한다.

### 이동은 이웃 id로 지시한다

```sql
move_route_place(route_place_id, before_id, after_id)
```

"3번째로"는 그 사이 3번째가 달라질 수 있지만, "이 행과 저 행 사이로"는 두 행이 존재하는 한 의미가 보존된다. 이웃이 삭제되었으면 남은 이웃 기준으로 계산하고, 둘 다 없으면 말미에 둔다.

### 계획 탭 밖 영향

통계·탐색·지출이 `routes.place_ids` 를 읽는다.

- `useStatisticsSummary.ts:144`, `useVisitedPlaces.ts:20` — `routes.flatMap(r => r.placeIds)`
- `useExpensesByPlace.ts:46`, `RouteExpenseView.*.tsx` — 순서까지 사용

구 컬럼과 동일한 모양을 신규 테이블에서 조립하는 **읽기 전용 뷰**로 흡수하면 호출부를 바꾸지 않아도 된다.

```sql
CREATE VIEW routes_compat AS
SELECT r.*,  -- place_ids를 order_key 순으로 재조립
  (SELECT array_agg(rp.place_id ORDER BY rp.order_key)
   FROM route_places rp WHERE rp.route_id = r.id) AS place_ids
FROM routes r;
```

`route.api.ts` 의 조회를 `from('routes')` → `from('routes_compat')` 로 바꾸면 `toRoute` 변환과 `Route` 타입이 그대로 유지된다.

**단, DB 함수 두 개는 배열 전용 문법을 써서 뷰로 대체되지 않는다.**

- `get_routes_with_places_by_trip_id`(`supabase/schema.sql:307`) — `r.place_ids @> ARRAY[tp.id]`, `array_position(...)`
- `get_trip_by_share_link` 계열의 `preview_coordinates`(`supabase/schema.sql:355` 부근) — `unnest(r.place_ids)`

### 마이그레이션

구 컬럼(`place_ids` / `place_memos` / `hidden_places`)은 즉시 삭제하지 않는다. 문제 발생 시 뷰를 구 컬럼 기반으로 되돌리면 앱 코드 변경 없이 롤백된다.

**단, 이행 이후 구 컬럼은 갱신되지 않는다.** 롤백 시 이행 이후의 변경은 소실된다. 배포 직후 짧은 기간 안에 검증을 끝내야 한다.

---

## 4단계 — 메모 항목 분해

**이행 신호:** 같은 장소의 메모 목록에서 항목이 밀리거나 사라진다.

메모가 `string[]` 이라 항목에 정체성이 없다. "몇 번째"로만 가리킬 수 있는데 그 사이 몇 번째가 다른 것이 되어 있다. A가 0번을 수정하고 B가 앞에 하나 추가하면 인덱스가 밀린다. 어느 순서로 들어와도 잘못될 수 있으며, 잠금으로 해결되지 않는다.

```sql
CREATE TABLE route_place_memos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_place_id uuid NOT NULL REFERENCES route_places(id) ON DELETE CASCADE,
  content        text NOT NULL,
  order_index    integer NOT NULL
);
```

메모는 항상 말미에 추가되고 재배치가 없으므로 **정렬키는 정수로 충분하다.** 기존 행의 키를 건드릴 일이 없다. 동시 추가 시 RPC가 현재 최대값을 읽어 다음 값을 부여하면 양쪽 모두 살아남고 순서만 도착 순으로 정해진다.

3단계에 의존한다 — `route_places` 가 있어야 "이 경로에서 이 장소에 대한" 메모를 표현할 수 있다.

**우선순위가 가장 낮다.** 프로덕션 메모 항목이 총 53개(경로 110개 기준 경로당 0.5개)로, 같은 장소의 메모 목록을 두 사람이 동시에 편집할 확률이 낮다.

---

## 5단계 — Realtime 구독

**이행 신호:** 폴링 주기로는 반응이 느리다는 요구가 실제로 나온다.

`routes` / `trip_places` 의 변경을 구독해 즉시 무효화한다. 채팅에 이미 같은 패턴이 있다(`src/features/trip/trip-chat/tripChat.api.ts:37`).

**페이로드를 캐시에 직접 병합하지 않는다.** 병합 로직을 클라이언트에 다시 만드는 셈이라 이 전략이 없애려는 문제를 되살린다. 무효화만 트리거한다.

`route_places` / `route_place_memos` 행에는 `trip_id` 가 없다. postgres_changes 필터는 단일 테이블 컬럼만 지원하므로, 구독 후 클라이언트에서 해당 여행에 속한 변경인지 판별해야 한다.

편집 중 갱신이 입력을 끊지 않도록 포커스 이탈까지 보류하는 처리가 함께 필요하다.

**주의:** 실시간을 켜면 사용이 활발해지는 만큼 동시 편집도 늘어난다. 2~4단계 없이 5단계만 적용하면 충돌 빈도가 오히려 올라갈 수 있다.

---

## 충돌 상황별 해결 단계

| 상황 | 해결 단계 |
| --- | --- |
| 시간차를 두고 서로 다른 곳을 편집 | 1 |
| 동시에 서로 다른 장소 추가 | 2 |
| 동시에 서로 다른 장소의 메모 수정 | 2 |
| 동시에 숨김 토글 | 2 |
| 한 명은 추가, 한 명은 순서 변경 | 3 |
| 서로 다른 위치로 동시 재배치 | 3 |
| 같은 장소의 서로 다른 메모 항목 수정 | 4 |
| 같은 메모 항목을 동시 수정 | — 나중 저장이 이김 |
| 같은 장소의 category를 동시 변경 | — 나중 저장이 이김 |
| `trip_places.memo` 동시 수정 | — 나중 저장이 이김 |

마지막 세 줄은 **의도된 동작이다.** 두 사람이 같은 값에 다른 의도를 가진 경우이며, 어느 쪽이든 하나는 져야 한다. 진 쪽에 알림은 띄우지 않는다 — 갱신이 결과를 보여준다.

### 범위 밖

- 텍스트 문자 단위 병합(CRDT). 같은 필드 동시 타이핑은 나중 저장이 이긴다.
- 편집자 표시(presence), 커서 공유.

---

## 프로덕션 데이터 실측

3단계 이행 시 필요한 정보다. 2026-08-15 기준.

### 규모

| 테이블 | 행 수 |
| --- | --- |
| trips | 25 |
| routes | 110 |
| trip_places | 409 |
| places | 392 |

경로당 장소 수는 평균 3.47개, 최대 12개. **뷰 성능은 문제되지 않는다.**

### 데이터 특이점

| 항목 | 결과 | 대응 |
| --- | --- | --- |
| `place_memos` 구 형식(문자열) | **0건** | 선행 정규화 불필요 |
| `place_ids` 내 중복 | 0건 | — |
| 유령 `hidden_places` | 0건 | — |
| **유령 `place_ids`** (삭제된 trip_place 참조) | **13건** | 이행 시 `EXISTS` 로 제외 |
| **고아 `place_memos`** (경로에 없는 장소의 메모) | **11건** | 버린다 |
| 메모 항목 총계 | 53건 | 4단계 우선순위 근거 |

`normalizePlaceMemos`(`route.api.ts:10`)가 방어하는 구 형식 문자열은 실데이터에 하나도 없다. 과거 잔재를 방어할 뿐이다.

유령 참조가 존재하는 이유는 현재 `place_ids` 에 FK가 없기 때문이다. 신규 테이블은 FK로 방지한다.

고아 메모는 현재 UI에서 보이지 않는 데이터다(`place_ids` 기준으로 렌더링). `route_places` 행이 없으면 참조할 곳도 없다.

### 제약

`trip_members` 에 `UNIQUE(trip_id, user_id)` 가 있다. 사용자 매핑 시 1:1이 아니면 충돌한다.

---

## 개발 환경

프로덕션과 동일한 구조·데이터를 가진 dev DB를 구성했다.

| 프로젝트 | ref |
| --- | --- |
| travel (프로덕션) | `feubgswdgmxrbpbfbqje` |
| travel-dev | `uvxpmwxjkjffptsxbqms` |

### 검증된 일치 항목 (2026-08-15)

| 항목 | 결과 |
| --- | --- |
| 컬럼 | 117개 일치 |
| 함수·정책·인덱스 | 96개 일치 |
| 테이블별 행 수 | 17개 테이블 전부 일치 |
| 데이터 특이점 | 전부 재현 |

`supabase/schema.sql` 을 dev에 적용한 결과가 프로덕션과 완전히 일치했다. **이 파일은 프로덕션 스키마의 신뢰할 수 있는 기준이다.**

### 사용자 매핑

프로덕션 사용자 4명을 dev 계정 4개에 1:1 매핑했다.

| 프로덕션 | dev |
| --- | --- |
| 도현 `baf999d2…` | `7551bd7e…` |
| 다혜 `986dd872…` | `d26ce873…` |
| 영민 `ae58143c…` | `727963d4…` |
| 테스트봇 `968a41e5…` | `5b39a6fb…` |

동시 편집 검증은 앞의 두 계정으로 한다.

### 접속 전환

`src/api/client.ts` 는 `VITE_SUPABASE_URL` 만 읽는다. `.env` 에 `VITE_SUPABASE_DEV_URL` / `VITE_SUPABASE_DEV_ANON_KEY` 가 있지만 **소비하는 코드가 없어 현재는 항상 프로덕션에 접속한다.**

dev DB로 검증하려면 전환 수단이 필요하다.

### 도구

로컬에 Docker가 없어 `supabase db dump` / `db push` 를 사용할 수 없다.

`supabase db query --file <path> --linked` 는 Management API로 동작하며 **DDL 실행까지 가능하다.** 프로젝트 전환은 `supabase link --project-ref <ref>`.
