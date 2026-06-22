window.EN = window.EN || {};
EN.classes = EN.classes || {};

// Moxie Gambits as structured sub-entries, the single source for the engine, the Class-tab
// picker, and the print sheet. The Moxie feature's prose (below) is composed from this list,
// so the displayed text and the machine-readable data can never drift apart.
var SCOUNDREL_MOXIE_INTRO = "You survive on instinct, audacity, and luck that has no business holding. You have a pool of **Moxie** equal to your **Caliber + your Agility Modifier** (minimum 1). You regain all spent Moxie at the end of a Short or Long Rest.\n\nAt 1st Level you learn three Gambits of your choice from the list below, and you learn two more at 5th Level through Expanded Moxie. Unless a Gambit says otherwise, activating it costs 1 Moxie.";
var SCOUNDREL_MOXIE_GAMBITS = [
  { name: "Lucky Break", action: "Special Action", cost: 1, text: "When you make an attack roll, an ability check, or a saving throw, spend 1 Moxie to roll one additional d20 and choose which die to use, even if you are already rolling with Edge. This deliberately breaks the normal rule that you can never roll more than 2d20. A Lucky Break stacks on top of Edge: Edge plus a Lucky Break is 3d20, and you keep whichever result you like." },
  { name: "Jinx", action: "Impulse Action", cost: 1, text: "When an enemy you can see makes an attack roll or a saving throw, spend 1 Moxie to force them to roll one additional d20 and use the lowest result, even if they are already rolling with Snag. Jinxing a target who already has Snag forces a third d20, and they are stuck with the worst of the three." },
  { name: "Slip the Blow", action: "Impulse Action", cost: 1, text: "When you are hit by an attack you can see, spend 1 Moxie to roll with it at the last instant. You gain Resistance to that attack's damage and may immediately move 1 space without provoking opportunity attacks." },
  { name: "Smash and Grab", action: "Action", cost: 1, text: "Spend 1 Moxie. Your Speed is doubled this turn and your movement does not provoke opportunity attacks for the rest of your turn (you cannot end your turn in an enemy's space). Make a single weapon attack at any point during the move. On a hit, choose one: shove the target 1 space, or snatch one small unsecured item they are carrying (a keycard, a grenade, a spare clip, a data shard). The GM may call for a contested Sleight check to lift anything secured or actively guarded." },
  { name: "Bad Feeling", action: "Impulse Action", cost: 1, text: "When an enemy you can see moves within your reach, or when you become the target of an attack you can see, spend 1 Moxie to move up to half your Speed without provoking opportunity attacks. Because you move as the trigger happens, you can break away before it lands. If that move puts you out of the attacker's reach or behind total cover, the attack finds empty space." },
  { name: "Shake It Off", action: "Swift Action", cost: 1, text: "Spend 1 Moxie to end one condition affecting you that is clouding your senses or your footing, such as Staggered, Shaken, or Dazed." },
  { name: "Ace Up the Sleeve", action: "Special Action", cost: 1, text: "Spend 1 Moxie to reveal you saw this coming. Subject to GM approval, you produce a useful but mundane item you could plausibly have stashed, call in a minor favor from a local contact, or point out a small environmental out: a loose grate, an unlatched window, a maintenance ladder. It never conjures gear you could not have carried and it never rewrites the scene." },
  { name: "Kick Them While They're Down", action: "Impulse Action", cost: 1, text: "When an enemy within your reach misses you with a melee attack, or an ally scores a Critical Hit on an enemy within your reach, spend 1 Moxie to make a single weapon attack against that enemy. On a hit, it automatically qualifies for your Cheap Shot damage with no other condition required." },
  { name: "Quick Hands", action: "Impulse Action", cost: 1, text: "Trigger: An enemy within your reach misses you with an attack, or you move out of an enemy's reach. Spend 1 Moxie. Choose one: take one small unsecured item the enemy is carrying (a keycard, a grenade, a spare clip, a data shard), or foul one piece of their gear so the next attack roll they make with it is rolled with Snag." },
  { name: "Pure Luck", action: "Special Action", cost: 1, text: "Trigger: You fail an attack roll, an ability check, or a saving throw. Spend 1 Moxie to insist, against all reason, that it went your way. Treat the d20 as if it had rolled a 10, then apply your modifiers normally. Where Lucky Break buys you another die before you know how it lands, Pure Luck rescues a roll that already came up short." }
];
var SCOUNDREL_MOXIE_TEXT = SCOUNDREL_MOXIE_INTRO + "\n\n" + SCOUNDREL_MOXIE_GAMBITS.map(function (g) {
  return "**" + g.name + " (" + g.action + "):** " + g.text;
}).join("\n\n");

