-- #POST to the GM: a player writes to the Admin and co-Admins of their campaign, and answers a letter they were sent.
-- Until now mail only went one way: the Admin sent (character_inbox) and the player's app filed it on the record. This
-- is the other direction, a mailbox the people who run a campaign read. Patterned on the inbox migration: clients only
-- read the table, every write goes through a security-definer function with a pinned search_path, and the write
-- privileges are withdrawn outright.
--
-- The migrations already on the live project are not edited. This one adds a table, two functions and one helper, and
-- nothing else.
--
-- Who a letter is from is decided here, never by the caller: it is the sending character's own name. Who it is to, when
-- it answers a letter, is the name that letter was signed with (the persona the GM wrote as), read off the letter the
-- player is answering, so a reply can only ever be to a letter that character was sent. Text only: a player sends no
-- package. A player is held to ten letters in five minutes in a campaign, so a mailbox can't be flooded.

create table public.gm_mailbox (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns (id) on delete cascade,
  character_id  uuid not null references public.characters (id) on delete cascade,
  sender_id     uuid not null references auth.users (id) on delete cascade,
  -- { from, subj, body }: from is the character's name, as stored here
  mail          jsonb not null check (jsonb_typeof(mail) = 'object'),
  -- the letter this answers, when it does, and the name it was signed with: who the player is writing to
  reply_to      uuid references public.character_inbox (id) on delete set null,
  persona       text check (persona is null or char_length(persona) between 1 and 80),
  status        text not null default 'unread' check (status in ('unread', 'read')),
  created_at    timestamptz not null default now(),
  read_at       timestamptz
);

create index gm_mailbox_campaign_idx on public.gm_mailbox (campaign_id, status, created_at desc);
create index gm_mailbox_sender_idx on public.gm_mailbox (sender_id, campaign_id, created_at desc);

-- A player's letter: a subject, a message, or both, and nothing else. `from` is not a key a caller may send, since
-- the server stamps it. Answers the mail as it will be stored, or refuses with EN_BAD_MAIL. Never granted to clients.
create or replace function public.clean_gm_mail(p_mail jsonb, p_from text)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_key text;
  v_subj text;
  v_body text;
begin
  if p_mail is null or jsonb_typeof(p_mail) <> 'object' then raise exception 'EN_BAD_MAIL'; end if;
  for v_key in select jsonb_object_keys(p_mail) loop
    if v_key not in ('subj', 'body') then raise exception 'EN_BAD_MAIL'; end if;
  end loop;
  if coalesce(jsonb_typeof(p_mail -> 'subj'), 'string') <> 'string' then raise exception 'EN_BAD_MAIL'; end if;
  if coalesce(jsonb_typeof(p_mail -> 'body'), 'string') <> 'string' then raise exception 'EN_BAD_MAIL'; end if;
  v_subj := btrim(coalesce(p_mail ->> 'subj', ''));
  v_body := btrim(coalesce(p_mail ->> 'body', ''));
  if char_length(v_subj) > 140 then raise exception 'EN_BAD_MAIL'; end if;
  if char_length(v_body) > 4000 then raise exception 'EN_BAD_MAIL'; end if;
  if v_subj = '' and v_body = '' then raise exception 'EN_BAD_MAIL'; end if;
  return jsonb_build_object('from', p_from, 'subj', v_subj, 'body', v_body);
end;
$$;

/* ---- the functions the app calls ----------------------------------------------------------
   Each checks auth.uid(). Refusals: EN_SIGNED_OUT, EN_NOT_ALLOWED (not the character's owner, a character in no
   campaign, a letter that is not one this character was sent, or not one that runs the campaign), EN_BAD_MAIL and
   EN_SLOW_DOWN (ten letters in five minutes). Answers the new row's id. */

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
        where m.sender_id = v_uid and m.campaign_id = v_campaign and m.created_at > now() - interval '5 minutes') >= 10
    then raise exception 'EN_SLOW_DOWN'; end if;
  insert into public.gm_mailbox (campaign_id, character_id, sender_id, mail, reply_to, persona)
    values (v_campaign, p_character, v_uid, v_mail, p_reply_to, v_persona)
    returning id into v_id;
  return v_id;
end;
$$;

-- Those who run the campaign mark a letter read. Again is no change, and no error.
create or replace function public.mark_gm_mail_read(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_campaign uuid;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  select m.campaign_id into v_campaign from public.gm_mailbox m where m.id = p_id for update;
  if v_campaign is null or not public.runs_campaign(v_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  update public.gm_mailbox set status = 'read', read_at = now() where id = p_id and status = 'unread';
end;
$$;

/* ---- who may call what ---- */

revoke all on function public.clean_gm_mail(jsonb, text) from public, anon, authenticated;

do $$
declare
  f text;
begin
  foreach f in array array['public.send_to_gm(uuid, jsonb, uuid)', 'public.mark_gm_mail_read(uuid)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end
$$;

/* ---- the table ---- */

alter table public.gm_mailbox enable row level security;

-- Clients only ever read this table. No write policies exist, and the write privileges are withdrawn as well.
revoke all on public.gm_mailbox from anon, authenticated;
grant select on public.gm_mailbox to authenticated;

-- Those who run the campaign read every letter to its GMs; a player reads the ones they sent, for their own sent list.
create policy "Those who run a campaign read its mailbox, and a sender reads their own"
  on public.gm_mailbox for select to authenticated
  using (public.runs_campaign(campaign_id) or (select auth.uid()) = sender_id);

-- Realtime respects the read policy above: a listener hears only the rows it could read.
alter publication supabase_realtime add table public.gm_mailbox;
