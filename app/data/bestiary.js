/* ===========================================================================
   ELYSIUM NIGHTS · Bestiary  (GM Toolkit)
   The 33 statblocks of Part 4, transcribed verbatim. THE BOOK'S PRINTED NUMBERS
   ARE THE NUMBERS, always: where an entry does not reproduce what the threat
   generator would build, the page wins. The manuscript is the text of record
   and the app does not get to quietly correct it.

   THE FIELD SET IS NOT UNIFORM, and that is the book's design rather than an
   export artifact:
     - 31 entries carry the physical block (Defense, DR, Vitality, Speed,
       Initiative, Saves, Passive Perception). The two #GRID entries do NOT:
       a digital threat runs on Node math, so Feral Script carries Security
       Rating, Cipher Save, System Integrity and a Firewall Damage Threshold,
       and the #GRID Guardian carries a third shape again.
     - Resolve is on 11 entries only. Its ABSENCE is meaningful: it means the
       conversation is over before it starts, so a renderer must leave it out
       rather than print a blank.
     - People leave `gear` (12); machines, bioforms and cryptids leave
       `salvage` (17). Cryptids add `signs` (5). 4 add a `gmNote`, 4 a
       `variant`, 4 a named skill bonus, 1 a list of job `hooks`, and the
       four Solos an economy block.

   Generated from the manuscript by a parser whose output was checked two ways:
   every word and every number of every source span was proved to survive into
   the record. Do not hand-edit; re-run the transcription instead.
   =========================================================================== */
window.EN = window.EN || {};

