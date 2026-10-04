# 여행 멤버 탈퇴(소프트) · 호스트 승계 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (기본값) 또는 superpowers:executing-plans. Steps 는 체크박스(`- [ ]`)로 추적한다.

**Goal:** 멤버가 여행을 나가도 `trip_members` 행과 그 사람의 기록(지출·티켓·메시지)을 지우지 않고 `left_at` 으로만 표시한다.
호스트가 나가면 가장 먼저 합류한 활성 멤버에게 호스트가 넘어가고, 활성 멤버가 0명이 될 때(마지막 호스트가 나갈 때)만 여행이 삭제된다.
탈퇴한 멤버는 UI 에서 "탈퇴한 유저"로 일괄 표시하고, 같은 초대 링크로 다시 들어오면 기록이 복구된다.

**전략:** B (여러 파일·계층, 순서 조율 필요). 테스트 본문은 실행 시점에 A 의 3단계로 채운다.

**Spec:** 별도 스펙 문서 없음. 대화에서 확정된 아래 "설계 결정"이 스펙이다.
관련 선행 작업: 권한 모듈(`packages/domains/src/modules/trip-member/tripPermission.*`, `useTripPermission`) — 이미 존재하며 이 플랜이 정책 표를 바꾼다.

## 설계 결정

| 결정 | 근거 |
| --- | --- |
| 탈퇴 = `trip_members.left_at timestamptz` 설정, 행 삭제 안 함 | 정산·메시지·티켓이 `member_id` 로 걸려 있어 행을 지우면 관계가 깨진다. 재가입 시 기록 복구 불가 |
| `boolean` 이 아닌 `left_at` | 같은 플래그이면서 시점이 남는다. `left_at IS NULL` 이 활성 |
| 접근 판단은 `active_trip_members` 뷰로 일원화 | 행이 남으면 `trip_members` 를 읽는 모든 곳이 탈퇴 행을 걸러야 한다. 하나라도 빠지면 탈퇴자가 접근·알림을 받는다. 뷰로 모으면 누락 지점이 줄어든다 |
| 호스트 승계 규칙 = 가장 먼저 합류한(`created_at`) 활성 멤버 | `prepare_account_deletion` 에 이미 같은 규칙이 있다. 재사용해 일관성 유지 |
| 불변식: `trips.user_id` 는 항상 활성 멤버다 | 호스트는 승계 없이는 나갈 수 없다(`leave_trip` 이 강제). 따라서 "마지막 활성 멤버 = 호스트" |
| 삭제는 마지막 활성 멤버가 나갈 때만. `TripPermission.삭제` 제거 | 호스트라도 타인 데이터를 지울 수 없다. 삭제는 권한이 아니라 "남은 사람이 없음"의 결과 |
| 마지막 멤버 삭제는 클라이언트가 기존 `deleteTrip` 으로 수행 | 사진·티켓 스토리지 정리 로직(`deletePhotosByTripId`, `removeTicketImages`)이 클라이언트에 있다. 서버 RPC 는 `last_member` 를 알리기만 한다 |
| 탈퇴 멤버 이름은 도메인(`*.api.ts`)에서 "탈퇴한 유저"로 변환 | 외부 모델 → 도메인 모델 변환은 어댑터 계층의 책임. UI 가 각자 처리하면 누락·이름 노출이 생긴다 |
| 재가입은 `join_trip` RPC 가 `left_at = NULL` 로 되돌림 | `UNIQUE(trip_id, user_id)` 충돌(23505)을 "이미 멤버"로 무시하는 현재 `joinTrip` 은 탈퇴자를 복구하지 못한다 |

**이번 범위 밖 (보류 확정):** 초대 링크 만료·재발급, 가입 시 링크 검증 일원화, 멤버 내보내기(같은 `left_at` 을 쓰면 되므로 추후 쉽다).

## Global Constraints

