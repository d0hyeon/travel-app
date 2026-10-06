# 운항 상태 테이블의 푸시 컬럼 분리 (설계, 미구현)

이 문서는 설계와 결정만 담는다. 구현은 하지 않았다. 구현 계획은 `docs/superpowers/plans/2026-10-03-flight-status-push-columns-separation.md`.

## 배경

`trip_transport_flight_status`는 교통편당 한 행으로 두 가지를 겸한다.

| 부류 | 컬럼 | 읽는 쪽 |
|---|---|---|
| 외부 관측값 (인천 API가 지금 말하는 값) | `kind`, `scheduled_at`, `estimated_at`, `gate`, `terminal`, `checked_at` | 안내 Edge, 클라이언트(`useFlightStatuses`), 예약 트리거 |
| 관측 이력 (표시용) | `prev_gate` | 클라이언트(`useFlightGateChange`) |
| 푸시 이력 (이미 알린 상태) | `last_notified_kind`, `last_notified_estimated_at`, `last_notified_gate` | `flight-status-watch`만 |

증상:
- 클라이언트가 읽을 수 있는 테이블(멤버 RLS SELECT)에 푸시 내부 상태가 같이 노출된다. 읽는 코드는 없지만 계약상 열려 있다.
- 관측값의 변경 이유(인천 API 스키마, 화면 요구)와 푸시 이력의 변경 이유(알림 정책)가 한 행에 섞여 있다. 감시 범위를 넓힐 때처럼 한쪽을 바꾸면 다른 쪽 영향을 매번 따져야 한다.
- 이 테이블에 걸린 예약 트리거(`UPDATE OF kind, estimated_at` + noop 가드)는 관측값 변화에만 반응해야 한다. 분리 후에도 감시 함수가 매 주기 관측값 전체(`checked_at`·`gate`·`terminal`)를 upsert하므로 이 가드는 계속 필요하다.

`prev_gate`는 푸시 컬럼이 아니다. 마이그레이션 주석대로 "발송 여부와 무관하게 gate 가 바뀔 때마다 직전 값을 보존"하는 표시용 관측 이력이며, 클라이언트가 읽으므로 관측 테이블에 남긴다.

## 결정

1. **푸시 이력 3개 컬럼을 새 테이블로 옮긴다.** `trip_transport_flight_notices` (이름 후보: `trip_transport_flight_notification_state`)
   - 교통편당 1행(PK = `transport_id`, FK → `trip_transports ON DELETE CASCADE`)
   - 컬럼: `last_notified_kind`, `last_notified_estimated_at`, `last_notified_gate`, `updated_at`
   - RLS 활성화, 정책 없음(`service_role`만 접근). 클라이언트에 노출하지 않는다.
2. 관측 테이블에서 `last_notified_*` 3개 컬럼을 제거한다. `prev_gate`는 남긴다.
3. **알림 판단 규칙은 이번 분리에서 바꾸지 않는다.** `getShouldNotify`·`getIsGateChanged`는 그대로, 비교 기준만 새 테이블 값이 된다. 동작이 같아야 안전하게 분리할 수 있다.
4. 쓰기 순서는 "알림 → 푸시 이력 upsert → 관측값 upsert"로 둔다. 비교 기준이 푸시 이력이므로 중간에 죽어도 다음 5분에 같은 판단이 다시 나온다(최소 한 번 발송, 기존과 같은 의미).

## 이전과 이후

| | 이전 | 이후 |
|---|---|---|
| 관측값 + 푸시 이력 | 한 테이블 한 행 | 관측 테이블 + 푸시 이력 테이블 |
| 클라이언트 노출 | 푸시 이력도 SELECT 가능 | 관측값만 |
| watch 쓰기 | upsert 1회 | upsert 2회(푸시 이력, 관측값) |
| watch 읽기 | 직전 행 1회 | 직전 관측 행 + 푸시 이력 행 (`in` 조회 2회) |

## 이번에 하지 않는 것 (후속 후보)

- **알림 발송을 `scheduled_notification_jobs` 큐로 옮기는 안.** 변동을 감지하면 작업을 넣고 발송·재시도(5·15·30분)를 큐가 맡게 하면 푸시 이력 테이블도 사라진다. 그러나 (a) 같은 교통편·유형의 진행 중 작업을 하나만 허용하는 유일 인덱스와 연속 변동의 합치기, (b) 작업이 알림 내용(상태 스냅샷)을 담아야 하는 페이로드 컬럼, (c) `deliver-due-jobs`를 공항 도착 안내 전용에서 `type`별 처리로 일반화해야 하는 점이 있어 의미 변경이 크다. 분리를 먼저 하고 별도로 판단한다.
- **재지연 누락 수정.** 현재 `delayed`로 알린 뒤 `scheduled`로 풀렸다가 같은 시각으로 다시 `delayed`가 되면, 마지막 알림 종류가 `delayed`라서 알리지 않는다. 풀린 시점(비알림 상태)에 `last_notified_kind`와 `last_notified_estimated_at`만 비우면 해결된다. `last_notified_gate`까지 비우면 `getIsGateChanged`가 바로 참이 되어 같은 탑승구 알림이 다시 나가므로 비우지 않는다. 규칙 변경이므로 분리와 한 PR에 섞지 않는다. 분리 후 한 줄 변경으로 가능하다.

## 위험과 완화

| 위험 | 완화 |
|---|---|
| 배포 중 이중 상태(컬럼은 지웠는데 구 함수가 읽음) | 마이그레이션을 두 단계로 나눈다. 1단계: 새 테이블 생성 + 데이터 복사(컬럼은 유지). 함수 배포. 2단계(별도 마이그레이션): 구 컬럼 제거 |
| 복사와 함수 배포 사이에 구 함수가 구 컬럼에 계속 쓰므로 새 테이블이 오래된 값에 머문다 | 함수 배포 직후 차이분을 다시 복사한다(`INSERT ... SELECT ... ON CONFLICT (transport_id) DO UPDATE`). 또는 배포하는 동안 감시 크론을 멈춘다 |
| 복사 누락으로 모든 편이 "처음 보는 지연"으로 보여 알림 재발송 | 1단계에서 `INSERT ... SELECT`로 기존 `last_notified_*`를 그대로 복사하고, 복사 행 수를 검증한다 |
| watch 쓰기 2회 사이의 부분 실패 | 푸시 이력을 먼저 쓴다. 관측 쓰기가 실패해도 다음 주기에 같은 판단이 반복될 뿐 알림이 새로 생기지 않는다 |
| Deno 사본 불일치 | 판단 함수는 건드리지 않으므로 `statusChange.ts`·도메인 원본은 변경 없음 |

## 검증 기준

- 분리 전후로 같은 입력(상태 변화 시퀀스)에 같은 알림이 나간다(회귀 테스트: 기존 `flightStatusNotify.utils` 36개 케이스 유지).
- 새 테이블은 멤버가 SELECT할 수 없다(RLS 정책 없음, 권한은 `service_role`만).
- 관측 테이블에서 `last_notified_*`가 제거된 뒤에도 `useFlightGateChange`(`gate`, `prev_gate`)와 `useFlightStatuses`가 동작한다.
- 복사 직후 첫 감시 주기에 기존에 알린 편이 다시 알림을 받지 않는다.
