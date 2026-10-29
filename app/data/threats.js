/* ===========================================================================
   ELYSIUM NIGHTS · Threats  (GM Toolkit)
   Book values from the Elysium Nights Game Master's Toolkit (cited GMH, its earlier title), chapters
   Threats and Building Encounters (GMH pp53 to 65) and Hazards and Set Pieces
   (GMH p101). Page numbers here are PDF pages of the Toolkit's earlier draft, then titled the Game Master's Handbook (GMH); the folio printed on each page
   is 4 lower. RULES ONLY: not one number here is computed. Every live
   statblock comes out of the one resolver, EN.gmEngine.buildThreat, so the
   book and the generator cannot drift.

   The Grade is the threat side of Caliber, rated 1 to 5 and read against it.
   =========================================================================== */
window.EN = window.EN || {};

EN.threats = {
  schemaVersion: 1,

  /* The Grade, GMH p53. "Reads as" is the fiction; "matched crew" is the pricing
     relationship that makes a budget mean anything. */
  grades: [
    { g: 1, reads: "Street trouble. Dangerous to civilians, manageable for professionals.", crew: "Caliber 1 (Levels 1 to 2)" },
    { g: 2, reads: "Professional trouble. Somebody trained it, built it, or fed it.", crew: "Caliber 2 (Levels 3 to 4)" },
    { g: 3, reads: "District trouble. The kind of problem that gets a named file.", crew: "Caliber 3 (Levels 5 to 6)" },
    { g: 4, reads: "Sector trouble. Response teams get briefed. Insurance adjusters get involved.", crew: "Caliber 4 (Levels 7 to 8)" },
    { g: 5, reads: "City trouble. There are recordings. People argue about whether they are real.", crew: "Caliber 5 (Levels 9 to 10)" }
  ],
  // GMH p53, the working band. Two up needs ONE of three reasons, not all of them.
  workingBand: "Build encounters from threats within one Grade of the crew's Caliber. A threat two Grades up can anchor a climax if it arrives with a plan, an escape route, or a reason not to simply execute the crew, because its math won't miss often and won't hit gently. Three Grades up isn't an encounter. It is weather. Let it be witnessed, fled, or negotiated with.",

  /* THE STANDARD THREAT ARRAY, GMH p57. Defense and Save DC are both 11 + Grade,
     and the strong save is 3 + Grade, so those three could be computed. They are
     tabled anyway: this file's job is to say what the book prints, and a reader
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
  /* The two paragraphs the book prints under the array (GMT p24), word for word. The Codex's
     Standard Threat Array panel prints them. Their bold run-ins are the page's. */
  arrayNotes: [
    "**Damage a round** is the threat's whole output on a good turn, before the crew's DR. Split it across the attacks the concept wants: one heavy swing, or a pair of bursts, or an attack plus a rider. A G3 threat can be 2d8+6 once, or 1d8+3 twice, or 1d10+6 with a 1d6 Fire rider. The total is the tuning; the shape is the flavor.",
    "**Save DC** covers everything the threat forces: its gas, its howl, its shove off the catwalk. One DC per stat block keeps the table fast."
  ],

  /* DESIGNATIONS, GMH p54 (the blurbs) and p57 (Designation Modifiers). Solo
     Surges are GMH p59 and the Solo's triple damage is GMH p60 (Building a Solo):
     the modifier table itself only says "see Running Solos". `standard` is
     carried as a real row with neutral values so the resolver never needs a
     null branch.

     Minion's `vitalityByGrade` is a REPLACEMENT, not a multiplier, and it is the
     most misreadable line in the chapter. A Minion does not get 60 percent of
     the array's Vitality; it gets the number in its own table, and any Role
     percentage then applies to THAT. Get this backwards and every Minion in the
     app is wrong by a different amount at every Grade. */
  designations: [
    // the last sentence is GMT p23's Minion line: "Use the flat damage number in parentheses instead of rolling to keep a horde's turn moving."
    { key: "minion", name: "Minion", blurb: "Cheap muscle dying in droves. At 0 Vitality it is out of the fight, no lingering, no drama. Use the flat damage number in parentheses instead of rolling to keep a horde's turn moving.",
      vitalityByGrade: { 1: 6, 2: 10, 3: 15, 4: 25, 5: 35 },
      damageMult: 0.6, noDefensiveImpulse: true,
      xpByGrade: { 1: 25, 2: 50, 3: 75, 4: 100, 5: 125 } },
    { key: "standard", name: "Standard", blurb: "The default. One Standard of matching Grade is a fair share of a fight for one Freelancer.",
      xpByGrade: null },
    { key: "elite", name: "Elite", blurb: "A squad leader, a warform, an alpha. Counts as two Standards on the budget and plays like it.",
      vitalityMult: 2, defense: 1, dc: 1, damageMultLow: 1.5, damageMultHigh: 2,
      xpByGrade: { 1: 200, 2: 300, 3: 500, 4: 700, 5: 900 } },
    { key: "solo", name: "Solo", blurb: "A specialized killer that takes the whole crew to put down. Priced for four Freelancers by itself.",
      vitalityMult: 4, defense: 1, dc: 2, damageMult: 3,
      /* Building a Solo (GMT p25): "give it two to three attacks a round on its own turn, totaling
         about triple a Standard's damage." The resolver prints this where a Standard prints the
         array's own "one attack" and the like, so a Solo's round is never read as one swing. */
      attacksNote: "two to three attacks a round on its own turn, totaling about triple a Standard's damage",
      surgesByGrade: { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3 },
      unshakable: true, breakpoint: true, weakness: true,
      xpByGrade: { 1: 400, 2: 600, 3: 1000, 4: 1400, 5: 1800 } }
  ],

  /* ROLES, GMH p58. A behavior package: what the threat does with its numbers,
     plus a small adjustment to them. Fields are ABSENT where a Role changes
     nothing, and the resolver reads absent as neutral, so Gunhand carries no
     keys at all.

     Deadshot's +50 percent is deliberately `damageMultOneAttack` rather than
     `damageMult`: the book concentrates it in a single attack rather than
     raising the round's whole budget, and the two produce different statblocks.

     Ghost's text is the Handbook's short line. The older wording ("Opens from
     Stealth against Passive Perception. First hit from hiding gains Edge.")
     granted an Edge the book no longer prints, so it is gone here and from the
     From Nowhere ability below.

     `rolesIntro` is the Roles intro's own sentence, the one the halves-round-down
     ruling below quotes, carried as data so the Codex's Roles panel
     (js/codex_gm_threats.js) prints it instead of restating it. */
  rolesIntro: "A Role is a behavior package: what the threat does with its numbers, plus a small adjustment to them, rounded down.",
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
      text: "Opens while Hidden. Relocates after." },
    /* `vitalityMult` added 2026-09-18: the Roles table gave Controller a Vitality clause to match
       its damage one, so it now reads -25% damage, -25% Vitality, Save DC +1.

       THE HALVES ROUND DOWN, ruled 2026-09-19, and the Roles intro on GMH p58 now says so in
       words ("plus a small adjustment to them, rounded down"). A Grade 2 Controller computes
       30 x 0.75 = 22.5 and vit() floors it to 22, which is what the book prints for the Street
       Shaper, the Gutter Hacker and the Sentry Turret. Those three used to disagree with the
       builder by one and no longer do.

       ONE STATED EXCEPTION SURVIVES. The Reclamation Bloom prints 55 against a computed 37,
       because it is rooted. That is an authored exception, not a rounding artifact, and it must
       not be "corrected" to match the generator.

       The rounding itself lives in vit() in gmengine.js, which carries the reasoning and the
       consequence the author accepted: a Grade 1 Minion on a -25 percent Role now reads 4. */
    { key: "controller", name: "Controller", damageMult: 0.75, vitalityMult: 0.75, saveDC: 1,
      text: "Trades damage for conditions and terrain: Restrains, Blinds, herds the crew into worse rooms." },
    { key: "support", name: "Support", damageMult: 0.75,
      text: "Keeps the others standing: restores Vitality equal to twice its Grade as an Action, or grants an ally Edge. Kill the medic first is a proverb for a reason." }
  ],

  /* NO ROLE. The Bestiary Index says "A threat with no Role is built off the Array
     without one." It is not a row of the Roles table, so it is not in `roles` (the Codex's
     Roles panel, the Ability Menu and every picker that walks `roles` would grow a seventh
     Role). The Threat Builder offers it as its own first choice, key "none", and the resolver
     (EN.gmEngine.buildThreat) builds that threat with no Role adjustment, no Role rider and no
     Role hint for its strong saves. The default Role stays Gunhand. */
  noRole: { key: "none", name: "None", text: "A threat with no Role is built off the Array without one." },

  /* THE SAVES RULE, "Reading a Threat Stat Block" (GMT p23, the Saves line). The Threat Builder's
     strong-save pickers print it, because the sentence says what the two pickers mean. */
  savesRule: "Saves come strong or weak. The listed attributes use the higher bonus; everything else uses the lower one. If an effect targets an attribute and you genuinely can't decide which bonus applies, use the lower.",

  /* READING A THREAT STAT BLOCK (GM Toolkit, 23 October 2026 edition): the sample statblock and
     its line-by-line reading, in the Toolkit's words. The Saves line is savesRule above, so the
     Threat Builder and the Codex read one copy. The Codex prints it on the Admin desktop only
     (js/codex_gm_threats.js, panel gmt-reading). */
  readingStatBlock: {
    sample: [
      "Corpsec Officer. Grade 2 Standard, Gunhand. Medium Human.",
      "Defense 13 | DR 3 (Composite Kit) | Vitality 30 | Speed 6 | Initiative +4",
      "Saves +5 Body and Wits, +1 others | Passive Perception 13",
      "Carbine (Action): +6 vs Defense, Range 12 / 36, 1d10+3 Ballistic (8).",
      "Shock Baton (Action): +6 vs Defense, melee, 1d6+3 Electric (6).",
      "Hold the Line: While within 2 spaces of an allied Corpsec Officer, this officer's attacks score a critical hit on a 19 or 20.",
      "Fall Back (Impulse): When first reduced below half Vitality, move up to half Speed toward cover without provoking Opportunity Attacks.",
      "XP 150 | Resolve 5 (Standard) | Gear: Carbine, Shock Baton, Composite Kit, corp credentials."
    ],
    lead: "Reading it, line by line:",
    lines: [
      { name: "Header", text: "Grade, Designation, Role, then Size and what it is. Size runs on the standard scale (Tiny, Small, Medium, Large, Huge) and uses the height bands from Timing, Action Economy & Combat." },
      { name: "Defense", text: "Defense is the number an attack must meet or beat. Cover adds to it as normal." },
      { name: "DR", text: "DR is flat damage reduction, with its source in parentheses. If the crew takes the armor off the body afterward, the armor is what the parenthetical says it is." },
      { name: "Vitality", text: "Vitality is the whole pool. Threats don't track Wounds or Vigor unless the entry grants them. At 0 Vitality a threat is out of the fight: dead, dying, or done, whichever the scene calls for. If you want a named threat to survive on the floor, it survives on the floor. The dice have finished their part." },
      { name: "Speed", text: "How many spaces this threat can move on its turn." },
      { name: "Initiative", text: "Initiative is its whole Initiative bonus, rolled as d20 plus the number. To build one, start at Grade + 2. Minions take 1 off, Bruisers take 1 off, Skirmishers add 1, Ghosts add 2. Nudge it a point either way for the fiction. A turret bolted to a wall can sit lower, and anything that's been waiting for you can sit higher." },
      { name: "Saves", savesRule: true },
      { name: "Passive Perception", text: "Passive Perception is what Stealth is rolling against." },
      { name: "Attacks and abilities", text: "Attacks and abilities carry the standard action tags: (Action), (Move), (Swift), (Impulse), (Free), (Complex), (Special). Untagged traits are passive. The number in parentheses after damage dice is the average, for when rolling is slower than the scene deserves." },
      { name: "XP", text: "XP is the threat's price in the encounter budget and its award when defeated. Defeated includes captured, routed, hacked, bypassed, or talked down. The crew doesn't have to make a body to get paid in experience." },
      { name: "Resolve", text: "Resolve appears on threats that can be argued with, using the Opposition Tiers from Setting Resolve (The Sit-Down). No Resolve line means the conversation is over before it starts." },
      { name: "Gear", text: "Gear is what the body is carrying when the shooting stops. Threat gear is real: catalog items at catalog stats, ready to be looted, fenced, or explained to a magistrate." }
    ]
  },

  /* THE ABILITY MENU, GMH pp58 to 59. `abilityIntro` is the menu's own opening paragraph (GMT p25),
     word for word; the Codex's Ability Menu panel prints it first. Two abilities make a threat feel
     authored instead of extruded. Pick from the menu or write your own; the book asks that
     riders stay keyed to the threat's single Save DC and that conditions stay
     inside the Conditions chapter, and says every menu ability is tuned for its
     listed Roles at any Grade. `anything` is the book's own group name and is
     offered to every Role.

     Texts follow the Handbook. Lockdown and Static Howl name a Body Save,
     Patch In heals twice THIS threat's Grade (not the healed ally's), Wrecker
     drops a MATERIAL category, and From Nowhere is +1 damage die with no Edge. */
  abilityIntro: "Two abilities make a threat feel authored instead of extruded. Pick from the menu or write your own; keep riders keyed to the threat's single Save DC, and keep conditions to the ones in the Conditions chapter. Every menu ability below is tuned for its listed roles at any Grade.",
  abilityGroups: [
    { role: "bruiser", abilities: [
      { name: "Haymaker", cost: "Action", text: "One heavy attack at +2 damage dice. On a hit, the Target makes a Body Save or is knocked Prone." },
      { name: "Meat Wall", cost: null, text: "Allied threats within 2 spaces gain Half Cover against ranged attacks while this threat is standing." },
      { name: "Wrecker", cost: null, text: "This threat's melee attacks treat objects and cover as one material category lower." }
    ] },
    { role: "skirmisher", abilities: [
      { name: "Slip Away", cost: "Impulse", text: "When missed by a melee attack, move 2 spaces without provoking Opportunity Attacks." },
      { name: "Blade Rush", cost: "Action", text: "Move up to Speed and make one melee attack during the move. Opportunity Attacks against this movement roll with Snag." }
    ] },
    { role: "gunhand", abilities: [
      { name: "Covering Burst", cost: "Action", text: "Pick a space. Attack the first Target that enters within 2 spaces of it before the threat's next turn (this uses the readied shot; no Impulse required)." },
      { name: "Bounding Retreat", cost: "Impulse", text: "When an ally within 6 spaces drops, move half Speed toward cover." }
    ] },
    { role: "deadshot", abilities: [
      { name: "Angle Found", cost: null, text: "This threat's first attack each round against a Target that has not moved since its last turn gains Edge." },
      { name: "Displace", cost: "Swift", text: "After attacking from hiding, move 2 spaces. The shot's origin is obvious; the shooter is not." }
    ] },
    { role: "ghost", abilities: [
      { name: "From Nowhere", cost: null, text: "Attacks from hiding deal +1 damage die." },
      { name: "Smoke Discipline", cost: "Swift", text: "Drop a smoke or flash charge: an Area 2 sphere is heavily obscured until the end of the threat's next turn." }
    ] },
    { role: "controller", abilities: [
      { name: "Lockdown", cost: "Action", text: "One Target within 12 spaces makes a Body Save against the threat's DC or is Restrained until the end of its next turn (foam, cable, gravitic pinch, roots, as the fiction dictates)." },
      { name: "Herding Field", cost: "Action", text: "Area 3 sphere within 12 spaces becomes Difficult Terrain until the start of the threat's next turn." },
      { name: "Static Howl", cost: "Action", text: "Area 3 cone. Targets make a Body Save or are Staggered until the end of their next turn." }
    ] },
    { role: "support", abilities: [
      { name: "Patch In", cost: "Action", text: "Touch an allied threat: it regains Vitality equal to twice this threat's Grade." },
      { name: "Spotter", cost: "Swift", text: "One allied threat gains Edge on its next attack against a Target this threat can see." },
      { name: "Stims", cost: "Action", text: "An allied threat immediately makes a save against one condition affecting it, with Edge." }
    ] },
    { role: "anything", abilities: [
      { name: "Dangerous Habits", cost: null, text: "Give the threat one weapon rider from the Optional Damage Effects appendix: Ignite, Bleed, Knockback, Disrupt, and their siblings. Declare it before the attack resolves, per that appendix." },
      { name: "Dead Man's Price", cost: "Special", text: "When reduced to 0 Vitality, the threat does one last thing: a grenade cooks off, a scream goes out on an open channel, a claw spasms shut. One attack or one complication, then it is done." }
    ] }
  ],

  /* Threat Conventions, GMH p56: the six rules that govern every threat in the
     book. Carried as prose because they are prose: none of them is a number the
     app resolves. The qualifiers matter and are kept: Vitality only holds
     "unless an entry grants them", and the one Impulse may go to a listed
     defense OR an Opportunity Attack. */
  conventions: [
    "Vitality only. No Wounds, no Resilience Dice, no Vigor, unless an entry grants them. A threat that needs the full Freelancer treatment (a recurring rival, a campaign villain with a name and a tailor) can be built as a Freelancer instead. Budget an afternoon.",
    "Conditions work normally. Threats Bleed, Burn, fall Prone, and get Frightened by the book. When a condition's save comes due, use the threat's listed save bonus.",
    "One defensive Impulse. Minions get none. Standards and Elites get one Impulse Action per round, usable for the defensive options their entry lists or for an Opportunity Attack. Solos have their own economy.",
    "Threats don't roll Death Saves. 0 Vitality resolves the question. The exception is anyone the crew is paid to bring in breathing, in which case the body is Dying and the clock from Vitality & Recovery is now the crew's problem.",
    "Threats use flat bonuses. No proficiency tiers, no Caliber. The stat block's number is the whole number.",
    "A named weapon is the catalog weapon. The die and the traits belong to the gear, the flat bonus and the number of attacks belong to the threat. When the gear itself is better than the catalog, the Gear line says so."
  ],
  /* GMH p56, the run-in "Morale (optional rule)." The Codex card carries that run-in
     as its title, so the text starts at "Most Hostiles". "Constructs ON TASK": a
     Construct off its task checks like anyone else, so the exemption is not every
     Construct. */
  morale: "Most Hostiles are employees. When a side loses its leader, loses half its number, or watches something arrive that is visibly out of its Grade, have the survivors make a Presence Save DC 12. On a failure they break: retreat, surrender, or a sudden fascinating interest in guarding a different hallway. Fanatics, Constructs on task, and anything without a survival instinct don't check. Fights that end in morale collapse pay full XP. Routing people is winning.",

  /* Size is the character-side vocabulary, reused rather than restated, so a
     Large threat and a Large Freelancer mean the same thing (GMH p55 names the
     same Tiny to Huge scale). Type is a short list read off the Bestiary's
     category headings; the Handbook prints no closed list, since a stat block's
     header just says what the thing is (GMH p55). */

  /* WHICH attributes a threat is strong in. The book does NOT give a rule for
     this: it is an authoring choice made per threat, and the printed bestiary
     shows the spread. A Bruiser is Body, a Ghost is Agility and Wits, a Support
     is Presence and Wits, and a Controller follows its flavour (Mystique and Body
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
    support:    ["PRE", "WIT"]
  },

  types: ["Human", "Chimera", "Verdine", "Clanker", "Outsider", "Construct", "Drone", "Beast", "Bioform", "Flow Being", "Cryptid", "#GRID Entity"],

  /* Encounter budgeting, GMH p61 (The Budget). Share per Freelancer is the
     matching Grade's Standard XP; share x headcount is the Fair Fight budget,
     and the difficulty multiplier scales it for intent. `costs` is the book's
     "what it costs the crew" column. `note` is the line under the table;
     `soloNote` is GMH p60 (Building a Solo). */
  budget: {
    shareByCaliber: { 1: 100, 2: 150, 3: 250, 4: 350, 5: 450 },
    difficulties: [
      { key: "milk", name: "Milk Run", mult: 0.5,
        costs: "Ammo, sweat, maybe a stim. A warmup, a patrol, a message." },
      { key: "fair", name: "Fair Fight", mult: 1,
        costs: "Real Vitality, a defensive Impulse spent at the wrong time, somebody Bloodied if the dice lean." },
      { key: "hard", name: "Hard Contract", mult: 1.5,
        costs: "Resources burned deep, somebody on the Wound track, decisions made at volume." },
      { key: "red", name: "Red Work", mult: 2,
        costs: "A fight the crew shouldn't take without an edge: terrain, surprise, intel, or a way out. Expect Wounds. Plan the retreat before the entrance." }
    ],
    note: "Past 2x, you're writing an ambush on purpose. Do that rarely, do it with signposts, and leave the exits unlocked.",
    soloNote: "A lone matching-Grade Solo is a Fair Fight for a crew of four, before you add the room."
  },

  /* Hazard authoring, GMH p101 (Hazard Anatomy): the GM-facing layer over the
     player rules' Environmental Hazards. Note the DC ladder DIVERGES from the
     Standard Threat Array's Save DC at G3 and above (15/16/18 against the
     array's 14/15/16). That is the book's own number and not a transcription
     slip. `reads` is the Bite table's "reads as" column, printed without a
     closing period. */
  hazardDCByGrade: { 1: 12, 2: 13, 3: 15, 4: 16, 5: 18 },
  hazardBite: [
    { key: "nuisance",  name: "Nuisance",  dice: "1d6",         reads: "Sprung plating, a live fence, a bad step" },
    { key: "dangerous", name: "Dangerous", dice: "2d6",         reads: "Steam line, sweeping rail current, falling stock" },
    { key: "severe",    name: "Severe",    dice: "4d6",         reads: "Coolant purge, transformer arc, floor giving way onto the next floor" },
    { key: "lethal",    name: "Lethal",    dice: "6d6 or more", reads: "Industrial press, mains junction, the thing the warning stencils were about" }
  ],

  /* Game Master's Toolkit content the GM side does NOT carry, named so nobody
     assumes the absence is an oversight. The Bestiary, Set Pieces, the Job
     Board, Paying the Crew, the security response clock, the composition
     rules, the GM's Card (data/gm_card.js, the drawer in js/gm.js), Heat
     Response (the Heat tab, data/gm_heat.js), NPC Quick-Build (the People tab,
     data/gm_people.js) and the Sit-Down and chase Prep Templates (the Scenes
     tab, data/gm_scenes.js) all have homes now and are off this list. Pages,
     for the reader of this file: Prep Templates pp13 to 20. */
  notModelled: [
    "Prep Templates: Wiring a Site, its checklist, Picking Tiers, and the Fullwell Bottling example."
  ]
};

