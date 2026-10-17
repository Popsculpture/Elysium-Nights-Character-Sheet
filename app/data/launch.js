/* ===========================================================================
   ELYSIUM NIGHTS - Launch holds (16 October 2026 handoff)
   One file, three switches. Each hold flips back in one line:

     holds.lineup        the launch lineup: one lineage per species, two
                         subclasses per class, 21 Talents, 10 Backgrounds.
                         Everything listed under `held` is held for a later
                         release.
     holds.availability  rarity: the Handbook no longer prints Availability
                         (Common, Uncommon, Rare, Custom, Prototype, or the
                         Mystech tiers), so the app stops displaying it.
     holds.toolkit       gear that moved to the Game Master's Toolkit: the
                         12 October gear split, the Signature Weapons chapter,
                         the Mystech Cyberware section and the Mystech tiers,
                         the Blackware tier, and the Rare tools and kits.

   HIDE, DON'T DELETE. Every list below names keys or catalog names; nothing
   here filters or splices EN.species, EN.classes[c].subclasses, EN.talents,
   EN.backgrounds, the gear catalogs or the engine pools. Those arrays stay
   whole, because the engine and the store resolve a saved character against
   them (store.js nulls a saved subclass that is missing from the live array),
   so a character built on a held option loads, derives and renders exactly as
   before. Only the LISTING layer reads this file: pickers, the market, the
   Blueprints, the install pickers and the Codex. Each picker uses offer(),
   which keeps the character's own current pick visible (with a HELD marker,
   EN.ui.heldChip) and hides only the unselected held options.

   Loaded right after data/rules.js and before data/species.js, so it can read
   nothing from the other data files at load time. Every function that needs
   the catalogs (the Signature names, the Part / Mod name lookups) reads them
   when it is called.
   =========================================================================== */
window.EN = window.EN || {};

