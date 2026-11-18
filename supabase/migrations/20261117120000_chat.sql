-- #POST as a chat (17 Nov 2026): the mail reads like a messenger on both desktops, in real time, and players in one
-- campaign write to each other. Three things, and nothing else:
--
-- 1. SEEN, GM TO PLAYER. A letter the GM sent (character_inbox) gets a read_at, set by the character's owner when their
--    app opens the chat it is in, so the GM's side can say Seen. The other way already has one (gm_mailbox.read_at).
-- 2. PLAYER TO PLAYER. A table of its own, player_mail: one character writes to another in the same campaign. It is
--    private to the two of them: the sender and the owner of the character it is to read it, and nobody else, not the
--    people who run the campaign either (the author's call). Text only, no packages, no subjects.
-- 3. A CHAT'S PACE. A player could send ten letters to the GM in five minutes; a conversation needs more. Sixty, for
--    letters to the GM and for letters to other players, each counted on its own.
--
-- Patterned on the inbox and mailbox migrations: clients only read the tables, every write goes through a
-- security-definer function with a pinned search_path, and the write privileges are withdrawn outright. The migrations
-- already on the live project are not edited; send_to_gm is redefined here with the same signature and rules, and only
-- its limit changed.
-- No em or en dashes anywhere in this file (house style).

/* ---- 1. Seen, GM to player ---- */

alter table public.character_inbox add column read_at timestamptz;

-- The character's owner marks letters read: the ones listed that were sent to a character they own and are not marked
-- yet. Answers how many it marked. Again is no change, and no error. A list of more than 200 is refused.
create or replace function public.mark_inbox_read(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_n integer;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if p_ids is null or coalesce(array_length(p_ids, 1), 0) > 200 then raise exception 'EN_BAD_MAIL'; end if;
  update public.character_inbox i set read_at = now()
    where i.id = any (p_ids) and i.read_at is null
      and exists (select 1 from public.characters c where c.id = i.character_id and c.owner_id = v_uid);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

/* ---- 2. Player to player ---- */

create table public.player_mail (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references public.campaigns (id) on delete cascade,
  from_character  uuid not null references public.characters (id) on delete cascade,
  to_character    uuid not null references public.characters (id) on delete cascade,
  sender_id       uuid not null references auth.users (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 4000),
  created_at      timestamptz not null default now(),
  read_at         timestamptz,
  check (from_character <> to_character)
);

create index player_mail_to_idx on public.player_mail (to_character, created_at desc);
create index player_mail_from_idx on public.player_mail (from_character, created_at desc);
create index player_mail_sender_idx on public.player_mail (sender_id, campaign_id, created_at desc);

-- One character writes to another in the same campaign. The sender owns the character it is from; the character it is
-- to is in that campaign and is not the same character. Refusals: EN_SIGNED_OUT, EN_NOT_ALLOWED (not the sender's
-- character, a character in no campaign, a character that is not in the same one or does not exist, or the same
-- character), EN_BAD_MAIL (nothing to say, or over 4000 characters) and EN_SLOW_DOWN (sixty in five minutes in a
-- campaign). Answers the new row's id.
create or replace function public.send_to_player(p_from uuid, p_to uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_campaign uuid;
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if not public.owns_character(p_from) then raise exception 'EN_NOT_ALLOWED'; end if;
  select c.campaign_id into v_campaign from public.characters c where c.id = p_from;
  if v_campaign is null then raise exception 'EN_NOT_ALLOWED'; end if;
  if p_to is null or p_to = p_from
     or not exists (select 1 from public.characters c where c.id = p_to and c.campaign_id = v_campaign)
    then raise exception 'EN_NOT_ALLOWED'; end if;
  if v_body = '' or char_length(v_body) > 4000 then raise exception 'EN_BAD_MAIL'; end if;
  if (select count(*) from public.player_mail m
        where m.sender_id = v_uid and m.campaign_id = v_campaign and m.created_at > now() - interval '5 minutes') >= 60
    then raise exception 'EN_SLOW_DOWN'; end if;
  insert into public.player_mail (campaign_id, from_character, to_character, sender_id, body)
    values (v_campaign, p_from, p_to, v_uid, v_body)
    returning id into v_id;
  return v_id;
end;
$$;

-- The owner of the character a letter is to marks it read. Answers how many it marked; again is no change.
create or replace function public.mark_player_mail_read(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_n integer;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if p_ids is null or coalesce(array_length(p_ids, 1), 0) > 200 then raise exception 'EN_BAD_MAIL'; end if;
  update public.player_mail m set read_at = now()
    where m.id = any (p_ids) and m.read_at is null
      and exists (select 1 from public.characters c where c.id = m.to_character and c.owner_id = v_uid);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

/* ---- 3. A chat's pace: send_to_gm as it was, sixty in five minutes instead of ten ---- */

create or replace function public.send_to_gm(p_character uuid, p_mail jsonb, p_reply_to uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_campaign uuid;
  v_name text;
  v_persona text := null;
  v_mail jsonb;
  v_id uuid;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if not public.owns_character(p_character) then raise exception 'EN_NOT_ALLOWED'; end if;
  select c.campaign_id, c.name into v_campaign, v_name from public.characters c where c.id = p_character;
  -- a character in no campaign has no GM to write to
  if v_campaign is null then raise exception 'EN_NOT_ALLOWED'; end if;
  if p_reply_to is not null then
    -- only a letter this character was sent, in this campaign: the name it was signed with is who this is to
    select i.mail ->> 'from' into v_persona from public.character_inbox i
      where i.id = p_reply_to and i.character_id = p_character and i.campaign_id = v_campaign;
    if not found then raise exception 'EN_NOT_ALLOWED'; end if;
    v_persona := nullif(left(btrim(coalesce(v_persona, '')), 80), '');
  end if;
  v_mail := public.clean_gm_mail(p_mail, coalesce(nullif(left(btrim(coalesce(v_name, '')), 80), ''), 'A Freelancer'));
  if (select count(*) from public.gm_mailbox m
        where m.sender_id = v_uid and m.campaign_id = v_campaign and m.created_at > now() - interval '5 minutes') >= 60
    then raise exception 'EN_SLOW_DOWN'; end if;
  insert into public.gm_mailbox (campaign_id, character_id, sender_id, mail, reply_to, persona)
    values (v_campaign, p_character, v_uid, v_mail, p_reply_to, v_persona)
    returning id into v_id;
  return v_id;
end;
$$;

/* ---- who may call and read what ---- */

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.mark_inbox_read(uuid[])', 'public.send_to_player(uuid, uuid, text)', 'public.mark_player_mail_read(uuid[])',
    'public.send_to_gm(uuid, jsonb, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end
$$;

alter table public.player_mail enable row level security;

-- Clients only ever read this table: no write policies, and the write privileges withdrawn as well.
revoke all on public.player_mail from anon, authenticated;
grant select on public.player_mail to authenticated;

-- The two ends of it: who sent it, and whoever owns the character it is to. Not the people who run the campaign.
create policy "The sender and the recipient read a player's letter"
  on public.player_mail for select to authenticated
  using ((select auth.uid()) = sender_id or public.owns_character(to_character));

-- Realtime respects the read policy above: a listener hears only the rows it could read.
alter publication supabase_realtime add table public.player_mail;