/* THREAT INITIATIVE, GMH p55. A threat's Initiative is its whole bonus, rolled
   as d20 plus the number. Build it as Grade + `base`, plus the adjustment for
   its Designation and for its Role where one is listed. The Grade is added by
   the caller (EN.gmEngine.threatInit returns the rest), because it is the one
   input this file cannot know.

   Checked against the page: the Corpsec Officer (G2 Standard Gunhand, GMH p54)
   prints +4 = 2 + 2, and the Street Ganger (G1 Minion Gunhand, GMH p70)
   prints +2 = 1 + 2 - 1. The page does not say whether a hybrid (a Minion Bruiser)
   takes both of its adjustments; the resolver adds every one that applies.

   The two maps are null-prototype because they are indexed by keys that ride
   in saved threats and imported GM files; a stored "constructor" must not
   resolve through the prototype chain. Read them with hasOwnProperty. */
EN.threats.initiative = (function () {
  function keyed(o) {
    var m = Object.create(null);
    Object.keys(o).forEach(function (k) { m[k] = o[k]; });
    return m;
  }
  return {
    base: 2,
    byDesignation: keyed({ minion: -1 }),
    byRole: keyed({ bruiser: -1, skirmisher: 1, ghost: 2 }),
    note: "Nudge it a point either way for the fiction. A turret bolted to a wall can sit lower, and anything that's been waiting for you can sit higher."
  };
})();

