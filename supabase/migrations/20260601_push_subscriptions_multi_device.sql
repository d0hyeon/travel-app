-- endpoint 컬럼 추가 및 기존 데이터 마이그레이션
alter table push_subscriptions
  add column if not exists endpoint text;

-- 기존 레코드에서 endpoint 추출
update push_subscriptions
  set endpoint = subscription->>'endpoint'
  where endpoint is null;

-- not null 제약 추가
alter table push_subscriptions
  alter column endpoint set not null;

-- 기존 user_id unique constraint 제거 (있다면)
alter table push_subscriptions
  drop constraint if exists push_subscriptions_user_id_key;

-- 중복 레코드 제거 (user_id + endpoint 기준으로 가장 최근 것만 유지)
delete from push_subscriptions
  where id not in (
    select distinct on (user_id, endpoint) id
    from push_subscriptions
    order by user_id, endpoint, created_at desc
  );

-- user_id + endpoint 복합 unique constraint
alter table push_subscriptions
  add constraint push_subscriptions_user_id_endpoint_key unique (user_id, endpoint);
