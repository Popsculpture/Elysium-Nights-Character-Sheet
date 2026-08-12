# Deferred fixes: 2026-08-09 manuscript sync

Running log of errors, corrections and open questions found while working the
six-step sync. **Nothing here gets fixed until steps 1 to 6 are done.** Add to it
as each step turns things up; work it after step 6.

Sync steps: 1 unarmed rewrite (done, `2ede818`), 2 renames and gear values (done,
`70f66b8`), 3 Triage Save DC and Stitcher class data (done, `28c17b2`), 4 Trauma Rig
(done, `7e48e67`), 5 Armor Repair (done, uncommitted, see "Step 5" below),
6 Environmental Hazards.

**Four items were pulled forward and fixed BEFORE step 5, deliberately:** the `ch.rig`
migration ordering (L8), the missing-`qty` id-assignment mismatch (L9), the
duplicate-`id` collision that L9's fix left standing, and the `ch.racked` rekey gap that
turned up beside it. All four are prerequisites for Armor Repair rather than deferred
cleanup, for the reasons in "The Armor Repair question" at the bottom. Together they make
one invariant true, which is the floor step 5 needs: **after migration, no two equipment
rows share an `entryKey`.** They are the exception to the rule above, not a change to it.

**Every review finding from steps 1, 2 and 4 has now been read and re-verified against
`7e48e67`.** The consolidated list is the section "All review findings, read and
merged" near the bottom. The bullets that used to say "unread" are gone; read that
section instead.

---

## Needs an author ruling (blocked on Brandon, not on code)

