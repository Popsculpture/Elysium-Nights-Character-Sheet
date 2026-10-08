/* ===========================================================================
   ELYSIUM NIGHTS · Scenes: Sit-Downs, Chases, Incursions  (GM Toolkit)
   A transcription of the Game Master's Handbook for the three scene trackers:
     sitdown    Prepping a Sit-Down, its checklist and example (PDF pages 15
                to 17), and the Sit-Downs block of the GM's Card (p129)
     chase      Setting Up a Chase, its checklist and example (pp17 to 18),
                and the Chases block of the GM's Card (pp129 to 131)
     incursion  Incursion Briefings through Paying for It (pp26 to 31), with
                pointers into Claims and Salvage (pp31 to 33) and the XCal
                collapse response line (p33)
   plus four single lines from elsewhere that a tracker needs beside them:
   where each scene's rules live (p6), the social row of When It Goes Wrong
   for a Critical Failure (p10), and the Resolve line on threats (p55).
   RULES ONLY: nothing here is computed.

   REUSE, NOT RETRANSCRIPTION. Where the app already carries a rule, this file
   points at it with a `ref` (or a `refs` map, or a field ending in `Ref`): a
   dotted path under window.EN, read at render time with EN.gmBook.scenes.ref
   (bottom of this file), which returns null when any step is missing. Paths
   are resolved lazily, so load order among the data files does not matter.
   What the app carries, and where:
     EN.gmBook.hazards.stalemate        the district stalemate tables, the
                                        default stalemate rule and the Impact
                                        DC by speed (GMH pp18 to 20, p129)
     EN.gmBook.hazards.dcByGrade        the hazard DC ladder the Breach Save
                                        uses (also EN.threats.hazardDCByGrade)
     EN.bestiary.vehicles               Hostile Vehicles, their profiles and
                                        the Threat pilots rule (pp98 to 99)
     EN.vehicles.profiles               the crew-side vehicle catalog (PHB)
     EN.resolution.margins.pool         the Dice Pool result names a Sit-Down
                                        result row maps onto (`margin`)
     EN.resolution.collaborative        contested checks: the general Dominant
                                        Victory row (+10 on d20), which a chase
                                        does NOT use, and the method choice
     EN.resolution.social.costs         Core Resolution's shorter Social Cost
                                        Options (rz-social)
     EN.social                          the PHB's Social Pressure and Faction
                                        Standing (data/social.js): the full
                                        Social Fallout table (fallout), the
                                        five Postures (sitDown.postures), what
                                        each Environmental Pressure does
                                        (sitDown.floor), the Resolve tiers and
                                        Pressure per result (sitDown.resolve,
                                        sitDown.pressure)
     EN.chases                          the PHB's Vehicles and Chases
                                        (data/chases.js): what each Chase
                                        Check result does to Lead
                                        (chase.outcomes) and the Pursuit
                                        Escalation table (chase.escalation)
     EN.gmBook.payroll.incursion        Paying for It, rating to pay column
     EN.gmBook.payroll.payday           the after-collapse order (p30)
     EN.gmBook.payroll.claims           Claims and Salvage (pp31 to 33)
     EN.gmBook.encounters.budget        Building Encounters, which an
                                        Incursion's rating feeds as the Grade
     EN.gmBook.people                   Resolve by Role, the contact card and
                                        Their Profile of You (pp43 to 45)
     EN.gmBook.heat                     By Source (who a source sends) and
                                        Cooling Off, whose legal scrub row is
                                        a Sit-Down (pp116 to 118)
     EN.gmBook.payroll.milestones       the Major and Minor lists, where a
                                        won Sit-Down and a cleared Incursion
                                        sit (p11)
     EN.gmBook.card                     the GM's Card as a printable card; its
                                        Sit-Downs and Chases blocks print the
                                        same numbers as this file's, which a
                                        test checks against each other
   The PHB's own Resolve tiers (with its examples) and Pressure per result are
   EN.social.sitDown.resolve.tiers and EN.social.sitDown.pressure.results, keyed
   like resolveTiers and results below; the GM's Card carries the same numbers
   here, and a test checks that the two agree.
   The Piloting Check a player rolls is the Inventory Garage's math
   (js/inventory.js garageBench); the book's formula is
   EN.chases.operating.pilotingCheck.
   The trackers point at the PHB's rules rather than apply them: the Postures,
   what each Environmental Pressure does, what each Chase Check result does to
   Lead, and the Pursuit Escalation row are shown from EN.social and EN.chases
   (refs below) with links into the Codex, and the GM applies them by hand.

   SHAPES
   A checklist item: { n, key, name (the bold run-in, as printed), text (the
     rest of the item), fields: [{ key, label }] }. `fields` are the prep card
     inputs a screen can offer; each label is the item's own words. An item
     whose text the app already carries has `textRef` instead of `text`.
   An option list: [{ key, name }], `name` as printed.
   A row pointer: { ref, rowKey }: `ref` resolves to an array and `rowKey` is
     the `key` of the row in it (a milestone, a Cooling Off method).
   Every `text` is the book's wording with PDF line breaks rejoined. Numbers
   the book prints are carried as numbers beside the text they came from.
   App readings (not printed rules) are named as such in a comment.

   Page references (// GMH pNN) are PDF page numbers of the handbook; the folio
   printed on each page runs 4 lower. User-facing text carries no page numbers.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {}; EN.gmBook = EN.gmBook || {};

EN.gmBook.scenes = {
  schemaVersion: 1,

  /* ======================================================================
     SIT-DOWN
     ====================================================================== */
  sitdown: {
    name: "Sit-Down",
    // GMH p15
    intro: "A Sit-Down is a fight with chairs. It deserves the same prep as one: know who's across the table, what they can take, what they hit back with, and what the room is doing to everybody.",
    // GMH p6
    home: "Social conflicts use the Sit-Down rules in the Social Pressure and Faction Standing section, including Resolve tiers for the people and factions involved.",

    refs: {
      poolMargins: "resolution.margins.pool",          // `margin` on each result row names one of these
      socialCosts: "resolution.social.costs",          // Core Resolution's Social Cost Options
      socialFallout: "social.fallout",                 // the PHB's full Social Fallout table
      postures: "social.sitDown.postures",             // the PHB's five Postures, with their effects
      floor: "social.sitDown.floor.pressures",         // what each Environmental Pressure does (same keys as floor below)
      bookResolve: "social.sitDown.resolve.tiers",     // the PHB's Resolve tiers (same keys as resolveTiers)
      bookResults: "social.sitDown.pressure.results",  // the PHB's Pressure per result (same keys as results)
      consequenceByScene: "resolution.consequenceByScene",
      bestiary: "bestiary.entries",                    // stats.Resolve, on 23 of 48 entries
      resolveByRole: "gmBook.people.resolveByRole",    // who sits at each tier, and moving a contact
      contactCard: "gmBook.people.card",               // a recurring Opposition's card
      theirProfile: "gmBook.people.profiles",          // the d12 for "their Profile of the crew"
      cooling: "gmBook.heat.cooling",                  // Cooling Off: the legal scrub runs a Sit-Down
      milestones: "gmBook.payroll.milestones",
      card: "gmBook.card"                              // the printable card's Sit-Downs block
    },

    /* PREPPING A SIT-DOWN. Seven steps in the book's order. */
    // GMH p16
    checklist: [
      { n: 1, key: "stakes", name: "Stakes, both ways.",
        text: "What the crew wants. What the Opposition wants. What the Opposition concedes when Resolve hits 0, and what they'll offer before that to make the crew go away.",
        fields: [
          { key: "crewWants", label: "What the crew wants" },
          { key: "oppWants", label: "What the Opposition wants" },
          { key: "concedes", label: "What the Opposition concedes when Resolve hits 0" },
          { key: "offers", label: "what they'll offer before that to make the crew go away" }
        ] },
      { n: 2, key: "opposition", name: "The Opposition.",
        text: "Who's in the chair, their Resolve (see Resolve by Role), and their Profile of the crew. If they're a recurring contact, use their card.",
        fields: [
          { key: "who", label: "Who's in the chair" },
          { key: "resolve", label: "their Resolve" },
          { key: "profile", label: "their Profile of the crew" }
        ],
        contact: "If they're a recurring contact, use their card." },
      { n: 3, key: "weakSpots", name: "Weak spots.",
        text: "One Approach that deals double Pressure and one that deals none, per the PHB's Vulnerabilities and Resistances. Pick from Persuasion, Intimidation, Performance, and Deception; Insight doesn't move Resolve anyway. Write the reason in a few words. It's what a good Read reveals.",
        fields: [
          { key: "double", label: "One Approach that deals double Pressure" },
          { key: "doubleWhy", label: "the reason" },
          { key: "none", label: "one that deals none" },
          { key: "noneWhy", label: "the reason" }
        ] },
      { n: 4, key: "postures", name: "Postures.",
        text: "The two Postures they reach for first. Remember they get one a Round, and Veil is for Mystique-aligned targets only.",
        fields: [
          { key: "posture1", label: "The two Postures they reach for first" },
          { key: "posture2", label: "The two Postures they reach for first" }
        ] },
      { n: 5, key: "floor", name: "The Floor.",
        text: "Which Environmental Pressures are live: Their Turf, Your Turf, Time Pressure, Public Audience, Witnesses Who Owe You, Surveillance. Next to each, one piece of legwork that could flip it. Call them out when the scene opens.",
        fields: [
          { key: "live", label: "Which Environmental Pressures are live" },
          { key: "flip", label: "one piece of legwork that could flip it" }
        ] },
      { n: 6, key: "clock", name: "The clock in the room.",
        text: "How long a Round is here, and what changes if the scene runs long: a shift ends, a boss arrives, the coffee goes cold and so does the offer.",
        fields: [
          { key: "round", label: "How long a Round is here" },
          { key: "runsLong", label: "what changes if the scene runs long" }
        ],
        examples: ["a shift ends", "a boss arrives", "the coffee goes cold and so does the offer"] },
      { n: 7, key: "fallout", name: "Fallout, written in advance.",
        text: "One line each for a win, a Mixed Result, and a Critical Failure: the Profile, Debt, or Standing shift that follows. Decide these now, while you're calm.",
        fields: [
          { key: "win", label: "a win" },
          { key: "mixed", label: "a Mixed Result" },
          { key: "critical", label: "a Critical Failure" }
        ],
        shifts: ["Profile", "Debt", "Standing"] }
    ],

    /* WEAK SPOTS. Pressure from an Approach is doubled by one weak spot and
       zeroed by the other. `pressureMult` is the app's numeric reading of
       "double" and "none". Insight is Social Help, never Pressure. */
    // GMH p16 (repeated on p44 for contacts)
    weakSpots: {
      approaches: [
        { key: "persuasion", name: "Persuasion" },
        { key: "intimidation", name: "Intimidation" },
        { key: "performance", name: "Performance" },
        { key: "deception", name: "Deception" }
      ],
      insight: { key: "insight", name: "Insight", text: "Insight doesn't move Resolve anyway." },
      pressureMult: { double: 2, none: 0 },
      reason: "Write the reason in a few words. It's what a good Read reveals."
    },

    /* POSTURES. The page names three. The PHB's full list of five, with what
       each one does, is EN.social.sitDown.postures (refs.postures); a screen
       offers those names as suggestions beside free text and links the
       Codex's Postures. */
    // GMH p16 (Veil), p17 (Stonewall, Compose), p129 (one a Round)
    postures: {
      reachFor: 2,
      perRound: 1,
      rule: "The Opposition gets one Posture a Round.",
      named: [
        { key: "stonewall", name: "Stonewall" },
        { key: "compose", name: "Compose" },
        { key: "veil", name: "Veil", text: "Veil is for Mystique-aligned targets only." }
      ]
    },

    /* THE FLOOR. The six Environmental Pressures in the page's order, keyed
       like EN.social.sitDown.floor.pressures (refs.floor), which carries what
       each one does. The example writes the effect per scene ("Snag for the
       crew", "Snag on Deception"). */
    // GMH p16
    floor: {
      pressures: [
        { key: "theirTurf", name: "Their Turf" },
        { key: "yourTurf", name: "Your Turf" },
        { key: "timePressure", name: "Time Pressure" },
        { key: "publicAudience", name: "Public Audience" },
        { key: "witnesses", name: "Witnesses Who Owe You" },
        { key: "surveillance", name: "Surveillance" }
      ],
      flip: "Next to each, one piece of legwork that could flip it.",
      callOut: "Call them out when the scene opens."
    },

    /* OPPOSITION TIERS (the GM's Card calls the column OPPOSITION; p44 and
       p55 call them the Opposition Tiers). Apex prints "16+": `orMore`.
       Same numbers as js/face.js referencePanel, as the tiers in
       EN.gmBook.people.resolveByRole (p44, with who sits at each) and as the
       card's opposition table in EN.gmBook.card. */
    // GMH p129
    resolveTiers: [
      { key: "pushover", name: "Pushover", resolve: 3,  text: "3",   orMore: false },
      { key: "standard", name: "Standard", resolve: 5,  text: "5",   orMore: false },
      { key: "hardened", name: "Hardened", resolve: 8,  text: "8",   orMore: false },
      { key: "iron",     name: "Iron",     resolve: 12, text: "12",  orMore: false },
      { key: "apex",     name: "Apex",     resolve: 16, text: "16+", orMore: true }
    ],

    /* RESULTS. One row per success tier: the Pressure it deals and what else
       happens. `margin` is the matching `result` in EN.resolution.margins.pool
       (social scenes roll Dice Pools), so a screen can show the margin band
       without a second copy. `fallout`: null, "targetPicks", "possible" or
       "strong". `resolveGain` is the Critical's printed +1 Resolve; the card
       prints no cap on it. A Sit-Down ends when Resolve hits 0 (p16). */
    // GMH p129
    results: [
      { key: "flawless", name: "Flawless", margin: "Flawless Success", pressure: 3, also: null,
        fallout: null, resolveGain: 0 },
      { key: "strong",   name: "Strong",   margin: "Strong Success",   pressure: 2, also: null,
        fallout: null, resolveGain: 0 },
      { key: "mixed",    name: "Mixed",    margin: "Mixed Result",     pressure: 1,
        also: "The target picks the crew's Social Fallout", fallout: "targetPicks", resolveGain: 0 },
      { key: "failure",  name: "Failure",  margin: "Failure",          pressure: 0,
        also: "Social Fallout possible", fallout: "possible", resolveGain: 0 },
      { key: "critical", name: "Critical", margin: "Critical Failure", pressure: 0,
        also: "The target gains 1 Resolve; strong Social Fallout", fallout: "strong", resolveGain: 1 }
    ],
    breaksAt: 0,

    /* A Critical Failure in a social scene, from When It Goes Wrong: the row
       a GM writes the Critical Failure fallout line from. `heat` is the
       printed 1 Heat for the wrong audience. */
    // GMH p10
    criticalFailure: {
      domain: "Social and negotiation",
      text: "Use the PHB's Critical Failure row: public embarrassment, surveillance, a strong Profile, a shift to Hostile posture, or a rival learning something they shouldn't. Add 1 Heat if it happened in front of the wrong people.",
      options: ["public embarrassment", "surveillance", "a strong Profile", "a shift to Hostile posture", "a rival learning something they shouldn't"],
      heat: 1,
      heatText: "Add 1 Heat if it happened in front of the wrong people."
    },

    /* WHERE THE OPPOSITION COMES FROM. A Bestiary entry with a Resolve line
       can sit in the chair; one without cannot be talked to. A contact card
       carries its Resolve line across unchanged (refs.contactCard), and
       refs.resolveByRole says which tier a job sits at. */
    // GMH p55
    bestiaryResolve: "Resolve appears on threats that can be argued with, using the Opposition Tiers from the Sit-Down rules. No Resolve line means the conversation is over before it starts.",

    /* What a won Sit-Down can pay besides its stakes: a Minor Milestone and,
       run as a legal scrub, Heat off an institutional source (1, or 2 on a
       Flawless Success). Both rows live in their own files. */
    // GMH p11 (the milestone), p118 (the legal scrub)
    milestone: { ref: "gmBook.payroll.milestones.minor", rowKey: "sitDown" },
    legalScrub: { ref: "gmBook.heat.cooling.rows", rowKey: "legalScrub" },

    /* EXAMPLE: THIRTY DAYS, a filled checklist the tracker can load. Field
       keys follow the checklist's. The page's Floor lists three live
       pressures, each with where it is, its effect and its flip. */
    // GMH p17
    example: {
      name: "Thirty Days",
      stakes: {
        text: "The crew's Fury is three payments behind on a Kindred arm. The crew wants thirty days. Kindred wants the arm today or the balance in full. At Resolve 0, the recovery lead signs the extension. Before that, she'll offer a week, at interest.",
        crewWants: "thirty days",
        oppWants: "the arm today or the balance in full",
        concedes: "the recovery lead signs the extension",
        offers: "she'll offer a week, at interest"
      },
      opposition: {
        text: "A Kindred recovery lead, Resolve 8 (Hardened). Profile of the crew: Desperate.",
        who: "A Kindred recovery lead",
        resolve: 8, tier: "hardened",
        profile: "Desperate"
      },
      weakSpots: {
        text: "Persuasion deals double (she's behind on quota, and a payment plan counts toward it). Intimidation deals none (people threaten her every shift; it's in her job description).",
        double: "persuasion", doubleWhy: "she's behind on quota, and a payment plan counts toward it",
        none: "intimidation", noneWhy: "people threaten her every shift; it's in her job description"
      },
      postures: {
        text: "Stonewall (she reads the contract aloud, slowly) and Compose.",
        picks: [
          { key: "stonewall", name: "Stonewall", note: "she reads the contract aloud, slowly" },
          { key: "compose", name: "Compose", note: null }
        ]
      },
      floor: [
        { pressure: "theirTurf", name: "Their Turf",
          text: "Their Turf: a Kindred clinic waiting room in the Rings. Snag for the crew. Flip it: meet her at the noodle bar across the street, which means getting her to leave the building.",
          where: "a Kindred clinic waiting room in the Rings.",
          effect: "Snag for the crew.",
          flip: "meet her at the noodle bar across the street, which means getting her to leave the building." },
        { pressure: "surveillance", name: "Surveillance",
          text: "Surveillance: the waiting room cameras. Snag on Deception. Flip it: a camera wipe before the meeting.",
          where: "the waiting room cameras.",
          effect: "Snag on Deception.",
          flip: "a camera wipe before the meeting." },
        { pressure: "timePressure", name: "Time Pressure",
          text: "Time Pressure: the clinic closes in an hour, and the arm is repossessed at close. Snag for the crew. Flip it: a forged appointment that keeps the clinic open late.",
          where: "the clinic closes in an hour, and the arm is repossessed at close.",
          effect: "Snag for the crew.",
          flip: "a forged appointment that keeps the clinic open late." }
      ],
      clock: {
        text: "A Round is a few minutes. After five Rounds the clinic closes, and the next Round is held with the lights off and her hand on the remote.",
        round: "A Round is a few minutes.",
        rounds: 5,
        runsLong: "After five Rounds the clinic closes, and the next Round is held with the lights off and her hand on the remote."
      },
      fallout: {
        win: "thirty days, and her Profile of the crew becomes Good for It.",
        mixed: "she picks from the Social Fallout menu. Her likely pick is worse terms: thirty days, at interest.",
        critical: "the arm goes offline at midnight, by remote, and the crew's Standing with Kindred drops a step."
      }
    }
  },

  /* ======================================================================
     CHASE
     ====================================================================== */
  chase: {
    name: "Chase",
    // GMH p17
    intro: "Chases happen when a plan meets a door it didn't expect. They're also the scene most likely to arrive without warning, so the prep is short and the hazard tables do most of the work.",
    // GMH p6
    home: "Chases use Lead from Vehicles and Chases.",

    refs: {
      outcomes: "chases.chase.outcomes",                         // the PHB's Chase Check results and what each does to Lead
      escalation: "chases.chase.escalation.rows",                // the PHB's Pursuit Escalation table, by Heat
      stalemate: "gmBook.hazards.stalemate",                     // districts, default rule, rows
      impactBySpeed: "gmBook.hazards.stalemate.impactBySpeed",   // Stopped 10 to Very Fast 18
      hostileVehicles: "bestiary.vehicles.profiles",
      threatPilots: "bestiary.vehicles.rules",                   // the entry named "Threat pilots"
      crewVehicles: "vehicles.profiles",
      contest: "resolution.collaborative.contested.outcomes",   // general table; see `check` below
      methodChoice: "resolution.collaborative.methodChoice",
      heatSources: "gmBook.heat.sources",                       // By Source: who each source sends
      card: "gmBook.card"                                       // the printable card's Chases block
    },

    /* SETTING UP A CHASE. Eight steps in the book's order. Step 8's sentence
       is EN.gmBook.hazards.stalemate.when, word for word, so it is a ref. */
    // GMH p18
    checklist: [
      { n: 1, key: "who", name: "Who's running, who's chasing, and why.",
        text: "What does the pursuer want: the crew, the cargo, or just a clear plate?",
        fields: [
          { key: "running", label: "Who's running" },
          { key: "chasing", label: "who's chasing" },
          { key: "wants", label: "What does the pursuer want" }
        ],
        wants: ["the crew", "the cargo", "just a clear plate"] },
      { n: 2, key: "vehicles", name: "The vehicles.",
        text: "One line each: Speed, Handling, Structure, Integrity, mounted weapons. A threat behind the wheel uses the threat-pilot rule from Hostile Vehicles.",
        fields: [
          { key: "speed", label: "Speed" },
          { key: "handling", label: "Handling" },
          { key: "structure", label: "Structure" },
          { key: "integrity", label: "Integrity" },
          { key: "weapons", label: "mounted weapons" }
        ] },
      { n: 3, key: "lead", name: "Starting Lead.",
        text: "2 (Close) unless the fiction says otherwise. If it does, write down why.",
        fields: [
          { key: "lead", label: "Starting Lead" },
          { key: "why", label: "write down why" }
        ] },
      { n: 4, key: "route", name: "The route.",
        text: "Which district, and whose territory, for the Heat the chase will earn. Note one straightaway (Speed decides) and one tangle (Handling earns its keep).",
        fields: [
          { key: "district", label: "Which district" },
          { key: "territory", label: "whose territory" },
          { key: "straightaway", label: "one straightaway" },
          { key: "tangle", label: "one tangle" }
        ],
        straightaway: "Speed decides",
        tangle: "Handling earns its keep" },
      { n: 5, key: "escalation", name: "Escalation.",
        text: "The crew's Heat with the source. The first response arrives in 5 minus half that Heat, rounded down, minimum 1. Note which row of Pursuit Escalation shows up.",
        fields: [
          { key: "source", label: "the source" },
          { key: "heat", label: "The crew's Heat with the source" },
          { key: "row", label: "which row of Pursuit Escalation shows up" }
        ] },
      { n: 6, key: "endings", name: "The two endings.",
        text: "What escape looks like at Lead 5, and what capture looks like at Lead 0: a ram, a board, or a force-stop.",
        fields: [
          { key: "escape", label: "What escape looks like at Lead 5" },
          { key: "capture", label: "what capture looks like at Lead 0" }
        ],
        captureKinds: ["a ram", "a board", "a force-stop"] },
      { n: 7, key: "method", name: "The method.",
        text: "d20 if anyone's shooting, Dice Pools for a long run across districts.",
        fields: [ { key: "method", label: "The method" } ],
        options: [
          { key: "d20", name: "d20", when: "if anyone's shooting" },
          { key: "pool", name: "Dice Pools", when: "for a long run across districts" }
        ] },
      { n: 8, key: "stalemates", name: "Stalemates.",
        textRef: "gmBook.hazards.stalemate.when",
        fields: [] }
    ],

    /* LEAD. 0 to 5, starting at 2. The card prints two gaps for each middle
       band ("6 and 12 spaces"); `gaps` is the app's reading that they belong
       to the band's two Lead values in order. */
    // GMH p129, p130 (start), p18 (the two endings)
    lead: {
      min: 0, max: 5, start: 2,
      startText: "Start at Lead 2.",
      capture: 0, escape: 5,
      bands: [
        { key: "contact", name: "Contact", from: 0, to: 0, text: "0",      gapText: null, gaps: [] },
        { key: "close",   name: "Close",   from: 1, to: 2, text: "1 to 2", gapText: "6 and 12 spaces",
          gaps: [ { lead: 1, spaces: 6 }, { lead: 2, spaces: 12 } ] },
        { key: "distant", name: "Distant", from: 3, to: 4, text: "3 to 4", gapText: "24 and 48 spaces",
          gaps: [ { lead: 3, spaces: 24 }, { lead: 4, spaces: 48 } ] },
        { key: "escape",  name: "Escape",  from: 5, to: 5, text: "5",      gapText: null, gaps: [] }
      ]
    },

    /* THE CHASE CHECK. Chase-only Dominant Victory thresholds: +5 on d20, +3
       in Dice Pools. The general contested table (refs.contest) puts Dominant
       Victory at +10 on d20, so a chase must not read that row. A tie is a
       Stalemate: roll the district table. The handbook prints nothing here on
       what other margins do to Lead; that is the PHB's Vehicles and Chases,
       EN.chases.chase.outcomes (refs.outcomes). */
    // GMH p130
    check: {
      dominant: { d20: 5, pool: 3, text: "Dominant Victory at +5 on d20, +3 in Dice Pools." },
      tie: "stalemate"
    },

    /* STALEMATE, as the card words it. The fuller rule, the district rows and
       the Impact DC by speed are EN.gmBook.hazards.stalemate (refs). */
    // GMH p130
    stalemate: {
      text: "Stalemate: each pilot makes a Control Check against the Impact DC for their speed; a failure is Snag on the next Chase Check."
    },

    /* FIRST RESPONSE. 5 minus half the crew's Heat with the source, half
       rounded down, minimum 1. The worked example fixes where the rounding
       goes: Heat 3 gives 4 rounds (5 - 1), not 3. */
    // GMH p130 (card), p18 (checklist and example)
    firstResponse: {
      text: "First response in 5 minus half the crew's Heat, minimum 1.",
      checklistText: "The first response arrives in 5 minus half that Heat, rounded down, minimum 1.",
      base: 5, heatDivisor: 2, rounding: "down", min: 1
    },

    /* THREAT PILOTS, as the card tables them. EN.bestiary.vehicles.rules
       prints the same rule as prose (refs.threatPilots); these are the
       numbers a screen computes moving Defense with: 10 + Handling + bonus. */
    // GMH p130 (moving Defense), p131 (piloting)
    threatPilot: {
      piloting: "A threat at the wheel pilots at Attack + Handling.",
      movingDefense: [
        { gradeLow: 1, gradeHigh: 2, text: "10 + Handling + 2", base: 10, bonus: 2 },
        { gradeLow: 3, gradeHigh: 4, text: "10 + Handling + 4", base: 10, bonus: 4 },
        { gradeLow: 5, gradeHigh: 5, text: "10 + Handling + 6", base: 10, bonus: 6 }
      ]
    },

    /* EXAMPLE: OUT OF SYNTH FLATS, a filled checklist the tracker can load.
       `bestiary` names are Bestiary entries. Synth Flats and Hollow Bend are
       Sumpside (GMH p41), so `district` is that stalemate table's key, and
       `heatSource` is the By Source row key in EN.gmBook.heat.sources (both
       app links). The sedan is the crew's own ride and is not named further. */
    // GMH p18
    example: {
      name: "Out of Synth Flats",
      running: "the crew, in their sedan, with the Fullwell formula.",
      chasing: "two Homeward Interdiction Units in a Homeward Interceptor, who want the drive back and the faces on file.",
      pursuers: [
        { name: "Homeward Interdiction Unit", bestiary: "Homeward Interdiction Unit", count: 2 }
      ],
      vehicles: {
        text: "Homeward Interceptor: Very Fast, Handling +1, Structure 14, Integrity 50, Light Machinegun on a fixed forward mount, Range 32 / 96 mounted. Its pilot is a Grade 4 threat: piloting checks at +10 (Attack +9, Handling +1), moving Defense 15.",
        lines: [
          { name: "Homeward Interceptor", bestiary: "Homeward Interceptor", side: "chasing",
            pilotGrade: 4, attack: 9, handling: 1, piloting: 10, movingDefense: 15 }
        ]
      },
      lead: { lead: 2, why: "The crew got to the car first." },
      route: {
        text: "South through Synth Flats toward Hollow Bend. The straightaway is the Synth Flats service road, where the Interceptor's Speed wins. The tangle is the stilt lanes under Hollow Bend, where nothing Very Fast stays Very Fast.",
        district: "sumpside",
        straightaway: "the Synth Flats service road, where the Interceptor's Speed wins",
        tangle: "the stilt lanes under Hollow Bend, where nothing Very Fast stays Very Fast"
      },
      escalation: {
        text: "The crew's Heat with Homeward is 3. First response in 4 rounds: a Homeward Patrol Drone joins as a new pursuer.",
        source: "Homeward", heatSource: "homeward", heat: 3, rounds: 4,
        arrives: "a Homeward Patrol Drone joins as a new pursuer.",
        arrivesBestiary: "Homeward Patrol Drone"
      },
      endings: {
        escape: "Escape at Lead 5 into the stilt lanes, where the Sump Rats lift a pump-house gate for anyone Homeward is chasing.",
        capture: "Capture at Lead 0 is a ram at the Hollow Bend ramp, and a faceplate at the window."
      }
    }
  },

  /* ======================================================================
     INCURSION
     ====================================================================== */
  incursion: {
    name: "Incursion",
    // GMH p26
    intro: "An Incursion is a bounded piece of the city where reality has been overwritten. A parking garage gains another mile of fourth floor. A laundromat has a staircase behind its back mirror. Inside, the changes obey rules of their own. Somewhere within is the anchor holding them in place.",
    briefing: "A briefing lists the Incursion's rating, classification, and dive profile.",

    refs: {
      hazardDC: "gmBook.hazards.dcByGrade",          // the Breach Save DC by rating
      hazardDCAlt: "threats.hazardDCByGrade",         // the same ladder, if the above is absent
      budget: "gmBook.encounters.budget",            // a rating N Incursion budgets G N threats
      pay: "gmBook.payroll.incursion",               // Paying for It and ratingToColumn
      payGrid: "gmBook.payroll.contract",
      salvageBands: "gmBook.payroll.salvage.bands",
      payday: "gmBook.payroll.payday",               // after a controlled collapse, in order
      claims: "gmBook.payroll.claims",
      milestones: "gmBook.payroll.milestones",
      bestiary: "bestiary.entries"                   // threats at the rating's Grade
    },

    /* THREAT CALIBERS. The C number is the Grade of everything inside. */
    // GMH p27
    calibers: {
      intro: "Threat Calibers run from 1 to 5. Colors are posting shorthand; the C number sets the Grade of the threats and hazards inside. The descriptions below assume Freelancers working at the matching Caliber.",
      rows: [
        { caliber: 1, color: "Green",  shorthand: "C1 · Green",
          expect: "A bad call costs time or supplies. There is usually room to pull back." },
        { caliber: 2, color: "Amber",  shorthand: "C2 · Amber",
          expect: "Missed preparation gets expensive. A safe route out may not stay safe." },
        { caliber: 3, color: "Red",    shorthand: "C3 · Red",
          expect: "Opposition can answer the crew's moves. Good intelligence matters." },
        { caliber: 4, color: "Violet", shorthand: "C4 · Violet",
          expect: "Trouble spreads through the site. One failed approach can put the exit in doubt." },
        { caliber: 5, color: "Black",  shorthand: "C5 · Black",
          expect: "The crew has little room to recover. Getting everyone out may become the job." }
      ],
      note: "An apartment can rate Black. A mile of transit tunnel can rate Green."
    },

    /* INCURSION RATING. Rating = the Grade of its threats and hazards, and
       the encounter budget is the usual one. `legal` is the contracting rule
       against each Freelancer's REPORTED Caliber (the #PRINT number), which
       a screen compares the rating with. The fraud line is in
       EN.gmBook.payroll.claims.privateGround. */
    // GMH p27
    rating: {
      name: "Incursion Rating",
      text: "Every Incursion receives a rating from 1 to 5, based on scouting, previous entries, and what came back. A rating 3 (Red) Incursion uses G3 threats and G3 hazards, budgeted with Building Encounters.",
      min: 1, max: 5,
      gradeIsRating: true,
      legal: "Freelancers may legally contract for Incursions rated at or below their reported Caliber.",
      posting: {
        text: "Postings list the rating, known classifications, and number of previous entries. They should say where the estimate came from. \"Three crews entered; one returned\" belongs in the briefing.",
        lists: ["the rating", "known classifications", "number of previous entries"],
        source: "They should say where the estimate came from.",
        example: "Three crews entered; one returned"
      }
    },

    /* CLASSIFICATION. One base (Open or Sealed) plus any add-ons. A
       Chromatic Incursion carries a GM record of where it starts, what it
       becomes and the trigger; a posting must disclose a KNOWN change. */
    // GMH p28
    classification: {
      intro: "Every Incursion begins Open or Sealed. Add Instanced, Contested, or Chromatic when applicable.",
      base: ["open", "sealed"],
      addOns: ["instanced", "contested", "chromatic"],
      rows: [
        { key: "open", name: "Open", base: true,
          text: "The gate remains passable while the Incursion stands. Crews can retreat. Things inside can reach the neighborhood." },
        { key: "sealed", name: "Sealed", base: true,
          text: "The gate admits a crew, then shuts behind it. Nobody can enter or leave that interior, and ordinary signals can't cross its boundary. Removing or destroying the anchor releases the crew through a controlled collapse. An uncontrolled collapse breaks the seal and spills the Incursion into the city." },
        { key: "instanced", name: "Instanced", base: false,
          text: "Each entering crew gets its own interior. Crews using the same entrance never meet inside. If an instance seals, another crew may enter its own copy but can't reach the trapped crew." },
        { key: "contested", name: "Contested", base: false,
          text: "Someone else holds the site through force, an earlier claim, or both." },
        { key: "chromatic", name: "Chromatic", base: false,
          text: "The Incursion changes classification when a trigger is met. A gate scouted as Open might become Sealed once the crew is inside." }
      ],
      chromatic: {
        text: "For a Chromatic Incursion, the GM records its starting classification, the classification it becomes, and the trigger. The change can be sudden; its signs should exist before it happens. An old entry report may describe a doorway that vanished. A gate may briefly refuse a thrown object. Someone might notice that every surviving crew left before reaching the same room.",
        record: [
          { key: "from", label: "its starting classification" },
          { key: "becomes", label: "the classification it becomes" },
          { key: "trigger", label: "the trigger" }
        ],
        signs: ["An old entry report may describe a doorway that vanished.", "A gate may briefly refuse a thrown object.", "Someone might notice that every surviving crew left before reaching the same room."]
      },
      ratingStays: "The Incursion's rating doesn't change merely because its classification changes. Reassess it when new evidence shows that the original threat estimate was wrong.",
      disclosure: "A posting must disclose a known seal or known Chromatic change. When reports conflict, mark the classification provisional and include the evidence. A licensed claim agent can't bury a confirmed trap in the fine print.",
      provisional: "When reports conflict, mark the classification provisional and include the evidence.",
      sealedWorse: "Time distortion, extreme weather, and other survival pressures can make a Sealed dive worse. Set them as local rules for the site."
    },

    /* THE ANCHOR. Three kinds. An object anchor runs as a Focal Anchor with
       the rating as its Severity: Defense 14, Vitality 15 x the rating (the
       Cascade Orphan's G3 Focal Anchor prints Vitality 45, p96). The Focal
       Anchor rules themselves are the PHB's Flow Disturbances,
       EN.flow.disturbances (the Codex's fl-dist-anchor). */
    // GMH p28
    anchor: {
      text: "The anchor is whatever holds the overwrite in place, and it isn't always an object. It can be a thing (a fused jukebox, a clock stopped at 3:11), a resident, usually the site's boss, that has to die or leave, or a condition that has to be met (every light in the building on at once). When the anchor is an object, run it as a Focal Anchor (Flow Disturbances), reading the rating as its Severity: Defense 14, Vitality 15 x the rating. Several uncontrolled collapses at once is a Cascade. The city has had one.",
      kinds: [
        { key: "thing", name: "a thing", examples: "a fused jukebox, a clock stopped at 3:11" },
        { key: "resident", name: "a resident, usually the site's boss, that has to die or leave", examples: null },
        { key: "condition", name: "a condition that has to be met", examples: "every light in the building on at once" }
      ],
      focal: {
        when: "When the anchor is an object, run it as a Focal Anchor (Flow Disturbances), reading the rating as its Severity",
        text: "Defense 14, Vitality 15 x the rating",
        defense: 14, vitalityPerRating: 15, severityIsRating: true
      },
      cascade: "Several uncontrolled collapses at once is a Cascade. The city has had one."
    },

    /* DIVE PROFILES. Five, in the page's order. */
    // GMH p29
    profiles: {
      intro: "A dive profile tells the GM what drives the expedition. Profiles can overlap; use the one that best describes why this dive matters.",
      rows: [
        { key: "threshold", name: "Threshold",
          text: "A crew's first defining dive, or the Incursion that earns it a place with a Guild, faction, or neighborhood. The crew's choices give people something to remember." },
        { key: "contract", name: "Contract",
          text: "A dive with a stated objective: clear the site, recover property, or remove the anchor. A filed claim or private commission establishes who may work it. Payment terms and salvage rights establish what the crew takes home." },
        { key: "wildcard", name: "Wildcard",
          text: "An Incursion with an exceptional condition or prize. Its anchor may demand something unexpected. Its salvage may be valuable to someone who has kept that interest quiet. The GM knows what makes the site unusual; the briefing contains what earlier entrants learned." },
        { key: "crucible", name: "Crucible",
          text: "An Incursion that puts a capability under sustained pressure. A Shaper works against unfamiliar Flow. A Codebreaker faces a hostile #GRID. Another crew learns to navigate a place where distance refuses to stay measured. What they learn can lead to training and better postings. Advancement follows the normal rules." },
        { key: "convergence", name: "Convergence",
          text: "Several objectives lead into the same Incursion. Residents, Entities, factions, and rival claim holders pursue their own plans while the crew explores. Removing or destroying the anchor collapses the site. The dispute over what happened there may continue after the streets return to normal." }
      ]
    },

    /* THE DIVE AND THE RETURN. Each push CAN move the site one stage (the
       GM's call). The table starts at Flicker; a site no push has moved yet
       is at stage 0 in the tracker (the app's reading). At Breach the crew
       gets one scene; anyone left inside makes a Body Save at the hazard DC
       for the rating (refs.hazardDC, the ladder `dcText` prints). The steps
       after a CONTROLLED collapse are EN.gmBook.payroll.payday. */
    // GMH p30
    dive: {
      name: "The Dive and the Return",
      text: "An Incursion usually runs across several sessions. Build its interior as a chain of zones leading to the anchor. Give it one or two local rules and keep them consistent. Long Rests, fights that exceed their budget, and loud disturbances push it toward an uncontrolled collapse.",
      pressure: "A site under pressure says so. Each push (a Long Rest, an over-budget fight, a loud disturbance) can move it one stage. Show the stage through the fiction, and let a Shaper or an Awareness check read it outright.",
      pushes: [
        { key: "rest", name: "a Long Rest" },
        { key: "overBudget", name: "an over-budget fight" },
        { key: "loud", name: "a loud disturbance" }
      ],
      stagesPerPush: 1,
      read: "let a Shaper or an Awareness check read it outright",
      stages: [
        { n: 1, key: "flicker", name: "Flicker",
          signs: "Lights stutter, local rules hiccup for a moment, the gate (if any) shimmers",
          means: "Under strain. Still stable." },
        { n: 2, key: "distortion", name: "Distortion",
          signs: "Zones shift or repeat, the local rules turn crueler, residents grow agitated, signals from outside break up",
          means: "One more push and it goes." },
        { n: 3, key: "breach", name: "Breach",
          signs: "The walls let the city show through",
          means: "Uncontrolled collapse. The crew gets one scene to reach the anchor or a gate. Anyone still inside when it ends spills out with the Incursion: scattered across the surrounding blocks, into whatever Anomalies the spill leaves behind. Each Freelancer makes a Body Save at the hazard DC for the Incursion's rating (12, 13, 15, 16, or 18; see Hazards and Set Pieces). On a success they land at 0 Vigor. On a failure they land at 0 Vigor and take 1 Wound." }
      ],
      breach: {
        scenes: 1,
        reach: "The crew gets one scene to reach the anchor or a gate.",
        spill: "Anyone still inside when it ends spills out with the Incursion: scattered across the surrounding blocks, into whatever Anomalies the spill leaves behind.",
        save: { attr: "Body", dcRef: "gmBook.hazards.dcByGrade", dcText: "12, 13, 15, 16, or 18" },
        onSuccess: "On a success they land at 0 Vigor.",
        onFailure: "On a failure they land at 0 Vigor and take 1 Wound.",
        vigor: 0, wounds: 1
      }
    },

    /* XCAL. Who arrives when a collapse spills, for the Breach card. */
    // GMH p33
    collapseResponse: {
      text: "Collapse response: an Incursion that's started to spill. Cordon first, questions never.",
      arrives: "For the table: the X-Calibur Knight in the Bestiary is what arrives. Knights deploy in pairs with a Handler on comms.",
      bestiary: "X-Calibur Knight"
    },

    /* A controlled collapse is a Major Milestone; the row lives in
       EN.gmBook.payroll.milestones. */
    // GMH p11
    milestone: { ref: "gmBook.payroll.milestones.major", rowKey: "incursion" },

    /* EXAMPLE: the page's sample posting and its GM record. The owner hired
       privately, so it sits on private ground (the app's reading of "The
       owner has hired a crew privately"). */
    // GMH p30
    example: {
      posting: {
        text: "Rating 3 (Red) · Open, provisional · Wildcard",
        rating: 3, classification: ["open"], provisional: true, profile: "wildcard",
        body: "A staircase has appeared behind a laundromat's back mirror. The owner has hired a crew privately. Two earlier entrants returned with clothing belonging to people who haven't gone missing yet. Their footage ends before either one steps back through the mirror.",
        ground: "private"
      },
      gmRecord: {
        text: "Chromatic. The gate becomes Sealed when the crew reaches the third-floor dryers. The reflection goes flat, and every call to the street fails.",
        chromatic: { from: "open", becomes: "sealed", trigger: "when the crew reaches the third-floor dryers" }
      }
    },

    /* LOCAL RULES. Each row completes "The inside..." as printed (the row
       text keeps its leading "..."). Give each Incursion one or two. */
    // GMH p31
    localRules: {
      name: "Local Rules",
      text: "Give every Incursion one or two overwritten rules and make them consistent. They're the puzzle the crew solves zone by zone. A few to start:",
      stem: "The inside",
      die: "d12", sides: 12, pickLow: 1, pickHigh: 2,
      rows: [
        { n: 1,  text: "...runs on a loop. Every hour, unattended objects reset to where they were." },
        { n: 2,  text: "...charges for doors. Every door wants a coin, a secret, or a drop of blood." },
        { n: 3,  text: "...is one gravity off. Falls go sideways in one zone." },
        { n: 4,  text: "...can't hold the #GRID. No Nodes, no signal, every connected toy is just weight." },
        { n: 5,  text: "...listens. Saying a thing's name out loud brings it." },
        { n: 6,  text: "...is someone's memory. Its people act out a day that ended badly, and will again." },
        { n: 7,  text: "...pays. Every Flawless Success leaves a small salvage item behind. Every Failure takes one." },
        { n: 8,  text: "...is getting smaller. Each zone cleared is one the crew can't go back through." },
        { n: 9,  text: "...keeps its own time. Set the ratio: an hour inside is a day outside, or a minute. The rent keeps counting either way." },
        { n: 10, text: "...has weather. It rains in the stairwells, or the hallways run cold enough for the Exposure rules." },
        { n: 11, text: "...belongs to the current. Every Invocation cast inside is noticed by whatever owns the Flow here, and it keeps count." },
        { n: 12, text: "...is always filming. Every camera inside streams live to somewhere outside, and someone is selling ads against the crew." }
      ]
    },

    /* PAYING FOR IT. Carried whole in EN.gmBook.payroll.incursion (its text,
       ratingToColumn and objectiveAward); Payroll's pricer reads it there.
       `name` is the heading, so a screen can label its PAY THIS INCURSION
       handoff without a second copy of the rule. */
    // GMH p31
    paying: { name: "Paying for It", ref: "gmBook.payroll.incursion" },

    /* CLAIMS AND SALVAGE, as they bear on the tracker: which ground the site
       sits on, and the four parts of the rule. Every text lives in
       EN.gmBook.payroll.claims; these are pointers with the page's headings. */
    // GMH pp31 to 33
    claims: {
      ref: "gmBook.payroll.claims",
      ground: [
        { key: "public", name: "public ground", ref: "gmBook.payroll.claims.intro" },
        { key: "private", name: "Private Ground", ref: "gmBook.payroll.claims.privateGround" }
      ],
      parts: [
        { key: "filing", name: "Filing", ref: "gmBook.payroll.claims.filing" },
        { key: "holding", name: "Holding It", ref: "gmBook.payroll.claims.holding" },
        { key: "salvage", name: "Salvage", ref: "gmBook.payroll.claims.salvage" },
        { key: "spectacle", name: "The Spectacle", ref: "gmBook.payroll.claims.spectacle" }
      ]
    }
  }
};

/* Resolve a ref path from this file ("gmBook.hazards.stalemate.impactBySpeed")
   against window.EN. Own properties only, so a key can never resolve through
   a prototype. Returns null when the path is empty or any step is missing, so
   a screen can fall back (refs.hazardDCAlt) or say the rule lives elsewhere. */
EN.gmBook.scenes.ref = function (path) {
  if (typeof path !== "string" || !path) return null;
  var parts = path.split("."), node = window.EN, i;
  for (i = 0; i < parts.length; i++) {
    if (node === null || (typeof node !== "object" && typeof node !== "function")) return null;
    if (!Object.prototype.hasOwnProperty.call(node, parts[i])) return null;
    node = node[parts[i]];
  }
  return node === undefined ? null : node;
};
