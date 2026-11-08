-- Campaigns: a table of players, an invite link, and which character sits at which table.
-- Patterned on the entitlements migration: clients only read these tables, every write goes
-- through a security-definer function with a pinned search_path, and the write privileges are
-- withdrawn outright. Every rule lives here; a hidden button in the app is for clarity, not safety.

create table public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  created_at  timestamptz not null default now()
);

-- Ending a membership deletes its row, so nothing here can quietly hand back an old role.
create table public.campaign_members (
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null check (role in ('admin', 'coadmin', 'player')),
  joined_at    timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create unique index campaign_members_one_admin
  on public.campaign_members (campaign_id) where role = 'admin';
create index campaign_members_user_id_idx on public.campaign_members (user_id);

-- One live link per campaign: resetting replaces the token in this row.
create table public.campaign_invites (
  campaign_id  uuid primary key references public.campaigns (id) on delete cascade,
  token        text not null unique,
  created_at   timestamptz not null default now()
);

create table public.campaign_blocks (
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  blocked_by   uuid references auth.users (id) on delete set null,
  blocked_at   timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

-- Account state, like the app's link book. It is not in `data`, so it stays out of exports and
-- out of whole-record sync.
alter table public.characters
  add column campaign_id uuid references public.campaigns (id) on delete set null;

create index characters_campaign_id_idx on public.characters (campaign_id) where campaign_id is not null;

-- A row's updated_at is the player's last save. cloud.js compares it to decide which side has
-- the newer sheet, so a campaign move must not look like an edit: left as it was, one Admin's
-- Remove could make a player's device overwrite unsaved edits with the older copy in the account.
-- The trigger now fires only when the sheet itself changes.
drop trigger characters_set_updated_at on public.characters;
create trigger characters_set_updated_at
  before update on public.characters
  for each row
  when (old.name is distinct from new.name or old.data is distinct from new.data)
  execute function public.set_updated_at();

/* ---- helpers: called by every policy, so no policy queries campaign_members directly and recurses ---- */

create or replace function public.is_member(p_campaign uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.campaign_members m
                 where m.campaign_id = p_campaign and m.user_id = auth.uid());
$$;

-- The Admin or a co-Admin.
create or replace function public.runs_campaign(p_campaign uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.campaign_members m
                 where m.campaign_id = p_campaign and m.user_id = auth.uid()
                   and m.role in ('admin', 'coadmin'));
$$;

-- The Admin only.
create or replace function public.leads_campaign(p_campaign uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.campaign_members m
                 where m.campaign_id = p_campaign and m.user_id = auth.uid()
                   and m.role = 'admin');
$$;

-- A Discord name, read live, in the order cloud.js's displayName() reads it. Never granted to
-- clients: it would turn any user id into a name.
create or replace function public.discord_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    nullif(u.raw_user_meta_data -> 'custom_claims' ->> 'global_name', ''),
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    nullif(u.raw_user_meta_data ->> 'user_name', ''),
    nullif(u.raw_user_meta_data ->> 'preferred_username', ''),
    'Freelancer')
  from auth.users u where u.id = p_user;
$$;

create or replace function public.new_invite_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select replace(gen_random_uuid()::text, '-', '');
$$;

/* ---- the functions the app calls ----------------------------------------------------------
   Each checks auth.uid(). Refusals raise a code the app turns into words:
   EN_SIGNED_OUT, EN_NOT_ALLOWED, EN_BAD_NAME, EN_DEAD_INVITE, EN_BLOCKED, EN_NOT_MEMBER,
   EN_ADMIN_LOCKED (the Admin cannot be removed, demoted, or leave), EN_ADMIN_ONLY, EN_BAD_ROLE.
   Anything that changes who holds which role locks the campaign row first, so two of them
   cannot interleave. */

create or replace function public.create_campaign(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_id uuid;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if char_length(v_name) not between 1 and 80 then raise exception 'EN_BAD_NAME'; end if;
  insert into public.campaigns (name) values (v_name) returning id into v_id;
  insert into public.campaign_invites (campaign_id, token) values (v_id, public.new_invite_token());
  insert into public.campaign_members (campaign_id, user_id, role) values (v_id, v_uid, 'admin');
  return v_id;
end;
$$;

-- For the join card, before anyone joins: the campaign's name and its Admin's Discord name.
-- Nothing else. A dead token answers with no rows.
create or replace function public.invite_preview(p_token text)
returns table (campaign_name text, admin_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'EN_SIGNED_OUT'; end if;
  return query
    select c.name, public.discord_name(m.user_id)
    from public.campaign_invites i
    join public.campaigns c on c.id = i.campaign_id
    join public.campaign_members m on m.campaign_id = c.id and m.role = 'admin'
    where i.token = p_token;
end;
$$;

-- A second click changes nothing. A removed member's row is gone, so a return is a fresh player
-- row on the same key: a former co-Admin does not get the role back by clicking a link.
create or replace function public.join_campaign(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_campaign uuid;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  select i.campaign_id into v_campaign from public.campaign_invites i where i.token = p_token;
  if v_campaign is null then raise exception 'EN_DEAD_INVITE'; end if;
  if exists (select 1 from public.campaign_blocks b where b.campaign_id = v_campaign and b.user_id = v_uid) then
    raise exception 'EN_BLOCKED';
  end if;
  insert into public.campaign_members (campaign_id, user_id, role)
    values (v_campaign, v_uid, 'player')
    on conflict (campaign_id, user_id) do nothing;
  return v_campaign;
end;
$$;

-- A new token; the old one stops working.
create or replace function public.reset_invite(p_campaign uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := public.new_invite_token();
begin
  if auth.uid() is null then raise exception 'EN_SIGNED_OUT'; end if;
  if not public.runs_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  update public.campaign_invites set token = v_token, created_at = now() where campaign_id = p_campaign;
  return v_token;
end;
$$;

create or replace function public.leave_campaign(p_campaign uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  perform 1 from public.campaigns c where c.id = p_campaign for update;
  select m.role into v_role from public.campaign_members m
    where m.campaign_id = p_campaign and m.user_id = v_uid;
  if v_role is null then raise exception 'EN_NOT_MEMBER'; end if;
  if v_role = 'admin' then raise exception 'EN_ADMIN_LOCKED'; end if;
  update public.characters set campaign_id = null where owner_id = v_uid and campaign_id = p_campaign;
  delete from public.campaign_members where campaign_id = p_campaign and user_id = v_uid;
end;
$$;

-- Members only: Discord names read live, roles, and each member's characters in the campaign
-- with name, level and class read from `data`. The whole sheet is never in here.
create or replace function public.campaign_roster(p_campaign uuid)
returns table (user_id uuid, discord_name text, role text, joined_at timestamptz, characters jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'EN_SIGNED_OUT'; end if;
  if not public.is_member(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  return query
    select m.user_id, public.discord_name(m.user_id), m.role, m.joined_at,
      coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', c.id,
                 'name', coalesce(nullif(c.data ->> 'name', ''), c.name),
                 'level', c.data -> 'level',
                 'class', c.data -> 'class') order by c.name)
        from public.characters c
        where c.campaign_id = p_campaign and c.owner_id = m.user_id), '[]'::jsonb)
    from public.campaign_members m
    where m.campaign_id = p_campaign
    order by case m.role when 'admin' then 0 when 'coadmin' then 1 else 2 end, m.joined_at;
end;
$$;

-- Those who run it: who is blocked, with a name to show. A blocked account is not a member, so
-- the roster cannot name them, and a client cannot read auth.users.
create or replace function public.campaign_blocked(p_campaign uuid)
returns table (user_id uuid, discord_name text, blocked_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'EN_SIGNED_OUT'; end if;
  if not public.runs_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  return query
    select b.user_id, public.discord_name(b.user_id), b.blocked_at
    from public.campaign_blocks b
    where b.campaign_id = p_campaign
    order by b.blocked_at desc;
end;
$$;

create or replace function public.remove_member(p_campaign uuid, p_user uuid, p_block boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_target text;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  perform 1 from public.campaigns c where c.id = p_campaign for update;
  if not public.runs_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  select m.role into v_target from public.campaign_members m
    where m.campaign_id = p_campaign and m.user_id = p_user;
  if v_target is null then raise exception 'EN_NOT_MEMBER'; end if;
  if v_target = 'admin' then raise exception 'EN_ADMIN_LOCKED'; end if;
  if v_target = 'coadmin' and not public.leads_campaign(p_campaign) then raise exception 'EN_ADMIN_ONLY'; end if;
  update public.characters set campaign_id = null where owner_id = p_user and campaign_id = p_campaign;
  delete from public.campaign_members where campaign_id = p_campaign and user_id = p_user;
  if coalesce(p_block, false) then
    insert into public.campaign_blocks (campaign_id, user_id, blocked_by)
      values (p_campaign, p_user, v_uid)
      on conflict (campaign_id, user_id) do update set blocked_by = excluded.blocked_by, blocked_at = now();
  end if;
end;
$$;

create or replace function public.unblock_member(p_campaign uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'EN_SIGNED_OUT'; end if;
  if not public.runs_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  delete from public.campaign_blocks where campaign_id = p_campaign and user_id = p_user;
end;
$$;

-- Between coadmin and player only. The Admin's own row moves through transfer_leadership.
create or replace function public.set_role(p_campaign uuid, p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target text;
begin
  if auth.uid() is null then raise exception 'EN_SIGNED_OUT'; end if;
  perform 1 from public.campaigns c where c.id = p_campaign for update;
  if not public.leads_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  if p_role is null or p_role not in ('coadmin', 'player') then raise exception 'EN_BAD_ROLE'; end if;
  select m.role into v_target from public.campaign_members m
    where m.campaign_id = p_campaign and m.user_id = p_user;
  if v_target is null then raise exception 'EN_NOT_MEMBER'; end if;
  if v_target = 'admin' then raise exception 'EN_ADMIN_LOCKED'; end if;
  update public.campaign_members set role = p_role where campaign_id = p_campaign and user_id = p_user;
end;
$$;

-- Swaps the two roles in one transaction, the old Admin first because the partial unique index
-- is checked row by row, so the campaign never has zero Admins or two.
create or replace function public.transfer_leadership(p_campaign uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  perform 1 from public.campaigns c where c.id = p_campaign for update;
  if not public.leads_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  if p_user is null or p_user = v_uid or not exists (
    select 1 from public.campaign_members m where m.campaign_id = p_campaign and m.user_id = p_user
  ) then raise exception 'EN_NOT_MEMBER'; end if;
  update public.campaign_members set role = 'coadmin' where campaign_id = p_campaign and user_id = v_uid;
  update public.campaign_members set role = 'admin' where campaign_id = p_campaign and user_id = p_user;
end;
$$;

create or replace function public.rename_campaign(p_campaign uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
begin
  if auth.uid() is null then raise exception 'EN_SIGNED_OUT'; end if;
  if not public.leads_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  if char_length(v_name) not between 1 and 80 then raise exception 'EN_BAD_NAME'; end if;
  update public.campaigns set name = v_name where id = p_campaign;
end;
$$;

-- Clears the campaign from every character in it first; the characters themselves are untouched.
create or replace function public.delete_campaign(p_campaign uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'EN_SIGNED_OUT'; end if;
  perform 1 from public.campaigns c where c.id = p_campaign for update;
  if not public.leads_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  update public.characters set campaign_id = null where campaign_id = p_campaign;
  delete from public.campaigns where id = p_campaign;
end;
$$;

/* ---- who may call what ----------------------------------------------------------------------
   Supabase grants new functions to anon and authenticated by default, so revoking from public
   alone would leave them callable. Signed-in accounts get the helpers (RLS evaluates them as the
   querying role) and the functions above. discord_name and new_invite_token stay private. */

revoke all on function public.discord_name(uuid) from public, anon, authenticated;
revoke all on function public.new_invite_token() from public, anon, authenticated;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.is_member(uuid)', 'public.runs_campaign(uuid)', 'public.leads_campaign(uuid)',
    'public.create_campaign(text)', 'public.invite_preview(text)', 'public.join_campaign(text)',
    'public.reset_invite(uuid)', 'public.leave_campaign(uuid)', 'public.campaign_roster(uuid)',
    'public.campaign_blocked(uuid)', 'public.remove_member(uuid, uuid, boolean)',
    'public.unblock_member(uuid, uuid)', 'public.set_role(uuid, uuid, text)',
    'public.transfer_leadership(uuid, uuid)', 'public.rename_campaign(uuid, text)',
    'public.delete_campaign(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end
$$;

/* ---- the tables ---- */

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_invites enable row level security;
alter table public.campaign_blocks enable row level security;

-- Clients only ever read these tables. No write policies exist, and the write privileges are
-- withdrawn as well, so a write from the app fails before RLS is even asked.
revoke all on public.campaigns, public.campaign_members, public.campaign_invites, public.campaign_blocks
  from anon, authenticated;
grant select on public.campaigns, public.campaign_members, public.campaign_invites, public.campaign_blocks
  to authenticated;

create policy "Members read their campaigns"
  on public.campaigns for select to authenticated
  using (public.is_member(id));

create policy "Members read their campaign's members"
  on public.campaign_members for select to authenticated
  using (public.is_member(campaign_id));

create policy "Those who run a campaign read its invite"
  on public.campaign_invites for select to authenticated
  using (public.runs_campaign(campaign_id));

create policy "Those who run a campaign read its blocks"
  on public.campaign_blocks for select to authenticated
  using (public.runs_campaign(campaign_id));

/* ---- characters: the owner policies stay ----
   A player can only put a character in a campaign they are in, on insert as well as on update:
   an insert carrying campaign_id would otherwise walk a row into a stranger's roster.
   The read policy is the whole sheet view. The Admin and co-Admins read the same record the
   player saves, notes included. Players never read each other's rows. It also means an Admin's
   select on this table now answers with other people's rows, so js/cloud.js filters its pull
   by owner_id. */

drop policy "Owners can create characters" on public.characters;
create policy "Owners can create characters"
  on public.characters for insert to authenticated
  with check ((select auth.uid()) = owner_id and (campaign_id is null or public.is_member(campaign_id)));

drop policy "Owners can update their characters" on public.characters;
create policy "Owners can update their characters"
  on public.characters for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id and (campaign_id is null or public.is_member(campaign_id)));

create policy "Those who run a campaign read its characters"
  on public.characters for select to authenticated
  using (campaign_id is not null and public.runs_campaign(campaign_id));
