-- ============================================================
-- Travel App — Posts × Locations 재구성
-- 1) posts에서 location_id 제거 (location vocabulary 폐지, description으로 흡수)
-- 2) posts.place_id (1:1) 제거 → post_locations (1:N) 도입
-- 3) trip_id는 nullable 유지, MEMBERS 가시성 조건도 유지
-- ============================================================
BEGIN;

-- ------------------------------------------------------------
-- posts: place_id, location_id 제거 + 관련 CHECK 정리
-- ------------------------------------------------------------
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_place_id_fkey;
ALTER TABLE posts DROP COLUMN IF EXISTS place_id;
ALTER TABLE posts DROP COLUMN IF EXISTS location_id;

-- ------------------------------------------------------------
-- post_locations: 한 포스트의 위치 N개 (places(id) 참조)
--   같은 place가 한 포스트에 중복 등록되는 건 막고, 표시 순서는 display_order
-- ------------------------------------------------------------
CREATE TABLE post_locations (
  post_id        UUID  NOT NULL REFERENCES posts(id)  ON DELETE CASCADE,
  place_id       UUID  NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  display_order  INT   NOT NULL,
  PRIMARY KEY (post_id, place_id)
);

CREATE INDEX idx_post_locations_post  ON post_locations(post_id, display_order);
CREATE INDEX idx_post_locations_place ON post_locations(place_id);

-- ------------------------------------------------------------
-- RLS: 부모 포스트의 가시성/소유 규칙을 따른다
-- ------------------------------------------------------------
ALTER TABLE post_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_locations_select" ON post_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND can_view_post(p.visibility, p.author_id, p.trip_id)
    )
  );

CREATE POLICY "post_locations_modify" ON post_locations
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id AND p.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id AND p.author_id = auth.uid()
    )
  );

COMMIT;
