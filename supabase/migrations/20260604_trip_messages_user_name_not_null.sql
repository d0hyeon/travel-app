-- user_name 백필: user_profiles.name으로 채움
update trip_messages m
set user_name = p.name
from user_profiles p
where m.user_id = p.id
  and m.user_name is null;

-- NOT NULL 제약 추가
alter table trip_messages
  alter column user_name set not null;
