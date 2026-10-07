/* ===========================================================================
   ELYSIUM NIGHTS · GM Hazards (Admin tab)
   The Hazards tab and the Room tray that hangs under the Table. The book is
   EN.gmBook.hazards (data/gm_hazards.js). This file READS it and never
   restates it, so a correction to the transcription reaches every screen and
   no rule is typed twice.

   FOUR VIEWS on the tab, picked from a chip row the way the Bestiary picks a
   category: the Library (the eight Set Pieces and the GM's own hazards), the
   Composer (write a hazard in the book's four lines), the Reference (the
   chapter's tables) and the Tools (the chase stalemate roller, falling damage
   and an object damage check).

   THE ROOM TRAY. A hazard never takes an initiative slot. The book's whole
   rule is "Not an initiative slot: a presence", and it prints no initiative
   count for one, so a live hazard sits in encounter.room and the Table draws
   this module's tray under the order (a registered Table extra). The tray
   works out from the Table's round what each hazard does this round. Nothing
   in the initiative order moves for it.

   A HAZARD OBJECT is the one shape every caller sees, Set Piece or custom:
     { key, name, source: "setpiece"|"custom", grade, trigger, save, dcByGrade,
       dc, bite: {band, dice, text, onSuccess, perSpaces}, counter,
       timing: {kind, n, text}, notes, xp, pricing: "opposition"|"flavor" }
   `save` is the attribute name ("Body") or null; `counter` is text or null.
   A Set Piece also carries what its page prints beside the four lines:
   printed, printedGrade, printedDc, effects, material, area, anomalies and
   bestiary. Every one of them is copied out of the data, never written here.

   A ROOM ENTRY is what toRoomEntry() returns and the tray reads:
     { id, key, name, grade, dc, save, trigger, bite, counter, timing,
       startRound, roundsLeft, cleared, notes } plus effects, material and
       anomalies when the hazard has them.
   `roundsLeft` is a countdown's length as of `startRound`. The live figure is
   computed from the Table's round on every render rather than written back,
   so advancing the Table never has to touch the Room.

   RULINGS this file applies (author rulings for this build, not book text):
   a Set Piece at another Grade takes that Grade's DC off the ladder and keeps
   its printed dice and counter DCs; a recurring Nuisance or Dangerous hazard
   is free unless the GM enters XP; the stalemate roller rolls the row and the
   GM sets the Impact DC, either by picking a speed off the GM's Card table
   (stalemate.impactBySpeed in the data, printed in the appendix, not beside
   the district tables) or by typing a number, and a typed number wins; Flow
   Disturbances anomalies stay free text in the Room's notes.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmHazards = (function () {
  var el = EN.ui.el, toast = EN.ui.toast;
  var gm = EN.gmStore;

  function book() { return (EN.gmBook && EN.gmBook.hazards) || null; }
  function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function copy(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function trim(s) { return s == null ? "" : String(s).replace(/^\s+|\s+$/g, ""); }
  function upperFirst(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function lowerFirst(s) { s = String(s || ""); return s.charAt(0).toLowerCase() + s.slice(1); }
  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }
  function noStop(s) { return trim(s).replace(/\.$/, ""); }

  /* ---- transient UI state --------------------------------------------------
     Deliberately not persisted, like the Threat Builder's inputs in gm.js: a
     card's "use at Grade" pick or a half-typed hazard is not worth a save slot.
     Keyed maps are null-prototype because a custom hazard's key is a record id
     and a Room row's key is an id too. */
  var _ui = { view: "library", focus: null, scroll: false };
  var _lib = Object.create(null);     // hazard key -> {grade, pricing, open}
  var _c = null;                      // the Composer's draft
  var _cBase = null;                  // the draft as it was opened, to tell an unsaved change (F17)
  var _cActs = null;                  // the Composer's button row, repainted while the GM types
  var _cSig = null;                   // what that row says, so it is rebuilt only when that changes
  var _rolls = Object.create(null);   // Room row id -> the last bite rolled
  var _fall = Object.create(null);    // Room row id -> spaces typed for a fall
  var _tools = { district: null, stalemate: null, speed: "", impact: "", spaces: "", fall: null,
                 mat: "average", integ: "", dmg: "", hit: null, ruleOpen: false };

  /* ---- the book's numbers, read where they live ---------------------------- */
  function grades() {
    var H = book();
    return Object.keys((H && H.dcByGrade) || {}).map(Number).filter(function (g) { return g > 0; })
      .sort(function (a, b) { return a - b; });
  }
  // a whole Grade inside the ladder, else the fallback, else the Set Pieces' own Grade
  function gradeOf(g, fallback) {
    var gs = grades(), n = parseInt(g, 10);
    if (isNaN(n)) n = parseInt(fallback, 10);
    if (isNaN(n)) { var H = book(); n = (H && H.setPieces && H.setPieces.grade) || 3; }
    if (!gs.length) return n;
    return Math.max(gs[0], Math.min(gs[gs.length - 1], n));
  }
  function ladderDc(g) {
    var H = book();
    return H && own(H.dcByGrade, g) ? H.dcByGrade[g] : null;
  }
  function bandOf(key) {
    var H = book();
    return ((H && H.bites) || []).filter(function (b) { return b.key === key; })[0] || null;
  }
  function bandDice(key) {
    var b = bandOf(key);
    return b ? b.count + "d" + b.sides : "";
  }
  function equivalentOf(band) {
    var H = book();
    return ((H && H.pricing && H.pricing.equivalents) || []).filter(function (e) { return e.bite === band; })[0] || null;
  }
  function pricingCase(key) {
    var H = book();
    return ((H && H.pricing && H.pricing.cases) || []).filter(function (c) { return c.key === key; })[0] || null;
  }
  // the anatomy's own field names ("Save and DC"), so the cards say what the page says
  function fieldName(key, fallback) {
    var H = book();
    var f = ((H && H.anatomy && H.anatomy.fields) || []).filter(function (x) { return x.key === key; })[0];
    return f ? f.name : fallback;
  }
  function fieldText(key) {
    var H = book();
    var f = ((H && H.anatomy && H.anatomy.fields) || []).filter(function (x) { return x.key === key; })[0];
    return f ? f.text : "";
  }
  function designationName(key) {
    var d = ((EN.threats && EN.threats.designations) || []).filter(function (x) { return x.key === key; })[0];
    return d ? d.name : upperFirst(key);
  }

  /* ---- timing --------------------------------------------------------------
     The data names its timings in the book's terms (entry, cycle, trigger,
     countdown, while, round, anomaly). Every caller of this module works in the
     contract's seven kinds, so the Set Pieces are translated once, here. Crowd
     Surge is the one "while" that also ticks per creature at the start of its
     turn, and that tick is when its bite lands, so it reads as startOfTurn. */
  var KINDS = [
    { key: "onEntry",      label: "On entry" },
    { key: "everyNRounds", label: "Every N rounds", hasN: true },
    { key: "countdown",    label: "Countdown", hasN: true },
    { key: "endOfRound",   label: "End of each round" },
    { key: "startOfTurn",  label: "Start of a turn" },
    { key: "onTrigger",    label: "On its trigger" },
    { key: "scene",        label: "The whole scene" }
  ];
  var FROM_BOOK = { "entry": "onEntry", "cycle": "everyNRounds", "trigger": "onTrigger", "countdown": "countdown",
                    "while": "scene", "round": "endOfRound", "anomaly": "scene" };
  function kindOf(key) {
    return KINDS.filter(function (k) { return k.key === key; })[0] || KINDS[KINDS.length - 1];
  }
  function timingLabel(t) {
    t = t || {};
    var k = kindOf(t.kind), n = t.n | 0;
    if (t.kind === "everyNRounds" && n > 0) return n === 1 ? "Every round" : "Every " + n + " rounds";
    if (t.kind === "countdown" && n > 0) return "Countdown, " + plural(n, "round");
    return k.label;
  }

  /* ---- Set Pieces and custom hazards as one shape --------------------------- */
  function fromSetPiece(sp) {
    var t = sp.timing || {};
    var kind = own(FROM_BOOK, t.kind) ? FROM_BOOK[t.kind] : "scene";
    if (t.kind === "while" && t.tick && t.tick.at === "turnstart") kind = "startOfTurn";
    var n = null;
    if (kind === "everyNRounds") n = t.every | 0;
    if (kind === "countdown") n = t.rounds | 0;
    var text = t.text || "";
    if (t.tick && t.tick.text) text += "; " + t.tick.text;
    var b = sp.bite || null;
    return {
      key: sp.key, name: sp.name, source: "setpiece", grade: sp.grade,
      trigger: sp.trigger || null,
      save: sp.save ? sp.save.attr : null,
      // only a printed save has a DC to move with the Grade
      dcByGrade: !!sp.save,
      dc: sp.save ? sp.save.dc : null,
      bite: { band: b ? (b.band || null) : null, dice: b ? (b.dice || null) : null, text: b ? (b.text || "") : "",
              onSuccess: b ? (b.onSuccess || null) : null, perSpaces: b ? (b.perSpaces || null) : null },
      counter: sp.counter ? sp.counter.text : null,
      timing: { kind: kind, n: n, text: text },
      notes: "", xp: null, pricing: "opposition",
      printed: sp.text || "", printedGrade: sp.grade, printedDc: sp.save ? sp.save.dc : null,
      effects: (sp.effects || []).slice(), material: sp.material ? copy(sp.material) : null,
      area: sp.area || null, anomalies: sp.anomalies ? sp.anomalies.slice() : null,
      bestiary: (sp.bestiary || []).slice()
    };
  }
  /* A saved record read back defensively: a hand-edited or imported file can
     carry anything, and a card that throws would take the Library with it. */
  function fromRecord(r) {
    var b = r.bite && typeof r.bite === "object" ? r.bite : {};
    var t = r.timing && typeof r.timing === "object" ? r.timing : {};
    var g = gradeOf(r.grade);
    var dcBy = r.dcByGrade !== false;
    var save = r.save ? String(r.save) : null;
    return {
      key: r.id, id: r.id, name: r.name ? String(r.name) : "Unnamed hazard", source: "custom", grade: g,
      trigger: r.trigger ? String(r.trigger) : null,
      save: save, dcByGrade: !!save && dcBy,
      dc: save ? (dcBy ? ladderDc(g) : (Number(r.dc) || ladderDc(g))) : null,
      bite: { band: b.band || null, dice: b.dice || null, text: b.text ? String(b.text) : "",
              onSuccess: b.onSuccess || null, perSpaces: b.perSpaces || null },
      counter: r.counter ? String(r.counter) : null,
      timing: { kind: kindOf(t.kind).key, n: t.n == null ? null : (t.n | 0), text: t.text ? String(t.text) : "" },
      notes: r.notes ? String(r.notes) : "",
      xp: (typeof r.xp === "number" && isFinite(r.xp)) ? r.xp : null,
      pricing: r.pricing === "flavor" ? "flavor" : "opposition",
      effects: [], material: null, area: null, anomalies: null, bestiary: []
    };
  }
  function setPieces() {
    var H = book();
    return ((H && H.setPieces && H.setPieces.items) || []).map(fromSetPiece);
  }
  function customs() {
    return gm.list("hazards").map(function (r) {
      try { return fromRecord(r); } catch (e) { return null; }
    }).filter(Boolean);
  }
  // every hazard the GM can reach: the eight Set Pieces, then their own, newest first
  function all() { return setPieces().concat(customs()); }
  function byKey(key) {
    if (key == null) return null;
    var H = book();
    var sp = ((H && H.setPieces && H.setPieces.items) || []).filter(function (s) { return s.key === key; })[0];
    if (sp) return fromSetPiece(sp);
    var r = gm.rec("hazards", String(key));
    return r ? fromRecord(r) : null;
  }

  /* A hazard at another Grade. The save DC comes off the ladder when the hazard
     takes it from the ladder (every printed Set Piece save does: DC 15 is the
     G3 rung). The dice and any DC inside the counter text stay as printed: the
     ruling for this build is that the GM moves those by hand. A hazard with an
     overridden DC keeps it. Returns a copy; the original is never changed. */
  function atGrade(hazard, grade) {
    if (!hazard || typeof hazard !== "object") return null;
    var h = copy(hazard);
    var g = gradeOf(grade, hazard.grade);
    h.grade = g;
    if (h.save && h.dcByGrade) {
      var dc = ladderDc(g);
      if (dc != null) h.dc = dc;
    }
    return h;
  }

  /* The budget price of a hazard at a Grade. Free flavor is free ("charge
     nothing"). A number the GM typed is the price. Otherwise the book's two
     equivalents: a Severe recurring hazard prices as a Standard threat of that
     Grade and a Lethal one as an Elite, read off the data's xpByGrade rows. The
     book prices nothing else, so a Nuisance or Dangerous hazard is 0 (ruling:
     free unless the GM enters XP). */
  function priceXp(hazard, grade) {
    if (!hazard || typeof hazard !== "object") return 0;
    if (hazard.pricing === "flavor") return 0;
    if (typeof hazard.xp === "number" && isFinite(hazard.xp) && hazard.xp >= 0) return hazard.xp;
    var eq = equivalentOf(hazard.bite && hazard.bite.band);
    var g = gradeOf(grade, hazard.grade);
    if (eq && eq.xpByGrade && own(eq.xpByGrade, g)) return Number(eq.xpByGrade[g]) || 0;
    return 0;
  }

  /* A live Room row from a hazard. `startRound` is the round it comes into
     play (an encounter wave's arrival round, or the Table's round when added
     by hand); it defaults to the Table's current round, never below 1. */
  function toRoomEntry(hazard, grade, startRound) {
    var h = atGrade(hazard, grade);
    if (!h) return null;
    var s = parseInt(startRound, 10);
    if (isNaN(s) || s < 1) {
      var cur = 0;
      try { cur = gm.get().encounter.round | 0; } catch (e) { cur = 0; }
      s = Math.max(1, cur);
    }
    var t = h.timing || {};
    var b = h.bite || {};
    var row = {
      id: gm.uid(), key: h.key || null, name: h.name || "Hazard", grade: h.grade,
      dc: h.save ? h.dc : null, save: h.save || null, trigger: h.trigger || null,
      bite: { band: b.band || null, dice: b.dice || null, text: b.text || "",
              onSuccess: b.onSuccess || null, perSpaces: b.perSpaces || null },
      counter: h.counter || null,
      timing: { kind: kindOf(t.kind).key, n: t.n == null ? null : (t.n | 0), text: t.text || "" },
      startRound: s,
      roundsLeft: t.kind === "countdown" ? Math.max(0, t.n | 0) : null,
      cleared: false, notes: h.notes || ""
    };
    if (h.effects && h.effects.length) row.effects = h.effects.slice();
    if (h.material) row.material = copy(h.material);
    if (h.anomalies && h.anomalies.length) row.anomalies = h.anomalies.slice();
    return row;
  }

  /* ---- dice -------------------------------------------------------------- */
  // "4d6", "6d6 or more" (the Lethal band's open top rolls its printed six), "2d6+3"
  function parseDice(s) {
    var m = String(s || "").match(/(\d+)\s*d\s*(\d+)(?:\s*([+-])\s*(\d+))?/i);
    if (!m) return null;
    var n = parseInt(m[1], 10), sides = parseInt(m[2], 10);
    if (!(n > 0) || !(sides > 0)) return null;
    return { n: n, sides: sides, mod: m[3] ? (m[3] === "-" ? -1 : 1) * parseInt(m[4], 10) : 0 };
  }
  function rollDice(n, sides, mod) {
    var rolls = [], sum = 0;
    for (var i = 0; i < n; i++) { var v = 1 + Math.floor(Math.random() * sides); rolls.push(v); sum += v; }
    return { n: n, sides: sides, mod: mod || 0, rolls: rolls, total: sum + (mod || 0) };
  }
  function rollText(r) {
    var expr = r.n + "d" + r.sides + (r.mod ? (r.mod > 0 ? "+" : "") + r.mod : "");
    var parts = r.rolls.join(" + ") + (r.mod ? (r.mod > 0 ? " + " : " - ") + Math.abs(r.mod) : "");
    return expr + ": " + parts + " = " + r.total;
  }

  /* ---- small view helpers (each view file carries its own, per gm.js) ---- */
  function heading(title, sub) {
    return el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" },
        html: title + ' <span class="dim3" style="font-size:13px">' + sub + "</span>" })
    ]);
  }
  /* The shared "last write to a Freelancer record" strip (gm.js) under the
     heading, so the newest GM write can always be undone from any Admin tab
     (F4). Null while gm.js has no strip or nothing is undoable. */
  function undoStrip() {
    try {
      return (EN.gmView && typeof EN.gmView.undoStrip === "function") ? (EN.gmView.undoStrip() || null) : null;
    } catch (e) {
      try { console.error("GM Hazards: the undo strip failed", e); } catch (e2) {}
      return null;
    }
  }
  function lbl(t) { return el("label.fl", { text: t }); }
  function mono(t, color) {
    return el("span.mono", { style: { fontSize: "10px", letterSpacing: ".1em", color: color || "var(--text3)" }, text: t });
  }
  // one labeled line of a card: a mono label and the book's words beside it
  function line(label, value, hook) {
    return el("div", { "data-hook": hook, style: { display: "flex", gap: "8px", alignItems: "baseline", flexWrap: "wrap", margin: "3px 0 0" } }, [
      el("span.mono", { style: { fontSize: "10px", letterSpacing: ".1em", color: "var(--text3)", minWidth: "84px", textTransform: "uppercase" },
        text: label }),
      el("span", { style: { fontSize: "13px", color: "var(--text2)", flex: "1 1 180px", minWidth: 0 }, text: value })
    ]);
  }
  function help(text, style) {
    return el("p.help", { style: Object.assign({ margin: "4px 0 0" }, style || {}), text: text });
  }
  function pick(label, options, current, onPick, opts) {
    opts = opts || {};
    var s = el("select", {
      "data-hook": opts.hook,
      onchange: function (e) { onPick(e.target.value); EN.app.render(); },
      style: { minWidth: opts.minWidth || "90px", maxWidth: "100%" }
    }, options.map(function (o) {
      return el("option", { value: o.value, selected: String(o.value) === String(current) }, o.label);
    }));
    return el("div.field", { style: { margin: 0 } }, [lbl(label), s]);
  }
  function textField(label, value, placeholder, onInput, opts) {
    opts = opts || {};
    return el("div.field", { style: { margin: 0, flex: opts.flex || "1 1 200px", minWidth: 0 } }, [
      lbl(label),
      el("input", { type: opts.type || "text", value: value == null ? "" : String(value), placeholder: placeholder || "",
        "data-hook": opts.hook, style: { width: "100%" },
        oninput: function (e) { onInput(e.target.value); } })
    ]);
  }
  // the ladder DC rides on each option only where there is a save for it to set
  function gradeOptions(withDc) {
    return grades().map(function (g) { return { value: g, label: "G" + g + (withDc ? " (DC " + ladderDc(g) + ")" : "") }; });
  }
  function gap(h) { return el("div", { style: { height: (h || 12) + "px" } }); }

  /* ---- the words a card prints -------------------------------------------- */
  function saveText(h, none) {
    return h.save ? h.save + " Save DC " + h.dc : none;
  }
  function biteText(b) {
    if (!b || (!b.dice && !b.text)) return "";
    var band = bandOf(b.band);
    var bits = [];
    if (band) bits.push(band.name);
    // the printed bite usually opens with its dice; say them only when it does not
    if (b.dice && (b.text || "").indexOf(b.dice) === -1) bits.push(b.dice);
    var head = bits.join(" ");
    if (!b.text) return head;
    return head ? head + ": " + b.text : b.text;
  }
  // a Set Piece's other printed effects, minus any the bite or timing line already says
  function extraEffects(h) {
    var seen = (noStop(h.bite && h.bite.text) + " | " + noStop(h.timing && h.timing.text)).toLowerCase();
    return (h.effects || []).filter(function (e) {
      return seen.indexOf(noStop(e).toLowerCase()) === -1;
    });
  }
  function priceNote(h, g) {
    if (h.pricing === "flavor") {
      var fc = pricingCase("flavor");
      return fc ? fc.text : "";
    }
    if (typeof h.xp === "number" && isFinite(h.xp) && h.xp >= 0) return "Priced by hand at " + h.xp + " XP.";
    var eq = equivalentOf(h.bite && h.bite.band);
    if (eq) {
      var dn = designationName(eq.designation);
      var c = copy(h); c.xp = null;
      return "Priced like " + (/^[aeiou]/i.test(dn) ? "an " : "a ") + dn + " threat of its Grade: " +
             priceXp(c, g) + " XP at G" + g + ".";
    }
    return "The book prices only Severe and Lethal hazards, so this one is free unless you enter XP.";
  }
  function pricingOptions() {
    var H = book();
    var cases = ((H && H.pricing && H.pricing.cases) || []).slice();
    // opposition first: a hazard put into a plan is usually there to be priced
    cases.sort(function (a, b) { return a.key === "opposition" ? -1 : b.key === "opposition" ? 1 : 0; });
    return cases.map(function (c) { return { value: c.key, label: c.name }; });
  }

  /* ---- the Room ------------------------------------------------------------ */
  function liveEncounter() { return gm.get().encounter; }
  function roomRows() {
    var r = liveEncounter().room;
    return Array.isArray(r) ? r : [];
  }
  /* Every Room write goes through setRoom with the WHOLE list, a changed copy of
     the one row in it. setRoom copies again, so nothing here holds live state. */
  function editRoom(id, fn, opts) {
    var found = false;
    var next = roomRows().map(function (r) {
      if (!r || r.id !== id) return r;
      var c = copy(r);
      fn(c);
      found = true;
      return c;
    });
    if (found) gm.setRoom(next, opts);
    return found;
  }
  function addToRoom(h, g, pricing) {
    var enc = liveEncounter();
    var hz = atGrade(h, g);
    hz.pricing = pricing;
    var row = toRoomEntry(hz, g, Math.max(1, enc.round | 0));
    gm.setRoom(roomRows().concat([row]));
    toast(h.name + " is in the Room at G" + hz.grade + ". It shows under the Table's initiative order.");
    EN.app.render();
  }

  /* What a hazard is doing at round R, from its timing and the round it came
     into play. The Table's round is the only clock: nothing here is written
     back, so the Table can advance, rewind or be edited and the tray follows.
       now      it acts this round (a cycle's turn, a countdown at zero, an
                end-of-round hazard)
       wait     it acts later; the text says when
       watch    it acts on its own trigger, which the app cannot see
       done     a countdown that has run out
       waiting  it is not in play yet (a later wave)
       idle     the fight has not started
       cleared  the GM marked it shut off
     A cycle of N counts its own first round as one, so "every third round"
     from round 1 acts on rounds 3, 6 and 9. The book does not say which round a
     cycle starts on; the tray's FROM ROUND field is there to move it. */
  function roomPrompt(r, round) {
    var R = round | 0;
    var s = Math.max(1, (r && r.startRound) | 0);
    var t = (r && r.timing) || {};
    var n = t.n | 0;
    var text = trim(t.text);
    if (r && r.cleared) return { state: "cleared", text: "Cleared. The crew shut it off." };
    if (R > 0 && R < s) return { state: "waiting", text: "Not in play until round " + s + "." };
    if (t.kind === "everyNRounds") {
      if (n < 1) return { state: "watch", text: "On a cycle. Set how many rounds it takes." };
      if (R >= s && (R - s + 1) % n === 0) {
        return { state: "now", text: "Acts this round" + (n > 1 ? " (every " + n + " rounds from round " + s + ")." : ".") };
      }
      var next = R < s ? s + n - 1 : R + (n - ((R - s + 1) % n));
      return { state: R < 1 ? "idle" : "wait",
               text: "Next acts on round " + next + (R > 0 ? ", in " + plural(next - R, "round") : "") + "." };
    }
    if (t.kind === "countdown") {
      var len = (r && r.roundsLeft != null) ? (r.roundsLeft | 0) : n;
      var at = s + len;
      if (R < 1) return { state: "idle", text: "Counts down " + plural(len, "round") + " once the fight starts, reaching zero on round " + at + "." };
      var left = at - R;
      if (left > 0) return { state: "wait", text: plural(left, "round") + " to go. Reaches zero on round " + at + "." };
      if (left === 0) return { state: "now", text: "Reaches zero this round." };
      return { state: "done", text: "Reached zero on round " + at + "." };
    }
    if (t.kind === "endOfRound") {
      if (R < 1) return { state: "idle", text: "Acts at the end of every round." };
      return { state: "now", text: "Acts at the end of this round." };
    }
    var k = kindOf(t.kind);
    var what = text || (t.kind === "onTrigger" && r && r.trigger ? r.trigger : "");
    return { state: R < 1 ? "idle" : "watch", text: k.label + (what ? ": " + lowerFirst(noStop(what)) : "") + "." };
  }

  function rollBite(r) {
    var d = parseDice(r.bite && r.bite.dice);
    if (!d) return;
    var n = d.n;
    if (r.bite.perSpaces) {
      var sp = parseInt(_fall[r.id], 10);
      if (!(sp > 0)) { toast("Type how many spaces the fall is first."); return; }
      n = Math.floor(sp / r.bite.perSpaces) * d.n;
      if (n < 1) { toast("A fall of " + plural(sp, "space") + " rolls no dice at " + d.n + "d" + d.sides + " per " + r.bite.perSpaces + "."); return; }
    }
    var res = rollDice(n, d.sides, d.mod);
    _rolls[r.id] = res;
    toast(r.name + " bites for " + res.total + ".");
    EN.app.render();
  }

  function roomRow(r, round, label) {
    var p = roomPrompt(r, round);
    var now = p.state === "now";
    var edge = r.cleared ? "var(--text4)" : now ? "var(--danger)" : p.state === "done" || p.state === "waiting" ? "var(--border2)" : "var(--gold)";
    var b = r.bite || {};
    var kids = [];

    kids.push(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
      el("div.row", { style: { gap: "8px", alignItems: "baseline", flexWrap: "wrap" } }, [
        el("span", { style: { fontWeight: 600, textDecoration: r.cleared ? "line-through" : "none" }, text: label }),
        el("span.chip", { style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" }, text: "G" + r.grade }),
        el("span.chip", { "data-hook": "save", style: { fontSize: "9.5px" },
          text: r.save ? (r.save + " Save DC " + r.dc).toUpperCase() : "NO SAVE" })
      ]),
      el("div.row", { style: { gap: "6px", alignItems: "center", flexWrap: "wrap" } }, [
        el("button.btn.sm" + (r.cleared ? ".primary" : ""), { "data-hook": "cleared",
          title: r.cleared ? "Put it back in play" : "The crew shut it off",
          onclick: function () { editRoom(r.id, function (c) { c.cleared = !c.cleared; }); EN.app.render(); } },
          r.cleared ? "CLEARED ✓" : "CLEARED"),
        r.key ? el("button.btn.sm", { title: "Open it in the Hazards library",
          onclick: function () { EN.gmView.handoff("hazards", { focusKey: r.key }); } }, "VIEW") : null,
        el("button.btn.sm", { "data-hook": "remove", title: "Take it out of the Room",
          onclick: function () {
            gm.setRoom(roomRows().filter(function (x) { return x && x.id !== r.id; }));
            delete _rolls[r.id]; delete _fall[r.id];
            EN.app.render();
          } }, "✕")
      ])
    ]));

    kids.push(el("p.hz-prompt", { "data-hook": "prompt", style: { margin: "6px 0 0", fontSize: "13px",
      fontWeight: now ? 600 : 400, color: now ? "var(--danger)" : r.cleared ? "var(--text3)" : "var(--text2)" },
      text: (now ? "▶ " : "") + p.text }));

    if (!r.cleared) {
      var bt = biteText(b);
      if (bt) kids.push(line(fieldName("bite", "Bite"), bt));
      if (r.counter) kids.push(line(fieldName("counter", "Counter"), r.counter));
      var also = (r.effects || []).filter(function (e) {
        var seen = (noStop(b.text) + " | " + noStop(r.timing && r.timing.text)).toLowerCase();
        return seen.indexOf(noStop(e).toLowerCase()) === -1;
      });
      if (also.length) kids.push(line("Also", also.map(noStop).join("; ") + "."));
      if (r.material) kids.push(line("Material", r.material.name + ", Structure " + r.material.structure + ", Integrity " + r.material.integrity));

      // the bite roller, with a spaces field for a fall that is dice per spaces
      var dice = parseDice(b.dice);
      var ctl = [];
      if (dice) {
        if (b.perSpaces) {
          ctl.push(el("input", { type: "number", min: "0", value: _fall[r.id] || "", placeholder: "spaces",
            "data-hook": "spaces", style: { width: "76px" }, title: "Spaces fallen",
            oninput: function (e) { _fall[r.id] = e.target.value; } }));
        }
        ctl.push(el("button.btn.sm.primary", { "data-hook": "roll", onclick: function () { rollBite(r); } },
          "ROLL BITE (" + (b.perSpaces ? b.dice + " per " + b.perSpaces + " spaces" : b.dice) + ")"));
      }
      var res = _rolls[r.id];
      if (res) {
        var half = b.onSuccess === "half" ? " · half on a success: " + Math.floor(res.total / 2) : "";
        ctl.push(el("span.mono", { "data-hook": "rolled", style: { fontSize: "12px", color: "var(--accent)" },
          text: rollText(res) + half }));
      }
      if (ctl.length) kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, ctl));
    }

    // timing controls: when it came into play, and a countdown's length
    var t = r.timing || {};
    var timed = t.kind === "everyNRounds" || t.kind === "countdown" || t.kind === "endOfRound";
    var tc = [];
    if (timed) {
      tc.push(el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
        mono("FROM ROUND"),
        el("input", { type: "number", min: "1", value: r.startRound || 1, "data-hook": "start", style: { width: "58px" },
          onchange: function (e) {
            var v = Math.max(1, parseInt(e.target.value, 10) || 1);
            editRoom(r.id, function (c) { c.startRound = v; });
            EN.app.render();
          } })
      ]));
    }
    if (t.kind === "countdown") {
      tc.push(el("div.row", { style: { gap: "4px", alignItems: "center" } }, [
        mono("LENGTH " + (r.roundsLeft | 0)),
        el("button.btn.sm", { style: { padding: "0 7px" }, title: "One round shorter",
          onclick: function () { editRoom(r.id, function (c) { c.roundsLeft = Math.max(0, (c.roundsLeft | 0) - 1); }); EN.app.render(); } }, "-"),
        el("button.btn.sm", { style: { padding: "0 7px" }, title: "One round longer",
          onclick: function () { editRoom(r.id, function (c) { c.roundsLeft = (c.roundsLeft | 0) + 1; }); EN.app.render(); } }, "+")
      ]));
      tc.push(el("button.btn.sm", { "data-hook": "restart", title: "Start the countdown from this round",
        onclick: function () {
          var R = Math.max(1, liveEncounter().round | 0);
          editRoom(r.id, function (c) { c.startRound = R; });
          EN.app.render();
        } }, "START IT NOW"));
    }
    if (tc.length) kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "center", marginTop: "8px" } }, tc));

    kids.push(el("input", { type: "text", value: r.notes || "", "data-hook": "notes",
      placeholder: r.anomalies ? "which anomaly, and its footprint in the fight" : "notes",
      style: { width: "100%", marginTop: "8px" },
      oninput: function (e) {
        var v = e.target.value;
        editRoom(r.id, function (c) { c.notes = v; }, { silent: true });
      } }));

    return el("div.feature", { "data-room": r.id, style: { borderLeftColor: edge, opacity: r.cleared ? 0.6 : 1 } }, kids);
  }

  // "One hazard per fight is seasoning; two is a set piece; three is the fight."
  function readsAs(count) {
    var H = book();
    var rows = ((H && H.setPieces && H.setPieces.guidance && H.setPieces.guidance.perFight) || []).slice()
      .sort(function (a, b) { return a.count - b.count; });
    var hit = null;
    rows.forEach(function (x) { if (count >= x.count) hit = x; });
    return hit ? hit.reads : "";
  }

  /* The Table extra. ctx is {encounter, crew}. An empty Room draws nothing, so
     a fight without hazards keeps the Table exactly as it was. */
  function tableExtra(ctx) {
    var enc = (ctx && ctx.encounter) || liveEncounter();
    var room = (enc && Array.isArray(enc.room) ? enc.room : []).filter(function (r) { return r && typeof r === "object"; });
    if (!room.length) return null;
    var R = enc.round | 0;
    var totals = Object.create(null), seen = Object.create(null);
    room.forEach(function (r) { var k = r.name || "Hazard"; totals[k] = (totals[k] || 0) + 1; });
    var anyNow = false;
    var rows = room.map(function (r) {
      var k = r.name || "Hazard";
      var label = k;
      if (totals[k] > 1) { seen[k] = (seen[k] || 0) + 1; label = k + " " + seen[k]; }
      if (roomPrompt(r, R).state === "now") anyNow = true;
      return roomRow(r, R, label);
    });
    var live = room.filter(function (r) { return !r.cleared; }).length;
    var reads = readsAs(live);
    var kids = rows;
    var H = book();
    if (H && H.acts && H.acts.text) kids.push(help(H.acts.text + " Hazards act from this tray, not from the order above.", { margin: "6px 0 0" }));
    var tag = live + " LIVE" + (reads ? " · " + reads.toUpperCase() : "");
    return EN.ui.panel("The Room", tag, kids, { glow: anyNow });
  }

  /* ---- the Library --------------------------------------------------------- */
  function libState(h) {
    if (!own(_lib, h.key)) _lib[h.key] = { grade: h.grade, pricing: h.pricing || "opposition", open: false };
    return _lib[h.key];
  }

  function hazardCard(h) {
    var st = libState(h);
    var isSet = h.source === "setpiece";
    var g = gradeOf(st.grade, h.grade);
    var hz = atGrade(h, g);
    hz.pricing = st.pricing;
    var xp = priceXp(hz, g);
    var none = "None";
    var kids = [];

    kids.push(el("h4", null, [
      el("span", { text: h.name }),
      el("span.src", { text: (isSet ? "SET PIECE" : "CUSTOM") + " · G" + g })
    ]));

    // the four lines, in the book's order and under its own names
    var dcNote = "";
    if (isSet && hz.save && hz.dcByGrade && g !== h.printedGrade && h.printedDc != null) {
      dcNote = " (printed DC " + h.printedDc + " at G" + h.printedGrade + ")";
    }
    if (isSet) {
      /* THE BOOK'S PARAGRAPH IS THE CARD (author's call, 2026-10-07). A Set Piece is
         written as prose, and only some of them break into the anatomy's four lines;
         Breakflow Bleed is a paragraph and nothing else. So the paragraph leads, as
         printed, and a labelled line shows only where the book actually prints that
         piece. Rows of "None printed" read as missing data rather than as a hazard
         built differently, and lifting phrases out of a sentence into rows left
         fragments ("everyone in it"), so neither happens any more. */
      kids.push(el("div.mono", { style: { fontSize: "10px", letterSpacing: ".1em", color: "var(--text3)", margin: "2px 0 2px" },
        text: "AS WRITTEN AT G" + h.printedGrade }));
      kids.push(el("p", { "data-hook": "as-written", style: { margin: "0 0 8px", fontSize: "13.5px", lineHeight: "1.5", color: "var(--text)" },
        text: h.printed }));
      var anomalyRun = !!(hz.anomalies && hz.anomalies.length);
      var biteLine = biteText(hz.bite);
      if (hz.trigger) kids.push(line(fieldName("trigger", "Trigger"), hz.trigger, "trigger"));
      if (hz.save) kids.push(line(fieldName("save", "Save and DC"), saveText(hz, "") + dcNote, "save"));
      if (biteLine) kids.push(line(fieldName("bite", "Bite"), biteLine, "bite"));
      if (hz.counter) kids.push(line(fieldName("counter", "Counter"), hz.counter, "counter"));
      if (anomalyRun) kids.push(line("Runs off", "The Anomaly you pick from Flow Disturbances", "timing"));
      else kids.push(line("Timing", timingLabel(hz.timing) + (hz.timing && hz.timing.text ? ": " + hz.timing.text : ""), "timing"));
      if (hz.area) kids.push(line("Area", hz.area));
      if (hz.material) kids.push(line("Material", hz.material.name + ", Structure " + hz.material.structure + ", Integrity " + hz.material.integrity));
      if (anomalyRun) kids.push(line("Anomalies", hz.anomalies.join(", ")));
      var unprinted = [];
      if (!hz.save) unprinted.push("save");
      if (!biteLine) unprinted.push("bite");
      if (!hz.counter) unprinted.push("counter");
      if (unprinted.length) {
        var said = unprinted.length === 1 ? unprinted[0]
          : unprinted.slice(0, -1).join(", ") + " or " + unprinted[unprinted.length - 1];
        kids.push(help("The book prints no separate " + said + " for this one" +
          (anomalyRun ? ": the Anomaly you pick supplies the rules." : ". The paragraph above is the whole rule.")));
      }
    } else {
      kids.push(line(fieldName("trigger", "Trigger"), hz.trigger || none, "trigger"));
      kids.push(line(fieldName("save", "Save and DC"), saveText(hz, none) + dcNote, "save"));
      kids.push(line(fieldName("bite", "Bite"), biteText(hz.bite) || none, "bite"));
      kids.push(line(fieldName("counter", "Counter"), hz.counter || none, "counter"));
      kids.push(line("Timing", timingLabel(hz.timing) + (hz.timing && hz.timing.text ? ": " + hz.timing.text : ""), "timing"));
      if (hz.area) kids.push(line("Area", hz.area));
      if (hz.material) kids.push(line("Material", hz.material.name + ", Structure " + hz.material.structure + ", Integrity " + hz.material.integrity));
      var also = extraEffects(hz);
      if (also.length) kids.push(line("Also", also.map(noStop).join("; ") + "."));
      if (hz.anomalies && hz.anomalies.length) kids.push(line("Anomalies", hz.anomalies.join(", ")));
    }
    if (hz.notes) kids.push(line("Notes", hz.notes));
    if (hz.bestiary && hz.bestiary.length) {
      kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "4px" } },
        [el("span.mono", { style: { fontSize: "10px", letterSpacing: ".1em", color: "var(--text3)", minWidth: "84px" }, text: "BESTIARY" })]
          .concat(hz.bestiary.map(function (nm) {
            return el("button.btn.sm.ghost", { title: "Open " + nm + " in the Bestiary",
              onclick: function () { EN.gmView.handoff("bestiary", { query: nm }); } }, nm + " ›");
          }))));
    }
    if (isSet && g !== h.printedGrade) {
      kids.push(help(hz.save
        ? "At G" + g + " the save takes that Grade's DC. The dice and any counter DC stay as printed; move them with the scene if you want."
        : "No save is printed, so nothing on this one moves with the Grade on its own. Scale it with the scene if you want.",
        { color: "var(--warn)" }));
    }

    // use at Grade, price, and what it costs
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "10px" } }, [
      pick("Use at Grade", gradeOptions(!!(h.save && h.dcByGrade)), g, function (v) { st.grade = gradeOf(v); }, { hook: "grade" }),
      pick("Price as", pricingOptions(), st.pricing, function (v) { st.pricing = v === "flavor" ? "flavor" : "opposition"; }, { hook: "pricing" }),
      el("span.chip", { "data-hook": "xp", style: { marginBottom: "4px", color: xp ? "var(--gold)" : "var(--text3)",
        borderColor: xp ? "var(--gold)" : "var(--border2)" }, text: xp + " XP" })
    ]));
    kids.push(help(priceNote(hz, g)));

    var btns = [
      el("button.btn.sm.primary", { "data-hook": "add-room", onclick: function () { addToRoom(h, g, st.pricing); } }, "+ ADD TO THE ROOM"),
      el("button.btn.sm", { "data-hook": "add-plan", onclick: function () {
        var payload = atGrade(h, g);
        payload.pricing = st.pricing;
        toast(h.name + " goes to the encounter plan at G" + g + ".");
        EN.gmView.handoff("encounters", { addLines: [{ kind: "hazard", hazard: payload, grade: g }], note: "" });
      } }, "+ ADD TO AN ENCOUNTER PLAN")
    ];
    if (isSet) {
      // no AS WRITTEN toggle: the book's paragraph already leads the card
    } else if (_c && _c.id === h.key) {
      // this hazard is already open in the Composer: EDIT goes back to that work, never resets it
      btns.push(el("button.btn.sm", { "data-hook": "edit", title: "Back to the Composer, where it is open",
        onclick: function () { _ui.view = "composer"; EN.app.render(); } }, draftDirty() ? "EDIT (UNSAVED)" : "EDIT"));
    } else {
      btns.push(discardButton({ key: "hz:edit:" + h.key, hook: "edit", label: "EDIT",
        armedLabel: "DISCARD THE DRAFT?", title: "Open it in the Composer",
        onGo: function () {
          startDraft(draftFrom(h));
          _ui.view = "composer";
          EN.app.render();
        } }));
      btns.push(EN.ui.armButton("hz:del:" + h.key, {
        label: "DELETE", armedLabel: "DELETE IT?", title: "Delete this hazard from the library",
        armedTitle: "Removes it from the library. Copies already in the Room or a plan stay. This cannot be undone.",
        onConfirm: function () {
          gm.drop("hazards", h.key);
          delete _lib[h.key];
          if (_c && _c.id === h.key) startDraft(null);
          toast(h.name + " deleted.");
          EN.app.render();
        }
      }));
    }
    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "10px" } }, btns));

    var focus = _ui.focus === h.key;
    return el("div.feature.hz-card", { "data-hz": h.key,
      style: { borderLeftColor: isSet ? "var(--accent)" : "var(--gold)",
               outline: focus ? "1px solid var(--accent)" : "none" } }, kids);
  }

  function libraryView() {
    var H = book();
    var out = [];
    var sp = setPieces();
    var spKids = [];
    if (H.setPieces && H.setPieces.intro) spKids.push(help(H.setPieces.intro, { margin: "0 0 10px" }));
    sp.forEach(function (h) { spKids.push(hazardCard(h)); });
    var g = H.setPieces && H.setPieces.guidance;
    if (g) spKids.push(help(g.label + ": " + g.text, { color: "var(--accent)" }));
    out.push(EN.ui.panel("Set Pieces", sp.length + " · WRITTEN AT G" + ((H.setPieces && H.setPieces.grade) || 3), spKids));

    var mine = customs();
    var myKids = [];
    if (!mine.length) {
      myKids.push(el("div.muted-box", { style: { padding: "20px" },
        text: "No hazards of your own yet. Write one in the Composer and it lands here." }));
    } else {
      mine.forEach(function (h) { myKids.push(hazardCard(h)); });
    }
    out.push(gap());
    out.push(EN.ui.panel("Your Hazards", mine.length + " SAVED", myKids, {
      headerRight: [discardButton({ key: "hz:new", hook: "new-hazard", label: "+ NEW HAZARD", title: "Start a blank hazard in the Composer",
        onGo: function () { startDraft(blankDraft()); _ui.view = "composer"; EN.app.render(); } })]
    }));
    return out;
  }

  /* ---- the Composer -------------------------------------------------------- */
  function defaultGrade() {
    try {
      var c = EN.gmEngine.crew();
      if (c && c.source !== "none") return gradeOf(c.caliber);
    } catch (e) {}
    return gradeOf(null);
  }
  function usualSave() {
    var H = book();
    var f = ((H && H.anatomy && H.anatomy.fields) || []).filter(function (x) { return x.key === "save"; })[0];
    return (f && f.usual && f.usual[0]) || "Body";
  }
  function blankDraft() {
    return { id: null, name: "", grade: defaultGrade(), trigger: "", save: usualSave(), dcOverride: "",
             band: "dangerous", dice: bandDice("dangerous"), half: false, biteText: "", counter: "",
             kind: "onEntry", n: "", timingText: "", pricing: "opposition", xp: "", notes: "" };
  }
  function draftFrom(h) {
    var t = h.timing || {}, b = h.bite || {};
    return { id: h.key, name: h.name || "", grade: h.grade, trigger: h.trigger || "", save: h.save || "",
             dcOverride: h.save && !h.dcByGrade && h.dc != null ? String(h.dc) : "",
             band: b.band || "", dice: b.dice || "", half: b.onSuccess === "half", biteText: b.text || "",
             counter: h.counter || "", kind: t.kind || "onEntry", n: t.n == null ? "" : String(t.n),
             timingText: t.text || "", pricing: h.pricing || "opposition",
             xp: typeof h.xp === "number" ? String(h.xp) : "", notes: h.notes || "" };
  }
  /* F17. The Composer's draft is opened from a baseline (a blank draft, or a
     saved hazard for EDIT) and is unsaved while it differs from that baseline.
     Every path that would replace an unsaved draft (+ NEW HAZARD, another
     card's EDIT, CLEAR, STOP EDITING) arms first, the way the Job Board's NEW
     JOB and the Encounters tab's NEW PLAN do. */
  function startDraft(d) {
    _c = d;
    _cBase = d ? JSON.stringify(d) : null;
    return d;
  }
  function draftDirty() { return !!_c && JSON.stringify(_c) !== _cBase; }
  function draftName() { return trim(_c && _c.name) || "the draft"; }
  /* A button that replaces the draft: plain while nothing would be lost, armed
     while something would. o is {key, hook, label, title, armedLabel,
     armedTitle, onGo}. */
  function discardButton(o) {
    var b;
    if (!draftDirty()) {
      b = el("button.btn.sm", { title: o.title || "", onclick: o.onGo }, o.label);
    } else {
      b = EN.ui.armButton(o.key, { label: o.label, cls: ".btn.sm", armedLabel: o.armedLabel || "DISCARD THE DRAFT?", title: o.title || "",
        armedTitle: o.armedTitle || ("The Composer holds unsaved work on " + draftName() +
          ". Click again to let it go; the COMPOSER chip goes back to it instead."),
        onConfirm: o.onGo });
      b.setAttribute("data-guard", "1");   // the first click asks
    }
    if (o.hook) b.setAttribute("data-hook", o.hook);
    return b;
  }
  // the draft as a hazard object; the same shape the Library and the Room read
  function draftHazard(d) {
    var g = gradeOf(d.grade);
    var over = parseInt(d.dcOverride, 10);
    var save = d.save ? String(d.save) : null;
    var k = kindOf(d.kind);
    var n = parseInt(d.n, 10);
    var xpTxt = trim(d.xp);
    var xp = xpTxt === "" ? null : Number(xpTxt);
    if (xp !== null && (!isFinite(xp) || xp < 0)) xp = null;
    return {
      key: d.id || null, name: trim(d.name), source: "custom", grade: g,
      trigger: trim(d.trigger) || null,
      save: save, dcByGrade: !!save && isNaN(over),
      dc: save ? (isNaN(over) ? ladderDc(g) : over) : null,
      bite: { band: d.band || null, dice: trim(d.dice) || null, text: trim(d.biteText),
              onSuccess: d.half ? "half" : null, perSpaces: null },
      counter: trim(d.counter) || null,
      timing: { kind: k.key, n: k.hasN && n > 0 ? n : null, text: trim(d.timingText) },
      notes: d.notes || "", xp: xp, pricing: d.pricing === "flavor" ? "flavor" : "opposition"
    };
  }
  function saveDraft() {
    var h = draftHazard(_c);
    if (!h.name) { toast("Name the hazard first."); return; }
    if (!h.counter) { toast("Every hazard needs a Counter. The book says there must always be a way to shut it off."); return; }
    var k = kindOf(h.timing.kind);
    if (k.hasN && !h.timing.n) { toast("Say how many rounds the " + k.label.toLowerCase() + " takes."); return; }
    var id = _c.id || gm.uid();
    h.id = id;
    h.key = id;
    gm.put("hazards", h);
    delete _lib[id];   // the card picks up the saved Grade and price, not a stale pick
    startDraft(null);
    _ui.view = "library";
    _ui.focus = id;
    _ui.scroll = true;
    toast(h.name + " saved to the library.");
    EN.app.render();
  }

  function composerView() {
    var H = book();
    if (!_c) startDraft(blankDraft());
    var d = _c;
    var g = gradeOf(d.grade);
    var kids = [];

    if (d.id) kids.push(help("Editing " + (d.name || "a saved hazard") + ". SAVE writes over the saved copy.", { margin: "0 0 10px", color: "var(--gold)" }));

    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
      textField("Name", d.name, "Steam Main", function (v) { d.name = v; }, { hook: "c-name" }),
      pick("Grade of the scene", gradeOptions(true), g, function (v) { d.grade = gradeOf(v); }, { hook: "c-grade" })
    ]));

    // 1. Trigger
    var trig = (H.anatomy.fields.filter(function (f) { return f.key === "trigger"; })[0] || {}).examples || [];
    kids.push(EN.ui.sectionTitle(fieldName("trigger", "Trigger")));
    // the field label and placeholder are the book's own line, so no help line repeats it
    kids.push(textField("What sets it off", d.trigger, trig.join(", "), function (v) { d.trigger = v; }, { hook: "c-trigger", flex: "1 1 100%" }));

    // 2. Save and DC
    kids.push(EN.ui.sectionTitle(fieldName("save", "Save and DC")));
    var usual = ((H.anatomy.fields.filter(function (f) { return f.key === "save"; })[0] || {}).usual) || [];
    var attrs = (EN.rules && EN.rules.attributes || []).map(function (a) { return a.name; });
    var order = usual.concat(attrs.filter(function (a) { return usual.indexOf(a) === -1; }));
    var saveOpts = [{ value: "", label: "No save" }].concat(order.map(function (a) {
      return { value: a, label: a + (usual.indexOf(a) !== -1 ? " (usual)" : "") };
    }));
    var ladder = ladderDc(g);
    var saveRow = [pick("Save", saveOpts, d.save, function (v) { d.save = v; }, { hook: "c-save" })];
    if (d.save) {
      saveRow.push(el("div.field", { style: { margin: 0 } }, [
        lbl("DC at G" + g),
        el("span.mono", { "data-hook": "c-ladder", style: { display: "inline-block", fontSize: "17px", padding: "4px 0", color: "var(--accent)" },
          text: String(ladder) })
      ]));
      saveRow.push(textField("Override DC", d.dcOverride, "ladder " + ladder, function (v) { d.dcOverride = v; },
        { type: "number", hook: "c-dc", flex: "0 1 130px" }));
    }
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, saveRow));
    if (d.save) kids.push(help("The DC follows the Grade ladder unless you override it. " + (H.dcLegalText || "")));

    // 3. Bite
    kids.push(EN.ui.sectionTitle(fieldName("bite", "Bite")));
    var bandOpts = [{ value: "", label: "No damage" }].concat((H.bites || []).map(function (b) {
      return { value: b.key, label: b.name + " (" + b.dice + ")" };
    }));
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
      pick("Band", bandOpts, d.band, function (v) { d.band = v; d.dice = bandDice(v); }, { hook: "c-band" }),
      textField("Dice", d.dice, bandDice(d.band) || "none", function (v) { d.dice = v; }, { hook: "c-dice", flex: "0 1 110px" }),
      el("label", { style: { display: "flex", gap: "6px", alignItems: "center", fontSize: "12.5px", paddingBottom: "6px" } }, [
        el("input", { type: "checkbox", checked: !!d.half, "data-hook": "c-half",
          onchange: function (e) { d.half = !!e.target.checked; } }),
        document.createTextNode("half on a success")
      ])
    ]));
    var band = bandOf(d.band);
    if (band) kids.push(help("Reads as: " + band.readsAs + "." + (band.orMore ? " The band is " + band.dice + "." : "")));
    kids.push(gap(8));
    kids.push(textField("What it does", d.biteText, "Fire on a failure, or a condition", function (v) { d.biteText = v; },
      { hook: "c-bitetext", flex: "1 1 100%" }));

    // 4. Counter
    kids.push(EN.ui.sectionTitle(fieldName("counter", "Counter") + " (required)"));
    kids.push(textField("How the crew shuts it off", d.counter, "a valve, a breaker, a Node", function (v) { d.counter = v; },
      { hook: "c-counter", flex: "1 1 100%" }));
    kids.push(help(fieldText("counter")));

    // timing
    kids.push(EN.ui.sectionTitle("Timing"));
    var k = kindOf(d.kind);
    var tRow = [pick("When it acts", KINDS.map(function (x) { return { value: x.key, label: x.label }; }), d.kind,
      function (v) { d.kind = v; }, { hook: "c-kind" })];
    if (k.hasN) {
      tRow.push(textField(d.kind === "countdown" ? "Rounds to zero" : "Every how many rounds", d.n, "3",
        function (v) { d.n = v; }, { type: "number", hook: "c-n", flex: "0 1 150px" }));
    }
    tRow.push(textField("In words", d.timingText, "every third round", function (v) { d.timingText = v; }, { hook: "c-timing", flex: "1 1 200px" }));
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, tRow));
    if (H.acts && H.acts.text) kids.push(help(H.acts.text + " In play it sits in the Room tray under the Table."));

    // flavor or opposition, and its price
    kids.push(EN.ui.sectionTitle("Flavor or opposition"));
    var draftH = draftHazard(d);
    var bookPrice = priceXp((function () { var c = copy(draftH); c.xp = null; return c; })(), g);
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
      pick("Price as", pricingOptions(), d.pricing, function (v) { d.pricing = v === "flavor" ? "flavor" : "opposition"; }, { hook: "c-pricing" }),
      d.pricing === "flavor" ? null
        : textField("XP (blank for the book's price)", d.xp, String(bookPrice), function (v) { d.xp = v; },
            { type: "number", hook: "c-xp", flex: "0 1 220px" })
    ]));
    var pc = pricingCase(d.pricing);
    if (pc) kids.push(help(pc.text + (d.pricing === "flavor" ? "" : ".")));
    if (d.pricing !== "flavor") kids.push(help(priceNote((function () { var c = copy(draftH); c.xp = null; return c; })(), g)));

    // notes
    kids.push(EN.ui.sectionTitle("Notes"));
    kids.push(el("textarea", { rows: 3, value: d.notes, "data-hook": "c-notes", placeholder: "where it sits, what it looks like, who knows about it",
      style: { width: "100%" }, oninput: function (e) { d.notes = e.target.value; } }));

    /* The fields keep the draft on input and never re-render the tab, so the
       CLEAR / STOP EDITING button is repainted in place whenever the draft
       changes: it arms the moment there is something to lose. */
    _cActs = el("div.row.wrap", { "data-hook": "c-acts", style: { gap: "8px", marginTop: "12px" } }, composerActs(d));
    _cSig = actsSig(d);
    kids.push(_cActs);

    var lead = H.anatomy && H.anatomy.lead ? H.anatomy.lead.replace(/:$/, "") : "";
    var panel = EN.ui.panel("Hazard Composer", "TRIGGER · SAVE · BITE · COUNTER",
      [help(lead ? lead + ": Trigger, Save and DC, Bite, Counter." : "", { margin: "0 0 4px" })].concat(kids));
    panel.addEventListener("input", paintComposerActs);
    panel.addEventListener("change", paintComposerActs);
    return [panel];
  }
  function composerActs(d) {
    return [
      el("button.btn.sm.primary", { "data-hook": "c-save-btn", onclick: saveDraft }, d.id ? "SAVE CHANGES" : "SAVE TO THE LIBRARY"),
      discardButton({ key: "hz:clear", hook: "c-clear", label: d.id ? "STOP EDITING" : "CLEAR",
        armedLabel: d.id ? "DISCARD THE CHANGES?" : "DISCARD THE DRAFT?",
        armedTitle: d.id ? "Click again to drop the unsaved changes to " + draftName() + ". The saved copy stays as it was."
                         : "Click again to throw away " + draftName() + ". It was never saved.",
        onGo: function () { startDraft(blankDraft()); EN.app.render(); } }),
      draftDirty() ? el("span.help", { "data-hook": "c-unsaved", style: { margin: 0, color: "var(--warn)" }, text: "Unsaved." }) : null
    ];
  }
  /* What the button row says: whether there is anything to lose, whether it
     edits a saved hazard, and the draft's name its armed title uses. */
  function actsSig(d) { return (draftDirty() ? "1" : "0") + "|" + (d.id || "") + "|" + draftName(); }
  /* REBUILT ONLY WHEN IT WOULD READ DIFFERENTLY (re-review of F17). A text or
     number field fires `change` when it blurs, and it blurs at the mousedown
     of the GM's next click: rebuilding the row there swapped SAVE TO THE
     LIBRARY out from under the pointer before the mouseup, and Chrome never
     delivered the click, so the first SAVE after typing did nothing. By the
     time a field blurs its `input` has already painted the row, so the
     signature is unchanged and the row, and the button being clicked, stay. */
  function paintComposerActs() {
    if (!_c || !_cActs || !_cActs.isConnected) return;
    var sig = actsSig(_c);
    if (sig === _cSig) return;
    _cSig = sig;
    EN.ui.clear(_cActs);
    composerActs(_c).forEach(function (n) { if (n) _cActs.appendChild(n); });
  }

  /* ---- the Reference ------------------------------------------------------- */
  function leadP(name, text) {
    return el("p", { style: { margin: "6px 0 0", fontSize: "13px", color: "var(--text2)" } }, [
      el("span", { style: { fontWeight: 600, color: "var(--text)" }, text: name + ". " }),
      document.createTextNode(text)
    ]);
  }
  function para(text) {
    return el("p", { style: { margin: "6px 0 0", fontSize: "13px", color: "var(--text2)" }, text: text });
  }
  // a small table as rows of cells, so it wraps on a phone instead of scrolling
  function miniTable(head, rows, widths) {
    function rowEl(cells, isHead) {
      return el("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", padding: "4px 0",
        borderBottom: "1px solid var(--border)" } }, cells.map(function (c, i) {
        var w = widths && widths[i] ? widths[i] : (i === 0 ? "1 1 110px" : "0 0 52px");
        return el("span" + (isHead ? ".mono" : ""), { style: { flex: w, minWidth: 0,
          fontSize: isHead ? "10px" : "13px", letterSpacing: isHead ? ".1em" : "normal",
          color: isHead ? "var(--text3)" : "var(--text2)" }, text: String(c) });
      }));
    }
    return el("div", { style: { marginTop: "6px" } }, [rowEl(head, true)].concat(rows.map(function (r) { return rowEl(r, false); })));
  }
  function referenceView() {
    var H = book();
    var gs = grades();
    var kids = [];
    kids.push(para(H.intro));

    kids.push(EN.ui.sectionTitle("Hazard anatomy"));
    kids.push(para(H.anatomy.lead));
    H.anatomy.fields.forEach(function (f) { kids.push(leadP(f.name, f.text)); });

    kids.push(EN.ui.sectionTitle("DC by Grade"));
    kids.push(el("div.stat-row", { "data-hook": "ladder", style: { marginTop: "6px" } },
      gs.map(function (g) { return EN.ui.stat("G" + g, String(ladderDc(g)), "DC"); })));
    kids.push(help(H.dcLegalText));

    kids.push(EN.ui.sectionTitle("Bite"));
    kids.push(miniTable(["BAND", "DICE", "READS AS"], (H.bites || []).map(function (b) {
      return [b.name, b.dice, b.readsAs];
    }), ["0 0 84px", "0 0 84px", "1 1 180px"]));

    kids.push(EN.ui.sectionTitle("Pricing"));
    kids.push(para(H.pricing.text));
    kids.push(miniTable(["RECURRING, PRICED AS"].concat(gs.map(function (g) { return "G" + g; })),
      (H.pricing.equivalents || []).map(function (e) {
        var b = bandOf(e.bite);
        return [(b ? b.name : upperFirst(e.bite)) + " as " + designationName(e.designation)].concat(gs.map(function (g) {
          return own(e.xpByGrade, g) ? e.xpByGrade[g] : "";
        }));
      }), ["1 1 90px"].concat(gs.map(function () { return "0 0 38px"; }))));
    kids.push(help("The book prints no price for a recurring Nuisance or Dangerous hazard. This app treats one as free unless you enter XP."));

    kids.push(EN.ui.sectionTitle("Objects and materials"));
    kids.push(para(H.objects.text));
    kids.push(miniTable(["MATERIAL", "STRUCT", "INTEG"], (H.objects.materials || []).map(function (m) {
      return [m.name, m.structure, m.integrity];
    })));

    kids.push(EN.ui.sectionTitle("How a hazard acts"));
    kids.push(para(H.acts.text));
    kids.push(leadP(fieldName("trigger", "Trigger"), H.acts.trigger));
    kids.push(help("This app keeps live hazards in the Room tray under the Table's initiative order, with each one's timing worked out from the round."));

    kids.push(EN.ui.sectionTitle("How many"));
    var gd = H.setPieces && H.setPieces.guidance;
    if (gd) kids.push(leadP(gd.label, gd.text));

    if (H.falling) {
      kids.push(EN.ui.sectionTitle("Falling"));
      kids.push(para(H.falling.text));
    }
    return [EN.ui.panel("Reference", "THE HAZARDS CHAPTER", kids)];
  }

  /* ---- the Tools ------------------------------------------------------------ */
  function stalematePanel() {
    var S = book().stalemate;
    if (!S || !S.districts || !S.districts.length) return null;
    if (!_tools.district) _tools.district = S.districts[0].key;
    var dist = S.districts.filter(function (x) { return x.key === _tools.district; })[0] || S.districts[0];
    var kids = [help(S.when, { margin: "0 0 8px" })];
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
      pick("District", S.districts.map(function (x) { return { value: x.key, label: x.name }; }), dist.key,
        function (v) { _tools.district = v; _tools.stalemate = null; }, { hook: "district" }),
      el("button.btn.sm.primary", { "data-hook": "roll-stalemate", style: { marginBottom: "2px" }, onclick: function () {
        _tools.stalemate = { district: dist.key, n: 1 + Math.floor(Math.random() * (S.sides || 6)) };
        EN.app.render();
      } }, "ROLL " + (S.die || "d6").toUpperCase())
    ]));

    var rolled = _tools.stalemate && _tools.stalemate.district === dist.key ? _tools.stalemate.n : null;
    var row = rolled ? dist.rows.filter(function (x) { return x.n === rolled; })[0] : null;
    if (row) {
      var rk = [el("div.row", { style: { gap: "10px", alignItems: "baseline" } }, [
        el("span.mono", { style: { fontSize: "22px", color: "var(--accent)" }, text: String(row.n) }),
        el("span", { "data-hook": "stalemate-text", style: { fontSize: "13.5px" }, text: row.text })
      ])];
      if (row.rider) rk.push(help("This entry adds to or changes the default: " + row.rider, { color: "var(--warn)" }));
      kids.push(el("div.feature", { "data-hook": "stalemate-result", style: { marginTop: "10px" } }, rk));
    }

    /* The default rule, as printed, and its Impact DC. Picking a speed off the
       GM's Card table fills the DC field; a number typed into the field wins,
       and a cleared field falls back to the picked speed's DC. (F3) */
    kids.push(para(S.rule));
    var dr = S.defaultRule || {};
    var speeds = (S.impactBySpeed || []).filter(function (x) { return x && typeof x.dc === "number"; });
    var spd = speeds.filter(function (x) { return x.key === _tools.speed; })[0] || null;
    var out = el("p.help", { "data-hook": "impact-line", style: { margin: "4px 0 0", color: "var(--accent)" } });
    function impactLine() {
      var typed = parseInt(_tools.impact, 10);
      var dc = isNaN(typed) ? (spd ? spd.dc : NaN) : typed;
      if (isNaN(dc)) {
        out.textContent = speeds.length ? "Pick the pilots' speed or type the Impact DC." : "Type the Impact DC for the pilots' speed.";
        return;
      }
      var tail = !spd ? "" : (isNaN(typed) || typed === spd.dc) ? " That is the Impact DC at " + spd.speed + " speed."
        : " Typed over the " + spd.speed + " Impact DC of " + spd.dc + ".";
      out.textContent = upperFirst(dr.who || "each pilot") + " makes a " + (dr.check || "Control Check") + " against DC " + dc +
        "; a failure gives " + (dr.onFail || "Snag on the next Chase Check") + "." + tail;
    }
    impactLine();
    var dcRow = [];
    if (speeds.length) {
      dcRow.push(pick("Speed", [{ value: "", label: "Pick a speed..." }].concat(speeds.map(function (x) {
        return { value: x.key, label: x.speed + " (DC " + x.dc + ")" };
      })), _tools.speed, function (v) {
        var hit = speeds.filter(function (x) { return x.key === v; })[0] || null;
        _tools.speed = hit ? hit.key : "";
        if (hit) _tools.impact = String(hit.dc);
      }, { hook: "speed", minWidth: "150px" }));
    }
    dcRow.push(textField("Impact DC", _tools.impact, spd ? String(spd.dc) : "DC", function (v) { _tools.impact = v; impactLine(); },
      { type: "number", hook: "impact", flex: "0 1 110px" }));
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "6px" } }, dcRow));
    kids.push(out);
    if (speeds.length) {
      kids.push(el("p.help", { "data-hook": "impact-table", style: { margin: "4px 0 0" },
        text: "Impact DC by speed: " + speeds.map(function (x) { return x.speed + " " + x.dc; }).join(", ") +
              ". Pilots at different speeds each check against their own." }));
    }

    // the whole table, the rolled row lit
    kids.push(el("div", { style: { marginTop: "10px" } }, dist.rows.map(function (x) {
      var on = rolled === x.n;
      return el("div", { style: { display: "flex", gap: "8px", padding: "4px 0", borderBottom: "1px solid var(--border)",
        color: on ? "var(--text)" : "var(--text2)", fontWeight: on ? 600 : 400 } }, [
        el("span.mono", { style: { minWidth: "18px", color: on ? "var(--accent)" : "var(--text3)" }, text: String(x.n) }),
        el("span", { style: { fontSize: "13px" }, text: x.text })
      ]);
    })));
    return EN.ui.panel("Stalemate Hazards", "CHASE TIES · " + dist.name.toUpperCase(), kids);
  }

  function fallingPanel() {
    var F = book().falling;
    if (!F) return null;
    var per = F.perSpaces || 2, count = F.count || 1, sides = F.sides || 6;
    var kids = [para(F.text)];
    var show = el("span.mono", { "data-hook": "fall-dice", style: { fontSize: "13px", color: "var(--text2)", paddingBottom: "6px" } });
    function diceFor() {
      var sp = parseInt(_tools.spaces, 10);
      if (!(sp > 0)) return null;
      return Math.floor(sp / per) * count;
    }
    function label() {
      var n = diceFor();
      show.textContent = n === null ? "" : n + "d" + sides + " " + (F.type || "");
    }
    label();
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "6px" } }, [
      textField("Spaces fallen", _tools.spaces, "4", function (v) { _tools.spaces = v; label(); }, { type: "number", hook: "fall-spaces", flex: "0 1 130px" }),
      show,
      el("button.btn.sm.primary", { "data-hook": "roll-fall", style: { marginBottom: "2px" }, onclick: function () {
        var n = diceFor();
        if (n === null) { toast("Type how many spaces they fell."); return; }
        _tools.fall = n > 0 ? rollDice(n, sides, 0) : { n: 0, sides: sides, mod: 0, rolls: [], total: 0 };
        EN.app.render();
      } }, "ROLL THE FALL")
    ]));
    if (_tools.fall) {
      kids.push(el("p.mono", { "data-hook": "fall-result", style: { margin: "8px 0 0", fontSize: "13px", color: "var(--accent)" },
        text: _tools.fall.n ? rollText(_tools.fall) + " " + (F.type || "") : "Under " + per + " spaces: no dice by this count." }));
    }
    return EN.ui.panel("Falling", count + "d" + sides + " PER " + per + " SPACES", kids);
  }

  function objectPanel() {
    var O = book().objects;
    if (!O || !O.materials || !O.materials.length) return null;
    var mat = O.materials.filter(function (m) { return m.key === _tools.mat; })[0] || O.materials[0];
    var kids = [para(O.text)];
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "6px" } }, [
      pick("Material", O.materials.map(function (m) {
        return { value: m.key, label: m.name + " " + m.structure + "/" + m.integrity };
      }), mat.key, function (v) { _tools.mat = v; _tools.integ = ""; _tools.hit = null; }, { hook: "obj-mat" }),
      textField("Integrity left", _tools.integ, String(mat.integrity), function (v) { _tools.integ = v; },
        { type: "number", hook: "obj-integ", flex: "0 1 120px" }),
      textField("Damage", _tools.dmg, "damage", function (v) { _tools.dmg = v; }, { type: "number", hook: "obj-dmg", flex: "0 1 110px" }),
      el("button.btn.sm.primary", { "data-hook": "obj-check", style: { marginBottom: "2px" }, onclick: function () {
        var dmg = parseInt(_tools.dmg, 10);
        if (isNaN(dmg) || dmg < 0) { toast("Type the damage rolled."); return; }
        var integ = parseInt(_tools.integ, 10);
        if (isNaN(integ)) integ = mat.integrity;
        var res;
        if (dmg < mat.structure) {
          res = { text: dmg + " is under Structure " + mat.structure + ": no damage to it. Integrity stays " + integ + ".", after: integ };
        } else {
          var after = integ - dmg;
          var t = dmg + " meets Structure " + mat.structure + ": Integrity " + integ + " to " + Math.max(0, after) + ".";
          if (after <= 0) t += " Destroyed" + (after < 0 ? ", with " + (-after) + " overflow." : ".");
          res = { text: t, after: Math.max(0, after) };
        }
        _tools.hit = res.text;
        // the field carries the new Integrity, so the next hit picks up from there
        _tools.integ = String(res.after);
        EN.app.render();
      } }, "CHECK THE HIT")
    ]));
    if (_tools.hit) kids.push(el("p", { "data-hook": "obj-result", style: { margin: "8px 0 0", fontSize: "13px", color: "var(--accent)" }, text: _tools.hit }));

    // the rule itself, from the player-side combat data, for when the table argues
    var C = EN.combat || {};
    if (C.destructibleCover) {
      kids.push(el("button.btn.sm.ghost", { style: { marginTop: "8px" }, onclick: function () {
        _tools.ruleOpen = !_tools.ruleOpen; EN.app.render();
      } }, (_tools.ruleOpen ? "▾ " : "▸ ") + "THE RULE"));
      if (_tools.ruleOpen) {
        var rk = el("div", { style: { marginTop: "6px", fontSize: "12.5px", color: "var(--text2)", whiteSpace: "pre-wrap" } });
        EN.ui.applyInline(rk, C.destructibleCover + (C.overflowDamage ? "\n\n" + C.overflowDamage : ""));
        kids.push(rk);
      }
    }
    return EN.ui.panel("Object Damage", "STRUCTURE TO MATTER · INTEGRITY TO DIE", kids);
  }

  function toolsView() {
    var out = [];
    [stalematePanel(), fallingPanel(), objectPanel()].forEach(function (p) {
      if (!p) return;
      if (out.length) out.push(gap());
      out.push(p);
    });
    return out;
  }

  /* ---- the tab ---------------------------------------------------------- */
  var VIEWS = [
    { key: "library", label: "LIBRARY" },
    { key: "composer", label: "COMPOSER" },
    { key: "reference", label: "REFERENCE" },
    { key: "tools", label: "TOOLS" }
  ];
  function viewChips(libCount) {
    return el("div.row.wrap", { style: { gap: "6px", marginBottom: "10px" } }, VIEWS.map(function (v) {
      return el("span.chip" + (_ui.view === v.key ? ".on" : ""), { "data-view": v.key,
        style: { cursor: "pointer", fontSize: "10.5px" },
        onclick: function () {
          // a discard armed in one view is not left armed for a later single click in another
          if (EN.ui.disarm) EN.ui.disarm();
          _ui.view = v.key; _ui.focus = null; EN.app.render();
        }
      }, v.label + (v.key === "library" ? " (" + libCount + ")" : ""));
    }));
  }
  function roomStrip() {
    var room = roomRows();
    var live = room.filter(function (r) { return r && !r.cleared; }).length;
    var text = room.length
      ? "The Room holds " + plural(room.length, "hazard") + (live !== room.length ? ", " + live + " still live" : "") + ". It shows under the Table's initiative order."
      : "The Room is empty. ADD TO THE ROOM on any card puts a hazard under the Table's initiative order.";
    return el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "12px" } }, [
      el("span.help", { "data-hook": "room-strip", style: { margin: 0 }, text: text }),
      room.length ? el("button.btn.sm", { onclick: function () { EN.app.gotoTab("table"); } }, "OPEN THE TABLE ›") : null
    ]);
  }

  function render(mount) {
    EN.ui.clear(mount);
    // a handoff ("show me this one") is taken once and copied into the view state
    var ho = (EN.gmView && EN.gmView.takeHandoff) ? EN.gmView.takeHandoff("hazards") : null;
    if (ho && ho.focusKey != null) {
      _ui.view = "library";
      _ui.focus = String(ho.focusKey);
      _ui.scroll = true;
    }
    var H = book();
    if (!H) {
      mount.appendChild(el("div", null, [heading("Hazards", "// set pieces and the room"), undoStrip(),
        el("div.muted-box", { text: "Hazard data did not load. Check app/data/gm_hazards.js." })]));
      return;
    }
    var libCount = ((H.setPieces && H.setPieces.items) || []).length + gm.list("hazards").length;
    var blocks = [heading("Hazards", "// set pieces and the room"), undoStrip(), viewChips(libCount), roomStrip()];
    var body;
    if (_ui.view === "composer") body = composerView();
    else if (_ui.view === "reference") body = referenceView();
    else if (_ui.view === "tools") body = toolsView();
    else body = libraryView();
    mount.appendChild(el("div", null, blocks.concat(body)));

    /* A focused card is brought into view by scrolling the WINDOW, which is what
       app.js scrolls. scrollIntoView would also scroll the app frame's own
       overflow-hidden ancestors and leave the header hanging mid-screen. Deferred
       because app.js resets the window to the top after a tab switch renders. */
    if (_ui.scroll && _ui.focus) {
      _ui.scroll = false;
      var cards = mount.querySelectorAll(".hz-card");
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].getAttribute("data-hz") === _ui.focus) {
          var target = cards[i];
          setTimeout(function () {
            try {
              var y = target.getBoundingClientRect().top + (window.pageYOffset || 0) - 140;
              window.scrollTo(0, Math.max(0, y));
            } catch (e) {}
          }, 0);
          break;
        }
      }
    }
  }

  return {
    // the shared API (see the header): other modules read hazards through these
    all: all, byKey: byKey, atGrade: atGrade, priceXp: priceXp, toRoomEntry: toRoomEntry,
    // the tab and the Room tray
    render: render, tableExtra: tableExtra,
    // what the tray says a Room row is doing at a round, exposed for tests and other views
    roomPrompt: roomPrompt
  };
})();

/* Looked up through the namespace on every call, so the Table always draws the
   current tableExtra. Slot 20 of gm.js's draw order: under the Encounters tab's
   running plan (10) and above its XP award (30). */
if (EN.gmView && EN.gmView.registerTableExtra) {
  EN.gmView.registerTableExtra("hazards", function (ctx) { return EN.gmHazards.tableExtra(ctx); }, 20);
}
