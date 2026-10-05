-- 교통편이 trip_places 를 참조하던 것을 장소 이름 문자열로 바꾼다.
--
-- 참조의 유일한 목적이 경로 위에 교통 구간을 표기하는 것이었다. 그러자면
-- 장소 검색 -> places upsert -> trip_places 생성이 따라붙고, 그렇게 만든
-- 공항·역이 탐색 통계와 장소 목록에도 섞인다. 경로 표기는 사용자가 장소를
-- 직접 넣으면 되는 일이라 비용이 가치보다 크다.
--
-- 좌표도 갖지 않는다. 쓰는 곳이 길찾기 링크 하나인데, 지도 앱은 좌표보다
-- 이름을 더 잘 받는다 -- ?api=1&destination=인천국제공항 은 장소로 인식돼
-- 상세 정보까지 뜨지만 좌표는 핀만 찍힌다.
--
-- 테이블을 세운 직후이고 등록 UI 가 없었으므로 옮길 데이터가 없다.
-- 그래도 기본값을 두어 행이 있어도 NOT NULL 로 전환된다.
ALTER TABLE "public"."trip_transports"
    ADD COLUMN IF NOT EXISTS "departure_name" "text" NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS "arrival_name" "text" NOT NULL DEFAULT '';

ALTER TABLE "public"."trip_transports"
    ALTER COLUMN "departure_name" DROP DEFAULT,
    ALTER COLUMN "arrival_name" DROP DEFAULT;

ALTER TABLE "public"."trip_transports"
    DROP COLUMN IF EXISTS "departure_trip_place_id",
    DROP COLUMN IF EXISTS "arrival_trip_place_id";
