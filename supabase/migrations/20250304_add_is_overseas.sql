-- trips 테이블에 해외 여행 여부 컬럼 추가
ALTER TABLE trips ADD COLUMN is_overseas BOOLEAN NOT NULL DEFAULT FALSE;

-- 기존 데이터는 모두 국내(false)로 설정됨
