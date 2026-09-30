DROP POLICY "authenticated users can read messages" ON "public"."trip_messages";
DROP POLICY "authenticated users can insert messages" ON "public"."trip_messages";

CREATE POLICY "trip_messages_select" ON "public"."trip_messages" FOR SELECT TO "authenticated"
    USING ("public"."can_access_trip"("trip_id"));

CREATE POLICY "trip_messages_insert" ON "public"."trip_messages" FOR INSERT TO "authenticated"
    WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."can_access_trip"("trip_id")));
