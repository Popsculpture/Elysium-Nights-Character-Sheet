/* ===========================================================================
   ELYSIUM NIGHTS · Hazards and Set Pieces  (GM Toolkit)
   A transcription of the Game Master's Handbook, Hazards and Set Pieces (PDF
   pages 101 to 102), the Stalemate Hazards by District tables from Prep
   Templates (PDF pages 18 to 20), and the room line of the GM's Card (p127).
   RULES ONLY: nothing here is computed.

   This is the GM's authoring layer. The player-side environmental rules
   (Exposure, Vacuum, Caustic Environments, breath) stay in EN.hazards, and the
   Cover Material Table with its meanings stays in EN.combat.coverMaterials.

   Every `text` is the book's wording with PDF line breaks rejoined. Numbers the
   book prints are carried as numbers beside the text they came from. Fields
   that break a printed sentence into parts (trigger, timing, save, bite,
   counter) quote the page's own words; where the page prints nothing for a
   part, the field is null rather than guessed.

   Page references (// GMH pNN) are PDF page numbers of the handbook; the folio
   printed on each page runs 4 lower. User-facing text carries no page numbers.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {}; EN.gmBook = EN.gmBook || {};

EN.gmBook.hazards = {
  schemaVersion: 1,

  // GMH p101
  intro: "The room gets a turn. Not an initiative slot: a presence. A hazard is any part of the scene that can hurt somebody without carrying a grudge, and a set piece is a hazard with stage directions. Exposure, Vacuum, Caustic Environments, and Drowning are already fully ruled in Environmental Hazards and Conditions; Anomalies live in Flow Disturbances. This chapter is for everything the building itself is about to do.",

  /* HAZARD ANATOMY. The four lines a hazard is written in, in the book's order.
     The DC ladder is also carried as numbers in dcByGrade below. */
  // GMH p101
  anatomy: {
    lead: "Write a hazard in four lines:",
    fields: [
      { key: "trigger", name: "Trigger",
        text: "What sets it off: pressure, proximity, a timer, a bullet that missed.",
        examples: ["pressure", "proximity", "a timer", "a bullet that missed"] },
      { key: "save", name: "Save and DC",
        text: "Usually Agility or Body. Set the DC by the Grade of the scene: DC 12 at G1, 13 at G2, 15 at G3, 16 at G4, 18 at G5. Hazards are allowed to be crueler than gear: a DC 20 hazard is legal, and it should look like it.",
        usual: ["Agility", "Body"] },
      { key: "bite", name: "Bite",
        text: "Damage or condition. Use the bands below." },
      { key: "counter", name: "Counter",
        text: "How the crew shuts it off, and it should always be possible: a valve, a breaker, a Node, a prayer with paperwork.",
        examples: ["a valve", "a breaker", "a Node", "a prayer with paperwork"] }
    ]
  },

  /* DC BY GRADE. This ladder runs ABOVE the Standard Threat Array's Save DC at
     G3 and up (15/16/18 against 14/15/16); that is the book's own number. The
     book names DC 20 as legal and sets no maximum. */
  // GMH p101, repeated on p127
  dcByGrade: { 1: 12, 2: 13, 3: 15, 4: 16, 5: 18 },
  dcLegal: 20,
  dcLegalText: "Hazards are allowed to be crueler than gear: a DC 20 hazard is legal, and it should look like it.",

  /* BITE. `count` and `sides` restate the dice; `orMore` marks Lethal's open
     top. The table prints no damage type and no success rule. */
  // GMH p101
  bites: [
    { key: "nuisance",  name: "Nuisance",  dice: "1d6",         count: 1, sides: 6, orMore: false,
      readsAs: "Sprung plating, a live fence, a bad step" },
    { key: "dangerous", name: "Dangerous", dice: "2d6",         count: 2, sides: 6, orMore: false,
      readsAs: "Steam line, sweeping rail current, falling stock" },
    { key: "severe",    name: "Severe",    dice: "4d6",         count: 4, sides: 6, orMore: false,
      readsAs: "Coolant purge, transformer arc, floor giving way onto the next floor" },
    { key: "lethal",    name: "Lethal",    dice: "6d6 or more", count: 6, sides: 6, orMore: true,
      readsAs: "Industrial press, mains junction, the thing the warning stencils were about" }
  ],

  /* PRICING. Two cases: a hazard the crew can use is free, a hazard that hunts
     the crew on a schedule is priced like a threat of its Grade. The book gives
     an equivalent for Severe and Lethal recurring hazards only; `xpByGrade` is
     that Designation's row of the XP price list (p57, p111), repeated so a
     composer needs no second lookup. The book prints no equivalent for a
     recurring Nuisance or Dangerous hazard, and the app treats one as free
     unless the GM enters XP. */
  // GMH p101
  pricing: {
    text: "A hazard the crew can shove Hostiles into is free flavor: charge nothing, enjoy everything. A hazard that hunts the crew on a schedule is opposition: price it into the encounter budget like a threat of its Grade (a Severe recurring hazard is worth about a Standard threat; a Lethal one, an Elite).",
    cases: [
      { key: "flavor", name: "Free flavor", xp: 0,
        when: "A hazard the crew can shove Hostiles into",
        text: "A hazard the crew can shove Hostiles into is free flavor: charge nothing, enjoy everything." },
      { key: "opposition", name: "Opposition", xp: null,
        when: "A hazard that hunts the crew on a schedule",
        text: "A hazard that hunts the crew on a schedule is opposition: price it into the encounter budget like a threat of its Grade" }
    ],
    equivalents: [
      { bite: "severe", recurring: true, designation: "standard",
        text: "a Severe recurring hazard is worth about a Standard threat",
        xpByGrade: { 1: 100, 2: 150, 3: 250, 4: 350, 5: 450 } },
      { bite: "lethal", recurring: true, designation: "elite",
        text: "a Lethal one, an Elite",
        xpByGrade: { 1: 200, 2: 300, 3: 500, 4: 700, 5: 900 } }
    ],
    /* APP RULING, not book text: the gap the equivalents leave, as the Hazards
       tab has always said it. Moved here from js/gm_hazards.js so the Codex
       (Hazards & Set Pieces) and the tab read one copy. */
    unpricedNote: "The book prints no price for a recurring Nuisance or Dangerous hazard. This app treats one as free unless you enter XP."
  },

  /* OBJECTS. Structure is the damage threshold, Integrity the pool. The six
     material pairs are the GM's Card line (p127), the same values as
     EN.combat.coverMaterials. */
  // GMH p101
  objects: {
    text: "Objects break by the book. Anything the crew smashes, breaches, or drops a Warform through uses the Cover Material Table: Structure to matter, Integrity to die. A vault door is Hardened 18/40, and no, it doesn't care about the crowbar.",
    // GMH p127
    materials: [
      { key: "fragile",   name: "Fragile",   structure: 5,  integrity: 3 },
      { key: "cheap",     name: "Cheap",     structure: 7,  integrity: 8 },
      { key: "average",   name: "Average",   structure: 9,  integrity: 12 },
      { key: "heavy",     name: "Heavy",     structure: 11, integrity: 18 },
      { key: "fortified", name: "Fortified", structure: 14, integrity: 24 },
      { key: "hardened",  name: "Hardened",  structure: 18, integrity: 40 }
    ],
    example: { object: "vault door", material: "hardened", structure: 18, integrity: 40 }
  },

  /* FALLING, as the Collapsing Catwalk prints it and the GM's Card repeats it. */
  // GMH p102, p127
  falling: {
    text: "Falling is 1d6 Bludgeoning per 2 spaces fallen, per Falling & Forced Movement.",
    dice: "1d6", count: 1, sides: 6, perSpaces: 2, type: "Bludgeoning"
  },

  /* HOW A HAZARD ACTS. The book's whole rule is "not an initiative slot: a
     presence", plus the Trigger line. It gives no initiative count, which is
     why the app keeps hazards in a Room tray rather than in initiative.
     The Set Pieces use these timings (set piece `timing.kind`):
       entry      when a creature enters or is shoved into the area
       cycle      every `every` rounds
       trigger    when a named event happens
       countdown  `rounds` rounds after its trigger
       while      for as long as a state holds
       round      at the end of each round
       anomaly    as the chosen Flow Disturbances anomaly says */
  // GMH p101
  acts: {
    text: "The room gets a turn. Not an initiative slot: a presence.",
    trigger: "What sets it off: pressure, proximity, a timer, a bullet that missed.",
    timingKinds: ["entry", "cycle", "trigger", "countdown", "while", "round", "anomaly"],
    /* APP NOTE, not book text: how this app seats the book's "presence".
       Moved here from js/gm_hazards.js for the same one-copy reason. */
    appNote: "This app keeps live hazards in the Room tray under the Table's initiative order, with each one's timing worked out from the round."
  },

  /* SET PIECES. Eight drop-in hazards, all authored at Grade 3. The book's only
     scaling rule is "move the DC and dice with the scene". The app's ruling: at
     another Grade a Set Piece takes that Grade's dcByGrade and keeps its
     printed dice and counter DCs for the GM to adjust.
     Shape of each entry:
       text      the entry as printed, after its bold name
       trigger   what sets it off, in the page's words, or null
       timing    { kind, every | rounds | at, text } (kinds listed under acts)
       save      { attr, dc } or null where no save is printed
       bite      { band, dice, type, text, onSuccess } or null. `band` is read
                 off the dice against the Bite table; no entry names its band.
       effects   the entry's other printed effects
       material  a Cover Material row or null
       counter   { text, options } or null where none is printed. An option
                 carries `check` (skills, action, dc), `node` (tier, rank as
                 the [n] the page prints) or `spaces` where the page gives one.
       bestiary  Bestiary names the entry points at (Bestiary names exactly) */
  // GMH p102
  setPieces: {
    intro: "Drop-in trouble. Each is written at Grade 3; move the DC and dice with the scene.",
    grade: 3,
    items: [
      { key: "rail", name: "Live Rail", grade: 3,
        text: "The third rail never went dark. Entering or being shoved into its line: Body Save DC 15, 4d6 Electric on a failure, half on a success. Counter: the breaker box, forty spaces of bad decisions away, or a Node (Standard [0]) if somebody modernized.",
        trigger: "Entering or being shoved into its line",
        timing: { kind: "entry", text: "Entering or being shoved into its line" },
        save: { attr: "Body", dc: 15 },
        bite: { band: "severe", dice: "4d6", type: "Electric", onSuccess: "half",
                text: "4d6 Electric on a failure, half on a success" },
        effects: [],
        material: null,
        counter: { text: "the breaker box, forty spaces of bad decisions away, or a Node (Standard [0]) if somebody modernized",
          options: [
            { text: "the breaker box, forty spaces of bad decisions away", spaces: 40 },
            { text: "a Node (Standard [0]) if somebody modernized", node: { tier: "Standard", rank: 0 } }
          ] },
        bestiary: [] },

      { key: "coolant", name: "Coolant Purge", grade: 3,
        text: "Vents blow supercooled mist on a cycle: every third round, Area 3 line, Agility Save DC 15, 2d6 Cold and Speed halved until the end of their next turn on a failure. Counter: jam the vent (Engineering, one Action, DC 15) or reschedule the cycle from the maintenance Node.",
        trigger: "Vents blow supercooled mist on a cycle",
        /* The page does not say which round the cycle starts on. */
        timing: { kind: "cycle", every: 3, text: "every third round" },
        area: "Area 3 line",
        save: { attr: "Agility", dc: 15 },
        bite: { band: "dangerous", dice: "2d6", type: "Cold", onSuccess: null,
                text: "2d6 Cold and Speed halved until the end of their next turn on a failure" },
        effects: ["Speed halved until the end of their next turn"],
        material: null,
        /* The maintenance Node's tier is not printed. */
        counter: { text: "jam the vent (Engineering, one Action, DC 15) or reschedule the cycle from the maintenance Node",
          options: [
            { text: "jam the vent (Engineering, one Action, DC 15)",
              check: { skills: ["Engineering"], action: "one Action", dc: 15 } },
            { text: "reschedule the cycle from the maintenance Node", node: { tier: null, rank: null } }
          ] },
        bestiary: [] },

      /* No save, no DC and no counter are printed, and the page does not say
         how many spaces a two-story drop is. The fall is the bite. */
      { key: "catwalk", name: "Collapsing Catwalk", grade: 3,
        text: "Average material (Structure 9, Integrity 12) over a two-story drop. Falling is 1d6 Bludgeoning per 2 spaces fallen, per Falling & Forced Movement. The catwalk announces itself: one groan per crossing, dice silent until somebody Dashes, fights, or lands on it.",
        trigger: "Somebody Dashes, fights, or lands on it",
        timing: { kind: "trigger", text: "dice silent until somebody Dashes, fights, or lands on it" },
        save: null,
        bite: { band: null, dice: "1d6", perSpaces: 2, type: "Bludgeoning", onSuccess: null,
                text: "Falling is 1d6 Bludgeoning per 2 spaces fallen, per Falling & Forced Movement." },
        effects: ["over a two-story drop", "one groan per crossing"],
        material: { key: "average", name: "Average", structure: 9, integrity: 12 },
        counter: null,
        bestiary: [] },

      { key: "lockdown", name: "Lockdown Doors", grade: 3,
        text: "Blast partitions drop on an alarm: Fortified (Structure 14, Integrity 24), sealing the room in 2 rounds. Counter: the override Node (Improved [1]), the manual crank behind the paint, or being on the correct side.",
        trigger: "Blast partitions drop on an alarm",
        timing: { kind: "countdown", rounds: 2, text: "sealing the room in 2 rounds" },
        save: null,
        bite: null,
        effects: ["sealing the room in 2 rounds"],
        material: { key: "fortified", name: "Fortified", structure: 14, integrity: 24 },
        counter: { text: "the override Node (Improved [1]), the manual crank behind the paint, or being on the correct side",
          options: [
            { text: "the override Node (Improved [1])", node: { tier: "Improved", rank: 1 } },
            { text: "the manual crank behind the paint" },
            { text: "being on the correct side" }
          ] },
        bestiary: [] },

      /* The page does not say what starts or ends the panic. The Prone damage
         ticks per creature at the start of its turn. */
      { key: "crowd", name: "Crowd Surge", grade: 3,
        text: "A packed floor turns to weather. While the crowd is panicking, the open floor is Difficult Terrain, ranged attacks through it roll with Snag, and anyone knocked Prone in it takes 1d6 Bludgeoning at the start of their turn until they stand. Counter: Charm or Intimidation against the crowd (DC 15) to open a lane; the exits are the objective now.",
        trigger: "While the crowd is panicking",
        timing: { kind: "while", text: "While the crowd is panicking",
                  tick: { at: "turnstart", text: "at the start of their turn until they stand" } },
        save: null,
        bite: { band: "nuisance", dice: "1d6", type: "Bludgeoning", onSuccess: null,
                text: "anyone knocked Prone in it takes 1d6 Bludgeoning at the start of their turn until they stand" },
        effects: [
          "the open floor is Difficult Terrain",
          "ranged attacks through it roll with Snag",
          "the exits are the objective now"
        ],
        material: null,
        counter: { text: "Charm or Intimidation against the crowd (DC 15) to open a lane",
          options: [
            { text: "Charm or Intimidation against the crowd (DC 15) to open a lane",
              check: { skills: ["Charm", "Intimidation"], action: null, dc: 15 } }
          ] },
        bestiary: [] },

      /* The Exposure runs on the player rules in EN.hazards.exposure (heat,
         Harsh), not on the Grade ladder; Suffocating is EN.conditions. */
      { key: "inferno", name: "Server Inferno", grade: 3,
        text: "A burning stack floods the row with heat and halon. The row has Harsh heat Exposure and is heavily obscured. Suppression gas triggers Suffocating in 3 rounds for anyone still inside without sealed air. Counter: the fire, or the schedule.",
        trigger: "A burning stack floods the row with heat and halon",
        timing: { kind: "countdown", rounds: 3,
                  text: "Suppression gas triggers Suffocating in 3 rounds for anyone still inside without sealed air" },
        save: null,
        bite: null,
        effects: [
          "The row has Harsh heat Exposure and is heavily obscured.",
          "Suppression gas triggers Suffocating in 3 rounds for anyone still inside without sealed air."
        ],
        exposure: { type: "heat", severity: "harsh" },
        condition: "Suffocating",
        material: null,
        counter: { text: "the fire, or the schedule",
          options: [ { text: "the fire" }, { text: "the schedule" } ] },
        bestiary: [] },

      /* Every mechanic comes from the chosen anomaly, which the app keeps as
         free text. No DC, dice or counter are printed here. */
      { key: "bleed", name: "Breakflow Bleed", grade: 3,
        text: "A wounded current. Pick an Anomaly from Flow Disturbances (a Static Zone strips the crew's Shaper; a Resonant Storm taxes everyone) and give it a footprint in the fight. Pair it with a threat that exploits it: a Null Hound in a Static Zone is the classic double bill, and the reason Shapers read maintenance manifests.",
        trigger: null,
        timing: { kind: "anomaly", text: "Pick an Anomaly from Flow Disturbances" },
        save: null,
        bite: null,
        effects: ["give it a footprint in the fight"],
        anomalies: ["Static Zone", "Resonant Storm"],
        material: null,
        counter: null,
        bestiary: ["Null Hound"] },

      /* The bite is forced movement, not damage. "the Angler" in the text is
         read as the Bestiary's Sublevel Angler (an app link). */
      { key: "sluice", name: "The Black Sluice", grade: 3,
        text: "Waist-deep runoff, moving. The channel is Difficult Terrain; at the end of each round, everyone in it makes a Body Save DC 15 or is carried 2 spaces downstream (toward the grates, the dark, the Angler). Dropped items are gone. Counter: lines, rigging, or high ground and the humility to use it.",
        trigger: "Anyone in the channel",
        timing: { kind: "round", at: "end", text: "at the end of each round" },
        save: { attr: "Body", dc: 15 },
        bite: { band: null, dice: null, type: null, onSuccess: null, moveSpaces: 2,
                text: "carried 2 spaces downstream (toward the grates, the dark, the Angler)" },
        effects: ["The channel is Difficult Terrain", "Dropped items are gone."],
        material: null,
        counter: { text: "lines, rigging, or high ground and the humility to use it",
          options: [ { text: "lines" }, { text: "rigging" }, { text: "high ground and the humility to use it" } ] },
        bestiary: ["Sublevel Angler"] }
    ],

    guidance: {
      label: "GM Guidance",
      text: "One hazard per fight is seasoning; two is a set piece; three is the fight. Past that, the Hostiles become an afterthought, which is occasionally the point: the night the crew fought the building is a story they will tell longer than most body counts.",
      perFight: [
        { count: 1, reads: "seasoning" },
        { count: 2, reads: "a set piece" },
        { count: 3, reads: "the fight" }
      ]
    }
  },

  /* STALEMATE HAZARDS BY DISTRICT. Rolled on a d6 whenever a Chase Check ties.
     Every row runs the default rule unless its own text says otherwise;
     `rider` quotes the clause that adds to or changes it, and a row with no
     rider is the default rule only. The Impact DC by speed is not printed
     beside these tables, but the GM's Card in the appendix prints it (its
     Chases block): `impactBySpeed` below. Each pilot checks against the DC
     for their own speed, so the Tools roller offers a speed picker that
     fills the DC and still takes a typed one. */
  // GMH p18 (when), p19 to p20 (rule and tables)
  stalemate: {
    when: "Roll on the district's table below whenever the Chase Check ties.",
    rule: "A Stalemate hits both sides. Unless the entry says otherwise, each pilot makes a Control Check against the Impact DC for their current speed; a failure gives that pilot Snag on the next Chase Check.",
    defaultRule: {
      who: "each pilot",
      check: "Control Check",
      against: "the Impact DC for their current speed",
      onFail: "Snag on the next Chase Check"
    },
    // GMH p129 (the GM's Card, Chases: SPEED and IMPACT DC)
    impactBySpeed: [
      { key: "stopped",  speed: "Stopped",   dc: 10 },
      { key: "slow",     speed: "Slow",      dc: 12 },
      { key: "standard", speed: "Standard",  dc: 14 },
      { key: "fast",     speed: "Fast",      dc: 16 },
      { key: "veryfast", speed: "Very Fast", dc: 18 }
    ],
    die: "d6", sides: 6,
    districts: [
      // GMH p19
      { key: "northmouth", name: "Northmouth", rows: [
        { n: 1, text: "A Tollgate lane drops its barrier. Both pilots pick a lane and find out." },
        { n: 2, text: "A freight convoy changes lanes all at once, in the polite way that ends careers." },
        { n: 3, text: "An Ashrider pack drifts in alongside, watching. They pick a side next round, or they don't." },
        { n: 4, text: "Chrome Flats wind shear off the tower faces. Aerial vehicles check twice.",
          rider: "Aerial vehicles check twice." },
        { n: 5, text: "A road crew's cones and a trench nobody fenced." },
        { n: 6, text: "A Homeward checkpoint spins up ahead. Whoever's being chased has a decision to make.",
          rider: "Whoever's being chased has a decision to make." }
      ] },
      // GMH p19
      { key: "lanternbay", name: "Lantern Bay", rows: [
        { n: 1, text: "A container crane swings a load across the Harborline road." },
        { n: 2, text: "Tourist trolleys, two of them, both very slow and very full." },
        { n: 3, text: "The Void Port departures board goes dark, and every taxi in the lot moves at once." },
        { n: 4, text: "Fog off the bay: heavily obscured to the next corner.",
          rider: "heavily obscured to the next corner." },
        { n: 5, text: "A drawbridge starts lifting. It doesn't stop for anyone." },
        { n: 6, text: "The Backdock Saints' runners close a side street with a cart and a smile. Toll is negotiable. Later." }
      ] },
      // GMH p19
      { key: "rings", name: "The Rings", rows: [
        { n: 1, text: "A ring checkpoint asks for papers. It asks everyone, at speed." },
        { n: 2, text: "A market crowd spills off the curb for a street performer. Snag on the next check for anyone who doesn't slow down.",
          rider: "Snag on the next check for anyone who doesn't slow down." },
        { n: 3, text: "A Central Core plaza lowers its bollards. The money doesn't like traffic." },
        { n: 4, text: "Ringers on a rooftop drop a sign. It's theirs, they're allowed." },
        { n: 5, text: "A billboard swarm of advertising drones re-forms across the lane to sell you insurance." },
        { n: 6, text: "A motorcade. Whoever touches it first earns Heat with someone very important.",
          rider: "Whoever touches it first earns Heat with someone very important." }
      ] },
      // GMH p20
      { key: "ferrymark", name: "Ferrymark", rows: [
        { n: 1, text: "The river road floods at the low point. Ground vehicles check; boats laugh.",
          rider: "Ground vehicles check; boats laugh." },
        { n: 2, text: "The Warrens narrow to one lane, then to a stairway." },
        { n: 3, text: "A ferry is docking. The ramp is down, half the passengers are on it." },
        { n: 4, text: "A Ferryman skiff cuts the channel, crossing both sides' bows on purpose." },
        { n: 5, text: "Laundry lines and power cables strung low over the alley. Open-Frame and Aerial vehicles check.",
          rider: "Open-Frame and Aerial vehicles check." },
        { n: 6, text: "A funeral procession for someone who mattered here. Nobody drives through it twice." }
      ] },
      // GMH p20
      { key: "switchyard", name: "Switchyard", rows: [
        { n: 1, text: "A shift change on Foundry Row: three hundred people in the road at once." },
        { n: 2, text: "A freight train on the level crossing, slower than the gap looks." },
        { n: 3, text: "Gridside goes dark block by block, and every traffic Node with it." },
        { n: 4, text: "A molten slag spill outside a foundry. The road is Difficult Terrain and very warm.",
          rider: "The road is Difficult Terrain and very warm." },
        { n: 5, text: "The Night Shift is racing tonight and doesn't appreciate the interruption." },
        { n: 6, text: "A loading bay door drops. Duck under it this round or go around.",
          rider: "Duck under it this round or go around." }
      ] },
      // GMH p20
      { key: "sumpside", name: "Sumpside", rows: [
        { n: 1, text: "Standing runoff a hand deep across the whole road." },
        { n: 2, text: "A pump station vents. The street is heavily obscured, and smells like it.",
          rider: "The street is heavily obscured, and smells like it." },
        { n: 3, text: "Hollow Bend's stilt lanes sway under the weight. Heavy vehicles check twice.",
          rider: "Heavy vehicles check twice." },
        { n: 4, text: "The Sump Rats lift a gate for one side. Roll a d6: odd, the crew; even, whoever paid them last.",
          rider: "Roll a d6: odd, the crew; even, whoever paid them last." },
        { n: 5, text: "A Synth Flats tanker jackknifes, slowly, beautifully, everywhere." },
        { n: 6, text: "The road ends at an Undercity stair. Everyone dismounts, or finds out what Structure means.",
          rider: "Everyone dismounts, or finds out what Structure means." }
      ] }
    ]
  }
};
