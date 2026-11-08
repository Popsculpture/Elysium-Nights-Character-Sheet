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

Built 8 Nov 2026 on `campaigns-batch-2`, cut from `main` at `21004f4` (batch 1 was already merged). **Merged to
`main` with batch 3, on your word, 8 Nov 2026, at `66696b1`.** The migration is applied to the live project, on your
go, and its checks pass there. Discord and the Supabase settings were not touched.

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

---

# Campaigns build report: batch 3, #POST from the Admin

Built 8 Nov 2026 on `campaigns-batch-3`. **Merged to `main` on your word, 8 Nov 2026, at `66696b1`.** The migration is applied to the live
project, on your go, and its checks pass there.

Batch 2 went live in the same merge. The spec says to cut from `main` once batch 2 is on it, and it wasn't, so this branch was cut from the tip of
`campaigns-batch-2` (`e852599`).

Every decision is also logged under "Campaigns" in `DEFERRED-FIXES.md`.

## What is built

**0. Gizmo is off limits.** `gate.js` and `tour.js` have no diff against batch 2.

**1. Database.** `supabase/migrations/20261108180000_campaign_inbox.sql`: the `character_inbox` table, its read policy, `send_to_character`,
`send_to_crew`, `recall_send`, `mark_delivered`, `mark_taken`, and the table in the Realtime publication. A private `clean_mail` is the one
place the mail's shape is checked: from, subj, body and package are the only keys there are. `campaign_checks.sql` goes from 102 checks to 168.

**2. Sending.** On the Campaign tab: SEND on each character's row, SEND TO THE CREW, From as a People card or any typed name, Subject,
Message, and Attach items with a catalog search and a quantity. A message can go alone, and so can a package. Under the roster, **#POST
sends** lists your sends as Waiting, Delivered, Taken or Recalled, with Recall while waiting. It moves by itself as a player's app moves a row.

**3. Receiving.** While jacked in, `cloud.js` listens with Realtime, and reads waiting rows on start and after each sync. Each row becomes an unread
#POST message on the record, through the same `cleanOps` and `applyOp` the `post` op uses, with the row id in `meta.inboxApplied`. The new toast
has the envelope, "New on #POST from Kade" or "Package from Kade", and a bubble with the unread count, for about 6 seconds, and a press opens
#POST, switching character if needed. Several at once, or mail from while you were away, is one toast: "3 new on #POST." A row keeps a package glyph
until it is taken. The opened message shows a box and Take it, which adds each item through `addToStash()`, plays a short box-opening moment, and
settles to "Taken, in your Stash." A name the catalog doesn't know is refused with a toast and struck out in the box, and the rest still go in. A
read-only record can't take it. The `face.js` comment now says the record is where mail lives and the inbox is the courier.

Also: the asset stamp is `?v=20261108.6`. README and HANDOFF describe the inbox.

## Applied to the live project

Applied 8 Nov 2026. What the project answered:

| What | Result |
| --- | --- |
| The history beforehand | The four earlier migrations recorded, and only this one pending |
| `campaign_checks.sql`, on the live project | **168 PASS, 0 FAIL** |
| Left behind by the rollback | Nothing: no inbox rows, test users, campaigns or characters |
| The table | Row security on. Signed-in accounts can read and not write. Signed-out callers can do neither |
| The Realtime publication | `character_inbox` is in `supabase_realtime`. No dashboard change was needed: the migration did it |
| The real REST API, asked signed out | All 11 as expected: the table and each function are seen and refused (`42501`), `clean_mail` stays private, and a wrong argument name is not found (`PGRST202`) |
| The real Realtime service, asked signed out by the vendored client | It took the app's exact binding for the table: joined, "Subscribed to PostgreSQL" |
| The history afterwards | All five migrations recorded |

That last Realtime line only proves the handshake. No signed-in account has heard a real row yet.

The commands, from a worktree, which has no `supabase link` of its own, so each one names the project:

