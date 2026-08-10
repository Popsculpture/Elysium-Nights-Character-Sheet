# Deferred fixes: 2026-08-09 manuscript sync

Running log of errors, corrections and open questions found while working the
six-step sync. **Nothing here gets fixed until steps 1 to 6 are done.** Add to it
as each step turns things up; work it after step 6.

Sync steps: 1 unarmed rewrite (done, `2ede818`), 2 renames and gear values (done,
`70f66b8`), 3 Triage Save DC and Stitcher class data, 4 Trauma Rig (done, working
tree), 5 Armor Repair, 6 Environmental Hazards.

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

- **Pneumatic Bypass prose is a fifth stale unarmed string.**
  `app/data/class_stitcher_resources.js` (two copies) still reads "Their unarmed
  strikes deal 1d6 Bludgeoning damage", which is replacer wording, while
  `engine.js` classifies it as an increase. Same class as the four fixed in
  `70f66b8`; left alone only because it was not on the handoff's list.
- **One pre-existing weapon-proficiency orphan**, a Signature Weapon, found while
  checking the category table. Confirmed identical in `HEAD`, so no change caused it.
- **Seven unread review findings** from the unarmed rewrite, in
  `tasks/wgxtatdtw.output`: five from the reclassification lens, two from the UI
  lens. Read these before touching unarmed code again. The one that was read (Parry
  pulling a phantom die from dieless gear) is fixed in `70f66b8`.
- **Two unread review findings** from the renames pass, in `tasks/w2e5slhtt.output`,
  beyond the two that were read and resolved.

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

Two more lenses also came back not clean and their findings are unread in
`tasks/wvcpodf55.output`: the single-resolver lens found two defects (one at
`app/js/store.js` around line 269), and the migration lens found three plus a nit,
noting that every shape whose entries DO carry ids migrates exactly as specified. Read
both before trusting the refactor on legacy records.

**Environment note.** Two verifiers drove `localhost:8777` concurrently and stepped on
each other's roster. One moved to a private origin and re-ran everything cleanly, but
left two imported fixtures behind, `L1_noid_legacy` and `L2_dup_namekey`, and reset one
character's equipment and Glimmer. Harmless given the loaded character is expendable,
but worth knowing why the roster has strangers in it. Parallel agents sharing one dev
server and one localStorage will contaminate each other; give them separate origins.

## Environment

- **Parts 2 and 3 are not spilled in full.** Chrome refuses downloads from
  `docs.google.com`, so only Part 1 is on disk (`ms/part1.md`). Targeted extracts of
  the changed passages are at `ms/targeted-2026-08-04.md`. Unblock by allowing
  automatic downloads for that origin.
