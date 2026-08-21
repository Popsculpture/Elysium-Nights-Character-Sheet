/* ===========================================================================
   ELYSIUM NIGHTS - Pre-made example Freelancers, one per class

   Seven finished Level 5 characters that live in the switcher under EXAMPLES,
   below whatever the player has built. They are DEFINED HERE AND NEVER STORED:
   store.setExample() mints a fresh copy on every selection, so an example cannot
   be deleted, cannot drift, and survives clearing site data. Editing one works
   exactly like editing any character and the edits evaporate on reload, which is
   what "example" ought to mean. SAVE AS MY OWN copies one into the real roster
   when a player wants to build from it.

   Each entry is a PATCH over a real blank character, not a full record. A stored
   70-field copy would rot the moment a new default field is added: these would be
   the seven characters in the app missing it. Patching inherits every future
   default for free, and means each example below reads as just its own choices.

   WHY ONE PER CLASS, AND ALL FIVE SPECIES. Every class drives a different engine
   path (Bandwidth through a deck, Triage through a Rig, Flow, Overdrive, Leverage,
   Execution, Moxie), so this set is also the widest cheap test surface in the app:
   a change that breaks any resource, any lineage or any gear category shows up in
   one of these seven. Species are spread deliberately for the same reason.

   THE GEAR IS PRICED, NOT SPRINKLED. Each kit is built to a model of what a Level 5
   Freelancer is actually worth: about 4,000 to 7,000 Glimmer all in, mostly in gear
   and very little in cash, since a crew climbing to Level 5 runs roughly eight
   contracts against twenty weeks of living costs and spends the difference staying
   alive. The seven are spread across that band on purpose rather than levelled:
   Wren's deck ate her whole life, Odile is the reverse and holds cash instead of
   armor, Pip owns thirty cheap things, Bekh owns four expensive ones. Every item
   name here resolves in the gear catalog, every price is the catalog price, and
   every on-person Load lands under its owner's Encumbrance Threshold with a point
   of headroom left to pick something up mid-run. STASHED GEAR COSTS NO LOAD, which
   is why the stashes are generous and the loadouts are disciplined.

   NO INSTALLED CYBERWARE, deliberately. The Chrome card reads an implant's
   description and effect straight off the stored object with no catalog fallback,
   so shipping chrome on an example would copy catalog prose into this file, which
   is the exact duplication the patch design exists to prevent.
   =========================================================================== */
window.EN = window.EN || {};

