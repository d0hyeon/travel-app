# 출국장 추천 푸시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 해외 인천 출발편에 권장 도착 30분 전 "지금 가장 여유로운 출국장" 푸시를 보낸다.

**Architecture:** 발송 시각(권장 도착 − 30분)은 예측 혼잡도 보정이 있어야 정해지는데 보정은 Edge 만 계산할 수 있다. 그래서 SQL 트리거는 가장 이를 수 있는 시각(출발 − 기본 여유 − 최대 보정 − 30분)에 작업을 보수적으로 예약하고, 그 시각에 핸들러가 실제 권장 도착 시각을 계산해 아직 이르면 **같은 작업을** 정확한 시각으로 재예약하고, 창 안이면 실시간 출국장을 조회해 발송한다. 디스패처에 "재예약" 결과를 추가한다.

**Tech Stack:** Postgres(plpgsql 트리거), Supabase Edge Function(Deno), `scheduled_notifications` 스케줄러

**Spec:** 이 대화의 합의 — 출국장 추천 창은 권장 도착 30분 전부터(커밋 7abcb3ad), 푸시는 같은 시점에 보낸다, 방식 B(보수적 예약 → 핸들러 계산 → 같은 작업 재예약).

## Global Constraints

- 대상: `type = 'flight'`, `trips.is_overseas`, 출발 공항 `ICN`, 운항 상태가 `cancelled` 아님(공항 도착 안내 예약과 같은 자격)
- 보수적 예약 시각 = `COALESCE(estimated_at, departure_at)` − (활성 정책 `international_base_buffer_minutes` + `GREATEST(calm_extra_minutes, normal_extra_minutes, crowded_extra_minutes, very_crowded_extra_minutes)` + 30) 분. 정책 CHECK 는 단조 증가를 보장하지 않으므로 최대 보정은 네 값의 최댓값이다. 예약은 이 시각이 `NOW()` 이후일 때만 한다(그보다 늦게 등록된 편은 푸시 없이 화면에서만 본다 — 출발 시각 변경마다 즉시 재발송되는 것을 막기 위해). 정책값은 SQL 상수가 아니라 `airport_arrival_guidance_policies`(is_active) 에서 읽는다. 30 은 출국장 추천 창(`REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES`)의 사본이다
- 새 알림 type: `departure_gate_recommendation`
- 재예약은 같은 행의 `scheduled_for` 를 바꾸고 `status` 를 `pending` 으로 되돌린다. **`status = 'processing'` 인 행에만** 적용한다(트리거가 그 사이 취소·재생성한 작업을 되살리지 않기 위해). `attempt_count` 는 바꾸지 않는다
- 출발 시각(`estimated_at ?? departure_at`)이 지났으면 핸들러는 `skipped`. 출발 전인데 안내를 만들 수 없으면(터미널 미수신 등 `getGuidanceForTransport` 가 `null`) 10분 뒤로 재예약한다 — 출발 시각이 상한이다
- 30분은 `guidance.ts` 의 `REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES` 를 **export** 해 쓴다(상수 중복 금지)
- 디스패처의 완료·취소·재예약 갱신은 모두 `status = 'processing'` 인 행에만 적용한다(핸들러가 도는 사이 트리거가 취소한 작업을 덮어쓰지 않기 위해)
- 푸시 데이터는 다른 운항 알림과 같이 `{ tripId, transportId }`
- 출국장 라벨은 도메인 `GateId` 매핑(`airportArrivalGuidance.types.ts`)의 사본을 Edge 에 둔다. 모르는 코드는 원문
- 코드 주석 금지. 마이그레이션은 작성만 하고 `db push` 하지 않는다. 커밋은 태스크마다 하지 않고 사용자 요청 시 한다
- Deno 미설치: Deno 테스트는 작성하고 같은 케이스를 node(`--experimental-strip-types`) 스크립트로 검증한다. `deno` 명령은 실행하지 않는다(root package.json 을 바꾼다)

## Review Focus

- 핸들러가 재예약하는 사이 출발 지연으로 트리거가 작업을 취소·재생성 → 재예약이 취소된 행을 되살리지 않는다(활성 작업 1개 유지)
- 재실행 시점에 혼잡이 줄어 권장 도착이 늦어짐 → 다시 재예약(출발 전에 끝나므로 유한)
- 터미널 미확인 → 출발 전까지 10분 간격 재예약, 출발 뒤 `skipped`
- 결항·교통편 삭제 → `cancelled`
- 실시간 추천이 `null`(API 빈 응답) → `skipped`

