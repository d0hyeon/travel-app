# 운항 상태 푸시 컬럼 분리 Implementation Plan (Task 1~3 완료)

> **진행 상태:** Task 1(새 테이블·복사, `20261004040000`)과 Task 2(감시 함수 전환, `noticeState.ts`)를 구현했다. **Task 3(구 컬럼 제거)은 새 함수가 배포되어 한 주기 이상 중복 알림이 없음을 확인한 뒤 별도로 한다** — 같은 푸시에 넣으면 배포 중인 구 함수가 사라진 컬럼을 읽어 알림 이력을 잃고 같은 알림을 다시 보낼 수 있다.

**Goal:** `trip_transport_flight_status`의 푸시 이력 컬럼(`last_notified_*`)을 별도 테이블로 옮겨 관측값과 푸시 이력의 책임을 나눈다.

**Architecture:** 새 1:1 테이블에 푸시 이력을 두고(service_role 전용), `flight-status-watch`가 알림 비교 기준을 그 테이블에서 읽고 쓴다. 알림 판단 규칙은 바꾸지 않는다. 구 컬럼 제거는 배포 순서를 위해 별도 마이그레이션으로 미룬다.

**Spec:** `docs/superpowers/specs/2026-10-03-flight-status-push-columns-separation-design.md`

## Global Constraints

- 알림 판단 규칙(`getShouldNotify`, `getIsGateChanged`, `toNotificationText`)은 이번에 바꾸지 않는다. 도메인 원본 `flightStatusNotify.utils`와 Deno 사본 `statusChange.ts`는 변경 없음.
- `prev_gate`는 관측 테이블에 남긴다(클라이언트가 읽는 표시용 이력).
- 마이그레이션은 두 단계로 나눈다: (1) 테이블 생성 + 데이터 복사, (2) 구 컬럼 제거. 사이에 함수를 배포한다.
- 새 테이블은 RLS 활성화, 정책 없음, `service_role`만 접근.
- 새 컬럼·테이블 변경 후 `pnpm gen-types`로 `_database.types.ts`를 재생성한다(손편집 금지).
- 코드에 주석을 새로 쓰지 않는다. 커밋은 사용자가 요청할 때만 한다.
- 알림 큐 전환과 재지연 누락 수정은 이 플랜의 범위가 아니다(스펙의 "하지 않는 것").

## Review Focus

1. 복사 직후 첫 감시 주기에 이미 알린 편이 재알림되지 않는다(복사 정확성, 배포 중 구 함수가 쓴 차이분 재복사 포함). (Task 1·2)
2. 푸시 이력 쓰기가 성공하고 관측 쓰기가 실패해도 중복 알림이 없다. (Task 2)
3. 구 컬럼 제거 후에도 `useFlightGateChange`·`useFlightStatuses`가 동작한다. (Task 3)
4. 멤버가 새 테이블을 읽을 수 없다. (Task 1)

## 웨이브

```
W1: Task 1 (마이그레이션 1단계 + 타입)
W2: Task 2 (watch 읽기·쓰기 전환)           ← Task 1 이후
W3: Task 3 (마이그레이션 2단계: 구 컬럼 제거 + 타입 + 문서)   ← Task 2 배포 확인 후
```

---

### Task 1: 새 테이블과 데이터 복사

**Files:**
- Create: `supabase/migrations/<timestamp>_flight_status_notices_table.sql`
- Modify: `packages/domains/src/gateways/client/_database.types.ts` (`pnpm gen-types`)

**Interfaces:**
- Produces: 테이블 `trip_transport_flight_notices(transport_id uuid PK, last_notified_kind text, last_notified_estimated_at timestamptz, last_notified_gate text, updated_at timestamptz)`.

- [ ] **Step 1:** 마이그레이션 작성.

```sql
CREATE TABLE "public"."trip_transport_flight_notices" (
    "transport_id" "uuid" NOT NULL,
    "last_notified_kind" "text",
    "last_notified_estimated_at" timestamp with time zone,
    "last_notified_gate" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trip_transport_flight_notices_pkey" PRIMARY KEY ("transport_id"),
    CONSTRAINT "trip_transport_flight_notices_transport_id_fkey"
        FOREIGN KEY ("transport_id")
        REFERENCES "public"."trip_transports"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."trip_transport_flight_notices" OWNER TO "postgres";
ALTER TABLE "public"."trip_transport_flight_notices" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."trip_transport_flight_notices" TO "service_role";

INSERT INTO "public"."trip_transport_flight_notices" (
    "transport_id", "last_notified_kind", "last_notified_estimated_at", "last_notified_gate"
)
SELECT "transport_id", "last_notified_kind", "last_notified_estimated_at", "last_notified_gate"
FROM "public"."trip_transport_flight_status"
ON CONFLICT ("transport_id") DO NOTHING;
```

