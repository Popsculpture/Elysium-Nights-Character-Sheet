/* ===========================================================================
   ELYSIUM NIGHTS · Core Resolution data  ("Dicey Situations")
   The d20 Method, the Dice Pool Method, Edge and Snag, Success Margins and
   Consequence, and Collaborative and Opposed Checks. Extracted from the core
   resolution chapter. Rendered read-only by the Codex tab.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.resolution = {

  intro: "One system handles every roll, from a single snap check to a stacked, layered challenge. Name the stakes, pick the method, roll, read the margin, and live with what it tells you.",

  coreConcepts: [
    { term: "d20 Method", text: "A single roll for fast, high-pressure actions: attacks, saves, snap checks." },
    { term: "Dice Pool Method", text: "A multi-die roll used for complex actions where success, cost, and consequence are intertwined." },
    { term: "Edge and Snag", text: "Modifiers that represent advantage or disadvantage, adding tension and rhythm to rolls." },
    { term: "Success Margin", text: "The difference between the roll result and the difficulty, showing how well or poorly an action succeeds." },
    { term: "Consequence", text: "The narrative or mechanical result that follows from the margin, representing cost, risk, or reward." },
    { term: "Scene Type", text: "The nature of the action being resolved: physical, social, technical, investigatory, or resonant. Scene Type determines what kinds of consequences make sense." }
  ],

  /* ---- which method to use ---------------------------------------------- */
  methodSplit: {
    d20Intro: "Use the d20 Method for anything in or tied to combat:",
    d20Uses: [
      "All attack rolls",
      "All saving throws",
      "All Flow attacks and Flow Invocations",
      "Any Skill check made under stress, during combat, or as part of a combat round"
    ],
    poolIntro: "Use the Dice Pool Method only for extended, out of combat tasks:",
    poolUses: [
      "Out of combat Skill checks and Tool use",
      "Investigations, research, crafting, social and legwork scenes",
      "Flow rituals, cooperative Flow workings, and anomaly cleansing",
      "Vehicle checks that are not part of a combat round"
    ],
    rule: "Once a combat Encounter has started, do not switch to Dice Pools. If you are in a combat round, it is d20. Skills, Flow, Vehicles, all of it.",
    lookup: [
      { situation: "Initiative, Attacks, opportunity attacks, and Impulse shots", method: "d20" },
      { situation: "Flow attacks and Flow Invocations", method: "d20" },
      { situation: "Saving Throws of any kind", method: "d20" },
      { situation: "Skill checks made under stress or during a combat round", method: "d20" },
      { situation: "Quick hacks, stunts, and physical maneuvers under fire", method: "d20" },
      { situation: "Vehicle checks and piloting in combat or under stress", method: "d20" },
      { situation: "Long or complex Skill checks and Tool checks", method: "Dice Pool" },
      { situation: "Detailed investigations, research, and social negotiations", method: "Dice Pool" },
      { situation: "Crafting, engineering, and medtech procedures", method: "Dice Pool" },
      { situation: "Flow rituals, anomaly cleansing, and Flow maintenance", method: "Dice Pool" },
      { situation: "Vehicle checks and piloting outside of combat rounds", method: "Dice Pool" }
    ],
    tiebreaker: "If you are not sure which method to use, ask one question: are we in a combat round or facing an immediate Save or attack? If yes, use the d20 Method. Otherwise, use Dice Pools."
  },

  /* ---- the d20 Method --------------------------------------------------- */
  d20: {
    process: "1. Roll a d20.\n2. Add the relevant modifiers: Attribute modifier; Proficiency Bonus, if applicable; situational modifiers from tools, conditions, or Edge and Snag.\n3. Compare the total to the DC. Equal or higher is a success; lower is a failure.",
    modCap: "Static modifiers are capped at +15. If external buffs, advanced gear, or Flow effects would raise this total above +15, any excess is ignored. The Caliber bonus from a Skill Focus, advantage states like Edge, or an expanded critical threat range (such as from a Specialization) operate completely outside of this static cap.",
    dcTable: [
      { task: "Very Easy", dc: "5", example: "Spot an obvious clue" },
      { task: "Easy", dc: "10", example: "Climb a rope" },
      { task: "Standard", dc: "15", example: "Pick a basic lock" },
      { task: "Hard", dc: "20", example: "Convince a neutral NPC" },
      { task: "Very Hard", dc: "25", example: "Disarm a trap under pressure" },
      { task: "Nearly Impossible", dc: "30", example: "Hack military encryption mid-combat" }
    ],
    combatRolls: [
      { type: "Melee Attack", formula: "d20 + Body Modifier + Weapon Proficiency Bonus", target: "vs Defense" },
      { type: "Ranged Attack", formula: "d20 + Agility Modifier + Weapon Proficiency Bonus", target: "vs Defense" },
      { type: "Flow Attack", formula: "d20 + Flow Modifier + Caliber", target: "vs Defense" },
      { type: "Flow Save DC", formula: "8 + Flow Modifier + Caliber", target: "vs DC set by attacker or effect" },
      { type: "Quick Hack", formula: "d20 + Tech Modifier + Systems Proficiency Bonus", target: "vs system DC" },
      { type: "Contested Action", formula: "Both roll d20 + modifiers + the relevant Proficiency Bonus", target: "Higher total wins" }
    ],
    crits: [
      { roll: "Natural 20", effect: "Attacks deal extra damage or trigger a special effect. Skill checks can only achieve critical success results if you have appropriate tools, gear, or situational advantages. Otherwise, treat the roll as a normal success." },
      { roll: "Natural 1", effect: "Attacks automatically miss and may cause a mishap. Skill checks fail dramatically." }
    ]
  },

  /* ---- the Dice Pool Method --------------------------------------------- */
  pool: {
    intro: "When one die cannot hold all the moving parts, you build a pool. Edge Dice and Snag Dice are built, capped, and read as two separate colors. Each has a d10 range and a maximum number of dice, and those two numbers are not always the same.",
    colorTable: [
      { color: "Edge", d10Range: "10", diceCap: "10" },
      { color: "Snag", d10Range: "5", diceCap: "7" }
    ],
    d12Rules: "Any die built past a color's d10 range is rolled as a d12 instead. Once a color is at its dice cap, each further point of advantage or difficulty converts one d10 to a d12, 1 for 1, until every die in that pool is a d12. A d12 reads a 10 or higher as 2, rather than only a natural 10.",

    edgeIntro: "Edge is everything bending the job your way: raw talent, training, the right tool, a setup that went to plan.",
    edgeBuild: [
      { source: "Relevant Attribute Modifier", dice: "+1 per point" },
      { source: "Proficiency Bonus", dice: "+2 Proficient, +4 Expertise, +6 Mastery" },
      { source: "Tools or Gear", dice: "+1 to 3 (varies; see tool or gear description)" },
      { source: "Allied Help Action", dice: "+1 to 3 by helper's tier, +4 max total (see Help Action)" },
      { source: "Special Preparation", dice: "+1" },
      { source: "Narrative Advantage", dice: "+1 (GM discretion)" }
    ],
    baseNote: "Your Base Pool is your Attribute Modifier, Proficiency Bonus, and any bonuses from Tools or Gear. Allies, Special Preparation, and Narrative Advantage count as situational bonus dice, capped at +3 added to the base pool.",
    edgePast10Intro: "An Edge pool holds 10 dice. When your build would push past 10, do not add more dice. Convert one d10 to a d12 for every point of Edge past 10, 1 for 1, until you reach a ceiling of ten d12 dice.",
    edgePast10: [
      { built: "10 or fewer", pool: "that many d10s" },
      { built: "11", pool: "9d10 + 1d12" },
      { built: "13", pool: "7d10 + 3d12" },
      { built: "15", pool: "5d10 + 5d12" },
      { built: "18", pool: "2d10 + 8d12" },
      { built: "20", pool: "10d12" },
      { built: "21 or more", pool: "10d12" }
    ],
    edgeCeiling: "Twenty points of Edge is the ceiling, and only deep buff stacking ever climbs that high. Past twenty, the extra advantage simply has nowhere to go. The pool gets sharper, never larger.",

    snagIntro: "Snag is everything pushing back: the lock that fights you, the clock, the hostile room. The GM sets it from how hard the task truly is.",
    snagAssign: [
      { risk: "Easy", dice: "1", desc: "Minor obstacle or routine task" },
      { risk: "Moderate", dice: "2", desc: "Active resistance or moderate pressure" },
      { risk: "Hard", dice: "3", desc: "Skilled opposition or difficult environment" },
      { risk: "Daunting", dice: "4", desc: "Extreme pressure or lethal difficulty" },
      { risk: "Nearly Impossible", dice: "5", desc: "Overwhelming odds or near-impossible task" }
    ],
    snagPast5Intro: "Total Snag is the risk level plus any Snag added by conditions, modifiers, or hostile circumstances, and it can climb past 5 in two phases. First, difficulty past 5 adds d12s until the pool holds 7 dice. Then, with the count capped at 7, each further point converts one of the five d10s to a d12, 1 for 1, until all seven dice are d12.",
    snagPast5: [
      { total: "1 to 5", pool: "that many d10s" },
      { total: "6", pool: "5d10 + 1d12" },
      { total: "7", pool: "5d10 + 2d12" },
      { total: "8", pool: "4d10 + 3d12" },
      { total: "9", pool: "3d10 + 4d12" },
      { total: "10", pool: "2d10 + 5d12" },
      { total: "11", pool: "1d10 + 6d12" },
      { total: "12", pool: "7d12" },
      { total: "13 or more", pool: "7d12" }
    ],
    snagCeiling: "Seven d12 dice is the hard ceiling and the mechanical face of Nearly Impossible. It averages close to 6 failures, which an unprepared crew cannot beat and a well prepared one only barely can. If a task is genuinely impossible, the GM calls for no roll at all.",

    procedure: "Roll all Edge and Snag Dice together.\n\nRead the dice:\n- Edge Die: 6 to 9 is 1 success, 10 or higher is 2 successes\n- Snag Die: 6 to 9 is 1 failure, 10 or higher is 2 failures\n- 1 to 5 is no effect\n\nCalculate your Margin: count your total successes from Edge Dice and subtract your total failures from Snag Dice. This final number is your Margin.\n\nDetermine the outcome:\n- Positive margin (+1 or more): Strong or Flawless Success\n- Zero margin (0): Mixed Result, success with a consequence\n- Negative margin (-1 or worse): Failure",
    example: "A Freelancer rolls 4 Edge Dice and gets an 8, 10, 4, and 2 for 3 Successes. The GM rolls 2 Snag Dice and gets a 7 and a 3 for 1 Failure. The player subtracts the 1 Failure from their 3 Successes, resulting in a Margin of +2, a Strong Success."
  },

  /* ---- success margin and consequence ----------------------------------- */
  margins: {
    d20Intro: "Margin = Roll Total - DC",
    d20: [
      { margin: "10+", result: "Flawless Success", desc: "Perfect execution. Gain a narrative advantage, grant yourself Edge or +1 Edge Die on a follow-up, recover 1 FP, or seize a strong position." },
      { margin: "5 to 9", result: "Strong Success", desc: "You hit the goal, but spend something to do it: time, material, leverage, influence, or attention." },
      { margin: "0 to 4", result: "Standard Success", desc: "Clean success. No side effects." },
      { margin: "-1 to -4", result: "Failure", desc: "The attempt fails. Lose ground, spend resources, worsen your position, or alert opposition." },
      { margin: "-5 or worse", result: "Critical Failure", desc: "The action backfires: immediate danger, injury, exposure, digital retaliation, or resonance backlash. The GM sets the fallout." }
    ],
    poolIntro: "Margin = Total Successes - Total Failures",
    pool: [
      { margin: "+3 or more", result: "Flawless Success", desc: "Cinematic or resonant. Gain a narrative advantage, grant Edge or +1 Edge Die on a follow-up, or recover 1 FP." },
      { margin: "+1 to +2", result: "Strong Success", desc: "Effective, but with a minor cost: delay, spent material, leverage, or attention." },
      { margin: "0", result: "Mixed Result", desc: "Success with a consequence. Take one cost that fits the scene: 1 Fatigue, 1 Strain, a Debt, a Reputation Tag, a Trace, or concede terms." },
      { margin: "-1 to -2", result: "Failure", desc: "The action falters and costs resources, position, or attention." },
      { margin: "-3 or worse", result: "Critical Failure", desc: "The attempt collapses, causes harm, or invites backlash. Immediate escalation." }
    ],
    sceneRule: "Match the cost to the scene every time. Physical scenes produce physical costs. Social scenes produce social costs. Technical scenes produce digital or logistical costs. Flow scenes produce resonance instability or backlash."
  },

  consequenceByScene: [
    { scene: "Physical / Exploration", consequences: "Lose time, make noise, spend gear, suffer 1 Fatigue from exertion, lose position, trigger a hazard" },
    { scene: "Social / Negotiation", consequences: "Owe a favor, concede terms, reveal leverage, gain scrutiny, take a Reputation tag, worsen faction posture" },
    { scene: "Hacking / #GRID", consequences: "Gain Trace, alert ICE, lose access, burn a tool, expose your location, trigger a counter-intrusion" },
    { scene: "Flow / Resonance", consequences: "Gain 1 Strain, distort the environment, destabilize the effect, attract attention, reveal your resonance signature" },
    { scene: "Crafting / Technical", consequences: "Waste materials, reduce quality, increase time, require a replacement part, create instability" }
  ],

  social: {
    intro: "Social scenes do not leave bruises. They leave debts, doubts, and a face the room remembers. When a social Dice Pool roll ends in a Mixed Result or a Strong Success with a cost, reach for these before you reach for Fatigue.",
    costs: [
      { cost: "Concession", effect: "You get what you want, but must give up a term, price, timeline, favor, or piece of leverage." },
      { cost: "Debt", effect: "You now owe the Target a favor, payment, introduction, future service, or operational support." },
      { cost: "Exposure", effect: "You reveal more than intended: your motive, urgency, affiliation, weakness, or relationship." },
      { cost: "Scrutiny", effect: "The scene attracts attention from witnesses, rivals, handlers, security, or faction observers." },
      { cost: "Reputation Tag", effect: "You gain a temporary narrative tag such as Pushy, Desperate, Unreliable, Bought, or Difficult." },
      { cost: "Faction Shift", effect: "One faction, office, or social circle shifts colder, more suspicious, or more transactional toward you." },
      { cost: "Complication Clause", effect: "The deal holds, but carries a hidden obligation, audit trigger, exclusivity term, or future claim." },
      { cost: "Lost Face", effect: "You succeed, but your standing slips. Future social checks with this Target or audience suffer Snag until the situation changes." }
    ],
    falloutRule: "Social scenes should create obligation, visibility, leverage, damaged trust, worsened terms, or changing relationships, not default physical penalties. Use Fatigue in a social scene only when the fiction genuinely involves exhaustion, deprivation, mental overload, prolonged interrogation, sleeplessness, or another form of real wear."
  },

  costTracks: {
    tracks: [
      { term: "Fatigue", meaning: "Physical or mental wear caused by exertion, deprivation, overwork, or extended pressure." },
      { term: "Strain", meaning: "Resonance instability caused by Overdraw, Flow misuse, or unstable channeling." },
      { term: "Social Fallout", meaning: "Damaged trust, worsened terms, exposure, debt, scrutiny, or changes in faction posture." }
    ],
    guidance: "Use Fatigue as the default cost for physical wear and overexertion. Use Strain only when the consequence directly involves Overdraw or instability with the Flow. Use Social Fallout for persuasion, deception, bargaining, contract work, faction pressure, and other social negotiation scenes."
  },

  autoResolve: [
    { name: "Natural 20", text: "Always succeeds in stress checks using the d20 Method." },
    { name: "Natural 1", text: "Always fails in stress checks using the d20 Method." },
    { name: "Margin Mastery", text: "If your Attribute modifier + Proficiency Bonus is 10 or more above the DC, you succeed automatically without rolling." },
    { name: "Margin Failure", text: "If the DC is 10 or more above your maximum possible total, the attempt automatically fails." },
    { name: "Dice Pool Method", text: "Automatic success occurs if your total Edge Dice pool is at least double the GM's Snag Dice, unless extraordinary risk or opposition is present." },
    { name: "Flow Mastery", text: "If your Flow Attribute modifier + Proficiency + relevant bonuses is 10 or more above the DC for a Flow-related check, you succeed automatically without rolling, unless the scene's tension or a special rule says otherwise." }
  ],

  /* ---- Edge and Snag ---------------------------------------------------- */
  edgeSnag: {
    intro: "Edge is the moment tilting your way; Snag is the friction dragging against it. The same two forces drive both methods, so a single dramatic curve holds across the entire system.",
    d20: "On a single die, momentum means a second chance at the same throw.\n- Roll with Edge: roll 2d20 and take the higher result.\n- Roll with Snag: roll 2d20 and take the lower result.",
    d20Stacking: "You can never roll more than 2d20, regardless of how many sources of Edge or Snag apply. Cancel opposing modifiers 1 for 1 before rolling.\n\nExamples:\n- 2 Edge and 1 Snag: roll with Edge\n- 1 Edge and 3 Snag: roll with Snag\n- 1 Edge and 1 Snag: normal roll",
    pool: "In a pool, momentum is not a reroll. It is more dice, dropped straight into the count.\n- Roll with Edge Dice: add +1 Edge Die to your pool for each source of Edge. You cannot add more than 3 situational bonus dice to your base pool. An Edge pool holds 10 dice; advantage past 10 sharpens d10s into d12s rather than adding more.\n- Roll with Snag Dice: add +1 Snag Die to your pool for each source of Snag. A Snag pool holds at most 7 dice. Difficulty past that point sharpens those dice to d12 rather than adding more.",
    sources: [
      { area: "Combat (d20 Method)", edge: "High ground, flanking, ally suppression, or enemy distraction", snag: "Restrained, prone, blinded, or under suppression" },
      { area: "Social (Dice Pool Method)", edge: "Useful leverage, correct information, active support, or favorable standing", snag: "Hostile audience, no leverage, bad timing, social stigma, or visible desperation" },
      { area: "Hacking (method varies by pace)", edge: "Superior code, stolen credentials, hidden backdoors, or local access", snag: "ICE resistance, unstable access, trace lock, or degraded hardware" },
      { area: "Flow (method varies by pace)", edge: "Harmonized environment, focused current, or resonance alignment", snag: "Chaotic zone, corrupted resonance, or unaligned channeling" }
    ],
    sourcesNote: "The triggers above work in either method. In combat they grant Edge or Snag on your d20 roll. Out of combat they grant +1 Edge Die or +1 Snag Die to your pool.",
    gmGuidance: "Use Edge and Snag sparingly to emphasize key moments. Cancel them cleanly. Always lead with the fiction. Avoid double-counting: if a challenge's difficulty is already reflected in the DC or Snag Dice, do not apply a second penalty for the same reason."
  },

  /* ---- collaborative and opposed checks --------------------------------- */
  collaborative: {
    intro: "Two operators wrestle for the same console; a whole crew leans on one gate; a steady hand steadies someone else's. Opposed rolls, shared efforts, and direct assistance all run on the same margin and consequence framework.",
    methodChoice: "If the contest or group effort happens during a combat Encounter or directly affects attacks, Saves, or Flow Invocations, resolve it with the d20 Method. If it is a long-form or out of combat challenge (heists, hacking races, extended negotiations, ritual work, or vehicle chases not framed as combat rounds), you may use Dice Pools.",

    contested: {
      intro: "When two forces want opposite things at the same instant, both throw and the margin between them decides who walks away holding the outcome.",
      d20Process: "1. Both participants roll d20 + modifiers.\n2. Compare totals. Higher total wins. If tied, the situation remains locked, unresolved, or balanced.\n3. Calculate the margin between results.",
      poolProcess: "1. Both participants build and roll their Dice Pools with any Edge or Snag applied.\n2. Count net successes for each side.\n3. Subtract the lower total from the higher total. The result is the margin of victory.",
      outcomes: [
        { d20: "+10 or higher", pool: "+3 or more", result: "Dominant Victory", desc: "You seize complete control or overpower the opponent. Gain a decisive advantage, disable them, or impose a major condition." },
        { d20: "+5 to +9", pool: "+2", result: "Clear Victory", desc: "You win cleanly and assert control, though your opponent may still recover or respond." },
        { d20: "+1 to +4", pool: "+1", result: "Narrow Success", desc: "You succeed but at a cost. You might take harm, lose time, trigger a complication, or concede position." },
        { d20: "0", pool: "0", result: "Stalemate", desc: "Neither side gains ground. The situation remains locked or unresolved until conditions change." },
        { d20: "-1 or worse", pool: "-1 or worse", result: "Failure", desc: "Your opponent gains control and may inflict consequences equal to your margin of loss." }
      ]
    },

    group: {
      intro: "When everyone bends toward one objective, the table measures the whole effort, not the loudest roll.",
      d20Process: "1. Each Freelancer rolls a d20 + relevant modifier against the DC.\n2. If half or more of the group meets or exceeds the DC, the group succeeds.\n3. Calculate the Average Margin of all rolls (positive margins of successes plus negative margins of failures, divided by the number of Freelancers) to determine outcome quality.",
      poolProcess: "1. Each Freelancer builds their own Dice Pool, including their specific Edge and Snag Dice, and rolls.\n2. Each Freelancer calculates their individual Margin.\n3. Add all individual Margins together to find the Group Net Margin.",
      outcomes: [
        { d20: "+6 or higher", pool: "+4 or more", result: "Flawless Success", desc: "The group performs in perfect rhythm. Gain an ongoing advantage, conserve time, or recover limited resources." },
        { d20: "+3 to +5", pool: "+2 to +3", result: "Strong Success", desc: "The group completes the task effectively but faces a fitting cost: delay, resource loss, added scrutiny, minor Fatigue from exertion, or another scene-appropriate complication." },
        { d20: "+1 to +2", pool: "+1", result: "Standard Success", desc: "The objective is completed without added cost or extra reward." },
        { d20: "0", pool: "0", result: "Mixed Result", desc: "The group succeeds but something goes wrong. Choose one consequence that fits the scene: losing time, alerting danger, worsening terms, or causing minor harm." },
        { d20: "-1 to -3", pool: "-1 to -2", result: "Failure", desc: "The group fails to coordinate. The objective is delayed, exposed, or partially compromised." },
        { d20: "-4 or worse", pool: "-3 or worse", result: "Critical Failure", desc: "The plan collapses. Equipment breaks, exposure occurs, backlash hits, or one Freelancer suffers a major setback." }
      ],
      difficulty: "Base difficulty on complexity, not size. For d20 checks, start with the base DC for a single Character, then add +2 for each additional Freelancer whose role meaningfully increases complexity or exposure. For Dice Pools, difficulty is controlled by the Snag Dice assigned to each Freelancer's individual pool based on their role."
    },

    help: {
      intro: "How much a Help Action is worth depends on how much the helper actually knows. You must be at least Proficient in the relevant skill or tool to move the dice at all. An Untrained Freelancer can lend color and hands but grants no mechanical bonus.",
      timing: "Outside of combat, helping requires spending the necessary time to contribute to the task. In combat you have two ways to execute it: as an Action (spend your standard Action on your turn to assist an ally), or as an Impulse Action (jump in during another Freelancer's turn, which immediately consumes your Impulse Action and forfeits the standard Action on your upcoming turn).",
      d20: "Spend your Action or Impulse and make an assist check: roll d20 plus your modifier for the relevant skill or tool against DC 15. On a success, the assisted Freelancer gains a flat bonus to their roll: +2 if you are Proficient, +3 with Expertise, +4 with Mastery. This bonus applies on top of the static modifier cap and stacks with Edge. On a Natural 1, your help backfires and the assisted Freelancer rolls with Snag. If more than one Freelancer assists the same roll, only the single highest bonus applies; assist bonuses do not stack.",
      pool: "Add Edge Dice to the assisted Freelancer's pool equal to your tier in the relevant skill or tool: +1 Proficient, +2 Expertise, +3 Mastery. These stack across multiple helpers, but the total Edge Dice added by all helpers together cannot exceed +4.",
      limits: "You must be conscious, capable, and aware of the situation to assist. The GM may cap how many Freelancers can help when the space is too crowded or the task cannot logically support more hands."
    },

    passive: "Some capability needs no roll at all. A Passive Check uses a flat 10 plus your relevant modifiers and answers a question without the dice on the table. It is covered in full under Skills and Proficiencies."
  },

  examples: [
    "An expert operator rolls 22 vs DC 12, a margin of +10. That is a Flawless Success. They finish the job early and gain an advantage in the next encounter.",
    "A field medic rolls a +2 margin in a Dice Pool. That is a Strong Success. The repair works, but consumes rare materials.",
    "A negotiator rolls a Mixed Result while persuading a guard. The guard agrees, but the negotiator takes the Reputation Tag Pressured the Gate, and the office remembers their face.",
    "A Flow adept rolls a -3 margin. That is a Critical Failure. The Flow surges, adding 1 Strain and destabilizing nearby energy.",
    "Two rival hackers race to breach a server. One rolls 8 net successes, the other 5. The winner holds a +3 margin: a Dominant Victory that locks out their rival."
  ]
};
