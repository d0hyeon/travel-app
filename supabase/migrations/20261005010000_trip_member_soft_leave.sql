ALTER TABLE "public"."trip_members"
    ADD COLUMN IF NOT EXISTS "left_at" timestamp with time zone;

CREATE OR REPLACE VIEW "public"."active_trip_members"
    WITH (security_invoker = true) AS
SELECT "id", "trip_id", "user_id", "created_at"
FROM "public"."trip_members"
WHERE "left_at" IS NULL;

ALTER VIEW "public"."active_trip_members" OWNER TO "postgres";
REVOKE ALL ON TABLE "public"."active_trip_members" FROM PUBLIC, "anon";
GRANT SELECT ON TABLE "public"."active_trip_members" TO "authenticated";
GRANT SELECT ON TABLE "public"."active_trip_members" TO "service_role";

CREATE OR REPLACE FUNCTION "public"."can_access_trip"("trip_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM trip_members m
          WHERE m.trip_id = t.id AND m.user_id = auth.uid() AND m.left_at IS NULL
        )
      )
  );
$$;

DROP POLICY IF EXISTS "trips_select" ON "public"."trips";
CREATE POLICY "trips_select" ON "public"."trips" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("id" IN ( SELECT "m"."trip_id"
   FROM "public"."active_trip_members" "m"
  WHERE ("m"."user_id" = "auth"."uid"())))));

CREATE OR REPLACE FUNCTION "public"."get_my_trips"("p_user_id" "uuid") RETURNS SETOF "public"."trips"
    LANGUAGE "sql"
    AS $$
  select distinct t.*
  from trips t
  left join active_trip_members tm
    on tm.trip_id = t.id
  where
    t.user_id = p_user_id
    or tm.user_id = p_user_id
  order by t.start_date desc;
$$;

CREATE OR REPLACE FUNCTION "public"."get_user_trips"("p_user_id" "uuid") RETURNS SETOF "public"."trips"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT *
  FROM trips
  WHERE user_id = p_user_id
    OR id IN (SELECT trip_id FROM trip_members WHERE user_id = p_user_id AND left_at IS NULL)
  ORDER BY start_date DESC;
$$;

CREATE OR REPLACE FUNCTION "public"."get_trips_by_destination"("p_destinations" "text"[], "p_exclude_trip_id" "uuid")
RETURNS TABLE(
  "id" "uuid",
  "destinations" "text"[],
  "start_date" "text",
  "end_date" "text",
  "route_count" bigint,
  "member_count" bigint,
  "preview_coordinates" json
)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    t.id,
    ARRAY(SELECT jsonb_array_elements_text(t.destinations)) AS destinations,
    t.start_date,
    t.end_date,
    COUNT(DISTINCT r.id) AS route_count,
    COUNT(DISTINCT tm.user_id) AS member_count,
    COALESCE(
      json_agg(
        json_build_object(
          'scheduledDate', r.scheduled_date,
          'coords', (
            SELECT COALESCE(
              json_agg(
                json_build_object('lat', p.lat, 'lng', p.lng)
                ORDER BY array_position(r.place_ids, tp.id)
              ) FILTER (WHERE p.id IS NOT NULL),
              '[]'::json
            )
            FROM unnest(r.place_ids) AS pid
            JOIN trip_places tp ON tp.id = pid
            JOIN places p ON p.id = tp.place_id
          )
        )
      ) FILTER (WHERE r.id IS NOT NULL),
      '[]'::json
    ) AS preview_coordinates
  FROM trips t
  LEFT JOIN routes r ON r.trip_id = t.id
  LEFT JOIN trip_members tm ON tm.trip_id = t.id AND tm.left_at IS NULL
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(t.destinations) d
    WHERE d = ANY(p_destinations)
  )
    AND t.id != p_exclude_trip_id
  GROUP BY t.id
$$;

DROP POLICY IF EXISTS "Members can read flight status" ON "public"."trip_transport_flight_status";
CREATE POLICY "Members can read flight status"
    ON "public"."trip_transport_flight_status" FOR SELECT TO "authenticated"
    USING (EXISTS (
        SELECT 1
        FROM "public"."trip_transports" "t"
        JOIN "public"."active_trip_members" "m" ON "m"."trip_id" = "t"."trip_id"
        WHERE "t"."id" = "trip_transport_flight_status"."transport_id"
          AND "m"."user_id" = "auth"."uid"()
    ));

CREATE OR REPLACE FUNCTION "public"."prepare_account_deletion"("target_user" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  owned_trip record;
  successor uuid;
  storage_paths text[] := '{}';
BEGIN
  FOR owned_trip IN SELECT t.id FROM public.trips t WHERE t.user_id = target_user FOR UPDATE LOOP
    SELECT m.user_id INTO successor
    FROM public.trip_members m
    WHERE m.trip_id = owned_trip.id AND m.user_id <> target_user AND m.left_at IS NULL
    ORDER BY m.created_at, m.id
    LIMIT 1;

    IF successor IS NOT NULL THEN
      UPDATE public.trips SET user_id = successor WHERE id = owned_trip.id;
    ELSE
      storage_paths := storage_paths
        || ARRAY(SELECT p.storage_path FROM public.photos p WHERE p.trip_id = owned_trip.id)
        || ARRAY(
          SELECT regexp_replace(k.image, '^https?://[^/]+/', '')
          FROM public.trip_transport_tickets k
          JOIN public.trip_transports r ON r.id = k.transport_id
          WHERE r.trip_id = owned_trip.id AND k.image IS NOT NULL
        );
      DELETE FROM public.trips WHERE id = owned_trip.id;
    END IF;
  END LOOP;

  storage_paths := storage_paths
    || ARRAY(SELECT p.storage_path FROM public.photos p WHERE p.user_id = target_user)
    || ARRAY(
      SELECT pp.storage_path
      FROM public.post_photos pp
      JOIN public.posts po ON po.id = pp.post_id
      WHERE po.author_id = target_user
    )
    || ARRAY(
      SELECT regexp_replace(k.image, '^https?://[^/]+/', '')
      FROM public.trip_transport_tickets k
      JOIN public.trip_members m ON m.id = k.member_id
      WHERE m.user_id = target_user AND k.image IS NOT NULL
    );

  DELETE FROM public.trip_transport_tickets k
  USING public.trip_members m
  WHERE m.id = k.member_id AND m.user_id = target_user;

  RETURN ARRAY(SELECT DISTINCT unnest(storage_paths));
END;
$$;

ALTER FUNCTION "public"."prepare_account_deletion"("target_user" "uuid") OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."prepare_account_deletion"("target_user" "uuid") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."prepare_account_deletion"("target_user" "uuid") TO "service_role";
