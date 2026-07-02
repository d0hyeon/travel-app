


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."post_visibility" AS ENUM (
    'PRIVATE',
    'MEMBERS',
    'PUBLIC'
);


ALTER TYPE "public"."post_visibility" OWNER TO "postgres";


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
          WHERE m.trip_id = t.id AND m.user_id = auth.uid()
        )
      )
  );
$$;


ALTER FUNCTION "public"."can_access_trip"("trip_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_post"("post_visibility" "public"."post_visibility", "post_author" "uuid", "post_trip" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT
    post_visibility = 'PUBLIC'
    OR post_author = auth.uid()
    OR (post_visibility = 'MEMBERS' AND post_trip IS NOT NULL AND can_access_trip(post_trip));
$$;


ALTER FUNCTION "public"."can_view_post"("post_visibility" "public"."post_visibility", "post_author" "uuid", "post_trip" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_explored_places"("since_date" "date" DEFAULT NULL::"date") RETURNS TABLE("place_id" "uuid", "name" "text", "address" "text", "lat" double precision, "lng" double precision, "visitor_count" bigint, "destinations" "jsonb", "categories" "jsonb", "thumbnail_url" "text", "total_trips" bigint, "photo_count" bigint, "post_count" bigint, "score" double precision)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  WITH filtered_trips AS (
    SELECT id, destinations
    FROM trips
    WHERE since_date IS NULL OR end_date >= since_date
  ),
  route_places AS (
    SELECT
      r.trip_id,
      tp.place_id,
      tp.category
    FROM routes r
    JOIN filtered_trips t ON r.trip_id = t.id
    JOIN LATERAL unnest(r.place_ids) AS tp_id ON TRUE
    JOIN trip_places tp ON tp.id = tp_id
    WHERE tp.category IS DISTINCT FROM 'transit'
  ),
  trip_place_set AS (
    SELECT DISTINCT trip_id, place_id, category
    FROM route_places
  ),
  visit_counts AS (
    SELECT place_id, count(DISTINCT trip_id) AS visitor_count
    FROM trip_place_set
    GROUP BY place_id
  ),
  place_destinations AS (
    SELECT
      rp.place_id,
      jsonb_agg(DISTINCT dest) FILTER (WHERE dest IS NOT NULL) AS destinations
    FROM trip_place_set rp
    JOIN filtered_trips t ON rp.trip_id = t.id
    JOIN LATERAL jsonb_array_elements_text(t.destinations::jsonb) AS dest ON TRUE
    GROUP BY rp.place_id
  ),
  place_categories AS (
    SELECT place_id, jsonb_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL) AS categories
    FROM trip_place_set
    GROUP BY place_id
  ),
  photo_counts AS (
    SELECT place_id, count(*) AS photo_count
    FROM photos
    WHERE is_public = true
      AND place_id IN (SELECT place_id FROM visit_counts)
    GROUP BY place_id
  ),
  post_counts AS (
    SELECT pl.place_id, count(DISTINCT p.id) AS post_count
    FROM post_locations pl
    JOIN posts p ON p.id = pl.post_id
    WHERE p.visibility = 'PUBLIC'
      AND pl.place_id IN (SELECT place_id FROM visit_counts)
    GROUP BY pl.place_id
  ),
  thumbnails AS (
    SELECT place_id, url
    FROM (
      SELECT place_id, url, row_number() OVER (PARTITION BY place_id) AS rn
      FROM (
        SELECT ph.place_id, ph.url
        FROM photos ph
        WHERE ph.is_public = true
          AND ph.place_id IN (SELECT place_id FROM visit_counts)
      ) all_photos
    ) ranked
    WHERE rn = 1
  ),
  total AS (
    SELECT count(DISTINCT trip_id) AS total_trips FROM route_places
  ),
  score_params AS (
    SELECT
      NULLIF(max(vc.visitor_count), 0)::DOUBLE PRECISION AS max_visitor,
      NULLIF(max(COALESCE(pc.photo_count, 0)), 0)::DOUBLE PRECISION AS max_photo,
      NULLIF(max(COALESCE(po.post_count, 0)), 0)::DOUBLE PRECISION AS max_post
    FROM visit_counts vc
    LEFT JOIN photo_counts pc ON pc.place_id = vc.place_id
    LEFT JOIN post_counts po ON po.place_id = vc.place_id
  )
  SELECT
    p.id AS place_id,
    p.name,
    COALESCE(p.address, '') AS address,
    p.lat,
    p.lng,
    vc.visitor_count,
    COALESCE(pd.destinations, '[]'::jsonb) AS destinations,
    COALESCE(pc2.categories, '[]'::jsonb) AS categories,
    t2.url AS thumbnail_url,
    (SELECT total_trips FROM total) AS total_trips,
    COALESCE(phc.photo_count, 0) AS photo_count,
    COALESCE(poc.post_count, 0) AS post_count,
    (
      COALESCE(vc.visitor_count::DOUBLE PRECISION / sp.max_visitor, 0) * 0.6 +
      COALESCE(phc.photo_count::DOUBLE PRECISION / sp.max_photo, 0) * 0.2 +
      COALESCE(poc.post_count::DOUBLE PRECISION / sp.max_post, 0) * 0.2
    ) AS score
  FROM visit_counts vc
  JOIN places p ON p.id = vc.place_id
  LEFT JOIN place_destinations pd ON pd.place_id = vc.place_id
  LEFT JOIN place_categories pc2 ON pc2.place_id = vc.place_id
  LEFT JOIN thumbnails t2 ON t2.place_id = vc.place_id
  LEFT JOIN photo_counts phc ON phc.place_id = vc.place_id
  LEFT JOIN post_counts poc ON poc.place_id = vc.place_id
  CROSS JOIN score_params sp;
$$;


ALTER FUNCTION "public"."get_explored_places"("since_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_most_saved_places"() RETURNS TABLE("place_id" "uuid", "name" "text", "address" "text", "lat" double precision, "lng" double precision, "save_count" bigint, "destinations" "jsonb", "categories" "jsonb", "thumbnail_url" "text", "total_trips" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  WITH save_counts AS (
    SELECT tp.place_id, count(DISTINCT tp.trip_id) AS save_count
    FROM trip_places tp
    WHERE tp.category IS DISTINCT FROM 'transit'
    GROUP BY tp.place_id
  ),
  place_destinations AS (
    SELECT
      tp.place_id,
      jsonb_agg(DISTINCT dest) FILTER (WHERE dest IS NOT NULL) AS destinations
    FROM trip_places tp
    JOIN trips t ON tp.trip_id = t.id
    JOIN LATERAL jsonb_array_elements_text(t.destinations::jsonb) AS dest ON TRUE
    WHERE tp.place_id IN (SELECT place_id FROM save_counts)
    GROUP BY tp.place_id
  ),
  place_categories AS (
    SELECT place_id, jsonb_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL) AS categories
    FROM trip_places
    WHERE place_id IN (SELECT place_id FROM save_counts)
    GROUP BY place_id
  ),
  thumbnails AS (
    SELECT place_id, url
    FROM (
      SELECT place_id, url, row_number() OVER (PARTITION BY place_id) AS rn
      FROM (
        SELECT place_id, url FROM photos WHERE is_public = true AND place_id IN (SELECT place_id FROM save_counts)
      ) all_photos
    ) ranked
    WHERE rn = 1
  ),
  total AS (
    SELECT count(DISTINCT trip_id) AS total_trips FROM trip_places
  )
  SELECT
    p.id AS place_id,
    p.name,
    COALESCE(p.address, '') AS address,
    p.lat,
    p.lng,
    sc.save_count,
    COALESCE(pd.destinations, '[]'::jsonb) AS destinations,
    COALESCE(pc.categories, '[]'::jsonb) AS categories,
    t2.url AS thumbnail_url,
    (SELECT total_trips FROM total) AS total_trips
  FROM save_counts sc
  JOIN places p ON p.id = sc.place_id
  LEFT JOIN place_destinations pd ON pd.place_id = sc.place_id
  LEFT JOIN place_categories pc ON pc.place_id = sc.place_id
  LEFT JOIN thumbnails t2 ON t2.place_id = sc.place_id;
$$;


ALTER FUNCTION "public"."get_most_saved_places"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "destination" "text" NOT NULL,
    "lat" double precision NOT NULL,
    "lng" double precision NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "share_link" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_overseas" boolean DEFAULT false NOT NULL,
    "exchange_rate" numeric,
    "exchange_rates" "jsonb",
    "user_id" "uuid" NOT NULL,
    "destinations" "jsonb" NOT NULL
);


ALTER TABLE "public"."trips" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_trips"("p_user_id" "uuid") RETURNS SETOF "public"."trips"
    LANGUAGE "sql"
    AS $$
  select distinct t.*
  from trips t
  left join trip_members tm
    on tm.trip_id = t.id
  where
    t.user_id = p_user_id
    or tm.user_id = p_user_id
  order by t.start_date desc;
$$;


ALTER FUNCTION "public"."get_my_trips"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_routes_with_places_by_trip_id"("p_trip_id" "uuid") RETURNS TABLE("route_id" "uuid", "route_name" "text", "scheduled_date" "date", "place_id" "uuid", "place_name" "text", "place_address" "text", "place_lat" double precision, "place_lng" double precision, "place_order" integer)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT
    r.id AS route_id,
    r.name AS route_name,
    r.scheduled_date,
    tp.id AS place_id,
    pl.name AS place_name,
    pl.address AS place_address,
    pl.lat AS place_lat,
    pl.lng AS place_lng,
    array_position(r.place_ids, tp.id) AS place_order
  FROM routes r
  JOIN trip_places tp ON r.place_ids @> ARRAY[tp.id]
  JOIN places pl ON pl.id = tp.place_id
  WHERE r.trip_id = p_trip_id
  ORDER BY r.scheduled_date, place_order;
$$;


ALTER FUNCTION "public"."get_routes_with_places_by_trip_id"("p_trip_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_trip_by_share_link"("link" "uuid") RETURNS SETOF "public"."trips"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT * FROM trips WHERE share_link = link LIMIT 1;
$$;


ALTER FUNCTION "public"."get_trip_by_share_link"("link" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_trips_by_destination"("p_destinations" "text"[], "p_exclude_trip_id" "uuid") RETURNS TABLE("id" "uuid", "destinations" "text"[], "start_date" "text", "end_date" "text", "route_count" bigint, "member_count" bigint, "preview_coordinates" json)
    LANGUAGE "sql" STABLE
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
  LEFT JOIN trip_members tm ON tm.trip_id = t.id
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(t.destinations) d
    WHERE d = ANY(p_destinations)
  )
    AND t.id != p_exclude_trip_id
  GROUP BY t.id
$$;


ALTER FUNCTION "public"."get_trips_by_destination"("p_destinations" "text"[], "p_exclude_trip_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_trips"("p_user_id" "uuid") RETURNS SETOF "public"."trips"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT *
  FROM trips
  WHERE user_id = p_user_id
    OR id IN (SELECT trip_id FROM trip_members WHERE user_id = p_user_id)
  ORDER BY start_date DESC;
$$;


ALTER FUNCTION "public"."get_user_trips"("p_user_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "started_at" timestamp without time zone,
    "ended_at" timestamp without time zone,
    "is_completed" boolean DEFAULT false NOT NULL,
    "member_id" "uuid"
);


ALTER TABLE "public"."checklist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "place_id" "uuid",
    "description" "text",
    "total_amount" integer NOT NULL,
    "payments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "split_among" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "currency" "text" DEFAULT 'KRW'::"text"
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text"
);


ALTER TABLE "public"."memos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "place_id" "uuid",
    "url" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."places" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "lat" double precision NOT NULL,
    "lng" double precision NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provider" "text" DEFAULT 'legacy'::"text" NOT NULL,
    "external_id" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."places" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."post_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_likes" (
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_locations" (
    "post_id" "uuid" NOT NULL,
    "place_id" "uuid" NOT NULL,
    "display_order" integer NOT NULL
);


ALTER TABLE "public"."post_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_photos" (
    "post_id" "uuid" NOT NULL,
    "display_order" integer NOT NULL,
    "url" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "place_id" "uuid",
    "is_public" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."post_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "trip_id" "uuid",
    "title" "text",
    "description" "text",
    "visibility" "public"."post_visibility" DEFAULT 'PRIVATE'::"public"."post_visibility" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "photo_posts_check1" CHECK ((("visibility" <> 'MEMBERS'::"public"."post_visibility") OR ("trip_id" IS NOT NULL)))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subscription" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "endpoint" "text" NOT NULL
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "place_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "is_main" boolean DEFAULT false NOT NULL,
    "scheduled_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "place_memos" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "hidden_places" "uuid"[]
);


ALTER TABLE "public"."routes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."trip_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_name" "text" NOT NULL,
    CONSTRAINT "trip_messages_content_check" CHECK (("char_length"("content") > 0))
);


ALTER TABLE "public"."trip_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_places" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "place_id" "uuid" NOT NULL,
    "category" "text",
    "memo" "text",
    "status" "text" DEFAULT 'candidate'::"text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trip_places" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."checklist"
    ADD CONSTRAINT "checklist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memos"
    ADD CONSTRAINT "memos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "photo_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."places"
    ADD CONSTRAINT "places_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."places"
    ADD CONSTRAINT "places_provider_external_id_key" UNIQUE ("provider", "external_id");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY ("post_id", "user_id");



ALTER TABLE ONLY "public"."post_locations"
    ADD CONSTRAINT "post_locations_pkey" PRIMARY KEY ("post_id", "place_id");



ALTER TABLE ONLY "public"."post_photos"
    ADD CONSTRAINT "post_photos_pkey" PRIMARY KEY ("post_id", "display_order");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_endpoint_key" UNIQUE ("user_id", "endpoint");



ALTER TABLE ONLY "public"."routes"
    ADD CONSTRAINT "routes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_trip_id_user_id_key" UNIQUE ("trip_id", "user_id");



ALTER TABLE ONLY "public"."trip_messages"
    ADD CONSTRAINT "trip_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_places"
    ADD CONSTRAINT "trip_places_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_places"
    ADD CONSTRAINT "trip_places_trip_id_place_id_key" UNIQUE ("trip_id", "place_id");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_share_link_key" UNIQUE ("share_link");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_expenses_date" ON "public"."expenses" USING "btree" ("date");



CREATE INDEX "idx_expenses_place_id" ON "public"."expenses" USING "btree" ("place_id");



CREATE INDEX "idx_expenses_trip_id" ON "public"."expenses" USING "btree" ("trip_id");



CREATE INDEX "idx_photos_place_id" ON "public"."photos" USING "btree" ("place_id");



CREATE INDEX "idx_photos_trip_id" ON "public"."photos" USING "btree" ("trip_id");



CREATE INDEX "idx_post_comments_post" ON "public"."post_comments" USING "btree" ("post_id", "created_at" DESC);



CREATE INDEX "idx_post_locations_place" ON "public"."post_locations" USING "btree" ("place_id");



CREATE INDEX "idx_post_locations_post" ON "public"."post_locations" USING "btree" ("post_id", "display_order");



CREATE INDEX "idx_post_photos_place" ON "public"."post_photos" USING "btree" ("place_id") WHERE ("place_id" IS NOT NULL);



CREATE INDEX "idx_post_photos_post" ON "public"."post_photos" USING "btree" ("post_id", "display_order");



CREATE INDEX "idx_posts_author" ON "public"."posts" USING "btree" ("author_id", "created_at" DESC);



CREATE INDEX "idx_posts_public" ON "public"."posts" USING "btree" ("created_at" DESC) WHERE ("visibility" = 'PUBLIC'::"public"."post_visibility");



CREATE INDEX "idx_posts_trip" ON "public"."posts" USING "btree" ("trip_id", "created_at" DESC);



CREATE INDEX "idx_routes_trip_id" ON "public"."routes" USING "btree" ("trip_id");



CREATE INDEX "idx_trip_members_trip_id" ON "public"."trip_members" USING "btree" ("trip_id");



CREATE INDEX "idx_trip_places_place" ON "public"."trip_places" USING "btree" ("place_id");



CREATE INDEX "idx_trip_places_trip" ON "public"."trip_places" USING "btree" ("trip_id");



CREATE INDEX "idx_trips_exchange_rates" ON "public"."trips" USING "gin" ("exchange_rates");



CREATE INDEX "idx_trips_share_link" ON "public"."trips" USING "btree" ("share_link");



CREATE INDEX "trip_messages_trip_id_created_at_idx" ON "public"."trip_messages" USING "btree" ("trip_id", "created_at");



ALTER TABLE ONLY "public"."checklist"
    ADD CONSTRAINT "checklist_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."trip_places"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memos"
    ADD CONSTRAINT "memos_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "photo_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_locations"
    ADD CONSTRAINT "post_locations_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_locations"
    ADD CONSTRAINT "post_locations_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_photos"
    ADD CONSTRAINT "post_photos_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."post_photos"
    ADD CONSTRAINT "post_photos_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."routes"
    ADD CONSTRAINT "routes_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_members"
    ADD CONSTRAINT "trip_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_messages"
    ADD CONSTRAINT "trip_messages_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_messages"
    ADD CONSTRAINT "trip_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."trip_places"
    ADD CONSTRAINT "trip_places_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_places"
    ADD CONSTRAINT "trip_places_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow all for expenses" ON "public"."expenses" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all for places" ON "public"."places" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all for routes" ON "public"."routes" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all for trip_members" ON "public"."trip_members" USING (true) WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."checklist" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."expenses" FOR SELECT USING (true);



CREATE POLICY "Users can upsert own push subscriptions" ON "public"."push_subscriptions" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "authenticated users can insert messages" ON "public"."trip_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "authenticated users can read messages" ON "public"."trip_messages" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."checklist" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "checklist_access" ON "public"."checklist" USING ("public"."can_access_trip"("trip_id")) WITH CHECK ("public"."can_access_trip"("trip_id"));



ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "expenses_access" ON "public"."expenses" USING ("public"."can_access_trip"("trip_id")) WITH CHECK ("public"."can_access_trip"("trip_id"));



ALTER TABLE "public"."memos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "memos_access" ON "public"."memos" USING ("public"."can_access_trip"("trip_id")) WITH CHECK ("public"."can_access_trip"("trip_id"));



ALTER TABLE "public"."photos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "photos_delete" ON "public"."photos" FOR DELETE USING ("public"."can_access_trip"("trip_id"));



CREATE POLICY "photos_select" ON "public"."photos" FOR SELECT USING ((("is_public" = true) OR "public"."can_access_trip"("trip_id")));



CREATE POLICY "photos_update" ON "public"."photos" FOR UPDATE USING ("public"."can_access_trip"("trip_id")) WITH CHECK ("public"."can_access_trip"("trip_id"));



CREATE POLICY "photos_write" ON "public"."photos" FOR INSERT WITH CHECK ("public"."can_access_trip"("trip_id"));



ALTER TABLE "public"."places" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "places_insert" ON "public"."places" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "places_select" ON "public"."places" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_comments_delete" ON "public"."post_comments" FOR DELETE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "post_comments_insert" ON "public"."post_comments" FOR INSERT WITH CHECK ((("author_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_comments"."post_id") AND "public"."can_view_post"("p"."visibility", "p"."author_id", "p"."trip_id"))))));



CREATE POLICY "post_comments_select" ON "public"."post_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_comments"."post_id") AND "public"."can_view_post"("p"."visibility", "p"."author_id", "p"."trip_id")))));



