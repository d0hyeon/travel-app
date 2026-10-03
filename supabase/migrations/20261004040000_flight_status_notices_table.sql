-- trip_transport_flight_status 는 외부 관측값과 푸시 이력을 한 행에 겸했다.
-- 푸시 이력(이미 알린 상태)을 교통편당 1행의 별도 테이블로 옮긴다.
-- 구 컬럼(last_notified_*)은 새 감시 함수가 배포되어 안정된 뒤 별도 마이그레이션에서 제거한다.
CREATE TABLE "public"."trip_transport_flight_notices" (
    "transport_id" "uuid" NOT NULL,
    "last_notified_kind" "text",
    "last_notified_estimated_at" timestamp with time zone,
    "last_notified_gate" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trip_transport_flight_notices_pkey" PRIMARY KEY ("transport_id"),
    CONSTRAINT "trip_transport_flight_notices_transport_id_fkey"
        FOREIGN KEY ("transport_id")
        REFERENCES "public"."trip_transports"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."trip_transport_flight_notices" OWNER TO "postgres";
ALTER TABLE "public"."trip_transport_flight_notices" ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "public"."trip_transport_flight_notices" TO "service_role";

INSERT INTO "public"."trip_transport_flight_notices" (
    "transport_id", "last_notified_kind", "last_notified_estimated_at", "last_notified_gate"
)
SELECT "transport_id", "last_notified_kind", "last_notified_estimated_at", "last_notified_gate"
FROM "public"."trip_transport_flight_status"
ON CONFLICT ("transport_id") DO NOTHING;
