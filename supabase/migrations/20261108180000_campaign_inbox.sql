-- #POST from the Admin: in-game mail signed as any NPC, with an optional package of items.
-- The inbox is the courier, not the mailbox. Each row is one message on its way to one character. The
-- player's app files it on the record, where mail has always lived, then says so here. Only the
-- player's app ever writes the record. Patterned on the campaigns migration: clients only read this
-- table, every write goes through a security-definer function with a pinned search_path, and the
-- write privileges are withdrawn outright.

create table public.character_inbox (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid not null references public.characters (id) on delete cascade,
  campaign_id   uuid not null references public.campaigns (id) on delete cascade,
  sender_id     uuid references auth.users (id) on delete set null,
  mail          jsonb not null,
  status        text not null default 'waiting' check (status in ('waiting', 'delivered', 'taken', 'recalled')),
  created_at    timestamptz not null default now(),
  delivered_at  timestamptz,
  taken_at      timestamptz
);

create index character_inbox_character_idx on public.character_inbox (character_id, status);
create index character_inbox_campaign_idx on public.character_inbox (campaign_id);
create index character_inbox_sender_idx on public.character_inbox (sender_id, campaign_id, created_at desc);

/* ---- helpers ---- */

-- Called by the read policy, so the policy never reads characters under another table's rules.
create or replace function public.owns_character(p_character uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.characters c
                 where c.id = p_character and c.owner_id = auth.uid());
$$;

