window.EN = window.EN || {};
EN.classes = EN.classes || {};

// Triage Protocols as structured sub-entries, the single source for the engine, the Class-tab
// picker, and the print sheet. The Triage feature's prose (below) is composed from this list,
// so the displayed text and the machine-readable data can never drift apart.
var STITCHER_TRIAGE_PROTOCOLS = [
  { name: "Adrenaline Spike", action: "Swift Action", cost: 1, text: "Target one ally within 6 spaces. The target immediately gains Vigor equal to 1d8 + your Tech Modifier. Until the end of their next turn, their Speed increases by 2 and they ignore Difficult Terrain." },
  { name: "Chemical Purge", action: "Swift Action", cost: 1, text: "Target one ally within 6 spaces. The target may immediately end one of the following conditions: Poisoned, Bleeding, Paralyzed, or Blinded." },
  { name: "Trauma Patch", action: "Action", cost: 1, text: "Target one Character within your melee reach. The target regains lost Vitality equal to 2d8 + your Tech Modifier. If the target is currently Unconscious due to a Critical Condition or Fatigue, they immediately regain consciousness." },
  { name: "Toxic Overdose", action: "Action", cost: 1, text: "Target one enemy within 6 spaces. The target must make a Body Save (DC = 8 + your Tech Modifier + your Medical Tools Proficiency Bonus). On a failure, they take Toxic damage equal to 2d6 + your Tech Modifier and are Poisoned until the end of their next turn." },
  { name: "Sedative", action: "Action", cost: 1, text: "Target one enemy within 6 spaces. You tag them with a fast-acting tranquilizer compound. The target must make a Body Save (DC = 8 + your Tech Modifier + your Medical Tools Proficiency Bonus). On a failure, the compound floods their system and they become Drowsy. Dosing a target who is already Drowsy stacks toward unconsciousness, as described under the Drowsy condition. Outside of combat, a single dose is usually enough to drop a lone, unaware mark into true sleep, at the GM's discretion." },
  { name: "Coagulant Burst", action: "Impulse Action", cost: 1, text: "Trigger: An ally within 6 spaces takes damage or gains the Bleeding condition. You immediately reduce the incoming damage by an amount equal to your Tech Modifier + Caliber, and completely prevent the Bleeding condition from applying." },
  { name: "Failsafe", action: "Impulse Action", cost: 1, text: "Trigger: An ally within 6 spaces is reduced to 0 Vitality by damage, or takes damage while already at 0 Vitality. You flood their system with everything the Rig has the instant they start to go. They immediately gain Vigor equal to 2d8 + your Tech Modifier, and until the end of their next turn they ignore the Speed reduction from being Bloodied. As long as that Vigor holds, the hits that should be putting them down are landing on borrowed time instead." },
  { name: "Nerve Block", action: "Action", cost: 1, text: "Target one ally within 6 spaces. For the next minute, that ally gains Resistance to Bludgeoning, Piercing, and Slashing damage, but they cannot benefit from any effects that restore Vitality or Wounds. You or the affected ally can disable this Nerve Block early at any time (no action required)." },
  { name: "Triage Sweep", action: "Action", cost: 1, text: "Target up to three allies within 6 spaces. Your Rig vents a fast-dispersing cloud of aerosolized stabilizers and clotting foam across the cluster. Each target regains Vitality equal to 1d6 + your Tech Modifier." },
  { name: "Casualty Extraction", action: "Swift Action", cost: 1, text: "Target one ally within 12 spaces. A fired grapnel, a hauling winch, a barked order and a fistful of collar, you get them out of the line of fire. The ally is pulled up to 6 spaces toward you without provoking opportunity attacks, and they regain Vitality equal to your Tech Modifier + your Caliber." },
  { name: "Booster Shot", action: "Swift Action", cost: 1, text: "Target one ally within 6 spaces. You hit them with a prophylactic cocktail tuned to whatever is about to go wrong. Until the start of your next turn, the target rolls all Saving Throws with Edge." },
  { name: "Muscle Relaxant", action: "Action", cost: 1, text: "Target one enemy within 6 spaces. You tag them with a fast-acting myo-relaxant that turns coordinated movement into a fight against their own body. The target must make a Body Save (DC = 8 + your Tech Modifier + your Medical Tools Proficiency Bonus). On a failure, until the end of their next turn their Speed is halved and they roll with Snag on attack rolls." }
];
var STITCHER_TRIAGE_INTRO = "The Stitcher relies on a highly specialized piece of equipment known as a Triage Rig. This might be a cybernetic auto-injector gauntlet, an alchemical synthesizer harness, or a smart-medic backpack. The Rig rapidly mixes base reagents or standard medical supplies into potent, fast-acting chemical assets.\n\nYou must have your Triage Rig equipped to use Triage Protocols. If your Rig is lost or destroyed, you can assemble a new one during a Long Rest using standard medical and chemistry tools.\n\nYour Triage Pool: Your maximum Triage is equal to your Caliber + your Tech Modifier (minimum of 1). You regain all spent Triage at the end of a Short or Long Rest.\n\nTriage Protocols: At 1st Level you learn four Triage Protocols of your choice from the list below; you learn two more at 5th Level through Expanded Triage. Unless otherwise noted, all Triage Protocols cost 1 Triage to activate. Ranged protocols are delivered via your Rig's hardware, such as smart-darts or wireless auto-injector patches.";
var STITCHER_TRIAGE_TEXT = STITCHER_TRIAGE_INTRO + "\n" + STITCHER_TRIAGE_PROTOCOLS.map(function (p) {
  return "     " + p.name + (p.action ? " (" + p.action + ")" : "") + ": " + p.text;
}).join("\n");

