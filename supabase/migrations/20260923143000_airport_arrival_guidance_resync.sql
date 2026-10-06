-- 20260922010000 을 이미 적용한 뒤 같은 파일을 계속 고쳤다. Supabase 는
-- 파일 내용이 아니라 버전 번호로만 적용 여부를 추적해 재실행되지 않으므로,
-- 그 사이 바뀐 정의를 새 버전으로 다시 밀어 넣는다. 모든 문은 여러 번
-- 실행해도 안전하도록(idempotent) 작성한다. 기존 데이터는 건드리지 않는다.

-- 정책 기본 행이 없으면 넣는다(이미 있으면 그대로 둔다).
INSERT INTO "public"."airport_arrival_guidance_policies" (
    "domestic_base_buffer_minutes",
    "international_base_buffer_minutes",
    "calm_max_ratio",
    "normal_max_ratio",
    "crowded_max_ratio",
    "calm_extra_minutes",
    "normal_extra_minutes",
    "crowded_extra_minutes",
    "very_crowded_extra_minutes"
)
SELECT 120, 180, 0.5, 0.75, 1, 0, 15, 30, 45
WHERE NOT EXISTS (SELECT 1 FROM "public"."airport_arrival_guidance_policies");

CREATE OR REPLACE FUNCTION "public"."sync_airport_arrival_guidance_job"("p_transport_id" "uuid")
RETURNS void
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    "v_departure_at" timestamp with time zone;
    "v_trip_is_overseas" boolean;
    "v_is_eligible" boolean := false;
    "v_terminal_count" integer := 0;
    "v_ticket_count" integer := 0;
    "v_blank_terminal_count" integer := 0;
    "v_scheduled_for" timestamp with time zone;
BEGIN
    SELECT
        COALESCE("fs"."estimated_at", "t"."departure_at"),
        "tr"."is_overseas",
        COUNT("tt"."id"),
        COUNT(*) FILTER (WHERE NULLIF(BTRIM("tt"."terminal"), '') IS NULL),
        COUNT(DISTINCT NULLIF(BTRIM("tt"."terminal"), ''))
    INTO
        "v_departure_at",
        "v_trip_is_overseas",
        "v_ticket_count",
        "v_blank_terminal_count",
        "v_terminal_count"
    FROM "public"."trip_transports" AS "t"
    JOIN "public"."trips" AS "tr" ON "tr"."id" = "t"."trip_id"
    LEFT JOIN "public"."trip_transport_tickets" AS "tt" ON "tt"."transport_id" = "t"."id"
    LEFT JOIN "public"."trip_transport_flight_status" AS "fs" ON "fs"."transport_id" = "t"."id"
    WHERE "t"."id" = "p_transport_id"
      AND "t"."type" = 'flight'
      AND COALESCE("fs"."kind", '') <> 'cancelled'
    GROUP BY "t"."departure_at", "fs"."estimated_at", "tr"."is_overseas";

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
            AND "v_ticket_count" > 0
            AND "v_blank_terminal_count" = 0
            AND "v_terminal_count" = 1;
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

-- flight-status-watch 가 checked_at 등 예약과 무관한 컬럼만 갱신해도
-- INSERT OR UPDATE 전체를 걸면 매 실행마다 재평가가 돈다. 예약에 실제로
-- 영향을 주는 kind(결항 여부)·estimated_at(변경 출발 시각)만 본다.
DROP TRIGGER IF EXISTS "trip_transport_flight_status_sync_airport_arrival_guidance_job"
    ON "public"."trip_transport_flight_status";

CREATE TRIGGER "trip_transport_flight_status_sync_airport_arrival_guidance_job"
AFTER INSERT OR DELETE OR UPDATE OF "kind", "estimated_at" ON "public"."trip_transport_flight_status"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_airport_arrival_guidance_job_from_flight_status"();

DROP TRIGGER IF EXISTS "trips_sync_airport_arrival_guidance_jobs" ON "public"."trips";

CREATE TRIGGER "trips_sync_airport_arrival_guidance_jobs"
AFTER UPDATE OF "is_overseas" ON "public"."trips"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_airport_arrival_guidance_jobs_from_trip"();