- ~~**RULED 2026-08-10, not yet applied: `Dead-Eye Sniper` HAS been renamed `Zeroed In`.**~~
  **APPLIED.** Key `dead-eye-sniper` to `zeroed-in`, display name and brief to
  `Zeroed In`, and the talent moved from position 6 to position 14 of Combat & Weapon
  Mastery, which is both "last" per the printed order and still alphabetical, since the
  category was already in alphabetical order and `Zeroed In` sorts last there too. The
  brief in `app/data/briefs.js` moved with it, so the file's order still tracks
  `talents.js`. The subclass `The Deadeye` (`the_deadeye`) is a different thing and KEEPS
  its name; nothing in `class_picker.js`, `kits.js` or `class_hustler_operator.js` was
  touched. Verified on screen with the bypass working (see the gate note below): the
  picker's Combat & Weapon Mastery optgroup ends `... Staff & Spear Master, Street
  Scrapper, Zeroed In`, picking it stores `{type:"talent", talent:"zeroed-in"}`, and
  `derive()` renders the feature as `Zeroed In`. The original question follows, for context.
- **`Zeroed In` versus `Dead-Eye Sniper`.** The handoff's printed order for Combat &
  Weapon Mastery ends with `Zeroed In` and omits `Dead-Eye Sniper`, which currently
  occupies position 6. `Zeroed In` does not exist anywhere in the app. That reads as
  an unlisted rename, but the same handoff says the Deadeye naming is deliberately
  unresolved. **That category is currently unreordered.** Is `Dead-Eye Sniper`
  becoming `Zeroed In`?
- **RULED 2026-08-10: Pneumatic Bypass is a Ripper Hot-Wired Implant, and it gets a
  player toggle.** It lives under Class Buffs in the new Status Changes panel, specced
  in `STATUS-CHANGES-SPEC.md`. That supplies the missing state: the recipient's sheet
  cannot know an ally installed it, so the player says so. Its stale replacer prose
  (the two copies in `class_stitcher_resources.js` and `briefs.js:179`) should be
  corrected to increaser wording in the same pass. The original question follows.
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

## Found reviewing the entry-key refactor, NOW FIXED (the entry-identity floor)

The refactor's wins are real and verified for equipment that carries ids: two rigs of
one tier hold independent damage, a re-bought rig arrives full, the damage map prunes
so it cannot grow across a campaign, and one resolver answers with an entry key. The
findings below were about the path where that id is MISSING. **Both are now fixed**, in
the order the Armor Repair verdict asked for and each proved against its own live
reproduction before and after. Nothing in this section is outstanding.

**ROOT CAUSE, one line, resurrected three bugs already marked fixed.** `entryKey(e)`
in `app/js/engine.js:871` returns `e.id || e.name`, so an entry with no id keys on its
NAME. Two predicates disagreed about an entry with a MISSING `qty`:

    app/js/store.js  (id assignment)  if (e.id || !(e.qty > 0) || isStackableName(e.name)) skip
    app/js/engine.js (ownership)      if (!e || (e.qty != null && e.qty <= 0)) return

A missing `qty` failed the first (so it never got an id) and passed the second (so it
counted as owned). The result was a permanently name-keyed live rig, on every load.

*Line numbers below are as of the qty fix. The id-uniqueness fix later grew the split by
about forty lines, so anything inside or after it has moved; the current anchors are the
split at `app/js/store.js:326-435`, the qty normalization at `:387`, the skip clause at
`:388`, the rekey pass at `:404-434` and the `ch.rig` block at `:436-482`.*

- ~~**The `ch.rig` migration ran before equipment ids existed.**~~ **FIXED by pure
  relocation.** The `ch.rig` block now sits immediately AFTER the instance-id split,
  instead of a hundred lines before it. The
  block itself is unchanged, only when it runs. The split now carries the rule in a
  comment at `app/js/store.js:317-325`: **any migration that keys state on an equipment entry runs
  AFTER the split, never before it.** That comment exists because the natural-looking
  place is twenty lines earlier and the next person to add equipment-keyed state would
  otherwise reintroduce this. See L8 for the repro and the numbers.
- ~~**An entry with a MISSING `qty` never got an id.**~~ **FIXED**
  inside the split: a NON-STACKABLE row with no id, whose `qty`
  fails `qty > 0` but which the engine still reads as owned, is normalized to `qty: 1`
  and then splits like any other row, receiving an `eq_` id. So **every owned
  non-stackable row carries an `eq_` id** is now an invariant, which is the floor
  `ch.armorDR` and `ch.shieldWear` need in step 5. See L9 for the repro and the numbers.

Deliberately still id-less, because the two predicates already agree about them:
stackable rows and unknown/custom items (pooled, legitimately name-keyed), and any row
the engine also reads as unowned (`qty` 0, negative, or `""`). A numeric-string `qty`
like `"3"` still splits into its full three instances; it was never in the broken set.

**What the blast-radius pass found, since the earlier note deferred this as "changes id
assignment for ALL equipment".** Measured, not reasoned: a record whose non-stackable
rows have no `qty` now migrates **identically in every field** to the same record with
`qty: 1`. `equippedWeapons`, `equippedArmor`, `equippedShield`, `equippedFocus`, `carry`
and `slotInert` all rekey from the name to the new id through the split's own
`nameToIds` pass, `findEntry` resolves all three equip slots, and encumbrance agrees
(`current: 4` in both, where the no-`qty` record previously reported `0`). Nothing was
found that depends on an entry having no id. Three things worth recording:

- ~~**`ch.racked` is missing from the split's rekey pass**~~ (it covered
  `equippedWeapons`, `equippedArmor/Shield/Focus`, `carry` and `slotInert`, and omitted
  `racked`). Was **pre-existing and unchanged by the qty fix**: a name-keyed
  `racked` entry is already dead for any row that splits, confirmed by measuring both
  cases, where `rackState().byItem` is empty and the encumbrance row reads
  `rackedIn: null` with `qty: 1` exactly as it does without one. **NOW FIXED** at
  `app/js/store.js:421-434`, rekeying both its keys and its values. One correction to
  this write-up, found while fixing it: it was worse than an orphaned rack, because the
  carry sanitizer then downgraded the item to `"carried"` on the NEXT load, which made
  the record unstable across loads. See the closing section for the numbers.
- **A pre-fix save that already persisted a NAME key in `ch.rig.hp`** (only reachable
  for the broken shape) loses that damage once, on the first load after this fix: the
  row now gets an id and the block's prune drops the orphan name key. That is the
  settled ruling applied to damage that was already being shared between two colliding
  rigs, so it is correct rather than a regression.
- **`nameToIds[e.name] = ids` is last-write-wins** for two rows of the same name, so a
  surviving name-keyed reference resolves to the second row's first instance. Nit,
  pre-existing for `qty: 1` duplicates, unchanged in kind.

The other two lenses have now been read. Between them they found one genuinely new
defect (the rig migration ordering, now fixed), one hardening item (an unguarded
`equipment` read whose throw makes `load()` discard the whole roster, L10, still open)
and one inert nit (`rig.key === ""`, L13, still open). All three are written up in full
in the consolidated section below. Both lenses also confirmed the win: every shape whose
entries DO carry ids migrates exactly as specified and is stable across repeated
`load()` calls.

**Verification run for both fixes.** Thirty migration shapes through `importCharacter`
(which calls the same `migrate`), each snapshotted on load 1 and re-migrated twice more:
zero throws, all thirty byte-stable across three loads. The twenty shapes that carry ids
or a real `qty` produce output identical to the pre-fix run, which is what makes FIX 1 a
behaviour-neutral move. All six tiers re-verified after both fixes: Output Bonus
+0/+1/+1/+2/+2/+3, Triage Save DC 8/9/9/10/10/11 at Tech +0, Mod Slots equal to the
Tier, traits 1 through 6, Integrity 15/20/25/30/35/40, nodes Standard through Apex, and
the Medical Baseline grade flipping to Advanced at Trauma Grade [2]. A non-Stitcher
holding a Black Clinic derives the whole `d.rig` record with `d.triage` absent. All seven
tabs render for a Stitcher and for a non-Stitcher with no console error. The settled
ruling still falls out: dropping a damaged rig and acquiring another leaves the new one
at 40/40 with the orphan pruned and the other rig's damage untouched.

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

**Two of the thirteen are now closed, L8 and L9, leaving eleven live.** Their entries
below are struck and carry their before-and-after numbers.

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

**~~GROUP A: the Parry die resolver walks a precedence chain instead of comparing dice.~~**
**CLOSED 2026-08-11 in `51d51ad`, and the remedy this paragraph proposed was WRONG.**
The diagnosis held: `app/js/combat.js:3522-3528` (tray) and `:3580-3583` (row summary)
both went weapon, then shield, then unarmed, first match wins, and one resolver closes
it. But "take the largest of the equipped melee weapons' dice, **the shield's Block
die**, and the resolved unarmed die" bakes in the category error underneath the whole
finding: **a shield's die is a BLOCK die and Parry rolls a DAMAGE die.** Brandon caught
it mid-fix. Comparing dice sizes would have kept a Ballistic Bulwark's `1d8` competing
for the Parry, just fairly instead of unfairly. The shield is not a Parry source at all.
See the L2 entry for what the books actually say and what was built.

**~~GROUP B: the Weapons panel gates and counts on `equippedNames`, which is neither the
list it renders nor the list the rules ask about.~~** **CLOSED 2026-08-11 in `5340506`,**
except L5's melee-weapon half, which is a modelling decision and is written up under L5.
The diagnosis was exactly right and the scope was three times too small: a survey of every
`equippedNames` consumer found **seven** sites asking the wrong question, not three, and
the two worst were on the print sheet and in the PDF rather than on screen. The original
prescription follows; read it with the corrections in the L5 and L6 entries.
`app/js/combat.js:2940` suppresses unarmed augments from the weapon rows, but
`app/js/combat.js:3095` (unarmed row gate), `:3127` (empty state) and `:3414` (tab
badge) all still count them, and the gate at `:3095` has no `reach` term.
**One change closes it:** build a `realWeaponNames` list once, by filtering
`equippedNames` through `eng.isUnarmedAugmentName`, use it at all three sites, and add
`uStrike.reach.spaces` to the gate condition alongside the replacer, increase and rider
terms.

**GROUP C: per-piece mutable state is keyed on something that is not the equipment
entry, and two predicates disagree about which entries have an entry id at all.**
Members L7, L9 and the step-5 risk. **The predicate half is now DONE, and so is its
other half.** `app/js/store.js:387` normalizes a missing or non-numeric `qty` on a
non-stackable row to 1 inside the split at `:326-435`, so `app/js/engine.js:1315` and the
split's own skip clause at `:388` finally agree; and the same split now enforces that no
two rows share an id (`:328-402`). Together those make **"every equipment row has a
unique `entryKey` after migration" an invariant**, and its stronger form for the pieces
step 5 cares about: **every owned non-stackable row carries its own `eq_` id.**
`entryKey(e)` at `app/js/engine.js:871` still returns
`e.id || e.name`, which is correct: the name branch serves pooled stackables and rows the
engine reads as unowned. **Step 5 has now done its half:** `ch.shieldWear` is entry-keyed
and `ch.armorWear` and `ch.armorGuard` were born entry-keyed, all three migrated after the
split. **The group is NOT fully closed**, because the floor is per-ROW and not per-PIECE;
see "The one hole in the floor" under Step 5. The blast-radius pass the earlier note asked
for was run; see the entry-identity section above for what it measured. The one gap it
found and deliberately did not work around, `ch.racked` missing from the rekey pass, is
now closed too.

**GROUP D: `migrate()` is order-dependent and guard-dependent, and its newest blocks do
not survive either.** Members L8, L10, L12 and L13. **L8 is now DONE:** the `ch.rig`
block was relocated to `app/js/store.js:436-482`, immediately after the instance-id
split at `:326-435`, and the ordering rule is recorded in a comment at the split
(`:317-325`). The split's name-to-id rekey pass at `:404-434` covers
`equippedWeapons`, `equippedArmor/Shield/Focus`, `carry`, `slotInert` and, since the
id-uniqueness pass, `ch.racked` as well, so it no longer forgets a per-entry map.
**Still open in this group:** `app/js/store.js:165` is a bare
`if (!ch.proficiencies) return;` and every migration added since sits after it (L12);
plus L10 and L13. Turn the `:165` early return into a guard around only the proficiency
conversion it was written for, so a record missing one field stops skipping a hundred
and fifty lines of unrelated normalization.

### Live findings

**RECONCILED 2026-08-10, after everything merged to `main`. Read this before the list.**
The list below is written as an archaeological record: entries are struck and annotated
in place rather than deleted, so the reasoning survives. That makes it a poor to-do list
at a glance. What is ACTUALLY still open, of the thirteen:

**Open: L3, L4, L13.** L5 and L6 are both fully closed as of 2026-08-11. L13 was re-verified against the merged code
and is still true and still inert. **Closed: L1 (`51102f8`), L2 (`51d51ad`), L5's first
half and L6 (both `5340506`).** L5's remaining half, character-granted reach on melee
weapons, was ruled on and built the same day (`c723997`); see the L5 entry.
**Nothing still open here can be reached without hand-authoring or importing a record.**

**Closed: L7, L8, L9, L10, L11, L12.** Each is struck below and says which commit closed
it and what was measured.

**LINE NUMBERS BELOW ARE STALE.** They were written against pre-merge files, and three
branches have since merged into `main`; `app/js/store.js` in particular grew by several
hundred lines. Treat every `file.js:NNN` as a hint about WHICH file, and find the site by
the quoted code, which is still accurate. The same applies to the sections above this one.


**~~L1. One Talent in two Universal Upgrade slots double-counts its unarmed step.~~**
**FIXED 2026-08-10 in `51102f8`.** The original write-up follows, and it was accurate;
what it understated is the blast radius, which is three consumers rather than the unarmed
die alone.

**Reproduced first, through the real pickers,** on a level 6 character with empty hands:
Street Scrapper in Universal Upgrade slots 2 and 4 gave `inc 2` and **1d6** off a bare
fist, and adding its Upgrade in slot 6 gave `inc 4` and **1d10**, exactly as written. The
Talent also rendered **twice** in the features list, which the original report did not
mention.

**Root cause is one function, and that is why one change closes all of it.**
`engine.activeTalents` pushed an entry per SLOT, and all three of its consumers read that
one list: `unarmedIncreases` pushed two step sources and two Upgrade sources (the Upgrade
push sits INSIDE the per-entry loop, which is where `inc 4` comes from),
`unarmedRiders` pushed two riders, and `derive()` pushed two feature rows. It now yields
one entry per Talent, **earliest slot winning**, because that is the level the character
gained it at and the level the play sheet prints beside the feature. Sorted numerically
rather than trusting object key order.

**The picker half, which stops it being created.** `talentPicker` now refuses a Talent
held in another slot, **disabled and labelled** `(already taken at Level N)` rather than
hidden, which is what that same picker already does for a Talent whose requirements are
unmet: a player looking for it should learn why it is unavailable, not wonder where it
went. `talentUpgradePicker` has always done this for Upgrades through `uuUpgradesTaken`;
this is `uuTalentsHeldElsewhere`, the same rule for the base Talent. It is dynamic
(moving the other slot off the Talent frees it again, verified) and a slot's own current
pick always stays selectable, so an edit elsewhere cannot strand it.

**Existing records are told, not silently corrected.** A character built before this can
be carrying a duplicate and nothing on the sheet showed it, so the offending slot now
reads "This slot is doing nothing: X is already taken at Level N ... Pick something else
here to get the choice back." **Deliberately NOT a `d.warnings` entry:** that list renders
on the dossier step under the heading `INCOMPLETE:`, and such a record is not incomplete,
it is complete with a wasted choice. The slot is also the one place the player can act on
it. Certification does not gate on `warnings` either way, so nothing is blocked.

**Both halves canonicalize through the same lookup,** because `activeTalents` accepts a
Talent named by its KEY or by its display NAME, so `"Street Scrapper"` and
`"street-scrapper"` in two slots is one Talent twice and has to read as one. An
unresolvable key raises no notice: that slot is wasted too, but for a different reason,
and the message would name a Talent nobody can look up.

**Verification.** Thirteen derived shapes fingerprinted WHOLE against the pre-change code.
**The seven without a duplicate are byte-identical; the only six that moved are the six
carrying one,** each from the wrong number to the right one: base twice `1d6 -> 1d4`, base
twice plus Upgrade `1d10 -> 1d6`, three copies `1d8 -> 1d4`, a doubled Cybernetic Surge
rider to one, and both the reverse-slot-order and display-name spellings resolving to the
Level 2 slot. Driven live: the picker refuses the second pick and frees it when the first
slot moves off, two different Talents are unaffected and raise nothing, and the
already-broken record reads `1d6` / `inc 2` with one feature row and the notice on slot 4
only. Seven tabs, the print sheet and five PDFs across five shapes, zero console errors.

The original write-up: `app/js/builder.js:2096-2107` never filters talents already sitting
in another slot, while `app/js/builder.js:2148-2151` (`talentUpgradePicker`) does;
`activeTalents` at `app/js/engine.js:743-753` pushes one entry per slot with no dedupe.
**Severity: medium, and the most player-visible item here, because it needs no import.**
Failing scenario: pick Street Scrapper in Universal Upgrade slots 2 and 4 and you get
`inc 2` and a `1d6` punch off a bare fist; add its Upgrade in slot 6 and the Upgrade
duplicates too, for `inc 4` and `1d10` off nothing. Harmless before the rewrite, because
Street Scrapper set a die rather than stepping one. `uuTalentsOwned` already exists in
the same file, so the filter is one expression away. **Not tracked.**

**~~L2. Strapping on a shield lowers your Parry below your bare fists.~~** **FIXED
2026-08-11 in `51d51ad`, and the finding was right about the symptom and wrong about the
cause.** The original write-up follows.

**THE PART BOTH THE FINDING AND GROUP A MISSED, caught by Brandon mid-fix: a shield's
die is a BLOCK die, and Parry rolls a DAMAGE die.** The reviewer proposed comparing die
sizes and taking the largest, and I had built exactly that before he stopped it. That
would have left a Ballistic Bulwark's `1d8` competing for the Parry, losing fairly
instead of winning unfairly, and the whole premise would still have been wrong.

**What the books say, pulled fresh from both live manuscripts on 2026-08-11.**
- **Block:** "Roll your **Shield's Block die** (if you carry one) and add your armor's
  flat Block Bonus and any other Block benefits you have."
- **Parry:** "Roll your equipped weapon's base **damage** die (e.g., a d8 for a standard
  longsword), **or your unarmed strike damage** if your hands are what you brought."
- **Part 3, Physical Shields:** the table is Name / Price / Defense / **Block** / Traits.
  There is no damage column, no shield in the catalog carries a `damage` field, and
  `shield bash` appears nowhere in either part.

So a shield has no die that Parry can roll, and the app was inventing one out of the
Block die. **A shield does still SATISFY Parry's Requirement** ("a Simple Weapon, Martial
Weapon, Signature Weapon, or physical Shield equipped, or be fighting unarmed"), so
carrying one never stops you parrying; it just contributes no die, and you roll a damage
die you actually have. A shield-and-empty-hand character parries with their fists. That
is the literal reading of Requirement-versus-Effect and it is the one implemented; the
book does not address the case directly.

**Three faces, one precedence chain written out twice, all reproduced first:**

| loadout | before | after |
| ----- | ----- | ----- |
| `1d8` unarmed + `1d4` Scrap Shield | `Roll 1d4 (Scrap Shield)` | `Roll 1d8 (your unarmed strike)` |
| Riot Shield, no weapon | `Roll 1d6 (Riot Shield)` | `Bare hands with no die behind them: subtract 1` |
| Dagger listed before Greatsword | `Roll 1d4 (Dagger)` | `Roll 2d6 (Greatsword) · 3 to choose from` |
| bare hands, no die | `Roll 1 (your unarmed strike)` | `Bare hands with no die behind them: subtract 1` |

**`parrySources()` is now the only thing that decides**, and it offers the CHOICE rather
than picking for you, because that is the rule and not a convenience: Parry's Tactical
Note is "if you are dual-wielding, you must choose which weapon you parry with and roll
its specific damage die". Sources are ordered by EXPECTED VALUE, not by die size, so a
Greatsword's `2d6` (avg 7) correctly outranks a `1d8` (avg 4.5); the default is the best
one so the common case is still one tap, and the tray carries chips to switch. Switching
clears any roll on screen, because that total belonged to the other die.
`firstMeleeDie()` was the chain's first half, had no other caller, and is deleted rather
than left for someone to wire back in.

**Verification.** Nine loadouts, the whole rendered Defense section captured before and
after. **Parry is the only field that moved, in all nine**, and the section is otherwise
identical, so Block, Dodge and Ward are untouched. Two shapes differing only in equip
ORDER now produce the same answer. Every reader of `blockDie` was audited and Parry was
the only one treating it as damage; a Ballistic Bulwark still reads
`+1d8 (Ballistic Bulwark)` on the Block row. Driven live: the tray rolls `2d6` for 8
against 12 incoming and reports "12 reduced by 8 to 4 damage", the chips switch implement
and clear the stale total, and a shield-only character still parries. Seven tabs, the
print sheet and four PDFs, zero console errors.

**Worth keeping.** The reviewer, GROUP A and I all reasoned about which die was BIGGEST
and none of us asked what KIND of die it was. The catalog says it plainly in the item's
own `type` string, "Physical Shield (+1 Defense, **+1d4 Block**, Wear 8)", and every
other consumer in the app labels it "Block". A precedence bug and a category error looked
identical from inside the code, and only the rules text told them apart.

The original write-up: `app/js/combat.js:3523` (tray) and `app/js/combat.js:3582`
(summary) both prefer the shield's Block die unconditionally, exactly the way Knuckles
used to before `70f66b8` fixed the augment case eight lines up. **Severity: medium.**
Failing scenario: L6 Fury with a resolved `1d8` unarmed die and a Scrap Shield (`1d4`
Block) reads `Roll 1d4 (Scrap Shield)` in the row and in the tray; unequip the shield and
it reads `Roll 1d8 (your unarmed strike)`. Catalog Block dice run 1d4 to 1d8
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

**~~L5. A reach-only character loses the whole unarmed row.~~** **FIRST HALF FIXED
2026-08-11 in `5340506`. The MELEE-WEAPON half is still open and is now a stated
decision rather than an oversight; see "Melee weapon reach" below.**

The gate now tests `uStrike.reach.spaces` alongside replacers, increases and riders, so
a Verdine Arboreal with `Canopy Reach` and a Longsword gets the unarmed row and its
`+1 reach` chip. **Before:** the Longsword row only, no unarmed row, the feature's one
mechanical grant rendered nowhere. **After:** `Unarmed Strike +9 ... 1 Bludgeoning + Body
mod` carrying `PLUS +1 reach`. It is a thin row to sit beside a Longsword, and that is
accepted deliberately: it is the only place on that tab the feature surfaces.

**MELEE WEAPON REACH, and why it did not ship with it.** The log said this "should be
fixed in the same sitting or the feature stays half dead", and that was written believing
it was one number. A survey of the data found **three grants with three different
scopes**, and a single `d.meleeReachBonus` added to every melee row is correct for only
the first:

1. **Canopy Reach** (`app/data/species.js`, lineage): "+1 space of reach" to unarmed
   strikes **and melee weapons**. Unconditional, every melee weapon.
2. **Staff & Spear Master, Level 6+ Upgrade** (`app/data/talents.js`): "your reach with
   **reach weapons** extends an additional 1 space". Only weapons that already carry a
   Reach trait, plus staffs. Wiring this as a flat bonus would silently give a Longsword
   +1 reach.
3. **Extended Haft** (`app/data/weapon_parts.js`): "Grants or increases Reach by 1",
   keyed on `ch.weaponParts[weaponName]`, so it is **per weapon instance**. Wiring this
   at character level would give the haft's reach to every melee weapon owned.

There is also no place for the number to land cleanly. `normalizeWeapon(it)` takes the
CATALOG item and no character, and its whole reach logic is
`rangeDisplay = String(1 + (Reach n from the item's range string))`. The row prints that
number beside a traits chip taken straight off the catalog, so moving the number alone
gives a Quarterstaff reading `REACH 3` next to a chip saying `Reach 1`; the two have to
move together or the bonus needs its own source chip, the way the unarmed picker's
`+1 reach` chip names its sources. Reach is displayed at seven places across four files
and used mechanically at none, since the app has no grid or positioning code.

**RULED AND BUILT 2026-08-11 in `c723997`: all three, with a cap.** Brandon took the
widest option, and then added a rule the app did not have.

`EN.engine.weaponReach(ch, item)` is the one resolver, and it takes the WEAPON as well as
the character because that is the only shape that handles three scopes. Order matters in
exactly one place: the haft runs first, because it "grants or increases" Reach, so a
hafted Longsword becomes a reach weapon that the talent can then extend.

**THE CAP, author ruling of the same day.** Reach caps at **2 for rigid weapons** (blades,
blunts, shaft weapons) and **3 for flexible ones** (whips, filament weapons). `Whip` and
`Nanowire` carry a `flexible: true` data flag and are the only two in the catalog; the
numbers live in `EN.combat.reachCap` so retuning is a data edit, not a code one. The cap
is on Reach POINTS, so a rigid weapon at the cap strikes 3 spaces and a flexible one 4.
**The manuscript update landed the same day** and is tracked in `9b70fc0`; see the
addendum below, which changed two things about how this composes.

**Capped points are reported rather than swallowed,** which matters because a character
can easily carry more bonus than the weapon can use: a Quarterstaff with all three grants
is Reach 4 on paper and Reach 2 in the hand. The chip reads `+1 reach · AT CAP` and the
tooltip says "2 points wasted: a rigid weapon caps at Reach 2." The resolver builds that
sentence once, so the weapon row, the print sheet and the PDF cannot word it three ways.

The catalog's own `Reach 2` trait chip is left exactly as printed and the bonus rides
beside it as its own chip, the shape the unarmed strike already uses. Rewriting the trait
chip would make the row claim the weapon has a Reach it does not have.

| loadout | before | after |
| ----- | ----- | ----- |
| Quarterstaff, Canopy Reach | REACH 2 | REACH 3 |
| Quarterstaff, all three grants | REACH 2 | REACH 3, `+1 reach · AT CAP`, 2 wasted |
| Longsword, Canopy Reach | REACH 1 | REACH 2 |
| Longsword, Canopy Reach + Extended Haft | REACH 1 | REACH 3 |
| Whip, Canopy Reach | REACH 3 | REACH 4 |
| Whip, all three grants | REACH 3 | REACH 4, 2 wasted |
| Machine Pistol, Canopy Reach | RANGE, untouched | RANGE, untouched |

These are the numbers as measured on the day. Two rows have since become unbuildable: on
2026-08-12 the Extended Haft became the **Extended Shaft** and its Fits gate narrowed to
Long-Shafted, so it cannot go on a Longsword or a Whip at all, and migrate() un-installs
any save that has one there. Kept as measured rather than corrected, because the point of
the table is what the reach fix did, not what the catalog holds today.

**THE MANUSCRIPT REWRITE, `9b70fc0`, and it changed the arithmetic twice.** All four
passages were re-read from the live docs before anything was touched.

- **Canopy Reach now breaks the cap.** "This bonus can exceed a weapon's normal Reach
  cap, since the vine is extending the attack rather than the weapon itself." The general
  rule says excess is lost and "a feature can exceed this cap only if its own text
  specifically says so", and Canopy Reach is the only feature that says so. So the cap
  now lands MID-calculation rather than at the end: base, plus the part, plus the talent,
  **cap**, then Canopy Reach on top. A Quarterstaff with all three grants went from
  REACH 3 to **REACH 4**.
- **Staff & Spear Master retargeted** from "reach weapons" to "long-shafted weapons",
  throughout the talent and in its Upgrade. That is a different question, and the
  difference shows: a **Whip** has Reach 2 and is not long-shafted, a **hafted Longsword**
  has Reach and is not either, and both used to take the bonus. It now reads a `shafted`
  flag on Quarterstaff, Spear, Halberd and Arc Glaive ("a polearm haft"), never Reach.

The note the resolver builds names the two cases separately, because a total ABOVE the
cap otherwise reads as a bug: "reaches 4 spaces (Extended Shaft, Staff & Spear Master
(Upgrade); capped at Reach 2 for a rigid weapon, so 1 point is lost; Canopy Reach reaches
past the cap)".

~~**One reading worth confirming, and it is the only ambiguity left in the rewrite.** The
Extended Haft's own entry ends "**Cap:** Reach 2, if fitted to a weapon already at its cap,
the additional Reach is lost", while the general rule and the Reach X trait both say the
cap "depends on its construction", which makes it 3 for a flexible weapon. Those disagree
for exactly one loadout: a **Whip with an Extended Haft**. The engine follows the general
construction rule, so that Whip reaches Reach 3 from the haft and 4 with Canopy Reach on
top. If the haft is meant to impose a flat Reach 2 ceiling of its own regardless of what
it is bolted to, that is a one-line change. Nothing else in the catalog is affected,
since the haft is the only reach-granting part and Whip and Nanowire are the only
flexible weapons.~~

**ANSWERED 2026-08-12, by deletion rather than by ruling.** Brandon rewrote the Part. It
is now the **Extended Shaft**, its "Cap: Reach 2" sentence is gone entirely, and its Fits
line reads "Long-Shafted (Quarterstaff, Spear, Halberd)". So the question had no subject:
a Whip is not long-shafted, the Part cannot be fitted to it, and the one loadout where the
two readings disagreed is unbuildable. The general construction cap is the only cap. Read
in the live Part 3 in both places it is printed, the Handling table row and the detail
entry, and the old "Extended Haft" string returns zero hits across all three manuscripts.

**Guards, all measured:** the Upgrade does nothing to a Longsword with no haft (it is not
a reach weapon), the talent WITHOUT its Level 6 Upgrade grants nothing, a non-reach part
grants nothing, and a ranged weapon comes back `melee: false` with nothing touched.

The original write-up: GROUP B. `app/js/combat.js:3095` has no `reach` term; the
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

**~~L6. The Weapons panel says you are armed when you are not.~~** **FIXED 2026-08-11 in
`5340506`, and it was not cosmetic and not confined to the panel.** The original
write-up follows.

**Seven sites, not three.** A survey of every `equippedNames` consumer found four more
asking the same wrong question: the reorder arrows' bounds test, the arrows' render
condition, and the Attacks tables in **both exports**.

**The two on paper are the ones that mattered, and neither finding mentioned them.**
`printsheet.js` and `pdfexport.js` each hold their own private copy of the weapon-name
resolver, neither filtered, and **neither export has ever read `d.unarmed` at all**
(a case-insensitive grep for "unarmed" across both files returned zero hits). So a
Knuckles-only Freelancer exported a sheet whose only attack line was
`Knuckles | +5 | 1d4 Bludgeoning`, strictly worse than the punch it improves and the
very row the app suppresses on screen, while the attack they actually have appeared
nowhere. A bare-handed Freelancer exported a **blank Attacks table**. Filtering the
augments out without also printing the strike would have made that worse, so both
exports now do both. `equippedWeaponNames` itself is deliberately left unfiltered: the
Equipped / Worn line is right that the Knuckles are on you. It was the attack PROFILE
that was the lie, not the presence.

**`realWeaponNames` is defined as "names that produce a row", not "names that are not
augments".** The row loop drops a name for two reasons, and a count built on the augment
test alone stays wrong for the other: an equipped name the catalog cannot resolve renders
nothing and was still counted. That shape is import-only, which is exactly where the rest
of the open findings live.

**Two traps the survey caught before they were written.**
- **The augments must stay in `ch.equippedWeapons`.** `engine.unarmedGearOnHands` reads
  that array to decide whether Knuckles steps the die at all, so implementing the filter
  at a write site would have silently stopped the augment augmenting, dropping the strike
  back to a flat 1 with no error. The fix is display-only everywhere.
- **The reorder arrows keep using `equippedNames`.** Their index is handed to
  `moveWeaponName`, which swaps one slot of the raw stored array; an index from a
  filtered list would move the wrong slot. Left alone rather than half-changed, and
  recorded here so the inconsistency is deliberate. (Separately and pre-existing: that
  swap moves one slot at a time, so reordering past a hidden augment takes two presses.)

**The empty state needed a second branch, not just un-suppressing.** Showing
"No weapons equipped; hit ⚔ EQUIP on a weapon" to a player who just pressed EQUIP on
their Knuckles trades a wrong count for a wrong instruction, and the Inventory toast had
just told them "it's live in the Attacks list on the Freelancer tab". Augment-only now
names the augments and points at the strike row they improved, and that toast tells the
truth for an augment too.

**One correction to the finding, in its favour.** The gate change is a no-op for L6's own
scenario: Knuckles pushes an increase, so the unarmed row was already rendering. The
visible L6 changes are the badge, the empty state and the exports.

**Verification.** Eleven loadouts, the Weapons tab body and the printed Attacks table
captured before and after. Every badge that moved was one of the four that was lying
(`(1)->(0)`, `(2)->(0)`, `(2)->(1)`, and `(1)->(0)` for an uncatalogued name); six were
unchanged. Every printed-table diff is the intended one, and the two loadouts that should
not move are byte-identical. The PDF was instrumented to prove both new paths execute
rather than merely not throwing. Nine characters across seven tabs, five Actions
sub-tabs, the print sheet and nine PDFs: zero console errors.

The original write-up: GROUP B. Three sites count `equippedNames.length` while
`app/js/combat.js:2940` suppresses unarmed augments from the rows: `:3095` (gate
fallback), `:3127` (empty-state hint) and `:3414` (tab badge). **Severity: low,
cosmetic, but on screen.** Failing scenario: equip only Knuckles and Shock Gloves. The
tab reads `WEAPONS (2)`, zero weapon rows render, and the "No weapons equipped; hit EQUIP
on a weapon" hint is suppressed. With Knuckles alone it reads `WEAPONS (1)` beside zero
rows. **Not tracked.**

**~~L7. Shield Durability is keyed on the shield's NAME, so two shields share one wear
track and a re-bought shield arrives already worn.~~** **FIXED in step 5, in the same
pass as Armor Repair and deliberately so: they are one mechanic and would otherwise
disagree on screen.** `ch.shieldWear` is now `{shieldEntryKey: boxesMarked}`. The read
is `app/js/engine.js` `defensiveLoadout`, which keys on `shieldKey` (`ch.equippedShield`)
instead of `shield.name`; the write is `markShieldWear` in `app/js/combat.js`, which
keys on `dg.shieldKey` and deletes a zeroed row instead of storing a 0; the migration is
the shared block described under "Step 5" below. **Repro, driven through the real
− WEAR button with two Scrap Shields:** mark 1 box on shield #1 (`eq_a3`), swap to #2
(`eq_a4`) and it reads 0 marked / 2 left where it used to inherit #1's box; wear #2 to
destruction (`shieldAlive false`) and swap back, and #1 still reads 1 box and alive.
Stored state is `{"eq_a3":1,"eq_a4":2}` where it used to be a single `{"Scrap Shield":n}`.
The original text is kept below for the history. `app/js/store.js:129` declared
`shieldWear: {}` as `{shieldName: boxesMarked}` and `app/js/engine.js:900` reads
`(ch.shieldWear || {})[shield.name]`; the writes at `app/js/combat.js:3482-3483` use the
same name key. **Severity: medium, and in-app reachable with no import.** GROUP C, whose
predicate half is now closed, so the entry-id floor this needs already exists. This
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

**~~L8. The `ch.rig` migration runs about a hundred lines before equipment ids exist, so
it keys the pick and the damage on the item NAME, and the split then orphans both.~~**
**FIXED, by relocating the block and nothing else.** GROUP D. The block now runs at
`app/js/store.js:436-482`, after the split at `:326-435`; the ordering rule it violated
is written down at the split, `:317-325`. **Repro before, driven through
`importCharacter` at runtime:** a legacy Stitcher owning a Field Kit and a Black Clinic
whose entries carry `qty:1` and no `id`, with
`rig:{tier:"Field Kit", hpSpent:10, hpTier:"Field Kit"}`, migrated to
`{key:"Field Kit Trauma Rig [0]", hp:{"Field Kit Trauma Rig [0]":10}}`; the split then
minted `eq_u0ugqig` / `eq_55axa54`, `rigStats` landed on the **Black Clinic** at 40/40
with output +3, and `derive().triage.saveDC` read **11** where the control record with
ids read **8**. It was also not idempotent: a second `load()` pruned the now-dead name
keys, destroying the 10 recorded points rather than misfiling them
(`{scrap:false, key:null, hp:{}}`). **After:** the same legacy record migrates to
`{key:"eq_7ljilpi", hp:{"eq_7ljilpi":10}}` and derives Field Kit **5/15**, output **+0**,
Basic Medkit, **saveDC 8**, byte-identical to the control, and unchanged across a second
and third `load()`. The control record itself is unchanged in every field, which is the
proof that the move is behaviour-neutral for anything that already carries ids. Both
spec clauses in the block's own comment now hold on exactly the legacy shape the block
exists to convert. No in-app insert can produce an id-less rig row, and that was
checked: `inventory.js:106` and `builder.js:993` mint ids for non-stackables, the id-less
pushes at `inventory.js:104` and `builder.js:989` are stackable-only, and
`isStackableName("Black Clinic Trauma Rig [5]")` is `false`.

**~~L9. An entry with a MISSING `qty` never gets an id, so two rigs share one key, one
damage slot, one picker option and a doubled bench chip.~~** **FIXED at
`app/js/store.js:387`.** GROUP C. The narrow fix was the right one: normalize the
missing `qty` in the split rather than require a real `e.id` in `ownedRigs`, because it
makes the invariant true for every consumer at once. **Repro before, at runtime and on
screen:** two id-less, `qty`-less Black Clinic rows produced two `ownedRigs` entries with
the same key, so `hp[k0]=23` then `hp[k1]+=7` collapsed to
`{"Black Clinic Trauma Rig [5]": 30}` and both rows read **10/40**; the picker rendered
two options with the identical value `key:Black Clinic Trauma Rig [5]`, leaving #1
unaddressable; the Fabrication bench printed
`Advanced Medkit (Black Clinic Trauma Rig [5]) · BASIC` **twice** and Medtech read
**Edge 4**; and the Stash header read **0 ENTRIES**, because every other surface gates on
`qty > 0` and so could not see the rows the engine called owned. **After:** the two rows
are `eq_alp2t54` and `eq_avc0ewy`, the picker renders two distinct option values, the
bench prints the chip **once** with Medtech at **Edge 3**, and the Stash reads **2
ENTRIES / TRAUMA RIGS (2)**. Damage driven through the real DAMAGE button on the
Freelancer tab: 12 on #1 and 31 on #2 hold independently at **28/40** and **9/40**,
survive switching between them, survive a detour through the Scrap Rig and back, and
survive a full page reload.

**~~L10. The new rig read has no `Array.isArray` guard, and `load()` answers the throw by
discarding the entire roster.~~** **FIXED 2026-08-10 by the migrate() hardening pass**;
see that section for the measured before and after (three poison shapes took a five-record
roster to zero; all now leave five survivors). GROUP D. `app/js/engine.js:1314`
(`((ch && ch.equipment) || []).forEach`) is reached unconditionally from
`app/js/store.js:465`; the swallow is `app/js/store.js:532-535`
(`catch { state.roster = {}; state.activeId = null; }`). **Severity: medium, on
catastrophic blast radius times very narrow reachability; it is a pre-existing class
rather than a new one.** Failing scenario: a stored record whose `equipment` is a plain
object rather than an array. `EN.store.load()` then goes from 5 records to 0 with
`activeId null`, and the next `persist` writes `{}`. **Two corrections to the original
write-up, both in the app's favour:** the import path cannot persist the bad record,
because `importCharacter` throws at `store.js:582` before `state.roster[obj.meta.id] =
obj`, so the wipe needs a record already in localStorage, meaning hand-edited storage;
and `store.js:465` is not quite the earliest unguarded read, since `store.js:201`
(`(ch.equipment || []).find`) is earlier, though it only runs for a `carry` entry whose
value is `"worn"`, whereas `:465` runs unconditionally. `(ch.cyberware || []).forEach`
at `store.js:245` is the same shape. **Not tracked.** The id-uniqueness fix adds a
`ch.equipment.forEach` pre-pass, but it sits inside the existing
`if (Array.isArray(ch.equipment))` guard, so it adds no new unguarded read.

**~~L11. The Toxicologist rename migration misses `ch.talents`.~~** **FIXED**, as a
byproduct of applying the `Zeroed In` rename, because the second rename would otherwise
have inherited the same hole on day one. The single-rename `if` became a
`TALENT_RENAMES` table covering BOTH storage sites: `ch.universalUpgrades[lvl].talent`
and the flat `ch.talents` list. The table is null-prototype, per the lesson in "Open
after the duplicate-id fix": it is keyed on strings out of a save file, so a plain
object literal would have read `talents: ["constructor"]` as a rename hit and rewritten
it. Verified through `importCharacter` at runtime: a record carrying
`talents: ["dead-eye-sniper","toxicologist","melee-mastery","constructor"]` and four
Universal Upgrade slots spanning both types and both spellings (`dead-eye-sniper`,
`Dead-Eye Sniper`, a `talentUpgrade`, and `toxicologist`) migrates to
`["zeroed-in","cutting-agent","melee-mastery","constructor"]` with every slot rewritten,
is byte-stable across three loads, and derives both talents as named features.
`constructor` passes through untouched. The original write-up follows.
`app/js/store.js:271-275` migrated only `ch.universalUpgrades[lvl].talent`. `ch.talents`
(declared `app/js/store.js:84`) was never touched, and its two consumers,
`app/js/printsheet.js:116` and `app/js/pdfexport.js:395`, resolve it with `.find(...)`
then `.filter(Boolean)`, so a stale key vanished with no warning. **Severity was: low,
import-only,** since nothing in the app writes `ch.talents`.

**~~L12. `if (!ch.proficiencies) return;` skips every migration added since.~~** **FIXED
2026-08-10 by the migrate() hardening pass**, which turned it into a guard around only the
proficiency conversion it was written for. GROUP D. **Severity: low, import-only, and broader than the finding it
came attached to.** Failing scenario: import a record with universal upgrades and no
`proficiencies` field. The Toxicologist rename does not run, `weaponAmmo` is not
normalized, and the entire entry-keyed `ch.rig` migration is skipped, about a hundred
and fifty lines of normalization gone because one unrelated field was absent. **Not
tracked.**

**L13. `rig.key === ""` is never normalized.** GROUP D, nit. `app/js/store.js:462`
passes it (`typeof "" === "string"`), `:472` skips it (`!rg.key`) and `:482` skips the
clear (`rg.key &&`). **Severity: low, inert today.** An imported `rig:{key:""}` stays
`""` across reloads, and `rigStats` falls through to AUTO and resolves the owned entry,
so nothing misbehaves. **The report's own suspicion of an in-app writer is rejected:**
it floats `v.slice(4)` at `combat.js:1329`, but the picker's option values are `"none"`,
`"scrap"` and `"key:"+o.key` (`combat.js:1304-1316`) and the handler special-cases
`"none"` before slicing, so no select value in the app can yield `""`. Import or
hand-edit only. **Not tracked.**

Also live and already correctly recorded, restated only so the count is honest: the
`Zeroed In` versus `Dead-Eye Sniper` rename (**no longer live: ruled, and now applied,
with the category resorted so `Zeroed In` sits at position 14**), and
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
   Weaves that resolved to one key would share one repair state, and a re-bought piece
   would inherit the previous one's damage. That is Repro A and Repro B from the rig
   section, arriving for the third time. *Updated: the split now guarantees the two
   Weaves resolve to two DISTINCT keys, whether the record omitted their `qty` or gave
   them the same `id`, so this point is now about USING that identity rather than about
   the identity being missing.*
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

**Recommendation, in the order to do it.** The first two are **DONE**; only the third is
left, and it belongs to step 5.

- ~~**First:** relocate the `ch.rig` block to after the split.~~ **DONE.** It lives at
  `app/js/store.js:436-482`, and the rule step 5 needs is written down at the split
  itself (`:317-325`): **equipment-keyed migration runs after the split, never before
  it.** Thirty migration shapes re-run afterwards, zero throws, all stable across three
  loads, and every id-carrying shape byte-identical to before the move.
- ~~**Second:** normalize a missing or non-numeric `qty` on a non-stackable row to 1
  inside the split.~~ **DONE** at `app/js/store.js:387`, with its own verification pass.
  `app/js/store.js:388` and `app/js/engine.js:1315` now agree, and **"every owned
  non-stackable row carries an `eq_` id" is true.** The blast radius was measured, not
  assumed: a record with no `qty` on its non-stackable rows now migrates identically in
  every field to the same record with `qty: 1`, including all four equip slots, `carry`,
  `slotInert` and encumbrance. Done on one mechanic (rigs) rather than later on three.
- ~~**Second and a half, added after the fact:** enforce id UNIQUENESS in the same
  split.~~ **DONE** at `app/js/store.js:328-402`. Having an id was never enough, because
  two rows could carry the SAME id and reproduce the whole collision set. The floor step
  5 actually stands on is the stronger statement: **every row's `entryKey` is unique
  after migration.** `ch.armorDR` and the converted `ch.shieldWear` inherit that directly,
  so two Kevlar Weaves cannot share a repair state no matter how the record was authored.
  The `ch.racked` rekey gap was closed in the same pass (`:421-434`), which also removed
  the only shape in the verification set that was not stable across loads.
- ~~**Third, and all that is left, inside step 5 itself:** key `ch.armorDR` on `entryKey`,
  and convert `ch.shieldWear` to entry keys in the same commit.~~ **DONE, with one naming
  correction: the map is `ch.armorWear` and it stores DR LOST, not `ch.armorDR` storing
  current.** A map named `armorDR` would either hold a number that is not the DR (a lie in
  the name) or hold the current value, which duplicates the catalog on every acquisition
  and has to be written for pieces nobody has touched. Storing wear makes "absent means
  undamaged" the default, which is what delivers the settled ruling for free, and it makes
  `armorWear` and `shieldWear` the same shape for the same reason, which was the whole
  argument for doing them together. Both migrations run after the split, per the rule
  recorded there, and both use the `firstKeyOfTier` attribution pattern. Points 2, 3 and 4
  of the four reasons above were all live and all handled; point 1 was already dead.
  No third name-keyed per-piece map was introduced.

## Still open after the ordering, qty, duplicate-id and racked fixes

**Both of the first two are now CLOSED.** Their entries are struck below and carry their
before-and-after numbers.

**Corrected 2026-08-10, after reading the `w4qe3petu` lenses.** This paragraph used to
claim "every equipment row's `entryKey` is unique after migration, whether it arrived
with an id, without one, or with somebody else's". That was overstated in two directions
and a reviewer measured both. What is actually true, and all step 5 should ever have been
sold:

- **Every row that carries an id ends up with an id no other row carries.** Uniqueness is
  enforced over IDS, never over the effective `entryKey`. Two pooled stacks of the same
  name, two custom rows of one name, and two unowned rows all still share a key after
  migration. The first two are benign and pre-existing (pooled rows are legitimately
  name-keyed) and the third is excluded by the engine's ownership test, but the sentence
  as written denied they existed. It also contradicted the surviving `nameToIds`
  last-write-wins nit twelve lines below it, which concedes two rows can share a name.
- **And it was per-ROW, which is not per-PIECE.** `{id:"eq_x", name:"Kevlar Weave",
  qty:3}` was one row holding three suits, so the promise that "two Kevlar Weaves cannot
  share a repair state no matter how the record was authored" was false for exactly that
  authoring. **That gap is now closed** (see the section on the two `w4qe3petu` findings
  below): a non-stackable owned row splits on its count whether or not it carries an id,
  so the per-piece statement is now true rather than merely claimed.

- ~~**Duplicate ids reopen the collision class.**~~ **FIXED in the split,
  `app/js/store.js:328-402`.** The split now walks the list tracking the ids it has
  handed out and re-ids any row whose id an earlier row already claimed, so the skip
  clause at `:388` can no longer wave a duplicate through. Two supporting details: a
  pre-pass collects every id the incoming list carries ANYWHERE into `reservedIds`
  before a single row is processed, so a minted id can never steal one that a LATER row
  already owns; and the split's own minting goes through the same `mintId()`, so minted
  ids cannot collide with each other either. **Repro before, at runtime and on screen**
  with `equipment: [{id:"eq_DUP", name:"Black Clinic Trauma Rig [5]", qty:1}, {same}]`:
  `ownedRigs` returned `["eq_DUP","eq_DUP"]`, one distinct key; 23 damage on the picked
  Rig made BOTH rows read **17/40** out of the single slot `{"eq_DUP": 23}`; the picker
  rendered `Black Clinic [5] #1` and `#2` with the **identical** value `key:eq_DUP`, so
  the browser selected the last and #1 was unaddressable; and the Fabrication bench
  admitted both rows, printing the medkit chip **twice**. **After:** the rows are
  `eq_DUP` and `eq_ph72smj`, the picker renders two distinct option values, the bench
  prints the chip **once** with Medtech at **Edge 3**, and damage driven through the real
  DAMAGE button holds independently at **17/40** and **9/40**, surviving a switch between
  them and a full page reload. **First seen keeps the original id**, so the 23 points and
  the recorded pick stay on the Rig they always meant; the re-idded row starts with no
  per-entry state and arrives at full Integrity, which is the settled ruling that
  unattributable state is dropped rather than duplicated.
- ~~**`ch.racked` is missing from the split's rekey pass.**~~ **FIXED at
  `app/js/store.js:421-434`,** rekeying both its keys and its values, since it is the
  only per-entry map that points at another ENTRY. **The write-up above understated it:
  the omission did not merely orphan a rack, it made the record unstable across loads.**
  Measured on a legacy record with `racked: {"Dagger": "Sheath"}` and
  `carry: {"Dagger": "racked"}`: load 1 rekeyed `carry` to ids and left `racked` on its
  dead name key, then load 2's carry sanitizer (`app/js/store.js:199`, which downgrades a "racked"
  status whose `ch.racked` target is missing) rewrote the status to `"carried"`. It was
  the only shape in the whole verification set that failed the three-load stability
  check. After the fix the same record migrates to `racked: {eq_x: eq_y}`, is stable
  across three loads, and renders live: the Loadout reads "1 racked", the Dagger nests
  under the Sheath with `⧉ RACKS 1/1` and `⧉ Racked: Sheath`, and its Load drops by 1.