```bash
npx supabase@2 migration list --project-ref ggjgkcnhfpjwyrhakqun
```

```bash
npx supabase@2 db query --linked --project-ref ggjgkcnhfpjwyrhakqun -f supabase/migrations/20261108180000_campaign_inbox.sql
```

```bash
npx supabase@2 db query --linked --project-ref ggjgkcnhfpjwyrhakqun -f supabase/tests/campaign_checks.sql
```

```bash
npx supabase@2 migration repair --status applied 20261108180000 --project-ref ggjgkcnhfpjwyrhakqun
```

The repair is there because `db query` applies a file and records nothing.

**Until the branch is merged,** the live site's code has no Send button and does not listen. A signed-in account could still call the functions directly, and reach only what the rules allow. **If it were merged with the migration missing,** the mail would just wait and the Campaign tab would say your sends can't be read. The suite plays that.

## Commits

- `ed65a3c` the inbox migration and its checks
- `8b69f36` Send from the Campaign tab, the courier, the toast, the package
- `e0b3213` Send sits after View sheet; a status change mid-read isn't lost
- `7e95ffa` small fixes from reading it back
- `55a72a7` what an independent review of the courier found
- `9f83ae7` mail only goes on a copy with nothing else to send
- this report and the log

## Things the spec did not mention

The spec's flow is right, but a letter changes something the sync never had to think about. Until now, a device nobody was using never pushed, because
it never changed. Now a letter can arrive on it, and these are worth your eye. Each of them lost real work in some build along the way:

1. **A device left open could overwrite your real work.** It holds an old copy, and filing a letter on it makes it the newest copy there is. So a row is
   filed only straight after a pull that worked.
2. **"Delivered" could be a lie.** Marking the row and then closing the tab inside the two-second push delay left the message on that device alone, with a row saying
   delivered, so nobody would ever file it again. The record now goes up before the row is marked.
3. **A second device could overwrite the message,** because the first mark takes the row off everyone's waiting list. A device now files any row Realtime tells it about, whatever its status.
4. **A push racing another device could overwrite that device's save, and the clocks can't catch it.** While a record differs from the account by mail alone, the link
   book says so. Its push only lands on the row as this device last saw it, and if the row moved, it takes the row's copy. The moment you edit, it is an ordinary record again.
5. **A hidden tab doesn't file at all.** It would race the device you are using, and a toast in a hidden tab is wasted. It waits, and you get the toast when you come back. So
   a phone with the app in the background shows Waiting on your list until the player looks at it. **This one you may want to rule on.**
6. **A recalled row is on nobody's waiting list,** so a message filed before a failed mark would have stayed forever. The link book keeps the rows it has no answer for.
7. **An Admin can read what they sent,** the same trap as batch 2's pull. Every read of the inbox says whose mail it wants.

## How it was reviewed

The first full build passed every check. Then:

- **An independent review of the diff** found nine issues: items 1, 2 and 6 above, among others. Seven are fixed. The other two are written down rather than changed: Decision 9 and the two tabs under "Still open".
- **The fix for those** passed its own tests, and **the real-database round caught it**: my guard refused correctly, and then the next pull's clock comparison let the ordinary push overwrite
  the other device's save anyway. A new test then caught the fix for that spinning in a tight loop.
- **A second review of those fixes** found they could throw away real offline work, and that a network blip or a reload could get past the guard. That is why item 4 is one rule
  kept in the link book, instead of the patch it replaced.

**I have not had that final rule reviewed a third time.** Its routes are each under test. This is the part of the batch to be most suspicious of.

## Checked, and how

