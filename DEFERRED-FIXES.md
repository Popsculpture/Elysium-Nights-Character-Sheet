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

**L10. The new rig read has no `Array.isArray` guard, and `load()` answers the throw by
discarding the entire roster.** GROUP D. `app/js/engine.js:1314`
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

**L11. The Toxicologist rename migration misses `ch.talents`.**
`app/js/store.js:271-275` migrates only `ch.universalUpgrades[lvl].talent`. `ch.talents`
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
before-and-after numbers. Entry identity is now complete: **every equipment row's
`entryKey` is unique after migration**, whether it arrived with an id, without one, or
with somebody else's. Only the two recorded nits are left in this section, and neither is
a defect to fix.

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
was fingerprinted, not just the fields this work touches. **All twenty-six shapes without
a duplicate id hash identically to the pre-fix run**, including the eleven that mint ids,
which is the load-bearing part: `mintId()` draws exactly one random number per instance
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
item's first owned entry, anything else is dropped.** The live-entry test running first is
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
| Shop | 10 percent of list per point | 1 Downtime period, no roll, pays on the spot |
| Bench | 5 percent of list per point in parts | a Simple Project using Engineering |
| Fab Rig | 0 parts | `Portable Fabrication Rig` in the stash prints the plate |
| At 0 DR | full parts cost (`materialCost`, half list) | not a repair: an ordinary Project |

Measured on an Anvil Frame (list 920, base 5): 2 points shop `𝒢184`, bench `𝒢92`; 3 points
shop `𝒢276`; a full 5 points shop `𝒢460`, which is half of 920 and reproduces the rate
derivation the manuscript gives, so nobody retunes it by accident. A breached suit's
rebuild is `𝒢460` in parts at the item's own Project tier (Standard, target 5), restoring
the whole base.

The bench lane hands the work to the existing Projects system: `tbStart` carries
`repairKey` (the armor entry) and `repairPoints`, the card rolls, salvages, secures and
logs like any other Project, and `tbComplete` pays out in DR through the one writer, so it
cannot exceed the base and a piece that left the stash mid-Project restores nothing (the
card shows a `PIECE GONE` chip in that case, verified). The quality edge is the ordinary
results table: a log containing a Flawless interval sets `armorGuard`, and the next point
of DR the suit would lose is absorbed.

### The crafter gate is not a new rule

`EN.crafting.tiers` already carries `skillTier` per tier ("Expects Proficient" on the
bench chips), and it was DISPLAYED and never ASKED. `EN.crafting.meetsTier(tierKey,
skillTier)` asks it, against `EN.rules.profOrder`. The bench lane resolves as a Simple
Project, so it is closed to an untrained Engineer for the one reason every Simple Project
is; there is no armor-specific gate anywhere. Verified: untrained, the BENCH button is
`disabled` and clicking it creates no Project, while the SHOP lane still works; granting
Engineering Proficiency enables it with no other change.

**Scope note, deliberate and worth knowing.** `meetsTier` is called from the bench lane
only. Blueprints and custom Projects remain advisory (untrained just pays +2 Snag), which
is the pre-existing behaviour, and the 0 DR rebuild routes through that same ungated
ordinary path on purpose so it matches building the identical suit from the Blueprints
panel. Making the tier requirement bite everywhere is a real change to every Project in
the app and was not in this step's scope.

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

## STEP 5 IS ON A BRANCH, NOT ON MAIN

Armor Repair is built and mostly working, but review found defects serious enough that
it was committed to `armor-repair-wip` rather than `main`. Fix these, then merge.

**Blocking, data corruption:**

- **The migration lands name-keyed wear on a different piece than the one damaged.**
  Confirmed live and called "the one that matters" by the reviewer. A saved character
  loading once has its armor damage silently moved to the wrong suit. This is why the
  branch exists: it corrupts real records rather than merely reading wrong.

**Blocking, spec violation:**

- **The bench gate IS a new gate.** The instruction was explicit that the existing
  Project Tier requirement closes the bench lane and no separate gate should be added.
  `meetsTier` is now the ONLY place in the app a Project tier is enforced, and it is
  called from the bench lane alone. So the cheap lane is gated and the stronger lane
  is not, which is backwards, and Blueprints and custom Projects remain ungated. Either
  enforce tiers everywhere Projects are created, or nowhere and let the existing
  machinery do it. Not in one lane.

**Rules fidelity:**

- **Leased armor is priced off the lease deposit**, so both lanes and the rebuild
  mis-price a leased suit.
- **Both lanes are all-or-nothing**, so the per-point rate the rule specifies is not
  actually purchasable per point. The manuscript prices per point of DR restored.
- **A repair Project can complete without paying**, making the bench lane's parts cost
  optional. Inherited shape from the existing Project flow, but it lands here.
- At least one path **debits payment and restores zero DR**.

**Not fixed, reproduced, and it lands on this step:** the split's skip clause
short-circuits on `e.id` before looking at `qty`, so entry identity holds per ROW and
not per PIECE. One id-carrying row with `qty: 3` is three suits sharing one DR track,
verbatim the "two Kevlar Weaves share a repair state" case. Import and hand-edit only.
The fix is one clause in the split affecting every multi-quantity row of every gear
type, so it wants its own seeded-RNG verification run like the two before it.

**Worth keeping from this round:** the implementer chose `ch.armorWear` (points LOST)
over the sketched `ch.armorDR` (current value), because absent then means undamaged and
a re-acquired piece arrives fresh with no heuristic, matching `ch.rig.hp` and
`shieldWear` in one shape. That reasoning is sound and should survive the fixes. It also
found and fixed a defect in its own work: two writers existed briefly and the Impact
Table's ignored the quality guard, now collapsed to one writer that clamps both
directions.

## Environment

- **Parts 2 and 3 are not spilled in full.** Chrome refuses downloads from
  `docs.google.com`, so only Part 1 is on disk (`ms/part1.md`). Targeted extracts of
  the changed passages are at `ms/targeted-2026-08-04.md`. Unblock by allowing
  automatic downloads for that origin.
