window.EN = window.EN || {};
EN.classes = EN.classes || {};

// Leverage Abilities as structured sub-entries: the single source for the engine, the Class-tab
// picker, and the print sheet. The Leverage feature's prose (below) is composed from this list,
// so the displayed text and the machine-readable data can never drift apart. The Hustler learns
// two at Level 1 and two more at Level 5 via Expanded Leverage; unless noted each costs 1 Leverage.
var HUSTLER_LEVERAGE_INTRO = "The Hustler does not rely on the Flow or brute strength; they rely on Leverage. Leverage represents tactical callouts, psychological pressure, and exploiting split-second openings.\n\nYour Leverage Pool\nYour maximum Leverage is equal to your Caliber + your Charm Modifier (minimum of 1). You regain all spent Leverage at the end of a Short or Long Rest.\n\nLeverage Abilities\nAt 1st Level you learn two Leverage Abilities of your choice from the list below; you learn two more at 5th Level through Expanded Leverage. Unless otherwise noted, all Leverage abilities cost 1 Leverage to activate.";
var HUSTLER_LEVERAGE_ABILITIES = [
  { name: "Pressure Play", action: "Action", cost: 1, text: "Target one enemy you can see within 12 spaces. You exploit a psychological crack or feed your crew the perfect angle on a target. The next attack made against that enemy before the start of your next turn gains Edge. If the attack hits, it deals additional damage equal to your Caliber." },
  { name: "Backchannel", action: "Impulse Action", cost: 1, text: "Trigger: An ally within 6 spaces fails a d20 check. You drop a sudden distraction; a flicked coin, a flashed light, or a perfectly timed whisper over encrypted comms. They may immediately reroll the d20 but must keep the new result." },
  { name: "Exit Strategy", action: "Swift Action", cost: 1, text: "Target yourself or one ally within 12 spaces who can hear or see you. A good Hustler always knows where the back door is. You call out a blind spot in the enemy's formation, and the target immediately moves up to their Speed as a free action without provoking Opportunity Attacks." },
  { name: "The Shell Game", action: "Impulse Action", cost: 1, text: "Trigger: An enemy targets you with an attack. The classic misdirection. You use the chaotic environment, a holographic glitch, or a very unlucky bystander to take the heat. You force the attacking enemy to target another Target of your choice (friend or foe) within the attack's range or reach. The attacker rolls that attack with Snag." },
  { name: "Eye on the Prize", action: "Swift Action", cost: 1, text: "Target yourself or one ally within 12 spaces. You snap them back to reality with a harsh truth or a reminder of the payout. The target may immediately roll a Save to end one negative condition currently affecting them (such as Dazed, Staggered, or Bleeding)." },
  { name: "Dirty Laundry", action: "Action", cost: 1, text: "Target one enemy within 12 spaces. You know where they bought their chrome, and you know the manufacturer's defect. You broadcast the exact structural flaw to your team. Until the start of your next turn, that enemy's Defense is reduced by your Charm Modifier (minimum of 1), and they cannot benefit from Cover." },
  { name: "Cause a Scene", action: "Action", cost: 1, text: "Choose a point you can see within 12 spaces. You crank the chaos: a thrown chair, a kicked-over rack, a triggered alarm, a bystander shoved into the open. Every enemy within 2 spaces of that point must make a Wits Save (DC = 8 + your Charm Modifier + your Caliber). On a failure, the distraction throws off their aim and they roll with Snag on attack rolls until the start of your next turn." },
  { name: "Vanishing Act", action: "Swift Action", cost: 1, text: "You disappear into the noise of the firefight: a palmed smoke tab, a ducked angle, a borrowed silhouette. You immediately move up to half your Speed without provoking Opportunity Attacks, and until the start of your next turn, attacks against you roll with Snag." }
];
var HUSTLER_LEVERAGE_TEXT = HUSTLER_LEVERAGE_INTRO + "\n" + HUSTLER_LEVERAGE_ABILITIES.map(function (a) {
  return "     " + a.name + (a.action ? " (" + a.action + ")" : "") + ": " + a.text;
}).join("\n");

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
        text: "You instinctively map the social and tactical layout of a space. Once per scene, as a Free Action, you can observe your surroundings to definitively identify who holds the most authority in the room, and who is currently suffering the most Fatigue (or has the lowest Vitality).\n\nBecause you know exactly who to flatter and who to pressure, you gain Edge on your first in-combat social d20 check against that authority figure (or add +1 Edge Die to your first out-of-combat social Dice Pool check). Alternatively, you gain Edge on your first attack roll against the Target with the most Fatigue or lowest Vitality, or the first Leverage ability you direct at them costs 0 Leverage."
      },
      {
        name: "Hustler Subclass",
        text: "You choose a Hustler subclass, representing your specialization. This subclass grants features at specific Hustler levels. You gain all subclass features for which you meet the required Hustler level, both now and as you continue to advance."
      }
    ],
    "2": [
      {
        name: "Slippery",
        text: "You know better than to stand still when a deal goes bad, and you turn your evasive maneuvers into lasting momentum. Whenever you spend an Action to Dash, a Swift Action to Disengage, or an Impulse Action to Dodge, your erratic movement makes you exceptionally hard to pin down. You gain a bonus to your Defense equal to your Caliber until the start of your next turn."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
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
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "5": [
      {
        name: "Compound Interest",
        text: "Your tactical processing speed reaches its peak, allowing you to manipulate multiple pieces on the board at once.\n\nWhen you activate a Leverage ability that targets a single target, you may spend 1 additional Leverage to extend that exact ability to a second valid target within range. If the original ability targeted an ally, the second target must also be an ally; if it targeted an enemy, the second target must also be an enemy. This feature only duplicates the specific Leverage ability you just activated; you cannot use this feature to activate two different Leverage abilities at the same time."
      },
      {
        name: "Expanded Leverage",
        text: "You learn two additional Leverage Abilities from the core list."
      }
    ],
    "6": [
      {
        name: "Two Steps Ahead",
        text: "You have learned to recognize the exact moment an enemy overcommits. Because of that, you have an uncanny ability to make them feel like you know exactly what they are going to do before they even do it. Once per encounter, when an enemy declares an Action, you can use your Impulse Action to casually reveal that their maneuver is exactly what you wanted them to do.\n\nThis sudden psychological pressure causes them to second-guess their strike, imposing Snag on their d20 roll. If their attack roll misses or their contested check fails, the sheer panic of realizing they've been played completely shatters their focus; they are immediately inflicted with the Staggered condition (Speed halved, lose Swift/Impulse actions) until the end of their next turn as they stumble blindly into your trap."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
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
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "9": [
      {
        name: "Return on Investment (ROI)",
        text: "You view your crew not just as teammates, but as high-yield assets, and you never let a sudden surge in the market go to waste. Whenever you or an ally within 6 spaces rolls a Critical Success (Natural 20) on a d20 roll, the sheer perfection of the maneuver pays immediate dividends, instantly refunding your tactical capital. You immediately regain 1 spent Leverage (this cannot exceed your maximum)."
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
          text: "You read a room of armed thugs the same way you read a quarterly earnings report. You gain Proficiency with Security Tools, and you may use your Wits modifier instead of Agility when rolling Initiative. Additionally, your mind constantly maps the structural value of your environment. If you spend 10 minutes observing a location or studying its blueprints, you cannot get lost in it, and you gain Edge on in-combat Wits-based d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools) made to identify security blind-spots, structural weaknesses, or hidden routes within that location."
        },
        {
          level: 3,
          name: "Asset Reallocation",
          text: "You view your crew as high-yield investments, and you know exactly when to move them for maximum return. Immediately after Initiative is rolled, but before the first turn of combat begins, you can spend 1 Leverage to issue rapid-fire corporate restructuring. Choose a number of allies up to your Wits Modifier (minimum of 1). Those allies may immediately move up to half their Speed. This movement happens outside the normal turn order and does not provoke Opportunity Attacks, allowing your team to instantly secure cover or close the gap before the market opens."
        },
        {
          level: 7,
          name: "Mandatory Overtime",
          text: "You view your crew's physical limits as mere suggestions, and you know exactly how to squeeze every drop of productivity out of them. As a Swift Action, you can spend 2 Leverage to demand immediate, lethal results from one ally within 12 spaces who can hear you.\n\nThat ally may immediately use their Impulse Action to make a standard weapon attack (or cast a 1-Action Invocation). Because they are operating under your terrifying corporate mandate, this attack is made with Edge, and if it hits, you do not roll for damage, the attack automatically deals the maximum possible damage on the dice.\n\nHowever, your ruthless pressure extracts a toll: immediately after the attack resolves, the ally takes unavoidable physical damage equal to your Caliber + your Wits Modifier as their body painfully strains to meet your impossible expectations.\n\nFine, I'll Do It Myself: If the targeted ally refuses the mandate or is unable to take the Impulse Action, your Swift Action and Leverage are not wasted. You roll your eyes, adjust your cuffs, and apply the mandate to yourself. The next standard weapon attack you make before the end of your current turn gains Edge and deals maximum damage on a hit, though you are too well-conditioned to suffer the physical strain damage."
        },
        {
          level: 10,
          name: "Company-Wide Liquidation",
          text: "You do not participate in the violence; you simply sign the termination papers and let the market correct itself. Once per Long Rest, as an Action, you can declare an absolute, undeniable kill-order on one enemy you can see, authorizing a limitless expense account for their immediate destruction.\n\nUpon declaring the liquidation, every willing ally within 12 spaces may immediately move up to their Speed and make one standard weapon attack against that enemy. This movement and attack occur entirely outside the normal turn order and do not cost the allies any of their own Actions, Swift Actions, or Impulse Actions.\n\nSeverance Package: If the enemy is reduced to 0 Vitality by this corporate barrage, the sheer efficiency of the hostile takeover pays dividends; you and all participating allies immediately gain Vigor equal to your Caliber + your Charm Modifier as your \"performance bonus.\""
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
          text: "You treat identity as a disposable asset and lie as easily as you breathe. You gain Proficiency with Infiltration Tools and Forgery Tools. Additionally, if you spend one minute observing a target or listening to them speak, you can perfectly mimic their voice, cadence, and physical mannerisms. When utilizing this mimicry, presenting fake credentials, or wearing a physical disguise, you gain Edge on in-combat Deception d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools) made to pass yourself off as someone else or bluff your way past security."
        },
        {
          level: 3,
          name: "A Sucker Born Every Minute",
          text: "You know exactly how to read a room to find the one person who will buy whatever you're selling, or fall for your worst feints. With just a few seconds of observation or conversation (costing a Swift Action during combat) you can designate one Target you can see as your Mark. To avoid overplaying your hand, you can only establish a new Mark once per scene when operating outside of combat.\n\nWhile a Target is your Mark, you gain Edge on in-combat Deception and Sleight d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools) made against them. Additionally, you are so adept at predicting their reactions that they suffer Snag on all attack rolls made against you. If you succeed on a Deception or Sleight check against your Mark, or if they target you with an attack and miss, their misplaced trust or mounting frustration leaves them vulnerable; once per round, you immediately regain 1 spent Leverage (this cannot exceed your maximum). You can only have one Mark at a time. The effect ends if the Mark dies, if you designate a new Mark, or at the end of the encounter or scene."
        },
        {
          level: 7,
          name: "Gaslight",
          text: "As an Action, you can spend 2 Leverage to target one enemy within 12 spaces who can hear you. They must make a Wits Save (DC = 8 + your Charm Modifier + your Caliber). On a failure, the enemy is violently disoriented by your psychological manipulation for up to 1 minute. During this time, they perceive their allies as enemies, and you and your allies as friendly. On their turn, they must use their Action to attack the nearest valid target they now perceive as a threat (their own team).\n\nIf no such targets are in range, they are instead inflicted with the Confused condition for the duration. If their roll on the Confusion table results in attacking the nearest Target, their paranoia completely paralyzes them instead; they take no actions and lose their turn.\n\nThe target may repeat the Wits Save at the end of each of their turns. Additionally, if the target takes damage from you or your allies (the people they currently perceive as \"friendly\"), they may immediately make a Wits Save with Edge to snap out of the delusion and end the effect."
        },
        {
          level: 10,
          name: "Character Assassination",
          text: "You can fabricate a lie so flawless and devastating that it completely breaks an enemy's will to fight. Once per Long Rest, as an Action, you can deliver a psychological kill-shot: a forged termination order, proof that their boss sold them out, or the \"activation phrase\" of a sleeper agent program that doesn't actually exist.\n\nChoose a number of enemies up to your Charm Modifier within 12 spaces who can hear and understand you. They must make a Wits Save (DC = 8 + your Charm Modifier + your Caliber).\n\nOn a failure, their morale violently collapses. The GM must choose how they break: they either immediately drop their weapons and flee the encounter, or they become convinced their allies are the real threat and spend the rest of the encounter attacking their own side.\n\nEven on a successful save, the seed of doubt lingers; they are inflicted with the Confused condition until the end of their next turn as they try to process the lie."
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
          text: "You treat the city's underworld like your personal Rolodex and view every piece of gear as a potential asset. You gain Proficiency with Engineering Tools, and you gain +1 Edge Die on all out-of-combat Dice Pool checks made to locate restricted gear, secure black-market Nexus Token exchanges, or find a safehouse. Additionally, by spending one minute examining a weapon, vehicle, or piece of cyber-tech, you instantly determine its exact black-market value, its origin (manufacturer or previous owner's faction), and whether it is currently counterfeit, bugged with a tracker, or actively malfunctioning."
        },
        {
          level: 3,
          name: "The Fix Is In",
          text: "When an ally within 6 spaces takes damage from an attack, you can use your Impulse Action and spend 1 Leverage to cash in a micro-favor (e.g., a bribed grid-worker cutting the lights, or a street kid dropping an obstacle). You reduce the incoming damage by 1d6 + your Charm Modifier + your Caliber. If this reduces the damage to 0, the ally may immediately move up to 2 spaces without provoking Opportunity Attacks."
        },
        {
          level: 7,
          name: "Off-the-Books Asset",
          text: "Once per encounter, you can use your Action and spend 2 Leverage to send an encrypted ping to a heavy-hitter on standby. Target an Area 2 you can see within 24 spaces. All enemies in that area must make an Agility Save (DC = 8 + your Charm Modifier + your Caliber). On a failure, they take 3d8 + your Charm Modifier in physical or energy damage (your choice) and are knocked Prone as the sudden external assault catches them off guard. On a success, they take half damage and are not knocked prone."
        },
        {
          level: 10,
          name: "Corner the Market",
          text: "Once per Long Rest, when you roll Initiative, you can declare that you tracked the enemy's movements earlier that day and made a few well-placed phone calls to sabotage them. Choose a number of enemies up to your Charm Modifier. Those enemies begin the encounter with their logistics compromised:\n\nBad Ammo/Corrupted Cybernetics: They must spend a Swift Action on their first turn clearing a weapon jam or rebooting their systems before they can make an attack.\n\nTampered Gear: They cannot use consumable items, explosives, or healing tech for the duration of the encounter.\n\nThe Setup: Because of your flawless underworld preparation, you start this encounter with 2 temporary Leverage. This temporary Leverage can exceed your normal maximum, but it must be spent before the end of the first round of combat, or it is lost."
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
var OPERATOR_TACTICAL_INTRO = "You thrive in the chaos of a firefight, directing traffic and creating openings for your crew. You have a pool of Execution (EX) equal to your Caliber + your Wits Modifier.\n\nYou regain all spent Execution at the end of a Short or Long Rest. You know every Call below, and may spend 1 EX to make any of them.\n\nSuppression. Several of your Calls leave a target Suppressed. A Suppressed Target rolls with Snag on attack rolls and cannot take Impulse Actions until the suppression ends. Suppression is your signature. You do not merely hurt the enemy, you strip away their ability to fight back cleanly, pin them in place, and hand your crew a target that cannot punish them for moving in.";
var OPERATOR_TACTICAL_MANEUVERS = [
  { name: "Suppressing Fire", action: "Action", cost: 1, text: "Choose a point within your weapon's range, then an Area 3 around that point. You rake the area with disciplined fire, forcing every head down. Each Enemy in the area must succeed on an Agility Save (DC = 8 + your Wits Modifier + your Caliber) or become Suppressed until the start of your next turn. This Call deals no damage. The point is not to kill the room. The point is to own it." },
  { name: "Take the Angle", action: "Swift Action", cost: 1, text: "You break to a firing position your enemy did not account for. You move up to your Speed without provoking opportunity attacks. If you end this movement with Line of Sight to an Enemy you did not have Line of Sight to at the start of your turn, your next weapon attack this turn ignores the Defense bonus of their Cover. You spent the movement finding the gap; now you shoot through it." },
  { name: "Call the Angle", action: "Swift Action", cost: 1, text: "Designate an Enemy you can see. You read the geometry of their cover and call the exact firing solution to your crew. Until the start of your next turn, attacks against that Enemy made by you or your allies ignore the Defense bonus of Half and Three-Quarter Cover. You cannot make them stand in the open, so you teach everyone how to shoot around the wall." },
  { name: "Reposition", action: "Swift Action", cost: 1, text: "Target one Ally within 12 spaces who can hear you. You call the better position before they know they need it. That Ally may immediately move up to half their Speed as a Free Action without provoking opportunity attacks." },
  { name: "Focus Fire", action: "Special", cost: 1, text: "When you hit an Enemy with a weapon attack, you may spend 1 EX to mark them. The next attack made against that specific Enemy by you or an Ally before the start of your next turn gains Edge." },
  { name: "Pin Down", action: "Impulse Action", cost: 1, text: "Trigger: An Enemy you can see within your weapon's range uses its movement. You snap off a controlled shot to keep them where you want them. Make a weapon attack against that Enemy. On a hit, deal normal damage and they are Suppressed until the start of your next turn. Alternatively, you may choose to deal no damage and instead drive them back under cover: their Speed becomes 0 for the rest of their turn." },
  { name: "Covering Fire", action: "Impulse Action", cost: 1, text: "Trigger: An Enemy you can see makes a weapon attack against an ally within 12 spaces, and you have Line of Sight to that Enemy. You answer with suppressing fire before their shot lands clean. The attacker rolls that attack with Snag and is Suppressed until the start of your next turn. This is what protecting your crew looks like when you have a longarm instead of a shield." },
  { name: "Fire on My Mark", action: "Impulse Action", cost: 1, text: "Trigger: You leave an Enemy Suppressed, or hit an Enemy with a weapon attack. You call the opening the instant it exists. One Ally within 12 spaces who can see or hear you may immediately use their Impulse Action to make a single weapon attack against that Enemy." }
];
var OPERATOR_TACTICAL_TEXT = OPERATOR_TACTICAL_INTRO + "\n\nTactical Maneuvers\n" + OPERATOR_TACTICAL_MANEUVERS.map(function (m) {
  return "     " + m.name + (m.action ? " (" + m.action + ")" : "") + ": " + m.text;
}).join("\n");

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
        text: "You know how to lock down a firing lane. As an Action, you can establish an Overwatch zone covering an Area 6 Cone or Area 12 Line.\n\nUntil the start of your next turn, the first Enemy to move, attack, or cast an Invocation within that zone triggers your trap, provided you have Line of Sight to the Target. You may immediately make a weapon attack against them as an Impulse Action. If your attack hits, their Speed is reduced to 0 for the remainder of their turn as they are pinned down by suppressing fire.\n\nTo maintain this active threat, you must expose yourself to track the zone. You cannot use this feature while benefiting from Full Cover, though you may still benefit from Half or Three Quarter Cover."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
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
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "5": [
      {
        name: "Fluid Engagement",
        text: "Your muscle memory and combat discipline allow you to strike with lethal efficiency. When you take the Attack action on your turn, you can attack twice instead of once."
      }
    ],
    "6": [
      {
        name: "Breacher's Momentum",
        text: "You feed on the shifting momentum of a successful assault. Whenever you drop an enemy to 0 Vitality or score a critical hit, you immediately regain 1 Execution and may move up to 3 spaces as a free action. This movement does not provoke opportunity attacks."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
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
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "9": [
      {
        name: "Absolute Discipline",
        text: "Your situational awareness borders on precognition. You gain the following benefits:\n\nVeteran Instincts: You cannot be Surprised, and you gain Edge on all Initiative rolls.\n\nRallying Cry: When you roll Initiative, if you have 0 Execution remaining, you immediately regain 2 Execution."
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
          text: "You specialize in the tight confines of room clearing, mastering the combination of a physical shield and a one handed weapon. You gain proficiency with Physical Shields. When you wield a Physical Shield in one hand and a Sidearm, Simple Weapon, or Martial Weapon (provided it lacks the Heavy or Two Handed trait) in the other, you gain the following benefits:\n\nClose Quarters Supremacy: If you are wielding a Sidearm, your ranged attacks do not suffer Snag when fired at an Enemy within melee range.\n\nActive Shielding: You can use your Physical Shield as a brutal melee weapon that deals 1d6 Bludgeoning damage. Whenever you successfully use the Shove action against an Enemy, you automatically deal this damage as you bash them with the shield face.\n\nBreacher's Step: Your tactical conditioning kicks in the exact moment a door is breached. When you roll Initiative, you and up to one Ally of your choice can immediately move up to 3 spaces as a free action to secure a chokepoint, stack up on a doorway, or snap into cover before the first shot is even fired."
        },
        {
          level: 3,
          name: "Intercepting Guard",
          text: "You treat your shield as a communal asset. When an Ally within 2 spaces of you is targeted by a physical or ballistic attack, you can spend 1 Execution as an Impulse Action to intervene. You immediately move into an unoccupied space adjacent to that Ally and throw your shield into the line of fire, forcing the attacker to roll against your Defense instead of your Ally's Defense.\n\nIf the attack misses, you may immediately strike back, making a single retaliatory attack against the attacker with your equipped weapon or a shield bash."
        },
        {
          level: 7,
          name: "CQC Takedown",
          text: "You are a master of point blank neutralization and confirming your kills. You gain the following two abilities:\n\nCQC Takedown: As an Action, you can spend 2 Execution to execute a devastating close quarters combination using your shield edge and your equipped weapon against an adjacent Enemy. The Target must make a Body Save (DC = 8 + your Body Modifier + your Athletics Proficiency Bonus). On a failure, they take 3d6 Bludgeoning damage, are knocked Prone, and are Stunned until the end of your next turn as you physically batter them into submission. On a success, they take half damage and are not Stunned.\n\nDouble Tap: You never leave a threat unresolved. Whenever an Enemy within 2 spaces of you is knocked Prone by any source, you can use your Impulse Action to immediately make a single retaliatory attack against them. If you are utilizing a melee weapon or a shield bash for this attack, you can step up to 1 space as part of this reaction to reach them."
        },
        {
          level: 10,
          name: "Room Sweeper",
          text: "You process the geometry and threat priorities of a room perfectly, picking apart enemy defenses with surgical strikes and shield bashes. Once per Long Rest, as a Swift Action, you lock in your targets. For 1 minute:\n\nYou completely ignore all Enemy Cover bonuses when attacking with your equipped weapon, effortlessly shooting around barricades or smashing right through them.\n\nYour weapon and shield attacks score a Critical Hit on a natural roll of 18, 19, or 20.\n\nAny time you score a Critical Hit on an Enemy, the sheer kinetic force of your blow violently knocks them Prone. This instantly sets them up for your Double Tap ability, creating a devastating and self sustaining loop of close quarters execution."
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
          text: "You are trained to make every single bullet count, regardless of the weapon caliber. You gain Proficiency in the Stealth or Acrobatics skill (your choice). Furthermore, when making a ranged weapon attack, you do not suffer Snag for firing beyond your weapon's standard range, allowing you to shoot accurately up to the weapon's maximum limit. As long as you have not moved during your current turn, your ability to read a Target's posture allows you to ignore the Defense bonuses provided by Half Cover."
        },
        {
          level: 3,
          name: "Hair Trigger",
          text: "You can lock down a massive area with the threat of immediate retaliation. You can spend 1 Execution to overcharge your Overwatch Protocol.\n\nWhen you take the Action to establish an Overwatch zone, you double its size (creating either an Area 12 Cone or Area 24 Line). Additionally, because you possess highly refined reflexes and fast target acquisition, if an Enemy triggers this Overwatch, you gain Edge on the resulting attack roll."
        },
        {
          level: 7,
          name: "Ricochet Trajectory",
          text: "You read the geometry of the battlefield with extreme clarity. As an Action, you can spend 2 Execution to bounce a shot off the environment, hitting a Target you cannot physically see.\n\nMake a ranged attack roll against a Target within 6 spaces of a solid surface you can see. On a hit, they take normal weapon damage plus an additional 2d6 Ballistic damage, and are completely disoriented by the unexpected angle. They suffer the Staggered condition until the end of their next turn as they scramble to figure out where the shot came from."
        },
        {
          level: 10,
          name: "The Killing Floor",
          text: "You achieve a state of terrifying focus, turning any shootout into your personal firing range. Once per Long Rest, as an Action, you establish a massive kill zone. You declare an Area 20 that you can see as your active domain for 1 minute.\n\nDuring this time, any Enemy that moves, attacks, or casts an Invocation within this area automatically triggers an Overwatch shot from you, provided you have Line of Sight to the Target. You can take an unlimited number of Impulse Actions to make these retaliatory shots, though you can only fire at each specific Enemy once per round.\n\nTo maintain this relentless pace of fire and tracking, you must actively expose yourself to follow the Targets. You cannot use this feature while benefiting from Full Cover, though you may still benefit from Half or Three Quarter Cover."
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
          text: "You specialize in hunting down specific targets and refusing to let them fade into the neon glow of the city. You gain Proficiency in the Survival skill.\n\nFurthermore, you permanently upgrade your base Focus Fire tactical maneuver. When you spend 1 EX to mark a Target with Focus Fire, the tracking benefits of the mark last for 1 full minute. (The Edge granted by Focus Fire still only applies to the first attack made by an Ally). For the full minute that the Target is marked, they cannot benefit from the Hidden or Invisible conditions against you, and you always know their exact location as long as they remain within 24 spaces of you."
        },
        {
          level: 3,
          name: "Disarming Precision",
          text: "You know exactly how to shoot a weapon right out of someone's hands. Whenever you successfully hit an Enemy with a weapon attack, you can spend 1 Execution. The Target must make a Body or Agility Save. On a failure, they are forced to drop one weapon or object they are holding. Furthermore, you keep your sights locked on the dropped item; if the Target attempts to pick it up before the end of their next turn, you may immediately fire a single retaliatory shot at them as an Impulse Action."
        },
        {
          level: 7,
          name: "Cornered Prey",
          text: "You methodically dismantle an Enemy's safety net, leaving them completely exposed. As an Action, you can spend 2 Execution to unleash a relentless, calculated sequence of shots or strikes against an Enemy within your weapon's range. Because of your pinpoint accuracy, this attack completely ignores the Defense bonuses provided by Half or Three Quarter Cover.\n\nThe Target must make an Agility Save. On a failure, they take 3d6 Ballistic or Physical damage and are inflicted with the Staggered condition until the end of your next turn. Furthermore, if the cover they are utilizing is categorized as Average or weaker (such as standard doors, drywall, or shipping crates), the sheer volume of your precision fire instantly reduces that section of cover to 0 Integrity, destroying it. If the cover is Heavy, Fortified, or Hardened, the cover remains intact, but the Target still suffers the damage and condition as you perfectly thread your shots through their firing angles.\n\nOn a successful save, they take half damage, are not Staggered, and their cover takes no damage from this ability."
        },
        {
          level: 10,
          name: "Dead or Alive",
          text: "You systematically dismantle your target's physical ability to fight, ensuring they go down exactly how and when you decide. Once per Long Rest, as an Action, you declare an execution order on a target within 12 spaces. For 1 minute, your weapon attacks against the target bypass superficial endurance to inflict severe physical trauma.\n\nThe Takedown Protocol While this execution order is active, you gain the following benefits against your marked Target:\n\nSystemic Trauma: Half of all damage you deal to the Target (rounded up) is dealt as direct Wound damage, immediately reducing their maximum Vitality and forcing the standard Body Save against Fatigue and crippling conditions.\n\nPrecision Targeting: Whenever you successfully hit the Target with a weapon attack, you can spend 2 Execution to apply one of the following precision effects:\n\nDead (Arterial Strike): You perfectly sever a major artery or critical fluid line, instantly inflicting 2 stacks of Bleeding on the Target.\n\nAlive (Tendon Shot): You shatter a kneecap or leg actuator. The Target must make a Body Save (DC = 8 + your Agility or Body Modifier + your Caliber). On a failure, they are violently knocked Prone and their Speed is reduced to 0. They cannot stand up or walk until they receive medical attention or magical healing.\n\nIf this relentless assault reduces the Target to 50 percent or less of their total Wounds, their nervous system completely gives out from the systemic shock. They are instantly knocked Unconscious and stabilized, allowing you to effortlessly collect the bounty dead or alive."
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
