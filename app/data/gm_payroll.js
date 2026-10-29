/* ===========================================================================
   ELYSIUM NIGHTS · Paying the Crew  (GM Toolkit)
   A transcription of the Game Master's Toolkit, Paying the Crew (PDF pages
   109 to 111), with the money rules from How the City Works: paying for an
   Incursion and Claims and Salvage (PDF pages 31 to 33), the after-dive
   payday order (p30), and Milestones and Pacing from Running the Game (p11),
   for the milestone award. RULES ONLY: nothing here is computed. The split
   itself is EN.engine.splitPayout; the player-side reward tables
   (glimmerRewards, the fixer note, debts) stay in EN.economy.

   Every `text` is the book's wording with PDF line breaks rejoined, and the
   currency glyphs are the book's own: Glimmer U+1D4A2, Nexus U+25CE. Numbers
   the book prints are carried as numbers beside the text they came from, so a
   screen can compute with one and show the other.

   The October 2026 Toolkit adds four pieces of GM prose that sit beside this chapter, and they
   are carried here word for word: `narrativePurpose` and `optionalTwist` (Rewards, the lead-in to
   the reward tables), `bills` (The Bills, the page after The Other Ledger: Debt, Identity Theft
   and Hypercare Response with its arrival roll), and EN.gmBook.gearCatalog at the foot of the
   file (the Gear Catalog's street-price note, its Running Gear, the ordnance price note and the
   rookie cyberware note). The Codex's Paying the Crew panel prints the first three; the Admin
   chapter Gear Catalog prints the last (js/codex_gm_play.js).

   Page references (// GMH pNN) are PDF page numbers of the Toolkit's earlier draft, then titled the Game Master's Handbook; the folio
   printed on each page runs 4 lower. User-facing text carries no page numbers.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {}; EN.gmBook = EN.gmBook || {};

EN.gmBook.payroll = {
  schemaVersion: 1,

  // GMH p109
  intro: "The work ends and the counting starts. Economy and Rewards owns the machinery of money: currencies, lifestyle, debt, fences, conversion. This chapter prices the work itself, so a posted job, a bounty, and a dead cryptid's parts all land inside the same economy the rent comes out of.",

  /* NARRATIVE PURPOSE, under Rewards (GMT p43): two bullets, then "Use rewards to:" and four. */
  narrativePurpose: {
    name: "Narrative Purpose",
    intro: [
      "Glimmer keeps the economy moving without friction.",
      "Nexus Tokens add risk, attention, and story weight."
    ],
    useLead: "Use rewards to:",
    uses: [
      "fuel the crew's next operation",
      "reinforce the faction behind the payout",
      "create difficult choices around spending, saving, laundering, or exposure",
      "turn wealth into story rather than dead inventory"
    ]
  },

  /* The paragraph that closes the Nexus Token Rewards table (GMT p43), with its own run-in. */
  optionalTwist: {
    name: "Optional twist",
    text: "Optional twist: some rewards exist as locked entries, corrupted ledgers, or offline chips that must be recovered, decrypted, or physically moved before they can be used."
  },

  /* CONTRACT PAY. Crew Caliber (rows) against job difficulty (columns). The
     column keys match EN.threats.budget.difficulties, and the cells are an
     array in column order, so a column shift is index arithmetic.
     Each cell:
       text   the cell as printed
       low    the bottom of the band in Glimmer, or null
       high   the top of the band in Glimmer, or null
       about  true where the page prints "about": low and high are that figure
       nexus  null, "or" (Glimmer or Nexus terms), or "only" (Nexus terms and
              no Glimmer figure at all)
     The Caliber 4 Hard and Red bands overlap (30,000 to 35,000); that is the
     book's own grid. Caliber 4 skips the "about 7,500" step. */
  // GMH p109
  contract: {
    lead: "Anchor a contract's total value to the crew's Caliber and the job's difficulty, then let negotiation, reputation, and fine print move it. The bands below track the Glimmer Rewards table (Reward Tables), assigned to the work, with the top of the ladder stretched for institutional clients.",
    columns: [
      { key: "milk", name: "Milk Run" },
      { key: "fair", name: "Fair Fight" },
      { key: "hard", name: "Hard Contract" },
      { key: "red",  name: "Red Work" }
    ],
    rows: [
      { caliber: 1, cells: [
        { col: "milk", text: "𝒢100 to 300",     low: 100,   high: 300,   about: false, nexus: null },
        { col: "fair", text: "𝒢500 to 1,000",   low: 500,   high: 1000,  about: false, nexus: null },
        { col: "hard", text: "𝒢1,500 to 3,000", low: 1500,  high: 3000,  about: false, nexus: null },
        { col: "red",  text: "about 𝒢5,000",    low: 5000,  high: 5000,  about: true,  nexus: null }
      ] },
      { caliber: 2, cells: [
        { col: "milk", text: "𝒢500 to 1,000",   low: 500,   high: 1000,  about: false, nexus: null },
        { col: "fair", text: "𝒢1,500 to 3,000", low: 1500,  high: 3000,  about: false, nexus: null },
        { col: "hard", text: "about 𝒢5,000",    low: 5000,  high: 5000,  about: true,  nexus: null },
        { col: "red",  text: "about 𝒢7,500",    low: 7500,  high: 7500,  about: true,  nexus: null }
      ] },
      { caliber: 3, cells: [
        { col: "milk", text: "𝒢1,500 to 3,000",   low: 1500,  high: 3000,  about: false, nexus: null },
        { col: "fair", text: "about 𝒢5,000",      low: 5000,  high: 5000,  about: true,  nexus: null },
        { col: "hard", text: "about 𝒢7,500",      low: 7500,  high: 7500,  about: true,  nexus: null },
        { col: "red",  text: "𝒢10,000 to 20,000", low: 10000, high: 20000, about: false, nexus: null }
      ] },
      { caliber: 4, cells: [
        { col: "milk", text: "about 𝒢5,000",      low: 5000,  high: 5000,  about: true,  nexus: null },
        { col: "fair", text: "𝒢10,000 to 20,000", low: 10000, high: 20000, about: false, nexus: null },
        { col: "hard", text: "𝒢20,000 to 35,000", low: 20000, high: 35000, about: false, nexus: null },
        { col: "red",  text: "𝒢30,000 to 50,000", low: 30000, high: 50000, about: false, nexus: null }
      ] },
      /* The two Nexus cells. Hard prints one Glimmer figure OR Nexus terms;
         Red prints Nexus terms only, with no Glimmer figure to prefill. */
      { caliber: 5, cells: [
        { col: "milk", text: "𝒢10,000 to 20,000", low: 10000, high: 20000, about: false, nexus: null },
        { col: "fair", text: "𝒢30,000 to 50,000", low: 30000, high: 50000, about: false, nexus: null },
        { col: "hard", text: "𝒢50,000 or ◎ terms", low: 50000, high: 50000, about: false, nexus: "or" },
        { col: "red",  text: "◎ terms, and everything that watches ◎", low: null, high: null, about: false, nexus: "only" }
      ] }
    ],
    after: "Incursions use these bands too (see Incursion Briefings). Those are totals, before the fixer's 10 to 20 percent and the crew's own split rules (Economy and Rewards). Institutional clients at Caliber 4 and up start offering Nexus, which is a payment and a surveillance program in the same envelope.",
    fixerPctLow: 10, fixerPctHigh: 20,
    nexusFromCaliber: 4,

    /* WHAT MOVES THE NUMBER. `steps` lists the column shifts a clause allows,
       positive to the right (harder, richer); the first is the default and a
       clause with two lets the GM pick. The book does not say whether clauses
       stack or what happens past either edge; the app's ruling is that shifts
       stack and clamp at the grid edges, with a note when one runs off. */
    shifts: {
      name: "What moves the number",
      text: "Alive-only or intact-only clauses: one difficulty column to the right. Deniability requirements, no-Heat clauses, or hostile timelines: one column right. Work for neighbors, shrines, or collectives: one or two columns left, and worth it, because those clients pay in the other currencies: Cred, favors, safehouse doors that open at 4 a.m.",
      clauses: [
        { key: "alive", name: "Alive-only or intact-only clauses", steps: [1],
          text: "Alive-only or intact-only clauses: one difficulty column to the right." },
        { key: "deniable", name: "Deniability requirements, no-Heat clauses, or hostile timelines", steps: [1],
          text: "Deniability requirements, no-Heat clauses, or hostile timelines: one column right." },
        { key: "community", name: "Work for neighbors, shrines, or collectives", steps: [-1, -2],
          text: "Work for neighbors, shrines, or collectives: one or two columns left, and worth it, because those clients pay in the other currencies: Cred, favors, safehouse doors that open at 4 a.m." }
      ]
    }
  },

  /* BOUNTIES. Priced off the Target's XP: perXpLow to perXpHigh Glimmer per XP
     for a kill, times aliveMult for breathing delivery. A bounty past
     nexusAbove crosses into Nexus territory. The examples are the page's own;
     `name` is the Bestiary entry where the page names one, and the G5 Solo
     line names none. */
  // GMH p109
  bounties: {
    paragraphs: [
      "A Bounty is a Target with a price tag, payable on a confirmed kill or a body in zip ties. Price a bounty off the Target's XP value: 𝒢3 to 𝒢5 per XP for a kill, doubled for breathing delivery. A G1 Shotcaller runs 𝒢300 to 500. A G3 Wetwork Operative runs 𝒢1,500 to 2,500, and knows it, which is why the operative moved districts. A G5 Solo's bounty crosses 𝒢5,000 into Nexus territory: still paid in Glimmer, but big enough to draw the institutional attention Nexus implies.",
      "Zip-tie premiums exist because live delivery is miserable: Nonlethal matters, the Dying clock becomes the crew's clock, and the Target's friends get a whole transport route to express their feelings. Charge the client accordingly. So does everyone else in this business."
    ],
    perXpLow: 3, perXpHigh: 5,
    aliveMult: 2,
    nexusAbove: 5000,
    nexusText: "A G5 Solo's bounty crosses 𝒢5,000 into Nexus territory: still paid in Glimmer, but big enough to draw the institutional attention Nexus implies.",
    examples: [
      { name: "Ganger Shotcaller", grade: 1, xp: 100, low: 300, high: 500,
        text: "A G1 Shotcaller runs 𝒢300 to 500." },
      { name: "Wetwork Operative", grade: 3, xp: 500, low: 1500, high: 2500,
        text: "A G3 Wetwork Operative runs 𝒢1,500 to 2,500, and knows it, which is why the operative moved districts." },
      { name: null, grade: 5, designation: "solo", xp: 1800, low: 5000, high: null,
        text: "A G5 Solo's bounty crosses 𝒢5,000 into Nexus territory: still paid in Glimmer, but big enough to draw the institutional attention Nexus implies." }
    ]
  },

  /* SALVAGE AND PARTS. Four sources in the book's order; `name` is the label
     each item opens with. The Grade bands are the clean parts value for
     Flow-side and cryptid kills (the fourth source). G5 prints an open top and
     a Nexus alternative. */
  // GMH p110
  salvage: {
    lead: "Bodies are inventory. The fence rates in Economy and Rewards govern everything below; the lists here are what threats reliably leave.",
    sources: [
      { key: "people", name: "People leave gear",
        text: "People leave gear. The Gear line in a stat block lists real catalog items at catalog stats; fence them at the Economy and Rewards rates (30 to 50 percent for street kit, less if it is hot, less again if it is branded). Pulled cyberware is its own market with its own ethics, and the good fences ask exactly one question about it.",
        fencePctLow: 30, fencePctHigh: 50 },
      { key: "machines", name: "Machines leave salvage",
        text: "Machines leave salvage that shortcuts Projects: a wrecked Combat Drone zeroes the parts cost of a comparable build, per Crafting and Projects. Fire-control cores, sensor suites, and mounted weapons survive with an Engineering check and honest labor." },
      { key: "grid", name: "#GRID kills leave code",
        text: "#GRID kills leave code: bricked hostile scripts and burned IC fragment into cipher crafting materials, typically worth the source's XP in Glimmer to the right buyer.",
        glimmerPerXp: 1 },
      { key: "flow", name: "Flow-side and cryptid kills",
        text: "Flow-side and cryptid kills leave the parts the postings are really about. Use the bands below, and remember anything marked Flow-touched takes the 2x to 10x multipliers from Economy and Rewards, is Restricted or worse in corporate districts, and sells to shrines, labs, cults, and brokers who each remember the seller.",
        flowTouchedMultLow: 2, flowTouchedMultHigh: 10 }
    ],
    bands: [
      { grade: 1, text: "𝒢100 to 300",   low: 100,   high: 300,  nexus: null,
        buyers: "Kiosks, chemists, curious bartenders" },
      { grade: 2, text: "𝒢300 to 800",   low: 300,   high: 800,  nexus: null,
        buyers: "Street labs, shrine quartermasters, drone shops" },
      { grade: 3, text: "𝒢800 to 2,000", low: 800,   high: 2000, nexus: null,
        buyers: "Licensed labs, Guild suppliers, serious collectors" },
      { grade: 4, text: "𝒢2,000 to 6,000", low: 2000, high: 6000, nexus: null,
        buyers: "Corporate R&D through gray desks, major shrines" },
      { grade: 5, text: "Relic-tier: 𝒢10,000 up, or ◎", low: 10000, high: null, nexus: "or",
        buyers: "Institutions, cults, and auctions with no address" }
    ],
    guidance: {
      text: "Salvage is the loot system, so let it be one: a cryptid hunt that pays 𝒢2,000 in contract and 𝒢1,800 in parts is working as intended, and the second number is the one that creates scenes, because parts need fences, fences need trust, and trust is the most expensive thing on the invoice."
    }
  },

  /* EXPERIENCE. Milestones are the default. On XP tables every Freelancer gets
     every defeated threat's whole value (not a share), which `eachGetsTotal`
     records. The price list repeats EN.threats (array xp and xpByGrade) as the
     page prints it, one row per Grade. */
  // GMH p111
  xp: {
    defaultMode: "milestone",
    milestone: "For milestone tables (the default): nothing here changes. Level after meaningful work, per Building the Sheet, and use this book's budgets purely as difficulty math.",
    text: "For XP tables: award every defeated threat's value to every Freelancer equally, plus objective awards (50 XP minor, up to 1,000 or more for campaign-defining wins, per Building the Sheet). Defeated includes captured, routed, hacked, bypassed, and talked out of the room. The full price list:",
    eachGetsTotal: true,
    objectiveAward: { min: 50, max: 1000, orMore: true,
                      minText: "50 XP minor", maxText: "up to 1,000 or more for campaign-defining wins" },
    defeatedIncludes: ["captured", "routed", "hacked", "bypassed", "talked out of the room"],
    columns: ["minion", "standard", "elite", "solo"],
    priceList: [
      { grade: 1, minion: 25,  standard: 100, elite: 200, solo: 400 },
      { grade: 2, minion: 50,  standard: 150, elite: 300, solo: 600 },
      { grade: 3, minion: 75,  standard: 250, elite: 500, solo: 1000 },
      { grade: 4, minion: 100, standard: 350, elite: 700, solo: 1400 },
      { grade: 5, minion: 125, standard: 450, elite: 900, solo: 1800 }
    ]
  },

  /* MILESTONES AND PACING (from Running the Game). What counts as a Major or a
     Minor Milestone, for milestone tables. `levelUp` is the PHB's pace as this
     page restates it: either combination levels a Freelancer. The two lists
     are the table's columns top to bottom; `difficulties` on a list item (and
     on `notMilestone`) are APP LINKS, the EN.threats.budget difficulty keys the
     item's own words name, and `byDifficulty` collects them so a finished job
     can suggest its milestone. Each character keeps its count in
     ch.milestones.major and ch.milestones.minor, the same two keys as `kind`
     here. `majorOnlyAbove` is the third pacing note, which is advice ("consider
     requiring"), not a rule: past Caliber 3 a table may count Major only. */
  // GMH p11
  milestones: {
    name: "Milestones and Pacing",
    lead: "The PHB sets the pace: a Freelancer levels up after 2 Major Milestones, or 1 Major and 2 Minor. Here's what counts as which.",
    levelUp: [
      { major: 2, minor: 0 },
      { major: 1, minor: 2 }
    ],
    columns: [
      { kind: "major", name: "MAJOR MILESTONE" },
      { kind: "minor", name: "MINOR MILESTONE" }
    ],
    major: [
      { key: "incursion", kind: "major", text: "Clearing an Incursion: a controlled collapse" },
      { key: "bigJob",    kind: "major", text: "A Hard Contract or Red Work job finished", difficulties: ["hard", "red"] },
      { key: "faction",   kind: "major", text: "A faction's power shifted: a gang broken, a corp exposed, a shrine saved" },
      { key: "arc",       kind: "major", text: "A story arc closed, for better or worse" },
      { key: "goal",      kind: "major", text: "A Freelancer's personal goal met, or lost for good" }
    ],
    minor: [
      { key: "fairJob",     kind: "minor", text: "A Fair Fight job finished", difficulties: ["fair"] },
      { key: "sitDown",     kind: "minor", text: "A Sit-Down won when it mattered" },
      { key: "hunt",        kind: "minor", text: "A cryptid hunt closed" },
      { key: "heatCleared", kind: "minor", text: "A source of Heat cleared to 0" },
      { key: "rival",       kind: "minor", text: "A rival crew beaten, bought, or befriended" }
    ],
    notMilestone: { text: "A Milk Run isn't a milestone. It's rent.", difficulties: ["milk"] },
    byDifficulty: { milk: null, fair: "minor", hard: "major", red: "major" },
    pace: "This pace puts a level roughly every two or three jobs, and it fits the registry's rule of thumb (How the City Works): three to five Incursions between appraisals is a campaign arc, and a Freelancer's real Caliber rises by roughly one step in that time. When the crew's real Caliber has quietly outrun the number on their #PRINT, you have a story.",
    notesLead: "A few notes on pacing:",
    notes: [
      { key: "between", name: "Level between beats, never inside one.",
        text: "The PHB says Downtime, a Long Rest, or between arcs. Fallout is the natural place." },
      { key: "awakening", name: "The Awakening Milestone lands at Level 4.", level: 4,
        text: "It's a good moment to make the Fallout scene about the Freelancer, not the job." },
      { key: "slowDown", name: "Slow down past Caliber 3.", aboveCaliber: 3,
        text: "Above the celebrity line, consider requiring Major Milestones only. The work is bigger and the city is watching. Every level should feel like it cost something." }
    ],
    majorOnlyAbove: 3
  },

  /* THE OTHER LEDGER. One Cred line and one Heat line at job's end, handed out
     deliberately. Both systems live in the Toolkit's Cred and Heat (Optional
     Systems); the app's copy is the Codex's so-credheat. */
  // GMH p111
  ledger: {
    name: "The Other Ledger",
    text: "Every job pays twice, and the second currency is standing. Wins in front of witnesses move Cred. Noise, bodies, and burned promises move Heat. Both systems live in Cred and Heat (Optional Systems), and both are rewards in the strict sense: hand them out deliberately at job's end, one line each. \"The dock workers know what you did\" is payment. \"So does the precinct\" is the invoice.",
    lines: [
      { key: "cred", name: "Cred", perJob: 1,
        moves: "Wins in front of witnesses move Cred.",
        example: "\"The dock workers know what you did\" is payment." },
      { key: "heat", name: "Heat", perJob: 1,
        moves: "Noise, bodies, and burned promises move Heat.",
        example: "\"So does the precinct\" is the invoice." }
    ]
  },

  /* THE BILLS (GMT p45, after The Other Ledger): four opening paragraphs, then Debt, Identity Theft
     and Hypercare Response. Each section's `paragraphs` are the page's, word for word; the bold
     run-in of the light-structure paragraph is the page's.

     HYPERCARE'S ARRIVAL ROLL is the only number in it, so it is typed beside the words: roll
     1d6 when the alert triggers; the team arrives in a useful time window on `successOn` or
     higher; add `tierBonus` for the crew's Hypercare Tier (Tier 1 adds nothing); subtract
     penaltyLow to penaltyHigh for distance, active gunfire or area lockdown. The page leaves
     the subtraction to the GM ("1 to 3"), so no app code rolls it. The tiers themselves are
     the player rule, Hypercare, in Economy and Rewards. */
  bills: {
    name: "The Bills",
    paragraphs: [
      "The bills should press on the crew without turning the session into bookkeeping.",
      "Charge for what matters: lifestyle, rent, vehicle use, maintenance, medical support, papers, transport, quiet fixes, bribes, legal cover, and discretion. Keep the everyday costs light enough to track in a line, and present enough that Glimmer still matters between the big upgrades.",
      "The best bills feel like choices, not taxes. Upgrade the safehouse or stay mobile. Pay for clean identities or trust forged papers. Maintain the vehicle or risk the escape. Cash out Nexus now at a loss or hold it and attract attention.",
      "Use Nexus for story weight. Use Glimmer for the texture of survival."
    ],
    sections: [
      { key: "debt", name: "Debt", paragraphs: [
        "Debt is a story engine, not an accounting tool. Track the holder and the clock; let the principal float a little. A Freelancer with no debt has nothing to lose. A Freelancer with too much debt has nothing to fight for. The sweet spot is between, where the rent is due, the people you owe are circling, and the cause is still real."
      ] },
      { key: "identityTheft", name: "Identity Theft", paragraphs: [
        "Identity theft lands hardest mid-campaign. It hits Freelancers in a way most threats can't: the slow dread of realizing somebody else is spending your money, signing contracts in your name, and you can't prove they aren't you. Use it sparingly. Use it well."
      ] },
      { key: "hypercare", name: "Hypercare Response", paragraphs: [
        "If you want this to stay mostly narrative, treat the tier as permission: Tier 1 gets you help when it is easy, Tier 4 gets you help when it is ugly.",
        "**If you want light structure:** When the alert triggers, roll 1d6. On 4+, the team arrives in a useful time window for the scene. Add +1 for Tier 2, +2 for Tier 3, +3 for Tier 4. Subtract 1 to 3 for distance, active gunfire, or area lockdown."
      ],
      arrival: {
        die: 6, successOn: 4,
        tierBonus: [ { tier: 1, bonus: 0 }, { tier: 2, bonus: 1 }, { tier: 3, bonus: 2 }, { tier: 4, bonus: 3 } ],
        penaltyLow: 1, penaltyHigh: 3,
        penaltyFor: ["distance", "active gunfire", "area lockdown"]
      } }
    ]
  },

  /* PAYDAY ORDER after an Incursion's controlled collapse, the book's own
     sequence. It names a Guild cut but prints no rate for it. */
  // GMH p30
  payday: {
    text: "After a controlled collapse, settle the claim or private commission, declare salvage, pay any Guild cut, and sell whatever footage the crew chooses to release. Mark the Incursion toward each Freelancer's next reassessment. XP and milestones follow the normal advancement rules.",
    steps: [
      "settle the claim or private commission",
      "declare salvage",
      "pay any Guild cut",
      "sell whatever footage the crew chooses to release",
      "Mark the Incursion toward each Freelancer's next reassessment.",
      "XP and milestones follow the normal advancement rules."
    ]
  },

  /* PAYING FOR AN INCURSION. `ratingToColumn` reads the Incursion's rating
     against the crew's Caliber: `offset` 0 is a rating at the crew's Caliber,
     1 is one step above. The page names no column for other offsets. */
  // GMH p31
  incursion: {
    name: "Paying for It",
    text: "Price a cleared Incursion as a contract at its rating's difficulty, using Paying the Crew. A rating at the crew's Caliber is a Hard Contract; one step above is Red Work. Salvage comes on top, at the Grade bands in Salvage and Parts, and the anchor itself is usually the best single piece. XP follows the normal rules: every threat defeated, plus an objective award for the collapse, from 50 XP for a minor site to 1,000 or more for the one the whole city watched.",
    ratingToColumn: [
      { offset: 0, col: "hard" },
      { offset: 1, col: "red" }
    ],
    objectiveAward: { min: 50, max: 1000, orMore: true,
                      minText: "50 XP for a minor site", maxText: "1,000 or more for the one the whole city watched" }
  },

  /* CLAIMS AND SALVAGE. The rules of who owns an Incursion's haul. The page
     prints no goon squad hourly rate and no footage or sponsor price. */
  claims: {
    // GMH p31
    name: "Claims and Salvage",
    intro: "An Incursion on public ground works like a gold strike. The first crew to file a claim on it owns the right to work it, and owns what they carry out. The claim is the job. Everything else is getting there before somebody else does.",
    // GMH p32
    filing: {
      name: "Filing",
      paragraphs: [
        "Every legal claim lands on the ledger of a district claims office. There are several, one per district, and they reconcile overnight. Nobody files at a counter. Claims go in through licensed claim agents: Guild desks, independent brokers in strip-mall storefronts, corporate legal departments, a few shrines that got licensed decades ago and never let it lapse.",
        "The seams are where the trouble lives. Between close of business and reconciliation, two offices can record the same site to two crews. A gate that opens on a district line can be filed twice by honest people. Those seams produce claim disputes, gate crashers with paperwork, and a good share of Contested Incursions.",
        "Filing is a Bureaucracy Tools job. A clean, uncontested claim on a site nobody else has noticed is a formality. A claim in a race is a Dice Pool against the other filer, and a Flawless Success means the crew's timestamp lands first by a margin nobody can argue with.",
        "Claims can be bought and sold. A crew can sell a claim they can't work, or buy one they can. Corporations buy a lot of them."
      ],
      tool: "Bureaucracy Tools",
      uncontested: "a formality",
      race: "a Dice Pool against the other filer",
      flawless: "the crew's timestamp lands first by a margin nobody can argue with"
    },
    // GMH p32
    holding: {
      name: "Holding It",
      text: "A filed claim comes with protection liberties: the holder may defend the claim, with force, against anyone working it without their consent. That's where the two most hated jobs in the business come from.",
      jobs: [
        { key: "goons", name: "Goon squads",
          text: "Goon squads wait outside a claimed site to make sure nobody else goes in. It's cordon work, and it pays by the hour." },
        { key: "crashers", name: "Gate crashers",
          text: "Gate crashers go in after a crew to challenge the claim from the inside: beat them to the anchor, take the salvage, or make them quit. Whether that's legal depends on whose claim is valid, which is usually settled afterward by whoever's still standing and has the better lawyer." }
      ]
    },
    // GMH p32
    privateGround: {
      name: "Private Ground",
      paragraphs: [
        "An Incursion on private property is the owner's business. There's no duty to report it. Owners hire crews quietly, through fixers or a Guild's private desk, and the job never touches the public ledger.",
        "Off-books dives are a healthy minority of the work. Some are crimes. Some are tolerated, because an Open Incursion under a hab block can't wait for a bidding war, and the precinct is happy to look away from a crew doing public-safety work at a neighborhood collective's expense. Entering an Incursion rated above your reported Caliber is fraud only if you misrepresented your rating to get in."
      ]
    },
    /* The salvage award: property that had an owner before the Incursion
       swallowed it stays the owner's, who owes the crew awardPctLow to
       awardPctHigh percent of its value, scaled by the danger. */
    // GMH p33
    salvage: {
      name: "Salvage",
      paragraphs: [
        "What a crew carries out is theirs, with one exception. Property that belonged to someone before the Incursion swallowed it (a cargo container, a missing person's case, a corporation's prototype) is still that owner's. Under the salvage doctrine the owner owes the recovering crew a salvage award of 10 to 30 percent of the item's value, by how dangerous the recovery was, and can't simply seize it back.",
        "Corporations buy Incursion salvage through gray procurement desks: no logo on the door, no questions on the form, fast payment in Glimmer or, at volume, Nexus. The fence rates in Economy and Rewards still govern, and Flow-touched multipliers still apply."
      ],
      awardPctLow: 10, awardPctHigh: 30,
      awardText: "a salvage award of 10 to 30 percent of the item's value, by how dangerous the recovery was"
    },
    // GMH p33
    spectacle: {
      name: "The Spectacle",
      text: "Incursion work is watched. Crews stream their dives, sponsors pay for logo time on armor, and a clean collapse from the right angle can make a rookie famous for a week. Footage is a salvage category of its own, and Media Tools is how a crew turns it into money. A crew that streams also streams their tactics, their faces, and the exact moment they got scared. Some sponsors pay extra for the last one."
    }
  }
};


