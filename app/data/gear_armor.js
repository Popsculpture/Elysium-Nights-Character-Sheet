/* ===========================================================================
   ELYSIUM NIGHTS — Gear catalog: Armor and Defensive Gear
   Transcribed from "Part 3 — Armor and Defensive Gear" (the three Drive docs).
   Body armor, powered exoframes, and mystech shells provide Damage Reduction
   (DR) against the physical damage types; medium/heavy plate adds a flat Block
   Bonus. Physical Shields add Defense and a Block die; Warding Foci feed the
   Ward defense with a die. Prices in Glimmer (𝒢); some high-end gear also lists
   a Nexus (◎) alternative. Leased gear has 0 buy-in and a recurring Upkeep.
   Mystech runs its own Availability scale (Iconic → Legendary → Mythical →
   Artifact). Per-suit conditional effects (resistance choices, lease zero-state,
   Powered training) live in the entry's Effect line, not as auto-applied stats.

   Item kinds:
     kind:"armor"  → dr (number), blockBonus (flat, medium/heavy), slots
     kind:"shield" → defense (number), blockDie (string)
     kind:"focus"  → wardDie (string)
   =========================================================================== */
window.EN = window.EN || {};
EN.gearCatalog = EN.gearCatalog || {};

EN.gearCatalog.armor = {
  intro: "Armor is the difference between a bad night and a body bag. It does not make you invincible — it makes you survivable, which in Elysium is worth more. Most armor provides Damage Reduction (DR) against the physical types (Ballistic, Piercing, Slashing, Bludgeoning), applied as the passive mitigation step before damage reaches your Vigor, Vitality, and Wounds.",

  groupIntros: {
    "Light Armor": "Light armor hides. It passes as a jacket, a work shirt, a fashion choice that happened to stop a knife. It will not hold against a rifle, but it turns a lucky shank or a thrown punch into a bruise instead of a hole.",
    "Medium Armor": "Medium armor stops pretending. Real protection with real mobility and zero interest in hiding what it is. The gear that tells a room you came expecting a fight while still letting you walk through it.",
    "Heavy Armor": "Heavy armor is a commitment. You trade subtlety and the easy step for the right to stand somewhere and refuse to move. For the Freelancer who intends to hold ground rather than slip away from it.",
    "Powered Exoframe": "An exoframe is not armor you wear — it is armor you climb into. Servos carry the weight, the plating, and increasingly the person. Wearing one requires Heavy Armor proficiency; running it at full effect requires dedicated training. Untrained, the Powered trait imposes its drawbacks: reduced Speed and Snag on Agility checks.",
    "Mystech Armor": "Some armor does not stop the hit — it convinces the hit to stop. Mystech shells are woven through with Flow-conductive thread and tuned plate. Rarer than anything in the standard catalog, almost always Contraband, and they read as Flow-touched to anyone watching for it. Mystech armor interacts with the Ward defense and the Focus trait.",
    "Physical Shield": "A shield costs you a hand. In return you get a wall you can move. While wielded, a shield adds a flat Defense bonus and a Block die that sharpens your Block. Uses the Block, Full Defense, Stacking, and Shield Durability rules.",
    "Warding Focus": "A Warding Focus channels Flow into a shaped barrier, reinforcing the Ward defense instead of your armor — for the people who refuse to wear armor at all. Foci are Worn, carry the Focus and Mystech traits, and read as Flow-touched. You benefit from only one Warding Focus at a time, and foci do not use Shield Durability."
  },

  /* ---- Armor and Defensive Traits ---- */
  traits: {
    "Concealable": "It does not look like armor — worn under a shirt, or cut to pass as an ordinary jacket. Checks to notice you are armored roll with Snag. A pat-down or scanner still finds it.",
    "Streetwear": "Openly armored, but it reads as fashion. Does not count as obvious combat gear; Snag on social checks in high-corporate or formal spaces where street kit is out of place.",
    "Hostile Appearance": "Unmistakably combat gear — the room knows what you are the moment you walk in. Snag on social checks to blend in or de-escalate; Edge when you are openly threatening or intimidating.",
    "Bulky": "Rigid, layered, overbuilt. Reduces your Speed by 1 and imposes Snag on Mobility. Cannot be Concealable.",
    "Loud": "Plates clack, servos whine, respirators hiss. Snag on Stealth checks that rely on silence. It changes only how easily you are heard, not how you fight.",
    "Plated": "Rigid plates over soft layers, built to eat a serious hit. When you choose Block, add half the armor's DR (rounded down) to the damage prevented. Stacks with the suit's listed Block Bonus and with shield dice; applies only when you Block.",
    "Modular": "Rails, webbing, and slots for upgrades. Can mount Armor Mods up to its listed slot count. Swapping mods takes downtime or focused prep, not a combat action.",
    "Integrated": "Worn as one complete suit, not separable plates. Cannot be stripped into parts on the fly. If the armor is also Modular, it gains 1 extra mod slot. Some Integrated suits also pass as uniform or formalwear.",
    "Load-Bearing": "Reinforced webbing, hardpoints, and frame support. Your Encumbrance threshold counts as one step higher.",
    "Powered": "The armor carries its own power source and active systems. Running one takes Heavy Armor proficiency and dedicated training. Trained, you gain the suit's listed Powered Benefits; untrained, your Speed is reduced and you roll Agility checks with Snag.",
    "Sealed": "A closed shell of sealed joints, filters, and respirators. Resistance to Toxic damage, and Edge on saves against gas, disease, and airborne or environmental hazards. Some Sealed suits also cover vacuum.",
    "Mystech": "A fusion of synthetic engineering and the Flow. Counts as both technological and metaphysical gear for anything that targets either, and can be detected, disrupted, or overloaded as Flow gear. Needs specialist tools or contacts to repair and recharge.",
    "Focus": "Built to channel, shape, and anchor the Flow. Can empower Ward, as the item describes. You benefit from only one Focus item for Ward at a time.",
    "Resonant Plating": "Plate tuned to catch Flow as well as force. The armor's DR also applies against Resonant damage and is not ignored by Resonant Armor Bypass.",
    "Off-Hand": "Wielded in the off hand — the shield fully occupies that hand while raised. Uses the Block, Full Defense, Stacking, and Shield Durability rules.",
    "Worn": "Worn on the body rather than held in a hand (uses a Body Slot). Leaves both hands free. A Warding Focus is Worn.",
    "Light": "A light shield — minimal bulk. Leaves the braced hand free for one-handed weapon use and Invocations.",
    "Heavy": "A heavy shield — planted and braced. Slow to move with, but it carries the largest Defense bonus and Block die.",
    "Leased": "The armor is not yours — it runs on a corporate service plan, and the issuer keeps a finger on the off switch. You pay an Upkeep cost each period. Miss a payment, get flagged, or cross the issuer and the gear drops remotely to its zero state (armor to DR 0, a shield to no Defense bonus and no Block die) until you pay up or crack the lock. The holder can also repossess it outright. Cracked gear keeps working but scans as stolen corporate property."
  },

  items: [
    /* ============================== LIGHT ARMOR ============================== */
    { name: "SkinPlan Daywear", kind: "armor", group: "Light Armor", type: "Light Armor", price: 0, upkeep: 40,
      dr: 1, traits: ["Streetwear", "Leased"], availability: "Common", legality: "Legal",
      desc: "Armor as a service. The cut reads as this season's drop, the impact panels are real, and the whole thing keeps working exactly as long as the autopay clears. Miss one Tuesday and you are wearing a very expensive coat.",
      effect: "Grants 1 DR. A Premium plan (double Upkeep) raises this to 2 DR while active. Lapsed payment drops it to its zero state (DR 0)." },
    { name: "Liner Mesh", kind: "armor", group: "Light Armor", type: "Light Armor", price: 80,
      dr: 1, traits: ["Concealable"], availability: "Common", legality: "Legal",
      desc: "Quilted impact panels and ballistic gel sewn into ordinary clothing. The kind of thing a careful person wears under a work shirt and never mentions.",
      effect: "Grants 1 DR." },
    { name: "Hypeplate", kind: "armor", group: "Light Armor", type: "Light Armor", price: 120,
      dr: 1, traits: ["Streetwear"], availability: "Common", legality: "Legal",
      desc: "A padded streetwear vest with visible impact plates and a logo loud enough to read as a fashion statement instead of armor. Sells the wearer as a hypebeast, not a target.",
      effect: "Grants 1 DR." },
    { name: "Courier Shell", kind: "armor", group: "Light Armor", type: "Light Armor (1 Mod Slot)", price: 170,
      dr: 2, slots: 1, traits: ["Streetwear", "Modular"], availability: "Common", legality: "Legal",
      desc: "A cut-down riding shell built for people who move for a living. Matte panels, noise-damped seams, and just enough armor to survive a clip while you are already three rooftops gone.",
      effect: "Grants 2 DR. You gain Edge on in-combat Stealth d20 checks (or +1 Edge Die on out-of-combat Dice Pools) in dim light or darkness." },
    { name: "Slip Undervest", kind: "armor", group: "Light Armor", type: "Light Armor", price: 210,
      dr: 2, traits: ["Concealable"], availability: "Common", legality: "Licensed",
      desc: "A thin corporate ballistic layer designed to vanish under a shirt and a badge. Standard issue for executives who do not want their security detail to be the obvious one.",
      effect: "Grants 2 DR." },
    { name: "Adaptive Soft Suit", kind: "armor", group: "Light Armor", type: "Light Armor (2 Mod Slots)", price: 260,
      dr: 2, slots: 2, traits: ["Concealable", "Integrated", "Modular"], availability: "Uncommon", legality: "Restricted",
      desc: "A close-fitting smart fabric worn as a complete garment, with reactive panels that stiffen on impact. Reads as a sharp outfit until something tries to put a hole in it.",
      effect: "Grants 2 DR. As an Integrated and Modular armor, it carries 1 additional mod slot beyond its listed slot, for 2 total." },

    /* ============================== MEDIUM ARMOR ============================== */
    { name: "Composite Kit", kind: "armor", group: "Medium Armor", type: "Medium Armor", price: 320,
      dr: 3, traits: ["Hostile Appearance"], availability: "Common", legality: "Legal",
      desc: "Modular composite plates and soft panels bundled as a blunt, no-nonsense protection package. It looks like exactly what it is, and that is sometimes the point.",
      effect: "Grants 3 DR." },
    { name: "City Carrier", kind: "armor", group: "Medium Armor", type: "Medium Armor", price: 360,
      dr: 3, blockBonus: 1, traits: ["Streetwear", "Plated", "Bulky"], availability: "Common", legality: "Legal",
      desc: "A compact plate carrier built over a streetwear cut, optimized for close quarters and tight stairwells. Common enough on the lower tiers that nobody looks twice.",
      effect: "Grants 3 DR and a +1 Block Bonus." },
    { name: "Gig Harness", kind: "armor", group: "Medium Armor", type: "Medium Armor (2 Mod Slots)", price: 390,
      dr: 3, slots: 2, traits: ["Modular", "Load-Bearing"], availability: "Common", legality: "Legal",
      desc: "A rugged work-and-security harness covered in loops, pouches, and hardpoints. Built for the kind of Freelancer who hauls half a workshop into every contract.",
      effect: "Grants 3 DR." },
    { name: "Enforcer Rig", kind: "armor", group: "Medium Armor", type: "Medium Armor", price: 440,
      dr: 3, blockBonus: 1, traits: ["Plated", "Hostile Appearance"], availability: "Common", legality: "Licensed",
      desc: "Heavy front and back plates over dense padding, cut to read as a threat in any room. The uniform of people whose job is to walk toward the problem.",
      effect: "Grants 3 DR and a +1 Block Bonus." },
    { name: "Operator Suit", kind: "armor", group: "Medium Armor", type: "Medium Armor (4 Mod Slots)", price: 520,
      dr: 3, blockBonus: 1, slots: 4, traits: ["Plated", "Modular", "Integrated"], availability: "Uncommon", legality: "Restricted",
      desc: "Full-coverage tactical armor with integrated comms routing, gear mounts, and a clean professional silhouette. The serious answer for the Freelancer who treats a firefight like a job.",
      effect: "Grants 3 DR and a +1 Block Bonus. As an Integrated and Modular armor, it carries 1 additional mod slot beyond its listed slots, for 4 total." },
    { name: "Vanguard Plate", kind: "armor", group: "Medium Armor", type: "Medium Armor", price: 580,
      dr: 4, blockBonus: 1, traits: ["Plated", "Bulky"], availability: "Uncommon", legality: "Restricted",
      desc: "A heavy medium suit that gives up the easy step for an extra layer of hard plate. As much armor as you can carry before you cross into the kind that climbs into you.",
      effect: "Grants 4 DR and a +1 Block Bonus." },
    { name: "Sentinel Issue", kind: "armor", group: "Medium Armor", type: "Medium Armor", price: 0, upkeep: 120,
      dr: 3, blockBonus: 1, traits: ["Plated", "Hostile Appearance", "Leased"], availability: "Common", legality: "Licensed",
      desc: "Corporate security armor, leased to contractors by the shift. Full protection while your credential is live, and a quiet little brick in the spine for the moment you stop being theirs. Plenty of Freelancers wear it anyway — the plan is cheaper than the funeral.",
      effect: "Grants 3 DR and a +1 Block Bonus. Lapsed or Locked: DR drops to 1 and you lose the Block Bonus until you settle the account or crack the lock (lapsed payment, flagged Persona, or revoked credentials)." },

    /* ============================== HEAVY ARMOR ============================== */
    { name: "Scrap Plate", kind: "armor", group: "Heavy Armor", type: "Heavy Armor", price: 600,
      dr: 4, blockBonus: 2, traits: ["Plated", "Loud"], availability: "Common", legality: "Legal",
      desc: "Patchwork plating bolted onto mesh, leather, and whatever held still long enough to be welded. It rattles, it shows every fight it has survived, and it works.",
      effect: "Grants 4 DR and a +2 Block Bonus." },
    { name: "Foundry Shell", kind: "armor", group: "Heavy Armor", type: "Heavy Armor", price: 680,
      dr: 4, blockBonus: 2, traits: ["Plated", "Bulky", "Load-Bearing"], availability: "Common", legality: "Legal",
      desc: "An overbuilt industrial protective shell pulled off a refinery floor and repurposed for survival. Built for places where everything is bigger, hotter, and heavier than you.",
      effect: "Grants 4 DR and a +2 Block Bonus." },
    { name: "Riot Wall", kind: "armor", group: "Heavy Armor", type: "Heavy Armor", price: 740,
      dr: 4, blockBonus: 2, traits: ["Plated", "Bulky", "Sealed"], availability: "Uncommon", legality: "Licensed",
      desc: "Rounded, sealed riot armor issued to units that expect to be hit with gas, fire, and worse before anyone gets to bullets. Built to keep the air on the inside breathable.",
      effect: "Grants 4 DR and a +2 Block Bonus." },
    { name: "Breaker Harness", kind: "armor", group: "Heavy Armor", type: "Heavy Armor (3 Mod Slots)", price: 860,
      dr: 4, blockBonus: 2, slots: 3, traits: ["Plated", "Modular"], availability: "Uncommon", legality: "Restricted",
      desc: "An aggressive heavy rig layered in overlapping plates and reinforced webbing, built to be configured for whatever door you intend to walk through.",
      effect: "Grants 4 DR and a +2 Block Bonus." },
    { name: "Anvil Frame", kind: "armor", group: "Heavy Armor", type: "Heavy Armor", price: 920,
      dr: 5, blockBonus: 2, traits: ["Plated", "Bulky", "Loud"], availability: "Uncommon", legality: "Restricted",
      desc: "A slab of heavy plate with no slots, no smart fabric, and no apologies. The cheap way to be a wall, if you do not mind announcing yourself a corridor early and never sneaking again.",
      effect: "Grants 5 DR and a +2 Block Bonus." },
    { name: "Bastion Plate", kind: "armor", group: "Heavy Armor", type: "Heavy Armor (3 Mod Slots)", price: 980,
      dr: 5, blockBonus: 2, slots: 3, traits: ["Plated", "Bulky", "Modular"], availability: "Rare", legality: "Restricted",
      desc: "Full heavy plating that turns the wearer into a slow-moving structure. People do not flank a Bastion. They wait for it to leave.",
      effect: "Grants 5 DR and a +2 Block Bonus." },

    /* ============================ POWERED EXOFRAMES ============================ */
    { name: "Laborframe Exorig", kind: "armor", group: "Powered Exoframe", type: "Powered Heavy Armor (3 Mod Slots)", price: 1500,
      dr: 5, blockBonus: 2, slots: 3, traits: ["Powered", "Plated", "Bulky", "Loud"], availability: "Uncommon", legality: "Restricted",
      desc: "A civilian heavy-lift frame stripped of its safety governors and bolted full of plate. It was built to move cargo containers. It moves Freelancers, doors, and the occasional unlucky enforcer just as well.",
      effect: "Grants 5 DR and a +2 Block Bonus.",
      poweredBenefits: "While trained and powered, you ignore the Speed reduction from Bulky, treat your Encumbrance threshold as two steps higher, and gain Edge on in-combat d20 checks (or +1 Edge Die out-of-combat) to lift, shove, or force movement." },
    { name: "Bailiff Rig", kind: "armor", group: "Powered Exoframe", type: "Powered Heavy Armor (3 Mod Slots)", price: 0, upkeep: 400, nexus: "◎0.3 buyout",
      dr: 5, blockBonus: 2, slots: 3, traits: ["Powered", "Plated", "Bulky", "Loud", "Leased"], availability: "Uncommon", legality: "Restricted",
      desc: "The repo man's frame. Corporations lease these to enforcement contractors and keep one finger on the off switch the entire time. It carries you through a firefight right up until the morning the lease lapses and the legs simply stop agreeing with you.",
      effect: "Grants 5 DR and a +2 Block Bonus. Lapsed or Locked: the frame seizes — you lose all Powered Benefits, the Powered drawbacks apply in full, and DR drops to 3 until the lease is restored or the lock is cracked.",
      poweredBenefits: "While trained, powered, and on an active lease, you ignore the Speed reduction from Bulky, treat your Encumbrance threshold as two steps higher, and gain Edge on in-combat d20 checks (or +1 Edge Die out-of-combat) to lift, shove, or force movement." },
    { name: "Warframe Shell", kind: "armor", group: "Powered Exoframe", type: "Powered Heavy Armor (3 Mod Slots)", price: 2400, nexus: "◎0.25",
      dr: 5, blockBonus: 2, slots: 3, traits: ["Powered", "Plated", "Bulky", "Sealed", "Loud"], availability: "Rare", legality: "Restricted",
      desc: "A sealed military combat frame, the kind a corporation deploys when it has decided a problem is worth the optics. Air recycled, joints armored, every system tuned to keep one operator standing through a crossfire.",
      effect: "Grants 5 DR and a +2 Block Bonus. Its seals also hold against vacuum. When you acquire the frame, choose one physical damage type (Ballistic, Piercing, Slashing, or Bludgeoning) — you gain Resistance to that type.",
      poweredBenefits: "While trained and powered, you ignore the Speed reduction from Bulky, treat your Encumbrance threshold as two steps higher, and gain Edge on in-combat d20 checks (or +1 Edge Die out-of-combat) to lift, shove, or force movement." },

    /* ============================== MYSTECH ARMOR ============================== */
    { name: "Veilskin", kind: "armor", group: "Mystech Armor", type: "Light Mystech Armor (1 Mod Slot)", price: 700,
      dr: 2, slots: 1, traits: ["Concealable", "Mystech"], availability: "Iconic", legality: "Contraband",
      desc: "A second skin of light-reactive weave that drinks ambient Flow and bends light around the wearer's outline. To a scanner it is a faint shimmer. To a guard it is the reason they swear the corridor was empty a second ago.",
      effect: "Grants 2 DR. You gain Edge on in-combat Stealth d20 checks (or +1 Edge Die out-of-combat) in dim light or darkness. When you acquire it, choose one of Fire, Electric, or Cold — you gain Resistance to that type." },
    { name: "Resonant Carapace", kind: "armor", group: "Mystech Armor", type: "Medium Mystech Armor (2 Mod Slots)", price: 1600, nexus: "◎0.5",
      dr: 3, blockBonus: 1, slots: 2, wardDie: "1d6", traits: ["Plated", "Focus", "Resonant Plating", "Mystech"], availability: "Legendary", legality: "Contraband",
      desc: "Tuned mystech plate that hums against incoming force and feeds a fraction of every hit back into the wearer's Ward. The plating catches Flow as readily as it catches a round. Favored by Shapers who fight on the line instead of behind it.",
      effect: "Grants 3 DR and a +1 Block Bonus. As a Focus, once per round when you use Ward, add +1d6 to the Ward reduction. You can only benefit from one Focus item for Ward at a time." },
    { name: "Aegis Shroud", kind: "armor", group: "Mystech Armor", type: "Heavy Mystech Armor (2 Mod Slots)", price: 2800, nexus: "◎1",
      dr: 4, blockBonus: 1, slots: 2, wardDie: "1d6", traits: ["Focus", "Sealed", "Mystech"], availability: "Legendary", legality: "Contraband",
      desc: "A flowing sealed shell of woven mystech filament that surrounds the wearer in a layered current. It barely looks like armor. It behaves like a moving shrine that does not want you harmed.",
      effect: "Grants 4 DR and a +1 Block Bonus. When you acquire it, choose one of Fire, Electric, Cold, or Resonant — you gain Resistance to that type. As a Focus, once per round when you use Ward, add +1d6 to the Ward reduction. You can only benefit from one Focus item for Ward at a time." },
    { name: "Reliquary Shell", kind: "armor", group: "Mystech Armor", type: "Heavy Mystech Armor (2 Mod Slots)", price: 0, nexus: "◎2+", vendor: false,
      dr: 4, blockBonus: 2, slots: 2, wardDie: "1d6", traits: ["Focus", "Resonant Plating", "Sealed", "Mystech"], availability: "Artifact", legality: "Contraband",
      desc: "Nobody manufactures one of these. They are found: pulled from a sealed vault, recovered off a dead Shaper, traded for in a currency the broker would not name out loud. The kind of armor a campaign is built around, not bought.",
      effect: "Grants 4 DR and a +2 Block Bonus. When you acquire it, choose two of Fire, Electric, Cold, or Resonant — you gain Resistance to both. As a Focus, once per round when you use Ward, add +1d6 to the Ward reduction. Rarely offered for sale (◎2+)." },

    /* ============================== PHYSICAL SHIELDS ============================== */
    { name: "Scrap Shield", kind: "shield", group: "Physical Shield", type: "Physical Shield (+1 Defense, +1d4 Block)", price: 30,
      defense: 1, blockDie: "1d4", traits: ["Off-Hand", "Loud"], availability: "Common", legality: "Legal",
      desc: "A street sign, a manhole cover, a cafeteria tray, bolted to a forearm strap and a grab handle. It stops what it stops and dents doing it. Everyone in the lower wards has made one at least once, usually in a hurry.",
      effect: "Adds +1 to your Defense while wielded. It fully occupies the hand. Under the Shield Durability rules it has only 2 boxes instead of 3." },
    { name: "Ballistic Bracer", kind: "shield", group: "Physical Shield", type: "Physical Shield (+0 Defense, +1d4 Block)", price: 50,
      defense: 0, blockDie: "1d4", traits: ["Light", "Off-Hand"], availability: "Common", legality: "Legal",
      desc: "A forearm plate of layered polymer and ablative weave, strapped tight enough to throw a punch through. Leaves your hand free for a pistol, a deck, or a fistful of someone's collar.",
      effect: "Allows one-handed weapon use and Invocations with the braced hand." },
    { name: "Riot Shield", kind: "shield", group: "Physical Shield", type: "Physical Shield (+1 Defense, +1d6 Block)", price: 200,
      defense: 1, blockDie: "1d6", traits: ["Off-Hand"], availability: "Uncommon", legality: "Licensed",
      desc: "Transparent polycarbonate, issued to crowd-control lines and flagged by every scanner that reads it. Light enough to advance behind and built to walk into thrown bottles and stay upright while it does.",
      effect: "Adds +1 to your Defense while wielded. When you initiate Full Defense, you also gain Half Cover until the start of your next turn." },
    { name: "Sentinel Barrier", kind: "shield", group: "Physical Shield", type: "Physical Shield (+1 Defense, +1d6 Block)", price: 0, upkeep: 60,
      defense: 1, blockDie: "1d6", traits: ["Off-Hand", "Leased"], availability: "Common", legality: "Licensed",
      desc: "The leased, budget cousin of the Hardlight Barrier. A corporate emitter that throws the same plane of hardened light, billed by the week and stamped with whose it is. The morning the invoice bounces, you are gripping a dead handle.",
      effect: "Adds +1 to your Defense while wielded. Durability boxes represent emitter overload. Lapsed or Locked: the emitter goes dark — no Defense bonus and no Block die until you settle up or crack the lock." },
    { name: "Ballistic Bulwark", kind: "shield", group: "Physical Shield", type: "Physical Shield (+2 Defense, +1d8 Block)", price: 300,
      defense: 2, blockDie: "1d8", traits: ["Heavy", "Off-Hand"], availability: "Uncommon", legality: "Restricted",
      desc: "A planted ballistic wall you set down and fight from behind. It does not move fast. It does not need to. Hold a corridor with one and the corridor is yours until somebody brings a vehicle.",
      effect: "Adds +2 to your Defense while wielded. When you initiate Full Defense, you also gain three-quarter cover until the start of your next turn." },
    { name: "Hardlight Barrier", kind: "shield", group: "Physical Shield", type: "Physical Shield (+1 Defense, +1d6 Block)", price: 450,
      defense: 1, blockDie: "1d6", traits: ["Concealable", "Off-Hand"], availability: "Uncommon", legality: "Restricted",
      desc: "A wrist projector that throws a plane of hardened light on command. Stowed, it is a bracelet nobody clocks. Raised, it is a shield that was not there a second ago — exactly long enough to ruin someone's aim. Prototype corporate tech.",
      effect: "Adds +1 to your Defense while wielded. Projects when you raise it to Block or enter Full Defense, at no extra cost; fully occupies the hand while active. Stowed, it reads as a wrist unit or bracelet. Durability boxes represent projector overload." },

    /* ============================== WARDING FOCI ============================== */
    { name: "Scrap Ward", kind: "focus", group: "Warding Focus", type: "Warding Focus (+1d4 Ward)", price: 120,
      wardDie: "1d4", traits: ["Worn", "Focus", "Mystech"], availability: "Common", legality: "Legal",
      desc: "A Flow charm wired together from salvaged resonant thread and the casing of a dead Node. It hums wrong, it runs hot against the skin, and it catches just enough of a hit to matter. The lower wards make their own.",
      effect: "Once per round, add +1d4 to your Ward reduction." },
    { name: "Resonance Coil", kind: "focus", group: "Warding Focus", type: "Warding Focus (+1d4 Ward)", price: 250,
      wardDie: "1d4", traits: ["Worn", "Focus", "Mystech"], availability: "Uncommon", legality: "Licensed",
      desc: "A worn coil of tuned filament that drinks an incoming strike and rings with it like a struck bell. Standard kit for a Shaper who fights from inside the Flow instead of behind a wall.",
      effect: "Once per round, add +1d4 to your Ward reduction. When your Ward reduces an attack's damage to 0, you gain Resistance to that damage type until the start of your next turn (1/scene)." },
    { name: "Saint's Knot", kind: "focus", group: "Warding Focus", type: "Warding Focus (+1d6 Ward)", price: 600,
      wardDie: "1d6", traits: ["Worn", "Focus", "Mystech"], availability: "Legendary", legality: "Restricted",
      desc: "A knotted cord of Flow-soaked relic thread, passed hand to hand through people who needed it more than they could say. It does not look like protection. It behaves like something keeping a promise.",
      effect: "Once per round, add +1d6 to your Ward reduction. When your Ward reduces an attack's damage to 0, you gain Resistance to that damage type until the start of your next turn (2/scene)." },
    { name: "Hex Lattice Projector", kind: "focus", group: "Warding Focus", type: "Warding Focus (+1d8 Ward)", price: 1200, nexus: "◎0.5",
      wardDie: "1d8", traits: ["Worn", "Focus", "Mystech"], availability: "Legendary", legality: "Restricted",
      desc: "A worn projector that lays a shifting lattice of Flow across the body and rewrites it faster than anything can break it. The kind of device that comes with a list of previous owners, and a list of people those owners no longer talk to.",
      effect: "Once per round, add +1d8 to your Ward reduction. When your Ward reduces an attack's damage to 0, you gain Resistance to that damage type until the start of your next turn (unlimited uses per scene)." },
    { name: "Martyr's Halo", kind: "focus", group: "Warding Focus", type: "Warding Focus (+1d8 Ward)", price: 0, nexus: "◎2+", vendor: false,
      wardDie: "1d8", traits: ["Worn", "Focus", "Mystech"], availability: "Artifact", legality: "Contraband",
      desc: "A ring of suspended Flow that hangs unsupported at the shoulders and will not explain itself. Nobody manufactured it. It was left behind by something that no longer needed it. It guards whoever wears it, and it remembers whoever tried not to let them.",
      effect: "Once per round, add +1d8 to your Ward reduction. When your Ward reduces an attack's damage to 0, you gain Resistance to that damage type until the start of your next turn (unlimited uses per scene), and the attacker takes Resonant damage equal to your Flow Modifier. Rarely offered for sale (◎2+)." }
  ]
};
