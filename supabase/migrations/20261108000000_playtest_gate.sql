-- The playtest gate (8 Nov 2026): the Freelancer's Companion is granted, not open to every
-- signed-in account. The discord-role Edge Function writes the grant (source 'discord_role') for
-- an account whose Discord member has the Play tester role in the Elysium Nights server, and
-- removes it when the role is gone. Grants from any other source are added by hand as before.
-- At launch, set the rule back to 'signed_in'.
update public.products set rule = 'granted' where sku = 'EN1101';
