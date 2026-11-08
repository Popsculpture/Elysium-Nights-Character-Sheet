-- Campaign checks. Run against the project, once the migration is applied, with:
--   npx supabase@2 db query --linked --project-ref ggjgkcnhfpjwyrhakqun -f supabase/tests/campaign_checks.sql
-- Everything runs inside one DO block that ALWAYS ends by raising EN_CHECKS with the results, so
-- the whole block rolls back: the test users, campaigns and characters never ship. Read the
-- result from the error text: it should say 0 FAIL.
-- Each refusal is checked for its own code, not just for an error, so a typo or a missing grant
-- can't pass as a refusal.
do $$
declare
  a uuid := '00000000-0000-4000-8000-00000000c0a1';   -- the Admin
  b uuid := '00000000-0000-4000-8000-00000000c0b2';   -- a co-Admin
  c uuid := '00000000-0000-4000-8000-00000000c0c3';   -- a player
  d uuid := '00000000-0000-4000-8000-00000000c0d4';   -- another player
  e uuid := '00000000-0000-4000-8000-00000000c0e5';   -- not in the campaign
  camp uuid; camp2 uuid;
  t1 text; t2 text; t3 text;
  ch_a uuid; ch_c uuid; ch_c2 uuid; ch_d uuid;
  n int;
  v text;
  j jsonb;
  err text;
  out text := '';
  npass int; nfail int; fails text;