| Done when | Result | How |
| --- | --- | --- |
| Gizmo: `EN.gate.gizmoSvg()` fingerprint before and after | Pass | SHA-256 of all three forms, `clipSvg`'s source and the bubble's CSS lines, in Node, before any edit and after the last: identical. `git diff` on both files is empty. |
| Gizmo: tour step 1, his bubble, eyes on the card, his blink | Pass | Headless Chrome, all three skins. He shows with his typed bubble and a `-3px` rest. Stepping his running animations through a whole 10 s cycle in 20 ms steps: pupils only at -3 and -1, eyes squashing at the blink. Not watched by eye, because the browser pane couldn't reach this branch. |
| `campaign_checks.sql`: every line PASS | **Pass on the live project** | 168 PASS, 0 FAIL, nothing left behind. Locally too, where `entitlements_checks.sql` is 21 PASS before and after. |
| The checks have teeth | Pass | 157 deliberately broken copies of the migrations, 88 of them new: all 157 caught. One survived at first (a quantity stored as `1.0`), so a check was added. |
| Send from an NPC card with a package, to one character and the crew. Online toast within seconds, offline summary on next load | Pass locally, **waiting for you with real Discord**. The real Realtime has only taken the subscription | `pg/inbox_realdb.js`: the real app, the real supabase-js and the real realtime-js on the real SQL, 61 checks, three runs in a row. 15 ms or so from send to delivered on the bridge's clock, which says nothing about the real service. |
| Take it adds the items once, with the record on two devices | Pass locally, **waiting for you** | Both chains. The second device is the account's own calls made while the page sits there, including its save landing in the gap between this device's pull and push. Not two real browsers. |
| Recall works while waiting and fails after delivery. The Admin sees Taken | Pass locally, **waiting for you** | The real round, with the database's own rows checked after each step. |
| Checked in all three skins | Pass | Screenshots of the composer, the list, the inbox, the box and the toast on Classic, '98 and #GRIDroid. A true 375 px through an iframe, on all three: nothing overflows. |
| Reduced motion | Pass | Chrome with `--force-prefers-reduced-motion`: the box animations are `none`, and the toast has no transition and no offset. Without the flag all of them are set. |

The stand-in chain `campaigns_b3` is 226 checks. Batch 2's `campaigns_b2` stays at 163 and `pg/campaigns_realdb.js` at 144, with their pinned lists of panels updated for the new one.
The full suite on the final code: **488 chains, 512 runs, 0 bad (round 211)**. Syntax and dash sweeps are clean.

**What this still can't reach:** the app talking to the real server as a signed-in account, a real row arriving over real Realtime, Discord, and two sessions at once (the checks run in one transaction, and PGlite has one connection, so
the row locks never contend). **The slide and the box-opening moment have not been watched.** Headless Chrome doesn't paint frames in virtual time, so I checked that the animations are set, not how they look.

## Waiting for the author

- **The round with real Discord,** on real Realtime, which this migration has now turned on: send from a card to one character and the crew, with a second account online and then offline, Take it on two real devices, Recall before and after. It runs on the live site now. So far two real accounts have signed in, made a campaign, joined it and moved characters in. No mail has been sent yet.
- **Watch the slide and the box-opening moment,** and tune by feel. `postBoxHop`, `postBoxFlap` and `postBoxRise` in `theme.css`.
- **The package glyph is my drawing,** `ICON_PKG` in `face.js`, because the app has no art for a package. Swap in your own if you like; the moment wants its two flaps as separate paths.
- **A ruling on a hidden tab,** item 5 above.

## Decisions

