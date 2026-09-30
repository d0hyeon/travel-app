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

ALTER TABLE "public"."user_profiles"
    ALTER COLUMN "terms_version" SET DEFAULT 'legacy',
    ALTER COLUMN "terms_agreed_at" SET DEFAULT now();
