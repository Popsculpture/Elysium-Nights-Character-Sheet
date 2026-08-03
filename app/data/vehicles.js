/* ===========================================================================
   ELYSIUM NIGHTS - Vehicles: Ownership and Customization
   Extracted from Part 3, "Vehicle Ownership" and "Vehicle Customization".
   Prices in Glimmer. A vehicle's List Price is twenty weeks of its upkeep, and
   its Mod Slot Count is 1 + its Tier, so both are derived here rather than
   stored twice. Category and Tier match the Vehicles and Chases chapter.
   =========================================================================== */
window.EN = window.EN || {};

EN.vehicles = {
  statsNote: "Speed, Handling, Structure, Integrity, Node Tier, Cargo and Traits come from the Vehicles and Chases table in Part 2. The Piloting Check is d20 + Agility modifier + Vehicle Proficiency Bonus + the vehicle's Handling.",
  intro: "The title says the vehicle is yours. The garage, the fuel line, and whoever holds the note all have opinions about that. Buying is the easy part. Then the machine moves in: it wants power and fluids every week, somewhere to sit overnight where nobody strips it or tows it, and money set aside against the afternoon something shears loose in traffic.",

  /* ---- the seven printed profiles -------------------------------------
     listPrice is twenty weeks of upkeep and modSlots is 1 + tier; both are
     computed at load so a Tier or upkeep edit can never desync them. */
  profiles: [
    { name: "Street Bike", speed: "Fast", handling: 2, structure: 7, integrity: 20, nodeTier: "Standard [0]", cargo: 2, traits: ["Agile", "Open-Frame"],            category: "Ground",             tier: 1, fuel: 150,  reserve: 100,  availability: "Common",   legality: "Licensed" },
    { name: "Armored Sedan", speed: "Standard", handling: 0, structure: 14, integrity: 45, nodeTier: "Improved [1]", cargo: 8, traits: ["Enclosed", "Passenger (4)"],          category: "Ground",             tier: 2, fuel: 300,  reserve: 200,  availability: "Uncommon", legality: "Licensed" },
    { name: "Cargo Hauler", speed: "Slow", handling: -2, structure: 11, integrity: 80, nodeTier: "Standard [0]", cargo: 40, traits: ["Broadframe", "Passenger (6)"],           category: "Ground",             tier: 2, fuel: 500,  reserve: 400,  availability: "Common",   legality: "Licensed" },
    { name: "Hydrofoil", speed: "Fast", handling: 1, structure: 9, integrity: 30, nodeTier: "Standard [0]", cargo: 10, traits: ["Hover", "Agile", "Open-Frame"],              category: "Marine",             tier: 1, fuel: 500,  reserve: 400,  availability: "Uncommon", legality: "Licensed" },
    { name: "Corporate VTOL", speed: "Very Fast", handling: 1, structure: 14, integrity: 50, nodeTier: "Advanced [2]", cargo: 16, traits: ["Flight", "Hover"],         category: "Aerial",             tier: 3, fuel: 1500, reserve: 1000, availability: "Rare",     legality: "Restricted" },
    { name: "Riot Suppression Mech", speed: "Slow", handling: -1, structure: 18, integrity: 100, nodeTier: "Advanced [2]", cargo: 4, traits: ["Walker", "Armored"],  category: "Industrial / Mechs", tier: 3, fuel: 2000, reserve: 1500, availability: "Rare",     legality: "Restricted" },
    { name: "Light Shuttle", speed: "Very Fast", handling: -1, structure: 11, integrity: 40, nodeTier: "Improved [1]", cargo: 20, traits: ["Flight", "Enclosed"],          category: "Starcraft",          tier: 2, fuel: 2500, reserve: 1500, availability: "Rare",     legality: "Licensed" }
  ],

  unlisted: "For vehicles not listed, base upkeep on the closest example by Category and Tier, then price the vehicle at twenty weeks of that upkeep. Each step up in Tier roughly doubles weekly upkeep, and non-Ground categories carry a premium for specialty parts, licensing, and limited service options.",

  /* ---- acquisition ----------------------------------------------------- */
  acquisition: [
    { mode: "New",         cost: "List price",           note: "Restricted purchases route through brokers, and per the high-scrutiny commissions rule those transactions may bill in Nexus at the GM's discretion." },
    { mode: "Used/salvage", cost: "40 to 60% of list",   note: "It runs. It also arrives with a quirk the GM writes down, drawn from the same menu as lapsed upkeep: the starter that grinds, the signature loud enough to track." },
    { mode: "Hot",         cost: "25% of list",          note: "Unregistered, and worth Heat with whoever it was stolen from the moment a scanner reads it." },
    { mode: "Leased",      cost: "Upkeep, list as Buyout", note: "Corporate fleets run the Leased trait exactly as written in Gear Traits, with the vehicle's list price as the Buyout. Its Locked state is a dead ignition: the engine will not turn over, installed mods sit inert, and the doors open for whoever holds the note." }
  ],

  /* ---- upkeep ----------------------------------------------------------- */
  upkeepNote: "Pay vehicle upkeep once per week of active use or once per major travel leg, whichever better matches the campaign. Weekly upkeep is Fuel and Routine plus Repair Reserve. If the crew stops paying, respond through the fiction first: a starter that grinds, a signature loud enough to track, a brake line that gives at the wrong moment, a repair bill that doubled overnight.",

  storage: [
    { service: "Street parking or low security rack",   cost: "20 to 100 / day" },
    { service: "Secured lot or garage",                 cost: "100 to 250 / day" },
    { service: "Hidden chop garage or off-books storage", cost: "250 to 600 / day" },
    { service: "Protected hangar or private docking",   cost: "750+ / day" }
  ],

  /* ---- repair ----------------------------------------------------------- */
  repair: [
    "Garage repair (Downtime): with upkeep current and access to a garage, one week's Repair Reserve value in parts and labor restores up to half the vehicle's maximum Integrity. A full restore from 0 costs two weeks' Reserve paid at once and a full Downtime of work.",
    "Field repair (Short Rest): a Tech (Engineering) Dice Pool with an Engineering Toolkit restores 5 Integrity per success, once per vehicle per day, and cannot raise the vehicle above half its maximum. Field work also clears the Disabled state.",
    "Wrecked (0 Integrity): no field repair. Garage lane only, and the GM may rule a burned or crushed frame is past saving, worth only its salvage."
  ],

  /* ---- customization ----------------------------------------------------- */
  modRules: [
    "Mod Slot Count = 1 + the vehicle's Tier. The Street Bike and Hydrofoil carry 2, the Sedan, Hauler, and Shuttle carry 3, the VTOL and Mech carry 4.",
    "A vehicle holds at most one mod per slot.",
    "Firewalls: a vehicle may mount one Firewall from the Firewall table in The #GRID by spending one Mod Slot. A Smartdeck gets its Firewall free because a deck is a hacking tool. A sedan is not.",
    "Fitting or pulling a mod is bench work: downtime, a garage, and Engineering Tools. Never a combat action.",
    "Flat bonuses of the same kind do not stack. If two mods each grant the same flat bonus, the higher applies and the other is dead weight bolted to your frame.",
    "A mod never lowers a vehicle's Legality, it only raises the heat. The strictest tag among the vehicle and everything mounted on it is what a checkpoint scanner reads."
  ],

  mods: [
    { name: "Plate Kit",          price: 1200, fits: "Any",                availability: "Uncommon", legality: "Restricted",
      effect: "The vehicle's Structure increases by 2. The added mass counts as one Speed rating lower for straightaway Edge." },
    { name: "Run-Flat Wheels",    price: 400,  fits: "Ground",             availability: "Common",   legality: "Legal",
      effect: "Ignore the first tire System Hit against this vehicle each scene, and spike strips force no Control Check." },
    { name: "Smoke Discharger",   price: 600,  fits: "Any",                availability: "Uncommon", legality: "Restricted",
      effect: "Swift Action: spend 1 of 3 charges to lay an Area 3 Obscuring cloud, imposing Snag on the pursuer." },
    { name: "Ram Bar",            price: 500,  fits: "Ground",             availability: "Common",   legality: "Licensed",
      effect: "Your vehicle takes half damage, rounded down, from rams you initiate." },
    { name: "Cargo Winch",        price: 450,  fits: "Ground, Industrial", availability: "Common",   legality: "Legal",
      effect: "Counts as a Titan Tether with its own anchor point. Enables rated towing." },
    { name: "Hardpoint Mount",    price: 700,  priceAlt: 1400, priceNote: "700 fixed forward, 1,400 turret ring",
      fits: "Any", availability: "Uncommon", legality: "Restricted",
      effect: "Mounts one Heavy Weapon or Explosive Launcher as a Mounted weapon. A fixed mount fires in a forward arc; a turret ring swings 360 degrees." },
    { name: "Ghost Transponder",  price: 800,  fits: "Any",                availability: "Uncommon", legality: "Contraband",
      effect: "Edge on checks against scanners, checkpoints, and traffic systems, and Heat is reduced by 1 per scene." },
    { name: "Ejector Seat",       price: 900,  fits: "Any",                availability: "Rare",     legality: "Licensed",
      effect: "Special: when a crash resolves, one occupant in the rigged seat exits before crash damage, or is launched on demand. Needs open sky above." },
    { name: "Overdrive Injector", price: 1500, fits: "Any",                availability: "Rare",     legality: "Restricted",
      effect: "Once per scene, for one round, count the vehicle's Speed rating as one step higher. The engine takes 5 Integrity." },
    { name: "Chameleon Coat",     price: 2000, fits: "Any",                availability: "Rare",     legality: "Restricted",
      effect: "The vehicle repaints itself between scenes. Checks to spot or identify it while parked roll with Snag, and it gains Edge on Chase Checks at Lead 4." },
    { name: "Node Retrofit",      price: null, priceNote: "the listed cost of the new tier in The #GRID",
      fits: "Any", availability: "Uncommon", legality: "Licensed",
      effect: "Raises the vehicle's Node Tier by one step, using the Node Attributes of the new tier. Each step costs its own Mod Slot and its own price. A vehicle's node may not exceed two steps above the tier its profile lists." },
    { name: "Cabin Kit",          price: 1000, fits: "Any",                availability: "Uncommon", legality: "Legal",
      effect: "The vehicle gains the Enclosed trait and loses Open-Frame. Handling is reduced by 1." },
    { name: "Cut-Down",           price: 200,  fits: "Any",                availability: "Common",   legality: "Legal",
      effect: "The vehicle gains the Open-Frame trait and loses Enclosed." }
  ]
};

/* derived, so a Tier or upkeep edit can never desync the two numbers the book
   defines as formulas: list price is twenty weeks of upkeep, slots are 1 + Tier */
EN.vehicles.profiles.forEach(function (v) {
  v.upkeep = v.fuel + v.reserve;
  v.listPrice = v.upkeep * 20;
  v.modSlots = 1 + v.tier;
});
EN.vehicles.byName = {};
EN.vehicles.profiles.forEach(function (v) { EN.vehicles.byName[v.name] = v; });

/* mods get a stable key derived from the name, and a Fits matcher. "Any" fits
   everything; otherwise the entry names one or more chassis categories, and a
   profile matches when its category starts with one of them ("Industrial"
   matches the "Industrial / Mechs" category). */
EN.vehicles.byKey = {};
EN.vehicles.mods.forEach(function (m) {
  m.key = m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  EN.vehicles.byKey[m.key] = m;
});
EN.vehicles.modFits = function (mod, profile) {
  if (!mod || !profile) return false;
  var fits = String(mod.fits || "Any");
  if (/^any$/i.test(fits)) return true;
  return fits.split(",").map(function (f) { return f.trim(); }).some(function (f) {
    return f && profile.category.indexOf(f) === 0;
  });
};