/* RUNNING SOLOS, GMH p59: what every Solo carries beside its stat block. The
   Table's Solo helper (js/gm.js) reads these rather than restating them: the
   Surges left this round, the Defensive Impulse, the Unshakable reminder and
   the Breakpoint alert. `tag` is the parenthetical the page prints after the
   rule's name ("Surges (Special)"), null where it prints none. The numbers the
   helper counts with stay in EN.threats.designations (solo surgesByGrade),
   where the builder already reads them. */
// GMH p59
EN.threats.runningSolos = {
  title: "Running Solos",
  intro: "Four against one is a scheduling problem. A Solo solves it by cheating in the open. Every Solo carries the following, in addition to its stat block:",
  rules: [
    { key: "surges", name: "Surges", tag: "Special",
      text: "After each Freelancer's turn, the Solo may take one Surge from its list. Each Surge can be used once per round. A Solo has two Surges per round at Grade 1 and 2, three at Grade 3 and up. Surges are short moves: a half-Speed reposition, a single attack at the bottom of its damage range, a condition push, a call for reinforcements. The Solo's own turn stays its turn. The Surges are the reason the crew never gets to plan in peace." },
    { key: "impulses", name: "Defensive Impulses", tag: null,
      text: "A Solo gets one Impulse Action per Freelancer turn, spent on the defensive options its entry lists. It can still only use one defense against any single attack." },
    { key: "unshakable", name: "Unshakable", tag: "Special",
      text: "A Solo makes its condition saves at the end of every turn, not only its own. Once per round, when it fails a save, it may spend one of its remaining Surges to succeed instead. Restraints work on a Solo. They just don't work for long." },
    { key: "breakpoint", name: "Breakpoint", tag: "Special",
      text: "The first time a Solo drops below half Vitality, its Breakpoint fires: a new attack pattern, a shed skin, a called-in favor, a change of venue. The fight before the Breakpoint is the crew learning the rules. The fight after is the Solo breaking them." }
  ]
};

