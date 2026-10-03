# 탑승 전 알림 Implementation Plan

**Goal:** 항공 출발 30분 전, 기차·버스 출발 10분 전에 여행 멤버에게 탑승 준비 푸시를 보낸다.

**Spec:** `docs/superpowers/specs/2026-10-03-boarding-reminder-design.md`

## Global Constraints

- 코드에 주석을 새로 쓰지 않는다. 커밋은 사용자가 요청할 때만 한다.
- 기존 공항 도착 권장시간 알림 동작을 바꾸지 않는다.
- Edge 테스트는 로컬에 deno가 없어 vitest 어댑터로 실행한다. 마이그레이션은 로컬에서 실행하지 못한다.

## 웨이브

```
W1: Task 1 (마이그레이션)  ·  Task 2 (Edge 메시지 순수 함수)
W2: Task 3 (Edge 발송 통합, Task 2)
W3: Task 4 (앱 시트 "탑승 안내" 섹션)  ·  Task 5 (문서)
```

### Task 1: 예약 마이그레이션
- Create `supabase/migrations/20261004030000_boarding_reminder_jobs.sql`: `type` CHECK에 `boarding_reminder` 추가, `sync_boarding_reminder_job`(항공 30분 / 그 외 10분, 결항·이미 지난 예약 제외), `trip_transports`와 `trip_transport_flight_status`(kind·estimated_at 가드) 트리거, 미래 교통편 백필.

### Task 2: 메시지 (TDD)
- Create `supabase/functions/dispatch-notifications/handlers/boardingReminderMessage.ts`(+테스트).
- `toBoardingReminderMessage(input): { title; body }`.
- 검증 케이스: `항공은 탑승 시작 10분 전이라고 알린다`, `항공 제목에 항공사와 도착 도시와 편명을 담는다`, `편명이 없으면 편명 부분을 뺀다`, `기차·버스는 출발 10분 전이라고 알린다`, `기차·버스 제목은 출발지 → 도착지다`.

### Task 3: Edge 통합
- `dispatch-notifications/handlers/boardingReminder.ts`: 교통편 없음·결항이면 취소, 이미 출발했으면 보내지 않고 완료, 발송, 전부 실패하면 재시도(예외). 디스패처 구조는 스케줄러 스펙을 따른다.

### Task 4: 앱 시트
- Modify `SupportedNotificationSheet.tsx`: "탑승 안내" 섹션(항공 30분 전, 버스/기차 10분 전).

### Task 5: 문서
- `docs/codebase.md`에 탑승 전 알림, 예약 종류, 발송 함수 겸용을 적는다.
