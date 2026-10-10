DROP POLICY IF EXISTS "Allow all for expenses" ON "public"."expenses";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."expenses";
DROP POLICY IF EXISTS "Allow all for routes" ON "public"."routes";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."checklist";
DROP POLICY IF EXISTS "Allow all for trip_members" ON "public"."trip_members";
DROP POLICY IF EXISTS "Allow all for places" ON "public"."places";
DROP POLICY IF EXISTS "trip_members_insert" ON "public"."trip_members";

CREATE POLICY "trip_members_insert_host_self" ON "public"."trip_members"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    "user_id" = "auth"."uid"()
    AND EXISTS (
      SELECT 1 FROM "public"."trips" "t"
      WHERE "t"."id" = "trip_members"."trip_id" AND "t"."user_id" = "auth"."uid"()
    )
  );

DROP POLICY IF EXISTS "places_select" ON "public"."places";
CREATE POLICY "places_select" ON "public"."places"
  FOR SELECT TO "anon", "authenticated"
  USING (true);

CREATE POLICY "places_insert" ON "public"."places"
  FOR INSERT TO "authenticated"
  WITH CHECK (true);

CREATE POLICY "places_update_missing_category" ON "public"."places"
  FOR UPDATE TO "authenticated"
  USING ("category" IS NULL)
  WITH CHECK (true);

REVOKE UPDATE ON TABLE "public"."places" FROM "anon", "authenticated";
GRANT UPDATE ("category") ON TABLE "public"."places" TO "authenticated";

REVOKE UPDATE ON TABLE "public"."trips" FROM "anon", "authenticated";
GRANT UPDATE (
  "name",
  "destination",
  "destinations",
  "is_overseas",
  "lat",
  "lng",
  "start_date",
  "end_date",
  "share_link",
  "exchange_rate",
  "exchange_rates"
) ON TABLE "public"."trips" TO "authenticated";
