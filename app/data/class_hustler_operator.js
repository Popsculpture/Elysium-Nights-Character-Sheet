window.EN = window.EN || {};
EN.classes = EN.classes || {};

// Leverage Abilities as structured sub-entries: the single source for the engine, the Class-tab
// picker, and the print sheet. The Leverage feature's prose (below) is composed from this list,
// so the displayed text and the machine-readable data can never drift apart. The Hustler learns
// two at Level 1 and two more at Level 5 via Expanded Leverage; unless noted each costs 1 Leverage.
var HUSTLER_LEVERAGE_INTRO = "The Hustler does not rely on the Flow or brute strength. They rely on **Leverage**: tactical callouts, psychological pressure, and split-second openings.\n\n**Your Leverage Pool**\n\nYour maximum Leverage equals your **Caliber + your Charm Modifier** (minimum 1). You regain all spent Leverage at the end of a Short or Long Rest.\n\n**Leverage Abilities**\n\nAt 1st Level, you learn two Leverage Abilities. You learn two additional Leverage Abilities at 5th Level through Expanded Leverage. Unless otherwise noted, all Leverage abilities cost 1 Leverage to activate.";
var HUSTLER_LEVERAGE_ABILITIES = [
  { name: "Pressure Play", action: "Action", cost: 1, text: "Target one enemy you can see within 12 spaces. The next attack made against that enemy before the start of your next turn gains **Edge**. If the attack hits, it deals additional damage equal to your Caliber." },
  { name: "Backchannel", action: "Impulse Action", cost: 1, text: "Trigger: An ally within 6 spaces fails a d20 check. That ally may immediately reroll the d20 but must keep the new result." },
  { name: "Exit Strategy", action: "Swift Action", cost: 1, text: "Target yourself or one ally within 12 spaces who can hear or see you. The target immediately moves up to their Speed as a free action without provoking Opportunity Attacks." },
  { name: "The Shell Game", action: "Impulse Action", cost: 1, text: "Trigger: An enemy targets you with an attack. Force the attacking enemy to target another Target of your choice (friend or foe) within the attack's range or reach. The attacker rolls that attack with **Snag**." },
  { name: "Eye on the Prize", action: "Swift Action", cost: 1, text: "Target yourself or one ally within 12 spaces. The target may immediately roll a Save to end one negative condition currently affecting them (such as Dazed, Staggered, or Bleeding)." },
  { name: "Dirty Laundry", action: "Action", cost: 1, text: "Target one enemy within 12 spaces. Until the start of your next turn, that enemy's Defense is reduced by your Charm Modifier (minimum 1) and they cannot benefit from Cover." },
  { name: "Cause a Scene", action: "Action", cost: 1, text: "Choose a point you can see within 12 spaces. Every enemy within 2 spaces of that point must make a Wits Save (DC = 8 + your Charm Modifier + your Caliber). On a failure, they roll with Snag on attack rolls until the start of your next turn." },
  { name: "Vanishing Act", action: "Swift Action", cost: 1, text: "You immediately move up to half your Speed without provoking Opportunity Attacks. Until the start of your next turn, attacks against you roll with Snag." }
];
var HUSTLER_LEVERAGE_TEXT = HUSTLER_LEVERAGE_INTRO + "\n\n" + HUSTLER_LEVERAGE_ABILITIES.map(function (a) {
  return "**" + a.name + " (" + a.action + "):** " + a.text;
}).join("\n\n");