- 코드에 주석을 남기지 않는다. 배경은 커밋 메시지로.
- 커밋·푸시·워크트리 생성은 사용자가 요청·허락할 때만 한다. 이 플랜의 커밋 단계는 "사용자 승인 후"다.
- 사용자가 직접 고친 코드는 되돌리지 않는다. 특히 `tripPermission.types.ts` 의 값(`"LEAVE_TRIP"` 등)·키 이름(`탈퇴`)과 `useTripPermission.ts` 의 현재 형태를 유지하고 필요한 만큼만 고친다.
- 한글 키 상수 + 파생 타입(`TripPermission`) 패턴을 유지한다. `can` 접두어를 쓰지 않는다. 타입 단언(`as`)을 쓰지 않는다.
- 변경 파일 단위 ESLint, `pnpm ts-check`, `pnpm test` 가 통과해야 한다. UI(`*.tsx`)는 빌드·실제 화면으로 검증한다.
- 브랜치 단위 500줄 이하 목표. 루트 `feat/trip-member-soft-leave` 아래 Wave 별 작업 브랜치 권장(생성은 승인 후).

## Review Focus

각 줄은 해당 Task 의 검증 케이스로도 들어간다.

1. **탈퇴자 접근 누수** — 탈퇴 후에도 여행 조회·수정, 채팅 푸시, 항공편 알림, 도착 안내, 내 여행 목록에 남는다. (Task 1, 3)
2. **재가입** — 탈퇴한 사람이 같은 초대 링크로 다시 들어오면 아무 일도 안 일어나는(23505 무시) 현재 동작이 남는다. 복구되고 기존 지출·티켓이 다시 보여야 한다. (Task 2, 4)
3. **동시 탈퇴 경합** — 호스트와 마지막 두 번째 멤버가 동시에 나가면 활성 멤버 0명인 여행이 남는다. `trips` 행을 잠가 직렬화해야 한다. (Task 2)
4. **호스트 불변식 위반** — 호스트가 승계 없이 `left_at` 이 찍히면 접근은 `t.user_id` 로 계속 통과한다. `leave_trip` 이 승계 또는 `last_member` 중 하나만 허용해야 한다. (Task 2)
5. **탈퇴자 이름·프로필 노출** — 정산·채팅·티켓 소유자 어디서든 "탈퇴한 유저"여야 하고, 프로필 링크는 비활성이어야 한다. 선택 UI(지출 결제자·참여자, 체크리스트 담당, 티켓 소유자)에는 탈퇴자가 후보로 나오면 안 된다. (Task 3, 5)

## 열린 질문 (실행 전 사용자 결정 필요)

1. **`Allow all for trip_members` 정책** (`schema.sql:1057`, `USING (true) WITH CHECK (true)`)이 운영 DB 에 실제로 존재하는지 확인해야 한다.
   존재하면 `left_at` 을 누구나 바꿀 수 있어 소프트 탈퇴의 의미가 사라진다. 제거를 이 플랜(Task 1)에 포함할지 결정한다. 권장: 확인 후 제거.
2. **`supabase/schema.sql` 갱신 방식** — 덤프 파일이다. 마이그레이션 적용 후 재생성하는 레포 관례를 따를지 확인한다.
3. **SQL 검증 환경** — 로컬 Supabase(`supabase db reset`, Docker) 사용 가능 여부. 불가하면 Task 1·2 의 SQL 시나리오 검증은 스테이징에서 수동으로 한다.

---

## File Map

SQL / 서버
- Create: `supabase/migrations/20261005010000_trip_member_soft_leave.sql` — `left_at`, `active_trip_members` 뷰, 접근 지점 교체. 책임: "누가 활성 멤버인가"의 DB 정의
- Create: `supabase/migrations/20261005020000_trip_member_leave_join_rpc.sql` — `leave_trip`, `join_trip`. 책임: 탈퇴·재가입·승계의 원자적 규칙
- Modify: `supabase/functions/{chat-web-push,airport-arrival-guidance,flight-status-watch}/index.ts`, `supabase/functions/dispatch-notifications/sendPush.ts` — 수신자·권한 조회를 활성 멤버로

도메인 (`packages/domains/src/`)
- Modify: `gateways/client/_database.types.ts` — 재생성(`pnpm gen-types`). 직접 수정 금지
- Modify: `modules/trip-member/tripMember.types.ts` — `TripMember` 에 `hasLeft`·`joinedAt`, `LEFT_MEMBER_NAME`
- Modify: `modules/trip-member/tripMember.api.ts` — 목록 조회(탈퇴 표시 변환), `leaveTrip`, `joinTrip`
- Create: `modules/trip-member/tripMember.utils.ts` — `findHostSuccessor`
- Modify: `modules/trip-member/tripPermission.types.ts`, `tripPermission.utils.ts` — `삭제` 제거, 정책 재정의, `getTripRole` 이 탈퇴자 제외
- Modify: `modules/trip/useTrip.ts`, `modules/trip/useTrips.ts` — `leave` 가 `last_member` 일 때 `deleteTrip` 수행
- Test: `modules/trip-member/__tests__/tripMember.utils.test.ts`, `tripPermission.utils.test.ts`(수정)