/* ENEMY FREELANCERS AND NAMED RIVALS (GMT p25, after Running Solos): how to build the other crew.
   Word for word. The last paragraph keeps the page's bold run-in as `name`; the Codex prints it as
   the entry's heading. The Heat tab's Bounty text ("Build a taker as a rival crew (Enemy
   Freelancers and Named Rivals)") points here, and the panel title links it. */
EN.threats.rivals = {
  name: "Enemy Freelancers and Named Rivals",
  paragraphs: [
    "Sometimes the opposition is just another crew, doing the same work from the other side of the invoice.",
    "For a one-scene rival crew, build them as threats: an Elite of the matching Grade for the counterpart of each Freelancer, flavored by class. That's Red Work on the budget; build them as Standards for a Fair Fight. Give the rival Codebreaker the Gutter Hacker's Node tricks, the rival Fury a Bruiser chassis with Haymaker, the rival Stitcher a Support chassis with Patch In and Stims. They will read as colleagues without making you track seven resource pools.",
    "For a recurring rival, someone meant to survive three arcs and one betrayal, consider building them once as a real Freelancer with class levels, and accept the prep cost. The middle path: build them as an Elite, give them Wounds equal to half their Vitality (the one threat exception that earns its bookkeeping), and let them spend the fiction's version of resources: two or three signature moves per scene, then they are out of tricks and know it. A rival who runs when the math turns is a rival the table gets to hate properly."
  ],
  crewToys: {
    name: "Threats and the crew's toys.",
    text: "Threat abilities never target a rule the crew can't see. If a threat hacks, it uses Quick Hack math against gear the crew actually carries. If it channels, its effects mirror printed Invocations. When in doubt, give the threat the crew's own tools at its Grade's numbers."
  }
};