EN.classes.scoundrel = {
  key: "scoundrel",
  name: "Scoundrel",
  tagline: "The odds were never in your favor, so you stopped playing fair and started playing to win. You have nerve, footwork, and a kind of luck that should have run out years ago and somehow keeps holding. When the shooting starts you are already moving, already gone, already standing behind the one person who thought they had you; you slip the killing shot, palm the prize, and stroll out the back. You are training to become the one thing a rigged city can never quite get its hands on: untouchable.",

  vitality: {
    text: "Resilience Die: d8\nStarting Vitality: 8 + Body Modifier\nVitality Per Level: 1d8 + Body Modifier"
  },
  resilience: {
    text: "Resilience Die: d8\nStarting Vitality: 8 + Body Modifier\nVitality Per Level: 1d8 + Body Modifier"
  },

  saveFocus: "Agility and Wits",

  attributePriorities: [
    "1. Agility (Primary): Powers your Stealth, Sleight, finesse melee and ranged attacks, your Speed and Defense, and the size of your Moxie pool.",
    "2. Wits (Secondary): Drives your Perception and instinct for trouble, your Initiative, and your Wits saves.",
    "3. Tech or Charm (Tertiary): Tech bypasses locks and security systems on a job; Charm talks you clear when footwork alone will not cut it."
  ],

  resource: {
    name: "Moxie",
    attribute: "Agility",
    maxFormula: "Caliber + Agility Modifier (minimum 1)",
    refresh: "You regain all spent Moxie at the end of a Short or Long Rest.",
    fuels: "Spend Moxie on Gambits (learn 3 at Level 1, +2 at Level 5): Lucky Break, Jinx, Slip the Blow, Smash and Grab, Bad Feeling, Shake It Off, Ace Up the Sleeve, Kick Them While They're Down, Quick Hands, and Pure Luck. Unless a Gambit says otherwise, it costs 1 Moxie.",
    // Gambits: choose 3 at L1, +2 more at L5. The options live in the structured list above.
    gambitPicks: [{ level: 1, count: 3 }, { level: 5, count: 2 }],
    gambitsIntro: SCOUNDREL_MOXIE_INTRO,
    gambits: SCOUNDREL_MOXIE_GAMBITS,
    abilityNoun: "Gambit",
    abilityNounPlural: "Gambits",
    learn: { knowsAll: false, picks: [{ level: 1, count: 3 }, { level: 5, count: 2 }] },
    abilities: SCOUNDREL_MOXIE_GAMBITS
  },

  startingProficiencies: {
    weapons: ["Simple Weapons", "Martial Weapons", "Sidearms", "Thrown Weapons"],
    armor: ["Light Armor"],
    shields: [],
    skills: ["Stealth", "Sleight", "choose one (Acrobatics, Deception, or Perception)"],
    saves: ["Agility", "Wits"],
    tools: ["Infiltration Tools", "choose one (Systems Tools, Security Tools, Glamour Tools, or Fieldcraft Tools)"]
  },

  featuresByLevel: {
    "1": [
      {
        name: "Moxie",
        text: SCOUNDREL_MOXIE_TEXT
      },
      {
        name: "Cheap Shot",
        text: "Once per turn, you can deal an extra **1d6 damage** to one target you hit with an attack, as long as the attack uses a Sidearm, a Simple Weapon, or a Melee Weapon with the *Light* trait, and at least one of the following is true:\n\n• You have **Edge** on the attack roll.\n• Another conscious enemy of the target is within 1 space of it, and you do not have **Snag** on the roll.\n• You have spent at least 1 Moxie this round.\n\nThis extra damage increases to **2d6 at 3rd Level, 3d6 at 5th Level, 4d6 at 7th Level, and 5d6 at 9th Level**."
      },
      {
        name: "Scoundrel Subclass",
        text: "You choose the specialization that suits your particular brand of getting away with it. Whether you run blockades and bad neighborhoods as a Smuggler, beat a rigged game as a Wildcard, or carve people up in close as a Shiv, your subclass grants features at Levels 1, 3, 7, and 10."
      }
    ],
    "2": [
      {
        name: "Watch How I Soar",
        text: "You can take the **Dash** or **Disengage** action as a **Swift Action** at no Moxie cost. In addition, opportunity attacks against you are made with **Snag**, and Difficult Terrain costs you no extra movement."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "3": [
      {
        name: "Cheap Shot (2d6)",
        text: "Your Cheap Shot extra damage increases to 2d6 at 3rd Level. (See Level 1: Cheap Shot.)"
      },
      {
        name: "Subclass Feature",
        text: "You gain your subclass feature for level 3."
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
        name: "Cheap Shot (3d6)",
        text: "Your Cheap Shot extra damage increases to 3d6 at 5th Level. (See Level 1: Cheap Shot.)"
      },
      {
        name: "Untouchable",
        text: "When you are subjected to an effect that allows an **Agility Save** to take half damage, you instead take no damage on a success and only half damage on a failure."
      },
      {
        name: "Expanded Moxie",
        text: "You learn **two additional Gambits** from the list."
      }
    ],
    "6": [
      {
        name: "Cheat the Clock",
        text: "You can take **two Impulse Actions** each round instead of one. You still cannot take more than one Impulse Action in response to the same trigger."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "7": [
      {
        name: "Cheap Shot (4d6)",
        text: "Your Cheap Shot extra damage increases to 4d6 at 7th Level. (See Level 1: Cheap Shot.)"
      },
      {
        name: "Subclass Feature",
        text: "You gain your subclass feature for level 7."
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
        name: "Cheap Shot (5d6)",
        text: "Your Cheap Shot extra damage increases to 5d6 at 9th Level. (See Level 1: Cheap Shot.)"
      },
      {
        name: "Devil's Own Luck",
        text: "Once per round, when you score a **Critical Success (Natural 20)** on a d20 roll, or when an enemy misses you with an attack, you regain 1 spent Moxie (this cannot exceed your maximum). In addition, attacks against you cannot score **Critical Hits**."
      }
    ],
    "10": [
      {
        name: "Subclass Capstone",
        text: "You gain your subclass capstone feature for level 10."
      }
    ]
  },

  progressionTable: [
    { level: 1, caliber: 1, features: ["Moxie", "Cheap Shot (1d6)", "Scoundrel Subclass"], resource: "" },
    { level: 2, caliber: 1, features: ["Watch How I Soar", "Universal Upgrade"], resource: "0" },
    { level: 3, caliber: 2, features: ["Cheap Shot (2d6)", "Subclass Feature"], resource: "+5 Points" },
    { level: 4, caliber: 2, features: ["Universal Upgrade"], resource: "0" },
    { level: 5, caliber: 3, features: ["Cheap Shot (3d6)", "Untouchable", "Expanded Moxie"], resource: "0" },
    { level: 6, caliber: 3, features: ["Cheat the Clock", "Universal Upgrade"], resource: "+5 Points" },
    { level: 7, caliber: 4, features: ["Cheap Shot (4d6)", "Subclass Feature"], resource: "0" },
    { level: 8, caliber: 4, features: ["Universal Upgrade"], resource: "0" },
    { level: 9, caliber: 5, features: ["Cheap Shot (5d6)", "Devil's Own Luck"], resource: "0" },
    { level: 10, caliber: 5, features: ["Subclass Capstone"], resource: "+5 Points" }
  ],

  subclasses: [
    {
      key: "smuggler",
      name: "The Smuggler",
      description: "You get things, and people, where they are not supposed to be. You are a master of evasion, logistics, and slipping through checkpoints undetected. To you, a locked border or a corporate blockade is just a puzzle waiting to be solved. You always get the job done, even when you have a bad feeling about it, and you win by outsmarting the system, making sure the crew always has a clean way out when things go sideways.",
      features: [
        {
          level: 1,
          name: "Deep Pockets",
          text: "You gain Edge on Sleight or Stealth checks made to hide items on your person, in a vehicle, or in an environment, and you can perfectly conceal a Sidearm or a Light melee weapon even from a thorough physical pat-down.\n\nYou also have Quick Draw: whenever you draw a concealed weapon and attack with it on the same turn, you gain Edge on that first attack roll, letting you trigger your Cheap Shot from a seemingly unarmed position."
        },
        {
          level: 3,
          name: "The Getaway",
          text: "When you take the Dash or Disengage action, spend 1 Moxie to call the route. Each ally within 6 spaces who can see or hear you may immediately move up to half their Speed toward you or toward cover you indicate, without provoking opportunity attacks. Until the start of your next turn, the first attack made against each ally who moved this way is rolled with Snag."
        },
        {
          level: 7,
          name: "Never Saw It Coming",
          text: "You have Edge on attack rolls against any enemy that has not yet been damaged by you this combat. The first time you hit each enemy, it is Staggered until the end of its next turn."
        },
        {
          level: 10,
          name: "Leaf on the Wind",
          text: "Once per Long Rest, as a **Swift Action**, drop into total focus for 1 minute. While it lasts, you gain Resistance to all damage, attacks against you cannot score Critical Hits, you gain an additional **Impulse Action** each round, and you regain 1 Moxie at the start of each of your turns."
        }
      ]
    },
    {
      key: "wildcard",
      name: "The Wildcard",
      description: "The deck is always stacked against you, so you learned to cheat fate itself. You do not hope for a lucky break, you bet on it, push the odds, and dare the universe to call your bluff. Where other Scoundrels play it careful, you go all in, because the only way to beat a rigged game is to wager more than anyone sane ever would.",
      features: [
        {
          level: 1,
          name: "Press Your Luck",
          text: "Before you make any d20 roll, spend 1 Moxie to place a bet, rolling a d6 alongside your d20:\n\n• On a **6**, your d20 roll counts as a Critical Success.\n• On a **2 to 5**, add the d6 result to your d20 roll as a bonus.\n• On a **1**, your d20 roll counts as a Critical Failure, and nothing can recover that Moxie this turn.\n\nYou can bet on attack rolls, saving throws, and ability checks alike."
        },
        {
          level: 3,
          name: "Counting Cards",
          text: "• When you bust a Press Your Luck bet (a **1** on the d6), your roll no longer counts as a Critical Failure; you simply lose the wagered Moxie and keep your natural d20 result.\n• Once per round, instead of rolling the Press Your Luck d6, you can take the safe count and treat the result as a **4**."
        },
        {
          level: 7,
          name: "Lucky Charm",
          text: "As an **Impulse Action** when an ally within 12 spaces makes a d20 roll, spend 1 Moxie to lend them your luck:\n\n• They roll one additional d20 and use whichever result they prefer.\n• You can also place a Press Your Luck bet on the ally's roll exactly as you would on your own, gambling your Moxie on their success."
        },
        {
          level: 10,
          name: "All In",
          text: "Once per Long Rest, as a **Free Action**, bet everything for 1 minute:\n\n• Your Press Your Luck bets cannot bust. Treat any d6 result of **1** as a safe **4**, and a **6** still pays the jackpot.\n• You can place a Press Your Luck bet, on yourself or an ally, without spending Moxie.\n• Once on each of your turns, you can hand one ally within 12 spaces a free Lucky Break.\n\nWhen the minute ends, you cannot use Press Your Luck again until you finish a Short or Long Rest."
        }
      ]
    },
    {
      key: "shiv",
      name: "The Shiv",
      description: "Everyone else is fighting a duel. You are fighting in a gutter, with a broken bottle in one hand and a fistful of grit in the other. You do not need to be stronger or faster, you need them blind, off balance, bleeding, and unable to run, which is exactly where you put them. By the time anyone realizes you never fight fair, they are already on the ground.",
      features: [
        {
          level: 1,
          name: "Fight Dirty",
          text: "When you hit a target with a melee attack, spend 1 Moxie to add a dirty trick. (Whenever you deal Cheap Shot damage with a melee attack, you can apply one of these tricks.) Choose one:\n\n• **Dirt in the Eyes:** The target rolls with Snag on its attacks until the end of its next turn.\n• **Sweep the Leg:** The target must succeed on an Agility Save (DC = 8 + your Agility Modifier + your Caliber) or be knocked Prone.\n• **Squirrel Tap:** The target cannot take Impulse Actions until the start of your next turn."
        },
        {
          level: 3,
          name: "Pressure",
          text: "As an **Impulse Action** when a target within your reach moves, spend 1 Moxie to make a melee attack against it. On a hit, the attack qualifies for your Cheap Shot damage and the target's Speed drops to 0 until the end of its turn."
        },
        {
          level: 7,
          name: "Cripple",
          text: "As an **Action**, spend 2 Moxie to make a single vicious melee attack. On a hit, it deals its damage plus your Cheap Shot damage, and the target must make a Body Save (DC = 8 + your Agility Modifier + your Caliber). On a failure, choose one:\n\n• Its Speed becomes 0 until it receives healing or first aid, or until 1 minute (10 rounds) passes, whichever comes first.\n• It drops what it is holding and rolls with Snag on attacks until the end of its next turn.\n\nOn a success, its Speed is halved until the end of its next turn."
        },
        {
          level: 10,
          name: "No Way Out",
          text: "Once per Long Rest, as a **Swift Action**, turn the space around you into a no-go zone for 1 minute. While it lasts, any enemy that ends its turn within your reach or tries to leave your reach must make an Agility Save (DC = 8 + your Agility Modifier + your Caliber) or be knocked Prone with its Speed reduced to 0 for that turn. You can make a melee attack against any enemy that fails this save, even if you have already used your Impulse Action this round, and every such attack qualifies for your Cheap Shot damage."
        }
      ]
    }
  ],

  extra: {
    playbook: {
      turnToTurn: "You bet on yourself. You spend Moxie to bend your own dice, sour the enemy's at the worst possible moment, and reposition through openings no one else can use, then cash a single clean hit with Cheap Shot. You are rarely where the enemy wants you, and never pinned.",
      winningEncounters: "You win by being untouchable and improbably lucky. You do not stand in the open trading shots with a heavy gunner; you slip the killing blows, twist the enemy's luck against them, and capitalize on every opening your crew tears open.",
      whatToAvoid: "Running your Moxie dry while surrounded. With a d8 Resilience Die and Light Armor, your survival is your luck and your footwork, not your hit points. An empty pool with no exits is the moment the odds finally catch up with you."
    }
  }
};

EN.classes.shaper = {
  key: "shaper",
  name: "Shaper",
  tagline: "Tuned to the city's metaphysical current, you practice the Flow. Whether through logic, momentum, or empathy, you perceive reality as a vibration you can alter. Your path offers limitless potential to shape elements and bend physics to your absolute will.",

  vitality: {
    text: "Resilience Die: d6\nStarting Vitality: 6 + Body Modifier\nVitality Per Level: 1d6 + Body Modifier"
  },
  resilience: {
    text: "Resilience Die: d6\nStarting Vitality: 6 + Body Modifier\nVitality Per Level: 1d6 + Body Modifier"
  },

  saveFocus: "Mystique and Body",

  attributePriorities: [
    "1. Your Flow Attribute (Primary): Your subclass dictates if your Flow Attribute is Charm, Mystique, Body, or Tech. It drives your maximum Flow pool, Flow Attack, and Flow Save DC.",
    "2. Body or Agility (Secondary): If Body isn't already your Flow Attribute, it increases your Wounds to survive the physical toll of combat. Agility keeps your Defense high to avoid taking hits while channeling.",
    "3. Wits (Tertiary): Powers Intuition and Perception, allowing you to read the battlefield and react to sudden threats before they disrupt your resonance."
  ],

  resource: {
    name: "Flow Points",
    attribute: "Mystique/Body/Charm/Tech (by subclass)",
    maxFormula: "(Caliber x 3) + Flow Modifier",
    refresh: "You regain all spent FP at the end of a Long Rest, and an amount equal to your Flow Modifier at the end of a Short Rest. If your FP drops to 0, you may continue to shape by entering Overdraw, losing 1d4 Vitality per FP spent and risking Strain.",
    fuels: "Spend FP to build an Invocation using your known Resonances combined with the Intent, Delivery, Force, and Duration rules. Also fuels subclass features and Advanced Techniques (Flow Linking, Resonance Amplification, Cooperative Channeling, Sustained Fields)."
  },

  startingProficiencies: {
    weapons: ["Simple Weapons", "Sidearms"],
    armor: ["Light Armor", "Warding Foci"],
    shields: [],
    skills: ["Awareness", "Esoterica", "choose one (Perception, Athletics, or Intuition)"],
    saves: ["Mystique", "Body"],
    tools: ["Ritual Implements", "choose one (Investigation Tools, Medical Tools, Fieldcraft Tools, or Bureaucracy Tools)"]
  },

  featuresByLevel: {
    "1": [
      {
        name: "Reservoir",
        text: "You have awakened a deep connection to the metaphysical current. Your capacity to hold and channel this energy safely is represented by your Reservoir of **Flow Points (FP)**.\n\nYour maximum FP equals **(Caliber x 3) + your Flow Modifier**.\n\nYou regain all spent FP at the end of a Long Rest, and an amount equal to your Flow Modifier at the end of a Short Rest.\n\n*If your FP drops to 0, you may continue to shape by entering **Overdraw**, losing 1d4 Vitality per FP spent and risking Strain.*"
      },
      {
        name: "Core Channeling",
        text: "You do not memorize static spells. You shape the current on the fly. You begin play knowing **three Base Resonances** chosen from the standard list: *Kinetic, Thermal, Electromagnetic, Visceral, or Spatial.* When you channel the Flow, you spend FP to build an Invocation using your known Resonances combined with the Intent, Delivery, Force, and Duration rules."
      },
      {
        name: "Flow Subclass",
        text: "You choose a Shaper subclass, representing your specialization. This subclass grants features at specific Shaper levels. You gain all subclass features for which you meet the required Shaper level, both now and as you continue to advance."
      }
    ],
    "2": [
      {
        name: "Controlled Overdraw",
        text: "Once per Short Rest, when your FP is at 0 and you declare an Overdraw, you may ignore the Vitality loss and Strain accumulation for up to **2 FP** worth of Overdraw. If the Invocation costs more than 2 FP, you take the Vitality damage and Strain for the remainder as normal."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "3": [
      {
        name: "Subclass Feature",
        text: "You gain your subclass feature for level 3."
      },
      {
        name: "Resonance Synthesis",
        text: "You unlock the **Resonance Synthesis** Advanced Techniques, gaining the ability to use **Flow Linking** and **Resonance Amplification**. You may now learn the **Cognitive** Base Resonance. Upon reaching this level, you learn **one new Base Resonance** of your choice, bringing your total to four."
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
        name: "Expanded Frequency",
        text: "You may now learn the **Temporal** Base Resonance. Upon reaching this level, you learn **one new Base Resonance** of your choice, bringing your total to five."
      },
      {
        name: "Layered Force",
        text: "You may now pay both the Hybrid (1 FP) and Empowered Force (1 FP) costs on a single Invocation, dealing the Invocation's full Empowered damage and applying the Resonance's Empowered Effect."
      }
    ],
    "6": [
      {
        name: "Rhythmic Shaping",
        text: "Once per round, when you use an Action to shape an Invocation, you may use a Swift Action to Disengage, Dash, or make a single attack with a Simple Weapon or Sidearm."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "7": [
      {
        name: "Subclass Feature",
        text: "You gain your subclass feature for level 7."
      },
      {
        name: "Master Forging",
        text: "You unlock the **Master Forging** Advanced Techniques, gaining the ability to use **Cooperative Channeling** and create **Sustained Fields**."
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
        name: "Absolute Conduit",
        text: "You gain the following benefits:\n\n• **Strain Resistance:** You completely ignore the mechanical penalties of **Stage 1 Strain (Ripple)** and **Stage 2 Strain (Wave)**. Penalties only begin at Stage 3 (Surge).\n• **Rapid Alignment:** When you roll Initiative with your FP at 0, you immediately regain **2d4 FP** as your body pulls ambient resonance from the environment."
      }
    ],
    "10": [
      {
        name: "Subclass Capstone",
        text: "You gain your subclass capstone feature for level 10."
      }
    ]
  },

  progressionTable: [
    { level: 1, caliber: 1, features: ["Reservoir", "Core Channeling", "Flow Subclass"], resource: "0" },
    { level: 2, caliber: 1, features: ["Controlled Overdraw", "Universal Upgrade"], resource: "0" },
    { level: 3, caliber: 2, features: ["Subclass Feature", "Resonance Synthesis"], resource: "+5 Points" },
    { level: 4, caliber: 2, features: ["Universal Upgrade"], resource: "0" },
    { level: 5, caliber: 3, features: ["Expanded Frequency", "Layered Force"], resource: "0" },
    { level: 6, caliber: 3, features: ["Rhythmic Shaping", "Universal Upgrade"], resource: "0" },
    { level: 7, caliber: 4, features: ["Subclass Feature", "Master Forging"], resource: "+5 Points" },
    { level: 8, caliber: 4, features: ["Universal Upgrade"], resource: "0" },
    { level: 9, caliber: 5, features: ["Absolute Conduit"], resource: "0" },
    { level: 10, caliber: 5, features: ["Subclass Capstone"], resource: "+5 Points" }
  ],

  subclasses: [
    {
      key: "icon",
      name: "The Icon",
      description: "You are a localized demigod of the digital age, drawing your metaphysical weight from the collective obsession of an unseen audience. It does not matter if you built your following as a charismatic provocateur, a relentless truth seeker, a digital instigator, or an absolute menace. You demanded the spotlight, and the Flow answered. Just as ancient spirits starved without worship, your ultimate resonance relies entirely on viewership. You have forged a parasocial pact with the masses, but remember that an audience is a hungry, fickle beast that will gladly consume you the moment you stop being entertaining. The face you show the world is built from Charm; the self beneath it is held together by Mystique. Lose your grip on either, and the show ends.",
      flowAttribute: "Charm",
      features: [
        {
          level: 1,
          name: "Center of Attention",
          text: "**Flow Attribute:** Charm. This drives your Flow Attack rolls, Flow Save DCs, and your Reservoir's Flow Modifier component as normal.\n\n**The Parasocial Pact:** When calculating the size of your Reservoir, add half your Mystique modifier (rounded up, minimum 0) to your maximum FP, on top of the standard formula.\n\n**Metaphysical Live Feed:** You gain Edge on in-combat Charm d20 checks (or +1 Edge Die to related out-of-combat Dice Pools) when dealing with crowds or fans. Once per combat, if you hit an enemy with a Flow Attack after taking a deliberate risk (such as moving out of Cover to expose yourself or taking a dangerous leap), you regain 1d4 FP."
        },
        {
          level: 3,
          name: "Main Character Syndrome",
          text: "**Hey, Look at Me!:** As a **Swift Action**, spend 1 FP to \"Call the Shot.\" Narrate how your next Action will be flashy or dramatic. If that Action requires a d20 roll (an attack or skill check), you gain Edge. On a success, the Invocation or attack deals an additional 1d6 Psychic damage. On a failure, you may make a Mystique Save (DC 12): on a success you take no Strain; on a failure you take 1 Stage of Strain."
        },
        {
          level: 7,
          name: "The Show Must Go On",
          text: "**Plot Armor:** Once per Long Rest, when an attack would reduce you to 0 Wounds, you do not fall Unconscious and do not become Dying. Instead, you remain at 1 Wound and gain 1 Stage of Strain. In the same instant, you emit a pulse of resonance: every enemy within 6 spaces must make a Saving Throw of your choice (DC = 8 + your Charm Modifier + your Caliber).\n\n• **The Spectacle (Charm Save):** On a failure, targets are knocked Prone and Blinded until the end of their next turn.\n• **The Reckoning (Mystique Save):** On a failure, targets are Charmed until the end of their next turn and cannot willingly attack you.\n\n**Authentic Self:** Once per Short Rest, when you would take 1 Stage of Strain from any Icon subclass feature, you may make a Mystique Save (DC 10 + your current Stages of Strain). On a success, you take no Strain and regain 1 FP."
        },
        {
          level: 10,
          name: "Do Not Look Away",
          text: "Once per Long Rest, as an **Action**, spend 2 FP to broadcast your feed into the ambient Flow.\n\n**Audience Capture:** Every enemy within 20 spaces must make a Saving Throw (DC = 8 + your Charm OR Mystique modifier (your choice) + your Caliber). The type depends on which face you project:\n\n• **Project the Icon (Charm Save):** Enemies are captivated by the spectacle. Your broadcast is overwhelming, hypnotic, total.\n• **Project the Self (Mystique Save):** Enemies are captivated by the truth underneath the persona, the raw, unfiltered weight of who you actually are, broadcast at metaphysical volume.\n\nOn a failure, they are completely captivated: they drop their weapons, their Speed becomes 0, and they cannot take Actions or Impulse Actions, only stare. The effect lasts up to 1 minute and ends immediately for any individual target that takes damage."
        }
      ]
    },
    {
      key: "harmonist",
      name: "The Harmonist",
      description: "You coax the Flow through emotional resonance and spiritual empathy. You are the spiritual anchor of the pack and the immune system of the concrete jungle, an urban shaman awakening the sleeping earth beneath the asphalt. You listen to the ancient rhythm of the current, wielding the memories of the earth and the primal cycle of life to protect your people and tear down anything that threatens them.",
      flowAttribute: "Mystique",
      features: [
        {
          level: 1,
          name: "Earthcaller",
          text: "**Flow Attribute:** Mystique.\n\n**Primal Resonance:** You are always considered to be holding a Ritual Implement for shaping Invocations, Ritual Recovery, and Breakflow Restoration, leaving your hands free. You gain Edge on in-combat Intimidation and Persuasion d20 checks (or +1 Edge Die to related out-of-combat Dice Pools), and you can communicate telepathically with any willing ally within 12 spaces while you are chanting, whispering, or breathing rhythmically."
        },
        {
          level: 3,
          name: "Burden of the Earth",
          text: "As a **Swift Action**, spend 1 FP to target a willing ally within 6 spaces. You can purge one elemental or psychic status effect (such as Burning, Poisoned, or Blinded) from them, or transfer 1 Stage of their Strain onto yourself. Strain transferred this way is treated as if caused by Overdraw and cannot be ignored by the Absolute Conduit feature's Strain Resistance."
        },
        {
          level: 7,
          name: "Primal Eruption",
          text: "As an **Action**, spend 2 FP to target an Area 4 Cube within 12 spaces. Enemies in the area must make an Agility Save. On a failure, they take 4d6 Bludgeoning damage and are Restrained by the roots. The area becomes Difficult Terrain for your enemies, but your allies move through it freely and heal 1d4 Vitality the first time they enter the zone on their turn."
        },
        {
          level: 10,
          name: "The World in Bloom",
          text: "Once per Long Rest, as an **Action**, spend 2 FP to infuse the ground in Area 12 with blooming life for 1 minute.\n\n**Womb of the World:** If an ally would be reduced to 0 Wounds while inside the zone, they do not fall Unconscious and do not become Dying. The earth swallows them into a cocoon, restoring Wounds equal to 2d4 + their Body Modifier. While cocooned, they cannot be targeted by attacks and cannot act. At the start of any of their turns, they may burst free; if they have not emerged before the zone ends, the earth ejects them. Each ally can be saved this way once per activation of the zone.\n\n**The Reaper's Bloom:** Whenever an enemy is killed inside the zone, the closest ally to the fallen enemy immediately heals 2d6 Vitality or regains 1d4 FP."
        }
      ]
    },
    {
      key: "kensei",
      name: "The Kensei",
      description: "You are a sword saint of the neon age. You do not force the Flow; you move with it. You are a martial artist of the highest caliber, treating the universal current as a direct extension of your own nervous system and the steel in your hands. You slip through the spaces between reality, turning momentum, gravity, and kinetic energy into a deadly, flawless kata. You are a blur of motion, a frictionless phantom on the battlefield, redirecting the attacks of your enemies before cutting them down with impossible precision.",
      flowAttribute: "Body",
      features: [
        {
          level: 1,
          name: "Resonant Edge",
          text: "**Flow Attribute:** Body.\n\n**Edge of Oneness:** Any melee weapon you are proficient with acts as your Ritual Implement. You can use your Body modifier instead of Agility for the attack and damage rolls of any melee weapon with the Finesse or Light trait. When you cast an Invocation with a Directed (Touch) Delivery, you can deliver the effect through your weapon's strike."
        },
        {
          level: 3,
          name: "Flowstride",
          text: "As a **Swift Action**, spend 1 FP to become frictionless for the rest of your turn. Your Speed increases by 3, you ignore Difficult Terrain, you do not provoke opportunity attacks, and you can run along vertical surfaces, up walls, or across water, so long as you end your turn on solid ground."
        },
        {
          level: 7,
          name: "Spiral Deflection",
          text: "As an **Impulse Action** when you are hit by a ranged ballistic or physical attack, spend 1 FP to deflect the projectile. Reduce the damage by 1d10 + your Body Modifier + your Caliber. If you reduce the damage to 0, you may immediately make a ranged Flow Attack (using your Body Modifier) to redirect the projectile at any target within 6 spaces, dealing its original damage on a hit."
        },
        {
          level: 10,
          name: "Thousand Ripples",
          text: "Once per Long Rest, as an **Action**, spend 2 FP and dissolve into pure motion. You instantly move to every enemy of your choice within 12 spaces and make one standard melee weapon attack against each, without provoking opportunity attacks. After all attacks resolve, you materialize in an unoccupied space adjacent to the final target you attacked."
        }
      ]
    },
    {
      key: "sourcerer",
      name: "The Sourcerer",
      description: "You view technology not as dead metal and cold code, but as a living ecosystem. You understand the hidden language of the machines, allowing you to coax the helpful Nixies and the destructive Gremlins out of the background radiation of the city to do your absolute bidding. You fuse raw magic with intricate circuitry, becoming the ultimate technomancer capable of harmonizing hardware or causing catastrophic mechanical failures with a single touch.",
      flowAttribute: "Tech",
      features: [
        {
          level: 1,
          name: "The Machine Medium",
          text: "**Flow Attribute:** Tech. For you, Tech measures the strength of your tether to the digital substrate where the sprites live and the depth of your standing with them, not technical skill.\n\n**The Invisible Ecosystem:** You do not use wands or crystals; your \"tools\" are whatever the sprites gather around (button cell batteries, a dead phone you never stop talking to, a wind-up toy, a lucky USB stick). You can passively see and hear the Nixies and Gremlins infesting the city's machinery, and they can see you noticing them.\n\n• **Nixie Boon:** When you cast an Invocation, you can spend an additional 1 FP to coax a Nixie into a target's weapon or cybernetics. The target gains a 1d4 bonus on their next attack roll or Saving Throw.\n• **Gremlin Bane:** When you cast an Invocation, you can spend an additional 1 FP to sic a Gremlin onto a target's weapon or cybernetics. The target suffers a 1d4 penalty on their next attack roll or Saving Throw."
        },
        {
          level: 3,
          name: "Hardware Harmonization",
          text: "**Nixie Synchronization:** As a **Swift Action**, spend 1 FP to touch an ally's weapon or cybernetic implant. For the next turn, the ally gains Edge on their next attack roll with that weapon, and the weapon deals an additional 1d6 Force damage on its next hit.\n\n**Gremlin Tantrum:** As a **Swift Action**, spend 1 FP to point the local Gremlins at an enemy's firearm, smart tech, or cyberlimb within 12 spaces. On the enemy's next action, they must make a Tech Save. On a failure, the user takes 1d6 Fire damage and that weapon or cyberlimb seizes up, preventing its use until the end of their next turn."
        },
        {
          level: 7,
          name: "Scrap Familiar",
          text: "Out of combat, spend 10 minutes assembling a Scrap Familiar from loose tech and street debris. In combat, instead spend 2 FP and a **Complex Action** to slap one together on the fly. You can have only one Scrap Familiar active at a time; making a new one causes the old one to fall apart into mundane junk. If you are knocked Unconscious, your active Familiar deactivates until you wake. When you make the Familiar, declare whether a Nixie or a Gremlin moves in; the shape it takes is the sprite's taste, not your blueprint.\n\n**Scrap Familiar Base Stats:**\n• **Defense:** 12 + your Tech Modifier\n• **Vitality:** 15 + (your Caliber × 5)\n• **Speed:** 6 (Hovering)\n• **Size:** Medium Construct\n• **Immunities:** Poison, Psychic, Blinded, Charmed, Frightened\n\n**Nixie Skyhook Familiar:** a mechanical osprey of weathered plating and braided steel cables, with a central winch and electromagnetic talons.\n\n**Out of Combat:**\n• **Vertical Infiltration:** It can fly up to 24 spaces, embed its talons in a surface, and drop a high-tensile cable. Allies using it gain a climbing speed equal to their walking speed and automatically succeed on standard climbing Athletics checks.\n• **Magnetic Anchor:** Anchored to metal or stone, its winch supports 2,000 pounds. Allies using the cable to move heavy obstacles or force doors gain Edge on in-combat Athletics d20 checks (or +1 Edge Die to related out-of-combat Dice Pools).\n• **Beast of Burden:** It can carry up to 200 pounds of gear or an unconscious ally without reducing its 6-space flying speed.\n\n**In Combat:** It acts on your turn, and you can command it to move as a free action. As a **Swift Action**, command a **Magnetic Rescue:** it shoots a line to a willing ally within 6 spaces and reels them to an adjacent unoccupied space, ignoring Difficult Terrain and opportunity attacks.\n\n**Gremlin Scourge Familiar:** a massive mechanical rat of rusted engine blocks, copper wire, and razor-blade whiskers, trailing a cloud of mechanical fleas.\n\n**Out of Combat:**\n• **Comms Jamming:** Scramble all unencrypted hostile radio and digital communications within an Area 20 for up to 1 hour.\n• **Acoustic Dampening:** Project an Area 3 Aura of silence centered on the construct. Allies moving within it make no noise and gain Edge on in-combat Stealth d20 checks (or +1 Edge Die to related out-of-combat Dice Pools).\n• **Auditory Decoy:** Project an auditory illusion (a firefight, alarm, or breaching charge, up to 120 decibels) at any point within 12 spaces for up to 1 minute.\n\n**In Combat:** It acts on your turn, and you can command it to move as a free action. As a **Swift Action**, command a **Sensory Overload:** it sends its fleas onto a target within 3 spaces, which must make a Wits Save. On a failure, they take 2d6 Psychic damage and are Blinded until the start of your next turn. Once an enemy succeeds on this Wits Save, they become immune to Sensory Overload for 24 hours."
        },
        {
          level: 10,
          name: "Absolute Symbiosis",
          text: "Once per Long Rest, as an **Action**, spend 2 FP to host both kinds of sprite for 1 minute. On activation, all enemies within 4 spaces must make a Tech Save or take 4d6 Electric damage and be pushed 2 spaces away from you. For the duration, you project an Area 4 Aura:\n\n**The Gremlin Storm:** Any enemy that starts its turn within the aura takes 4d4 Electric damage. Enemies inside the aura suffer Snag on all attack rolls, and the swarm denies them any Defense bonus from physical Cover.\n\n**The Nixie Optimization:** At the start of your turn, you regain 2d6 Vitality (if your Vitality is full, you gain it as Vigor instead). You can cast any Invocation with a Tech delivery method as a **Swift Action** instead of an Action, and your movement does not provoke opportunity attacks."
        }
      ]
    }
  ],

  extra: {
    playbook: {
      turnToTurn: "You are a dynamic problem solver. Because you build Invocations on the fly rather than relying on static spells, you adapt to the exact needs of the moment. You manage your Reservoir carefully, deciding when to unleash a massive area effect and when to rely on precise, low cost manipulations.",
      winningEncounters: "You win by dictating the terms of reality. You shift the battlefield environment, exploit enemy elemental vulnerabilities, and use your subclass abilities to violently disrupt the opposition. When a fight gets desperate, you win by being willing to push your body into Overdraw to secure a victory.",
      whatToAvoid: "Reckless Overdraw and ignoring your physical limits. Burning through your Flow Points too early leaves you entirely reliant on Overdraw. Accumulating too much Strain will quickly tear your body apart from the inside out before the enemy even touches you."
    },
    flowDC: "Flow Save DC and Flow Attack are driven by your subclass Flow Attribute (Charm, Mystique, Body, or Tech). Subclass-stated saves use DC = 8 + your [Flow Attribute] Modifier + your Caliber (e.g., The Icon: DC = 8 + your Charm Modifier + your Caliber).",
    maxFlow: "Your maximum FP is equal to (Caliber x 3) + your Flow Modifier.",
    flowAttributeBySubclass: {
      icon: "Charm (The Icon may also add half Mystique modifier, rounded up, minimum 0, to maximum FP via The Parasocial Pact)",
      harmonist: "Mystique",
      kensei: "Body",
      sourcerer: "Tech"
    },
    coreChanneling: "You do not memorize static spells; you shape the current on the fly. You begin play knowing three Base Resonances chosen from the standard list: Kinetic, Thermal, Electromagnetic, Visceral, or Spatial. When you channel the Flow, you spend FP to build an Invocation using your known Resonances combined with the Intent, Delivery, Force, and Duration rules. At Level 3 you may learn the Cognitive Base Resonance (total four); at Level 5 you may learn the Temporal Base Resonance (total five).",
    resonances: {
      base: ["Kinetic", "Thermal", "Electromagnetic", "Visceral", "Spatial", "Cognitive (Level 3)", "Temporal (Level 5)"],
      advancedTechniques: ["Flow Linking (Level 3, Resonance Synthesis)", "Resonance Amplification (Level 3, Resonance Synthesis)", "Cooperative Channeling (Level 7, Master Forging)", "Sustained Fields (Level 7, Master Forging)"]
    },
    invocations: "When you channel the Flow, you spend FP to build an Invocation using your known Resonances combined with the Intent, Delivery, Force, and Duration rules. Layered Force (Level 5) lets you pay both the Hybrid (1 FP) and Empowered Force (1 FP) costs on a single Invocation, dealing full Empowered damage and applying the Resonance's Empowered Effect.",
    overdraw: "If your FP drops to 0, you may continue to shape by entering Overdraw, losing 1d4 Vitality per FP spent and risking Strain. Controlled Overdraw (Level 2): once per Short Rest, when FP is at 0 and you declare an Overdraw, you may ignore the Vitality loss and Strain accumulation for up to 2 FP worth of Overdraw; if the Invocation costs more than 2 FP, you take the Vitality damage and Strain for the remainder as normal.",
    strain: "Strain accumulates from Overdraw and certain effects. Strain stages referenced: Stage 1 Strain (Ripple), Stage 2 Strain (Wave), Stage 3 (Surge). Absolute Conduit (Level 9) completely ignores the mechanical penalties of Stage 1 (Ripple) and Stage 2 (Wave); you only begin suffering penalties at Stage 3 (Surge). Note: Strain transferred through the Harmonist's Burden of the Earth is treated as if caused by Overdraw and cannot be ignored by Absolute Conduit's Strain Resistance.",
    breakflow: "Referenced under the Harmonist's Primal Resonance: a Ritual Implement is required for the purposes of shaping Invocations, Ritual Recovery, and Breakflow Restoration. (Full Breakflow rules are not detailed within this source range.)",
    familiars: [
      {
        name: "Scrap Familiar (Base Stats)",
        subclass: "The Sourcerer (Level 7)",
        stats: {
          defense: "12 plus your Tech Modifier",
          vitality: "15 plus (Your Caliber multiplied by 5)",
          speed: "6 (Hovering)",
          size: "Medium Construct",
          immunities: ["Poison", "Psychic", "Blinded", "Charmed", "Frightened"]
        },
        text: "You can spend 10 minutes outside of combat to build a Scrap Familiar. Alternatively, in the heat of battle, you can spend 2 FP and a Complex Action to rapidly assemble one out of the surrounding environment. You can only have one Scrap Familiar active at a time. If you build a new one, the old one instantly falls apart into mundane junk. If you are knocked Unconscious, your active Familiar deactivates until you awaken. When you build the Familiar, you must declare whether you are housing a Nixie or a Gremlin."
      },
      {
        name: "Nixie Skyhook Familiar",
        subclass: "The Sourcerer (Level 7)",
        text: "This Medium construct is a mechanical osprey built from weathered plating and braided steel cables. Precision drone rotors pulse with soft blue Nixie energy within its wings, while a central winch and electromagnetic talons sit ready for heavy lifting.\n\nOut of Combat Utility: The Nixie acts as a logistical dream, providing immense physical utility.\n• **Vertical Infiltration:** The Nixie can fly up to 24 spaces, magnetically embed its talons into a surface, and drop a high-tensile cable. Allies using it gain a climbing speed equal to their walking speed and automatically succeed on standard climbing Athletics checks.\n• **Magnetic Anchor:** While anchored to metal or stone, the Nixie's winch can support 2,000 pounds of static weight. Allies using the cable to move heavy obstacles or force doors gain Edge on in-combat Athletics d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools).\n• **Beast of Burden:** It can carry up to 200 pounds of gear or an unconscious ally without reducing its 6-space flying speed.\n\nIn Combat: It acts on your turn. You can command it to move as a free action. As a Swift Action, you can command a Magnetic Rescue. The Nixie shoots a glowing line to a willing ally within 6 spaces and instantly reels them to an adjacent unoccupied space. This rapid movement ignores Difficult Terrain and opportunity attacks."
      },
      {
        name: "Gremlin Scourge Familiar",
        subclass: "The Sourcerer (Level 7)",
        text: "This Medium construct resembles a massive mechanical rat forged from rusted engine blocks, copper wire, and razor blade whiskers. Its chassis constantly vibrates with a swarming cloud of tiny mechanical fleas acting as its sensors and saboteurs.\n\nOut of Combat Utility: The Gremlin and its fleas act as a mobile disruption field.\n• **Comms Jamming:** Scramble all unencrypted hostile radio and digital communications within an Area 20 for up to 1 hour.\n• **Acoustic Dampening:** Activate an Area 3 Aura of silence centered on the construct. Allies moving within this aura make absolutely no noise and gain Edge on in-combat Stealth d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools).\n• **Auditory Decoy:** Project an intense auditory illusion mimicking a firefight, alarm, or breaching charge (up to 120 decibels) at any point within 12 spaces for up to 1 minute.\n\nIn Combat: It acts on your turn. You can command it to move as a free action. As a Swift Action, you can command a Sensory Overload. The rat sends its fleas leaping onto a target within 3 spaces to scream malicious code. The target must make a Wits Save. On a failure, they take 2d6 Psychic damage and are Blinded until the start of your next turn. Once an enemy succeeds on this Wits Save, their optics adapt to the interference, and they become immune to Sensory Overload for 24 hours."
      }
    ]
  }
};
