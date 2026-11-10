-- The SYNC button. Each browser keeps its own Admin desktop for a campaign, so a co-Admin's Table is
-- blank while the Admin's is full, and so is the Admin's own on a second computer. A press of SYNC
-- saves that browser's desktop here and adds what the others who run the campaign saved: one saved
-- desktop to a campaign and an account. The app does the adding, and it only ever adds. This is where
-- the copies are kept, and who may read them.
--
-- Patterned on the campaigns migration: every rule lives here, the two functions are security definer
-- with a pinned search_path, and no client touches the table at all. It is not in Realtime: nothing
-- mirrors, and a press reads once.
--
-- ONLY THOSE WHO RUN THE CAMPAIGN, the Admin and co-Admins, save or read. A copy saved by someone who
-- has since stopped running it stays in its row and is read by nobody, themselves included, until
-- they run it again. A campaign's copies go with the campaign.
--
-- A SAVE SAYS WHICH COPY IT READ (rev). The app reads, adds what its desktop lacks, and saves the
-- result. So that one account on two computers can't have the second save drop what the first put
-- there, a save that read an older copy, or none where there is one, is refused with EN_MOVED, and the
-- app reads again.
--
-- THE DESKTOP IS STORED AS IT IS SENT. Nothing here reads inside it: the app reads another Admin's copy
-- the way it reads an imported file, record by record. An object, and at most 2,000,000 bytes.
--
-- The seven migrations already on the live project are not edited. This one adds a table and two
-- functions, and nothing else.

create table public.campaign_desks (
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  doc          jsonb not null check (jsonb_typeof(doc) = 'object'),
  rev          bigint not null default 1,
  saved_at     timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

-- No policy and no privilege: the two functions below are the only way in.
alter table public.campaign_desks enable row level security;
revoke all on table public.campaign_desks from public, anon, authenticated;

/* ---- the functions the app calls ----------------------------------------------------------
   Each checks auth.uid(). Refusals: EN_SIGNED_OUT, EN_NOT_ALLOWED, EN_NOT_MINE, EN_BAD_DESK,
   EN_TOO_BIG, EN_MOVED. */

-- The saved desktops of everyone who runs the campaign now, the caller's own among them (`mine`),
-- newest save first, so where two copies hold one record differently the app meets the newer first.
create or replace function public.desk_read(p_campaign uuid)
returns table (mine boolean, rev bigint, saved_at timestamptz, doc jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if not public.runs_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  return query
    select d.user_id = v_uid, d.rev, d.saved_at, d.doc
    from public.campaign_desks d
    join public.campaign_members m on m.campaign_id = d.campaign_id and m.user_id = d.user_id
    where d.campaign_id = p_campaign and m.role in ('admin', 'coadmin')
    order by d.saved_at desc, d.user_id;
end;
$$;

-- Stores the caller's desktop for a campaign they run, and answers the copy's new number. p_rev is
-- the number of the copy the app read before it saved, 0 or null when it read none. p_sender is the
-- account the app means to save as: a session that changed under it is refused with EN_NOT_MINE.
-- The row is locked before it is judged, and a first save that loses a race answers EN_MOVED too.
create or replace function public.desk_save(p_campaign uuid, p_doc jsonb, p_rev bigint default 0, p_sender uuid default null)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_rev bigint;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if p_sender is not null and p_sender <> v_uid then raise exception 'EN_NOT_MINE'; end if;
  if not public.runs_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  if p_doc is null or jsonb_typeof(p_doc) <> 'object' then raise exception 'EN_BAD_DESK'; end if;
  if octet_length(p_doc::text) > 2000000 then raise exception 'EN_TOO_BIG'; end if;
  select d.rev into v_rev from public.campaign_desks d
    where d.campaign_id = p_campaign and d.user_id = v_uid for update;
  if not found then
    if coalesce(p_rev, 0) <> 0 then raise exception 'EN_MOVED'; end if;
    insert into public.campaign_desks (campaign_id, user_id, doc) values (p_campaign, v_uid, p_doc)
      on conflict (campaign_id, user_id) do nothing;
    if not found then raise exception 'EN_MOVED'; end if;
    return 1;
  end if;
  if v_rev <> coalesce(p_rev, 0) then raise exception 'EN_MOVED'; end if;
  update public.campaign_desks set doc = p_doc, rev = v_rev + 1, saved_at = now()
    where campaign_id = p_campaign and user_id = v_uid;
  return v_rev + 1;
end;
$$;

/* ---- who may call what ----------------------------------------------------------------------
   Supabase grants new functions to anon and authenticated by default, so revoking from public
   alone would leave them callable. */

revoke all on function public.desk_read(uuid) from public, anon, authenticated;
revoke all on function public.desk_save(uuid, jsonb, bigint, uuid) from public, anon, authenticated;
grant execute on function public.desk_read(uuid) to authenticated;
grant execute on function public.desk_save(uuid, jsonb, bigint, uuid) to authenticated;
