/* ===========================================================================
   ELYSIUM NIGHTS · Weapon Customization (Parts catalog + slot system)
   The Ballistics Bench data: every Part you can install on a weapon (a Mod or
   an Accessory), the five slots, Slot Count by profile, and the trait glossary.
   Prices in Glimmer. Legality is the strictest tag among a weapon and its Parts.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.weaponParts = {

  /* ---- the five slots (Utility holds two) ------------------------------- */
  slots: [
    { key: "targeting", name: "Targeting", firearm: "Optics / Smart Sights / Sensors", melee: "N/A", bow: "Sight Window / Scope" },
    { key: "output",    name: "Output",    firearm: "Barrel / Choke", melee: "Blade / Head / Point", bow: "Limbs / Prod" },
    { key: "core",      name: "Core",      firearm: "Receiver / Trigger / Fire-Control", melee: "Powered Core / Drive System", bow: "Cam and Cable / Trigger and Cocking Group" },
    { key: "handling",  name: "Handling",  firearm: "Stock / Grip", melee: "Hilt / Haft", bow: "Riser / Stock" },
    { key: "utility",   name: "Utility",   capacity: 2, firearm: "Lights / Sensors / Muzzles / Mounts", melee: "Locks / Breakdown Frames / Tethers", bow: "Quiver / Stabilizer" }
  ],

  /* ---- Slot Count: how many total Parts a weapon can carry --------------
     Keyed by the catalog's weapon `group`. A specific weapon can override this
     with a manual profile (Holdout 1, Revolver 2, Light bow 2, Hand crossbow 4)
     stored as _profile on its loadout. Signature weapons carry 0. */
  slotCountByGroup: { Sidearm: 4, Longarm: 5, Heavy: 5, Launcher: 5, Thrown: 1, Bowfire: 5, Simple: 4, Martial: 4, Signature: 0 },
  // manual profiles for the per-weapon override picker
  profiles: [
    { key: "auto",         name: "By weapon type", count: null },
    { key: "holdout",      name: "Holdout / tiny frame", count: 1 },
    { key: "revolver",     name: "Revolver", count: 2 },
    { key: "lightbow",     name: "Light bow (recurve, folding)", count: 2 },
    { key: "sidearm",      name: "Sidearm", count: 4 },
    { key: "handcrossbow", name: "Hand crossbow", count: 4 },
    { key: "melee",        name: "Melee", count: 4 },
    { key: "longarm",      name: "Longarm / full frame", count: 5 },
    { key: "signature",    name: "Signature (no slots)", count: 0 }
  ],

  legalityOrder: ["Legal", "Licensed", "Restricted", "Contraband"],
  rarityOrder: ["Common", "Uncommon", "Rare"],

  /* ---- the Parts catalog ------------------------------------------------
     category: melee | ranged | bowfire (which weapons it is authored for)
     slot:     targeting | output | core | handling | utility
     partType: Mod (bench work, downtime + kit) | Accessory (snap-on, no roll)
     fits:     the frame gate, interpreted by the bench matcher
     grants:   short chip summary · effect: full rules text
     excludes: keys of Parts it cannot share a build with                    */
  parts: [

    /* ============================ MELEE ============================ */
    // Output
    { key: "monoedge", name: "Monoedge", category: "melee", slot: "output", partType: "Mod", fits: "Blades", price: 400, rarity: "Uncommon", legality: "Restricted",
      grants: "Armor Piercing 1", effect: "Grants Armor Piercing 1. A single-molecule edge that slices through corporate armor plating." },
    { key: "weighted-head", name: "Weighted Head", category: "melee", slot: "output", partType: "Mod", fits: "Any Melee", price: 250, rarity: "Common", legality: "Licensed",
      grants: "+1 damage die step; adds Heavy, removes Light", effect: "Upgrade the damage die one step. The weapon gains Heavy and loses Light. Usually unsuitable for off-hand or dual-wield use.", excludes: ["pared-hilt"] },
    { key: "nonlethal-conversion", name: "Nonlethal Conversion", category: "melee", slot: "output", partType: "Mod", fits: "Any Melee", price: 150, rarity: "Common", legality: "Legal",
      grants: "Nonlethal", effect: "Damage from this weapon reduces a Target to Unconscious at 0 Vitality rather than killing." },
    { key: "serrated-edge", name: "Serrated Edge", category: "melee", slot: "output", partType: "Mod", fits: "Blades", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "1 stack Bleeding on critical hit", effect: "On a critical hit, the Target gains 1 stack of Bleeding." },
    { key: "flanged-head", name: "Flanged Head", category: "melee", slot: "output", partType: "Mod", fits: "Any Melee", price: 250, rarity: "Uncommon", legality: "Licensed",
      grants: "Staggers on a failed save", effect: "On a hit, the Target makes a Body save (DC 12) or is Staggered until the end of their next turn." },

    // Core
    { key: "shock-core", name: "Shock Core", category: "melee", slot: "core", partType: "Mod", fits: "Any Melee", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "Shock", effect: "On a hit against an organic, cyber-augmented, or robotic Target, they make a Body save (DC 12) or gain Staggered until the end of their next turn." },
    { key: "plasma-core", name: "Plasma Core", category: "melee", slot: "core", partType: "Mod", fits: "Any Melee", price: 400, rarity: "Uncommon", legality: "Restricted",
      grants: "+1d6 Electric damage", effect: "On a hit, the weapon deals an additional 1d6 Electric damage." },
    { key: "cryo-core", name: "Cryo Core", category: "melee", slot: "core", partType: "Mod", fits: "Any Melee", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "Body save or Snag on next attack", effect: "On a hit, the Target makes a Body save (DC 12) or makes their next attack with Snag." },
    { key: "pulse-core", name: "Pulse Core", category: "melee", slot: "core", partType: "Mod", fits: "Any Melee", price: 400, rarity: "Rare", legality: "Restricted",
      grants: "Disables one cyberware system on hit", effect: "On a hit against a Synthetic, Construct, or cyber-augmented Target, they make a Body save (DC 12) or one cyberware system (GM's choice) goes offline for 1 round." },
    { key: "flow-core", name: "Flow Core", category: "melee", slot: "core", partType: "Mod", fits: "Any Melee", price: 500, rarity: "Rare", legality: "Restricted",
      grants: "Strikes Entities and Manifestations; Flow attribute substitution", effect: "Attacks ignore the intangibility and physical resistances of Entities and Manifestations; base damage applies as if corporeal. A Shaper or wielder with a Flow Attribute may use their Flow Modifier in place of Body or Agility for attack rolls, damage, and any wield requirement." },

    // Handling
    { key: "balanced-hilt", name: "Balanced Hilt", category: "melee", slot: "handling", partType: "Mod", fits: "Any Melee", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Finesse", effect: "When attacking with a Finesse weapon, you may use Body or Agility for the attack and damage, choosing each time you attack." },
    { key: "extended-haft", name: "Extended Haft", category: "melee", slot: "handling", partType: "Mod", fits: "Any Melee", price: 180, rarity: "Common", legality: "Licensed",
      grants: "+1 Reach, adds Two-Handed", effect: "Grants or increases Reach by 1 (a Reach 1 weapon becomes Reach 2) and grants the Two-Handed trait." },
    { key: "counterweight-pommel", name: "Counterweight Pommel", category: "melee", slot: "handling", partType: "Mod", fits: "Any Melee", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Edge on first attack per Target per round", effect: "Your first attack each round against a Target you have not yet attacked this round gains Edge." },
    { key: "pared-hilt", name: "Pared Hilt", category: "melee", slot: "handling", partType: "Mod", fits: "Any Melee", price: 150, rarity: "Common", legality: "Legal",
      grants: "Removes Heavy or grants Light", effect: "If the weapon has Heavy, it loses it. If it does not, it gains Light. Cannot share a build with a Weighted Head.", excludes: ["weighted-head"] },
    { key: "tactical-wrap", name: "Tactical Wrap", category: "melee", slot: "handling", partType: "Mod", fits: "Any Melee", price: 180, rarity: "Common", legality: "Licensed",
      grants: "Edge on follow-up attacks vs same Target", effect: "Your second and any later attacks against the same Target in the same round gain Edge." },

    // Utility
    { key: "breakdown-frame-melee", name: "Breakdown Frame", category: "melee", slot: "utility", partType: "Mod", fits: "Any Melee", price: 250, rarity: "Uncommon", legality: "Licensed",
      grants: "Concealable", effect: "The weapon can be hidden on your person without effort: under a jacket, in a bag, against the body." },
    { key: "quick-release-tether", name: "Quick-Release Tether", category: "melee", slot: "utility", partType: "Accessory", fits: "Any Melee", price: 80, rarity: "Common", legality: "Legal",
      grants: "Quick Draw, cannot be disarmed", effect: "Drawing or stowing the weapon costs no action. Grants Quick Draw, and you cannot be disarmed of it except by an effect that explicitly cuts or destroys the tether." },
    { key: "anti-theft-module", name: "Anti-Theft Module", category: "melee", slot: "utility", partType: "Mod", fits: "Any Melee", price: 200, rarity: "Uncommon", legality: "Licensed",
      grants: "Anti-theft hand-trap", effect: "In an unauthorized hand, spines clamp in for 1d6 Piercing; that wielder attacks with Snag, and at the start of each turn takes 1d6 Electric and makes a Body save (DC 12) or is Staggered until the end of their next turn." },
    { key: "defensive-guard", name: "Defensive Guard", category: "melee", slot: "utility", partType: "Mod", fits: "Any Melee", price: 250, rarity: "Uncommon", legality: "Licensed",
      grants: "Defensive", effect: "When targeted by a melee attack while wielding this weapon, and not Surprised, Restrained, or Incapacitated, you may spend an Impulse Action to impose Snag on the attack." },
    { key: "anti-scanner-coating", name: "Anti-Scanner Coating", category: "melee", slot: "utility", partType: "Accessory", fits: "Any Melee", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "Defeats sensor-based detection", effect: "The weapon does not register on thermal, magnetic, or millimeter-wave scanners; sensor-based detection checks auto-fail. Visual detection is unaffected." },

    /* ============================ RANGED ============================ */
    // Targeting
    { key: "reflex-sight", name: "Reflex Sight", category: "ranged", slot: "targeting", partType: "Accessory", fits: "Any Ranged", price: 120, rarity: "Common", legality: "Legal",
      grants: "+1 to attack rolls within short range", effect: "+1 to ranged attack rolls within the weapon's short range. Flat bonus, does not stack." },
    { key: "combat-scope", name: "Combat Scope", category: "ranged", slot: "targeting", partType: "Accessory", fits: "Any Ranged", price: 250, rarity: "Common", legality: "Licensed",
      grants: "Scoped", effect: "When you take time to Aim, the weapon gains bonuses on long-range attacks, often Edge or reduced penalties for distance and partial cover." },
    { key: "thermal-optic", name: "Thermal Optic", category: "ranged", slot: "targeting", partType: "Accessory", fits: "Any Ranged", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "Ignore low-light Snag", effect: "Ignore Snag on attack rolls from dim light, darkness, smoke, or fog while sighting through it. Does not see through total cover or Flow-infused darkness." },
    { key: "smart-sight", name: "Smart-Sight", category: "ranged", slot: "targeting", partType: "Accessory", fits: "Any Ranged", price: 250, rarity: "Common", legality: "Licensed",
      grants: "Smart-capable (requires Smartlink)", effect: "Bolts an onboard targeting computer onto a weapon that lacks one, marking it smart-capable. No bonus on its own; it bridges a wielder's Smartlink to the gun so every Smartlink feature works through it." },
    { key: "targeting-suite", name: "Targeting Suite", category: "ranged", slot: "targeting", partType: "Accessory", fits: "Any Ranged", price: 700, rarity: "Rare", legality: "Restricted",
      grants: "Guided at long range; paint targets; HUD (requires Smartlink)", effect: "For a smart-capable weapon and a wielder with a Smartlink: attacks no longer suffer Snag at long range; as a Swift Action paint a visible target covertly (your Smart Round attacks against it gain Replay from the first shot); HUD gives ammo count, rangefinding, threat highlighting, and target handoff to an ally." },

    // Output
    { key: "match-barrel", name: "Match Barrel", category: "ranged", slot: "output", partType: "Mod", fits: "Any Firearm", price: 350, rarity: "Uncommon", legality: "Licensed",
      grants: "+25% range", effect: "Increase the weapon's short and long range values by 25% (round up). The precision barrel is fixed to the frame; cannot share a build with a Folding Stock.", excludes: ["folding-stock"] },
    { key: "shotgun-choke", name: "Shotgun Choke", category: "ranged", slot: "output", partType: "Mod", fits: "Shotgun", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Extends Spread range", effect: "Increase the weapon's short range by 50% (round up). The Spread trait's short-range Edge now applies to this extended short range before the long-range penalty takes over." },
    { key: "heavy-barrel", name: "Heavy Barrel", category: "ranged", slot: "output", partType: "Mod", fits: "Any Firearm", price: 300, rarity: "Uncommon", legality: "Licensed",
      grants: "+1 damage die step; adds Heavy", effect: "Upgrade the weapon's damage die one step. The weapon gains the Heavy trait." },
    { key: "bullpup-conversion", name: "Bullpup Conversion", category: "ranged", slot: "output", partType: "Mod", fits: "Longarm", price: 400, rarity: "Uncommon", legality: "Licensed",
      grants: "Concealable and Close Quarters", effect: "The receiver and magazine shift behind the trigger. The weapon gains Concealable and Close Quarters." },
    { key: "vented-barrel", name: "Vented Barrel", category: "ranged", slot: "output", partType: "Mod", fits: "Any Firearm", price: 150, rarity: "Common", legality: "Licensed",
      grants: "Stabilized", effect: "You count as Stabilized for the High Recoil trait, negating its Snag. No Utility slot burned." },

    // Core
    { key: "full-auto-receiver", name: "Full-Auto Receiver", category: "ranged", slot: "core", partType: "Mod", fits: "Any Firearm", price: 500, rarity: "Rare", legality: "Restricted",
      grants: "Full-Auto (and Burst Fire)", effect: "Grants the Full-Auto firing mode. If the weapon lacks Burst Fire, it gains that too." },
    { key: "match-trigger-group", name: "Match Trigger Group", category: "ranged", slot: "core", partType: "Mod", fits: "Semi-Auto Firearm", price: 600, rarity: "Uncommon", legality: "Licensed",
      grants: "Precision Frame", effect: "Single Shot and Semi-Auto attacks score a critical hit on a roll of 19 or 20." },
    { key: "anti-jam-action", name: "Anti-Jam Action", category: "ranged", slot: "core", partType: "Mod", fits: "Any Firearm", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Reliable", effect: "Grants the Reliable trait: a reinforced, cleaned-up action that does not choke." },
    { key: "burst-fire-receiver", name: "Burst Fire Receiver", category: "ranged", slot: "core", partType: "Mod", fits: "Any Firearm", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "Burst Fire", effect: "Grants the Burst Fire firing mode. Does not grant Full-Auto." },
    { key: "hair-trigger", name: "Hair Trigger", category: "ranged", slot: "core", partType: "Mod", fits: "Any Firearm", price: 500, rarity: "Uncommon", legality: "Licensed",
      grants: "Edge on first attack per round", effect: "Your first attack each round with this weapon gains Edge." },

    // Handling
    { key: "folding-stock", name: "Folding Stock", category: "ranged", slot: "handling", partType: "Mod", fits: "Longarm", price: 200, rarity: "Uncommon", legality: "Licensed",
      grants: "Concealable", effect: "Attacks and operations work as normal. Checks to detect the weapon on a casual search are made with Snag. Cannot share a build with a Match Barrel.", excludes: ["match-barrel"] },
    { key: "recoil-stock", name: "Recoil Stock", category: "ranged", slot: "handling", partType: "Mod", fits: "Longarm", price: 120, rarity: "Common", legality: "Legal",
      grants: "Stabilized", effect: "You count as Stabilized for the High Recoil trait, negating its Snag." },
    { key: "quick-draw-grip", name: "Quick-Draw Grip", category: "ranged", slot: "handling", partType: "Mod", fits: "Sidearm", price: 150, rarity: "Common", legality: "Licensed",
      grants: "Quick Draw", effect: "Grants the Quick Draw trait." },
    { key: "powered-assist-grip", name: "Powered Assist Grip", category: "ranged", slot: "handling", partType: "Mod", fits: "Longarm", price: 600, rarity: "Rare", legality: "Restricted",
      grants: "Wield a Heavy or Two-Handed weapon one-handed", effect: "Lets you wield a Heavy or Two-Handed weapon effectively in one hand. Requires a power cell, adds bulk, and cannot share a build with a Breakdown Frame.", excludes: ["breakdown-frame-melee"] },
    { key: "marksman-stock", name: "Marksman Stock", category: "ranged", slot: "handling", partType: "Mod", fits: "Longarm", price: 250, rarity: "Uncommon", legality: "Licensed",
      grants: "Edge on long-range attacks while stationary", effect: "When you have not moved this turn, ranged attacks at long range with this weapon gain Edge." },

    // Utility
    { key: "suppressor", name: "Suppressor", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Firearm", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "Silent", effect: "Attacks do not automatically trigger sound-based alerts in the area. Works well with stealth and infiltration." },
    { key: "compensator", name: "Compensator", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Firearm", price: 150, rarity: "Common", legality: "Licensed",
      grants: "Stabilized", effect: "You count as Stabilized for the High Recoil trait, negating its Snag." },
    { key: "weapon-light", name: "Weapon Light", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Ranged", price: 40, rarity: "Common", legality: "Legal",
      grants: "Project a light cone; reveals your position", effect: "As a Free Action, project a cone of light. It negates darkness for you and adjacent allies in that cone, and gives away your position to anything that can see the light." },
    { key: "case-catcher", name: "Case Catcher", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Firearm", price: 30, rarity: "Common", legality: "Legal",
      grants: "Leaves no brass", effect: "Catches ejected casings, so no spent brass is left at the scene. Investigations that rely on recovered casings to trace the weapon get nothing." },
    { key: "target-spotter", name: "Target Spotter", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Ranged", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "Spotlight target; rangefinding; read targets", effect: "Standalone laser ranging, recon optic, and designator (no Smartlink needed). Spotlight a visible target so the next ally attack ignores Half Cover's Defense bonus; always know exact range; Edge on Perception to read a target (drawn weapons, visible cyberware, rough wound state). Detection only, never an attack roll." },
    { key: "foregrip", name: "Foregrip", category: "ranged", slot: "utility", partType: "Accessory", fits: "Longarm", price: 60, rarity: "Common", legality: "Legal",
      grants: "Stabilized", effect: "You count as Stabilized for the High Recoil trait, negating its Snag." },
    { key: "bipod", name: "Bipod", category: "ranged", slot: "utility", partType: "Accessory", fits: "Longarm", price: 80, rarity: "Common", legality: "Legal",
      grants: "Stabilized and +25% range while deployed", effect: "While deployed and you have not moved this turn, the weapon ignores High Recoil and its range bands increase by 25% (round up). Moving ends the benefit until redeployed." },
    { key: "bayonet", name: "Bayonet", category: "ranged", slot: "utility", partType: "Accessory", fits: "Longarm", price: 40, rarity: "Common", legality: "Legal",
      grants: "Adds a melee attack (Reach 1, 1d4 Piercing)", effect: "Grants the weapon a melee profile of 1d4 Piercing, Reach 1. Longarms only." },
    { key: "under-barrel-mount", name: "Under-Barrel Mount", category: "ranged", slot: "utility", partType: "Accessory", fits: "Longarm", price: 400, rarity: "Uncommon", legality: "Restricted",
      grants: "Mount one secondary device", effect: "Fits one secondary device beneath the barrel (Counted ammo), one at a time: a single-barrel breaching shotgun (1 shell, 2d6 Ballistic, Close Quarters) or a single-tube launcher firing Grenade Shells." },
    { key: "low-light-sensor-suite", name: "Low-Light Sensor Suite", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Ranged", price: 150, rarity: "Common", legality: "Licensed",
      grants: "Perception in low light", effect: "Edge on Perception checks (or +1 Edge Die out of combat, +5 to Passive Perception) to spot or track targets in darkness, smoke, or fog. Detection only, never an attack roll." },

    /* ============================ BOWFIRE ============================ */
    // Output (Limbs / Prod)
    { key: "high-tension-assembly", name: "High-Tension Assembly", category: "bowfire", slot: "output", partType: "Mod", fits: "Any bow", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "+1 damage die step or Armor Piercing 1", effect: "Upgrade the damage die one step or grant Armor Piercing 1. Choose at install." },
    { key: "composite-limbs", name: "Composite Limbs", category: "bowfire", slot: "output", partType: "Mod", fits: "Any bow", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Quick Draw", effect: "Grants the Quick Draw trait." },
    { key: "whisper-limbs", name: "Whisper Limbs", category: "bowfire", slot: "output", partType: "Mod", fits: "Any bow", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "Silent", effect: "Grants the Silent trait." },
    { key: "voltaic-limbs", name: "Voltaic Limbs", category: "bowfire", slot: "output", partType: "Mod", fits: "Any bow", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "+1d4 Electric damage; Staggers on crit", effect: "On a hit, deal an additional 1d4 Electric damage. On a critical hit, the Target makes a Body save (DC 12) or is Staggered until the end of their next turn." },
    { key: "flow-etched-limbs", name: "Flow-Etched Limbs", category: "bowfire", slot: "output", partType: "Mod", fits: "Any bow", price: 500, rarity: "Rare", legality: "Restricted",
      grants: "Strikes Entities and Manifestations; Flow attribute substitution", effect: "Arrows can harm Entities and Manifestations as if corporeal; base damage applies normally. A Shaper or wielder with a Flow Attribute may use their Flow Modifier in place of Body or Agility for attack rolls, damage, and any wield requirement." },

    // Core (Cam and Cable / Trigger and Cocking Group)
    { key: "cam-tuning", name: "Cam Tuning", category: "bowfire", slot: "core", partType: "Mod", fits: "Compound", price: 150, rarity: "Common", legality: "Licensed",
      grants: "+25% range", effect: "Increase the weapon's short and long range values by 25% (round up)." },
    { key: "cocking-aid", name: "Cocking Aid", category: "bowfire", slot: "core", partType: "Mod", fits: "Crossbow", price: 200, rarity: "Uncommon", legality: "Licensed",
      grants: "Negates Slow reload", effect: "Reload no longer ties up your action: the Slow trait's one-attack-per-round limit is lifted for this weapon." },
    { key: "magazine-cradle", name: "Magazine Cradle", category: "bowfire", slot: "core", partType: "Mod", fits: "Crossbow", price: 250, rarity: "Uncommon", legality: "Licensed",
      grants: "Holds 3 bolts; skips manual reload between shots", effect: "The crossbow carries three bolts on an internal cradle. Consecutive shots in the same round need no manual reload until the cradle is empty." },
    { key: "reinforced-cam", name: "Reinforced Cam", category: "bowfire", slot: "core", partType: "Mod", fits: "Compound", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Reliable", effect: "Grants the Reliable trait." },
    { key: "tracker-cam", name: "Tracker Cam", category: "bowfire", slot: "core", partType: "Mod", fits: "Compound", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "Tags hit Targets with a location beacon", effect: "On a hit, the Target is tagged with an embedded tracking chip. You know their location to within 10 meters for 1 hour or until the chip is removed (typically needs medical attention)." }
  ],

  /* ---- trait glossary (every trait a Part grants or references) ---------- */
  traits: [
    { name: "Armor Piercing X", text: "When you hit, ignore X points of flat damage reduction from armor. Does not affect Resistances or Immunities unless a rule says so." },
    { name: "Bleeding", text: "At the start of your turn, and each time you willingly move 1 space, lose 1d4 / 2d4 / 3d4 Vitality by stacks. A Medtech check (DC 10/15/20) or any Vitality restoration removes a stack." },
    { name: "Burst Fire", text: "Spend 3 rounds and attack one Target; every other Target within 1 space makes an Agility save vs your Weapon Save DC, taking the weapon's damage die (no Attribute mod) on a failure." },
    { name: "Close Quarters", text: "No Snag for attacking while engaged in melee or in cramped spaces where similar weapons would be awkward." },
    { name: "Concealable", text: "Attacks and operation work as normal. Checks to detect the weapon on a casual search are made with Snag." },
    { name: "Defensive", text: "When targeted by a melee attack while wielding this weapon (and not Surprised, Restrained, or Incapacitated), spend an Impulse Action to impose Snag on the attack." },
    { name: "Finesse", text: "Use Body or Agility for the attack and damage, chosen each time you attack." },
    { name: "Full-Auto", text: "As an Action once per round, spend 8 rounds to project an Area 3 cone or an Area 6 by 1 line; Targets save vs your Weapon Save DC per the firing-mode rules." },
    { name: "Guided", text: "Attacks ignore the Defense bonus of Half Cover and do not suffer Snag when firing at long range." },
    { name: "Heavy", text: "Adds to encumbrance and may interact with rules that penalize low Body or long-distance movement. Usually unsuitable for off-hand or dual-wield use." },
    { name: "High Recoil", text: "Multiple attacks with this weapon in one round apply Snag to later attacks unless Stabilized." },
    { name: "Light", text: "Compact and easy in one hand; interacts with dual-wield rules and can be carried discreetly under loose clothing without counting as Concealable." },
    { name: "Nonlethal", text: "If damage reduces a Target to 0, they are Unconscious and stable rather than dying." },
    { name: "Precision Frame", text: "If a weapon's only firing mode is Single Shot, its attacks score a critical hit on a roll of 19 or 20." },
    { name: "Quick Draw", text: "Drawing the weapon costs no extra action as part of an attack; the first attack in an encounter with it drawn this way gains Edge." },
    { name: "Reach X", text: "Each point of Reach extends your melee threat by 1 space. Reach 1 strikes Targets up to 2 spaces away." },
    { name: "Reliable", text: "Natural 1 results are treated as simple misses unless an effect calls out a worse outcome." },
    { name: "Scoped", text: "When you Aim, gain bonuses on long-range attacks, often Edge or reduced penalties for distance and partial cover." },
    { name: "Shock", text: "On a hit against an organic, cyber-augmented, or robotic Target, they make a Body save (DC 12) or are Staggered until the end of their next turn." },
    { name: "Silent", text: "Attacks do not automatically trigger sound-based alerts in the area." },
    { name: "Slow", text: "Only one attack per round with this weapon, regardless of extra-attack features, unless explicitly overridden." },
    { name: "Spread", text: "Best at short range, degrades at long range (for example, Edge at short range, Snag at long range)." },
    { name: "Stabilized", text: "Negates the High Recoil Snag." },
    { name: "Two-Handed", text: "Requires both hands; using it one-handed applies heavy penalties without a specific feature or powered assist." }
  ],

  /* ---- stacking + over-engineering rules (surfaced as bench guidance) ---- */
  rules: {
    onePerSlot: "One Part per slot. A weapon holds at most one Targeting, Output, Core, and Handling Part, plus up to two Utility Parts.",
    flatBonus: "Flat bonuses do not stack: if two Parts give a flat bonus to the same attack, take the highest and drop the rest.",
    stabilized: "Stabilized sources do not stack: multiple Parts negate the High Recoil Snag only once.",
    dieStep: "A weapon gains at most one damage die step from aftermarket Parts. It still stacks with steps from class features, cyberware, or the Flow.",
    legality: "A Part never lowers a weapon's legality, only raises the heat. The strictest tag among the weapon and everything on it is what a scanner reports.",
    overEngineering: "Pushing past a weapon's Slot Count is allowed, but it instantly makes the modification a Prototype-tier Project and the finished weapon carries a Mandatory Flaw: a permanent quirk, heavy maintenance burden, or obvious visual tell.",
    install: "Accessories snap on anytime out of initiative, no roll. Mods are bench work: a Short or Long Rest with a relevant tool kit and Proficiency, occasionally a single Engineering check or a short crafting Project."
  }
};

/* index by key (built once at load) */
EN.weaponParts.byKey = {};
EN.weaponParts.parts.forEach(function (p) { EN.weaponParts.byKey[p.key] = p; });
