# 예약 알림 스케줄러 정리 Implementation Plan

**Spec:** `docs/superpowers/specs/2026-10-03-scheduled-notifications-design.md`

## Global Constraints
- 코드에 주석을 새로 쓰지 않는다. 변동 알림(`flight-status-watch`)은 건드리지 않는다.
- Edge 테스트는 vitest 어댑터, 마이그레이션은 로컬 실행 불가.
- 커밋·푸시는 모든 작업이 끝난 뒤 한꺼번에 한다.

## 웨이브
```
W1: Task 1 (마이그레이션) · Task 2 (안내 계산 모듈 분리) · Task 3 (디스패처 함수)
W2: Task 4 (타입·문서 정리)
```

### Task 1: 마이그레이션
- Create `20261004025000_scheduled_notifications.sql`: 테이블·컬럼·제약·인덱스 이름 변경, `trip_id` 추가와 백필, FK 교체, `type` CHECK 제거, 교통편 삭제 트리거, 안내 예약 함수 재작성, 크론 재등록.
- Modify `20261004030000_boarding_reminder_jobs.sql`: 새 이름·컬럼으로 맞춘다(CHECK 제거는 위로 이동).

### Task 2: 안내 계산 모듈 분리
- Create `airport-arrival-guidance/guidanceForTransport.ts`: `getGuidanceForTransport(supabase, input)`, 정책 조회. `index.ts`는 `get-guidance`만 서빙한다. `types.ts`에서 `deliver-due-jobs` 제거.

### Task 3: 디스패처 함수
- Create `dispatch-notifications/`: `index.ts`(서빙, 서비스 롤만), `dispatch.ts`(점유·재시도·레지스트리), `sendPush.ts`, `handlers/airportArrivalGuidance.ts`, `handlers/boardingReminder.ts`; `jobState.ts`·`push.ts`·`boardingReminder.ts`와 테스트를 옮긴다.

### Task 4: 타입·문서
- `_database.types.ts`(수동 반영 후 재생성 권고), `docs/codebase.md`, 탑승 알림 스펙의 이름 갱신.
