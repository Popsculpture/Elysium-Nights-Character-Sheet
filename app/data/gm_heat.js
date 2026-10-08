/* ===========================================================================
   ELYSIUM NIGHTS · Heat Response  (GM Toolkit)
   A transcription of the Game Master's Handbook, Heat Response (PDF pages 113
   to 118): the Heat Check, the Ladder, the five Heat Events bands, By Source
   with its two GM-only notes, the Bounty, and Cooling Off. RULES ONLY:
   nothing here is computed. The Downtime check, the event roll, the held
   events and the Bounty tracker are js/gm_heat.js.

   Every `text` is the book's wording with PDF line breaks rejoined (table
   cells split across lines too: "9 to" + "10", "The" + "precinct"). Table
   column headers are kept in the capitals the page prints them in, and the
   Glimmer glyph is the book's own (U+1D4A2), printed on the first number of a
   Bounty range only, as on the page. Numbers the book prints are carried as
   numbers beside the text they came from, so a screen can compute with one and
   show the other.

   APP LINKS, not book text (they change no rule):
     - `difficulty` on a ladder row or an event row is the key of the printed
       fight size in EN.threats.budget.difficulties (milk, fair, hard, red).
       Only the four rows whose own text names a fight carry one; any other
       event that comes to a fight uses its band's ladder row.
     - `match` on a By Source row lists lowercase fragments of the names the
       book gives that source, so a Freelancer's Heat row (ch.face.heat, free
       text, e.g. "South precinct") can find its row. A source with no row
       here (a hashtag, a rival crew, a corp the book doesn't name) has no
       By Source notes; the ladder and the events still apply.
     - `team` on a By Source row names the Bestiary entries (exactly as
       EN.bestiary names them) behind the WHO IT SENDS column. `quote` is the
       column's own words for that entry, `count` is a number the column
       prints, `minHeat` is a printed "at Heat N to 10", and `only` lists the
       name fragments a source must carry for the entry to apply (an Ashrider
       outfit sends Ashriders). A `category` item points at a Bestiary
       category instead of one entry.

   GM ONLY. The two `gmOnly` notes (the Watchfire's hidden hashtag Heat and
   Octothorpe) are secrets the crew never learns. A screen may show them to
   the GM; nothing may write them to a player record, a #POST, or any text
   meant to be copied to the players.

   The PHB's own Heat ladder is EN.social.credHeat.heat.ladder (data/social.js,
   the Codex's so-credheat/heat-ladder). Its 1 to 2 row reads "A file with your
   name on it sits in someone's inbox."; this chapter's THE PHB SAYS column
   prints the handbook's short form, "A file with your name on it", and adds
   what the source sends. The two ladders stay separate on purpose.

   Page references (// GMH pNN) are PDF page numbers of the handbook; the folio
   printed on each page runs 4 lower. User-facing text carries no page numbers.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {}; EN.gmBook = EN.gmBook || {};

EN.gmBook.heat = {
  schemaVersion: 1,

  // GMH p113
  name: "Heat Response",
  intro: [
    "Heat is a number on the crew's sheet. To the people who gave it to them, it's a file, a budget line, a grudge, a name on a whiteboard in a room the crew will never see. This chapter is what that room decides to do.",
    "The PHB says high Heat brings active opposition: assets, agents, hired help showing up at inconvenient times. Here is when they show up, who they are, and how much of a fight they bring."
  ],

  /* THE HEAT CHECK. A d10 per source at the start of each Downtime, against
     the highest Heat anyone in the crew holds with that source; the source
     acts on a roll equal to or lower than that Heat, and always at Heat 10.
     One event per source per Downtime. `max` is the top of the ladder (the
     player sheet clamps Heat 0 to 10 as well). */
  // GMH p113
  check: {
    name: "The Heat Check",
    paragraphs: [
      "At the start of each Downtime, roll a d10 for every source the crew has Heat with. If the roll is equal to or lower than that source's Heat, the source acts: pick or roll an event from its band in the Heat Events tables, and play it during Downtime or open the next job with it.",
      "Heat is tracked per Freelancer, but the city doesn't care whose name is on which file. Roll once per source, using the highest Heat anyone in the crew has with it. The event lands on whoever earned it, and splashes on whoever is standing next to them."
    ],
    guidelinesLead: "A few guidelines:",
    guidelines: [
      { key: "onePerSource", name: "One event per source per Downtime.",
        text: "A crew with Heat from three sources can have a very bad week. That's the point." },
      { key: "alwaysAtTen", name: "At Heat 10 the check always triggers.",
        text: "The order is out, and orders don't take weeks off." },
      { key: "canWait", name: "Events can wait.",
        text: "If the table is mid-arc and a raid would derail it, hold the event and spend it later. The source doesn't forget. It reschedules." },
      { key: "territory", name: "Territory still matters.",
        text: "The PHB's encounters on entering a source's territory happen as well, on top of the check." }
    ],
    when: "At the start of each Downtime",
    die: "d10", sides: 10,
    triggersAtOrBelow: true,    // "equal to or lower than that source's Heat"
    perSource: "highest",       // "the highest Heat anyone in the crew has with it"
    alwaysAt: 10,
    eventsPerSource: 1,
    max: 10
  },

  /* THE LADDER. One row per band, keyed like the event bands below. `phbSays`
     is the PHB's band name as this page prints it; `fight` is the printed fight
     size and `mult` the multiplier it prints ("half budget" is 0.5, Fair Fight
     prints none and is 1). The top band's rule is in `topBand`: every
     triggered check at Heat 9 to 10 brings a Red Work team on top of the
     rolled event, and once a Bounty is up, whoever has taken it. */
  // GMH p114
  ladder: {
    name: "The Ladder",
    intro: "Each band uses the PHB's meaning and adds what the source actually sends. When an event comes to a fight, build it with The Budget (Building Encounters) at the crew's Caliber.",
    columns: ["HEAT", "THE PHB SAYS", "WHAT THE SOURCE SENDS", "IF IT COMES TO A FIGHT"],
    rows: [
      { key: "file", heat: "1 to 2", min: 1, max: 2, phbSays: "A file with your name on it",
        sends: "Paperwork. A fee, a delay, a flag on a #PRINT, a question asked of someone the crew knows.",
        fight: "No fight.", difficulty: null, mult: null },
      { key: "eyes", heat: "3 to 4", min: 3, max: 4, phbSays: "Active interest",
        sends: "Eyes. A tail, a drone that keeps turning up, a contact who gets a visit and calls the crew afterward, scared.",
        fight: "Milk Run (half budget)", difficulty: "milk", mult: 0.5 },
      { key: "interference", heat: "5 to 6", min: 5, max: 6, phbSays: "Targeted",
        sends: "Interference. A job sabotaged, a safehouse searched, a contact bought, a supplier who suddenly can't sell.",
        fight: "Fair Fight", difficulty: "fair", mult: 1 },
      { key: "team", heat: "7 to 8", min: 7, max: 8, phbSays: "Hunted",
        sends: "A team. People whose job this week is the crew. They come with a plan and they come prepared.",
        fight: "Hard Contract (1.5x)", difficulty: "hard", mult: 1.5 },
      { key: "order", heat: "9 to 10", min: 9, max: 10, phbSays: "Marked",
        sends: "The order. The source's best, sent to finish it, and a Bounty posted on the Exchange (The Bounty).",
        fight: "Red Work (2x) on every triggered check, and whoever takes the Bounty on every check",
        difficulty: "red", mult: 2, everyCheck: true, bountyTakers: true }
    ],
    after: [
      "A source sends what it has. A Ferrymark gang at Heat 8 doesn't send a Wetwork Operative; it sends every Ferryman with a grudge and a boat. Kindred at Heat 8 does send the operative, and a recovery team to collect afterward. Build the team from the source's own people first (By Source), and its Grade from the crew's Caliber.",
      "The ladder is a ceiling, not a schedule. A source at Heat 7 can still send a tail or file a complaint. It just doesn't have to stop there. The exception is the top band: at Heat 9 to 10, every check that triggers brings a Red Work team on top of the rolled event. The order doesn't wait for the right moment."
    ],
    topBand: { min: 9, difficulty: "red",
      text: "at Heat 9 to 10, every check that triggers brings a Red Work team on top of the rolled event" }
  },

  /* HEAT EVENTS. A d6 on the source's band, or pick. `n` is the d6 face.
     `difficulty` marks the row whose own text names a fight; `carry` is the
     File's row 6 (roll this source at +1 Heat next Downtime); `bountyMult` is
     the Order's row 1 (double the posted price). */
  events: {
    // GMH p114
    name: "Heat Events",
    intro: "Roll a d6 on the source's band, or pick. Read each line through the source: a \"visit\" from the precinct is a uniform at the door; from the Ashriders it's six engines idling in the street.",
    columns: ["D6", "EVENT"],
    die: "d6", sides: 6,
    bands: [
      // GMH p114
      { key: "file", title: "Heat 1 to 2: The File", name: "The File", min: 1, max: 2, rows: [
        { n: 1, text: "A fine arrives for something the crew did, or nearly did. It's real, it's due, and it's ten percent higher if they argue." },
        { n: 2, text: "A Freelancer's #PRINT picks up a soft flag. Doors still open, but slower, and someone writes down the time." },
        { n: 3, text: "A contact mentions that somebody was asking about the crew. Politely. With a business card." },
        { n: 4, text: "A payment from the last job is held for review. It clears after a week, minus a processing fee nobody explains." },
        { n: 5, text: "The crew's regular place gets a new rule, a new camera, or a new face behind the counter." },
        { n: 6, text: "Nothing happens. The file gets thicker. Next Downtime, roll this source at +1 Heat.", carry: 1 }
      ] },
      // GMH p115
      { key: "eyes", title: "Heat 3 to 4: The Eyes", name: "The Eyes", min: 3, max: 4, rows: [
        { n: 1, text: "A tail. Same face, three days running, never close enough to confront without making a scene." },
        { n: 2, text: "A drone takes an interest in the safehouse. It doesn't do anything. It just stays." },
        { n: 3, text: "A contact gets a visit and calls afterward, scared, asking the crew to lose their number for a while." },
        { n: 4, text: "The crew's #GRID traffic gets slow in a way that means someone is reading it." },
        { n: 5, text: "A friendly face offers the crew easy work. The work is a test, and the source is watching how they take it." },
        { n: 6, text: "A Milk Run: a couple of the source's people try to brace a Freelancer alone, to make a point.", difficulty: "milk" }
      ] },
      // GMH p115
      { key: "interference", title: "Heat 5 to 6: The Interference", name: "The Interference", min: 5, max: 6, rows: [
        { n: 1, text: "The next job's intel is wrong in one specific, deliberate place." },
        { n: 2, text: "The safehouse is searched while the crew is out. Everything is put back almost exactly where it was." },
        { n: 3, text: "A supplier, fence, or clinic suddenly can't serve the crew. Their prices didn't go up; their door closed." },
        { n: 4, text: "A contact has been bought. They're still friendly. They're also reporting." },
        { n: 5, text: "A client cancels mid-job after a phone call. The crew keeps the advance, and the client's enemies learn their names." },
        { n: 6, text: "A Fair Fight: the source moves on the crew in the open, somewhere it controls.", difficulty: "fair" }
      ] },
      // GMH p115
      { key: "team", title: "Heat 7 to 8: The Team", name: "The Team", min: 7, max: 8, rows: [
        { n: 1, text: "A team takes the safehouse while the crew is out, and waits." },
        { n: 2, text: "A team hits the crew mid-job, at the worst moment, on purpose." },
        { n: 3, text: "Someone the crew loves is picked up \"for questioning.\" The release terms are a meeting." },
        { n: 4, text: "A Freelancer's gear, vehicle, or cyberware is targeted: a repossession, a hack, a fire." },
        { n: 5, text: "The source hires another crew to do it, at Hard Contract pay. They're professionals. They might even be polite." },
        { n: 6, text: "A Hard Contract ambush on the road between jobs.", difficulty: "hard" }
      ] },
      // GMH p116
      { key: "order", title: "Heat 9 to 10: The Order", name: "The Order", min: 9, max: 10, rows: [
        { n: 1, text: "The source raises the Bounty: double the posted price. Takers who passed on it before don't pass now.", bountyMult: 2 },
        { n: 2, text: "The source's best team comes for the crew where they sleep." },
        { n: 3, text: "The source burns a Freelancer's #PRINT: frozen accounts, flagged face, a warrant with their name spelled right." },
        { n: 4, text: "Every ally the crew has gets an offer to step away. Some take it." },
        { n: 5, text: "The source makes the crew's district unlivable: rent tripled, water off, a raid every night until somebody gives them up." },
        { n: 6, text: "Red Work, and the source isn't hiding it. This is the event people talk about afterward.", difficulty: "red" }
      ] }
    ]
  },

  /* BY SOURCE. Eight sources in the book's order. `how` and `sends` are the
     two printed columns; `match` and `team` are app links (see the header).
     Names the column uses that no Bestiary entry carries are left as text:
     the precinct's "officers", Fullwell's machines (a category link), the
     shrine's "something the shrine would rather not name", and the Guild's
     rival crew. The Corpsec Sergeant is the variant printed on the Corpsec
     Officer card; the recovery team matches that Specialist card's GM
     Guidance (two Specialists and two Corpsec Officers, 800 XP); "the X-Calibur
     Knight in the Bestiary is what arrives" when X-Calibur comes (p33).
     `cooling` quotes Cooling Off's caution for the two sources that rarely
     respond to money (p118). */
  // GMH p116
  sources: {
    name: "By Source",
    intro: "Every source climbs the same ladder, but each climbs it in its own shoes. Use these notes to color an event, and to pick who shows up when it comes to a fight.",
    columns: ["SOURCE", "HOW IT COMES AT THE CREW", "WHO IT SENDS"],
    rows: [
      { key: "kindred", name: "Kindred",
        how: "Through the body. Implant support refused, prescriptions delayed, a clinic that suddenly can't find the file. At the top, recovery teams take back the chrome.",
        sends: "Corpsec Officers and Sergeants, a Corporate Handler, a Wetwork Operative at Heat 7 to 10, and a recovery team (two Kindred Recovery Specialists, two officers) behind them",
        match: ["kindred"],
        team: [
          { name: "Corpsec Officer", quote: "Corpsec Officers and Sergeants" },
          { name: "Corporate Handler", quote: "a Corporate Handler" },
          { name: "Wetwork Operative", quote: "a Wetwork Operative at Heat 7 to 10", minHeat: 7 },
          { name: "Kindred Recovery Specialist", quote: "two Kindred Recovery Specialists", count: 2, group: "a recovery team" },
          { name: "Corpsec Officer", quote: "two officers", count: 2, group: "a recovery team" }
        ] },
      { key: "fullwell", name: "Fullwell",
        how: "Through the tap and the counter. Water and power metered harder, a ration card that stops working, the pump on the crew's block down for \"maintenance.\"",
        sends: "Corpsec, contracted Sump Rats in Sumpside, and machines on the pump lines",
        match: ["fullwell"],
        team: [
          { name: "Corpsec Officer", quote: "Corpsec" },
          { name: "Sump Rat Pump Crew", quote: "contracted Sump Rats in Sumpside" },
          { category: "machines", quote: "machines on the pump lines" }
        ] },
      { key: "homeward", name: "Homeward",
        how: "Through the roads. Tolls flagged, transit bans, a drone overhead every time the crew steps outside, a Homeward patrol that pulls them over twice a day.",
        sends: "Combat and Spotter Drones, transit officers as Corpsec, Interdiction Units, a Warform Chassis at Heat 9 to 10",
        match: ["homeward"],
        team: [
          { name: "Combat Drone", quote: "Combat and Spotter Drones" },
          { name: "Spotter Drone", quote: "Combat and Spotter Drones" },
          { name: "Corpsec Officer", quote: "transit officers as Corpsec" },
          { name: "Homeward Interdiction Unit", quote: "Interdiction Units" },
          { name: "Warform Chassis", quote: "a Warform Chassis at Heat 9 to 10", minHeat: 9 }
        ] },
      { key: "precinct", name: "The precinct",
        how: "Through the law. Stops, warrants, a raid with the wrong address and the right timing. Slow, underfunded, and very good at paperwork.",
        sends: "Riot Troopers and officers, and X-Calibur if the crew's Caliber makes it a high-Caliber incident",
        match: ["precinct"],
        team: [
          { name: "Riot Trooper", quote: "Riot Troopers" },
          { name: "X-Calibur Knight", quote: "X-Calibur if the crew's Caliber makes it a high-Caliber incident", highCaliber: true }
        ] },
      { key: "gang", name: "A gang",
        how: "Through the street. Territory closed, a tax on every crossing, friends who stop answering, and then the jump in an alley.",
        sends: "The gang's own people: Street Gangers, a Shotcaller, Chromed Bruisers. Ashriders come on engines; Ferrymen come by water",
        match: ["gang", "ashrider", "ferrymark", "ferrymen", "ferryman", "sump rat"],
        team: [
          { name: "Street Ganger", quote: "Street Gangers" },
          { name: "Ganger Shotcaller", quote: "a Shotcaller" },
          { name: "Chromed Bruiser", quote: "Chromed Bruisers" },
          { name: "Ashrider Outrider", quote: "Ashriders come on engines", only: ["ashrider"] },
          { name: "Ashrider Road Boss", quote: "Ashriders come on engines", only: ["ashrider"] },
          { name: "Ferryman", quote: "Ferrymen come by water", only: ["ferry"] },
          { name: "Sump Rat Pump Crew", quote: "The gang's own people", only: ["sump rat"] }
        ],
        cooling: "Gangs want respect, restitution, or a favor." },
      { key: "shrine", name: "A shrine",
        how: "Through the current. The block's spirits stop doing the crew small favors and start keeping count. Devices fail at bad moments. A Nixie sulks.",
        sends: "Rarely people. Echoes stirred up, a Lantern Shoal drawn to the crew, and at the top, something the shrine would rather not name",
        match: ["shrine"],
        team: [
          { name: "Echo", quote: "Echoes stirred up" },
          { name: "Lantern Shoal", quote: "a Lantern Shoal drawn to the crew" }
        ],
        cooling: "Shrines want amends, made in person, at the shrine that knows the spirit's name." },
      { key: "guild", name: "A Guild",
        how: "Through the board. Postings dry up, a membership review, a card pulled, a claim challenged by Guild lawyers. Guilds almost never send muscle; they send rivals.",
        sends: "Another crew, holding a Guild posting with the crew's name on it",
        match: ["guild"],
        team: [] },
      { key: "watchfire", name: "The Watchfire",
        how: "Through the hunt. Invitations withdrawn, a member's card quietly pulled, a hunt posting that sends the crew to the wrong lair at the wrong hour. At the top, the Watchfire stops being polite.",
        sends: "Watchfire Hunters, a Watchfire Master at Heat 9 to 10, or a cryptid steered toward the crew's door",
        match: ["watchfire"],
        team: [
          { name: "Watchfire Hunter", quote: "Watchfire Hunters" },
          { name: "Watchfire Master", quote: "a Watchfire Master at Heat 9 to 10", minHeat: 9 },
          { category: "cryptids", quote: "a cryptid steered toward the crew's door" }
        ] }
    ]
  },

  /* GM ONLY (see the header): never written to a player record or a #POST.
     `hashtags` are the four the notes name, in the first note's order. The
     Watchfire note: at Watchfire Heat 7 or higher (`fromHeat`), a hashtag
     source the crew has never angered starts at Heat 1 (`startsAt`). */
  // GMH p117
  gmOnly: [
    { key: "watchfire", name: "GM only: the Watchfire's Heat.", source: "watchfire", fromHeat: 7, startsAt: 1,
      text: "Heat with the Watchfire is Heat with Octothorpe's hunters, though nobody in the crew knows it. At Heat 7 or higher, a hashtag source the crew has never angered (#PRINT, #MINT, #REACH, #GRID) starts climbing the ladder too, at Heat 1, for no reason anyone can find." },
    { key: "octothorpe", name: "GM only: Octothorpe.",
      text: "Octothorpe never generates Heat of its own. It doesn't have to. A crew with high Heat from any of the hashtags (#GRID, #PRINT, #MINT, #REACH) is leaning on one company through four doors, and those sources climb the ladder faster than they should: a #PRINT that stops existing, an account the #MINT has never heard of, an ambulance that doesn't come." }
  ],
  hashtags: ["#PRINT", "#MINT", "#REACH", "#GRID"],

  /* THE BOUNTY. Posted when a source reaches Heat 9 (`postsAt`), priced per
     Freelancer as a Solo of the Grade matching their Caliber at perXpLow to
     perXpHigh Glimmer per XP, alive doubled. The table's XP column equals
     EN.threats Solo xpByGrade and EN.gmBook.payroll.xp.priceList's solo column;
     every printed range is that XP x 3 to x 5 (alive x 2). It comes down when
     the source pulls it, the source's Heat falls below 7 (`endsBelow`), or
     someone pays the Exchange the full kill price (`cancel`). The lawyers'
     fee is not printed; the flaw buys a week. */
  // GMH p117
  bounty: {
    name: "The Bounty",
    text: "The moment a source reaches Heat 9, its own people stop being enough, and it starts spending money. It posts a Bounty on the Hazard Contractors' Exchange: open to any rated Freelancer, priced in public, with the crew's faces on the posting. The Exchange takes its cut and asks no questions. That's its whole business.",
    postsAt: 9,
    price: { name: "The price.",
      text: "Price each Freelancer the way Paying the Crew prices any Bounty, 𝒢3 to 𝒢5 per XP, treating them as a Solo of the Grade that matches their Caliber. A Freelancer with Heat 9 is a problem the source budgets like a monster. Breathing delivery doubles it." },
    perXpLow: 3, perXpHigh: 5,
    aliveMult: 2,
    columns: ["FREELANCER'S CALIBER", "COUNTS AS", "BOUNTY (KILL)", "BOUNTY (ALIVE)"],
    rows: [
      { caliber: 1, countsAs: "G1 Solo (400 XP)", grade: 1, xp: 400,
        kill: "𝒢1,200 to 2,000", killLow: 1200, killHigh: 2000,
        alive: "𝒢2,400 to 4,000", aliveLow: 2400, aliveHigh: 4000 },
      { caliber: 2, countsAs: "G2 Solo (600 XP)", grade: 2, xp: 600,
        kill: "𝒢1,800 to 3,000", killLow: 1800, killHigh: 3000,
        alive: "𝒢3,600 to 6,000", aliveLow: 3600, aliveHigh: 6000 },
      { caliber: 3, countsAs: "G3 Solo (1,000 XP)", grade: 3, xp: 1000,
        kill: "𝒢3,000 to 5,000", killLow: 3000, killHigh: 5000,
        alive: "𝒢6,000 to 10,000", aliveLow: 6000, aliveHigh: 10000 },
      { caliber: 4, countsAs: "G4 Solo (1,400 XP)", grade: 4, xp: 1400,
        kill: "𝒢4,200 to 7,000", killLow: 4200, killHigh: 7000,
        alive: "𝒢8,400 to 14,000", aliveLow: 8400, aliveHigh: 14000 },
      { caliber: 5, countsAs: "G5 Solo (1,800 XP)", grade: 5, xp: 1800,
        kill: "𝒢5,400 to 9,000", killLow: 5400, killHigh: 9000,
        alive: "𝒢10,800 to 18,000", aliveLow: 10800, aliveHigh: 18000 }
    ],
    after: [
      "Past 𝒢5,000 a bounty crosses into Nexus territory (Paying the Crew), and so does the attention that comes with it.",
      "Corporate sources usually post alive-only. They have questions, and recovery teams."
    ],
    nexusAbove: 5000,
    whoTakesIt: { name: "Who takes it.",
      text: "Rival crews, mostly, and some of them are people the crew has worked with. Build a taker as a rival crew (Enemy Freelancers and Named Rivals), and let the crew hear about them first: a Ringer who sold the crew's address, a fixer who won't meet their eyes, a familiar van parked across the street. Once the Bounty is up, every Heat check against that source also brings whoever has taken it." },
    takersEveryCheck: true,
    takingItDown: { name: "Taking it down.",
      text: "The posting stays up until the source pulls it, the source's Heat falls below 7, or someone pays the Exchange to cancel it. Cancelling costs the full kill price, paid by the crew or by someone who owes them a great deal. The Exchange's lawyers can also find a flaw in the posting, for a fee, which buys a week." },
    endsBelow: 7,
    cancel: "kill",
    flawFee: null,
    flawBuys: "a week"
  },

  /* COOLING OFF. Six ways down, as the book prices them. `drop` is the Heat
     it takes off as {low, high} (the same number twice when the page prints
     one); a Legal scrub drops `flawlessDrop` on a Flawless Success; A bigger
     fish takes `upToHalf` the source's Heat and prints no fixed number. Lie
     low works on every source (`allSources`) and only after a month whose
     Heat check came up empty (`ifQuiet`). The bribe tiers between Petty Grease
     and Career-Ending Money, the data scrub service, and legal help are
     priced in the PHB's Economy and Rewards, whose Services and Bribes prices
     the app does not carry (EN.economy lists them as not modelled; the Codex's
     Economy & Rewards, ref-economy, holds the rest of the chapter). */
  // GMH p118
  cooling: {
    name: "Cooling Off",
    intro: "The PHB lists the ways Heat comes down: quiet Downtime (1 per month, at your discretion), a data scrub, a bribe, a legal scrub, a faction or contact who clears the record, and a bigger fish. Here's how to price them so the crew can plan around it.",
    columns: ["METHOD", "WHAT IT COSTS", "WHAT IT DOES"],
    rows: [
      { key: "lieLow", name: "Lie low",
        costs: "A month of Downtime with no jobs, no noise, and lifestyle paid",
        does: "1 Heat with every source, if the Heat check that month came up empty",
        drop: { low: 1, high: 1 }, allSources: true, ifQuiet: true },
      { key: "dataScrub", name: "Data scrub",
        costs: "A quiet data scrub, 𝒢750 to 𝒢3,000 (Economy and Rewards)",
        does: "1 Heat with a source that runs on records: the precinct, a corp, a hashtag",
        drop: { low: 1, high: 1 }, costLow: 750, costHigh: 3000 },
      { key: "bribe", name: "Bribe",
        costs: "The bribe tier that matches the band: Petty Grease at Heat 1 to 2, up to Career-Ending Money at 9 to 10",
        does: "1 Heat with that source, if the person taking it believes they can survive the risk",
        drop: { low: 1, high: 1 }, tierLow: "Petty Grease", tierHigh: "Career-Ending Money" },
      { key: "legalScrub", name: "Legal scrub",
        costs: "Public legal help or private counsel (Economy and Rewards), and a Sit-Down",
        does: "Win the Sit-Down and Heat with an institutional source drops by 1, or by 2 on a Flawless Success",
        drop: { low: 1, high: 1 }, flawlessDrop: 2, sitDown: true },
      { key: "intervention", name: "Intervention",
        costs: "A favor from someone with Cred where it counts",
        does: "1 to 3 Heat, at the price of a Debt the crew will be asked to pay",
        drop: { low: 1, high: 3 }, debt: true },
      { key: "biggerFish", name: "A bigger fish",
        costs: "Someone else's problem, louder than the crew's",
        does: "Up to half the source's Heat, while the bigger fish lasts",
        drop: null, upToHalf: true }
    ],
    after: [
      "Two cautions. Bribes and scrubs are opportunities for a Mixed Result: the record is cleared and someone now has a copy. And Heat with a gang or a shrine rarely responds to money. Gangs want respect, restitution, or a favor. Shrines want amends, made in person, at the shrine that knows the spirit's name.",
      "The crew can make their own bigger fish. That's a job, and a dangerous one, and exactly the kind of thing that earns Heat somewhere else."
    ],
    moneyRarelyWorks: ["gang", "shrine"]   // By Source keys: "Heat with a gang or a shrine rarely responds to money"
  }
};
