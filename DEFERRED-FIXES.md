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

- **The #GRID Rig selector prints "undefined HP".** `app/js/grid.js` lines 90 and 93
  build each option as `s.tier + " · +" + s.deviceBonus + " dev · " + s.hp + " HP"`,
  but `EN.grid.smartdecks` and `EN.grid.buddies` rows carry `integrity`, not `hp`.
  Every Smartdeck and B&E Buddy option therefore reads "undefined HP". Confirmed live
  with an Advanced Smartdeck equipped. Pre-existing, untouched, one-word fix
  (`s.hp` -> `s.integrity`, `b.hp` -> `b.integrity`).
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
  a Medtech pool. Contained for Trauma Rigs (only the Rig you are actually running
  counts as a medkit, so a shelf of old tiers grants nothing), but the general case is
  untouched and predates this step.
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

## Confirmed in step 4, reproduced live, NOT fixed

These three came out of the Trauma Rig review with live reproductions. The default
path (own a rig, equip it, read the DC) is verified correct; all three are edge or
scope failures. Fix these before step 5.

- **The two Medical Baseline surfaces disagree about ownership.**
  `app/js/engine.js` around line 1304 honours a recorded `ch.rig.tier` with NO
  ownership check, while `app/js/inventory.js` around line 1795 requires the row to
  be in the stash AND to equal the live tier. Nothing clears `ch.rig.tier` when the
  rig leaves the stash. Repro: Stitcher with `rig.tier = "Trauma Grade"` who has sold
  that rig and holds only a Field Kit. The Actions panel claims COUNTS AS ADVANCED
  MEDKIT while the Fabrication bench says "No crafting kits in your Stash" and drops
  Medtech Edge to 2. The narrower gate also filters out the Field Kit the character
  DOES own, so the disagreement lands as "no kit" instead of the lower grade. The two
  gates need to be one gate.
- **Rig integrity and the #GRID node are Stitcher-only.** `engine.js` computes
  `triage` only when `ch.class === "stitcher"`, and `combat.js` renders the rig block
  only `if (d.triage)`. The manuscript is explicit that ANYONE can buy one (User
  Type: Anyone, Standard Users). Repro: a Hustler owning a Black Clinic rig gets
  `derive().triage === null`, no Output Bonus, no node, no integrity track. A
  Smartdeck on the same character shows a working integrity track, so deck integrity
  is universal while rig integrity is not. Separately, `grid.js` enumerates only
  names ending "Smartdeck" or "B&E Buddy", so the rig cannot be reached from the
  #GRID tab at all despite being documented as a valid target.
- **A fresh rig can arrive BRICKED.** The picker resets `ch.rig.hpSpent` on change,
  but the AUTO owned-gear fallback does not; the engine only clamps. Repro: brick a
  Black Clinic at 40 damage, lose it, and the Field Kit that AUTO selects next reports
  0/15 BRICKED with `hpSpent` still 40, with DAMAGE disabled. Recoverable with
  REPAIR, but wrong by default. Likely fix is recording which tier the damage belongs
  to and discarding it when the resolved tier changes.

Also found and left alone as out of scope: a pre-existing `undefined HP` bug in the
#GRID Rig selector (`app/js/grid.js` reads `s.hp` / `b.hp` where the data field is
`integrity`); Remote Applicator's +3 spaces is displayed but not applied, since
Protocol ranges are prose; the two once-per-scene rig traits have no usage tracking.

## Environment

- **Parts 2 and 3 are not spilled in full.** Chrome refuses downloads from
  `docs.google.com`, so only Part 1 is on disk (`ms/part1.md`). Targeted extracts of
  the changed passages are at `ms/targeted-2026-08-04.md`. Unblock by allowing
  automatic downloads for that origin.
