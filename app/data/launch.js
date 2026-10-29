/* ===========================================================================
   ELYSIUM NIGHTS - Launch holds (16 October 2026 handoff), and the
   Supplemental content setting (28 October 2026)
   One file, three switches. Each hold flips back in one line:

     holds.lineup        the core lineup the Player's Handbook prints: one
                         lineage per species, two subclasses per class, 21
                         Talents, 10 Backgrounds. Everything else is gated:
                         `companion` lists what the Freelancer's Companion
                         (EN1101, a supplemental book) prints, offered only
                         while the device's Supplemental content setting is
                         on (supplemental() below); `held` lists anything in
                         neither book, which stays held.
     holds.availability  rarity: the Handbook no longer prints Availability
                         (Common, Uncommon, Rare, Custom, Prototype, or the
                         Mystech tiers), so the app stops displaying it.
     holds.toolkit       gear the Player's Handbook doesn't print: every catalog
                         row outside the author's Player's Handbook gear list
                         (16 October) and the class gear its class chapters name.
                         An allow-list: a row the list prints is shown, anything
                         else is held (Signature Weapons, the Mystech gear, the
                         Blackware tier and the other Toolkit rows among them).

   HIDE, DON'T DELETE. Every list below names keys or catalog names; nothing
   here filters or splices EN.species, EN.classes[c].subclasses, EN.talents,
   EN.backgrounds, the gear catalogs or the engine pools. Those arrays stay
   whole, because the engine and the store resolve a saved character against
   them (store.js nulls a saved subclass that is missing from the live array),
   so a character built on a held option loads, derives and renders exactly as
   before. Only the LISTING layer reads this file: pickers, the market, the
   Blueprints, the install pickers and the Codex. Each picker uses offer(),
   which keeps the character's own current pick visible (with a marker,
   EN.ui.heldChip: COMPANION for Freelancer's Companion content, HELD for
   content in neither book) and hides only the unselected held options.

   Loaded right after data/rules.js and before data/species.js, so it can read
   nothing from the other data files at load time. Every function that needs
   the catalogs (the Signature names, the Part / Mod name lookups, the cipher
   tiers) reads them when it is called, and keeps what it read only once every
   data file it reads has loaded.
   =========================================================================== */
window.EN = window.EN || {};

