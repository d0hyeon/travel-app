-- ============================================================
-- post_photos 독립 엔티티화
-- photos 테이블 의존 제거 — 포스트 사진은 post_photos가 직접 소유
-- ============================================================
BEGIN;

-- ------------------------------------------------------------
-- 1. post_photos에 사진 정보 컬럼 추가
-- ------------------------------------------------------------
ALTER TABLE post_photos
  ADD COLUMN url          TEXT,
  ADD COLUMN storage_path TEXT,
  ADD COLUMN place_id     UUID REFERENCES places(id) ON DELETE SET NULL,
  ADD COLUMN is_public    BOOLEAN NOT NULL DEFAULT false;

-- ------------------------------------------------------------
-- 2. 기존 데이터 마이그레이션 — photos 테이블에서 복사
-- ------------------------------------------------------------
UPDATE post_photos pp
SET
  url          = ph.url,
  storage_path = ph.storage_path,
  place_id     = ph.place_id,
  is_public    = ph.is_public
FROM photos ph
WHERE pp.photo_id = ph.id;

-- ------------------------------------------------------------
-- 3. url, storage_path NOT NULL 제약 적용 (데이터 채운 후)
-- ------------------------------------------------------------
ALTER TABLE post_photos
  ALTER COLUMN url          SET NOT NULL,
  ALTER COLUMN storage_path SET NOT NULL;

-- ------------------------------------------------------------
-- 4. photo_id FK 제거 — photos 테이블 의존 끊기
--    posts.cover_photo_id도 photos를 참조하므로 별도 처리
-- ------------------------------------------------------------
ALTER TABLE post_photos
  DROP CONSTRAINT post_photos_photo_id_fkey,
  DROP COLUMN photo_id;

-- posts.cover_photo_id는 post_photos의 storage_path 기반으로
-- 대체할 수 있으나 현재는 display_order=0 기준으로 처리하므로 컬럼 제거
ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_cover_photo_id_fkey,
  DROP COLUMN IF EXISTS cover_photo_id;

-- ------------------------------------------------------------
-- 5. PK 재설정 (photo_id 제거로 PK 변경 필요)
-- ------------------------------------------------------------
DO $$
DECLARE
  pk_name TEXT;
BEGIN
  SELECT conname INTO pk_name
  FROM pg_constraint
  WHERE conrelid = 'post_photos'::regclass AND contype = 'p';

  IF pk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE post_photos DROP CONSTRAINT %I', pk_name);
  END IF;
END $$;
ALTER TABLE post_photos ADD PRIMARY KEY (post_id, display_order);

-- ------------------------------------------------------------
-- 6. 인덱스 정리
-- ------------------------------------------------------------
DROP INDEX IF EXISTS idx_post_photos_photo;
CREATE INDEX idx_post_photos_place ON post_photos(place_id) WHERE place_id IS NOT NULL;

COMMIT;
