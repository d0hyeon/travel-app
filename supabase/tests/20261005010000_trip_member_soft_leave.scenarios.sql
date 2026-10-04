-- Scratch DB only. Apply migration 20261005010000 first. Everything is rolled back at the end.
-- Each block prints one row: scenario, actual, expected.

BEGIN;

SET LOCAL session_replication_role = replica;

CREATE TEMP TABLE _ids AS SELECT
  gen_random_uuid() AS host,
  gen_random_uuid() AS active_member,
  gen_random_uuid() AS left_member,
  gen_random_uuid() AS other_left_member,
  gen_random_uuid() AS trip,
  gen_random_uuid() AS trip_no_successor,
  gen_random_uuid() AS transport,
  gen_random_uuid() AS other_trip;
GRANT SELECT ON _ids TO authenticated;

INSERT INTO auth.users (id) SELECT host FROM _ids UNION SELECT active_member FROM _ids UNION SELECT left_member FROM _ids UNION SELECT other_left_member FROM _ids;

INSERT INTO public.trips (id, name, destination, lat, lng, start_date, end_date, user_id, destinations)
SELECT trip, 'soft-leave', 'Tokyo', 0, 0, '2026-11-01', '2026-11-03', host, '["Tokyo"]'::jsonb FROM _ids
UNION ALL
SELECT trip_no_successor, 'only-left-member', 'Osaka', 0, 0, '2026-11-01', '2026-11-03', left_member, '["Osaka"]'::jsonb FROM _ids;

INSERT INTO public.trip_members (trip_id, user_id, created_at, left_at)
SELECT trip, active_member, now() - interval '1 day', NULL FROM _ids
UNION ALL
SELECT trip, left_member, now() - interval '2 days', now() FROM _ids
UNION ALL
SELECT trip_no_successor, other_left_member, now() - interval '3 days', now() FROM _ids;

INSERT INTO public.trip_transports (id, trip_id, type, departure_name, arrival_name, departure_at)
SELECT transport, trip, 'flight', 'ICN', 'NRT', now() FROM _ids;

INSERT INTO public.trip_transport_flight_status (transport_id, kind)
SELECT transport, 'scheduled' FROM _ids;

SET LOCAL session_replication_role = origin;

SET LOCAL ROLE authenticated;

-- scenario: 활성 멤버는 can_access_trip 이 true 다
SELECT set_config('request.jwt.claims', json_build_object('sub', active_member)::text, true) FROM _ids;
SELECT 'active member can_access_trip' AS scenario,
       public.can_access_trip(trip) AS actual, true AS expected FROM _ids;

-- scenario: 탈퇴한 멤버는 can_access_trip 이 false 다
SELECT set_config('request.jwt.claims', json_build_object('sub', left_member)::text, true) FROM _ids;
SELECT 'left member can_access_trip' AS scenario,
       public.can_access_trip(trip) AS actual, false AS expected FROM _ids;

-- scenario: 호스트는 trip_members 행 없이도 접근된다
SELECT set_config('request.jwt.claims', json_build_object('sub', host)::text, true) FROM _ids;
SELECT 'host without member row can_access_trip' AS scenario,
       public.can_access_trip(trip) AS actual, true AS expected FROM _ids;

-- scenario: 탈퇴한 멤버의 get_my_trips / get_user_trips 에 해당 여행이 나오지 않는다
SELECT set_config('request.jwt.claims', json_build_object('sub', left_member)::text, true) FROM _ids;
SELECT 'left member get_my_trips excludes trip' AS scenario,
       NOT EXISTS (SELECT 1 FROM public.get_my_trips(left_member) g WHERE g.id = trip) AS actual, true AS expected FROM _ids;
SELECT 'left member get_user_trips excludes trip' AS scenario,
       NOT EXISTS (SELECT 1 FROM public.get_user_trips(left_member) g WHERE g.id = trip) AS actual, true AS expected FROM _ids;
SELECT 'left member trips_select hides trip' AS scenario,
       NOT EXISTS (SELECT 1 FROM public.trips t WHERE t.id = (SELECT trip FROM _ids)) AS actual, true AS expected;

SELECT set_config('request.jwt.claims', json_build_object('sub', active_member)::text, true) FROM _ids;
SELECT 'active member get_my_trips includes trip' AS scenario,
       EXISTS (SELECT 1 FROM public.get_my_trips(active_member) g WHERE g.id = trip) AS actual, true AS expected FROM _ids;
SELECT 'active member get_user_trips includes trip' AS scenario,
       EXISTS (SELECT 1 FROM public.get_user_trips(active_member) g WHERE g.id = trip) AS actual, true AS expected FROM _ids;
SELECT 'active member trips_select shows trip' AS scenario,
       EXISTS (SELECT 1 FROM public.trips t WHERE t.id = (SELECT trip FROM _ids)) AS actual, true AS expected;

-- scenario: get_trips_by_destination 의 member_count 에 탈퇴자가 포함되지 않는다
SELECT 'member_count excludes left member' AS scenario,
       (SELECT g.member_count FROM public.get_trips_by_destination(ARRAY['Tokyo'], other_trip) g WHERE g.id = trip) AS actual,
       1 AS expected
FROM _ids;

-- scenario: 탈퇴한 멤버는 항공편 상태를 읽을 수 없다
SELECT set_config('request.jwt.claims', json_build_object('sub', left_member)::text, true) FROM _ids;
SELECT 'left member cannot read flight status' AS scenario,
       (SELECT count(*) FROM public.trip_transport_flight_status) AS actual, 0 AS expected;

SELECT set_config('request.jwt.claims', json_build_object('sub', active_member)::text, true) FROM _ids;
SELECT 'active member can read flight status' AS scenario,
       (SELECT count(*) FROM public.trip_transport_flight_status) AS actual, 1 AS expected;

RESET ROLE;

-- scenario: prepare_account_deletion 은 탈퇴한 멤버를 승계 후보로 고르지 않는다
-- host 삭제 시: 활성 멤버(active_member)가 승계해 trip 이 남아야 한다(탈퇴자는 후보 아님)
SELECT public.prepare_account_deletion(host) FROM _ids;
SELECT 'successor is the active member' AS scenario,
       (SELECT user_id FROM public.trips WHERE id = (SELECT trip FROM _ids)) = (SELECT active_member FROM _ids) AS actual,
       true AS expected;

-- 활성 후보가 없으면(탈퇴자만 남음) 여행이 삭제된다: 탈퇴자에게 승계되지 않는다
-- trip_no_successor 의 유일한 다른 멤버 other_left_member 는 탈퇴 상태라 후보가 아니다 -> 삭제 기대
SELECT public.prepare_account_deletion(left_member) FROM _ids;
SELECT 'trip without active successor is deleted' AS scenario,
       NOT EXISTS (SELECT 1 FROM public.trips WHERE id = (SELECT trip_no_successor FROM _ids)) AS actual,
       true AS expected;

-- 활성 후보가 있는 trip 은 위 두 호출 이후에도 삭제되지 않았어야 한다
SELECT 'trip with active successor survives' AS scenario,
       EXISTS (SELECT 1 FROM public.trips WHERE id = (SELECT trip FROM _ids)) AS actual,
       true AS expected;

ROLLBACK;
