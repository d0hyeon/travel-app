-- ============================================================
-- Travel App — Photo Feed Migration
-- 사용자 단위 사진 게시(post) 도입
-- ============================================================
BEGIN;

-- ------------------------------------------------------------
-- 1. visibility enum
-- ------------------------------------------------------------
CREATE TYPE post_visibility AS ENUM ('PRIVATE', 'MEMBERS', 'PUBLIC');

-- ------------------------------------------------------------
-- 2. posts — 사용자가 게시하는 포스트
--    - author_id: 작성자 (수정/삭제 권한자)
--    - trip_id:   회고 컨텍스트 (선택, MEMBERS 가시성 시 필수)
--    - place_id XOR location_id: 위치 단위 가변 (POI 또는 도시)
--    - location_id는 features/location vocabulary의 string id (예: '도쿄')
-- ------------------------------------------------------------
CREATE TABLE posts (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id       UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id         UUID            REFERENCES trips(id) ON DELETE SET NULL,
  title           TEXT,
  description     TEXT,
  cover_photo_id  UUID            REFERENCES photos(id) ON DELETE SET NULL,
  place_id        UUID            REFERENCES places(id) ON DELETE SET NULL,
  location_id     TEXT,
  visibility      post_visibility NOT NULL DEFAULT 'PRIVATE',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ,
  CHECK (NOT (place_id IS NOT NULL AND location_id IS NOT NULL)),
  CHECK (visibility <> 'MEMBERS' OR trip_id IS NOT NULL)
);

CREATE INDEX idx_posts_author ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_public ON posts(created_at DESC) WHERE visibility = 'PUBLIC';
CREATE INDEX idx_posts_trip   ON posts(trip_id, created_at DESC);

-- ------------------------------------------------------------
-- 3. post_photos — 포스트와 사진의 관계 + 순서
--    포스트 안의 사진 순서는 그룹의 관심사이므로 photos가 아닌 join에 둠
-- ------------------------------------------------------------
CREATE TABLE post_photos (
  post_id        UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  photo_id       UUID NOT NULL REFERENCES photos(id)      ON DELETE CASCADE,
  display_order  INT  NOT NULL,
  PRIMARY KEY (post_id, photo_id)
);

CREATE INDEX idx_post_photos_post  ON post_photos(post_id, display_order);
CREATE INDEX idx_post_photos_photo ON post_photos(photo_id);

-- ------------------------------------------------------------
-- 4. post_comments — 댓글 (DB만, UI 1차 보류)
-- ------------------------------------------------------------
CREATE TABLE post_comments (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID         NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   UUID         NOT NULL REFERENCES auth.users(id),
  content     TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

CREATE INDEX idx_post_comments_post ON post_comments(post_id, created_at DESC);

-- ------------------------------------------------------------
-- 5. post_likes — 좋아요
-- ------------------------------------------------------------
CREATE TABLE post_likes (
  post_id     UUID         NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID         NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ------------------------------------------------------------
-- 6. 가시성 헬퍼 — 포스트 SELECT 정책의 핵심 조건을 함수로 묶음
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION can_view_post(post_visibility post_visibility, post_author UUID, post_trip UUID)
RETURNS BOOLEAN AS $$
  SELECT
    post_visibility = 'PUBLIC'
    OR post_author = auth.uid()
    OR (post_visibility = 'MEMBERS' AND post_trip IS NOT NULL AND can_access_trip(post_trip));
$$ LANGUAGE sql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 7. RLS
-- ------------------------------------------------------------
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select" ON posts FOR SELECT
  USING (can_view_post(visibility, author_id, trip_id));

CREATE POLICY "posts_insert" ON posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "posts_update" ON posts FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "posts_delete" ON posts FOR DELETE
  USING (author_id = auth.uid());

-- post_photos: 부모 포스트의 권한을 따른다
ALTER TABLE post_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_photos_select" ON post_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND can_view_post(p.visibility, p.author_id, p.trip_id)
    )
  );

CREATE POLICY "post_photos_modify" ON post_photos
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

-- post_comments: SELECT는 포스트 가시성, 작성/수정/삭제는 작성자
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_comments_select" ON post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND can_view_post(p.visibility, p.author_id, p.trip_id)
    )
  );

CREATE POLICY "post_comments_insert" ON post_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND can_view_post(p.visibility, p.author_id, p.trip_id)
    )
  );

CREATE POLICY "post_comments_update" ON post_comments FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "post_comments_delete" ON post_comments FOR DELETE
  USING (author_id = auth.uid());

-- post_likes: 본인 row만 INSERT/DELETE, SELECT는 포스트 가시성
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_likes_select" ON post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND can_view_post(p.visibility, p.author_id, p.trip_id)
    )
  );

CREATE POLICY "post_likes_insert" ON post_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_likes_delete" ON post_likes FOR DELETE
  USING (user_id = auth.uid());

COMMIT;
