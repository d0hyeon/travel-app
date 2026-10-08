alter table public.routes
  add column if not exists place_times jsonb not null default '{}'::jsonb;

comment on column public.routes.place_times is
  '경로 안 장소별 방문 시간. { placeId: { startTime: "HH:mm" | null, endTime: "HH:mm" | null } }';
