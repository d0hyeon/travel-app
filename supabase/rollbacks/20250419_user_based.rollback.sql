-- ============================================================
-- Travel App — Migration Rollback
-- migration.sql 실패 또는 수동 롤백이 필요할 때 실행
--
-- ※ BEGIN/COMMIT으로 감싸서 실행하면 안전하게 되돌릴 수 있음
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. RLS 정책 제거
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "trips_select"        ON trips;
DROP POLICY IF EXISTS "trips_insert"        ON trips;
DROP POLICY IF EXISTS "trips_update"        ON trips;
DROP POLICY IF EXISTS "trips_delete"        ON trips;

DROP POLICY IF EXISTS "trip_members_select" ON trip_members;
DROP POLICY IF EXISTS "trip_members_insert" ON trip_members;
DROP POLICY IF EXISTS "trip_members_delete" ON trip_members;

DROP POLICY IF EXISTS "profiles_select"     ON user_profiles;
DROP POLICY IF EXISTS "profiles_insert"     ON user_profiles;
DROP POLICY IF EXISTS "profiles_update"     ON user_profiles;

DROP POLICY IF EXISTS "places_access"       ON places;
DROP POLICY IF EXISTS "expenses_access"     ON expenses;
DROP POLICY IF EXISTS "routes_access"       ON routes;
DROP POLICY IF EXISTS "memos_access"        ON memos;
DROP POLICY IF EXISTS "photos_access"       ON photos;
DROP POLICY IF EXISTS "checklist_access"    ON checklist;

-- ------------------------------------------------------------
-- 2. RLS 비활성화
-- ------------------------------------------------------------
ALTER TABLE trips        DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE places       DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses     DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes       DISABLE ROW LEVEL SECURITY;
ALTER TABLE memos        DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos       DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist    DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 3. 함수 제거
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS get_trip_by_share_link(TEXT);
DROP FUNCTION IF EXISTS can_access_trip(UUID);

-- ------------------------------------------------------------
-- 4. 추가된 컬럼 제거
-- ------------------------------------------------------------
ALTER TABLE trips        DROP COLUMN IF EXISTS user_id;
ALTER TABLE trip_members DROP COLUMN IF EXISTS user_id;

-- ------------------------------------------------------------
-- 5. user_profiles 테이블 제거
-- ------------------------------------------------------------
DROP TABLE IF EXISTS user_profiles;

COMMIT;
