# Session handoff

Paste the block below into a fresh session to resume work. Written 2026-08-10, brought up to
date 2026-11-28.

---

Continuing work on the Elysium Nights Character Sheet
(`C:\Users\Popsc\OneDrive\Documents\Elysium Nights Character Sheet`). This is a LOCAL
session on my PC, so you can run a dev server and drive the real app.

**Do this first:** `git status` and `git pull`. Other sessions share this folder, so confirm
the branch is `main` before committing and stage only your own files. `main` is what GitHub
Pages deploys to elysiumnightsrpg.com.

## Read these first, in this order

1. `README.md`: what the app is, the content packs, campaigns and the deploy steps.
2. `DEFERRED-FIXES.md`: the running log, and the most important file in the repo. It
   carries the invariants this codebase paid for one at a time, each learned by getting
   it wrong. Do not relitigate them. It is long; read the section headings first and go
   deep only where you are about to touch.

   It is an archaeological record, not a to-do list: entries are struck and annotated in
   place rather than deleted, and some closed items were never struck. Check the code
   before calling anything in it open. Its `file.js:NNN` line references are often stale;
   find the site by the quoted code.
3. `CAMPAIGNS-BUILD-REPORT.md`: the campaigns, inbox and Admin builds.

## Open work, as of 2026-11-28

- **At launch:** set `products.rule` for `EN1101` back to `signed_in` (README, "The playtest
  gate"), and decide on the three holds in `app/data/launch.js`.
- **#GRIDroid redesign:** the layout is mapped in `handoff-gridroid-layout.md` (24 Nov,
  not committed). No redesign has been built from it.
- **'98 art:** the site icons exist at 32 px only; the 16 px slots wear drawn stand-ins.
- **Deleting an Admin's account** would leave a campaign with no Admin. Nothing in the app
  deletes accounts; it wants a ruling when something does.
- **Live #POST between two real accounts** has not been checked, as far as the notes record.
- **Small, known:** a removed player's device learns of it on its next read; the tour is not
  told about a viewed sheet; an imported empty Smartdeck key is never normalized (L13, inert).

## Conventions

- Commit as you go. Never push unasked: offer a brief overview of what would go, and wait
  for me to type "push it".
- Before a push that touches `app/`, run `python tools/stamp_version.py` and commit the stamp.
- The browser tests live beside the repo, in `Elysium Nights Test Suite` (see its README).
- Zero em dashes and en dashes anywhere. `LC_ALL=C.UTF-8 grep -rnP "[\x{2013}\x{2014}]"`
  must be clean before every commit, excluding `app/vendor` (third party).
- Also check for stray control characters: `grep -rlP "[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]"`,
  same exclusions. A literal backspace once hid inside a regex for a whole session and
  silently disabled the `?dev` bypass; `cat -A` is the only thing that finds it.
- Load the app with `?dev` to skip the login card, and add a cache-buster
  (`?dev&cb=x`). Open `app/index.html` directly, not the repo-root `index.html`, which is
  a redirect stub that races a meta refresh against a JS redirect.
- The login card (`app/js/gate.js`) offers Jack in with Discord and Run offline; there are no
  codes. Either button lands on the Freelancer desktop; a load that skips the card
  answers with no profile, so the app opens on the remembered desktop (`en_portal_v1`). The
  card shows until the device has a stored Discord session or picked Run offline (`en_login_v1`);
  the old `en_gate_ok_v1` and `en_gate_admin_ok_v1` are ignored. `?dev` skips it (and records the
  offline pick), `?dev&portal=admin` lands on Admin, `?login` forces the card and clears nothing.
  Gizmo greets a device once (`en_gizmo_hello_v1`). gate.js must stay: `js/tour.js` draws Gizmo
  from `EN.gate.gizmoSvg`, and `clipSvg()` is finished art that comes through byte for byte. The
  test suite's harness seeds a stored session unless a test says `@no-pack`, so a test of the card
  needs that marker.
