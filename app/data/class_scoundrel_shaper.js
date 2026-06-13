window.EN = window.EN || {};
EN.classes = EN.classes || {};

EN.classes.scoundrel = {
  key: "scoundrel",
  name: "Scoundrel",
  tagline: "By exploiting every blind spot, distraction, and weakness your enemies expose, you ensure you are always slipping out the back with the prize before the alarms even ring. You are training to become an untouchable phantom, a lethal opportunist who thrives in the chaos of the shadows.",

  vitality: {
    text: "Resilience Die: d8\nStarting Vitality: 8 + Body Modifier\nVitality Per Level: 1d8 + Body Modifier"
  },
  resilience: {
    text: "Resilience Die: d8\nStarting Vitality: 8 + Body Modifier\nVitality Per Level: 1d8 + Body Modifier"
  },

  saveFocus: "Agility and Tech",

  attributePriorities: [
    "1. Agility (Primary): Powers your Stealth, Sleight, Finesse melee attacks, ranged attacks, and your overall Speed and Defense.",
    "2. Wits or Charm (Secondary): Wits helps you spot marks and traps (Perception), while Charm lets you lie your way out of blown cover (Deception).",
    "3. Tech (Tertiary): Essential for physically bypassing electronic locks or overriding security systems during an infiltration."
  ],

  resource: {
    name: "Moxie",
    attribute: "Agility",
    maxFormula: "Caliber + Agility Modifier (minimum 1)",
    refresh: "You regain all spent Moxie at the end of a Short or Long Rest.",
    fuels: "Spend 1 Moxie to execute tricks: Duck and Weave (Swift Action; take the Dash or Disengage action, repositioning without provoking opportunity attacks), Pocket Sand (Impulse Action when an enemy within 2 spaces attacks you; impose Snag on their attack roll), and Lucky Break (when you fail an Agility or Wits saving throw, reroll the die and use the new result)."
  },

  startingProficiencies: {
    weapons: ["Simple Weapons", "Martial Weapons", "Sidearms", "Thrown Weapons"],
    armor: ["Light Armor"],
    shields: [],
    skills: ["Stealth", "Sleight", "choose one (Acrobatics, Deception, or Perception)"],
    saves: ["Agility", "Tech"],
    tools: ["Infiltration Tools", "choose one (Systems Tools, Security Tools, Glamour Tools, or Fieldcraft Tools)"]
  },

  featuresByLevel: {
    "1": [
      {
        name: "Cheap Shot",
        text: "You know exactly how to hit where it hurts the most. Once per turn, you can deal an extra 1d6 damage to one Target you hit with an attack if you have Edge on the attack roll. The attack must use a Sidearm, a Simple Weapon, or a Melee Weapon with the Light trait.\n\nYou do not need Edge on the attack roll if another conscious enemy of the Target (like your Ally) is engaged in melee with them, and you do not have Snag on the roll.\n\nThis extra damage increases to 2d6 at 3rd Level, 3d6 at 5th Level, 4d6 at 7th Level, and 5d6 at 9th Level."
      },
      {
        name: "Street Smarts",
        text: "You know how to operate in the shadows. You gain Edge on in-combat Streetwise d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools) made to find black markets, secure illicit goods, or gather rumors about local gangs and corporate security."
      },
      {
        name: "Scoundrel Subclass",
        text: "You choose a specialization that dictates your specific brand of illegality. Are you a Smuggler running blockades, a Ghost slipping through the shadows, or a Cutthroat fighting dirty in the alleys? You gain subclass features at levels 1, 3, 7, and 10."
      }
    ],
    "2": [
      {
        name: "Moxie",
        text: "You survive on instinct, adrenaline, and pure luck. You have a pool of Moxie equal to your Caliber + your Agility Modifier (minimum 1). You regain all spent Moxie at the end of a Short or Long Rest. You may spend 1 Moxie to execute any of the following tricks:\n     Duck and Weave: As a Swift Action, you can take the Dash or Disengage action, allowing you to rapidly reposition without provoking opportunity attacks.\n     Pocket Sand: As an Impulse Action when an enemy within 2 spaces attacks you, you kick up dirt, throw a distraction, or flash a light in their eyes. You impose Snag on their attack roll.\n     Lucky Break: When you fail an Agility or Wits saving throw, you can spend 1 Moxie to immediately reroll the die. You must use the new result."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
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
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "5": [
      {
        name: "Cheap Shot (3d6)",
        text: "Your Cheap Shot extra damage increases to 3d6 at 5th Level. (See Level 1: Cheap Shot.)"
      },
      {
        name: "Uncanny Evasion",
        text: "Your reflexes are honed to a razor's edge, allowing you to dodge out of the way of catastrophic area effects. When you are subjected to an effect that allows you to make an Agility Save to take only half damage (such as an explosive charge or a burst fire weapon), you instead take no damage if you succeed on the saving throw, and only half damage if you fail."
      }
    ],
    "6": [
      {
        name: "Opportunist",
        text: "You ruthlessly exploit the openings created by your crew. When an enemy within your weapon's range is successfully hit by an ally's attack that scores a Critical Hit, or when an enemy completely misses you with a melee attack, you can use your Impulse Action to immediately make a single weapon attack against them. If this attack hits, it automatically qualifies for your Cheap Shot damage."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
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
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "9": [
      {
        name: "Cheap Shot (5d6)",
        text: "Your Cheap Shot extra damage increases to 5d6 at 9th Level. (See Level 1: Cheap Shot.)"
      },
      {
        name: "Slippery Mind",
        text: "You have talked your way out of too many bad situations to let your mind be easily broken. You gain Proficiency in Wits Saving Throws. Furthermore, if you start your turn suffering from the Charmed, Frightened, or Confused condition, you can spend 1 Moxie to instantly clear the condition, shaking off the mental influence through sheer stubbornness."
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
    { level: 1, caliber: 1, features: ["Cheap Shot (1d6)", "Street Smarts", "Scoundrel Subclass"], resource: "" },
    { level: 2, caliber: 1, features: ["Moxie", "Universal Upgrade"], resource: "0" },
    { level: 3, caliber: 2, features: ["Cheap Shot (2d6)", "Subclass Feature"], resource: "0" },
    { level: 4, caliber: 2, features: ["Universal Upgrade"], resource: "+5 Points" },
    { level: 5, caliber: 3, features: ["Cheap Shot (3d6)", "Uncanny Evasion"], resource: "0" },
    { level: 6, caliber: 3, features: ["Opportunist", "Universal Upgrade"], resource: "0" },
    { level: 7, caliber: 4, features: ["Cheap Shot (4d6)", "Subclass Feature"], resource: "+5 Points" },
    { level: 8, caliber: 4, features: ["Universal Upgrade"], resource: "0" },
    { level: 9, caliber: 5, features: ["Cheap Shot (5d6)", "Slippery Mind"], resource: "0" },
    { level: 10, caliber: 5, features: ["Subclass Capstone"], resource: "+5 Points" }
  ],

  subclasses: [
    {
      key: "smuggler",
      name: "The Smuggler",
      description: "You get things, and people, where they are not supposed to be. You are an absolute master of evasion, logistics, and slipping through checkpoints completely undetected. To you, a locked border or a corporate blockade is just a puzzle waiting to be solved. You always get things done, even if you have a bad feeling about it. You win by outsmarting the system, ensuring your crew always has a flawless exit strategy when the job goes sideways.",
      features: [
        {
          level: 1,
          name: "Deep Pockets",
          text: "You are an expert at concealing contraband. You gain Edge on Sleight of Hand or Stealth checks made to hide items on your person, in a vehicle, or in an environment. You can perfectly conceal a Sidearm or a Light melee weapon even from a thorough physical pat down.\n\nFurthermore, you possess the Quick Draw. Whenever you draw a concealed weapon and attack with it on the same turn, you automatically gain Edge on that first attack roll, allowing you to instantly trigger your Cheap Shot from a seemingly unarmed position."
        },
        {
          level: 3,
          name: "The Getaway",
          text: "You never leave your crew behind when things go loud. Whenever you spend 1 Moxie to use your Duck and Weave feature (allowing you to Dash or Disengage as a Swift Action), you can immediately call out an exit path to one ally within 6 spaces who can hear you. That ally can use a free action to instantly move up to half their Speed toward you without provoking opportunity attacks."
        },
        {
          level: 7,
          name: "Smuggler's Run",
          text: "You know how to navigate the absolute worst situations with blinding speed, leading your squad through the chaos. As an Action, you can spend 2 Moxie to initiate a tactical withdrawal or a sudden flank.\n\nYou and up to three Allies of your choice within 6 spaces can immediately move up to your full Speed. During this movement, you and your chosen Allies are completely immune to opportunity attacks, ignore penalties from Difficult Terrain, and can pass directly through enemy-occupied spaces as long as you do not end your turn inside one."
        },
        {
          level: 10,
          name: "Never Tell Me The Odds",
          text: "Your sheer dumb luck borders on the supernatural. Once per Long Rest, when a situation goes completely sideways (such as failing a critical Save that would result in death, or taking damage that would reduce you to 0 Vitality), you miraculously escape the consequence.\n\nYou take absolutely zero damage, automatically succeed on the Save, and instantly reposition yourself up to 6 spaces away to a safe, unoccupied location you can see. You leave behind a decoy, a puff of smoke, a collapsing piece of cover, or just the infuriating realization that you slipped away at the exact perfect microsecond."
        }
      ]
    },
    {
      key: "cutthroat",
      name: "The Cutthroat",
      description: "You are a dirty fighter, an alleyway duelist, and an unapologetic killer. While others might run from a direct confrontation, you wade right into the blood and grit with a knife in each hand. You have mastered the art of rapid strikes and crippling injuries, specializing in bleeding a target completely dry before they even realize how badly they have been cut.",
      features: [
        {
          level: 1,
          name: "Blade Dancer",
          text: "You are a master of lethal, close-quarters knife work. When you wield a Melee Weapon with the Light trait in each hand, you gain a +1 bonus to your Defense.\n\nFurthermore, you are ruthless when an enemy turns their back. Whenever you hit an enemy with an opportunity attack, you can automatically apply your Cheap Shot damage to the strike, even if you do not normally meet the requirements."
        },
        {
          level: 3,
          name: "Bleed Them Out",
          text: "You know exactly where to insert the blade to hit a major vein. Whenever you hit an enemy with a melee attack and apply your Cheap Shot damage, you can spend 1 Moxie to twist the blade.\n\nThe target is instantly inflicted with 1 stack of Bleeding. (As per the Bleeding rules: they take 1d4 Vitality damage at the start of their turn and every time they willingly move 1 space, compounding the tactical pressure)."
        },
        {
          level: 7,
          name: "Hamstring Slice",
          text: "You systematically destroy an enemy's ability to stand their ground. As an Action, you can spend 2 Moxie to make a highly calculated melee attack against a target's lower extremities.\n\nOn a hit, the attack deals its normal damage plus your Cheap Shot damage, and the target must make an Agility Save (DC = 8 + your Agility Modifier + your Caliber). On a failure, their tendons are slashed; they are violently knocked Prone and their Speed is reduced to 0 until they receive medical treatment or magical healing. On a success, their Speed is halved until the end of their next turn."
        },
        {
          level: 10,
          name: "Flurry of Steel",
          text: "You become a terrifying blur of lethal precision, capable of gutting a room in seconds. Once per Long Rest, as an Action, you can unleash a devastating sequence of melee strikes.\n\nYou can immediately move up to your Speed. During this movement, you can make a single melee weapon attack against every single enemy that comes within your reach. Every attack made during this flurry automatically benefits from your Cheap Shot damage, and you do not provoke opportunity attacks for the duration of this movement."
        }
      ]
    },
    {
      key: "ghost",
      name: "The Ghost",
      description: "You are the unseen blade, the phantom in the corporate facility, the absolute master of stealth. You do not just hide in the shadows; you weaponize them. You specialize in flawless infiltration, silent assassinations, and disappearing without a single trace. To your enemies, you are a terrifying myth that only materializes at the exact moment the killing blow lands.",
      features: [
        {
          level: 1,
          name: "Unseen Assailant",
          text: "You are devastating when you strike from total concealment. When you make a weapon attack against a target while you are Hidden or Invisible, your attack scores a Critical Hit on a natural roll of 19 or 20.\n\nAdditionally, your movement is perfectly silent. Moving at your full Speed no longer imposes any penalties on your Stealth checks, allowing you to sprint through the shadows without making a sound."
        },
        {
          level: 3,
          name: "Vanish",
          text: "You know how to disappear in plain sight, exploiting momentary distractions. As a Swift Action, you can spend 1 Moxie to attempt a Stealth check to become Hidden, even if you are currently being observed by enemies or are standing in an area without total cover. As long as there is a shadow, a crowd, or a momentary chaotic distraction, you simply fade from their perception until you attack, cast an Invocation, or the end of your next turn."
        },
        {
          level: 7,
          name: "Silent Takedown",
          text: "You are an expert at neutralizing guards before they can sound the alarm. As an Action, you can spend 2 Moxie to make a devastating strike against a target while you are Hidden or Invisible to them.\n\nIf the attack hits, it automatically counts as a Critical Hit, and the target must make a Body Save (DC = 8 + your Agility Modifier + your Caliber). On a failure, they take normal critical damage, and are instantly Stunned and Silenced (rendering them completely unable to cry out for help or trigger an alarm) until the end of their next turn."
        },
        {
          level: 10,
          name: "Phantom Walk",
          text: "You can perfectly align your physical movement with the blind spots of the world. Once per Long Rest, as a Swift Action, you enter a state of absolute imperceptibility for 1 minute.\n\nDuring this time, you become completely Invisible, and you cannot be tracked by thermal optics, auditory sensors, or Tremor Sense. This invisibility does not break when you attack or cast an Invocation; you remain a terrifying, unseen phantom for the full duration of the effect."
        }
      ]
    }
  ],

  extra: {
    playbook: {
      turnToTurn: "You dictate positioning and the action economy. You dart in and out of the fray, striking Targets that are distracted by your heavy-hitting Allies. You use your Moxie to bend the rules of combat, slipping away from danger or turning a near miss into a devastating blow.",
      winningEncounters: "You win through asymmetric warfare. You are not built to stand in the open and trade shots with a heavy gunner. You win by flanking, utilizing cover, striking from the shadows, and systematically eliminating high-priority Targets with lethal precision before vanishing again.",
      whatToAvoid: "Getting pinned down. With a d8 Resilience Die and reliance on Light Armor, you cannot survive a prolonged, static firefight. If you run out of Moxie and find yourself surrounded without an escape route, your luck will run out very quickly."
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
        text: "You have awakened a deep connection to the metaphysical current. Your capacity to hold and shape this energy safely is represented by your Reservoir of Flow Points (FP).\nYour maximum FP is equal to (Caliber x 3) + your Flow Modifier.\nYou regain all spent FP at the end of a Long Rest, and an amount equal to your Flow Modifier at the end of a Short Rest.\n\nIf your FP drops to 0, you may continue to shape by entering Overdraw, losing 1d4 Vitality per FP spent and risking Strain."
      },
      {
        name: "Core Channeling",
        text: "You do not memorize static spells; you shape the current on the fly. You begin play knowing three Base Resonances chosen from the standard list: Kinetic, Thermal, Electromagnetic, Visceral, or Spatial. When you channel the Flow, you spend FP to build an Invocation using your known Resonances combined with the Intent, Delivery, Force, and Duration rules."
      },
      {
        name: "Flow Subclass",
        text: "You choose a Shaper subclass, representing your specialization. This subclass grants features at specific Shaper levels. You gain all subclass features for which you meet the required Shaper level, both now and as you continue to advance."
      }
    ],
    "2": [
      {
        name: "Controlled Overdraw",
        text: "You have learned how to briefly turn your body into a pressure valve to bleed off dangerous resonance without fracturing your nervous system.\n\nOnce per Short Rest, when your FP is at 0 and you declare an Overdraw, you may ignore the Vitality loss and Strain accumulation for up to 2 FP worth of Overdraw. If the Invocation costs more than 2 FP, you take the Vitality damage and Strain for the remainder as normal."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "3": [
      {
        name: "Subclass Feature",
        text: "You gain your subclass feature for level 3."
      },
      {
        name: "Resonance Synthesis",
        text: "Your connection to the Flow expands beyond yourself. You officially unlock the Resonance Synthesis Advanced Techniques, granting you the ability to use Flow Linking and Resonance Amplification.\n\nAdditionally, your internal frequency has developed enough stability to manipulate one of the abstract resonances. You may now learn the Cognitive Base Resonance. Upon reaching this level, you learn one new Base Resonance of your choice (bringing your total to four)."
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
        name: "Expanded Frequency",
        text: "Your spirit can now bear the chronological friction of the most volatile resonance. You may now learn the Temporal Base Resonance.\n\nUpon reaching this level, you learn one new Base Resonance of your choice (bringing your total to five)."
      },
      {
        name: "Layered Force",
        text: "Your shaping has matured to the point where you can stack the modular components of an Invocation. You may now pay both the Hybrid (1 FP) and Empowered Force (1 FP) costs on a single Invocation, dealing the Invocation's full Empowered damage and applying the Resonance's Empowered Effect."
      }
    ],
    "6": [
      {
        name: "Rhythmic Shaping",
        text: "You have learned to weave shaping and physical momentum into a single, unbroken rhythm. Once per round, when you use an Action to shape an Invocation, you may use a Swift Action to Disengage, Dash, or make a single attack with a Simple Weapon or Sidearm."
      },
      {
        name: "Universal Upgrade",
        text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "7": [
      {
        name: "Subclass Feature",
        text: "You gain your subclass feature for level 7."
      },
      {
        name: "Master Forging",
        text: "You have achieved an elite level of harmonic control, allowing you to manipulate the scale of shaping from personal defense to environmental strategy. You officially unlock the Master Forging Advanced Techniques, granting you the ability to use Cooperative Channeling and create Sustained Fields."
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
        name: "Absolute Conduit",
        text: "Your spirit is completely calloused against the friction of the Flow. You gain the following benefits:\n\nStrain Resistance: You completely ignore the mechanical penalties of Stage 1 Strain (Ripple) and Stage 2 Strain (Wave). You only begin suffering penalties if you reach Stage 3 (Surge).\n\nRapid Alignment: When you roll Initiative, if your FP is currently 0, you immediately regain 2d4 FP as your body reflexively pulls ambient resonance from the environment."
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
          text: "You are constantly broadcasting to a localized, parasocial audience through the Flow.\n\nFlow Attribute: Your Flow Attribute is Charm. This drives your Flow Attack rolls, Flow Save DCs, and your Reservoir's Flow Modifier component as normal.\n\nThe Parasocial Pact: Your bond with the audience runs deeper than your stage presence. When calculating the size of your Reservoir, you may add half your Mystique modifier (rounded up, minimum 0) to your maximum FP, on top of the standard formula. This reflects the metaphysical reserve you maintain to keep the spotlight from burning you out.\n\nMetaphysical Live Feed: You gain Edge on in-combat Charm d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools) when dealing with crowds or fans. Furthermore, the audience rewards you for being entertaining. Once per combat, if you successfully hit an enemy with a Flow Attack after taking a deliberate risk (such as moving out of Cover to expose yourself or taking a dangerous leap), the audience donates to the stream. You immediately regain 1d4 FP."
        },
        {
          level: 3,
          name: "Main Character Syndrome",
          text: "Your audience demands a spectacle, and they are willing to alter reality to make you look good, but only if you can hold your composure when the moment turns.\n\nHey, Look at Me!: As a Swift Action, you can spend 1 FP to \"Call the Shot.\" You must narrate exactly how you plan to make your next Action incredibly flashy or unnecessarily dramatic. If your next Action requires a d20 roll (an attack or a skill check), you gain Edge.\n\nIf you succeed, the Invocation or attack deals an additional 1d6 Psychic damage as the sheer hype of the audience manifests as physical force.\n\nIf you fail, the audience cringes, but you can sometimes ride it out. You may make a Mystique save (DC 12) to swallow the embarrassment and reframe the moment as deliberate. On a success, you take no Strain. On a failure, you take 1 Stage of Strain as the audience turns on you."
        },
        {
          level: 7,
          name: "The Show Must Go On",
          text: "The audience absolutely refuses to let their favorite show end, and the discipline you've cultivated beneath the persona lets you choose how the comeback lands.\n\nPlot Armor: Once per Long Rest, when an attack would reduce you to 0 Wounds, the screen effectively freezes. You do not fall Unconscious and do not become Dying. Instead, you remain at 1 Wound and immediately gain 1 Stage of Strain as the collective will of your audience forces the universe to rewrite your death.\n\nYou immediately emit a massive pulse of resonance. Every enemy within 6 spaces must make a Saving Throw. You choose the flavor of the pulse when you trigger it:\n\n     The Spectacle (Wits Save): On a failure, targets are knocked Prone and suffer the Blinded condition until the end of their next turn as the localized Flow erupts in flashing lights and deafening applause.\n     The Reckoning (Mystique Save): On a failure, targets are Charmed by your survival narrative until the end of their next turn. They cannot willingly attack you, as the metaphysical weight of your refusal to die makes the act of striking you feel viscerally wrong.\n\nEither Save uses DC = 8 + your Charm Modifier + your Caliber.\n\nAuthentic Self: Holding the persona together has a metaphysical cost, and you've learned to bleed it off cleanly. Once per Short Rest, when you would take 1 Stage of Strain from any Icon subclass feature, you may make a Mystique save (DC 10 + Stages of Strain you currently have). On a success, you absorb the metaphysical recoil into your inner self instead. You take no Strain, and you regain 1 FP as the dissonance is converted back into resonance."
        },
        {
          level: 10,
          name: "Do Not Look Away",
          text: "You force the entire world to stop what they are doing and watch you, and you decide whether they see the icon or the truth behind it.\n\nOnce per Long Rest, as an Action, you spend 2 FP to project your feed into the ambient Flow of the sky for everyone in the area to see.\n\nAudience Capture: Every enemy within 20 spaces must make a Saving Throw against DC = 8 + your Charm OR Mystique modifier (your choice) + your Caliber. The type of Save depends on which face you project:\n\n     Project the Icon (Wits Save): Enemies are captivated by the spectacle. Your broadcast is overwhelming, hypnotic, total.\n     Project the Self (Mystique Save): Enemies are captivated by the truth underneath the persona, the raw, unfiltered weight of who you actually are, broadcast at metaphysical volume.\n\nOn a failure, they are completely captivated. They drop their weapons, their Speed becomes 0, and they cannot take Actions or Impulse Actions. They can only stare at you in awe or horror. The effect lasts for up to 1 minute, but ends immediately for any individual target if they take damage. This gives your squad the ultimate setup to bypass an army or line up perfect executions."
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
          text: "You are the bridge between the sterile city and the ancient rhythms beneath it. Your presence alone anchors your allies to the current.\n\nFlow Attribute: Your Flow Attribute is Mystique.\n\nPrimal Resonance: You do not need to hold physical tools to shape the current; your own breath and presence act as the instrument. You are always considered to be holding a Ritual Implement for the purposes of shaping Invocations, Ritual Recovery, and Breakflow Restoration. This leaves your hands completely free to wield weapons or interact with the environment. Furthermore, you gain Edge on in-combat Intimidation and Persuasion d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools), and you can communicate telepathically with any willing ally within 12 spaces as long as you are chanting, whispering, or breathing rhythmically."
        },
        {
          level: 3,
          name: "Burden of the Earth",
          text: "You are the grounding wire for your pack. Like the soil absorbing poison, you draw the suffering and corruption of your allies into your own form.\n\nAs a Swift Action, you can spend 1 FP to target a willing ally within 6 spaces.\n\nYou can instantly purge one elemental or psychic status effect (like Burning, Poisoned, or Blinded) from them. Alternatively, if they have accumulated Strain, you can transfer 1 Stage of their Strain directly onto yourself, physically shouldering their metaphysical burden to keep them in the fight. Strain transferred through Burden of the Earth is treated as if it were caused by Overdraw and cannot be ignored by the Absolute Conduit feature's Strain Resistance."
        },
        {
          level: 7,
          name: "Primal Eruption",
          text: "You command the smothered earth beneath the city to violently reclaim its territory, tearing through concrete, glass, and steel with ancient fury.\n\nAs an Action, you spend 2 FP to target an Area 4 Cube within 12 spaces.\n\nMassive spectral roots and glowing fungal networks erupt from the surfaces. Enemies in the area must make an Agility Save. On a failure, they take 4d6 Bludgeoning damage and are Restrained by the roots. The area becomes Difficult Terrain for your enemies, but your allies can move through it freely and heal 1d4 Vitality the first time they enter the zone on their turn."
        },
        {
          level: 10,
          name: "The World in Bloom",
          text: "You enforce the absolute and terrifying cycle of life and death. You turn the battlefield into a sacred, blooming domain where the earth fiercely protects its own and consumes the unworthy.\n\nOnce per Long Rest, as an Action, you spend 2 FP to infuse the ground in Area 12 with aggressive, blooming life for 1 minute.\n\nWomb of the World: The living earth refuses to let your pack die. If an ally would be reduced to 0 Wounds while inside the zone, they do not fall Unconscious and do not become Dying. The concrete and roots instantly swallow them into a hardened, underground cocoon, knitting them back together so they regain Wounds equal to 2d4 + their Body Modifier. While cocooned, they cannot be targeted by attacks and cannot act. At the start of any of their turns while the zone lasts, they may burst back out of the ground, ready to fight. If they have not emerged before the zone ends, the earth ejects them. Each ally can be saved by Womb of the World once per activation of this zone.\n\nThe Reaper's Bloom: Death fuels new growth. Whenever an enemy is killed inside the zone, the earth aggressively drags their body under. The closest ally to the fallen enemy immediately heals 2d6 Vitality or regains 1d4 FP."
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
          text: "You blur the line between your physical weapon and your metaphysical presence.\n\nFlow Attribute: Your Flow Attribute is Body.\n\nEdge of Oneness: You do not use traditional casting tools. Any melee weapon you are proficient with acts as your Ritual Implement. Furthermore, you can use your Body modifier instead of Agility for the attack and damage rolls of any melee weapon with the Finesse or Light trait. When you cast an Invocation with a Directed (Touch) Delivery, you can deliver the effect through your weapon's strike."
        },
        {
          level: 3,
          name: "Flowstride",
          text: "You glide across the battlefield, treating gravity and friction as mere suggestions.\n\nAs a Swift Action, you can spend 1 FP to become completely frictionless for the remainder of your turn.\n\nYour Speed increases by 3. You ignore Difficult Terrain, you do not provoke opportunity attacks, and you can run along vertical surfaces, up walls, or across the surface of water without falling, so long as you end your turn on solid ground."
        },
        {
          level: 7,
          name: "Spiral Deflection",
          text: "You are so attuned to the kinetic energy around you that you can slice bullets out of the air.\n\nWhen you are hit by a ranged ballistic or physical attack, you can use an Impulse Action and spend 1 FP to deflect the projectile with your weapon or bare hands.\n\nYou reduce the damage by 1d10 + your Body Modifier + your Caliber.\n\nIf you reduce the damage to 0, you catch or deflect the projectile with perfect spin. You can immediately make a ranged Flow Attack (using your Body Modifier) to redirect the projectile at any target within 6 spaces, dealing its original damage on a hit."
        },
        {
          level: 10,
          name: "Thousand Ripples",
          text: "Once per Long Rest, you vibrate at the exact frequency of the ambient current, allowing you to strike an entire army simultaneously.\n\nAs an Action, you spend 2 FP and dissolve into a blur of pure kinetic motion.\n\nYou instantly move to every enemy of your choice within 12 spaces. You make one standard melee weapon attack against each of those targets. You do not provoke opportunity attacks during this movement.\n\nAfter all attacks are resolved, you fully materialize in an unoccupied space adjacent to the final target you attacked."
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
          text: "Flow Attribute: Tech.\n\nThe Invisible Ecosystem: You do not use traditional wands or crystals. Your Ritual Implements are geometric copper coils, algorithmic tuning forks, or magnetic pendulums. You can passively see and communicate with Nixies and Gremlins, the capricious Flow sprites that inhabit complex machinery.\n\n     Nixie Boon: When you cast an Invocation, you can spend an additional 1 FP to lure a Nixie into a target's weapon or cybernetics. The target receives a 1d4 bonus on their next attack roll or Saving Throw as the helpful sprite optimizes their gear from the inside.\n     Gremlin Bane: When you cast an Invocation, you can spend an additional 1 FP to lure a Gremlin into a target's weapon or cybernetics. The target suffers a 1d4 penalty on their next attack roll or Saving Throw as the angry sprite sabotages their gear from the inside."
        },
        {
          level: 3,
          name: "Hardware Harmonization",
          text: "You can directly communicate with the sprites currently residing within nearby hardware, either feeding them pure resonance to overclock their host device or aggravating them into violent, destructive tantrums.\n\nNixie Synchronization: As a Swift Action, you can spend 1 FP to touch an ally's weapon or cybernetic implant, feeding a small burst of pure resonance to the Nixie inside. For the next turn, the weapon or implant is perfectly synchronized. The ally gains Edge on their next attack roll with that weapon, and the weapon deals an additional 1d6 Force damage on its next hit as the happy sprite eagerly assists in the violence.\n\nGremlin Tantrum: As a Swift Action, you can spend 1 FP to aggravate the Gremlins in the area and direct their anger to an enemy's firearm, smart tech, or cyberlimb within 12 spaces. On their next action, the enemy must make a Tech Save. On a failure, the gremlins throw a tantrum causing the gear to backfire. The user takes 1d6 Fire damage and that specific weapon or cyberlimb completely seizes up, preventing its use until the end of their next turn."
        },
        {
          level: 7,
          name: "Scrap Familiar",
          text: "You gather loose technology, broken drones, and urban debris to build a permanent physical vessel for a Flow sprite.\n\nYou can spend 10 minutes outside of combat to build a Scrap Familiar. Alternatively, in the heat of battle, you can spend 2 FP and a Complex Action to rapidly assemble one out of the surrounding environment. You can only have one Scrap Familiar active at a time. If you build a new one, the old one instantly falls apart into mundane junk.\n\nIf you are knocked Unconscious, your active Familiar deactivates until you awaken. When you build the Familiar, you must declare whether you are housing a Nixie or a Gremlin.\n\nScrap Familiar Base Stats:\n     Defense: 12 plus your Tech Modifier\n     Vitality: 15 plus (Your Caliber multiplied by 5)\n     Speed: 6 (Hovering)\n     Size: Medium Construct\n     Immunities: Poison, Psychic, Blinded, Charmed, Frightened\n\nNixie Skyhook Familiar\nThis Medium construct is a mechanical osprey built from weathered plating and braided steel cables. Precision drone rotors pulse with soft blue Nixie energy within its wings, while a central winch and electromagnetic talons sit ready for heavy lifting.\n\nOut of Combat Utility: The Nixie acts as a logistical dream, providing immense physical utility.\n\n     Vertical Infiltration: The Nixie can fly up to 24 spaces, magnetically embed its talons into a surface, and drop a high-tensile cable. Allies using it gain a climbing speed equal to their walking speed and automatically succeed on standard climbing Athletics checks.\n     Magnetic Anchor: While anchored to metal or stone, the Nixie's winch can support 2,000 pounds of static weight. Allies using the cable to move heavy obstacles or force doors gain Edge on in-combat Athletics d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools).\n     Beast of Burden: It can carry up to 200 pounds of gear or an unconscious ally without reducing its 6-space flying speed.\n\nIn Combat: It acts on your turn. You can command it to move as a free action. As a Swift Action, you can command a Magnetic Rescue. The Nixie shoots a glowing line to a willing ally within 6 spaces and instantly reels them to an adjacent unoccupied space. This rapid movement ignores Difficult Terrain and opportunity attacks.\n\nGremlin Scourge Familiar\nThis Medium construct resembles a massive mechanical rat forged from rusted engine blocks, copper wire, and razor blade whiskers. Its chassis constantly vibrates with a swarming cloud of tiny mechanical fleas acting as its sensors and saboteurs.\n\nOut of Combat Utility: The Gremlin and its fleas act as a mobile disruption field.\n\n     Comms Jamming: Scramble all unencrypted hostile radio and digital communications within an Area 20 for up to 1 hour.\n     Acoustic Dampening: Activate an Area 3 Aura of silence centered on the construct. Allies moving within this aura make absolutely no noise and gain Edge on in-combat Stealth d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools).\n     Auditory Decoy: Project an intense auditory illusion mimicking a firefight, alarm, or breaching charge (up to 120 decibels) at any point within 12 spaces for up to 1 minute.\n\nIn Combat: It acts on your turn. You can command it to move as a free action. As a Swift Action, you can command a Sensory Overload. The rat sends its fleas leaping onto a target within 3 spaces to scream malicious code. The target must make a Wits Save. On a failure, they take 2d6 Psychic damage and are Blinded until the start of your next turn. Once an enemy succeeds on this Wits Save, their optics adapt to the interference, and they become immune to Sensory Overload for 24 hours."
        },
        {
          level: 10,
          name: "Absolute Symbiosis",
          text: "You physically merge a swarm of Gremlins and a host of Nixies directly into your own nervous system and gear, becoming a living singularity of the Flow.\n\nOnce per Long Rest, as an Action, you spend 2 FP to become the perfect vessel for both sprites for 1 minute. Upon activation, a catastrophic shockwave of raw code and sparks violently reboots the immediate area. All enemies within 4 spaces must make a Tech Save or take 4d6 Electric damage and be violently pushed 2 spaces away from you.\n\nFor the duration, you project an Area 4 Aura of absolute technological authority:\n\nThe Gremlin Storm: The air around you is thick with malicious machine sprites. Any enemy that starts its turn within the aura takes 4d4 Electric damage. Furthermore, their targeting optics and cybernetics are constantly under attack; enemies inside the aura suffer Snag on all attack rolls, and the swarm floods effortlessly around corners and behind barricades, completely denying them any Defense bonuses from physical Cover.\n\nThe Nixie Optimization: The Nixies hyper-optimize your physiology and equipment in real time. At the start of your turn, you instantly regain 2d6 Vitality (if your Vitality is full, you gain this amount as Vigor instead). Additionally, your processing speed becomes inhuman. You can cast any Invocation with a Tech delivery method as a Swift Action instead of a standard Action, and your movement does not provoke opportunity attacks, as the Nixies flawlessly predict and deflect any parting strikes triggered by your repositioning."
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
        text: "This Medium construct is a mechanical osprey built from weathered plating and braided steel cables. Precision drone rotors pulse with soft blue Nixie energy within its wings, while a central winch and electromagnetic talons sit ready for heavy lifting.\n\nOut of Combat Utility: The Nixie acts as a logistical dream, providing immense physical utility.\n\n     Vertical Infiltration: The Nixie can fly up to 24 spaces, magnetically embed its talons into a surface, and drop a high-tensile cable. Allies using it gain a climbing speed equal to their walking speed and automatically succeed on standard climbing Athletics checks.\n     Magnetic Anchor: While anchored to metal or stone, the Nixie's winch can support 2,000 pounds of static weight. Allies using the cable to move heavy obstacles or force doors gain Edge on in-combat Athletics d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools).\n     Beast of Burden: It can carry up to 200 pounds of gear or an unconscious ally without reducing its 6-space flying speed.\n\nIn Combat: It acts on your turn. You can command it to move as a free action. As a Swift Action, you can command a Magnetic Rescue. The Nixie shoots a glowing line to a willing ally within 6 spaces and instantly reels them to an adjacent unoccupied space. This rapid movement ignores Difficult Terrain and opportunity attacks."
      },
      {
        name: "Gremlin Scourge Familiar",
        subclass: "The Sourcerer (Level 7)",
        text: "This Medium construct resembles a massive mechanical rat forged from rusted engine blocks, copper wire, and razor blade whiskers. Its chassis constantly vibrates with a swarming cloud of tiny mechanical fleas acting as its sensors and saboteurs.\n\nOut of Combat Utility: The Gremlin and its fleas act as a mobile disruption field.\n\n     Comms Jamming: Scramble all unencrypted hostile radio and digital communications within an Area 20 for up to 1 hour.\n     Acoustic Dampening: Activate an Area 3 Aura of silence centered on the construct. Allies moving within this aura make absolutely no noise and gain Edge on in-combat Stealth d20 checks (or add +1 Edge Die to related out-of-combat Dice Pools).\n     Auditory Decoy: Project an intense auditory illusion mimicking a firefight, alarm, or breaching charge (up to 120 decibels) at any point within 12 spaces for up to 1 minute.\n\nIn Combat: It acts on your turn. You can command it to move as a free action. As a Swift Action, you can command a Sensory Overload. The rat sends its fleas leaping onto a target within 3 spaces to scream malicious code. The target must make a Wits Save. On a failure, they take 2d6 Psychic damage and are Blinded until the start of your next turn. Once an enemy succeeds on this Wits Save, their optics adapt to the interference, and they become immune to Sensory Overload for 24 hours."
      }
    ]
  }
};
