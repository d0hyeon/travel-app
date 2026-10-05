-- 공항·항공사를 목록에서 고르게 하면서 코드를 함께 남긴다.
-- 이름만으로는 외부 운항정보 API 의 응답과 매칭할 수 없다.
--
-- nullable 이다. 코드 도입 전에 등록된 행이 이미 있고, 그 행들은 이름만
-- 가진 채로 유효하다. 알림 대상에서만 빠진다.
--
-- departure_name/arrival_name 은 남긴다. 기차·버스가 같은 컬럼을 쓰고,
-- 공항 코드는 항공에만 있다.
ALTER TABLE "public"."trip_transports"
    ADD COLUMN IF NOT EXISTS "departure_airport_code" "text",
    ADD COLUMN IF NOT EXISTS "arrival_airport_code" "text",
    ADD COLUMN IF NOT EXISTS "airline_code" "text";