EN.examples = [
  {
    key: "codebreaker",
    name: "Wren \"Latchkey\" Osei",
    label: "Codebreaker",
    blurb: "A Gridweaver who never met a door that stayed a door.",
    patch: {
      firstName: "Wren", lastName: "Osei",
      level: 5, heightFt: 5.6,
      species: "humans", lineage: "nextgen", background: "cipher-punk",
      class: "codebreaker", subclass: "gridweaver",
      attributes: { TEC: 16, WIT: 15, AGI: 13, CHA: 12, MYS: 10, BOD: 10 },
      identity: {
        handle: "Latchkey",
        concept: "Grew up opening things that were locked for a reason. Still does, now with better tools.",
        whereFrom: "Raised in a stack of leased apartments where the landlord's cameras were the only thing that ever got fixed."
      },
      equipment: [
        /* Weapons */
        { id: "ex_cb_gun", name: "Pocket Pistol", qty: 1 },
        { id: "ex_cb_knife", name: "Knife", qty: 1 },
        /* Ammunition */
        { name: "Pistol Ammo", qty: 2 },
        /* Armor, shields and foci */
        { id: "ex_cb_arm", name: "Liner Mesh", qty: 1 },
        /* Class hardware */
        { id: "ex_cb_deck", name: "Advanced Smartdeck", qty: 1 },
        { name: "Reinforced Heatsinks", qty: 1 },
        { name: "Sweep Suite Plug-In", qty: 1 },
        /* Cipher library */
        { name: "Logic Bomb", qty: 1 },
        { name: "Spoof Persona", qty: 1 },
        { name: "Decoy Persona", qty: 1 },
        { name: "Puppet String", qty: 1 },
        /* Skill kits */
        { name: "Codebreaker Suite", qty: 1 },
        { id: "ex_cb_pkit", name: "Smartdeck Peripheral Kit", qty: 1 },
        { name: "Lockpick Set", qty: 1 },
        /* Devices */
        { name: "Whisperlink Comms Tap", qty: 1 },
        { name: "Whisperlink Earpiece", qty: 1 },
        { id: "ex_cb_light", name: "Flashlight", qty: 1 },
        { name: "Wireless Transceiver", qty: 1 },
        { name: "Respirator Mask", qty: 1 },
        { name: "Lighter", qty: 1 },
        { name: "Portable Door Alarm Kit", qty: 1 },
        /* Carry gear */
        { id: "ex_cb_pack", name: "Backpack", qty: 1 },
        { id: "ex_cb_belt", name: "Utility Belt", qty: 1 },
        { id: "ex_cb_holster", name: "Swift Draw Holster", qty: 1 },
        /* Consumables and papers */
        { name: "Data Drive", qty: 3 },
        { name: "Faraday Pouch", qty: 1 },
        { name: "#PRINT", qty: 1 },
        { name: "Trauma Slap Patch", qty: 2 },
        { name: "Med Foam Canister", qty: 1 },
        { name: "Vita-Pop", qty: 2 },
        { name: "Glimmer Stick", qty: 2 },
        { name: "Basic Rations", qty: 5 },
        { name: "Water Purification Tabs", qty: 1 },
        { name: "Nightwatch Tablets", qty: 2 }
      ],
      carry: {
        "Codebreaker Suite": "carried",
        "ex_cb_pkit": "racked",
        "ex_cb_gun": "racked",
        "Pistol Ammo": "carried",
        "ex_cb_knife": "racked",
        "ex_cb_pack": "worn",
        "ex_cb_belt": "worn",
        "ex_cb_holster": "worn",
        "Whisperlink Comms Tap": "carried",
        "Whisperlink Earpiece": "worn",
        "ex_cb_light": "racked",
        "Data Drive": "carried",
        "Faraday Pouch": "carried",
        "#PRINT": "carried",
        "Wireless Transceiver": "carried",
        "Trauma Slap Patch": "carried",
        "Med Foam Canister": "carried",
        "Vita-Pop": "carried",
        "Respirator Mask": "worn",
        "Glimmer Stick": "carried",
        "Lighter": "carried"
      },
      racked: {
        "ex_cb_gun": "ex_cb_holster",
        "ex_cb_pkit": "ex_cb_pack",
        "ex_cb_knife": "ex_cb_belt",
        "ex_cb_light": "ex_cb_belt"
      },
      equippedWeapons: ["ex_cb_gun", "ex_cb_knife"],
      equippedArmor: "ex_cb_arm",
      grid: { deckKey: "ex_cb_deck", deckMods: { "ex_cb_deck": ["heatsinks", "sweep"] } },
      loadout: "standard",
      glimmer: 340
    }
  },
  {
    key: "fury",
    name: "Bekh \"Anvil\" Tarrow",
    label: "Fury",
    blurb: "A Juggernaut who treats the street furniture as a munitions locker.",
    patch: {
      firstName: "Bekh", lastName: "Tarrow",
      level: 5, heightFt: 6.8,
      species: "chimera", lineage: "hulsk", background: "ganger",
      class: "fury", subclass: "juggernaut",
      attributes: { BOD: 16, WIT: 14, AGI: 13, CHA: 12, TEC: 10, MYS: 10 },
      identity: {
        handle: "Anvil",
        concept: "Big, patient, and entirely willing to hit you with a vending machine.",
        whereFrom: "Came up in a crew where the smallest one carried the gun and the biggest one carried everyone else."
      },
      equipment: [
        /* Weapons */
        { id: "ex_fu_wep", name: "Maul", qty: 1 },
        { id: "ex_fu_hammer", name: "Warhammer", qty: 1 },
        { id: "ex_fu_smoke", name: "Smoke Grenade", qty: 1 },
        { name: "Frag Grenade Mk I", qty: 2 },
        /* Armor, shields and foci */
        { id: "ex_fu_arm", name: "Foundry Shell", qty: 1 },
        { id: "ex_fu_shield", name: "Scrap Shield", qty: 1 },
        { name: "Composite Kit", qty: 1 },
        { name: "Ballistic Bulwark", qty: 1 },
        /* Installed parts and mods */
        { name: "Weighted Head", qty: 1 },
        { name: "Counterweight Pommel", qty: 1 },
        { name: "Inertia Core", qty: 1 },
        { name: "Quick-Release Tether", qty: 1 },
        { name: "Flanged Head", qty: 1 },
        /* Skill kits */
        { id: "ex_fu_climb", name: "Climbing Gear", qty: 1 },
        { name: "Engineering Toolkit", qty: 1 },
        /* Devices */
        { id: "ex_fu_bar", name: "Crowbar", qty: 1 },
        { id: "ex_fu_lamp", name: "Flashlight", qty: 1 },
        { name: "Whisperlink Earpiece", qty: 1 },
        { name: "Respirator Mask", qty: 1 },
        { name: "Vital Sync Bracer", qty: 1 },
        { name: "Lighter", qty: 1 },
        { name: "Wireless Transceiver", qty: 1 },
        { name: "Walkie Talkie", qty: 1 },
        /* Carry gear */
        { id: "ex_fu_pack", name: "Backpack", qty: 1 },
        { id: "ex_fu_belt", name: "Utility Belt", qty: 1 },
        { id: "ex_fu_sheath", name: "Sheath", qty: 1 },
        /* Consumables and papers */
        { name: "Trauma Slap Patch", qty: 2 },
        { name: "Med Foam Canister", qty: 1 },
        { name: "Vita-Pop", qty: 2 },
        { name: "Nightwatch Tablets", qty: 2 },
        { name: "Basic Rations", qty: 5 },
        { name: "Glimmer Stick", qty: 2 },
        { name: "Water Purification Tabs", qty: 1 },
        { name: "Data Drive", qty: 3 }
      ],
      carry: {
        "ex_fu_wep": "racked",
        "ex_fu_hammer": "racked",
        "ex_fu_pack": "worn",
        "ex_fu_belt": "worn",
        "ex_fu_sheath": "worn",
        "ex_fu_smoke": "racked",
        "ex_fu_bar": "racked",
        "ex_fu_lamp": "racked",
        "ex_fu_climb": "racked",
        "Whisperlink Earpiece": "worn",
        "Respirator Mask": "worn",
        "Vital Sync Bracer": "worn",
        "Trauma Slap Patch": "carried",
        "Med Foam Canister": "carried",
        "Vita-Pop": "carried",
        "Nightwatch Tablets": "carried",
        "Basic Rations": "carried",
        "Glimmer Stick": "carried",
        "Lighter": "carried",
        "Water Purification Tabs": "carried",
        "Wireless Transceiver": "carried"
      },
      racked: {
        "ex_fu_wep": "ex_fu_sheath",
        "ex_fu_hammer": "ex_fu_belt",
        "ex_fu_smoke": "ex_fu_belt",
        "ex_fu_bar": "ex_fu_pack",
        "ex_fu_lamp": "ex_fu_pack",
        "ex_fu_climb": "ex_fu_pack"
      },
      equippedWeapons: ["ex_fu_wep", "ex_fu_hammer"],
      equippedArmor: "ex_fu_arm",
      equippedShield: "ex_fu_shield",
      weaponParts: {
        "ex_fu_wep": { _profile: "auto", targeting: null, output: "weighted-head", core: "inertia-core", handling: "counterweight-pommel", utility: ["quick-release-tether"] },
        "ex_fu_hammer": { _profile: "auto", targeting: null, output: "flanged-head", core: null, handling: null, utility: [] },
      },
      loadout: "standard",
      glimmer: 410
    }
  },
  {
    key: "hustler",
    name: "Odile \"Paperwork\" Vantz",
    label: "Hustler",
    blurb: "A Fixer who has never once raised her voice and always gets the room.",
    patch: {
      firstName: "Odile", lastName: "Vantz",
      level: 5, heightFt: 5.7,
      species: "humans", lineage: "freeborn", background: "boardroom-exile",
      class: "hustler", subclass: "the_fixer",
      attributes: { CHA: 16, WIT: 15, AGI: 13, TEC: 12, BOD: 10, MYS: 10 },
      identity: {
        handle: "Paperwork",
        concept: "Was very good at a very bad job, then took the contact list with her on the way out.",
        whereFrom: "Twelve floors up, until the day the badge stopped opening the lift."
      },
      equipment: [
        /* Weapons */
        { id: "ex_hu_wep", name: "Pocket Pistol", qty: 1 },
        { id: "ex_hu_taser", name: "Taser", qty: 1 },
        /* Ammunition */
        { name: "Pistol Ammo", qty: 1 },
        { name: "Taser Cartridges", qty: 1 },
        { name: "Rubber Rounds", qty: 1 },
        /* Armor, shields and foci */
        { id: "ex_hu_arm", name: "SkinPlan Daywear", qty: 1, leaseOwned: true, leaseDue: false },
        { id: "ex_hu_mesh", name: "Liner Mesh", qty: 1 },
        /* Skill kits */
        { id: "ex_hu_face", name: "Disguise and Styling Kit", qty: 1 },
        { id: "ex_hu_venue", name: "Venue Kit", qty: 1 },
        { id: "ex_hu_docs", name: "Document and Contract Kit", qty: 1 },
        /* Devices */
        { id: "ex_hu_sweep", name: "Bug Scanner", qty: 1 },
        { name: "Metal Detector", qty: 1 },
        { name: "Throwcam", qty: 1 },
        { name: "Null Veil Projector", qty: 1 },
        { name: "Whisperlink Comms Tap", qty: 1 },
        { name: "Whisperlink Earpiece", qty: 1 },
        { name: "Wireless Transceiver", qty: 1 },
        { name: "Respirator Mask", qty: 1 },
        { id: "ex_hu_light", name: "Flashlight", qty: 1 },
        { name: "Lighter", qty: 1 },
        /* Carry gear */
        { id: "ex_hu_holster", name: "Swift Draw Holster", qty: 1 },
        { id: "ex_hu_pack", name: "Backpack", qty: 1 },
        { id: "ex_hu_belt", name: "Utility Belt", qty: 1 },
        /* Consumables and papers */
        { name: "Faraday Pouch", qty: 1 },
        { name: "#PRINT", qty: 1 },
        { name: "Fake License Portfolio", qty: 2 },
        { name: "Data Drive", qty: 3 },
        { name: "Trauma Slap Patch", qty: 2 },
        { name: "Med Foam Canister", qty: 1 },
        { name: "Vita-Pop", qty: 2 },
        { name: "Nightwatch Tablets", qty: 2 },
        { name: "Glimmer Stick", qty: 2 },
        { name: "Basic Rations", qty: 5 },
        { name: "Water Purification Tabs", qty: 1 }
      ],
      carry: {
        "ex_hu_wep": "racked",
        "Pistol Ammo": "carried",
        "ex_hu_taser": "racked",
        "Taser Cartridges": "carried",
        "ex_hu_holster": "worn",
        "ex_hu_pack": "worn",
        "ex_hu_belt": "worn",
        "ex_hu_venue": "racked",
        "ex_hu_docs": "racked",
        "ex_hu_sweep": "racked",
        "Metal Detector": "carried",
        "Throwcam": "carried",
        "Null Veil Projector": "carried",
        "Whisperlink Comms Tap": "worn",
        "Whisperlink Earpiece": "worn",
        "Wireless Transceiver": "carried",
        "Faraday Pouch": "carried",
        "#PRINT": "carried",
        "Fake License Portfolio": "carried",
        "Data Drive": "carried",
        "Trauma Slap Patch": "carried",
        "Vita-Pop": "carried",
        "ex_hu_light": "racked",
        "Glimmer Stick": "carried",
        "Lighter": "carried"
      },
      racked: {
        "ex_hu_taser": "ex_hu_holster",
        "ex_hu_wep": "ex_hu_pack",
        "ex_hu_sweep": "ex_hu_pack",
        "ex_hu_light": "ex_hu_pack",
        "ex_hu_venue": "ex_hu_belt",
        "ex_hu_docs": "ex_hu_belt"
      },
      equippedWeapons: ["ex_hu_wep", "ex_hu_taser"],
      equippedArmor: "ex_hu_arm",
      loadout: "standard",
      glimmer: 1650, nexus: 1
    }
  },
  {
    key: "operator",
    name: "Sable \"Longshot\" Ferro",
    label: "Operator",
    blurb: "A Deadeye who picks the roof before anyone else picks the fight.",
    patch: {
      firstName: "Sable", lastName: "Ferro",
      level: 5, heightFt: 5.9,
      species: "outsiders", lineage: "harbinger", background: "hired-gun",
      class: "operator", subclass: "the_deadeye",
      attributes: { WIT: 16, AGI: 15, BOD: 13, TEC: 12, CHA: 10, MYS: 10 },
      identity: {
        handle: "Longshot",
        concept: "Arrives early, says little, and has already worked out where you will stand.",
        whereFrom: "Contract work in places that do not appear on the transit map."
      },
      equipment: [
        /* Weapons */
        { id: "ex_op_wep", name: "Marksman Rifle", qty: 1 },
        { id: "ex_op_side", name: "Revolver", qty: 1 },
        /* Ammunition */
        { name: "Rifle Ammo", qty: 3 },
        { name: "Pistol Ammo", qty: 2 },
        { id: "ex_op_trace", name: "Tracer Rounds", qty: 1 },
        /* Armor, shields and foci */
        { id: "ex_op_arm", name: "Courier Shell", qty: 1 },
        /* Installed parts and mods */
        { name: "Match Barrel", qty: 1 },
        { name: "Marksman Stock", qty: 1 },
        { name: "Thermal Optic", qty: 1 },
        { name: "Target Spotter", qty: 1 },
        { name: "Case Catcher", qty: 1 },
        { name: "Threat-Detection HUD", qty: 1 },
        /* Skill kits */
        { id: "ex_op_climb", name: "Climbing Gear", qty: 1 },
        { id: "ex_op_custody", name: "Custody and Control Kit", qty: 1 },
        { name: "Document and Contract Kit", qty: 1 },
        { name: "Navigation and Survival Pack", qty: 1 },
        /* Devices */
        { id: "ex_op_drone", name: "Halo Drone", qty: 1 },
        { name: "Whisperlink Earpiece", qty: 1 },
        { name: "Wireless Transceiver", qty: 1 },
        { name: "Respirator Mask", qty: 1 },
        { name: "Lighter", qty: 1 },
        /* Carry gear */
        { id: "ex_op_pack", name: "Backpack", qty: 1 },
        { id: "ex_op_belt", name: "Utility Belt", qty: 1 },
        { id: "ex_op_holster", name: "Swift Draw Holster", qty: 1 },
        /* Consumables and papers */
        { name: "Nightwatch Tablets", qty: 2 },
        { name: "Basic Rations", qty: 5 },
        { name: "Water Purification Tabs", qty: 1 },
        { name: "Trauma Slap Patch", qty: 2 },
        { name: "Med Foam Canister", qty: 1 },
        { name: "Vita-Pop", qty: 2 },
        { name: "Glimmer Stick", qty: 2 },
        { name: "Data Drive", qty: 3 },
        { name: "#PRINT", qty: 1 },
        { name: "Faraday Pouch", qty: 1 }
      ],
      carry: {
        "ex_op_wep": "racked",
        "Match Barrel": "carried",
        "Marksman Stock": "carried",
        "Thermal Optic": "carried",
        "Target Spotter": "carried",
        "Case Catcher": "carried",
        "ex_op_side": "racked",
        "Threat-Detection HUD": "worn",
        "Rifle Ammo": "carried",
        "Pistol Ammo": "carried",
        "ex_op_trace": "racked",
        "ex_op_drone": "racked",
        "ex_op_climb": "racked",
        "ex_op_custody": "racked",
        "Whisperlink Earpiece": "worn",
        "Wireless Transceiver": "carried",
        "Nightwatch Tablets": "carried",
        "Basic Rations": "carried",
        "Water Purification Tabs": "carried",
        "Trauma Slap Patch": "carried",
        "Med Foam Canister": "carried",
        "Vita-Pop": "carried",
        "Respirator Mask": "worn",
        "ex_op_pack": "worn",
        "ex_op_belt": "worn",
        "ex_op_holster": "worn",
        "Glimmer Stick": "carried",
        "Lighter": "carried"
      },
      racked: {
        "ex_op_wep": "ex_op_pack",
        "ex_op_climb": "ex_op_pack",
        "ex_op_custody": "ex_op_pack",
        "ex_op_trace": "ex_op_belt",
        "ex_op_drone": "ex_op_belt",
        "ex_op_side": "ex_op_holster"
      },
      equippedWeapons: ["ex_op_wep", "ex_op_side"],
      equippedArmor: "ex_op_arm",
      loadout: "standard",
      glimmer: 730
    }
  },
  {
    key: "scoundrel",
    name: "Pip \"Understory\" Ghal",
    label: "Scoundrel",
    blurb: "A Smuggler who is always somewhere slightly better than where you looked.",
    patch: {
      firstName: "Pip", lastName: "Ghal",
      level: 5, heightFt: 5.2,
      species: "verdine", lineage: "mycelial", background: "courier",
      class: "scoundrel", subclass: "smuggler",
      attributes: { AGI: 16, WIT: 15, CHA: 13, TEC: 12, BOD: 10, MYS: 10 },
      identity: {
        handle: "Understory",
        concept: "Carries other people's problems across the city for money and does not ask what is in the box.",
        whereFrom: "A courier hub that ran on favours, and a network of tunnels nobody drew on a map."
      },
      equipment: [
        /* Weapons */
        { id: "ex_sc_gun", name: "Pocket Pistol", qty: 1 },
        { id: "ex_sc_blades", name: "Snap-Blades", qty: 1 },
        { id: "ex_sc_smoke", name: "Smoke Grenade", qty: 1 },
        { id: "ex_sc_wep", name: "Dagger", qty: 1 },
        /* Ammunition */
        { name: "Pistol Ammo", qty: 2 },
        { name: "Whisper Rounds", qty: 1 },
        /* Armor, shields and foci */
        { id: "ex_sc_arm", name: "SkinPlan Daywear", qty: 1 },
        /* Skill kits */
        { id: "ex_sc_picks", name: "Lockpick Set", qty: 1 },
        { id: "ex_sc_vault", name: "Vault Bypass Kit", qty: 1 },
        /* Devices */
        { id: "ex_sc_tag", name: "Tag Eraser", qty: 1 },
        { id: "ex_sc_baton", name: "Echolight Baton", qty: 1 },
        { name: "Adaptive Camo Cloak", qty: 1 },
        { name: "Gravshift Anklets", qty: 1 },
        { name: "Respirator Mask", qty: 1 },
        { name: "Whisperlink Earpiece", qty: 1 },
        { name: "Wireless Transceiver", qty: 1 },
        { name: "Lighter", qty: 1 },
        { name: "Walkie Talkie", qty: 1 },
        { name: "Gridline Lumen Cable", qty: 1 },
        { name: "Covert Ziprunner", qty: 1 },
        /* Carry gear */
        { id: "ex_sc_holster", name: "Swift Draw Holster", qty: 1 },
        { id: "ex_sc_pack", name: "Backpack", qty: 1 },
        { id: "ex_sc_belt", name: "Utility Belt", qty: 1 },
        /* Consumables and papers */
        { name: "Fake License Portfolio", qty: 2 },
        { name: "#PRINT", qty: 1 },
        { name: "Faraday Pouch", qty: 2 },
        { name: "Trauma Slap Patch", qty: 2 },
        { name: "Med Foam Canister", qty: 2 },
        { name: "Glimmer Stick", qty: 10 },
        { name: "Data Drive", qty: 12 },
        { name: "Basic Rations", qty: 8 },
        { name: "Vita-Pop", qty: 4 },
        { name: "Nightwatch Tablets", qty: 2 },
        { name: "Water Purification Tabs", qty: 2 }
      ],
      carry: {
        "ex_sc_gun": "racked",
        "ex_sc_holster": "worn",
        "ex_sc_pack": "worn",
        "ex_sc_belt": "worn",
        "ex_sc_picks": "racked",
        "ex_sc_vault": "racked",
        "ex_sc_tag": "racked",
        "ex_sc_baton": "racked",
        "ex_sc_smoke": "racked",
        "Adaptive Camo Cloak": "worn",
        "Gravshift Anklets": "worn",
        "Respirator Mask": "worn",
        "Whisperlink Earpiece": "worn",
        "Fake License Portfolio": "carried",
        "#PRINT": "carried",
        "Faraday Pouch": "carried",
        "Trauma Slap Patch": "carried",
        "Med Foam Canister": "carried",
        "Glimmer Stick": "carried",
        "Pistol Ammo": "carried",
        "Wireless Transceiver": "carried",
        "Lighter": "carried"
      },
      racked: {
        "ex_sc_gun": "ex_sc_holster",
        "ex_sc_picks": "ex_sc_belt",
        "ex_sc_tag": "ex_sc_belt",
        "ex_sc_vault": "ex_sc_pack",
        "ex_sc_baton": "ex_sc_pack",
        "ex_sc_smoke": "ex_sc_pack"
      },
      equippedWeapons: ["ex_sc_gun", "ex_sc_blades"],
      equippedArmor: "ex_sc_arm",
      loadout: "standard",
      glimmer: 950, nexus: 1
    }
  },
  {
    key: "shaper",
    name: "Marisol \"Fold\" Quiroga",
    label: "Shaper",
    blurb: "A Sourcerer who treats distance as a suggestion and the #GRID as weather.",
    patch: {
      firstName: "Marisol", lastName: "Quiroga",
      level: 5, heightFt: 5.5,
      species: "verdine", lineage: "floral", background: "minimum-wage-mage",
      class: "shaper", subclass: "sourcerer",
      attributes: { MYS: 16, WIT: 14, AGI: 13, BOD: 12, TEC: 11, CHA: 10 },
      identity: {
        handle: "Fold",
        concept: "Learned the Flow doing corporate weather work, then found out what else it does.",
        whereFrom: "Six years of shift work keeping an arcology's air breathable, on an hourly rate."
      },
      equipment: [
        /* Weapons */
        { id: "ex_sh_taser", name: "Taser", qty: 1 },
        { id: "ex_sh_wep", name: "Knife", qty: 1 },
        /* Ammunition */
        { name: "Taser Cartridges", qty: 1 },
        /* Armor, shields and foci */
        { id: "ex_sh_arm", name: "Veilskin", qty: 1 },
        { id: "ex_sh_focus", name: "Resonance Coil", qty: 1 },
        /* Skill kits */
        { id: "ex_sh_rite", name: "Rite Calibration Kit", qty: 1 },
        { name: "Flow Survey Pack", qty: 1 },
        { name: "Document and Contract Kit", qty: 1 },
        /* Devices */
        { name: "Respirator Mask", qty: 1 },
        { name: "Whisperlink Earpiece", qty: 1 },
        { name: "Wireless Transceiver", qty: 1 },
        { name: "Lighter", qty: 1 },
        { name: "Multi Tool", qty: 1 },
        { name: "Hazmat Suit", qty: 1 },
        { name: "Fire Extinguisher", qty: 1 },
        /* Carry gear */
        { id: "ex_sh_pack", name: "Backpack", qty: 1 },
        { id: "ex_sh_belt", name: "Utility Belt", qty: 1 },
        { id: "ex_sh_holster", name: "Swift Draw Holster", qty: 1 },
        /* Consumables and papers */
        { id: "ex_sh_pouch", name: "Ritual Reagent Pouch", qty: 2 },
        { name: "Trauma Slap Patch", qty: 2 },
        { name: "Med Foam Canister", qty: 1 },
        { name: "Vita-Pop", qty: 2 },
        { name: "Data Drive", qty: 3 },
        { name: "Basic Rations", qty: 5 },
        { name: "Water Purification Tabs", qty: 1 },
        { name: "Glimmer Stick", qty: 2 },
        { name: "#PRINT", qty: 1 },
        { name: "Faraday Pouch", qty: 1 },
        /* Flow */
        { id: "ex_sh_lantern", name: "Flow Lantern", qty: 1 },
        { name: "Channel Stabilizer Band", qty: 1 },
        { name: "Flow Tonic Vial", qty: 3 },
        { name: "Channel Cleanse Tonic", qty: 1 },
        { name: "Resonant Shield Elixir", qty: 2 }
      ],
      carry: {
        "ex_sh_taser": "racked",
        "ex_sh_wep": "racked",
        "ex_sh_pack": "worn",
        "ex_sh_belt": "worn",
        "ex_sh_holster": "worn",
        "ex_sh_rite": "racked",
        "ex_sh_pouch": "racked",
        "ex_sh_lantern": "racked",
        "Respirator Mask": "worn",
        "Whisperlink Earpiece": "worn",
        "Wireless Transceiver": "worn",
        "Channel Stabilizer Band": "worn",
        "Taser Cartridges": "carried",
        "Flow Tonic Vial": "carried",
        "Channel Cleanse Tonic": "carried",
        "Resonant Shield Elixir": "carried",
        "Trauma Slap Patch": "carried",
        "Med Foam Canister": "carried",
        "Vita-Pop": "carried",
        "Data Drive": "carried",
        "Basic Rations": "carried",
        "Water Purification Tabs": "carried",
        "Glimmer Stick": "carried",
        "#PRINT": "carried",
        "Faraday Pouch": "carried",
        "Lighter": "carried"
      },
      racked: {
        "ex_sh_taser": "ex_sh_holster",
        "ex_sh_wep": "ex_sh_pack",
        "ex_sh_rite": "ex_sh_pack",
        "ex_sh_pouch": "ex_sh_belt",
        "ex_sh_lantern": "ex_sh_belt"
      },
      equippedWeapons: ["ex_sh_taser", "ex_sh_wep"],
      equippedArmor: "ex_sh_arm",
      equippedFocus: "ex_sh_focus",
      loadout: "standard",
      glimmer: 600
    }
  },
  {
    key: "stitcher",
    name: "Halden \"Tourniquet\" Brack",
    label: "Stitcher",
    blurb: "A Lifeline who has never lost anyone he could still reach.",
    patch: {
      firstName: "Halden", lastName: "Brack",
      level: 5, heightFt: 6,
      species: "clankers", lineage: "durabodies", background: "street-doc",
      class: "stitcher", subclass: "the_lifeline",
      attributes: { TEC: 16, WIT: 15, AGI: 13, BOD: 12, CHA: 10, MYS: 10 },
      identity: {
        handle: "Tourniquet",
        concept: "Runs a clinic out of whatever room is nearest, and keeps a running tab nobody pays.",
        whereFrom: "Worked triage in a ward that lost its funding and kept its queue."
      },
      equipment: [
        /* Weapons */
        { id: "ex_st_wep", name: "Pocket Pistol", qty: 1 },
        { id: "ex_st_bat", name: "Baton", qty: 1 },
        /* Ammunition */
        { name: "Pistol Ammo", qty: 2 },
        { id: "ex_st_rub", name: "Rubber Rounds", qty: 1 },
        /* Armor, shields and foci */
        { id: "ex_st_arm", name: "Gig Harness", qty: 1 },
        { name: "Liner Mesh", qty: 1 },
        /* Class hardware */
        { id: "ex_st_rig", name: "Trauma Grade Trauma Rig [2]", qty: 1 },
        /* Skill kits */
        { id: "ex_st_bag", name: "Street Doc Bag", qty: 1 },
        { name: "Basic Medkit", qty: 1 },
        { name: "Engineering Toolkit", qty: 1 },
        /* Devices */
        { name: "Portable Door Alarm Kit", qty: 1 },
        { name: "Bio Monitor Band", qty: 1 },
        { name: "Respirator Mask", qty: 1 },
        { name: "Whisperlink Earpiece", qty: 1 },
        { name: "Wireless Transceiver", qty: 1 },
        { name: "Walkie Talkie", qty: 3 },
        { id: "ex_st_light", name: "Flashlight", qty: 1 },
        { name: "Lighter", qty: 1 },
        /* Carry gear */
        { id: "ex_st_pack", name: "Backpack", qty: 1 },
        { id: "ex_st_belt", name: "Utility Belt", qty: 1 },
        { id: "ex_st_hol", name: "Swift Draw Holster", qty: 1 },
        /* Consumables and papers */
        { name: "Trauma Slap Patch", qty: 4 },
        { name: "Med Foam Canister", qty: 2 },
        { name: "Detox Patch", qty: 2 },
        { name: "Adrenaline Amp", qty: 1 },
        { name: "Emergency Sealant Foam", qty: 2 },
        { name: "Vita-Pop", qty: 4 },
        { name: "Nightwatch Tablets", qty: 2 },
        { name: "Data Drive", qty: 3 },
        { name: "Basic Rations", qty: 5 },
        { name: "Water Purification Tabs", qty: 1 },
        { name: "Glimmer Stick", qty: 2 },
        { name: "#PRINT", qty: 1 },
        { name: "Faraday Pouch", qty: 1 }
      ],
      carry: {
        "ex_st_wep": "racked",
        "Pistol Ammo": "carried",
        "ex_st_rub": "racked",
        "ex_st_bat": "racked",
        "ex_st_bag": "racked",
        "Trauma Slap Patch": "carried",
        "Med Foam Canister": "carried",
        "Detox Patch": "carried",
        "Adrenaline Amp": "carried",
        "Emergency Sealant Foam": "carried",
        "Vita-Pop": "carried",
        "Nightwatch Tablets": "carried",
        "Bio Monitor Band": "worn",
        "Respirator Mask": "worn",
        "Whisperlink Earpiece": "carried",
        "Wireless Transceiver": "carried",
        "ex_st_pack": "worn",
        "ex_st_belt": "worn",
        "ex_st_hol": "worn",
        "ex_st_light": "racked",
        "Lighter": "carried",
        "Data Drive": "carried",
        "Water Purification Tabs": "carried",
        "Glimmer Stick": "carried",
        "#PRINT": "carried",
        "Faraday Pouch": "carried"
      },
      racked: {
        "ex_st_wep": "ex_st_hol",
        "ex_st_bag": "ex_st_pack",
        "ex_st_light": "ex_st_pack",
        "ex_st_rub": "ex_st_pack",
        "ex_st_bat": "ex_st_belt"
      },
      equippedWeapons: ["ex_st_wep"],
      equippedArmor: "ex_st_arm",
      rig: { key: "ex_st_rig" },
      loadout: "standard",
      glimmer: 540
    }
  }
];
