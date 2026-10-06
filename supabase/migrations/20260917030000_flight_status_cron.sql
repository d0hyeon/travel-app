-- 기기 백그라운드로는 안 된다. iOS 는 앱을 스와이프로 종료하면 멈추고,
-- 여행 교통편은 평소엔 안 쓰다가 출발 직전에 중요해지는 패턴이라
-- OS 가 가장 홀대하는 조건에 정확히 해당한다.
--
-- cron 은 하나만 돈다. 사용자마다 job 을 만들지 않는다 -- 교통편을
-- 등록하면 감시 창에 들어오고 출발이 지나면 빠진다.
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- 재실행해도 job 이 쌓이지 않게 먼저 지운다.
-- 없는 job 을 지우면 예외가 나므로 존재를 확인한다.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "cron"."job" WHERE "jobname" = 'flight-status-watch') THEN
        PERFORM "cron"."unschedule"('flight-status-watch');
    END IF;
END $$;

-- 5분 주기. 일 288회로 인천공항 1만건/일 한도에 한참 못 미치고,
-- Edge Function 도 월 8,640회로 무료 한도(50만) 안이다.
--
-- URL 과 service_role 키는 Vault 에서 읽는다. 마이그레이션 파일에 키를
-- 박으면 저장소에 남는다. 아래 두 비밀을 먼저 등록해야 job 이 돈다:
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service_role_key>', 'service_role_key');
SELECT "cron"."schedule"(
    'flight-status-watch',
    '*/5 * * * *',
    $$
    SELECT "net"."http_post"(
        url := (SELECT "decrypted_secret" FROM "vault"."decrypted_secrets" WHERE "name" = 'project_url')
               || '/functions/v1/flight-status-watch',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer '
                || (SELECT "decrypted_secret" FROM "vault"."decrypted_secrets" WHERE "name" = 'service_role_key')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
    );
    $$
);