- **`nameToIds` is last-write-wins** for two rows sharing one name, so a surviving
  name-keyed reference lands on the second row's first instance. Nit, pre-existing for
  duplicate rows generally. Untouched, and unrelated to the id-uniqueness work: this is
  about two rows sharing a NAME, not an id.
- **A pre-fix save that already persisted a NAME key in `ch.rig.hp` loses that damage
  once**, on the first load after the qty fix, because the row now receives an id and
  the prune drops the orphan. Reachable only for the broken shape, whose damage was
  already being shared between two colliding rigs, so this is the settled ruling being
  applied rather than a regression. Recorded so it is not rediscovered as a bug. The
  duplicate-id fix has the same one-time shape and the same justification: the row that
  loses its id was sharing another row's state, so it starts clean.

### Verification run for the duplicate-id and racked fixes

**Thirty-four migration shapes** through `EN.store.load()` (the same `migrate` that
`importCharacter` calls), each snapshotted, written back to storage and re-loaded twice
more. **Zero throws, all thirty-four byte-stable across three loads** (the racked shape
was the one that was NOT stable before). `Math.random` was stubbed with a seeded LCG for
every load, so minted ids are reproducible and the pre-fix and post-fix runs are
comparable byte for byte rather than only structurally.

**The no-op proof, measured rather than asserted.** Every shape's ENTIRE migrated record
was fingerprinted, not just the fields this work touches. **All twenty-seven shapes
without a duplicate id hash identically to the pre-fix run**, including the eleven that
mint ids, which is the load-bearing part: `mintId()` draws exactly one random number per instance
in the no-collision case, so the RNG sequence is unchanged and the minted ids come out
the same. Exactly seven shapes changed, and they are exactly the six carrying duplicate
ids plus the racked one. Nothing else moved.

**Can a minted id collide?** Handled, and forced rather than argued. With the seeded RNG
the first mint is always `eq_3vvy44y`, so that exact id was planted on a pre-existing row
in both orders. Mint-first-then-pre-existing: the pre-pass had already reserved it, so
the split minted `eq_lvx1gzh` instead and the pre-existing row kept its id, its recorded
pick and its damage. Pre-existing-first-then-mint: same outcome by the same reservation.
Two distinct keys either way. Without the pre-pass the first case would have let a minted
id steal an id a later row legitimately owned.

**Rig defaults re-verified after both fixes.** All six tiers: Output Bonus
+0/+1/+1/+2/+2/+3, Triage Save DC 8/9/9/10/10/11 at Tech +0, Mod Slots equal to the Tier,
traits 1 through 6, Integrity 15/20/25/30/35/40, nodes Standard through Apex, and the
Medical Baseline grade flipping to Advanced at Trauma Grade [2]. All seven tabs render
with no console error for a Stitcher and for a non-Stitcher holding two Rigs, and the
non-Stitcher's rig block still shows no Triage Save DC and no Scrap Rig option.

## Step 5: Armor Repair, and Shield Durability converted beside it

**Built, verified live, uncommitted.** The rule fills the gap behind four features that
said "until repaired during Downtime" with nothing behind them: Demolition Engine,
Corrosion (Acid), Blackware Hand Razors, and the caustic environment clause.

### State

    ch.armorWear   { armorEntryKey: DR points lost }   new
    ch.armorGuard  { armorEntryKey: true }             new, the crafting quality edge
    ch.shieldWear  { shieldEntryKey: boxesMarked }     converted from a NAME key (L7)

Declared in `blank()` at `app/js/store.js:129-132`. The catalog `dr` is the BASE and the
ceiling; absent from `armorWear` means the suit is at full DR, which is what delivers "a
re-acquired piece arrives fresh" with no heuristic, exactly as it does for `ch.rig.hp`.

**Migration** is one shared block in `migrate()`, immediately after the `ch.rig` block and
therefore after the instance-id split, per the ordering rule recorded at the split. It
rebuilds all three maps null-prototype and applies one rule to each key: **a key that
already names a live entry is kept, a key that names an owned item's NAME becomes that
item's first owned entry, anything else is dropped.** *Superseded: "first owned entry" was
the data-corruption defect that put this work on a branch; the rule is now the equipped
piece, else the single owned entry, else dropped. See the branch section at the end.* The
live-entry test running first is
what makes it idempotent, since after one pass the keys are ids and an id-keyed map is
indistinguishable from a name-keyed one except by asking the equipment list; it is also
what keeps a legitimately name-keyed pooled or custom row working. Two keys resolving to
one entry keep the first and drop the second rather than overwrite. The old pre-split
normalization of `shieldWear` at `:213-214` is gone, replaced by a pointer comment saying
where it went and why.

Seven import shapes through `importCharacter`, each re-loaded twice more: **zero throws,
all seven byte-stable across three loads.** Legacy `{"Scrap Shield":2,"Riot Shield":1}`
plus `armorWear:{"Anvil Frame":3}` and `armorGuard:{"Anvil Frame":true}` land on the first
owned entry of each name, with the SECOND Anvil Frame untouched at 5/5 (dropped, never
duplicated); a name nothing owns is dropped to `{}`; junk values, non-object maps, an
absent field and prototype-name keys all normalize to `{}` without throwing; a stored
wear of 99 against a base of 5 reads 0/5 (the resolver floors it) and stays stable.

### One resolver, one writer

- `EN.engine.armorState(ch, key)` is THE resolver: `{key, name, item, base, lost, current,
  damaged, breached, guard}`. Nothing anywhere else derives a current DR.
- `EN.engine.applyArmorDamage(c, key, delta)` is THE writer, called inside `store.update`.
  It clamps to `[0, base]` in both directions and spends `armorGuard` on the first point
  of loss. **This existed as two writers for part of the build and they diverged**: the
  Impact Table's own mutator ignored the guard, so a click there burned a point the
  Defenses row would have absorbed. Reproduced, then collapsed. That is the one-resolver
  rule applying to the write path, not only the read path.

### Every reader of armor DR, and how each now gets the current value

1. `defensiveLoadout` in `app/js/engine.js` sets `armorDR` from `armorState().current`,
   and adds `armorBaseDR`, `armorDRLost`, `armorBreached`, `armorGuard`, `armorState`,
   `armorKey`, `shieldKey` to `d.defenseGear`. A LAPSED lease now grants
   `min(lapsedDR, current)`: a lapsed lease does not un-punch a hole, so a breached
   Sentinel Issue grants 0 rather than falling back up to its `lapsedDR` of 1.
2. `derive()`'s `d.armorDR` and `d.totalDR` ride that, so every consumer of either is
   current by construction: the Freelancer DR stat tile, the DR breakdown popover, the
   Block tray's flat "Armor DR" row, the Block summary line, and the Plated half-DR term
   (`Math.floor(dg.armorDR / 2)`, which now halves the CURRENT DR).
3. Freelancer gear chip (`app/js/combat.js`): reads `3 of 5 DR` when damaged.
4. DR breakdown row and footer: names the loss and points at the Impact Table.
5. Stash item card (`app/js/inventory.js`): a stash card asks the resolver for THAT entry
   and shows `3 / 5 DR`; the market card, which has no entry, still shows the base.
6. Impact Table header tag: still the catalog base, and now SAYS `5 BASE DR`, because that
   panel is keyed on the armor TYPE (`ch.armorMods` is name-keyed) and not on a piece.
7. Print sheet: stat tile value is current, sublabel reads `Resonant Carapace · 1 of 3`;
   the inventory detail line reads `DR 1 of 3 (2 lost, until repaired)`.
8. PDF export: the DR field's sublabel reads `Resonant Carapace (1/3)`, and the inventory
   table's notes column reads `DR 1 of 3 (2 lost)`. Verified by instrumenting
   `armorState` during a real `EN.pdfExport.build`, which logged `eq_b1->1/3`.

### The two lanes

Numbers live in `EN.crafting.armorRepair`, priced per POINT of DR restored:

| lane | cost | resolves as |
|---|---|---|
| Shop | 10 percent of LISTED price per point | 1 Downtime period, no roll, pays on the spot |
| Bench | 5 percent of LISTED price per point in parts | a Simple Project using Engineering |
| Fab Rig | 0 parts | `Portable Fabrication Rig` in the stash prints the plate |
| At 0 DR | full parts cost (`rebuildCost`, half listed) | not a repair: an ordinary Project |

"LISTED price" is `EN.crafting.listPrice(it)`: the item's `price`, except for LEASED gear
where it is the Buyout, because a lease's `price` is a deposit and not what the suit is
worth. That correction and the `materialCost` to `rebuildCost` change are both in the
branch section at the end; the table above and the numbers below were originally written
against `it.price` and are unchanged for everything unleased.

**Each piece carries a points picker**, so the per-point rate is purchasable per point:
`−  n / lost  +`, defaulting to the whole loss, with both lanes pricing the picked number.
(Originally both lanes sold only the entire loss; see the branch section.)

Measured on an Anvil Frame (list 920, base 5): 1 point shop `𝒢92`, bench `𝒢46`; 2 points
shop `𝒢184`, bench `𝒢92`; 3 points shop `𝒢276`; a full 5 points shop `𝒢460`, which is half
of 920 and reproduces the rate derivation the manuscript gives, so nobody retunes it by
accident. A breached suit's rebuild is `𝒢460` in parts at the item's own Project tier
(Standard, target 5), restoring the whole base. Leased: a Sentinel Issue (deposit 150,
Buyout 1000) is `𝒢100` per point and `𝒢500` to rebuild; a Bailiff Rig (deposit 430, ◎0.3
Buyout, so `𝒢3,000` listed) is `𝒢300` per point and `𝒢1,500` to rebuild.

The bench lane hands the work to the existing Projects system: `tbStart` carries
`repairKey` (the armor entry) and `repairPoints`, the card rolls, salvages, secures and
logs like any other Project, and `tbComplete` pays out in DR through the one writer, so it
cannot exceed the base and a piece that left the stash mid-Project restores nothing (the
card shows a `PIECE GONE` chip in that case, verified). **A Project cannot be completed
until its materials are secured, and a repair that completes with nothing to restore
refunds what was paid for its parts** (both were defects; see the branch section). The
quality edge is the ordinary results table: a log containing a Flawless interval sets
`armorGuard`, and the next point of DR the suit would lose is absorbed.

### The crafter gate is not a new rule

**~~`EN.crafting.tiers` already carries `skillTier` per tier ("Expects Proficient" on the
bench chips), and it was DISPLAYED and never ASKED. `EN.crafting.meetsTier(tierKey,
skillTier)` asks it, against `EN.rules.profOrder`.~~ REVERSED, and `meetsTier` is gone.**
Asking it in the bench lane alone made that lane the only gated Project in the app, which
is why this was Blocking. The tier requirement is advisory at all four Project creation
sites, which is what it always was everywhere else; an untrained crafter opens the bench
lane and pays the ordinary +2 Snag per Work Interval. The full argument, the reproduction
and the uniformity check are in the branch section at the end of this file. The scope note
that used to sit here (Blueprints and custom Projects remain advisory, the 0 DR rebuild
routes through the same ungated ordinary path) is now simply the whole rule.

### The one hole in the floor, reproduced

`app/js/store.js:392`'s skip clause is `if (e.id || !(e.qty > 0) || stackable)`, and `e.id`
short-circuits before `qty` is ever looked at. So the inherited invariant is true per ROW
and **false per PIECE**: one row can be several pieces. Measured on armor through the real
`migrate`:

    equipment: [{id:"eq_multi", name:"Anvil Frame", qty:3}]
      -> ONE row, ONE armorState, ONE DR track: three suits reading "eq_multi 3/5"

    equipment: [{name:"Anvil Frame", qty:3}]        (the same three, authored id-less)
      -> three rows, three keys, three tracks, all 5/5

This is verbatim the "two Kevlar Weaves share a repair state" case the Armor Repair
argument above says the split now prevents, arriving through the operand nobody checked.
It was flagged by the third lens of the duplicate-id run and went unread until now.
**Reachability is import and hand-edit only**, confirmed: `inventory.js` and `builder.js`
mint one `eq_` id per non-stackable purchase at `qty: 1`, and `addToStash` merges only on
`x.name === name && !x.id`, so no in-app path can produce an id-carrying non-stackable row
with `qty > 1`. **NOT fixed here on purpose:** the fix is one clause in the split (split an
id-carrying non-stackable row with `qty > 1`, first instance keeping the original id), but
it changes id assignment for every multi-quantity id-carrying row of every gear type, and
changes of that shape have each earned their own thirty-plus-shape seeded-RNG verification
run. It should get one. It is the first thing to do next in GROUP C.

Related doc correction while here: the claim at "Still open after the ordering, qty,
duplicate-id and racked fixes" that **"every equipment row's `entryKey` is unique after
migration"** is overstated in two ways, both already measured by the lenses. Uniqueness is
enforced over **ids**, never over the effective `entryKey`, so two pooled stackable rows
and two unowned non-stackable rows still share a name key (benign, pre-existing), and a
hand-authored id equal to another row's catalog name still collides (not benign, needs a
hand-edit). What was actually proved is: **every row that carries an id ends up with an id
no other row carries.** Read the section with that substitution.

### Found while building step 5

- **`app/js/builder.js:135` reads `ch.identity.handle` unguarded**, so importing a record
  with no `identity` object throws inside `emit()` and the #PRINT tab cannot render it.
  Pre-existing (the blank character always has `identity`), import and hand-edit only, same
  family as L10 and L12. Hit it four times while running import fixtures.
- **`ch.armorMods` is now the last name-keyed gear map** (`app/js/engine.js` `armorModDR`
  reads `ch.armorMods[armor.name]`), and it is deliberately NOT converted. It is not
  per-piece degradation state: it records which mods a TYPE of suit carries, and the
  Impact Table's mod bench is keyed on the type to match. Converting it is a separate
  decision about whether two Anvil Frames can be modded differently, not a defect. The
  header now reads `BASE DR` so it does not claim to be per-piece.
- `EN.engine.ownedArmorPieces` guards its `ch.equipment` read with `Array.isArray` rather
  than `|| []`, so it does not join the L10 class of unguarded reads that let one bad
  record wipe the roster.
- `EN.inventoryView.openBench(key)` is new, so another view can land the player on a
  specific Workbench bench (the damaged-plating readout sends them to the Impact Table).

### Verification run for step 5

Own origin `http://localhost:8831`, forced reload before every reading, four characters.