웹 UI (`apps/waylog-web/src/features/trip/`)
- Modify: `trip-member/MemberAvatar.tsx`, `trip-member/TripMemberSection.{mobile,desktop}.tsx`
- Modify: `components/TripLeaveButton.tsx`, `components/TripLeavePopMenuItem.tsx`
- Modify: 선택 UI — `trip-expense/ExpenseForm.tsx`, `trip-checklist/TripChecklistForm.tsx`, `trip-transport/transport-ticket/TransportTicketForm.tsx`
- Modify: 표시 UI — `trip-expense/**`, `trip-checklist/TripChecklist.tsx`, 채팅 발신자 표시 (Task 5 에서 grep 으로 확정)
- 앱(`apps/waylog-app`)의 `TripMember` 소비처는 Task 5 에서 grep 으로 확인해 같은 규칙으로 맞춘다.

문서
- Modify: `docs/codebase.md`

## 의존 그래프와 웨이브

```
Task 1 (스키마·뷰·접근 지점)
  └─ Task 2 (RPC)
        ├─ Task 3 (도메인 타입·API·권한)  ← 타입 재생성에 Task 1·2 필요
        └─ Task 6 (엣지 함수)             ← Task 1 의 뷰만 필요. Task 3 과 병렬 가능
              Task 3 → Task 4 (승계 유틸·나가기 흐름)
                         ├─ Task 5 (소비처 UI: 선택·표시)
                         └─ Task 7 (나가기 UI)
                                    └─ Task 8 (문서·최종 검증)
```

| 웨이브 | 태스크 | 비고 |
| --- | --- | --- |
| 1 | Task 1 | 단독 |
| 2 | Task 2 | Task 1 뷰·컬럼 필요 |
| 3 | Task 3, Task 6 | 서로 다른 파일. 병렬 |
| 4 | Task 4 | Task 3 타입 필요 |
| 5 | Task 5, Task 7 | 서로 다른 파일. 병렬 (같은 파일을 만지는 태스크 없음) |
| 6 | Task 8 | 마무리 |

배포 순서: 마이그레이션(Task 1·2) → 엣지 함수(Task 6) → 클라이언트. 컬럼 추가는 하위 호환이라 옛 클라이언트(자기 행을 직접 DELETE 하는 `leaveTrip`)는 그대로 동작한다.

---

### Task 1: 스키마·활성 멤버 뷰·접근 지점 교체

**Files:**
- Create: `supabase/migrations/20261005010000_trip_member_soft_leave.sql`
- Modify(생성 후 재생성): `supabase/schema.sql`

**Interfaces:**
- Produces:
  - 컬럼 `trip_members.left_at timestamptz NULL` (NULL = 활성)
  - 뷰 `public.active_trip_members` = `trip_members` 의 `left_at IS NULL` 행. `security_invoker = true`
  - 아래 객체가 활성 멤버만 인정하도록 재정의: `can_access_trip`, `trips_select` 정책, `get_my_trips`, `get_user_trips`, `get_trips_by_destination`(member_count 는 활성만), `trip_transport_flight_status` 읽기 정책, `prepare_account_deletion`(승계 후보를 활성 멤버로 한정)
  - (열린 질문 1 의 결정에 따라) `Allow all for trip_members` 정책 제거

- [ ] **Step 1: 영향 지점 목록 확정** — `grep -n "trip_members" supabase/schema.sql supabase/migrations/*.sql` 결과를 위 목록과 대조해 누락이 없는지 확인한다. 정책 `trip_messages_member_only` 는 `can_access_trip` 경유이므로 별도 수정 불필요함을 확인한다.
- [ ] **Step 2: 검증 시나리오(SQL) 작성** — 아래 케이스 제목을 `-- scenario:` 형태가 아닌 별도 검증 스크립트(`supabase/tests/` 또는 PR 본문)로 남긴다. 케이스:
  - 활성 멤버는 `can_access_trip` 이 true 다
  - 탈퇴한 멤버는 `can_access_trip` 이 false 다
  - 호스트(`trips.user_id`)는 `trip_members` 행 없이도 접근된다(기존 동작 유지)
  - 탈퇴한 멤버의 `get_my_trips`·`get_user_trips` 에 해당 여행이 나오지 않는다
  - `get_trips_by_destination` 의 member_count 에 탈퇴자가 포함되지 않는다
  - 탈퇴한 멤버는 항공편 상태를 읽을 수 없다
  - `prepare_account_deletion` 은 탈퇴한 멤버를 승계 후보로 고르지 않는다
