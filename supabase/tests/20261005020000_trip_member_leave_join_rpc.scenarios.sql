-- Scratch DB only. Apply migrations 20261005010000 and 20261005020000 first. Everything is rolled back at the end.
-- Each block prints one row: scenario, actual, expected. Run as a superuser/postgres session.

BEGIN;

CREATE TEMP TABLE _id (name text PRIMARY KEY, id uuid NOT NULL DEFAULT gen_random_uuid());
INSERT INTO _id (name) VALUES
  ('h'), ('a'), ('b'), ('c'), ('x'),
  ('t_member_leave'), ('t_host_leave'), ('t_skip_left'), ('t_only_host'), ('t_outsider'),
  ('t_serial_1'), ('t_serial_2'), ('t_rejoin'), ('t_first_join'), ('t_already_active'),
  ('t_legacy_host'), ('t_legacy_alone'), ('t_missing'), ('t_unauth'), ('t_grants');
GRANT SELECT ON _id TO anon;

INSERT INTO auth.users (id) SELECT id FROM _id WHERE name IN ('h', 'a', 'b', 'c', 'x');

CREATE FUNCTION pg_temp._i(p_name text) RETURNS uuid LANGUAGE sql AS $$ SELECT id FROM _id WHERE name = p_name $$;

CREATE FUNCTION pg_temp._as(p_name text) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', json_build_object('sub', pg_temp._i(p_name))::text, true)
$$;

CREATE FUNCTION pg_temp._as_anon() RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', '{}', true)
$$;

