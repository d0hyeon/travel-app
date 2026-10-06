-- 탑승 전 알림: 항공은 출발 30분 전, 기차·버스는 출발 10분 전.
-- 공항 도착 권장시간 알림과 같은 scheduled_notifications 테이블을 쓴다.

CREATE OR REPLACE FUNCTION "public"."sync_boarding_reminder_job"("p_transport_id" "uuid")
RETURNS void
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    "v_trip_id" "uuid";
    "v_departure_at" timestamp with time zone;
    "v_lead" interval;
    "v_scheduled_for" timestamp with time zone;
    "v_is_eligible" boolean := false;
BEGIN
    SELECT
        "t"."trip_id",
        COALESCE("fs"."estimated_at", "fs"."scheduled_at", "t"."departure_at"),
        CASE WHEN "t"."type" = 'flight' THEN INTERVAL '30 minutes' ELSE INTERVAL '10 minutes' END
    INTO
        "v_trip_id",
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
        "trip_id",
        "subject_id",
        "type",
        "status",
        "scheduled_for"
    ) VALUES (
        "v_trip_id",
        "p_transport_id",
        'boarding_reminder',
        'pending',
        "v_scheduled_for"
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION "public"."sync_boarding_reminder_job"("uuid") FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION "public"."sync_boarding_reminder_job_from_transport"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM "public"."sync_boarding_reminder_job"(COALESCE(NEW."id", OLD."id"));
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

-- flight-status-watch 가 checked_at·gate 처럼 예약과 무관한 컬럼만 갱신해도
-- 매번 재평가하지 않도록 예약에 영향을 주는 kind·시각 변화만 본다.
CREATE OR REPLACE FUNCTION "public"."sync_boarding_reminder_job_from_flight_status"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD."kind" IS NOT DISTINCT FROM NEW."kind"
           AND OLD."estimated_at" IS NOT DISTINCT FROM NEW."estimated_at"
           AND OLD."scheduled_at" IS NOT DISTINCT FROM NEW."scheduled_at"
        THEN
            RETURN NEW;
        END IF;
    END IF;

    PERFORM "public"."sync_boarding_reminder_job"(COALESCE(NEW."transport_id", OLD."transport_id"));
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trip_transports_sync_boarding_reminder_job" ON "public"."trip_transports";

CREATE TRIGGER "trip_transports_sync_boarding_reminder_job"
AFTER INSERT OR UPDATE OR DELETE ON "public"."trip_transports"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_boarding_reminder_job_from_transport"();

DROP TRIGGER IF EXISTS "trip_transport_flight_status_sync_boarding_reminder_job"
    ON "public"."trip_transport_flight_status";

CREATE TRIGGER "trip_transport_flight_status_sync_boarding_reminder_job"
AFTER INSERT OR DELETE OR UPDATE OF "kind", "estimated_at", "scheduled_at" ON "public"."trip_transport_flight_status"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_boarding_reminder_job_from_flight_status"();

SELECT "public"."sync_boarding_reminder_job"("id")
FROM "public"."trip_transports"
WHERE "departure_at" > NOW();
