-- get_most_saved_places: 전체 유저의 trip_places 기준 저장 횟수 집계 (RLS 우회)
CREATE OR REPLACE FUNCTION get_most_saved_places()
RETURNS TABLE (
  place_id UUID,
  name TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  save_count BIGINT,
  destinations JSONB,
  categories JSONB,
  thumbnail_url TEXT,
  total_trips BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH save_counts AS (
    SELECT tp.place_id, count(DISTINCT tp.trip_id) AS save_count
    FROM trip_places tp
    WHERE tp.category IS DISTINCT FROM 'transit'
    GROUP BY tp.place_id
  ),
  place_destinations AS (
    SELECT
      tp.place_id,
      jsonb_agg(DISTINCT dest) FILTER (WHERE dest IS NOT NULL) AS destinations
    FROM trip_places tp
    JOIN trips t ON tp.trip_id = t.id
    JOIN LATERAL jsonb_array_elements_text(t.destinations::jsonb) AS dest ON TRUE
    WHERE tp.place_id IN (SELECT place_id FROM save_counts)
    GROUP BY tp.place_id
  ),
  place_categories AS (
    SELECT place_id, jsonb_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL) AS categories
    FROM trip_places
    WHERE place_id IN (SELECT place_id FROM save_counts)
    GROUP BY place_id
  ),
  thumbnails AS (
    SELECT place_id, url
    FROM (
      SELECT place_id, url, row_number() OVER (PARTITION BY place_id) AS rn
      FROM (
        SELECT place_id, url FROM photos WHERE is_public = true AND place_id IN (SELECT place_id FROM save_counts)
        UNION ALL
        SELECT place_id, url FROM post_photos WHERE is_public = true AND place_id IN (SELECT place_id FROM save_counts)
      ) all_photos
    ) ranked
    WHERE rn = 1
  ),
  total AS (
    SELECT count(DISTINCT trip_id) AS total_trips FROM trip_places
  )
  SELECT
    p.id AS place_id,
    p.name,
    COALESCE(p.address, '') AS address,
    p.lat,
    p.lng,
    sc.save_count,
    COALESCE(pd.destinations, '[]'::jsonb) AS destinations,
    COALESCE(pc.categories, '[]'::jsonb) AS categories,
    t2.url AS thumbnail_url,
    (SELECT total_trips FROM total) AS total_trips
  FROM save_counts sc
  JOIN places p ON p.id = sc.place_id
  LEFT JOIN place_destinations pd ON pd.place_id = sc.place_id
  LEFT JOIN place_categories pc ON pc.place_id = sc.place_id
  LEFT JOIN thumbnails t2 ON t2.place_id = sc.place_id;
$$;