- [ ] **Step 3: 마이그레이션 작성** — 컬럼 추가 → 뷰 생성 → 위 객체를 `CREATE OR REPLACE`/`DROP POLICY … CREATE POLICY` 로 교체. 기존 정의를 `schema.sql` 에서 그대로 복사해 `trip_members` 참조만 뷰/`left_at IS NULL` 로 바꾼다.
- [ ] **Step 4: 적용·검증** — 로컬(또는 스테이징)에 적용하고 Step 2 시나리오를 실행해 모두 기대대로인지 확인한다.
- [ ] **Step 5: `schema.sql` 갱신** — 열린 질문 2 의 방식으로. 커밋은 사용자 승인 후 (`feat(db/trip-member): 멤버 탈퇴를 left_at 으로 기록하고 접근을 활성 멤버로 한정`).

---

### Task 2: 탈퇴·재가입 RPC

**Files:**
- Create: `supabase/migrations/20261005020000_trip_member_leave_join_rpc.sql`

**Interfaces:**
- Consumes: Task 1 의 `trip_members.left_at`, `active_trip_members`
- Produces:
  - `public.leave_trip(p_trip_id uuid) RETURNS void` — `SECURITY DEFINER`, `SET search_path TO 'public'`
    - 호출자(`auth.uid()`)가 활성 멤버가 아니면 예외 `not_a_member`
    - `trips` 행을 `FOR UPDATE` 로 잠근다
    - 호출자가 호스트이면: 호출자를 제외한 활성 멤버 중 `created_at` 이 가장 이른 사람이 있으면 `trips.user_id` 를 그 사람으로 바꾼다. 없으면 예외 `last_member`(아무것도 바꾸지 않음)
    - 위 통과 시 호출자 행의 `left_at = now()`
  - `public.join_trip(p_trip_id uuid) RETURNS void` — `SECURITY DEFINER`. 행이 없으면 INSERT, 있으면 `left_at = NULL`. 비로그인이면 예외
  - 예외 식별: `RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'last_member'` 등 메시지로 구분(클라이언트가 `error.message` 로 판별)

- [ ] **Step 1: 검증 시나리오 작성** — 케이스:
  - 멤버가 나가면 본인 행에만 `left_at` 이 찍히고 다른 행·기록은 그대로다
  - 호스트가 나가면 가장 먼저 합류한 활성 멤버가 호스트가 되고 호스트 행에 `left_at` 이 찍힌다
  - 승계 후보 선정에서 이미 탈퇴한 멤버는 건너뛴다
  - 활성 멤버가 호스트뿐일 때 호스트가 나가면 `last_member` 예외가 나고 상태는 바뀌지 않는다
  - 활성 멤버가 아닌 사람의 `leave_trip` 은 `not_a_member` 다
  - 호스트와 다른 멤버가 동시에 나가도 활성 멤버 0명 상태로 끝나지 않는다(잠금 직렬화)
  - 탈퇴한 사람이 `join_trip` 하면 `left_at` 이 NULL 이 되고 기존 지출·티켓이 그대로 보인다
  - 처음 `join_trip` 하는 사람은 새 행이 생긴다
  - 이미 활성인 사람의 `join_trip` 은 아무 일도 하지 않는다(에러 아님)
- [ ] **Step 2: 마이그레이션 작성·적용·시나리오 실행**
- [ ] **Step 3: 커밋(승인 후)** `feat(db/trip-member): 탈퇴·재가입 RPC 와 호스트 승계 추가`

---

### Task 3: 도메인 타입·API·권한 정리