1. **Cut from batch 2, not `main`,** above.
2. **The limits:** From up to 80 characters, subject 140, message 4000, 20 items, names 120.
3. **"Refuses anything but a #POST message" is a closed list of keys,** at the top level and in each item.
4. **The Admin's own character gets the crew's mail.** The spec says every character.
5. **A co-Admin's list is their own sends,** and so is the Admin's. An Admin can't see or recall a co-Admin's send, because the spec gives reads to the sender and the owner.
6. **Recalled sends stay on the list.** The spec names three statuses, but hiding the fourth would make a send seem to vanish.
7. **The list moves by itself on Realtime's updates,** though the spec only asks to listen for new rows. "The Admin sees Taken" reads badly if it needs a Refresh.
8. **Take it asks the inbox first,** then does as the spec says. If the row says taken and a pull brings that copy: "Already taken on another device." If no copy comes, this one wins the sync, so it takes them. If the row says recalled, the package goes.
9. **A package with some names refused closes,** and the refused rows can't be taken later. **One with every name refused stays open,** and the Admin doesn't see Taken.
10. **Held Toolkit gear isn't in the search,** like every other listing, and cyberware isn't in the catalog that `findItem` reads.
11. **Deleting a message with an untaken package asks first.** The items would go with it.
12. **A message half written survives** a look at a sheet, a tab switch, and a second press of Send.
13. **Examples count as read-only for Take it.** They are never stored.
14. **`mark_taken` refuses a row still waiting,** and the report waits in a device queue, `en_inbox_taken_v1`, so a package can be taken offline.
15. **One piece of mail from while away reads like any single message.** The summary is for two or more.
16. **SEND sits after VIEW SHEET,** so the row's first button stays put.

## Still open

- **A stale device with newer offline edits can overwrite a delivered message,** the way it overwrites any edit. The row says delivered, so nobody files it again. A read of delivered rows that a record doesn't hold could heal it, at the cost of a growing read after every sync. **The package goes with it,** so it wants a ruling if it ever happens to someone.
- **Two devices both on screen:** an edit inside the push delay can lose to the other device's filing.
- **Opening a message is an edit,** so on a stale device it makes that copy the newest. The items still land once.
- **A row that always fails to pull stops mail for the account.** That is the safe way round, but `pull()` stops at its first bad row. Older than this batch.
- **Two tabs in one browser** can overwrite each other's records in storage. Older than this batch, but a background event can now set it off.
- **A removed player's waiting mail still reaches them,** and the sender can still recall it. The spec doesn't mention membership.
- **'98's #POST Express shows a strip reading "es Help" across the top of the list.** It is on `main` too, so it isn't this batch's. Not touched.

# Campaigns build report: the Admin's Table reads the campaign

Built 8 Nov 2026 on `campaigns-table`, cut from `main` at `66696b1`, after you looked at the live Table. No SQL and no migration. **Merged to `main` on your word, 8 Nov 2026.**

What you saw: Pull in the crew listed every record in the browser, your own bank of characters, not the campaign's. Two characters with one name
looked the same, and nothing said whose they were. Your own characters should only show up once you've added them to the campaign.

## What is built

- **While an account runs a campaign, the Admin desktop's crew is that campaign's characters.** Pull in the crew lists them and nobody else. A bank on
  the browser stays out, and so do the Admin's own characters until they go in from Manage characters, like anyone's.
- **Every row and every button names the player:** `Nessa Vale · MyGalFRIDAY`.
- **Another player's character is a read-only copy.** It is read the way View sheet reads it, it is stripped of markup the same way, and it never enters
  the roster, so nothing can write to it or push it. Its row offers VIEW SHEET where a local row offers SET ACTIVE. The Admin's own character is the live
  record on this device, so Set active and Vigor still work on it.
- **One campaign at a time on the desktop,** the one picked on the Campaign tab. With more than one to run, the Table has the same picker.
- **A row is never quietly deleted.** A row can say NOT IN THIS CAMPAIGN (a character pulled before this change, or from the bank), NO LONGER IN THIS CAMPAIGN (it
  moved out), OTHER CAMPAIGN (after switching the picker) or NO SHEET ON THIS DEVICE (signed out). Each one comes off with ✕. **Your live Table will show NOT IN THIS
  CAMPAIGN on the rows it has now.** That's expected, and they aren't being counted.
- **Jacked out, offline, or running no campaign:** the Table lists the browser's records, as it always did.

## What the other tabs do

Encounters, People, Scenes and Hazards read the campaign's crew. Their reads are just Grades, Calibers and Heat to show.

