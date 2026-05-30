-- ============================================================
-- Migration: multi-destination
-- 여행 목적지를 단일값(destination TEXT)에서
-- 복수값(destinations JSONB)으로 확장
--
-- 전략:
--   1. destinations 컬럼 추가 (nullable)
--   2. 기존 destination 값을 destinations[0]으로 마이그레이션
--   3. destinations NOT NULL 제약 추가
--   4. destination 컬럼은 하위 호환성을 위해 유지
--      (애플리케이션에서 destinations 우선 사용,
--       destination은 destinations[0]과 항상 동기화)
-- ============================================================

-- 1. destinations 컬럼 추가
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS destinations JSONB;

-- 2. 기존 destination → destinations 마이그레이션
UPDATE trips
SET destinations = jsonb_build_array(destination)
WHERE destinations IS NULL;

-- 3. NOT NULL 제약 추가
ALTER TABLE trips
  ALTER COLUMN destinations SET NOT NULL;

-- ============================================================
-- Rollback:
--   ALTER TABLE trips DROP COLUMN IF EXISTS destinations;
-- ============================================================
