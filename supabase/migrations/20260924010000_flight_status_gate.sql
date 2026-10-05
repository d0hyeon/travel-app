-- 탑승구 변경도 지연·결항처럼 "직전에 무엇이었는지"가 있어야 알릴지 판단한다.
ALTER TABLE "public"."trip_transport_flight_status"
    ADD COLUMN IF NOT EXISTS "gate" "text",
    ADD COLUMN IF NOT EXISTS "last_notified_gate" "text";