EN.classes.hustler = {
  key: "hustler",
  name: "Hustler",
  tagline: "You are the tactical pulse of the crew, dictating the reality of every engagement. You thrive in the spaces between words and bullets, manipulating the battlefield by weaponizing psychology, leveraging black market assets, and exploiting the predictable flaws of your enemies. You do not fight fair; your goal is to orchestrate the conflict so completely that the opposition defeats themselves before the first shot is even fired. You are the voice on the comms making sure every risk pays out.",
  vitality: {
    text: "Resilience Die: d6\nStarting Vitality: 6 + Body Modifier\nVitality Per Level: 1d6 + Body Modifier"
  },
  resilience: {
    text: "Resilience Die: d6\nStarting Vitality: 6 + Body Modifier\nVitality Per Level: 1d6 + Body Modifier"
  },
  attributePriorities: [
    "Charm (Primary): Drives your Leverage pool, Persuasion, and Deception to manipulate both social encounters and the tactical action economy.",
    "Wits (Secondary): Fuels Intuition to read motives and Perception to constantly assess the shifting battlefield.",
    "Agility (Tertiary): Boosts your Speed and Defense, keeping you mobile and out of the direct line of fire while you direct the squad."
  ],
  saveFocus: "Charm and Wits",
  resource: {
    name: "Leverage",
    attribute: "Charm",
    maxFormula: "Caliber + Charm Modifier (minimum of 1)",
    refresh: "You regain all spent Leverage at the end of a Short or Long Rest.",
    fuels: "Leverage represents tactical callouts, psychological pressure, and exploiting split-second openings; it fuels the Hustler's Leverage Abilities.",
    abilityNoun: "Leverage Ability",
    abilityNounPlural: "Leverage Abilities",
    learn: { knowsAll: false, picks: [{ level: 1, count: 2 }, { level: 5, count: 2 }] },
    abilities: HUSTLER_LEVERAGE_ABILITIES
  },
  startingProficiencies: {
    weapons: ["Simple Weapons", "Sidearms"],
    armor: ["Light Armor"],
    shields: [],
    skills: ["Intuition", "Persuasion", "choose one (Deception, Sleight, or Perception)"],
    saves: ["Charm", "Wits"],
    tools: ["Glamour Tools", "choose one (Bureaucracy Tools, Media Tools, Infiltration Tools, or Security Tools)"]
  },
  featuresByLevel: {
    "1": [
      {
        name: "Leverage",
        text: HUSTLER_LEVERAGE_TEXT
      },
      {
        name: "Read the Room",
        text: "You always know who holds the most authority in the room, and who is currently suffering the most Fatigue (or has the lowest Vitality).\n\nOnce per encounter, you can spend that read on a single opening **(Special)**: **Edge** on your first in-combat social d20 check against that authority figure (or +1 Edge Die to your first out-of-combat social Dice Pool check against them), **Edge** on your first attack roll against the target with the most Fatigue or lowest Vitality, or the first Leverage ability you direct at them costs 0 Leverage."
      },
      {
        name: "Hustler Subclass",
        text: "You choose a Hustler subclass, representing your specialization. This subclass grants features at specific Hustler levels. You gain all subclass features for which you meet the required Hustler level, both now and as you continue to advance."
      }
    ],
    "2": [
      {
        name: "Slippery",
        text: "Whenever you spend an Action to **Dash**, a Swift Action to **Disengage**, or an Impulse Action to **Dodge**, you gain a bonus to your Defense equal to your Caliber until the start of your next turn."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "3": [
      {
        name: "Subclass Feature",
        text: "You gain a feature granted by your Hustler subclass at this level."
      }
    ],
    "4": [
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "5": [
      {
        name: "Compound Interest",
        text: "When you activate a Leverage ability that targets a single target, you may spend **1 additional Leverage** to extend that exact ability to a second valid target within range. If the original ability targeted an ally, the second target must also be an ally; if it targeted an enemy, the second target must also be an enemy. This feature only duplicates the specific Leverage ability you just activated. You cannot use it to activate two different abilities simultaneously."
      },
      {
        name: "Expanded Leverage",
        text: "You learn **two additional** Leverage Abilities from the core list."
      }
    ],
    "6": [
      {
        name: "Two Steps Ahead",
        text: "Once per encounter, when an enemy declares an Action, you can use your Impulse Action to get ahead of it. This imposes **Snag** on their d20 roll. If their attack roll misses or their contested check fails, they are immediately inflicted with the *Staggered* condition (Speed halved, lose Swift and Impulse Actions) until the end of their next turn."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "7": [
      {
        name: "Subclass Feature",
        text: "You gain a feature granted by your Hustler subclass at this level."
      }
    ],
    "8": [
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "9": [
      {
        name: "Return on Investment (ROI)",
        text: "Whenever you or an ally within 6 spaces rolls a Critical Success (Natural 20) on a d20 roll, you immediately regain 1 spent Leverage (this cannot exceed your maximum)."
      }
    ],
    "10": [
      {
        name: "Subclass Capstone",
        text: "You gain the capstone feature granted by your Hustler subclass at this level."
      }
    ]
  },
  progressionTable: [
    { level: 1, caliber: 1, features: ["Leverage", "Read the Room", "Hustler Subclass"], resource: "-" },
    { level: 2, caliber: 2, features: ["Slippery", "Universal Upgrade"], resource: "+5 Points" },
    { level: 3, caliber: 3, features: ["Subclass Feature"], resource: "-" },
    { level: 4, caliber: 4, features: ["Universal Upgrade"], resource: "+5 Points" },
    { level: 5, caliber: 5, features: ["Compound Interest", "Expanded Leverage"], resource: "-" },
    { level: 6, caliber: 5, features: ["Two Steps Ahead", "Universal Upgrade"], resource: "+5 Points" },
    { level: 7, caliber: 5, features: ["Subclass Feature"], resource: "-" },
    { level: 8, caliber: 5, features: ["Universal Upgrade"], resource: "-" },
    { level: 9, caliber: 5, features: ["Return on Investment (ROI)"], resource: "-" },
    { level: 10, caliber: 5, features: ["Subclass Capstone"], resource: "-" }
  ],
  subclasses: [
    {
      key: "the_suit",
      name: "The Suit",
      description: "You do not see a battlefield; you see a market waiting to be cornered. To you, people are not threats; they are simply depreciating assets. Impeccably dressed and dangerously calm, you orchestrate violence with the terrifying precision of a hostile takeover, liquidating the opposition before they even realize the deal has been struck.",
      features: [
        {
          level: 1,
          name: "Risk Assessment",
          text: "You gain Proficiency with Security Tools, and you may use your Wits modifier instead of Agility when rolling Initiative. If you spend 10 minutes observing a location or studying its blueprints, you cannot get lost in it, and you gain Edge on in-combat Wits-based d20 checks (or +1 Edge Die to related out-of-combat Dice Pools) to identify security blind-spots, structural weaknesses, or hidden routes there."
        },
        {
          level: 3,
          name: "Asset Reallocation",
          text: "Immediately after Initiative is rolled, but before the first turn, spend 1 Leverage to reposition the crew. Choose a number of allies up to your Wits Modifier (minimum 1); each may immediately move up to half their Speed. This movement happens outside the turn order and does not provoke Opportunity Attacks."
        },
        {
          level: 7,
          name: "Mandatory Overtime",
          text: "As a **Swift Action**, spend 2 Leverage to drive one ally within 12 spaces who can hear you. That ally may immediately use their **Impulse Action** to make a standard weapon attack (or cast a 1-Action Invocation). The attack is made with Edge, and if it hits, it deals maximum damage on the dice instead of rolling. Immediately after the attack resolves, the ally takes unavoidable physical damage equal to your Caliber + your Wits Modifier.\n\n**Fine, I'll Do It Myself:** If the targeted ally refuses or cannot take the Impulse Action, your Swift Action and Leverage are not wasted; apply the mandate to yourself instead. The next standard weapon attack you make before the end of your turn gains Edge and deals maximum damage on a hit, and you take no strain damage."
        },
        {
          level: 10,
          name: "Company-Wide Liquidation",
          text: "Once per Long Rest, as an **Action**, declare a kill-order on one enemy you can see. Every willing ally within 12 spaces may immediately move up to their Speed and make one standard weapon attack against that enemy. This movement and attack occur outside the turn order and cost the allies none of their own Actions, Swift Actions, or Impulse Actions.\n\n**Severance Package:** If the enemy is reduced to 0 Vitality by this barrage, you and all participating allies immediately gain Vigor equal to your Caliber + your Charm Modifier."
        }
      ]
    },
    {
      key: "the_grifter",
      name: "The Grifter",
      description: "You do not just lie; you construct entirely alternate realities. You are a master of deception, turning every missed shot by your enemy into a psychological victory, and every strike against you into a self-inflicted wound. By the time a mark realizes they have been played, you have already spent their money and vanished.",
      features: [
        {
          level: 1,
          name: "Social Chameleon",
          text: "You gain Proficiency with Infiltration Tools and Forgery Tools. If you spend one minute observing a target or listening to them speak, you can perfectly mimic their voice, cadence, and mannerisms. When using this mimicry, presenting fake credentials, or wearing a disguise, you gain Edge on in-combat Deception d20 checks (or +1 Edge Die to related out-of-combat Dice Pools) to pass as someone else or bluff past security."
        },
        {
          level: 3,
          name: "A Sucker Born Every Minute",
          text: "With a few seconds of observation or conversation (a **Swift Action** in combat), designate one target you can see as your Mark. Out of combat, you can establish a new Mark only once per scene.\n\nWhile a target is your Mark, you gain Edge on in-combat Deception and Sleight d20 checks (or +1 Edge Die to related out-of-combat Dice Pools) against them, and they suffer Snag on all attack rolls against you. Whenever you succeed on a Deception or Sleight check against your Mark, or they target you with an attack and miss, you regain 1 spent Leverage (once per round, never exceeding your maximum). You can only have one Mark at a time. The effect ends if the Mark dies, if you designate a new Mark, or at the end of the encounter or scene."
        },
        {
          level: 7,
          name: "Gaslight",
          text: "As an **Action**, spend 2 Leverage to target one enemy within 12 spaces who can hear you. They must make a Wits Save (DC = 8 + your Charm Modifier + your Caliber). On a failure, they are disoriented for up to 1 minute: they perceive their allies as enemies and you and your allies as friendly, and on their turn they must use their Action to attack the nearest target they now perceive as a threat (their own team).\n\nIf no such target is in range, they are instead Confused for the duration. If their Confusion result would have them attack the nearest target, their paranoia paralyzes them instead: they take no actions and lose their turn.\n\nThe target may repeat the Wits Save at the end of each of its turns. If the target takes damage from you or your allies (whom they currently perceive as friendly), they may immediately make a Wits Save with Edge to end the effect."
        },
        {
          level: 10,
          name: "Character Assassination",
          text: "Once per Long Rest, as an **Action**, deliver a devastating lie (a forged termination order, proof a boss sold them out, the \"activation phrase\" of a sleeper program that does not exist). Choose a number of enemies up to your Charm Modifier within 12 spaces who can hear and understand you. They must make a Wits Save (DC = 8 + your Charm Modifier + your Caliber).\n\n• **On a failure:** Their morale collapses. The GM chooses how they break: they drop their weapons and flee the encounter, or they turn on their own side for the rest of the encounter.\n• **On a success:** They are Confused until the end of their next turn."
        }
      ]
    },
    {
      key: "the_fixer",
      name: "The Fixer",
      description: "You are the ultimate underworld shot caller. You ensure your crew never runs out of luck, ammo, or options by leveraging a vast, terrifying network of favors, debts, and street level operatives. You do not just know a guy; you own the guy, and you are always ready to collect.",
      features: [
        {
          level: 1,
          name: "Street Broker",
          text: "You gain Proficiency with Engineering Tools and +1 Edge Die on all out-of-combat Dice Pool checks made to locate restricted gear, secure black-market Nexus Token exchanges, or find a safehouse. By spending one minute examining a weapon, vehicle, or piece of cyber-tech, you determine its exact black-market value, its origin (manufacturer or previous owner's faction), and whether it is counterfeit, bugged with a tracker, or malfunctioning."
        },
        {
          level: 3,
          name: "The Fix Is In",
          text: "As an **Impulse Action** when an ally within 6 spaces takes damage from an attack, spend 1 Leverage to cash in a micro-favor (a bribed grid-worker cutting the lights, a street kid dropping an obstacle). Reduce the incoming damage by 1d6 + your Charm Modifier + your Caliber. If this reduces the damage to 0, the ally may immediately move up to 2 spaces without provoking Opportunity Attacks."
        },
        {
          level: 7,
          name: "Off-the-Books Asset",
          text: "Once per encounter, as an **Action**, spend 2 Leverage to ping a heavy-hitter on standby. Target an Area 2 you can see within 24 spaces. All enemies in the area must make an Agility Save (DC = 8 + your Charm Modifier + your Caliber). On a failure, they take 3d8 + your Charm Modifier physical or energy damage (your choice) and are knocked Prone. On a success, they take half damage and are not knocked Prone."
        },
        {
          level: 10,
          name: "Corner the Market",
          text: "Once per Long Rest, when you roll Initiative, choose a number of enemies up to your Charm Modifier. Those enemies begin the encounter with their logistics compromised:\n\n• **Bad Ammo/Corrupted Cybernetics:** They must spend a **Swift Action** on their first turn clearing a weapon jam or rebooting before they can attack.\n• **Tampered Gear:** They cannot use consumable items, explosives, or healing tech for the encounter.\n\n**The Setup:** You start the encounter with 2 temporary Leverage. This can exceed your normal maximum, but it must be spent before the end of the first round or it is lost."
        }
      ]
    }
  ],
  extra: {
    playbook: {
      turnToTurn: "You manipulate the action economy. You observe enemy positioning and spend your Leverage to ensure your allies strike with Edge while your enemies stumble blindly into your traps with Snag.",
      winningEncounters: "You win by amplifying your team's damage output and crippling the opposition's options before they can even draw their weapons. You talk your way out of ambushes, buy critical time, and turn the environment itself into a psychological weapon.",
      whatToAvoid: "Direct frontline combat. With a d6 Resilience die, you cannot afford to trade blows with heavy hitters. If you find yourself cornered without Leverage or an exit strategy, your brilliant plans will end very quickly."
    },
    leverageAbilities: HUSTLER_LEVERAGE_ABILITIES
  }
};

// Tactical Maneuvers (the Operator's "Calls") as structured sub-entries: the single source for the
// engine, the Class-tab picker, and the print sheet. The Execution feature's prose (below) is
// composed from this list, so the displayed text and the machine-readable data can never drift
// apart. The Operator knows every Call; each costs 1 EX to make.
var OPERATOR_TACTICAL_INTRO = "You thrive in the chaos of a firefight: directing traffic, creating openings, keeping your crew alive. You have a pool of **Execution (EX)** equal to your **Caliber + your Wits Modifier**. You regain all spent Execution at the end of a Short or Long Rest. You know every Call below and may spend 1 EX to make any of them.\n\n**Suppression.** Several of your Calls leave a target *Suppressed*. A Suppressed target rolls with **Snag** on attack rolls and cannot take **Impulse Actions** until the suppression ends. You do not merely hurt the enemy. You strip away their ability to fight back cleanly, pin them in place, and hand your crew a target that cannot punish them for moving in.";
var OPERATOR_TACTICAL_MANEUVERS = [
  { name: "Suppressing Fire", action: "Action", cost: 1, text: "Choose a point within your weapon's range, then an Area 3 around that point. Each Enemy in the area must succeed on an Agility Save (DC = 8 + your Wits Modifier + your Caliber) or become *Suppressed* until the start of your next turn. This Call deals no damage." },
  { name: "Take the Angle", action: "Swift Action", cost: 1, text: "You move up to your Speed without provoking opportunity attacks. If you end this movement with Line of Sight to an Enemy you did not have Line of Sight to at the start of your turn, your next weapon attack this turn ignores the Defense bonus of their Cover." },
  { name: "Call the Angle", action: "Swift Action", cost: 1, text: "Designate an Enemy you can see. Until the start of your next turn, attacks against that Enemy made by you or your allies ignore the Defense bonus of Half and Three-Quarter Cover." },
  { name: "Reposition", action: "Swift Action", cost: 1, text: "Target one Ally within 12 spaces who can hear you. That Ally may immediately move up to half their Speed as a Free Action without provoking opportunity attacks." },
  { name: "Focus Fire", action: "Special", cost: 1, text: "When you hit an Enemy with a weapon attack, you may spend 1 EX to mark them. The next attack made against that Enemy by you or an Ally before the start of your next turn gains **Edge**." },
  { name: "Pin Down", action: "Impulse Action", cost: 1, text: "Trigger: An Enemy you can see within your weapon's range uses its movement. Make a weapon attack against that Enemy. On a hit, deal normal damage and they are *Suppressed* until the start of your next turn. Alternatively, you may choose to deal no damage and instead reduce their Speed to 0 for the rest of their turn." },
  { name: "Covering Fire", action: "Impulse Action", cost: 1, text: "Trigger: An Enemy you can see makes a weapon attack against an ally within 12 spaces, and you have Line of Sight to that Enemy. The attacker rolls that attack with **Snag** and is *Suppressed* until the start of your next turn." },
  { name: "Fire on My Mark", action: "Impulse Action", cost: 1, text: "Trigger: You leave an Enemy Suppressed, or hit an Enemy with a weapon attack. One Ally within 12 spaces who can see or hear you may immediately use their Impulse Action to make a single weapon attack against that Enemy." }
];
var OPERATOR_TACTICAL_TEXT = OPERATOR_TACTICAL_INTRO + "\n\n" + OPERATOR_TACTICAL_MANEUVERS.map(function (m) {
  return "**" + m.name + " (" + m.action + "):** " + m.text;
}).join("\n\n");

EN.classes.operator = {
  key: "operator",
  name: "Operator",
  tagline: "You are a specialist in timing, positioning, and coordination. In a world of unpredictable variables, you hold the line with iron discipline, secure comms, and a tactical plan designed to survive contact with the enemy. Your path is about making the right call at the exact right moment, turning the chaos of a firefight into a calculated, lethal advantage. You train to be the professional that crews bet their lives on, the anchor who keeps moving forward when every other plan collapses.",
  vitality: {
    text: "Resilience Die: d10\nStarting Vitality: 10 + Body Modifier\nVitality Per Level: 1d10 + Body Modifier"
  },
  resilience: {
    text: "Resilience Die: d10\nStarting Vitality: 10 + Body Modifier\nVitality Per Level: 1d10 + Body Modifier"
  },
  attributePriorities: [
    "Wits (Primary): Drives your Execution pool and powers critical situational awareness through Perception.",
    "Agility (Secondary): Key for landing ranged attacks with Longarms or Heavy Weapons, and keeps your Defense high during a firefight.",
    "Body (Tertiary): Increases your Vitality and maximum Wounds, ensuring you can survive return fire while holding a tactical anchor point."
  ],
  saveFocus: "Wits and Body",
  resource: {
    name: "Execution",
    attribute: "Wits",
    maxFormula: "Caliber + Wits Modifier",
    refresh: "You regain all spent Execution at the end of a Short or Long Rest.",
    fuels: "Execution (EX) fuels the Operator's Tactical Maneuvers (the Calls) and subclass precision attacks.",
    abilityNoun: "Tactical Maneuver",
    abilityNounPlural: "Tactical Maneuvers",
    learn: { knowsAll: true, picks: [] },
    abilities: OPERATOR_TACTICAL_MANEUVERS
  },
  startingProficiencies: {
    weapons: ["Simple Weapons", "Sidearms", "Longarms", "Heavy Weapons", "Explosive Launchers"],
    armor: ["Light Armor", "Medium Armor", "Heavy Armor"],
    shields: [],
    skills: ["Perception", "Systems", "choose one (Athletics, Medtech, or Intuition)"],
    saves: ["Wits", "Body"],
    tools: ["Security Tools", "choose one (Fieldcraft Tools, Engineering Tools, Medical Tools, or Investigation Tools)"]
  },
  featuresByLevel: {
    "1": [
      {
        name: "Execution",
        text: OPERATOR_TACTICAL_TEXT
      },
      {
        name: "Operator Subclass",
        text: "You choose a Operator subclass, representing your specialization. This subclass grants features at specific Operator levels. You gain all subclass features for which you meet the required Operator level, both now and as you continue to advance."
      }
    ],
    "2": [
      {
        name: "Overwatch",
        text: "As an Action, you establish an Overwatch zone covering an Area 6 Cone or Area 12 Line. Until the start of your next turn, the first Enemy to move, attack, or cast an Invocation within that zone triggers your trap, provided you have Line of Sight to the target. You may immediately make a weapon attack against them as an Impulse Action. On a hit, their Speed is reduced to 0 for the remainder of their turn.\n\nYou must expose yourself to track the zone. You cannot use this feature while benefiting from Full Cover, though Half or Three-Quarter Cover still applies."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "3": [
      {
        name: "Subclass Feature",
        text: "You gain a feature granted by your Operator subclass at this level."
      }
    ],
    "4": [
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "5": [
      {
        name: "Fluid Engagement",
        text: "When you take the Attack Action on your turn, you can make two attacks instead of one."
      }
    ],
    "6": [
      {
        name: "Breacher's Momentum",
        text: "Whenever you drop an enemy to 0 Vitality or score a critical hit, you immediately regain **1 Execution** and may move up to 3 spaces as a free action. This movement does not provoke opportunity attacks."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "7": [
      {
        name: "Subclass Feature",
        text: "You gain a feature granted by your Operator subclass at this level."
      }
    ],
    "8": [
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "9": [
      {
        name: "Absolute Discipline",
        text: "You gain the following benefits:\n\n• **Veteran Instincts:** You cannot be Surprised, and you gain **Edge** on all Initiative rolls.\n• **Rallying Cry:** When you roll Initiative with 0 Execution remaining, you immediately regain 2 Execution."
      }
    ],
    "10": [
      {
        name: "Subclass Capstone",
        text: "You gain the capstone feature granted by your Operator subclass at this level."
      }
    ]
  },
  progressionTable: [
    { level: 1, caliber: 1, features: ["Execution", "Operator Subclass"], resource: "0" },
    { level: 2, caliber: 1, features: ["Overwatch", "Universal Upgrade"], resource: "0" },
    { level: 3, caliber: 2, features: ["Subclass Feature"], resource: "+5 Points" },
    { level: 4, caliber: 2, features: ["Universal Upgrade"], resource: "0" },
    { level: 5, caliber: 3, features: ["Fluid Engagement"], resource: "0" },
    { level: 6, caliber: 3, features: ["Breacher's Momentum", "Universal Upgrade"], resource: "+5 Points" },
    { level: 7, caliber: 4, features: ["Subclass Feature"], resource: "0" },
    { level: 8, caliber: 4, features: ["Universal Upgrade"], resource: "0" },
    { level: 9, caliber: 5, features: ["Absolute Discipline"], resource: "0" },
    { level: 10, caliber: 5, features: ["Subclass Capstone"], resource: "+5 Points" }
  ],
  subclasses: [
    {
      key: "the_vanguard",
      name: "The Vanguard",
      description: "You are built for the fatal funnel, learning to dismantle enemy lines with surgical precision. Specializing in close quarters battle, physical shields, and rapid neutralization, your goal is to turn tight hallways and breached doors into your personal domain. You do not need to scream or charge to be terrifying; you simply raise your shield, check your corners, and advance relentlessly. After all, slow is smooth, and smooth is fast.",
      features: [
        {
          level: 1,
          name: "CQB Tactics",
          text: "You gain Proficiency with Physical Shields. While wielding a Physical Shield in one hand and a Sidearm, Simple Weapon, or Martial Weapon (without the Heavy or Two Handed trait) in the other, you gain:\n\n• **Close Quarters Supremacy:** If you are wielding a Sidearm, your ranged attacks do not suffer Snag when fired at an enemy within melee range.\n• **Active Shielding:** Your Physical Shield works as a melee weapon dealing 1d6 Bludgeoning damage. Whenever you successfully Shove an enemy, you automatically deal this damage.\n• **Breacher's Step:** When you roll Initiative, you and up to one ally of your choice can immediately move up to 3 spaces as a free action."
        },
        {
          level: 3,
          name: "Intercepting Guard",
          text: "As an **Impulse Action** when an ally within 2 spaces is targeted by a physical or ballistic attack, spend 1 Execution to intervene. Move into an unoccupied space adjacent to that ally and throw your shield into the line of fire, forcing the attacker to roll against your Defense instead of the ally's. If the attack misses, you may immediately make a single retaliatory attack against the attacker with your equipped weapon or a shield bash."
        },
        {
          level: 7,
          name: "CQC Takedown",
          text: "You gain two abilities:\n\n• **CQC Takedown:** As an **Action**, spend 2 Execution to drive a close-quarters combination into an adjacent enemy. The target must make a Body Save (DC = 8 + your Body Modifier + your Athletics Proficiency Bonus). On a failure, they take 3d6 Bludgeoning damage, are knocked Prone, and are Stunned until the end of your next turn. On a success, they take half damage and are not Stunned.\n• **Double Tap:** Whenever an enemy within 2 spaces is knocked Prone by any source, you may use your **Impulse Action** to make a single retaliatory attack against them. If you use a melee weapon or shield bash, you may step up to 1 space as part of this reaction to reach them."
        },
        {
          level: 10,
          name: "Room Sweeper",
          text: "Once per Long Rest, as a **Swift Action**, lock in your targets for 1 minute. While active:\n\n• You ignore all enemy Cover bonuses when attacking with your equipped weapon.\n• Your weapon and shield attacks score a Critical Hit on a natural roll of 18, 19, or 20.\n• Whenever you score a Critical Hit on an enemy, they are knocked Prone, setting them up for your Double Tap."
        }
      ]
    },
    {
      key: "the_deadeye",
      name: "The Deadeye",
      description: "Your training ensures that priority targets never even get a chance to draw their weapons. You specialize in ballistic trajectory and pinpoint accuracy, reading the geometry of a firefight before the first shot rings out. You do not need a massive sniper rifle to be a lethal threat; in your hands, a heavy revolver or a standard carbine becomes an instrument of deadly efficiency. You win by finding the angles your enemies overlook and putting a bullet exactly where it belongs.",
      features: [
        {
          level: 1,
          name: "Calculated Marksmanship",
          text: "You gain Proficiency in the Stealth or Acrobatics skill (your choice). When making a ranged weapon attack, you do not suffer Snag for firing beyond your weapon's standard range, up to its maximum. As long as you have not moved during your turn, you ignore the Defense bonuses provided by Half Cover."
        },
        {
          level: 3,
          name: "Hair Trigger",
          text: "Spend 1 Execution to overcharge your Overwatch Protocol. When you take the Action to establish an Overwatch zone, you double its size (creating either an Area 12 Cone or Area 24 Line). If an enemy triggers this Overwatch, you gain Edge on the resulting attack roll."
        },
        {
          level: 7,
          name: "Ricochet Trajectory",
          text: "As an **Action**, spend 2 Execution to bounce a shot off the environment and hit a target you cannot see. Make a ranged attack roll against a target within 6 spaces of a solid surface you can see. On a hit, they take normal weapon damage plus an additional 2d6 Ballistic damage and are Staggered until the end of their next turn."
        },
        {
          level: 10,
          name: "The Killing Floor",
          text: "Once per Long Rest, as an **Action**, declare an Area 20 you can see as your kill zone for 1 minute. Any enemy that moves, attacks, or casts an Invocation within the area triggers an Overwatch shot from you, provided you have Line of Sight. You may take an unlimited number of **Impulse Actions** to make these shots, but you can fire at each enemy only once per round. You cannot use this feature while benefiting from Full Cover, though you may still benefit from Half or Three Quarter Cover."
        }
      ]
    },
    {
      key: "the_headhunter",
      name: "The Headhunter",
      description: "You are a dedicated tracker in the urban sprawl. When a high-value target tries to run, you run them down. You focus on isolating a single enemy, systematically stripping away their escape routes, and bringing them in dead or alive. To your prey, you are not just a mercenary; your arrival is a terrifying inevitability.",
      features: [
        {
          level: 1,
          name: "Prey Drive",
          text: "You gain Proficiency in the Survival skill, and you permanently upgrade your Focus Fire maneuver. When you spend 1 EX to mark a target with Focus Fire, the tracking benefits last 1 full minute (the Edge from Focus Fire still applies only to the first attack made by an ally). For that minute, the target cannot benefit from the Hidden or Invisible conditions against you, and you always know its exact location while it stays within 24 spaces."
        },
        {
          level: 3,
          name: "Disarming Precision",
          text: "Whenever you hit an enemy with a weapon attack, you may spend 1 Execution. The target must make a Body or Agility Save. On a failure, they drop one weapon or object they are holding. If they try to pick it up before the end of their next turn, you may immediately fire a single retaliatory shot at them as an **Impulse Action**."
        },
        {
          level: 7,
          name: "Cornered Prey",
          text: "As an **Action**, spend 2 Execution to unleash a sequence of shots or strikes against an enemy within your weapon's range, ignoring the Defense bonuses from Half or Three Quarter Cover. The target must make an Agility Save.\n\n• **On a failure:** They take 3d6 Ballistic or Physical damage and are Staggered until the end of your next turn. If their cover is Average or weaker (standard doors, drywall, shipping crates), it is instantly reduced to 0 Integrity. If their cover is Heavy, Fortified, or Hardened, it stays intact, but they still take the damage and condition.\n• **On a success:** They take half damage, are not Staggered, and their cover takes no damage."
        },
        {
          level: 10,
          name: "Dead or Alive",
          text: "Once per Long Rest, as an **Action**, declare an execution order on a target within 12 spaces. For 1 minute, your weapon attacks against it bypass superficial endurance.\n\n**Systemic Trauma:** Half of all damage you deal to the target (rounded up) is dealt as direct Wound damage, reducing its maximum Vitality and forcing the standard Body Save against Fatigue and crippling conditions.\n\n**Precision Targeting:** Whenever you hit the target with a weapon attack, you may spend 2 Execution to apply one effect:\n\n• **Dead (Arterial Strike):** Inflict 2 stacks of Bleeding on the target.\n• **Alive (Tendon Shot):** The target must make a Body Save (DC = 8 + your Agility or Body Modifier + your Caliber). On a failure, it is knocked Prone and its Speed is reduced to 0; it cannot stand or walk until it receives medical attention or Flow healing.\n\nIf this assault reduces the target to 50 percent or less of its total Wounds, it is knocked Unconscious and stabilized, letting you collect the bounty dead or alive."
        }
      ]
    }
  ],
  extra: {
    playbook: {
      turnToTurn: "Act as a tactical anchor. Use longarms or heavy weapons to secure cover and punishing fire. Use Execution to pace engagements, grant Ally movement, or set up flanking.",
      winningEncounters: "Dominate via superior discipline and zone control. Use ranged damage, explosives, and Overwatch to flush enemies and lock lanes, directing your squad as a single unit.",
      whatToAvoid: "Avoid tunnel vision or letting enemies close in. Your strength is amplifying the team from vantage points; isolation, poor communication, or hoarding Execution leads to swift death."
    },
    tacticalManeuvers: OPERATOR_TACTICAL_MANEUVERS
  }
};
