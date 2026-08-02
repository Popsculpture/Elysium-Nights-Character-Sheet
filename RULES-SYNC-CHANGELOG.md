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

### A7. Conditions resynced (step 4, domain 1 of 7)
- **Files:** `app/data/conditions.js`, `app/js/combat.js`
- **Added the missing condition:** **Surprised** (Part 2, lines 2555-2562), with its
  effect handler: no Action, Move, Swift or Impulse on your first turn (Saves still
  allowed), Speed 0, and attacks against you have Edge until the start of your second
  turn. Verified live: Speed 9 -> 0 while Surprised, restoring cleanly.
  The app now carries 41 of the rulebook's 41 conditions.
- **LinkDeath** rewritten to the margin model (2411-2413): there is no second saving
  throw; the margin of the failed Stability Check decides the landing (failed by up
  to 4 = half feedback and Dazed, by 5 or more = full feedback and Unconscious with a
  Wits Save to wake). Also notes the new deck interaction from A3.
- **Strain** stages corrected (2537-2538): Stage 3 Surge is "Overdraw Vitality damage
  rises from 1d4 to 1d6 per FP, Snag on Breakflow Checks" (the app had it as a
  Breakflow Check on Overdraw, which is Stage 4); Stage 4 Rend is "Breakflow Check
  when Overdrawing, and spending FP at all costs 1 flat Vitality per FP".
- **Strain accumulation** restored to "Strain points equal to the FP spent **beyond
  your Reservoir**" (2530); the app had dropped the qualifier, which inflated Strain.
- **Strain / Breakflow recovery** (2544): Downtime clears all Strain; Breakflow
  Restoration ends Breakflow and lowers Strain to **Stage 2**, not to zero.
- **Critical Wound** trigger restored (2225): a failed Body Save against Wound damage,
  or an effect that specifies one.
- **Renamed action and skills:** "Sprint" -> **Dash** throughout (the rulebook's action
  is Dash, doc 1327); Grappled escape and Restrained both now name **Athletics**
  rather than the non-existent "Brawl" and "Strength" skills (2352, 2502).
- **Frightened** retreat range changed from "ten metres" to **10 spaces** (2342).
- **Metadata rows added** for Mutating, Immunity, Resistance and Vulnerability, which
  previously rendered with blank duration and save columns.
- **Manuscript impact:** see M12.

### A8. Flow resynced (step 4, domain 2 of 7)
- **Files:** `app/data/flow.js`, `app/js/flow.js`
- Most of this domain was already closed by A2, which removed the invented
  "Light Bend", restored **Blind Spot** to Cognitive, added Electromagnetic's
  **Overload** and **Magnetic Seize**, rewrote the Electromagnetic base effect to
  Magnetize / Live Current / Flare, and re-pointed the Phantom Shroud premade to
  cognitive/Blind Spot. All re-verified live here.
- **Added the missing Stability Factor: Focus Disruption** (Part 2, lines 2883-2887):
  "**Focus Check:** When damaged, you must succeed on a **Wits or Body Saving Throw**
  (Shaper's choice). **DC: 12**, unless the damage taken that turn exceeds **20**, in
  which case the DC equals **half the total damage taken**. **Failure:** The sustained
  effect ends immediately."
  - This is the only rule that threatens a sustained Invocation, and the app had no
    trace of it. Now stored as `EN.flow.focusDisruption` and surfaced in the Sustain
    panel whenever an effect is actually being sustained, where a Shaper needs it.
- **Author update, same day:** the DC was rewritten to "**DC 12, or half the total
  damage taken that turn, whichever is higher**", and a Focus Check was defined as
  **a Body Save**. Applied to both places the app uses a Focus Check:
  - `EN.flow.focusDisruption` (Sustain) now reads DC 12 or half the turn's damage,
    whichever is higher, and names the check a Focus Check (a Body Save).
  - The **Critical Condition** entry's stay-conscious check now reads "make a Focus
    Check (**a Body Save**) to stay conscious (DC 12, or half the total damage taken
    that turn, **whichever is higher**)".
  - Both previously used "unless the damage taken that turn exceeds 20, in which case
    the DC equals half the total damage taken", which had a latent gap: for a turn of
    21 to 24 damage, half is 10 to 12, i.e. **lower** than the base 12, so a bigger
    hit could produce an easier check. "Whichever is higher" removes that.
  - **Resolved 2026-07-30:** the author ruled **Body only, everywhere**. A Focus Check
    is always a Body Save, in Critical Condition and in Sustain alike. The app already
    implements this, so no change was needed. Accepted trade-off: Shapers are
    Mystique-primary and often have poor Body, so holding a Sustain under fire is
    genuinely hard. Manuscript action: drop the "Wits or Body Saving Throw (Shaper's
    choice)" phrasing from the Focus Disruption entry so it does not contradict the
    Focus Check definition.
- **Everything computed in this domain was already correct** and stayed untouched:
  the Reservoir formula, Flow Attack, Flow Save DC, the Intent/Delivery/Force FP
  bands, Precision Shaping, the Level 5 Layered Force gate, Overdraw (1d4 rising to
  1d6 at Stage 3), 3 Strain points per Stage, and Breakflow DC 12 + Stage.
- **Manuscript impact:** see M13.

### A9. #GRID and Cipher Library resynced (step 4, domain 3 of 7)
- **Files:** `app/js/engine.js`, `app/js/grid.js`, `app/data/grid.js`
- The largest domain in the audit: 42 findings, about a third already closed by A3
  (System Integrity) and A4f (LinkDeath). Findings that said "Max Complexity is Tier"
  were deliberately NOT applied, since the author ruled Tier + 1 in M1.

**Engine (three computed numbers):**
- **Stability Check DC modifiers were being lost on big hits.** The rig modifier was
  applied only to the DC 10 floor, so the moment the damage-derived DC took over it
  vanished. An Elite deck's Adaptive Buffer (-2) silently stopped working exactly when
  it mattered. Doc 3335: "DC equal to 10, or half the total damage taken that turn,
  whichever is higher"; the modifier belongs on the final DC. Verified: 40 damage now
  gives DC 18 rather than 20, and 4 damage still gives 8.
- **Sourcerers are Power Users holding Caliber-many Links** (doc 3331, named a Power
  User at 3286), with no hardware in the loop. They were computing as Standard Users
  with 1 Link, and the print sheet suppressed their whole #GRID block because its gate
  keys on userType. Verified at Level 10: Caliber 5 gives 5 Links.
- **Added Passive Systems** (doc 3292): 10 + Tech modifier + Systems Proficiency Bonus,
  the number compared against a hidden node's Scan DC. It did not exist in the app.
  Now a stat tile in the Hacking panel.

**Data (app/data/grid.js), all against Part 2:**
- **Scan DC table rekeyed from node tier to concealment** (3302-3307): Broadcasting
  (auto-detected), Obscured 12, Masked 15, Stealth-Routed 18, Ghosted 21, each with the
  doc's "Reads As" description. Scan DC measures how well something hides, not how
  powerful it is, so the old tier-keyed table was categorically wrong.
- **Scanning modifiers** now grant Edge or Snag only, never a numeric DC shift
  (3313-3317), and the Modifier Stack Cap is +2 Edge Dice on a Dice Pool with no
  stacking on d20 or Passive (3319).
- **IC triggers** on a node resisting a cipher EITHER by making its Cipher Save OR by
  turning aside a Cipher Attack that missed (3415). The app previously told players a
  whiffed breach roll was consequence-free.
- **IC Counterattack and Codebreaker Interception**: damage is rolled once, reduced
  once by the Firewall Damage Threshold, and interception only changes who takes the
  remainder (3428, 3435, 3439-3444).
- **Cascade Failure** is the recursive-check rule, not an automatic bricking: each
  severed Link's feedback adds to the turn's damage total and forces a fresh Stability
  Check on the survivors (3452-3454).
- **Stability Check** failure tears away ONE Link of your choice, graded by that same
  check's margin with no second roll, and triggers on damage from any source including
  LinkDeath feedback itself (3335-3338).
- **Costs corrected to System Integrity**: B&E Buddy Hardware Lockout 5 (3533),
  ICE-Breaker Algorithm 5 (3603). Standard User LinkDeath is rolled and subtracted from
  the Buddy's Integrity (3471).
- **Cipher ladder**: deleted the phantom "Rudimentary" tier, added the Craft-at-half
  column (25/50/75/100/150/250) and the Project Tier scaling (3643-3652).
- **Seven cipher entries taken off the retired damage model**: Logic Bomb, Shrapnel Code
  (1d6 to **2d6**, rolled once for the cone), Glitchstorm (4d6 once), System Cascade
  (5d6 / 3d6 once), Brute Force (ignores the threshold, half the roll rounded down),
  Black Sun (half its **maximum** Integrity, not current), plus Decoy Persona and
  Severance terminology.
- **Node Sweeper** auto-reveals every hidden node at Scan DC 12 + (3 x Buddy Tier) or
  lower instead of running a Cipher Save contest (3544).