- [ ] **Step 2:** 마이그레이션 적용 후 복사 행 수가 관측 테이블과 같은지 확인한다: `select (select count(*) from trip_transport_flight_status) a, (select count(*) from trip_transport_flight_notices) b;`
- [ ] **Step 3:** 멤버 권한으로 `select` 시 거부되는지 확인한다(RLS 정책 없음).
- [ ] **Step 4:** `pnpm gen-types` 후 `pnpm ts-check`.

---

### Task 2: watch 읽기·쓰기 전환

**Files:**
- Modify: `supabase/functions/flight-status-watch/index.ts`
- Test: 알림 판단 규칙은 불변이므로 기존 `flightStatusNotify.utils.test.ts`(36개)를 그대로 통과시킨다. 읽기·쓰기 순서는 순수 함수로 추출해 테스트한다.

**Interfaces:**
- Consumes: Task 1의 테이블.
- Produces: `index.ts`가 `previousRows`를 관측 테이블에서(`gate`, `prev_gate`), 푸시 이력을 새 테이블에서 읽고, 알림 후 푸시 이력 → 관측값 순서로 upsert한다.

검증 케이스 (제목만, 순수 헬퍼를 둘 경우):
- `푸시 이력이 없으면 알린 적이 없는 상태로 본다`
- `알림을 보냈으면 푸시 이력을 새 상태로 갱신한다`
- `알림을 못 보냈으면 푸시 이력을 직전 값으로 지킨다`

- [ ] **Step 1:** `previousRows` select에서 `last_notified_*`를 빼고, 새 테이블 조회(`in('transport_id', ids)`)를 추가한다.
- [ ] **Step 2:** `notifiedStatus`를 새 테이블 값으로 만든다.
- [ ] **Step 3:** 루프 끝의 upsert를 둘로 나눈다. 먼저 `trip_transport_flight_notices`(shouldNotify면 새 상태, 아니면 직전 값 유지), 그다음 관측 테이블(`last_notified_*` 제외).
- [ ] **Step 4:** Edge 테스트(어댑터)·문법 검사 통과, 로컬/스테이징에서 감시 1회 실행해 두 테이블이 모두 갱신되는지 확인한다.
- [ ] **Step 5:** 배포하는 동안 `flight-status-watch` 크론을 멈춘다(`cron.unschedule`이 아니라 `cron.alter_job(<jobid>, active := false)`). 순서는 크론 중지 → 마이그레이션(1단계 복사) → 함수 배포 → 크론 재개다. 크론이 멈춘 동안 구 컬럼에 쓰는 주체가 없으므로 복사 이후 차이분이 생기지 않아 재복사가 필요 없다. 재복사(`ON CONFLICT DO UPDATE`)는 함수 배포 이후 새 함수가 쓴 최신 이력을 구 컬럼의 오래된 값으로 덮어쓰므로 하지 않는다.
- [ ] **Step 6:** 한 주기 동안 중복 알림이 없는지 확인한다.

---

### Task 3: 구 컬럼 제거와 문서

**Files:**
- Create: `supabase/migrations/<timestamp>_flight_status_drop_notified_columns.sql`
- Modify: `packages/domains/src/gateways/client/_database.types.ts` (`pnpm gen-types`), `docs/codebase.md`

**Interfaces:** `trip_transport_flight_status`에서 `last_notified_kind`, `last_notified_estimated_at`, `last_notified_gate` 제거.

- [ ] **Step 1:** Task 2 배포로 구 컬럼을 읽는 코드가 없음을 확인한다: `grep -rn "last_notified" supabase packages apps --include=*.ts` 가 새 테이블 사용처만 가리킨다.
- [ ] **Step 2:** `ALTER TABLE ... DROP COLUMN IF EXISTS` 세 개.
- [ ] **Step 3:** `pnpm gen-types`, `pnpm ts-check`, `pnpm test`.
- [ ] **Step 4:** `docs/codebase.md`에서 "관측값과 푸시 이력 두 역할을 겸한다" 설명을 분리 결과로 고치고 새 테이블을 적는다.

## 롤백

- Task 2 이후 문제가 생기면 함수를 이전 버전으로 되돌린다. 구 컬럼이 남아 있는 동안(Task 3 전)은 데이터가 유지된다.
- Task 3 이후에는 구 컬럼이 없으므로 롤백하려면 새 테이블 값으로 컬럼을 되살리는 마이그레이션이 필요하다. 그래서 Task 3은 Task 2가 안정된 뒤에만 한다.