- Two Anvil Frames on one character hold damage independently (`{eq_a1:2, eq_a2:1}`), and
  the worn suit defends as 3 while the spare reads 4.
- DR never exceeds base and never falls below 0, forced through the writer directly:
  over-repair by 99 on an undamaged suit stays 5/5, over-repair on a damaged one lands
  exactly 5/5, over-damage by 99 stops at 0/5, and a non-armor entry and a missing entry
  are both inert.
- Shop lane driven through the real button: `𝒢184` off the wallet, 3/5 to 5/5, the other
  piece untouched.
- Bench lane driven through the real button: opens `Repair Anvil Frame (+1 DR)`, Simple,
  Engineering, target 3, parts `𝒢46`, lands the player on the Fabrication bench; SECURE
  pays, two Flawless intervals complete it, DR returns to 5/5 and `armorGuard` is set. The
  next `− DR` is absorbed with no loss, and the one after that lands.
- Breached suit routes to `REBUILD PROJECT · 𝒢460` and restores the full 5 on completion.
- Re-acquisition, through the real stash DROP and the real gray-market BUY: drop a breached
  Anvil Frame (`eq_a1`, 5 lost) and buy another; the new piece is `eq_jfcky5i` and arrives
  5/5. The orphan `{eq_a1:5}` survives in memory to the end of the session exactly as
  `ch.rig.hp` orphans do, and the next load prunes it to `{}`.
- Shield Durability per entry, driven through the real − WEAR button: see L7 above.
- Lapsed leases: a Sentinel Issue reads 3, then 2 with 1 lost, then 1 lapsed, then 0 when
  lapsed and breached, then 0 when paid and still breached.
- **All seven tabs plus all five Workbench benches render for four characters with zero
  console errors and zero throws**, re-run after a forced reload.

## Open after the duplicate-id fix

- ~~**A second lens finding went unread.**~~ **READ during step 5.**
  `tasks/w4qe3petu.output` held three lens reports. The prototype-key defect they found
  was already fixed before commit and is recorded below. The two findings that were still
  live are both folded into the Step 5 section above: the per-ROW versus per-PIECE hole in
  the floor (now reproduced on armor), and the overstated `entryKey` uniqueness claim (now
  corrected in place). A third, documentation-only nit from that run is also true: the
  verification-run prose says 34 shapes, then 26 unchanged and 7 changed, which leaves one
  shape unaccounted for.
- **Prototype keys, fixed but worth knowing.** The uniqueness check used plain object
  literals, so an id like `constructor` or `toString` read as already taken through the
  prototype chain: a row that was the ONLY one carrying it was judged a duplicate and
  silently re-idded, losing its recorded pick and its damage. Both maps in the split
  and the `liveKeys` map in the prune are now null-prototype. The same hazard applies
  to any future map keyed on user-supplied strings, which includes everything step 5
  will key on an equipment entry.
- **`nameToIds` last-write-wins** remains open and is unrelated to the id work: it
  concerns two rows sharing a NAME, not an id.

## The `?dev` bypass never worked, and why that matters more than it looks

**FIXED.** Found on 2026-08-10 while trying to verify the `Zeroed In` rename on screen.
`?dev` and `?nogate` were landing on the credential gate exactly as if the bypass did
not exist, on a clean profile, on the current `main`.

**Cause: one invisible byte.** `fe2df0e` committed the predicate as

    /[?&](dev|nogate)\x08/.test(window.location.search)

with a literal **backspace character, `0x08`,** sitting between the closing paren of the
alternation and the closing slash. So the regex demanded that a backspace follow the
word `dev` in the query string, which nothing can supply, and `devBypass()` returned
`false` on every load. `app/js/gate.js:141`, now one byte shorter.

**Why it took a while to find, which is the part worth keeping.** Every cheap check
passes. The file reads correctly in an editor and in `git show`. `grep` for the pattern
finds it. `node --check` passes, because a backspace inside a regex literal is legal
syntax. `EN.gate.require.toString()` in the live page prints the bypass verbatim,
because the character has no glyph. And `/[?&](dev|nogate)/.test(location.search)` typed
by hand into the console returns `true`, because the hand-typed regex is not the one in
the file. The diagnosis only closed on `curl ... | cat -A`, which renders it as `^H`.
**`cat -A` (or `grep -P` for a control-character class) is the tool; reading the source,
including reading it in the browser, cannot find this.**

The sweep is now clean and worth repeating: `grep -rlP "[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]"`
over the repo, excluding `.git`, `review-findings` and `app/vendor`, returns nothing.
`app/js/gate.js` was the only file that ever matched, and the backspace was its only
control character. `app/vendor/pdf-lib.min.js` matches legitimately and is not ours.

**The consequence for everything already recorded.** This sits directly under the
convention that stale JS has produced false readings twice, and it is the same failure
in a nastier form: any agent that loaded `?dev`, hit the gate, and did not notice would
have been reading a page where the app never opened. It does NOT invalidate the
verification runs above, which drove `importCharacter` and `EN.store.load()` and were
therefore reading the real engine, and which reported on-screen numbers that only exist
past the gate (so those sessions got past it, by the password or by an already-set
`en_gate_ok_v1` flag). It does mean the bypass was never the thing letting them in.
Worth knowing before trusting a future "I loaded with ?dev and saw X."

Two smaller things noticed alongside it, neither fixed, neither a defect in this file's
sense:

- **The root `index.html` redirects twice.** A `<meta http-equiv="refresh" content="0;
  url=app/">` and a `location.replace("app/" + location.search + location.hash)` race
  each other, and only the script carries the query string. The script won every time it
  was measured here, so `?dev` survived the hop, but the meta tag is a coin toss by
  construction. Loading `app/?dev&cb=x` directly sidesteps it.
- **`migrate()` does not default `ch.identity`.** A hand-authored fixture without it
  throws in `stepIdentity` at `app/js/builder.js:135` (`ch.identity.handle`) the moment
  the builder renders. Same class as L10 and L12: import-only, hand-authored-only, and
  the record is otherwise fine. Recorded so the next person writing a fixture knows to
  include it rather than filing a bug.

## The migrate() hardening pass, 2026-08-10

Four items, all the same shape: an imported or hand-authored record that `migrate()`
either could not survive or quietly skipped. Reachability is import and hand-edit only
in every case; the reason to fix them is blast radius, not likelihood. **L10 and L12 are
closed by this pass.**

- ~~**L12: `if (!ch.proficiencies) return;` skips every migration added since.**~~
  **FIXED.** It is now a guard around exactly the proficiency conversion it was written
  for. **Repro before:** a record with no `proficiencies` field kept its duplicate
  equipment ids (the split never ran), kept `dead-eye-sniper` and `toxicologist` as
  talent keys, kept `weaponAmmo` mode `"Burst"`, and never got the entry-keyed `ch.rig`
  block. **After:** four distinct entry keys, `zeroed-in`, `cutting-agent`,
  `"Burst Fire"`, and `rig.hp` present. A reviewer had independently lost a test run to
  this same line.
- ~~**L10, and the null-element shape beside it: one malformed record destroys the whole
  roster.**~~ **FIXED, twice over.** `ch.equipment` as a plain object makes `.forEach`
  undefined; a `null` element makes `e.name` throw inside the split. Either throw
  propagates out of `migrate()` into `load()`'s catch, whose answer is to discard the
  ENTIRE roster, and the next `persist()` writes that emptiness back.
  **Repro before, four poison shapes each planted in a store beside four healthy
  records:** `null` element, `equipment` as an object, and `cyberware` as an object all
  left **0 survivors** with `activeId: null`. (A string element happened to survive.)
  **After: 5 survivors in all four**, `activeId` intact, and the poisoned record itself
  normalized rather than dropped.
  Fixed at both levels deliberately. The *normalization* makes the known throws
  impossible: `equipment`, `cyberware` and `cyberStash` are coerced to arrays first
  thing, `equipment` drops non-object rows, and chrome drops only null holes because it
  legitimately carries legacy STRING entries its own pass converts. The *structure* is
  the other half: each record now migrates in its own `try`, so a future unguarded read
  costs one record instead of the device. A record that still cannot migrate is dropped
  from the session and named in the console, rather than kept half-normalized, because
  every reader downstream assumes `migrate()` ran to completion; it stays in
  localStorage until the next persist, so it can be recovered by hand.
- **A fourth item, found while testing the third and fixed with it: `migrate()` defaulted
  none of `resources`, `vitality`, `wounds`, `flow`, `conditions` or `deathSaves`,** so a
  record missing any of them threw on the Freelancer tab the moment it rendered
  (`ch.resources.current`, unguarded, `combat.js:2613`, and it is far from the only such
  read). **Pre-existing and NOT caused by the L12 fix**: before it, such a record returned
  early and did not get these defaults either, so it crashed identically. Missing
  top-level fields are now filled from `newCharacter()` itself, so the schema keeps
  exactly one definition and the fill cannot drift from it. Only ABSENT keys are filled,
  never present ones; `meta`, `name`, `firstName` and `lastName` are skipped as
  per-record or derived. The template is built once and cached, both to avoid building a
  character object per record and because `newCharacter()` mints a uid: per-record that
  would shift the RNG sequence once per record and make a seeded before-and-after
  comparison incomparable.

**Verification.** Four poison shapes measured before and after against a five-record
store. A no-proficiencies record now renders across all seven tabs, where before it
threw. Five well-formed shapes (a complete record, duplicate ids, a splitting row, a rig
with damage, a name-keyed rack) were fingerprinted whole against the pre-fix code with a
seeded LCG: **two byte-identical, and the other three identical once minted ids are
normalized positionally, so all five are structurally unchanged.** The residual id
difference is the single `uid()` draw the cached template costs at session start, which
shifts every later mint by one; ids are random in production, and the structural equality
is the claim that matters. Five classes across seven tabs, no console error.
## Found in step 6 (Environmental Hazards)

The chapter is in: `app/data/hazards.js` (rules), `EN.engine.hazardStats` (the one
resolver, landing on `d.hazard`), the Hazards panel on the Freelancer tab, the
`ch.hazards` block in `app/js/store.js` (after the split, per the ordering rule), and
an Environmental Hazards chapter in the Codex. Everything below is what it could NOT
close.

**Blocked on the Armor Repair branch, by design.**

- **Caustic gear degradation is computed and reported, not applied.** Armor DR is
  immutable on main, so the loss is recorded in `ch.hazards.caustic.armorDR`, an
  ENTRY-keyed ledger (`{armorEntryKey: DR lost}`), pruned to owned entries on every
  load and clamped to the suit's own DR so "minimum 0" holds in storage as well as on
  screen. `d.hazard.caustic.degradation` reports `baseDR`, `lost` and `wouldBe`, and
  the panel prints them as PENDING. **`d.armorDR` is deliberately untouched.** The
  single hook is in `causticScene` (`app/js/combat.js`): if
  `EN.armorRepair.applyDegradation` exists the loss is handed to it, otherwise it
  stays in the ledger. `d.hazard.caustic.degradation.applied` reports which of those
  happened, and is `false` on this branch. **When Armor Repair merges, the ledger
  should be retired into whatever that branch's per-piece current-DR map is, and the
  hook left as the only call site.** Do not add a second subtractor.

**Needs an author ruling.**

- **How long is a round?** Nothing anywhere in `EN` says. It matters because Void Lung
  is "15 minutes of held breath" while Drowning and Vacuum are "rounds equal to your
  Body score". Rather than invent a conversion, Void Lung is implemented as "the save
  clock does not start inside a scene", which is true for any round length under about
  six seconds and is the strongest reading of "the largest single vacuum mitigation in
  the game". If a round length is ever stated, this becomes a real countdown.
- **Does a Long Rest feed and water you?** The three Deprivation clocks are advanced
  only by the player's own +DAY control. They are deliberately NOT registered in
  `tickDays` (`app/js/combat.js`), because a Long Rest is one day on the story
  calendar and registering them would silently start starving every character who
  sleeps. The Fatigue rules already assume a Long Rest has "safe shelter, food, and
  water", which argues the opposite way: that a Long Rest should RESET all three. Both
  readings are defensible, so neither was implemented. Ask Brandon.
- **A full scene of caustic exposure is a button, not a clock.** The app has no scene
  timer, and a turn is not a scene, so END OF TURN only reports the 1d6 Acid and a
  separate MARK FULL SCENE applies the DR loss. If a scene clock ever exists, wire it
  to `causticScene`.

**Mitigations: all nine are wired, with two carrying a switch that did not exist.**

Each of the nine changes an outcome, verified one at a time against a control
character. Two needed state the app was not keeping:

- **The Thermal Regulation Weave's Fire-or-Cold pick was never stored.** `ch.armorMods`
  is a flat key list with no room for an install-time choice. The pick now lives at
  `ch.hazards.thermalWeave`, keyed on the ARMOR ENTRY, so two suits each keep their own
  tuning and a re-bought suit arrives untuned. Untuned grants nothing and says so
  rather than guessing an element. **If armor mods ever grow a general per-install
  options map, this should move into it** rather than stay a hazard-specific side
  table; it is the only mod in the catalog with a choice today.
- **"While intact" had nothing behind it.** The Hazmat Suit's own entry says a tear
  fails the seal until repaired, so the panel carries a MARK TORN toggle
  (`ch.hazards.hazmatTorn`). It is a player declaration, not a derived value; no
  damage-to-gear system exists to derive it from.

Half-wired, and honest about it:

- **Hearthglow's 2 space aura is not modelled.** The sheet is one character, so only
  the self half ("no Fatigue from cold") is applied. Allies within 2 spaces are the
  GM's to run. Same shape as every other aura in the app.
- **Radiation Callouses and the Thermal Regulation Weave refuse the FATIGUE only.** A
  failed Lethal Cold save still deals its 1d6 Cold, correctly: both features speak
  about Fatigue, and the Weave's Resistance to Cold is displayed rather than applied
  because there is no automatic damage pipeline on the sheet to halve anything in.

**Pre-existing defects this step landed on top of.**

- **L12 now has a new member.** The `ch.hazards` migration sits after the instance-id
  split, as the ordering rule requires, which also puts it after the bare
  `if (!ch.proficiencies) return;` at `app/js/store.js:165`. **Measured, not assumed:**
  a record with no `proficiencies` skips the whole hazards block, so its exposure rows,
  its entry-keyed ledgers and its orphan prune never run. It degrades safely (the
  engine guards every read, `derive()` does not throw and the panel renders NOTHING
  RUNNING), and it is import-only, but an orphaned `armorDR` entry can survive there
  where it would be pruned anywhere else. Fixing L12 properly closes this too; a
  hazards-only workaround would just be a second early-return to unpick later.
- **`ch.armorMods` is still keyed on the armor NAME**, not on `entryKey`
  (`app/js/store.js` has no normalization for it; `app/js/engine.js` reads
  `ch.armorMods[armor.name]` in four places). So two Kevlar Weaves share one mod
  loadout, and a re-bought suit inherits the previous one's mods. This is L7's defect
  one item over, and it is the reason `ch.hazards.thermalWeave` is keyed on the ENTRY
  while the mod list it describes is keyed on the name: the tuning is per-suit even
  though the mod that carries it is not. **Not touched**, because converting
  `ch.armorMods` is Armor Repair's neighbourhood and belongs in the same pass as
  `ch.shieldWear`. It is the third name-keyed per-piece map, and it was already here.

**Data flags added, so nothing reads prose to decide a mechanic.**

- `vacuum: true` on Warframe Shell (`app/data/gear_armor.js`) and
  `grantsSealed: true, sealToVacuum: true` on the Rebreather Liner
  (`app/data/armor_mods.js`). The vacuum check reads those flags and never the Sealed
  trait, which is what makes "a generic Sealed flag does not satisfy a vacuum check"
  true by construction: `Riot Wall`, `Aegis Shroud` and `Reliquary Shell` all carry
  Sealed and all correctly fail, and an Aegis Shroud passes only once a liner is
  fitted. `grantsSealed` also replaced a `/Sealed/.test(mod.grants)` regex over a
  display string in the caustic degradation test, which was the same brittleness the
  vacuum rule was written to avoid.

## Step 6: Environmental Hazards, MERGED to main 2026-08-10

Built on `env-hazards-wip` and merged once its five confirmed defects were fixed and the
vacuum subsystem was verified. The account below was written while it was still a branch;
read "this branch" as "this work".

**Unverified: the vacuum lens never ran.** Its agent died on an API error, so Vacuum,
the breath clock and the sealing rule have only the implementer's own testing behind
them. That subsystem needs a verification pass before merge. Re-running the workflow
with `resumeFromRunId` replays the other agents from cache and re-runs only that lens.

**CONFIRMED, thin air:** the Long Rest lock outlives the Fatigue it was locking, then
locks Fatigue that has nothing to do with thin air. `ex.fatigue` is written on a failed
save and never decremented, and the path an ability or a medic uses to clear Fatigue
does not touch the hazard rows. The rules explicitly bless that path, so the drifted
state is guaranteed rather than an edge case. Two further clock findings sit in
`tasks/wbkcw3wnd.output` alongside it.

**Genuinely good, and worth preserving through the fixes:**

- Per-instance escalation is structural, not disciplined. Each exposure is a row under
  its own minted id and the DC reads `10 + 2 * row.saves` from that row, so there is
  nowhere for a global counter to live. LEAVE deletes the row, which makes "leaving
  resets both clock and DC" a consequence of the shape rather than a step that can be
  forgotten.
- There was no Drowning implementation to share, so the breath machinery was built once
  and both conditions consume it. No second copy of the DC sentence exists.
- Sealing reads data flags and never the Sealed trait, verified across seven cases
  including a lapsed Warframe lease.
- The armor DR scope note was handled as asked: the caustic loss is computed into an
  entry-keyed ledger and printed as PENDING, with one hook that fires only if the Armor
  Repair branch's applier exists. No parallel armor DR system was built.

**Honest gaps the implementer declared rather than faked:** Hearthglow's 2 space aura
applies only to the bearer, since the sheet is one character; Radiation Callouses and
the Thermal Weave refuse Fatigue but not the Lethal rider's damage, as there is no
damage pipeline to reduce; round length is stated nowhere in the data so Void Lung does
not convert minutes to rounds; and whether a Long Rest feeds and waters you is
ambiguous, so the deprivation clocks are player-driven.

**Also flagged:** `ch.armorMods` is a third name-keyed per-piece map and belongs in the
same conversion pass as `ch.shieldWear`.

## Status Changes panel, BUILT and merged to main

Per the author spec of 2026-08-10 (`STATUS-CHANGES-SPEC.md`; the hazards branch predated
that file, which is why the notes below were written here rather than against it). Every clause of the spec is implemented and driven through
the real UI. What follows is what the spec left open and how it was resolved.

**The rename and the shared apply flow.** The Conditions panel is now **Status
Changes**. Conditions are untouched: same dropdown, same stacking, same levels. Two
more dropdowns sit beside it, `- add a Hazard -` and `- add a Bonus -`, and all three
feed the ONE `+ APPLY` button on the far right. Applying resets every dropdown to its
placeholder, whether or not it had a selection, so the header can never sit on a stale
pick. Applying from two dropdowns at once is allowed and lands both; the player picked
both.

**The standalone Environmental Hazards panel is retired.** Its content renders inside
Status Changes now, which is the point of the rework. `sectionEls.hazards` stays as a
slot that renders nothing, so a saved layout referencing it keeps working.

**Applied-ness is STATED, not inferred**, in a new `ch.hazards.applied` map plus
`ch.bonuses`. This is the invariant this codebase has now paid for twice, and it is
load-bearing here for a concrete reason: a deprivation clock at 0 days and a vacuum
clock at 0 rounds read **identically** whether they were applied a second ago or never
applied at all. Nothing in the numbers can tell those apart, so the record says which
it is. Exposures are the one exception and deliberately carry no key: an exposure ROW
exists only because one was applied, so the row is already the statement, and two cold
exposures still each run their own clock and their own DC.

**Legacy records get one read of the numbers, once.** A save written before this panel
has live hazard state and no `applied` map. Dropping a running clock off the panel
would be worse than a heuristic, so a record with **no map at all** seeds one from
what is actually running. Once the map exists it is authoritative, including when it
is deliberately empty. That is a migration, not an ongoing inference.

**Drowning moved to Conditions, and cannot drift from Vacuum.** The breath row builder
was extracted into one `breathRow()`. Vacuum calls it from the hazard blocks; Drowning
calls it from inside its own condition entry. Both read the same `EN.hazards.breath`
spec through `d.hazard.breath`, so the move changed WHERE it renders and nothing else:
there is no second renderer to drift.

**Vacuum has one door, not two.** It was both a hazard and a condition, and only one
of those doors started the breath clock. Applying Environmental > Vacuum now also
applies the Vacuum condition (which is what stops you speaking), and removing it
removes both; `Vacuum` is filtered out of the conditions dropdown so the state cannot
be entered halfway. Drowning is the mirror: the condition is the door, and it carries
the clock.

**Exposure severity moved onto the row.** The old panel had a type select, a severity
select and an ENTER button. Type is now the dropdown option; severity is a select on
the exposure row itself, because the weather can turn while you are standing in it.
Changing severity deliberately does NOT touch the save count: severity sets the
interval and nothing else, and the escalating DC belongs to the exposure.

**Mitigations surface only when the player has them.** `hazardMitigations` now returns
`possessed` beside `active`, and the panel lists only what is possessed. Gear is
possessed once it is in the STASH (new `gearInStash`) and greys when it is not on your
person; an armor mod is possessed if fitted to ANY suit you own (new `armorModOwned`),
so a mod on a spare greys rather than vanishing; a lineage trait is always on, so it
shows active with no toggle and simply says what you are benefiting from. The
per-hazard chips on the rows are unchanged and remain the other half of the spec.

**Gear Degradation stayed a rider** on Caustic Air & Sludge, as specified, rather than
becoming its own applied entry.

**Pneumatic Bypass finally has a path into the engine.** This closes the question open
since the unarmed rewrite. `BONUS_UNARMED_STEP` in `engine.js` reads the applied bonus
key and pushes one step into `unarmedIncreases`, so the comment that used to say "there
is nothing here to read" is now the code that reads it. It STEPS rather than SETS: a
Freelancer already punching 1d8 does not drop to 1d6 because an ally tuned their
servos. The three stale replacer prose sites were corrected to increaser wording in the
same pass (two in `class_stitcher_resources.js`, one at `briefs.js:179`), which also
closes the "fifth stale unarmed string" bullet above.

