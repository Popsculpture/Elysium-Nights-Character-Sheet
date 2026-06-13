/* ===========================================================================
   ELYSIUM NIGHTS — Gear catalog: Signature Weapons + Munitions
   Extracted verbatim from "Gear and Equipment → Signature Weapons" (Part 3).
   Prices in Glimmer (𝒢). Each Signature weapon is handled under a conventional
   weapon category (its Proficiency); untrained in that category you attack with
   Snag and cannot use its On Hit effects or area projections. `group` is the
   conventional category so the equip/attack logic treats them like any weapon.
   =========================================================================== */
window.EN = window.EN || {};
EN.gearCatalog = EN.gearCatalog || {};

EN.gearCatalog.signature = {
  intro: "Some weapons do a job and vanish back into the work. These do not. A Signature weapon is loud, strange, or unconventional enough that it becomes the thing people remember you by. You trade anonymity for presence. Some nights, presence is the most useful thing in your hands. Other nights it is a description on every screen in the district.",
  usingNote: "Each Signature Weapon is handled under a conventional weapon category (its Proficiency) and used exactly like any other weapon in that family. Untrained in that category, you attack with Snag and cannot use the weapon's On Hit effects or area projections. Proficient or better, you add your Weapon Proficiency Bonus. A Signature weapon has 0 customization slots — it arrives complete; its power lives in the wielder.",
  groupIntros: {
    melee: "Howling edges, kinetic mauls, and worn talons. Loud, strange, and unforgettable — the detail a witness leads with.",
    ranged: "Arc casters, chem spewers, coil drivers. Presence you can point down a hallway. The collateral is the receipt."
  },

  items: [
    /* ---- Melee ---- */
    { name: "Arc Glaive", signature: true, kind: "melee", group: "Martial", proficiency: "Martial Weapons",
      price: 800, damage: "1d10 Energy", range: "Melee (Reach 1)",
      traits: ["Reach 1", "Two-Handed", "Armor Piercing 1"], availability: "Rare", legality: "Contraband",
      desc: "A polearm haft that projects a blade of contained plasma where a cutting edge should be. It does not chip, dull, or care what you point it at. It cuts on the way out and on the way back, and it lights the corridor while it does." },
    { name: "Claws", signature: true, kind: "melee", group: "Simple", proficiency: "Simple Weapons",
      price: 80, damage: "1d4 Slashing", range: "Melee",
      traits: ["Light", "Finesse", "Worn"], availability: "Uncommon", legality: "Restricted",
      desc: "Reinforced claw caps or mounted talons, worn rather than held. They are always out, which is the point and the problem." },
    { name: "Gravlock Maul", signature: true, kind: "melee", group: "Martial", proficiency: "Martial Weapons",
      price: 750, damage: "2d6 Force", range: "Melee",
      traits: ["Heavy", "Two-Handed"], availability: "Rare", legality: "Restricted",
      desc: "A maul head packed with a kinetic discharge core. The swing is ordinary. The landing is a shockwave that throws everyone near the point of impact off their feet, including, on a bad grip, you.",
      effect: "On Hit: the target and anyone adjacent to it are pushed 1 space away from the point of impact. The target then makes a Body save vs your Weapon Save DC or is knocked Prone." },
    { name: "Harmonic Edge", signature: true, kind: "melee", group: "Martial", proficiency: "Martial Weapons",
      price: 650, damage: "1d8 Sonic", range: "Melee (Reach 1)",
      traits: ["Finesse", "Armor Piercing 2"], availability: "Rare", legality: "Restricted",
      desc: "A blade wrapped in sonic emitters that howl at a frequency just past hearing. It does not so much cut as shake a body apart at the seams. You feel the hum in your fillings from across the room.",
      effect: "On Hit: the target makes a Body save vs your Weapon Save DC or is Staggered until the end of its next turn." },
    { name: "Nanowire", signature: true, kind: "melee", group: "Martial", proficiency: "Martial Weapons",
      price: 700, damage: "1d8 Slashing", range: "Melee (Reach 2)",
      traits: ["Finesse", "Reach 2", "Concealable", "Armor Piercing 2"], availability: "Rare", legality: "Contraband",
      desc: "A spool of nanofilament thinner than sight, weighted at the tip and slung from a wrist housing. It cuts what it touches and most of what it passes near. Reads as jewelry right up until it does not." },
    { name: "Pile Driver", signature: true, kind: "melee", group: "Martial", proficiency: "Martial Weapons",
      price: 700, damage: "2d8 Piercing", range: "Melee",
      traits: ["Heavy", "Two-Handed", "Armor Piercing 3", "Slow", "Siege"], availability: "Rare", legality: "Restricted",
      desc: "A piston braced along the forearm that rams a hardened spike through whatever it touches, one brutal stroke at a time. Slow to reset, loud as a slammed vault door, and almost unfair against anything wearing plate.",
      effect: "On Hit: the strike drives the target 1 space straight back. The Slow trait holds you to one attack each round; this is the cost of a weapon that hits this hard." },
    { name: "Rip-Saw", signature: true, kind: "melee", group: "Martial", proficiency: "Martial Weapons",
      price: 500, damage: "2d6 Slashing", range: "Melee",
      traits: ["Heavy", "Two-Handed", "Continuous"], availability: "Uncommon", legality: "Restricted",
      desc: "A motorized cleaver with a chain edge that screams before it bites and keeps screaming after. Subtle as a fire alarm. Nobody who hears one ever forgets the sound.",
      effect: "On Hit: the target gains Bleeding (1d4 at the start of its turn) until the wound is tended. The Rip-Saw is deafening in use; its attacks are always loud and can never be silenced or made quiet by any means." },
    { name: "Slab Blade", signature: true, kind: "melee", group: "Martial", proficiency: "Martial Weapons",
      price: 650, damage: "2d10 Slashing", range: "Melee",
      traits: ["Heavy", "Two-Handed", "Slow"], availability: "Rare", legality: "Restricted",
      desc: "A slab of a blade too large to make tactical sense, swung anyway by someone strong enough, or stubborn enough, to make it work. It does not parry. It answers.",
      effect: "On Hit: the swing carries through. One target adjacent to the target you struck takes the weapon's damage as well. Slow holds you to one attack each round; with cyberware that raises your Body and a Body of 18 or higher, you ignore Slow on this weapon and attack as often as your other features allow." },

    /* ---- Ranged ---- */
    { name: "Arc Caster", signature: true, kind: "ranged", group: "Longarm", proficiency: "Longarms",
      price: 900, damage: "2d6 Electric", ammo: 10, range: "8 / 24",
      traits: ["Two-Handed", "Single Shot"], availability: "Rare", legality: "Restricted",
      desc: "A capacitor rifle that throws a controlled bolt of lightning, then lets it jump to whatever is standing too close to the first body. The flash leaves an afterimage. So does the smell.",
      effect: "On Hit: the bolt arcs to one additional target within 2 spaces of the first, dealing half damage. Each target struck makes a Body save vs your Weapon Save DC or is Staggered until the end of its next turn." },
    { name: "Chem Spewer", signature: true, kind: "ranged", group: "Heavy", proficiency: "Heavy Weapons",
      price: 1100, damage: "2d6 Toxic", ammo: 10, ammoUnit: "charges", range: "Cone",
      traits: ["Heavy", "Two-Handed", "Area 4 Cone", "Persistent", "Obscuring"], availability: "Rare", legality: "Contraband",
      desc: "A tank-fed projector that vomits a toxic cloud over a wide cone, then leaves the cloud behind to keep working.",
      effect: "On Hit: project the Area 4 Cone. Each target makes an Agility save vs your Weapon Save DC, taking full damage and Poisoned on a failure, half damage and no condition on a success. The cone leaves a lingering, lightly Obscuring cloud (Persistent) until the end of the encounter or until dispersed; anyone entering or starting its turn in it saves again or gains Poisoned." },
    { name: "Coil Driver", signature: true, kind: "ranged", group: "Heavy", proficiency: "Heavy Weapons",
      price: 1800, damage: "2d10 Ballistic", ammo: 8, range: "24 / 72",
      traits: ["Two-Handed", "Single Shot", "Armor Piercing 3", "Area 8 Line", "High Recoil"], availability: "Rare", legality: "Restricted",
      desc: "A shoulder-braced magnetic accelerator that flings a tungsten slug fast enough to ignore most of what gets in the way: armor, cover, and whoever is unlucky enough to be standing behind the person you aimed at.",
      effect: "On Hit: choose a target in range and a straight line from you through it, out to the Area 8 Line. Make one attack roll against the first target; on a hit it takes full damage. Everyone in the line makes an Agility save vs your Weapon Save DC, taking full damage on a failure and half on a success. Armor Piercing 3 applies to all of them." },
    { name: "Cryo Lance", signature: true, kind: "ranged", group: "Longarm", proficiency: "Longarms",
      price: 1000, damage: "2d6 Cold", ammo: 12, ammoUnit: "charges", range: "Line",
      traits: ["Two-Handed", "Area 6 Line", "Continuous"], availability: "Rare", legality: "Restricted",
      desc: "A focused cryo beam that paints a lane of the room in frost. People do not drop. They slow, they stiffen, and if you hold the beam on them long enough, they stop.",
      effect: "On Hit: project the Area 6 Line. Everyone in the line makes a Body save vs your Weapon Save DC for half damage; on a failure their Speed is halved until the end of its next turn. Continuous: sustain the beam on later rounds by spending another charge and the same Action. Anyone that fails this save on two consecutive rounds is Restrained, frozen in place, until it breaks free (an Action and a Body check vs your Weapon Save DC) or the ice is shattered." },
    { name: "Flamethrower", signature: true, kind: "ranged", group: "Heavy", proficiency: "Heavy Weapons",
      price: 1200, damage: "2d6 Fire", ammo: 20, ammoUnit: "fuel", range: "Cone",
      traits: ["Heavy", "Two-Handed", "Area 3 Cone", "Incendiary", "Continuous"], availability: "Rare", legality: "Restricted",
      desc: "A fuel-hungry projector that turns a cone of air into a wall of fire, and leaves people burning after the stream stops.",
      effect: "On Hit: project the Area 3 Cone, spending 4 fuel. Each target makes an Agility save vs your Weapon Save DC for half damage; on a failure they also gain Burning (1d6 Fire at the start of their turn) for 1d4 rounds or until extinguished. Continuous: sustain the stream on a later round by spending 4 more fuel and the same Action." },
    { name: "Harpoon Gun", signature: true, kind: "ranged", group: "Bowfire", proficiency: "Bowfire Weapons",
      price: 500, damage: "1d10 Piercing", ammo: 4, range: "6 / 12",
      traits: ["Two-Handed", "Single Shot"], availability: "Uncommon", legality: "Restricted",
      desc: "A barbed spear on a powered reel. Spear someone and the line decides who comes to whom. Good for pulling a runner off a ledge, and just as good for pulling yourself onto one.",
      effect: "On Hit: the harpoon embeds and the line stays taut. On following turns you may spend a Swift Action to drag the target up to 4 spaces toward you (it may resist with a Body check vs your Weapon Save DC), or, if the harpoon struck a fixed heavy anchor, pull yourself up to 4 spaces toward it. The line can be cut with an Action." },
    { name: "Net Launcher", signature: true, kind: "ranged", group: "Thrown", proficiency: "Thrown Weapons",
      price: 350, damage: "0", ammo: 4, ammoUnit: "nets", range: "4 / 8",
      traits: ["Two-Handed", "Single Shot", "Nonlethal"], availability: "Uncommon", legality: "Restricted",
      desc: "A stubby launcher that throws a weighted tangle-net. The clean way to end a chase without ending a life, assuming the net lands. The kind of thing a bounty crew gets known for.",
      effect: "On Hit: the target makes an Agility save vs your Weapon Save DC or is Restrained. Anyone Restrained by the net can spend an Action on a Body check (DC = your Weapon Save DC) to tear free, or an ally can cut them loose." },
    { name: "Pulse Laser", signature: true, kind: "ranged", group: "Longarm", proficiency: "Longarms",
      price: 1200, damage: "1d10 Energy", ammo: 20, range: "16 / 48",
      traits: ["Two-Handed", "Semi-Automatic"], availability: "Rare", legality: "Restricted",
      desc: "A directed-energy carbine that fires bolts of coherent light. No muzzle climb, no recoil, no brass on the floor. Just a clean line from barrel to target and a scorch where it lands.",
      effect: "On Hit: the beam ignores the Defense bonus granted by Half Cover." }
  ],

  /* Munitions — bespoke consumables; all Counted (track each unit). The melee
     signatures carry no munitions; their cells and edges recharge between contracts. */
  munitionsIntro: "Most signatures run on bespoke consumables: tanks, cells, slugs, and nets no off-the-shelf vendor carries. All of it is Counted — track each unit from the moment you buy it to the moment you spend it.",
  munitions: [
    { name: "Harpoons", group: "Signature Munition", price: 40, unit: "per 4", availability: "Uncommon", legality: "Restricted",
      feeds: "Harpoon Gun", desc: "Barbed spears on a respooled line. Reusable if recovered." },
    { name: "Tangle-Nets", group: "Signature Munition", price: 60, unit: "per 4", availability: "Uncommon", legality: "Restricted",
      feeds: "Net Launcher", desc: "Weighted capture nets. Reusable if recovered intact." },
    { name: "Fuel Cell", group: "Signature Munition", price: 60, unit: "per 20", availability: "Rare", legality: "Restricted",
      feeds: "Flamethrower", desc: "A pressurized fuel cell, 20 fuel. Hazardous to carry, worse to shoot." },
    { name: "Chem Canister", group: "Signature Munition", price: 80, unit: "per 10", availability: "Rare", legality: "Contraband",
      feeds: "Chem Spewer", desc: "A sealed refill of toxic agent, 10 charges. Contraband, like the weapon it feeds." },
    { name: "Power Cell", group: "Signature Munition", price: 80, unit: "each", availability: "Rare", legality: "Restricted",
      feeds: "Pulse Laser, Arc Caster, Cryo Lance", desc: "A fresh charge cell. Slots into any one of these and refills it to full." },
    { name: "Coil Slugs", group: "Signature Munition", price: 120, unit: "per 8", availability: "Rare", legality: "Restricted",
      feeds: "Coil Driver", desc: "Dense tungsten slugs for the accelerator." }
  ],

  /* Trait glossary — verbatim from the Signature section so it runs on its own */
  traits: {
    "Area X": "Some effects fill a space and catch whatever is standing in it. The number is the size in spaces; the word after gives the shape — Sphere (burst), Cone (spreads from you), Line (X long, 1 wide), Cube, or Aura. Targets caught usually save for half or no damage; roll the effect's damage once and apply it to everyone the area touches.",
    "Armor Piercing X": "On a hit, ignore X points of flat damage reduction from armor or similar gear for that attack. Does not affect Resistances or Immunities unless a rule says so.",
    "Concealable": "Attacks and operation work as normal. Checks to detect the weapon on a casual search are made with Snag.",
    "Continuous": "Once you begin the attack, you can repeat it on later rounds by spending the required ammo and Action — no need to fully re-ready or reprime the weapon between those rounds.",
    "Finesse": "When attacking with a Finesse weapon, you may use Body or Agility for the attack and damage. You choose which each time you attack.",
    "Heavy": "Dense, reinforced, and awkward to swing or fire. Adds to encumbrance, interacts with rules penalizing low Body, usually unsuitable for off-hand or dual-wield use, and a poor fit for nimble, stealth-focused Freelancers.",
    "High Recoil": "Multiple attacks with the same weapon in one round apply Snag to later attacks unless braced or supported.",
    "Incendiary": "Deals Fire and leaves fire behind — a struck target may catch Burning, or it may leave a burning zone. Readily ignites fuel, flammable cover, and environmental hazards.",
    "Light": "Compact and easy to handle in one hand. Interacts with dual-wield and off-hand rules and contributes minimally to encumbrance; can be carried discreetly without counting as Concealable.",
    "Nonlethal": "If damage from this weapon reduces a Target to 0 Wounds, that Target is immediately rendered Unconscious and stable, rather than dying or bleeding out.",
    "Obscuring": "Areas affected count as heavily obscured for sight-based targeting. Targets inside are harder to hit with attacks that need clear visual contact.",
    "Persistent": "Leaves behind a lingering hazard or field. A Target entering or starting its turn in the zone usually saves or takes the listed damage or effect; the entry gives duration and exact effect.",
    "Reach X": "Extends your melee threat beyond arm's length. You can attack Targets up to 1 space farther per point of Reach (Reach 1 = up to 2 spaces). Any rule referencing 'entering your reach' uses this extended distance.",
    "Semi-Automatic": "After you attack with this weapon, you may spend a Swift Action to make one Follow-Up Attack: a single additional shot against the same or a different target. The Follow-Up Attack does not add your Attribute modifier to its damage.",
    "Siege": "Deals double damage to Vehicle armor and to Cover Integrity. If an attack destroys a piece of cover, overflow damage applied to the Target behind it ignores their personal armor Damage Reduction.",
    "Single Shot": "Make a single attack against one Target for 1 round of ammo. If Single Shot is a weapon's only firing mode, its attacks score a critical hit on a roll of 19 or 20.",
    "Slow": "You can make only one attack per round with this weapon, regardless of extra-attack features, unless something explicitly overrides it.",
    "Two-Handed": "Requires both hands for effective use. Using it one-handed applies heavy penalties — typically Snag on attacks and a downgraded damage die — unless you have a specific feature or powered assistance.",
    "Worn": "Built to attach to the body, clothing, or armor rather than be held. Cannot be easily dropped or disarmed; may take time, tools, or a specific action to equip or remove. Counts as equipped gear for any effect that checks what you are wearing or bearing."
  }
};
