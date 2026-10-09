# 공항 도착 안내 응답 지연 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `airport-arrival-guidance` Edge Function 의 응답 지연을 없앤다 — 실시간 출국장 추천을 별도 요청으로 분리하고, 교통편 목록을 한 번의 요청으로 받으며, 요청 안의 중복 조회를 걷어낸다.

**Architecture:** 안내(권장 도착 시각)와 실시간 출국장 추천은 데이터 출처·갱신 주기·필요 시점이 달라 요청을 나눈다. 추천이 필요한 시점(권장 도착 2시간 이내)은 클라이언트가 판단해 그때만 요청한다. 안내는 교통편 배치 요청 하나로 받고, 서버는 요청 안에서 같은 혼잡도 스냅샷(출처·공항·터미널·예측 날짜)을 한 번만 읽는다. 혼잡도 기준값은 읽을 때 한 번만 적용하고 활성 정책은 요청당 한 번만 읽는다.

**Tech Stack:** Supabase Edge Function(Deno), supabase-js, TanStack Query, React(웹 MUI) / React Native(앱), Vitest, Deno test

**Spec:** 이 대화의 원인 분석 결론(아래 "배경")이 스펙이다.

## 배경

현재 요청 한 번(해외편)은 DB 조회 약 15회를 직렬로 기다리고, 실시간 혼잡도 API(측정 1.4~2.2초)를 거의 매번 호출한다. 실시간 추천은 권장 도착 120분 이내에만 쓰이는데 그 판단 전에 API 를 부른다. 클라이언트는 교통편마다 함수를 따로 호출해 `Promise.all` 로 기다린다.

## Global Constraints

- **배포된 앱 빌드 호환**: 기존 `action: 'get-guidance'`(교통편 하나) 요청·응답은 그대로 동작해야 한다. 응답의 `recommendedDepartureGate` 도 권장 도착 120분 이내면 지금처럼 채운다(단, 창 밖이면 실시간 API 를 호출하지 않는다)
- **예약 푸시 무변경**: `dispatch-notifications/handlers/airportArrivalGuidance.ts` 가 쓰는 `getGuidanceForTransport(supabase, { tripId, transportId, now })` 시그니처와 반환값(`recommendedArrivalAt`, `congestionTier` 등)은 유지한다. 푸시 경로는 실시간 API 를 호출하지 않는다
- 권장 도착 판단 규칙(정책·등급·버퍼 계산)은 바꾸지 않는다. 원본은 `airportArrivalGuidance.utils.ts`, Edge 는 사본(`guidance.ts`)이며 함께 고친다
- 출국장 추천 창: 권장 도착 시각까지 **120분 이하**(지난 경우 포함)이고 안내 `terminal` 이 있을 때(해외 인천편)
- 실시간 스냅샷 캐시 유효 시간(2분)·예측 캐시(24시간)는 바꾸지 않는다
- 코드에 주석을 남기지 않는다. 커밋·푸시·`functions deploy` 는 사용자가 요청할 때까지 하지 않는다
- 브랜치: `main` 에서 `perf/airport-arrival-guidance` 를 만든다
- 이 환경에는 Deno 가 없다. Deno 테스트 파일(`jsr:` import)은 node 로 불러올 수 없으므로 작성만 한다. 같은 케이스를 스크래치패드의 임시 node 스크립트(`node --experimental-strip-types`, 대상 `.ts` 를 절대 경로로 import 하고 기대값을 비교)로 실행해 검증한다. `npx deno check` 가 동작하면 Edge 파일 타입 검사에 쓴다
- 인천 터미널 코드 변환은 `incheonTerminal.ts` 의 `toIncheonTerminalCode`(P01·P02→T1, P03→T2, 모르면 `null`)를 쓴다. `congestion.ts` 의 같은 이름 비공개 함수(문자열에 '2' 포함 여부)와 혼동하지 않는다

### 요청·응답 계약 (Edge ↔ 도메인)