-- Answers with the mail as it will be stored, or refuses with EN_BAD_MAIL. A #POST message and an
-- optional package, and nothing else: from, subj, body and package are the only keys there are, so
-- no other kind of write can ride in here. The server can't see the gear catalog, so a package is
-- checked for its shape only. The player's app checks the names against the catalog at Take it.
-- Never granted to clients: the two send functions call it.
create or replace function public.clean_mail(p_mail jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_key text;
  v_from text;
  v_subj text;
  v_body text;
  v_row jsonb;
  v_name text;
  v_qty numeric;
  v_items jsonb := '[]'::jsonb;
  v_out jsonb;
begin
  if p_mail is null or jsonb_typeof(p_mail) <> 'object' then raise exception 'EN_BAD_MAIL'; end if;
  for v_key in select jsonb_object_keys(p_mail) loop
    if v_key not in ('from', 'subj', 'body', 'package') then raise exception 'EN_BAD_MAIL'; end if;
  end loop;

  if jsonb_typeof(p_mail -> 'from') is distinct from 'string' then raise exception 'EN_BAD_MAIL'; end if;
  if coalesce(jsonb_typeof(p_mail -> 'subj'), 'string') <> 'string' then raise exception 'EN_BAD_MAIL'; end if;
  if coalesce(jsonb_typeof(p_mail -> 'body'), 'string') <> 'string' then raise exception 'EN_BAD_MAIL'; end if;
  v_from := btrim(p_mail ->> 'from');
  v_subj := btrim(coalesce(p_mail ->> 'subj', ''));
  v_body := btrim(coalesce(p_mail ->> 'body', ''));
  if char_length(v_from) not between 1 and 80 then raise exception 'EN_BAD_MAIL'; end if;
  if char_length(v_subj) > 140 then raise exception 'EN_BAD_MAIL'; end if;
  if char_length(v_body) > 4000 then raise exception 'EN_BAD_MAIL'; end if;

  if p_mail ? 'package' then
    if jsonb_typeof(p_mail -> 'package') <> 'array' then raise exception 'EN_BAD_MAIL'; end if;
    if jsonb_array_length(p_mail -> 'package') > 20 then raise exception 'EN_BAD_MAIL'; end if;
    for v_row in select jsonb_array_elements(p_mail -> 'package') loop
      if jsonb_typeof(v_row) <> 'object' then raise exception 'EN_BAD_MAIL'; end if;
      for v_key in select jsonb_object_keys(v_row) loop
        if v_key not in ('name', 'qty') then raise exception 'EN_BAD_MAIL'; end if;
      end loop;
      if jsonb_typeof(v_row -> 'name') is distinct from 'string' then raise exception 'EN_BAD_MAIL'; end if;
      if jsonb_typeof(v_row -> 'qty') is distinct from 'number' then raise exception 'EN_BAD_MAIL'; end if;
      v_name := btrim(v_row ->> 'name');
      v_qty := (v_row ->> 'qty')::numeric;
      if char_length(v_name) not between 1 and 120 then raise exception 'EN_BAD_MAIL'; end if;
      if v_qty <> trunc(v_qty) or v_qty not between 1 and 99 then raise exception 'EN_BAD_MAIL'; end if;
      v_items := v_items || jsonb_build_array(jsonb_build_object('name', v_name, 'qty', v_qty::int));
    end loop;
  end if;

  -- a message can go alone, and so can a package, but something has to go
  if v_subj = '' and v_body = '' and jsonb_array_length(v_items) = 0 then raise exception 'EN_BAD_MAIL'; end if;

  v_out := jsonb_build_object('from', v_from, 'subj', v_subj, 'body', v_body);
  if jsonb_array_length(v_items) > 0 then v_out := v_out || jsonb_build_object('package', v_items); end if;
  return v_out;
end;
$$;

/* ---- the functions the app calls ----------------------------------------------------------
   Each checks auth.uid(). Refusals raise a code the app turns into words: EN_SIGNED_OUT,
   EN_NOT_ALLOWED, EN_BAD_MAIL, EN_TOO_LATE (a recall after delivery), EN_ALREADY (done once
   already), EN_RECALLED (the sender took it back), EN_NOT_DELIVERED (taken before it was
   delivered), EN_NO_PACKAGE (taking a message with nothing in it). A row is locked before its
   status is read, so a recall and a delivery cannot both land. */

-- Those who run the character's campaign. A character in no campaign has nobody who runs it, and a
-- character that does not exist answers the same way, so this can't be used to find one.
create or replace function public.send_to_character(p_character uuid, p_mail jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_campaign uuid;
  v_mail jsonb;
  v_id uuid;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  select c.campaign_id into v_campaign from public.characters c where c.id = p_character;
  if v_campaign is null or not public.runs_campaign(v_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  v_mail := public.clean_mail(p_mail);
  insert into public.character_inbox (character_id, campaign_id, sender_id, mail)
    values (p_character, v_campaign, v_uid, v_mail)
    returning id into v_id;
  return v_id;
end;
$$;

-- The same send to every character in the campaign, one row each. Answers how many went.
create or replace function public.send_to_crew(p_campaign uuid, p_mail jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_mail jsonb;
  v_n integer;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if not public.runs_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  v_mail := public.clean_mail(p_mail);
  insert into public.character_inbox (character_id, campaign_id, sender_id, mail)
    select c.id, p_campaign, v_uid, v_mail from public.characters c where c.campaign_id = p_campaign;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- The sender only, and only while it's waiting. Once delivered, it's the player's.
create or replace function public.recall_send(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sender uuid;
  v_status text;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  select i.sender_id, i.status into v_sender, v_status from public.character_inbox i where i.id = p_id for update;
  if v_status is null or v_sender is distinct from v_uid then raise exception 'EN_NOT_ALLOWED'; end if;
  if v_status <> 'waiting' then raise exception 'EN_TOO_LATE'; end if;
  update public.character_inbox set status = 'recalled' where id = p_id;
end;
$$;

-- The character's owner, once.
create or replace function public.mark_delivered(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_character uuid;
  v_status text;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  select i.character_id, i.status into v_character, v_status from public.character_inbox i where i.id = p_id for update;
  if v_status is null or not public.owns_character(v_character) then raise exception 'EN_NOT_ALLOWED'; end if;
  if v_status = 'recalled' then raise exception 'EN_RECALLED'; end if;
  if v_status <> 'waiting' then raise exception 'EN_ALREADY'; end if;
  update public.character_inbox set status = 'delivered', delivered_at = now() where id = p_id;
end;
$$;

-- The character's owner, once, and only a delivered message with a package in it.
create or replace function public.mark_taken(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_character uuid;
  v_status text;
  v_mail jsonb;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  select i.character_id, i.status, i.mail into v_character, v_status, v_mail from public.character_inbox i where i.id = p_id for update;
  if v_status is null or not public.owns_character(v_character) then raise exception 'EN_NOT_ALLOWED'; end if;
  if not (v_mail ? 'package') then raise exception 'EN_NO_PACKAGE'; end if;
  if v_status = 'recalled' then raise exception 'EN_RECALLED'; end if;
  if v_status = 'taken' then raise exception 'EN_ALREADY'; end if;
  if v_status <> 'delivered' then raise exception 'EN_NOT_DELIVERED'; end if;
  update public.character_inbox set status = 'taken', taken_at = now() where id = p_id;
end;
$$;

/* ---- who may call what ----------------------------------------------------------------------
   Supabase grants new functions to anon and authenticated by default, so revoking from public
   alone would leave them callable. Signed-in accounts get the read policy's helper and the
   functions above. clean_mail stays private. */

revoke all on function public.clean_mail(jsonb) from public, anon, authenticated;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.owns_character(uuid)', 'public.send_to_character(uuid, jsonb)', 'public.send_to_crew(uuid, jsonb)',
    'public.recall_send(uuid)', 'public.mark_delivered(uuid)', 'public.mark_taken(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end
$$;

/* ---- the table ---- */

alter table public.character_inbox enable row level security;

-- Clients only ever read this table. No write policies exist, and the write privileges are
-- withdrawn as well, so a write from the app fails before RLS is even asked.
revoke all on public.character_inbox from anon, authenticated;
grant select on public.character_inbox to authenticated;

-- The sender and the character's owner. An Admin's select here answers with what they sent to other
-- people's characters as well as their own mail, so js/cloud.js asks by character_id for the
-- account's own rows, and js/campaigns.js asks by sender_id for the sends list.
create policy "The sender and the character's owner read a send"
  on public.character_inbox for select to authenticated
  using ((select auth.uid()) = sender_id or public.owns_character(character_id));

-- Realtime respects the read policy above: a listener hears only the rows it could read.
alter publication supabase_realtime add table public.character_inbox;
