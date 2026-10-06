CREATE OR REPLACE FUNCTION "public"."get_posts"(
  "p_post_id" "uuid" DEFAULT NULL,
  "p_author_id" "uuid" DEFAULT NULL,
  "p_place_id" "uuid" DEFAULT NULL,
  "p_public_only" boolean DEFAULT false
)
RETURNS TABLE (
  "id" "uuid",
  "author_id" "uuid",
  "trip_id" "uuid",
  "title" "text",
  "description" "text",
  "visibility" "public"."post_visibility",
  "like_count" integer,
  "liked_by_me" boolean,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "photos" "jsonb",
  "places" "jsonb"
)
LANGUAGE "sql" STABLE SECURITY INVOKER
SET "search_path" TO 'public'
AS $$
  SELECT
    "p"."id",
    "p"."author_id",
    "p"."trip_id",
    "p"."title",
    "p"."description",
    "p"."visibility",
    "p"."like_count",
    EXISTS (
      SELECT 1 FROM "public"."post_likes" "pl"
      WHERE "pl"."post_id" = "p"."id" AND "pl"."user_id" = "auth"."uid"()
    ),
    "p"."created_at",
    "p"."updated_at",
    COALESCE((
      SELECT "jsonb_agg"(
        "jsonb_build_object"(
          'url', "ph"."url",
          'storage_path', "ph"."storage_path",
          'place_id', "ph"."place_id",
          'is_public', "ph"."is_public"
        ) ORDER BY "ph"."display_order"
      )
      FROM "public"."post_photos" "ph"
      WHERE "ph"."post_id" = "p"."id"
    ), '[]'::"jsonb"),
    COALESCE((
      SELECT "jsonb_agg"(
        "jsonb_build_object"(
          'place_id', "pc"."id",
          'name', "pc"."name",
          'lat', "pc"."lat",
          'lng', "pc"."lng",
          'address', "pc"."address"
        ) ORDER BY "loc"."display_order"
      )
      FROM "public"."post_locations" "loc"
      JOIN "public"."places" "pc" ON "pc"."id" = "loc"."place_id"
      WHERE "loc"."post_id" = "p"."id"
    ), '[]'::"jsonb")
  FROM "public"."posts" "p"
  WHERE ("p_post_id" IS NULL OR "p"."id" = "p_post_id")
    AND ("p_author_id" IS NULL OR "p"."author_id" = "p_author_id")
    AND (
      "p_place_id" IS NULL
      OR EXISTS (
        SELECT 1 FROM "public"."post_locations" "l"
        WHERE "l"."post_id" = "p"."id" AND "l"."place_id" = "p_place_id"
      )
    )
    AND (NOT "p_public_only" OR "p"."visibility" = 'PUBLIC'::"public"."post_visibility")
  ORDER BY "p"."created_at" DESC
$$;

REVOKE ALL ON FUNCTION "public"."get_posts"("uuid", "uuid", "uuid", boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."get_posts"("uuid", "uuid", "uuid", boolean) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_posts"("uuid", "uuid", "uuid", boolean) TO "authenticated";
