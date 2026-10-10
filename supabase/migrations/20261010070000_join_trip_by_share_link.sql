DROP FUNCTION IF EXISTS "public"."join_trip"("uuid");

CREATE FUNCTION "public"."join_trip"("p_share_link" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  caller uuid := auth.uid();
  invited_trip_id uuid;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'unauthenticated';
  END IF;

  SELECT t.id INTO invited_trip_id FROM public.trips t WHERE t.share_link = p_share_link FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'trip_not_found';
  END IF;

  INSERT INTO public.trip_members (trip_id, user_id)
  VALUES (invited_trip_id, caller)
  ON CONFLICT (trip_id, user_id) DO UPDATE SET left_at = NULL
  WHERE public.trip_members.left_at IS NOT NULL;
END;
$$;

ALTER FUNCTION "public"."join_trip"("uuid") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."join_trip"("uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."join_trip"("uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."join_trip"("uuid") TO "service_role";
