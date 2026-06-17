/* ===========================================================================
   ELYSIUM NIGHTS · Gear catalog: Melee Weapons
   Extracted verbatim from "Gear and Equipment" (Part 3). Prices in Glimmer (𝒢)
   and assume purchase in a major district. Availability: Common / Uncommon /
   Rare. Legality: Legal / Licensed / Restricted / Contraband.
   =========================================================================== */
window.EN = window.EN || {};
EN.gearCatalog = EN.gearCatalog || {};

EN.gearCatalog.melee = {
  intro: "Some fights end with sirens and a clean exit. More end at arm's length, in a service corridor or a back alley, with one of these in your hand. Melee weapons are what you reach for when distance has already collapsed.",
  simpleIntro: "Clubs, kitchen blades, hatchets, short spears. The gear that ends up in a fight because it was already in the room, in the toolbelt, or in the kitchen drawer. No manual, no specialist training, just weight and intent.",
  martialIntro: "The weapons that ask for training before they answer back. Swords, axes, polearms, the heavier melee work that rewards a few years of drill over a few minutes of swinging.",

  items: [
    /* ---- Simple ---- */
    { name: "Baton", group: "Simple", price: 20, damage: "1d6 Bludgeoning", range: "Melee",
      traits: ["Light", "Nonlethal"], availability: "Common", legality: "Legal",
      desc: "A length of solid composite, weighted at one end. Designed to put people on the floor without putting them in the morgue. Standard kit for bouncers, private security, and patrol officers across every district." },
    { name: "Dagger", group: "Simple", price: 25, damage: "1d4 Piercing", range: "Melee or thrown 4 / 12",
      traits: ["Light", "Finesse", "Thrown (4/12)"], availability: "Common", legality: "Legal",
      desc: "A proper combat blade, balanced for the hand and balanced for the throw. The serious cousin of a kitchen knife, sold in a sheath instead of a drawer." },
    { name: "Hammer", group: "Simple", price: 20, damage: "1d6 Bludgeoning", range: "Melee or thrown 4 / 12",
      traits: ["Light", "Thrown (4/12)"], availability: "Common", legality: "Legal",
      desc: "A workshop hammer. Ends up in fights because it was already in the hand when the fight started. Throws like a brick with a handle, which is sometimes enough." },
    { name: "Hatchet", group: "Simple", price: 30, damage: "1d6 Slashing", range: "Melee or thrown 4 / 12",
      traits: ["Light", "Thrown (4/12)"], availability: "Common", legality: "Legal",
      desc: "A camping tool, a wood-splitter, a backpack mainstay. Light enough to throw, heavy enough to bite when it lands." },
    { name: "Knife", group: "Simple", price: 10, damage: "1d4 Slashing", range: "Melee or thrown 4 / 12",
      traits: ["Light", "Finesse", "Thrown (4/12)", "Concealable"], availability: "Common", legality: "Legal",
      desc: "Every kitchen has one. Every pocket can hold one. The most common weapon in Elysium, and the one most underestimated when it slides out of a sleeve." },
    { name: "Knuckles", group: "Simple", price: 15, damage: "1d4 Bludgeoning", range: "Melee",
      traits: ["Light", "Concealable"], availability: "Common", legality: "Restricted",
      desc: "Composite or alloy bands that turn a punch into a hospital visit. Easy to hide. Harder to explain when a patrol officer flips your jacket open.",
      effect: "Augments unarmed strikes. While wearing Knuckles, your unarmed attacks deal 1d4 Bludgeoning damage instead of their base unarmed damage." },
    { name: "Quarterstaff", group: "Simple", price: 60, damage: "1d6 Bludgeoning", range: "Melee (Reach 1)",
      traits: ["Reach 1", "Two-Handed", "Versatile (1d8)"], availability: "Common", legality: "Legal",
      desc: "A length of tough wood or composite pole, hip-high to head-high depending on the wielder. Street monks, crowd-control drills, and old-school brawlers all swear by it for reach and discipline." },
    { name: "Shock Gloves", group: "Simple", price: 100, damage: "Unarmed + 1d4 Electric", range: "Melee",
      traits: ["Light", "Finesse", "Nonlethal", "Shock"], availability: "Uncommon", legality: "Restricted",
      desc: "Reinforced gloves wired to a discharge core in the cuff. Your fists hit normally. The charge does the rest, and the lights in the room flicker once when it does.",
      effect: "Augments unarmed strikes. On a hit, you deal your normal unarmed strike damage plus an additional 1d4 Electric damage." },
    { name: "Snap-Blades", group: "Simple", price: 150, damage: "1d6 Slashing", range: "Melee",
      traits: ["Light", "Finesse", "Concealable"], availability: "Uncommon", legality: "Restricted",
      desc: "Hidden blades that ride along the forearm until a flick of the wrist sends them out. Quiet to carry, and a bad answer to a casual search." },
    { name: "Spear", group: "Simple", price: 40, damage: "1d6 Piercing", range: "Melee (Reach 1) or thrown 4 / 12",
      traits: ["Reach 1", "Thrown (4/12)", "Versatile (1d8)"], availability: "Common", legality: "Legal",
      desc: "A full-length shaft with a reinforced point. As old as war itself, still good at it, and still cheap enough that you can lose three in an alley and not feel it." },
    { name: "Stun Baton", group: "Simple", price: 120, damage: "1d6 Bludgeoning", range: "Melee",
      traits: ["Nonlethal", "Shock"], availability: "Uncommon", legality: "Restricted",
      desc: "A baton wrapped around a powered shock core. Standard issue for security teams that would rather walk arrests in than carry corpses out. The hum gives it away across a quiet room." },

    /* ---- Martial ---- */
    { name: "Axe", group: "Martial", price: 100, damage: "1d10 Slashing", range: "Melee",
      traits: ["Heavy", "Versatile (1d12)"], availability: "Common", legality: "Licensed",
      desc: "A combat axe, head-heavy and built to bite. One-handed when you need a free hand for a sidearm or a doorframe. Two-handed when you need the bite to count." },
    { name: "Greatsword", group: "Martial", price: 180, damage: "2d6 Slashing", range: "Melee",
      traits: ["Heavy", "Two-Handed"], availability: "Uncommon", legality: "Licensed",
      desc: "A long two-handed blade meant for open spaces and decisive swings. The kind of weapon people step back from before the swing even starts." },
    { name: "Halberd", group: "Martial", price: 120, damage: "1d10 Slashing", range: "Melee (Reach 1)",
      traits: ["Heavy", "Reach 1", "Two-Handed"], availability: "Common", legality: "Licensed",
      desc: "A two-handed polearm with a chopping head, a spike, and a hook. Designed in another century for breaking armor. Redesigned in this one for breaking exosuits." },
    { name: "Katana", group: "Martial", price: 200, damage: "1d8 Slashing", range: "Melee",
      traits: ["Finesse", "Quick Draw", "Versatile (1d10)"], availability: "Uncommon", legality: "Licensed",
      desc: "A curved single-edge blade, often customized to show lineage or faction. Light in the hand to favor speed, weighted toward the tip to favor the cut. The kind of weapon that gets drawn once per fight, because once is usually enough." },
    { name: "Longsword", group: "Martial", price: 150, damage: "1d8 Slashing", range: "Melee",
      traits: ["Defensive", "Versatile (1d10)"], availability: "Uncommon", legality: "Licensed",
      desc: "The straight-bladed sword of disciplined fighters. Cross-guard for parrying, balanced for both edge and point, built to last a long career and several owners after. Practiced hands work it as easily on defense as on offense." },
    { name: "Maul", group: "Martial", price: 140, damage: "2d6 Bludgeoning", range: "Melee",
      traits: ["Heavy", "Two-Handed"], availability: "Common", legality: "Licensed",
      desc: "A two-handed sledge built purely to smash whatever stands in front of it. Subtle as a freight elevator. Effective for the same reason." },
    { name: "Rapier", group: "Martial", price: 90, damage: "1d8 Piercing", range: "Melee",
      traits: ["Finesse"], availability: "Uncommon", legality: "Licensed",
      desc: "A narrow thrusting sword. Built for precision instead of brute force, and for the kind of fight where one hand is busy holding something else: a drink, a knife, a railing, a stolen file." },
    { name: "Saber", group: "Martial", price: 70, damage: "1d6 Slashing", range: "Melee",
      traits: ["Light", "Finesse"], availability: "Common", legality: "Licensed",
      desc: "A light, curved blade meant for fast cuts and quicker repositioning. Cavalry weapon by heritage, dueling sword by habit." },
    { name: "Shortsword", group: "Martial", price: 60, damage: "1d6 Piercing", range: "Melee",
      traits: ["Light", "Finesse"], availability: "Common", legality: "Licensed",
      desc: "A compact fighting blade. Quick from the draw, comfortable in tight quarters, easily paired with a second weapon or a free hand." },
    { name: "Warhammer", group: "Martial", price: 100, damage: "1d8 Bludgeoning", range: "Melee",
      traits: ["Armor Piercing 1", "Versatile (1d10)"], availability: "Common", legality: "Licensed",
      desc: "A reinforced head on a fighting haft, built to dent plate and crack exosuit ceramic. The bludgeon that beats armor for a living." },
    { name: "Whip", group: "Martial", price: 50, damage: "1d4 Slashing", range: "Melee (Reach 2)",
      traits: ["Finesse", "Reach 2"], availability: "Common", legality: "Licensed",
      desc: "A long lash of braided polymer, weighted for cutting arcs and distance control. Doesn't kill quickly. Sometimes that's the point." }
  ],

  /* Weapon trait glossary (melee), verbatim effects */
  traits: {
    "Armor Piercing X": "On a hit, ignore X points of flat damage reduction from armor or similar gear for that attack. Does not affect Resistances or Immunities unless a rule explicitly says otherwise.",
    "Concealable": "Attacks and use work normally. Checks to detect the weapon on a casual search are made with Snag.",
    "Defensive": "When you are targeted by a melee attack while wielding this weapon, and you are not Surprised, Restrained, or Incapacitated, you may spend an Impulse Action to impose Snag on the attack.",
    "Finesse": "When making an in-combat d20 attack or an out-of-combat Dice Pool attack with a Finesse weapon, you may use Body or Agility for the attack and damage calculation. You choose which Attribute each time you make an attack.",
    "Heavy": "Heavy weapons add to overall encumbrance and cannot be used effectively off-hand or in dual wield without a specific feature or powered assistance.",
    "Light": "Light weapons interact with dual wield and off-hand fighting rules and contribute minimally to encumbrance. They can be carried discreetly under loose clothing without counting as Concealable.",
    "Nonlethal": "If damage from this weapon reduces a Target to 0 Wounds, that Target is immediately rendered Unconscious and stable, rather than dying or bleeding out.",
    "Quick Draw": "Drawing this weapon from a sheath or harness costs no additional action when made as part of an attack. The first attack you make in a combat encounter with a Quick Draw weapon drawn this way gains Edge.",
    "Reach X": "Each point of Reach extends the weapon's attack distance by 1 space beyond your normal melee reach.",
    "Shock": "On a hit against an organic, cyber-augmented, or robotic Target, that Target must make an in-combat Body d20 save (DC 12). On a failure, they gain the Staggered condition until the end of their next turn.",
    "Thrown": "Uses the weapon's listed thrown range, given in short / long format. When you make a thrown attack, you generally choose Body or Agility as the governing Attribute. A thrown weapon must be retrieved or replaced after use.",
    "Two-Handed": "Requires both hands for effective use. Using a Two-Handed weapon one-handed applies heavy penalties (typically Snag on attacks and a downgraded damage die) unless you have a specific feature or powered assistance.",
    "Versatile": "The weapon lists an alternate damage die in parentheses. Use the base damage when wielded in one hand, and the Versatile damage when wielded in two hands."
  }
};
