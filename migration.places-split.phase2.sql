-- ============================================================
-- Travel App — places 분리 (Phase 2: 컬럼 정리 + 코드 전환)
--
-- places에서 trip-scoped 컬럼 DROP + provider/external_id 추가.
-- expenses.place_id FK → trip_places(id)로 변경.
-- trip_places.id에 DEFAULT 추가 (신규 row는 자동 uuid).
-- Phase 1 이후 trip_places 데이터가 places와 1:1 매칭됨을 전제.
-- ============================================================
BEGIN;

-- ------------------------------------------------------------
-- 1. places — provider / external_id 추가
--    legacy 데이터는 provider='legacy', external_id=id::text
-- ------------------------------------------------------------
ALTER TABLE places
  ADD COLUMN provider    TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN external_id TEXT NOT NULL DEFAULT '';

UPDATE places SET external_id = id::text;

ALTER TABLE places
  ADD CONSTRAINT places_provider_external_id_key UNIQUE (provider, external_id);

-- ------------------------------------------------------------
-- 2. expenses.place_id FK — places → trip_places
--    값(uuid)은 동일하므로 데이터 변경 0
-- ------------------------------------------------------------
ALTER TABLE expenses DROP CONSTRAINT expenses_place_id_fkey;
ALTER TABLE expenses
  ADD CONSTRAINT expenses_place_id_fkey
  FOREIGN KEY (place_id) REFERENCES trip_places(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 3. trip_places.id — 신규 insert 시 auto-uuid
-- ------------------------------------------------------------
ALTER TABLE trip_places ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ------------------------------------------------------------
-- 4. places RLS — 기존 trip 귀속 정책 제거, 전역 읽기 정책으로 교체
--    places는 전역 POI (read-only). 인증 사용자는 SELECT/INSERT 가능,
--    UPDATE/DELETE는 차단 (값은 upsert 시 ON CONFLICT DO NOTHING).
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "places_access" ON places;

CREATE POLICY "places_select" ON places
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "places_insert" ON places
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------
-- 5. places — trip-scoped 컬럼 DROP
-- ------------------------------------------------------------
ALTER TABLE places
  DROP COLUMN trip_id,
  DROP COLUMN status,
  DROP COLUMN memo,
  DROP COLUMN category,
  DROP COLUMN tags;

-- ------------------------------------------------------------
-- 검증 쿼리 (배포 후 실행)
--
--   -- places 컬럼 확인
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'places' ORDER BY ordinal_position;
--   -- 결과: id, name, lat, lng, address, created_at, provider, external_id
--
--   -- expenses FK 대상 확인
--   SELECT conname, confrelid::regclass FROM pg_constraint
--     WHERE conname = 'expenses_place_id_fkey';
--   -- 결과: trip_places
-- ------------------------------------------------------------

COMMIT;