/* ===========================================================================
   THE GEAR CATALOG, GM prose (GMT pp47 to 58). The Toolkit's Gear Catalog is a catalog of entries
   the app carries as gear (Signature weapons, ordnance, Mystech, Blackware, the tools); this is the
   prose AROUND those entries that the Admin desktop had no copy of (audit A6-21, ruled carried,
   19 Oct 2026): the street-price note, Running Gear, the ordnance price note and the rookie
   cyberware note. Word for word. The Codex's Gear Catalog chapter prints them (js/codex_gm_play.js,
   Admin only), panel gmg-running.

   `streetPrice.glimmerLow` and `glimmerHigh` are the page's "2,000 to 4,000" for one Nexus
   token, typed beside the words (the money rule that reads them is crafting.js's, not this file's).

   RUNNING GEAR is the page's six sections from its heading to the Signature Weapons heading. The
   `lead` paragraph is the line the page sets in the right-hand cell above Armor Slots, between the
   price note and the Running Gear heading; the reading order puts it before the heading, so it
   opens the section here. Running Gear's sections are Weapon Builds, Armor Slots, Vehicle
   Upkeep, Modded Cars, Kits and Encumbrance, in the page's order. =========================== */
EN.gmBook.gearCatalog = {
  schemaVersion: 1,
  name: "Gear Catalog",

  // GMT p47
  streetPrice: {
    name: "Street prices",
    text: "Where an entry gives a price in Glimmer or ◎, the ◎ figure is a street price: Nexus at the black-market exchange in Economy and Rewards, which usually returns 𝒢2,000 to 𝒢4,000 for ◎1.",
    glimmerLow: 2000, glimmerHigh: 4000
  },

  // GMT p47 to p48
  running: {
    name: "Running Gear",
    lead: "A gun that answers every question turns every question into the same one. The most interesting weapons are the ones with a room they can't walk into.",
    sections: [
      { key: "weaponBuilds", name: "Weapon Builds", paragraphs: [
        "A build is a decision made in a garage three days before it matters. Accessories come and go, but a Mod takes bench work, and bench work is a commitment.",
        "That commitment is the lever. A Longarm with a Match Barrel and Marksman Stock owns the rooftop, then becomes a liability in the stairwell. A campaign worth playing gives the player both rooms. Let the Suppressor earn its price on the night nobody hears the shot. Let it do nothing against the thing that hunts by heat."
      ] },
      { key: "armorSlots", name: "Armor Slots", paragraphs: [
        "Slots are a budget, and every budget forces a choice. A four-slot suit can't carry every protective and utility mod at once. That constraint is the point.",
        "A slot holding Trauma Plates can't also hold a Threat-Detection HUD, Gecko Grips, or Faraday Lining. Extra protection against a hit leaves less room for warning of an ambush, climbing out of trouble, or resisting electronic intrusion. Make those differences matter. Give the crew problems that let different mods earn their place.",
        "The strongest builds are usually the ones that gave something up."
      ] },
      { key: "vehicleUpkeep", name: "Vehicle Upkeep", paragraphs: [
        "Upkeep is a clock. Charge it once per week or once per travel leg, write down the number, and get back to the job. Nobody came to the table to audit fuel receipts.",
        "What upkeep buys is pressure with a due date. A crew flush from a good payout barely notices 𝒢900 a week. Three weeks into a dry stretch, that same crew is choosing between the hauler and the safehouse, and the choice will tell you more about them than their sheets ever could.",
        "Let it hurt. Then let them keep the vehicle if they are willing to go into debt for it. A car the crew fought to keep matters more than one that was simply always there."
      ] },
      { key: "moddedCars", name: "Modded Cars", paragraphs: [
        "A modded car is a paper trail with wheels. Every mod on this list is something a witness can describe, a scanner can log, or a mechanic remembers installing, and the crew that bolts a Hardpoint Mount onto the only sedan they own has made that sedan findable.",
        "Let the heat land on the vehicle and not only on the people inside it. Losing a car the crew paid for and loved is a better consequence than losing a fight."
      ] },
      { key: "kits", name: "Kits", paragraphs: [
        "Let kits matter. Reward the Freelancer who invested in gear with cleaner access, better information, and safer rolls. Don't audit every screwdriver, but a crew operating without even a basic kit should feel the risk in their teeth."
      ] },
      { key: "encumbrance", name: "Encumbrance", paragraphs: [
        "If you are counting the exact number of pistols in a backpack, you have gone deeper than this system intends. Ask what the load looks like in fiction. If the Character can still jog, climb, and fight normally, they are Unencumbered. If the load is awkward but plausible, they are Encumbered. If the load looks like a meme screenshot of someone carrying an armory, a generator, and two bodies, they are Overloaded. Load gives the table shared language, not a reason to audit socks."
      ] }
    ]
  },

  // GMT p51, under the Ordnance Ammo table (the melee signatures' no-munitions line, set in the same
  // column, is a note on Munitions and stays with the Signature weapons)
  ordnancePrices: {
    name: "Ordnance prices",
    text: "Listed prices are a calm-day baseline. Small-arms ammo barely moves: there is too much of it, in too many hands, for the price to climb far. Ordnance swings hard with supply and heat. A machinegun belt under a corporate lockdown costs whatever the seller thinks your week is worth, and the price of a rocket triples the day after someone uses one downtown."
  },

  // GMT p58, the opening of Cyberware
  rookieCyberware: {
    name: "Rookie cyberware",
    text: "A Level 1 Freelancer has exactly 1 Resilience Die. Safe Capacity leaves room for 1 or 2 SP of utility chrome without losing it. A rookie who installs 3 SP of heavy combat gear on day one hits Threshold 1, loses the die, and lives on the \"regain 1 die on a Short Rest\" rule. Let that bite. Shortcuts cost."
  }
};
