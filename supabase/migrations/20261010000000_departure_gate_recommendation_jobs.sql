-- 인천 출발 해외 항공편에 권장 도착 30분 전 "지금 가장 여유로운 출국장" 푸시를 예약한다.
-- SQL 은 혼잡 보정을 모르므로 가능한 가장 이른 시각(최대 보정)으로 예약하고, 디스패처 핸들러가 정확한 시각으로 재예약한다.
-- 30 은 출국장 추천 창(REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES)의 사본이며, 보수적 시각이 지난 뒤에는 기존 활성 작업을 유지한다.

CREATE OR REPLACE FUNCTION "public"."sync_departure_gate_recommendation_job"("p_transport_id" "uuid")
RETURNS void
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    "v_lead" interval;
    "v_departure_at" timestamp with time zone;
    "v_trip_is_overseas" boolean;
    "v_departure_airport_code" "text";
    "v_is_eligible" boolean := false;
    "v_scheduled_for" timestamp with time zone;
BEGIN
    SELECT
        "make_interval"(mins => "p"."international_base_buffer_minutes"
            + GREATEST(
                "p"."calm_extra_minutes",
                "p"."normal_extra_minutes",
                "p"."crowded_extra_minutes",
                "p"."very_crowded_extra_minutes"
            )
            + 30)
    INTO "v_lead"
    FROM "public"."airport_arrival_guidance_policies" AS "p"
    WHERE "p"."is_active";

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

    IF FOUND AND "v_lead" IS NOT NULL THEN
        "v_is_eligible" :=
            COALESCE("v_departure_at" > NOW(), false)
            AND COALESCE("v_trip_is_overseas", false)
            AND COALESCE("v_departure_airport_code" = 'ICN', false);
        "v_scheduled_for" := "v_departure_at" - "v_lead";
    END IF;

    IF "v_is_eligible" AND "v_scheduled_for" <= NOW() THEN
        RETURN;
    END IF;

    UPDATE "public"."scheduled_notifications"
    SET
        "status" = 'cancelled',
        "cancelled_at" = NOW(),
        "updated_at" = NOW()
    WHERE "subject_id" = "p_transport_id"
      AND "type" = 'departure_gate_recommendation'
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
        'departure_gate_recommendation',
        'pending',
        "v_scheduled_for"
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION "public"."sync_departure_gate_recommendation_job"("uuid") FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION "public"."sync_departure_gate_recommendation_job_from_transport"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM "public"."sync_departure_gate_recommendation_job"(COALESCE(NEW."id", OLD."id"));
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."sync_departure_gate_recommendation_job_from_flight_status"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD."kind" IS NOT DISTINCT FROM NEW."kind"
           AND OLD."estimated_at" IS NOT DISTINCT FROM NEW."estimated_at"
        THEN
            RETURN NEW;
        END IF;
    END IF;

    PERFORM "public"."sync_departure_gate_recommendation_job"(COALESCE(NEW."transport_id", OLD."transport_id"));
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."sync_departure_gate_recommendation_jobs_from_trip"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM "public"."sync_departure_gate_recommendation_job"("t"."id")
    FROM "public"."trip_transports" AS "t"
    WHERE "t"."trip_id" = NEW."id";
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trip_transports_sync_departure_gate_recommendation_job" ON "public"."trip_transports";

CREATE TRIGGER "trip_transports_sync_departure_gate_recommendation_job"
AFTER INSERT OR UPDATE OR DELETE ON "public"."trip_transports"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_departure_gate_recommendation_job_from_transport"();

DROP TRIGGER IF EXISTS "trip_transport_flight_status_sync_departure_gate_recommendation_job"
    ON "public"."trip_transport_flight_status";

CREATE TRIGGER "trip_transport_flight_status_sync_departure_gate_recommendation_job"
AFTER INSERT OR DELETE OR UPDATE OF "kind", "estimated_at" ON "public"."trip_transport_flight_status"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_departure_gate_recommendation_job_from_flight_status"();

DROP TRIGGER IF EXISTS "trips_sync_departure_gate_recommendation_jobs" ON "public"."trips";

CREATE TRIGGER "trips_sync_departure_gate_recommendation_jobs"
AFTER UPDATE OF "is_overseas" ON "public"."trips"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_departure_gate_recommendation_jobs_from_trip"();

SELECT "public"."sync_departure_gate_recommendation_job"("t"."id")
FROM "public"."trip_transports" AS "t"
LEFT JOIN "public"."trip_transport_flight_status" AS "fs" ON "fs"."transport_id" = "t"."id"
WHERE "t"."type" = 'flight'
  AND COALESCE("fs"."estimated_at", "t"."departure_at") > NOW();
