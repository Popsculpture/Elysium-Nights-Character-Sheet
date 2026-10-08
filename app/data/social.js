/* ===========================================================================
   ELYSIUM NIGHTS · Social Pressure and Faction Standing
   A transcription of the rulebook chapter of that name, for the Codex chapter
   "Social Pressure & Faction Standing" (js/codex_social.js), and the one copy the
   Social tab (js/face.js) and the GM's Scenes and People data can read.

   SOURCE: Part 2 - Core Rules, Combat, Survival, & Specialized Systems
   (modifiedTime 2026-10-04T07:31:16.171Z), the chapter "Social Pressure and
   Faction Standing", every section in the book's order:
     Core Concepts · Friction (Building the Pool) · Approach · Stakes · Sway ·
     Margins and Outcomes (Profiles) · Debt · Faction Standing · Social Pressure
     States · Social Fallout · The Sit-Down (Optional) · The Frame · Setting
     Resolve · Pressure · Vulnerabilities and Resistances · When Resolve Breaks
     (Rounds and Plays) · Postures · Environmental Pressure (Sit-Down
     Conditions) · Cred and Heat (Optional) · What Cred Is · What Heat Is · How
     They Shift · Mechanical Effects · Using Cred and Heat Together · Examples in
     Play (with the Sit-Down Example: The Deposition) · GM Guidance · Gameplay
     Summary: Social Pressure and Faction Standing.

   Every `text` is the book's wording, with the export's backslash escapes
   removed and **bold** / *italic* kept where the book marks a term inside a
   sentence. A bold run-in that leads a paragraph is carried as `name`, the rest
   of the paragraph as `text`. Numbers the book prints are carried as numbers
   beside the text they came from (`resolve`, `pressure`, `min`, `max`), so a
   screen can compute with one and show the other.

   APP FIELDS, not book text (they change no rule): `key` on every row; `label`
   on the Cred and Heat ladder rows (the lead words of the book's own meaning,
   for a tracker that needs a short name per value); `orMore` on Apex's "16+".

   The Core Resolution chapter's Social Consequences (Social Cost Options, the
   Social Fallout Rule, Fatigue vs Strain vs Social Fallout) are EN.resolution.social
   and EN.resolution.costTracks, not repeated here. The GM Heat ladder
   (EN.gmBook.heat) is the Game Master's Toolkit's own and stays separate.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.social = {
  schemaVersion: 1,
  name: "Social Pressure and Faction Standing",

  intro: "Some jobs in Elysium end in gunfire. More of them end in a room. Two chairs, two cups of something cooling, two people working different angles on the same problem until one of them gives ground. The room has rules. The rules are not written down anywhere, and breaking them costs more than blood.",

  /* ---- Core Concepts -------------------------------------------------------- */
  coreConcepts: [
    { key: "socialPressure", term: "Social Pressure", text: "The tension created by negotiation, reputation, sway, obligation, exposure, and faction scrutiny." },
    { key: "approach", term: "Approach", text: "The method a Character uses to push: Persuasion, Intimidation, Performance, Deception, or Insight." },
    { key: "resolve", term: "Resolve", text: "The target's social HP. Reduces through pressure. When it hits 0, they break." },
    { key: "profile", term: "Profile", text: "A short narrative label describing how a person, office, district, or faction currently sees you." },
    { key: "debt", term: "Debt", text: "A favor, payment, obligation, or future service owed by one side to another. See the Economy chapter." },
    { key: "factionStanding", term: "Faction Standing", text: "A faction's current posture toward the crew: Allied, Friendly, Neutral, Wary, Hostile." },
    { key: "pressureState", term: "Pressure State", text: "The current state of a long-running relationship: Open, Strained, Locked." },
    { key: "cred", term: "Cred", text: "Your numerical standing within a specific community or scene." },
    { key: "heat", term: "Heat", text: "Hostile attention from authorities, rivals, or burned bridges." },
    { key: "socialFallout", term: "Social Fallout", text: "The lasting consequence of a social action: scrutiny, worsened terms, lost face, a faction shift, a Profile earned." }
  ],

  /* The three depths. `name` is the bold run-in that leads each paragraph. */
  depthsLead: "This chapter handles social conflict at three depths.",
  depths: [
    { key: "friction", name: "Friction", text: "is always on: a roll, a margin, a consequence the table can track on the back of a napkin. Use it for every social scene that matters." },
    { key: "sitDown", name: "The Sit-Down", text: "treats a big negotiation, interrogation, or trial like a combat encounter, with rounds, plays, vulnerabilities, and a target who can be worn down until they break." },
    { key: "credHeat", name: "Cred and Heat", text: "tracks the long arcs of reputation and hostile attention across a campaign." }
  ],

  engages: {
    name: "When This System Engages",
    items: [
      "the scene has real stakes",
      "the outcome will leave a trace someone can find later",
      "the person across the table has power, memory, or institutional backing",
      "the conversation may shift reputation, debt, or faction posture"
    ],
    after: "Most conversations in Elysium don't clear that bar. A two-line haggle for cheap noodles isn't a system event. Use this when the outcome will matter to someone tomorrow.",
    fit: "Use what fits the scene. A bartender shaking down a Freelancer for an overdue tab needs nothing more than Friction. A crew trying to crack a corporate witness across a six-hour deposition deserves the Sit-Down. The player who wants to know whether their Fury is famous in the underground fight circuit yet wants Cred."
  },

  /* ---- Friction --------------------------------------------------------------- */
  friction: {
    text: "Every meaningful social roll the table makes, from a five-minute haggle with a fixer to a tense moment at a corporate gala. Build a pool, find the margin, name the consequence. Move on.",
    pool: "Most meaningful social scenes run on the **Dice Pool Method**. Build the pool from the relevant Attribute and Skill, your Proficiency tier, any tools or preparation in play, sway gathered through legwork, and whatever Edge or Snag the room hands you. Resolve normally.",
    d20: "In combat or under hard time pressure, social rolls drop to the **d20 Method**. Same approach, faster math."
  },

  /* ---- Approach --------------------------------------------------------------- */
  approach: {
    text: "Every social roll has an **Approach**. The Approach is what the Character is actually doing to move the other side. It selects the Skill and the Attribute, and it tells the GM how the scene is being played.",
    columns: ["Approach", "Skill", "Common Attributes", "What It Does"],
    rows: [
      { key: "persuasion", name: "Persuasion", skill: "Persuasion", attributes: "Charm, Wits", text: "Warmth, reason, rapport, appeals to mutual interest. The long game." },
      { key: "intimidation", name: "Intimidation", skill: "Intimidation (Versatile)", attributes: "Body, Wits, Tech, Mystique, Charm", text: "Threat, weight, presence. Make them flinch first." },
      { key: "performance", name: "Performance", skill: "Performance (Versatile)", attributes: "Charm, Agility, Body, Mystique", text: "Theater, distraction, rallying an audience, controlling tone." },
      { key: "deception", name: "Deception", skill: "Deception", attributes: "Charm, Wits", text: "Misdirection, false flags, slipping past their guard." },
      { key: "insight", name: "Insight", skill: "Insight (Versatile)", attributes: "Any", text: "Reading the room, finding the lever, setting up the next push." }
    ],
    powerhouses: "Charm and Mystique are the powerhouses here. They are built for this. But the system gives every Attribute a way in.",
    examples: "A Fury can use Body and Intimidation to make a fixer reconsider. A Codebreaker can use Tech and Intimidation to make a compliance officer realize how much of their life is already in the wrong hands. A Hustler can use Charm and Persuasion to do what Hustlers do. A Shaper can use Mystique and Performance to lean their resonance into the air until the room forgets how to breathe normally.",
    versatile: "The Skills chapter spells out how Versatile Skills bend to fit the method. The Approach is the bend.",
    insight: { name: "Insight as the Social Help Action", text: "Insight doesn't move Resolve and doesn't directly secure a concession. It sets up the next push. On a successful Insight roll, you grant Edge (or +1 Edge Die) to one ally's next social roll in the same scene." }
  },

  /* ---- Stakes and Sway ---------------------------------------------------------- */
  stakes: {
    text: "Before the roll, name what the Character wants and what the other side is protecting. A roll without stakes is a roll without consequence.",
    common: "Common stakes: access, permission, silence, information, a contract, a changed mind, a favor, an alibi, a delay, altered terms, a discount, a public outcome.",
    example: "A good social roll answers a real question. \"I persuade them\" is not a question. \"I'm convincing the warehouse manager to let us in tonight without flagging us in the morning report\" is."
  },
  sway: {
    text: "Sway gives the other side a reason to take your demands seriously.",
    sources: "Common sources: correct information you brought to the table, compromising proof, faction backing, prior favors you can call in, urgent timing on their end, credible threats, useful expertise, shared enemies, public sympathy, money or material support.",
    rule: "When a Character has real sway, grant **Edge** (or +1 Edge Die). When the other side has reason to distrust, dismiss, or expose them, impose **Snag** (or +1 Snag Die). Don't hand out sway for flavor. It must shift the room."
  },

  /* ---- Margins and Outcomes -------------------------------------------------------- */
  margins: {
    columns: ["Margin", "Result", "What Happens"],
    rows: [
      { key: "flawless", margin: "Flawless Success", result: "Total Win", text: "You get what you want and gain ground. A positive Profile, improved Faction Standing, future Edge with this target, or a bonus favor." },
      { key: "strong", margin: "Strong Success", result: "Solid Win", text: "You get what you want at a minor cost. A Concession, added Scrutiny, future Debt, partial visibility." },
      { key: "mixed", margin: "Mixed Result", result: "Yes, But", text: "You succeed with a real social cost. Choose one benefit and one cost from the Social Fallout table." },
      { key: "failure", margin: "Failure", result: "No, And", text: "You miss. You lose position, alienate the room, or worsen terms." },
      { key: "critical", margin: "Critical Failure", result: "Hard Burn", text: "The scene turns against you. Public embarrassment, surveillance, a strong Profile, a shift to Hostile posture, or a rival learning something they shouldn't have." }
    ]
  },

  /* ---- Profiles ---------------------------------------------------------------------- */
  profiles: {
    paragraphs: [
      "Nobody in Elysium keeps the same version of you. Every fixer, gang, precinct, and shrine that has reason to care builds their own out of what they have seen, heard, or been told. Some of these versions live in screens. Some live in the way a bartender's posture changes when you walk in. The ones that matter are the ones that change how the next conversation starts.",
      "A **Profile** is a short narrative label that captures how a specific person, office, district, or faction currently sees you. Each Profile does three things: it tells the table what the relationship feels like, gives the GM a concrete hook to pull on, and may grant Edge or Snag in future scenes with that source.",
      "Profiles are held by their source. The Profile a gang carries of you is not the same as the one the precinct has been quietly forming, and neither matches the version a fixer from two years ago still tells people about. Profiles are plural. You collect them. They contradict each other.",
      "The word carries weight in four directions, and Elysium uses all of them. A fixer's Profile of you is what she reads off your face across the table: how you walk in, what you laugh at, what you flinch from. A corporation's Profile is what its people say about you in the meeting after your name comes up: prior contracts, flagged behaviors, asset valuation, threat tier. A shrine's Profile is the resonance you carry into the room, the residue of every Current you have touched. The #GRID's Profile is what the recommender thinks you want, which becomes, over time, what the recommender thinks you are. Same word, four rooms."
    ],
    examples: ["Reliable", "Desperate", "Pushy", "Bought", "Useful", "Dangerous", "Unprofessional", "Connected", "Difficult", "Soft", "Owes Us", "Under Watch", "Good for It", "Off the Books", "Corporate Friendly", "Shrine Touched"],
    lasts: "A Profile lasts until the fiction changes it. A meaningful action can remove one. A later success can replace one. A long enough silence can fade one out. Profiles are not permanent. They should bite until they are addressed."
  },

  /* ---- Debt ----------------------------------------------------------------------------- */
  debt: {
    paragraphs: [
      "A **Debt** is an obligation created through negotiation, rescue, payment delay, or personal intervention. Debt is one of Elysium's primary currencies. The Economy chapter covers what debt looks like across a campaign and how it bites; this chapter covers how social scenes generate it.",
      "If a Character accepts a Debt as the cost of a social success, the success stands. The Debt becomes a future hook. Specify it. \"You owe me one\" is flavor. \"You owe me one, and I collect before the end of the month\" is the start of a scene."
    ]
  },

  /* ---- Faction Standing -------------------------------------------------------------------- */
  factionStanding: {
    intro: "Factions remember. Use the following posture track for the crew's relationship with any faction that matters across multiple scenes.",
    columns: ["Standing", "Meaning"],
    ladder: [
      { key: "allied", name: "Allied", text: "The faction actively helps, protects, or prioritizes you." },
      { key: "friendly", name: "Friendly", text: "Well-disposed, cooperative, open to favor." },
      { key: "neutral", name: "Neutral", text: "No special support or hostility. Just another variable." },
      { key: "wary", name: "Wary", text: "Suspicious, transactional, slower to trust." },
      { key: "hostile", name: "Hostile", text: "Obstructs, pressures, or actively moves against you." }
    ],
    start: "Most factions start at Neutral. A few may start Friendly or Wary based on the crew's history or Background ties. Standing shifts through completed contracts, betrayal, public embarrassment, exposed secrets, paid debts, broken promises, political damage, rescue, sacrifice, and major negotiation outcomes.",
    shifts: "A meaningful Mixed Result or Critical Failure may shift Standing one step worse. A Flawless Success in a major scene may shift it one step better. Don't shift Standing lightly. Use it when the scene would logically change how the faction treats the crew."
  },

  /* ---- Social Pressure States ----------------------------------------------------------------- */
  pressureStates: {
    intro: "When the same target, office, or faction stays relevant across scenes, track **Social Pressure** in three states.",
    columns: ["State", "Meaning"],
    states: [
      { key: "open", name: "Open", text: "Conversation proceeds normally." },
      { key: "strained", name: "Strained", text: "Trust is weakened. Terms are harsher. Future social rolls begin with +1 Snag Die." },
      { key: "locked", name: "Locked", text: "The relationship has stalled. New sway, a concession, or another avenue is required before further negotiation is possible." }
    ],
    shifts: "A meaningful Mixed Result may move a relationship from Open to Strained. A serious Failure or Critical Failure may push it Locked. A Flawless Success or a real act of repair can move it one step back toward Open. Use this for recurring patrons, bureaucratic clearance scenes, long interrogations, blackmail chains, faction diplomacy, criminal broker networks."
  },

  /* ---- Social Fallout -------------------------------------------------------------------------- */
  fallout: {
    intro: "When a social scene generates a cost, setback, or complication, pull from this list. Match the fallout to the fiction.",
    columns: ["Consequence", "Effect"],
    rows: [
      { key: "concession", name: "Concession", text: "You get the result, but give up a term, price, deadline, or condition." },
      { key: "debt", name: "Debt", text: "You owe the other side a favor, cut, payment, or service." },
      { key: "tippedHand", name: "Tipped Hand", text: "You reveal a motive, weakness, urgency, affiliation, or secret you wanted hidden." },
      { key: "scrutiny", name: "Scrutiny", text: "The scene attracts attention from observers, rivals, handlers, officials, or faction monitors." },
      { key: "profile", name: "Profile", text: "You gain a narrative label that affects future scenes." },
      { key: "factionShift", name: "Faction Shift", text: "A faction moves one step colder toward you." },
      { key: "lostFace", name: "Lost Face", text: "The result stands, but your standing slips. Future checks with this target suffer Snag until repaired." },
      { key: "complicationClause", name: "Complication Clause", text: "The agreement carries a hidden obligation, audit trigger, exclusivity term, or future claim." },
      { key: "burnedBridge", name: "Burned Bridge", text: "You get what you need now, but the relationship is finished." },
      { key: "publicTrace", name: "Public Trace", text: "Word spreads. A rumor or official note now follows you." }
    ],
    outro: "Friction is enough for most social scenes. What follows is for the scenes that earn more."
  },

  /* ---- The Sit-Down (Optional) ----------------------------------------------------------------- */
  sitDown: {
    name: "The Sit-Down",
    optional: true,
    intro: [
      "Some social scenes deserve the full treatment. A high-stakes negotiation with corporate counsel. An interrogation that decides whether the crew makes it out of the precinct. A confrontation with a faction patron who is two seconds from cutting all ties. A trial. A standoff at the gates of a shrine.",
      "In Elysium they call this a Sit-Down. The room, the chairs, the people across the table, the thing that will be decided before anyone gets up. Build it like a combat encounter. The opposition has Resolve. The crew has rounds to break it. The room itself can shift the math."
    ],
    frameLead: "A Sit-Down has:",
    frame: [
      { key: "stakes", name: "Stakes", text: "what is being fought over, what each side stands to lose" },
      { key: "floor", name: "The Floor", text: "the room, the timing, the audience, the witnesses, the environmental pressures" },
      { key: "opposition", name: "The Opposition", text: "the target or targets, what they want, what they fear" },
      { key: "rounds", name: "Rounds", text: "each Round, crew members declare Approaches, push, observe, support, or interfere" },
      { key: "resolve", name: "Resolve", text: "the target's social HP" }
    ],

    /* Setting Resolve. Apex prints "16+": `orMore`. */
    resolve: {
      intro: "The Opposition's Resolve depends on what they have to lose and how committed they are to their position.",
      columns: ["Opposition Tier", "Resolve", "Examples"],
      tiers: [
        { key: "pushover", name: "Pushover", resolve: 3, text: "3", orMore: false, examples: "A low-level clerk, a desperate informant, an exhausted shift worker" },
        { key: "standard", name: "Standard", resolve: 5, text: "5", orMore: false, examples: "A mid-tier fixer, a competent guard captain, a working journalist" },
        { key: "hardened", name: "Hardened", resolve: 8, text: "8", orMore: false, examples: "A faction lieutenant, a senior compliance officer, a veteran broker" },
        { key: "iron", name: "Iron", resolve: 12, text: "12", orMore: false, examples: "A corporate executive in their element, a faction patron, a high-end lawyer with a script" },
        { key: "apex", name: "Apex", resolve: 16, text: "16+", orMore: true, examples: "A faction head, an Icon-class public figure, an Apex executive with no reason to bend" }
      ],
      reset: "Resolve resets at the start of each separate social encounter. A target who broke yesterday will rebuild Resolve overnight unless the fiction explicitly says otherwise. People recover. That is part of what makes them dangerous."
    },

    /* Pressure. `pressure` is the number the Pressure Dealt cell leads with,
       `resolveGain` the Critical Failure's printed +1 Resolve. */
    pressure: {
      intro: "Each successful Approach against the Opposition deals **Pressure** equal to the success tier. Pressure reduces Resolve. When Resolve hits 0, the target breaks.",
      columns: ["Result", "Pressure Dealt"],
      results: [
        { key: "flawless", result: "Flawless Success", margin: "+3 or more", pressure: 3, resolveGain: 0, text: "3" },
        { key: "strong", result: "Strong Success", margin: "+1 to +2", pressure: 2, resolveGain: 0, text: "2" },
        { key: "mixed", result: "Mixed Result", margin: "0", pressure: 1, resolveGain: 0, text: "1, and the target picks one effect from the Social Fallout menu (see Social Pressure and Faction Standing) to apply to the Character" },
        { key: "failure", result: "Failure", margin: "-1 to -2", pressure: 0, resolveGain: 0, text: "0, and the Character may suffer Social Fallout" },
        { key: "critical", result: "Critical Failure", margin: "-3 or worse", pressure: 0, resolveGain: 1, text: "0, the target gains 1 Resolve, and the Character suffers strong Social Fallout" }
      ]
    },

    vulnerabilities: {
      name: "Vulnerabilities and Resistances",
      text: "Some targets are more vulnerable or resistant to particular Approaches. The GM may rule that a target's Resolve takes double Pressure from one Approach or no Pressure from another, based on who they are.",
      examples: [
        "A corporate executive may shrug off Body-driven Intimidation in a setting they control, then break fast under Wits-driven Persuasion that dismantles their position.",
        "A street boss might laugh off Tech-driven Intimidation but cave the moment a Fury steps forward without saying a word.",
        "A shrine elder might be untouched by money or threats but moved by Mystique-driven Performance that meets them on their own ground.",
        "A cynical journalist might resist Charm but yield to a Wits-driven Deception that hands them the story they were already trying to write."
      ],
      signal: "The GM should signal these vulnerabilities and resistances in play through fiction: body language, tells, the way they handle the first few exchanges. **Insight rolls are how Characters discover them.**"
    },

    breaks: [
      "When Resolve hits 0, the target **breaks**. They concede the stakes of the scene. They give up what was being negotiated for. The scene ends, or shifts to a different question.",
      "A broken target does not become loyal. They become defeated. Their later actions depend on the fiction. Some will rebuild Resolve and come back harder. Some will quietly carry the grudge. Some will respect the work and treat the crew differently going forward."
    ],

    /* Rounds and Plays. `name` is each Play's bold run-in. */
    rounds: "A Sit-Down runs in **Rounds**. Each Round lasts roughly the in-fiction time of one meaningful exchange: a few minutes for a fast negotiation, an hour for a long interrogation, a full courtroom session for a trial.",
    playsLead: "Each Round, every Character at the table makes a **Play**:",
    plays: [
      { key: "press", name: "Press", text: "Make a social attack roll. Choose an Approach. Roll the Pool. Margin becomes Pressure." },
      { key: "support", name: "Support", text: "Spend the Round backing a teammate. Grant +1 Edge Die to one ally's next Press roll this scene. Multiple supporters stack, capped at the normal +3 Edge Die ceiling." },
      { key: "read", name: "Read", text: "Make an Insight roll. On a Strong or Flawless Success, the GM reveals one of the target's vulnerabilities, resistances, or current emotional weight. On a Mixed Result, the GM reveals one detail of your choice (Profile, Debt, faction tie)." },
      { key: "disrupt", name: "Disrupt", text: "Spend the Round acting on the environment to shift the math: knocking over a drink to break the flow, triggering an alarm to add pressure, slipping a note to a witness, leaking a piece of footage. Requires a relevant non-social Skill check. On a success, impose +1 Snag Die on the target's next Posture, or remove +1 Snag Die from one ally's next Press roll." },
      { key: "hold", name: "Hold", text: "A Character who has no business being in this room (the muscle dummy at the negotiation, the antisocial Codebreaker at the gala) can Hold. They stay silent, control their breathing, and avoid making the scene worse. Their presence still counts toward the Floor: their gear, their posture, their reputation are part of the room. A Character who Holds well grants +1 Edge Die to one ally's Press roll this Round, representing the unspoken weight they bring." }
    ],
    holdNote: "Hold exists so that no Character is dead weight in a Sit-Down. A Fury with Body 18 and a known reputation does not need to talk. She needs to stand there, holstered, breathing.",

    /* Postures. `reduce` is the Pressure a Posture takes off as a number
       (Veil's is a 1d4 roll, carried as its dice); Counter reduces nothing. */
    postures: {
      intro: "The Opposition can spend an **Impulse Action** to deflect a successful Press. They get one per Round, just like a Freelancer's defensive Impulse in combat.",
      perRound: 1,
      columns: ["Posture", "What It Looks Like", "Effect"],
      rows: [
        { key: "deflect", name: "Deflect", looks: "Change the subject, redirect the question, pivot to a different topic", text: "Reduce Pressure by 1", reduce: 1 },
        { key: "compose", name: "Compose", looks: "A visible breath, recovered posture, the smile they practiced in the mirror", text: "Reduce Pressure by 1", reduce: 1 },
        { key: "stonewall", name: "Stonewall", looks: "Refuse to engage, fall back on script, demand a lawyer", text: "Reduce Pressure by 2. The target takes the *Cornered* condition.", reduce: 2 },
        { key: "veil", name: "Veil", looks: "Become unreadable, retreat behind ritual or pose, project Mystique", text: "Reduce Pressure by 1d4 (Mystique-aligned targets only)", reduce: "1d4" },
        { key: "counter", name: "Counter", looks: "**Push back:** attempt their own social attack against the Character who just pressed them", text: "Resolve as a contested social roll. On a Strong or Flawless margin against the Character, the Character takes Social Fallout.", reduce: 0 }
      ],
      recharge: "Opposition Postures recharge at the start of each Round."
    },

    /* Environmental Pressure (the Floor), in the book's order. */
    floor: {
      intro: "The Floor matters. The room and the timing can grant Edge or Snag to either side.",
      pressures: [
        { key: "theirTurf", name: "Their Turf", text: "Snag for the crew. Their guards, their lawyers, their dress code." },
        { key: "yourTurf", name: "Your Turf", text: "Edge for the crew. Familiar ground, your contacts in the bar, the back exit you scouted." },
        { key: "timePressure", name: "Time Pressure", text: "Snag for whoever loses the most by stalling." },
        { key: "publicAudience", name: "Public Audience", text: "Edge or Snag depending on what the audience wants to see. A public confrontation with a corporate stooge in a working-class district favors the crew. The same confrontation in a corporate hall is suicide." },
        { key: "witnesses", name: "Witnesses Who Owe You", text: "Edge for Persuasion or Intimidation. The bartender remembers what you did for them." },
        { key: "surveillance", name: "Surveillance", text: "Snag on any Approach that benefits from plausible deniability. The cameras are recording." }
      ],
      legwork: "The GM should call out these pressures at the start of the scene and let the players plan around them. Doing legwork to change the Floor before the scene starts is one of the things crews do to win social setpieces. A Background like Cipher Punk can wipe a camera. A Wageslave can file a form that delays the supervisor. A Click Chaser can plant a rumor that changes who the audience is rooting for. These are the moves that turn a Hardened target into a Standard one before the first word is spoken."
    },

    /* Sit-Down Conditions. Scene conditions, not the Conditions Library's. */
    conditions: {
      intro: "A Sit-Down can apply temporary conditions to the Opposition or to crew members. These last for the duration of the scene and end when it concludes.",
      columns: ["Condition", "Effect"],
      rows: [
        { key: "rattled", name: "Rattled", text: "The target rolls Postures with Snag." },
        { key: "cornered", name: "Cornered", text: "The target can't Counter or Stonewall this Round." },
        { key: "swayed", name: "Swayed", text: "The target treats one specific Character as a trusted source for the next Round." },
        { key: "exposed", name: "Exposed", text: "Sway has put the target on the defensive. The target loses 1 additional Resolve at the start of each subsequent Round until they regain composure." }
      ],
      crew: "A Character who suffers Social Fallout mid-Sit-Down may take a parallel condition: **Doubted**, **Marked**, or **Discredited**, depending on the fallout. These impose Snag on that Character's Press rolls for the rest of the scene.",
      crewNames: ["Doubted", "Marked", "Discredited"]
    }
  },

  /* ---- Cred and Heat (Optional) ------------------------------------------------------------------ */
  credHeat: {
    name: "Cred and Heat",
    optional: true,
    intro: "Faction Standing tracks the disposition of specific organizations. Profiles track how individual NPCs see you. Neither captures the slow accumulation of street-level reputation across a campaign. That is what Cred and Heat are for.",
    cred: {
      paragraphs: [
        "**Cred** is your standing within a specific community or scene. It is not a single number for the whole world. It is contextual.",
        "A Freelancer might have Cred 6 in the underground music scene, Cred 4 with the local fixer network, Cred 2 in the corporate sphere, and Cred 0 with the pre-Cascade relic brokers because they have never set foot in that world. Cred is what people in that scene think when your name comes up."
      ],
      range: "Each tracked scene gets its own Cred score, 0 to 10.",
      min: 0, max: 10,
      columns: ["Cred", "What It Means"],
      ladder: [
        { key: "unknown", range: "0", min: 0, max: 0, label: "Unknown", text: "Unknown. Nobody has heard of you." },
        { key: "newFace", range: "1-2", min: 1, max: 2, label: "New face", text: "New face. Some people know your name. Probably mispronounce it." },
        { key: "known", range: "3-4", min: 3, max: 4, label: "Known quantity", text: "Known quantity. The people who matter in this scene have an opinion." },
        { key: "established", range: "5-6", min: 5, max: 6, label: "Established", text: "Established. You can call in favors and expect them to land." },
        { key: "legend", range: "7-8", min: 7, max: 8, label: "Legend in the scene", text: "Legend in the scene. Doors open before you reach them." },
        { key: "mythic", range: "9-10", min: 9, max: 10, label: "Mythic", text: "Mythic. People tell stories about you that you do not remember being in." }
      ]
    },
    heat: {
      paragraphs: [
        "**Heat** is hostile attention. It tracks who is actively looking for you, watching you, or willing to act against you. Like Cred, Heat is contextual.",
        "A Freelancer might have Heat 3 from a specific corporation after a burned contract, Heat 5 from the local precinct after a shootout that went public, Heat 1 from a shrine they accidentally disrespected, and Heat 0 from everywhere else."
      ],
      min: 0, max: 10,
      columns: ["Heat", "What It Means"],
      ladder: [
        { key: "offRadar", range: "0", min: 0, max: 0, label: "Off the radar", text: "Off the radar. Nobody is looking." },
        { key: "file", range: "1-2", min: 1, max: 2, label: "A file with your name on it", text: "A file with your name on it sits in someone's inbox." },
        { key: "interest", range: "3-4", min: 3, max: 4, label: "Active interest", text: "Active interest. Surveillance, asset assignment, follow-up calls." },
        { key: "targeted", range: "5-6", min: 5, max: 6, label: "Targeted", text: "Targeted. They have a plan for you. The plan is being budgeted." },
        { key: "hunted", range: "7-8", min: 7, max: 8, label: "Hunted", text: "Hunted. Resources are committed. People are coming." },
        { key: "marked", range: "9-10", min: 9, max: 10, label: "Marked", text: "Marked. The order is out. The next move is theirs." }
      ]
    },
    /* How They Shift. `name` is each paragraph's bold run-in. `heatPerMonth`
       is the printed 1 Heat per month of quiet Downtime (at GM discretion). */
    shiftIntro: "Cred and Heat shift through play. The GM and the table should track this informally, updating after major events.",
    shifts: [
      { key: "credUp", name: "Cred increases", text: "when a major contract is completed publicly within the scene, a Freelancer does a notable favor for someone scene-relevant, a Flawless Success lands in a scene-relevant social encounter, or a story spreads that flatters them (even if exaggerated, even if true)." },
      { key: "credDown", name: "Cred decreases", text: "when a major contract fails publicly within the scene, a Freelancer betrays or burns a scene-relevant contact, a Critical Failure lands in a scene-relevant encounter, or a rival actively works to discredit them." },
      { key: "heatUp", name: "Heat increases", text: "when a job goes loud, a Freelancer is publicly identified at a crime scene, a Critical Failure lands in a scene involving institutional targets, or a Profile like *Flagged* or *Under Watch* is earned." },
      { key: "heatDown", name: "Heat decreases", text: "when significant Downtime passes without further incidents (1 Heat per month at GM discretion), a successful data scrub, bribe, or legal scrub action lands, a faction or contact actively intervenes to clear the record, or a bigger fish draws attention away. Heat fades. Slowly." }
    ],
    heatPerMonth: 1,
    effectsIntro: "Cred and Heat are not bookkeeping. They bite.",
    effects: [
      { key: "highCred", name: "High Cred in a scene", text: "grants Edge (or +1 Edge Die) on social rolls within that scene, access to contacts and venues and information that ordinary people can't reach, and small material favors like comp tabs and discounts at GM discretion." },
      { key: "lowCred", name: "Low or no Cred", text: "imposes Snag (or +1 Snag Die) on social rolls within scenes where the Character is unknown. Locked doors, refused meetings, the polite hostility of strangers." },
      { key: "highHeat", name: "High Heat from a specific source", text: "imposes Snag on Stealth and Deception rolls in territory the source controls, triggers random encounters when the Character enters that source's space, and brings active opposition: assets, agents, hired help showing up at inconvenient times." },
      { key: "lowHeat", name: "Low Heat", text: "means normal travel through the relevant territory. The freedom of being beneath notice." }
    ],
    together: [
      "A Freelancer with high Cred and high Heat from the same source is a celebrity criminal. They can't move quietly, but they can move with weight. People know who they are, and that includes the people who want them dead.",
      "A Freelancer with high Cred in one scene and high Heat from another can use their reputation as a shield. A famous busker who is wanted by Corp X can usually find someone in the music scene to hide them, at least for a few nights.",
      "A Freelancer with low Cred everywhere and high Heat from somewhere is a target without allies. This is a dangerous place to be. It is also where many memorable campaigns start."
    ]
  },

  /* ---- Examples in Play ----------------------------------------------------------------------------- */
  examples: [
    "A Freelancer negotiates payment with a fixer and rolls a Strong Success. The rate improves, but the fixer now expects priority access on the crew's next job.",
    "A crew spokesperson rolls a Mixed Result while securing access to a restricted district. The team gets through, but picks up the Profile *Flagged at South Gate*. Heat with the district precinct ticks up by 1.",
    "A broker rolls a Flawless Success during a tense contract scene. The crew gets better terms, a faster timeline, and the patron shifts from Neutral to Friendly. Cred with the corporate broker network ticks up by 1.",
    "A Character tries to bluff a corporate compliance officer and rolls a Critical Failure. The lie collapses, the office goes Hostile, and the crew gains immediate Scrutiny. Heat with that corporation increases by 1.",
    "A shrine negotiator accepts a Debt as the cost of success. The ritual space is granted, but the shrine will later call in a favor tied to a future anomaly event."
  ],
  deposition: {
    title: "Sit-Down Example: The Deposition",
    setup: "The crew's lawyer is taking a deposition from a mid-level corporate witness who knows where the bodies are buried. Stakes: get the witness to name names. Floor: a corporate conference room (their turf, Snag on the crew), a recording system (Snag on Deception), and a witness who is more afraid of their employer than the crew (Hardened, Resolve 8).",
    rounds: [
      { name: "Round One", text: "The lawyer Presses with Persuasion (Charm), rolls a Strong Success, deals 2 Pressure. Resolve: 6. The Fury, sitting in the corner cleaning a sidearm she won't use, Holds. Her presence grants +1 Edge Die to the lawyer's next Press." },
      { name: "Round Two", text: "The Codebreaker, jacked in remotely, Disrupts: pulls one of the witness's internal emails onto the conference room screen \"by accident.\" The witness becomes Rattled. The lawyer Presses with Wits-driven Persuasion (dismantling the witness's argument with the new evidence), now with two Edge Dice from the Hold and the Disrupt. Flawless Success: 3 Pressure. Resolve: 3." },
      { name: "Round Three", text: "The witness tries to Stonewall: \"I would like to consult my legal counsel.\" Reduces incoming Pressure by 2, takes the *Cornered* condition for the scene. The lawyer presses again with Intimidation (Charm, plus information about the witness's daughter's tuition used to pressure them), and lands a Strong Success. 2 Pressure minus 2 Stonewall equals 0 net Pressure. No movement on Resolve, but the witness has used their Posture for the Round." },
      { name: "Round Four", text: "The Fury speaks for the first time. Body and Intimidation: \"Your employer does not protect people. They use them. I have seen the people they leave behind.\" Roll. Mixed Result: 1 Pressure, and the witness applies Social Fallout. They choose Tipped Hand: the Fury reveals her own past as a corp security washout, which the witness's lawyer files away. Resolve: 2. The Fury picks up the Profile *Disgruntled Ex-Corp* for the rest of the scene." },
      { name: "Round Five", text: "The lawyer Presses one more time. Persuasion (Charm). Strong Success: 2 Pressure. Resolve: 0. The witness breaks. They name two names. The crew gets what they came for. Heat with the corporation increases by 2." }
    ]
  },

  /* ---- GM Guidance (the chapter's own, printed in Part 2) --------------------------------------------- */
  gmGuidance: [
    { key: "friction", name: "Default to Friction.", text: "Most social rolls are one-and-done. A pool, a margin, a consequence. Don't call a Sit-Down for a haggle with a street vendor." },
    { key: "earnIt", name: "Call a Sit-Down when the scene earns it.", text: "A big interrogation, a faction confrontation, a contract negotiation that will define the next arc. These deserve the structure. They feel like fights because they are." },
    { key: "everyone", name: "Let every Character contribute.", text: "The Hold play exists so muscle and chrome can show up without dragging the scene down. The Disrupt play lets the technical-minded Characters do something even when the talking is happening elsewhere. The Support play lets the silent ones lend weight. Nobody at the table should sit out a Sit-Down." },
    { key: "matchFallout", name: "Match fallout to fiction.", text: "A social scene that produces physical Fatigue is usually the wrong call. Use Debt, Scrutiny, Profiles, Faction Shifts, Cred and Heat changes. The fallout should fit the room." },
    { key: "slow", name: "Cred and Heat are slow-moving currencies.", text: "Don't change them every session. Update them at the end of arcs, after major contracts, or when something notable happens that the table will remember." },
    { key: "anyCrew", name: "The system supports any kind of crew.", text: "A Charm-and-Mystique-heavy crew will dominate social setpieces by direct push. A muscle-and-chrome crew will dominate by Holding well, trading on their reputation, and choosing the right Disrupts. The system rewards thinking about what your crew actually is." },
    { key: "backgrounds", name: "Background ties matter here.", text: "Every Background grants Contacts and a Background Feature. A Boardroom Exile already belongs in the corporate conference room. A Wageslave already knows which form will buy the crew an hour. A Glow Idol already has the bartender's loyalty. Reward these. The crew that brings the right Background to the setpiece should already have changed the Floor before the first roll." }
  ],

  /* ---- Gameplay Summary: Social Pressure and Faction Standing ------------------------------------------ */
  summary: {
    title: "Gameplay Summary: Social Pressure and Faction Standing",
    columns: ["Step", "Summary"],
    steps: [
      { n: 1, name: "Define the Stakes", text: "What does the Character want. What is the other side protecting." },
      { n: 2, name: "Choose the Depth", text: "Friction for quick scenes. A Sit-Down for high-stakes encounters." },
      { n: 3, name: "Pick an Approach", text: "Persuasion, Intimidation, Performance, Deception, or Insight. The Approach picks the Skill and Attribute." },
      { n: 4, name: "Build the Pool", text: "Attribute, Skill tier, tools, sway, and any Edge or Snag the Floor provides." },
      { n: 5, name: "Resolve the Margin", text: "Use the normal success table. In a Sit-Down, Margin becomes Pressure against Resolve." },
      { n: 6, name: "Apply Fallout", text: "Debt, Profiles, Scrutiny, Concessions, Faction Shifts, Cred and Heat changes." },
      { n: 7, name: "Record Changes", text: "Write down Profiles, Debts, agreements, and faction posture if the scene matters." },
      { n: 8, name: "Carry It Forward", text: "Future scenes reflect what this one changed." }
    ]
  }
};
