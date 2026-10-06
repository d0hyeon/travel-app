-- 화면에 "탑승구가 23 → 41 로 변경됐어요"를 보여주려면 이전 탑승구가 필요하다.
-- last_notified_gate 는 알림 발송 여부에 묶여 있어 발송 직후 새 값으로
-- 덮인다 -- 표시용으로 쓰면 크론 한 번만 지나도 대조가 사라진다.
-- prev_gate 는 발송 여부와 무관하게, gate 가 바뀔 때마다 그 직전 값을 그대로 보존한다.
ALTER TABLE "public"."trip_transport_flight_status"
    ADD COLUMN IF NOT EXISTS "prev_gate" "text";
