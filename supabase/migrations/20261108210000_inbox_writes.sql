-- The Admin desktop's writing tabs reach other players' sheets. A Job Board posting is plain mail. A
-- payday, an XP award or a milestone also changes numbers on the sheet, so it is a new kind of row: one
-- with `ops`. The courier is the same: the player's app files the row on the record, in one write, with
-- the row's id, then says so here. Only the player's app ever writes the record.
--
-- A ROW WITH OPS HAS ITS OWN TWO STATUSES, due and applied. That is the whole of what keeps it safe from
-- anything older. A tab still running the app from before this migration only ever reads waiting and
-- delivered, so it can't file one as plain mail and lose the numbers. recall_send, mark_delivered and
-- mark_taken all stop at anything that isn't their own status, so none of them needed changing. A row
-- with ops can't be recalled, and that is deliberate: a recall racing a filing would have to take numbers
-- back off a sheet. UNDO on the Admin's side sends a second row with the numbers the other way instead.
--
-- A SEND IS SAFE TO REPEAT. The Admin's app keeps what it has to send in its ledger and may have to try
-- again after a network failure, with no way to know whether the first try landed. send_key is that
-- write's id, one row per sender and key, and the same call again answers with the same row.
--
-- UNDO IS DECIDED HERE. More than one of the Admin's tabs can be sending, and a write can sit on two
-- desktops, so no app can know whether a send landed. take_back asks the one place that does: a key with no
-- row yet gets a recalled row of its own, and anything sent under that key later is refused with
-- EN_TAKEN_BACK, so it never lands. A key that has a row gets the correction, once, or is recalled if it is
-- a posting still waiting. Either way the one-row-per-key index decides which came first.

alter table public.character_inbox
  add column ops jsonb,
  add column send_key text;

alter table public.character_inbox drop constraint character_inbox_status_check;
alter table public.character_inbox add constraint character_inbox_status_check check (
  (ops is null and status in ('waiting', 'delivered', 'taken', 'recalled'))
  or (ops is not null and status in ('due', 'applied'))
);

create unique index character_inbox_send_key_idx on public.character_inbox (sender_id, send_key) where send_key is not null;

/* ---- helpers ---- */

