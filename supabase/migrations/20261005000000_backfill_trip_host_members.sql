INSERT INTO "public"."trip_members" ("trip_id", "user_id", "created_at")
SELECT "t"."id", "t"."user_id", "t"."created_at"
FROM "public"."trips" "t"
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."trip_members" "m"
    WHERE "m"."trip_id" = "t"."id" AND "m"."user_id" = "t"."user_id"
)
ON CONFLICT ("trip_id", "user_id") DO NOTHING;
