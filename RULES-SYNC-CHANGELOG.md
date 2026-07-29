# Rules Sync Changelog

Sync of the #GRID Smartdeck OS app against the overhauled canonical rulebook
(the three Google Docs: Part 1 Welcome & Building a Character, Part 2 Core Rules,
Part 3 Equipment), audited 2026-07-28.

Doc line numbers below refer to the plain-text extracts of each Part taken during
the audit. They are stable relative to each other but will drift as the manuscript
is edited, so each entry also quotes the governing text.

**Audit totals: 406 findings** across 3 Parts and 41 rules domains.
47 engine (changes a computed number), 167 data, 126 missing, 20 stale, 46 text.

Item tables came through the overhaul clean: all 22 melee weapons, 35 ranged
weapons, ammunition rows, 16 Signature weapons, 60 weapon Parts and 37 armor
entries match the docs digit for digit. Attributes, point buy, backgrounds, the
14-skill list, proficiency tiers, Caliber, all seven class save-Focus pairs, the
Flow formulas, the 19 damage types and 39 of 41 conditions are also in sync.

---

## PART A: Changes made to the app

### A1. Heavy Payload now raises the Encumbrance Threshold
- **Commit:** `7f0419e`
- **Files:** `app/js/engine.js:739-741`
- **Rule:** Part 1, lines 951 and 3569 - "You increase your Encumbrance Threshold
  by 2 and count as one Size larger for grappling, and gain Edge on all checks
  made to lift wreckage, pry open doors or collapsed structures."
- **Was:** the encumbrance step searched for Heavy Payload among **Talents**
  (`activeTalents(ch).some(t => t.talent.name === "Heavy Payload")`). Heavy Payload
  is a Laborframe lineage Additive Feature and no Talent by that name exists, so
  the branch was dead: the +2 never applied.
- **Impact:** every Laborframe who took Heavy Payload (at creation or via Lineage
  Evolution) had an Encumbrance Threshold 2 lower than the rules grant, which also
  shifted all three Loadout bands and could mislabel them Encumbered or Overloaded.
- **Now:** gated on lineage features, matching the Synthetic Musculature step above it.
- **Also:** both step labels changed from "(one Size larger)" to "(+2 Threshold)".
  The rulebook states these as a flat +2 Threshold; the one-Size-larger clause
  applies to **grappling only**, not to Encumbrance.
- **Verified:** live derive, Threshold 9 -> 11 with the feature present.
- **Manuscript impact:** none. The app was wrong, the docs were right.

### A2. Removed invented Flow content; restored Blind Spot to Cognitive
- **Files:** `app/data/flow.js`
- **Rule:** Part 2, line 2806 - "**Blind Spot:** A target you choose slips beneath
  notice, gaining the **Invisible** condition. The effect ends immediately if that
  target makes an attack or forces a saving throw." Listed under **Cognitive**
  Empowered Effects (2803-2806) and in the sustain table at line 2717
  (`| Cognitive | Blind Spot | No |`).
- **Was:** the app had an effect named **"Light Bend"** with Blind Spot's exact
  mechanics, filed under **Electromagnetic**. No such effect exists anywhere in the
  rulebook.
- **Why this mattered beyond naming:** Electromagnetic is a Level 1 base Resonance
  and Cognitive unlocks at Level 3 (Resonance Synthesis). The app therefore offered
  at-will Invisibility two levels early, to any Shaper, on the wrong Resonance.
- **Now:**
  - `Cognitive.empowered` gains **Blind Spot** (doc text, sustain: false).
  - `Electromagnetic.empowered` drops Light Bend and gains the two effects the doc
    actually lists: **Overload** (2770) and **Magnetic Seize** (2771). Optic
    Scramble retained, text aligned to line 2769.
  - `Electromagnetic.base` rewritten to the doc's three choices - **Magnetize**,
    **Live Current**, **Flare** (2763-2765). The old base text ended with "bend
    light to alter an object's appearance," which was part of the same invention.
  - `sustainCompat`: Light Bend row replaced by Electromagnetic **Overload**
    (not sustainable, per 2707) and **Magnetic Seize** (sustainable, per 2708);
    Cognitive **Blind Spot** added (not sustainable, per 2717).
  - Premade template "Phantom Shroud" re-pointed from electromagnetic/Light Bend
    to cognitive/Blind Spot.
