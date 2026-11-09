# Session handoff

Paste the block below into a fresh session to resume work. Written 2026-08-10, after
Environmental Hazards, the Status Changes panel and Armor Repair all merged to `main`.

---

Continuing work on the Elysium Nights Character Sheet
(`C:\Users\Popsc\OneDrive\Documents\Elysium Nights Character Sheet`). This is a LOCAL
session on my PC, so you can run a dev server and drive the real app.

**Do this first: `git pull`.** The last session ran in a cloud container and pushed a lot.
Your local clone is many commits behind, and the three feature branches it used
(`env-hazards-wip`, `armor-repair-wip`, `claude/elysium-nights-continuation-fg8qbb`) are
merged and deleted. Everything is on `main`, which is deployed to elysiumnightsrpg.com.

## Read these first, in this order

1. `DEFERRED-FIXES.md`: the running log, and the most important file in the repo. It
   carries the invariants this codebase paid for one at a time, each learned by getting
   it wrong. Do not relitigate them. It is long; read the section headings first and go
   deep only where you are about to touch.

   Two things about how to read it. It is an archaeological record, not a to-do list:
   entries are struck and annotated in place rather than deleted, so the reasoning
   survives. The "Live findings" section opens with a reconciliation naming exactly which
   of the thirteen L-numbered findings are still open, and that is the list to trust. And
   every `file.js:NNN` line reference in it is STALE, written before three branches merged
   into `main`; treat them as a hint about which file and find the site by the quoted
   code, which is still accurate.
2. `review-findings/README.md`: archived adversarial-review output, with an honest table
   of what has and has not been read.

## State

`main` is deployed and healthy, and there are no branches. Everything below shipped and
was verified on the live site: Environmental Hazards, the Status Changes panel, Armor
Repair with Shield Durability converted beside it, the `Zeroed In` rename, Pneumatic
Bypass wired into the unarmed engine, and a `migrate()` hardening pass.

## Open work, roughly in the order I would take it

1. **Two unread review files, and they cover shipped code.** `review-findings/wx7cb0612.json`
   was never opened, and only lens 0 of `review-findings/wmudlussk.json` was read in full.
   Both are Armor Repair, which is now live. Parse with `PYTHONIOENCODING=utf-8`; findings
   live under `result.verdicts`, an array of strings, one per lens.
2. **L1, the most player-visible open defect and it needs no import.** One Talent picked
   in two Universal Upgrade slots double-counts its unarmed step: pick Street Scrapper in
   slots 2 and 4 and a bare fist punches `1d6`. `uuTalentsOwned` already exists in
   `app/js/builder.js`, so the filter is one expression away. Full write-up in
   `DEFERRED-FIXES.md`.
3. **The action-type classifier cannot see bolded action types.** A plain-text regex
   matching `as an Action` (three copies: `app/js/combat.js`, `app/js/printsheet.js`,
   `app/js/pdfexport.js`) means a feature written `As an **Action**` falls through and
   renders PASSIVE on the sheet, the print sheet and the PDF. `DEFERRED-FIXES.md` names
   `Rig Fuel`, `Biological Meltdown` and `Chemical Warfare` as mis-tagged, but measure
   before you fix: there are **11 bolded occurrences across four class data files**, and
   widening the regex touches every one. Some of those features state their action type
   unbolded elsewhere in the same text and already classify correctly, so the blast radius
   is larger than the three. That is exactly why this wants a deliberate decision rather
   than a quiet patch.
4. **L2 through L7 and L13**, plus the 14 PART C rulings. All in `DEFERRED-FIXES.md`.
5. **Thermal Regulation Weave's Resistance** is neither applied nor displayed inside the
   hazard. Blocked on there being no damage pipeline to reduce, so it is a build, not a
   patch.

## Conventions

- Commit as you go. When you reach a stopping point, STOP, summarize what you want to
  push at a high level, and ask me whether I want to review or add anything first. Give
  me a phrase to type back that authorizes the push. Never push without it.
- Zero em dashes and en dashes anywhere. `LC_ALL=C.UTF-8 grep -rnP "[\x{2013}\x{2014}]"`
  must be clean before every commit, excluding `app/vendor` (third party).
