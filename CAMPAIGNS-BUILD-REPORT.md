# Campaigns build report: batch 1, one login and Gizmo

Built 8 Nov 2026 on `campaigns-batch-1`, cut from `main` at `d550e22`. **Merged to `main` on your word.** No database work in this batch.

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

- **The real Jack in round trip:** done. Two real accounts signed in through Discord on the live site during the real round, at the end of this report.
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

- **The two-account round with real Discord:** done on the live site. See the real round, at the end of this report.
- **A character moved between campaigns:** done in the same round.
- **Gizmo's two lines** read as the spec has them, and you saw them live and asked for no change. They are `NO` in `gate.js`.

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
| Send from an NPC card with a package, to one character and the crew. Online toast within seconds, offline summary on next load | **Pass on the live project,** real Discord and real Realtime: 0.74 to 1.18 s online, and the summary on the way back | `pg/inbox_realdb.js`: the real app, the real supabase-js and the real realtime-js on the real SQL, 61 checks, three runs in a row. 15 ms or so from send to delivered on the bridge's clock, which says nothing about the real service. |
| Take it adds the items once, with the record on two devices | **Pass on the live project,** with two real devices | The second device was told it was already taken, and its edit reached the account. Both chains as well. |
| Recall works while waiting and fails after delivery. The Admin sees Taken | **Pass on the live project** | The real round, with the database's own rows checked after each step. No Recall button shows on a delivered or taken row. |
| Checked in all three skins | Pass | Screenshots of the composer, the list, the inbox, the box and the toast on Classic, '98 and #GRIDroid. A true 375 px through an iframe, on all three: nothing overflows. |
| Reduced motion | Pass | Chrome with `--force-prefers-reduced-motion`: the box animations are `none`, and the toast has no transition and no offset. Without the flag all of them are set. |

The stand-in chain `campaigns_b3` is 226 checks. Batch 2's `campaigns_b2` stays at 163 and `pg/campaigns_realdb.js` at 144, with their pinned lists of panels updated for the new one.
The full suite on the final code: **488 chains, 512 runs, 0 bad (round 211)**. Syntax and dash sweeps are clean.

The real round has since covered the app on the real server, real Realtime and Discord. **What it didn't reach:** two sessions racing inside the database (the checks run in one transaction, and PGlite has one connection, so
the row locks never contend). **I haven't watched the slide and the box-opening moment.** Headless Chrome doesn't paint frames in virtual time, so I checked that the animations are set, not how they look.

## Waiting for the author

- **The round with real Discord:** done. See the real round, at the end of this report.
- **The slide and the box-opening moment, if you want to tune them by feel.** You've seen them live and asked for no change. `postBoxHop`, `postBoxFlap` and `postBoxRise` in `theme.css`.
- **The package glyph is my drawing,** `ICON_PKG` in `face.js`, because the app has no art for a package. Swap in your own if you like; the moment wants its two flaps as separate paths.
- **A hidden tab:** you saw it wait 64.6 seconds and deliver on your return, and asked for no change, so item 5 above stands.

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

- **A stale device with newer offline edits can still overwrite a sheet,** the way it overwrites any edit. A delivered message lost that way now comes back (see the two-tab part of this report). Other edits, and a package already taken, do not.
- **Two devices both on screen:** an edit inside the push delay can lose to the other device's filing.
- **Opening a message is an edit,** so on a stale device it makes that copy the newest. The items still land once.
- **A row that always fails to pull stops mail for the account.** That is the safe way round, but `pull()` stops at its first bad row. Older than this batch.
- **Two tabs in one browser** used to overwrite each other's records. Fixed: see the two-tab part of this report.
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

**Since checked on the live site:** with real accounts, Popsculpture's Table offered only BOLLARD-7 and Nessa Vale, both under MyGalFRIDAY, with no bank. With two campaigns, the picker offered each campaign's own character.

## Decisions

1. **The Table's rows stay in the one GM document.** A Table per campaign is the bigger change we talked about. Switching the picker marks the other campaign's rows; it doesn't swap the Table. (Built since: see "one Admin desktop per campaign", below.)
2. **The lists read when drawn,** at most every 30 seconds, plus ↻ and any change to who is in a campaign. There's no live feed of who joined.
3. **A sheet that can't be read** is left off the picker, with a console warning. The Campaign tab's roster still lists it.

## Still open

- **Heat through the inbox.** Payroll, the XP award and the Job Board now reach another player's sheet: see the writing tabs' part of this report. Heat still can't, and still shows the line.
- **A Table per campaign.** Built since: see "one Admin desktop per campaign", below.
- **The next account on the same browser** sees the last account's Table rows, as it always has. A campaign's row carries a character name, a Discord name and a campaign id, no sheet, and is marked. The Table is one per browser, not per account.
- **VIEW SHEET from the Table** comes back to the Campaign tab, not the Table.

# Campaigns build report: two tabs work together

Built 8 Nov 2026 on `campaigns-tabs`, cut from `main` at `0fcae4a`. No SQL and no migration. **Merged to `main` on your word, 8 Nov 2026.**

## Why

The real Discord round found it. You had MyGalFRIDAY open in two tabs, one on Nessa and one on BOLLARD-7, and a delivered package disappeared from BOLLARD-7's sheet with nobody touching it. The row still said delivered,
so nobody would ever have filed it again. I reproduced it with two live copies of the app, against the real rules: one small edit in the tab with the old copy wiped the message.