- **Manuscript impact:** none, but see M10 - the app's invented text is a sign the
  Electromagnetic and Cognitive tables were rewritten in the overhaul and the app
  was never resynced.

### A3. #GRID device damage: durability HP replaced by System Integrity
- **Files:** `app/data/grid.js`, `app/js/engine.js`, `app/js/grid.js`,
  `app/js/settings.js`, `app/js/store.js`, `app/js/printsheet.js`, `app/js/pdfexport.js`
- **Rule:** Part 2, lines 3389-3407 - "Smartdecks and B&E Buddies track **System
  Integrity** like any node. Damage subtracts from it. At 0, the device is
  **Bricked**." / "**Damage is damage.** Cipher damage tests the device's Firewall
  first (if it has one) and the remainder subtracts from System Integrity. Physical
  damage does not care about Firewalls; a rifle round argues with the chassis
  directly, at full value." / "Rudimentary and Standard infrastructure bricks on a
  single successful hit; a device never does."
- **Was:** the retired durability model. Decks had `hp` 3/4/5/6/7/8, buddies 2/3/4,
  nodes 3-7, "any successful hit deals exactly 1 HP regardless of the rolled
  damage," and the Firewall Damage Threshold was a pass/fail gate ("damage must
  EXCEED the threshold to deal 1 HP").
- **Now, all values from the doc:**
  - Smartdeck Integrity **20 / 30 / 35 / 40 / 50 / 55** (Standard through Apex),
    doc table 3398-3407.
  - B&E Buddy Integrity **15 / 20 / 30**, doc 3537-3539.
  - Node Integrity **20 / 30 / 35 / 40 / 50** for Improved through Apex, doc
    3267-3271. Rudimentary and Standard stay null: they brick on one hit.
  - Firewall Damage Threshold is now **subtractive** (roll minus threshold comes off
    Integrity; a result of 0 or less is discarded), doc 3374.
  - `Reinforced Heatsinks` **+2 HP -> +15 System Integrity**, doc 3597.
  - Repair rescaled to the doc: Downtime **𝒢10 per 5 Integrity** restored (round
    up), Field Repair **5 Integrity per successful Edge die** (3411-3412).
  - The restore cipher now grants **5 x Tech Modifier (minimum 5)** Integrity to a
    Linked allied node **or device**, doc 3754. It previously granted Tech Modifier
    (minimum 1) and split nodes from devices, a distinction the new model removes.
- **Engine:** `deck.hp` -> `deck.integrity`; `deckBaseHp`/`modHp`/`deckMaxHp` ->
  `deckBaseIntegrity`/`modIntegrity`/`deckMaxIntegrity`; the derived field
  `d.grid.deck.maxHp` is now **`maxIntegrity`**. Mod bonuses read `bonus.integrity`.
- **UI:** the rig readout is now "SYSTEM INTEGRITY". The old plus/minus-one stepper
  was replaced by an amount box with **DAMAGE** / **REPAIR** / **FULL**, because
  damage is a rolled number against a 15-55 track rather than one tick per hit.
  Print sheet and PDF export now label the field "Integrity".
- **Battle-damage visual layer:** the escalation added earlier in commit `3144a6b`
  reads a percentage of the track, so it needed no logic change and now has far
  better granularity. Verified on a 45-point rig: 100% pristine, 60% worn,
  40% heavy, 20% critical (static), 0% bricked.
- **Saved characters:** the persisted field `ch.grid.deckHpSpent` keeps its name and
  now counts Integrity lost. Any character mid-repair carries their old number
  forward, which reads as *less* damaged on the new larger track. Nothing breaks.
- **Verified live:** all Integrity values, Heatsinks +15 (Improved 30 + 15 = 45),
  Max Complexity per tier, the damage/repair control, and the visual staging.
- **Manuscript impact:** none. See M1 and M2 for the rulings that shaped this.

### A4. Combat and recovery engine fixes (first batch of step 3)
- **Files:** `app/js/combat.js`, `app/js/grid.js`

