-- 예약 작업(scheduled_notification_jobs)은 D-1 18:00 처럼 미래 시각에 실행돼야
-- 하고, 재시도도 5·15·30분 뒤로 미뤄진다. 크론은 그 due 시각을 매분 확인해
-- 엣지 함수에 점유·발송을 맡긴다 -- 원자적 점유는 엣지 함수가 한다.
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- 재실행해도 job 이 쌓이지 않게 먼저 지운다.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "cron"."job" WHERE "jobname" = 'airport-arrival-guidance') THEN
        PERFORM "cron"."unschedule"('airport-arrival-guidance');
    END IF;
END $$;

-- 1분 주기. due 작업이 없으면 엣지 함수가 바로 빈 응답을 반환한다.
--
-- URL 과 service_role 키는 Vault 에서 읽는다. flight-status-watch 크론과
-- 같은 project_url·service_role_key 비밀을 재사용한다.
SELECT "cron"."schedule"(
    'airport-arrival-guidance',
    '* * * * *',
    $$
    SELECT "net"."http_post"(
        url := (SELECT "decrypted_secret" FROM "vault"."decrypted_secrets" WHERE "name" = 'project_url')
               || '/functions/v1/airport-arrival-guidance',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer '
                || (SELECT "decrypted_secret" FROM "vault"."decrypted_secrets" WHERE "name" = 'service_role_key')
        ),
        body := jsonb_build_object(
            'action', 'deliver-due-jobs',
            'now', "to_char"("now"() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        ),
        timeout_milliseconds := 30000
    );
    $$
);