**Files:**
- Modify: `packages/domains/src/gateways/client/_database.types.ts` (재생성)
- Modify: `packages/domains/src/modules/trip-member/tripMember.types.ts`, `tripMember.api.ts`
- Modify: `packages/domains/src/modules/trip-member/tripPermission.types.ts`, `tripPermission.utils.ts`
- Test: `packages/domains/src/modules/trip-member/__tests__/tripPermission.utils.test.ts`

**Interfaces:**
- Consumes: Task 1·2 의 컬럼·RPC 가 반영된 DB 타입
- Produces:
  ```ts
  export const LEFT_MEMBER_NAME = '탈퇴한 유저'

  export interface TripMember extends UserProfile {
    tripId: string
    userId: string
    isHost: boolean
    hasLeft: boolean
    joinedAt: string
  }

  export type LeaveTripResult = 'left' | 'last_member'
  export function leaveTrip(tripId: string): Promise<LeaveTripResult>
  export function joinTrip(tripId: string): Promise<void>
  ```
  - `getTripMembersByTripId` 는 탈퇴 멤버를 **포함해** 반환한다. `hasLeft` 인 멤버는 `name = LEFT_MEMBER_NAME`, `profileUrl = null`
  - `TripPermission` 은 `탈퇴`·`초대` 만 남는다. 정책: `host: [탈퇴, 초대]`, `member: [탈퇴]`
  - `getTripRole(members, userId)` 는 `hasLeft` 인 멤버를 역할 없음(`undefined`)으로 본다

- [ ] **Step 1: DB 타입 재생성** — `pnpm gen-types`. `left_at`·`leave_trip`·`join_trip` 이 타입에 나타나는지 확인
- [ ] **Step 2: 검증 케이스 제목을 `it.todo` 로 작성** (`tripPermission.utils.test.ts` 수정):
  - 호스트는 멤버를 초대할 수 있다
  - 호스트는 여행을 탈퇴할 수 있다
  - 멤버는 여행을 탈퇴할 수 있다
  - 멤버는 멤버를 초대할 수 없다
  - 탈퇴한 멤버는 역할이 없다
  - 호스트가 아닌 활성 멤버는 member 역할이다
  - 멤버가 아닌 사용자는 역할이 없다
  (기존 "호스트는 삭제할 수 있다/나갈 수 없다" 류 케이스는 정책 변경으로 삭제·교체. 이는 플랜이 승인한 변경이다)
- [ ] **Step 3: 하나씩 채우고** 올바른 이유로 실패하는지 확인 → 최소 구현으로 통과
- [ ] **Step 4: API 수정** — `tripMember.api.ts`: 조회에 `left_at`·`created_at` 반영과 이름·아바타 변환, `leaveTrip` 이 `rpc('leave_trip')` 호출 후 메시지가 `last_member` 면 `'last_member'`, 아니면 `'left'` 반환(다른 예외는 그대로 throw), `joinTrip` 이 `rpc('join_trip')` 호출. 어댑터 변환은 단위 테스트 대상이 아니다(외부 호출). 변환 로직이 순수하게 분리되면 그 함수에 한해 케이스를 추가한다
- [ ] **Step 5: `pnpm ts-check`** — `TripPermission.삭제` 를 쓰는 곳(Task 7 대상 UI)이 깨질 수 있다. 깨지는 위치를 Task 7 입력으로 기록한다(이 시점의 ts-check 실패는 의도된 것이므로 Task 7 완료 전까지 해당 에러만 허용)
- [ ] **Step 6: 커밋(승인 후)** `feat(domains/trip-member): 탈퇴 멤버를 표시하고 권한 정책을 탈퇴·초대로 정리`

---

### Task 4: 호스트 승계 예측 유틸과 나가기 흐름

**Files:**
- Create: `packages/domains/src/modules/trip-member/tripMember.utils.ts`
- Modify: `packages/domains/src/modules/trip/useTrip.ts`, `packages/domains/src/modules/trip/useTrips.ts`
- Test: `packages/domains/src/modules/trip-member/__tests__/tripMember.utils.test.ts`

**Interfaces:**
- Consumes: Task 3 의 `TripMember`(`hasLeft`, `joinedAt`, `isHost`), `leaveTrip`
- Produces:
  ```ts
  export function findHostSuccessor(members: TripMember[]): TripMember | undefined
  ```
  서버 `leave_trip` 의 승계 규칙(호스트 제외, 활성만, `joinedAt` 오름차순 첫 번째)을 미러링한다. 나가기 확인 문구에서 승계자를 미리 보여주는 용도다. 규칙의 원천은 서버이며 이 함수는 표시용이다.
  `useTrip().leave` / `useTrips().leave`: `leaveTrip` 이 `'last_member'` 를 돌려주면 `deleteTrip` 을 이어서 수행한다(트립 쿼리 무효화는 기존과 동일)

