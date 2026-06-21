window.EN = window.EN || {};

EN.talentRules = {
  progression: "Training Points give you breadth: more skills, more gear, more tricks. Talents give you depth. They are the signature techniques, neural rewrites, and instinctive edges that define how you fight, hack, and survive the sprawl.\nYou do not buy Talents with Training Points. They are awarded at specific levels as your Freelancer grows into a true specialist.\n\nProgression\n\nAt levels 2, 4, 6, and 8, you gain a Universal Upgrade. When you reach one of these levels, you may choose one of the following:\n• Increase one Attribute score by 1, to a maximum of 20.\n• Select one Talent from the lists below for which you meet the requirements.\nBoth options shape your Freelancer in different directions. Attribute boosts sharpen your raw capability across every check, attack, and Save tied to that Attribute. Talents add new mechanical tools, signature maneuvers, or permanent edges that define how you fight, hack, and survive the sprawl. You may freely mix the two options across your career.\n\nTalent Upgrades\n\nMany Talents list an Upgrade option at the end of their entry. When you reach Level 6 or later and gain a new Talent, you may instead spend that Talent slot to unlock the Upgrade of a Talent you already possess. Upgrading deepens an existing signature ability rather than diversifying your loadout.\nYou can only have each Upgrade once, and you must already possess the base Talent in order to unlock its Upgrade.",
  requirementsRetraining: "Requirements: You must meet all Attribute and Level requirements at the moment you select the Talent (or its Upgrade).\nRetraining: Whenever you gain a new level, you may replace one Talent with another for which you meet the requirements, representing a shift in your Freelancer's combat focus or cybernetic loadout. If you replace a Talent that you have Upgraded, you lose both the base Talent and its Upgrade.\n\nLineage Evolution\n\nYour Lineage adapts as you survive the sprawl, letting you unlock Additive Features you didn't choose at character creation. You gain access to these in two ways:\n• Lineage Talents: Whenever you reach a level that grants a new Talent (2, 4, 6, or 8), you may forsake selecting a Talent from the lists below and instead unlock one unpicked Additive Feature from your chosen Lineage.\n• The Awakening Milestone: Reaching Level 4 represents a total mastery of your own biology, hardware, or cosmic nature. At Level 4, alongside your standard Universal Upgrade, you automatically gain one additional Additive Feature from your Lineage for free, without needing to spend your Talent choice.\n\nLineage Additive Features gained this way function exactly like Talents for the purposes of Retraining. You may swap an Additive Feature for a different one from your Lineage, or trade it out for a standard Talent you meet the prerequisites for, whenever you level up.",
  categoriesIntro: "Categories\n\nTalents are sorted by their mechanical focus. You may choose a Talent from any category, as long as you meet its prerequisites.\n\nThe categories are:\n• Combat & Weapon Mastery, Talents focused on mastering specific weapon types, maximizing damage, and overpowering Enemies in direct combat.\n• Tactics & Hybrid Fighting, Talents focused on battlefield control, specialized maneuvers, and weaving magic or tech into physical combat.\n• Tech & #GRID Operations, Talents focused on cybernetics, coding, hardware manipulation, and navigating the grid.\n• The Flow & Resonance, Talents tied to mystical energy, Flow Invocations, and supernatural awareness.\n• Armor & Resilience, Talents focused on soaking damage, surviving harsh conditions, and maximizing defensive gear. Armor proficiencies themselves (Light, Medium, Heavy, and Physical Shields) are gained through Training Points and class features rather than dedicated Talents. The Talents in this section focus on mastering the gear you already wear.\n• Mobility & Traversal, Talents focused on moving through the environment quickly and efficiently.\n• Skills, Social & Utility, Talents that shine outside of direct combat, offering support, crafting, exploration, and roleplay advantages."
};

