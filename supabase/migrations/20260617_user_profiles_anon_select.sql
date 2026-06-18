-- user_profiles SELECT 정책을 anon 역할에도 허용
-- 기존 정책은 TO 절이 없어 authenticated 전용으로 동작 → 게스트 조회 시 빈 결과
DROP POLICY IF EXISTS "profiles_select" ON user_profiles;

CREATE POLICY "profiles_select" ON user_profiles FOR SELECT
  TO anon, authenticated
  USING (true);
