-- 티켓 한 행은 탑승자 한 명(member_id 단수)의 탑승권 한 장이다.
-- images 배열은 쓰인 적이 없고 코드가 늘 [url] 한 장만 넣었다.
-- 배열을 두면 "한 행에 두 장"이라는 표현할 수 없는 상태가 스키마에 남는다.

ALTER TABLE "public"."trip_transport_tickets"
  ADD COLUMN IF NOT EXISTS "image" "text";

-- 두 장 이상인 행은 없지만, 있더라도 첫 장만 남기지 않고 행으로 펼친다.
-- 한 행 = 한 장이 새 규칙이므로 나머지를 버리면 사용자 데이터가 사라진다.
INSERT INTO "public"."trip_transport_tickets" ("transport_id", "member_id", "image", "created_at")
SELECT "transport_id", "member_id", "extra"."image", "created_at"
FROM "public"."trip_transport_tickets",
     LATERAL unnest("images"[2:]) AS "extra"("image")
WHERE array_length("images", 1) > 1;

UPDATE "public"."trip_transport_tickets"
  SET "image" = "images"[1]
  WHERE "image" IS NULL AND array_length("images", 1) >= 1;

ALTER TABLE "public"."trip_transport_tickets"
  DROP COLUMN "images";
