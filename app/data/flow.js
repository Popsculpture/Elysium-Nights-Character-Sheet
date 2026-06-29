/* ===========================================================================
   ELYSIUM NIGHTS · The Flow data
   Resonances, the Order of Shaping (Intent / Delivery / Force / Duration), the
   Sustain compatibility table, the Strain track, Overdraw and Breakflow, Ritual
   Recovery, and premade Resonant Patterns. Drives the Flow tab calculator.
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
    { term: "Breakflow", text: "Total disconnection from the current after a critical failure or Stage 5 Strain." },
    { term: "Invocation", text: "The formal process of shaping the Flow into a specific effect." }
  ],

  reservoirFormula: "(Caliber x 3) + Flow Modifier",
  flowAttackFormula: "d20 + Flow Modifier + Caliber",
  saveDcFormula: "8 + Flow Modifier + Caliber",
  checkNote: "You only roll an Invocation Check (Flow Attack) against an unwilling target. Willing targets and objects are affected automatically. Flow Invocations never use the Dice Pool Method.",

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
    { key: "instant", name: "Instant", desc: "Resolves immediately. Effects last until the start of your next turn unless sustained." },
    { key: "sustain", name: "Sustain", desc: "Spend 1 FP at the start of your turn to maintain it. Only one sustained effect at a time." }
  ],
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
        { name: "Kinetic Barrier", sustain: true, text: "Solidify the air into an Area 2x1 line as a physical barrier, granting Half Cover (+2 Defense) to targets behind it." },
        { name: "Gravity Pin", sustain: true, text: "Target makes a Flow Save DC (Body or Agility) or is Restrained. They can use an Action to make a physical check vs your Flow Save DC to break free, or repeat the save at the start of each turn." }
      ] },
    { key: "thermal", name: "Thermal", unlock: 1, focus: "Molecular Speed", damage: "Fire / Cold",
      resolution: "attack",
      base: "Ignite flammable objects (if worn or carried by an unwilling target, they make a Flow Save DC, Agility, to smother it), instantly freeze a small body of liquid, or regulate the ambient temperature of an area.",
      empowered: [
        { name: "Structural Melt", sustain: true, text: "Melt the integrity of cover or armor. The target suffers a -2 penalty to Defense for the duration." },
        { name: "Thermal Fog", sustain: true, text: "Flood up to an Area 3 sphere with blinding steam or frost. The area becomes Heavily Obscured, blocking line of sight." }
      ] },
    { key: "electromagnetic", name: "Electromagnetic", unlock: 1, focus: "Light and Currents", damage: "Electric / Energy",
      resolution: "attack",
      base: "Magnetize a metal object (a holder makes a Flow Save DC, Body or Agility, to avoid being disarmed), power a dead electronic device, or bend light to alter an object's appearance.",
      empowered: [
        { name: "Optic Scramble", sustain: true, text: "Disable drones, cameras, and cybernetic eyes in the area. Organic targets make a Flow Save DC (Body) or are Blinded." },
        { name: "Light Bend", sustain: false, text: "Wrap a target in bent light, granting Invisible. Ends immediately if the target attacks or forces a saving throw." }
      ] },
    { key: "visceral", name: "Visceral", unlock: 1, focus: "Biology and Decay", damage: "Toxic / Entropy",
      resolution: "attack",
      targeting: "Applies to living and resonant targets. Against a Clanker it manifests through the resonance lattice. The mechanics are identical; only the fiction shifts.",
      base: "Choose one: Patch (a willing target regains 1d4 Vitality); Purge (remove one mundane toxin, drug, or low-severity bio-effect from a willing target); Faltering Pulse (an unwilling target makes a Flow Save DC, Body, or takes -1d4 on their next physical check or attack).",
      empowered: [
        { name: "Adrenal Overclock", sustain: false, text: "Grant a willing target Edge on physical checks and a +2 bonus to Speed." },
        { name: "Forceful Sedation", sustain: false, text: "Target makes a Flow Save DC (Body) or falls Unconscious. They wake on taking damage or being shaken awake by an adjacent ally's Action." },
        { name: "Cellular Crash", sustain: false, text: "Target makes a Flow Save DC (Body) or is Poisoned until the end of their next turn and cannot benefit from Resilience Dice or self-healing." }
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
        { name: "Neural Override", sustain: false, text: "Target makes a Flow Save DC (Wits) or you dictate their movement and Action on their next turn. You cannot force direct lethal self-harm." },
        { name: "Sensory Collapse", sustain: true, text: "Target makes a Flow Save DC (Wits) or suffers Frightened or Charmed (your choice) for the duration." }
      ] },
    { key: "temporal", name: "Temporal", unlock: 5, focus: "Chronological Flow", damage: "Entropy",
      resolution: "attack", noSustain: true,
      stabilityNote: "The timeline resists alteration: Temporal Empowered Effects are strictly Instant and resolve at the end of the target's next turn. They cannot be sustained.",
      base: "Age a small mundane object (rusting a lock or rotting a beam), glimpse the immediate future for Edge on your next Initiative roll, or perfectly recall an event from the past 24 hours.",
      empowered: [
        { name: "Chronal Acceleration", sustain: false, text: "Bend time around a willing ally. On their next turn their Speed is doubled and they gain one additional Action." },
        { name: "Stasis Field", sustain: false, text: "Target makes a Flow Save DC (Agility or Wits) or their Speed is halved and they lose their primary Action on their next turn." }
      ] }
  ],
  resonanceUnlockNote: "At Level 1 a Shaper knows three of the standard Base Resonances (Kinetic, Thermal, Electromagnetic, Visceral, Spatial). Cognitive unlocks at Level 3 (Resonance Synthesis); Temporal unlocks at Level 5 (Expanded Frequency).",

  /* ---- Sustain compatibility -------------------------------------------- */
  sustainCompat: [
    { resonance: "Kinetic", effect: "Kinetic Barrier", allowed: true, notes: "Standard sustain rules." },
    { resonance: "Kinetic", effect: "Gravity Pin", allowed: true, notes: "Target saves at the start of each turn (Lockdown)." },
    { resonance: "Thermal", effect: "Structural Melt", allowed: true, notes: "-2 Defense persists with sustain." },
    { resonance: "Thermal", effect: "Thermal Fog", allowed: true, notes: "Area persists with sustain." },
    { resonance: "Electromagnetic", effect: "Optic Scramble", allowed: true, notes: "Standard sustain rules." },
    { resonance: "Electromagnetic", effect: "Light Bend", allowed: false, notes: "Ends on the target's attack or save-forcing action." },
    { resonance: "Visceral", effect: "Adrenal Overclock", allowed: false, notes: "Resolves at the end of the target's next turn." },
    { resonance: "Visceral", effect: "Forceful Sedation", allowed: false, notes: "Resolves on damage or being woken." },
    { resonance: "Visceral", effect: "Cellular Crash", allowed: false, notes: "Resolves at the end of the target's next turn." },
    { resonance: "Spatial", effect: "Spatial Displacement", allowed: false, notes: "Instant teleport." },
    { resonance: "Spatial", effect: "Folded Terrain", allowed: true, notes: "Area persists with sustain." },
    { resonance: "Spatial", effect: "Void Pocket", allowed: true, notes: "Targets save each round in the zone." },
    { resonance: "Cognitive", effect: "Neural Override", allowed: false, notes: "One turn of forced action only." },
    { resonance: "Cognitive", effect: "Sensory Collapse", allowed: true, notes: "Lockdown effect; target saves at the start of each turn." },
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
    triggers: "Overdrawing at Stage 4 (Rend), reaching Stage 5 (Collapse), or a critical failure.",
    onFailure: "Your FP drops to 0, all sustained effects end, and you cannot channel until you undergo Breakflow Restoration.",
    check: "Roll a Flow Attribute Saving Throw vs DC 12 + your current Strain Stage (Snag at Stage 3+)."
  },

  /* ---- Ritual Recovery + Breakflow Restoration -------------------------- */
  ritualRecovery: {
    note: "A structured meditation that repairs the Reservoir and eases Strain. Usable once per 24 hours; extra attempts fail and inflict 1 Stage of Strain (Resonant Fatigue). Each Stage recovered needs its own Flow Dice Pool check.",
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
    full: "Full Restoration: in a Flow-rich area (Anomaly Severity 0) during an 8 hour long rest, a Positive Margin on a Flow Dice Pool check vs 5 Snag Dice restores the Reservoir to half capacity and reduces Strain to Stage 2. On failure, you stay in Breakflow and take 2d6 Vitality loss.",
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
    { name: "Arc Lightning", resonance: "electromagnetic", intent: "hybrid", deliveryBand: "wide", deliveryOption: "Line (6 spaces)", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Optic Scramble" },
    { name: "Dimensional Tear", resonance: "spatial", intent: "damage", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false },
    { name: "Gravity Anchor", resonance: "kinetic", intent: "effect", deliveryBand: "focused", deliveryOption: "Cube (2 spaces)", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Gravity Pin" },
    { name: "Phantom Shroud", resonance: "electromagnetic", intent: "effect", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Light Bend" },
    { name: "Adrenaline Overclock", resonance: "visceral", intent: "effect", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Adrenal Overclock" },
    { name: "Thermal Breach", resonance: "thermal", intent: "effect", deliveryBand: "directed", deliveryOption: "Touch", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Structural Melt" },
    { name: "Fold Space", resonance: "spatial", intent: "effect", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Spatial Displacement" }
  ],
  premadeNote: "Premade patterns assume an initiate Shaper. Channel one to load it into the builder, then Save your own tuned versions. Costs and damage shown use your live Caliber and Flow Modifier."
};

/* Convenience index by resonance key (built once at load). */
EN.flow.resonanceByKey = {};
EN.flow.resonances.forEach(function (r) { EN.flow.resonanceByKey[r.key] = r; });
