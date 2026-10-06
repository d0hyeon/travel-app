CREATE OR REPLACE FUNCTION "public"."leave_trip"("p_trip_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  caller uuid := auth.uid();
  host uuid;
  successor uuid;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'unauthenticated';
  END IF;

  SELECT t.user_id INTO host FROM public.trips t WHERE t.id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'trip_not_found';
  END IF;

  IF host <> caller AND NOT EXISTS (
    SELECT 1 FROM public.trip_members m
    WHERE m.trip_id = p_trip_id AND m.user_id = caller AND m.left_at IS NULL
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_a_member';
  END IF;

  IF host = caller THEN
    SELECT m.user_id INTO successor
    FROM public.trip_members m
    WHERE m.trip_id = p_trip_id AND m.user_id <> caller AND m.left_at IS NULL
    ORDER BY m.created_at, m.id
    LIMIT 1;

    IF successor IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'last_member';
    END IF;

    UPDATE public.trips SET user_id = successor WHERE id = p_trip_id;
  END IF;

  UPDATE public.trip_members
  SET left_at = now()
  WHERE trip_id = p_trip_id AND user_id = caller AND left_at IS NULL;
END;
$$;

ALTER FUNCTION "public"."leave_trip"("p_trip_id" "uuid") OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."leave_trip"("p_trip_id" "uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."leave_trip"("p_trip_id" "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."leave_trip"("p_trip_id" "uuid") TO "service_role";

CREATE OR REPLACE FUNCTION "public"."join_trip"("p_trip_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'unauthenticated';
  END IF;

  PERFORM 1 FROM public.trips t WHERE t.id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'trip_not_found';
  END IF;

  INSERT INTO public.trip_members (trip_id, user_id)
  VALUES (p_trip_id, caller)
  ON CONFLICT (trip_id, user_id) DO UPDATE SET left_at = NULL
  WHERE public.trip_members.left_at IS NOT NULL;
END;
$$;

ALTER FUNCTION "public"."join_trip"("p_trip_id" "uuid") OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."join_trip"("p_trip_id" "uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."join_trip"("p_trip_id" "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."join_trip"("p_trip_id" "uuid") TO "service_role";