**A4a. Speed reductions now apply in the right order.**
- **Rule:** Part 2, line 1264 - "When multiple Speed reductions apply, subtract all
  flat reductions first, then apply any halving or percentage reductions, rounding
  down. Speed cannot fall below 0 (or its stated minimum)."
- **Was:** `s = base + speedDelta; if (halved) s = Math.min(s, Math.floor(base / 2))`
  - the halving was computed from the UNREDUCED base and then the larger of the two
  values was kept, so flat reductions and halving never compounded.
- **Now:** flat first, then halve.
- **Verified live** on a Speed 9 character: Fatigue 1 = 8, Fatigue 2 = 6,
  Fatigue 3 = 3 (was 4), Bloodied = 4.

**A4b. The minimum-3 Speed floor belongs to Agility alone.**
- **Rule:** Part 2, line 1339 - "Even with a negative modifier, total Speed cannot
  drop below **3** due to Agility alone. Environmental effects, injuries, or
  abilities can still reduce Speed to 0."
- **Was:** `Math.max(3, s)` was re-applied after every condition, so conditions and
  encumbrance could never take a character below 3.
- **Now:** conditions clamp at 0, or at a condition's own stated minimum. Fatigue 3
  ("Speed is halved, rounded down, **minimum 3**", doc line 2318 ladder) sets that
  minimum explicitly via a new `speedMin` field.

**A4c. Any damage while Stable returns you to Dying.**
- **Rule:** Part 2, line 1942 - "Taking damage while Stable returns you to **Dying**."
- **Was:** `c.stable` was cleared only inside the wound-overflow branch, and only
  when the hit drove Wounds to 0. Damage absorbed by Vigor or Vitality left a Stable
  character Stable.
- **Now:** cleared for any damage amount before the pools are touched.

**A4d. A Long Rest no longer cures Severe Fatigue.**
- **Rule:** Part 2, line 1999 - "Reduce **Fatigue** by 1 level. Severe Fatigue
  (level 4 or higher) requires professional care or ritual support." Corroborated at
  2329: "**Severe Fatigue (4 to 6):** Requires **medical, mystical, or technological
  treatment** to reduce."
- **Was:** Long Rest stepped Fatigue down by 1 unconditionally, from any level.
- **Now:** levels 1 to 3 step down as before; 4 to 6 are left untouched and the
  player is told why via a toast.
- **Verified live:** Fatigue 2 -> 1, Fatigue 1 -> cleared, Fatigue 5 -> stays 5.
  Short Rest correctly leaves Fatigue alone at every level (doc 2327).

**A4e. Unarmed strikes use the Simple Weapons Proficiency Bonus.**
- **Rule:** Part 2, line 795 - "Unarmed strikes use your Simple Weapons Proficiency
  Bonus, and follow the usual Untrained rule if you lack it."
- **Was:** unarmed strikes and lineage natural weapons rolled a bare attribute
  modifier with no proficiency and no Untrained Snag.
- **Now:** both add the Simple Weapons tier bonus (+2/+4/+6) to the ATTACK roll only,
  and roll with Snag when Untrained. Damage keeps the attribute modifier alone, since
  proficiency has never applied to damage.

**A4f. LinkDeath feedback is 2d6 per severed Link, graded on the margin.**
- **Rule:** Part 2, lines 3448-3451 - "Every Link severed involuntarily deals **2d6
  psychic damage** in feedback." / "**Failed by 4 or less:** Take **half** the
  feedback and be **Dazed**." / "**Failed by 5 or more:** Take the **full** feedback
  and fall **Unconscious**." / "Roll **2d6 per severed Link** as one pool."
- **Was:** `2d6 + (N-1)d6`, with no margin grading and an invented "Cascade Failure =
  deck auto-Bricked" line.
- **Now:** N x 2d6, both landing bands stated, plus the doc's new interaction with
  A3: on falling Unconscious the pool subtracts from the deck's remaining System
  Integrity with **no Firewall applied**, and only the overflow past what the deck
  absorbed reaches the character as Psychic damage. Cascade Failure is described as
  the doc defines it (a fresh Stability Check for the surviving Links at a DC that
  counts the feedback), not as an automatic bricking.

