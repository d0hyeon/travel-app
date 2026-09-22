# Airport Arrival Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 터미널이 있는 항공편에 공항 도착 권장 시각을 제공하고, 해외편에는 D-1 18:00 푸시를 보낸다.

**Architecture:** Supabase가 정책·혼잡 스냅샷·예약 알림 작업을 공유 소스 오브 트루스로 소유한다. 엣지 함수는 공항 API·푸시 전달을 담당하고, 도메인 모듈은 정책을 적용해 화면용 안내를 계산한다. 웹·앱은 기존 항공편 카드와 상세 화면에서 같은 안내 결과를 렌더링한다.

**Tech Stack:** Supabase Postgres/Edge Functions/pg_cron, TypeScript, Deno, React Query, Vitest, React 19, React Native/Expo.

**Spec:** `docs/superpowers/specs/2026-09-21-airport-arrival-guidance-design.md`

## Global Constraints

- 국내·해외 판단은 여행 목적지 좌표의 기존 `isOverseas` 규칙을 사용한다.
- 터미널은 탑승권별 값이며, 한 항공편의 입력된 터미널이 하나로 일치할 때만 대상이다.
- 기본 여유는 국내 120분, 국제 180분이며 등급별 추가 여유와 출국장 기준값은 DB 정책이 소유한다.
- 해외편 푸시는 D-1 18:00(Asia/Seoul), 국내선 푸시는 범위 밖이다.
- 미래 도착 시각 계산은 예고 데이터만 사용한다. 실시간 데이터는 도착이 가까운 해외편의 출국장 추천에만 쓴다.
- 순수 정책·예약 로직은 설계 우선 TDD로 구현한다. UI는 빌드와 실제 앱 확인으로 검증한다.

---

## File Structure

- `supabase/migrations/20260922010000_airport_arrival_guidance.sql` — 정책, 기준값, 스냅샷, 알림 작업, RLS, 작업 동기화 SQL 함수·트리거.
- `supabase/migrations/20260922020000_airport_arrival_guidance_cron.sql` — D-1 18:00 작업과 재시도 실행 크론.
- `supabase/functions/airport-arrival-guidance/index.ts` — 공항 API 조회·스냅샷 갱신·작업 점유·푸시 발송.
- `supabase/functions/airport-arrival-guidance/*.ts` — API 응답 정규화, 작업 상태 전이, 푸시 본문.
- `packages/domains/src/modules/airport-arrival-guidance/*` — 정책 타입, 순수 안내 판단, 서버 스냅샷 조회 훅.
- `apps/waylog-web/src/features/trip/trip-transport/*` — 기존 상세·다가오는 교통편 카드의 안내 표시.
- `apps/waylog-app/src/features/trip/trip-transport/*` — 네이티브 상세·다가오는 교통편 카드의 안내 표시.
- `docs/codebase.md` — 새 도메인·인프라 경계 기록.

### Task 0: 인터페이스·검증 케이스 승인 게이트

**Files:**
- Modify: `docs/superpowers/plans/2026-09-22-airport-arrival-guidance.md`

**Produces:** 사용자 승인된 DB·엣지 함수·도메인·화면 공개 계약과 `it.todo` 검증 케이스 제목.

- [ ] **Step 1: 구현 없이 공개 인터페이스를 작성한다.**

  정책·기준값·스냅샷·예약 작업 테이블의 필드와 상태 전이, 엣지 함수 요청·응답, 도메인 입력·출력 타입, 기존 항공편 카드가 받는 안내 표시값을 문서에 적는다.

- [ ] **Step 2: `it.todo` 검증 케이스 제목을 작성한다.**

  국내·국제 기본 여유, 네 혼잡 등급, 터미널 없음·불일치 제외, 결항·출발 후 제외, D-1 18:00 예약, 변경·삭제·터미널 수정에 따른 취소·재예약, 세 번 재시도, 화면 간 동일 결과를 제목으로 확정한다.

- [ ] **Step 3: 사용자에게 인터페이스와 검증 케이스 검토·승인을 요청한다.**

  승인 전에는 Task 1 이후의 실제 테스트 본문, 마이그레이션, 엣지 함수, 제품 코드를 시작하지 않는다.

### Task 1: 정책·스냅샷·예약 작업 DB 모델

**Files:**
- Create: `supabase/migrations/20260922010000_airport_arrival_guidance.sql`

**Produces:** 활성 정책, 출국장 기준값, API 스냅샷, `scheduled_notification_jobs`와 항공편·탑승권 변경을 처리하는 DB 트리거.

- [ ] **Step 1: SQL 계약과 검증 케이스를 먼저 기록한다.**

  정책 기본 행에는 `domestic_base_buffer_minutes = 120`, `international_base_buffer_minutes = 180`, `calm_max_ratio = 0.5`, `normal_max_ratio = 0.75`, `crowded_max_ratio = 1`, 추가 여유 `0/15/30/45`를 넣는다. 기준값은 `source_kind, airport_code, terminal, gate, reference_passenger_count` 조합을 유일하게 한다.