- Each skin remembers the palette it last wore, in `en_skin_theme_v1`, a map keyed
  `<desktop>:<skin>` (`freelancer:98`, `admin:classic`, ...). Switching skins applies that skin's
  palette THROUGH `set()`, so it lands on the active Freelancer's record and rides their export,
  which is the cost the author accepted on 2026-09-09 for skins that look like three machines.
  `SKIN_SEED` in settings.js is what a skin wears before it has remembered anything. The desktop
  half of the key is what keeps an Admin palette out of the Freelancer side. The older
  `en_skin_seeded_v1` flag is retired and unread; a device carrying one is not migrated.
- Looks are device state too: the OS skin in `en_skin_v1` (Classic when absent), and on '98 the
  wallpaper choice in `en_wall_v1`, custom wallpapers as JPEG data URLs in `en_wall_custom_v1`,
  and the desktop's three toggles in `en_wall_dim_v1`, `en_wall_shadow_v1` and `en_wall_glow_v1`.
  Presets are listed in `app/data/wallpapers.js`, in two kinds: a picture names a `file` and a
  `thumb`, and a tile carries `tile`, a `size` and its art, either inline as an SVG data URL in
  `svg` or as a `file` under `tiles/`. Files sit in `app/img/wallpapers`. None of it rides a
  character or an export.
- Three skins: Classic (desktop), #GRIDroid (phone) and #GRIDOS '98. Classic and #GRIDroid are
  mostly CSS, plus a few HOOKS in the modules: `.mkt-*` and `.inv-sub[data-sub]` in inventory.js,
  `data-sub` and `data-tab` on every tab (each TABS entry's `sub` and `key`) for #GRIDroid's
  app-list subtitles and for reaching one named tab without counting children, and
  `html.rail-open`, which app.js toggles when the open tab is tapped again on #GRIDroid only (so
  that skin can fold and unfold its app list; every other skin keeps re-tapping #PRINT as the
  shortcut to Advance). '98 is a desktop of its own, in `app/js/w98*.js` and `app/css/w98*.css`:
  the app still draws one view, which moves into the live program's window.
- #GRIDroid's layout collapse reaches most elements through attribute-substring selectors on the
  inline styles the modules write, so it needs few hooks: `.chrome-frame`, `.chrome-stats` and
  `.inv-bar` in inventory.js, `.panel-hr` on the panel header-right wrapper in ui.js, and
  `.row-label` on the fixed-width label spans in flow.js, grid.js, inventory.js and builder.js.
  Nothing reads any of them; they exist so a stylesheet can reach an inline-styled element.
- Campaigns (batch 2, `app/js/campaigns.js`, `app/js/gm_campaign.js`) keep three device keys:
  `en_join_v1` (an invite token waiting for an answer), `en_campaigns_v1` (per account: its campaigns,
  roles, and which row sits in which) and `en_campaign_pick_v1` (the campaign picker). A record's
  campaign is the `characters.campaign_id` column, never in the record. Whoever runs a campaign can read
  its members' rows, so any read of `characters` for "my characters" must filter on `owner_id`, as
  `pull()` in cloud.js does. `store.setViewing` holds another player's sheet in memory with
  `meta.viewing` set; `store.update` refuses every write while one is open.
