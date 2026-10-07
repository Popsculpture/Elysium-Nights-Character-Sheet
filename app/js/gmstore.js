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

   THE STATE DOCUMENT IS THE ONLY KEY HERE NOW. Through 2026-08 this module also
   owned en_gm_mode_v1, the flag that showed or hid a GM tab on the player's own
   rail. The GM toolkit moved to its own Admin desktop (see app.js's `portal`,
   settings.js's WORKSPACE section) and that flag has no reader left: both
   desktops are always offered, so a user with it on and a user with it off got
   an identical app. load() below removes it once, on the way past.

   SCHEMA 2 (2026-10). Still the one key, en_gm_v1, now carrying every GM module:

     { v: 2, stamps, updatedAt,
       encounter: { round, activeId, entries, name, sourceId, room, clock },
       threats, encounters, hazards, jobs, ledger,   the record bags, keyed by id
       lastEncounter }                                what clearEncounter() cleared

   The record bags share one API (list, rec, put, drop) so a new module adds a bag
   name here and nothing else. `encounter` is not a bag: it is the one live fight.
   A v1 document migrates losslessly: its threats, its live encounter and that
   encounter's entries come through untouched, and everything new arrives empty.

   GM WRITES TO PLAYER RECORDS go through writeCrew() and nowhere else (author
   ruling, 2026-10). Each one is confirmed by the view before it is called, lands
   through EN.store.updateById, and leaves a ledger record that undoLast() can
   invert. Nothing on the GM side calls EN.store.setActive to reach a record.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmStore = (function () {
  var STATE_KEY = "en_gm_v1";
  var SCHEMA = 2;
  // the record bags: every collection of saved things in the document. The live
  // encounter is deliberately not one of them.
  var BAGS = ["threats", "encounters", "hazards", "jobs", "ledger"];

  var state = null;
  var listeners = [];
  var saveTimer = null;

  function uid() { return "gme_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
  // the #POST id shape face.js mints, so a GM posting is indistinguishable from any other message
  function postId() { return "pm_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

  function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function copy(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function isBag(b) { return BAGS.indexOf(b) !== -1; }

  function blankEncounter() {
    return { round: 0, activeId: null, entries: [],
             name: "",          // set when an encounter is run from the Encounters tab
             sourceId: null,    // the saved encounter it came from, if any
             room: [],          // live hazards in the Room tray
             clock: null };     // the Security Response clock, or null when none is running
  }

  function blank() {
    var s = {
      v: SCHEMA,
      stamps: Object.create(null),
      encounter: blankEncounter(),
      updatedAt: 0,
      lastEncounter: null
    };
    // every bag is keyed on ids and on strings a GM typed, so null-prototype at
    // EVERY creation site. A GM will name something __proto__ eventually.
    BAGS.forEach(function (b) { s[b] = Object.create(null); });
    return s;
  }

  /* ---- load and migrate ---------------------------------------------------
     Per-entry try, dropping only the entry that fails, mirroring store.js's
     per-record discipline. One malformed entry must not cost the document. */
  /* "Gauge" was retired from the book in favour of "Grade" (2026-09-19) and the
     field renamed with it. A GM's banked statblocks and live encounter rows still
     carry the old key, and gm.js reads `block.grade` to print the G-label, so an
     unmigrated block would render "G undefined" rather than fail loudly. Translate
     on load: copy the value across, then drop the old key so this runs once.

     Deliberately not a deep walk. Only the statblock object itself carries it;
     the abilities and stats hanging off it never did. */
  function gradeKey(block) {
    if (!block || typeof block !== "object") return block;
    if (Object.prototype.hasOwnProperty.call(block, "gauge")) {
      if (block.grade === undefined) block.grade = block.gauge;
      try { delete block.gauge; } catch (e) {}
    }
    return block;
  }

  /* A saved threat is a WRAPPER around the statblock, so the key lives one level down, and
     its `inputs` sidecar carries a second copy that buildThreat() would read back if a
     regenerate path is ever added. Both move. */
  function gradeSaved(rec) {
    if (!rec || typeof rec !== "object") return rec;
    gradeKey(rec.block);
    gradeKey(rec.inputs);
    return rec;
  }

  /* INITIATIVE FOR A BLOCK BUILT BEFORE THE BOOK'S FORMULA. Until 2026-10 the
     builder had no Initiative rule and gave every block init 0 and no initMod, so
     a saved statblock or a live row from then rolled at +0 forever, and the GM had
     to rebuild it to pick the formula up (GMH p55: Grade + 2, the Designation and
     Role steps, read through EN.gmEngine.threatInit as the builder reads it).

     This FILLS THE ONE MISSING FIELD and nothing else. The standing rule above
     addThreat still holds: a resolved block is never re-derived on read, because
     a later correction to threats.js must not quietly change a statblock a GM
     already used. A missing initMod is not a number the block prints, so filling
     it changes nothing the GM has seen; `init` (the INIT the statblock card
     prints) is left exactly as it was. A block that already carries a numeric
     initMod is never touched, and neither is one without `inputs`: a Bestiary
     block has none, and its Initiative is the page's printed number, not the
     formula's. Skipped when the formula's data is absent, so a missing
     EN.threats.initiative cannot fill in a wrong "Grade + 0".

     A live row's own initMod (what REROLL ALL and the tie-break read) was copied
     from the block's `init | 0` when it was added, so it follows the filled block.
     Returns true when it filled something. */
  function fillInitMod(block, inputs, row) {
    if (!isObj(block) || !isObj(inputs)) return false;
    if (typeof block.initMod === "number" && isFinite(block.initMod)) return false;
    var E = EN.gmEngine, T = EN.threats;
    if (!E || typeof E.threatInit !== "function" || !T || !isObj(T.initiative)) return false;
    var g = Number(inputs.grade !== undefined ? inputs.grade : block.grade);
    g = Math.max(1, Math.min(5, isFinite(g) && g ? g : 1));   // buildThreat's own clamp
    var mod = g + E.threatInit(inputs.designation || "standard", inputs.role || "gunhand");
    if (!isFinite(mod)) return false;
    block.initMod = mod;
    if (row) row.initMod = mod;
    return true;
  }

  /* One initiative row, or null when it cannot be attributed. `kind` is STATED,
     never inferred from shape. An entry that has lost its discriminant is
     unattributable and is dropped, not guessed at. */
  function cleanEntry(row) {
    if (!row || typeof row !== "object" || typeof row.id !== "string") return null;
    if (row.kind !== "crew" && row.kind !== "threat") return null;
    if (row.kind === "threat" && (!row.block || typeof row.block !== "object")) return null;
    if (row.kind === "crew" && typeof row.charId !== "string") return null;
    if (row.kind === "threat") gradeKey(row.block);
    return row;
  }
  function cleanEntries(list) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (row) {
      try { var r = cleanEntry(row); if (r) out.push(r); } catch (err) {}
    });
    return out;
  }
  /* The Room tray. A hazard row is the Hazards module's shape; all this layer
     promises is that each one is an object with an id, so a row can be found
     again after the list is reordered. */
  function cleanRoom(list) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (h) {
      try {
        if (!isObj(h)) return;
        if (typeof h.id !== "string" || !h.id) h.id = uid();
        out.push(h);
      } catch (err) {}
    });
    return out;
  }
  // the clock is the Encounters module's shape; this only guarantees what every reader walks
  function cleanClock(c) {
    if (!isObj(c)) return null;
    if (!Array.isArray(c.history)) c.history = [];
    c.followRound = !!c.followRound;
    return c;
  }
  // normalized in place rather than rebuilt, so a field a later module adds to the snapshot survives
  function cleanLast(l) {
    if (!isObj(l)) return null;
    l.at = typeof l.at === "number" ? l.at : 0;
    l.name = typeof l.name === "string" ? l.name : "";
    l.sourceId = typeof l.sourceId === "string" && l.sourceId ? l.sourceId : null;
    l.round = Math.max(0, l.round | 0);
    l.entries = cleanEntries(l.entries);
    return l;
  }

  function migrate(raw) {
    var s = blank();
    if (!raw || typeof raw !== "object") return s;
    s.v = SCHEMA;
    if (raw.stamps && typeof raw.stamps === "object") {
      Object.keys(raw.stamps).forEach(function (k) { s.stamps[k] = raw.stamps[k]; });
    }
    /* Every bag, v1's two and schema 2's three new ones, through one loop. A record
       is an object or it is not a record: a stray string or null in a bag used to
       survive here and then throw in the sort that reads `savedAt` off it. The KEY
       is the record's identity, so `id` is written from it: a hand-edited file whose
       id disagrees with its key would otherwise be unreachable by rec() and drop(). */
    BAGS.forEach(function (bag) {
      var src = raw[bag];
      if (!src || typeof src !== "object" || Array.isArray(src)) return;
      Object.keys(src).forEach(function (k) {
        if (!Object.prototype.hasOwnProperty.call(src, k)) return;
        try {
          var rec = src[k];
          if (!isObj(rec)) return;
          if (bag === "threats" || bag === "encounters") gradeSaved(rec);
          if (bag === "threats") fillInitMod(rec.block, rec.inputs, null);
          rec.id = k;
          s[bag][k] = rec;
        } catch (e) {}
      });
    });
    var e = raw.encounter;
    if (e && typeof e === "object") {
      s.encounter.round = Math.max(0, e.round | 0);
      s.encounter.activeId = typeof e.activeId === "string" ? e.activeId : null;
      s.encounter.entries = cleanEntries(e.entries);
      s.encounter.entries.forEach(function (r) {
        if (r.kind === "threat") { try { fillInitMod(r.block, r.inputs, r); } catch (err) {} }
      });
      s.encounter.name = typeof e.name === "string" ? e.name : "";
      s.encounter.sourceId = typeof e.sourceId === "string" && e.sourceId ? e.sourceId : null;
      try { s.encounter.room = cleanRoom(e.room); } catch (err) { s.encounter.room = []; }
      try { s.encounter.clock = cleanClock(e.clock); } catch (err) { s.encounter.clock = null; }
    }
    try { s.lastEncounter = cleanLast(raw.lastEncounter); } catch (err) { s.lastEncounter = null; }
    return s;
  }

  function load() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(STATE_KEY) || "null"); } catch (e) { raw = null; }
    try { state = migrate(raw); } catch (e) { state = blank(); }
    pruneCrew();
    // en_gm_mode_v1 held the GM TAB's visibility and retired with that tab
    // (2026-09). Both desktops are always offered now, so the flag decides
    // nothing. Removed rather than left behind, so it does not sit in every
    // player's storage looking like live state.
    try { localStorage.removeItem("en_gm_mode_v1"); } catch (e) {}
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

  /* ---- persistence --------------------------------------------------------
     write() is the one place that touches storage, and it answers whether the
     write landed. persist() stamps the document and either writes now or arms
     the debounce; flush() lands a write the debounce is still holding. */
  function write() {
    if (!state) return false;
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  }
  function persist(immediate) {
    if (!state) return false;
    state.updatedAt = Date.now();
    clearTimeout(saveTimer);
    saveTimer = null;
    if (immediate) return write();
    saveTimer = setTimeout(function () { saveTimer = null; write(); }, 350);
    return true;
  }
  /* Lands a pending debounced write at once. A no-op (false) when nothing is
     waiting, so it never re-writes a document this tab has not changed, which
     would put this tab's copy back over a newer one written elsewhere. Wired to
     pagehide below: closing the tab inside the debounce used to lose the last
     edit, since the timer dies with the page. */
  function flush() {
    if (!saveTimer) return false;
    clearTimeout(saveTimer);
    saveTimer = null;
    return write();
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
     example-character ruling, where inheriting future defaults is the point.

     The block is a DEEP COPY. Two of the same Bestiary entry added to one fight
     used to share one object, so damage written to the first row's block showed
     on the second, and a builder that kept editing its preview after ADD edited
     the live row too. The initiative modifier is the block's own initMod when it
     states one (the builder's Grade plus designation and role adjustments), else
     the older `init` field every pre-2026-10 block carries.

     `rowName` (optional) is the name the ROW should carry when the caller has
     already numbered it (the Encounters tab's "Street Ganger 1"), so the block
     keeps the statblock's own name underneath, as the rule below says. */
  function addThreat(block, inputs, init, rowName) {
    var id = uid();
    var b = copy(block && typeof block === "object" ? block : {});
    var mod = (typeof b.initMod === "number" && isFinite(b.initMod)) ? b.initMod : (b.init | 0);
    var want = (typeof rowName === "string" && rowName) ? rowName : (b.name || "Threat");
    update(function (s) {
      s.encounter.entries.push({ id: id, kind: "threat", name: freeName(s.encounter.entries, want, null),
                                 block: b, inputs: inputs ? copy(inputs) : null,
                                 init: init | 0, initMod: mod, acted: false,
                                 vit: b.vitality, vitMax: b.vitality,
                                 conditions: [], notes: "" });
    });
    return id;
  }

  /* TWO ROWS NEVER SHARE A NAME. "Corpsec Officer" twice in the order is two
     creatures the GM cannot tell apart when the crew says "I shoot the Corpsec
     Officer", so a second one arrives as "Corpsec Officer 2", a third as
     "Corpsec Officer 3". The first keeps its name. Only the ROW is named; the
     block underneath keeps the statblock's own name.

     A name that already ends in a number is counted from its stem, so a plan run
     twice onto one Table (Encounters numbers its rows "Street Ganger 1", "Street
     Ganger 2") goes on to 3 and 4 rather than becoming "Street Ganger 1 2". The
     lowest free number is used. `skipId` leaves one row out of the taken set, so
     a row can be checked against everyone but itself.

     A PLAIN name joining numbered twins is numbered too. The Encounters tab runs
     a plan's gangers in as "Street Ganger 1" and "Street Ganger 2", and one more
     added from the Bestiary used to arrive as a bare "Street Ganger" beside
     them: no two rows shared a name, but "the Street Ganger" no longer named one
     creature. It arrives as "Street Ganger 3" instead. */
  function freeName(entries, name, skipId) {
    var taken = Object.create(null);
    (entries || []).forEach(function (r) {
      if (r && r.kind === "threat" && r.id !== skipId && typeof r.name === "string") taken[r.name] = true;
    });
    var m = String(name).match(/^(.*\S)\s+\d+$/);
    var stem = m ? m[1] : name;
    var twins = !m && Object.keys(taken).some(function (k) {
      return k.length > stem.length + 1 && k.indexOf(stem + " ") === 0 && /^\d+$/.test(k.slice(stem.length + 1));
    });
    if (!own(taken, name) && !twins) return name;
    var n = 2;
    while (own(taken, stem + " " + n)) n++;
    return stem + " " + n;
  }

  /* The same rule for rows that did NOT arrive through addThreat: a module that
     writes entries through update(), an imported file, a document from before the
     rule. Walks the order in insertion order, so the earliest row keeps its name
     and later twins are numbered. Runs from the Table's render, like pruneCrew,
     and persists only when it renamed something. Returns how many it renamed. */
  function numberThreats() {
    if (!state) return 0;
    var seen = [], renamed = 0;
    state.encounter.entries.forEach(function (r) {
      if (!r || r.kind !== "threat") return;
      var base = (typeof r.name === "string" && r.name) ? r.name : ((r.block && r.block.name) || "Threat");
      var name = freeName(seen, base, null);
      if (name !== r.name) { r.name = name; renamed++; }
      seen.push(r);
    });
    if (renamed) persist(false);
    return renamed;
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
  /* Clearing snapshots the fight first, so the XP award and anything else that
     wants "the encounter we just finished" can still read it after the Table is
     empty. Only a fight with rows in it is snapshotted: clearing an already
     empty Table must not overwrite the last real encounter with nothing. The
     whole encounter resets, its Room tray and clock with it. */
  function clearEncounter() {
    update(function (s) {
      var e = s.encounter;
      if (e.entries.length) {
        s.lastEncounter = { at: Date.now(), name: e.name || "", sourceId: e.sourceId || null,
                            round: e.round | 0, entries: copy(e.entries) };
      }
      s.encounter = blankEncounter();
    });
  }

  // ---- the live encounter's other parts -------------------------------------
  // Each takes {silent} and {immediate} like update(), so a notes field can be typed into.
  /* Replaces the Room tray wholesale. Rows are copied, so the caller's array stays
     the caller's, and any row without an id is given one. Returns the ids in order. */
  function setRoom(arr, opts) {
    var room = cleanRoom(copy(Array.isArray(arr) ? arr : []));
    update(function (s) { s.encounter.room = room; }, opts);
    return room.map(function (h) { return h.id; });
  }
  // null stops the clock; anything that is not an object is treated as null
  function setClock(obj, opts) {
    var c = isObj(obj) ? cleanClock(copy(obj)) : null;
    update(function (s) { s.encounter.clock = c; }, opts);
  }
  // only the keys present are written, so {name} alone leaves sourceId as it was
  function setEncounterMeta(meta, opts) {
    if (!isObj(meta)) return;
    update(function (s) {
      if (own(meta, "name")) s.encounter.name = typeof meta.name === "string" ? meta.name : "";
      if (own(meta, "sourceId")) s.encounter.sourceId = (typeof meta.sourceId === "string" && meta.sourceId) ? meta.sourceId : null;
    }, opts);
  }

  // ---- the record bags -----------------------------------------------------
  function stampOf(r) { return (r && (r.updatedAt || r.savedAt || r.createdAt)) || 0; }
  // newest first by updatedAt; a v1 saved threat has only savedAt, which stands in for it
  function list(bag) {
    if (!isBag(bag)) return [];
    var src = get()[bag], out = [];
    Object.keys(src).forEach(function (k) { if (own(src, k)) out.push(src[k]); });
    return out.sort(function (a, b) { return (stampOf(b) - stampOf(a)) || ((b.createdAt || 0) - (a.createdAt || 0)); });
  }
  // the LIVE record, like get(): change it and put() it back, never leave it changed in place
  function rec(bag, id) {
    if (!isBag(bag) || typeof id !== "string") return null;
    var src = get()[bag];
    return own(src, id) ? src[id] : null;
  }
  /* Stores a COPY, so a view holding the object it passed cannot change saved
     state behind the store's back. A record without an id is new and is given
     one; createdAt is set once and kept on every later put of the same id;
     updatedAt is stamped on every put. Returns the id, or null for a bag that
     does not exist or a record that is not an object. */
  function put(bag, r, opts) {
    if (!isBag(bag) || !isObj(r)) {
      try { console.warn("GM: put() refused: unknown bag or not a record", bag); } catch (e) {}
      return null;
    }
    var c = copy(r);
    var id = (typeof c.id === "string" && c.id) ? c.id : uid();
    var now = Date.now();
    update(function (s) {
      var prev = own(s[bag], id) ? s[bag][id] : null;
      c.id = id;
      c.createdAt = (prev && typeof prev.createdAt === "number") ? prev.createdAt
        : (typeof c.createdAt === "number" ? c.createdAt : now);
      c.updatedAt = now;
      s[bag][id] = c;
    }, opts);
    return id;
  }
  function drop(bag, id, opts) {
    if (!rec(bag, id)) return false;
    update(function (s) { delete s[bag][id]; }, opts);
    return true;
  }

  // ---- saved threats -------------------------------------------------------
  // the v1 API, kept; a saved threat is an ordinary `threats` record that also carries savedAt
  function saveThreat(block, inputs) {
    var id = uid(), now = Date.now();
    update(function (s) {
      s.threats[id] = { id: id, block: copy(block), inputs: inputs ? copy(inputs) : null,
                        savedAt: now, createdAt: now, updatedAt: now };
    });
    return id;
  }
  function savedThreats() {
    var s = get(), out = [];
    Object.keys(s.threats).forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(s.threats, k)) out.push(s.threats[k]);
    });
    return out.sort(function (a, b) { return (b.savedAt || stampOf(b)) - (a.savedAt || stampOf(a)); });
  }
  function removeThreat(id) { drop("threats", id); }

  /* ---- GM writes to player records -----------------------------------------
     The ONLY route from the GM side into a Freelancer's record (author ruling,
     2026-10). The view confirms first; this applies, persists the record at once
     through EN.store.updateById, and files one ledger record holding the ops it
     applied, which is exactly what undoLast() needs to invert them.

     Ops vocabulary, an array (a single op object is accepted too):
       {op: "glimmer", amount}  {op: "nexus", amount}  {op: "xp", amount}
       {op: "post", mail: {from, subj, when, body}}
     Amounts are applied as given, positive or negative, and are not clamped:
     clamping would make the inverse inexact. Nexus is rounded to hundredths, the
     way the Inventory's wallet rounds it. A posting is filed at the top of the
     record's #POST inbox, unread, under a minted id that is kept in the ledger's
     copy of the op (mail.id) so undo removes that one message and no other. */
  function cleanOps(ops) {
    var out = [];
    (Array.isArray(ops) ? ops : [ops]).forEach(function (o) {
      if (!isObj(o)) return;
      if (o.op === "glimmer" || o.op === "nexus" || o.op === "xp") {
        var n = Number(o.amount);
        if (!isFinite(n) || n === 0) return;
        out.push({ op: o.op, amount: n });
      } else if (o.op === "post" && isObj(o.mail)) {
        var m = {};
        ["from", "subj", "when", "body"].forEach(function (k) {
          var v = o.mail[k];
          m[k] = typeof v === "string" ? v : (v == null ? "" : String(v));
        });
        m.id = postId();
        out.push({ op: "post", mail: m });
      }
    });
    return out;
  }
  // a stored op is trusted only as far as it can be inverted; a file can carry anything
  function invertible(o) {
    if (!isObj(o)) return false;
    if (o.op === "glimmer" || o.op === "nexus" || o.op === "xp") return isFinite(Number(o.amount));
    return o.op === "post" && isObj(o.mail) && typeof o.mail.id === "string" && !!o.mail.id;
  }
  // sign 1 applies the op, -1 inverts it
  function applyOp(ch, o, sign) {
    if (o.op === "post") {
      if (!isObj(ch.face)) ch.face = {};
      if (!Array.isArray(ch.face.post)) ch.face.post = [];
      if (sign > 0) {
        ch.face.post.unshift({ id: o.mail.id, from: o.mail.from, subj: o.mail.subj,
                               when: o.mail.when, body: o.mail.body, read: false });
      } else {
        ch.face.post = ch.face.post.filter(function (m) { return !(m && m.id === o.mail.id); });
      }
      return;
    }
    var cur = Number(ch[o.op]);
    var next = (isFinite(cur) ? cur : 0) + sign * Number(o.amount);
    ch[o.op] = o.op === "nexus" ? Math.round(next * 100) / 100 : next;
  }
  /* Returns the ledger record's id, or false when it refuses: a charId that is not
     in the roster (a deleted record, or an example, which is never stored), or no
     usable op. The ledger record is filed BEFORE the record write so the render the
     write triggers already shows it, and is withdrawn if the write does not land. */
  function writeCrew(charId, label, ops) {
    var roster = (EN.store && EN.store.roster && EN.store.roster()) || {};
    if (typeof charId !== "string" || !own(roster, charId) || !isObj(roster[charId])) return false;
    if (!EN.store.updateById) return false;
    var clean = cleanOps(ops);
    if (!clean.length) return false;
    var s = get(), id = uid(), newest = 0;
    /* `at` is kept strictly increasing across write records. A payday credits a whole
       crew in one click, so several writes land in the same millisecond, and with equal
       stamps undo would pick among them arbitrarily instead of newest first. */
    Object.keys(s.ledger).forEach(function (k) {
      var r = s.ledger[k];
      if (r && typeof r.at === "number" && r.at > newest) newest = r.at;
    });
    var at = Math.max(Date.now(), newest + 1);
    s.ledger[id] = { id: id, kind: "write", at: at, label: String(label == null ? "" : label),
                     charId: charId, charName: roster[charId].name || "", ops: clean, undone: false,
                     createdAt: at, updatedAt: at };
    var ok = false;
    try {
      ok = EN.store.updateById(charId, function (ch) {
        clean.forEach(function (o) { applyOp(ch, o, 1); });
      });
    } catch (e) {
      ok = false;
      try { console.error("GM: write to " + charId + " failed", e); } catch (e2) {}
    }
    if (!ok) { delete s.ledger[id]; return false; }
    persist(true);
    emit();
    return id;
  }

  /* The write undoLast() would invert, or null: the newest write not yet undone
     whose Freelancer is still in the roster. A write to a record that has since
     been deleted is passed over, because its effect was deleted with the record
     and there is nothing left to invert. Exposed so a view can name what UNDO
     will do before the GM presses it. */
  function undoable() {
    var roster = (EN.store && EN.store.roster && EN.store.roster()) || {};
    var cands = list("ledger").filter(function (r) {
      return r && r.kind === "write" && !r.undone && Array.isArray(r.ops) &&
             typeof r.charId === "string" && own(roster, r.charId);
    });
    cands.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    return cands[0] || null;
  }
  /* Inverts the newest write, ops in reverse order, and marks its ledger record
     undone. Returns that record, or null when there is nothing to undo. The record
     keeps its updatedAt, so undoing does not move it to the top of the ledger. */
  function undoLast() {
    var r = undoable();
    if (!r) return null;
    r.undone = true;
    r.undoneAt = Date.now();
    var ok = false;
    try {
      ok = EN.store.updateById(r.charId, function (ch) {
        r.ops.slice().reverse().forEach(function (o) { if (invertible(o)) applyOp(ch, o, -1); });
      });
    } catch (e) {
      ok = false;
      try { console.error("GM: undo on " + r.charId + " failed", e); } catch (e2) {}
    }
    if (!ok) { r.undone = false; delete r.undoneAt; return null; }
    persist(true);
    emit();
    return r;
  }

  /* ---- export and import ---------------------------------------------------
     GM state used to exist only in this browser's storage: clearing site data or
     changing device started the GM empty. The export is the whole document as
     JSON; the import validates it through the same migrate() a load uses, so an
     older file comes in exactly as an older stored document would. */
  function exportDoc() {
    flush();
    return JSON.stringify(get(), null, 2);
  }
  function counts(s) {
    var c = { entries: s.encounter.entries.length, room: s.encounter.room.length };
    BAGS.forEach(function (b) { c[b] = Object.keys(s[b]).length; });
    return c;
  }
  /* Every refusal is a thrown Error whose message is a sentence a toast can show
     as it stands. A Freelancer's .json is an object too, and migrating one would
     produce a blank GM document and replace the GM's data with nothing, so a file
     must carry the schema stamp and at least one of the GM's own containers. A
     file from a NEWER schema is refused rather than migrated down, which would
     silently drop whatever the newer build added. */
  function parseDoc(text) {
    if (typeof text !== "string" || !text.replace(/^\s+|\s+$/g, "")) throw new Error("That file is empty.");
    var raw;
    try { raw = JSON.parse(text); } catch (e) { throw new Error("That file is not valid JSON."); }
    if (!isObj(raw)) throw new Error("That file does not hold GM data.");
    if (typeof raw.v !== "number" || !(isObj(raw.encounter) || isObj(raw.threats))) {
      throw new Error("That file is not GM data. A Freelancer's file imports on the Freelancer desktop.");
    }
    if (raw.v > SCHEMA) throw new Error("That GM data was saved by a newer version of this app.");
    try { return migrate(raw); } catch (e) { throw new Error("That GM data could not be read."); }
  }
  // what a file holds, without replacing anything: for a confirmation that names it
  function inspectDoc(text) { return counts(parseDoc(text)); }
  /* Replaces the whole document and persists at once. Crew rows naming Freelancers
     this device does not have are dropped on the way in, by the same standing rule
     as a load; the count comes back as droppedCrew. `saved` is false when this
     device refused the write, in which case the import holds only until reload. */
  function importDoc(text) {
    var next = parseDoc(text);
    // a debounced write of the OLD document must not land over the new one
    clearTimeout(saveTimer);
    saveTimer = null;
    state = next;
    var droppedCrew = pruneCrew();
    var c = counts(state);
    c.droppedCrew = droppedCrew;
    c.saved = persist(true);
    emit();
    return c;
  }

  try { window.addEventListener("pagehide", function () { flush(); }); } catch (e) {}

  return {
    load: load, get: get, update: update, on: on, uid: uid,
    addCrew: addCrew, addThreat: addThreat, removeEntry: removeEntry, entry: entry,
    clearEncounter: clearEncounter, pruneCrew: pruneCrew,
    // one name per threat row: the numbering addThreat applies, for rows from any other path
    numberThreats: numberThreats, freeName: freeName,
    saveThreat: saveThreat, savedThreats: savedThreats, removeThreat: removeThreat,
    // the record bags
    list: list, rec: rec, put: put, drop: drop,
    // the live encounter's other parts
    setRoom: setRoom, setClock: setClock, setEncounterMeta: setEncounterMeta,
    // GM writes to player records
    writeCrew: writeCrew, undoLast: undoLast, undoable: undoable,
    // the document as a file
    exportDoc: exportDoc, importDoc: importDoc, inspectDoc: inspectDoc, flush: flush
  };
})();
