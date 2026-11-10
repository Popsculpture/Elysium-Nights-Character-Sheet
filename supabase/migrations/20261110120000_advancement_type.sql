-- One Advancement Type per campaign. A table of players levels on XP or on Milestones, never a bit
-- of each, so the type is a setting on the campaign and every sheet in it follows. Nothing is written
-- to anyone's sheet: the app reads this column and a sheet's own choice comes back when its
-- character leaves. Patterned on the campaigns migration: clients only read the table, the one write
-- goes through a security-definer function with a pinned search_path, and the table's write
-- privileges stay withdrawn as they were.
--
-- The two migrations already on the live project are not edited. This one adds a column and one
-- function, and nothing else.

-- 'xp', 'milestone', or empty for a campaign that has not chosen yet.
alter table public.campaigns
  add column advancement text check (advancement in ('xp', 'milestone'));

/* ---- the one function ---------------------------------------------------------------------
   Those who run the campaign (the Admin and co-Admins) set it. The letter goes to every character
   in the campaign in the same step as the change, so a change and its letters can't part. Setting
   it to what it already is changes nothing and sends nothing, whatever the letter says. There is no
   way back to "not set": a party is all XP or all Milestones, so only 'xp' and 'milestone' are
   accepted. Refusals: EN_SIGNED_OUT, EN_NOT_ALLOWED, EN_BAD_TYPE, EN_BAD_MAIL. The campaign row is
   locked before it is read, so two people flipping it at once can't both send a letter about a
   change only one of them made. Answers how many letters went. */

create or replace function public.set_advancement(p_campaign uuid, p_type text, p_mail jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_mail jsonb;
  v_now text;
  v_n integer := 0;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if not public.runs_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  if p_type is null or p_type not in ('xp', 'milestone') then raise exception 'EN_BAD_TYPE'; end if;
  -- checked whether or not the type changes, so a bad call is refused the same way every time
  v_mail := public.clean_mail(p_mail);
  select c.advancement into v_now from public.campaigns c where c.id = p_campaign for update;
  if v_now is not distinct from p_type then return 0; end if;
  update public.campaigns set advancement = p_type where id = p_campaign;
  insert into public.character_inbox (character_id, campaign_id, sender_id, mail)
    select c.id, p_campaign, v_uid, v_mail from public.characters c where c.campaign_id = p_campaign;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.set_advancement(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.set_advancement(uuid, text, jsonb) to authenticated;
