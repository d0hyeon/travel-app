DROP FUNCTION IF EXISTS "public"."get_recommended_place_candidates"("uuid", "text"[]);

CREATE FUNCTION "public"."get_recommended_place_candidates"(
  "p_trip_id" "uuid",
  "p_destinations" "text"[]
)
RETURNS TABLE(
  "place_id" "uuid",
  "category" "text",
  "provider" "text",
  "external_id" "text",
  "name" "text",
  "address" "text",
  "lat" double precision,
  "lng" double precision,
  "photo_urls" "text"[],
  "trip_count" integer,
  "confirmed_count" integer,
  "latest_trip_start_date" "text"
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
  ),
  visible_trip_places AS (
    SELECT
      tp.place_id,
      tp.trip_id,
      tp.category,
      ot.start_date,
      COALESCE(rf.is_confirmed, false) AS is_confirmed
    FROM trip_places tp
    JOIN other_trips ot ON ot.id = tp.trip_id
    LEFT JOIN route_flags rf ON rf.trip_place_id = tp.id
    WHERE NOT COALESCE(rf.is_hidden, false)
  ),
  place_stats AS (
    SELECT
      vtp.place_id,
      mode() WITHIN GROUP (ORDER BY vtp.category) AS category,
      count(DISTINCT vtp.trip_id)::integer AS trip_count,
      count(*) FILTER (WHERE vtp.is_confirmed)::integer AS confirmed_count,
      max(vtp.start_date)::text AS latest_trip_start_date
    FROM visible_trip_places vtp
    GROUP BY vtp.place_id
  )
  SELECT
    ps.place_id,
    ps.category,
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
    ps.trip_count,
    ps.confirmed_count,
    ps.latest_trip_start_date
  FROM place_stats ps
  JOIN places pl ON pl.id = ps.place_id;
$$;

ALTER FUNCTION "public"."get_recommended_place_candidates"("uuid", "text"[]) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_recommended_place_candidates"("uuid", "text"[]) FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."get_recommended_place_candidates"("uuid", "text"[]) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_recommended_place_candidates"("uuid", "text"[]) TO "service_role";
