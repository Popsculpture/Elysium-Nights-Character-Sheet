-- Entitlements: which accounts may download which content pack.
-- A product is a catalog SKU. Its rule says who holds it: 'signed_in' is any account that
-- has signed in, 'granted' is only an account with a row in entitlements. A content pack is
-- the payload the app downloads for a SKU; only an account that holds the SKU can read it.
-- Nothing here looks at the sign-in provider or the email domain.

create table public.products (
  sku   text primary key,
  name  text not null,
  rule  text not null check (rule in ('signed_in', 'granted'))
);

insert into public.products (sku, name, rule)
values ('EN1101', 'Freelancer''s Companion', 'signed_in');

-- Grants for 'granted' products: added by the author in the dashboard, or by the service role.
create table public.entitlements (
  user_id     uuid not null references auth.users (id) on delete cascade,
  sku         text not null references public.products (sku),
  source      text not null,   -- for example 'backer', 'purchase', 'comp'
  granted_at  timestamptz not null default now(),
  primary key (user_id, sku)
);

create table public.content_packs (
  sku         text primary key references public.products (sku),
  version     integer not null,
  format      integer not null,
  payload     jsonb not null,
  updated_at  timestamptz not null default now()
);

create trigger content_packs_set_updated_at
  before update on public.content_packs
  for each row execute function public.set_updated_at();

-- True when the signed-in account holds this SKU.
create or replace function public.has_entitlement(p_sku text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    exists (select 1 from public.products p
            where p.sku = p_sku and p.rule = 'signed_in')
    or exists (select 1 from public.entitlements e
               where e.user_id = auth.uid() and e.sku = p_sku)
  );
$$;

-- The SKUs the signed-in account holds.
create or replace function public.my_entitlements()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select p.sku from public.products p
  where auth.uid() is not null and (
    p.rule = 'signed_in'
    or exists (select 1 from public.entitlements e
               where e.user_id = auth.uid() and e.sku = p.sku)
  );
$$;

revoke execute on function public.has_entitlement(text) from public;
revoke execute on function public.my_entitlements() from public;
grant execute on function public.has_entitlement(text) to anon, authenticated;
grant execute on function public.my_entitlements() to anon, authenticated;

alter table public.products enable row level security;
alter table public.entitlements enable row level security;
alter table public.content_packs enable row level security;

-- Clients only ever read these tables. No write policies exist, and the write privileges are
-- withdrawn as well, so a write from the app fails before RLS is even asked.
revoke insert, update, delete, truncate on public.products, public.entitlements, public.content_packs
  from anon, authenticated;

create policy "Anyone can read products"
  on public.products for select to anon, authenticated
  using (true);

create policy "Players read their own entitlements"
  on public.entitlements for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Players read the packs they hold"
  on public.content_packs for select to authenticated
  using (public.has_entitlement(sku));