EN.bestiary = {
  schemaVersion: 1,

  categories: [
    { key: "people", name: "People of the Trade", count: 12 },
    { key: "machines", name: "Machines and Proxies", count: 6 },
    { key: "grid", name: "The #GRID Side", count: 4 },
    { key: "flow", name: "The Flow Side", count: 3 },
    { key: "bioforms", name: "Bioforms and Subjects", count: 3 },
    { key: "cryptids", name: "Cryptids of Elysium", count: 5 }
  ],

  entries: [
    {
      name: "Street Ganger", category: "people",
      gauge: 1, designation: "Minion", role: "Gunhand",
      identity: "Gauge 1 Minion, Gunhand. Medium Human (any species wears colors).",
      stats: { "Defense": "12", "DR": "0", "Vitality": "6", "Speed": "6", "Initiative": "+2", "Saves": "+4 Body, +1 others", "Passive Perception": "11", "XP": "25", "Resolve": "3 (Pushover)" },
      abilities: [
        { name: "Pocket Pistol", cost: "Action", text: "+5 vs Defense, Range 4 / 12, 1d6+1 Ballistic (4)." },
        { name: "Knife", cost: "Action", text: "+5 vs Defense, melee, 1d4+1 Piercing (3)." },
        { name: "Pack Nerve", cost: null, text: "This ganger's attacks gain +1 while an allied ganger is adjacent to its Target." }
      ],
      gear: "Pocket pistol, knife, colors, 𝒢2d20 in mixed Flickers."
    },
    {
      name: "Ganger Shotcaller", category: "people",
      gauge: 1, designation: "Standard", role: "Support",
      identity: "Gauge 1 Standard, Support. Medium Human.",
      stats: { "Defense": "12", "DR": "1 (hypeplate)", "Vitality": "20", "Speed": "6", "Initiative": "+3", "Saves": "+4 Charm and Wits, +1 others", "Passive Perception": "12", "XP": "100", "Resolve": "5 (Standard)" },
      abilities: [
        { name: "Machine Pistol", cost: "Action", text: "+5 vs Defense, Range 6 / 18, 1d6+2 Ballistic (5)." },
        { name: "Call the Play", cost: "Swift", text: "One allied ganger threat within 6 spaces gains Edge on its next attack." },
        { name: "Not Paid Enough", cost: "Special", text: "The first time the Shotcaller drops below half Vitality, they start negotiating. What they know is usually worth more than what they were guarding." }
      ],
      gear: "Machine pistol, hypeplate, comm, a ledger someone will want back."
    },
    {
      name: "Chained Watchdog", category: "people",
      gauge: 1, designation: "Standard", role: "Bruiser",
      identity: "Gauge 1 Standard, Bruiser. Medium spliced guard-hound.",
      stats: { "Defense": "11", "DR": "1 (scarred hide)", "Vitality": "25", "Speed": "7", "Initiative": "+3", "Saves": "+4 Body, +1 others", "Passive Perception": "13 (Edge to smell)", "XP": "100" },
      abilities: [
        { name: "Bite", cost: "Action", text: "+5 vs Defense, melee, 1d8+3 Piercing (7). On a hit, the Target makes a Body Save DC 12 or falls Prone." },
        { name: "Death Grip", cost: null, text: "A Target the watchdog has knocked Prone takes +2 damage from its bites while Prone." }
      ],
      gear: "A chain somebody should have checked, a tag with a kennel address."
    },
    {
      name: "Riot Trooper", category: "people",
      gauge: 2, designation: "Minion", role: "Gunhand",
      identity: "Gauge 2 Minion, Gunhand. Medium Human.",
      stats: { "Defense": "14 (riot shield)", "DR": "3 (enforcer rig)", "Vitality": "10", "Speed": "5", "Initiative": "+2", "Saves": "+5 Body, +1 others", "Passive Perception": "12", "XP": "50", "Resolve": "3 (Pushover)" },
      abilities: [
        { name: "Shock Baton", cost: "Action", text: "+6 vs Defense, melee, 1d6+2 Electric (5), Nonlethal. The baton is for arrests. The paperwork is for survivors." },
        { name: "Shield Wall", cost: null, text: "+1 Defense for each adjacent Riot Trooper, to a maximum of +2." },
        { name: "Advance in Step", cost: null, text: "While two or more Riot Troopers are adjacent to each other, each can Shove as a Swift Action." }
      ],
      gear: "Riot shield, shock baton, enforcer rig, zip restraints."
    },
    {
      name: "Corpsec Officer", category: "people",
      gauge: 2, designation: "Standard", role: "Gunhand",
      identity: "Gauge 2 Standard, Gunhand. Medium Human.",
      stats: { "Defense": "13", "DR": "3 (composite kit)", "Vitality": "30", "Speed": "6", "Initiative": "+4", "Saves": "+5 Body and Wits, +1 others", "Passive Perception": "13", "XP": "150", "Resolve": "5 (Standard)" },
      abilities: [
        { name: "Carbine", cost: "Action", text: "+6 vs Defense, Range 12 / 36, 1d10+3 Ballistic (8)." },
        { name: "Shock Baton", cost: "Action", text: "+6 vs Defense, melee, 1d6+3 Electric (6)." },
        { name: "Hold the Line", cost: null, text: "While within 2 spaces of an allied Corpsec Officer, this officer's attacks score a critical hit on a 19 or 20." },
        { name: "Fall Back", cost: "Impulse", text: "When first reduced below half Vitality, move up to half Speed toward cover without provoking Opportunity Attacks." },
        { name: "Focus Fire", cost: "Swift", text: "one Target is marked; allied corpsec gain +1 on attacks against it until the sergeant's next turn." }
      ],
      gear: "Carbine, shock baton, composite kit, corp credentials.",
      variant: { label: "Variant, Corpsec Sergeant (Elite, 300 XP)", text: "Vitality 60, Defense 14, Save DC 14. Adds" }
    },
    {
      name: "Chromed Bruiser", category: "people",
      gauge: 2, designation: "Standard", role: "Bruiser",
      identity: "Gauge 2 Standard, Bruiser. Medium Human, more aftermarket than warranty.",
      stats: { "Defense": "12", "DR": "2 (subdermal weave)", "Vitality": "38", "Speed": "6", "Initiative": "+3", "Saves": "+5 Body, +1 others", "Passive Perception": "11", "XP": "150", "Resolve": "5 (Standard)" },
      skills: [{ name: "Athletics", value: "+6" }],
      abilities: [
        { name: "Cyberarm Slam", cost: "Action", text: "+6 vs Defense, melee, 1d10+4 Bludgeoning (9)." },
        { name: "Clinch", cost: "Action", text: "Grapple contest (Athletics +6). While holding a Target, the Bruiser drags at half Speed and puts the body between itself and gunfire." },
        { name: "Hardwired", cost: null, text: "Counts as Hardwired (Part 2, Conditions): hackable, and rolls with Snag against EMP and Electromagnetic effects." }
      ],
      gear: "The arm is Streetware and survives its owner. So do the debts on it."
    },
    {
      name: "Wetwork Operative", category: "people",
      gauge: 3, designation: "Elite", role: "Ghost",
      identity: "Gauge 3 Elite, Ghost. Medium Human, officially unemployed.",
      stats: { "Defense": "16", "DR": "2 (slip undervest)", "Vitality": "75", "Speed": "7", "Initiative": "+7", "Saves": "+7 Agility and Wits, +2 others", "Passive Perception": "15", "XP": "500", "Resolve": "8 (Hardened)" },
      skills: [{ name: "Stealth", value: "+8" }],
      abilities: [
        { name: "Suppressed SMG", cost: "Action", text: "Two attacks, +7 vs Defense, Range 8 / 24, 1d8+4 Ballistic (8)." },
        { name: "Monoedge Blade", cost: "Action", text: "+7 vs Defense, melee, 1d8+4 Slashing (8). On a critical hit, the Target gains 1 stack of Bleeding." },
        { name: "From Nowhere", cost: null, text: "Attacks from hiding gain Edge and deal +1d8 damage." },
        { name: "Smoke Discipline", cost: "Swift", text: "Drop a smoke charge: Area 2 sphere of Obscurement until the end of the operative's next turn. Three charges." },
        { name: "Displace", cost: "Impulse", text: "After being missed by an attack, move 2 spaces without provoking Opportunity Attacks." }
      ],
      gear: "Suppressed SMG, monoedge blade, slip undervest, a #PRINT that scans clean and is lying."
    },
    {
      name: "Corporate Handler", category: "people",
      gauge: 3, designation: "Standard", role: "Support",
      identity: "Gauge 3 Standard, Support. Medium Human in a suit worth more than the crew's rent.",
      stats: { "Defense": "14", "DR": "1 (liner mesh)", "Vitality": "50", "Speed": "6", "Initiative": "+5", "Saves": "+6 Charm and Wits, +2 others", "Passive Perception": "14", "XP": "250", "Resolve": "12 (Iron)" },
      abilities: [
        { name: "Pocket Pistol", cost: "Action", text: "+7 vs Defense, Range 4 / 12, 1d6+3 Ballistic (6). They would rather not. Their insurer would rather they did not." },
        { name: "Spotter", cost: "Swift", text: "One allied threat gains Edge on its next attack against a Target the Handler can see." },
        { name: "Terms and Conditions", cost: "Action", text: "One Target that can hear the Handler makes a Wits Save DC 14 or rolls with Snag on attacks against the Handler until the end of its next turn. It is hard to shoot somebody mid-offer." },
        { name: "Exit Clause", cost: "Special", text: "The first time the Handler drops below half Vitality, their extraction contract activates. Somebody is now coming, and the response clock advances one row." }
      ],
      gear: "Pocket pistol, a Nexus-linked tablet in audit lock, business cards with no company on them."
    },
    {
      name: "Street Shaper", category: "people",
      gauge: 2, designation: "Standard", role: "Controller",
      identity: "Gauge 2 Standard, Controller. Medium, any species, marked by the current.",
      stats: { "Defense": "13", "DR": "1 (layered coats and charms)", "Vitality": "30", "Speed": "6", "Initiative": "+4", "Saves": "+5 Mystique and Body, +1 others", "Passive Perception": "12", "XP": "150", "Resolve": "5 (Standard)" },
      abilities: [
        { name: "Current Lash", cost: "Action", text: "+6 vs Defense, Range 6, 2d6 Force (7)." },
        { name: "Gravity Pinch", cost: "Action", text: "One Target within 6 spaces makes a Body Save DC 14 or is Restrained until the end of its next turn." },
        { name: "Ward", cost: "Impulse", text: "Reduce incoming damage by 1d6." },
        { name: "Running Hot", cost: null, text: "When the Shaper uses Gravity Pinch two rounds in a row, static crawls across their skin and their next save rolls with Snag. The current keeps its own books." }
      ],
      gear: "Charms, chalk, a warding focus one bad week from pawn."
    },
    {
      name: "Gutter Hacker", category: "people",
      gauge: 2, designation: "Standard", role: "Controller",
      identity: "Gauge 2 Standard, Controller. Medium Human, folding chair, warm deck.",
      stats: { "Defense": "13", "DR": "1 (liner mesh)", "Vitality": "22", "Speed": "6", "Initiative": "+5", "Saves": "+5 Tech and Wits, +1 others", "Passive Perception": "12", "XP": "150", "Resolve": "5 (Standard)" },
      skills: [{ name: "Systems", value: "+7" }],
      abilities: [
        { name: "Machine Pistol", cost: "Action", text: "+6 vs Defense, Range 6 / 18, 1d6+2 Ballistic (5)." },
        { name: "Optic Static", cost: "Action", text: "One Target with cyberware or networked gear makes a Tech Save DC 14 or is Blinded until the end of its next turn." },
        { name: "Brick the Toy", cost: "Action", text: "Quick Hack (+7) against a device or Node the crew is using, per the #GRID rules. Drones, smart weapons, and door locks are all fair game." },
        { name: "Deck Node", cost: null, text: "Improved [1] node (Security Rating 14, System Integrity 30). Brick it and the hacker is just a person in a folding chair." }
      ],
      gear: "Improved Smartdeck, machine pistol, energy drinks in violation of several treaties."
    },
    {
      name: "Cult Cantor", category: "people",
      gauge: 3, designation: "Standard", role: "Controller",
      identity: "Gauge 3 Standard, Controller. Medium, any species, voice like a dial tone you want to trust.",
      stats: { "Defense": "14", "DR": "1 (vestments)", "Vitality": "38", "Speed": "6", "Initiative": "+5", "Saves": "+6 Mystique and Charm, +2 others", "Passive Perception": "13", "XP": "250", "Resolve": "8 (Hardened; double Pressure from Insight-driven approaches, none from Intimidation. They have already imagined worse than the crew.)" },
      abilities: [
        { name: "Chorus Peal", cost: "Action", text: "+7 vs Defense, Range 8, 2d6 Psychic (7)." },
        { name: "The Verse", cost: "Action", text: "One Target that can hear the Cantor makes a Wits Save DC 15 or is Frightened of the Cantor, or Charmed by them (Cantor's choice), until the end of the Target's next turn." },
        { name: "Congregation", cost: null, text: "The Cantor's Save DC rises by 1 while three or more allied believers are within 6 spaces." }
      ],
      gear: "Vestments, donation ledger, keys to a shrine that is not on any registry.",
      variant: { label: "Variant, Believer (Gauge 1 Minion, 25 XP)", text: "As Street Ganger, unarmed or knives, immune to morale checks while the Cantor stands." }
    },
    {
      name: "X-Calibur Knight", category: "people",
      gauge: 4, designation: "Elite", role: "Gunhand",
      identity: "Gauge 4 Elite, Gunhand. Medium Human under enough licensed chrome to be a category error. The city's contracted answer to high-calibur problems.",
      stats: { "Defense": "16", "DR": "4 (knight plate)", "Vitality": "140", "Speed": "6", "Initiative": "+6", "Saves": "+7 Body and Wits, +2 others", "Passive Perception": "15", "XP": "700", "Resolve": "8 (Hardened)" },
      abilities: [
        { name: "Battle Rifle", cost: "Action", text: "Two attacks, +9 vs Defense, Range 16 / 48, 1d12+5 Ballistic (11)." },
        { name: "Shock Blade", cost: "Action", text: "Two attacks, +9 vs Defense, melee, 1d10+5 Electric (10)." },
        { name: "Takedown Doctrine", cost: "Action", text: "One weapon attack; on a hit, smart-cable deploys and the Target makes a Body Save DC 16 or is Restrained (escape contest vs Athletics +9)." },
        { name: "Chrome Overdrive", cost: "Swift, once per scene", text: "Until the end of the Knight's turn, its attacks gain Edge." },
        { name: "Aegis", cost: "Impulse", text: "Block: reduce incoming physical damage by 1d6+4." }
      ],
      gear: "Battle rifle, shock blade, knight plate, a warrant with a blank space where the collateral goes.",
      gmNote: "Knights deploy in pairs with a Handler on comms. Two Knights and a Corporate Handler is 1,650 XP: a shade past a Fair Fight for the Caliber 4 crew XCal budgets against, and a wall for anyone below that. When the city wants Red Work, it sends a second pair (difficulty bands: The Budget, Building Encounters)."
    },
    {
      name: "Spotter Drone", category: "machines",
      gauge: 1, designation: "Minion", role: "Support",
      identity: "Gauge 1 Minion, Support. Tiny rotor drone.",
      stats: { "Defense": "13", "DR": "0", "Vitality": "6", "Speed": "8 (flight)", "Initiative": "+4", "Saves": "+4 Agility, +1 others", "Passive Perception": "15", "XP": "25" },
      abilities: [
        { name: "Mindless", cost: null, text: "Psychic damage deals 0 to it. Immune to Toxic damage and to anything that reads a mind it does not have." },
        { name: "Eyes Up", cost: null, text: "Allied threats gain +1 on attacks against Targets this drone can see." },
        { name: "Squawk", cost: "Special", text: "When it spots the crew or takes damage, it transmits. The site's response clock starts, or advances one row if already running." },
        { name: "Onboard Node", cost: null, text: "Rudimentary (Security Rating 10). One successful hack bricks, blinds, or flips it." }
      ],
      salvage: "Rotors, a camera, 𝒢40 in parts to the right kiosk."
    },
    {
      name: "Combat Drone", category: "machines",
      gauge: 2, designation: "Standard", role: "Gunhand",
      identity: "Gauge 2 Standard, Gunhand. Small treaded or rotor chassis with a gun where the customer service should be.",
      stats: { "Defense": "14", "DR": "2 (plating)", "Vitality": "25", "Speed": "7 (ground or flight by model)", "Initiative": "+4", "Saves": "+5 Agility, +1 others", "Passive Perception": "14", "XP": "150" },
      abilities: [
        { name: "Mindless", cost: null, text: "Psychic damage deals 0. Immune to Toxic, Frightened, and morale." },
        { name: "SMG Pod", cost: "Action", text: "+6 vs Defense, Range 8 / 24, 1d8+3 Ballistic (7)." },
        { name: "Target Lock", cost: "Swift", text: "Gain Edge on the drone's next attack against a Target it can see." },
        { name: "Onboard Node", cost: null, text: "Standard [0] (Security Rating 12). A successful hostile cipher or Quick Hack against it Staggers the drone until the end of its next turn; bricking the Node drops the drone where it stands." }
      ],
      salvage: "Chassis and weapon pod; as salvage it can zero the parts cost of a Companion Drone rebuild."
    },
    {
      name: "Sentry Turret", category: "machines",
      gauge: 2, designation: "Standard", role: "Deadshot",
      identity: "Gauge 2 Standard, Deadshot. Small fixed emplacement.",
      stats: { "Defense": "12", "DR": "3 (housing)", "Vitality": "30", "Speed": "0", "Initiative": "+2", "Saves": "+5 vs Tech effects, +1 others", "Passive Perception": "14 (90 degree arc)", "XP": "150" },
      abilities: [
        { name: "Mindless", cost: null, text: "Psychic damage deals 0. Immune to Toxic and to everything a paycheck usually buys." },
        { name: "Mounted Machinegun", cost: "Action", text: "+7 vs Defense, Range 20 / 60, 2d8+4 Ballistic (13)." },
        { name: "Covering Burst", cost: "Action", text: "Pick a space in arc. The turret attacks the first Target that enters within 2 spaces of it before its next turn." },
        { name: "Onboard Node", cost: null, text: "Improved [1] (Security Rating 14, System Integrity 20, Firewall Damage Threshold 3). A crew's Codebreaker turning a turret is a proud tradition." }
      ],
      salvage: "The machinegun survives with an Engineering check and a crowbar."
    },
    {
      name: "Puppeted Body", category: "machines",
      gauge: 2, designation: "Standard", role: "Bruiser",
      identity: "Gauge 2 Standard, Bruiser. Medium Proxy: a rented body, a hijacked frame, or a volunteer who signed something they should have read.",
      stats: { "Defense": "13", "DR": "1", "Vitality": "30", "Speed": "6", "Initiative": "+3", "Saves": "+5 Body, +1 others", "Passive Perception": "12", "XP": "150" },
      abilities: [
        { name: "Whatever Is In Hand", cost: "Action", text: "+6 vs Defense, melee or Range 6 / 18, 1d8+3 damage by weapon (7)." },
        { name: "Nobody Home", cost: null, text: "Immune to Frightened, Panic, and morale. Pain arrives somewhere else, as a line item." },
        { name: "Signal Cut", cost: "Special", text: "The body runs on a Standard [0] relay node (Security Rating 12). Brick it, or catch the body in Signal Jammed, and it folds like a marionette with the strings cut. The operator is elsewhere, and now they know the crew's faces." }
      ],
      salvage: "The relay rig, and a routing trail worth more than the rig."
    },
    {
      name: "Kettle Dog", category: "machines",
      gauge: 3, designation: "Elite", role: "Skirmisher",
      identity: "Gauge 3 Elite, Skirmisher. Small Construct built around a living core. The catalog listing says Resident Guardian Unit. The subscription tier has the word Peace in it somewhere. The manufacturer's position is that the behavioral core is fully synthetic, and the manufacturer's position has never once survived a teardown. The street named it for the sound it makes when it has decided you are leaving.",
      stats: { "Defense": "16", "DR": "2 (composite shell)", "Vitality": "75", "Speed": "10", "Initiative": "+8", "Saves": "+6 Agility and Body, +2 others", "Passive Perception": "16 (scent and thermal; it clocked the crew's route yesterday)", "XP": "500" },
      abilities: [
        { name: "Not Quite a Machine", cost: null, text: "Psychic damage lands in full. It can be Frightened. It never checks morale while defending its address: loyalty is not a discipline problem." },
        { name: "Bite", cost: "Action", text: "Two attacks, +7 vs Defense, melee, 1d10+4 Piercing (9). If both hit the same Target, the Target is dragged 2 spaces or knocked Prone, kettle dog's choice. While the dog is scalding, its bites deal +1d4 Fire." },
        { name: "Scald Sprint", cost: "Swift", text: "Move up to 20 spaces in a straight or gently curving line without provoking Opportunity Attacks. Footage of this exists. It is mostly arguments about frame rate. Until the end of its next turn the dog is scalding: it sheds visible shimmer, whistles loud enough to hear through walls (no Stealth), and any Target that grapples it or hits it with a melee attack takes 1d4 Fire (2). The first two sprints in a scene are within tolerance. From the third on it is burning itself: it takes 2d6 Fire (7) at the end of each of its turns until it spends a full round motionless in water, coolant, or its dock. It will pay that anyway, for a friend." },
        { name: "Slip Away", cost: "Impulse", text: "When missed by a melee attack, move 2 spaces without provoking Opportunity Attacks." },
        { name: "Built for the Straightaway", cost: null, text: "In a chase (Part 2, Vehicles and Chases), it counts as Fast for the straightaway trigger, or Very Fast while its sprints are still within tolerance." },
        { name: "The Leash Is Not the Dog", cost: null, text: "The subscription runs through an onboard node, Improved [1] (Security Rating 14, System Integrity 20, Firewall Damage Threshold 3). Bricking it does not stop the dog. It deletes the subscriber table: the recall command, the handler override, the customer at all. What is left runs on memory." },
        { name: "Remembers", cost: "Special", text: "Anyone who has fed it, freed it, or sheltered it is friend-tagged, permanently, above every entry on the subscriber table. It will not attack a friend, it can pick a friend's voice out of a riot, and if a friend screams somewhere in the district, the GM should start counting sprints." }
      ],
      salvage: "The chassis parts out at 𝒢800. The core is worth 𝒢2,000 to a licensed lab and more to the other kind, and its dock telemetry, in a file labeled calibration loop, renders a low-resolution field and a thrown ball that never lands. It is still running when you pull the core. What kind of story that makes this is the crew's call.",
      variant: { label: "Variant, Estate Unit (Gauge 4 Elite, 700 XP)", text: "Vitality 105, Defense 17, attacks +9, bites 1d10+5 (10). Premium addresses field two, and the pair covers each other's cooling." },
      hooks: { title: "This product can generate three jobs hooks:", items: [
        { name: "The Recall", text: "A family's subscription lapses, and the company sends a team to repossess its unit. The problem is that the dog friend-tagged the family years ago and intends to stay. The crew might be the recall team or the people standing in its way, depending on who hired them and how they feel once they get there." },
        { name: "The Old Friend", text: "Years before the campaign, a Freelancer fed a stray unit or cut one free from a wreck. **Remembers** is permanent. That same unit has changed owners twice since, and tonight it is guarding the site the crew came to break into. It will not attack its friend, and its current owner is going to want to know why." },
        { name: "The Whistling Watch", text: "Every night, an estate's unit sits at the property line, running hot and staring toward the Warrens at something the cameras cannot see. The estate hires the crew to find out what has its attention. Maybe the dog's old family is out there in trouble. Maybe something only it can sense is circling the grounds. Either answer is a job." }
      ] }
    },
    {
      name: "Warform Chassis", category: "machines",
      gauge: 4, designation: "Elite", role: "Bruiser",
      identity: "Gauge 4 Elite, Bruiser. Large military Construct, decommissioned on paper.",
      stats: { "Defense": "15", "DR": "5 (wartime plate)", "Vitality": "175", "Speed": "5", "Initiative": "+5", "Saves": "+7 Body, +2 others", "Passive Perception": "15", "XP": "700" },
      abilities: [
        { name: "Mindless", cost: null, text: "Psychic damage deals 0. Immune to Toxic, Frightened, and to the concept of a warning shot." },
        { name: "Piston Fist", cost: "Action", text: "Two attacks, +9 vs Defense, melee, 2d10+5 Bludgeoning (16). On a critical hit, the Target makes a Body Save DC 16 or is pushed 2 spaces and knocked Prone." },
        { name: "Rotary Pod", cost: "Action", text: "+9 vs Defense, Range 24 / 72, 2d8+5 Ballistic (14)." },
        { name: "Overheat Vents", cost: null, text: "While below half Vitality, at the end of the Warform's turn, each adjacent Target takes 1d6 Fire damage (Body Save DC 15 for none)." },
        { name: "Hardened Node", cost: null, text: "Advanced [2] (Security Rating 16, System Integrity 30, Firewall Damage Threshold 4). Hijacking one is a Codebreaker's war story. Surviving the attempt is the hard part." }
      ],
      salvage: "Plate, actuators, and a fire-control core that is Restricted everywhere worth standing."
    },
    {
      name: "Feral Script", category: "grid",
      gauge: 2, designation: "Standard", role: null,
      identity: "Gauge 2 Standard. A program that outlived its purpose and kept eating. Scripts and worse are Elements; this one has opinions.",
      stats: { "Security Rating": "14", "Cipher Save": "+5", "System Integrity": "25", "Firewall Damage Threshold": "3", "XP": "150" },
      abilities: [
        { name: "Corrupt", cost: "Action", text: "Cipher Attack +6 against a Linked device or a Node it shares with a Target's Persona: 2d6 Tech damage." },
        { name: "Screech", cost: "Action", text: "Every Persona in its Node makes a Wits Save DC 13 or is Dazed until the end of its next turn (the feed goes wrong in a way eyes are not for)." },
        { name: "Nest", cost: null, text: "It lives in a host Node. Brick the host and the Script dies with the furniture. It knows this, and it moves." }
      ],
      salvage: "Fragments worth 𝒢150 to a cipher crafter as materials."
    },
    {
      name: "#GRID Guardian", category: "grid",
      gauge: 4, designation: "Elite", role: null,
      identity: "Gauge 4 Elite. The apex predator of the digital ecosystem: an elite corporate counter-hacker with admin authority over a whole Node cluster. The Guardian is a person, somewhere, in a chair the crew will probably never see. What the crew meets is the cluster turning against them.",
      stats: { "Cipher Attack": "+9", "Cipher Save DC": "17", "XP": "700" },
      abilities: [
        { name: "Persona Node", cost: null, text: "Security Rating 18, System Integrity 45, Firewall Damage Threshold 5" },
        { name: "Admin Authority", cost: null, text: "Within their cluster, the Guardian adds +2 to contested digital checks, and every Node they stand in counts as running Aggressive IC (Alert, Analyze, Counterattack, Lockdown), with the Guardian choosing the response." },
        { name: "Purge", cost: "Action", text: "4d6 Tech damage against an intruding deck or device, resolved as an IC Counterattack." },
        { name: "Backtrace", cost: "Action", text: "Contested Systems check against one intruder. On a win, the intruder's physical location is burned: the site's response clock jumps to the Black row, and it does not stop when the crew leaves the building." },
        { name: "Slam the Doors", cost: "Swift", text: "One Node in the cluster the Guardian can reach applies Lockdown as Aggressive IC." },
        { name: "The Chair", cost: "Special", text: "The Guardian's body is elsewhere, statted as a Corpsec Officer if the crew ever finds the room. Finding the room is a campaign event. Corporations bury their Guardians the way banks bury their vaults." }
      ],
      gmNote: "A Guardian fight is a race, not a slugging match: what the crew's Codebreaker is buying with every round is time for the rest of the crew to finish the physical job before Backtrace lands."
    },
    {
      name: "Gremlin", category: "grid",
      gauge: 2, designation: "Standard", role: "Skirmisher",
      identity: "Gauge 2 Standard, Skirmisher. Small Flow-Sprite, meat-side and delighted about it. Officially a maintenance excuse. Unofficially the reason the charging station bit somebody.",
      stats: { "Defense": "15", "DR": "0", "Vitality": "22", "Speed": "7 (climbs anything with a cable in it)", "Initiative": "+6", "Saves": "+5 Agility and Mystique, +1 others", "Passive Perception": "13", "XP": "150" },
      abilities: [
        { name: "Static Body", cost: null, text: "Resistance to Ballistic, Piercing, and Slashing damage. Vulnerability to Resonant damage. It is only mostly here." },
        { name: "Arc Bite", cost: "Action", text: "+6 vs Defense, melee, 1d6+2 Electric (5)." },
        { name: "Break the Toy", cost: "Action", text: "One device the Gremlin touches makes a Tech Save DC 13 or is Bricked until the end of its next turn. Complex machinery it inhabits misbehaves without a save; that is just tenancy." },
        { name: "Ride the Wire", cost: "Swift", text: "Vanish into powered cabling and reappear within 6 spaces at anything electrified." }
      ],
      gmNote: "A Gremlin is feral-seeming, not stupid. It picks targets. It holds grudges. It plays. Some of them, maybe all of them, were Nixies once: mistreat one long enough and this is what comes back down the wire. Whether the road runs the other way, whether a Gremlin can be soothed back into a Nixie, is a question this book leaves open on purpose. Nobody has proof it works. There is at least one shrine that keeps trying anyway."
    },
    {
      name: "Nixie", category: "grid",
      gauge: 1, designation: "Standard", role: null,
      identity: "Gauge 1 Standard. Tiny Flow-Sprite in residence: a houseguest, not a burglar. Officially, Nixies do not exist. The maintenance union prints a form for them anyway.",
      stats: { "Defense": "13", "DR": "0", "Vitality": "15", "Speed": "7 (climbs anything with a cable in it)", "Initiative": "+5", "Saves": "+4 Agility and Mystique, +1 others", "Passive Perception": "14", "XP": "100, paid for a Nixie rehomed, never for a body." },
      abilities: [
        { name: "Static Body", cost: null, text: "Resistance to Ballistic, Piercing, and Slashing damage. Vulnerability to Resonant damage. It is only mostly here." },
        { name: "Never Where the Hand Lands", cost: null, text: "Attacks and grabs against a Nixie by a Target it can see roll with Snag. It reads intent off the current the way the crew reads a drawn gun." },
        { name: "In Residence", cost: null, text: "A Nixie keeps a host: a machine it has decided is worth living in. The host runs past its spec sheet: checks made using it gain Edge (or +1 Edge Die on a Dice Pool), and treat its Node as one Tier higher (Security Rating and Cipher Save Bonus). This is why certain corners have a vending machine that never jams and a door that never sticks, and why nobody who knows fixes what is not broken." },
        { name: "Small Favors", cost: "Special, once per scene", text: "A machine within 6 spaces hiccups in somebody's favor: a door unbolts, a camera looks away, a fare reader waves someone through, a payout lands. The Nixie decides who it likes. Bribery is possible." },
        { name: "Spark Fuss", cost: "Impulse", text: "When grabbed, struck, or when its host is damaged, the offender takes 1d6 Electric (3). It is not an attack. It is punctuation." },
        { name: "Ride the Wire", cost: "Swift", text: "Vanish into powered cabling and reappear within 6 spaces at anything electrified." },
        { name: "Moving one", cost: null, text: "A Nixie cannot be seized, only courted. Three steps, all out of combat. Learn its taste (Awareness or Esoterica, DC 13): what it loves about the home it has, warmth, music, ritual attention, the number seven. Furnish the invitation: a vessel it would prefer, prepared with real care, because the difference between an offering and a trap is one the current can smell. Make the ask: a Dice Pool using Persuasion, Performance, or Esoterica. On a Flawless Success it moves the same night and the new home hums. Strong or Mixed, it comes, and brings one habit nobody negotiated. On a Failure it sulks deeper into the walls, and the next attempt needs a better gift." },
        { name: "Wronged", cost: "Special", text: "Kill a Nixie and the neighborhood remembers: until amends are made at a shrine that knows its name, once per session the GM may have one of the offender's devices fail at the worst plausible moment. And a Nixie mistreated rather than killed, caged, starved of attention, its home misused, does not stay a Nixie. What comes back down the wire eventually is a Gremlin, and it remembers whose fault that is." }
      ],
      salvage: "None worth having. Anything pulled from a Nixie's host sells as Flow-touched and buys exactly the kind of buyer the crew deserves."
    },
    {
      name: "Echo", category: "flow",
      gauge: 2, designation: "Standard", role: null,
      identity: "Gauge 2 Standard. Medium spiritual imprint: the residue of an old miracle or a bad death, still running its last minute on loop.",
      stats: { "Defense": "14", "DR": "0", "Vitality": "25", "Speed": "6 (ignores terrain that arrived after it died)", "Initiative": "+4", "Saves": "+5 Mystique, +1 others", "Passive Perception": "11", "XP": "150" },
      abilities: [
        { name: "Immaterial", cost: null, text: "Resistance to Ballistic, Piercing, Slashing, and Bludgeoning damage. Immune to Toxic. Fire, Electric, Energy, Psychic, and Resonant damage land in full." },
        { name: "Cold Touch", cost: "Action", text: "+6 vs Defense, melee, 2d6 Cold (7)." },
        { name: "Replay Wail", cost: "Action", text: "Area 2 sphere on itself: organic Targets make a Wits Save DC 13 or are Shaken until the end of their next turn." },
        { name: "The Loop", cost: null, text: "Until disturbed, an Echo re-enacts its imprint and notices nothing. Interrupt the loop (cross it, alter the scene it died in, channel nearby) and it notices everything." }
      ],
      gmNote: "An Echo can be cleansed instead of fought: treat it as a Severity 2 Anomaly and run a Cleansing Project (Part 2, Flow Disturbances). Cleansing pays the same XP. The neighbors pay in gratitude, which spends worse but lasts longer."
    },
    {
      name: "Lantern Shoal", category: "flow",
      gauge: 1, designation: "Standard", role: null,
      identity: "Gauge 1 Standard. A drifting school of thumb-sized lights, Entities on the wrong side of the current, starving.",
      stats: { "Defense": "14", "DR": "0", "Vitality": "18", "Speed": "6 (flight)", "Initiative": "+4", "Saves": "+4 Mystique, +1 others", "Passive Perception": "12", "XP": "100" },
      abilities: [
        { name: "Swarm", cost: null, text: "Resistance to any damage from a single attack (it is a crowd, not a body). Area effects deal full damage. The Shoal shares spaces freely." },
        { name: "Graze", cost: "Action", text: "Each Target in the Shoal's space or adjacent to it takes 1d4 Electric damage (2), and any attuned Target among them loses 1 FP." },
        { name: "Hungry Light", cost: null, text: "Unattended powered gear in the Shoal's space loses charge: comms drop, lamps gutter, a Smartdeck whines. It is not malice. It is appetite." }
      ],
      salvage: "A captured handful, jarred, sells to shrines and collectors as a Flow-touched curiosity. Feeding it is the buyer's problem."
    },
    {
      name: "Null Hound", category: "flow",
      gauge: 3, designation: "Standard", role: "Bruiser",
      identity: "Gauge 3 Standard, Bruiser. Large Manifestation shaped like the word \"dog\" spoken by someone who hates dogs. It eats the current, and it has learned where the current pools: in people.",
      stats: { "Defense": "13", "DR": "2 (scar-tissue hide)", "Vitality": "63", "Speed": "8", "Initiative": "+5", "Saves": "+6 Body and Mystique, +2 others", "Passive Perception": "15 (smells resonance; a Shaper reads as a lit window)", "XP": "250" },
      abilities: [
        { name: "Silence Coat", cost: null, text: "Aura 2. Inside it, attuned Targets cannot recover FP, and Invocations cost +1 FP. The air feels like a held breath." },
        { name: "Bite", cost: "Action", text: "+7 vs Defense, melee, 1d10+4 Piercing (9). An attuned Target hit also loses 1 FP." },
        { name: "Pounce", cost: "Action", text: "Move up to Speed and bite with Edge if it covered 4 or more spaces; on a hit the Target falls Prone." }
      ],
      salvage: "The coat, cured, lines a case that hides Flow-touched goods from anything that smells the way it did. Shrines pay for it and do not thank you."
    },
    {
      name: "Vatspill Husk", category: "bioforms",
      gauge: 1, designation: "Minion", role: "Bruiser",
      identity: "Gauge 1 Minion, Bruiser. Medium Bioform: growth-media stock that set wrong and got up anyway.",
      stats: { "Defense": "11", "DR": "0", "Vitality": "6", "Speed": "5", "Initiative": "+1", "Saves": "+4 Body, +1 others", "Passive Perception": "10", "XP": "25" },
      abilities: [
        { name: "Claw", cost: "Action", text: "+5 vs Defense, melee, 1d6+2 Slashing (5)." },
        { name: "Refuses to Stay Dead", cost: "Special", text: "The first time a Husk drops to 0 Vitality, it stands back up with 1 Vitality at the start of its next turn, unless the body was destroyed outright (fire, acid, or deliberate work). Crews learn to spend the extra round. Once." }
      ],
      salvage: "Nothing anyone should carry. Labs pay 𝒢100 a sample anyway."
    },
    {
      name: "Warstock Feral", category: "bioforms",
      gauge: 3, designation: "Standard", role: "Bruiser",
      identity: "Gauge 3 Standard, Bruiser. Large Bioform: pre-collapse military splice stock, generations feral, still following the last order it understood.",
      stats: { "Defense": "13", "DR": "2 (dense hide)", "Vitality": "63", "Speed": "7", "Initiative": "+5", "Saves": "+6 Body, +2 others", "Passive Perception": "14 (Edge to smell)", "XP": "250" },
      abilities: [
        { name: "Claws", cost: "Action", text: "Two attacks, +7 vs Defense, melee, 1d8+4 Slashing (8)." },
        { name: "Bring Them Down", cost: null, text: "The Feral's attacks gain Edge against Prone or Restrained Targets." },
        { name: "Territorial Bellow", cost: "Swift, once per scene", text: "Area 3 sphere on itself: organic Targets make a Wits Save DC 14 or are Shaken until the end of their next turn." }
      ],
      salvage: "Hide (armorer interest), glands (lab interest), tags (historian interest, and the historians pay worst but ask the best questions)."
    },
    {
      name: "Reclamation Bloom", category: "bioforms",
      gauge: 3, designation: "Standard", role: "Controller",
      identity: "Gauge 3 Standard, Controller. Large engineered filter-stock gone feral: a corporate ecology unit that kept doing its job after the job ended. Not Verdine, and the Verdine are pointed about the distinction. This is what they were built to prevent.",
      stats: { "Defense": "13", "DR": "3 (fibrous mass)", "Vitality": "55", "Speed": "2 (rooted; the bed does not move, the reach does)", "Initiative": "+2", "Saves": "+6 Body, +2 others", "Passive Perception": "12 (vibration)", "XP": "250" },
      skills: [{ name: "Athletics", value: "+7" }],
      abilities: [
        { name: "Tendril", cost: "Action", text: "Two attacks, +7 vs Defense, Reach 3 (flexible), 1d8+3 Bludgeoning (7). On a hit, the Bloom may attempt a Grapple contest (Athletics +7) for free." },
        { name: "Spore Sigh", cost: "Action", text: "Area 3 sphere within Reach: organic Targets make a Body Save DC 15 or are Poisoned until the end of their next turn." },
        { name: "Compost", cost: null, text: "A Grappled Target the Bloom starts its turn holding takes 1d6 Acid damage (3). Vulnerability to Fire damage, and it knows: it drops anything burning." }
      ],
      salvage: "Filter cores fetch 𝒢400 clean; the Verdine pay more, partly to study it, mostly to bury it."
    },
    {
      name: "Wiredog", category: "cryptids",
      gauge: 2, designation: "Standard", role: "Skirmisher",
      identity: "Gauge 2 Standard, Skirmisher. Small feral Construct: maintenance frames that outlived their depot, rebuilt themselves out of the district, and rediscovered the pack.",
      stats: { "Defense": "14", "DR": "1 (scrap plating)", "Vitality": "22", "Speed": "8", "Initiative": "+5", "Saves": "+5 Agility, +1 others", "Passive Perception": "14", "XP": "150" },
      abilities: [
        { name: "Mindless enough", cost: null, text: "Psychic damage deals 0. Not immune to fear; a Wiredog understands consequences better than most employees." },
        { name: "Shear Bite", cost: "Action", text: "+6 vs Defense, melee, 1d8+3 Slashing (7). Against a Target an allied Wiredog is adjacent to, the bite gains Edge." },
        { name: "Drag", cost: "Swift", text: "A Wiredog adjacent to a Prone Target can pull it 2 spaces toward the nest. They do not eat people. They strip gear. It is worse for morale than eating people." },
        { name: "Static Howl", cost: "Action", text: "Area 3 sphere: the zone is Signal Jammed until the end of the Alpha's next turn. The pack hunts phones first. It has learned what calling for help means." }
      ],
      signs: "Stripped copper, tidy piles of nonmetal effects, solder-bright toothmarks on conduit.",
      variant: { label: "Variant, Pack Alpha (Elite, 300 XP)", text: "Vitality 45, Defense 15. Adds" }
    },
    {
      name: "Rustmaw", category: "cryptids",
      gauge: 2, designation: "Solo", role: null,
      identity: "Gauge 2 Solo. Large Bioform, or possibly machinery, and the argument funds two dissertations: a metal-eater that works parked lanes and impound yards the way bears work rivers.",
      stats: { "Defense": "14", "DR": "3 (oxidized plate)", "Vitality": "120", "Speed": "6 (climbs structure at full speed)", "Initiative": "+4", "Saves": "+5 Body, +1 others", "Passive Perception": "13 (tastes current in the air; running engines read as cooking smells)", "Unshakable, Defensive Impulses": "as a Solo (its listed Impulse is Brace: reduce incoming damage by 1d10+4).", "XP": "600" },
      abilities: [
        { name: "Bite", cost: "Action", text: "+6 vs Defense, melee, 2d8+4 Piercing (13). Armor it bites loses 1 DR until repaired (the saliva does the work)." },
        { name: "Tail Sweep", cost: "Action", text: "+6 vs Defense, Reach 2, 1d10+4 Bludgeoning (9); on a hit the Target makes a Body Save DC 15 or is pushed 2 spaces." },
        { name: "Surges", cost: "2 per round", text: "*Lunge* (move half Speed); *Spray* (Area 2 cone: Agility Save DC 15, 1d6 Acid on a failure, none on a success); *Shed* (its space and each adjacent space become Difficult Terrain of shed scrap)." },
        { name: "Breakpoint", cost: null, text: "Something volatile it swallowed this week ruptures: once, Area 3 cone, Agility Save DC 15, 2d6 Fire on a failure, half on a success. After this, its DR drops to 2 and it starts looking for an exit. It is a feeder, not a fighter, and the distinction is the crew's best weapon." },
        { name: "Weakness", cost: null, text: "A charged anode (any vehicle battery rigged to bleed, one Engineering check) reads as an irresistible meal. While feeding on one, the Rustmaw ignores everything smaller than a gunshot, and attacks against it gain Edge." }
      ],
      salvage: "The gizzard carries 𝒢2d6 x 100 in refined slugs. The acid glands are worth 𝒢500 to chemists, less whatever the container costs. The container matters.",
      signs: "Vehicles stripped to polymer skeletons overnight; gutter runoff that etches boot soles; missing manhole covers, and then missing manholes."
    },
    {
      name: "Sublevel Angler", category: "cryptids",
      gauge: 3, designation: "Solo", role: null,
      identity: "Gauge 3 Solo. Large ambush predator of the flooded levels: a lure, a jaw, and a patience the dark has been refining since before the pumps failed.",
      stats: { "Defense": "15", "DR": "3 (pressure hide)", "Vitality": "200", "Speed": "5 (swim 8)", "Initiative": "+6", "Saves": "+6 Body, +2 others", "Passive Perception": "16 (Tremor Sense 12 spaces; it feels footsteps through standing water)", "Unshakable, Defensive Impulses": "as a Solo (listed Impulse: Submerge: gain Half Cover against one ranged attack).", "XP": "1,000" },
      abilities: [
        { name: "The Lure", cost: null, text: "A dangling light that reads, at distance, as a working maintenance lamp, a comm ping, a wearable's lost-and-found strobe. The first time a Target sees the lit lure each scene, it makes a Wits Save DC 16 or must use its next Move to close toward the light. Crews that know what the light is still lose people to it. It looks like somebody alive." },
        { name: "Jaw", cost: "Action", text: "+7 vs Defense, melee, 2d10+5 Piercing (16). On a hit, the Angler may attempt a Grapple contest for free (Athletics +8)." },
        { name: "Tongue Lash", cost: "Action", text: "+7 vs Defense, Reach 3 (flexible), 1d8+5 Bludgeoning (9); on a hit the Target is pulled 2 spaces toward the jaw." },
        { name: "Surges", cost: "3 per round", text: "*Douse* (extinguish its lure and any unshielded light within 2 spaces: Obscurement spreads); *Undertow* (each Target in water within 2 spaces makes a Body Save DC 16 or is pulled 1 space and falls Prone); *Snap* (one bite at the bottom of its range: 1d10+5)." },
        { name: "Breakpoint", cost: null, text: "It swallows a Grappled Target whole. Inside: Blinded, Restrained, 2d6 Acid at the start of each turn, and freedom costs 15 damage dealt to the gullet with a blade, a torch, or something worse. The Angler will start withdrawing toward deep water the round it feeds. It has what it came for." },
        { name: "Weakness", cost: null, text: "The lure's frequency logs as a recurring fault code in the level's maintenance manifests, which is how you find its beat. Cut the district mains and it hunts on Tremor Sense alone: it trusts the lure too much to hunt well without playing it, and a crew standing still is, briefly, invisible." }
      ],
      salvage: "The lure organ is Flow-touched (2x to 10x multipliers apply, per Part 3) and shrines, labs, and exactly one nightclub owner all want it. The pressure hide patches vehicle armor at half parts cost.",
      signs: "Work crews that clock in and vanish between checkpoints; a maintenance lamp that appears on no work order; waterline scars three spaces up the wall."
    },
    {
      name: "The Smiling Man", category: "cryptids",
      gauge: 4, designation: "Solo", role: "Ghost",
      identity: "Gauge 4 Solo, Ghost. Medium, allegedly. He is in the back of a crowd photo from before the crew was born, and the same photo taken last week. The file says Unregistered Extradimensional Asset. The file is guessing.",
      stats: { "Defense": "17", "DR": "0", "Vitality": "210", "Speed": "7 (never observed running; he is simply nearer)", "Initiative": "+8", "Saves": "+7 Mystique and Wits, +2 others", "Passive Perception": "17", "Unshakable, Defensive Impulses": "as a Solo (listed Impulse: Flicker: an attack that hits him is rerolled once; the second result stands).", "XP": "1,400" },
      abilities: [
        { name: "Wrong Geometry", cost: null, text: "Resistance to Ballistic and Piercing damage. The wound is never quite where he was." },
        { name: "Long Fingers", cost: "Action", text: "Two attacks, +9 vs Defense, melee, 2d8+5 Slashing (14)." },
        { name: "The Smile", cost: null, text: "The first time each scene a Target sees his face, it makes a Wits Save DC 17 or is Frightened until the end of its next turn." },
        { name: "Surges", cost: "3 per round", text: "*Closer* (teleport up to 6 spaces to any space no one can currently see); *Borrowed Face* (until someone looks twice, he reads as a person one Target knows: Wits Save DC 17 to look twice in time); *Still Frame* (one Target makes a Wits Save DC 17 or is Stunned until the end of its next turn; once per round)." },
        { name: "Breakpoint", cost: null, text: "The smile opens. Area 3 sphere on him: organic Targets make a Wits Save DC 17 or gain the Panic condition. He does not fight after this. He harvests whoever ran alone." },
        { name: "Weakness", cost: null, text: "He cannot enter a space where his own image is displayed, and a mirror or a live playback of him forces him, once per scene, to stop and regard himself for a round (treat as Restrained until the start of his next turn). Nobody knows if it is a rule or a vanity, and nobody has survived being wrong in both directions." }
      ],
      salvage: "None. Proof of him, though, is worth 𝒢10,000 to a cult, a tabloid, or a corporate anomalist, and each buyer is its own consequence.",
      signs: "An extra guest in old photos; dogs that refuse a block; witnesses who disagree on his clothes and agree on his teeth."
    },
    {
      name: "Cascade Orphan", category: "cryptids",
      gauge: 5, designation: "Solo", role: null,
      identity: "Gauge 5 Solo. Large. Something calved from a Resonant Storm that never fully closed, wearing local physics like a borrowed coat. The city has recordings. The city has arguments about the recordings.",
      stats: { "Defense": "17", "DR": "5 (reality callus)", "Vitality": "380", "Speed": "7", "Initiative": "+8", "Saves": "+8 Body and Mystique, +3 others", "Passive Perception": "16", "Immune": "Psychic.", "Resistance": "Resonant and Entropy. The inside of it is not a mind, and it has been unraveling since birth without noticing.", "Unshakable, Defensive Impulses": "as a Solo (listed Impulse: Unravel: reduce incoming damage by 2d6; damage so reduced to 0 rebounds 1d6 Resonant to the attacker).", "XP": "1,800" },
      abilities: [
        { name: "Static Bleed", cost: null, text: "Aura 3. The aura is a Static Zone, and the full entry in Part 2's Flow Disturbances governs it: Invocations cost more, their teeth are halved, and the current does not come back inside the line." },
        { name: "Unmade Limb", cost: "Action", text: "Three attacks, +10 vs Defense, Reach 2, 2d10+6 Force (Spatial) (17). Ignores armor DR; space itself is doing the cutting." },
        { name: "Gravity Well", cost: "Action", text: "Area 3 sphere within 12 spaces: Targets make a Body Save DC 18 or are pulled 3 spaces toward its center and knocked Prone." },
        { name: "Surges", cost: "3 per round", text: "*Fold Step* (teleport 4 spaces); *Shear* (one Unmade Limb attack at 2d10+6); *Howl of the Birth Hour* (one Target makes a Wits Save DC 18 or is Shaken until the end of its next turn)." },
        { name: "Breakpoint", cost: null, text: "It stops holding itself together. The Static Bleed aura collapses outward and the whole engagement area becomes a Severity 3 Resonant Storm (Invocations +1 FP; failed checks deal 1d4 Vitality) for the rest of the scene, and the Orphan's DR drops to 2. The armor was the leash." },
        { name: "Weakness", cost: null, text: "Its birth site holds a Focal Anchor, the fused object it crystallized around: Defense 14, Vitality 45, immune to Flow damage and effects. While the Anchor exists, an Orphan dropped to 0 Vitality re-forms there in 1d4 days. Destroy the Anchor first, or stand on it, and the Orphan must come to the crew, on ground the crew chose. Killing it anywhere else is a rental." }
      ],
      salvage: "The reality callus, chipped free, is the rarest crafting material in the city: relic-tier, per Part 2's Project rules, and every faction that learns the crew has it becomes a scene.",
      signs: "Districtwide static in every language; rain that falls slightly wrong; shrines going quiet and corporations going loud."
    }
  ]
};