```ts
type AirportArrivalGuidanceFunctionRequest =
  | { action: 'get-guidance'; tripId: string; transportId: string }
  | { action: 'get-guidances'; tripId: string; transportIds: string[] }
  | { action: 'get-departure-gate-recommendation'; terminal: string }

type AirportArrivalGuidanceFunctionResponse =
  | { action: 'get-guidance'; guidance: (AirportArrivalGuidanceResponse & { recommendedDepartureGate?: DepartureGateRecommendation }) | null }
  | { action: 'get-guidances'; guidances: { transportId: string; guidance: AirportArrivalGuidanceResponse }[] }
  | { action: 'get-departure-gate-recommendation'; recommendation: DepartureGateRecommendation | null }

interface DepartureGateRecommendation { gate: string; observedAt: string }
```

- `get-guidances`: 여행 활성 멤버만. 안내가 없는(`null`) 교통편과 그 여행에 속하지 않는 id 는 응답에서 빠진다
- `get-departure-gate-recommendation`: 로그인 사용자면 허용(공항 공개 데이터, 여행과 무관). `terminal` 은 안내 응답의 `terminal`(인천 원본 코드 `P01`·`P02`·`P03`). 모르는 코드면 `recommendation: null`
- `AirportArrivalGuidanceResponse` 에서 `recommendedDepartureGate` 를 뺀다(레거시 응답만 덧붙인다)

## Review Focus

- 교통편이 0개인 목록 → 함수를 호출하지 않고 빈 배열(지금과 같다)
- 같은 공항·터미널 교통편 여러 개 → 한 요청 안에서 스냅샷 조회·외부 API 호출이 키당 1회
- 출국장 추천 요청 실패 → 안내 카드는 깨지지 않고 혼잡도 칩으로 표시
- 업데이트하지 않은 앱의 `get-guidance` → 기존과 같은 응답 모양(창 안이면 출국장 추천 포함)
- 예약 푸시 발송 → 실시간 API 호출 없이 기존과 같은 문구

## File Structure

| 파일 | 책임 | 태스크 |
| --- | --- | --- |
| `supabase/functions/airport-arrival-guidance/congestion.ts` | 스냅샷 조회·저장·기준값 적용 (요청 단위 로더) | 1 |
| `supabase/functions/airport-arrival-guidance/congestion.test.ts` (신규) | 스냅샷 키 | 1 |
| `supabase/functions/airport-arrival-guidance/guidance.ts` (+ `guidance.test.ts`) | 출국장 추천 순수 판단 (사본) | 2 |
| `supabase/functions/airport-arrival-guidance/guidanceForTransport.ts` | 배치 안내, 단건 안내(푸시용), 출국장 추천 | 2 |
| `supabase/functions/airport-arrival-guidance/types.ts`, `index.ts` | 액션 라우팅·권한 | 3 |
| `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.types.ts` | 계약 타입, `DepartureGateRecommendation` | 4 |
| `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.utils.ts` (+ 테스트) | `getIsDepartureGateRecommendable` (원본) | 4 |
| `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.api.ts` | 배치 조회, 출국장 추천 조회 | 4 |
| `packages/domains/src/modules/airport-arrival-guidance/useAirportArrivalGuidance.ts` | 배치 훅, `useDepartureGateRecommendation` | 4 |
| `apps/waylog-web/src/features/trip/trip-transport/AirportArrivalGuidanceSection.tsx` | 추천 행을 새 훅으로 | 5 |
| `apps/waylog-app/src/features/trip/trip-transport/AirportArrivalGuidanceSection.tsx` | 추천 행을 새 훅으로 | 5 |
| `docs/codebase.md` | 공항 도착 안내 항목 갱신 | 6 |

목록 화면(`UpcomingTransportSection`, `TripTransportList`)은 `useAirportArrivalGuidances` 의 입력·반환이 그대로라 수정하지 않는다.

## 의존 그래프와 웨이브

```
Task 1 (Edge 스냅샷) ──> Task 2 (Edge 안내) ──> Task 3 (Edge 라우팅)
Task 4 (도메인) ──> Task 5 (웹·앱 UI)
Task 3, Task 5 ──> Task 6 (문서·검증)
```

- Wave 1: Task 1, Task 4
- Wave 2: Task 2, Task 5
- Wave 3: Task 3
- Wave 4: Task 6

---

