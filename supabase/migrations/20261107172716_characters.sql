-- Characters: one row per character, whole sheet stored as JSON.
create table public.characters (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null default 'Unnamed Freelancer',
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index characters_owner_id_idx on public.characters (owner_id);

-- RLS is auto-enabled on this project; stated here so the migration stands on its own.
alter table public.characters enable row level security;

create policy "Owners can read their characters"
  on public.characters for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Owners can create characters"
  on public.characters for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Owners can update their characters"
  on public.characters for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owners can delete their characters"
  on public.characters for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Keep updated_at current on every save.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger characters_set_updated_at
  before update on public.characters
  for each row execute function public.set_updated_at();