## File Structure

| 파일 | 책임 | 태스크 |
| --- | --- | --- |
| `supabase/migrations/20261010000000_departure_gate_recommendation_jobs.sql` | 예약 동기화 함수·트리거·기존 편 백필 | 1 |
| `supabase/functions/dispatch-notifications/dispatch.ts` (+ `dispatch.test.ts`) | 재예약 결과 처리 | 2 |
| `supabase/functions/dispatch-notifications/handlers/departureGateRecommendationMessage.ts` (+ test) | 푸시 문구·출국장 라벨 | 3 |
| `supabase/functions/dispatch-notifications/handlers/departureGateRecommendation.ts` | 핸들러(계산·재예약·발송) | 3 |
| `supabase/functions/dispatch-notifications/index.ts` | 핸들러 등록 | 3 |
| `docs/codebase.md` | 예약 알림 항목 갱신 | 4 |

## 의존 그래프와 웨이브

- Wave 1: Task 1, Task 2 (파일 겹침 없음)
- Wave 2: Task 3 (Task 2 의 결과 타입 사용)
- Wave 3: Task 4

---

## Task 1: DB — 출국장 추천 예약 동기화

**Files:**
- Create: `supabase/migrations/20261010000000_departure_gate_recommendation_jobs.sql`
- Modify: `packages/domains/src/gateways/client/_database.types.ts`

**Interfaces:**
- Produces: `public.sync_departure_gate_recommendation_job(p_transport_id uuid) RETURNS void` (SECURITY DEFINER, `search_path = public`, PUBLIC·anon·authenticated 실행 권한 회수)

- 최신 정의를 따른다: `scheduled_notifications` 에는 `trip_id` 컬럼이 없다(`20261004060000_scheduled_notifications_drop_trip_id.sql` 의 `sync_airport_arrival_guidance_job` 형태를 그대로 본뜬다)
- 동작: 기존 `departure_gate_recommendation` 의 `pending`·`processing` 작업을 취소 → 자격이 되고 보수적 예약 시각이 `NOW()` 이후면 새 `pending` 작업 insert. 활성 정책이 없으면 예약하지 않는다
- 트리거(공항 도착 안내와 같은 세 곳):
  - `trip_transports` AFTER INSERT OR UPDATE OR DELETE
  - `trip_transport_flight_status` AFTER INSERT OR DELETE OR UPDATE OF `kind`, `estimated_at` — UPDATE 는 두 값이 그대로면 건너뛴다
  - `trips` AFTER UPDATE OF `is_overseas` — 그 여행의 교통편마다 동기화
- 마지막에 출발이 미래인 기존 교통편을 백필한다

- `packages/domains/src/gateways/client/_database.types.ts` 의 `Functions` 에 `sync_departure_gate_recommendation_job: { Args: { p_transport_id: string }; Returns: undefined }` 를 기존 `sync_boarding_reminder_job` 형식대로 손으로 추가한다(`pnpm gen-types` 전까지)

**검증:** 순수 로직 테스트 인프라가 없다(`supabase/tests/*.scenarios.sql` 형식이 있으면 시나리오 추가를 검토하되 실행은 하지 않는다). SQL 을 읽어 Global Constraints 와 대조한다.

## Task 2: Edge — 디스패처 재예약 결과

**Files:**
- Modify: `supabase/functions/dispatch-notifications/dispatch.ts`, `dispatch.test.ts`

**Interfaces:**
- Produces:

```ts
export interface RescheduledOutcome { rescheduledFor: Date }
export type NotificationOutcome = 'sent' | 'skipped' | 'cancelled' | RescheduledOutcome
```

- 핸들러가 `RescheduledOutcome` 을 돌려주면 `status: 'pending'`, `scheduled_for: rescheduledFor`, `locked_at: null`, `updated_at` 으로 갱신한다. `attempt_count`·`last_error` 는 건드리지 않는다. 발송 수에 넣지 않는다. 객체 결과 분기는 `markDelivered` 보다 먼저 온다
- `markDelivered`·`markCancelled`·재예약 갱신 모두 `.eq('id', …).eq('status', 'processing')` 조건을 단다