- [ ] **Step 1: `it.todo` 작성** (`tripMember.utils.test.ts`):
  - 호스트를 제외하고 가장 먼저 합류한 멤버가 승계자다
  - 이미 탈퇴한 멤버는 승계자가 될 수 없다
  - 합류 시각이 같으면 목록 앞쪽 멤버가 승계자다(안정 정렬)
  - 호스트 외 활성 멤버가 없으면 승계자가 없다
- [ ] **Step 2: 하나씩 채우고 구현** — 정렬은 `toSorted` 사용
- [ ] **Step 3: `leave` 흐름 수정** — React Query 훅이므로 테스트하지 않는다. 판단 로직이 늘어나면 순수 함수로 분리해 그쪽을 테스트한다
- [ ] **Step 4: 커밋(승인 후)** `feat(domains/trip): 마지막 멤버가 나가면 여행을 삭제하고 승계자를 예측한다`

---

### Task 5: 소비처 UI — 선택 후보와 표시 분리

**Files:** (grep 으로 확정: `grep -rn "useTripMembers" apps/waylog-web/src apps/waylog-app/src`)
- Modify(선택 후보 = 활성만): `trip-expense/ExpenseForm.tsx`, `trip-checklist/TripChecklistForm.tsx`, `trip-transport/transport-ticket/TransportTicketForm.tsx`
- Modify(전체 표시 + "탈퇴한 유저"): `trip-expense/**`, `trip-checklist/TripChecklist.tsx`, 채팅 발신자 표시
- Modify: `trip-member/MemberAvatar.tsx`(탈퇴 멤버는 기본 아바타), `trip-member/TripMemberSection.{mobile,desktop}.tsx`(활성 멤버만, 인원 수도 활성만, 탈퇴 멤버 프로필 링크 없음)

**Interfaces:**
- Consumes: `TripMember.hasLeft`, `LEFT_MEMBER_NAME`(이름은 이미 도메인이 변환해 내려준다)
- Produces: 규칙 — 선택 UI 는 `members.filter((member) => !member.hasLeft)`, 기록을 보여주는 UI 는 전체 `members` 를 쓴다. 단순 필터라 헬퍼로 빼지 않는다.

- [ ] **Step 1: 소비처 목록 확정** — 위 grep 결과를 선택/표시로 분류해 이 Task 의 표를 채운다. 앱(`waylog-app`)에 소비처가 있으면 같은 규칙으로 포함한다
- [ ] **Step 2: 선택 UI 수정** — 기존 기록이 탈퇴 멤버를 참조하는 경우(수정 화면)에도 값이 사라지지 않아야 한다: 이미 선택된 값은 표시 목록에서 유지하고 새 후보에서만 제외한다
- [ ] **Step 3: 표시 UI 수정** — 이름 누락·이름 노출 없음, 프로필 링크 비활성
- [ ] **Step 4: 검증** — 빌드(`pnpm ts-check`)와 화면 확인: 탈퇴 멤버가 낀 여행에서 정산 합계·채팅·티켓이 깨지지 않고 "탈퇴한 유저"로 보인다. 컴포넌트 테스트 인프라가 없으므로 실제 화면으로 확인한다
- [ ] **Step 5: 커밋(승인 후)** `feat(web/trip-member): 탈퇴한 멤버를 후보에서 제외하고 기록에는 탈퇴한 유저로 표시`

---

### Task 6: 엣지 함수 — 수신자·권한을 활성 멤버로

**Files:**
- Modify: `supabase/functions/chat-web-push/index.ts:41`, `airport-arrival-guidance/index.ts:27`, `flight-status-watch/index.ts:130`, `dispatch-notifications/sendPush.ts:17`

**Interfaces:**
- Consumes: Task 1 의 `active_trip_members` 뷰 (또는 `.is('left_at', null)`)
- Produces: 탈퇴한 멤버에게 푸시·알림이 가지 않고, 도착 안내 권한 확인(`canReadTripGuidance`)이 탈퇴자를 거절한다

