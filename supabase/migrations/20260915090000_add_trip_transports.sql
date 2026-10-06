-- 여행의 교통편과 구간별 티켓을 담는다.
-- 인천→오사카 같은 구간을 경로에 남기면 도로 경로가 바다를 가로지르므로,
-- 교통 구간을 경계로 경로를 자를 수 있어야 한다. 그 경계의 근거가 이 테이블이다.
--
-- 출발·도착은 places 가 아니라 trip_places 를 참조한다.
-- routes.place_ids 가 trip_places.id 만 받으므로, 경로와 같은 것을 가리켜야
-- "교통편의 출발·도착이 경로에서 인접한가" 를 id 비교만으로 판정할 수 있다.
--
-- 종류별 컬럼(airline/flight_number, provider/service_number)은 모두 nullable 이다.
-- "기차인데 airline 이 있는" 상태는 도메인 타입의 판별 유니온이 막고,
-- DB 에는 CHECK 를 두지 않는다. 종류가 늘 때마다 마이그레이션이 붙기 때문이다.
CREATE TABLE IF NOT EXISTS "public"."trip_transports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "departure_trip_place_id" "uuid" NOT NULL,
    "arrival_trip_place_id" "uuid" NOT NULL,
    "departure_at" timestamp with time zone NOT NULL,
    "arrival_at" timestamp with time zone,
    "departure_timezone" "text",
    "arrival_timezone" "text",
    "airline" "text",
    "flight_number" "text",
    "provider" "text",
    "service_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."trip_transports" OWNER TO "postgres";

ALTER TABLE ONLY "public"."trip_transports"
    ADD CONSTRAINT "trip_transports_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."trip_transports"
    ADD CONSTRAINT "trip_transports_trip_id_fkey" FOREIGN KEY ("trip_id")
    REFERENCES "public"."trips"("id") ON UPDATE CASCADE ON DELETE CASCADE;

-- trip_places 참조는 ON DELETE 를 두지 않는다(NO ACTION). 의도한 잠금이다.
-- 교통편이 참조하는 공항 장소는 삭제가 거부되므로, 교통편이 살아있는 동안
-- 그 출발·도착지가 사라지지 않는다. 반대로 교통편을 지워도 공항 trip_place 는
-- 따라 지우지 않는다 -- 다른 교통편이 같은 공항을 쓰거나 사용자가 그 공항을
-- 일반 일정으로도 쓰는 경우에 의도치 않게 사라지기 때문이다.
ALTER TABLE ONLY "public"."trip_transports"
    ADD CONSTRAINT "trip_transports_departure_trip_place_id_fkey" FOREIGN KEY ("departure_trip_place_id")
    REFERENCES "public"."trip_places"("id") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."trip_transports"
    ADD CONSTRAINT "trip_transports_arrival_trip_place_id_fkey" FOREIGN KEY ("arrival_trip_place_id")
    REFERENCES "public"."trip_places"("id") ON UPDATE CASCADE;

-- 정렬과 알림 계산이 departure_at 기준이다.
CREATE INDEX IF NOT EXISTS "trip_transports_trip_id_departure_at_idx"
    ON "public"."trip_transports" ("trip_id", "departure_at");

ALTER TABLE "public"."trip_transports" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_transports_access" ON "public"."trip_transports"
    USING ("public"."can_access_trip"("trip_id"))
    WITH CHECK ("public"."can_access_trip"("trip_id"));

GRANT ALL ON TABLE "public"."trip_transports" TO "anon";
GRANT ALL ON TABLE "public"."trip_transports" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_transports" TO "service_role";


-- 티켓을 교통편의 jsonb 컬럼이 아니라 별도 테이블로 둔 이유는 동시 편집이다.
-- 일행 각자가 자기 티켓을 올리는 것이 기본 시나리오인데, jsonb 배열이면
-- 두 명이 동시에 올릴 때 한쪽이 덮어써진다.
CREATE TABLE IF NOT EXISTS "public"."trip_transport_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transport_id" "uuid" NOT NULL,
    "member_id" "uuid",
    "images" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."trip_transport_tickets" OWNER TO "postgres";

ALTER TABLE ONLY "public"."trip_transport_tickets"
    ADD CONSTRAINT "trip_transport_tickets_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."trip_transport_tickets"
    ADD CONSTRAINT "trip_transport_tickets_transport_id_fkey" FOREIGN KEY ("transport_id")
    REFERENCES "public"."trip_transports"("id") ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "trip_transport_tickets_transport_id_idx"
    ON "public"."trip_transport_tickets" ("transport_id");

ALTER TABLE "public"."trip_transport_tickets" ENABLE ROW LEVEL SECURITY;

-- trip_id 가 없어 can_access_trip 한 줄로 끝나지 않는다. 교통편을 거쳐 여행에 닿는다.
-- trip_id 를 비정규화해 넣으면 정책이 짧아지지만, 교통편과 티켓의 여행이
-- 어긋날 수 있는 두 번째 진실이 생긴다. 조인을 택한다.
CREATE POLICY "trip_transport_tickets_access" ON "public"."trip_transport_tickets"
    USING (EXISTS (
        SELECT 1 FROM "public"."trip_transports" "t"
        WHERE "t"."id" = "transport_id" AND "public"."can_access_trip"("t"."trip_id")
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."trip_transports" "t"
        WHERE "t"."id" = "transport_id" AND "public"."can_access_trip"("t"."trip_id")
    ));

GRANT ALL ON TABLE "public"."trip_transport_tickets" TO "anon";
GRANT ALL ON TABLE "public"."trip_transport_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_transport_tickets" TO "service_role";
