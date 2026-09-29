window.EN = window.EN || {};

EN.talentRules = {
  progression: "Training Points give you breadth: more skills, more gear, more tricks. Talents give you depth. They are the signature techniques, neural rewrites, and instinctive edges that define how you fight, hack, and survive the sprawl.\nYou don't buy Talents with Training Points. You can select them at specific levels as your Freelancer develops their specialties.\n\nProgression\n\nAt levels 2, 4, 6, and 8, you gain a Universal Upgrade. When you reach one of these levels, you may choose one of the following:\n• Increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20).\n• Select one Talent from the lists below for which you meet the requirements.\nThe two pull in different directions. An Attribute boost sharpens everything tied to that Attribute: every check, every attack, every Save. Talents add new mechanical tools, signature maneuvers, or permanent edges of your own. You may freely mix the two options across your career.\n\nTalent Upgrades\n\nMany Talents list an Upgrade option at the end of their entry. When you reach Level 6 or later and gain a new Talent, you may instead spend that Talent slot to unlock the Upgrade of a Talent you already possess. Upgrading deepens an existing signature ability rather than diversifying your loadout.\nYou can only have each Upgrade once, and you must already possess the base Talent in order to unlock its Upgrade.",
  requirementsRetraining: "Requirements: You must meet all Attribute and Level requirements at the moment you select the Talent (or its Upgrade).\nRetraining: Whenever you gain a new level, you may replace one Talent with another for which you meet the requirements, representing a shift in your Freelancer's combat focus or cybernetic loadout. If you replace a Talent that you have Upgraded, you lose both the base Talent and its Upgrade.\n\nLineage Evolution\n\nYour Lineage adapts as you survive the sprawl, letting you unlock Additive Features you didn't choose at character creation. You gain access to these in two ways:\n• Lineage Talents: Whenever you reach a level that grants a new Talent (2, 4, 6, or 8), you may forsake selecting a Talent from the lists below and instead unlock one unpicked Additive Feature from your chosen Lineage.\n• The Awakening Milestone: By Level 4, you've learned to draw more from your biology, hardware, or cosmic nature. At Level 4, alongside your standard Universal Upgrade, you automatically gain one additional Additive Feature from your Lineage for free, without needing to spend your Talent choice.\n\nLineage Additive Features gained this way function exactly like Talents for the purposes of Retraining. You may swap an Additive Feature for a different one from your Lineage, or trade it out for a standard Talent you meet the prerequisites for, whenever you level up.",
  categoriesIntro: "Categories\n\nTalents are sorted by their mechanical focus. You may choose a Talent from any category, as long as you meet its prerequisites.\n\nThe categories are:\n• Combat & Weapon Mastery, Talents focused on mastering specific weapon types, maximizing damage, and overpowering Enemies in direct combat.\n• Tactics & Hybrid Fighting, Talents focused on battlefield control, specialized maneuvers, and weaving the Flow or tech into physical combat.\n• Tech & #GRID Operations, Talents focused on cybernetics, coding, hardware manipulation, and navigating the #GRID.\n• The Flow & Resonance, Talents tied to mystical energy, Flow Invocations, and supernatural awareness.\n• Armor & Resilience, Talents focused on soaking damage, surviving harsh conditions, and maximizing defensive gear. Armor proficiencies themselves (Light, Medium, Heavy, and Physical Shields) are gained through Training Points and class features rather than dedicated Talents. The Talents in this section focus on mastering the gear you already wear.\n• Mobility & Traversal, Talents focused on moving through the environment quickly and efficiently.\n• Skills, Social & Utility, Talents that shine outside of direct combat, offering support, crafting, exploration, and roleplay advantages."
};

