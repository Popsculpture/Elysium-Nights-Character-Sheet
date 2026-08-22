/* ===========================================================================
   ELYSIUM NIGHTS · Starting Gear Kits (Part 1, "Starting Gear Kits")
   The Core Freelance Pack every class gets, one Class Kit per class (option
   slots pick one of two), and a Subclass Extra. Everything prices off the
   main gear catalogs by exact item name; the 700 Glimmer budget's leftover
   loads onto the Glimmer Stick as starting cash.
   =========================================================================== */
window.EN = window.EN || {};

EN.kits = {
  budget: 700,
  intro: "Pick your Class Kit once your Class and Subclass are locked, then add your Subclass Extra. Where a slot lists two options, pick one.",
  budgetNote: "Every Freelancer starts with \u{1D4A2}700 to spend across the Core Pack, Class Kit, and Subclass Extra. Add up whatever you picked. Whatever is left over loads onto the Glimmer Stick in your Core Pack: real spending money for the first job, not a rounding error. Nobody's kit runs past that number, however they build it. Pick cheap and walk in with more cash on hand. Pick expensive and walk in with nothing to spare.",

  corePack: {
    blurb: "Comms, light, a way to keep files off the #GRID, food, water that won't turn on you, and a stick to hold whatever Glimmer is left once the shopping's done.",
    items: [
      { name: "Whisperlink Earpiece" },
      { name: "Flashlight" },
      { name: "Data Drive" },
      { name: "Basic Rations", qty: 2, label: "Basic Rations, 2 days" },
      { name: "Water Purification Tabs" },
      { name: "Glimmer Stick" }
    ]
  },

  /* one kit per class key; slots are pick-one-of-two, each option a list of
     {name, qty} entries so "plus 1 reload" rides along as its ammo box */
  classKits: {
    codebreaker: {
      note: "Your Smartdeck and Repertoire come from your class picks and cost nothing further here.",
      fixed: [{ name: "Smartdeck Peripheral Kit" }],
      slots: [
        { key: "weapon", label: "Weapon", options: [
          { label: "Taser (nonlethal)", items: [{ name: "Taser" }] },
          { label: "Snap-Blades", items: [{ name: "Snap-Blades" }] }
        ] },
        { key: "armor", label: "Armor", options: [
          { label: "Hypeplate", items: [{ name: "Hypeplate" }] },
          { label: "Liner Mesh", items: [{ name: "Liner Mesh" }] }
        ] },
        { key: "gear", label: "Gear", options: [
          { label: "Trauma Slap Patch", items: [{ name: "Trauma Slap Patch" }] },
          { label: "Faraday Pouch", items: [{ name: "Faraday Pouch" }] }
        ] }
      ]
    },
    fury: {
      note: "Composite Kit is the immovable object the class promises. Liner Mesh is for a Fury who would rather be fast and hungry than heavy.",
      fixed: [{ name: "Engineering Toolkit" }],
      slots: [
        { key: "weapon", label: "Weapon", options: [
          { label: "Warhammer", items: [{ name: "Warhammer" }] },
          { label: "Axe", items: [{ name: "Axe" }] }
        ] },
        { key: "armor", label: "Armor", options: [
          { label: "Composite Kit", items: [{ name: "Composite Kit" }] },
          { label: "Liner Mesh", items: [{ name: "Liner Mesh" }] }
        ] }
      ]
    },
    hustler: {
      fixed: [{ name: "Disguise and Styling Kit" }, { name: "Liner Mesh" }],
      slots: [
        { key: "weapon", label: "Weapon", options: [
          { label: "Pocket Pistol plus 1 reload", items: [{ name: "Pocket Pistol" }, { name: "Pistol Ammo" }] },
          { label: "Snap-Blades", items: [{ name: "Snap-Blades" }] }
        ] }
      ]
    },
    operator: {
      note: "The Pistol hits harder and reads as a licensed duty weapon. The Pocket Pistol conceals better.",
      fixed: [{ name: "Liner Mesh" }],
      slots: [
        { key: "weapon", label: "Weapon", options: [
          { label: "Pistol plus 1 reload", items: [{ name: "Pistol" }, { name: "Pistol Ammo" }] },
          { label: "Pocket Pistol plus 1 reload", items: [{ name: "Pocket Pistol" }, { name: "Pistol Ammo" }] }
        ] }
      ]
    },
    scoundrel: {
      fixed: [{ name: "Knife" }, { name: "Lockpick Set" }, { name: "Liner Mesh" }],
      slots: [
        { key: "weapon", label: "Weapon", options: [
          { label: "Pocket Pistol plus 1 reload", items: [{ name: "Pocket Pistol" }, { name: "Pistol Ammo" }] },
          { label: "Snap-Blades", items: [{ name: "Snap-Blades" }] }
        ] }
      ]
    },
    shaper: {
      note: "The Ward doesn't work without an equipped Warding Focus. Every Shaper starts with the cheapest one on the market and dreams about the rest.",
      fixed: [{ name: "Scrap Ward" }, { name: "Rite Calibration Kit" }, { name: "Liner Mesh" }],
      slots: [
        { key: "gear", label: "Gear", options: [
          { label: "Ritual Reagent Pouch", items: [{ name: "Ritual Reagent Pouch" }] },
          { label: "Knife", items: [{ name: "Knife" }] }
        ] }
      ]
    },
    stitcher: {
      note: "A Field Kit Trauma Rig [0] comes free with the class, the same as a Codebreaker's Standard Smartdeck, so it costs nothing out of this budget. It must be equipped to run Protocols, and its Output Bonus (+0 at this tier) feeds your Triage Save DC. Lose it and your Protocols go dark with it. Higher tiers are on sale in the gray market under Trauma Rigs.",
      fixed: [{ name: "Basic Medkit" }],
      slots: [
        { key: "weapon", label: "Weapon", options: [
          { label: "Taser plus Taser Cartridges, 1 reload", items: [{ name: "Taser" }, { name: "Taser Cartridges" }] },
          { label: "Snap-Blades", items: [{ name: "Snap-Blades" }] }
        ] },
        { key: "armor", label: "Armor", options: [
          { label: "Hypeplate", items: [{ name: "Hypeplate" }] },
          { label: "Liner Mesh", items: [{ name: "Liner Mesh" }] }
        ] }
      ]
    }
  },

  /* Subclass Extras, keyed by the subclass key in the class data files.
     glimmer: cash straight onto the Glimmer Stick instead of gear.
     replacesSlot: this extra supplants that Class Kit slot (Toxicologist). */
  subclassExtras: {
    rigger:           { items: [{ name: "Wireless Transceiver" }, { name: "Gridline Cable" }] },
    gridweaver:       { items: [{ name: "Disguise and Styling Kit" }] },
    burner:           { items: [{ name: "Thermite Slug" }, { name: "Fire Extinguisher" }] },
    juggernaut:       { items: [{ name: "Scrap Shield" }] },
    reaver:           { items: [{ name: "Hatchet" }, { name: "Vita-Pop" }] },
    arsenal:          { items: [{ name: "Smoke Grenade" }] },
    the_suit:         { items: [{ name: "Document and Contract Kit" }] },
    the_grifter:      { items: [{ name: "Fake License Portfolio" }] },
    the_fixer:        { items: [{ name: "Faraday Pouch" }, { name: "Wireless Transceiver" }] },
    the_vanguard:     { items: [{ name: "Ballistic Bracer" }] },
    the_deadeye:      { items: [{ name: "Tracer Rounds", label: "Tracer Rounds (10)" }] },
    the_headhunter:   { items: [{ name: "Custody and Control Kit" }, { name: "Standard Cuffs" }] },
    smuggler:         { items: [{ name: "Tag Eraser" }, { name: "Fake License Portfolio" }] },
    wildcard:         { glimmer: 75, note: "A Wildcard skips the gadget. Their subclass gear is \u{1D4A2}75 straight onto the stick, better odds on the cash they start with." },
    shiv:             { items: [{ name: "Dagger" }] },
    harmonist:        { items: [{ name: "Flow Tonic Vial" }] },
    kensei:           { items: [{ name: "Shock Gloves" }] },
    icon:             { items: [{ name: "Streaming Rig" }] },
    sourcerer:        { items: [{ name: "Wireless Transceiver" }, { name: "Multi Tool" }] },
    the_lifeline:     { items: [{ name: "Bio Monitor Band" }, { name: "Trauma Slap Patch" }] },
    the_toxicologist: { items: [{ name: "Dart Gun" }, { name: "Darts" }], replacesSlot: "weapon",
                        note: "A Toxicologist doesn't pick a weapon above. They start with a Dart Gun and Darts instead. The dart platform is what the toxins ride on, straight into First Do No Harm." },
    the_ripper:       { items: [{ name: "Neurocut Jack" }] }
  },

  /* Alternate Picks: an opt-in swap on the Subclass Extra */
  altPicks: {
    the_toxicologist: { label: "Flux Gel Sprayer instead of the Dart Gun and Darts", note: "Restraint over poison.",
                        items: [{ name: "Flux Gel Sprayer" }], replacesSlot: "weapon" },
    icon:             { label: "Field Recording Kit instead of the Streaming Rig", note: "Journalist instead of live feed celebrity.",
                        items: [{ name: "Field Recording Kit" }] },
    the_lifeline:     { label: "Drop the Bio Monitor Band; keep the Trauma Slap Patch alone",
                        items: [{ name: "Trauma Slap Patch" }] }
  },

  gmGuidance: "A Fury in the Composite Kit carrying a Warhammer (or Axe) and the Engineering Toolkit is carrying 6 Load: 2 for Medium Armor, 2 for the weapon, 2 for a full toolkit. Against the Encumbrance Threshold (6 + Body Modifier, minimum 3, adjusted by Size), that lands exactly at a Standard Loadout's Load Budget at Body +0, still Unencumbered, and comfortably under it at the +2 or +3 a Fury usually runs. Swap in Liner Mesh and the total drops to 5. The lighter classes carry less across the board and land further under their own Threshold no matter which options they take, which leaves room to use Packed It when the job goes sideways."
};
