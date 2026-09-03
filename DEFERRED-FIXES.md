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
- **REVERSED 2026-08-19: a wielded body DOES get the Walking Anvil step-up.** The manuscript
  settled it the other way, so the 2026-08-16 exemption below is dead. A body is an
  improvised weapon and steps like one: a Juggernaut's Bludgeon and Throw each deal 1d12,
  not 1d10. **BUILT** in `codex.js`, as a note on the People as Improvised Weapons block
  rather than a prose rewrite, because the 1d10 is stated in three places and is correct
  for everyone who is not a Juggernaut. The superseded ruling and its question follow.
- ~~**RULED 2026-08-16: a wielded body does NOT get the Walking Anvil step-up.**~~ Bodies are
  exempt; that text stands on its own and the Walking Anvil does not reach it. Nothing to
  build, and the current behaviour was already correct. The original question follows.
- **Juggernaut step-up on a wielded body.** The Walking Anvil steps improvised
  weapons up one die, and a wielded body is explicitly a Heavy improvised weapon.
  Not applied, since that text lives in a separate block.
- **RULED 2026-08-16: the damage tray learns flat-only totals, AND preloads unconditional
  riders.** The base unarmed strike opens a tray like every other attack, showing its flat
  1 plus Body Modifier, and unconditional riders are preloaded into it. Shock Gloves is the
  only rider that qualifies today, so the preload needs a rule rather than a list: a rider
  that fires on every hit with no condition attached. The original question follows.
- **Should the damage tray learn flat-only totals?** The base unarmed strike is a
  flat 1 plus Body Modifier, and the tray is dice-driven, so the base strike opens no
  tray. Riders are also not preloaded into it; Shock Gloves is the one unconditional
  rider that could be.
- **ALL 12 REMAINING PART C ITEMS RULED 2026-08-16.** M16 through M27 each carry an author
  ruling in `RULES-SYNC-CHANGELOG.md`. Note the count: this line previously said 14, which
  was stale, since M1 through M15 were already ruled or resolved. **Seven of the twelve
  move the app, not the book**, and are listed as buildable work below.

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
  **RULED 2026-08-16: widen the regex.** Tolerate `**` in all three copies, which fixes `Rig
  Fuel`, `Biological Meltdown` and `Chemical Warfare` together and disarms the trap for
  every future bolded string. Because it reclassifies features, the build wants a
  before-and-after sweep of EVERY feature's action type, not just the three named ones, so
  any fourth case surfaces as a deliberate change rather than a surprise.
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


## One catalog, and a stacking rule about state rather than category

Brandon, 2026-08-12: "what issues would arize if I set the parameters that consumable gear
and mods should stack? my thought process is that those types of things are identical and
for all intentions immutable. weapons, armor and vehicles are not, for example, two pistols
side by side can be totally different thanks to mods." Then, after the analysis below:
"ok, adopt it."

### What the analysis found before anything was changed

**Half of it was already the rule.** 37 items already pooled: 19 in the `consumables`
bucket, 7 Resonance Tonics, 11 ammo types through `legality: "As weapon"`.

**One real carve-out, and it is not a category.** Of the four candidate categories, exactly
one member carries per-copy state: **Sentinel Active Defense**, an armor Mod with upkeep 90.
The buy path attaches `leaseDays` / `leaseDue` / `leaseOwned` to the ROW, and its own comment
already knew why that matters: "leased gear is never pooled, so each contract is its own
instance and re-leasing an item already in arrears never clears another one's debt." Pool it
and two contracts share one clock. So the predicate is not "is it a mod", it is **"does a
copy carry state of its own"**, and the rule is written that way.

**The premise about weapons is not true in this app.** `ch.weaponParts` is keyed by weapon
NAME. Measured live: two Machine Pistols, one `weaponParts` key, and setting a Suppressor on
the type means both entries resolve it. `weaponAmmo` and `weaponGrip` are name-keyed too, and
the bench dedupes its weapon chips by name, so you see one Machine Pistol however many you
own. **You cannot currently give two same-named weapons different mods.** The conclusion
still holds for other reasons (equip, carry, rack and slot state are per entry, and armor and
shields have genuinely mutable per-piece state), but the stated justification does not. Left
as a design fork for the author, not fixed: either weapons should be independently moddable,
which means re-keying `weaponParts` to entry ids, or mods-apply-to-the-type is the rule and
the reasoning needs restating.

**One category Brandon did not name, now included.** Ciphers (36) and #GRID Hardware Mods
(deck chips) are software with no per-entry state, and `ch.grid` holds cipher KEYS rather
than rows. Smartdecks, B&E Buddies and Trauma Rigs are the opposite (`ch.rig.key`,
`ch.rig.hp`) and stay individuated.

### The root cause had to go first

The rule could not even be expressed, because the engine could not see the items it was
about. `engine.loadCatalogItem` searched seven pools; `inventory.catalog()` searched those
seven plus weapon Parts, armor Mods, vehicles and vehicle Mods. Measured exhaustively:

| pool | items | resolved by the engine, before |
| ----- | ----- | ----- |
| the seven it searched | 327 | 327 |
| weapon parts | 60 | 0 |
| armor mods | 25 | 0 |
| vehicles | 7 | 0 |
| vehicle mods | 13 | 0 |

`isStackableItem(null)` answers TRUE on its unknown-item line, so all 105 read as **pooled**
to anything asking the engine while `inventory.js` resolved the same names and read them as
per-instance. One question, two doors, opposite answers.

**Registered, not hardcoded, and it hands over the SAME normalized objects inventory builds
for its market cards.** That is not tidiness. A raw weapon Part carries `slot: "handling"`,
and `itemSlots()` reads `.slot` as a BODY slot; `partAsItem()` renames it to `partSlot` for
precisely that reason. Feeding raw objects in would have imported every such collision. (As
it happens body slots are capitalized and part slots are not, so `itemSlots` would have
filtered them anyway, but the next collision might not be so lucky.) Lazy because engine.js
loads before inventory.js, and cached because `loadCatalogItem` runs once per equipment row
inside several loops.

### The merge, and what it refuses to merge

Everything bought before the ruling is on disk as one id-bearing row per copy, and flipping
the flag does not fold them: `addToStash` only merges into a row with no id, so the next
purchase opens a fresh pooled row beside the old ones and one name ends up in two shapes at
once. Counting survives that, because `ownedQtyOf` already sums every row of a name, which is
why that fix went first. The merge is so the Stash stops showing four cards for four
identical chips.

**Only bare rows merge.** A row carrying anything beyond id/name/qty, or an id that any
per-entry map still points at, is left exactly where it is. That is the standing ruling
applied honestly: unattributable state is dropped rather than moved, so rather than merge a
row and silently discard the carry status or lease clock keyed on its id, the row does not
merge. It stays a per-instance stray, which the summing counter handles, and nothing is
destroyed to tidy a display.

### Verified

* **Resolution:** 60/60 weapon parts, 25/25 armor mods, 7/7 vehicles, 13/13 vehicle mods now
  resolve. All 327 of the original seven pools still resolve.
* **The rule:** parts 60/60 pool, vehicle mods 13/13, armor mods **24 of 25** with Sentinel
  Active Defense correctly excluded, vehicles **0 of 7**. Unchanged and still per-instance:
  weapons, armor, shields, Backpacks, Smartdecks, kits. Newly pooling: ciphers, deck chips.
* **The merge, five shapes.** Four bare rows fold to one of qty 4 while a Longsword beside
  them is untouched. A row named by `ch.carry` stays separate and keeps its carry status. Two
  leased Sentinel rows keep their own clocks. A legacy pooled row of 3 plus two instances
  folds to 5. Armor at qty 2 and a Longsword at qty 3 still fan into per-instance rows, with
  the first keeping the id `equippedArmor` points at.
* **Idempotent from the first load.** Feeding each load's output back in, three times: the
  equipment signature is identical at loads 1, 2 and 3.
* **End to end through the real market and bench.** Three BUY clicks on Extended Shaft,
  𝒢540, ONE row of qty 3. Picker reads `×3`, installs on the Quarterstaff, then reads `×2`
  and installs on the Halberd. The Stash shows one card instead of three.
* **Nothing else moved.** `itemLoad` unchanged: parts, armor mods and ciphers weigh 0,
  Longsword 2, Courier Shell 1. Armor DR unchanged across every real armor entry.
  `armorBaseDR` now requires `kind === "armor"`, because armor Mods carry a `dr` of their own
  (Trauma Plates is dr 1) and resolve now. Measured: `armorModAsItem` does not copy `dr` onto
  the normalized object, so that guard is not closing a live hole, it is refusing to depend on
  an omission. Same shape as `shieldBoxesMaxOf` requiring `kind === "shield"`.
* **108 tab, bench and print-sheet visits across all six roster characters, zero console
  errors, and a PDF built at 180,563 bytes.**

### Noted, not changed

* **A vehicle and a vehicle Mod both weigh 1 load.** They did before this change too (the
  `!it` fallback returned 1), so nothing moved, but a garaged vehicle arguably should not sit
  on a carry budget at all. `itemLoad` zeroes weapon Parts, armor Mods, deck chips and ciphers
  by name and never learned about the vehicle side.
* **"Hair Trigger" is both an Operator subclass feature and a weapon Part.** Harmless today,
  since features are not looked up in the item catalog, but the names now both resolve.

### A probe note

