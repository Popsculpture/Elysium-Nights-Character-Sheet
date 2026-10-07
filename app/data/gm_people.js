/* ===========================================================================
   ELYSIUM NIGHTS · NPC Quick-Build  (GM Toolkit)
   A transcription of the Game Master's Handbook, NPC Quick-Build (PDF pages
   43 to 51): People Who Aren't in Initiative, the Contact Card and its seven
   lines, the worked example (Mags Tull), Resolve by Role, Their Profile of
   You (d12), the five species name tables and Street Handles. RULES ONLY:
   nothing here is computed. The contacts themselves live in the GM bag
   `contacts`; the People tab (js/gm_people.js) reads this file.

   Every `text` is the book's wording with PDF line breaks rejoined, and the
   currency glyph is the book's own (Glimmer U+1D4A2). Section titles are
   printed in capitals on the page; they are carried here in title case. Each
   row's number is printed to the left of its row (checked against the page
   images; the text extraction keeps it first).

   NAME TABLE STRUCTURE (checked against the page images, pp46 to 50). Every
   species table is printed as ONE d20 column keying rows of two cells: a d20
   pair. One roll reads one printed row and gives both cells. The book prints
   no second die and no instruction to roll each column on its own; its only
   other way in is "read down the column until one sounds like somebody's
   aunt" (names.intro), which is picking, not a second roll. On the Outsiders
   table the second cell is not a name but where the name came from, so that
   row can never be split (`explains: true`). Street Handles is a plain d20
   list of single cells, printed as two side-by-side halves (1 to 10 on the
   left, 11 to 20 on the right, each half with its own D20 heading); it is
   still one d20 over twenty handles, carried here in d20 order.

   APP LINKS (not book text, they change no rule):
     names.tables[].speciesKey  the EN.species key of that species
     names.tables[].template    the `species` of its EN.bestiary.speciesTemplates
                                entry (null for Humans, who need no template)
     names.tables[].combine     how the roller shows a rolled row, read from the
                                table's own intro: "joined" (one name, first cell
                                then second: "Mags Tull", "Quietroot of the
                                Ninth Stack"), "apart" (two names used in different
                                company: Clankers' formal and trusted names), or
                                "explained" (the first cell is the name, the
                                second is its story: Outsiders)
     card.lines[].field         the key a contact record uses for that line

   Page references (// GMH pNN) are PDF page numbers of the handbook; the folio
   printed on each page runs 4 lower. User-facing text carries no page numbers.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {}; EN.gmBook = EN.gmBook || {};

EN.gmBook.people = {
  schemaVersion: 1,

  // GMH p43
  title: "NPC Quick-Build",

  // GMH p43
  notInInitiative: {
    title: "People Who Aren't in Initiative",
    paragraphs: [
      "Most of the people the crew meets will never roll Initiative. The bartender who knows which booth is wired. The claims agent who loses a form for 𝒢50. The Local 9 steward who remembers your face from the memorial and hasn't decided yet whether that's good news. These people move more jobs than guns do, and they show up mid-scene, when the GM has about four seconds to make them real.",
      "Four seconds is enough for a name, a job, and a want. Everything else can wait until they matter twice.",
      "That's the contact card. It fits on an index card, and it is built to be written in pencil."
    ]
  },

  /* THE CONTACT CARD. Seven lines in the book's order; `walkOn` marks the
     first three, all a walk-on needs. `field` is the contact record key (an
     app link). The Name line also asks for the #PRINT name when it differs,
     so a record carries `print` beside `name`. The Resolve line is written
     as the threat blocks write it, "5 (Standard)" (see resolveByRole). */
  // GMH p43
  card: {
    title: "The Contact Card",
    intro: "Seven lines, in this order. A walk-on needs only the first three. Fill in the rest the second time someone matters.",
    walkOnCount: 3,
    columns: ["Line", "What It Holds"],
    lines: [
      { field: "name",    line: "Name",    walkOn: true,
        holds: "What people call them. Add what their #PRINT says if it's different." },
      { field: "work",    line: "Work",    walkOn: true,
        holds: "What they do and where, in one line: \"night clerk, Tollgate customs annex.\"" },
      { field: "want",    line: "Want",    walkOn: true,
        holds: "Something they would trade for this week. Make it concrete: a transfer, a missing cousin, a quiet month." },
      { field: "fear",    line: "Fear",    walkOn: false,
        holds: "What makes them fold, lie, or make a call." },
      { field: "resolve", line: "Resolve", walkOn: false,
        holds: "Tier and number from the Sit-Down rules. See Resolve by Role, below." },
      { field: "profile", line: "Their Profile of You", walkOn: false,
        holds: "One Profile this NPC holds of the crew. See Their Profile of You, below." },
      { field: "tell",    line: "Tell",    walkOn: false,
        holds: "One physical habit the players will recognize the next time they walk in." }
    ],
    // Into and out of initiative: the Resolve line carries across both ways.
    promote: "A contact who ends up in initiative becomes a threat: build the block from Threats and carry the Resolve line across unchanged.",
    fromThreat: "A threat the crew talks down instead of shooting can pick up a card the same way."
  },

  /* THE EXAMPLE, printed as a filled card. `name` and `print` are the Name
     line split at the book's parenthesis; `resolve` is the line as printed
     (without its closing period), `resolveTier` and `resolveValue` the same
     line as data, and `profileN` the d12 row of its Profile. */
  // GMH p44
  example: {
    key: "mags",
    name: "Marguerite \"Mags\" Tull",
    print: "Margaret Tull-Ansel, divorced eleven years, never updated",
    work: "Night claims agent, Ferrymark district claims office.",
    want: "Two more years without an audit, then a pension.",
    fear: "The nightly reconcile flagging her stamp twice in one week.",
    resolve: "5 (Standard)",
    resolveTier: "standard",
    resolveValue: 5,
    profile: "Good for It",
    profileN: 3,
    tell: "Peels the corner off every form she touches. Nobody has ever seen her read one, and she has never once been wrong about what was in it."
  },

  /* RESOLVE BY ROLE. The Sit-Down's Opposition Tiers (the player reference in
     js/face.js prints the same five numbers with other example people). Each
     tier carries the printed cell (`who`) and the same cell split into its
     example roles (`roles`, 27 in all), for a searchable role list. `resolve`
     is the printed number as text; `value` is it as a number, with `orMore`
     true for Apex's "16+". `write` is how the book says to write the line. */
  // GMH p44
  resolveByRole: {
    title: "Resolve by Role",
    intro: "Resolve uses the Opposition Tiers from the Sit-Down rules, unchanged. The table below is a shortcut: find the closest job, take its tier, and write it as the threat blocks do, \"Resolve 5 (Standard).\"",
    write: "Resolve 5 (Standard).",
    columns: ["Tier", "Resolve", "Who Sits Here"],
    tiers: [
      { key: "pushover", tier: "Pushover", resolve: "3", value: 3, orMore: false,
        who: "A night clerk at the end of a double. A Sump Rat lookout. A courier who only wants a signature. A volunteer sweeping a Small Altar. A Void Port baggage handler.",
        roles: [
          "A night clerk at the end of a double.",
          "A Sump Rat lookout.",
          "A courier who only wants a signature.",
          "A volunteer sweeping a Small Altar.",
          "A Void Port baggage handler."
        ] },
      { key: "standard", tier: "Standard", resolve: "5", value: 5, orMore: false,
        who: "A bartender who owns the bar. A claims agent. A Guild steward. A precinct desk sergeant. A Ferryman with a full boat. A Neon Market stall boss. An assayer at a public orb.",
        roles: [
          "A bartender who owns the bar.",
          "A claims agent.",
          "A Guild steward.",
          "A precinct desk sergeant.",
          "A Ferryman with a full boat.",
          "A Neon Market stall boss.",
          "An assayer at a public orb."
        ] },
      { key: "hardened", tier: "Hardened", resolve: "8", value: 8, orMore: false,
        who: "A Guild dispatcher. A Ringer lieutenant. A Homeward shift supervisor. The keeper of a founding lamp. A fence with three crews on retainer. A Kindred recovery lead.",
        roles: [
          "A Guild dispatcher.",
          "A Ringer lieutenant.",
          "A Homeward shift supervisor.",
          "The keeper of a founding lamp.",
          "A fence with three crews on retainer.",
          "A Kindred recovery lead."
        ] },
      { key: "iron", tier: "Iron", resolve: "12", value: 12, orMore: false,
        who: "A Kindred regional director. A seat on the Exchange's board. The chair of Local 9. An X-Calibur recruiter. A Crown Heights fixer who takes meetings in the Arcology.",
        roles: [
          "A Kindred regional director.",
          "A seat on the Exchange's board.",
          "The chair of Local 9.",
          "An X-Calibur recruiter.",
          "A Crown Heights fixer who takes meetings in the Arcology."
        ] },
      { key: "apex", tier: "Apex", resolve: "16+", value: 16, orMore: true,
        who: "The head of a Guild. A gang's founder. A corporate division head. Anyone whose name is on the building.",
        roles: [
          "The head of a Guild.",
          "A gang's founder.",
          "A corporate division head.",
          "Anyone whose name is on the building."
        ] }
    ],
    // Moving a contact off its role's tier: write the reason down (a "moved because" note).
    moving: "The role is where the number starts, not where it has to stay. A desk sergeant three weeks from retirement might sit at Pushover. A clerk whose sister is in Kindred's debt might sit at Hardened, because she has more to lose than the job suggests. Write down the reason when you move someone; it's usually their Fear.",
    movingReason: "Write down the reason when you move someone; it's usually their Fear.",
    /* Weak spots: `kinds` are the two rulings the text allows, double
       Pressure from one Approach or none from another. The Approaches
       themselves are the Sit-Down's (the player reference in js/face.js lists
       them; Insight deals no Pressure there). */
    weakSpots: {
      text: "Weak spots work as the PHB's Vulnerabilities and Resistances describe: the GM may rule that a contact takes double Pressure from one Approach or none from another. Put it on the card when you decide it, so the next GM (or next month's you) remembers.",
      kinds: ["double", "none"]
    }
  },

  /* THEIR PROFILE OF YOU. A d12, or pick one. `name` is the Profile and
     `heard` the rumor behind it. `earned` are the four Profiles the PHB
     names that are never rolled. */
  // GMH p45
  profiles: {
    title: "Their Profile of You",
    intro: "Every recurring contact starts with one Profile of the crew, before the crew has done a thing in front of them. Nobody meets anyone fresh in Elysium. The claims agent has seen your name on a form. The bartender heard about the Tollgate job from someone who wasn't there. The first Profile is the rumor that got through the door ahead of you.",
    prompt: "Pick one, or roll a d12:",
    die: "d12",
    sides: 12,
    columns: ["d12", "Profile", "What They've Heard"],
    rows: [
      { n: 1,  name: "Reliable",      heard: "You showed up when you said you would, at least once, for someone who talks." },
      { n: 2,  name: "Useful",        heard: "You solved a problem for a friend of theirs and didn't ask what it was." },
      { n: 3,  name: "Good for It",   heard: "You pay. Late, sometimes, but you pay." },
      { n: 4,  name: "Connected",     heard: "You know somebody, and they would rather not find out who." },
      { n: 5,  name: "Soft",          heard: "You let someone walk who shouldn't have. Word gets around." },
      { n: 6,  name: "Off the Books", heard: "You don't show up on anything they can pull. That's either a comfort or a warning." },
      { n: 7,  name: "Desperate",     heard: "You've been asking around for work, and asking too fast." },
      { n: 8,  name: "Pushy",         heard: "Last time someone dealt with you, it ran long and ended loud." },
      { n: 9,  name: "Bought",        heard: "Someone says you're on a corporation's leash. Maybe it's true." },
      { n: 10, name: "Difficult",     heard: "You're the crew that renegotiates in the parking garage." },
      { n: 11, name: "Dangerous",     heard: "There's a story about you and a stairwell. It grows every time it's told." },
      { n: 12, name: "Under Watch",   heard: "Somebody with a badge has asked about you. They don't want to be standing near it." }
    ],
    earned: {
      text: "The PHB's other examples (Owes Us, Unprofessional, Corporate Friendly, Shrine Touched) need a cause, so they're earned in play rather than rolled.",
      names: ["Owes Us", "Unprofessional", "Corporate Friendly", "Shrine Touched"]
    },
    howItWorks: "A starting Profile works like any other: it tells the table how the room feels, gives the GM a hook, and may grant Edge or Snag in scenes with that contact. It changes when the fiction changes it. It is the contact's own, separate from whatever their faction or Guild holds, and the two are allowed to disagree. Mags thinks you're Good for It. Her supervisor has the file that says Under Watch."
  },

  /* NAMES. Five species tables, each a d20 pair (see the header): `columns`
     are the two printed cell headings in order, and each row is
     { n, a, b } with `a` the first cell and `b` the second, exactly as
     printed (Verdine growth names carry their own "of"; Chimera clutch names
     their own "the"). `pair: true` on every species table: one d20 reads
     one row. */
  names: {
    // GMH p45
    title: "Names",
    intro: [
      "A name is the first thing the players will write down, so it should sound like the city: migrant, patched, half-official, and usually carrying a second name for work. Roll on the species table, or read down the column until one sounds like somebody's aunt.",
      "Most people on the job also answer to a street handle (see the last table). The handle is what gets said on a channel. The name is what gets said at a funeral."
    ],
    die: "d20",
    sides: 20,
    tables: [
      // GMH p46
      { key: "humans", name: "Humans", speciesKey: "humans", template: null,
        pair: true, combine: "joined", explains: false,
        intro: "Human names are the residue of every migration that ever ended in Elysium. A given name from one grandparent, a family name from another, a hyphen where a marriage or a corporate adoption stuck. The #PRINT often lags the person by a divorce or two.",
        columns: ["Given Name", "Family Name"],
        rows: [
          { n: 1,  a: "Mags",    b: "Tull" },
          { n: 2,  a: "Teodor",  b: "Okonkwo-Reyes" },
          { n: 3,  a: "Inés",    b: "Brannock" },
          { n: 4,  a: "Kofi",    b: "Vasquez" },
          { n: 5,  a: "Wren",    b: "Lindqvist" },
          { n: 6,  a: "Dasha",   b: "Achterberg" },
          { n: 7,  a: "Ruben",   b: "Mbatha" },
          { n: 8,  a: "Priya",   b: "Ferro" },
          { n: 9,  a: "Callum",  b: "Halloran" },
          { n: 10, a: "Noor",    b: "Szabo" },
          { n: 11, a: "Jun",     b: "Nakamura-Pike" },
          { n: 12, a: "Odette",  b: "Delaune" },
          { n: 13, a: "Bastian", b: "Oduya" },
          { n: 14, a: "Lupe",    b: "Petrov" },
          { n: 15, a: "Ezra",    b: "Castellane" },
          { n: 16, a: "Saoirse", b: "Abara" },
          { n: 17, a: "Tomasz",  b: "Quill" },
          { n: 18, a: "Hollis",  b: "Morrow" },
          { n: 19, a: "Amara",   b: "Kaur-Bell" },
          { n: 20, a: "Yusuf",   b: "Sandoval" }
        ] },

      // GMH p47
      { key: "verdine", name: "Verdine", speciesKey: "verdine", template: "Verdine",
        pair: true, combine: "joined", explains: false,
        intro: "The PHB sets the convention: a Growth Name marks site, strain, or grove, and a Chosen Name reflects appearance, function, deed, or aspiration. In the city the Chosen Name comes first and the Growth Name follows with \"of,\" the way a return address follows a letter. Verdine from groves lost in the Concrete Purge often keep the dead grove's name. Nobody asks them to stop.",
        columns: ["Chosen Name", "Growth Name"],
        rows: [
          { n: 1,  a: "Quietroot",    b: "of the Ninth Stack" },
          { n: 2,  a: "Rainledger",   b: "of Sedge Channel" },
          { n: 3,  a: "Mend",         b: "of the Hollow Bend Pilings" },
          { n: 4,  a: "Tallow",       b: "of Filter Row" },
          { n: 5,  a: "Holdfast",     b: "of the Burnt Lab" },
          { n: 6,  a: "Brightscar",   b: "of Greenwall Six" },
          { n: 7,  a: "Patience",     b: "of the Saltmarsh Strain" },
          { n: 8,  a: "Undertow",     b: "of Runoff Grove" },
          { n: 9,  a: "Sorrel",       b: "of the Old Cistern" },
          { n: 10, a: "Lantern",      b: "of Harborline Kelp" },
          { n: 11, a: "Keeper",       b: "of the Undercity Bloom" },
          { n: 12, a: "Second Bloom", b: "of Switchyard Moss" },
          { n: 13, a: "Gall",         b: "of Strain 41" },
          { n: 14, a: "Thistledown",  b: "of the Quiet Sump" },
          { n: 15, a: "Sapwood",      b: "of the Ninefold Mycel" },
          { n: 16, a: "Verity",       b: "of Ash Lot" },
          { n: 17, a: "Rust-Eater",   b: "of the Rooftop Grove" },
          { n: 18, a: "Grafting",     b: "of the Drowned Orchard" },
          { n: 19, a: "Wick",         b: "of Synth Flats Runoff" },
          { n: 20, a: "Stillwater",   b: "of the Tenth Street Median" }
        ] },

      // GMH p48
      { key: "clankers", name: "Clankers", speciesKey: "clankers", template: "Clanker",
        pair: true, combine: "apart", explains: false,
        intro: "Also PHB convention: formal names begin as model tags, serial numbers, batch labels, or the nicknames a shift crew gave the machine before anyone knew someone was inside. Trusted names are street handles, and choosing one is a declaration. Use the formal name for paperwork and for people who haven't earned better. A Clanker who hears their serial from a friend knows exactly what it means.",
        columns: ["Formal Name", "Trusted Name"],
        rows: [
          { n: 1,  a: "LF-2210",                   b: "Sundown" },
          { n: 2,  a: "DB Mk IV, Lot 0381",        b: "Parity" },
          { n: 3,  a: "Concierge 9",               b: "Mrs. Kettle" },
          { n: 4,  a: "Unit 14 (Dock C)",          b: "Overtime" },
          { n: 5,  a: "Forklift Jerry",            b: "Sixpence" },
          { n: 6,  a: "Asset 7731-B",              b: "Chorus" },
          { n: 7,  a: "Big Blue",                  b: "Halfstep" },
          { n: 8,  a: "Orderly 52",                b: "Ninety Days" },
          { n: 9,  a: "Patrol 0919",               b: "Saint Errol" },
          { n: 10, a: "Batch 88, Unit 3",          b: "Loudest" },
          { n: 11, a: "Model Tessa (discontinued)", b: "Ballast" },
          { n: 12, a: "Greeter 4, Void Port",      b: "Mercy Rule" },
          { n: 13, a: "SN 4471-0021-A",            b: "Ticket" },
          { n: 14, a: "Line Worker 61",            b: "Grace Period" },
          { n: 15, a: "\"The New One\"",           b: "Spare" },
          { n: 16, a: "Sanitation Frame 12",       b: "Juniper" },
          { n: 17, a: "Sentinel, Lot 7",           b: "Idle" },
          { n: 18, a: "Hostess Unit Iris",         b: "Lullaby" },
          { n: 19, a: "Pallet King",               b: "Whetstone" },
          { n: 20, a: "Recall Notice 2209",        b: "Encore" }
        ] },

      // GMH p49
      { key: "chimera", name: "Chimera", speciesKey: "chimera", template: "Chimera",
        pair: true, combine: "joined", explains: false,
        intro: "A personal name short enough to shout down a tunnel, and a clutch name that says where you hold or what line you run. Courier lines name themselves after routes. Some clutches carry the old batch number their makers stamped on them, kept on purpose, the way a scar is kept. Outsiders to the clutch get the personal name. The clutch name is offered, not asked for.",
        columns: ["Personal Name", "Clutch Name"],
        rows: [
          { n: 1,  a: "Jassa",  b: "Longwire" },
          { n: 2,  a: "Teo",    b: "Low Tunnel" },
          { n: 3,  a: "Brisk",  b: "Seventh Clutch" },
          { n: 4,  a: "Kel",    b: "Redhold" },
          { n: 5,  a: "Ruuk",   b: "Saltrun" },
          { n: 6,  a: "Vane",   b: "Kettlemouth" },
          { n: 7,  a: "Ossie",  b: "the Ninety-Two" },
          { n: 8,  a: "Marrow", b: "Ashdown" },
          { n: 9,  a: "Tavi",   b: "Tollrun" },
          { n: 10, a: "Hesk",   b: "Highline" },
          { n: 11, a: "Lark",   b: "Brack" },
          { n: 12, a: "Dov",    b: "Drywell" },
          { n: 13, a: "Ysa",    b: "Gutter Crown" },
          { n: 14, a: "Grell",  b: "Cold Stair" },
          { n: 15, a: "Pim",    b: "Pilings" },
          { n: 16, a: "Sable",  b: "Halfmoon" },
          { n: 17, a: "Corra",  b: "Marrowgate" },
          { n: 18, a: "Fen",    b: "Burrow Six" },
          { n: 19, a: "Rook",   b: "Stilt Run" },
          { n: 20, a: "Wisk",   b: "the Batch Forty" }
        ] },

      // GMH p50
      { key: "outsiders", name: "Outsiders", speciesKey: "outsiders", template: "Outsider",
        pair: true, combine: "explained", explains: true,
        intro: "An Outsider's own name lives in frequencies, colors, or senses Elyndra doesn't have, so every one of them carries a city name too. They take it from whatever was in front of them: the first word anyone said to them, the landlady who didn't call a sweep, a line on the first form they were handed. Some pick something beautiful. Some keep the first thing that stuck, out of stubbornness or gratitude, and the difference isn't always visible from outside.",
        columns: ["City Name", "Where It Came From"],
        rows: [
          { n: 1,  a: "Tuesday",       b: "The day they arrived." },
          { n: 2,  a: "Receipt",       b: "The first paper anyone handed them." },
          { n: 3,  a: "Sorry",         b: "The first word anyone said to them." },
          { n: 4,  a: "Pending",       b: "Their status on every form since." },
          { n: 5,  a: "Nan Pernell",   b: "The landlady who hid them from a sweep. Borrowed with permission." },
          { n: 6,  a: "Mister Noodle", b: "A night-shift cook. Nobody has dared shorten it." },
          { n: 7,  a: "Overdraft",     b: "Chosen. They thought it sounded powerful." },
          { n: 8,  a: "Lucky Seven",   b: "A ticket stub in the first pocket they ever had." },
          { n: 9,  a: "Coupon",        b: "A Lonely Mouth flyer." },
          { n: 10, a: "Margin",        b: "A Harbinger's choice. They keep the house ledger." },
          { n: 11, a: "Exit",          b: "The first sign they could read." },
          { n: 12, a: "Hush",          b: "What their found family says when the others are sleeping." },
          { n: 13, a: "Gloam",         b: "The light they arrived in." },
          { n: 14, a: "Ember",         b: "A Cinder-Heart's nearest translation." },
          { n: 15, a: "Alder",         b: "The street where they first slept indoors." },
          { n: 16, a: "Vesper",        b: "A shrine bell they followed for a week." },
          { n: 17, a: "Second Shift",  b: "When they're awake." },
          { n: 18, a: "Postage",       b: "Arrived in a shipping container. Doesn't talk about it." },
          { n: 19, a: "Small Hours",   b: "A Grinling's choice. It's a joke, and it isn't." },
          { n: 20, a: "Rerun",         b: "Has been told they remind people of someone." }
        ] }
    ]
  },

  /* STREET HANDLES. One d20 over twenty single handles, for any species.
     Printed as two halves side by side (`printedHalves`: 1 to 10, then 11 to
     20); `pair: false` because a row holds one handle, not two cells. */
  // GMH p51
  handles: {
    title: "Street Handles",
    intro: "For anyone, any species. A handle is chosen, given, or stuck with, and the best ones are the second kind.",
    die: "d20",
    sides: 20,
    pair: false,
    printedHalves: [[1, 10], [11, 20]],
    rows: [
      { n: 1,  text: "Glass" },
      { n: 2,  text: "Two-Tone" },
      { n: 3,  text: "Lowball" },
      { n: 4,  text: "Overpass" },
      { n: 5,  text: "Kite" },
      { n: 6,  text: "Blackout" },
      { n: 7,  text: "Coin" },
      { n: 8,  text: "Halflight" },
      { n: 9,  text: "Cold Brew" },
      { n: 10, text: "Fine Print" },
      { n: 11, text: "Second Opinion" },
      { n: 12, text: "Lockjaw" },
      { n: 13, text: "Paperweight" },
      { n: 14, text: "Sparrow" },
      { n: 15, text: "Deadline" },
      { n: 16, text: "Fuse" },
      { n: 17, text: "Ricochet" },
      { n: 18, text: "Tinsel" },
      { n: 19, text: "Gutterball" },
      { n: 20, text: "Last Call" }
    ]
  }
};