- **Smaller fixes**: Crown Spike Array rolls IC damage twice and takes the higher
  (Edge does not apply to damage rolls, 3613); IC Inversion says "at Snag" rather than
  the non-existent "Disadvantage" (3770); "Firewall Damage Threshold" spelled in full.
- **UI**: the Scanning table headers now read Concealment / Scan DC / Reads As, and the
  Repertoire table gained CX and Craft columns so the new data is visible.
- **Verified live:** the retired phrases ("1 HP per hit", "must exceed the threshold",
  "durability HP", "Disadvantage") are all extinct in the data, `(Tier + 1)` survives
  intact, 36 ciphers load, and the reference panels render with no undefined or NaN.
- **Manuscript impact:** see M14 and M15.

### A10. Shields: Durability, Cover, and the Wear trait (author update)
- **Files:** `app/data/gear_armor.js`, `app/data/combat.js`, `app/js/engine.js`,
  `app/js/combat.js`, `app/js/store.js`
- The author rewrote Shields and Cover, added a **Shield Durability** subsystem, and
  added a **Wear X** gear trait. The app referenced Shield Durability in two shields'
  flavor text but never modelled it.
- **New subsystem, implemented end to end:**
  - **Wear Threshold** equals twice the maximum result of the Block die: 8 for 1d4,
    12 for 1d6, 16 for 1d8. Stored per shield as `wear`.
  - **Durability boxes**, 3 by default and 2 on the Scrap Shield, stored as `boxes`
    and tracked per shield name on the record as `ch.shieldWear`.
  - Blocking a hit whose **raw** damage meets the threshold marks a box, as does any
    Blocked critical. Damage below the threshold does not wear the shield.
  - **At 0 boxes:** a physical shield is destroyed and grants no Defense, Block or
    Cover, and its wreck is salvage; an **emitter or hardlight** shield goes dark
    instead and is not destroyed. Flagged per item with `emitter: true` on the
    Sentinel Barrier and Hardlight Barrier.
- **Shields now grant Cover:** Riot Shield gives **Half Cover** and Ballistic Bulwark
  gives **Three Quarter Cover** while in Full Defense, stored as
  `coverOnFullDefense`. Shield cover does not track Structure or Integrity.
- **Data fix found along the way:** the Sentinel Barrier had `price: 0`. It now carries
  its 𝒢90 buy-in alongside the 𝒢60/week upkeep, matching the leased-gear pattern.
- **Wear X trait** added to the armor trait glossary.
- **UI:** the defensive loadout chip shows Wear rating and boxes as filled and empty
  squares, and turns red reading DESTROYED or DARK at zero. The Block defense row
  gained a DURABILITY control with WEAR and REPAIR buttons, placed there because
  Blocking is the only moment a box can be marked.
- **Engine:** a dead or dark shield contributes no Defense bonus, no Block die and no
  Cover. Verified across the full lifecycle: fresh (threshold 12, 3 boxes, +1 DEF,
  1d6 Block, Half Cover), worn to 1 box (still live), destroyed at 0 (all benefits
  gone), and an emitter at 0 (dark, flagged as an emitter rather than destroyed).

### A11. Rollable saves and a Defensive Impulse resolver (usability)
- **Files:** `app/js/combat.js`
- The Defense panel listed saves and active defenses as static reference text. Every
  number had to be applied by hand at the table, and the defenses that resolve against
  a moving target (incoming damage) had no way to show their result.
- **Saving throws are now one tap.** Each save is a button that opens the existing roll
  tray preloaded with its parts: the attribute modifier, the class Save Focus Caliber,
  and any condition delta, shown separately rather than as one opaque total. Verified
  on a Shaper: Mystique reads "Mystique Modifier +3, Caliber (Save Focus) +3" for the
  +6 on the sheet. Conditions that impose Snag on a save open the tray pre-set to Snag,
  and an auto-failing save is greyed out and refuses the roll.
- **Active defenses are rollable, and resolve themselves.** A new Defensive Impulse
  tray takes the incoming damage, rolls the defense, and reports the net. The dice come
  from live gear rather than fixed text:
  - **Block** rolls the equipped shield's die and adds the flat bonuses (armor Block
    Bonus, Plated half-DR) and Armor DR, matching the rewritten pipeline where Block is
    an Active Mitigation rather than a passive add.
  - **Parry** rolls the equipped melee weapon's own damage die, by name.
  - **Ward** rolls d6 plus the attuned Focus die, by name.
  - **Resurge** and **Siphon** roll d6.
  - **Dodge** does not reduce damage; it reports the raised Defense instead
    ("Defense 14 against this hit, was 12").
- **Conditional outcomes fire automatically**, which was the point of the request:
  Resurge announces its rebound only when the damage actually reaches 0, and Siphon
  reports Vigor restored equal to the roll. Verified: Resurge on 1 damage gives
  "1 reduced by 5 -> 0 damage. Reduced to 0: the Flow attack rebounds for +3 Resonant
  damage."; Siphon on 10 gives "10 reduced by 5 -> 5 damage. Restore 5 Vigor."
- **Readability:** the saves column is now spaced rows with the total right-aligned and
  a "tap to roll" hint, instead of a cramped table.
- **Refactor:** `moxieFlags()` moved from inside the Attacks panel up to render scope,
  since Scoundrel Gambits apply to attack rolls, ability checks AND saving throws.
  Lucky Break and Press Your Luck are now offered on saves, which the rules allow and
  the sheet previously did not.

### A12. Rollable Skills, with aspect-gated Focus and Specialization (usability)
- **File:** `app/js/combat.js`
- Every Skills row now opens the roll tray, mirroring the saves. The itemised modifiers
  are the attribute modifier plus the proficiency tier bonus, which is exactly what
  `engine.derive` sums into the number printed on the row, so the tray total and the
  row can never disagree.
- **Untrained costs a Snag, not a number** (Proficiency Growth table, Part 2 doc 874:
  "Roll with **Snag**", pool method "+2 Snag Dice"). The tray opens pre-set to Snag.
- **Conditions reach checks only through Snag.** There is no check-side counterpart to
  the saves' flat `saveDelta`, so none was invented.
- **Skill Focus (+Caliber) and Specialization (crit 19-20) ride as opt-in ASPECT pills.**
  Both apply only "inside that focus" (Part 2 doc 675, 681) or "when your Specialization
  applies" (doc 659), and the sheet cannot know what the player is attempting. Weapons
  auto-apply theirs because the aspect matches a concrete weapon name; a skill has no
  such handle, so auto-applying would over-roll every out-of-aspect check.
- **Crit wording is now per-context.** Part 2 doc 95: "Skill checks can only achieve
  critical success results if you have appropriate tools, gear, or situational
  advantages. Otherwise, treat the roll as a normal success." The tray had been
  asserting "CRITICAL HIT" on any natural 20. Skill checks now read "CRITICAL THREAT"
  with the caveat printed; attack rolls are unchanged.
- **Also fixed:** Parry was offered to a character carrying only a shield but opened
  with no dice. The rulebook requires "a Simple Weapon, Martial Weapon, or physical
  Shield", so Parry now falls back to the shield die.

---

### A13. Classes resynced (step 4, domain 4 of 7)
- **Files:** `app/data/class_codebreaker_fury.js`, `app/data/class_hustler_operator.js`,
  `app/data/class_scoundrel_shaper.js`, `app/data/class_stitcher_resources.js`,
  `app/data/briefs.js`
- Audited all 7 classes plus the Class Resource Definitions chapter against Part 1
  (doc 1740-3037). All 22 subclasses were present and correctly named; the divergences
  were numbers, save DCs, and features replaced in the overhaul.

