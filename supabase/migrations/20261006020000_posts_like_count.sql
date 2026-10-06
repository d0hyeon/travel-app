ALTER TABLE "public"."posts" ADD COLUMN "like_count" integer DEFAULT 0 NOT NULL;

CREATE OR REPLACE FUNCTION "public"."sync_post_like_count"() RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "public"."posts" SET "like_count" = "like_count" + 1 WHERE "id" = NEW."post_id";
    RETURN NEW;
  END IF;

  UPDATE "public"."posts" SET "like_count" = GREATEST("like_count" - 1, 0) WHERE "id" = OLD."post_id";
  RETURN OLD;
END;
$$;

CREATE TRIGGER "post_likes_sync_like_count"
AFTER INSERT OR DELETE ON "public"."post_likes"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_post_like_count"();

UPDATE "public"."posts" "p"
SET "like_count" = "c"."like_count"
FROM (
  SELECT "post_id", "count"(*)::integer AS "like_count"
  FROM "public"."post_likes"
  GROUP BY "post_id"
) "c"
WHERE "c"."post_id" = "p"."id";

CREATE OR REPLACE FUNCTION "public"."protect_post_like_count"() RETURNS "trigger"
LANGUAGE "plpgsql"
SET "search_path" TO 'public'
AS $$
BEGIN
  IF pg_trigger_depth() = 1 THEN
    NEW."like_count" := OLD."like_count";
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "posts_protect_like_count"
BEFORE UPDATE ON "public"."posts"
FOR EACH ROW EXECUTE FUNCTION "public"."protect_post_like_count"();
