-- 공항 도착 안내의 터미널을 탑승권 입력값이 아니라 인천 운항 API 값으로 정한다.
-- terminal 은 인천 API 의 terminalid 원본(P01 · P02 · P03)이다.
-- 예약 자격에서 탑승권 터미널 조건을 빼고 인천 출발 해외편으로 좁힌다.
-- 터미널은 발송 시점에 운항 상태 행에서 확인하므로 예약은 터미널과 무관하다.
ALTER TABLE "public"."trip_transport_flight_status"
    ADD COLUMN IF NOT EXISTS "terminal" "text";

CREATE OR REPLACE FUNCTION "public"."sync_airport_arrival_guidance_job"("p_transport_id" "uuid")
RETURNS void
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    "v_departure_at" timestamp with time zone;
    "v_trip_is_overseas" boolean;
    "v_departure_airport_code" "text";
    "v_is_eligible" boolean := false;
    "v_scheduled_for" timestamp with time zone;
BEGIN
    SELECT
        COALESCE("fs"."estimated_at", "t"."departure_at"),
        "tr"."is_overseas",
        "t"."departure_airport_code"
    INTO
        "v_departure_at",
        "v_trip_is_overseas",
        "v_departure_airport_code"
    FROM "public"."trip_transports" AS "t"
    JOIN "public"."trips" AS "tr" ON "tr"."id" = "t"."trip_id"
    LEFT JOIN "public"."trip_transport_flight_status" AS "fs" ON "fs"."transport_id" = "t"."id"
    WHERE "t"."id" = "p_transport_id"
      AND "t"."type" = 'flight'
      AND COALESCE("fs"."kind", '') <> 'cancelled';

    IF FOUND THEN
        "v_scheduled_for" := (
            "date_trunc"('day', "v_departure_at" AT TIME ZONE 'Asia/Seoul')
            - INTERVAL '1 day'
            + INTERVAL '18 hours'
        ) AT TIME ZONE 'Asia/Seoul';

        -- is_overseas 가 null 이면(계산 전 레코드) 국내로 본다.
        "v_is_eligible" :=
            "v_departure_at" > NOW()
            AND "v_scheduled_for" > NOW()
            AND COALESCE("v_trip_is_overseas", false)
            AND COALESCE("v_departure_airport_code" = 'ICN', false);
    END IF;

    UPDATE "public"."scheduled_notification_jobs"
    SET
        "status" = 'cancelled',
        "cancelled_at" = NOW(),
        "updated_at" = NOW()
    WHERE "trip_transport_id" = "p_transport_id"
      AND "type" = 'airport_arrival_guidance'
      AND "status" IN ('pending', 'processing');

    IF NOT "v_is_eligible" THEN
        RETURN;
    END IF;

    INSERT INTO "public"."scheduled_notification_jobs" (
        "trip_transport_id",
        "type",
        "status",
        "scheduled_for"
    ) VALUES (
        "p_transport_id",
        'airport_arrival_guidance',
        'pending',
        "v_scheduled_for"
    );
END;
$$;

DROP TRIGGER IF EXISTS "trip_transport_tickets_sync_airport_arrival_guidance_job"
    ON "public"."trip_transport_tickets";

DROP FUNCTION IF EXISTS "public"."sync_airport_arrival_guidance_job_from_ticket"();

SELECT "public"."sync_airport_arrival_guidance_job"("id")
FROM "public"."trip_transports"
WHERE "type" = 'flight'
  AND "departure_at" > NOW();