## Task 1: Edge — 요청 단위 혼잡도 스냅샷 로더

**Files:**
- Modify: `supabase/functions/airport-arrival-guidance/congestion.ts`
- Create: `supabase/functions/airport-arrival-guidance/congestion.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:

```ts
export interface CongestionSnapshotRequest {
  sourceKind: AirportCongestionSourceKind
  airportCode: string
  terminal: string
  forecastDate?: string
}

export function toCongestionSnapshotKey(request: CongestionSnapshotRequest): string

export function createCongestionSnapshotLoader(
  supabase: SupabaseClient,
  serviceKey: string,
  policyId: string,
): (request: CongestionSnapshotRequest) => Promise<CongestionSnapshotData>
```

- `getFreshCongestionSnapshot`, `getCongestionSnapshotData`, `FreshCongestionSnapshotInput`, `FreshCongestionSnapshotResult` 는 제거한다(소비자는 Task 2 에서 교체되는 `guidanceForTransport.ts` 뿐). Task 1 단독으로 빌드가 깨지지 않도록, 이 태스크에서는 기존 두 함수를 남겨 두고 Task 2 에서 제거한다
- 로더 동작:
  - 같은 키 요청은 같은 Promise 를 돌려준다(요청 안 중복 제거)
  - 캐시 조회는 `source_kind, airport_code, terminal, observed_at, departure_gates` 를 바로 받는다(재조회 없음)
  - 캐시가 없으면 API 를 호출하고, `departure_gates` 에는 **기준값을 적용하지 않은 원본 인원수**를 저장한다. insert 는 같은 컬럼을 `select` 로 돌려받는다
  - 기준값(`airport_congestion_reference_counts`)은 반환 직전 한 번만, 인자로 받은 `policyId` 로 적용한다. 기준값이 없는 출국장은 지금처럼 `passengerCount || 1`
  - 저장된 옛 행에 남아 있는 `referencePassengerCount` 는 읽을 때 다시 계산한 값으로 덮인다

**검증 케이스 (`congestion.test.ts`, Deno):**
- 출처·공항·터미널이 같으면 같은 키다
- 출처가 다르면(같은 ICN/T1 의 예측·실시간) 다른 키다
- 터미널이 다르면 다른 키다
- 예측 스냅샷은 예측 날짜가 다르면 다른 키다
- 실시간·국내 스냅샷은 예측 날짜가 없어도 키를 만든다

- [ ] 검증 케이스를 `Deno.test` 로 작성하고, node 로 `toCongestionSnapshotKey` 를 불러 실패를 확인한다
- [ ] `toCongestionSnapshotKey`, `createCongestionSnapshotLoader` 를 구현한다
- [ ] node 로 키 케이스를 통과시킨다

## Task 2: Edge — 배치 안내와 출국장 추천

**Files:**
- Modify: `supabase/functions/airport-arrival-guidance/guidance.ts`, `guidance.test.ts`
- Modify: `supabase/functions/airport-arrival-guidance/guidanceForTransport.ts`
- Modify: `supabase/functions/airport-arrival-guidance/congestion.ts` (Task 1 에서 남긴 옛 함수 제거)

**Interfaces:**
- Consumes: Task 1 의 `createCongestionSnapshotLoader`, `CongestionSnapshotRequest`
- Produces:

```ts
// guidance.ts (원본: airportArrivalGuidance.utils.ts — Task 4)
export interface DepartureGateRecommendation { gate: string; observedAt: string }

export function getIsDepartureGateRecommendable<TGuidance extends Pick<AirportArrivalGuidance, 'recommendedArrivalAt' | 'terminal'>>(
  guidance: TGuidance,
  now: Date,
): guidance is TGuidance & { terminal: string }

export function getLeastCongestedDepartureGate(
  snapshot: AirportCongestionSnapshot,
): DepartureGateRecommendation | null

// guidanceForTransport.ts
export async function getGuidancesForTransports(
  supabase: SupabaseClient,
  input: { tripId: string; transportIds: readonly string[]; now: Date },
): Promise<{ transportId: string; guidance: AirportArrivalGuidance }[]>

