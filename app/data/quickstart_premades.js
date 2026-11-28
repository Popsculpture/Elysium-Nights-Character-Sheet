/* Quick-Start (EN1003): premades. Filled in by its own pass; see js/quickstart.js for how it is switched on. */
window.EN = window.EN || {};
EN.quickstart = EN.quickstart || {};

/* ===========================================================================
   ELYSIUM NIGHTS - The Quick-Start crew

   The five pre-generated Freelancers of the Quick-Start Rules (EN1003, "Pick
   Your Freelancer" and each one's RECORD SHEET): Gantry (Fury), Ledger
   (Codebreaker), Sunday (Shaper), Copper (Stitcher) and Tinsel (Hustler), all
   Level 1, Caliber 1. js/quickstart.js appends them to EN.examples only while
   the device's Quick-Start setting is on, so they then behave exactly like the
   pre-mades in data/examples.js.

   Each entry is the pre-made shape documented at the top of data/examples.js:
   a PATCH over a blank character (newCharacter() in js/store.js). Every choice
   here (Class and Background picks, Starting Kit slots, Ciphers, Maneuvers,
   Protocols, Leverage, Resonances and Patterns) is the one that rebuilds the
   record sheet's numbers through the app's own rules; nothing is typed in as a
   final number. Item names resolve in the gear catalog. No chrome on a pre-made.
   =========================================================================== */
