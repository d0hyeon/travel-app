CREATE TABLE IF NOT EXISTS "public"."app_version_policies" (
    "platform" "text" NOT NULL,
    "minimum_version" "text" NOT NULL,
    "store_url" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_version_policies_pkey" PRIMARY KEY ("platform"),
    CONSTRAINT "app_version_policies_platform_check" CHECK (("platform" = ANY (ARRAY['ios'::"text", 'android'::"text"]))),
    CONSTRAINT "app_version_policies_minimum_version_check" CHECK (("minimum_version" ~ '^\d+(\.\d+)*$'::"text"))
);

ALTER TABLE "public"."app_version_policies" OWNER TO "postgres";
ALTER TABLE "public"."app_version_policies" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_version_policies_select" ON "public"."app_version_policies" FOR SELECT TO "anon", "authenticated" USING (true);

REVOKE ALL ON TABLE "public"."app_version_policies" FROM "anon", "authenticated";
GRANT SELECT ON TABLE "public"."app_version_policies" TO "anon", "authenticated";
GRANT ALL ON TABLE "public"."app_version_policies" TO "service_role";

INSERT INTO "public"."app_version_policies" ("platform", "minimum_version", "store_url") VALUES
    ('ios', '1.0.0', 'https://apps.apple.com/app/idAPP_STORE_ID'),
    ('android', '1.0.0', 'market://details?id=me.waylog.app')
ON CONFLICT ("platform") DO NOTHING;
