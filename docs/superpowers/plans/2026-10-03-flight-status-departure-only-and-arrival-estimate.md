# 운항 상태 인천 출발 한정과 도착 시각 지연 반영 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** 인천 도착편 감시를 제거하고, 지연 분으로 도착지 도착 시각을 추정해 표시한다.

**Architecture:** 감시 함수와 클라이언트 조회를 인천 출발편으로 좁힌다. 도착 시각 추정은 `trip-transport` 도메인의 순수 함수 `applyFlightStatus`에 모으고, 기존에 출발 시각을 덮던 두 자리(`useTripScheduledFlights`, 앱 요약)가 이를 쓴다.

**Spec:** `docs/superpowers/specs/2026-10-03-flight-status-departure-only-and-arrival-estimate-design.md`

## Global Constraints

- 인천 도착편 감시 제거는 기능 삭제다. 알림·카드가 사라지는 것이 의도다.
- `trip_transport_flight_status`의 푸시 컬럼 분리는 이번 범위가 아니다(별도 문서).
- 지연 분 계산은 기존 `flightStatusView.utils`의 `toDelayMinutes`를 재사용한다(중복 구현 금지).
- 코드에 주석을 새로 쓰지 않는다. 기존 "원본" 주석은 유지한다.
- Edge 테스트는 로컬에 deno가 없어 vitest 어댑터(`<scratchpad>/edge/vitest.config.ts`)로 실행한다.
- 커밋은 사용자가 요청할 때만 한다.

## Review Focus

1. 인천 출발편이 같은 날 편을 못 찾으면 null 이다(다른 날 대체 금지, notifyAlways 만 예외). (Task 2)
2. 지연이 아니거나(일찍 출발) 결항·회항이면 도착 시각을 바꾸지 않는다. (Task 1)
3. 도착 시각이 없는 교통편에서 도착 시각이 생기지 않는다. (Task 1)
4. 인천 도착편(해외→인천)은 조회 대상이 아니다. (Task 3)

## 웨이브

```
W1: Task 1 (도메인 도착 시각 추정 + 화면)  ·  Task 2 (감시 함수 + 마이그레이션)  ·  Task 3 (클라이언트 조회 한정)
W2: Task 4 (문서)
```
파일이 겹치지 않는다(Task 1: trip-transport·flight-status/flightStatusView·화면, Task 2: supabase, Task 3: flight-status/useFlightStatuses·types).

---

### Task 1: 도착 시각 지연 반영

**Files:**
- Modify: `packages/domains/src/modules/flight-status/flightStatusView.utils.ts` (`toDelayMinutes` export)
- Modify: `packages/domains/src/modules/trip-transport/tripTransport.utils.ts` (`applyFlightStatus` 추가)
- Modify: `packages/domains/src/modules/trip-transport/tripTransport.types.ts` (`ScheduledTripTransport`)
- Modify: `packages/domains/src/modules/trip-transport/useTripScheduledFlights.ts`
- Modify: 웹·앱 `TransportSummarySection.tsx`(앱만 직접 계산하므로 `applyFlightStatus`로 교체), 웹·앱 `TransportCard.tsx`·앱 `TransportSummarySection.tsx`·웹 `TransportSummarySection.tsx`의 도착 시각 옆 "지연 반영" 표시
- Test: `packages/domains/src/modules/trip-transport/__tests__/tripTransport.utils.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ScheduledTripTransport = TripTransport & { arrivalDelayMinutes?: number }
  export function applyFlightStatus(transport: TripTransport, status: FlightStatus | null): ScheduledTripTransport
  export function toDelayMinutes(status: FlightStatus): number | null   // 기존 함수를 export
  ```
  출발 시각은 `status.estimatedAt ?? status.scheduledAt ?? transport.departureAt`(기존 동작). 도착 시각은 `arrivalAt`이 있고 `toDelayMinutes`가 양수이며 `status.kind`가 결항·회항이 아닐 때 그 분만큼 늦추고 `arrivalDelayMinutes`를 담는다.

