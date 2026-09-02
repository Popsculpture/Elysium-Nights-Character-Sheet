/* ===========================================================================
   ELYSIUM NIGHTS · Store
   Character record factory, localStorage persistence, and a tiny event bus.
   The whole app reads/writes the single "active character" here.
   =========================================================================== */
window.EN = window.EN || {};

EN.store = (function () {
  var KEY_ROSTER = "en_roster_v1";       // {id: character}
  var KEY_ACTIVE = "en_active_id_v1";
  var listeners = [];
  /* state.example holds a PRE-MADE EXAMPLE that is live but not owned. Examples are defined
     in app/data/examples.js and never touch localStorage, so they cannot be deleted, cannot
     drift, and survive clearing site data. Editing one works normally and the edits evaporate
     on reload, which is what "example" should mean, and makes them safe to test against
     without any risk to the roster the player actually built. */
  var state = { roster: {}, activeId: null, example: null };

  /* ---- event bus -------------------------------------------------------- */
  function on(fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (l) { return l !== fn; }); }; }
  function emit() { listeners.forEach(function (l) { try { l(active(), state); } catch (e) { console.error(e); } }); }

  /* ---- id helper (no Date.now / Math.random restriction issues at runtime) */
  function uid() {
    return "ch_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }

  // The character's full display name is always derived: First "Handle" Last,
  // gracefully collapsing when any piece is blank (never a stray quote or a
  // double space). ch.name itself is just this composed string, kept in sync
  // by every write site (Identity step inputs, migrate()) so every existing
  // consumer of ch.name shows the composed form with no changes of its own.
  function composeFullName(first, handle, last) {
    first = String(first || "").trim(); handle = String(handle || "").trim(); last = String(last || "").trim();
    return [first, handle ? '"' + handle + '"' : "", last].filter(Boolean).join(" ");
  }

  /* ---- blank character factory ----------------------------------------- */
  function newCharacter(name) {
    var attrs = {};
    EN.rules.attributes.forEach(function (a) { attrs[a.key] = 10; });
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    var firstName = parts[0] || "", lastName = parts.slice(1).join(" ") || "";
    return {
      // wearKeys states which scheme the per-piece wear maps use, so migrate() never
      // has to guess it from a key's shape. A record born here is entry-keyed by
      // definition: its maps are empty and every row it ever gains carries an id.
      // filedGate marks a record born AFTER the nav gate shipped (2026-09), so
      // migrate() never grandfathers it: only #PRINT's Submit & File can stamp
      // filedAt on a record that carries this. See registered() in app.js.
      meta: { id: uid(), schemaVersion: EN.rules.schemaVersion, wearKeys: 2, filedGate: 1, createdAt: Date.now(), updatedAt: Date.now() },
      name: composeFullName(firstName, "", lastName),
      firstName: firstName, lastName: lastName,
      identity: {
        concept: "", handle: "", whereFrom: "",
        facets: "", coreSparks: "", tethers: "", faultLines: "",
        appearance: "", notes: ""
      },
      level: 1,
      xp: 0,
      useXp: false,
      milestones: { major: 0, minor: 0, notes: "" },
      attributeMethod: "pointbuy",       // 'pointbuy' | 'array' | 'manual' | 'overclocked'
      attributes: attrs,
      rollGroups: [],                    // banked 4d6-drop-lowest roll groups (Manual/Roll)
      arrayAssign: {},                   // value-to-attribute bookkeeping (Standard Array & Overclocked Array)
      // Overclocked Array: a 6x6 matrix of 36 rolled scores (each {dice:[4]},
      // 4d6 drop lowest); the player picks one full row/column/diagonal as
      // their final array. pick = {kind:'row'|'col'|'d1'|'d2', index} or null;
      // allowDiagonals is the table rule that legalizes the two diagonals.
      overclocked: { grid: [], pick: null, allowDiagonals: false },
      species: null,
      lineage: null,
      heightFt: null,                    // height in feet, inside the lineage's printed range; Size derives from it
      size: null,                        // legacy direct Size pick, honoured only for characters built before heightFt
      lineageFeatures: [],               // chosen feature names (creation + evolution)
      background: null,
      backgroundSkillChoice: null,
      backgroundProfChoices: [],         // "choose one" gear picks from the background
      class: null,
      subclass: null,
      classSkillChoices: [],
      classGearChoices: { weapons: [], armor: [], tools: [], vehicles: [] },  // "choose one" gear picks
      // Starting Gear Kit (Core Pack + Class Kit + Subclass Extra, 700 budget):
      // picks = {slotKey: 0|1}, alt = use the subclass Alternate Pick, granted
      // = [{key, qty}] equipment entries added at claim (for UNDO), and the
      // Glimmer that landed on the stick. claimedClass/Subclass pin what was
      // claimed so a later respec can warn before re-claiming.
      startingKit: { claimed: false, picks: {}, alt: false, granted: [], glimmerGranted: 0, claimedClass: null, claimedSubclass: null },
      // gear buckets are { category: tierKey } maps (weapons/tools/vehicles upgrade; armor acquire-only)
      proficiencies: { skills: {}, saves: [], weapons: {}, armor: {}, tools: {}, vehicles: {} },
      versatile: { insight: { attr: "", skill: "" }, performance: { attr: "", skill: "" }, intimidation: { attr: "", skill: "" } },
      skillFocuses: [],                  // [{skill, aspect}]
      specializations: [],               // [{skill, aspect}]
      talents: [],                       // talent keys
      // Which attribute a choose-one Talent raised: {talentKey: "BOD"|"AGI"|"WIT"|"TEC"|"MYS"|"CHA"}.
      // Absent means unset, which is a real state: 24 of the 36 bump Talents offer a choice, and
      // an unanswered choice grants no point rather than a guessed one. Null-prototype like every
      // other map in this app keyed on a string out of a save file. Read through engine.talentAttr.
      talentAttrPicks: Object.create(null),
      // Attack-attribute offers the player has switched on, per weapon entry key.
      // {weaponEntryKey: featureName}. See the engine's attackAttrOffers.
      attackAttr: Object.create(null),
      customFeatures: [],                // player/GM manual Features on the Freelancer tab: [{id,name,source,effect,note,category,action,cost,uses,range,duration}]
      featureAnnotations: {},            // per computed-feature notes/flags: {featureName: {note, pinned, important, hidden}}
      universalUpgrades: {},             // {level: {type:'attr'|'talent'|'evolution', ...}}
      awakeningEvolution: null,          // Level 4 Awakening Milestone free Lineage Evolution
      cyberware: [],                     // INSTALLED chrome (feeds Static / Chrome Tax + Open Architecture)
      cyberStash: [],                    // purchased-but-uninstalled chrome (install at a clinic to move it to cyberware)
      grid: {                            // #GRID rig + live hacking state (Bandwidth tracks via resources.current)
        deckKey: null,                   // ENTRY key of the live deck; type and tier are read
                                         // off that entry's catalog row and never stored here
        deckHpSpent: {},                 // {entryKey: Integrity lost} - per deck, not per character
        deckMods: {},                    // {entryKey: [mod keys]} - one loadout per owned deck
        links: []                        // active Links: [{name, tier}]
      },
      rig: {                             // Trauma Rig (anyone can own one); a Stitcher's Triage Save DC reads its Output Bonus
        key: null,                       // the picked Rig's EQUIPMENT ENTRY key; null = fall back to owned gear, else Output Bonus +0
        scrap: false,                    // cobbled Scrap Rig: Output Bonus +0, Snag on Triage, Swift Protocols cost an Action
        hp: {}                           // Integrity lost per Rig: {entryKey: spent}. Bricked at the tier's Integrity; a Rig with no
                                         // entry here is undamaged, so a re-bought Rig (a new entry key) always arrives full
      },
      trainingPoints: { spent: 0, allocations: [] },
      resources: { current: {} },
      vitality: { current: null, temp: 0 },   // current null = full; temp = Vigor
      wounds: { current: null },               // countdown pool; null = full (Body score)
      // Flow: current FP (null = full), Strain stage (0-5), strainPoints (Overdraw
      // accumulator, 3 = +1 stage), the one sustained effect, Breakflow state, and
      // saved Resonant Patterns (formulations recomputed from live Caliber/Flow Mod).
      flow: { current: null, strain: 0, strainPoints: 0, sustained: null, breakflow: false, patterns: [] },
      resonances: [],                          // Shaper: known Base Resonance keys (3 at L1, +1 at L3, +1 at L5)
      resilience: { spent: 0 },                // Resilience Dice spent (max = level)
      featureUses: {},                         // {featureName: {n: spent, r: recharge}} for limited-use features
      fatigue: 0,
      deathSaves: { s: 0, f: 0 },
      stable: false,
      conditions: [],
      conditionLevels: {},               // {name: level} for stackable/leveled conditions
      /* Environmental Hazards. The escalating Exposure DC is PER EXPOSURE
         INSTANCE, and the shape is what enforces that: every exposure is its
         own row under a minted "ex_" id carrying its OWN save count, and the
         DC is derived from that row alone. There is no global counter here to
         share, and leaving an exposure deletes its row, so "leaving resets both
         the clock and the DC" happens because the state that held the DC is
         gone. Deprivation is three such clocks, one per threshold, never one. */
      hazards: {
        exposures: {},                   // {exId: {type, severity, saves, fatigue, minutes, clockMinutes}}
        deprivation: {                   // THREE independent day-scale clocks, each stacking its own Fatigue
          water: { days: 0, saves: 0, fatigue: 0 },
          food:  { days: 0, saves: 0, fatigue: 0 },
          sleep: { days: 0, saves: 0, fatigue: 0 }
        },
        breath: {                        // Vacuum and Drowning, one shared spec (EN.hazards.breath)
          drowning: { active: false, rounds: 0, saves: 0 },
          vacuum:   { active: false, rounds: 0, saves: 0 }
        },
        caustic: {
          inside: false, lingering: false, sceneTicks: 0,
          // no armorDR here: caustic DR loss goes through EN.engine.applyArmorDamage
          // into ch.armorWear like every other point of DR a suit loses. The separate
          // ledger this field used to hold is retired in migrate()
        },
        thermalWeave: {},                // {armorEntryKey: "Fire"|"Cold"}, the Thermal Regulation Weave install pick
        hazmatTorn: false,               // the Hazmat Suit's own entry: a tear fails the seal until repaired
        rebreatherMinutes: 60,           // minutes of Rebreather thin-air cover left this scene
        // How many of the character's CURRENT Fatigue levels came from thin air.
        // Character-scoped on purpose: it used to be read off the live exposure
        // row, and a row's lifetime is not this attribution's lifetime, so the
        // lock outlived the Fatigue it described and LEAVE plus re-ENTER
        // laundered it. Incremented on a thin-air failure, decremented when
        // Fatigue is cleared, and clamped by the engine to the Fatigue actually
        // held. It only LOCKS anything while a thin-air exposure is live.
        thinAirFatigue: 0,
        // Which hazards the player has APPLIED in the Status Changes panel, as
        // EN.statusChanges option keys: {"deprivation:water": true}. This is
        // STATED, never inferred from whether a clock happens to be non-zero.
        // A thirst track at 0 days that the player applied is on the panel; one
        // they never applied is not, and the two are indistinguishable from the
        // clock alone. Exposures are not listed here: an exposure row exists
        // only because it was applied, so the row IS the statement.
        applied: {}
      },
      // Applied Bonuses, as EN.statusChanges option keys. Player-declared by
      // definition: a Hot-Wire an ally installed on you, or a consumable you
      // just took, are both states this sheet cannot derive.
      bonuses: {},
      equipment: [],
      equippedWeapons: [],               // ordered weapon names, drives the Attacks list on the Freelancer tab
      equippedArmor: null,               // worn body armor (one at a time), name from EN.gearCatalog.armor
      equippedShield: null,              // wielded physical shield (one at a time)
      equippedFocus: null,               // attuned Warding Focus (one at a time)
      weaponAmmo: {},                    // {weaponName: {cur, mode, ammoType}}, magazine/fire-mode tracking
      // How a Versatile weapon is being held: {weaponName: "two"}. Absent means one
      // hand, which is the base damage. Keyed by NAME like weaponAmmo and weaponParts,
      // because the choice is about the weapon type you are wielding, not about which
      // copy of it. Null-prototype: the keys are item names out of a save file.
      weaponGrip: Object.create(null),
      carry: {},                         // Loadout carry status per entry key: "carried" | "worn" | "racked" (absent = stashed)
      racked: {},                        // Racked assignments: {itemEntryKey: carryGearEntryKey} (Carry Gear, one rack per item)
      slotInert: {},                     // Body Slot conflicts: {itemEntryKey: true} for on-person items the player benched
      // The three per-piece degradation maps, born NULL-PROTOTYPE like every other
      // map in this app that is keyed on a user-supplied string. migrate() rebuilds
      // them that way and the split's id maps are that way, but a character created
      // in-session never passes through migrate(), so as plain literals these three
      // were the one place the invariant did not hold. Measured, not theorised: with
      // a plain armorGuard, a suit whose entry id is "toString" reads guard TRUE
      // without ever being repaired, and then absorbs every point of DR forever,
      // because "spending" the guard is a delete on an inherited property.
      shieldWear: Object.create(null),   // Shield Durability: {shieldEntryKey: boxesMarked}
      armorWear: Object.create(null),    // Armor Repair: {armorEntryKey: DR points lost}. The catalog dr is the
                                         // BASE and the ceiling; absent means the suit is at full DR
      armorGuard: Object.create(null),   // {armorEntryKey: true}: a clean repair's quality edge, absorbs the next point of DR lost
      loadout: "standard",               // declared Loadout: "light" | "standard" | "heavy", sets the Load Budget
      haul: "none",                      // active Haul: "none" | "lift" (body-sized) | "drag" (oversized/double)
      glimmer: 0,
      nexus: 0,                          // Nexus tokens (◎), the high-scrutiny currency; fractional
      log: []
    };
  }

  /* ---- schema migration (normalize older saved characters) -------------- */
  /* The default shape a record is filled from, built ONCE and cached. It is
     newCharacter()'s own return value with the per-record identity fields removed,
     so the schema has exactly one definition and this cannot drift from it.

     Memoized rather than rebuilt per record for two reasons: building a whole
     character object for every record on every load is waste, and newCharacter()
     mints a uid, which consumes a Math.random() draw. Per-record that would shift
     the RNG sequence by one for each record loaded, which changes every id minted
     afterwards and makes a seeded before-and-after comparison incomparable. One
     draw for the session is the whole cost. Callers deep-copy what they take. */
  var _schemaTemplate = null;
  function schemaTemplate() {
    if (!_schemaTemplate) {
      _schemaTemplate = newCharacter("");
      ["meta", "name", "firstName", "lastName"].forEach(function (k) { delete _schemaTemplate[k]; });
    }
    return _schemaTemplate;
  }

  function migrate(ch) {
    if (!ch) return;
    // name must always be a string, even for an ancient/malformed roster entry
    // that predates the current schema and fails the check below (a corrupt
    // record should still be safely displayable, e.g. in the #PRINT switcher).
    if (typeof ch.name !== "string") ch.name = "";

    /* THE TWO LIST FIELDS EVERY OTHER PASS ASSUMES ARE ARRAYS OF OBJECTS.
       Normalized here, first, because the cost of getting this wrong is the whole
       roster rather than one field. Both are walked unguarded in several places
       (`(ch.equipment || []).forEach` and friends in engine.js and below), and
       `|| []` defends against absent, not against a plain object or a null hole:

         ch.equipment as an OBJECT -> .forEach is undefined -> throw
         a null ELEMENT in the array -> e.name throws inside the split

       Either throw propagates out of migrate() into load()'s catch, which answers
       by discarding the ENTIRE roster (measured: 5 records to 0, activeId null),
       and the next persist() writes that emptiness back. One malformed record
       silently destroys every other character on the device.

       Not reachable by clicking: importCharacter throws on its own validation
       before storing, so this needs a record already in localStorage, which means
       a hand edit or a file written by an older build. Cheap to make impossible,
       and the blast radius is the reason to bother. (L10, plus the null-element
       shape a reviewer measured separately.) */
    /* MISSING TOP-LEVEL FIELDS ARE FILLED FROM THE SCHEMA, which is newCharacter()
       itself rather than a second list that can drift from it. migrate() defaults a
       great many fields by hand but never touched resources, vitality, wounds, flow,
       conditions or deathSaves, so a record without them threw on the Freelancer tab
       the moment it rendered (`ch.resources.current` is dereferenced unguarded at
       combat.js:2613, and it is far from the only one). Pre-existing and not caused
       by the guard fix below: before it, such a record returned early and did not get
       these defaults either, so it crashed identically.

       ONLY ABSENT keys are filled, never present ones, so this cannot overwrite a
       real value with a blank. Identity fields are skipped because they are derived
       or per-record: meta carries a minted id and timestamps, and name/firstName/
       lastName are recomposed further down. Deep-copied per record, or every record
       missing a field would share one mutable object with all the others. */
    var TEMPLATE = schemaTemplate();
    Object.keys(TEMPLATE).forEach(function (k) {
      if (ch[k] === undefined) ch[k] = JSON.parse(JSON.stringify(TEMPLATE[k]));
    });

    if (!Array.isArray(ch.equipment)) ch.equipment = [];
    // Equipment rows have always been objects, and every pass reads e.name / e.id
    // off them, so anything that is not one is not a row.
    ch.equipment = ch.equipment.filter(function (e) { return e && typeof e === "object" && !Array.isArray(e); });
    // Chrome keeps its holes dropped but its STRINGS intact: ch.cyberware
    // legitimately carries legacy string entries that its own pass below converts
    // to objects, so filtering those out here would destroy exactly the records
    // that migration exists to rescue.
    ["cyberware", "cyberStash"].forEach(function (f) {
      if (!Array.isArray(ch[f])) { ch[f] = []; return; }
      ch[f] = ch[f].filter(function (e) { return e != null; });
    });
    // Saved Lifelike Personas (ch.face.personas). Sanitized AHEAD of the
    // proficiencies guard below, because losing one is unrecoverable without
    // redoing the scan in fiction, and a hand-edited or imported record must not
    // be able to smuggle in a malformed entry or a second active Persona.
    if (ch.face && ch.face.personas != null) {
      if (!Array.isArray(ch.face.personas)) ch.face.personas = [];
      // Author ruling 2026-08-01: one active PER FEATURE, and the two need not
      // be the same person. So this de-duplicates actives per source, not
      // globally: a Biometric Spoofing face and a Method Actor performance may
      // both be worn at once.
      var seenActive = {};
      ch.face.personas = ch.face.personas.filter(function (p) { return p && typeof p === "object"; });
      ch.face.personas.forEach(function (p) {
        if (p.sourceFeature !== "BiometricSpoofing" && p.sourceFeature !== "MethodActor") p.sourceFeature = "BiometricSpoofing";
        if (typeof p.subjectName !== "string") p.subjectName = "";
        if (typeof p.daysLeft !== "number" || p.daysLeft < 0) p.daysLeft = 30;
        if (p.isActive && seenActive[p.sourceFeature]) p.isActive = false;
        else if (p.isActive) seenActive[p.sourceFeature] = true;
      });
    }
    /* This used to be a bare `if (!ch.proficiencies) return;`, and every migration
       added since sat after it. A record missing that ONE field therefore skipped
       about a hundred and fifty lines of unrelated normalization: the Toxicologist
       and Zeroed In talent renames, the weaponAmmo firing-mode rename, the entire
       equipment instance-id split, and the equipment-keyed ch.rig block. It is now a
       guard around exactly the conversion it was written for, which is all it ever
       meant. (L12 in GROUP D. A reviewer independently lost a test run to it: a record
       without `proficiencies` kept its duplicate ids because the split never ran.) */
    if (ch.proficiencies && typeof ch.proficiencies === "object" && !Array.isArray(ch.proficiencies)) {
      var p = ch.proficiencies;
      // gear buckets used to be arrays; convert to { category: tier } maps
      ["weapons", "armor", "tools", "vehicles"].forEach(function (b) {
        if (!p[b] || Array.isArray(p[b])) {
          var map = {};
          if (Array.isArray(p[b])) p[b].forEach(function (c) { if (c) map[c] = "proficient"; });
          p[b] = map;
        }
      });
      delete p.shields; // shields folded into armor (Physical Shields)
      if (!p.skills) p.skills = {};
    }
    if (!ch.versatile) ch.versatile = {};
    ["insight", "performance", "intimidation"].forEach(function (t) {
      if (!ch.versatile[t]) ch.versatile[t] = { attr: "", skill: "" };
    });
    if (!ch.featureUses) ch.featureUses = {};
    if (!Array.isArray(ch.customFeatures)) ch.customFeatures = [];           // manual Features on the Freelancer tab
    if (!ch.featureAnnotations || typeof ch.featureAnnotations !== "object") ch.featureAnnotations = {};  // notes/flags on computed features
    if (!ch.carry || typeof ch.carry !== "object") ch.carry = {};            // Loadout carry status per item
    if (!ch.racked || typeof ch.racked !== "object") ch.racked = {};         // Carry Gear rack assignments
    Object.keys(ch.racked).forEach(function (k) { if (typeof ch.racked[k] !== "string") delete ch.racked[k]; });
    // carry values must be a real status. "Mission" never had a distinct
    // mechanical meaning (identical to Carried everywhere it was read), so a
    // legacy save folds it into Carried instead of losing the on-person state.
    // A "racked" status without a surviving rack target downgrades to carried
    // (still on-person, no break); a "worn" status on armor/shield/focus is
    // meaningless noise (those equip through their own dedicated field, not
    // carry status) and downgrades to carried so it can't double-count toward
    // its Body Slot alongside the real equipped entry.
    Object.keys(ch.carry).forEach(function (k) {
      var v = ch.carry[k];
      if (v === "mission") v = "carried";
      if (["carried", "worn", "racked"].indexOf(v) === -1) { delete ch.carry[k]; return; }
      if (v === "racked" && typeof ch.racked[k] !== "string") v = "carried";
      if (v === "worn") {
        var e = (ch.equipment || []).find(function (x) { return (x.id || x.name) === k; });
        var it = e && EN.engine && EN.engine.catalogItem ? EN.engine.catalogItem(e.name) : null;
        if (it && (it.kind === "armor" || it.kind === "shield" || it.kind === "focus")) v = "carried";
      }
      ch.carry[k] = v;
    });
    // Body Slot conflict picks: a hand-edited/imported save can carry garbage
    // here, and slotState() only ever reads true/false per entry key, so any
    // non-true value is just noise to strip.
    if (!ch.slotInert || typeof ch.slotInert !== "object") ch.slotInert = {};
    Object.keys(ch.slotInert).forEach(function (k) { if (ch.slotInert[k] !== true) delete ch.slotInert[k]; });
    // ch.shieldWear, ch.armorWear and ch.armorGuard are keyed on the equipment
    // ENTRY, so they are normalized AFTER the instance-id split, not here beside
    // the other gear defaults. See the ordering rule at the split.
    // Which REPLACER the player is currently punching with: the name of a lineage
    // feature or an installed piece of chrome, or "base" for the plain
    // 1 + Body Modifier strike. Increases are not a choice and never land here.
    // Absent means "not chosen yet", and a pick naming a replacer the character no
    // longer has falls back to the first one available, so anything that is not a
    // non-empty string is just noise to strip.
    if (typeof ch.unarmedPick !== "string" || !ch.unarmedPick) delete ch.unarmedPick;
    if (typeof ch.nexus !== "number") ch.nexus = 0;                          // Nexus wallet (◎)
    // The Loadout is declared at the start of a job and sets the Load Budget;
    // "If nobody declares, assume Standard."
    if (["light", "standard", "heavy"].indexOf(ch.loadout) === -1) ch.loadout = "standard";
    if (["none", "lift", "drag"].indexOf(ch.haul) === -1) ch.haul = "none";  // active Haul
    if (ch.identity && ch.identity.notes === undefined) ch.identity.notes = "";  // freeform notes, shared with the #PRINT Identity step
    // First/Last Name split: a legacy single ch.name seeds them once (best
    // effort, split on the first space), then ch.name is recomputed as the
    // derived First "Handle" Last display string every load, so a changed
    // Handle or a hand-edited import never falls out of sync on its own.
    if (typeof ch.firstName !== "string" || typeof ch.lastName !== "string") {
      var nameParts = String(ch.name || "").trim().split(/\s+/).filter(Boolean);
      ch.firstName = nameParts[0] || "";
      ch.lastName = nameParts.slice(1).join(" ") || "";
    }
    ch.name = composeFullName(ch.firstName, (ch.identity && ch.identity.handle) || "", ch.lastName);
    if (!ch.equippedWeapons) ch.equippedWeapons = [];
    if (ch.equippedArmor === undefined) ch.equippedArmor = null;
    if (ch.equippedShield === undefined) ch.equippedShield = null;
    if (ch.equippedFocus === undefined) ch.equippedFocus = null;
    if (!ch.weaponAmmo) ch.weaponAmmo = {};
    if (!ch.vehicleMods || typeof ch.vehicleMods !== "object") ch.vehicleMods = {};   // {vehicleEntryKey: [modKey]}
    // a limb-platform mod records which platform it sits in; slotted pieces pay no SP
    (ch.cyberware || []).forEach(function (cw) {
      if (cw && typeof cw === "object" && typeof cw.slottedIn !== "string") delete cw.slottedIn;
    });
    // lifestyle + safehouse ride one weekly clock, ticked a day per Long Rest
    if (!ch.household || typeof ch.household !== "object") ch.household = {};
    var hh = ch.household;
    if (typeof hh.lifestyle !== "string") hh.lifestyle = "";
    if (typeof hh.safehouse !== "string") hh.safehouse = "";
    if (!Array.isArray(hh.upgrades)) hh.upgrades = [];
    if (typeof hh.days !== "number" || hh.days < 0 || hh.days > 7) hh.days = 7;
    hh.due = !!hh.due;
    if (typeof hh.hypercare !== "string") hh.hypercare = "";      // tier name, billed monthly
    if (typeof hh.hypercareDays !== "number" || hh.hypercareDays < 0 || hh.hypercareDays > 30) hh.hypercareDays = 30;
    hh.hypercareDue = !!hh.hypercareDue;
    if (!Array.isArray(hh.licenses)) hh.licenses = [];              // names held, cost is the GM's call
    if (!Array.isArray(ch.debts)) ch.debts = [];                    // {kind, holder, principal, clock}
    // the firing mode was renamed "Burst" -> "Burst Fire" to match the book;
    // a record saved before that carries the old string in its magazine state
    Object.keys(ch.weaponAmmo).forEach(function (w) {
      var a = ch.weaponAmmo[w];
      if (a && a.mode === "Burst") a.mode = "Burst Fire";
    });
    /* How each Versatile weapon is being held. Rebuilt null-prototype and reduced to
       the only value that means anything, because absent already means one-handed:
       storing "one" would be a second way to say nothing and would then need keeping
       in sync. Anything that is not the literal "two" is dropped. This pass only filters
       VALUES; the keys are still weapon names here and are re-keyed to equipment entries
       after the instance-id split, which is where that has to happen. */
    var gripIn = (ch.weaponGrip && typeof ch.weaponGrip === "object" && !Array.isArray(ch.weaponGrip)) ? ch.weaponGrip : {};
    var gripOut = Object.create(null);
    Object.keys(gripIn).forEach(function (k) { if (gripIn[k] === "two") gripOut[k] = "two"; });
    ch.weaponGrip = gripOut;
    /* RENAMED WEAPON PARTS. "Extended Haft" became "Extended Shaft" on 2026-08-12, and a
       Part is persisted under TWO different strings that have to move together:

         ch.weaponParts[weaponName][slot]  the install, by part KEY
         ch.equipment[n].name              the owned copy in the stash, by part NAME

       and availablePartQty() is owned-by-name minus installed-by-key. Move one and not
       the other and a character owns -1 of the thing. Move neither and it is worse than
       cosmetic: weaponPartsOn() resolves through byKey and .filter(Boolean)s the miss, so
       a Quarterstaff would keep an occupied Handling slot while silently losing its +1
       Reach and its forced two-handed grip, and its Versatile toggle would reappear.

       The table lives in the data beside the Part (EN.weaponParts.renames), following the
       TALENT_RENAMES precedent below but read from the catalog rather than restated here,
       so the next rename is a row in that file and not a second place to remember.

       This pass rewrites part KEYS inside a loadout and normalizes the loadout's shape,
       neither of which depends on how the map itself is keyed, so it runs here. The map's
       own keys move from weapon names to equipment entries after the split. */
    var PART_RENAMES = Object.create(null), PART_NAME_RENAMES = Object.create(null);
    ((EN.weaponParts && EN.weaponParts.renames) || []).forEach(function (r) {
      if (r && r.oldKey && r.key) PART_RENAMES[r.oldKey] = r.key;
      if (r && r.oldName && r.name) PART_NAME_RENAMES[r.oldName] = r.name;
    });
    var wpIn = (ch.weaponParts && typeof ch.weaponParts === "object" && !Array.isArray(ch.weaponParts)) ? ch.weaponParts : {};
    ch.weaponParts = wpIn;
    /* The loadout is normalized on the way through, not just renamed. ch.weaponParts has
       never been validated, and a hand-edited or older record can carry anything: the
       bench reads `(wp.utility || []).slice()`, and "x".slice() is the STRING "x", which
       then reaches a .map() that does not exist on it and throws the whole Inventory tab.
       Measured on a `{handling: 7, utility: "x"}` record, not theorised. Pre-existing, but
       this block is now the thing that says a loadout is an object, and half a guarantee
       is worse than none: the next reader will trust it. Slots hold one key or null,
       utility holds up to its stated capacity of real keys. */
    var UTIL_CAP = (((EN.weaponParts && EN.weaponParts.slots) || [])
      .filter(function (s) { return s.key === "utility"; })[0] || {}).capacity || 2;
    Object.keys(wpIn).forEach(function (wn) {
      var lo = wpIn[wn];
      if (!lo || typeof lo !== "object" || Array.isArray(lo)) { delete wpIn[wn]; return; }
      ["targeting", "output", "core", "handling"].forEach(function (s) {
        if (typeof lo[s] !== "string" || !lo[s]) { lo[s] = null; return; }
        lo[s] = PART_RENAMES[lo[s]] || lo[s];
      });
      lo.utility = (Array.isArray(lo.utility) ? lo.utility : [])
        .filter(function (k) { return typeof k === "string" && k; })
        .map(function (k) { return PART_RENAMES[k] || k; })
        .slice(0, UTIL_CAP);
      if (typeof lo._profile !== "string" || !lo._profile) lo._profile = "auto";
    });
    if (Array.isArray(ch.equipment)) {
      ch.equipment.forEach(function (e) {
        if (e && typeof e.name === "string" && PART_NAME_RENAMES[e.name]) e.name = PART_NAME_RENAMES[e.name];
      });
    }
    /* THE THIRD place a Part name is persisted, and the one that outlives a migration.
       A crafting Project stores `itemName`, and tbComplete does addToStash(c, pp.itemName)
       when it finishes. An open "Build Extended Haft" therefore mints a stash row named
       "Extended Haft" AFTER this pass has already run for the session, and that row
       resolves to no catalog item at all: not sellable at its price, not installable,
       not a Part. Rewriting only the two obvious stores would have left a machine in the
       save file that keeps manufacturing the old name. The display `name` moves too, or
       the card would read "Build Extended Haft" and hand you an Extended Shaft. */
    if (Array.isArray(ch.projects)) {
      ch.projects.forEach(function (pj) {
        if (!pj) return;
        var to = (typeof pj.itemName === "string") ? PART_NAME_RENAMES[pj.itemName] : null;
        if (!to) return;
        if (typeof pj.name === "string") pj.name = pj.name.split(pj.itemName).join(to);
        pj.itemName = to;
      });
    }
    /* RENAMED IMPLANTS. ch.cyberware[n].key is the stored identity of an installed piece,
       and ch.cyberStash holds the uninstalled ones, so both move together. Miss this and the
       implant is not merely mislabelled: every reader looks it up by key, so it keeps
       charging its Static Points while granting nothing at all. Read from the catalog
       (EN.cyberware.renames) rather than restated here, like the weapon-part table above. */
    var CYBER_RENAMES = Object.create(null), CYBER_NAME_PAIRS = [];
    ((EN.cyberware && EN.cyberware.renames) || []).forEach(function (r) {
      if (r && r.oldKey && r.key) CYBER_RENAMES[r.oldKey] = r.key;
      if (r && r.oldName && r.name) CYBER_NAME_PAIRS.push([r.oldName, r.name]);
    });
    /* The stored display name EMBEDS the short name rather than equalling it. The market
       builds it as `tier + " " + short` ("Brandware Cybereyes"), or `short + " (Prototype)"`,
       so an exact-string rename matched a bare "Cybereyes" and left every real saved record
       reading "Brandware Cybereyes" forever. Matched on word boundaries instead, which
       rewrites the embedded name and leaves a name that merely contains the word as part of a
       longer one alone. Longest old name first, so a rename whose old name is a prefix of
       another cannot win the race and produce a half-renamed label. */
    CYBER_NAME_PAIRS.sort(function (a, b) { return b[0].length - a[0].length; });
    function cyberRenameText(t) {
      CYBER_NAME_PAIRS.forEach(function (pair) {
        t = t.replace(new RegExp("\\b" + pair[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"), pair[1]);
      });
      return t;
    }
    [ch.cyberware, ch.cyberStash].forEach(function (list) {
      if (!Array.isArray(list)) return;
      list.forEach(function (cw) {
        if (!cw || typeof cw !== "object") return;
        if (typeof cw.key === "string" && CYBER_RENAMES[cw.key]) cw.key = CYBER_RENAMES[cw.key];
        ["name", "base", "short"].forEach(function (f) {
          if (typeof cw[f] === "string") cw[f] = cyberRenameText(cw[f]);
        });
      });
    });
    /* CATALOG PROSE IS NOT PLAYER STATE. The purchase path used to copy `desc` and `effect`
       onto the owned record, so a save written before a catalog correction kept the stale
       wording forever with nothing to refresh it: the six cyberware rules restored on
       2026-08-22 would never have reached a character who already owned the piece. Both
       fields are DROPPED here rather than rewritten, because engine.cyberDesc/cyberEffect
       now resolve them live from the catalog; writing a fresh copy back would only go stale
       again at the next correction.

       Ordering is not incidental: this runs AFTER the rename pass above. A save written
       before the Cybereyes to Cyberoptics rename still holds the retired key, and resolving
       against the catalog before that key moved would miss exactly the pieces most likely
       to be carrying stale text.

       An entry is left BYTE-IDENTICAL in two cases: its key resolves to nothing, so a
       retired or homebrew implant keeps whatever text it was saved with rather than
       rendering blank, and anything flagged `custom`, which is what the builder path and the
       legacy string conversion produce. Idempotent, so it is safe on every load. */
    var CYBER_DEFS = (EN.cyberware && EN.cyberware.items) || [];
    [ch.cyberware, ch.cyberStash].forEach(function (list) {
      if (!Array.isArray(list)) return;
      list.forEach(function (cw) {
        if (!cw || typeof cw !== "object" || cw.custom) return;
        if (typeof cw.key !== "string") return;
        if (!CYBER_DEFS.filter(function (i) { return i.key === cw.key; })[0]) return;
        delete cw.desc; delete cw.effect;
      });
    });
    // Renamed Talents. A record saved before a rename still stores the OLD key and
    // would resolve to nothing, silently, because every reader looks the key up with
    // .find() and drops a miss. Both spellings a record can carry (the key and the
    // display name, since readers accept either) map to the new key.
    //   "Toxicologist" -> "Cutting Agent", to stop colliding with the Stitcher
    //     subclass of the same name, which KEEPS its name.
    //   "Dead-Eye Sniper" -> "Zeroed In", the author's rename of 2026-08-10.
    // Talent keys live in THREE places, not one: the Universal Upgrade slots, the flat
    // ch.talents list the print sheet and the PDF export read, and the ch.talentAttrPicks
    // map added below. The Toxicologist rename only ever covered the first, so a
    // ch.talents entry has been rendering as nothing since; this table covers all three.
    var TALENT_RENAMES = Object.create(null);
    TALENT_RENAMES["toxicologist"] = TALENT_RENAMES["Toxicologist"] = "cutting-agent";
    TALENT_RENAMES["dead-eye-sniper"] = TALENT_RENAMES["Dead-Eye Sniper"] = "zeroed-in";
    /* Both retired keys point STRAIGHT at the current one. This migration applies a single
       lookup and does not chase a chain, so pointing one retired key at another would land a
       legacy record on a key that no longer exists and blank the talent silently, which is
       the failure this table exists to prevent. The second line is not sentiment: that key
       was live on the site for roughly 46 hours, so saved characters can genuinely hold it. */
    TALENT_RENAMES["kinetic-manipulator"] = TALENT_RENAMES["Kinetic Manipulator"] = "spatial-delivery";
    TALENT_RENAMES["spooky-action"] = TALENT_RENAMES["Spooky Action"] = "spatial-delivery";
    Object.keys(ch.universalUpgrades || {}).forEach(function (lvl) {
      var u = ch.universalUpgrades[lvl];
      if (u && (u.type === "talent" || u.type === "talentUpgrade") &&
          typeof u.talent === "string" && TALENT_RENAMES[u.talent]) u.talent = TALENT_RENAMES[u.talent];
    });
    if (Array.isArray(ch.talents)) {
      ch.talents = ch.talents.map(function (tk) {
        return (typeof tk === "string" && TALENT_RENAMES[tk]) ? TALENT_RENAMES[tk] : tk;
      });
    }
    /* The attribute a choose-one Talent raised, keyed by talent key. Rebuilt here rather
       than merely renamed, for two reasons. The schema fill above deep-copies its template
       through JSON, which returns a PLAIN object, so the null prototype born in
       newCharacter does not survive a record that was missing the field; and these keys
       come straight out of a save file, so a key of "toString" in a plain map reads as
       present and hands the engine Object.prototype.toString as an attribute.
       Renames apply the same single lookup as the two passes above, and where two retired
       keys now collide on one live key the FIRST wins: both describe the same Talent, and
       picking arbitrarily beats dropping a choice the player made. The engine validates
       the value on read, so a pick naming an attribute the Talent does not offer is left
       alone here and simply resolves to null. */
    var tapIn = (ch.talentAttrPicks && typeof ch.talentAttrPicks === "object" && !Array.isArray(ch.talentAttrPicks))
      ? ch.talentAttrPicks : {};
    var tapOut = Object.create(null);
    Object.keys(tapIn).forEach(function (tk) {
      var v = tapIn[tk];
      if (typeof v !== "string" || !v) return;
      var key = TALENT_RENAMES[tk] || tk;
      if (tapOut[key] === undefined) tapOut[key] = v;
    });
    ch.talentAttrPicks = tapOut;
    /* Which "you may" attack-attribute offer the player has switched ON, per weapon entry:
       {weaponEntryKey: "First Do No Harm"}. Absent means off, which is the honest default:
       these offers are conditional on something the sheet cannot see (First Do No Harm turns
       on the target being organic), so the sheet must not assume them.
       Null-prototype like every other map here keyed on a string out of a save file, and
       rebuilt rather than merely carried because the schema fill deep-copies its template
       through JSON, which returns a plain object. Validated on READ by the engine, so a
       stale entry naming a weapon that is gone, or a feature the character no longer has,
       simply resolves to nothing. */
    var aaIn = (ch.attackAttr && typeof ch.attackAttr === "object" && !Array.isArray(ch.attackAttr))
      ? ch.attackAttr : {};
    var aaOut = Object.create(null);
    Object.keys(aaIn).forEach(function (k) {
      if (typeof aaIn[k] === "string" && aaIn[k]) aaOut[k] = aaIn[k];
    });
    ch.attackAttr = aaOut;
    // Overclocked Array state (6x6 rolled matrix + picked line + table rule).
    // A hand-edited/imported file can carry anything here, and the matrix
    // render reads every slot, so anything short of exactly 36 well-formed
    // {dice:[4 numbers]} slots resets to "no matrix rolled yet".
    if (!ch.overclocked || typeof ch.overclocked !== "object" || !Array.isArray(ch.overclocked.grid)) {
      ch.overclocked = { grid: [], pick: null, allowDiagonals: false };
    }
    if (typeof ch.overclocked.allowDiagonals !== "boolean") ch.overclocked.allowDiagonals = false;
    if (ch.overclocked.grid.length && (ch.overclocked.grid.length !== 36 ||
        ch.overclocked.grid.some(function (s) {
          return !s || !Array.isArray(s.dice) || s.dice.length !== 4 ||
                 s.dice.some(function (v) { return typeof v !== "number"; });
        }))) {
      ch.overclocked.grid = [];
      ch.overclocked.pick = null;
    }
    // pick must name a real line or the render would index off the grid
    var ocp = ch.overclocked.pick;
    if (!ocp || ["row", "col", "d1", "d2"].indexOf(ocp.kind) === -1 ||
        ocp.index !== Math.floor(ocp.index) || ocp.index < 0 || ocp.index > 5) {
      ch.overclocked.pick = null;
    }
    // Focus/Specialization records: legacy {skill, aspect} entries become the
    // typed four-parent shape {type, parent, aspect, granted}. type "skill"
    // keeps the old skill key as its parent; weapons/vehicles/tools parents
    // are R.gear category names. Armor is never a valid parent.
    ["skillFocuses", "specializations"].forEach(function (listName) {
      if (!Array.isArray(ch[listName])) { ch[listName] = []; return; }
      ch[listName] = ch[listName].map(function (f) {
        if (!f) return null;
        if (f.type) return f;
        return { type: "skill", parent: f.skill, aspect: f.aspect || "", granted: !!f.granted };
      }).filter(function (f) { return f && f.parent; });
    });
    // Split non-stackable equipment (weapons, armor/shield/focus, kits, devices,
    // rigs, ciphers) into individually tracked instances, each its own entry
    // with a unique id. Only consumables/ammo/Flow tonics keep pooling into a
    // shared qty stack. Owning two daggers no longer forces them to share one
    // equipped/carried state; equip/carry re-key from the old catalog name to
    // the specific instance id, keeping the first split instance's state and
    // leaving any extras as unequipped, uncarried spares.
    //
    // ORDERING RULE, and it is not optional: ANY migration that keys state on an
    // EQUIPMENT ENTRY (engine.entryKey) must run AFTER this split, never before it.
    // Before the split runs, a legacy row carries no id, so entryKey() falls back to
    // the item NAME; the split then mints real ids and every name key just written is
    // an orphan, which the next load()'s prune deletes. The ch.rig block below used to
    // sit a hundred lines earlier, beside the other equipment defaults, and lost a
    // legacy record's Rig damage and recorded pick after exactly one load because of
    // it. The natural-looking place is the wrong place. Put it after this block.
    if (Array.isArray(ch.equipment)) {
      // null-prototype for the same reason reservedIds and usedIds are: it is keyed on
      // item NAMES out of a save file. As a plain literal, nameToIds["constructor"] read
      // back the Object constructor, which is truthy, so the rekey passes below took the
      // firstId() branch and firstId() then returned null (Object.prototype.constructor[0]
      // is undefined). A carry entry for an item called "constructor" came out keyed on
      // the literal string "null", destroying that item's carry state. Measured, not
      // theorised. This was the one map in the block the earlier prototype pass missed.
      var nameToIds = Object.create(null), splitEquipment = [];
      // UNIQUENESS, the other half of entry identity. Every consumer keys per-piece
      // state on engine.entryKey(e) === e.id || e.name, so an id that appears on TWO
      // rows is exactly as broken as no id at all: ownedRigs returns two entries with
      // one distinct key, both rows read the same Integrity out of one shared damage
      // slot, and the Rig picker renders two options with the identical value, leaving
      // one piece unaddressable. The qty fix above closed the missing-id door; this
      // closes the duplicate-id one. Reachable by import and by hand-authored records
      // (no in-app insert can do it: inventory.js:106 and builder.js:993 each mint a
      // fresh id per non-stackable purchase).
      //
      // reservedIds is every id the incoming list carries ANYWHERE, collected before a
      // single row is processed, so a freshly minted id can never be one that a LATER
      // row already owns. usedIds is what has actually been handed out so far, in list
      // order, which is what detects a duplicate.
      //
      // FIRST SEEN KEEPS THE ORIGINAL ID; later colliding rows are re-idded. That
      // direction is deliberate: ch.rig.key, ch.rig.hp, carry, slotInert, racked and
      // the four equip slots all already point at that id, and they meant the row that
      // was there first. A re-idded row therefore starts with NO per-entry state, which
      // is the settled ruling for a rig: state that cannot be attributed to one object
      // is dropped rather than duplicated onto another. It was only ever sharing the
      // first row's state anyway.
      // "Carries an id" means exactly what the skip clause below means by it: a truthy
      // e.id. That deliberately includes a hand-edited non-string id, because entryKey()
      // hands it straight back and two rows sharing it collide just the same; object
      // keys coerce, so 5 and "5" are one reservation here, as they are one key there.
      // null-prototype: an id like "constructor" or "toString" would otherwise read
      // as already taken through the prototype chain, so a row that is the only one
      // carrying it would be judged a duplicate and silently re-idded, losing the
      // per-entry state that legitimately belongs to it.
      var reservedIds = Object.create(null), usedIds = Object.create(null);
      ch.equipment.forEach(function (e) { if (e && e.id) reservedIds[e.id] = 1; });
      function mintId() {
        var id;
        do { id = "eq_" + Math.random().toString(36).slice(2, 9); } while (reservedIds[id] || usedIds[id]);
        usedIds[id] = 1;
        return id;
      }
      ch.equipment.forEach(function (e) {
        var stackable = (EN.engine && EN.engine.isStackableName) ? EN.engine.isStackableName(e.name) : true;
        // A row carrying an id that an earlier row already claimed gets a fresh one.
        // Stackability is irrelevant here: a pooled row that carries an id is already
        // id-keyed by entryKey(), so re-idding the duplicate disambiguates it without
        // changing which branch of entryKey() it uses.
        if (e.id) {
          if (usedIds[e.id]) e.id = mintId();
          else usedIds[e.id] = 1;
        }
        // Two predicates used to disagree about a row with a MISSING or non-numeric
        // qty: this one skipped it, so it never received an instance id, while the
        // engine's ownership test (`e.qty != null && e.qty <= 0` -> not owned) counted
        // it as owned. engine.entryKey() then fell back to the item NAME forever, so two
        // such rows collided on one key: one shared damage slot, two picker options with
        // the same value leaving one piece unaddressable, a doubled crafting-bench chip.
        // Normalizing that qty to 1 on a NON-STACKABLE row makes both predicates agree
        // that the row is one owned thing, and it receives an id like any other, which
        // is the invariant every per-piece map (ch.rig.hp today, armor and shield state
        // later) needs: every owned non-stackable row carries an eq_ id.
        // Deliberately NOT touched: stackable rows and unknown/custom items, which are
        // pooled and legitimately keyed on their name; any row that already splits
        // (qty > 0, including a numeric string, which keeps its full count); and any row
        // the engine also reads as unowned (qty 0, negative, or ""), which stays id-less
        // because the two predicates already agree about it.
        if (!e.id && !stackable && !(e.qty > 0) && !(e.qty != null && e.qty <= 0)) e.qty = 1;
        /* ONE ROW IS NOT ONE PIECE, and the skip clause used to assume it was. `e.id`
           short-circuited before qty was ever looked at, so `{id:"eq_x", name:"Kevlar
           Weave", qty:3}` stayed a single row: three suits sharing one entryKey, one
           repair state, one damage slot, one picker option. That is the whole collision
           set the duplicate-id fix closed, reached through the other operand.

           It matters because the floor this block sells to Armor Repair is per-PIECE,
           not per-row: "two Kevlar Weaves cannot share a repair state no matter how the
           record was authored" is false while an authored qty:3 is one row. So a
           non-stackable owned row splits on its count whether or not it carries an id.

           THE FIRST INSTANCE KEEPS THE ROW'S ORIGINAL ID, for exactly the reason the
           duplicate pass keeps it for the first-seen row: ch.rig.key, ch.rig.hp,
           armorWear, armorGuard, shieldWear, carry, slotInert, racked and the four equip
           slots already point at that id and they meant this row. The instances split off
           it are new objects with minted ids and therefore no per-entry state, which is
           the settled ruling that unattributable state is dropped rather than duplicated
           onto another piece.

           Untouched: pooled rows (a stackable qty IS a stack, not a set of pieces),
           unowned rows, and an id-carrying row that is already exactly one piece, which
           takes the same push-as-is path it always did so that records without a
           qty > 1 row migrate byte-identically. */
        if (stackable || !(e.qty > 0) || (e.id && !(e.qty > 1))) {
          splitEquipment.push(e);
          return;
        }
        var n = e.qty, ids = [];
        for (var i = 0; i < n; i++) {
          var ne = {};
          Object.keys(e).forEach(function (k) { if (k !== "qty") ne[k] = e[k]; });
          ne.id = (i === 0 && e.id) ? e.id : mintId();
          ne.qty = 1;
          splitEquipment.push(ne);
          ids.push(ne.id);
        }
        nameToIds[e.name] = ids;
      });
      ch.equipment = splitEquipment;
      function firstId(name) { return (nameToIds[name] || [])[0] || null; }
      if (Array.isArray(ch.equippedWeapons)) {
        ch.equippedWeapons = ch.equippedWeapons.map(function (n) { return nameToIds[n] ? firstId(n) : n; }).filter(Boolean);
      }
      ["equippedArmor", "equippedShield", "equippedFocus"].forEach(function (slot) {
        if (ch[slot] && nameToIds[ch[slot]]) ch[slot] = firstId(ch[slot]);
      });
      if (ch.carry && typeof ch.carry === "object") {
        var newCarry = {};
        Object.keys(ch.carry).forEach(function (name) { newCarry[nameToIds[name] ? firstId(name) : name] = ch.carry[name]; });
        ch.carry = newCarry;
      }
      if (ch.slotInert && typeof ch.slotInert === "object") {
        var newSlotInert = {};
        Object.keys(ch.slotInert).forEach(function (name) { newSlotInert[nameToIds[name] ? firstId(name) : name] = ch.slotInert[name]; });
        ch.slotInert = newSlotInert;
      }
      // ch.racked is the one per-entry map that maps an entry to ANOTHER entry
      // ({itemEntryKey: carryGearEntryKey}), so BOTH sides rekey. It was the only map
      // this pass forgot, and the omission did not just orphan a rack, it made the
      // record unstable across loads: the carry sanitizer above downgrades a "racked"
      // status whose ch.racked target is missing, so load 1 left carry "racked" with a
      // name-keyed rack and load 2 quietly rewrote it to "carried".
      if (ch.racked && typeof ch.racked === "object") {
        var newRacked = {};
        Object.keys(ch.racked).forEach(function (name) {
          var target = ch.racked[name];
          newRacked[nameToIds[name] ? firstId(name) : name] = nameToIds[target] ? firstId(target) : target;
        });
        ch.racked = newRacked;
      }
      /* THE THREE WEAPON MAPS, name-keyed until now, re-keyed to equipment ENTRIES.
         Brandon's ruling of 2026-08-12: "same-named weapons should be independently
         moddable", and the magazine and the grip follow the mods for the same reason. A
         forced two-handed grip comes FROM a Part fitted to one piece, so grip could not
         stay name-keyed once parts moved; ammo was the one genuine choice and was ruled
         per-entry too, so two pistols no longer draw from one magazine.

         The shared state goes to the FIRST instance of that name and the others start
         clean, which is the same ruling the split above already applies to armor wear and
         Rig damage: state that cannot be attributed to one piece is not duplicated onto
         another. It is also the arithmetic the player already owns. One Extended Shaft
         installed "on the Quarterstaff" used to arm every Quarterstaff at once; you own
         one Part, so exactly one of them keeps it.

         State naming a weapon the character does not own is DROPPED rather than carried,
         for the same reason the wear maps drop an orphan: there is no piece for it. */
      /* The name -> first-entry lookup is built from the FINAL equipment array and not from
         nameToIds, which is the trap here: nameToIds is only populated for rows the split
         actually fanned, so an ordinary `{id:"eq_x", name:"Quarterstaff", qty:1}` row never
         appears in it. Keying off nameToIds dropped the install on every weapon that did
         not split, which is the common case. Measured, on a two-Quarterstaff record whose
         Extended Shaft vanished entirely. */
      var firstEntryOfName = Object.create(null), ownedKeys = Object.create(null);
      ch.equipment.forEach(function (e) {
        if (!e || typeof e.name !== "string") return;
        var k = e.id || e.name;
        ownedKeys[k] = 1;
        if (firstEntryOfName[e.name] === undefined) firstEntryOfName[e.name] = k;
      });
      /* armorMods and vehicleMods joined this list on 2026-08-12, when Brandon extended the
         ruling: "same needs to go for same-named armor, vehicles, smartdecks and trauma
         rigs, they should be independently moddable too". Armor was the sharpest case,
         because the SAME suit was already addressed two ways: armorWear, armorGuard and
         shieldWear were entry-keyed while armorMods was name-keyed, so a damaged Courier
         Shell knew which piece it was and a modded one did not. */
      ["weaponParts", "weaponGrip", "weaponAmmo", "armorMods", "vehicleMods"].forEach(function (field) {
        var src = ch[field];
        if (!src || typeof src !== "object" || Array.isArray(src)) { ch[field] = Object.create(null); return; }
        var out = Object.create(null);
        Object.keys(src).forEach(function (k) {
          // already an entry key: a record saved after this change, a re-run, or a pooled
          // row whose entryKey IS its name. Left exactly where it is.
          if (ownedKeys[k]) { if (out[k] === undefined) out[k] = src[k]; return; }
          var id = firstEntryOfName[k];
          if (id && out[id] === undefined) out[id] = src[k];
        });
        ch[field] = out;
      });
    }
    /* THE MERGE, and it runs AFTER the split for the reason the split states: it is
       equipment-keyed, so it needs entries that already carry their real ids.

       Brandon's 2026-08-12 ruling made consumables and mods pool. Everything bought
       BEFORE that is already on disk as one id-bearing row per copy, and flipping the
       flag does not fold them: addToStash only merges into a row with no id, so the next
       purchase opens a fresh pooled row beside the old ones and one name ends up in two
       shapes at once. Counting survives that (ownedQtyOf sums every row of a name, fixed
       first for exactly this reason), so this is not load-bearing for correctness. It is
       here so the Stash stops showing four cards for four identical chips.

       ONLY BARE ROWS MERGE. A row carrying anything beyond id/name/qty, or an id that any
       per-entry map still points at, is left exactly where it is. That is the standing
       ruling applied honestly: unattributable state is DROPPED rather than moved, so
       rather than merge a row and silently discard the carry status or lease clock keyed
       on its id, the row simply does not merge. It stays a per-instance stray, which the
       summing counter already handles, and no state is destroyed to tidy a display. */
    if (Array.isArray(ch.equipment)) {
      var claimed = Object.create(null);
      [ch.carry, ch.slotInert, ch.racked, ch.armorWear, ch.armorGuard, ch.shieldWear].forEach(function (m) {
        if (m && typeof m === "object") Object.keys(m).forEach(function (k) { claimed[k] = 1; });
      });
      if (ch.racked && typeof ch.racked === "object") {
        Object.keys(ch.racked).forEach(function (k) { claimed[ch.racked[k]] = 1; });
      }
      [ch.equippedArmor, ch.equippedShield, ch.equippedFocus].forEach(function (k) { if (k) claimed[k] = 1; });
      (ch.equippedWeapons || []).forEach(function (k) { claimed[k] = 1; });
      if (ch.rig && ch.rig.key) claimed[ch.rig.key] = 1;
      if (ch.rig && ch.rig.hp && typeof ch.rig.hp === "object") {
        Object.keys(ch.rig.hp).forEach(function (k) { claimed[k] = 1; });
      }
      var BARE = { id: 1, name: 1, qty: 1 };
      var pooledRow = Object.create(null);
      ch.equipment = ch.equipment.filter(function (e) {
        if (!e || typeof e.name !== "string") return true;
        var poolable = (EN.engine && EN.engine.isStackableName) ? EN.engine.isStackableName(e.name) : false;
        if (!poolable) return true;
        if (e.id && claimed[e.id]) return true;                       // some map still names this row
        if (Object.keys(e).some(function (k) { return !BARE[k]; })) return true;   // carries its own fields
        var q = Number(e.qty);
        if (!(isFinite(q) && q > 0)) return true;                     // unowned rows are the split's business
        var keep = pooledRow[e.name];
        if (!keep) { pooledRow[e.name] = e; delete e.id; e.qty = q; return true; }
        keep.qty = Number(keep.qty) + q;
        return false;
      });
    }
    /* THE Fits GATE, on data that predates it, and it runs HERE rather than beside the
       part rename above because it needs to know WHICH WEAPON each loadout belongs to and
       the map is only keyed on the entry once the re-key above has run. Sited earlier it
       worked exactly once: on the second load the keys were entry ids, catalogItem(<id>)
       answered null, and the sweep skipped every loadout while reading as if it had passed.

       Extended Shaft went from "Fits: Any Melee" to "Fits: Long-Shafted", which Part 3
       calls "a HARD frame gate", so an install saved under the old rule may sit on a weapon
       that cannot take it and still pay out +1 Reach and still force two hands.

       Nothing is destroyed: an install is a key in weaponParts, the OWNED part is a
       separate equipment entry, and removePart() in the bench does exactly this and no
       more. The part returns to the stash pool and the bench declines to re-fit it.

       An entry whose name has no catalog item is left ALONE. The gate is a fact about the
       weapon, and an unknown weapon is a question we cannot answer, not an answer of no. */
    var partsByKey = (EN.weaponParts && EN.weaponParts.byKey) || {};
    Object.keys(ch.weaponParts).forEach(function (wKey) {
      var lo = ch.weaponParts[wKey];
      if (!lo || typeof lo !== "object") return;
      var e = (ch.equipment || []).find(function (x) { return (x.id || x.name) === wKey; });
      var wit = (e && EN.engine && EN.engine.catalogItem) ? EN.engine.catalogItem(e.name) : null;
      if (!wit) return;
      function illegal(k) {
        var p = partsByKey[k];
        if (!p || p.fits !== "Long-Shafted") return false;
        return !(EN.engine && EN.engine.isLongShafted && EN.engine.isLongShafted(wit));
      }
      ["targeting", "output", "core", "handling"].forEach(function (sl) {
        if (typeof lo[sl] === "string" && illegal(lo[sl])) lo[sl] = null;
      });
      if (Array.isArray(lo.utility)) lo.utility = lo.utility.filter(function (k) { return !illegal(k); });
    });
    /* Trauma Rig state; absent on every character built before Rigs existed.
       Both the pick and the damage are keyed on the EQUIPMENT ENTRY, so they name one
       specific Rig instead of a tier that any number of Rigs can share. Which is why
       this block sits HERE, after the instance-id split above and not beside the other
       equipment defaults: it resolves entry keys, so it has to run once the entries
       actually carry their ids. See the ordering rule at the split.
       Records saved before that carry {tier, scrap, hpSpent, hpTier}, all of them tier
       names, and are converted here:
         - tier      -> key, if the character still owns a Rig of that tier. An unowned
                        pick is dropped, which is what the engine was already doing with
                        it, and it cannot come back: a re-bought Rig is a new entry.
         - hpSpent   -> hp[key] for the Rig hpTier names, again only if one is owned.
                        Damage that cannot be attributed to an entry is dropped, per the
                        ruling that an unattributable Rig arrives at full Integrity.
       Then hp is pruned to entries the character still holds, so a campaign's worth of
       bought-and-dropped Rigs cannot make the map grow without bound, and a pick whose
       entry is gone is cleared for the same reason. Every read is type-guarded: junk in
       any field, an hp that is already present, a rig that is an array or a string, and a
       record with no ch.rig at all all normalize without throwing. */
    if (!ch.rig || typeof ch.rig !== "object" || Array.isArray(ch.rig)) ch.rig = {};
    var rg = ch.rig;
    rg.scrap = !!rg.scrap;
    var oldTier = typeof rg.tier === "string" ? rg.tier : null;
    var oldHpTier = typeof rg.hpTier === "string" ? rg.hpTier : null;
    var oldSpent = (typeof rg.hpSpent === "number" && isFinite(rg.hpSpent) && rg.hpSpent > 0) ? Math.floor(rg.hpSpent) : 0;
    delete rg.tier; delete rg.hpSpent; delete rg.hpTier;
    if (typeof rg.key !== "string") rg.key = null;
    if (!rg.hp || typeof rg.hp !== "object" || Array.isArray(rg.hp)) rg.hp = {};
    // the engine owns the ownership question, here as everywhere else
    var ownedRigs = (EN.engine && EN.engine.ownedRigs) ? EN.engine.ownedRigs(ch) : [];
    var liveKeys = Object.create(null);   // null-prototype, same reason as the split above
    ownedRigs.forEach(function (o) { liveKeys[o.key] = 1; });
    function firstKeyOfTier(tier) {
      var hit = ownedRigs.find(function (o) { return o.row.tier === tier; });
      return hit ? hit.key : null;
    }
    if (!rg.key && oldTier) rg.key = firstKeyOfTier(oldTier);
    if (oldSpent > 0 && oldHpTier) {
      var dmgKey = firstKeyOfTier(oldHpTier);
      if (dmgKey && rg.hp[dmgKey] == null) rg.hp[dmgKey] = oldSpent;
    }
    Object.keys(rg.hp).forEach(function (k) {
      var v = rg.hp[k];
      if (!liveKeys[k] || typeof v !== "number" || !isFinite(v) || v <= 0) delete rg.hp[k];
      else rg.hp[k] = Math.floor(v);
    });
    if (rg.key && !liveKeys[rg.key]) rg.key = null;
    /* Environmental Hazards state. This block sits HERE, after the instance-id
       split, for the same reason ch.rig does and under the same ordering rule
       written at the split: thermalWeave, and the caustic ledger this block now
       retires, are keyed on an EQUIPMENT ENTRY, so they can only be resolved and
       pruned once the entries actually carry their ids. Written twenty lines
       earlier, beside the other equipment defaults, they would key on the armor
       NAME and the split would orphan every one of them.

       Every map keyed on a user-supplied string is null-prototype. An exposure
       id or an entry key of "constructor" or "toString" would otherwise read as
       present through the prototype chain and be mistaken for real state.

       Unattributable state is DROPPED, not moved or clamped: a recorded weave
       tuning or a recorded caustic DR loss whose armor entry has left the
       equipment list is deleted, exactly as ch.rig.hp prunes, so a re-bought
       suit arrives at full DR and untuned rather than inheriting a stranger's
       damage. */
    if (!ch.hazards || typeof ch.hazards !== "object" || Array.isArray(ch.hazards)) ch.hazards = {};
    var hz = ch.hazards;
    var HZ = EN.hazards || {};
    var okType = HZ.typeByKey || {}, okSev = HZ.severityByKey || {};
    function nn(v) { return (typeof v === "number" && isFinite(v) && v > 0) ? Math.floor(v) : 0; }
    // exposures: one row per LIVE exposure, each with its own escalating save
    // count. A row naming a type or severity that does not exist is noise, and
    // Deprivation is never an exposures row (it has its own three clocks).
    var exIn = (hz.exposures && typeof hz.exposures === "object" && !Array.isArray(hz.exposures)) ? hz.exposures : {};
    var exOut = Object.create(null);
    Object.keys(exIn).forEach(function (id) {
      var r = exIn[id];
      if (!r || typeof r !== "object" || Array.isArray(r)) return;
      if (!okType[r.type] || r.type === "deprivation") return;
      if (!okSev[r.severity]) return;
      exOut[id] = { type: r.type, severity: r.severity, saves: nn(r.saves),
                    fatigue: nn(r.fatigue), minutes: nn(r.minutes), clockMinutes: nn(r.clockMinutes) };
    });
    hz.exposures = exOut;
    // deprivation: exactly the three tracks the rules name, always all three
    var depIn = (hz.deprivation && typeof hz.deprivation === "object" && !Array.isArray(hz.deprivation)) ? hz.deprivation : {};
    var depOut = Object.create(null);
    (((HZ.exposure || {}).deprivation || {}).tracks || [{ key: "water" }, { key: "food" }, { key: "sleep" }]).forEach(function (t) {
      var r = (depIn[t.key] && typeof depIn[t.key] === "object") ? depIn[t.key] : {};
      depOut[t.key] = { days: nn(r.days), saves: nn(r.saves), fatigue: nn(r.fatigue) };
    });
    hz.deprivation = depOut;
    // breath: the two kinds EN.hazards.breath declares, and nothing else
    var brIn = (hz.breath && typeof hz.breath === "object" && !Array.isArray(hz.breath)) ? hz.breath : {};
    var brOut = Object.create(null);
    (((HZ.breath || {}).kinds) || [{ key: "drowning" }, { key: "vacuum" }]).forEach(function (k) {
      var r = (brIn[k.key] && typeof brIn[k.key] === "object") ? brIn[k.key] : {};
      brOut[k.key] = { active: !!r.active, rounds: nn(r.rounds), saves: nn(r.saves) };
    });
    hz.breath = brOut;
    if (!hz.caustic || typeof hz.caustic !== "object" || Array.isArray(hz.caustic)) hz.caustic = {};
    hz.caustic.inside = !!hz.caustic.inside;
    hz.caustic.lingering = !!hz.caustic.lingering;
    hz.caustic.sceneTicks = nn(hz.caustic.sceneTicks);
    var eqKeys = Object.create(null);
    ((ch.equipment) || []).forEach(function (e) { var k = e && (e.id || e.name); if (k) eqKeys[k] = 1; });
    /* ch.hazards.caustic.armorDR is RETIRED. It was an entry-keyed ledger of caustic
       DR loss, written here because Armor Repair was on another branch and armor DR
       was immutable, and handed over through EN.armorRepair.applyDegradation once
       that branch merged. It merged as EN.crafting.armorRepair plus the engine's
       resolver and writer, so EN.armorRepair was never defined, the hook could not
       fire, and the loss sat pending forever.
       The raw value is CAPTURED here, where it still exists, and folded into
       ch.armorWear after the wear maps below are final: that map is the per-piece
       DR track the ledger was always a placeholder for, and merging into it before
       it is entry-keyed and clamped would be the ordering trap all over again.
       The field itself is dropped, so a second load finds nothing to merge. */
    var causticLedgerIn = null;
    if (hz.caustic.armorDR && typeof hz.caustic.armorDR === "object" && !Array.isArray(hz.caustic.armorDR)) {
      causticLedgerIn = Object.create(null);
      Object.keys(hz.caustic.armorDR).forEach(function (k) {
        var v = nn(hz.caustic.armorDR[k]);
        if (eqKeys[k] && v > 0) causticLedgerIn[k] = v;   // orphaned or empty: dropped, never moved
      });
    }
    delete hz.caustic.armorDR;
    // the Thermal Regulation Weave's install-time element, per ARMOR ENTRY
    var twIn = (hz.thermalWeave && typeof hz.thermalWeave === "object" && !Array.isArray(hz.thermalWeave)) ? hz.thermalWeave : {};
    var twOut = Object.create(null);
    Object.keys(twIn).forEach(function (k) {
      var v = twIn[k];
      if (eqKeys[k] && (v === "Fire" || v === "Cold")) twOut[k] = v;
    });
    hz.thermalWeave = twOut;
    hz.hazmatTorn = !!hz.hazmatTorn;
    if (typeof hz.rebreatherMinutes !== "number" || !isFinite(hz.rebreatherMinutes) || hz.rebreatherMinutes < 0) hz.rebreatherMinutes = 60;
    hz.rebreatherMinutes = Math.min(60, Math.floor(hz.rebreatherMinutes));

    /* Thin-air Fatigue attribution, character-scoped. A save written before this
       existed carries the attribution on its exposure ROWS instead, so it is
       recovered by summing the thin-air rows' own tallies once. That sum is the
       best available reading of the old shape and it is capped two ways: by the
       Fatigue the character actually holds, here, and again by the engine on
       every derive. A record whose thin-air Fatigue had already drifted above
       its real Fatigue therefore lands correct rather than importing the drift.
       Nothing seeds it out of thin air: a record with no thin-air row and no
       stored count gets 0. */
    if (typeof hz.thinAirFatigue !== "number" || !isFinite(hz.thinAirFatigue) || hz.thinAirFatigue < 0) {
      var seeded = 0;
      Object.keys(hz.exposures).forEach(function (id) {
        var r = hz.exposures[id];
        if (r && r.type === "thinair") seeded += Math.max(0, r.fatigue | 0);
      });
      hz.thinAirFatigue = seeded;
    }
    hz.thinAirFatigue = Math.floor(hz.thinAirFatigue);
    var fatigueHeld = ((ch.conditions || []).indexOf("Fatigue") !== -1)
      ? Math.max(0, ((ch.conditionLevels || {}).Fatigue | 0)) : 0;
    hz.thinAirFatigue = Math.min(hz.thinAirFatigue, fatigueHeld);

    /* Applied Status Changes: the hazards and the bonuses the player has put on
       the panel. Both are sanitized against the EN.statusChanges registry, so a
       key that no longer names an option is dropped rather than rendering as a
       blank row, and both maps are null-prototype because their keys arrive out
       of a save file.

       Applied-ness is STATED, not inferred. That distinction is the one this
       codebase has now paid for twice (the rig pick, the armor migration), and
       it is load-bearing here for a specific reason: a deprivation clock at 0
       days and a vacuum clock at 0 rounds are the resting state of a track
       nobody has applied AND of one that was applied a second ago. Reading the
       numbers cannot tell those apart, so the record says which it is.

       LEGACY RECORDS. A save written before this panel existed has live hazard
       state and no `applied` map at all. Inferring nothing would silently drop
       a running clock off the panel, so a record with no map (and only such a
       record) adopts one built from whatever is actually running. That is a
       one-time read of the numbers to seed the statement, not an ongoing
       inference: once the map exists it is authoritative, including when it is
       deliberately empty. */
    var SC = EN.statusChanges || null;
    var hadApplied = hz.applied && typeof hz.applied === "object" && !Array.isArray(hz.applied);
    var apIn = hadApplied ? hz.applied : {};
    var apOut = Object.create(null);
    Object.keys(apIn).forEach(function (k) {
      if (apIn[k] === true && (!SC || SC.isKey(k))) apOut[k] = true;
    });
    if (!hadApplied) {
      // seed from running state, once
      Object.keys(hz.deprivation || {}).forEach(function (t) {
        var r = hz.deprivation[t];
        if (r && ((r.days | 0) > 0 || (r.saves | 0) > 0 || (r.fatigue | 0) > 0)) apOut["deprivation:" + t] = true;
      });
      var vb = (hz.breath || {}).vacuum;
      if (vb && (vb.active || (vb.rounds | 0) > 0 || (vb.saves | 0) > 0)) apOut["environmental:vacuum"] = true;
      var cz = hz.caustic || {};
      if (cz.inside || cz.lingering || (cz.sceneTicks | 0) > 0) apOut["environmental:caustic"] = true;
    }
    hz.applied = apOut;

    var bnIn = (ch.bonuses && typeof ch.bonuses === "object" && !Array.isArray(ch.bonuses)) ? ch.bonuses : {};
    var bnOut = Object.create(null);
    Object.keys(bnIn).forEach(function (k) {
      if (bnIn[k] !== true) return;
      var opt = SC ? SC.get(k) : null;
      if (SC && (!opt || opt.menu !== "bonus")) return;   // not a bonus option any more
      bnOut[k] = true;
    });
    // An ally can hold only ONE Hot-Wire at a time. A hand-edited record can
    // carry several; keep the first one the record lists and drop the rest,
    // rather than letting the sheet claim two mutually exclusive buffs at once.
    // The panel's own apply path already replaces rather than stacks, so this
    // only ever fires for an imported or hand-edited file.
    if (SC) {
      var seenExclusive = Object.create(null);
      Object.keys(bnOut).forEach(function (k) {
        var opt = SC.get(k), g = opt && opt.exclusiveGroup;
        if (!g) return;
        if (seenExclusive[g]) delete bnOut[k];
        else seenExclusive[g] = k;
      });
    }
    ch.bonuses = bnOut;
    /* Per-piece defensive degradation: Shield Durability and Armor Repair. They are
       one mechanic wearing two names (a defensive piece that degrades and is repaired
       back toward its printed value), so they carry ONE shape, the same shape ch.rig.hp
       carries: {entryKey: points}. That is why this block sits HERE, after the
       instance-id split, and not beside the other equipment defaults a hundred lines
       up: it resolves entry keys. See the ordering rule at the split.

         ch.shieldWear   Durability boxes marked. WAS keyed on the shield's NAME, so two
                         Scrap Shields shared one wear track and a re-bought shield
                         arrived already worn. Converted here.
         ch.armorWear    DR points a suit has lost. New; the catalog `dr` is the base and
                         the ceiling, and an absent row means the suit is at full DR.
         ch.armorGuard   The quality edge a clean repair earns, one absorbed point of DR.

       CONVERSION RULE. A key that already names a LIVE entry is left alone. A key that
       names an ITEM is attributed to one entry only when one entry can be named with
       confidence, and is otherwise DROPPED:

         1. the EQUIPPED piece, when it is one of the entries carrying that name. This
            is not a tiebreak, it is what the legacy state meant. The old reader was
            (ch.shieldWear || {})[shield.name] with `shield` the WIELDED shield, and the
            old writer was markShieldWear, which returns early unless a shield is
            wielded and writes dg.shield.name. So a legacy name key can only ever have
            described the piece in the slot. Same for armor, whose DR was only ever read
            for ch.equippedArmor.
         2. otherwise the single owned entry of that name, when there is exactly one.
         3. otherwise NOTHING. Two or more candidates and nothing in the record that
            distinguishes them: the state is discarded.

       Clause 3 is the point. It used to read "that item's FIRST owned entry", which
       silently RELOCATED a save's damage onto a piece that was never damaged: wear a
       second Anvil Frame, load once, and the worn suit reads 5/5 while the spare in the
       stash reads 2/5 and holds the quality edge. Losing the wear costs one typed number
       and the player can see that it is gone; moving it is invisible and unrecoverable,
       because nobody knows it happened. Same asymmetry, and the same ruling, as the Rig
       damage that cannot be attributed to an entry.

       IDEMPOTENCY IS STATED, NOT INFERRED, and that is the design change this block
       needed rather than a fourth patch. It used to decide "this key is already
       converted" by testing whether the key happened to name a live entry. That is an
       inference from the key's SHAPE, and the shape is ambiguous: entryKey() is
       `e.id || e.name`, so a legitimately name-keyed row (a pooled or custom entry)
       puts a NAME into the live-key set. A legacy name key that collided with one of
       those was therefore read as "already an entry key" and left alone, which silently
       attributed a suit's wear to the colliding row instead of to the suit. The test
       could not tell a converted key from an unconverted one, because in that case
       they are the same string.

       So the record says which scheme its maps use. `ch.meta.wearKeys` is absent on
       every save written before this migration, which is exactly what "these keys are
       item names" means, and it is stamped to WEAR_KEY_SCHEME once the conversion has
       run. Under the legacy scheme EVERY key goes through attribution, with no
       shortcut to take; under the current scheme every key is already an entry key and
       the only work left is pruning ones whose entry has left the stash, the way
       ch.rig.hp prunes so the map cannot grow across a campaign.

       That also fixes the collision on its own terms rather than by special-casing it:
       a legacy "Anvil Frame" key with both a real suit and a pooled row of that name
       now reaches rule 1, which picks the EQUIPPED suit, and reaches rule 3 when
       nothing distinguishes the candidates.

       Rebuilt null-prototype: these keys are user-supplied strings, and a plain literal
       reads "constructor" and "toString" as already present. */
    var eqRows = Array.isArray(ch.equipment) ? ch.equipment : [];
    var wearLiveKeys = Object.create(null), wearKeysByName = Object.create(null);
    eqRows.forEach(function (e) {
      if (!e || (e.qty != null && e.qty <= 0)) return;
      var k = e.id || e.name;
      if (!k) return;
      wearLiveKeys[k] = 1;
      if (e.name) (wearKeysByName[e.name] = wearKeysByName[e.name] || []).push(k);
    });
    // The equip slot a legacy NAME key could have been describing, resolved to a live
    // entry key. A slot still holding a bare item name (an id-carrying record the split
    // had no reason to rekey) counts only when that name identifies exactly one owned
    // entry: an ambiguous slot is no more attributable than the wear key it would be
    // used to attribute.
    function equippedEntryKey(slotVal) {
      if (typeof slotVal !== "string" || !slotVal) return null;
      // Same ambiguity as the wear keys, one field over: `e.id || e.name` puts ids and
      // names in ONE namespace, so a string can be a live key for one entry and the
      // item NAME of others at the same time. Being a live key is therefore only proof
      // of identity when nothing else answers to that string as a name; otherwise it
      // falls through to the name rules, and an ambiguous slot is no more attributable
      // than the wear key it would be used to attribute.
      var alsoNames = wearKeysByName[slotVal] || [];
      var onlyItself = alsoNames.length === 0 || (alsoNames.length === 1 && alsoNames[0] === slotVal);
      if (wearLiveKeys[slotVal] && onlyItself) return slotVal;
      return alsoNames.length === 1 ? alsoNames[0] : null;
    }
    /* AND THE SLOT ITSELF IS NORMALIZED, not merely read. This is the same answer
       applied one field over, and without it the three wear maps lose everything the
       player records, silently, on every load.

       The split rekeys an equip slot only when the slot's value is a name it actually
       split (`nameToIds[ch[slot]]`), so a row that ARRIVED with an id and `qty: 1`
       populates nothing and a slot holding that row's NAME is left alone. Downstream
       nothing minds: `keyToName` hands an unmatched key straight back, `armorItem`
       resolves it, and the whole app runs with `dg.shieldKey === "Riot Shield"`. The
       Block row's wear button then writes `shieldWear["Riot Shield"]`, which is a
       perfectly good key to everything except the prune, which asks whether it names a
       LIVE ENTRY. It does not. The live key is `eq_s1`.

       Measured, through the real buttons: two Durability boxes and one point of DR
       recorded, displayed and persisted, then `{}` and back to 3 of 3 and 5 DR after one
       reload, with no message, repeating for as long as the record exists. Import puts
       the record in that state once and the app then stamps `meta.wearKeys`, so it is
       in-app and permanent from then on.

       Pre-existing rather than new: the prune has always asked for a live key. What is
       new is only that it is written down here and fixed at the source, which is the
       slot, rather than by teaching the prune to accept a name. Invariant 1 says
       per-piece state is keyed on the ENTRY; a slot that is not an entry key is the
       thing to correct.

       Unambiguous cases only. `equippedEntryKey` returns null when two owned entries
       answer to the name, and a null there means "leave the slot exactly as it is"
       rather than "unequip", because dropping a piece the player is wearing is a bigger
       harm than the one being fixed. */
    ["equippedArmor", "equippedShield", "equippedFocus"].forEach(function (slot) {
      var v = ch[slot];
      if (typeof v !== "string" || !v || wearLiveKeys[v]) return;   // absent, or already an entry key
      var resolved = equippedEntryKey(v);
      if (resolved) ch[slot] = resolved;
    });
    // The scheme the record states its wear maps are in. Absent means legacy item-name
    // keys, because no save written before this migration could have said otherwise.
    var WEAR_KEY_SCHEME = 2;
    if (!ch.meta || typeof ch.meta !== "object") ch.meta = {};
    var wearKeysAreEntries = ch.meta.wearKeys === WEAR_KEY_SCHEME;
    /* RESOLUTION RUNS IN TWO PASSES, AND THE ORDER IS NOT THE FILE'S TO CHOOSE.
       Rule 0 keys (unambiguously an entry already) are resolved FIRST, across the
       whole map, and only then do the name rules run. In one pass the outcome
       depended on JSON key order, because whichever key reached the entry first
       claimed it and `out[key] != null` dropped the other:

         {"eq_d1":1, "Anvil Frame":4}  ->  {eq_d1: 1}
         {"Anvil Frame":4, "eq_d1":1}  ->  {eq_d1: 4}

       Two logically identical records, two different numbers, and the authoritative
       key lost half the time. Reachable on any half-converted file (hand-merged, or
       exported mid-refactor). Resolving the certain keys before the inferred ones
       makes the answer a property of the record rather than of its serialization. */
    function migrateWearMap(field, slotField, valueOf, capOf) {
      var src = ch[field];
      if (!src || typeof src !== "object" || Array.isArray(src)) src = {};
      var wornKey = equippedEntryKey(ch[slotField]);
      var out = Object.create(null);
      /* Rule 0: a key that names a live entry AND that nothing else answers to as an
         item NAME is unambiguously that entry, so it is kept. This is NOT the old
         shortcut. The old one fired on "is this string a live key" alone, which is
         ambiguous precisely because entryKey() is `e.id || e.name` and one string can
         be an id here and an item name there. Narrowing it to "live and nothing else
         claims this string as a name" is the fix the review asked for: the ambiguous
         case re-enters the rules instead of skipping them.

         It has to exist, because armorWear and armorGuard are NEW fields that never
         had a legacy name-keyed form. Any record carrying them without the marker was
         written after they existed and is already entry-keyed; sending its keys
         through name attribution would find no item of that name and drop the wear.
         shieldWear is the one map with a genuine legacy shape, and a shield NAME is
         not a live entry key, so it still lands in the name rules. */
      function rule0(k) {
        var cands = wearKeysByName[k] || [];
        var onlyItself = cands.length === 0 || (cands.length === 1 && cands[0] === k);
        return !!(wearLiveKeys[k] && onlyItself);
      }
      // A value is only kept if the piece it names can actually hold it. The cap is
      // the piece's own printed ceiling (a suit's DR, a shield's boxes), so an
      // imported 999 on a base-5 suit is stored as 5 rather than displayed as 5 and
      // stored as 999. It used to be the second: the display clamped and the writer
      // did not, so a full rebuild computed 999 - 5 and left the suit breached after
      // charging for it. A cap of 0 means the key names nothing that can wear, which
      // is the same case as a key whose entry has left the stash: dropped.
      function place(k, key) {
        if (!key || out[key] != null) return;               // unattributable, or already claimed
        var v = valueOf(src[k]);
        if (v == null) return;
        if (capOf) {
          var cap = capOf(key);
          if (!(cap > 0)) return;
          if (typeof v === "number" && v > cap) v = cap;
        }
        out[key] = v;
      }
      var keys = Object.keys(src);
      if (wearKeysAreEntries) {
        // Already converted, because the RECORD says so. The only work left is the
        // prune: a key whose entry has left the stash describes a piece the character
        // no longer owns, and a re-acquired piece is a new entry, so its state is
        // dropped rather than inherited. Same ruling as ch.rig.hp. No two keys can
        // collide here, so there is nothing for a second pass to arbitrate.
        keys.forEach(function (k) { place(k, wearLiveKeys[k] ? k : null); });
      } else {
        keys.forEach(function (k) { if (rule0(k)) place(k, k); });
        keys.forEach(function (k) {
          if (rule0(k)) return;
          var cands = wearKeysByName[k] || [];
          var key = null;
          if (wornKey && cands.indexOf(wornKey) !== -1) key = wornKey;   // rule 1: the equipped piece
          else if (cands.length === 1) key = cands[0];                   // rule 2: the single owned entry
          // rule 3: nothing to attribute it to, or several equally likely pieces.
          // Leave `key` null and the state is dropped rather than moved.
          place(k, key);
        });
      }
      ch[field] = out;
    }
    function positiveInt(v) { return (typeof v === "number" && isFinite(v) && v > 0) ? Math.floor(v) : null; }
    // The ceilings, asked of the same resolvers every surface asks. A key naming an
    // entry that is not a shield (or not armor) caps at 0 and is dropped.
    function shieldCap(key) { var E = EN.engine; return (E && E.shieldState) ? E.shieldState(ch, key).boxesMax : Infinity; }
    function armorCap(key) { var E = EN.engine; return (E && E.armorState) ? E.armorState(ch, key).base : Infinity; }
    migrateWearMap("shieldWear", "equippedShield", positiveInt, shieldCap);
    migrateWearMap("armorWear", "equippedArmor", positiveInt, armorCap);
    migrateWearMap("armorGuard", "equippedArmor", function (v) { return v === true ? true : null; }, armorCap);
    // Stamped only after all three maps have converted, so a throw midway cannot leave
    // the record claiming a conversion that did not finish.
    ch.meta.wearKeys = WEAR_KEY_SCHEME;
    /* THE CAUSTIC LEDGER, FOLDED IN. Captured up in the hazards block (see the note
       there), applied here because ch.armorWear is only now entry-keyed, pruned and
       clamped. Both are {armorEntryKey: DR lost}, so the merge is addition capped at
       the suit's own base.
       The quality edge is deliberately NOT spent: armorGuard absorbs the NEXT point a
       suit would lose, and this is a loss the record already took, possibly long before
       the guard was earned. Cashing it retroactively would invent history.
       Built into a fresh map and assigned in one statement, the way the wear marker is
       stamped only once its maps are done: a throw partway through cannot leave half a
       merge behind for the next load to add on top of, and the ledger field is already
       gone, so there is nothing to merge twice. */
    if (causticLedgerIn) {
      var merged = Object.create(null);
      Object.keys(ch.armorWear).forEach(function (k) { merged[k] = ch.armorWear[k]; });
      Object.keys(causticLedgerIn).forEach(function (k) {
        if (!wearLiveKeys[k]) return;
        var cap = armorCap(k);
        if (!(cap > 0)) return;                       // names nothing that can wear
        merged[k] = Math.min(cap, (merged[k] | 0) + causticLedgerIn[k]);
      });
      ch.armorWear = merged;
    }
    // cyberware: legacy string entries → objects. sp:0 so old manual marks don't
    // retroactively spike Static; chrome bought from the market carries real SP.
    if (Array.isArray(ch.cyberware)) {
      ch.cyberware = ch.cyberware.map(function (cw) {
        if (typeof cw !== "string") return cw;
        var def = (EN.cyberware && EN.cyberware.items || []).find(function (i) { return i.name === cw || i.short === cw; });
        return { base: cw, name: cw, tier: null, zone: (def && def.zone) || "Hardware", sp: 0, side: null, custom: true };
      });
    }
    if (!ch.cyberStash) ch.cyberStash = [];   // purchased-but-uninstalled chrome
    // Starting Gear Kit claim state. A hand-edited/imported save can carry
    // garbage here, and UNDO mutates equipment and Glimmer off these fields,
    // so every granted element must be a {key, qty} shape and glimmerGranted
    // a real non-negative number (NaN or a negative would poison the ledger).
    if (!ch.startingKit || typeof ch.startingKit !== "object") {
      ch.startingKit = { claimed: false, picks: {}, alt: false, granted: [], glimmerGranted: 0, claimedClass: null, claimedSubclass: null };
    }
    if (!ch.startingKit.picks || typeof ch.startingKit.picks !== "object") ch.startingKit.picks = {};
    if (!Array.isArray(ch.startingKit.granted)) ch.startingKit.granted = [];
    ch.startingKit.granted = ch.startingKit.granted.filter(function (g) {
      return g && typeof g === "object" && typeof g.key === "string" &&
             typeof g.qty === "number" && isFinite(g.qty) && g.qty > 0;
    });
    if (typeof ch.startingKit.glimmerGranted !== "number" || !isFinite(ch.startingKit.glimmerGranted) || ch.startingKit.glimmerGranted < 0) {
      ch.startingKit.glimmerGranted = 0;
    }
    if (!ch.grid || typeof ch.grid !== "object") ch.grid = { deckKey: null, deckHpSpent: {}, deckMods: {}, links: [] };
    else {
      /* THE DECK BECAME AN OWNED ENTRY on 2026-08-20, the shape a Trauma Rig already used.
         Before this, ch.grid held deckType and deckTier as loose strings with a single flat
         deckMods array and one deckHpSpent number, so a character owning two identical decks
         had one loadout and one damage total between them.

         The old state is moved onto whichever OWNED entry matches the recorded type and tier.
         If no owned deck matches it is DROPPED, not relocated to some other deck: per the
         standing rule, state that cannot be attributed to a specific piece is discarded rather
         than credited to the wrong one. A character who recorded an Apex deck they no longer
         own loses the recording, which is correct, because the engine would refuse to resolve
         it anyway. Mods and damage are dropped together with it: half-migrated state that
         survives on a deck nobody selected is worse than a clean slate. */
      if (ch.grid.deckKey === undefined) ch.grid.deckKey = null;
      var _oldType = ch.grid.deckType, _oldTier = ch.grid.deckTier;
      var _flatMods = Array.isArray(ch.grid.deckMods) ? ch.grid.deckMods.slice() : null;
      var _flatHp = (typeof ch.grid.deckHpSpent === "number") ? ch.grid.deckHpSpent : null;

      if (_flatMods || _flatHp !== null || _oldType || _oldTier) {
        var _match = null;
        if (_oldType && _oldTier) {
          (ch.equipment || []).forEach(function (e) {
            if (_match || !e || (e.qty != null && e.qty <= 0)) return;
            var it = (EN.engine && EN.engine.catalogItem) ? EN.engine.catalogItem(e.name) : null;
            if (it && it.deckType === _oldType && it.deckTier === _oldTier) _match = (e.id || e.name);
          });
        }
        ch.grid.deckMods = Object.create(null);
        ch.grid.deckHpSpent = Object.create(null);
        if (_match) {
          ch.grid.deckKey = _match;
          if (_flatMods && _flatMods.length) ch.grid.deckMods[_match] = _flatMods;
          if (_flatHp) ch.grid.deckHpSpent[_match] = _flatHp;
        } else {
          ch.grid.deckKey = null;   // unattributable: dropped, never moved
        }
        delete ch.grid.deckType;
        delete ch.grid.deckTier;
      }

      if (!ch.grid.deckMods || typeof ch.grid.deckMods !== "object" || Array.isArray(ch.grid.deckMods)) ch.grid.deckMods = Object.create(null);
      if (!ch.grid.deckHpSpent || typeof ch.grid.deckHpSpent !== "object" || Array.isArray(ch.grid.deckHpSpent)) ch.grid.deckHpSpent = Object.create(null);
      if (!Array.isArray(ch.grid.links)) ch.grid.links = [];
    }

    /* ONE-TIME: materialize the AUTO fallback that used to run on every derive.

       Until 2026-08-21 the engine silently stood in the best owned deck and the best owned
       Trauma Rig whenever nothing was recorded. Selection now happens by equipping in the
       Stash and that fallback is gone, so without this pass a Stitcher who never touched the
       old dropdown would lose their Output Bonus and their Triage Save DC would drop from up
       to 11 to 8, and a Codebreaker's whole #GRID block would collapse. This writes the
       fallback's own answer into storage so nobody's numbers move on upgrade.

       THE STAMP IS THE ENTIRE SAFETY OF THIS. Run unstamped and it re-equips on every load,
       which would make "no deck" and "no Rig" permanently unreachable: the player un-equips,
       reloads, and it is back. Gate first, act second.

       Ordering is not optional. It runs here, AFTER the instance-id split (keys must be final),
       AFTER the ch.rig prune that nulls rg.key when its entry is gone, and AFTER the ch.grid
       block above. A pre-split save with a name-keyed rig.key is pruned to null by that pass;
       the old fallback used to re-pick the same Rig so nobody noticed, and this is what covers
       it now. Move this earlier and old saves quietly lose their Rig. */
    ch.meta = ch.meta || {};
    if (!ch.meta.equipSlots) {
      var _eng = EN.engine || {};
      if (!ch.grid.deckKey && _eng.ownedDecks) {
        var _od = _eng.ownedDecks(ch);          // already sorted best first
        if (_od.length) ch.grid.deckKey = _od[0].key;
      }
      if (ch.rig && !ch.rig.key && !ch.rig.scrap && _eng.ownedRigs) {
        var _or = _eng.ownedRigs(ch);
        if (_or.length) ch.rig.key = _or[0].key;
      }
      ch.meta.equipSlots = 1;
    }
    /* OVERDRIVE MANEUVERS, rewritten 2026-08-24: eight became ten, five were renamed, and one
       name was REUSED. `ch.gambits` stores chosen abilities by NAME (there are no keys for
       them), so this is a rename over save data and it has to be exactly right.

       "Wrecking Ball" is the whole problem. It used to be a melee strike, now called Beyond the
       Bone; the name itself was handed to what used to be Bring the House Down, a structure
       demolition. A retired name fails loudly. A REUSED one resolves quietly to the wrong
       ability, and the character ends up holding something they never picked with nothing to
       show it went wrong.

       WHY A ONE-TIME STAMP AND NOT A DATE. The handoff called for splitting on whether the save
       predates the 2026-08-23 revision. A stamp is strictly better here, and not because dates
       are unavailable (ch.meta.createdAt and updatedAt both exist): it is that the app only ever
       offered the OLD list until this build shipped. Every "Wrecking Ball" sitting in a save at
       the moment this runs was therefore written by the old list, whatever its timestamps say.
       updatedAt in particular is refreshed on every write, so a legacy character opened this
       morning already looks new. The stamp reads the one fact that actually settles it, which is
       whether this pass has run for this character yet, and it leaves no ambiguous middle for a
       re-pick prompt to clean up.

       SINGLE PASS, NOT IN PLACE. Each stored name is mapped through the table exactly once and
       collected into a NEW array. Rewriting in place would send Bring the House Down to Wrecking
       Ball and then straight on to Beyond the Bone, which is the very corruption this exists to
       stop. The same reasoning is written on TALENT_RENAMES above, for the same reason. */
    if (!ch.meta.overdriveNames) {
      var MAN_RENAMES = Object.create(null);
      (((EN.classes || {}).fury || {}).resource || {}).abilityRenames &&
        EN.classes.fury.resource.abilityRenames.forEach(function (r) {
          if (r && r.oldName && r.name) MAN_RENAMES[r.oldName] = r.name;
        });
      if (Array.isArray(ch.gambits) && ch.gambits.length) {
        var seen = Object.create(null), out = [];
        ch.gambits.forEach(function (nm) {
          var to = (typeof nm === "string" && MAN_RENAMES[nm]) ? MAN_RENAMES[nm] : nm;
          // a rename can collapse two picks onto one name only if the save was already
          // inconsistent; keep the list a set either way rather than showing a duplicate chip
          if (typeof to === "string" && !seen[to]) { seen[to] = true; out.push(to); }
        });
        ch.gambits = out;
      }
      ch.meta.overdriveNames = 1;
    }
    /* FILED. The Freelancer rail hides itself until the active record has been
       through #PRINT's Submit & File, which stamps meta.filedAt. Records from
       before that gate shipped (2026-09) predate the stamp entirely, so they
       are GRANDFATHERED: stamped as filed on their first load after it. The
       alternative is every existing player losing their tabs until they walk
       back to step 07 and re-certify, for a rule that did not exist when they
       filed. A record born after the gate carries filedGate from
       newCharacter() and is left alone, so only Submit & File can ever stamp it.
       Same one-time-stamp shape as wearKeys and overdriveNames above. */
    if (!ch.meta.filedGate) {
      if (!ch.meta.filedAt) ch.meta.filedAt = ch.meta.updatedAt || ch.meta.createdAt || Date.now();
      ch.meta.filedGate = 1;
    }
    // drop a stored subclass that no longer exists (e.g. after a class rework) so it re-surfaces as a pick
    if (ch.class && ch.subclass && EN.classes && EN.classes[ch.class]) {
      var subs = EN.classes[ch.class].subclasses || [];
      if (!subs.some(function (s) { return s.key === ch.subclass; })) ch.subclass = null;
    }
  }

  /* ---- persistence ------------------------------------------------------ */
  function load() {
    try {
      var roster = JSON.parse(localStorage.getItem(KEY_ROSTER) || "{}");
      var activeId = localStorage.getItem(KEY_ACTIVE) || null;
      state.roster = roster && typeof roster === "object" ? roster : {};
      /* Migrate each record in its OWN try. The outer catch below is the last
         resort for a genuinely unreadable store (bad JSON, localStorage denied),
         and its answer is to discard the whole roster. That answer is far too big
         for one malformed record: a single throw inside migrate() used to take
         every other character on the device with it, and the next persist() wrote
         that emptiness back over the top. The normalization above makes the known
         throws impossible, but this is the structural half, and it is the half
         that keeps a future unguarded read from costing somebody their roster.

         A record that still cannot be migrated is DROPPED from the roster rather
         than kept half-normalized, because every reader downstream assumes
         migrate() ran to completion. It is left in localStorage untouched until
         the next persist, and it is named in the console so it can be recovered
         by hand. Losing one record is recoverable; losing five is not. */
      var failed = [];
      Object.keys(state.roster).forEach(function (id) {
        try { migrate(state.roster[id]); }
        catch (e) { failed.push(id); console.error("Character " + id + " could not be migrated and was dropped from this session.", e); }
      });
      failed.forEach(function (id) { delete state.roster[id]; });
      state.activeId = activeId && state.roster[activeId] ? activeId : (Object.keys(state.roster)[0] || null);
    } catch (e) {
      console.warn("Load failed; starting fresh.", e);
      state.roster = {}; state.activeId = null;
    }
    return state;
  }
  var saveTimer = null;
  function persist(immediate) {
    function doWrite() {
      try {
        localStorage.setItem(KEY_ROSTER, JSON.stringify(state.roster));
        localStorage.setItem(KEY_ACTIVE, state.activeId || "");
      } catch (e) { console.error("Persist failed", e); }
    }
    if (immediate) { doWrite(); return; }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(doWrite, 350);
  }

  /* ---- accessors -------------------------------------------------------- */
  function active() {
    if (state.example) return state.example;
    return state.activeId ? state.roster[state.activeId] : null;
  }
  function activeIsExample() { return !!state.example; }
  /* Examples come from the data file every time rather than from storage, so a fresh copy is
     minted on each selection and migrate() normalizes it exactly as it would an import. */
  /* Examples are PATCHES over a real blank character, not full records. A stored 70-field copy
     would rot the moment a new default field is added: the example would be the one character
     in the app missing it. Patching means they inherit every future default for free. */
  function deepPatch(target, patch) {
    Object.keys(patch || {}).forEach(function (k) {
      var v = patch[k];
      if (v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object" && !Array.isArray(target[k])) {
        deepPatch(target[k], v);
      } else {
        target[k] = (v && typeof v === "object") ? JSON.parse(JSON.stringify(v)) : v;
      }
    });
    return target;
  }
  function setExample(key) {
    var src = (EN.examples || []).find(function (x) { return x.key === key; });
    if (!src) return null;
    var ch = deepPatch(newCharacter(src.name || ""), src.patch || {});
    ch.name = src.name || ch.name;
    ch.meta = ch.meta || {};
    ch.meta.id = "ex_" + key;
    ch.meta.example = key;
    try { migrate(ch); } catch (e) { console.error("Example " + key + " failed to migrate", e); return null; }
    state.example = ch;
    persist(true);   // records only that no roster character is active; the example itself is never written
    emit();
    return ch;
  }
  function clearExample() { state.example = null; }
  /* Copy the live example into the roster as a character the player owns. The example itself is
     untouched, so the pristine version is still in the dropdown afterwards. */
  /* The copy keeps the example's own name. A "(copy)" suffix was tried and is a lie: migrate()
     recomposes ch.name from firstName, handle and lastName on every load, so the suffix
     survives exactly until the next reload and then silently disappears. Rename it in Manage
     characters, which writes the name fields properly. */
  function adoptExample() {
    if (!state.example) return null;
    var copy = JSON.parse(JSON.stringify(state.example));
    delete copy.meta.example;
    copy.meta.id = uid();
    // An example counts as registered while it is live (app.js registered()),
    // so adopting one must not suddenly hide the rail: the copy is stamped
    // filed here, as a finished record the player chose to keep.
    copy.meta.filedAt = Date.now();
    state.example = null;
    state.roster[copy.meta.id] = copy;
    state.activeId = copy.meta.id;
    persist(true); emit();
    return copy;
  }
  function roster() { return state.roster; }

  function createAndActivate(name) {
    var ch = newCharacter(name);
    // Clearing the example is not optional: active() answers with state.example FIRST, so
    // registering a new record while an example is open used to file it in the roster and
    // then leave the player looking at the example, with nothing on screen having changed.
    // setActive and adoptExample both clear it for the same reason.
    state.example = null;
    state.roster[ch.meta.id] = ch;
    state.activeId = ch.meta.id;
    persist(true); emit();
    return ch;
  }
  function setActive(id) {
    if (state.roster[id]) { state.example = null; state.activeId = id; persist(true); emit(); }
  }
  function remove(id) {
    delete state.roster[id];
    if (state.activeId === id) state.activeId = Object.keys(state.roster)[0] || null;
    persist(true); emit();
  }

  /* mutate the active character via an updater fn, then persist + notify */
  function update(mutator, opts) {
    var ch = active();
    if (!ch) return;
    mutator(ch);
    ch.meta.updatedAt = Date.now();
    persist((opts && opts.immediate) || false);
    if (!opts || opts.silent !== true) emit();
  }

  function importCharacter(obj) {
    if (!obj || !obj.meta) throw new Error("Invalid character file.");
    if (!obj.meta.id || state.roster[obj.meta.id]) obj.meta.id = uid();
    // fold any custom palette bundled with the file into the device library, then drop the carrier field
    if (obj.customThemes && EN.theme && EN.theme.mergeCustom) { EN.theme.mergeCustom(obj.customThemes); }
    delete obj.customThemes;
    migrate(obj);   // normalize an imported (possibly older) file now, not just on next load()
    state.roster[obj.meta.id] = obj;
    state.activeId = obj.meta.id;
    persist(true); emit();
    return obj;
  }

  return {
    load: load, on: on,
    active: active, roster: roster,
    createAndActivate: createAndActivate,
    setActive: setActive, remove: remove, update: update,
    importCharacter: importCharacter, composeFullName: composeFullName,
    // pre-made examples: live, editable, never persisted
    setExample: setExample, clearExample: clearExample, activeIsExample: activeIsExample, adoptExample: adoptExample
  };
})();
