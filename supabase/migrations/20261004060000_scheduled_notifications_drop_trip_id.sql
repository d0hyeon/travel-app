-- 스케줄러 테이블에서 trip 도메인 지식을 뺀다. 수신자 범위는 핸들러가 subject_id 의 원본에서 얻는다.

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

        "v_is_eligible" :=
            "v_departure_at" > NOW()
            AND "v_scheduled_for" > NOW()
            AND COALESCE("v_trip_is_overseas", false)
            AND COALESCE("v_departure_airport_code" = 'ICN', false);
    END IF;

    UPDATE "public"."scheduled_notifications"
    SET
        "status" = 'cancelled',
        "cancelled_at" = NOW(),
        "updated_at" = NOW()
    WHERE "subject_id" = "p_transport_id"
      AND "type" = 'airport_arrival_guidance'
      AND "status" IN ('pending', 'processing');

    IF NOT "v_is_eligible" THEN
        RETURN;
    END IF;

    INSERT INTO "public"."scheduled_notifications" (
        "subject_id",
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

REVOKE EXECUTE ON FUNCTION "public"."sync_airport_arrival_guidance_job"("uuid") FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION "public"."sync_boarding_reminder_job"("p_transport_id" "uuid")
RETURNS void
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    "v_departure_at" timestamp with time zone;
    "v_lead" interval;
    "v_scheduled_for" timestamp with time zone;
    "v_is_eligible" boolean := false;
BEGIN
    SELECT
        COALESCE("fs"."estimated_at", "fs"."scheduled_at", "t"."departure_at"),
        CASE WHEN "t"."type" = 'flight' THEN INTERVAL '30 minutes' ELSE INTERVAL '10 minutes' END
    INTO
        "v_departure_at",
        "v_lead"
    FROM "public"."trip_transports" AS "t"
    LEFT JOIN "public"."trip_transport_flight_status" AS "fs" ON "fs"."transport_id" = "t"."id"
    WHERE "t"."id" = "p_transport_id"
      AND COALESCE("fs"."kind", '') <> 'cancelled';

    IF FOUND THEN
        "v_scheduled_for" := "v_departure_at" - "v_lead";
        "v_is_eligible" := "v_scheduled_for" > NOW();
    END IF;

    UPDATE "public"."scheduled_notifications"
    SET
        "status" = 'cancelled',
        "cancelled_at" = NOW(),
        "updated_at" = NOW()
    WHERE "subject_id" = "p_transport_id"
      AND "type" = 'boarding_reminder'
      AND "status" IN ('pending', 'processing');

    IF NOT "v_is_eligible" THEN
        RETURN;
    END IF;

    INSERT INTO "public"."scheduled_notifications" (
        "subject_id",
        "type",
        "status",
        "scheduled_for"
    ) VALUES (
        "p_transport_id",
        'boarding_reminder',
        'pending',
        "v_scheduled_for"
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION "public"."sync_boarding_reminder_job"("uuid") FROM PUBLIC, "anon", "authenticated";

ALTER TABLE "public"."scheduled_notifications" DROP COLUMN IF EXISTS "trip_id";
