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
  var state = { roster: {}, activeId: null };

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
      meta: { id: uid(), schemaVersion: EN.rules.schemaVersion, createdAt: Date.now(), updatedAt: Date.now() },
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
      customFeatures: [],                // player/GM manual Features on the Freelancer tab: [{id,name,source,effect,note,category,action,cost,uses,range,duration}]
      featureAnnotations: {},            // per computed-feature notes/flags: {featureName: {note, pinned, important, hidden}}
      universalUpgrades: {},             // {level: {type:'attr'|'talent'|'evolution', ...}}
      awakeningEvolution: null,          // Level 4 Awakening Milestone free Lineage Evolution
      cyberware: [],                     // INSTALLED chrome (feeds Static / Chrome Tax + Open Architecture)
      cyberStash: [],                    // purchased-but-uninstalled chrome (install at a clinic to move it to cyberware)
      grid: {                            // #GRID rig + live hacking state (Bandwidth tracks via resources.current)
        deckType: null,                  // 'smartdeck' (Power User) | 'buddy' (Standard User) | null
        deckTier: null,                  // tier name from EN.grid.smartdecks / .buddies
        deckHpSpent: 0,                  // System Integrity lost (deck Bricked at deckHpSpent >= maxIntegrity)
        deckMods: [],                    // installed Smartdeck mod keys (Codebreaker only)
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
          armorDR: {}                    // {armorEntryKey: DR lost}, ENTRY-keyed, pruned to owned entries on load
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
      carry: {},                         // Loadout carry status per entry key: "carried" | "worn" | "racked" (absent = stashed)
      racked: {},                        // Racked assignments: {itemEntryKey: carryGearEntryKey} (Carry Gear, one rack per item)
      slotInert: {},                     // Body Slot conflicts: {itemEntryKey: true} for on-person items the player benched
      shieldWear: {},                    // Shield Durability: {shieldName: boxesMarked}
      loadout: "standard",               // declared Loadout: "light" | "standard" | "heavy", sets the Load Budget
      haul: "none",                      // active Haul: "none" | "lift" (body-sized) | "drag" (oversized/double)
      glimmer: 0,
      nexus: 0,                          // Nexus tokens (◎), the high-scrutiny currency; fractional
      log: []
    };
  }

  /* ---- schema migration (normalize older saved characters) -------------- */
  function migrate(ch) {
    if (!ch) return;
    // name must always be a string, even for an ancient/malformed roster entry
    // that predates the current schema and fails the check below (a corrupt
    // record should still be safely displayable, e.g. in the #PRINT switcher).
    if (typeof ch.name !== "string") ch.name = "";
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
    if (!ch.proficiencies) return;
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
    // Shield Durability boxes marked, keyed by shield name
    if (!ch.shieldWear || typeof ch.shieldWear !== "object") ch.shieldWear = {};
    Object.keys(ch.shieldWear).forEach(function (k) { var v = ch.shieldWear[k]; if (typeof v !== "number" || v < 0) delete ch.shieldWear[k]; });
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
    if (!ch.vehicleMods || typeof ch.vehicleMods !== "object") ch.vehicleMods = {};   // {vehicleName: [modKey]}
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
    // The Talent "Toxicologist" was renamed "Cutting Agent" to stop colliding with
    // the Stitcher subclass of the same name, which KEEPS its name. Universal
    // Upgrade slots store the talent key, so a record saved before the rename
    // still points at "toxicologist" and would resolve to nothing.
    Object.keys(ch.universalUpgrades || {}).forEach(function (lvl) {
      var u = ch.universalUpgrades[lvl];
      if (u && (u.type === "talent" || u.type === "talentUpgrade") &&
          (u.talent === "toxicologist" || u.talent === "Toxicologist")) u.talent = "cutting-agent";
    });
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
      var nameToIds = {}, splitEquipment = [];
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
        if (e.id || !(e.qty > 0) || stackable) {
          splitEquipment.push(e);
          return;
        }
        var n = e.qty, ids = [];
        for (var i = 0; i < n; i++) {
          var ne = {};
          Object.keys(e).forEach(function (k) { if (k !== "qty") ne[k] = e[k]; });
          ne.id = mintId();
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
    }
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
       written at the split: two of its maps (caustic.armorDR and thermalWeave)
       are keyed on an EQUIPMENT ENTRY, so they can only be resolved and pruned
       once the entries actually carry their ids. Written twenty lines earlier,
       beside the other equipment defaults, they would key on the armor NAME and
       the split would orphan every one of them.

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
    // caustic; armorDR is the entry-keyed ledger the Armor Repair branch will consume
    if (!hz.caustic || typeof hz.caustic !== "object" || Array.isArray(hz.caustic)) hz.caustic = {};
    hz.caustic.inside = !!hz.caustic.inside;
    hz.caustic.lingering = !!hz.caustic.lingering;
    hz.caustic.sceneTicks = nn(hz.caustic.sceneTicks);
    var eqKeys = Object.create(null);
    ((ch.equipment) || []).forEach(function (e) { var k = e && (e.id || e.name); if (k) eqKeys[k] = 1; });
    var drIn = (hz.caustic.armorDR && typeof hz.caustic.armorDR === "object" && !Array.isArray(hz.caustic.armorDR)) ? hz.caustic.armorDR : {};
    var drOut = Object.create(null);
    Object.keys(drIn).forEach(function (k) {
      var v = nn(drIn[k]);
      if (!eqKeys[k] || v <= 0) return;                 // orphaned or empty: dropped, never moved
      // "minimum 0": a suit cannot lose more DR than it has, so an imported or
      // hand-edited number above the suit's own DR is clamped to it rather than
      // handed to Armor Repair as a debt the piece could never pay.
      var e = ch.equipment.find(function (x) { return (x.id || x.name) === k; });
      var it = (e && EN.engine && EN.engine.catalogItem) ? EN.engine.catalogItem(e.name) : null;
      var cap = (it && typeof it.dr === "number") ? it.dr : v;
      drOut[k] = Math.min(v, cap);
    });
    hz.caustic.armorDR = drOut;
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
    if (!ch.grid || typeof ch.grid !== "object") ch.grid = { deckType: null, deckTier: null, deckHpSpent: 0, deckMods: [], links: [] };
    else {
      if (ch.grid.deckType === undefined) ch.grid.deckType = null;
      if (ch.grid.deckTier === undefined) ch.grid.deckTier = null;
      if (typeof ch.grid.deckHpSpent !== "number") ch.grid.deckHpSpent = 0;
      if (!Array.isArray(ch.grid.deckMods)) ch.grid.deckMods = [];
      if (!Array.isArray(ch.grid.links)) ch.grid.links = [];
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
      Object.keys(state.roster).forEach(function (id) { migrate(state.roster[id]); });
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
  function active() { return state.activeId ? state.roster[state.activeId] : null; }
  function roster() { return state.roster; }

  function createAndActivate(name) {
    var ch = newCharacter(name);
    state.roster[ch.meta.id] = ch;
    state.activeId = ch.meta.id;
    persist(true); emit();
    return ch;
  }
  function setActive(id) {
    if (state.roster[id]) { state.activeId = id; persist(true); emit(); }
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
    importCharacter: importCharacter, composeFullName: composeFullName
  };
})();