Three times this session a probe used an item name that does not exist ("Autopistol",
"Medkit", "Kevlar Weave", the last two lifted from this log's own illustrative examples), and
each time the null result briefly read as a finding about the code. The catalog is the
authority on what exists; a probe that invents a name is testing nothing. Real armor is
"SkinPlan Daywear", "Liner Mesh", "Courier Shell".


## Two pistols are two pistols: mods, grip and magazine per ENTRY

Brandon, 2026-08-12, after the analysis that showed his stated premise was not implemented:
"same-named weapons should be independently moddable." And on the one adjacent question,
ruled per entry as well: each weapon entry tracks its own magazine and fire mode.

### What was actually true before

`ch.weaponParts` was keyed by weapon NAME. Measured live: two Machine Pistols, ONE
`weaponParts` key, and setting a Suppressor on the type meant both entries resolved it.
`weaponAmmo` and `weaponGrip` were name-keyed too, the bench deduped its chips by name, and
`equippedNames` collapsed equipped entries to unique names before the weapon panel ever saw
them. So the sheet could not express two same-named weapons differing in any way, and the
thing the log had been citing as the reason weapons are per-instance was not the reason.

### Grip had no choice about following

A forced two-handed grip comes FROM a Part fitted to one piece. Leave grip name-keyed while
parts go per-entry and the question "is this weapon forced two-handed" has no answer: the
resolver is handed a catalog item, and a catalog item cannot tell two pistols apart. Ammo
was the one genuine choice; ruled per entry too, so two pistols no longer share a magazine.

### The resolvers take an ENTRY, and a missing key is not a fallback

`weaponPartsOn(ch, key)`, `weaponReach(ch, item, key)`, `weaponGrip(ch, item, key)`,
`readAmmo(ch, item, key)`. **No key answers for an unmodded weapon of that type**, which is
the honest answer for a caller with no piece in hand (a shop card, a catalog preview).
Falling back to the name would have quietly restored the bug this replaced, so it does not.

`writeAmmo(key, patch)` and `reloadWeapon(key)` resolve the catalog item off the entry rather
than being handed a bare name, so there is no path where a writer knows the type but not the
piece. `_recoil` holds an entry key, so firing one pistol kicks that card and not its twin.

### Two lists where there was one

`equippedRows` (one per equipped piece, with a `label`) drives the weapon panel, the trays,
the ammo controls and the MODS chips. `equippedNames` survives for the two consumers that
genuinely want names: the reorder arrows, whose index feeds `moveWeaponName` and must match
the raw stored array, and the Parry source list, where two copies of a weapon offer the same
die anyway. The bench got the same treatment: `ownedWeapons` returns entries and
`_benchWeapon` holds an entry key. Both exports iterate `equippedWeaponRows`.

**Labels only number a name that actually repeats.** A character with one of each reads
exactly as it always did; two Quarterstaffs read "Quarterstaff 1" and "Quarterstaff 2" on the
bench, on the weapon row, on the print sheet and in the PDF.

### The migration, and the bug in the first version of it

Name-keyed state goes to the FIRST entry of that name and the others start clean. That is the
ruling the instance-id split already applies to armor wear and Rig damage: state that cannot
be attributed to one piece is not duplicated onto another. It is also the arithmetic the
player already owns. One Extended Shaft installed "on the Quarterstaff" used to arm every
Quarterstaff at once; you own one Part, so exactly one keeps it. State naming a weapon the
character does not own is dropped, for the same reason the wear maps drop an orphan.

**The first version keyed off `nameToIds` and lost everything.** That map is only populated
for rows the split actually fanned, so an ordinary `{id:"eq_x", name:"Quarterstaff", qty:1}`
row never appears in it, and the re-key dropped the install on every weapon that did not
split, which is the common case. Caught by running it: a two-Quarterstaff record came back
with an empty `weaponParts` and the Extended Shaft simply gone. Rebuilt to derive the
name lookup from the FINAL equipment array.

**And the Fits sweep had to move.** The Long-Shafted un-install pass resolved its weapon with
`catalogItem(<map key>)`, which only works while the keys are names. Left where it was it
would have run correctly exactly once: on the second load the keys are entry ids,
`catalogItem(<id>)` answers null, and it skips every loadout while reading as though it had
passed. Relocated to after the re-key and made entry-aware.

### Verified

* **Migration.** A legacy record with a shared `weaponParts` on "Quarterstaff", a shared
  magazine on "Machine Pistol", and a grip on an unowned Longsword: the install lands on
  `q1` only, `q2` has no loadout at all, ammo lands on `p1` at cur 4 with `p2` full, and the
  unowned grip is dropped. **Idempotent across three loads** feeding each output back in.
* **The resolvers disagree between pieces, which is the whole point.** Same character, same
  catalog item: `q1` reaches 3 and deals 1d8 forced by Extended Shaft; `q2` reaches 2 and
  deals 1d6 with no forcing.
* **The bench, through the real UI.** Two chips, "Quarterstaff 1" and "Quarterstaff 2".
  Fitting the shaft to the second one stored `w2` only and left `w1` null.
* **The weapon panel.** `Weapons (2)`, two rows: "Quarterstaff 1" at `DMG 1d6 +3` with a
  `Versatile (1d8)` chip and a `ONE-HANDED · 1D6` toggle, and "Quarterstaff 2" at
  `DMG 1d8 +3`, Versatile chip removed, `TWO-HANDED ONLY · 1d8`, `MODS +1 Reach, adds
  Two-Handed`, and `+2 reach · AT CAP` where the first reads plain `+2 reach`.
* **Two magazines.** Seeded m1 at 5 and m2 at 3, clicked RELOAD on the second row only:
  m2 went to 20 and **m1 stayed at 5**.
* **Both exports.** Print sheet and a PDF at 183,611 bytes each print two rows:
  `Quarterstaff 1 | 1d6 (1d8) Bludgeoning | ... held one-handed (1d6)` and
  `Quarterstaff 2 | 1d8 Bludgeoning | ... two-handed only (Extended Shaft)`, with the reach
  note capped on the second and not the first.
* **132 tab, sub-tab, bench and print-sheet visits across all six roster characters: zero
  console errors.**

### Left alone, deliberately

The reorder arrows still index `equippedNames`, because `moveWeaponName` swaps a slot of the
raw stored array and an index from a per-entry list would move the wrong slot. That coupling
was already recorded as a pre-existing wrinkle and is still one; it is not made worse here,
but reordering a loadout that holds two copies of one name is now a sharper question than it
was, and it should be looked at on its own.


## Armor and vehicles follow the weapons; decks and Rigs turn out to be different questions

Brandon, 2026-08-12: "same needs to go for same-named armor, vehicles, smartdecks and
trauma rigs, they should be independently moddable too."

Two of those four were the same job as weapons. The other two are not re-keying problems at
all, and saying so is more useful than pretending otherwise.

### Armor was the sharpest case, because the same suit had two identities

`ch.armorMods` was keyed by armor NAME while `ch.armorWear`, `ch.armorGuard` and
`ch.shieldWear` were keyed by the ENTRY. So a damaged Courier Shell knew exactly which piece
it was and a modded one did not: fit Trauma Plates to a suit and the spare in the stash wore
them too, while the DR each had lost stayed correctly separate. Measured before the change,
on a record whose `armorMods` read `{"Courier Shell": [...]}` beside an `armorWear` of
`{a1: 1}`.

`eng.armorModsOn(ch, key)` is now THE resolver, asked by all four readers (mod DR, both seal
questions, Load Distribution, the Block card) so they cannot drift. `armorModDR` takes the
entry key and `defenseLoadout` hands it the worn suit's `armorKey`, which it already had.

**A visible consequence worth naming:** the Impact Table header used to print the catalog
BASE DR and carry a comment apologising that it could not know which suit it was. It prints
that piece's own current DR now, and the apology is gone.

### Vehicles were the same shape, one file over

`ch.vehicleMods` was name-keyed; it is entry-keyed now, and the Garage iterates pieces.

### Smartdecks are not a name-keyed map, and that is the finding

`ch.grid` holds `deckType`, `deckTier`, `deckMods` (a FLAT array) and `deckHpSpent` (a single
number). There is no map to re-key: the #GRID tab models **one live rig for the character**,
chosen by TIER from a dropdown, and it is not tied to an owned equipment entry at all. Decks
are purchasable items (Standard through Apex Smartdeck), so you can own two, but the tab has
no concept of which one you are jacked into.

So "two decks independently moddable" is a redesign rather than a re-key: the deck would have
to become an owned entry with its own mods and its own Integrity, and that raises a rules
question this log cannot answer for itself. **Can two decks be live at once, or do you jack in
with one and the others sit in the bag?** If it is one at a time, the shape that matches the
rest of the app is the Trauma Rig's: an entry-keyed pick plus an entry-keyed damage map, i.e.
`ch.grid.deckKey` naming a specific owned deck, `deckMods` and `deckHpSpent` becoming
`{entryKey: ...}`. That is buildable, but it wants an author ruling first, so it is NOT built
here.

**RULED 2026-08-16: one deck live at a time.** You jack into one and the others sit in the bag,
so the shape above is the one to build: `ch.grid.deckKey` naming a specific owned deck,
with `deckMods` and `deckHpSpent` becoming entry-keyed maps. This is the Trauma Rig's
shape, which is the point: it is the pattern the app already uses rather than a new one.
Migration has to move the existing flat `deckMods` array and single `deckHpSpent` number
onto whichever owned deck the character has, and drop them if the character owns none,
per the standing rule that unattributable state is dropped rather than moved.

### Trauma Rigs already work the way the ruling asks, and have no mods to speak of

`ch.rig` is `{key, scrap, hp}`: `key` names one specific owned ENTRY and `hp` is
`{entryKey: spent}`. Both have been per-piece since the Rig work in step 4. And there is no
Rig mod system at all: searching the whole tree for a Rig mod map returns nothing, "Hardware
Mods" are Smartdeck plug-ins, and `gear_tools.js` says in as many words that B&E Buddies
cannot take mods either. So there is nothing to make independently moddable; the state Rigs
DO carry is already per entry.

Two Rigs of the same tier are therefore already independent for damage, and only one is live
at a time by design (`rig.key` is a single pick). If Rig mods are ever written, they should be
`{entryKey: [modKey]}` from the first line.

### Verified

* **Migration.** `armorMods: {"Courier Shell": ["trauma-plates"]}` becomes `{a1: [...]}`,
  landing in the SAME keyspace as `armorWear: {a1: 1}`. `vehicleMods` likewise to `{v1:
  [...]}`. The spare suit `a2` resolves to no mods at all. Idempotent on re-import.
* **The resolver follows the piece, not the type.** Same character, Reactive Plating on `s1`
  and Trauma Plates on `s2`: wearing `s1` reports mod DR 0, and swapping to `s2` reports 1.
  The number moves when the suit moves.
* **The Impact Table, through the real UI.** Two chips, "Courier Shell 1" and "Courier Shell
  2". Header prints `1 / 2 DR` for the damaged piece and `2 / 2 DR` for the other. Fitting
  Trauma Plates to the second stored `s2` only and left `s1` empty.
* **136 tab, bench and print-sheet visits across all six characters, zero console errors, and
  a PDF at 180,669 bytes.**

### A test artifact worth recording, because it looked like a bug

The 136-visit sweep clicks every button it can find, which includes EQUIP toggles, so it
left `equippedArmor` null and the follow-up read of worn mod DR came back 0 for a reason that
had nothing to do with the change. A sweep that clicks indiscriminately is a good way to find
throws and a bad way to leave a fixture in a known state; the worn-suit assertion had to be
re-run against a freshly seeded record.


## L4, RULED AND FIXED: "in its place" was the whole mechanic

The long-running L4 question is closed, and the answer was not any of the three options this
log had drafted.

### How the question got asked wrong twice

First reading (mine): the pairing's damage clause is a no-op, because Open Architecture
derives 1d8 at Brandware with or without it. Measured and true, but it treated the clause as
a promise about a NUMBER.

Second reading (Brandon's first answer): Synthetic Musculature is not a standalone feature at
all, but a benefit derived from Human + NextGen + Open Architecture + Reinforced Skeleton.
This was checked against the app's data before anything was built, and it contradicted it:
`species.js` carries Synthetic Musculature as an independently selectable NextGen feature,
`rules.js lineageCreationFeatures.nextgen` offers it as one of four picks at level 1, and
Open Architecture's own text lists it among SEVEN pairings whose clause it "opens", which
only parses if you already possess it. **Raising that contradiction is what produced the real
ruling** rather than a refactor that would have deleted a level-1 pick and left NextGen with
three.

### The ruling

Brandon, 2026-08-12: "Synthetic Musculature is a standalone lineage trait for NextGen Humans,
the requirements should be: Human + NextGen + Synthetic Musculature + Open Architecture +
Reinforced Skeleton = symbiotic bonuses of Synthetic Musculature (Reinforced Skeleton): When
you install a Reinforced Skeleton at any tier, **the Engineered Baseline effect ends.** Your
synthetic muscle has integrated with the new bone-weaving. **In its place**, the Reinforced
Skeleton's unarmed strike damage die increases by one size, and you retain the Encumbrance
Threshold bonus and the Size-larger bonus for grappling."

**"In its place" is the mechanic, and it is not about the number.** Synthetic Musculature's
step is GENERIC: it lands on whichever replacer you strike with. Integrated, that generic step
ends and the benefit becomes SPECIFIC to the implant's die. With only a skeleton installed the
two readings produce the same number, which is exactly why the pairing looked like a no-op
when measured. The difference appears the moment a second replacer exists.

### Measured, before and after

| setup | before | after |
| ----- | ----- | ----- |
| skeleton Brandware, SM only | 1d6 replacer + generic step = **1d8** | unchanged, **1d8** |
| skeleton Brandware, SM + OA | 1d6 replacer + generic step = **1d8** | replacer is **1d8**, no step |
| skeleton Blackware, SM + OA | 1d8 + step = **1d10** | replacer is **1d10**, no step |
| skeleton + razors, SM only, striking with the RAZORS | **1d8** Slashing | unchanged, **1d8** |
| skeleton + razors, SM + OA, striking with the RAZORS | **1d8** Slashing | **1d6** Slashing |
| SM + OA but NO skeleton | 1d8 | unchanged, **1d8** (requirement unmet, baseline still runs) |

The last two rows are the ruling. Integrated, the Engineered Baseline has ended, so the razors
are bare at 1d6 and the skeleton's own option reads 1d8 instead. Unintegrated, nothing moves.

### What changed in the code

`synthMusculatureIntegrated(ch)` is one predicate, because it now gates two things and two
copies would drift. Human and NextGen are not tested separately: both features are NextGen
human lineage features, so holding both IS that half of the requirement, and testing a stored
species string as well would only give a hand-edited record a way to lose a benefit it has.

The increase moved to where the die is READ (`unarmedReplacers`) rather than staying a floating
step in `unarmedIncreases`. That is what makes it stay with the skeleton when the player
strikes with something else. `unarmedIncreases` now SKIPS Synthetic Musculature's step when
integrated instead of merely relabelling it, which is what the old code did and is how the
pairing came to advertise as its enhanced capability a die the character already had.

**The note is now true rather than fixed.** It used to read "Open Architecture: the step lands
on the Reinforced Skeleton's die" while the step landed on whatever won, reproduced with Hand
Razors picked: 1d8 Slashing off the razors under a note naming the skeleton. There is no note
to correct any more, because the step is gone and the implant's own die carries the label.

The pairing text was updated to Brandon's wording in both places that print it,
`app/data/rules.js` and `app/data/species.js`.

### L3, closed in the same pass because the ruling promoted it

`builder.js toggleChrome`, behind the Open Architecture card's "+ CHROME" button, minted an
installed-chrome record with **no `key`**. The card's own chip reads `base || name` through
`installedCyberBases`, so it lit up, while every mechanical reader looks the piece up by key:
`CYBER_UNARMED[cw.key]` for the die, and now `cw.key === "skeleton"` for the integration gate.
Before the ruling that cost a wrong note. After it, a player who marked the skeleton there
would have seen INTEGRATED and been granted nothing at all. The toggle resolves the key from
the catalog by name now, minting the same shape the Chrome tab does. A name the catalog does
not carry still stores without a key, which is the honest outcome for a piece the rules do not
have.

Verified: the toggle's record stores `key: "skeleton"`, the skeleton is offered as a replacer,
and integration steps it to 1d8 at the null tier (which reads as Streetware, per the existing
"a legacy hand-entered piece carries no tier" rule).

### Verified

* The six-row table above, measured on fresh records through `importCharacter` and `derive`.
* The decisive pair measured with the razors explicitly picked: **1d8 Slashing unintegrated,
  1d6 Slashing integrated**, with the skeleton's option at 1d8 in the second case.
* L3 closed, with the derived strike checked end to end.
* 96 tab, builder-step and print-sheet visits across all six roster characters: zero console
  errors.

### A process note

Two workflows in this session died wholesale, one on repeated API 529s and one on the session
limit (108 of 112 agents). Both returned empty or partial result sets that would read as "no
findings" to anyone who did not check the failure list. The survey half of the second run did
complete and its leads were useful, but **none of it was verified**, so it was treated as
leads and re-checked by hand rather than quoted as fact.


## L4, second pass: the step is a blanket one, and the pairing's real debt is the SP

The reading shipped an hour earlier was wrong, the author caught it from the numbers, and
this is the correction plus what looking for it turned up.

### What went wrong and how it surfaced

"In its place, the Reinforced Skeleton's unarmed strike damage die increases by one size"
was implemented literally: Synthetic Musculature's generic step was removed and the increase
was moved onto the implant's own die. That is defensible from the words and it produced a
real regression, which the report named rather than buried: **skeleton plus Hand Razors,
striking with the razors, went 1d8 Slashing to 1d6 and lost Armor Piercing 1 at that die
size.** Open Architecture became a downgrade for anyone running a second replacer.

Brandon, reading that: "I was thinking it would blanket step up the user's unarmed damage.
I'm going to want to change it to enhance all unarmed by one step, making the fist and the
razor 1 step higher independently and not stacking."

**The correction was cheap because the regression was reported as a consequence of the
ruling rather than presented as a finished feature.** The reading was wrong; naming the
razors case in the same breath as shipping it is what made it a one-message fix.

### What the sheet does now

Reverted to the blanket step, which is what Synthetic Musculature always did, and which the
STRIKE picker was already rendering correctly: `eng.stepDie(o.die, steps)` per option, with a
comment already explaining that every chip shows what THAT pick would deal. So "independently
and not stacking" needed no new code at all, only the removal of the code that had broken it.

Measured, skeleton (Brandware) plus Hand Razors, Synthetic Musculature plus Open Architecture:

| option | die shown, and rolled if picked |
| ----- | ----- |
| bare fists | flat 1 becomes **1d4** |
| Reinforced Skeleton | 1d6 becomes **1d8** Bludgeoning |
| Hand Razors | 1d6 becomes **1d8** Slashing |

`increases.count` is **1** in every configuration, so nothing compounds. With a Blackware
skeleton the same character reads skeleton 1d10, razors 1d8, fists 1d4.

The clause text in `app/data/rules.js` and `app/data/species.js` was rewritten to describe
the blanket step. **That wording is mine, matching Brandon's stated intent, and the manuscript
is the authority.** It should be replaced with his own sentence when he writes it.

### And the finding underneath: the SP reduction does not exist

Open Architecture's own text promises, for every activated pairing, that the chrome's
"Static Point cost is reduced by 1 (minimum 0)". Read `staticTotal` in engine.js: it knows
about platform-slotted mods (a mod seated in a Cyberarm adds no SP) and about the Resonance
Crown (up to 4 pieces at 1 SP off each), **and nothing else**. There is no Open Architecture
reduction anywhere in the engine.

Which matters more now than it did this morning. Under the blanket-step ruling the pairing
adds no damage the character did not already have, so the SP -1 IS the Synthetic Musculature
pairing's live mechanical benefit, and it is unimplemented. **Open Architecture currently does
nothing at all for this pairing.** That is the original L4 finding standing, relocated from
the damage clause to the SP clause.

Not built here, deliberately, and it should not be built as a one-off. Open Architecture
grants the reduction to all SEVEN pairings, and `R.openArchitecture.combos` already carries
the feature-and-chrome pairs as data, so the implementation is one generic pass over that
list rather than a predicate per pairing. It also lands on Chrome Tax, which drives the
Static Threshold, which cuts max Resilience Dice and a Shaper's max Reservoir, so it has a
real verification surface of its own.

The `synthMusculatureIntegrated()` predicate written for the first reading was **deleted**
rather than left behind for that work, with a comment saying why: a one-off predicate is the
wrong shape for a rule that covers seven pairings from data.

### Verified

* The five-row table above, on fresh records through `importCharacter` and `derive`.
* The regressed case specifically: razors picked, Synthetic Musculature only versus
  Synthetic Musculature plus Open Architecture, **1d8 Slashing in both**. No difference,
  which is the point.
* `increases.count === 1` in every configuration tested.
* 84 tab, bench and print-sheet visits across all six roster characters: zero console errors.


## Open Architecture is entirely unimplemented, all seven pairings and the SP clause

Brandon, after the second L4 pass: "I don't know if you captured every interaction, did you
read all of Open Architecture?"

Fair challenge, and the honest answer is that the text had been read and quoted but only ONE
of the seven pairings had ever been audited. Auditing the other six is what this entry is.

### Measured, not grepped

Each pairing built twice on a fresh record, identical but for the presence of Open
Architecture, and the two `derive()` outputs compared field by field with a stable
stringifier:

| pairing | what the clause owes | derived difference |
| ----- | ----- | ----- |
| Dermal Plating + Subdermal Armor | Baseline CONTINUES; the armor gains +1 DR, stacking | none |
| Synthetic Musculature + Reinforced Skeleton | blanket unarmed step; retain Threshold and grappling | none (the step comes from the feature itself) |
| Dermal Induction + Neural Interface | no port or scarring at any tier; touch-Link past air-gaps; Swift Action 1/Encounter to slave a Tier 0-1 device | none |
| Living Relay + Subdermal Comm | range doubles to 24 spaces; Tech DC 20 even to DETECT the transmission | none |
| Predictive Targeting + Cybereyes | Threat Targeting permanently active; allies deal +1d4 against your target | none |
| Tuned Synapses + Reflex Booster | Initiative +2 on top; retain first-round Speed 2, stacking | none (Speed 7 with and without) |
| Calibrated Gait + Cyberlegs or Spring Joints | +1 Speed beyond normal; half falling damage | none |
| **every activated pairing** | **Static Point cost reduced by 1 (minimum 0)** | **none** |

**The only field that differs across all seven is `features`, and the only entry it gains is
Open Architecture's own description.** Nothing the feature promises reaches a number.

So the original L4 finding was never really about Synthetic Musculature. It was the first
visible symptom of a feature that does nothing. Taking Open Architecture today costs a
Lineage Feature pick and buys prose.

### The work splits in two, and the halves are not the same job

**Hard numbers the engine must move.** +1 DR on the Subdermal Armor; +2 Initiative; +1 Speed;
half falling damage; the ally's +1d4 against a marked target; and the SP -1 on every activated
pairing. These are ordinary derived-value work, and the SP one is the widest: it lands on
Chrome Tax, which sets the Static Threshold, which cuts max Resilience Dice and a Shaper's
max Reservoir.

**Clauses with no number to move.** The Datajack's absent port and touch-Link, the untraceable
comms, permanently-active Threat Targeting, the once-per-Encounter device slave. These are
fiction and GM-facing permissions. They do not want engine arithmetic; they want to APPEAR ON
THE SHEET as active text once the pairing is live, the way an ability's brief does, so the
player can see what they now have. That is a display job, not a maths job.

### Shape it should take when it is built

Generic over `R.openArchitecture.combos`, which already carries every feature-and-chrome pair
as data. One predicate answering "is this pairing active" for all seven, one place applying
the SP reduction, one place surfacing the active clause text. NOT a predicate per pairing: the
one written during the first L4 pass was deleted for exactly this reason.

Note the asymmetry in the data worth preserving: Dermal Plating's clause says the Engineered
Baseline effect **continues**, while the other six say it **ends**. Whatever implements this
has to read that per pairing rather than assume.

### Verified

* Seven pairings, fourteen derived records, field-by-field comparison: zero mechanical
  differences.
* Spot-checked Tuned Synapses in detail: features list gains only "Open Architecture",
  Speed is 7 in both, Initiative unchanged.

## Open Architecture, built: the SP clause, the one live number, and every clause on the sheet

"build it." What landed, and what it ran into.

### One predicate for all seven

`openArchCombos(ch)` walks `R.openArchitecture.combos`, which already carries every
feature-and-chrome pair as data, and returns the live pairings with the specific installed
piece each one matched. Seven pairings, one function. The combo's `cyberware` may name
alternatives ("Cyberlegs or Spring Joints"), so the match splits on " or " the way the
builder card's `comboHasChrome` already did. It matches on the piece's catalog NAME, taking
the key's name when the key resolves, because the combo data speaks in names and the two
historical writers (the OA card's toggle, the Chrome tab) wrote different shapes.

Exported, so the builder card and the Chrome tab can stop computing the same answer twice.

### The SP clause, which is the one every pairing shares

"its Static Point cost is reduced by 1 (minimum 0)". Applied **per piece and floored at 0**,
not subtracted from the running total: a 0 SP implant must not hand a refund back to the
pool, and the clause's "(minimum 0)" is about that piece rather than the sum. A piece already
discounted to nothing by a platform slot is skipped, since it pays no SP to reduce.

| pairing | Chrome Tax without / with |
| ----- | ----- |
| Dermal Plating + Subdermal Armor (sp 2) | 2 -> 1 |
| Synthetic Musculature + Reinforced Skeleton (sp 2) | 2 -> 1 |
| Dermal Induction + Neural Interface (sp 1) | 1 -> 0 |
| Living Relay + Subdermal Comm (sp 1) | 1 -> 0 |
| Predictive Targeting + Cybereyes (sp 2) | 2 -> 1 |
| Tuned Synapses + Reflex Booster (sp 3) | 3 -> 2 |
| Calibrated Gait + Spring Joints (sp 2) | 2 -> 1 |

Guards measured: a 0 SP piece stays at 0 with no refund; no reduction without Open
Architecture; no reduction with Open Architecture but no matching feature.

This is not cosmetic. Chrome Tax sets the Static Threshold, which cuts max Resilience Dice
and a Shaper's max Reservoir, so every one of those rows can move a character's survivability.

### The numeric clauses: one had a channel, the rest do not

**Calibrated Gait, "+1 Speed beyond its normal benefits": BUILT.** Speed 7 to 8 on a
Calibrated Gait character with Spring Joints. Not doubled by owning both Cyberlegs AND Spring
Joints (10 either way, because the pairing matches once), not granted with Open Architecture
but no qualifying implant, and an unrelated pairing leaves Speed alone.

**The others are blocked on a layer below them, and this is the finding worth keeping.**
Cyberware effects in `app/data/cyberware.js` are PROSE: `effect`, `street` and `black` are
strings. The only mechanical hook is `tier.bonus`, and `cyberFlatBonuses` reads exactly two
fields off it, `speed` and `wounds`. So:

* **Dermal Plating, "+1 DR, stacking with its normal bonus"** has no normal bonus to stack
  with: Subdermal Armor's own +1 DR (+2 at Blackware) is not implemented, and there is no
  cyber-DR channel at all. Measured: a character with Subdermal Armor derives DR 0. Building
  Open Architecture's +1 alone would print DR 1 where the book says 2, which is a different
  wrong number rather than a right one.
* **Tuned Synapses, "Initiative bonus increases by an additional +2"** has nowhere to land:
  Initiative is modelled as Edge and Caliber flags (`lineageInit: {caliber, edge}`), with no
  flat channel, and the Reflex Booster's own Initiative bonus is not implemented either.
* **Calibrated Gait's "half damage from falling"** has no falling-damage pipeline to halve.

The honest shape of that work is not "finish Open Architecture", it is **implement cyberware
effects generally**: give the tier `bonus` object more than `speed` and `wounds`, wire a
cyber-DR channel and a flat-initiative channel, and then the Integration deltas are one line
each on top. Recorded rather than half-built, because a +1 on a missing base is a number that
looks right and is not.

### Every clause now reaches the player

The three clauses with no number at all (the Datajack's absent port and touch-Link, the
untraceable comms, permanently-active Threat Targeting, the once-per-Encounter device slave)
are exactly the ones a player most needs in front of them, and they were nowhere. Each live
pairing now pushes a feature entry named for the pairing and its chrome, sourced
"Open Architecture (Integration)", carrying the clause text. That flows to the Freelancer
Features tab, the print sheet and the PDF through the paths that already carry ability text,
rather than being reinvented three times. Verified on all seven.

### Verified

* Seven pairings, Chrome Tax measured with and without: every one drops exactly 1.
* Three SP guards: 0 SP piece, no-OA, and OA-without-the-feature.
* Speed: +1 exactly, not doubled, correctly gated, no leakage to other pairings.
* All seven clauses surface as features with the right name and source.
* 84 tab, bench and print-sheet visits across all six roster characters: zero console errors.

## The cyberware effects layer, and the two Integration clauses it unblocked

"take the cyberware effects layer next."

### What was actually there

Not nothing, and not much: `cyberEnhancements` reads each piece's `enhancement` string for its
attribute bonus, and `cyberFlatBonuses` reads exactly two fields off a tier's `bonus` object,
`speed` and `wounds`. Three items carried `bonus` data at all: Reflex Booster and Cyberlegs
(speed), Reinforced Skeleton (wounds). Everything else in the twenty-item catalog was prose in
`effect`, `street` and `black`.

So a character with **Subdermal Armor derived DR 0**, and a Reflex Booster's "+2 Initiative"
reached nothing at all, while the same implant's "+1 Speed" worked.

### What was added, and why only these

`cyberFlatBonuses` now also reads **`dr`** and **`init`**. Those two, and not more, because
they are UNCONDITIONAL on the pieces that carry them and because they were the layer the Open
Architecture clauses were sitting on top of.

Numbers taken from the catalog's own text, not invented. The data files follow a consistent
shape: `effect` is the Streetware and Brandware baseline, `black` is what Blackware upgrades
to, `street` is what Streetware gives up.

* **Subdermal Armor.** effect "+1 DR against Ballistic, Piercing, Bludgeoning, and Slashing.
  Stacks with worn armor." / black "+2 DR vs all physical". So `dr: 1, 1, 2`. It is summed
  into `totalDR` alongside worn armor because the item says in as many words that it stacks.
* **Reflex Booster.** effect "+2 Initiative and +1 Speed" / black "+4 Initiative, +2 Speed".
  The speed half was already `1, 1, 2` and matches; the init half is new at `2, 2, 4`.

Both surface with their own breakdown rows, so the DR tile and the INIT tile say where the
number came from rather than just showing a bigger figure: "Chrome · Subdermal Armor" and
"Chrome · Reflex Booster".

### Deliberately still prose

* **Damage-type Resistances.** Toxin Filter grants Resistance to Toxic (and Radiation at
  Blackware); the Convergence Engine grants Resistance to Resonant. There is no resistances
  channel in `derive()` at all, so this needs a new derived collection AND a display surface,
  not just a summed number.
* **The Convergence Engine's "+1 Vitality max".** Its clause reads "Unattuned: +1 Vitality max
  and Resistance to Resonant", and the sheet has no Unattuned/Attuned state to gate on.
  Implementing it unconditionally would grant it to exactly the characters the clause excludes.
* **Everything conditional, per-encounter, or GM-facing**: Cybereyes' modes, the Smartlink's
  "+1 to attack with a connected smart-weapon", Synthetic Heart's once-per-Long-Rest save,
  every Edge grant. These are decisions at the table, not standing modifiers.

### The two Integration clauses this unblocked

With the layer underneath them, both are one line off the generic pairing list:

| pairing | clause | measured |
| ----- | ----- | ----- |
| Dermal Plating + Subdermal Armor (Brandware) | +1 DR, stacking with its normal bonus | DR **1 -> 2** |
| Dermal Plating + Subdermal Armor (Blackware) | as above | DR **2 -> 3** |
| Tuned Synapses + Reflex Booster (Brandware) | Initiative +2 additional | init **2 -> 4** |
| Tuned Synapses + Reflex Booster (Blackware) | as above | init **4 -> 6** |
| Calibrated Gait + Spring Joints | +1 Speed beyond normal | speed **7 -> 8** |

Every row also drops 1 SP, as the universal clause requires. Open Architecture now moves five
numbers where three days ago it moved none.

What remains unbuilt of the seven pairings is the half with nothing to move: the Datajack's
touch-Link, untraceable comms, permanently-active Threat Targeting, the ally's +1d4 against a
marked target, half falling damage. All of those already reach the player as clause text on
the Freelancer tab, the print sheet and the PDF.

### Verified

* Subdermal DR by tier: Streetware 1, Brandware 1, Blackware 2. Reflex init by tier: 2, 2, 4,
  with speed still 1, 1, 2. Reinforced Skeleton still +1 Wound (woundsMax 11).
* **Stacking, per the item's own text**: Courier Shell (DR 2) plus Subdermal Armor Brandware
  gives totalDR 3.
* The five Integration rows above, each measured with and without Open Architecture.
* The gate: Open Architecture with Subdermal Armor but WITHOUT Dermal Plating moves nothing,
  DR 1 and SP 2.
* 84 tab, bench and print-sheet visits across all six roster characters, zero console errors,
  and a PDF at 180,187 bytes.

## The resistances channel: five source families, three rules, and what it deliberately leaves out

"take the resistances channel next."

### It was never a cyberware problem

Scoping first turned up mentions across eighteen data files, not the two the previous entry
named. Sorted by shape rather than by file, the grants fall into four kinds, and only one of
them is a lookup:

**A. Standing damage-type grants.** A fixed type, no choice, no condition. Twelve of them,
across five different owners, and the sheet showed none.

**B. Choose-one-on-acquisition.** "When you acquire it, choose one of Fire, Electric, or Cold;
you gain Resistance to that type." Veilskin, Aegis Shroud, Reliquary Shell (which picks TWO),
Resonance Coil, Saint's Knot, Hex Lattice Projector, Martyr's Halo, the Ablative Coating mod,
and the Cyber-Reinforced Vitality talent. These need a STORED PICK per item, which is a state
change of the same kind as the Versatile grip, not a lookup.

**C. Transient.** "When your Ward reduces an attack's damage to 0, you gain Resistance to that
damage type until the start of your next turn." Four Warding Foci.

**D. Condition immunity.** Timber Fortitude to Frightened, Distributed Anatomy to Bleeding,
Axiomatic Mind to Confused, and others. A different axis entirely: a condition is not a damage
type, and it wants its own channel rather than being crammed into this one.

Only **A** is built here. B, C and D are recorded above as the follow-ups they are.

### The arithmetic is the book's

From `EN.combat.damageTypeRules`, three rules, all three now implemented and each measured:

* "Multiple sources of Resistance to the same type do not stack." So the resolver keeps a SET
  of sources per type rather than a count. Three sources of Toxic collapse to one Resistant
  entry naming all three.
* "Resistance and Vulnerability to the same damage type cancel each other; the Target takes
  normal damage." Both are still NAMED on the row, so a player seeing "Normal" can tell it is
  a cancellation rather than an absence.
* "Immunity overrides both."

### Five source families, one uniform schema

`damageResistances(ch, linFeats, worn)` reads `resist` / `vulnerable` / `immune` arrays from
lineage features, Talents, the worn suit's own flags, the worn suit's TRAITS, its installed
armor Mods, and installed chrome by tier. Data flags throughout, never prose matching, so
adding a resistance to an item is one field.

**All five families read all three levels**, even though nothing in the catalog grants a
Vulnerability today. Uniformity is the point: the first item that says "Resistance to Fire,
Vulnerability to Cold" should be a data edit and not a code edit.

The trait path is the one worth calling out. The **Sealed** trait's glossary entry says
"Resistance to Toxic damage", so every Sealed suit grants it and no suit says so individually.
That went into `EN.gearCatalog.armor.traitResist` as the machine-readable half of the glossary,
sitting beside the prose so the two cannot drift apart through a regex.

Flags added: Radiation Callouses (Radiation) and Forge-Blooded (Fire) in LINEAGE_MECH; Street
Scrapper (Slashing), Pain Editor (Psychic) and Cutting Agent (Toxic) in a TALENT_RESIST table
beside the existing TALENT_UNARMED_STEP; Rebreather Liner (Toxic), Thermal Regulation Weave
(Fire) and Resonance Dampener (Resonant) in armor_mods; Toxin Filter in cyberware, Toxic at
every tier and Toxic plus Radiation at Blackware, per its own `black` line.

### Where it shows

The Defense panel's DR breakdown gains a row per type, the print sheet gains a Resistances
section, and the PDF gains a one-line block. All three name the sources, because a Resistance
that arrives from a suit's trait, an implant and a Talent at once is otherwise unattributable.

### Verified

* Each source family in isolation: chrome, Talent, armor trait, armor Mod, lineage.
* Tiering: a Blackware Toxin Filter yields Toxic AND Radiation where Brandware yields Toxic.
* **No stacking**: a Sealed suit plus a Toxin Filter plus Cutting Agent gives one Toxic entry
  reading Resistant and naming all three.
* **Cancellation and Immunity**, exercised by injecting synthetic armor Mods at runtime since
  no shipping item grants either yet: resist plus vulnerable resolves to Normal naming both,
  and adding immune resolves to Immune.
* Live on a character with three families at once: Fire from a mod, Radiation from Blackware
  chrome, Toxic from the suit's Sealed trait AND the implant, collapsed correctly.
* Print sheet section renders; PDF builds at 182,976 bytes.
* 84 tab, bench and print-sheet visits across all six roster characters, zero console errors.

## The Glimmer and Nexus marks, on devices and exports that cannot draw them

"can we imbed the glimmer symbol into the app so that devices without that symbol can
actually see it without getting that missing symbol emoji."

### What the marks actually are, and why nothing has them

Glimmer is **U+1D4A2 MATHEMATICAL SCRIPT CAPITAL G** (a surrogate pair) and Nexus is
**U+25CE BULLSEYE**. The app loads Rajdhani, Barlow Condensed and Share Tech Mono from the
Google Fonts CDN, all Latin display faces, none of which carry either. So the browser falls
through to whatever the device happens to have. Windows and macOS usually carry one; plenty
of Android builds carry neither, and the player gets a tofu box where a price should be.

Embedding a real font is not available here: **there are no font files in the repo**, the
faces come from a CDN, and **fontkit is not vendored** beside pdf-lib, so the PDF can only
use the standard 14 fonts, which are WinAnsi-only.

### The export was quietly worse than the screen

`sanitizeText` in pdfexport.js filters every character outside WinAnsi, so one bad character
cannot fail a whole document. Correct, and destructive here: both marks are outside WinAnsi,
so they were **deleted**. Every price in an exported PDF printed as a bare number with no
currency mark at all, and a reader could not tell Glimmer from Nexus, which are not
interchangeable currencies. Confirmed by building a PDF and reading the fields back.

It transliterates before filtering now: Glimmer to "G", Nexus to "N". A readable letter is
strictly better than deletion, and this is not invented notation, **the print sheet has been
writing a literal "G " at printsheet.js:620 all along**, so the exports now agree instead of
one silently dropping what the other spells out.

The PDF's own Glimmer field carried a bare figure, so a filled-in sheet said 12,345 without
saying of what, beside a Nexus box holding a different currency. It carries the mark now.

### On screen: detected, not assumed

`EN.ui.currencyGlyphsOk()` measures each mark against a private-use codepoint nothing maps,
in the page's own font stack. Equal advance widths means both fell through to the same
`.notdef` box, so the glyph is genuinely absent. Measured once and cached, since it cannot
change while the page is open.

`substituteCurrencyGlyphs()` then runs at the end of every render, and is a **no-op on any
device that has the glyphs**, which is the common case and costs one cached measurement. On
devices that lack them it walks the freshly rendered text and swaps each mark for a letter in
a `.cur-sub` span carrying the currency's name as its title.

It walks TEXT NODES rather than hooking `el()`, because most of these marks never pass
through a builder at all: they are inside catalog prose, "Price: <G>60 (Common, Legal)",
written into the data files. Nothing short of touching rendered text reaches them.

### What is deliberately NOT here

**A drawing of the mark.** The stand-in is a letter. Reconstructing Brandon's glyph by eye is
exactly the wrong move, and the standing instruction on die and icon art is to embed his own
exported SVG verbatim rather than approximate a shape. `substituteCurrencyGlyphs` is written
so that swapping the letter for real artwork is a change to one function, and the `.cur-sub`
class is the one place its styling lives.

### Verified

* On this device, which HAS both glyphs: detection reports true for both, zero substitutions
  made, the raw characters still present. The pass costs one measurement and does nothing.
* With detection forced false, simulating a device with neither: **zero raw marks left
  anywhere on the page**, substitutions in place, a market row reading "Quarterstaff | Legal ·
  Common | G60", and the currency header reading "G" and "O" with the right titles.
* **Idempotent**: a second render does not double-wrap, still the same span count.
* PDF, end to end: a string containing both marks now arrives as "Probe G60 and N2 test"
  where it previously arrived with both characters deleted. The Glimmer field reads
  "G 12,345".
* Thirteen tab and bench visits plus the print sheet: zero console errors. PDF at 167,115
  bytes.

### Open, and it needs Brandon

The letter is a floor, not the finish. **The real fix is his own artwork**: an SVG of the
Glimmer mark (and the Nexus mark, if it has one), which becomes the substitution's output and
renders identically on every device regardless of installed fonts. The PDF is the harder half
even then, since AcroForm text fields cannot hold vector art; embedding a real font there
would mean vendoring fontkit plus a licensed face carrying U+1D4A2.

## Manuscript sync, 2026-08-12: Open Architecture rebuilt, Disengage and Opportunity Attack exist

Brandon delivered an App Sync Handoff covering everything final in the three live Docs as of
2026-08-12. Sections 1 to 7 are implemented. What follows is what changed in the app, what was
deliberately NOT changed, and the two things the sync exposed.

### The headline: additive, not subtract-and-replace

The old model had the Lineage Feature's effect "end as a separate system and be absorbed into
the chrome", which would have required the app to REMOVE a feature's effects and substitute
new ones. That model is gone. The feature keeps working in full, the implant keeps working in
full, and a third NAMED record switches on while both halves are held.

Seven Integrations, each now its own record carrying its own name, activation predicate and
cadence: **Dermal Aegis, Reinforced Physique, Dermal Neuralink, Living Transceiver, Hitscan
Optics, Synaptic Reflex, Springstep**. The engine surfaces each under its own name, sourced
"Open Architecture · <feature> + <chrome>", rather than repeating the feature's name back at a
player who can already see it in the list above.

### Three bonuses built THIS MORNING were superseded and removed

This is the part worth remembering. Earlier the same day, Open Architecture was implemented
with three flat numeric deltas. The sync replaced all three with mechanics that are not
standing modifiers at all:

| built in the morning | replaced by | why it could not stay |
| ----- | ----- | ----- |
| Dermal Plating, flat +1 DR | **Dermal Aegis** | +2 DR against ONE attack, the first physical hit each round, applied at damage step 3. Not standing DR. |
| Tuned Synapses, +2 Initiative | **Synaptic Reflex** | mutates the Reflex Booster's own counter, max 1 to Caliber with a per-turn cap. Not an Initiative bonus. |
| Calibrated Gait, +1 Speed | **Springstep** | a Body Save or Prone on landing. Not a Speed bonus. |

Left in place they would have double-counted against the clause text the sheet now prints.
Verified by measuring every pairing with and without Open Architecture: **no derived number
moves on any of the seven.** The only thing that moves is the Static Point reduction.

### What the SP clause does, measured

Every pairing drops the matching implant by 1 SP, floored at 0, before Total Static is summed.
Measured across all seven at Brandware: 2 to 1 for Dermal Aegis, Reinforced Physique and
Synaptic Reflex; 1 to 0 for Dermal Neuralink, Living Transceiver, Hitscan Optics and
Springstep. A character with Brandware Cyberoptics and Spring Joints plus both features
derives **Chrome Tax 0**, which is the "deliberate consequence, do not patch" the handoff calls
out. It is not patched.

### Renames, and the four traps in them

`Cybereyes` to `Cyberoptics`, `Quarry` to `Priority Target`, `Predictive Targeting` to
`Hitscan`. `Rebound Strike` never existed in the app.

**`cyberoptics` is a persisted KEY**, not just a label. An installed implant is stored as
`ch.cyberware[n].key`, and every reader looks it up by key, so a rename that does not move the
stored key does not merely mislabel the piece: it keeps charging its Static Points while
granting nothing at all. A rename table now sits beside the catalog (`EN.cyberware.renames`)
and migrate() moves both the installed list and the stash, the same shape the Extended Shaft
rename used. Verified: a saved record holding `cybereyes` migrates and Hitscan Optics fires.

Three strings were deliberately left alone, per the handoff: the lowercase `quarry` in
tracking gear, `a proper combat blade` in the Dagger, and **Heavy Payload's** `count as one
Size larger for grappling`, which must NOT follow Synthetic Musculature's widening to Shove,
Trip and Grapple. The app now holds one of each phrasing, which is the intended divergence.

### Disengage and Opportunity Attack

Disengage joins the **Action** examples, not the Swift list. The three features that discount
it to a Swift Action (Watch How I Soar, Rhythmic Shaping, The Getaway) are discounts on a
baseline that now exists, and all three read correctly as printed with no app exception
needed. Slippery is action-agnostic now and classifies as Passive, which is right: the Defense
bonus is a consequence of moving, not an action you take.

The Opportunity Attacks block sits at the end of the Impulse Action entry, which is where the
manuscript puts it (after the Impulse examples, before Free Actions), and renders under the
Codex's ACTION ECONOMY panel with all five rules intact. The cross-referencing features are
already in print and now function: a Talent overrides "Disengage denies the attack", Spring
Joints' leap states it does not provoke, and Watch How I Soar imposes Snag on Opportunity
Attacks against you.

### Verified

* All seven Integrations load under their new names with the right pairings.
* SP drops match the handoff's section 1.5 table exactly, at every tier tested.
* No stray derived numbers on any pairing, with and without Open Architecture.
* The `cybereyes` migration, end to end.
* Deletions absent from the app: `Engineered Baseline`, `remain separate systems`,
  `range doubles to 24 spaces`, `Cyberlegs or Spring Joints`, `Cybereyes`, `Quarry`,
  `Predictive Targeting`.
* Disengage renders in the Action examples; the Opportunity Attacks block renders with all
  five rules; the Impulse bullet is reworded.
* Thirteen tab and bench visits plus the print sheet: zero console errors, PDF at 191,143 bytes.

### NOT implemented, and it is the bigger half

**The Integration mechanics are recorded as data and displayed as text. They are not
ENFORCED.** The handoff's section 6 lists three counter types (per-round flags for Dermal
Aegis and the Hitscan Optics ally buff, a per-turn flag for Reinforced Physique, per-Encounter
counters for Dermal Neuralink and Synaptic Reflex), plus a free Cyberoptic mode that must ride
outside the tier slot budget, plus a damage-step placement for Dermal Aegis. The sheet has no
round or turn tracker, no per-Encounter counter surface for chrome, and no Cyberoptic mode
picker, so none of that can be tracked yet. Each is a feature in its own right.

### A tooling note worth keeping

Two data files were corrupted mid-sync and had to be rewritten: a `\\n` intended as a JS escape
was written as a REAL newline inside a string literal, which is a syntax error, and the whole
app failed to parse. The cause was blamed on the shell and was not the shell: the replacement
regex built the character class `[^"\\]`, in which the backslash escapes the closing bracket
and leaves the class unterminated. **Building JS string literals with `json.dumps` and finding
their bounds with a manual scanner, rather than a regex, is the fix.** The same malformed class
had already failed twice earlier in the session before the cause was identified.

## The currency marks, now real outlines instead of a stand-in letter

Follow-on to the letter fallback. Brandon supplied artwork, and then Latin Modern Math.

### The first SVG did not solve it, and the reason is the bug itself

`Glimmer.svg` contained **zero `<path>` elements**. It was a `<text>` element holding the
literal U+1D4A2 character styled `font-family:'Cambria', serif`. So it was the same character
in a new wrapper, still asking the device for a font: on the Android build that started this
it would have drawn the identical tofu box. What was needed was the glyph converted to
OUTLINES, which is geometry that needs no font at all.

### Latin Modern Math, and why the licence decided it

Checked with fontTools: **U+1D4A2 present** (glyph `u1D4A2`), **U+25CE absent**. Ships under
the **GUST Font License**, an instance of the LPPL, which permits free use, distribution and
modification. That is what made it usable, where outlining Cambria's glyph would have meant
embedding Microsoft font geometry in a public site. The licensing question was put to the
author rather than decided quietly.

Extracted at 1000 units per em, advance 685, ink x 39..644 and y -130..697, giving 834
characters of path data now inlined in `ui.js`. Font coordinates are y-UP with the baseline
at 0 and SVG is y-down, hence `scale(1,-1)` and a viewBox whose top is the ascent negated.

### Nexus needed no font and no artwork

Latin Modern Math has no U+25CE, and it does not need one: a bullseye is a circle inside a
circle, so it is drawn from the character's own definition rather than traced from anyone's
typeface. Two corrections came from the author while it was being fitted:

1. **"I like the ◎, not the new one."** The first attempt used a 10.7% stroke, which read as
   a heavy target reticle beside the printed mark.
2. **"It's a circle in a circle, there is no center dot."** The inner circle had been drawn
   FILLED. A filled centre is a reticle; the bullseye's middle is open. Both circles are
   stroked now.

Sized by measurement rather than by eye: the device font's bullseye is **0.70em of ink sitting
0.69em above the baseline and 0.01em below**. The ring's ink fills 600 of the glyph's 700-unit
viewBox, so the box is 0.70 x 700/600 = .817em and drops .07em below the baseline to land the
ink where the font lands it.

### Behaviour, unchanged in shape

Still gated on detection, so a device whose fonts carry both marks keeps the real characters
and keeps them selectable and copyable. Only devices that would otherwise show a tofu box get
the outlines, and only they lose text selection on the mark, which is the trade that buys them
a readable price. `fill: currentColor` throughout, so both marks follow every theme.

### Verified

* Fallback forced on: **zero raw marks anywhere on the page**, outlines in place, idempotent
  across re-renders.
* Detection true: **zero outlines, raw characters intact.** The pass costs one cached
  measurement and does nothing.
* Nexus ink diameter measured at **0.70em, matching the font exactly**; both circles stroked,
  neither filled.
* Twelve tab and bench visits plus the print sheet: zero console errors, PDF at 166,879 bytes.

### Open

**The letterform is Latin Modern's, not Cambria's.** They are visibly different script Gs, and
Brandon's own SVG was set in Cambria. Latin Modern's is the one that is licensed for this, so
it is what shipped, but if he wants Cambria's exact shape that is his licensing call to make.

**The PDF still transliterates to "G" and "N".** AcroForm text fields cannot hold vector art,
and fontkit is not vendored beside pdf-lib, so a real glyph there would mean vendoring fontkit
plus embedding the font. Latin Modern's licence would now permit exactly that, which makes it
a genuine option rather than a dead end.

## Talent Attribute bumps, 2026-08-21: what was left open

36 of the 63 Talents open with "Increase your <ATTR> score by 1, to a maximum of 20", and
until this pass not one of them reached the sheet, choice or not. `TALENT_ATTR_BUMP` in
`engine.js` now declares the options, `ch.talentAttrPicks` stores the answer where there is
a choice, and `effectiveAttributes` sums `attrBumpSources` so no surface re-derives it.
Four things were deliberately left alone.

### Hardened Survivor needs a SECOND attribute, and cannot have one yet

`talents.js:297` grants a Saving Throw Focus on the chosen Attribute, and forces a
*different* Attribute for that benefit when the chosen one is already a class focus. So the
Talent can need two stored values, and this pass stores one: the Attribute that gets the +1.

Not half-fixed on purpose. **No Talent, background, species or implant can grant a Saving
Throw Focus at all today**: `engine.js` sources `saveProfKeys` only from `cls.saveFocus`.
The focus grant is a separate defect and wants its own field (`talentFocusPicks`, one field
per mechanic, never one polymorphic field), not a second meaning bolted onto this one.

### Four Talents read their own raised Attribute back, and still print as prose

The pick makes these computable for the first time. None of them are wired.

- **Trauma Medic** (`talents.js:469`): healing is `2d6 + Caliber + the modifier this Talent
  raised`. Now resolvable via `eng.talentAttr(ch, "trauma-medic")`.
- **Spatial Delivery** (`455`): the Upgrade's shove DC is `8 + your Wits or Mystique
  modifier, whichever this Talent raised, + Caliber`.
- **Resonance Dabbler** (`246`) and **Undercity Survivor** (`476`): "The primary attribute
  for these checks is the Attribute increased by this Talent." Both also grant a learned
  effect that has no record slot to attach to, so they need more than the attribute.

### `ch.talents` is a dead field with live readers

Born at `store.js` in `newCharacter`, migrated with `TALENT_RENAMES`, read by
`printsheet.js` and `pdfexport.js`, and **written by nothing in the app**. The live answer
to "which Talents does this character have" is `engine.activeTalents`, off the Universal
Upgrade slots. Two answers to one question, which is the invariant this codebase exists to
keep. Reachable through `importCharacter`, so a hand-built or imported record can carry a
`ch.talents` the rest of the app disagrees with. Not this change's to fix: the Talent
attribute work keys every pick off `activeTalents` and never touches `ch.talents`.

### A bump swallowed at 20 says nothing

If a resolved bump lands on an Attribute already at 20 the point is silently lost. The
codebase has already ruled this class of silence unacceptable once: `duplicateTalentSlots`
exists purely so the builder can say "this slot is buying nothing". The same note belongs
here, softer, because the pick is legal and the rest of the Talent still works. Left out to
keep this pass to the defect. Note the wrinkle if it is picked up: when a Universal Upgrade
pick and a Talent bump both aim at an Attribute sitting at 20, which one was wasted is
genuinely undefined, and unattributable state does not get guessed.

### Also fixed in passing, recorded so it is not re-found

`createAndActivate` did not clear `state.example`, and `active()` answers with the example
first. Registering a new #PRINT while an example was open filed the record in the roster and
left the player looking at the example with nothing on screen changed. `setActive` and
`adoptExample` had always cleared it; this was missed when examples landed.

## Lineage features audited, 2026-08-21: the number, and what is left

All 123 lineage features were read against their manuscript text, one auditor per species.
**The headline is that the catalogue is mostly correct.** 77 are correctly prose, because the
condition they depend on is something only the table can judge: whether you are climbing,
whether it is dark, whether the person in front of you is lying. 16 more were already being
delivered by a carrier a keyword sweep cannot see, chiefly `SENSE_GRANTS`, `encumbranceInfo`
and the hazards layer. **Roughly 13 were genuinely broken**, plus 4 of the wired ones
delivering only half their text.

### Fixed in this pass

- **Condition immunity, a channel that did not exist.** `damageResistances`'s own comment had
  been asking for it: condition immunity is a different axis from a damage type. `condImmune`
  on `LINEAGE_MECH`, resolved by `conditionImmunities(ch)`. Five features now carry it: Static
  Premonition and Hare-Trigger Instinct (Surprised), Timber Fortitude (Frightened), Axiomatic
  Mind (Confused), Distributed Anatomy (Bleeding). **Rendered, never enforced**: the condition
  picker annotates the option and an applied condition gets an IMMUNE chip naming the feature.
  A GM can still apply it, because the table outranks the sheet.
- **`SENSE_GRANTS` was three copies and they had drifted.** `combat.js`, `printsheet.js` and
  `pdfexport.js` each carried one. **Echo Sighted was in two of them and not the third**, so a
  character with it printed a Resonance Sense line on the hardcopy and in the PDF and rendered
  nothing at all on the Freelancer tab. One table now, in `engine.js`, read through
  `senseGrants()`. Hare-Trigger Instinct gained the row it should always have had: the Ryn's
  headline sense rendered as a paragraph while both of its siblings on the same species got a
  row with a range.
- **Brutal Frame carried two errors in one row.** The strike was typed "Bludgeoning or
  Slashing" when the manuscript makes the strike 1d6 Bludgeoning and gives the choice to the
  additional 1d4; and that 1d4 sat inside a note string, so it never reached the printed
  damage, while the identically shaped Smelter's Hands and Envenomed Thorns riders always
  did. The note also welded the 1d4 to a Size gate the manuscript puts on the push alone.
- **Heavy Payload's second half.** "Count as one Size larger for grappling" was delivered
  nowhere. Stated as a row on the SIZE breakdown rather than moved into `d.size`, which would
  double-count: Size also feeds `sizeEncumbranceAdj`, and the feature already grants its own
  separate +2 Threshold. Its brief in `briefs.js` also merged the two grants into one and
  understated +2 as a Size step, which is worth only one point either way.

### Not fixed, and why

- **Hazard Seal is already correct.** It reads "immune to Acid and Toxic damage from chemical
  spills or weaponized sludge", which is source-qualified, and the next sentence carves out
  thermal hazards. The environmental half is delivered at `hazards.js` via `immuneCaustic`.
  A blanket `immune: ["Acid","Toxic"]` row would claim more than the manuscript grants.
- **Distributed Anatomy's Toxic half** wants species traits wired as a resistance source
  first. Every Verdine already has Toxic Resistance from the species core trait Ecological
  Filter, Resistance does not stack, and `damageResistances` reads five sources with species
  traits among none of them. The same gap hides the Clanker core trait Machine Physiology.
  One change, two species traits, then the lineage row only changes the source label.
- **Envenomed Thorns' melee half.** "your unarmed strikes AND melee weapons deal an additional
  1d4 Toxic" and only the unarmed half exists. No damage-rider channel exists on a weapon row
  at all. This is the same defect the author already fixed once for Canopy Reach one lineage
  over, and `meleeRider` wants building the way `meleeReach` was.
- **Climb speed** (Prey Stalker's Grip, Highground Hunger) needs an author ruling first: the
  two features say "base walking Speed" and "walking Speed", which may or may not be one
  grant, and "base" may mean pre-encumbrance. Two non-lineage sources would light up with it,
  the Parkour Runner talent upgrade and an armor mod.
- **Emergency Boot.** "You do not fall Unconscious and do not become Dying", and the sheet
  computes `dying` from Wounds and renders death-save pips and STABILIZE at exactly that
  moment, so it asserts the opposite of the feature's own text. Both inputs are on the record,
  including the once-per-Long-Rest budget. Held because whether the sheet should suppress the
  death-save block outright or offer a trigger is a presentation call for the author.
- **Spatial Flicker, Hitscan, Cagebreak Instinct, Survivor's Wrath.** One each: an Impulse
  damage halver that the existing defensive tray could carry, a Priority Target damage rider
  needing a `ch.bonuses` toggle, a knowable conditional Edge, and a below-half-Vitality
  trigger. All real, none urgent.

### The conditional Edge and Snag question, answered

Roughly 43 features grant Edge or Snag on a specific kind of check. **They should stay prose.**
There is no home for a conditional bonus and building one is the wrong trade: `ch.bonuses` is
reserved by design for what the sheet cannot derive, the condition effects vocabulary is
entirely negative and has no Edge channel, and the sheet cannot know whether you are lying to
someone right now. Exactly one, Cagebreak Instinct, keys off conditions the record already
holds, and even that reads better rendered than applied. The real defect in this area is
presentational rather than mechanical: an unwired feature card looks identical to a wired one,
so a player cannot tell which numbers the sheet is already carrying for them.

### Author rulings wanted

1. ~~**Butcher Spurs ships `traits: "Finesse"` and its manuscript text does not mention it.**~~
   **ANSWERED 2026-08-21 against Part 1, and the answer was the opposite of the question.**
   The book reads "Your unarmed strikes deal 1d6 Slashing damage and carry the Finesse
   trait". The engine table was right all along; `species.js` had dropped the clause, so the
   app granted Finesse while its own displayed text denied it. Transcription corrected, and
   the discrepancy prompted the full text audit recorded below.
2. **Climb speed wording**, as above.
3. **Emergency Boot presentation**, as above.
4. **Two source-qualified immunities**, deliberately left out of the new table: Frictionless
   Stasis is immune to Grappled "from sticky traps or biological webbing" and Olfactory
   Insight can never be Surprised "by an organic Target". `ch.conditions` records that a
   condition is on you, never what put it there, so the qualifier is unrepresentable. Left as
   prose rather than promoted to blanket immunity, which would grant more than the book does.

## species.js re-checked against Part 1, 2026-08-21

Prompted by the Butcher Spurs question, all 123 lineage feature texts were compared
mechanically against a fresh export of Part 1. The manuscript was read on disk and searched
in place; it was never pulled into the working context.

**119 matched the manuscript exactly. Six had drifted. Four could not be compared** because
their entry runs over several paragraphs while the comparison reads one line per feature
(Hitscan, Open Architecture, Method Actor, Biometric Spoofing). All four were then checked by
hand, and in every case the app's longer text is the correct one.

The six, all re-transcribed by copying from the source rather than retyping:

- **Butcher Spurs** was missing "and carry the Finesse trait", which decides whether those
  kicks attack off Agility or Body.
- **Brutal Frame** was materially wrong in two ways, and both had been copied INTO the engine
  earlier the same day on the assumption that `species.js` reflected the book. It does not.
  The manuscript makes the strike "1d6 Bludgeoning or Slashing damage, chosen with each
  strike", not Bludgeoning alone, and its Size gate covers BOTH the additional 1d4 and the
  push rather than the push alone. The engine row now matches the book, with the 1d4 carried
  as a rider whose `when` states the Size condition instead of being buried in a note.
- **Canopy Reach** was missing "This bonus can exceed a weapon's normal Reach cap, since the
  vine is extending the attack rather than the weapon itself." The engine already implements
  exactly that and quotes the reasoning in its own comment, so only the displayed text lied.
- **Synthetic Musculature** carried an invented parenthetical, "(a strike with no die gains
  1d4)". True of the engine, absent from the book.
- **Hydraulic Throw** stated its Size restriction twice, once in the wrong place.
- **Pouncing Strike** said "jumping distance" where the book says "jump distance".

**The lesson, recorded because it cost real work.** The Brutal Frame engine row was edited to
match `species.js`, on the reasonable assumption that a transcribed data file reflects the
manuscript. It did not, so a correct table was made wrong. **When a data file and an engine
table disagree about a rule, neither one is authority: the book is.** The comparison script
is at `scratchpad/lin/diff_text.py` and is worth re-running after any manuscript sync.

## talents.js re-checked against Part 1, 2026-08-21

The same check run on the lineage features, applied to all 63 talents. Talents live in Part 1
under `### **Name**` headings, so the comparison reads a whole section, from a heading to the
next heading OF ANY LEVEL. Two structural differences are folded out before comparing, because
neither is drift: the book opens many talents with "Prerequisite: ...", which the app keeps in
its own `requirements` field, and a space before punctuation is typography rather than content.

**52 matched. 11 had drifted. All 11 are re-transcribed, and the file now matches the
manuscript 63 of 63, verified by re-running the comparison against the edited file.**

Two changed meaning rather than wording:

- **Heavy Weapon Specialist** opened "the weight of heavy kinetic and ballistic weaponry",
  where the book says "heavy, two-handed melee weapons". The rewrite contradicted the talent's
  own body, every clause of which is about melee: a Swift Action melee attack on a crit, and a
  minus 5 for plus 10 on a melee attack with a Heavy weapon. The brief was already correct and
  said melee throughout, so the flavour line was the only thing out of step.
- **Staff & Spear Master** said "reach weapons" where the book says "long-shafted weapons".
  Those are different sets, and the engine already knew it: `weaponReach` gates that talent's
  Upgrade on `isLongShafted(item)`, so the engine followed the book while the displayed text
  named a different category.

The rest were prose rewrites of the author's voice: **Trauma Medic** lost its opening line
entirely and had its Action clause and Upgrade reworded, **Street Scrapper** carried the same
invented parenthetical found in Synthetic Musculature ("a strike with no die gains 1d4") where
the book says only "increases by one size", **Combat Splicer** renamed the book's "focus check
(the Wits or Body save)" to "Body or Wits saving throws", **Signal Sniper** compressed "one
Quick Hack, or one Base Resonance usable at a 0 FP Intent", **Blade Weaver** dropped
"retaliatory", **Lockdown Specialist** reworded its Snag clause, and **Hardware Harmonizer**,
**Static Grounding** and **Armor Piercing Specialist** each swapped a word ("utilize" for
"use", "utilizing" for "using", a full stop for the book's comma).

**Nothing mechanical moved.** `splitTalentText` still separates base from Upgrade on the bold
marker, every brief still resolves (they are keyed on name, and no name changed), and
`TALENT_ATTR_BUMP` is keyed on talent key rather than parsed from text, so the attribute
bumps are unaffected. Checked in the running app.

**Typos noticed in the source, for the author rather than the app.** Part 1 has a stray space
before punctuation in at least five talents (Cross-Discipline Tactic "ability ,", Cybernetic
Surge "fatigue .", Breach Charger, Spatial Delivery "spaces ,"), and Armor Piercing
Specialist's Upgrade joins two sentences with a comma splice. The app tidies these silently
and the comparison ignores them.

`scratchpad/lin/diff_talents.py` is the check, and `fix_talents.py` is the transcriber that
builds the replacement from the source section rather than retyping it.

## The four class data files re-checked against Part 1, 2026-08-21

The third and largest pass. All 219 named class and subclass entries compared against a
fresh export of Part 1: 134 matched, 59 differed, and 26 have no heading in the book because
they are app structural conveniences (Cheap Shot at 2d6 through 5d6 where the book has one
entry with a scaling table, the Subclass Feature and Subclass Capstone placeholder rows, and
a nested drone profile). **Drift ran at 27 percent here, against 17 percent for talents and
5 percent for lineage features.**

Seven auditors adjudicated, one per class, sorting each difference into prose drift, a
change of meaning, a restructure the app is entitled to, content the app has that the book
does not, or a clause the app dropped. **53 were corrected. Six restructures were left
alone.** The file now matches 183 of 219, and the ten still differing are the entries the app
composes at runtime from structured arrays, where it writes action types in full ("Swift
Action" for the book's "(Swift)") per the author's own stated preference.

### The one that mattered

**The Cipher Save DC was wrong in three places, and the app disagreed with itself.** The
class text read "8 + your Tech Modifier + your Caliber" in Brownout, Memetic Virus and
Reality Overwrite, while `engine.js` computes `cipherSaveDC = 8 + techMod + sysProf` and
`app/data/grid.js` states "8 + Tech mod + Systems Proficiency Bonus". Caliber runs 1 to 5 and
the Systems Proficiency Bonus is +2/+4/+6 by tier, so **the printed DC was wrong at every
level** and a player reading the class page computed a different number than the sheet showed.
This is the old M2 ruling: the book was corrected, the engine had always been right, and the
class text was never updated.

### Rules that were missing outright

- **The Apex Smartdeck discount.** The book prices Complexity 4-5 Ciphers at "2 Bandwidth, or
  1 on an Apex Smartdeck, whose Quantum Core runs the top of the library for less". The app
  stored only "cost 2 Bandwidth", so a Tier 5 deck's entire reason to exist was absent.
- **Fatigue (all levels)** was missing from the condition list the Stitcher's Not on My Watch
  clears, between Drowsy and Hallucinating.
- Three of the author's clauses were dropped from the Fury's Unstoppable Momentum, including
  "Mass this size does not travel for free:" and "Stopping is the only part that costs nothing."

### The Triage Rig question, answered by the book itself

The app said "Trauma Rig" where one Stitcher passage said "triage rig", which looked like a
naming inconsistency worth asking about. The book settles it and the app had deleted the
answer: **"Once it is yours, nobody calls it a Trauma Rig. It is a Triage Rig, and the
difference is entirely in whose hands it is."** The gear catalog name stays Trauma Rig, which
is what anyone can buy. The Stitcher's own name for it was a deliberate line, and the app had
replaced the whole paragraph with a description of the hardware. Restored.

### Also found

The invented parenthetical "(a strike with no die gains 1d4)" turned up a **third** time, in
the Stitcher's Hot-Wired Implants, having already been found in Synthetic Musculature and
Street Scrapper. The "utilize" for "use" substitution and the wholesale rewriting of opening
flavour lines both recurred as well. The Juggernaut subclass description had been rewritten
end to end while the Reaver and Arsenal descriptions beside it matched the book exactly.

### Questions for the author

1. **"Burst" or "Burst Fire"?** Part 1's Suppressive Counter says "the Burst or Full-Auto
   firing mode", while Part 2 lists the modes as Single Shot, Semi-Automatic, Burst Fire and
   Full-Auto, and `gear_traits.js` defines "Burst Fire". The app's spelling was kept.
2. **Where are Overdrive maneuver costs priced?** The app stores a cost of 1 on all eight
   Fury maneuvers, and Part 1's Overdrive section never states a per-maneuver cost.
3. **"Off-Hand" or "Off hand"?** Colossal Grip and Walking Emplacement were the only two
   places in the entire app spelling it "Off hand"; the gear catalog uses "Off-Hand". Treated
   as a typo and corrected.
4. **The Universal Upgrade preamble.** The app opened it "At levels 2, 4, 6, and 8, ..." where
   the book carries the levels in its heading and the app already prints "Level 2 . Universal
   Upgrade" as the slot title, so it said the level twice. The preamble was dropped to match
   the book. Say the word if you want it back.

## backgrounds.js re-checked against Part 1, 2026-08-21

The fourth pass, and the cleanest by a wide margin. **179 of 180 entries matched. One word
had drifted.** The Outrider's blurb read "contracts, and borders are things you navigate, not
things you obey" where the book says "things you **bend**". Corrected; the file now matches
180 of 180.

Backgrounds have a rigidly regular shape in the book, so this check parses each section into
its parts rather than matching whole sections by name: the blurb, the two proficiency choice
lines, the named Background Feature and its text, Contacts, three Backstory Hooks each
compared individually, and the Personal Item. That is 180 separately verified fields across
20 backgrounds, and it reports which field drifted rather than just which background.

**Why this file held up when the class files did not** is worth noting for whoever reads this
next. Background entries are short, self-contained, and almost entirely flavour: there is
very little mechanical text to be tempted into "clarifying". The class files carry formulas,
DCs and resource rules, and every one of the rewrites found there was someone improving an
explanation. The drift rate tracks how much a file invites editing, not how big it is.

Running totals across the four passes:

| file | entries | drifted | rate |
|---|---|---|---|
| backgrounds.js | 180 | 1 | 0.6% |
| species.js | 123 | 6 | 5% |
| talents.js | 63 | 11 | 17% |
| the four class files | 219 | 59 | 27% |

`scratchpad/lin/diff_backgrounds.py` is the check.

## grid.js and flow.js checked against Part 2, 2026-08-21

**These two resist the method, and the honest headline is that only part of them could be
checked.** The four files done before this are prose: named entries with a name and a
paragraph. `grid.js` and `flow.js` are mostly TABLES and structured data. Of 94 named text
entries, only about a fifth live under a heading in the book; the rest are table rows
("| **Kinetic** | Kinetic Barrier | Yes |") or inline bold runs ("**Alert.** The IC silently
logs the breach attempt"). A heading-based comparison reports those as differences when they
are really extraction failures, so its raw output is not a finding list.

### What WAS verified, and what it found

**The formulas, all correct**, and cross-checked against the engine rather than only against
the book. This mattered because the class files had a formula that disagreed with the app's
own calculator: `cipherAttackFormula` and `cipherSaveFormula` both read "Tech mod + Systems
Proficiency Bonus" and match `engine.js`; `flow.saveDcFormula` and `flowAttackFormula` read
"Flow Modifier + Caliber" and match the book's own table; `reservoirFormula` reads
"(Caliber x 3) + Flow Modifier" and the engine computes exactly that.

**The ciphers, which are the one clean subset.** They have proper headings, a bold metadata
line the app stores as separate structured fields, and a body. 36 ciphers and 6 buddy
ciphers: 17 already exact, **22 re-transcribed**, 3 buddy ciphers not located as sections and
left unverified (Node Sweeper, Access Spike, Data Probe).

**The drift was the same pattern found everywhere else: the author's opening line stripped.**
Puppet String had lost "The whole hand on the strings, not one finger on a trigger."
Backtrace had lost "Someone is working against you in the wire. Work back harder." Live Tap
had lost "Where Hijack Stream grabs a feed and runs, Live Tap settles in to listen." Deep Sync
had lost ", runtime braced against the feedback you know is coming", and Dead Zone the
parenthetical "(an enemy hacker's, a rigged drone's, a smartgun's targeting feed)".

### The tables, CHECKED, and they are clean

Done with the table-aware comparison built for the gear catalogs, pointed at Part 2's 185
pipe tables. **120 values compared across ten tables, zero defects, zero unmatched rows.**

Covered: Smartdeck tiers (price, Device Bonus, Mod Slots, Integrity), B&E Buddy tiers (price,
Attack Bonus, Save DC, Integrity), Relay tiers, node tiers (Security Rating, Cipher Save
Bonus, Integrity), Firewall tiers (price, Security Bonus, Damage Threshold), IC tiers and
their Counterattack damage, cipher damage by Complexity, cipher costs (Craft DC, Material,
Recovery), the nine Hardware Mods (cost, slots, type), Scan DCs, and the Flow delivery bands'
FP costs.

The single reported difference is not one: the Standard Smartdeck's Mod Slots read 0 in the
app and "N/A" in the book, which is the same fact about a Tier 0 deck written two ways.

**The mapping from app field to book column is written out by hand in `diff_gf_tables.py`
rather than guessed from header similarity.** A fuzzy match that silently picked the wrong
column would report false agreement, which is worse than reporting nothing.

Also confirmed while here: the **M1 ruling is applied on both sides**. The book's Max
Complexity column now reads 1, 2, 3, 4, 5, 5, which is Tier + 1 capped at 5 by the cipher
library, and the engine computes exactly that. That ruling was raised when the book's table
still read 0 through 5, and the pair now agree.


### A defect the Flow check found in an example character, not in the data

Verifying `flow.reservoirFormula` against the engine meant deriving a real Shaper, and that
exposed **Marisol "Fold" Quiroga being built wrong**, which was my error when the examples
were created rather than any drift in the rules.

She was a **Sourcerer**, and Part 1 states "The Sourcerer (Flow Attribute: Tech)". Her Tech
was 11 (+0) while her Mystique was 16 (+3), so her entire class mechanic ran on her weakest
relevant stat: Flow Attack bonus +0, Flow Save DC 11, Reservoir 9.

Changed to **Harmonist**, which Part 1 gives as Flow Attribute: Mystique. Nothing about her
attributes moved. Flow Attack bonus is now +3, Save DC 14, Reservoir 12, and she gains
Earthcaller and Burden of the Earth in place of The Machine Medium and Hardware Harmonization.

It also fits her far better. Her concept is six years of shift work keeping an arcology's air
breathable, which is atmospheric, while the Sourcerer's own description opens "You couldn't
write a line of code to save your life. Routers hate you." The Harmonist is "an urban shaman
awakening the sleeping earth beneath the asphalt". Her blurb changed with her.

**Worth checking the other six the same way.** The examples were built to be a wide test
surface, and a subclass whose Flow or resource attribute does not match the character's stat
line is invisible on the sheet: nothing warns, the numbers are simply small.

### The other six examples checked for the same mismatch: all clean

Every one of the other six has their class resource attribute as their **highest** attribute,
at +3, with a full pool of 6:

| character | class | resource | keys off | rank in their stat line |
|---|---|---|---|---|
| Wren Osei | Codebreaker | Bandwidth | Tech 16 | 1st |
| Bekh Tarrow | Fury | Overdrive | Body 16 | 1st |
| Odile Vantz | Hustler | Leverage | Charm 16 | 1st |
| Sable Ferro | Operator | Execution | Wits 16 | 1st |
| Pip Ghal | Scoundrel | Moxie | Agility 16 | 1st |
| Halden Brack | Stitcher | Triage | Tech 16 | 1st |

**The Shaper was structurally the only one that could go wrong.** Every other class declares
one fixed resource attribute, so choosing a subclass that fights your stat line is not
possible for them. The Shaper is the only class whose attribute varies BY SUBCLASS
(Harmonist Mystique, Kensei Body, Sourcerer Tech, Icon Charm), which is exactly where the
mismatch appeared. Worth remembering when any future class gains a by-subclass attribute.

### What the check DID find: First Do No Harm is invisible on the weapon row

Halden's Pocket Pistol renders **HIT +3, DMG 1d6 +1**, which is Agility +1 plus his
proficiency bonus. His Level 1 class feature reads: "Whenever you make an attack roll with a
weapon that has the Light trait against an organic target, you may use your Tech modifier
instead of Agility or Body for the attack and damage rolls." His pistol IS Light and his Tech
is +3, so against an organic target he attacks at **+5 for 1d6 +3**.

**The engine is right not to apply it automatically.** It is a "you may", and it is
conditional on the target being organic, which the sheet cannot know. That is the same ruling
already made for the 43 conditional lineage features: render, do not apply.

**The presentation is what fails.** The weapon row gives no hint the option exists. The
feature is on the Features sub-tab and the weapon is on the Weapons sub-tab, and nothing
connects them, so a player reads Halden as a +3 attacker when against most targets he is a
+5. The swing is +2 to hit and +2 to damage on a Level 1 class-defining feature.

This is the presentational defect already named in the lineage audit: an unwired option looks
identical to an absent one.

**BUILT, and as a toggle rather than a note.** The weapon row now carries a gold chip reading
"TECH +5 / +3 . FIRST DO NO HARM". Off by default, because assuming a conditional benefit is
the worse error, and the chip still shows what you would get so the option is never invisible.
Switching it on changes the attack modifier, the damage modifier and the roll tray together,
because `weaponHit` resolves all three from the same answer.

The pick is stored per weapon as `ch.attackAttr = {weaponEntryKey: featureName}` and
**validated on read rather than pruned on write**: an entry naming a feature since retrained
away, or a weapon no longer owned, resolves to nothing and the row returns to its default.
That leaves one writer, the toggle, and no cleanup path to forget.

The search found two such features. The Kensei's **Resonant Edge** offers Body instead of
Agility on a Finesse or Light melee weapon and can never fire, because `combat.js` already
resolves melee to Body unless the weapon is Finesse and Agility is higher. Its row stays in
`ATTACK_ATTR_OFFERS` with a comment saying so, since deleting it only makes the next reader
ask why the feature is unhandled.

## The gear catalogs checked against Part 3, 2026-08-21

Part 3 lists every item TWICE: a pipe table row carrying the numbers, and a "#### **Name**"
section carrying the prose. That finally made the numbers checkable, which is the check named
as missing after the grid and flow pass. **A wrong price or damage die is a wrong rule; a
reworded description is only embarrassing.** So the numbers went first.

### The numbers: 568 values across 266 items, and the catalog is sound

Price, damage, range, ammunition, Damage Reduction and traits compared cell by cell.
**Two genuine defects, both fixed. Everything else matched.**

- **Flashbang** was typed "1d4 Sonic **and Light**" where the book says "1d4 Sonic", in both
  the table row and the detail section. This is not cosmetic: damage TYPES interact with
  Resistance and Immunity, so a target resistant to Light would have wrongly halved part of a
  Flashbang. The flavour line does say the grenade "turns light and sound into weapons", and
  the Blinded effect lives in its On Hit clause, which is presumably where the extra type
  crept in from.
- **Knuckles** carried "1d4 Bludgeoning" where the book's damage column reads "Augments
  unarmed strikes". The book's effect is "increase your unarmed strike damage die by one
  step. If your unarmed strikes do not have a damage die, they deal 1d4 Bludgeoning damage",
  so the app was printing the FALLBACK as though it were the weapon's own die. The engine
  already knew better: `isUnarmedAugmentName` excludes it from the weapon rows and
  `GEAR_UNARMED_STEP` carries the real mechanic, and the comment there calls the damage
  string "a legacy of the old replace-the-die model". Verified after the change that Knuckles
  still reads as an augment and still steps the unarmed die.

Two more differences were examined and are correct as they stand: **Martyr's Halo** and
**Reliquary Shell** show price 0 against the book's "◎2+ (rarely sold)", because the app
stores `nexus: "◎2+"` with `vendor: false` in their own fields. The Nexus figure is not lost.

**61 catalog items had no Part 3 table row**, and that is expected: they are Smartdecks, B&E
Buddies, Trauma Rigs and the Cipher Library, which live in Part 2 and were checked there.

### The prose: 246 differences, not yet transcribed

Every item's description and effect compared against its detail section. 178 matched.
**246 differ, and the pattern is the one found in every earlier pass: the author's phrasing
trimmed.** Slab Blade is representative. The book reads "**Slow** holds you to one attack
each round; unless you're built for it, though, with cyberware that raises your Body and a
Body of 18 or higher, the weight stops mattering: you ignore Slow on this weapon". The app
has "Slow holds you to one attack each round; with cyberware that raises your Body and a Body
of 18 or higher, you ignore Slow on this weapon". Two clauses gone, meaning unchanged.

**TRANSCRIBED. 197 values re-transcribed from Part 3 across three passes**, and the file now
matches the book on every description and every effect clause it shares with it.

The tail needed two extra shapes the first pass did not handle. Sixteen entries could not be
matched uniquely because their text repeats across items: "Grants 1 DR." is the effect string
of every one-DR suit, so a whole-file replace would have hit the wrong armour. Those were done
with a scoped replace that finds each item's own object and edits only inside it. Separately,
the book qualifies some labels, writing "**On Hit (Organic):**" and "**On Hit (Machinery):**"
as two bullets of one clause, which the app stores as a single string; the label is now kept
in front of each half so the sheet says which case is which.

**What remains is not drift. 63 values have no counterpart in the book at all**, and every one
is a kit's `effect`: a one-line summary the app composes for the stash row, like "Treats
Wounds and Fatigue at full effect." The book has no such line, carrying instead the Basic Use
and Proficient Use bullets, which the app stores in its own `basic` and `proficient` fields
and which now match word for word. **Genuine clause differences remaining: zero.**

The scripts are `diff_gear.py` for the tables, `diff_gear_prose.py` for the sections,
`fix_gear_prose.py` for the transcription and `fix_gear_scoped.py` for the non-unique tail.

## conditions.js checked against Part 2, 2026-08-21

First of the five files that the earlier "every data file is verified" claim wrongly covered.
42 conditions compared against their Part 2 sections. **31 match. Four defects found and
fixed. Eleven still differ, and all eleven have the app carrying MORE than the book, which is
the opposite of the drift found everywhere else and wants eyes rather than a script.**

### The one that matters: Breakflow was materially wrong, and generous

The app said Breakflow ends "after Breakflow Recovery: 1 full day in a Flow rich environment
or equivalent ritual", and that "once recovered, you regain FP normally and all Strain is
cleared". The book says it ends "only through **Breakflow Restoration** (or **Rough
Restoration**)", which "takes an 8-hour long rest in a Flow-rich area (Anomaly Severity 0) and
a **Flow Dice Pool check against 5 Snag Dice**. On a positive Margin, your Reservoir returns
to half capacity and Strain drops to Stage 2 (Wave). On a failure, you remain in Breakflow and
take **2d6 Vitality loss**."

Four things were wrong at once: the duration, the absence of any check, the recovery amount
(full versus half Reservoir, all Strain cleared versus dropped to Stage 2), and the missing
failure case. **Every one of them in the player's favour.** The app also called the mechanic
"Breakflow Recovery" while `flow.js` and `class_scoundrel_shaper.js` both call it "Breakflow
Restoration", so the app disagreed with itself on the name as well.

### The other three

- **Hardwired** said "utilizing" where the book says "tuned to". The fancy-word substitution
  found in the talents and class passes, and here it also shifts the sense.
- **Cascade Failure** and **Drowning** spelled it "stabilise" and "stabilised" where the book
  uses "stabilize" and "stabilized" throughout.

### The eleven that remain, and why they were NOT transcribed

Bloodied, Confused, Critical Wound, Cursed, Drowsy, Fatigue, Hallucinating, LinkDeath,
Mutating, Strain, Vacuum. In every case the app's text is longer than the section, and the
extra material is real content: the d10 Critical Wound table, the d12 Curse Effects table, the
Confusion Table, the note that Bloodied applies to Clankers with sparking joints. Spot checks
confirmed those passages DO exist in Part 2, stated somewhere other than the condition's own
section. **Transcribing the section over the app's text would delete them**, which is the
wrong default when the app has more rather than less.

They also differ in framing rather than content: the app writes a table as prose with its own
lead-in ("Confusion Table (d8): 1 to 2: do nothing this turn"), where the book has a pipe
table with a header row. That is a presentation choice, not drift.

**Two extractor traps worth remembering**, both of which produced false findings before being
fixed: Part 2 uses some names twice, so "Cascade Failure" is both a condition and a #GRID rule
about Links tearing loose, and keeping the longer section reported a word-perfect condition as
rewritten. And several conditions write "### How it works" as a heading at the SAME level as
the condition name, so stopping at the next heading truncated the entry to its first sentence
and made the app look like it had invented the rest. The script now keeps every candidate
section and treats a known sub-heading label as part of the entry above it.

`scratchpad/lin/diff_conditions.py` is the check.

## weapon_parts.js and armor_mods.js checked against Part 3, 2026-08-22

Read from disk this time, not dumped through the browser. These records are regular enough to
parse straight out of the JS source, so nothing left the repo and no save prompt appeared.
`scratchpad/lin/diff_parts_mods.py` does the numbers, `prose_parts_mods.py` the prose.

**63 parts, 25 mods. 239 table values and 297 prose values compared. 69 changes made.**

### The numbers were already right

One value differed and one looked like it did:

- **Grounding Lattice `price: 0`** is correct, not a defect. The app carries its Nexus price in
  its own `nexus: "◎1"` field with `vendor: false`, the same pattern already confirmed on
  Martyr's Halo and Reliquary Shell during the gear pass.
- **Servo Weave `fits`** read `"Bulky non-Powered"` where the book's table has
  `"Bulky, non-Powered"`. Fixed, but **not** as a one-line data edit: see below.

### `fits` is a switch key, not prose, and that nearly caused a real defect

`inventory.js:1516` switches on the exact string (`case "Bulky, non-Powered":`), and
`store.js:909` compares another value against the literal `"Long-Shafted"`. Changing the data
alone would have dropped Servo Weave through to `default: return true` and let it mount on any
armor at all. All three sites moved together: the two in `armor_mods.js` and the case label.

Verified live rather than by reading: with Bekh on the bench, Servo Weave is offered on
**Bastion Plate** (Plated, Bulky, Modular, not Powered) and refused on **Laborframe Exorig**
(the same suit plus Powered), which is exactly the gate. A stale case label would have offered
it on both. Fitting it shows `1 / 3 mod slots` and the tooltip carries the new text.

This is also why **13 further `fits` differences were deliberately NOT transcribed.** Part 3
prints that field twice, once in the table and again as a bullet, and the two disagree by
design: the table says `Blades`, the bullet says `Bladed weapons only`. The app follows the
table, which is the machine-readable one, and the table comparison passes clean.

### The prose: 68 effects re-transcribed

The same finding as every earlier pass. The engine was never what drifted; the prose beside it
had been editorially abridged. Two of these were losing real mechanics:

- **Reactive Countermeasures** had no save DC at all. The book sets the Dazzle save at
  **DC 13**. A missing DC is a missing rule at the table.
- **Weapon Light** carried "As a Free Action". The book labels it `Effect (Special)` and names
  no action cost, so the Free Action was the app's own addition.

Three entries now carry MORE than the book's bare `Effect` bullet, correctly: **Targeting
Suite** (Combat, Painting, HUD), **Target Spotter** (Spotlight, Rangefinding, Read the target)
and **Under-Barrel Mount** (its two sub-devices). Their rules live in further bullets that the
app already folded into the one string, and transcribing only the `Effect` bullet would have
deleted them. Five more entries have no bare `Effect` bullet at all, only a qualified one such
as `Effect (Swift Action)`; those fold the qualifier in front of the prose, matching how
Bracing Spike and Reactive Countermeasures were already written.

`grants` and `blurb` were left alone. `grants` is the trait name that `combat.js:3094` renders
as `grants + ". " + effect`, and all eight `blurb` values already matched the flavour paragraph
word for word. Twenty-one weapon parts now open with "Apply the X trait", which duplicates
`grants`, but weapon parts never render the two together: the chip shows `grants` and the
tooltip is `name + ": " + effect`. Armor mods do concatenate them, and no armor mod's effect
opens that way, so no render site became redundant.

### Verified

All seven tabs render, 43 modules load, 63 parts and 25 mods parse, the dash sweep is clean,
and the console is free of app errors on a fresh load.

## cyberware.js checked against Part 3, 2026-08-22

Read from disk. 20 items, 53 tier rows. **272 values compared across nine fields. Six prose
defects fixed, one author question raised, and everything else confirmed correct by design.**

`scratchpad/lin/diff_cyber.py` is the check. The prose half was judged by a fan-out of
independent agents with a two-lens adversarial pass over every claimed defect (does the app
really lack the rule, and would a table actually play it differently). Twelve claims went in,
five came out unanimous; a sixth was a split decision I promoted myself, on the reasoning
below.

### The numbers are perfect

**53 SP values and 53 price values, zero differences.** Every threshold in the Chrome Tax
matches, and the three quality-tier descriptions match.

### Three groups of apparent differences that are correct by design

- **Enhancement (9) and Zone (2).** Part 3 prints these twice: once in each entry's bullet
  ("Enhancement: +1 Wits (at Brandware or higher)") and once in the **Cyberware Quick
  Reference** table ("+1 Wits"). The app follows the table, which is the machine-readable
  form, exactly as it does with weapon-part `fits`. The tier qualifier is not lost: it is a
  restatement of the global rule at Part 3's "Enhancement Bonuses" section, and `engine.js`
  implements that rule directly (Streetware 0, Brandware base, Blackware doubled, "arm only"
  excluded from the general attribute, highest-wins on a repeated attribute). The book's cap,
  that an Enhancement cannot raise an attribute above its maximum, is enforced at
  `engine.js:2984`.
- **Convergence Engine legality.** App "Restricted", book "Restricted (effectively
  unavailable)". The app stores the machine value and the parenthetical is commentary.

### The one author question: a rarity word in the Legality column

Eight cyberware tier rows read **Common** in Part 3's **Legality** column, and the app writes
**Legal** for all eight. The correspondence is exact and systematic:

  Streetware and Brandware Datajack, Streetware Cyberoptics, Streetware and Brandware Toxin
  Filter, Streetware and Brandware Spring Joints, Brandware Subdermal Comm.

The book's cyberware tables never use the word "Legal" anywhere. "Common" belongs to the
rarity scale (Common / Uncommon / Rare), not the legality scale (Legal / Licensed / Restricted
/ Contraband), and the app keeps the two apart: `legality` comes from the data while
`availability` is derived from the tier (`TIER_AVAIL`). Writing "Common" into the legality
field would fall out of `LEGAL_MULT` at `inventory.js:84`, so the compliance surcharge would
silently drop to the 1x fallback. **Left as "Legal". This wants a ruling, not a code change.**

### The six prose fixes

Every one of the 69 prose values differs from the book, because this file is written in a
deliberately compressed house style. That is not drift, and it was not treated as drift: the
question asked of each value was only whether the abridgement drops a rule. Six did.

- **Synthetic Heart (black).** Stillness Mode had an upside and no cost whatsoever. Restored:
  while in it you take no Actions, Move Actions or Swift Actions and cannot use other
  cyberware, you stay aware of your surroundings, and exiting is a Free Action on your turn.
- **Disruption Lattice (black).** Targeted suppression had neither an action cost nor a
  duration. Restored: it costs an Action, and the +2 FP and Snag last until the start of your
  next turn.
- **Hand Razors (desc)** and **Spring Joints (desc).** The Cyberarm and Cyberleg Compatibility
  rules each have two halves, and only the SP-exemption half was carried. Restored: a
  platform-slotted pair takes no Stealth Snag even at Streetware.
- **Resonance Crown (effect).** Nothing said when the harmonized pieces are chosen. Restored:
  chosen at install, and changing the selection takes 1 hour of Downtime meditation with a
  qualified artificer.
- **Cyberarm (black).** The app said "cannot be disarmed" where the book says "cannot be
  disarmed **by mundane means**". This was the split decision. One reviewer refuted it on the
  grounds that every number was present; the other confirmed it because a non-mundane disarm
  exists as an at-will rule, the Electromagnetic base effect **Magnetize** in Part 2, which
  tears metal free of a wielder. Dropping the qualifier makes the arm immune to it. Promoted
  and fixed.

The fixes are written in the file's own compressed voice rather than pasted from the book,
because the compression here is the author's choice and mass transcription would fight it.

### A limitation worth knowing: chrome prose is snapshotted at purchase

`inventory.js:433` copies `desc` and `effect` onto the character's own cyberware record when
the piece is bought, and `migrate()` only converts legacy string entries, so it never refreshes
them. **Catalog edits to `desc` and `effect` therefore do not reach a character who already
owns that piece.** Three of the six fixes above are in those two fields.

Nothing shipped is affected: the seven pre-made examples carry no cyberware at all, and the
builder's own path (`builder.js:2011`) writes records with no `desc` or `effect`. Only a real
player's save that bought that specific chrome before today keeps the old wording. The other
three fixes are in `street` and `black`, which are read from the catalog at render time and so
reach everyone immediately. A refresh pass in `migrate()` keyed on `cw.key` and skipping
`custom: true` records would close it; not done here because it changes the save-migration
layer and that is its own decision.

### Two extractor traps in my own script, both caught and fixed

Recorded because both produced silent under-coverage, which reads as a clean result:

- Tier rows can hold a **nested object** (`bonus: { speed: 1, init: 2 }`), and an
  innermost-brace regex matches that instead of the row. Five items lost their entire numbers
  check before this surfaced: Reflex Booster, Toxin Filter, Subdermal Armor, Reinforced
  Skeleton and Cyberlegs. Fixed by walking bracket depth. 38 rows became 53.
- Four entries have **no bare "Effect" bullet**, only a qualified one: "Effect (Special)",
  "Effect (Swift)", and the Convergence Engine's pair of "Effect (Attuned Wearers)" and
  "Effect (Unattuned Wearers)". Looking only for the bare label skipped Synthetic Heart,
  Biomonitor, Hand Razors and Convergence Engine. This is the same trap the weapon-parts pass
  hit, and it should be the first thing checked in any future entry-and-bullet comparison.

### Verified

All seven tabs render. 43 modules load, 20 items and 53 tier rows parse. Both fixes to `black`
were read back off the live gray-market listing, the Chrome tab renders installed pieces with
their effect and description, the dash sweep is clean, and the console carries no app errors.

## The three cyberware rulings, implemented 2026-08-22

All three items from the author handoff are done. Nothing here re-opens a decision.

### 1. Legality: Common is Legal. No app change, one assertion.

The app's "Legal" was already correct on all eight rows and was left alone. No fifth ladder
value, no alias.

**The Doc edit has landed and is verified.** A fresh export diffed against the pre-edit copy
shows **exactly eight changed lines**, all Common to Legal, and they are precisely the eight
rows the handoff named. Nothing else in the file moved. The byte count fell by exactly 8, one
per cell, which is the signature of "Common" becoming "Legal" eight times.

The extractor now **asserts the four-value ladder** on every Legality cell it reads from the
manuscript and exits loudly on anything else, naming the stale-export cause. A trailing
parenthetical is stripped at read time, so the Convergence Engine's "Restricted (effectively
unavailable)" passes without the manuscript having to change. The assertion was confirmed to
FIRE on the pre-edit export before the fresh pull, so it is known to work rather than merely
known to pass.

Census on the current manuscript: **Legal 8, Licensed 17, Restricted 28, 53 cells.** The
handoff predicted Restricted 27 plus the Engine's parenthetical; those are the same 28 once the
parenthetical is normalized. **`tier.legality` now has zero differences against the app.**

One small correction to the handoff: the word "Common" survives **twice** in the Cybernetics
chapter, not once. The named survivor is the Blackware Skinweave prose; the second is a callout
header, "GM Guidance: Use Common Sense First". Neither is a table cell and neither was touched.

### 2. Snapshot: owned cyberware now reads its prose live

**2a. The purchase path no longer copies catalog text.** `inventory.js` writes identity, tier
and player choices only. One resolver was added to `engine.js` beside `installedCyberware`,
following the one-resolver rule: `cyberDef` / `cyberDesc` / `cyberEffect`, resolving `cw.key`
against the catalog. Both render sites now go through it, the Chrome tab and the print sheet,
so the two cannot drift apart.

The record's own copy survives only as a **fallback** for a piece the catalog no longer lists,
so a retired or homebrew implant keeps its text instead of rendering blank. That is the same
rule migrate() follows.

**2b. migrate() drops the fields rather than rewriting them**, which the handoff sanctions
given 2a. Rewriting would only go stale again at the next correction. It runs **after** the
rename pass, which matters: a pre-rename save still holds the retired key, and resolving before
the key moved would miss exactly the pieces most likely to be stale.

**No new alias table was needed.** `EN.cyberware.renames` already exists in the catalog and
`migrate()` already consumes it as `CYBER_RENAMES`, covering Cybereyes to Cyberoptics.
`cw.key` is a stable slug (`datajack`, `synthHeart`, `springJoints`), not a display name, so
the join is sound.

**All five tests pass**, plus two more worth having:

| test | result |
|---|---|
| stale desc and effect on a resolvable key | refreshed, renders catalog text |
| save keyed on the retired `cybereyes` | resolves to `cyberoptics`, renders catalog text |
| key in no catalog | byte-identical |
| `custom`-flagged piece | byte-identical |
| fresh purchase after 2a | writes no desc or effect, still renders |
| migrate run twice | idempotent, byte-identical |
| `cyberStash` side | refreshed and renders live |

The print sheet was driven for real: a record carrying no snapshot renders both the catalog
description and the catalog effect.

### 3. Extractor

**3a is confirmed:** 20 tier tables, **53 rows**, and SP and price still show zero differences
across all 53.

**3b was already fixed** in the previous session's pass, in the same commit that recorded it;
the handoff lists it as owed because the report described it as a trap rather than as shipped.
Re-run and confirmed: tagged labels are matched as first-class, `Effect` with an optional
parenthetical read as one field. All four entries extract and compare, and all four are
faithful compressions.

  Synthetic Heart      Effect (Special)                                    395 chars extracted
  Biomonitor           Effect (Special)                                    257 chars extracted
  Hand Razors          Effect (Swift)                                      255 chars extracted
  Convergence Engine   Effect (Unattuned Wearers) + Effect (Attuned...)   1274 chars, 2 bullets

### The Cybereyes rename was incomplete, and is now finished

Found while testing the migration, then confirmed by the author: the rename is real, so no save
should still read "Cybereyes" anywhere.

The rename pass matched display names by **exact string**, but the stored display name EMBEDS
the short name rather than equalling it. The market builds it as `tier + " " + short`, so a
real saved record reads `"Brandware Cybereyes"` and only a bare `"Cybereyes"` ever matched.
`key` and `base` migrated correctly, so the piece worked; it simply kept the retired label on
the Chrome card forever.

Now matched on **word boundaries**, so the embedded name is rewritten while a name that merely
contains the word inside a longer one is left alone. Pairs are sorted longest old name first,
so a rename whose old name is a prefix of another cannot win the race and leave a half-renamed
label. Four cases verified against the real `migrate()`:

| case | result |
|---|---|
| `"Brandware Cybereyes"` | becomes `"Brandware Cyberoptics"`, key and base follow |
| bare `"Cybereyes"` | becomes `"Cyberoptics"` |
| `"Blackware CybereyesPlus"` | untouched, no partial-word damage |
| already `"Brandware Cyberoptics"` | untouched, idempotent |

Driven end to end as well: a legacy save renders on the Chrome card as **Brandware
Cyberoptics** with live catalog prose, with no trace of the old name or the old text.

**The weapon-part rename does NOT share this bug and was left alone.** `PART_NAME_RENAMES`
applies to equipment entry names, and a Weapon Part has no tier, so its stored name is the bare
part name and exact match is correct there. Cyberware is the only catalog whose display name
carries a tier prefix.

## rules.js checked against Parts 1, 2 and 3, 2026-08-22

**70 claims, 70 pass, zero value differences.** One doc comment corrected; no number moved.

`rules.js` is not a catalog, it is the numeric backbone the whole engine reads: point buy,
Caliber, proficiency bonuses, XP, class Vitality, Encumbrance, Sizes and the derived formulas.
A wrong value here is wrong on every character at once, so `scratchpad/lin/diff_rules.py` is
written as explicit CLAIMS with explicit evidence rather than as fuzzy table matching. Each
claim names the value the app holds and a pattern that must appear in the manuscript, and a
claim that cannot find its evidence reports **NOT FOUND**, never a pass. That distinction is
the whole design: a silent miss reads exactly like agreement.

Verified clean, among the 70: point buy (base 10, pool 27, the 1/2/3 cost bands, cumulative
costs 1/2/3/5/7/10, cap 16, the single-flaw refund of 2), the Standard Array, the hard cap of
20, the +15 static modifier cap, Caliber as ceil(level/2) across all five bands, all nine XP
thresholds, proficiency at 2/4/6, all fourteen skills, all seven classes' Vitality dice, the
Encumbrance threshold and its Size step, the three Loadout deltas, the Encumbered and
Overloaded effects, and eight derived formulas.

Re-confirmed live in the browser as well, since a literal being right in the file and the
function being right are two different things: `modifier()` at the boundaries (10 to +0, 8 to
-1, 16 to +3, 20 to +5, 1 to -5), `dieAverage()` for d6/d8/d10/d12, and the Encumbrance
threshold derived end to end (base 9 = 6 + 3 Body + 0 Medium, plus a Load-Bearing step to 11,
bands at 8/11/14, matching the book's Threshold minus 3 and plus 3).

### The one change: a comment that under-described a live rule

The book sets the threshold at "6 + Body Modifier **plus or minus 1 for Size**, minimum 3",
and names the step: Small subtracts 1, Large adds 1. `engine.js:2056` already applies it
correctly and `rules.js` already carries the right data (`sizeTraits` Small -1, Medium 0,
Large +1). Only the comment above `encumbrance:` omitted the Size clause, so the canonical
reference file read as though the rule were simply 6 + Body modifier. Corrected, with a
pointer to the line that implements it.

### Two traps in the check itself, both mine

- **Encumbrance and Load live in Part 3, not Part 2.** The chapter sits after Cybernetics,
  next to the gear it weighs. Searching Part 2 produced three NOT FOUNDs that read exactly
  like missing rules. Worth remembering: rules.js draws on all three Parts, not just Part 1.
- **Two patterns were wrong rather than the app**: the book writes "Speed is reduced by 2",
  not "Speed -2", and it uses a real plus-minus sign in "6 + Body Modifier ± 1 for Size".
  Both looked like defects until the pattern was read rather than the result. Same lesson
  already recorded for negative probes: suspect the pattern first.

### Caveat on the source

Part 3 is today's fresh export. **Parts 1 and 2 are the 2026-08-21 exports.** A re-pull was
attempted and did not land: the browser fired the export but no file and no staging `.tmp`
appeared, which points at a native save dialog waiting for a click. Nothing suggests Parts 1
or 2 have changed, and the eight-cell Part 3 edit was the only one flagged, but this pass
should be re-run if either was edited since.

## combat.js checked against Parts 2 and 3, 2026-08-22

**57 claims, 57 pass. One fix: a note that stated a different rule from the card beside it.**

combat.js is a 5,293-line view, and most of it has no manuscript counterpart. What does is the
part that CHANGES NUMBERS: `COND_FX`, the table that turns an active condition into real Speed,
Snag, Save and action-economy effects, plus the firing-mode ammo costs. `conditions.js` carries
the prose for those same conditions and was checked on 2026-08-21; this is the other half, the
code that acts. Only this half is what the sheet actually does to a character.

`scratchpad/lin/diff_combat.py` is the check, written as claims with evidence like
`diff_rules.py`. Each condition is claimed TWICE: once that combat.js still says what the check
assumes (reported as STALE CLAIM if not, so a check cannot quietly pass about code that has
since changed) and once that the manuscript supports it.

Verified clean: twenty conditions including Burning's 1d6 and DC 10, Confused's d8, Drowsy's
-2 Initiative and DC 15 second-exposure save, Frightened's 10 spaces, Grappled's contested
Athletics or Acrobatics, Hallucinating's default DC 12, LinkDeath's 2d6 Psychic, Mutating's
DC 10 plus stacks, Panic's DC 12, Paralyzed's auto-failed Body and Agility saves, Prone's
Edge and Snag split, Staggered escalating to Stunned, Stunned's one Action OR Swift, and
Surprised's first-turn lockout. Both ladders check out end to end: **Fatigue 1 to 6** and
**Strain 1 to 5** by name and effect. Firing modes too, with Burst Fire at 3 rounds and
Full-Auto at 8.

The Fatigue ladder deserves a specific note because it is the subtlest thing here and it is
**right**: the book gives level 1 "Lose 1 point of Speed" and level 2 "2 additional points of
Speed (total -3)", and the app's `speedDelta -= 1` then `-= 2` sums to exactly -3. Confirmed
live on the sheet, which reads **SPD 3 of 6** for a Speed-6 character at Fatigue 2.

### The one fix: Bleeding dropped "willingly"

The book: "At the start of your turn, and every time you **willingly** move 1 space, you lose
Vitality based on your current stacks." The note read "at start of turn and per space moved".

That qualifier is load-bearing. Being Shoved, pulled or thrown is not willing movement and does
not tick the bleed, so the note as written would have a table applying damage the rules do not
charge. It is also an inconsistency the app had with ITSELF: `conditions.js` carries "willingly"
and the mechanical note beside it did not, so the condition card and its effect line stated
different rules. Now reads "per space you willingly move", and renders that way on the sheet.

### Two notes on the sweep

`DC 16` appears once in combat.js and is not a rule: it sits inside a comment describing a
fixed bug. Every live DC in the file is 10, 12 or 15.

Seven claims first reported NOT FOUND and **all seven were my patterns, not the app**. The book
writes "every time you willingly move 1 space" rather than "per space", "Speed is reduced by
50%" rather than "halved", "-2 penalty to Initiative" rather than "-2 to Initiative", "cannot
take Move Actions" rather than "no Move", and states Fatigue as "Lose 1 point of Speed" and
"2 additional points of Speed (total -3)" rather than as signed numbers. Same lesson as every
prior pass: read the pattern before believing the result.

### Caveat on the source

Part 3 is today's fresh export. **Part 2 is the 2026-08-21 export**, for the reason recorded
under the rules.js pass: the re-pull did not land, with no file and no staging `.tmp`, pointing
at a native save dialog waiting on a click.

## hazards.js checked against Part 2, 2026-08-22

**51 mechanical claims, 51 pass. Two further defects found by an adversarial pass, both fixed.**

`scratchpad/lin/diff_hazards.py` checks the machinery: exposure clocks, severities, the four
exposure types, the three deprivation tracks, the held-breath spec that Drowning and Vacuum
BOTH read from, vacuum sealing, caustic damage and gear degradation. Every value fires on a
timer during play, so a wrong one is wrong repeatedly and quietly. All 51 pass.

The mitigations were checked separately by a fan-out of independent agents with a two-lens
adversarial refutation, because they are judgement rather than arithmetic. Five claims went
in, two came out.

### FIXED: Hazard Seal was protecting the wrong thing

`immuneCaustic: true` was read by the SAME engine gate that decides whether worn armor
corrodes, so a Durabody in an unsealed suit never lost 1 DR after a full scene in the wash, and
the panel printed "Hazard Seal is worn over Foundry Shell and keeps the caustic off it too".

The engine's comment gave the reasoning, and the reasoning was sound but only for the other
case: the **Hazmat Suit** is "a sealed chemsuit worn over your armor", so a suit that nulls the
damage cannot leave the plate underneath it corroding. **Hazard Seal is the opposite kind of
thing.** Part 1: "You can completely lock down your **internal systems** against environmental
intrusion... This seal prevents internal flooding and chemical burns." It seals the Durabody,
not the armor strapped on the outside, and Part 2 degrades unsealed gear regardless of who is
wearing it.

The gate now reads `blocksCaustic` only. Verified both ways live:

| character | wearer immune | armor degrades |
|---|---|---|
| Hazard Seal, unsealed Foundry Shell | yes, `stoppedBy: "Hazard Seal"` | **yes**, `exposed: true` |
| Hazmat Suit worn, unsealed Foundry Shell | yes | no, `blockedBy: "Hazmat Suit"` |

The wearer-side immunity is untouched: `stoppedBy` and `lingerStoppedBy` both still name
Hazard Seal, so the Acid inside and the lingering Acid after exit are still zero.

### FIXED: the chapter's GM Guidance box was not carried

The Environmental Hazards chapter closes on a GM Guidance box, and it is the rule that decides
whether any of the rest is rolled at all: "Exposure is a pacing tool, not a damage source. Roll
it when the clock matters... If nobody is making a decision about the environment, do not roll
for it." `hazards.js` had no `gmGuidance` field even though `kits.js` and `resolution.js`
already carry one. Added, and rendered in the Codex's Hazards panel, because data nobody sees
is not carried.

### Refuted, and worth recording

Three claims died under refutation, including **one of mine**. I had noticed that "Getting Out
of It" names ten things while the `mitigations` array has nine rows, with Sealed armor the one
with no row, and thought it a gap. It is not:

- Sealed's "Resistance to Toxic damage" is fully wired through `gear_armor.js` `traitResist`
  and `engine.js`, and really does produce Toxic Resistance on the sheet.
- Sealed's only mechanical footprint INSIDE the hazards chapter is the caustic degradation
  clause, and the app implements that too (`appliesTo: "unsealed worn armor"`, and
  `wornArmor().sealed`).
- The remaining half, "Edge on saves against gas, disease, and airborne or environmental
  hazards", maps onto no save the chapter actually rolls: cold is excluded by the very sentence
  quoted, heat is not air, deprivation is food/water/sleep, vacuum is excluded twice, and
  caustic rolls no save at all. Writing a Sealed row would have meant inventing which exposure
  types to put in `edgeOn` with no book support.

Sealed is an armor TRAIT, and the `mitigations` array's `source` vocabulary is gear, armorMod
and lineageFeature only. It is carried on the trait axis instead.

Two claims that the Rebreather's row should also cover Drowning were refuted the same way: the
array transcribes Part 2's "Getting Out of It", which says only "A Rebreather buys an hour of
thin air", and the full Part 3 rule ("you do not begin Drowning in water or low-oxygen air")
is already carried verbatim in `gear_tools.js`, which is exactly what the row's `source` points
at. Adding `breathMinutes: 60` would have been actively wrong: the engine reads that key
kind-agnostically, so it would have granted a face-slot mouthpiece an hour of vacuum immunity,
credited on screen to Void Lung.

**The remaining honest gap is engine vocabulary, not data**: there is no drowning-only shield,
so a Rebreather does not stop the Drowning clock in the app. Recorded here rather than fixed,
because it wants a new effect key and that is its own decision.

### Caveat on the source

Part 3 is today's fresh export. **Part 2 is the 2026-08-21 export**, for the reason recorded
under the rules.js pass: the re-pull did not land.

## vehicles.js checked against Parts 2 and 3, 2026-08-22

**97 numeric checks, 97 pass. Six prose defects found by an adversarial pass, all fixed.**

`scratchpad/lin/diff_vehicles.py` is table-driven, because both sources really are tables: all
7 profiles' Category, Tier, Speed, Handling, Structure, Integrity, Node Tier, Cargo and Traits
against Part 2's Vehicle Profiles, both upkeep figures against Part 3's Vehicle Upkeep Table,
the derived weekly total, and all 13 mods' price, fits, legality and availability. **Not one
number is wrong.**

The prose went to a fan-out of independent agents with adversarial refutation. 26 claims went
in and 6 survived, which is the right ratio for this kind of hunt.

### Fixed

- **Ejector Seat** carried one sentence where the book has three bullets, and its one
  restriction was wrong. "Needs open sky above" reads as a gate; the book fires the seat anyway
  under a ceiling and charges for it. Restored: the Impulse on a crash, 4 spaces up and 2
  clear, Prone and unharmed, the roof cut as part of firing, a chute if airborne, one use per
  scene, the **Swift Action** to launch a passenger at will, the **Agility Save (DC 15)** an
  unwilling occupant gets, and the overhead case at **1d6 Bludgeoning per space of the 4 cut
  short**.
- **Overdrive Injector** dropped the cap that bites hardest on this file's own data: a vehicle
  already rated **Very Fast gains no increase**, because there is no fifth step, but still
  takes the damage. Two of the seven profiles, the Corporate VTOL and the Light Shuttle, are
  Very Fast. Also restored "including for the straightaway trigger" and "ignoring Structure".
- **Ghost Transponder** granted Edge on checks against scanners, checkpoints and traffic
  systems full stop. The book scopes it to those systems **reading the vehicle's identity**,
  and its own summary line reads "Edge against ID scans".
- **Smoke Discharger** lost the timing and the price: the Snag lands on the pursuing pilot's
  **next Chase Check**, and recharges cost **50 Glimmer per canister**. A refill price belongs
  in the file whose other half is the ownership ledger.
- **Stock loadouts** were absent. Two profiles come armed out of the book: the Riot Suppression
  Mech carries a Rotary Cannon on a turret ring, the Corporate VTOL a Light Machinegun on a
  fixed door mount. That is a weapon the owner has without spending a Mod Slot or a Hardpoint
  Mount, so it is now a `loadout` field, shown in the Garage line and the Codex table.
- **Mounted weapons were never defined.** The file sells a Hardpoint Mount that mounts a weapon
  "as a Mounted weapon" and then never said what one is. It matters because the attack is not
  the personal one: **d20 + Tech Modifier** plus the weapon's own proficiency, the weapon counts
  as being in its Setup state (ignores High Recoil, range bands doubled), the feed system is the
  loader for Crew Served, and attacks from inside a vehicle moving Fast or Very Fast take Snag
  unless the weapon is Mounted. Added to `modRules`.

### Refuted, including another of mine

Twenty claims died. The one worth recording is **mine again**: I noticed Part 2 defines nine
Vehicle Traits mechanically while the app carries them only as bare strings, with no glossary,
even though weapon traits have `EN.gearCatalog.weaponTraits` and armor traits have
`EN.gearCatalog.armor.traits`. Refuted on two grounds, both checked: the sheet **never displays
a vehicle's traits at all**, so nothing is unreachable, and `statsNote` names Traits explicitly
among the things it defers to Part 2. That is a stated boundary, not a gap.

Most of the rest died on the same boundary. `statsNote` defers Speed, Handling, Structure,
Integrity, Node Tier, Cargo and Traits to Part 2, so the Speed Ratings table, the Impact DC
table, the mass rows, Category Rules and the Structure damage gate are all outside this file by
declaration rather than by oversight. **That deferral is doing a lot of work, and it is worth
knowing it is load-bearing**: it is the reason two thirds of the claims failed.

### Caveat on the source

Part 3 is today's fresh export. **Part 2 is the 2026-08-21 export**, for the reason recorded
under the rules.js pass: the re-pull did not land.

## crafting.js checked against Part 2, 2026-08-22

**48 data claims, 48 pass. Four defects in the COMPUTED half, all fixed.**

`scratchpad/lin/diff_crafting.py` covers the data: all five Project Tiers with their Target
Progress and required Skill Tier, all five outcome-to-Progress values, materials at half market
price, salvage, the armor repair rates, and the craft skill list. Clean.

The computed half is where this file actually lives, and it went to independent agents with
adversarial refutation. 24 claims went in, 4 survived. Every one is a case where the app
*computes* something the book *names*.

### Fixed

- **Tool Category Expertise did nothing.** Part 2: "Expertise: You treat kits in this category
  as one quality grade higher than listed, up to the +3 Edge Dice maximum." The tier ladder was
  already stored and already **cost Training Points**, but nothing ever spent it: a crafter who
  paid for Engineering Tools (Expertise) got exactly the catalog's Edge Dice at the bench.
  `tbKits` now bumps a kit's dice by one grade at Expertise or Mastery, capped at 3, and says so
  in the pool breakdown. Verified live: Edge 3 at Tool Proficient, **Edge 4 at Tool Expertise**,
  with the tooltip reading "Field Repair Case, ..., one grade higher for Tool Expertise".
- **The breached-armor rebuild floated with the suit.** Part 2 names the tier outright:
  "Rebuilding it is a **Standard Project** at full parts cost." The app asked `tierForItem`, so
  a Rare suit rebuilt as Advanced (Target 7) and a Legendary one as Prototype (Target 10), and
  an Artifact suit landed on `relic`, whose target is null, falling through to Target 10 with 5
  Snag. Now a named `rebuildTier: "standard"`, and `breachedText` says "Standard Project".
- **Every medical consumable was an Engineering Project.** `skillForItem` tested
  `/Medical/i.test(it.category)`, but only the KITS carry a `category`; the eight
  `group: "Medical Consumables"` rows carry none, so all of them fell through to the Engineering
  default. The bench offered "Build Combat Stim Pack" as Engineering work. Now reads `group`
  alongside `category`. Verified: Combat Stim Pack routes to **Medtech**, and the medkits still do.
- **Cheap Mystech was forced to Prototype.** A blanket line promoted anything with the Mystech
  trait to at least Prototype, so the **Scrap Ward, a 120 Glimmer Common charm, opened as a
  Prototype Project**: Target 10, "Ongoing across sessions", 4 Snag. Part 2 names only an
  "experimental mystech build" at that tier, and Part 3 states the exception directly: "The
  crude, repeatedly manufactured stuff... uses the regular Common through Rare scale instead."
  The force is gone. `_availTier` already lifts genuinely rare Mystech, and it still does:
  Veilskin (Iconic) and Aegis Shroud (Legendary) remain Prototype, Reliquary Shell (Artifact)
  remains Relic, and only the Scrap Ward and Resonance Coil moved down to Standard.

### Refuted

Twenty claims died, and the reasoning is worth keeping. The strongest pattern was **the rule is
carried elsewhere**: the Allied Help Action Edge Dice live in `resolution.js`, the mod-slot
ceilings live in `armor_mods.js` and `weapon_parts.js`, and the half-price craft note lives in
`grid.js`. Several others died on **GM-facing scope** (the Work Interval's duration and the
Difficulty are the two things Part 2 explicitly says "The GM sets"), and one died because the
claim had the direction backwards: the app grants **zero** over-capacity installs, so the book's
ceiling of one extra Part is unreachable rather than exceeded.

`crafting.js` discloses its own house rulings in comments, and that convention did real work
here: a labelled ruling was treated as a disclosed choice, while the four fixed above carried
no such label and stated the substituted rule as if it were the book's.

### Caveat on the source

Part 3 is today's fresh export. **Part 2 is the 2026-08-21 export**, for the reason recorded
under the rules.js pass: the re-pull did not land.

## economy.js checked against Part 3, 2026-08-22

**61 table checks, 61 pass. Six prose fixes, two of them found by an adversarial pass.**

`scratchpad/lin/diff_economy.py` is table-driven: lifestyle tiers, safehouse rent, safehouse
upgrades, licences, day jobs and Hypercare tiers, each matched against its own pipe table in
the Economy and Rewards chapter, plus the Nexus reference value, the Crew Kit band, and the
worked split example's arithmetic. **Every number is right.**

### Fixed from the table pass

Four day job labels had been abridged. The book calls them "Ritual work for hire (**small**
consults, cleansings)", "Performer at a recurring gig **(band, drag, residency)**" and
"Low-level fence, **mod work**, or black market specialist", and gives the last one's social
web as "dangerous **people**". The dropped "mod work" is the one that matters: it is a third
kind of work the job covers.

### Fixed from the adversarial pass

13 claims went in and 2 survived.

- **The fixer's cut had no range.** The book's Default Split paragraph reads: "Typical fixer
  cuts run **10 to 20 percent**. Higher cuts mean better intelligence, more protection, and
  worse math for the crew." `splitNote` paraphrases that exact paragraph, carried the Crew Kit's
  10 to 30 percent band, and dropped the fixer's. The app was inconsistent with itself about it
  too: the Payout Splitter's CREW KIT % tooltip cites its range while FIXER % cited nothing,
  leaving a player a field to fill with no idea what normal looks like. Both sentences restored.

- **`notModelled` claimed the app does not model Debt, which it does.** The Codex prints that
  list under "These parts of the chapter are rules the sheet does not model yet", and it named
  "Debt and Obligation" while `economy.js` carries `debtKinds` (the book's exact five) and
  `debtNote`, `inventory.js` renders a working debt tracker in Bills (kind, holder, principal,
  clock, strike when settled) and `face.js` renders a second Debts panel. The app was telling
  the player it lacked a feature it ships.

  Checked against the book before rewriting rather than just deleting the line: the section is
  the five kinds, the principal/holder/clock triple, and then GM-facing escalation ("the GM
  should use the holder as a recurring NPC, add Snag to social rolls in the holder's
  territory"). The app models everything a SHEET can and omits the escalation, so the entry now
  says that, following the same convention as the Crew Kit entry beside it, which already names
  what is modelled in parentheses.

### Refuted

Eleven claims died, and the pattern is worth recording because this file has an unusual
defence: **`notModelled` is a disclosed-omissions list, and it did most of the refuting.**
Claims about Captured Goods and Fences, Premium Services, Bribes, Regional Exchange Variation
and Conversion Scene Complications all failed because the file names them as deliberate gaps.

Two more died on scope: the "Suggested Access Rules for Nexus Conversion" gate is GM scene
guidance for a mechanic the app deliberately does not implement (it keeps two independent
purses and never converts between them), and "How Day Jobs Affect Play" is explicit GM
discretion. One claim that the storefront price multipliers are invented was refuted on the
grounds that the storefronts themselves are declared app fiction, appearing nowhere in Part 3.

The Debt finding is the interesting inverse of all of those: `notModelled` is load-bearing
enough to refute most claims against this file, which makes an INACCURATE entry in it a real
defect rather than a cosmetic one.

### Caveat on the source

Part 3 is today's fresh export, so this pass is against current text throughout.

## resolution.js checked against Part 2, 2026-08-22

**72 claims, 72 pass. Two wrong rules found beyond them, in four places, all fixed.**

This is the file the whole system rests on, so `scratchpad/lin/diff_resolution.py` claims
everything twice, once that the app still says it and once that the book does: the +15 static
cap, all six DC bands, the five combat roll formulas, Edge and Snag die reading, Margin and its
three outcome bands, the Edge pool's 10 dice and 20-point ceiling, Snag's 7 dice and seven-d12
ceiling, the d12 rule, pool proficiency at 2/4/6, the five Snag risk levels, the situational cap
of 3, and the three cost tracks. All clean.

### The Help Action cap said +4 in three places. The book says +3.

Part 2's Help Action, Dice Pool half: "These stack across multiple helpers, but the total Edge
Dice added by all helpers together cannot exceed **+3**." The **+4 belongs to the d20 half**,
where it is the Mastery assist bonus, and it had been carried across to the pool line.

It was wrong in three places, and it contradicted the app's own rules in two more:

| site | had | now |
|---|---|---|
| `resolution.js` `pool.edgeBuild`, the Allied Help Action row | +4 max total | +3 |
| `rules.js` `formulas.help` | up to +4 total (Dice Pool) | +3 |
| `resolution.js` `collaborative.help.pool` | cannot exceed +4 | +3 |

The third is the authoritative one: the edgeBuild row literally points the reader at it with
"see Help Action". **I fixed the first two and missed the third**, because my sweep matched
"max total" and "up to +4" and that site phrases it "cannot exceed +4". The adversarial pass
caught it, which is exactly what it is for. The d20 half's "+4 with Mastery" is correct and
was left alone.

The +4 also broke this file's own `baseNote` and `edgeSnag.pool`, both of which state that no
more than 3 situational bonus dice may be added to a base pool.

### The d20 Group Check had an invented headcount

The app: "2. If half or more of the group meets or exceeds the DC, the group succeeds.
3. Calculate the Average Margin ... to determine **outcome quality**."

The book, in terms that leave no room: "The final outcome is determined by the group's Average
Margin on the Group Outcome Table. **There is no separate headcount to pass; the average is the
verdict.**"

So the app made success turn on a count the book does not use, and demoted the average to a
quality rating. The two disagree in both directions: a crew averaging +4 with only two of five
clearing the DC fails in the app and takes a Strong Success in the book, and a crew averaging
-2 with three of five clearing succeeds in the app and fails on the table. **The invented step
also contradicted the Group Outcome Table the app itself prints directly beneath it**, which is
keyed entirely to the average.

Replaced with the book's three steps: roll, record each Margin (positive for those who met or
exceeded the DC, negative for those who fell short), average them and read the table.

### Refuted

Two claims died. The Dice Pool cancellation claim failed because the app's cancellation text is
`d20Stacking`, scoped to the d20 block and opening "You can never roll more than 2d20", so it
never applied to pools in the first place. The Help Action declaration-timing claim failed as
table procedure that moves no number.

### Caveat on the source

**Part 2 is the 2026-08-21 export.** A re-pull was attempted again at the start of this pass
and again did not land, with no file and no staging `.tmp` appearing, which continues to point
at a native save dialog waiting on a click. This is the file that most wants a fresh Part 2, so
it is worth re-running once that is cleared.

## versatile.js checked against Part 2, 2026-08-22

**Two invented restrictions removed. The 184 named techniques all stay.**

This file is a 252-cell matrix keyed `ATTR|Skill|type`, 184 cells naming a technique and 68
holding null. Unlike every other file checked today, the defect was not a wrong number: it was
**two rules the app asserted that the book does not have**, both stated to the player as fact.

### The refusal gate

The file header read "null = the combination Does Not Work", and `combat.js` acted on it: a
nulled parent Skill was suffixed **✗** in the dropdown, and selecting one replaced the result
with a red block reading "This combination does not work; Body cannot apply to Systems for
Insight."

Part 2's Versatile Skills section contains exactly one prohibition, and it is that **you cannot
gain Proficiency, Expertise or Mastery in a Versatile Skill itself**. Nothing anywhere refuses
an Attribute and parent Skill pairing. The opposite is stated: "The core strength of a
Versatile Skill is flexibility", and the GM Guidance is "Ask players how they are performing an
action. The method determines which Attribute and parent Skill apply... Reward creativity and
let Skills flex in context when justified."

**What settles it is the book's own worked example.** Intimidation's Attribute Example row
lists Body, Wits, Tech, Mystique and Charm. The book then resolves an Intimidation with
**Agility plus Engineering**. Those rows are examples, not a whitelist.

The nulls also matched no pattern the book could justify. Charm, the headline Attribute for
Performance, was the most-refused Attribute for Performance at 7 of 14. And **the pairing the
book teaches the mechanic with, Body plus Systems, was refused for Insight and Intimidation**
while accepted for Performance, even though the book's Insight row lists "Body (Muscle
Memory)" and its Kinetic Interface Dance example says Body supplies "the physical endurance and
muscle memory required".

Now a null means only that the catalog has no NAME for that pairing. The panel rolls it exactly
as any other and prints "No preset technique for this pairing. Describe how you are doing it;
the method is what picks the Attribute and the parent Skill."

### The proficiency gate

Untrained skills were filtered out of the parent-Skill dropdown entirely, the column was
labelled "PARENT SKILL (Prof+)", and both the file header and its `note` stated "requires
Proficiency in the parent skill".

The book gates nothing on proficiency here. It says which BONUS the tier supplies, and
Untrained is one of the four tiers: +0, rolled with Snag. Where the book does want a
proficiency gate it says so plainly, as in the Help Action: "You must be at least Proficient in
the relevant skill or tool to move the dice at all." No such sentence exists for Versatile
Skills. The app also disagreed with itself: `builder.js` already described Versatile Skills as
borrowing "the tier of whatever parent skill you lean on in the moment", with no condition.

Every skill is offered now, and an Untrained parent resolves properly rather than being
refused: it adds +0 and the panel shows a **SNAG** chip.

### Verified live

Body + Systems for Insight, the pairing the book teaches with and the app used to refuse, now
reads: **Bonus +3 (Untrained), Roll: Body +3 + Systems +0, SNAG**. The book's own Insight
example still resolves to its named technique, **Digital Profiling, Bonus +4 (Expertise), Roll:
Tech +0 + Investigation +4**, so nothing regressed. All 252 cells and all 184 names are intact.

### Refuted

One claim died on the split: that Part 2's Approach table setting Insight's attributes to "Any"
was itself a rule. The column is headed "Common Attributes" and is non-exhaustive by the same
argument used above, so it is breadth prose rather than a stated permission. It did not matter
to the outcome, since the refusal gate fails on its own evidence.

### Caveat on the source

**Part 2 is the 2026-08-21 export**, for the reason recorded under the rules.js pass.

## status_changes.js checked, 2026-08-22: CLEAN, and it surfaced a bigger gap

**No defects. Nothing changed in this file.** It is the first file in the whole sweep to come
back clean on every axis, and the reason is structural rather than lucky.

### Why it holds up

The header declares "This file is a REGISTRY, not a second rules source", and that turns out to
be true where it matters. The exposure options are `.map()`ed out of `EN.hazards.exposure.types`,
the deprivation options out of its `tracks`, and the class buffs out of the Stitcher's
`aftermarketTunings` with `summary: t.text`, the owner's own prose. Consumables name a catalog
item and take their text from the catalog at render time. **A registry that derives cannot
drift**, which is exactly what the other eleven files kept failing at.

Verified live: 17 option keys, 3 exposure types, 3 deprivation tracks, 6 class buffs, 3
consumables, no dangling catalog pointers, and the lookup is null-prototype (it is indexed by
keys arriving out of a save file).

The few strings it does author were each checked and are accurate:

- The three consumable `endsOn` values against Part 3. Combat Stim Pack's "End of your 3rd
  turn, then a Body save DC 12 or Dazed 1 round" matches the book's Drawback bullet; Nightwatch
  Tablets' "4 hours, or extended by a fresh dose at the cost of a Crash Stack" matches its
  Synergy bullet; Detox Patch's "8 hours" matches its Effect.
- The class buff `endsOn` is near-verbatim Part 1: "it stays active until you finish your next
  Short or Long Rest, when you must recalibrate it or it powers down", and `exclusiveGroup`
  matches "An ally can have only one Hot-Wire at a time."
- Both environmental summaries match `hazards.js` (held breath and the escalating Body Save;
  damage inside, lingering residue, and 1 DR per full scene).

### What it surfaced: 68 rules bullets absent from the whole app

Checking those three `endsOn` strings exposed something the registry was quietly compensating
for. **The gear catalog carries only each item's `Effect` bullet.** Part 3 also gives many
entries `Activation`, `Limitation`, `Drawback` and `Synergy` bullets, and those have no home.

Measured across Part 3, probing the entire `app/data` and `app/js` tree for each bullet's text:

| label | absent from the app |
|---|---|
| Activation | 25 |
| Limitation | 23 |
| Drawback | 11 |
| Synergy | 9 |
| **total** | **68** |

They are load-bearing, not flavour. A sample:

- **Rubber Rounds**: "Against a target with armor DR 3 or higher, or any vehicle or hardened
  construct, the rounds bounce." The app carries the Nonlethal, Bludgeoning and Staggered rules
  and not the limitation, so nothing tells a player the ammo does nothing to a hard target.
- **Whisper Rounds**: "Halve the weapon's long-range band (round down)."
- **Spike Rounds**: against a purely organic target "the round deals no damage".
- **Hollow Point Rounds**: no extra Wound damage from criticals against DR 2 or higher.
- **Nightwatch Tablets**: the entire Drawback, including the Crash Stack maths and a **Body save
  DC 25 on the final crash after four consecutive doses; on a failure you suffer heart failure
  and drop to 0 Wounds**. A death rule that exists nowhere in the app.

This is the same shape as the trap found in the weapon-parts pass, where four entries had no
bare `Effect` bullet and were skipped: **the app's gear transcription maps `Effect`, `On Hit`,
`Basic Use` and `Proficient Use`, and silently drops every other rules bullet.** The earlier
gear prose pass re-transcribed 197 values through exactly that mapping, so it could not have
caught this.

**Not fixed here.** It is 68 entries across the ammunition, tools and gear catalogs, which is a
pass of its own comparable in size to the original gear prose sweep, and scoping it is the
author's call. `gear_traits.js` and `kits.js` are still unchecked and sit in the same catalogs,
so it may be worth doing them together.

## gear_traits.js, kits.js and the 68 missing bullets, 2026-08-22

Done together, because they are the same catalog. **84 rules restored, one whole item added,
and four wrong rules corrected.**

### The missing bullets: 80 restored, not 68

The gear transcription only ever mapped four bullet labels (Effect, On Hit, Basic Use,
Proficient Use). Part 3 uses more, and everything else had been dropped. The earlier gear prose
pass re-transcribed 197 values THROUGH that same mapping, so it could not have seen this.

**71 got their own fields.** Part 3 uses four labels as a shared vocabulary, so they became four
columns rendered the way Basic Use and Powered Benefits already were, and made searchable:

| field | restored |
|---|---|
| Activation | 26 |
| Limitation | 24 |
| Drawback | 11 |
| Synergy | 10 |

**9 more folded into their item's `effect`**, because their labels are used by one item each
and a one-off label does not earn a column: Smart Rounds (Lock-On, Replay), Resonant Rounds
(Resonant Armor Bypass, Strain Feedback), Explosive Rounds (Area Effect), Genesis Rounds
(Mutating), Hex-Etched Rounds, Cryo Lance (Continuous), Bailiff Rig (Lapsed or Locked), Node
Retrofit (Limit), and Tempest Core (all three modes). Same convention as the weapon-parts and
cyberware passes.

What was actually missing, as a sample: **Rubber Rounds bounce off armor DR 3 or higher, any
vehicle, or a hardened construct. Whisper Rounds halve the long-range band. Spike Rounds deal
no damage to a purely organic target. Resonant Rounds force a Flow save (DC 13) or 1 Strain
Point.** And Nightwatch Tablets' full Drawback, ending in a **Body save DC 25 after four
consecutive doses, where a failure is heart failure and a drop to 0 Wounds**: a death rule that
existed nowhere in the app.

### Breach Charge was not in the catalog at all

A whole priced item, 120 Glimmer, Rare, Restricted, Counted. The Demolition Kit's own Basic Use
already referred to it ("Enables safe handling of Breach Charges"), so the app knew the item
existed and simply did not sell it. Added with its Effect and Activation, and verified buyable.

A systematic scan found it is the ONLY missing item: 353 entry headings in Part 3, and every
other unmatched one resolves (five Chrome Tax thresholds, the #PRINT tag, and three headings
where the book combines two or three items the app carries separately).

### Four wrong rules

- **Area X** never said what a bare Area means. The book: "An Area with no shape word is a
  sphere." The app's own data has 21 uses of "Area 3", 17 of "Area 4" and 13 of "Area 2" with
  no shape word, so the shape of almost every area effect in the app was unresolvable.
- **Worn** charged a Body Slot outright. The book inverts it: "A worn item only counts against
  a Body Slot if its entry says so. If a worn item does not mention a Body Slot, it does not
  count against any slot limit." None of the five Warding Foci name one.
- **kits.js rewrote the book's worked example.** The book counts a Fury's Warhammer **(or Axe)**
  at the same 2 Load for a total of 6, still Unencumbered at Body +0. The app dropped the
  "(or Axe)" and asserted "The Axe's Heavy trait reads as Load 3", landing that build at 7 and
  over the threshold. **Part 3's Heavy trait assigns no Load value at all**, so the clause was
  invented. Also restored "adjusted by Size" to the quoted threshold formula.
- The same entry is recorded twice above because two agents found it independently.

### Refuted

**Crew Served**, where the app bars "Sprint" and the book bars the Dash action. Refuted as a
terminology nit: the app forbids the same extra-movement burst, and no number, DC, action type
or condition differs. Worth knowing the app uses a word the ruleset does not define, but it
changes nothing at a table.

Of 36 trait definitions that differed textually from their book section, **only two were real**.
The rest were the app trimming a lead-in like "The weapon is" or merging the flavour line into
the description, which is its house style throughout.

### Caveat on the source

Part 3 is today's fresh export. **Part 1 is the 2026-08-21 export**, which is what the kits
finding rests on.

## class_picker.js checked against Part 1, 2026-08-22: CLEAN

**60 strings, all verbatim. Nothing changed.** The second clean file of the sweep, and like
`status_changes.js` it is clean for a structural reason rather than by luck.

### It was held to its own standard

This file is unusual: it makes an EXACTNESS claim where every other data file compresses on
purpose. Its header says the app carries three distinct layers per class, Choosing (this file),
Arriving (`EN.classes[key].tagline`) and Playing (`extra.playbook`), and that these Play-if
lines are "Verbatim from Part 1".

So the test was not the usual "did a mechanic survive the abridgement" but the much sharper
"is this actually verbatim", which is the only fair way to hold a file to a claim it makes
itself. `scratchpad/lin/diff_picker.py` normalises only markdown emphasis, the manuscript's
backslash escapes and curly quotes, then requires every string to appear in Part 1 as a
substring.

**All 60 pass**: the two intro paragraphs, and a blurb and a Play-if line for each of 7 classes
and 22 subclasses.

### Complete and correctly assigned

Verbatim alone would not be enough, since a file can quote the book perfectly and still quote
the wrong thing or miss half of it. Both were checked:

- **Complete.** Part 1 states 29 "Play a X if" lines and the app carries 29, an exact set match
  in both directions. Nothing in the book is missing and nothing in the app is invented.
- **Correctly assigned.** Every class blurb was traced back to the manuscript and confirmed to
  sit under that class's own heading, so no text is attached to the wrong class.
- **Its own pointers resolve.** All 7 classes have the `tagline` and `extra.playbook` the header
  promises, and no subclass named in the picker is missing from the class data.

Rendered live to confirm it is not merely correct in the file: the builder's class step prints
both intro paragraphs and the Codebreaker Play-if line word for word.

### Why the clean files are clean

Both files that came back clean share a trait the twelve that did not were missing. Neither
restates a rule it does not own. `status_changes.js` derives its options from the files that own
them, and `class_picker.js` quotes the book exactly and confines itself to one layer, deferring
the other two by name. **Every file that carried its own paraphrase of a rule eventually drifted
from it.** That is the single clearest pattern in the whole sweep.

## The Rebreather / Drowning gap, closed 2026-08-22

The hazards pass recorded this one as engine vocabulary rather than data, and left it. It is
now wired, and the wiring is the interesting part.

### Why it could not just be data

The Rebreather's own entry: "you do not begin Drowning in **water or low-oxygen air** for up to
1 hour of active use". The app already gave it `thinAirMinutes: 60` for the low-oxygen half and
nothing at all for the water half, so a character wearing one still ran the full Drowning clock
the moment they went under.

The obvious fix, adding `breathMinutes: 60`, was **actively wrong**. `fx.breathMinutes` was a
single number applied to every row of `EN.hazards.breath.kinds`, and Vacuum is one of those
rows. It would have handed a face-slot mouthpiece an hour of vacuum immunity, which Part 2
forbids twice over: it allows exactly two vacuum-rated paths, a Warframe Shell natively and a
Rebreather Liner on an already-Sealed suit, and `hazards.js` already encodes that restriction.
`breathFrom` was hardcoded to Void Lung as well, so the panel would have credited the wrong
mitigation.

### What changed

`breathMinutes` now accepts either form, and the distinction is exactly the fiction:

- **a number** covers every breath kind, which is Void Lung. You are holding your breath, and
  the reason you cannot inhale does not matter.
- **an object keyed by kind** covers only what it names, which is the Rebreather:
  `breathMinutes: { drowning: 60 }`.

`fx.breathMinutes` became a per-kind map with a matching `fx.breathFrom`, so each kind takes
the best grant available to it and the panel names the mitigation that actually supplied it
instead of always saying Void Lung.

### Verified live, all four cases

| character | Drowning | Vacuum |
|---|---|---|
| nothing | clock runs | clock runs |
| Rebreather worn | 60 min, credited to Rebreather | **clock still runs** |
| Void Lung | 15 min, Void Lung | 15 min, Void Lung |
| both | 60 min, Rebreather | 15 min, Void Lung |

The last row is the one that proves the design: the two kinds resolve independently and each
credits its own source. The Drowning condition card now names the Rebreather on screen.

### One simplification worth knowing

The book gives the Rebreather "1 hour of active use" as a single budget covering whatever it is
protecting you from. The app models thin air and drowning as two separate 60-minute grants. It
does not bite today, because the app tracks the device as a flag and never counts elapsed
device time, but a table running a long dive after a long climb is not double-spending an hour
in the book and is in the app.

## The stale-source caveat is CLEARED, 2026-08-22

Every pass recorded today carried a caveat that Parts 1 and 2 were the 2026-08-21 exports,
because the re-pull kept failing on a save dialog. The dialog is cleared and both were pulled
fresh. **Both are byte-identical to the 08-21 copies.**

| part | fresh pull | verdict |
|---|---|---|
| Part 1 | 458,780 bytes | identical, unchanged since 2026-08-21 |
| Part 2 | 435,394 bytes | identical, unchanged since 2026-08-21 |
| Part 3 | pulled this morning | current, and its eight legality edits verified |

**Nothing needs re-running.** Every caveat written above is resolved rather than outstanding:

- The six passes that lean on Part 2 (`rules.js`, `combat.js`, `hazards.js`, `resolution.js`,
  `versatile.js`, and the Rebreather work) were checked against current text all along.
- The `kits.js` Fury Load finding rests on Part 1 and is likewise current.

Worth recording for the next time: **the Part 1 request initially returned Part 2 again.** Two
consecutive exports of different Doc ids produced the same 435,394-byte file, and only a
cache-busting query parameter on the export URL forced the real Part 1 through. A same-size
result is the tell. Checking the first line of the staged `.tmp` catches it immediately, since
Part 1 opens "# Welcome to Elysium Nights" and Part 2 opens "# Dicey Situations".

Three staged `.tmp` files from these pulls are left in the Downloads folder rather than deleted,
since they are the author's own directory.

## The open author questions, triaged 2026-08-22

Thirteen questions had accumulated across the sweep, carried in this log as "needs an author
ruling". They were put to the manuscript one at a time, and each claimed book answer was then
attacked twice, once on the reading and once on the search. Two of the claimed answers were
refuted and are recorded below as refuted, because both refutations were right.

**The result is that the pile is smaller than it looked.** Five needed no ruling at all, one
turned out to be an app defect rather than a question, and five are genuinely his.

### Settled by the book. No ruling needed.

- **"Burst" or "Burst Fire": the app is right.** The mode is named "Burst Fire" at 24 sites in
  Part 3, including the `### Burst Fire` rules heading and every weapon Traits line, plus once
  in Part 2. Bare "Burst" as a mode name occurs **once in the whole manuscript**, Part 1 line
  3739 (Suppressive Counter). It is shorthand, not a second name. Worth knowing what the app
  dodged: `class_codebreaker_fury.js:300` already expands it to "the Burst Fire or Full-Auto
  firing mode". Had the transcription copied the book's bare "Burst", Suppressive Counter would
  have named a trait **no weapon in the catalog carries**, and no gun would ever have qualified.
- **"Off-Hand" or "Off hand": the correction was right.** "Off-Hand" appears twice in Part 1 and
  fourteen times in Part 3; "Off hand" as a trait name appears **zero** times in any part.
  Colossal Grip and Walking Emplacement do not spell it differently in the book. Both read "the
  Light or Off-Hand trait", so the app's old spelling was a transcription typo and nothing more.
- **The Nexus rate: there is no contradiction, and the catalog was never mispriced.** The book
  states the rate **twice, identically** (Part 3 lines 88 and 569). The dual-priced rows that
  seemed to imply about 3,200 sit inside the book's own printed street band, "Unlicensed or
  black market exchange ... usually returns 2,000 to 4,000" (Part 3 line 98), and the Warframe
  Shell's 9,600 sits in the licensed band above it. The two figures measure different things.
  The app never applies the ledger rate to a row that carries a Glimmer price, so nothing moves.
  **One small correction to our own comment**: `economy.js:30-39` says "the four unleased items
  priced in BOTH currencies" and "Three of them sit inside the unlicensed band". It is six and
  five. Echo Shroud and Ward Amplifier were missed because they live in `armor_mods.js` rather
  than `gear_armor.js`. The full six, with implied rate: Warframe Shell 9,600, Resonant Carapace
  3,200, Aegis Shroud 2,800, Echo Shroud 2,667, Hex Lattice Projector 2,400, Ward Amplifier
  2,400. **None of the six is a lease buyout**; the only true buyout in the book is the Bailiff
  Rig, and it has no competing Glimmer sale price. Correcting the count strengthens the app's
  own argument rather than weakening it.
- **The Universal Upgrade preamble: dropping it was right.** Part 1's heading is
  `Level 2, 4, 6, 8: Universal Upgrade` (line 3361) and the app already prints "Level 2 .
  Universal Upgrade" as the slot title, so the preamble said the level twice.
- **Climb speed is ONE rule.** Five sites grant a climb speed and four grant it at full Speed
  under four different phrasings: "base walking Speed" (Prey Stalker's Grip), "walking Speed"
  (Highground Hunger), "normal Speed" (Parkour Runner Upgrade), "walking speed" (the Nixie
  Skyhook familiar's Vertical Infiltration). No site draws a distinction. Parkour Runner's own
  base bullet glosses the mechanic plainly, "Climbing does not cost you extra Speed", against a
  normal climb cost of 2 to 3 per space. `briefs.js:343` and `:350` already normalize both
  lineage features to one wording. There was never a real question in the "one grant or two"
  half. The "base" half is a different question and is still open, below.

### NOT a question. An app defect, and a bad one.

**A round is 6 to 10 seconds, and 1 minute is 10 rounds. The book says so six times.**

Part 2 line 1579 ("Six to ten seconds of motion, Flow, and bad decisions per round"), line 1586
(the Time and Duration glossary row), line 1605 (the Round heading), line 1608 ("A duration of
**1 minute** is treated as **10 rounds**"), line 1634 ("**1 minute** is roughly **10 rounds**"),
line 1641 ("you can convert as needed, usually treating 1 minute as 10 rounds"), and Part 1 line
4386 spells it inline, "until 1 minute (10 rounds) passes".

The app asserts the opposite **in player-visible copy**. `hazards.js:175` reads "no rule anywhere
in EN states how long a round is, and inventing one to divide by would be inventing a rule", and
`engine.js:2899-2901` repeats it in a comment before hardcoding the behaviour as
`clockStarts: !(fx.breathMinutes[k.key] > 0)`.

Three consequences, all wrong:

1. The sheet tells a player the rulebook is silent about something it states six times.
2. Void Lung is 150 rounds and a Rebreather is 600 rounds against Drowning. Both are computable
   from the book with no invention at all. The refusal to convert had no basis.
3. **The breath tracker is inert for exactly the characters most likely to need it.**
   `combat.js:1494-1495` disables the tick button whenever `clockStarts` is false, so anyone
   with Void Lung or a Rebreather gets a dead control.

A second, separate error rides along: the note leans on "Fifteen minutes outlasts any scene", but
Part 2 line 1613 defines a Scene as a narrative unit, "a continuous stretch of play that focuses
on one situation or problem", which ends on a shift of focus and not on a clock. **A Scene has no
duration, so nothing can outlast one.** Both claims should go.

`hazards.js:159` already stores the Rebreather's grant in minutes and the data layer needs no
change. Only the conversion at the engine boundary and the two prose notes.

### Genuinely his, with the options laid out

1. **What does an Overdrive Maneuver cost?** The book never says, for any of the eight. The Fury
   is **the only resource class whose ability list forgot its cost line**: the Hustler (Part 1
   line 3823), the Scoundrel (4233) and the Stitcher (4790) all carry "Unless otherwise noted,
   all X cost 1 Y to activate", and the Operator states it inline (4025). The Fury preamble at
   3583 is the Hustler's sentence structure verbatim and simply stops where the cost sentence
   belongs. The app's uniform 1 is implied hard by three separate places: the primer teaches
   Overdrive with "Spend 1 Overdrive", the resource-budget example calls a 2-point cost the
   notable exception, and every Fury feature that costs 2 says so. **Recommend: add the missing
   sentence to the book.** The app needs no change beyond echoing it in the class intro, which
   currently mirrors the book so faithfully that it never tells the reader the cost at all.
2. **What Load is a Trauma Rig?** The book assigns none, in a column or in prose, and no
   equipment entry in Part 3 carries a Load stat line at all. The app ships 2 carried / 1 worn,
   which **hard-codes a GM option as an always-on rule** ("the GM may reduce its Load by 1",
   Part 3 line 6444) and grants a courtesy the book explicitly denies to the other worn thing it
   prices: "Armor counts whether worn or packed". That inconsistency is the real defect, not the
   number. Options: flat 2 either way; keep 2/1 but label it on the sheet as a discretionary
   reduction; or tier-scale it, since the book's own Load table prices a compact medkit at 1 and
   a Rig counts as a Basic Medkit by rule. **A separate live question fell out of this**: Basic
   Medkit takes the "kits" default of 2 while the only medkit the book prices is "compact
   medkit" at 1.
3. **What does "base Speed" mean?** Climb is one rule, but Prey Stalker's Grip says "base
   walking Speed" and the others do not, and the book never defines the term. Its "base X"
   convention elsewhere is uniformly pre-modifier: "The vehicle's base Structure is 18 whatever
   the chassis, and mods that raise Structure apply on top of it", and "You can calculate your
   base Defense using your Body modifier". Every "base Speed" site in the corpus is a permanent
   modification (Synaptic Accelerator, Adrenal Tuning, Speed Freak, a Critical Wound), never a
   situational one. Encumbrance is written as a reduction to Speed itself, so a climb speed
   keyed to plain Speed inherits it. **Options: (a) delete "base" from Prey Stalker's Grip so
   all four grants read alike, which is what the app already ships; or (b) keep it and define
   the term, in which case a Skarn climbs at full rate while Overloaded and Prey Stalker's Grip
   is genuinely the stronger feature.** Nothing in code moves either way; only prose.
4. **Does a Long Rest reset the sleep clock?** The book never links the two. A Long Rest is
   "about 8 hours of uninterrupted rest" with eight listed benefits, none of them food or water,
   so it plainly does **not** feed and water you and the app is right to leave Hunger and Thirst
   alone. Sleep is the open half. For a reset: Part 2 line 1637 equates an 8-hour block with "a
   full sleep cycle". Against: the author was demonstrably thinking about Long Rests while
   writing that chapter, because he wrote a carve-out for one of the four exposure types,
   "Fatigue from thin air does not come off during a Long Rest taken at the same altitude",
   **and wrote none for Deprivation.** Deliberate silence reads stronger than the inference.
5. **Is the Long Rest Fatigue reduction gated?** A real contradiction, two sites, same mechanic.
   Part 2 line 2793 (Recovery chapter) states it flat: "Reduce **Fatigue** by 1 level. Severe
   Fatigue (level 4 or higher) requires professional care or ritual support." Part 2 line 3239
   (Fatigue chapter) gates it: "**Long Rest (Fatigue 1 to 3):** Reduce Fatigue by **1 level** if
   you have **safe shelter, food, and water**". The app implements the ungated version. One of
   the two needs to lose.

### Refuted, and both refutations were right

- **Climb speed.** The first pass claimed the book settles what "base" means, reasoning that the
  Critical Wound table halves "base Speed" in play so "base" cannot be a protected pre-modifier
  quantity. Read in context that entry says "The mechanical penalties are permanent", which is
  entirely compatible with "base" meaning pre-situational. The one piece of positive evidence
  collapsed. It also **missed a fifth climb grant the question had explicitly asked for**: the
  Gecko Grips armor mod, Part 3 line 3656, which grants climbing at **half** Speed and is the
  only grant at a different magnitude. Verified directly.
- **Long Rest.** The first pass claimed the book states what ends a Deprivation clock and
  concluded a Long Rest resets the sleep track. The general rule it cited, "Get out and the
  clock resets, DC and all. The Fatigue stays and comes off the ordinary way", governs
  Deprivation but never says what getting out of hunger consists of. Part 2 contains no instance
  of eat, drink, meal or ration anywhere. The inference was presented as a ruling. It also
  missed the Fatigue contradiction above, which is the more useful finding.

### Dissolved: Emergency Boot was never a presentation call

This log framed it as "should the sheet suppress the death-save block outright or offer a
trigger". Neither. The feature says you **remain at 1 Wound**, and the sheet computes
`dying: wounds <= 0 && !ch.stable` (`combat.js:842`). At 1 Wound `dying` is already false and the
block hides itself. **There is nothing to suppress.** What it needs is a trigger that sets Wounds
to 1 and spends the use, and the budget channel already exists: `parseUses` (`combat.js:2087`)
matches "once per Long Rest" and the feature's text opens with exactly that. Ordinary buildable
work, not a question.

### A punchlist for the manuscript, not the app

Recorded because each is a one-line fix in the Docs, and the app is already correct on all of
them. **Nothing here was edited; the Docs are his.**

- Part 1 line 3739, Suppressive Counter: "the Burst or Full-Auto firing mode" wants "Burst Fire".
- Part 1 line 3583, Fury Overdrive Maneuvers: the "Unless otherwise noted" cost sentence is
  missing, and every sibling class has it.
- Part 2 line 1920 lists four firing modes; Part 3's Firing Modes section defines five, adding
  Continuous. The app already carries five (`gear_traits.js:24`).
- Part 2 lines 2793 and 3239 state the same Fatigue reduction, one gated and one not.
- Part 2 line 1649's stacking rule says to subtract flat reductions before applying any halving,
  which is in tension with the Critical Wound entry's own "Your base Speed is halved".
- Two stray spaces before punctuation in Part 1: line 5216 (Cross-Discipline Tactic,
  "Ability ,") and line 5602 (Breach Charger, "Prone ."). **A correction to what this log said
  earlier**: it claimed "at least five talents" and named four, plus a comma splice in Armor
  Piercing Specialist. Scanning all three parts for space-before-punctuation, including unicode
  spaces and with markdown and backslash escapes stripped, there are exactly **two**, both
  above. Cybernetic Surge and Spatial Delivery read cleanly and the Armor Piercing Specialist
  sentence is an ordinary compound, not a splice. Parts 2 and 3 are clean.

### Also corrected here

This log said the PDF "still transliterates to G and N". It writes `GLM` and `NXT`
(`pdfexport.js:92-93`), which is less lossy than described.

## The round-length defect, FIXED 2026-08-22

The triage above found the app asserting, in copy a player can read, that the rulebook never
states how long a round is. The book states it six times. This is the fix.

### The rule now has a home

`EN.rules.time` in `app/data/rules.js` carries `roundSeconds: "6 to 10"` and
`roundsPerMinute: 10`, cited to all six sites. It goes in `rules.js` rather than beside the
breath spec because it is a **core timing rule that breath happens to use**, not a breath rule.
Any future duration written in minutes has one place to convert.

The comment also records the second finding, because it is the kind of thing that gets
re-invented: **a Scene is not a unit of time.** The book defines it as "a continuous stretch of
play that focuses on one situation or problem", so it ends on a shift of focus and has no
duration. Nothing can outlast one, and any rule reaching for "longer than a scene" wants a
round count.

### One conversion, at the engine boundary

`engine.js` computes `holdRounds` once, per breath kind:

    var mins = fx.breathMinutes[k.key] || 0;
    var granted = mins * (((EN.rules || {}).time || {}).roundsPerMinute || 10);
    var holdRounds = Math.max(bodScore, granted);

**`Math.max` rather than replacement** is deliberate. Void Lung reads "you can hold your breath
for up to 15 minutes", which replaces the Body-score rule, and 150 beats any Body score the game
can produce, so the two readings never differ in play. Taking the larger means a grant can never
cost a character the natural hold their Body score already buys, which is the only way this could
go wrong later.

`clockStarts` is **deleted**, not repaired. It existed only to express "the clock never starts",
which was the false premise. The clock always starts; it starts late. `holding > 0` already
distinguishes holding from saving, so nothing replaced it.

### What a player actually sees now

Verified live on one character carrying BOTH grants, which is the sharpest fixture available
because it exercises the per-kind logic and the `max` in the same render. Odile Vantz, Body 10,
FreeBorn with Void Lung, wearing a bought Rebreather:

| row | hold | chip | note |
|---|---|---|---|
| Drowning | 600 rounds | `REBREATHER · 60 MIN` | "breath held 600 rounds (Rebreather)" |
| Vacuum | 150 rounds | `VOID LUNG · 15 MIN` | "breath held 150 rounds (Void Lung)" |

The Rebreather correctly beats Void Lung on Drowning and correctly does not touch Vacuum. A
character with neither still holds Body-score rounds and still reads the generic sentence, which
was re-checked rather than assumed.

**The tracker is live.** START then the round button gives "Vacuum round 1: still holding (149 of
150 left). Every round regardless of the save: 1d6 Cold." Before this, the button was disabled
and read HOLDING, for exactly the characters most likely to be in vacuum.

### Two more defects the fix exposed

- **The grant chip named the wrong source for everyone.** It was hardcoded to
  `"VOID LUNG · 15 MIN"`, so a Rebreather wearer with no lineage trait was told they had one, and
  a character with both saw VOID LUNG on the row the Rebreather was actually answering. It now
  reads `breathFrom` and `breathMinutes`. This was live the moment the Rebreather gained a breath
  grant earlier the same day.
- **The Active Condition Effects readout contradicted the row beneath it**, saying "breath held
  rounds equal to your Body score" directly above `HOLD 150 ROUNDS`. `breathNote(kind, hold)` now
  takes an optional hold, and `condEffects(ch, d)` threads the derived record through so the two
  breath conditions state this character's number. Called without it the sentence still states
  the base rule, which is what a surface describing the condition rather than the person wants.

**Worth recording how that second one was found: by looking at the screen.** Reading the code, the
condition table looked correctly generic, and leaving it alone was a defensible call written into
a comment. Rendered, it sat two lines above a number it contradicted. Nothing about the source
would have shown that.

### Verified

- Void Lung alone: 150 rounds on both kinds, from Void Lung.
- Rebreather alone on the Drowning kind: 600 rounds, and Vacuum untouched.
- Both together: the table above.
- Neither: Body score, generic sentence, unchanged.
- The tick button runs and the every-round Cold rider still reports.
- All seven tabs render, no console errors, no em or en dashes.
- The test character adopted for this was removed; the roster was empty before and is empty again.

## App Sync Handoff 2026-08-24, all eight sections implemented

Manuscripts re-pulled fresh before a word was transcribed: Part 1 460,768 bytes, Part 2 440,929,
Part 3 419,287. Hygiene verified and exactly as the handoff claimed, zero em dashes, zero en
dashes, zero curly apostrophes, zero non-breaking spaces in all three.

### 1. Overdrive Maneuvers: the collision is handled by a STAMP, not a date

The list went 8 to 10, *Cornered* became *I See Red*, and all ten were re-transcribed verbatim
into `class_codebreaker_fury.js`, in print order, with the book's own short action forms
("Swift", not "Swift Action"; `shortAction` accepts either and the composed prose now reads
"(Swift)" exactly as printed).

**The handoff asked for a dated split. A one-time stamp is strictly better, and the reason is
not that dates are missing.** `ch.meta.createdAt` and `ch.meta.updatedAt` both exist. The reason
is that **the app only ever offered the OLD list until this build shipped.** Every "Wrecking
Ball" sitting in a save at the moment the migration first runs was therefore written by the old
list, whatever its timestamps say. `updatedAt` in particular is rewritten on every save, so a
legacy character opened this morning already looks new; a date rule would mis-resolve exactly
the characters most likely to be in play. The stamp reads the one fact that settles it, which is
whether this pass has run for this character yet, and it leaves no ambiguous middle needing a
re-pick prompt.

Two further correctness points, both load-bearing:

- **Single pass, not in place.** Each stored name is mapped through the table exactly once into a
  NEW array. Rewriting in place would send Bring the House Down to Wrecking Ball and then on to
  Beyond the Bone, landing every structure-demolition pick on a melee strike. That is the very
  corruption the section exists to prevent, and it is reachable from a two-line implementation.
- **The table is read from the catalog**, `EN.classes.fury.resource.abilityRenames`, matching how
  weapon parts and cyberware already do it rather than restating names inside `store.js`.

**Verified live on a forged legacy save.** Given `["Wrecking Ball", "Bring the House Down",
"Redline", "On Me"]` with the stamp deleted and `updatedAt` set to now, the migration produced
`["Beyond the Bone", "Wrecking Ball", "Gimme Fuel", "Churning My Direction"]`. A second load left
it untouched, which is the test that matters: without the stamp the now-legitimate Wrecking Ball
would be re-mapped to Beyond the Bone on every subsequent load.

Cross-references repaired in the app: The Walking Anvil, Bullet-Storm Protocol and Relentless
Advance, plus all ten briefs. `Redline Lattice` (a #GRID deck mod) and `Cornered Prey` (an
Operator subclass feature) are false positives and were deliberately left alone.

### 2. Variable Costs, and the first ability that needs it

`EN.resourceRules.variableCosts` added in the book's own slot, between Spending and Refreshing.
Gimme Fire carries `costVariable`, and its chip now shows a real derived range rather than a flat
1: the smaller of Caliber and the pool, because a cap you cannot afford is not the limit. Gimme
Fuel carries `cost: 0` and correctly renders no resource chip at all.

**What is NOT built, and why.** There is no amount picker anywhere in the app; the cost gate at
`combat.js` parses a single integer out of the chip text and tests it against the pool. So there
is currently nothing for a Caliber clamp to clamp. The rule is carried and displayed and the
range is shown, but a player still spends by hand. Building the picker is a UI job of its own.

### 3. Long Rest Fatigue is gated, and the sleep clock resets

The app reduced Fatigue unconditionally, which quietly undid the Deprivation track: a starving
character shed a level every night while the hazard rules piled it back on. A single checkbox now
gates it, defaulted ON because shelter and rations are the ordinary case, and worded for Clankers
when the character is one.

The new sleep-clock bullet is implemented as a **split**: days and the escalating save count go
to zero, while Fatigue the track already handed out stays and comes off the ordinary way under
the gate. This deliberately does NOT reuse the hazard panel's clear helper, which zeroes fatigue
alongside days and would launder three sleepless nights into nothing.

Verified live: unprovisioned, Fatigue held at 2 and the sleep clock went 3 days to 0 with its
1 Fatigue preserved, while the food clock was untouched. Provisioned, Fatigue dropped to 1.

### 4. Four conditions, 42 to 46

Blinded, Deafened, Silenced and Suffocating transcribed verbatim into their alphabetical slots.
The mechanical halves the accumulator can carry are wired (Blinded: Snag on attacks, Snag on
sight checks, Edge to attackers; Deafened: Snag on Wits); the rest stays prose, which is where
the app has always drawn that line.

Two traps the handoff flagged, both respected: **the two saves are different rolls** (a Flow Save
to avoid Blinded, Body DC 12 at the end of your turn to escape it) and are not collapsed; and
**Silenced is deliberately harsher than the Critical Wound Table's Vocal Cords result**, so the
two were not normalised toward each other.

### 5 to 8

- **Effects and Objects** added, and `destructibleCover` re-transcribed: it was stale four ways,
  still calling the rule "(Optional Rule)" and measuring a section in metres rather than spaces.
  **Both it and the Cover Material Table were dead data**, carried in `EN.combat` but rendered
  nowhere. The Codex now renders Destructible Cover, the table, Effects and Objects, Overflow
  Damage and Vehicles as Cover, in print order.
- **Structural Melt** rewritten to comply; its bespoke -2 Defense penalty is gone.
- **Vehicles as cover** carried as reference prose. The app models no cover Integrity for
  anything, so there is nothing live to wire; recorded as deliberately unimplemented.
- **Trauma Rig Load is now DERIVED.** The hard-coded `case "rigs": return worn ? 1 : 2` is gone.
  `itemLoad` splits into `baseItemLoad` plus a wrapper applying the Worn Gear Trait's own
  reduction, so all seven Worn-trait items get it rather than the one bucket that used to
  hard-code it. Verified: all six Rig tiers 2 carried / 1 worn and no tier variance, Claws and
  the five Warding Foci 1 to 0, armor unchanged at 1 whether worn or packed, and the nine
  "Type: Worn Gear" items unaffected.
- **base Speed swept** from 10 app sites; **Adrenaline Overclock** renamed to Adrenal Overclock;
  the Conditions chapter's 33 "cannot" swept to "can't" with Suffocating's rules formula kept.

### Two errors in the handoff, both verified against fresh text

1. **"The Walking Anvil and Bullet-Storm Protocol were rewritten and no longer name Maneuvers at
   all."** They both still name Maneuvers, correctly updated: Walking Anvil reads "the Beyond the
   Bone or Warhead Overdrive maneuver" and Bullet-Storm reads "(like Beyond the Bone or
   Warhead)". Had this been taken at face value the app would have stripped two live references.
2. **The Long Rest bullet count.** Nine, not eight.

### Manuscript defects found, for the author

- **Blinded's heading is a bold paragraph `**Blinded**`, not `### **Blinded**`** like all 44
  other conditions. A structural outlier that will break any heading-driven extraction.
- **The Hardwired row of the Conditions Quick Reference Table has its Duration and Save to End
  cells swapped** relative to every other row (Duration "-", Save to End "Persistent").
- **The two Severe Fatigue sites disagree**, and neither is a typo: Recovery says "professional
  care or ritual support", the Fatigue condition says "medical, mystical, or technological
  treatment". The app quotes the condition wording, so it matches one site and not the other.

### Open, and needing the author

- ~~**The Shaper.**~~ **RULED 2026-08-24: the Caliber cap does NOT reach Flow Points.** FP is
  not a class resource in the sense the Variable Costs rule means, so neither the cap nor the
  rule applies to the Flow. Invocation Scaling ("Each +1 FP spent increases one dimension by 1
  space") is therefore a variable spend that is deliberately uncapped, not an oversight.

  **No code change was needed and none was made**, which was checked rather than assumed: the
  Flow files reference Caliber nowhere, `variableCosts` is data read by nothing, and
  `costVariable` exists on exactly one Fury Maneuver and is read only by the class-resource
  expansion the Shaper is already excluded from. The ruling is recorded as a comment on the rule
  itself in `class_stitcher_resources.js`, because from the outside the omission reads like a gap
  and invites exactly the wrong fix.
- **Whether an interrupted Long Rest resets the sleep clock.** Ruled already for benefits (no
  partial credit), but the clock bullet is not obviously a "benefit".
## The app caught up to the closed manuscript pass, 2026-08-25

All three Parts re-exported after the author's pass and every claim in the closing note checked
against them. Part 1 460,762 bytes, Part 2 440,961, Part 3 419,305. The pull went through the
Drive connector rather than a browser download, so no save dialog was involved.

**Everything the note said reaches the app was real, and two of the four needed no work.**

### Applied

- **Both Medkits are Load 1.** The Load 1 row now names a generic `medkit` where it used to say
  `compact medkit`, and the book prices no item individually, so the generic word governs both.
  They were taking the `kits` bucket default of 2. Fixed with an explicit `load: 1` on each,
  matching the eleven sibling kits that already pin their own. **The bucket default stays 2**,
  because the Load 2 row still reads "full toolkit" and that is the right default for the bucket.
- **The Grounding Lattice stopped being guessed at.** It carried `price: 0, nexus: "◎1"`, so
  `listPrice` fell into the Nexus branch and multiplied by the ledger rate, pricing it at
  𝒢10,000 with 𝒢5,000 of materials. The book now prints 𝒢2,400. Set, and the Mystech mods column
  in the app now reads 700, 800, 1,200, 2,400 straight down exactly as the book does.
- **`base walking Speed` and `normal Speed` are gone from the app**, matching the book driving
  both to zero. Two sites: Prey Stalker's Grip in `species.js` and the Parkour Runner upgrade in
  `talents.js`.
- **Three British spellings corrected** to match the book, which is 39 to 0 for `-ize`. The app
  was already 24 to 3, so these were outliers rather than a house style.

### Not needed

- **Continuous.** Already complete. `gear_traits.js` carries the trait with all three of the
  book's bullets, and all three weapons the book gives it (Rip-Saw, Cryo Lance, Flamethrower)
  already have it. They live in `gear_signature.js`, not the ranged and melee catalogs, which is
  why a first grep for them came back empty and briefly looked like a gap.
- **The Fatigue track.** `conditions.js` already had the full severity list, the cumulative note,
  and `Severe Fatigue (4 to 6): Requires medical, mystical, or technological treatment`. The
  longRest cutoff at level 4 already matched. Only the banner below was wrong.

### The bug this turned up, which the pass did not ask for

The severe-condition banner read **"Severe; level 4+ needs professional care or ritual support
to recover."** Both halves were retired by this pass, so it needed the new wording anyway. But
the banner renders for **any** leveled condition, and the two do not agree: Fatigue turns severe
at 4 of 6, **Strain turns severe at 5 of 5**, which is Collapse. So a Strain 5 character was told
they were at "level 4+" and pointed at a treatment that has nothing to do with Strain.

Fixed by moving the sentence onto each track as `severeNote` rather than hardcoding one set of
numbers in the renderer. Fatigue states the book's line; **Strain deliberately has none, so the
banner renders nothing rather than inventing a recovery route the book does not print.**

Also added the Fatigue reduction to the Long Rest confirmation blurb, which listed every other
benefit but not the one the provisioned checkbox actually gates.

### Verified live

Both Medkits 1 and other kits still 2. Grounding Lattice `listPrice` 2,400, down from 10,000,
while Reliquary Shell and Martyr's Halo still convert at the ledger rate, which is correct since
the book keeps them Nexus-only on purpose. Fatigue 5 shows the book's sentence; Strain 5 shows
none. All seven tabs render, no console errors, no em or en dashes.

### Three things the manuscript pass missed, for the author

Each was found by checking the closing note's own claims rather than taking them.

- **"Reliquary Shell and Martyr's Halo are now the only Nexus-only prices in the book" is not
  true.** The Hypercare Contract Tiers table still prices Blackglass Priority at ◎1.2 a month and
  Corporate Platinum at ◎2.5+ a month with no Glimmer figure, while Tiers 1 and 2 on the same
  table are 𝒢300 and 𝒢600. Nothing in the app models those tiers, so no app defect follows, but
  the statement is wrong as written.
- **There is a sixth climb grant, and it was not normalised.** Vertical Infiltration on the Nixie
  Skyhook familiar still reads "a climbing speed equal to their walking speed", lower case and
  "climbing" rather than "climb". The five that were swept are three distinct features, since
  Prey Stalker's Grip and Highground Hunger are each printed twice. **The app matches the book
  here and was deliberately left alone**: correcting the app would desync it from the manuscript,
  so the book wants fixing first.
- **The "How to Choose a Mode" table still walks only four firing modes**, never mentioning
  Continuous, even though the section directly above it now defines it as the fifth. The app has
  no copy of that table, so nothing to change on this side.

Two smaller notes, neither an app matter. **Nothing states 6 as the ceiling of the Fatigue
track**; it is implicit in the table ending there, with no prose capping it. And the **Treat
Fatigue table bands Fatigue as 1-3 Mild, 4-5 Severe, 6 Helpless**, splitting 6 out of the "4 to
6" Severe band the condition entry defines.
## Worldbuilding sync, 2026-08-30: what was buildable, and what is not in the book yet

All three Parts re-exported and every locked item checked against them. The handoff's own rule
that the manuscript outranks it did most of the deciding here.

### Applied

- **#MINT, and it was five sites, not two.** The handoff named the two I had found. A
  case-insensitive sweep found three more, all player-visible and all shouting the dead name in
  capitals: the PDF footer stamped on every exported page, the print-sheet footer, and the login
  gate kicker. My own first sweep missed them because I grepped `Luster` case-sensitively and
  the three live copies are `LUSTER`. Renaming only the two would have left the retired issuer on
  every printed character sheet.

  **"The Mint" was deliberately not used.** The manuscript gives the full name and the ticker and
  nothing else; there is no street-slang gloss anywhere in the three Parts, so putting one in UI
  chrome would be inventing canon. Checked `#` is U+0023 and inside the range `isWinAnsiChar`
  admits, so it survives `sanitizeText` and draws in the PDF, before using it there.

- **Both kit descriptions** re-transcribed with their new clauses.

- **Two copy-rule fixes that carry no desync risk.** The Timber Fortitude brief said "chemically
  or magically compelled" where the book says "chemically compelled or compelled by the Flow", so
  the app was simply misquoting. And a Versatile pairing was named "Blood Magic Display" in
  app-original copy absent from the manuscript; it is now "Blood Rite Display", which sits with
  its siblings Ritual Exhibition, Somatic Weaving and Technomancy Display.

- **Levels never go down.** The guard is in `setLevel` rather than on the button, so any future
  caller inherits it. A decrease is still reachable, because a mis-set level during creation is
  real and trapping someone at a number they typed by accident is worse than the rule is worth.
  It is now a correction rather than a progression: the button arms first and names the cost.
  That warning is not decoration. Lowering the level **permanently deletes** every Universal
  Upgrade above it, prunes talent attribute picks, and clears the Level 4 Awakening Evolution,
  and stepping back up does not restore any of it. The old button did all of that on one click
  with no warning.

  Caliber itself needed no guard: it is never stored, only derived from level, so level is the
  one place the rule can be enforced.

### Not built, and why

**None of the Caliber registry lore is in the manuscript.** This is the finding that matters
most, and it was checked hard rather than assumed. Across all three Parts: `Incursion` 0 hits,
`assay` 0, `X-Calibur` 0, `reported Caliber` 0. All 213 Caliber references are mechanical, a
scaling bonus or a pool term or a save-DC term. As exported today, Caliber has no diegetic
existence at all.

So the two-value Caliber model was **not** built, despite the handoff's closing paragraph saying
to build it now. Three reasons, in order of weight. The handoff's own source-of-truth rule puts
the manuscript first. Section 2 marks the data model **PROPOSED, for the app's judgment**, which
contradicts the closing paragraph's "build now", and the more specific statement should win.
And a `reportedCaliber` on the #PRINT would show players a number no rulebook text explains,
which is the failure mode this project has spent two rounds correcting in the other direction.

The plumbing is a small job the moment the lore lands. Nothing else blocks it.

Also not built: the registry panel, stamp status and jobs-since-assay counter (PROPOSED),
anything using the four Incursion classification labels (DIRECTED but explicitly working labels,
not to be hardcoded), and everything in the OPEN list.

**The About-screen copy has no home.** The app has no About or product-description surface at
all, so the approved short pitch has nowhere to go. Worth building one, but not unasked.

**XP was already right.** `useXp` defaults false so milestone is the assumed default, and nothing
reads `ch.xp` to change level, so XP cannot back-door an advancement. The book does print an
optional XP method with per-enemy awards, so the app carrying an opt-in XP mode matches it.

### For the author

- **The "magic" sweep started and stalled.** Part 1's front matter was fixed (the old "streetlights
  hum with old magic. The network has ghosts in it." is gone, replaced by the approved #GRID line)
  but four class and talent strings still say it: the Sourcerer blurb twice, the Shaper subclass
  description, and the Tactics and Hybrid Fighting category intro. **The app matches the book on
  all four and was deliberately left alone**, because fixing the app would put it ahead of the
  manuscript. Fix those four and I will re-transcribe in one pass.
- **The book still says the #GRID has ghosts**, and defines Haunted Property against the #GRID by
  name. If the retired phrasing is meant to go everywhere, those are the sites. The app's
  "Flow-Touched and Haunted Goods" market category is the book's own heading and was left alone.
- **Part 2 states the copy rule internally**, in GM Guidance: describe the Flow not as magic but
  as a physical sensation. The four surviving sites contradict a rule the book itself prints.
## GM Toolkit stage 1, built 2026-08-31: the tab, the tracker, the threat builder

Part 4 arrived and asked for seven subsystems. Staged on the author's call, tracker first. Four new
files, 1,007 lines, and one pre-existing defect fixed on the way in because the new work could not
be built correctly on top of it.

### The defect that had to go first: initiative had no owner

**Three surfaces showed an Initiative number and all three computed it differently.** The
Freelancer tab summed four parts inline; the print sheet and the PDF each summed a shorter list,
dropping the lineage grant, the chrome bonus and the condition delta. **A Freelancer with a
Blackware Reflex Booster read +6 on screen and +2 on their own printed sheet.**

`eng.initiative(d, condInit)` is now THE resolver and all three read it. The condition delta is
passed IN rather than read, because the condition effect is assembled in combat.js and not the
engine; that is also why a printed sheet correctly passes 0, since a sheet is a snapshot of the
character and Drowsy's -2 belongs to the moment. Verified: all three now read +6 for that
character, where two of them read +2 before.

Deliberately NOT a field on the derived record. A stored value would have to pick one condition
state and the callers want different ones.

### Where GM state lives, and what it must never share

`EN.gmStore`, its own module, its own keys. **Not inside `EN.store`**, and the reason is worth
keeping: store.js wraps the whole roster parse in one try and discards EVERY character on
unreadable JSON. A corrupt encounter blob sharing that failure domain would cost a player their
entire roster. Separate key, separate parse, separate catch.

Two keys on purpose. `en_gm_mode_v1` holds the toggle alone so it can be read without parsing the
document and so a corrupt document can never strand a GM outside their own tools; `en_gm_v1` holds
the state.

The standing invariants, applied before they could be violated:

- **Ids, never names.** Three Minions are three entries with three ids and three independent
  Vitality numbers, which is exactly why the order is an array and not a map keyed on threat name.
- **`kind` is STATED, never inferred from shape.** An entry that has lost its discriminant is
  unattributable and is dropped, not guessed at.
- **Null-prototype at every creation site including the fallbacks**, with `hasOwnProperty` on every
  read. A GM will name a threat `__proto__` eventually. Tested: saving one leaves the prototype
  intact.
- **Unattributable state is dropped, not moved.** A crew entry whose character was deleted is
  dropped and named in the console, never converted into a threat row carrying the dead
  character's name and numbers.
- **A crew entry holds only a pointer**, `charId` plus initiative. No cached name, no cached
  health. The player's own sheet stays the one writer for a character's numbers.

**Ordering is not optional**: the crew prune runs after `store.load()`, because it needs the roster
to tell a live `charId` from a dead one. Run it first and every crew entry looks unattributable,
gets dropped, and the next persist writes that emptiness back over a good encounter. It also runs
from the view's render, because `store.remove` does not notify us and a ghost row should not
survive until reload.

### The generator

`EN.gmEngine.buildThreat` is the one resolver, kept out of engine.js because that file is 3,700
lines about deriving a CHARACTER and a threat shares no field with one.

**The order of operations is load bearing and the steps do not commute.** Two traps, both
commented at the site:

1. **Minion Vitality is a REPLACEMENT, not a multiplier.** A G3 Minion is 15 off its own table, not
   60 percent of the array's 50, and the Role percentage then applies to the 15. Multiply instead
   and every Minion is wrong by a different amount at every Gauge.
2. **Deadshot's +50 percent lands on one attack**, not the round's damage budget. Applied globally
   it inflates a Solo's three attacks into something the book never priced.

A saved threat stores the **resolved block** with its inputs beside it, never inputs alone.
Re-deriving on read would let a later correction to `threats.js` silently change a statblock a GM
already used at the table. This is the deliberate inverse of the example-character ruling, where
inheriting future defaults is the point.

**Verified against the book at every Gauge**, and against three real bestiary entries the generator
had never seen: Corpsec Officer (G2 Standard Gunhand) reproduces Defense 13, Vitality 30, XP 150;
Warform Chassis (G4 Elite Bruiser) gives 175; The Smiling Man (G4 Solo Ghost) gives 210. All exact.

### The tracker

Order is **derived, never persisted**: entries keep insertion order and the view asks the resolver,
because a stored sorted copy would be a second writer for one fact. `activeId` is an entry id and
never an index, since editing an initiative re-sorts and an index would then point at a different
creature mid-round.

The final tie-break is the entry id, **not a random draw**. Every keystroke here calls
`EN.app.render()` and `armButton` re-renders just to arm, so a random tie-break would reshuffle the
rail while the GM was reading it. A tie that survives both of the book's tie-breaks is surfaced as
a roll-off rather than silently broken, which is what the book does with it.

**A condition on a threat is a reminder, not an effect.** Threats are deliberately not run through
combat.js's `fx` resolver, whose entire job is mutating a derived CHARACTER record. A threat has no
derived record to mutate: it has one Vitality number. This is the line that keeps 5,400 lines of
combat.js from needing a second, threat-shaped caller, and stage 1 touches that file exactly once.

**Examples are excluded from the crew picker.** `setExample` gives an `ex_` id that never enters
`roster()`, so an entry pointing at one would be pruned as unattributable on every single reload.

### A latent bug the gate made reachable

`app.js` looked its tab up with `TABS.find(...)` and then read `tab.view` with no guard, so any
unknown `activeTab` threw and blanked the page with the rail still painted. Unreachable until a tab
could disappear. Now the lookup resolves through the visible list and falls back, writing
`activeTab` back so the rail agrees. Verified by turning GM mode off while standing on the GM tab.

### Verified live

GM mode off by default and the tab absent. On, and all nine tabs render. The array reproduced at
every Gauge and Designation. A full round advanced past the wrap, round 1 to 2, cursor back to the
top. A threat damaged to zero shows as out of the fight and stays listed. A character deleted while
in the order is dropped, the active cursor stays valid, and the rest survives a reload. A threat
named `__proto__` saves without polluting anything. No console errors, no em or en dashes.

### For the author

Part 4 has not been through the house style pass. **One curly apostrophe**, line 15, "What You'll
Find Here". **277 markdown backslash escapes**, a Docs export artifact that must be stripped before
any transcription; every signed bonus in the document is written `\\+5`.

**Six bestiary entries do not reproduce their own generator**, against the chapter's stated claim
that every entry is a legal build: Gutter Hacker and Cult Cantor Vitality (both Controllers, which
carries no Vitality adjustment), Sentry Turret Vitality and Defense, Combat Drone and Gremlin
Defense, and Wiredog Speed 8 where Skirmisher specifies 7. Worth a look before stage 2 transcribes
the bestiary, since the app will otherwise have to carry six exceptions.

Also: the fresh Drive pull of Part 4 is **byte-identical** to the local export, so the newer
modified time was a touch and not an edit. And Part 4 is a fourth manuscript source that is not yet
in HANDOFF.md's three-doc table; it should be added before anyone audits `threats.js` against it.

### Corrected same day: the saves line said a word where the book names attributes

The first build rendered Saves as "+7 strong, +2 others". Brandon caught it on the card:
**strong is not an attribute**, and the line meant nothing at the table.

The book prints the strong half as one or two REAL attributes and varies them per threat:
"+4 Body, +1 others" on a Street Ganger, "+5 Body and Wits" on a Corpsec Officer, "+7 Agility
and Wits" on a Wetwork Operative, "+5 Mystique and Body" on a Street Shaper. Which attributes is
an authoring choice the chapter never derives, so the builder now takes two pickers and the
resolver formats the real line. The Role only supplies a starting point, and that default is
labelled in the data as an app suggestion read off the printed bestiary rather than a rule,
because a default that looks like canon is worse than no default.

**Checking the fix turned up a seventh bestiary deviation.** Every saves line in the bestiary was
compared against the Standard Threat Array: 29 of 30 sit exactly on it, and only the **Wetwork
Operative** does not, printing +7 at G3 where the array says +6. It is not an Elite bonus: the
other two G4 Elites, the X-Calibur Knight and the Warform Chassis, both sit on the array. So it
joins the six already recorded above as an entry that does not reproduce its own generator.

### Left for stage 2 and beyond

The bestiary (31 statblocks plus 3 variants, including two #GRID entries that carry Node math
instead of Defense and Vitality, so the statblock renderer was written tolerant of a missing
physical block). Encounter budgeting, whose tables are already carried in `threats.js` so stage 3
adds no second data file. Hazards and set pieces. The job board. Paying the crew, which should lift
`splitPayout` out of inventory.js rather than write a second splitter.
## GM Toolkit stage 2, 2026-08-31: the bestiary, all 31 entries

`app/data/bestiary.js`, 457 lines, plus a browsable panel on the GM tab with category
chips, a search that crosses categories, and one click to put any entry into the order.

### Transcribed by parser, and proved rather than asserted

The 31 statblocks are one blockquote line each with a grammar the export makes legible: a STAT
is `**Label** value` and an ability or note is `**Label:**` or `**Label (Cost):**`. The colon
inside the bold is the whole discriminator and it holds for every entry.

Nothing was allowed to vanish quietly. The parser collects any bold label it does not recognise
and reports it, which surfaced three real fields on the first run (`Immune` and `Resistance` on
the Cascade Orphan, and the four Solos' `Unshakable, Defensive Impulses` block, which runs to the
end of its clause rather than stopping at a pipe). After handling those: no unrecognised labels.

Then two independent recovery checks: every WORD and every NUMBER of every source line must
survive into the record. **All 31 entries recover every number**, and 27 recover every word, with
the four exceptions being the key name `gmNote` losing the space in "GM note". The GM notes
themselves are intact on all four.

**The first run of that checker said 0 of 31 and was wrong.** It flattened records without their
dict KEYS, so every field label read as a lost word. A checker that is wrong about the thing it
checks is worse than no checker, and it took a second look to notice the failure was in the tool.

### The book's numbers are the numbers

Where an entry does not reproduce what the generator would build for it, **the page wins** and the
card says so. The app does not get to quietly correct the manuscript.

That comparison is computed at render time by asking the real `EN.gmEngine.buildThreat`. The first
attempt baked a verdict into the data file from a Python re-implementation of the generator, which
is the second-writer problem this project keeps paying for, and the copy was already wrong: Python
rounds 62.5 down where JS and the book round it up, so it invented two deviations (Null Hound and
Warstock Feral) that do not exist.

### What the field set actually is

- **29 of 31 carry the physical block.** The two #GRID threats do not, and the renderer was built
  tolerant of that rather than printing a row of blanks: Feral Script carries Security Rating,
  Cipher Save, System Integrity and a Firewall Damage Threshold, and the #GRID Guardian carries a
  third shape again (Cipher Attack, Cipher Save DC, and a Persona Node).
- **Resolve is on 11 entries, not 13** as an earlier pass reported. Checked against the source
  directly: the manuscript has 11. Its absence is meaningful, so it is left out rather than blanked.
- 12 leave `gear`, 15 leave `salvage`, 5 cryptids carry `signs`, 4 have a `gmNote`, 3 a `variant`,
  4 a named skill line, and the 4 Solos an economy block. 122 abilities in total.

### Corrected on sight: the deviation note did not belong in the tool

The first build printed the mismatch on each affected card, in warning amber, on eleven of the
thirty-one entries. Brandon asked what good it was serving and the honest answer is none: it was
QA output about the manuscript sitting in a working tool, unactionable by its own last three
words ("The page stands"), coloured to pull the eye, and wedged between a threat's abilities and
the button that puts it into the fight.

It is gone from the card. The finding is real and is recorded below, which is where a note to the
author belongs. **The card shows the book's numbers and nothing else.**

The general lesson, since this is the second time in two stages: a check I ran to convince myself
the work is right is not thereby content. Stage 1 shipped a placeholder word in a Saves line;
stage 2 shipped an audit trail in a statblock. Both were me leaving my own working notes in a
surface somebody else has to read.

### For the author: 14 of 31 entries do not reproduce their own generator

Up from the seven already recorded, because this pass checked Vitality, Defense and saves across
every entry rather than spot-checking. Grouped, because the count alone is not useful:

**A pattern worth ruling on.** Two of the three Controllers were built as though the Role carried
a 25 percent Vitality reduction, and the arithmetic lands exactly: Gutter Hacker 30 x 0.75 = 22.5
printed as 22, Cult Cantor 50 x 0.75 = 37.5 printed as 38. **The Roles table gives Controller only
"-25 percent damage, Save DC +1" and no Vitality adjustment.** Either the table is missing a line
or those two entries are. The third Controller, Reclamation Bloom, follows neither reading at 55.

**Five entries sit exactly +1 on Defense** (Riot Trooper, Spotter Drone, Combat Drone, Puppeted
Body, Gremlin) and two sit -1 (Sentry Turret, Reclamation Bloom). Possibly another unlisted
adjustment, possibly authoring drift.

**Two entries carry no Role at all** in their identity line (Echo, Lantern Shoal), so the generator
cannot build them and the comparison is not really fair to them. Worth adding a Role, or worth
saying that a Role is optional.

**One is a rounding tie**: Wiredog at 22 where 30 x 0.75 = 22.5 rounds up to 23. Note the book
resolves the identical tie the other way elsewhere (Null Hound rounds 62.5 up to 63), so the
manuscript is not consistent about halves. Not worth a rule, worth knowing.

**The remainder are one-offs**: Sentry Turret +7 Vitality, Puppeted Body -8, Combat Drone -5,
Vatspill Husk -2, and the Wetwork Operative's +1 strong save recorded in stage 1.
## The Kettle Dog, added 2026-08-31

A 32nd bestiary entry, author-written, filed under Machines and Proxies.

**It is not in the Part 4 Doc yet, and that is the one thing to remember about it.**
`bestiary.js` is generated from the manuscript and its own header says not to hand-edit it, so
pasting the entry straight into the data file would have put it one transcription run from
deletion. Instead it lives in `scratchpad/lin/p4-additions.md` and the parser reads that file
alongside the manuscript, which keeps the pipeline reproducible and keeps the divergence
visible. **Delete it from that file the moment it lands in Part 4, or the next run carries the
dog twice.**

Ran through the same pipeline as the other 31 and proved the same way: no unrecognised labels,
and every word and number of the source line recovered into the record. It parsed to 7 abilities,
a salvage line, a variant and a GM note, with no field the parser had not seen before.

**It is the cleanest entry in the bestiary.** Fourteen of the original 31 fail to reproduce their
own generator; this one reproduces it exactly on every axis that the generator owns:

| | printed | a fresh G3 Elite Skirmisher |
|---|---|---|
| Vitality | 75 | 50 base, Elite x2, Skirmisher -25% = 75 |
| Defense | 16 | 14 base, Elite +1, Skirmisher +1 = 16 |
| Saves | +6 / +2 | the G3 array row |
| XP | 500 | the Elite column at G3 |

The Estate Unit variant is equally clean: 105 Vitality, Defense 17, attacks +9, 700 XP all land
on the G4 Elite build.

**The one departure is Speed 10 where the Skirmisher Role specifies 7**, and it is plainly
deliberate rather than drift: the whole design is built on it. Scald Sprint moves 20 spaces,
Built for the Straightaway counts the dog as Fast or Very Fast in a chase, and the thermal
penalty exists to price the speed. Recorded so a later audit does not "correct" it.

Hygiene clean: no em dashes, en dashes, curly apostrophes, curly quotes or non-breaking spaces.

### Its GM note became three named job hooks

The author replaced the single paragraph with a titled list: The Recall, The Old Friend, The
Whistling Watch. That is a new block shape for the bestiary, and it needed three things.

**The parser had to learn that a blockquote is not always an entry.** The hooks header is
`> **This product can generate three jobs hooks:**`, which is a blockquote containing bold, so
the old rule parsed it as a 33rd creature named after that whole sentence. The test that actually
separates them is the ITALIC IDENTITY LINE: a statblock has one, a note about a statblock does
not. Entries and their trailing blocks are now told apart that way, in the manuscript loop as
well as the additions loop, so Part 4 can grow one of these without breaking the transcription.

**The verifier had to widen too.** It compared one source LINE per entry, and an entry that now
spans a statblock plus a hooks block would have had its hooks silently exempted from the recovery
check. It reads the whole span now. With that fixed, every word and number of the Kettle Dog
recovers, and the numbers still recover across all 32.

**Hooks are stored structured, not flattened.** `{title, items: [{name, text}]}` rather than one
paragraph, because each hook has a name and is its own idea, and a GM skimming for tonight's job
wants to find the one they want instead of reading a block to the end.

**A rendering bug this caught:** the hook prose cross-references an ability in bold
(`**Remembers** is permanent`), and the card printed the asterisks raw, because it built the text
with a plain text node. `EN.ui.applyInline` is the existing reader for that markup and is now used
for hook and ability bodies alike. It was the only inline bold in the whole data file, so nothing
else was affected, but the same trap was waiting in every ability body.

**One thing for the author, transcribed as written rather than corrected:** the header says
"three jobs hooks". Left verbatim because editing the author's prose is not the app's job, and
flagged so it can be fixed in one word.

### Bestiary, stage 3: the Nixie, and a Gremlin revision (2026-08-30)

**The Gremlin was a revision, not an addition.** Its numbers, its identity line and all three of
its abilities are byte-identical to the entry printed at Part 4 line 382. Two things changed: the
GM note is rewritten, and a missing pipe between `Speed 7 (...)` and `Initiative` is restored. The
old note read "A Nixie uses this block", which is to say the Nixie existed only as a sentence
inside another creature's note. It has its own statblock now and the Gremlin's note points at it.

**So the additions file can now REPLACE, not only append.** An entry whose name matches one
already in Part 4 takes that entry's place, in its own position and category, instead of standing
beside it. Without that, a revision to a printed creature would have shown the creature twice with
two different texts. Name is the identity because the Doc has no ids, which means a rename reads
as a new entry: the safe direction, since it surfaces as pending rather than quietly overwriting
something else.

**The parser reads a second shape.** Part 4 writes a statblock as one blockquote line, but these
arrived as `#### **Name**` with a paragraph per field, and that pastes into the Doc as legal
markdown. A parser that only knew blockquotes would have walked straight past a real entry and
reported nothing missing. Joining the paragraphs reproduces the blockquote form exactly, so both
shapes still converge on one grammar. The verifier reads the wider span to match.

**The banner counts are computed now.** The data file's header comment hand-counted "31
statblocks" and "Resolve is on 11 entries"; the first addition made it a comment that misdescribes
the file it sits on. Every count in it is derived, including a standing list of which entries are
ahead of the book.

## For the author

- **The Nixie is filed under The #GRID Side**, beside the Gremlin, because that is where Part 4
  already keeps the Gremlin and the two are written as a pair. Both are Flow-Sprites, so if that
  filing is wrong it is wrong for both of them together. One line to move.
- **The Nixie joins the +1 Defense group.** Seven entries now print one Defense above what the
  generator builds: Riot Trooper, Spotter Drone, Combat Drone, Puppeted Body, Gremlin, Nixie, Echo.
  At seven of thirty-three this reads less like seven slips and more like an unlisted adjustment.
- **The Nixie is a third sighting of the -25% Vitality pattern.** It prints 15 where the array
  gives 20, exactly three quarters, matching Vatspill Husk exactly and Gutter Hacker and Cult
  Cantor closely. The Nixie has no Role at all, so whatever produces that reduction is not the
  Controller Role, which is what the earlier note assumed.
- **Still pending in the Doc:** paste the Kettle Dog and the Nixie in, and replace the Gremlin.
  Until then the app is ahead of the book, and the parser says so on every run.

### A defect the Nixie exposed in the tracker

**Initiative was being reported as the attack bonus** for every bestiary creature added to the
initiative order: wrong on 26 of the 33 entries. Street Ganger showed "+2 to hit" where the book
prints +5. It survived because the two numbers are coincidentally equal on the Gremlin, which is
what it was eyeballed against, and because no creature that has no attack at all had ever been
added until the Nixie arrived and printed a number it does not have. The row now reads the book's
own "+6 vs Defense" phrasing, and a Save DC is shown only when the entry prints exactly one, since
the Warform Chassis forces two and naming either as "the" DC would be a wrong number with nothing
to give it away. Absent fields print nothing rather than "DC null", the same rule the data file
already follows for Resolve. No migration was needed: `app/data/bestiary.js` has never been
committed, so no saved encounter can contain a bestiary-added threat.

## Two desktops on one OS, 2026-09-02

The GM Toolkit had been a ninth tab on the player's own rail, hidden behind a settings toggle,
and it was three tools deep in one unbroken scroll roughly 5,000px tall by the time the bestiary
landed. Four more stages are still coming (encounters, hazards and set pieces, the job board,
paying the crew), and every one would have made that scroll worse. The fix was not to reorganise
the GM tab, it was to stop pretending the GM is a player with an extra tab.

**After the access gate, a splash now asks which side of the table you are on.** It routes to one
of two desktops that share the OS and nothing else: the Freelancer portal (the seven player tabs,
unchanged) and the Admin portal (the GM toolkit, finally on its own seven-tab rail: Table,
Threats, Bestiary, plus four stubs for Encounters, Hazards, Job Board and Payroll naming what
each will carry). The GM tab is gone from the player's rail entirely.

The choice is remembered (`en_portal_v1`), so the splash is a first-run screen, not a toll booth.
A dismissible note points at the settings cog right after a splash pick, saying the choice is
remembered and where to swap it, and fires only on that path, never on a silent resume or a tray
flip. The settings tray's WORKSPACE section is the only route between desktops now: a two-button
flip plus a "RETURN TO PORTAL" that reopens the splash on demand.

Admin has its own theme, chosen from the same nine palettes, stored under its own device key
(`en_admin_theme_v1`) and never on a character record, so whoever is loaded on the player side
never repaints the table. Default is Elysium Nights (gold), so the two sides differ out of the
box. `en_gm_mode_v1`, the old GM-tab toggle, retired: both desktops are always offered now, so the
flag decided nothing, and `gmStore.load()` removes it once on the way past.

### Two bugs live verification caught, neither visible from reading the code

**`gate.js`'s `?dev` bypass always force-jumped to the print tab, 0ms after unlock.** That was
harmless when print was the only destination; it stopped being harmless the moment `gotoTab`
became portal-aware, because `?dev&portal=admin` would land on Admin and then get yanked straight
back to Freelancer a tick later. Fixed with one guard: the jump only fires when the resolved
portal is not Admin, which is knowable by then because `onUnlock()` runs the whole splash chain
synchronously.

**`inAdmin()` was defined inside `EN.theme`'s closure and called from `EN.settings`'s.** Two
separate IIFEs in the same file do not share scope just because they share a file, and the
`themeSection()` call site threw a `ReferenceError` the moment settings opened, leaving the tray
body blank with no visible error unless the console was open. Fixed by exporting `inAdmin` from
`EN.theme`'s return object and calling `EN.theme.inAdmin()` from the settings side.

A third gap, caught before it shipped rather than after: the splash offered an Admin card even
when the GM modules were deleted, so a "desktop" with no tabs behind it was one click away.
`paint()` now checks `EN.app.hasAdmin()` and draws one centered card, not two, when Admin is not
installed.

### For the author

- **The `SHEET` button on a crew row became `SET ACTIVE`.** It used to jump you to that
  Freelancer's own sheet, which would have pulled the GM off the Admin desktop mid-fight under
  the new split. It now sets the active character and stays put, with a toast saying so.

## The Kettle Dog, the Nixie, and the Gremlin revision land in the real manuscript, 2026-09-02

The author confirmed Part 4 was already synced, so this was a re-pull-and-verify pass rather
than a transcription: pull the Doc fresh, prove the three staged entries actually landed with
nothing lost, then retire their now-redundant copies from `p4-additions.md` per that file's own
rule. `bestiary.js` regenerated at 33 entries, 0 pending, 0 revised, banner's "AHEAD OF THE BOOK"
paragraph correctly gone.

Getting there took three real parser fixes, none of them visible from reading the old code, all
of them found by diffing against the last known-good 33-name list rather than trusting a clean
first-pass report.

**The Doc's export dropped `#### ` off four entries' headings**, leaving a bare `**Name**` line
that the parser had never been asked to recognise. Combat Drone, Puppeted Body, Sentry Turret and
Spotter Drone vanished from the parse with no error, because nothing looked for them. The fix
broadens the manuscript loop's trigger to also catch a bold-only line, gated on `is_entry()` so it
still cannot mistake other prose for a statblock.

**That same broadening then swallowed two of the four whole.** A hooks title and the next entry's
bare name are the identical shape: one bold-only line. Spotter Drone's trailing-hooks check saw
"**Combat Drone**" right after it, mistook the next entry's name for a hooks title, and attached
an empty hooks block while skipping past Combat Drone's own heading entirely. Same for Sentry
Turret and Puppeted Body. The fix is the same discriminator `is_entry()` already uses in the
opposite direction: a hooks title ends in ":", an entry name never does. Centralized inside
`take_hooks()` itself rather than duplicated at each of its two call sites, and paired with a
second fix, only advance past what the function actually consumed, since the first fix alone
still skipped the next entry's name line even after it stopped attaching bogus hooks to it.

**The Kettle Dog's identity landed as two separate italic paragraphs instead of one continuous
span**, and `parse()` had only ever needed to read one. It grabbed the first paragraph, then threw
the second away outright: "The catalog listing says Resident Guardian Unit..." sat in an array
slot the field-splitting loop never reads, discarded before anything could report it missing. The
fix folds every consecutive bare-italic paragraph into the identity before the field loop starts,
safe because nothing else legitimately sits between an identity and the entry's first bold-labeled
stat.

Word and number recovery: 33/33 clean on numbers, 29/33 clean on words, the remaining four the
same `GM note` label-tokenization artifact recorded since this file's first bestiary entry and
accepted then for the same reason now.

Also fixed while re-deriving the parser's line ranges: `CATEGORIES` and the manuscript scan window
were hardcoded to the old export's line numbers (325-425, thresholds at 332/360/374/384/394/404).
The Doc grew past 1,100 lines with this pass; the new numbers (332/524/646/724/772/816, window to
935) came from a fresh structural scan, the same way the original numbers were found, not by
guessing an offset.

## No rail for the unregistered, 2026-09-02

Author's call: the Freelancer tab rail hides itself, all but the settings gear, until the active
record has been created as a valid character and taken through #PRINT's SUBMIT & FILE. An
unfiled draft gets the wizard and nothing else.

**"Filed" did not exist as state.** `submitRecord()` played the envelope animation and jumped to
the Freelancer tab; it wrote nothing to the record. It now stamps `meta.filedAt` first, before
the animation rather than in its `onDone`, so a reload mid-animation still comes back to a filed
record. "Valid" needed no new work: the button was already gated on every wizard step being
complete plus the certification checkbox (`canFile`), so the gate only had to add "has been
filed."

**The gate is the existing `gated` mechanism**, the same one the Admin tabs use, on the six
non-#PRINT Freelancer tabs. #PRINT is never gated on it, or a draft could never reach the step
that files it. When the active record is unregistered, `renderTabs()` skips the tab scroller and
paints only the gear. It is the first `gated` that reads character state rather than module
presence, and it needs no extra plumbing to react: `store.update` already re-renders, so the rail
appears behind the filing animation and is simply there when the overlay lifts. Admin is
untouched; a GM needs no character.

Two decisions the author made:

- **Existing records are grandfathered.** A record from before this shipped predates the stamp
  entirely and is stamped as filed on its first load after, via the same one-time stamp shape as
  `wearKeys` and `overdriveNames` (`meta.filedGate` marks a record born after the gate, which
  migrate() then leaves alone). The alternative was every current player, and the app's own live
  copy of Snikt, losing their tabs until they walked back to step 07 for a rule that did not exist
  when they filed.
- **Examples count as registered**, and adopting one stamps the copy filed. They are finished demo
  records that cannot be stored, and the tabs are what they are for; hiding them would make the
  seven examples nearly useless.

Verified live, five scenarios: empty roster (gear only, intake screen); example loaded through the
intake button (full rail); "Save as my own" (copy stamped, rail stays); the real SUBMIT & FILE on
an unfiled complete record (stamp lands on click, rail appears behind the animation, lands on
Freelancer, persisted); a legacy-shaped record with no stamp reloaded (grandfathered, rail
visible); Admin with no character at all (all seven Admin tabs, untouched).

### For the author

- **None of the seven examples is complete by the wizard's own standard.** Each has five pending
  picks (Class skill and tool, Background skill, tools, and weapon/vehicle), no lineage feature,
  no awakening evolution, and, once those are filled, four training overlaps between Background
  and Class that each want a Free Skill Focus claimed. So no example can reach SUBMIT & FILE as
  shipped; the filing test above had to seed those fields first. Pre-existing, and only visible
  now because filing finally does something. Whether examples should ship complete is a
  design call, not a bug report.

## Two profiles, one gate, 2026-09-02

Author's call: the Freelancer/Admin choice belongs on the login screen, not on a splash after
it. A SWITCH USER control on the gate flips to a profile picker, and each profile gets its own
login: Freelancer keeps the classic node front door, byte for byte; Admin is a tunnel to the
operator console, styled like a corporate VPN, gold, with a live handshake log above the
prompt and ESTABLISH TUNNEL for a button. The profile you enter as is the desktop you land on.

Two decisions the author made:

- **Admin takes its own passphrase** (`CONFIG.adminPassword`, beside the Freelancer code). The
  framing only lands if the operator side has a credential the player side doesn't, and it
  means a player who knows the front door still can't wander into the bestiary. Still
  atmosphere, not security, as the file has always said of itself.
- **Each profile remembers its own unlock.** `en_gate_ok_v1` stays the Freelancer flag under its
  old name, so no device unlocked before Admin existed gets asked again; Admin gets
  `en_gate_admin_ok_v1`. Reloads land straight on the remembered desktop as before. Switch user
  from the cog goes to the picker; a profile already unlocked is one click, the other asks.

**What this retired.** `portal.js` and its splash, whole: the gate now answers the question the
splash asked. Its coachmark moved into the gate and fires after any interactive login or pick,
never on a silent resume. The settings tray's RETURN TO PORTAL became SWITCH USER. Later the
same day the author dropped the tray's bare Freelancer/Admin buttons as redundant beside it, and
Switch user became a direct flip: the other profile already unlocked, it swaps with no overlay
and no cog note; locked, it opens that profile's login card, skipping the picker. The picker
stays on the login cards themselves. The bare buttons survive only in a build with gate.js
deleted, where nothing else could cross. On the Admin desktop the tray is titled Admin Settings.

**The Admin card got its own three-strike easter egg after all.** The first cut had three misses
trip a trace and a cooldown with no way in, on the reasoning that the passphrase exists so three
guesses is not one. The author reversed that the same day for parity with the Freelancer hijack:
the trace lands and the node locks, then about two seconds later the "trace initiated" line
scrambles glyph by glyph and resolves green as a #GRID Guardian override (the bestiary's corporate
counter-hacker, the one with admin authority over the whole cluster, so the one thing in the
setting that can wave a trace away). An off-brand paperclip pops in and types "It looks like
you're trying to gain Admin access. Would you like help with that?", borrows your cam for a
retinal scan while the log ticks ACQUIRED, MATCH, VALID, declares you a valid user, and opens the
tunnel. Both codes are therefore deterrents, not locks; that was always true of the Freelancer
door, and it is now true of both by choice. The maintenance link is still drawn only on the
Freelancer card and only ever opens Freelancer.

One structural fix while wiring it: the cog note outranks the gate in z-order (it has to sit
above the tab rail), so a still-open note would have floated over the picker when Switch user
was pressed. The gate dismisses a live note as it opens.

**Getting the login back.** Once a profile is unlocked the gate never paints for it, which is
right for players and wrong for anyone testing the screens. Two routes, added the same day at
the author's ask: `?login` forces the gate to paint even though the profile is unlocked, and
clears nothing (`?login&portal=admin` for the Admin card); and SIGN OUT in the settings tray,
beside Switch user, forgets BOTH profiles' unlocks (author's call, same day: sign out means the
whole node, not one side of it) and reopens the current profile's login card over the desktop,
which is also the honest way to hand the device to a player.

## The skin axis, 2026-09-02

Author's call: the appearance section grows a second axis beside the palette. A SKIN is the
shape of the interface (type, corners, chrome, effects); a palette is still its colors, so any
palette wears any skin. Three skins: Classic (the look as shipped, the default), #GRIDOS '98,
and #GRIDroid. The names are the author's; '98 riffs on the Windows of that year and Droid on
what Google called its phone OS.

Only the axis is built here. The '98 and Droid designs are the author's to share, so the tray
picks them, the root class flips (html.skin-98, html.skin-droid, the same mechanism as
html.light), the choice persists, and a warn-colored line under the picker says the skin is
wired but not yet styled. Classic is the ABSENCE of a skin class, so no skin's rules can ever
break it. theme.css carries a reserved, commented block where each skin's rules will land.

Device-level on purpose (`en_skin_v1`): a palette belongs to the character and rides in their
export, but the skin is the OS this device runs, so it is neither per-character nor per-desktop
and is never exported.

## #GRIDOS '98, the first skin, 2026-09-02

Author's reference was their own site's Win98 treatment: black, not grey, with the palette's
cyan and magenta doing the work. The skin is one override block in theme.css against
`html.skin-98`, and it changes shape only: bevels on every surface (raised for windows and
buttons, sunken for inputs, stats and status cells), gradient title bars with a window-button
cluster, no corner marks at all (the author cut the crosshairs on sight; a window has a frame),
monospace chrome labels, square corners enforced on
inline radii too (the meters set theirs from JS). The tab rail becomes a bottom TASKBAR and the
gear becomes START, which opens Settings, which is what Start did. Palettes still supply every
color: the title bars go gold on the Admin theme with no rule written for it. The gate wears the
same chrome.

**One thing CSS could not know**: the cog note anchors below the gear, and the taskbar puts the
gear at the bottom of the viewport. The gate now measures the note after appending it and flips
it above the gear, caret on the bottom edge, whenever the gear sits in the lower half of the
screen. Testing that surfaced a second, older gap: `coach()` is exported but relied on `open()`
having injected the gate's CSS first, so a note after a silent resume would have had no styles at
all. It injects its own now.

#GRIDroid is still wired but unstyled, pending the author's design.

### The '98 system tray, same day

Author's ask: the time moves to the right end of the taskbar behind two status glyphs, in the
order glyph, glyph, clock, the glyphs in a soft pulsing vibrant green. A skin is CSS only and CSS
cannot move the top-bar clock into the rail, so the rail now always renders a tray of its own
(two glyphs and a second clock) and tickClock drives both clocks. Classic hides the tray; '98
shows it and hides the top-bar clock, so exactly one clock is ever on screen. Cells are divided
the Win98 way (a dark line with a light line beside it), the glyphs wear var(--success) with a
2.4s glow pulse offset by half a period so they breathe out of phase, and the pulse drops under
prefers-reduced-motion like every other animation in the file.

Also cut from the '98 title bar at the author's ask: the LINK STABLE and SYNC OK readouts. The
tray glyphs carry that job on this skin. #active-name is its own element and stays; the save
flash still writes to the hidden #save-state, harmlessly. Classic is untouched.

Then the author named the glyphs: on '98, the tray's first glyph IS LINK STABLE and the second IS
SYNC OK. So they behave like what they replace: the words survive as hover titles, and the second
glyph flashes amber with the save pulse for the same 280ms the top-bar readout does, glow and
all (the glow follows currentColor now), then falls back to the skin's green by clearing its
inline color rather than setting one, so it keeps its pulse. Making that land took one reorder:
the store listener ran flashSave() then render(), and render() rebuilds the rail, so the freshly
amber glyph was thrown away with the old rail a moment later while the top bar's static readout
never noticed. It renders first now, then flashes.

### The Gray Market goes to 1998, same day

Author's ask: on '98, make the Inventory tab, and the Gray Market especially, look like eBay or
craigslist. The reading that fits a Windows 98 homage is the literal one: on that desktop you
reached a shop through a browser, and the shop was a white page. So the Inventory tab now opens
a "#GRID Explorer" window (title bar with the window buttons, a File/Edit/View menu bar, an
address bar whose URL names the sub-view and storefront), and inside it is a light document.
The Gray Market fills that document the way a 1998 auction site did: the storefronts are a
lowercase text-link nav with pipe separators, the storefront name is a fat lowercase wordmark in
four hard color bands, the tagline is italic serif, the search bar is the yellow featured band,
each category is a listing table with a gray header row and a bold blue underlined name, and
the items are striped rows with blue underlined names, bold prices, and a "Buy It Now" yellow
BUY button. Stash, Chrome, and Workbench sit in the same window as plainer pages of the same
site. Classic is untouched.

Two things the module had to give the skin. Every piece of the market's chrome was inline-styled
with no name a stylesheet could reach, so marketView and itemCard now carry `.mkt-*` classes
(fronts, banner, controls, sublabel, card, name, meta, price, info, action) that nothing in the
module reads, and the tab wraps whichever sub-view is up in one `.inv-sub` with the sub-view in
`data-sub`, which is how the address bar knows what to say. The wrapper is a plain block in
Classic; nothing else keys on it.

How the white page stays readable without touching the module: the wrapper re-declares every
palette token (backgrounds, inks, the accent set, the bevel trio, the fonts) for a light page, so
the inline `var(--gold)` and friends the inventory paints with re-resolve to dark inks inside it.
One trap in that: the window's own title bar wants the DARK side's accent for its gradient, and a
custom property declared next to its own remap reads the remapped value, so the dark values are
captured one level up on `#view` before the remap happens. The window buttons are an inline SVG
drawn from shapes, not text, so they cannot fall back to a tofu glyph.

### The sticky sub-header's gap on '98, same day

Author's screenshot: scrolling the Gray Market on '98 left the Inventory sub-nav (the sticky
STASH / CHROME / WORKBENCH / GRAY MARKET row with the wallet beside it) hovering 48px below the
top bar, and the store page showed through the gap. The row stuck at 92px, which is the Classic
top bar plus the tab rail; on '98 the rail is a taskbar at the bottom, so the top bar ends at 44.

The sweep found the same assumption three times: that row (inline, 92px), the Freelancer tab's
sticky Active Condition Effects box (inline, 96px), and the wizard rail (theme.css, 92px), which
the '98 block had already patched with a one-off `top:44px`. Rather than three overrides, one
token now carries the offset: `--sticky-top` is 92px on the root and 44px inside the '98 block,
and all three consumers read it (the effects box keeps its 4px of extra room as a calc). The
one-off override is gone with it. Classic is byte-for-byte the same offsets; a future skin that
moves the rail sets one variable.

### Three caption buttons, not three glyphs, same day

Author's ask, pointing at a panel title bar: the `_ [] x` accent should look like three separate
buttons, the way they are supposed to be. It was one pseudo-element holding three characters
inside a single bevel, so it read as one wide button with a label. A title bar only has the one
pseudo-element left (the other is the little square icon), so the three buttons are a drawing:
a 56x14 SVG of Win98's 16x14 caption buttons, minimize and maximize touching and close set apart,
each a bevel of five stacked rects with the glyph drawn from shapes rather than text, so no font
can change it. It lives once as `--win-btns` on the '98 root and both the panel title bars and
the Explorer window's title bar read it, which retired the Explorer's own copy of the drawing.
SVG cannot see var(), so this is the one place the skin uses literal Win98 grey, and it is the
same grey the Explorer chrome already wears. Classic never had the buttons and still does not.

## Environment

- **Parts 2 and 3 are not spilled in full.** Chrome refuses downloads from
  `docs.google.com`, so only Part 1 is on disk (`ms/part1.md`). Targeted extracts of
  the changed passages are at `ms/targeted-2026-08-04.md`. Unblock by allowing
  automatic downloads for that origin.
