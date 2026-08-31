/* ===========================================================================
   ELYSIUM NIGHTS · Threats  (GM Toolkit)
   Book values from Part 4, the Game Master's Toolkit. RULES ONLY: not one
   number here is computed. Every live statblock comes out of the one resolver,
   EN.gmEngine.buildThreat, so the book and the generator cannot drift.

   The Gauge is the threat side of Caliber, rated 1 to 5 and read against it.
   =========================================================================== */
window.EN = window.EN || {};

EN.threats = {
  schemaVersion: 1,

  /* The Gauge, Part 4. "Reads as" is the fiction; "matched crew" is the pricing
     relationship that makes a budget mean anything. */
  gauges: [
    { g: 1, reads: "Street trouble. Dangerous to civilians, manageable for professionals.", crew: "Caliber 1 (Levels 1 to 2)" },
    { g: 2, reads: "Professional trouble. Somebody trained it, built it, or fed it.", crew: "Caliber 2 (Levels 3 to 4)" },
    { g: 3, reads: "District trouble. The kind of problem that gets a named file.", crew: "Caliber 3 (Levels 5 to 6)" },
    { g: 4, reads: "Sector trouble. Response teams get briefed. Insurance adjusters get involved.", crew: "Caliber 4 (Levels 7 to 8)" },
    { g: 5, reads: "City trouble. There are recordings. People argue about whether they are real.", crew: "Caliber 5 (Levels 9 to 10)" }
  ],
  workingBand: "Build encounters from threats within one Gauge of the crew's Caliber. Two Gauges up can anchor a climax. Three up is not an encounter, it is weather.",

  /* THE STANDARD THREAT ARRAY. Defense and Save DC are both 11 + Gauge, and the
     strong save is 3 + Gauge, so those three could be computed. They are tabled
     anyway: this file's job is to say what the book prints, and a reader
     checking the app against the page should find the page. The resolver is
     where arithmetic lives.

     `damage` is the threat's whole output on a good turn, before the crew's DR,
     which is why it is a target average rather than a dice expression. `attacks`
     is how the book says to spend it. DR is printed as a RANGE and both ends are
     carried, because picking one would quietly discard half of what was said. */
  array: [
    { g: 1, attack: 5,  dc: 12, defense: 12, vitality: 20, drLow: 0, drHigh: 1, damage: 7,  attacks: "one attack",            strong: 4, weak: 1, xp: 100 },
    { g: 2, attack: 6,  dc: 13, defense: 13, vitality: 30, drLow: 1, drHigh: 2, damage: 10, attacks: "one attack",            strong: 5, weak: 1, xp: 150 },
    { g: 3, attack: 7,  dc: 14, defense: 14, vitality: 50, drLow: 2, drHigh: 3, damage: 15, attacks: "one or two attacks",    strong: 6, weak: 2, xp: 250 },
    { g: 4, attack: 9,  dc: 15, defense: 15, vitality: 70, drLow: 3, drHigh: 4, damage: 21, attacks: "two attacks",           strong: 7, weak: 2, xp: 350 },
    { g: 5, attack: 10, dc: 16, defense: 16, vitality: 95, drLow: 4, drHigh: 5, damage: 28, attacks: "two or three attacks",  strong: 8, weak: 3, xp: 450 }
  ],

  /* DESIGNATIONS. `standard` is carried as a real row with neutral values so the
     resolver never needs a null branch.

     Minion's `vitalityByGauge` is a REPLACEMENT, not a multiplier, and it is the
     most misreadable line in the chapter. A Minion does not get 60 percent of
     the array's Vitality; it gets the number in its own table, and any Role
     percentage then applies to THAT. Get this backwards and every Minion in the
     app is wrong by a different amount at every Gauge. */
  designations: [
    { key: "minion", name: "Minion", blurb: "Cheap muscle dying in droves. At 0 Vitality it is out of the fight, no lingering, no drama.",
      vitalityByGauge: { 1: 6, 2: 10, 3: 15, 4: 25, 5: 35 },
      damageMult: 0.6, noDefensiveImpulse: true,
      xpByGauge: { 1: 25, 2: 50, 3: 75, 4: 100, 5: 125 } },
    { key: "standard", name: "Standard", blurb: "The default. One Standard of matching Gauge is a fair share of a fight for one Freelancer.",
      xpByGauge: null },
    { key: "elite", name: "Elite", blurb: "A squad leader, a warform, an alpha. Counts as two Standards on the budget and plays like it.",
      vitalityMult: 2, defense: 1, dc: 1, damageMultLow: 1.5, damageMultHigh: 2,
      xpByGauge: { 1: 200, 2: 300, 3: 500, 4: 700, 5: 900 } },
    { key: "solo", name: "Solo", blurb: "A specialized killer that takes the whole crew to put down. Priced for four Freelancers by itself.",
      vitalityMult: 4, defense: 1, dc: 2, damageMult: 3,
      surgesByGauge: { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3 },
      unshakable: true, breakpoint: true, weakness: true,
      xpByGauge: { 1: 400, 2: 600, 3: 1000, 4: 1400, 5: 1800 } }
  ],

  /* ROLES. A behavior package: what the threat does with its numbers, plus a
     small adjustment to them. Fields are ABSENT where a Role changes nothing,
     and the resolver reads absent as neutral, so Gunhand carries no keys at all.

     Deadshot's +50 percent is deliberately `damageMultOneAttack` rather than
     `damageMult`: the book concentrates it in a single attack rather than
     raising the round's whole budget, and the two produce different statblocks. */
  roles: [
    { key: "bruiser", name: "Bruiser", vitalityMult: 1.25, defense: -1,
      text: "Walks in. Stands there. Makes standing there your problem. Melee, Shoves, holds doorways." },
    { key: "skirmisher", name: "Skirmisher", vitalityMult: 0.75, defense: 1, speed: 7,
      text: "Hits and leaves. Uses Disengage, cover, and your impatience." },
    { key: "gunhand", name: "Gunhand",
      text: "Line infantry. Shoots from cover, falls back by numbers, respects suppression." },
    { key: "deadshot", name: "Deadshot", vitalityMult: 0.75, damageMultOneAttack: 1.5,
      text: "One good angle, one heavy hit. Dies fast when found, which is the game." },
    { key: "ghost", name: "Ghost", vitalityMult: 0.75, defense: 1,
      text: "Opens from Stealth against Passive Perception. First hit from hiding gains Edge. Relocates after." },
    { key: "controller", name: "Controller", damageMult: 0.75, saveDC: 1,
      text: "Trades damage for conditions and terrain: Restrains, Blinds, herds the crew into worse rooms." },
    { key: "support", name: "Support", damageMult: 0.75,
      text: "Keeps the others standing: restores Vitality equal to twice its Gauge as an Action, or grants an ally Edge. Kill the medic first is a proverb for a reason." }
  ],

  /* THE ABILITY MENU. Two abilities make a threat feel authored instead of
     extruded. They are free picks keyed to Role, not a point spend, and they are
     tuned to work at any Gauge because they key off the threat's own Save DC.
     `anything` is the book's own group name and is offered to every Role. */
  abilityGroups: [
    { role: "bruiser", abilities: [
      { name: "Haymaker", cost: "Action", text: "One heavy attack at +2 damage dice. On a hit, the Target makes a Body Save or is knocked Prone." },
      { name: "Meat Wall", cost: null, text: "Allied threats within 2 spaces gain Half Cover against ranged attacks while this threat is standing." },
      { name: "Wrecker", cost: null, text: "This threat's melee attacks treat objects and cover as one Structure category lower." }
    ] },
    { role: "skirmisher", abilities: [
      { name: "Slip Away", cost: "Impulse", text: "When missed by a melee attack, move 2 spaces without provoking Opportunity Attacks." },
      { name: "Blade Rush", cost: "Action", text: "Move up to Speed and make one melee attack during the move. Opportunity Attacks against this movement roll with Snag." }
    ] },
    { role: "gunhand", abilities: [
      { name: "Covering Burst", cost: "Action", text: "Pick a space. Attack the first Target that enters within 2 spaces of it before your next turn (this uses the readied shot; no Impulse required)." },
      { name: "Bounding Retreat", cost: "Impulse", text: "When an ally within 6 spaces drops, move half Speed toward cover." }
    ] },
    { role: "deadshot", abilities: [
      { name: "Painted Shot", cost: null, text: "This threat's first attack each round against a Target that has not moved since its last turn gains Edge." },
      { name: "Displace", cost: "Swift", text: "After attacking from hiding, move 2 spaces. The shot's origin is obvious; the shooter is not." }
    ] },
    { role: "ghost", abilities: [
      { name: "From Nowhere", cost: null, text: "Attacks from hiding deal +1 damage die and gain Edge (this replaces the standard Ghost ambush bonus; do not stack them)." },
      { name: "Smoke Discipline", cost: "Swift", text: "Drop a smoke or flash charge: Area 2 sphere of Obscurement until the end of the threat's next turn." }
    ] },
    { role: "controller", abilities: [
      { name: "Lockdown", cost: "Action", text: "One Target within 12 spaces makes a save against the threat's DC or is Restrained until the end of its next turn (foam, cable, gravitic pinch, roots, as the fiction dictates)." },
      { name: "Herding Field", cost: "Action", text: "Area 3 sphere within 12 spaces becomes Difficult Terrain until the start of the threat's next turn." },
      { name: "Static Howl", cost: "Action", text: "Area 3 cone. Targets save or are Staggered until the end of their next turn." }
    ] },
    { role: "support", abilities: [
      { name: "Patch In", cost: "Action", text: "Touch an allied threat: it regains Vitality equal to twice its Gauge." },
      { name: "Spotter", cost: "Swift", text: "One allied threat gains Edge on its next attack against a Target this threat can see." },
      { name: "Stims", cost: "Action", text: "An allied threat immediately makes a save against one condition affecting it, with Edge." }
    ] },
    { role: "anything", abilities: [
      { name: "Dangerous Habits", cost: null, text: "Give the threat one weapon rider from the Optional Damage Effects appendix (Part 2, Damage Types): Ignite, Bleed, Knockback, Disrupt, and their siblings. Declare it before the attack resolves, per that appendix." },
      { name: "Dead Man's Price", cost: "Special", text: "When reduced to 0 Vitality, the threat does one last thing: a grenade cooks off, a scream goes out on an open channel, a claw spasms shut. One attack or one complication, then it is done." }
    ] }
  ],

  /* Threat Conventions, the five rules that make a statblock legible. Carried as
     prose because they are prose: none of them is a number the app resolves. */
  conventions: [
    "Threats have Vitality only. No Vigor, no Wounds, no Resilience Dice.",
    "Conditions work normally, using the threat's listed save bonus.",
    "One defensive Impulse per round. Minions get none; Solos have their own economy.",
    "Threats do not roll Death Saves. A target the crew is bringing in alive becomes Dying on Part 2's clock instead.",
    "Flat bonuses only. A threat has no proficiency tier and no Caliber."
  ],
  morale: "Optional. When a threat loses its leader, loses half its number, or sees something out of its Gauge, it makes a Wits Save DC 12 or breaks. Fanatics, Constructs and anything without a survival instinct are exempt. Fights that end in morale collapse pay full XP.",

  /* Size is the character-side vocabulary, reused rather than restated, so a
     Large threat and a Large Freelancer mean the same thing. Type is Part 4's
     own short list off the bestiary's category headings. */

  /* WHICH attributes a threat is strong in. The book does NOT give a rule for
     this: it is an authoring choice made per threat, and the printed bestiary
     shows the spread. A Bruiser is Body, a Ghost is Agility and Wits, a Support
     is Charm and Wits, and a Controller follows its flavour (Mystique and Body
     for a Street Shaper, Tech and Wits for a Gutter Hacker).

     So this is an APP SUGGESTION read off the printed entries, not a rule, and
     the builder lets the GM change it. Marked clearly because a default that
     looks like canon is worse than no default at all.

     One or two attributes is the printed range. A few entries name a category
     instead ("+5 vs Tech effects" on the Sentry Turret), which is why the
     builder takes attributes but the field stays free text underneath. */
  saveHintByRole: {
    bruiser:    ["BOD"],
    skirmisher: ["AGI"],
    gunhand:    ["BOD", "WIT"],
    deadshot:   ["AGI", "WIT"],
    ghost:      ["AGI", "WIT"],
    controller: ["MYS", "WIT"],
    support:    ["CHA", "WIT"]
  },

  types: ["Human", "Chimera", "Verdine", "Clanker", "Outsider", "Construct", "Drone", "Beast", "Bioform", "Flow Being", "Cryptid", "#GRID Entity"],

  /* Encounter budgeting, carried now so stage 3 adds no second data file.
     Share per Freelancer is the matching Gauge's Standard XP. */
  budget: {
    shareByCaliber: { 1: 100, 2: 150, 3: 250, 4: 350, 5: 450 },
    difficulties: [
      { key: "milk", name: "Milk Run", mult: 0.5 },
      { key: "fair", name: "Fair Fight", mult: 1 },
      { key: "hard", name: "Hard Contract", mult: 1.5 },
      { key: "red", name: "Red Work", mult: 2 }
    ],
    note: "Past 2x is not an encounter, it is an ambush you are writing on purpose. A matched-Gauge Solo alone is a Fair Fight for four."
  },

  /* Hazard authoring, Part 4's GM-facing layer over Part 2's Environmental
     Hazards. Note the DC ladder DIVERGES from the Standard Threat Array's Save
     DC at G3 and above (15/16/18 against the array's 14/15/16). That is the
     book's own number and not a transcription slip. */
  hazardDCByGauge: { 1: 12, 2: 13, 3: 15, 4: 16, 5: 18 },
  hazardBite: [
    { key: "nuisance",  name: "Nuisance",  dice: "1d6" },
    { key: "dangerous", name: "Dangerous", dice: "2d6" },
    { key: "severe",    name: "Severe",    dice: "4d6" },
    { key: "lethal",    name: "Lethal",    dice: "6d6 or more" }
  ],

  /* Part 4 content this file does NOT carry yet, named so nobody assumes the
     absence is an oversight. Stages 2 to 6 land these in order. */
  notModelled: [
    "The Bestiary: 31 statblocks plus 3 variants, including two #GRID entries that carry Node math instead of Defense and Vitality.",
    "Set Pieces: the eight pre-written hazards, all authored at Gauge 3.",
    "The Job Board: five roll tables and twelve postings.",
    "Paying the Crew: contract pay bands, bounties, salvage values.",
    "Security response clocks and the encounter composition rules."
  ]
};
