-- get_explored_places: 전체 유저의 방문 장소 집계 (RLS 우회)
-- since_date가 NULL이면 전체 기간, 값이 있으면 해당 날짜 이후 종료된 여행만 집계
CREATE OR REPLACE FUNCTION get_explored_places(since_date DATE DEFAULT NULL)
RETURNS TABLE (
  place_id UUID,
  name TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  visitor_count BIGINT,
  destinations JSONB,
  categories JSONB,
  thumbnail_url TEXT,
  total_trips BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
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
      tp.category
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
  thumbnails AS (
    SELECT place_id, url
    FROM (
      SELECT place_id, url, row_number() OVER (PARTITION BY place_id) AS rn
      FROM (
        SELECT place_id, url FROM photos WHERE is_public = true AND place_id IN (SELECT place_id FROM visit_counts)
        UNION ALL
        SELECT place_id, url FROM post_photos WHERE is_public = true AND place_id IN (SELECT place_id FROM visit_counts)
      ) all_photos
    ) ranked
    WHERE rn = 1
  ),
  total AS (
    SELECT count(DISTINCT trip_id) AS total_trips FROM route_places
  )
  SELECT
    p.id AS place_id,
    p.name,
    COALESCE(p.address, '') AS address,
    p.lat,
    p.lng,
    vc.visitor_count,
    COALESCE(pd.destinations, '[]'::jsonb) AS destinations,
    COALESCE(pc.categories, '[]'::jsonb) AS categories,
    t2.url AS thumbnail_url,
    (SELECT total_trips FROM total) AS total_trips
  FROM visit_counts vc
  JOIN places p ON p.id = vc.place_id
  LEFT JOIN place_destinations pd ON pd.place_id = vc.place_id
  LEFT JOIN place_categories pc ON pc.place_id = vc.place_id
  LEFT JOIN thumbnails t2 ON t2.place_id = vc.place_id;
$$;
