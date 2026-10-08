/* ===========================================================================
   ELYSIUM NIGHTS · Vehicles & Chases
   Transcribed from the manuscript, Part 2 (Core Rules, Combat, Survival, &
   Specialized Systems), modifiedTime 2026-10-04T07:31:16.171Z, pulled
   2026-10-07:
     # Vehicles and Chases (Part 2 export lines 5971 to 6275)
       intro, ## Core Concepts, ## Vehicle Stat Blocks and Categories,
       ## Speed Ratings, ## Vehicle Profiles (the mass rows line only; the
       profile table itself is EN.vehicles.profiles), ## Vehicle Traits,
       ## Operating a Vehicle, ## Shooting a Vehicle (not "Vehicles as cover",
       which is EN.combat.vehiclesAsCover), ## The Impact DC,
       ## Collisions and Ramming, ## Crashes, ## Chase Rules
       (### Resolving the Chase, ### Edge and Snag Interactions, ### The Crew,
       ### Pursuit Escalation, ### Chases Beyond Vehicles), ## Combat
       Integration (### Piloting Under Fire, ### Mounted Weapons),
       ## Category Rules (### Aerial: Altitude, ### Marine: Water,
       ### Starcraft: Vacuum, ### Industrial / Mechs: The Walker Package),
       ## Capacity and Towing, ## Cyberware and #GRID Hacking Hooks
       (### Codebreaker Intrusions, ### Rigging and Cyberware), and the
       Gameplay Summary box "Running a Chase".
     # Saving Throws > ## Vehicle Proficiencies (the proficiency chapter of
       the same part, export lines 1052 to 1064): `proficiencies`.
   Ownership, upkeep, repair, mods and the profile stat lines are Part 3 and
   live in EN.vehicles (app/data/vehicles.js); this file does not repeat them.

   The words are the book's, unescaped from the export. Where the book opens
   a paragraph with a bold run-in label ("**Tilt.**", "**Defense.**"), the
   label is the entry's `name` and `text` is the rest of the paragraph, so
   the Codex prints the label as the entry heading. Bold inside the prose is
   kept as **...**. Tables are arrays of row objects.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.chases = {
  intro: "In Elysium, a reliable ride is the line between a clean exit and bleeding out under a streetlight. Vehicles are mobile cover, weapon platforms, rolling network Nodes with their own digital reflections. Engine noise and tire scream are as much a part of life here as cyberware and the #GRID.",

  /* ---- Core Concepts ---------------------------------------------------- */
  coreConcepts: [
    { term: "Handling",   text: "The vehicle's responsiveness, applied as a modifier to piloting checks." },
    { term: "Structure",  text: "The vehicle's damage threshold. Hits below it bounce; hits at or above it land in full." },
    { term: "Integrity",  text: "The structural health of the vehicle. When it reaches 0, the vehicle is Wrecked." },
    { term: "Impact DC",  text: "A single DC, keyed to speed, for crash checks and every save a collision forces." },
    { term: "Lead",       text: "An abstract measure of distance and momentum used to resolve chases." },
    { term: "System Hit", text: "A concrete blow to a rival vehicle (a tire, a rotor, an engine) that moves Lead by itself." },
    { term: "Rigging",    text: "Direct neural control of a vehicle via cyberware, bypassing manual inputs." }
  ],

  /* ---- Vehicle Stat Blocks and Categories -------------------------------- */
  statBlocksIntro: "Every vehicle comes down to the same handful of numbers, and those numbers decide what it does the moment someone starts shooting.",
  categoriesNote: "Each category is its own Vehicle Proficiency. Training in Ground Vehicles says nothing about your instrument rating.",
  categories: [
    { category: "Ground Vehicles",    covers: "Standard wheeled or tracked transports that dominate the asphalt and undercity tunnels.", examples: "Street Bike, Armored Sedan, Buggy, Cargo Hauler" },
    { category: "Marine Vehicles",    covers: "Waterborne vessels ranging from agile hydrofoils to heavy cargo freighters working the coastal sectors.", examples: "Hydrofoil, Patrol Skiff, Cargo Freighter, Submersible" },
    { category: "Aerial Vehicles",    covers: "Aircraft ranging from light drones and gliders to corporate VTOLs and gunships.", examples: "Drone, VTOL, Glider, Interceptor" },
    { category: "Starcraft",          covers: "Orbital shuttles and light transports built for exo-atmospheric hops and deep-space transit.", examples: "Shuttle, System Fighter, Corvette, Drop Pod" },
    { category: "Industrial / Mechs", covers: "Walkers and heavy automated suits used for construction, hazard clearing, or riot suppression.", examples: "Loader Frame, Hazard Walker, Riot Suppression Mech, Exoframe Crane" }
  ],
  // "Vehicle Stats:", the bulleted list under the categories
  stats: [
    { name: "Tier", text: "The overall quality and build of the vehicle, scaling from 1 (scavenged junk) to 5 (military grade). Tier and Category together drive weekly upkeep, per the Vehicle Upkeep Table under Vehicle Ownership, and Tier alone sets how many Mod Slots the frame carries (see Vehicle Customization)." },
    { name: "Speed", text: "The vehicle's rating, one of four steps: **Slow, Standard, Fast, Very Fast**, in that order. The rating sets movement on the map and feeds the straightaway trigger in a chase (see Speed Ratings below)." },
    { name: "Handling", text: "A modifier applied to any piloting check (d20 or Dice Pool) when attempting complex maneuvers, evading hazards, or recovering from a spin." },
    { name: "Structure", text: "The vehicle's damage threshold, working exactly like the Structure value in Destructible Cover. An attack that rolls less than Structure does no Integrity damage. An attack that rolls Structure or higher deals its full damage to Integrity." },
    { name: "Integrity", text: "The physical health pool of the vehicle. Vehicles don't have Vigor, Vitality, or Wounds. When Integrity hits 0, the vehicle is **Wrecked**. A vehicle Wrecked while moving crashes (see Crashes)." },
    { name: "Node Tier", text: "The vehicle's reflection on the #GRID, from Rudimentary [-1] to Apex [5]. That tier sets its Security Rating, Cipher Save Bonus, and System Integrity against hostile intrusion, per the Node Attributes table. A factory civilian vehicle sits at Standard [0]. Corporate and military chassis climb from Improved [1] up. The profile values below are the default Node Tiers for those chassis; the Street Bike, Cargo Hauler, and Hydrofoil are civilian frames, so they sit at Standard [0]. The vehicle's own Integrity is a separate line from anything its Node carries." },
    { name: "Cargo", text: "How much the vehicle hauls beyond its people, in Load (the same unit Encumbrance uses)." },
    { name: "Traits", text: "Keyword tags that bend the standard rules, defined under Vehicle Traits below." }
  ],

  /* ---- Speed Ratings ---------------------------------------------------- */
  speedRatings: [
    { rating: "Slow",      spaces: 8 },
    { rating: "Standard",  spaces: 12 },
    { rating: "Fast",      spaces: 16 },
    { rating: "Very Fast", spaces: 20 }
  ],
  speedOrder: "The order runs Slow, then Standard, then Fast, then Very Fast. When a rule compares Speed ratings, the higher rating wins; Handling never enters that comparison.",
  speedOnMap: "On the map, the pilot moves the vehicle up to its Speed as part of the Move Action spent maintaining control (see Piloting Under Fire).",
  openThrottle: { name: "Open Throttle", action: "Action",
    text: "The pilot pushes the machine flat out, moving up to the vehicle's Speed again in a straight or near-straight line. Because the Action is spent, the pilot can't also make an evasive-maneuver piloting check this turn. Speed now, options later." },

  // the line under the Vehicle Profiles table (the table is EN.vehicles.profiles)
  massRows: "For collisions and towing, vehicles group into four mass rows: **Light** (bike, hydrofoil), **Standard** (sedan, shuttle), **Heavy** (cargo hauler, VTOL), **Massive** (riot mech).",

  /* ---- Vehicle Traits --------------------------------------------------- */
  traits: [
    { name: "Agile", text: "Built to change direction. The vehicle takes Edge on piloting checks to evade hazards, thread gaps, and recover control, and ranged attacks against it while it moved this round take Snag. Congested terrain that would halve another vehicle's Speed doesn't slow it." },
    { name: "Armored", text: "Military plate. The vehicle's base Structure is 18 whatever the chassis, and mods that raise Structure apply on top of it. Any attack that fails to clear its Structure can't harm the occupants inside by any route." },
    { name: "Broadframe", text: "High mass. The vehicle rams on the Heavy row of the ram damage table, and its pilot takes Snag on piloting checks for hard stops and tight turns. Shortcuts that depend on alleys, gaps, or service ramps are generally closed to it." },
    { name: "Enclosed", text: "A sealed hull. Occupants can't be targeted directly; they have Total Cover, and the hull section protecting them resolves as Destructible Cover if an attacker commits to breaching it. An occupant who opens a port, window, or hatch for any reason drops to Three-Quarter Cover until the start of their next turn. Occupants roll collision and crash saves with Edge." },
    { name: "Flight", text: "True three-dimensional movement. Street-level terrain, traffic, and barriers don't apply. Without Hover, the vehicle must keep moving forward each round; if it loses power or control while airborne, it falls (see Crashes, and Altitude under Category Rules)." },
    { name: "Hover", text: "The vehicle rides above its surface. Surface hazards (spike strips, debris, potholes, chop) don't slow or damage it, and it can hold a stationary position without forward momentum." },
    { name: "Open-Frame", text: "The occupants are in the open air. They can be targeted directly and get only Half Cover from the vehicle. They roll collision and crash saves with Snag and are thrown from the vehicle on a failed save. In exchange, nothing restricts their own weapons or gear." },
    { name: "Passenger (N)", text: "The vehicle seats N occupants in addition to the pilot. Every occupant is a full combatant under Combat Integration." },
    { name: "Walker", text: "Legged locomotion. Rubble, stairs, and steep grades count as open ground, the vehicle can pivot in place without a check, and while braced and stationary its Mounted weapons count as Stabilized." }
  ],

  /* ---- Operating a Vehicle ---------------------------------------------- */
  operating: {
    pilotingCheck: { name: "The Piloting Check",
      text: "One formula covers every roll a pilot makes: **d20 + Agility Modifier + Vehicle Proficiency Bonus + the vehicle's Handling**. On the Dice Pool Method, build Edge Dice from the same sources: your Agility Modifier, your Vehicle Proficiency tier, and the vehicle's Handling, the same as any other Dice Pool check. This chapter names two specific piloting checks: the **Chase Check**, the contested roll each chase round, and the **Control Check**, the roll to keep a compromised vehicle from becoming a crash. Both use this formula." },
    proficiency: "If a Character has the appropriate Vehicle Proficiency, they add their Vehicle Proficiency Bonus to checks made to control the vehicle. If a Character is Untrained, they can still attempt to operate it, but they roll with Snag on all related checks, and failures escalate quickly into catastrophic crashes (see Crashes). The GM may decide that especially complex, restricted, or specialized vehicles can't be operated without proper Vehicle Proficiency. A Skill Focus or Specialization narrowed to this vehicle type still applies to these checks, per Skills and Proficiencies.",
    ownership: "Ownership has its own price tag. List prices, weekly upkeep, and repair live under Vehicle Ownership, and mods live under Vehicle Customization. The short version: the city bills you whether you drive or not."
  },

  /* ---- Vehicle Proficiencies (Part 2, the proficiency chapter) ---------- */
  proficiencies: {
    intro: "Vehicle Proficiencies tell you what you are actually trained to drive or pilot.",
    rule: "If you have the right Vehicle Proficiency, you can operate that vehicle class normally. If you don't, you usually can't operate it at all. For simpler vehicles, the GM might let you try anyway. When they do, you roll with **Snag**, and a failure tends to create bigger problems, especially while piloting under stress.",
    rows: [
      { category: "Ground Vehicles", covers: "Wheeled, tracked, or hovering transport built for streets and off-road terrain.", examples: "Street bikes, armored sedans, scavenged buggies, cargo haulers",
        inPlay: "The standard for urban getaways and wasteland smuggling. High availability, but heavily restricted by traffic, barricades, and physical terrain." },
      { category: "Aerial Vehicles", covers: "Atmospheric flight craft relying on rotors, thrusters, or anti-grav tech.", examples: "Surveillance drones, corporate VTOLs, smuggling gliders, interceptors",
        inPlay: "Bypasses ground hazards and borders, but highly visible. Requires three-dimensional spatial awareness and leaves you vulnerable to anti-air systems." },
      { category: "Marine Vehicles", covers: "Surface and submersible watercraft designed for coastal, ocean, or flooded ruin traversal.", examples: "Gunboats, smuggler submersibles, salvage barges, hovercraft",
        inPlay: "Essential for navigating flooded sectors and bypassing bridge checkpoints. Demands knowledge of currents, buoyancy, and environmental seals." },
      { category: "Industrial / Mechs", covers: "Heavy bipedal frames, walkers, and heavy machinery built for labor or siege.", examples: "Cargo loaders, salvage mechs, riot suppression frames, construction rigs",
        inPlay: "Trades speed for overwhelming mass and armor. Operating these requires managing massive inertia, hydraulic limits, and complex safety overrides." },
      { category: "Starcraft", covers: "Void-capable vessels engineered for orbital transit, vacuum combat, and re-entry.", examples: "Orbital shuttles, system fighters, corporate corvettes, drop pods",
        inPlay: "The peak of complex piloting. Demands strict adherence to vacuum safety, orbital navigation, and managing zero-gravity momentum." }
    ]
  },

  /* ---- Shooting a Vehicle ------------------------------------------------
     The book's "Vehicles as cover" paragraphs sit between Structure and
     Occupants; they are EN.combat.vehiclesAsCover, rendered in Cover & Sight. */
  shooting: {
    defense: { name: "Defense",
      text: "A piloted vehicle in motion presents a Defense of **10 + Handling + the pilot's Vehicle Proficiency Bonus**. An unpiloted or parked vehicle presents a static Defense of 10 + its Handling. As always, the Attack Total must meet or beat Defense. The same crate is harder to hit with a better pilot in the seat." },
    structure: { name: "Structure and Integrity",
      text: "Resolve damage against a vehicle with the same gate Destructible Cover uses:",
      gate: [
        "Damage **less than Structure**: the hit rattles paint and nerves, nothing else. No Integrity loss.",
        "Damage **equal to or higher than Structure**: the full rolled damage comes off Integrity."
      ],
      siege: "A weapon with **Siege** doubles its damage before the comparison against Structure. That is what \"double damage to Vehicle armor\" means in practice: the doubled roll is what has to clear the gate, and what lands if it does. Area and Explosive damage is rolled once and applied to everything caught, each vehicle or cover section applying its own Structure." },
    occupants: { name: "Occupants",
      text: "While the vehicle has Integrity, hits on the vehicle don't harm the people inside. The hull eats it. Occupant risk arrives by four routes instead:",
      routes: [
        { text: "**Targeted fire:** An attacker may target an occupant instead of the vehicle. The vehicle's traits set the cover they get.",
          sub: [
            "Open-Frame occupants have Half Cover.",
            "Enclosed occupants have Total Cover and can't be targeted directly unless the hull section protecting them is breached. If an occupant opens a port, window, or hatch for any reason, they have Three-Quarter Cover until the start of their next turn, even if they close it before then.",
            "A vehicle with neither Enclosed nor Open-Frame sits between them: its occupants have Three-Quarter Cover against targeted fire and roll collision and crash saves flat. A cab is not a hull. It is not a saddle either."
          ] },
        { text: "**Collisions** and **crashes**, below." },
        { text: "**Overflow:** when a hit reduces the vehicle to 0 Integrity, any damage below 0 becomes overflow applied to every occupant, exactly as the Destructible Cover overflow rule: no additional Defense against it, but armor, Damage Reduction, and Resistances apply as normal." }
      ] },
    wrecked: { name: "Wrecked and Disabled",
      text: "At 0 Integrity a vehicle is **Wrecked**: unrecoverable at the roadside, salvage and scrap. A vehicle that is crashed, seized, or engine-killed with Integrity remaining is **Disabled**: intact but not drivable until repaired (see Vehicle Repair under Vehicle Ownership). One is a funeral. The other is a bad afternoon and a bill." }
  },

  /* ---- The Impact DC ---------------------------------------------------- */
  impactIntro: "One DC, keyed to speed at the moment things go wrong. It sets the DC for Control Checks, for every save a collision or crash forces on an occupant, and for the pedestrian's save against being rammed.",
  impactDc: [
    { speed: "Rolling stop or stationary", dc: 10 },
    { speed: "Slow",      dc: 12 },
    { speed: "Standard",  dc: 14 },
    { speed: "Fast",      dc: 16 },
    { speed: "Very Fast", dc: 18 }
  ],

  /* ---- Collisions and Ramming ------------------------------------------- */
  collisions: {
    ram: "A Freelancer can use their vehicle as a kinetic weapon. To ram an Enemy, the pilot makes an opposed piloting check (d20 + Agility Modifier + Vehicle Proficiency Bonus + Handling) against the defender's piloting check; an unpiloted or parked vehicle presents a static Defense of 10 + its Handling.",
    onWin: "If the pilot wins, both vehicles take Bludgeoning damage based on the attacking vehicle's mass and Speed (for example, 3d10 for a standard sedan), but the defending Target takes double damage. If the defending Target is organic and on foot, they must make an Agility Save against the Impact DC for the attacker's speed or take the full impact and be knocked Prone.",
    ramDamage: { name: "Ram damage by vehicle mass",
      text: "Light (bike, hydrofoil) 2d10; Standard (sedan, shuttle) 3d10; Heavy (cargo hauler, VTOL) 4d10; Massive (riot mech) 5d10. A vehicle ramming at Fast or Very Fast adds +1d10." },
    occupants: { name: "Occupants in a collision",
      text: "each occupant of a vehicle involved makes a Body Save against the Impact DC for the ramming vehicle's speed. On a success, the belts and cage do their job: no damage. On a failure, the occupant takes half the damage their own vehicle took, rounded down, as Bludgeoning; armor applies. Open-Frame occupants make this save with Snag and are thrown to an adjacent space, Prone, on a failure. Enclosed occupants make it with Edge." }
  },

  /* ---- Crashes: the intro and the five numbered steps ------------------- */
  crashes: {
    intro: "Four things put a vehicle into a crash: it hits 0 Integrity while moving; a catastrophic piloting failure (the GM calls it); a collision force-stops it at speed; or a control seizure or engine kill lands while it is moving. Resolve every one of them the same way.",
    steps: [
      { n: 1, name: "Control Check", text: "The pilot rolls a Control Check (the standard piloting formula) against the Impact DC for the vehicle's current speed. If the vehicle is already Wrecked, the check takes Snag: there is only so much you can do with a machine that has stopped being one." },
      { n: 2, name: "Success: controlled stop", text: "The vehicle takes half crash damage and ends stationary; occupants take nothing. If Integrity remains, the vehicle is Disabled rather than dead." },
      { n: 3, name: "Failure: full crash", text: "Roll crash damage by speed at impact: **Slow 2d10, Standard 3d10, Fast 4d10, Very Fast 5d10.** The vehicle takes the full roll, and crash damage ignores Structure; the whole frame is hitting the world. Each occupant makes a Body Save against the same Impact DC: nothing on a success, half the rolled crash damage on a failure, with the same Open-Frame (Snag, thrown, Prone) and Enclosed (Edge) riders as collisions." },
      { n: 4, name: "Altitude", text: "An airborne vehicle that crashes resolves one speed step higher than its actual speed, for both the DC and the dice: a Very Fast airborne crash rolls 6d10 against DC 18, and there is no seventh step. A Flight vehicle that also has Hover and still has power can auto-descend, making its Control Check with Edge. This is the difference between a bike laying down at Lead 0 and a VTOL losing power over the towers." },
      { n: 5, name: "Lead consequence", text: "If the pursuer crashes, the fleeing side escapes: Lead goes to 5. If the fleeing side crashes at Lead 2 or less, the pursuers reach Contact at the start of their next turn. At Lead 3 or more, the GM rules whether the wreck is reachable before its crew scatters into the city." }
    ]
  },

  /* ---- Chase Rules ------------------------------------------------------ */
  chase: {
    intro: "High-speed pursuits use the Lead system to track distance and momentum without requiring a rigid tactical map. Lead is an abstract scale measuring the gap between the fleeing Target and the pursuing Character.",
    lead: [
      { lead: 0, band: "Contact", gap: "0 to 1. Adjacent; ramming and boarding are possible." },
      { lead: 1, band: "Close",   gap: "6" },
      { lead: 2, band: "Close",   gap: "12" },
      { lead: 3, band: "Distant", gap: "24" },
      { lead: 4, band: "Distant", gap: "48" },
      { lead: 5, band: "Escape",  gap: "Out of sight. The fleeing Target vanishes into the city." }
    ],
    ranges: "Close is short range for weapons and Quick Hacks. Distant is long range. The gap column makes that exact: a weapon, cipher, or ability reaches the rival vehicle if its listed Range in spaces is equal to or greater than the current gap. Weapons with short and long bands use the short band if it covers the gap, otherwise the long band with its normal long-range Snag, otherwise no shot. A Quick Hack's 12 spaces works through all of Close and dies at Distant. If the chase drops onto the map, place the vehicles at the current gap distance; in practice only Contact and Close ever land on a map.",
    startAndEnd: "A chase begins at Lead 2 (Close) unless the fiction sets otherwise, and Lead never drops below 0. The fleeing side escapes at Lead 5. The pursuer wins at Lead 0 (Contact) by resolving a capture on their turn: a ram, a board, or a force-stop against the target.",
    // ### Resolving the Chase
    resolving: "Each round of the chase, the pursuing and fleeing pilots engage in a Contested Action: the **Chase Check**, made with the standard piloting formula. If the chase involves active combat and gunfire, use the d20 Method. If it is an extended out-of-combat pursuit through the districts, use the Dice Pool Method.",
    outcomes: [
      { name: "Fleeing pilot wins", text: "Lead increases by 1. A Dominant Victory (Margin +5 on d20, or +3 in Dice Pools) increases Lead by 2. In a chase, the d20 threshold for Dominant Victory is +5 rather than the usual +10." },
      { name: "Pursuing pilot wins", text: "Lead decreases by 1. A Dominant Victory decreases Lead by 2." },
      { name: "Stalemate", text: "The Lead remains unchanged, but the GM introduces a sudden environmental hazard for both sides." }
    ],
    // ### Edge and Snag Interactions
    edgeSnagIntro: "The city decides how fast you get to go.",
    edgeSnag: [
      { name: "Edge", text: "Granted by taking risky shortcuts, deploying countermeasures, or holding the strictly higher Speed rating on a straightaway. On a straightaway, the pilot of the vehicle with the higher Speed rating gains Edge on the Chase Check; Handling never enters this comparison. Thrust and reflexes are different arguments, and the straightaway only listens to one of them." },
      { name: "Snag", text: "Imposed by crowded streets, severe vehicle damage, or weather that gets between the tires and the road: standing runoff, smog thick enough to hide a stopped truck, wind shear coming off the tower faces." }
    ],
    // ### The Crew
    crewIntro: "The pilots' contest is the spine of the chase. Everyone else aboard bends it. Crew actions touch the Lead track in exactly two ways.",
    tilt: { name: "Tilt",
      text: "A crew member's successful, plausible action tilts the round: navigation intel (a Wits or Systems check), suppressive fire, a countermeasure, a successful Quick Hack against the rival vehicle's Node. Each grants the allied pilot Edge on this round's Chase Check, or imposes Snag on the rival pilot's, whichever the fiction supports. The Modifier Stack Cap (see Scanning and Detection in The #GRID) governs: no stacking on a d20 Chase Check (a second helper adds nothing), and +2 Edge Dice at most if the chase runs on the Dice Pool Method." },
    systemHits: { name: "System Hits",
      text: "Certain concrete results move Lead by 1 in the acting side's favor the moment they land, on top of the round's contest:",
      list: [
        "The first time a vehicle drops below half Integrity, a system gives: a tire, a rotor, a steering servo, the GM's pick. Lead shifts 1 against it and its pilot takes Snag on their next Chase Check.",
        "A critical hit against the rival vehicle may be taken as a System Hit (with the same rider) instead of its normal critical effect. The attacker chooses.",
        "A Dominant success on a Quick Hack against the rival vehicle's Node, or any cipher whose printed effect disables a system: an engine kill through a breached Node, Hotwire's dictated action resolving at the wrong moment.",
        "Puppet Vehicle resolves exactly as written. While the hacker holds the controls, the hacker makes the Chase Checks for that vehicle, and the printed wrest-back contest decides who is actually driving.",
        "A pilot whose connection is severed mid-chase (a Dead Zone, LinkDeath) reverts to manual control and takes Snag on their next Chase Check."
      ],
      cap: { name: "The cap", text: "Lead can move at most 1 step per round per side from System Hits, total. The pilots' contest remains the only other thing that moves it. A perfect round, Dominant win plus a System Hit, swings Lead by 3. It takes the whole crew firing in sequence to get there." } },
    // ### Pursuit Escalation
    escalation: {
      heat: "The city is never just the two of you. A loud, public chase adds **+1 Heat** with the authority or faction whose territory it tears through, and +1 more if it ends in a crash, casualties, or property nobody can ignore. Escaping at Lead 5 never reduces the Heat the chase earned. The cameras were rolling either way.",
      firstResponse: "Heat also answers who shows up. When a chase goes loud, the first response arrives after a number of rounds equal to **5 minus half the crew's Heat with that source** (rounded down, minimum 1). While the chase stays loud, escalate one row every 3 rounds.",
      rows: [
        { heat: "0 to 2",  heatMin: 0, heatMax: 2,  shows: "A traffic drone logs plates. Evidence, not pursuit. Tomorrow's problem." },
        { heat: "3 to 4",  heatMin: 3, heatMax: 4,  shows: "A patrol drone joins the chase as a new pursuer (Standard speed, Handling +0)." },
        { heat: "5 to 6",  heatMin: 5, heatMax: 6,  shows: "An interceptor, plus a hazard: spike strip, checkpoint, drone screen." },
        { heat: "7 to 8",  heatMin: 7, heatMax: 8,  shows: "Paired corporate interceptors and an aerial spotter. A blockade across the Lanes: the fleeing side needs a Dominant win to gain Lead through it." },
        { heat: "9 to 10", heatMin: 9, heatMax: 10, shows: "A gunship. Escape at Lead 5 ends the scene, not the pursuit. They know where you sleep." }
      ]
    },
    // ### Chases Beyond Vehicles
    beyondIntro: "The Lead track measures a pursuit, not an engine. Anything that runs can be chased on it.",
    beyond: [
      { name: "Foot chases", text: "the Chase Check becomes d20 + Agility Modifier + Athletics or Acrobatics Proficiency Bonus. No Handling; your knees are the suspension." },
      { name: "Mixed chases", text: "a bike running down a sprinter, a runner ducking a drone. Each side rolls its own kind of check. For the straightaway trigger, a Character on foot counts as Slow, so open ground favors the engine, which is exactly why runners don't stay in open ground. Terrain the vehicle can't enter (a stairwell, a market crush, a gap between rooftops) forces the pursuer to dismount or find another route, taking Snag on the Chase Check if they stay in the vehicle." },
      { name: "#GRID traces", text: "a pursuit through the network runs on the same 0 to 5 bands, with the check as d20 + Tech Modifier + Systems Proficiency Bonus. Where a printed cipher such as Backtrace applies, its text governs; the track just gives the scene its shape." }
    ]
  },

  /* ---- Combat Integration ----------------------------------------------- */
  combat: {
    intro: "When the chase turns into a firefight, standard combat timing and Action Economy apply.",
    underFire: "Driving through a firefight takes both hands and most of your attention. A Freelancer acting as the pilot must spend a Move Action each turn to maintain steady control; that same Move Action moves the vehicle up to its Speed on the map. Evasive maneuvers, such as dodging incoming rockets or getting across a collapsing bridge, require spending an Action to make a piloting check.",
    shootingMoving: { name: "Shooting from a moving vehicle",
      text: "attacks made from inside a vehicle moving at Fast or Very Fast take Snag unless the weapon is Mounted. Below that, the ride is steady enough to shoot over." },
    mounted: [
      "Weapons hardwired into the vehicle's chassis are operated using the vehicle's onboard targeting systems. When firing a Mounted weapon, the Freelancer rolls **d20 + Tech Modifier + Weapon Proficiency Bonus**, where the proficiency is the mounted weapon's own category (Heavy Weapons for the Heavy Weapons and Explosive Launchers catalogs).",
      "The guns themselves are the Heavy Weapons and Explosive Launchers, carried on a Hardpoint Mount (see Vehicle Customization) or listed in a profile's stock loadout, with their printed damage, Range, ammo, firing modes, and Counted ammunition rules. A Mounted weapon counts as being in its Setup state: it ignores High Recoil and its range bands are doubled. The vehicle's feed system counts as the loader for Crew Served. Arc of fire comes from the mount: fixed forward, or a full turret ring.",
      "Stock loadouts: the Riot Suppression Mech carries a Rotary Cannon on a turret ring. The Corporate VTOL carries a Light Machinegun on a fixed door mount."
    ]
  },

  /* ---- Category Rules --------------------------------------------------- */
  categoryRules: {
    intro: "Ground vehicles are the baseline; the rules above assume asphalt. The other four categories each bend physics their own way.",
    aerial: {
      name: "Aerial: Altitude",
      intro: "Aerial vehicles occupy one of three altitude bands:",
      bands: [
        { name: "Deck", text: "street level, rooftop level, between the towers. Everything works normally." },
        { name: "Low", text: "above the traffic. Only a weapon's long band and Mounted weapons reach, and only Deck or Low targets are reachable in return." },
        { name: "High", text: "out of small-arms reach entirely. Only Guided weapons and other aircraft can touch it, and vice versa." }
      ],
      changing: "Changing bands costs one round of climb or dive. A climbing vehicle forfeits the straightaway trigger that round; gravity collects its toll on the way up.",
      stall: { name: "Stall", text: "a Flight vehicle without Hover that fails to move forward in a round makes an immediate Control Check against its Impact DC or begins falling. Remember that an airborne crash resolves one speed step higher. Losing an engine at a curb is a repair bill. Losing one four hundred feet up is a different chapter of your life." }
    },
    marine: { name: "Marine: Water",
      text: "Water is the road, if you brought the right vehicle. A non-Marine ground vehicle that enters deep water is Disabled in 1d4 rounds and sinks; from there its occupants are on the drowning rules and their own choices. Marine vehicles treat open water as clear terrain. Their signature Snag source is weather: chop, wake, cross-current, the harbor deciding it has opinions." },
    starcraft: { name: "Starcraft: Vacuum",
      text: "Starcraft count as Enclosed with full life support. A hull breach in vacuum strips the Enclosed benefits and exposes every occupant to the vacuum environmental hazard, which doesn't negotiate. Launch and reentry are Complex piloting tasks, resolved on the Dice Pool Method rather than a single d20. In atmosphere, a Starcraft handles as an Aerial vehicle but takes Snag on tight maneuvers. It was built for a place with no corners." },
    walker: { name: "Industrial / Mechs: The Walker Package",
      text: "The Walker trait carries the category: rubble and stairs as open ground, pivoting in place, braced-turret fire. One addition: a braced, stationary Walker counts as Heavy cover (Structure 11, per the Cover Material Table) for allies sheltering behind its legs. Some crews are very fond of their mech. The mech doesn't mind." }
  },

  /* ---- Capacity and Towing ---------------------------------------------- */
  capacity: "Each Passenger seat covers one person and their carried gear. An occupant loaded past their own Encumbrance Threshold, or heavier than baseline (a Streetware Reinforced Skeleton's added mass, for instance), also counts against the vehicle's Cargo, at the GM's discretion.",
  towing: { name: "Towing",
    text: "a vehicle can tow one vehicle from a lighter mass row at a Speed rating one step lower, with Snag on piloting checks for hard maneuvers. A Ground vehicle with proper rigging can tow its own mass row at two steps lower. A Titan Tether covers Light-row tows; anything heavier wants an industrial winch or a Cargo Winch mod. A Hauler drags a wrecked sedan home at Slow. Nobody drags a mech anywhere without a story." },

  /* ---- Cyberware and #GRID Hacking Hooks -------------------------------- */
  hacking: {
    intro: "Every engine on the street trails a network behind it. The #GRID reads that signature whether the driver knows it or not.",
    codebreaker: "Every modern vehicle projects a Node at its Node Tier, drawing Security Rating, Cipher Save Bonus, and System Integrity from the Node Attributes table, while the vehicle's own Integrity stays its own line. A **Codebreaker** can target an Enemy vehicle to seize control or disable its critical systems mid-pursuit.",
    nodes: [
      { name: "Rudimentary and Standard Nodes (Street Bikes, Civilian Cars)", text: "These low-tier systems have no System Integrity to chew through, and a Firewall only if the owner paid for one. A single successful Quick Hack or Cipher Attack can kill the engine, lock the steering, or trigger the airbags, instantly blinding the pilot and forcing a loss of control. Cheap frames are cheap partly because their network layer is one clean hit from becoming a tow bill." },
      { name: "Improved and higher Nodes (Armored Transports, Corporate VTOLs)", text: "These systems carry a Firewall and System Integrity, so a Codebreaker must chew through them first. Once breached, the **Codebreaker** can hijack the mounted weapons, falsify sensor readouts, or force the vehicle to brake aggressively." }
    ],
    inChase: "In a chase, these intrusions plug into the crew rules: a successful Quick Hack tilts the round, a Dominant success or a system-disabling cipher lands a System Hit, and Puppet Vehicle hands the Chase Check itself to the hacker. A vehicle can also mount a Firewall of its own; see Vehicle Customization.",
    riggingIntro: "A Rigger, or any Freelancer carrying a Neural Interface (Datajack), can plug their nervous system straight into a vehicle's diagnostic array.",
    rigging: [
      { name: "Direct Drive", text: "While hardwired into the chassis, the Freelancer uses their Tech Modifier instead of their Agility Modifier for all piloting checks." },
      { name: "Machine Symbiosis", text: "The vehicle becomes their body. They gain Edge on all piloting checks, but any severe physical damage the vehicle sustains forces the Freelancer to make a Stability Check (DC 10, or half the damage the vehicle took that turn, whichever is higher) or suffer the psychic backlash as LinkDeath." }
    ],
    severed: "A rigged pilot whose connection is severed mid-chase, by a Dead Zone, by LinkDeath, by someone cutting the cable, reverts to manual inputs and takes Snag on their next Chase Check. The machine stops being your body. Your body remembers it has hands."
  },

  /* ---- the Gameplay Summary box that closes the chapter ----------------- */
  summary: { name: "Running a Chase", label: "Gameplay Summary",
    text: "Set Lead at 2 unless the fiction says otherwise. Each round: crew members act first in the fiction (tilt via Edge and Snag, hunt System Hits), then the pilots roll the contested Chase Check and move Lead. Check the pursuit escalation timer against Heat. Lead 5 flees clean; Lead 0 invites a ram, a board, or a force-stop. Crashes run the Control Check against the Impact DC. Keep the camera low and the bill high." }
};