검증 케이스 (제목만):
- `운항 상태가 없으면 교통편을 그대로 돌려준다`
- `변경 시각이 있으면 출발 시각을 변경 시각으로 바꾼다`
- `변경 시각이 없으면 예정 시각으로 출발 시각을 바꾼다`
- `지연되면 도착 시각을 지연 분만큼 늦추고 지연 분을 함께 돌려준다`
- `도착 시각이 없으면 도착 시각을 만들지 않는다`
- `일찍 출발해도 도착 시각을 당기지 않는다`
- `결항이면 도착 시각을 바꾸지 않는다`
- `회항이면 도착 시각을 바꾸지 않는다`
- `입력 교통편을 수정하지 않는다`

- [ ] **Step 1:** 테스트 골격과 본문을 채운다. **Step 2:** 실패 확인. **Step 3:** 최소 구현. **Step 4:** 통과·`pnpm ts-check`. **Step 5:** 화면 4곳에 표시를 추가하고 빌드(타입 검사)로 확인한다.

---

### Task 2: 감시 함수 — 인천 출발만

**Files:**
- Modify: `supabase/functions/flight-status-watch/incheonFlights.ts` (`getIncheonFlights` → 출발 목록 1회)
- Modify: `supabase/functions/flight-status-watch/index.ts` (쿼리에서 `departure_airport_code = 'ICN'`, 도착 경로·`allowAnyDay` 단순화)
- Create: `supabase/migrations/20261004010000_remove_incheon_arrival_flight_status.sql`

**Interfaces:**
- Produces: `getIncheonDepartures(serviceKey: string): Promise<IncheonFlightItem[]>`. `findFlight(transport, items, { allowAnyDay })`에서 `allowAnyDay`는 `notifyAlways`일 때만 참이다.
- 마이그레이션: 출발 공항이 인천이 아닌 교통편의 `trip_transport_flight_status` 행을 지운다.

- [ ] **Step 1:** 쿼리를 `.eq('departure_airport_code', INCHEON)`로 좁히고 JS 필터를 지운다. **Step 2:** 도착 목록 호출·`arrivals` 분기를 지운다. **Step 3:** 마이그레이션 작성. **Step 4:** Edge 테스트(어댑터)·eslint 확인.

---

### Task 3: 클라이언트 — 인천 출발만 조회

**Files:**
- Modify: `packages/domains/src/modules/flight-status/useFlightStatuses.ts` (`findProvider`가 출발 공항만 본다, `getIsComplete`에서 도착 공항 제거)
- Modify: `packages/domains/src/modules/flight-status/flightStatus.types.ts` (`GetFlightStatusParams.arrivalAirportCode` 제거)
- Modify: `TransportRealtimeInfoSection.tsx`(웹·앱)·`useTripScheduledFlights.ts`의 쿼리 리터럴에서 `arrivalAirportCode` 제거, 문구 "인천을 지나지 않는 노선"을 "인천에서 출발하지 않는 노선"으로
- Test: `packages/domains/src/modules/flight-status/__tests__/useFlightStatuses.test.ts`

검증 케이스 (제목만):
- `인천에서 출발하고 값이 다 찬 쿼리는 조회할 수 있다`
- `인천 도착편은 조회할 수 없다`
- `인천을 지나지 않으면 조회할 곳이 없다`

- [ ] **Step 1:** 테스트 수정(도착편 케이스 추가)·실패 확인. **Step 2:** 구현. **Step 3:** `pnpm ts-check`·도메인 테스트.

---

### Task 4: 문서

- [ ] `docs/codebase.md`: 감시 대상이 인천 출발편뿐임, 도착편 제거로 호출 절반, 도착 시각 지연 반영 규칙, 인천 출발 목록 명세의 "도착예정시간" 설명이 복사 오류라는 함정을 갱신한다. 기존 "도착편 제거 예정" 문구를 고친다.
- [ ] 메모리 `project-flight-watch-arrival-removal`을 완료로 갱신한다.
