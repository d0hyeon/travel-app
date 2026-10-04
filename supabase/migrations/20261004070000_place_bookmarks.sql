CREATE TABLE IF NOT EXISTS "public"."place_bookmarks" (
    "user_id" "uuid" NOT NULL,
    "place_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "place_bookmarks_pkey" PRIMARY KEY ("user_id", "place_id"),
    CONSTRAINT "place_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "place_bookmarks_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."place_bookmarks" OWNER TO "postgres";
ALTER TABLE "public"."place_bookmarks" ENABLE ROW LEVEL SECURITY;

CREATE INDEX "place_bookmarks_user_id_created_at_idx" ON "public"."place_bookmarks" USING "btree" ("user_id", "created_at" DESC);

CREATE POLICY "place_bookmarks_select" ON "public"."place_bookmarks" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "place_bookmarks_insert" ON "public"."place_bookmarks" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "place_bookmarks_delete" ON "public"."place_bookmarks" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));

REVOKE ALL ON TABLE "public"."place_bookmarks" FROM "anon", "authenticated";
GRANT SELECT, INSERT, DELETE ON TABLE "public"."place_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."place_bookmarks" TO "service_role";
