-- 추천 장소는 남의 여행에서 후보를 모으는데, trips 와 trip_places 의 RLS 가
-- 내가 속한 여행만 통과시켜 결과가 늘 비었다. 클라이언트에서 세 테이블을
-- 조합하던 조회를 SECURITY DEFINER 함수 하나로 옮긴다.
--
-- 점수 계산과 100m 중복 병합은 클라이언트에 남긴다. 순수 로직이라
-- 테스트할 수 있고, 규칙이 바뀔 때마다 DB 를 배포할 이유가 없다.
-- 여기서는 후보 수집과, routes 를 봐야만 알 수 있는 사실만 책임진다.
--
-- trip_place_id 와 place_id 를 모두 내준다. 한쪽만 place_id 로 내보내면
-- 어느 테이블의 키인지 이름으로 구분되지 않아 외래키 위반을 부른다.
CREATE OR REPLACE FUNCTION "public"."get_recommended_place_candidates"(
  "p_trip_id" "uuid",
  "p_destinations" "text"[]
)
RETURNS TABLE(
  "trip_place_id" "uuid",
  "place_id" "uuid",
  "trip_id" "uuid",
  "trip_start_date" "text",
  "category" "text",
  "provider" "text",
  "external_id" "text",
  "name" "text",
  "address" "text",
  "lat" double precision,
  "lng" double precision,
  "photo_urls" "text"[],
  "is_confirmed" boolean,
  "is_hidden" boolean
)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  WITH other_trips AS (
    SELECT t.id, t.start_date
    FROM trips t
    WHERE t.destination = ANY(p_destinations)
      AND t.id <> p_trip_id
  ),
  route_flags AS (
    SELECT
      tp_id AS trip_place_id,
      bool_or(r.place_ids @> ARRAY[tp_id]) AS is_confirmed,
      bool_or(r.hidden_places @> ARRAY[tp_id]) AS is_hidden
    FROM routes r
    JOIN other_trips ot ON ot.id = r.trip_id
    JOIN LATERAL unnest(
      COALESCE(r.place_ids, '{}'::uuid[]) || COALESCE(r.hidden_places, '{}'::uuid[])
    ) AS tp_id ON TRUE
    GROUP BY tp_id
  )
  SELECT
    tp.id AS trip_place_id,
    tp.place_id AS place_id,
    tp.trip_id,
    ot.start_date AS trip_start_date,
    tp.category,
    pl.provider,
    pl.external_id,
    pl.name,
    COALESCE(pl.address, '') AS address,
    pl.lat,
    pl.lng,
    COALESCE(
      ARRAY(
        SELECT ph.url FROM photos ph
        WHERE ph.place_id = pl.id AND ph.is_public = true
      ),
      '{}'::text[]
    ) AS photo_urls,
    COALESCE(rf.is_confirmed, false) AS is_confirmed,
    COALESCE(rf.is_hidden, false) AS is_hidden
  FROM trip_places tp
  JOIN other_trips ot ON ot.id = tp.trip_id
  JOIN places pl ON pl.id = tp.place_id
  LEFT JOIN route_flags rf ON rf.trip_place_id = tp.id;
$$;

ALTER FUNCTION "public"."get_recommended_place_candidates"("p_trip_id" "uuid", "p_destinations" "text"[]) OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_recommended_place_candidates"("p_trip_id" "uuid", "p_destinations" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recommended_place_candidates"("p_trip_id" "uuid", "p_destinations" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recommended_place_candidates"("p_trip_id" "uuid", "p_destinations" "text"[]) TO "service_role";
