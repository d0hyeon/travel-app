-- 탑승권에 인쇄된 값이다. 실시간 게이트 변경과는 다른 것이라
-- 외부 API 응답으로 이 컬럼을 덮지 않는다.
-- 세 값 모두 이미지에서 나오므로 image 없는 행에는 담을 것이 없다.

ALTER TABLE "public"."trip_transport_tickets"
  ADD COLUMN IF NOT EXISTS "seat" "text",
  ADD COLUMN IF NOT EXISTS "terminal" "text",
  ADD COLUMN IF NOT EXISTS "gate" "text";
