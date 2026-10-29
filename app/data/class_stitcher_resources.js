window.EN = window.EN || {};
EN.classes = EN.classes || {};

/* Trauma Rig tiers, the Stitcher's medical hardware and the direct counterpart to the
   Codebreaker's Smartdeck: a tier table the engine reads by tier name, exactly the way
   EN.grid.smartdecks is read through a gear row's deckTier. Gear rows for the Rig carry
   rigTier, and the engine picks the best one the character owns.

   Output Bonus is the rig's own tier value and the third term of the Triage Save DC. It
   is NOT a proficiency bonus and NOT Caliber. No tool-proficiency tier bonus feeds this
   DC, and no such tier bonus exists in this system; Medical Tools remains an ordinary
   Tool Proficiency and nothing more. No rig at all, and a cobbled Scrap Rig, both
   resolve to Output Bonus +0, so the DC always resolves to a number. */
EN.traumaRigs = {
  governingSkill: "Medtech (Tech)",
  userType: "Anyone (Standard Users). Stitchers (Practitioners).",
  saveDcFormula: "Triage Save DC: 8 + your Tech Modifier + your Rig's Output Bonus",
  outputBonusNote: "A Rig's Output Bonus adds to any healing roll the Rig delivers, and it sets the Triage Save DC.",
  modSlotNote: "Modification Slots equal the Rig's Tier, so a Field Kit [0] has none and a Black Clinic [5] has five. The printed dash on the Field Kit row means zero.",
  integrityNote: "A Trauma Rig is powered gear, so it projects a #GRID Node at its own Tier and is a valid #GRID target. Its Integrity is the Node's System Integrity: cipher damage tests the Firewall first and the remainder comes off Integrity, physical damage lands at full value, and at 0 the Rig is Bricked until it is repaired.",
  // Trauma Grade [2] is the rung where the Rig stops being a first aid box.
  advancedMedkitTier: 2,
  medicalBaseline: "A Trauma Rig counts as a Basic Medkit for Treat Wounds and Treat Fatigue. At Trauma Grade [2] or higher it counts as an Advanced Medkit instead.",
  traitNote: "Each Trauma Rig has the trait named for its tier and keeps every trait below it. A Black Clinic rig carries all six. Traits: Worn.",
  /* Printed columns only. modSlots, the cumulative trait list, and the Medical
     Baseline grade are all DERIVED below from t, so a Tier edit can never leave
     them behind. Output Bonus is the Rig's own tier value and the third term of
     the Triage Save DC. */
  tiers: [
    { tier: "Field Kit",     t: 0, outputBonus: 0, price: 400,   integrity: 15, availability: "Common",   legality: "Legal",
      trait: "Field Synthesis",         traitText: "Baseline. Mixes supplies into compounds, delivers by injector, patch, or spray." },
    { tier: "Clinic Grade",  t: 1, outputBonus: 1, price: 1100,  integrity: 20, availability: "Common",   legality: "Licensed",
      trait: "Sealed Reservoir",        traitText: "Immune to compounds your own rig produces. Contaminated or improvised reagents no longer risk a bad batch." },
    { tier: "Trauma Grade",  t: 2, outputBonus: 1, price: 2600,  integrity: 25, availability: "Uncommon", legality: "Licensed",
      trait: "Remote Applicator",       traitText: "Any Protocol with a listed range gains +3 spaces." },
    { tier: "Combat Grade",  t: 3, outputBonus: 2, price: 5500,  integrity: 30, availability: "Uncommon", legality: "Restricted",
      trait: "Redundant Injector",      traitText: "Once per scene, reroll a healing roll made through the rig. Take the second result." },
    { tier: "Ward Response", t: 4, outputBonus: 2, price: 9500,  integrity: 35, availability: "Rare",     legality: "Restricted",
      trait: "Contraindication Filter", traitText: "Allies aren't affected by area compounds you release." },
    { tier: "Black Clinic",  t: 5, outputBonus: 3, price: 16000, integrity: 40, availability: "Rare",     legality: "Contraband",
      trait: "Autonomous Loop",         traitText: "Once per scene, while you are Unconscious or Incapacitated, the rig delivers Failsafe to the nearest dying ally in range on its own." }
  ],
  startingRig: "A Stitcher starts with a Field Kit [0] free with the class, the same way a Codebreaker starts with a Standard Smartdeck. The Rig must be equipped to use Triage Protocols. Upgrading the Rig carries your Protocols and any modifications across.",
  scrapRig: "A cobbled-together Scrap Rig counts as Output Bonus +0 regardless of what you carried before. You suffer Snag on all Triage healing rolls and attack rolls, and any Triage Protocol that normally costs a Swift Action costs an Action instead.",
  replacement: "Buy a replacement Rig at its listed price, or build one during Downtime with access to a workshop, 250 \u{1D4A2} in chemical precursors, and a successful Medtech or Engineering Dice Pool check."
};

