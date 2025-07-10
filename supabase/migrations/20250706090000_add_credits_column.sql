-- alter table profiles
--   add column credits integer not null default 50;

-- Set unlimited credits for Pro plan users (optional, can remain null later)
update profiles
  set credits = null
  where subscription_plan = 'pro'; 