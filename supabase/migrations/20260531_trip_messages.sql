create table trip_messages (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  user_id     uuid not null references auth.users(id),
  content     text not null check (char_length(content) > 0),
  created_at  timestamptz not null default now()
);

create index on trip_messages(trip_id, created_at);

-- RLS: 멤버만 읽기/쓰기
alter table trip_messages enable row level security;

create policy "trip members can read messages"
  on trip_messages for select
  using (
    exists (
      select 1 from trip_members
      where trip_members.trip_id = trip_messages.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

create policy "trip members can insert messages"
  on trip_messages for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from trip_members
      where trip_members.trip_id = trip_messages.trip_id
        and trip_members.user_id = auth.uid()
    )
  );

-- Realtime 활성화
alter publication supabase_realtime add table trip_messages;
