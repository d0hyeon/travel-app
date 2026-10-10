DROP POLICY IF EXISTS "trips_select" ON "public"."trips";
CREATE POLICY "trips_select" ON "public"."trips" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("id" IN ( SELECT "m"."trip_id"
   FROM "public"."active_trip_members" "m"
  WHERE ("m"."user_id" = "auth"."uid"())))));
