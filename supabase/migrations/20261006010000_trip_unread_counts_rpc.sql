CREATE OR REPLACE FUNCTION "public"."get_trip_unread_counts"("last_reads" "jsonb" DEFAULT '{}'::"jsonb")
RETURNS TABLE ("trip_id" "uuid", "unread_count" integer)
LANGUAGE "sql" STABLE SECURITY INVOKER
SET "search_path" TO 'public'
AS $$
  SELECT
    "t"."id",
    ("count"("m"."id"))::integer
  FROM "public"."trips" "t"
  LEFT JOIN "public"."trip_messages" "m"
    ON "m"."trip_id" = "t"."id"
   AND (
     ("last_reads" ->> ("t"."id")::"text") IS NULL
     OR "m"."created_at" > (("last_reads" ->> ("t"."id")::"text"))::timestamp with time zone
   )
  GROUP BY "t"."id"
$$;

REVOKE ALL ON FUNCTION "public"."get_trip_unread_counts"("jsonb") FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."get_trip_unread_counts"("jsonb") FROM "anon";
GRANT EXECUTE ON FUNCTION "public"."get_trip_unread_counts"("jsonb") TO "authenticated";
