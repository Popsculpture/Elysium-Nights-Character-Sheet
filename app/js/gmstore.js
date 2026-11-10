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
       heat, contacts, scenes,                       (the Heat, People and Scenes tabs')
       lastEncounter }                                what clearEncounter() cleared

   The record bags share one API (list, rec, put, drop) so a new module adds a bag
   name here and nothing else. A document from before a bag existed loads with
   that bag empty, the same as any other missing bag, so adding one needs no
   schema bump. `encounter` is not a bag: it is the one live fight.
   A v1 document migrates losslessly: its threats, its live encounter and that
   encounter's entries come through untouched, and everything new arrives empty.

   GM WRITES TO PLAYER RECORDS go through writeCrew() and nowhere else (author
   ruling, 2026-10). Each one is confirmed by the view before it is called, lands
   through EN.store.updateById, and leaves a ledger record that undoLast() can
   invert. Nothing on the GM side calls EN.store.setActive to reach a record. A
   record another player holds is reached through the inbox: see THE FAR DOOR.

   WHETHER A WRITE STILL STANDS is read from the ledger and nowhere else
   (liveWrites below, for what UNDO can take back, and paidWrites, which also
   counts the imported ones, for what is already paid). A write record carries
   a `meta` tag saying what made it (an award, a posting, a payday), so a view
   can rebuild its own UNDO after a reload instead of keeping the ids in
   memory, where a reload, a HIDE or the next fight used to strand them (F4).

   ONE DESKTOP PER CAMPAIGN (8 Nov 2026, the author's choices). A campaign has its own document,
   en_gm_camp_<campaign id>_v1, holding its Table and last fight, encounters, jobs, ledger, Heat log,
   contacts and scenes. Saved threats and custom hazards are one library, and they stay where they
   always were, in en_gm_v1, which is also the desktop of an Admin with no campaign. So nobody without
   a campaign has anything migrated, and get() still answers one document with every bag in it: the
   split happens only on the way to storage. Which desktop a tab is on comes from EN.campaigns.desktop(),
   and follow() acts on it (app.js, on every render). It all stays on this device, as it always has.

   TWO TABS, ONE DESKTOP. See the section of that name below. A document's parts merge one by one, so
   an Admin in two tabs no longer overwrites their own Table, Payroll and so on.

   WORK FROM BEFORE ALL THIS is in en_gm_v1 too, and nothing moves it unasked. moveDevice() moves it into
   the campaign this tab is on, on the Admin's word (js/campaigns.js's one-time card, or Settings).
   =========================================================================== */
window.EN = window.EN || {};