### A5. Cyberware Static and the Load / Loadout system (rest of step 3)
- **Files:** `app/js/engine.js`, `app/js/combat.js`, `app/js/store.js`, `app/js/inventory.js`

**A5a. Resonance Crown now reduces Total Static.**
- **Rule:** Part 3, line 4300 - "reduces the SP cost of up to **4 separate pieces**
  of your other installed cyberware by **1 SP each** (minimum 1 SP per piece). This
  reduction applies to your Total Static calculation."
- **Was:** Total Static was a raw sum; the Crown's headline effect did nothing.
- **Now:** applied in `derive()`, skipping the exclusions the item itself names
  (itself, the Disruption Lattice, the Convergence Engine) and never taking a piece
  below 1 SP. Since the player would always pick their four most expensive eligible
  implants, the app selects those automatically rather than adding a picker.
- **Verified:** four 3-SP implants plus a Crown went from 12 SP (Threshold 5, "The
  Ghost Fades") to 10 SP (Threshold 4); 1-SP pieces are never reduced.
- **Also:** the Crown's "+1 FP at the end of a Short Rest" now applies.

**A5b. Static Threshold 4 and 5 riders now do something.**
- **Rule:** Part 3, line 4000 - Threshold 4 "**Maintenance Required:** You no longer
  naturally recover Wounds at the end of a Long Rest." Line 4003 - Threshold 5
  "**Dead Battery:** You no longer benefit from the rule that grants 1 free
  Resilience Die when starting a Short Rest with 0 dice."
- **Was:** `derive()` computed `noWoundRecovery` and `deadBattery` and nothing ever
  read them (confirmed by grep: the only occurrence was the assignment).
- **Now:** a Long Rest at Threshold 4+ leaves Wounds untouched and says why; a Short
  Rest at Threshold 5+ grants no free die.

**A5c. Armor Load counts whether worn or packed.**
- **Rule:** Part 3, line 4435 - "Armor counts whether worn or packed: **1** for
  Light, **2** for Medium, **3** for Heavy."
- **Was:** worn armor was discounted by 2, so worn Heavy armor cost 1 and worn Light
  armor cost 0.
- **Now:** full value in both states.

**A5d. Mystech armor was reading the wrong field for its weight class.**
- **Was:** the class came from `group`, which for all four Mystech suits is just
  "Mystech Armor" - no Light/Heavy match, so every one fell through to Medium (2).
- **Now:** read from `type`, which states the real class.
- **Verified:** Veilskin (Light Mystech) 1, Resonant Carapace (Medium Mystech) 2,
  Aegis Shroud (Heavy Mystech) 3, and the ordinary suits unchanged at 1 and 3.

**A5e. The Loadout is declared, not derived.**
- **Rule:** Part 3, line 4423 - "When a job starts, each Freelancer declares one
  **Loadout**... If nobody declares, assume **Standard**." Line 4424 - "Your Loadout
  sets your **Load Budget**."
- **Was:** the app inferred the tier from carried Load (`store.js` even deleted
  `ch.loadout` on load, commented "never declared"), and the Loadout chips in the
  Freelancer tab were captioned "calculated from what you carry".
- **Now:** `ch.loadout` persists (defaulting to Standard), the chips are clickable to
  declare it, and the declared tier sets the Load Budget. `encumbrance` also exposes
  `budget` and `overBudget`.

**A5f. Overloaded is no longer triggered by an invented number.**
- **Rule:** Part 3, line 4462 - Encumbered is "carrying more Load than your Load
  Budget, or hauling something that is clearly heavy but still plausible." Line 4468 -
  Overloaded is "hauling something that clearly belongs on a dolly, cart, vehicle,
  forklift, or exoframe."
- **Was:** a fourth pseudo-tier ("over", shown as "OVER HEAVY") triggered at
  Load > Threshold + 3, which appears nowhere in the rulebook.
- **Now:** over budget means Encumbered; Overloaded comes from the Haul. The "over"
  tier is removed from the Freelancer and Inventory readouts.
- **Verified** on a character carrying 7 with Threshold 9: Light (budget 6)
  Encumbered, Standard (9) Unencumbered, Heavy Encumbered for the run, Haul lift
  Encumbered, Haul drag Overloaded.

**Deferred from this tranche (needs a schema plus UI change, not just math):**
- **Cyberware platform slots.** Part 3 line 4037: "Compatible mods installed in those
  slots do *not* add SP to your Total Static; the platform has already paid that
  cost." The catalog already marks Cyberarm and Cyberlegs `platform: true` with a
  slot count per tier, but an installed implant has no way to record which platform
  it sits in, so the exemption cannot be computed yet. Mods in a platform currently
  charge full SP, which is stricter than the rules, never more lenient.
- **Flat implant bonuses beyond Speed and Wounds.** `cyberFlatBonuses()` reads only
  those two keys, so Reflex Booster's Initiative bonus, Subdermal Armor's DR, and the
  Convergence Engine's Vitality never reach the sheet.

### A6. Weapon Save DC split three ways (closes M3, and step 3)
- **Files:** `app/data/combat.js`, `app/data/gear_melee.js`, `app/data/gear_ranged.js`,
  `app/js/inventory.js`
- **Rule:** stated consistently in both Parts, so this is a real change rather than a
  contradiction. Part 2 lines 1463-1465 give all three in one table, and Part 3
  repeats them at 497, 677 (again at 3119) and 958:
  - **Melee:** 8 + Body modifier + Caliber
  - **Range:** 8 + Agility modifier + Caliber
  - **Thrown:** 8 + the higher of your Body or Agility modifier + Caliber
- **Was:** one unified "8 + Body or Agility modifier (whichever is higher) + Caliber"
  in the common-actions table and the ranged note, and no melee note at all.
- **Now:** three separate common-action rows, a corrected ranged note that also
  states the Thrown case, and a new melee note. The melee note had nowhere to render,
  so the Inventory melee section now carries it as its intro, matching how the ranged
  note already appears above Ammunition.
- **Note:** the Weapon Save DC is reference text in this app, not a computed stat, so
  nothing on a character sheet changes number. Ranged users who were quietly using
  Body because it was higher are the ones affected at the table.
- **Manuscript impact:** none.

---

## PART B: Pending, in the agreed order

1. ~~Rulings on the contradictions in PART C.~~ **M1 and M2 ruled 2026-07-28**;
   both need manuscript edits, neither needed a code change. M3 and M5-M9 still open.
2. ~~**#GRID System Integrity rework.**~~ **Done, see A3.**
3. ~~Remaining verified engine bugs.~~ **Done, see A4, A5 and A6.** Two items
   deferred with reasons (cyberware platform slots, flat implant bonuses).
4. Data corrections, domain by domain.
5. New subsystems (each a feature build, not a data edit): Flow Disturbances,
   Sit-Downs and Social Pressure numbers, Vehicles & Chases, Improvised Weapons,
   Economy, Mystech Ammunition.

Full machine-readable findings, with doc line numbers and `file:line` targets, are
in the audit scratchpad as `part2_findings.json` and `part3_findings.json`.

---

## PART C: Manuscript issues (for the rulebook, not the app)

These are places where the rulebook contradicts itself, states a rule the app
cannot implement unambiguously, or omits a rule the rest of the text assumes.
Nothing here has been changed in the app; each needs an author ruling.

### M1. Max Complexity: "Equal to Tier" vs "Tier + 1"  (RULED - manuscript edit needed)
**Author ruling (2026-07-28): Tier + 1.** Part 2's line and table are the ones to
correct. Replace the Part 2 bullet at line 3568 with, verbatim:

> **Max Complexity:** Equal to Tier + 1. The deck cannot execute a cipher above this line.

and change the **Max Complexity** column of the Smartdeck table (3575-3580) from
0/1/2/3/4/5 to **1/2/3/4/5/5** (Apex is capped by the library, which stops at
Complexity 5). Part 1 line 2063 already states this rule correctly and needs no edit.
**App status: already correct**, `Math.min(5, deck.t + 1)`; no code change was needed.
Verified per tier: Standard 1, Improved 2, Advanced 3, Premium 4, Elite 5, Apex 5.

<details><summary>Original conflict, for reference</summary>
- **Part 2, line 3568 + table 3575-3580:** "**Max Complexity:** Equal to Tier."
  Table gives Standard[0] = 0 ... Apex[5] = 5.
- **Part 1, line 2063:** "A Smartdeck can run Ciphers up to **(Smartdeck Tier + 1)
  in Complexity**: a Tier 0 (Standard) deck runs Complexity 0-1; a Tier 5 (Apex)
  deck runs the entire Cipher library."
- **Why it matters:** Part 1 line 293 and line 2061 start a Codebreaker with a
  **Tier 0** deck and **four Complexity 0-or-1** Ciphers. Under Part 2's rule that
  character cannot run half their own starting kit.
- **Note:** Part 1's formula also breaks at the ceiling - Tier 5 + 1 = 6, but the
  library stops at Complexity 5.
- **App implements:** Part 1's rule (`Math.min(5, deck.t + 1)`).
</details>

### M2. Cipher Save DC: Systems Proficiency Bonus vs Caliber  (RULED - manuscript edit needed)
**Author ruling (2026-07-28): 8 + Tech modifier + Systems Proficiency Bonus.**
Part 2 line 3352 is correct and stays. **Part 1 line 2080 (Codebreaker feature
*Brownout*) must be corrected** - it currently reads "(8 + your Tech Modifier + your
Caliber)" and should read "(8 + your Tech Modifier + your Systems Proficiency
Bonus)", or simply "against your Cipher Save DC" with no parenthetical, since the
formula is defined in the #GRID chapter.
**App status: already correct** (`8 + techMod + sysProf`, `app/js/engine.js:839`);
no code change was needed.

