# Campaigns build report: batch 1, one login and Gizmo

Built 8 Nov 2026 on `campaigns-batch-1`, cut from `main` at `d550e22`. Not merged: `main` is the live
site and waits for the author's sign-off. No database work in this batch.

The reasoning behind every call is in the plan doc, "Elysium Nights: Campaigns and Characters Plan".
Every decision taken where the spec left room is also logged under "Campaigns" in `DEFERRED-FIXES.md`.

## What is built

**0. Gizmo is untouched.** `gate.js` keeps its name and its line in `index.html`. `clipSvg()` and the
`gizmoSvg` export are byte for byte. Nothing in `tour.js` was edited or removed: the blink is new
rules only. (Its existing reduced-motion line gained a trailing comma because a line now follows it in
the array; its content is unchanged.) The Admin egg's bubble markup and CSS (`.gate-clip`,
`.gate-bubble`, `.gate-clipsvg`, `gate-clipwob`) are reused as they were, and no Gizmo art was drawn.

**1. The login card.** After the boot animation, one card: JACK IN WITH DISCORD (`EN.cloud.jackIn()`)
and a quieter RUN OFFLINE. Where `EN.cloud.available()` is false (a `file://` page), it offers Run
offline only, with "Discord sign-in needs the hosted app, elysiumnightsrpg.com/app." The card shows
until the device has a Discord session or has picked Run offline (`en_login_v1`). The old
`en_gate_ok_v1` and `en_gate_admin_ok_v1` are ignored and left in place. A jacked-in device skips the
card; jacking out brings it back on the next load. `?dev` and `?nogate` skip it, `?login` forces it.
The `// maintenance` bypass, `CONFIG.password` and `CONFIG.adminPassword` are gone.