EN.gmStore = (function () {
  var STATE_KEY = "en_gm_v1";
  var SCHEMA = 2;
  // the record bags: every collection of saved things in the document. The live
  // encounter is deliberately not one of them. heat is the Heat tab's Downtime
  // log, contacts the People tab's contact cards, scenes the Scenes tab's saved
  // Sit-Downs, chases and Incursions.
  var BAGS = ["threats", "encounters", "hazards", "jobs", "ledger", "heat", "contacts", "scenes"];

  // the library: the bags every desktop shares. They always live in en_gm_v1
  var LIB_BAGS = ["threats", "hazards"];
  var CAMP_PRE = "en_gm_camp_", CAMP_SUF = "_v1";
  var PREMOVE_KEY = "en_gm_premove_v1";     // en_gm_v1 as it stood before the last moveDevice()
  // the lists of rows in the live encounter: each row is its own part (see TWO TABS, ONE DESKTOP)
  var ROW_LISTS = ["entries", "room", "defeated"];

  var state = null;
  var listeners = [];
  var saveTimer = null;
  var deskId = null;                        // the campaign this tab's desktop belongs to, or null for en_gm_v1's own
  var files = [];                           // where this desktop's parts are kept: see openFiles

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
             clock: null,       // the Security Response clock, or null when none is running
             defeated: [] };    // threats cleared off with their X once the fight was running
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

  /* BESTIARY REACH NOTATION (round 2 rulings, 2026-10-16). The Toolkit now prints
     every threat attack's reach as "Reach +N", where the Bestiary data said
     "Reach N". A Bestiary threat that was saved, run on the Table or planned into
     an encounter carries its OWN deep copy of the entry's abilities (gm.js
     bestiaryBlock, gm_encounters.js bestiaryBlock), and entryOf() lets a block's
     abilities win over the live entry, so the corrected data never reaches it.

     This rewrites those seven ability strings on the way in. It matches the
     WHOLE `text` exactly against the seven old strings and nothing looser: an
     ability a GM edited by even one character no longer equals one of them and is
     left alone, and the new string is not in the table, so a second pass finds
     nothing (idempotent). Only a block from the Bestiary is read (fromBestiary,
     or carrying `stats` as gm.js's fullblock test does); a block the builder made
     never holds these strings. The new string is derived from the old one by the
     one substitution the ruling names, and r2_gm.js proves each derived string is
     the live Bestiary ability's text. */
  var REACH_OLD = [
    "Two attacks, +9 vs Defense, Reach 1, 1d10+6 Energy (11), Armor Piercing 1.",
    "+6 vs Defense, Reach 1, 1d6+3 Piercing (6).",
    "Two attacks, +10 vs Defense, Reach 1, 1d10+12 Energy (17), Armor Piercing 1.",
    "Two attacks, +7 vs Defense, Reach 3 (flexible), 1d8+3 Bludgeoning (7). On a hit, the Bloom may attempt a Grapple contest (Athletics +7) for free.",
    "+6 vs Defense, Reach 2, 1d10+5 Bludgeoning (10); on a hit the Target makes a Body Save DC 15 or is pushed 2 spaces.",
    "+7 vs Defense, Reach 3 (flexible), 2d8+6 Bludgeoning (15); on a hit the Target is pulled 2 spaces toward the jaw.",
    "Three attacks, +10 vs Defense, Reach 2, 4d10+6 Force (Spatial) (28). Ignores armor DR; space itself is doing the cutting."
  ];
  var REACH_NEW = Object.create(null);
  REACH_OLD.forEach(function (t) { REACH_NEW[t] = t.replace(/Reach (\d)/, "Reach +$1"); });
  var reachFixed = 0;   // abilities rewritten since load() last reset it (load() persists when it is not 0)
  function reachNotation(block) {
    if (!isObj(block) || !Array.isArray(block.abilities)) return block;
    if (block.fromBestiary !== true && !isObj(block.stats)) return block;
    block.abilities.forEach(function (ab) {
      if (!isObj(ab) || typeof ab.text !== "string" || !own(REACH_NEW, ab.text)) return;
      ab.text = REACH_NEW[ab.text];
      reachFixed++;
    });
    return block;
  }

  /* A saved threat is a WRAPPER around the statblock, so the key lives one level down, and
     its `inputs` sidecar carries a second copy that buildThreat() would read back if a
     regenerate path is ever added. Both move. */
  function gradeSaved(rec) {
    if (!rec || typeof rec !== "object") return rec;
    gradeKey(rec.block);
    gradeKey(rec.inputs);
    presenceThreat(rec.block, rec.inputs);
    return rec;
  }

  /* CHARM BECAME PRESENCE (batch 81, 25 Oct 2026). A built threat stores its strong saves as
     Attribute KEYS twice (inputs.strong, the builder's pick, and block.saves.attrs) and once as
     the printed line (block.saves.text, "+5 Charm and Wits, +1 others"); a Bestiary block
     carries the printed line in stats.Saves. Keys move CHA to PRE and the printed Attribute
     name moves to Presence; no number changes. "Charmed" is a condition and is never touched
     (\b stops the match at "Charm" followed by a letter). Idempotent. */
  var presenceFixed = 0;
  function presenceText(s) {
    if (typeof s !== "string" || !/\bCharm\b/.test(s)) return s;
    presenceFixed++;
    return s.replace(/\bCharm\b/g, "Presence");
  }
  function presenceKeys(a) {
    if (!Array.isArray(a)) return;
    for (var i = 0; i < a.length; i++) if (a[i] === "CHA") { a[i] = "PRE"; presenceFixed++; }
  }
  function presenceThreat(block, inputs) {
    if (isObj(inputs)) presenceKeys(inputs.strong);
    if (!isObj(block)) return;
    if (isObj(block.saves)) {
      presenceKeys(block.saves.attrs);
      block.saves.text = presenceText(block.saves.text);
    }
    if (isObj(block.stats) && typeof block.stats.Saves === "string") block.stats.Saves = presenceText(block.stats.Saves);
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
    if (row.kind === "crew") ["campaign", "name", "player"].forEach(function (k) { if (row[k] !== undefined && typeof row[k] !== "string") delete row[k]; });
    if (row.kind === "threat") { gradeKey(row.block); reachNotation(row.block); presenceThreat(row.block, row.inputs); }
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
    /* Every bag, v1's two and every one added since, through one loop. A record
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
          if (bag === "threats") { reachNotation(rec.block); fillInitMod(rec.block, rec.inputs, null); }
          // a saved encounter plan keeps its resolved statblocks on its "threat" lines
          if (bag === "encounters" && Array.isArray(rec.lines)) {
            rec.lines.forEach(function (ln) { if (isObj(ln) && ln.kind === "threat") { reachNotation(ln.block); presenceThreat(ln.block, ln.inputs); } });
          }
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
      s.encounter.defeated = cleanEntries(e.defeated);
    }
    try { s.lastEncounter = cleanLast(raw.lastEncounter); } catch (err) { s.lastEncounter = null; }
    // which campaign a document belongs to, so one left behind can still say so
    if (isObj(raw.campaign) && typeof raw.campaign.id === "string") {
      s.campaign = { id: raw.campaign.id, name: typeof raw.campaign.name === "string" ? raw.campaign.name : "" };
    }
    return s;
  }

  function readKey(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function parseOr(text, dflt) {
    try { var v = JSON.parse(text || "null"); return isObj(v) ? v : dflt; } catch (e) { return dflt; }
  }
  // the campaign this tab should be on, as { id, name }, or null for en_gm_v1's own desktop
  function wantedDesk() {
    var C = EN.campaigns, c = null;
    try { c = C && C.desktop ? C.desktop() : null; } catch (e) { c = null; }
    return c && typeof c.id === "string" && c.id ? { id: c.id, name: String(c.name == null ? "" : c.name) } : null;
  }
  function deskKey(id) { return id ? CAMP_PRE + id + CAMP_SUF : STATE_KEY; }

  /* Reads the desktop `want` names into memory. A campaign's document brings no library of its own:
     those two bags come from en_gm_v1, with the stamps that go with them. */
  function readDesk(want) {
    deskId = want ? want.id : null;
    openFiles(deskId);
    var deskText = readKey(deskKey(deskId)), raw = null, read = false;
    try { raw = JSON.parse(deskText || "null"); } catch (e) { raw = null; }
    var fromLib = null, libText = null;
    if (deskId) {
      libText = readKey(STATE_KEY);
      fromLib = parseOr(libText, null);
      if (!isObj(raw)) raw = {};
      LIB_BAGS.forEach(function (b) { raw[b] = fromLib ? fromLib[b] : undefined; });
    }
    reachFixed = 0; presenceFixed = 0;
    try { state = migrate(raw); read = true; } catch (e) { state = blank(); }
    if (deskId) state.campaign = { id: deskId, name: want.name };
    noteLoaded(files[0], deskText, raw);
    if (deskId) noteLoaded(files[1], libText, fromLib);
    pruneCrew();
    // the Reach pass changed what is stored: write the corrected document back once, so the
    // next load finds nothing to do (it is idempotent either way). Never after a failed read,
    // where `state` is the blank document and the stored one is still the player's.
    if (read && (reachFixed || presenceFixed)) {
      files.forEach(function (f) { f.owes = true; });
      persist(false);
    }
    reachFixed = 0; presenceFixed = 0;
  }

  function load() {
    readDesk(wantedDesk());
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
  function isCampaignRow(charId) { return typeof charId === "string" && charId.indexOf("row:") === 0; }
  // (a character another player holds: its writes go through the far door, below)
  function pruneCrew() {
    if (!state) return 0;
    var roster = (EN.store && EN.store.roster && EN.store.roster()) || {};
    var before = state.encounter.entries.length;
    var dropped = [];
    state.encounter.entries = state.encounter.entries.filter(function (row) {
      if (row.kind !== "crew") return true;
      // another player's character in a campaign (js/campaigns.js) was never going to be in this roster
      if (isCampaignRow(row.charId)) return true;
      var live = Object.prototype.hasOwnProperty.call(roster, row.charId);
      // not in this tab's roster but in storage: another tab's character whose news hasn't arrived yet, not a dead one
      if (!live && EN.store && EN.store.storedHas && EN.store.storedHas(row.charId)) return true;
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

  /* ---- TWO TABS, ONE DESKTOP ------------------------------------------------------
     Each tab holds its desktop in memory, and every save used to write the whole document back, so
     whichever tab wrote last undid what the other had saved. The same bug the roster had (store.js,
     TWO TABS, ONE ROSTER), and the same answer, cut finer: a document here is one big value holding
     many small things, and two tabs on one Table is the ordinary case, so a document is taken apart
     into PARTS, each with its own stamp, and they merge one by one:

       b/<bag>/<id>       a saved record
       r/<list>/<id>      a row of the live encounter (entries, room, defeated)
       o/<list>           the order of that list's rows
       e/<field>          the encounter's other fields (round, activeId, name, sourceId, clock)
       lastEncounter      what clearEncounter() kept
       stamps             the v1 field, carried along

     Stored beside the parts is `rev`, path -> stamp. A path in `rev` with no part is a DELETE NOTE, so
     a delete travels in the same write as everything else, and is forgotten after GONE_KEEP. A part
     with no stamp has not changed since before stamps, and counts as 0.

     Before every write, and whenever another tab's write is announced, a tab compares each part in
     storage against what it last knew (file.seen, the stamp and text of each part):
       same as known             nothing new
       older, or missing         old news from a tab that hadn't heard. This tab's goes back in. Storage
                                 isn't atomic across tabs, so a slow tab can write over a save it missed
       newer, unchanged here     take it
       newer, changed here too   this tab hasn't said its change yet, so it is the newer one: merge key by
                                 key, and where both changed one thing, this tab's wins. A delete wins over
                                 an edit on either side, as it does on the roster
     Hearing a save writes nothing unless something has to go back in, so two tabs can't set each other
     off. Stamps only move forward (nextStamp). What's left: two tabs changing one thing in the same
     instant, where one change loses, and a tab frozen past GONE_KEEP, which can bring a delete back.
     A save written over before anyone heard it isn't lost: the storage event carries it.

     A desktop's parts live in one file or two (openFiles): a tab on a campaign keeps the campaign's parts
     in its own document, and writes the library's into en_gm_v1, leaving the rest of that document as it
     found it. A reader of en_gm_v1 ignores a field it doesn't know, so an old copy of the app still reads it. */
  var GONE_KEEP = 7 * 86400000;
  function isLibPath(p) { return LIB_BAGS.some(function (b) { return p.indexOf("b/" + b + "/") === 0; }); }
  function newFile(key, holds) { return { key: key, holds: holds, seen: {}, lastText: null, hi: 0, owes: false }; }
  // holds: "all" (en_gm_v1 as the desktop it is), "desk" (a campaign's own parts), "lib" (the library, in en_gm_v1)
  function openFiles(id) {
    files = id ? [newFile(deskKey(id), "desk"), newFile(STATE_KEY, "lib")] : [newFile(STATE_KEY, "all")];
  }
  function fileHolds(file, p) { return file.holds === "all" || (file.holds === "lib") === isLibPath(p); }
  /* A part's text, for comparing. Keys in order: two tabs can hold the same thing with its keys in a different
     order, since a merge adds them as it finds them, and that isn't a change. Reading one as a change stamps it
     again, and a fresh stamp on a copy of something just deleted brings it back. Never what is stored. */
  function canon(v) {
    if (Array.isArray(v)) return "[" + v.map(function (x) { var t = canon(x); return t === undefined ? "null" : t; }).join(",") + "]";
    if (v && typeof v === "object") {
      var out = [];
      Object.keys(v).sort().forEach(function (k) {
        var t = canon(v[k]);
        if (t !== undefined) out.push(JSON.stringify(k) + ":" + t);
      });
      return "{" + out.join(",") + "}";
    }
    return JSON.stringify(v);
  }
  // every part of a document that this file holds, path -> its text. A path always has a prefix, so no key here is __proto__
  function partsOf(doc, file) {
    var out = {};
    function add(p, v) {
      if (!fileHolds(file, p)) return;
      var t = canon(v);
      if (t !== undefined) out[p] = t;
    }
    BAGS.forEach(function (b) {
      var src = doc[b] || {};
      Object.keys(src).forEach(function (k) { add("b/" + b + "/" + k, src[k]); });
    });
    if (file.holds === "lib") return out;
    var e = doc.encounter || {};
    Object.keys(e).forEach(function (k) {
      if (ROW_LISTS.indexOf(k) === -1) add("e/" + k, e[k]);
    });
    ROW_LISTS.forEach(function (k) {
      var rows = Array.isArray(e[k]) ? e[k] : [];
      rows.forEach(function (r) { if (r && typeof r.id === "string") add("r/" + k + "/" + r.id, r); });
      add("o/" + k, rows.map(function (r) { return r && r.id; }));
    });
    add("lastEncounter", doc.lastEncounter === undefined ? null : doc.lastEncounter);
    add("stamps", doc.stamps || {});
    return out;
  }
  function noteLoaded(file, text, raw) {
    var rev = isObj(raw) && isObj(raw.rev) ? raw.rev : {}, now = partsOf(state, file), hi = 0;
    file.seen = {};
    Object.keys(rev).forEach(function (p) {
      var at = Number(rev[p]);
      if (!fileHolds(file, p) || !isFinite(at) || at <= 0) return;
      if (at > hi) hi = at;
      file.seen[p] = { at: at, text: null };
    });
    Object.keys(now).forEach(function (p) { file.seen[p] = { at: file.seen[p] ? file.seen[p].at : 0, text: now[p] }; });
    file.lastText = text;
    file.hi = hi;
    file.owes = false;
  }
  function nextStamp(file) { file.hi = Math.max(Date.now(), file.hi + 1); return file.hi; }
  // in place, so a view holding the object still holds the live one
  function refill(obj, next) {
    Object.keys(obj).forEach(function (k) { if (!own(next, k)) delete obj[k]; });
    Object.keys(next).forEach(function (k) { obj[k] = next[k]; });
  }
  function mergeKeys(base, mine, theirs) {
    var out = Object.create(null), b = isObj(base) ? base : {}, keys = Object.create(null);
    Object.keys(mine).concat(Object.keys(theirs)).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      var inM = own(mine, k), inT = own(theirs, k), inB = own(b, k);
      var hereMoved = inM !== inB || (inM && canon(mine[k]) !== canon(b[k]));
      var thereMoved = inT !== inB || (inT && canon(theirs[k]) !== canon(b[k]));
      if (hereMoved && thereMoved && inM && inT && isObj(mine[k]) && isObj(theirs[k])) { out[k] = mergeKeys(b[k], mine[k], theirs[k]); return; }
      if (hereMoved || !thereMoved) { if (inM) out[k] = mine[k]; }
      else if (inT) out[k] = theirs[k];
    });
    return out;
  }
  // one part's value in a document, undefined when it holds none
  function valueAt(doc, p) {
    if (p === "lastEncounter") return doc.lastEncounter;
    if (p === "stamps") return doc.stamps;
    var kind = p.charAt(0), rest = p.slice(2), e = doc.encounter || {};
    if (kind === "e") return e[rest];
    if (kind === "o") return (Array.isArray(e[rest]) ? e[rest] : []).map(function (r) { return r && r.id; });
    var cut = rest.indexOf("/"), name = rest.slice(0, cut), id = rest.slice(cut + 1);
    if (kind === "b") return doc[name] && own(doc[name], id) ? doc[name][id] : undefined;
    return (Array.isArray(e[name]) ? e[name] : []).filter(function (r) { return r && r.id === id; })[0];
  }
  // both sides changed one part: what they make together. This tab hasn't said its change yet, so it is the newer one
  function mergeParts(baseText, mine, theirs) {
    if (!isObj(mine) || !isObj(theirs)) return mine;
    return JSON.parse(JSON.stringify(mergeKeys(baseText === null ? null : JSON.parse(baseText), mine, theirs)));
  }
  /* One part from elsewhere into memory, undefined to delete it. `orders` collects a list's order, put right once every row is in. */
  function applyPart(p, v, orders) {
    var gone = v === undefined;
    if (p === "lastEncounter") { state.lastEncounter = gone ? null : v; return; }
    if (p === "stamps") { state.stamps = Object.create(null); if (isObj(v)) Object.keys(v).forEach(function (k) { state.stamps[k] = v[k]; }); return; }
    var kind = p.charAt(0), rest = p.slice(2);
    if (kind === "e") { if (gone) delete state.encounter[rest]; else state.encounter[rest] = v; return; }
    if (kind === "o") { orders[rest] = Array.isArray(v) ? v : []; return; }
    var cut = rest.indexOf("/"), name = rest.slice(0, cut), id = rest.slice(cut + 1);
    if (kind === "b") {
      var bag = state[name];
      if (!bag) return;
      if (gone) delete bag[id];
      else if (own(bag, id)) refill(bag[id], v);
      else bag[id] = v;
      return;
    }
    var list = state.encounter[name], i;
    if (!Array.isArray(list)) list = state.encounter[name] = [];
    for (i = 0; i < list.length; i++) if (list[i] && list[i].id === id) break;
    if (gone) { if (i < list.length) list.splice(i, 1); }
    else if (i < list.length) refill(list[i], v);
    else list.push(v);
  }
  // the named rows first, in that order; a row the order doesn't name yet keeps its place after them
  function applyOrder(name, ids) {
    var list = state.encounter[name];
    if (!Array.isArray(list)) return;
    var at = Object.create(null), rest = [], out = [];
    ids.forEach(function (id, i) { if (typeof id === "string" && !(id in at)) at[id] = i; });
    list.forEach(function (r) { if (r && typeof r.id === "string" && r.id in at) out.push(r); else rest.push(r); });
    out.sort(function (a, b) { return at[a.id] - at[b.id]; });
    list.length = 0;
    out.concat(rest).forEach(function (r) { list.push(r); });
  }
  function tieText(t) { return t === null ? "" : t; }
  /* Takes in what another tab has written. Answers whether memory changed. Sets file.owes when something
     here still has to reach storage. `past` is a document that has been written and may already be written
     over (the storage event's newValue): only what is news in it counts, and storage isn't judged by it. */
  function hear(file, past) {
    var isPast = typeof past === "string";
    var text = isPast ? past : readKey(file.key);
    if (!isPast && text === file.lastText) return false;
    var raw = null;
    if (text) {
      try { raw = JSON.parse(text); } catch (e) { return false; }   // unreadable: the next load decides
      if (!isObj(raw)) return false;
    }
    var doc;
    try { doc = migrate(raw); } catch (e) { return false; }
    var theirs = partsOf(doc, file), rev = isObj(raw) && isObj(raw.rev) ? raw.rev : {}, now = partsOf(state, file);
    var paths = {}, moved = false, orders = Object.create(null);
    [now, theirs, file.seen].forEach(function (o) { Object.keys(o).forEach(function (p) { paths[p] = 1; }); });
    Object.keys(rev).forEach(function (p) { if (fileHolds(file, p)) paths[p] = 1; });
    Object.keys(paths).forEach(function (p) {
      var was = file.seen[p] || null, wasAt = was ? was.at : 0, wasText = was ? was.text : null;
      var t = own(theirs, p) ? theirs[p] : null, at = Number(rev[p]);
      if (!isFinite(at) || at < 0) at = 0;
      if (at > file.hi) file.hi = at;
      if (t === wasText && at === wasAt) return;   // nothing new from elsewhere
      if (!(at > wasAt || (at === wasAt && at > 0 && tieText(t) > tieText(wasText)))) {
        if (!isPast) file.owes = true;             // old news: this tab's goes back in
        return;
      }
      var m = own(now, p) ? now[p] : null;
      file.seen[p] = { at: at, text: t };
      if (m === t) return;                         // the two tabs agree
      var v = valueAt(doc, p);
      if (m !== wasText && t !== null) {           // changed here too, and not yet said
        file.owes = true;
        if (m === null) return;                    // deleted here: it stays deleted
        v = mergeParts(wasText, valueAt(state, p), v);
      }
      // a far record keeps what either copy knows (THE FAR DOOR): a tab that hadn't heard can't unsay an UNDO
      if (t !== null && m !== null && p.indexOf("b/ledger/") === 0) {
        var joined = farJoin(valueAt(state, p), v);
        if (joined !== v) { v = joined; if (canon(v) !== t) file.owes = true; }
      }
      applyPart(p, v, orders);
      moved = true;
    });
    Object.keys(orders).forEach(function (name) { applyOrder(name, orders[name]); });
    if (!isPast) file.lastText = text;
    else if (moved) file.owes = true;              // storage doesn't hold it: that is how it got here
    return moved;
  }
  function revOf(file) {
    var out = {}, now = Date.now();
    Object.keys(file.seen).forEach(function (p) {
      var s = file.seen[p];
      if (s.text === null && now - s.at >= GONE_KEEP) { delete file.seen[p]; return; }
      if (s.at > 0) out[p] = s.at;
    });
    return out;
  }
  function textOf(file) {
    var doc = {}, rev = revOf(file);
    if (file.holds === "lib") {
      // en_gm_v1 belongs to the no-campaign desktop as well: everything else in it stays as it is
      var was = parseOr(readKey(file.key), null) || { v: SCHEMA };
      Object.keys(was).forEach(function (k) { doc[k] = was[k]; });
      LIB_BAGS.forEach(function (b) { doc[b] = state[b]; });
      var kept = isObj(was.rev) ? was.rev : {};
      Object.keys(kept).forEach(function (p) { if (!isLibPath(p)) rev[p] = kept[p]; });
    } else {
      Object.keys(state).forEach(function (k) { if (file.holds === "all" || LIB_BAGS.indexOf(k) === -1) doc[k] = state[k]; });
    }
    doc.rev = rev;
    return JSON.stringify(doc);
  }
  /* One file's share of a write. Stamps what changed here since the last look; whatever another tab
     saved goes into this write, never under it. A file with nothing to say is left alone. */
  function writeFile(file) {
    var res = { ok: true, moved: hear(file) };
    var now = partsOf(state, file), paths = {}, at = 0, undo = [];
    [now, file.seen].forEach(function (o) { Object.keys(o).forEach(function (p) { paths[p] = 1; }); });
    Object.keys(paths).forEach(function (p) {
      var was = file.seen[p] || null, m = own(now, p) ? now[p] : null;
      if ((was ? was.text : null) === m) return;
      if (!at) at = nextStamp(file);
      undo.push([p, was]);
      file.seen[p] = { at: at, text: m };
    });
    if (!undo.length && !file.owes) return res;
    var text = textOf(file);
    try {
      localStorage.setItem(file.key, text);
      file.lastText = text;
      file.owes = false;
    } catch (e) {
      // not said: put the notes back, so these parts still read as changed here, and try again next time
      undo.forEach(function (u) { if (u[1]) file.seen[u[0]] = u[1]; else delete file.seen[u[0]]; });
      file.owes = true;
      res.ok = false;
    }
    return res;
  }

  /* ---- persistence --------------------------------------------------------
     write() is the one place that touches storage, and it answers whether the
     write landed. persist() stamps the document and either writes now or arms
     the debounce; flush() lands a write the debounce is still holding.

     saveOk() is what the last attempt said (F5). A refused write used to vanish
     without a word: nothing on the GM side read the answer, so a full or blocked
     storage lost the GM's work until the next reload showed it gone. The Admin
     tabs' undo strip (gm.js) shows NOT SAVED while it is false. */
  var lastSaveOk = true;
  function write() {
    if (!state) return false;
    var ok = true, moved = false;
    files.forEach(function (f) {
      var r = writeFile(f);
      if (!r.ok) ok = false;
      if (r.moved) moved = true;
    });
    lastSaveOk = ok;
    // this runs inside the save of whoever called, so the repaint waits its turn
    if (moved) setTimeout(heard, 0);
    return ok;
  }
  function saveOk() { return lastSaveOk; }
  // what a repaint is told: another tab's save changed what this tab holds
  var heardFns = [];
  function onHeard(fn) { heardFns.push(fn); }
  function heard() {
    heardFns.forEach(function (fn) { try { fn(); } catch (e) {} });
    emit();
  }
  // the look before a decision that can't wait for the announcement. An edit still in the debounce goes first
  function syncTabs() {
    if (!state) return;
    if (saveTimer) { flush(); return; }
    var moved = false, owes = false;
    files.forEach(function (f) {
      if (hear(f)) moved = true;
      if (f.owes) owes = true;
    });
    if (owes) write();
    if (moved) heard();
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
  /* `from` (optional) is what a row from a campaign remembers: { name, player, campaign }, so it can
     still say who it is on a device or a day the sheet can't be read. */
  function addCrew(charId, init, initMod, from) {
    var id = uid();
    update(function (s) {
      var row = { id: id, kind: "crew", charId: charId,
                  init: init | 0, initMod: initMod | 0, acted: false };
      if (isObj(from) && typeof from.campaign === "string" && from.campaign) {
        row.campaign = from.campaign;
        row.name = String(from.name == null ? "" : from.name);
        row.player = String(from.player == null ? "" : from.player);
      }
      s.encounter.entries.push(row);
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
      s.encounter.entries.push({ id: id, kind: "threat", name: freeName(s.encounter.entries, want, null, typeof b.name === "string" ? b.name : ""),
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

     A NUMBER THIS NUMBERING ADDED is counted from its stem, so a plan run twice
     onto one Table (Encounters numbers its rows "Street Ganger 1", "Street Ganger
     2") goes on to 3 and 4 rather than becoming "Street Ganger 1 2". The lowest
     free number is used. `skipId` leaves one row out of the taken set, so a row
     can be checked against everyone but itself.

     A NUMBER IN THE STATBLOCK'S OWN NAME is part of the name, never a counter
     (F7). "Unit 7" twice used to become "Unit 7" and "Unit 2", and three of an
     "Enforcer Mk 2" read as a Mk 2, a Mk 3 and a Mk 4, three different machines.
     The tell is the block: a row is numbered by this code exactly when its name
     differs from its block's name, so `blockName` (the statblock's own name)
     decides. When the candidate IS the block's name, or no block name is given,
     a duplicate is numbered by appending to the FULL name: "Unit 7 2",
     "Enforcer Mk 2 2". Next render that row's name differs from its block's, so
     it reads as numbered and is left alone, which keeps numberThreats idempotent.

     A PLAIN name joining numbered twins is numbered too. The Encounters tab runs
     a plan's gangers in as "Street Ganger 1" and "Street Ganger 2", and one more
     added from the Bestiary used to arrive as a bare "Street Ganger" beside
     them: no two rows shared a name, but "the Street Ganger" no longer named one
     creature. It arrives as "Street Ganger 3" instead. Only rows this numbering
     named count as twins, so a real "Enforcer Mk 2" does not make an "Enforcer
     Mk" arrive as "Enforcer Mk 3". */
  function numberedRow(r) {
    var bn = r && r.block && typeof r.block.name === "string" ? r.block.name : null;
    return bn === null || r.name !== bn;
  }
  function freeName(entries, name, skipId, blockName) {
    var taken = Object.create(null), counted = Object.create(null);
    name = String(name);
    (entries || []).forEach(function (r) {
      if (!r || r.kind !== "threat" || r.id === skipId || typeof r.name !== "string") return;
      taken[r.name] = true;
      if (numberedRow(r)) counted[r.name] = true;
    });
    var m = name.match(/^(.*\S)\s+\d+$/);
    // the trailing number is this numbering's own only on a row named apart from its block
    var ours = !!m && typeof blockName === "string" && name !== blockName;
    var stem = ours ? m[1] : name;
    var twins = !ours && Object.keys(counted).some(function (k) {
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
      var name = freeName(seen, base, null, r.block && typeof r.block.name === "string" ? r.block.name : "");
      if (name !== r.name) { r.name = name; renamed++; }
      seen.push(r);
    });
    if (renamed) persist(false);
    return renamed;
  }
  /* `turnOpts` is the Table's turn rule ({skip}, see gmEngine.advance), so the
     cursor leaving a removed row passes the downed exactly as NEXT TURN would.
     When that move runs off the bottom of the order, the round ends the way
     NEXT TURN ends it: the counter turns and every acted mark clears, so the
     row now acting does not read as having acted, a Solo's Surges refill (they
     are read by round) and a clock following the round ticks. Returns true
     when the round turned. */
  function removeEntry(id, turnOpts) {
    var turned = false;
    update(function (s) {
      // resolve the successor BEFORE the removal, or advancing off the removed
      // entry lands on whatever happens to sort into its place
      if (s.encounter.activeId === id) {
        var next = EN.gmEngine.advance(s.encounter, turnOpts || null);
        s.encounter.activeId = next.activeId === id ? null : next.activeId;
        if (next.wrapped && s.encounter.activeId !== null && (s.encounter.round | 0) > 0) {
          s.encounter.round = next.round;
          s.encounter.entries.forEach(function (r) { if (r) r.acted = false; });
          turned = true;
        }
      }
      /* A threat cleared off once the fight is running keeps its XP in the award, on its feet or not: the
         Toolkit's defeated includes captured, routed, hacked, bypassed or talked down. One removed above 0
         Vitality is marked, so the award card can say so and the GM can untick a mistake. A row removed
         before round 1 was never in the fight and leaves no trace. */
      var gone = s.encounter.entries.filter(function (r) { return r.id === id; })[0];
      if (gone && gone.kind === "threat" && (s.encounter.round | 0) > 0) {
        var kept = copy(gone);
        if (Number(gone.vit) > 0) kept.removed = true;
        s.encounter.defeated = (s.encounter.defeated || []).concat([kept]);
      }
      s.encounter.entries = s.encounter.entries.filter(function (r) { return r.id !== id; });
      /* The last row gone ends the fight, not the plan: its Room, clock and name stay until the GM scraps
         it or runs a new one. A fight that had something to award is snapshotted first, as END does. */
      if (!s.encounter.entries.length) {
        snapshotFight(s);
        s.encounter.defeated = [];
        s.encounter.activeId = null; s.encounter.round = 0; turned = false;
      }
    });
    return turned;
  }
  function entry(id) {
    return get().encounter.entries.filter(function (r) { return r.id === id; })[0] || null;
  }
  /* Clearing snapshots the fight first, so the XP award and anything else that
     wants "the encounter we just finished" can still read it after the Table is
     empty. Only a FIGHT is snapshotted, meaning at least one threat row (F16):
     clearing an empty Table, or one holding only the crew pulled in for the next
     fight, must not overwrite the last real encounter, and its pending XP Award,
     with a snapshot that has nothing to award. The whole encounter resets, its
     Room tray and clock with it. */
  function clearEncounter() {
    update(function (s) {
      snapshotFight(s);
      s.encounter = blankEncounter();
    });
  }
  /* SCRAP: the plan never ran, so there's nothing to award. Its threats, Room, clock and name go; the crew's
     rows stay, as they do when a plan replaces the Table. Also how a new plan starts clean. */
  function scrapPlan() {
    update(function (s) {
      var crew = s.encounter.entries.filter(function (r) { return r && r.kind === "crew"; });
      s.encounter = blankEncounter();
      s.encounter.entries = crew;
    });
  }
  /* The rows the award reads: what's on the Table plus the threats defeated and cleared off it. A run plan
     with Objective XP is a fight too, threats or none (Toolkit: "Add objective awards on top"). */
  function snapshotFight(s) {
    var e = s.encounter, rows = e.entries.concat(e.defeated || []);
    var plan = (e.round | 0) > 0 && e.sourceId && s.encounters && own(s.encounters, e.sourceId) ? s.encounters[e.sourceId] : null;
    var objective = !!(plan && plan.objective && Number(plan.objective.awardXp) > 0);
    if (objective || rows.some(function (r) { return r && r.kind === "threat"; })) {
      s.lastEncounter = { at: Date.now(), name: e.name || "", sourceId: e.sourceId || null,
                          round: e.round | 0, entries: copy(rows) };
    }
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
  /* AN EDITOR'S OPEN COPY. The merge below works on what a tab holds in memory, but an editor (a plan, a
     scene, a job's card, a contact, a custom hazard) works on a copy of a record and saves the whole copy. Tab 1
     has a scene open, tab 2 renames it, tab 1 types in another field: tab 1 has already heard the news, so
     nothing merges, and its copy's old name goes straight back in. So an editor says what it opened (hold) and
     saves with {held: true}: what the copy changed is saved, what it didn't change stays as the record has it
     now, and where both changed one thing this save wins, being the newer. heldMoved is an editor's question on
     a redraw: the record has moved on and this copy has nothing unsaid, so open it again and show the news.
     This is this tab's business for as long as the editor is open, so it never reaches the document. */
  var heldCopies = Object.create(null);
  function hold(bag, c) {
    if (!isObj(c) || typeof c.id !== "string" || !c.id) return;
    var live = rec(bag, c.id);
    heldCopies[bag + "/" + c.id] = { mine: copy(c), live: live ? canon(live) : null };
  }
  /* A copy has something unsaid when a field of it matches neither what was held nor the record as it stands.
     An editor's copy can start from the live record, so a field equal to the record is no edit. */
  function heldMoved(bag, c) {
    if (!isObj(c) || typeof c.id !== "string" || !own(heldCopies, bag + "/" + c.id)) return false;
    var h = heldCopies[bag + "/" + c.id], live = rec(bag, c.id);
    if (!live || canon(live) === h.live) return false;
    return Object.keys(c).concat(Object.keys(h.mine)).every(function (k) {
      return canon(c[k]) === canon(h.mine[k]) || canon(c[k]) === canon(live[k]);
    });
  }
  /* Stores a COPY, so a view holding the object it passed cannot change saved
     state behind the store's back. A record without an id is new and is given
     one; createdAt is set once and kept on every later put of the same id;
     updatedAt is stamped on every put. Returns the id, or null for a bag that
     does not exist or a record that is not an object. {held: true} says this is
     an editor's open copy (above). */
  function put(bag, r, opts) {
    if (!isBag(bag) || !isObj(r)) {
      try { console.warn("GM: put() refused: unknown bag or not a record", bag); } catch (e) {}
      return null;
    }
    var c = copy(r);
    var id = (typeof c.id === "string" && c.id) ? c.id : uid();
    var now = Date.now(), isHeld = !!(opts && opts.held), key = bag + "/" + id;
    c.id = id;
    var mine = isHeld ? copy(c) : null;
    update(function (s) {
      var prev = own(s[bag], id) ? s[bag][id] : null;
      var was = isHeld && own(heldCopies, key) ? heldCopies[key] : null;
      var merged = !!(was && prev && canon(prev) !== was.live);
      if (merged) c = JSON.parse(JSON.stringify(mergeKeys(was.mine, c, prev)));
      c.createdAt = (prev && typeof prev.createdAt === "number") ? prev.createdAt
        : (typeof c.createdAt === "number" ? c.createdAt : now);
      c.updatedAt = now;
      s[bag][id] = c;
      // after a merge the record holds what the copy doesn't, so heldMoved says so, and the next draw shows it
      if (isHeld) heldCopies[key] = { mine: mine, live: merged ? null : canon(c) };
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
       {op: "milestone", kind: "major"|"minor", amount}
       {op: "heat", source, delta}
       {op: "vigor"}
     Amounts are applied as given, positive or negative, and are not clamped:
     clamping would make the inverse inexact. Nexus is rounded to hundredths, the
     way the Inventory's wallet rounds it. A posting is filed at the top of the
     record's #POST inbox, unread, under a minted id that is kept in the ledger's
     copy of the op (mail.id) so undo removes that one message and no other.

     A MILESTONE adds a whole number to ch.milestones.major or .minor, the two
     counters the #PRINT tab's Milestone tracker keeps (builder.js), and undo
     subtracts it again. Not clamped, like the amounts above.

     HEAT is the one op that IS clamped, because the Social tab's Heat is a 0 to
     10 track per source (face.js heatPanel: ch.face.heat, a list of {source,
     value} rows). The delta is a whole number and lands on the row whose source
     matches after trimming, ignoring case: the highest of them when the player
     keeps two, since that is the one a Heat board reads. With no such row, a
     rise creates one under the source as given, and a cut is not an op at all:
     there is nothing to cut, and a row at 0 would be clutter on the Social tab.
     Since a clamp cannot be subtracted back out, applying records what it did
     on the ledger's copy of the op (`applied`, below), and undo restores the
     row's exact previous value, or removes the row the write created.

     VIGOR clears the record's Vigor (ch.vitality.temp, store.js) to 0: unspent
     Vigor dissipates at the end of a combat encounter (PHB, Vigor), and the
     Table's END is where an encounter ends. It takes no amount. Applying keeps
     the Vigor it found on the ledger's copy of the op (`applied.prev`), and undo
     puts it back. Vigor never stacks (the higher value is kept), so undo keeps
     any higher Vigor the record has gained since. A record holding no Vigor
     gets no vigor op at all (vigorHeld below), so an END never files a write
     that changed nothing. */
  function whole(v) {
    var n = Number(v);
    return (isFinite(n) && n !== 0 && Math.floor(n) === n) ? n : null;
  }
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
        // what the Admin's inbox adds (deliverMail below): a package, not yet taken, and the row it came from
        var pkg = EN.store.cleanPackage ? EN.store.cleanPackage(o.mail.package) : null;
        if (pkg) { m.package = pkg; m.taken = false; }
        if (typeof o.mail.inboxId === "string" && o.mail.inboxId) m.inboxId = o.mail.inboxId;
        out.push({ op: "post", mail: m });
      } else if (o.op === "milestone") {
        var a = whole(o.amount);
        if ((o.kind !== "major" && o.kind !== "minor") || a === null) return;
        out.push({ op: "milestone", kind: o.kind, amount: a });
      } else if (o.op === "heat") {
        var src = typeof o.source === "string" ? o.source.trim() : "";
        var d = whole(o.delta);
        if (!src || d === null) return;
        out.push({ op: "heat", source: src, delta: d });
      } else if (o.op === "vigor") {
        out.push({ op: "vigor" });
      }
    });
    return out;
  }
  // a stored op is trusted only as far as it can be inverted; a file can carry anything
  function invertible(o) {
    if (!isObj(o)) return false;
    if (o.op === "glimmer" || o.op === "nexus" || o.op === "xp") return isFinite(Number(o.amount));
    if (o.op === "milestone") return (o.kind === "major" || o.kind === "minor") && isFinite(Number(o.amount));
    // a heat op is undone from what applying it recorded, never from its delta
    if (o.op === "heat") return typeof o.source === "string" && isObj(o.applied);
    // so is a vigor op, from the Vigor it found
    if (o.op === "vigor") return isObj(o.applied) && isFinite(Number(o.applied.prev));
    return o.op === "post" && isObj(o.mail) && typeof o.mail.id === "string" && !!o.mail.id;
  }

  /* ---- Heat rows ------------------------------------------------------------
     A Heat row is the Social tab's {source, value}. heatKey is how two sources
     are compared (trimmed, case ignored), heatNum how a value is read (the
     Social tab reads a missing one as 0), heatClamp the track's 0 to 10. */
  var HEAT_MAX = 10;
  function heatKey(s) { return typeof s === "string" ? s.trim().toLowerCase() : ""; }
  function heatNum(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function heatClamp(n) { return Math.max(0, Math.min(HEAT_MAX, n)); }
  function heatList(ch) { return (isObj(ch) && isObj(ch.face) && Array.isArray(ch.face.heat)) ? ch.face.heat : []; }
  // the index of the source's highest row (the earliest of equals), or -1
  function heatRow(list, key) {
    var best = -1;
    list.forEach(function (r, i) {
      if (!isObj(r) || heatKey(r.source) !== key) return;
      if (best === -1 || heatNum(r.value) > heatNum(list[best].value)) best = i;
    });
    return best;
  }
  /* Drops the cuts to a source the record holds no row for, as above. A rise
     earlier in the same write creates that row, so a cut after it stays. */
  function heatHeld(ch, ops) {
    var held = Object.create(null);
    heatList(ch).forEach(function (r) { if (isObj(r)) held[heatKey(r.source)] = true; });
    return ops.filter(function (o) {
      if (o.op !== "heat") return true;
      var k = heatKey(o.source);
      if (o.delta > 0) { held[k] = true; return true; }
      return own(held, k);
    });
  }
  /* ---- Vigor -------------------------------------------------------------------
     A record's Vigor is ch.vitality.temp (store.js; 0 or missing is none).
     vigorHeld drops a vigor op for a record that holds none, as heatHeld drops
     a cut to a source it does not hold. */
  function vigorOf(ch) {
    var n = (isObj(ch) && isObj(ch.vitality)) ? Number(ch.vitality.temp) : 0;
    return isFinite(n) && n > 0 ? n : 0;
  }
  function vigorHeld(ch, ops) {
    var has = vigorOf(ch) > 0;
    return ops.filter(function (o) { return o.op !== "vigor" || has; });
  }
  function vigorOp(ch, o, sign) {
    if (sign > 0) {
      o.applied = { prev: vigorOf(ch) };
      if (isObj(ch.vitality)) ch.vitality.temp = 0;
      return;
    }
    var a = o.applied;
    if (!isObj(a) || !(Number(a.prev) > 0)) return;
    if (!isObj(ch.vitality)) ch.vitality = { current: null, temp: 0 };
    ch.vitality.temp = Math.max(vigorOf(ch), Number(a.prev));
  }

  /* Applies a heat op and records on it, as `applied`, what undo needs:
       { created, index, next, prev, newFace, newList, len, spell }
     created (this write made the row), index (where the row was), next (the
     value it left), prev (the exact value it found, absent when the row had
     none), newFace and newList (the write also made ch.face or ch.face.heat,
     which a fresh record does not have yet), len (how many rows the list held
     after it) and spell (the row's source exactly as written), which let undo
     tell the row apart from another row of the same source after rows were
     removed. */
  function heatUp(ch, o) {
    var key = heatKey(o.source);
    var i = heatRow(heatList(ch), key);
    if (i === -1 && o.delta < 0) { o.applied = { skipped: true }; return; }   // heatHeld already dropped these
    var a = { created: false, newFace: false, newList: false };
    if (!isObj(ch.face)) { ch.face = {}; a.newFace = true; }
    if (ch.face.heat == null) { ch.face.heat = []; a.newList = true; }
    // a value that is not a list cannot take a row; throwing makes EN.store put the record back
    if (!Array.isArray(ch.face.heat)) throw new Error("ch.face.heat is not a list");
    var list = ch.face.heat;
    if (i === -1) {
      list.push({ source: o.source, value: heatClamp(o.delta) });
      a.created = true;
      a.index = list.length - 1;
    } else {
      var r = list[i];
      if (own(r, "value") && r.value !== undefined) a.prev = r.value;
      r.value = heatClamp(heatNum(r.value) + o.delta);
      a.index = i;
    }
    a.next = list[a.index].value;
    a.len = list.length;
    a.spell = list[a.index].source;
    o.applied = a;
  }
  /* The inverse. The row is found again, in this order:
     - where it can still be: its index, or as many rows above it as rows have
       been removed since (a removal above shifts it up), naming the source AND
       holding what the write left, its own spelling first;
     - else the first row of the source holding what the write left, its own
       spelling first;
     - else at its index while that names the source (edited by hand in place);
     - else the source's highest row.
     So with two rows of one source, a row removed above the written one no
     longer sends the undo to the other row (the index now points one row on).
     A write from before `len` and `spell` were kept looks at its index alone
     in the first step.
     A row this write created is removed, and with it a list or a ch.face the
     write made, when nothing else has been put in them since. A row it changed
     goes back to its exact previous value; if the player has changed that row
     by hand since, only this write's own step is taken back, so the player's
     edit is not thrown away. A row that is gone took the write with it. */
  function heatBack(ch, o) {
    var a = o.applied;
    if (!isObj(a) || a.skipped) return;
    var list = heatList(ch);
    var key = heatKey(o.source), i = -1;
    var idx = typeof a.index === "number" ? a.index : -1;
    var atIdx = idx >= 0 && isObj(list[idx]) && heatKey(list[idx].source) === key;
    function holds(j) { return isObj(list[j]) && heatKey(list[j].source) === key && list[j].value === a.next; }
    function spelt(j) { return typeof a.spell !== "string" || list[j].source === a.spell; }
    // the spelled-alike first, else the first of them
    function best(js) { var s = js.filter(spelt); return s.length ? s[0] : (js.length ? js[0] : -1); }
    var gone = typeof a.len === "number" ? Math.max(0, a.len - list.length) : 0;
    var near = [];
    for (var j = idx; idx >= 0 && j >= Math.max(0, idx - gone); j--) if (holds(j)) near.push(j);
    i = best(near);
    if (i === -1) {
      var all = [];
      list.forEach(function (r, k) { if (holds(k)) all.push(k); });
      i = best(all);
    }
    if (i === -1 && atIdx) i = idx;
    if (i === -1) i = heatRow(list, key);
    if (i === -1) return;
    var r = list[i];
    if (a.created) {
      list.splice(i, 1);
      if (a.newList && !list.length) delete ch.face.heat;
      if (a.newFace && isObj(ch.face) && !Object.keys(ch.face).length) delete ch.face;
    } else if (r.value === a.next) {
      if (own(a, "prev")) r.value = a.prev; else delete r.value;
    } else {
      r.value = heatClamp(heatNum(r.value) - (heatNum(a.next) - heatNum(a.prev)));
    }
  }

  /* A milestone op. Applying notes on the op (`applied`) whether it had to make
     ch.milestones (a record from before the tracker) or the counter's key, so
     undo can take those away again once the count is back to nothing. */
  function milestoneOp(ch, o, sign) {
    var m;
    if (sign > 0) {
      var a = {};
      if (!isObj(ch.milestones)) { ch.milestones = { major: 0, minor: 0, notes: "" }; a.made = true; }
      else if (!own(ch.milestones, o.kind)) a.added = true;
      m = ch.milestones;
      var cur = Number(m[o.kind]);
      m[o.kind] = (isFinite(cur) ? cur : 0) + Number(o.amount);
      o.applied = a;
      return;
    }
    m = ch.milestones;
    if (!isObj(m)) return;   // cleared since: nothing left to take back
    var was = Number(m[o.kind]);
    m[o.kind] = (isFinite(was) ? was : 0) - Number(o.amount);
    var done = isObj(o.applied) ? o.applied : {};
    if (done.added && m[o.kind] === 0) delete m[o.kind];
    if (done.made && !m.major && !m.minor && !m.notes) delete ch.milestones;
  }

  // sign 1 applies the op, -1 inverts it
  function applyOp(ch, o, sign) {
    if (o.op === "milestone") { milestoneOp(ch, o, sign); return; }
    if (o.op === "heat") { if (sign > 0) heatUp(ch, o); else heatBack(ch, o); return; }
    if (o.op === "vigor") { vigorOp(ch, o, sign); return; }
    if (o.op === "post") {
      if (!isObj(ch.face)) ch.face = {};
      if (!Array.isArray(ch.face.post)) ch.face.post = [];
      if (sign > 0) {
        var msg = { id: o.mail.id, from: o.mail.from, subj: o.mail.subj,
                    when: o.mail.when, body: o.mail.body, read: false };
        if (o.mail.package) { msg.package = copy(o.mail.package); msg.taken = false; }
        if (o.mail.inboxId) msg.inboxId = o.mail.inboxId;
        ch.face.post.unshift(msg);
      } else {
        ch.face.post = ch.face.post.filter(function (m) { return !(m && m.id === o.mail.id); });
      }
      return;
    }
    var cur = Number(ch[o.op]);
    var next = (isFinite(cur) ? cur : 0) + sign * Number(o.amount);
    ch[o.op] = o.op === "nexus" ? Math.round(next * 100) / 100 : next;
  }
  function rosterNow() { return (EN.store && EN.store.roster && EN.store.roster()) || {}; }
  // the record write, caught: true only when EN.store says it landed
  function recordWrite(charId, mutator, what, opts) {
    try { return EN.store.updateById(charId, mutator, opts) === true; }
    catch (e) {
      try { console.error("GM: " + what + " on " + charId + " failed", e); } catch (e2) {}
      return false;
    }
  }
  // puts a record back to a JSON copy taken earlier, in place, through the same writer
  function restoreRecord(charId, snap) {
    return recordWrite(charId, function (ch) {
      Object.keys(ch).forEach(function (k) { delete ch[k]; });
      Object.keys(snap).forEach(function (k) { ch[k] = snap[k]; });
    }, "rollback");
  }

  /* `at` is kept strictly increasing across write records. A payday credits a whole
     crew in one click, so several writes land in the same millisecond, and with equal
     stamps undo would pick among them arbitrarily instead of newest first. */
  function nextAt(s) {
    var newest = 0;
    Object.keys(s.ledger).forEach(function (k) {
      var r = s.ledger[k];
      if (r && typeof r.at === "number" && r.at > newest) newest = r.at;
    });
    return Math.max(Date.now(), newest + 1);
  }

  /* Returns the ledger record's id, or false when it refuses: a charId that is not
     in the roster (a deleted record, or an example, which is never stored), no
     usable op, or a write this device would not store. The ledger record is filed
     BEFORE the record write so the render the write triggers already shows it.

     BOTH WRITES LAND OR NEITHER DOES (F5). The record write and the GM document
     write are two localStorage keys, and either can be refused (storage full,
     site data blocked). A refused record write is rolled back by EN.store itself
     and the ledger record withdrawn. A refused document write withdraws the
     ledger record and puts the player record back as it was before (a copy taken
     first), in memory and in storage, so the ledger and the record never
     disagree after a reload. Only if even that rollback is refused does the
     write stand: then the record really has it, so its ledger record is kept,
     undoable for this session, and saveOk() reports the document unsaved.

     `meta` (optional) is a plain JSON object kept on the ledger record as
     `rec.meta`, saying what made the write, so a view finds it again through
     liveWrites() after a reload:
       {source: "award", encounterAt, sourceId, jobId}
       {source: "posting", jobId}
       {source: "payday", paydayId, encounterAt, jobId}
       {source: "milestone"}   (Payroll's AWARD MILESTONE)
       {source: "vigor"}       (the Table's END, clearing the crew's Vigor)

     A character another player holds has the charId "row:<row id>", and goes through the far door below. */
  function writeCrew(charId, label, ops, meta) {
    syncTabs();
    if (isCampaignRow(charId)) return sendCrew(charId, label, ops, meta);
    var roster = rosterNow();
    if (typeof charId !== "string" || !own(roster, charId) || !isObj(roster[charId])) return false;
    if (!EN.store.updateById) return false;
    // a Heat cut to a source the record does not hold is no op, nor is clearing Vigor it does not hold (see the vocabulary above)
    var clean = vigorHeld(roster[charId], heatHeld(roster[charId], cleanOps(ops)));
    if (!clean.length) return false;
    var tag = null;
    if (isObj(meta)) { try { tag = copy(meta); } catch (e) { tag = null; } }
    var s = get(), id = uid();
    var at = nextAt(s);
    var before = copy(roster[charId]);
    var r = { id: id, kind: "write", at: at, label: String(label == null ? "" : label),
              charId: charId, charName: roster[charId].name || "", ops: clean, undone: false,
              createdAt: at, updatedAt: at };
    if (tag) r.meta = tag;
    s.ledger[id] = r;
    var ok = recordWrite(charId, function (ch) {
      clean.forEach(function (o) { applyOp(ch, o, 1); });
    }, "write", { ledger: "From the GM: " + (r.label || "credited") });
    if (!ok) { delete s.ledger[id]; emit(); return false; }
    if (!persist(true)) {
      /* The ledger record is withdrawn before the rollback, so the render the rollback
         triggers no longer shows it. persist(true) dropped any debounced write it was
         holding, so a retry is re-armed either way; storage keeps the document from
         before this call meanwhile. */
      delete s.ledger[id];
      if (restoreRecord(charId, before)) {
        persist(false);
        emit();
        return false;
      }
      s.ledger[id] = r;
      try { console.error("GM: the ledger for " + charId + " is not saved and the record kept the write."); } catch (e) {}
      persist(false);
    }
    emit();
    return id;
  }

  /* THE FAR DOOR (the writing tabs through the inbox). A character another player holds has the id
     "row:<row id>" (js/campaigns.js). Its sheet isn't on this device, so a write can't land on it here:
     it goes as a row in the character_inbox table, and that player's app files it (deliverMail, below).
     In every other way it is a write like any other. It files the same ledger record, with the same
     tag, so "already paid", UNDO and every view that reads the ledger go on working without knowing.

     THE LEDGER IS THE OUTBOX. writeCrew answers at once, because every tab's flow is built on that, and the
     row goes a moment later (flushSends). A record carries `far`: { by, row, desk, state, rowId, why, fix, told, ending }.
     state: queued, sent, refused, or skipped (taken back before it landed). fix: what UNDO still owes,
     queued, done, recalled, refused, limit (the marks' limit), or lost (its campaign ended, and what landed stays).

     ONCE, WHATEVER THE NETWORK DOES. The record's id is the row's send key, and the database answers a
     repeat with the row it already made, so a send that lost its answer, a reload or a second tab can all
     simply send again. They go oldest first, one at a time, and no answer stops the run: it is the link.
     A run takes in every desktop on this device (EVERY DESKTOP'S OUTBOX), and every Admin tab runs one.

     A REFUSAL IS AN ANSWER. A code from the database means it will never land: the character left the
     campaign, or this account stopped running it. The record is marked undone, so it doesn't read as paid,
     and a toast names who missed out. Anything else (the network, a session gone for now, a migration
     not applied yet) is no answer, so it stays queued and says so on the tab (sendsWaiting).

     A POSTING IS PLAIN MAIL, anything else is a row with ops, with a letter on it. A closed list of what the
     door can carry, because the database has one: Heat and Vigor depend on what the sheet holds, so they
     aren't on it yet.

     UNDO IS A CORRECTION, AND THE DATABASE DECIDES IT. A player's app files a row in about a second, so what
     UNDO usually finds is already on their sheet, and only that player's app can write it. Whether a send
     landed is something no tab can know: another tab, or a copy of the record on another desktop, may have
     sent it. So UNDO asks take_back (the migration). A key with no row is marked taken back, and a send under it
     later is refused, EN_TAKEN_BACK. A row with ops gets a second row with the numbers the other way and a
     letter saying so. A posting is recalled if it's still waiting, and followed by a letter if it isn't. Both
     can leave a wallet below zero, as the near door's UNDO can.

     WHAT EITHER COPY KNOWS STAYS KNOWN (farJoin). Two tabs can each write one record, and storage between tabs
     lags. A send, a refusal, an UNDO and what came of it only ever move forward, so wherever two copies meet,
     in a tab hearing another or in a run writing to another desktop, the record keeps the furthest of each.

     WHOSE. The GM document is one per browser, and a campaign's rows aren't. A record goes only under the account
     that wrote it (`by`), so somebody else jacking in on this browser can't get it refused. */
  var FAR_FROM = { payday: "Payroll", award: "XP Award", milestone: "Milestones", posting: "JOB BOARD" };
  var FAR_RETRY = 30000, FAR_WAIT = 5000;
  var _sending = null, _sendAgain = false, _sendStuck = false, _sendTimer = null, _sendRetry = null;
  function farNums(ops) {
    return ops.filter(function (o) { return o.op === "glimmer" || o.op === "nexus" || o.op === "xp" || o.op === "milestone"; }).map(function (o) {
      var n = { op: o.op, amount: Number(o.amount) };
      if (o.op === "milestone") n.kind = o.kind;
      return n;
    });
  }
  // a cut that can't leave half a character behind: the database refuses a lone surrogate
  function farCut(s, n) { return String(s).slice(0, n).replace(/[\uD800-\uDBFF]$/, ""); }
  function farCommas(n) { return String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function farLine(o) {
    var a = Math.abs(o.amount);
    if (o.op === "glimmer") return "𝒢" + farCommas(a);
    if (o.op === "nexus") return "◎" + a;
    if (o.op === "xp") return farCommas(a) + " XP";
    return a + " " + (o.kind === "major" ? "Major" : "Minor") + (a === 1 ? " Milestone" : " Milestones");
  }
  // the letter on a row, inside what the database takes. A posting or a pay stub is its own letter
  function farLetter(r) {
    var post = r.ops.filter(function (o) { return o.op === "post"; })[0], m = post ? post.mail : null;
    var src = isObj(r.meta) ? r.meta.source : "", label = String(r.label || "");
    var body = m ? String(m.body || "")
      : (label.length > 140 ? label + "\n\n" : "") + farNums(r.ops).map(farLine).join("\n") + "\n\nIt's on your sheet.";
    if (body.length > 4000) body = farCut(body, 3940) + "\n\nThe rest didn't fit. Ask the GM.";
    var out = { from: farCut(String((m ? m.from : FAR_FROM[src]) || "").trim(), 80) || "The GM", subj: farCut(String(m ? m.subj : label).trim(), 140), body: body };
    if (m && m.when) out.when = farCut(String(m.when).trim(), 40);
    return out;
  }
  function farFixLetter(r) {
    var first = farLetter(r), nums = farNums(r.ops);
    return { from: first.from, subj: farCut((nums.length ? "Taken back: " : "Withdrawn: ") + first.subj, 140),
             body: nums.length ? "The GM took this back:\n" + nums.map(farLine).join("\n") + "\n\nIt's off your sheet." : "The GM withdrew this." };
  }
  function farOwner() { var c = EN.cloud; return c && c.userId ? c.userId() : null; }
  // who can send right now: the same account, with a link
  function farUser() {
    var c = EN.cloud;
    return (c && !(c.offline && c.offline()) && EN.campaigns && EN.campaigns.sendWrite) ? farOwner() : null;
  }
  function farDue(r, who) {
    // imported or not: it still owes what it owes, and the key means a browser holding the same one can't make it two
    return isObj(r) && r.kind === "write" && isObj(r.far) && r.far.by === who &&
           ((r.far.state === "queued" && r.undone !== true) || (r.undone === true && r.far.fix === "queued"));
  }
  // what this account still owes on the desktop in memory, oldest first
  function farHere(who) {
    return list("ledger").filter(function (r) { return farDue(r, who); }).sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
  }
  /* EVERY DESKTOP'S OUTBOX. A ledger belongs to the desktop it was written on, and a send queued there waits for the link,
     not for the Admin to go back to that campaign: a run reads every desktop on this device. A run holds items,
     { r, key, camp }: the record, the document it is kept in, and that desktop's name for a toast.

     A step works from the record as it is now (farFresh), not as the run found it, because a tab open on that desktop
     may have sent it or taken it back while earlier sends were out. What the step decides is a change of a few fields
     (farSave), put on the record as it is where it's kept: in memory through persist, or in another desktop's document,
     written back with its stamp in `rev` (TWO TABS, ONE DESKTOP), so a tab open there hears it and keeps its own change. */
  function farKeys() {
    var out = [STATE_KEY];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(CAMP_PRE) === 0 && k.slice(-CAMP_SUF.length) === CAMP_SUF) out.push(k);
      }
    } catch (e) {}
    return out;
  }
  function campOf(raw) { return !isObj(raw) || !isObj(raw.campaign) ? "No campaign" : (typeof raw.campaign.name === "string" && raw.campaign.name) || "Unnamed campaign"; }
  // the campaign a desktop's document belongs to, from its key, or null for en_gm_v1's own
  function campIdOf(k) { return k.indexOf(CAMP_PRE) === 0 && k.slice(-CAMP_SUF.length) === CAMP_SUF ? k.slice(CAMP_PRE.length, -CAMP_SUF.length) : null; }
  /* the campaign the send was made on, which every copy of it names, wherever the copy is kept now. None for one made on
     the browser's own desktop (desk: null), even once a move has put it on a campaign's. A record from before far.desk
     has none at all, and is judged by the desktop it's kept on, as it was then */
  function farDeskOf(r, k) {
    if (!isObj(r.far)) return null;
    if (typeof r.far.desk === "string") return r.far.desk;
    return r.far.desk === undefined ? campIdOf(k) : null;
  }
  function farTodo(who) {
    var here = deskKey(deskId), camp = campOf(state);
    var out = farHere(who).map(function (r) { return { r: r, key: here, camp: camp, campId: farDeskOf(r, here) }; });
    farKeys().forEach(function (k) {
      if (k === here) return;
      var text = readKey(k);
      if (!text || text.indexOf('"queued"') === -1) return;   // nothing owed there, so nothing to read
      var raw = parseOr(text, null), led = raw && isObj(raw.ledger) ? raw.ledger : null;
      if (!led) return;
      Object.keys(led).forEach(function (id) {
        var r = led[id];
        if (!isObj(r)) return;
        r.id = id;
        if (farDue(r, who)) out.push({ r: r, key: k, camp: campOf(raw), campId: farDeskOf(r, k) });
      });
    });
    return out.sort(function (a, b) { return (a.r.at || 0) - (b.r.at || 0); });
  }
  function inMemory(it) { return it.key === deskKey(deskId) && !!state && own(state.ledger, it.r.id) && state.ledger[it.r.id] === it.r; }
  // the record where it's kept, or null when it's gone from there
  function farStored(it) {
    var raw = parseOr(readKey(it.key), null), led = raw && isObj(raw.ledger) ? raw.ledger : null;
    return led && isObj(led[it.r.id]) && isObj(led[it.r.id].far) ? { raw: raw, rec: led[it.r.id] } : null;
  }
  /* Two copies of one far record, as one: the furthest each part has gone. A send, a refusal or an UNDO can't
     be unsaid by a copy that hadn't heard it. `undone` follows from the rest. Anything that isn't a far record
     comes back as `b`, the same object. */
  var FAR_RANK = { queued: 0, refused: 1, skipped: 2, sent: 3 }, FIX_RANK = { queued: 1, refused: 2, limit: 2, lost: 2.5, recalled: 3, done: 4 };
  function farJoin(a, b) {
    if (!isObj(a) || !isObj(b) || !isObj(a.far) || !isObj(b.far) || a.kind !== "write" || b.kind !== "write") return b;
    var out = copy(b), f = out.far, af = a.far;
    if ((FAR_RANK[af.state] || 0) > (FAR_RANK[f.state] || 0)) f.state = af.state;
    if (af.rowId && !f.rowId) f.rowId = af.rowId;
    if (af.why && !f.why) f.why = af.why;
    if ((FIX_RANK[af.fix] || 0) > (FIX_RANK[f.fix] || 0)) f.fix = af.fix;
    if (af.told) f.told = true;
    if (af.ending && !f.ending) f.ending = af.ending;
    // an UNDO that couldn't go leaves what landed as paid
    out.undone = (!!f.fix && f.fix !== "lost") || f.state === "refused" || f.state === "skipped";
    var at = [a.undoneAt, b.undoneAt].filter(function (x) { return typeof x === "number"; }).sort(function (x, y) { return x - y; })[0];
    if (out.undone && at) out.undoneAt = at;
    if (!out.undone) delete out.undoneAt;
    return out;
  }
  // what the record says now, with what this run knows. Answers whether it's still there. The desktop in memory hears other tabs by itself
  function farFresh(it) {
    if (inMemory(it)) return true;
    var got = farStored(it);
    if (!got) return false;
    got.rec.id = it.r.id;
    refill(it.r, farJoin(it.r, got.rec));
    return true;
  }
  // a change: { far: { field: value }, and the record's own fields }
  function farPut(r, ch) {
    Object.keys(ch).forEach(function (k) {
      if (k !== "far") { r[k] = ch[k]; return; }
      Object.keys(ch.far).forEach(function (f) { r.far[f] = ch.far[f]; });
    });
  }
  // a step's change, where the record is kept. The run's copy has it either way
  function farSave(it, ch) {
    var r = it.r;
    farPut(r, ch);
    if (inMemory(it)) { persist(true); farSpread(it); return; }
    // a desktop this tab isn't on, or left while the send was out
    var got = farStored(it);
    if (!got) return;                                         // gone from there: nowhere to say it
    var next = farJoin(r, got.rec);
    if (!farWrite(it.key, got.raw, r.id, next)) return;
    refill(r, copy(next));
    farSpread(it);
  }
  // one record into a stored desktop, stamped in its `rev`. A desktop this tab has open hears it the way it hears any other tab
  function farWrite(key, raw, id, rec) {
    rec.id = id;
    raw.ledger[id] = rec;
    var rev = isObj(raw.rev) ? raw.rev : (raw.rev = {}), at = Date.now();
    Object.keys(rev).forEach(function (p) { if (Number(rev[p]) >= at) at = Number(rev[p]) + 1; });
    rev["b/ledger/" + id] = at;
    try { localStorage.setItem(key, JSON.stringify(raw)); } catch (e) { return false; }
    if (files.some(function (f) { return f.key === key; })) syncTabs();
    return true;
  }
  /* The same send kept on other desktops too (a move that kept a copy, a file imported into another campaign): each copy
     hears what this one learned, so one can't read as paid while another reads as taken back. */
  function farSpread(it) {
    var r = it.r, here = deskKey(deskId);
    farKeys().forEach(function (k) {
      if (k === it.key) return;
      if (k === here && state) {
        var mem = own(state.ledger, r.id) ? state.ledger[r.id] : null;
        if (!isObj(mem) || !isObj(mem.far)) return;
        var j = farJoin(r, mem);
        if (canon(j) === canon(mem)) return;
        refill(mem, j);
        persist(true);
        emit();
        return;
      }
      var text = readKey(k);
      if (!text || text.indexOf('"' + r.id + '"') === -1) return;
      var got = farStored({ key: k, r: r });
      if (!got) return;
      var next = farJoin(r, got.rec);
      if (canon(next) !== canon(got.rec)) farWrite(k, got.raw, r.id, next);
    });
  }
  function sendCrew(charId, label, ops, meta) {
    var who = farUser(), row = who ? EN.campaigns.crewRow(charId) : null;
    if (!row) return false;
    var clean = cleanOps(ops);
    if (!clean.length || clean.some(function (o) { return o.op === "heat" || o.op === "vigor"; })) return false;
    var s = get(), id = uid(), at = nextAt(s);
    var r = { id: id, kind: "write", at: at, label: String(label == null ? "" : label), charId: charId, charName: row.name || "",
              ops: clean, undone: false, createdAt: at, updatedAt: at, far: { by: who, row: row.rowId, state: "queued", desk: deskId || null } };
    if (isObj(meta)) { try { r.meta = copy(meta); } catch (e) {} }
    s.ledger[id] = r;
    // on this device first, or a reload could send a write the ledger has no word of
    if (!persist(true)) { delete s.ledger[id]; persist(false); emit(); return false; }
    emit();
    soonSends();
    return id;
  }
  function undoFar(r) {
    r.undone = true;
    r.undoneAt = Date.now();
    r.far.fix = "queued";
    if (!persist(true)) {
      r.undone = false;
      delete r.undoneAt;
      delete r.far.fix;
      persist(false);
      emit();
      return false;
    }
    emit();
    soonSends();
    return r;
  }
  function soonSends() {
    clearTimeout(_sendTimer);
    _sendTimer = setTimeout(function () { _sendTimer = null; flushSends(); }, 0);
  }
  /* A code from the database, which is an answer. EN_SIGNED_OUT comes right by itself. Class 22 is Postgres saying what
     was sent can't be stored, and sending it again won't change that: as no answer it would hold up everything behind it. */
  function farAnswer(e) {
    var m = e && e.message ? String(e.message) : "", c = e && e.code ? String(e.code) : "";
    if (/^22/.test(c)) return c;
    return /^EN_/.test(m) && m !== "EN_SIGNED_OUT" ? m : "";
  }
  /* Another account signed in since the run began: its session must not send, or be refused, for this one. */
  var NOT_MINE = { notMine: true };
  function farMine(r) { if (farUser() !== r.far.by) throw NOT_MINE; }
  // the same, said by the database: the session changed between that look and the request (EN_NOT_MINE in the migration)
  function farNotMine(e) { if (e && String(e.message || "") === "EN_NOT_MINE") throw NOT_MINE; }
  // UNDO, as the database decides it. `r.far` is read where it is at every step: a save heard from another tab puts a new object there
  /* A CAMPAIGN'S DESKTOP ENDS WITH IT (the author, 9 Nov 2026: "They end with it", and for a campaign still there that this
     account no longer runs, "End like a delete"). Each send and UNDO names the campaign of the desktop it was made on
     (`far.desk`, the same for every copy, wherever it's kept), and the database answers. Deleted, or no longer this account's
     to run: the record closes for good, its key is marked through take_back so no copy anywhere can send it, even if the
     account runs that campaign again, and the Admin is told once (farSaid). A send that landed stays paid, since its money
     is on the sheet: what's lost is its UNDO, told as such. Nothing is sent to the player. */
  /* The author's words, 9 Nov 2026, with the campaign named ("Yes, name it"): "Lost in #POST (5th flavor has ended)" and
     "Lost in #POST (You no longer run 5th flavor)". One notice for several names each, and with no name known the words
     are as they were, "This campaign has ended" and "You no longer run this campaign". The UNDO lines on what landed are
     suggested, not the author's. */
  function farSaid(items, paid, ended) {
    var c = farCamps(items);
    var what = ended ? (c ? c.list + (c.many ? " have ended" : " has ended") : "This campaign has ended")
                     : "You no longer run " + (c ? c.list : "this campaign");
    return paid ? "UNDO lost in #POST (" + what + "): what landed stays paid." : "Lost in #POST (" + what + ")";
  }
  // the names the desktops' documents hold for the campaigns these were made on: "Fifth", "Fifth and Sixth",
  // "Fifth, Sixth and another campaign". Null when none is known
  function farCamps(items) {
    var ids = Object.create(null), names = [], unnamed = 0;
    items.forEach(function (it) {
      var id = it.campId || "";
      if (id in ids) return;
      ids[id] = true;
      var n = farCampName(it.campId);
      if (!n) unnamed++;
      else if (names.indexOf(n) === -1) names.push(n);
    });
    if (!names.length) return null;
    if (unnamed) names.push(unnamed === 1 ? "another campaign" : unnamed + " other campaigns");
    return { list: names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1], many: names.length > 1 };
  }
  // the name a campaign's own desktop holds for it, or "" when none is known
  function farCampName(id) {
    if (!id) return "";
    var raw = id === deskId && state ? state : parseOr(readKey(deskKey(id)), null);
    return isObj(raw) && isObj(raw.campaign) && typeof raw.campaign.name === "string" ? raw.campaign.name.trim() : "";
  }
  function FAR_LIMIT_SAID(names) { return "Could not take back the send to " + names + ": this account has taken back too many sends that never went."; }
  /* Closed for good, so it is never due again, and the Admin hears of it once. A send that landed stays paid: the money is
     on the sheet, so the ledger must not say it was taken back, and paying again would pay twice. */
  function farEnd(it, run, why, landed) {
    var r = it.r;
    run[landed ? why + "Paid" : why].push(it);
    if (landed) farSave(it, { undone: false, undoneAt: undefined, far: { state: "sent", fix: "lost" } });
    else farSave(it, { undone: true, undoneAt: r.undoneAt || Date.now(), far: { state: r.far.state === "queued" ? "skipped" : r.far.state, fix: "done" } });
  }
  // UNDO, as the database decides it. `r.far` is read where it is at every step: a save heard from another tab puts a new object there
  function farBack(it, run) {
    var r = it.r, letter;
    if (!farFresh(it) || r.far.fix !== "queued") return;   // gone from its desktop, or another tab has asked already
    try { letter = farFixLetter(r); } catch (e) { try { console.warn("A queued UNDO can't be read, so it stays queued.", r.id, e); } catch (e2) {} return; }
    farMine(r);
    return EN.campaigns.takeBack(r.far.row, r.id, letter, r.far.by, it.campId).then(function (said) {
      var sent = r.far.state === "sent";
      if (said === "ended" || said === "ended_landed") farEnd(it, run, "ended", sent || said === "ended_landed");
      else if (said === "not_running" || said === "not_running_landed") farEnd(it, run, "notRunning", sent || said === "not_running_landed");
      // a send refused as ended or not run, whose campaign came back before this: it ends all the same, and is said
      else if (said === "cancelled" && r.far.ending) farEnd(it, run, r.far.ending === "EN_ENDED" ? "ended" : "notRunning", false);
      else if (said === "cancelled") farSave(it, { far: { state: r.far.state === "queued" ? "skipped" : r.far.state, fix: "done" } });
      else farSave(it, { far: { state: "sent", fix: said === "recalled" ? "recalled" : "done" } });
    }, function (e) {
      farNotMine(e);
      var code = farAnswer(e);
      if (!code) throw e;
      if (!farFresh(it) || r.far.fix !== "queued") return;    // gone, or another tab has given the answer already
      // the marks' limit: words of its own, and nothing more owed
      if (code === "EN_TOO_MANY") { run.limited.push(it); farSave(it, { far: { fix: "limit", why: code } }); return; }
      run.unfixed.push(it);
      farSave(it, { far: { fix: "refused" } });
    });
  }
  function farStep(it, run) {
    var r = it.r;
    return Promise.resolve().then(function () {
      if (!farFresh(it)) return;                             // gone from where it was kept: the ledger has no word of it
      if (r.undone) return;                                  // its UNDO, below, is all there is to do
      if (r.far.state !== "queued") return;
      var nums, letter;
      // a record this app can't read stays queued, and holds up nothing behind it
      try { nums = farNums(r.ops); letter = farLetter(r); } catch (e) { try { console.warn("A queued send can't be read, so it stays queued.", r.id, e); } catch (e2) {} return; }
      farMine(r);
      return EN.campaigns.sendWrite(r.far.row, r.id, letter, nums.length ? nums : null, r.far.by, it.campId).then(function (rowId) {
        farFresh(it);
        farSave(it, { far: { state: "sent", rowId: rowId } });
      }, function (e) {
        farNotMine(e);
        var code = farAnswer(e);
        if (!code) throw e;
        if (!farFresh(it) || r.far.state !== "queued") return;   // gone, or another tab has given the answer already
        // its campaign has ended, or isn't this account's to run: take_back below closes it for good, and marks the key
        if (code === "EN_ENDED" || code === "EN_NOT_RUNNING") { farSave(it, { undone: true, undoneAt: r.undoneAt || Date.now(), far: { fix: "queued", ending: code } }); return; }
        if (code === "EN_TAKEN_BACK") { farSave(it, { undone: true, undoneAt: r.undoneAt || Date.now(), far: { state: "skipped", fix: "done" } }); return; }
        // taken back while it was out: nothing landed, and the UNDO below marks the key, so no copy that hadn't heard can land it
        if (r.undone) { farSave(it, { far: { state: "refused", why: code } }); return; }
        run.refused.push(it);
        farSave(it, { undone: true, undoneAt: Date.now(), far: { state: "refused", why: code } });
      });
    }).then(function () {
      if (r.undone && r.far.fix === "queued") return farBack(it, run);
    });
  }
  function farNames(items) {
    var names = [];
    items.forEach(function (it) { var n = it.r.charName || "a Freelancer"; if (names.indexOf(n) === -1) names.push(n); });
    return names.join(", ");
  }
  // one sentence for the desktop in memory, and one for each other desktop, which it names
  function farTell(items, said) {
    var here = deskKey(deskId), groups = [], by = Object.create(null);
    items.forEach(function (it) {
      var g = it.key === here ? "" : it.key;
      if (!(g in by)) { by[g] = { camp: g ? it.camp : "", items: [] }; groups.push(by[g]); }
      by[g].items.push(it);
    });
    return groups.map(function (g) { return said(farNames(g.items), g.camp ? ", from " + g.camp + ": that campaign" : ": this campaign"); });
  }
  /* A run says what it has to in one toast, since a toast has one slot and a second would hide the first, one notice to a
     line (the toast keeps line breaks). Only to the account it's about: if another has signed in since, it waits until
     that account is back, and then goes in front of what its next run says. */
  var _unsaid = Object.create(null);
  function farSay(who, lines) {
    if (!lines.length) return;
    if (farOwner() !== who || !EN.ui || !EN.ui.toast) { _unsaid[who] = (_unsaid[who] || []).concat(lines); return; }
    var text = lines.join("\n");
    // up long enough to read, since some of it is said nowhere else
    EN.ui.toast(text, Math.min(12000, text.length * 55));
  }
  function flushSends() {
    if (_sending) { _sendAgain = true; return _sending; }
    var who = farUser();
    if (!who) return Promise.resolve();
    var waiting = _unsaid[who] || [];
    delete _unsaid[who];
    var todo = farTodo(who);
    if (!todo.length) { farSay(who, waiting); _sendStuck = false; return Promise.resolve(); }
    var run = { refused: [], unfixed: [], ended: [], endedPaid: [], notRunning: [], notRunningPaid: [], limited: [] }, failed = false, wasStuck = _sendStuck, lines = waiting;
    clearTimeout(_sendRetry);
    _sending = todo.reduce(function (p, it) {
      return p.then(function () { return farStep(it, run); });
    }, Promise.resolve()).then(function () { _sendStuck = false; }, function (e) {
      if (e === NOT_MINE) return;   // the account that signed in sends its own; this one's go when it's back
      failed = true;
      try { console.warn("A send to another player's sheet did not go. It stays queued.", e); } catch (e2) {}
      if (!_sendStuck) {
        _sendStuck = true;
        lines.push("Could not reach your account. What you sent goes when the link is back.");
      }
      _sendRetry = setTimeout(function () { flushSends(); }, FAR_RETRY);
    }).then(function () {
      _sending = null;
      var again = _sendAgain;
      _sendAgain = false;
      lines = lines.concat(farTell(run.refused, function (names, which) { return "Not delivered to " + names + which + " can't reach them any more, so it doesn't count as paid."; }));
      lines = lines.concat(farTell(run.unfixed, function (names, which) { return "Could not send the correction to " + names + which + " can't reach them any more."; }));
      if (run.limited.length) lines.push(FAR_LIMIT_SAID(farNames(run.limited)));
      if (run.ended.length) lines.push(farSaid(run.ended, false, true));
      if (run.endedPaid.length) lines.push(farSaid(run.endedPaid, true, true));
      if (run.notRunning.length) lines.push(farSaid(run.notRunning, false, false));
      if (run.notRunningPaid.length) lines.push(farSaid(run.notRunningPaid, true, false));
      farSay(who, lines);
      // the link back takes the note off the tab, unless somebody is typing there
      var el = document.activeElement, typing = !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
      if ((run.refused.length || run.unfixed.length || (wasStuck && !failed && !typing)) && EN.app && EN.app.render) EN.app.render();
      if (again && !failed) return flushSends();
    });
    return _sending;
  }
  // what has been waiting long enough to mention: a send on a good link has gone before anyone could read this
  function sendsWaiting() {
    var who = farOwner();
    if (!who) return 0;
    var now = Date.now();
    return farHere(who).filter(function (r) { return now - (r.undone && r.undoneAt ? r.undoneAt : (r.at || 0)) > FAR_WAIT; }).length;
  }

  /* A refusal has to outlast its toast: the link can come back hours later, with the Admin on another tab. These stay on the
     undo strip, on every Admin tab on the desktop it was written on, until they are read. One UNDO already asked for has
     nothing to say. The waiting note above is that desktop's too: what's queued elsewhere goes all the same. */
  function farNotices() {
    var who = farOwner();
    return list("ledger").filter(function (r) {
      return isObj(r) && isObj(r.far) && r.far.by === who && !r.far.told && ((r.far.state === "refused" && r.far.fix !== "done") || r.far.fix === "refused" || r.far.fix === "limit");
    });
  }
  function farNoticeRead(id) {
    var r = rec("ledger", id);
    if (!isObj(r) || !isObj(r.far)) return;
    r.far.told = true;
    persist(true);
    emit();
  }

  /* THE COURIER'S DOOR (campaigns batch 3). A row from the character_inbox table becomes a #POST
     message the way a posting does: cleanOps, then applyOp, through EN.store.updateById. What it
     does not do is file a ledger record. The ledger is the GM's undo list on the GM's device, and
     this runs on the player's device, for mail their Admin already sent, so there is nothing here
     for anyone to undo.

     The row's id goes on the record in the same write (meta.inboxApplied), so whichever device's
     copy wins the sync holds the message once, and the message's id is made from the row's, so
     every device's copy of it is the same message. Answers whether the write landed. Called only
     for a row the record has not filed yet: js/cloud.js asks first, because a write that changed
     nothing would still read as a local edit.

     A ROW WITH OPS changes numbers too, in that same one write, so a copy holds the numbers and the
     row's id together or neither. That is what makes it once: a copy that lost them to another
     device's save doesn't list the row, so it files them again, and a copy that has them does. The
     numbers go through the ops the far door's closed list allows and no others, and the wallet's own
     Ledger gets a line, an Adjustment if it's a correction. */
  function deliverMail(charId, rowId, mail, ops) {
    var roster = rosterNow();
    if (typeof charId !== "string" || !own(roster, charId) || !isObj(roster[charId]) || !EN.store.updateById) return false;
    if (typeof rowId !== "string" || !rowId || !isObj(mail)) return false;
    var clean = cleanOps([{ op: "post", mail: { from: mail.from, subj: mail.subj, when: mail.when, body: mail.body, package: mail.package, inboxId: rowId } }]);
    if (!clean.length) return false;
    clean[0].mail.id = "pm_in_" + rowId;
    var nums = cleanOps(Array.isArray(ops) ? farNums(ops.filter(isObj)) : []);
    var back = nums.some(function (o) { return Number(o.amount) < 0; }), subj = String(mail.subj || "").trim() || "credited";
    return recordWrite(charId, function (ch) {
      if (!isObj(ch.meta)) ch.meta = {};
      if (!Array.isArray(ch.meta.inboxApplied)) ch.meta.inboxApplied = [];
      ch.meta.inboxApplied.push(rowId);
      applyOp(ch, clean[0], 1);
      nums.forEach(function (o) { applyOp(ch, o, 1); });
    }, "mail", nums.length ? { ledger: back ? { memo: "Adjustment: " + subj, kind: "adjust" } : "From the GM: " + subj } : undefined);
  }
  /* The sender recalled it in the moment between this device reading the row and marking it
     delivered. The message comes back off the record unless the player has already opened it or
     taken what was in it: nobody can unread a letter. The row's id stays on the record. */
  function withdrawMail(charId, rowId) {
    var ch = rosterNow()[charId];
    var list = isObj(ch) && isObj(ch.face) && Array.isArray(ch.face.post) ? ch.face.post : [];
    var gone = list.filter(function (m) { return isObj(m) && m.inboxId === rowId && !m.read && !m.taken; });
    if (!gone.length) return false;
    return recordWrite(charId, function (c) {
      c.face.post = c.face.post.filter(function (m) { return gone.map(function (g) { return g.id; }).indexOf(m && m.id) === -1; });
    }, "withdraw");
  }

  /* THE WRITES THAT STILL STAND, newest first: write records not undone, not
     imported (history from a GM file, never applied on this device's records,
     F6), and whose Freelancer is still in the roster (a deleted record took the
     write's effect with it). `filter(rec)` narrows them, usually by rec.meta.
     This is the reading for UNDO: every view decides whether its award,
     posting or payday can still be taken back from this and nothing else (F4,
     F10). The records are the live ones: read them, never change them. */
  function isLive(r, roster, withImported) {
    // a far write's sheet was never in this roster (the far door, above)
    return isObj(r) && r.kind === "write" && !r.undone && (withImported || !r.imported) && Array.isArray(r.ops) &&
           typeof r.charId === "string" && (own(roster, r.charId) || isObj(r.far));
  }
  function standing(filter, withImported) {
    var roster = rosterNow();
    var out = list("ledger").filter(function (r) {
      if (!isLive(r, roster, withImported)) return false;
      if (typeof filter !== "function") return true;
      try { return !!filter(r); } catch (e) { return false; }
    });
    out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    return out;
  }
  function liveWrites(filter) { return standing(filter, false); }
  /* THE WRITES THAT COUNT AS PAID, newest first: liveWrites plus the imported
     ones. An imported write cannot be undone here (F6), but it is still a
     payment: restoring a backup on the device that made it, after lost browser
     data, brings back records that really hold those writes. So every "already
     paid" guard (an award made, a payday credited) reads this, and only UNDO
     reads liveWrites; otherwise an import made every award and payday it held
     payable a second time. A write to a record no longer in the roster still
     does not count, the same as in liveWrites. */
  function paidWrites(filter) { return standing(filter, true); }

  /* The write undoLast() would invert, or null: the newest write that still
     stands (liveWrites). A write to a record deleted since is passed over, since
     its effect went with the record, and so is an imported one, since this
     device never applied it. Exposed so a view can name what UNDO will do before
     the GM presses it. */
  function undoable() {
    // not another account's far write, on a browser they share: only that account can send the correction
    var who = farOwner();
    return liveWrites(function (r) { return !isObj(r.far) || r.far.by === who; })[0] || null;
  }
  /* Inverts the newest write, ops in reverse order, and marks its ledger record
     undone. Returns that record, null when there is nothing to undo, or false
     when this device refused one of the two writes (F5): then nothing changed,
     the record and the ledger both stay as they were. The record keeps its
     updatedAt, so undoing does not move it to the top of the ledger. */
  function undoLast() {
    syncTabs();
    var r = undoable();
    if (!r) return null;
    if (isObj(r.far)) return undoFar(r);
    var before = copy(rosterNow()[r.charId]);
    r.undone = true;
    r.undoneAt = Date.now();
    var ok = recordWrite(r.charId, function (ch) {
      r.ops.slice().reverse().forEach(function (o) { if (invertible(o)) applyOp(ch, o, -1); });
    }, "undo", { ledger: { memo: "Adjustment: the GM undid \"" + (r.label || "a write") + "\"", kind: "adjust" } });
    if (!ok) { r.undone = false; delete r.undoneAt; emit(); return false; }
    if (!persist(true)) {
      var undoneAt = r.undoneAt;
      r.undone = false;
      delete r.undoneAt;
      if (restoreRecord(r.charId, before)) {
        persist(false);
        emit();
        return false;
      }
      r.undone = true;
      r.undoneAt = undoneAt;
      try { console.error("GM: the ledger for " + r.charId + " is not saved and the record kept the undo."); } catch (e) {}
      persist(false);
    }
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
    // the campaign a file was exported from, for the confirmation that names it
    if (s.campaign && s.campaign.name) c.campaign = s.campaign.name;
    return c;
  }
  // what a count says, in words: Settings' GM data section and the one-time card use the same sentence
  function countText(c) {
    function say(n, one, many) { return n + " " + (n === 1 ? one : many); }
    var parts = [];
    if (c.threats) parts.push(say(c.threats, "saved threat", "saved threats"));
    if (c.encounters) parts.push(say(c.encounters, "saved encounter", "saved encounters"));
    if (c.hazards) parts.push(say(c.hazards, "custom hazard", "custom hazards"));
    if (c.jobs) parts.push(say(c.jobs, "logged job", "logged jobs"));
    if (c.ledger) parts.push(say(c.ledger, "ledger record", "ledger records"));
    if (c.heat) parts.push(say(c.heat, "Heat record", "Heat records"));
    if (c.contacts) parts.push(say(c.contacts, "contact card", "contact cards"));
    if (c.scenes) parts.push(say(c.scenes, "saved scene", "saved scenes"));
    if (c.entries) parts.push(say(c.entries, "initiative row", "initiative rows"));
    if (c.room) parts.push(say(c.room, "Room hazard", "Room hazards"));
    if (c.running) parts.push("a fight's clock or name");
    if (c.lastFight) parts.push("the last fight's XP award");
    return parts.length ? parts.join(", ") : "nothing saved yet";
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
     device refused the write, in which case the import holds only until reload.

     AN IMPORTED WRITE IS HISTORY, NEVER UNDOABLE HERE (F6). The file's ledger says
     what was written to the records on the device that made it, at the time it
     was made. This device's records may never have had those writes (another
     device), or have had them undone since (an older backup), so inverting one
     would take away what was never paid. Every incoming write record is marked
     `imported: true`, which undoable(), undoLast() and liveWrites() all skip; the
     count comes back as importedWrites. paidWrites() still counts them, so what
     the file says was paid is never offered for payment again. */
  function importDoc(text) {
    var next = parseDoc(text);
    var importedWrites = 0;
    Object.keys(next.ledger).forEach(function (k) {
      var r = next.ledger[k];
      if (isObj(r) && r.kind === "write") { r.imported = true; importedWrites++; }
    });
    // a debounced write of the OLD document must not land over the new one
    clearTimeout(saveTimer);
    saveTimer = null;
    /* On a campaign's desktop a file replaces that desktop and only adds to the library, which other
       desktops are using too: a threat the library has already stays as the library has it. Anything the
       document no longer holds reads as deleted here, so another tab on this desktop takes the file whole. */
    if (deskId) {
      LIB_BAGS.forEach(function (b) {
        var had = get()[b];
        Object.keys(had).forEach(function (k) { next[b][k] = had[k]; });
      });
      next.campaign = { id: deskId, name: state.campaign ? state.campaign.name : "" };
    } else delete next.campaign;
    state = next;
    var droppedCrew = pruneCrew();
    var c = counts(state);
    delete c.campaign;
    c.droppedCrew = droppedCrew;
    c.importedWrites = importedWrites;
    c.saved = persist(true);
    emit();
    return c;
  }

  /* ---- which desktop --------------------------------------------------------------
     desk() is the campaign this tab's desktop belongs to, as { id, name }, or null for en_gm_v1's own.
     follow() is how a tab gets where EN.campaigns says it should be, and app.js asks on every render:
     a pick, a jack in or out, and a campaign created, left or deleted all end in a render. It costs a
     look at a short list, and does nothing unless the answer changed. */
  var deskKeepers = [];
  function desk() { return deskId && state && state.campaign ? { id: deskId, name: state.campaign.name } : null; }
  /* A view's working state belongs to a desktop as much as the records it is working on: a half-built
     payday can't follow you to another campaign. take() answers what to keep, and give(kept) puts it back,
     or starts fresh on null. Kept in memory for this tab's life, so going back finds the work where it was.
     take() may still save, since the old desktop is the one in memory when it runs. */
  function perDesk(take, give) { deskKeepers.push({ take: take, give: give, kept: Object.create(null) }); }
  function follow() {
    if (!state) return false;
    var want = wantedDesk(), id = want ? want.id : null;
    if (id === deskId) {
      if (want && state.campaign && state.campaign.name !== want.name) state.campaign.name = want.name;   // renamed: said at the next write
      return false;
    }
    var from = deskId || "", to = id || "";
    deskKeepers.forEach(function (k) { try { k.kept[from] = k.take(); } catch (e) { try { console.warn("GM: a view could not keep its work", e); } catch (e2) {} } });
    /* The last edit goes to the desktop it was made on. If this device refuses it, this tab stays on that
       desktop, so the work is still here, and NOT SAVED says why. The next render tries again. */
    if (!persist(true)) return false;
    readDesk(want);
    deskKeepers.forEach(function (k) { try { k.give(own(k.kept, to) ? k.kept[to] : null); } catch (e) { try { console.warn("GM: a view could not start on this desktop", e); } catch (e2) {} } });
    emit();
    return true;
  }

  /* ---- what is on this device, beyond the desktop in memory -------------------------
     The parts of en_gm_v1 that aren't the library, as counts, or null when there are none. Only
     the things a move would carry count. */
  var MOVE_BAGS = BAGS.filter(function (b) { return LIB_BAGS.indexOf(b) === -1; });
  function tableBusy(e) {
    return !!(e.entries.length || e.room.length || e.clock || e.name || e.sourceId || (e.defeated && e.defeated.length) || (e.round | 0) > 0);
  }
  function deviceHolds() {
    var doc;
    try { doc = migrate(parseOr(readKey(STATE_KEY), null)); } catch (e) { return null; }
    var c = counts(doc), any = tableBusy(doc.encounter) || !!doc.lastEncounter;
    if (doc.lastEncounter) c.lastFight = true;
    if (tableBusy(doc.encounter) && !c.entries && !c.room) c.running = true;
    MOVE_BAGS.forEach(function (b) { if (c[b]) any = true; });
    LIB_BAGS.forEach(function (b) { delete c[b]; });
    delete c.campaign;
    return any ? c : null;
  }
  /* MOVES en_gm_v1's own work into the campaign this tab is on, on the Admin's word. Answers { ok, moved,
     stayed, tableStayed, copied, why }. Nothing is ever written over: a record already here under the same
     id with different contents stays behind, a Table stays behind when this desktop's is in use, and so
     does a row a different campaign owns. `copied` says the second step failed, so the work is in both.

     In this order, so a failure at any point costs nothing:
       1. the backup, or nothing happens     2. this desktop's write, or it is all put back
       3. en_gm_v1 lets go                   */
  function moveDevice() {
    if (!deskId || !state) return { ok: false, why: "no-desktop" };
    if (!persist(true)) return { ok: false, why: "refused" };
    var text = readKey(STATE_KEY), doc;
    try { doc = migrate(parseOr(text, null)); } catch (e) { return { ok: false, why: "unreadable" }; }
    var took = [], stayed = 0, res = { ok: true, moved: 0, stayed: 0, tableStayed: false, copied: false };
    var me = farOwner();
    MOVE_BAGS.forEach(function (b) {
      Object.keys(doc[b]).forEach(function (id) {
        // another account's send on this browser isn't this account's to carry into its campaign
        if (b === "ledger" && isObj(doc[b][id].far) && doc[b][id].far.by !== me) return;
        var here = own(state[b], id) ? state[b][id] : null;
        if (here && canon(here) !== canon(doc[b][id])) stayed++;
        else took.push("b/" + b + "/" + id);
      });
    });
    var moveTable = tableBusy(doc.encounter) && !tableBusy(state.encounter);
    var moveLast = !!doc.lastEncounter && !state.lastEncounter;
    if (tableBusy(doc.encounter) && !moveTable) res.tableStayed = true;
    if (doc.lastEncounter && !moveLast && canon(doc.lastEncounter) !== canon(state.lastEncounter)) stayed++;
    res.stayed = stayed;
    // nothing to take: a move that does nothing must not put an emptied document over the copy of the full one
    if (!took.length && !moveTable && !moveLast) return res;
    var oldCopy = readKey(PREMOVE_KEY);
    function putCopyBack() {
      try { if (oldCopy === null) localStorage.removeItem(PREMOVE_KEY); else localStorage.setItem(PREMOVE_KEY, oldCopy); } catch (e) {}
    }
    try { localStorage.setItem(PREMOVE_KEY, JSON.stringify({ at: Date.now(), text: text })); }
    catch (e) { return { ok: false, why: "refused" }; }
    took.forEach(function (p) {
      var cut = p.indexOf("/", 2), b = p.slice(2, cut), id = p.slice(cut + 1);
      state[b][id] = doc[b][id];
    });
    var leftRows = [];
    if (moveTable) {
      var e = doc.encounter;
      leftRows = e.entries.filter(function (r) { return r.kind === "crew" && r.campaign && r.campaign !== deskId; });
      var rows = e.entries.filter(function (r) { return leftRows.indexOf(r) === -1; });
      state.encounter = e;
      e.entries = rows;
      if (e.activeId && !rows.some(function (r) { return r.id === e.activeId; })) e.activeId = null;
    }
    if (moveLast) state.lastEncounter = doc.lastEncounter;
    if (!persist(true)) {
      putCopyBack();
      readDesk({ id: deskId, name: state.campaign ? state.campaign.name : "" });
      emit();
      return { ok: false, why: "refused" };
    }
    // en_gm_v1 lets go of exactly what moved, and says so in `rev`, so a tab open on that desktop follows
    var raw = parseOr(readKey(STATE_KEY), null) || { v: SCHEMA };
    var rev = isObj(raw.rev) ? raw.rev : (raw.rev = {}), at = Date.now();
    Object.keys(rev).forEach(function (p) { if (Number(rev[p]) >= at) at = Number(rev[p]) + 1; });
    took.forEach(function (p) {
      var cut = p.indexOf("/", 2), b = p.slice(2, cut), id = p.slice(cut + 1);
      if (isObj(raw[b])) delete raw[b][id];
      rev[p] = at;
    });
    if (moveTable && isObj(raw.encounter)) {
      var empty = blankEncounter(), old = raw.encounter;
      ROW_LISTS.forEach(function (k) {
        (Array.isArray(old[k]) ? old[k] : []).forEach(function (r) {
          if (r && typeof r.id === "string" && !(k === "entries" && leftRows.some(function (l) { return l.id === r.id; }))) rev["r/" + k + "/" + r.id] = at;
        });
        rev["o/" + k] = at;
      });
      Object.keys(empty).forEach(function (k) { if (ROW_LISTS.indexOf(k) === -1) rev["e/" + k] = at; });
      empty.entries = leftRows;
      raw.encounter = empty;
    }
    if (moveLast) { raw.lastEncounter = null; rev.lastEncounter = at; }
    try { localStorage.setItem(STATE_KEY, JSON.stringify(raw)); }
    catch (e2) { res.copied = true; }
    res.moved = took.length + (moveTable ? 1 : 0) + (moveLast ? 1 : 0);
    res.stayed = stayed + leftRows.length;
    emit();
    return res;
  }

  /* The backup moveDevice() takes, as { at, text }, or null. */
  function premove() {
    var v = parseOr(readKey(PREMOVE_KEY), null);
    return v && typeof v.text === "string" && typeof v.at === "number" ? v : null;
  }
  function dropPremove() { try { localStorage.removeItem(PREMOVE_KEY); } catch (e) {} }
  /* Desktops on this device that this tab can't open from the picker: the campaign was deleted or left, or
     another account on this browser runs it. Their work is still here, and Settings offers it as a file.
     `live` is the ids the picker offers. */
  function leftBehind(live) {
    var out = [], ids = Object.create(null);
    (live || []).forEach(function (id) { ids[id] = true; });
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf(CAMP_PRE) !== 0 || k.slice(-CAMP_SUF.length) !== CAMP_SUF) continue;
        var id = k.slice(CAMP_PRE.length, -CAMP_SUF.length);
        if (ids[id] || id === deskId) continue;
        var doc = null;
        try { doc = migrate(parseOr(readKey(k), null)); } catch (e) { doc = null; }
        if (!doc) continue;
        var c = counts(doc);
        delete c.campaign;
        out.push({ id: id, name: doc.campaign && doc.campaign.name ? doc.campaign.name : "Unnamed campaign", counts: c });
      }
    } catch (e) {}
    return out.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
  }
  // with the library, like any export, so importing it where a file replaces everything can't empty the library
  function exportLeft(id) {
    var doc = migrate(parseOr(readKey(deskKey(id)), null));
    var lib = migrate(parseOr(readKey(STATE_KEY), null));
    LIB_BAGS.forEach(function (b) { doc[b] = lib[b]; });
    return JSON.stringify(doc, null, 2);
  }
  // a whole desktop, gone from this device: Settings asks first. Never the one a tab is on
  function dropLeft(id) {
    if (!id || id === deskId) return false;
    try { localStorage.removeItem(deskKey(id)); return true; } catch (e) { return false; }
  }

  try {
    window.addEventListener("pagehide", function () { flush(); });
    // a timer in a hidden tab can wait a second or more, and the Admin has just gone to the other tab
    document.addEventListener("visibilitychange", function () { if (document.hidden) flush(); else syncTabs(); });
    window.addEventListener("storage", function (e) {
      if (!state) return;
      var mine = files.filter(function (f) { return f.key === e.key; });
      if (e.key !== null && !mine.length) return;
      /* A campaign's document only ever goes on purpose, through Settings in another tab (dropLeft). This tab
         hasn't heard the campaign went, so it stays here for now, on an empty desktop. It must not write it back. */
      if (mine.length && mine[0].holds === "desk" && e.newValue === null) {
        clearTimeout(saveTimer);
        saveTimer = null;
        readDesk({ id: deskId, name: state.campaign ? state.campaign.name : "" });
        heard();
        return;
      }
      /* The announcement carries what was written. If a tab that hadn't heard has already written over it, and
         the tab that wrote it has since closed, this is the one copy left of that save. It goes in first, and
         the look at storage below then finds storage behind and puts it back. */
      var moved = false;
      if (typeof e.newValue === "string") {
        mine.forEach(function (f) { if (e.newValue !== readKey(f.key) && hear(f, e.newValue)) moved = true; });
      }
      syncTabs();
      if (moved) setTimeout(heard, 0);
    });
  } catch (e) {}

  return {
    load: load, get: get, update: update, on: on, uid: uid,
    addCrew: addCrew, isCampaignRow: isCampaignRow, addThreat: addThreat, removeEntry: removeEntry, entry: entry,
    clearEncounter: clearEncounter, scrapPlan: scrapPlan, pruneCrew: pruneCrew,
    // one name per threat row: the numbering addThreat applies, for rows from any other path
    numberThreats: numberThreats, freeName: freeName,
    saveThreat: saveThreat, savedThreats: savedThreats, removeThreat: removeThreat,
    // the record bags
    list: list, rec: rec, put: put, drop: drop,
    // the live encounter's other parts
    setRoom: setRoom, setClock: setClock, setEncounterMeta: setEncounterMeta,
    // GM writes to player records, and the ones that still stand
    writeCrew: writeCrew, undoLast: undoLast, undoable: undoable, liveWrites: liveWrites, paidWrites: paidWrites,
    // the far door's outbox: js/cloud.js says when to try again, and the tabs say what's still waiting
    flushSends: flushSends, sendsWaiting: sendsWaiting, farNotices: farNotices, farNoticeRead: farNoticeRead,
    // the player's side of the Admin's inbox (js/cloud.js)
    deliverMail: deliverMail, withdrawMail: withdrawMail,
    // the document as a file, and whether the last write of it landed
    exportDoc: exportDoc, importDoc: importDoc, inspectDoc: inspectDoc, countText: countText, flush: flush, saveOk: saveOk,
    // which desktop this tab is on, and two tabs on one, and on one record
    desk: desk, follow: follow, perDesk: perDesk, syncTabs: syncTabs, onHeard: onHeard, hold: hold, heldMoved: heldMoved,
    // work on this device beyond the desktop in memory
    deviceHolds: deviceHolds, moveDevice: moveDevice, premove: premove, dropPremove: dropPremove,
    leftBehind: leftBehind, exportLeft: exportLeft, dropLeft: dropLeft
  };
})();
