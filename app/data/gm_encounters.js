/* ===========================================================================
   ELYSIUM NIGHTS · Building Encounters  (GM Toolkit)
   A transcription of the Game Master's Handbook, Building Encounters (PDF
   pages 61 to 65), with the two lines it leans on from the Threats chapter
   (p53 working band, p55 the XP line) and the Critical Failure trigger that
   also starts a response clock (p10). RULES ONLY: nothing here is computed.
   The budget arithmetic lives in EN.gmEngine.budget and tierFor; the threat
   numbers (array, Designations, Roles) stay in EN.threats.

   Every `text` is the book's wording with PDF line breaks rejoined. Numbers the
   book prints are carried as numbers beside the text they came from, so a
   screen can compute with one and show the other. Machine keys are lowercase
   and stable; difficulty keys match EN.threats.budget.difficulties.

   Page references (// GMH pNN) are PDF page numbers of the handbook; the folio
   printed on each page runs 4 lower. User-facing text carries no page numbers.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {}; EN.gmBook = EN.gmBook || {};

EN.gmBook.encounters = {
  schemaVersion: 1,

  // GMH p61
  intro: "An encounter is a question with dice in it. Who holds the freight elevator. Whether the witness leaves the club breathing. How much of the crew's pay is going to end up spent on the crew's knees. This chapter prices the opposition so the question stays open.",

  /* THE BUDGET. The three steps sit between the intro and the Difficulty table
     on the page. `mult` is the printed BUDGET column as a number ("half" is
     0.5). shareByCaliber repeats EN.threats.budget.shareByCaliber on purpose:
     it is printed again in step 01, and this file says what the page says. */
  // GMH p61
  budget: {
    intro: "Every threat has an XP value. An encounter's weight is the sum of the values in it, measured against what the crew can carry.",
    steps: [
      { n: 1, text: "Find the crew's Caliber and its matching Grade. That Grade's Standard threat value is the crew's share: 100 XP at Caliber 1, then 150, 250, 350, 450." },
      { n: 2, text: "Multiply the share by the number of Freelancers. That is the Fair Fight budget." },
      { n: 3, text: "Scale for intent." }
    ],
    shareByCaliber: { 1: 100, 2: 150, 3: 250, 4: 350, 5: 450 },
    difficulties: [
      { key: "milk", name: "Milk Run",      budget: "half", mult: 0.5,
        costs: "Ammo, sweat, maybe a stim. A warmup, a patrol, a message." },
      { key: "fair", name: "Fair Fight",    budget: "1x",   mult: 1,
        costs: "Real Vitality, a defensive Impulse spent at the wrong time, somebody Bloodied if the dice lean." },
      { key: "hard", name: "Hard Contract", budget: "1.5x", mult: 1.5,
        costs: "Resources burned deep, somebody on the Wound track, decisions made at volume." },
      { key: "red",  name: "Red Work",      budget: "2x",   mult: 2,
        costs: "A fight the crew shouldn't take without an edge: terrain, surprise, intel, or a way out. Expect Wounds. Plan the retreat before the entrance." }
    ],
    /* Past the Red Work multiplier the page stops pricing and starts warning. */
    pastMult: 2,
    pastText: "Past 2x, you're writing an ambush on purpose. Do that rarely, do it with signposts, and leave the exits unlocked.",

    /* The page's own example. Each option's lines add up to the 600 budget
       (150 share x 4 Freelancers x 1). `name` is a Bestiary entry name where the
       book names one. Two lines name none ("an Elite squad leader", "one G2
       Solo") and carry Grade and Designation only. "riot Minions" is the app's
       reading: the Riot Trooper is the Bestiary's G2 riot Minion at 50 XP. */
    example: {
      text: "Four Caliber 2 Freelancers. Share 150, Fair Fight budget 600. That buys four Corpsec Officers (600), or an Elite squad leader with two officers (300 + 300), or one G2 Solo (600), or two officers plus six riot Minions (300 + 300). Same money, four different nights.",
      caliber: 2, freelancers: 4, difficulty: "fair", budget: 600,
      options: [
        { label: "four Corpsec Officers (600)", xp: 600, lines: [
          { count: 4, name: "Corpsec Officer", grade: 2, designation: "standard", xpEach: 150 }
        ] },
        { label: "an Elite squad leader with two officers (300 + 300)", xp: 600, lines: [
          { count: 1, name: null, grade: 2, designation: "elite", xpEach: 300 },
          { count: 2, name: "Corpsec Officer", grade: 2, designation: "standard", xpEach: 150 }
        ] },
        { label: "one G2 Solo (600)", xp: 600, lines: [
          { count: 1, name: null, grade: 2, designation: "solo", xpEach: 600 }
        ] },
        { label: "two officers plus six riot Minions (300 + 300)", xp: 600, lines: [
          { count: 2, name: "Corpsec Officer", grade: 2, designation: "standard", xpEach: 150 },
          { count: 6, name: "Riot Trooper", grade: 2, designation: "minion", xpEach: 50 }
        ] }
      ]
    }
  },

  /* COMPOSITION. Six rules; `name` is the bold lead-in. Where a rule prints a
     ceiling or a floor, `check` restates it as data for a warnings panel
     (warnings only, never a block):
       counts  what is counted: "threats", "nonminion", "minion", "grade"
       per     "freelancer" or "meleefreelancer"
       min/max the printed number, per Freelancer; for "grade", max is how
               many Grades a threat may sit from the crew's Caliber
     "Meaningful enemies" is not defined on the page. The app counts every
     non-Minion threat, because the rule's own remedy is to spend on Minions
     instead of more Standards. The frontline floor cannot be checked by the
     app (it cannot tell who wants melee) and is shown as text.
     The Grade band rule points back at the working band on p53: build from
     threats within one Grade of the crew's Caliber. */
  // GMH p62
  composition: {
    intro: "The budget says how much. Composition decides how it plays.",
    rules: [
      { key: "frontline", name: "Match the frontline to theirs",
        text: "At least one threat per melee Freelancer that wants to be in melee, or the crew's Fury spends the night jogging.",
        check: { counts: "threats", per: "meleefreelancer", min: 1 } },
      { key: "actors", name: "Count real actors",
        text: "More than two meaningful enemies per Freelancer and turns start to queue. Past that point, spend the budget on Minions, hazards, or a second wave instead of more Standards.",
        check: { counts: "nonminion", per: "freelancer", max: 2 } },
      { key: "minions", name: "Minions come in handfuls",
        text: "Three per Freelancer on the field at once is the ceiling before bookkeeping outruns fear. Deeper hordes arrive as waves: same budget, spread across rounds.",
        check: { counts: "minion", per: "freelancer", max: 3, onField: true } },
      { key: "spine", name: "One threat should be the problem",
        text: "Give every fight a spine: the Elite calling targets, the Controller reshaping the room, the Deadshot upstairs. A fight with a spine gives the crew a plan to argue about.",
        check: null },
      { key: "reinforcements", name: "Reinforcements are budget",
        text: "Anything that walks in mid-fight was part of the price. A Fair Fight that gets a second Fair Fight bolted on at round three was Red Work wearing a coat.",
        check: null },
      // GMH p53 for the band width (within one Grade of the crew's Caliber)
      { key: "band", name: "Watch the Grade band, not just the total",
        text: "G1 Minions can fill a Caliber 4 budget and still not make a fight of it: their +5 lands, but it lands light, and their DC 12 only bites on a weak save. Under-Grade threats are texture. Over-Grade threats are trauma. The budget is only honest inside the working band.",
        check: { counts: "grade", max: 1 } }
    ],
    // GMH p53
    workingBand: "Build encounters from threats within one Grade of the crew's Caliber.",
    guidance: {
      label: "GM Guidance", name: "Action economy is the real currency",
      text: "The crew's power is four sets of Actions, Swifts, and Impulses working one plan, and the one-defensive-Impulse limit means a focused crew strips a lone enemy's defenses fast. That is why Elites cost double and Solos cheat. When a fight feels wrong on paper, count actions per round on each side before you count damage."
    }
  },

  /* OBJECTIVES. Seven types; `name` is the bold verb the book opens each line
     with and `text` is the rest of the line. The page gives no per-type XP or
     difficulty number: the XP rule (`payout`) covers every objective, and the
     one difficulty effect it prints is alive-only work, carried in `modifiers`
     so a screen can show it as a note ("one difficulty step up"). */
  // GMH p63
  objectives: {
    intro: "An Objective is the reason the crew took the job: a location to hold, a data drive to extract, a VIP to shove into the back of an armored cab. Build fights around one and the fight acquires a clock, a geography, and a reason to end.",
    types: [
      { key: "hold",    name: "Hold",    text: "until the extraction window, the purge cycle, the vote." },
      { key: "take",    name: "Take",    text: "the vault, or the console that opens it." },
      { key: "extract", name: "Extract", text: "the asset, the witness, the crate that whines when it gets cold." },
      { key: "escort",  name: "Escort",  text: "through territory that has opinions." },
      { key: "breach",  name: "Breach",  text: "before the lockdown finishes, the shredder finishes, the ritual finishes." },
      { key: "contain", name: "Contain", text: "the thing until the specialists arrive, or instead of the specialists arriving." },
      { key: "escape",  name: "Escape",  text: "with the proof and the working majority of the crew." }
    ],
    payout: "An objective fight pays its XP for the objective, not the body count. A crew that extracts the VIP through a kitchen while sixteen Minions guard the wrong ballroom earned every point. Say so out loud at the table; it changes how players spend violence.",
    bounties: {
      name: "Bounties and the shape of the win",
      text: "A Bounty is a Target with a price tag, and the tag has fine print: confirmed kill, or a body in zip ties. Bring-them-breathing work runs the fight backward: Nonlethal damage matters, 0 Vitality is the start of the job instead of the end, and the crew's problem is a Dying clock in a building full of the Target's friends. Price alive-only work one difficulty step up.",
      terms: ["confirmed kill", "a body in zip ties"]
    },
    /* `steps` is difficulty columns to the right (milk, fair, hard, red). The
       page does not say whether the budget grows or only the label shifts; the
       app shows it as a note on the encounter. */
    modifiers: [
      { key: "alive", name: "Alive-only", steps: 1,
        text: "Price alive-only work one difficulty step up." }
    ]
  },

  /* THE ROOM IS A COMBATANT. Five dressing rules; `name` is the bold lead-in.
     Structure numbers come off the Cover Material Table (EN.combat.coverMaterials
     carries the full rows; EN.gmBook.hazards.objects has the six pairs). */
  // GMH p63
  room: {
    intro: "An empty floor plan wastes half the system. Cover, obscurement, and destructible terrain are already fully statted in Timing, Action Economy & Combat. High ground can grant Edge (see Edge and Snag). When you dress a fight:",
    rules: [
      { key: "cover", name: "Place cover in bands, not puddles",
        text: "an approach with Half Cover, positions of Three-Quarter Cover worth fighting over, and at least one line where there is nothing but the decision to run anyway." },
      { key: "destructible", name: "Make some of it destructible on purpose",
        text: "A barricade rated Cheap (Structure 7) is a promise to the crew's Fury. A pillar rated Heavy (Structure 11) is a promise to whoever is behind it. Track Structure and Integrity only for cover somebody is actually chewing through.",
        examples: [
          { object: "barricade", material: "cheap", structure: 7 },
          { object: "pillar", material: "heavy", structure: 11 }
        ] },
      { key: "grid", name: "Put the #GRID in the room",
        text: "One or two Nodes per fight is plenty: the turret's targeting Node, the mag-lock, the sprinklers, the freight lift. Statting them is one line from the Node Attributes table. A fight with a hackable Node in it gives the crew's Codebreaker a second battlefield, which is the entire promise of the class.",
        nodesMin: 1, nodesMax: 2 },
      /* The pricing half of this rule is the hazard chapter's rule, carried as
         data in EN.gmBook.hazards.pricing. */
      { key: "fixtures", name: "Let the fixtures participate",
        text: "Steam lines, coolant baths, live rails, glass floors over long falls. Price a hazard the crew can shove enemies into as part of the fun, not the budget. Price a hazard that hunts the crew as budget (see Hazards and Set Pieces)." },
      { key: "light", name: "Light is a weapon",
        text: "The obscurement rules are short and brutal (see Line of Sight and Obscurement). A crew that kills the lights, or a threat that does, changes the fight for free." }
    ]
  },

  // GMH p64
  openings: {
    name: "Openings and Surprise",
    paragraphs: [
      "Whoever starts the fight decides what the first round is about. Run the opening honestly: a crew that scouted, silenced the right sentry, and struck from Stealth gets the Surprised condition working for them, a full round of Edge and unanswered work, and frequently a Fair Fight collapses into a cleanup. Let it. That's planning getting paid.",
      "It cuts the other way. Hostiles with intel, patience, and a Ghost of their own can open on the crew. Telegraph ambush country before it happens: the too-quiet loading dock, the vendor who suddenly remembered an appointment. The warning is what makes the trap fair, and reading warnings is what Passive Perception is for."
    ]
  },

  /* SECURITY RESPONSE. Four tiers in row order, so "escalate one row" is the
     next index. `roundsMin` and `roundsMax` are the printed arrival window
     (Black prints a single number, so both are 2). `looksLike` is the arrival
     force. The page does not define a row past Black; the app's clock stays
     there. `follows` marks the one tier whose response does not stop when the
     crew leaves. */
  // GMH p64
  security: {
    name: "Security Response",
    intro: "Fixed sites answer violence on a schedule. When a fight goes loud somewhere with an owner, start a response clock and tell the players you started it. Every site has a response tier; escalate one row for every 3 rounds of continued noise, or immediately when a Node gets an Alert out.",
    start: "When a fight goes loud somewhere with an owner, start a response clock and tell the players you started it.",
    escalation: {
      text: "escalate one row for every 3 rounds of continued noise, or immediately when a Node gets an Alert out.",
      everyRounds: 3,
      onAlert: true,
      // GMH p10, a Critical Failure escalation for physical and exploration scenes
      other: [ "The noise carries: start the site's Security Response clock, or advance it a row." ]
    },
    tiers: [
      { key: "soft", name: "Soft", site: "Soft (shop, hab block, dive bar)",
        examples: ["shop", "hab block", "dive bar"],
        arrives: "8 to 10 rounds", roundsMin: 8, roundsMax: 10,
        looksLike: "A drone logging faces. G1 Minions with more nerve than training.",
        follows: false },
      { key: "working", name: "Working", site: "Working (warehouse, clinic, mid-tier club)",
        examples: ["warehouse", "clinic", "mid-tier club"],
        arrives: "5 to 6 rounds", roundsMin: 5, roundsMax: 6,
        looksLike: "A Standard patrol matched to the site's Grade, unhappy about it.",
        follows: false },
      { key: "hardened", name: "Hardened", site: "Hardened (corp floor, depot, vault approach)",
        examples: ["corp floor", "depot", "vault approach"],
        arrives: "3 to 4 rounds", roundsMin: 3, roundsMax: 4,
        looksLike: "An Elite-led team, a locked-down grid, doors that remember the crew's faces.",
        follows: false },
      { key: "black", name: "Black", site: "Black (labs, black sites, the places with no signage)",
        examples: ["labs", "black sites", "the places with no signage"],
        arrives: "2 rounds", roundsMin: 2, roundsMax: 2,
        looksLike: "A wetwork element at site Grade, and the response doesn't stop coming when the crew leaves. It follows. Heat follows with it.",
        follows: true }
    ],
    closing: "The clock ends a fight without ending the crew. When the crew hears the second wave spin up, leaving becomes a decision with numbers in it, and the ones who stay for the vault deserve whatever they carry out."
  },

  /* ENDING FIGHTS. Morale itself is EN.threats.morale. The Glimmer glyph is
     printed in the book and kept. */
  // GMH p64
  ending: {
    name: "Ending Fights",
    text: "Fights end when the question is answered, and the answer isn't always a floor full of bodies. Morale breaks (see Threat Conventions). Objectives resolve. Hostiles take the payout math personally: nobody guards a door for 𝒢400 a week after watching a Shaper fold the hallway. Offer surrenders, retreats, and deals mid-fight, and honor the XP either way. A campaign where enemies never run is a campaign where nobody ever owes the crew a favor, and favors are the better loot."
  },

  /* AWARDING EXPERIENCE. Read literally (and ruled so for this app): every
     Freelancer receives the whole encounter total, not a share of it, which is
     what `eachGetsTotal` records. Objective awards go on top, anywhere from 50
     to 1,000 "or more". The defeated-includes list is the threat XP line on
     p55; Paying the Crew prints the same list ending "talked out of the room"
     (EN.gmBook.payroll.xp). */
  xp: {
    // GMH p55
    defeated: "XP is the threat's price in the encounter budget and its award when defeated. Defeated includes captured, routed, hacked, bypassed, or talked down. The crew doesn't have to make a body to get paid in experience.",
    defeatedIncludes: ["captured", "routed", "hacked", "bypassed", "talked down"],
    // GMH p65
    text: "If your table runs XP, total the defeated threats' values and award that number to every Freelancer, per the Golden Rule: equally, whoever pulled the trigger. Add objective awards on top (50 XP for a minor goal, up to 1,000 or more for the campaign-defining ones, per Building the Sheet).",
    eachGetsTotal: true,
    objectiveAward: {
      min: 50, max: 1000, orMore: true,
      minText: "50 XP for a minor goal",
      maxText: "up to 1,000 or more for the campaign-defining ones"
    },
    milestones: "If your table runs milestones, the budgets in this chapter still matter: they are difficulty math, and the milestone is finishing the job the fights were standing in front of."
  },

  /* WORKED EXAMPLES, shaped as loadable templates. Each threat line names a
     Bestiary entry exactly as EN.bestiary names it, with a count and the XP
     the page prices it at. The Toll's last two Street Gangers stay a separate
     line because the page places them (barricade, gantry).
     The Filtration Stack's third line is a hazard, not a Bestiary entry: a
     Flow Disturbances anomaly priced at the budget remainder. `setPiece` is an
     app link to the Set Piece that carries an anomaly (Breakflow Bleed); the
     anomaly itself stays free text. */
  // GMH p65
  examples: [
    { key: "toll", name: "The Toll",
      header: "The Toll (Caliber 1, four Freelancers, Fair Fight, 400 XP).",
      caliber: 1, freelancers: 4, difficulty: "fair", budget: 400,
      text: "A gang has claimed a pedestrian bridge in the Warrens and is taxing foot traffic. One Ganger Shotcaller (Standard, 100), six Street Gangers (Minions, 150), and a Chained Watchdog (Standard Bruiser, 100), spent to 350, with the last 50 on two more gangers: one on the barricade (rated Cheap), one up a gantry with a scoped pistol. Objective options: clear the bridge, or flip the Shotcaller and inherit the toll.",
      lines: [
        { kind: "threat", count: 1, name: "Ganger Shotcaller", grade: 1, designation: "standard", xpEach: 100, xp: 100 },
        { kind: "threat", count: 6, name: "Street Ganger",     grade: 1, designation: "minion",   xpEach: 25,  xp: 150 },
        { kind: "threat", count: 1, name: "Chained Watchdog",  grade: 1, designation: "standard", xpEach: 100, xp: 100 },
        { kind: "threat", count: 2, name: "Street Ganger",     grade: 1, designation: "minion",   xpEach: 25,  xp: 50,
          note: "one on the barricade (rated Cheap), one up a gantry with a scoped pistol" }
      ],
      objectives: ["clear the bridge", "flip the Shotcaller and inherit the toll"],
      room: [ { object: "barricade", material: "cheap", structure: 7 } ] },

    { key: "filtration", name: "Something in the Filtration Stack",
      header: "Something in the Filtration Stack (Caliber 3, four Freelancers, Hard Contract, 1,500 XP).",
      caliber: 3, freelancers: 4, difficulty: "hard", budget: 1500,
      text: "A Fullwell contract: crews keep not coming back from Stack 9. One Sublevel Angler (G3 Solo, 1,000) hunting in the dark, three Vatspill Husks (G1 Minions, 75) it keeps as ambient noise, and a Static Zone (Severity 2) across the kill floor, priced as the remaining 425 because it strips the crew's Shaper exactly when the lure starts singing. The weakness is findable in advance: the Angler's lure light runs on a frequency the maintenance manifests call a fault.",
      lines: [
        { kind: "threat", count: 1, name: "Sublevel Angler", grade: 3, designation: "solo",   xpEach: 1000, xp: 1000 },
        { kind: "threat", count: 3, name: "Vatspill Husk",   grade: 1, designation: "minion", xpEach: 25,   xp: 75 },
        { kind: "hazard", count: 1, name: "Static Zone (Severity 2)", grade: null, designation: null, xpEach: 425, xp: 425,
          setPiece: "bleed",
          note: "across the kill floor, priced as the remaining 425 because it strips the crew's Shaper exactly when the lure starts singing" }
      ],
      objectives: [],
      weakness: "the Angler's lure light runs on a frequency the maintenance manifests call a fault" }
  ]
};