<details><summary>Original conflict, for reference</summary>
- **Part 2, line 3352** (the canonical #GRID reference): "**Cipher Save DC:**
  8 + Tech mod + Systems Proficiency Bonus".
- **Part 1, line 2080** (Codebreaker feature *Brownout*): "...must make a Body Save
  against your Cipher Save DC (**8 + your Tech Modifier + your Caliber**)."
- These are the only two places in all three Parts that spell the formula out.
- **Scale of the difference:** a Level 9 Codebreaker with Tech 18 (+4) and Adept
  Systems is DC 13 under one rule and DC 17 under the other.
- **App implements:** the #GRID chapter version.
</details>

### M3. Weapon Save DC is now split three ways, but the app has one formula
- **Part 3, line 495:** "**Weapon Save DC (Melee):** 8 + Body modifier + your Caliber"
- **Part 3, line 677** (restated 3119): "**Weapon Save DC (Range):** 8 + Agility
  modifier + your Caliber"
- **Thrown:** the higher of Body or Agility.
- **App currently implements:** one unified "higher of Body or Agility" formula.
- Unlike M1/M2 this reads as a genuine intended change rather than a contradiction
  (two independent audit passes found it, stated twice in Part 3). Queued for the
  engine tranche; flagged here so the manuscript stays consistent.

### M4. Damage rolls never state that an attribute modifier is added
- **Part 3, line 463** (the Damage column definition, the only general statement):
  "The dice rolled on a hit, plus the damage type."
- **Part 2, lines 1401/1406:** "On a hit, deal the weapon's damage through Damage
  Resolution." The Damage Resolution pipeline (1702-1719) never adds an attribute
  modifier either.
- **But the feature text assumes one exists:**
  - Part 1, line 2819 (Shaper, *Edge of Oneness*): "You can use your Body modifier
    instead of Agility for the attack **and damage rolls** of any melee weapon with
    the Finesse or Light trait."
  - Part 3, lines 1658 and 2082 (Mystech): "...may use their Flow Modifier in place
    of their **Body or Agility Modifier** for attack rolls, **damage rolls**, and
    any attribute requirement..."
- **App currently implements:** every weapon adds its attack attribute modifier to
  damage (Body melee, Agility ranged), which matches the feature text.
- **Needed:** one sentence in the Damage column or in Damage Resolution stating the
  base rule. Until then this is the single largest undocumented assumption in the
  system.

### M5. Resilience Dice: the Body modifier attaches two different ways
- Part 2's Vitality & Recovery chapter states the relationship inconsistently.
- App implements: Long Rest wound recovery = Body mod (min 1).

### M6. "Spatial" damage type is used but not defined
- **Part 2, line 1714** (Damage Resolution): "Some damage types (like Spatial or
  Psychic) may ignore standard physical DR entirely."