export async function getGuidanceForTransport(
  supabase: SupabaseClient,
  input: { tripId: string; transportId: string; now: Date },
): Promise<AirportArrivalGuidance | null>

export async function getDepartureGateRecommendation(
  supabase: SupabaseClient,
  input: { terminal: string },
): Promise<DepartureGateRecommendation | null>
```

- `AirportArrivalGuidance`(Edge 사본)에서 `recommendedDepartureGate` 를 제거한다. `getRecommendedDepartureGate` 는 위 두 함수로 대체하고 제거한다
- `getIsDepartureGateRecommendable` 는 도메인 원본의 사본(레거시 `get-guidance` 전용)이다. `getLeastCongestedDepartureGate` 는 원본이 없는 Edge 소유 로직이 된다(Task 5 가 도메인 쪽을 지운다). `guidance.ts` 머리말을 "추천 판별은 원본의 사본, 가장 여유로운 출국장 선택은 Edge 소유"로 갱신한다
- `getGuidancesForTransports`:
  - 교통편은 `.in('id', transportIds).eq('trip_id', tripId)` 한 번 읽는다. 출발 공항이 있는 항공편이 하나도 없으면 여기서 `[]` 를 돌려준다(정책을 읽지 않는다 — 지금도 항공편이 아니면 정책 없이 끝난다)
  - 남은 항공편의 운항 상태(`.in('transport_id', …)`), 여행, 활성 정책을 한 `Promise.all` 로 읽는다
  - 활성 정책은 `id` 까지 읽어 로더(`createCongestionSnapshotLoader(…, policy.id)`)를 요청당 하나 만든다
  - 교통편별 계산은 병렬로 하고 실시간 혼잡도는 읽지 않는다
  - `transportIds` 가 비면 조회 없이 `[]`
- `getGuidanceForTransport` 는 `getGuidancesForTransports` 에 `[transportId]` 를 넘긴 결과의 첫 안내 또는 `null`(푸시·레거시 공용, 시그니처 유지)
- `getDepartureGateRecommendation`: `incheonTerminal.ts` 의 `toIncheonTerminalCode(terminal)` 가 `null` 이면 `null`. 아니면 실시간 스냅샷(`sourceKind: 'realtime'`, `airportCode: 'ICN'`, `terminal: T1|T2`)을 로더로 읽어 `getLeastCongestedDepartureGate`. 활성 정책 `id` 는 이 함수 안에서 읽는다

**검증 케이스 (`guidance.test.ts`, Deno — 기존 "권장 도착 시각이 가까워진 해외편에만…" 케이스는 아래로 대체):**
- `getIsDepartureGateRecommendable`: 권장 도착 120분 이내면 참 / 정확히 120분이면 참 / 120분 초과면 거짓 / 권장 도착 시각이 지났으면 참 / 터미널이 없으면(국내) 거짓
- `getLeastCongestedDepartureGate`: 기준값 대비 비율이 가장 낮은 출국장을 고른다 / 출국장이 없으면 `null` / 관측 시각을 함께 돌려준다

- [ ] 검증 케이스를 Deno 테스트로 작성하고 node 로 실패를 확인한다
- [ ] `guidance.ts` 두 함수를 구현하고 node 로 통과시킨다
- [ ] `guidanceForTransport.ts` 를 배치 구조로 바꾸고 `congestion.ts` 의 옛 함수를 제거한다
- [ ] `dispatch-notifications/handlers/airportArrivalGuidance.ts` 가 수정 없이 같은 시그니처를 쓰는지 확인한다(`grep getGuidanceForTransport`)

## Task 3: Edge — 액션 라우팅과 권한

**Files:**
- Modify: `supabase/functions/airport-arrival-guidance/types.ts`
- Modify: `supabase/functions/airport-arrival-guidance/index.ts`

**Interfaces:**
- Consumes: Task 2 의 `getGuidancesForTransports`, `getGuidanceForTransport`, `getDepartureGateRecommendation`, `getIsDepartureGateRecommendable`
- Produces: 위 "요청·응답 계약" 그대로

- 인증(`auth.getUser`)은 모든 액션에 먼저 한다. 실패하면 403
- `get-guidances`, `get-guidance` 는 활성 멤버 확인 후 처리. 멤버 확인은 안내 조회와 병렬로 시작하지 않는다(권한 없는 사용자에게 외부 API 호출을 유발하지 않기 위해 순서 유지)
- `get-guidance`(레거시): `getGuidanceForTransport` 결과가 있고 `getIsDepartureGateRecommendable(guidance, now)`(타입 가드)가 참일 때만 `getDepartureGateRecommendation({ terminal: guidance.terminal })` 를 붙인다. 추천이 `null` 이면 필드를 넣지 않는다. 이 경로는 정책을 두 번 읽는다 — 레거시 전용이라 받아들인다
- `get-departure-gate-recommendation`: 인증만 확인
- 모르는 `action` 은 400

**검증:** 순수 로직이 없어 테스트를 추가하지 않는다. `deno check` 대신 Task 6 의 수동 호출로 확인한다.

- [ ] `types.ts` 에 계약 타입을 정의한다
- [ ] `index.ts` 를 액션별로 분기한다

## Task 4: 도메인 — 계약 타입, 판단, 배치 조회, 추천 훅

**Files:**
- Modify: `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.types.ts`
- Modify: `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.utils.ts`
- Modify: `packages/domains/src/modules/airport-arrival-guidance/__tests__/airportArrivalGuidance.utils.test.ts`
- Modify: `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.api.ts`
- Modify: `packages/domains/src/modules/airport-arrival-guidance/useAirportArrivalGuidance.ts`

**Interfaces:**
- Consumes: "요청·응답 계약"
- Produces:

```ts
// types
export interface DepartureGateRecommendation { gate: string; observedAt: string }

