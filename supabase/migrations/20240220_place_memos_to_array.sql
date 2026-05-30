-- place_memos의 string 값들을 string[] 형태로 마이그레이션
-- 기존: { "placeId": "memo text" }
-- 변경: { "placeId": ["memo text"] }

UPDATE routes
SET place_memos = (
  SELECT jsonb_object_agg(
    key,
    CASE
      -- 이미 배열이면 그대로
      WHEN jsonb_typeof(value) = 'array' THEN value
      -- 문자열이면 배열로 감싸기
      WHEN jsonb_typeof(value) = 'string' THEN jsonb_build_array(value)
      -- 그 외 (null 등)는 빈 배열
      ELSE '[]'::jsonb
    END
  )
  FROM jsonb_each(place_memos)
)
WHERE place_memos IS NOT NULL
  AND place_memos != '{}'::jsonb;
