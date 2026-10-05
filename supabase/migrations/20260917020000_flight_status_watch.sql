-- 지연·결항을 알리려면 "직전에 무엇이었는지"가 있어야 한다.
-- 원본 스케줄(trip_transports)은 사용자가 적은 값이라 덮어쓰지 않는다.
--
-- 발송 이력도 같은 행에 든다. 없으면 지연이 해소될 때까지 5분마다
-- 같은 알림이 나간다. last_notified_kind 가 "이 상태로는 이미 보냈다"를
-- 기억한다.
CREATE TABLE IF NOT EXISTS "public"."trip_transport_flight_status" (
    "transport_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "estimated_at" timestamp with time zone,
    "last_notified_kind" "text",
    "last_notified_estimated_at" timestamp with time zone,
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trip_transport_flight_status_pkey" PRIMARY KEY ("transport_id"),
    CONSTRAINT "trip_transport_flight_status_transport_id_fkey"
        FOREIGN KEY ("transport_id")
        REFERENCES "public"."trip_transports"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."trip_transport_flight_status" OWNER TO "postgres";

ALTER TABLE "public"."trip_transport_flight_status" ENABLE ROW LEVEL SECURITY;

-- 쓰기는 Edge Function(service_role)만 한다. 읽기는 그 교통편이 속한
-- 여행의 멤버에게 연다 -- 상세 화면이 마지막 확인 시각을 보여줄 수 있다.
CREATE POLICY "Members can read flight status"
    ON "public"."trip_transport_flight_status" FOR SELECT TO "authenticated"
    USING (EXISTS (
        SELECT 1
        FROM "public"."trip_transports" "t"
        JOIN "public"."trip_members" "m" ON "m"."trip_id" = "t"."trip_id"
        WHERE "t"."id" = "trip_transport_flight_status"."transport_id"
          AND "m"."user_id" = "auth"."uid"()
    ));

GRANT ALL ON TABLE "public"."trip_transport_flight_status" TO "service_role";
GRANT SELECT ON TABLE "public"."trip_transport_flight_status" TO "authenticated";

-- 감시 대상을 고르는 인덱스. 항공만, 출발이 임박한 것만 본다.
CREATE INDEX IF NOT EXISTS "trip_transports_flight_departure_at_idx"
    ON "public"."trip_transports" ("departure_at")
    WHERE "type" = 'flight' AND "airline_code" IS NOT NULL;