-- Answers with the ops as they will be stored, or refuses with EN_BAD_OPS. A closed list of what can change:
-- Glimmer, Nexus, XP and the two Milestone counters, and nothing else, so no other kind of write can ride in
-- here. Heat isn't on it yet. A negative amount is how UNDO takes a write back. Never granted to clients.
create or replace function public.clean_ops(p_ops jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_row jsonb;
  v_key text;
  v_op text;
  v_n numeric;
  v_out jsonb := '[]'::jsonb;
begin
  if p_ops is null or jsonb_typeof(p_ops) <> 'array' then raise exception 'EN_BAD_OPS'; end if;
  if jsonb_array_length(p_ops) not between 1 and 4 then raise exception 'EN_BAD_OPS'; end if;
  for v_row in select jsonb_array_elements(p_ops) loop
    v_op := v_row ->> 'op';   -- anything but an object has no op, and stops on the next line
    if jsonb_typeof(v_row -> 'op') is distinct from 'string' or v_op not in ('glimmer', 'nexus', 'xp', 'milestone') then raise exception 'EN_BAD_OPS'; end if;
    for v_key in select jsonb_object_keys(v_row) loop
      if v_key not in ('op', 'amount') and not (v_op = 'milestone' and v_key = 'kind') then raise exception 'EN_BAD_OPS'; end if;
    end loop;
    if jsonb_typeof(v_row -> 'amount') is distinct from 'number' then raise exception 'EN_BAD_OPS'; end if;
    v_n := (v_row ->> 'amount')::numeric;
    if v_n = 0 then raise exception 'EN_BAD_OPS'; end if;
    if v_op = 'nexus' then
      if v_n <> round(v_n, 2) or abs(v_n) > 1000000 then raise exception 'EN_BAD_OPS'; end if;
      v_out := v_out || jsonb_build_array(jsonb_build_object('op', v_op, 'amount', trim_scale(v_n)));
    elsif v_op = 'milestone' then
      if v_n <> trunc(v_n) or abs(v_n) > 99 then raise exception 'EN_BAD_OPS'; end if;
      if jsonb_typeof(v_row -> 'kind') is distinct from 'string' or v_row ->> 'kind' not in ('major', 'minor') then raise exception 'EN_BAD_OPS'; end if;
      v_out := v_out || jsonb_build_array(jsonb_build_object('op', v_op, 'kind', v_row ->> 'kind', 'amount', v_n::int));
    else
      if v_n <> trunc(v_n) or abs(v_n) > 10000000 then raise exception 'EN_BAD_OPS'; end if;
      v_out := v_out || jsonb_build_array(jsonb_build_object('op', v_op, 'amount', v_n::int));
    end if;
  end loop;
  return v_out;
end;
$$;

/* ---- the functions the app calls ----------------------------------------------------------
   Each checks auth.uid(). New refusals: EN_BAD_OPS, EN_BAD_KEY, EN_TAKEN_BACK. */

-- Those who run the character's campaign, like send_to_character. With p_ops it is a row with ops, and the
-- mail is the letter that goes with the numbers, so it can't carry a package. Without, it is plain mail, and
-- it can be recalled while it waits. `when` is the Job Board's own When, which only this door takes: clean_mail's
-- list stays as batch 3 left it, and a row with no When shows the time it was sent.
-- A key already used answers with its row before anything else is asked: whoever sent it, it was sent.
-- A key take_back got to first is refused, EN_TAKEN_BACK.
create or replace function public.send_write(p_character uuid, p_key text, p_mail jsonb, p_ops jsonb default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_had uuid;
  v_for uuid;
  v_was text;
  v_campaign uuid;
  v_when text;
  v_mail jsonb;
  v_ops jsonb;
  v_id uuid;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if p_key is null or char_length(p_key) not between 1 and 80 then raise exception 'EN_BAD_KEY'; end if;
  select i.id, i.character_id, i.status into v_had, v_for, v_was from public.character_inbox i where i.sender_id = v_uid and i.send_key = p_key;
  if v_had is not null then
    if v_for is distinct from p_character then raise exception 'EN_NOT_ALLOWED'; end if;
    if v_was = 'recalled' then raise exception 'EN_TAKEN_BACK'; end if;
    return v_had;
  end if;
  select c.campaign_id into v_campaign from public.characters c where c.id = p_character;
  if v_campaign is null or not public.runs_campaign(v_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;

  if jsonb_typeof(p_mail) = 'object' and p_mail ? 'when' then
    if jsonb_typeof(p_mail -> 'when') <> 'string' then raise exception 'EN_BAD_MAIL'; end if;
    v_when := btrim(p_mail ->> 'when');
    if char_length(v_when) > 40 then raise exception 'EN_BAD_MAIL'; end if;
    v_mail := public.clean_mail(p_mail - 'when');
    if v_when <> '' then v_mail := v_mail || jsonb_build_object('when', v_when); end if;
  else
    v_mail := public.clean_mail(p_mail);
  end if;

  if p_ops is not null then
    v_ops := public.clean_ops(p_ops);
    if v_mail ? 'package' then raise exception 'EN_BAD_MAIL'; end if;
  end if;

  insert into public.character_inbox (character_id, campaign_id, sender_id, mail, ops, status, send_key)
    values (p_character, v_campaign, v_uid, v_mail, v_ops, case when v_ops is null then 'waiting' else 'due' end, p_key)
    on conflict (sender_id, send_key) where send_key is not null do nothing
    returning id into v_id;
  -- two tabs sending the one write at once: the row the other one made is this one's answer, unless it was take_back's
  if v_id is null then
    select i.id, i.status into v_id, v_was from public.character_inbox i where i.sender_id = v_uid and i.send_key = p_key;
    if v_was = 'recalled' then raise exception 'EN_TAKEN_BACK'; end if;
  end if;
  return v_id;
end;
$$;

-- The character's owner, once, and only a row with ops. mark_delivered is still the one for plain mail.
create or replace function public.mark_applied(p_id uuid)
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
  if v_status = 'applied' then raise exception 'EN_ALREADY'; end if;
  if v_status <> 'due' then raise exception 'EN_NOT_ALLOWED'; end if;
  update public.character_inbox set status = 'applied', delivered_at = now() where id = p_id;
end;
$$;

-- UNDO on another player's sheet, by the sender, for a key send_write takes. p_mail is the letter a correction carries.
-- Answers what happened: cancelled (nothing went under the key, and now nothing will), recalled (a posting still
-- waiting) or corrected (it landed, and the correction is on its way, once). The correction is the key with ':fix',
-- its numbers the landed row's the other way. EN_NOT_ALLOWED where send_write would refuse something new, or the key
-- was another character's.
create or replace function public.take_back(p_character uuid, p_key text, p_mail jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_for uuid;
  v_status text;
  v_ops jsonb;
  v_campaign uuid;
  v_mail jsonb;
  v_back jsonb;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if p_key is null or char_length(p_key) not between 1 and 80 then raise exception 'EN_BAD_KEY'; end if;
  v_mail := public.clean_mail(p_mail);
  if v_mail ? 'package' then raise exception 'EN_BAD_MAIL'; end if;
  select c.campaign_id into v_campaign from public.characters c where c.id = p_character;

  select i.id, i.character_id, i.status, i.ops into v_id, v_for, v_status, v_ops
    from public.character_inbox i where i.sender_id = v_uid and i.send_key = p_key for update;
  if v_id is null then
    if v_campaign is null or not public.runs_campaign(v_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
    insert into public.character_inbox (character_id, campaign_id, sender_id, mail, status, send_key)
      values (p_character, v_campaign, v_uid, v_mail, 'recalled', p_key)
      on conflict (sender_id, send_key) where send_key is not null do nothing
      returning id into v_id;
    if v_id is not null then return 'cancelled'; end if;
    -- a send of it landed in the same instant: then it is that row this answers about
    select i.id, i.character_id, i.status, i.ops into v_id, v_for, v_status, v_ops
      from public.character_inbox i where i.sender_id = v_uid and i.send_key = p_key for update;
  end if;
  if v_for is distinct from p_character then raise exception 'EN_NOT_ALLOWED'; end if;
  if v_status = 'recalled' then return 'cancelled'; end if;
  if v_status = 'waiting' then
    update public.character_inbox set status = 'recalled' where id = v_id;
    return 'recalled';
  end if;
  -- asked again: the correction already went, whatever has changed since
  if exists (select 1 from public.character_inbox i where i.sender_id = v_uid and i.send_key = p_key || ':fix') then return 'corrected'; end if;
  if v_campaign is null or not public.runs_campaign(v_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  if v_ops is not null then
    -- the landed row's numbers are clean already, so the other way round they are too
    select jsonb_agg(o || jsonb_build_object('amount', -((o ->> 'amount')::numeric))) into v_back from jsonb_array_elements(v_ops) o;
  end if;
  insert into public.character_inbox (character_id, campaign_id, sender_id, mail, ops, status, send_key)
    values (p_character, v_campaign, v_uid, v_mail, v_back, case when v_back is null then 'waiting' else 'due' end, p_key || ':fix')
    on conflict (sender_id, send_key) where send_key is not null do nothing;
  return 'corrected';
end;
$$;

/* ---- who may call what ---- */

revoke all on function public.clean_ops(jsonb) from public, anon, authenticated;

do $$
declare
  f text;
begin
  foreach f in array array['public.send_write(uuid, text, jsonb, jsonb)', 'public.take_back(uuid, text, jsonb)', 'public.mark_applied(uuid)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end
$$;