EN.quickstart.premades = [
{
  key: "qs-gantry",
  name: "KW-17 \"Gantry\"",
  label: "Fury",
  blurb: "A seven-foot security Laborframe who walked off a corporate riot line after a Nixie woke up their core.",
  patch: {
    firstName: "KW-17",
    lastName: "",
    identity: {
      concept: "A seven-foot security Laborframe who walked off a corporate riot line after a Nixie woke up their core.",
      handle: "Gantry",
      handleStory: "KW-17 was the model tag the leasing company stamped on them. Gantry is what the crew calls the frame that walks point and holds the line while everyone else gets through.",
      whereFrom: "Gantry came off the line as a heavy security Laborframe, leased out by the week to guard corporate loading docks and break picket lines. Three years in, on a riot call in Switchyard, a Nixie slipped into their processing core. Gantry stopped mid-swing, lowered the baton, and saw that the person on the ground was a person, not a red threat-tag on a HUD. The leasing company logged it as a critical firmware defect. Gantry counts it as their birthday.\n\nThey still know the patrol routes, radio codes and shift rotations of half the private security outfits in Elysium from walking those beats. Now they walk point for the crew instead, and anything that wants the team has to get through seven feet of sanded-down corporate armor first.",
      facets: "Speaks with stiff, leftover corporate politeness. Works out weights, clearances and odds out loud.",
      coreSparks: "Nobody gets left pinned down alone. A contract is not ownership.",
      tethers: "Dez, a retired dispatcher who still calls them \"Seventeen.\" The Switchyard scrap-mechanics who rebuilt their busted knee off the books.",
      faultLines: "Freezes for a beat whenever someone reads out an asset serial number. Can't walk past someone working an unpaid shift.",
      appearance: "Seven feet of heavy security chassis, the corporate livery sanded down to bare plate. Wears unmistakable riot hardware: a Composite Kit and a Scrap Shield.",
      notes: "Pronouns: they/them.\nCrew role: hold the chokepoint, shove enemies clear, smash through cover.\nBackstory hook: an old shift supervisor still texts Gantry for off-the-books favors, while corporate asset recovery wants KW-17 back on the ledger.\nPersonal item: their old credential card. The mag-strip is dead and it opens nothing, but it reminds them what they swore to do and who they owe it to (no mechanical benefit).\nLanguages: Common Trade, Machine Cant."
    },
    level: 1,
    attributeMethod: "array",
    attributes: { BOD: 16, AGI: 14, WIT: 16, TEC: 12, MYS: 8, PRE: 12 },
    arrayAssign: { BOD: 16, AGI: 14, WIT: 16, TEC: 12, MYS: 8, PRE: 12 },
    species: "clankers",
    lineage: "laborframes",
    heightFt: 7,
    lineageFeatures: ["Heavy Payload"],
    background: "badge",
    backgroundSkillChoice: "perception",
    backgroundProfChoices: ["Security Tools", "Ground Vehicles"],
    class: "fury",
    subclass: "juggernaut",
    classSkillChoices: ["engineering"],
    classGearChoices: { weapons: [], armor: [], tools: ["Fieldcraft Tools"], vehicles: [] },
    startingKit: {
      claimed: true,
      picks: { weapon: 1, armor: 0, carry: 1 },
      alt: false,
      granted: [
        { key: "qs_ga_ear", qty: 1 }, { key: "qs_ga_light", qty: 1 }, { key: "Data Drive", qty: 1 },
        { key: "Basic Rations", qty: 2 }, { key: "Water Purification Tabs", qty: 1 }, { key: "Glimmer Stick", qty: 1 },
        { key: "qs_ga_tools", qty: 1 }, { key: "qs_ga_axe", qty: 1 }, { key: "qs_ga_armor", qty: 1 },
        { key: "qs_ga_belt", qty: 1 }, { key: "qs_ga_shield", qty: 1 }
      ],
      glimmerGranted: 120,
      claimedClass: "fury",
      claimedSubclass: "juggernaut",
      claimedBudget: 800
    },
    gambits: ["fury.maneuver.pile_driver", "fury.maneuver.close_protection"],
    equipment: [
      { id: "qs_ga_ear", name: "Whisperlink Earpiece", qty: 1 },
      { id: "qs_ga_light", name: "Flashlight", qty: 1 },
      { name: "Data Drive", qty: 1 },
      { name: "Basic Rations", qty: 2 },
      { name: "Water Purification Tabs", qty: 1 },
      { name: "Glimmer Stick", qty: 1 },
      { id: "qs_ga_tools", name: "Engineering Toolkit", qty: 1 },
      { id: "qs_ga_axe", name: "Axe", qty: 1 },
      { id: "qs_ga_armor", name: "Composite Kit", qty: 1 },
      { id: "qs_ga_belt", name: "Utility Belt", qty: 1 },
      { id: "qs_ga_shield", name: "Scrap Shield", qty: 1 }
    ],
    equippedWeapons: ["qs_ga_axe"],
    equippedArmor: "qs_ga_armor",
    equippedShield: "qs_ga_shield",
    carry: {
      qs_ga_ear: "carried", qs_ga_light: "racked", "Data Drive": "carried", "Basic Rations": "carried",
      "Water Purification Tabs": "carried", "Glimmer Stick": "carried", qs_ga_tools: "racked",
      qs_ga_axe: "carried", qs_ga_armor: "carried", qs_ga_belt: "worn", qs_ga_shield: "carried"
    },
    racked: { qs_ga_tools: "qs_ga_belt", qs_ga_light: "qs_ga_belt" },
    loadout: "standard",
    glimmer: 120,
    ledger: [{ t: 1795824000000, m: "Starting kit claimed: the leftover goes on your Glimmer Stick", g: 120, n: 0, gb: 120, nb: 0 }],
    face: {
      contacts: [
        { id: "ct_qs_ga_dez", name: "Dez", print: "", handle: "", kind: "professional", work: "Retired dispatcher",
          why: "Still calls Gantry \"Seventeen\" and still picks up.", offers: "", fence: "", origin: "background",
          disposition: "friendly", state: "open", faction: "", tell: "", notes: "" },
        { id: "ct_qs_ga_partner", name: "Old patrol partner", print: "", handle: "", kind: "professional", work: "Still on a corporate security payroll",
          why: "Walked the same beats as Gantry before the Nixie.", offers: "", fence: "", origin: "background",
          disposition: "neutral", state: "open", faction: "", tell: "", notes: "" }
      ]
    }
  }
},
{
  key: "qs-ledger",
  name: "Imani \"Ledger\" Vos",
  label: "Codebreaker",
  blurb: "A high-orbit relay tech who brought a custom deck down the grav-well, looking for real hardware and better pay.",
  patch: {
    firstName: "Imani",
    lastName: "Vos",
    identity: {
      concept: "A high-orbit relay tech who brought a custom deck down the grav-well, looking for real hardware and better pay.",
      handle: "Ledger",
      handleStory: "Ledger keeps the crew's names off the logs. If a job is supposed to leave no Heat, she is the one who makes sure the books say nobody was ever there.",
      whereFrom: "Ledger grew up on a commercial telemetry relay in high orbit, where three families kept the dish arrays aligned and bounced corporate traffic down to Elysium. Between maintenance shifts there was little to do but splice into encrypted streams, trade bootleg media with passing tug crews, and build decks out of burned-out routing boards.\n\nShe came down the grav-well looking for real hardware and better pay, carrying a soldering iron and a deck wired from a salvaged freight transponder and secondhand comm-slates. After a youth spent untangling orbital signal traffic, breaking into Elysium's corporate Nodes feels like working in slow motion.",
      facets: "Treats a live breach like a routine maintenance shift, usually with a takeaway carton open beside the deck. Talks in clipped relay shorthand and skips the pleasantries while she works.",
      coreSparks: "Pay the people who keep the lines open. Data locked behind a corporate paywall is fair game.",
      tethers: "The three relay families still on the high-orbit array, who get her spare Glimmer and parts. The scrapyard owner who fronted her deck components on credit.",
      faultLines: "Can't leave a locked signal alone once she knows someone is hiding traffic on it. Goes cold and quiet when a corporate rep starts lecturing about charter rights.",
      appearance: "Five foot four. Her custom deck is a salvaged freight transponder and a stack of secondhand comm-slates, held together with solder.",
      notes: "Pronouns: she/her.\nCrew role: breach building Nodes, loop cameras, keep the crew's names off the logs. Fragile up close (7 Vitality), so she stays out of the crossfire.\nBackstory hook: a dockside syndicate fixer claims the core routing board in Ledger's custom deck was lifted from one of their couriers.\nPersonal item: a grease-stained notebook of orbital relay handshakes, dish alignment tables and tug-crew radio frequencies (no mechanical benefit).\nLanguages: Common Trade, Undercity Patter."
    },
    level: 1,
    attributeMethod: "array",
    attributes: { BOD: 12, AGI: 16, WIT: 14, TEC: 16, MYS: 8, PRE: 12 },
    arrayAssign: { BOD: 12, AGI: 16, WIT: 14, TEC: 16, MYS: 8, PRE: 12 },
    species: "humans",
    lineage: "freeborn",
    heightFt: 5 + 4 / 12,
    lineageFeatures: ["Lowlight Optics"],
    speciesLanguage: "Undercity Patter",
    background: "gearhead",
    backgroundSkillChoice: "athletics",
    backgroundProfChoices: ["Engineering Tools", "Ground Vehicles"],
    class: "codebreaker",
    subclass: "burner",
    classSkillChoices: ["investigation"],
    classGearChoices: { weapons: [], armor: [], tools: ["Infiltration Tools"], vehicles: [] },
    startingKit: {
      claimed: true,
      picks: { weapon: 0, armor: 1, gear: 1, carry: 0 },
      alt: false,
      granted: [
        { key: "qs_le_ear", qty: 1 }, { key: "qs_le_light", qty: 1 }, { key: "Data Drive", qty: 1 },
        { key: "Basic Rations", qty: 2 }, { key: "Water Purification Tabs", qty: 1 }, { key: "Glimmer Stick", qty: 1 },
        { key: "qs_le_periph", qty: 1 }, { key: "qs_le_taser", qty: 1 }, { key: "qs_le_armor", qty: 1 },
        { key: "Faraday Pouch", qty: 1 }, { key: "qs_le_holster", qty: 1 }, { key: "Thermite Slug", qty: 1 },
        { key: "qs_le_ext", qty: 1 },
        { key: "qs_le_deck", qty: 1, classItem: "startingDeckGranted" }
      ],
      glimmerGranted: 180,
      claimedClass: "codebreaker",
      claimedSubclass: "burner",
      claimedBudget: 800
    },
    startingCiphers: ["Logic Bomb", "Hotwire", "Cold Boot", "Tracker Scrub"],
    startingDeckGranted: true,
    grid: { deckKey: "qs_le_deck", deckHpSpent: {}, deckMods: {}, links: [] },
    equipment: [
      { id: "qs_le_ear", name: "Whisperlink Earpiece", qty: 1 },
      { id: "qs_le_light", name: "Flashlight", qty: 1 },
      { name: "Data Drive", qty: 1 },
      { name: "Basic Rations", qty: 2 },
      { name: "Water Purification Tabs", qty: 1 },
      { name: "Glimmer Stick", qty: 1 },
      { id: "qs_le_periph", name: "Smartdeck Peripheral Kit", qty: 1 },
      { id: "qs_le_taser", name: "Taser", qty: 1 },
      { id: "qs_le_armor", name: "Liner Mesh", qty: 1 },
      { name: "Faraday Pouch", qty: 1 },
      { id: "qs_le_holster", name: "Swift Draw Holster", qty: 1 },
      { name: "Thermite Slug", qty: 1 },
      { id: "qs_le_ext", name: "Fire Extinguisher", qty: 1 },
      { id: "qs_le_deck", name: "Standard Smartdeck", qty: 1 }
    ],
    equippedWeapons: ["qs_le_taser"],
    equippedArmor: "qs_le_armor",
    carry: {
      qs_le_ear: "carried", qs_le_light: "carried", "Data Drive": "carried", "Basic Rations": "carried",
      "Water Purification Tabs": "carried", "Glimmer Stick": "carried", qs_le_periph: "carried",
      qs_le_taser: "racked", qs_le_armor: "carried", "Faraday Pouch": "carried", qs_le_holster: "worn",
      "Thermite Slug": "carried", qs_le_ext: "carried", qs_le_deck: "carried"
    },
    racked: { qs_le_taser: "qs_le_holster" },
    loadout: "standard",
    glimmer: 180,
    ledger: [{ t: 1795824000000, m: "Starting kit claimed: the leftover goes on your Glimmer Stick", g: 180, n: 0, gb: 180, nb: 0 }],
    face: {
      contacts: [
        { id: "ct_qs_le_yard", name: "Scrapyard owner", print: "", handle: "", kind: "professional", work: "Runs a scrapyard",
          why: "Sets good parts aside for Ledger, and fronted her deck components on credit.", offers: "", fence: "", origin: "background",
          disposition: "friendly", state: "open", faction: "", tell: "", notes: "" },
        { id: "ct_qs_le_tug", name: "Tug-boat comms officer", print: "", handle: "", kind: "professional", work: "Comms officer on an orbital tug",
          why: "Runs messages and contraband between orbit and the docks.", offers: "", fence: "", origin: "background",
          disposition: "neutral", state: "open", faction: "", tell: "", notes: "" }
      ]
    }
  }
},
{
  key: "qs-sunday",
  name: "\"Sunday\" of the Culvert Grove",
  label: "Shaper",
  blurb: "A VIP-lounge Floral who talked his way onto downtown guest lists from nothing and shapes the Flow beneath the concrete.",
  patch: {
    firstName: "",
    lastName: "of the Culvert Grove",
    identity: {
      concept: "A VIP-lounge Floral who talked his way onto downtown guest lists from nothing and shapes the Flow beneath the concrete.",
      handle: "Sunday",
      handleStory: "His grove was paved over for a parking structure, but a tangle of its roots still pushes through a cracked drainage pipe on sub-level B2. He goes down to water and prune it on Sundays, and the name stuck.",
      whereFrom: "Sunday's grove was a sunken culvert garden wedged between two warehouse blocks, thick with wild ferns, fruit trees and runoff moss, until a developer poured a four-story parking structure over the lot. The roots that survive in sub-level B2 are what he has left of it.\n\nFlorals have an easy, magnetic presence that makes people want to stand close and talk, and Sunday used it to get past velvet ropes and onto VIP lists at three downtown clubs, starting with nothing. He made himself the guy every high-end lounge wants in the room: sharp-dressed on borrowed credit, quick with an introduction, and discreet enough that corporate directors and street fixers forget he isn't one of them.\n\nThe Flow comes to him the way it comes to most Harmonists, as a steady pulse under the city's noise. Most nights it feels like bass through the floorboards. Some nights it feels like the buried soil pushing back against the concrete.",
      facets: "Mirrors the posture, slang and pacing of whoever is buying the drinks. Remembers every name and grudge in the room.",
      coreSparks: "Concrete does not erase what grew underneath. What gets said in the booth stays in the booth.",
      tethers: "The root-tangle clinging to the drainage pipe under sub-level B2. Mira, a club manager who keeps him on the guest list because he keeps big spenders happy.",
      faultLines: "Gets tense and short-tempered inside sealed, windowless concrete buildings. Refuses to burn or trash a living space to cover the crew's tracks.",
      appearance: "Five foot ten, sharp-dressed on borrowed credit, with the easy Floral presence that draws a room in.",
      notes: "Pronouns: he/him.\nCrew role: put a guard to sleep, fry a camera, drop cover where there isn't any.\nBackstory hook: Sunday overheard a Clearline VP (Clearline is Fullwell's water company) admit to skimming construction funds on a city contract. He has kept quiet only because leaking it would bring corporate heat down on Mira's club.\nPersonal item: an empty crystal perfume bottle left behind by a regular who stopped showing up, still holding a faint trace of custom synth-scent (no mechanical benefit).\nLanguages: Common Trade, Root-code."
    },
    level: 1,
    attributeMethod: "array",
    attributes: { BOD: 16, AGI: 14, WIT: 12, TEC: 8, MYS: 16, PRE: 12 },
    arrayAssign: { BOD: 16, AGI: 14, WIT: 12, TEC: 8, MYS: 16, PRE: 12 },
    species: "verdine",
    lineage: "floral",
    heightFt: 5 + 10 / 12,
    lineageFeatures: ["Pheromone Bloom"],
    background: "glow-idol",
    backgroundSkillChoice: "deception",
    backgroundProfChoices: ["Glamour Tools", "Ground Vehicles"],
    class: "shaper",
    subclass: "harmonist",
    classSkillChoices: ["perception"],
    classGearChoices: { weapons: [], armor: [], tools: ["Medical Tools"], vehicles: [] },
    startingKit: {
      claimed: true,
      picks: { gear: 1, carry: 1 },
      alt: false,
      granted: [
        { key: "qs_su_ear", qty: 1 }, { key: "qs_su_light", qty: 1 }, { key: "Data Drive", qty: 1 },
        { key: "Basic Rations", qty: 2 }, { key: "Water Purification Tabs", qty: 1 }, { key: "Glimmer Stick", qty: 1 },
        { key: "qs_su_ward", qty: 1 }, { key: "qs_su_rite", qty: 1 }, { key: "qs_su_armor", qty: 1 },
        { key: "qs_su_knife", qty: 1 }, { key: "qs_su_pack", qty: 1 }, { key: "Flow Tonic Vial", qty: 1 }
      ],
      glimmerGranted: 220,
      claimedClass: "shaper",
      claimedSubclass: "harmonist",
      claimedBudget: 800
    },
    resonances: ["kinetic", "electromagnetic", "visceral"],
    flow: {
      patterns: [
        { name: "Spark", resonance: "electromagnetic", intent: "damage", deliveryBand: "directed", deliveryOption: "Remote", force: "base", duration: "instant", precision: false },
        { name: "Shove", resonance: "kinetic", intent: "effect", deliveryBand: "directed", deliveryOption: "Remote", force: "base", duration: "instant", precision: false, baseEffect: "Push or Pull" },
        { name: "Patch", resonance: "visceral", intent: "effect", deliveryBand: "directed", deliveryOption: "Remote", force: "base", duration: "instant", precision: false, baseEffect: "Patch", unwilling: false },
        { name: "Kinetic Slam", resonance: "kinetic", intent: "damage", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false },
        { name: "Lights Out", resonance: "visceral", intent: "effect", deliveryBand: "directed", deliveryOption: "Remote", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Forceful Sedation" },
        { name: "Blackout", resonance: "electromagnetic", intent: "effect", deliveryBand: "focused", deliveryOption: "Cube (2 spaces)", force: "empowered", duration: "instant", precision: false, empoweredEffect: "Optic Scramble" },
        { name: "Shockwave", resonance: "kinetic", intent: "damage", deliveryBand: "wide", deliveryOption: "Cone (3 spaces)", force: "empowered", duration: "instant", precision: false },
        { name: "Wall of Air", resonance: "kinetic", intent: "effect", deliveryBand: "focused", deliveryOption: "Cube (2 spaces)", force: "empowered", duration: "sustain", precision: false, empoweredEffect: "Kinetic Barrier", unwilling: false }
      ]
    },
    equipment: [
      { id: "qs_su_ear", name: "Whisperlink Earpiece", qty: 1 },
      { id: "qs_su_light", name: "Flashlight", qty: 1 },
      { name: "Data Drive", qty: 1 },
      { name: "Basic Rations", qty: 2 },
      { name: "Water Purification Tabs", qty: 1 },
      { name: "Glimmer Stick", qty: 1 },
      { id: "qs_su_ward", name: "Scrap Ward", qty: 1 },
      { id: "qs_su_rite", name: "Rite Calibration Kit", qty: 1 },
      { id: "qs_su_armor", name: "Liner Mesh", qty: 1 },
      { id: "qs_su_knife", name: "Knife", qty: 1 },
      { id: "qs_su_pack", name: "Backpack", qty: 1 },
      { name: "Flow Tonic Vial", qty: 1 }
    ],
    equippedWeapons: ["qs_su_knife"],
    equippedArmor: "qs_su_armor",
    equippedFocus: "qs_su_ward",
    carry: {
      qs_su_ear: "carried", qs_su_light: "racked", "Data Drive": "carried", "Basic Rations": "carried",
      "Water Purification Tabs": "carried", "Glimmer Stick": "carried", qs_su_ward: "worn",
      qs_su_rite: "racked", qs_su_armor: "carried", qs_su_knife: "carried", qs_su_pack: "worn",
      "Flow Tonic Vial": "carried"
    },
    racked: { qs_su_rite: "qs_su_pack", qs_su_light: "qs_su_pack" },
    loadout: "standard",
    glimmer: 220,
    ledger: [{ t: 1795824000000, m: "Starting kit claimed: the leftover goes on your Glimmer Stick", g: 220, n: 0, gb: 220, nb: 0 }],
    face: {
      contacts: [
        { id: "ct_qs_su_mira", name: "Mira", print: "", handle: "", kind: "professional", work: "Club manager",
          why: "Comps his tab in exchange for him working the room and smoothing over ugly scenes.", offers: "", fence: "", origin: "background",
          disposition: "friendly", state: "open", faction: "", tell: "", notes: "" },
        { id: "ct_qs_su_vp", name: "Clearline VP", print: "", handle: "", kind: "professional", work: "Mid-level VP at Clearline, Fullwell's water company",
          why: "Gets sloppy after three drinks.", offers: "", fence: "", origin: "background",
          disposition: "neutral", state: "open", faction: "", tell: "", notes: "" }
      ]
    }
  }
},
{
  key: "qs-copper",
  name: "Ada \"Copper\" Ferreira-Lune",
  label: "Stitcher",
  blurb: "A Ryn courier who traded her warren's parcel bags for a re-wired corporate trauma rig.",
  patch: {
    firstName: "Ada",
    lastName: "Ferreira-Lune",
    identity: {
      concept: "A Ryn courier who traded her warren's parcel bags for a re-wired corporate trauma rig.",
      handle: "Copper",
      handleStory: "Copper earned her handle running her warren's parcels across rooftops, rail gaps and utility alleys, and kept it when she traded the parcel bags for a trauma kit.",
      whereFrom: "Copper ran packages for her warren's courier outfit as a kid, cutting across rooftops, rail gaps and utility alleys that bypassed the street-level checkpoints. At sixteen she hauled a bleeding stranger eleven blocks to an off-grid clinic because nobody else on the block would touch him. Watching the street doc patch him up and send him walking out the door convinced her to trade parcel bags for a trauma kit.\n\nThe medical rig on her hip is standard corporate-issue hardware, stripped down and re-wired for back-alley work where half the patients are leaking hydraulic fluid along with blood.",
      facets: "Pins her ears flat when she wants to look harmless. Cracks dry gallows jokes while stitching people up under fire.",
      coreSparks: "Everyone who starts the run comes back from it. Nobody should bleed out on the street because they couldn't afford a clinic deposit.",
      tethers: "Her warren's courier outfit in the lower wards, which still lets her use its dead-drops and boltholes. The corner street-clinic where she learned field triage.",
      faultLines: "Elevators, locked cells and tight blind alleys set off panic. Gets tunnel vision the second someone drops, and sprints across open ground before anyone has suppressed the shooters.",
      appearance: "Five foot six, all ears and courier legs, with a re-wired corporate trauma rig on her hip.",
      notes: "Pronouns: she/her.\nCrew role: keep the crew on their feet, move first, never get ambushed. Stays within 6 spaces of the crew.\nBackstory hook: a local syndicate lieutenant still wants Copper's head for opening a sealed parcel mid-route and dumping its contents into the bay instead of making the drop.\nPersonal item: keys to a delivery scooter she had to sell two years ago to cover clinic supplies (no mechanical benefit).\nLanguages: Common Trade, Packsign."
    },
    level: 1,
    attributeMethod: "array",
    attributes: { BOD: 12, AGI: 16, WIT: 14, TEC: 16, MYS: 8, PRE: 12 },
    arrayAssign: { BOD: 12, AGI: 16, WIT: 14, TEC: 16, MYS: 8, PRE: 12 },
    species: "chimera",
    lineage: "ryn",
    heightFt: 5.5,
    lineageFeatures: ["Hare-Trigger Instinct"],
    speciesLanguage: "Packsign",
    background: "courier",
    backgroundSkillChoice: "athletics",
    backgroundProfChoices: ["Fieldcraft Tools", "Ground Vehicles"],
    class: "stitcher",
    subclass: "the_lifeline",
    classSkillChoices: ["perception"],
    classGearChoices: { weapons: [], armor: [], tools: ["Investigation Tools"], vehicles: [] },
    startingKit: {
      claimed: true,
      picks: { weapon: 0, armor: 0, carry: 0 },
      alt: false,
      granted: [
        { key: "qs_co_ear", qty: 1 }, { key: "qs_co_light", qty: 1 }, { key: "Data Drive", qty: 1 },
        { key: "Basic Rations", qty: 2 }, { key: "Water Purification Tabs", qty: 1 }, { key: "Glimmer Stick", qty: 1 },
        { key: "qs_co_medkit", qty: 1 }, { key: "qs_co_taser", qty: 1 }, { key: "Taser Cartridges", qty: 1 },
        { key: "qs_co_armor", qty: 1 }, { key: "qs_co_holster", qty: 1 }, { key: "qs_co_band", qty: 1 },
        { key: "Trauma Slap Patch", qty: 1 },
        { key: "qs_co_rig", qty: 1, classItem: "startingRigGranted" }
      ],
      glimmerGranted: 65,
      claimedClass: "stitcher",
      claimedSubclass: "the_lifeline",
      claimedBudget: 800
    },
    gambits: ["Trauma Patch", "Adrenaline Spike", "Failsafe", "Sedative"],
    startingRigGranted: true,
    rig: { key: "qs_co_rig", scrap: false, hp: {} },
    equipment: [
      { id: "qs_co_ear", name: "Whisperlink Earpiece", qty: 1 },
      { id: "qs_co_light", name: "Flashlight", qty: 1 },
      { name: "Data Drive", qty: 1 },
      { name: "Basic Rations", qty: 2 },
      { name: "Water Purification Tabs", qty: 1 },
      { name: "Glimmer Stick", qty: 1 },
      { id: "qs_co_medkit", name: "Basic Medkit", qty: 1 },
      { id: "qs_co_taser", name: "Taser", qty: 1 },
      { name: "Taser Cartridges", qty: 1 },
      { id: "qs_co_armor", name: "Hypeplate", qty: 1 },
      { id: "qs_co_holster", name: "Swift Draw Holster", qty: 1 },
      { id: "qs_co_band", name: "Bio Monitor Band", qty: 1 },
      { name: "Trauma Slap Patch", qty: 1 },
      { id: "qs_co_rig", name: "Field Kit [0]", qty: 1 }
    ],
    equippedWeapons: ["qs_co_taser"],
    equippedArmor: "qs_co_armor",
    carry: {
      qs_co_ear: "worn", qs_co_light: "carried", "Data Drive": "carried", "Basic Rations": "carried",
      "Water Purification Tabs": "carried", "Glimmer Stick": "carried", qs_co_medkit: "carried",
      qs_co_taser: "racked", "Taser Cartridges": "carried", qs_co_armor: "carried", qs_co_holster: "worn",
      qs_co_band: "worn", "Trauma Slap Patch": "carried", qs_co_rig: "carried"
    },
    racked: { qs_co_taser: "qs_co_holster" },
    loadout: "standard",
    glimmer: 65,
    ledger: [{ t: 1795824000000, m: "Starting kit claimed: the leftover goes on your Glimmer Stick", g: 65, n: 0, gb: 65, nb: 0 }],
    face: {
      contacts: [
        { id: "ct_qs_co_clerk", name: "Docks clerk", print: "", handle: "", kind: "professional", work: "Clerk on the docks",
          why: "Stamps manifests without asking questions.", offers: "", fence: "", origin: "background",
          disposition: "neutral", state: "open", faction: "", tell: "", notes: "" },
        { id: "ct_qs_co_rival", name: "Rival courier", print: "", handle: "", kind: "professional", work: "Courier",
          why: "Trades route tips with her over cheap noodles.", offers: "", fence: "", origin: "background",
          disposition: "friendly", state: "open", faction: "", tell: "", notes: "" }
      ]
    }
  }
},
{
  key: "qs-tinsel",
  name: "Thaddeus \"Tinsel\" Insel",
  label: "Hustler",
  blurb: "A Grinling con artist who fleeced an energy conglomerate from the 61st floor and bailed out under a literal golden parachute.",
  patch: {
    firstName: "Thaddeus",
    lastName: "Insel",
    identity: {
      concept: "A Grinling con artist who fleeced an energy conglomerate from the 61st floor and bailed out under a literal golden parachute.",
      handle: "Tinsel",
      handleStory: "A senior broker watched the new Grinling unload a worthless portfolio in ten minutes and swore he could pass off tinsel as fine sterling. He liked the sound of it and had it printed on his nameplate that afternoon.",
      whereFrom: "Tinsel slipped into Elyndra through a planar breach and landed a job in a Southlight boiler-room call center, cold-pitching junk energy futures to mid-level executives. His peculiar salesmanship carried him from the basement phone pit to a 61st-floor corner office in eighteen months. For three years he lived like corporate royalty on Southlight's tab, ordering custom silk suits and selling rival directors prime shares in orbital solar arrays that didn't exist.\n\nWhen Fullwell's auditors finally noticed the missing millions, the board sent an armed security team up the express elevator. Tinsel was already packed. Weeks earlier he had wired a severance fortune into off-grid bearer accounts, tucked the executive committee's kickback ledgers into his briefcase, and expensed a gold-silk BASE rig to the wellness budget. As security breached his office doors, he stepped off the terrace under a literal golden parachute, cackling all the way down into evening traffic while Southlight's stock went into freefall.\n\nNow he takes street contracts for the thrill of the game. His slush fund is safe from his old bosses, who are too compromised to touch it, but he can't touch it either: every Glimmer is tied up in the Doorbash app and Doorbash's lawyers. Tonight he has a good suit and whatever is in his pocket.",
      facets: "Holds a smile a beat too long. Uses whichever version of your first name you like least, adding an unsolicited \"-ie,\" \"-o\" or \"-ski\" as if you've known each other for years.",
      coreSparks: "A loophole left in the fine print is an invitation to get fleeced. Never let a company write you off as a loss.",
      tethers: "Dasha, the 61st-floor executive assistant who warned him ten minutes before the auditors locked the elevators. A lower-wards tailor who keeps his suits intact after bad jobs.",
      faultLines: "Gets restless and starts improvising when a plan goes too smoothly. Can't resist pushing his luck when a rich mark thinks they're untouchable.",
      appearance: "Four feet of Grinling in a tailored silk suit, wearing executive posture like he owns the building.",
      notes: "Pronouns: he/him.\nCrew role: handle the talking, steal a voice, pull allies out of trouble. Stays off the front line (7 Vitality).\nBackstory hook: Tinsel's unredacted kickback ledgers keep the Southlight board away from his off-grid accounts, but one ambitious VP has hired Freelancers to find where he hid the physical files.\nPersonal item: a solid-gold fountain pen lifted from the CEO's desk on his way out, and an embossed card case of eleven business cards reading T. INSEL, Senior VP of Special Acquisitions (no mechanical benefit).\nLanguages: Common Trade, Grinling home tongue."
    },
    level: 1,
    attributeMethod: "array",
    attributes: { BOD: 12, AGI: 14, WIT: 16, TEC: 8, MYS: 12, PRE: 16 },
    arrayAssign: { BOD: 12, AGI: 14, WIT: 16, TEC: 8, MYS: 12, PRE: 16 },
    species: "outsiders",
    lineage: "grinling",
    heightFt: 4,
    lineageFeatures: ["Disjointed Anatomy"],
    speciesLanguage: "Grinling home tongue",
    background: "boardroom-exile",
    backgroundSkillChoice: "deception",
    backgroundProfChoices: ["Systems Tools", "Ground Vehicles"],
    class: "hustler",
    subclass: "the_grifter",
    classSkillChoices: ["sleight"],
    classGearChoices: { weapons: [], armor: [], tools: ["Security Tools"], vehicles: [] },
    skillFocuses: [
      { type: "skill", parent: "persuasion", aspect: "negotiation", granted: true }
    ],
    startingKit: {
      claimed: true,
      picks: { weapon: 1, carry: 1 },
      alt: false,
      granted: [
        { key: "qs_ti_ear", qty: 1 }, { key: "qs_ti_light", qty: 1 }, { key: "Data Drive", qty: 1 },
        { key: "Basic Rations", qty: 2 }, { key: "Water Purification Tabs", qty: 1 }, { key: "Glimmer Stick", qty: 1 },
        { key: "qs_ti_kit", qty: 1 }, { key: "qs_ti_armor", qty: 1 }, { key: "qs_ti_blades", qty: 1 },
        { key: "qs_ti_belt", qty: 1 }, { key: "Fake License Portfolio", qty: 1 }
      ],
      glimmerGranted: 200,
      claimedClass: "hustler",
      claimedSubclass: "the_grifter",
      claimedBudget: 800
    },
    gambits: ["The Shell Game", "Exit Strategy"],
    equipment: [
      { id: "qs_ti_ear", name: "Whisperlink Earpiece", qty: 1 },
      { id: "qs_ti_light", name: "Flashlight", qty: 1 },
      { name: "Data Drive", qty: 1 },
      { name: "Basic Rations", qty: 2 },
      { name: "Water Purification Tabs", qty: 1 },
      { name: "Glimmer Stick", qty: 1 },
      { id: "qs_ti_kit", name: "Disguise and Styling Kit", qty: 1 },
      { id: "qs_ti_armor", name: "Liner Mesh", qty: 1 },
      { id: "qs_ti_blades", name: "Snap-Blades", qty: 1 },
      { id: "qs_ti_belt", name: "Utility Belt", qty: 1 },
      { name: "Fake License Portfolio", qty: 1 }
    ],
    equippedWeapons: ["qs_ti_blades"],
    equippedArmor: "qs_ti_armor",
    carry: {
      qs_ti_ear: "carried", qs_ti_light: "racked", "Data Drive": "carried", "Basic Rations": "carried",
      "Water Purification Tabs": "carried", "Glimmer Stick": "carried", qs_ti_kit: "racked",
      qs_ti_armor: "carried", qs_ti_blades: "carried", qs_ti_belt: "worn", "Fake License Portfolio": "carried"
    },
    racked: { qs_ti_kit: "qs_ti_belt", qs_ti_light: "qs_ti_belt" },
    loadout: "standard",
    glimmer: 200,
    ledger: [{ t: 1795824000000, m: "Starting kit claimed: the leftover goes on your Glimmer Stick", g: 200, n: 0, gb: 200, nb: 0 }],
    face: {
      contacts: [
        { id: "ct_qs_ti_dasha", name: "Dasha", print: "", handle: "", kind: "professional", work: "Executive assistant who runs Southlight's 61st floor",
          why: "Warned him ten minutes before the auditors locked the elevators.", offers: "", fence: "", origin: "background",
          disposition: "friendly", state: "open", faction: "", tell: "", notes: "" },
        { id: "ct_qs_ti_broker", name: "Former boiler-room broker", print: "", handle: "", kind: "professional", work: "Cashes bearer bonds in the lower wards",
          why: "Worked the phone pit with Tinsel before the corner office.", offers: "", fence: "", origin: "background",
          disposition: "neutral", state: "open", faction: "", tell: "", notes: "" }
      ]
    }
  }
}
];
