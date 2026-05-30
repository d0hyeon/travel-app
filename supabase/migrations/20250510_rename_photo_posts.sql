-- ============================================================
-- Migration: rename photo_posts to posts
-- 이미 생성된 feed 테이블명을 정리하고 관련 오브젝트 이름도 함께 맞춘다.
-- ============================================================

BEGIN;

ALTER TABLE IF EXISTS photo_posts RENAME TO posts;

ALTER INDEX IF EXISTS idx_photo_posts_author RENAME TO idx_posts_author;
ALTER INDEX IF EXISTS idx_photo_posts_public RENAME TO idx_posts_public;
ALTER INDEX IF EXISTS idx_photo_posts_trip RENAME TO idx_posts_trip;

ALTER TABLE IF EXISTS posts RENAME CONSTRAINT photo_posts_cover_photo_id_fkey TO posts_cover_photo_id_fkey;
ALTER TABLE IF EXISTS posts RENAME CONSTRAINT photo_posts_place_id_fkey TO posts_place_id_fkey;
ALTER TABLE IF EXISTS posts RENAME CONSTRAINT photo_posts_trip_id_fkey TO posts_trip_id_fkey;

DROP POLICY IF EXISTS "photo_posts_select" ON posts;
DROP POLICY IF EXISTS "photo_posts_insert" ON posts;
DROP POLICY IF EXISTS "photo_posts_update" ON posts;
DROP POLICY IF EXISTS "photo_posts_delete" ON posts;

CREATE POLICY "posts_select" ON posts FOR SELECT
  USING (can_view_post(visibility, author_id, trip_id));

CREATE POLICY "posts_insert" ON posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "posts_update" ON posts FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "posts_delete" ON posts FOR DELETE
  USING (author_id = auth.uid());

COMMIT;
