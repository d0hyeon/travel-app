CREATE OR REPLACE FUNCTION "public"."get_community_trips"(
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
          AND (r.scheduled_date IS NULL OR r.scheduled_date BETWEEN t.start_date AND t.end_date)
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

CREATE OR REPLACE FUNCTION "public"."get_community_trip_routes"(
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
    route_places.places
  FROM trips t
  JOIN routes r ON r.trip_id = t.id
  CROSS JOIN LATERAL (
    SELECT json_agg(
      json_build_object(
        'placeId', pl.id,
        'name', pl.name,
        'address', COALESCE(pl.address, ''),
        'lat', pl.lat,
        'lng', pl.lng
      )
      ORDER BY array_position(r.place_ids, tp.id)
    ) AS places
    FROM trip_places tp
    JOIN places pl ON pl.id = tp.place_id
    WHERE tp.trip_id = t.id
      AND r.place_ids @> ARRAY[tp.id]
  ) route_places
  WHERE t.community_key = p_community_key
    AND (r.scheduled_date IS NULL OR r.scheduled_date BETWEEN t.start_date AND t.end_date)
    AND route_places.places IS NOT NULL
  ORDER BY r.scheduled_date NULLS LAST, r.created_at;
$$;
