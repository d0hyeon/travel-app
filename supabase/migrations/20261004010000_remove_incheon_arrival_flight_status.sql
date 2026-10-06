-- 운항 상태 감시는 인천 출발편만 대상이다. 인천 도착편(해외→인천)으로 쌓인 행은
-- 더 갱신되지 않으므로 지운다. 삭제는 안내 예약 재평가 트리거를 거친다.
DELETE FROM "public"."trip_transport_flight_status" AS "fs"
USING "public"."trip_transports" AS "t"
WHERE "t"."id" = "fs"."transport_id"
  AND "t"."departure_airport_code" IS DISTINCT FROM 'ICN';
