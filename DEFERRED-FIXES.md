# Deferred fixes: 2026-08-09 manuscript sync

Running log of errors, corrections and open questions found while working the
six-step sync. **Nothing here gets fixed until steps 1 to 6 are done.** Add to it
as each step turns things up; work it after step 6.

Sync steps: 1 unarmed rewrite (done, `2ede818`), 2 renames and gear values (done,
`70f66b8`), 3 Triage Save DC and Stitcher class data (done, `28c17b2`), 4 Trauma Rig
(done, `7e48e67`), 5 Armor Repair, 6 Environmental Hazards.

**Every review finding from steps 1, 2 and 4 has now been read and re-verified against
`7e48e67`.** The consolidated list is the section "All review findings, read and
merged" near the bottom. The bullets that used to say "unread" are gone; read that
section instead.

---

## Needs an author ruling (blocked on Brandon, not on code)

- **`Zeroed In` versus `Dead-Eye Sniper`.** The handoff's printed order for Combat &
  Weapon Mastery ends with `Zeroed In` and omits `Dead-Eye Sniper`, which currently
  occupies position 6. `Zeroed In` does not exist anywhere in the app. That reads as
  an unlisted rename, but the same handoff says the Deadeye naming is deliberately
  unresolved. **That category is currently unreordered.** Is `Dead-Eye Sniper`
  becoming `Zeroed In`?
- **Pneumatic Bypass has nowhere to live.** Classified as a +1 unarmed increaser, but
  it is a Ripper Hot-Wire a Stitcher installs on an *ally*, and the character record
  has no field for "an ally augmented me." Recorded as a comment in `engine.js`,
  implemented as nothing. Needs a manual toggle on the sheet if it should be live.
- **Juggernaut step-up on a wielded body.** The Walking Anvil steps improvised
  weapons up one die, and a wielded body is explicitly a Heavy improvised weapon.
  Not applied, since that text lives in a separate block.
- **Should the damage tray learn flat-only totals?** The base unarmed strike is a
  flat 1 plus Body Modifier, and the tray is dice-driven, so the base strike opens no
  tray. Riders are also not preloaded into it; Shock Gloves is the one unconditional
  rider that could be.
- **14 PART C rulings** still outstanding from earlier sessions.

## Confirmed defects, unfixed

- **Pneumatic Bypass prose is a fifth stale unarmed string, in THREE places not two.**
  `app/data/class_stitcher_resources.js` (two copies) still reads "Their unarmed
  strikes deal 1d6 Bludgeoning damage", which is replacer wording, while
  `engine.js` classifies it as an increase. The third copy is
  `app/data/briefs.js:179`, "Ally's unarmed strikes deal 1d6 Bludgeoning", found on
  re-verification. Same class as the four fixed in `70f66b8`; left alone only because
  it was not on the handoff's list.
- ~~**One pre-existing weapon-proficiency orphan**, a Signature Weapon.~~ **Struck:
  fixed in `28c17b2`.** `app/data/class_stitcher_resources.js:123-126` now reads
  `weapons: ["Simple Weapons", "Sidearms"]` with a comment explaining that a Dart Gun
  sits under Sidearms and a Chem Spewer needs Heavy Weapons the class never had. A
  runtime sweep of every class and subclass `startingProficiencies.weapons` against
  the eight categories in `EN.rules.gear.weapons` returns an empty orphan list.
- **All review findings from steps 1, 2 and 4 are now read.** See "All review
  findings, read and merged" below. The three task files are
  `tasks/wgxtatdtw.output` (unarmed rewrite), `tasks/w2e5slhtt.output` (renames and
  gear values) and `tasks/wvcpodf55.output` (entry-key refactor); nothing in them is
  outstanding that is not restated there in full, so the files themselves no longer
  need reading.

## Unverified rendering paths (logic verified, screen not seen)

- **Codex Improvised Damage step-up** for a Juggernaut. The panel is collapsed by
  default and could not be opened programmatically. Ladder math and no-throw
  confirmed; the stepped dice were never seen rendered.

## Handoff items that turned out to be no-ops in the app

Recorded so nobody re-investigates them.

- **The Signature Weapons proficiency row never existed here.**
  `EN.rules.gear.weapons` already held exactly the eight categories, and all three
  `GROUP_CAT` maps already matched.
- **`Insulation Bypass` does not exist in the app**, so its rewording has no site.
- **Advanced Medkit Edge lines have no app site.** No Treat Wounds mechanic entry and
  no Treat Fatigue severity table; the medkit items already carry the new semantics.
- **`Resonant Fatigue` had one app site, not two.** The second lives in the legacy
  single-file prototype, which is gitignored and superseded by `app/`.
- **The `Not on My Watch` death-rules cross-reference has no app site.** The app
  carries no death chapter naming the capstone.

## Author review wanted on data I generated

- **`TALENT_UNARMED_STEP`, `CYBER_UNARMED`, `GEAR_UNARMED_STEP` and
  `GEAR_UNARMED_RIDER` in `engine.js`.** These encode which talents, chrome and gear
  set or step unarmed damage, at which tier. Scope went past what was specified, so
  the classifications deserve a read.

## Latent issue found in step 3

- **The action-type classifier cannot see bolded action types.** It is a plain-text
  regex (`app/js/combat.js` around line 1230, duplicated in `app/js/printsheet.js`
  and `app/js/pdfexport.js`) matching `as an Action`, so any feature written
  `As an **Action**` falls through and renders as PASSIVE on the sheet, the print
  sheet and the PDF. Step 3 tripped this twice and was fixed by unbolding those two
  strings, which is the convention that already worked. But `Rig Fuel`,
  `Biological Meltdown` and `Chemical Warfare` are mis-tagged PASSIVE for the same
  reason, and that predates this sync. Widening the regex to tolerate `**` would fix
  all of them at once, but it reclassifies features beyond the sync's scope, so it
  was left alone. Worth doing deliberately later.
- **`Field Triage` moved from Features to Abilities** because the Beacon Rig toggle
  introduced "Free Action" into its text. Correct for a feature that now has an
  active toggle, but it is a visible relocation.
- ~~**"Triage Rig" versus "Trauma Rig" naming.**~~ **Settled in step 4: the item is
  the Trauma Rig everywhere.** All nine prose sites were renamed; nothing in `EN`
  says "Triage Rig" any more. "Triage" as the class RESOURCE, the Triage Save DC,
  the Triage Protocols, the Triage Pool, the Triage Sweep Protocol, Field Triage,
  and Expanded Triage all keep their name.
