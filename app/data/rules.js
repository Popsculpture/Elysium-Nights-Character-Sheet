/* ===========================================================================
   ELYSIUM NIGHTS · Core Rules Constants  (#GRID Smartdeck OS)
   The single source of truth for the engine. Extracted from the rulebook
   (Part 1 · Building a Character; Part 2 · Core Rules).
   =========================================================================== */
window.EN = window.EN || {};

EN.rules = {
  schemaVersion: 1,

  /* The Six Attributes ---------------------------------------------------- */
  attributes: [
    { key: "BOD", name: "Body",     abbr: "BOD", blurb: "Physical strength, endurance, and resilience." },
    { key: "AGI", name: "Agility",  abbr: "AGI", blurb: "Reflexes, coordination, and fine control." },
    { key: "WIT", name: "Wits",     abbr: "WIT", blurb: "Perception, insight, and quick analysis." },
    { key: "TEC", name: "Tech",     abbr: "TEC", blurb: "Technological skill, logic, and mechanical intuition." },
    { key: "MYS", name: "Mystique", abbr: "MYS", blurb: "Resonant will, intuition, and connection to the Flow." },
    { key: "CHA", name: "Charm",    abbr: "CHA", blurb: "Presence, persuasion, and force of personality." }
  ],
  // map full attribute name -> key (for parsing class data which uses full names)
  attrNameToKey: { Body:"BOD", Agility:"AGI", Wits:"WIT", Tech:"TEC", Mystique:"MYS", Charm:"CHA" },

  /* Attribute Generation -------------------------------------------------- */
  pointBuy: {
    base: 10,
    pool: 27,
    maxStart: 16,
    minStart: 8,
    // cumulative point cost to REACH a given score from base 10
    // 11/12/13 = 1 each, 14/15 = 2 each, 16 = 3. The Flaw: lowering exactly ONE
    // attribute to 8 refunds 2; 9 is not a valid point-buy score.
    costToReach: { 8:-2, 10:0, 11:1, 12:2, 13:3, 14:5, 15:7, 16:10 },
    maxFlaws: 1
  },
  standardArray: [16, 14, 12, 10, 10, 8],
  hardCapMax: 20,

  /* Encumbrance and Load ---------------------------------------------------
     Load is abstract weight and bulk. Threshold = 6 + Body modifier (min 3);
     gear that raises it "one step" adds 2. The declared Loadout tier sets the
     Load Budget; on-person gear spends it. */
  encumbrance: {
    loadouts: [
      { key: "light",    name: "Light",    delta: -3, effect: "You read as foot traffic. Edge on in-combat d20 checks to blend into a crowd, conceal your gear, or pass checkpoint scrutiny; +1 Edge Die on related out-of-combat Dice Pools." },
      { key: "standard", name: "Standard", delta: 0,  effect: "You look like a Freelancer on a job. No perk, no penalty." },
      { key: "heavy",    name: "Heavy",    delta: 3,  effect: "You are Encumbered for the run. Nobody asks the walking armory for a lunch order." }
    ],
    states: {
      unencumbered: { name: "Unencumbered", effect: "Move and act normally; no penalties from carried weight." },
      encumbered:   { name: "Encumbered",   effect: "Speed -2. Snag on in-combat Agility or Body d20 checks that rely on nimble movement, balance, climbing, swimming, squeezing, or sudden repositioning; +1 Snag Die on related out-of-combat Dice Pools." },
      overloaded:   { name: "Overloaded",   effect: "Speed halved (round down) and no Dash. Snag on all Agility d20 checks and most Body checks (pure bracing or holding excepted); +1 Snag Die on related out-of-combat Dice Pools. No Complex Actions that need careful movement until you drop part of the load. Staying Overloaded through an extended physical scene can cost 1 Fatigue." }
    },
    hauls: [
      { key: "none", name: "No haul",                    hint: "Nothing in your arms. Hauls do not spend Load Budget; they set your state directly." },
      { key: "lift", name: "Hauling: body-sized",        hint: "Short lift and carry of something roughly your Size: treated as Encumbered (Overloaded if you already were). Smaller loads may stay free at GM call." },
      { key: "drag", name: "Hauling: oversized / double", hint: "Something larger than you, or two body-sized loads at once: treated as Overloaded. Wheels, sleds, carts, or help can step it down, at GM call." }
    ],
    loadTable: [
      { load: "0",  items: "Clothes, credsticks, comms, loose ammo, small personal items" },
      { load: "1",  items: "Sidearm, light melee weapon, compact medkit, smartdeck, reagent pouch, small tool" },
      { load: "2",  items: "Longarm, medium melee weapon, shield, full toolkit, drone, packed armor, bulky pack" },
      { load: "3",  items: "Heavy weapon, heavy shield, breaching kit, heavy tool rig, heavy armor, dense duffel" },
      { load: "4+", items: "Unconscious adult, cargo crate, generator, server rack, turret, industrial case (stowed as cargo; carried in the arms it is a Haul instead)" }
    ],
    notes: "Load 0 items ride free within reason. Armor counts whether worn or packed: 1 Light, 2 Medium, 3 Heavy. Reveal packed gear any time (\"I packed that\") if it fits the budget and the silhouette; once revealed it stays revealed. Loot picked up mid-run adds its Load the same way."
  },

  /* Modifier scale: mod = floor((score - 10) / 2).
     Verified against prose: 10-11→+0, 8-9→-1, 16-17→+3, 18-19→+4, 20→+5, 1→-5 */
  modifier: function (score) { return Math.floor((score - 10) / 2); },

  /* Caliber: the class growth dial. ceil(level / 2). 1-2→1 … 9-10→5 */
  caliberByLevel: { 1:1,2:1,3:2,4:2,5:3,6:3,7:4,8:4,9:5,10:5 },

  /* Static modifiers on a d20 check cap at +15. Caliber from a Skill Focus,
     advantage states like Edge, and an expanded critical threat range sit
     outside this cap. (No engine value stacks high enough to hit it; kept here
     as the canonical number for the rules reference.) */
  staticModCap: 15,

  /* Proficiency tiers ----------------------------------------------------- */
  profTiers: {
    untrained:  { key:"untrained",  name:"Untrained",  d20:0,  pool:0,  snag:true,  short:"-" },
    proficient: { key:"proficient", name:"Proficient", d20:2,  pool:2,  short:"P" },
    expertise:  { key:"expertise",  name:"Expertise",  d20:4,  pool:4,  short:"E" },
    mastery:    { key:"mastery",    name:"Mastery",    d20:6,  pool:6,  short:"M" }
  },
  profOrder: ["untrained", "proficient", "expertise", "mastery"],

  /* Skills, grouped by parent Attribute ----------------------------------- */
  skills: [
    { key:"athletics",     name:"Athletics",     attr:"BOD", desc:"Physical exertion, endurance, and feats of strength." },
    { key:"acrobatics",    name:"Acrobatics",    attr:"AGI", desc:"Balance, tumbling, and controlled movement." },
    { key:"stealth",       name:"Stealth",       attr:"AGI", desc:"Moving quietly and remaining unseen." },
    { key:"sleight",       name:"Sleight",       attr:"AGI", desc:"Precision and manual trickery." },
    { key:"perception",    name:"Perception",    attr:"WIT", desc:"Awareness of sensory detail and immediate threats." },
    { key:"investigation", name:"Investigation", attr:"WIT", desc:"Logical reasoning, deduction, and analysis." },
    { key:"intuition",     name:"Intuition",     attr:"WIT", desc:"Reading motives, emotions, and subtle intentions." },
    { key:"engineering",   name:"Engineering",   attr:"TEC", desc:"Building, repairing, and modifying mechanical or structural systems." },
    { key:"systems",       name:"Systems",       attr:"TEC", desc:"Digital operations, AI logic, and network management." },
    { key:"medtech",       name:"Medtech",       attr:"TEC", desc:"Treating injuries, performing surgery, or maintaining cybernetics." },
    { key:"awareness",     name:"Awareness",     attr:"MYS", desc:"Sense and interpret unseen forces, residue, or Flow anomalies." },
    { key:"esoterica",     name:"Esoterica",     attr:"MYS", desc:"Study of mystical traditions, symbols, and rituals." },
    { key:"persuasion",    name:"Persuasion",    attr:"CHA", desc:"Influence through empathy, reason, diplomacy, or pressure." },
    { key:"deception",     name:"Deception",     attr:"CHA", desc:"Conceal truth or mislead others." }
  ],
  // Example Focus/Specialization aspects per skill (used for UI placeholders).
  focusExamples: {
    athletics: "Climbing / Throwing / Grappling",
    acrobatics: "Balance / Parkour / Escape Artist",
    stealth: "Camouflage / Silent Movement",
    sleight: "Pickpocketing / Lockpicking",
    perception: "Sharp Sense / Lip Reading",
    investigation: "Profiling / Cryptanalysis / Tracking",
    intuition: "Threat Assessment / Cold Read / Lie Detection",
    engineering: "Mechanical / Electrical / Demolition",
    systems: "Hacking / Data Analysis / Cipher Decoding",
    medtech: "First Aid / Surgery / Toxicology",
    awareness: "Flow Detection / Aura Reading",
    esoterica: "Ritual Design / Sigilcraft / Wardcraft",
    persuasion: "Diplomacy / Negotiation / Rhetoric",
    deception: "Bluffing / Impersonation / Forgery"
  },

  // Lineage Additive Features available AT CHARACTER CREATION (by lineage key).
  // Any feature NOT in this list is unlocked only later via Lineage Evolution.
  lineageCreationFeatures: {
    freeborn: ["Void Lung", "Radiation Callouses", "Lowlight Optics", "Spinward Bones"],
    nextgen: ["Dermal Plating", "Synthetic Musculature", "Dermal Induction", "Living Relay"],
    phasebound: ["Spatial Flicker", "Static Premonition", "Entropic Lash", "Temporal Snare"],
    arboreal: ["Ironbark Carapace", "Timber Fortitude", "Canopy Reach", "Deep Roots"],
    floral: ["Pheromone Bloom", "Venom Nectar", "Briar Strike", "Scent Marker"],
    mycelial: ["Fungal Network", "Decay Whisper", "Spore Hallucination", "Sludge Crawler"],
    laborframes: ["Heavy Payload", "Vice Grip", "Lockpoint Stance", "Demolition Engine"],
    durabodies: ["Blast Deflection", "Ablative Armor", "Redundant Systems", "Hazard Seal"],
    lifelikes: ["Empathy Emulator", "Biometric Spoofing", "Vital Static", "Disarming Cadence"],
    hulsk: ["Hulskpitality", "Brutal Frame", "Slaughterhouse Charge", "Ironhide Tusks"],
    skarn: ["Neon Chameleon", "Warmblood Sense", "Butcher Spurs", "Prey Stalker's Grip"],
    ryn: ["Rabbitwire Reflex", "Cagebreak Instinct", "Highground Hunger", "Hare-Trigger Instinct"],
    "cinder-heart": ["Forge-Blooded", "Cauterizing Vitae", "Volcanic Temper", "Fanatical Fervor"],
    harbinger: ["Calculated Execution", "Frictionless Stasis", "Algorithmic Insight", "Uncanny Presence"],
    grinling: ["Hyper-Kinetic Metabolism", "Scavenger's Maw", "Disjointed Anatomy", "Predator's Glare"]
  },

  // NextGen "Open Architecture", structured Integration pairings for the UI.
  // Each combo pairs a NextGen Lineage Feature with its matching cyberware.
  openArchitecture: {
    intro: "You were not built finished. You were built ready. Your body was engineered to documented interface standards: pre-threaded neural shunts, reserved anatomical space, tolerances no baseline human was ever given. Taking this feature opens the Integration clause of every NextGen Lineage Feature you possess, now or in the future.",
    rule: "Whenever you have both halves of a listed pairing (the Lineage Feature and its matching cyberware, installed at any tier), that clause activates: the Engineered Baseline effect ends as a separate system and is absorbed into the chrome, the chrome gains enhanced capability, and its Static Point cost is reduced by 1 (minimum 0). You never lose a Lineage Feature to an install; it lives on through the chrome. Select Open Architecture once; it covers every qualifying combination you ever assemble. Without it, your features and your chrome remain separate systems.",
    combos: [
      { key: "dermal-plating", feature: "Dermal Plating", cyberware: "Subdermal Armor",
        text: "When you install Subdermal Armor at any tier, your engineered bone integrates with the new chrome rather than being replaced by it. The Engineered Baseline effect continues, and the installed Subdermal Armor gains +1 DR (stacking with its normal bonus)." },
      { key: "synthetic-musculature", feature: "Synthetic Musculature", cyberware: "Reinforced Skeleton",
        text: "When you install a Reinforced Skeleton at any tier, your synthetic muscle integrates with the new bone-weaving. Every unarmed strike you can make steps up one damage die size, each on its own die and never stacking with itself: your bare fists, the Reinforced Skeleton, and any other implant you strike with. You retain the Encumbrance Threshold bonus and the Size-larger bonus for grappling." },
      { key: "dermal-induction", feature: "Dermal Induction", cyberware: "Neural Interface (Datajack)",
        text: "When you install a Neural Interface (Datajack) at any tier, the Engineered Baseline effect ends as a separate system and is absorbed into the implant. The Datajack now runs entirely through your skin: there is no exposed port and no install scarring at any tier, nothing for a hostile party to see, find, or physically access (this overrides the visible-port drawback of a Streetware Datajack). You can open a direct, wired-grade Link to any device you can physically touch, reaching past air-gaps that a remote hacker cannot, and while that touch-Link holds there is no wireless signal to intercept and no physical trace left at the device. (Encryption and tracing of your #GRID activity at range are still governed by the Datajack's own tier; Dermal Induction protects the body and the hands, not the signal.) In addition, as a Swift Action once per Encounter, by touching or coming within 1 space of a basic (Tier 0-1) security camera, automated door, or terminal, you can silently slave it without tripping an alert or notifying its network; you retain control of the device until the end of the Encounter." },
      { key: "living-relay", feature: "Living Relay", cyberware: "Subdermal Comm",
        text: "When you install a Subdermal Comm at any tier, the Engineered Baseline effect ends as a separate system and is absorbed into the implant. The relay network persists through the chrome and its range doubles to 24 spaces, and your transmissions become effectively untraceable through standard means: an enemy must succeed on a Tech check vs. DC 20 even to detect that you are transmitting, let alone trace or intercept it." },
      { key: "predictive-targeting", feature: "Predictive Targeting", cyberware: "Cybereyes",
        text: "When you install Cybereyes at any tier, the Engineered Baseline effect ends as a separate system and is absorbed into the implant. The mark lives on through the chrome, and your Cybereyes' Threat Targeting mode is permanently active whether or not you selected it as one of your modes. In addition, your optics broadcast the target lock to your crew; any ally who can see your target deals an additional 1d4 damage against it." },
      { key: "tuned-synapses", feature: "Tuned Synapses", cyberware: "Reflex Booster",
        text: "When you install a Reflex Booster at any tier, the Engineered Baseline effect ends as a separate system and is absorbed into the implant. The Reflex Booster's Initiative bonus increases by an additional +2, and you retain the first-round Speed increase of 2, which stacks with the implant's own Speed bonus." },
      { key: "calibrated-gait", feature: "Calibrated Gait", cyberware: "Cyberlegs or Spring Joints",
        text: "When you install Cyberlegs or Spring Joints at any tier, the Engineered Baseline effect ends as a separate system and is absorbed into the implant. The implant grants an additional +1 Speed beyond its normal benefits, and you take half damage from falling." }
    ]
  },

  /* ---- Size -------------------------------------------------------------
     Size is comparative and DERIVED: the player picks a height inside their
     Lineage's range and the band decides the category. There is deliberately
     no default: an unstatted NPC, drone, or vehicle does not silently become
     Medium. Tiny and Huge exist only for NPCs, animals, drones and vehicles;
     no lineage reaches either. */
  sizes: ["Tiny", "Small", "Medium", "Large", "Huge"],
  // Inclusive ranges in feet. A height landing exactly on a boundary takes the
  // LARGER category, which a simple less-than cascade implements exactly
  // (see eng.sizeFromHeightFt).
  sizeBands: [
    { size: "Tiny",   underFt: 2,        imperial: "under 2 ft.",  metric: "under 0.6 m" },
    { size: "Small",  underFt: 4,        imperial: "2 to 4 ft.",   metric: "0.6 to 1.2 m" },
    { size: "Medium", underFt: 8,        imperial: "4 to 8 ft.",   metric: "1.2 to 2.4 m" },
    { size: "Large",  underFt: 16,       imperial: "8 to 16 ft.",  metric: "2.4 to 4.8 m" },
    { size: "Huge",   underFt: Infinity, imperial: "over 16 ft.",  metric: "over 4.8 m" }
  ],
  sizeBandNote: "Two overrides stay with the GM and are not automated. Bulk overrides height: something low and wide, or long and coiled, may sit one category above what its height implies. Non-upright bodies (animals, drones, vehicles) are measured on their longest dimension, not height.",
  // Height range per lineage, the source of truth for that lineage's Sizes.
  // Harbingers have no variance: every Harbinger is exactly 6 ft.
  lineageHeight: {
    freeborn:      { min: 3, max: 7 },
    nextgen:       { min: 3, max: 7 },
    phasebound:    { min: 3, max: 7 },
    mycelial:      { min: 2, max: 4 },
    floral:        { min: 5, max: 6 },
    arboreal:      { min: 6, max: 10 },
    lifelikes:     { min: 3, max: 7 },
    durabodies:    { min: 6, max: 8 },
    laborframes:   { min: 6, max: 10 },
    skarn:         { min: 3, max: 4 },
    ryn:           { min: 3, max: 7 },
    hulsk:         { min: 6, max: 9 },
    grinling:      { min: 3, max: 5 },
    "cinder-heart": { min: 3, max: 7 },
    harbinger:     { min: 6, max: 6, fixed: true }
  },
  // Derived from lineageHeight via the bands above, listed explicitly so the
  // pairing can be validated without recomputing it.
  lineageSize: {
    freeborn: ["Small", "Medium"], nextgen: ["Small", "Medium"], phasebound: ["Small", "Medium"],
    mycelial: ["Small", "Medium"], floral: ["Medium"], arboreal: ["Medium", "Large"],
    lifelikes: ["Small", "Medium"], durabodies: ["Medium", "Large"], laborframes: ["Medium", "Large"],
    skarn: ["Small", "Medium"], ryn: ["Small", "Medium"], hulsk: ["Medium", "Large"],
    grinling: ["Small", "Medium"], "cinder-heart": ["Small", "Medium"], harbinger: ["Medium"]
  },
  // The printed Species Traits row for each species.
  speciesSizeDisplay: {
    humans: "Small to Medium", verdine: "Small to Large", clankers: "Small to Large",
    chimera: "Small to Large", outsiders: "Small to Medium"
  },
  // Grid footprint. A body filling more than one space is measured FROM THE
  // NEAREST OF ITS SPACES in both directions, which governs Range, Reach and
  // line of sight. An effect centred on you starts from whichever of your
  // spaces you choose at use time: Large on hex is three hexes meeting at a
  // corner, so there is no centre hex to default to.
  sizeFootprint: {
    Tiny:   { square: "1 space (up to 4 share a space)", hex: "1 hex (up to 4 share)", spaces: 1 },
    Small:  { square: "1 space", hex: "1 hex", spaces: 1 },
    Medium: { square: "1 space", hex: "1 hex", spaces: 1 },
    Large:  { square: "4 spaces (2 by 2)", hex: "3 hexes (a tight triangle)", spaces: 4 },
    Huge:   { square: "9 spaces (3 by 3)", hex: "7 hexes (1 plus its ring)", spaces: 9 }
  },
  // The only mechanical effects of Size beyond comparison. Neither touches a
  // d20 roll: Size grants no Edge, no Snag, no Defense and no Speed modifier.
  sizeTraits: {
    Small:  { encumbrance: -1, text: "Encumbrance Threshold -1. Passes tight geometry that forces a Medium to squeeze." },
    Medium: { encumbrance: 0,  text: "Baseline. No modifier." },
    Large:  { encumbrance: 1,  text: "Encumbrance Threshold +1. Squeezes at gaps a Medium passes freely." }
  },
  tightGeometry: "Passing through a gap too narrow for your Size means squeezing, which halves Speed for that movement only. It is not a standing penalty and deliberately not Difficult Terrain, so anything that ignores Difficult Terrain does not bypass it. It is relative: a Large body squeezes where a Medium walks, and a Small body walks where a Medium turns sideways. Whether a gap is narrow is a GM and scene input.",
  sizeComparison: {
    maneuvers: "Shove, Trip and Grapple can target something up to one Size larger than you. Two or more Sizes larger is out of reach without a feature or a favorable situation.",
    dragLift: "A body of your Size or smaller can be dragged or lifted without straining. A grapple-drag moves at half Speed.",
    occupiedSpace: "You may move into an ally's space, or the space of an enemy at least one Size smaller than you, at a cost of 2 Speed for that space instead of 1. Anyone else blocks movement entirely. You cannot end movement in an occupied space.",
    bodyGate: [
      { theirSize: "Smaller than you",        body: "Any",         holding: "Unencumbered" },
      { theirSize: "Your Size",               body: "16+",         holding: "Encumbered (Speed -2)" },
      { theirSize: "One Size larger",         body: "18+",         holding: "Overloaded (Speed halved, no Dash)" },
      { theirSize: "Two or more Sizes larger", body: "Not by hand", holding: "Needs an exoframe, heavy-lift cyberware, or the Flow" }
    ]
  },
  /* ---- Improvised Weapons (Part 3) ------------------------------------
     Reference rules, not catalog items: anything can be a weapon, so there is
     nothing to list. The Body Gate lives under sizeComparison because it is a
     Size table; meatShield is defined here once and rendered in both places. */
  improvised: {
    intro: "Improvised weapons are everything you pick up that was never built to be swung, which in Elysium is most things, and on a bad enough day, most people.",
    using: [
      "Action Economy: attacking costs an Action. Grabbing an obvious item within reach costs a Swift Action.",
      "No Proficiency: nobody trains on a fire extinguisher. You do not add a Weapon Proficiency Bonus to an improvised attack roll.",
      "Melee: roll an in-combat d20 (or out-of-combat Dice Pool) + your Body modifier + any relevant Skill.",
      "Thrown: roll an in-combat d20 (or out-of-combat Dice Pool) + your Body or Agility modifier + any relevant Skill."
    ],
    damageNote: "Size sets the die. Balance sets the trait: anything that sloshes, sags, squirms, or carries its weight at the wrong end is Unwieldy at any size. Pick a base die and a damage type (Bludgeoning, Slashing, or Piercing) from the object's shape and heft. The GM may shift the die one step either way for exceptionally dense or soft materials.",
    damage: [
      { size: "Tiny",       examples: "Bottle, mug, wrench, brick",          die: "1d4" },
      { size: "One-Handed", examples: "Pipe, chair leg, crowbar, laptop",    die: "1d6" },
      { size: "Two-Handed", examples: "Barstool, small sign, tool box",      die: "1d8" },
      { size: "Heavy",      examples: "Cinder block, street sign, engine block", die: "1d10 (gains Heavy)" }
    ],
    thrownNote: "When you throw something that was never meant to fly, set its range by weight.",
    thrown: [
      { kind: "Light",    range: "4 / 12", examples: "Cans, bottles, tools, loose parts" },
      { kind: "Standard", range: "3 / 9",  examples: "Bricks, one-handed tools, small crates" },
      { kind: "Heavy",    range: "2 / 6",  examples: "Barstools, cinder blocks. Attack rolls suffer Snag." }
    ],
    desperation: [
      "Throwing a Melee Weapon: when you hurl a melee weapon that lacks the Thrown trait, it gains a range of 2 / 6. Use your Athletics skill for the Weapon Attack. The attack gains no Weapon Proficiency Bonus and ignores all of the weapon's normal melee traits, including Reach and Finesse.",
      "Using a Ranged Weapon as a Club: swinging something delicate, like a rifle, as a crude bludgeon deals 1d4 or 1d6 Bludgeoning by size. The weapon's own damage die and traits do not apply, and you should expect to need a gunsmith afterward."
    ],
    specialEffects: "On a Critical hit or a high Margin of success, the GM may rule that an improvised weapon inflicts a fitting condition: Bleeding from a shattered bottle, Staggered from a slab of concrete. When this happens, the Target makes a relevant Body or Wits save to resist it.",
    peopleIntro: "First you have to grapple them. An Unconscious, Restrained, or willing Target can automatically be grappled as a Swift Action, the same as grabbing any heavy object. A conscious, unwilling Target has to be Grappled by force first, and on a success they are yours to misuse until they manage to break free.",
    wieldedBody: "A wielded body is a Heavy improvised weapon: 1d10 Bludgeoning, Heavy. It is Unwieldy too, since people are heavy, badly balanced, and rarely cooperative. Unwieldy means every attack with them carries Snag; swinging a person is not precision work. Both the Target and the body you swung take the rolled damage. Using a person as a weapon is extremely hard on the person.",
    meatShield: [
      "A shield smaller than you grants Half Cover (+2 Defense). One your Size or larger grants Three-Quarter Cover (+5 Defense), against attacks that have to pass through them.",
      "Any attack the cover turns from a hit into a miss strikes the shield instead. Roll that attack's full damage against the meat shield you are holding.",
      "You keep the grapple up the whole time, and one arm is full of person, so the other can only manage One-Handed gear.",
      "A shield does nothing against an attacker who can see around it (a flank), and less than nothing against Area effects, which cook you both."
    ],
    bludgeon: "Spend an Action to swing your grappled Target at another Target within reach as an improvised melee attack. On a hit, deal 1d10 Bludgeoning to the Target and the same to the body. On a Critical or a wide Margin, the Target also makes a Body save or is knocked Prone.",
    throw: "Spend an Action to lob your grappled Target at a Target. Treat it as a Heavy improvised throw, range 2 / 6, and attack rolls carry Snag (the same Snag the Unwieldy body already imposes, which changes nothing, since Snag does not stack past rolling two dice). On a hit, deal 1d10 Bludgeoning to both, and the thrown Target lands Prone in the nearest open space to the Target, who makes a Body save or is knocked Prone alongside it. On a miss, your projectile still finds the floor: it lands Prone and takes 1d6 from the arrival."
  },
  // Features that shift EFFECTIVE Size for one purpose only. None changes the
  // character's actual Size, footprint, or Encumbrance beyond what it states.
  sizeShiftFeatures: [
    { name: "Synthetic Musculature", lineage: "NextGen",    effect: "+2 Encumbrance Threshold; counts as one Size larger for grappling." },
    { name: "Heavy Payload",         lineage: "Laborframe", effect: "+2 Encumbrance Threshold; counts as one Size larger for grappling; carrying a willing ally of your Size or smaller does not reduce Speed." },
    { name: "Sludge Crawler",        lineage: "Mycelial",   effect: "Counts as one Size smaller in narrow corridors and tight spaces, at full Speed (exempt from the tight-geometry halving)." },
    { name: "Disjointed Anatomy",    lineage: "Grinling",   effect: "Squeezes as one Size smaller without penalty." },
    { name: "Unshakable Bulk",       lineage: "Hulsk",      effect: "Moving through the space of a smaller enemy costs no extra movement (waives the 2-Speed cost)." },
    { name: "Breaching Charge",      lineage: "Durabody",   effect: "Moves in a straight line through the spaces of anyone smaller, ignoring Difficult Terrain." },
    { name: "Impossible Geometry",   lineage: "Grinling",   effect: "May move through occupied spaces regardless of Size; cannot end its turn there." }
  ],

  // Gear proficiency categories (acquired/upgraded with Training Points).
  gear: {
    weapons: ["Simple Weapons", "Martial Weapons", "Sidearms", "Longarms", "Heavy Weapons", "Explosive Launchers", "Thrown Weapons", "Bowfire Weapons"],
    armor: ["Light Armor", "Medium Armor", "Heavy Armor", "Physical Shields", "Warding Foci"],
    tools: ["Medical Tools", "Engineering Tools", "Systems Tools", "Investigation Tools", "Infiltration Tools", "Security Tools", "Fieldcraft Tools", "Media Tools", "Glamour Tools", "Bureaucracy Tools", "Ritual Implements"],
    vehicles: ["Ground Vehicles", "Aerial Vehicles", "Marine Vehicles", "Industrial / Mechs", "Starcraft"]
  },
  // Armor can be ACQUIRED with TP but not upgraded to higher tiers (per rules).
  gearUpgradable: { weapons: true, armor: false, tools: true, vehicles: true },

  // Versatile skills: NOT directly trainable; borrow the parent skill's tier.
  versatileSkills: [
    { key:"insight",      name:"Insight",      desc:"Apply learned understanding or pattern recognition to recall, interpret, or deduce." },
    { key:"performance",  name:"Performance",  desc:"Express skill, artistry, or emotion to inspire, impress, distract, or communicate." },
    { key:"intimidation", name:"Intimidation", desc:"Threaten with skill, logic, supernatural composure, or force." }
  ],

  /* Per-class survival math (structured from class vitality text) ---------- */
  classVitality: {
    codebreaker: { start:6,  die:6,  resilience:6 },
    fury:        { start:12, die:12, resilience:12 },
    hustler:     { start:6,  die:6,  resilience:6 },
    operator:    { start:10, die:10, resilience:10 },
    scoundrel:   { start:8,  die:8,  resilience:8 },
    shaper:      { start:6,  die:6,  resilience:6 },
    stitcher:    { start:8,  die:8,  resilience:8 }
  },
  // Average value used for fixed (non-rolled) Vitality-per-level: die/2 + 1
  dieAverage: function (die) { return Math.floor(die / 2) + 1; },

  /* Leveling -------------------------------------------------------------- */
  maxLevel: 10,
  trainingPointLevels: { 3:5, 6:5, 10:5 }, // +5 Training Points at these levels
  xpThresholds: { 1:0, 2:300, 3:900, 4:2700, 5:6500, 6:14000, 7:23000, 8:34000, 9:48000, 10:64000 },

  /* Derived formula helpers (documented for the UI) ----------------------- */
  formulas: {
    speed:    "6 + Agility Modifier (minimum 3)",
    defense:  "10 + Agility Modifier (+ armor & cover)",
    wounds:   "Maximum Wounds = Body score; Critical Condition at 50% or less of maximum Wounds",
    passive:  "10 + Attribute Modifier + Skill Proficiency Bonus + Caliber inside a Skill Focus (+5 Edge / -5 Snag)",
    save:     "d20 + Attribute Modifier + Caliber (if Saving Throw Focus, no proficiency required)",
    melee:    "d20 + Body Modifier + Weapon Proficiency Bonus",
    ranged:   "d20 + Agility Modifier + Weapon Proficiency Bonus",
    check:    "d20 + Attribute Modifier + Skill Proficiency Bonus + Situational (static modifiers cap at +15; Focus Caliber rides outside the cap)",
    resource: "Maximum Pool = Caliber + key Attribute Modifier (minimum 1)",
    flow:     "Max Flow = (Caliber × 3) + Flow Modifier; Flow DC = 8 + Flow Modifier + Caliber",
    flowAttack: "d20 + Flow Modifier + Caliber",
    help:     "Assist check d20 + modifier vs DC 15; on a hit +2/+3/+4 by Proficient/Expertise/Mastery (d20), or +1/+2/+3 Edge Dice up to +4 total (Dice Pool)"
  },

  /* Origin / Inner Profile prompts (pure-story, no mechanics) -------------- */
  innerProfile: {
    facets:     "The habits, tells, and moods people notice first. What is it like to be in a room with you?",
    coreSparks: "What lights you up, drives you, and keeps you moving.",
    tethers:    "The people, places, and promises you refuse to abandon.",
    faultLines: "The cracks, fears, and lines you swore you'd never cross."
  },

  /* Default flow attribute per Shaper subclass (overridden by data) -------- */
  shaperFlowAttrBySubclass: { icon:"Charm", harmonist:"Mystique", kensei:"Body", sourcerer:"Tech" }
};

/* Convenience indexes (built once at load) ---------------------------------- */
EN.rules.skillByKey = {};
EN.rules.skills.forEach(function (s) { EN.rules.skillByKey[s.key] = s; });
EN.rules.skillByName = {};
EN.rules.skills.forEach(function (s) { EN.rules.skillByName[s.name.toLowerCase()] = s; });
EN.rules.attrByKey = {};
EN.rules.attributes.forEach(function (a) { EN.rules.attrByKey[a.key] = a; });
