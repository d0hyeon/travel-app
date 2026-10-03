-- 예약 알림 테이블을 교통편 전용에서 범용 푸시 스케줄러로 올린다.
-- subject_id 는 알림의 대상 식별자이고 의미는 type 의 핸들러가 안다.
-- trip_id 는 수신자 범위(여행 멤버)를 행이 직접 가진다.
ALTER TABLE "public"."scheduled_notification_jobs" RENAME TO "scheduled_notifications";

ALTER TABLE "public"."scheduled_notifications"
    RENAME COLUMN "trip_transport_id" TO "subject_id";

ALTER TABLE "public"."scheduled_notifications"
    DROP CONSTRAINT IF EXISTS "scheduled_notification_jobs_trip_transport_id_fkey";

ALTER TABLE "public"."scheduled_notifications" ADD COLUMN "trip_id" "uuid";

UPDATE "public"."scheduled_notifications" AS "n"
SET "trip_id" = "t"."trip_id"
FROM "public"."trip_transports" AS "t"
WHERE "t"."id" = "n"."subject_id";

DELETE FROM "public"."scheduled_notifications" WHERE "trip_id" IS NULL;

ALTER TABLE "public"."scheduled_notifications" ALTER COLUMN "trip_id" SET NOT NULL;

ALTER TABLE "public"."scheduled_notifications"
    ADD CONSTRAINT "scheduled_notifications_trip_id_fkey"
    FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;

CREATE INDEX "scheduled_notifications_trip_id_idx"
    ON "public"."scheduled_notifications" ("trip_id");

-- 종류의 목록은 디스패처의 핸들러 레지스트리가 소유한다.
ALTER TABLE "public"."scheduled_notifications"
    DROP CONSTRAINT IF EXISTS "scheduled_notification_jobs_type";

ALTER TABLE "public"."scheduled_notifications"
    RENAME CONSTRAINT "scheduled_notification_jobs_pkey" TO "scheduled_notifications_pkey";
ALTER TABLE "public"."scheduled_notifications"
    RENAME CONSTRAINT "scheduled_notification_jobs_status" TO "scheduled_notifications_status";
ALTER TABLE "public"."scheduled_notifications"
    RENAME CONSTRAINT "scheduled_notification_jobs_attempt_count" TO "scheduled_notifications_attempt_count";

ALTER INDEX "public"."scheduled_notification_jobs_one_active_idx" RENAME TO "scheduled_notifications_one_active_idx";
ALTER INDEX "public"."scheduled_notification_jobs_due_idx" RENAME TO "scheduled_notifications_due_idx";

-- 교통편에 걸려 있던 FK 의 연쇄 삭제를 대신한다.
CREATE OR REPLACE FUNCTION "public"."delete_scheduled_notifications_of_transport"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM "public"."scheduled_notifications" WHERE "subject_id" = OLD."id";
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS "trip_transports_delete_scheduled_notifications" ON "public"."trip_transports";

CREATE TRIGGER "trip_transports_delete_scheduled_notifications"
AFTER DELETE ON "public"."trip_transports"
FOR EACH ROW EXECUTE FUNCTION "public"."delete_scheduled_notifications_of_transport"();

CREATE OR REPLACE FUNCTION "public"."sync_airport_arrival_guidance_job"("p_transport_id" "uuid")
RETURNS void
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    "v_trip_id" "uuid";
    "v_departure_at" timestamp with time zone;
    "v_trip_is_overseas" boolean;
    "v_departure_airport_code" "text";
    "v_is_eligible" boolean := false;
    "v_scheduled_for" timestamp with time zone;
BEGIN
    SELECT
        "t"."trip_id",
        COALESCE("fs"."estimated_at", "t"."departure_at"),
        "tr"."is_overseas",
        "t"."departure_airport_code"
    INTO
        "v_trip_id",
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
        "trip_id",
        "subject_id",
        "type",
        "status",
        "scheduled_for"
    ) VALUES (
        "v_trip_id",
        "p_transport_id",
        'airport_arrival_guidance',
        'pending',
        "v_scheduled_for"
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION "public"."sync_airport_arrival_guidance_job"("uuid") FROM PUBLIC, "anon", "authenticated";

-- 예약 알림 디스패처를 별도 함수로 분리하면서 크론도 같은 이름으로 다시 등록한다.
-- URL 과 service_role 키는 flight-status-watch 크론과 같은 Vault 비밀을 쓴다.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "cron"."job" WHERE "jobname" = 'airport-arrival-guidance') THEN
        PERFORM "cron"."unschedule"('airport-arrival-guidance');
    END IF;
    IF EXISTS (SELECT 1 FROM "cron"."job" WHERE "jobname" = 'dispatch-notifications') THEN
        PERFORM "cron"."unschedule"('dispatch-notifications');
    END IF;
END $$;

SELECT "cron"."schedule"(
    'dispatch-notifications',
    '* * * * *',
    $$
    SELECT "net"."http_post"(
        url := (SELECT "decrypted_secret" FROM "vault"."decrypted_secrets" WHERE "name" = 'project_url')
               || '/functions/v1/dispatch-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer '
                || (SELECT "decrypted_secret" FROM "vault"."decrypted_secrets" WHERE "name" = 'service_role_key')
        ),
        body := jsonb_build_object(
            'now', "to_char"("now"() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        ),
        timeout_milliseconds := 30000
    );
    $$
);
