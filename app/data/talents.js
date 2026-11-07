window.EN = window.EN || {};

EN.talentRules = {
  progression: "Talents are signature techniques you select at specific levels. You don't buy them with Training Points.\n\nProgression\n\nAt levels 2, 4, 6, and 8, you gain a Universal Upgrade. When you reach one of these levels, you may choose one of the following:\n• Increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20).\n• Select one Talent from the lists below for which you meet the requirements.\nYou may freely mix the two options across your career.\n\nTalent Upgrades\n\nMany Talents list an Upgrade option at the end of their entry. When you reach Level 6 or later and gain a new Talent, you may instead spend that Talent slot to take the Upgrade of a Talent you already possess.\nYou can only have each Upgrade once, and you must already possess the base Talent in order to unlock its Upgrade.",
  requirementsRetraining: "Requirements: You must meet all Attribute and Level requirements at the moment you select the Talent (or its Upgrade).\nRetraining: Whenever you gain a new level, you may replace one Talent with another for which you meet the requirements. If you replace a Talent that you have Upgraded, you lose both the base Talent and its Upgrade. It still counts as your one retrain, and you refill both slots: two Talents, or a new Talent and its Upgrade if you're Level 6 or higher.",
  /* PHB:5008-5009, the book's "Reading a Talent" between Requirements & Retraining and Lineage
     Evolution. It sits in the Codex's Advancement panel in that order (js/codex_build.js). */
  readingATalent: "Reading a Talent\n\nEvery bullet under a Talent is yours once you take it. A Talent can't raise an Attribute above 20.\n\nSome Talents teach you a trick from outside your class: a Quick Hack, a Resonance, an Invocation. A free use of a learned trick costs no Flow Points, needs no Smartdeck, and generates no Strain. Free uses refresh on a Long Rest unless the entry says otherwise.",
  // split out of requirementsRetraining so Reading a Talent can sit before it, as the book orders them
  lineageEvolution: "Lineage Evolution\n\nLineage Evolution unlocks Additive Features you didn't choose at character creation. You gain access to these in two ways:\n• Lineage Talents: Whenever you reach a level that grants a new Talent (2, 4, 6, or 8), you may forsake selecting a Talent from the lists below and instead unlock one unpicked Additive Feature from your chosen Lineage.\n• The Awakening Milestone: At Level 4, alongside your standard Universal Upgrade, you automatically gain one additional Additive Feature from your Lineage for free, without needing to spend your Talent choice.\n\nLineage Additive Features gained this way function exactly like Talents for the purposes of Retraining. You may swap an Additive Feature for a different one from your Lineage, or trade it out for a standard Talent you meet the prerequisites for, whenever you level up.",
  categoriesIntro: "Categories\n\nTalents are sorted by their mechanical focus. You may choose a Talent from any category, as long as you meet its prerequisites.\n\nThe categories are:\n• Combat & Weapon Mastery, Talents focused on mastering specific weapon types, maximizing damage, and overpowering Enemies in direct combat.\n• Tactics & Hybrid Fighting, Talents focused on battlefield control, specialized maneuvers, and weaving the Flow or tech into physical combat.\n• Tech & #GRID Operations, Talents focused on coding, hardware tinkering, and working the #GRID.\n• The Flow & Resonance, Talents tied to the Flow and Invocations.\n• Armor & Resilience, Talents focused on soaking damage and surviving harsh conditions. Armor proficiencies themselves (Light, Medium, Heavy, and Physical Shields) are gained through Training Points and class features rather than dedicated Talents.\n• Mobility & Traversal, Talents focused on moving through the environment quickly and efficiently.\n• Skills, Social & Utility, Talents that shine outside of direct combat, offering support, crafting, and roleplay advantages."
};

