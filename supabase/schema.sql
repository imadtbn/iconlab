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