**Payroll, Heat, the Job Board and the XP award write to sheets,** and a sheet can only be written on the device that holds it until those writes go through the inbox.
So while a campaign runs they count the whole crew and write only to what's here:

- Headcount and Caliber are the whole crew's, so a share and a Grade come out right.
- They list only the campaign's characters that are on this device, which for most Admins is none, or their own.
- A line says how many they can't reach. **You read the shares out, or send them as #POST mail, until the inbox carries them.**
- **A bank character can't be paid, posted to or awarded XP while a campaign runs.** This is a change from what I told you before I built it: I said these tabs would go on
  listing the browser's records. The review showed why that was wrong, below. If you want to run a table from a bank, jack out.

## How it was reviewed

One independent read of the diff, with the code and not my conclusions. It found real trouble, all fixed:

1. **The Job Board fell back to every record on the browser, all ticked,** when the Table's crew was out of reach.
2. **Payroll counted only who it could reach.** Three players plus the Admin's own character read as one Freelancer, and CREDIT THE CREW wrote the whole pot to that one sheet.
   The same low Caliber fed the Job Board's Grade and Heat's bounties. A bank row left on the Table could take the pot too.
3. **A hand-made sheet could stall the read for good.** A player who writes their own row with names that aren't text made the read throw, and the Table sat on "Reading" until a reload,
   and then again. Names are text now, a row that won't read costs that row, and a failed read always ends.
4. **Signed out with a campaign's rows on the Table,** the Table claimed a crew of Caliber 1.
5. **Your own character pulled before its sheet reached this device** stayed a copy. It takes its live id at the next draw now.
6. **A change during a read** could be counted as fresh for 30 seconds.

There has been no second review of these fixes. The tests below cover each one.

## Checked, and how

- **The whole suite:** 489 chains, 513 runs, 0 bad, on the final commit (round 215). The new chain is one of them.
- **The story through the real UI, twice from one script:** 145 checks against the stand-in (`tests/campaigns_table_1.js`, now a regular chain), and 150 against the real migration in PGlite
  through the real supabase-js (`pg/table_realdb.js`), where the read policy really answers. A player asking for the campaign's characters gets only their own, and an outsider gets none.
- **Batches 2 and 3 on the real database again, on the final commit:** 144 and 61, all passing.
- **Breaking the new code on purpose:** 36 lines of the new code broken one at a time, and the chain caught all 36. The first honest pass caught 32, and those four misses closed two gaps in the tests, tightened one check and removed some dead code (`pg/table_mutants.py`).
- **Three skins, desktop and 375 px:** drawn and measured with `tests/campaigns_table_shot.js`. No sideways scroll, and the player's name fits on every row.
- `gate.js` and `tour.js` have no diff against `main`. No em or en dashes in anything added.

**Not checked:** the live site, real Discord and real latency. Your round is the first time a real read happens through the real policy with real accounts.

## Decisions

1. **The Table's rows stay in the one GM document.** A Table per campaign is the bigger change we talked about. Switching the picker marks the other campaign's rows; it doesn't swap the Table.
2. **The lists read when drawn,** at most every 30 seconds, plus ↻ and any change to who is in a campaign. There's no live feed of who joined.
3. **A sheet that can't be read** is left off the picker, with a console warning. The Campaign tab's roster still lists it.

## Still open

- **The writing tabs through the inbox.** Payroll, the XP award, Heat and the Job Board can't reach another player's sheet. It's the planned next step, and the reason for the line those tabs show.
- **A Table per campaign.** The GM document is one per browser, so Encounters, Payroll history and so on are shared across campaigns too.
- **The next account on the same browser** sees the last account's Table rows, as it always has. A campaign's row carries a character name, a Discord name and a campaign id, no sheet, and is marked. The Table is one per browser, not per account.
- **VIEW SHEET from the Table** comes back to the Campaign tab, not the Table.