**Codebreaker**
- **Starting Smartdeck is Tier 0 (Standard), not Tier 1 (Improved)** (doc 2061, and
  Step 12 at doc 293: "Start with a Tier 0 Smartdeck and four Complexity 0 or 1
  Ciphers"). Corrected in all five places. The example ceiling follows: a Tier 0 deck
  runs Complexity 0-1, not 0-2. The (Tier + 1) formula itself was already right, and
  this now agrees with the M1 ruling and with the four starting Ciphers.
- **Two #GRID Weaver save DCs keyed off the Systems Proficiency Bonus instead of
  Caliber** (Memetic Virus doc 2155, Sensory Rejection doc 2160). Every other DC in the
  chapter uses 8 + Tech modifier + Caliber.
- **Deck repair and hijack thresholds are measured in System Integrity, not Durability**
  (doc 2101, 2131). Durability is the shield track; a deck has no such stat, so the old
  text priced repairs against a number that does not exist.
- **Rigger drone rebuild** regained its Snag Dice guidance and failure consequence (doc 2112).
- **Deleted the `startingEquipment` array.** It was an older-draft kit that contradicted
  the manuscript, was the only such field on any class, and was read by no code in the
  app. `kits.js` already carries the manuscript's Codebreaker Kit exactly.

**Fury**
- **Juggernaut Level 3 was the wrong feature entirely.** The app had "Brace for Impact";
  the manuscript has **Immovable** (doc 2276-2279), an Impulse Action for 1 Overdrive
  that refuses forced movement and Prone, returns Body-modifier damage to a source in
  reach, anchors an adjacent ally, and makes the Juggernaut an obstacle so anything
  shoved into them stops and takes the full 1d6 Bludgeoning per space denied.
- Arsenal's Walking Emplacement said "Sprint", now **Dash**.

**Hustler**
- **The progression table was wrong on two columns.** Caliber ran 1,2,3,4,5,5,5,5,5,5
  instead of the standard ladder 1,1,2,2,3,3,4,4,5,5, and Training Points sat on levels
  2/4/6 instead of 3/6/10 (doc 2356-2365). Display only: `engine.caliber()` reads the
  global ladder, so no computed value was affected, but the class tab was showing a
  Level 5 Hustler Caliber 5 instead of 3.

**Operator**
- **Three save DCs corrected or supplied:** Vanguard CQC Takedown keyed off the
  Athletics Proficiency Bonus instead of Caliber (doc 2532); Headhunter Disarming
  Precision (doc 2558) and Cornered Prey (doc 2560) named a save with no DC at all.
- Execution's max formula regained its "(minimum of 1)" floor, matching the other five.

**Scoundrel**
- Dropped "and bad neighborhoods" from the subclass intro (doc 2632); Level 1 Training
  Points cell now reads 0 rather than blank.

**Shaper, and the Sourcerer rewrite**
- Training Points moved from level 7 to level 6 (doc 2737-2738).
- **The Sourcerer was substantially rewritten in the overhaul.** Level 1 loses the
  older-draft Nixie Boon / Gremlin Bane and gains **Synthetica** (the Unique Resonance)
  plus **Sprite Tether**: Power User standing, Links equal to Caliber, a Flow Attack to
  open a tether with no deck, and LinkDeath landing on the body rather than hardware
  (doc 2831-2837). Level 3 "Hardware Harmonization" is now **Quick Favors + Deeper
  Standing** (doc 2865-2868); its old contents became Synthetica's Empowered Effects.
- Absolute Symbiosis frees "any **Synthetica** Invocation", not "any Invocation with a
  Tech delivery method" (doc 2894).
- **Four saves that named no DC** now say "against your Flow Save DC" (Primal Eruption,
  Sensory Overload in both the feature and the familiar entry, Absolute Symbiosis).
- The Skyhook familiar's invented drone rotors are gone (doc 2879).
- `coreChanneling` now states the Sourcerer carve-out: Synthetica counts as one of the
  three Level 1 Base Resonances, so a Sourcerer picks only two more.

**Class Resource Definitions**
- **The Scoundrel's Moxie had no entry in `EN.resourceRules.byClass` at all**, though
  the chapter defines it in full (doc 1929-1947). Added, and the summary table's
  Scoundrel row regained its Refresh column.
- Execution "fuels **Calls**", not "Tactical Maneuvers", and its example list was stale
  (doc 1896-1901). The Examples in Play line names **Intercepting Guard**, not Brace for
  Impact (doc 1998).

**Briefs (`app/data/briefs.js`)**
- Brief text is what a player reads at the table, and several briefs carried the wrong
  mechanic: the Icon's Plot Armor and Do Not Look Away both said a **Wits** save where
  the manuscript says **Charm** (doc 2789-2790, 2795-2796); the three Operator DCs above;
  Absolute Symbiosis's Swift-Action clause; and "Brace for Impact" replaced by Immovable.

**Checked and already correct** (recorded so the coverage is auditable): all 22 subclass
names; every Vitality, Resilience and save-focus line; every resource formula and its
worked example (Leverage 7, Overdrive 8, Execution 5, Triage 4, Bandwidth 10); the
Caliber ladder in six of seven tables; all eight Operator Calls with their action types
and costs; the entire Stitcher entry including all twelve Triage Protocols; and the
Shaper's (Caliber x 3) + Flow Modifier pool.

**Held back for an author call** (mechanically inert, so not applied unilaterally):
the Fury, Operator and Shaper taglines are older-draft paragraphs; the three Codebreaker
subclass descriptions carry an added second paragraph the manuscript does not have; the
Fury entry has no Playbook block where the other classes do; the Scoundrel's Moxie intro
states a blanket "each Gambit costs 1 Moxie" default the chapter never states; and the
"Classes of Elysium" overview (doc 1746-1810, the "Play a X if" hints) has no home in
the app. None of these change a number.

**All five closed by the author's correction report, 2026-07-31. See A15.**

---

### A14. Synthetica, the Sourcerer's Unique Resonance (step 4, domain 4)
- **Files:** `app/data/flow.js`, `app/js/flow.js`, `app/js/builder.js`
- The overhaul gave the Sourcerer a **Unique Resonance** (doc 2839-2860) that the app did
  not model at all. Its absence meant the Free-Shaping interface could never offer a
  Sourcerer their signature Resonance.
- **Data:** added `synthetica` with focus "Favor and Malfunction", Electric / Fire damage,
  a Tech-save resolution, the targeting restriction (a valid target carries, wears, or is
  installed with powered tech, or is itself a device, drone, Proxy or Construct), the
  Base Effect trio (Ask Around / Nixie Favor / Gremlin Jinx), the three Empowered Effects
  (Nixie Synchronization, Gremlin Tantrum, and Poltergeist which unlocks at Level 3), and
  **Favors Travel Light** (1 FP to fold a Favor or Jinx into any other Resonance's
  Invocation, allowing no save, one per Invocation).
- **Stability Factor (Short Attention Spans):** Synthetica Empowered Effects cannot use
  the Sustain duration (doc 2851), recorded the same way Temporal's is, with all three
  effects listed in `sustainCompat`.
- **A new `unique` field marks a Resonance as subclass-owned.** The doc is explicit that
  "no other Shaper can learn it, buy it, or steal it", so a Unique Resonance is granted,
  never picked, and is hidden entirely from any other subclass rather than shown greyed
  out. Verified both directions: a Sourcerer sees eight Resonances, a Harmonist sees the
  standard seven.
- **It spends a Level 1 slot** (doc 2833: "It counts as one of the three Base Resonances
  every Shaper knows at Level 1, so you choose only two more"). The builder's picker now
  shows it as a granted gold chip and drops the standard pick cap by one, so a Level 1
  Sourcerer picks 2 and a Level 6 Sourcerer picks 4, five Resonances in total either way.

---

### A15. C1-C5 class-copy corrections (author report, 2026-07-31)
- **Files:** the four class data files, `app/data/briefs.js`, `app/data/class_picker.js`
  (new), `app/js/builder.js`, `app/js/pdfexport.js`, `app/js/printsheet.js`, `app/index.html`

**One of my five held-back items was wrong.** I reported that the Fury had no Playbook
block. The manuscript has all seven. The Codebreaker's alone is marked as a heading
(`### **The Playbook**`) while the other six are bold paragraphs, so a structural read
finds one and misses six. The correct count was the other way round: the **app** was
missing three Playbooks (Codebreaker, Fury, Stitcher), all now copied verbatim.

**The dating test settled C1.** The app's class copy could not be shown to be an older
draft from the manuscript side, so the author supplied a 14-row table of strings that
changed between 2026-07-10 and 2026-07-14. The app hit **9 of 14**, including the fully
retired feature name "Battlefield Command" and three rows that predate 2026-07-11. The
snapshot is therefore a pre-July-11 manuscript state, not app-authored text, so the
Fury and Operator taglines were safe to overwrite. Two independent corroborations: the
app's Fury tagline ends "You do not train to fight fair; you train to hit hardest",
a precursor of the current sentence, and its Operator tagline reads "designed to
survive contact" where the manuscript now reads "built to survive contact". All nine
stale strings replaced; the test now returns 0 of 14.
- Retired **Battlefield Command**: the Operator's Level 1 feature is **Execution**, which
  the class data already called it. The dead name survived in three lookup tables
  (`briefs.js`, and the `ACT_OVERRIDE` maps in the PDF and print-sheet exporters).

**C2:** the three Codebreaker subclass descriptions each carried a second paragraph. Every
one of the 22 subclasses in the book is a single epigraph paragraph; all 22 now are in the
app. Note the counting hazard the author flagged: in the overview chapter a subclass is
"one description plus one Play-if line", not "one paragraph".

**C4 inverted, and the app was right.** The Scoundrel chapter states no blanket Gambit
cost, but four of the five other resource classes do state one, so the app had patched a
hole rather than invented a rule. The author ruled the manuscript adopts the line. The
app's wording is now the manuscript's, hedge included: "Unless otherwise noted, all
Gambits cost 1 Moxie to activate."

**C5: Classes of Elysium is now the copy layer for the pickers**, not a page. New
`app/data/class_picker.js` carries the two framing paragraphs, seven class blurbs and
Play-if lines, and 22 subclass blurbs and Play-if lines, verbatim. The class-selection
step shows the framing paragraphs as its header; each card leads with its Play-if line
and reveals the overview paragraph when selected. Same shape for the subclass cards,
which also surface the Shaper's Flow Attribute tag (the Shaper is the only class whose
subclass names carry one, and it contains its own colon, which is a parsing hazard).
- The reasoning, from the report: the book carries three copy layers per class, and the
  app had two. **Choosing** (the overview blurb and Play-if line, for a player who has
  not decided) was the missing one; **Arriving** is the chapter epigraph on `tagline`,
  and **Playing** is the Playbook. The Play-if lines are the only text in Part 1 written
  for the moment of the decision itself.
- Author rulings **M-A1 / M-A2** applied: "Play the Arsenal if" and "Play the Lifeline
  if" normalised to "Play an Arsenal if" and "Play a Lifeline if". All 29 labels now
  carry the manuscript's own article.

**Manuscript-side edits the author ruled in this batch** (for the tracker, not the app):
M-C4 appends the blanket Gambit line to the Scoundrel's Level 1 Moxie paragraph; M-A1
and M-A2 are the two Play-if article fixes above.

**All three verified applied to the live manuscript 2026-08-01, and verified against the
app the same day.** No app change was needed; the checks below are recorded because the
rulings each named something specific to confirm.
- **M-C4, the hedge:** the app's line reads "Unless otherwise noted, all Gambits cost 1
  Moxie to activate", matching the Hustler's and Stitcher's wording.
- **M-C4, no deduplication:** all ten Gambits are present, all at cost 1, and every one
  still states "spend 1 Moxie" in its own text. The manuscript deliberately follows the
  Codebreaker's blanket-plus-restate shape, so the per-entry costs must NOT be collapsed
  now that a blanket line exists.
- **M-C4, the scope boundary:** the blanket line governs Gambits only. Verified that the
  Shiv's Level 7 **Cripple stays at 2 Moxie**, and that the five other subclass spends
  (The Getaway, Press Your Luck, Lucky Charm, Fight Dirty, Pressure) each state their own
  1 Moxie rather than inheriting it.
- **M-A1 and M-A2:** 29 Play-if lines, 7 class-level and 22 subclass. Zero "Play the"
  forms, and exactly three "an" forms: the Arsenal, the Operator and the Icon.
- **Invariant asserted, per the ruling's request.** `app/data/class_picker.js` now checks
  at load that all 29 lines match `Play (a|an)` and warns if a "the" form or a missing
  line reappears. Verified it stays silent on the live data and fires on both failure
  modes. The file is generated, so a load-time guard is the only thing that catches a
  regeneration or a hand edit.

---

### A16. Species and Lineage Evolution resynced (step 4, domain 5 of 7)
- **Files:** `app/data/species.js`, `app/data/briefs.js`
- Audited all 5 species (doc 575-1389) and the whole Lineage Evolution chapter
  (doc 3478-3671). **Structurally the app was complete**: 5 species, 15 lineages, 123
  features, with no feature present in the doc and missing from the app or vice versa.
  A programmatic diff of all 60 species-chapter bullets against their Lineage Evolution
  twins found the manuscript self-consistent in every lineage but one (see below).
- The divergences were almost entirely **stale pre-overhaul vocabulary**, and they fell
  into four repeating classes. Counted against the manuscript before applying:

**1. "Will Save" does not exist** (0 occurrences in the manuscript; "Mystique Save" 9).
Three features carried it: Volcanic Temper, Uncanny Presence, Stasis Lock. Note the DC
formula was already right in each case (8 + Mystique modifier + Caliber), so only the
save's name disagreed with its own DC.

**2. "Exhaustion" is not the condition; Fatigue is** (0 vs 12). Radiation Callouses,
Ration Discipline and Hearthglow all named it. Ration Discipline mattered most: "Edge on
Body Saves against Exhaustion" reads as applying only at Fatigue level 4, which is
labelled Exhausted, rather than to every Fatigue save.

**3. "Slowed" does not exist** (0 vs Dazed 11). Hyper-Kinetic Metabolism purged the wrong
condition. Its app text also added "on your turn", a restriction the manuscript does not
impose.

**4. Targeting widened from ally or enemy to "any creature"** in seven features: Phase
Veil, Guardian Protocol, Threat Projection, Smelter's Hands, Light-Fingered Relay, and
Heavy Payload in three places. This is a real play difference, not wording: the app's
Light-Fingered Relay would let a Ryn plant an item on a hostile as a Free Action, and its
Threat Projection would let you taunt an ally.

**Plus three of their own:**
- **The Encumbrance features contradicted the app's own math.** The manuscript grants a
  flat +2 Encumbrance Threshold, with the Size-larger bonus applying to grappling ONLY
  (doc 661, 951). Both Synthetic Musculature and Heavy Payload displayed "one Size larger
  for Encumbrance Thresholds and grappling" instead, while `engine.js:758-759` was already
  computing the flat +2. Verified live: the feature adds exactly +2 (threshold 9 to 11),
  which the text now says. The Open Architecture Integration clause carried the same error.
- **Entropic Lash blocked "Hit Points"**, a resource this system does not have (0
  occurrences in the manuscript). It should block Vitality or Wounds.
- **Briefs dropped usage limits and action types** on six Outsider features (Volcanic
  Temper, Cinder Shroud, Volcanic Surge, Stasis Lock, Riddling Tongue, Probability Nudge).
  Volcanic Surge's is the only per-Short-Rest limit in the section and it was missing
  entirely; Probability Nudge lost the unusual Special Action type. Restored, with action
  types written out in full. Two briefs also said "non-magical restraints" where the
  manuscript says "non-Flow".

**Held for an author call:**
- **Biometric Spoofing is the manuscript's one self-contradiction here.** The species
  chapter (doc 1026) ends with "Machines are your specialty: you copy the measurable body,
  not the behavior, so people who personally know the Target may still feel something is
  off." The Lineage Evolution copy (doc 3592) drops that sentence. The app follows the
  evolution copy. The caveat matters because it bounds Biometric Spoofing against Method
  Actor, so which copy wins is a real ruling.
- **Ryn size.** `rules.js:177` allows `["Small", "Medium"]`. The manuscript describes Ryn
  at 5 to 6 feet (doc 1196), which is Medium by the same height banding the app already
  applies to the Hulsk (Large, over 6 feet) and the Skarn (Small, 3.5 to 4.5 feet). But
  the doc never states Ryn sizes explicitly, so this is inference, and removing the option
  would invalidate an existing Small Ryn. Not applied.

**Correction to my own earlier report:** I said the Cinder-Heart lineage was missing from
the app. It is present at `species.js:504`. My count used a regex that did not match the
hyphen in the `"cinder-heart"` key, so I under-counted the Outsiders at two lineages.
All 15 lineages and all four Cinder-Heart creation features were already correct.

---

### A17. The Size system (author spec, 2026-08-01)
- **Files:** `app/data/rules.js`, `app/data/species.js`, `app/js/engine.js`,
  `app/js/builder.js`, `app/js/combat.js`, `app/js/codex.js`, `app/js/store.js`
- Replaces the old behaviour, which treated every Freelancer as Medium with an ad hoc
  `["Small","Medium"]` exception on Ryn.

**Size is now derived, never chosen.** The player picks a height inside their lineage's
printed range and the band resolves the category. `ch.heightFt` is the new stored field;
the legacy `ch.size` is honoured only when it is still legal for the lineage, so existing
characters keep their Size until a height is set.

**The scale is five entries** (Tiny, Small, Medium, Large, Huge) with the height bands and
a boundary-takes-larger rule, which a strict less-than cascade gives exactly: 2 ft is
Small, 4 ft is Medium, 8 ft is Large. Verified against all three of the spec's assertions.
Tiny and Huge exist only for NPCs, drones and vehicles; no lineage can reach either, since
lineage heights span 2 to 10 ft.

**All 15 lineage height ranges added**, with `lineageSize` derived from them. Verified in
the browser that every listed `allowedSizes` equals the cascade applied to both endpoints
of its own range: zero mismatches. Ten of the fifteen changed, the largest being Humans,
who were Medium-only and are now 3 to 7 ft, so a 3 ft human is Small. Harbingers have no
variance and their picker is locked at 6 ft, at both the UI and the model layer.

**Encumbrance Threshold is 6 + Body Modifier +/- 1 for Size, floored at 3, then gear steps
of +2 on top.** The floor lands after the Size adjustment, which is the case the spec calls
out: Small with Body -3 gives 3, not 2. Verified live. The Size adjustment is a raw +/-1
and never enters the steps array, so it cannot be doubled by step math.

**Reference rules** (footprints on square and hex, multi-space measuring, tight geometry,
the maneuver gate, drag and lift, moving through an occupied space, the Body Gate table,
Meat Shield, and the seven features that shift effective Size) are carried as data and
surfaced in a new Codex panel. The comparison rules stay text-only, a soft block, because
features explicitly grant exceptions to them.

**The section 10 non-rules are respected**: no Edge or Snag from Size, no Defense modifier,
no Speed modifier beyond the tight-geometry halving (which is left to the GM and is
deliberately not Difficult Terrain), no attack, damage or save modifier, no Tiny or Huge
player characters, and no default Size anywhere.

**Four defects an adversarial verification pass caught in my own first implementation**,
all fixed and re-verified:
- **A silent default.** `derive()` fell through to the lineage's first allowed Size when no
  height was recorded. That is exactly what the spec forbids, and it was not a rare state:
  every freshly built character sat in it, receiving a real Encumbrance adjustment nobody
  chose. Now no height and no legal legacy pick means no Size, and the sheet shows a dash.
- **`speciesSizeDisplay` was dead data.** The species Size line rendered from
  `species.js`, and three of the five strings disagreed with it. The builder now takes the
  category from `rules.js` so there is one source of truth.
- **Outsiders advertised "Small to Large"**, which no Outsider can reach: their tallest
  lineage tops out at 7 ft, inside Medium.
- **An imported record with no lineage and a bogus height could mint a Huge character**,
  because an unvalidatable height was trusted. It is now ignored.

**Still open, per the spec:** vehicles carry no Size and use a separate mass scale. Not
unified, and not attempted.

---

### A18. Biometric Spoofing and the Persona resource (author spec, 2026-08-01)
- **Files:** `app/data/species.js`, `app/data/briefs.js`, `app/js/face.js`,
  `app/js/store.js`, `app/js/combat.js`
- Closes the Biometric Spoofing item held for a ruling in A16. **No mechanic changed**;
  the manuscript edit restored one sentence, and the real work was modelling Persona.

**The restored sentence.** Biometric Spoofing now ends "Machines are your specialty: you
copy the measurable body, not the behavior, so people who personally know the Target may
still feel something is off." The app followed the Lineage Evolution copy, which lacked it.
This is the only printed text separating Biometric Spoofing from Method Actor, which
otherwise share a resource name, a 10-minute observation, a Caliber cap and a 30-day decay,
so it is now in the feature text and in the brief. The brief also regained the organic-only
restriction on the scan, which Method Actor deliberately does not have.

**Every other printed value was already correct** and is recorded here so the coverage is
auditable: both features at 10 minutes, storage equal to Caliber score, overwrite at any
time, a new physical scan versus fresh observation to recover, 30-day decay, Edge on the
listed skills, and Method Actor's once-per-scene suspicion reroll. `rules.js` already
restricted character creation to the four species-chapter features, so **Method Actor is
correctly not selectable at level 1**.

**Persona is now a tracked resource**, on the Social tab. `ch.face.personas` holds
`{ id, sourceFeature, subjectName, daysLeft, isActive }`. The panel only appears once the
character actually has Biometric Spoofing or Method Actor.
- **The cap is read from live Caliber at render**, never stored, so it tracks level
  advancement. Going over the cap shows a warning instead of truncating, because deleting
  a Persona is unrecoverable without redoing the acquisition in fiction.
- **One assumed at a time.** The toggle clears every other entry in the same write, so the
  state cannot show two actives. No action cost is attached, because the rules print none.
- **`migrate()` sanitizes the list ahead of its own early return**, since a hand-edited or
  imported record must not smuggle in a malformed entry or a second active Persona.
  Verified against a deliberately corrupt import: a null entry dropped, a bogus source
  coerced, a numeric name and a string `daysLeft` cleaned, and the second active cleared.

**Where it deliberately does NOT live**, following the spec's collision warning. Persona
means four unrelated things in this manuscript, and an audit confirmed the app had no
conflation in code, only prose, so this is a greenfield model whose only risk was forward
looking. It is kept out of `ch.grid` (whose own data already defines Personas as #GRID
avatars), out of `ch.equipment` (where the cipher names Spoof Persona and Decoy Persona are
live inventory keys that a subject name could alias), and out of `featureUses` (which is
keyed per feature name and is wiped on every Long Rest, which would both split the cap and
destroy a 30-day resource).

**Two modelling choices the manuscript does not settle, made explicitly rather than
silently, and both flagged in the panel text:**
1. **Separate pools per feature.** Each feature independently grants storage "equal to your
   Caliber score", which reads either as Caliber total or Caliber each. Separate pools were
   chosen because the profiles differ in kind, a body versus a behavior. A ruling would
   change the cap by a factor of two for a character holding both.
2. **The 30-day decay counts down one day per Long Rest.** The spec says in-world days, but
   the app has no in-world calendar; the Long Rest is its only in-world day unit, and gear
   leases already work exactly this way. Wall-clock time would have decayed Personas by
   real-world days, which is not what the rule means.

**Both of those were settled by the revised spec, 2026-08-01. See A20.**

---

### A19. A story calendar, so downtime moves the day clocks (author request)
- **Files:** `app/js/combat.js`
- Tying day counters to the Long Rest button meant a stretch of downtime that advanced the
  story without a rest left every clock frozen. There is now a **DOWNTIME** control beside
  SHORT REST and LONG REST that advances the calendar directly, with 1 / 7 / 30 day presets
  and a free entry up to a year.
- **It applies to every "one day per Long Rest" timer, not just Personas.** Both current
  systems are covered: gear lease installments and Persona decay.
- **One shared clock.** `tickDays(c, n)` is now the single place that knows which systems
  count days, and the Long Rest calls it with 1 rather than ticking each system itself. Any
  future day-based timer is registered in that one list and both paths get it for free.
- **Ticked a day at a time, never by arithmetic**, because the per-day rules are not linear:
  a lease that comes due stops counting until it is paid, and a Persona stops at 0 instead of
  going negative. Verified over a 7-day span that a 3-day lease came due and stopped, and a
  3-day Persona expired at 0 while a 30-day one correctly read 23.
- **Downtime restores nothing.** It moves clocks only, so a GM can skip weeks without
  handing out recovery the fiction did not include. Verified that Vitality, Wounds and Flow
  were untouched across a downtime advance, and that a Long Rest still advances exactly one
  day and still restores normally.

---

### A20. The Persona ruling, and rules the app knows that the book does not
- **Files:** `app/js/face.js`, `app/js/store.js`
- The revised spec settled the two questions A18 had left open, and one of the answers
  reversed what I had built.

**Author ruling, 2026-08-01: one Persona may be active PER FEATURE, and they need not be
the same person.** A Lifelike with both features can wear one person's fingerprints and
another's mannerisms at once. My first cut enforced one active in total, which was wrong.
The toggle now clears only the other Personas from the same source, and the import
sanitizer de-duplicates actives per source rather than globally. Verified both directions:
a body Persona and a behavior Persona of two different people run together, while picking a
second body Persona still replaces the first and leaves the behavior one alone.

**Running both is coverage, not magnitude, and is not implemented as a bonus.** Nothing
sums or escalates. **Correction, 2026-08-01: the justification I gave here was wrong.** I
wrote that "Edge does not stack" and put that sentence in the panel and in code comments.
That sentence was drafted for the manuscript and deliberately cut, because it is false out
of combat, where Dice Pool Edge accumulates to +2 Edge Dice. Removed everywhere I had
repeated it. See A21.

**Duplicate selection was already blocked.** The Talents chapter's "one **unpicked**
Additive Feature" wording forbids taking a creation pick again at Lineage Evolution.
Verified live: a Lifelike who took Biometric Spoofing at creation is offered the other seven
features and not that one. This is general to every lineage, not a Lifelike case.

**The four tiers are now labelled in the code**, because this feature pair is one the app
knows better than the book does, and a later sync must not "correct" it toward a manuscript
that never covered the case:
- **[PRINTED]** storage, overwrite, decay, Edge, no action cost.
- **[RULING]** the simultaneous-Persona rule, recorded in `claude/locked-rulings.md` and
  deliberately never added to the manuscript.
- **[INFERRED]** separate pools per feature rather than one shared pool.
- **[APP]** the decay ticking one day per Long Rest or per day of downtime.

**Neither unprinted rule is enforced silently.** The panel carries a gold **NOT IN THE
BOOK** note stating the simultaneous-Persona ruling in the player's own words, and a
**READING** note marking the separate-pools count as an interpretation rather than a printed
rule. A player asked "can you do that?" at the table now has an answer better than "the app
let me."

**Superseded 2026-08-01: the ruling is now printed. See A21.**

---

### A21. Both Persona entries rewritten in print, and a false claim of mine removed
- **Files:** `app/data/species.js`, `app/data/briefs.js`, `app/js/face.js`
- The revised spec supersedes A20. Both feature entries were rewritten in the manuscript,
  and the simultaneous-Persona rule is no longer an unprinted ruling: it is the third
  paragraph of Method Actor.

**Both texts replaced wholesale** with the printed wording. Verified the Biometric Spoofing
body is character-for-character identical to the spec once whitespace is normalized (809
characters both). Two substantive changes beyond phrasing:
- **Recovery is now a timed action, not a vague redo.** "Recovering a deleted file requires
  another 10 minutes of scanning" (Biometric Spoofing) and "another 10 minutes of
  observation" (Method Actor). The app had said "a new physical scan" and "fresh
  observation", which lost the 10-minute cost.
- **The verbs are deliberately different.** Biometric Spoofing SCANS a body, Method Actor
  OBSERVES a person, and each recovers the way it acquired. Kept in the UI copy, since it
  is the fastest way to convey that one reads bodies and the other reads people.

**A drift check between the two Biometric Spoofing copies must normalize whitespace.** They
match on wording but differ in paragraphing on purpose: one paragraph in the species chapter,
where it sits inside a bulleted list of four, and two in Lineage Evolution, split before
"While assuming a Persona." A byte comparison would report a false positive forever.

**I had propagated a sentence that is false.** In A20 I justified the no-compounding rule
with "Edge does not stack on a Deception check", and put it in the Persona panel, in code
comments, and in this changelog. That sentence was drafted for the manuscript and
deliberately cut, because it is false out of combat, where Dice Pool Edge accumulates to
+2 Edge Dice. Removed from all three. The rule it was supporting is unchanged and still
correct: a second Persona buys coverage across two skill lanes, never a bigger number, which
is what the printed line means by covering more ground.

**The panel no longer flags the rule as house policy.** The gold "NOT IN THE BOOK" chip is
now a cyan **ONE PER FEATURE** rule chip carrying the printed wording, and the Method Actor
brief gained the interaction line. Only the pool count is still marked as a **READING**,
since that remains an inference rather than print.

**Tiers reduced from four to three**, matching the spec: printed and canonical, inference,
and deliberate absence (no action cost, where the book's silence is the rule).

---

### A22. The "creature" terminology rule (enforced, 2026-08-01)
- **Files:** `app/data/species.js`, `app/data/briefs.js`, `app/data/rules.js`,
  `app/js/combat.js`, `app/js/builder.js`
- The manuscript sits at **zero occurrences** of `creature` / `creatures` across all three
  parts. The app had **40**. Now zero, verified by the rule's own self-check.

**Distribution before:** species.js 24, briefs.js 11, combat.js 2, rules.js 1, builder.js 1.

**A blanket find-and-replace would have been wrong.** Every one of the 39 rules-text
occurrences already had a manuscript counterpart, so the book had made every call, and it
uses **five different resolutions**, not one:

| Resolution | Count | When the book uses it |
| --- | ---: | --- |
| `Target` | 18 | the entity a rule actually resolves against |
| `anyone` | 11 | passive senses and pass-through, everybody in range |
| `organic Target` | 5 | where the rule must exclude machines and programs |
| noun deleted | 4 | where the sentence reads better without it |
| `an enemy` | 1 | where the book named the side instead |

**Breaching Charge is the proof**, and was verified directly at doc 3586: one sentence pair
uses "passing through the spaces of **anyone** smaller than you" and then "The first
**Target** you pass through... takes 1d8 Bludgeoning." Replacing `creature` with `Target`
everywhere would have silently narrowed 11 clauses from "everybody in range" to "a chosen
target".

**Two traps worth recording** for anyone auditing later:
- **Blood-Scent Tracker** invites `organic Target` because the fiction is scent-based. The
  book deliberately says `anyone`, which keeps Synthetics with Vitality inside the effect.
- **Predictive Targeting Integration** is duplicated verbatim in `species.js:71` and
  `rules.js:162`. Both had to change together or the survivor reintroduces the word.

**Near-neighbour audit came back clean.** No `beast`, `monster`, `animal` or `being` has
been promoted into a rules referent anywhere in the app; every occurrence is metaphor or
descriptive prose, matching the manuscript's own pattern. The rules-slot smell test returns
nothing.

**Two riders applied with the author's approval**, both cases where the manuscript's
replacement clause carried a second correction alongside the terminology one:
- **Hulskpitality** dropped a stray "first". The app read "until you or one of your declared
  charges harms them **first**"; the book reads "harms them." The app's version implied a
  race in which the guest striking first could also void guest-right. The book's is
  one-directional.
- **The Hydraulic Throw brief** regained "unattended" and "your Size". It had read
  "same-size-or-smaller object", losing both the word that stops you hurling a held weapon
  and the clarity about whose Size is meant. The full feature text was already correct;
  only the compressed brief had drifted.

**One occurrence was out of scope and tidied anyway:** `builder.js:619` was a source comment
("effective creature Size"), which is not rules, ability, trait, table or gear text and never
renders to a player.

**Author intent, recorded 2026-08-01 so a later audit does not have to reconstruct it from
the diff.**

*The rule is about the slot, not the word.* `creature` is not banned outright. What is banned
is `creature` occupying the **universal rules-referent slot**, because that is D&D's signature
construction ("each creature in the area makes a save") and Elysium already has `Target` for
that job. `Target` can cover a door, a Node, a drone and a hull; `creature` structurally
cannot, since it carries organic and alive as implied constraints. Avoiding its common use in
favour of a strict criteria is what keeps the voice distinct. This is why the sweep replaced
39 rules-text occurrences and why the near-neighbour audit mattered equally: the failure mode
is any word being promoted into that slot, not this particular word existing.

*The permitted-`creature` exception stays open.* Not closed into a flat ban. It has zero
exercises today, but it is deliberately available for descriptive fiction meeting the strict
criteria, so a future bestiary can write "the creature has no face" without a house-rule
argument. Closing it early would only force a re-litigation.

*`beast` carries a specific register, and it is load-bearing.* The near-neighbour guidance
lists `beast` as "allowed as metaphor", which undersells one of its two manuscript uses:
- **doc 1083, the register use:** "Chimera are not failed humans or clever **beasts**." Here
  `beast` is the derogatory term for engineered people, and the manuscript's stance is to
  **name it in order to reject it**. This is not incidental metaphor and must not be edited
  away as though it were.
- **doc 2780, the ordinary metaphor:** "an audience is a hungry, fickle **beast**." Unrelated
  register, no charge attached.

The author's framing: Chimera read as beasts rather than as creatures, and the derogatory
sense is not on the table as a neutral descriptor. An auditor working only from the
near-neighbour rule would have read 1083 as incidental and might have flattened it.

---

### A23. Talents resynced (step 4, domain 6 of 7)
- **Files:** `app/data/talents.js`, `app/data/briefs.js`, `app/js/builder.js`
- All 63 talents and 7 categories were present and correctly named; the divergences were
  mechanics, not structure. 43 findings survived adversarial verification, 14 of them high.

**Three talents had lost or broadened a printed mechanic:**
- **Akimbo Specialist was missing its first bullet entirely.** The manuscript opens with
  "Increase your Body or Agility score by 1, to a maximum of 20" (doc 3066). The app went
  straight to the Defense bonus, so the talent silently cost a player a +1.
- **Echo Sighted granted Edge on all d20 checks** where the book grants it only on
  **Awareness** checks (doc 3271).
- **Crowd Reader hardcoded a Charm (Insight) check**, dropping both choices the book offers:
  "an Insight or Intuition check using Charm or Wits" (doc 3389). That matters because the
  same talent can raise either Charm or Wits.

**Lockdown Specialist's Upgrade was a different mechanic.** The manuscript grants one
Opportunity Attack per round **without spending your Impulse Action** (doc 3185). The app
instead granted **Caliber-many Opportunity Attacks per round, to a maximum of 3**, which is
a substantial power increase the book never gives.

**Three terms in the app do not exist in the manuscript at all**, verified at zero
occurrences across all three parts: **"Hull Point"** (Asphalt Rider; vehicles use Integrity,
99 occurrences), **"Strain Threshold"** (Augment Specialist brief; the mechanic is reducing
Total Static for your Static Threshold), and **"Saving Throw Proficiency"** (Hardened
Survivor brief; the term is Saving Throw Focus). A fourth, **"Source Coder"**, was a stale
class name in Parallel Processing's requirement; the subclass is the **Sourcerer**.

**Briefs were inventing mechanics, which is worse than drift** because a brief is what a
player reads at the table. Arsenal Adept advertised a per-Short-Rest limit and "Proficiency
Bonus twice to damage" where the book gives once per turn and Caliber. Toxicologist invented
a flat DC 14 where the book scales it. Close-Quarters Brawler named the wrong skill and
Restrained both combatants instead of one. Laceration Expert promised Caliber-many Bleeding
stacks instead of one. All corrected.

**Also fixed:** Operator resource abilities are **Calls**, not "Tactical Maneuvers", in two
talents; Static Grounding said "magical effect" where the book says resonant; the Armor
Piercing brief said "non-magical armor DR" (the one `non-magical` deliberately left out of
the A22 terminology sweep as out of domain, now in scope and corrected).

**One engine fix: replacing a Talent now clears its Upgrade.** The manuscript is explicit
that "If you replace a Talent that you have Upgraded, you lose both the base Talent and its
Upgrade" (doc 3054). The app dropped the base correctly and the Upgrade stopped applying,
but the Upgrade slot kept its stored reference, so the pick was silently wasted while still
reading as a completed choice. Clearing it also returns that slot to selectable. Verified
the sweep clears the orphan, leaves an unrelated Upgrade untouched, and is a no-op when
re-selecting the same Talent.

To be precise about what that clause means, since the phrasing invites a misread: Retraining
swaps Talent A for Talent B, so you keep a Talent. What you lose is A **and** the Upgrade you
bought for it. The Upgrade does not transfer to B and the slot is not refunded as an Upgrade
for B. It is a cost warning: upgrading a Talent makes retraining it cost two picks to change
one.

**[APP POLICY, deliberate] Retraining is NOT gated to level-up.** The book scopes it to
"whenever you gain a new level" (doc 3054). The app lets any Universal Upgrade slot change at
any time, and the author confirmed on 2026-08-01 that this stays: a character sheet you cannot
freely edit is worse to use than one that trusts you. **Do not add the level-up gate in a
later manuscript sync.** Its absence is a decision, not drift. Recorded in the code beside the
fix as well. The "you lose both" consequence still fires on any Talent change.

**`EN.talentRules.progression` carried an older draft** of the Universal Upgrade rule (a
single +1 rather than +2 to one Attribute or +1 to two). Corrected, though nothing currently
reads that object; the live builder already implemented the rule correctly.

**Talent requirements are now enforced.** Previously `talentPicker` listed every talent with
no gate, so a Level 2 character could select one requiring "Character Level 8, Tech 16+", and
the requirement appeared only as an advisory line after selection. The manuscript is explicit:
"You must meet all Attribute and Level requirements at the moment you select the Talent (or
its Upgrade)" (doc 3053).
- **What blocks:** Level, Attribute (including the either-or forms like "Tech or Wits 13 or
  higher"), class, subclass, and named armor Proficiency. Unmet talents render disabled with
  the shortfall in the option text, e.g. "Hardware Harmonizer  (needs Level 8, Tech 16)".
- **What does not block:** capability clauses ("the ability to shape Flow Invocations"),
  "at least one ranged weapon", "Unattuned Classes", and the "or possession of a combat-grade
  cybernetic" alternative. These are shown as a "Table call:" note. Refusing a pick on a rule
  the app only half-understands is worse than letting the table decide.
- **A held pick is never stranded.** A talent already in the slot stays selectable even if it
  no longer qualifies, so an edit elsewhere cannot lock a player out of their own choice. The
  requirement line then turns red and names the shortfall, e.g. "Requires: Character Level 8,
  Shaper.  (short: Level 8)".
- **The Level 6+ Upgrade picker got the same gate**, and now displays the requirement at all,
  which it never did before.
- **One bug caught in my own first cut:** I mapped Sourcerer to the Shaper class, which would
  have let any Harmonist qualify for Parallel Processing. Sourcerer is a Shaper *subclass*, so
  it is matched on `ch.subclass`. Verified both directions: a Harmonist is blocked with "needs
  Codebreaker or Sourcerer", a Sourcerer is not.

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

### M3. Weapon Save DC split three ways (RESOLVED - app updated, no manuscript action)
- Not a contradiction: a genuine intended change, stated consistently in both Parts
  (Part 2 table 1463-1465; Part 3 at 497, 677, 958, 3119).
  - **Melee:** 8 + Body modifier + Caliber
  - **Range:** 8 + Agility modifier + Caliber
  - **Thrown:** 8 + the higher of Body or Agility + Caliber
- **App: updated** in commit `fc1db7f`. It previously carried one unified "higher of
  Body or Agility" formula and had no melee note at all. Now three separate
  common-action rows, a corrected ranged note that also states the Thrown case, and a
  new melee note surfaced in the Inventory melee section.
- **Manuscript action: none.** Part 3 is already consistent.
- Practical effect at the table: ranged users were previously free to use Body when it
  was the higher modifier.

### M4. The damage attribute modifier rule (RESOLVED 2026-07-30)
- **Author ruling.** The rule exists and is now stated:
  - **Melee:** + Body Modifier
  - **Finesse Melee:** + Agility Modifier
  - **Range:** + Agility Modifier
  - **Thrown:** the same modifier used to make the thrown attack. This applies only to
    thrown weapons meant to make **direct contact** (a dagger, a hammer); it does
    **not** apply to indirect contact such as a grenade.
  - **Flow and Tech attacks:** no extra attribute modifier unless the rule text for
    that effect says so.
- **Manuscript action:** write the rule into the Part 3 Damage column (line 463) or the
  Part 2 Damage Resolution pipeline (1702-1719). It was the largest undocumented
  assumption in the system; every damage roll in the app depends on it.
  Suggested wording covering every case:
  > Add your attack attribute modifier to the damage roll: Body for melee, Agility for
  > a Finesse melee weapon or a ranged weapon, and for a Thrown weapon whichever
  > modifier made the attack. Indirect delivery adds no attribute modifier: a grenade
  > lands at a point and forces a save. Flow and Tech attacks add no attribute modifier
  > unless their own text says so.
- **Original problem, for the record.** Part 3 line 463 was the only general statement
  and read merely "The dice rolled on a hit, plus the damage type." The Part 2 Damage
  Resolution pipeline (1702-1719) never added a modifier either. Yet feature text
  assumed one existed:
  - Part 1 line 2819 (Shaper, *Edge of Oneness*): "use your Body modifier instead of
    Agility for the attack **and damage rolls**..."
  - Part 3 lines 1658 and 2082 (Mystech): "...Flow Modifier in place of their Body or
    Agility Modifier for attack rolls, **damage rolls**..."
- **App: one real bug fixed.** Thrown explosives were adding an attribute modifier.
  All five Thrown-group weapons in the catalog are grenades (Frag Mk I and Mk II,
  Flashbang, Smoke, EMP), and each was adding the higher of Body or Agility to its
  damage. A Frag Grenade Mk I showed `2d6 +3` where the rule gives `2d6`.
  - `weaponHit()` now computes an `indirect` flag (Thrown group carrying an Explosive
    trait) and a separate `dmgMod` that is 0 for indirect delivery. The attack roll is
    untouched; only the damage modifier is suppressed.
  - Verified live side by side: Dagger (direct thrown, melee group) reads
    "1d4 +3 (Body) on hit"; Frag Grenade Mk I reads "2d6 on hit, indirect delivery
    adds no attribute modifier". The damage tray adds nothing for the grenade.
  - Commit `23db9b2`.
- **Already correct, no change:** melee adds Body; ranged adds Agility; a direct thrown
  weapon adds whichever modifier made the attack; cipher damage adds no Tech modifier;
  Flow damage adds the Flow Modifier only because the Invocation rules state it
  ("1d6 + Flow Modifier base").
- **Both adjacent cases resolved 2026-07-30**, and the manuscript now carries the
  final wording in the Damage section and a rewritten Damage Resolution pipeline:
  > On a hit, roll the weapon's damage dice and add the same attribute modifier used
  > for the attack roll: Body for a standard melee attack, Agility for a ranged attack,
  > or the attribute used to make a Finesse or direct-contact thrown attack.
  > Indirect attacks add no attribute modifier. A grenade or launcher shell lands at a
  > point, forces a save, and deals only its listed damage dice. Cipher, Flow, and Tech
  > effects also add no attribute modifier unless their text says otherwise.
  1. **Launched explosives are indirect.** The app was still adding Agility to Grenade,
     Rocket and Missile Launcher damage. The `indirect` test is now simply the
     **Explosive trait**, which marks exactly the right set: the three launchers and
     the five thrown grenades, and nothing else in the catalog. A Grenade Launcher
     reads `2d8` where it previously read `2d8 +3`.
  2. **Finesse follows the attack attribute.** Confirmed correct: attack and damage
     share one computed modifier, so damage can never diverge from the attribute the
     attack used. Verified with Body +0 and Agility +4: a Longsword stays
     `+0 (Body)`, a Dagger switches to `+4 (Agility)` on both the attack tooltip and
     the damage, and a Pistol reads `+4 (Agility)`.
- **Damage Resolution pipeline rewritten** to the author's new text
  (`EN.combat.damagePipeline`). Three substantive changes beyond wording:
  - Step 1 now states that raw damage is the dice plus the attack's attribute
    modifier, and carries the indirect and cipher/Flow/Tech carve-outs.
  - **Block moved from step 3 to step 2.** It is an Active Mitigation rolled alongside
    Parry, Ward, Resurge, Siphon and Brace, "plus any flat bonuses the defense carries
    (a suit's Block Bonus, the Plated trait)". The old text had Block as a passive flat
    add to Armor DR in step 3, which contradicted the M7 ruling, and omitted Brace
    from the step 2 list entirely.
  - Step 3 now reads "like Force (Spatial) or Psychic", closing the M6 wording.
- **Commits:** `23db9b2` (thrown grenades), `1c12062` (launchers + pipeline).

### M5. Resilience Dice: Body modifier per die (RESOLVED 2026-07-28)
- **Author ruling:** per die. The rule now reads "Roll each die and add your **Body
  modifier to each**. Recover the total as Vitality."
- **App status: already correct**, no change. It rolls each die and adds the Body
  modifier to each, and the Freelancer readout says so ("d8 +3 BOD each").
- Worth noting for the manuscript: the worked example still reads "rolling 2d8 +
  Body modifier to regain 14 Vitality", which in isolation reads as one modifier for
  the whole spend. The rule's "to each" now governs, so the example is not wrong,
  just terser than the rule.

### M6. "Spatial" damage type (RESOLVED 2026-07-28)
- **Author ruling:** Spatial is not a separate damage type. It is a named variety of
  **Force** damage, written **"Force (Spatial)"**. The Force entry covers it
  ("Concussive blasts, gravity hammers, telekinetic impacts, Spatial Shearing...")
  and the Damage Type Sources table lists Force as "Kinetic Invocations, gravity
  weapons, Spatial Shearing."
- **App status:** already correct; the Force entry matched almost verbatim. Only
  change was capitalising **Spatial Shearing** as the proper noun it is.
- **Optional manuscript tidy:** Part 2 line 1714 reads "Some damage types (like
  Spatial or Psychic) may ignore standard physical DR entirely." Since Spatial is a
  Force variety rather than a type, that could read "like Force (Spatial) or Psychic"
  to avoid implying a 20th damage type.

### M7. Block: what contributes (RESOLVED 2026-07-28)
- **Author ruling:** armor adds a **static Block Bonus** to your Block value; shields
  add a **dynamic die** (1d4 / 1d6 / 1d8) under Block; shields **also** add a static
  bonus to Defense.
- **Part 3 line 2145 already says exactly this:** "**Block Bonus:** A flat bonus that
  improves the **Block** Defensive Impulse, listed only on armor built to brace and
  absorb. This is separate from the **Plated** trait's own Block benefit, and the two
  stack on the same suit."
- **App status: correct, no change.** It implements armor `blockBonus` (flat), the
  Plated trait's extra half-DR on Block, and the shield's `blockDie`.
- **Manuscript fix needed in Part 2 (lines 1512-1517), which is stale on three counts:**
  1. "**Requirement:** Must have a physical Shield equipped" - armor Block Bonus and
     the Plated trait both grant Block benefits without a shield.
  2. "Add the Shield's listed **Block Value** directly to your **Armor DR**" - the
     shield contributes a rolled die, not a flat value.
  3. The Tactical Note calls Blocking "a guaranteed spike in damage reduction
     **without a die roll**", which directly contradicts the 1d4/1d6/1d8 shield die.

### M8. Weapon mod capacity (RESOLVED 2026-07-28)
- **Author ruling:** the gear chapters own capacity. The rewritten Customization
  section now says "**Capacity lives with the host.** Weapons carry Parts up to their
  Slot Count across the five slots. Armor takes mods only with the **Modular** trait,
  up to its listed Mod Slots. Vehicles carry Mod Slots equal to 1 + Tier... Each gear
  chapter's own rules for slots, stacking, and exclusions govern; this chapter never
  overrides them." The old "Sidearms support 2, Longarms 3" line is gone.
- **App status:** correct on the headline number, since it implements Part 3's Slot
  Count table (Sidearm 4, Longarm 5, Holdout 1, Melee 4, Signature 0).
- **Follow-up now in scope for step 4 domain 7**, because the rewrite adds rules the
  app does not yet model:
  - **Over-Engineering:** one Part past capacity is allowed, but it becomes a
    **Prototype tier** Project and never invents a mount (a missing slot stays empty,
    non-Modular armor stays bare, a Signature weapon's 0 slots are absolute). One
    extra Part is the ceiling. The app has an over-engineering rule of its own that
    predates this text and needs checking against it.
  - **Mandatory Flaw:** a successful Over-Engineering must carry a permanent quirk,
    heavy maintenance burden, or obvious visual tell.
  - **Three kinds of work:** Accessories (snap on and off outside initiative, no roll,
    no Project), Mods (bench work in downtime with the right kit and Proficiency, roll
    only if the work fights back), Fabrication (full Dice Pool Project).
  - **Armor mods require the Modular trait**, which the app should gate on.

### M9. Electronic-payload saves unified as a Tech Save (RESOLVED 2026-07-28)
- **Author ruling:** one save resolves electronic-payload resistance everywhere, a
  **Tech Save**. The old "Systems or Body" hybrid was an undefined construction
  (saves are attribute saves; Systems is a skill), and Agility was considered and
  rejected because the save gates the Bricked/Breached condition rather than the
  blast. Flesh is covered by the Pulse trait's automatic halving.
- **App updated to match, all verified live:**
  - **EMP Grenade:** gained the **Pulse** trait (it previously dealt full 2d6 to
    unaugmented people, contradicting its own "useless on the people" flavor), plus
    the Tech Save and a stated duration (Bricked/Breached ends at the end of the
    target's next turn), so its "matching the EMP Round and EMP Shell" claim is now
    true on save, outcome and duration.
  - **EMP Shell:** Tech Save vs your Weapon Save DC.
  - **EMP Rounds:** Tech Save DC 13. **Spike Rounds:** Tech Save DC 14. The flat DCs
    are deliberate: cartridge ammo uses flat DCs, thrown and launched ordnance scales
    with the user via Weapon Save DC.
  - **Surge Pulse** (storm generator): Tech Save DC 13, and damage changed from
    1d6 Energy to **1d6 Electric** for family consistency with the EMP lane.
  - **Grenade Shells** bandolier: "standard frag or concussion shells" became
    "standard frag shells". Concussion Shell is specialty ammo at 𝒢50 each and was
    being bundled into a 𝒢120-for-6 standard bandolier.
- **Confirmed:** the "Systems or Body" / "Body or Systems" construction is now extinct
  in the app's data, matching its extinction in Part 3.

### M14. Standard User Complexity ceiling (RESOLVED 2026-07-30)
- **Author ruling:** the **Buddy is the exception**. Standard Users are capped at
  Complexity 0 in general, but a B&E Buddy's baked-in suite runs at the Buddy's own
  tier (0/1/2).
- **Manuscript action:** add that exception clause to line 3342, which currently reads
  as an absolute cap. Line 3542 already frames it correctly.
- **App: already correct**, no change. It implements tier-scaling with 3342 as the
  general rule and the Buddy named as the explicit exception.

### M15. A passed Stability Check (RESOLVED 2026-07-30)
- **Author ruling:** **keep the asymmetry.** A pass on a normal disruption costs
  nothing; on a forced disconnect the Link is gone regardless, so a pass (or a fail by
  4 or less) still costs half the feedback.
- **Manuscript action:** optional but worthwhile, note the forced-disconnect exception
  at line 3336 so the two rules do not read as contradictory in isolation.
- **App: already correct**, no change. Both paths are stated explicitly in the
  LinkDeath resolution text.

### M13. Arc Lightning is a Level 5 example (RESOLVED 2026-07-30)
- **Author ruling:** keep the pattern exactly as written and mark it a **Level 5**
  example, rather than weakening it or relabelling the whole Caliber 1 set.
- **Manuscript action:** inside "Premade Resonant Patterns (Caliber 1, Flow Modifier
  +4)", label Arc Lightning as a Level 5 showcase (or lift it into its own higher-tier
  block), so the section no longer implies a Caliber 1 character can build it.
- **App:** the Arc Lightning template now carries `minLevel: 5` plus the note
  "Layered Force: needs Level 5 (Expanded Frequency)", and the pattern list shows a
  level chip that turns red with a cross when the loaded character is below it.
  Verified: red "LVL 5 x" on a Level 1 Shaper, neutral "LVL 5" at Level 5.

### M10. Electromagnetic / Cognitive Resonance tables were rewritten
- Recorded here because the app had drifted far enough to invent an effect (see A2).
- The overhaul added **Blind Spot** to Cognitive and **Overload** / **Magnetic
  Seize** to Electromagnetic, and rewrote the Electromagnetic Base Effect into the
  three named choices Magnetize / Live Current / Flare.
- The **Sustain Focus Disruption** rule was also absent from the app; **added in A8**
  and later updated to the author's revised DC wording in A8's follow-up.
- Informational record only. No manuscript action.

### M12. LinkDeath feedback stated two ways (RESOLVED 2026-07-28)
- **Was:** the Conditions entry read "2d6 + 1d6 per additional active Link" while the
  #GRID chapter read "2d6 per severed Link" (3448, restated 3451). With 3 Links that
  was 4d6 versus 6d6.
- **Resolved in the manuscript:** the author rewrote the Conditions entry to match the
  #GRID chapter. No further ruling needed.
- **App:** already implemented the #GRID version (commit `4e7dffb`). The condition
  text was then aligned word for word with the rewritten entry, picking up two
  clarifications it adds: the two ways a Link severs (failed Stability Check tears
  away one of your choice; a forced disconnect rips away every Link at once) and
  that **closing a Link yourself costs nothing**. The app keeps one extra line, the
  deck-absorbs-the-pool interaction, explicitly marked as coming from the #GRID
  chapter.

### M11. Structural defects in Part 1 (RESOLVED 2026-07-28)
- Duplicated `# Origin` heading and the inconsistent heading levels were fixed by the
  author in the manuscript. No app impact.


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