EN.classes.stitcher = {
  key: "stitcher",
  name: "Stitcher",
  tagline: "Whether you are armed with trauma kits, experimental serums, or weaponized chemical sprayers, you are training to become the ultimate arbiter of who walks away from a firefight.",

  vitality: {
    text: "Resilience Die: d8\nStarting Vitality: 8 + Body Modifier\nVitality Per Level: 1d8 + Body Modifier"
  },
  resilience: {
    text: "Resilience Die: d8"
  },

  attributePriorities: [
    "1. Wits (Primary): Powers Investigation to diagnose strange ailments or analyze chemical environments.",
    "2. Tech (Secondary): Drives your Triage pool and powers your Medtech skill for stabilizing Allies, repairing cybernetics, and safely deploying complex treatments.",
    "3. Agility (Tertiary): Ensures you have the Speed required to physically reach fallen Allies quickly and the Defense to survive the sprint."
  ],

  saveFocus: "Tech and Agility",

  resource: {
    name: "Triage",
    attribute: "Tech",
    maxFormula: "Your maximum Triage is equal to your Caliber + your Tech Modifier (minimum of 1).",
    refresh: "You regain all spent Triage at the end of a Short or Long Rest.",
    fuels: "Triage fuels Triage Protocols and subclass medical or toxic burst effects. Examples already present in the draft include: Adrenaline Spike, Chemical Purge, Trauma Patch, Toxic Overdose, Neuro-Corrosive Cloud, Biological Meltdown.",
    hardware: "The Stitcher relies on a highly specialized piece of equipment known as a Triage Rig. This might be a cybernetic auto-injector gauntlet, an alchemical synthesizer harness, or a smart-medic backpack. The Rig rapidly mixes base reagents or standard medical supplies into potent, fast-acting chemical assets.\n\nYou must have your Triage Rig equipped to use Triage Protocols. If your Rig is lost or destroyed, you can assemble a new one during a Long Rest using standard medical and chemistry tools.\n\nHardware Dependency (Optional Rule)\n\nYour Triage Rig is a highly complex piece of proprietary hardware, relying on micro-synthesizers and chemical calibrators. It cannot simply be snapped together from spare bandages. If your Triage Rig is lost or destroyed, you face the following logistics to recover your abilities:\n\nThe Scrap Rig (Emergency Stopgap): During a Long Rest, you can use Medical and Engineering tools to cobble together a \"Scrap Rig\" out of standard supplies. While using a Scrap Rig, you can activate your Triage Protocols, but the unstable mixtures cause you to suffer Snag on all Triage healing rolls and attack rolls. Furthermore, any Triage Protocol that normally costs a Swift Action now costs a standard Action due to the clunky manual injection process.\n\nPurchasing a Replacement: You can purchase a factory-standard replacement Rig from corporate medical suppliers or high-end black market fixers. A replacement Rig costs 500.\n\nCrafting a Replacement: If you have access to a proper laboratory or workshop during downtime, you can build a new Rig from scratch. This requires 250 in raw chemical precursors and a successful Science or Engineering Dice Pool check. On a failure, the materials are wasted, and you must acquire more to try again.",

    abilityNoun: "Triage Protocol",
    abilityNounPlural: "Triage Protocols",
    learn: { knowsAll: false, picks: [{ level: 1, count: 4 }, { level: 5, count: 2 }] },
    abilities: STITCHER_TRIAGE_PROTOCOLS
  },

  startingProficiencies: {
    weapons: ["Simple Weapons", "Sidearms", "Dart Guns", "Chem Spewers"],
    armor: ["Light Armor", "Medium Armor"],
    shields: [],
    skills: ["Medtech", "Investigation", "choose one (Intuition, Systems, or Perception)"],
    saves: ["Tech", "Agility"],
    tools: ["Medical Tools", "choose one (Investigation Tools, Engineering Tools, Fieldcraft Tools, or Bureaucracy Tools)"]
  },

  featuresByLevel: {
    "1": [
      {
        name: "Triage",
        text: STITCHER_TRIAGE_TEXT
      },
      {
        name: "First Do No Harm",
        text: "Whenever you make an attack roll with a weapon that possesses the Light trait or a Dart Gun against an organic Target, you may use your Tech modifier instead of Agility or Body for the attack and damage rolls. Additionally, standard medical rules do not apply to you. Any time you successfully use the Stabilize medical treatment on an Unconscious Target, they awaken immediately and you may reduce their Fatigue by 1 level."
      },
      {
        name: "Stitcher Subclass",
        text: "You choose a Stitcher subclass, representing your clinical specialization. This subclass grants features at specific Stitcher levels. You gain all subclass features for which you meet the required Stitcher level, both now and as you continue to advance. You may only select one subclass."
      }
    ],
    "2": [
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements"
      },
      {
        name: "First Responder",
        text: "In a crisis, hesitation is lethal, and you have trained yourself to react the second a situation goes bad. You gain Edge on all Initiative rolls. Additionally, your base movement Speed increases by 2, allowing you to rapidly navigate the battlefield and reach bleeding allies before the enemy can follow up."
      }
    ],
    "3": [
      {
        name: "Subclass Feature",
        text: "You gain a feature granted by your Stitcher subclass at 3rd Level."
      }
    ],
    "4": [
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements"
      }
    ],
    "5": [
      {
        name: "The Good Stuff",
        text: "Your chemical compounds become vastly more efficient. Whenever you roll dice to restore Vitality or Vigor to an ally, you may roll the healing dice twice and use either total."
      },
      {
        name: "Expanded Triage",
        text: "You learn two additional Triage Protocols from the core list."
      }
    ],
    "6": [
      {
        name: "Preventative Care",
        text: "Sometimes the best medicine is preemptive violence. Once per round, when you use your Action to activate a Triage Protocol that restores Vitality or grants Vigor to an ally, you may immediately use your Swift Action to make a single standard attack with a Sidearm or Dart Gun. If this attack hits, the target suffers Snag on the next attack roll they make against the ally you just healed."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements"
      }
    ],
    "7": [
      {
        name: "Subclass Feature",
        text: "You gain a feature granted by your Stitcher subclass at 7th Level."
      }
    ],
    "8": [
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements"
      }
    ],
    "9": [
      {
        name: "The Golden Hour",
        text: "You refuse to let anyone die on your watch, operating with flawless clarity when the timer is running out. Whenever an ally within 12 spaces falls Unconscious or suffers a Critical Condition from a hostile source, your adrenaline spikes. You immediately regain 1 spent Triage (this cannot exceed your maximum). Furthermore, any Triage Protocols you use on an Unconscious ally or an ally with a Critical Condition automatically roll the maximum possible result on their healing dice."
      }
    ],
    "10": [
      {
        name: "Subclass Capstone",
        text: "You gain the capstone feature granted by your Stitcher subclass at 10th Level."
      }
    ]
  },

  progressionTable: [
    { level: 1, caliber: 1, features: ["Triage", "First Do No Harm", "Stitcher Subclass"], resource: 0 },
    { level: 2, caliber: 1, features: ["First Responder", "Universal Upgrade"], resource: 0 },
    { level: 3, caliber: 2, features: ["Subclass Feature"], resource: "+5 Points" },
    { level: 4, caliber: 2, features: ["Universal Upgrade"], resource: 0 },
    { level: 5, caliber: 3, features: ["The Good Stuff", "Expanded Triage"], resource: 0 },
    { level: 6, caliber: 3, features: ["Preventative Care", "Universal Upgrade"], resource: "+5 Points" },
    { level: 7, caliber: 4, features: ["Subclass Feature"], resource: 0 },
    { level: 8, caliber: 4, features: ["Universal Upgrade"], resource: 0 },
    { level: 9, caliber: 5, features: ["The Golden Hour"], resource: 0 },
    { level: 10, caliber: 5, features: ["Subclass Capstone"], resource: "+5 Points" }
  ],

  subclasses: [
    {
      key: "the_lifeline",
      name: "The Lifeline",
      description: "You are the absolute white knight of the gutter. You specialize in pure trauma care, prioritizing stabilization, defensive shielding, and keeping the squad breathing no matter the cost. When a firefight turns into a total slaughter, your unparalleled medical expertise is the only reason anyone walks away.",
      features: [
        {
          level: 1,
          name: "Field Triage",
          text: "You gain the following benefits:\n\n• **Ranged Care:** When you use the Trauma Patch Triage Protocol, its range increases from melee reach to 6 spaces.\n• **Trauma Buffer:** Whenever you grant an ally Vigor, they gain an extra amount of Vigor equal to your Caliber.\n• **Forensic Pathology:** Out of combat, spend 10 minutes examining a biological subject (living or dead) to determine the exact cause and time of death, identify any toxins or diseases in their system, and assess their physical limitations or hidden injuries (making Medtech or Science Dice Pool checks if the GM rules the information is deliberately obfuscated)."
        },
        {
          level: 3,
          name: "Clear!",
          text: "As an **Impulse Action** when an enemy within 3 spaces makes an attack against an ally, spend 1 Triage to fire a pair of electrode probes into them. The attacker must make a Body Save (DC = 8 + your Tech Modifier + your Medical Tools Proficiency Bonus). On a failure, they take 2d8 Electric damage and are pushed 2 spaces away from your ally, automatically causing the attack to miss if they are pushed out of melee reach."
        },
        {
          level: 7,
          name: "Resuscitation Field",
          text: "As a **Swift Action**, spend 2 Triage to deploy an aerosolized healing field in an Area 3 centered on a point you can see within 12 spaces, lasting 1 minute. When any ally ends their turn inside the field, they gain Vigor equal to 1d6 + your Tech Modifier. The field also neutralizes airborne toxins, granting allies inside immunity to the Poisoned condition."
        },
        {
          level: 10,
          name: "Mass Revival",
          text: "Once per Long Rest, as an **Action**, choose up to four allies within 12 spaces. Each regains all lost Vitality and immediately ends any of the following conditions affecting them: Bleeding, Burning, Dazed, Drowsy, Hallucinating, Paralyzed, Poisoned, Staggered, or Stunned. Any chosen ally currently at 0 Wounds (dead or dying) is revived and restored to half their maximum Wounds."
        }
      ]
    },
    {
      key: "the_toxicologist",
      name: "The Toxicologist",
      description: "Why fix a bullet wound when you can melt the gun? You view biology as a weapon, dedicating yourself to the absolute mastery of corrosive compounds, neurotoxins, and biochemical warfare. You treat the battlefield as a petri dish and the enemy as your ultimate test subjects. By intentionally bypassing the safety limiters on your equipment, you rapidly synthesize and project completely devastating, lethal compounds.",
      features: [
        {
          level: 1,
          name: "Chemical Warfare",
          text: "You gain the following benefits:\n\n• **Heavy Application:** Proficiency with the Chem Spewer and Flamethrower Heavy Weapons.\n• **Corrosive Degradation:** Whenever you deal Toxic or Acid damage to an enemy, you ignore Toxic/Acid Resistance (but not Immunity). If you inflict the Poisoned condition on an enemy, they also suffer a -2 penalty to their Damage Reduction (DR) while poisoned. This DR penalty does not stack with itself if the target is subject to multiple corrosive or poisonous effects.\n• **Chemical Breaching:** Out of combat, spend 1 minute applying corrosive gels with your Triage Rig to melt through standard locks, chains, chain-link fences, or thin metal plating, without triggering noise alarms or requiring a Dice Pool tool check."
        },
        {
          level: 3,
          name: "Contagion Catalyst",
          text: "Once per turn, when an enemy within 6 spaces fails a Save against one of your Triage Protocols or a weapon attack that deals Toxic damage, you can trigger a violent rupture dealing an additional 1d8 Toxic damage to that enemy. You may then spend Triage to spread the contagion:\n\n• **Directed Spread (1 Triage):** Choose one other enemy within 2 spaces of the primary target. It must make the same Save (type and DC) as the primary target. On a failure, it takes 1d8 Toxic damage and is Poisoned until the end of its next turn.\n• **Volatile Spread (2 Triage):** Each enemy within 1 space of the primary target must make the same Save (type and DC) as the primary target. On a failure, each takes 1d8 Toxic damage and is Poisoned until the end of its next turn."
        },
        {
          level: 7,
          name: "Neuro-Corrosive Cloud",
          text: "As an **Action**, spend 2 Triage to unleash a caustic cloud in an Area 4 centered on a point you can see within 12 spaces. The cloud heavily obscures the area and lasts 1 minute. When an enemy enters the cloud for the first time on a turn or starts its turn there, it must make a Body Save (DC = 8 + your Tech Modifier + your Medical Tools Proficiency Bonus). On a failure, it takes 3d6 Acid damage and is Blinded until the end of its next turn. Allies who enter the cloud are unaffected."
        },
        {
          level: 10,
          name: "Biological Meltdown",
          text: "Once per Long Rest, as an **Action**, force one target within 12 spaces to make a Body Save (DC = 8 + your Tech Modifier + your Medical Tools Proficiency Bonus).\n\n• **On a failure:** The target takes 8d10 Toxic damage and suffers severe necrosis. For 1 minute, it cannot regain Vitality or Wounds and takes an additional 2d10 Toxic damage at the start of each of its turns.\n• **On a success:** It takes half the initial damage and suffers no ongoing effects.\n\nIf a target dies while under this necrosis, its body bursts, dealing 4d6 Acid damage to all other enemies within 2 spaces."
        }
      ]
    },
    {
      key: "the_ripper",
      name: "The Ripper",
      description: "You are a visionary cybernetic surgeon, operating in the bleeding-edge space where flesh meets chrome. From sterile corporate clinics to blood-stained underground chop shops, you do not just heal people; you upgrade them. You treat the nervous system like hackable hardware, flawlessly tuning implants, salvaging scrap from the dead, and bypassing biological limiters to turn your crew into perfectly calibrated weapons.",
      features: [
        {
          level: 1,
          name: "Black Market Butcher",
          text: "You gain Proficiency with Engineering Tools. If you spend 10 minutes extracting tech from a defeated enemy with cybernetics or the Machine Physiology trait, you harvest Cyber-Scrap. You also harvest organic salvage from defeated biological enemies (adrenal tissue, bio-gel), which is stored and used identically to Cyber-Scrap (including for Rig Fuel and Pawn It). You can hold Cyber-Scrap up to your Tech Modifier, and use it in two ways:\n\n• **Rig Fuel:** As an **Action**, break down a piece of Cyber-Scrap into your Triage Rig to regain 1 spent Triage.\n• **Pawn It:** Sell Cyber-Scrap to fixers, merchants, or underground clinics for a modest payout (the exact \u{1D4A2} value is set by the GM based on the tier of the enemy it was harvested from)."
        },
        {
          level: 3,
          name: "Hot-Wired Implants",
          text: "Whenever you finish a Short or Long Rest, you can apply an Aftermarket Hot-Wire to a number of willing allies up to your Tech Modifier (minimum 1). An ally must possess cybernetics or the Machine Physiology trait, and the tuning must match their installed hardware (for example, you cannot perform an Optical Overclock on organic eyes). An ally can have only one Hot-Wire at a time; it stays active until you finish your next Short or Long Rest, when you must recalibrate it or it powers down. Choose from the following tunings:\n\n• **Optical Overclock** *(requires Cyber-Optics or Synthetic Vision):* They ignore the defensive penalties of partial Cover when making ranged attacks, and they gain Darkvision up to 12 spaces.\n• **Dermal Reinforcement** *(requires Subdermal Plating or Machine Chassis):* They gain a +1 bonus to Defense. The first time they take Wound damage during an encounter, the incoming damage is reduced by an amount equal to your Caliber.\n• **Pneumatic Bypass** *(requires Cyber-Limbs or Joint Servos):* Their unarmed strikes deal 1d6 Bludgeoning damage, and they gain Edge on in-combat Athletics d20 checks (or +1 Edge Die to related out-of-combat Dice Pools) to grapple, shove, or break objects.\n• **Synaptic Accelerator** *(requires a Neural Processor or Synthetic Nervous System):* Their base Speed increases by 1, and they gain a +2 bonus to Initiative.\n• **Recoil Compensator** *(requires Skeletal Bracing or Cyber-Arms):* They ignore the penalties of wielding weapons with the Heavy or Cumbersome trait, and they gain Edge on Body Saves against being knocked Prone.\n• **Adrenal Tuning** *(requires a living, organic ally; cannot be applied to a fully synthetic body such as a Clanker):* Their base Speed increases by 1, they gain a +1 bonus to Body Saves, and the first time each encounter they drop below half their maximum Vitality, they gain Vigor equal to your Caliber."
        },
        {
          level: 7,
          name: "Combat Overclock",
          text: "As a **Swift Action**, spend 2 Triage to jam an overclocking cocktail into yourself or a willing ally within your melee reach. Until the start of your next turn, the target's Speed is doubled, and whenever they take the Attack action they may make one additional attack as part of it. When the effect ends, the target gains the Drowsy condition and cannot be affected by Combat Overclock again until they finish a Short or Long Rest."
        },
        {
          level: 10,
          name: "Cyber-Rejection",
          text: "Once per Long Rest, as an **Action**, force an enemy within 12 spaces to make a Body Save (DC = 8 + your Tech Modifier + your Medical or Engineering Tools Proficiency Bonus).\n\n• **On a failure:** For 1 minute, their Speed is halved, they suffer Snag on all attack rolls and physical saving throws, and they take 4d10 Toxic damage at the start of each of their turns. They may repeat the Save at the end of each of their turns to end the effect.\n• **On a success:** They take half the initial 4d10 damage and suffer no ongoing effects."
        }
      ]
    }
  ],

  extra: {
    triageProtocols: STITCHER_TRIAGE_PROTOCOLS.map(function (p) {
      return {
        name: p.name + (p.action ? " (" + p.action + ")" : ""),
        text: p.text
      };
    }),
    aftermarketTunings: [
      {
        name: "Optical Overclock",
        requires: "Cyber-Optics or Synthetic Vision",
        text: "You recalibrate their visual sensors, stripping the safety filters. They ignore the defensive penalties of partial Cover when making ranged attacks, and they gain Darkvision up to 12 spaces."
      },
      {
        name: "Dermal Reinforcement",
        requires: "Subdermal Plating or Machine Chassis",
        text: "You overcharge the impact-absorption of their plating. They gain a +1 bonus to their Defense rating. Additionally, the first time they take Wound damage during an encounter, the plating hardens, reducing the incoming damage by an amount equal to your Caliber."
      },
      {
        name: "Pneumatic Bypass",
        requires: "Cyber-Limbs or Joint Servos",
        text: "You remove the limiters on their synthetic muscles. Their unarmed strikes deal 1d6 Bludgeoning damage, and they gain Edge on in-combat Athletics d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools) made to grapple, shove, or break physical objects."
      },
      {
        name: "Synaptic Accelerator",
        requires: "a Neural Processor or Synthetic Nervous System",
        text: "You splice a direct override into their reflex pathways. Their base Speed increases by 1, and they gain a +2 bonus to Initiative rolls as their hardware twitches with preemptive adrenaline."
      },
      {
        name: "Recoil Compensator",
        requires: "Skeletal Bracing or Cyber-Arms",
        text: "You tune their internal shock absorbers to handle massive kinetic kickback. They ignore the mechanical penalties of wielding weapons with the Heavy or Cumbersome traits, and they gain Edge on Body Saves against being knocked Prone."
      },
      {
        name: "Adrenal Tuning",
        requires: "a living, organic ally; cannot be applied to a fully synthetic body such as a Clanker",
        text: "With no hardware to tune, you go to work on the body itself, priming their endocrine and adrenal systems to run hot. Their base Speed increases by 1, they gain a +1 bonus to Body Saves, and the first time each encounter they drop below half their maximum Vitality, they immediately gain Vigor equal to your Caliber as their body floods with combat hormones."
      }
    ]
  }
};

