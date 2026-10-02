# 공항 도착 안내: 인천 API 터미널 기준 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 해외 출발 공항 도착 안내가 탑승권 터미널이 아니라 인천 운항 API의 터미널로 혼잡도를 조회하게 하고, 클라이언트의 운항 상태 조회를 인천 API 직접 호출에서 `trip_transport_flight_status` 읽기로 바꾼다.

**Architecture:** `flight-status-watch`가 5분마다 받는 인천 API 결과(`terminalid` 포함)를 감시 범위 D+6까지 `trip_transport_flight_status`에 저장한다(알림은 24시간 안으로 유지). 안내 Edge는 이 행의 터미널(`P01`·`P02`·`P03`)을 읽어 T1/T2로 혼잡도를 조회하고, 응답에는 원본 코드를 내려 클라이언트가 `toTerminalLabel`로 표시한다. 클라이언트 `useFlightStatuses`는 같은 테이블을 읽는다. 국내선(한국공항공사) 경로는 그대로 둔다.

**Tech Stack:** Supabase(Postgres 마이그레이션, Deno Edge Function), TypeScript, TanStack Query, vitest(도메인), `deno test`(Edge)

**Spec:** `docs/superpowers/specs/2026-10-03-airport-arrival-guidance-api-terminal-design.md` (후속 설계. 기존 `2026-09-21-airport-arrival-guidance-design.md`의 터미널 규칙을 대체하며, 기존 문서는 이력을 위해 수정하지 않는다)

## Global Constraints