- **"The modifier this Talent raised" is not derivable.** Talent attribute increases
  are not modeled at all, so the app never learns whether the player raised Wits or
  Tech on Trauma Medic. The text carries a parenthetical instead. Deriving it needs a
  new stored choice on the talent.
- **Cyber-Scrap capacity is prose only.** Nothing computes it, so the Chop Rig
  doubling to twice Tech Modifier is text with no engine path behind it.

## Found in step 4 (Trauma Rig)

- ~~**The #GRID Rig selector prints "undefined HP".**~~ **Fixed while working the three
  step-4 defects below.** `app/js/grid.js` read `s.hp` / `b.hp` where the data field is
  `integrity`, so every Smartdeck and B&E Buddy option read "undefined HP". Now reads
  `s.integrity` / `b.integrity`; an Apex Smartdeck renders "Apex · +3 dev · 55 HP".
- **Remote Applicator is displayed, not applied.** The Trauma Grade [2] trait adds +3
  spaces to any Protocol with a listed range, but Protocol ranges live inside prose
  strings ("within 6 spaces") in `STITCHER_TRIAGE_PROTOCOLS`. Deriving the stepped
  range needs structured range data on each Protocol, which does not exist yet. The
  trait renders as a chip with its full text; nothing computes the +3.
- **The once-per-scene rig traits have no use counter.** Redundant Injector [3] and
  Autonomous Loop [5] are both "once per scene" and render as trait chips only. The
  featureUses tracker keys off feature names, not rig traits.
- **Rig Mod Slots have nothing to put in them.** Mod Slots equal the Tier and are
  derived and displayed, but the manuscript supplied no Trauma Rig modification list,
  so there is no counterpart to `EN.grid.mods` and no Tech Bay install path. The slot
  count is currently a number with no inventory behind it.
- **Kit Edge Dice still stack per owned kit.** `EN.crafting.edgePointsFor` pushes one
  Edge part per active kit, so two Advanced Medkits in the stash grant +2 Edge Dice on
  a Medtech pool. Now genuinely contained for Trauma Rigs: only the one ENTRY the engine
  resolved counts as a medkit, so a shelf of old tiers grants nothing and neither does a
  second rig of the live tier. (The containment claimed here originally was only
  tier-deep, and two rigs of one tier did double up; that is fixed.) The general case
  for real kits is untouched and predates this step.
- **A new Stitcher still owns no Trauma Rig row.** The free Field Kit [0] is
  deliberately NOT in `EN.kits.classKits.stitcher.fixed`, exactly like the
  Codebreaker's free Standard Smartdeck, so it does not eat the 700 Glimmer budget.
  The engine's fallback resolves to Output Bonus +0 either way, which is the Field
  Kit's own value, so the DC is right; the character just has no gear row to equip
  until they buy one. If class-granted gear should ever appear in the stash, both
  classes need the same treatment.
- **The Trauma Rig's Load is not printed anywhere.** The manuscript's table has no
  Load column, so the rows take the `rigs` bucket default of 2, matching a Smartdeck
  and a Basic Medkit. Worth an author ruling if a worn gauntlet should cost less.

## Confirmed in step 4, reproduced live, NOW FIXED

All three came out of the Trauma Rig review with live reproductions. All three were
reproduced again before being touched, fixed, and re-checked against the original
repro. Nothing in this section is outstanding. The default path stayed verified: all
six tiers give the right Output Bonus and Triage Save DC, Mod Slots equal the Tier,
traits accumulate 1 through 6, and a Trauma Grade rig still feeds a Medtech pool as an
Advanced Medkit (Edge 6) while a Clinic Grade feeds it as Basic (Edge 5).

Re-verified after the entry-keyed refactor: all six tiers still read Output Bonus
+0/+1/+1/+2/+2/+3, Triage Save DC 8/9/9/10/10/11 at Tech +0, Mod Slots equal to the
Tier, traits 1 through 6, Integrity 15/20/25/30/35/40, nodes Standard through Apex, and
the Medical Baseline grade flipping to Advanced at Trauma Grade [2]. A Trauma Grade rig
grants one more Medtech Edge Die than a Clinic Grade, as an Advanced Medkit over a Basic.

- ~~**The two Medical Baseline surfaces disagree about ownership.**~~ **Fixed.** There
  is now exactly one resolver, `EN.engine.rigStats(ch)`, and it refuses to honour a
  recorded pick the character does not own (`ch.rig.tier` then, `ch.rig.key` now): an
  unowned recording falls through
  to the AUTO owned-gear path. The second gate is gone, not reconciled. `activeRigTier`
  in `app/js/inventory.js` was DELETED and `tbKits` reads the resolver's answer instead
  of matching against the stash itself (`.rigTier` then, `.rigKey` now, which also
  stopped it counting one live rig twice). The repro Stitcher (recorded Trauma Grade, sold it, holds only a Field Kit)
  now reads Field Kit [0] / COUNTS AS BASIC MEDKIT / OUTPUT +0 on the Actions panel and
  "Basic Medkit (Field Kit Trauma Rig [0])" on the Fabrication bench, and the Field Kit
  she does own is no longer filtered out.
- ~~**Rig integrity and the #GRID node are Stitcher-only.**~~ **Fixed by splitting the
  item from the class resource.** `rigStats(ch)` derives the OBJECT for every class and
  lands on the derived record as `d.rig`: tier, Output Bonus, Mod Slots, the trait
  ladder, Medical Baseline grade, Integrity, and the projected #GRID node.
  `triageStats(ch, attributes, rig)` spreads all of that in and adds only what is
  Stitcher-only (`techMod`, `saveDC`, `formula`, `snagOnTriage`, `swiftBecomesAction`),
  so `d.triage` keeps its exact old shape and still means the class resource. The
  Freelancer tab's rig block renders off `d.rig` and now renders for a non-Stitcher who
  owns a rig, with no Triage Save DC and no Scrap Rig option. `app/js/grid.js` also
  carries a Trauma Rig Node block off `d.rig`, so the rig is reachable from the #GRID
  tab as the node it projects (it is deliberately NOT offered in the deck picker: a
  Trauma Rig is not a hacking platform). Repro Hustler with a Black Clinic now shows
  OUTPUT +3, MOD SLOTS 5 / TIER 5, COUNTS AS ADVANCED MEDKIT, #GRID NODE APEX [5], all
  six traits, and a working 40/40 integrity track.
