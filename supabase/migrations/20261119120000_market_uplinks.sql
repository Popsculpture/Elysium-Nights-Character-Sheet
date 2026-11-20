-- Market uplinks per campaign (19 Nov 2026, the author's call). In a campaign the GM chooses which of the Gray Market's
-- storefronts its players can use: The Undercut (on unless the GM turns it off), The Register and Guild Surplus (off until the
-- GM turns them on). The Five-Finger Supply was already a house rule (fiveFinger) and is unchanged. Outside a campaign the app
-- offers every uplink, as it always did. They are three more house rules, so they are three more names set_house_rules
-- accepts: the settings column already holds any rule name with a true or false value, and nothing else changes.
--
-- The migrations already on the live project are not edited. This one replaces set_house_rules with the same function and a
-- longer list of names, and re-grants it as before.

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
    if v_key not in ('encumbrance', 'weaponJam', 'morale', 'loadLower', 'fiveFinger', 'uplinkUndercut', 'uplinkRegister', 'uplinkSurplus') then raise exception 'EN_BAD_RULES'; end if;
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
