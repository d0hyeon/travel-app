# 한국공항공사 운항 상태 provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** 도착 시각 추정을 폐기하고 문구로 바꾸며, 한국공항공사 국내선 운항 상태(도착 시각 포함)를 감시·저장·표시한다.

**Architecture:** 감시 함수가 공급원(인천, 한국공항공사)별로 같은 모양의 관측값을 만들고, 알림 판단과 저장은 공통 경로를 쓴다. 클라이언트는 기존처럼 상태 행만 읽고, `applyFlightStatus`가 API 도착 시각이 있으면 쓰고 없으면 지연 분만 알린다.

**Spec:** `docs/superpowers/specs/2026-10-03-korea-airports-flight-status-design.md`

## Global Constraints

- 코드에 주석을 새로 쓰지 않는다(기존 "원본" 주석 유지). 타입 단언을 새로 쓰지 않는다(기존 `as` 유지).
- 터미널은 한국공항공사 소관 편에서 저장하지 않는다(`null`). 게이트는 후속 설계(`korea-airports-gate`)에서 `/info`로 저장한다. 비어 있으면 빈 문자열이 아니라 `null`로 저장한다.
- 인천 API 처리와 알림 판단 규칙은 바꾸지 않는다.
- 공급원 하나의 조회 실패가 다른 공급원을 막지 않는다.
- Edge 테스트는 로컬에 deno가 없어 vitest 어댑터로 실행한다. 마이그레이션은 로컬에서 실행하지 못한다.
- 커밋은 사용자가 요청할 때만 한다.

## Review Focus

1. 한국공항공사 `지연`이지만 변경 시각이 예정과 같으면 지연 알림이 나가지 않는다. (Task 2)
2. 코드셰어 편명으로 등록해도 도착 목록의 짝을 찾는다. (Task 2)
3. 인천발 지연 편의 도착 시각은 바뀌지 않는다. (Task 4)
4. 한국공항공사 소관 도착 편은 API 도착 시각이 입력값을 대신한다. (Task 4)
5. 지원 공항이 여러 곳이어도 안내 문구가 공항 이름을 쉼표로 이어 붙인다. (Task 5)

## 웨이브

```
W1: Task 1 (마이그레이션·타입)  ·  Task 2 (Edge 공급원 모듈)
W2: Task 3 (감시 함수 통합, Task 1·2)  ·  Task 4 (도메인 provider·applyFlightStatus)
W3: Task 5 (화면: 문구·지원 공항 안내)
W4: Task 6 (문서)
```

---

### Task 1: 도착 시각 컬럼

**Files:**
- Create: `supabase/migrations/20261004020000_flight_status_arrival_times.sql`
- Modify: `packages/domains/src/gateways/client/_database.types.ts` (`pnpm gen-types`가 안 되면 손으로 반영하고 배포 전 재생성)

**Interfaces:** `trip_transport_flight_status.arrival_scheduled_at timestamptz NULL`, `arrival_estimated_at timestamptz NULL`.

- [ ] 마이그레이션 작성: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 두 개. 예약 트리거(`UPDATE OF kind, estimated_at`)는 건드리지 않는다.
- [ ] 타입 Row/Insert/Update에 두 컬럼을 추가한다.

### Task 2: Edge 한국공항공사 모듈

**Files:**
- Create: `supabase/functions/flight-status-watch/koreaAirports.ts`
- Test: `supabase/functions/flight-status-watch/koreaAirports.test.ts`

**Interfaces:**
```ts
export const KOREA_AIRPORT_CODES: readonly string[]
export function getIsKoreaAirport(code: string | null): boolean
export function toKoreaAirportsKind(remark: string | null, scheduledAt: string | null, estimatedAt: string | null): string
export function getKoreaAirportsWindow(departureAt: string): { searchday: string; departFrom: string; departTo: string; arrivalFrom: string; arrivalTo: string }
export function getMatchKey(item: { flightid: string; masterflightid: string | null }): string
export interface FlightObservation { kind; scheduledAt; estimatedAt; gate; terminal; arrivalScheduledAt; arrivalEstimatedAt }  // 모두 string | null
export function observeKoreaAirportsFlights(serviceKey: string, transports: ObservedTransport[]): Promise<Map<string, FlightObservation>>
```

