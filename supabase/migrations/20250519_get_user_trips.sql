-- get_user_trips: 특정 유저의 모든 여행을 반환 (RLS 우회)
-- 오너인 여행 + 멤버로 참여한 여행 모두 포함
CREATE OR REPLACE FUNCTION get_user_trips(p_user_id UUID)
RETURNS SETOF trips
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM trips
  WHERE user_id = p_user_id
    OR id IN (SELECT trip_id FROM trip_members WHERE user_id = p_user_id)
  ORDER BY start_date DESC;
$$;
