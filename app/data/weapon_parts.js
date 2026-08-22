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
  slotCountByGroup: { Sidearm: 4, Longarm: 5, Heavy: 5, Launcher: 5, Bowfire: 5, Simple: 4, Martial: 4 },
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
      grants: "Armor Piercing 1", effect: "Apply the Armor Piercing 1 trait." },
    { key: "weighted-head", name: "Weighted Head", category: "melee", slot: "output", partType: "Mod", fits: "Any Melee", price: 250, rarity: "Common", legality: "Licensed",
      grants: "+1 damage die step; adds Heavy, removes Light", effect: "Upgrade the damage die one step. Apply the Heavy trait and remove the Light trait, if present.", excludes: ["pared-hilt"] },
    { key: "nonlethal-conversion", name: "Nonlethal Conversion", category: "melee", slot: "output", partType: "Mod", fits: "Any Melee", price: 150, rarity: "Common", legality: "Legal",
      grants: "Nonlethal", effect: "Apply the Nonlethal trait. When this weapon reduces a Target to 0 Vitality, the damage imposes the Unconscious condition instead of killing them." },
    { key: "serrated-edge", name: "Serrated Edge", category: "melee", slot: "output", partType: "Mod", fits: "Blades", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "1 stack Bleeding on critical hit", effect: "On a critical hit, the Target gains 1 stack of Bleeding." },
    { key: "flanged-head", name: "Flanged Head", category: "melee", slot: "output", partType: "Mod", fits: "Any Melee", price: 250, rarity: "Uncommon", legality: "Licensed",
      grants: "Staggers on a failed save", effect: "On a hit, the Target makes a Body save (DC 12) or is Staggered until the end of their next turn." },

    // Core
    { key: "shock-core", name: "Shock Core", category: "melee", slot: "core", partType: "Mod", fits: "Any Melee", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "Shock", effect: "Apply the Shock trait. On a hit, an organic, cyber-augmented, or robotic Target must make a Body Save (DC 12). On a failure, they gain the Staggered condition until the end of their next turn." },
    { key: "plasma-core", name: "Plasma Core", category: "melee", slot: "core", partType: "Mod", fits: "Any Melee", price: 400, rarity: "Uncommon", legality: "Restricted",
      grants: "+1d6 Electric damage", effect: "On a hit, the weapon deals an additional 1d6 Electric damage." },
    { key: "cryo-core", name: "Cryo Core", category: "melee", slot: "core", partType: "Mod", fits: "Any Melee", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "Body save or Snag on next attack", effect: "On a hit, the Target makes a Body save (DC 12) or their next attack is made with Snag." },
    { key: "pulse-core", name: "Pulse Core", category: "melee", slot: "core", partType: "Mod", fits: "Any Melee", price: 400, rarity: "Rare", legality: "Restricted",
      grants: "Disables one cyberware system on hit", effect: "On a hit against a Synthetic, Construct, or Cyberaugmented Target, the Target makes a Body save (DC 12) or one of their cyberware systems goes offline for 1 round. The GM selects the system." },
    { key: "flow-core", name: "Flow Core", category: "melee", slot: "core", partType: "Mod", fits: "Any Melee", price: 500, rarity: "Rare", legality: "Restricted",
      grants: "Strikes Entities and Manifestations; Flow attribute substitution", effect: "The weapon's attacks ignore intangibility and physical resistances of Entities and Manifestations. Base damage applies as if the Target were corporeal. No damage type added. If the wielder is a Shaper or otherwise has a designated Flow Attribute, they may use their Flow Modifier in place of their Body or Agility Modifier for attack rolls, damage rolls, and any attribute requirement to wield the weapon." },

    // Handling
    { key: "balanced-hilt", name: "Balanced Hilt", category: "melee", slot: "handling", partType: "Mod", fits: "Any Melee", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Finesse", effect: "Apply the Finesse trait. When attacking with this weapon, you may use either Body or Agility for both the attack and damage rolls, choosing each time you attack." },
    // Renamed from "Extended Haft" and re-gated from "Any Melee" on 2026-08-12, to match
    // the manuscript. `fits: "Long-Shafted"` is a HARD frame gate, so this no longer fits
    // a Longsword or a Whip; see EN.weaponParts.renames for the save migration.
    { key: "extended-shaft", name: "Extended Shaft", category: "melee", slot: "handling", partType: "Mod", fits: "Long-Shafted", price: 180, rarity: "Common", legality: "Licensed",
      // reachBonus is the mechanical half of `grants`, as a number the engine can add.
      // Nothing parses the prose: this is the only Weapon Part that moves a computed
      // value, and it says so in data rather than in a string somebody has to regex.
      reachBonus: 1,
      // and it makes the weapon Two-Handed, which is not cosmetic: a Versatile weapon
      // fitted with one can only be held in two hands, so it loses the Versatile choice
      // and keeps the two-handed die permanently.
      grantsTwoHanded: true,
      grants: "+1 Reach, adds Two-Handed", effect: "Increases Reach by 1 (a Reach 1 weapon becomes Reach 2) and grants the Two-Handed trait." },
    { key: "counterweight-pommel", name: "Counterweight Pommel", category: "melee", slot: "handling", partType: "Mod", fits: "Any Melee", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Edge on first attack per Target per round", effect: "Your first attack each round against a Target you have not yet attacked this round gains Edge." },
    { key: "pared-hilt", name: "Pared Hilt", category: "melee", slot: "handling", partType: "Mod", fits: "Any Melee", price: 150, rarity: "Common", legality: "Legal",
      grants: "Removes Heavy or grants Light", effect: "Remove the Heavy trait if the weapon has it. Otherwise, apply the Light trait. This modification cannot share a build with Weighted Head.", excludes: ["weighted-head"] },
    { key: "tactical-wrap", name: "Tactical Wrap", category: "melee", slot: "handling", partType: "Mod", fits: "Any Melee", price: 180, rarity: "Common", legality: "Licensed",
      grants: "Edge on follow-up attacks vs same Target", effect: "Your second and any later attacks against the same Target in the same round gain Edge." },

    // Utility
    /* The Two-Handed Melee frame and its three Parts, transcribed from Part 3 on 2026-08-19.
       The book states Fits as "Two-Handed Melee (Greatsword, Halberd, Maul)"; the parenthetical
       is the examples, not the gate, so partFits asks for the Two-Handed trait rather than
       matching those three names. */
    { key: "inertia-core", name: "Inertia Core", category: "melee", slot: "core", partType: "Mod", fits: "Two-Handed Melee", price: 450, rarity: "Uncommon", legality: "Licensed",
      grants: "+1d8 on your first attack after a turn without one", effect: "If you did not attack with this weapon during your previous turn, your first attack with it this turn deals an additional 1d8 damage of the weapon's type." },
    { key: "bracing-spike", name: "Bracing Spike", category: "melee", slot: "utility", partType: "Accessory", fits: "Two-Handed Melee", price: 300, rarity: "Common", legality: "Legal",
      grants: "Edge vs forced movement and +1 Reach while braced", effect: "Swift Action: drive the spike down and put your weight behind it. Until you move, you gain Edge on Saves and contested checks made to resist being Shoved, pulled, or knocked Prone, and this weapon's Reach increases by 1." },
    { key: "siege-head", name: "Siege Head", category: "melee", slot: "output", partType: "Mod", fits: "Two-Handed Melee", price: 600, rarity: "Rare", legality: "Restricted",
      grants: "Siege", effect: "Apply the Siege trait. The head deals double damage to Vehicle armor and Cover Integrity." },
    { key: "breakdown-frame-melee", name: "Breakdown Frame", category: "melee", slot: "utility", partType: "Mod", fits: "Any Melee", price: 250, rarity: "Uncommon", legality: "Licensed",
      grants: "Concealable", effect: "Apply the Concealable trait. The weapon can be hidden on your person without effort, whether under a jacket, inside a bag, or against the body." },
    { key: "quick-release-tether", name: "Quick-Release Tether", category: "melee", slot: "utility", partType: "Accessory", fits: "Any Melee", price: 80, rarity: "Common", legality: "Legal",
      grants: "Quick Draw, cannot be disarmed", effect: "Apply the Quick Draw trait. Drawing or stowing the weapon does not cost an action, and you cannot be disarmed of it unless an effect explicitly cuts or destroys the tether." },
    { key: "anti-theft-module", name: "Anti-Theft Module", category: "melee", slot: "utility", partType: "Mod", fits: "Any Melee", price: 200, rarity: "Uncommon", legality: "Licensed",
      grants: "Anti-theft hand-trap", effect: "Hidden spines snap out of the grip and clamp into the wielder's hand, dealing 1d6 Piercing damage. While the wielder keeps hold of the weapon, they attack with Snag. At the start of each of their turns, they take 1d6 Electric damage and must make a Body save (DC 12) or become Staggered until the end of their next turn." },
    { key: "defensive-guard", name: "Defensive Guard", category: "melee", slot: "utility", partType: "Mod", fits: "Any Melee", price: 250, rarity: "Uncommon", legality: "Licensed",
      grants: "Defensive", effect: "Impulse: Apply the Defensive trait. While wielding this weapon, when you are targeted by a melee attack, you may spend an Impulse Action to impose Snag on the attack, provided you are not Surprised, Restrained, or Incapacitated." },
    { key: "anti-scanner-coating", name: "Anti-Scanner Coating", category: "melee", slot: "utility", partType: "Accessory", fits: "Any Melee", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "Defeats sensor-based detection", effect: "The weapon does not register on thermal, magnetic, or millimeter-wave scanners. Sensor-based checks to detect the weapon automatically fail. Visual detection (eyeballs, cameras, ordinary search) is unaffected." },

    /* ============================ RANGED ============================ */
    // Targeting
    { key: "reflex-sight", name: "Reflex Sight", category: "ranged", slot: "targeting", partType: "Accessory", fits: "Any Ranged", price: 120, rarity: "Common", legality: "Legal",
      grants: "+1 to attack rolls within short range", effect: "+1 to ranged attack rolls within the weapon's short range. Flat bonus, does not stack." },
    { key: "combat-scope", name: "Combat Scope", category: "ranged", slot: "targeting", partType: "Accessory", fits: "Any Ranged", price: 250, rarity: "Common", legality: "Licensed",
      grants: "Scoped", effect: "Apply the Scoped trait. When you Take Aim (Swift) before attacking with this weapon, the attack ignores Snag from long range and treats the Target's Half or Three-Quarter Cover as one step lower: Three-Quarter Cover becomes Half Cover, and Half Cover becomes no cover." },
    { key: "thermal-optic", name: "Thermal Optic", category: "ranged", slot: "targeting", partType: "Accessory", fits: "Any Ranged", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "Ignore low-light Snag", effect: "You ignore Snag on attack rolls caused by dim light, darkness, smoke, or fog while sighting through it. Does not see through total cover or flow-infused darkness." },
    { key: "smart-sight", name: "Smart-Sight", category: "ranged", slot: "targeting", partType: "Accessory", fits: "Any Ranged", price: 250, rarity: "Common", legality: "Licensed",
      grants: "Smart-capable (requires Smartlink)", effect: "Bolts an onboard targeting computer onto a weapon that lacks one, marking it smart-capable. Grants no bonus on its own. Its only job is to bridge a Smartlink to a weapon that was never built for one. Installed on a firearm with a Smartlink in the wielder, every Smartlink feature the wielder has works through the gun." },
    { key: "targeting-suite", name: "Targeting Suite", category: "ranged", slot: "targeting", partType: "Accessory", fits: "Any Ranged", price: 700, rarity: "Rare", legality: "Restricted",
      grants: "Guided at long range; paint targets; HUD (requires Smartlink)", effect: "The high-end option for a weapon with an integrated smart system, whether natively smart or made smart-capable by a Smart-Sight. This modification functions only for a wielder with a Smartlink. On a weapon that is not smart-capable, or for a wielder without a Smartlink, it has no effect. Combat: The weapon's attacks no longer suffer Snag at long range, as with a Guided weapon. Painting: As a Swift Action, mark one Target you can see as painted without firing a shot. This uses the same painted status as Smart Rounds: you may have only one painted Target at a time, the mark lasts until the end of your next turn, and you may refresh it. This bypasses the Smart Rounds lock shot, allowing you to mark the Target covertly, without an attack or noise. Your Smart Round attacks against that Target gain Replay from the first trigger pull instead of requiring the initial hit. HUD: Provides a live ammunition count, rangefinding, threat highlighting, and target handoff, allowing you to share the painted Target with an ally's HUD." },

    // Output
    { key: "match-barrel", name: "Match Barrel", category: "ranged", slot: "output", partType: "Mod", fits: "Any Firearm", price: 350, rarity: "Uncommon", legality: "Licensed",
      grants: "+25% range", effect: "Increase the weapon's short and long range values by 25% (round up)." },
    /* M16, ruled 2026-08-16: ACCESSORY, not a Mod. The summary table was right and the
       entry was wrong, and the difference is a play difference rather than a label: an
       Accessory snaps on and off in the field with no tools and no roll, a Mod wants
       downtime, a bench and a kit. partType drives that distinction everywhere it shows,
       so this one word changes the chip, its tooltip and the install toast together. */
    { key: "shotgun-choke", name: "Shotgun Choke", category: "ranged", slot: "output", partType: "Accessory", fits: "Shotgun", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Extends Spread range", effect: "Increase the weapon's short range by 50% (round up). The Spread trait's short-range benefit (its Edge) now applies to this extended short range before the long-range penalty takes over, so the tight pattern holds together farther downrange." },
    { key: "heavy-barrel", name: "Heavy Barrel", category: "ranged", slot: "output", partType: "Mod", fits: "Any Firearm", price: 300, rarity: "Uncommon", legality: "Licensed",
      grants: "+1 damage die step; adds Heavy", effect: "Upgrade the weapon's damage die one step and apply the Heavy trait." },
    { key: "bullpup-conversion", name: "Bullpup Conversion", category: "ranged", slot: "output", partType: "Mod", fits: "Longarm", price: 400, rarity: "Uncommon", legality: "Licensed",
      grants: "Concealable and Close Quarters", effect: "Apply the Concealable and Close Quarters traits." },
    { key: "vented-barrel", name: "Vented Barrel", category: "ranged", slot: "output", partType: "Mod", fits: "Any Firearm", price: 150, rarity: "Common", legality: "Licensed",
      grants: "Stabilized", effect: "Apply the Stabilized trait. You count as Stabilized when resolving the High Recoil trait, negating its Snag." },

    // Core
    { key: "full-auto-receiver", name: "Full-Auto Receiver", category: "ranged", slot: "core", partType: "Mod", fits: "Any Firearm", price: 500, rarity: "Rare", legality: "Restricted",
      grants: "Full-Auto (and Burst Fire)", effect: "The weapon gains the Full-Auto firing mode. If it lacks Burst Fire, it gains that firing mode as well." },
    { key: "match-trigger-group", name: "Match Trigger Group", category: "ranged", slot: "core", partType: "Mod", fits: "Semi-Auto Firearm", price: 600, rarity: "Uncommon", legality: "Licensed",
      grants: "Precision Frame", effect: "Apply Precision Frame. Attacks with this weapon score a critical hit on a roll of 19 or 20." },   /* 2026-08-19: the mode limit is gone. The mod grants Precision Frame in full, matching the
         trait's own unconditional definition, so a Match-Trigger weapon crits on 19-20 in every fire
         mode. "fits" stays Semi-Auto Firearm: that is which weapons can take the part, not which
         modes it works in, and the two were easy to conflate. */
    { key: "anti-jam-action", name: "Anti-Jam Action", category: "ranged", slot: "core", partType: "Mod", fits: "Any Firearm", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Reliable", effect: "Apply the Reliable trait. Its reinforced, cleaned-up action does not choke." },
    { key: "burst-fire-receiver", name: "Burst Fire Receiver", category: "ranged", slot: "core", partType: "Mod", fits: "Any Firearm", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "Burst Fire", effect: "The weapon gains the Burst Fire firing mode, but not Full-Auto." },
    { key: "hair-trigger", name: "Hair Trigger", category: "ranged", slot: "core", partType: "Mod", fits: "Any Firearm", price: 500, rarity: "Uncommon", legality: "Licensed",
      grants: "Edge on first attack per round", effect: "The first attack you make with this weapon each round gains Edge." },

    // Handling
    { key: "folding-stock", name: "Folding Stock", category: "ranged", slot: "handling", partType: "Mod", fits: "Longarm", price: 200, rarity: "Uncommon", legality: "Licensed",
      grants: "Concealable", effect: "Apply the Concealable trait. Attacks and other operations function normally. Checks made during a casual search to detect the weapon take Snag." },
    { key: "recoil-stock", name: "Recoil Stock", category: "ranged", slot: "handling", partType: "Mod", fits: "Longarm", price: 120, rarity: "Common", legality: "Legal",
      grants: "Stabilized", effect: "Apply the Stabilized trait. You count as Stabilized when resolving the High Recoil trait, negating its Snag." },
    { key: "quick-draw-grip", name: "Quick-Draw Grip", category: "ranged", slot: "handling", partType: "Mod", fits: "Sidearm", price: 150, rarity: "Common", legality: "Licensed",
      grants: "Quick Draw", effect: "Apply the Quick Draw trait." },
    // the Breakdown Frame exclusion below mirrors the book; in the app it can
    // never fire, since this Part fits Longarm only and that one fits Any Melee
    { key: "powered-assist-grip", name: "Powered Assist Grip", category: "ranged", slot: "handling", partType: "Mod", fits: "Longarm", price: 600, rarity: "Rare", legality: "Restricted",
      grants: "Wield a Heavy or Two-Handed weapon one-handed", effect: "You can wield a Heavy or Two-Handed weapon effectively with one hand. This modification requires a power cell and adds bulk." },
    /* 2026-08-19: the Breakdown Frame exclusion is gone, prose and the excludes array both. It
       could never fire: this Grip is Handling / Fits Longarm and the only Breakdown Frame is
       Utility / Fits Any Melee, so no weapon could ever hold the pair. Vestigial, not protective. */
    { key: "marksman-stock", name: "Marksman Stock", category: "ranged", slot: "handling", partType: "Mod", fits: "Longarm", price: 250, rarity: "Uncommon", legality: "Licensed",
      grants: "Edge on long-range attacks while stationary", effect: "If you have not moved this turn, ranged attacks made with this weapon at long range gain Edge." },

    // Utility
    { key: "suppressor", name: "Suppressor", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Firearm", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "Silent", effect: "Apply the Silent trait. Attacks with this weapon do not automatically trigger sound-based alerts in the area, making it well suited to stealth and infiltration." },
    { key: "compensator", name: "Compensator", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Firearm", price: 150, rarity: "Common", legality: "Licensed",
      grants: "Stabilized", effect: "Apply the Stabilized trait. You count as Stabilized when resolving the High Recoil trait, negating its Snag." },
    { key: "weapon-light", name: "Weapon Light", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Ranged", price: 40, rarity: "Common", legality: "Legal",
      grants: "Project a light cone; reveals your position", effect: "Special: Project a beam in a cone you choose. For you and adjacent allies, the beam negates darkness for vision within that cone. Anything that can see the light can identify your position." },
    { key: "case-catcher", name: "Case Catcher", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Firearm", price: 30, rarity: "Common", legality: "Legal",
      grants: "Leaves no brass", effect: "The weapon catches its ejected casings, leaving no spent brass at the scene. Investigations relying on recovered casings to trace the weapon find nothing." },
    { key: "target-spotter", name: "Target Spotter", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Ranged", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "Spotlight target; rangefinding; read targets", effect: "Mount a side-mounted spotter's head combining laser rangefinding, a reconnaissance optic, and a designator. It functions as standalone glass, allowing you to study a Target without shouldering the weapon to fire. It requires no Smartlink and does not interact with the painted or Replay loop. Spotlight (Action): Choose one Target you can see. The Target remains illuminated until the start of your next turn. The next attack an ally makes against it ignores the Defense bonus from Half Cover. Rangefinding: You always know the exact distance to anything you can see and whether it is within your weapon's short range, long range, or beyond its reach. Read the target: Gain Edge on Perception checks to study a Target you can see, or +1 Edge Die out of combat and +5 to Passive Perception. You can identify drawn weapons, visible cyberware, and the Target's rough wound state. This is a detection effect. It never modifies an attack roll or grants combat Edge." },
    { key: "foregrip", name: "Foregrip", category: "ranged", slot: "utility", partType: "Accessory", fits: "Longarm", price: 60, rarity: "Common", legality: "Legal",
      grants: "Stabilized", effect: "Apply the Stabilized trait. You count as Stabilized when resolving the High Recoil trait, negating its Snag." },
    { key: "bipod", name: "Bipod", category: "ranged", slot: "utility", partType: "Accessory", fits: "Longarm", price: 80, rarity: "Common", legality: "Legal",
      grants: "Stabilized and +25% range while deployed", effect: "Apply the Stabilized trait. While the bipod is deployed and you have not moved this turn, the weapon ignores High Recoil and its range bands increase by 25%, rounded up. Moving ends these benefits until the bipod is deployed again." },
    { key: "bayonet", name: "Bayonet", category: "ranged", slot: "utility", partType: "Accessory", fits: "Longarm", price: 40, rarity: "Common", legality: "Legal",
      grants: "Adds a melee attack (Reach 1, 1d4 Piercing)", effect: "The weapon gains a melee profile of 1d4 Piercing with Reach 1. Long arms only." },
    { key: "under-barrel-mount", name: "Under-Barrel Mount", category: "ranged", slot: "utility", partType: "Accessory", fits: "Longarm", price: 400, rarity: "Uncommon", legality: "Restricted",
      grants: "Mount one secondary device", effect: "Fit one secondary device beneath the barrel. The secondary device uses Counted ammunition, and the weapon can hold only one at a time: Single-Barrel Breaching Shotgun: 1 shell, 2d6 Ballistic, Close Quarters. Single-Tube Launcher: Fires Grenade Shells." },
    { key: "low-light-sensor-suite", name: "Low-Light Sensor Suite", category: "ranged", slot: "utility", partType: "Accessory", fits: "Any Ranged", price: 150, rarity: "Common", legality: "Licensed",
      grants: "Perception in low light", effect: "Gain Edge on Perception checks to spot or track Targets in darkness, smoke, or fog, or +1 Edge Die out of combat and +5 to Passive Perception. This is a detection effect and never applies to attack rolls." },

    /* ============================ BOWFIRE ============================ */
    // Output (Limbs / Prod)
    { key: "high-tension-assembly", name: "High-Tension Assembly", category: "bowfire", slot: "output", partType: "Mod", fits: "Any bow", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "+1 damage die step or Armor Piercing 1", effect: "Upgrade the weapon's damage die one step or apply the Armor Piercing 1 trait. Choose when the modification is installed." },
    { key: "composite-limbs", name: "Composite Limbs", category: "bowfire", slot: "output", partType: "Mod", fits: "Any bow", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Quick Draw", effect: "Apply the Quick Draw trait." },
    { key: "whisper-limbs", name: "Whisper Limbs", category: "bowfire", slot: "output", partType: "Mod", fits: "Any bow", price: 350, rarity: "Uncommon", legality: "Restricted",
      grants: "Silent", effect: "Apply the Silent trait." },
    { key: "voltaic-limbs", name: "Voltaic Limbs", category: "bowfire", slot: "output", partType: "Mod", fits: "Any bow", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "+1d4 Electric damage; Staggers on crit", effect: "On a hit, the weapon deals an additional 1d4 Electric damage. On a critical hit, the Target must make a Body Save (DC 12). On a failure, they are Staggered until the end of their next turn." },
    { key: "flow-etched-limbs", name: "Flow-Etched Limbs", category: "bowfire", slot: "output", partType: "Mod", fits: "Any bow", price: 500, rarity: "Rare", legality: "Restricted",
      grants: "Strikes Entities and Manifestations; Flow attribute substitution", effect: "Arrows fired from this weapon can harm Entities and Manifestations as though they were corporeal. The weapon's base damage applies normally, and it gains no additional damage type. If the wielder is a Shaper or otherwise has a designated Flow Attribute, they may use their Flow Modifier instead of their Body or Agility Modifier for attack rolls, damage rolls, and any Attribute requirement for wielding the weapon." },

    // Core (Cam and Cable / Trigger and Cocking Group)
    { key: "cam-tuning", name: "Cam Tuning", category: "bowfire", slot: "core", partType: "Mod", fits: "Compound", price: 150, rarity: "Common", legality: "Licensed",
      grants: "+25% range", effect: "Increase the weapon's short-range and long-range values by 25%, rounded up." },
    { key: "cocking-aid", name: "Cocking Aid", category: "bowfire", slot: "core", partType: "Mod", fits: "Crossbow", price: 200, rarity: "Uncommon", legality: "Licensed",
      grants: "Negates Slow reload", effect: "Reloading no longer consumes your action. The Slow trait's limit of one attack per round is lifted for this weapon." },
    { key: "magazine-cradle", name: "Magazine Cradle", category: "bowfire", slot: "core", partType: "Mod", fits: "Crossbow", price: 250, rarity: "Uncommon", legality: "Licensed",
      grants: "Holds 3 bolts; skips manual reload between shots", effect: "The crossbow holds three bolts in an internal cradle. Consecutive shots during the same round do not require a manual reload. Once the cradle is empty, it must be reloaded manually." },
    { key: "reinforced-cam", name: "Reinforced Cam", category: "bowfire", slot: "core", partType: "Mod", fits: "Compound", price: 200, rarity: "Common", legality: "Licensed",
      grants: "Reliable", effect: "Apply the Reliable trait." },
    { key: "tracker-cam", name: "Tracker Cam", category: "bowfire", slot: "core", partType: "Mod", fits: "Compound", price: 300, rarity: "Uncommon", legality: "Restricted",
      grants: "Tags hit Targets with a location beacon", effect: "On a hit, the Target is tagged with an embedded tracking chip. You know their location to within 10 meters for 1 hour or until the chip is removed, which typically requires medical attention." }
  ],


  /* ---- stacking + over-engineering rules (surfaced as bench guidance) ---- */
  rules: {
    stabilized: "Stabilized sources do not stack: multiple Parts negate the High Recoil Snag only once.",
    dieStep: "A weapon gains at most one damage die step from aftermarket Parts. It still stacks with steps from class features, cyberware, or the Flow.",
    legality: "A Part never lowers a weapon's legality, only raises the heat. The strictest tag among the weapon and everything on it is what a scanner reports.",
    install: "Accessories snap on anytime out of initiative, no roll. Mods are bench work: a Short or Long Rest with a relevant tool kit and Proficiency, occasionally a single Engineering check or a short crafting Project."
  }
};

/* ---- Parts that have been renamed, and what they were called -------------
   A Part is persisted TWICE in a saved character, under two different strings, so a
   rename has to move both or it half-lands:
     ch.weaponParts[weaponName][slot] = <part KEY>   the install
     ch.equipment[n].name             = <part NAME>  the owned copy in the stash
   and availablePartQty() is literally owned-by-name minus installed-by-key, so moving
   one and not the other makes a character own -1 of something.
   The rename lives HERE, beside the Part, rather than as a literal in store.js, so the
   next rename is a row in this table and not a second place to remember. store.js reads
   it in migrate(); nothing else should. */
EN.weaponParts.renames = [
  { oldKey: "extended-haft", key: "extended-shaft", oldName: "Extended Haft", name: "Extended Shaft" }
];

/* index by key (built once at load) */
EN.weaponParts.byKey = {};
EN.weaponParts.parts.forEach(function (p) { EN.weaponParts.byKey[p.key] = p; });
