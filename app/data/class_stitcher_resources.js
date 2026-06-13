window.EN = window.EN || {};
EN.classes = EN.classes || {};
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
    hardware: "The Stitcher relies on a highly specialized piece of equipment known as a Triage Rig. This might be a cybernetic auto-injector gauntlet, an alchemical synthesizer harness, or a smart-medic backpack. The Rig rapidly mixes base reagents or standard medical supplies into potent, fast-acting chemical assets.\n\nYou must have your Triage Rig equipped to use Triage Protocols. If your Rig is lost or destroyed, you can assemble a new one during a Long Rest using standard medical and chemistry tools.\n\nHardware Dependency (Optional Rule)\n\nYour Triage Rig is a highly complex piece of proprietary hardware, relying on micro-synthesizers and chemical calibrators. It cannot simply be snapped together from spare bandages. If your Triage Rig is lost or destroyed, you face the following logistics to recover your abilities:\n\nThe Scrap Rig (Emergency Stopgap): During a Long Rest, you can use Medical and Engineering tools to cobble together a \"Scrap Rig\" out of standard supplies. While using a Scrap Rig, you can activate your Triage Protocols, but the unstable mixtures cause you to suffer Snag on all Triage healing rolls and attack rolls. Furthermore, any Triage Protocol that normally costs a Swift Action now costs a standard Action due to the clunky manual injection process.\n\nPurchasing a Replacement: You can purchase a factory-standard replacement Rig from corporate medical suppliers or high-end black market fixers. A replacement Rig costs 500.\n\nCrafting a Replacement: If you have access to a proper laboratory or workshop during downtime, you can build a new Rig from scratch. This requires 250 in raw chemical precursors and a successful Science or Engineering Dice Pool check. On a failure, the materials are wasted, and you must acquire more to try again."
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
        text: "The Stitcher relies on a highly specialized piece of equipment known as a Triage Rig. This might be a cybernetic auto-injector gauntlet, an alchemical synthesizer harness, or a smart-medic backpack. The Rig rapidly mixes base reagents or standard medical supplies into potent, fast-acting chemical assets.\n\nYou must have your Triage Rig equipped to use Triage Protocols. If your Rig is lost or destroyed, you can assemble a new one during a Long Rest using standard medical and chemistry tools.\n\nHardware Dependency (Optional Rule)\n\nYour Triage Rig is a highly complex piece of proprietary hardware, relying on micro-synthesizers and chemical calibrators. It cannot simply be snapped together from spare bandages. If your Triage Rig is lost or destroyed, you face the following logistics to recover your abilities:\n\nThe Scrap Rig (Emergency Stopgap): During a Long Rest, you can use Medical and Engineering tools to cobble together a \"Scrap Rig\" out of standard supplies. While using a Scrap Rig, you can activate your Triage Protocols, but the unstable mixtures cause you to suffer Snag on all Triage healing rolls and attack rolls. Furthermore, any Triage Protocol that normally costs a Swift Action now costs a standard Action due to the clunky manual injection process.\n\nPurchasing a Replacement: You can purchase a factory-standard replacement Rig from corporate medical suppliers or high-end black market fixers. A replacement Rig costs 500.\n\nCrafting a Replacement: If you have access to a proper laboratory or workshop during downtime, you can build a new Rig from scratch. This requires 250 in raw chemical precursors and a successful Science or Engineering Dice Pool check. On a failure, the materials are wasted, and you must acquire more to try again.\n\nYour Triage Pool: Your maximum Triage is equal to your Caliber + your Tech Modifier (minimum of 1). You regain all spent Triage at the end of a Short or Long Rest.\n\nTriage Protocols: At 1st Level, you learn two Triage Protocols. You learn two additional Protocols at 5th Level.\n\nUnless otherwise noted, all Triage Protocols cost 1 Triage to activate. Ranged protocols are delivered via your Rig's hardware, such as smart-darts or wireless auto-injector patches."
      },
      {
        name: "First Do No Harm",
        text: "Whenever you make an attack roll with a weapon that possesses the Light trait or a Dart Gun against an organic Target, you may use your Wits modifier instead of Agility or Body for the attack and damage rolls. Additionally, standard medical rules do not apply to you. Any time you successfully use the Stabilize medical treatment on an Unconscious Target, they awaken immediately and you may reduce their Fatigue by 1 level."
      },
      {
        name: "Stitcher Subclass",
        text: "You choose a Stitcher subclass, representing your clinical specialization. This subclass grants features at specific Stitcher levels. You gain all subclass features for which you meet the required Stitcher level, both now and as you continue to advance. You may only select one subclass."
      }
    ],
    "2": [
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements"
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
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements"
      }
    ],
    "5": [
      {
        name: "The Good Stuff",
        text: "Your chemical compounds become vastly more efficient. Whenever you roll dice to restore Vitality or Vigor to an ally, you may roll the healing dice twice and use either total."
      },
      {
        name: "Expanded Triage Protocols",
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
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements"
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
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements"
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
    { level: 2, caliber: 2, features: ["First Responder", "Universal Upgrade"], resource: "+5 Points" },
    { level: 3, caliber: 3, features: ["Subclass Feature"], resource: 0 },
    { level: 4, caliber: 4, features: ["Universal Upgrade"], resource: "+5 Points" },
    { level: 5, caliber: 5, features: ["The Good Stuff", "Expanded Triage"], resource: 0 },
    { level: 6, caliber: null, features: ["Preventative Care", "Universal Upgrade"], resource: "+5 Points" },
    { level: 7, caliber: null, features: ["Subclass Feature"], resource: 0 },
    { level: 8, caliber: null, features: ["Universal Upgrade"], resource: 0 },
    { level: 9, caliber: null, features: ["The Golden Hour"], resource: 0 },
    { level: 10, caliber: null, features: ["Subclass Capstone"], resource: 0 }
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
          text: "Your medical efficiency is unmatched, both in the crossfire and the aftermath. You gain the following benefits:\n\nRanged Care: When you use the Trauma Patch Triage Protocol, its range increases from melee reach to 6 spaces, allowing you to deploy healing micro-drones or localized stim-injections from a distance.\n\nTrauma Buffer: Whenever you grant an ally Vigor, they gain an extra amount of Vigor equal to your Caliber.\n\nForensic Pathology: Outside of combat, you can spend 10 minutes examining a biological subject (living or dead). You instantly determine the exact cause and time of death, identify any toxins or diseases present in their system, and perfectly assess their current physical limitations or hidden injuries (making Medtech or Science Dice Pool checks if the GM determines the information is deliberately obfuscated)."
        },
        {
          level: 3,
          name: "Clear!",
          text: "You can weaponize your resuscitation gear to punish anyone trying to finish off your team. When an enemy within 6 spaces makes a melee attack against an ally, you can use your Impulse Action and spend 1 Triage to violently discharge a shock remote. The attacker must make a Body Save (DC = 8 + your Wits Modifier + your Medical Tools Proficiency Bonus). On a failure, they take 2d8 Electric damage and are violently pushed 2 spaces away from your ally, automatically causing the attack to miss if they are pushed out of melee reach."
        },
        {
          level: 7,
          name: "Resuscitation Field",
          text: "As a Swift Action, you can spend 2 Triage to deploy a localized, aerosolized healing field in an Area 3 centered on a point you can see within 12 spaces. The field lasts for 1 minute. When any ally ends their turn inside the field, they immediately gain Vigor equal to 1d6 + your Wits Modifier. The field also neutralizes airborne toxins, granting allies inside it immunity to the Poisoned condition."
        },
        {
          level: 10,
          name: "Mass Revival",
          text: "You can drag an entire squad back from the brink of death simultaneously. Once per Long Rest, as an Action, you trigger a massive, cascading burst of emergency medical nanites. Choose up to four allies within 12 spaces. Each chosen ally regains all lost Vitality and immediately ends any of the following conditions currently affecting them: Bleeding, Burning, Dazed, Drowsy, Hallucinating, Paralyzed, Poisoned, Staggered, or Stunned. If any of the chosen allies are currently at 0 Wounds (dead or dying), they are instantly revived and restored to half of their maximum Wounds."
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
          text: "You have refined the art of weaponized chemistry for both combat and infiltration. You gain the following benefits:\n\nHeavy Application: You gain Proficiency with the Chem Spewer and Flamethrower Heavy Weapons.\n\nCorrosive Degradation: Whenever you deal Toxic or Acid damage to an enemy, you ignore Toxic/Acid Resistance (but not Immunity). If you successfully inflict the Poisoned condition on an enemy, they also suffer a -2 penalty to their Damage Reduction (DR) for as long as they remain poisoned, as your chemicals eat away at their gear. This Damage Reduction (DR) penalty does not stack with itself if the target is subjected to multiple corrosive or poisonous effects.\n\nChemical Breaching: Outside of combat, you can use your Triage Rig to silently bypass physical security. If you spend 1 minute applying concentrated corrosive gels, you can automatically melt through standard locks, chains, chain-link fences, or thin metal plating without triggering noise alarms or requiring a Dice Pool tool check."
        },
        {
          level: 3,
          name: "Contagion Catalyst",
          text: "You ensure your plagues spread with ruthless efficiency. When an enemy within 6 spaces fails a Save against one of your Triage Protocols or a weapon attack that deals Toxic damage, you can use your Impulse Action to trigger a violent rupture. The primary target takes an additional 1d8 Toxic damage. You then choose one of the following spread effects:\n\nDirected Spread (Cost: 1 Triage):\nChoose one other enemy within 2 spaces of the primary target. That enemy must make the same Save (type and DC) as the primary target. On a failure, they take 1d8 Toxic damage and are Poisoned until the end of their next turn.\n\nVolatile Spread (Cost: 2 Triage):\nEach enemy within 1 space of the primary target must make the same Save (type and DC) as the primary target. On a failure, they take 1d8 Toxic damage and are Poisoned until the end of their next turn."
        },
        {
          level: 7,
          name: "Neuro-Corrosive Cloud",
          text: "You can flood the zone with debilitating agents. As an Action, you can spend 2 Triage to unleash a thick, caustic cloud in an Area 4 centered on a point you can see within 12 spaces. The cloud heavily obscures the area and lasts for 1 minute. When an enemy enters the cloud for the first time on a turn or starts their turn there, they must make a Body Save (DC = 8 + your Wits Modifier + your Medical or Chemistry Tools Proficiency Bonus). On a failure, they take 3d6 Acid damage and gain the Blinded condition until the end of their next turn. Allies who enter the cloud are unaffected, as you have already inoculated them against the specific strain."
        },
        {
          level: 10,
          name: "Biological Meltdown",
          text: "You can inject a target with a hyper-accelerated necrosis agent that violently breaks down their cellular structure. Once per Long Rest, as an Action, you force one Target within 12 spaces to make a Body Save (DC = 8 + your Wits Modifier + your Medical or Chemistry Tools Proficiency Bonus).\n\nOn a failure: The Target takes 8d10 Toxic damage and is inflicted with severe necrosis. For the next minute, the Target cannot regain Vitality or Wounds, and they take an additional 2d10 Toxic damage at the start of each of their turns.\n\nOn a success: They take half of the initial damage and suffer no ongoing effects.\n\nIf a Target dies while under the effect of this necrosis, their body violently bursts in a shower of acid, dealing 4d6 Acid damage to all other enemies within 2 spaces of them."
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
          text: "You seamlessly bridge the gap between organic medicine and cybernetic maintenance. You gain Proficiency with Engineering Tools.\n\nYou have a gruesome eye for aftermarket value. If you spend 10 minutes extracting tech from a defeated enemy who possesses cybernetics or the Machine Physiology trait, you successfully harvest Cyber-Scrap. You can hold a maximum amount of Cyber-Scrap equal to your Wits Modifier. You can utilize this scrap in two ways:\n\nRig Fuel: As an Action, you can break down a piece of Cyber-Scrap and feed the raw battery acid, coolants, and bio-gels into your Triage Rig, immediately regaining 1 spent Triage.\n\nPawn It: Cyber-Scrap retains black-market value. You can sell it to fixers, merchants, or underground clinics for a modest payout (the exact value is determined by the GM based on the tier of the enemy it was harvested from)."
        },
        {
          level: 3,
          name: "Hot-Wired Implants",
          text: "You specialize in the volatile connectivity between man and machine, treating your crew's hardware like a tuner treats a street-racing engine.\n\nWhenever you finish a Short or Long Rest, you can spend time tinkering with the prosthetics, neural links, or synthetic physiology of your allies. You can apply an Aftermarket Hot-Wire to a number of willing allies up to your Wits Modifier (minimum of 1).\n\nHardware Requirement: An ally must possess cybernetics or the Machine Physiology trait to receive a Hot-Wire. Furthermore, the specific tuning must correspond to their installed hardware (e.g., you cannot perform an Optical Overclock on organic eyes).\n\nAn ally can only possess one Hot-Wire at a time. Because these modifications bypass standard safety protocols, they require constant maintenance; the upgrades remain active until you finish your next Short or Long Rest, at which point you must recalibrate them or they safely power down.\n\nChoose from the following aftermarket tunings:\n\nOptical Overclock (Requires Cyber-Optics or Synthetic Vision): You recalibrate their visual sensors, stripping the safety filters. They ignore the defensive penalties of partial Cover when making ranged attacks, and they gain Darkvision up to 12 spaces.\n\nDermal Reinforcement (Requires Subdermal Plating or Machine Chassis): You overcharge the impact-absorption of their plating. They gain a +1 bonus to their Defense rating. Additionally, the first time they take Wound damage during an encounter, the plating hardens, reducing the incoming damage by an amount equal to your Caliber.\n\nPneumatic Bypass (Requires Cyber-Limbs or Joint Servos): You remove the limiters on their synthetic muscles. Their unarmed strikes deal 1d6 Bludgeoning damage, and they gain Edge on in-combat Athletics d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools) made to grapple, shove, or break physical objects.\n\nSynaptic Accelerator (Requires a Neural Processor or Synthetic Nervous System): You splice a direct override into their reflex pathways. Their base Speed increases by 1, and they gain a +2 bonus to Initiative rolls as their hardware twitches with preemptive adrenaline.\n\nRecoil Compensator (Requires Skeletal Bracing or Cyber-Arms): You tune their internal shock absorbers to handle massive kinetic kickback. They ignore the mechanical penalties of wielding weapons with the Heavy or Cumbersome traits, and they gain Edge on Body Saves against being knocked Prone."
        },
        {
          level: 7,
          name: "Hard Flatline",
          text: "You can protect a patient from massive systemic shock by temporarily shutting down their biological and mechanical core. When an ally within 6 spaces is about to take Wound damage or suffer a Critical Condition, you can use your Impulse Action and spend 2 Triage to trigger a catastrophic, split-second system crash.\n\nThe ally immediately falls Prone, drops whatever they are holding, and loses their next Swift Action as their body reboots. However, because their vitals were completely halted at the moment of impact, they take zero Wound damage from the triggering attack, and they instantly gain Vigor equal to your Caliber as the reboot kicks in."
        },
        {
          level: 10,
          name: "Cyber-Rejection",
          text: "You transmit a catastrophic virus that tells an enemy's nervous system to violently reject its own body and cybernetics. Once per Long Rest, as an Action, you force an enemy within 12 spaces to make a Body Save (DC = 8 + your Wits Modifier + your Medical or Engineering Tools Proficiency Bonus).\n\nOn a failure: Their body turns against them. For the next minute, their Speed is halved, they suffer Snag on all attack rolls and physical saving throws as their cybernetics violently glitch, and they take 4d10 Toxic damage at the start of each of their turns as their implants or nervous system burn them from the inside out. They may repeat the Save at the end of each of their turns to end the effect.\n\nOn a success: They take half of the initial 4d10 damage and suffer no ongoing effects."
        }
      ]
    }
  ],

  extra: {
    triageProtocols: [
      {
        name: "Adrenaline Spike (Swift Action)",
        text: "Target one ally within 6 spaces. The target immediately gains Vigor equal to 1d8 + your Wits Modifier. Until the end of their next turn, their Speed increases by 2 and they ignore Difficult Terrain."
      },
      {
        name: "Chemical Purge (Swift Action)",
        text: "Target one ally within 6 spaces. The target may immediately end one of the following conditions: Poisoned, Bleeding, Paralyzed, or Blinded."
      },
      {
        name: "Trauma Patch (Action)",
        text: "Target one Character within your melee reach. The target regains lost Vitality equal to 2d8 + your Wits Modifier. If the target is currently Unconscious due to a Critical Condition or Fatigue, they immediately regain consciousness."
      },
      {
        name: "Toxic Overdose (Action)",
        text: "Target one enemy within 6 spaces. The target must make a Body Save (DC = 8 + your Wits Modifier + your Medical Tools Proficiency Bonus). On a failure, they take Toxic damage equal to 2d6 + your Wits Modifier and are Poisoned until the end of their next turn."
      },
      {
        name: "Coagulant Burst (Impulse Action)",
        text: "Trigger: An ally within 6 spaces takes damage or gains the Bleeding condition. You immediately reduce the incoming damage by an amount equal to your Wits Modifier + Caliber, and completely prevent the Bleeding condition from applying."
      },
      {
        name: "Nerve Block (Action)",
        text: "Target one ally within 6 spaces. For the next minute, that ally gains Resistance to Bludgeoning, Piercing, and Slashing damage, but they cannot benefit from any effects that restore Vitality or Wounds. You or the affected ally can disable this Nerve Block early at any time (no action required)."
      }
    ],
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

    overdrive: "Fury: Overdrive\n\nThe Fury's resource is Overdrive. It represents bursts of adrenaline, cybernetic overextension, pain-fueled aggression, and physical force pushed beyond ordinary limits. The Fury entry already defines Overdrive as its core power resource.\n\nOverdrive Pool\nMaximum Overdrive = Caliber + Body Modifier (minimum 1)\n\nRefresh\nYou regain all spent Overdrive at the end of a Short Rest or Long Rest.\n\nWhat Overdrive Fuels\nOverdrive fuels Overdrive Maneuvers and subclass states that let a Fury dominate physical space.\n\nExamples already present in the draft include:\nShatterstrike, Clear the Path, Linebreaker, Seismic Stomp, Cross-Block, Thresher Stance\n\nExample\nA Level 7 Fury has Caliber 4 and Body 18 for a +4 Body Modifier. Their maximum Overdrive is 8.\n\nOverdrive Recovery Features\nSome Fury features restore Overdrive during combat. Adrenaline Engine restores 1 spent Overdrive on a Critical Success with an attack roll, or once per round when you suffer Wound damage from a hostile attack.",

    execution: "Operator: Execution\n\nThe Operator's resource is Execution, often abbreviated EX. They represent battlefield discipline, command timing, squad coordination, and the tactical precision required to control the pace of a firefight. The Operator entry already defines this pool under Battlefield Command.\n\nExecution Pool\nMaximum Execution = Caliber + Wits Modifier (minimum 1)\n\nRefresh\nYou regain all spent Execution at the end of a Short Rest or Long Rest.\n\nWhat Execution Fuels\nExecution fuel Tactical Maneuvers and subclass precision attacks.\n\nExamples already present in the draft include:\nReposition, Focus Fire, Brace for Impact, Intercepting Guard, CQC Takedown\n\nExample\nA Level 3 Operator has Caliber 2 and Wits 16 for a +3 Wits Modifier. Their maximum Execution is 5.\n\nExecution Recovery Features\nSome Operator features restore Execution during play. Breacher's Momentum restores 1 Execution when you reduce an Enemy to 0 Vitality or score a critical hit, and Rallying Cry restores 2 Execution when you roll Initiative while empty.",

    triage: "Stitcher: Triage\n\nThe Stitcher's resource is Triage. It represents the calibrated chemical output, medical synthesis capacity, and emergency support bandwidth of the Stitcher's Triage Rig. The Stitcher section already defines both the rig dependency and the Triage pool formula.\n\nTriage Pool\nMaximum Triage = Caliber + Tech Modifier (minimum 1)\n\nRefresh\nYou regain all spent Triage at the end of a Short Rest or Long Rest.\n\nHardware Requirement\nYou must have your Triage Rig equipped to use Triage Protocols. If the rig is lost or destroyed, you must replace or rebuild it before regaining full function. The draft already outlines normal replacement, scrap-rig fallback, and crafting options.\n\nWhat Triage Fuels\nTriage fuels Triage Protocols and subclass medical or toxic burst effects.\n\nExamples already present in the draft include:\nAdrenaline Spike, Chemical Purge, Trauma Patch, Toxic Overdose, Neuro-Corrosive Cloud, Biological Meltdown\n\nExample\nA Level 1 Stitcher has Caliber 1 and Tech 17 for a +3 Tech Modifier. Their maximum Triage is 4.\n\nTriage Recovery Features\nSome Stitcher features restore Triage mid-Encounter or between scenes. The Golden Hour restores 1 spent Triage when an Ally within 12 spaces falls Unconscious or suffers a Critical Condition from a hostile source, and the Ripper subclass can convert harvested Cyber-Scrap into Triage through Rig Fuel.",

    bandwidth: "Codebreaker: Bandwidth\n\nThe Codebreaker's resource is Bandwidth. It represents cognitive throughput, neural overclocking, Smartdeck strain tolerance, and the ability to force the #GRID to obey your will. The Codebreaker entry already defines this pool and its uses.\n\nBandwidth Pool\nMaximum Bandwidth = Caliber + Tech Modifier (minimum 1)\n\nRefresh\nYou regain all spent Bandwidth at the end of a Short Rest or Long Rest.\n\nWhat Bandwidth Fuels\nBandwidth fuels #GRID Exploits and subclass-specific digital escalation.\n\nExamples already present in the draft include:\nFlash Breach, Overclock Cipher, Spoof IC, Rigger drone support features and other subclass interactions that rely on Bandwidth-backed #GRID control.\n\nExample\nA Level 9 Codebreaker has Caliber 5 and Tech 20 for a +5 Tech Modifier. Their maximum Bandwidth is 10.\n\nBandwidth Recovery Features\nSome Codebreaker features restore Bandwidth in play. #GRID Initiative restores 2 Bandwidth when you roll Initiative while empty."
  },

  budgetByLevel: "Resource Summary Table\n\nClass / Resource / Formula / Refresh / Key Attribute\nHustler / Leverage / Caliber + Charm Modifier / Short Rest or Long Rest / Charm\nFury / Overdrive / Caliber + Body Modifier / Short Rest or Long Rest / Body\nOperator / Execution / Caliber + Wits Modifier / Short Rest or Long Rest / Wits\nStitcher / Triage / Caliber + Tech Modifier / Short Rest or Long Rest / Tech\nCodebreaker / Bandwidth / Caliber + Tech Modifier / Short Rest or Long Rest / Tech\nScoundrel / Moxie / Caliber + Agility Modifier / (Agility)\n\nThis table consolidates the standard pools already defined across the draft. The Shaper sits apart: Flow Points scale as (Caliber x 3) + Flow Modifier and refill on their own schedule, covered under The Flow.\n\nResource Budget by Level\n\nThe following table shows the base class resource maximum before Attribute modifiers are applied.\n\nClass Level / Caliber / Base Pool Before Attribute Modifier:\n1 / 1 / 1\n2 / 1 / 1\n3 / 2 / 2\n4 / 2 / 2\n5 / 3 / 3\n6 / 3 / 3\n7 / 4 / 4\n8 / 4 / 4\n9 / 5 / 5\n10 / 5 / 5\n\nA Character's actual pool is this base value plus the class's listed key Attribute modifier, to a minimum of 1.\n\nExamples in Play\n\nA Hustler with Charm +4 at Level 5 has 7 Leverage. That is enough to open a fight with Asset Reallocation, still hold back fuel for Mandatory Overtime, and potentially refill later through ROI if the team starts critting.\n\nA Fury with Body +5 at Level 7 has 9 Overdrive. That budget supports multiple maneuvers in one Encounter and still leaves room for a 2-point commitment like Thresher Stance.\n\nAn Operator with Wits +3 at Level 3 has 5 Execution. That gives enough room to issue movement, mark a Target with Focus Fire, protect an Ally with Brace for Impact, and still pressure the room before resting.\n\nA Stitcher with Tech +4 at Level 5 has 7 Triage. That budget supports several healing or control Protocols in one fight, with The Golden Hour and subclass fuel loops helping stretch the pool.\n\nA Codebreaker with Tech +4 at Level 6 has 7 Bandwidth. That allows repeated overclocks, swift breach setups, and defensive spoofing against hostile digital retaliation before the pool runs dry.\n\nGM Guidance\n\nClass resources are not optional decoration. They are the pacing engine for these classes.\n\nA class with its resource pool available is operating at full tactical identity. A class that has burned through its pool should still be functional, but it should feel meaningfully less explosive, less flexible, or less able to force momentum. Let rests matter. Let refill features matter. Do not casually strip a Character of access to their resource-defining gear, such as a Triage Rig or Smartdeck, unless the scene is built around that loss and provides a path to recover from it."
};