- A campaign's Advancement Type (10 Nov 2026, `campaigns.advancement`: `xp`, `milestone` or empty) decides its sheets' type, and nothing ever writes a sheet's own `useXp` because of a campaign.
  Never read `ch.useXp` for what a sheet is on: ask `EN.campaigns.usesXp(ch)` (or `advancementOf(ch)` for the campaign's word, `lockedBy(ch)` for "Set by your Admin for <name>"). It keys on `ch.meta.id`:
  a record on this device by `recordCampaign`, a copy of someone else's (`view_<row id>`) by the crew that was read or by View sheet. `set_advancement` is the only write, and it sends the letters in the same step.
  The player's app reads its campaigns again whenever mail arrives (`onInboxEvent` in cloud.js), which is what makes an open sheet switch. `EN.gmEngine.advancePicture()` is who is on which, for the heads-up
  (`EN.gmCampaign.headsUp`), and the `advance` op in gmstore.js is the heads-up's switch for a crew with no campaign: local only, `sendCrew` refuses it.
  Payroll's Milestone is part of the payday form (`msKey`, `msKind`, `msReason`, `msAmount`, with `noPay`), written by `numsFor` in the one write a sheet gets. The AWARD MILESTONE button is gone, but
  `msGroups`, `lastAward`, `canUndoAward` and `undoAward` still read and undo the awards it left in ledgers (writes tagged `source: "milestone"`). Tests that need that shape seed it with `writeCrew` and the old tag.
- Two tabs share one roster (`store.js`, TWO TABS, ONE ROSTER). Change a record through the store's own calls: a stamp has to move forward (`nextStamp`), or another tab reads the copy as old news. Take a record out only through
  `remove`, which writes the delete down (`en_roster_gone_v1`), or the other tab puts it back. Anything that brings an id back on purpose has to `clearGone` it. `cloud.js` trusts the link book only after `hearTabs()`, and reads the book first.
- The Admin desktop's document (`gmstore.js`). `EN.gmStore.get()` is the desktop this tab is on, `EN.campaigns.desktop()` says which, and `follow()` gets it there on every render. Change it through `update`, `put` and `drop`, because a part changed any
  other way isn't stamped and reads as old news (TWO TABS, ONE DESKTOP). An editor that saves a whole copy of a record holds it: `hold`, `put` with `{held: true}`, `heldMoved` (AN EDITOR'S OPEN COPY). A new view's working state goes through `perDesk`, or it follows
  the Admin to another campaign. To write to a document that isn't open, stamp the part in its `rev`, as `moveDevice` does. `EN.campaigns.current()` still answers null offline, which is about the crew; `desktop()` doesn't, which is about the Table.
- SYNC is the only way a desktop crosses browsers (10 Nov 2026, THE SYNC BUTTON in `gmstore.js`), and it only adds: never make it replace, remove or merge a record both sides hold, and don't reach for `farJoin` there, which is for two copies on one browser.
  `EN.gmStore.sync()` reads, adds, then saves (`syncIn`, `syncOut`), through `EN.campaigns.deskRead` and `deskSave` and the `campaign_desks` table. A new bag syncs by itself. Anything new that names a character by its local id has to travel as `row:<row id>`, as a crew row and a write onto this browser's own sheet do (`rowOut`, `recOut`, and back through `rowIn`, `recIn`).
  One fight must never be awarded twice, and two things hold that (12 Nov 2026): `over`, a part of the document, lists the rows of every fight ended on a desktop, so none of them comes back onto its Table; and `encounter.ended` is the time another Admin gave a fight that is still up here, which `snapshotFight` uses, since an award names its fight by that time.
  A new part of the whole document has to go in `LATER_PARTS` (`hear`), or a tab left open from before the update empties it: such a tab saves the document without the field, under the stamp it heard.
  A ledger record travels only if `syncCarries` says so, and a write arrives `imported`. A copy is read ONCE: each save carries a `tag`, and the document's `synced` part holds the tags of the copies this desktop already has in it, its own noted before the save goes, plus `at`, when it last pressed. Don't drop it from `partsOf`, and don't go back to reading every copy at every press: two saved copies then keep each other's records alive for ever.
  What was deleted here since the last press isn't taken back at this one (`goneSince`, which reads the delete notes in `rev`). Everything arriving goes through `syncClean` first, which strips `<` and `>` as `neuter` does for a sheet copy: a copy is somebody else's data in a page with a session in it. Keep new record fields out of `innerHTML` all the same.
- The Admin's Table: `EN.campaigns.current()` is the campaign the desktop works on, `EN.campaigns.crew(id)` its characters (a 30 second cache, never in
  the roster). A Table row with the `charId` `row:<row id>` is another player's character: `pruneCrew` keeps it, `writeCrew` sends it through the inbox, and anything reading
  crew rows has to expect it. `EN.gmEngine.crew()` is still the one reader, and `EN.gmEngine.sheetOf(charId)` reads a member's sheet wherever it is. `{device:true}` is Heat's alone: the numbers
  stay the whole crew's and `members` holds only sheets on this device. Don't widen an empty list to the roster when `far` or `inCampaign` is set: that pays somebody's bank.