EN.talents = [
  // ===== Combat & Weapon Mastery =====
  {
    key: "akimbo-specialist",
    name: "Akimbo Specialist",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "Your off hand stopped being the spare a long time ago. You gain the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• While you wield a separate weapon in each hand, melee or ranged, your Defense gets a +1 bonus.\n• Two-weapon fighting, the Swift Action follow-up attack, works for you with any pair of one-handed weapons, not only Light ones.\n• Anytime you could draw or stow a single one-handed weapon, you can handle a pair instead, as a Free Action.\n\n**Upgrade (Level 6+):** When you score a critical hit with one of your two weapons, you may immediately make one additional attack with the opposite weapon as part of the same Action against the same Target."
  },
  {
    key: "armor-piercing-specialist",
    name: "Armor Piercing Specialist",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You know where the plate thins and the weave parts. You gain the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Once per turn, you can reroll one damage die from a hit of yours that deals Piercing or Ballistic damage. The new roll stands, even if it's lower.\n• When a critical hit of yours deals Piercing or Ballistic damage, you can roll one extra damage die for the critical damage.\n\n**Upgrade (Level 6+):** Your Piercing and Ballistic attacks ignore the first 3 points of Armor DR, this doesn't apply against Resonant Plating or Flow-imbued defenses."
  },
  {
    key: "arsenal-adept",
    name: "Arsenal Adept",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You've trained with whatever the black market had and the last firefight left behind. You gain the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Choose four weapon categories or specific martial weapons. You're Proficient with them, so your Weapon Proficiency Bonus applies to your attack rolls with each.\n• You can pick up and fight with anything. You don't roll with Snag for making an attack with a weapon you aren't Proficient with (you still don't add a Weapon Proficiency Bonus to those attacks).\n\n**Upgrade (Level 6+):** Once per turn, when you hit a Target with a weapon you gained Proficiency in through this Talent, you add your Caliber to that attack's damage."
  },
  {
    key: "close-quarters-brawler",
    name: "Close-Quarters Brawler",
    category: "Combat & Weapon Mastery",
    requirements: "Body 13 or higher.",
    text: "Once you have hold of someone, the fight is on your terms. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• Your attack rolls against a Target you're Grappling have Edge.\n• Pinning a Target you have Grappled takes an Action and another contested Athletics check; if you win, it's Restrained until the grapple ends.\n\n**Upgrade (Level 6+):** While you have a Target Grappled, your melee attacks against that Target score critical hits on a roll of 19 or 20."
  },
  {
    key: "concussive-striker",
    name: "Concussive Striker",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You hit like a door coming off its hinges. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• Once per turn, you can knock a Target 1 space into an unoccupied space you pick when your attack hits it with Bludgeoning damage. It can't be more than one Size category larger than you.\n• When you score a critical hit with Bludgeoning damage, the Target is left reeling, and every attack roll against it has Edge until the start of your next turn.\n\n**Upgrade (Level 6+):** When you hit a Target with a Bludgeoning attack on your turn, you may force it to make a Body Saving Throw (DC 8 + your Body Modifier + your Weapon Proficiency Bonus) or be Stunned until the end of your next turn. Once you stun a Target this way, you can't do so again until you finish a Short Rest."
  },
  {
    key: "heavy-handed",
    name: "Heavy Handed",
    category: "Combat & Weapon Mastery",
    requirements: "Character Level 4, Body 14+.",
    text: "You put crushing momentum into your heaviest strikes. You gain the following benefits:\n• When you hit a Target with a melee attack using a weapon with the Heavy trait, you can push the Target up to 1 space into an unoccupied space.\n• If this push forces the Target to strike a solid object or another Target, they must succeed on a Body Saving Throw (DC 8 + your Body Modifier + your Weapon Proficiency Bonus) or be knocked Prone.\n• You gain a +2 bonus to damage rolls with weapons possessing the Heavy trait.\n\n**Upgrade (Level 6+):** The push distance increases to 2 spaces, and a Target knocked Prone by this Talent also takes Bludgeoning damage equal to your Body Modifier (minimum 1)."
  },
  {
    key: "heavy-weapon-specialist",
    name: "Heavy Weapon Specialist",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "Heavy iron doesn't slow you down. It carries you through the swing and into the next one. You gain the following benefits:\n• On your turn, a critical hit you land with a melee weapon, or a Target you drop to 0 Vitality with one, lets you follow up before the turn ends: one more melee weapon attack as a Swift Action.\n• You can put everything behind a melee attack with a Heavy weapon you're Proficient with. Decide before the attack: take a -5 penalty on the attack roll, and if it hits, add +10 to its damage.\n\n**Upgrade (Level 6+):** When you take the Attack Action on your turn while wielding a Heavy weapon, you may make one additional melee attack with that weapon as part of the same Action. You can't apply this Talent's minus 5 to hit for plus 10 damage option to that additional attack."
  },
  {
    key: "laceration-expert",
    name: "Laceration Expert",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You cut for tendons, not for show. You gain the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Once per turn, a hit of yours that deals Slashing damage can hobble the Target, taking 2 off its Speed until the start of your next turn.\n• When you score a critical hit with Slashing damage, the Target fights through the wound, rolling every attack with Snag until the start of your next turn.\n\n**Upgrade (Level 6+):** Your Slashing attacks now also cause bleeding wounds. A Target damaged by your Slashing attacks gains 1 stack of the Bleeding condition."
  },
  {
    key: "melee-mastery",
    name: "Melee Mastery",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You strike with brutal efficiency in close quarters, gaining the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Once per turn, you can roll the weapon's damage dice a second time for one of your melee weapon attacks. Use whichever total you prefer.\n• When you take the Attack Action with a melee weapon, you can use a Swift Action to make one additional attack with the same weapon as long as the original attack hit. This Swift Action attack uses your full damage modifier.\n\n**Upgrade (Level 6+):** When you reduce a Target to 0 Vitality with a melee attack, you regain Vitality equal to your Caliber + your Body Modifier. You can do this a number of times equal to your Caliber per Long Rest."
  },
  {
    key: "ricochet-shot",
    name: "Ricochet Shot",
    category: "Combat & Weapon Mastery",
    requirements: "Proficiency with at least one ranged weapon.",
    text: "You've mastered the art of impossible angles, banking shots off cover, walls, and metal surfaces. You gain the following benefits:\n• Increase your Agility or Wits score by 1, to a maximum of 20.\n• When you make a ranged weapon attack against a Target that has Half Cover or Three-Quarter Cover from a hard surface (concrete, metal, vehicle), you can choose to ignore the cover entirely. On a miss, you must still resolve damage against a random Target within 2 spaces of the original Target (GM's choice) or against the cover itself.\n• Once per turn when you make a ranged weapon attack against a Target within 6 spaces, you may designate a second Target within 1 space of the first. If your attack roll hits both Targets' Defense, both take damage from the attack. Roll damage once.\n\n**Upgrade (Level 6+):** You may use the second-Target effect at the full range of your weapon, and the second Target can be up to 2 spaces from the first. Your ricochet attacks ignore total Cover that is less than 1 space thick."
  },
  {
    key: "sidearm-gunslinger",
    name: "Sidearm Gunslinger",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "A pistol is the one thing you never leave at home. You gain the following benefits:\n• On Sidearms you're Proficient with, you ignore the High Recoil trait, so several Sidearm shots in a round never bring Snag from recoil. And no Sidearm ever costs you a Swift Action to reload in combat.\n• A hostile Target within 1 space of you doesn't give your ranged Sidearm attack rolls Snag.\n• Attack with a one-handed weapon as your Action, and you can follow up with a Sidearm you're holding, attacking with it as a Swift Action.\n\n**Upgrade (Level 6+):** Once per turn when you score a critical hit with a Sidearm, you may immediately fire it at one additional Target within 6 spaces as part of the same Action."
  },
  {
    key: "staff-spear-master",
    name: "Staff & Spear Master",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "With a staff or a spear, the fight happens at the end of the pole, where you want it. You gain the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Take the Attack Action with nothing but a long-shafted weapon, like a staff or a spear, and you can follow up by bringing the other end around as a Swift Action: a melee attack that deals 1d6 Bludgeoning damage and uses your normal attack and damage modifiers.\n• While you wield a long-shafted weapon, any Enemy that enters its reach provokes an Opportunity Attack (Impulse) from you.\n\n**Upgrade (Level 6+):** Your reach with long-shafted weapons extends an additional 1 space, and you gain Edge on Opportunity Attacks made with long-shafted weapons."
  },
  {
    key: "street-scrapper",
    name: "Street Scrapper",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "Bottles, chairs, a fire extinguisher off the wall: if you can lift it, you can hurt someone with it. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• Improvised weapons take your Simple Weapons Proficiency Bonus on attack rolls, and you never roll with Snag when wielding or throwing one.\n• Your unarmed strike damage die increases by one size.\n• On your turn, when your unarmed strike or improvised weapon hits a Target, you can follow up by trying to Grapple it as a Swift Action.\n\n**Upgrade (Level 6+):** Your unarmed strike damage die increases by **one additional size**, and you deal an additional 1d4 damage with improvised weapons. You also gain Resistance to Slashing, Bludgeoning, and Piercing damage from improvised weapons used against you."
  },
  {
    key: "zeroed-in",
    name: "Zeroed In",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "Distance and cover are just numbers, and you did the math before you raised the sights. You gain the following benefits:\n• Your ranged weapon attack rolls take no Snag from long range.\n• Half Cover adds nothing to a Target's Defense against your ranged weapon attacks.\n• You can trade accuracy for damage with a ranged weapon you're Proficient with. Decide before the attack: take a -5 penalty on the attack roll, and if it hits, add +10 to its damage.\n• You can make that trade once per turn.\n\n**Upgrade (Level 6+):** Your ranged weapon attacks now also ignore the Defense bonuses provided by Three-Quarter Cover, and you no longer have Snag on ranged attacks when an Enemy is within 1 space of you."
  },

  // ===== Tactics & Hybrid Fighting =====
  {
    key: "blade-weaver",
    name: "Blade Weaver",
    category: "Tactics & Hybrid Fighting",
    requirements: "Agility 13 or higher.",
    text: "***Prerequisite:** Agility 13 or higher.* You weave through enemy strikes with razor-sharp timing, gaining the following benefits:\n• Increase your Agility score by 1, to a maximum of 20.\n• With a Light melee weapon you're Proficient with in hand, you can meet an Enemy's melee hit with your Impulse Action: add your Weapon Proficiency Bonus to your Defense against that attack, which can turn the hit into a miss.\n\n**Upgrade (Level 6+):** When an attack misses you because of this Talent, you may make a retaliatory melee attack against the attacker as a Free Action."
  },
  {
    key: "combat-splicer",
    name: "Combat Splicer",
    category: "Tactics & Hybrid Fighting",
    requirements: "The ability to use Quick Hacks, Ciphers, or Flow Invocations.",
    text: "***Prerequisite:** The ability to use Quick Hacks, Ciphers, or Flow Invocations.* You've learned to run code and shape the Flow with a gun going off next to your ear. You gain the following benefits:\n• When you take damage while holding active Links or sustaining a Flow effect, you make the Focus Check to keep them (the Wits or Body Save) with Edge.\n• Weapons or a physical shield in one or both hands never stop you from making the physical inputs for Quick Hacks or Invocations.\n• If an Enemy moves in a way that provokes your Opportunity Attack, you can use that Impulse Action for a Quick Hack or an Invocation aimed at it instead of a melee attack. It must be one that normally costs 1 Action and targets only that Enemy.\n\n**Upgrade (Level 6+):** You no longer need to maintain Focus or Sustain to keep your Links and Flow effects active when you take damage of 20 or less. Damage of 21+ still requires the relevant Saving Throw, with Edge."
  },
  {
    key: "cross-discipline-tactic",
    name: "Cross-Discipline Tactic",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "You have studied the combat methodologies of other specialists to learn their tricks. You gain the following benefits:\n• You learn one of the following class abilities of your choice, with all of its associated mechanics: a single Operator Call, a single Hustler Leverage Ability, or a single Scoundrel Gambit. You meet any internal prerequisites for the chosen ability, but you can't select abilities flagged as \"Capstone\" or \"Level 7+\" features.\n• You gain a number of resource points equal to your Caliber to fuel this ability, regained on a Short or Long Rest. If the ability uses a different resource (e.g., uses-per-rest), you instead gain one use per Short Rest.\n• The chosen ability isn't permanent: at each new level, you can trade it for another that fits the same restrictions.\n\n**Upgrade (Level 6+):** You learn a second class ability under the same rules, and your resource pool for this Talent increases by 2 points."
  },
  {
    key: "glitch-breaker",
    name: "Glitch Breaker",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "Hackers and Shapers need a second of quiet. You make sure they don't get it. You gain the following benefits:\n• Any Target in your melee reach that runs a Quick Hack, a Cipher Attack, or a Flow Invocation invites a melee weapon attack from you, made with your Impulse Action.\n• Damage you deal to a Target that's holding Focus on a Link or Sustaining a Flow effect gives it Snag on the Focus Check to keep that connection.\n• Your Saving Throws have Edge against any Invocation or Quick Hack from an Enemy inside your melee reach.\n\n**Upgrade (Level 6+):** When you successfully interrupt a Target's Quick Hack, Cipher, or Invocation through any means (failed Focus Check, damage causing a sustain failure, etc.), the Target can't use that specific ability again until the end of their next turn."
  },
  {
    key: "lockdown-specialist",
    name: "Lockdown Specialist",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "Nobody walks past you on the way to your crew. You gain the following benefits:\n• A Target your Opportunity Attack hits stops where it stands: its Speed is 0 for the rest of the turn.\n• An Enemy leaving your reach provokes an Opportunity Attack from you even if it took the Disengage action first.\n• If an Enemy within 1 space of you attacks a Target other than you, your Impulse Action can answer with a melee weapon attack on that Enemy, unless the Target it attacked also has this Talent.\n\n**Upgrade (Level 6+):** Once per round, when an Enemy provokes an Opportunity Attack from you, you may make that attack without spending your Impulse Action. When you hit a Target with an Opportunity Attack, that Target also suffers Snag on the next attack roll it makes before the start of your next turn."
  },
  {
    key: "phalanx-operator",
    name: "Phalanx Operator",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "Your shield is a wall you carry, and you're not above swinging it. While you're wielding a Physical Shield, you gain the following benefits:\n• On a turn when you take the Attack Action, you can spend a Swift Action slamming your shield into a Target within 1 space in an attempt to Shove it.\n• As long as you aren't Incapacitated, an effect aimed at you alone has to get past your shield: you can add your shield's Defense bonus to your Agility Saving Throw against that effect.\n• When you succeed on an Agility Saving Throw against an effect that deals half damage on a success, you can use your Impulse Action to get your shield between you and its source and take no damage instead.\n\n**Upgrade (Level 6+):** You can extend your shield's protection to an Ally within 1 space of you as an Impulse Action. Until the start of your next turn, that Ally gains your shield's Defense bonus. You can't benefit from your shield while doing so."
  },
  {
    key: "signal-sniper",
    name: "Signal Sniper",
    category: "Tactics & Hybrid Fighting",
    requirements: "The ability to use Quick Hacks, Ciphers, or Flow Invocations.",
    text: "***Prerequisite:** The ability to use Quick Hacks, Ciphers, or Flow Invocations.* You push signal and resonance farther than the spec sheet says they go. You gain the following benefits:\n• Your Quick Hacks, Cipher Attacks, and Flow Attacks that call for an attack roll work at double their effective range.\n• Your ranged tech and Flow attacks ignore the Defense bonuses provided by Half Cover and Three-Quarter Cover.\n• Add one Quick Hack of your choice to what you know, or one Base Resonance at a 0 FP Intent.\n\n**Upgrade (Level 6+):** Once per Short Rest, you can use a Quick Hack, Cipher, or Invocation as if you were within line of sight of a Target you have personally seen within the past hour, regardless of intervening obstacles, walls, or distance (up to 1 mile)."
  },
  {
    key: "tactical-operative",
    name: "Tactical Operative",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "Somebody taught you the Fury's and the Operator's tricks, and you kept them. You gain the following benefits:\n• Pick two Overdrive Maneuvers or Calls from the Fury or Operator class. A maneuver that forces a Target to make a Saving Throw uses DC 8 + your Body or Agility Modifier (your choice) + your Caliber.\n• You gain 2 Overdrive Points (or Execution, depending on your choice). These points fuel your maneuvers and are regained when you finish a Short Rest or Long Rest.\n\n**Upgrade (Level 6+):** You learn one additional maneuver from the same list, and your resource pool from this Talent increases by 2 points."
  },

  // ===== Tech & #GRID Operations =====
  {
    key: "augment-specialist",
    name: "Augment Specialist",
    category: "Tech & #GRID Operations",
    requirements: "Tech 13 or higher.",
    text: "You have an intuitive command of cybernetic installation and tuning, granting you the following benefits:\n• Increase your Tech score by 1, to a maximum of 20.\n• Your body tolerates chrome better than most. Reduce your Total Static by 2 for the purpose of determining your Static Threshold, to a minimum of 0. This lets you install more cyberware before the Chrome Tax penalties escalate.\n• The credit cost of installing, removing, or tuning your own cybernetics is reduced by 25%, and the Downtime required for installation is halved.\n\n**Upgrade (Level 6+):** Once per Long Rest, when one of your installed cybernetics is disabled, suppressed, or hacked by an Enemy effect, you can use your Impulse Action to override the disruption and restore the cybernetic to full function."
  },
  {
    key: "gridrunners-reflexes",
    name: "#GRIDrunner's Reflexes",
    category: "Tech & #GRID Operations",
    requirements: "The ability to jack into the #GRID or operate a Smartdeck.",
    text: "Your nervous system is wired to react in the #GRID as quickly as it does in meatspace. You gain the following benefits:\n• Increase your Tech or Wits score by 1, to a maximum of 20.\n• While you are jacked into the #GRID (or otherwise operating in a virtual environment), you gain a +2 bonus to your Defense and Edge on Initiative checks within that environment.\n• When an Enemy targets you with a Quick Hack or Cipher, you can use your Impulse Action to gain Resistance to the damage and Edge on the Saving Throw against that effect.\n\n**Upgrade (Level 6+):** Once per Long Rest, when you would suffer LinkDeath, you can choose to be safely ejected from the #GRID instead, taking damage equal to half your remaining Vitality (rounded down) but suffering no other consequences."
  },
  {
    key: "hardware-harmonizer",
    name: "Hardware Harmonizer",
    category: "Tech & #GRID Operations",
    requirements: "Character Level 8, Tech 16+.",
    text: "***Prerequisite:** Character Level 8, Tech 16+.* You have a preternatural understanding of how mechanical and digital systems want to function. You gain the following benefits:\n• When you use a Tool Kit in which you have Proficiency, any Dice Pool margin of 0 (Mixed Result) is treated as a Strong Success instead.\n• The time required for you to repair broken hardware, patch corrupted code, or build localized devices is halved.\n• You gain Edge on Engineering and Systems d20 checks made to repair, build, or harmonize hardware.\n\n**Upgrade (Level 6+):** Your Mixed Result to Strong Success conversion now applies to all your Tech-based Dice Pool checks, not only those made with a Tool Kit."
  },
  {
    key: "junk-tinkerer",
    name: "Junk Tinkerer",
    category: "Tech & #GRID Operations",
    requirements: "",
    text: "You can make something useful out of a drawer of dead electronics and a roll of tape. You gain the following benefits:\n• You learn one Engineering-based Quick Hack of your choice. Tech is your governing attribute.\n• Choose one Tool Category. You're Proficient with it, and those tools can serve as a focus for your Tech-based abilities.\n• Once per Long Rest, you can spend 10 minutes scavenging available parts to construct one single-use gadget that produces an effect equivalent to a standard Cipher of your choice from a list approved by the GM (typical examples: smoke deployer, EMP charge, signal jammer, motion tripwire). The gadget must be used within 24 hours or it degrades.\n\n**Upgrade (Level 6+):** You can construct a number of single-use gadgets equal to your Caliber per Long Rest, and the gadgets you produce no longer degrade until consumed."
  },
  {
    key: "neural-backup",
    name: "Neural Backup",
    category: "Tech & #GRID Operations",
    requirements: "Character Level 4, Wits 14+.",
    text: "You have installed localized logic gates in your own wetware to prevent catastrophic feedback. You gain the following benefits:\n• Once per Long Rest, when you fail a LinkDeath Saving Throw, you can choose to take the Dazed condition for 1 minute to completely negate all Psychic damage from the feedback.\n• You gain Edge on Saving Throws against effects that would cause the Dazed condition.\n\n**Upgrade (Level 6+):** You may use the failure-negation feature twice per Long Rest instead of once, and the Dazed duration is reduced to 1 round."
  },
  {
    key: "pain-editor",
    name: "Pain Editor",
    category: "Tech & #GRID Operations",
    requirements: "Tech 13 or higher, or possession of at least one combat-grade cybernetic.",
    text: "You have edited your own pain response through wetware tuning or installed dampers. You gain the following benefits:\n• Increase your Body or Tech score by 1, to a maximum of 20.\n• Once per Encounter, when you would suffer a condition (Stunned, Frightened, Charmed, Dazed, or Poisoned), you can use your Impulse Action to ignore the condition. You take Psychic damage equal to your Character level when you do.\n• You gain Resistance to Psychic damage from sources other than your own Pain Editor.\n\n**Upgrade (Level 6+):** The Encounter limit increases to twice per Encounter, and you no longer take Psychic damage from using this ability."
  },
  {
    key: "parallel-processing",
    name: "Parallel Processing",
    category: "Tech & #GRID Operations",
    requirements: "Character Level 4, Codebreaker or Sourcerer.",
    text: "Your mind is built to handle the chaotic data streams of the #GRID. You gain the following benefits:\n• You can maintain one additional active Link beyond your standard class maximum.\n• You gain Edge on Tech checks made to stabilize deteriorating Links or resist forced disconnections.\n\n**Upgrade (Level 6+):** You can maintain a second additional active Link (two beyond your class maximum total), and when one of your Links is forcibly broken, you can immediately re-establish it as an Impulse Action without paying the usual setup cost."
  },
  {
    key: "script-archivist",
    name: "Script Archivist",
    category: "Tech & #GRID Operations",
    requirements: "Tech or Wits 13 or higher.",
    text: "You maintain a personal library of scripts and signature exploits. You gain the following benefits:\n• Your library starts on a data-slate loaded with two complex utility Ciphers or diagnostic Quick Hacks of your choice.\n• Standard Ciphers you find in the field (on a Burner Relay, say, or an Enemy's Smartdeck) can be copied onto your data-slate. Copying one takes 2 hours of Downtime per tier of the Cipher and costs 𝒢50 per tier.\n• You can execute these stored scripts during Downtime or out of combat using the Dice Pool Method. Once per Long Rest, you may execute one stored script during combat as if it were a Quick Hack you knew.\n\n**Upgrade (Level 6+):** The in-combat execution increases to a number of uses equal to your Caliber per Long Rest, and integrating new Ciphers costs only 𝒢25 per tier and takes half the normal time."
  },
  {
    key: "script-kiddie",
    name: "Script Kiddie",
    category: "Tech & #GRID Operations",
    requirements: "",
    text: "You've cobbled together a handful of dangerous tricks from forum dumps and cracked tutorials. You gain the following benefits:\n• You learn two basic Quick Hacks or two Base Resonances (0 FP Intent) of your choice.\n• Choose one advanced Cipher or Empowered Effect (1 FP) to learn. You can activate it once per Long Rest without a Smartdeck or FP cost.\n• Your primary attribute for these checks matches your chosen focus (Tech or Mystique).\n\n**Upgrade (Level 6+):** You learn one additional advanced Cipher or Empowered Effect (1 FP), and you can use the free activation feature twice per Long Rest across your learned advanced effects."
  },

  // ===== The Flow & Resonance =====
  {
    key: "echo-sighted",
    name: "Echo Sighted",
    category: "The Flow & Resonance",
    requirements: "Character Level 4, Mystique 14+.",
    text: "Your connection to the Flow allows you to perceive the lingering echoes of metaphysical phenomena. You gain the following benefits:\n• Your passive Resonance Sense range increases to 12 spaces.\n• You gain Edge on Awareness checks made to identify the Severity Rating of a Flow Disturbance or to track a Target using residual Flow energy.\n\n**Upgrade (Level 6+):** Your passive Resonance Sense range increases to 24 spaces and can detect through up to 1 space of solid material. You also automatically know the general direction of the nearest Flow Disturbance of Severity 2 or higher within 1 mile."
  },
  {
    key: "resonance-dabbler",
    name: "Resonance Dabbler",
    category: "The Flow & Resonance",
    requirements: "",
    text: "Something you touched, a Mystech relic or a room thick with old resonance, touched you back. You gain the following benefits:\n• Increase your Tech, Mystique, or Charm score by 1, to a maximum of 20.\n• You learn one Base Resonance (0 FP Intent) and one Empowered Effect (1 FP Force) from the Shaper class, or two basic Quick Hacks.\n• Once per Long Rest, you can activate the Empowered Effect without spending Flow Points or generating Strain. These checks use the Attribute this Talent raised.\n\n**Upgrade (Level 6+):** You learn one additional Empowered Effect (1 FP), and the free use feature now refreshes on a Short Rest."
  },
  {
    key: "resonance-optimizer",
    name: "Resonance Optimizer",
    category: "The Flow & Resonance",
    requirements: "The ability to shape Flow Invocations.",
    text: "When you take this Talent, pick the damage type you've learned to push harder: Fire, Cold, Electric, Toxic, or Force.\n• Invocations you shape ignore Resistance to damage of the chosen type.\n• Any 1 on a damage die for an Invocation you shape that deals the chosen damage type can count as a 2.\n• You can take this Talent more than once, choosing a different damage type each time.\n\n**Upgrade (Level 6+):** Your Invocations of the chosen damage type now treat Immunity to that damage type as Resistance instead, and once per Short Rest you may maximize the damage of one Invocation that deals damage of the chosen type."
  },
  {
    key: "resonance-weaver",
    name: "Resonance Weaver",
    category: "The Flow & Resonance",
    requirements: "Attuned to the Flow (Shaper class).",
    text: "You bend an Invocation mid-shape, the way a courier bends a route around a checkpoint. You gain the following benefits:\n• Choose two Advanced Techniques or Invocation modifications to learn (Resonance Amplification, for one).\n• You also carry 2 extra Flow Points (FP), which can go only to those modifications or to powering Advanced Techniques; a Long Rest refills them.\n\n**Upgrade (Level 6+):** You learn one additional Advanced Technique or Invocation modification, and your bonus FP pool from this Talent increases by 2."
  },
  {
    key: "resonant-recovery",
    name: "Resonant Recovery",
    category: "The Flow & Resonance",
    requirements: "Character Level 8, Shaper.",
    text: "You are deeply synchronized with the ambient frequencies of the world. You gain the following benefits:\n• When you perform a Ritual Recovery, you regain 1 additional Flow Point beyond your normal amount.\n• If you perform a Ritual Recovery in a Flow-rich area (Anomaly Severity 0), you add +2 Edge Dice to the Flow Dice Pool check.\n\n**Upgrade (Level 6+):** Once per Long Rest, when your Flow Points reach 0, you can use an Impulse Action to regain Flow Points equal to your Caliber + your Flow Modifier."
  },
  {
    key: "static-grounding",
    name: "Static Grounding",
    category: "The Flow & Resonance",
    requirements: "Character Level 4, Unattuned Classes.",
    text: "***Prerequisite:** Character Level 4, Unattuned Classes.* Your grounded, purely physical nature makes you difficult for the Flow to latch onto. You gain the following benefits:\n• You gain Edge on all Saving Throws against Invocations using the Electromagnetic or Cognitive Base Resonances.\n• You reduce the damage you take from any Invocation or resonant effect that targets you directly by an amount equal to your Caliber.\n\n**Upgrade (Level 6+):** Once per Long Rest, when you succeed on a Saving Throw against a hostile Invocation, you can use your Impulse Action to reflect the effect back at its caster, who must make the same Saving Throw against their own DC."
  },

  // ===== Armor & Resilience =====
  {
    key: "cyber-reinforced-vitality",
    name: "Cyber-Reinforced Vitality",
    category: "Armor & Resilience",
    requirements: "",
    text: "Your body has been hardened through dermal mesh, subdermal weave, or cybernetic vital reinforcement. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• Take this Talent and your Vitality maximum jumps by twice your Character level; every level you gain after that adds 2 more.\n\n**Upgrade (Level 6+):** You gain Resistance to one damage type of your choice from this list: Ballistic, Piercing, Slashing, or Bludgeoning."
  },
  {
    key: "cybernetic-surge",
    name: "Cybernetic Surge",
    category: "Armor & Resilience",
    requirements: "Character Level 4.",
    text: "Combat stims, adrenal triggers, or emergency overclock routines give you a moment of explosive capability. You gain the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Once per Encounter, you can use a Swift Action to trigger your Surge. Until the end of your next turn, your Speed doubles, your melee and unarmed attacks deal an additional 1d6 damage, and you gain Edge on Body and Agility Saving Throws.\n• At the end of your Surge, you suffer 1 level of Fatigue. As an exception to the normal recovery rules, this Fatigue clears when you finish a Short Rest.\n\n**Upgrade (Level 6+):** Your Surge can be triggered twice per Encounter, and the duration extends to 2 rounds. This Fatigue clears at the end of the Encounter rather than requiring a Short Rest."
  },
  {
    key: "hardened-survivor",
    name: "Hardened Survivor",
    category: "Armor & Resilience",
    requirements: "",
    text: "Pick the Attribute you lean on when things go wrong. You gain the following benefits:\n• Increase the chosen Attribute score by 1, to a maximum of 20.\n• You add your Caliber to all Saving Throws you make using the chosen Attribute, as though it were one of your class Saving Throw Focuses. If the chosen Attribute is already one of your Saving Throw Focuses, choose a different Attribute for this benefit.\n\n**Upgrade (Level 6+):** When you succeed on a Saving Throw using your chosen Attribute by 5 or more, you suffer no effect from the source, even if it would normally cause an effect on a successful save (such as half damage)."
  },
  {
    key: "siege-plating-expert",
    name: "Siege Plating Expert",
    category: "Armor & Resilience",
    requirements: "Proficiency with Heavy Armor.",
    text: "You wear heavy plate like it was poured around you. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• In Heavy Armor, you take 3 less Ballistic, Piercing, Bludgeoning, and Slashing damage from standard weapons, on top of your normal Armor DR.\n\n**Upgrade (Level 6+):** The damage reduction increases to 5, and once per Short Rest when you would be reduced to 0 Vitality by a Ballistic, Piercing, Bludgeoning, or Slashing attack while wearing Heavy Armor, you are instead reduced to 1 Vitality."
  },
  {
    key: "tactical-harness-expert",
    name: "Tactical Harness Expert",
    category: "Armor & Resilience",
    requirements: "Proficiency with Medium Armor.",
    text: "You've run enough ops in medium armor that it moves like skin. You gain the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Your Agility (Stealth) checks and Agility-based Dice Pools take no Snag from Medium Armor.\n• In Medium Armor, your Agility Modifier can add up to +3 to your Defense instead of the usual +2.\n\n**Upgrade (Level 6+):** The Agility Modifier cap for Medium Armor increases to +4 for you, and you treat Medium Armor as Light Armor for the purposes of class features and Talent prerequisites."
  },
  {
    key: "unbreakable",
    name: "Unbreakable",
    category: "Armor & Resilience",
    requirements: "",
    text: "The city has thrown its worst at you, and you're still here, annoyed. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• No Resilience Die you spend on a Short Rest restores less Vitality than twice your Body Modifier (minimum of 2).\n\n**Upgrade (Level 6+):** You gain one additional Resilience Die, and you can spend Resilience Dice during a Short Rest to remove conditions: 1 die to remove the Frightened or Poisoned condition, 2 dice to remove the Dazed or Stunned condition."
  },

  // ===== Mobility & Traversal =====
  {
    key: "asphalt-rider",
    name: "Asphalt Rider",
    category: "Mobility & Traversal",
    requirements: "",
    text: "Behind the handlebars or the wheel, you're the most dangerous thing on the street. You gain the following benefits:\n• Increase your Agility or Wits score by 1, to a maximum of 20.\n• You gain Proficiency with one vehicle category of your choice.\n• While you're piloting and not Incapacitated, your melee attack rolls have Edge against an unmounted Target whenever your vehicle is physically bigger than it.\n• While you're piloting, you can redirect an attack aimed at your vehicle so that it targets your Defense instead.\n• When an effect gives your vehicle an Agility Saving Throw for half damage, a success means it takes none, and a failure means it takes only half.\n\n**Upgrade (Level 6+):** You and any vehicle you operate gain a +2 Speed bonus. When your vehicle would be destroyed or disabled, once per Long Rest you can use your Impulse Action to keep it operational at 1 Integrity until the end of the Encounter."
  },
  {
    key: "blitz-logic",
    name: "Blitz Logic",
    category: "Mobility & Traversal",
    requirements: "Character Level 4, Agility 14+.",
    text: "Your neural wiring has been optimized for explosive bursts of movement. You gain the following benefits:\n• You treat your Speed as if it were 2 points higher for the purposes of calculating your movement pool.\n• Once per Encounter, you can perform a Swift Action without expending a Move Action.\n• You gain a +2 bonus to your Initiative checks.\n\n**Upgrade (Level 6+):** The free Swift Action feature can be used a number of times per Encounter equal to your Caliber, and your Initiative bonus increases to +5."
  },
  {
    key: "breach-charger",
    name: "Breach Charger",
    category: "Mobility & Traversal",
    requirements: "",
    text: "You hit moving and you hit hard. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• Dash as your Action, and you can spend a Swift Action on one melee weapon attack or a Shove.\n• If you covered at least 2 spaces in a straight line right before that Swift Action, it carries your momentum: a melee attack that hits gains +5 to its damage roll, and a Shove that succeeds pushes the Target up to 2 spaces away from you.\n\n**Upgrade (Level 6+):** When you Dash, you gain the ability to move through hostile Targets' spaces (but can't end your movement there), and any Target you pass through must succeed on a Body Saving Throw (DC 8 + your Body Modifier + your Caliber) or be knocked Prone."
  },
  {
    key: "parkour-runner",
    name: "Parkour Runner",
    category: "Mobility & Traversal",
    requirements: "",
    text: "To you, the rooftops and the fire escapes are one continuous road. You gain the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Getting up from Prone takes just 1 point of your Speed.\n• You climb at no extra Speed cost.\n• A running jump, long or high, needs only 1 space of run-up instead of 2.\n\n**Upgrade (Level 6+):** You gain a climb speed equal to your walking Speed, and you don't take fall damage from falls of 6 spaces or less if you are conscious and not Restrained."
  },
  {
    key: "speed-freak",
    name: "Speed Freak",
    category: "Mobility & Traversal",
    requirements: "",
    text: "You're gone before anyone finishes deciding to hit you. You gain the following benefits:\n• Your Speed increases by 2.\n• On a turn you Dash, Difficult Terrain costs you no extra Speed.\n• When you make a melee attack against a Target, you do not provoke opportunity attacks from that Target for the rest of the turn, whether you hit or not.\n\n**Upgrade (Level 6+):** Your Speed increases by an additional 2 (4 total), and you can move through Difficult Terrain normally even when not Dashing."
  },

  // ===== Skills, Social & Utility =====
  {
    key: "crew-commander",
    name: "Crew Commander",
    category: "Skills, Social & Utility",
    requirements: "Charm 13 or higher.",
    text: "You're the one who says the thing everyone needed to hear before the job starts. You gain the following benefits:\n• Increase your Charm score by 1, to a maximum of 20.\n• Take 10 minutes of Downtime or a Short Rest to get the crew's heads straight. Up to six friendly Characters within 6 spaces, you included if you like, each gain Vigor equal to your Character level + your Charm Modifier, as long as they can see or hear you and understand you. Once a Character has had this Vigor, they can't have it again until they finish a Short Rest or Long Rest.\n\n**Upgrade (Level 6+):** When you use Crew Commander, the affected Characters also gain Edge on their next attack roll or Saving Throw made within the next 10 minutes."
  },
  {
    key: "crowd-reader",
    name: "Crowd Reader",
    category: "Skills, Social & Utility",
    requirements: "Charm or Wits 13 or higher.",
    text: "You read a room the way a netrunner reads code: instantly and ruthlessly. You gain the following benefits:\n• Increase your Charm or Wits score by 1, to a maximum of 20.\n• When an Encounter that includes negotiation, deception, or social pressure begins, you may roll an Insight or Intuition check using Charm or Wits (DC 12). On a success, you immediately learn one piece of useful information about one Target of your choice: their highest non-physical Attribute, their most pressing emotional state (Fear, Greed, Anger, etc.), or whether they are armed or augmented.\n• You gain Edge on Initiative checks made during social Encounters, and you can use your Charm Modifier in place of Wits for Initiative in such Encounters.\n\n**Upgrade (Level 6+):** You learn two pieces of useful information instead of one, and your insight applies to all hostile Targets in the social Encounter rather than just one."
  },
  {
    key: "cutting-agent",
    name: "Cutting Agent",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "For reasons that are definitely not malicious, you know how to cook a toxin and how to get it into someone. You gain the following benefits:\n• Your damage rolls ignore Resistance to Toxic damage.\n• Coating a weapon in toxin can take you a Swift Action instead of an Action.\n• Spend 1 hour of work and 𝒢50 worth of chemical materials to cook doses of potent toxin, as many as your Caliber.\n• A coat on a weapon or ammunition stays potent for 1 minute or until you hit. A Target the coated weapon damages makes a Body Saving Throw (DC 8 + Tech Modifier + Caliber). On a failure, it takes 2d8 Toxic damage and is Poisoned until the end of your next turn.\n\n**Upgrade (Level 6+):** The toxin damage increases to 3d8 and the Poisoned condition lasts for 1 minute (with a save at the end of each of the Target's turns). You can also produce twice as many doses per crafting session."
  },
  {
    key: "faceless-persona",
    name: "Faceless Persona",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "You can be anyone for as long as the conversation lasts, and longer if the paperwork holds. You gain the following benefits:\n• Increase your Charm score by 1, to a maximum of 20.\n• When you're trying to pass as someone else or to build a false identity, your Charm (Deception) and Charm (Performance) checks have Edge.\n• You can mimic the speech of another person or the mechanical sounds made by other Targets. You must have heard the person speaking, or heard the Target make the sound, for at least 1 minute. A successful Wits (Intuition) check contested by your Charm (Deception) check allows a listener to determine that the effect is faked.\n\n**Upgrade (Level 6+):** You can maintain a single fabricated identity that functions seamlessly in digital records (legal IDs, employment history, social profiles) without ongoing rolls. The GM may call for a check only when the identity is actively being investigated by a major faction."
  },
  {
    key: "fate-bender",
    name: "Fate Bender",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "The odds owe you, and they tend to pay up at the worst moment for everyone else. You gain the following benefits:\n• You carry 3 Luck Points. On any attack roll, ability check, or Saving Throw you make with the d20 Method, you can spend one to roll an extra d20, even after you've seen the first die, as long as the outcome hasn't been decided. Then choose which d20 counts.\n• When anyone or anything makes an attack roll against you, you can spend a Luck Point to roll a d20 of your own, then pick which roll the attack uses: theirs or yours.\n• Luck Points spent by two or more Characters on the same roll cancel out, and nobody rolls an extra die.\n• A Long Rest refills your spent Luck Points.\n\n**Upgrade (Level 6+):** You have 5 Luck Points instead of 3, and you regain one expended Luck Point on a Short Rest (up to a maximum of 5)."
  },
  {
    key: "field-specialist",
    name: "Field Specialist",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "The crew calls you first for one kind of job, and you've done it until your hands work without you. You gain the following benefits:\n• Increase one Attribute score of your choice by 1, to a maximum of 20.\n• You gain Proficiency in one Skill of your choice.\n• Choose one Skill you're Proficient in and raise it to Expertise: +4 on its d20 checks and +4 Edge Dice on its Dice Pool checks.\n\n**Upgrade (Level 6+):** You gain Expertise with one additional Skill in which you are Proficient."
  },
  {
    key: "hyper-aware",
    name: "Hyper-Aware",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "You clock the exits, the hands, and the camera in the corner before you've found a seat. You gain the following benefits:\n• Increase your Wits or Tech score by 1, to a maximum of 20.\n• You read lips. Watch a Character's mouth while it talks and you know what it's saying.\n• Your Passive Wits (Perception) and Passive Wits (Investigation) checks each get a +5 bonus.\n\n**Upgrade (Level 6+):** You can no longer be surprised by traps, ambushes, or hidden Targets you would have been able to detect with a Wits (Perception) or Wits (Investigation) check, even passively."
  },
  {
    key: "hyper-vigilant",
    name: "Hyper-Vigilant",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "You sit with your back to the wall and sleep in your boots. You gain the following benefits:\n• You cannot be caught off guard or Surprised while you are conscious.\n• Add +5 to your Initiative rolls.\n• An Enemy that's Hidden from you gets no Edge on its attack rolls against you for being Hidden.\n\n**Upgrade (Level 6+):** On the first round of any combat Encounter, you gain a free Swift Action that you may use only to move, take cover, or draw a weapon."
  },
  {
    key: "photographic-memory",
    name: "Photographic Memory",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "You remember the plate number and the name the guard used on the phone, and you'll still remember them next month. You gain the following benefits:\n• Increase your Tech or Wits score by 1, to a maximum of 20.\n• With no help from the #GRID, you always know where north is and keep perfect track of time and direction.\n• Anything you've seen or heard in the past month comes back accurately when you reach for it, and your Wits (Insight), Wits (Intuition), or Wits (Investigation) checks to recall details have Edge.\n\n**Upgrade (Level 6+):** Your recall extends to anything you have seen or heard within the past year, and you can make a Wits check (DC 15) to recall specific written documents or visual data with photographic clarity."
  },
  {
    key: "ruin-crawler",
    name: "Ruin Crawler",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "Bunkers, collapsed car parks, and dead datacenters have taught you to watch for tripwires and distrust the walls. You gain the following benefits:\n• Increase your Wits or Agility score by 1, to a maximum of 20.\n• Your Wits (Perception) and Wits (Investigation) checks to detect hidden doors or concealed compartments have Edge.\n• Your Saving Throws against traps and environmental hazards have Edge.\n• You have Resistance to damage from mechanical and explosive traps.\n• Searching for traps doesn't slow you down; you can do it at a normal travel pace without penalty.\n\n**Upgrade (Level 6+):** You can disarm or bypass detected traps as a Swift Action (rather than an Action), and once per Long Rest you can declare that a trap that would have hit you \"didn't\", retroactively detecting and bypassing it as if you had searched the area."
  },
  {
    key: "shadow-operative",
    name: "Shadow Operative",
    category: "Skills, Social & Utility",
    requirements: "Agility 13 or higher.",
    text: "You know which shadows the cameras miss and which floor panels creak. You gain the following benefits:\n• Increase your Agility score by 1, to a maximum of 20.\n• Being only lightly obscured from a Target is enough for you to attempt to hide from it.\n• A ranged weapon attack that misses a Target you're Hidden from doesn't give away your position, and you stay Hidden.\n• Your sight-based Wits (Perception) checks take no Snag from dim light or heavy shadows.\n\n**Upgrade (Level 6+):** When you are Hidden and make an attack against a Target that hasn't acted yet in the Encounter, you gain Edge on the attack roll and the attack scores critical hits on a roll of 19 or 20."
  },
  {
    /* Text verified printed in Part 1 on 2026-08-19 and transcribed from the document.
       Formerly Kinetic Manipulator; store.js migrates the old key.

       The base Talent has NO active ability: levels 1 to 5 are pure utility and the shove
       arrives at 6, so nothing here should be read as a nerf to a Level 1 pick that never
       had one.

       Author decisions recorded so they are not "corrected" later: WITS or Mystique is
       deliberate and was kept twice against the argument that Wits is the only Attribute
       never used as a Flow Attribute. 3 spaces is deliberate, kept after seeing that a
       fully blocked shove pays up to 3d6 under Falling & Forced Movement. There is no local
       damage scale on purpose: Part 2 already prices a cut-short shove at 1d6 per space.
       "Unattended" is load-bearing, per Part 2's Object Interactions callout. The opening
       question is the author's and is the only Talent in Part 1 that opens with one. */
    key: "spatial-delivery",
    name: "Spatial Delivery",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "Why cross the room when the room can deliver? You reach for what you need, and space quietly handles the rest. You gain the following benefits:\n• Increase your Wits or Mystique score by 1, to a maximum of 20.\n• You can take the Interact with Object Free Action on any unattended object within 6 spaces, as though you were standing beside it. You might open a latch, retrieve something from an open container, or knock keys from a table. The interaction can require no more force than you could exert with your own hands, and the force itself is silent and invisible.\n\n**Upgrade (Level 6+):** Your reach extends to 12 spaces. You can also spend a Swift Action to shove one Target you can see within range with that same unseen force. It resists with a Body Saving Throw (DC 8 + your Wits or Mystique Modifier, whichever this Talent raised, + your Caliber); on a failure, you move it 3 spaces toward or away from you. A willing Target can simply fail. If something stops it short, see Falling & Forced Movement."
  },
  {
    key: "street-chef",
    name: "Street Chef",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "Give you a hotplate and whatever the market was throwing out, and you'll make a meal people talk about. You gain the following benefits:\n• Increase your Body or Wits score by 1, to a maximum of 20.\n• You gain Proficiency with culinary tools or survival cooking gear.\n• During a Short Rest, with ingredients and proper gear, you can turn out a hearty meal big enough for a number of Characters equal to 4 + your Caliber. When the rest ends, each diner who spends at least one Resilience Die to regain Vitality adds an extra 1d8 to what they regain.\n• You can cook a number of specialized rations equal to your Caliber, either with an hour of work or as you finish a Long Rest. They keep for 8 hours; eating one takes a Swift Action and grants Vigor equal to your Caliber.\n\n**Upgrade (Level 6+):** The hearty meal bonus increases to 2d8 Vitality, and your specialized rations now also grant the eater Edge on their next Body Saving Throw within 1 hour of consumption."
  },
  {
    key: "trauma-medic",
    name: "Trauma Medic",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "You've stitched people up in stairwells and the backs of cabs, and most of them walked out on their own. You gain the following benefits:\n• Increase your Wits or Tech score by 1, to a maximum of 20.\n• A Character you Stabilize with a Medkit, Unconscious or dying, also regains 1 Vitality.\n• With a Medkit in hand, you can spend an Action working on a Character within your melee reach, restoring Vitality equal to **2d6 + your Caliber + the modifier this Talent raised**. The same Character gets nothing more from this Talent until they finish a Short Rest or Long Rest.\n\n**Upgrade (Level 6+):** You can work as a Swift Action instead of an Action, and the healing increases to **3d6 + your Caliber + the modifier this Talent raised**. You can also end one of the following conditions on the Character as part of the same action: Poisoned, Bleeding, or Dazed."
  },
  {
    key: "undercity-survivor",
    name: "Undercity Survivor",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "Years below the street taught you to be where the light isn't. You gain the following benefits:\n• Increase your Wits, Tech, or Charm score by 1, to a maximum of 20.\n• You learn one Quick Hack or Invocation that creates obscurement or alters perception (the Electromagnetic \"Phantom Shroud\", for example, or a sensory hack), and once per Long Rest you can activate it without spending Flow Points or generating Strain. Its checks use the Attribute this Talent raised.\n\n**Upgrade (Level 6+):** You can use the free activation feature twice per Long Rest, and you gain Edge on Agility (Stealth) checks made within the effect of your learned obscurement ability."
  }
];
