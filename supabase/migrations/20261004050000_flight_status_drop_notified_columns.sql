ALTER TABLE "public"."trip_transport_flight_status"
    DROP COLUMN IF EXISTS "last_notified_kind",
    DROP COLUMN IF EXISTS "last_notified_estimated_at",
    DROP COLUMN IF EXISTS "last_notified_gate";
