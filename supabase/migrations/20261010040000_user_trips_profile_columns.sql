DROP FUNCTION IF EXISTS "public"."get_user_trips"("uuid");

CREATE FUNCTION "public"."get_user_trips"("p_user_id" "uuid")
RETURNS TABLE(
  "id" "uuid",
  "name" "text",
  "destinations" "text"[],
  "end_date" "text"
)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    t.id,
    t.name,
    ARRAY(SELECT jsonb_array_elements_text(t.destinations)) AS destinations,
    t.end_date::text AS end_date
  FROM trips t
  WHERE t.user_id = p_user_id
    OR t.id IN (SELECT trip_id FROM trip_members WHERE user_id = p_user_id AND left_at IS NULL)
  ORDER BY t.start_date DESC;
$$;

ALTER FUNCTION "public"."get_user_trips"("uuid") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_user_trips"("uuid") FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."get_user_trips"("uuid") TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_user_trips"("uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_user_trips"("uuid") TO "service_role";
