CREATE TYPE "public"."report_target_type" AS ENUM ('post', 'user');
CREATE TYPE "public"."report_reason" AS ENUM ('spam', 'inappropriate', 'harassment', 'other');

CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "target_type" "public"."report_target_type" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "reason" "public"."report_reason" NOT NULL,
    "detail" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reports_reporter_target_key" UNIQUE ("reporter_id", "target_type", "target_id"),
    CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."reports" OWNER TO "postgres";
ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert" ON "public"."reports" FOR INSERT TO "authenticated" WITH CHECK (("reporter_id" = "auth"."uid"()));

GRANT INSERT ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";

CREATE TABLE IF NOT EXISTS "public"."user_blocks" (
    "blocker_id" "uuid" NOT NULL,
    "blocked_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("blocker_id", "blocked_id"),
    CONSTRAINT "user_blocks_not_self" CHECK (("blocker_id" <> "blocked_id")),
    CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."user_blocks" OWNER TO "postgres";
ALTER TABLE "public"."user_blocks" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_blocks_select" ON "public"."user_blocks" FOR SELECT TO "authenticated" USING (("blocker_id" = "auth"."uid"()));
CREATE POLICY "user_blocks_insert" ON "public"."user_blocks" FOR INSERT TO "authenticated" WITH CHECK (("blocker_id" = "auth"."uid"()));
CREATE POLICY "user_blocks_delete" ON "public"."user_blocks" FOR DELETE TO "authenticated" USING (("blocker_id" = "auth"."uid"()));

GRANT SELECT, INSERT, DELETE ON TABLE "public"."user_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_blocks" TO "service_role";

CREATE OR REPLACE FUNCTION "public"."can_view_post"("post_visibility" "public"."post_visibility", "post_author" "uuid", "post_trip" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT
    (
      post_visibility = 'PUBLIC'
      OR post_author = auth.uid()
      OR (post_visibility = 'MEMBERS' AND post_trip IS NOT NULL AND can_access_trip(post_trip))
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE b.blocker_id = auth.uid() AND b.blocked_id = post_author
    );
$$;