- 인천 출발편만 대응한다. 해외 안내는 `departure_airport_code = 'ICN'` 일 때만 만든다.
- 터미널 코드: `P01` → 1터미널(T1), `P02` → 1터미널(탑승동, T1), `P03` → 2터미널(T2).
- 화면 표기: `P01` → `1터미널`, `P02` → `1터미널(탑승동)`, `P03` → `2터미널`. 라벨 변환의 원본은 도메인 `toTerminalLabel` 하나이며 Edge에 라벨 표를 두지 않는다.
- Edge 응답의 `terminal`은 해외(`sourceKind: 'forecast'`)에서 인천 원본 코드(`P01`…), 국내(`'domestic'`)에서 탑승권 원문이다.
- 혼잡 스냅샷·기준값의 `terminal` 키는 `'T1'`/`'T2'`다(국내는 기존 그대로 탑승권 원문).
- 항공편 조회 API에서 받아온 터미널 ID를 혼잡도 조회 코드로 매핑한다: `P01` → `T1`, `P02` → `T1`, `P03` → `T2`. 이 밖의 값은 매핑하지 않고(null) 혼잡도를 조회하지 않는다. 구현은 Task 2의 `toIncheonTerminalCode` 하나뿐이며, 혼잡도 조회 경로(스냅샷 생성·기준값 조회)는 항상 이 코드를 거친다.
- 탑승권 `terminal`·`gate`·`seat` 컬럼과 입력 UI·OCR은 건드리지 않는다. 시스템 판단(해외 안내)만 API 값으로 옮긴다.
- 알림 판단 로직(`getShouldNotify`, `last_notified_*`)은 바꾸지 않는다. 알림은 출발 24시간 이내 편에만 보낸다.
- 인천 도착편 감시·날짜 매칭은 이번에 고치지 않는다(후속 작업에서 제거 예정, 메모리 `project-flight-watch-arrival-removal`).
- 기존 스펙 문서(`2026-09-21-...`)는 수정하지 않는다. 설계 변경은 위 새 스펙 문서에 기록한다.
- 코드에 주석을 남기지 않는다. 단, 기존 파일의 "원본" 안내 주석은 유지한다.
- 도메인과 Edge에 복제된 규칙(`statusChange.ts`↔`flightStatusNotify.utils`, `guidance.ts`↔`airportArrivalGuidance.utils`, `incheonFlights.ts`↔`incheonFlightStatus.utils`)의 **도메인 원본은 지우지 않는다**.
- 커밋은 사용자가 요청할 때만 한다. 커밋 메시지는 한글, 스코프 사용, 끝에 `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- 브랜치: 루트 `feat/airport-guidance-api-terminal`, 작업 `-server`(Task 1~5) · `-client`(Task 6~7). 생성 전 사용자 확인. 워크트리는 만들지 않는다.

## Review Focus

실호출 결과(2026-10-03): 인천 운항 API는 D+0~D+6 전 구간에서 `terminalid` 100% 제공, `gatenumber`는 D+0만 제공. 승객예고는 `selectdate` 0·1만 유효하고 2 이상은 **오늘 데이터를 조용히 돌려준다**.

0. (재현 불가 확인) API가 `terminalid`를 비워 주는 경우는 실호출 8,435건에서 0건이다. 실제 실패 경로는 편명 불일치·감시 제외·첫 감시 전이며 모두 안내 없음으로 귀결된다. (Task 2·5)
1. 운항 상태 행이 아직 없는 해외 편(새 편, 첫 크론 전) → 안내를 만들지 않고 오류도 내지 않는다. (Task 2·5)
2. `terminal`이 NULL이거나 `P01`~`P03` 밖의 값 → 안내 없음. 잘못된 터미널로 조회하지 않는다. (Task 2)
3. 출발 24시간보다 먼 편이 이미 `delayed`로 저장된 뒤 24시간 안에 들어옴 → 그 시점에 알림이 정상 1회 나간다. 24시간 밖에서는 알림이 안 나간다. (Task 4)
4. 출발 후 6시간까지 행이 갱신되고 그 뒤로는 갱신되지 않는다. 클라이언트는 마지막 값을 보여준다. (Task 4·6)
5. 국내선(비해외) 경로는 탑승권 터미널 그대로 동작한다. 해외라도 비인천 출발이면 안내가 없다. (Task 2·5)

## File Structure

| 파일 | 책임 | 작업 |
|---|---|---|
| `packages/domains/src/modules/flight-status/incheonFlightStatus.api.ts` | 인천 터미널 ID 어휘(`IncheonAirportTerminalId`) | 수정(Task 1) |
| `supabase/functions/airport-arrival-guidance/incheonTerminal.ts` | 인천 터미널 ID → T1/T2 코드, 안내용 터미널 결정 | 신규(Task 2) |
| `supabase/migrations/20261004000000_flight_status_terminal_and_guidance_eligibility.sql` | `terminal` 컬럼, 예약 자격 규칙 | 신규(Task 3) |
| `supabase/functions/flight-status-watch/watchWindow.ts` | 관측 범위·알림 범위 판단 | 신규(Task 4) |
| `supabase/functions/flight-status-watch/index.ts` | 터미널 저장, 두 범위 적용 | 수정(Task 4) |
| `supabase/functions/airport-arrival-guidance/index.ts` | 해외 경로 터미널 출처 교체 | 수정(Task 5) |
| `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.utils.ts` | `toGuidanceTerminalLabel` | 수정(Task 5) |
| 웹·앱 `AirportArrivalGuidanceSection.tsx` | 라벨 표시 | 수정(Task 5) |
| `packages/domains/src/modules/flight-status/tripFlightStatus.api.ts` | 운항 상태 테이블 읽기·행→`FlightStatus` 변환 | 신규(Task 6) |
| `packages/domains/src/modules/flight-status/useFlightStatuses.ts` | 테이블 읽기로 교체 | 수정(Task 6) |
| 호출부 6곳, `flightStatus.types.ts`, `incheonFlightStatus.api.ts` | `transportId` 전달, 죽은 코드 제거 | 수정(Task 7) |

의존 그래프와 웨이브:

```
W1: Task 1 (라벨) · Task 2 (Edge 터미널 규칙) · Task 3 (마이그레이션·타입)      ← 서로 다른 파일
W2: Task 4 (watch, Task 3) · Task 5 (안내 Edge·표시, Task 1·2·3) · Task 6 (클라 데이터층, Task 3)
W3: Task 7 (호출부 전환, Task 6)
W4: Task 8 (문서)
```

---

### Task 1: 터미널 라벨 확정 (탑승동 표기)

**Files:**
- Modify: `packages/domains/src/modules/flight-status/incheonFlightStatus.api.ts` (`IncheonAirportTerminalId`)
- Modify: `packages/domains/src/modules/flight-status/incheonFlightStatus.utils.ts` (현재 워킹트리의 `toTerminalLabel` 유지)
- Test: `packages/domains/src/modules/flight-status/__tests__/incheonFlightStatus.utils.test.ts`

**Interfaces:**
- Produces: `toTerminalLabel(terminalId: string | undefined): string | undefined` — `P01`→`1터미널`, `P02`→`1터미널(탑승동)`, `P03`→`2터미널`, 그 외·`undefined`→`undefined`. `IncheonAirportTerminalId` 값 `'P01'|'P02'|'P03'`.

검증 케이스 (제목만):
- `P01 은 1터미널이다`
- `P02 는 1터미널(탑승동)이다`
- `P03 은 2터미널이다`
- `모르는 코드는 undefined 다`
- `값이 없으면 undefined 다`

- [ ] **Step 1:** 기존 `toTerminalLabel` 테스트 블록을 위 5개 제목으로 맞춘다(현재 `P09 → 'P09'`는 사용자 리팩터링 이후 동작과 어긋난다). 본문은 한 건씩 채운다.
- [ ] **Step 2:** `cd packages/domains && npx vitest run src/modules/flight-status` — `P02` 케이스만 실패하는지 확인.
- [ ] **Step 3:** `IncheonAirportTerminalId`의 `탑승동` 키를 `"1터미널(탑승동)"`으로 바꾼다. `toTerminalLabel`은 수정하지 않는다.
- [ ] **Step 4:** 같은 명령으로 전부 통과, `npx tsc --noEmit -p .` 오류 없음.
- [ ] **Step 5 (사용자 요청 시):** `feat(domains/flight-status): 인천 터미널 코드 P02를 1터미널(탑승동)으로 표기한다`

---

### Task 2: Edge — 인천 터미널 규칙

**Files:**
- Create: `supabase/functions/airport-arrival-guidance/incheonTerminal.ts`
- Test: `supabase/functions/airport-arrival-guidance/incheonTerminal.test.ts` (`jsr:@std/assert@1`, 기존 `guidance.test.ts`와 같은 러너)

**Interfaces:**
- Produces:
  ```ts
  export type IncheonTerminalCode = 'T1' | 'T2'
  export function toIncheonTerminalCode(terminalId: string | null): IncheonTerminalCode | null

  export interface GuidanceTerminal {
    snapshotTerminal: string
    responseTerminal: string
  }
  export function getGuidanceTerminal(input: {
    isOverseas: boolean
    departureAirportCode: string
    flightStatusTerminal: string | null
    ticketTerminal: string | null
  }): GuidanceTerminal | null
  ```
  해외는 `ICN` 출발이고 `toIncheonTerminalCode(flightStatusTerminal)`가 있을 때만 `{ snapshotTerminal: 코드, responseTerminal: 원본 ID }`. 국내는 `ticketTerminal`이 있으면 둘 다 그 값, 없으면 null.
- Consumes: 없음 (`congestion.ts`의 기존 `toIncheonTerminalCode(terminal)`는 `'T1'`/`'T2'` 문자열에서도 그대로 동작하므로 수정하지 않는다. 이름이 겹치지 않도록 새 함수는 `incheonTerminal.ts` 안에서만 쓴다)

검증 케이스 (제목만):
- `P01 은 T1 이다` / `P02 탑승동은 T1 이다` / `P03 은 T2 이다`
- `모르는 코드는 null 이다` / `null 은 null 이다`
- `해외 인천 출발이고 터미널을 알면 코드와 원본 ID 를 돌려준다`
- `해외인데 인천 출발이 아니면 null 이다`
- `해외인데 운항 상태 터미널이 없으면 null 이다`
- `해외는 탑승권 터미널이 있어도 쓰지 않는다`
- `국내는 탑승권 터미널을 그대로 쓴다`
- `국내인데 탑승권 터미널이 없으면 null 이다`

- [ ] **Step 1:** 위 제목들로 `it`/`Deno.test` 골격을 만들고 한 건씩 본문을 채운다.
- [ ] **Step 2:** `deno test supabase/functions/airport-arrival-guidance/incheonTerminal.test.ts` — 함수 없음으로 실패 확인.
- [ ] **Step 3:** 최소 구현. 예: `const CODE_BY_TERMINAL_ID: Record<string, IncheonTerminalCode> = { P01: 'T1', P02: 'T1', P03: 'T2' }`.
- [ ] **Step 4:** 테스트 통과 확인.
- [ ] **Step 5 (요청 시):** `feat(edge/airport-arrival-guidance): 인천 터미널 ID 를 T1·T2 혼잡 조회 코드로 바꾼다`

---

### Task 3: DB — `terminal` 컬럼과 예약 자격 규칙

**Files:**
- Create: `supabase/migrations/20261004000000_flight_status_terminal_and_guidance_eligibility.sql`
- Modify: `packages/domains/src/gateways/client/_database.types.ts` (직접 수정 금지 — `pnpm gen-types`로 재생성)

**Interfaces:**
- Produces: `trip_transport_flight_status.terminal text` (NULL 허용, 인천 API 원본 `P01`·`P02`·`P03`). `sync_airport_arrival_guidance_job`의 새 자격: 항공 + 해외 + `departure_airport_code = 'ICN'` + 결항 아님 + 예약 시각이 미래. **탑승권 조건 제거.**

- [ ] **Step 1:** 마이그레이션 작성.

```sql
ALTER TABLE "public"."trip_transport_flight_status"
    ADD COLUMN IF NOT EXISTS "terminal" "text";