EN.talents = [
  // ===== Combat & Weapon Mastery =====
  {
    key: "akimbo-specialist",
    name: "Akimbo Specialist",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You master fighting with two weapons simultaneously, gaining the following benefits:\n• You gain a +1 bonus to your Defense while you are wielding a separate melee or ranged weapon in each hand.\n• You can use two-weapon fighting (making a follow-up attack as a Swift Action) even when the one-handed weapons you are wielding are not classified as Light.\n• You can draw or stow two one-handed weapons as a Free Action when you would normally be able to draw or stow only one.\n\n**Upgrade (Level 6+):** When you score a critical hit with one of your two weapons, you may immediately make one additional attack with the opposite weapon as part of the same Action against the same Target."
  },
  {
    key: "armor-piercing-specialist",
    name: "Armor Piercing Specialist",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You have achieved a penetrating precision in combat, granting you the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Once per turn, when you hit a Target with an attack that deals Piercing or Ballistic damage, you can re-roll one of the attack's damage dice, and you must use the new roll.\n• When you score a critical hit that deals Piercing or Ballistic damage to a Target, you can roll one additional damage die when determining the extra damage the Target takes.\n\n**Upgrade (Level 6+):** Your Piercing and Ballistic attacks ignore the first 3 points of Armor DR. This does not apply against Resonant Plating or flow-imbued defenses."
  },
  {
    key: "arsenal-adept",
    name: "Arsenal Adept",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You have practiced extensively with a variety of weaponry, gaining the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• You gain Proficiency with four weapon categories or specific martial weapons of your choice, allowing you to add your Weapon Proficiency Bonus to your attack rolls with them.\n• You can pick up and fight with anything. You do not roll with Snag for making an attack with a weapon you are not Proficient with (you still do not add a Weapon Proficiency Bonus to those attacks).\n\n**Upgrade (Level 6+):** Once per turn, when you hit a Target with a weapon you gained Proficiency in through this Talent, you add your Caliber to that attack's damage."
  },
  {
    key: "close-quarters-brawler",
    name: "Close-Quarters Brawler",
    category: "Combat & Weapon Mastery",
    requirements: "Body 13 or higher.",
    text: "You have developed the skills necessary to hold your own in brutal grappling exchanges. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• You gain Edge on attack rolls against a Target you are Grappling.\n• You can use your Action to try to pin a Target you have Grappled. To do so, make another contested Athletics check. If you succeed, the Target suffers the Restrained condition until the grapple ends.\n\n**Upgrade (Level 6+):** While you have a Target Grappled, your melee attacks against that Target score critical hits on a roll of 19 or 20."
  },
  {
    key: "concussive-striker",
    name: "Concussive Striker",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You are practiced in the art of crushing your Enemies, granting you the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• Once per turn, when you hit a Target with an attack that deals Bludgeoning damage, you can move it 1 space to an unoccupied space, provided the Target is no more than one Size category larger than you.\n• When you score a critical hit that deals Bludgeoning damage to a Target, all attack rolls against that Target gain Edge until the start of your next turn.\n\n**Upgrade (Level 6+):** When you hit a Target with a Bludgeoning attack on your turn, you may force it to make a Body Saving Throw (DC 8 + your Body modifier + your Weapon Proficiency Bonus) or be Stunned until the end of your next turn. Once you stun a Target this way, you cannot do so again until you finish a Short Rest."
  },
  {
    key: "dead-eye-sniper",
    name: "Dead-Eye Sniper",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You have mastered ranged weapons and can make shots that others find impossible. You gain the following benefits:\n• Attacking at long range does not impose Snag on your ranged weapon attack rolls.\n• Your ranged weapon attacks ignore the Defense bonuses provided by Half Cover.\n• Before you make an attack with a ranged weapon that you are Proficient with, you can choose to take a -5 penalty to the attack roll. If that attack hits, you add +10 to the attack's damage.\n• You can use this option once per turn.\n\n**Upgrade (Level 6+):** Your ranged weapon attacks now also ignore the Defense bonuses provided by Three-Quarter Cover, and you no longer have Snag on ranged attacks when an Enemy is within 1 space of you."
  },
  {
    key: "heavy-handed",
    name: "Heavy Handed",
    category: "Combat & Weapon Mastery",
    requirements: "Character Level 4, Body 14+.",
    text: "You put crushing momentum into your heaviest strikes. You gain the following benefits:\n• When you hit a Target with a melee attack using a weapon with the Heavy trait, you can push the Target up to 1 space into an unoccupied space.\n• If this push forces the Target to strike a solid object or another Target, they must succeed on a Body Saving Throw (DC 8 + your Body modifier + your Weapon Proficiency Bonus) or be knocked Prone.\n• You gain a +2 bonus to damage rolls with weapons possessing the Heavy trait.\n\n**Upgrade (Level 6+):** The push distance increases to 2 spaces, and a Target knocked Prone by this Talent also takes Bludgeoning damage equal to your Body modifier (minimum 1)."
  },
  {
    key: "heavy-weapon-specialist",
    name: "Heavy Weapon Specialist",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You have learned to put the weight of heavy kinetic and ballistic weaponry to your advantage. You gain the following benefits:\n• On your turn, when you score a critical hit with a melee weapon or reduce a Target to 0 Vitality with one, you can make one additional melee weapon attack as a Swift Action.\n• Before you make a melee attack with a Heavy weapon that you are Proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack's damage.\n\n**Upgrade (Level 6+):** When you take the Attack Action on your turn while wielding a Heavy weapon, you may make one additional melee attack with that weapon as part of the same Action. You cannot apply this Talent's minus 5 to hit for plus 10 damage option to that additional attack."
  },
  {
    key: "laceration-expert",
    name: "Laceration Expert",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You have learned exactly where to cut to yield the greatest results, granting you the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Once per turn when you hit a Target with an attack that deals Slashing damage, you can reduce the Speed of the Target by 2 until the start of your next turn.\n• When you score a critical hit that deals Slashing damage to a Target, you grievously wound it. Until the start of your next turn, the Target rolls all attack rolls with Snag.\n\n**Upgrade (Level 6+):** Your Slashing attacks now also cause bleeding wounds. A Target damaged by your Slashing attacks gains 1 stack of the Bleeding condition."
  },
  {
    key: "melee-mastery",
    name: "Melee Mastery",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You strike with brutal efficiency in close quarters, gaining the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Once per turn when you roll damage for a melee weapon attack, you can reroll the weapon's damage dice and use either total.\n• When you take the Attack Action with a melee weapon, you can use a Swift Action to make one additional attack with the same weapon as long as the original attack hit. This Swift Action attack uses your full damage modifier.\n\n**Upgrade (Level 6+):** When you reduce a Target to 0 Vitality with a melee attack, you regain Vitality equal to your Caliber + your Body modifier. You can do this a number of times equal to your Caliber per Long Rest."
  },
  {
    key: "ricochet-shot",
    name: "Ricochet Shot",
    category: "Combat & Weapon Mastery",
    requirements: "Proficiency with at least one ranged weapon.",
    text: "You've mastered the art of impossible angles, banking shots off cover, walls, and metal surfaces. You gain the following benefits:\n• Increase your Agility or Wits score by 1, to a maximum of 20.\n• When you make a ranged weapon attack against a Target that has Half Cover or Three-Quarter Cover from a hard surface (concrete, metal, vehicle), you can choose to ignore the cover entirely. On a miss, you must still resolve damage against a random Target within 2 spaces of the original Target (GM's choice) or against the cover itself.\n• Once per turn when you make a ranged weapon attack against a Target within 6 spaces, you may designate a second Target within 1 space of the first. If your attack roll hits both Targets' Defense, both take damage from the attack. Roll damage once.\n\n**Upgrade (Level 6+):** You may use the second-Target effect at the full range of your weapon, and the second Target can be up to 2 spaces from the first. Additionally, your ricochet attacks ignore total Cover that is less than 1 space thick."
  },
  {
    key: "sidearm-gunslinger",
    name: "Sidearm Gunslinger",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You have a quick hand and keen eye when employing firearms, granting you the following benefits:\n• You ignore the High Recoil trait on Sidearms you are Proficient with, so making multiple Sidearm attacks in a round never imposes Snag from recoil. In addition, you never need to spend a Swift Action to reload a Sidearm during combat.\n• Being within 1 space of a hostile Target does not impose Snag on your ranged attack rolls with Sidearms.\n• When you use your Action to attack with a one-handed weapon, you can use a Swift Action to attack with a Sidearm you are holding.\n\n**Upgrade (Level 6+):** Once per turn when you score a critical hit with a Sidearm, you may immediately fire it at one additional Target within 6 spaces as part of the same Action."
  },
  {
    key: "staff-spear-master",
    name: "Staff & Spear Master",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "You wield reach weapons with deadly precision, gaining the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• When you take the Attack Action and attack with only a Reach melee weapon or staff, you can use a Swift Action to make a melee attack with the opposite end of the weapon. This attack deals 1d6 Bludgeoning damage and uses your normal attack and damage modifiers.\n• While you are wielding a Reach melee weapon or staff, Enemies provoke an opportunity attack (Impulse Action) from you when they enter the reach you have with that weapon.\n\n**Upgrade (Level 6+):** Your reach with reach weapons extends an additional 1 space, and you gain Edge on opportunity attacks made with reach weapons."
  },
  {
    key: "street-scrapper",
    name: "Street Scrapper",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "Accustomed to the rough-and-tumble fighting using whatever weapons happen to be at hand, you gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• You add your Simple Weapons Proficiency Bonus to attack rolls with improvised weapons, and you do not roll with Snag when wielding them.\n• Your unarmed strikes deal 1d4 Bludgeoning damage.\n• When you hit a Target with an unarmed strike or an improvised weapon on your turn, you can use a Swift Action to attempt to Grapple the Target.\n\n**Upgrade (Level 6+):** Your unarmed strike damage increases to 1d8, and improvised weapons you wield are treated as Proficient martial weapons that deal an additional 1d4 damage of their normal type. You also gain Resistance to damage from improvised weapons used against you."
  },

  // ===== Tactics & Hybrid Fighting =====
  {
    key: "blade-weaver",
    name: "Blade Weaver",
    category: "Tactics & Hybrid Fighting",
    requirements: "Agility 13 or higher.",
    text: "You weave through enemy strikes with razor-sharp timing, gaining the following benefits:\n• Increase your Agility score by 1, to a maximum of 20.\n• When you are wielding a Light melee weapon with which you are Proficient and another Enemy hits you with a melee attack, you can use your Impulse Action to add your Weapon Proficiency Bonus to your Defense for that attack, potentially causing the attack to miss you.\n\n**Upgrade (Level 6+):** When an attack misses you because of this Talent, you may make a melee attack against the attacker as a Free Action."
  },
  {
    key: "combat-splicer",
    name: "Combat Splicer",
    category: "Tactics & Hybrid Fighting",
    requirements: "The ability to use Quick Hacks, Ciphers, or Flow Invocations.",
    text: "You have practiced routing code and shaping the Flow in the midst of combat, learning techniques that grant you the following benefits:\n• You gain Edge on Body or Wits Saving Throws made to maintain your active Links or sustain a Flow effect when you take damage.\n• You can perform the physical inputs for Quick Hacks or Invocations even when you have weapons or a physical shield in one or both hands.\n• When an Enemy's movement provokes an opportunity attack from you, you can use your Impulse Action to execute a Quick Hack or an Invocation against that Enemy, rather than making a standard melee attack. The action must normally cost 1 Action and must target only that Enemy.\n\n**Upgrade (Level 6+):** You no longer need to maintain Focus or Sustain to keep your Links and Flow effects active when you take damage of 20 or less. Damage of 21+ still requires the relevant Saving Throw, with Edge."
  },
  {
    key: "cross-discipline-tactic",
    name: "Cross-Discipline Tactic",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "You have studied the combat methodologies of other specialists to learn their tricks. You gain the following benefits:\n• You learn one of the following class abilities of your choice, with all of its associated mechanics: a single Operator Tactical Maneuver, a single Hustler Leverage Ability, or a single Scoundrel Gambit. You meet any internal prerequisites for the chosen ability, but you cannot select abilities flagged as \"Capstone\" or \"Level 7+\" features.\n• You gain a number of resource points equal to your Caliber to fuel this ability, regained on a Short or Long Rest. If the ability uses a different resource (e.g., uses-per-rest), you instead gain one use per Short Rest.\n• Whenever you gain a level, you can replace the chosen ability with another that fits the same restrictions.\n\n**Upgrade (Level 6+):** You learn a second class ability under the same rules, and your resource pool for this Talent increases by 2 points."
  },
  {
    key: "glitch-breaker",
    name: "Glitch Breaker",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "You have practiced techniques in melee combat designed specifically to disrupt hackers and Shapers, gaining the following benefits:\n• When a Target within your melee reach uses a Quick Hack, Cipher Attack, or Flow Invocation, you can use your Impulse Action to make a melee weapon attack against that Target.\n• When you damage a Target that is maintaining Focus on a Link or Sustaining a Flow effect, that Target rolls with Snag on the Focus Check made to maintain their connection.\n• You gain Edge on Saving Throws against Invocations and Quick Hacks used by Enemies within your melee reach.\n\n**Upgrade (Level 6+):** When you successfully interrupt a Target's Quick Hack, Cipher, or Invocation through any means (failed Focus Check, damage causing a sustain failure, etc.), the Target cannot use that specific ability again until the end of their next turn."
  },
  {
    key: "lockdown-specialist",
    name: "Lockdown Specialist",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "You have mastered techniques to take advantage of every drop in any Enemy's guard, gaining the following benefits:\n• When you hit a Target with an opportunity attack, the Target's Speed becomes 0 for the rest of the turn.\n• Enemies provoke opportunity attacks from you even if they use the Disengage action before leaving your reach.\n• When an Enemy within 1 space of you makes an attack against a Target other than you (and that Target does not have this Talent), you can use your Impulse Action to make a melee weapon attack against the attacking Enemy.\n\n**Upgrade (Level 6+):** You may make a number of opportunity attacks per round equal to your Caliber, to a maximum of 3 (instead of one). When you hit a Target with an opportunity attack, that Target also has Snag on its next attack roll before the start of your next turn."
  },
  {
    key: "phalanx-operator",
    name: "Phalanx Operator",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "You use shields not just for protection but also for offense. You gain the following benefits while you are wielding a Physical Shield:\n• If you take the Attack Action on your turn, you can use a Swift Action to try to Shove a Target within 1 space of you with your shield.\n• If you are not Incapacitated, you can add your shield's Defense bonus to any Agility Saving Throw you make against an effect that targets only you.\n• If you are subjected to an effect that allows you to make an Agility Saving Throw to take only half damage, you can use your Impulse Action to take no damage if you succeed on the Saving Throw, interposing your shield between yourself and the source of the effect.\n\n**Upgrade (Level 6+):** You can extend your shield's protection to an Ally within 1 space of you as an Impulse Action. Until the start of your next turn, that Ally gains your shield's Defense bonus. You cannot benefit from your shield while doing so."
  },
  {
    key: "signal-sniper",
    name: "Signal Sniper",
    category: "Tactics & Hybrid Fighting",
    requirements: "The ability to use Quick Hacks, Ciphers, or Flow Invocations.",
    text: "You have learned techniques to physically extend the reach of your network or resonance attacks, gaining the following benefits:\n• When you use a Quick Hack, Cipher Attack, or Flow Attack that requires you to make an attack roll, the effective range is doubled.\n• Your ranged tech and Flow attacks ignore the Defense bonuses provided by Half Cover and Three-Quarter Cover.\n• You learn one Quick Hack or Base Resonance (0 FP Intent) of your choice.\n\n**Upgrade (Level 6+):** Once per Short Rest, you can use a Quick Hack, Cipher, or Invocation as if you were within line of sight of a Target you have personally seen within the past hour, regardless of intervening obstacles, walls, or distance (up to 1 mile)."
  },
  {
    key: "tactical-operative",
    name: "Tactical Operative",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "You have combat training that allows you to perform special maneuvers. You gain the following benefits:\n• You learn two Overdrive Maneuvers or Tactical Maneuvers of your choice from the Fury or Operator class. If a maneuver requires a Target to make a Saving Throw, the DC equals 8 + your Body or Agility modifier (your choice) + your Caliber.\n• You gain 2 Overdrive Points (or Execution, depending on your choice). These points fuel your maneuvers and are regained when you finish a Short Rest or Long Rest.\n\n**Upgrade (Level 6+):** You learn one additional maneuver from the same list, and your resource pool from this Talent increases by 2 points."
  },

  // ===== Tech & #GRID Operations =====
  {
    key: "augment-specialist",
    name: "Augment Specialist",
    category: "Tech & #GRID Operations",
    requirements: "Tech 13 or higher.",
    text: "You have an intuitive command of cybernetic installation and tuning, granting you the following benefits:\n• Increase your Tech score by 1, to a maximum of 20.\n• Your body tolerates chrome better than most. Reduce your Total Static by 2 for the purpose of determining your Static Threshold, to a minimum of 0. This lets you install more cyberware before the Chrome Tax penalties escalate.\n• The credit cost of installing, removing, or tuning your own cybernetics is reduced by 25%, and the downtime required for installation is halved.\n\n**Upgrade (Level 6+):** Once per Long Rest, when one of your installed cybernetics is disabled, suppressed, or hacked by an Enemy effect, you can use your Impulse Action to override the disruption and restore the cybernetic to full function."
  },
  {
    key: "gridrunners-reflexes",
    name: "#GRIDrunner's Reflexes",
    category: "Tech & #GRID Operations",
    requirements: "The ability to jack into the grid or operate a Smartdeck.",
    text: "Your nervous system is wired to react in the grid as quickly as it does in meatspace. You gain the following benefits:\n• Increase your Tech or Wits score by 1, to a maximum of 20.\n• While you are jacked into the grid (or otherwise operating in a virtual environment), you gain a +2 bonus to your Defense and Edge on Initiative checks within that environment.\n• When an Enemy targets you with a Quick Hack or Cipher, you can use your Impulse Action to gain Resistance to the damage and Edge on the Saving Throw against that effect.\n\n**Upgrade (Level 6+):** Once per Long Rest, when you would suffer LinkDeath, you can choose to be safely ejected from the grid instead, taking damage equal to half your remaining Vitality (rounded down) but suffering no other consequences."
  },
  {
    key: "hardware-harmonizer",
    name: "Hardware Harmonizer",
    category: "Tech & #GRID Operations",
    requirements: "Character Level 8, Tech 16+.",
    text: "You have a preternatural understanding of how mechanical and digital systems want to function. You gain the following benefits:\n• When you utilize a Tool Kit in which you have Proficiency, any Dice Pool margin of 0 (Mixed Result) is treated as a Strong Success instead.\n• The time required for you to repair broken hardware, patch corrupted code, or build localized devices is halved.\n• You gain Edge on Engineering and Systems d20 checks made to repair, build, or harmonize hardware.\n\n**Upgrade (Level 6+):** Your Mixed Result to Strong Success conversion now applies to all your Tech-based Dice Pool checks, not only those made with a Tool Kit."
  },
  {
    key: "junk-tinkerer",
    name: "Junk Tinkerer",
    category: "Tech & #GRID Operations",
    requirements: "",
    text: "You have learned some of a street engineer's inventiveness, gaining the following benefits:\n• You learn one Engineering-based Quick Hack of your choice. Tech is your governing attribute.\n• You gain Proficiency with one Tool Category of your choice, and you can use those tools as a focus for your Tech-based abilities.\n• Once per Long Rest, you can spend 10 minutes scavenging available parts to construct one single-use gadget that produces an effect equivalent to a standard Cipher of your choice from a list approved by the GM (typical examples: smoke deployer, EMP charge, signal jammer, motion tripwire). The gadget must be used within 24 hours or it degrades.\n\n**Upgrade (Level 6+):** You can construct a number of single-use gadgets equal to your Caliber per Long Rest, and the gadgets you produce no longer degrade until consumed."
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
    requirements: "Character Level 4, Codebreaker or Source Coder.",
    text: "Your mind is built to handle the chaotic data streams of the grid. You gain the following benefits:\n• You can maintain one additional active Link beyond your standard class maximum.\n• You gain Edge on Tech checks made to stabilize deteriorating Links or resist forced disconnections.\n\n**Upgrade (Level 6+):** You can maintain a second additional active Link (two beyond your class maximum total), and when one of your Links is forcibly broken, you can immediately re-establish it as an Impulse Action without paying the usual setup cost."
  },
  {
    key: "script-archivist",
    name: "Script Archivist",
    category: "Tech & #GRID Operations",
    requirements: "Tech or Wits 13 or higher.",
    text: "You maintain a personal library of scripts and signature exploits. You gain the following benefits:\n• When you choose this Talent, you acquire a data-slate holding two complex utility Ciphers or diagnostic Quick Hacks of your choice.\n• If you discover new standard Ciphers in the world (such as on a Burner Relay or an Enemy Smartdeck), you can integrate them into your data-slate. The process takes 2 hours of Downtime per tier of the Cipher and costs 𝒢50 per tier.\n• You can execute these stored scripts during Downtime or out of combat using the Dice Pool Method. Once per Long Rest, you may execute one stored script during combat as if it were a Quick Hack you knew.\n\n**Upgrade (Level 6+):** The in-combat execution increases to a number of uses equal to your Caliber per Long Rest, and integrating new Ciphers costs only 𝒢25 per tier and takes half the normal time."
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
    text: "Your connection to the Flow allows you to perceive the lingering echoes of metaphysical phenomena. You gain the following benefits:\n• Your passive Resonance Sense range increases to 12 spaces.\n• You gain Edge on d20 checks made to identify the Severity Rating of a Flow Disturbance or to track a Target using residual Flow energy.\n\n**Upgrade (Level 6+):** Your passive Resonance Sense range increases to 24 spaces and can detect through up to 1 space of solid material. You also automatically know the general direction of the nearest Flow Disturbance of Severity 2 or higher within 1 mile."
  },
  {
    key: "resonance-dabbler",
    name: "Resonance Dabbler",
    category: "The Flow & Resonance",
    requirements: "",
    text: "Your exposure to bizarre mystech or intense residual energy has changed you, granting you the following benefits:\n• Increase your Tech, Mystique, or Charm score by 1, to a maximum of 20.\n• You learn one Base Resonance (0 FP Intent) and one Empowered Effect (1 FP Force) from the Shaper class, or two basic Quick Hacks.\n• You can activate the Empowered Effect once without expending Flow Points or generating Strain. You regain this use on a Long Rest. The primary attribute for these checks is the Attribute increased by this Talent.\n\n**Upgrade (Level 6+):** You learn one additional Empowered Effect (1 FP), and the free use feature now refreshes on a Short Rest."
  },
  {
    key: "resonance-optimizer",
    name: "Resonance Optimizer",
    category: "The Flow & Resonance",
    requirements: "The ability to shape Flow Invocations.",
    text: "When you gain this Talent, choose one of the following damage types: Fire, Cold, Electric, Toxic, or Force.\n• Invocations you shape ignore Resistance to damage of the chosen type.\n• When you roll damage for an Invocation you shape that deals damage of the chosen type, you can treat any 1 on a damage die as a 2.\n• You can select this Talent multiple times. Each time you do so, you must choose a different damage type.\n\n**Upgrade (Level 6+):** Your Invocations of the chosen damage type now treat Immunity to that damage type as Resistance instead, and once per Short Rest you may maximize the damage of one Invocation that deals damage of the chosen type."
  },
  {
    key: "resonance-weaver",
    name: "Resonance Weaver",
    category: "The Flow & Resonance",
    requirements: "Attuned to the Flow (Shaper class).",
    text: "You have learned how to exert your will on the current to alter how your Invocations function. You gain the following benefits:\n• You learn two Advanced Techniques or Invocation modifications of your choice (such as Resonance Amplification).\n• You gain 2 additional Flow Points (FP) that can only be spent on these modifications or to power Advanced Techniques. You regain these FP when you finish a Long Rest.\n\n**Upgrade (Level 6+):** You learn one additional Advanced Technique or Invocation modification, and your bonus FP pool from this Talent increases by 2."
  },
  {
    key: "resonant-recovery",
    name: "Resonant Recovery",
    category: "The Flow & Resonance",
    requirements: "Character Level 8, Shaper.",
    text: "You are deeply synchronized with the ambient frequencies of the world. You gain the following benefits:\n• When you perform a Ritual Recovery, you regain 1 additional Flow Point beyond your normal amount.\n• If you perform a Ritual Recovery in a Flow-rich area (Anomaly Severity 0), you can roll 3d20 and keep the highest result for the Flow Dice Pool check.\n\n**Upgrade (Level 6+):** Once per Long Rest, when your Flow Points reach 0, you can use an Impulse Action to regain Flow Points equal to your Caliber + your Flow modifier."
  },
  {
    key: "static-grounding",
    name: "Static Grounding",
    category: "The Flow & Resonance",
    requirements: "Character Level 4, Unattuned Classes.",
    text: "Your grounded, purely physical nature makes you difficult for the Flow to latch onto. You gain the following benefits:\n• You gain Edge on all Saving Throws against Invocations utilizing the Electromagnetic or Cognitive Base Resonances.\n• You reduce the damage you take from any Invocation or magical effect that targets you directly by an amount equal to your Caliber.\n\n**Upgrade (Level 6+):** Once per Long Rest, when you succeed on a Saving Throw against a hostile Invocation, you can use your Impulse Action to reflect the effect back at its caster, who must make the same Saving Throw against their own DC."
  },

  // ===== Armor & Resilience =====
  {
    key: "cyber-reinforced-vitality",
    name: "Cyber-Reinforced Vitality",
    category: "Armor & Resilience",
    requirements: "",
    text: "Your body has been hardened through dermal mesh, subdermal weave, or cybernetic vital reinforcement. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• Your Vitality maximum increases by an amount equal to twice your Character level when you gain this Talent. Whenever you gain a level thereafter, your Vitality maximum increases by an additional 2 points.\n\n**Upgrade (Level 6+):** You gain Resistance to one damage type of your choice from this list: Ballistic, Piercing, Slashing, or Bludgeoning."
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
    text: "Choose one Attribute score. You gain the following benefits:\n• Increase the chosen Attribute score by 1, to a maximum of 20.\n• You add your Caliber to all Saving Throws you make using the chosen Attribute, as though it were one of your class Saving Throw Focuses. If the chosen Attribute is already one of your Saving Throw Focuses, choose a different Attribute for this benefit.\n\n**Upgrade (Level 6+):** When you succeed on a Saving Throw using your chosen Attribute by 5 or more, you suffer no effect from the source, even if it would normally cause an effect on a successful save (such as half damage)."
  },
  {
    key: "siege-plating-expert",
    name: "Siege Plating Expert",
    category: "Armor & Resilience",
    requirements: "Proficiency with Heavy Armor.",
    text: "You can use your armor to deflect strikes that would kill others. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• While you are wearing Heavy Armor, Ballistic, Piercing, Bludgeoning, and Slashing damage that you take from standard weapons is reduced by 3. This reduction is applied in addition to your normal Armor DR.\n\n**Upgrade (Level 6+):** The damage reduction increases to 5, and once per Short Rest when you would be reduced to 0 Vitality by a Ballistic or Physical attack while wearing Heavy Armor, you are instead reduced to 1 Vitality."
  },
  {
    key: "tactical-harness-expert",
    name: "Tactical Harness Expert",
    category: "Armor & Resilience",
    requirements: "Proficiency with Medium Armor.",
    text: "You have practiced moving flawlessly in medium armor to gain the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• Wearing Medium Armor does not impose Snag on your Agility (Stealth) checks or Agility-based Dice Pools.\n• When you wear Medium Armor, you can add up to +3 (rather than the normal limit of +2) from your Agility modifier to your Defense.\n\n**Upgrade (Level 6+):** The Agility modifier cap for Medium Armor increases to +4 for you, and you treat Medium Armor as Light Armor for the purposes of class features and Talent prerequisites."
  },
  {
    key: "unbreakable",
    name: "Unbreakable",
    category: "Armor & Resilience",
    requirements: "",
    text: "Hardy and resilient against the worst the city has to offer, you gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• When you roll a Resilience Die during a Short Rest to regain Vitality, the minimum amount of Vitality you regain from the roll equals twice your Body modifier (minimum of 2).\n\n**Upgrade (Level 6+):** You gain one additional Resilience Die, and you can spend Resilience Dice during a Short Rest to remove conditions: 1 die to remove the Frightened or Poisoned condition, 2 dice to remove the Dazed or Stunned condition."
  },

  // ===== Mobility & Traversal =====
  {
    key: "asphalt-rider",
    name: "Asphalt Rider",
    category: "Mobility & Traversal",
    requirements: "",
    text: "You are a dangerous foe to face while mounted on a street bike or operating a vehicle. You gain the following benefits:\n• Increase your Agility or Wits score by 1, to a maximum of 20.\n• You gain Proficiency with one vehicle category of your choice.\n• While you are piloting and are not Incapacitated, you gain Edge on melee attack rolls against any unmounted Target that is physically smaller than your vehicle.\n• While you are piloting, you can force an attack targeted at your vehicle to target your Defense instead.\n• If your vehicle is subjected to an effect that allows it to make an Agility Saving Throw to take only half damage, it instead takes no damage if it succeeds on the saving throw, and only half damage if it fails.\n\n**Upgrade (Level 6+):** You and any vehicle you operate gain a +2 Speed bonus. When your vehicle would be destroyed or disabled, once per Long Rest you can use your Impulse Action to keep it operational at 1 Hull Point until the end of the Encounter."
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
    text: "You hit moving and you hit hard. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• When you use your Action to Dash, you can use a Swift Action to make one melee weapon attack or to Shove a Target.\n• If you move at least 2 spaces in a straight line immediately before taking this Swift Action, you either gain a +5 bonus to the attack's damage roll (if you chose to make a melee attack and hit) or push the Target up to 2 spaces away from you (if you chose to Shove and you succeed).\n\n**Upgrade (Level 6+):** When you Dash, you gain the ability to move through hostile Targets' spaces (but cannot end your movement there), and any Target you pass through must succeed on a Body Saving Throw (DC 8 + your Body modifier + your Caliber) or be knocked Prone."
  },
  {
    key: "parkour-runner",
    name: "Parkour Runner",
    category: "Mobility & Traversal",
    requirements: "",
    text: "You have undergone extensive physical training in urban traversal to gain the following benefits:\n• Increase your Body or Agility score by 1, to a maximum of 20.\n• When you are Prone, standing up costs only 1 point of Speed.\n• Climbing does not cost you extra Speed.\n• You can make a running long jump or a running high jump after moving only 1 space, rather than 2 spaces.\n\n**Upgrade (Level 6+):** You gain a climb speed equal to your normal Speed, and you do not take fall damage from falls of 6 spaces or less if you are conscious and not Restrained."
  },
  {
    key: "speed-freak",
    name: "Speed Freak",
    category: "Mobility & Traversal",
    requirements: "",
    text: "You are exceptionally speedy and agile. You gain the following benefits:\n• Your base Speed increases by 2.\n• When you use the Dash Action, Difficult Terrain does not cost you extra Speed on that turn.\n• When you make a melee attack against a Target, you do not provoke opportunity attacks from that Target for the rest of the turn, whether you hit or not.\n\n**Upgrade (Level 6+):** Your base Speed increases by an additional 2 (4 total), and you can move through Difficult Terrain normally even when not Dashing."
  },

  // ===== Skills, Social & Utility =====
  {
    key: "crew-commander",
    name: "Crew Commander",
    category: "Skills, Social & Utility",
    requirements: "Charm 13 or higher.",
    text: "You inspire your crew, shoring up their resolve to fight. You gain the following benefits:\n• Increase your Charm score by 1, to a maximum of 20.\n• You can spend 10 minutes during Downtime or a Short Rest inspiring your crew. When you do so, choose up to six friendly Characters (which can include yourself) within 6 spaces of you who can see or hear you and who can understand you. Each Character gains Vigor equal to your Character level + your Charm modifier. A Character cannot gain Vigor from this Talent again until they have finished a Short Rest or Long Rest.\n\n**Upgrade (Level 6+):** When you use Crew Commander, the affected Characters also gain Edge on their next attack roll or Saving Throw made within the next 10 minutes."
  },
  {
    key: "crowd-reader",
    name: "Crowd Reader",
    category: "Skills, Social & Utility",
    requirements: "Charm or Wits 13 or higher.",
    text: "You read a room the way a netrunner reads code: instantly and ruthlessly. You gain the following benefits:\n• Increase your Charm or Wits score by 1, to a maximum of 20.\n• When an Encounter that includes negotiation, deception, or social pressure begins, you may roll a Charm (Insight) check (DC 12). On a success, you immediately learn one piece of useful information about one Target of your choice: their highest non-physical Attribute, their most pressing emotional state (Fear, Greed, Anger, etc.), or whether they are armed or augmented.\n• You gain Edge on Initiative checks made during social Encounters, and you can use your Charm modifier in place of Wits for Initiative in such Encounters.\n\n**Upgrade (Level 6+):** You learn two pieces of useful information instead of one, and your insight applies to all hostile Targets in the social Encounter rather than just one."
  },
  {
    key: "faceless-persona",
    name: "Faceless Persona",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "Skilled at mimicry, digital spoofing, and dramatics, you gain the following benefits:\n• Increase your Charm score by 1, to a maximum of 20.\n• You gain Edge on Charm (Deception) and Charm (Performance) checks when trying to pass yourself off as a different person or fabricate a false identity.\n• You can mimic the speech of another person or the mechanical sounds made by other Targets. You must have heard the person speaking, or heard the Target make the sound, for at least 1 minute. A successful Wits (Intuition) check contested by your Charm (Deception) check allows a listener to determine that the effect is faked.\n\n**Upgrade (Level 6+):** You can maintain a single fabricated identity that functions seamlessly in digital records (legal IDs, employment history, social profiles) without ongoing rolls. The GM may call for a check only when the identity is actively being investigated by a major faction."
  },
  {
    key: "fate-bender",
    name: "Fate Bender",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "You have inexplicable luck that seems to kick in at just the right moment in the sprawl. You gain the following benefits:\n• You have 3 Luck Points. Whenever you make an attack roll, an ability check, or a Saving Throw (using the d20 Method), you can spend one Luck Point to roll an additional d20. You can choose to spend this point after you roll the die, but before the outcome is determined. You choose which of the d20s is used for the final result.\n• You can also spend one Luck Point when an attack roll is made against you. Roll a d20 and then choose whether the attack uses the attacker's roll or yours.\n• If more than one Character spends a Luck Point to influence the outcome of a roll, the points cancel each other out; no additional dice are rolled.\n• You regain your expended Luck Points when you finish a Long Rest.\n\n**Upgrade (Level 6+):** You have 5 Luck Points instead of 3, and you regain one expended Luck Point on a Short Rest (up to a maximum of 5)."
  },
  {
    key: "field-specialist",
    name: "Field Specialist",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "You have honed your Proficiency with particular skills in the field, granting you the following benefits:\n• Increase one Attribute score of your choice by 1, to a maximum of 20.\n• You gain Proficiency in one Skill of your choice.\n• Choose one Skill in which you are Proficient. You gain Expertise with that skill, adding a +4 bonus on d20 checks and granting +4 Edge Dice on Dice Pool checks.\n\n**Upgrade (Level 6+):** You gain Expertise with one additional Skill in which you are Proficient."
  },
  {
    key: "hyper-aware",
    name: "Hyper-Aware",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "Quick to notice details of your environment, you gain the following benefits:\n• Increase your Wits or Tech score by 1, to a maximum of 20.\n• If you can see a Character's mouth while it is speaking, you can interpret what it is saying by reading its lips.\n• You gain a +5 bonus to your Passive Wits (Perception) and Passive Wits (Investigation) checks.\n\n**Upgrade (Level 6+):** You can no longer be surprised by traps, ambushes, or hidden Targets you would have been able to detect with a Wits (Perception) or Wits (Investigation) check, even passively."
  },
  {
    key: "hyper-vigilant",
    name: "Hyper-Vigilant",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "Always on the lookout for danger in the sprawl, you gain the following benefits:\n• You cannot be caught off guard or Surprised while you are conscious.\n• You gain a +5 bonus to Initiative rolls.\n• Enemies do not gain Edge on attack rolls against you as a result of being Hidden from you.\n\n**Upgrade (Level 6+):** On the first round of any combat Encounter, you gain a free Swift Action that you may use only to move, take cover, or draw a weapon."
  },
  {
    key: "kinetic-manipulator",
    name: "Kinetic Manipulator",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "You have attained a mastery over a localized Kinetic resonance or a specialized hover drone, granting you the following benefits:\n• Increase your Tech, Wits, or Mystique score by 1, to a maximum of 20.\n• You learn a localized Kinetic Base Resonance or gain a specialized utility drone that can manipulate objects remotely up to 6 spaces away. It operates silently and invisibly.\n• As a Swift Action, you can try to Shove one Target you can see within 6 spaces of you using this force. The Target must succeed on a Body Saving Throw (DC 8 + Caliber + the modifier of the score increased by this Talent) or be moved 1 space toward or away from you. A Target can willingly fail this save.\n\n**Upgrade (Level 6+):** You can manipulate objects up to 12 spaces away, and your Shove can move Targets up to 2 spaces. You can also use your manipulator to make a single ranged attack as a Swift Action against a Target within 6 spaces, dealing 1d8 Bludgeoning damage on a hit."
  },
  {
    key: "photographic-memory",
    name: "Photographic Memory",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "You wear a watch, track time flawlessly, and remember details with uncanny precision. You gain the following benefits:\n• Increase your Tech or Wits score by 1, to a maximum of 20.\n• You always know which way is north and can perfectly track time and direction without grid assistance.\n• You can accurately recall anything you have seen or heard within the past month. You gain Edge on Wits (Insight) or Wits (Investigation) checks related to recalling details.\n\n**Upgrade (Level 6+):** Your recall extends to anything you have seen or heard within the past year, and you can make a Wits check (DC 15) to recall specific written documents or visual data with photographic clarity."
  },
  {
    key: "ruin-crawler",
    name: "Ruin Crawler",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "Alert to the hidden traps, tripwires, and secret bulkheads found in bunkers, collapsed car parks, and datacenters, you gain the following benefits:\n• Increase your Wits or Agility score by 1, to a maximum of 20.\n• You gain Edge on Wits (Perception) and Wits (Investigation) checks made to detect the presence of hidden doors or concealed compartments.\n• You gain Edge on Saving Throws made to avoid or resist traps and environmental hazards.\n• You gain Resistance to the damage dealt by mechanical and explosive traps.\n• You can search for traps while traveling at a normal pace without penalty.\n\n**Upgrade (Level 6+):** You can disarm or bypass detected traps as a Swift Action (rather than an Action), and once per Long Rest you can declare that a trap that would have hit you \"didn't\", retroactively detecting and bypassing it as if you had searched the area."
  },
  {
    key: "shadow-operative",
    name: "Shadow Operative",
    category: "Skills, Social & Utility",
    requirements: "Agility 13 or higher.",
    text: "You are an expert at slinking through neon shadows and industrial ruins. You gain the following benefits:\n• Increase your Agility score by 1, to a maximum of 20.\n• You can try to hide when you are only lightly obscured from the Target from which you are hiding.\n• When you are Hidden from a Target and miss it with a ranged weapon attack, making the attack does not reveal your position.\n• Dim light or heavy shadows do not impose Snag on your Wits (Perception) checks relying on sight.\n\n**Upgrade (Level 6+):** When you are Hidden and make an attack against a Target that has not acted yet in the Encounter, you gain Edge on the attack roll and the attack scores critical hits on a roll of 19 or 20."
  },
  {
    key: "street-chef",
    name: "Street Chef",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "Time and effort spent mastering the culinary arts in the undercity has paid off. You gain the following benefits:\n• Increase your Body or Wits score by 1, to a maximum of 20.\n• You gain Proficiency with culinary tools or survival cooking gear.\n• As part of a Short Rest, you can cook a hearty meal, provided you have ingredients and proper gear. You can prepare enough food for a number of Characters equal to 4 + your Caliber. At the end of the Short Rest, any Character who eats the food and spends one or more Resilience Dice to regain Vitality regains an extra 1d8 Vitality.\n• With one hour of work or when you finish a Long Rest, you can cook a number of specialized rations equal to your Caliber. These last 8 hours. A Character can use a Swift Action to eat one to gain Vigor equal to your Caliber.\n\n**Upgrade (Level 6+):** The hearty meal bonus increases to 2d8 Vitality, and your specialized rations now also grant the eater Edge on their next Body Saving Throw within 1 hour of consumption."
  },
  {
    key: "toxicologist",
    name: "Toxicologist",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "For reasons that are definitely not malicious, you learn to prepare and deliver deadly chemical payloads, gaining the following benefits:\n• When you make a damage roll, you ignore Resistance to Toxic damage.\n• You can coat a weapon in toxin as a Swift Action, instead of an Action.\n• You gain Proficiency with medical and chemistry tools. With one hour of work using these tools and expending 𝒢50 worth of materials, you can create a number of doses of potent toxin equal to your Caliber.\n• Once applied to a weapon or ammunition, the toxin retains its potency for 1 minute or until you hit. When a Target takes damage from the coated weapon, they must succeed on a Body Saving Throw (DC 8 + your Tech modifier + your Caliber) or take 2d8 Toxic damage and gain the Poisoned condition until the end of your next turn.\n\n**Upgrade (Level 6+):** The toxin damage increases to 3d8 and the Poisoned condition lasts for 1 minute (with a save at the end of each of the Target's turns). You can also produce twice as many doses per crafting session."
  },
  {
    key: "trauma-medic",
    name: "Trauma Medic",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "You are an able street surgeon, allowing you to mend wounds quickly and get your Allies back in the fight. You gain the following benefits:\n• Increase your Wits or Tech score by 1, to a maximum of 20.\n• When you use a Medkit to Stabilize an Unconscious or dying Character, that Character also regains 1 Vitality.\n• As an Action, you can spend one use of a Medkit to tend to a Character and restore 1d6 + 4 Vitality to it, plus additional Vitality equal to the Character's maximum number of Resilience Dice. The Character cannot regain Vitality from this Talent again until it finishes a Short Rest or Long Rest.\n\n**Upgrade (Level 6+):** You can administer field medicine as a Swift Action instead of an Action, and your healing restores 2d6 + 4 Vitality. You can also remove one of the following conditions from the Target as part of the same action: Poisoned, Bleeding, or Dazed."
  },
  {
    key: "undercity-survivor",
    name: "Undercity Survivor",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "Your time surviving the neon-drenched shadows has changed you, granting you the following benefits:\n• Increase your Wits, Tech, or Charm score by 1, to a maximum of 20.\n• You learn one Quick Hack or Invocation that creates obscurement or alters perception (such as the Electromagnetic \"Phantom Shroud\" or a sensory hack). You can activate this effect once without expending Flow Points or generating Strain. Once you use it in this way, you cannot do so again until you finish a Long Rest. The primary attribute for these checks is the Attribute increased by this Talent.\n\n**Upgrade (Level 6+):** You can use the free activation feature twice per Long Rest, and you gain Edge on Agility (Stealth) checks made within the effect of your learned obscurement ability."
  }
];