**Registry, not hardcoding.** `app/data/status_changes.js` builds both menus by walking
`EN.hazards` and the Stitcher's `aftermarketTunings`, so a new exposure type or a new
Hot-Wire appears in the dropdown with no edit to that file. A whole new group is one
push onto `.groups`. `optionByKey` is null-prototype, because it is indexed by keys
that arrive out of a save file.

**Driven through the real UI, not asserted.** Applying Cold, Thirst, Vacuum, Caustic
and Pneumatic Bypass, then the Drowning condition: all six land, the three dropdowns
reset to their placeholders, the badge reads `7 ACTIVE`, storage holds
`applied: [deprivation:water, environmental:vacuum, environmental:caustic]`,
`bonuses: [bonus:pneumatic-bypass]`, one exposure row at `cold/harsh`, and
`conditions: [Vacuum, Drowning]`. The unarmed strike goes from flat 1 to **1d4** with
the bonus row printing an `UNARMED 1D4` chip, and back to flat 1 when the bonus is
removed. All of it survives a full page reload. A character owning a Rebreather but
not carrying it shows `MITIGATIONS (0 OF 1 LIVE)` with the Rebreather greyed and "No
Rebreather carried or worn"; a character owning none shows no Mitigations section at
all. Removing Thirst, Vacuum and Caustic through their Remove buttons empties `applied`
and drops the Vacuum condition with it. No console error on any tab.

**One gap worth knowing.** An applied hazard's Remove resets the clock it drove, since
leaving a hazard resets both the clock and the DC. It does NOT clear Fatigue already
gained, which is correct: that is ordinary Fatigue on the ordinary recovery rules.

## The five hazard defects, ALL NOW FIXED, and the vacuum subsystem verified

The two surviving review lenses in `review-findings/wbkcw3wnd.json` were read (the
third, the vacuum lens, died on an API error and is absent; that subsystem is verified
below instead). Between them they confirmed five defects. All five are fixed, each
re-driven through the real panel buttons with the die pinned to 1 so failures are
deterministic, and each checked against the lens's own failing scenario.

**Two of the five were one root cause pointing in opposite directions, and it is the
`unattributable state` family this codebase has now paid for three times.** "How many of
my current Fatigue levels came from thin air" was stored on the live exposure ROW, and a
row's lifetime is not that attribution's lifetime.

- ~~**The thin-air Long Rest lock survives the Fatigue it was locking, then locks
  Fatigue that has nothing to do with thin air.**~~ **FIXED.** `row.fatigue` is only ever
  incremented, and `setCondLevel` (the path an ability or a medic uses, which the rules
  explicitly bless) never touched it. **Repro before, from the lens:** enter Thin Air,
  fail one save (Fatigue 1, locked 1), clear Fatigue through the condition's own Remove,
  and the character sits at Fatigue **0** with `longRestLockedFatigue` **1**; then a
  failed HEAT save gives a level that the Long Rest refuses as "thin air". **After:**
  clearing Fatigue reads `{fatigue: 0, thinAir: 0, locked: 0}`, and the Heat level reads
  `{fatigue: 1, thinAir: 0, locked: 0}`.
- ~~**LEAVE then re-ENTER at the same altitude launders locked Fatigue in two
  clicks.**~~ **FIXED.** The lock lived on the row, so deleting the row deleted the lock.
  **Repro before:** two failed thin-air saves (Fatigue 2, locked 2, Long Rest correctly
  refused), LEAVE, re-ENTER, Long Rest, and the toast reads "restored and refreshed" with
  Fatigue **1**. **After:** re-entering reads locked **2** again and the Long Rest is
  still refused with the altitude toast; Fatigue stays 2.

**The fix.** `ch.hazards.thinAirFatigue`, character-scoped: incremented on a thin-air
failure, decremented in `setCondLevel` when Fatigue is cleared, and clamped by the engine
to the Fatigue actually held. The lock only APPLIES while a thin-air exposure is live,
because the rule is about a Long Rest taken *at the same altitude*, so descending
suspends it and climbing back re-applies it to the same levels. Descending for real and
resting then does drop Fatigue 2 to 1, which is the behaviour the rules want and the one
the laundering exploit was faking. Thin-air levels come off FIRST on a partial clear:
the rules do not say which levels a partial clear removes, and the asymmetry of harm
decides it the way the rig ruling did, since a wrongly-LOCKED level silently denies a
player a recovery they were entitled to. Legacy saves recover the count by summing the
thin-air rows' own tallies once, capped by real Fatigue, so a record that had ALREADY
drifted lands correct rather than importing the drift: a legacy record with `fatigue: 3`
on the row and Fatigue 2 on the character migrates to `thinAirFatigue: 2`, stable across
three loads.

- ~~**A deprivation track can end and restart without resetting its DC.**~~ **FIXED** in
  `depDay`. An exposure cannot get this wrong because LEAVE deletes the row and the DC
  lived nowhere else; deprivation has no row to delete. **Repro before:** Thirst at 1 day
  with three failed saves (DC 16), step days down to 0 and the exposure ends, step back
  up and a fresh thirst resumes at **DC 16**. **After:** stepping below the threshold
  zeroes `saves` and `clockMinutes`, so it reads DC **10** on the way down and DC **10**
  when crossed again. Fatigue already stacked is untouched, exactly as for an exposure.
  Stepping the counter down is the natural gesture for "I got a drink yesterday", so this
  could not be left to remembering RESET.
- ~~**The Hazmat Suit blocks the caustic damage but not the gear degradation it is
  physically standing between.**~~ **FIXED.** `causticArmorDR` never received `fx`, so
  `blocksCaustic` and `immuneCaustic` could not reach it. **Repro before:** Vanguard Plate
  (unsealed) under a worn, untorn Hazmat Suit in caustic, and the panel prints "No damage
  inside it: Hazmat Suit" and "Vanguard Plate is unsealed and will lose 1 DR after a full
  scene in it" in the same block, with MARK FULL SCENE enabled and writing the ledger.
  **After:** `blockedBy: "Hazmat Suit"`, `exposed: false`, MARK FULL SCENE **disabled**,
  and the line reads "Hazmat Suit is worn over Vanguard Plate and keeps the caustic off it
  too, so it does not degrade." MARK TORN puts `exposed` back to **true**, so the suit's
  own failure mode still bites. `causticScene` already guarded on `dg.exposed`, so the
  write path closed with it.
- ~~**Shaken does not cancel the mitigation Edge on hazard saves.**~~ **FIXED** in
  `hazardSave`. Shaken's own text says it prevents benefiting from Edge "from any
  source", and every other d20 surface in the app honours that; this one did not.
  **Repro before:** Ration Discipline plus Shaken, thin-air save, spec `{edge:1}` and two
  dice rolled. **After:** unshaken reads `{edge:1, snag:0}` and Shaken reads
  `{edge:0, snag:0}`, on the exposure and on all three deprivation tracks. The Snag half
  is deliberately untouched: Shaken imposes Snag on attacks and Wits checks, not Body Saves.

### The vacuum subsystem, now verified

The lens that was meant to cover this died, so it was driven directly. **The seal matrix
is exactly the rule**, including the part the rule goes out of its way to state, that the
Sealed trait alone never holds vacuum:

| worn | holds vacuum | via |
| ----- | ----- | ----- |
| no armor | no | |
| Riot Wall (Sealed) | **no** | |
| Riot Wall + Rebreather Liner | yes | Rebreather Liner on Riot Wall |
| Vanguard Plate (unsealed) + Liner | **no** | |
| Warframe Shell | yes | Warframe Shell (native) |

**The clock is right too**, at Body 4: held breath is 4 rounds (rounds equal to the Body
SCORE, not the modifier), ticking down 4/3/2/1/0 with no save and no damage; then the
saves begin and escalate 10, 12, 14, 16, 18 at +2 each; each failure costs exactly 1
Wound, 4 to 3 to 2 to 1 to 0; Unconscious lands at 2 Wounds, which is at or below half of
4, and not before; and 1d6 Cold every round regardless of the save is carried on the row.
Void Lung suspends the whole thing: `clockStarts` goes false and the tick button
disables, since fifteen minutes of held breath outlasts any scene.

### Still open from these lenses, deliberately

- **The Thermal Regulation Weave's Resistance is neither applied nor displayed inside the
  hazard.** The mod grants "Resistance to Fire or Cold" beside its no-Fatigue clause, but
  `hazards.js` encodes only `noFatigueChosen` and the Lethal rider's damage passes through
  untouched. This is the already-declared "no damage pipeline to reduce" gap, one item
  over, and fixing it means building damage application rather than editing a number.
  Radiation Callouses taking the full 1d6 Cold is NOT this bug: that trait grants
  Resistance to Radiation, not to Cold.

### What both lenses found clean and could not break

Per-instance DC escalation with two concurrent exposures; success restarting the clock but
not the DC; leaving resetting both while Fatigue persists; the three deprivation clocks
genuinely independent; eight of nine mitigations proven to change a real outcome through
the real buttons, including the fiddly Ration Discipline wording (Thirst threshold stays
1, Hunger and Sleeplessness go 3 to 6) and Frictionless Stasis stopping the residue but
not the acid you are standing in; persistence byte-identical across reloads; and hostile
persisted state (`__proto__` and `constructor` as exposure ids) round-tripping onto the
null-prototype maps leaving `Object.prototype` clean.
## Step 5: Armor Repair, MERGED to main 2026-08-10

Armor Repair was built and mostly working, but review found defects serious enough that
it was held on `armor-repair-wip` rather than `main`. It merged once all five were closed
and the per-piece entry floor it stands on was made real rather than merely claimed. **All five are now CLOSED,
each reproduced live before it was touched and re-checked against its own repro after.**
Their entries are struck below and carry the before-and-after numbers. The one remaining
item in this section is the per-ROW versus per-PIECE hole, which was deliberately left
alone and still wants its own verification run.

**Verdict: the branch is mergeable.** See "Is the branch mergeable" at the end of this
section for what that claim rests on and the one thing it knowingly carries.

**~~Blocking, data corruption: the migration lands name-keyed wear on a different piece
than the one damaged.~~** **FIXED in `app/js/store.js`, in `migrateWearMap`.**

The rule was "a key that names an owned item's NAME becomes that item's FIRST owned
entry". The first owned entry is not the damaged one. **Repro, through the real
`importCharacter`:** a record owning two Anvil Frames (`eq_a1`, `eq_a2`) with `eq_a2`
WORN, plus legacy `armorWear:{"Anvil Frame":3}`, `armorGuard:{"Anvil Frame":true}` and
`shieldWear:{"Scrap Shield":2}` over two Scrap Shields with `eq_s2` wielded, migrated to
`armorWear:{eq_a1:3}`, `armorGuard:{eq_a1:true}`, `shieldWear:{eq_s1:2}`. The worn suit
read **5/5** and `d.armorDR` **5**, while the spare sitting in the Stash read **2/5** and
held the quality edge, and the wielded shield read a full **2/2** boxes while the spare
took the destruction. Every number moved one piece over, silently, on one load.

**The resolution rule now, stated plainly.** A key that already names a live entry is
kept, which is what makes the pass idempotent. Otherwise the key is an item NAME and is
attributed only when one entry can be named with confidence:

1. **the EQUIPPED piece**, when it is one of the entries carrying that name;
2. otherwise **the single owned entry** of that name, when exactly one exists;
3. otherwise **nothing: the state is dropped.**

Clause 1 is attribution and not a tiebreak, and that is the part worth keeping. A legacy
name key could only ever have described the piece in the slot: on `main` the reader is
`(ch.shieldWear || {})[shield.name]` with `shield` the WIELDED shield, and the only
writer, `markShieldWear`, returns early unless a shield is wielded and writes
`dg.shield.name`. Armor DR was likewise only ever read for `ch.equippedArmor`. So the
worn piece is not a guess about where the damage was, it is the definition. Clause 3 is
invariant four: two candidates and nothing to choose between them means the record cannot
say which suit was damaged, and losing the wear costs one typed number the player can see
is gone, while moving it is invisible and unrecoverable.

**After:** the same record migrates to `armorWear:{eq_a2:3}`, `armorGuard:{eq_a2:true}`,
`shieldWear:{eq_s2:2}`; the worn suit reads **2/5** with the guard, the spare is untouched
at **5/5**, and the wielded shield carries its two boxes. Eight migration shapes were run
through `importCharacter` and re-migrated twice more, **all eight byte-stable across three
loads**: the defect shape; two of a kind with NONE worn (drops to `{}`, never moved);
exactly one owned and not worn (kept); a legacy id-less `qty: 2` row whose `equippedArmor`
was still a bare NAME (lands on the split's first instance, matching where the split put
the equip slot); a name nobody owns (dropped); prototype keys, junk values and non-object
maps (all `{}`, no throw); an already entry-keyed map (untouched); and a stored wear of 99
against a base of 5 (reads 0/5, stable).

**~~Blocking, spec violation: the bench gate IS a new gate.~~** **FIXED by choosing
(b), advisory everywhere, and deleting `meetsTier`.**

**Repro:** `grep -rn "meetsTier" app/` returned the definition plus exactly one call,
`inventory.js:1778`, the bench lane. Four `tbStart` call sites exist: the bench repair
(gated), the 0 DR rebuild (ungated), the custom Project form (ungated) and the Blueprint
build (ungated). On screen an untrained Engineer saw `⚒ BENCH · 𝒢138` disabled on a suit
whose `⚒ REBUILD PROJECT · 𝒢500` and whose every Blueprint Build were one click away.

**Why (b) and not (a).** The premise the original instruction rested on was wrong, so the
choice had to be made rather than inherited, and advisory is what this app has always
done: `skillTier` was DISPLAYED as "Expects Proficient" and never asked, and the system's
own idiom for insufficiency is friction, not refusal. An untrained crafter already pays
+2 Snag Dice on every Work Interval, and `EN.crafting.rules.kits` says a missing kit
"can raise the Target or add Snag" rather than closing the work. Option (a) would lock
untrained characters out of every Build, every custom Project and every rebuild in the
app, which is a rules change nobody authored and which the earlier scope note explicitly
declined. Removing one call site is provably uniform; adding four is a behaviour change
across all of crafting that would need its own verification run. `meetsTier` was deleted
rather than left unused, so the next person cannot wire it into one more lane; a comment
in its place records the ruling.

**Where the rule is applied, uniformly: nowhere, at all four Project creation sites.** The
bench lane now renders an `UNTRAINED +2 SNAG` chip beside an enabled button, the same chip
the Fabrication Profile already prints. Verified: an untrained Engineer opens
`Repair Anvil Frame (+1 DR)`, Simple, target 3, `+2 UNTRAINED` on the Snag row, and
completes it; the same character opens and completes an ordinary `Build Liner Mesh`.

