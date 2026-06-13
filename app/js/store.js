/* ===========================================================================
   ELYSIUM NIGHTS — Store
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

  /* ---- blank character factory ----------------------------------------- */
  function newCharacter(name) {
    var attrs = {};
    EN.rules.attributes.forEach(function (a) { attrs[a.key] = 10; });
    return {
      meta: { id: uid(), schemaVersion: EN.rules.schemaVersion, createdAt: Date.now(), updatedAt: Date.now() },
      name: name || "",
      identity: {
        concept: "", handle: "", whereFrom: "",
        facets: "", coreSparks: "", tethers: "", faultLines: "",
        appearance: "", notes: ""
      },
      level: 1,
      xp: 0,
      useXp: false,
      milestones: { major: 0, minor: 0, notes: "" },
      attributeMethod: "pointbuy",       // 'pointbuy' | 'array' | 'manual'
      attributes: attrs,
      rollGroups: [],                    // banked 4d6-drop-lowest roll groups (Manual/Roll)
      arrayAssign: {},                   // for standard array bookkeeping
      species: null,
      lineage: null,
      size: null,                        // creature Size (auto from lineage; player-picked when variable)
      lineageFeatures: [],               // chosen feature names (creation + evolution)
      background: null,
      backgroundSkillChoice: null,
      backgroundProfChoices: [],         // "choose one" gear picks from the background
      class: null,
      subclass: null,
      classSkillChoices: [],
      classGearChoices: { weapons: [], armor: [], tools: [], vehicles: [] },  // "choose one" gear picks
      // gear buckets are { category: tierKey } maps (weapons/tools/vehicles upgrade; armor acquire-only)
      proficiencies: { skills: {}, saves: [], weapons: {}, armor: {}, tools: {}, vehicles: {} },
      versatile: { insight: { attr: "", skill: "" }, performance: { attr: "", skill: "" }, intimidation: { attr: "", skill: "" } },
      skillFocuses: [],                  // [{skill, aspect}]
      specializations: [],               // [{skill, aspect}]
      talents: [],                       // talent keys
      universalUpgrades: {},             // {level: {type:'attr'|'talent'|'evolution', ...}}
      awakeningEvolution: null,          // Level 4 Awakening Milestone free Lineage Evolution
      cyberware: [],                     // installed chrome names (feeds Open Architecture integration)
      trainingPoints: { spent: 0, allocations: [] },
      resources: { current: {} },
      vitality: { current: null, temp: 0 },   // current null = full; temp = Vigor
      wounds: { current: null },               // countdown pool; null = full (Body score)
      flow: { current: null, strain: 0 },
      resilience: { spent: 0 },                // Resilience Dice spent (max = level)
      featureUses: {},                         // {featureName: {n: spent, r: recharge}} for limited-use features
      fatigue: 0,
      deathSaves: { s: 0, f: 0 },
      stable: false,
      conditions: [],
      conditionLevels: {},               // {name: level} for stackable/leveled conditions
      equipment: [],
      equippedWeapons: [],               // ordered weapon names — drives the Attacks list on the Freelancer tab
      weaponAmmo: {},                    // {weaponName: {cur, mode, ammoType}} — magazine/fire-mode tracking
      glimmer: 0,
      log: []
    };
  }

  /* ---- schema migration (normalize older saved characters) -------------- */
  function migrate(ch) {
    if (!ch || !ch.proficiencies) return;
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
    if (!ch.equippedWeapons) ch.equippedWeapons = [];
    if (!ch.weaponAmmo) ch.weaponAmmo = {};
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
    state.roster[obj.meta.id] = obj;
    state.activeId = obj.meta.id;
    persist(true); emit();
    return obj;
  }

  return {
    load: load, on: on, emit: emit,
    active: active, roster: roster, state: function () { return state; },
    newCharacter: newCharacter, createAndActivate: createAndActivate,
    setActive: setActive, remove: remove, update: update,
    importCharacter: importCharacter, persist: persist
  };
})();