Each tab held the whole roster in memory and wrote all of it on every save, so the last tab to write undid the other's saves. The sync's link book was shared between tabs and the records weren't, so a tab couldn't tell its old copy
from an edit, and pushed it over the newer row. You chose tabs that work together over one tab at a time.

## What is built

- **Saves merge, record by record.** Before every write, and whenever another tab announces one, a tab compares what it last saw, what it holds, and what's stored. It takes what changed elsewhere and keeps what changed here. If both changed
  one character it merges field by field, and the newer save wins only where both changed the same field.
- **A save reaches the other tab at once,** with no reload. A character this tab isn't on doesn't repaint the page.
- **Each tab keeps its own character,** across a reload. A new tab opens on the last character used anywhere.
- **Sync runs take turns across tabs,** under a browser lock, so two tabs can't turn one new row into two characters or one new record into two rows. A browser without the lock, or a tab that has waited 20 seconds, runs anyway, as every tab did before.
- **A stale copy is never sent,** and a pull brings it up to date. A pull also re-checks a record after its fetch, so it can't overwrite an edit or bring back a delete made while it waited.
- **Storage isn't atomic across tabs,** so a slow tab can write over a save it hadn't heard about. A delete is now written down first, so a missing character goes back in instead of being taken for deleted, and a copy older than the one last
  stored is old news, not a change. Before this, either could lose a character or an edit.
- **Lost mail comes back.** A run with a pull files delivered rows a sheet doesn't list, up to 20 a run, from the newest 100. A message the player deleted stays deleted, unless the copy saved over the sheet predates the delete. A recalled row or a taken package never comes back.
- **The browser can't fill a field.** Every input the app draws has `autocomplete="off"`. I confirmed Chrome otherwise puts one character's words into another's Identity step when you return to a page through history.
- **Closing a tab saves the edit still in the debounce.** It used to lose up to the last third of a second of typing, in one tab or two.

## What you'll notice

- Two tabs on two characters just work, side by side.
- **Your lost message didn't get the chance to come back.** The sheet that was BOLLARD-7 was replaced before this went live, and its `dd` row went with it. So lost mail coming back is proven on the real rules locally, and has not happened on the live site.
- **A toast shows in the tab that filed the mail,** which may not be the tab on that character. The other tab still gets the message and the unread count.

## Still unexplained: BOLLARD-7's identity

That sheet is still a Fury with its own gear, but its name and entire identity block are now Nessa's, word for word. **I don't know how.** Nothing in the app copies an identity between records, and two tabs alone don't do it: names stayed correct in every two-tab test. The copied fields are exactly the
inputs on the #PRINT Identity step, and I confirmed Chrome can restore those fields from another character through history, but it fires no events, so that alone doesn't save anything. That restore is now blocked, which removes the one way I found for those words to reach those fields.
**If a sheet's name changes again, it's a separate bug,** and what that tab had just been doing is the clue. That sheet has since been replaced by a new one with BOLLARD-7's own name and backstory, so the evidence is gone. It didn't recur in any later step of the round.

## How it was reviewed

Two independent reads, each given the code and not my conclusions.

**The first** found ten problems, all fixed but where noted below. The worst: two tabs pulling one new row made a duplicate character, two tabs inserting one new record made two rows, a pull could overwrite an edit made in the other tab while it fetched, and a slow tab's write could make a new character read as deleted.

**The second** simulated lagging storage in 500 two-tab store trials and 75 cloud trials, and found the design holds. It found one more real bug, affecting one tab too: a character deleted and then imported back from a file vanished at the next reload. Fixed, with a test.

## Checked, and how

