CREATE OR REPLACE FUNCTION "public"."can_view_post"("post_visibility" "public"."post_visibility", "post_author" "uuid", "post_trip" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    (
      post_visibility = 'PUBLIC'
      OR post_author = auth.uid()
      OR (post_visibility = 'MEMBERS' AND post_trip IS NOT NULL AND public.can_access_trip(post_trip))
    )
    AND NOT public.has_blocked(post_author);
$$;
