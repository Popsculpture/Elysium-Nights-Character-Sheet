/* ===========================================================================
   ELYSIUM NIGHTS · Armor Customization (Armor Mods catalog)
   The Impact Table data: after-market Armor Mods for Modular armor. Armor Mods
   have no named slots (slots are generic) and are all bench work. Only Modular
   armor takes them, up to its Mod Slot count; Integrated + Modular carries +1
   slot (already folded into each suit's `slots` value in gear_armor.js).
   Prices in Glimmer. Legality is the strictest tag among the suit and its mods.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.armorMods = {

  intro: "A suit off the rack keeps you alive once. After that you pay someone to make it personal. Armor Mods are the after-market: trauma plates, camo weave, a stim rig wired to fire the moment your Vigor runs out.",

  /* ---- mod groups (for the market + bench sections) --------------------- */
  categories: [
    { key: "plating",       name: "Plating & Protection",   blurb: "Answer incoming damage with mass, a layer built to die, or plate that bites back when you brace." },
    { key: "environmental", name: "Environmental & Sealing", blurb: "Elysium kills with its air as often as its bullets. Keep the outside outside." },
    { key: "stealth",       name: "Stealth & Signature",     blurb: "Beat the eyes or beat the sensors; rarely the same person reading both." },
    { key: "sensors",       name: "Sensors & Targeting",     blurb: "Let the suit watch the room, and let it talk to the gun in your hands." },
    { key: "mobility",      name: "Mobility & Frame",        blurb: "Buy back some speed, reach surfaces a body should not, spread the load off your spine." },
    { key: "survival",      name: "Survival & Medical",      blurb: "Keep fighting past the point your body votes to stop, and tell your crew where you fell." },
    { key: "power",         name: "Power & Countermeasures", blurb: "Harden the computer you wear, let it repair itself, and answer a hit with something worse." },
    { key: "mystech",       name: "Mystech Augments",        blurb: "Flow gear for Mystech shells only. Reads as Flow-touched; needs a specialist to fit, repair, and recharge." }
  ],

  /* ---- the catalog ------------------------------------------------------
     No `slot` (slots are generic) and no partType (every Armor Mod is bench work).
     fits: Any | Plated | Sealed | Powered | Mystech | "Loud or Powered" | "Bulky non-Powered"
     rarity carries the item's Availability; Mystech mods use the Mystech scale.   */
  mods: [

    /* ---- Plating & Protection ---- */
    { key: "trauma-plates", name: "Trauma Plates", category: "plating", price: 400, rarity: "Uncommon", legality: "Legal", fits: "Any",
      grants: "+1 DR", effect: "Grants +1 Damage Reduction. Flat DR from mods does not stack; if you run a second flat-DR mod, only the higher applies. It does stack with your suit's base DR and DR from cyberware or the Flow." },
    { key: "ablative-coating", name: "Ablative Coating", category: "plating", price: 450, rarity: "Uncommon", legality: "Licensed", fits: "Any",
      grants: "Resistance to one physical type", effect: "Choose Ballistic, Piercing, Slashing, or Bludgeoning at install; you gain Resistance to that type. The first time each scene a hit of that type would carry through to your Wounds, the coating burns away instead (ignore that damage), then it grants no Resistance until you re-layer it in downtime." },
    { key: "reactive-plating", name: "Reactive Plating", category: "plating", price: 550, rarity: "Uncommon", legality: "Restricted", fits: "Plated",
      grants: "+1d6 to Block", effect: "When you Block, add +1d6 to the damage prevented. Stacks with the Plated trait's Block benefit, the suit's listed Block Bonus, and shield dice. Applies only when you Block." },

    /* ---- Environmental & Sealing ---- */
    { key: "rebreather-liner", name: "Rebreather Liner", category: "environmental", price: 250, rarity: "Common", legality: "Licensed", fits: "Any",
      grants: "Sealed benefit", effect: "The suit counts as Sealed: Resistance to Toxic damage and Edge on saves against gas, disease, and airborne or environmental hazards. Does not cover vacuum. If the suit is already Sealed, it instead upgrades that seal to hold against vacuum." },
    { key: "thermal-regulation-weave", name: "Thermal Regulation Weave", category: "environmental", price: 400, rarity: "Uncommon", legality: "Licensed", fits: "Any",
      grants: "Resistance to Fire or Cold", effect: "Choose Fire or Cold at install; you gain Resistance to that type and ignore Snag from extreme environmental heat or cold of that kind." },

    /* ---- Stealth & Signature ---- */
    { key: "acoustic-baffles", name: "Acoustic Baffles", category: "stealth", price: 200, rarity: "Common", legality: "Legal", fits: "Loud or Powered",
      grants: "Removes Loud", effect: "The suit loses the Loud trait. On Powered armor, which cannot shed its own frame noise entirely, it instead ignores the Loud Stealth penalty so long as you move at half your Speed or less." },
    { key: "signature-damper", name: "Signature Damper", category: "stealth", price: 600, rarity: "Uncommon", legality: "Restricted", fits: "Any",
      grants: "Snag on scans of your gear", effect: "Scanners, sensors, and tag readers checking for your armor, weapons, or cyberware roll with Snag (or add +1 Snag Die against out-of-combat detection Dice Pools). A physical pat-down still finds anything it can touch." },
    { key: "chameleon-weave", name: "Chameleon Weave", category: "stealth", price: 900, rarity: "Rare", legality: "Restricted", fits: "Any",
      grants: "Active camouflage", effect: "Edge on in-combat Stealth d20 checks (or +1 Edge Die out of combat). While you hold still or move at half your Speed or less, you can attempt to hide even with no cover. Moving at full Speed, attacking, or being struck drops the camouflage until you reset it at the start of a later turn." },

    /* ---- Sensors & Targeting ---- */
    { key: "threat-detection-hud", name: "Threat-Detection HUD", category: "sensors", price: 500, rarity: "Uncommon", legality: "Licensed", fits: "Any",
      grants: "Edge on Initiative; ambush warning", effect: "Edge on Initiative checks. You cannot be Surprised by a hostile your sensors can detect, and you gain Edge on Awareness checks to notice hidden threats, traps, and stalkers." },
    { key: "smartlink-relay", name: "Smartlink Relay", category: "sensors", price: 600, rarity: "Uncommon", legality: "Restricted", fits: "Any",
      grants: "Counts as a Smartlink", effect: "The suit counts as a Smartlink for any weapon part or system that requires one. If you already have a Smartlink implant, the relay grants no additional benefit." },

    /* ---- Mobility & Frame ---- */
    { key: "load-distributor", name: "Load Distributor", category: "mobility", price: 200, rarity: "Common", legality: "Legal", fits: "Any",
      grants: "Encumbrance threshold +1 step", effect: "Your Encumbrance threshold counts as one step higher. Does not stack with the Load-Bearing trait; if the suit already has it, take the single step." },
    { key: "drop-dampeners", name: "Drop Dampeners", category: "mobility", price: 250, rarity: "Common", legality: "Legal", fits: "Any",
      grants: "Reduced fall damage", effect: "You take half damage from falling, and you ignore the first 2 spaces of any fall when calculating that damage." },
    { key: "gecko-grips", name: "Gecko Grips", category: "mobility", price: 350, rarity: "Uncommon", legality: "Licensed", fits: "Any",
      grants: "Climb sheer surfaces", effect: "You can climb sheer and overhanging surfaces at half your Speed without a check on stable material, and you gain Edge on Athletics checks to climb unstable, wet, or crumbling surfaces." },
    { key: "servo-weave", name: "Servo Weave", category: "mobility", price: 700, rarity: "Uncommon", legality: "Restricted", fits: "Bulky non-Powered",
      grants: "Ignore Bulky Speed loss", effect: "You ignore the Speed reduction from the Bulky trait. Requires a power cell. A Powered frame already does this through its Powered Benefits, so this mod offers it nothing." },

    /* ---- Survival & Medical ---- */
    { key: "vitals-beacon", name: "Vitals Beacon", category: "survival", price: 150, rarity: "Common", legality: "Legal", fits: "Any",
      grants: "Crew location and status link", effect: "Allies with a compatible link always know your location and a coarse status (active, wounded, down) within the same district. At 0 Vitality the beacon broadcasts your last position. The signal can be detected, traced, or intercepted by anyone with the means and the reason." },
    { key: "coagulant-mesh", name: "Coagulant Mesh", category: "survival", price: 300, rarity: "Common", legality: "Licensed", fits: "Any",
      grants: "One Bleeding negate per scene", effect: "The first time each scene you would gain the Bleeding condition, you do not. After that the mesh is spent, and Bleeding affects you normally until you re-pack it in downtime." },
    { key: "trauma-stim-injector", name: "Trauma Stim Injector", category: "survival", price: 550, rarity: "Uncommon", legality: "Restricted", fits: "Any",
      grants: "Auto-stim at 0 Vigor", effect: "Once per scene, the instant you are reduced to 0 Vigor, the injector fires: regain 1d6+2 Vigor and ignore Snag from pain and injury until the end of your next turn. The cartridge is then spent until you refill it in downtime." },

    /* ---- Power & Countermeasures ---- */
    { key: "faraday-lining", name: "Faraday Lining", category: "power", price: 450, rarity: "Uncommon", legality: "Licensed", fits: "Any",
      grants: "Edge vs hacking and EMP", effect: "Edge on saves to resist hacking, EMP, and electronic intrusion targeting your worn gear or cyberware while the suit is sealed against you." },
    { key: "self-seal-nanopaste", name: "Self-Seal Nanopaste", category: "power", price: 500, rarity: "Uncommon", legality: "Licensed", fits: "Any",
      grants: "Self-repairing shell", effect: "The suit never requires routine maintenance and self-repairs cosmetic and minor functional damage at the end of each scene at no cost. It does not restore DR mid-fight and does not settle Upkeep on Leased gear." },
    { key: "reactive-countermeasures", name: "Reactive Countermeasures", category: "power", price: 650, rarity: "Rare", legality: "Restricted", fits: "Any",
      grants: "Vents smoke or dazzle on a hit", effect: "Choose smoke or dazzle at install. Once per scene, when hit, you may vent the charge as an Impulse. Smoke: you and adjacent allies gain concealment until the start of your next turn. Dazzle: the attacker makes a Body or Wits save (chosen at install) or attacks with Snag until the end of its next turn." },
    { key: "sentinel-active-defense", name: "Sentinel Active Defense", category: "power", price: 0, upkeep: 90, rarity: "Uncommon", legality: "Licensed", fits: "Any",
      grants: "Leased point-defense", effect: "While the plan is current, once per round when hit by a Ranged attack, reduce that attack's damage by 1d6 as the system intercepts. Lapsed or Locked: the rig goes dark and grants nothing until you settle the account or crack the lock." },

    /* ---- Mystech Augments (Mystech armor only) ---- */
    { key: "resonance-dampener", name: "Resonance Dampener", category: "mystech", price: 700, rarity: "Iconic", legality: "Contraband", fits: "Mystech",
      grants: "Resistance to Resonant", effect: "You gain Resistance to Resonant damage." },
    { key: "echo-shroud", name: "Echo Shroud", category: "mystech", price: 800, nexus: "◎0.3", rarity: "Legendary", legality: "Contraband", fits: "Mystech",
      grants: "Hides your Flow signature", effect: "Attempts to detect, scry, or track you through the Flow (by Echoes, resonance, or metaphysical sensing) roll with Snag (or add +1 Snag Die). Ordinary technological sensors are unaffected." },
    { key: "ward-amplifier", name: "Ward Amplifier", category: "mystech", price: 1200, nexus: "◎0.5", rarity: "Legendary", legality: "Contraband", fits: "Mystech",
      grants: "Empowers Ward as a Focus", effect: "This mod is a Focus. Once per round when you use Ward, add +1d6 to the Ward reduction. You benefit from only one Ward Focus at a time, so it does not stack with a Focus suit or a Warding Focus; choose which feeds your Ward." },
    { key: "grounding-lattice", name: "Grounding Lattice", category: "mystech", price: 0, nexus: "◎1", vendor: false, rarity: "Legendary", legality: "Contraband", fits: "Mystech",
      grants: "Edge vs Breakflow and backlash", effect: "You gain Edge on saves against Breakflow, Flow backlash, and the metaphysical effects of Anomalies and Resonant Storms." }
  ],

  /* ---- rules surfaced as bench + market guidance ------------------------ */
  rules: {
    host: "An Armor Mod needs a host: only Modular armor has the rails, and it carries mods only up to its Mod Slot count. One mod per slot. Integrated + Modular armor carries one extra slot (already counted in the suit's slots).",
    install: "Fitting or pulling a mod is bench work: downtime, a workbench, and the right kit. Never a combat action.",
    flatDR: "Flat DR from mods does not stack; the higher applies and the other is dead weight. Mod DR does stack with your suit's base DR and DR from cyberware or the Flow.",
    resistance: "Resistance to a damage type does not stack with itself. Pick mods that cover different ground.",
    legality: "A mod never lowers a suit's legality, it only raises the heat. The strictest tag among the suit and everything on it is what a scanner reads.",
    mystech: "Mystech mods are Flow gear: they fit only Mystech armor, read as Flow-touched to anything scanning for it, and need a specialist's hands and tools to fit, repair, and recharge."
  }
};

/* index by key (built once at load) */
EN.armorMods.byKey = {};
EN.armorMods.mods.forEach(function (m) { EN.armorMods.byKey[m.key] = m; });
