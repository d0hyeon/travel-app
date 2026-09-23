CREATE TABLE "public"."airport_arrival_guidance_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "domestic_base_buffer_minutes" integer NOT NULL,
    "international_base_buffer_minutes" integer NOT NULL,
    "calm_max_ratio" numeric NOT NULL,
    "normal_max_ratio" numeric NOT NULL,
    "crowded_max_ratio" numeric NOT NULL,
    "calm_extra_minutes" integer NOT NULL,
    "normal_extra_minutes" integer NOT NULL,
    "crowded_extra_minutes" integer NOT NULL,
    "very_crowded_extra_minutes" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "airport_arrival_guidance_policies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "airport_arrival_guidance_policies_buffers_positive"
        CHECK ("domestic_base_buffer_minutes" > 0 AND "international_base_buffer_minutes" > 0),
    CONSTRAINT "airport_arrival_guidance_policies_ratio_order"
        CHECK ("calm_max_ratio" > 0 AND "calm_max_ratio" < "normal_max_ratio" AND "normal_max_ratio" < "crowded_max_ratio"),
    CONSTRAINT "airport_arrival_guidance_policies_extra_minutes_nonnegative"
        CHECK ("calm_extra_minutes" >= 0 AND "normal_extra_minutes" >= 0 AND "crowded_extra_minutes" >= 0 AND "very_crowded_extra_minutes" >= 0)
);

CREATE UNIQUE INDEX "airport_arrival_guidance_policies_one_active_idx"
    ON "public"."airport_arrival_guidance_policies" ("is_active")
    WHERE "is_active";

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
) VALUES (120, 180, 0.5, 0.75, 1, 0, 15, 30, 45);

-- 기존 여행은 is_overseas 기본값(false)만 저장돼 있었다. 대표 좌표로 과거
-- 해외 판정을 복원해, 다음 교통편 변경 전까지 해외 안내가 누락되지 않게 한다.
UPDATE "public"."trips"
SET "is_overseas" = NOT ("lat" BETWEEN 33 AND 39 AND "lng" BETWEEN 124 AND 132);

CREATE TABLE "public"."airport_congestion_reference_counts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "policy_id" "uuid" NOT NULL REFERENCES "public"."airport_arrival_guidance_policies"("id") ON DELETE CASCADE,
    "source_kind" "text" NOT NULL,
    "airport_code" "text" NOT NULL,
    "terminal" "text" NOT NULL,
    "departure_gate" "text" NOT NULL,
    "reference_passenger_count" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "airport_congestion_reference_counts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "airport_congestion_reference_counts_source_kind"
        CHECK ("source_kind" IN ('forecast', 'realtime', 'domestic')),
    CONSTRAINT "airport_congestion_reference_counts_reference_positive"
        CHECK ("reference_passenger_count" > 0),
    CONSTRAINT "airport_congestion_reference_counts_unique"
        UNIQUE ("policy_id", "source_kind", "airport_code", "terminal", "departure_gate")
);

CREATE TABLE "public"."airport_congestion_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_kind" "text" NOT NULL,
    "airport_code" "text" NOT NULL,
    "terminal" "text" NOT NULL,
    -- 승객예고 API의 selectdate는 실제 날짜가 아니라 D+0/D+1 오프셋이다.
    -- API 요청값과 캐시 키를 같은 의미로 보존한다.
    "snapshot_date" text,
    "observed_at" timestamp with time zone NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "raw_response" "jsonb" NOT NULL,
    "departure_gates" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "airport_congestion_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "airport_congestion_snapshots_source_kind"
        CHECK ("source_kind" IN ('forecast', 'realtime', 'domestic')),
    CONSTRAINT "airport_congestion_snapshots_forecast_offset"
        CHECK (
            ("source_kind" = 'forecast' AND "snapshot_date" IN ('0', '1'))
            OR ("source_kind" <> 'forecast' AND "snapshot_date" IS NULL)
        ),
    CONSTRAINT "airport_congestion_snapshots_expiry_after_observed"
        CHECK ("expires_at" > "observed_at"),
    CONSTRAINT "airport_congestion_snapshots_gates_array"
        CHECK ("jsonb_typeof"("departure_gates") = 'array')
);