CREATE OR REPLACE FUNCTION "public"."sync_airport_arrival_guidance_job"("p_transport_id" "uuid")
RETURNS void
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    "v_departure_at" timestamp with time zone;
    "v_trip_is_overseas" boolean;
    "v_departure_airport_code" "text";
    "v_is_eligible" boolean := false;
    "v_scheduled_for" timestamp with time zone;
BEGIN
    SELECT
        COALESCE("fs"."estimated_at", "t"."departure_at"),
        "tr"."is_overseas",
        "t"."departure_airport_code"
    INTO
        "v_departure_at",
        "v_trip_is_overseas",
        "v_departure_airport_code"
    FROM "public"."trip_transports" AS "t"
    JOIN "public"."trips" AS "tr" ON "tr"."id" = "t"."trip_id"
    LEFT JOIN "public"."trip_transport_flight_status" AS "fs" ON "fs"."transport_id" = "t"."id"
    WHERE "t"."id" = "p_transport_id"
      AND "t"."type" = 'flight'
      AND COALESCE("fs"."kind", '') <> 'cancelled';

    IF FOUND THEN
        "v_scheduled_for" := (
            "date_trunc"('day', "v_departure_at" AT TIME ZONE 'Asia/Seoul')
            - INTERVAL '1 day'
            + INTERVAL '18 hours'
        ) AT TIME ZONE 'Asia/Seoul';

        "v_is_eligible" :=
            "v_departure_at" > NOW()
            AND "v_scheduled_for" > NOW()
            AND COALESCE("v_trip_is_overseas", false)
            AND "v_departure_airport_code" = 'ICN';
    END IF;

    UPDATE "public"."scheduled_notification_jobs"
    SET
        "status" = 'cancelled',
        "cancelled_at" = NOW(),
        "updated_at" = NOW()
    WHERE "trip_transport_id" = "p_transport_id"
      AND "type" = 'airport_arrival_guidance'
      AND "status" IN ('pending', 'processing');

    IF NOT "v_is_eligible" THEN
        RETURN;
    END IF;

    INSERT INTO "public"."scheduled_notification_jobs" (
        "trip_transport_id",
        "type",
        "status",
        "scheduled_for"
    ) VALUES (
        "p_transport_id",
        'airport_arrival_guidance',
        'pending',
        "v_scheduled_for"
    );
