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
- **STILL OPEN. This is the one manuscript item with no ruling yet.**
- **Needed:** one sentence, in the Part 3 Damage column definition (line 463) or in the
  Part 2 Damage Resolution pipeline (1702-1719), stating the base rule. Suggested
  wording: "Add your attack attribute modifier to the damage roll: Body for melee,
  Agility for ranged, and the higher of the two for a Thrown weapon."
- Until it is written down, this is the largest undocumented assumption in the system:
  every damage roll in the app depends on it, and only feature text implies it exists.

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
