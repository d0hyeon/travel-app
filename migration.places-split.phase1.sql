-- ============================================================
-- Travel App — places 분리 (Phase 1: 호환 마이그레이션)
--
-- trip_places 테이블 추가 + 기존 places 데이터 복사.
-- 기존 places 컬럼은 손대지 않는다 → 코드 영향 0.
-- Phase 2에서 places의 trip-scoped 컬럼 DROP + provider/external_id 추가 + 코드 전환.
-- ============================================================
BEGIN;

-- ------------------------------------------------------------
-- 1. trip_places — 여행-장소 연결 (현재 places의 trip-scoped 메타)
-- ------------------------------------------------------------
CREATE TABLE trip_places (
  id          UUID         PRIMARY KEY,
  trip_id     UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  place_id    UUID         NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  category    TEXT,
  memo        TEXT,
  status      TEXT         NOT NULL DEFAULT 'candidate',
  tags        TEXT[]       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, place_id)
);

CREATE INDEX idx_trip_places_trip  ON trip_places(trip_id);
CREATE INDEX idx_trip_places_place ON trip_places(place_id);

-- ------------------------------------------------------------
-- 2. 기존 places → trip_places 1:1 복사 (id 재사용)
--    Phase 2에서 expenses/routes의 FK가 이 trip_places.id를 가리키게 변경됨.
--    id가 같은 uuid라 데이터 변경 0.
-- ------------------------------------------------------------
INSERT INTO trip_places (id, trip_id, place_id, category, memo, status, tags, created_at)
SELECT id, trip_id, id, category, memo, status, tags, created_at
FROM places;

-- ------------------------------------------------------------
-- 3. RLS — places의 정책과 동일하게 trip 멤버 권한
-- ------------------------------------------------------------
ALTER TABLE trip_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_places_access" ON trip_places
  USING (can_access_trip(trip_id))
  WITH CHECK (can_access_trip(trip_id));

-- ------------------------------------------------------------
-- 검증 쿼리 (배포 후 실행)
--   SELECT COUNT(*) FROM places;
--   SELECT COUNT(*) FROM trip_places;
--   -- 두 카운트가 동일해야 함
--
--   SELECT p.id FROM places p
--     LEFT JOIN trip_places tp ON tp.id = p.id
--     WHERE tp.id IS NULL;
--   -- 0 row여야 함 (모든 place가 trip_place로 복사됨)
-- ------------------------------------------------------------

COMMIT;