CREATE POLICY "post_comments_update" ON "public"."post_comments" FOR UPDATE USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



ALTER TABLE "public"."post_likes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_likes_delete" ON "public"."post_likes" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "post_likes_insert" ON "public"."post_likes" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "post_likes_select" ON "public"."post_likes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_likes"."post_id") AND "public"."can_view_post"("p"."visibility", "p"."author_id", "p"."trip_id")))));



ALTER TABLE "public"."post_locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_locations_modify" ON "public"."post_locations" USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_locations"."post_id") AND ("p"."author_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_locations"."post_id") AND ("p"."author_id" = "auth"."uid"())))));



CREATE POLICY "post_locations_select" ON "public"."post_locations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_locations"."post_id") AND "public"."can_view_post"("p"."visibility", "p"."author_id", "p"."trip_id")))));



ALTER TABLE "public"."post_photos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_photos_modify" ON "public"."post_photos" USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_photos"."post_id") AND ("p"."author_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_photos"."post_id") AND ("p"."author_id" = "auth"."uid"())))));



CREATE POLICY "post_photos_select" ON "public"."post_photos" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."posts" "p"
  WHERE (("p"."id" = "post_photos"."post_id") AND "public"."can_view_post"("p"."visibility", "p"."author_id", "p"."trip_id")))));



ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "posts_delete" ON "public"."posts" FOR DELETE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "posts_insert" ON "public"."posts" FOR INSERT WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "posts_select" ON "public"."posts" FOR SELECT USING ("public"."can_view_post"("visibility", "author_id", "trip_id"));