검증 케이스 (제목만):
- `결항과 사전결항은 cancelled 이다`
- `회항은 diverted 이다`
- `지연이고 변경 시각이 예정 시각보다 늦으면 delayed 이다`
- `지연인데 변경 시각이 예정 시각과 같으면 scheduled 이다`
- `출발은 departed 이다`
- `수속·탑승 진행 상태는 scheduled 이다`
- `상태가 비어 있으면 scheduled 이다`
- `조회 창은 출발 시각 전후를 시 단위로 넓히고 한국 시각 기준이다`
- `조회 창은 자정을 넘지 않는다`
- `마스터 편명이 있으면 그것으로 짝을 짓는다`
- `도착 목록에서 같은 편을 찾아 도착 시각을 담는다`
- `도착 목록에 없으면 도착 시각은 비운다`
- `도착 목록의 도착 상태이면 kind 가 arrived 가 된다`

- [ ] 테스트 골격 → 실패 확인 → 구현 → 통과(어댑터). 순수 함수와 목록 조회(`fetch` 주입 가능 구조)를 나눠 짝짓기를 네트워크 없이 테스트한다.

### Task 3: 감시 함수 통합

**Files:** Modify `supabase/functions/flight-status-watch/index.ts`

**Interfaces:** 감시 대상 쿼리가 인천 + 한국공항공사 출발 공항을 포함한다. 인천 관측값은 `FlightObservation`으로 변환하고, 한국공항공사 관측값과 합쳐 같은 판단·저장 경로를 쓴다. upsert에 `arrival_scheduled_at`, `arrival_estimated_at`을 추가한다. 한국공항공사 조회 실패는 로그만 남기고 계속한다.

- [ ] 문법 검사와 Edge 어댑터 테스트 통과.

### Task 4: 도메인 provider와 applyFlightStatus

**Files:**
- Create: `packages/domains/src/modules/flight-status/koreaAirportsFlightStatus.provider.ts`
- Modify: `flightStatus.utils.ts`(registry), `flightStatus.types.ts`(`FlightStatus.arrivalScheduledAt?`, `arrivalEstimatedAt?`), `tripFlightStatus.api.ts`(select·매핑), `index.ts`
- Modify: `packages/domains/src/modules/trip-transport/tripTransport.utils.ts`, `tripTransport.types.ts`, `useTripScheduledFlights.ts`
- Test: `__tests__/tripTransport.utils.test.ts`, `__tests__/tripFlightStatus.api.test.ts`, `__tests__/koreaAirportsFlightStatus.provider.test.ts`

**Interfaces:**
```ts
export const koreaAirportsFlightStatusProvider: FlightStatusProvider   // 조회 가능 기간 D-3~D+6
export type ScheduledTripTransport = TripTransport & { departureDelayMinutes?: number }
export function applyFlightStatus(transport, status): ScheduledTripTransport
```
`applyFlightStatus`: 출발 시각은 기존대로. 도착 시각은 `status.arrivalEstimatedAt ?? status.arrivalScheduledAt`이 있으면 그 값, 없으면 입력값 그대로. 도착 시각을 API가 줬으면 `departureDelayMinutes`는 없다. API 도착 시각이 없고 출발이 지연(양수, 결항·회항 제외)이면 `departureDelayMinutes`에 분을 담는다.

검증 케이스 (제목만):
- `API 도착 시각이 있으면 변경 시각을 도착 시각으로 쓴다`
- `API 도착 변경 시각이 없으면 예정 도착 시각을 쓴다`
- `API 도착 시각이 있으면 지연 분을 알리지 않는다`
- `API 도착 시각이 없고 출발이 지연이면 도착 시각은 그대로 두고 지연 분을 알린다`
- `일찍 출발해도 지연 분을 알리지 않는다`
- `결항·회항이면 지연 분을 알리지 않는다`
- `도착 시각이 없는 교통편은 도착 시각을 만들지 않는다`
- `한국공항공사 provider 는 어제부터 6일 뒤까지 조회할 수 있다`
- `한국공항공사 provider 는 지원 공항에서만 고른다`
- `행의 도착 시각을 운항 상태로 옮긴다`

### Task 5: 화면

**Files:** Modify 웹·앱 `TransportCard.tsx`, `TransportSummarySection.tsx`, `TripTransportList.tsx`(지원 공항 이름 이어 붙이기)

- [ ] 카드: "지연 반영" 캡션 → `departureDelayMinutes`가 있으면 "도착 지연 가능". 요약: "출발이 N분 지연돼 도착이 늦어질 수 있어요". 지원 공항 안내는 `join(', ')`.
- [ ] `pnpm ts-check`.

### Task 6: 문서

- [ ] `docs/codebase.md`: 감시 대상(인천 + 한국공항공사), 한국공항공사 API 사실(페이지 100건, 날짜 범위, 짝짓는 키, 게이트·터미널 없음), 도착 시각 정책(추정 폐기와 근거), 호출 한도, 사전결항 처리, 지연 정규화.
- [ ] 메모리에 한국공항공사 provider 결정을 남긴다.
