-- ============================================================
-- Travel App — User-based Migration
-- ============================================================

-- ------------------------------------------------------------
-- 1. user_profiles
--    auth.users와 1:1, 이름/프로필 이미지 저장
-- ------------------------------------------------------------
CREATE TABLE user_profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. trips — user_id 추가 (nullable: 기존 레거시 여행은 NULL)
-- ------------------------------------------------------------
ALTER TABLE trips ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 3. trip_members — user_id 추가
--    name/emoji는 레거시 데이터 폴백용으로 유지
--    user_id가 있으면 user_profiles에서 name/avatar 조회
-- ------------------------------------------------------------
ALTER TABLE trip_members
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ------------------------------------------------------------
-- 4. 초대 링크로 여행 조회 (RLS 우회 함수)
--    share_link가 일종의 토큰 역할
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_trip_by_share_link(link TEXT)
RETURNS SETOF trips AS $$
  SELECT * FROM trips WHERE share_link = link LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 5. trip 접근 권한 헬퍼 함수
--    owner이거나 member이면 접근 가능
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION can_access_trip(trip_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = trip_id
      AND (
        t.user_id IS NULL           -- 레거시 여행: 누구나 접근 가능
        OR t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM trip_members m
          WHERE m.trip_id = t.id AND m.user_id = auth.uid()
        )
      )
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 6. RLS 활성화 및 정책 설정
-- ------------------------------------------------------------

-- trips
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_select" ON trips FOR SELECT
  USING (
    user_id IS NULL             -- 레거시 여행
    OR user_id = auth.uid()
    OR id IN (SELECT m.trip_id FROM trip_members m WHERE m.user_id = auth.uid())
  );

CREATE POLICY "trips_insert" ON trips FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "trips_update" ON trips FOR UPDATE
  USING (can_access_trip(id));

CREATE POLICY "trips_delete" ON trips FOR DELETE
  USING (
    user_id IS NULL             -- 레거시 여행은 누구나 삭제 가능 (추후 소유권 이전 후 제거)
    OR user_id = auth.uid()
  );

-- trip_members
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_members_select" ON trip_members FOR SELECT
  USING (can_access_trip(trip_id));

CREATE POLICY "trip_members_insert" ON trip_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid() -- 본인만 본인을 멤버로 추가 가능 (초대 수락)
  );

CREATE POLICY "trip_members_delete" ON trip_members FOR DELETE
  USING (
    user_id = auth.uid() -- 본인 탈퇴
    OR trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()) -- owner가 추방
  );

-- user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON user_profiles FOR SELECT
  USING (true); -- 같은 여행 멤버 프로필 조회 필요하므로 인증된 유저는 모두 읽기 가능

CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE
  USING (id = auth.uid()); -- 본인 프로필만 수정

-- places
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places_access" ON places
  USING (can_access_trip(trip_id))
  WITH CHECK (can_access_trip(trip_id));

-- expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_access" ON expenses
  USING (can_access_trip(trip_id))
  WITH CHECK (can_access_trip(trip_id));

-- routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routes_access" ON routes
  USING (can_access_trip(trip_id))
  WITH CHECK (can_access_trip(trip_id));

-- memos
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memos_access" ON memos
  USING (can_access_trip(trip_id))
  WITH CHECK (can_access_trip(trip_id));

-- photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_access" ON photos
  USING (can_access_trip(trip_id))
  WITH CHECK (can_access_trip(trip_id));

-- checklist
ALTER TABLE checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_access" ON checklist
  USING (can_access_trip(trip_id))
  WITH CHECK (can_access_trip(trip_id));
