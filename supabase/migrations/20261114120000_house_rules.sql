-- House rules per campaign. A table decides, once, whether Encumbrance and Weapon Jam are in play, whether
-- Morale is, and whether the GM's -1 Load and the Five-Finger Supply are offered. Until now those were
-- switches on each device, so a player could flip them on their own sheet. They are a setting on the
-- campaign now, and every sheet in it follows. Nothing is written to anyone's sheet: the app reads this
-- column, and a sheet's own device setting comes back if its character leaves. Patterned on the advancement
-- migration: clients only read the table, the one write goes through a security-definer function with a
-- pinned search_path, and the table's write privileges stay withdrawn as they were.
--
-- The migrations already on the live project are not edited. This one adds a column and one function, and
-- nothing else.

-- A map of rule name to true or false. A rule that is not in it has not been decided: the app reads its
-- own book default (the rules on, the GM's controls off). The function below holds the list of names, so a
-- future rule means replacing the function, not this column. The column holds the shape: an object whose
-- every value is a boolean. The path is strict on purpose: in the default lax mode a filter looks inside an
-- array, so {"a": [true]} would pass as a boolean.
alter table public.campaigns
  add column settings jsonb not null default '{}'::jsonb
  check (jsonb_typeof(settings) = 'object' and not jsonb_path_exists(settings, 'strict $.* ? (@.type() != "boolean")'));

/* ---- the one function ---------------------------------------------------------------------
   Those who run the campaign (the Admin and co-Admins) set it. p_rules holds only the rules being changed
   and is merged over what is stored, so two people changing two different rules don't undo each other. The
   letter goes to every character in the campaign in the same step as the change, so a change and its
   letters can't part. Setting rules to what they already are changes nothing and sends nothing, whatever
   the letter says. Refusals: EN_SIGNED_OUT, EN_NOT_ALLOWED, EN_BAD_RULES (nothing to change, a name that is
   not a rule, or a value that is not true or false), EN_BAD_MAIL. The campaign row is locked before it is
   read, so two people applying at once can't both send a letter about a change only one of them made.
   Answers how many letters went. */

create or replace function public.set_house_rules(p_campaign uuid, p_rules jsonb, p_mail jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_mail jsonb;
  v_key text;
  v_now jsonb;
  v_next jsonb;
  v_n integer := 0;
begin
  if v_uid is null then raise exception 'EN_SIGNED_OUT'; end if;
  if not public.runs_campaign(p_campaign) then raise exception 'EN_NOT_ALLOWED'; end if;
  if p_rules is null or jsonb_typeof(p_rules) <> 'object' or p_rules = '{}'::jsonb then raise exception 'EN_BAD_RULES'; end if;
  for v_key in select jsonb_object_keys(p_rules) loop
    if v_key not in ('encumbrance', 'weaponJam', 'morale', 'loadLower', 'fiveFinger') then raise exception 'EN_BAD_RULES'; end if;
    if jsonb_typeof(p_rules -> v_key) <> 'boolean' then raise exception 'EN_BAD_RULES'; end if;
  end loop;
  -- checked whether or not the rules change, so a bad call is refused the same way every time
  v_mail := public.clean_mail(p_mail);
  select c.settings into v_now from public.campaigns c where c.id = p_campaign for update;
  v_next := v_now || p_rules;
  if v_next = v_now then return 0; end if;
  update public.campaigns set settings = v_next where id = p_campaign;
  insert into public.character_inbox (character_id, campaign_id, sender_id, mail)
    select c.id, p_campaign, v_uid, v_mail from public.characters c where c.campaign_id = p_campaign;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.set_house_rules(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.set_house_rules(uuid, jsonb, jsonb) to authenticated;
