/* ===========================================================================
   ELYSIUM NIGHTS · The Flow data
   Resonances, the Order of Shaping (Intent and Force / Delivery / Duration), the
   Sustain compatibility table, the Strain track, Overdraw and Breakflow, Ritual
   Recovery, and premade Resonant Patterns. Drives the Flow tab calculator, and the
   Codex's chapter The Flow (js/codex_flow.js) renders the rules from this same copy.
   The rule text is the book's, trimmed to the rules a player acts on.
   Resonant Patterns are stored as FORMULATIONS (the component choices) so the
   FP cost and damage recompute from the character's live Caliber / Flow Modifier.
   23 Oct 2026 handoff (Costly Success; the Strain Track is one four-column table; the Ritual of
   Alignment runs Stage 1 to 4; damage plus an effect; Poltergeist carries its level on its label).
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.flow = {

  coreConcepts: [
    { term: "Flow Points", text: "Numerical units of resonance used to fuel Invocations." },
    { term: "Reservoir", text: "The maximum capacity of Flow Points a Shaper can safely contain." },
    { term: "Flow Attribute", text: "The attribute your Flow Modifier comes from, set by subclass (Mystique for a Harmonist, Tech for a Sourcerer). Only attuned classes (such as the Shaper) have an FP pool." },
    { term: "Overdraw", text: "Channeling Flow after the Reservoir is empty, causing bodily harm." },
    { term: "Strain", text: "A tracked condition representing spiritual and physical tension from Overdrawing." },
    { term: "Breakflow", text: "A state of total disconnection from the current following Stage 5 Strain or a failed Breakflow Check." },
    { term: "Invocation", text: "The formal process of shaping the Flow into a specific effect." }
  ],

  reservoirFormula: "(Caliber x 3) + Flow Modifier",
  flowAttackFormula: "d20 + Flow Modifier + Caliber",
  saveDcFormula: "8 + Flow Modifier + Caliber",
  checkNote: "The d20 roll an Invocation makes against Defense. An Invocation that calls for a roll uses this or your Flow Save DC. Flow Invocations never use the Dice Pool Method. Rituals, restoration, and other long-form Flow work run on Flow Dice Pool checks; if the work ends in an Invocation, that Invocation is still a d20 resolution.",
  /* How to read the "Flow Save DC (Body)" notation the Resonance entries use. Part 2, Invocation
     Checks. Shown above the Resonances list in the Codex (js/codex_flow.js) and beside the Flow
     Save DC there. */
  saveNotation: "The number a target rolls against when it saves. When an entry says a target makes a Flow Save DC (Body), it makes a Body Save against your Flow Save DC.",

  /* Handbook, Flow Connection and Unattuned Classes, and Flow Attribute Checks */
  unattunedRule: "Codebreakers, Furies, Hustlers, Operators, Scoundrels, and Stitchers are Unattuned: zero Flow Points (FP), no Flow Attribute, no Invocations, no cooperative channeling, no ability that spends FP, and no risk of Overdraw. Targeted by an Enemy Invocation, an Unattuned Character rolls the save that Invocation names. Mystique still governs their Awareness. Unattuned Freelancers and other beings without a Flow Attribute cannot attempt Flow Attribute Checks.",
  /* Handbook, Clankers and the Flow (the Clanker lineage's flowConnection points here) */
  clankersRule: "A Clanker Flow adept runs on the same rules for Flow Points, Reservoir, Strain, and Breakflow as anyone else.\nHealing and Support: Any Flow effect that restores Vitality, removes conditions, cleanses Strain, or repairs Breakflow works on Clankers exactly as it does on organics. Every Invocation targets Clankers normally, Visceral included.\nAftermarket Interference: A Clanker's factory chassis generates no Static Points (SP). Aftermarket cyberware does: Clankers accumulate SP and cross Static Thresholds exactly like organic characters. At Threshold 3 they suffer Resonant Dissonance instead of Visceral Rejection: a Shaper must spend an Empowered Effect (1 FP) to force Visceral Resonance healing through their glitched hardware.",

  /* The Shaping page and its tables (Handbook, 2 Nov 2026 handoff): every cost, reach and length is printed here;
     the Codex (fl-shaping) and the Flow tab read these. */
  mirrorRule: "When an Invocation rolls no Flow Attack, anything that changes your Invocation roll changes the save instead, in reverse. Snag on your roll gives targets Edge on the save. Edge gives them Snag. A bonus to your roll adds to your Flow Save DC.",
  criticals: "A natural 20 on your Flow Attack, or a target's natural 1 on its save, adds your Flow Modifier once more to that target's damage from that Invocation. Only the roll that lands the Invocation's damage can crit. Re-saves against a sustained effect and anchoring checks never do.",
  shapingRules: "Every Invocation is three choices, made in the order below, and each one has a price in FP. Shaping takes your voice, a free hand, and an Action (Channel Flow), unless a feature says otherwise. Add up the costs: one Invocation can't cost more than your Caliber + Flow Modifier in FP, counting everything you pay to shape it, Strain surcharges included. Overdraw can pay that cost, but never past it.",
  whenToRoll: "An Invocation takes one roll per target at most. Check these in order:\nNo roll: Willing targets and environmental objects are affected automatically.\nA save: If the effect names a save, that save is the only roll, even when damage rides along. Area damage (Focused or Wide Area delivery) and Spatial, Cognitive, and Synthetica Invocations take a save instead of a Flow Attack. Each target makes one save against your Flow Save DC: an Agility Save for area damage, unless the Resonance or the effect names another. A failure takes the damage and the effect. A success avoids the effect and takes no damage, or half the damage in an area.\nA Flow Attack: Anything else aimed at an unwilling target takes an Invocation Check (Flow Attack) against Defense. On a miss, the FP is spent and nothing happens. On a hit, the damage and the effect land.",
  costRowsIntro: "First, select a Base Resonance from your known list (see Base Resonances, below). This determines the frequency of the effect and the type of damage dealt. Then pick one row below. It sets what the Invocation does and what it costs.",
  // Intent and Force: the six printed rows. intent + force are the engine's pair (engine.js flowInvocation).
  costRows: [
    { key: "damage-only", intent: "damage", force: "base", fp: 0, name: "Damage", desc: "1d6 + Flow Modifier damage", minLevel: 1 },
    { key: "empowered-damage", intent: "damage", force: "empowered", fp: 1, name: "Empowered Damage", desc: "1d6 + Flow Modifier, plus 1d6 per Caliber", minLevel: 1 },
    { key: "base-effect", intent: "effect", force: "base", fp: 0, name: "Base Effect", desc: "The Resonance's Base Effect", minLevel: 1 },
    { key: "empowered-effect", intent: "effect", force: "empowered", fp: 1, name: "Empowered Effect", desc: "One Empowered Effect from the Resonance", minLevel: 1 },
    { key: "hybrid", intent: "hybrid", force: "base", fp: 1, name: "Hybrid", desc: "1d6 + Flow Modifier damage and a Base Effect", minLevel: 1 },
    { key: "empowered-pair", intent: "hybrid", force: "empowered", fp: 2, name: "Empowered Pair", desc: "Empowered Damage and an Empowered Effect (see Layered Force)", minLevel: 5 }
  ],
  deliveryIntro: "Delivery determines an Invocation's vector, range, and shape: how you project it into the world. Pick one row below.",
  deliveryTable: [
    { key: "touch", name: "Touch", band: "Directed", fp: 0, reaches: "A target you physically touch", scaling: "+1 FP per extra target" },
    { key: "remote", name: "Remote", band: "Directed", fp: 0, reaches: "A target you can clearly see within 12 spaces", scaling: "+1 FP per extra target" },
    { key: "imbue", name: "Imbue", band: "Directed", fp: 0, reaches: "An object or weapon; waits up to 1 minute", scaling: "+1 FP per extra target" },
    { key: "cube", name: "Cube", band: "Focused Area", fp: 1, reaches: "Area 2 cube on a point you can see within 12 spaces", scaling: "+1 FP per space" },
    { key: "sigil", name: "Sigil", band: "Focused Area", fp: 1, reaches: "Area 2 cube on a mark within your reach; waits up to 1 minute", scaling: "+1 FP per space" },
    { key: "aura", name: "Aura", band: "Wide Area", fp: 2, reaches: "Area 2 aura that moves with you; you choose whether it includes you", scaling: "+1 FP per space" },
    { key: "cone", name: "Cone", band: "Wide Area", fp: 2, reaches: "Area 3 cone from you", scaling: "+1 FP per space" },
    { key: "sphere", name: "Sphere", band: "Wide Area", fp: 2, reaches: "Area 3 sphere on a point you can see within 12 spaces", scaling: "+1 FP per space" },
    { key: "line", name: "Line", band: "Wide Area", fp: 2, reaches: "Area 6 line, 1 space wide", scaling: "+1 FP per space" }
  ],
  durationIntro: "Duration determines how long an Invocation lasts after it's shaped. Pick one row below.",
  durationTable: [
    { key: "instant", name: "Instant", fp: 0, lasts: "Lands at once; lasts until the start of your next turn, unless the effect says otherwise", upkeep: "None" },
    { key: "sustain", name: "Sustain", fp: 1, lasts: "Up to 1 minute (10 rounds)", upkeep: "1 FP per extra minute, in or out of combat" }
  ],
  otherCostsTable: [
    { key: "precision-shaping", name: "Precision Shaping", fp: 1, notes: "Spares a number of targets (characters or objects) in a Focused or Wide Area, up to your Flow Modifier; costs 2 at Stage 3 Strain or higher" },
    { key: "layering", name: "Layering (Level 5)", fp: 1, notes: "A second Resonance in one Invocation, as a Complex Action (see Layered Force)" },
    { key: "resonance-amplification", name: "Resonance Amplification (Level 3)", fp: 2, notes: "Plus a DC 15 Flow Attribute Check (see Resonance Amplification)" },
    { key: "wave", name: "Wave (Strain Stage 2 or higher)", fp: 1, notes: "On every Invocation" }
  ],

  /* ---- the Order of Shaping: cost bands ---------------------------------- */
  // Engine lookups only: the book no longer prints a separate Intent or Force section (costRows above is the table).
  intent: [
    { key: "damage", name: "Damage Only", fp: 0, desc: "1d6 + Flow Modifier base damage." },
    { key: "effect", name: "Effect Only", fp: 0, desc: "Produces the Base Resonance effect." },
    { key: "hybrid", name: "Hybrid (Damage + Effect)", fp: 1, desc: "Both damage and an effect. Layering with Empowered Force needs Level 5." }
  ],
  delivery: [
    { key: "directed", band: "Directed", fp: 0, precision: false, scaling: "+1 FP per extra target",
      options: ["Touch", "Remote", "Imbue"],
      desc: "Touch: A target you physically touch. +1 FP per extra target.\nRemote: A target you can clearly see within 12 spaces. +1 FP per extra target.\nImbue: An object or weapon; waits up to 1 minute. +1 FP per extra target.\nImbue: The effect stays dormant until the object makes contact with a target or the Shaper triggers it as a Free Action. When an Imbued weapon hits, the hit stands in for the Flow Attack; any save the effect names still applies. Triggered with no contact, it rolls normally. You can keep one dormant Imbue or Sigil at a time." },
    { key: "focused", band: "Focused Area", fp: 1, precision: true, scaling: "+1 FP per space",
      options: ["Cube (2 spaces)", "Sigil"],
      desc: "Cube: Area 2 cube on a point you can see within 12 spaces. +1 FP per space.\nSigil: Area 2 cube on a mark within your reach; waits up to 1 minute. +1 FP per space.\nSigil: Brushes the resonance onto a floor, wall, or door. When a Character enters the space or interacts with the object, the Invocation fires, centered on the mark." },
    { key: "wide", band: "Wide Area", fp: 2, precision: true, scaling: "+1 FP per space",
      options: ["Aura (2 spaces)", "Cone (3 spaces)", "Sphere (3 spaces)", "Line (6 spaces)"],
      desc: "Aura: Area 2 aura that moves with you; you choose whether it includes you. +1 FP per space.\nCone: Area 3 cone from you. +1 FP per space.\nSphere: Area 3 sphere on a point you can see within 12 spaces. +1 FP per space.\nLine: Area 6 line, 1 space wide. +1 FP per space." }
  ],
  force: [
    { key: "base", name: "Base Force", fp: 0, desc: "1d6 + Flow Modifier damage, or a Base Resonance effect." },
    { key: "empowered", name: "Empowered Force", fp: 1, desc: "Add damage dice equal to your Caliber, OR apply the Resonance's Empowered Effect." }
  ],
  duration: [
    { key: "instant", name: "Instant", desc: "Lands at once; lasts until the start of your next turn, unless the effect says otherwise. A Base Effect's physical results stay: the ice stays frozen, the lock stays rusted. A helpful Base Effect that keeps working on a willing target, an object, or the space around you (light, temperature, a telepathic line) lasts the scene at no cost.", conditionDuration: "When an Invocation imposes a condition, its duration and re-save replace the condition's own ending save. The condition's other ways out still work: sensory restoration ends Blinded, and harming a Charmed target breaks it." },
    { key: "sustain", name: "Sustain", desc: "The Invocation persists as long as the Shaper actively stabilizes the resonance. Up to 1 minute (10 rounds); 1 FP per extra minute, in or out of combat. If the next minute's FP isn't spent, the effect ends." }
  ],
  /* What ends a sustained effect besides choosing to. This sentence lived only inline in the
     Flow tab's Sustain panel (js/flow.js); it moved here so the tab and the Codex's Sustained
     Effects panel read one copy. */
  sustainCapacity: "You may sustain one effect at a time, unless a feature raises it. Starting a new one while you're full ends one of your choice. If you are Incapacitated, knocked Unconscious, or enter Breakflow, all sustained effects end.",
  shakingItOff: "A target under a sustained effect that allowed a save repeats that save at the start of each of its turns, or once a minute at upkeep outside combat. A success ends the effect on that target, and that Invocation can't affect it again. A held area tests only the targets inside it when it's shaped, though devices in it stay affected. Hazard zones, which say so in their entry, test anyone who enters or starts a turn inside instead.",
  conditionDuration: "When an Invocation imposes a condition, its duration and re-save replace the condition's own ending save. The condition's other ways out still work: sensory restoration ends Blinded, and harming a Charmed target breaks it.",
  upkeepNote: "If the next minute's FP isn't spent, the effect ends.",
  /* Stability Factor: sustained resonance is fragile. Taking damage while sustaining
     forces a Focus Check or the effect collapses. */
  focusDisruption: {
    save: "Focus Check (a Mystique or Body Save, your choice)",
    dc: 12,
    dcNote: "12, or half your biggest single hit, whichever is higher. You roll with Snag if you took two or more hits. A hit is one instance of damage from any source: an attack, a blast, a hazard, a Burning tick. Losing Vitality (Bleeding, Suffocating, Overdraw, Strain) isn't damage.",
    failure: "One sustained effect of your choice ends as the Flow destabilizes.",
    checkPoint: "Each start of your turn is a check point, after anything else that happens then. If you took damage since the last check point (or since you began sustaining), make one Mystique or Body Saving Throw (Shaper's choice).",
    text: "Taking damage while sustaining an effect can end it. Each start of your turn is a check point, after anything else that happens then. If you took damage since the last check point (or since you began sustaining), make one Mystique or Body Saving Throw (Shaper's choice). DC 12, or half your biggest single hit, whichever is higher. You roll with Snag if you took two or more hits. A hit is one instance of damage from any source: an attack, a blast, a hazard, a Burning tick. Losing Vitality (Bleeding, Suffocating, Overdraw, Strain) isn't damage. On a failure, one sustained effect of your choice ends as the Flow destabilizes."
  },
  precisionShaping: {
    fp: 1, fpStrain3: 2,
    desc: "An Area of Effect (AoE) hits everything inside it. To spare someone, a Shaper may use Precision Shaping to weave the current around specific targets. You must be able to see or clearly sense any target you wish to exclude at the moment of shaping. Allies left unexcluded resolve the Invocation as hostile targets, and objects in the area take its damage like anything else it touches."
  },
  obstructionsRule: "Environmental barriers (walls, heavy plating, or resonance dampeners) may provide Cover or block the effect entirely at the GM's discretion.",
  /* Handbook, Resonant Patterns: the rule. The four premade patterns live in premadePatterns, on the Flow tab. */
  resonantPatterns: "A Resonant Pattern is an Invocation you've worked out in advance: a familiar configuration of Intent and Force, Delivery, and Duration, pre-calculated. Record and keep as many as you like. Patterns don't limit you: you can still Free-Shape a unique Invocation whenever none of them fits. Whenever your Caliber or Flow Modifier increases, update your Patterns.\nTo create one, run the Order of Shaping: Intent and Force, Delivery (with any permanent scaling or Precision Shaping), and Duration, pre-calculating Empowered Damage dice at your current Caliber. Sum the FP costs and note the Flow Attack or Save DC for quick reference.\nOn this sheet: the Flow tab recalculates each Pattern from your live Caliber and Flow Modifier.",
  zonesRule: "An effect fills the area its Delivery covers; effects carry no size of their own. An effect that fills a space rather than landing on a target (Kinetic Barrier, Thermal Fog, Folded Terrain, Void Pocket) needs Focused or Wide Area delivery.",
  scalingNote: "Each space you buy grows one dimension of the area: its radius, length, or width.",

  /* ---- the seven Base Resonances ---------------------------------------- */
  // resolution: "attack" rolls a Flow Attack vs Defense; "save" forces a Flow
  // Save DC (the resonance bypasses a Flow Attack per its Stability Factor).
  // unlock: the character level the resonance becomes available.
  resonances: [
    { key: "kinetic", name: "Kinetic", unlock: 1, focus: "Mass and Momentum", damage: "Bludgeoning / Force",
      plain: "Kinetic is the manipulation of mass, gravity, and momentum.",
      resolution: "attack",
      ruleNote: "Forced movement from a Kinetic push or pull doesn't trigger Opportunity Attacks.",
      base: "Push or pull a target up to 2 spaces (an unwilling target makes a Flow Save DC, Body or Agility, to resist), or cushion a fall to negate impact damage.",
      /* the base sentence above, split into the effects it offers: the builder's EFFECT row (js/flow.js) */
      baseOptions: [
        { name: "Push or Pull", save: "Body or Agility", text: "Push or pull a target up to 2 spaces (an unwilling target makes a Flow Save DC, Body or Agility, to resist)." },
        { name: "Cushion a Fall", text: "Cushion a fall to negate impact damage." }
      ],
      empowered: [
        { name: "Kinetic Barrier", sustain: true, zone: true, text: "Solidify the air across the Invocation's area into a physical barrier. This grants Half Cover (+2 Defense) to Targets behind it." },
        { name: "Gravity Pin", sustain: true, save: "Body or Agility", text: "Force a target to make a Flow Save DC (Body or Agility). On a failure, they suffer the Restrained condition. A Restrained Character can use an Action on their turn to make a physical check against your Flow Save DC to break free." }
      ] },
    { key: "thermal", name: "Thermal", unlock: 1, focus: "Molecular Speed", damage: "Fire / Cold",
      plain: "Thermal is the manipulation of molecular speed.",
      resolution: "attack",
      base: "Ignite flammable objects (if worn or carried by an unwilling target, they make a Flow Save DC, Agility, to smother it), instantly freeze a small body of liquid, or regulate the ambient temperature of an area.",
      /* the base sentence above, split into the effects it offers: the builder's EFFECT row (js/flow.js) */
      baseOptions: [
        { name: "Ignite", save: "Agility", text: "Ignite flammable objects (if worn or carried by an unwilling target, they make a Flow Save DC, Agility, to smother it)." },
        { name: "Freeze", text: "Instantly freeze a small body of liquid." },
        { name: "Regulate Temperature", text: "Regulate the ambient temperature of an area." }
      ],
      empowered: [
        { name: "Structural Melt", sustain: true, text: "Soften physical cover or armor until it runs. For the duration, cover the target is using counts as one grade lower, and armor the target is wearing has its DR reduced by 1." },
        { name: "Thermal Fog", sustain: true, zone: true, text: "Flood the Invocation's area with blinding steam or thick frost. It becomes Heavily Obscured, blocking line of sight." }
      ] },
    { key: "electromagnetic", name: "Electromagnetic", unlock: 1, focus: "Charge, Magnetism, and Light", damage: "Electric / Energy",
      plain: "Electromagnetic is the command of charge, field, and light.",
      resolution: "attack",
      base: "Choose one: Magnetize (a target holding or wearing metal makes a Flow Save DC, Body or Agility, or the object tears free and loose metal leaps to your hand); Live Current (light a spark, deal 1 Electric damage to a target you touch or see, or push power into a dead device or rip it out of a live one; you can break or feed a machine, never command it); Flare (brighten a dark space to daylight, or lance a beam a target must make a Flow Save DC, Agility, to avoid or be dazzled, taking Snag on their next attack roll).",
      /* the base sentence above, split into the effects it offers: the builder's EFFECT row (js/flow.js) */
      baseOptions: [
        { name: "Magnetize", save: "Body or Agility", text: "A target holding or wearing metal makes a Flow Save DC, Body or Agility, or the object tears free and loose metal leaps to your hand." },
        { name: "Live Current", text: "Light a spark, deal 1 Electric damage to a target you touch or see, or push power into a dead device or rip it out of a live one; you can break or feed a machine, never command it." },
        { name: "Flare", save: "Agility", text: "Brighten a dark space to daylight, or lance a beam a target must make a Flow Save DC, Agility, to avoid or be dazzled, taking Snag on their next attack roll." }
      ],
      empowered: [
        // every target saves, synthetic optics included; only unattended devices go dark with no roll (Handbook 2026-11-11A)
        { name: "Optic Scramble", sustain: true, save: "Body", text: "A blaze of light and current overloads everything watching. Unattended cameras and sensors in the area go dark for the duration. Every target in the area, organic eyes and synthetic optics alike, must succeed on a Flow Save DC (Body) or suffer the Blinded condition." },
        { name: "Overload", sustain: false, save: "Body", text: "Drive raw current through a target. They make a Flow Save DC (Body) or are Staggered until the end of their next turn. A target in metal armor or running cyberware rolls this save with Snag." },
        { name: "Magnetic Seize", sustain: true, save: "Body", text: "Each target in the area makes a Flow Save DC (Body) or has any metal weapon wrenched from their grip, and can't draw, aim, or fire a metal weapon while the effect lasts." }
      ] },
    // Toxic or Genesis since the Handbook of 2026-11-11A; Entropy is Temporal's alone now
    { key: "visceral", name: "Visceral", unlock: 1, focus: "Biology and Growth", damage: "Toxic / Genesis",
      plain: "Visceral is the manipulation of biology, cellular rhythm, and living things.",
      resolution: "attack",
      targeting: "Applies to living and resonant targets. Against a Clanker the mechanics are identical.",
      base: "Choose one: Patch (a willing target spends one Resilience Die and regains Vitality equal to the roll plus their Body Modifier; a target with no Resilience Dice left gains nothing); Purge (remove one mundane toxin, drug, or low-severity bio-effect from a willing target); Faltering Pulse (an unwilling target makes a Flow Save DC, Body, or takes -1d4 on their next physical check or attack).",
      /* the base sentence above, split into the effects it offers: the builder's EFFECT row (js/flow.js) */
      baseOptions: [
        // the target's own Resilience Die, as one die spent on a Short Rest; it was a flat 1d4 before 2026-11-11A
        { name: "Patch", text: "A willing target spends one Resilience Die and regains Vitality equal to the roll plus their Body Modifier. A target with no Resilience Dice left gains nothing." },
        { name: "Purge", text: "Remove one mundane toxin, drug, or low-severity bio-effect from a willing target." },
        { name: "Faltering Pulse", save: "Body", text: "An unwilling target makes a Flow Save DC, Body, or takes -1d4 on their next physical check or attack." }
      ],
      empowered: [
        { name: "Adrenal Overclock", sustain: true, text: "Grant a willing target Edge on physical checks and a +2 bonus to Speed until the end of their next turn. Held with Sustain, it lasts as long as you hold it, and when it ends the target gains 1 level of Fatigue." },
        { name: "Forceful Sedation", sustain: true, save: "Body", text: "A target makes a Flow Save DC (Body). On a failure, they fall Unconscious. The target wakes immediately if they take damage or are shaken awake by an adjacent ally using their Action. Held with Sustain, its re-save still rolls: the Unconscious it causes doesn't fail that save." },
        /* Regrowth took Cellular Crash's place (Handbook 2026-11-11A). It heals a willing target, so nothing is rolled
           to land it (noRoll). A pattern saved with the old name is moved over in js/store.js, migrateRegrowth. */
        { name: "Regrowth", sustain: false, noRoll: true, text: "A willing target regains Vitality equal to 1d6 + your Flow Modifier + 1d6 per Caliber, and healing past their maximum becomes Vigor. It can restore Vitality lost to Sticky damage." }
      ] },
    { key: "spatial", name: "Spatial", unlock: 1, focus: "Dimensions and Void", damage: "Force (Spatial)",
      plain: "Spatial is the manipulation of dimensions, geometry, and distance.",
      // the Damage Profile's closing clause (25 October 2026); armor DR never stops Force anyway
      resolution: "save", saveAttr: "Body", damageNote: "Deals Force (Spatial Shearing) damage, which ignores Resistance to Force.",
      base: "Swap places with an adjacent willing target, or retrieve an object from across a room.",
      /* the base sentence above, split into the effects it offers: the builder's EFFECT row (js/flow.js) */
      baseOptions: [
        { name: "Swap Places", text: "Swap places with an adjacent willing target." },
        { name: "Retrieve an Object", text: "Retrieve an object from across a room." }
      ],
      empowered: [
        { name: "Spatial Displacement", sustain: false, text: "Instantly teleport a willing target up to 3 spaces to an unoccupied space you can see." },
        { name: "Folded Terrain", sustain: true, zone: true, text: "Warp the geometry of the Invocation's area. It becomes Difficult Terrain, costing 2 Speed for every 1 space moved." },
        { name: "Void Pocket", sustain: true, save: "Body", zone: true, hazard: true, text: "Open a localized vacuum across the Invocation's area. It's a hazard zone: each target inside when it opens, or that enters it or starts its turn there, makes a Flow Save DC (Body). On a failure, it suffers the Deafened condition and gains the Suffocating condition until the start of its next turn or until it leaves. On a success, it's unaffected until then." }
      ] },
    { key: "cognitive", name: "Cognitive", unlock: 3, focus: "Synapses and Perception", damage: "Psychic",
      plain: "Cognitive is the manipulation of synapses, perception, and neurological patterns.",
      resolution: "save", saveAttr: "Mystique", armorNote: "Bypasses physical armor (Stability Factor).",
      base: "Project thoughts telepathically to a visible target, induce a minor sensory hallucination, or alter a single short-term memory (an unwilling target makes a Flow Save DC, Mystique, to resist the alteration).",
      /* the base sentence above, split into the effects it offers: the builder's EFFECT row (js/flow.js) */
      baseOptions: [
        { name: "Project Thoughts", noRoll: true, text: "Project thoughts telepathically to a visible target." },
        { name: "Sensory Hallucination", noRoll: true, text: "Induce a minor sensory hallucination." },
        { name: "Alter Memory", save: "Mystique", text: "Alter a single short-term memory (an unwilling target makes a Flow Save DC, Mystique, to resist the alteration)." }
      ],
      empowered: [
        { name: "Neural Override", sustain: false, save: "Mystique", text: "Target makes a Flow Save DC (Mystique) or you dictate their movement and Action on their next turn. You can't force direct lethal self-harm." },
        { name: "Sensory Collapse", sustain: true, save: "Mystique", text: "Target makes a Flow Save DC (Mystique) or suffers Frightened or Charmed (your choice) for the duration." },
        { name: "Blind Spot", sustain: true, text: "A target you choose slips beneath notice, gaining the Invisible condition. Ends immediately if that target makes an attack or forces a saving throw." }
      ] },
    { key: "synthetica", name: "Synthetica", unlock: 1, unique: "sourcerer", focus: "Favor and Malfunction", damage: "Tech / Resonant",
      plain: "Synthetica asks the Nixies and Gremlins living inside a machine to do the work.",
      // the table row and the Damage Profile, 25 October 2026 (was Electric or Fire); No Vessel, No Favor still applies
      resolution: "save", saveAttr: "Tech", noSustain: true, damageNote: "Deals Tech or Resonant damage.",
      stabilityNote: "Short Attention Spans: Synthetica Empowered Effects can't use the Sustain duration. Synthetica calls for a Tech Save against your Flow Save DC instead of a Flow Attack.",
      targeting: "Synthetica works through machines, never around them. A valid Target carries, wears, or is installed with powered tech, or is itself a device, drone, Proxy, or Construct. A Target with nothing electronic on or in them is beyond the sprites' reach.",
      special: "Favors Travel Light: when you shape an Invocation of any other Resonance, you may spend an additional 1 FP to fold a Nixie Favor or a Gremlin Jinx into it. A favor folded this way allows no save. One folded favor per Invocation.",
      base: "Choose one: Ask Around (interview the sprites in a device you can see or touch; you learn what the machine is, what it does, and what it has noticed recently, as impressions rather than records); Nixie Favor (a Nixie settles into a willing target's weapon or cybernetics; they gain a 1d4 bonus on their next attack roll or Saving Throw); Gremlin Jinx (a Gremlin crawls into an unwilling target's weapon or cybernetics; they make a Flow Save DC, Tech, or suffer a 1d4 penalty on their next attack roll or Saving Throw).",
      /* the base sentence above, split into the effects it offers: the builder's EFFECT row (js/flow.js) */
      baseOptions: [
        { name: "Ask Around", text: "Interview the sprites in a device you can see or touch; you learn what the machine is, what it does, and what it has noticed recently, as impressions rather than records." },
        { name: "Nixie Favor", text: "A Nixie settles into a willing target's weapon or cybernetics; they gain a 1d4 bonus on their next attack roll or Saving Throw." },
        { name: "Gremlin Jinx", save: "Tech", text: "A Gremlin crawls into an unwilling target's weapon or cybernetics; they make a Flow Save DC, Tech, or suffer a 1d4 penalty on their next attack roll or Saving Throw." }
      ],
      empowered: [
        { name: "Nixie Synchronization", sustain: false, text: "A Nixie tunes a willing Target's weapon or cybernetic implant to its wielder's pulse. Until the end of their next turn, the Target gains Edge on their next attack roll with that weapon or implant, and its next hit deals an extra 1d6 Force damage." },
        { name: "Gremlin Tantrum", sustain: false, save: "Tech", text: "Point the local Gremlins at a Target's firearm, smart tech, or cyberlimb. The Target must make a Tech Save against your Flow Save DC. On a failure, the Target takes 1d6 Tech or Resonant damage as the device cooks against them and seizes up until the end of their next turn." },
        { name: "Poltergeist", sustain: false, unlock: 3, save: "Tech", text: "Ask the sprites riding a device, drone, or Construct to take the wheel. The Target must make a Tech Save against your Flow Save DC. On a failure, you dictate its movement and its Action on its next turn. The sprites won't drive a machine into its own obvious destruction, and they can't drive a mind: a Clanker, a Synthetic, or any Target that is someone rather than something is immune." }
      ] },
    { key: "temporal", name: "Temporal", unlock: 5, focus: "Chronological Flow", damage: "Entropy",
      plain: "Temporal is the manipulation of chronological flow and relative time.",
      resolution: "attack", noSustain: true,
      stabilityNote: "The timeline resists alteration: Temporal Empowered Effects are strictly Instant and resolve at the end of the target's next turn. They can't be sustained.",
      base: "Age a small mundane object (rusting a lock or rotting a beam), glimpse the immediate future for Edge on your next Initiative roll, or perfectly recall an event from the past 24 hours.",
      /* the base sentence above, split into the effects it offers: the builder's EFFECT row (js/flow.js) */
      baseOptions: [
        { name: "Age an Object", text: "Age a small mundane object (rusting a lock or rotting a beam)." },
        { name: "Glimpse the Future", text: "Glimpse the immediate future for Edge on your next Initiative roll." },
        { name: "Perfect Recall", text: "Perfectly recall an event from the past 24 hours." }
      ],
      empowered: [
        { name: "Chronal Acceleration", sustain: false, text: "Bend time around a willing ally. On their next turn their Speed is doubled and they gain one additional Action." },
        { name: "Stasis Field", sustain: false, save: "Agility or Wits", text: "Target makes a Flow Save DC (Agility or Wits) or their Speed is halved and they lose their primary Action on their next turn." }
      ] }
  ],
  objectInteractions: "When targeting objects held or worn by an unwilling target, the Flow must overcome the target's physical resistance. Unattended objects, or willing targets, automatically fail this save.",
  resonanceUnlockNote: "At Level 1 a Shaper knows three of the standard Base Resonances (Kinetic, Thermal, Electromagnetic, Visceral, Spatial). Cognitive unlocks at Level 3 (Resonance Synthesis); Temporal unlocks at Level 5 (Expanded Frequency). A Sourcerer is the exception: Synthetica, their Unique Resonance, counts as one of the three known at Level 1, so they choose only two more from the standard list. No other Shaper can learn it.",

  /* ---- Sustain compatibility -------------------------------------------- */
  sustainCompat: [
    { resonance: "Kinetic", effect: "Kinetic Barrier", allowed: true, notes: "Fills the Invocation's area; needs Focused or Wide Area delivery." },
    { resonance: "Kinetic", effect: "Gravity Pin", allowed: true, notes: "Target repeats the save at the start of each of its turns (Shaking It Off); the break-free Action still works." },
    { resonance: "Thermal", effect: "Structural Melt", allowed: true, notes: "Cover grade and DR loss persist while held." },
    { resonance: "Thermal", effect: "Thermal Fog", allowed: true, notes: "Fills the Invocation's area; needs Focused or Wide Area delivery." },
    { resonance: "Electromagnetic", effect: "Optic Scramble", allowed: true, notes: "Unattended devices in the area stay dark; every target repeats the save (Shaking It Off)." },
    { resonance: "Electromagnetic", effect: "Overload", allowed: false, notes: "Staggered resolves at the end of the target's next turn." },
    { resonance: "Electromagnetic", effect: "Magnetic Seize", allowed: true, notes: "Targets repeat the save at the start of each of their turns (Shaking It Off)." },
    { resonance: "Visceral", effect: "Adrenal Overclock", allowed: true, notes: "When the held effect ends, the target gains 1 level of Fatigue." },
    { resonance: "Visceral", effect: "Forceful Sedation", allowed: true, notes: "The re-save still rolls; the Unconscious it causes doesn't fail it." },
    { resonance: "Visceral", effect: "Regrowth", allowed: false, notes: "Instant healing." },
    { resonance: "Spatial", effect: "Spatial Displacement", allowed: false, notes: "Instant teleport." },
    { resonance: "Spatial", effect: "Folded Terrain", allowed: true, notes: "Fills the Invocation's area; needs Focused or Wide Area delivery." },
    { resonance: "Spatial", effect: "Void Pocket", allowed: true, notes: "Hazard zone: tests anyone inside when it opens, who enters, or starts a turn there." },
    { resonance: "Cognitive", effect: "Neural Override", allowed: false, notes: "One turn of forced action only." },
    { resonance: "Cognitive", effect: "Sensory Collapse", allowed: true, notes: "Target repeats the save at the start of each of its turns (Shaking It Off)." },
    { resonance: "Cognitive", effect: "Blind Spot", allowed: true, notes: "Ends early if the target attacks or forces a save." },
    { resonance: "Synthetica", effect: "Nixie Synchronization", allowed: false, notes: "Short Attention Spans: no Sustain." },
    { resonance: "Synthetica", effect: "Gremlin Tantrum", allowed: false, notes: "Short Attention Spans: no Sustain." },
    { resonance: "Synthetica", effect: "Poltergeist", allowed: false, notes: "Short Attention Spans: no Sustain." },
    { resonance: "Temporal", effect: "Chronal Acceleration", allowed: false, notes: "Resolves on the target's next turn." },
    { resonance: "Temporal", effect: "Stasis Field", allowed: false, notes: "Always Instant per Stability Factor." }
  ],

  /* ---- Strain, Overdraw, Breakflow -------------------------------------- */
  /* The Strain Track (Stage / Name / Effect; the book's Symptoms column is flavour and is left out). `penalty` is the key
     the sheet and the tests already read and now holds the book's Effect column. Stage 3 no longer says
     "Precision Shaping costs 2 FP." (the book's table does not): that rule stays in precisionShaping.desc
     and in the engine. Each Stage keeps the effects of the Stages below it (js/flow.js lists them so). */
  strainNote: "Strain is the cost of Overdraw, counted in five Stages. Each Stage keeps the effects of the Stages below it.",
  strainTrack: [
    { stage: 1, name: "Ripple", symptoms: "A faint hum or vibration follows your movements.", penalty: "You roll with Snag on Invocation rolls." },
    { stage: 2, name: "Wave", symptoms: "Faint static or flickering light surrounds you.", penalty: "All Invocations cost +1 FP." },
    { stage: 3, name: "Surge", symptoms: "Visual distortions and a racing heartbeat.", penalty: "Overdraw Vitality damage increases from 1d4 to 1d6 per FP. Snag on Breakflow Checks." },
    { stage: 4, name: "Rend", symptoms: "Crackling energy, tremors, and uncontrolled bursts.", penalty: "Must roll a Breakflow Check when Overdrawing. Spending FP (not just Overdraw) costs 1 flat Vitality per FP." },
    { stage: 5, name: "Collapse", symptoms: "Total silence and disconnection.", penalty: "Immediate Breakflow; you fall Unconscious." }
  ],
  overdraw: {
    vitalityLoss: "Lose 1d4 Vitality per 1 FP spent past your Reservoir (1d6 at Stage 3 Strain or higher).",
    strain: "If an Overdraw causes any Vitality loss, accumulate Strain points equal to the FP spent beyond your Reservoir. Gain 1 Stage of Strain per 3 Strain points.",
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
    note: "A structured meditation that repairs the Reservoir and eases Strain. Usable once per 24 hours; extra attempts fail and inflict 1 Stage of Strain (Resonant Saturation). The Lead Shaper chooses how many Stages of Strain to recover; each Stage needs its own Flow Dice Pool check.",
    byStage: [
      { stage: 1, name: "Ripple", time: "10 Minutes", snag: 1 },
      { stage: 2, name: "Wave", time: "30 Minutes", snag: 2 },
      { stage: 3, name: "Surge", time: "1 Hour", snag: 3 },
      { stage: 4, name: "Rend", time: "2 Hours", snag: 4 }
    ],
    outcomes: [
      { margin: "+3 or more", result: "Flawless", text: "Remove 2 Stages of Strain and restore 2d4 Flow Points." },
      { margin: "+1 to +2", result: "Costly", text: "Restore 1d4 Flow Points and remove 1 Stage of Strain." },
      { margin: "0", result: "Mixed", text: "Remove 1 Stage of Strain, but restore no Flow Points." },
      { margin: "-1 or worse", result: "Failure", text: "Apply 1 Stage of Strain." }
    ],
    cooperative: "Up to three additional Shapers may assist. Each must remain focused for the entire duration. Each grants +2 Edge Dice to the Lead Shaper's pool, or instead makes their own check to remove 1 Stage of Strain from a different participant."
  },
  breakflowRestoration: {
    intro: "Breakflow Restoration is the specialized Ritual Recovery that ends Breakflow.",
    full: "Full Restoration: in a Flow-rich area (Anomaly Severity 0) during an 8-hour Long Rest, a Positive Margin on a Flow Dice Pool check vs 5 Snag Dice restores the Reservoir to half capacity and reduces Strain to Stage 2. On failure, you stay in Breakflow and take 2d6 Vitality loss.",
    rough: "Rough Restoration: in a Severity 1 or lower area during a 4 hour rest, a Positive Margin vs 6 Snag Dice restores the Reservoir to one-quarter capacity and reduces Strain to Stage 3. On failure, you stay in Breakflow and take 2d6 Vitality loss."
  },

  /* ---- Advanced Techniques ------------------------------------------------------
     PHB:8800-8890, "Master Forging and Advanced Techniques", after The Ritual of Alignment: two
     groups the Shaper unlocks by level, two techniques each, every entry transcribed whole. The
     Shaper's Resonance Synthesis (level 3) and Master Forging (level 7) features only name them
     (data/class_scoundrel_shaper.js); the Codex's Advanced Techniques panel (js/codex_flow.js,
     fl-advanced) prints the rules, and the feature names link there. `cost` is the FP the entry
     asks for (PHB:8814, :8856, :8889), shown as the entry's tag. */
  advancedTechniques: [
    { key: "resonance-synthesis", name: "Resonance Synthesis", levelLabel: "Level 3", techniques: [
      { key: "flow-linking", name: "Flow Linking", cost: "2 FP per participant",
        text: "Flow Linking briefly joins the resonance of two or more Characters into one shared frequency.\nActivation: Spend 2 FP per participant and make simultaneous Flow Dice Pool checks against 2 Snag Dice.\nDuration: A Positive Margin (+1 or more) creates a stable connection lasting 10 minutes.\nEffects: Participants communicate thoughts and sensory data instantly. Linked members may transfer up to 2 FP per round to another linked member as a Free Action.\nRisks: If one participant enters Breakflow or falls Unconscious, all linked members immediately gain 1 Stage of Strain." },
      { key: "resonance-amplification", name: "Resonance Amplification", cost: "2 additional FP",
        text: "A Shaper may focus and magnify their output beyond normal limits.\nActivation: Declare you are entering Amplified Resonance before making an Invocation. Spend 2 additional FP and make a Flow Attribute Check (DC 15).\nOn Success: Add an extra 1d6 damage to the Invocation, beyond the Caliber dice. Alternatively, increase the Empowered Effect by one tier of intensity at the GM's discretion.\nOn Failure: You immediately suffer 1 Stage of Strain and 1d4 Vitality loss. The Invocation resolves at its standard power level." }
    ] },
    { key: "layered-force", name: "Layered Force", levelLabel: "Level 5", techniques: [
      { key: "layered-force", name: "Layered Force", cost: "+1 FP to layer",
        text: "Layered Force braids two Resonances into a single Invocation.\nEmpowered Pair: On an Empowered Invocation, spend +1 FP to get both the Caliber dice and the Empowered Effect. It still takes one Action.\nLayering: Spend +1 FP to layer a secondary Resonance onto a primary in one Invocation. This is Channel Major Flow, a Complex Action. A Resonance can be layered onto itself.\nCosts: Each layer picks its own row from Intent and Force, and both rows come from the same family: Damage or Empowered Damage, Base Effect or Empowered Effect, Hybrid or Empowered Pair. Only one layer can take a row with Caliber dice (Empowered Damage or Empowered Pair). Delivery, Scaling, and Precision Shaping are paid once. The cap covers the whole Invocation.\nDamage: Each layer rolls its own 1d6 + Flow Modifier, and the Caliber dice are added once. The total counts as both damage types: Resistance applies only if the target resists both, Vulnerability applies if it's vulnerable to either, and armor doesn't reduce it if either layer bypasses armor. A critical adds your Flow Modifier once, not per layer.\nEffects: Two layers can't apply the same effect, and a condition both layers would impose applies once.\nThe Roll: The primary Resonance decides how the Invocation is rolled: its Flow Attack, or the save its rules call for. The secondary's Stability Factor doesn't change the roll, but its other limits stand: what it can target, whether it can be held, and what it ignores. A layer that can't affect a target does nothing to it. A target the primary can't affect isn't a valid target.\nHolding: You can sustain two effects at once. Each layer you hold pays its own upkeep and takes its own slot." }
    ] },
    { key: "master-forging", name: "Master Forging", levelLabel: "Level 7", techniques: [
      { key: "cooperative-channeling", name: "Cooperative Channeling", cost: "1 to 3 FP per Contributor",
        text: "Multiple Shapers may join their resonance to perform a single massive Invocation. One Shaper acts as the Conductor, while the others serve as Contributors.\nSetup: Each Contributor must share the Conductor's wavelength. This requires a Flow Attribute Check (DC 10) from each participant.\nMechanics: Each Contributor adds 1 to 3 FP toward the total cost of the Invocation. Each Shaper's share counts against their own cap, so the whole can run past any one of them.\nThe Conductor rolls the Invocation Check, adding a +1 bonus per Contributor (max +3).\nThe Recoil: If the Invocation Check results in a Critical Failure (Margin -5 or worse), or every target beats your Flow Save DC by 5 or more, all participants apply 1 Stage of Strain." },
      { key: "sustained-fields", name: "Sustained Fields", cost: "5 FP, reserved",
        text: "A Sustained Field is a long-term Flow effect maintained over hours or days, such as a protective ward or environmental purification.\nWhat It Holds: One Empowered Effect that can be sustained (see Sustain), or a helpful Base Effect. Shape it as usual (its Delivery and Scaling set the Field's area), then anchor it in place of Sustain. A Field takes no sustain slot.\nAnchoring: Spend 5 FP and make a Flow Dice Pool check against 3 Snag Dice, plus 1 Snag Die per 2 spaces of Scaling. You need the 5 FP on hand; Overdraw can't pay for it. A positive Margin anchors the Field. A Mixed Result anchors it and applies 1 Stage of Strain. A Failure spends the 5 FP, anchors nothing, and applies 1 Stage of Strain.\nReserved FP: While the Field stands, your maximum FP is 5 lower. It has no hourly cost and no daily Strain. Ending the Field restores your maximum, not the points.\nEnding It: You can end a Field at any time, no action needed. It also ends if you enter Breakflow or a Null Scar touches it. Sleep and unconsciousness don't end it.\nShared Fields: Shapers can split the 5 FP. Each spends their share and lowers their own maximum by it. The Field ends if any of them drops their share or enters Breakflow." }
    ] }
  ],

  /* ---- Premade Resonant Patterns (formulations) ------------------------- */
  // The four the book prints (2026-10-16 handoff). Six were cut because they copied
  // their Empowered Effect entries: Triage Pulse, Arc Lightning, Phantom Shroud,
  // Adrenal Overclock, Thermal Breach, Fold Space. The Empowered Effects themselves
  // stay in resonances[]; a character who saved a cut premade keeps it, because SAVE
  // copies the pattern by value into ch.flow.patterns.
  // Stored as the component choices so the FP cost and damage recompute from the
  // character's live Caliber and Flow Modifier. extraTargets / extraSpaces are
  // additional scaling steps (+1 FP each). empoweredEffect names the chosen
  // Empowered Effect when the force is empowered and the intent carries an effect;
  // baseEffect names the chosen Base effect (resonances[].baseOptions) when the force is base.
  premadePatterns: [
    { name: "Kinetic Slam", resonance: "kinetic", intent: "damage", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false },
    // The book prints "Resolution: No roll." (2026-10-16 handoff): unwilling false reads
    // "Automatic" on the row and loads into the builder as Willing / Object; `note` is the
    // book's Resolution line, shown under the row.
    { name: "Flash-Freeze Zone", resonance: "thermal", intent: "effect", deliveryBand: "wide", deliveryOption: "Sphere (3 spaces)", force: "base", duration: "instant", precision: true, unwilling: false, baseEffect: "Freeze",
      note: "Resolution: No roll. Liquids in an Area 3 sphere freeze automatically, sparing 4 chosen Allies." },
    { name: "Dimensional Tear", resonance: "spatial", intent: "damage", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false },
    { name: "Gravity Anchor", resonance: "kinetic", intent: "effect", deliveryBand: "focused", deliveryOption: "Cube (2 spaces)", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Gravity Pin" }
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
       GM advice paragraphs (now the Toolkit's Anomalies at the Table) and the
       Gameplay Summary box (4643 to 4697)
     ## Inside a Null Scar: The Focal Anchor, with ### Identifying the Anchor,
       ### Destroying the Anchor, ### When the Anchor Falls (4699 to 4733)
     ## Repairing a Null Scar, with ### Establishing Anchors, ### The
       Reconstruction Ritual, ### Outcome and Aftermath and its GM advice
       paragraphs (now the Toolkit's Running the Repair) (4735 to 4801)
   Two passages live elsewhere in the rulebook and are carried here because they
   are anomaly rules no other panel shows:
     nullScarGuidance  ## Overdraw, Strain, and Breakflow > ### Breakflow Check,
                       the GM advice, its "Anomalies" item (line 4444); the Game
                       Master's Toolkit prints it as the Anomalies run-in of Breakflow
                       and Strain, which reads "the Focal Anchor mechanic" (round 2,
                       16 October 2026)
     disturbedGround   the Player's Handbook, ## Breakflow Restoration > ### Rough
                       Restoration, its closing run-in "Disturbed Ground"
                       (batch 45, 16 October 2026); a player rule, so it shows on
                       both desktops
   The text is the book's, trimmed to its rules, with its **bold** kept. Labels and
   margins are split into fields so the Codex can table them.
   No em or en dashes anywhere in this block (house style).
   =========================================================================== */
EN.flow.disturbances = {
  intro: "An anomaly is the disruption left behind when the Flow gets bent, blocked, or torn. Anomalies scramble shaping, throw off resonance, and spread if nobody puts a hand on them.",

  coreConcepts: [
    { term: "Severity Rating", text: "A scale from 1 to 5 measuring the instability and danger of an Anomaly." },
    { term: "Cleansing Project", text: "The structured process of reducing an Anomaly's Severity using the Dice Pool Method." },
    { term: "Target Progress", text: "The total number of successful milestones required to complete a Cleansing Project." },
    { term: "Counter Progress", text: "A cumulative tracker used to suppress an Anomaly in combat via Counter Flow." },
    { term: "Focal Anchor", text: "The structural point where a Null Scar crystallized: the only way to temporarily collapse a Scar in combat." }
  ],

  /* ### Anomaly Classifications: Type and Mechanical Impact, in the book's order */
  classifications: [
    { key: "echo", name: "Echo Field", effect: "Characters suffer **Snag** on Perception checks, and **Snag** on Invocation checks." },
    { key: "static", name: "Static Zone", effect: "Invocations cost **+1 FP**; damage dice and effect magnitudes are **halved**; targets of Empowered Effects gain **Edge** on saves; FP can't be recovered while inside; sustained effects require a **Focus Check** at the start of each of your turns, at DC 12 if you took no damage." },
    { key: "storm", name: "Resonant Storm", effect: "Invocations cost **+1 FP**. Failed checks deal **1d4 Vitality damage**." },
    { key: "corrupted", name: "Corrupted Signature", effect: "Every Invocation performed in the zone that costs **2 or more FP** causes **1 Stage of Strain**." },
    { key: "parasite", name: "Flow Parasite", effect: "Characters attuned to the Flow within 2 spaces lose **1 FP per round**." },
    { key: "scar", name: "Null Scar", effect: "Total vacuum. FP is suppressed to 0. Attempts to shape cause **Automatic Overdraw**. The Scar may be temporarily collapsed by destroying its **Focal Anchor**." }
  ],

  /* Player's Handbook, ## Breakflow Restoration > ### Rough Restoration, the closing run-in
     "Disturbed Ground", as printed (the book's "\-" escape dropped, nothing else). It is a
     player rule, so the Codex shows it on both desktops (fl-dist/disturbed-ground). It replaces
     the old Admin-only ritualImpact items (Environmental Impact, Failure Margin), which were
     the same rule from the superseded Part 2 GM advice; the Game Master's Toolkit no longer
     prints either item. */
  disturbedGround: "In an area with a Flow Disturbance, a restoration ritual's Snag Dice increase by the Anomaly's Severity Rating. On a Critical Failure (Margin -3 or worse), the ritual site becomes a temporary Echo Field (Severity 1).",

  /* ## Detecting and Analyzing */
  detection: {
    intro: "Detection occurs through three primary methods:",
    methods: [
      { name: "Resonance Sense", mode: "Passive", text: "You automatically detect strong disturbances within **6 spaces**." },
      { name: "Focused Tuning", mode: "Active", text: "Make a **d20 Flow Attribute Check (DC 10 + Anomaly Severity)** to identify its exact type, Severity, and the required Target Progress to cleanse it." },
      { name: "Echo Listening", mode: "Meditation", text: "Spend 1 minute in silence to gain **Edge** on your next analysis check. On a failure, the sensory overload inflicts **1 Stage of Strain**." }
    ]
  },

  /* ### Cleansing and Repair: the Harmonic Realignment Project */
  cleansing: {
    intro: "Cleansing an Anomaly is a deliberate, out-of-combat **Project** on the **Dice Pool Method**.",
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
      { margin: "+1 to +2", result: "Costly Success", text: "1 Progress." },
      { margin: "0", result: "Mixed Result", text: "1 Progress, but the Lead Shaper suffers **1 Stage of Strain** from turbulent energy." },
      { margin: "-1 to -2", result: "Failure", text: "0 Progress, and the Lead Shaper suffers **1 Stage of Strain**." },
      { margin: "-3 or worse", result: "Critical Failure", text: "0 Progress. The Anomaly violently rejects the alignment; Severity **increases** by 1, and all participating Shapers suffer **1 Stage of Strain**." }
    ],
    complete: "When the accrued Progress meets the Target Progress, the Anomaly is completely cleansed."
  },

  /* ### Counter Flow */
  counterFlow: {
    intro: "Emergency stabilization under fire uses the **d20 Method**. It can't permanently cleanse an Anomaly, but it can suppress it round-by-round and, with enough effort, for the entire Encounter.",
    rules: [
      { name: "The Mechanic", text: "As an Action, spend **1 FP** and make a d20 Flow Attribute Check." },
      { name: "The DC", text: "10 + (Anomaly Severity x 2)." },
      { name: "On Success", text: "Accumulate **1 Counter Progress**. The Anomaly's mechanical effects are **suppressed for 1 round within an Area 3 radius** of you." },
      { name: "At 3 Cumulative Successes", text: "The Anomaly is fully suppressed for the remainder of the Encounter." },
      { name: "Cooperative Suppression", text: "Multiple Shapers may contribute to the same Counter Progress pool, with each contributing checks on their own turns." }
    ]
  },

  /* ### Ritual Chorus */
  ritualChorus: "Multiple Shapers can join a Harmonic Realignment Project. The Lead Shaper rolls the primary Dice Pool, and each assisting Shaper grants +2 Edge Dice to the pool. This is a fixed benefit of the ritual, separate from the Help Action and not bound by its cap. On a Critical Failure, *all* participants suffer the resulting Strain.",

  /* the GM advice after Ritual Chorus (the Toolkit's Anomalies at the Table): each label is a bold run-in
     the book prints, shown as its own card with no GM label */
  gmGuidance: [
    { label: "Escalation", text: "The threat of a Critical Failure (-3 Margin) on a Dice Pool makes Severity 4 and 5 Anomalies dangerous to cleanse. Freelancers will need Ritual Chorus or Flow-infused tools (like a Rite Calibration Kit) to build enough Edge Dice to attempt high-level cleansing safely." }
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
    /* The lead and the closing are the Handbook's own lines (PHB:8952 and PHB:8958). The Part 2
       paragraphs they replace (the Scar suppressing FP, the benched Shaper, the Scar as a spotter's
       ground) are not in the book now; the Null Scar classification still says what a Scar does to FP. */
    intro: [
      "Every Null Scar has a Focal Anchor, the point where its structure crystallized when it formed."
    ],
    identify: {
      text: "A Shaper inside or adjacent to a Scar may spend an Action on an **Awareness or Esoterica** check (using Mystique or their Flow Attribute) to identify the Anchor's location.",
      dc: "12 + Scar Severity.",
      onSuccess: "The Anchor's position becomes visible to all allies: a small physical artifact, such as a fused metal node or a shard of crystallized space."
    },
    destroy: {
      text: "Once revealed, the Anchor can be physically destroyed by non-Flow attacks. Unattuned characters can engage it directly.",
      defense: 14,
      vitalityPerSeverity: 15,
      vitality: "15 × Scar Severity",
      immunities: "Flow damage and effects."
    },
    falls: {
      text: "When the Anchor is destroyed, the Null Scar collapses for **1d4 + Lead Shaper's Flow Modifier rounds**. Within this window:",
      effects: [
        "All shaping functions normally inside the former Scar.",
        "Shapers can attempt Counter Flow, perform standard Invocations, and even regain FP (Short Rest refreshes resume).",
        "Once the window closes, the Scar reforms at the same Severity unless a proper Cleansing Project has been completed in the interim.",
        "If Counter Flow fully suppressed it first, it stays suppressed until the Encounter ends."
      ]
    },
    closing: "Destroying the Anchor never repairs the Scar. Permanent repair is the Reconstruction Ritual, an extreme-tier Cleansing Project for a Lead Shaper and assistants, detailed in the Game Master's Toolkit."
  },

  /* Part 2, the Breakflow Check's GM advice, its "Anomalies" item (line 4444); the Toolkit's Breakflow and Strain prints it as a plain paragraph */
  nullScarGuidance: "Treat **Null Scars** as environmental hazards. They are tactical \"dead zones\" where Shapers are stripped of their primary utility, forcing them to rely on physical backup weapons and the Focal Anchor mechanic to support the team.",

  /* ## Repairing a Null Scar */
  repair: {
    intro: [
      "A **Null Scar** is the worst Flow disturbance there is: local resonance collapsed all the way down. Inside one, the vacuum rejects all shaping.",
      "Repairing a Null Scar runs as an extreme-tier **Cleansing Project** requiring a Lead Shaper and preferably multiple assistants.",
      "Destroying a Focal Anchor only opens a temporary window; it doesn't repair the Scar. Permanent repair requires the Reconstruction Ritual below."
    ],
    anchors: {
      text: "The team must first place a minimum of four Anchor Nodes around the perimeter of the Scar.",
      mechanics: "Setting each node requires **1 FP** and an immediate **d20 Flow Attribute Check (DC 15)**.",
      failure: "The node fails to hold the charge, wasting the FP and requiring a new attempt."
    },
    ritual: {
      text: "Once the perimeter is secure, the Lead Shaper begins drawing Flow from the anchors toward the dead center.",
      rules: [
        { name: "Cleansing Interval", text: "1 Hour per roll." },
        { name: "Interval Cost", text: "The Lead Shaper must spend **2 FP** at the start of each interval to maintain the pulse." },
        { name: "Primary Skill", text: "Esoterica or Awareness." },
        { name: "The Snag", text: "The GM's Snag pool starts at **5 Snag Dice** but may increase based on environmental hazards." }
      ]
    },
    /* Scar Size / Target Progress / Residual Severity (on Completion) */
    sizes: [
      { size: "Small", scale: "Room", target: 6, residual: "1 (Echo Field)" },
      { size: "Medium", scale: "Building", target: 10, residual: "2 (Instability, treated as a Static Zone)" },
      { size: "Large", scale: "District", target: 15, residual: "4 (Resonant Collapse, treated as a Resonant Storm)" }
    ],
    intervals: "Convert the Success Margin into Progress:",
    outcomes: [
      { margin: "+3 or more", result: "Flawless Success", text: "2 Progress." },
      { margin: "+1 to +2", result: "Costly Success", text: "1 Progress." },
      { margin: "0", result: "Mixed Result", text: "1 Progress, but the Lead Shaper suffers **1 Stage of Strain**." },
      { margin: "-1 to -2", result: "Failure", text: "0 Progress. The Lead Shaper suffers **1 Stage of Strain** and **1d4 Vitality loss** from the backlash." },
      { margin: "-3 or worse", result: "Critical Failure", text: "0 Progress. The ritual violently collapses in a **Resonant Surge**." }
    ],
    completion: [
      "The group must spend a final combined **5 FP** to permanently rebind the core.",
      "The Null Scar is instantly downgraded to a lower Severity Anomaly (see table above). It will naturally dissipate over 1d4 weeks.",
      "All participating Characters experience a **Resonant Kickback**, immediately regaining **2d4 FP**."
    ],
    collapse: [
      "The ritual fails completely. All accrued Progress is lost.",
      "All attuned Characters within 6 spaces suffer **2d6 Vitality damage**.",
      "The Scar becomes highly volatile; no further repair attempts can be made for **1d4 days**."
    ],
    gmGuidance: [
      { label: "The Stakes", text: "A Null Scar repair is rarely just a roll. Let it land as one of the big moments of the campaign." },
      { label: "Under Fire", text: "If the Reconstruction Ritual is interrupted by combat, the Project is paused. The Lead Shaper must make a **d20 Flow Attribute Saving Throw (DC 15)** each round they take damage to maintain the anchored connection. The connection only drops (inflicting a **Critical Failure** on the Project) if the Lead Shaper fails this check on **two consecutive rounds**." }
    ]
  }
};
