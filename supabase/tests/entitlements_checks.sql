-- Entitlement checks. Run against the live project with:
--   npx supabase@2 db query --linked --project-ref ggjgkcnhfpjwyrhakqun -f supabase/tests/entitlements_checks.sql
-- Everything runs inside one DO block that ALWAYS ends by raising EN_CHECKS with the results,
-- so the whole block rolls back: the test users, the temporary 'granted' product, its pack and
-- its entitlement never ship. Read the result from the error text: it should say 0 FAIL.
do $$
declare
  a uuid := '00000000-0000-4000-8000-0000000000a1';
  b uuid := '00000000-0000-4000-8000-0000000000b2';
  n int;
  out text := '';
  denied boolean;
  npass int; nfail int; fails text;
  open1 int;   -- 1 while EN1101 is open to every signed-in account, 0 while it is granted (the playtest)
begin
  select case when rule = 'signed_in' then 1 else 0 end into open1 from public.products where sku = 'EN1101';
  out := 'EN1101 rule: ' || case when open1 = 1 then 'signed_in' else 'granted (playtest)' end || E'\n';
  -- fixtures, as the database owner
  insert into auth.users (id, instance_id, aud, role, email)
  values (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'en-check-a@example.invalid'),
         (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'en-check-b@example.invalid');
  insert into public.content_packs (sku, version, format, payload)
  values ('EN1101', 0, 1, '{"check": true}') on conflict (sku) do nothing;
  insert into public.products (sku, name, rule) values ('ENCHECK', 'Check Product', 'granted');
  insert into public.content_packs (sku, version, format, payload) values ('ENCHECK', 1, 1, '{"check": true}');
  insert into public.entitlements (user_id, sku, source) values (b, 'ENCHECK', 'comp');

  -- anon
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
  select count(*) into n from public.products where sku = 'EN1101';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' anon reads the EN1101 product (' || n || E')\n';
  select count(*) into n from public.content_packs;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' anon reads no packs (' || n || E')\n';
  select count(*) into n from public.entitlements;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' anon reads no entitlements (' || n || E')\n';
  select count(*) into n from public.my_entitlements();
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' anon holds no SKUs (' || n || E')\n';
  perform set_config('role', 'postgres', true);

  -- player A, signed in, no grants
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.content_packs where sku = 'EN1101';
  out := out || case when n = open1 then 'PASS' else 'FAIL' end || ' a signed-in player without a grant reads the EN1101 pack only when it is open (' || n || E')\n';
  select count(*) into n from public.content_packs where sku = 'ENCHECK';
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' without a grant, the granted pack is hidden (' || n || E')\n';
  select count(*) into n from public.entitlements;
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a player sees no other player''s entitlements (' || n || E')\n';
  select count(*) into n from public.my_entitlements() s where s = 'EN1101';
  out := out || case when n = open1 then 'PASS' else 'FAIL' end || ' my_entitlements lists EN1101 only when it is open (' || n || E')\n';

  denied := false;
  begin insert into public.entitlements (user_id, sku, source) values (a, 'ENCHECK', 'self');
  exception when others then denied := true; end;
  out := out || case when denied then 'PASS' else 'FAIL' end || E' a player cannot grant themselves an entitlement\n';
  denied := false;
  begin insert into public.content_packs (sku, version, format, payload) values ('ENCHECK', 9, 1, '{}');
  exception when others then denied := true; end;
  out := out || case when denied then 'PASS' else 'FAIL' end || E' a player cannot insert a pack\n';
  denied := false;
  begin update public.content_packs set version = 99 where sku = 'EN1101';
    get diagnostics n = row_count; if n = 0 then denied := true; end if;
  exception when others then denied := true; end;
  out := out || case when denied then 'PASS' else 'FAIL' end || E' a player cannot change a pack\n';
  denied := false;
  begin delete from public.content_packs where sku = 'EN1101';
    get diagnostics n = row_count; if n = 0 then denied := true; end if;
  exception when others then denied := true; end;
  out := out || case when denied then 'PASS' else 'FAIL' end || E' a player cannot delete a pack\n';
  perform set_config('role', 'postgres', true);

  -- grant A the temporary product, as the dashboard would
  insert into public.entitlements (user_id, sku, source) values (a, 'ENCHECK', 'comp');
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.content_packs where sku = 'ENCHECK';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' with a grant, the same player reads the granted pack (' || n || E')\n';
  select count(*) into n from public.my_entitlements() s where s = 'ENCHECK';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' my_entitlements lists the grant (' || n || E')\n';
  select count(*) into n from public.entitlements;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the player reads only their own entitlement row (' || n || E')\n';
  perform set_config('role', 'postgres', true);

  -- player B: holds a grant of their own, but A's grant must not leak to them, and vice versa
  delete from public.entitlements where user_id = b;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.content_packs where sku = 'ENCHECK';
  out := out || case when n = 0 then 'PASS' else 'FAIL' end || ' a second player still cannot read the granted pack (' || n || E')\n';
  select count(*) into n from public.content_packs where sku = 'EN1101';
  out := out || case when n = open1 then 'PASS' else 'FAIL' end || ' the second player reads the EN1101 pack only when it is open (' || n || E')\n';
  perform set_config('role', 'postgres', true);

  -- the playtest gate: the discord-role Edge Function writes and removes grants as the service role
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  perform set_config('role', 'service_role', true);
  denied := false;
  begin insert into public.entitlements (user_id, sku, source) values (b, 'EN1101', 'discord_role') on conflict (user_id, sku) do nothing;
  exception when others then denied := true; end;
  out := out || case when not denied then 'PASS' else 'FAIL' end || E' the service role can write a discord_role grant\n';
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.content_packs where sku = 'EN1101';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' with the Play tester grant, the player reads the EN1101 pack (' || n || E')\n';
  select count(*) into n from public.my_entitlements() s where s = 'EN1101';
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' my_entitlements lists EN1101 with the grant (' || n || E')\n';
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  perform set_config('role', 'service_role', true);
  delete from public.entitlements where user_id = b and sku = 'EN1101' and source = 'discord_role';
  get diagnostics n = row_count;
  out := out || case when n = 1 then 'PASS' else 'FAIL' end || ' the service role can remove a discord_role grant (' || n || E')\n';
  perform set_config('role', 'postgres', true);

  -- the error text is cut off after about 1 KB, so the result is the count and any failures in full
  select count(*) filter (where l like 'PASS%'), count(*) filter (where l like 'FAIL%'),
         coalesce(string_agg(l, E'\n') filter (where l like 'FAIL%'), '')
    into npass, nfail, fails from unnest(string_to_array(out, E'\n')) l;
  raise exception E'EN_CHECKS (rolled back) %\n% PASS, % FAIL\n%', split_part(out, E'\n', 1), npass, nfail, fails;
end
$$;