CREATE POLICY "posts_update" ON "public"."posts" FOR UPDATE USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "profiles_insert" ON "public"."user_profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select" ON "public"."user_profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "profiles_update" ON "public"."user_profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "routes_access" ON "public"."routes" USING ("public"."can_access_trip"("trip_id")) WITH CHECK ("public"."can_access_trip"("trip_id"));



ALTER TABLE "public"."trip_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_members_delete" ON "public"."trip_members" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR ("trip_id" IN ( SELECT "trips"."id"
   FROM "public"."trips"
  WHERE ("trips"."user_id" = "auth"."uid"())))));



CREATE POLICY "trip_members_insert" ON "public"."trip_members" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "trip_members_select" ON "public"."trip_members" FOR SELECT USING ("public"."can_access_trip"("trip_id"));



ALTER TABLE "public"."trip_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trip_places" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_places_access" ON "public"."trip_places" USING ("public"."can_access_trip"("trip_id")) WITH CHECK ("public"."can_access_trip"("trip_id"));



ALTER TABLE "public"."trips" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trips_delete" ON "public"."trips" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "trips_insert" ON "public"."trips" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "trips_select" ON "public"."trips" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("id" IN ( SELECT "m"."trip_id"
   FROM "public"."trip_members" "m"
  WHERE ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "trips_update" ON "public"."trips" FOR UPDATE USING ("public"."can_access_trip"("id"));



ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."trip_messages";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."can_access_trip"("trip_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_trip"("trip_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_trip"("trip_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_post"("post_visibility" "public"."post_visibility", "post_author" "uuid", "post_trip" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_post"("post_visibility" "public"."post_visibility", "post_author" "uuid", "post_trip" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_post"("post_visibility" "public"."post_visibility", "post_author" "uuid", "post_trip" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_explored_places"("since_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_explored_places"("since_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_explored_places"("since_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_most_saved_places"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_most_saved_places"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_most_saved_places"() TO "service_role";



GRANT ALL ON TABLE "public"."trips" TO "anon";
GRANT ALL ON TABLE "public"."trips" TO "authenticated";
GRANT ALL ON TABLE "public"."trips" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_trips"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_trips"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_trips"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_routes_with_places_by_trip_id"("p_trip_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_routes_with_places_by_trip_id"("p_trip_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_routes_with_places_by_trip_id"("p_trip_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_trip_by_share_link"("link" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_trip_by_share_link"("link" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trip_by_share_link"("link" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_trips_by_destination"("p_destinations" "text"[], "p_exclude_trip_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_trips_by_destination"("p_destinations" "text"[], "p_exclude_trip_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trips_by_destination"("p_destinations" "text"[], "p_exclude_trip_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_trips"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_trips"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_trips"("p_user_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."checklist" TO "anon";
GRANT ALL ON TABLE "public"."checklist" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."memos" TO "anon";
GRANT ALL ON TABLE "public"."memos" TO "authenticated";
GRANT ALL ON TABLE "public"."memos" TO "service_role";



GRANT ALL ON TABLE "public"."photos" TO "anon";
GRANT ALL ON TABLE "public"."photos" TO "authenticated";
GRANT ALL ON TABLE "public"."photos" TO "service_role";



GRANT ALL ON TABLE "public"."places" TO "anon";
GRANT ALL ON TABLE "public"."places" TO "authenticated";
GRANT ALL ON TABLE "public"."places" TO "service_role";



GRANT ALL ON TABLE "public"."post_comments" TO "anon";
GRANT ALL ON TABLE "public"."post_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."post_comments" TO "service_role";



GRANT ALL ON TABLE "public"."post_likes" TO "anon";
GRANT ALL ON TABLE "public"."post_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."post_likes" TO "service_role";



GRANT ALL ON TABLE "public"."post_locations" TO "anon";
GRANT ALL ON TABLE "public"."post_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."post_locations" TO "service_role";



GRANT ALL ON TABLE "public"."post_photos" TO "anon";
GRANT ALL ON TABLE "public"."post_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."post_photos" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."routes" TO "anon";
GRANT ALL ON TABLE "public"."routes" TO "authenticated";
GRANT ALL ON TABLE "public"."routes" TO "service_role";



GRANT ALL ON TABLE "public"."trip_members" TO "anon";
GRANT ALL ON TABLE "public"."trip_members" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_members" TO "service_role";



GRANT ALL ON TABLE "public"."trip_messages" TO "anon";
GRANT ALL ON TABLE "public"."trip_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_messages" TO "service_role";



GRANT ALL ON TABLE "public"."trip_places" TO "anon";
GRANT ALL ON TABLE "public"."trip_places" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_places" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "profiles_select" on "public"."user_profiles";


  create policy "profiles_select"
  on "public"."user_profiles"
  as permissive
  for select
  to anon, authenticated
using (true);