- The far door: `EN.gmStore.writeCrew` on a `row:` character files the usual ledger record with a `far` tag and returns at once, and `flushSends` sends the row. The ledger is the outbox. The
  record's id is the row's `send_key`, so sending again is always safe. A row with `ops` has its own two statuses, `due` and `applied`, so a tab older than it can't file it as plain mail and lose the
  numbers, and it can't be recalled. UNDO sends a correcting row. A ledger belongs to a campaign's desktop, so `flushSends` reads every desktop on the device and writes a record
  back where it's kept (`farSave`, EVERY DESKTOP'S OUTBOX). UNDO is `take_back` in the database, never a guess in the app, two copies of a far record
  meet through `farJoin`, an answer reaches every copy (`farSpread`), each call says whose it is (`p_sender`), and each names
  the campaign of the desktop it was made on (`p_desk`, from `far.desk`, A CAMPAIGN'S DESKTOP ENDS WITH IT), so the database says when that campaign has ended. Read THE FAR DOOR in gmstore.js and the `ops` part of THE INBOX in cloud.js first.
- #POST from the Admin (batch 3) adds `character_inbox`, the courier. The same warning applies: a sender can
  read what they sent, so any read of it for "my mail" must ask by the account's own character ids, as
  `readRows()` in cloud.js does. A row becomes a message only through `EN.gmStore.deliverMail`, which writes
  the row's id to `meta.inboxApplied` in the same write. That list is never pruned: a row it forgot would
  come back as a second copy. Mail changes something the sync never had to think about: a device nobody is
  using can now have something to push. So a row is filed only straight after a pull that worked, only on a
  copy with nothing else to send, and never by a hidden tab. While a record's stamp is the one a filing left
  (`filing` in the link book), its push lands only on the row as this device last saw it, and a pull takes the
  row's copy whatever the clocks say. Read the INBOX comment in cloud.js before touching any of it: each rule
  there lost real work in some build. One more device key: `en_inbox_taken_v1`, the Take it reports still
  waiting to go. In a tab merge a wallet and a tally add up, and `meta.inboxApplied` is both tabs' (`tabBoth` in store.js), so a merge can't part a row's numbers from its id.
- Held content lives in ONE place: `app/data/launch.js` (`EN.launch`, since 2026-10-16). It
  has three switches, `holds.lineup` (held lineages, subclasses, Talents, Backgrounds),
  `holds.availability` (rarity) and `holds.toolkit` (gear the Player's Handbook doesn't print:
  an allow-list made of the author's Handbook gear list, `phb-gear-items-2026-10-16.txt`, plus
  the class gear and the vehicle chassis; every other catalog row is held), and each flips back
  in one line. Gate at the listing layer only: pickers,
  the market, Blueprints, the install pickers and the Codex read `offer()`, `isHeld()`,
  `isToolkit()` and `showAvailability()`. Never filter or splice EN.species, the subclass
  arrays, EN.talents, EN.backgrounds or the gear catalogs, because a saved character resolves
  against them. inventory.js gates Toolkit gear and the Availability display through it too.
- Give parallel agents their own preview origin. Sharing one corrupts the roster.
- Locally, my loaded character is expendable. On the live site, use the "Test" campaign and a
  throwaway sheet, and restore everything.

## How this codebase expects you to work

Five things earned the hard way, and the reason the log is worth reading:

- **Reproduce a defect before fixing it, and re-check against that same repro after.**
  Several "fixes" in the history turned out to be fixes for a defect that was not there.
- **Drive the real UI, not just the engine.** Logic-only readings have been wrong twice.
- **Prove a change is a no-op where it claims to be**, by fingerprinting whole records
  with a seeded RNG before and after, rather than asserting it.
- **State things in the record; do not infer them from shape.** Whether a key is already
  converted, which hazard is applied, which rig is live: every one of these was a bug
  until it was written down explicitly.
- **Unattributable state is dropped, never moved.** Losing a number the player can see is
  recoverable; silently relocating it onto the wrong object is not.

## Before you rename anything

Read this before the work, not in review. A rename shipped on 2026-09-19 would have deleted
a lineage feature from every character who had picked it, and the warning against doing
exactly that was sitting three lines above the resolver it protected. It did not fire,
because the handoff that ruled the rename said "search the whole repo and update every
reference", and a player's picks are in their browser, not in the repo. That instruction is
retired: it sounds exhaustive and is incapable of surfacing the thing that matters.

Four questions, in order. The third is the one that gets skipped.

1. **What is the definition?** Rename the catalog entry itself.
2. **What in the repo points at it by name?** Grep the whole repo, not just the catalog.
   Name references live in kits, examples, briefs, ability tags, the rules index and the
   bestiary, and each is a separate file from the thing being renamed.
3. **Can a saved record contain this string, and is it RESOLVED on load or does it carry
   its own text?** Grep cannot answer this, which is why it has to be asked out loud. The
   three kinds:
   - **Stored by reference.** The record holds a name that gets looked up, and every
     reader drops a miss. These fail silently and destructively: the pick does not render
     wrong, it vanishes, and nothing looks broken because there is simply less on the
     sheet. **Always needs a migration row.** Examples: a lineage feature
     (`x.name === fname`, pushes only on a match), a catalog weapon (`findWeapon(e.name)`
     returns early), the GM store's `grade` key.
   - **Stored by value.** The record holds the name and its payload together, so a stale
     name renders its own old text correctly. A miss is a stale label, not a loss. Usually
     leave it, and **say so out loud** so the next reader knows it was considered. Example:
     a banked threat's abilities array, which is why `Painted Shot` can still sit in a
     GM's saved encounter and that is fine.
   - **Derived, never stored.** Read fresh from the source record every load. Nothing to
     migrate, and a row would be noise. Example: a species secondary trait.
4. **Does a comment anywhere assert the old state?** The 2026-09-18 comment above the
   lineage resolver was correct when written and false twelve hours later. If a rename
   changes what a nearby comment claims, **the comment is part of the rename.** A stale
   warning is worse than no warning: the next reader either trusts it and over-corrects,
   or catches it out and stops trusting the comments around it.

The migration tables live beside their data, not in `store.js`: `EN.weaponParts.renames`,
`EN.cyberware.renames`, `EN.speciesFeatureRenames`, `EN.gearCatalog.weaponRenames`. Adding
a rename should be a row in one of those plus a line in `migrate()`, never a second place
to remember. One exception: `TALENT_RENAMES` is inline in `store.js`, and since 2026-10-16
it carries `crowd-reader` / `Crowd Reader` to `cold-reader`. The Codebreaker's Quick Scan
(was Cold Read) needs no row: the Codebreaker knows every exploit, so the name is derived
and never stored.

## Manuscript source of truth

Live Google Docs: the Player's Handbook, Parts 1 to 3, and Part 4, the Game Master's Toolkit
(a draft). The app is synced against these, never against a local copy.

| Part | Doc id |
| ----- | ----- |
| 1, Welcome and Building a Character | `10x_s1WJ-gWsFxKViuGQvlB1Ddz3MyA-FBAPaMQjsNpQ` |
| 2, Core Rules, Combat, Survival and Specialized Systems | `1P74ExjneDDSUvEXQpVuDYvAvNz_w3rOVzVGVg7w-XHM` |
| 3, Equipment | `1ehY_1lcqpugD1bdcpBTvq32c7SpxdYj0m5h7ClYPKgM` |

The Handbook and the Toolkit are in the same Drive folder.

**Probe, do not spill.** Search inside the document and bring back answers; returning a whole
Part costs a great deal of context. **Use the markdown export, not txt:** plain text strips
bold and heading levels, which has produced false negatives here.

**Freshness is a hard gate.** Compare each doc's modified time against any local copy
before auditing. Auditing against a stale spill once produced a report claiming a live
trait had been invented, and six commits were reverted.
