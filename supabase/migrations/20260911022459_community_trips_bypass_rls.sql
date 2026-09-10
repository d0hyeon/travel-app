-- get_trips_by_destination 이 RLS 를 타서 내가 속한 여행만 돌려주고 있었다.
-- "이 여행지를 다녀온 사람들" 은 남의 여행을 보여주는 기능이라 결과가 비거나
-- 내 다른 여행만 나왔다. p_exclude_trip_id 파라미터가 있다는 것 자체가
-- 내 여행이 섞여 들어옴을 전제한 흔적이다.
--
-- 같은 커뮤니티 기능의 get_routes_with_places_by_trip_id 는 이미
-- SECURITY DEFINER 로 RLS 를 우회한다. 목록만 빠져 있어 앞단에서 막혀 있었다.
--
-- 반환 필드는 여행 id, 목적지, 기간, 경로·멤버 수, 경로 좌표뿐이다.
-- 여행 이름·소유자·메모를 내주지 않으므로 익명 통계 수준에서 공개한다.
CREATE OR REPLACE FUNCTION "public"."get_trips_by_destination"("p_destinations" "text"[], "p_exclude_trip_id" "uuid")
RETURNS TABLE(
  "id" "uuid",
  "destinations" "text"[],
  "start_date" "text",
  "end_date" "text",
  "route_count" bigint,
  "member_count" bigint,
  "preview_coordinates" json
)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    t.id,
    ARRAY(SELECT jsonb_array_elements_text(t.destinations)) AS destinations,
    t.start_date,
    t.end_date,
    COUNT(DISTINCT r.id) AS route_count,
    COUNT(DISTINCT tm.user_id) AS member_count,
    COALESCE(
      json_agg(
        json_build_object(
          'scheduledDate', r.scheduled_date,
          'coords', (
            SELECT COALESCE(
              json_agg(
                json_build_object('lat', p.lat, 'lng', p.lng)
                ORDER BY array_position(r.place_ids, tp.id)
              ) FILTER (WHERE p.id IS NOT NULL),
              '[]'::json
            )
            FROM unnest(r.place_ids) AS pid
            JOIN trip_places tp ON tp.id = pid
            JOIN places p ON p.id = tp.place_id
          )
        )
      ) FILTER (WHERE r.id IS NOT NULL),
      '[]'::json
    ) AS preview_coordinates
  FROM trips t
  LEFT JOIN routes r ON r.trip_id = t.id
  LEFT JOIN trip_members tm ON tm.trip_id = t.id
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(t.destinations) d
    WHERE d = ANY(p_destinations)
  )
    AND t.id != p_exclude_trip_id
  GROUP BY t.id
$$;
