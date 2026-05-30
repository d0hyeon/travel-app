-- photos 테이블에 user_id 추가
ALTER TABLE photos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 기존 데이터 backfill: trip owner를 user_id로 설정
UPDATE photos p
SET user_id = t.user_id
FROM trips t
WHERE p.trip_id = t.id;

-- 신규 업로드부터는 NOT NULL 적용
ALTER TABLE photos ALTER COLUMN user_id SET NOT NULL;