- [ ] **Step 1: 케이스 정의**(배포 환경 수동 확인 항목으로 PR 에 남긴다):
  - 탈퇴한 멤버는 채팅 푸시를 받지 않는다
  - 탈퇴한 멤버는 항공편 상태 알림을 받지 않는다
  - 탈퇴한 멤버는 도착 안내를 읽을 수 없다
  - 알림 발송(`sendPush`)의 수신자에 탈퇴한 멤버가 없다
- [ ] **Step 2: 4곳 수정 후 함수 배포는 마이그레이션 적용 이후에** (뷰가 먼저 존재해야 한다)
- [ ] **Step 3: 커밋(승인 후)** `fix(functions): 푸시·알림 수신자와 도착 안내 권한을 활성 멤버로 한정`

---

### Task 7: 나가기 UI — 삭제 분기 제거와 승계·삭제 안내

**Files:**
- Modify: `apps/waylog-web/src/features/trip/components/TripLeaveButton.tsx`, `TripLeavePopMenuItem.tsx`
- Modify: `apps/waylog-web/src/features/trip/trip-basic-info/TripBasicInfoContent.mobile.tsx`(호출부 변화가 있을 때만)

**Interfaces:**
- Consumes: `useTripPermission`(`탈퇴` 권한), `useTripMembers`, `findHostSuccessor`, `useTrip().leave`
- Produces: 단일 "나가기" 동작. 확인 문구가 상황에 따라 분기한다
  - 호스트이고 승계자가 있으면: "나가면 {승계자 이름}님이 호스트가 돼요"
  - 호스트이고 승계자가 없으면(마지막 멤버): "마지막 멤버예요. 나가면 여행이 삭제돼요"
  - 일반 멤버: 기존 문구

- [ ] **Step 1: `TripPermission.삭제` 참조 제거**(Task 3 의 ts-check 실패 지점)
- [ ] **Step 2: 문구 분기 구현** — 분기 판단이 3개 이상 겹치면 의도를 이름 붙인 변수로 추출한다(`expression.md`). 컴포넌트는 권한 없는 상태를 입력으로 받지 않고 내부에서 `assert` 로 방어한다
- [ ] **Step 3: 검증** — 빌드와 화면 확인: ① 멤버가 나가면 목록에서 사라지고 기록이 남는다 ② 호스트가 나가면 승계자가 호스트가 된다 ③ 마지막 멤버가 나가면 여행이 삭제된다 ④ 탈퇴한 사람이 초대 링크로 다시 들어오면 복구된다
- [ ] **Step 4: 커밋(승인 후)** `feat(web/trip): 호스트가 나가면 호스트를 승계하고 마지막 멤버일 때만 여행을 삭제한다`

---

### Task 8: 문서와 최종 검증

**Files:**
- Modify: `docs/codebase.md`

- [ ] **Step 1: 문서 갱신** — `trip-member` 모듈 설명(탈퇴 규칙·`active_trip_members`·`LEFT_MEMBER_NAME`·승계 규칙), `TripLeave*` 설명 정정(삭제 분기 제거), 권한 정책 표 변경, 마이그레이션 2건
- [ ] **Step 2: 전체 검증** — `pnpm ts-check`, `pnpm test`, 변경 파일 ESLint
- [ ] **Step 3: 리뷰** — 플랜 작성 직후·브랜치 완료 직후 `architecture-review` 를 작성자와 다른 컨텍스트에서 실행한다(self-approve 금지)

## Self-Review 체크 결과

- **스펙 커버리지:** 소프트 탈퇴(1,3), 접근 일원화(1,6), 호스트 승계(2,4), 마지막 멤버 삭제(2,4), 재가입 복구(2), "탈퇴한 유저" 표시(3,5), 삭제 권한 제거(3,7) — 모두 태스크가 있다.
- **타입 일관성:** `hasLeft`·`joinedAt`·`LEFT_MEMBER_NAME`·`LeaveTripResult`·`findHostSuccessor` 이름은 Task 3 에서 정의하고 4·5·7 에서 동일하게 쓴다.
- **알려진 위험:** `Allow all for trip_members`(열린 질문 1), 승계 규칙의 서버·클라이언트 이중 구현(`findHostSuccessor` 는 표시용, 원천은 `leave_trip`).