- **Spatial does not appear in the canonical 19-type list.** Psychic does.
- The Spatial *Resonance* exists and deals "Force (Spatial)" damage, so the intent
  is probably to add Spatial to the damage-type table, or to reword line 1714.

### M7. Block: physical shield only, or armor too?
- **Part 2, lines 1512-1517:** "**Requirement:** Must have a physical Shield
  equipped... Add the Shield's listed Block Value directly to your Armor DR against
  this specific attack." Pipeline at 1713 agrees.
- **App implements:** an armor Block Bonus plus a computed half-value for the
  Plated trait, i.e. Block without a shield.
- Needs reconciling against the Part 3 armor tables before either side is changed.

### M8. Crafting Max Mods contradicts the Part 3 Slot Count table
- Part 2's Crafting chapter and Part 3's weapon-customization Slot Count table give
  different maximums. The app implements the Part 3 table.

### M9. Two equipment entries stated two ways
- **EMP Grenade:** save type given inconsistently.
- **Concussion shells:** effect stated two ways.

### M10. Electromagnetic / Cognitive Resonance tables were rewritten
- Recorded here because the app had drifted far enough to invent an effect (see A2).
- The overhaul added **Blind Spot** to Cognitive and **Overload** / **Magnetic
  Seize** to Electromagnetic, and rewrote the Electromagnetic Base Effect into the
  three named choices Magnetize / Live Current / Flare.
