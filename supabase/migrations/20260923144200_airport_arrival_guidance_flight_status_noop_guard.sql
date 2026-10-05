-- UPDATE OF kind, estimated_at 는 "그 컬럼이 SET 절에 있는가"만 보고,
-- 실제 값이 달라졌는가는 보지 않는다. flight-status-watch 의 upsert 는
-- 상태가 그대로여도 두 컬럼을 항상 다시 쓰므로, 5분마다 트리거가 계속
-- 재평가·재생성을 반복했다. 트리거 함수 안에서 OLD/NEW 를 직접 비교해
-- 실제로 바뀌었을 때만 재평가하도록 고친다.
CREATE OR REPLACE FUNCTION "public"."sync_airport_arrival_guidance_job_from_flight_status"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'UPDATE'
       AND "OLD"."kind" IS NOT DISTINCT FROM "NEW"."kind"
       AND "OLD"."estimated_at" IS NOT DISTINCT FROM "NEW"."estimated_at"
    THEN
        RETURN NEW;
    END IF;

    PERFORM "public"."sync_airport_arrival_guidance_job"(COALESCE(NEW."transport_id", OLD."transport_id"));
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;