- [ ] **Step 2: 마이그레이션을 구현한다.**

  `airport_arrival_guidance_policies`, `airport_congestion_reference_counts`, `airport_congestion_snapshots`, `scheduled_notification_jobs`를 만든다. 작업 상태는 `pending|processing|delivered|failed|cancelled`만 허용하고, `(trip_transport_id, type)`의 `pending|processing` 행은 하나만 허용하는 부분 유일 인덱스를 둔다. 멤버는 스냅샷·작업을 직접 읽거나 수정하지 못하게 하고 service role만 쓴다.

- [ ] **Step 3: 변경 트리거를 구현한다.**

  `trip_transports` INSERT/UPDATE/DELETE와 `trip_transport_tickets` INSERT/UPDATE/DELETE에서 동기화 함수를 호출한다. 함수는 출발지·시각·터미널·여행 목적지 조건을 재평가해 해외 대상이면 D-1 18:00 작업을 upsert하고, 그렇지 않으면 미발송 작업을 `cancelled`로 바꾼다.

- [ ] **Step 4: 로컬 Supabase DB에 마이그레이션을 적용하고 제약을 확인한다.**

  확인: 동일 항공편의 미완료 작업 중복 삽입이 실패하고, 터미널을 지우면 작업이 취소되며, 국내 여행은 작업이 생기지 않는다.

- [ ] **Step 5: Commit**

  `git commit -m "feat(공항안내): 예약 알림 인프라를 추가한다"`

### Task 2: 공항 데이터·예약 발송 엣지 함수

**Files:**
- Create: `supabase/functions/airport-arrival-guidance/index.ts`
- Create: `supabase/functions/airport-arrival-guidance/congestion.ts`
- Create: `supabase/functions/airport-arrival-guidance/jobState.ts`
- Create: `supabase/functions/airport-arrival-guidance/push.ts`

**Interfaces:**
- Consumes: Task 1 테이블과 정책 행.
- Produces: `getFreshCongestionSnapshot(input)`, `claimScheduledNotificationJob(jobId)`, `toAirportArrivalPushMessage(guidance)`.

- [ ] **Step 1: 순수 함수의 실패 테스트를 작성한다.**

  `jobState`는 pending만 processing으로 점유하고, 세 번 실패하면 failed, 그 전에는 다음 재시도 시각을 5·15·30분 뒤로 반환하는 케이스를 테스트한다. `congestion`은 예고와 실시간 API 응답을 터미널·출국장·승객 수·갱신 시각의 공통 행으로 정규화하는 케이스를 테스트한다.

- [ ] **Step 2: 테스트가 올바르게 실패하는지 실행한다.**

  Deno 테스트 또는 패키지의 Vitest 설정 중 실제 함수가 놓인 환경의 테스트 명령으로 실행하고, 구현 전 import 실패를 확인한다.

- [ ] **Step 3: 최소 구현을 작성한다.**

  API 키는 `DATA_GO_SERVICE_KEY`만 사용한다. 유효한 스냅샷이면 재사용하고, 만료됐으면 해당 API를 호출해 원본·정규화 결과·만료 시각을 저장한다. 작업 실행은 정책·운항 상태·수신자·D+1 예고를 확인하고 유효한 수신자에게만 웹 VAPID/Expo 푸시를 보낸다.

- [ ] **Step 4: 테스트를 통과시키고 실제 API 오류가 빈 푸시로 이어지지 않음을 확인한다.**

- [ ] **Step 5: Commit**

  `git commit -m "feat(공항안내): 공항 안내 발송 함수를 추가한다"`

### Task 3: 예약 작업 크론

**Files:**
- Create: `supabase/migrations/20260922020000_airport_arrival_guidance_cron.sql`

**Consumes:** Task 1의 pending/retry 작업과 Task 2 엣지 함수.

- [ ] **Step 1: 크론 계약을 작성한다.**

  크론은 매분 due 상태의 작업만 엣지 함수에 전달하고, 함수가 작업 점유를 원자적으로 수행한다. 키는 Vault의 `project_url`, `service_role_key`를 재사용한다.

- [ ] **Step 2: 마이그레이션을 구현한다.**

  기존 작업명이 있으면 먼저 해제하고 하나의 `airport-arrival-guidance` 작업을 등록한다. HTTP 요청에는 service role Authorization 헤더와 JSON 본문을 포함한다.

- [ ] **Step 3: 적용 후 cron.job에서 하나의 활성 작업만 존재하는지 확인한다.**

- [ ] **Step 4: Commit**

  `git commit -m "feat(공항안내): 예약 알림 크론을 등록한다"`

### Task 4: 공통 안내 판단 도메인

**Files:**
- Create: `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.types.ts`
- Create: `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.utils.ts`
- Create: `packages/domains/src/modules/airport-arrival-guidance/__tests__/airportArrivalGuidance.utils.test.ts`
- Create: `packages/domains/src/modules/airport-arrival-guidance/index.ts`
- Modify: `packages/domains/src/modules/trip/useTrip.ts`