- Also reported absent from the app and not yet added: the **Sustain Focus
  Disruption** rule.

### M11. Structural defects in Part 1 (formatting, not rules)
- **Duplicated chapter title:** `# Origin` appears twice in a row, lines 130 and 132.
- **Inconsistent heading levels**, which will break any generated table of contents
  or export:
  - "Backgrounds" is H2; every other chapter title is H1.
  - The Codebreaker's "Core Traits" and "Features Table" are H3 where the other six
    classes use H2 (or vice versa) - the class chapters are not uniform.
  - The **Sourcerer** subclass is H4; all 21 other subclasses are H3.
- No version number, date, "last updated" line, or changelog appears anywhere in
  any of the three Parts, and there are no Google Docs comment threads. Consider
  adding a version stamp so future syncs can diff doc-to-doc instead of doc-to-code.

---

## PART D: Systems in the rulebook that the app does not model

Each is a feature build rather than a data edit. Listed so the manuscript and the
app can be planned together.

- **Flow Disturbances** (Part 2, ch. 10, whole chapter): Anomaly Severity, the six
  Anomaly classifications, detection, Cleansing Projects, Counter Flow, Ritual
  Chorus, Focal Anchors, Null Scar Reconstruction Ritual.
- **Sit-Downs and Social Pressure numbers** (Part 2, ch. 4): the app has the
  persistent ledger (Profiles, Standing, Cred, Heat, Debts, Resolve tiers) and
  those match, but the entire Sit-Down runtime and every mechanical number attached
  to the tracks are absent.
- **Vehicles & Chases** (Part 2, ch. 14 + Part 3 Vehicle Ownership/Customization):
  vehicle profiles, Speed ratings, Impact DC, Control Checks, crashes, ramming, the
  Lead track, vehicle traits, mounted weapons. The app has only the five Vehicle
  Proficiency categories and a single chase calculator.
- **Improvised Weapons** (Part 3, ch. 7): damage by size, Desperation Attacks, the
  Unwieldy trait, and the People-as-Improvised-Weapons subsystem.
- **Economy** (Part 3, ch. 1): Lifestyle tiers, safehouse rent and upgrades, day-job
  income, licences, bribe anchors, Hypercare, Crew Kit splits, and the Nexus-to-
  Glimmer conversion economy (reference rate 1 Nexus = 10,000 Glimmer).
- **Mystech Ammunition** (Part 3, ch. 5).
- **Surprised** condition (Part 2, ch. 8).