**검증 케이스 (`dispatch.test.ts`, 기존 fake supabase 패턴):**
- 재예약 결과면 작업을 대기 상태로 되돌리고 발송 시각을 바꾼다
- 재예약은 발송 수에 넣지 않는다
- 재예약은 시도 횟수를 늘리지 않는다
- 재예약 결과는 완료(delivered)로 기록하지 않는다
- 완료·취소·재예약 갱신은 처리 중 상태인 작업에만 적용한다 (fake 의 `eq` 가 인자를 기록하도록 바꿔 `('status','processing')` 를 단언)

## Task 3: Edge — 출국장 추천 핸들러와 문구

**Files:**
- Create: `supabase/functions/dispatch-notifications/handlers/departureGateRecommendationMessage.ts`, `departureGateRecommendationMessage.test.ts`
- Create: `supabase/functions/dispatch-notifications/handlers/departureGateRecommendation.ts`
- Modify: `supabase/functions/dispatch-notifications/index.ts` (`departure_gate_recommendation: handleDepartureGateRecommendation` 등록)
- Modify: `supabase/functions/airport-arrival-guidance/guidance.ts` (창 상수 export)

**Interfaces:**
- Consumes: Task 2 `RescheduledOutcome`; `../../airport-arrival-guidance/guidanceForTransport.ts` 의 `getGuidanceForTransport(supabase, { tripId, transportId, now })`, `getDepartureGateRecommendation(supabase, { terminal })`; `guidance.ts` 에서 export 할 `REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES`; `../../airport-arrival-guidance/guidance.ts` 의 `getIsDepartureGateRecommendable`, `DepartureGateRecommendation`; `../../airport-arrival-guidance/airports.ts` 의 `getAirportCityName`; `../sendPush.ts` 의 `sendPushToRecipients`
- Produces:

```ts
export interface DepartureGateRecommendationPushMessage { title: string; body: string }
export function toDepartureGateRecommendationMessage(
  recommendation: DepartureGateRecommendation,
  route: { terminal: IncheonTerminalCode },
): DepartureGateRecommendationPushMessage
export const handleDepartureGateRecommendation: NotificationHandler
```

- 문구: 제목 `인천공항 제1터미널 출국장 안내`/`제2터미널`(P01·P02→T1, P03→T2, `toIncheonTerminalCode`), 본문 `지금 ${출국장 라벨}이 가장 여유로워요. (${HH:mm} 기준)`. 시각은 `observedAt` 을 Asia/Seoul `HH:mm`
- 핸들러 순서:
  1. 교통편(`id, trip_id, departure_at, arrival_name, arrival_airport_code`)이 없으면 `cancelled`
  2. 운항 상태(`kind, estimated_at`)를 읽어 `cancelled` 면 `cancelled`
  3. 출발 시각(`estimated_at ?? departure_at`)이 `now` 이하이면 `skipped`
  4. `getGuidanceForTransport` 가 `null` 이면 `{ rescheduledFor: now + 10분 }`
  5. `getIsDepartureGateRecommendable(guidance, now)` 가 거짓이면 `{ rescheduledFor: recommendedArrivalAt − REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES분 }` (판별 함수는 터미널이 없거나 창 밖이면 거짓이다. 4를 통과한 해외 인천편은 터미널이 있으므로 창 밖인 경우다)
  6. `getDepartureGateRecommendation(supabase, { terminal: guidance.terminal })` 가 `null` 이면 `skipped`
  7. 출발 터미널(`toIncheonTerminalCode(guidance.terminal)`, null 이면 `skipped`)로 문구를 만들어 `sendPushToRecipients(supabase, trip_id, message, { tripId, transportId })`. 시도했는데 전부 실패면 throw(기존 핸들러와 같다), 보낸 게 있으면 `sent` 아니면 `skipped`
- `guidance.ts` 의 `REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES` 를 export 로 바꾼다(값·이름 그대로)

**검증 케이스 (`departureGateRecommendationMessage.test.ts`):**
- 출국장 코드를 한글 라벨로 바꾼다(`DG3_E` → `출국장 3 동쪽`)
- 모르는 출국장 코드는 원문을 쓴다
- 관측 시각을 한국 시각 `HH:mm` 으로 쓴다
- 제목에 출발 터미널을 넣는다

## Task 4: 문서

**Files:**
- Modify: `docs/codebase.md` (예약 알림 스케줄러 항목, 공항 도착 안내 항목)

- 새 type 과 보수적 예약 → 핸들러 재예약 구조, 재예약은 processing 행에만 적용되는 이유, 배포 순서(마이그레이션 적용 → `supabase functions deploy dispatch-notifications`)를 적는다