// utils (원본)
export function getIsDepartureGateRecommendable<TGuidance extends Pick<AirportArrivalGuidance, 'recommendedArrivalAt' | 'terminal'>>(
  guidance: TGuidance,
  now: Date,
): guidance is TGuidance & { terminal: string }

// api
export async function getAirportArrivalGuidances(
  input: AirportArrivalGuidancesQuery,
): Promise<AirportArrivalGuidanceItem[]>
export async function getDepartureGateRecommendation(
  terminal: string,
): Promise<DepartureGateRecommendation | null>

// hooks
export function useAirportArrivalGuidance(input: AirportArrivalGuidanceQuery): AirportArrivalGuidance | null   // 시그니처 유지
export function useAirportArrivalGuidances(input: AirportArrivalGuidancesQuery): readonly AirportArrivalGuidanceItem[]  // 시그니처 유지
export function useDepartureGateRecommendation(
  guidance: Pick<AirportArrivalGuidance, 'recommendedArrivalAt' | 'terminal'>,
): DepartureGateRecommendation | null
```

- 이 태스크에서는 `AirportArrivalGuidance.recommendedDepartureGate` 와 `getRecommendedDepartureGate`·`RecommendedDepartureGateInput` 을 **남겨 둔다**(UI 가 아직 쓴다). Task 5 에서 제거한다
- `getAirportArrivalGuidances`: `transportIds` 가 비면 호출 없이 `[]`. 아니면 `get-guidances` 한 번
- `getAirportArrivalGuidanceForTransport`(단건)는 `getAirportArrivalGuidances({ tripId, transportIds: [transportId] })` 의 첫 항목 안내 또는 `null` 로 바꾼다 — 웹·새 앱은 레거시 액션을 쓰지 않는다
- `useAirportArrivalGuidances`: `Promise.all` 대신 `getAirportArrivalGuidances` 한 번. 쿼리 키·`refetchInterval` 유지
- `useDepartureGateRecommendation`: `useQuery`(Suspense 아님), 키 `['departure-gate-recommendation', guidance.terminal, guidance.recommendedArrivalAt]`, `enabled: guidance.terminal != null`, `refetchInterval` 2분. 창 판단은 **`queryFn` 안에서** 매 실행 시각으로 한다 — 창 밖이면 네트워크 없이 `null`, 창 안이면 `getDepartureGateRecommendation(guidance.terminal)`. `enabled` 에 시각 판단을 넣으면 화면을 띄워 둔 채 120분 경계를 넘을 때 다시 계산되지 않는다(안내 데이터가 같으면 재렌더가 없다). 로딩·에러면 `null`

**검증 케이스 (`airportArrivalGuidance.utils.test.ts` — 기존 `getRecommendedDepartureGate` 세 케이스는 Task 5 에서 제거):**
- `getIsDepartureGateRecommendable`: 권장 도착 120분 이내면 참 / 정확히 120분이면 참 / 120분 초과면 거짓 / 권장 도착 시각이 지났으면 참 / 터미널이 없으면(국내) 거짓

- [ ] `it.todo` 로 케이스를 적고 인터페이스를 확정한다
- [ ] 케이스를 채워 실패를 확인하고 `getIsDepartureGateRecommendable` 를 구현한다
- [ ] api·훅을 구현하고 `pnpm --filter @waylog/domains exec tsc --noEmit -p .` 로 타입을 확인한다

## Task 5: 웹·앱 — 출국장 추천 행을 별도 요청으로

**Files:**
- Modify: `apps/waylog-web/src/features/trip/trip-transport/AirportArrivalGuidanceSection.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-transport/AirportArrivalGuidanceSection.tsx`
- Modify: `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.types.ts`, `airportArrivalGuidance.utils.ts`, `__tests__/airportArrivalGuidance.utils.test.ts` (옛 필드·함수 제거)

**Interfaces:**
- Consumes: Task 4 의 `useDepartureGateRecommendation`, `DepartureGateRecommendation`

- `Resolved` 에서 `const recommendation = useDepartureGateRecommendation(guidance)` 를 쓰고 `isRealtime = recommendation != null` 로 바꾼다. 행의 출국장·관측 시각은 `recommendation` 에서 읽는다. 표시·스타일은 그대로
- 추천을 불러오는 동안에는 혼잡도 칩이 보이다가 추천 행으로 바뀐다(받아들인다)
- 훅은 `guidance == null` 조기 반환보다 앞에서 부를 수 없으므로(guidance 가 필요) 추천 행을 별도 컴포넌트(`DepartureGateRecommendationRow`)로 분리해 그 안에서 훅을 부른다. 추천이 없으면 혼잡도 칩을 그린다
- 도메인에서 `AirportArrivalGuidance.recommendedDepartureGate`, `getRecommendedDepartureGate`, `RecommendedDepartureGateInput`, 비공개 `getLeastCongestedGate` 와 그 테스트 세 개를 제거한다

**검증:** UI 컴포넌트는 테스트 인프라가 없다. 웹 `tsc`·앱 `tsc` 와 실제 화면으로 확인한다.

- [ ] 웹·앱 섹션을 수정한다
- [ ] 도메인의 옛 필드·함수·테스트를 제거한다
- [ ] 도메인 vitest, 웹·앱 `tsc --noEmit` 을 통과시킨다

## Task 6: 문서와 통합 검증

**Files:**
- Modify: `docs/codebase.md` (공항 도착 안내 항목)

- [ ] `docs/codebase.md` 에 요청 계약(배치·출국장 추천·레거시), 출국장 추천 창을 클라이언트가 판단한다는 것, 스냅샷 로더(요청 단위 중복 제거, 기준값은 읽을 때 한 번)를 적는다
- [ ] 배포 순서를 적는다: Edge 배포(`airport-arrival-guidance` **와 `dispatch-notifications`** — 후자는 `guidanceForTransport.ts` 를 자기 번들에 포함하므로 재배포해야 예약 푸시에 반영된다) → 웹 배포 → 앱 릴리스. Edge 가 세 액션을 모두 받으므로 옛 앱은 계속 동작한다. 레거시 `get-guidance` 는 최소 앱 버전을 올린 뒤 별도로 제거하고, 그때 Edge 의 `getIsDepartureGateRecommendable` 사본도 함께 지운다
- [ ] 사용자에게 수동 검증 절차를 안내한다(실행하지 않는다):
  - `get-guidances` 로 같은 터미널 교통편 2개 → `airport_congestion_snapshots` 새 행이 키당 1개
  - `get-guidance` 응답 모양이 이전과 같음
  - 예약 푸시 핸들러 수동 호출 시 실시간 스냅샷 행이 생기지 않음