EN.launch = (function () {
  var holds = { lineup: true, availability: true, toolkit: true };

  /* ---- the launch lineup: what is HELD (everything else launches) -------
     Launch lineages: freeborn, floral, laborframes, ryn, grinling.
     Launch subclasses: gridweaver, burner, juggernaut, reaver, the_suit,
       the_grifter, the_vanguard, the_deadeye, smuggler, wildcard, harmonist,
       sourcerer, the_lifeline, the_toxicologist.
     Launch Talents (21): street-scrapper, heavy-weapon-specialist, zeroed-in,
       sidearm-gunslinger, cross-discipline-tactic, combat-splicer,
       lockdown-specialist, parallel-processing, junk-tinkerer,
       resonance-dabbler, resonance-weaver, hardened-survivor,
       cybernetic-surge, asphalt-rider, breach-charger, trauma-medic,
       cutting-agent, faceless-persona, shadow-operative, crew-commander,
       cold-reader (crowd-reader before the rename).
     Launch Backgrounds (10): badge, boardroom-exile, cipher-punk, courier,
       dealer, ganger, gearhead, glow-idol, minimum-wage-mage, street-doc. */
  var held = {
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
                 "spacer", "spotlight-survivor", "starhuffer", "wageslave", "whitecoat"]
  };

  /* ---- moved to the Game Master's Toolkit -------------------------------- */
  var toolkit = {
    // Catalog NAMES (gear is stored and looked up by name).
    item: [
      // the 12 October gear split: Heavy and Launcher weapons
      "Assault Cannon", "High-Precision Cannon", "Rotary Cannon", "Missile Launcher", "Rocket Launcher",
      // rounds and shells, plus the Cannon Rounds, Rocket and Missile rows that go with their weapons
      "Explosive Rounds", "Smart Rounds", "Spike Rounds", "Hex-Etched Rounds", "Resonant Rounds",
      "Genesis Rounds", "Thermobaric Shell", "Cannon Rounds", "Rocket", "Missile",
      // armor and foci
      "Bastion Plate", "Warframe Shell", "Veilskin", "Resonant Carapace", "Aegis Shroud",
      "Reliquary Shell", "Saint's Knot", "Hex Lattice Projector", "Martyr's Halo",
      /* Rare tools and kits (author's decision 7): every Rare row in the Tools
         catalog EXCEPT the four a class depends on (Codebreaker Suite, Thermite
         Slug, Fake License Portfolio, Flux Gel Sprayer) and the class
         progression gear (the Premium, Elite and Apex Smartdecks, the Advanced
         B&E Buddy, the Ward Response and Black Clinic Trauma Rigs, the Rare
         Smartdeck Hardware Mods and the Complexity 3 to 5 ciphers). That is 37
         rows against the handoff's "27"; the report carries the difference. */
      // kits
      "Surgical Instruments", "Demolition Kit", "Vault Bypass Kit", "Flow Survey Pack",
      "Flow Artificer Kit", "Elemental Harness Rig",
      // devices
      "Feral Drone Swarm Case", "Whisperlink Comms Tap", "Covert Ziprunner", "Maglock Passkey",
      "Maglock Sequencer", "Latchscrambler", "Proxyprint Fabricator", "Camera Neutralizer",
      "Signal Spoofer", "Squealer Beacon", "Null Veil Projector", "Mystech Cuffs", "Neurocut Jack",
      "Adaptive Camo Cloak", "Vital Sync Bracer", "Tempest Core",
      // consumables and services
      "Combat Stim Pack", "Adrenaline Amp", "Breaching Charge", "Breach Charge", "Hypercare Contract",
      // tonics and resonant tools
      "Focus Draught", "Attunement Draught", "Resonant Shield Elixir", "Flow Surge Ampoule",
      "Overchannel Amp Shot", "Channel Stabilizer Band", "Flow Ward Projector",
      "Resonant Echo Recorder", "Tuning Prism Focus", "Scripted Invocation Tab"
    ],
    // weapon Part keys (EN.weaponParts); the combined Smart-Sight + Targeting
    // Suite entry moves with the Targeting Suite it contains
    part: ["siege-head", "pulse-core", "flow-core", "targeting-suite", "full-auto-receiver",
           "powered-assist-grip", "flow-etched-limbs", "smart-sight-targeting-suite"],
    // armor Mod keys (EN.armorMods)
    armorMod: ["chameleon-weave", "reactive-countermeasures", "resonance-dampener",
               "echo-shroud", "ward-amplifier", "grounding-lattice"],
    // vehicle Mod keys (EN.vehicles.mods)
    vehicleMod: ["ejector-seat", "overdrive-injector", "chameleon-coat"],
    // the Mystech Cyberware section, whole (every mystech:true implant,
    // the Convergence Engine among them)
    cyberware: ["disruption", "resonanceCrown", "feedbackCore", "convergence", "anomalySensor"],
    // the Blackware tier, and Prototype as one of "the Mystech tiers" (decision 8)
    cyberTier: ["Blackware", "Prototype"],
    // the other half of "the Mystech tiers": the Iconic to Artifact
    // Availability scale. Hidden with Availability anyway; listed so the scale
    // stays out of any Availability filter if that hold is ever lifted first.
    availability: ["Iconic", "Legendary", "Mythical", "Artifact"],
    // the Signature Weapons chapter, whole: every name in
    // EN.gearCatalog.signature (weapons and munitions)
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

  /* isHeld(kind, key): kind is "lineage", "subclass", "talent" or
     "background". True only while holds.lineup is on and the key is listed. */
  function isHeld(kind, key) {
    if (!holds.lineup || key == null || key === "") return false;
    var list = held[kind];
    if (!list) return false;
    if (has(list, key)) return true;
    return kind === "talent" && has(list, talentKey(key));
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
  function nameIn(list, name) {
    for (var i = 0; i < (list || []).length; i++) if (list[i] && list[i].name === name) return list[i];
    return null;
  }

  /* isToolkit(kind, id), true only while holds.toolkit is on:
       "item"        a catalog name: the listed items, plus every Signature
                     weapon and munition, plus the NAME of a listed Part,
                     armor Mod or vehicle Mod (the market lists those by name)
       "part", "armorMod", "vehicleMod", "cyberware"   a key
       "cyberTier"   a cyberware quality tier name ("Blackware", "Prototype")
       "availability" an Availability word on the Mystech scale
       "signature"   true for any name in EN.gearCatalog.signature */
  function isToolkit(kind, id) {
    if (!holds.toolkit || id == null || id === "") return false;
    if (kind === "signature") return !!toolkit.signature && has(signatureNames(), id);
    if (kind === "item") {
      if (has(toolkit.item, id)) return true;
      if (toolkit.signature && has(signatureNames(), id)) return true;
      var wp = EN.weaponParts && nameIn(EN.weaponParts.parts, id);
      if (wp && has(toolkit.part, wp.key)) return true;
      var am = EN.armorMods && nameIn(EN.armorMods.mods, id);
      if (am && has(toolkit.armorMod, am.key)) return true;
      var vm = EN.vehicles && nameIn(EN.vehicles.mods, id);
      if (vm && has(toolkit.vehicleMod, vm.key)) return true;
      return false;
    }
    return has(toolkit[kind], id);
  }

  /* isToolkitItem(it): the same test for a catalog ITEM object as the market
     builds it (inventory.js partAsItem / armorModAsItem / vehicleModAsItem
     carry partKey or modKey; everything else is matched by name). */
  function isToolkitItem(it) {
    if (!holds.toolkit || !it) return false;
    if (it.partKey) return has(toolkit.part, it.partKey);
    if (it.armorMod && it.modKey) return has(toolkit.armorMod, it.modKey);
    if (it.vehicleMod && it.modKey) return has(toolkit.vehicleMod, it.modKey);
    return isToolkit("item", it.name);
  }

  /* showAvailability(): false while rarity is held. Display only: the data
     stays, and rule logic that reads it (the Register markup, the crafting
     Project tier) keeps reading it. */
  function showAvailability() { return !holds.availability; }

  return { holds: holds, held: held, toolkit: toolkit,
           isHeld: isHeld, offer: offer, isToolkit: isToolkit, isToolkitItem: isToolkitItem,
           showAvailability: showAvailability };
})();