- **The whole suite:** 492 chains, 516 runs, 0 bad, on the final code (round 219). The three new chains are among them.
- **The new chains:** `tabs_1` (61 checks, two live copies of the app on one storage), `tabs_2` (20, across real reloads), `tabs_3` (76, the sync's half).
- **The real rules on a local database:** all five rounds pass on the final code: two tabs 40, the same sequence in one window 21, the Table 150, batch 2 144, batch 3 61.
- **The real lock:** `pg/lock_probe.py` takes `oneAtATime` out of `cloud.js` and runs it in real Chrome on real time, 7 of 7: runs take turns, a run that throws lets go, a stuck holder is given up on.
- **Breaking the new code on purpose:** 52 lines broken one at a time, all 52 caught, each failing its own check (`pg/tabs_mutants.py`). Earlier passes caught fewer, and those misses tightened several checks, including the stale-copy check itself, which could not fail before.
- **Two mutants were retired as equivalent,** with the reason in `pg/tabs_mutants.py`. Taking those lines out changes nothing a chain can reach.

**The harness runs chains without the real lock.** Its virtual clock can't see the lock's handshake, so a timer runs out while a sync is still waiting for it, and five chains fail for that reason alone. I proved that by turning the lock off in the harness: they pass. So chains use no lock or a stand-in, and the real one is only proved by the probe above.

**Since checked on the live site:** two real tabs on two characters, with real Discord. The real round, below, has the numbers. Whether a browser lock was held during that round can't be seen from the database, so the lock itself is still proved only by the probe.

## Decisions

1. **Tabs work together,** your call, over one tab at a time.
2. **Delete wins over an edit.** Two tabs on one character, one deleting it: the delete stands.
3. **An array counts as one thing in a merge.** Merging lists item by item is more code than the case deserves, and it only matters for one character in two tabs.
4. **The lock waits 20 seconds,** then runs anyway. A stuck tab shouldn't stop another from saving.

## Still open

- **The Admin desktop's document had the same problem.** Fixed since: see "one Admin desktop per campaign", below.
- **One character in two tabs,** editing inside the same few milliseconds or changing the same list inside a moment: one change loses.
- **A stale device** still overwrites a sheet under last write wins. Mail comes back. Other edits, and a package already taken, don't.
- **Rare ones the second review found:** two tabs deleting different characters within milliseconds, or full storage, can lose the delete note, so a delete comes back. A tab frozen for over 7 days can bring one back too. A pack-locked record pulled with a fast clock's stamp keeps it. A 20 second lock fallback during a stall can still insert twice.
- **Older than this, in one tab too:** deleting a character while its first upload is in flight, or reloading during it, can leave a stray row or a duplicate.
- **A record deleted while jacked out and re-imported with an older stamp:** the account's row now replaces it.

# The real Discord round

Run on the live site on 8 Nov 2026, with two real accounts, Popsculpture and MyGalFRIDAY, one step at a time. After each step I read the real rows, because the round's worst problem didn't show on screen.

| Step | Result | The database says |
|---|---|---|
| A package to one character, online | **Pass** | Delivered in 0.74 s, on another account's sheet, one copy. One Pistol, and the Admin's list says Taken |
| A package to the crew, online | **Pass** | 0.85 and 0.92 s. Three Flow Tonic Vials on each sheet, once |
| The same with one account in two tabs, before the fix | **Fail, and found the bug** | `dd` said delivered, with no message and no Assault Rifle on the sheet. A stale tab had saved over it. Reproduced, then fixed: see the two-tab part of this report |
| Recall | **Pass** | The row stayed recalled, and the Crossbow never reached Nessa |
| Mail while away | **Pass** | The other copy waited 18.8 s, until the account came back, then delivered |
| Two tabs on two characters, after the fix | **Pass** | 1.10 and 1.17 s. One message and one Knuckles on each sheet, taken 1.3 s apart in different tabs. Each tab's edit stayed on its own sheet |
| A hidden tab | **Pass** | The row waited 64.6 s, then delivered on the way back |
| Two devices | **Pass** | 1.18 s. One Dagger. The second device was told it was already taken, and its edit reached the account |
| Read-only sheets, Gizmo's no, co-Admin both ways | **Pass, by your report** | MyGalFRIDAY was back to Player afterwards. The rest is on screen only |
| Remove with block, unblock, reset, the old link dead, the new link joins | **Pass, by your report** | Back as it was afterwards: no blocks, roles right, both characters in the campaign, the mail untouched |
| Transfer, both ways | **Pass** | MyGalFRIDAY Admin and Popsculpture co-Admin, then the reverse |
| A second campaign, a character moved, the Table's picker, the campaign deleted | **Pass** | `Side job` gone, and BOLLARD-7 back in 5th flavor |

**The test campaign now:** 5th flavor, with Popsculpture as Admin and MyGalFRIDAY as co-Admin (a transfer leaves the old Admin as a co-Admin), and Nessa and BOLLARD-7 in it.

**Never pinned down:** how BOLLARD-7's sheet came to hold Nessa's identity. It didn't happen again.

**Not proven on the live site:** lost mail coming back, because the row went away with its sheet. It passes against the real rules locally.

**If you added `http://localhost:8777/**` to Supabase's redirect list,** it can come out now. I didn't touch that setting.

# Campaigns build report: one Admin desktop per campaign

Built 8 Nov 2026 on `claude/distracted-haslett-65d404`, cut from `main` at `089fd6c`. No SQL and no migration. **Merged to `main` on your word, 9 Nov 2026.**

## Why

You asked whether an Admin can run several campaigns. Creating, joining and the Campaign tab's picker worked, but everything else on the desktop was one document per browser, `en_gm_v1`. Every campaign shared one Table, one set of encounters and one Payroll history, and switching the Table's picker only marked the other campaign's rows `OTHER CAMPAIGN`. An Admin in two tabs also overwrote their own work, because the whole document was written back on each save.

## Your four choices

1. **Shared across campaigns:** Saved Threats and custom Hazards. The Bestiary is built in, so it always was. Everything else belongs to a campaign.
2. **The document people already have:** ask once. A one-time card says what the device holds and asks which campaign it belongs to.
3. **Where it lives:** on the device for now, with export and import per desktop.
4. **The picker:** it offers No campaign as well, so a one-shot on this browser's characters needs no jacking out.

## What is built

- **A campaign's document is its own,** `en_gm_camp_<id>_v1`. It holds the Table and last fight, encounters, jobs, the ledger, the Heat log, contacts and scenes.
- **The library stays in `en_gm_v1`,** which is also the desktop of an Admin with no campaign. So nobody without a campaign has anything migrated, and an old copy of the app can still read the document.
- **The picker switches everything, for that tab.** It sits above the fight now, not under Pull in the crew, because it decides whose fight this is. The top bar says `ROUND 2 · NIGHT SHIFT`.
- **Each tab keeps its own campaign,** across a reload. A new tab opens on the last one picked anywhere.
- **Two tabs on one desktop merge.** The document is taken apart into parts, each with its own stamp: a record, a Table row, the round. A save goes to the other tab at once. Where both tabs changed one part, it merges field by field and the newer save wins.
- **Two tabs with one record open keep each other's changes.** Plans, scenes, job cards, contact cards and custom hazards each edit a copy and save the whole copy, so they now say what they opened, and a save writes only what that copy changed. A copy with nothing unsaid shows the news on the next draw. A posted job can't be un-posted by a stale card.
- **Half-done work stays with its campaign.** A half-written contact, plan or payday doesn't follow you to another campaign, and it's there when you come back.
- **The move.** It carries everything but the library. It never writes over anything: a record already here under the same id with different contents stays on the device, so does a Table when this campaign's is in use, and so does a row another campaign owns. A copy of the old document is kept first, and Settings can export or delete it.
- **Settings' GM data** works on the desktop you're on, offers the same move later, and lists desktops left behind by a campaign you've left, to export or delete.

## What you'll notice

- **Your first visit to the Admin desktop** brings up the card, if this browser holds work from before. Answer it once. Leaving it on the device is safe: pick "No campaign" in the Table's picker to open it, and Settings can still move it.
- **With no campaign,** nothing looks different, and two tabs now work.
- **An empty Table on a campaign you've never used is right.** The work is on another desktop, not gone.

## How it was reviewed

Two independent reads, each given the code and not my conclusions.

**The first** found the biggest bug in the build: my merge was sound, but an editor's copy went straight back over it, so two tabs on one saved scene overwrote each other on every keystroke. That is why the open copy exists. It also found that importing a left-behind desktop's file emptied the shared library, that a second move replaced the good copy with an emptied one, that a refused move left a copy behind while saying nothing changed, that a deleted desktop came back from another tab, and six smaller ones. All fixed.

**The second** read only the fixes. It found three more: a job's status going back when a card that had drawn it saved, news hidden on a record first saved in this tab, and a tab losing its pick when another account visited this browser. All fixed.

**Lagging storage, simulated:** `pg/gm_tabs_fuzz.mjs` plays random rounds of two and three tabs on the real store. It found three things no chain had: a save written over and then lost when the only tab holding it closed, a key's order reading as a change (which could bring back a deleted record), and a save only the storage event still held not being put back. All fixed.

## Checked, and how

- **The whole suite:** 494 chains, 518 runs, 0 bad, on the final code. Run from a private copy of the suite, so the writing-tabs session's chains and hunks stayed out of it.
- **The new chains:** `gmtabs_1` (99 checks, two tabs on one desktop), `gmtabs_2` (188, the desktops, across real reloads), `gmtabs_3` (147, the move), `gmtabs_4` (78, one record open in two tabs, through the real views). All are two live copies of the app on one storage.
- **The fuzz:** 2,000 random rounds of two and three tabs on the real store, half of them with storage lagging as it does between a browser's pages: 15,510 records, 9,274 Table rows and 21,257 edits, nothing lost, nothing deleted came back, nothing crossed between campaigns. 150 edits under lag lost to another tab's edit of the same record in the same moment, the limit below.
- **Breaking the new code on purpose:** 116 lines broken one at a time, all 116 caught (`pg/gmtabs_mutants.py`). Earlier passes caught fewer, and every miss tightened a check or took out a line that did nothing.
- **The real rules on a local database:** all five rounds pass on the final code: two tabs 40, the same sequence in one window 21, the Table 157, batch 2 144, batch 3 61.
- **Two real tabs in a real browser,** on real time and real storage events, on localhost with a stand-in account: a save heard with nobody asking, the card and the move, the other tab following it, each tab on its own campaign and staying there across a reload, and the library shared. An iframe shares its parent's per-tab storage, so the chains can't prove that part. While that stand-in was up, its reads went to the live project with no session and were refused. Nothing was written.
- **Screens:** the Table, the card and Settings at desktop width, and the Table at 375 px.

**A bug in an older test turned up:** `tabs_3` hung twice under full load. Its cleanup ran `delete navigator.locks`, which brought the real browser lock back, and virtual time can't see that handshake. Fixed in the test. That step now takes the same 2,170 virtual ms on the old code and the new, and the run above is with the fix.

## Decisions beyond your four

1. **A dropped connection stays on the campaign.** Only jacking out, for real, goes to the browser's own desktop. A wifi blip must not swap the Table in the middle of a fight.
2. **A file imported on a campaign replaces that desktop and only adds to the library.** A threat the library already has stays as it is, because other desktops use it. On No campaign a file replaces everything, library too, as it always did, and the hint says so.
3. **Export is one desktop at a time,** with the library in it. Moving three campaigns to a new device is three files.
4. **GM Controls and Optional Rules stay per device,** not per campaign. I left them where they were. Say if you want them per campaign.
5. **An array counts as one thing in a merge,** as it does on the roster: a plan's lines, a scene's lists. Table rows don't, since two tabs on one fight is the ordinary case.
6. **Nothing can be deleted as left behind while jacked out,** because nothing then says which campaigns are yours.

## Still open

- **With the writing tabs branch.** `claude/funny-hermann-497402` keeps its outbox in the ledger, and the ledger now belongs to a campaign. So a send queued for one campaign waits until that campaign is opened, unless whichever lands second makes it walk every document. The two branches conflict in `gmstore.js` and `campaigns.js`. `campaigns_table_1` needs both to pass all its checks, and `gmtabs_*` and `campaigns_writes_1` fail on the branch without them.
- **Two devices or a co-Admin** see separate Tables, as the live round showed. That is your choice 3. You chose an additive SYNC button for it, next after the writing tabs: see below.
- **Two tabs changing one list on one record inside a moment:** one change loses. So does changing one field in the same instant.
- **A payday form saved from two tabs:** the last SAVE wins, as one form. A credited payday is protected, since it refuses a save.
- **The one way left to lose a save:** the only tab holding it closes in the instant another tab's write lands over it, unheard. A person can't do that by hand.
- **A tab frozen for over 7 days** can bring back something deleted, as on the roster.
- **The copy from before a move** stays until you delete it in Settings, and it counts against the browser's storage.

## The live round

Run on the live site on 9 Nov 2026, with real Discord and the real project, one step at a time. The desktop lives in the browser, not the database, so after each step I read the browser's storage (names and counts only).

| Step | Result | Storage says |
|---|---|---|
| The Admin desktop opened on a browser with no old work | **Pass** | No card, and the account marked as asked |
| A threat on a new campaign's Table, kept across a reload | **Pass** | In that campaign's own document only (Test) |
| Two tabs on one desktop | **Pass** | A threat added in one tab and an edit made in the other each showed in the other tab without a reload. Both were in Test's document after reloading both |
| Three tabs on three desktops | **Pass** | 5th flavor, Test and No campaign open at once, each with its own Table, each kept across a reload. No campaign's threat was in `en_gm_v1` only |
| The co-Admin's browser (Firefox) | **Pass, as built** | 5th flavor's Table was empty there, with the crew offered. Each browser keeps its own desktop |

**Not tried live:** the one-time card and the move, since no browser held Admin work from before. They pass locally. The picker's list in the co-Admin's browser wasn't read.

**You expected the co-Admin's Table to mirror the Admin's.** It doesn't, by your choice 3. Co-Admins are rare, so you chose a cheaper fix over a live mirror: an additive **SYNC button**, the next build after the writing tabs. One press saves this campaign's desktop to the database and adds what the campaign's other Admins saved there. It never replaces or removes anything, and it reports what it kept as yours. It also covers one Admin on two computers. Its catches, agreed up front:

- A delete doesn't travel: the next sync brings it back from someone who still has it.
- An edit reaches only someone who doesn't have that record yet.
- A sync in the middle of a fight adds the other person's Table rows.
- Payroll's queued sends stay out, since they are money in flight.

**The deploy:** GitHub's Pages build of `96bdb43` failed during a GitHub incident (Actions and Pages, 9 Nov 2026, 18:12 UTC). An empty commit, `5fba2bc`, ran it again, and the live files then matched `main`.

# Campaigns build report: the writing tabs through the inbox

Built 8 Nov 2026 on `claude/funny-hermann-497402`, cut from `main` at `d93f722`, and rebuilt on 9 Nov on `main` at `96bdb43`, which has the Admin desktop per campaign, then brought up to `main` at `1ee1387`. **Not merged, and the migration is not applied:** both wait for your go.

## What you decided

- **Job Board, Payroll and the XP award now.** Heat gets its own pass, because its board has to read other players' Heat first and a take-back after the 0 to 10 clamp is only approximate. Payroll's Milestones panel came along, since it's the same tab and the same door.
- **A player gets the numbers at once, with a letter,** not a Take it.
- **UNDO sends a correction.** It doesn't refuse.

## What is built

**While you run a campaign, those three tabs list everyone in it, and the line about who they can't reach is gone.** Each list names the player: `Nessa Vale · MyGalFRIDAY`.

**What the player sees.** A payday, an XP award or a Milestone lands at once, with:

- the numbers on the sheet;
- a line in their money Ledger, "From the GM: Payday: The Toll";
- an unread #POST letter, signed Payroll, XP Award or Milestones, saying what came;
- the toast they already know.

A pay stub always goes to another player's sheet, whatever the chip says, because that letter is how they hear about it. If they were away, it's all there when they come back. A Job Board posting is plain mail, and it keeps the When you typed.

**What UNDO does.** UNDO PAYDAY, UNDO AWARD, UNDO MILESTONE and the undo strip all work as they did. For another player's sheet they send a second row with the numbers the other way, and a letter: "Taken back: Payday: The Toll". It shows as an Adjustment in their Ledger, and it can leave a wallet below zero, as UNDO always could. UNDO POSTING recalls a posting still waiting. If it already arrived, they get "Withdrawn:" and the job's title. A send taken back before it reached them leaves nothing at all: the database says whether it landed, so no tab has to guess.

**If the link is down,** the write still counts on your screen and goes when the link is back, whichever campaign's desktop is open by then: a payday made on Night Shift goes while you work on Day Shift. After 5 seconds the tab says "1 send is waiting for the link". It survives a reload.

**If it can never land,** say the character left the campaign, it doesn't count as paid, and it stays on that campaign's undo strip, on every Admin tab, until you press OK. The toast alone would be gone before you saw it. Refused while you're on another campaign, the toast names the one it came from.

**If the campaign has ended,** because it was deleted, what was waiting on its desktop ends with it, a send or an UNDO. It's closed for good, no copy of it anywhere can send it later, and a toast says so once, in your words: "Lost in #POST (This campaign has ended)". Nothing goes to the player. The desktop stays in Settings as left behind.

**A campaign that's still there but no longer yours to run** (demoted, removed, or left) ends the same way, as you chose ("End like a delete"), and stays ended if you run it again later. Its toast reads "Lost in #POST (You no longer run this campaign)". That wording is a suggestion from the session running this build, not yours, so change it as you like.

Under the hood: one new migration and its checks, `writeCrew` going through THE FAR DOOR in `gmstore.js`, and the courier in `cloud.js` filing numbers along with the letter. Heat isn't touched. The asset stamp is `?v=20261109.1`. README, HANDOFF and DEFERRED-FIXES describe it.

## Going live, in this order

The Admin desktop per campaign is on `main` already, and this branch is built on it.

1. **This migration, on the live project, before this code.** The app's read of the inbox names the new column, so if the code went first, all mail would quietly wait until the migration landed. The other way round is safe: the old app can't see these rows, and nothing sends them yet.
2. **Then the merge.** `claude/writes-on-desktops` was a trial merge with an older copy of the desktops branch. It's superseded by this branch and can go.

From a worktree, which has no `supabase link` of its own:

```bash
npx supabase@2 migration list --project-ref ggjgkcnhfpjwyrhakqun
```

```bash
npx supabase@2 db query --linked --project-ref ggjgkcnhfpjwyrhakqun -f supabase/migrations/20261108210000_inbox_writes.sql
```

```bash
npx supabase@2 db query --linked --project-ref ggjgkcnhfpjwyrhakqun -f supabase/tests/campaign_checks.sql
```

```bash
npx supabase@2 migration repair --status applied 20261108210000 --project-ref ggjgkcnhfpjwyrhakqun
```

The checks should say 289 PASS, 0 FAIL. The repair is there because `db query` applies a file and records nothing.

## Worth your eye

1. **A send goes from whichever desktop is open.** Each campaign has its own ledger now, so a send queued on one would have waited until you went back to it. Now every run reads every campaign's desktop on this browser, and writes the answer back into the one it came from, which a tab open there hears. Each step reads the record again first, because a tab open on that campaign may have sent it or taken it back meanwhile. Two smaller calls came with it: the waiting note counts the campaign you're on, and a refusal's strip line stays on its own campaign.
2. **Two different Admins can still pay one fight twice.** "Already paid" is read from the ledger, and the ledger is per browser. A co-Admin, or you on a second device, gets no hold. Nothing in this build changes that, and the desktops per campaign don't either. It wants a ruling if you run a table with a co-Admin paying too.
3. **In a two-tab merge a wallet and a tally now add up.** You chose "the newer save wins where both changed one field", and that stands for everything else. Glimmer, Nexus, XP and the two Milestone counters are running totals now. If they weren't, a payday landing in one tab while the other spent money could leave a letter saying paid with the money gone. That took a small change in `store.js`.
4. **A row with numbers can't be recalled, on purpose.** The Campaign tab's list shows it as Waiting with no Recall. A recall racing a filing would have to take numbers back off a sheet, so if a player is away, they get the payday and its correction together, two letters that come to nothing.

## How it was reviewed

One independent read of the diff, given the code and not my conclusions. Its word on the common paths was that it found nothing landing twice or not at all, and that the filing rules and the SQL held. It found real trouble in the rare cases:

1. **Two Admin tabs could pay twice.** A second tab held its own old copy of the ledger, so it read the fight as unpaid. The Admin desktop per campaign closes it, and with it in this branch, two real tabs pass every check (`pg/writes_tabs_realdb.js`).
2. **A tab merge could part the numbers from the row:** the row listed as filed, with the money gone. Fixed, item 3 above.
3. **A queued write that came in with an imported file never went,** while the ledger said paid. Fixed: it still goes, and the key means it can't go twice.
4. **Lost numbers could fall past the look-back.** The heal only read the newest 100 rows, fair for letters, not for a wallet. Rows with numbers now have no such limit, and go first.
5. **A refusal left only a toast,** and the panel went on saying "Credited to 4". Fixed: the strip keeps it until read, and the panel counts who it reached.
6. **One bad row could hold up everything behind it for good.** Cutting a long title could halve an emoji, and the database refuses the half. Fixed both ways: a cut can't do that, and data the database can't store now counts as an answer.
7. **Smaller things, all fixed:** the award's COPY quoting a count from before the award, a job's line calling a character "no longer in this campaign" when the campaign just hadn't been read, the waiting note vanishing offline, "gets a correction" shown when none was owed, a payday of nothing sending a letter saying 𝒢0, and another account on one browser being able to take back your write.

There has been no second review of these fixes. The tests below cover each one.

**A second independent read, of the send going from any desktop,** found one real bug. A run worked from the copy of a record it read when it started, so a tab open on that campaign could take a send back while the run was out on an earlier one, and the run still sent it, with no correction. A refusal judged on that copy could even send a correction for money that never landed. Fixed: each step reads the record again where it's kept, and saves only the fields it changed. Its smaller points: a toast calling a campaign "this campaign" after the tab moved (fixed), and a save's rollback that could lose the note that a send tried (gone: memory keeps it, which costs at worst a send and its correction). That fix had a review of its own, below.

**A third independent read, of that fix,** found that every Admin tab now runs every desktop's outbox, with nothing to keep them in step, and traced seven ways that goes wrong. The two that mattered: an UNDO could be decided on a copy that didn't know another tab, or another desktop's copy of the record, had already sent it, so money landed with no correction; and a tab that hadn't heard an UNDO could write over it. All seven had a check that failed before the fix:

1. **UNDO is decided by the database now** (`take_back`, in the migration). A key with no row is marked taken back, and anything sent under it later is refused, so it never lands. A key with a row gets its correction, once, or is recalled if it's a posting still waiting. Whichever reaches the database first wins, under its one-row-per-key rule.
2. **What either copy knows stays known.** Two copies of one queued send meet when a tab hears another, and when a run writes to another desktop. A send, a refusal, an UNDO and what came of it now only move forward, so a stale copy can't unsay any of them.
3. **Two runs refused at once** no longer erase the lasting notice, and a refusal for a record gone from its desktop says nothing.
4. **A record the app can't read** stays queued and holds up nothing behind it, on any desktop.
5. **Another account signing in during a run** stops it quietly, and the first account's sends go when it's back, instead of being refused for good.
6. **The library refusing a save** no longer holds up a campaign's sends. The note that a send tried, which that hung on, is gone: the database decides now.

That round had a review of its own, below.

**A fourth independent read, of that round,** found the security sound: every lookup is the caller's own, there is no way to learn about anyone else's sends, and the two functions serialize. It traced two real faults and four plausible ones. Each has a check that failed before the fix, apart from the one that is yours to decide:

1. **A send refused as taken back still counted as paid** on the desktop it was on. Fixed.
2. **A take back for a character who had left the campaign marked nothing,** so a second copy could land after they rejoined, with no correction. The marks now live in a table of their own (`inbox_taken_back`): a mark needs no character or campaign, and outlives a deleted campaign. Fixed.
3. **Deleting a campaign deletes the rows that show which sends landed,** so an UNDO afterwards would find nothing to correct, and a send still waiting could go out elsewhere. You chose that a campaign's business ends with it: see Decisions.
4. **The account could change between the app's own look and the request leaving,** with another tab signing in. The app now says which account it means (`p_sender`), and the database refuses anything else, EN_NOT_MINE, so it can't send or take back for the wrong account. Fixed.
5. **Copies of one send on two desktops** could disagree, one paid and one taken back. Every answer now reaches the other copies too. Fixed.
6. **A key ending `:fix` could stand in for a correction.** Those keys are `take_back`'s own now, and refused anywhere else. Fixed.

The checks it asked for are in, with one exception. Two sends of one key landing in the same instant needs two database connections, and PGlite has one. `send_write` and `take_back` now take a lock per sender and key, so neither has a branch for losing that race any more, and the database's one-row-per-key index still holds if one ever slipped through. The lock itself is untested here: the live round is the first time it can be.

That round, and the campaign ending with it, had a review of its own, below.

**A fifth independent read** found the locking and the access sound, and traced three real faults and four plausible ones. Each one I fixed has a check that failed before the fix, and the sixth was right as it stood:

1. **A correction could outlive the money it corrects.** It was filed in the campaign the character was in when you pressed UNDO, so deleting the campaign the money went through left the correction behind, to take money that never arrived. It's filed where the money went now. Whether you can still reach them is still where they are now.
2. **A send that ended didn't end for good,** and every ending said the campaign had ended, a demotion included. The database decides it now: each send and UNDO names the campaign of the desktop it was made on. Deleted, the record closes for good and its key is marked, so no copy can send it later. Still there and no longer yours to run, it ends the same way (your choice since), with words of its own.
3. **An account switch while the outbox read the campaign list** could tell the new account a campaign had ended. The outbox doesn't read the list any more.
4. **Marks had no limit.** A sender now has at most 10,000. A take back that names no character, or one nobody has, marks the sender's own key, and one with a row has to name its character.
5. **A send refused after you'd taken it back didn't mark its key,** so a copy that hadn't heard could land it later. It goes on to `take_back` now.
6. **Records on the browser's own desktop, or copies on another campaign's,** aren't a campaign's desktop for these rules. Once any copy of a send ends or is taken back, its key is marked, so the rest can't send it either.
7. **The outbox read the campaign list on every run** while an ended desktop held anything. It doesn't read it at all now, and what waits on a desktop you no longer run ends on the first answer, so nothing is asked again.

The checks it asked for are in: `UPDATE` and `DELETE` on the marks, a character between two campaigns you run, a take back with no character or an unknown one, and the marks in what a run leaves behind. Two sessions racing still can't be tested here, since PGlite has one connection.

This last round hasn't had a review of its own.

## Checked, and how

| What | Result | How |
| --- | --- | --- |
| The SQL | 289 PASS, 0 FAIL locally, nothing left behind, marks included | `campaign_checks.sql`, up from 168. Not yet on the live project |
| The checks have teeth | 258 of 258 caught. One more was dropped as equivalent: the marking helper runs with the caller's rights, and the table refuses a client either way | Broken copies of the migrations, 101 of them for this one |
| The story, on the stand-in | 398 checks pass | `tests/campaigns_writes_1.js`, through the real UI: post, pay, award, Milestone, the player coming back, a sheet saved over, online, every UNDO, the far door's rules, sends from another campaign's desktop, every finding of the four reviews of that, and campaigns deleted and no longer yours with sends and UNDOs waiting |
| The same story, on the real SQL | 402 checks pass | `pg/writes_realdb.js`, the real app, real supabase-js and real realtime-js on the real migration in PGlite |
| Two real tabs | 36 checks pass | `pg/writes_tabs_realdb.js`: the double payment held back, the idle tab's send, both tabs agreeing, a send queued in one tab going from the other on another campaign, and a take back landing while the other tab's send of it was out |
| A real reload with a send queued | Pass | `tests/campaigns_writes_2.js` and `_3.js`: it goes with nobody asking, under the same key |
| Breaking the code on purpose | 131 of 131 caught | `pg/writes_mutants.py`, a line at a time, each failing its own check. The one that only two real tabs show runs on the real database |
| Before each fix | On `cfc7089`, 4 of the new SQL checks fail and 2 of the story's: nothing was marked, closed or said. Each earlier round's checks failed on the code before it, as that round reported | The same story and checks on the code before it |
| The other real rounds | All pass: batch 2 144, batch 3 61, the Table 159, two tabs 40, the same sequence in one window 21 | On the final code |
| The two-tab fuzz | 400 random rounds of two and three tabs, nothing lost | `pg/gm_tabs_fuzz.mjs` on the final `gmstore.js` |
| The whole suite | Before main's `b38dc88` was merged in: 499 chains, 524 runs, 1 bad, `sitdown_caught_snag`, main's new chain for that commit, which passes on `b38dc88` itself | `cx_integ_run.py`, round wr14 |
| Three skins, desktop and 375 px | 30 of 30 measured, none scrolls sideways | `tests/campaigns_writes_shot.js` measured without a screenshot, so its numbers are read. Measured before the last five rounds; the one screen they changed is a toast's words |

`gate.js` and `tour.js` have no diff against `main`. No em or en dashes in anything added.

**Not checked:** the live site, real Discord, real Realtime carrying numbers, and two sessions racing inside the database. PGlite has one connection, so the fallback for two tabs sending one write in the same instant has never contended. It's the same one-row rule the database enforces either way.

**Waiting for you, once it's live:** a round with a second account. Pay them online and offline, award XP, post a job, and take each back. The sheet and the row should agree after each step.

## Decisions

1. **The closed list:** Glimmer and XP whole, up to 10,000,000 either way. Nexus to the hundredth, up to 1,000,000. Milestones up to 99. Up to four to a row. A negative is how a correction works, so those who run a campaign can dock a sheet by hand-made call. That is the trust a player gives by joining.
2. **`send_write` takes a posting too,** with no numbers, so one door has the key. Batch 3's `send_to_character` is exactly as it was.
3. **A long field is cut to fit,** never refused. A body past 4000 characters says the rest didn't fit.
4. **A send taken back before it landed goes nowhere,** and one that landed is corrected. The database decides which, so a send that tried and never arrived needs no correction either.
5. **A send only goes under the account that wrote it,** and only that account can take it back.
6. **The player's name is on the lists about to be written to,** as it is on the Table.
7. **A run reads every desktop on this browser,** under the account that wrote each send, and stops quietly if another account signs in. Each step reads the record again where it's kept, and what either copy knows stays known. A desktop with nothing queued isn't even read.
8. **An UNDO's mark lives apart from the inbox** (`inbox_taken_back`). It needs no character or campaign, it outlives a deleted campaign, and it doesn't show in the Campaign tab's list of sends. Anyone can mark a key of their own, which delivers nothing to anyone.
9. **The app says which account it means** with each send and take back, and the database refuses a session that changed under it. A run stops quietly on that, as it does when another account signs in.
10. **A campaign's desktop ends with it** (your word, 9 Nov 2026: "They end with it"), and the database decides it. Each send and UNDO names the campaign of the desktop it was made on. Deleted: it closes for good, its key is marked so no copy can send it, and one toast tells you, in your words: "Lost in #POST (This campaign has ended)". Nothing goes to the player. No screen offers UNDO on such a desktop once the picker knows; an UNDO a tab queued before that ends the same way. A campaign still there that you no longer run ends the same way ("End like a delete"), told once as "Lost in #POST (You no longer run this campaign)", a suggested wording for you to change, and stays ended if you run it again.
11. **A correction is filed in the campaign the money went through,** so it goes with that campaign. Whether you can still reach the character is still where they are now.
12. **A sender has at most 10,000 marks.** A take back that names no character still marks the sender's own key, which delivers nothing to anyone.

## Still open

- **Heat through the inbox.** Next, on your word. **Vigor at the Table's END** doesn't reach another player's sheet either. It was never one of the four, and it depends on what the sheet holds, as Heat does.
- **Two Admins paying one fight,** above.
- **A removed player's rows still land on them,** as their mail does, and a correction after they've gone is refused, and says so on the strip.
- **The lock between `send_write` and `take_back`** has never had two connections to work against. PGlite has one.
- **RECALL on the Campaign tab's list leaves the Job Board saying "(posted)".** A later UNDO POSTING comes out right.
- **A row still due goes with its campaign if the campaign is deleted,** and the Admin's ledger still reads as paid.
- **Importing an older GM file drops queued sends it doesn't hold,** because an import replaces the document. The ledger then has no word of them, so it doesn't read as paid either.
- **A letter can be lost in the rarest two-tab race,** two filings at once after the lock gives up at 20 seconds. The numbers stay right.
