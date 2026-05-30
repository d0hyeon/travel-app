-- photos SELECT 정책 수정
-- 기존: 여행 멤버면 is_public 여부 무관하게 전체 조회 가능
-- 변경: 본인 여행이면 전체, 타인 여행이면 is_public = true 인 사진만 조회 가능
DROP POLICY IF EXISTS "photos_access" ON photos;
DROP POLICY IF EXISTS "photos_select" ON photos;
DROP POLICY IF EXISTS "photos_select_policy" ON photos;
DROP POLICY IF EXISTS "photos_insert_policy" ON photos;
DROP POLICY IF EXISTS "photos_delete_policy" ON photos;
DROP POLICY IF EXISTS "photos_write" ON photos;
DROP POLICY IF EXISTS "photos_update" ON photos;
DROP POLICY IF EXISTS "photos_delete" ON photos;

CREATE POLICY "photos_select" ON photos FOR SELECT
  USING (
    is_public = true
    OR can_access_trip(trip_id)
  );

CREATE POLICY "photos_write" ON photos FOR INSERT
  WITH CHECK (can_access_trip(trip_id));

CREATE POLICY "photos_update" ON photos FOR UPDATE
  USING (can_access_trip(trip_id))
  WITH CHECK (can_access_trip(trip_id));

CREATE POLICY "photos_delete" ON photos FOR DELETE
  USING (can_access_trip(trip_id));