CREATE FUNCTION pg_temp._try(p_sql text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RETURN 'ok';
EXCEPTION WHEN OTHERS THEN
  RETURN SQLERRM;
END
$$;

CREATE FUNCTION pg_temp._leave(p_trip text) RETURNS text LANGUAGE sql AS $$
  SELECT pg_temp._try(format('SELECT public.leave_trip(%L)', pg_temp._i(p_trip)))
$$;

CREATE FUNCTION pg_temp._join(p_trip text) RETURNS text LANGUAGE sql AS $$
  SELECT pg_temp._try(format('SELECT public.join_trip(%L)', pg_temp._i(p_trip)))
$$;

CREATE FUNCTION pg_temp._seed(p_trip text, p_host text, p_host_row boolean, p_active text[], p_left text[]) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  n text;
  i int := 0;
BEGIN
  INSERT INTO public.trips (id, name, destination, lat, lng, start_date, end_date, user_id, destinations)
  VALUES (pg_temp._i(p_trip), p_trip, 'Tokyo', 0, 0, '2026-11-01', '2026-11-03', pg_temp._i(p_host), '["Tokyo"]'::jsonb);

  IF p_host_row THEN
    INSERT INTO public.trip_members (trip_id, user_id, created_at)
    VALUES (pg_temp._i(p_trip), pg_temp._i(p_host), now() - interval '100 days');
  END IF;

  FOREACH n IN ARRAY p_left LOOP
    INSERT INTO public.trip_members (trip_id, user_id, created_at, left_at)
    VALUES (pg_temp._i(p_trip), pg_temp._i(n), now() - interval '50 days', now() - interval '1 day');
  END LOOP;

  FOREACH n IN ARRAY p_active LOOP
    i := i + 1;
    INSERT INTO public.trip_members (trip_id, user_id, created_at)
    VALUES (pg_temp._i(p_trip), pg_temp._i(n), now() - interval '40 days' + i * interval '1 day');
  END LOOP;
END
$$;

CREATE FUNCTION pg_temp._seed_records(p_trip text, p_ticket_owner text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  transport uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.expenses (trip_id, total_amount) VALUES (pg_temp._i(p_trip), 1000);

  INSERT INTO public.trip_transports (id, trip_id, type, departure_name, arrival_name, departure_at)
  VALUES (transport, pg_temp._i(p_trip), 'flight', 'ICN', 'NRT', now());

  INSERT INTO public.trip_transport_tickets (transport_id, member_id)
  SELECT transport, m.id FROM public.trip_members m
  WHERE m.trip_id = pg_temp._i(p_trip) AND m.user_id = pg_temp._i(p_ticket_owner);
END
$$;

CREATE FUNCTION pg_temp._left_at_is_null(p_trip text, p_user text) RETURNS boolean LANGUAGE sql AS $$
  SELECT left_at IS NULL FROM public.trip_members
  WHERE trip_id = pg_temp._i(p_trip) AND user_id = pg_temp._i(p_user)
$$;

CREATE FUNCTION pg_temp._host(p_trip text) RETURNS text LANGUAGE sql AS $$
  SELECT i.name FROM public.trips t JOIN _id i ON i.id = t.user_id WHERE t.id = pg_temp._i(p_trip)
$$;

SELECT pg_temp._seed('t_member_leave', 'h', true, ARRAY['a', 'b'], ARRAY[]::text[]);
SELECT pg_temp._seed('t_host_leave', 'h', true, ARRAY['a', 'b'], ARRAY[]::text[]);
SELECT pg_temp._seed('t_skip_left', 'h', true, ARRAY['b'], ARRAY['c']);
SELECT pg_temp._seed('t_only_host', 'h', true, ARRAY[]::text[], ARRAY['c']);
SELECT pg_temp._seed('t_outsider', 'h', true, ARRAY['a'], ARRAY[]::text[]);
SELECT pg_temp._seed('t_serial_1', 'h', true, ARRAY['a'], ARRAY[]::text[]);
SELECT pg_temp._seed('t_serial_2', 'h', true, ARRAY['a'], ARRAY[]::text[]);
SELECT pg_temp._seed('t_rejoin', 'h', true, ARRAY['a'], ARRAY['c']);
SELECT pg_temp._seed('t_first_join', 'h', true, ARRAY['a'], ARRAY[]::text[]);
SELECT pg_temp._seed('t_already_active', 'h', true, ARRAY['a'], ARRAY[]::text[]);
SELECT pg_temp._seed('t_legacy_host', 'h', false, ARRAY['a'], ARRAY[]::text[]);
SELECT pg_temp._seed('t_legacy_alone', 'h', false, ARRAY[]::text[], ARRAY[]::text[]);
SELECT pg_temp._seed('t_unauth', 'h', true, ARRAY['a'], ARRAY[]::text[]);

-- Foreign keys and triggers stay active everywhere except the transport/ticket seed, whose sync-job triggers are not under test.
SET LOCAL session_replication_role = replica;
SELECT pg_temp._seed_records('t_member_leave', 'a');
SELECT pg_temp._seed_records('t_rejoin', 'c');
SET LOCAL session_replication_role = origin;

-- scenario: 멤버가 나가면 본인 행에만 left_at 이 찍히고 다른 행·기록은 그대로다
SELECT pg_temp._as('a');
SELECT 'member leave: call ok' AS scenario, pg_temp._leave('t_member_leave') AS actual, 'ok' AS expected;
SELECT 'member leave: own row stamped' AS scenario, pg_temp._left_at_is_null('t_member_leave', 'a') AS actual, false AS expected;
SELECT 'member leave: other rows untouched' AS scenario,
       pg_temp._left_at_is_null('t_member_leave', 'h') AND pg_temp._left_at_is_null('t_member_leave', 'b') AS actual, true AS expected;
SELECT 'member leave: host unchanged' AS scenario, pg_temp._host('t_member_leave') AS actual, 'h' AS expected;
SELECT 'member leave: expense and ticket kept' AS scenario,
       (SELECT count(*) FROM public.expenses WHERE trip_id = pg_temp._i('t_member_leave'))
       + (SELECT count(*) FROM public.trip_transport_tickets k JOIN public.trip_members m ON m.id = k.member_id
          WHERE m.trip_id = pg_temp._i('t_member_leave') AND m.user_id = pg_temp._i('a')) AS actual, 2 AS expected;

-- scenario: 호스트가 나가면 가장 먼저 합류한 활성 멤버가 호스트가 되고 호스트 행에 left_at 이 찍힌다
SELECT pg_temp._as('h');
SELECT 'host leave: call ok' AS scenario, pg_temp._leave('t_host_leave') AS actual, 'ok' AS expected;
SELECT 'host leave: earliest active member becomes host' AS scenario, pg_temp._host('t_host_leave') AS actual, 'a' AS expected;
SELECT 'host leave: host row stamped' AS scenario, pg_temp._left_at_is_null('t_host_leave', 'h') AS actual, false AS expected;
SELECT 'host leave: successor and others stay active' AS scenario,
       pg_temp._left_at_is_null('t_host_leave', 'a') AND pg_temp._left_at_is_null('t_host_leave', 'b') AS actual, true AS expected;

-- scenario: 승계 후보 선정에서 이미 탈퇴한 멤버는 건너뛴다 (c 는 가장 일찍 합류했지만 탈퇴 상태)
SELECT 'skip left: call ok' AS scenario, pg_temp._leave('t_skip_left') AS actual, 'ok' AS expected;
SELECT 'skip left: active member becomes host' AS scenario, pg_temp._host('t_skip_left') AS actual, 'b' AS expected;
SELECT pg_temp._as('c');
SELECT 'skip left: already-left member leaving again' AS scenario, pg_temp._leave('t_skip_left') AS actual, 'not_a_member' AS expected;

-- scenario: 활성 멤버가 호스트뿐일 때 호스트가 나가면 last_member 이고 상태는 바뀌지 않는다
SELECT pg_temp._as('h');
SELECT 'only host: raises last_member' AS scenario, pg_temp._leave('t_only_host') AS actual, 'last_member' AS expected;
SELECT 'only host: host unchanged' AS scenario, pg_temp._host('t_only_host') AS actual, 'h' AS expected;
SELECT 'only host: host row still active' AS scenario, pg_temp._left_at_is_null('t_only_host', 'h') AS actual, true AS expected;
SELECT 'only host: left member row unchanged' AS scenario, pg_temp._left_at_is_null('t_only_host', 'c') AS actual, false AS expected;

-- scenario: 활성 멤버가 아닌 사람의 leave_trip 은 not_a_member 다
SELECT pg_temp._as('x');
SELECT 'outsider leave: raises not_a_member' AS scenario, pg_temp._leave('t_outsider') AS actual, 'not_a_member' AS expected;
SELECT 'outsider leave: no row created' AS scenario,
       (SELECT count(*) FROM public.trip_members WHERE trip_id = pg_temp._i('t_outsider') AND user_id = pg_temp._i('x')) AS actual, 0 AS expected;

-- scenario: 호스트와 다른 멤버가 차례로 나가도 활성 멤버 0명으로 끝나지 않는다 (직렬화 결과; 실제 동시성은 파일 끝의 수동 절차)
SELECT pg_temp._as('h');
SELECT 'serial host then member: host leaves ok' AS scenario, pg_temp._leave('t_serial_1') AS actual, 'ok' AS expected;
SELECT pg_temp._as('a');
SELECT 'serial host then member: new host cannot leave' AS scenario, pg_temp._leave('t_serial_1') AS actual, 'last_member' AS expected;
SELECT 'serial host then member: one active member remains' AS scenario,
       (SELECT count(*) FROM public.active_trip_members WHERE trip_id = pg_temp._i('t_serial_1')) AS actual, 1 AS expected;

SELECT 'serial member then host: member leaves ok' AS scenario, pg_temp._leave('t_serial_2') AS actual, 'ok' AS expected;
SELECT pg_temp._as('h');
SELECT 'serial member then host: host cannot leave' AS scenario, pg_temp._leave('t_serial_2') AS actual, 'last_member' AS expected;
SELECT 'serial member then host: host still active and still host' AS scenario,
       (SELECT count(*) FROM public.active_trip_members WHERE trip_id = pg_temp._i('t_serial_2')) AS actual, 1 AS expected;

-- scenario: 탈퇴한 사람이 join_trip 하면 left_at 이 NULL 이 되고 기존 지출·티켓이 그대로 보인다
SELECT pg_temp._as('c');
SELECT 'rejoin: can_access_trip false before' AS scenario, public.can_access_trip(pg_temp._i('t_rejoin')) AS actual, false AS expected;
SELECT 'rejoin: call ok' AS scenario, pg_temp._join('t_rejoin') AS actual, 'ok' AS expected;
SELECT 'rejoin: left_at cleared' AS scenario, pg_temp._left_at_is_null('t_rejoin', 'c') AS actual, true AS expected;
SELECT 'rejoin: still a single row for the user' AS scenario,
       (SELECT count(*) FROM public.trip_members WHERE trip_id = pg_temp._i('t_rejoin') AND user_id = pg_temp._i('c')) AS actual, 1 AS expected;
SELECT 'rejoin: can_access_trip true after' AS scenario, public.can_access_trip(pg_temp._i('t_rejoin')) AS actual, true AS expected;
SELECT 'rejoin: expense and own ticket kept' AS scenario,
       (SELECT count(*) FROM public.expenses WHERE trip_id = pg_temp._i('t_rejoin'))
       + (SELECT count(*) FROM public.trip_transport_tickets k JOIN public.trip_members m ON m.id = k.member_id
          WHERE m.trip_id = pg_temp._i('t_rejoin') AND m.user_id = pg_temp._i('c')) AS actual, 2 AS expected;

-- scenario: 처음 join_trip 하는 사람은 새 행이 생긴다
SELECT pg_temp._as('x');
SELECT 'first join: call ok' AS scenario, pg_temp._join('t_first_join') AS actual, 'ok' AS expected;
SELECT 'first join: new active row for caller' AS scenario,
       (SELECT count(*) FROM public.active_trip_members WHERE trip_id = pg_temp._i('t_first_join') AND user_id = pg_temp._i('x')) AS actual, 1 AS expected;

-- scenario: 이미 활성인 사람의 join_trip 은 아무 일도 하지 않는다 (에러 아님)
SELECT pg_temp._as('a');
CREATE TEMP TABLE _before AS
SELECT id, created_at FROM public.trip_members WHERE trip_id = pg_temp._i('t_already_active') AND user_id = pg_temp._i('a');
SELECT 'already active: call ok' AS scenario, pg_temp._join('t_already_active') AS actual, 'ok' AS expected;
SELECT 'already active: row unchanged' AS scenario,
       (SELECT count(*) FROM public.trip_members m JOIN _before b USING (id, created_at)
        WHERE m.trip_id = pg_temp._i('t_already_active') AND m.user_id = pg_temp._i('a') AND m.left_at IS NULL) AS actual, 1 AS expected;
SELECT 'already active: no duplicate row' AS scenario,
       (SELECT count(*) FROM public.trip_members WHERE trip_id = pg_temp._i('t_already_active') AND user_id = pg_temp._i('a')) AS actual, 1 AS expected;

-- scenario: trip_members 행이 없는 호스트도 승계자가 있으면 나갈 수 있다
SELECT pg_temp._as('h');
SELECT 'legacy host: call ok' AS scenario, pg_temp._leave('t_legacy_host') AS actual, 'ok' AS expected;
SELECT 'legacy host: successor becomes host' AS scenario, pg_temp._host('t_legacy_host') AS actual, 'a' AS expected;
SELECT 'legacy host: no row created for the old host' AS scenario,
       (SELECT count(*) FROM public.trip_members WHERE trip_id = pg_temp._i('t_legacy_host') AND user_id = pg_temp._i('h')) AS actual, 0 AS expected;
SELECT 'legacy host alone: raises last_member' AS scenario, pg_temp._leave('t_legacy_alone') AS actual, 'last_member' AS expected;
SELECT 'legacy host alone: host unchanged' AS scenario, pg_temp._host('t_legacy_alone') AS actual, 'h' AS expected;

-- scenario: 존재하지 않는 여행은 예외다
SELECT 'missing trip: leave raises trip_not_found' AS scenario, pg_temp._leave('t_missing') AS actual, 'trip_not_found' AS expected;
SELECT 'missing trip: join raises trip_not_found' AS scenario, pg_temp._join('t_missing') AS actual, 'trip_not_found' AS expected;

-- scenario: 비로그인 호출은 예외다
SELECT pg_temp._as_anon();
SELECT 'unauthenticated: join raises' AS scenario, pg_temp._join('t_unauth') AS actual, 'unauthenticated' AS expected;
SELECT 'unauthenticated: leave raises' AS scenario, pg_temp._leave('t_unauth') AS actual, 'unauthenticated' AS expected;
SELECT 'unauthenticated: no rows added' AS scenario,
       (SELECT count(*) FROM public.trip_members WHERE trip_id = pg_temp._i('t_unauth')) AS actual, 2 AS expected;

-- scenario: anon 은 실행할 수 없고 authenticated 는 실행할 수 있다
SELECT 'grants: anon cannot execute' AS scenario,
       has_function_privilege('anon', 'public.leave_trip(uuid)', 'EXECUTE')
       OR has_function_privilege('anon', 'public.join_trip(uuid)', 'EXECUTE') AS actual, false AS expected;
SELECT 'grants: authenticated can execute' AS scenario,
       has_function_privilege('authenticated', 'public.leave_trip(uuid)', 'EXECUTE')
       AND has_function_privilege('authenticated', 'public.join_trip(uuid)', 'EXECUTE') AS actual, true AS expected;
SET LOCAL ROLE anon;
SELECT 'grants: anon call is denied' AS scenario,
       pg_temp._try(format('SELECT public.join_trip(%L)', pg_temp._i('t_grants'))) AS actual,
       'permission denied for function join_trip' AS expected;
RESET ROLE;

ROLLBACK;

-- MANUAL (cannot run inside one transaction): 호스트와 다른 멤버가 동시에 나갈 때의 잠금 직렬화
--
-- Setup (committed, scratch DB only; clean up afterwards):
--   trip T with host H (trip_members row, oldest) and one active member A.
--
-- Session A:
--   BEGIN;
--   SELECT set_config('request.jwt.claims', json_build_object('sub', '<H>')::text, true);
--   SELECT public.leave_trip('<T>');          -- takes the trips row lock, hands host to A, stamps H
--   -- do not COMMIT yet
--
-- Session B:
--   BEGIN;
--   SELECT set_config('request.jwt.claims', json_build_object('sub', '<A>')::text, true);
--   SELECT public.leave_trip('<T>');          -- must BLOCK on the trips row lock
--
-- Session A:  COMMIT;
--
-- Expected: Session B unblocks and raises 'last_member' (A is now host and the only active member).
-- Afterwards: exactly one active_trip_members row for T (A), trips.user_id = A.
-- Repeat with the roles swapped (A leaves first and commits, then H) -> H gets 'last_member'.
-- Also verify join_trip blocks the same way: with Session A holding an uncommitted leave_trip,
-- a third session's join_trip('<T>') must wait until Session A commits or rolls back.