**2. Desktops.** Anyone who comes through the card, by either button, lands on the Freelancer desktop
(the author's ruling after review, below). A load that skips the card answers with no profile, so
`land()` falls back to the remembered desktop. `switchUser` and `signOut` left the
gate's exports, so `// WORKSPACE` shows the plain FREELANCER and ADMIN buttons, and the footer SWITCH
USER is gone. The Admin desktop opens for everyone with no code. Jack out stays in `// CLOUD LINK`.

**3. Gizmo greets everyone once.** The first press of either button on a device
(`en_gizmo_hello_v1`) brings Gizmo beside the card (under it on narrow screens and #GRIDroid): "It
looks like you're trying to hack the mainframe! Want some help with that?" with Yes please / I've got
it. Either answer: "Say no more." and a short patch on the card. Then "You're in. I was never here.
I'm just a paperclip." and the button goes through. A click anywhere (or Escape) skips straight to
it. The Codebreaker hijack and the Guardian lockdown are retired.

**4. Gizmo blinks.** One keyframe set in `gate.js` for both places, with the resting gaze in
`--gz-rest`: 0 on the login card, `-3px` in the tour. Every 10 s he blinks (120 ms), looks straight at
you for 1.5 s, blinks again and goes back. The four eye circles squash to `scaleY(.08)` around their
own centers, and the pupils swap gaze while his eyes are shut. On the big tour Gizmo and the login
Gizmo, not on the 18 px icon. Off under `prefers-reduced-motion`, and so is the login Gizmo's sway.

Also: the asset stamp is `?v=20261108.2`. '98's full-width card buttons no longer run into the card's
right edge. The theme.css rules for retired classes are gone. README and HANDOFF describe the new
login.

## Commits

- `f58ecc0` one login card, Gizmo greets the device once, Gizmo blinks
- `5ceae93` README, HANDOFF and DEFERRED-FIXES for the new login
- `c8374b2` the build report
- `a2173e2` the two review changes below
- this update to the report

## Changed after the author's review, 8 Nov 2026

1. **Through the card is always Freelancer.** Run offline answers `"freelancer"`. Jack in writes
   Freelancer through `EN.app.setPortal` before it leaves for Discord, because the redirect back
   skips the card and reads the remembered desktop. Only a load that skips the card keeps the last
   desktop. That includes a Jack in from Settings, which never comes through the card.
2. **The login Gizmo's sway stops under reduced motion.** The rule sits in the card's own styles, right
   after the sway it overrides. In the blink's stylesheet, which loads first, it would have lost to the
   sway at equal specificity.

## Checked, and how

| Done when | Result | How |
| --- | --- | --- |
| `EN.gate.gizmoSvg()` fingerprints identical | Pass | SHA-256 of `gizmoSvg()`, `gizmoSvg("tour-gizmosvg")` and `gizmoSvg("gate-clipsvg")`, loaded from `gate.js` in Node before and after: all three identical. The bubble's 11 CSS lines diffed identical against `main`. The new test pins the literal string. |
| Tour step 1: Gizmo, bubble, eyes on the card, the blink | Pass | Browser pane: step 1 shows him beside the card with his typed bubble. Sampling his pupils every 20 ms for one full cycle: at rest `-3px` (on the card), 1.5 s at `-1px`, the change only while scaleY is below 1, never an in-between position. The 18 px icon on step 2 has no animation. Same in all three skins. |
| Fresh device: card, Gizmo greets, Run offline lands on Freelancer; reload: no card, no greeting | Pass | Browser pane (Classic, wide) and the suite's new `campaigns_login` chain (`file://`, no `?dev`). |
| Through the card from a device that last used Admin: Freelancer, by either button | Pass | The chain: Run offline for real on `?login`, and Jack in with `EN.cloud.jackIn` stubbed, which also confirms Freelancer is stored before the page would leave. |
| A load that skips the card keeps the last desktop | Pass | The chain: the offline pick and a `?code=` return each boot on Admin with no card. |
| Reduced motion: sway and blink off | Pass | Chrome with `--force-prefers-reduced-motion`: the login Gizmo's sway and blink do not run, and the tour Gizmo stands still with his eyes on the card at -3px. Without the flag both run. The chain also checks the sway rule sits after the rule it overrides. |
| `?login` shows the card, `?dev` skips it | Pass | Browser pane and the chain's step 3. `?dev` is also every other suite run. |
| `// WORKSPACE` switches desktops with no code | Pass | Browser pane: clicked ADMIN in the tray, landed on the Table, no card; the chain's step 2 clicks both. |
| Checked in all three skins | Pass | Browser pane: the card and the greeting in Classic (wide), '98 (wide) and #GRIDroid (375 px), and the tour blink in all three. |

Also checked: a stored Discord session skips the card and spends the offline pick; no session brings
the card back; a `?code=` return from Discord skips it; with sign-in available the card leads with
Jack in, the press reaches `EN.cloud.jackIn("discord")` (stubbed, so the pane never left for Discord),
and a sign-in that never leaves the page brings the card back after 4 s with COULD NOT REACH DISCORD.
The console stayed clean. The dash, control-character and syntax sweeps are clean.

The suite's `campaigns_login` chain is now five steps and 65 checks, all passing on the final code
(round 197). The `gizmoSvg()` fingerprints are still identical. The full suite (round 196: 483 chains,
501 runs, 0 bad) ran on the first build, before the two review changes and before the chain existed,
and was not re-run. Those changes only touch paths that go through the card, and the other tests skip
it with `?dev`.

The two review changes were not re-checked in the browser pane or over http. The chain drives them in
headless Chrome on `file://`.

## Waiting for the author

- **The real Jack in round trip** on the live site, after a merge: the card, Gizmo, Discord, and back
  to the app with no card. Localhost is not on the sign-in redirect list, so I stubbed the call instead.
- **The blink against the reference loops** (`gizmo-blink.gif`, `gizmo-blink-tour.gif`). They are not
  in this session, so the timing was built from the spec's numbers (with a 120 ms blink, not the
  loops' 160 ms). Tune by feel.
- **Gizmo's lines**, which the spec calls a draft. They are `LINES` and `PATCH` near the middle of
  `gate.js`.

## Decisions

1. **Superseded by the author's ruling above.** The first build had Run offline open the remembered
   desktop.
2. **`?portal=admin` still lands on Admin** for one load that skips the card, because the suite's
   default query is `?dev&portal=admin`. Through the card it does nothing: `?login&portal=admin` lands
   on Freelancer, following "anyone" literally.
3. **`?dev` keeps its old habits**: Freelancer on #PRINT unless `?portal=admin`, and it records the
   offline pick the way it used to record the unlock.
4. **Jacked in is read from the stored session at boot**, not from the asynchronous `getSession()`,
   plus the `?code=` return from Discord, so the boot never waits on the network.
5. **Finding a session clears the offline pick**, which is how jacking out brings the card back
   without cloud.js knowing about the gate.
6. **The greeting is recorded as Gizmo arrives**, so a reload mid-greeting does not repeat him.
7. **He stands in a wrapper beside the card**, not inside it, because '98 and #GRIDroid clip the card.
8. **The keyframes load with gate.js itself**, not with the card's styles, so the tour has them on a
   device that never sees the card.
9. **The cog note fires after Run offline only**, and says Running offline.
10. **Under reduced motion the pupils keep the keyframe's name** at a 0 s duration, because the
    pupil rule outranks the `animation:none` rule. Measured inert: nothing moves, and the gaze stays
    where the scene puts it.

---

# Campaigns build report: batch 2, campaigns

Built 8 Nov 2026 on `campaigns-batch-2`, cut from `main` at `21004f4` (batch 1 was already merged). Not
merged. **The migration is applied to the live project**, on your go, and its checks pass there. Discord and
the Supabase settings were not touched. The live site does not offer campaigns until this branch is merged.

Every decision is also logged under "Campaigns" in `DEFERRED-FIXES.md`.

## Applied to the live project

Applied 8 Nov 2026. What the project answered:

| What | Result |
| --- | --- |
| `campaign_checks.sql`, on Postgres 17.11 | **102 PASS, 0 FAIL** |
| Left behind by the rollback | Nothing: no test users, campaigns or characters. The one real account, the gate and its one grant are as they were |
| The real PostgREST, asked as anon | All 11 as expected: each new function it was asked for is seen and refused (`42501`), a wrong argument name is not found, `discord_name` stays private, and the new column is in its schema cache |
| What changed | The four tables, `characters.campaign_id`, the functions and policies, and the trigger, which now fires only when the sheet changes |

The commands, from a worktree, which has no `supabase link` of its own, so each one names the project:

```bash
npx supabase@2 migration list --project-ref ggjgkcnhfpjwyrhakqun
```

```bash
npx supabase@2 db query --linked --project-ref ggjgkcnhfpjwyrhakqun -f supabase/migrations/20261108120000_campaigns.sql
```

```bash
npx supabase@2 db query --linked --project-ref ggjgkcnhfpjwyrhakqun -f supabase/tests/campaign_checks.sql
```

**The migration history is caught up, on your second go.** `migration list` showed the first two migrations
recorded but not the playtest gate (`20261108000000`), though its rule is in effect, so it went in outside the
history. `db push` would have run the gate again along with campaigns, so I took the route this report gave for
that case, `db query`, which applies the one file and records nothing. Then this recorded both without running
either:

```bash
npx supabase@2 migration repair --status applied 20261108000000 20261108120000 --project-ref ggjgkcnhfpjwyrhakqun
```

All four migrations now show under Remote, and a `db push --dry-run` says the project is up to date. The gate,
its grant and the data read the same afterwards.

**Until the branch is merged,** the live site's code has no campaign buttons. A signed-in account could still call
the functions directly, and reach only what the rules allow.

**No setting is needed to ship this.** An invite link is the app's address plus `?join=`, and the sign-in still
goes back to the bare address already on the redirect list. **One is needed to run the branch against real
Discord before merging:** see the two-account round under "Waiting for the author".

## What is built

**0. Gizmo is off limits.** `gate.js` gained code and changed three lines: a comment, the `coach()` call
now skipped on a join link, and the export line. `clipSvg()` and `gizmoSvg` are byte for byte. `tour.js`
has no changes. His two new appearances reuse `.gate-clip`, `.gate-bubble` and `.gate-clipsvg` as they
are. No new art.

**1. Database.** `supabase/migrations/20261108120000_campaigns.sql`: the four tables, `characters.campaign_id`,
the three helpers, the policies and all the functions in the spec, plus `campaign_blocked` (below). Clients
only read the tables, and write privileges are revoked outright. `supabase/tests/campaign_checks.sql`
covers every line in the spec and more, 102 checks. Each refusal is checked for its own error code,
so a typo or a missing grant cannot pass as a refusal.

**2. The join card.** `?join=<token>` is stashed by `js/campaigns.js`, now the first script on the page.
Login card first if it is due, with Gizmo's greeting, then the join card. Run offline explains and offers
Jack in. Join opens Manage characters with "You're in <campaign>. Pick a character below." The dead-link
and blocked messages read as the spec has them.

**3. Manage characters.** A Campaign dropdown per record, saved the moment it is picked, reverting with
a toast on failure. A local-only record uploads itself. A locked record's dropdown is greyed with the
lock reason. Examples get none. Not jacked in: "Jack in to join campaigns." The meta line and the
switcher show the campaign. **Your campaigns** has roles, Leave (or "Transfer leadership first") and
**+ New campaign**.

**4. The Campaign tab.** `js/gm_campaign.js`, first on the Admin rail: picker, Invite link, Roster, Blocked,
Campaign settings, with the spec's confirms and who-can-do-what.

**5. Gizmo says no.** Every way onto the Admin desktop goes through `usePortal` in `app.js`, so that is the
one place that says no. His two lines and **Take me back** are in `gate.js` as `NO`. The polite-fence
comment is at `usePortal`.

**6. View sheet.** `store.setViewing`: in memory, flagged `meta.viewing`, never in the roster, never saved,
never pushed. The Freelancer desktop in the read-only mode, with the banner, last-save time, **Refresh** and
**Back to campaign**.

Also: the Admin rail is twelve tabs now, so it takes 12 px sides below 1430 px and 8 px below 1330 px. The
asset stamp is `?v=20261108.5`. README and HANDOFF describe campaigns.

## Commits

- `e5048f3` the migration and its checks
- `2388dbf` the join card, Manage characters, the Campaign tab, Gizmo's no, View sheet
- `24a64aa` sub-tabs on a viewed sheet, twelve tabs on the Admin rail, the docs
- `4740bd2` the non-member check uses a real non-member
- `ff1f3a7` this report
- `5ca076f` the stronger checks
- `f4197d2` the two app fixes the local Postgres run led to
- `bdeb860` this report brought up to date
- `88c0a5a` the run on the live project, written up
- the commit after it: the migration history caught up, written up

## Three traps the spec did not mention

These would have shipped as real bugs, so they are worth your eye:

1. **The Admin's roster would have filled with other people's characters.** The new read policy means an
   Admin's select on `characters` answers with their members' rows, and `pull()` took everything it was
   given. It would have copied them into the Admin's roster and pushed them back as the Admin's own. Pull
   now asks for `owner_id` by name.
2. **A campaign move looked like a save.** The `updated_at` trigger fired on any update, so an Admin's
   Remove could make a player's device overwrite unsaved edits with the older copy in the account. The
   trigger now fires only when the sheet changes. This also keeps "last saved" true.
3. **A player's sheet could have run code in the Admin's browser.** Some views build HTML from record
   fields, which was harmless while only the owner read them. An Admin's session is in their browser, so
   a viewed sheet loses every `<` and `>` before anything draws it.

And one in the spec's own words: the read-only mode blocks every click, so an Admin could not have reached
the Notes sub-tab at all. On a viewed sheet only, sub-tabs and collapsing headers still work.

## Run on a local Postgres

After the first report you agreed to test the SQL locally with PGlite, which is real PostgreSQL compiled to
WebAssembly. It runs in memory on this machine and cannot reach the live project. The tools are in the test
suite's `pg/` folder, with a README, ready for batch 3.

It stands in for what a Supabase project has before any migration: the roles, the `auth` schema, `auth.uid()`
and the default privileges. `postgres` is not a superuser there, as on a real project, because a superuser
skips every privilege check and every policy.

| What ran | Result |
| --- | --- |
| All four migrations, in order, on an empty database | Applied clean |
| `campaign_checks.sql` | 102 PASS, 0 FAIL, and nothing left behind after the rollback |
| `entitlements_checks.sql`, before and after the campaigns migration | 21 PASS, 0 FAIL both times |
| 69 deliberately broken copies of the migration, one rule broken in each | The checks caught all 69 |
| The real app and the real `supabase-js` on the real SQL, three accounts, through the UI | 144 checks pass, 330 requests, every function the app uses called |

**What it found:**

1. **The checks had holes.** The first version, 84 checks, passed on the first run, so I broke the migration
   on purpose to see whether that meant anything, and 5 of the first 45 broken copies got through. The worst:
   "a player cannot read the blocks" ran before any block existed, so it passed with row security turned off.
   It now runs with a block in place. New checks cover what nothing was guarding, among them removing one
   player clearing everyone's characters, a second Admin at the database itself, and every function refusing
   a session with no user. That is why there are 102.
2. **A co-Admin could get stuck.** Demoted or removed with the Campaign tab open, their next click left them on
   "You can't do that in this campaign. TRY AGAIN", with a button that could never work and a page still
   saying CO-ADMIN, because nothing asked for the role again. A refused read on the tab now does. A demoted
   co-Admin gets Gizmo, and a removed one gets the empty page. The stand-in chain never had that scene. I only
   wrote it after the real server's log showed refusals I had not planned.
3. **Copy could say nothing at all.** One run of the stand-in chain ended with no answer from the button, then
   the next three passed. The likely cause: if the old copy route fails, `navigator.clipboard` can wait on a
   permission with nothing on screen. After 1.5 s the button now says "Could not copy it. The link is in the
   box." A real click takes the old route, which did not change. That route was checked in the browser pane
   before this change, and not since.

**What passed that the stand-in could not prove:** every function name, argument and column the app uses exists
and matches. The first trap above is real on the real policy: an Admin's plain select does answer with the
members' rows, and the pull brings down none of them. A save goes through the new policy while the character
is in a campaign. `level` and `class` are where a real sheet keeps them. A character moved between campaigns
keeps `data` and `updated_at` exactly, and a sync afterwards changes nothing on either side.

**What this could not prove.** The run on the live project has since answered two of the four: the migration and
checks ran on its Postgres 17.11 (PGlite is 18.6), and the policy names it drops were there. Two remain:

- **The app has not talked to the real server as a signed-in account.** The app's calls went through my strict
  imitation of PostgREST, with sign-in a stand-in. The real PostgREST has only been asked as anon, and only for
  refusals.
- **Two sessions at once.** PGlite has one connection and the live checks run in one transaction, so the row locks
  that keep role changes from interleaving have never contended.

## Checked, and how

| Done when | Result | How |
| --- | --- | --- |
| `EN.gate.gizmoSvg()` fingerprint before and after | Pass | SHA-256 of all three forms, plus `clipSvg`'s source text and the bubble's CSS lines, in Node before any edit and after the last: identical. `git diff main` on `tour.js` is empty. |
| Tour step 1: Gizmo, his bubble, eyes on the card, his blink | Pass | Browser pane, Classic, '98 and #GRIDroid: he shows with his typed bubble and a `-3px` rest, and the blink animations run. Sampled every 20 ms for a whole cycle in Classic: pupils only at -3 and -1, never between. |
| `campaign_checks.sql`: every line PASS | **Pass on the live project** | 102 PASS, 0 FAIL, on Postgres 17.11, and the rollback left nothing behind. |
| Join, drop two characters in, roster, read-only sheets, Gizmo's no, co-Admin gets in, remove with block, old link fails, reset, transfer | Pass on a local Postgres, **not yet with real Discord** | `pg/campaigns_realdb.js`, 144 checks through the real UI on the real SQL, with the database's own rows checked after each step. The suite's `campaigns_b2` chain, 163 checks, plays the same round on a stand-in, as part of every regular run. The same rules pass on the live project in `campaign_checks.sql`, at the database, in one rolled-back transaction. |
| A character moved between campaigns keeps everything | Pass on a local Postgres, **and at the database on the live project**, not yet by hand | `pg/campaigns_realdb.js`: `data` and `updated_at` identical in the database after a move, after No campaign, and after a sync. `campaign_checks.sql` checks the trigger directly, on the live project too. |
| Reload onto a remembered Admin desktop, and `?portal=admin` | Pass | `campaigns_fence`, three reloads on one profile. Also: an account running a campaign, one in none, and one jacked out all get in. |
| Fresh device on a join link | Pass | `campaigns_joinlink`: stash first, login card, Gizmo, then the join card. Jack in keeps the token, and the sign-in brings the card up. A campaign name holding HTML shows as text. |
| Nothing from a viewed sheet saves | Pass | The chain: writes refused, the rows byte for byte the same after a push window, the stored roster identical after Back. A record full of `<img onerror>` ran nothing. |
| Checked in all three skins | Pass | Screenshots of the card, Gizmo's no, Manage characters, the tab and a viewed sheet in Classic and '98, plus the same states in #GRIDroid at a true 375 px in the browser pane, where nothing overflowed. |

Also checked: Copy on a real click in the pane said "Invite link copied." The pane would not let me read
the clipboard back, so the text itself was not compared.

The full suite on the final app code: 487 chains, 511 runs, 0 bad (round 208). An earlier round is what caught
the twelfth tab: at 1264 to 1366 px it pushed Codex behind the gear on Classic, so the rail now tightens in two
steps. Three older tests pinned eleven tabs, and one pinned 16 px padding at 1366, so they were updated to
say twelve. On the same final code, `campaigns_b2` passed five runs in a row on its own, with the Copy button
answering each time. `pg/campaigns_realdb.js` passed 144 of 144, and the checks caught all 69 broken copies.

The dash and syntax sweeps are clean.

## Waiting for the author

- **The two-account round with real Discord**: create, copy the link, fresh device with the second account, join,
  two characters in, both on the roster, each sheet read-only, Gizmo's no, make co-Admin and they get in, remove
  with Also block and their link fails, reset, transfer. All of it has passed locally, and the database half has
  passed on the live project. **It needs a way for the branch to reach sign-in**, because localhost is not on the
  redirect list and the live site is `main`. Two ways, both yours to choose:
  - **Before merging (my pick):** add `http://localhost:8777/**` to Supabase's Auth redirect URLs, run the branch
    locally on the `gridos` server (port 8777 unless it is taken), use a private window for the second account,
    then take the entry out. Discord itself needs no change. The live site stays as it is until the round passes.
  - **After merging,** on the live site, the way batch 1's Jack in round trip was done. No setting, but players
    could reach campaigns before you have seen them work.
- **A character moved between campaigns**, by hand, during that round.
- **Gizmo's two lines** read as the spec has them; they are `NO` in `gate.js` if you want to change them.

## Decisions

1. **"Gets their old row back"** reads as the same key, a fresh `player` row. The spec's table has no column
   for an ended membership, and handing back the old row would hand a removed co-Admin their role.
2. **`campaign_blocked(campaign)` is added.** The Blocked section needs names, and a blocked account is not
   in the roster. Same gate as the table.
3. **The insert policy gains the campaign check** as well as the update policy.
4. **`invite_preview` needs a session,** as the spec has every function check `auth.uid()`, so the Run
   offline card cannot name the campaign.
5. **A blocked account sees the card and is told at Join,** since the preview is "nothing else".
6. **Not now clears the stash,** or the card returns on every load. The link still works. A network failure
   keeps it, with Try again.
7. **`?join=` comes off the address** once stashed.
8. **Crew on several campaigns:** Gizmo names the one joined first.
9. **The fence writes Freelancer as the remembered desktop,** so a reload gets him once. The ADMIN button and
   `?portal=admin` get him every time.
10. **Roles are cached per account in `en_campaigns_v1`,** so the fence answers at boot. An attempt re-reads, so
    someone just made co-Admin gets in without reloading.
11. **The Admin desktop still lands on Table.** Campaign is first on the rail, not the default.
12. **Sub-tabs and collapsing headers stay live on a viewed sheet** (above).
13. **A pack the Admin does not hold** draws like a locked record, and the banner says so.
14. **Copy tries `execCommand` first,** since `navigator.clipboard` can wait on a permission with nothing on screen.
15. **The Admin rail's old 16 px pin at 1366 is overruled.** Twelve tabs do not fit at 16 px until about 1430 px.
16. **A refused read on the Campaign tab asks for the role again.** It is the only way that page finds out a role
    changed while it was open. It does not loop: the read only repaints if something changed.
17. **The real-database chain lives in `pg/`, not `tests/`.** The regular runner takes everything in `tests/`, and
    this one needs the bridge up, so it runs by hand. The stuck co-Admin is also guarded in `campaigns_b2`, so a
    regular run still catches it.
18. **Applied with `db query`, not `db push`.** The history did not show the playtest gate, so a push would have run
    it again. The gate's rule was read first and is in effect, so it did not need running, and `db query` left it alone.

## Still open

- **Deleting an Admin's account leaves a campaign with no Admin.** Nothing in the app deletes accounts today.
  It wants a ruling when something does.
- **A player's device learns of a removal on its next read** (jack-in, the tab coming back after 30 s, or a
  refused read on the Campaign tab). A pick in that window is refused by the database and reverts.
- **The tour is not told about a viewed sheet.** `tour.js` is off limits. It only runs when started by hand,
  and anything it wrote would be refused.