/* Derived at load, the way EN.vehicles derives its list price and mod slots, so the
   three values the book states as formulas are computed once and can never desync
   from the Tier column:
     modSlots     = the Tier ordinal (Field Kit [0] has none)
     traits       = this Tier's trait plus every trait below it (cumulative)
     medkitGrade  = Basic Medkit, or Advanced Medkit at advancedMedkitTier and up
   label is the printed bracket form of the Tier, house style, built in one place. */
EN.traumaRigs.tiers.forEach(function (r) {
  r.label = r.tier + " [" + r.t + "]";
  r.modSlots = r.t;
  r.traits = EN.traumaRigs.tiers.filter(function (x) { return x.t <= r.t; }).map(function (x) { return x.trait; });
  r.medkitGrade = r.t >= EN.traumaRigs.advancedMedkitTier ? "Advanced Medkit" : "Basic Medkit";
});
/* trait name -> printed text, for tooltips; mirrors EN.grid.smartdeckTraits */
EN.traumaRigs.traits = EN.traumaRigs.tiers.map(function (r) { return { name: r.trait, tier: r.label, text: r.traitText }; });
EN.traumaRigs.traitDefs = {};
EN.traumaRigs.traits.forEach(function (t) { EN.traumaRigs.traitDefs[t.name] = t.text; });