END;
$$;

DROP TRIGGER IF EXISTS "trip_transport_tickets_sync_airport_arrival_guidance_job"
    ON "public"."trip_transport_tickets";
DROP FUNCTION IF EXISTS "public"."sync_airport_arrival_guidance_job_from_ticket"();
```

  `trip_transport_flight_status` 트리거(`UPDATE OF kind, estimated_at`)는 그대로 둔다 — `terminal` 변경은 예약을 재평가하지 않는다. 기존 예약 행 2건은 cancelled라 재동기화는 하지 않는다(새 행 INSERT 트리거가 예약을 만든다).
- [ ] **Step 2:** `supabase db reset`(또는 로컬 마이그레이션 적용)으로 오류 없이 적용되는지 확인.
- [ ] **Step 3:** `pnpm gen-types`로 `_database.types.ts`를 재생성하고 `trip_transport_flight_status.Row.terminal`이 생겼는지 확인.
- [ ] **Step 4:** `pnpm ts-check` 통과 확인.
- [ ] **Step 5 (요청 시):** `feat(db/flight-status): 운항 상태에 터미널을 두고 안내 예약 자격에서 탑승권 터미널을 뺀다`

---

### Task 4: watch — 터미널 저장, 관측·알림 범위 분리

**Files:**
- Create: `supabase/functions/flight-status-watch/watchWindow.ts`
- Test: `supabase/functions/flight-status-watch/watchWindow.test.ts`
- Modify: `supabase/functions/flight-status-watch/index.ts` (감시 대상 쿼리, `shouldNotify`, upsert)

**Interfaces:**
- Consumes: Task 3의 `terminal` 컬럼.
- Produces:
  ```ts
  export const OBSERVE_BEFORE_DEPARTURE_HOURS = 24 * 7
  export const OBSERVE_AFTER_DEPARTURE_HOURS = 6
  export const NOTIFY_BEFORE_DEPARTURE_HOURS = 24
  export function getObserveRange(now: Date): { from: Date; until: Date }
  export function getIsWithinNotifyWindow(departureAt: string, now: Date, windowHours: number): boolean
  ```

검증 케이스 (제목만):
- `관측 범위는 출발 6시간 후부터 7일 전까지다`
- `알림 범위는 아직 출발하지 않았고 24시간 안이면 참이다`
- `출발이 24시간보다 멀면 알림 범위 밖이다`
- `이미 출발했으면 알림 범위 밖이다`
- `경계(정확히 24시간 후)는 범위 안이다`

- [ ] **Step 1:** 테스트 골격과 본문을 한 건씩 채우고 `deno test`로 함수 없음 실패를 확인한다.
- [ ] **Step 2:** `watchWindow.ts` 최소 구현 후 통과.
- [ ] **Step 3:** `index.ts` 수정 — `WATCH_WINDOW_HOURS`/`until` 기반 쿼리를 `getObserveRange(now)`의 `from`·`until`로 바꾸고(`gte('departure_at', from)`, `lte('departure_at', until)`), 알림 창은 `notifyAlways ? TEST_WINDOW_HOURS : NOTIFY_BEFORE_DEPARTURE_HOURS`로 계산한다. 루프에서 `const isNotifiable = getIsWithinNotifyWindow(transport.departure_at, now, notifyWindowHours)` 후 `const shouldNotify = isNotifiable && getShouldNotify(status, notifiedStatus, { notifyAlways })`. upsert에 `terminal: flight.terminalid`를 추가한다. `getIsGateChanged`의 알림 본문용 값은 그대로 둔다.
- [ ] **Step 4:** 수동 확인: 로컬에서 함수를 호출해(`FLIGHT_STATUS_NOTIFY_ALWAYS` 끈 상태) D+3 출발 테스트 항공편 행에 `terminal`이 채워지고 푸시가 나가지 않는지 확인한다.
- [ ] **Step 5 (요청 시):** `feat(edge/flight-status-watch): 터미널을 저장하고 관측 범위를 7일로 넓히되 알림은 24시간 안으로 둔다`

---

### Task 5: 안내 Edge·표시 — API 터미널로 해외 안내

**Files:**
- Modify: `supabase/functions/airport-arrival-guidance/index.ts` (`getGuidanceForTransport`)
- Modify: `supabase/functions/airport-arrival-guidance/types.ts` (변경 없음 확인만 — `terminal: string` 유지)
- Modify: `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.utils.ts` (`toGuidanceTerminalLabel` 추가)
- Modify: `apps/waylog-web/src/features/trip/trip-transport/AirportArrivalGuidanceSection.tsx`, `apps/waylog-app/src/features/trip/trip-transport/AirportArrivalGuidanceSection.tsx`
- Test: `packages/domains/src/modules/airport-arrival-guidance/__tests__/airportArrivalGuidance.utils.test.ts`

**Interfaces:**
- Consumes: Task 2 `getGuidanceTerminal`, Task 1 `toTerminalLabel`, Task 3 `terminal` 컬럼.
- Produces:
  ```ts
  export function toGuidanceTerminalLabel(
    guidance: Pick<AirportArrivalGuidance, 'sourceKind' | 'terminal'>,
  ): string
  ```
  `forecast`면 `toTerminalLabel(terminal) ?? terminal`, `domestic`면 `` `${terminal} 터미널` ``.

검증 케이스 (제목만, 도메인):
- `해외 안내는 P01 을 1터미널로 표시한다`
- `해외 안내는 P02 를 1터미널(탑승동)으로 표시한다`
- `해외 안내는 P03 을 2터미널로 표시한다`
- `해외 안내에서 모르는 코드는 원문을 그대로 표시한다`
- `국내 안내는 탑승권 터미널 뒤에 터미널을 붙여 표시한다`

- [ ] **Step 1:** 도메인 테스트 5건을 한 건씩 채워 실패 확인 후 `toGuidanceTerminalLabel` 구현, 통과.
- [ ] **Step 2:** `index.ts` — 운항 상태 조회 select를 `'kind, estimated_at, terminal'`로 늘리고 `FlightStatusRow`에 `terminal: string | null`을 추가한다. `departure_airport_code`를 함께 쓰는 현재 select는 유지. 기존 `getConsistentDepartureTerminal(...)` 호출을 `getGuidanceTerminal({ isOverseas, departureAirportCode, flightStatusTerminal: typedFlightStatus?.terminal ?? null, ticketTerminal: getConsistentDepartureTerminal(tickets) })`로 바꾸고, `null`이면 반환한다. 이후 `getFreshCongestionSnapshot`의 `terminal`에는 `snapshotTerminal`을, `getAirportArrivalGuidance`의 `departureTerminal`에는 `responseTerminal`을 넘긴다(실시간 스냅샷 호출도 `snapshotTerminal`).
- [ ] **Step 3:** 웹·앱 `AirportArrivalGuidanceSection`의 `` `${guidance.terminal} 터미널` ``을 `toGuidanceTerminalLabel(guidance)`로 바꾼다.
- [ ] **Step 4:** `deno test supabase/functions/airport-arrival-guidance`, `pnpm test`, `pnpm ts-check` 통과. UI는 빌드로 확인하고 실제 앱·웹에서 안내 카드의 터미널 표기를 눈으로 확인한다.
- [ ] **Step 5 (요청 시):** `feat(edge/airport-arrival-guidance): 해외 안내의 터미널을 인천 운항 API 값으로 정한다`, `feat(app,web/trip-transport): 안내 카드에 인천 터미널 라벨을 표시한다`(두 커밋으로 분리)

---

### Task 6: 클라이언트 데이터층 — 운항 상태를 테이블에서 읽는다

**Files:**
- Create: `packages/domains/src/modules/flight-status/tripFlightStatus.api.ts`
- Modify: `packages/domains/src/modules/flight-status/useFlightStatuses.ts`
- Modify: `packages/domains/src/modules/flight-status/flightStatus.types.ts` (`GetFlightStatusParams`에 `transportId` 추가)
- Modify: `packages/domains/src/modules/flight-status/index.ts` (새 api export)
- Test: `packages/domains/src/modules/flight-status/__tests__/tripFlightStatus.api.test.ts`, `useFlightStatuses.test.ts`

**Interfaces:**
- Consumes: Task 3 타입.
- Produces:
  ```ts
  export function toFlightStatusFromRow(row: TripFlightStatusRow): FlightStatus | null
  export async function getTripFlightStatuses(
    transportIds: readonly string[],
  ): Promise<ReadonlyMap<string, FlightStatus>>
  ```
  `FlightQuery`(= `Partial<GetFlightStatusParams>`)가 `transportId`를 포함하고, `getIsQueryable`은 `transportId`도 요구한다. `useFlightStatuses(queries)`·`useFlightStatus(params, options)`의 **반환 모양(`FlightStatusResult`)과 `useFlightStatuses.key()`는 유지**한다(`key()`는 `['flight-status']` 접두로 바꿔 기존 `invalidateQueries` 호출이 계속 동작하게 한다). 행의 `kind` 값이 `FlightStatusKind`와 같은 문자열이므로 타입 가드 없이 `Object.values(FlightStatusKind)`로 판별하고 모르면 `예정`.
  `FlightStatus.label`은 더 이상 채워지지 않는다(원문 remark는 저장하지 않으며 화면이 쓰지 않음).

검증 케이스 (제목만):
- `행의 kind 를 운항 상태 종류로 바꾼다`
- `모르는 kind 는 예정으로 둔다`
- `예정·변경 시각·게이트·터미널을 그대로 옮긴다`
- `변경 시각이 예정 시각과 같으면 변경 시각을 비운다`
- `transportId 가 없으면 조회할 수 없다`
- `행이 없는 편은 상태가 null 이다`

- [ ] **Step 1:** 테스트 골격·본문을 채우고 vitest로 실패 확인.
- [ ] **Step 2:** `tripFlightStatus.api.ts` 구현 — `supabase.from('trip_transport_flight_status').select('transport_id, kind, scheduled_at, estimated_at, gate, terminal').in('transport_id', ids)`. 선례: `flightGateChange.api.ts`. 오류는 `throw error`.
- [ ] **Step 3:** `useFlightStatuses`의 `queryFn`을 `getTripFlightStatuses(조회 가능한 transportId들)`로, 결과 선택을 `statuses.get(query.transportId)`로 바꾼다. `getIsAvailability`·`supportedAirportCodes` 기반 `isSupported`/`isAvailable` 판정은 그대로 둔다.
- [ ] **Step 4:** `npx vitest run src/modules/flight-status` 통과, `npx tsc --noEmit -p .`는 호출부 미수정으로 실패하는 지점만 남는지 확인(Task 7에서 해소).
- [ ] **Step 5 (요청 시):** `feat(domains/flight-status): 운항 상태를 인천 API 가 아니라 감시 테이블에서 읽는다`

---

### Task 7: 호출부 전환과 죽은 코드 제거

**Files:**
- Modify: `apps/waylog-web/src/features/trip/trip-transport/TransportRealtimeInfoSection.tsx`, `apps/waylog-app/src/features/trip/trip-transport/TransportRealtimeInfoSection.tsx` (리터럴 쿼리에 `transportId` 추가)
- Modify: `packages/domains/src/modules/trip-transport/useTripScheduledFlights.ts` (`transportId: transport.id` 추가)
- Modify: 웹·앱 `TransportOperationalInfoSection.tsx`, 앱 `TransportSummarySection.tsx` (`TripTransport`에는 `id`만 있고 `transportId`가 없으므로 `{ ...transport, transportId: transport.id }`로 넘긴다. `FlightQuery`가 Partial 이라 타입 검사가 누락을 잡지 못한다)
- Modify: `packages/domains/src/modules/flight-status/incheonFlightStatus.api.ts` (클라이언트 목록 조회 `getFlights`·`getIncheonFlightSchedules`·`findIncheonFlightStatus` 제거, provider에서 `getFlightSchedules`·`findFlightStatus` 제거), `flightStatus.types.ts`(`FlightSchedules`, provider의 두 메서드 제거)

**Interfaces:**
- Consumes: Task 6의 `FlightQuery.transportId`.
- Produces: provider는 `{ provider, supportedAirportCodes, getIsAvailability }`만 갖는다.
- **제거하지 않는 것:** `incheonFlightStatus.utils.ts`의 `isSameFlight`·`getIsSameKstDate`·`toIsoFromApiDateTime`·`toFlightStatusKind`와 그 테스트 — Deno 감시 함수 사본의 "원본·검증 소스"다.

- [ ] **Step 1:** 호출부 `transportId` 추가 후 `pnpm ts-check`로 전부 컴파일되는지 확인한다.
- [ ] **Step 2:** provider에서 제거한 메서드의 참조가 없는지 `grep -rn "getFlightSchedules\|findFlightStatus\|FlightSchedules\|getIncheonFlightSchedules" apps packages` 로 확인하고 제거한다.
- [ ] **Step 3:** `pnpm test`, `pnpm ts-check` 통과.
- [ ] **Step 4:** 앱·웹에서 교통편 상세의 터미널·게이트 칸, 지연 표시, 일정 목록의 변경 출발 시각이 이전과 같게 나오는지 확인한다. 새로 만든 편은 첫 크론(최대 5분) 전까지 값이 비어 있어야 한다.
- [ ] **Step 5 (요청 시):** `refactor(domains/flight-status): 클라이언트의 인천 API 목록 조회와 편 탐색을 제거한다`, `refactor(app,web/trip-transport): 운항 상태 조회에 교통편 id 를 넘긴다`(분리)

---

### Task 8: 문서

**Files:**
- Modify: `docs/codebase.md`
- 확인만: `docs/superpowers/specs/2026-10-03-airport-arrival-guidance-api-terminal-design.md` (이미 작성됨)

- [ ] **Step 1:** `docs/codebase.md` — (a) `trip_transport_flight_status`가 **외부 관측값**(현재 상태, 안내 Edge와 클라이언트가 읽음)과 **푸시 이력**(`last_notified_*`, `prev_gate`) 두 역할임을 명시하고, 이후 "푸시 컬럼 분리" 작업 후보로 적는다. (b) 감시 범위(D+6 저장 · 출발 6시간 후까지 · 알림 24시간), 인천 출발편 한정(도착편은 후속 제거 예정), `terminal`은 인천 원본 코드임을 적는다. (c) 해외 안내의 터미널 출처가 운항 상태 행이고 탑승권 터미널은 표시용임을 적는다. (d) 새 스펙 문서 링크를 "공항 도착 안내" 설명에 추가한다. (e) 클라이언트 `useFlightStatuses`가 테이블을 읽으며 값이 최대 5분 늦고 새 편은 첫 크론 전까지 비어 있음을 적는다. (f) 승객예고는 `selectdate` 0·1만 유효하고 그 외는 오늘 데이터를 돌려준다는 함정을 적는다.
- [ ] **Step 2:** 새 스펙 문서의 "이전과 이후"·"영향과 한계"가 구현 결과와 어긋나지 않는지 대조하고, 달라진 부분만 새 스펙 문서에서 고친다. 기존 스펙 문서는 수정하지 않는다.
- [ ] **Step 3:** 문서 내용이 실제 코드(파일 위치·함수 이름)와 어긋나지 않는지 대조한다.
- [ ] **Step 4 (요청 시):** `docs: 공항 도착 안내의 터미널 출처와 운항 상태 테이블의 두 역할을 갱신한다`

---

## Self-Review

1. **Spec coverage:** 터미널 출처 전환(T2·T3·T5), 감시 공백 해소(T4), 라벨 표기(T1·T5), 클라이언트 DB 읽기(T6·T7), 국내선 유지(T2 `getGuidanceTerminal` 국내 분기), 인천 출발 한정(T2·T3), 문서(T8). 누락 없음.
2. **Placeholders:** 테스트 본문은 CLAUDE.md B 규칙에 따라 의도적으로 제목만 담았다(실행 시점에 한 건씩 채운다). 그 외 구현 단계는 코드 또는 구체 지시를 담았다.
3. **Type consistency:** `getGuidanceTerminal`(T2) → `snapshotTerminal`/`responseTerminal`(T5), `toTerminalLabel`(T1) → `toGuidanceTerminalLabel`(T5), `FlightQuery.transportId`(T6) → 호출부(T7), `terminal` 컬럼(T3) → T4·T5·T6. 이름 일치 확인.
4. **Review Focus:** 5개 항목이 T2·T4·T5·T6 테스트 제목에 대응한다.
