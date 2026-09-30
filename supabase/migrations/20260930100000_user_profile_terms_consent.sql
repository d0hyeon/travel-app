-- 가입은 약관 동의와 함께 이루어지므로 동의 이력은 프로필 행에 남긴다.
-- 기존 유저는 이번 버전에 일괄 동의한 것으로 처리한다.
ALTER TABLE "public"."user_profiles"
    ADD COLUMN IF NOT EXISTS "terms_version" "text",
    ADD COLUMN IF NOT EXISTS "terms_agreed_at" timestamp with time zone;

UPDATE "public"."user_profiles"
SET "terms_version" = '2026-10-01',
    "terms_agreed_at" = now()
WHERE "terms_version" IS NULL;

ALTER TABLE "public"."user_profiles"
    ALTER COLUMN "terms_version" SET NOT NULL,
    ALTER COLUMN "terms_agreed_at" SET NOT NULL;