EN.talents = [
  // ===== Combat & Weapon Mastery =====
  {
    key: "heavy-weapon-specialist",
    name: "Heavy Weapon Specialist",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "Heavy iron doesn't slow you down. It carries you through the swing and into the next one. You gain the following benefits:\n• On your turn, a critical hit you land with a melee weapon, or a Target you drop to 0 Vitality with one, lets you follow up before the turn ends: one more melee weapon attack as a Swift Action.\n• You can put everything behind a melee attack with a Heavy weapon you're Proficient with. Decide before the attack: take a -5 penalty on the attack roll, and if it hits, add +10 to its damage.\n\n**Upgrade (Level 6+):** When you take the Attack Action on your turn while wielding a Heavy weapon, you may make one additional melee attack with that weapon as part of the same Action. You can't apply this Talent's minus 5 to hit for plus 10 damage option to that additional attack."
  },
  {
    key: "sidearm-gunslinger",
    name: "Sidearm Gunslinger",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "A pistol is the one thing you never leave at home. You gain the following benefits:\n• On Sidearms you're Proficient with, you ignore the High Recoil trait, so several Sidearm shots in a round never bring Snag from recoil. And no Sidearm ever costs you a Swift Action to reload in combat.\n• A hostile Target within 1 space of you doesn't give your ranged Sidearm attack rolls Snag.\n• Attack with a one-handed weapon as your Action, and you can follow up with a Sidearm you're holding, attacking with it as a Swift Action.\n\n**Upgrade (Level 6+):** Once per turn when you score a critical hit with a Sidearm, you may immediately fire it at one additional Target within 6 spaces as part of the same Action."
  },
  {
    key: "street-scrapper",
    name: "Street Scrapper",
    category: "Combat & Weapon Mastery",
    requirements: "",
    text: "Bottles, chairs, a fire extinguisher off the wall: if you can lift it, you can hurt someone with it. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• Improvised weapons take your Simple Weapons Proficiency Bonus on attack rolls, and you never roll with Snag when wielding or throwing one.\n• You gain Oomph +1 (Unarmed).\n• On your turn, when your unarmed strike or improvised weapon hits a Target, you can follow up by trying to Grapple it as a Swift Action.\n\n**Upgrade (Level 6+):** Your Oomph from this Talent becomes +2 (Unarmed), and you deal an additional 1d4 damage with improvised weapons. You also gain Resistance to Slashing, Bludgeoning, and Piercing damage from improvised weapons used against you."
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
    key: "combat-splicer",
    name: "Combat Splicer",
    category: "Tactics & Hybrid Fighting",
    requirements: "The ability to use Quick Hacks, Ciphers, or Flow Invocations.",
    text: "***Prerequisite:** The ability to use Quick Hacks, Ciphers, or Flow Invocations.* You've learned to run code and shape the Flow with a gun going off next to your ear. You gain the following benefits:\n• When you take damage while holding active Links or sustaining a Flow effect, you make the save to keep them with Edge.\n• Weapons or a physical shield in one or both hands never stop you from making the physical inputs for Quick Hacks or Invocations.\n• If an Enemy moves in a way that provokes your Opportunity Attack, you can use that Impulse Action for a Quick Hack or an Invocation aimed at it instead of a melee attack. It must be one that normally costs 1 Action and targets only that Enemy.\n\n**Upgrade (Level 6+):** You no longer need to maintain Focus or Sustain to keep your Links and Flow effects active when you take damage of 20 or less (for a Focus Check, when your biggest hit was 20 or less). Damage of 21+ still requires the relevant Saving Throw, with Edge."
  },
  {
    key: "cross-discipline-tactic",
    name: "Cross-Discipline Tactic",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "You have studied the combat methodologies of other specialists to learn their tricks. You gain the following benefits:\n• You learn one of the following class abilities of your choice, with all of its associated mechanics: a single Operator Call, a single Hustler Leverage Ability, or a single Scoundrel Gambit. You meet any internal prerequisites for the chosen ability, but you can't select abilities flagged as \"Capstone\" or \"Level 7+\" features.\n• You gain a number of resource points equal to your Caliber to fuel this ability, regained on a Short or Long Rest. If the ability uses a different resource (e.g., uses-per-rest), you instead gain one use per Short Rest.\n• The chosen ability isn't permanent: at each new level, you can trade it for another that fits the same restrictions.\n\n**Upgrade (Level 6+):** You learn a second class ability under the same rules, and your resource pool for this Talent increases by 2 points."
  },
  {
    key: "lockdown-specialist",
    name: "Lockdown Specialist",
    category: "Tactics & Hybrid Fighting",
    requirements: "",
    text: "Nobody walks past you on the way to your crew. You gain the following benefits:\n• A Target your Opportunity Attack hits stops where it stands: its Speed is 0 for the rest of the turn.\n• An Enemy leaving your reach provokes an Opportunity Attack from you even if it took the Disengage action first.\n• If an Enemy within 1 space of you attacks a Target other than you, your Impulse Action can answer with a melee weapon attack on that Enemy, unless the Target it attacked also has this Talent.\n\n**Upgrade (Level 6+):** Once per round, when an Enemy provokes an Opportunity Attack from you, you may make that attack without spending your Impulse Action. When you hit a Target with an Opportunity Attack, that Target also suffers Snag on the next attack roll it makes before the start of your next turn."
  },

  // ===== Tech & #GRID Operations =====
  {
    key: "junk-tinkerer",
    name: "Junk Tinkerer",
    category: "Tech & #GRID Operations",
    requirements: "",
    text: "You can make something useful out of a drawer of dead electronics and a roll of tape. You gain the following benefits:\n• You learn one Engineering-based Quick Hack of your choice. Tech is your governing attribute.\n• Choose one Tool Category. You're Proficient with it, and those tools can serve as a focus for your Tech-based abilities.\n• Once per Long Rest, you can spend 10 minutes scavenging available parts to construct one single-use gadget that produces an effect equivalent to a standard Cipher of your choice from a list approved by the GM (typical examples: smoke deployer, EMP charge, signal jammer, motion tripwire). The gadget must be used within 24 hours or it degrades.\n\n**Upgrade (Level 6+):** You can construct a number of single-use gadgets equal to your Caliber per Long Rest, and the gadgets you produce no longer degrade until consumed."
  },
  {
    key: "parallel-processing",
    name: "Parallel Processing",
    category: "Tech & #GRID Operations",
    requirements: "Character Level 4, Codebreaker or Sourcerer.",
    text: "Your mind is built to handle the chaotic data streams of the #GRID. You gain the following benefits:\n• You can maintain one additional active Link beyond your standard class maximum.\n• You gain Edge on Tech checks made to stabilize deteriorating Links or resist forced disconnections.\n\n**Upgrade (Level 6+):** You can maintain a second additional active Link (two beyond your class maximum total), and when one of your Links is forcibly broken, you can immediately re-establish it as an Impulse Action without paying the usual setup cost."
  },

  // ===== The Flow & Resonance =====
  {
    key: "resonance-dabbler",
    name: "Resonance Dabbler",
    category: "The Flow & Resonance",
    requirements: "",
    text: "Something you touched, a Mystech relic or a room thick with old resonance, touched you back. You gain the following benefits:\n• Increase your Tech, Mystique, or Presence score by 1, to a maximum of 20.\n• You learn one Base Resonance (its 0 FP rows: Damage and Base Effect) and one Empowered Effect (1 FP) from the Shaper class, or two basic Quick Hacks.\n• Once per Long Rest, you can activate the Empowered Effect without spending Flow Points or generating Strain. These checks use the Attribute this Talent raised.\n\n**Upgrade (Level 6+):** You learn one additional Empowered Effect (1 FP), and the free use feature now refreshes on a Short Rest."
  },
  {
    key: "resonance-weaver",
    name: "Resonance Weaver",
    category: "The Flow & Resonance",
    requirements: "Attuned to the Flow (Shaper class).",
    text: "You bend an Invocation mid-shape, the way a courier bends a route around a checkpoint. You gain the following benefits:\n• Choose two Advanced Techniques or Invocation modifications to learn (Resonance Amplification, for one).\n• You also carry 2 extra Flow Points (FP), which can go only to those modifications or to powering Advanced Techniques; a Long Rest refills them.\n\n**Upgrade (Level 6+):** You learn one additional Advanced Technique or Invocation modification, and your bonus FP pool from this Talent increases by 2."
  },

  // ===== Armor & Resilience =====
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

  // ===== Mobility & Traversal =====
  {
    key: "asphalt-rider",
    name: "Asphalt Rider",
    category: "Mobility & Traversal",
    requirements: "",
    text: "Behind the handlebars or the wheel, you're the most dangerous thing on the street. You gain the following benefits:\n• Increase your Agility or Wits score by 1, to a maximum of 20.\n• You gain Proficiency with one vehicle category of your choice.\n• While you're piloting and not Incapacitated, your melee attack rolls have Edge against an unmounted Target whenever your vehicle is physically bigger than it.\n• While you're piloting, you can redirect an attack aimed at your vehicle so that it targets your Defense instead.\n• When an effect gives your vehicle an Agility Saving Throw for half damage, a success means it takes none, and a failure means it takes only half.\n\n**Upgrade (Level 6+):** You and any vehicle you operate gain a +2 Speed bonus (for a vehicle, +2 spaces on the map; its Speed rating doesn't change). When your vehicle would be Wrecked or Disabled, once per Long Rest you can use your Impulse Action to keep it operational at 1 Integrity until the end of the Encounter."
  },
  {
    key: "breach-charger",
    name: "Breach Charger",
    category: "Mobility & Traversal",
    requirements: "",
    text: "You hit moving and you hit hard. You gain the following benefits:\n• Increase your Body score by 1, to a maximum of 20.\n• Dash as your Action, and you can spend a Swift Action on one melee weapon attack or a Shove.\n• If you covered at least 2 spaces in a straight line right before that Swift Action, it carries your momentum: a melee attack that hits gains +5 to its damage roll, and a Shove that succeeds pushes the Target up to 2 spaces away from you.\n\n**Upgrade (Level 6+):** When you Dash, you gain the ability to move through hostile Targets' spaces (but can't end your movement there), and any Target you pass through must succeed on a Body Saving Throw (DC 8 + your Body Modifier + your Caliber) or be knocked Prone."
  },

  // ===== Skills, Social & Utility =====
  /* Cold Reader was "Crowd Reader" (key crowd-reader) until 2026-10-16, renamed so it no
     longer clashes with the Codebreaker's Quick Scan exploit (formerly "Cold Read"). Saved
     records holding the old key or name are moved by TALENT_RENAMES in js/store.js. Text is
     the book's, word for word, so it drops the house phrases "You gain the following
     benefits:" and ", to a maximum of 20" that the other Talents still carry. */
  {
    key: "cold-reader",
    name: "Cold Reader",
    category: "Skills, Social & Utility",
    requirements: "Presence or Wits 13 or higher.",
    text: "Most Freelancers case the building. You case the people in it, instantly and ruthlessly.\n• Increase your Presence or Wits score by 1.\n• When an Encounter that includes negotiation, deception, or social pressure begins, you may roll an Insight or Intuition check using Presence or Wits (DC 12). On a success, you immediately learn one piece of useful information about one Target of your choice: their highest non-physical Attribute, their most pressing emotional state (Fear, Greed, Anger, etc.), or whether they are armed or augmented.\n• You gain Edge on Initiative checks made during social Encounters, and you can use your Presence Modifier in place of Wits for Initiative in such Encounters.\n\n**Upgrade (Level 6+):** You learn two pieces of useful information instead of one, and your insight applies to all hostile Targets in the social Encounter rather than just one."
  },
  {
    key: "crew-commander",
    name: "Crew Commander",
    category: "Skills, Social & Utility",
    requirements: "Presence 13 or higher.",
    text: "You're the one who says the thing everyone needed to hear before the job starts. You gain the following benefits:\n• Increase your Presence score by 1, to a maximum of 20.\n• Take 10 minutes of Downtime or a Short Rest to get the crew's heads straight. Up to six friendly Characters within 6 spaces, you included if you like, each gain Vigor equal to your Character level + your Presence Modifier, as long as they can see or hear you and understand you. Once a Character has had this Vigor, they can't have it again until they finish a Short Rest or Long Rest.\n\n**Upgrade (Level 6+):** When you use Crew Commander, the affected Characters also gain Edge on their next attack roll or Saving Throw made within the next 10 minutes."
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
    text: "You can be anyone for as long as the conversation lasts, and longer if the paperwork holds. You gain the following benefits:\n• Increase your Presence score by 1, to a maximum of 20.\n• When you're trying to pass as someone else or to build a false identity, your Presence (Deception) and Presence (Performance) checks have Edge.\n• Spend at least 1 minute hearing a person speak or a Target make a mechanical sound. You can then copy that voice or sound. A listener can see through the imitation with a Wits (Intuition) check contested by your Presence (Deception).\n\n**Upgrade (Level 6+):** You can maintain a single fabricated identity that functions seamlessly in digital records (legal IDs, employment history, social profiles) without ongoing rolls. The GM may call for a check only when the identity is actively being investigated by a major faction."
  },
  {
    key: "shadow-operative",
    name: "Shadow Operative",
    category: "Skills, Social & Utility",
    requirements: "Agility 13 or higher.",
    text: "You know which shadows the cameras miss and which floor panels creak. You gain the following benefits:\n• Increase your Agility score by 1, to a maximum of 20.\n• Being only lightly obscured from a Target is enough for you to attempt to hide from it.\n• A ranged weapon attack that misses a Target you're Hidden from doesn't give away your position, and you stay Hidden.\n• Your sight-based Wits (Perception) checks take no Snag from dim light or heavy shadows.\n\n**Upgrade (Level 6+):** When you are Hidden and make an attack against a Target that hasn't acted yet in the Encounter, you gain Edge on the attack roll and the attack scores critical hits on a roll of 19 or 20."
  },
  {
    key: "trauma-medic",
    name: "Trauma Medic",
    category: "Skills, Social & Utility",
    requirements: "",
    text: "You've stitched people up in stairwells and the backs of cabs, and most of them walked out on their own. You gain the following benefits:\n• Increase your Wits or Tech score by 1, to a maximum of 20.\n• A Character you Stabilize with a Medkit, Unconscious or dying, also regains 1 Vitality.\n• With a Medkit in hand, you can spend an Action working on a Character within your melee reach, restoring Vitality equal to **2d6 + your Caliber + the modifier this Talent raised**. The same Character gets nothing more from this Talent until they finish a Short Rest or Long Rest.\n\n**Upgrade (Level 6+):** You can work as a Swift Action instead of an Action, and the healing increases to **3d6 + your Caliber + the modifier this Talent raised**. You can also end one of the following conditions on the Character as part of the same action: Poisoned, Bleeding, or Dazed."
  }
];
