/* ===========================================================================
   ELYSIUM NIGHTS · Paying the Crew  (GM Toolkit)
   A transcription of the Game Master's Handbook, Paying the Crew (PDF pages
   109 to 111), with the money rules from How the City Works: paying for an
   Incursion and Claims and Salvage (PDF pages 31 to 33), and the after-dive
   payday order (p30). RULES ONLY: nothing here is computed. The split itself
   is EN.engine.splitPayout; the player-side reward tables (glimmerRewards,
   the fixer note, debts) stay in EN.economy.

   Every `text` is the book's wording with PDF line breaks rejoined, and the
   currency glyphs are the book's own: Glimmer U+1D4A2, Nexus U+25CE. Numbers
   the book prints are carried as numbers beside the text they came from, so a
   screen can compute with one and show the other.

   Page references (// GMH pNN) are PDF page numbers of the handbook; the folio
   printed on each page runs 4 lower. User-facing text carries no page numbers.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {}; EN.gmBook = EN.gmBook || {};

EN.gmBook.payroll = {
  schemaVersion: 1,

  // GMH p109
  intro: "The work ends and the counting starts. Economy and Rewards owns the machinery of money: currencies, lifestyle, debt, fences, conversion. This chapter prices the work itself, so a posted job, a bounty, and a dead cryptid's parts all land inside the same economy the rent comes out of.",

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
    lead: "Anchor a contract's total value to the crew's Caliber and the job's difficulty, then let negotiation, reputation, and fine print move it. The bands below track the Glimmer Rewards table in Economy and Rewards, assigned to the work, with the top of the ladder stretched for institutional clients.",
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
      "A Bounty is a Target with a price tag, payable on a confirmed kill or a body in zip ties. Price a bounty off the Target's XP value: 𝒢3 to 𝒢5 per XP for a kill, doubled for breathing delivery. A G1 Shotcaller runs 𝒢300 to 500. A G3 Wetwork Operative runs 𝒢1,500 to 2,500, and knows it, which is why the operative moved districts. A G5 Solo's bounty crosses 𝒢5,000 into Nexus territory and comes with the institutional attention Nexus implies.",
      "Zip-tie premiums exist because live delivery is miserable: Nonlethal matters, the Dying clock becomes the crew's clock, and the Target's friends get a whole transport route to express their feelings. Charge the client accordingly. So does everyone else in this business."
    ],
    perXpLow: 3, perXpHigh: 5,
    aliveMult: 2,
    nexusAbove: 5000,
    nexusText: "A G5 Solo's bounty crosses 𝒢5,000 into Nexus territory and comes with the institutional attention Nexus implies.",
    examples: [
      { name: "Ganger Shotcaller", grade: 1, xp: 100, low: 300, high: 500,
        text: "A G1 Shotcaller runs 𝒢300 to 500." },
      { name: "Wetwork Operative", grade: 3, xp: 500, low: 1500, high: 2500,
        text: "A G3 Wetwork Operative runs 𝒢1,500 to 2,500, and knows it, which is why the operative moved districts." },
      { name: null, grade: 5, designation: "solo", xp: 1800, low: 5000, high: null,
        text: "A G5 Solo's bounty crosses 𝒢5,000 into Nexus territory and comes with the institutional attention Nexus implies." }
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
      label: "GM Guidance",
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

  /* THE OTHER LEDGER. One Cred line and one Heat line at job's end, handed out
     deliberately. Both systems live with the players (Social Pressure and
     Faction Standing). */
  // GMH p111
  ledger: {
    name: "The Other Ledger",
    text: "Every job pays twice, and the second currency is standing. Wins in front of witnesses move Cred. Noise, bodies, and burned promises move Heat. Both systems live in Social Pressure and Faction Standing, and both are rewards in the strict sense: hand them out deliberately at job's end, one line each. \"The dock workers know what you did\" is payment. \"So does the precinct\" is the invoice.",
    lines: [
      { key: "cred", name: "Cred", perJob: 1,
        moves: "Wins in front of witnesses move Cred.",
        example: "\"The dock workers know what you did\" is payment." },
      { key: "heat", name: "Heat", perJob: 1,
        moves: "Noise, bodies, and burned promises move Heat.",
        example: "\"So does the precinct\" is the invoice." }
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
