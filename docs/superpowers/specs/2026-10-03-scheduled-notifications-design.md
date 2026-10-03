# 예약 알림 스케줄러의 이름과 구조 바로잡기

이름과 실체가 달라 혼란을 만드는 곳을 정리하고, 교통편 전용이던 예약 테이블을 범용 푸시 스케줄러로 올린다. 기존 설계 문서는 수정하지 않는다.

## 배경

- Edge 함수 `airport-arrival-guidance`가 ①공항 도착 권장시간 계산(`get-guidance`)과 ②모든 예약 푸시의 디스패처(`deliver-due-jobs`)를 겸한다. 탑승 전 알림이 더해져 이름이 하는 일을 대표하지 못한다. 크론도 같은 이름이라 혼동된다.
- 테이블 `scheduled_notification_jobs`는 이름은 범용인데 `trip_transport_id`에 FK로 묶여 교통편 알림만 담을 수 있다.
- 변동 알림(`flight-status-watch`)은 감지 즉시 보내는 방식이고, 예약 알림은 정해진 시각에 보내는 방식이다. 두 방식은 합치지 않는다.

## 결정

1. **디스패처를 별도 Edge 함수로 분리한다.** `dispatch-notifications`. 크론도 같은 이름으로 다시 등록한다. `airport-arrival-guidance`는 화면용 안내 계산(`get-guidance`)만 남긴다.
2. **테이블을 `scheduled_notifications`로 바꾸고 범용화한다.**
   - `trip_transport_id` → `subject_id` (FK 제거). 알림의 대상 식별자이며 의미는 `type`의 핸들러가 안다.
   - `trip_id` 추가 (FK → `trips`, ON DELETE CASCADE). 수신자 범위(여행 멤버)를 행이 직접 가진다.
   - `type`의 CHECK 제약 제거. 종류의 목록은 디스패처의 핸들러 레지스트리가 소유한다.
   - 활성 작업 하나 제약은 `(subject_id, type)` 유일 인덱스로 유지한다.
3. **행에는 문구를 담지 않는다.** 때와 대상만 담고, 내용과 발송 직전 확인(이미 출발, 결항)은 종류별 핸들러가 발송 때 최신 데이터로 한다.
4. **디스패처 구조**: 크론이 매분 깨우면 때가 된 행을 점유하고, `type`에 맞는 핸들러를 부르고, 결과를 기록한다(5·15·30분 재시도). 핸들러는 `(알림 행, 현재 시각) → 보냄 | 건너뜀`이고 실패는 예외로 던진다. 종류가 늘면 핸들러와 행을 만드는 트리거만 더한다.
5. 교통편을 지울 때 FK 연쇄 삭제가 사라지므로 `trip_transports` 삭제 트리거가 `subject_id`가 같은 행을 지운다. 여행을 지울 때는 `trip_id` 연쇄 삭제가 맡는다.
6. 종류 이름(`airport_arrival_guidance`, `boarding_reminder`)과 SQL 예약 함수 이름(`sync_..._job`)은 바꾸지 않는다. 예약 함수는 새 컬럼에 맞게 다시 만든다.

## 이름 정리

| 대상 | 이전 | 이후 |
|---|---|---|
| 테이블 | `scheduled_notification_jobs` | `scheduled_notifications` |
| 디스패처 Edge 함수 | `airport-arrival-guidance`(겸용) | `dispatch-notifications` |
| 크론 | `airport-arrival-guidance` | `dispatch-notifications` |
| 안내 계산 함수 | `airport-arrival-guidance` | `airport-arrival-guidance` (계산만) |

## 영향과 한계

- 이름이 바뀌므로 **DB 푸시 → `dispatch-notifications` 배포 → `airport-arrival-guidance` 배포** 순서로 한다. 그 사이 몇 분 동안 새 크론이 아직 배포되지 않은 함수를 불러 실패할 수 있는데, 그 동안 때가 된 예약이 있으면 몇 분 늦게 나간다.
- 교통편 외 알림은 아직 없다. 범용 컬럼(`subject_id`, `trip_id`)은 생겼고, 문구와 대상을 정하는 일은 핸들러가 한다.
- `payload` 컬럼은 필요한 종류가 생길 때 더한다.

## 검증 기준

- 기존 공항 도착 권장시간 알림과 탑승 전 알림이 이름 변경 전과 같은 결과로 발송된다.
- 교통편을 지우면 그 교통편의 예약 알림이 같이 지워진다.
- 여행을 지우면 그 여행의 예약 알림이 같이 지워진다.
- `airport-arrival-guidance`는 푸시 라이브러리와 예약 테이블을 더 이상 참조하지 않는다.