begin
  -- fixtures, as the database owner
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
  values (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'en-camp-a@example.invalid', '{"full_name": "Fixture Admin", "custom_claims": {"global_name": "Night Admin"}}'),
         (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'en-camp-b@example.invalid', '{"full_name": "Fixture Co"}'),
         (c, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'en-camp-c@example.invalid', '{"full_name": "Fixture Cee"}'),
         (d, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'en-camp-d@example.invalid', '{"full_name": "Fixture Dee"}'),
         (e, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'en-camp-e@example.invalid', '{"full_name": "Fixture Eee"}');

  perform set_config('role', 'authenticated', true);

  -- the Admin creates a campaign
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  camp := public.create_campaign('  Check Campaign  ');
  select name into v from public.campaigns where id = camp;
  out := out || case when v = 'Check Campaign' then 'PASS' else 'FAIL' end || E' create_campaign stores the trimmed name\n';
  select count(*) into n from public.campaign_members where campaign_id = camp and user_id = a and role = 'admin';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the creator holds the admin row (' || n || E')\n';
  select token into t1 from public.campaign_invites where campaign_id = camp;
  out := out || case when t1 is not null then 'PASS' else 'FAIL' end || E' create_campaign makes an invite token, and the Admin can read it\n';
  err := null;
  begin perform public.create_campaign('   '); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_NAME' then 'PASS' else 'FAIL' end || ' a blank campaign name is refused (' || coalesce(err, 'no error') || E')\n';

  -- the preview, before anyone joins
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select to_jsonb(p) into j from public.invite_preview(t1) p;
  out := out || case when j ->> 'campaign_name' = 'Check Campaign' and j ->> 'admin_name' = 'Night Admin' then 'PASS' else 'FAIL' end || E' invite_preview shows the campaign and its Admin''s Discord name\n';
  select count(*) into n from jsonb_object_keys(j);
  out := out || case when n = 2 then 'PASS' else 'FAIL' end || ' invite_preview shows nothing else (' || n || E' fields)\n';
  select count(*) into n from public.invite_preview('no-such-token');
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || E' a dead token previews nothing\n';
  select count(*) into n from public.campaigns;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' before joining, a player reads no campaign (' || n || E')\n';

  -- joining twice
  perform public.join_campaign(t1);
  perform public.join_campaign(t1);
  select count(*) into n from public.campaign_members where campaign_id = camp and user_id = c;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' joining twice leaves one membership (' || n || E')\n';
  select role into v from public.campaign_members where campaign_id = camp and user_id = c;
  out := out || case when v = 'player' then 'PASS' else 'FAIL' end || E' a joiner is a player\n';
  select count(*) into n from public.campaigns where id = camp;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a member reads the campaign (' || n || E')\n';
  select count(*) into n from public.campaign_members where campaign_id = camp;
  out := out || case when n = 2 then 'PASS' else 'FAIL' end || ' a member reads the member list (' || n || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.join_campaign(t1);
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  perform public.join_campaign(t1);

  -- the Admin's own click changes nothing
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.join_campaign(t1);
  select role into v from public.campaign_members where campaign_id = camp and user_id = a;
  out := out || case when v = 'admin' then 'PASS' else 'FAIL' end || E' the Admin clicking their own link stays Admin\n';
  perform public.set_role(camp, b, 'coadmin');

  -- the invite token and the blocks are only for those who run it
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.campaign_invites;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a player cannot read the invite token (' || n || E')\n';
  select count(*) into n from public.campaign_blocks;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a player cannot read the blocks (' || n || E')\n';
  err := null;
  begin perform public.campaign_blocked(camp); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a player cannot list who is blocked (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.reset_invite(camp); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a player cannot reset the link (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.campaign_invites where campaign_id = camp;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a co-Admin reads the invite token (' || n || E')\n';

  -- reset
  t2 := public.reset_invite(camp);
  out := out || case when t2 <> t1 then 'PASS' else 'FAIL' end || E' a co-Admin can reset the link, and the token changes\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.join_campaign(t1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_DEAD_INVITE' then 'PASS' else 'FAIL' end || ' after a reset, the old token fails (' || coalesce(err, 'no error') || E')\n';
  select count(*) into n from public.campaigns where id = camp;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a non-member reads no campaign (' || n || E')\n';
  err := null;
  begin perform public.campaign_roster(camp); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a non-member cannot read the roster (' || coalesce(err, 'no error') || E')\n';
  perform public.join_campaign(t2);
  select count(*) into n from public.campaign_members where campaign_id = camp and user_id = e;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' after a reset, the new token works (' || n || E')\n';

  -- nobody writes the tables directly
  err := null;
  begin insert into public.campaign_members (campaign_id, user_id, role) values (camp, e, 'admin'); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a client cannot insert a membership (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin update public.campaign_members set role = 'admin' where user_id = e; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a client cannot promote themselves (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin delete from public.campaign_blocks where campaign_id = camp; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a client cannot delete a block (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin update public.campaign_invites set token = 'mine'; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a client cannot set the token (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.discord_name(a); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a client cannot turn a user id into a name (' || coalesce(err, 'no error') || E')\n';

  -- removing, blocking
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.remove_member(camp, d, false); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a player cannot remove anyone (' || coalesce(err, 'no error') || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.remove_member(camp, e, false);
  select count(*) into n from public.campaign_members where campaign_id = camp and user_id = e;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a co-Admin can remove a player (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  perform public.join_campaign(t2);
  select count(*) into n from public.campaign_members where campaign_id = camp and user_id = e;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a removed account that is not blocked can rejoin (' || n || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.remove_member(camp, e, true);
  select count(*) into n from public.campaign_blocks where campaign_id = camp and user_id = e and blocked_by = a;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' Also block writes the block (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.join_campaign(t2); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BLOCKED' then 'PASS' else 'FAIL' end || ' a blocked account fails on the token it knew (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  t3 := public.reset_invite(camp);
  select count(*) into n from public.campaign_blocked(camp) p where p.user_id = e and p.discord_name = 'Fixture Eee';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' campaign_blocked names the blocked account (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.join_campaign(t3); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BLOCKED' then 'PASS' else 'FAIL' end || ' a blocked account fails on the new token too (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.unblock_member(camp, e);
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  perform public.join_campaign(t3);
  select count(*) into n from public.campaign_members where campaign_id = camp and user_id = e;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a co-Admin can unblock, and the account can rejoin (' || n || E')\n';

  -- nobody removes the Admin, and the Admin cannot leave
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.remove_member(camp, a, false); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_ADMIN_LOCKED' then 'PASS' else 'FAIL' end || ' a co-Admin cannot remove the Admin (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.remove_member(camp, a, false); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_ADMIN_LOCKED' then 'PASS' else 'FAIL' end || ' the Admin cannot remove themselves (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.leave_campaign(camp); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_ADMIN_LOCKED' then 'PASS' else 'FAIL' end || ' the Admin cannot leave (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.set_role(camp, a, 'player'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_ADMIN_LOCKED' then 'PASS' else 'FAIL' end || ' the Admin cannot demote themselves (' || coalesce(err, 'no error') || E')\n';

  -- roles
  err := null;
  begin perform public.set_role(camp, c, 'admin'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_ROLE' then 'PASS' else 'FAIL' end || ' set_role cannot make a second Admin (' || coalesce(err, 'no error') || E')\n';
  perform public.set_role(camp, d, 'coadmin');

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.remove_member(camp, d, false); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_ADMIN_ONLY' then 'PASS' else 'FAIL' end || ' a co-Admin cannot remove a co-Admin (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.set_role(camp, c, 'coadmin'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a co-Admin cannot make a co-Admin (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.rename_campaign(camp, 'Mine'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a co-Admin cannot rename (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.delete_campaign(camp); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a co-Admin cannot delete (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.transfer_leadership(camp, b); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a co-Admin cannot take leadership (' || coalesce(err, 'no error') || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.remove_member(camp, d, false);
  select count(*) into n from public.campaign_members where campaign_id = camp and user_id = d;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' the Admin can remove a co-Admin (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  perform public.join_campaign(t3);
  select role into v from public.campaign_members where campaign_id = camp and user_id = d;
  out := out || case when v = 'player' then 'PASS' else 'FAIL' end || E' a removed co-Admin comes back a player\n';

  -- characters
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  insert into public.characters (name, data) values ('Ada', '{"name": "Ada", "level": 5, "class": "fury", "notes": "ada notes"}') returning id into ch_a;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  insert into public.characters (name, data) values ('Cee One', '{"name": "Cee One", "level": 3, "class": "shaper", "notes": "secret notes"}') returning id into ch_c;
  insert into public.characters (name, data) values ('Cee Two', '{"name": "Cee Two", "level": 1, "class": "hustler"}') returning id into ch_c2;
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  insert into public.characters (name, data) values ('Dee', '{"name": "Dee", "level": 2, "class": "stitcher"}') returning id into ch_d;

  -- a second campaign the player is not in
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  camp2 := public.create_campaign('Other Table');

  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  update public.characters set campaign_id = camp where id = ch_c;
  get diagnostics n = row_count;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a member can put their character in the campaign (' || n || E')\n';
  err := null;
  begin update public.characters set campaign_id = camp2 where id = ch_c2; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a player cannot set campaign_id to a campaign they are not in (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin insert into public.characters (name, data, campaign_id) values ('Sneak', '{}', camp2); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a player cannot insert a character into a campaign they are not in (' || coalesce(err, 'no error') || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  update public.characters set campaign_id = camp where id = ch_d;
  select count(*) into n from public.characters where id = ch_c;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' another player in the same campaign cannot read the row (' || n || E')\n';
  update public.characters set name = 'Stolen' where id = ch_c;
  get diagnostics n = row_count;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' another player cannot change the row (' || n || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  select count(*) into n from public.characters where id = ch_c;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a non-member cannot read the row (' || n || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select data ->> 'notes' into v from public.characters where id = ch_c;
  out := out || case when v = 'secret notes' then 'PASS' else 'FAIL' end || E' the Admin reads a member''s whole sheet, notes included\n';
  update public.characters set name = 'Stolen', campaign_id = null where id = ch_c;
  get diagnostics n = row_count;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' the Admin can read the row but not write it (' || n || E')\n';
  select count(*) into n from public.characters where id = ch_c2;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' the Admin cannot read a member''s character outside the campaign (' || n || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.characters where id = ch_c;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a co-Admin reads a member''s row (' || n || E')\n';
  delete from public.characters where id = ch_c;
  get diagnostics n = row_count;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a co-Admin cannot delete it (' || n || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.campaign_roster(camp) r, jsonb_array_elements(r.characters) x
    where x ->> 'name' = 'Cee One' and (x -> 'level')::text = '3' and x ->> 'class' = 'shaper' and not (x ? 'data') and not (x ? 'notes');
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the roster gives name, level and class, and no sheet (' || n || E')\n';
  select count(*) into n from public.campaign_roster(camp) r where r.user_id = a and r.discord_name = 'Night Admin' and r.role = 'admin';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the roster reads Discord names live (' || n || E')\n';

  -- a campaign move is not a save
  perform set_config('role', 'postgres', true);
  update public.characters set updated_at = '2020-01-01T00:00:00Z' where id in (ch_c, ch_c2, ch_d);
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  update public.characters set campaign_id = null where id = ch_c;
  update public.characters set campaign_id = camp where id = ch_c;
  select count(*) into n from public.characters where id = ch_c and updated_at = '2020-01-01T00:00:00Z' and data ->> 'notes' = 'secret notes';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' moving a character leaves its sheet and updated_at alone (' || n || E')\n';
  update public.characters set data = data || '{"notes": "edited"}' where id = ch_c;
  select count(*) into n from public.characters where id = ch_c and updated_at > '2020-01-01T00:00:00Z';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a real save still moves updated_at (' || n || E')\n';
  update public.characters set data = data || '{"notes": "secret notes"}' where id = ch_c;
  perform set_config('role', 'postgres', true);
  update public.characters set updated_at = '2020-01-01T00:00:00Z' where id = ch_c;
  perform set_config('role', 'authenticated', true);

  -- removal and leaving clear the campaign from the player's characters
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.remove_member(camp, c, false);
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.characters where id = ch_c and campaign_id is null and updated_at = '2020-01-01T00:00:00Z' and data ->> 'notes' = 'secret notes';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' removal clears campaign_id and leaves the sheet alone (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.characters where id = ch_c;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' after removal a co-Admin cannot read the row (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  err := null;
  begin update public.characters set campaign_id = camp where id = ch_c; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a removed player cannot put a character back (' || coalesce(err, 'no error') || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  perform public.leave_campaign(camp);
  select count(*) into n from public.characters where id = ch_d and campaign_id is null;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' leaving clears campaign_id on the player''s characters (' || n || E')\n';
  select count(*) into n from public.campaign_members where campaign_id = camp and user_id = d;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' leaving ends the membership (' || n || E')\n';
  err := null;
  begin perform public.leave_campaign(camp); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_MEMBER' then 'PASS' else 'FAIL' end || ' leaving twice is refused (' || coalesce(err, 'no error') || E')\n';

  -- transfer
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.transfer_leadership(camp, c); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_MEMBER' then 'PASS' else 'FAIL' end || ' leadership only goes to a current member (' || coalesce(err, 'no error') || E')\n';
  perform public.rename_campaign(camp, 'Renamed Table');
  select name into v from public.campaigns where id = camp;
  out := out || case when v = 'Renamed Table' then 'PASS' else 'FAIL' end || E' the Admin can rename\n';
  perform public.transfer_leadership(camp, b);
  select count(*) into n from public.campaign_members where campaign_id = camp and role = 'admin';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' after a transfer there is exactly one Admin (' || n || E')\n';
  select count(*) into n from public.campaign_members where campaign_id = camp and role = 'admin' and user_id = b;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' and it is the new one (' || n || E')\n';
  select role into v from public.campaign_members where campaign_id = camp and user_id = a;
  out := out || case when v = 'coadmin' then 'PASS' else 'FAIL' end || E' the old Admin becomes a co-Admin\n';
  err := null;
  begin perform public.rename_campaign(camp, 'Mine'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' the old Admin has lost the Admin''s powers (' || coalesce(err, 'no error') || E')\n';
  select count(*) into n from public.campaign_invites where campaign_id = camp;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the old Admin still runs it as a co-Admin (' || n || E')\n';

  -- delete
  update public.characters set campaign_id = camp where id = ch_a;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.delete_campaign(camp);
  select count(*) into n from public.campaigns where id = camp;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' the Admin can delete the campaign (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.characters where id = ch_a and campaign_id is null and data ->> 'notes' = 'ada notes';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' deleting clears the campaign and leaves the character (' || n || E')\n';
  select count(*) into n from public.campaign_members where campaign_id = camp;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' deleting takes the memberships with it (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.join_campaign(t3); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_DEAD_INVITE' then 'PASS' else 'FAIL' end || ' a deleted campaign''s link is dead (' || coalesce(err, 'no error') || E')\n';

  -- anon
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
  err := null;
  begin perform public.create_campaign('Anon'); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' anon cannot create a campaign (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.invite_preview(t3); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' anon cannot preview an invite (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin select count(*) into n from public.campaigns; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' anon cannot read campaigns (' || coalesce(err, 'no error') || E')\n';
  perform set_config('role', 'postgres', true);

  -- the error text is cut off after about 1 KB, so the result is the count and any failures in full
  select count(*) filter (where l like 'PASS%'), count(*) filter (where l like 'FAIL%'),
         coalesce(string_agg(l, E'\n') filter (where l like 'FAIL%'), '')
    into npass, nfail, fails from unnest(string_to_array(out, E'\n')) l;
  raise exception E'EN_CHECKS (rolled back)\n% PASS, % FAIL\n%', npass, nfail, fails;
end
$$;
