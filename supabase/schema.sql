-- IconLab / Supabase foundation
-- Run this in the Supabase SQL editor.

create table if not exists public.products (
  id text primary key,
  payload jsonb not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_phone text,
  wilaya text,
  status text not null default 'New',
  total numeric(12,2) not null default 0,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.designs (
  id text primary key,
  product_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id bigint generated always as identity primary key,
  phone text unique not null,
  full_name text,
  wilaya text,
  commune text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.designs enable row level security;
alter table public.customers enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (active = true);

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
on public.orders for insert
to anon, authenticated
with check (
  id is not null
  and customer_phone is not null
  and total >= 0
);

drop policy if exists "Public can create designs" on public.designs;
create policy "Public can create designs"
on public.designs for insert
to anon, authenticated
with check (id is not null);

-- No public SELECT policy is intentionally created for orders, designs or customers.
-- Secure admin authentication and authenticated management policies are added in stage 3.


-- ============ STAGE 3: AUTHENTICATED ADMIN ============
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admin can read own admin record" on public.admin_users;
create policy "Admin can read own admin record"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admin can read all products" on public.products;
create policy "Admin can read all products"
on public.products for select
to authenticated
using (public.is_admin());

drop policy if exists "Admin can insert products" on public.products;
create policy "Admin can insert products"
on public.products for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admin can update products" on public.products;
create policy "Admin can update products"
on public.products for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin can delete products" on public.products;
create policy "Admin can delete products"
on public.products for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admin can read orders" on public.orders;
create policy "Admin can read orders"
on public.orders for select
to authenticated
using (public.is_admin());

drop policy if exists "Admin can update orders" on public.orders;
create policy "Admin can update orders"
on public.orders for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin can read designs" on public.designs;
create policy "Admin can read designs"
on public.designs for select
to authenticated
using (public.is_admin());

drop policy if exists "Admin can read customers" on public.customers;
create policy "Admin can read customers"
on public.customers for select
to authenticated
using (public.is_admin());

-- After creating an Auth user in Supabase, authorize it once with:
-- insert into public.admin_users (user_id)
-- values ('YOUR-AUTH-USER-UUID')
-- on conflict (user_id) do update set active = true;
