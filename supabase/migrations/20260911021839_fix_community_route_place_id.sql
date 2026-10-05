-- get_routes_with_places_by_trip_id 가 place_id 로 trip_places.id 를 내주고 있었다.
-- 이 값을 마스터 장소 id 로 믿은 호출부가 내 여행에 담으면
-- trip_places.place_id -> places.id 외래키를 위반한다.
--
-- 순서 계산의 array_position 은 routes.place_ids 가 trip_places.id 배열이므로
-- 그대로 tp.id 를 쓴다. 결과로 내보내는 place_id 만 마스터 id 로 바꾼다.
CREATE OR REPLACE FUNCTION "public"."get_routes_with_places_by_trip_id"("p_trip_id" "uuid")
RETURNS TABLE(
  "route_id" "uuid",
  "route_name" "text",
  "scheduled_date" "date",
  "place_id" "uuid",
  "place_name" "text",
  "place_address" "text",
  "place_lat" double precision,
  "place_lng" double precision,
  "place_order" integer
)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT
    r.id AS route_id,
    r.name AS route_name,
    r.scheduled_date,
    tp.place_id AS place_id,
    pl.name AS place_name,
    pl.address AS place_address,
    pl.lat AS place_lat,
    pl.lng AS place_lng,
    array_position(r.place_ids, tp.id) AS place_order
  FROM routes r
  JOIN trip_places tp ON r.place_ids @> ARRAY[tp.id]
  JOIN places pl ON pl.id = tp.place_id
  WHERE r.trip_id = p_trip_id
  ORDER BY r.scheduled_date, place_order;
$$;