- Also check for stray control characters: `grep -rlP "[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]"`,
  same exclusions. A literal backspace once hid inside a regex for a whole session and
  silently disabled the `?dev` bypass; `cat -A` is the only thing that finds it.
- Load the app with `?dev` to skip the login card, and add a cache-buster
  (`?dev&cb=x`). Open `app/index.html` directly, not the repo-root `index.html`, which is
  a redirect stub that races a meta refresh against a JS redirect. There are no codes any more
  (campaigns batch 1, 8 Nov 2- The login card (`app/js/gate.js`, since campaigns batch 1 on 8 Nov 2026) offers Jack in with
  Discord and Run offline. Either button lands on the Freelancer desktop; a load that skips the card
  answers with no profile, so the app opens on the remembered desktop (`en_portal_v1`). The
  card shows until the device has a stored Discord session or picked Run offline (`en_login_v1`);
  the old `en_gate_ok_v1` and `en_gate_admin_ok_v1` are ignored. `?dev` skips it (and records the
  offline pick), `?dev&portal=admin` lands on Admin, `?login` forces the card and clears nothing.
  Gizmo greets a device once (`en_gizmo_hello_v1`). gate.js must stay: `js/tour.js` draws Gizmo
  from `EN.gate.gizmoSvg`, and `clipSvg()` is finished art that comes through byte for byte. The
  test suite's harness seeds a stored session unless a test says `@no-pack`, so a test of the card
  needs that marker.
card.
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
  Presets are listed in `app/data/wallpapers.js`, in two kinds: a photograph names a `file` and a
  `thumb` in `app/img/wallpapers`, and a tile carries `tile`, a `size` and its whole art inline as
  an SVG data URL in `svg`, with no file at all. None of it rides a character or an export.
- Skins are CSS, plus a few HOOKS in the modules: `.mkt-*` and `.inv-sub[data-sub]` in
  inventory.js for the '98 Explorer, `data-sub` and `data-tab` on every tab (each TABS entry's
  `sub` and `key`) for #GRIDroid's app-list subtitles and for reaching one named tab without
  counting children, and `html.rail-open`, which app.js toggles when the open tab is
  tapped again on #GRIDroid only (so that skin can fold and unfold its app list; every other skin
  keeps re-tapping #PRINT as the shortcut to Advance). One more belongs to '98: `#win-addr`, the
  Explorer address field in index.html, written by `paintAddr()` in app.js on every render. The
  element is `display:none` on the other skins, so the write is a harmless no-op there.
- #GRIDroid's layout collapse reaches most elements through attribute-substring selectors on the
  inline styles the modules write, so it needs few hooks: `.chrome-frame`, `.chrome-stats` and
  `.inv-bar` in inventory.js, `.panel-hr` on the panel header-right wrapper in ui.js, and
  `.row-label` on the fixed-width label spans in flow.js, grid.js, inventory.js and builder.js.
  Nothing reads any of them; they exist so a stylesheet can reach an inline-styled element.
- Campaigns (batch 2, `app/js/campaigns.js`, `app/js/gm_campaign.js`) keep three device keys:
  `en_join_v1` (an invite token waiting for an answer), `en_campaigns_v1` (per account: its campaigns,
  roles, and which row sits in which) and `en_campaign_pick_v1` (the Campaign tab's picker). A record's
  campaign is the `characters.campaign_id` column, never in the record. Whoever runs a campaign can read
  its members' rows, so any read of `characters` for "my characters" must filter on `owner_id`, as
  `pull()` in cloud.js does. `store.setViewing` holds another player's sheet in memory with
  `meta.viewing` set; `store.update` refuses every write while one is open.
- Two tabs share one roster (`store.js`, TWO TABS, ONE ROSTER). Change a record through the store's own calls: a stamp has to move forward (`nextStamp`), or another tab reads the copy as old news. Take a record out only through
  `remove`, which writes the delete down (`en_roster_gone_v1`), or the other tab puts it back. Anything that brings an id back on purpose has to `clearGone` it. `cloud.js` trusts the link book only after `hearTabs()`, and reads the book first.
- The Admin desktop's document (`gmstore.js`). `EN.gmStore.get()` is the desktop this tab is on, `EN.campaigns.desktop()` says which, and `follow()` gets it there on every render. Change it through `update`, `put` and `drop`, because a part changed any
  other way isn't stamped and reads as old news (TWO TABS, ONE DESKTOP). An editor that saves a whole copy of a record holds it: `hold`, `put` with `{held: true}`, `heldMoved` (AN EDITOR'S OPEN COPY). A new view's working state goes through `perDesk`, or it follows
  the Admin to another campaign. To write to a document that isn't open, stamp the part in its `rev`, as `moveDevice` does. `EN.campaigns.current()` still answers null offline, which is about the crew; `desktop()` doesn't, which is about the Table.