/* APPENDIX: OPTIONAL DAMAGE EFFECTS (GMT p64), the whole page: the intro, Using Damage Effects and
   every Effect the page prints, in the page's four groups and the page's order. THE PAGE PRINTS 31
   (6 Standard Physical, 12 Elemental, 9 Exotic, 4 Resonant and Tech); the audit record counted 27.
   Knockback and Cauterize sit at the head of the page's second column, under Elemental Effects.

   `effects` is one flat list, each row { name, type, group, text }: `group` is a key of `groups`,
   `type` is the damage type in the page's brackets. The text keeps the page's bold condition names
   (**Bleeding**) and its one italic (*not*). The Codex's Optional Damage Effects panel
   (js/codex_gm_threats.js, Admin) prints all of it; the Movement panel mv-optfx reads its two
   Effects that move a Target (EN.movement.movingEffectNames) from this list, so the words exist
   once. The Ability Menu's Dangerous Habits points here. The Freelancer desktop never sees it. */
EN.threats.optionalDamageEffects = {
  title: "Optional Damage Effects",
  intro: "None of these Effects is the default for any damage type. Attach one when you run a specific threat, build a custom weapon, or want a wrinkle in a scene. The weapon text, the Invocation, or you call for it, never the damage type on its own. Pull from the toolbox freely, ignore it, or build your own. The PHB's Damage Types are the contract with the player. This appendix is yours.",
  using: {
    name: "Using Damage Effects",
    lead: "To attach an Effect to an attack, weapon, or environmental source:",
    steps: [
      "Declare the Effect clearly before the attack resolves (\"This flamethrower has the Ignite Effect\").",
      "Apply the damage normally according to the universal defense rules.",
      "If the Effect has a save or condition, resolve it after damage."
    ]
  },
  groups: [
    { key: "physical",  name: "Standard Physical Effects" },
    { key: "elemental", name: "Elemental Effects" },
    { key: "exotic",    name: "Exotic Effects" },
    { key: "tech",      name: "Resonant and Tech Effects" }
  ],
  effects: [
    { name: "Subdue", type: "Nonlethal", group: "physical",
      text: "A Target reduced to Unconscious by Nonlethal damage with this Effect remains Unconscious for 1d4 rounds instead of recovering at the start of their next turn." },
    { name: "Armor Piercing", type: "Piercing", group: "physical",
      text: "Ignores a set amount of the Target's Armor DR, as defined by the weapon or effect." },
    { name: "Lethal Precision", type: "Piercing", group: "physical",
      text: "Critical hits with this Effect roll an additional damage die." },
    { name: "Concussive", type: "Bludgeoning", group: "physical",
      text: "On a critical hit, the Target must make a Body Save (DC set by the source) or be pushed 1 space and knocked Prone." },
    { name: "Structural", type: "Bludgeoning", group: "physical",
      text: "Ignores DR on inanimate barriers, doors, and brittle objects." },
    { name: "Bleed", type: "Slashing", group: "physical",
      text: "On a critical hit against an organic Target, apply the **Bleeding** condition." },

    { name: "Corrosion", type: "Acid", group: "elemental",
      text: "Reduces the Target's Armor DR by 1 (or more if specified) until repaired during Downtime." },
    { name: "Lingering Acid", type: "Acid", group: "elemental",
      text: "Target takes 1d4 Acid damage at the start of their turn until they spend an Action to wash or neutralize the substance." },
    { name: "Chill", type: "Cold", group: "elemental",
      text: "Target's Speed is reduced by 2 until the end of their next turn." },
    { name: "Insulation Bypass", type: "Cold", group: "elemental",
      text: "Ignores Cold Resistance granted by armor or armor mods for this attack." },
    { name: "Ignite", type: "Fire", group: "elemental",
      text: "Target makes an Agility Save (DC set by source) or gains the **Burning** condition." },
    { name: "Flammable Spread", type: "Fire", group: "elemental",
      text: "Ignites flammable cover and terrain in the affected area, creating environmental hazards." },
    { name: "Disrupt", type: "Electric", group: "elemental",
      text: "Deals double damage to unshielded Drones and active electronics." },
    { name: "Neural Shock", type: "Electric", group: "elemental",
      text: "Organic Target makes a Body Save or suffers **Stunned** or **Dazed** until end of next turn." },
    { name: "Resonance Crack", type: "Sonic", group: "elemental",
      text: "Reduces the Defense bonuses provided by Half Cover and Three-Quarter Cover by half against this attack." },
    { name: "Deafen", type: "Sonic", group: "elemental",
      text: "Target makes a Body Save or suffers the **Deafened** condition." },
    { name: "Knockback", type: "Force", group: "elemental",
      text: "Target makes a Body Save or is pushed 2 spaces and knocked Prone." },
    { name: "Cauterize", type: "Energy", group: "elemental",
      text: "Can't trigger Bleeding. Automatically removes existing Bleeding stacks on the Target." },

    { name: "Sickness", type: "Radiation", group: "exotic",
      text: "If Radiation damage exceeds the Target's Body score, they suffer a level of Fatigue that can't be removed by resting until medically purged." },
    { name: "Sealed Bypass", type: "Radiation", group: "exotic",
      text: "This Radiation Effect penetrates standard Environmental Armor and Hazmat suits." },
    { name: "Sticky", type: "Entropy", group: "exotic",
      text: "Vitality lost to this attack can't be healed by standard Medkits, Visceral Patch, or swift Resilience Die spends. Restoration requires a Long Rest or specialized Flow mending." },
    { name: "Pristine Strike", type: "Genesis", group: "exotic",
      text: "This Genesis attack can only harm Targets at maximum Vitality with no ongoing damage conditions (Bleeding, Poisoned, Burning, etc.). Vigor still qualifies as maximum Vitality. The Mutating condition does *not* count as an ongoing damage condition for this rule; a Mutating Target remains a valid Pristine Strike target. If the Target doesn't qualify, the effect fizzles harmlessly; FP and ammunition are still spent." },
    { name: "Mutating", type: "Genesis", group: "exotic",
      text: "A successful Genesis attack with this Effect applies one stack of the **Mutating** condition. See the Conditions chapter for full effects." },
    { name: "Reversal", type: "Genesis", group: "exotic",
      text: "When used on a willing Target, this Genesis attack restores Vitality equal to the damage rolled, with excess healing becoming Vigor until the next Long Rest. Pristine Strike and Mutating don't apply when Reversal is used." },
    { name: "Mind Pierce", type: "Psychic", group: "exotic",
      text: "Bypasses physical Armor DR. Attacks with this Effect call for a Mystique Save instead of a standard attack roll, at GM discretion." },
    { name: "Sealed System Bypass", type: "Toxic", group: "exotic",
      text: "This Toxic Effect can affect Targets in sealed Environmental Armor." },
    { name: "Poison", type: "Toxic", group: "exotic",
      text: "Target makes a Body Save or gains the **Poisoned** condition." },

    { name: "Strain Feedback", type: "Resonant", group: "tech",
      text: "A Character with a Flow Reservoir who takes this damage makes a Mystique Save. On a failure, they gain 1 Strain Point." },
    { name: "Resonant Armor Bypass", type: "Resonant", group: "tech",
      text: "Ignores standard Armor DR unless the armor possesses Resonant Plating." },
    { name: "System Failure", type: "Tech", group: "tech",
      text: "Drones, Vehicles, or heavily augmented Targets make a Tech Save or suffer the **Bricked** or **Breached** condition." },
    { name: "Network Spread", type: "Tech", group: "tech",
      text: "A successful Tech attack with this Effect on a networked Target can trigger Cascade Failure on linked systems at GM discretion." }
  ]
};
