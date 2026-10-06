DROP FUNCTION IF EXISTS "public"."get_explored_places"("date");

CREATE FUNCTION "public"."get_explored_places"("since_date" "date" DEFAULT NULL::"date") RETURNS TABLE("place_id" "uuid", "name" "text", "address" "text", "lat" double precision, "lng" double precision, "visitor_count" bigint, "last_saved_at" timestamp with time zone, "destinations" "jsonb", "categories" "jsonb", "thumbnail_url" "text", "total_trips" bigint, "photo_count" bigint, "post_count" bigint, "score" double precision)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  WITH filtered_trips AS (
    SELECT id, destinations
    FROM trips
    WHERE since_date IS NULL OR end_date >= since_date
  ),
  route_places AS (
    SELECT
      r.trip_id,
      tp.place_id,
      tp.category,
      tp.created_at
    FROM routes r
    JOIN filtered_trips t ON r.trip_id = t.id
    JOIN LATERAL unnest(r.place_ids) AS tp_id ON TRUE
    JOIN trip_places tp ON tp.id = tp_id
    WHERE tp.category IS DISTINCT FROM 'transit'
  ),
  trip_place_set AS (
    SELECT DISTINCT trip_id, place_id, category
    FROM route_places
  ),
  visit_counts AS (
    SELECT place_id, count(DISTINCT trip_id) AS visitor_count
    FROM trip_place_set
    GROUP BY place_id
  ),
  last_saves AS (
    SELECT place_id, max(created_at) AS last_saved_at
    FROM route_places
    GROUP BY place_id
  ),
  place_destinations AS (
    SELECT
      rp.place_id,
      jsonb_agg(DISTINCT dest) FILTER (WHERE dest IS NOT NULL) AS destinations
    FROM trip_place_set rp
    JOIN filtered_trips t ON rp.trip_id = t.id
    JOIN LATERAL jsonb_array_elements_text(t.destinations::jsonb) AS dest ON TRUE
    GROUP BY rp.place_id
  ),
  place_categories AS (
    SELECT place_id, jsonb_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL) AS categories
    FROM trip_place_set
    GROUP BY place_id
  ),
  photo_counts AS (
    SELECT place_id, count(*) AS photo_count
    FROM photos
    WHERE is_public = true
      AND place_id IN (SELECT place_id FROM visit_counts)
    GROUP BY place_id
  ),
  post_counts AS (
    SELECT pl.place_id, count(DISTINCT p.id) AS post_count
    FROM post_locations pl
    JOIN posts p ON p.id = pl.post_id
    WHERE p.visibility = 'PUBLIC'
      AND pl.place_id IN (SELECT place_id FROM visit_counts)
    GROUP BY pl.place_id
  ),
  thumbnails AS (
    SELECT place_id, url
    FROM (
      SELECT place_id, url, row_number() OVER (PARTITION BY place_id) AS rn
      FROM (
        SELECT ph.place_id, ph.url
        FROM photos ph
        WHERE ph.is_public = true
          AND ph.place_id IN (SELECT place_id FROM visit_counts)
      ) all_photos
    ) ranked
    WHERE rn = 1
  ),
  total AS (
    SELECT count(DISTINCT trip_id) AS total_trips FROM route_places
  ),
  score_params AS (
    SELECT
      NULLIF(max(vc.visitor_count), 0)::DOUBLE PRECISION AS max_visitor,
      NULLIF(max(COALESCE(pc.photo_count, 0)), 0)::DOUBLE PRECISION AS max_photo,
      NULLIF(max(COALESCE(po.post_count, 0)), 0)::DOUBLE PRECISION AS max_post
    FROM visit_counts vc
    LEFT JOIN photo_counts pc ON pc.place_id = vc.place_id
    LEFT JOIN post_counts po ON po.place_id = vc.place_id
  )
  SELECT
    p.id AS place_id,
    p.name,
    COALESCE(p.address, '') AS address,
    p.lat,
    p.lng,
    vc.visitor_count,
    ls.last_saved_at,
    COALESCE(pd.destinations, '[]'::jsonb) AS destinations,
    COALESCE(pc2.categories, '[]'::jsonb) AS categories,
    t2.url AS thumbnail_url,
    (SELECT total_trips FROM total) AS total_trips,
    COALESCE(phc.photo_count, 0) AS photo_count,
    COALESCE(poc.post_count, 0) AS post_count,
    (
      COALESCE(vc.visitor_count::DOUBLE PRECISION / sp.max_visitor, 0) * 0.6 +
      COALESCE(phc.photo_count::DOUBLE PRECISION / sp.max_photo, 0) * 0.2 +
      COALESCE(poc.post_count::DOUBLE PRECISION / sp.max_post, 0) * 0.2
    ) AS score
  FROM visit_counts vc
  JOIN places p ON p.id = vc.place_id
  LEFT JOIN last_saves ls ON ls.place_id = vc.place_id
  LEFT JOIN place_destinations pd ON pd.place_id = vc.place_id
  LEFT JOIN place_categories pc2 ON pc2.place_id = vc.place_id
  LEFT JOIN thumbnails t2 ON t2.place_id = vc.place_id
  LEFT JOIN photo_counts phc ON phc.place_id = vc.place_id
  LEFT JOIN post_counts poc ON poc.place_id = vc.place_id
  CROSS JOIN score_params sp;
$$;

ALTER FUNCTION "public"."get_explored_places"("since_date" "date") OWNER TO "postgres";