// Triage Protocols as structured sub-entries, the single source for the engine, the Class-tab
// picker, and the print sheet. The Triage feature's prose (below) is composed from this list,
// so the displayed text and the machine-readable data can never drift apart.
var STITCHER_TRIAGE_PROTOCOLS = [
  { name: "Adrenaline Spike", action: "Swift Action", cost: 1, text: "Target one ally within 6 spaces. The target immediately gains **Vigor** equal to 1d8 + your Tech Modifier. Until the end of their next turn, their Speed increases by 2 and they ignore Difficult Terrain." },
  { name: "Chemical Purge", action: "Swift Action", cost: 1, text: "Target one ally within 6 spaces. The target may immediately end one of the following conditions: *Poisoned*, *Bleeding*, *Paralyzed*, or *Blinded*." },
  { name: "Trauma Patch", action: "Action", cost: 1, text: "Target one Character within your melee reach. The target regains Vitality equal to 2d8 + your Tech Modifier. If the target is Unconscious due to a Critical Condition or Fatigue, they immediately regain consciousness." },
  { name: "Toxic Overdose", action: "Action", cost: 1, text: "Target one enemy within 6 spaces. The target must make a Body Save (DC = 8 + your Tech Modifier + your Rig's Output Bonus). On a failure, they take Toxic damage equal to 2d6 + your Tech Modifier and are *Poisoned* until the end of their next turn." },
  { name: "Sedative", action: "Action", cost: 1, text: "Target one enemy within 6 spaces. The target must make a Body Save (DC = 8 + your Tech Modifier + your Rig's Output Bonus). On a failure, they become *Drowsy*. Dosing a target who is already Drowsy stacks toward unconsciousness, as described under the Drowsy condition. Outside of combat, a single dose is usually enough to drop a lone, unaware mark into true sleep, at the GM's discretion." },
  { name: "Coagulant Burst", action: "Impulse Action", cost: 1, text: "Trigger: An ally within 6 spaces takes damage or gains the Bleeding condition. You immediately reduce the incoming damage by an amount equal to your Tech Modifier + Caliber and completely prevent the *Bleeding* condition from applying." },
  { name: "Failsafe", action: "Impulse Action", cost: 1, text: "Trigger: An ally within 6 spaces is reduced to 0 Vitality by damage, or takes damage while already at 0 Vitality. They immediately gain **Vigor** equal to 2d8 + your Tech Modifier. Until the end of their next turn, they ignore the Speed reduction from being Bloodied." },
  { name: "Nerve Block", action: "Action", cost: 1, text: "Target one ally within 6 spaces. For the next minute, that ally gains **Resistance** to Bludgeoning, Piercing, and Slashing damage, but can't benefit from any effects that restore Vitality or Wounds. You or the affected ally can disable this Nerve Block early at any time (no action required)." },
  { name: "Triage Sweep", action: "Action", cost: 1, text: "Target up to three allies within 6 spaces. Each target regains Vitality equal to 1d6 + your Tech Modifier." },
  { name: "Casualty Extraction", action: "Swift Action", cost: 1, text: "Target one ally within 12 spaces. The ally is pulled up to 6 spaces toward you without provoking opportunity attacks and regains Vitality equal to your Tech Modifier + your Caliber." },
  { name: "Booster Shot", action: "Swift Action", cost: 1, text: "Target one ally within 6 spaces. Until the start of your next turn, the target rolls all Saving Throws with Edge." },
  { name: "Muscle Relaxant", action: "Action", cost: 1, text: "Target one enemy within 6 spaces. The target must make a Body Save (DC = 8 + your Tech Modifier + your Rig's Output Bonus). On a failure, until the end of their next turn their Speed is halved and they roll with Snag on attack rolls." }
];
var STITCHER_TRIAGE_INTRO = "Every Stitcher carries the same rig anyone can buy. What you have that the kiosk doesn't is the knowledge of what the reservoir is actually capable of, and the willingness to find out.\n\nOnce it's yours, nobody calls it a Trauma Rig. It's a **Triage Rig**, and the difference is whose hands it is in.\n\nYou start with a **Field Kit [0]** free with the class, the same way a Codebreaker starts with a Standard Smartdeck. *You must have your Rig equipped to use Triage Protocols.* Upgrading to a higher-tier Rig carries your Protocols and any modifications across.\n\n**Triage Save DC:** 8 + your Tech Modifier + your Rig's Output Bonus\n\n**Your Triage Pool.** Your maximum Triage equals your **Caliber + your Tech Modifier** (minimum 1). You regain all spent Triage at the end of a Short or Long Rest.\n\n**Triage Protocols.** At 1st Level, you learn four Triage Protocols. You learn two additional Triage Protocols at 5th Level through Expanded Triage.\n\n*Unless otherwise noted, all Triage Protocols cost 1 Triage to activate. Ranged protocols are delivered via your Rig's hardware, such as smart-darts or wireless auto-injector patches.*\n\n**The Scrap Rig.** During a Long Rest you can cobble a Scrap Rig together out of standard supplies using Medical and Engineering tools. A Scrap Rig counts as **Output Bonus +0** regardless of what you carried before, you suffer **Snag** on all Triage healing rolls and attack rolls, and any Triage Protocol that normally costs a Swift Action costs an Action instead.\n\n**Replacing a Rig.** Buy a replacement at its listed price, or build one during Downtime with access to a workshop, 250 \u{1D4A2} in chemical precursors, and a successful Medtech or Engineering Dice Pool check.";
var STITCHER_TRIAGE_TEXT = STITCHER_TRIAGE_INTRO + "\n\n" + STITCHER_TRIAGE_PROTOCOLS.map(function (p) {
  return "**" + p.name + " (" + p.action + "):** " + p.text;
}).join("\n\n");

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
    "1. Tech (Primary): Drives your Triage pool and powers your Medtech skill for stabilizing Allies, repairing cybernetics, and safely deploying complex treatments.",
    "2. Wits (Secondary): Powers your Investigation to diagnose strange ailments or analyze chemical environments.",
    "3. Agility (Tertiary): Gives you the Speed required to physically reach fallen Allies quickly and the Defense to survive the sprint."
  ],

  saveFocus: "Tech and Agility",

  resource: {
    name: "Triage",
    attribute: "Tech",
    maxFormula: "Your maximum Triage is equal to your Caliber + your Tech Modifier (minimum of 1).",
    refresh: "You regain all spent Triage at the end of a Short or Long Rest.",
    fuels: "Fuels medical synthesis and chemical warfare in equal measure.",
    hardware: "The Stitcher relies on a piece of equipment known as a Trauma Rig. This might be a cybernetic auto-injector gauntlet, an alchemical synthesizer harness, or a smart-medic backpack. The Rig rapidly mixes base reagents or standard medical supplies into potent, fast-acting chemical assets.\n\nYou start with a Field Kit [0] free with the class, the same way a Codebreaker starts with a Standard Smartdeck. You must have your Rig equipped to use Triage Protocols, and upgrading the Rig carries your Protocols and any modifications across.\n\nEvery Rig tier lists an Output Bonus, which is the third term of your Triage Save DC: 8 + your Tech Modifier + your Rig's Output Bonus. The Scrap Rig fallback, purchase, and Downtime crafting rules all live in the Level 1 Triage feature.",

    abilityNoun: "Triage Protocol",
    abilityNounPlural: "Triage Protocols",
    learn: { knowsAll: false, picks: [{ level: 1, count: 4 }, { level: 5, count: 2 }] },
    abilities: STITCHER_TRIAGE_PROTOCOLS
  },

  startingProficiencies: {
    // Dart Guns and Chem Spewers were never proficiency categories. A Dart Gun sits
    // under Sidearms, which this class already has; a Chem Spewer needs Heavy Weapons,
    // which this class does not get. Non-Toxicologist Stitchers therefore have no path
    // to the Chem Spewer, and that is intended: a Toxicologist gets chemical output
    // through the Spewer Rig instead.
    weapons: ["Simple Weapons", "Sidearms"],
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
        text: "Whenever you make an attack roll with a weapon that has the *Light* trait against an organic target, you may use your **Tech Modifier** instead of Agility or Body for the attack and damage rolls. The standard medical rules don't apply to you: any time you successfully use the *Stabilize* medical treatment on an Unconscious target, they awaken immediately and you may reduce their Fatigue by 1 level."
      },
      {
        name: "Stitcher Subclass",
        text: "You choose a Stitcher subclass, representing your clinical specialization. You gain all subclass features for which you meet the required Stitcher level, both now and as you advance. You may only select one subclass."
      }
    ],
    "2": [
      {
        name: "Universal Upgrade",
        text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute by 2, increase two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      },
      {
        name: "First Responder",
        text: "You gain **Edge** on all Initiative rolls. Your base movement Speed also increases by 2."
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
        text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute by 2, increase two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "5": [
      {
        name: "The Good Stuff",
        text: "Whenever you roll dice to restore Vitality or Vigor to an ally, you may roll the healing dice twice and use either total."
      },
      {
        name: "Expanded Triage",
        text: "You learn **two additional** Triage Protocols from the core list."
      }
    ],
    "6": [
      {
        name: "Preventative Care",
        text: "Once per round, when you use your Action to activate a Triage Protocol that restores Vitality or grants Vigor to an ally, you may immediately use your Swift Action to make a single standard attack with a Sidearm or Dart Gun. If this attack hits, the target suffers **Snag** on the next attack roll they make against the ally you just healed."
      },
      {
        name: "Universal Upgrade",
        text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute by 2, increase two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
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
        text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute by 2, increase two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements."
      }
    ],
    "9": [
      {
        name: "The Golden Hour",
        text: "Whenever an ally within 12 spaces falls Unconscious or suffers a Critical Condition from a hostile source, you immediately regain 1 spent Triage (this can't exceed your maximum). Any Triage Protocols you use on an Unconscious ally or an ally with a Critical Condition automatically roll the maximum possible result on their healing dice."
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
      description: "You're the white knight of the gutter. You specialize in trauma care, prioritizing stabilization, defensive shielding, and keeping the squad breathing no matter the cost. When a firefight turns into a slaughter, your medical expertise gives the wounded a chance to walk away.",
      features: [
        {
          level: 1,
          name: "Field Triage",
          text: "You gain the following benefits:\n\n• **Ranged Care:** When you use the Trauma Patch Triage Protocol, its range increases from melee reach to 6 spaces.\n• **Trauma Buffer:** Whenever you grant an ally Vigor, they gain an extra amount of Vigor equal to your Caliber.\n• **Forensic Pathology:** Out of combat, spend 10 minutes examining a biological subject (living or dead) to determine the exact cause and time of death, identify any toxins or diseases in their system, and assess their physical limitations or hidden injuries (making Medtech or Investigation Dice Pool checks if the GM rules the information is deliberately obfuscated).\n• **Beacon Rig:** You run the emitter mast open and let the rig broadcast. While it is broadcasting, allies within 3 spaces ignore the Speed reduction from being Bloodied, ignore the level of Fatigue they took for dropping to 0 Vitality, and roll Body Saves with **Edge**. That Fatigue isn't cured. It waits, and it lands the moment they step out of the broadcast or it goes quiet. You can't be Hidden while broadcasting, and anything with a scanner knows exactly where the medic is standing. Starting or stopping the broadcast is a **Free Action**. As an exception to the normal recovery rules, one ally who takes a Short Rest inside the broadcast reduces their Fatigue by 1 level."
        },
        {
          level: 3,
          name: "Clear!",
          text: "As an **Impulse Action** when an enemy within 3 spaces makes an attack against an ally, spend 1 Triage to fire a pair of electrode probes into them. The attacker must make a Body Save (DC = 8 + your Tech Modifier + your Rig's Output Bonus). On a failure, they take 2d8 Electric damage and are pushed 2 spaces away from your ally, automatically causing the attack to miss if they are pushed out of melee reach."
        },
        {
          level: 7,
          name: "Resuscitation Field",
          text: "As a **Swift Action**, spend 2 Triage to deploy an aerosolized healing field in an Area 3 centered on a point you can see within 12 spaces, lasting 1 minute. When any ally ends their turn inside the field, they gain Vigor equal to 1d6 + your Tech Modifier. The field also neutralizes airborne toxins, granting allies inside immunity to the Poisoned condition."
        },
        {
          level: 10,
          name: "Not on My Watch",
          text: "Once per Long Rest, as an **Action**, choose up to four allies within 12 spaces. Each regains all lost Vitality and immediately ends any of the following conditions affecting them: Bleeding, Burning, Dazed, Drowsy, Fatigue (all levels), Hallucinating, Paralyzed, Poisoned, Staggered, or Stunned. Any chosen ally currently at 0 Wounds (dead or dying) is revived and restored to half their maximum Wounds."
        }
      ]
    },
    {
      key: "the_toxicologist",
      name: "The Toxicologist",
      description: "Why fix a bullet wound when you can melt the gun? You view biology as a weapon, specializing in corrosive compounds, neurotoxins, and biochemical warfare. Every confrontation is an experiment, and your enemies are the test subjects. You bypass your equipment's safety limiters to synthesize and deliver lethal compounds in seconds.",
      features: [
        {
          level: 1,
          name: "Chemical Warfare",
          text: "You gain the following benefits:\n\n• **Spewer Rig:** You bypass the delivery limiters and fit a cone projector where the applicator arm used to sit. As an Action, spend 1 Triage to fire a Chemical Discharge. Every enemy in an Area 3 cone makes a Body Save against your Triage Save DC, taking 2d6 Toxic damage on a failure and half as much on a success. The discharge is indirect delivery and adds no Attribute Modifier to its damage.\n• **Corrosive Degradation:** Whenever you deal Toxic or Acid damage to an enemy, you ignore Toxic/Acid Resistance (but not Immunity). If you inflict the Poisoned condition on an enemy, they also suffer a -2 penalty to their Damage Reduction (DR) while Poisoned. This DR penalty doesn't stack with itself if the target is subject to multiple corrosive or poisonous effects.\n• **Chemical Breaching:** Out of combat, spend 1 minute applying corrosive gels with your Triage Rig to melt through standard locks, chains, chain-link fences, or thin metal plating, without triggering noise alarms or requiring a Dice Pool tool check."
        },
        {
          level: 3,
          name: "Contagion Catalyst",
          text: "Once per turn, when an enemy within 6 spaces fails a Save against one of your Triage Protocols or a weapon attack that deals Toxic damage, you can trigger a violent rupture dealing an additional 1d8 Toxic damage to that enemy. You may then spend Triage to spread the contagion:\n\n• **Directed Spread (1 Triage):** Choose one other enemy within 2 spaces of the primary target. It must make the same Save (type and DC) as the primary target. On a failure, it takes 1d8 Toxic damage and is Poisoned until the end of its next turn.\n• **Volatile Spread (2 Triage):** Each enemy within 1 space of the primary target must make the same Save (type and DC) as the primary target. On a failure, each takes 1d8 Toxic damage and is Poisoned until the end of its next turn."
        },
        {
          level: 7,
          name: "Neuro-Corrosive Cloud",
          text: "As an **Action**, spend 2 Triage to unleash a caustic cloud in an Area 4 centered on a point you can see within 12 spaces. The cloud heavily obscures the area and lasts 1 minute. When an enemy enters the cloud for the first time on a turn or starts its turn there, it must make a Body Save (DC = 8 + your Tech Modifier + your Rig's Output Bonus). On a failure, it takes 3d6 Acid damage and is Blinded until the end of its next turn. Allies who enter the cloud are unaffected."
        },
        {
          level: 10,
          name: "Biological Meltdown",
          text: "Once per Long Rest, as an **Action**, force one target within 12 spaces to make a Body Save (DC = 8 + your Tech Modifier + your Rig's Output Bonus).\n\n• **On a failure:** The target takes 8d10 Toxic damage and suffers severe necrosis. For 1 minute, it can't regain Vitality or Wounds and takes an additional 2d10 Toxic damage at the start of each of its turns.\n• **On a success:** It takes half the initial damage and suffers no ongoing effects.\n\nIf a target dies while under this necrosis, its body bursts, dealing 4d6 Acid damage to all other enemies within 2 spaces."
        }
      ]
    },
    {
      key: "the_ripper",
      name: "The Ripper",
      description: "You're a visionary cybernetic surgeon, operating in the bleeding-edge space where flesh meets chrome. From sterile corporate clinics to blood-stained underground chop shops, you don't just heal people; you upgrade them. You treat the nervous system like hackable hardware, tuning implants, salvaging scrap from the dead, and bypassing biological limiters to turn your crew into calibrated weapons.",
      features: [
        {
          level: 1,
          name: "Black Market Butcher",
          grants: { tools: ["Engineering Tools"] },
          text: "You gain Proficiency with Engineering Tools. If you spend 10 minutes extracting tech from a defeated enemy with cybernetics or the Machine Physiology trait, you harvest Cyber-Scrap. You also harvest organic salvage from defeated biological enemies (adrenal tissue, bio-gel), which is stored and used identically to Cyber-Scrap (including for Rig Fuel and Pawn It). You can hold Cyber-Scrap up to your Tech Modifier, and use it in two ways:\n\n• **Rig Fuel:** As an **Action**, break down a piece of Cyber-Scrap into your Trauma Rig to regain 1 spent Triage.\n• **Pawn It:** Sell Cyber-Scrap to fixers, merchants, or underground clinics for a modest payout (the exact \u{1D4A2} value is set by the GM based on the tier of the enemy it was harvested from).\n\n**Chop Rig:** Your Trauma Rig is a Chop Rig. Surgical arms on one side, a hopper on the other. It holds a body open and it eats what comes out. Harvesting Cyber-Scrap takes 1 minute instead of 10, you can hold Cyber-Scrap up to **twice your Tech Modifier**, and as an **Action** you can spend 1 Cyber-Scrap to apply an Aftermarket Hot-Wire to a willing ally within your melee reach. That tuning lasts until the end of the encounter and doesn't count against your usual number of Hot-Wires."
        },
        {
          level: 3,
          name: "Hot-Wired Implants",
          text: "Whenever you finish a Short or Long Rest, you can apply an Aftermarket Hot-Wire to a number of willing allies up to your Tech Modifier (minimum 1). An ally must possess cybernetics or the Machine Physiology trait, and the tuning must match their installed hardware (for example, you can't perform an Optical Overclock on organic eyes). The Machine Physiology trait meets every hardware requirement. An ally can have only one Hot-Wire at a time; it stays active until you finish your next Short or Long Rest, when you must recalibrate it or it powers down. Choose from the following tunings:\n\n• **Optical Overclock** *(requires Cyberoptics):* They ignore the defensive penalties of partial Cover when making ranged attacks, and they gain Darkvision up to 12 spaces.\n• **Dermal Reinforcement** *(requires Integument cyberware):* They gain a +1 bonus to Defense. The first time they take Wound damage during an encounter, the incoming damage is reduced by an amount equal to your Caliber.\n• **Pneumatic Bypass** *(requires Arms or Legs cyberware):* Their unarmed strike damage die increases by one size, and they gain Edge on in-combat Athletics checks to grapple, shove, or break objects.\n• **Synaptic Accelerator** *(requires Neural cyberware):* Their Speed increases by 1, and they gain a +2 bonus to Initiative.\n• **Recoil Compensator** *(requires Integument or Arms cyberware):* They ignore the penalties of wielding weapons with the Heavy or High Recoil trait, and they gain Edge on Body Saves against being knocked Prone.\n• **Adrenal Tuning** *(requires a living, organic ally; can't be applied to a fully synthetic body such as a Clanker):* Their Speed increases by 1, they gain a +1 bonus to Body Saves, and the first time each encounter they drop below half their maximum Vitality, they gain Vigor equal to your Caliber."
        },
        {
          level: 7,
          name: "Combat Overclock",
          text: "As a **Swift Action**, spend 2 Triage to jam an overclocking cocktail into yourself or a willing ally within your melee reach. Until the start of your next turn, the target's Speed is doubled, and whenever they take the Attack action they may make one additional attack as part of it. When the effect ends, the target gains the Drowsy condition and can't be affected by Combat Overclock again until they finish a Short or Long Rest."
        },
        {
          level: 10,
          name: "Cyber-Rejection",
          text: "Once per Long Rest, as an **Action**, force an enemy within 12 spaces to make a Body Save (DC = 8 + your Tech Modifier + your Rig's Output Bonus).\n\n• **On a failure:** For 1 minute, their Speed is halved, they suffer Snag on all attack rolls and physical saving throws, and they take 4d10 Toxic damage at the start of each of their turns. They may repeat the Save at the end of each of their turns to end the effect.\n• **On a success:** They take half the initial 4d10 damage and suffer no ongoing effects."
        }
      ]
    }
  ],

  extra: {
    playbook: {
      turnToTurn: "You dictate survival. You manage the physical condition of your team by cleansing debuffs, applying temporary health through Vigor, and keeping the front line in the fight.",
      winningEncounters: "You win by turning the war of attrition in your favor. You outpace the enemy by repairing your squad's damage on the fly, or you cripple the opposition's biology with targeted toxins and chemical warfare.",
      whatToAvoid: "Getting isolated. You're resilient, but your crew needs you within reach. Stay close enough to reinforce them, treat their injuries, or pull them out of danger."
    },
    triageProtocols: STITCHER_TRIAGE_PROTOCOLS.map(function (p) {
      return {
        name: p.name + (p.action ? " (" + p.action + ")" : ""),
        text: p.text
      };
    }),
    // The Ripper's Hot-Wire tunings in the Freelancer's Companion's (EN1101) words. The Machine
    // Physiology trait meets every hardware requirement below.
    aftermarketTunings: [
      {
        name: "Optical Overclock",
        requires: "Cyberoptics",
        text: "They ignore the defensive penalties of partial Cover when making ranged attacks, and they gain Darkvision up to 12 spaces."
      },
      {
        name: "Dermal Reinforcement",
        requires: "Integument cyberware",
        text: "They gain a +1 bonus to Defense. The first time they take Wound damage during an encounter, the incoming damage is reduced by an amount equal to your Caliber."
      },
      {
        name: "Pneumatic Bypass",
        requires: "Arms or Legs cyberware",
        text: "Their unarmed strike damage die increases by one size, and they gain Edge on in-combat Athletics checks to grapple, shove, or break objects."
      },
      {
        name: "Synaptic Accelerator",
        requires: "Neural cyberware",
        text: "Their Speed increases by 1, and they gain a +2 bonus to Initiative."
      },
      {
        name: "Recoil Compensator",
        requires: "Integument or Arms cyberware",
        text: "They ignore the penalties of wielding weapons with the Heavy or High Recoil trait, and they gain Edge on Body Saves against being knocked Prone."
      },
      {
        name: "Adrenal Tuning",
        requires: "a living, organic ally; can't be applied to a fully synthetic body such as a Clanker",
        text: "Their Speed increases by 1, they gain a +1 bonus to Body Saves, and the first time each encounter they drop below half their maximum Vitality, they gain Vigor equal to your Caliber."
      }
    ]
  }
};

EN.resourceRules = {
  general: "The Basics introduced class resources. These are the rules for running them.",

  maximumPool: "A class resource's maximum pool is determined by the formula listed in that class entry. Unless a rule says otherwise, a resource pool can't exceed its maximum.",

  minimumPool: "If a formula would give a class resource a value lower than 1, that pool becomes 1 instead.",

  spending: "When a class feature, maneuver, protocol, or exploit lists a cost, reduce your current pool by that amount immediately. If you don't have enough points remaining, you can't activate that ability.",

  /* NEW 2026-08-24, and it governs every class resource rather than one class: Overdrive,
     Leverage, Execution, Triage, Moxie and Bandwidth alike. Two readings are easy to get
     wrong. It is per ACTIVATION, not per turn (the book prints no per-turn spend cap
     anywhere, and Impulses fire on other people's turns), and it caps the SPEND, not the
     size of the pool. A Fury with 8 Overdrive and Caliber 4 can put 4 into one Overkill
     and 4 into another if they have the actions for it.

     IT DOES NOT REACH FLOW POINTS. Author ruling, 2026-08-24: FP is not a class resource in
     the sense this rule means, so neither the cap nor this rule applies to the Flow. That
     matters most for Invocation Scaling ("Each +1 FP spent increases one dimension by 1
     space"), which is a genuine variable spend with no printed ceiling and is deliberately
     uncapped. Recorded here because the omission looks like an oversight from the outside and
     invites exactly the wrong fix. Nothing in the app clamps FP by Caliber today: the Flow
     files reference Caliber nowhere, and `costVariable` exists on one Fury Maneuver, read only
     by the class-resource expansion the Shaper is already excluded from. Keep it that way. */
  variableCosts: "Some abilities let you spend more than 1 point at once. However, you can't spend more than your Caliber on a single activation. The pool is what you have. Caliber is how fast you can burn it.",

  refreshing: "Unless a class feature says otherwise, class resources refresh at the end of a Short Rest or Long Rest.",

  temporary: "Some effects grant temporary resource points. Temporary points can exceed your normal maximum only if the effect explicitly says so. If not spent by the listed expiration point, they are lost.",

  multiplePools: "If a Character somehow gains access to more than one class resource, track each pool separately. They never combine unless a rule explicitly says they do.",

  /* The Game Master's Toolkit, Class Resources (batches 44 to 50): two plain paragraphs, no label and no box.
     Admin only: the Codex prints them as prose after the seven rules above. Playtest audit r7 (author
     ruling 4): the Handbook prints "The Basics introduced class resources. These are the rules for
     running them." and then only the seven General Resource Rules, so the Core Concepts glossary, the
     per-class blocks (byClass) and the Resource Summary and Budget tables (budgetByLevel) are gone. */
  budgetGm: "Every class runs on its resource, and the resource sets the pace.\n\nA class with points in its pool is working at full strength. A class that has burned through its pool should still be functional, but it should feel meaningfully less explosive, less flexible, or less able to force momentum. Let rests matter. Let refill features matter. Don't casually strip a Character of access to their resource-defining gear, such as a Triage Rig or Smartdeck, unless the scene is built around that loss and provides a path to recover from it."
};