- ~~**A fresh rig can arrive BRICKED.**~~ **Fixed by making stored damage know which rig
  it belongs to.** *Superseded: `hpTier` was a tier name, which masked stale damage
  instead of discarding it and gave every rig one shared slot. Damage is now keyed on the
  equipment entry (`ch.rig.hp`), and `hpTier` no longer exists. See the settled section
  below; the account here is kept for the history.* New field `ch.rig.hpTier` records the
  tier the damage was taken
  against. The engine discards `hpSpent` outright when the resolved tier differs rather
  than clamping a number that belongs to another object, and both integrity controls
  (Freelancer tab and #GRID tab) stamp `hpTier` and accumulate off the DERIVED spend, so
  a stale total can never rejoin a track. Migration in `app/js/store.js` normalizes the
  field beside the other `ch.rig` defaults: a pre-change save with damage and an
  explicitly recorded tier adopts that tier, and one with damage but no recorded tier
  cannot attribute it and drops it, so nobody inherits damage into a rig they never had.
  Repro (brick a Black Clinic at 40, lose it) now yields a Field Kit at 15/15 with
  DAMAGE enabled.

Still out of scope and untouched: Remote Applicator's +3 spaces is displayed but not
applied, since Protocol ranges are prose; the two once-per-scene rig traits have no
usage tracking.

## Found reviewing the step-4 fixes, ALL NOW FIXED

The review of the three step-4 fixes found six more defects, all variations of two
root causes: **state that should be per-rig is stored globally**, and **resolvers
multiplied instead of collapsing to one**. All six are closed by the entry-keyed
refactor below, and each was confirmed closed rather than assumed. Nothing in this
section is outstanding.

Multiple resolvers deciding which rig is live: there is now exactly **one**,
`EN.engine.rigStats(ch)`, and it answers with an equipment ENTRY key.

- ~~**The Rig picker is a second resolver.**~~ **Fixed.** The picker's selection now
  reads the engine's resolved `d.rig.rigKey`, and each option's value is an entry key.
  Repro before: recorded `Combat Grade`, owns only a Field Kit, engine resolves Field
  Kit, picker sits on index 0 showing "- No Rig -". After: the picker shows
  "Field Kit [0] · +0 output · 0 slots · 15 Int" selected, matching the sheet. Picking
  "- No Rig -" while still owning a rig now reverts to AUTO and the picker honestly
  redisplays the auto rig with the AUTO chip beside it, instead of showing "No Rig"
  while the sheet quietly used one.
- ~~**The crafting bench still owns a row-selection gate**~~ and counted one live rig
  twice. **Fixed.** `tbKits` compares each row's own entry key against the resolved
  `rigKey`. Repro before: two Black Clinics, one live, bench printed
  "Advanced Medkit (Black Clinic Trauma Rig [5]) · BASIC" **twice**. After: once.
- ~~**The bench's ownership predicate differs from the engine's.**~~ **Fixed by
  deleting the bench's predicate for rigs entirely.** A rig row is admitted if and only
  if it is the entry the engine resolved, so there is no second predicate left to
  drift. Non-rig kit rows keep their ordinary `qty > 0` check.
- ~~**A now-dead second resolver function remains in the engine.**~~ **Removed.**
  `ownedRigTier(ch)` (singular) had no callers and is gone. `ownedRigTiers` became
  `ownedRigs(ch)`, which returns `{key, row}` pairs with the same-tier dedupe removed,
  since two rigs of one tier are now two distinct pickable, separately damageable rows.

Damage state, both bullets superseded by the settled ruling below and fixed with it:

- ~~**Stale damage is masked, not discarded, so it re-arms.**~~ **Fixed.** Damage is
  keyed on the entry, and a re-bought rig is a new entry, so there is nothing to re-arm.
- ~~**There is one damage slot for all rigs.**~~ **Fixed.** `ch.rig.hp` is a map from
  entry key to points spent, so every rig owns its own slot, including two of one tier.

## SETTLED, AND NOW IMPLEMENTED: the rig damage contradiction and its fix

Two independent observers ran both candidate sequences through the real UI. They
agree, and so did the two earlier agents: they had run **different sequences**.

- **No intervening damage:** brick a Black Clinic, drop it, re-buy a Black Clinic.
  It arrives `0/40` BRICKED. The damage re-arms.
- **With intervening damage:** same, but damage the Field Kit in between. The
  re-bought Black Clinic arrives `40/40`.

Cause: discarding stale damage is **display-only**. `ch.rig.hpSpent` and
`ch.rig.hpTier` survive the drop untouched, so when the original tier returns the
stored tag matches again and the damage reapplies. Touching the intervening rig's
damage control overwrites the record in place, which is why the other observer saw a
clean rig. Both readings reproduce. `ch.rig.tier` has the same staleness shape: it is
ignored while unowned but never cleared, so re-buying a dropped tier silently
re-locks a pick the player abandoned.

**Ruling: a re-acquired rig always arrives at full integrity.** The app has no
vocabulary for "recovered" (every outflow is unconditional and unrecorded; the only
inflows are a full-price purchase and a bench build), so every re-acquisition is a new
object in the app's own terms. The asymmetry of harm decides it: a wrongly-full rig
costs one DAMAGE click the GM was narrating anyway, while a wrongly-bricked rig
silently strips a Stitcher's class hardware mid-scene with no visible cause. Paying
16,000 Glimmer and receiving a bricked rig is indefensible. GM-ruled recovery stays a
fiction-level event: they type the damage back in.

**The fix, which closes the one-damage-slot defect at the same time.** Equipment
instance identity already exists: rigs are non-stackable, so every purchase gets its
own `eq_` id from `newEquipId()` and a re-bought rig carries a different id from the
dropped one. So key damage to the entry, not the tier:

    ch.rig.hpSpent + ch.rig.hpTier   ->   ch.rig.hp = { <entryKey>: <spent> }
    ch.rig.tier (a tier name)        ->   ch.rig.key (an entry key)

"Re-acquired rigs arrive full" then falls out with no heuristic, and two rigs can be
damaged independently. Five touch points, starting with `ownedRigTiers` becoming
`ownedRigs(ch)` returning `{key, row}` pairs with the same-tier dedupe removed. The
tempting one-liner (clear the damage when the recorded rig leaves the stash) fixes the
re-arm but leaves the tier-keyed slot, so it does nothing for two-rigs-one-slot, and
still breaks for a character holding two rigs of the same tier.

This supersedes the two damage bullets in the section above.

**IMPLEMENTED.** Both failures were reproduced again before anything was touched, then
re-checked against the original repro.

- Repro A, the settled scenario, driven entirely through the real UI (real DAMAGE
  button, real stash DROP, real gray-market BUY). Before: brick a Black Clinic at 40,
  drop it, buy another, and the Freelancer tab reads `BRICKED` with `hpSpent: 40` still
  sitting in storage under `hpTier: "Black Clinic"`. After: the re-bought rig reads
  `40 / 40`, because it is entry `eq_2trd2zy` and the damage was recorded against
  `eq_wmtzne4`.
- Repro B, two rigs sharing one slot. Before: damage a Black Clinic 12, switch to a
  Field Kit and damage it 5, switch back, and the Black Clinic reads `40 / 40` with its
  12 points overwritten. After, with two Black Clinics (the case the tier key could
  never handle): damage #1 by 12 and #2 by 31 and both hold, `hp` reading
  `{eq_x0lisa8: 12, eq_tx09gyp: 31}`. Switching between them, and detouring through the
  Scrap Rig and back, leaves both totals untouched. Swapping rigs no longer zeroes
  damage at all, which was the write that used to mask this.

Migration lives beside the other `ch.rig` defaults in `app/js/store.js`. Twelve old
shapes were run through `importCharacter`, which calls the same `migrate`: an owned
`tier` becomes the owned entry's `key`; an unowned `tier` is dropped; `hpSpent` is
attributed to the entry `hpTier` names when one is owned and dropped when it is not;
`hp` entries whose key has left the equipment list are pruned on every load, so the map
cannot grow across a campaign; and a record with no `ch.rig`, an `hp` already present, a
`rig` that is an array or a string, and junk types in any field all normalize without
throwing.

**Methodology note worth keeping.** One observer's first attempt ran in a long-lived
tab where `EN.traumaRigs` was absent and the catalog held zero rig rows, a stale page
load. Observations taken there would have been worthless. That is a second way two
agents can diverge on the same question, and a reason to force a reload before
believing any browser reading.

## Found reviewing the entry-key refactor, NOT fixed

The refactor's wins are real and verified for equipment that carries ids: two rigs of
one tier hold independent damage, a re-bought rig arrives full, the damage map prunes
so it cannot grow across a campaign, and one resolver answers with an entry key. The
findings below are about the path where that id is MISSING.

**ROOT CAUSE, one line, resurrects three bugs already marked fixed.** `entryKey(e)`
in `app/js/engine.js` returns `e.id || e.name`, so an entry with no id keys on its
NAME. Two predicates disagree about an entry with a MISSING `qty`:

    app/js/store.js  (id assignment)  if (e.id || !(e.qty > 0) || isStackableName(e.name)) skip
    app/js/engine.js (ownership)      if (!e || (e.qty != null && e.qty <= 0)) return

A missing `qty` fails the first (so it never gets an id) and passes the second (so it
counts as owned). The result is a permanently name-keyed live rig, on every load. With
two such rigs: `ownedRigs` returns two rows with the SAME key, the picker renders two
options with the same value so one rig is unaddressable, damage lands in one shared
slot and both rigs read the same integrity, and the Fabrication bench prints its chip
twice. Those are verbatim the "one damage slot" and "bench counts one live rig twice"
repros this file marks closed.

Reachable through `importCharacter` with hand-authored or legacy equipment, not
through the Gray Market purchase path, which does set `qty` and does get an id.

**Likely fix:** make the two predicates agree about a missing `qty`, so anything the
engine treats as owned also gets an id assigned. NOT done here because that changes id
assignment for ALL equipment, not just rigs, and the blast radius needs its own
verification pass rather than being smuggled in.

The other two lenses have now been read. Between them they found one genuinely new
defect (the rig migration runs before equipment ids exist, so it keys the pick and the
damage on the item NAME and the split then orphans both), one hardening item (an
unguarded `equipment` read whose throw makes `load()` discard the whole roster) and one
inert nit (`rig.key === ""`). All three are written up in full in the consolidated
section below. Both lenses also confirmed the win: every shape whose entries DO carry
ids migrates exactly as specified and is stable across repeated `load()` calls.

**Environment note.** Two verifiers drove `localhost:8777` concurrently and stepped on
each other's roster. One moved to a private origin and re-ran everything cleanly, but
left two imported fixtures behind, `L1_noid_legacy` and `L2_dup_namekey`, and reset one
character's equipment and Glimmer. Harmless given the loaded character is expendable,
but worth knowing why the roster has strangers in it. Parallel agents sharing one dev
server and one localStorage will contaminate each other; give them separate origins.

## All review findings, read and merged

Three reviewers read the three unread task files and re-verified every item against
`7e48e67` by grep and at runtime. Twenty-four reported items collapse to **thirteen
live findings**, because several were the same defect seen from a different angle. Six
were already fixed by a later commit and two were rejected; those are in the closing
tally, not in the live list.

The live list is ordered by **what a player would actually notice**, not by how
interesting the defect is. In-app reachable wrong numbers come first; things reachable
only through `importCharacter` with hand-authored JSON come next, however severe;
invisible internal inconsistencies come last.

### What merged

- **The Open Architecture pairing was reported three times** as three different
  problems (the note names the wrong die, the pairing's advertised damage benefit is
  zero, the comment above it quotes deleted prose). One code block,
  `app/js/engine.js:636-652`. Merged into L4.
- **"The Weapons panel counts things it does not render" was reported twice**, once as
  the surviving half of the unreachable `"worn"` branch and once as collateral on the
  Knuckles fix. Same three uses of `equippedNames.length`. Merged into L6.
- **The rig identity defect was reported three times across two task files** (single
  resolver lens, migration lens, identity lens) and is already recorded at length in
  the section above. Merged into L9, which adds only the narrowed fix.
- **The Parry die is picked by source precedence at two sites**, and the two complaints
  about it (a shield beats your fists, bare hands read "Roll 1") are one resolver.
  Merged into L2.

### Root cause groups

Four groups, four single changes. The session already learned that six rig defects were
two root causes; this is the same accounting applied to the rest.

**GROUP A: the Parry die resolver walks a precedence chain instead of comparing dice.**
Members L2 and its second face. `app/js/combat.js:3522-3528` (tray) and
`app/js/combat.js:3580-3583` (row summary) both go weapon, then shield, then unarmed,
first match wins. **One change closes it:** resolve the Parry die once, by taking the
largest of the equipped melee weapons' dice, the shield's Block die and the resolved
unarmed die, and render the dieless case as prose rather than as a die. That also
retires the pre-existing "first equipped weapon, not the largest" behavior and the
"Roll 1" string in the same edit.

**GROUP B: the Weapons panel gates and counts on `equippedNames`, which is neither the
list it renders nor the list the rules ask about.** Members L5 and L6.
`app/js/combat.js:2940` suppresses unarmed augments from the weapon rows, but
`app/js/combat.js:3095` (unarmed row gate), `:3127` (empty state) and `:3414` (tab
badge) all still count them, and the gate at `:3095` has no `reach` term.
**One change closes it:** build a `realWeaponNames` list once, by filtering
`equippedNames` through `eng.isUnarmedAugmentName`, use it at all three sites, and add
`uStrike.reach.spaces` to the gate condition alongside the replacer, increase and rider
terms.

**GROUP C: per-piece mutable state is keyed on something that is not the equipment
entry, and two predicates disagree about which entries have an entry id at all.**
Members L7, L9 and the step-5 risk. `entryKey(e)` at `app/js/engine.js:871` returns
`e.id || e.name`; `app/js/store.js:364` withholds an id from a row with a missing
`qty`; `app/js/engine.js:1315` counts that same row as owned; and `ch.shieldWear` at
`app/js/store.js:129` never used an entry key in the first place.
**One change closes the whole class:** make the two predicates agree, by normalizing a
missing or non-numeric `qty` on a non-stackable row to 1 inside the split at
`app/js/store.js:361-379`, so "every owned non-stackable row carries an `eq_` id"
becomes an invariant. Then key every per-piece map on `entryKey`, which retires
`shieldWear`'s name key and gives Armor Repair a floor to stand on. The earlier note in
this file deferred this as "changes id assignment for ALL equipment"; the narrowed
version only affects rows that today receive NO id and are therefore already name-keyed
and already broken, and the split's own `nameToIds` rekey pass then repairs their
`carry` and `equippedWeapons` references for free. It still deserves its own
verification pass, but a smaller one than that note assumed.

**GROUP D: `migrate()` is order-dependent and guard-dependent, and its newest blocks do
not survive either.** Members L8, L10, L12 and L13. The `ch.rig` block sits at
`app/js/store.js:259-286`, about a hundred lines BEFORE the instance-id split at
`:361-397`, and the split's name-to-id rekey pass at `:380-396` covers
`equippedWeapons`, `equippedArmor/Shield/Focus`, `carry` and `slotInert` while omitting
`ch.rig`. Separately, `app/js/store.js:165` is a bare `if (!ch.proficiencies) return;`
and every migration added since sits after it.
**One change closes the group:** move all equipment-keyed migration blocks to AFTER the
split at `:397` (or add their keys to the rekey pass), and turn the `:165` early return
into a guard around only the proficiency conversion it was written for, so a record
missing one field stops skipping a hundred and fifty lines of unrelated normalization.

### Live findings

**L1. One Talent in two Universal Upgrade slots double-counts its unarmed step.**
`app/js/builder.js:2096-2107` never filters talents already sitting in another slot,
while `app/js/builder.js:2148-2151` (`talentUpgradePicker`) does; `activeTalents` at
`app/js/engine.js:743-753` pushes one entry per slot with no dedupe.
**Severity: medium, and the most player-visible item here, because it needs no import.**
Failing scenario: pick Street Scrapper in Universal Upgrade slots 2 and 4 and you get
`inc 2` and a `1d6` punch off a bare fist; add its Upgrade in slot 6 and the Upgrade
duplicates too, for `inc 4` and `1d10` off nothing. Harmless before the rewrite, because
Street Scrapper set a die rather than stepping one. `uuTalentsOwned` already exists in
the same file, so the filter is one expression away. **Not tracked.**

**L2. Strapping on a shield lowers your Parry below your bare fists.** GROUP A.
`app/js/combat.js:3523` (tray) and `app/js/combat.js:3582` (summary) both prefer the
shield's Block die unconditionally, exactly the way Knuckles used to before `70f66b8`
fixed the augment case eight lines up. **Severity: medium.** Failing scenario: L6 Fury
with a resolved `1d8` unarmed die and a Scrap Shield (`1d4` Block) reads
`Roll 1d4 (Scrap Shield)` in the row and in the tray; unequip the shield and it reads
`Roll 1d8 (your unarmed strike)`. Catalog Block dice run 1d4 to 1d8
(`app/data/gear_armor.js:179-199`), so this bites every unarmed build at 1d6 and up.
**Second face, same two sites:** with no die anywhere, the summary reads
`Roll 1 (your unarmed strike)`, which is not a die and not rollable, while the tray at
`app/js/combat.js:3531-3534` gets it right ("Bare hands with no die behind them:
subtract 1"). **Not tracked.**

**L3. The builder's `+ CHROME` toggle writes a cyberware record the unarmed code cannot
read, and the builder's own card then contradicts the sheet.**
`app/js/builder.js:1945` pushes `{base, name, tier: null, zone, sp, side, custom: true}`
with **no `key`**, while `app/js/engine.js:614` reads `CYBER_UNARMED[cw.key]` and
`app/js/engine.js:646` gates the Open Architecture flag on `cw.key === "skeleton"`.
**Severity: medium.** Failing scenario: NextGen with Open Architecture and Synthetic
Musculature, Reinforced Skeleton supplied by the builder toggle. The Freelancer tab
reads `Unarmed Strike 1d4 Bludgeoning · STEPS Synthetic Musculature +1`; the same record
with `key:"skeleton", tier:"Brandware"` reads `1d8` with the skeleton as replacer. And
the `#PRINT` step's Open Architecture card renders that same keyless record as
`FEATURE ✓ | ✓ CHROME | ● INTEGRATED`, because `comboHasChrome`
(`app/js/builder.js:1950-1953`) matches on `base`/`name` through `installedCyberBases`
rather than on `key`. So the Lineage card says INTEGRATED while the Freelancer tab
offers no Reinforced Skeleton strike. Two identity schemes for one record; the
`integrated` gate is new and inherited the brittle one. **Not tracked.**

**L4. Open Architecture adds no step, and its note claims the step landed somewhere it
did not.** `app/js/engine.js:644-646` (the `integrated` flag) and `:651-652` (the note),
with the stale comment at `:636-637` above them. **Severity: high as a correctness
statement, zero as arithmetic, and it needs an author ruling as much as a fix.**
Three faces, one block:
- The note reads "Open Architecture: the step lands on the Reinforced Skeleton's die"
  but the step lands on whichever replacer won. With Hand Razors Brandware installed and
  picked, the derived strike is `1d8 Slashing` off `baseDie 1d6` (the razors'), and the
  note still names the skeleton.
- Synthetic Musculature plus skeleton derives `1d8` **with** Open Architecture and
  `1d8` **without** it, identical in every field except that note. Since
  `LINEAGE_MECH["Synthetic Musculature"]` at `app/js/engine.js:475` is an unconditional
  `unarmedStep: 1` and `CYBER_UNARMED.skeleton` is `1d6/1d6/1d8` by tier, the reworded
  combo text advertises as its damage benefit exactly what the character already had.
  The pairing's only live mechanical benefit is the generic SP -1. The prose at
  `app/data/rules.js:154` and `app/data/species.js:71` is matched by coincidence and
  breaks the moment a second replacer or increaser exists.
- The comment at `:636-637` attributes to this pairing a phrase ("the Engineered
  Baseline effect ends") that this pairing no longer uses. It survives correctly in the
  six other Integration combos (`rules.js:156,158,160,162,164`), so the fix is to the
  comment only, not to the data.
**Brandon's call:** should the pairing add a real second step, or should the note stop
claiming a step it does not move? **Not tracked** (`DEFERRED-FIXES.md` asks for review
of the `CYBER_UNARMED` and step tables, which is adjacent but not this).

**L5. A reach-only character loses the whole unarmed row, so the reach chip is dead code
whenever a weapon is held.** GROUP B. `app/js/combat.js:3095` has no `reach` term; the
picker guard at `app/js/combat.js:1493` does count `strike.reach.spaces`, and the chip
is at `:1538-1540`. **Severity: low to medium.** Failing scenario: Verdine Arboreal with
`Canopy Reach`, Longsword equipped. `d.unarmed.reach = {spaces:1, sources:["Canopy
Reach"]}` and the Weapons panel renders the Longsword row only, with no unarmed row and
no `+1 reach` anywhere. Unequip the sword and the row appears. **Two corrections to the
original report, both lowering it:** the feature is not invisible sheet-wide, since
Freelancer then Features lists `Canopy Reach PASSIVE · ARBOREAL (LINEAGE) · L1`; and the
fix at `:3095` only recovers half the rule, because the feature's other half ("your
unarmed strikes **and melee weapons** gain an additional 1 space of reach",
`app/data/species.js:154`) has no engine path at all. The Longsword row prints `REACH 1`
identically with and without the feature. That second half is pre-existing and outside
the seven findings, but it should be fixed in the same sitting or the feature stays half
dead. **Not tracked.**

**L6. The Weapons panel says you are armed when you are not.** GROUP B. Three sites
count `equippedNames.length` while `app/js/combat.js:2940` suppresses unarmed augments
from the rows: `:3095` (gate fallback), `:3127` (empty-state hint) and `:3414` (tab
badge). **Severity: low, cosmetic, but on screen.** Failing scenario: equip only
Knuckles and Shock Gloves. The tab reads `WEAPONS (2)`, zero weapon rows render, and the
"No weapons equipped; hit EQUIP on a weapon" hint is suppressed. With Knuckles alone it
reads `WEAPONS (1)` beside zero rows. **Not tracked.**

**L7. Shield Durability is keyed on the shield's NAME, so two shields share one wear
track and a re-bought shield arrives already worn.** `app/js/store.js:129` declares
`shieldWear: {}` as `{shieldName: boxesMarked}` and `app/js/engine.js:900` reads
`(ch.shieldWear || {})[shield.name]`; the writes at `app/js/combat.js:3482-3483` use the
same name key. **Severity: medium, and in-app reachable with no import.** GROUP C. This
is not from the three task files; it was found while answering the Armor Repair question
below, and it is **the same defect the rig work already ruled on and fixed**, one item
over. Failing scenario, static, repro not driven: shields are non-stackable so two Scrap
Shields get separate `eq_` ids, but both resolve to the one key `"Scrap Shield"`. Mark
two boxes on shield #1, swap to #2, and #2 reads two boxes marked. Drop a worn-out
shield, buy a replacement, and the replacement inherits the wear, which is verbatim
Repro A from the rig section and contradicts the settled ruling that "a re-acquired rig
always arrives at full integrity" applied by parity. **Not tracked.** It should be fixed
in the same pass as Armor Repair, because they are the same mechanic and will otherwise
disagree with each other on screen.

**L8. The `ch.rig` migration runs about a hundred lines before equipment ids exist, so
it keys the pick and the damage on the item NAME, and the split then orphans both.**
GROUP D. `app/js/store.js:269` calls `EN.engine.ownedRigs(ch)` from inside the rig block
at `:259-286`; the instance-id split is at `:361-397` and its rekey pass at `:380-396`
omits `ch.rig`. **Severity: high where reachable, and it is the one genuinely new item in
the three task files. Reachability is narrow: `importCharacter` only.** Failing
scenario, reproduced at runtime: a legacy Stitcher owning a Field Kit and a Black Clinic
whose entries carry `qty:1` and no `id`, with
`rig:{tier:"Field Kit", hpSpent:10, hpTier:"Field Kit"}`, migrates to
`{key:"Field Kit Trauma Rig [0]", hp:{"Field Kit Trauma Rig [0]":10}}`; the split then
mints unrelated ids, `rigStats` lands on the **Black Clinic** at 40/40 with output +3,
and `derive().triage.saveDC` reads **11** where the control record with ids reads **8**.
It is also not idempotent: a second `load()` prunes the now-dead name keys, so the 10
recorded points are destroyed rather than misfiled (`{scrap:false, key:null, hp:{}}`).
Both spec clauses in the block's own comment at `:244-258` fail on exactly the legacy
shape the block exists to convert. No in-app insert can produce an id-less rig row, and
that was checked: `inventory.js:106` and `builder.js:993` mint ids for non-stackables,
the id-less pushes at `inventory.js:104` and `builder.js:989` are stackable-only, and
`isStackableName("Black Clinic Trauma Rig [5]")` is `false`. **Not tracked** (the
entry-key section above records only the `qty`/`entryKey` root cause). **Fix before step
5, see the Armor Repair verdict.**

**L9. An entry with a MISSING `qty` never gets an id, so two rigs share one key, one
damage slot, one picker option and a doubled bench chip.** GROUP C. **Severity: medium,
import-only. ALREADY TRACKED IN FULL** in the entry-key section above, including the
rationale for deferring it. Restated here only for the one thing the two reports added:
their suggested fixes differ, and the narrow one is to normalize the missing `qty` in
the split rather than to require a real `e.id` in `ownedRigs`, because the former makes
the invariant true for all consumers at once. Runtime confirmation that it is still
live: two id-less, `qty`-less Black Clinic rows produce two `ownedRigs` entries with the
same key, two picker options with the identical value `key:Black Clinic Trauma Rig [5]`
so one rig is unaddressable, one shared damage slot with both rows reading
`Black Clinic 23/40`, and a doubled Advanced Medkit chip on the bench.

**L10. The new rig read has no `Array.isArray` guard, and `load()` answers the throw by
discarding the entire roster.** GROUP D. `app/js/engine.js:1314`
(`((ch && ch.equipment) || []).forEach`) is reached unconditionally from
`app/js/store.js:269`; the swallow is `app/js/store.js:444-449`
(`catch { state.roster = {}; state.activeId = null; }`). **Severity: medium, on
catastrophic blast radius times very narrow reachability; it is a pre-existing class
rather than a new one.** Failing scenario: a stored record whose `equipment` is a plain
object rather than an array. `EN.store.load()` then goes from 5 records to 0 with
`activeId null`, and the next `persist` writes `{}`. **Two corrections to the original
write-up, both in the app's favour:** the import path cannot persist the bad record,
because `importCharacter` throws at `store.js:502` before `state.roster[obj.meta.id] =
obj`, so the wipe needs a record already in localStorage, meaning hand-edited storage;
and `store.js:269` is not quite the earliest unguarded read, since `store.js:201`
(`(ch.equipment || []).find`) is earlier, though it only runs for a `carry` entry whose
value is `"worn"`, whereas `:269` runs unconditionally. `(ch.cyberware || []).forEach`
at `store.js:289` is the same shape. **Not tracked.**

**L11. The Toxicologist rename migration misses `ch.talents`.**
`app/js/store.js:311-319` migrates only `ch.universalUpgrades[lvl].talent`. `ch.talents`
(declared `app/js/store.js:84`) is never touched, and its two consumers,
`app/js/printsheet.js:116` and `app/js/pdfexport.js:395`, resolve it with `.find(...)`
then `.filter(Boolean)`, so a stale key vanishes with no warning. **Severity: low,
import-only.** Failing scenario: import a record with `talents:["toxicologist"]` and the
field stays `["toxicologist"]`, resolves to nothing, and the print sheet renders zero
rows for it, while both Universal Upgrade slot types and both spellings migrate
correctly. Nothing in the app writes `ch.talents`, which is why this stays low. **Not
tracked.**

**L12. `if (!ch.proficiencies) return;` at `app/js/store.js:165` skips every migration
added since.** GROUP D. **Severity: low, import-only, and broader than the finding it
came attached to.** Failing scenario: import a record with universal upgrades and no
`proficiencies` field. The Toxicologist rename does not run, `weaponAmmo` is not
normalized, and the entire entry-keyed `ch.rig` migration is skipped, about a hundred
and fifty lines of normalization gone because one unrelated field was absent. **Not
tracked.**

**L13. `rig.key === ""` is never normalized.** GROUP D, nit. `app/js/store.js:266`
passes it (`typeof "" === "string"`), `:276` skips it (`!rg.key`) and `:286` skips the
clear (`rg.key &&`). **Severity: low, inert today.** An imported `rig:{key:""}` stays
`""` across reloads, and `rigStats` falls through to AUTO and resolves the owned entry,
so nothing misbehaves. **The report's own suspicion of an in-app writer is rejected:**
it floats `v.slice(4)` at `combat.js:1329`, but the picker's option values are `"none"`,
`"scrap"` and `"key:"+o.key` (`combat.js:1304-1316`) and the handler special-cases
`"none"` before slicing, so no select value in the app can yield `""`. Import or
hand-edit only. **Not tracked.**

Also live and already correctly recorded, restated only so the count is honest: the
`Zeroed In` versus `Dead-Eye Sniper` rename (blocked on Brandon, and the Combat and
Weapon Mastery category is still unreordered with `Dead-Eye Sniper` at position 6;
`grep -rn "Zeroed" app/` returns nothing, and `git log` shows no reorder since), and
Pneumatic Bypass having nowhere to live. On the latter, one correction: `ch.customFeatures`
**does** exist (`app/js/store.js:85`, a manual Feature list on the Freelancer tab), so
there is somewhere to write it down. What is missing is any path from there into
`unarmedIncreases`, which reads only lineage features, talents and gear.

### Closed, one line each

- **The STRIKE picker printed pre-increase damage and a flat `1` for a punch that is a
  die.** ALREADY_FIXED in `2ede818`; the finding was written against pre-commit code
  and is **rejected as live**. `app/js/combat.js:1502-1508` already reads
  `eng.stepDie(...)`.
- **Feature prose still setting the die for reclassified effects.** ALREADY_FIXED in
  `70f66b8`; Synthetic Musculature, Street Scrapper and Knuckles all read as increases
  now, confirmed on the rendered sheet. The remaining "deal 1d6" strings belong to
  genuine replacers and are correct.
- **Parry scraped a phantom die out of dieless gear.** ALREADY_FIXED in `70f66b8` and
  already logged; `realMeleeWeapon` and `firstMeleeDie` both reject
  `eng.isUnarmedAugmentName`.
- **The Shock Gloves weapon row rendering `Unarmed + 1d4 +3`.** ALREADY_FIXED in
  `70f66b8` at `app/js/combat.js:2940`. Its visible remainder is L6.
- **The Knuckles rewrite contradicting the app's own attack row.** ALREADY_FIXED in
  `70f66b8`, same line. Its visible remainder is L6.
- **The Signature Weapon proficiency orphan (`Dart Guns` / `Chem Spewers`).**
  ALREADY_FIXED in `28c17b2`; the bullet above it in "Confirmed defects" is struck.
- **`Insulation Bypass` was never accounted for.** Already recorded as a no-op with no
  app site; `grep` finds it only in this file.
- **The `"worn"` branch of `unarmedGearOnHands` is unreachable through the UI.**
  `app/js/engine.js:599` accepts `carry[key] === "worn"`, but the WEAR control is gated
  on `eng.itemSlots(it).length` (`app/js/combat.js:3294`, `app/js/inventory.js:167`) and
  no item in `app/data/gear_melee.js` carries a `slot`, so Knuckles and Shock Gloves
  never get a WEAR button. **Not a defect after re-verification:** EQUIP works, gives
  the identical `1d4` and rider, and no longer spawns a competing weapon row, so the
  `"worn"` branch is redundant rather than broken. Its only surviving consequence is
  L6. Left here rather than in the live list deliberately.
- **`lineageUnarmed` and `unarmedOptions` are dead derived fields**
  (`app/js/engine.js:1660-1661`). Live but cosmetic: `grep` finds no reader anywhere in
  `app/`. Delete them whenever unarmed code is next open; not worth its own entry.
- **`DEF_LIVE.Parry.req` and `activeDefenses[].requirement` as dead fields.** Accurate
  observation, pre-existing convention, not defects. No action.
- **Three copies of `newEquipId` with no collision check; orphan `hp` entries
  accumulating within one page session; `hpMap[key] | 0` wrapping above 2^31.** All
  three confirmed real and all three correctly self-declared as not worth filing.

## The Armor Repair question, answered before step 5 starts

**Does Armor Repair inherit the entry-identity floor? Yes, most of it. Should the
id-assignment mismatch be fixed first? Yes, and so should the migration ordering. Do
both before writing a line of step 5.**

What armor sidesteps: `ch.equippedArmor` is a single key (`app/js/store.js:122`), one
piece worn at a time, so armor cannot produce the rig picker's worst symptom, two
options with the same value and one piece unaddressable. There is no armor picker with
duplicate rows to collide.

What armor does **not** sidestep, and this is the part that matters:

1. **Armor is non-stackable, so it lives entirely inside the broken predicate.**
   `isStackableItem` (`app/js/engine.js:861-867`) returns false for `kind:"armor"`, so
   armor rows go through the split at `app/js/store.js:361-379` and normally get `eq_`
   ids. But the split's skip clause at `:364` withholds an id from any row with a
   missing `qty`, exactly as it does for rigs. An imported Kevlar Weave with no `qty`
   keys on `"Kevlar Weave"` forever.
2. **Armor Repair needs a MAP, not a slot, and the map covers pieces you are not
   wearing.** A current DR per piece means `ch.armorDR = { <key>: current }` for every
   owned armor row, including the damaged spares in the stash. That is structurally
   `ch.rig.hp`, which means it needs entry identity for rows the `equippedArmor` single
   key never touches. So the single-slot simplification buys nothing here. Two Kevlar
   Weaves with no ids share one repair state, and a re-bought piece inherits the
   previous one's damage. That is Repro A and Repro B from the rig section, arriving for
   the third time.
3. **The migration ordering trap is WORSE for armor than it was for rigs.** The rig
   block sits at `app/js/store.js:259-286`, a hundred lines before the id split, and L8
   is the price. The natural place to write an armor migration is beside the other armor
   defaults at `app/js/store.js:239`, which is **twenty lines earlier still**. Written
   there, `ch.armorDR` would key repairs on item names and the split would then orphan
   every one of them, and the second `load()`'s prune would destroy them rather than
   misfile them. Identical to L8, found the same way, entirely avoidable.
4. **The precedent sitting next to where the code will be written is the wrong one.**
   `ch.shieldWear` is declared at `app/js/store.js:129` and normalized at `:213-214`,
   both within a screen of where armor state goes, and it is keyed on
   `shield.name` (L7). Shield Durability and Armor Repair are the same mechanic: a
   defensive piece with a per-instance degradation track. Whoever writes step 5 will
   read `shieldWear` first and copy it. That single fact is the strongest argument for
   fixing the floor before starting, rather than after.

**Recommendation, in the order to do it.**

- **First, unconditionally, because it is a pure move with zero behavior change for any
  record whose entries carry ids:** relocate the `ch.rig` block from
  `app/js/store.js:259-286` to after the split at `:397`, and re-run the twelve-shape
  migration check already described in the settled section. This closes L8, and it
  establishes the rule that step 5 needs: **equipment-keyed migration runs after the
  split, never before it.**
- **Second, and this is the one the file previously deferred:** normalize a missing or
  non-numeric `qty` on a non-stackable row to 1 inside the split, so
  `app/js/store.js:364` and `app/js/engine.js:1315` finally agree and "every owned
  non-stackable row carries an id" becomes true. The blast radius is smaller than the
  earlier note assumed, because the only rows whose behavior changes are the ones that
  today get no id and are therefore already name-keyed and already wrong, and the
  split's `nameToIds` rekey pass repairs their `carry` and `equippedWeapons` references
  as a side effect. It still wants its own verification pass. Do that pass now, on one
  mechanic (rigs), rather than later on three (rigs, shields, armor).
- **Third, inside step 5 itself:** key `ch.armorDR` on `entryKey`, and convert
  `ch.shieldWear` to entry keys in the same commit, with a migration that attributes
  existing name-keyed wear to the first owned entry of that name and drops it when none
  is owned, which is the pattern `firstKeyOfTier` at `app/js/store.js:272-275` already
  established for rigs. Apply the settled ruling by parity: a re-acquired piece of armor
  arrives at full DR, and a re-acquired shield arrives unworn.

**If Brandon wants to keep deferring the predicate fix**, step 5 is still safe to write
provided it does two things: put the armor migration after the split, and key `armorDR`
on `entryKey` anyway. The id-less imported rows will then collide exactly as rigs do,
which is a known, recorded, import-only limitation rather than a new one. What step 5
must not do under any circumstance is introduce a **third** name-keyed per-piece map.

## Environment

- **Parts 2 and 3 are not spilled in full.** Chrome refuses downloads from
  `docs.google.com`, so only Part 1 is on disk (`ms/part1.md`). Targeted extracts of
  the changed passages are at `ms/targeted-2026-08-04.md`. Unblock by allowing
  automatic downloads for that origin.