**~~Rules fidelity: leased armor is priced off the lease deposit.~~** **FIXED with
`EN.crafting.listPrice(it)`**, which is the distinction the app already draws
(`inventory.js buyoutCost`, gated on `it.upkeep`, reading a numeric `buyout` or the ◎
figure in the `nexus` tag; the vehicle mapping says outright that a lease row is "price 0
with buyout set"). A leased item's `price` is the buy-in; its Buyout is what the object is
worth. A ◎ Buyout converts at the reference value the economy chapter already states
(`EN.economy.nexusToGlimmer`, 10,000), which is explicitly the ledger number and is used
for nothing but reading a listed value; no wallet converts.

`shopCost` and `benchCost` now take the ITEM rather than a bare number, so no call site
can reach for `it.price` again, and the rebuild uses `armorRepair.rebuildCost` (half the
listed price) instead of `materialCost` (half `price`). **Before and after**, Sentinel
Issue (deposit 150, Buyout 1000, 3 DR): 1 point **𝒢15 -> 𝒢100**, 3 points
**𝒢45 -> 𝒢300**, rebuild **𝒢75 -> 𝒢500**. Bailiff Rig (deposit 430, ◎0.3 Buyout, 5 DR):
listed **𝒢3,000**, 1 point **𝒢300**, rebuild **𝒢1,500**, and 5 points at 300 is half of
3,000, so the rate derivation survives. Everything unleased is unchanged to the Glimmer:
Anvil Frame stays 𝒢92 per point, 𝒢184 for two, 𝒢460 to rebuild, and `materialCost` itself
is untouched, so Blueprints price exactly as before.

**~~Rules fidelity: both lanes are all-or-nothing.~~** **FIXED.** Each damaged piece now
carries a points picker (`− n / lost +`) defaulting to the whole loss, and both lanes
price the picked number. **Repro before:** the row read `REPAIR 3 DR` with `SHOP · 𝒢276`
and no way to buy less. **After, driven through the real controls:** stepping an Anvil
Frame at 3 lost down to 1 reprices to `SHOP · 𝒢92` / `BENCH · 𝒢46`; the shop click takes
exactly 𝒢92 (5000 -> 4908) and moves the suit 2/5 -> 3/5 with the other two pieces
untouched; a 1-point bench Project opens as `Repair Anvil Frame (+1 DR)` at 𝒢46 in parts
and restores exactly 1.

**~~Rules fidelity: a repair Project can complete without paying, and one path debits
payment and restores zero DR.~~** **BOTH FIXED, and they cannot be separated by any
ordering.**

*Completing without paying.* **Repro, through the real COMPLETE button:** a
`Repair Anvil Frame (+3 DR)` at 3/3 Progress with `Materials 𝒢138` unsecured completed
anyway; Glimmer stayed at 1000, the suit went 2/5 -> 5/5 and it even earned the quality
edge. **Fixed** by gating completion on the materials: `tbUnpaid(p)` is
`!materialsSecured && materialCost > 0`, the COMPLETE button is disabled while it holds
with a `Materials still owed` note beside it, and `tbComplete` re-checks it rather than
trusting the button. This is deliberately uniform across all Projects, not repair-only:
the same run confirmed a Blueprint `Build Liner Mesh` at 5/5 Progress refuses to complete
until its 𝒢40 is secured, then completes and lands in the Stash. Salvage still costs
nothing and still needs its one SECURE (FREE) click to declare the parts found.

*Paying for nothing.* Two paths, both closed. **Repro A, through the real buttons:**
SECURE a bench repair for 𝒢138, repair the same suit at the shop for 𝒢276, then COMPLETE.
The Project restored 0 DR and the 𝒢138 was simply gone. **Repro B:** SECURE 𝒢138, drop the
piece from the Stash, COMPLETE; the card correctly showed `PIECE GONE` and still kept the
money. **Fixed:** `tbSecure` records `materialsPaid`, and a repair Project that completes
with nothing to restore hands that money back. After: Repro A ends 4724 -> **4770**, Repro
B ends 4862 -> **5000**.

*The ordering guarantee.* `armorShopRepair` used to price and purse-check against the `st`
captured when the row rendered, then apply the delta to whatever the character looked like
later. Reproduced by firing one rendered SHOP button three times: **1000 -> 172**, 𝒢828
charged for 3 points restored once. It is now one `store.update` that re-reads
`armorState` live, clamps the points to the live loss, prices and purse-checks off that,
and charges only for what the writer actually gave back. The same three clicks now cost
**1000 -> 724**, 𝒢276 once. The lease ledger already guarded its writes this way ("a
double-fire cannot double-charge"); the repair lane does now too.

**Still open, not fixed, reproduced, and it lands on this step:** the split's skip clause
short-circuits on `e.id` before looking at `qty`, so entry identity holds per ROW and
not per PIECE. One id-carrying row with `qty: 3` is three suits sharing one DR track,
verbatim the "two Kevlar Weaves share a repair state" case. Import and hand-edit only.
The fix is one clause in the split affecting every multi-quantity row of every gear
type, so it wants its own seeded-RNG verification run like the two before it.

**Worth keeping from this round:** the implementer chose `ch.armorWear` (points LOST)
over the sketched `ch.armorDR` (current value), because absent then means undamaged and
a re-acquired piece arrives fresh with no heuristic, matching `ch.rig.hp` and
`shieldWear` in one shape. That reasoning is sound and survived the fixes untouched: the
state shape did not change. It also found and fixed a defect in its own work: two writers
existed briefly and the Impact Table's ignored the quality guard, now collapsed to one
writer that clamps both directions.

### Verification run for the five branch fixes

Own origin `http://localhost:8842`, forced reload before every reading, own launch config
removed and server stopped afterwards. Everything below was re-run AFTER the changes.

- **Attribution.** Eight migration shapes through `importCharacter`, each re-migrated
  twice more: zero throws, all eight byte-stable across three loads, and every one lands
  where the rule above says it should. Detailed in the struck bullet.
- **Roster-wide stability.** 34 records written to `localStorage` and re-read through the
  real `EN.store.load()` three times, fingerprinting `equipment`, `carry`, `racked`,
  `rig.hp`, `armorWear`, `armorGuard` and `shieldWear`: byte-stable. The only movement in
  the whole run was the one-time prune of an `armorWear` orphan for a piece deliberately
  deleted mid-session, which is the same behaviour `ch.rig.hp` orphans already have.
- **Two pieces of one type stay independent.** Two Anvil Frames damaged 2 and 1 through
  the one writer read `eq_t1 3/5` and `eq_t2 4/5`, and the worn suit defends as 3.
- **DR clamps both ways.** Over-damage by 99 stops at `0/5`, over-repair by 99 on a
  damaged suit lands exactly `5/5`, over-repair on an undamaged one stays `5/5`, and a
  missing entry and a zero delta are both inert. The quality guard absorbs exactly one
  point (`5/5`, guard spent) and the next one lands (`4/5`).
- **Every reader current.** Freelancer DR tile `1`; DR breakdown row
  `Armor · Resonant Carapace (1 of 3, 2 lost)` with the damaged-plating footer; gear chip
  tooltip `1 of 3 DR · +1 Block · 1d6 Ward · 2 slots`; Block card `PLATING 1 / 3 DR □■■`;
  Stash card `⛨ 1 / 3 DR`; print sheet `Resonant Carapace · 1 of 3` and
  `DR 1 of 3 (2 lost, until repaired)`; PDF built (166,286 bytes) with `armorState`
  instrumented and logging `eq_r1->1/3`.
- **Shield Durability per entry, through the real − WEAR button.** Wear shield A once
  (`1/2 left`), swap to B (`2/2`, A's box did not follow), wear B twice
  (`0/2`, `shieldAlive false`), swap back to A (`1/2`, still alive). Stored map
  `{eq_sa:1, eq_sb:2}`.
- **Lapsed leases unchanged.** A Sentinel Issue reads 3, then 2 with 1 lost, then 1
  lapsed, then 0 lapsed and breached, then 0 paid and still breached.
- **All seven tabs and all five Workbench benches** rendered for **34 characters**: zero
  throws, zero console errors.

### Is the branch mergeable

**Yes.** All three Blocking and Rules-fidelity items are closed with a live reproduction
on each side, the state shape is unchanged, the five inherited invariants all still hold
(entry-key state; migration after the split; null-prototype maps on user strings;
unattributable state dropped rather than moved, which the attribution fix strengthens
rather than relaxes; one resolver and one writer), and nothing outside Armor Repair
changed except two deliberate, verified uniformity decisions.

Three things a merge knowingly carries, none of them defects in this work:

- **The tier requirement is now advisory at all four Project sites**, where it used to be
  enforced at one. That is a real behaviour change to the bench lane (it opened) and it is
  the decision recorded above.
- **No Project of any kind can be completed with its materials unpaid.** This lands on
  Blueprints and custom Projects as well as repair, deliberately, and was verified there.
- **The per-ROW versus per-PIECE hole is still open**, unchanged and untouched, exactly as
  the constraint required. It is import and hand-edit only, and it is the first thing to do
  next in GROUP C.

## BRANCH STATUS after the defect-fix round

**All five defects are now fixed.** Defect 1, the blocker, was closed by the design
change below rather than by a fourth patch.

- ~~**STILL BLOCKING: the live-key fast path bypasses attribution.**~~ **FIXED, by
  making idempotency STATED rather than inferred.**

  The old shortcut was `if (wearLiveKeys[k]) key = k;`, which decided "this key is
  already converted" by testing whether it happened to name a live entry. That is an
  inference from the key's SHAPE, and the shape is ambiguous: `entryKey()` is
  `e.id || e.name`, so ids and names share one flat namespace and a string can be a
  live key for one entry and the item NAME of others at the same time. The test could
  not tell a converted key from an unconverted one, because in that case they are
  literally the same string.

  **The record now says which scheme its maps use.** `ch.meta.wearKeys` is absent on
  every save written before this migration, which is exactly what "these keys are item
  names" means, and it is stamped to `2` once all three maps have converted (stamped
  after, so a throw midway cannot leave the record claiming a conversion that did not
  finish). Under the legacy scheme EVERY key goes through attribution and there is no
  shortcut to take; under the current scheme every key is already an entry key and the
  only work left is the prune, the way `ch.rig.hp` prunes so the map cannot grow across
  a campaign. `newCharacter()` stamps it too, since a record born there is entry-keyed
  by definition.

  This closes the collision on the rules' own terms rather than by special-casing it:
  the ambiguous key now reaches rule 1, which picks the EQUIPPED piece, and reaches
  rule 3 (drop, never relocate) when nothing distinguishes the candidates.

  **`equippedEntryKey` had the identical root cause in its own first clause** and is
  fixed the same way: being a live key is proof of identity only when nothing else
  answers to that string as a NAME, otherwise it falls through to the name rules.

  **Repro before, the lens's exact shape, through the real `importCharacter`:**
  `equipment: [{id:"Anvil Frame", name:"Bastion Plate"}, {id:"eq_a2", name:"Anvil
  Frame"}]`, `equippedArmor: "eq_a2"`, `armorWear: {"Anvil Frame": 3}`,
  `armorGuard: {"Anvil Frame": true}`. Both maps stay keyed `"Anvil Frame"`, so the
  loss and the quality edge land on the **Bastion Plate**, a suit that was never hit,
  while the worn Anvil Frame reads full. **After:** `{"eq_a2": 3}` and
  `{"eq_a2": true}`, on the suit that was actually damaged.

  **One correction to the lens, in its favour and against mine.** A first attempt to
  reproduce this used a POOLED row of the same name rather than an id-equals-name
  collision, and it did not reproduce: armor is non-stackable, so the split gives every
  armor row an `eq_` id and no name-keyed armor row can exist. The lens's shape, a
  hand-authored `id` that happens to be an item name, is the reachable one, and it
  reaches through `importCharacter`, whose whole job is ingesting foreign records.

## The two `w4qe3petu` findings, both now FIXED

The three lenses in `review-findings/w4qe3petu.json` were read on 2026-08-10. Their
prototype-key finding was already closed before that commit (`reservedIds`, `usedIds` and
`liveKeys` are `Object.create(null)`), and their large clean list holds. Two findings were
still live in the code, and one of them was load-bearing for this branch.

- ~~**The floor is per-ROW, not per-PIECE.**~~ **FIXED in the split.** The skip clause was
  `if (e.id || !(e.qty > 0) || stackable)`, and `e.id` short-circuited before `qty` was
  ever looked at, so an id-carrying non-stackable row with `qty > 1` was never split.
  **Measured before:** `{id:"eq_x", name:"Anvil Frame", qty:3}` stayed ONE row with one
  wear key and one piece, while the same three suits authored id-less split into three;
  the rig equivalent returned `ownedRigs` of **1** for three owned rigs, one picker
  option, one damage slot. **After:** three rows `eq_x` plus two minted, three distinct
  keys, `ownedRigs` **3**, and the wear, the guard, the recorded pick, the damage and
  `equippedArmor` all still on `eq_x`. **The first instance keeps the row's original id**,
  for the same reason the duplicate pass keeps it for the first-seen row: every per-entry
  map already points at that id and meant this row. The instances split off it are new
  objects with minted ids and therefore no per-entry state, which is the settled ruling
  that unattributable state is dropped rather than duplicated.
- ~~**`nameToIds` is a bare object literal.**~~ **FIXED.** It was the one map in the block
  the earlier prototype pass missed. **Measured before:** an item named `constructor` with
  `carry: {"constructor": "carried"}` migrated to `carry: {"null": "carried"}`, because
  `nameToIds["constructor"]` read back the Object constructor (truthy), took the
  `firstId()` branch, and `firstId()` returned `null`. The item's carry state was
  destroyed and replaced by a key that is the literal string `null`. **After:** the key
  survives as `constructor`.

**A regression this pass introduced and then closed, worth recording because it was not
obvious.** Making idempotency stated meant an UNMARKED record sent every wear key through
name attribution, which is right for `shieldWear` and wrong for `armorWear` and
`armorGuard`: those are NEW fields with no legacy name-keyed form, so any record carrying
them without the marker was written by this branch and is already entry-keyed. Attribution
found no item of that name and dropped the wear. Caught by the fingerprint run, which
showed `armorWear: {eq_a: 2}` becoming `{}`. Closed with the narrowing the review itself
recommended: **rule 0**, a key that names a live entry AND that nothing else answers to as
an item NAME is unambiguously that entry and is kept. That is not the old shortcut, which
fired on "is this a live key" alone; the ambiguous case still re-enters the rules, which
is why the id-equals-name collision still lands on the equipped suit.

**Verification, thirteen shapes plus a twelve-shape no-op run.** Zero throws, all stable
across three loads, `Object.prototype` clean, no console error on seven tabs for two
classes. The regression guard (entry-keyed but unmarked) keeps its wear; the blocker
(id equal to another row's name) still lands on `eq_a2`; a legacy shield name still lands
on the wielded shield; two suits with none worn still DROP rather than relocate; pooled
`qty:5`, unowned `qty:0` and a numeric-string `qty:"3"` all behave as before. **The no-op
run compared this change against the previous commit with a seeded LCG: 11 of 12 shapes
byte-identical, and the single shape that changed is the regression guard, changing in
the direction that recovers state rather than losing it.**

### Still open from these lenses, not fixed here

- **A `null` element in `ch.equipment` throws, and `load()` answers by wiping the whole
  roster.** On the import path it throws before storing, which is safe; the dangerous case
  is a record already in localStorage. Pre-existing, unrelated to this branch, and it
  belongs with L10 and L12 in one hardening pass rather than bolted on here.

**Verification for the attribution redesign, twelve migration shapes through
`importCharacter`, each re-loaded twice more.** Zero throws, **all twelve byte-stable across three loads**, and
`Object.prototype` clean afterwards. Normal single suit lands on `eq_a`; two suits with
one worn lands on the WORN one; two suits with none worn DROPS rather than relocating;
the id-equals-name collision lands on `eq_a2`; an `equippedArmor` that is itself a
colliding bare name resolves to `eq_x`; an already-converted record keeps `eq_a` and
prunes the dead `eq_dead`; a `qty`-less row gets its minted id and keeps its wear; a
legacy shield name with two Scrap Shields lands on the wielded one; junk values, an
array in place of the map, prototype-named ids (`constructor`, `toString`) and a record
with no `meta` at all all normalize without throwing. All seven tabs render for two
classes with no console error.

**Fixed this round, with evidence:**

- **Tier gate, resolved as advisory everywhere.** `meetsTier` is deleted so it cannot be
  re-wired into one lane, and the ruling is recorded where it stood. Reasoning worth
  keeping: the ruleset's idiom for insufficiency is friction rather than refusal, since
  untrained already pays +2 Snag and missing kits raise the Target. Enforcing tiers
  would have locked untrained characters out of every Build and rebuild, an unauthored
  rules change. Removing one call is provably uniform; adding four is not.
- **Leased armor prices off listed price**, using the buyout distinction the app already
  draws. Sentinel Issue went from 𝒢15 to 𝒢100 for one point. The rate derivation still
  holds: five points is half the listed price.
- **Both lanes are per point**, with a picker defaulting to the whole loss.
- **Payment cannot be skipped or wasted.** No Project of any kind completes with
  materials unsecured, a zero-restore repair refunds, and the shop lane re-reads state
  inside one update rather than off a stale render snapshot. That last one was real: one
  rendered button fired three times charged 𝒢828 for three points restored once.

**Two deliberate uniformity changes a merge knowingly carries:** the tier requirement is
now advisory at all four Project creation sites where it used to be enforced at one, and
no Project of any kind can complete with its materials unpaid.

~~**Two lens reports from this round are unread**, in `tasks/wmudlussk.output`. Read them
with the attribution fix.~~ **READ 2026-08-10.** See the section below; the archived copy
is `review-findings/wmudlussk.json`.

## The last two unread review files, read 2026-08-10, and the six live findings closed

`review-findings/wx7cb0612.json` (all three lenses, never opened) and lenses 1 and 2 of
`review-findings/wmudlussk.json`. Both cover Armor Repair, which merged in `ae06cb1`, so
they reviewed shipped code rather than blocking a merge. **Nothing in the archive is
unread now.**

Between them they raise eighteen distinct items. Twelve were already closed by commits
that landed after the reviews ran, and each of those was re-checked against the current
code rather than taken on the log's word. **Six were still live, all six are now fixed in
`cfc4886`,** each reproduced through the real UI before being touched and re-checked
against its own repro after.

### The six that were live

**~~1. `tbComplete` re-entry MINTS Glimmer.~~ FIXED.** `wmudlussk` lens 2, and the worst
thing in either file. **Severity: high, in-app, no import.** It took the Project OBJECT
captured at render, spliced it out of the list by id, and then paid a refund read off
that still-live object. A second fire recomputed `restored` as 0, because the suit was
already whole, and paid the refund again. **Repro, one rendered `✓ COMPLETE` node fired
four times** on an Anvil Frame at 2/5 with a secured `𝒢138` bench repair:
`5000 -> 4862` (the legitimate repair), then **`5000`, `5138`, `5276`**. Every further
fire adds another 138. `tbSecure` already carried exactly this guard ("a double-fire
cannot double-charge") and `armorShopRepair` already re-read live; the one function that
pays OUT had neither. **Now every read and every write happens inside one
`tbSetProjects`, which re-finds the Project by id and returns without doing or saying
anything when it is gone.** `p` is used for its id and nothing else. **After: `4862`
across all four fires, one repair, and the later fires emit no toast.**

The same re-entry handed out one Build item per fire off a single payment. That half was
**pre-existing on main**, not introduced by Armor Repair, and it is closed by the same
change: `Build Ablative Coating` fired four times off one node now yields **one** coating
for one `𝒢225`, where it used to yield one per fire.

**~~2. Abandoning a repair keeps the parts money.~~ FIXED.** `wmudlussk` lens 2.
**Severity: medium, fully user-reachable, and it contradicts the rule the same branch had
just written three lines above it.** **Repro:** `⚒ BENCH · 𝒢138`, `SECURE · 𝒢138`
(`5000 -> 4862`), then `✕`. The Project is gone, the suit is still 2/5, and the 𝒢138 is
simply gone with no refund and no warning; the confirm string mentioned only Progress.
Meanwhile the identical zero-restore outcome reached through `COMPLETE` refunded. Two
doors out of one room with opposite answers, and the one that kept the money is the one a
player reaches when they cannot afford to finish. **After: `4862 -> 5000`, toast
"Project abandoned; 𝒢138 in parts refunded", and the confirm now says the money comes
back.** Re-firing the detached `✕` node cannot refund twice. **Build Projects are
deliberately untouched:** their materials are consumed by the attempt and `COMPLETE` does
not refund them either, so `✕` on a `Build Ablative Coating` still keeps the 𝒢225.
Verified both ways in the same run.

**~~3. A partial repair keeps the difference.~~ FIXED.** `wmudlussk` lens 2. The refund
fired only when `restored` was exactly 0, but parts are priced per POINT. **Repro:** open
a 3-point bench repair (`𝒢138`), secure it, repair the same suit 2 points at the shop
first, then complete. The Project restores **1** point, the toast says so, and the wallet
does not move: `𝒢138` in parts bought `𝒢46` of work and the other `𝒢92` was kept.
**After: the refund is the unused share,** `floor(paid * (repairPoints - restored) /
repairPoints)`, floored so rounding can never mint. Same repro now ends
`4678 -> 4770`: `𝒢92` back, `𝒢46` spent, which is the listed one-point bench rate to the
Glimmer. The all-or-nothing case is unchanged, because `restored` 0 makes the share the
whole thing.

**~~4. A shield announces its own destruction one box early.~~ FIXED, by giving shields
the resolver they never had.** `wx7cb0612` lens 0, filed as F1 with F6 named as its root
cause, and the lens was right about that. **Severity: medium, in-app, no import.**
`markShieldWear` re-derived "boxes left" out in the view by adding the delta to
`ch.shieldWear` a second time, after `store.update` had already added it to that same
object (`store.update` mutates the record `store.active()` returns, which is the same
object the render closed over). **Repro through the real `− WEAR` button, toast captured
off the live node:** a 3-box Riot Shield on click 2 reads `wear {eq_sh1:2}`, **2 boxes
left, alive, still granting its `1d6` Block die**, and toasts "Riot Shield is destroyed;
the wreck is salvage." A 2-box Scrap Shield says it on the **first** click. The panel
contradicted itself in one frame, and the toast is the only thing that tells a player the
shield is gone.

The fix is the one the lens asked for, not a patch to the arithmetic. **`EN.engine.shieldState(ch, key)`
is now THE resolver** (`{key, name, item, boxesMax, spent, left, worn, alive, destroyed,
emitter}`) and **`EN.engine.applyShieldWear(c, key, delta)` is THE writer**, returning
what it did so the toast reads that rather than re-deriving anything. `defensiveLoadout`
reads the resolver too, and carries the whole record as `d.defenseGear.shieldState` the
way it already carried `armorState`. **After: the toast fires exactly once, on the click
that actually destroys the shield, for both box counts, and a click past zero changes
nothing and says nothing.** Two shields still hold their wear independently through the
real buttons, and `+ REPAIR` runs through the same writer.

One deliberate narrowing came with it: `shieldBoxesMaxOf` now requires
`it.kind === "shield"`, where the old inline derivation accepted anything in the armor
catalog and defaulted it to 3 boxes. That is what lets the migration use the resolver as
a capacity cap, and the only state it changes is a non-shield sitting in
`ch.equippedShield`, which grants no Block die and no Defense either way.

**~~5. Out-of-range stored wear eats a paid repair whole.~~ FIXED at both ends.**
`wx7cb0612` lens 0, F3. **Severity: medium, import and hand-edit only, but the money is
real.** `migrateWearMap`'s `positiveInt` accepted any finite positive number, and
`applyArmorDamage` added its delta to the RAW stored value rather than to the resolver's
clamped one. The display was right and the write was not. **Repro, end to end through the
real buttons:** import `armorWear: {eq_o1: 999}` on a base-5 Anvil Frame. It survives
migration and every reload, displays correctly as 0/5 BREACHED, and then
`⚒ REBUILD PROJECT · 𝒢460` secures, runs three Flawless intervals, completes, and the
suit is **still 0/5 breached** while the toast announces "back to 5 of 5 DR". The writer
had computed `clamp(999 - 5, 0, 5) = 5`. No refund fires either, because `restored`
computed as 5.

Fixed in two places on purpose. **The writer now applies its delta to `armorState().lost`,**
which is the clamped answer, so the first write to any piece heals a bad stored value.
That is the one-resolver rule applied to the writer's INPUT, not only to readers.
**And `migrateWearMap` clamps to the piece's own ceiling,** so storage is honest rather
than merely displayed honestly: a suit's `dr` for `armorWear` and `armorGuard`, a
shield's `boxes` for `shieldWear`, both asked of the same resolvers every surface asks.
**After: `999` migrates to `5` and `99` to `3`, and the same 𝒢460 rebuild leaves the suit
at 5/5.** `applyShieldWear` heals the same way: a planted `99` on a 3-box shield takes one
`+ REPAIR` to read 1 of 3.

A key whose cap is **0** is dropped rather than clamped, which is the same ruling the
block already applies to a key whose entry has left the stash: it names nothing that can
wear. That is what removes an `armorWear` row parked on a Dagger, and a `shieldWear` row
parked on a suit of armor.

**~~6. The wear conversion depends on JSON key order.~~ FIXED with a second pass.**
`wx7cb0612` lens 0, F4. **Severity: low, reachable on any half-converted file (hand-merged,
or exported mid-refactor).** In one pass, whichever key reached an entry first claimed it
and `out[key] != null` dropped the other, so the authoritative entry key lost half the
time. **Repro through the real `importCharacter`:**

    {"eq_d1":1, "Anvil Frame":4}   ->  {eq_d1: 1}
    {"Anvil Frame":4, "eq_d1":1}   ->  {eq_d1: 4}
    {"Riot Shield":2, "eq_s1":1}   ->  {eq_s1: 2}
    {"eq_s1":1, "Riot Shield":2}   ->  {eq_s1: 1}

Two logically identical records, two different numbers. **Rule 0 keys (unambiguously an
entry already) are now resolved across the whole map FIRST, and only then do the name
rules run.** The answer is a property of the record rather than of its serialization.
**After: both armor orders land on `{eq_d1: 1}` and both shield orders on `{eq_s1: 1}`,**
which is the entry key winning in both directions.

### Three more from the same files, fixed in the same commit

Smaller, and none of them a defect in the sense the six are, but all three are the record
disagreeing with itself.

- **~~The three wear maps are born on `Object.prototype`.~~ FIXED.** `wx7cb0612` lens 0,
  F5. `blank()` declared them as plain literals and the `|| {}` fallbacks in `engine.js`
  and `inventory.js` created plain ones, so a character born in-app carried three plain
  maps until the next load, and `migrateWearMap` was the only thing that ever built them
  null-prototype. **Measured on the shipped functions:** with a plain `armorGuard` and an
  entry whose `id` is `toString`, `armorState().guard` reads **true** on a suit that was
  never repaired, and `applyArmorDamage(+1)` returns `absorbed: true` **forever**, because
  spending the guard is a `delete` on an inherited property. The same call against a
  null-prototype map correctly stores `{"toString": 1}`. Fixed at every creation site,
  and the second writer that made one of them (`c.armorGuard[p.repairKey] = true` in
  `tbComplete`) is gone, replaced by `EN.engine.grantArmorGuard`. **Also fixed one level
  down:** both maps are now read through `hasOwnProperty`, so the map's prototype cannot
  decide the answer even if a caller hands in a literal.
- **~~The untrained advisory prints on one of the two lanes this feature added.~~ FIXED.**
  `wmudlussk` lens 1, its one finding, and it is fair. `engUntrained` was computed once
  and used only in the damaged branch, so an untrained crafter saw `UNTRAINED +2 SNAG`
  beside `⚒ BENCH · 𝒢138` and **nothing at all** beside the same suit's
  `⚒ REBUILD PROJECT · 𝒢460`, which is Standard rather than Simple, expects Proficient
  just the same, and takes the same +2 Snag. Option (b)'s whole justification is that the
  expectation is communicated and paid for rather than enforced, and it was being
  communicated on one lane. **The chip is now computed per lane against that lane's own
  skill and tier,** which the lens specifically asked for: the rebuild reads
  `CRAFT().skillForItem(st.item)`, so a Resonant Carapace says **Esoterica** and not
  Engineering. **Verified by toggling proficiencies:** both untrained shows both chips,
  Engineering proficient leaves only the Esoterica one, Esoterica trained leaves only the
  Engineering one, both trained shows none.
- **~~A 4 DR Artifact repairs for 𝒢0.~~ FIXED.** `wx7cb0612` lens 1 filed this as a
  smaller observation rather than a finding, and it is a real hole. `listPrice` reads a ◎
  figure only inside its leased branch, so an UNLEASED row with `price: 0` returns 0.
  **Measured: the Reliquary Shell is the one armor row in the catalog with a listed value
  of zero** (`price: 0, nexus: "◎2+"`), and it repaired at `𝒢0` a point and rebuilt for
  `𝒢0`. It now reads the ◎ figure at the same reference rate the leased branch already
  uses, which the economy chapter states is the ledger value of an object, and that is
  exactly the question repair pricing asks. **`𝒢20,000` listed, `𝒢2,000` a point,
  `𝒢10,000` to rebuild**, at Relic tier under Esoterica. **No-op proof: all 327 catalog
  items were priced through the old function and the new one, and exactly two move**, the
  Reliquary Shell and `Martyr's Halo`, a focus with the same `price: 0, nexus: "◎2+"`
  shape that no repair lane prices today. Every leased row is unchanged to the Glimmer
  (Sentinel Issue 1,000, Bailiff Rig 3,000, SkinPlan Daywear 500, Sentinel Barrier 600),
  and so is everything unleased with a real price.
- **~~Shield Durability leaves the app on neither the print sheet nor the PDF.~~ FIXED.**
  `wx7cb0612` lens 0, the second half of F6. Armor DR prints its current value in three
  places and the shield printed nothing, though the two are declared one mechanic. Both
  exports now carry it: the Equipped line reads `Shield: Riot Shield (1 of 3 boxes)` and
  the inventory detail reads `Durability 1 of 3 (2 marked)`, or `(destroyed)` at zero.
  Verified on the rendered print sheet and by instrumenting both resolvers during a real
  `EN.pdfExport.build`, which logged `AR eq_ar->2/5`, `SH eq_sh->1/3`, `SH eq_sh2->0/2`
  into a 205,017 byte document.

### What was already closed, re-checked rather than assumed

Twelve items in these files describe code that later commits changed. Each was verified
against the current source by finding the quoted code, not by trusting the log.

- **`wx7cb0612` lens 0, F2: `if (!ch.proficiencies) return;` puts every step-5 map behind
  an early return.** Closed by the `migrate()` hardening pass (`28f45ce`), which turned it
  into a guard around only the proficiency conversion. This is L12, and the lens hit it
  independently. Its companion observation, that `keyToName` returns the key itself when
  no entry matches so a name-keyed piece keeps reporting a real base, is no longer
  reachable for armor: armor is non-stackable, every owned armor row gets an `eq_` id in
  the split, and a wear key that names no live entry is pruned. The shape it needs cannot
  survive a load.
- **`wx7cb0612` lens 0, the per-ROW versus per-PIECE hole,** which that lens reproduced
  and correctly reported as already disclosed. Closed by `f739e4b`.
- **`wx7cb0612` lens 1, findings 1 to 4, and `wx7cb0612` lens 2, findings 2 and 3:** the
  bench tier gate, leased armor priced off the deposit, both lanes all-or-nothing, and a
  repair Project completing without securing parts. All four are the branch fixes recorded
  above and merged in `ae06cb1`. `wmudlussk` lens 1 re-verified the gate independently and
  found (b) genuinely applied at all four Project creation sites.
- **`wx7cb0612` lens 2, finding 1: name-keyed wear lands on a different piece than the
  equip slots do,** because `nameToIds[e.name] = ids` assigns rather than accumulates, so
  `firstId()` returns the LAST such row while the wear map indexed the first. Closed by
  the attribution redesign (`dbe4f09`): the wear rules no longer carry their own index at
  all. Rule 1 attributes a name key to the EQUIPPED piece, and the equip slot itself
  resolves through `firstId`, so the two now name the same entry by construction rather
  than by two indexes agreeing. Re-checked on the lens's own shape.
- **`wx7cb0612` lens 2's two non-findings** (a non-array `ch.equipment` wiping the roster,
  and the plain-literal maps) are L10, closed by `28f45ce`, and F5, closed here.

### Still open out of these files, deliberately

- **`ownsFabRig` grants free bench parts for merely OWNING the rig.** The manuscript says
  "with stock on hand" and the item's own line says "when materials are available";
  neither is modelled, because the app has no consumable stock. An author call, not a
  defect.
- **The `↶ UNDO` button restores a point of DR for free, without limit, and stays enabled
  on a breached suit.** It is symmetric with the manual `− DR` beside it and reads as a
  deliberate tracker affordance for a misclick, which is what its tooltip says. Left alone.
- **`nameToIds` is last-write-wins** for two rows sharing one NAME. Unchanged, and now
  genuinely inert for the wear maps, since attribution stopped depending on it.
- **The shop lane consumes no calendar time.** Nothing else in the app charges a Downtime
  period either, so this is consistent rather than a gap.

### Verification run for these six

Own tab on `http://localhost:8777`, forced reload before every reading, every defect
driven through the real DOM buttons.

- **The no-op proof, measured rather than asserted.** Twenty-four migration shapes through
  the real `EN.store.load()` with `Math.random` stubbed to a seeded LCG, each written back
  to storage and re-loaded twice more. **Zero throws, all twenty-four byte-stable across
  three loads, `Object.prototype` clean.** The identical harness was then run against the
  pre-change code with the same seed: **21 of 24 are byte-identical, and the three that
  move are exactly the three these fixes target** (the out-of-range clamp, the key-order
  case, and wear parked on a non-armor entry). Nothing else moved, including the
  attribution shapes, the duplicate-id shape, the racked shape, the rig shape and the
  qty-splitting shapes.
- **Both writers forced in both directions.** `+99` stops at 0/5 storing 5, `+5` again
  stays, `-99` lands exactly 5/5 and deletes the key, `-5` again stays, a granted guard
  absorbs exactly one point and is spent, the next point lands, and delta 0, `NaN`,
  `-Infinity`, a missing entry and a non-armor entry are all inert. `applyShieldWear`
  refuses an armor entry outright (`boxesMax 0`, `changed false`, nothing stored).
- **Seven tabs, five Workbench benches, Stash, Chrome, Gray Market and the print sheet
  across five characters** (damaged suit and worn shield, breached suit and destroyed
  shield, the Reliquary Shell, a bare character, and a legacy id-less name-keyed record):
  **zero console errors, zero throws.**
- **A relic-tier rebuild is coherent.** A breached Reliquary Shell opens
  `Rebuild Reliquary Shell`, Relic or Breakthrough, Esoterica, `𝒢10,000` in parts, target
  10 through the tier table's existing `|| 10` fallback for a null target, Snag 5, and the
  card prints `+2 UNTRAINED`.
- **Not seen on screen:** the browser pane was not displayed in this session, so no
  screenshot was taken. Every reading above is text off the live DOM, the live toast node
  and the live store, which is the more precise form, but nobody has looked at the pixels.

## The adversarial pass over that commit, and the four more it found

`cfc4886` was then put through five review lenses (the money paths, the engine's new
resolver and writers, the migration, rules fidelity and the doc, and a completeness
critic re-reading both review files against the diff), and every finding they raised was
handed to an independent skeptic told to refute it. **Twenty-two were refuted and five
survived.** Four are fixed in `339ac12`; the fifth is below, under what needs a ruling.

Worth keeping about the refuted twenty-two, because it is the point of running the second
half: several were arithmetically correct and still wrong as findings. The two most
instructive both claimed `applyArmorDamage`'s quality edge "absorbs the entire delta
rather than one point", which is true of the code and is behaviour `cfc4886` neither
wrote nor changed, and no caller passes a delta above 1. A third correctly described a
disagreement between `defensiveLoadout`'s own fields and the resolver record it now also
carries, and the remedy it proposed would have reopened the hole the commit closed.

**~~A name-valued equip slot makes every Durability box and DR point evaporate on the
next load.~~ FIXED, and it is the worst thing in this round.** **Severity: medium.
PRE-EXISTING, not caused by `cfc4886`:** the prune has always asked whether a wear key
names a live entry, and the pre-commit code said `key = wearLiveKeys[k] ? k : null` with
identical semantics.

The instance-id split rekeys an equip slot only when the slot's value is a name the split
actually split (`nameToIds[ch[slot]]`). A row that ARRIVED with an id and `qty: 1`
populates nothing, so a slot holding that row's NAME is left alone. Nothing downstream
minds: `keyToName` hands an unmatched key straight back, `armorItem` resolves it, and the
whole app runs with `dg.shieldKey === "Riot Shield"`. The Block row's wear button then
writes `shieldWear["Riot Shield"]`, which is a perfectly good key to everything except
the prune. **Repro through the real buttons, with the debounced `persist()` forced so
nothing is a timing artifact** (the first attempt at this repro was contaminated by
exactly that, and by driving a leftover character from an earlier run; both are recorded
here because they are the same two traps the log already names): a record with
`equipment: [{id:"eq_s1", name:"Riot Shield"}, {id:"eq_a1", name:"Anvil Frame"}]` and
`equippedShield: "Riot Shield"`, `equippedArmor: "Anvil Frame"`. Two `− WEAR` and one
`− DR` land, display (1 of 3 boxes, DR 4) and reach storage as
`{"Riot Shield":2}` / `{"Anvil Frame":1}`. **One load later both maps are `{}`, the shield
is back to 3 of 3 and the suit to 5 DR, with no message,** and it repeats for as long as
the record exists. Import puts a record in that state once; the app then stamps
`meta.wearKeys` and it is in-app and permanent from then on.

**Fixed at the source, which is the slot, not by teaching the prune to accept a name.**
Invariant 1 says per-piece state is keyed on the ENTRY, so a slot that is not an entry key
is the thing to correct. `migrate()` now resolves `equippedArmor`, `equippedShield` and
`equippedFocus` through the same `equippedEntryKey` the wear rules already use, and only
when the answer is unambiguous. **An ambiguous slot is left exactly as it is rather than
emptied:** unequipping a piece the player is wearing is a bigger harm than the one being
fixed. A slot that is already a live entry key is skipped untouched, which keeps the
id-equals-another-row's-name shape from the attribution redesign resolving exactly as it
did. **After: the slots migrate to `eq_s1` and `eq_a1`, and the two boxes and the DR
point survive both reloads.**

**~~The print sheet and the PDF call an emitter shield "destroyed".~~ FIXED.** Introduced
by `cfc4886`, in code it added. `EN.combat.shieldDurability` draws the line deliberately:
a physical shield at 0 boxes "is destroyed ... and is beyond repair, but the wreck counts
as salvage", while an emitter "goes dark instead ... It is not destroyed and leaves no
salvage." That decides whether the piece can be repaired at all and whether it yields
salvage, and the Combat tab already got it right, rendering `SHIELD · DARK` and toasting
"overloaded and went dark". The two new renderers ignored the `emitter` flag the resolver
was already carrying for exactly this. **Repro:** a Hardlight Barrier at 0 boxes printed
`Durability 0 of 3 (destroyed)` on the sheet and in the PDF. **After:** `(dark)` for the
Hardlight Barrier and `(destroyed)` for a Riot Shield beside it on the same sheet. Two
catalog rows are affected, `Hardlight Barrier` and `Sentinel Barrier`.

**~~`_armorPts` is the one map in this path still a bare literal.~~ FIXED.** The points
picker's map is keyed on the raw entry key, and `cfc4886`'s null-prototype sweep covered
the three PERSISTED character maps and not this transient view one. **Repro, on a record
whose armor row carries `id: "__proto__"` (authored through `JSON.parse`, which is how a
real save file arrives, so the key is a genuine own property):** the picker reads `3 / 3`
with `−` enabled, and clicking it does nothing, because `_armorPts["__proto__"] = 2`
invokes the `Object.prototype` setter, which discards a non-object value, and the read
back is `Object.prototype`, fails the `typeof` test and re-defaults to the whole loss. The
row can then only be bought at `SHOP · 𝒢276`. No currency is created or wrongly debited;
the harm is that the per-point purchase the feature exists to provide is unreachable on
that piece. **After: `3 / 3` steps to `2 / 3` (`𝒢184`) and `1 / 3` (`𝒢92`), and the shop
click takes exactly 𝒢92 and moves the suit 2/5 to 3/5.** `_open` was checked and left
alone: every one of its keys is prefixed, so no bare entry key reaches it.

**~~Blueprints builds a Reliquary Shell for 𝒢0 beside a rebuild that costs 𝒢10,000.~~
FIXED, and `cfc4886` created this one.** Teaching `listPrice` to read a Nexus-only row
moved the repair lanes and left `materialCost` reading `it.price`, so the Fabrication
bench offered `Reliquary Shell · mat 𝒢0` while the Impact Table priced rebuilding the
damaged one at `𝒢10,000`. `materialCost` now asks `listPrice` too, which is the same
question ("half what the thing is worth"), and `rebuildCost` is now literally
`materialCost`, which its own comment always claimed. **Blast radius measured over all 327
catalog items: exactly six move, and four of them are leased rows that `tbBlueprints`
already refuses (`!it.upkeep`), so exactly two Blueprint entries change** (`Reliquary
Shell` and `Martyr's Halo`, the two rows with no Glimmer price at all).

**Also corrected while there: the panel no longer asserts a "list price" a row does not
have.** A damaged Reliquary Shell used to read "𝒢2,000 per point at this suit's 𝒢20,000
list price", and the catalog prints no list price for it: it is `price: 0, nexus: "◎2+"`,
its description says "Nobody manufactures one of these. They are found", and the Gray
Market renders it `FOUND, NOT SOLD`. It now reads "at this suit's 𝒢20,000 value at its ◎2+
asking figure", with the derivation stated. Leased rows keep "Buyout" and ordinary rows
keep "list price", both unchanged to the character.

### Both rulings came back, 2026-08-10, and both are now applied

- **RULED: the ◎ reference value stands, and the catalog was never disagreeing with it.**
  Brandon supplied the exchange text: `◎1 = 𝒢10,000` is "the number that appears in
  contracts, ledgers, and official books", and actual cash-out is lower, returning
  `𝒢5,000` to `𝒢7,500` at a legal licensed exchange and `𝒢2,000` to `𝒢4,000` unlicensed.
  That resolves the objection in the entry below rather than sustaining it. Three of the
  four dual-priced rows imply 2,400 to 3,200, which is the UNLICENSED band: those items
  are priced at what a Freelancer actually clears selling a token on the street. The
  outlier, Warframe Shell at 9,600, sits at the licensed reference, which fits a
  corporate frame. And a shop quoting a repair prices off what the OBJECT is worth in a
  ledger, not off what its owner could liquidate a token for, so `nexusToGlimmer` is the
  right read for `listPrice`. **No code change; the pricing shipped in `cfc4886` and
  `339ac12` is correct as it stands.** The conversion bands, the three strings an
  unlicensed conversion can come with, and the "Freelancers should not assume" line were
  missing from `economy.js` and are now Codex reference data (`1858843`), deliberately
  with no mechanical hookup: the bands are wide and the cheap one costs things a number
  cannot express, so a cash-out is a scene the GM runs. The block says so in as many
  words, so nobody wires it up later by accident.
- **RULED and BUILT: caustic degradation is retired into `ch.armorWear` (`373df43`).**
  See the section below.

### The original ruling entries, kept for the reasoning

- **What is a ◎ figure worth when the row has no Glimmer price?** `cfc4886` closed a real
  hole (a 4 DR Artifact repairing at 𝒢0 a point) by reading the ◎ figure at
  `EN.economy.nexusToGlimmer`, the 10,000 the economy chapter states is the ledger value.
  That is defensible, and I did not measure the catalog before picking it. **Measured
  now, and the catalog disagrees with itself:** the four unleased rows that carry BOTH a
  Glimmer price and a ◎ figure imply 9,600 (Warframe Shell), 3,200 (Resonant Carapace),
  2,800 (Aegis Shroud) and 2,400 (Hex Lattice Projector) Glimmer per ◎, a median of about
  3,200 rather than 10,000. So `◎2` reading as `𝒢20,000` makes the Reliquary Shell roughly
  three to six times more expensive than the catalog's own Mystech pricing pattern
  suggests. Three answers, and it is an author's call, not a code one: keep the stated
  ledger rate; use the catalog's own implied rate of roughly 3,000, which puts the shell
  near the Aegis Shroud; or declare ◎-only gear unpriceable and close the paid lanes on
  it with a line saying so. **The leased branch is unaffected either way**, because a
  stated `◎0.3 buyout` is a buyout and the ledger rate is the right read there (Bailiff
  Rig, 𝒢3,000). Whatever is ruled, `materialCost` and the repair lanes now move together.
  The `+` in `◎2+` is also read as a flat 2, which is the conservative direction.
- ~~**Environmental Hazards still hands caustic armor loss to a module that does not
  exist.**~~ **RULED AND BUILT, `373df43`; see the retirement section below.**
  `grep` found `EN.armorRepair` at five sites in `app/`, all of them consumers,
  and **it is defined nowhere**: Armor Repair merged as `EN.crafting.armorRepair` plus
  `EN.engine.armorState` / `applyArmorDamage`. So `causticScene`'s forward hook
  (`if (EN.armorRepair && EN.armorRepair.applyDegradation)`) can never fire, the caustic
  DR loss sits in `ch.hazards.caustic.armorDR` as PENDING forever, and the panel still
  tells the player "Armor Repair is not on this branch, so nothing here lowers your
  Damage Reduction" on a build where it demonstrably is. `d.hazard.caustic.degradation
  .applied` is hardcoded false in a comment that says "false on this branch". **This is
  exactly what the step-6 section above instructed and it did not happen at merge:**
  "When Armor Repair merges, the ledger should be retired into whatever that branch's
  per-piece current-DR map is, and the hook left as the only call site. Do not add a
  second subtractor." The second half was obeyed; the retirement was skipped.
  **To be clear about the blast radius:** there is no second subtractor and no
  double-counted number. `armorState` is still the only resolver and `applyArmorDamage`
  the only writer, and the caustic ledger reaches no defense surface at all. What is
  broken is that a shipped rule does nothing and two disclosure strings are false.
  Retiring it is a small change (`applyArmorDamage(c, key, +drLost)` at the one hook,
  the ledger dropped, the strings rewritten), but it makes caustic exposure start
  actually lowering DR at the table, so it is left for Brandon rather than taken
  unilaterally. **Not fixed.**

### Found while verifying the reach work, pre-existing

- **Building more than one PDF in a single page session can hang after the first.** Hit
  while running a six-shape export sweep: the first `EN.pdfExport.build` resolves and the
  second never settles, with no throw and nothing on the console. **Confirmed
  pre-existing rather than assumed:** the same three-build chain was run against the
  unmodified code, on the same fixtures and the same page-load conditions, and stalled
  identically after the first. It is also FLAKY rather than deterministic, since chains of
  five, six, nine and eleven builds all completed earlier in the same session, so it looks
  like accumulated state in the tab rather than a fixed limit. Harmless in ordinary use
  (a player exports one sheet and the button reloads nothing), which is why it has never
  been noticed, but it makes any multi-PDF verification run unreliable: **force a page
  reload between builds, or the second reading is worthless.** Not fixed here.

### Still open out of this pass, deliberately

- **`ch.armorMods` is keyed on the armor NAME and is never pruned**, so two identical
  suits share one mod loadout and a re-bought suit arrives pre-modded. Raised again here
  and refuted as a finding against this commit, correctly: it is the third name-keyed
  per-piece map and it is already recorded twice above, at "Found while building step 5"
  and in the step-6 section. Still true, still untouched, and still a separate decision
  about whether two Anvil Frames can be modded differently.
- **The `↶ UNDO` and `+ REPAIR` buttons restore a point of DR and a Durability box for
  free**, without limit. Both are symmetric with the manual `− DR` and `− WEAR` beside
  them and read as tracker affordances for a misclick, which is what their tooltips say.
  Raised twice in this pass and refuted twice on that ground.
- **`ownsFabRig` grants free bench parts for merely owning the rig**, where the
  manuscript says "with stock on hand". No consumable stock exists to model. Author call.
- **The print sheet's DEF stat reads "+shield" for a shield contributing nothing.**
  Pre-existing, adjacent, and outside everything here.

## Caustic degradation, retired into `ch.armorWear` and finally doing something

**BUILT 2026-08-10 (`373df43`), on Brandon's ruling.** The manuscript entry, quoted so
the target is not in doubt: "Unsealed gear degrades. After a full scene of exposure,
armor loses 1 DR until repaired during Downtime, to a minimum of 0."

**Reproduced first, and it was as dead as the completeness lens said.** Two
`MARK FULL SCENE` clicks on an unsealed Vanguard Plate (base 4) with the caustic hazard
applied through the real Status Changes dropdown: `d.armorDR` stayed **4**, `armorWear`
stayed `{}`, the parallel ledger filled to `{eq_v1: 2}`, the panel printed "PENDING 2 DR
... Armor Repair owns current DR per piece and lives on another branch", and the toast
said "Armor Repair is not on this branch, so nothing here lowers your Damage Reduction."
`causticScene` gated on `EN.armorRepair.applyDegradation`, and `EN.armorRepair` is
defined nowhere: Armor Repair merged as `EN.crafting.armorRepair` plus
`EN.engine.armorState` and `applyArmorDamage`. The hook could not fire on a build that
had everything it needed, and the step-6 section had asked for the retirement at merge.

**What changed.**

- **One writer.** `causticScene` calls `EN.engine.applyArmorDamage(c, key, drLost)`.
  After: `4 -> 3 -> 2`, in `ch.armorWear`, visible on every DR surface.
- **The ledger is retired.** `migrate()` captures `ch.hazards.caustic.armorDR` in the
  hazards block, where the raw value still exists, and folds it into `ch.armorWear`
  **after** the wear maps are final, so it merges into a map that is already entry-keyed,
  pruned and clamped. Merging it in the hazards block instead would be the ordering trap
  a third time. The field is deleted and `blank()` no longer declares it, so a second
  load finds nothing to merge and there is no way to double-count.
- **The quality edge is not spent by the merge, and is spent at runtime.** `armorGuard`
  absorbs the NEXT point a suit would lose; a recorded loss may predate the guard
  entirely, so cashing it retroactively would invent history. At the table it applies
  like anywhere else: a freshly repaired suit shrugs off one scene and the toast says so.
- **"Minimum 0" stops needing its own enforcement,** because the writer clamps to
  `[0, base]` by construction. `MARK FULL SCENE` disables at 0 with a reason.
- **The free REPAIR button is gone.** It deleted a ledger row, which was the only thing
  it could do while the loss was a pending number nothing defended with. Repair is the
  Impact Table's priced work now, so the button became a `→ REPAIR` jump. A misclick is
  still free: `↶ UNDO` sits beside the DR track on both the Block row and the Impact
  Table.
- **`causticArmorDR` reads `armorState`,** so the block's header shows the suit's real
  current DR and matches the Defenses row instead of quoting the catalog at it. It
  reports the whole loss rather than a caustic-only share, and says so on screen: wear is
  one track per piece and does not record what took each point.

**The one table-facing consequence, stated plainly:** caustic exposure now lowers DR, and
undoing it costs Glimmer or a Project rather than a click. That is what the rule says and
it is one of the four features Armor Repair was built to fill, but it is a real change to
play and it was Brandon's to authorize rather than mine.

### Verification run for the retirement

- **Thirteen retirement shapes** through the real `EN.store.load()` with a seeded LCG,
  three loads each. **Zero throws, all thirteen stable across three loads,
  `Object.prototype` clean.** A ledger alone lands (`{eq_a:2}`, DR 3/5); a ledger plus
  existing wear sums (2 + 1 = 3); a ledger of 99 and a 4-plus-3 sum both cap at the base
  of 5; an orphaned key and a key naming a non-armor entry are both dropped rather than
  moved; a pending `armorGuard` survives unspent; junk values, a non-object ledger and
  prototype-named keys all normalize to nothing; two suits stay independent
  (`{eq_a:1, eq_b:2}`); and an **unmarked legacy record** merges its ledger while its
  name-keyed `shieldWear` still lands on the wielded shield (`{eq_s:1}`).
- **The no-op proof.** The same 24-shape harness, and every one now differs from the
  pre-change baseline for the obvious reason: the retired field is gone from every
  record. Compared field by field with that one field stripped and nothing else,
  **all 24 are identical in every remaining field.** Nothing else moved.
- **Live, through the real buttons.** The guard absorbs exactly one scene and the next
  one lands; a sealed Riot Wall, an unsealed suit under a worn Hazmat Suit, and no armor
  at all all write nothing; forcing past 0 leaves `{eq_v1: 4}` on a base of 4. The loss
  reaches the Freelancer DR tile, the Block card (`PLATING 2 / 4 DR`), the Stash card
  (`⛨ 2 / 4 DR`), the Impact Table (`2 / 4 DR` with `SHOP · 𝒢116`), the print sheet
  (`DR 2 · Vanguard Plate · 2 of 4` and `DR 2 of 4 (2 lost, until repaired)`) and a PDF
  built at 199,965 bytes with `armorState` instrumented logging `eq_v1->2/4`.
- **End to end:** `→ REPAIR` lands on the Impact Table and the shop lane takes `𝒢116` to
  put the suit back to 4/4 with `armorWear` empty.
- **Seven tabs, five benches and the print sheet across six characters:** zero console
  errors, zero throws.

**A methodology note worth keeping, because it is the trap Brandon had just named.** One
harness run in this pass reported a clean result that was nothing of the kind: the probe
file had been deleted in an earlier cleanup, the `fetch` 404ed, and `eval("")` returned
`undefined`, which read as "the harness found no differences". The fix was to make the
probe assert it can succeed (HTTP status, a minimum body length, a non-empty return)
before any of its findings are believed. **A negative result is evidence about the probe
at least as often as it is evidence about the code.**

## Versatile got a grip, and the Quarterstaff lost a trait it should never have had

Brandon, reading the sheet: "Versatile weapons need a toggle so you can swap from
one-handed damage and two-handed damage. In doing that you can get rid of the two damage
rating and just maintain the one set of damage numbers and surface the correct set based
on how it's being held. Also, the Extended Haft mod imposes two-handed on a weapon it's
installed on, so that means it would lose its Versatile tag becoming two-handed only."

The rule was already in the book and the sheet was not playing it. "Versatile: the weapon
lists an alternate damage die in parentheses. Use the base damage when wielded in one
hand, and the Versatile damage when wielded in two." A Versatile weapon therefore does not
HAVE two damage ratings. It has one at a time, and which one is a fact about how you are
holding it. The weapon row printed both and left the player to pick, and the damage tray
carried a private two-handed toggle that **reset to one-handed every time it opened**, so
the grip you set for a fight did not survive closing the tray.

### The seven weapons this touches

Quarterstaff, Spear, Axe, Katana, Longsword, Warhammer, Harmonic Edge.

### One resolver, one writer, the fifth invariant

`eng.weaponGrip(ch, item)` is THE answer to which die a weapon is dealing. It returns the
Versatile die, the base die, whether the weapon is in two hands, whether that is a choice,
what took the choice away if it is not, the die that results, and a `why` sentence built
once so the row, the tray, the print sheet and the PDF cannot word it four ways.
`ch.weaponGrip[name] = "two"` is the only stored bit, and absent means one-handed, so the
default costs no storage and a stale key cannot mean anything but "two hands".

**Keyed on the weapon NAME, deliberately, and this is the one place the entry-identity
invariant does not apply.** The thing that can FORCE a grip is `ch.weaponParts`, which has
always been name-keyed: fit an Extended Haft and both your Longswords have it. Keying the
grip on the entry while its governing mod is keyed on the name would produce the worse bug
of the two: one copy forced two-handed and the other toggleable, from the same mod. The
two maps agree, and they will have to be moved together if weapon mods ever go per-entry.

### Two ways a weapon can lose the choice

The `Two-Handed` trait on the weapon itself, and the **Extended Haft**, whose entry ends
"and grants the Two-Handed trait". `forcedBy` names whichever did it, because a player
whose lower die vanished after a bench visit is owed the reason and not just a missing
button. Fitting a haft to a Versatile weapon spends its one-handed die permanently, and
the row says so: the `Versatile (1d8)` chip is **removed**, not merely ignored, and a warn
chip reads `TWO-HANDED ONLY · 1d8`. The tray does the same: no toggle, the same chip in
its place. The first cut of this gated `ctx.versatile` instead of the toggle's rendering,
which would have made a forced weapon roll its **base** die, since `activeDice` falls back
to `ctx.dice`. Caught before it shipped, by reading what the fallback does.

### Paper keeps both dice

First pass made the print sheet and the PDF print the single active die, matching the
screen. Brandon: "since you can't toggle on the PDF, you should probably maintain the
format of `1dx (1dx)` for versatile weapon damage." He is right, and the reason is the
one the exports exist for. The screen has a button; a printed sheet does not, and a player
who switches grips mid-fight needs the other number in front of them. So both exports now
print `1d8 (1d10) Slashing` in the book's own order, with the stored grip alongside as
`held two-handed (1d10)`. A **forced** weapon still prints one die, because there is no
other die to switch to, plus `two-handed only (Extended Shaft)`.

### The Quarterstaff was carrying a contradiction

Its catalog traits were `Reach 1, Two-Handed, Versatile (1d8)`. Two-Handed means the
weapon is always in two hands, so the 1d6 one-handed die could never be rolled and the
Versatile trait bought nothing. Brandon fixed it in the manuscript to `Reach 1,
Versatile (1d8)`, and it was verified live in **both** places Part 3 prints the traits,
the melee table row and the Quarterstaff detail entry, before the data file was touched.

### Verified

Driven through the real UI on a character with all three reach grants and six weapons.

- **Resolver, eight weapons.** Quarterstaff with a haft: forced, `1d8`, `canToggle`
  false. Longsword stored `"two"`: `1d10`, toggleable. Greatsword: forced by the trait, no
  Versatile die, `2d6`. Whip: no grip control at all. Spear, Axe, Katana, Warhammer: one
  hand by default with the two-hand die named in the tooltip.
- **The toggle, clicked.** Spear went `DMG 1d6 +3` to `DMG 1d8 +3`, the button flipped
  `ONE-HANDED · 1d6` to `TWO-HANDED · 1d8`, and `ch.weaponGrip` recorded `Spear: "two"`.
- **The tray opens on the grip the row is showing.** Longsword's tray opened with
  `DAMAGE · 1d10 SLASHING`, the d10 die art, and the `Two-handed (1d10)` toggle already
  lit, instead of silently reverting to `1d8`. Toggling inside the tray still works and is
  still a per-roll override.
- **A forced weapon cannot be toggled back.** Quarterstaff's tray shows the warn chip and
  no switch; rolled it and got a d8 face, `Weapon 3 · Body Modifier +3`, total 6.
- **Migration, six hostile shapes** through the real `importCharacter`: an array, a bare
  string, `null`, junk values (`"TWO"`, `true`, `1`, `"one"`), a JSON-parsed
  `__proto__`/`constructor` payload, and the field absent entirely. Every one normalizes
  to a **null-prototype** map holding only the literal `"two"`, and `Object.prototype`
  stays clean.
- **Both exports.** Print sheet and a PDF built at 192,579 bytes, read back out of the
  AcroForm: `1d8 (1d10) Slashing / held two-handed (1d10)` for the Longsword,
  `1d8 Bludgeoning / two-handed only (Extended Shaft)` for the Quarterstaff, and
  Greatsword and Whip untouched.
- Zero console errors.


## Extended Haft became Extended Shaft, and Long-Shafted became a frame

Brandon, 2026-08-12: the shafted list is "Quarterstaff, Spear, Halberd, Glaive (Arc
Glaive)", plus five that "are not in the book but add them to the list for future
potential expansion just in case they ever comes into play": Trident, Harpoon, Naginata,
Pike, Polearm. And: "I also changed the mod Extended Haft to Extended Shaft. check the
manuscript for more info."

The manuscript had more info than the rename. Read live from Part 3:

* **Extended Shaft.** "Fits: **Long-Shafted (Quarterstaff, Spear, Halberd)**", was
  "Any Melee". "Effect: **Increases** Reach by 1 ... and grants the Two-Handed trait",
  was "**Grants or** increases". Its old "**Cap:** Reach 2" sentence is gone.
* **The Parts glossary** now lists Long-Shafted as a frame: "Fits: **a hard frame gate**.
  Most Parts fit a broad category, such as Any Melee ... Others require a specific frame:
  Longarm, Shotgun, Bladed, Long-Shafted, Compound, Crossbow, or Heavy/Two-Handed."

So this was not a rename with a new label. It was a rename that made an existing data flag
load-bearing in a second system, and it answered a question this log had open (see the
struck Whip paragraph above: the loadout the two readings disagreed about is now
unbuildable, so there is nothing left to rule on).

### One question, one answer, two askers

`shafted` was a bare `!!item.shafted` read inside `weaponReach`. Now `eng.isLongShafted()`
answers it for both the reach talent and the bench's Fits gate, because two answers drift.
**The catalog's flag wins whenever it states anything, true or false**; the name list in
`EN.combat.longShaftedNames` is the fallback for an item that states nothing. The test is
`typeof === "boolean"`, not truthiness, or an explicit `shafted: false` would fall through
to the very list it is meant to outrank. The five reserved names are future-proofing, not
classification: a Pike added to the catalog later is long-shafted the day it lands.

### A Part is persisted under THREE strings, and the third one outlives the migration

    ch.weaponParts[weaponName][slot]  the install, by part KEY
    ch.equipment[n].name              the owned copy, by part NAME
    ch.projects[n].itemName           an open crafting Project, by part NAME

`availablePartQty()` is literally owned-by-name minus installed-by-key, so moving one and
not the other makes a character own -1 of something. Moving neither is worse than
cosmetic: `weaponPartsOn()` resolves through `byKey` and `.filter(Boolean)`s the miss, so
a Quarterstaff keeps an occupied Handling slot while silently losing its +1 Reach and its
forced two-handed grip, and its Versatile toggle reappears.

The third one was the one worth finding. **A Project is a machine in the save file that
keeps manufacturing the old name.** `tbComplete` does `addToStash(c, pp.itemName)`, so an
open "Build Extended Haft" mints a stash row named "Extended Haft" AFTER migrate() has
already run for that session, and that row matches no catalog item at all. Reproduced
before it was fixed. The rename table lives in the data beside the Part
(`EN.weaponParts.renames`), following the `TALENT_RENAMES` precedent but read from the
catalog rather than restated in store.js, so the next rename is a row in that file.

### A hard gate needs enforcing on data that predates it

A save can carry an Extended Shaft on a Longsword, fitted under the old Any Melee rule and
still paying out +1 Reach and still forcing two hands. migrate() un-installs those.
**Nothing is destroyed**: the install is a key in `weaponParts`, the owned Part is a
separate equipment entry, and this is exactly what `removePart()` does. The Part returns
to the stash pool and the bench declines to re-fit it. A weapon name with no catalog entry
is **left alone**, because the gate is a fact about the weapon and an unknown weapon is a
question we cannot answer rather than an answer of no.

### Three defects found while measuring, all pre-existing, all fixed

1. **`weaponPartsOn` never resolved a Utility Part.** It walked `Object.keys(loadout)` and
   indexed `byKey` with whatever each property held, so it probed `_profile` as though it
   were a slot and handed `byKey` the whole utility ARRAY, which stringifies to "k1,k2" and
   matches nothing. Fifteen Utility Parts, none of them visible to the engine. Latent, not
   live, because the only Part with engine-read flags sits in Handling. It was a trap for
   the next one. Now enumerated the way `allInstalledKeys()` does.
2. **A non-array `utility` threw the whole Inventory tab.** The bench reads
   `(wp.utility || []).slice()`, and `"x".slice()` is the string `"x"`, which then reaches
   a `.map()` it does not have. Measured on a `{handling: 7, utility: "x"}` record, not
   theorised. `ch.weaponParts` had never been validated at all; this pass now says a
   loadout is an object with slot-or-null and a real array, because half a guarantee is
   worse than none once a reader starts trusting it.
3. **`tryInstall` never consulted `partFits`.** The only thing enforcing a "hard frame
   gate" was a filter on the list feeding the picker. The vehicle bench already guards its
   own install. Now so does this one.

### And two places the gate had no voice

The gray market sold a gated Part with no hint it was gated: `partInfoLine` drew slot,
type and grants but never `fits`, while the Armor Mod line beside it has drawn its "fits"
chip all along. And the bench said "You own no Parts for this slot" to a player holding
two Extended Shafts. Both now say it: `fits Long-Shafted` on the market card, and
"Owned but will not fit a Longsword: Extended Shaft (fits Long-Shafted)" under the slot,
the same sentence the Garage already used for a chassis mismatch.

### Verified

* **Classification.** Quarterstaff, Spear, Halberd, Arc Glaive true; Longsword, Whip,
  Greatsword, Dagger, Assault Rifle false. The five reserved names resolve true through the
  fallback, and an explicit `shafted: false` beats the list.
* **Migration, through the real `importCharacter`.** Legacy legal: key rewritten, owned
  entries renamed, Quarterstaff still reaches 3 and is still forced to `1d8` by
  "Extended Shaft". Legacy illegal: the Longsword install cleared to null, the owned Part
  still in the stash, the weapon back to Reach 1 and a toggleable grip. Utility arrays
  rewrite; an unknown weapon keeps its install; a Project's `itemName` AND its display name
  both move; hostile shapes (`null`, `"nope"`, an array, `handling: 7`, `utility: "x"`,
  a 6-long utility list) normalize without throwing and clamp to the stated capacity of 2.
* **The bench, through the real UI.** Extended Shaft offered on Quarterstaff and Halberd,
  refused on Longsword and Whip, with the misfit line naming why. Installed through the
  real dropdown: reach 4 with the cap note, forced two-handed, `1d8`.
* **The writer's own gate, isolated.** Owning the misfitting Part so the ownership guard
  passes, then forcing `suppressor` through the real change handler: refused, with
  "Suppressor fits Any Firearm; the Quarterstaff is not.", loadout untouched. The control
  through the identical path with `extended-shaft` installs, so the handler does run.
* **Exports.** Print sheet and PDF both carry the new name in every generated string;
  "Extended Haft" appears nowhere in either.
* **102 tab and bench visits across all six roster characters: zero console errors.**

**A probe note, since two probes lied in this pass.** `EN.ui.toast` is captured at
inventory.js module load, so stubbing `EN.ui.toast` at runtime intercepts nothing and the
toast reads as absent. And the first version of the writer-gate test used a Part the
character did not own, so the ownership guard would have rejected it too and the test
proved nothing about the new one. Both were caught by insisting on a control that must
succeed, which is the same discipline the earlier deleted-harness episode bought.

### Still open, and NOT caused by this change

~~**`ownedQtyOf` counts one row, not all of them.**~~ **CLOSED 2026-08-12, see below.**  `app/js/inventory.js`:
`function ownedQtyOf(ch, name) { var e = (ch.equipment || []).find(...); return e ? (e.qty || 0) : 0; }`
Parts are non-stackable, so every purchase mints its own `eq_` row of qty 1. `.find` reads
only the first, and `availablePartQty` is owned-minus-installed, so **the second copy you
buy can never be installed.** Reproduced live through the real gray market: two BUY clicks,
𝒢360 spent, two rows in the stash, one installed, and the second vanishes from the picker
while the slot reads "You own no Parts for this slot". 𝒢180 stranded.

The rename does not cause or worsen it. The migration is a strict 1:1 in-place rewrite that
changes no row count and no qty, so the miscount reads identically before and after; an
adversarial pass confirmed the "one of each name" scenario is unreachable because migrate()
is unconditional and ships in the same build as the renamed catalog entry. Left alone
deliberately: `ownedQtyOf` also backs **armor mods and vehicle mods**, so summing instead of
finding is a change with its own verification surface and not a rider on this one.

Underneath it, two modules disagree about whether a Part is stackable at all:
`inventory.js` asks `isStackableItem` with a resolved `partAsItem` and gets false, while
`store.js` asks `isStackableName`, whose `loadCatalogItem` has no weapon-parts pool, so it
resolves to null and gets true. That disagreement is the root cause, and it should be
settled before the counting is patched.


## `ownedQtyOf` counted one row, and the second copy you bought was stranded

Carried over from the Extended Shaft round, where it was found and deliberately left
alone. Brandon: "can we resolve ownedQtyOf before addressing the L3 and L4 issues?" Yes,
and there is a scheduling reason beyond preference: L4 is blocked on an author ruling and
this is not blocked on anything.

**The defect.** `ownedQtyOf` used `.find`, which returns the FIRST row carrying a name and
reports that row's qty. One name is not one row: installable components are non-stackable
to the inventory module, so `addToStash` mints a fresh id-bearing row of qty 1 for every
one purchased. Own two and it reported 1.

`availablePartQty` is owned-minus-installed, so installing the first copy took the count to
0 and **the second became permanently uninstallable**: gone from the picker, refused by
`tryInstall`, still sitting in the Stash. One function feeds three mechanics, so weapon
Parts, armor Mods and vehicle Mods were all wrong the same way.

Reproduced through the real gray market before it was touched: two BUY clicks on Extended
Shaft, 𝒢360 spent, two rows in the Stash, install one, and the slot then reads "You own no
Parts for this slot" while the second copy sits there. 𝒢180 gone.

**The fix** is a reduce over every matching row rather than a find of the first, with
`Number()` on the qty because a hand-edited or imported record can carry a numeric STRING
and `0 + "3"` is `"03"`, which then compares as a string against the install count.

### What this is NOT, and a correction to what I told Brandon

I said the counting question "answers itself" once the catalog split below is fixed. **That
was wrong.** Unifying the catalog makes the two halves of the app AGREE that a Part is
per-instance; it does not make rows collapse. Rows stay per-instance either way, so `.find`
under-counts either way. The catalog is the invariant problem. This was the money problem,
and it needed its own fix.

### The catalog split, measured but deliberately not fixed here

`engine.js loadCatalogItem` searches seven pools; `inventory.js catalog()` searches those
seven plus four more. Measured exhaustively in the live app:

| pool | items | resolved by the engine |
| ----- | ----- | ----- |
| the seven the engine searches | 327 | 327 |
| weapon parts | 60 | 0 |
| armor mods | 25 | 0 |
| vehicles | 7 | 0 |
| vehicle mods | 13 | 0 |

**105 items invisible to the engine, and all 105 read as pooled**, because
`isStackableItem(null)` returns true on its "unknown/custom items: legacy pooled behavior"
line. Zero misses in the seven it does search, so this is a clean boundary rather than a
scatter of one-offs. The consequence is a fifth-invariant violation with a name: the same
question asked through two doors gets opposite answers. `builder.js` claims kit gear with
`isStackableName(name)` and pools a Part; `inventory.js` claims a purchase with
`isStackableItem(findItem(name))` and instances it.

**Latent, not live.** Walking every kit, class and subclass source for a grant of any of
the 105 returns exactly one hit, and it is a false positive: "Hair Trigger" is an Operator
subclass FEATURE whose name collides with a weapon Part. No starting kit grants a blind
item, so the builder cannot currently produce the pooled shape for one.

**Why it is not fixed in this commit.** `loadCatalogItem` has ten internal callers in
engine.js plus three external ones, and every one of them would start receiving an object
where it receives null today: `isCarryGear`, the rack logic in four places, `itemSlots`,
the carry/worn normalization in migrate, and the instance-id split. The split is the one
that matters, because `stackable` flipping to false for those 105 makes it fan any id-less
`qty > 1` row into per-instance rows, which is a one-way change to saved data. Checked
against the live roster: **no row on any of the six characters would change shape**, since
purchases already mint ids and the builder cannot grant these. So the change is safe as far
as it has been measured, but it is a separate change with its own verification surface, and
bundling it into a money fix would have made both harder to trust.

An adversarial audit of those thirteen callers was attempted twice and both runs died
entirely on API 529s, zero agents completing. **That is a failed run, not a clean result**,
and it is recorded as such rather than as evidence of nothing to find. The tracing above
was done by hand.

### Verified

* **The original repro, re-run through the real market and bench.** Two BUY clicks, 𝒢360,
  two id-bearing rows. The picker now reads `Extended Shaft · Mod ×2` where it read
  `· Mod`. Installed one on the Quarterstaff; **the second is still offered** and installs
  on the Halberd. A third is correctly refused, so the over-install guard still holds.
* **The other two lanes.** Armor Mods and vehicle Mods read the same counter and were fixed
  by the same line. A mixed record of two instanced rows plus a legacy pooled row of 3
  counts 5, which is the point: it is right for both shapes at once.
* **Numeric-string qty** coerces instead of concatenating: `"3"` and `2` count 5, not
  `"032"`.
* **102 tab and bench visits across all six roster characters: zero console errors.**


## Environment

- **Parts 2 and 3 are not spilled in full.** Chrome refuses downloads from
  `docs.google.com`, so only Part 1 is on disk (`ms/part1.md`). Targeted extracts of
  the changed passages are at `ms/targeted-2026-08-04.md`. Unblock by allowing
  automatic downloads for that origin.
