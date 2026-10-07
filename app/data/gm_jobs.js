/* ===========================================================================
   ELYSIUM NIGHTS · The Job Board  (GM Toolkit)
   A transcription of the Game Master's Handbook, The Job Board (PDF pages 103
   to 108): five roll tables, the Twelve Postings, and the GM Guidance that
   closes the chapter. RULES ONLY: nothing here is computed, and no row is
   paraphrased. Payday is not rolled here; it lives in EN.gmBook.payroll.

   Every `text` is the book's wording with PDF line breaks rejoined. Each row's
   number is printed to the left of its row on the page (checked against the
   page images; the text extraction puts it after). In The Job each row opens
   with a bold name: that is `name`, and `text` is the rest of the row.

   `instruction` marks a row that tells the GM to do something beyond reading
   it. `links` are APP LINKS, not book text: Bestiary entries (named exactly as
   EN.bestiary names them) or a Bestiary category that a row's wording points
   at, so the board can offer a jump to the Bestiary. They change no rule.

   Rulings for this app that the book is silent on: Job 12 rerolls a second 12;
   Complication 10 is kept even with no cryptid in the job, for the GM to adapt;
   the site's Grade defaults to the crew's Caliber and drives Opposition 06's
   cryptid pull; the postings are numbered like a d12, so they are both a list
   and a roll.

   Page references (// GMH pNN) are PDF page numbers of the handbook; the folio
   printed on each page runs 4 lower. User-facing text carries no page numbers.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {}; EN.gmBook = EN.gmBook || {};

EN.gmBook.jobs = {
  schemaVersion: 1,

  // GMH p103
  intro: "Work finds Freelancers the way water finds basements. This chapter builds jobs at the speed of a session: roll or pick one from each table, connect the seams, and let the crew's own history supply the rest. A job is a client, a task, a site, opposition, a complication, and a payday. Payday math lives in Paying the Crew.",

  /* The tables in the order the book prints them, which is also the order of
     its own list (client, task, site, opposition, complication). "Roll or pick"
     means any table can be chosen instead of rolled. */
  order: ["client", "job", "site", "opposition", "complication"],

  tables: [
    // GMH p103
    { key: "client", name: "The Client", die: "d10", sides: 10, rows: [
      { n: 1,  text: "A fixer with a margin and a reputation, both thin." },
      { n: 2,  text: "A mid-rank corporate manager spending a budget line labeled something else." },
      { n: 3,  text: "A gang shotcaller trying to look legitimate, or a legitimate operator trying to look gang." },
      { n: 4,  text: "A shrine, paying in Glimmer, blessings, and one favor with teeth." },
      { n: 5,  text: "A neighborhood collective, pooling rent money because nobody official answers their district's calls." },
      { n: 6,  text: "A Guild posting, clean terms, real insurance, and a non-compete the crew should actually read." },
      { n: 7,  text: "A Clanker labor circle that needs deniable hands and pays in flawless fabrication work." },
      { n: 8,  text: "An anonymous drop: half up front, coordinates, and a proof-of-work clause. It is exactly as bad an idea as it sounds." },
      { n: 9,  text: "A rival crew, subcontracting the half of their job they can't do. Pride is a line item." },
      { n: 10, text: "Somebody the crew owes. This one doesn't pay. This one deducts." }
    ] },

    /* `instruction.kind`:
         beats      run the job in the listed beats
         reference  the mechanics live in another chapter
         sitdown    run the scene as a Sit-Down
         rolltwice  roll this table `rolls` times; both jobs are real, and
                    the client told the crew about one */
    // GMH p104
    { key: "job", name: "The Job", die: "d12", sides: 12, rows: [
      { n: 1,  name: "Retrieval",
        text: "A drive, a crate, a prototype, an urn. Don't open it, which is why every table sooner or later opens it." },
      { n: 2,  name: "Extraction",
        text: "A person who wants to leave, or must be made to want it." },
      { n: 3,  name: "Escort",
        text: "Move something breakable through somewhere that breaks things." },
      { n: 4,  name: "Hold",
        text: "Keep a site, a witness, or a signal alive until the window closes." },
      { n: 5,  name: "Sabotage",
        text: "Make a machine, a deal, or a reputation stop working, deniably." },
      { n: 6,  name: "Investigation",
        text: "Find out what happened to the last crew. Or the missing shift. Or the money." },
      { n: 7,  name: "Cryptid hunt",
        text: "A posting with a Grade on it, a district that stopped sleeping, and a parts list worth more than the fee. Run it in three beats: Signs, Territory, Lair (see Cryptids of Elysium).",
        instruction: { kind: "beats", text: "Run it in three beats: Signs, Territory, Lair (see Cryptids of Elysium).",
                       beats: ["Signs", "Territory", "Lair"] },
        links: { category: "cryptids" } },
      { n: 8,  name: "Anomaly response",
        text: "Something is bleeding into the block: contain it, cleanse it, or hold the cordon while specialists bill by the hour. Flow Disturbances has the mechanics; the crew has the cordon.",
        instruction: { kind: "reference", text: "Flow Disturbances has the mechanics; the crew has the cordon." } },
      { n: 9,  name: "Disaster shift",
        text: "A flood, a collapse, a grid failure. Pull people out and keep the looting polite. On each trip, decide who gets the last seat on the lifter." },
      { n: 10, name: "Social op",
        text: "Get into the gala, the deposition, the funeral. Leave with the signature, the concession, the seating chart's secrets. Run the room as a Sit-Down.",
        instruction: { kind: "sitdown", text: "Run the room as a Sit-Down." } },
      { n: 11, name: "Claim work",
        text: "Stake, defend, or jump a salvage claim. The paperwork is real, the enforcement is the crew." },
      { n: 12, name: "The double bill",
        text: "Roll twice. The client only told the crew about one of them.",
        instruction: { kind: "rolltwice", text: "Roll twice. The client only told the crew about one of them.", rolls: 2 } }
    ] },

    // GMH p105
    { key: "site", name: "The Site", die: "d10", sides: 10, rows: [
      { n: 1,  text: "A vertical mall, past closing, security drones on a lease nobody renewed." },
      { n: 2,  text: "A flooded sublevel with a working ferry and a rate schedule." },
      { n: 3,  text: "A corporate floor where the lights follow visitors and bill accordingly." },
      { n: 4,  text: "A shrine district on a festival night: lanterns, crowds, zero privacy, infinite witnesses." },
      { n: 5,  text: "A depot of decommissioned warforms, decommissioned on paper.",
        links: { bestiary: ["Warform Chassis"] } },
      { n: 6,  text: "A hab block mid-eviction, tempers at Structure 5." },
      { n: 7,  text: "A clean room. The crew is the contamination." },
      { n: 8,  text: "The Lanes at speed: the job happens between exits." },
      { n: 9,  text: "A dead zone where the #GRID goes quiet and everyone's toys get heavy." },
      { n: 10, text: "Somewhere the crew has been before. It remembers them." }
    ] },

    /* `instruction.kind`:
         pullcryptid    pull a cryptid from the Bestiary at the site's Grade
         complication   points at the Complication roll */
    // GMH p106
    { key: "opposition", name: "The Opposition", die: "d10", sides: 10, rows: [
      { n: 1,  text: "Gangers defending the only thing that pays their block.",
        links: { bestiary: ["Street Ganger", "Ganger Shotcaller"] } },
      { n: 2,  text: "Corpsec on shift, brave in exact proportion to their coverage tier.",
        links: { bestiary: ["Corpsec Officer", "Riot Trooper"] } },
      { n: 3,  text: "A rival crew with mirror-image orders and a better van." },
      { n: 4,  text: "A cult that needs what the crew is carrying to finish a sentence they started years ago.",
        links: { bestiary: ["Cult Cantor"] } },
      { n: 5,  text: "Machines on a dead man's schedule, doing the last order forever.",
        links: { category: "machines" } },
      { n: 6,  text: "A cryptid that considers the site its pantry (pull from the Bestiary at the site's Grade).",
        instruction: { kind: "pullcryptid", text: "(pull from the Bestiary at the site's Grade)", category: "cryptids", grade: "site" },
        links: { category: "cryptids" } },
      { n: 7,  text: "A wetwork element already inside, on a different job, annoyed about the company.",
        links: { bestiary: ["Wetwork Operative"] } },
      { n: 8,  text: "An Echo re-running the site's worst night, indifferent to the current one.",
        links: { bestiary: ["Echo"] } },
      { n: 9,  text: "A Guardian's cluster: the opposition is the building's whole nervous system.",
        links: { bestiary: ["#GRID Guardian"] } },
      { n: 10, text: "Nobody. The site is empty. That is worse, and the complication table is about to explain why.",
        instruction: { kind: "complication", text: "That is worse, and the complication table is about to explain why." } }
    ] },

    // GMH p107
    { key: "complication", name: "The Complication", die: "d12", sides: 12, rows: [
      { n: 1,  text: "The intel is one shift out of date, and the shift matters." },
      { n: 2,  text: "A civilian is exactly where no plan put them: a work crew, a school group, a date going well." },
      { n: 3,  text: "The Target is already gone; what is left is the argument about who moved it." },
      { n: 4,  text: "The client's rival bids the crew, mid-job, in cash." },
      { n: 5,  text: "The site's insurance requires a live #GRID audit tonight, of all nights." },
      { n: 6,  text: "Weather: real rain, Flow weather, or both, and the difference takes a check to spot." },
      { n: 7,  text: "The crew's Heat arrives: someone from an old job is on-site with a memory and a comm." },
      { n: 8,  text: "The payment is contingent on something the client didn't mention: alive, intact, unopened, unrecorded." },
      { n: 9,  text: "Two words on every channel at the worst moment: lockdown drill." },
      { n: 10, text: "The cryptid is a mother. The posting didn't say because the poster didn't know." },
      { n: 11, text: "A debt-holder calls mid-job and expects the crew to multitask." },
      { n: 12, text: "It goes perfectly. All of it. The crew now owns a success somebody else planned for them." }
    ] }
  ],

  /* TWELVE POSTINGS. One line each, numbered 01 to 12. The book prints no die
     and no separate client, pay, Grade or site field for them. */
  // GMH p108
  postings: {
    key: "postings", name: "Twelve Postings", die: "d12", sides: 12,
    intro: "Seeds with the serial numbers left on, one line each:",
    rows: [
      { n: 1,  text: "A vending machine at Tenth and Mercury has started dispensing tomorrow's obituaries, and a Click Chaser will pay for the next seven." },
      { n: 2,  text: "Corpsec is paying triple for cordon shifts around a block where every clock runs eleven minutes slow." },
      { n: 3,  text: "A Hulsk merchant wants an escort for one sealed crate that hums in a minor key: no scanners, no questions, no stops." },
      { n: 4,  text: "Somebody is fencing Guild-tagged salvage from a claim that officially produced nothing; the Guild wants the somebody, not the salvage." },
      { n: 5,  text: "A crew of six went into Filtration Stack 9. The insurance adjuster only needs proof for four. The families are paying for the other two." },
      { n: 6,  text: "A shrine will clear one ritual debt for whoever brings back the Nixie that used to live in their donation box.",
        links: { bestiary: ["Nixie"] } },
      { n: 7,  text: "An Icon's tour bus takes a wrong exit every night at 3:11 and arrives with more mileage than road; the label wants a passenger manifest." },
      { n: 8,  text: "The Warrens' cheapest clinic never bills anyone, staffed by nobody the neighbors have met in daylight, and a corporate anomalist is hiring witnesses." },
      { n: 9,  text: "A Wiredog pack has started leaving its stripped copper in payment-shaped piles outside a specific door, and the tenant wants to know what they are buying.",
        links: { bestiary: ["Wiredog"] } },
      { n: 10, text: "A demolition firm needs a floor cleared of squatters before Thursday, and the squatters are paying better to be unfindable until Friday." },
      { n: 11, text: "An impound lot is losing one vehicle a night through a hole in a fence that faces a wall." },
      { n: 12, text: "Every courier who carries a certain sealed envelope across the Financial Core Zone arrives eleven grams lighter, and the sender has run out of couriers who will." }
    ]
  },

  /* Printed at the foot of the Twelve Postings box, after posting 12. */
  // GMH p108
  guidance: {
    label: "GM Guidance",
    text: "A generated job is a skeleton. It stands up when you attach it to the crew: their debts, their Cred, their district, the fixer whose cut they resent. One connection per job is enough. Two and the players will swear you planned it for weeks."
  }
};
