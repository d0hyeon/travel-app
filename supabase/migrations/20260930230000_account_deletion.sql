ALTER TABLE "public"."photos"
    DROP CONSTRAINT "photos_user_id_fkey",
    ADD CONSTRAINT "photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."post_comments"
    DROP CONSTRAINT "post_comments_author_id_fkey",
    ADD CONSTRAINT "post_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."trip_messages"
    DROP CONSTRAINT "trip_messages_user_id_fkey",
    ADD CONSTRAINT "trip_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION "public"."prepare_account_deletion"("target_user" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  owned_trip record;
  successor uuid;
  storage_paths text[] := '{}';
BEGIN
  FOR owned_trip IN SELECT t.id FROM public.trips t WHERE t.user_id = target_user LOOP
    SELECT m.user_id INTO successor
    FROM public.trip_members m
    WHERE m.trip_id = owned_trip.id AND m.user_id <> target_user
    ORDER BY m.created_at
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
