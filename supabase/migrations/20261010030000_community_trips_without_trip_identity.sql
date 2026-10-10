ALTER TABLE "public"."trips"
  ADD COLUMN "community_key" "uuid" DEFAULT "gen_random_uuid"() NOT NULL;

ALTER TABLE "public"."trips"
  ADD CONSTRAINT "trips_community_key_key" UNIQUE ("community_key");

DROP FUNCTION IF EXISTS "public"."get_trips_by_destination"("text"[], "uuid");
DROP FUNCTION IF EXISTS "public"."get_routes_with_places_by_trip_id"("uuid");

CREATE FUNCTION "public"."get_community_trips"(
  "p_destinations" "text"[],
  "p_exclude_trip_id" "uuid"
)
RETURNS TABLE(
  "community_key" "uuid",
  "destinations" "text"[],
  "nights" integer,
  "preview_coordinates" json
)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    t.community_key,
    ARRAY(SELECT jsonb_array_elements_text(t.destinations)) AS destinations,
    (t.end_date - t.start_date) AS nights,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object('lat', pl.lat, 'lng', pl.lng)
          ORDER BY r.scheduled_date NULLS LAST, r.created_at, array_position(r.place_ids, tp.id)
        )
        FROM routes r
        JOIN trip_places tp ON tp.trip_id = t.id AND r.place_ids @> ARRAY[tp.id]
        JOIN places pl ON pl.id = tp.place_id
        WHERE r.trip_id = t.id
      ),
      '[]'::json
    ) AS preview_coordinates
  FROM trips t
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(t.destinations) d
    WHERE d = ANY(p_destinations)
  )
    AND t.id <> p_exclude_trip_id
  ORDER BY t.start_date DESC;
$$;

CREATE FUNCTION "public"."get_community_trip_routes"(
  "p_community_key" "uuid"
)
RETURNS TABLE(
  "day_number" integer,
  "places" json
)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    r.scheduled_date - t.start_date + 1 AS day_number,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'placeId', pl.id,
            'name', pl.name,
            'address', COALESCE(pl.address, ''),
            'lat', pl.lat,
            'lng', pl.lng
          )
          ORDER BY array_position(r.place_ids, tp.id)
        )
        FROM trip_places tp
        JOIN places pl ON pl.id = tp.place_id
        WHERE tp.trip_id = t.id
          AND r.place_ids @> ARRAY[tp.id]
      ),
      '[]'::json
    ) AS places
  FROM trips t
  JOIN routes r ON r.trip_id = t.id
  WHERE t.community_key = p_community_key
  ORDER BY r.scheduled_date NULLS LAST, r.created_at;
$$;

ALTER FUNCTION "public"."get_community_trips"("text"[], "uuid") OWNER TO "postgres";
ALTER FUNCTION "public"."get_community_trip_routes"("uuid") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_community_trips"("text"[], "uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."get_community_trips"("text"[], "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_community_trips"("text"[], "uuid") TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_community_trip_routes"("uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."get_community_trip_routes"("uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_community_trip_routes"("uuid") TO "service_role";
