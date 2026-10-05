-- 한국공항공사 도착 목록에서 가져온 도착지 쪽 예정·변경 시각이다.
-- 인천 API 는 도착지 시각을 주지 않아 인천 출발편은 비어 있다.
-- 안내 예약 트리거는 kind·estimated_at 만 보므로 이 컬럼이 바뀌어도 재평가하지 않는다.
ALTER TABLE "public"."trip_transport_flight_status"
    ADD COLUMN IF NOT EXISTS "arrival_scheduled_at" timestamp with time zone,
    ADD COLUMN IF NOT EXISTS "arrival_estimated_at" timestamp with time zone;