EN.launch = (function () {
  var holds = { lineup: true, availability: true, toolkit: true };

  /* ---- Supplemental content: a device setting, like the skin ----------------
     Off by default (core Handbook only). Stored per device, never on a character
     and never in an export: it decides what the pickers OFFER, not what a saved
     character may keep. Settings (js/settings.js) flips it. */
  var SUPP_KEY = "en_supplemental_v1";
  function supplemental() { try { return localStorage.getItem(SUPP_KEY) === "1"; } catch (e) { return false; } }
  function setSupplemental(on) { try { localStorage.setItem(SUPP_KEY, on ? "1" : "0"); } catch (e) {} }

  /* ---- GM controls: a device setting (29 Oct 2026) ---------------------------
     Off by default: a device only shows them once someone turns them on. On shows the controls that stand in for a GM's
     call at the table: an item's GM -1 Load, and the Five-Finger Supply storefront (free, looted
     gear). Off hides both, for a device a player uses on their own. A GM -1 already made keeps
     its effect either way; only the control to make or undo it is hidden. */
  var GM_KEY = "en_gm_controls_v1";
  function gmControls() { try { return localStorage.getItem(GM_KEY) === "1"; } catch (e) { return false; } }
  function setGmControls(on) { try { localStorage.setItem(GM_KEY, on ? "1" : "0"); } catch (e) {} }
  /* Each control can also be switched on its own (30 Oct 2026). The master switch above gates
     them all; under it, each is on until someone turns it off. gmControl(key) is the one test
     a view asks: both the master and that control on. */
  var GM_ITEMS_KEY = "en_gm_control_items_v1";
  var GM_CONTROLS = [
    { key: "loadLower", name: "GM -1 Load",
      hint: "A GM -1 button on each item's Load in the Stash, for gear the GM rules sits lighter. A Load already lowered stays lowered when this is off." },
    { key: "fiveFinger", name: "Five-Finger Supply",
      hint: "The Five-Finger Supply storefront in the Gray Market, for looted gear the GM hands out." }
  ];
  function gmItemMap() { try { var m = JSON.parse(localStorage.getItem(GM_ITEMS_KEY) || "{}"); return m && typeof m === "object" ? m : {}; } catch (e) { return {}; } }
  function gmItem(key) { return gmItemMap()[key] !== false; }
  function setGmItem(key, on) { var m = gmItemMap(); m[key] = !!on; try { localStorage.setItem(GM_ITEMS_KEY, JSON.stringify(m)); } catch (e) {} }
  function gmControl(key) { return gmControls() && gmItem(key); }

  /* ---- Optional rules: device settings (29 Oct 2026) -------------------------
     A table can switch a rule off. Each is on by default, the book as written. Stored as one
     map on the device, never on a character: turning a rule off changes what the sheet shows
     and computes, not what a record holds, so turning it back on restores everything.
       encumbrance: Load, Loadout, the Load Budget, Packed It and the Encumbered state from
         carried gear. Off, none of it is shown or applied; a Haul (a body, a crate) still is.
       weaponJam: the book's optional Weapon Jam rule (PHB Gear Traits, Firing Modes). Off, the
         Codex leaves it out of Firing Modes.
       morale: the optional Morale rule (GM Toolkit, Threat Conventions). Off, the GM Codex
         leaves it out, and Ending Fights and the encounter tools drop their links to it. */
  var RULES_KEY = "en_optional_rules_v1";
  var OPTIONAL_RULES = [
    { key: "encumbrance", name: "Encumbrance",
      on: "On: Load, your declared Loadout and its Load Budget, Packed It, and the Encumbered state from carried gear are all tracked and applied.",
      off: "Off: gear has no Load, there is no Loadout or Load Budget, and carrying never makes you Encumbered. Hauling a body or a crate still slows you." },
    { key: "weaponJam", name: "Weapon Jam",
      on: "On: the Codex prints the optional Weapon Jam rule under Firing Modes. On a Natural 1 with a firearm, the GM may rule the weapon Jams.",
      off: "Off: firearms never Jam, and the Codex leaves the Weapon Jam rule out of Firing Modes." },
    { key: "morale", name: "Morale",
      on: "On: the GM Codex prints the optional Morale rule under Threat Conventions, and Ending Fights and the encounter tools link to it.",
      off: "Off: Hostiles fight until the fight is settled some other way. The GM Codex leaves Morale out, and nothing links to it." }
  ];
  function ruleMap() { try { var m = JSON.parse(localStorage.getItem(RULES_KEY) || "{}"); return m && typeof m === "object" ? m : {}; } catch (e) { return {}; } }
  function rule(key) { var m = ruleMap(); return m[key] !== false; }
  function setRule(key, on) { var m = ruleMap(); m[key] = !!on; try { localStorage.setItem(RULES_KEY, JSON.stringify(m)); } catch (e) {} }

  /* ---- the core lineup: what is gated (everything else is the Handbook's) ----
     Core lineages: freeborn, floral, laborframes, ryn, grinling.
     Launch subclasses: gridweaver, burner, juggernaut, reaver, the_suit,
       the_grifter, the_vanguard, the_deadeye, smuggler, wildcard, harmonist,
       sourcerer, the_lifeline, the_toxicologist.
     Core Talents (21): street-scrapper, heavy-weapon-specialist, zeroed-in,
       sidearm-gunslinger, cross-discipline-tactic, combat-splicer,
       lockdown-specialist, parallel-processing, junk-tinkerer,
       resonance-dabbler, resonance-weaver, hardened-survivor,
       cybernetic-surge, asphalt-rider, breach-charger, trauma-medic,
       cutting-agent, faceless-persona, shadow-operative, crew-commander,
       cold-reader (crowd-reader before the rename).
     Core Backgrounds (10): badge, boardroom-exile, cipher-punk, courier,
       dealer, ganger, gearhead, glow-idol, minimum-wage-mage, street-doc.

     The Freelancer's Companion prints every option the 16 October hold
     listed: "ten new Lineages, eight new subclasses, ten Backgrounds, and
     forty-two Talents", plus Culinary Tools, a new Tool Category (its kit is
     the Street Kitchen Kit). So `companion` carries the whole old hold, and
     `held` (neither book) is empty until something needs it. */
  var companion = {
    // A held lineage takes its Lineage Evolution features with it: the
    // evolution pickers are scoped to the character's own lineage, so they
    // need no list of their own. NextGen's Open Architecture rides along.
    lineage: ["nextgen", "phasebound", "arboreal", "mycelial", "durabodies",
              "lifelikes", "hulsk", "skarn", "cinder-heart", "harbinger"],
    // Their Subclass Extras rows and the Icon Alternate Pick are looked up by
    // ch.subclass, so they leave the picker with the subclass.
    subclass: ["rigger", "arsenal", "the_fixer", "the_headhunter", "shiv",
               "icon", "kensei", "the_ripper"],
    talent: [
      // Combat & Weapon Mastery
      "akimbo-specialist", "armor-piercing-specialist", "arsenal-adept",
      "close-quarters-brawler", "concussive-striker", "heavy-handed",
      "laceration-expert", "melee-mastery", "ricochet-shot", "staff-spear-master",
      // Tactics & Hybrid Fighting
      "blade-weaver", "glitch-breaker", "phalanx-operator", "signal-sniper",
      "tactical-operative",
      // Tech & #GRID Operations
      "augment-specialist", "gridrunners-reflexes", "hardware-harmonizer",
      "neural-backup", "pain-editor", "script-archivist", "script-kiddie",
      // The Flow & Resonance
      "echo-sighted", "resonance-optimizer", "resonant-recovery", "static-grounding",
      // Armor & Resilience
      "cyber-reinforced-vitality", "siege-plating-expert", "tactical-harness-expert",
      "unbreakable",
      // Mobility & Traversal
      "blitz-logic", "parkour-runner", "speed-freak",
      // Skills, Social & Utility
      "fate-bender", "field-specialist", "hyper-aware", "hyper-vigilant",
      "photographic-memory", "ruin-crawler", "spatial-delivery", "street-chef",
      "undercity-survivor"
    ],
    background: ["click-chaser", "homesteader", "hired-gun", "outrider", "rocker",
                 "spacer", "spotlight-survivor", "starhuffer", "wageslave", "whitecoat"],
    // Culinary Tools: a Gear Proficiency (EN.rules.gear.tools) and its kit, a catalog row
    tool: ["Culinary Tools"],
    item: ["Street Kitchen Kit"]
  };
  // in neither book: held whatever the setting says (same kinds as `companion`)
  var held = { lineage: [], subclass: [], talent: [], background: [], tool: [] };

  /* ---- the Player's Handbook gear list (round 2, 16 October 2026) ---------
     The listings SHOW every catalog row the Player's Handbook prints, plus the class gear
     below, and HOLD every other catalog row. This one allow-list replaces the per-kind hold
     lists the file used to carry, and it selects the same rows. Held rows are the Heavy and
     Launcher weapons the Handbook no longer prints, the Signature Weapons chapter, the Mystech
     gear, the Blackware and Prototype tiers, and the tools and kits the Handbook leaves out.
     Most are printed in the Game Master's Toolkit; three are in neither book (Breaching
     Charge, Smart-Sight + Targeting Suite, Hypercare Contract). The one Freelancer's
     Companion row (the Street Kitchen Kit, `companion.item`) is not held by this list: it
     follows the Supplemental content setting instead (isToolkit below).

     `phb` is the author's phb-gear-items-2026-10-16.txt: all 322 rows of the Handbook's gear
     tables, in book spelling, under the book's own section headings. A row that names no
     catalog item (a safehouse upgrade, a Hypercare tier, a parking row, a cyberware tier name)
     matches nothing and costs nothing. Two app spellings differ from the book's, and
     bookName() reads them as the book's: "Field Kit Trauma Rig [0]" is the Handbook's
     "Field Kit [0]", and "Street Bike (Lease)" is the Street Bike. */
  var toolkit = {
    phb: [
      // Economy and Rewards (10)
      "Secure Locks and Cameras", "Hidden Storage", "Medical Nook", "Drone Bench", "Ritual Corner",
      "Signal Masking", "Patchline (Tier 1)", "Rapid Extract (Tier 2)", "Blackglass Priority (Tier 3)",
      "Corporate Platinum (Tier 4)",
      // Melee Weapons (22)
      "Baton", "Dagger", "Hammer", "Hatchet", "Knife", "Knuckles", "Quarterstaff", "Shock Gloves",
      "Snap-Blades", "Spear", "Shock Baton", "Axe", "Greatsword", "Halberd", "Katana", "Longsword", "Maul",
      "Rapier", "Saber", "Shortsword", "Warhammer", "Whip",
      // Ranged Weapons (30)
      "Dart Gun", "Ghost Gun", "Machine Pistol", "Magnum Pistol", "Pistol", "Pocket Pistol", "Revolver",
      "Taser", "Assault Rifle", "Battle Rifle", "Carbine", "Combat Shotgun", "Dart Rifle", "Marksman Rifle",
      "Shotgun", "SMG", "Heavy Machinegun", "Light Machinegun", "Medium Machinegun", "Compound Bow",
      "Crossbow", "Hand Crossbow", "Recurve Bow", "Slingshot", "Grenade Launcher", "EMP Grenade", "Flashbang",
      "Frag Grenade Mk I", "Frag Grenade Mk II", "Smoke Grenade",
      // Ammo (18)
      "Pistol Ammo", "Rifle Ammo", "Shotgun Shells", "Arrows and Bolts", "Taser Cartridges", "Darts",
      "Machinegun Belt", "Grenade Shells", "Armor Piercing Rounds", "EMP Rounds", "Hollow Point Rounds",
      "Incendiary Rounds", "Neural Disruptor Darts", "Rubber Rounds", "Shock Rounds", "Toxin Rounds",
      "Tracer Rounds", "Whisper Rounds",
      // Specialty Launcher Shells (5)
      "Concussion Shell", "Incendiary Shell", "Gas Shell", "Smoke Shell", "EMP Shell",
      // Weapon Customization (56)
      "Monoedge", "Weighted Head", "Nonlethal Conversion", "Serrated Edge", "Flanged Head", "Inertia Core",
      "Shock Core", "Plasma Core", "Cryo Core", "Balanced Hilt", "Extended Shaft", "Counterweight Pommel",
      "Pared Hilt", "Tactical Wrap", "Bracing Spike", "Breakdown Frame", "Quick-Release Tether",
      "Anti-Theft Module", "Defensive Guard", "Anti-Scanner Coating", "Reflex Sight", "Combat Scope",
      "Thermal Optic", "Smart-Sight", "Match Barrel", "Shotgun Choke", "Heavy Barrel", "Bullpup Conversion",
      "Vented Barrel", "Match Trigger Group", "Anti-Jam Action", "Burst Fire Receiver", "Hair Trigger",
      "Folding Stock", "Recoil Stock", "Quick-Draw Grip", "Marksman Stock", "Suppressor", "Compensator",
      "Weapon Light", "Case Catcher", "Target Spotter", "Foregrip", "Bipod", "Bayonet", "Under-Barrel Mount",
      "Low-Light Sensor Suite", "High-Tension Assembly", "Composite Limbs", "Whisper Limbs", "Voltaic Limbs",
      "Cam Tuning", "Cocking Aid", "Magazine Cradle", "Reinforced Cam", "Tracker Cam",
      // Armor and Defensive Gear (28)
      "SkinPlan Daywear", "Liner Mesh", "Hypeplate", "Courier Shell", "Slip Undervest", "Adaptive Soft Suit",
      "Composite Kit", "City Carrier", "Gig Harness", "Enforcer Rig", "Operator Suit", "Vanguard Plate",
      "Sentinel Issue", "Scrap Plate", "Foundry Shell", "Riot Wall", "Breaker Harness", "Anvil Frame",
      "Laborframe Exorig", "Bailiff Rig", "Scrap Shield", "Ballistic Bracer", "Riot Shield",
      "Sentinel Barrier", "Ballistic Bulwark", "Hard-Light Barrier", "Scrap Ward", "Resonance Coil",
      // Armor Customization (19)
      "Trauma Plates", "Ablative Coating", "Reactive Plating", "Rebreather Liner", "Thermal Regulation Weave",
      "Acoustic Baffles", "Signature Damper", "Threat-Detection HUD", "Smartlink Relay", "Load Distributor",
      "Drop Dampeners", "Gecko Grips", "Servo Weave", "Vitals Beacon", "Coagulant Mesh",
      "Trauma Stim Injector", "Faraday Lining", "Self-Seal Nanopaste", "Sentinel Active Defense",
      // Vehicle Ownership (4)
      "Street parking or low-security rack", "Secured lot or garage",
      "Hidden chop garage or off-books storage", "Protected hangar or private docking",
      // Vehicle Customization (10)
      "Plate Kit", "Run-Flat Wheels", "Smoke Discharger", "Ram Bar", "Cargo Winch", "Hardpoint Mount",
      "Ghost Transponder", "Node Retrofit", "Cabin Kit", "Cut-Down",
      // Skill Kits (22)
      "Basic Medkit", "Advanced Medkit", "Street Doc Bag", "Engineering Toolkit", "Field Repair Case",
      "Portable Fabrication Rig", "Smartdeck Peripheral Kit", "Codebreaker Suite", "Signal Trace Scanner",
      "Lockpick Set", "Urban Infiltration Rig", "Forensics Kit", "Survey Scanner", "Climbing Gear",
      "Navigation and Survival Pack", "Tracker's Kit", "Custody and Control Kit", "Field Recording Kit",
      "Disguise and Styling Kit", "Venue Kit", "Document and Contract Kit", "Rite Calibration Kit",
      // Field Devices and Gadgets (41)
      "Multi Tool", "Crowbar", "Fire Extinguisher", "Rebreather", "Cargo Mule", "Backpack", "Fanny Pack",
      "Sheath", "Swift Draw Holster", "Utility Belt", "Flashlight", "Lighter", "Echolight Baton",
      "Bug Scanner", "Metal Detector", "Throwcam", "Halo Drone", "Whisperlink Earpiece", "Walkie Talkie",
      "Wireless Transceiver", "#GRIDline Cable", "#GRIDline Lumen Cable", "Titan Tether", "Grapple Launcher",
      "Ziprunner", "Towrunner", "Autopicker", "Tag Eraser", "Portable Door Alarm Kit", "Motion Sensor Pod",
      "Flex Cuffs", "Standard Cuffs", "Flux Gel Sprayer", "AR Optics", "Bio Monitor Band", "Respirator Mask",
      "Mag Boots", "Gravshift Anklets", "Streaming Rig", "Hazmat Suit", "Scene Scrubber",
      // Consumables (15)
      "Vita-Pop", "Trauma Slap Patch", "Med Foam Canister", "Detox Patch", "Nightwatch Tablets",
      "Emergency Sealant Foam", "Thermite Slug", "Basic Rations", "Water Purification Tabs", "Glimmer Stick",
      "Data Drive", "Faraday Pouch", "#PRINT", "Fake License Portfolio", "Ritual Reagent Pouch",
      // Flow Tonics and Resonant Devices (4)
      "Flow Tonic Vial", "Channel Cleanse Tonic", "Resonant Anchor Charm", "Flow Lantern",
      // Trauma Rigs (6)
      "Field Kit [0]", "Clinic Grade [1]", "Trauma Grade [2]", "Combat Grade [3]", "Ward Response [4]",
      "Black Clinic [5]",
      // Cybernetics (3)
      "Streetware", "Brandware", "Blackware",
      // Neural Cyberware (6)
      "Streetware Datajack", "Brandware Datajack", "Streetware Cyberoptics", "Brandware Cyberoptics",
      "Streetware Reflex Booster", "Brandware Reflex Booster",
      // Core Cyberware (6)
      "Streetware Synthetic Heart", "Brandware Synthetic Heart", "Streetware Biomonitor",
      "Brandware Biomonitor", "Streetware Toxin Filter", "Brandware Toxin Filter",
      // Integument Cyberware (4)
      "Streetware Subdermal Armor", "Brandware Subdermal Armor", "Streetware Reinforced Skeleton",
      "Brandware Reinforced Skeleton",
      // Arms Cyberware (4)
      "Streetware Cyberarm", "Brandware Cyberarm", "Streetware Hand Razors", "Brandware Hand Razors",
      // Legs Cyberware (4)
      "Streetware Cyberlegs", "Brandware Cyberlegs", "Streetware Spring Joints", "Brandware Spring Joints",
      // Hardware Cyberware (5)
      "Streetware Smartlink", "Brandware Smartlink", "Brandware Subdermal Comm", "Streetware Skinweave",
      "Brandware Skinweave"
    ],
    // class gear, printed in the #GRID chapter (Equipment, and the Cipher Library) for the
    // Codebreaker's Smartdeck and Repertoire: the Smartdeck tiers, the B&E Buddy tiers and the
    // nine Smartdeck Hardware Modifications, and the Burner Relays. The Stitcher's Trauma Rigs are rows of `phb` above.
    classGear: ["Standard Smartdeck", "Improved Smartdeck", "Advanced Smartdeck", "Premium Smartdeck",
                "Elite Smartdeck", "Apex Smartdeck",
                "Standard B&E Buddy", "Improved B&E Buddy", "Advanced B&E Buddy",
                // the six Burner Relay tiers (PHB Equipment, Burner Relays; sold since 29 Oct 2026)
                "Standard Burner Relay", "Improved Burner Relay", "Advanced Burner Relay", "Premium Burner Relay",
                "Elite Burner Relay", "Apex Burner Relay",
                "Reinforced Heatsinks", "Sweep Suite Plug-In", "Burn Notice Module", "ICE-Breaker Algorithm",
                "Overclocked Coprocessor", "Trigger Cache", "Redline Lattice", "Crown Spike Array", "Predator Stack"],
    // the cipher tiers: every acquirable cipher of these Complexities (EN.grid.ciphers, the
    // Cipher Library; the free Complexity 0 suite is not a catalog row)
    cipherComplexity: [1, 2, 3, 4, 5],
    // the seven vehicle chassis. The author's list has no chassis rows, but the Handbook prints
    // all seven in Vehicles and Chases (Vehicle Profiles) and, priced, in Vehicle Ownership
    // (Buying a Vehicle), so they stay shown. Remove a name here to hold it.
    chassis: ["Street Bike", "Armored Sedan", "Cargo Hauler", "Hydrofoil", "Corporate VTOL",
              "Riot Suppression Mech", "Light Shuttle"],
    // the Mystech Availability scale: kept out of any Availability filter if the Availability
    // hold is ever lifted first
    availability: ["Iconic", "Legendary", "Mythical", "Artifact"],
    // the Signature Weapons chapter is held whole: every name in EN.gearCatalog.signature
    // (weapons and munitions). Three callers read this flag directly.
    signature: true
  };

  function has(list, v) { return !!list && list.indexOf(v) !== -1; }

  /* A Talent may still arrive by display name on a save the migration has not
     normalised yet; resolve it to its key against the live array. */
  function talentKey(k) {
    if (k == null) return k;
    var all = EN.talents || [];
    for (var i = 0; i < all.length; i++) if (all[i].name === k) return all[i].key;
    return k;
  }

  function listed(list, kind, key) {
    if (!list || key == null || key === "") return false;
    if (has(list, key)) return true;
    return kind === "talent" && has(list, talentKey(key));
  }

  /* isCompanion(kind, key): true when the Freelancer's Companion prints it, whatever the
     setting says (the COMPANION chip cites the book). kind is "lineage", "subclass",
     "talent", "background", "tool" (a Tool Category) or "item" (a catalog name). */
  function isCompanion(kind, key) { return listed(companion[kind], kind, key); }

  /* isHeld(kind, key): kind is "lineage", "subclass", "talent", "background" or
     "tool". True only while holds.lineup is on and the key is in neither book, or
     is Companion content while the Supplemental content setting is off. */
  function isHeld(kind, key) {
    if (!holds.lineup || key == null || key === "") return false;
    if (listed(held[kind], kind, key)) return true;
    return !supplemental() && isCompanion(kind, key);
  }

  /* source(kind, key): "companion" for Freelancer's Companion content, "held" for content
     in neither book while holds.lineup is on, else null (the Player's Handbook). */
  function source(kind, key) {
    if (isCompanion(kind, key)) return "companion";
    return holds.lineup && listed(held[kind], kind, key) ? "held" : null;
  }

  /* offer(kind, key, current): the one rule every picker uses. A held option
     is offered only when it is the character's current pick. `current` may be
     a single key or an array of keys (a Talent owned in another slot). */
  function offer(kind, key, current) {
    if (!isHeld(kind, key)) return true;
    if (current == null) return false;
    if (Object.prototype.toString.call(current) === "[object Array]") {
      for (var i = 0; i < current.length; i++) if (current[i] === key || (kind === "talent" && talentKey(current[i]) === key)) return true;
      return false;
    }
    return current === key || (kind === "talent" && talentKey(current) === talentKey(key));
  }

  function signatureNames() {
    var s = EN.gearCatalog && EN.gearCatalog.signature;
    if (!s) return [];
    return [].concat(s.items || [], s.munitions || []).map(function (i) { return i.name; });
  }

  /* The app's name for a row, read as the Handbook spells it: "Field Kit Trauma Rig [0]" is
     "Field Kit [0]", and a leased chassis ("Street Bike (Lease)") is the chassis. */
  function bookName(n) { return String(n).replace(/ Trauma Rig (\[\d\])$/, " $1").replace(/ \(Lease\)$/, ""); }

  /* The shown set and the catalog name set are built on first use and kept only once every data
     file they read has loaded: data/grid.js adds the ciphers and the Hardware Mods to the Tools
     catalog, and data/vehicles.js loads after it. A call made while the data files are still
     loading is answered from what exists and leaves no partial set behind. */
  var _shown = null, _catalog = null;
  function dataReady() {
    return !!(EN.grid && EN.grid.ciphers && EN.gearCatalog && EN.gearCatalog.tools && EN.weaponParts &&
              EN.armorMods && EN.vehicles && EN.vehicles.profiles && EN.cyberware && EN.cyberware.items);
  }
  function shownSet() {
    if (_shown) return _shown;
    var s = {};
    [toolkit.phb, toolkit.classGear, toolkit.chassis].forEach(function (l) { (l || []).forEach(function (n) { s[n] = true; }); });
    ((EN.grid && EN.grid.ciphers) || []).forEach(function (c) { if (has(toolkit.cipherComplexity, c.cx)) s[c.name] = true; });
    if (dataReady()) _shown = s;
    return s;
  }
  // true when the Handbook's gear list (or the class gear and the chassis) prints this row
  function inBook(name) { return !!shownSet()[bookName(name)]; }

  // every catalog row name: a name outside every catalog (custom gear) is never held
  function catalogSet() {
    if (_catalog) return _catalog;
    var g = EN.gearCatalog || {}, s = {};
    [g.melee && g.melee.items, g.ranged && g.ranged.items, g.signature && g.signature.items,
     g.signature && g.signature.munitions, g.ammo && g.ammo.items, g.armor && g.armor.items, g.tools && g.tools.items,
     EN.weaponParts && EN.weaponParts.parts, EN.armorMods && EN.armorMods.mods,
     EN.vehicles && EN.vehicles.mods, EN.vehicles && EN.vehicles.profiles].forEach(function (l) {
      (l || []).forEach(function (i) { if (i && i.name) s[i.name] = true; });
    });
    if (dataReady()) _catalog = s;
    return s;
  }
  function catalogHas(name) { var s = catalogSet(); return !!(s[name] || s[bookName(name)]); }

  function byKey(kind, key) {
    var src = kind === "part" ? EN.weaponParts : kind === "armorMod" ? EN.armorMods : EN.vehicles;
    return (src && src.byKey && src.byKey[key]) || null;
  }
  function cyberItem(key) {
    var all = (EN.cyberware && EN.cyberware.items) || [];
    for (var i = 0; i < all.length; i++) if (all[i].key === key) return all[i];
    return null;
  }
  // the Handbook prints an implant as "<Tier> <Implant>": Streetware Datajack, Brandware Datajack
  function cyberInBook(it, tier) { return inBook(tier + " " + it.short); }

  /* isToolkit(kind, id), true only while holds.toolkit is on and the Handbook does not print it:
       "item"        a catalog name (any catalog, Parts and Mods included; a name outside
                     every catalog is never held)
       "part", "armorMod", "vehicleMod"   a key, judged by its catalog row's name
       "cyberware"   an implant key: held when the Handbook prints it at no tier
       "cyberTier"   a tier name: held when the Handbook prints no implant at that tier
                     (Blackware, Prototype)
       "availability" an Availability word on the Mystech scale
       "signature"   true for any name in EN.gearCatalog.signature */
  function isToolkit(kind, id) {
    if (!holds.toolkit || id == null || id === "") return false;
    if (kind === "availability") return has(toolkit.availability, id);
    if (kind === "signature") return !!toolkit.signature && has(signatureNames(), id) && !inBook(id);
    if (kind === "cyberware") {
      var it = cyberItem(id);
      return !!it && !(it.tiers || []).some(function (t) { return cyberInBook(it, t.tier); });
    }
    if (kind === "cyberTier") {
      return !((EN.cyberware && EN.cyberware.items) || []).some(function (c) {
        return (c.tiers || []).some(function (t) { return t.tier === id && cyberInBook(c, id); });
      });
    }
    if (kind === "part" || kind === "armorMod" || kind === "vehicleMod") { var row = byKey(kind, id); return !!row && !inBook(row.name); }
    // a Freelancer's Companion row (the Street Kitchen Kit) follows the Supplemental setting
    if (kind === "item" && isCompanion("item", bookName(id))) return !supplemental();
    if (kind === "item") return catalogHas(id) && !inBook(id);
    return false;
  }

  /* isToolkitItem(it): the same test for a catalog ITEM object as the market builds it
     (inventory.js partAsItem / armorModAsItem / vehicleModAsItem carry partKey or modKey; a
     cyberware listing carries cyberKey and tier; everything else is matched by name). */
  function isToolkitItem(it) {
    if (!holds.toolkit || !it) return false;
    if (it.partKey) return isToolkit("part", it.partKey);
    if (it.armorMod && it.modKey) return isToolkit("armorMod", it.modKey);
    if (it.vehicleMod && it.modKey) return isToolkit("vehicleMod", it.modKey);
    // a market cyber listing is one tier of one implant: judged against the Handbook's exact row
    if (it.cyber) { var c = cyberItem(it.cyberKey); return !c || !cyberInBook(c, it.tier); }
    return isToolkit("item", it.name);
  }

  /* showAvailability(): false while rarity is held. Display only: the data
     stays, and rule logic that reads it (the Register markup, the crafting
     Project tier) keeps reading it. */
  function showAvailability() { return !holds.availability; }

  return { holds: holds, held: held, companion: companion, toolkit: toolkit,
           supplemental: supplemental, setSupplemental: setSupplemental,
           gmControls: gmControls, setGmControls: setGmControls,
           gmControlList: GM_CONTROLS, gmItem: gmItem, setGmItem: setGmItem, gmControl: gmControl,
           optionalRules: OPTIONAL_RULES, rule: rule, setRule: setRule,
           isHeld: isHeld, isCompanion: isCompanion, source: source, offer: offer,
           isToolkit: isToolkit, isToolkitItem: isToolkitItem,
           showAvailability: showAvailability };
})();
