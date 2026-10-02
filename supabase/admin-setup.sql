-- IconLab admin activation helper
-- 1) Create the administrator in Supabase Dashboard:
--    Authentication > Users > Add user
-- 2) Replace the email below with the exact Auth user email.
-- 3) Run this file in the Supabase SQL editor.

insert into public.admin_users (user_id, active)
select id, true
from auth.users
where lower(email) = lower('ADMIN_EMAIL@example.com')
on conflict (user_id) do update
set active = true;

-- Verify the authorized administrators:
select
  au.email,
  adm.active,
  adm.created_at
from public.admin_users adm
join auth.users au on au.id = adm.user_id
order by adm.created_at desc;

-- To revoke an administrator later:
-- update public.admin_users
-- set active = false
-- where user_id = (
--   select id from auth.users where lower(email) = lower('ADMIN_EMAIL@example.com')
-- );