CREATE INDEX "airport_congestion_snapshots_lookup_idx"
    ON "public"."airport_congestion_snapshots" ("source_kind", "airport_code", "terminal", "snapshot_date", "expires_at" DESC);

CREATE TABLE "public"."scheduled_notification_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_transport_id" "uuid" NOT NULL REFERENCES "public"."trip_transports"("id") ON DELETE CASCADE,
    "type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "scheduled_for" timestamp with time zone NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "last_error" "text",
    "locked_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "scheduled_notification_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "scheduled_notification_jobs_type"
        CHECK ("type" = 'airport_arrival_guidance'),
    CONSTRAINT "scheduled_notification_jobs_status"
        CHECK ("status" IN ('pending', 'processing', 'delivered', 'failed', 'cancelled')),
    CONSTRAINT "scheduled_notification_jobs_attempt_count"
        CHECK ("attempt_count" BETWEEN 0 AND 3)
);

CREATE UNIQUE INDEX "scheduled_notification_jobs_one_active_idx"
    ON "public"."scheduled_notification_jobs" ("trip_transport_id", "type")
    WHERE "status" IN ('pending', 'processing');

CREATE INDEX "scheduled_notification_jobs_due_idx"
    ON "public"."scheduled_notification_jobs" ("scheduled_for")
    WHERE "status" = 'pending';

ALTER TABLE "public"."airport_arrival_guidance_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."airport_congestion_reference_counts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."airport_congestion_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."scheduled_notification_jobs" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "public"."airport_arrival_guidance_policies" TO "service_role";
GRANT ALL ON TABLE "public"."airport_congestion_reference_counts" TO "service_role";
GRANT ALL ON TABLE "public"."airport_congestion_snapshots" TO "service_role";
GRANT ALL ON TABLE "public"."scheduled_notification_jobs" TO "service_role";

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

CREATE OR REPLACE FUNCTION "public"."sync_airport_arrival_guidance_job_from_transport"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM "public"."sync_airport_arrival_guidance_job"(COALESCE(NEW."id", OLD."id"));
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."sync_airport_arrival_guidance_job_from_ticket"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM "public"."sync_airport_arrival_guidance_job"(COALESCE(NEW."transport_id", OLD."transport_id"));
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."sync_airport_arrival_guidance_jobs_from_trip"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM "public"."sync_airport_arrival_guidance_job"("t"."id")
    FROM "public"."trip_transports" AS "t"
    WHERE "t"."trip_id" = NEW."id";
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."sync_airport_arrival_guidance_job_from_flight_status"()
RETURNS trigger
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM "public"."sync_airport_arrival_guidance_job"(COALESCE(NEW."transport_id", OLD."transport_id"));
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trip_transports_sync_airport_arrival_guidance_job"
AFTER INSERT OR UPDATE OR DELETE ON "public"."trip_transports"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_airport_arrival_guidance_job_from_transport"();

CREATE TRIGGER "trip_transport_tickets_sync_airport_arrival_guidance_job"
AFTER INSERT OR UPDATE OR DELETE ON "public"."trip_transport_tickets"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_airport_arrival_guidance_job_from_ticket"();

CREATE TRIGGER "trips_sync_airport_arrival_guidance_jobs"
AFTER UPDATE OF "is_overseas" ON "public"."trips"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_airport_arrival_guidance_jobs_from_trip"();

-- flight-status-watch 가 checked_at 등 예약과 무관한 컬럼만 갱신해도
-- INSERT OR UPDATE 전체를 걸면 매 실행마다 재평가가 돈다. 예약에 실제로
-- 영향을 주는 kind(결항 여부)·estimated_at(변경 출발 시각)만 본다.
CREATE TRIGGER "trip_transport_flight_status_sync_airport_arrival_guidance_job"
AFTER INSERT OR DELETE OR UPDATE OF "kind", "estimated_at" ON "public"."trip_transport_flight_status"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_airport_arrival_guidance_job_from_flight_status"();
