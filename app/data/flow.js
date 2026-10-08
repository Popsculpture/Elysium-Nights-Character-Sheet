/* ===========================================================================
   ELYSIUM NIGHTS · The Flow data
   Resonances, the Order of Shaping (Intent / Delivery / Force / Duration), the
   Sustain compatibility table, the Strain track, Overdraw and Breakflow, Ritual
   Recovery, and premade Resonant Patterns. Drives the Flow tab calculator, and the
   Codex's chapter The Flow (js/codex_flow.js) renders the rules from this same copy.
   Resonant Patterns are stored as FORMULATIONS (the component choices) so the
   FP cost and damage recompute from the character's live Caliber / Flow Modifier.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.flow = {

  coreConcepts: [
    { term: "Flow Points", text: "Numerical units of resonance used to fuel Invocations." },
    { term: "Reservoir", text: "The maximum capacity of Flow Points a Shaper can safely contain." },
    { term: "Overdraw", text: "Channeling Flow after the Reservoir is empty, causing bodily harm." },
    { term: "Strain", text: "A tracked condition representing spiritual and physical tension from Overdrawing." },
    { term: "Breakflow", text: "A state of total disconnection from the current following Stage 5 Strain or a failed Breakflow Check." },
    { term: "Invocation", text: "The formal process of shaping the Flow into a specific effect." }
  ],

  reservoirFormula: "(Caliber x 3) + Flow Modifier",
  flowAttackFormula: "d20 + Flow Modifier + Caliber",
  saveDcFormula: "8 + Flow Modifier + Caliber",
  checkNote: "You only roll an Invocation Check (Flow Attack) against an unwilling target. Willing targets and objects are affected automatically. Flow Invocations never use the Dice Pool Method.",
  /* How to read the "Flow Save DC (Body)" notation the Resonance entries use. Part 2, Invocation
     Checks. Shown above the Resonances list in the Codex (js/codex_flow.js) and beside the Flow
     Save DC there. */
  saveNotation: "When an entry says a target makes a Flow Save DC (Body), it makes a Body Save against your Flow Save DC.",

  /* ---- the Order of Shaping: cost bands ---------------------------------- */
  intent: [
    { key: "damage", name: "Damage Only", fp: 0, desc: "1d6 + Flow Modifier base damage." },
    { key: "effect", name: "Effect Only", fp: 0, desc: "Produces the Base Resonance effect." },
    { key: "hybrid", name: "Hybrid (Damage + Effect)", fp: 1, desc: "Both damage and an effect. Layering with Empowered Force needs Level 5." }
  ],
  delivery: [
    { key: "directed", band: "Directed", fp: 0, precision: false, scaling: "+1 FP per additional target",
      options: ["Touch", "Remote", "Imbue"],
      desc: "Affects a single target through physical or visual contact. Remote reaches a target you can see (typically 6 spaces)." },
    { key: "focused", band: "Focused Area", fp: 1, precision: true, scaling: "+1 FP per +1 space to one dimension",
      options: ["Cube (2 spaces)", "Sigil"],
      desc: "Anchors the Flow to a fixed point. Sigil triggers when a Character enters or interacts with it." },
    { key: "wide", band: "Wide Area", fp: 2, precision: true, scaling: "+1 FP per +1 space to one dimension",
      options: ["Aura (2 spaces)", "Cone (3 spaces)", "Sphere (3 spaces)", "Line (6 spaces)"],
      desc: "Affects large sections of the battlefield. Aura is centered on you and moves with you." }
  ],
  force: [
    { key: "base", name: "Base Force", fp: 0, desc: "1d6 + Flow Modifier damage, or a Base Resonance effect." },
    { key: "empowered", name: "Empowered Force", fp: 1, desc: "Add damage dice equal to your Caliber, OR apply the Resonance's Empowered Effect." }
  ],
  duration: [
    { key: "instant", name: "Instant", desc: "Damage is applied and conditions are inflicted immediately. Unless an effect specifies otherwise, it lasts until the start of your next turn. Instant effects require no further input or maintenance." },
    { key: "sustain", name: "Sustain", desc: "Spend 1 FP at the start of your turn to maintain it. Only one sustained effect at a time." }
  ],
  /* What ends a sustained effect besides choosing to. This sentence lived only inline in the
     Flow tab's Sustain panel (js/flow.js); it moved here so the tab and the Codex's Sustained
     Effects panel read one copy. */
  sustainCapacity: "One sustained effect at a time. It ends if you are Incapacitated, Unconscious, or enter Breakflow. Starting a new sustain replaces the current one.",
  /* Stability Factor: sustained resonance is fragile. Taking damage while sustaining
     forces a Focus Check or the effect collapses. */
  focusDisruption: {
    // A Focus Check is a Body Save (see the Critical Condition entry, which defines it).
    save: "Focus Check (a Body Save)",
    dc: 12,
    dcNote: "DC 12, or half the total damage taken that turn, whichever is higher.",
    failure: "The sustained effect ends immediately as the Flow destabilizes.",
    text: "Focus Disruption: if you take damage while sustaining an effect, make a Focus Check. DC 12, or half the total damage taken that turn, whichever is higher. On a failure the sustained effect ends immediately."
  },
  precisionShaping: {
    fp: 1, fpStrain3: 2,
    desc: "On Focused or Wide delivery, spend +1 FP to exclude up to your Flow Modifier in targets (characters or objects) you can see or sense. At Stage 3 Strain (Surge) or higher the cost rises to 2 FP."
  },
  layeredForce: "Level 5 (Expanded Frequency): pay both Hybrid (1 FP) and Empowered Force (1 FP) on one Invocation for full Empowered damage AND the Resonance's Empowered Effect.",

  /* ---- the seven Base Resonances ---------------------------------------- */
  // resolution: "attack" rolls a Flow Attack vs Defense; "save" forces a Flow
  // Save DC (the resonance bypasses a Flow Attack per its Stability Factor).
  // unlock: the character level the resonance becomes available.
  resonances: [
    { key: "kinetic", name: "Kinetic", unlock: 1, focus: "Mass and Momentum", damage: "Bludgeoning / Force",
      resolution: "attack",
      base: "Push or pull a target up to 2 spaces (an unwilling target makes a Flow Save DC, Body or Agility, to resist), or cushion a fall to negate impact damage.",
      empowered: [
        { name: "Kinetic Barrier", sustain: true, text: "Solidify the air into an Area 2 line as a physical barrier, granting Half Cover (+2 Defense) to targets behind it." },
        { name: "Gravity Pin", sustain: true, text: "Target makes a Flow Save DC (Body or Agility) or is Restrained. They can use an Action to make a physical check vs your Flow Save DC to break free, or repeat the save at the start of each turn." }
      ] },
    { key: "thermal", name: "Thermal", unlock: 1, focus: "Molecular Speed", damage: "Fire / Cold",
      resolution: "attack",
      base: "Ignite flammable objects (if worn or carried by an unwilling target, they make a Flow Save DC, Agility, to smother it), instantly freeze a small body of liquid, or regulate the ambient temperature of an area.",
      empowered: [
        { name: "Structural Melt", sustain: true, text: "Soften physical cover or armor until it runs. For the duration, cover the target is using counts as one grade lower, and armor the target is wearing has its DR reduced by 1." },
        { name: "Thermal Fog", sustain: true, text: "Flood up to an Area 3 sphere with blinding steam or frost. The area becomes Heavily Obscured, blocking line of sight." }
      ] },
    { key: "electromagnetic", name: "Electromagnetic", unlock: 1, focus: "Light and Currents", damage: "Electric / Energy",
      resolution: "attack",
      base: "Choose one: Magnetize (a target holding or wearing metal makes a Flow Save DC, Body or Agility, or the object tears free and loose metal leaps to your hand); Live Current (light a spark, deal 1 Electric damage to a target you touch or see, or push power into a dead device or rip it out of a live one; you can break or feed a machine, never command it); Flare (brighten a dark space to daylight, or lance a beam a target must make a Flow Save DC, Agility, to avoid or be dazzled, taking Snag on their next attack roll).",
      empowered: [
        { name: "Optic Scramble", sustain: true, text: "A blaze of light and current overloads everything watching. Cameras, drone eyes, and cybernetic optics in the area go dark for the duration. Organic targets make a Flow Save DC (Body) or are Blinded." },
        { name: "Overload", sustain: false, text: "Drive raw current through a target. They make a Flow Save DC (Body) or are Staggered until the end of their next turn. A target in metal armor or running cyberware rolls this save with Snag; the metal carries the charge." },
        { name: "Magnetic Seize", sustain: true, text: "Twist the local field until metal turns traitor. Each target in the area makes a Flow Save DC (Body) or has any metal weapon wrenched from their grip, and can't draw, aim, or fire a metal weapon while the effect lasts." }
      ] },
    { key: "visceral", name: "Visceral", unlock: 1, focus: "Biology and Decay", damage: "Toxic / Entropy",
      resolution: "attack",
      targeting: "Applies to living and resonant targets. Against a Clanker it manifests through the resonance lattice. The mechanics are identical; only the fiction shifts.",
      base: "Choose one: Patch (a willing target regains 1d4 Vitality); Purge (remove one mundane toxin, drug, or low-severity bio-effect from a willing target); Faltering Pulse (an unwilling target makes a Flow Save DC, Body, or takes -1d4 on their next physical check or attack).",
      empowered: [
        { name: "Adrenal Overclock", sustain: false, text: "Grant a willing target Edge on physical checks and a +2 bonus to Speed." },
        { name: "Forceful Sedation", sustain: false, text: "Target makes a Flow Save DC (Body) or falls Unconscious. They wake on taking damage or being shaken awake by an adjacent ally's Action." },
        { name: "Cellular Crash", sustain: false, text: "Target makes a Flow Save DC (Body) or is Poisoned until the end of their next turn and can't benefit from Resilience Dice or self-healing." }
      ] },
    { key: "spatial", name: "Spatial", unlock: 1, focus: "Dimensions and Void", damage: "Force (Spatial)",
      resolution: "save", saveAttr: "varies", armorNote: "Ignores standard physical armor.",
      base: "Swap places with an adjacent willing target, or seamlessly retrieve an object from across a room.",
      empowered: [
        { name: "Spatial Displacement", sustain: false, text: "Instantly teleport a willing target up to 3 spaces to an unoccupied space you can see." },
        { name: "Folded Terrain", sustain: true, text: "Warp the geometry of up to an Area 3 cube into Difficult Terrain, costing 2 Speed per 1 space moved." },
        { name: "Void Pocket", sustain: true, text: "Open a vacuum in an Area 2 sphere. Targets inside make a Flow Save DC (Body) or are Deafened and begin suffocating while they remain." }
      ] },
    { key: "cognitive", name: "Cognitive", unlock: 3, focus: "Synapses and Perception", damage: "Psychic",
      resolution: "save", saveAttr: "Wits", armorNote: "Bypasses physical armor (Stability Factor).",
      base: "Project thoughts telepathically to a visible target, induce a minor sensory hallucination, or alter a single short-term memory (an unwilling target makes a Flow Save DC, Wits, to resist).",
      empowered: [
        { name: "Neural Override", sustain: false, text: "Target makes a Flow Save DC (Wits) or you dictate their movement and Action on their next turn. You can't force direct lethal self-harm." },
        { name: "Sensory Collapse", sustain: true, text: "Target makes a Flow Save DC (Wits) or suffers Frightened or Charmed (your choice) for the duration." },
        { name: "Blind Spot", sustain: false, text: "A target you choose slips beneath notice, gaining the Invisible condition. Ends immediately if that target makes an attack or forces a saving throw." }
      ] },
    { key: "synthetica", name: "Synthetica", unlock: 1, unique: "sourcerer", focus: "Favor and Malfunction", damage: "Electric / Fire",
      resolution: "save", saveAttr: "Tech", noSustain: true,
      stabilityNote: "Short Attention Spans: Synthetica Empowered Effects can't use the Sustain duration. A favor is a transaction; the sprite does the work, collects the amusement, and wanders off. Effects last exactly as long as their entries say and not a round longer.",
      targeting: "Synthetica works through machines, never around them. A valid target carries, wears, or is installed with powered tech, or is itself a device, drone, Proxy, or Construct. A target with nothing electronic on or in them is beyond the sprites' reach.",
      special: "Favors Travel Light: when you shape an Invocation of any other Resonance, you may spend an additional 1 FP to fold a Nixie Favor or a Gremlin Jinx into it. A favor folded this way allows no save. One folded favor per Invocation.",
      base: "Choose one: Ask Around (interview the sprites in a device you can see or touch; you learn what the machine is, what it does, and what it has noticed recently, as impressions rather than records); Nixie Favor (a Nixie settles into a willing target's weapon or cybernetics; they gain a 1d4 bonus on their next attack roll or Saving Throw); Gremlin Jinx (a Gremlin crawls into an unwilling target's weapon or cybernetics; they make a Flow Save DC, Tech, or suffer a 1d4 penalty on their next attack roll or Saving Throw).",
      empowered: [
        { name: "Nixie Synchronization", sustain: false, text: "A Nixie tunes a willing target's weapon or cybernetic implant to its wielder's pulse. For the next turn, the target gains Edge on their next attack roll with that weapon, and the weapon deals an additional 1d6 Force damage on its next hit." },
        { name: "Gremlin Tantrum", sustain: false, text: "Point the local Gremlins at a target's firearm, smart tech, or cyberlimb. The target makes a Flow Save DC (Tech). On a failure, they take 1d6 Fire damage as the device cooks against them, and that weapon or cyberlimb seizes up, preventing its use until the end of their next turn." },
        { name: "Poltergeist", sustain: false, unlock: 3, text: "Unlocked at Level 3 (Hardware Harmonization). Ask the sprites riding a device, drone, or Construct to take the wheel. The target makes a Flow Save DC (Tech). On a failure, you dictate its movement and its Action on its next turn. The sprites won't drive a machine into its own obvious destruction, and they can't drive a mind: a Clanker, a Synthetic, or any target that is someone rather than something is immune." }
      ] },
    { key: "temporal", name: "Temporal", unlock: 5, focus: "Chronological Flow", damage: "Entropy",
      resolution: "attack", noSustain: true,
      stabilityNote: "The timeline resists alteration: Temporal Empowered Effects are strictly Instant and resolve at the end of the target's next turn. They can't be sustained.",
      base: "Age a small mundane object (rusting a lock or rotting a beam), glimpse the immediate future for Edge on your next Initiative roll, or perfectly recall an event from the past 24 hours.",
      empowered: [
        { name: "Chronal Acceleration", sustain: false, text: "Bend time around a willing ally. On their next turn their Speed is doubled and they gain one additional Action." },
        { name: "Stasis Field", sustain: false, text: "Target makes a Flow Save DC (Agility or Wits) or their Speed is halved and they lose their primary Action on their next turn." }
      ] }
  ],
  resonanceUnlockNote: "At Level 1 a Shaper knows three of the standard Base Resonances (Kinetic, Thermal, Electromagnetic, Visceral, Spatial). Cognitive unlocks at Level 3 (Resonance Synthesis); Temporal unlocks at Level 5 (Expanded Frequency). A Sourcerer is the exception: Synthetica, their Unique Resonance, counts as one of the three known at Level 1, so they choose only two more from the standard list. No other Shaper can learn it.",

  /* ---- Sustain compatibility -------------------------------------------- */
  sustainCompat: [
    { resonance: "Kinetic", effect: "Kinetic Barrier", allowed: true, notes: "Standard sustain rules." },
    { resonance: "Kinetic", effect: "Gravity Pin", allowed: true, notes: "Target saves at the start of each turn (Lockdown)." },
    { resonance: "Thermal", effect: "Structural Melt", allowed: true, notes: "Cover grade and DR loss persist with sustain." },
    { resonance: "Thermal", effect: "Thermal Fog", allowed: true, notes: "Area persists with sustain." },
    { resonance: "Electromagnetic", effect: "Optic Scramble", allowed: true, notes: "Standard sustain rules." },
    { resonance: "Electromagnetic", effect: "Overload", allowed: false, notes: "Staggered resolves at the end of the target's next turn." },
    { resonance: "Electromagnetic", effect: "Magnetic Seize", allowed: true, notes: "Area persists; target saves at the start of each turn to shake free." },
    { resonance: "Visceral", effect: "Adrenal Overclock", allowed: false, notes: "Resolves at the end of the target's next turn." },
    { resonance: "Visceral", effect: "Forceful Sedation", allowed: false, notes: "Resolves on damage or being woken." },
    { resonance: "Visceral", effect: "Cellular Crash", allowed: false, notes: "Resolves at the end of the target's next turn." },
    { resonance: "Spatial", effect: "Spatial Displacement", allowed: false, notes: "Instant teleport." },
    { resonance: "Spatial", effect: "Folded Terrain", allowed: true, notes: "Area persists with sustain." },
    { resonance: "Spatial", effect: "Void Pocket", allowed: true, notes: "Targets save each round in the zone." },
    { resonance: "Cognitive", effect: "Neural Override", allowed: false, notes: "One turn of forced action only." },
    { resonance: "Cognitive", effect: "Sensory Collapse", allowed: true, notes: "Lockdown effect; target saves at the start of each turn." },
    { resonance: "Cognitive", effect: "Blind Spot", allowed: false, notes: "Ends on the target's attack or save-forcing action." },
    { resonance: "Synthetica", effect: "Nixie Synchronization", allowed: false, notes: "Short Attention Spans: no Sustain." },
    { resonance: "Synthetica", effect: "Gremlin Tantrum", allowed: false, notes: "Short Attention Spans: no Sustain." },
    { resonance: "Synthetica", effect: "Poltergeist", allowed: false, notes: "Short Attention Spans: no Sustain." },
    { resonance: "Temporal", effect: "Chronal Acceleration", allowed: false, notes: "Resolves on the target's next turn." },
    { resonance: "Temporal", effect: "Stasis Field", allowed: false, notes: "Always Instant per Stability Factor." }
  ],

  /* ---- Strain, Overdraw, Breakflow -------------------------------------- */
  strainTrack: [
    { stage: 1, name: "Ripple", penalty: "Snag on all Invocation rolls." },
    { stage: 2, name: "Wave", penalty: "All Invocations cost +1 FP." },
    { stage: 3, name: "Surge", penalty: "Overdraw Vitality damage rises from 1d4 to 1d6 per FP. Snag on Breakflow Checks. Precision Shaping costs 2 FP." },
    { stage: 4, name: "Rend", penalty: "Must roll a Breakflow Check when Overdrawing. Spending FP (not just Overdraw) costs 1 flat Vitality per FP." },
    { stage: 5, name: "Collapse", penalty: "Immediate Breakflow; you fall Unconscious." }
  ],
  overdraw: {
    vitalityLoss: "Lose 1d4 Vitality per 1 FP spent past your Reservoir (1d6 at Stage 3 Strain or higher).",
    strain: "If an Overdraw causes any Vitality loss, accumulate Strain points equal to the FP spent. Gain 1 Stage of Strain per 3 Strain points.",
    nonCombat: "A negative Margin on a narrative Flow Dice Pool check (such as cleansing an anomaly) automatically inflicts 1 Stage of Strain."
  },
  breakflow: {
    dcFormula: "12 + Current Strain Stage",
    /* This field said three things and two of them were wrong, in different ways. "Or a critical
       failure" is the retired trigger the 2026-09-18 audit struck from the two sites it knew
       about; this was a third it did not name. And the other two clauses are not the same kind of
       thing: Overdrawing at Stage 4 makes you ROLL, while reaching Stage 5 is Breakflow outright
       with nothing to roll. Blended into one list, either reading of the field left a clause
       false, so it now states both routes and says which is which.

       No new rule is authored here. Both halves are already stated in this file's own strainTrack
       (Stage 4 "Must roll a Breakflow Check when Overdrawing", Stage 5 "Immediate Breakflow") and
       agree with the Breakflow condition entry in conditions.js, which reads "Occurs automatically
       when Strain reaches Stage 5 or when you fail a Breakflow Check".

       Data-only, as is dcFormula above it: js/flow.js renders `check` and `onFailure`, and the
       engine computes breakflowDC itself. So this is source truth rather than display. */
    triggers: "Overdrawing at Stage 4 (Rend) forces a Breakflow Check. Reaching Stage 5 (Collapse) is Breakflow outright, with no check to make.",
    onFailure: "Your FP drops to 0, all sustained effects end, and you can't channel until you undergo Breakflow Restoration.",
    check: "Roll a Flow Attribute Saving Throw vs DC 12 + your current Strain Stage (Snag at Stage 3+)."
  },

  /* ---- Ritual Recovery + Breakflow Restoration -------------------------- */
  ritualRecovery: {
    note: "A structured meditation that repairs the Reservoir and eases Strain. Usable once per 24 hours; extra attempts fail and inflict 1 Stage of Strain (Resonant Saturation). Each Stage recovered needs its own Flow Dice Pool check.",
    byStage: [
      { stage: 1, name: "Ripple", time: "10 Minutes", snag: 1 },
      { stage: 2, name: "Wave", time: "30 Minutes", snag: 2 },
      { stage: 3, name: "Surge", time: "1 Hour", snag: 3 },
      { stage: 4, name: "Rend", time: "2 Hours", snag: 4 },
      { stage: 5, name: "Collapse", time: "4 Hours", snag: 5 }
    ],
    outcomes: [
      { margin: "+3 or more", result: "Flawless", text: "Remove 2 Stages of Strain and restore 2d4 Flow Points." },
      { margin: "+1 to +2", result: "Strong", text: "Restore 1d4 Flow Points and remove 1 Stage of Strain." },
      { margin: "0", result: "Mixed", text: "Remove 1 Stage of Strain, but restore no Flow Points." },
      { margin: "-1 or worse", result: "Failure", text: "Apply 1 Stage of Strain (or 2d6 Vitality loss if already at Stage 5)." }
    ],
    cooperative: "Up to three assistants may each grant +2 Edge Dice to the Lead Shaper's pool, or instead make their own check to remove 1 Stage of Strain from a different participant."
  },
  breakflowRestoration: {
    full: "Full Restoration: in a Flow-rich area (Anomaly Severity 0) during an 8-hour Long Rest, a Positive Margin on a Flow Dice Pool check vs 5 Snag Dice restores the Reservoir to half capacity and reduces Strain to Stage 2. On failure, you stay in Breakflow and take 2d6 Vitality loss.",
    rough: "Rough Restoration: in a Severity 1 or lower area during a 4 hour rest, a Positive Margin vs 6 Snag Dice restores the Reservoir to one-quarter capacity and reduces Strain to Stage 3. On failure, you stay in Breakflow and take 2d6 Vitality loss."
  },

  /* ---- Premade Resonant Patterns (formulations) ------------------------- */
  // Stored as the component choices so the FP cost and damage recompute from the
  // character's live Caliber and Flow Modifier. extraTargets / extraSpaces are
  // additional scaling steps (+1 FP each). empoweredEffect names the chosen
  // Empowered Effect when the force is empowered and the intent carries an effect.
  premadePatterns: [
    { name: "Kinetic Slam", resonance: "kinetic", intent: "damage", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false },
    { name: "Flash-Freeze Zone", resonance: "thermal", intent: "effect", deliveryBand: "wide", deliveryOption: "Sphere (3 spaces)", force: "base", duration: "instant", precision: true },
    { name: "Triage Pulse", resonance: "visceral", intent: "effect", deliveryBand: "directed", deliveryOption: "Touch", force: "base", duration: "instant", precision: false, baseChoice: "Patch" },
    // Hybrid + Empowered Force on one Invocation is Layered Force, which unlocks at
    // Level 5 (Expanded Frequency), so this pattern is a Level 5 showcase rather than
    // a starting build.
    { name: "Arc Lightning", resonance: "electromagnetic", intent: "hybrid", deliveryBand: "wide", deliveryOption: "Line (6 spaces)", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Optic Scramble", minLevel: 5, gateNote: "Layered Force: needs Level 5 (Expanded Frequency)" },
    { name: "Dimensional Tear", resonance: "spatial", intent: "damage", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false },
    { name: "Gravity Anchor", resonance: "kinetic", intent: "effect", deliveryBand: "focused", deliveryOption: "Cube (2 spaces)", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Gravity Pin" },
    { name: "Phantom Shroud", resonance: "cognitive", intent: "effect", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Blind Spot" },
    { name: "Adrenal Overclock", resonance: "visceral", intent: "effect", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Adrenal Overclock" },
    { name: "Thermal Breach", resonance: "thermal", intent: "effect", deliveryBand: "directed", deliveryOption: "Touch", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Structural Melt" },
    { name: "Fold Space", resonance: "spatial", intent: "effect", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Spatial Displacement" }
  ],
  premadeNote: "Premade patterns assume an initiate Shaper. Channel one to load it into the builder, then Save your own tuned versions. Costs and damage shown use your live Caliber and Flow Modifier."
};

/* Convenience index by resonance key (built once at load). */
EN.flow.resonanceByKey = {};
EN.flow.resonances.forEach(function (r) { EN.flow.resonanceByKey[r.key] = r; });

/* ===========================================================================
   FLOW DISTURBANCES (Codex Phase 2). The Anomalies, their Severity, detecting
   them, the Cleansing Project, Counter Flow, the Ritual Chorus, the Focal Anchor
   inside a Null Scar, and repairing a Null Scar. Rendered by the Codex's chapter
   The Flow (js/codex_flow.js, panels fl-dist to fl-dist-gm).
   Transcribed from the rulebook, Part 2 "Core Rules, Combat, Survival, &
   Specialized Systems" (Drive modifiedTime 2026-10-04T07:31:16.171Z):
     # Flow Disturbances > ## Flow Disturbances (lines 4604 to 4632):
       intro, ### Core Concepts, ### Anomaly Classifications
     ## Detecting and Analyzing (4633 to 4641)
     ### Cleansing and Repair, ### Counter Flow, ### Ritual Chorus, and the
       GM Guidance and Gameplay Summary boxes (4643 to 4697)
     ## Inside a Null Scar: The Focal Anchor, with ### Identifying the Anchor,
       ### Destroying the Anchor, ### When the Anchor Falls (4699 to 4733)
     ## Repairing a Null Scar, with ### Establishing Anchors, ### The
       Reconstruction Ritual, ### Outcome and Aftermath and its GM Guidance
       box (4735 to 4801)
   Three sentences live elsewhere in Part 2 and are carried here because they are
   anomaly rules no other panel shows:
     nullScarGuidance  ## Overdraw, Strain, and Breakflow > ### Breakflow Check,
                       the GM Guidance box, its "Anomalies" item (line 4444)
     ritualImpact      ## Breakflow Restoration > ### Rough Restoration, the GM
                       Guidance box, its "Environmental Impact" and "Failure
                       Margin" items (line 4520)
     clankers          ## Clankers and The Flow > #### Targeting Clankers With
                       Flow, its last bullet (line 3894)
   The text is the book's, unescaped, with its **bold** kept. Labels and margins
   are split into fields so the Codex can table them; the words are unchanged.
   No em or en dashes anywhere in this block (house style).
   =========================================================================== */
EN.flow.disturbances = {
  intro: "When the Flow gets bent, blocked, or torn, the world flinches. The disruptions left behind are called anomalies: feedback loops, knots in the current, places where the Flow keeps running into itself. They scramble shaping, throw off resonance, and spread if nobody puts a hand on them.",

  coreConcepts: [
    { term: "Severity Rating", text: "A scale from 1 to 5 measuring the instability and danger of an Anomaly." },
    { term: "Cleansing Project", text: "The structured process of reducing an Anomaly's Severity using the Dice Pool Method." },
    { term: "Target Progress", text: "The total number of successful milestones required to complete a Cleansing Project." },
    { term: "Counter Progress", text: "A cumulative tracker used to suppress an Anomaly in combat via Counter Flow." },
    { term: "Focal Anchor", text: "The structural point where a Null Scar crystallized: the only way to temporarily collapse a Scar in combat." }
  ],

  /* ### Anomaly Classifications: Type and Mechanical Impact, in the book's order */
  classifications: [
    { key: "echo", name: "Echo Field", effect: "Characters suffer **Snag** (or **+1 Snag Die** in Dice Pools) on Perception checks, and **Snag** on Invocation checks." },
    { key: "static", name: "Static Zone", effect: "Invocations cost **+1 FP**; damage dice and effect magnitudes are **halved**; targets of Empowered Effects gain **Edge** on saves; FP can't be recovered while inside; sustained effects require a **Focus Check** every round." },
    { key: "storm", name: "Resonant Storm", effect: "Invocations cost **+1 FP**. Failed checks deal **1d4 Vitality damage**." },
    { key: "corrupted", name: "Corrupted Signature", effect: "Every Invocation performed in the zone that costs **2 or more FP** causes **1 Stage of Strain**." },
    { key: "parasite", name: "Flow Parasite", effect: "Characters attuned to the Flow within 2 spaces lose **1 FP per round**." },
    { key: "scar", name: "Null Scar", effect: "Total vacuum. FP is suppressed to 0. Attempts to shape cause **Automatic Overdraw**. The Scar may be temporarily collapsed by destroying its **Focal Anchor**." }
  ],

  /* Part 2, Clankers and The Flow > Targeting Clankers With Flow (line 3894) */
  clankers: "Flow Disturbances like **Static Zones**, **Resonant Storms**, and **Null Scars** interfere with Clanker channeling normally.",

  /* Part 2, Breakflow Restoration's GM Guidance box (line 4520): the two items about a
     disturbance. Its third item, Narrative Tension, is about the ritual's length and stays out. */
  ritualImpact: [
    { label: "Environmental Impact", text: "If a ritual is performed in an area with a **Flow Disturbance**, the **Snag Dice** of the ritual increase by the Anomaly's **Severity Rating**." },
    { label: "Failure Margin", text: "If a Shaper fails a ritual check with a **Margin of -3 or worse** (Critical Failure), they don't just fail to recover; the ritual site becomes a temporary **Echo Field (Severity 1)** due to the released harmonic static." }
  ],

  /* ## Detecting and Analyzing */
  detection: {
    intro: "Shapers possess a natural sensitivity to the Flow's rhythm. Detection occurs through three primary methods:",
    methods: [
      { name: "Resonance Sense", mode: "Passive", text: "You automatically detect strong disturbances within **6 spaces**. The GM describes the sensation (e.g., a high-pitched ringing or a sudden drop in temperature)." },
      { name: "Focused Tuning", mode: "Active", text: "Make a **d20 Flow Attribute Check (DC 10 + Anomaly Severity)** to identify its exact type, Severity, and the required Target Progress to cleanse it." },
      { name: "Echo Listening", mode: "Meditation", text: "Spend 1 minute in silence to gain **Edge** (or **+1 Edge Die**) on your next analysis check. On a failure, the sensory overload inflicts **1 Stage of Strain**." }
    ]
  },

  /* ### Cleansing and Repair: the Harmonic Realignment Project */
  cleansing: {
    intro: "Purifying a disturbance requires precision and harmony. Because anomaly cleansing is typically a deliberate, out-of-combat process, it is handled mechanically as a **Project**, using the **Dice Pool Method** exactly like repairing a drone or crafting a weapon.",
    project: "To cleanse an Anomaly, a Freelancer (or crew of Freelancers) must complete a Harmonic Realignment Project.",
    rules: [
      { name: "Target Progress", text: "Equal to the Anomaly's current Severity x 2." },
      { name: "Cleansing Interval", text: "1 Hour of focused meditation and channeling per roll." },
      { name: "Primary Skill", text: "Awareness or Esoterica (using the Mystique or Flow Attribute)." },
      { name: "The Snag", text: "The GM's Snag Dice pool is equal to the Anomaly's current Severity, plus any environmental complications." }
    ],
    intervals: "For each 1-Hour Cleansing Interval, build your Dice Pool and roll. Convert the Success Margin into Progress:",
    outcomes: [
      { margin: "+3 or more", result: "Flawless Success", text: "2 Progress, and participating Shapers regain 1 FP." },
      { margin: "+1 to +2", result: "Strong Success", text: "1 Progress." },
      { margin: "0", result: "Mixed Result", text: "1 Progress, but the Lead Shaper suffers **1 Stage of Strain** from turbulent energy." },
      { margin: "-1 to -2", result: "Failure", text: "0 Progress, and the Lead Shaper suffers **1 Stage of Strain**." },
      { margin: "-3 or worse", result: "Critical Failure", text: "0 Progress. The Anomaly violently rejects the alignment; Severity **increases** by 1, and all participating Shapers suffer **1 Stage of Strain**." }
    ],
    complete: "When the accrued Progress meets the Target Progress, the Anomaly is completely cleansed."
  },

  /* ### Counter Flow */
  counterFlow: {
    intro: "Because Dice Pools are never used in combat, emergency stabilization under fire uses the **d20 Method**. It can't permanently cleanse an Anomaly, but it can suppress it round-by-round and, with enough effort, for the entire Encounter.",
    rules: [
      { name: "The Mechanic", text: "As an Action, spend **1 FP** and make a d20 Flow Attribute Check." },
      { name: "The DC", text: "10 + (Anomaly Severity x 2)." },
      { name: "On Success", text: "Accumulate **1 Counter Progress**. The Anomaly's mechanical effects are **suppressed for 1 round within an Area 3 radius** of you." },
      { name: "At 3 Cumulative Successes", text: "The Anomaly is fully suppressed for the remainder of the Encounter." },
      { name: "Cooperative Suppression", text: "Multiple Shapers may contribute to the same Counter Progress pool, with each contributing checks on their own turns." }
    ],
    note: "Every successful Counter Flow check pays out twice: an immediate one-round suppression, plus progress toward locking down the Anomaly for the whole fight. A successful Counter Flow check gives a solo Shaper immediate suppression, even before they secure it for the whole Encounter."
  },

  /* ### Ritual Chorus */
  ritualChorus: "Multiple Shapers can join a Harmonic Realignment Project to speed up the process. The Lead Shaper rolls the primary Dice Pool, and each assisting Shaper grants +2 Edge Dice to the pool. This is a fixed benefit of the ritual itself, separate from the Help Action and not bound by its cap. Remember that if the pool results in a Critical Failure, *all* participants suffer the resulting Strain.",

  /* the GM Guidance box after Ritual Chorus */
  gmGuidance: [
    { label: "Environmental Storytelling", text: "An Anomaly should change the tone of a scene. A Static Zone might be eerily silent with Shapers feeling like they're shouting through wet cloth, while a Resonant Storm could cause glass to shatter or metal to hum." },
    { label: "Escalation", text: "The threat of a Critical Failure (-3 Margin) on a Dice Pool makes Severity 4 and 5 Anomalies terrifying. Freelancers should heavily rely on *Ritual Chorus* or Flow-infused tools (like a Rite Calibration Kit) to generate enough Edge Dice to safely attempt high-level cleansing." }
  ],

  /* the Gameplay Summary box */
  summary: [
    { label: "Detect", text: "Use Resonance Sense or Focused Tuning to find the Anomaly and determine its Severity." },
    { label: "Choose Method", text: "Decide between a deliberate Harmonic Realignment Project (Dice Pool) or a desperate, mid-combat Counter Flow (d20)." },
    { label: "Work the Project", text: "Add Snag Dice equal to the Severity. Roll your intervals to accrue Progress until the Target Progress is met." },
    { label: "Manage Strain", text: "Be prepared to halt the Project and use Ritual Recovery if the Lead Shaper accrues too much Strain from failed intervals." }
  ],

  /* ## Inside a Null Scar: The Focal Anchor */
  focalAnchor: {
    intro: [
      "A Null Scar fully suppresses FP within its bounds. No shaping is possible. Attempts to shape cause Automatic Overdraw, which (with FP suppressed to 0) immediately inflicts Vitality damage and Strain.",
      "A Shaper benched inside a Null Scar isn't benched for the encounter, however. Every Null Scar has a **Focal Anchor**: the point where the Scar's structure crystallized when it first formed. Identifying and destroying the Anchor gives the crew a window to act."
    ],
    identify: {
      text: "A Shaper inside or adjacent to a Scar may spend an Action on an **Awareness or Esoterica** check (using Mystique or their Flow Attribute) to identify the Anchor's location.",
      dc: "12 + Scar Severity.",
      onSuccess: "The Anchor's position becomes visible to all allies. The Anchor manifests as a small physical artifact: a fused metal node, a frozen lattice of light, a shard of crystallized space. The exact form varies; the rules do not."
    },
    destroy: {
      text: "Once revealed, the Anchor can be physically destroyed by non-Flow attacks. Unattuned characters can engage it directly.",
      defense: 14,
      vitalityPerSeverity: 15,
      vitality: "15 × Scar Severity",
      immunities: "Flow damage and effects (Invocations can't harm the Anchor; it exists *because* the Flow is suppressed there)."
    },
    falls: {
      text: "When the Anchor is destroyed, the Null Scar collapses for **1d4 + Lead Shaper's Flow Modifier rounds**. Within this window:",
      effects: [
        "All shaping functions normally inside the former Scar.",
        "Shapers can attempt Counter Flow, perform standard Invocations, and even regain FP (Short Rest refreshes resume).",
        "Once the window closes, the Scar reforms at the same Severity unless a proper Cleansing Project has been completed in the interim."
      ]
    },
    closing: "Inside a Scar, a Shaper stops being artillery and starts being a spotter, a tactician, the one who knows where to hit. Their shaping is still gone. And the Anchor is an objective the crew's Unattuned can take down themselves."
  },

  /* Part 2, the Breakflow Check's GM Guidance box, its "Anomalies" item (line 4444) */
  nullScarGuidance: "Treat **Null Scars** as environmental hazards. They are tactical \"dead zones\" where Shapers are stripped of their primary utility, forcing them to rely on physical backup weapons and the Null Scar Anchor mechanic to support the team.",

  /* ## Repairing a Null Scar */
  repair: {
    intro: [
      "A **Null Scar** is the most severe classification of Flow disturbance: a complete collapse of local resonance. Within these zones, the Flow is inert, leaving a vacuum that rejects all shaping.",
      "Repairing a Null Scar means building the current back from nothing. It runs as an extreme-tier **Cleansing Project** requiring a Lead Shaper and preferably multiple assistants.",
      "Destroying a Focal Anchor only opens a temporary window; it doesn't repair the Scar. Permanent repair requires the Reconstruction Ritual below."
    ],
    anchors: {
      text: "The team must first place a minimum of four Anchor Nodes around the perimeter of the Scar. These nodes bridge the gap between the stable Flow and the vacuum.",
      mechanics: "Setting each node requires **1 FP** and an immediate **d20 Flow Attribute Check (DC 15)**. Since this is physical placement and tuning under the immediate crushing weight of the Scar border, it uses the d20 Method.",
      failure: "The node fails to hold the charge, wasting the FP and requiring a new attempt."
    },
    ritual: {
      text: "Once the perimeter is secure, the Lead Shaper begins the long process of drawing Flow from the anchors toward the dead center.",
      rules: [
        { name: "Cleansing Interval", text: "1 Hour per roll." },
        { name: "Interval Cost", text: "The Lead Shaper must spend **2 FP** at the start of each interval to maintain the pulse." },
        { name: "Primary Skill", text: "Esoterica or Awareness." },
        { name: "The Snag", text: "The GM's Snag pool starts at **5 Snag Dice** (representing the absolute resistance of the vacuum) but may increase based on environmental hazards." }
      ]
    },
    /* Scar Size / Target Progress / Residual Severity (on Completion) */
    sizes: [
      { size: "Small", scale: "Room", target: 6, residual: "1 (Echo Field)" },
      { size: "Medium", scale: "Building", target: 10, residual: "2 (Instability, treated as a Static Zone)" },
      { size: "Large", scale: "District", target: 15, residual: "4 (Resonant Collapse, treated as a Resonant Storm)" }
    ],
    intervals: "Convert the Success Margin into Progress. Because of the hostile environment, the failure penalties are exceptionally severe:",
    outcomes: [
      { margin: "+3 or more", result: "Flawless Success", text: "2 Progress." },
      { margin: "+1 to +2", result: "Strong Success", text: "1 Progress." },
      { margin: "0", result: "Mixed Result", text: "1 Progress, but the Lead Shaper suffers **1 Stage of Strain**." },
      { margin: "-1 to -2", result: "Failure", text: "0 Progress. The Lead Shaper suffers **1 Stage of Strain** and **1d4 Vitality loss** from the backlash." },
      { margin: "-3 or worse", result: "Critical Failure", text: "0 Progress. The ritual violently collapses in a **Resonant Surge**." }
    ],
    completion: [
      "The group must spend a final combined **5 FP** to permanently rebind the core.",
      "The Null Scar is instantly downgraded to a lower Severity Anomaly (see table above). It will naturally dissipate over 1d4 weeks as the local current stabilizes.",
      "All participating Characters experience a **Resonant Kickback**, immediately regaining **2d4 FP**."
    ],
    collapse: [
      "The ritual fails completely. All accrued Progress is lost.",
      "All attuned Characters within 6 spaces suffer **2d6 Vitality damage**.",
      "The Scar becomes highly volatile; no further repair attempts can be made for **1d4 days** while the static clears."
    ],
    gmGuidance: [
      { label: "Atmosphere", text: "Emphasize the sensory deprivation of the Scar. Sounds are muffled, colors are muted, and the air feels unnaturally still." },
      { label: "The Stakes", text: "A Null Scar repair is rarely just a roll. Let it land as one of the big moments of the campaign." },
      { label: "Under Fire", text: "If the Reconstruction Ritual is interrupted by combat, the Project is paused. The Lead Shaper must make a **d20 Flow Attribute Saving Throw (DC 15)** each round they take damage to maintain the anchored connection. The connection only drops (inflicting a **Critical Failure** on the Project) if the Lead Shaper fails this check on **two consecutive rounds**." }
    ]
  }
};
