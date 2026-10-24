// Combat rules data, extracted verbatim from the Elysium Nights rulebook (part2.txt).
// Re-checked 2026-10-07 against the manuscript pull (Part 2, modifiedTime 2026-10-04): the Action
// examples (l.1778-1793), the Move cost table (l.1799-1806), the Impulse examples (l.1840-1846),
// Charge / Rush (Common Actions, l.2033) and Cover and Defense (l.2192-2198) now read as the book does,
// and so do the whole Common Actions table with its Flow Modifier box (l.2019-2040) and the three
// cover grades (l.2177-2189).
// Speed and its costs in full are EN.movement (data/movement.js), rendered beside these in the Codex.
// 23 October 2026 handoff (costly success): the Turn Structure list is EN.combat.turnStructure
// (Complex Action line as printed), the Complex summary follows it, Quick Hack and the attack
// note add Device Bonus, and the damage pipeline puts Resistance and Vulnerability last and
// treats 0 Vitality as Fatigue and Bloodied, not a Wound.
window.EN = window.EN || {};
EN.combat = {

  /* The Handbook's Turn Structure list (Timing, Action Economy and Combat), word for word. The
     app keeps no per-turn tracker, so this is rendered as text first in the Codex's Action
     Economy panel (ref-actions); it is where the Complex Action rule lives. */
  turnStructure: {
    intro: "During your turn, you may take the following in any order unless stated otherwise:",
    lines: [
      "**Action (1).** Your main effort for the round: attack, hack, channel, or perform a major maneuver.",
      "**Move (1).** Spend Speed to reposition; can be traded for one Swift or one extra Impulse Action.",
      "**Swift Action (0-1).** Quick maneuver or minor action; replaces your Move Action.",
      "**Impulse (0-1 per round).** A minor action triggered outside your turn (parry, dodge, intercept, or Help).",
      "**Free Actions.** Minor narrative or functional actions (speaking, interacting with gear, etc.).",
      "**Complex Action (0-1).** Consumes both Action and Move, so you can't trade Move for a Swift or an extra Impulse. Free Actions and your one Impulse remain. Used for continuous or powerful tasks (full defense, major channeling). Some say otherwise: Charge/Rush keeps a Swift, and Full Defense allows nothing else.",
      "**Special Action (varies).** Feature-driven: passive, triggered, resource-based, or embedded. Cost and timing set by the feature."
    ]
  },

  actionTypes: [
    {
      name: "Action",
      summary: "The main effort or task you perform during your turn.",
      text: "Your Action is the primary effort of your turn.\n\nExamples\n- Melee Attack: Swing or thrust with a melee weapon.\n- Unarmed Strike: Strike with fists, elbows, knees, or feet.\n- Ranged Attack: Fire a weapon at a Target.\n- Throw: Hurl a weapon or grenade at a Target.\n- Shove: Drive a Target back and out of position.\n- Trip: Sweep a Target's legs and knock it Prone.\n- Grapple: Seize a Target and hold it in place.\n- Disengage: Break contact. Safely move for the rest of your turn without provoking Opportunity Attacks.\n- Channel Flow: Focus or project resonance energy using an Invocation.\n- Hack System: Access, override, or disrupt a device or terminal.\n- Use Device: Activate or operate an item or tool.\n- Reload (Action): Reload complex or Heavy Weapons such as tube-fed shotguns, belt-fed guns, launchers, or heavy energy weapons.\n- Dash: Move an additional distance equal to your Speed.\n- Skill or Ability Check: Attempt a challenging task that requires full focus."
    },
    {
      name: "Move",
      summary: "Movement or repositioning, often traded for other options.",
      text: "Movement uses your Speed, equal to 6 + Agility Modifier (minimum 3). Each point of Speed moves you 1 space.\n\nMovement Type · Speed Cost\n- Normal movement: 1 per space\n- Difficult terrain: 2 per space\n- Through a body: 2 per space (ally or smaller enemy only)\n- Climb or vault: 2-3 per space depending on difficulty\n- Jump or leap: 1 per space crossed\n- Dash: Spend your Action to gain a new movement pool equal to your Speed\n\nAttribute Influence: Your Agility Modifier adds directly to your Speed each turn. Even with a negative modifier, total Speed can't drop below 3 due to Agility alone. Environmental effects, injuries, or abilities can still reduce Speed to 0."
    },
    {
      name: "Swift Action",
      summary: "Quick maneuver or minor action; replaces your Move Action.",
      text: "Swift Actions are brief maneuvers that can occur alongside or instead of movement. You may move up to half your speed when performing a Swift Action.\n\nExamples\n- Channel Burst: Quick Flow projection or defensive pulse.\n- Follow-Up Attack: Secondary strike with an off-hand or linked weapon.\n- Take Aim: Gain Edge on your next attack.\n- Reload (Swift): Reload weapons designed for fast handling, such as sidearms, bows, or light rifles.\n- Draw or Ready Weapon: Ready a two-handed or bulky weapon.\n- Stand Up: Rise from Prone."
    },
    {
      name: "Impulse Action",
      summary: "A minor action triggered outside your turn (parry, dodge, intercept, or Help).",
      /* the Examples and Opportunity Attacks as the Player's Handbook prints them (r5, 17 October 2026):
         one "Active Defense:" line names all seven defenses, and the second Opportunity Attack bullet
         is the book's "It costs your Impulse Action." with nothing added */
      text: "Impulse Actions occur outside your turn, triggered by events or enemy actions. Unless you traded your Move Action, you may only perform one Impulse Action per round.\n\nExamples\n- Opportunity Attack: Strike a Hostile that leaves your reach. See Opportunity Attacks below.\n- Active Defense: Block, Brace, Dodge (against an attack you can see), Parry, Resurge, Siphon, or Ward (see Active Defenses).\n- Intercept: Move up to half your Speed to an ally within 2 spaces who is about to be hit; you become the target of that attack instead.\n- Help Action: When an ally makes a save or check, you may jump in to assist them, consuming your Impulse Action and your upcoming turn's Action.\n\nOpportunity Attacks\n\nWhen a Hostile you can see leaves your reach using its own movement, you can spend your Impulse Action to make one melee attack against it. The attack resolves from the last space it occupied within your reach, before the movement carries it clear.\n- You need a melee weapon in hand, or your bare hands.\n- It costs your Impulse Action.\n- Movement that isn't the Hostile's own doesn't provoke. A shove, a pull, a teleport, or any other forced movement takes them out of reach without giving you the shot.\n- Disengage denies the attack entirely.\n- The GM may also allow an Opportunity Attack when a Hostile does something careless inside your reach."
    },
    {
      name: "Free Action",
      summary: "Minor narrative or functional actions (speaking, interacting with gear, etc.).",
      text: "Free Actions are small, quick activities or narrative flavor that add realism without heavy mechanics. They should remain minor and can't be stacked to gain advantage.\n\nExamples\n- Interact with Object: Open a door, press a switch, or pick up an item.\n- Quick Draw or Sheathe: Draw or stow a light weapon.\n- Short Dialogue or Signal: Speak briefly, call out a warning, or give a hand sign.\n- Glance or Check: Scan surroundings, check ammo, or glance at a display.\n- Dismiss Invocation: End a Flow effect or Invocation you are actively sustaining. Doing so releases the current safely and requires only a moment of focus.\n\nThe GM may limit Free Actions per turn if players begin using them to gain mechanical advantage beyond intent."
    },
    {
      name: "Complex Action",
      summary: "Consumes both Action and Move, so you can't trade Move for a Swift or an extra Impulse. Free Actions and your one Impulse remain. Used for continuous or powerful tasks (full defense, major channeling). Some say otherwise: Charge/Rush keeps a Swift, and Full Defense allows nothing else.",
      text: "Complex Actions require complete focus and time. They are deliberate or multi-step tasks that dominate a turn.\n\nExamples\n- Channel Major Flow: Direct or shape powerful resonance currents.\n- Fire Full-Auto: Sustain a burst or continuous fire with Heavy Weapons.\n- Complex Device Use: Execute a multi-step hack, tune sensors, or manipulate unstable tech.\n- Full Defense (Complex): Enter a total defensive stance, improving your protection at the cost of all other actions."
    },
    {
      name: "Special Action",
      summary: "Feature-driven: passive, triggered, resource-based, or embedded. Cost and timing set by the feature.",
      text: "Most features fit one of the six action types. Some don't. A Special Action is the catch-all for features, traits, resources, and triggered effects that sit outside the normal action types. A Special Action may be limited-use, resource-based, triggered by a specific event, or resolved as part of another action.\n\nA Special Action doesn't, on its own, grant an extra action. Its rules text decides when it can be used, what it costs, and whether it replaces or modifies an Action, Move Action, Swift Action, Impulse Action, Free Action, or Complex Action. When the feature text and these general rules disagree, the feature text wins.\n\nCommon Uses\n- Passive Special: Always active, or checked automatically when its trigger is relevant. No action required.\n- Resource Special: Tracks or spends a class resource such as Moxie, Flow Points, Bandwidth, or Triage. The cost comes out of that pool when the feature is used.\n- Triggered Special: Fires when a specific event occurs, such as failing a check, taking damage, becoming Bloodied, or landing an attack.\n- Limited Use Special: Can be used a set number of times before a Short Rest, Long Rest, or other listed reset.\n- Embedded Special: Modifies another action, such as adding an effect to an attack, a hack, a save, or a Flow Invocation. It resolves as part of that action, not as a separate one.\n\nSpecial Timing\n\nIf a Special Action lists no timing, the GM sets it from the feature text:\n- If the feature changes another action, resolve it as part of that action.\n- If the feature responds to a trigger outside your turn, it costs an Impulse Action unless the feature says otherwise.\n\nSpecial Limits\n\nA Special Action can't bypass the normal action limits unless it specifically says so. Trading your Move for a Swift or extra Impulse, the one Impulse per round cap, and the Complex Action restrictions all still apply.\n\nA Special Action that modifies an attack, hack, check, save, or Flow effect can only modify that one event a single time, unless the feature allows otherwise."
    }
  ],

  /* Timing, as the Player's Handbook prints it (Timing, Action Economy and Combat; the
     "Use the following terms whenever a rule calls out time" block, 19 October 2026 audit,
     core-03): Turn, Round, Scene, Encounter and Out-of-Combat Time. Each term is its own
     entry in the Codex's Initiative & the Round panel. The Round entry carries the "X rounds"
     countdown the app did not have. */
  timingIntro: "Use the following terms whenever a rule calls out time.",
  timing: [
    { name: "Turn", text: "Your Turn is your personal moment inside the Round.\n\nOn your Turn, you take your Actions, Swifts, and Impulses that are available.\n\nEffects that say \"until the start of your next turn\" end just before you act again.\n\nEffects that say \"until the end of your next turn\" last through your entire next Turn, then expire." },
    { name: "Round", text: "A Round is one full cycle of everyone in the encounter taking a Turn, roughly 6 to 10 seconds in the fiction.\n\nAnything that lasts \"X rounds\" counts down at the end of your Turn unless otherwise noted.\n\nA duration of 1 minute is treated as 10 rounds of active combat.\n\nAbilities that say \"once per round\" can benefit you one time during that Round, no matter how many Turns or Impulses you manage to squeeze in." },
    { name: "Scene", text: "A Scene is a continuous stretch of play that focuses on one situation or problem.\n\nA Scene can be a fight in a nightclub, a tense negotiation, or a stealth run through a facility.\n\nThe Scene ends when the focus clearly shifts, for example when the group escapes, changes locations, or there is a meaningful time skip.\n\nAbilities that say \"once per scene\" refresh when the current situation wraps and the story moves to a new beat." },
    { name: "Encounter", text: "An Encounter is a specific conflict that calls for structured resolution, usually combat but also intense chases or set-piece challenges.\n\nMost Encounters fit inside a single Scene, but a big set piece can stretch across more than one Scene if the fiction supports it.\n\nAbilities that say \"once per encounter\" reset when that conflict is resolved, for example when enemies break, surrender, or the chase is clearly over." },
    { name: "Out-of-Combat Time", text: "Outside strict turns and rounds, the game uses minutes (short rituals, quick searches, patching wounds), hours (travel across districts, extended repairs, rest short of a full Downtime cycle), and days (long-term projects, healing over time, investigation arcs). Common durations include 1 hour (short recovery, focused work) and 8 hours (a full sleep cycle or deep Downtime block). You don't need to track exact seconds unless the Scene drops back into combat timing." }
  ],

  tradingMove: "You may trade your Move Action for either:\n- 1 Swift Action, or\n- 1 extra Impulse Action\nThis trade can only be made once per turn. Excess Speed can't be exchanged for multiple Swift or Impulse Actions in the same round.",

  /* Attacks and Maneuvers, the part of the Player's Handbook's action chapter that covers the
     four attack verbs (19 October 2026 audit, core-06): the lead-in, Melee Attack, Unarmed
     Strikes, Ranged Attack and Throw, word for word. Shove, Trip and Grapple, the next three,
     are carried in the Movement chapter's maneuvers panel (EN.movement). `slug` keeps these
     entries off the slugs of the Common Actions rows of the same name, which the combat tab's
     Actions in Combat links resolve (ref-actions/melee-attack and the rest). */
  attacksAndManeuvers: [
    { name: "Attacks and Maneuvers",
      text: "Every fight comes down to a handful of verbs. You strike, you shoot, you throw, and when you want a body moved instead of bled, you shove, trip, or grapple. Each one is an Action, your main effort for the turn.\n\nAn attack is a d20 roll against the Target's Defense (10 + Agility Modifier + Cover + active bonuses). Meet or beat it and the hit lands. Damage comes off Vigor first, then Vitality, and any overflow goes into Wounds (see Damage Resolution). A natural 20 is a critical hit, counting as at least a Strong Hit and triggering any weapon or Invocation crit effect. A natural 1 misses outright, and the GM may decide it went wrong in some other way." },
    { name: "Melee Attack", slug: "melee-attack-rules",
      text: "A blade, a fist, a length of pipe, anything you swing or drive into a Target within your reach.\n\nRoll d20 + Body Modifier + Weapon Proficiency Bonus against the Target's Defense.\n\nReach: the adjacent space, or farther with the Reach trait (see Reach).\n\nOn a hit, deal the weapon's damage." },
    { name: "Unarmed Strikes",
      text: "You don't need a weapon to make a melee attack. A punch, kick, elbow, knee, headbutt, or similar blow counts as an unarmed strike.\n\nAn unarmed strike is a melee attack, so any effect that applies to melee attacks also applies to it. However, an unarmed strike isn't a melee weapon, so it doesn't benefit from effects that specifically require one.\n\nRoll d20 + Body Modifier + Simple Weapons Proficiency Bonus against the Target's Defense. If you are Untrained in Simple Weapons, the usual Untrained rule applies.\n\nOn a hit, deal 1 Bludgeoning damage plus your Body Modifier. Features such as claws, teeth, altered anatomy, or specialized training may replace your unarmed strike's damage die, damage type, traits, or other properties. If multiple effects set your unarmed strike to a specific damage die, choose which one you use for the attack. Its damage type, traits, and other properties replace those of any other effect unless it specifically says they are retained or combined.\n\nSome effects increase your unarmed strike's damage die instead of replacing it. That is Oomph (see Oomph +X in Gear Traits). If your unarmed strike has no damage die, its first step of Oomph gives it a 1d4. Apply Oomph after determining which effect sets the strike's damage die." },
    { name: "Ranged Attack", slug: "ranged-attack-rules",
      text: "A firearm, a bow, anything you send down a lane at a Target within its Range.\n\nRoll d20 + Agility Modifier + Weapon Proficiency Bonus against the Target's Defense.\n\nIf any enemy is adjacent to you, the shot is made with Snag (see Range).\n\nOn a hit, deal the weapon's damage. Firing modes (Single Shot, Semi-Automatic, Burst Fire, Full-Auto, Continuous) change how much ammo a shot burns and how it picks Targets (see Firing Modes)." },
    { name: "Throw", slug: "throw-rules",
      text: "A Throw sends a weapon at a Target instead of firing it. How well it flies depends on whether the thing was built to be thrown.\n\nA weapon with the Thrown trait is balanced for it: roll d20 + Body or Agility Modifier, whichever is higher, + Weapon Proficiency Bonus against the Target's Defense, out to the weapon's listed thrown range.\n\nThrowing something with no Thrown trait is a raw Athletics heave, not a weapon attack. See Improvised Weapons in Equipment for ranges, damage, and what it costs you.\n\nSome thrown weapons don't pick one Target. A grenade lands at a point you choose and forces everyone in its Area to save against your Weapon Save DC (Thrown), which uses the higher of your Body or Agility Modifier (see Weapon Save DC).\n\nA thrown weapon stays where it lands. Pick it up when the shooting stops, or carry a spare." }
  ],

  combatSequence: "1. Initiative: Roll d20 + Caliber + Agility Modifier or Wits Modifier. Highest acts first. On a tie, the character with the higher relevant modifier (Agility or Wits, whichever they used) goes first; if still tied, they roll off.\n2. Declare Intent: Choose your main Action and any Flow or tactical choices.\n3. Resolve Actions: Roll using the d20 Method.\n4. Apply Damage and Effects: Vigor → Vitality → Wounds.\n5. End of Round: Apply conditions and ongoing effects.",

  /* The Player's Handbook's Common Actions table has eight rows: the three Weapon Save DCs,
     Flow Attack, Flow Save DC, Quick Hack, Charge / Rush and Full Defense (19 October 2026
     audit, core-12). The other six rows are the app's own summaries of rules the book prints
     elsewhere (the author's ruling 10: keep them, labelled), tagged `appSummary: true`. The
     combat tab's Actions in Combat links read all fourteen, so none may leave this list; the
     Codex lists the eight book rows first and the six tagged APP SUMMARY after them, each
     under the slug of its name. */
  commonActions: [
    { name: "Melee Attack", appSummary: true, cost: "Action", text: "d20 + Body Modifier + Weapon Proficiency Bonus, Close-range weapon attack." },
    { name: "Unarmed Strike", appSummary: true, cost: "Action", text: "d20 + Body Modifier + Simple Weapons Proficiency Bonus, Fists, elbows, knees, or feet." },
    { name: "Ranged Attack", appSummary: true, cost: "Action", text: "d20 + Agility Modifier + Weapon Proficiency Bonus, Apply Snag if firing while engaged in melee." },
    { name: "Weapon Save DC (Melee)", cost: "-", text: "8 + Body Modifier + Caliber, Sets DC to resist weapon effects." },
    { name: "Weapon Save DC (Range)", cost: "-", text: "8 + Agility Modifier + Caliber, Sets DC to resist weapon effects." },
    { name: "Weapon Save DC (Thrown)", cost: "-", text: "8 + the higher of your Body or Agility Modifier + Caliber, Sets DC to resist thrown-weapon effects." },
    { name: "Flow Attack", cost: "Action", text: "d20 + Flow Modifier + Caliber, Consumes FP as defined by the Invocation; effect varies." },
    { name: "Flow Save DC", cost: "-", text: "8 + Flow Modifier + Caliber, Sets the DC for enemies to resist your Flow Invocations and effects." },
    { name: "Quick Hack", cost: "Action", text: "d20 + Tech Modifier + Systems Proficiency Bonus + Device Bonus, Disrupt, override, or support allied systems in combat." },
    { name: "Use Device / Item", appSummary: true, cost: "Action", text: "d20 (see description), Activate or manipulate gear, doors, or terminals." },
    { name: "Charge / Rush", cost: "Complex", text: "Move up to double your Speed in a straight line toward a Target, then make one melee attack against it with Edge. Must cover at least 2 spaces before you strike. As a Complex Action it spends your Action and Move; you keep your Swift, Free, and one Impulse." },
    { name: "Suppressive Fire", appSummary: true, cost: "-", text: "See Full-Auto firing mode. Use Full-Auto in Suppress mode (see Firing Modes)." },
    { name: "Full Defense", cost: "Complex", text: "Auto +2 Defense; gain Edge on all Saves until next turn. No other actions this turn." },
    { name: "Help Action", appSummary: true, cost: "Action / Impulse", text: "Assist check vs DC 15; on a success grant +2 (Proficient), +3 (Expertise), or +4 (Mastery). See Help Action. Must have plausible positioning and relevant skill or tool. If used as an Impulse, it forfeits your upcoming Action." }
  ],

  // Mystique or Tech, set by subclass: the author's decision 12 (2026-10-16), the Shaper launches with two subclasses
  flowModifierNote: "Each Flow-using class is tied to one Attribute: Mystique or Tech, set by subclass. That Attribute is your Flow Attribute, and its modifier is your Flow Modifier. You use your Flow Modifier for all Flow Attacks and Flow Attribute Checks, and to set your Flow Save DC.",

  defense: "Your Defense measures your ability to avoid, deflect, or absorb incoming harm. It blends agility, awareness, protective gear, and the advantages of cover.\n\nDefense = 10 + Agility Modifier + Cover + Active Defense Bonuses",

  /* As the Player's Handbook prints it (Active Defenses; r5, 17 October 2026). The intro paragraph
     carries the budget sentence ("You can use one Active Defense per round, or two if you traded
     your Move Action for a second Impulse.", round 2 rulings, section 4) and then the book's Resurge
     and Siphon FP and Overdraw sentences, which replace the app-made "The Cost:" line those two
     entries used to carry. The Limit bullet is the book's ("one defensive Impulse per attacking
     Enemy's turn"), and the lead-in ends in the book's colon. Intercept is an Impulse but not a
     defense: it spends the round's Impulse budget (the Impulse Action text above) and does not
     count toward the per-attacker Limit. */
  activeDefenseRules: "Armor will only take you so far. When a hit is locked in and about to break bone, survival comes down to your reflexes. Active Defenses allow a Character to burn an Impulse Action to intercept, deflect, or absorb incoming damage before it depletes their health pools. You can use one Active Defense per round, or two if you traded your Move Action for a second Impulse. Resurge and Siphon each cost 1 FP on top of the Impulse Action. Using either at 0 FP counts as an Overdraw of 1 FP: you still resolve the defense, and you lose 1d4 Vitality (1d6 at Strain Stage 3 or higher) and gain 1 Strain point.\n\nThe Core Rules of Active Defense:\n- The Trigger: You may declare an Active Defense immediately after an Enemy's attack successfully meets or beats your Defense score, but before the final damage is applied to your Vigor or Vitality.\n- The Cost: It costs 1 Impulse Action (your reaction).\n- The Limit: A Character may only use one defensive Impulse per attacking Enemy's turn, regardless of how many total Impulse actions they have generated. You can't spam defenses against a single, rapid-striking opponent.\n\nIf you meet the equipment requirements, you may choose one of the following defensive maneuvers:",

  activeDefenses: [
    /* Every entry below is the Player's Handbook's fields as printed (r5, 17 October 2026): no flavor
       line and no Player Advice, which the book no longer prints. Block's Effect is the book's ("Prevent
       that much of the incoming damage"); the Plated trait's own text says what Plated adds. */
    {
      name: "Block",
      cost: "1 Impulse Action",
      requirement: "Shield, Block Bonus, or Plated armor",
      trigger: "Physical attack damage",
      text: "- Requirement: A physical Shield, armor with a listed Block Bonus, or armor with the Plated trait.\n- Trigger Limit: Physical attack damage.\n- The Effect: Roll your Shield's Block die (if you carry one) and add your armor's flat Block Bonus and any other Block benefits you have (the Plated trait, Block-boosting mods). Prevent that much of the incoming damage."
    },
    /* Brace, as the Player's Handbook prints it (Active Defenses): two lines, Trigger Limit and
       The Effect, and no Requirement, so every Freelancer can use it (the author's correction of
       17 October 2026: the "Requirement: none" of the round 3 handoff was an explanation, not book
       text). No flavor line and no Player Advice, as printed. A defensive Impulse like the rest:
       the budget and the per-attacker Limit in the rules above apply to it, and the Defend panel
       rolls it. */
    {
      name: "Brace",
      cost: "1 Impulse Action",
      requirement: "-",
      trigger: "Falls, collisions, explosions, or forced impact",
      text: "- Trigger Limit: Falls, collisions, explosions, or forced impact.\n- The Effect: Roll 1d10 + Body Modifier and subtract the result from the incoming damage."
    },
    {
      name: "Dodge",
      cost: "1 Impulse Action",
      requirement: "-",
      trigger: "Melee or non-ballistic physical",
      text: "- Trigger Limit: Can only be used against Melee or non-ballistic physical attacks (unless explicitly enhanced by a Flow feature or specific gear). The GM may rule a Freelancer can't Dodge while wearing Heavy Armor or while Grappled or Restrained.\n- The Effect: Add your Agility Modifier + your Acrobatics Proficiency Bonus to your Defense score against this specific attack. If this retroactive bonus raises your Defense higher than the incoming attack roll, the attack misses, and you may immediately shift 1 space into an adjacent unoccupied space."
    },
    {
      name: "Parry",
      cost: "1 Impulse Action",
      /* The three bullets as printed, 16 October handoff: Signature Weapon is gone from the
         Requirement, the Trigger Limit takes thrown attacks, the Effect rolls the die Oomph
         included, and the dual-wield sentence moved into the Effect, so the old Tactical Note
         that carried it is dropped. The opening flavor sentence went with the rest (r5, 17 October
         2026): the book prints none. */
      requirement: "Simple or Martial Weapon, physical Shield, or bare hands",
      trigger: "Melee or thrown attacks",
      text: "- Requirement: Must have a Simple Weapon, Martial Weapon, or physical Shield equipped, or be fighting unarmed.\n- Trigger Limit: Can only be used against Melee or thrown attacks.\n- The Effect: Roll your equipped weapon's damage die, Oomph included (e.g., a d8 for a standard longsword), or your unarmed strike damage if your hands are what you brought. Subtract the result directly from the raw incoming damage. If you are dual-wielding, choose which weapon you parry with and roll its damage die."
    },
    {
      name: "Resurge",
      cost: "1 Impulse Action + 1 FP",
      requirement: "Attuned",
      trigger: "Flow-based attacks or Invocations",
      text: "- Requirement: Must be attuned to the Flow.\n- Trigger Limit: Can only be used against Flow-based attacks or Invocations.\n- The Effect: Roll your Resilience Die and subtract the result from the raw incoming damage. If this reduces the incoming damage to 0, the Flow effect rebounds; the attacker immediately takes Resonant damage equal to your Flow Modifier (minimum 1)."
    },
    {
      name: "Siphon",
      cost: "1 Impulse Action + 1 FP",
      requirement: "Attuned",
      trigger: "Elemental or Flow-based damage",
      text: "- Requirement: Must be attuned to the Flow.\n- Trigger Limit: Can only be used against Elemental (Fire, Cold, Electric) or Flow-based damage.\n- The Effect: Roll your Resilience Die and subtract the result from the raw incoming damage. You immediately restore Vigor equal to the exact amount of damage negated by this roll."
    },
    {
      name: "Ward",
      cost: "1 Impulse Action",
      requirement: "Warding Focus or Class Feature",
      trigger: "Any standard damage",
      text: "- Requirement: Must have an equipped Warding Focus or possess an active Shaper class feature.\n- Trigger Limit: Any standard damage.\n- The Effect: Roll your class's Resilience Die and subtract the result directly from the raw incoming damage. Ward costs no FP."
    }
  ],

  defenseNotes: "Defenses prevent direct harm but may not block secondary effects. Bleeding, Burning, Poisoned, and other conditions often bypass armor and partial defenses if the source is elemental, toxic, or metaphysical. If a defense meaningfully intercepts the cause (impact, energy, or Flow), it negates the effect; otherwise, the condition applies.",

  coverIntro: "Cover is environmental protection between you and a source of harm. It makes you harder to hit, but by default it does not reduce damage once an attack connects.\n\nUse cover whenever a solid object is between attacker and defender.",

  cover: [
    {
      name: "Half Cover",
      effect: "You are roughly half hidden behind solid objects such as crates, railings, desks, or door frames.\n- You gain a +2 bonus to Defense against attacks coming from the far side of the cover, and a +2 bonus to Agility saving throws against area effects from that same side. The cover only helps when it stands between you and the source."
    },
    {
      name: "Three-Quarter Cover",
      effect: "Most of your body is hidden behind sturdy objects such as large machinery, pillars, reinforced furniture, or vehicle frames.\n- You gain a +5 bonus to Defense against attacks coming from the far side of the cover, and a +5 bonus to Agility saving throws against area effects from that same side. The cover only helps when it stands between you and the source."
    },
    {
      name: "Total Cover",
      effect: "You are fully hidden and can't be targeted directly by attacks that require line of sight. An area effect that can't reach around the cover doesn't affect you at all. As with Half and Three-Quarter Cover, this protection holds only while the cover stands between you and the source. A source that has moved around it to a clear line on you is no longer blocked. See Cover and Defense.\n- You can't attack targets you can't see, unless an effect explicitly allows blind targeting or ignores line of sight.\n- Effects that ignore line of sight also ignore Total Cover."
    }
  ],

  coverAndDefense: "Cover shields you from an area effect only when it stands between you and where the effect comes from. For a blast, that is the space where it detonates. When the cover sits in that line, its bonus applies to your Agility saving throw just as it applies to your Defense: +2 for Half Cover, +5 for Three-Quarter. When the blast reaches you by any other path, an airburst from overhead or a Wall-to-Wall rebound that fills the room from every side, the cover isn't in its path and grants nothing.\n\n- Cover bonuses apply to Defense before any Defensive Impulse (Dodge, Block, Parry, Ward, etc.) is declared.\n- If you leave cover during your turn, you lose its benefits until you are back behind cover.\n- Attacks with Area, Explosive, or certain elemental effects may still affect a character behind cover if the blast or effect reasonably reaches them.",

  lineOfSight: "You have line of sight if you can trace a reasonable line from your space to the target without passing through a solid, opaque obstacle.\n- If there is no clear line, the target effectively has Total Cover from that attacker.",

  obscurement: "Some things block sight but not bullets.\n- Examples: smoke, fog, darkness, holographic haze\n- Obscurement does not grant Defense bonuses by itself.\n- Instead, it typically imposes Snag on attacks that depend on sight and can grant Edge on Stealth checks.\n\nA barrier can be both Cover and Obscurement if it is solid and vision blocking.\n\nLightly obscured areas impair visibility without blocking line of sight; use the Snag and Stealth guidance above. Heavily obscured areas block line of sight into, out of, or through them. A Target blocked from view by such an area has Total Cover only against targeting that requires that line of sight. Obscurement alone doesn't block damage or area effects that can reach the Target, and grants no Defense or Agility Save bonus. An effect that explicitly sees through or ignores that obscurement uses its own rules.",

  /* Tremor Sense, added under Line of Sight and Obscurement on 2026-09-28.
     Carried as its own block, after Obscurement, because the book gives it its own heading
     there. Reference prose: the sense itself is granted by features (see SENSE_GRANTS in
     engine.js) and each one states its own range. */
  tremorSense: "You read vibrations through concrete, soil, metal, or liquid to pinpoint nearby beings and moving objects within the range granted by your feature or equipment. You and whatever you're detecting must touch the same continuous surface or share the same body of liquid. Walls and floors don't prevent detection if that connection holds.\n\nTremor Sense can't detect airborne or incorporeal Targets. It reveals location, not appearance, and doesn't count as sight for effects that require you to see a Target.",

  destructibleCover: "Destructible Cover\n\nCover in Elysium is not permanent. Sustained fire chews through it, explosives erase it, and the wall that saved you last round can be rubble by the next.\n\nEach discrete section of solid cover (roughly a 1 space section that is actually protecting someone) has two values:\n- Structure: a damage threshold.\n- Integrity: how much punishment that section can take before it is destroyed.\n\nA body wider than one space can be behind more than one section. Each is tracked on its own, and losing one drops that body a cover grade instead of stripping its cover outright.\n\nStructure\n- If an attack's damage is less than Structure, that section takes no damage from that hit.\n- If damage is equal to or higher than Structure, that section takes the full rolled damage to its Integrity.\n\nIntegrity\n- When Integrity reaches 0, that section is destroyed and no longer provides cover.\n- The wreckage can linger as scenery, but it grants no mechanical Cover.",

  /* The general rule that closes the "my Invocation says it melts things, so it melts
     things" exploit. It governs EVERY effect, not one ability: one damage path for
     objects whatever the source, a stated material ceiling for effects that deal no
     damage, and armor as DR only. The last line is the override switch, so a feature
     bypasses this only where its own text says so. Sits between Integrity and Overflow
     Damage in print, and sits between them here. */
  effectsAndObjects: "Effects and Objects\n\nEffects don't automatically destroy objects just because their description says they burn, melt, dissolve, shatter, or otherwise damage them. If an effect deals damage, resolve it against an object the same way you would any other source of damage. If the damage equals or exceeds the object's Structure, the object takes the full rolled damage to Integrity. If it doesn't meet the Structure threshold, the object takes no damage.\n\nIt doesn't matter whether that damage came from a shotgun, an explosive, or a Flow Invocation. Objects use the same rules for all of them.\n\nIf an effect doesn't deal damage, its description instead states the highest material category it can destroy, or names the specific materials it works on. It can affect objects of that category or lower, but not anything tougher. A corrosive gel rated to eat through Cheap materials, for example, can't burn through a Fortified door no matter how long it is applied.\n\nArmor works differently. Armor has no Structure or Integrity; it only has DR. If an effect damages or degrades armor, it reduces that DR by the amount stated in the effect until the armor is repaired.\n\nA feature only overrides these rules if its description specifically says that it does.",

  /* Vehicles map onto the table above by their own Structure, which was undefined until
     2026-08-24. The mapping is free: every printed vehicle Structure is already a Cover
     Material value. Reference prose, because the app does not model cover as a live
     tracker for anything, vehicles included; see DEFERRED-FIXES. */
  vehiclesAsCover: "Vehicles as cover\n\nA Freelancer sheltering behind a vehicle uses the Cover Material Table as normal. Use the vehicle's Structure to determine the row: 7 Cheap, 9 Average, 11 Heavy, 14 Fortified, 18 Hardened. An Armored vehicle always counts as Hardened because that trait sets its Structure to 18.\n\nThe cover section uses that row's Integrity, not the vehicle's full Integrity. A Cargo Hauler might have 80 Integrity as a vehicle, but the panel you are crouched behind has only 18 Integrity as cover.\n\nAny damage dealt to that cover section also comes off the vehicle's own Integrity. One hit, both ledgers. You can hide behind the sedan all afternoon; the sedan will remember.\n\nA trait can specify a different Cover Material row for part of a vehicle. For example, a braced Walker gives allies behind its legs Heavy cover, one step below the Hardened hull beside them.",

  coverMaterials: [
    { category: "Intangible", structure: 0, integrity: 0, meaning: "No physical protection. Obscures vision only.", examples: "Smoke, fog, darkness, holographic haze" },
    { category: "Fragile", structure: 5, integrity: 3, meaning: "Almost anything will punch through in one or two hits, even light pistols. Mostly concealment.", examples: "Standard glass, thin plastic panels, flimsy plaster, cardboard stacks, cheap signage" },
    { category: "Cheap", structure: 7, integrity: 8, meaning: "Slows bullets but doesn't stop sustained fire. Pistols chew through quickly, rifles punch through reliably.", examples: "Drywall, hollow core doors, cubicle walls, thin sheet metal, fiberboard barricades" },
    { category: "Average", structure: 9, integrity: 12, meaning: "Good emergency cover. Pistols sometimes fail to breach on low rolls; rifles and SMGs reliably damage it and will destroy it over a few volleys.", examples: "Solid wood doors, flipped desks, shipping crates, residential exterior walls, standard vehicle doors and body panels" },
    { category: "Heavy", structure: 11, integrity: 18, meaning: "Real protection against small arms. Pistols mostly bounce unless damage rolls are strong; rifles and heavy weapons do the real work.", examples: "Brick walls, concrete pillars, large trees or utility poles, structural metal columns, industrial machinery, cargo containers" },
    { category: "Fortified", structure: 14, integrity: 24, meaning: "Built to stop regular guns. Pistols are basically useless. Rifles may chip it with strong hits. Heavy weapons and explosives are the reasonable way to break it.", examples: "Reinforced concrete, security doors, sandbag lines, ballistic glass, reinforced vehicle bodies, secured checkpoints" },
    { category: "Hardened", structure: 18, integrity: 40, meaning: "Designed for war. Small arms bounce. Only heavy weapons and serious explosives can reliably crack it.", examples: "Armored vehicles, vault doors, bunker walls, blast shields, high-grade safes, military-grade fortifications" }
  ],

  overflowDamage: "If an attack destroys the cover protecting a character:\n- Any damage that reduces Integrity below 0 becomes overflow damage.\n- Apply that overflow directly to the protected character.\n- The character does not get an additional Defense or Defensive Impulse against the overflow, but still applies armor, Damage Reduction, and Resistances as normal.",


  attackResolution: "All attacks in combat use the d20 Method. Dice Pools are never used for attack rolls or Saving Throws.\n\n1. Declare Attack Type:\n- Choose melee, ranged, or Flow attack.\n- Apply situational effects (Aim, Edge, etc.).\n\n2. Make the Attack Roll:\n- Roll d20 + Attribute Modifier + Weapon Proficiency Bonus (Systems Proficiency Bonus and Device Bonus for Quick Hacks) + situational modifiers.\n- Apply Edge or Snag as appropriate.\n\n3. Determine Defense:\n- Defense = 10 + Agility Modifier + cover + active bonuses.\n\n4. Compare Totals:\n- If Attack ≥ Defense, the hit lands.\n- Compute Margin = Attack Total - Defense.\n\n5. Apply Damage:\n- Roll weapon or ability damage.\n- Subtract from Vigor, then Vitality.\n- Overflow becomes Wounds.\n\n6. Criticals:\n- Natural 20: Critical success on the attack; treat as at least a Strong Hit and apply any weapon or Invocation critical effects.\n- Natural 1: Automatic miss and a possible narrative mishap at GM discretion.",

  attackMargins: [
    { margin: "+10 or more", result: "Dominant Hit", outcome: "+1d6 damage or apply a strong weapon effect (disarm, knockdown, rupture, etc.)." },
    { margin: "+5 to +9", result: "Strong Hit", outcome: "Full damage; optional condition if fictionally justified." },
    { margin: "0 to +4", result: "Standard Hit", outcome: "Normal damage." },
    { margin: "-1 or less", result: "Miss or Graze", outcome: "No direct damage, but may cause minor setback or tension shift." }
  ],

  shieldsAndCover: "Some shields create Cover on top of their Block bonus and static Defense bonus. A Riot Shield grants Half Cover while you are using Full Defense; a Ballistic Bulwark grants Three-Quarter Cover while you are using Full Defense. These use the same Cover rules as terrain. You do NOT track Structure and Integrity for shield cover; shield wear and tear is handled by Shield Durability.",
  /* LONG-SHAFTED, which the manuscript made a formal frame category on 2026-08-12.
     Part 3's Weapon Parts glossary: "Fits: a hard frame gate. Most Parts fit a broad
     category, such as Any Melee ... Others require a specific frame: Longarm, Shotgun,
     Sidearm, Shotgun, Semi-Auto Firearm, Bladed, Long-Shafted, Compound, Crossbow, or
     Two-Handed Melee." It gates two things:
     the Extended Shaft mod ("Fits: Long-Shafted (Quarterstaff, Spear, Halberd)") and
     Staff & Spear Master, whose every clause reads "long-shafted weapon".

     THE CATALOG'S OWN `shafted` FLAG IS THE AUTHORITY. This list is only consulted for an
     item that states nothing either way, and it exists because Brandon named five weapons
     on 2026-08-12 that the book does not carry yet: "add them to the list for future
     potential expansion just in case they ever comes into play". A future catalog entry
     for a Pike is long-shafted the day it lands, without anyone remembering the flag, and
     an entry that explicitly says `shafted: false` still overrules this. */
  longShaftedNames: [
    // in the book today, and flagged in the catalog
    "Quarterstaff", "Spear", "Halberd", "Arc Glaive",
    // not in the book: reserved so an expansion cannot land silently unshafted
    "Glaive", "Trident", "Harpoon", "Naginata", "Pike", "Polearm"
  ],
  /* How far Reach can be pushed. A weapon's own Reach plus everything a character
     adds to it (Canopy Reach, Staff & Spear Master's Upgrade, an Extended Shaft) is
     capped by what the weapon physically is: a rigid shaft or blade only extends so
     far before it stops being swingable, while a lash or a filament pays out.
     The cap is on REACH POINTS, not on the spaces displayed, so a rigid weapon at the
     cap strikes 3 spaces (1 adjacent + 2) and a flexible one strikes 4.
     In the manuscript as of 2026-08-11, in the Reach section of Part 2 and again in
     the Reach X gear trait: "If a part, mod, or effect would increase a weapon's Reach
     beyond its cap, its Reach increases only to that cap and any excess is lost. A
     feature can exceed this cap only if its own text specifically says so."
     Exactly one feature says so today, Canopy Reach, and the engine applies it after
     the cap for that reason. */
  reachCap: { rigid: 2, flexible: 3 },
  reachCapText: "Reach caps by construction: Reach 2 for rigid weapons (blades, blunt weapons, anything mounted on a shaft) and Reach 3 for flexible weapons (whips, cables, filament lines). A part, mod, or effect that would push past the cap raises Reach only to the cap and the excess is lost. A feature can exceed the cap only if its own text says so.\n\nAdjacent enemies don't interfere with Reach attacks, and you take no penalty for using a Reach weapon against an adjacent Target. You may also attack over or through a space occupied by an ally or enemy. However, anyone standing between you and the Target partially obstructs the attack, granting the Target Half Cover against it (see Cover).",

  shieldDurability: "A shield has Durability boxes, usually 3, though some gear may have more or fewer. Its Wear Threshold equals twice the maximum result of its Block die: 8 for a 1d4 shield, 12 for a 1d6 shield, or 16 for a 1d8 shield.\n\nWhenever you Block an attack whose raw damage equals or exceeds the shield's Wear Threshold, mark off 1 Durability box. Raw damage is the attacker's rolled damage before applying your Block or Armor DR. A critical hit always marks off 1 box when Blocked, regardless of its damage.\n\nDamage below the Wear Threshold doesn't wear down the shield; absorbing smaller hits is what it was built to do. As long as the shield has at least 1 Durability box remaining, it can be restored through a normal Repair Project.\n\nAt 0 boxes, the outcome depends on the shield:\n- Physical: the shield is destroyed. It grants no Defense bonus, no Block, and no Cover, and is beyond repair, but the wreck counts as salvage (see Crafting and Projects) that can reduce or eliminate the material cost of a later repair or build.\n- Emitter or hard-light: the boxes track projector overload rather than physical wear, so it goes dark instead. It grants nothing until it resets or is repaired. It isn't destroyed and leaves no salvage.",
  /* Step 2 of the pipeline is the Player's Handbook's "Active Mitigation (Impulse)" as batch 52
     prints it (17 October 2026): the step applies the Impulse budget and the one-defense-per-
     Enemy-turn cap together. The app keeps no spent state, so the Defend panel states both
     limits (DEF_LIMIT_NOTE in js/combat.js) and enforces neither. */
  damagePipeline: "When a Target is targeted by an attack or damaging effect, follow these four steps in order:\n\n1. Determine the Hit (Avoidance)\n- Compare the incoming Attack Roll to the Target's Defense score (Cover is already calculated into the base score).\n- Evasion: At this exact moment, the Target may spend an Impulse Action to Dodge, retroactively boosting their Defense score. If this causes the attack to miss, the pipeline ends immediately.\n- If the attack roll still equals or exceeds the final Defense score, it hits. The raw damage is the weapon's dice plus the same Attribute Modifier the attack roll used.\n- Indirect delivery (a grenade, a launcher shell) adds no Attribute Modifier, and neither do cipher, Flow, or Tech effects unless their own text grants one.\n\n2. Active Mitigation (Impulse)\n- If the attack hits, the Target may spend a defensive Impulse now, if their Impulse budget allows it and they haven't already used one during this Enemy's turn, to use Block, Parry, Ward, Resurge, Siphon, or Brace.\n- Roll the defense's corresponding die and subtract the result, plus any flat bonuses the defense carries (a suit's Block Bonus, the Plated trait), directly from the raw incoming damage. Resolve any secondary effects of the defense immediately (such as Siphon restoring Vigor, or Resurge dealing rebound damage).\n\n3. Passive Mitigation (Armor DR)\n- Subtract the defending Target's Armor Damage Reduction (DR) from the remaining damage.\n- Some damage types (like Force (Spatial) or Psychic) may ignore standard physical DR entirely. Then apply Resistance or Vulnerability to what's left: halve it (rounded down) for a Resisted type, double it for a Vulnerable one. Example: 14 Fire damage minus a Block roll of 3 and DR 2 leaves 9; Fire Resistance halves it to 4, and that 4 comes off Vigor first.\n\n4. Apply Damage (Depletion)\n- Apply the final damage total to the Target's health pools in the following order:\n- Vigor: Subtract damage from Vigor first.\n- Vitality: Any leftover damage spills directly into Vitality.\n- Wounds: Reducing Vitality to 0 triggers 1 Fatigue and the Bloodied condition, not a Wound by itself. Damage left over after that is Wound damage: it comes off your Wounds and lowers your maximum Vitality by the same amount, then you make the Body Save against Wound damage (see Wound Effects).",

  /* OOMPH under Damage Resolution, for the Codex (ref-damage): the book's one-paragraph pointer
     (Player's Handbook, 24 October 2026 export), since the full rule moved to the Oomph +X Gear Trait
     (EN.gearCatalog.weaponTraits["Oomph +X"]); the author's ruling of 24 October, section 9, item 9.
     The engine math is engine.js stepDieInfo / oomphFor.
     oomphNoDie is the author's ruling the handoff states beside it, kept apart so it is never
     passed off as book text. */
  oomph: "Some things make a hit land heavier without changing what it is: a weighted head, a longer barrel, brass over the knuckles, a lesson learned the hard way. That's Oomph: each point steps a damage die up one size. The full rule is under Oomph +X in Gear Traits.",
  oomphNoDie: "An unarmed strike with no damage die gets 1d4 from its first step of Oomph.",

  damageTypeRules: "Every attack, hazard, or Invocation deals damage of one or more damage types. A damage type is what the damage actually is in the fiction: fire on the skin, current through the spine, decay eating outward, cells screaming and dividing.\n\nIt also tells you how the damage interacts with Resistance, Vulnerability, and Immunity.\n- Resistance: A Target with Resistance to a damage type takes half damage (rounded down) from that type. Multiple sources of Resistance to the same type don't stack.\n- Vulnerability: A Target with Vulnerability to a damage type takes double damage from that type. Multiple sources of Vulnerability to the same type don't stack.\n- Immunity: A Target with Immunity to a damage type takes no damage from that type. Multi-type attacks may still deal their other damage types normally.\n\nCancellation: Resistance and Vulnerability to the same damage type cancel each other; the Target takes normal damage. Immunity overrides both.\n\nA damage type on its own doesn't ignite, freeze, stun, or apply conditions. Those effects come from the attack, weapon, or Invocation delivering the damage. A flamethrower sets people on fire because the flamethrower says so. The Fire damage type just deals Fire damage.",

  /* The Player's Handbook's Damage Type Sources list (19 October 2026 audit, core-17): its
     lead-in line, and each type's `sources` below, word for word. The Codex prints a
     "Sources:" line under each type. Nonlethal is the Handbook's entry as printed (core-09):
     a Target that would drop to 0 Vitality instead falls Unconscious, with no 1 Vitality
     floor and no "is Stable". */
  damageSourcesIntro: "For quick lookup, here are the most common sources of each damage type that PCs are likely to encounter or wield:",
  /* The Handbook's sentence on optional damage Effects, whole, from the Damage Types
     introduction (core-08, 19 October 2026 audit: the app's note used to say they "live in
     the Game Master's Toolkit", a line the book no longer prints). Printed under the types. */
  optionalEffectsNote: "Some tables add optional damage Effects (Ignite, Bleed, Mutating, Reversal, and the rest); your GM will say if yours does. They ride on a specific weapon, Invocation, or hazard, never on a damage type in general, and that source's own text calls for them.",
  damageTypes: [
    { name: "Nonlethal", group: "Standard Physical", text: "Shock Batons, riot munitions, concussive rounds, low-amplitude shocks. Nonlethal damage represents non-killing force designed to subdue rather than destroy. A Target that would be reduced to 0 Vitality by Nonlethal damage instead falls Unconscious.", sources: "Shock Batons, riot munitions, knockout darts" },
    { name: "Ballistic", group: "Standard Physical", text: "Bullets, slugs, flechettes, shrapnel. The standard damage type for unaugmented firearms and shrapnel explosives.", sources: "Pistols, rifles, SMGs, shrapnel grenades" },
    { name: "Piercing", group: "Standard Physical", text: "Knives, rapiers, spears, spikes, needle weapons. Damage that concentrates force into a pinpoint to penetrate flesh or material.", sources: "Knives, spears, spike weapons, armor-piercing rounds" },
    { name: "Bludgeoning", group: "Standard Physical", text: "Hammers, batons, clubs, impact maces, falls. Damage from physical mass moving with momentum: a wielded weapon, a thrown body, a falling beam.", sources: "Hammers, batons, falls, thrown objects" },
    { name: "Slashing", group: "Standard Physical", text: "Swords, sabers, axes, whips, claws. Damage that cuts and opens flesh.", sources: "Swords, axes, claws, monofilament blades" },
    { name: "Acid", group: "Elemental", text: "Corrosive chemicals, dissolving sprays, caustic rounds. Damage that breaks down matter at a chemical level.", sources: "Corrosive grenades, industrial spills, exotic ammo" },
    { name: "Cold", group: "Elemental", text: "Cryo emitters, frost edges, ice-based Invocations. Damage from extreme reduction of molecular motion.", sources: "Cryo weapons, Thermal Invocations, environmental exposure" },
    { name: "Fire", group: "Elemental", text: "Flamethrowers, incendiary ammo, plasma wash, burning Invocations. Damage from rapid combustion and heat.", sources: "Flamethrowers, incendiary rounds, Thermal Invocations" },
    { name: "Electric", group: "Elemental", text: "Shock batons, tasers, arc weapons, EM bursts. Damage from focused electrical current.", sources: "Tasers, shock weapons, Electromagnetic Invocations" },
    { name: "Sonic", group: "Elemental", text: "Sound cannons, resonance blades, vibration pulses. Damage from concentrated acoustic or vibrational force.", sources: "Flashbangs, weaponized audio, vibration blades" },
    { name: "Force", group: "Elemental", text: "Concussive blasts, gravity hammers, telekinetic impacts, Spatial Shearing. Damage from pure shaped pressure with no physical object behind it; gravity, telekinesis, kinetic shaping, dimensional shear.", sources: "Kinetic Invocations, gravity weapons, Spatial Shearing" },
    { name: "Energy", group: "Elemental", text: "Lasers, particle beams, hard-light, exotic directed energy. Damage from concentrated coherent light or particle streams.", sources: "Lasers, particle beams, hard-light weapons" },
    { name: "Radiation", group: "Exotic and Thematic", text: "Irradiated zones, leaking reactor cores, depleted uranium munitions. Damage from ionizing particle exposure that breaks down cells at a molecular level.", sources: "Reactor leaks, DU rounds, irradiated terrain" },
    { name: "Entropy", group: "Exotic and Thematic", text: "Decay, unraveling, time wear, reality breakdown. Damage that erodes matter and pattern. The metaphysical opposite of Genesis.", sources: "Temporal Invocations (acceleration), Null Scar exposure, relic weapons" },
    { name: "Genesis", group: "Exotic and Thematic", text: "Forced growth, overproliferation, unwanted regeneration, regression to raw potential. Damage that imposes new pattern on a Target faster than they can process it. The metaphysical opposite of Entropy.", sources: "Temporal Invocations (reversal), select Visceral Empowered Effects, rare relic weapons, certain Anomalies" },
    { name: "Psychic", group: "Exotic and Thematic", text: "Telepathy, mind spikes, fear blasts, psionic storms. Damage that bypasses physical structure and attacks the mind directly. Psychic damage automatically deals 0 damage against Targets that lack consciousness; mindless Drones, Vehicles, and non-sapient Constructs. Clankers and other sapient Constructs possess full consciousness and are valid Psychic targets.", sources: "Cognitive Invocations, psionic threats, crowd-scale mind effects" },
    { name: "Toxic", group: "Exotic and Thematic", text: "Poisons, venoms, nano toxins, gas, disease. Damage from substances introduced into a Target's biological or chemical systems.", sources: "Poison weapons, gas, Visceral Resonance, bio-hazards" },
    { name: "Resonant", group: "Resonant and Tech", text: "Raw Flow impact, resonance backlash, metaphysical disruption. Damage that threatens Shapers, Flow constructs, Mystech devices, and anything attuned to the Flow.", sources: "Flow backlash, Anomaly exposure, resonance-tuned weaponry" },
    { name: "Tech", group: "Resonant and Tech", text: "Data corruption, EM inversion, viral code, system overload. Damage that targets devices, drones, cyberware, active Links, smart weapons, and Smartdecks. Deals 0 damage to Unattuned Characters with no cybernetic augmentations or #GRID-linked gear.", sources: "Quick Hacks, EM bursts, Codebreaker abilities, viral malware" }
  ]
};