- The Admin's Table: `EN.campaigns.current()` is the campaign the desktop works on, `EN.campaigns.crew(id)` its characters (a 30 second cache, never in
  the roster). A Table row with the `charId` `row:<row id>` is another player's character: `pruneCrew` keeps it, `writeCrew` sends it through the inbox, and anything reading
  crew rows has to expect it. `EN.gmEngine.crew()` is still the one reader, and `EN.gmEngine.sheetOf(charId)` reads a member's sheet wherever it is. `{device:true}` is Heat's alone: the numbers
  stay the whole crew's and `members` holds only sheets on this device. Don't widen an empty list to the roster when `far` or `inCampaign` is set: that pays somebody's bank.
- The far door: `EN.gmStore.writeCrew` on a `row:` character files the usual ledger record with a `far` tag and returns at once, and `flushSends` sends the row. The ledger is the outbox. The
  record's id is the row's `send_key`, so sending again is always safe. A row with `ops` has its own two statuses, `due` and `applied`, so a tab older than it can't file it as plain mail and lose the
  numbers, and it can't be recalled. UNDO sends a correcting row. A ledger belongs to a campaign's desktop, so `flushSends` reads every desktop on the device and writes a record
  back where it's kept (`farSave`, EVERY DESKTOP'S OUTBOX). UNDO is `take_back` in the database, never a guess in the app, two copies of a far record
  meet through `farJoin`, an answer reaches every copy (`farSpread`), each call says whose it is (`p_sender`), and a desktop
  of a campaign this account no longer runs is skipped (`farRuns`, A CAMPAIGN'S DESKTOP ENDS WITH IT). Read THE FAR DOOR in gmstore.js and the `ops` part of THE INBOX in cloud.js first.
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
- My loaded character is expendable. Do not spend effort preserving it.

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

Three live Google Docs. The app is synced against these, never against a local copy.

| Part | Doc id |
| ----- | ----- |
| 1, Welcome and Building a Character | `10x_s1WJ-gWsFxKViuGQvlB1Ddz3MyA-FBAPaMQjsNpQ` |
| 2, Core Rules, Combat, Survival and Specialized Systems | `1P74ExjneDDSUvEXQpVuDYvAvNz_w3rOVzVGVg7w-XHM` |
| 3, Equipment | `1ehY_1lcqpugD1bdcpBTvq32c7SpxdYj0m5h7ClYPKgM` |

Read one at `https://docs.google.com/document/d/<id>/edit`, or pull raw text from
`https://docs.google.com/document/d/<id>/export?format=markdown`.

**Use the markdown export, not txt.** Plain text strips bold and heading levels, which
produced false negatives here: a probe for a bolded trait name found nothing and looked
like the edit had never landed.

**How to spill without burning context.** Navigate real Chrome to
`https://docs.google.com/robots.txt`, a lightweight same-origin page, then fetch the
export endpoint from there. Do NOT pass `credentials: "include"`; on a same-origin
request it makes the fetch fail. The Docs editor itself freezes the renderer and its
CSP blocks the fetch, so do not load the document.

**Freshness is a hard gate.** Compare each doc's modified time against any local copy
before auditing. Auditing against a stale spill once produced a report claiming a live
trait had been invented, and six commits were reverted.

Parts 2 and 3 have never been spilled in full: Chrome refuses downloads from
`docs.google.com` on this machine. Targeted extracts of the changed passages are the
working substitute. Allowing automatic downloads for that origin would fix it.
