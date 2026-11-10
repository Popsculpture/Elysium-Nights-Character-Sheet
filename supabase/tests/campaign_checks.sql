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
  camp uuid; camp2 uuid; camp3 uuid; camp4 uuid;
  t1 text; t2 text; t3 text; t4 text;
  ch_a uuid; ch_c uuid; ch_c2 uuid; ch_d uuid; ch_e uuid;
  m1 uuid; m2 uuid; m3 uuid; m4 uuid;
  w1 uuid; w2 uuid; w3 uuid;
  bad jsonb;
  n int;
  n2 int;
  campx uuid; campy uuid; campz uuid;
  t5 text;
  v text;
  f text;
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
  err := null;
  begin perform public.create_campaign(repeat('x', 81)); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_NAME' then 'PASS' else 'FAIL' end || ' an 81-character campaign name is refused (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.create_campaign(repeat('x', 80)); exception when others then err := sqlerrm; end;
  out := out || case when err is null then 'PASS' else 'FAIL' end || ' an 80-character campaign name is fine (' || coalesce(err, 'no error') || E')\n';

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
  -- these need a block to exist: asked of an empty table they pass with row security off
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.campaign_blocks;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a player cannot read a block that exists (' || n || E')\n';
  err := null;
  begin perform public.unblock_member(camp, e); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a player cannot unblock (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.campaign_blocks where campaign_id = camp and user_id = e;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a co-Admin reads the block (' || n || E')\n';
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
  perform set_config('role', 'postgres', true);
  err := null;
  begin update public.campaign_members set role = 'admin' where campaign_id = camp and user_id = c; exception when others then err := sqlstate; end;
  out := out || case when err = '23505' then 'PASS' else 'FAIL' end || ' the database itself refuses a second Admin (' || coalesce(err, 'no error') || E')\n';
  perform set_config('role', 'authenticated', true);
  perform public.set_role(camp, b, 'player');
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.campaign_invites where campaign_id = camp;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a co-Admin made a player again loses the invite (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.set_role(camp, b, 'coadmin');
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

  -- e rejoined above, so they leave first: from here they are truly outside this campaign
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  perform public.leave_campaign(camp);
  select count(*) into n from public.characters where id = ch_c;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a non-member cannot read the row (' || n || E')\n';
  select (select count(*) from public.campaigns where id = camp)
       + (select count(*) from public.campaign_members where campaign_id = camp)
       + (select count(*) from public.campaign_invites where campaign_id = camp)
       + (select count(*) from public.campaign_blocks where campaign_id = camp)
       + (select count(*) from public.characters where campaign_id = camp) into n;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a non-member cannot read anything of the campaign (' || n || E')\n';

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
  select count(*) into n from public.campaign_roster(camp) r, jsonb_array_elements(r.characters) x where x ->> 'name' = 'Cee Two';
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a character outside the campaign stays off the roster (' || n || E')\n';
  select count(*) into n from public.campaign_roster(camp) r, jsonb_array_elements(r.characters) x where x ->> 'name' = 'Dee' and r.user_id = c;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' the roster lists a character under its own player only (' || n || E')\n';
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
  update public.characters set name = 'Cee Renamed' where id = ch_c;
  select count(*) into n from public.characters where id = ch_c and updated_at > '2020-01-01T00:00:00Z';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a rename still moves updated_at (' || n || E')\n';
  update public.characters set name = 'Cee One' where id = ch_c;
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
  select count(*) into n from public.characters where id = ch_d and campaign_id = camp;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' removing one player leaves the other players'' characters in (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  err := null;
  begin update public.characters set campaign_id = camp where id = ch_c; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a removed player cannot put a character back (' || coalesce(err, 'no error') || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  update public.characters set campaign_id = camp where id = ch_a;
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
  select count(*) into n from public.characters where id = ch_a and campaign_id = camp;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' one player leaving leaves the other characters in (' || n || E')\n';
  err := null;
  begin perform public.remove_member(camp, d, false); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_MEMBER' then 'PASS' else 'FAIL' end || ' removing someone not in the campaign is refused (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.set_role(camp, d, 'player'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_MEMBER' then 'PASS' else 'FAIL' end || ' setting the role of someone not in the campaign is refused (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.transfer_leadership(camp, a); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_MEMBER' then 'PASS' else 'FAIL' end || ' the Admin cannot transfer to themselves (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.transfer_leadership(camp, c); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_MEMBER' then 'PASS' else 'FAIL' end || ' leadership only goes to a current member (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.rename_campaign(camp, '   '); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_NAME' then 'PASS' else 'FAIL' end || ' a blank rename is refused (' || coalesce(err, 'no error') || E')\n';
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

  -- a campaign deleted at the database, not through the function, leaves nothing pointing at it
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  insert into public.characters (name, data, campaign_id) values ('Eee', '{"name": "Eee"}', camp2) returning id into ch_e;
  out := out || case when ch_e is not null then 'PASS' else 'FAIL' end || E' a member can insert a character into their own campaign\n';
  perform set_config('role', 'postgres', true);
  delete from public.campaigns where id = camp2;
  select count(*) into n from public.characters where id = ch_e and campaign_id is null;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' deleting a campaign row clears it from its characters (' || n || E')\n';

  /* ---- #POST from the Admin (the inbox migration) ----
     a runs camp3, b is a co-Admin, c and d are players in it with one character each, e is outside it
     and runs camp4. Each read below that should answer nothing first makes sure there is something to see. */
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  camp3 := public.create_campaign('Inbox Table');
  select token into t4 from public.campaign_invites where campaign_id = camp3;
  update public.characters set campaign_id = camp3 where id = ch_a;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.join_campaign(t4);
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform public.join_campaign(t4);
  update public.characters set campaign_id = camp3 where id = ch_c;
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  perform public.join_campaign(t4);
  update public.characters set campaign_id = camp3 where id = ch_d;
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  camp4 := public.create_campaign('Stranger Table');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.set_role(camp3, b, 'coadmin');

  select count(*) into n from pg_catalog.pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'character_inbox';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' character_inbox is in the Realtime publication (' || n || E')\n';

  -- who can send
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.send_to_character(ch_d, '{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a player cannot send to another character (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.send_to_character(ch_c, '{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a player cannot send to their own character (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.send_to_crew(camp3, '{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a player cannot send to the crew (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.send_to_character(ch_c, '{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' the Admin of another campaign cannot send to this character (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.send_to_crew(camp3, '{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' the Admin of another campaign cannot send to this crew (' || coalesce(err, 'no error') || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  m1 := public.send_to_character(ch_c, '{"from": "  Kade  ", "subj": " A job ", "body": " Come alone. ", "package": [{"name": " Stimpak ", "qty": 2}, {"name": "Rope", "qty": 1.0}]}');
  select count(*) into n from public.character_inbox i where i.id = m1 and i.status = 'waiting' and i.sender_id = b and i.character_id = ch_c and i.campaign_id = camp3 and i.delivered_at is null and i.taken_at is null;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a co-Admin can send, and the row waits with its sender and campaign (' || n || E')\n';
  select mail into j from public.character_inbox where id = m1;
  out := out || case when j = '{"from": "Kade", "subj": "A job", "body": "Come alone.", "package": [{"name": "Stimpak", "qty": 2}, {"name": "Rope", "qty": 1}]}'::jsonb then 'PASS' else 'FAIL' end || ' the mail is stored trimmed (' || coalesce(j::text, 'null') || E')\n';
  -- as text: jsonb calls 1.0 and 1 equal, but a quantity on its way to a record should be a whole number
  out := out || case when j -> 'package' -> 1 ->> 'qty' = '1' then 'PASS' else 'FAIL' end || ' a quantity sent as 1.0 is stored as 1 (' || coalesce(j -> 'package' -> 1 ->> 'qty', 'null') || E')\n';

  -- nobody writes the table directly
  err := null;
  begin insert into public.character_inbox (character_id, campaign_id, sender_id, mail) values (ch_c, camp3, b, '{}'); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a sender cannot insert a row directly (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin update public.character_inbox set mail = '{}' where id = m1; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a sender cannot rewrite a row (' || coalesce(err, 'no error') || E')\n';

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  m2 := public.send_to_character(ch_c, '{"from": "Kade", "body": "No package here."}');
  select count(*) into n from public.character_inbox i where i.id = m2 and i.sender_id = a and not (i.mail ? 'package');
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the Admin can send, and a message can go alone (' || n || E')\n';
  m3 := public.send_to_character(ch_c, '{"from": "Kade", "package": [{"name": "Rope", "qty": 99}]}');
  select count(*) into n from public.character_inbox i where i.id = m3 and i.mail ->> 'subj' = '' and i.mail ->> 'body' = '' and i.mail -> 'package' -> 0 ->> 'qty' = '99';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a package can go alone, and 99 is allowed (' || n || E')\n';
  m4 := public.send_to_character(ch_c, '{"from": "Kade", "subj": "Empty box", "package": []}');
  select count(*) into n from public.character_inbox i where i.id = m4 and not (i.mail ? 'package');
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' an empty package is no package (' || n || E')\n';
  select jsonb_agg(jsonb_build_object('name', 'Item ' || x, 'qty', 1)) into j from generate_series(1, 20) x;
  err := null;
  begin perform public.send_to_character(ch_c, jsonb_build_object('from', 'Kade', 'package', j)); exception when others then err := sqlerrm; end;
  out := out || case when err is null then 'PASS' else 'FAIL' end || ' twenty items are allowed (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.send_to_character(ch_c, jsonb_build_object('from', repeat('k', 80), 'subj', repeat('s', 140), 'body', repeat('b', 4000), 'package', jsonb_build_array(jsonb_build_object('name', repeat('n', 120), 'qty', 1)))); exception when others then err := sqlerrm; end;
  out := out || case when err is null then 'PASS' else 'FAIL' end || ' every field at its longest is allowed (' || coalesce(err, 'no error') || E')\n';

  -- anything but a #POST message with an optional package
  v := '';
  foreach bad in array array[
    'null'::jsonb, '[]'::jsonb, '"hi"'::jsonb, '{}'::jsonb,
    '{"subj": "No from"}'::jsonb, '{"from": "", "subj": "Blank"}'::jsonb, '{"from": "   ", "subj": "Blank"}'::jsonb, '{"from": 7, "subj": "Number"}'::jsonb,
    '{"from": "Kade"}'::jsonb, '{"from": "Kade", "subj": " ", "body": " "}'::jsonb,
    '{"from": "Kade", "subj": 7}'::jsonb, '{"from": "Kade", "body": {"a": 1}}'::jsonb, '{"from": "Kade", "subj": null}'::jsonb,
    '{"from": "Kade", "subj": "Hi", "op": "glimmer"}'::jsonb, '{"from": "Kade", "subj": "Hi", "amount": 500}'::jsonb, '{"from": "Kade", "subj": "Hi", "read": true}'::jsonb,
    '{"from": "Kade", "package": {"name": "Rope", "qty": 1}}'::jsonb, '{"from": "Kade", "package": "Rope"}'::jsonb, '{"from": "Kade", "package": null}'::jsonb,
    '{"from": "Kade", "package": ["Rope"]}'::jsonb, '{"from": "Kade", "package": [{"name": "Rope"}]}'::jsonb, '{"from": "Kade", "package": [{"qty": 1}]}'::jsonb,
    '{"from": "Kade", "package": [{"name": 7, "qty": 1}]}'::jsonb, '{"from": "Kade", "package": [{"name": " ", "qty": 1}]}'::jsonb,
    '{"from": "Kade", "package": [{"name": "Rope", "qty": 0}]}'::jsonb, '{"from": "Kade", "package": [{"name": "Rope", "qty": 100}]}'::jsonb,
    '{"from": "Kade", "package": [{"name": "Rope", "qty": -1}]}'::jsonb, '{"from": "Kade", "package": [{"name": "Rope", "qty": 1.5}]}'::jsonb,
    '{"from": "Kade", "package": [{"name": "Rope", "qty": "2"}]}'::jsonb, '{"from": "Kade", "package": [{"name": "Rope", "qty": 1, "taken": true}]}'::jsonb,
    jsonb_build_object('from', repeat('k', 81), 'subj', 'Long'), jsonb_build_object('from', 'Kade', 'subj', repeat('s', 141)),
    jsonb_build_object('from', 'Kade', 'body', repeat('b', 4001)), jsonb_build_object('from', 'Kade', 'package', jsonb_build_array(jsonb_build_object('name', repeat('n', 121), 'qty', 1))),
    jsonb_build_object('from', 'Kade', 'package', (select jsonb_agg(jsonb_build_object('name', 'Item ' || x, 'qty', 1)) from generate_series(1, 21) x))
  ] loop
    err := null;
    begin perform public.send_to_character(ch_c, bad); exception when others then err := sqlerrm; end;
    if err is distinct from 'EN_BAD_MAIL' then v := v || left(bad::text, 60) || ' = ' || coalesce(err, 'no error') || '; '; end if;
  end loop;
  out := out || case when v = '' then 'PASS' else 'FAIL' end || ' every malformed mail is refused as EN_BAD_MAIL (' || v || E')\n';
  err := null;
  begin perform public.send_to_character(ch_c, null); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_MAIL' then 'PASS' else 'FAIL' end || ' no mail at all is refused (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.send_to_crew(camp3, '{"from": "Kade", "subj": "Hi", "op": "xp"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_MAIL' then 'PASS' else 'FAIL' end || ' the crew send checks the mail too (' || coalesce(err, 'no error') || E')\n';

  -- who can be sent to
  err := null;
  begin perform public.send_to_character(ch_c2, '{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a character in no campaign cannot be sent to (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.send_to_character(gen_random_uuid(), '{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a character that does not exist answers the same way (' || coalesce(err, 'no error') || E')\n';

  -- the crew: every character in the campaign, and no other
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  n := public.send_to_crew(camp3, '{"from": "Fixer", "subj": "Crew call", "package": [{"name": "Rope", "qty": 3}]}');
  out := out || case when n = 3 then 'PASS' else 'FAIL' end || ' a co-Admin can send to the crew, one row per character (' || n || E')\n';
  select count(*) into n from public.character_inbox i where i.mail ->> 'from' = 'Fixer' and i.sender_id = b and i.status = 'waiting' and i.campaign_id = camp3 and i.character_id in (ch_a, ch_c, ch_d);
  out := out || case when n = 3 then 'PASS' else 'FAIL' end || ' the crew rows reach the Admin''s character and both players'' (' || n || E')\n';
  select count(*) into n from public.character_inbox i where i.mail ->> 'from' = 'Fixer' and i.character_id = ch_c2;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' the crew send skips a character outside the campaign (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  n := public.send_to_crew(camp4, '{"from": "Kade", "subj": "Nobody home"}');
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a crew with no characters answers zero (' || n || E')\n';

  -- who can read
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.character_inbox where id = m2;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the owner reads their character''s row (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.character_inbox where id = m1;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the sender reads their send (' || n || E')\n';
  select count(*) into n from public.character_inbox where id = m2;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' another co-Admin cannot read someone else''s send (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.character_inbox where id = m1;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' the Admin cannot read a co-Admin''s send to someone else (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  select count(*) into n from public.character_inbox where id = m2;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' another player cannot read it (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  select count(*) into n from public.character_inbox where id = m2;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' someone outside the campaign cannot read it (' || n || E')\n';

  -- recall
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.recall_send(m1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' the owner cannot recall (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.recall_send(m1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' another of those who run it cannot recall someone else''s send (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.recall_send(gen_random_uuid()); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a send that does not exist cannot be recalled (' || coalesce(err, 'no error') || E')\n';
  perform public.recall_send(m3);
  select count(*) into n from public.character_inbox where id = m3 and status = 'recalled';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the sender can recall while it waits (' || n || E')\n';
  err := null;
  begin perform public.recall_send(m3); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TOO_LATE' then 'PASS' else 'FAIL' end || ' a recalled send cannot be recalled again (' || coalesce(err, 'no error') || E')\n';

  -- delivery
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.mark_delivered(m2); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' the sender cannot mark it delivered (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.mark_delivered(m2); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' another player cannot mark it delivered (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.mark_delivered(gen_random_uuid()); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a row that does not exist cannot be marked (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.mark_delivered(m3); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_RECALLED' then 'PASS' else 'FAIL' end || ' a recalled send cannot be delivered (' || coalesce(err, 'no error') || E')\n';
  perform public.mark_delivered(m2);
  select count(*) into n from public.character_inbox where id = m2 and status = 'delivered' and delivered_at is not null and taken_at is null;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the owner can mark it delivered (' || n || E')\n';
  err := null;
  begin perform public.mark_delivered(m2); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_ALREADY' then 'PASS' else 'FAIL' end || ' mark_delivered works once (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.recall_send(m2); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TOO_LATE' then 'PASS' else 'FAIL' end || ' recall fails once delivered (' || coalesce(err, 'no error') || E')\n';
  select count(*) into n from public.character_inbox where id = m2 and status = 'delivered';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a refused recall leaves it delivered (' || n || E')\n';

  -- taking
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.mark_taken(m2); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NO_PACKAGE' then 'PASS' else 'FAIL' end || ' a message with no package cannot be taken (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.mark_taken(m1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_DELIVERED' then 'PASS' else 'FAIL' end || ' a package still waiting cannot be taken (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.mark_taken(m3); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_RECALLED' then 'PASS' else 'FAIL' end || ' a recalled package cannot be taken (' || coalesce(err, 'no error') || E')\n';
  perform public.mark_delivered(m1);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.mark_taken(m1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' the sender cannot mark it taken (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.mark_taken(m1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' another player cannot mark it taken (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.mark_taken(gen_random_uuid()); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a row that does not exist cannot be taken (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform public.mark_taken(m1);
  select count(*) into n from public.character_inbox where id = m1 and status = 'taken' and taken_at is not null and delivered_at is not null;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the owner can mark it taken (' || n || E')\n';
  err := null;
  begin perform public.mark_taken(m1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_ALREADY' then 'PASS' else 'FAIL' end || ' mark_taken works once (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.mark_delivered(m1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_ALREADY' then 'PASS' else 'FAIL' end || ' a taken package cannot go back to delivered (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select status into v from public.character_inbox where id = m1;
  out := out || case when v = 'taken' then 'PASS' else 'FAIL' end || E' the sender sees Taken\n';
  err := null;
  begin perform public.recall_send(m1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TOO_LATE' then 'PASS' else 'FAIL' end || ' a taken package cannot be recalled (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  err := null;
  begin delete from public.character_inbox where id = m4; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' the owner cannot delete a row (' || coalesce(err, 'no error') || E')\n';

  -- a removed player: the mail already on its way still belongs to the sender and the owner
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.remove_member(camp3, c, false);
  err := null;
  begin perform public.send_to_character(ch_c, '{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a removed player''s character cannot be sent to (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.character_inbox where id = m4 and status = 'waiting';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a removed player still reads what was on its way (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.recall_send(m4);
  select count(*) into n from public.character_inbox where id = m4 and status = 'recalled';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the sender can still recall it (' || n || E')\n';

  -- the status is one of the four, whoever asks
  perform set_config('role', 'postgres', true);
  err := null;
  begin update public.character_inbox set status = 'lost' where id = m4; exception when others then err := sqlstate; end;
  out := out || case when err = '23514' then 'PASS' else 'FAIL' end || ' the database refuses a status that is not one of the four (' || coalesce(err, 'no error') || E')\n';
  perform set_config('role', 'authenticated', true);

  /* ---- a row with numbers on it (the inbox writes migration) ----
     a runs camp3, b is a co-Admin, d is a player in it, c was removed above, e is outside it. */
  -- who can send
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.send_write(ch_d, 'k0', '{"from": "Payroll", "subj": "Hi"}', '[{"op": "glimmer", "amount": 5}]'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a player cannot pay their own character (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.send_write(ch_d, 'k0', '{"from": "Payroll", "subj": "Hi"}', '[{"op": "glimmer", "amount": 5}]'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' the Admin of another campaign cannot pay this character (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.send_write(ch_c, 'k0', '{"from": "Payroll", "subj": "Hi"}', '[{"op": "glimmer", "amount": 5}]'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a removed player''s character cannot be paid (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.send_write(gen_random_uuid(), 'k0', '{"from": "Payroll", "subj": "Hi"}', '[{"op": "glimmer", "amount": 5}]'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a character that does not exist answers the same way (' || coalesce(err, 'no error') || E')\n';
  select count(*) into n from public.character_inbox where send_key = 'k0';
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a refused send leaves no row (' || n || E')\n';

  -- the row itself
  w1 := public.send_write(ch_d, 'k1', '{"from": "  Payroll  ", "subj": " Payday: The Toll ", "body": " Your share "}', '[{"op": "glimmer", "amount": 1200.0}, {"op": "nexus", "amount": 2.50}, {"op": "xp", "amount": 500}, {"op": "milestone", "kind": "minor", "amount": 1}]');
  select count(*) into n from public.character_inbox i where i.id = w1 and i.status = 'due' and i.sender_id = a and i.character_id = ch_d and i.campaign_id = camp3 and i.delivered_at is null and i.send_key = 'k1';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the Admin can pay, and the row is due with its sender, campaign and key (' || n || E')\n';
  select ops into j from public.character_inbox where id = w1;
  out := out || case when j = '[{"op": "glimmer", "amount": 1200}, {"op": "nexus", "amount": 2.5}, {"op": "xp", "amount": 500}, {"op": "milestone", "kind": "minor", "amount": 1}]'::jsonb then 'PASS' else 'FAIL' end || ' the ops are stored clean (' || coalesce(j::text, 'null') || E')\n';
  -- as text: jsonb calls 1200.0 and 1200 equal, but a number on its way to a sheet should be the plain one
  out := out || case when j -> 0 ->> 'amount' = '1200' and j -> 1 ->> 'amount' = '2.5' then 'PASS' else 'FAIL' end || ' 1200.0 is stored as 1200 and 2.50 as 2.5 (' || coalesce(j -> 0 ->> 'amount', 'null') || ', ' || coalesce(j -> 1 ->> 'amount', 'null') || E')\n';
  select mail into j from public.character_inbox where id = w1;
  out := out || case when j = '{"from": "Payroll", "subj": "Payday: The Toll", "body": "Your share"}'::jsonb then 'PASS' else 'FAIL' end || ' the letter is stored trimmed (' || coalesce(j::text, 'null') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  w2 := public.send_write(ch_d, 'k1', '{"from": "Payroll", "subj": "Mine"}', '[{"op": "xp", "amount": -30}]');
  select count(*) into n from public.character_inbox i where i.id = w2 and i.sender_id = b and i.status = 'due' and i.ops -> 0 ->> 'amount' = '-30';
  out := out || case when n = 1 and w2 <> w1 then 'PASS' else 'FAIL' end || ' a co-Admin can send, a negative amount is fine, and a key is per sender (' || n || E')\n';

  -- a repeat is the same row
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  w3 := public.send_write(ch_d, 'k1', '{"from": "Payroll", "subj": "Payday: The Toll"}', '[{"op": "glimmer", "amount": 1200}]');
  out := out || case when w3 = w1 then 'PASS' else 'FAIL' end || E' the same key again answers with the same row\n';
  select count(*) into n from public.character_inbox where send_key = 'k1' and sender_id = a;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' and makes no second one (' || n || E')\n';
  select count(*) into n from public.character_inbox where id = w1 and mail ->> 'body' = 'Your share';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' and changes nothing on the first (' || n || E')\n';
  err := null;
  begin perform public.send_write(ch_a, 'k1', '{"from": "Payroll", "subj": "Hi"}', '[{"op": "glimmer", "amount": 5}]'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a key already used for another character is refused (' || coalesce(err, 'no error') || E')\n';
  -- the retry has to work even if the character moved after the first try landed
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  update public.characters set campaign_id = null where id = ch_d;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.send_write(ch_d, 'k9', '{"from": "Payroll", "subj": "Hi"}', '[{"op": "glimmer", "amount": 5}]'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a character that left the campaign cannot be paid anew (' || coalesce(err, 'no error') || E')\n';
  w3 := public.send_write(ch_d, 'k1', '{"from": "Payroll", "subj": "Payday: The Toll"}', '[{"op": "glimmer", "amount": 1200}]');
  out := out || case when w3 = w1 then 'PASS' else 'FAIL' end || E' but the send that already went still answers with its row\n';
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  update public.characters set campaign_id = camp3 where id = ch_d;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  -- plain mail through the same door
  w3 := public.send_write(ch_d, 'k2', '{"from": "JOB BOARD", "subj": "The Toll", "when": " 03:14, Tuesday "}', null);
  select count(*) into n from public.character_inbox i where i.id = w3 and i.status = 'waiting' and i.ops is null and i.send_key = 'k2' and i.mail ->> 'when' = '03:14, Tuesday';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' with no ops it is plain mail that waits, with its When trimmed (' || n || E')\n';
  perform public.send_write(ch_d, 'k3', '{"from": "JOB BOARD", "subj": "No when", "when": "   "}');
  select count(*) into n from public.character_inbox i where i.send_key = 'k3' and not (i.mail ? 'when');
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a blank When is no When, and p_ops can be left off (' || n || E')\n';
  perform public.send_write(ch_d, 'k4', jsonb_build_object('from', 'JOB BOARD', 'subj', 'Long when', 'when', repeat('w', 40)));
  select count(*) into n from public.character_inbox i where i.send_key = 'k4' and char_length(i.mail ->> 'when') = 40;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' a 40-character When is allowed (' || n || E')\n';
  perform public.send_write(ch_d, 'k5', '{"from": "Kade", "subj": "Gift", "package": [{"name": "Rope", "qty": 1}]}');
  select count(*) into n from public.character_inbox i where i.send_key = 'k5' and i.status = 'waiting' and i.mail ? 'package';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' plain mail can still carry a package (' || n || E')\n';
  perform public.recall_send(w3);
  select count(*) into n from public.character_inbox where id = w3 and status = 'recalled';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' plain mail can still be recalled while it waits (' || n || E')\n';
  select count(*) into n from public.character_inbox where send_key is null and ops is not null;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' nothing else made a row with ops (' || n || E')\n';
  err := null;
  begin perform public.send_to_character(ch_d, '{"from": "Kade", "subj": "Hi", "when": "03:14"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_MAIL' then 'PASS' else 'FAIL' end || ' batch 3''s door still takes no When (' || coalesce(err, 'no error') || E')\n';

  -- what a key, a When and a letter can't be
  v := '';
  foreach f in array array['', repeat('k', 81)] loop
    err := null;
    begin perform public.send_write(ch_d, f, '{"from": "Payroll", "subj": "Hi"}', '[{"op": "xp", "amount": 5}]'); exception when others then err := sqlerrm; end;
    if err is distinct from 'EN_BAD_KEY' then v := v || left(f, 10) || ' = ' || coalesce(err, 'no error') || '; '; end if;
  end loop;
  err := null;
  begin perform public.send_write(ch_d, null, '{"from": "Payroll", "subj": "Hi"}', '[{"op": "xp", "amount": 5}]'); exception when others then err := sqlerrm; end;
  if err is distinct from 'EN_BAD_KEY' then v := v || 'null = ' || coalesce(err, 'no error') || '; '; end if;
  out := out || case when v = '' then 'PASS' else 'FAIL' end || ' a blank, missing or 81-character key is refused (' || v || E')\n';
  err := null;
  begin perform public.send_write(ch_d, repeat('k', 80), '{"from": "Payroll", "subj": "Hi"}', '[{"op": "xp", "amount": 5}]'); exception when others then err := sqlerrm; end;
  out := out || case when err is null then 'PASS' else 'FAIL' end || ' an 80-character key is fine (' || coalesce(err, 'no error') || E')\n';
  v := '';
  foreach bad in array array[
    'null'::jsonb, '[]'::jsonb, '{"from": "Payroll"}'::jsonb, '{"subj": "No from"}'::jsonb,
    '{"from": "Payroll", "subj": "Hi", "op": "glimmer"}'::jsonb, '{"from": "Payroll", "subj": "Hi", "when": 7}'::jsonb,
    jsonb_build_object('from', 'Payroll', 'subj', 'Hi', 'when', repeat('w', 41)),
    '{"from": "Payroll", "subj": "Box", "package": [{"name": "Rope", "qty": 1}]}'::jsonb,
    '{"subj": "No from", "when": "03:14"}'::jsonb, '{"from": "Payroll", "subj": "Hi", "op": "xp", "when": "03:14"}'::jsonb
  ] loop
    err := null;
    begin perform public.send_write(ch_d, 'kb', bad, '[{"op": "xp", "amount": 5}]'); exception when others then err := sqlerrm; end;
    if err is distinct from 'EN_BAD_MAIL' then v := v || left(bad::text, 60) || ' = ' || coalesce(err, 'no error') || '; '; end if;
  end loop;
  out := out || case when v = '' then 'PASS' else 'FAIL' end || ' a row with ops needs a good letter, with no package on it (' || v || E')\n';
  err := null;
  begin perform public.send_write(ch_d, 'kb', null, '[{"op": "xp", "amount": 5}]'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_MAIL' then 'PASS' else 'FAIL' end || ' no letter at all is refused (' || coalesce(err, 'no error') || E')\n';

  -- anything but the closed list of ops
  v := '';
  foreach bad in array array[
    'null'::jsonb, '{}'::jsonb, '"glimmer"'::jsonb, '7'::jsonb, '[]'::jsonb, '[7]'::jsonb, '["glimmer"]'::jsonb,
    '[{"op": "glimmer", "amount": 1}, {"op": "glimmer", "amount": 1}, {"op": "glimmer", "amount": 1}, {"op": "glimmer", "amount": 1}, {"op": "glimmer", "amount": 1}]'::jsonb,
    '[{"amount": 5}]'::jsonb, '[{"op": 7, "amount": 5}]'::jsonb, '[{"op": "post", "amount": 5}]'::jsonb, '[{"op": "post", "mail": {"from": "x"}}]'::jsonb,
    '[{"op": "heat", "source": "Kindred", "delta": 1}]'::jsonb, '[{"op": "heat", "amount": 1}]'::jsonb, '[{"op": "vigor"}]'::jsonb, '[{"op": "vigor", "amount": 1}]'::jsonb, '[{"op": "GLIMMER", "amount": 5}]'::jsonb,
    '[{"op": "glimmer"}]'::jsonb, '[{"op": "glimmer", "amount": "5"}]'::jsonb, '[{"op": "glimmer", "amount": null}]'::jsonb, '[{"op": "glimmer", "amount": 0}]'::jsonb,
    '[{"op": "glimmer", "amount": 1.5}]'::jsonb, '[{"op": "xp", "amount": 1.5}]'::jsonb, '[{"op": "nexus", "amount": 1.555}]'::jsonb, '[{"op": "nexus", "amount": 0}]'::jsonb,
    '[{"op": "glimmer", "amount": 10000001}]'::jsonb, '[{"op": "glimmer", "amount": -10000001}]'::jsonb, '[{"op": "xp", "amount": 10000001}]'::jsonb, '[{"op": "nexus", "amount": 1000000.01}]'::jsonb, '[{"op": "nexus", "amount": -1000000.01}]'::jsonb,
    '[{"op": "glimmer", "amount": 5, "extra": 1}]'::jsonb, '[{"op": "glimmer", "amount": 5, "kind": "major"}]'::jsonb, '[{"op": "xp", "amount": 5, "kind": "minor"}]'::jsonb, '[{"op": "nexus", "amount": 5, "kind": "minor"}]'::jsonb,
    '[{"op": "milestone", "amount": 1}]'::jsonb, '[{"op": "milestone", "kind": "huge", "amount": 1}]'::jsonb, '[{"op": "milestone", "kind": 7, "amount": 1}]'::jsonb,
    '[{"op": "milestone", "kind": "major"}]'::jsonb, '[{"op": "milestone", "kind": "major", "amount": 1.5}]'::jsonb, '[{"op": "milestone", "kind": "major", "amount": 0}]'::jsonb,
    '[{"op": "milestone", "kind": "major", "amount": 100}]'::jsonb, '[{"op": "milestone", "kind": "major", "amount": -100}]'::jsonb, '[{"op": "milestone", "kind": "major", "amount": 1, "why": "x"}]'::jsonb
  ] loop
    err := null;
    begin perform public.send_write(ch_d, 'kb', '{"from": "Payroll", "subj": "Hi"}', bad); exception when others then err := sqlerrm; end;
    if err is distinct from 'EN_BAD_OPS' then v := v || left(bad::text, 60) || ' = ' || coalesce(err, 'no error') || '; '; end if;
  end loop;
  out := out || case when v = '' then 'PASS' else 'FAIL' end || ' every malformed list of ops is refused as EN_BAD_OPS (' || v || E')\n';
  select count(*) into n from public.character_inbox where send_key = 'kb';
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' none of them left a row (' || n || E')\n';
  -- right at each edge
  v := '';
  foreach bad in array array[
    '[{"op": "glimmer", "amount": 10000000}]'::jsonb, '[{"op": "glimmer", "amount": -10000000}]'::jsonb, '[{"op": "xp", "amount": 10000000}]'::jsonb, '[{"op": "xp", "amount": -10000000}]'::jsonb,
    '[{"op": "nexus", "amount": 1000000}]'::jsonb, '[{"op": "nexus", "amount": -1000000}]'::jsonb, '[{"op": "nexus", "amount": 0.01}]'::jsonb,
    '[{"op": "milestone", "kind": "major", "amount": 99}]'::jsonb, '[{"op": "milestone", "kind": "minor", "amount": -99}]'::jsonb,
    '[{"op": "glimmer", "amount": 1}, {"op": "nexus", "amount": 1}, {"op": "xp", "amount": 1}, {"op": "milestone", "kind": "major", "amount": 1}]'::jsonb
  ] loop
    err := null;
    begin perform public.send_write(ch_d, 'edge' || md5(bad::text), '{"from": "Payroll", "subj": "Hi"}', bad); exception when others then err := sqlerrm; end;
    if err is not null then v := v || left(bad::text, 60) || ' = ' || err || '; '; end if;
  end loop;
  out := out || case when v = '' then 'PASS' else 'FAIL' end || ' every op at its limit is allowed (' || v || E')\n';

  -- batch 3's doors stop at it, every one
  err := null;
  begin perform public.recall_send(w1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TOO_LATE' then 'PASS' else 'FAIL' end || ' a row with ops cannot be recalled (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.mark_delivered(w1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_ALREADY' then 'PASS' else 'FAIL' end || ' mark_delivered cannot take one (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.mark_taken(w1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NO_PACKAGE' then 'PASS' else 'FAIL' end || ' mark_taken cannot take one (' || coalesce(err, 'no error') || E')\n';
  select count(*) into n from public.character_inbox where id = w1 and status = 'due' and delivered_at is null;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' and after all of that it is still due (' || n || E')\n';

  -- reads: the same two people as any send
  select count(*) into n from public.character_inbox where id = w1 and ops is not null;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the owner reads the ops (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.character_inbox where id = w1 and ops is not null;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the sender reads the ops (' || n || E')\n';
  select count(*) into n from public.character_inbox where id = w2;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' the Admin cannot read a co-Admin''s row (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  select count(*) into n from public.character_inbox where id = w1;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' someone outside the campaign cannot read it (' || n || E')\n';

  -- marking it
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.mark_applied(w1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' the sender cannot mark it applied (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.mark_applied(w1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' another player cannot mark it applied (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.mark_applied(gen_random_uuid()); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a row that does not exist cannot be marked (' || coalesce(err, 'no error') || E')\n';
  select i.id into w3 from public.character_inbox i where i.send_key = 'k3';
  err := null;
  begin perform public.mark_applied(w3); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' plain mail cannot be marked applied (' || coalesce(err, 'no error') || E')\n';
  select count(*) into n from public.character_inbox where id = w3 and status = 'waiting';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' and it still waits (' || n || E')\n';
  perform public.mark_applied(w1);
  select count(*) into n from public.character_inbox where id = w1 and status = 'applied' and delivered_at is not null;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the owner can mark it applied (' || n || E')\n';
  err := null;
  begin perform public.mark_applied(w1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_ALREADY' then 'PASS' else 'FAIL' end || ' mark_applied works once (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.mark_delivered(w1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_ALREADY' then 'PASS' else 'FAIL' end || ' an applied row cannot go to delivered (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.recall_send(w1); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TOO_LATE' then 'PASS' else 'FAIL' end || ' an applied row cannot be recalled (' || coalesce(err, 'no error') || E')\n';
  select status into v from public.character_inbox where id = w1;
  out := out || case when v = 'applied' then 'PASS' else 'FAIL' end || E' the sender sees it applied\n';
  w3 := public.send_write(ch_d, 'k1', '{"from": "Payroll", "subj": "Payday: The Toll"}', '[{"op": "glimmer", "amount": 1200}]');
  select count(*) into n from public.character_inbox where id = w1 and status = 'applied';
  out := out || case when w3 = w1 and n = 1 then 'PASS' else 'FAIL' end || E' a repeat after it landed changes nothing\n';

  -- taking a send back, decided here (take_back)
  v := public.take_back(ch_d, 'tb1', '{"from": " Payroll ", "subj": "Taken back: Payday"}');
  select count(*) into n from public.character_inbox i where i.send_key = 'tb1';
  perform set_config('role', 'postgres', true);
  select count(*) into n2 from public.inbox_taken_back t where t.sender_id = a and t.send_key = 'tb1';
  perform set_config('role', 'authenticated', true);
  out := out || case when v = 'cancelled' and n = 0 and n2 = 1 then 'PASS' else 'FAIL' end || ' a key with no row is taken back before it lands, marked for its sender alone, outside the inbox (' || coalesce(v, 'null') || ', ' || n || ', ' || n2 || E')\n';
  err := null;
  begin perform public.send_write(ch_d, 'tb1', '{"from": "Payroll", "subj": "Payday"}', '[{"op": "glimmer", "amount": 5}]'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TAKEN_BACK' then 'PASS' else 'FAIL' end || ' a send under it afterwards is refused (' || coalesce(err, 'no error') || E')\n';
  select count(*) into n from public.character_inbox where send_key = 'tb1';
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' and lands nothing (' || n || E')\n';
  v := public.take_back(ch_d, 'tb1', '{"from": "Payroll", "subj": "Taken back: Payday"}');
  select count(*) into n from public.character_inbox where send_key like 'tb1%';
  perform set_config('role', 'postgres', true);
  select count(*) into n2 from public.inbox_taken_back t where t.sender_id = a and t.send_key = 'tb1';
  perform set_config('role', 'authenticated', true);
  out := out || case when v = 'cancelled' and n = 0 and n2 = 1 then 'PASS' else 'FAIL' end || ' taken back again, the same answer and nothing new (' || coalesce(v, 'null') || ', ' || n || ', ' || n2 || E')\n';

  -- a key is the sender's own: another campaign's Admin, or anyone, marking "k1" marks only their own, and the Admin's row is untouched
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  err := null; v := null;
  begin v := public.take_back(ch_d, 'k1', '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  perform set_config('role', 'postgres', true);
  select count(*) into n from public.character_inbox where send_key in ('k1', 'k1:fix') and sender_id = a;
  select count(*) into n2 from public.character_inbox where sender_id = e;
  perform set_config('role', 'authenticated', true);
  out := out || case when v = 'cancelled' and n = 1 and n2 = 0 then 'PASS' else 'FAIL' end || ' someone outside the campaign taking back "k1" marks their own key and touches nothing of the Admin''s (' || coalesce(v, err) || ', ' || n || ', ' || n2 || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.character_inbox where id = w1 and status = 'applied';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' and the Admin''s row is as it was (' || n || E')\n';
  w3 := public.send_write(ch_d, 'k1', '{"from": "Payroll", "subj": "Payday: The Toll"}', '[{"op": "glimmer", "amount": 1200}]');
  out := out || case when w3 = w1 then 'PASS' else 'FAIL' end || E' and the Admin''s own send under "k1" still answers with its row\n';

  -- a key that ends ":fix" is take_back's own
  err := null;
  begin perform public.send_write(ch_d, 'kz:fix', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 1}]'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_KEY' then 'PASS' else 'FAIL' end || ' send_write refuses a key ending :fix (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.take_back(ch_d, 'kz:fix', '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_KEY' then 'PASS' else 'FAIL' end || ' and so does take_back (' || coalesce(err, 'no error') || E')\n';

  -- the sender the app expects: a session that changed under it is refused, and nothing is made
  err := null;
  begin perform public.send_write(ch_d, 'ks', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 1}]', p_sender => b); exception when others then err := sqlerrm; end;
  select count(*) into n from public.character_inbox where send_key = 'ks';
  out := out || case when err = 'EN_NOT_MINE' and n = 0 then 'PASS' else 'FAIL' end || ' a send for another sender is refused, and makes nothing (' || coalesce(err, 'no error') || ', ' || n || E')\n';
  err := null;
  begin perform public.take_back(ch_d, 'ks', '{"from": "Payroll", "subj": "x"}', p_sender => b); exception when others then err := sqlerrm; end;
  perform set_config('role', 'postgres', true);
  select count(*) into n2 from public.inbox_taken_back t where t.sender_id = a and t.send_key = 'ks';
  perform set_config('role', 'authenticated', true);
  out := out || case when err = 'EN_NOT_MINE' and n2 = 0 then 'PASS' else 'FAIL' end || ' and so is a take back, and marks nothing (' || coalesce(err, 'no error') || ', ' || n2 || E')\n';
  err := null;
  begin perform public.send_write(ch_d, 'ks', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 1}]', p_sender => a); exception when others then err := sqlerrm; end;
  select count(*) into n from public.character_inbox where send_key = 'ks' and sender_id = a;
  out := out || case when err is null and n = 1 then 'PASS' else 'FAIL' end || ' the right sender goes (' || coalesce(err, 'no error') || ', ' || n || E')\n';

  -- a row with ops that landed: the correction, the numbers the other way, once
  v := public.take_back(ch_d, 'k1', '{"from": "Payroll", "subj": "Taken back: Payday: The Toll", "body": "The GM took this back"}');
  select ops into j from public.character_inbox where send_key = 'k1:fix' and sender_id = a and status = 'due' and campaign_id = camp3 and character_id = ch_d;
  out := out || case when v = 'corrected' and j = '[{"op": "glimmer", "amount": -1200}, {"op": "nexus", "amount": -2.5}, {"op": "xp", "amount": -500}, {"op": "milestone", "kind": "minor", "amount": -1}]'::jsonb then 'PASS' else 'FAIL' end || ' a landed row gets its correction, the numbers the other way (' || coalesce(v, 'null') || ', ' || coalesce(j::text, 'null') || E')\n';
  select mail into j from public.character_inbox where send_key = 'k1:fix' and sender_id = a;
  out := out || case when j = '{"from": "Payroll", "subj": "Taken back: Payday: The Toll", "body": "The GM took this back"}'::jsonb then 'PASS' else 'FAIL' end || ' with the letter given (' || coalesce(j::text, 'null') || E')\n';
  v := public.take_back(ch_d, 'k1', '{"from": "Payroll", "subj": "Taken back: Payday: The Toll"}');
  select count(*) into n from public.character_inbox where send_key = 'k1:fix' and sender_id = a;
  out := out || case when v = 'corrected' and n = 1 then 'PASS' else 'FAIL' end || ' asked again, it is the same correction (' || coalesce(v, 'null') || ', ' || n || E')\n';
  select count(*) into n from public.character_inbox where id = w1 and status = 'applied';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' and the row it corrects is left as it was (' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  v := public.take_back(ch_d, 'k1', '{"from": "Payroll", "subj": "Taken back"}');
  select ops into j from public.character_inbox where send_key = 'k1:fix' and sender_id = b;
  out := out || case when v = 'corrected' and j = '[{"op": "xp", "amount": 30}]'::jsonb then 'PASS' else 'FAIL' end || ' a co-Admin takes back their own key, and a negative comes back positive (' || coalesce(j::text, 'null') || E')\n';
  -- a co-Admin demoted after sending: a repeat still answers, a correction can't go, an unused key can still be marked
  perform public.send_write(ch_d, 'kb2', '{"from": "Payroll", "subj": "Before the demotion"}', '[{"op": "xp", "amount": 3}]');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.set_role(camp3, b, 'player');
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.send_write(ch_d, 'kb2', '{"from": "Payroll", "subj": "Before the demotion"}', '[{"op": "xp", "amount": 3}]'); exception when others then err := sqlerrm; end;
  out := out || case when err is null then 'PASS' else 'FAIL' end || ' a demoted co-Admin''s repeat still answers with its row (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.take_back(ch_d, 'kb2', '{"from": "Payroll", "subj": "Taken back"}'); exception when others then err := sqlerrm; end;
  select count(*) into n from public.character_inbox where send_key = 'kb2:fix';
  out := out || case when err = 'EN_NOT_ALLOWED' and n = 0 then 'PASS' else 'FAIL' end || ' but no correction can go from them any more (' || coalesce(err, 'no error') || ', ' || n || E')\n';
  err := null; v := null;
  begin v := public.take_back(ch_d, 'kb3', '{"from": "Payroll", "subj": "Never sent"}'); exception when others then err := sqlerrm; end;
  out := out || case when v = 'cancelled' then 'PASS' else 'FAIL' end || ' and an unused key of theirs can still be marked (' || coalesce(v, err) || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.set_role(camp3, b, 'coadmin');
  perform public.send_write(ch_d, 'tb2', '{"from": "XP Award", "subj": "Award"}', '[{"op": "milestone", "kind": "major", "amount": 2}]');
  v := public.take_back(ch_d, 'tb2', '{"from": "XP Award", "subj": "Taken back: Award"}');
  select ops into j from public.character_inbox where send_key = 'tb2:fix';
  out := out || case when v = 'corrected' and j = '[{"op": "milestone", "kind": "major", "amount": -2}]'::jsonb then 'PASS' else 'FAIL' end || ' a row still due is corrected the same way, its counter kept (' || coalesce(j::text, 'null') || E')\n';

  -- a posting: recalled while it waits, a letter once it has arrived
  perform public.send_write(ch_d, 'tb3', '{"from": "JOB BOARD", "subj": "Job"}');
  v := public.take_back(ch_d, 'tb3', '{"from": "JOB BOARD", "subj": "Withdrawn: Job"}');
  select count(*) into n from public.character_inbox where send_key = 'tb3' and status = 'recalled';
  select count(*) into n2 from public.character_inbox where send_key = 'tb3:fix';
  out := out || case when v = 'recalled' and n = 1 and n2 = 0 then 'PASS' else 'FAIL' end || ' a posting still waiting is recalled, with no letter (' || coalesce(v, 'null') || ', ' || n || ', ' || n2 || E')\n';
  v := public.take_back(ch_d, 'tb3', '{"from": "JOB BOARD", "subj": "Withdrawn: Job"}');
  out := out || case when v = 'cancelled' then 'PASS' else 'FAIL' end || ' asked again, it is gone already (' || coalesce(v, 'null') || E')\n';
  err := null;
  begin perform public.send_write(ch_d, 'tb3', '{"from": "JOB BOARD", "subj": "Job"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TAKEN_BACK' then 'PASS' else 'FAIL' end || ' and a repeat of it is refused (' || coalesce(err, 'no error') || E')\n';
  perform public.send_write(ch_d, 'tb4', '{"from": "JOB BOARD", "subj": "Job two"}');
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  perform public.mark_delivered((select i.id from public.character_inbox i where i.send_key = 'tb4' and i.sender_id = a));
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  v := public.take_back(ch_d, 'tb4', '{"from": "JOB BOARD", "subj": "Withdrawn: Job two", "body": "The GM withdrew this."}');
  select count(*) into n from public.character_inbox where send_key = 'tb4:fix' and status = 'waiting' and ops is null and mail ->> 'subj' = 'Withdrawn: Job two';
  select count(*) into n2 from public.character_inbox where send_key = 'tb4' and status = 'delivered';
  out := out || case when v = 'corrected' and n = 1 and n2 = 1 then 'PASS' else 'FAIL' end || ' a posting that arrived stays, and gets a letter instead (' || coalesce(v, 'null') || ', ' || n || ', ' || n2 || E')\n';

  -- who can take back, and what
  err := null;
  begin perform public.take_back(ch_a, 'k1', '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a key used for another character is refused (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  err := null;
  v := null;
  begin v := public.take_back(ch_d, 'tb5', '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when v = 'cancelled' then 'PASS' else 'FAIL' end || ' a player marking a key marks their own, which delivers nothing (' || coalesce(v, err) || E')\n';
  perform set_config('role', 'postgres', true);
  select count(*) into n from public.character_inbox where send_key = 'tb5';
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' and leaves no row (' || n || E')\n';
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.take_back(ch_d, null, '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_KEY' then 'PASS' else 'FAIL' end || ' take_back needs a key (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.take_back(ch_d, repeat('k', 81), '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_KEY' then 'PASS' else 'FAIL' end || ' one no longer than send_write takes (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.take_back(ch_d, 'tb6', '{"subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_MAIL' then 'PASS' else 'FAIL' end || ' and a letter clean_mail takes (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.take_back(ch_d, 'tb6', '{"from": "Kade", "subj": "x", "package": [{"name": "Rope", "qty": 1}]}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_BAD_MAIL' then 'PASS' else 'FAIL' end || ' with no package on it (' || coalesce(err, 'no error') || E')\n';

  -- the character leaves: nothing new reaches them, a correction made already still answers, a waiting posting can still be recalled
  perform public.send_write(ch_d, 'tb7', '{"from": "Payroll", "subj": "Pay"}', '[{"op": "xp", "amount": 7}]');
  perform public.send_write(ch_d, 'tb8', '{"from": "JOB BOARD", "subj": "Job three"}');
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  update public.characters set campaign_id = null where id = ch_d;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null; v := null;
  begin v := public.take_back(ch_d, 'tb9', '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when v = 'cancelled' then 'PASS' else 'FAIL' end || ' a character that left: an unused key is marked all the same (' || coalesce(v, err) || E')\n';
  err := null;
  begin perform public.take_back(ch_d, 'tb7', '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' and so is a new correction (' || coalesce(err, 'no error') || E')\n';
  v := public.take_back(ch_d, 'k1', '{"from": "Payroll", "subj": "x"}');
  out := out || case when v = 'corrected' then 'PASS' else 'FAIL' end || ' a correction made already still answers (' || coalesce(v, 'null') || E')\n';
  v := public.take_back(ch_d, 'tb8', '{"from": "JOB BOARD", "subj": "x"}');
  select count(*) into n from public.character_inbox where send_key = 'tb8' and status = 'recalled';
  out := out || case when v = 'recalled' and n = 1 then 'PASS' else 'FAIL' end || ' and a posting still waiting can still be recalled (' || coalesce(v, 'null') || ', ' || n || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  update public.characters set campaign_id = camp3 where id = ch_d;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.send_write(ch_d, 'tb9', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 9}]'); exception when others then err := sqlerrm; end;
  select count(*) into n from public.character_inbox where send_key = 'tb9';
  out := out || case when err = 'EN_TAKEN_BACK' and n = 0 then 'PASS' else 'FAIL' end || ' so a copy of it sent after they rejoin lands nothing (' || coalesce(err, 'no error') || ', ' || n || E')\n';

  -- the campaign a send was made on, as the app names it (p_desk): deleted, it has ended; still there and not the sender's to run, it waits
  campx := public.create_campaign('Ended');
  perform public.delete_campaign(campx);
  err := null;
  begin perform public.send_write(ch_d, 'kd1', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 1}]', p_desk => campx); exception when others then err := sqlerrm; end;
  select count(*) into n from public.character_inbox where send_key = 'kd1';
  out := out || case when err = 'EN_ENDED' and n = 0 then 'PASS' else 'FAIL' end || ' a send made on a campaign since deleted is refused as ended, though the character is in one the sender runs (' || coalesce(err, 'no error') || ', ' || n || E')\n';
  v := null; err := null;
  begin v := public.take_back(ch_d, 'kd1', '{"from": "Payroll", "subj": "x"}', p_desk => campx); exception when others then err := sqlerrm; end;
  perform set_config('role', 'postgres', true);
  select count(*) into n2 from public.inbox_taken_back t where t.sender_id = a and t.send_key = 'kd1';
  perform set_config('role', 'authenticated', true);
  out := out || case when v = 'ended' and n2 = 1 then 'PASS' else 'FAIL' end || ' taking it back there answers ended, and marks its key (' || coalesce(v, err) || ', ' || n2 || E')\n';
  err := null;
  begin perform public.send_write(ch_d, 'kd1', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 1}]', p_desk => camp3); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TAKEN_BACK' then 'PASS' else 'FAIL' end || ' so no copy of it can send it from anywhere (' || coalesce(err, 'no error') || E')\n';
  perform public.send_write(ch_d, 'kd2', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 2}]');
  v := null; err := null;
  begin v := public.take_back(ch_d, 'kd2', '{"from": "Payroll", "subj": "x"}', p_desk => campx); exception when others then err := sqlerrm; end;
  select count(*) into n from public.character_inbox where send_key = 'kd2:fix';
  out := out || case when v = 'ended_landed' and n = 0 then 'PASS' else 'FAIL' end || ' an UNDO on an ended campaign''s desktop makes no correction, and says the send landed (' || coalesce(v, err) || ', ' || n || E')\n';
  err := null;
  begin perform public.take_back(ch_a, 'kd2', '{"from": "Payroll", "subj": "x"}', p_desk => campx); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' a key with a row still has to name its character, ended desktop or not (' || coalesce(err, 'no error') || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  campy := public.create_campaign('Theirs');
  select token into t5 from public.campaign_invites where campaign_id = campy;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.join_campaign(t5);
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  perform public.set_role(campy, a, 'coadmin');
  perform public.set_role(campy, a, 'player');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.send_write(ch_d, 'kd3', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 3}]', p_desk => campy); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_RUNNING' then 'PASS' else 'FAIL' end || ' a send from the desktop of a campaign that still is, but the sender no longer runs, is refused as such (' || coalesce(err, 'no error') || E')\n';
  v := null; err := null;
  begin v := public.take_back(ch_d, 'kd3', '{"from": "Payroll", "subj": "x"}', p_desk => campy); exception when others then err := sqlerrm; end;
  perform set_config('role', 'postgres', true);
  select count(*) into n2 from public.inbox_taken_back t where t.sender_id = a and t.send_key = 'kd3';
  perform set_config('role', 'authenticated', true);
  out := out || case when v = 'not_running' and n2 = 1 then 'PASS' else 'FAIL' end || ' taking it back there ends it like a delete: it answers not_running, and marks its key (' || coalesce(v, err) || ', ' || n2 || E')\n';
  err := null;
  begin perform public.send_write(ch_d, 'kd3', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 3}]', p_desk => camp3); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TAKEN_BACK' then 'PASS' else 'FAIL' end || ' so no copy can send it, from a campaign the sender runs either (' || coalesce(err, 'no error') || E')\n';
  perform public.send_write(ch_d, 'kd6', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 6}]');
  v := null; err := null;
  begin v := public.take_back(ch_d, 'kd6', '{"from": "Payroll", "subj": "x"}', p_desk => campy); exception when others then err := sqlerrm; end;
  select count(*) into n from public.character_inbox where send_key = 'kd6:fix';
  out := out || case when v = 'not_running_landed' and n = 0 then 'PASS' else 'FAIL' end || ' an UNDO on that desktop makes no correction, and says the send landed (' || coalesce(v, err) || ', ' || n || E')\n';
  -- a posting recalled before (its answer lost), asked again from a desktop no longer run, or ended: still taken back
  perform public.send_write(ch_d, 'kd7', '{"from": "JOB BOARD", "subj": "x"}');
  perform public.take_back(ch_d, 'kd7', '{"from": "JOB BOARD", "subj": "Withdrawn: x"}');
  v := null; err := null;
  begin v := public.take_back(ch_d, 'kd7', '{"from": "JOB BOARD", "subj": "Withdrawn: x"}', p_desk => campy); exception when others then err := sqlerrm; end;
  out := out || case when v = 'cancelled' then 'PASS' else 'FAIL' end || ' a posting recalled before, asked again on a desktop no longer run, is still taken back, not landed (' || coalesce(v, err) || E')\n';
  v := null; err := null;
  begin v := public.take_back(ch_d, 'kd7', '{"from": "JOB BOARD", "subj": "Withdrawn: x"}', p_desk => campx); exception when others then err := sqlerrm; end;
  out := out || case when v = 'cancelled' then 'PASS' else 'FAIL' end || ' and on an ended one (' || coalesce(v, err) || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  perform public.set_role(campy, a, 'coadmin');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.send_write(ch_d, 'kd3', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 3}]', p_desk => campy); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TAKEN_BACK' then 'PASS' else 'FAIL' end || ' and it stays ended once the sender runs that campaign again (' || coalesce(err, 'no error') || E')\n';
  w3 := null; err := null;
  begin w3 := public.send_write(ch_d, 'kd4', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 4}]', p_desk => camp3); exception when others then err := sqlerrm; end;
  out := out || case when w3 is not null then 'PASS' else 'FAIL' end || ' a send from a desktop the sender runs goes (' || coalesce(err, 'no error') || E')\n';

  -- a correction is filed where the money went, so it goes with that campaign, even after the character moves
  campz := public.create_campaign('Next Door');
  select token into t5 from public.campaign_invites where campaign_id = campz;
  perform public.send_write(ch_d, 'kd5', '{"from": "Payroll", "subj": "x"}', '[{"op": "glimmer", "amount": 50}]');
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  perform public.join_campaign(t5);
  update public.characters set campaign_id = campz where id = ch_d;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  v := public.take_back(ch_d, 'kd5', '{"from": "Payroll", "subj": "Taken back"}');
  select count(*) into n from public.character_inbox where send_key = 'kd5:fix' and campaign_id = camp3;
  out := out || case when v = 'corrected' and n = 1 then 'PASS' else 'FAIL' end || ' a correction is filed in the campaign the money went through, not where the character is now (' || coalesce(v, 'null') || ', ' || n || E')\n';
  v := null; err := null;
  begin v := public.take_back(ch_d, 'kd5', '{"from": "Payroll", "subj": "Taken back"}', p_desk => campx); exception when others then err := sqlerrm; end;
  out := out || case when v = 'corrected' then 'PASS' else 'FAIL' end || ' asked again from an ended desktop, a correction that went still answers corrected (' || coalesce(v, err) || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  update public.characters set campaign_id = camp3 where id = ch_d;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  -- a mark names no character: one with none, or none known, still marks the sender's own key
  v := public.take_back(null, 'kn1', '{"from": "Payroll", "subj": "x"}');
  perform set_config('role', 'postgres', true);
  select count(*) into n2 from public.inbox_taken_back t where t.sender_id = a and t.send_key = 'kn1';
  perform set_config('role', 'authenticated', true);
  out := out || case when v = 'cancelled' and n2 = 1 then 'PASS' else 'FAIL' end || ' take_back with no character marks the key (' || coalesce(v, 'null') || ', ' || n2 || E')\n';
  v := public.take_back(gen_random_uuid(), 'kn2', '{"from": "Payroll", "subj": "x"}');
  out := out || case when v = 'cancelled' then 'PASS' else 'FAIL' end || ' and so does one with a character nobody has (' || coalesce(v, 'null') || E')\n';
  err := null;
  begin perform public.take_back(null, 'k1', '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_NOT_ALLOWED' then 'PASS' else 'FAIL' end || ' but a key that has a row has to name its character (' || coalesce(err, 'no error') || E')\n';

  -- marks have a limit per sender
  perform set_config('role', 'postgres', true);
  insert into public.inbox_taken_back (sender_id, send_key) select c, 'cap' || g from generate_series(1, 9999) g;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  v := null; err := null;
  begin v := public.take_back(null, 'cap-last', '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when v = 'cancelled' then 'PASS' else 'FAIL' end || ' the 10,000th mark is made (' || coalesce(v, err) || E')\n';
  err := null;
  begin perform public.take_back(null, 'cap-over', '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TOO_MANY' then 'PASS' else 'FAIL' end || ' and the next is refused (' || coalesce(err, 'no error') || E')\n';
  v := null; err := null;
  begin v := public.take_back(null, 'cap-last', '{"from": "Payroll", "subj": "x"}'); exception when others then err := sqlerrm; end;
  out := out || case when v = 'cancelled' then 'PASS' else 'FAIL' end || ' while one made already still answers (' || coalesce(v, err) || E')\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  -- nobody writes the new columns directly, and the database holds the rules
  err := null;
  begin update public.character_inbox set ops = '[]' where id = w1; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a sender cannot rewrite the ops (' || coalesce(err, 'no error') || E')\n';
  perform set_config('role', 'postgres', true);
  err := null;
  begin update public.character_inbox set status = 'delivered' where id = w1; exception when others then err := sqlstate; end;
  out := out || case when err = '23514' then 'PASS' else 'FAIL' end || ' a row with ops cannot hold a plain mail status (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin update public.character_inbox set status = 'due' where send_key = 'k3'; exception when others then err := sqlstate; end;
  out := out || case when err = '23514' then 'PASS' else 'FAIL' end || ' plain mail cannot hold due (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin update public.character_inbox set status = 'applied' where send_key = 'k3'; exception when others then err := sqlstate; end;
  out := out || case when err = '23514' then 'PASS' else 'FAIL' end || ' plain mail cannot hold applied (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin update public.character_inbox set status = 'lost', ops = '[]' where id = w1; exception when others then err := sqlstate; end;
  out := out || case when err = '23514' then 'PASS' else 'FAIL' end || ' a row with ops cannot hold a status that is no status at all (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin insert into public.character_inbox (character_id, campaign_id, sender_id, mail, ops, status, send_key) values (ch_d, camp3, a, '{}', '[]', 'due', 'k1'); exception when others then err := sqlstate; end;
  out := out || case when err = '23505' then 'PASS' else 'FAIL' end || ' the database itself allows one row per sender and key (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin insert into public.character_inbox (character_id, campaign_id, sender_id, mail) values (ch_d, camp3, a, '{}'), (ch_d, camp3, a, '{}'); exception when others then err := sqlstate; end;
  out := out || case when err is null then 'PASS' else 'FAIL' end || ' rows with no key are not held to it (' || coalesce(err, 'no error') || E')\n';
  perform set_config('role', 'authenticated', true);

  -- the rows go with their character and their campaign
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  select count(*) into n from public.character_inbox where character_id = ch_d;
  out := out || case when n > 0 then 'PASS' else 'FAIL' end || ' before deleting, the owner has rows to lose (' || n || E')\n';
  delete from public.characters where id = ch_d;
  perform set_config('role', 'postgres', true);
  select count(*) into n from public.character_inbox where character_id = ch_d;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' deleting a character takes its rows (' || n || E')\n';
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.delete_campaign(camp3);
  perform set_config('role', 'postgres', true);
  select count(*) into n from public.character_inbox where campaign_id = camp3;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' deleting a campaign takes its rows (' || n || E')\n';
  perform set_config('role', 'postgres', true);
  select count(*) into n2 from public.inbox_taken_back t where t.sender_id = a and t.send_key = 'tb1';
  perform set_config('role', 'authenticated', true);
  out := out || case when n2 = 1 then 'PASS' else 'FAIL' end || ' but a key taken back stays marked (' || n2 || E')\n';
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.send_write(gen_random_uuid(), 'tb1', '{"from": "Payroll", "subj": "x"}', '[{"op": "xp", "amount": 1}]'); exception when others then err := sqlerrm; end;
  out := out || case when err = 'EN_TAKEN_BACK' then 'PASS' else 'FAIL' end || ' and a send under it is refused, whatever character or campaign it names (' || coalesce(err, 'no error') || E')\n';
  perform set_config('role', 'postgres', true);

  -- the marks are the functions' alone
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin select count(*) into n from public.inbox_taken_back; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a client cannot read the marks (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin insert into public.inbox_taken_back (sender_id, send_key) values (a, 'mine'); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' or write one (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin update public.inbox_taken_back set send_key = 'other' where sender_id = a; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' or change one (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin delete from public.inbox_taken_back where sender_id = a; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' or delete one (' || coalesce(err, 'no error') || E')\n';
  perform set_config('role', 'postgres', true);

  -- clean_mail stays private
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.clean_mail('{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a client cannot call clean_mail (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.clean_ops('[{"op": "xp", "amount": 5}]'); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' a client cannot call clean_ops (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.mark_taken_back(b, 'not theirs'); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' or mark_taken_back, to mark a key for someone else (' || coalesce(err, 'no error') || E')\n';

  -- a session with no user, for every function a client can call
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'authenticated', true);
  v := '';
  foreach f in array array[
    'create_campaign(''x'')', 'invite_preview(''x'')', 'join_campaign(''x'')',
    'reset_invite(%1$L)', 'leave_campaign(%1$L)', 'campaign_roster(%1$L)', 'campaign_blocked(%1$L)',
    'remove_member(%1$L, %1$L)', 'unblock_member(%1$L, %1$L)', 'set_role(%1$L, %1$L, ''player'')',
    'transfer_leadership(%1$L, %1$L)', 'rename_campaign(%1$L, ''x'')', 'delete_campaign(%1$L)',
    'send_to_character(%1$L, ''{}'')', 'send_to_crew(%1$L, ''{}'')', 'recall_send(%1$L)', 'mark_delivered(%1$L)', 'mark_taken(%1$L)',
    'send_write(%1$L, ''k'', ''{}'')', 'take_back(%1$L, ''k'', ''{}'')', 'mark_applied(%1$L)'
  ] loop
    err := null;
    begin execute 'select * from public.' || format(f, a); exception when others then err := sqlerrm; end;
    if err is distinct from 'EN_SIGNED_OUT' then v := v || f || '=' || coalesce(err, 'no error') || ' '; end if;
  end loop;
  out := out || case when v = '' then 'PASS' else 'FAIL' end || ' every function refuses a session with no user (' || v || E')\n';

  -- anon
  perform set_config('role', 'postgres', true);
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
  err := null;
  begin perform public.send_to_crew(camp4, '{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' anon cannot send (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.send_write(camp4, 'k', '{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' anon cannot send a row with ops (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.mark_applied(camp4); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' anon cannot mark one applied (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin perform public.take_back(camp4, 'k', '{"from": "Kade", "subj": "Hi"}'); exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' anon cannot take a send back (' || coalesce(err, 'no error') || E')\n';
  err := null;
  begin select count(*) into n from public.character_inbox; exception when others then err := sqlstate; end;
  out := out || case when err = '42501' then 'PASS' else 'FAIL' end || ' anon cannot read the inbox (' || coalesce(err, 'no error') || E')\n';
  perform set_config('role', 'postgres', true);

  -- the error text is cut off after about 1 KB, so the result is the count and any failures in full
  select count(*) filter (where l like 'PASS%'), count(*) filter (where l like 'FAIL%'),
         coalesce(string_agg(l, E'\n') filter (where l like 'FAIL%'), '')
    into npass, nfail, fails from unnest(string_to_array(out, E'\n')) l;
  raise exception E'EN_CHECKS (rolled back)\n% PASS, % FAIL\n%', npass, nfail, fails;
end
$$;