EN.resourceRules = {
  general: "This section defines how class resources are calculated, when they refresh, how they are spent, and how to read them at a glance during play.\n\nCore Concepts\n\nClass Resource: A specialized pool of points used to activate class abilities, maneuvers, protocols, or exploits.\n\nMaximum Pool: The total number of points a Character can hold at one time.\n\nCurrent Pool: The number of points the Character currently has available to spend.\n\nRefresh: The trigger that restores spent points, usually a Short Rest, Long Rest, or a specific class feature.\n\nTemporary Points: Bonus resource points granted by an effect that can exceed the normal maximum for a limited time.\n\nCaliber: A core scaling value tied to class level that determines resource growth and many class feature effects.\n\nCaliber\n\nMany class resources scale from Caliber rather than directly from level. Use the following progression.\n\nClass Level / Caliber:\n1 to 2 = 1\n3 to 4 = 2\n5 to 6 = 3\n7 to 8 = 4\n9 to 10 = 5\n\nThis progression is already used throughout the class feature tables and resource formulas in the current draft.",

  maximumPool: "A class resource's maximum pool is determined by the formula listed in that class entry. Unless a rule says otherwise, a resource pool cannot exceed its maximum.",

  minimumPool: "If a formula would give a class resource a value lower than 1, that pool becomes 1 instead.",

  spending: "When a class feature, maneuver, protocol, or exploit lists a cost, reduce your current pool by that amount immediately. If you do not have enough points remaining, you cannot activate that ability.",

  refreshing: "Unless a class feature says otherwise, class resources refresh at the end of a Short Rest or Long Rest.",

  temporary: "Some effects grant temporary resource points. Temporary points can exceed your normal maximum only if the effect explicitly says so. If not spent by the listed expiration point, they are lost. The current Hustler material already uses this model for temporary Leverage.",

  multiplePools: "If a Character somehow gains access to more than one class resource, track each pool separately. They never combine unless a rule explicitly says they do.",

  byClass: {
    leverage: "Hustler: Leverage\n\nThe Hustler's resource is Leverage. It represents tactical callouts, psychological pressure, social manipulation under fire, black-market timing, and split-second exploitation of weakness. The Hustler section already defines Leverage this way and ties it directly to Charm and Caliber.\n\nLeverage Pool\nMaximum Leverage = Caliber + Charm Modifier (minimum 1)\n\nRefresh\nYou regain all spent Leverage at the end of a Short Rest or Long Rest.\n\nWhat Leverage Fuels\nLeverage fuels Leverage Abilities and subclass features that weaponize timing, pressure, or team coordination.\n\nExamples already present in the draft include:\nPressure Play, Asset Reallocation, Mandatory Overtime, The Fix Is In, Off-the-Books Asset\n\nExample\nA Level 5 Hustler has Caliber 3 and Charm 18 for a +4 Charm Modifier. Their maximum Leverage is 7.\n\nLeverage Recovery Features\nSome Hustler features restore Leverage during play. For example, Return on Investment (ROI) restores 1 spent Leverage when you or an Ally within 6 spaces rolls a Critical Success on a d20 roll, and Corner the Market can grant temporary Leverage at the start of an Encounter.",

    overdrive: "Fury: Overdrive\n\nThe Fury's resource is Overdrive. It represents bursts of adrenaline, cybernetic overextension, pain-fueled aggression, and physical force pushed beyond ordinary limits. The Fury entry already defines Overdrive as its core power resource.\n\nOverdrive Pool\nMaximum Overdrive = Caliber + Body Modifier (minimum 1)\n\nRefresh\nYou regain all spent Overdrive at the end of a Short Rest or Long Rest.\n\nWhat Overdrive Fuels\nOverdrive fuels Overdrive Maneuvers and subclass states that let a Fury dominate physical space.\n\nExamples already present in the draft include:\nWrecking Ball, Clear the Path, Linebreaker, Seismic Stomp, Cross-Block, Thresher Stance\n\nExample\nA Level 7 Fury has Caliber 4 and Body 18 for a +4 Body Modifier. Their maximum Overdrive is 8.\n\nOverdrive Recovery Features\nSome Fury features restore Overdrive during combat. Adrenaline Engine restores 1 spent Overdrive on a Critical Success with an attack roll, or once per round when you suffer Wound damage from a hostile attack.",

    execution: "Operator: Execution\n\nThe Operator's resource is Execution, often abbreviated EX. They represent battlefield discipline, command timing, squad coordination, and the tactical precision required to control the pace of a firefight. The Operator entry already defines this pool under Execution.\n\nExecution Pool\nMaximum Execution = Caliber + Wits Modifier (minimum 1)\n\nRefresh\nYou regain all spent Execution at the end of a Short Rest or Long Rest.\n\nWhat Execution Fuels\nExecution fuel Tactical Maneuvers and subclass precision attacks.\n\nExamples already present in the draft include:\nSuppressing Fire, Reposition, Focus Fire, Pin Down, Covering Fire\n\nExample\nA Level 3 Operator has Caliber 2 and Wits 16 for a +3 Wits Modifier. Their maximum Execution is 5.\n\nExecution Recovery Features\nSome Operator features restore Execution during play. Breacher's Momentum restores 1 Execution when you reduce an Enemy to 0 Vitality or score a critical hit, and Rallying Cry restores 2 Execution when you roll Initiative while empty.",

    triage: "Stitcher: Triage\n\nThe Stitcher's resource is Triage. It represents the calibrated chemical output, medical synthesis capacity, and emergency support bandwidth of the Stitcher's Triage Rig. The Stitcher section already defines both the rig dependency and the Triage pool formula.\n\nTriage Pool\nMaximum Triage = Caliber + Tech Modifier (minimum 1)\n\nRefresh\nYou regain all spent Triage at the end of a Short Rest or Long Rest.\n\nHardware Requirement\nYou must have your Triage Rig equipped to use Triage Protocols. If the rig is lost or destroyed, you must replace or rebuild it before regaining full function. The draft already outlines normal replacement, scrap-rig fallback, and crafting options.\n\nWhat Triage Fuels\nTriage fuels Triage Protocols and subclass medical or toxic burst effects.\n\nExamples already present in the draft include:\nAdrenaline Spike, Chemical Purge, Trauma Patch, Toxic Overdose, Neuro-Corrosive Cloud, Biological Meltdown\n\nExample\nA Level 1 Stitcher has Caliber 1 and Tech 17 for a +3 Tech Modifier. Their maximum Triage is 4.\n\nTriage Recovery Features\nSome Stitcher features restore Triage mid-Encounter or between scenes. The Golden Hour restores 1 spent Triage when an Ally within 12 spaces falls Unconscious or suffers a Critical Condition from a hostile source, and the Ripper subclass can convert harvested Cyber-Scrap into Triage through Rig Fuel.",

    bandwidth: "Codebreaker: Bandwidth\n\nThe Codebreaker's resource is Bandwidth. It represents cognitive throughput, neural overclocking, Smartdeck strain tolerance, and the ability to force the #GRID to obey your will. The Codebreaker entry already defines this pool and its uses.\n\nBandwidth Pool\nMaximum Bandwidth = Caliber + Tech Modifier (minimum 1)\n\nRefresh\nYou regain all spent Bandwidth at the end of a Short Rest or Long Rest.\n\nWhat Bandwidth Fuels\nBandwidth fuels #GRID Exploits and subclass-specific digital escalation.\n\nExamples already present in the draft include:\nFlash Breach, Overclock Cipher, Spoof IC, Rigger drone support features and other subclass interactions that rely on Bandwidth-backed #GRID control.\n\nExample\nA Level 9 Codebreaker has Caliber 5 and Tech 20 for a +5 Tech Modifier. Their maximum Bandwidth is 10.\n\nBandwidth Recovery Features\nSome Codebreaker features restore Bandwidth in play. #GRID Initiative restores 2 Bandwidth when you roll Initiative while empty."
  },

  budgetByLevel: "Resource Summary Table\n\nClass / Resource / Formula / Refresh / Key Attribute\nHustler / Leverage / Caliber + Charm Modifier / Short Rest or Long Rest / Charm\nFury / Overdrive / Caliber + Body Modifier / Short Rest or Long Rest / Body\nOperator / Execution / Caliber + Wits Modifier / Short Rest or Long Rest / Wits\nStitcher / Triage / Caliber + Tech Modifier / Short Rest or Long Rest / Tech\nCodebreaker / Bandwidth / Caliber + Tech Modifier / Short Rest or Long Rest / Tech\nScoundrel / Moxie / Caliber + Agility Modifier / (Agility)\n\nThis table consolidates the standard pools already defined across the draft. The Shaper sits apart: Flow Points scale as (Caliber x 3) + Flow Modifier and refill on their own schedule, covered under The Flow.\n\nResource Budget by Level\n\nThe following table shows the base class resource maximum before Attribute modifiers are applied.\n\nClass Level / Caliber / Base Pool Before Attribute Modifier:\n1 / 1 / 1\n2 / 1 / 1\n3 / 2 / 2\n4 / 2 / 2\n5 / 3 / 3\n6 / 3 / 3\n7 / 4 / 4\n8 / 4 / 4\n9 / 5 / 5\n10 / 5 / 5\n\nA Character's actual pool is this base value plus the class's listed key Attribute modifier, to a minimum of 1.\n\nExamples in Play\n\nA Hustler with Charm +4 at Level 5 has 7 Leverage. That is enough to open a fight with Asset Reallocation, still hold back fuel for Mandatory Overtime, and potentially refill later through ROI if the team starts critting.\n\nA Fury with Body +5 at Level 7 has 9 Overdrive. That budget supports multiple maneuvers in one Encounter and still leaves room for a 2-point commitment like Thresher Stance.\n\nAn Operator with Wits +3 at Level 3 has 5 Execution. That gives enough room to issue movement, mark a Target with Focus Fire, protect an Ally with Brace for Impact, and still pressure the room before resting.\n\nA Stitcher with Tech +4 at Level 5 has 7 Triage. That budget supports several healing or control Protocols in one fight, with The Golden Hour and subclass fuel loops helping stretch the pool.\n\nA Codebreaker with Tech +4 at Level 6 has 7 Bandwidth. That allows repeated overclocks, swift breach setups, and defensive spoofing against hostile digital retaliation before the pool runs dry.\n\nGM Guidance\n\nClass resources are not optional decoration. They are the pacing engine for these classes.\n\nA class with its resource pool available is operating at full tactical identity. A class that has burned through its pool should still be functional, but it should feel meaningfully less explosive, less flexible, or less able to force momentum. Let rests matter. Let refill features matter. Do not casually strip a Character of access to their resource-defining gear, such as a Triage Rig or Smartdeck, unless the scene is built around that loss and provides a path to recover from it."
};
