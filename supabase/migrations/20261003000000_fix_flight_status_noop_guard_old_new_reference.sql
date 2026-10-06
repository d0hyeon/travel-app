-- 직전 마이그레이션이 OLD/NEW 를 "OLD"."kind" 처럼 따옴표로 감싸 plpgsql 트리거
-- 변수가 아닌 테이블 참조로 해석되었고, 교통편 삭제 시
-- `missing FROM-clause entry for table "OLD"` (42P01) 로 실패했다.
-- 따옴표를 제거하고, 가드가 UPDATE 에서만 평가되도록 분리한다.
CREATE OR REPLACE FUNCTION "public"."sync_airport_arrival_guidance_job_from_flight_status"()
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

    PERFORM "public"."sync_airport_arrival_guidance_job"(COALESCE(NEW."transport_id", OLD."transport_id"));
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;
