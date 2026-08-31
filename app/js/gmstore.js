/* ===========================================================================
   ELYSIUM NIGHTS · GM state
   THE writer for everything on the GM side: the encounter, its initiative
   entries, and saved threat statblocks. A sibling of EN.store, never inside it.

   WHY NOT IN store.js. That module's whole contract is "the active character":
   update(fn) mutates the active record, and giving it a second meaning breaks
   the one thing every view relies on. More seriously, its load() wraps the whole
   roster parse in one try and discards EVERY character on unreadable JSON. A
   corrupt encounter blob sharing that failure domain would cost a player their
   entire roster. Separate key, separate parse, separate catch.

   TWO KEYS, deliberately split. The mode flag is its own key so it can be read
   without parsing the state document, and so a corrupt document can never strand
   a GM outside their own tools.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmStore = (function () {
  var MODE_KEY = "en_gm_mode_v1";
  var STATE_KEY = "en_gm_v1";
  var SCHEMA = 1;

  var state = null;
  var listeners = [];
  var saveTimer = null;

  function uid() { return "gme_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

  function blank() {
    return {
      v: SCHEMA,
      stamps: Object.create(null),
      encounter: { round: 0, activeId: null, entries: [] },
      threats: Object.create(null),
      encounters: Object.create(null),   // empty in stage 1; the container exists so stage 3 adds nothing structural
      updatedAt: 0
    };
  }

  /* ---- mode ---------------------------------------------------------------
     Device state, not character state. It must never reach EN.theme.bundleFor
     or any character export: GM mode riding a .json into another player's app
     would hand them the tab on import. */
  function mode() {
    try { return localStorage.getItem(MODE_KEY) === "1"; } catch (e) { return false; }
  }
  function setMode(on) {
    try { localStorage.setItem(MODE_KEY, on ? "1" : "0"); } catch (e) {}
  }

  /* ---- load and migrate ---------------------------------------------------
     Per-entry try, dropping only the entry that fails, mirroring store.js's
     per-record discipline. One malformed entry must not cost the document. */
  function migrate(raw) {
    var s = blank();
    if (!raw || typeof raw !== "object") return s;
    s.v = SCHEMA;
    if (raw.stamps && typeof raw.stamps === "object") {
      Object.keys(raw.stamps).forEach(function (k) { s.stamps[k] = raw.stamps[k]; });
    }
    // threats and encounters are keyed on strings a GM typed, so null-prototype
    // at EVERY creation site including the fallbacks. A GM will name something
    // __proto__ eventually; assume it rather than discover it.
    ["threats", "encounters"].forEach(function (bag) {
      var src = raw[bag];
      if (!src || typeof src !== "object") return;
      Object.keys(src).forEach(function (k) {
        if (!Object.prototype.hasOwnProperty.call(src, k)) return;
        try { s[bag][k] = src[k]; } catch (e) {}
      });
    });
    var e = raw.encounter;
    if (e && typeof e === "object") {
      s.encounter.round = Math.max(0, e.round | 0);
      s.encounter.activeId = typeof e.activeId === "string" ? e.activeId : null;
      (Array.isArray(e.entries) ? e.entries : []).forEach(function (row) {
        try {
          if (!row || typeof row !== "object" || typeof row.id !== "string") return;
          // `kind` is STATED, never inferred from shape. An entry that has lost
          // its discriminant is unattributable and is dropped, not guessed at.
          if (row.kind !== "crew" && row.kind !== "threat") return;
          if (row.kind === "threat" && (!row.block || typeof row.block !== "object")) return;
          if (row.kind === "crew" && typeof row.charId !== "string") return;
          s.encounter.entries.push(row);
        } catch (err) {}
      });
    }
    return s;
  }

  function load() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(STATE_KEY) || "null"); } catch (e) { raw = null; }
    try { state = migrate(raw); } catch (e) { state = blank(); }
    pruneCrew();
    return state;
  }

  function get() { if (!state) load(); return state; }

  /* ---- the crew prune -----------------------------------------------------
     ORDERING IS NOT OPTIONAL. This needs EN.store's roster to answer whether a
     charId is still live, so it runs AFTER store.load(). Run it first and every
     crew entry looks unattributable, gets dropped, and the next persist writes
     that emptiness back over a perfectly good encounter.

     A dead crew entry is DROPPED, never converted into a threat row carrying the
     deleted character's name and numbers. That is the standing rule: state that
     can no longer be attributed is dropped, not moved onto the nearest object.

     Also runs from the view's render, because store.remove() does not notify us
     and a ghost row should not survive until the next reload. Idempotent, and it
     does not persist unless something actually changed. */
  function pruneCrew() {
    if (!state) return 0;
    var roster = (EN.store && EN.store.roster && EN.store.roster()) || {};
    var before = state.encounter.entries.length;
    var dropped = [];
    state.encounter.entries = state.encounter.entries.filter(function (row) {
      if (row.kind !== "crew") return true;
      var live = Object.prototype.hasOwnProperty.call(roster, row.charId);
      if (!live) dropped.push(row.charId);
      return live;
    });
    if (dropped.length) {
      if (state.encounter.activeId &&
          !state.encounter.entries.some(function (r) { return r.id === state.encounter.activeId; })) {
        state.encounter.activeId = null;
      }
      try { console.info("GM: dropped " + dropped.length + " initiative entr" +
        (dropped.length === 1 ? "y" : "ies") + " for deleted characters: " + dropped.join(", ")); } catch (e) {}
      persist(false);
    }
    return before - state.encounter.entries.length;
  }

  function persist(immediate) {
    if (!state) return;
    state.updatedAt = Date.now();
    function write() {
      try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) {}
    }
    if (immediate) { clearTimeout(saveTimer); saveTimer = null; write(); return; }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(write, 350);
  }

  function emit() {
    listeners.forEach(function (fn) { try { fn(state); } catch (e) {} });
  }
  function on(fn) {
    listeners.push(fn);
    return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
  }

  /* THE writer. Same signature as store.update, including {silent} for typing
     and {immediate} to skip the debounce, so the habit transfers. */
  function update(mutator, opts) {
    var s = get();
    mutator(s);
    persist(!!(opts && opts.immediate));
    if (!opts || opts.silent !== true) emit();
  }

  // ---- entries -------------------------------------------------------------
  function addCrew(charId, init, initMod) {
    var id = uid();
    update(function (s) {
      s.encounter.entries.push({ id: id, kind: "crew", charId: charId,
                                 init: init | 0, initMod: initMod | 0, acted: false });
    });
    return id;
  }
  /* A generated threat stores the RESOLVED block with its inputs beside it,
     never inputs alone. Re-deriving on read would let a later correction to
     threats.js silently change a statblock a GM already used at the table.
     Regeneration is an explicit act. This is the deliberate inverse of the
     example-character ruling, where inheriting future defaults is the point. */
  function addThreat(block, inputs, init) {
    var id = uid();
    update(function (s) {
      s.encounter.entries.push({ id: id, kind: "threat", name: block.name || "Threat",
                                 block: block, inputs: inputs || null,
                                 init: init | 0, initMod: (block.init | 0), acted: false,
                                 vit: block.vitality, vitMax: block.vitality,
                                 conditions: [], notes: "" });
    });
    return id;
  }
  function removeEntry(id) {
    update(function (s) {
      // resolve the successor BEFORE the removal, or advancing off the removed
      // entry lands on whatever happens to sort into its place
      if (s.encounter.activeId === id) {
        var next = EN.gmEngine.advance(s.encounter);
        s.encounter.activeId = next.activeId === id ? null : next.activeId;
      }
      s.encounter.entries = s.encounter.entries.filter(function (r) { return r.id !== id; });
      if (!s.encounter.entries.length) { s.encounter.activeId = null; s.encounter.round = 0; }
    });
  }
  function entry(id) {
    return get().encounter.entries.filter(function (r) { return r.id === id; })[0] || null;
  }
  function clearEncounter() {
    update(function (s) { s.encounter = { round: 0, activeId: null, entries: [] }; });
  }

  // ---- saved threats -------------------------------------------------------
  function saveThreat(block, inputs) {
    var id = uid();
    update(function (s) { s.threats[id] = { id: id, block: block, inputs: inputs || null, savedAt: Date.now() }; });
    return id;
  }
  function savedThreats() {
    var s = get(), out = [];
    Object.keys(s.threats).forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(s.threats, k)) out.push(s.threats[k]);
    });
    return out.sort(function (a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
  }
  function removeThreat(id) {
    update(function (s) { delete s.threats[id]; });
  }

  return {
    load: load, get: get, update: update, on: on, uid: uid,
    mode: mode, setMode: setMode,
    addCrew: addCrew, addThreat: addThreat, removeEntry: removeEntry, entry: entry,
    clearEncounter: clearEncounter, pruneCrew: pruneCrew,
    saveThreat: saveThreat, savedThreats: savedThreats, removeThreat: removeThreat
  };
})();