**Interfaces:**

```ts
export function getAirportArrivalGuidance(input: AirportArrivalGuidanceInput): AirportArrivalGuidance | null
export function getCongestionTier(input: CongestionTierInput): CongestionTier
export function getTripIsOverseas(destinations: Trip['destinations']): boolean
```

- [ ] **Step 1: `it.todo`로 검증 케이스를 나열한다.**

  국제 180분·국내 120분, 네 혼잡 등급, 변경 출발 시각, 결항·출발 후·터미널 없음·스냅샷 없음 제외, 가장 혼잡한 출국장 선택, 목적지 좌표 기반 국내/해외 판단을 각각 한 케이스로 적는다.

- [ ] **Step 2: 한 케이스를 실제 실패 테스트로 바꾼다.**

  예: 기준값 1,000명인 출국장 800명과 국제선 10:00 출발 입력이 06:30 권장 도착을 반환한다고 검증한다.

- [ ] **Step 3: 최소 순수 구현을 작성하고 통과시킨다.**

  `useTrip`은 새 순수 `getTripIsOverseas`를 호출해 기존 동작을 유지한다. 도메인은 네트워크·DB·현재 시각을 직접 읽지 않고 모두 입력으로 받는다.

- [ ] **Step 4: 남은 `it.todo`를 하나씩 실제 테스트로 전환해 전체 테스트를 통과시킨다.**

- [ ] **Step 5: Commit**

  `git commit -m "feat(공항안내): 도착 시각 판단을 추가한다"`

### Task 5: 도메인 조회 경로와 기존 카드 연결

**Files:**
- Create: `packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.api.ts`
- Create: `packages/domains/src/modules/airport-arrival-guidance/useAirportArrivalGuidance.ts`
- Modify: `packages/domains/src/gateways/client/_database.types.ts`
- Modify: `apps/waylog-web/src/features/trip/trip-transport/TransportCard.tsx`
- Modify: `apps/waylog-web/src/features/trip/trip-transport/UpcomingTransportSection.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-transport/TransportCard.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-transport/UpcomingTransportSection.tsx`

- [ ] **Step 1: 조회 훅의 실패 테스트를 작성한다.**

  API 모킹으로 터미널 없는 항공편은 조회를 시작하지 않고, 대상 항공편은 동일한 안내 결과를 반환하는지 검증한다.

- [ ] **Step 2: API·훅을 구현하고 테스트를 통과시킨다.**

  훅은 교통편·여행 목적지·운항 상태·스냅샷을 조합하고 Task 4의 순수 함수만 호출한다.

- [ ] **Step 3: 웹·앱 기존 항공편 카드에 권장 도착 시각을 추가한다.**

  안내가 `null`이면 카드의 기존 레이아웃을 바꾸지 않는다. 새 카드나 새 이동 동작을 만들지 않는다.

- [ ] **Step 4: 웹 빌드와 앱 타입 검사를 실행한다.**

- [ ] **Step 5: Commit**

  `git commit -m "feat(공항안내): 항공편 카드에 도착 안내를 표시한다"`

### Task 6: 상세 화면 안내와 문서 갱신

**Files:**
- Modify: `apps/waylog-web/src/features/trip/trip-transport/TransportRealtimeInfoSection.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-transport/TransportRealtimeInfoSection.tsx`
- Modify: `docs/codebase.md`

- [ ] **Step 1: 상세 화면 표시 조건을 검증한다.**

  해외편은 예고 근거·갱신 시각·가까운 시점의 실시간 출국장 추천을, 국내선은 권장 도착 시각만 보이는지 실제 앱에서 확인할 체크리스트를 작성한다.

- [ ] **Step 2: 안내 섹션을 기존 실시간 운항 정보 근처에 추가한다.**

  결항·터미널 없음·데이터 없음이면 섹션을 렌더링하지 않는다. 문구는 “HH:mm까지 공항 도착을 권장해요”만 사용한다.

- [ ] **Step 3: `docs/codebase.md`에 새 도메인·스냅샷·예약 작업의 소유권을 기록한다.**

- [ ] **Step 4: 전체 테스트, 웹 빌드, 앱 타입 검사와 수동 화면 확인을 실행한다.**

- [ ] **Step 5: Commit**

  `git commit -m "feat(공항안내): 교통편 상세 안내를 추가한다"`

## Final Verification

- [ ] 정책·기준값·스냅샷·작업 상태의 DB 제약과 RLS를 확인한다.
- [ ] 해외 D-1 18:00 예약, 터미널 변경 재예약, 대상 이탈 취소, 세 번 재시도를 확인한다.
- [ ] 국내/국제 기본 여유와 네 혼잡 등급의 단위 테스트를 실행한다.
- [ ] 웹 빌드, 앱 타입 검사, 관련 Vitest를 실행한다.
- [ ] 상세·기본정보 카드에서 같은 권장 시각이 보이고, 안내 제외 조건에는 어떤 안내도 보이지 않음을 확인한다.
