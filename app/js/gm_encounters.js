/* ===========================================================================
   ELYSIUM NIGHTS · GM Encounters (Admin tab)
   Budget a fight with the book's arithmetic, build it from the Bestiary, saved
   threats, a quick build and hazards, hold it up against the composition
   rules, and run it on the Table. Two panels also hang under the Table's
   initiative order (two registered Table extras): the running plan (its later
   waves, the Security Response clock, the objective) above the Hazards Room
   tray and, once the Table has been cleared, the XP award for the fight that
   just ended below it.

   READS, NEVER RESTATES. Every rule sentence on this screen comes from
   EN.gmBook.encounters (Building Encounters) or EN.threats, and every number
   from EN.gmEngine (crew, share, budget, tierFor, xpOf, buildThreat,
   rollInit). The words written here are labels and the app's own readings,
   and each reading is marked where it is made.

   STATE. The plan being edited is TRANSIENT, like the Threat Builder's inputs
   in gm.js, until SAVE PLAN puts it in the `encounters` bag. Running a plan
   saves it first, because the Table finds the plan's later waves and its
   objective through encounter.sourceId. Everything else goes through
   EN.gmStore, and the one write to player records (the XP award) goes
   through writeCrew behind an armed button, with an UNDO and a COPY.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmEncounters = (function () {
  var el = EN.ui.el, toast = EN.ui.toast;
  var gm = EN.gmStore;

  // difficulty keys, in budget order; they match EN.threats.budget.difficulties
  var DIFFS = ["milk", "fair", "hard", "red"];

  /* Transient UI state. Survives a tab switch and a portal flip (this is one
     module), not a reload. A plan worth keeping is a plan the GM saved. */
  var _s = {
    plan: null,                          // the plan being edited, always in normPlan() shape
    adder: "bestiary",                   // which "add a line" source is open
    q: "", cat: "all", inBand: true,     // the Bestiary picker's filter
    b: { name: "", grade: null, designation: "standard", role: "gunhand" },   // the quick build
    hz: { key: "", grade: null },        // the hazard picker
    open: Object.create(null),           // reference sections the GM has opened
    banner: null,                        // one line about lines that arrived from another tab
    award: { at: null, skip: Object.create(null), objXp: null }   // XP award choices, per snapshot
  };

  /* ---- small helpers (each view carries its own, per the house convention) */
  function own(o, k) { return !!o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k); }
  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function copy(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  // a whole number at or above `lo`, else the default
  function int(v, lo, dflt) {
    var n = Math.floor(Number(v));
    return (v !== null && v !== "" && isFinite(n) && n >= lo) ? n : dflt;
  }
  function clampGrade(g) {
    var n = Math.round(Number(g));
    return (g !== null && g !== "" && isFinite(n) && n >= 1) ? Math.min(5, n) : null;
  }
  // "1,000" the way the book prints it
  function fmtXp(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  // an all-capitals word (a panel tag) takes a capital S
  function plural(n, one, many) {
    var s = /[a-z]/.test(one) ? "s" : "S";
    return n + " " + (n === 1 ? one : (many || one + s));
  }
  function book() { return (EN.gmBook && EN.gmBook.encounters) || null; }

  /* THE LEDGER'S LIVE WRITES (F4, F10). Whether an award or a payday still
     stands is read from the ledger every time, never from this module's memory
     or from a snapshot that HIDE or the next cleared fight can take away. A
     write can be undone while it is not undone, did not arrive in an imported
     backup, and its Freelancer's record still exists: a write to a deleted
     record went with the record. gmstore's liveWrites is that reading; the
     fallback is the same reading for a gmstore that predates it. Newest first. */
  function liveWrites(filter) {
    if (typeof gm.liveWrites === "function") {
      try { return gm.liveWrites(filter) || []; } catch (e) {}
    }
    return standingWrites(filter, false);
  }
  /* WHAT COUNTS AS PAID is the same reading with the imported writes kept in.
     An imported write cannot be undone here, but restoring a backup brings
     back records that really hold it, so an award or a payday that came in
     with a backup is never offered for payment a second time. The guards
     (AWARD XP, the Payroll XP note) read this; UNDO AWARD reads liveWrites. */
  function paidWrites(filter) {
    if (typeof gm.paidWrites === "function") {
      try { return gm.paidWrites(filter) || []; } catch (e) {}
    }
    return standingWrites(filter, true);
  }
  // the fallback for a gmstore that predates liveWrites and paidWrites
  function standingWrites(filter, withImported) {
    var roster = (EN.store && EN.store.roster && EN.store.roster()) || {};
    return gm.list("ledger").filter(function (r) {
      return isObj(r) && r.kind === "write" && !r.undone && (withImported || !r.imported) &&
             typeof r.charId === "string" && own(roster, r.charId) && (!filter || !!filter(r));
    }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  }
  // a write record's tag (writeCrew's meta), or an empty object for an untagged one
  function metaOf(r) { return isObj(r) && isObj(r.meta) ? r.meta : {}; }

  /* gm.js's strip naming the newest GM write to a Freelancer record, with its
     armed UNDO: the one control that can always pop the stack. Drawn under the
     heading when gm.js offers it. */
  function undoStrip() {
    if (!EN.gmView || typeof EN.gmView.undoStrip !== "function") return null;
    try { return EN.gmView.undoStrip() || null; } catch (e) { return null; }
  }

  function lbl(t) { return el("label.fl", { text: t }); }
  function help(text, style) { return el("p.help", { style: style || null, text: text }); }
  function spacer(h) { return el("div", { style: { height: (h || 12) + "px" } }); }
  function chip(text, color, title) {
    return el("span.chip", { title: title || null,
      style: color ? { fontSize: "9.5px", color: color, borderColor: color } : { fontSize: "9.5px" }, text: text });
  }
  function muted(text) { return el("div.muted-box", { style: { padding: "18px" }, text: text }); }
  function bar(cur, max, color) {
    var pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
    return el("div.meter", { style: { height: "6px", borderRadius: "3px", background: "var(--bg3)", overflow: "hidden" } },
      [el("div.meter-fill", { style: { height: "100%", width: pct + "%", background: color || "var(--accent)" } })]);
  }
  /* A control with a small mono label over it, for the dense rows. Spread top
     to bottom so a row of them (stretched to one height) lines its labels up
     along the top and its values along the bottom, inputs and plain figures
     alike. */
  function mini(label, node) {
    return el("div", { style: { display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "2px" } }, [
      el("span.mono", { style: { fontSize: "9.5px", letterSpacing: ".1em", color: "var(--text3)" }, text: label }), node
    ]);
  }
  function select(options, current, onPick, style) {
    return el("select", {
      onchange: function (e) { onPick(e.target.value); EN.app.render(); },
      style: style || { minWidth: "110px" }
    }, options.map(function (o) {
      return el("option", { value: o.value, selected: String(o.value) === String(current) }, o.label);
    }));
  }
  function field(label, node, style) {
    return el("div.field", { style: style || { margin: 0 } }, [lbl(label), node]);
  }
  /* Panels side by side on a wide screen and stacked on a phone. Each column
     takes a 340px basis, so two fit at desktop width and one at phone width. */
  function cols(nodes) {
    return el("div", { style: { display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-start" } },
      nodes.filter(Boolean).map(function (n) {
        return el("div", { style: { flex: "1 1 340px", minWidth: "0" } }, [n]);
      }));
  }
  // a reference section that opens on a click, for book text the GM reads once
  function fold(key, title, build) {
    var isOpen = !!_s.open[key];
    var head = el("div.section-title.clickable", {
      onclick: function () { _s.open[key] = !isOpen; EN.app.render(); }
    }, EN.ui.nameCaret(title, isOpen).concat([el("span.line")]));
    return el("div", null, [head, isOpen ? el("div", { style: { margin: "0 0 10px" } }, build()) : null]);
  }
  function heading(title, sub) {
    return el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" },
        html: title + ' <span class="dim3" style="font-size:13px">' + sub + "</span>" })
    ]);
  }

  /* COPY. The clipboard API where the browser offers it, the old selection
     trick where it does not (a file:// page is not always a secure context). */
  function copyText(text, what) {
    function fallback() {
      var ta = el("textarea", { style: { position: "fixed", left: "-9999px", top: "0" } });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? what + " copied." : "Copy failed. Select the text and copy it by hand.");
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast(what + " copied."); }, fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  /* ---- book lookups ------------------------------------------------------ */
  function diffList() {
    var B = book();
    return (B && B.budget && B.budget.difficulties) || (EN.threats.budget && EN.threats.budget.difficulties) || [];
  }
  function diffOf(key) { return diffList().filter(function (d) { return d.key === key; })[0] || null; }
  function diffName(key) { var d = diffOf(key); return d ? d.name : key; }
  function tiers() { var B = book(); return (B && B.security && B.security.tiers) || []; }
  function tierOf(key) { return tiers().filter(function (t) { return t.key === key; })[0] || null; }
  function objTypes() { var B = book(); return (B && B.objectives && B.objectives.types) || []; }
  function objType(key) { return objTypes().filter(function (t) { return t.key === key; })[0] || null; }
  function roomRules() { var B = book(); return (B && B.room && B.room.rules) || []; }
  function desName(key) {
    var d = ((EN.threats && EN.threats.designations) || []).filter(function (x) { return x.key === key; })[0];
    return d ? d.name : String(key || "");
  }

  /* The Bestiary by name, built once per entries array. Null-prototype, since
     the key is a name the data file chose. */
  var _byName = null, _byNameSrc = null;
  function entryByName(name) {
    var B = EN.bestiary;
    if (!B || !Array.isArray(B.entries)) return null;
    if (_byNameSrc !== B.entries) {
      _byName = Object.create(null);
      B.entries.forEach(function (e) { if (e && e.name && !own(_byName, e.name)) _byName[e.name] = e; });
      _byNameSrc = B.entries;
    }
    return own(_byName, name) ? _byName[name] : null;
  }

  function hazardsReady() {
    var H = EN.gmHazards;
    return !!(H && typeof H.all === "function" && typeof H.priceXp === "function");
  }
  /* A hazard's price at a Grade: the Hazards module's priceXp (Severe at a
     Standard's XP, Lethal at an Elite's, else the GM's own figure or nothing),
     falling back to the figure the hazard carries when that module is absent. */
  function priceHazard(hz, grade) {
    try {
      if (hazardsReady()) return Math.max(0, Number(EN.gmHazards.priceXp(hz, grade)) || 0);
    } catch (e) {}
    return Math.max(0, Number(hz && hz.xp) || 0);
  }

  /* ---- the plan --------------------------------------------------------------
     A saved encounter plan (bag `encounters`):
       { id, name, difficulty, crewOverride: {headcount, caliber} | null,
         lines: [{lineId, kind, name, count, wave, block | hazard + grade, xpEach, note?}],
         objective: {key, aliveOnly, note, awardXp}, site: {tier, grade, rounds},
         room: {ruleKey: true}, notes, jobId }
     plus `run` ({at, waves, startRound}) once it has been run, which only the
     Table side writes. `startRound` is the Table round the plan's round 1 fell
     on: 1 for a fresh fight, the live round for a plan added to a fight already
     running, so its later waves come due counted from when it joined (F1).
     `kind` is "bestiary" (priced from the entry, looked up by name),
     "threat" (a resolved statblock) or "hazard". `wave` is the arrival round,
     1 being the start. normPlan builds every plan in one fixed key order, so
     two plans compare equal as JSON exactly when they say the same thing. */
  function lineUid() { return "ln_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

  function normLine(l) {
    l = isObj(l) ? l : {};
    var kind = (l.kind === "threat" || l.kind === "hazard") ? l.kind : "bestiary";
    var out = {
      lineId: (typeof l.lineId === "string" && l.lineId) ? l.lineId : lineUid(),
      kind: kind,
      name: String(l.name || (kind === "hazard" ? "Hazard" : "Threat")),
      count: int(l.count, 1, 1),
      wave: int(l.wave, 1, 1),
      xpEach: Math.max(0, Number(l.xpEach) || 0)
    };
    if (kind === "threat") {
      out.block = isObj(l.block) ? l.block : null;
      if (isObj(l.inputs)) out.inputs = l.inputs;
    }
    if (kind === "hazard") {
      out.hazard = isObj(l.hazard) ? l.hazard : { name: out.name };
      out.grade = clampGrade(l.grade) || clampGrade(out.hazard.grade) || 3;
    }
    if (typeof l.note === "string" && l.note) out.note = l.note;
    return out;
  }

  function normPlan(p) {
    p = isObj(p) ? p : {};
    var o = isObj(p.objective) ? p.objective : {};
    var site = isObj(p.site) ? p.site : {};
    var co = isObj(p.crewOverride) ? p.crewOverride : null;
    var hc = co ? int(co.headcount, 1, null) : null;
    var cal = co ? clampGrade(co.caliber) : null;
    var room = {};
    roomRules().forEach(function (r) { if (isObj(p.room) && own(p.room, r.key) && p.room[r.key]) room[r.key] = true; });
    var t = tierOf(site.tier);
    var rounds = int(site.rounds, 1, null);
    if (!t || rounds === null || rounds < t.roundsMin || rounds > t.roundsMax) rounds = null;
    return {
      id: (typeof p.id === "string" && p.id) ? p.id : null,
      name: typeof p.name === "string" ? p.name : "",
      difficulty: DIFFS.indexOf(p.difficulty) !== -1 ? p.difficulty : "fair",
      crewOverride: (hc !== null || cal !== null) ? { headcount: hc, caliber: cal } : null,
      lines: (Array.isArray(p.lines) ? p.lines : []).filter(isObj).map(normLine),
      objective: {
        key: objType(o.key) ? o.key : null,
        aliveOnly: !!o.aliveOnly,
        note: typeof o.note === "string" ? o.note : "",
        awardXp: Math.max(0, Math.floor(Number(o.awardXp)) || 0)
      },
      site: { tier: t ? t.key : null, grade: clampGrade(site.grade), rounds: rounds },
      room: room,
      notes: typeof p.notes === "string" ? p.notes : "",
      jobId: (typeof p.jobId === "string" && p.jobId) ? p.jobId : null
    };
  }
  function blankPlan() { return normPlan({}); }
  function lineById(id) { return _s.plan.lines.filter(function (l) { return l.lineId === id; })[0] || null; }

  // "saved", "dirty" (saved, with edits since), "gone" (its record was deleted) or "new"
  function status(plan) {
    if (!plan.id) return "new";
    var rec = gm.rec("encounters", plan.id);
    if (!rec) return "gone";
    return JSON.stringify(normPlan(copy(rec))) === JSON.stringify(normPlan(plan)) ? "saved" : "dirty";
  }
  // whether leaving this plan would lose something the GM made
  function unsaved(plan) {
    var st = status(plan);
    if (st === "dirty" || st === "gone") return true;
    return st === "new" && !!(plan.lines.length || plan.name || plan.notes);
  }

  /* What a line is, read from where its numbers live: a Bestiary line from its
     entry (so a corrected entry corrects the plan), a built threat from its
     block, a hazard from the line's own XP (the GM may have priced it). */
  function lineInfo(line) {
    var i = { grade: null, des: null, desName: "", role: null, roleName: "", entry: null, missing: false,
              threat: line.kind !== "hazard", xpEach: Math.max(0, Number(line.xpEach) || 0) };
    if (line.kind === "bestiary") {
      var e = entryByName(line.name);
      if (e) {
        i.entry = e; i.grade = e.grade;
        i.des = String(e.designation || "").toLowerCase(); i.desName = e.designation || "";
        i.role = e.role ? String(e.role).toLowerCase() : null; i.roleName = e.role || "";
        i.xpEach = EN.gmEngine.xpOf(e);
      } else i.missing = true;
    } else if (line.kind === "threat") {
      var b = line.block;
      if (b) {
        i.grade = b.grade; i.des = b.designation || null; i.desName = b.designationName || "";
        // a block saved before Bestiary blocks carried `role` has only its printed name
        i.role = b.role || (b.roleName ? String(b.roleName).toLowerCase() : null); i.roleName = b.roleName || "";
        i.xpEach = EN.gmEngine.xpOf(b);
      } else i.missing = true;
    } else {
      i.grade = line.grade;
    }
    return i;
  }
  // "All lines count" (ruled for this build): later waves and hazards are budget too
  function spentOf(plan) {
    return (plan.lines || []).reduce(function (a, l) { return a + l.count * lineInfo(l).xpEach; }, 0);
  }

  function crewNow(plan) {
    var co = plan.crewOverride || {};
    try { return EN.gmEngine.crew({ headcount: co.headcount, caliber: co.caliber }); }
    catch (e) { return { members: [], headcount: 0, caliber: 1, source: "none", overridden: { headcount: false, caliber: false } }; }
  }

  /* THE GRADE BAND, in the book's own words for it: inside one Grade of the
     crew is the working band, below it is texture, two up is a climax and
     three up is weather. The tooltip carries the sentence each word is from. */
  function bandOf(grade, caliber) {
    var B = book(), C = B && B.composition;
    var bandRule = C ? C.rules.filter(function (r) { return r.key === "band"; })[0] : null;
    var d = grade - caliber;
    if (d >= 3) return { key: "weather", label: "WEATHER", color: "var(--danger)", tip: EN.threats.workingBand };
    if (d === 2) return { key: "climax", label: "CLIMAX", color: "var(--warn)", tip: EN.threats.workingBand };
    if (d <= -2) return { key: "texture", label: "TEXTURE", color: "var(--text3)", tip: bandRule ? bandRule.text : "" };
    return { key: "band", label: "WORKING BAND", color: "var(--success)", tip: C ? C.workingBand : "" };
  }

  /* Adding a Bestiary entry that is already a plain line in the first wave adds
     one to its count rather than a second line of the same thing. */
  function addLine(line) {
    if (line.kind === "bestiary") {
      var same = _s.plan.lines.filter(function (l) {
        return l.kind === "bestiary" && l.name === line.name && l.wave === line.wave && !l.note;
      })[0];
      if (same) { same.count += line.count; return same; }
    }
    _s.plan.lines.push(line);
    return line;
  }
  function bestiaryLine(name, count) {
    var e = entryByName(name);
    return normLine({ kind: "bestiary", name: name, count: count || 1, xpEach: e ? EN.gmEngine.xpOf(e) : 0 });
  }
  function builtLine(grade, desKey, name, count, note) {
    var inputs = { name: name || (desName(desKey) + " threat"), grade: grade, designation: desKey, role: "gunhand" };
    var b = EN.gmEngine.buildThreat(inputs);
    return normLine({ kind: "threat", name: b.name, block: b, inputs: inputs, count: count, xpEach: b.xp, note: note });
  }

  /* ---- the book's worked examples as templates -------------------------------
     The two worked examples, and the four ways the budget example spends the
     same 600. Each loads with the crew override the book states (Caliber and
     Freelancers), so its total reproduces the printed one whoever is filed.
     A line naming a Bestiary entry becomes a Bestiary line; a line that names
     none ("an Elite squad leader", "one G2 Solo") is built from its Grade and
     Designation, as a Gunhand because the page gives no Role. */
  function templateHazardLine(l, caliber) {
    // the page gives the Static Zone no Grade; it takes the example's Caliber
    var g = clampGrade(l.grade) || clampGrade(caliber) || 3;
    var hz = null;
    if (l.setPiece && EN.gmHazards && typeof EN.gmHazards.byKey === "function") {
      try { hz = copy(EN.gmHazards.byKey(l.setPiece)); } catch (e) { hz = null; }
    }
    // without the Hazards module, a stub the Run step resolves again by key
    if (!isObj(hz)) hz = { key: l.setPiece || "", source: "setpiece", grade: g, partial: true };
    hz.name = l.name;
    hz.xp = l.xpEach;
    if (l.note) hz.notes = l.note;
    return normLine({ kind: "hazard", name: l.name, hazard: hz, grade: g, count: l.count, xpEach: l.xpEach, note: l.note });
  }
  function templateThreatLine(l) {
    if (l.name && entryByName(l.name)) {
      var ln = bestiaryLine(l.name, l.count);
      if (l.note) ln.note = l.note;
      return ln;
    }
    return builtLine(l.grade, l.designation, l.name, l.count, l.note);
  }
  function planFromExample(ex) {
    var lines = (ex.lines || []).map(function (l) {
      return l.kind === "hazard" ? templateHazardLine(l, ex.caliber) : templateThreatLine(l);
    });
    // tick the room rule whose own example the worked example uses (the Toll's Cheap barricade)
    var room = {};
    (ex.room || []).forEach(function (item) {
      roomRules().forEach(function (r) {
        if ((r.examples || []).some(function (x) { return x.object === item.object; })) room[r.key] = true;
      });
    });
    return normPlan({
      name: ex.name, difficulty: ex.difficulty,
      crewOverride: { headcount: ex.freelancers, caliber: ex.caliber },
      lines: lines,
      objective: { key: null, note: (ex.objectives || []).join(", or ") },
      room: room, notes: ex.text
    });
  }
  function planFromOption(bx, o) {
    return normPlan({
      name: "Caliber " + bx.caliber + " " + diffName(bx.difficulty) + ": " + o.label,
      difficulty: bx.difficulty,
      crewOverride: { headcount: bx.freelancers, caliber: bx.caliber },
      lines: (o.lines || []).map(templateThreatLine),
      notes: bx.text
    });
  }
  function templates() {
    var B = book(), out = [];
    if (!B) return out;
    function sub(cal, n, diff, xp) { return "Caliber " + cal + ", " + n + " Freelancers, " + diffName(diff) + ", " + fmtXp(xp) + " XP."; }
    (B.examples || []).forEach(function (ex) {
      out.push({ key: "ex-" + ex.key, name: ex.name, sub: sub(ex.caliber, ex.freelancers, ex.difficulty, ex.budget), caliber: ex.caliber,
                 freelancers: ex.freelancers, difficulty: ex.difficulty, budget: ex.budget,
                 make: function () { return planFromExample(ex); } });
    });
    var bx = B.budget && B.budget.example;
    if (bx && Array.isArray(bx.options)) {
      bx.options.forEach(function (o, i) {
        out.push({ key: "budget-" + (i + 1), name: "Caliber " + bx.caliber + " " + diffName(bx.difficulty) + ": " + o.label,
                   sub: sub(bx.caliber, bx.freelancers, bx.difficulty, bx.budget),
                   caliber: bx.caliber, freelancers: bx.freelancers, difficulty: bx.difficulty, budget: o.xp,
                   make: function () { return planFromOption(bx, o); } });
      });
    }
    return out;
  }

  /* ---- saving, loading, handoffs ----------------------------------------- */
  /* Puts the working plan and returns its id. `run` belongs to the Table side
     (which waves are already in) and is carried over from the stored record,
     never taken from the editor. A plan made for a job is linked back on the
     job's own record. */
  function savePlan() {
    var p = normPlan(_s.plan);
    if (!p.name.replace(/\s+/g, "")) p.name = "Untitled encounter";
    var prev = p.id ? gm.rec("encounters", p.id) : null;
    if (prev && prev.run) p.run = copy(prev.run);
    var id = gm.put("encounters", p);
    if (!id) return null;
    _s.plan = normPlan(copy(gm.rec("encounters", id)));
    if (p.jobId) {
      var job = gm.rec("jobs", p.jobId);
      if (job && job.encounterId !== id) {
        var j = copy(job);
        j.encounterId = id;
        gm.put("jobs", j, { silent: true });
      }
    }
    return id;
  }
  function loadPlan(p, what) {
    _s.plan = p;
    _s.banner = null;
    toast(what);
    EN.app.render();
  }

  /* A handoff from another tab (the Bestiary, the Threats tab, the Job Board,
     Hazards, People, Heat): {addLines: [line, ...], note, jobId, difficulty}.
     Its lines join the plan being edited, a note with something in it joins
     the plan's notes, and a banner says what arrived. The payload is taken
     once by render(), per gm.js's handoff.

     A NOTE THAT ONLY SAYS WHERE A LINE CAME FROM ("Street Ganger, from the
     Bestiary.") is the banner's business, not the plan's (F21): the GM's
     notes are prep, and one provenance line per added entry used to pile up
     in them and print in the plan's COPY. The senders now send an empty note;
     the pattern below catches the phrasing older senders used.

     A JOB'S LINES NEVER MOVE ANOTHER JOB'S PLAN (F12). When the plan that is
     open already belongs to a different job, the incoming job gets a plan of
     its own, and the open one is saved first if it has unsaved changes, so
     nothing the GM made is lost and the first job's link still points at it.

     A FIGHT'S DIFFICULTY (`difficulty`, a key of DIFFS: the Heat tab's fight
     card sends one) sets the plan's when the plan held no lines before the
     handoff. A plan the GM already started keeps its own, and the banner names
     the one the fight called for. */
  var PROVENANCE = /^[^\n]*, from (the Bestiary|the Threat Builder|Saved Threats)\.$/;
  function realNote(note) { return !!note && !PROVENANCE.test(note); }
  function jobTitle(id) {
    var j = id ? gm.rec("jobs", id) : null;
    return j ? "the job " + (j.title || "untitled job") : "another job";
  }
  function lineFromHandoff(raw) {
    var cnt = int(raw.count, 1, 1);
    if (raw.kind === "bestiary") {
      return raw.name ? bestiaryLine(String(raw.name), cnt) : null;
    }
    if (raw.kind === "threat" && isObj(raw.block)) {
      var b = copy(raw.block);
      return normLine({ kind: "threat", name: b.name || "Threat", block: b,
                        inputs: isObj(raw.inputs) ? copy(raw.inputs) : undefined, count: cnt, xpEach: EN.gmEngine.xpOf(b) });
    }
    if (raw.kind === "hazard" && isObj(raw.hazard)) {
      var hz = copy(raw.hazard);
      var g = clampGrade(raw.grade) || clampGrade(hz.grade) || 3;
      return normLine({ kind: "hazard", name: hz.name || "Hazard", hazard: hz, grade: g, count: 1, xpEach: priceHazard(hz, g) });
    }
    return null;
  }
  function intake(h) {
    if (!isObj(h)) return;
    var pre = "";
    var jid = (typeof h.jobId === "string" && h.jobId) ? h.jobId : null;
    var link = !!jid;
    if (jid && _s.plan.jobId && _s.plan.jobId !== jid) {
      var oldJob = _s.plan.jobId, savedFirst = false, ok = true;
      if (unsaved(_s.plan)) { savedFirst = !!savePlan(); ok = savedFirst; }
      if (ok) {
        _s.plan = blankPlan();
        pre = "A new plan for " + jobTitle(jid) + ": the plan that was open is for " + jobTitle(oldJob) +
              (savedFirst ? ", and it was saved first." : ".") + " ";
      } else {
        // it could not be saved, so it stays open, and keeps its own job
        link = false;
        pre = "The plan that is open is for " + jobTitle(oldJob) + " and could not be saved, so it stays open and keeps that job. ";
      }
    }
    var dk = (typeof h.difficulty === "string" && DIFFS.indexOf(h.difficulty) !== -1) ? h.difficulty : null;
    var wasEmpty = !_s.plan.lines.length;
    var added = 0, skipped = 0;
    (Array.isArray(h.addLines) ? h.addLines : []).forEach(function (raw) {
      var line = isObj(raw) ? lineFromHandoff(raw) : null;
      if (line) { addLine(line); added++; } else skipped++;
    });
    if (link) _s.plan.jobId = jid;
    var note = typeof h.note === "string" ? h.note.replace(/^\s+|\s+$/g, "") : "";
    if (realNote(note) && _s.plan.notes.indexOf(note) === -1) _s.plan.notes = _s.plan.notes ? _s.plan.notes + "\n\n" + note : note;
    var diffSaid = "";
    if (dk && dk !== _s.plan.difficulty) {
      if (wasEmpty) { _s.plan.difficulty = dk; diffSaid = " The plan is set to " + diffName(dk) + "."; }
      else diffSaid = " The fight calls for " + diffName(dk) + ". The plan keeps its own, " + diffName(_s.plan.difficulty) + ".";
    }
    _s.banner = pre + (added ? plural(added, "line") + " added to the plan below" : "Nothing was added to the plan") +
                (note ? ": " + note : ".") +
                (skipped ? " " + plural(skipped, "line") + " could not be read and " + (skipped === 1 ? "was" : "were") + " skipped." : "") +
                diffSaid;
  }

  /* ---- running a plan on the Table ------------------------------------------
     What a Bestiary entry is on the Table: its PRINTED self, the same block the
     Bestiary tab's "+ ADD TO INITIATIVE" builds (gm.js), so a threat reads the
     same whichever tab sent it. Its attack and its one Save DC are read out of
     the ability text where the page prints them, a Save DC only when the entry
     prints exactly one. A #GRID threat with neither Vitality nor a System
     Integrity stat (the #GRID Guardian) takes the System Integrity its Node
     ability prints before falling back to 1. */
  function printedOf(e) {
    var st = e.stats || {};
    var body = (e.abilities || []).map(function (a) { return a.text; }).join(" ");
    var atk = body.match(/([+-]\d+)\s+vs\s+Defense/);
    var uniq = [];
    (body.match(/Save\s+DC\s+(\d+)/g) || []).forEach(function (d) {
      var v = d.replace(/[^0-9]+/g, "");
      if (uniq.indexOf(v) < 0) uniq.push(v);
    });
    var a = atk ? Number(atk[1]) : null;
    var dc = uniq.length === 1 ? Number(uniq[0]) : null;
    if (a === null && st["Cipher Attack"]) a = parseInt(st["Cipher Attack"], 10);
    if (dc === null && st["Cipher Save DC"]) dc = parseInt(st["Cipher Save DC"], 10);
    return { attackBonus: (a === null || isNaN(a)) ? null : a, saveDC: (dc === null || isNaN(dc)) ? null : dc };
  }
  function bestiaryBlock(e) {
    var st = e.stats || {};
    var vit = parseInt(st.Vitality, 10);
    if (isNaN(vit)) vit = parseInt(st["System Integrity"], 10);
    if (isNaN(vit)) {
      var m = (e.abilities || []).map(function (a) { return a.text; }).join(" ").match(/System Integrity\s+(\d+)/);
      if (m) vit = parseInt(m[1], 10);
    }
    var def = parseInt(st.Defense, 10);
    var initM = parseInt(String(st.Initiative || "0").replace("+", ""), 10) || 0;
    var p = printedOf(e);
    return {
      name: e.name, grade: e.grade,
      designation: String(e.designation || "Standard").toLowerCase(), designationName: e.designation || "Standard",
      role: e.role ? String(e.role).toLowerCase() : null,
      roleName: e.role || "", defense: isNaN(def) ? null : def,
      saveDC: p.saveDC, attackBonus: p.attackBonus, vitality: isNaN(vit) ? 1 : vit,
      init: initM, initMod: initM,
      fromBestiary: true, stats: copy(st), abilities: copy(e.abilities || [])
    };
  }

  /* NUMBERED ROWS. Several of one threat arrive as "Street Ganger 1",
     "Street Ganger 2", counted across every line of that name and continuing
     after any already on the Table, so a later wave's gangers pick up where the
     first wave's left off. One of a name, alone on the Table, keeps its plain
     name. */
  function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function numberNames(existing, bases) {
    var seen = Object.create(null);
    bases.forEach(function (b) {
      if (own(seen, b)) { seen[b].add++; return; }
      var re = new RegExp("^" + reEsc(b) + "(?: (\\d+))?$"), have = 0, top = 0;
      existing.forEach(function (n) {
        var m = re.exec(String(n || ""));
        if (m) { have++; if (m[1]) top = Math.max(top, parseInt(m[1], 10)); }
      });
      seen[b] = { have: have, top: Math.max(top, have), add: 1, n: 0 };
    });
    return bases.map(function (b) {
      var t = seen[b];
      if (t.have + t.add === 1) return b;
      t.n = t.n ? t.n + 1 : t.top + 1;
      return b + " " + t.n;
    });
  }

  // a hazard line's object for the Room, re-resolved by key when it was stored as a stub
  function resolveHazard(line) {
    var hz = copy(line.hazard) || { name: line.name };
    if (hz.partial && hz.key && EN.gmHazards && typeof EN.gmHazards.byKey === "function") {
      var full = null;
      try { full = copy(EN.gmHazards.byKey(hz.key)); } catch (e) { full = null; }
      if (isObj(full)) {
        full.name = hz.name || full.name;
        if (typeof hz.xp === "number") full.xp = hz.xp;
        if (hz.notes) full.notes = hz.notes;
        hz = full;
      }
    }
    delete hz.partial;
    return hz;
  }

  /* One arrival round of a plan onto the Table: its threat lines into the
     initiative order (a Bestiary threat rolls d20 plus its printed Initiative,
     a built or saved one rolls its own initMod) and its hazard lines into the
     Room through the Hazards module, which owns everything the Room does.
     Hazards arrive with their wave like threats do, starting on the round they
     come in. Returns what landed and what could not. */
  function addWave(plan, wave, startRound) {
    var enc = gm.get().encounter;
    var existing = enc.entries.filter(function (r) { return r.kind === "threat"; }).map(function (r) { return r.name; });
    var rows = [], missing = [];
    plan.lines.forEach(function (line) {
      if (line.wave !== wave || line.kind === "hazard") return;
      var block = null, inputs = null;
      if (line.kind === "bestiary") {
        var e = entryByName(line.name);
        if (e) block = bestiaryBlock(e);
      } else if (line.block) {
        block = line.block;
        inputs = line.inputs || null;
      }
      if (!block) { missing.push(line.name); return; }
      for (var i = 0; i < line.count; i++) rows.push({ base: block.name || line.name, block: block, inputs: inputs });
    });
    var names = numberNames(existing, rows.map(function (r) { return r.base; }));
    rows.forEach(function (r, i) {
      // the ROW takes the number; the block keeps the statblock's own name (gmstore's rule)
      var b = copy(r.block);
      var mod = (typeof b.initMod === "number" && isFinite(b.initMod)) ? b.initMod : (b.init | 0);
      gm.addThreat(b, r.inputs, EN.gmEngine.rollInit(mod).total, names[i]);
    });

    var hz = plan.lines.filter(function (l) { return l.wave === wave && l.kind === "hazard"; });
    var placed = 0, skippedHz = 0;
    if (hz.length) {
      if (!EN.gmHazards || typeof EN.gmHazards.toRoomEntry !== "function") {
        hz.forEach(function (l) { skippedHz += l.count; });
      } else {
        var room = gm.get().encounter.room.slice();
        hz.forEach(function (l) {
          var obj = resolveHazard(l);
          for (var i = 0; i < l.count; i++) {
            var entry = null;
            try { entry = EN.gmHazards.toRoomEntry(obj, l.grade, startRound); } catch (e) { entry = null; }
            if (isObj(entry)) { room.push(entry); placed++; } else skippedHz++;
          }
        });
        if (placed) gm.setRoom(room);
      }
    }
    return { threats: rows.length, hazards: placed, skippedHz: skippedHz, missing: missing };
  }

  function rollIn(t) { return t.roundsMin + Math.floor(Math.random() * (t.roundsMax - t.roundsMin + 1)); }
  // a live clock in a few words, for the armed titles that say what becomes of it
  function clockWords(c) {
    var t = tierOf(c.tier);
    return (t ? t.name : "the clock") + ", " +
      (!c.started ? "not started" : c.roundsLeft <= 0 ? "arrived" : plural(c.roundsLeft, "round") + " left");
  }
  /* The Security Response clock, written into the live encounter. It starts
     STOPPED: the book starts it "when a fight goes loud", which is the GM's
     call, so the Table panel carries the START button. `roundsLeft` is the
     plan's chosen start, or a roll inside the tier's printed window. */
  function newClock(plan, crew) {
    var t = tierOf(plan.site.tier);
    if (!t) return null;
    var n = plan.site.rounds || rollIn(t);
    return { tier: t.key, grade: plan.site.grade || crew.caliber, roundsLeft: n, roundsTotal: n,
             followRound: false, loudRounds: 0, history: [], started: false, loud: true, syncedRound: 0 };
  }

  /* RUN ON THE TABLE. "new" on an empty Table; "replace" clears the Table
     first (the old fight is snapshotted for its XP award, as the Table's END
     does) and keeps the crew's rows and their rolls; "append" adds to whatever
     is there. The plan is saved first, so the Table can find it.

     APPENDED MID-FIGHT (F1, F2). The plan's round 1 is the round it joins, so
     its first-wave hazards start on the live round (a 2-round countdown that
     joins in round 4 reaches zero in round 6, not "already at zero"), and its
     later waves come due counted from there (run.startRound). A Security
     Response clock already on the Table is KEPT: its rounds counted down and
     its noise toward escalation are the fight's, and the book's clock only
     ever closes on the crew. The plan's own clock replaces it only through the
     explicit "+ ADD AND RESET THE CLOCK" (opts.newClock). */
  function run(mode, opts) {
    if (!_s.plan.lines.length) { toast("Add a line to the plan first."); return; }
    var crew = crewNow(_s.plan);
    var id = savePlan();
    if (!id) { toast("The plan could not be saved, so it was not run."); return; }
    var plan = normPlan(copy(gm.rec("encounters", id)));
    if (mode === "replace") {
      var keep = gm.get().encounter.entries.filter(function (r) { return r.kind === "crew"; })
        .map(function (r) { return { charId: r.charId, init: r.init, initMod: r.initMod }; });
      gm.clearEncounter();
      keep.forEach(function (r) { gm.addCrew(r.charId, r.init, r.initMod); });
    }
    var live = gm.get().encounter;
    var startR = mode === "append" ? Math.max(1, live.round | 0) : 1;
    var keptClock = mode === "append" && !!live.clock && !(opts && opts.newClock);
    var res = addWave(plan, 1, startR);
    var clock = keptClock ? null : newClock(plan, crew);
    if (clock) gm.setClock(clock);
    gm.setEncounterMeta({ name: plan.name, sourceId: id });
    var rec = copy(gm.rec("encounters", id));
    rec.run = { at: Date.now(), waves: [1], startRound: startR };
    gm.put("encounters", rec, { silent: true });

    var later = plan.lines.filter(function (l) { return l.wave > 1; }).length;
    var msg = "On the Table: " + plural(res.threats, "threat") + " rolled for initiative";
    if (res.hazards) msg += ", " + plural(res.hazards, "hazard") + " in the Room";
    msg += ".";
    if (later) msg += startR > 1 ? " Later waves wait under the order, counted from round " + startR + "." : " Later waves wait under the order.";
    if (keptClock && tierOf(plan.site.tier)) msg += " The Security Response clock already running is kept.";
    if (res.skippedHz) msg += " " + plural(res.skippedHz, "hazard") + " skipped: the Hazards module is not loaded.";
    if (res.missing.length) msg += " Not found in the Bestiary: " + res.missing.join(", ") + ".";
    toast(msg);
    EN.app.gotoTab("table");
  }

  /* ---- the plan panel -------------------------------------------------------- */
  function planText(plan, crew) {
    var lines = [];
    var spent = spentOf(plan), target = EN.gmEngine.budget(crew.caliber, crew.headcount, plan.difficulty);
    lines.push((plan.name || "Untitled encounter") + " (" + diffName(plan.difficulty) + ", " + fmtXp(spent) + " of " +
               fmtXp(target) + " XP; Caliber " + crew.caliber + ", " + plural(crew.headcount, "Freelancer") + ")");
    var waves = [];
    plan.lines.forEach(function (l) { if (waves.indexOf(l.wave) === -1) waves.push(l.wave); });
    waves.sort(function (a, b) { return a - b; });
    waves.forEach(function (w) {
      plan.lines.filter(function (l) { return l.wave === w; }).forEach(function (l) {
        var i = lineInfo(l);
        var what = l.kind === "hazard" ? "hazard, G" + i.grade : "G" + i.grade + " " + i.desName + (i.roleName ? " " + i.roleName : "");
        if (l.kind === "threat" && isObj(l.block) && l.block.species) what += ", " + l.block.species + " template";
        lines.push("Round " + w + ": " + l.count + " x " + l.name + " (" + what + ", " + fmtXp(i.xpEach) + " XP each) = " + fmtXp(l.count * i.xpEach) +
                   (l.note ? ". " + l.note : ""));
      });
    });
    var ot = objType(plan.objective.key);
    if (ot || plan.objective.note) {
      lines.push("Objective: " + (ot ? ot.name + " " + ot.text : "") + (plan.objective.note ? (ot ? " " : "") + plan.objective.note : "") +
                 (plan.objective.aliveOnly ? " Alive-only." : "") + (plan.objective.awardXp ? " Award " + fmtXp(plan.objective.awardXp) + " XP." : ""));
    }
    var t = tierOf(plan.site.tier);
    if (t) lines.push("Security Response: " + t.name + " (site Grade " + (plan.site.grade || crew.caliber) + "), arrives in " + t.arrives + ". " + t.looksLike);
    if (plan.notes) lines.push("Notes: " + plan.notes);
    return lines.join("\n");
  }

  function diffChips(plan) {
    return el("div.row.wrap", { style: { gap: "6px" } }, diffList().map(function (d) {
      return el("span.chip" + (plan.difficulty === d.key ? ".on" : ""), {
        style: { cursor: "pointer", fontSize: "10.5px" }, title: d.costs,
        onclick: function () { _s.plan.difficulty = d.key; EN.app.render(); }
      }, d.name);
    }));
  }

  /* TYPING NEVER RE-RENDERS THE TAB (F19). A text field that re-rendered on
     `change` did it at the mousedown of the GM's next click (that is when the
     field blurs), so the button under the pointer was swapped out before the
     mouseup and Chrome never delivered the click: the first press after typing
     did nothing. The plan's typed fields (name, notes, objective XP and note)
     keep their state on `input` and repaint only what reads from them, in
     place, while the GM is still typing: the plan's SAVED tag and glow, and,
     when the plan turns unsaved or saved, the NEW PLAN button and the Plans
     panel, whose LOAD buttons arm over unsaved work. None of them holds the
     field being typed in. The fields whose figures run through the whole tab
     (a line's COUNT, ROUND and XP EACH, the crew Headcount, the quick build's
     Name) redraw it around themselves instead, as they are typed: see
     retype() by the tab's render. */
  var _paint = { plan: null, newBtn: null, plans: null, dirty: null };
  function planTag(plan, st) {
    return st === "saved" ? "SAVED" : st === "dirty" ? "UNSAVED CHANGES" : st === "gone" ? "DELETED, NOT SAVED" : (unsaved(plan) ? "NOT SAVED" : "NEW");
  }
  function swapNode(old, next) {
    if (old && old.parentNode && next) old.parentNode.replaceChild(next, old);
    return next;
  }
  function paintPlan() {
    var plan = _s.plan, pp = _paint.plan;
    if (!plan || !pp || !pp.parentNode) return;
    var st = status(plan);
    var tagEl = pp.querySelector(".panel-h .tag");
    if (tagEl) tagEl.textContent = planTag(plan, st);
    if (st === "dirty") pp.classList.add("glow"); else pp.classList.remove("glow");
    var dirty = unsaved(plan);
    if (dirty === _paint.dirty) return;
    _paint.dirty = dirty;
    _paint.newBtn = swapNode(_paint.newBtn, newPlanButton(plan));
    if (_paint.plans) _paint.plans = swapNode(_paint.plans, plansPanel(plan));
  }
  function newPlanButton(plan) {
    return unsaved(plan)
      ? EN.ui.armButton("enc:new", { label: "NEW PLAN", armedLabel: "DISCARD CHANGES?",
          armedTitle: "Starts an empty plan. Unsaved changes to this one are lost.",
          onConfirm: function () { loadPlan(blankPlan(), "A new, empty plan."); } })
      : el("button.btn.sm", { onclick: function () { loadPlan(blankPlan(), "A new, empty plan."); } }, "NEW PLAN");
  }

  function planPanel(plan, crew) {
    var st = status(plan);
    var kids = [];
    kids.push(el("div.row.wrap", { style: { gap: "12px", alignItems: "flex-end" } }, [
      field("Name", el("input", { type: "text", value: plan.name, placeholder: "Name this fight",
        style: { width: "100%" },
        oninput: function (e) { _s.plan.name = e.target.value; paintPlan(); } }), { margin: 0, flex: "1 1 220px", minWidth: "0" }),
      field("Difficulty", diffChips(plan))
    ]));
    if (plan.jobId) {
      var job = gm.rec("jobs", plan.jobId);
      kids.push(el("p.help", { style: { margin: "8px 0 0", color: "var(--accent)" },
        text: job ? "For the job: " + (job.title || "untitled job") + "." : "For a job that is no longer in the log." }));
    }
    kids.push(el("div.field", { style: { margin: "10px 0 0" } }, [lbl("Notes"),
      el("textarea", { value: plan.notes, placeholder: "The room, the hook, the weakness the crew can find in advance.",
        style: { width: "100%", minHeight: "56px" },
        oninput: function (e) { _s.plan.notes = e.target.value; paintPlan(); } })]));

    var enc = gm.get().encounter;
    var can = plan.lines.length > 0;
    var btns = [
      el("button.btn.sm.primary", { onclick: function () {
        var id = savePlan();
        toast(id ? "Saved: " + _s.plan.name + "." : "The plan could not be saved.");
        EN.app.render();
      } }, "SAVE PLAN")
    ];
    _paint.newBtn = newPlanButton(plan);
    _paint.dirty = unsaved(plan);
    btns.push(_paint.newBtn);
    btns.push(el("button.btn.sm", { onclick: function () { copyText(planText(_s.plan, crewNow(_s.plan)), "The plan"); } }, "COPY"));
    var planT = tierOf(plan.site.tier);
    if (!can) {
      btns.push(el("button.btn.sm", { disabled: true, title: "Add a line first" }, "▶ RUN ON THE TABLE"));
    } else if (!enc.entries.length) {
      btns.push(el("button.btn.sm.primary", { onclick: function () { run("new"); } }, "▶ RUN ON THE TABLE"));
    } else {
      btns.push(EN.ui.armButton("enc:replace", { label: "▶ REPLACE THE TABLE", armedLabel: "REPLACE IT?",
        title: "Clear the Table's threats and run this plan. The crew's rows stay.",
        armedTitle: "Clears the live fight and runs this plan. The crew's rows stay. Award the old fight's XP first: " +
                    "its award card needs an empty Table, and this fight takes its place when it ends.",
        onConfirm: function () { run("replace"); } }));
      // what becomes of the Security Response clock, said before the GM confirms (F2)
      var startAt = Math.max(1, enc.round | 0);
      var addTitle = "Adds this plan's first wave to the live fight and makes this the running plan" +
        (startAt > 1 ? ", counting its rounds from round " + startAt + "." : ".");
      if (enc.clock) {
        addTitle += " The Security Response clock on the Table (" + clockWords(enc.clock) + ") is kept" +
          (planT ? "; this plan's " + planT.name + " clock is not set." : ".");
      } else if (planT) {
        addTitle += " It sets this plan's " + planT.name + " Security Response clock, not started.";
      }
      btns.push(EN.ui.armButton("enc:append", { label: "+ ADD TO THE TABLE", armedLabel: "ADD TO IT?",
        title: "Add this plan's first wave to the fight already running.",
        armedTitle: addTitle,
        onConfirm: function () { run("append"); } }));
      if (enc.clock && planT) {
        btns.push(EN.ui.armButton("enc:append-clock", { label: "+ ADD AND RESET THE CLOCK", armedLabel: "RESET THE CLOCK?",
          title: "Add this plan's first wave and replace the running clock with this plan's.",
          armedTitle: "Adds this plan's first wave to the live fight and replaces the Security Response clock on the Table (" +
                      clockWords(enc.clock) + ") with this plan's " + planT.name + " clock, not started. The rounds it counted " +
                      "and its noise toward escalation are lost.",
          onConfirm: function () { run("append", { newClock: true }); } }));
      }
    }
    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "12px" } }, btns));
    if (can) {
      kids.push(help("Running saves the plan, puts the first wave on the Table, sets the Security Response clock, and leaves later waves under the order to bring in." +
        (enc.entries.length && enc.clock ? " Adding to the fight keeps the clock already on the Table." : "")));
    }

    _paint.plan = EN.ui.panel("Encounter Plan", planTag(plan, st), kids, { glow: st === "dirty" });
    return _paint.plan;
  }

  /* ---- crew and budget ------------------------------------------------------- */
  function setOverride(key, value) {
    var co = _s.plan.crewOverride ? copy(_s.plan.crewOverride) : { headcount: null, caliber: null };
    co[key] = value;
    _s.plan.crewOverride = (co.headcount === null && co.caliber === null) ? null : co;
  }

  function crewPanel(plan, crew) {
    var kids = [];
    var co = plan.crewOverride || {};
    if (crew.members.length) {
      kids.push(el("div.row.wrap", { style: { gap: "6px" } }, crew.members.map(function (m) {
        return chip(m.name + " · " + (m.caliber ? "CALIBER " + m.caliber : "NO CALIBER"));
      })));
      kids.push(help(crew.source === "table" ? "The crew on the Table." : "The filed roster. Nobody from it is on the Table yet."));
    } else {
      kids.push(muted("No crew yet. File Freelancers, pull them onto the Table, or set the headcount and Caliber below."));
    }
    var calOpts = [{ value: "", label: "From the crew" }].concat([1, 2, 3, 4, 5].map(function (n) { return { value: n, label: "Caliber " + n }; }));
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "10px" } }, [
      // redraws the tab around itself as it is typed, never at the blur (F19, see retype)
      field("Headcount", el("input", { type: "number", min: "1", value: co.headcount === null || co.headcount === undefined ? "" : String(co.headcount),
        placeholder: String(crew.members.length), style: { width: "80px" }, dataset: { enc: "headcount" },
        oninput: function (e) {
          if (e.target.validity && e.target.validity.badInput) return;
          setOverride("headcount", int(e.target.value, 1, null));
          retype(e.target);
        },
        // what was kept, shown when the GM leaves the field: set in place, which moves no button
        onchange: function (e) {
          var now = _s.plan.crewOverride ? _s.plan.crewOverride.headcount : null;
          e.target.value = now === null || now === undefined ? "" : String(now);
        } })),
      field("Caliber", select(calOpts, co.caliber || "", function (v) { setOverride("caliber", clampGrade(v)); })),
      plan.crewOverride ? el("button.btn.sm", { onclick: function () { _s.plan.crewOverride = null; EN.app.render(); } }, "USE THE CREW") : null
    ]));
    if (plan.crewOverride) kids.push(help("Overridden for this plan. Caliber is the crew's rounded average when it is not set here.", { color: "var(--warn)" }));
    var tag = crew.headcount ? plural(crew.headcount, "FREELANCER") + " · CALIBER " + crew.caliber : "NO CREW";
    return EN.ui.panel("Crew", tag, kids);
  }

  function budgetPanel(plan, crew) {
    var B = book().budget;
    var eng = EN.gmEngine;
    var spent = spentOf(plan);
    var hc = crew.headcount, cal = crew.caliber;
    var share = eng.share(cal);
    var fair = eng.budget(cal, hc, "fair");
    var target = eng.budget(cal, hc, plan.difficulty);
    var tier = eng.tierFor(spent, cal, hc);
    var kids = [];
    var over = spent > target;
    kids.push(el("div.stat-row", null, [
      EN.ui.stat("Share", fmtXp(share), "Caliber " + cal),
      EN.ui.stat("Fair Fight", fmtXp(fair), fmtXp(share) + " x " + hc),
      EN.ui.stat("Spent", fmtXp(spent), tier.name ? "reaches " + tier.name : (spent ? "under a Milk Run" : "nothing yet")),
      EN.ui.stat(over ? "Over" : "Left", fmtXp(Math.abs(target - spent)), diffName(plan.difficulty))
    ]));
    kids.push(spacer(10));
    diffList().forEach(function (d) {
      var b = eng.budget(cal, hc, d.key);
      var isT = d.key === plan.difficulty, reached = tier.key === d.key;
      kids.push(el("div", { style: { margin: "0 0 9px" } }, [
        el("div.row.between.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
          el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
            el("span", { style: { fontWeight: 600, color: isT ? "var(--accent)" : "var(--text)", cursor: "pointer" },
              title: "Make this the plan's difficulty",
              onclick: function () { _s.plan.difficulty = d.key; EN.app.render(); }, text: d.name }),
            el("span.mono", { style: { fontSize: "11px", color: "var(--text3)" }, text: d.budget || ("x" + d.mult) }),
            isT ? chip("TARGET", "var(--accent)") : null,
            reached ? chip("REACHED", "var(--success)") : null
          ]),
          el("span.mono", { style: { fontSize: "12px" }, text: fmtXp(Math.min(spent, b)) + " / " + fmtXp(b) + " XP" })
        ]),
        el("div", { style: { margin: "4px 0 2px" } }, [bar(spent, b, isT ? "var(--accent)" : "var(--text3)")]),
        help(d.costs, { margin: "2px 0 0" })
      ]));
    });
    if (!hc) kids.push(help("No headcount, so no budget. Set the crew first.", { color: "var(--warn)" }));
    if (tier.past2x) {
      kids.push(el("div.feature", { style: { borderLeftColor: "var(--danger)", marginTop: "6px" } }, [
        el("p", { style: { margin: 0, color: "var(--danger)" }, text: (EN.threats.budget && EN.threats.budget.note) || B.pastText })
      ]));
    } else if (tier.next && hc) {
      kids.push(help("Next: " + tier.next.name + " at " + fmtXp(tier.next.at) + " XP, " + fmtXp(tier.next.at - spent) + " more."));
    }
    var hasSolo = plan.lines.some(function (l) { return lineInfo(l).des === "solo"; });
    if (hasSolo && EN.threats.budget && EN.threats.budget.soloNote) {
      kids.push(help("Solo: " + EN.threats.budget.soloNote, { color: "var(--gold)" }));
    }
    kids.push(fold("budget-how", "How the budget works", function () {
      var out = [help(B.intro, { margin: "0 0 6px" })];
      (B.steps || []).forEach(function (s) { out.push(help(s.n + ". " + s.text, { margin: "0 0 3px" })); });
      if (B.example) out.push(help(B.example.text, { margin: "6px 0 0", fontStyle: "italic" }));
      return out;
    }));
    return EN.ui.panel("Budget", diffName(plan.difficulty).toUpperCase() + " · " + fmtXp(target) + " XP", kids);
  }

  /* ---- the lines ---------------------------------------------------------------- */
  /* A line's number field. A whole number at or above `min` lands in the plan
     and the tab is redrawn around the field as it is typed (retype), so the
     line's TOTAL, its wave, the Lines and Budget panels and the plan's SAVED
     tag follow the keystroke. It never redraws at the blur: that is the
     mousedown of the GM's next click, and a redraw there swallowed the click
     (F19). Leaving the field shows what was kept (`now()`), set in place. */
  function numIn(value, min, title, key, onSet, now) {
    return el("input", { type: "number", min: String(min), value: String(value), title: title, style: { width: "62px" },
      dataset: { enc: key },
      oninput: function (e) {
        var t = e.target, v = Math.floor(Number(t.value));
        if (t.value !== "" && isFinite(v) && v >= min) { onSet(v); retype(t); }
      },
      onchange: function (e) { var v = now(); if (v !== null && v !== undefined) e.target.value = String(v); } });
  }
  function statLine(line, info) {
    if (line.kind === "bestiary" && info.entry) {
      var st = info.entry.stats || {}, bits = [];
      if (st.Defense) bits.push("DEF " + parseInt(st.Defense, 10));
      if (st.Vitality) bits.push("VIT " + parseInt(st.Vitality, 10));
      if (st.Initiative) bits.push("INIT " + st.Initiative);
      return bits.join(" · ");
    }
    if (line.kind === "threat" && line.block) {
      var b = line.block, out = [];
      if (typeof b.defense === "number") out.push("DEF " + b.defense);
      if (typeof b.vitality === "number") out.push("VIT " + b.vitality);
      var m = typeof b.initMod === "number" ? b.initMod : (b.init | 0);
      out.push("INIT " + EN.engine.fmtMod(m));
      return out.join(" · ");
    }
    if (line.kind === "hazard" && hazardsReady() && typeof EN.gmHazards.atGrade === "function") {
      var h = null;
      try { h = EN.gmHazards.atGrade(line.hazard, line.grade); } catch (e) { h = null; }
      if (!isObj(h)) return "";
      var hb = [];
      if (typeof h.dc === "number") hb.push("DC " + h.dc);
      if (isObj(h.bite) && h.bite.dice) hb.push(String(h.bite.dice));
      return hb.join(" · ");
    }
    return "";
  }

  function lineCard(line, crew) {
    var i = lineInfo(line);
    var left = [el("span", { style: { fontWeight: 600 }, text: line.name })];
    if (line.kind === "hazard") left.push(chip("HAZARD · G" + i.grade, "var(--warn)"));
    else if (i.grade) {
      left.push(chip("G" + i.grade + " " + String(i.desName).toUpperCase() + (i.roleName ? " · " + String(i.roleName).toUpperCase() : ""), "var(--danger)"));
      var bd = bandOf(i.grade, crew.caliber);
      left.push(chip(bd.label, bd.color, bd.tip));
    }
    if (line.kind === "threat") left.push(chip("BUILT"));
    // a Species Template laid over the block (the Bestiary's People cards, People's PROMOTE): the Table chip names it too
    if (line.kind === "threat" && isObj(line.block) && line.block.species) left.push(chip(String(line.block.species).toUpperCase() + " TEMPLATE"));
    var sl = statLine(line, i);
    if (sl) left.push(el("span.help", { text: sl }));

    // each field reads and writes its line by id, so a redraw around it finds the same line
    function setter(k) { return function (v) { var l = lineById(line.lineId); if (l) l[k] = v; }; }
    function getter(k) { return function () { var l = lineById(line.lineId); return l ? l[k] : null; }; }
    var xpNode = line.kind === "hazard"
      ? numIn(line.xpEach, 0, "XP for one", "xp:" + line.lineId, setter("xpEach"), getter("xpEach"))
      : el("span.mono", { style: { fontSize: "13px", lineHeight: "38px" }, text: fmtXp(i.xpEach) });
    var right = [
      mini("COUNT", numIn(line.count, 1, "How many", "count:" + line.lineId, setter("count"), getter("count"))),
      mini("ROUND", numIn(line.wave, 1, "Arrival round (1 is the start)", "wave:" + line.lineId, setter("wave"), getter("wave"))),
      mini("XP EACH", xpNode),
      mini("TOTAL", el("span.mono", { style: { fontSize: "13px", lineHeight: "38px", color: "var(--accent)" }, text: fmtXp(line.count * i.xpEach) }))
    ];
    if (line.kind === "hazard") {
      right.unshift(mini("GRADE", select([1, 2, 3, 4, 5].map(function (n) { return { value: n, label: "G" + n }; }), line.grade, function (v) {
        var l = lineById(line.lineId);
        if (!l) return;
        l.grade = clampGrade(v) || l.grade;
        // a band the book prices moves with the Grade; a price the GM typed for a free band stays
        var np = priceHazard(l.hazard, l.grade);
        if (np > 0 || !l.xpEach) l.xpEach = np;
      }, { minWidth: "64px" })));
    }
    var btns = [];
    if (line.kind === "bestiary" && i.entry && EN.gmView && EN.gmView.handoff) {
      btns.push(el("button.btn.sm", { title: "Open this entry in the Bestiary",
        onclick: function () { EN.gmView.handoff("bestiary", { query: line.name }); } }, "VIEW"));
    }
    btns.push(el("button.btn.sm", { title: "Remove this line", onclick: function () {
      _s.plan.lines = _s.plan.lines.filter(function (l) { return l.lineId !== line.lineId; });
      EN.app.render();
    } }, "✕"));
    right.push(el("div.row", { style: { gap: "6px", alignSelf: "flex-end" } }, btns));

    var kids = [el("div.row.between.wrap", { style: { gap: "10px", alignItems: "center" } }, [
      el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline", flex: "1 1 220px", minWidth: "0" } }, left),
      el("div.row.wrap", { style: { gap: "8px", alignItems: "stretch" } }, right)
    ])];
    if (line.note) kids.push(help(line.note, { margin: "6px 0 0", fontStyle: "italic" }));
    if (i.missing) {
      kids.push(help(line.kind === "bestiary"
        ? "Not in the Bestiary under this name, so it cannot be priced or run. Add the entry again from the picker."
        : "This line has no statblock, so it cannot be priced or run.", { margin: "6px 0 0", color: "var(--warn)" }));
    }
    return el("div.feature", { style: { borderLeftColor: line.kind === "hazard" ? "var(--warn)" : "var(--danger)" } }, kids);
  }

  function linesPanel(plan, crew) {
    var kids = [];
    if (!plan.lines.length) {
      kids.push(muted("No lines yet. Add threats and hazards below, or load one of the book's worked examples under Plans."));
    } else {
      var waves = [];
      plan.lines.forEach(function (l) { if (waves.indexOf(l.wave) === -1) waves.push(l.wave); });
      waves.sort(function (a, b) { return a - b; });
      waves.forEach(function (w) {
        var ls = plan.lines.filter(function (l) { return l.wave === w; });
        if (waves.length > 1) {
          var xp = ls.reduce(function (a, l) { return a + l.count * lineInfo(l).xpEach; }, 0);
          kids.push(EN.ui.sectionTitle((w === 1 ? "Round 1, at the start" : "Round " + w + ", arriving") + " · " + fmtXp(xp) + " XP"));
        }
        ls.forEach(function (l) { kids.push(lineCard(l, crew)); });
      });
    }
    kids.push(EN.ui.sectionTitle("Add a line"));
    var tabs = [["bestiary", "BESTIARY"], ["saved", "SAVED THREATS"], ["build", "QUICK BUILD"], ["hazard", "HAZARD"]];
    kids.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "10px" } }, tabs.map(function (t) {
      return el("span.chip" + (_s.adder === t[0] ? ".on" : ""), { style: { cursor: "pointer", fontSize: "10.5px" },
        onclick: function () { _s.adder = t[0]; EN.app.render(); } }, t[1]);
    })));
    if (_s.adder === "saved") kids.push(savedAdder());
    else if (_s.adder === "build") kids.push(buildAdder(crew));
    else if (_s.adder === "hazard") kids.push(hazardAdder(crew));
    else kids.push(bestiaryAdder(crew));
    var n = plan.lines.reduce(function (a, l) { return a + l.count; }, 0);
    return EN.ui.panel("Lines", plural(plan.lines.length, "LINE") + " · " + n + " IN ALL · " + fmtXp(spentOf(plan)) + " XP", kids);
  }

  function pickRow(name, sub, chips, onAdd) {
    return el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)" } }, [
      el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline", flex: "1 1 200px", minWidth: "0" } },
        [el("span", { style: { fontWeight: 600 }, text: name }), el("span.help", { style: { margin: 0 }, text: sub })].concat(chips || [])),
      el("button.btn.sm", { onclick: onAdd }, "+ ADD")
    ]);
  }

  /* The Bestiary picker. Filtered to the working band by default (within one
     Grade of the crew's Caliber), because the book says the budget is only
     honest inside it; the GM can switch that off to reach every Grade. */
  function bestiaryAdder(crew) {
    var B = EN.bestiary;
    if (!B || !Array.isArray(B.entries)) return muted("Bestiary data did not load.");
    var cats = [{ key: "all", name: "All" }].concat(B.categories || []);
    var wrap = el("div");
    wrap.appendChild(el("div.row.wrap", { style: { gap: "6px", marginBottom: "8px" } }, cats.map(function (c) {
      var n = c.key === "all" ? B.entries.length : B.entries.filter(function (e) { return e.category === c.key; }).length;
      return el("span.chip" + (_s.cat === c.key ? ".on" : ""), { style: { cursor: "pointer", fontSize: "10.5px" },
        onclick: function () { _s.cat = c.key; EN.app.render(); } }, c.name + " (" + n + ")");
    })));
    wrap.appendChild(el("div.row.wrap", { style: { gap: "6px", marginBottom: "8px" } }, [
      el("span.chip" + (_s.inBand ? ".on" : ""), { style: { cursor: "pointer", fontSize: "10.5px" },
        title: (book().composition || {}).workingBand || "",
        onclick: function () { _s.inBand = !_s.inBand; EN.app.render(); } },
        "WITHIN ONE GRADE OF CALIBER " + crew.caliber)
    ]));
    // a scroll well, so 48 entries do not push the rest of the page away; the
    // app keeps a .feature-scroll's position across its re-renders
    var list = el("div.enc-bpick.feature-scroll", { style: { maxHeight: "360px" } });
    wrap.appendChild(el("input", { type: "text", value: _s.q, placeholder: "search by name or identity",
      style: { width: "100%", marginBottom: "8px" },
      oninput: function (ev) {
        _s.q = ev.target.value;
        // a local re-render, because a full one would steal focus mid-word
        EN.ui.clear(list);
        listInto(list);
      } }));
    wrap.appendChild(list);
    listInto(list);
    return wrap;

    function listInto(host) {
      var q = (_s.q || "").replace(/^\s+|\s+$/g, "").toLowerCase();
      var rows = B.entries.filter(function (e) {
        if (_s.cat !== "all" && e.category !== _s.cat) return false;
        if (_s.inBand && Math.abs((e.grade || 0) - crew.caliber) > 1) return false;
        if (q && ((e.name || "") + " " + (e.identity || "")).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      if (!rows.length) {
        host.appendChild(help(_s.inBand ? "Nothing here within the working band. Switch the band filter off to see every Grade." : "Nothing matches."));
        return;
      }
      rows.forEach(function (e) {
        // only an entry outside the band says so; inside it is the default and would be noise
        var bd = bandOf(e.grade, crew.caliber);
        host.appendChild(pickRow(e.name,
          "G" + e.grade + " " + (e.designation || "") + (e.role ? ", " + e.role : "") + " · " + fmtXp(EN.gmEngine.xpOf(e)) + " XP",
          bd.key === "band" ? null : [chip(bd.label, bd.color, bd.tip)],
          function () {
            var l = addLine(bestiaryLine(e.name, 1));
            toast(e.name + " added" + (l.count > 1 ? " (" + l.count + " on that line)." : "."));
            EN.app.render();
          }));
      });
    }
  }

  function savedAdder() {
    var list = gm.savedThreats();
    if (!list.length) return muted("No saved threats. Build one on the Threats tab and press SAVE STATBLOCK, or use the quick build here.");
    return el("div", null, list.map(function (t) {
      var b = t.block || {};
      return pickRow(b.name || "Unnamed threat",
        "G" + b.grade + " " + (b.designationName || "") + (b.roleName ? ", " + b.roleName : "") + " · " + fmtXp(EN.gmEngine.xpOf(b)) + " XP",
        null,
        function () {
          addLine(normLine({ kind: "threat", name: b.name || "Unnamed threat", block: copy(b),
                             inputs: isObj(t.inputs) ? copy(t.inputs) : undefined, count: 1, xpEach: EN.gmEngine.xpOf(b) }));
          toast((b.name || "Threat") + " added.");
          EN.app.render();
        });
    }));
  }

  // the compact builder: the same resolver as the Threats tab, Grade, Designation and Role only
  function buildAdder(crew) {
    var T = EN.threats;
    var g = _s.b.grade || crew.caliber;
    var des = _s.b.designation, rol = _s.b.role;
    var dn = desName(des), rn = ((T.roles || []).filter(function (r) { return r.key === rol; })[0] || {}).name || "";
    var inputs = { name: _s.b.name || (dn + " " + rn).replace(/\s+$/, ""), grade: g, designation: des, role: rol };
    var block = EN.gmEngine.buildThreat(inputs);
    var kids = [];
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
      // redrawn around as it is typed, so + ADD carries the name; never at the blur (F19, see retype)
      field("Name", el("input", { type: "text", value: _s.b.name, placeholder: inputs.name, style: { width: "160px" },
        dataset: { enc: "b-name" },
        oninput: function (e) { _s.b.name = e.target.value; retype(e.target); } })),
      field("Grade", select(T.grades.map(function (x) { return { value: x.g, label: "G" + x.g }; }), g, function (v) { _s.b.grade = Number(v); })),
      field("Designation", select(T.designations.map(function (d) { return { value: d.key, label: d.name }; }), des, function (v) { _s.b.designation = v; })),
      field("Role", select(T.roles.map(function (r) { return { value: r.key, label: r.name }; }), rol, function (v) { _s.b.role = v; }))
    ]));
    if (block) {
      kids.push(help(block.identity + " DEF " + block.defense + " · VIT " + block.vitality + " · INIT " + EN.engine.fmtMod(block.initMod) +
                     " · DC " + block.saveDC + " · " + fmtXp(block.xp) + " XP", { margin: "8px 0 0" }));
    }
    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "10px" } }, [
      el("button.btn.sm.primary", { onclick: function () {
        var b = EN.gmEngine.buildThreat(inputs);
        if (!b) return;
        addLine(normLine({ kind: "threat", name: b.name, block: b, inputs: copy(inputs), count: 1, xpEach: b.xp }));
        toast(b.name + " added.");
        EN.app.render();
      } }, "+ ADD LINE")
    ]));
    kids.push(help("The Threats tab builds the same block with its saves and abilities; this adds it to the plan as it stands."));
    return el("div", null, kids);
  }

  function hazardAdder(crew) {
    if (!hazardsReady()) return muted("The Hazards module is not loaded here, so a hazard cannot be priced from this tab.");
    var all = [];
    try { all = EN.gmHazards.all() || []; } catch (e) { all = []; }
    all = all.filter(isObj);
    if (!all.length) return muted("No hazards in the library yet.");
    var hz = all.filter(function (h) { return h.key === _s.hz.key; })[0] || all[0];
    var g = _s.hz.grade || crew.caliber;
    var xp = priceHazard(hz, g);
    var kids = [];
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
      field("Hazard", select(all.map(function (h) { return { value: h.key, label: h.name + (h.source === "custom" ? " (custom)" : "") }; }),
        hz.key, function (v) { _s.hz.key = v; }, { minWidth: "180px" })),
      field("Grade", select([1, 2, 3, 4, 5].map(function (n) { return { value: n, label: "G" + n }; }), g, function (v) { _s.hz.grade = Number(v); }))
    ]));
    var sl = statLine({ kind: "hazard", hazard: hz, grade: g }, {});
    kids.push(help((sl ? sl + " · " : "") + (xp ? fmtXp(xp) + " XP" : "Priced at nothing: flavor, unless you enter XP on the line."), { margin: "8px 0 0" }));
    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "10px" } }, [
      el("button.btn.sm.primary", { onclick: function () {
        addLine(normLine({ kind: "hazard", name: hz.name || "Hazard", hazard: copy(hz), grade: g, count: 1, xpEach: xp }));
        toast((hz.name || "Hazard") + " added.");
        EN.app.render();
      } }, "+ ADD LINE")
    ]));
    var HB = EN.gmBook && EN.gmBook.hazards;
    if (HB && HB.pricing) kids.push(help(HB.pricing.text));
    return el("div", null, kids);
  }

  /* ---- composition -------------------------------------------------------------
     The book's composition rules as WARNINGS ONLY, never a block. Where a rule
     carries a `check` the app evaluates it; where it cannot (who wants melee)
     the rule is shown as text to check by eye.

     Two readings are the app's. COUNTS ARE PER ARRIVAL ROUND: the book's own
     remedy for too many actors or too many Minions is a second wave, so a wave
     that arrives later is counted on its own. The GM knows how many of the
     first wave are still standing; the app does not. THE SPINE is any Elite or
     Solo, or a Controller, Deadshot or Support: the book names the Elite
     calling targets, the Controller reshaping the room and the Deadshot
     upstairs, and its own worked example leans on a Shotcaller (a Support). */
  function compositionPanel(plan, crew) {
    var C = book().composition;
    var hc = crew.headcount, cal = crew.caliber;
    var threats = plan.lines.filter(function (l) { return l.kind !== "hazard"; });
    var waves = Object.create(null);
    threats.forEach(function (l) {
      var i = lineInfo(l);
      var w = own(waves, l.wave) ? waves[l.wave] : (waves[l.wave] = { minion: 0, other: 0 });
      if (i.des === "minion") w.minion += l.count; else w.other += l.count;
    });
    // the largest number of one kind arriving in a single round, and which round
    function peak(kind) {
      var best = { n: 0, wave: 1 };
      Object.keys(waves).forEach(function (k) { if (waves[k][kind] > best.n) best = { n: waves[k][kind], wave: Number(k) }; });
      return best;
    }
    var warns = [], fine = [], eye = [];
    C.rules.forEach(function (r) {
      var ck = r.check;
      if (ck && ck.per === "freelancer" && (ck.counts === "nonminion" || ck.counts === "minion") && typeof ck.max === "number") {
        if (!hc || !threats.length) return;
        var pk = peak(ck.counts === "minion" ? "minion" : "other"), cap = ck.max * hc;
        if (pk.n > cap) {
          warns.push({ r: r, msg: pk.n + (ck.counts === "minion" ? " Minions" : " non-Minion threats") + " arrive in round " + pk.wave +
                       " against a ceiling of " + cap + " for " + plural(hc, "Freelancer") + "." });
        } else fine.push(r);
      } else if (ck && ck.counts === "grade" && typeof ck.max === "number") {
        if (!threats.length) return;
        var off = threats.filter(function (l) { var g = lineInfo(l).grade; return g && Math.abs(g - cal) > ck.max; });
        if (off.length) {
          warns.push({ r: r, msg: off.map(function (l) { var g = lineInfo(l).grade; return l.name + " (G" + g + ", " + bandOf(g, cal).label.toLowerCase() + ")"; }).join(", ") +
                       (off.length === 1 ? " sits" : " sit") + " outside Caliber " + cal + "'s working band." });
        } else fine.push(r);
      } else if (r.key === "spine") {
        if (!threats.length) return;
        var sp = threats.filter(function (l) {
          var i = lineInfo(l);
          return i.des === "elite" || i.des === "solo" || i.role === "controller" || i.role === "deadshot" || i.role === "support";
        });
        if (sp.length) fine.push(r);
        else warns.push({ r: r, msg: "Nothing in the plan is an Elite or a Solo, a Controller, a Deadshot or a Support." });
      } else if (r.key === "reinforcements") {
        if (plan.lines.some(function (l) { return l.wave > 1; })) {
          eye.push({ r: r, msg: "Later waves are already counted in the budget above." });
        }
      } else {
        eye.push({ r: r });
      }
    });

    var kids = [];
    if (!threats.length) kids.push(help("Add threats and the rules below are checked as you go."));
    warns.forEach(function (w) {
      kids.push(el("div.feature", { style: { borderLeftColor: "var(--warn)" } }, [
        el("p", { style: { margin: 0, color: "var(--warn)", fontWeight: 600 }, text: w.r.name }),
        el("p", { style: { margin: "3px 0 0" }, text: w.msg }),
        help(w.r.text, { margin: "3px 0 0" })
      ]));
    });
    if (fine.length) {
      kids.push(help("Checked and fine: " + fine.map(function (r) { return r.name; }).join("; ") + ".", { color: "var(--success)" }));
    }
    eye.forEach(function (x) {
      var p = el("p.help", { style: { margin: "6px 0 0" } }, [
        el("span", { style: { fontWeight: 600, color: "var(--text2)" }, text: x.r.name + ". " }),
        document.createTextNode(x.msg ? x.msg + " " + x.r.text : x.r.text)
      ]);
      kids.push(p);
    });
    // the hazard count, read off the book's seasoning line
    var HB = EN.gmBook && EN.gmBook.hazards;
    var seasoning = HB && HB.setPieces && HB.setPieces.guidance;
    var nHz = plan.lines.filter(function (l) { return l.kind === "hazard"; }).reduce(function (a, l) { return a + l.count; }, 0);
    if (seasoning && nHz) {
      var reads = (seasoning.perFight || []).filter(function (x) { return x.count === nHz; })[0];
      kids.push(help(plural(nHz, "hazard") + ": " + (reads ? "the book reads that as " + reads.reads + "." : seasoning.text), { margin: "8px 0 0" }));
    }
    if (C.guidance) {
      kids.push(fold("comp-guidance", C.guidance.name, function () { return [help(C.guidance.text, { margin: 0 })]; }));
    }
    kids.push(help("Warnings only. Nothing here stops a plan from running.", { margin: "6px 0 0", fontStyle: "italic" }));
    return EN.ui.panel("Composition", warns.length ? plural(warns.length, "WARNING") : "NO WARNINGS", kids);
  }

  /* ---- objective -------------------------------------------------------------- */
  function objectivePanel(plan, crew) {
    var O = book().objectives, X = book().xp;
    var ob = plan.objective;
    var cur = objType(ob.key);
    var kids = [];
    kids.push(field("Objective", select([{ value: "", label: "No objective" }].concat(objTypes().map(function (t) { return { value: t.key, label: t.name }; })),
      ob.key || "", function (v) { _s.plan.objective.key = objType(v) ? v : null; }, { minWidth: "160px" })));
    if (cur) {
      kids.push(el("p", { style: { margin: "8px 0 0", fontSize: "13.5px" } }, [
        el("span", { style: { fontWeight: 600 }, text: cur.name + " " }), document.createTextNode(cur.text)
      ]));
    }
    var mod = (O.modifiers || [])[0];
    if (mod) {
      kids.push(el("label", { style: { display: "flex", gap: "8px", alignItems: "center", marginTop: "10px", cursor: "pointer" } }, [
        el("input", { type: "checkbox", checked: ob.aliveOnly,
          onchange: function (e) { _s.plan.objective.aliveOnly = !!e.target.checked; EN.app.render(); } }),
        el("span", { text: mod.name })
      ]));
      if (ob.aliveOnly) {
        var idx = DIFFS.indexOf(plan.difficulty) + (mod.steps || 1);
        var up = diffOf(DIFFS[idx]);
        kids.push(help(mod.text + " " + (up
          ? "Set as " + diffName(plan.difficulty) + ", it reads as " + up.name + ": " + fmtXp(EN.gmEngine.budget(crew.caliber, crew.headcount, up.key)) + " XP."
          : diffName(plan.difficulty) + " is already the top row."), { color: "var(--gold)" }));
      }
    }
    var aw = X && X.objectiveAward;
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "10px" } }, [
      // typed fields repaint in place, never re-render (F19, see paintPlan)
      field("Objective XP", el("input", { type: "number", min: "0", value: ob.awardXp ? String(ob.awardXp) : "", placeholder: "0",
        style: { width: "90px" },
        oninput: function (e) { _s.plan.objective.awardXp = Math.max(0, Math.floor(Number(e.target.value)) || 0); paintPlan(); } })),
      field("Note", el("input", { type: "text", value: ob.note, placeholder: "what winning looks like tonight",
        style: { width: "100%" },
        oninput: function (e) { _s.plan.objective.note = e.target.value; paintPlan(); } }), { margin: 0, flex: "1 1 180px", minWidth: "0" })
    ]));
    if (aw) kids.push(help("On top of the defeated threats: " + aw.minText + ", " + aw.maxText + "."));
    kids.push(fold("obj-ref", "Objectives, payout and bounties", function () {
      var out = [help(O.intro, { margin: "0 0 6px" }), help(O.payout, { margin: "0 0 6px" })];
      if (O.bounties) out.push(el("p.help", { style: { margin: 0 } }, [
        el("span", { style: { fontWeight: 600, color: "var(--text2)" }, text: O.bounties.name + ". " }),
        document.createTextNode(O.bounties.text)]));
      return out;
    }));
    return EN.ui.panel("Objective", cur ? cur.name.toUpperCase() + (ob.aliveOnly ? " · ALIVE" : "") : "NONE", kids);
  }

  /* ---- site and room -------------------------------------------------------------- */
  function sitePanel(plan, crew) {
    var B = book(), S = B.security;
    var t = tierOf(plan.site.tier);
    var kids = [];
    var row = [field("Security Response", select([{ value: "", label: "None (no owner)" }].concat(S.tiers.map(function (x) { return { value: x.key, label: x.site }; })),
      plan.site.tier || "", function (v) { _s.plan.site.tier = tierOf(v) ? v : null; _s.plan.site.rounds = null; }, { minWidth: "200px" }))];
    if (t) {
      var opts = [{ value: "", label: "Roll in the window" }];
      for (var n = t.roundsMin; n <= t.roundsMax; n++) opts.push({ value: n, label: plural(n, "round") });
      row.push(field("Site Grade", select([1, 2, 3, 4, 5].map(function (g) { return { value: g, label: "G" + g }; }), plan.site.grade || crew.caliber,
        function (v) { _s.plan.site.grade = clampGrade(v); })));
      row.push(field("Clock starts at", select(opts, plan.site.rounds || "", function (v) { _s.plan.site.rounds = int(v, 1, null); })));
    }
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, row));
    if (t) {
      kids.push(el("div.feature", { style: { borderLeftColor: t.follows ? "var(--danger)" : "var(--accent)", marginTop: "10px" } }, [
        el("p", { style: { margin: 0 } }, [el("span", { style: { fontWeight: 600 }, text: "Arrives in " + t.arrives + ". " }), document.createTextNode(t.looksLike)])
      ]));
    }
    kids.push(help(S.intro, { margin: "8px 0 0" }));

    kids.push(EN.ui.sectionTitle("Dress the room"));
    if (B.room.intro) kids.push(help(B.room.intro, { margin: "0 0 6px" }));
    roomRules().forEach(function (r) {
      var on = own(plan.room, r.key);
      kids.push(el("label", { style: { display: "flex", gap: "8px", alignItems: "flex-start", margin: "6px 0 0", cursor: "pointer" } }, [
        el("input", { type: "checkbox", checked: on, style: { marginTop: "3px" },
          onchange: function (e) {
            if (e.target.checked) _s.plan.room[r.key] = true; else delete _s.plan.room[r.key];
            EN.app.render();
          } }),
        el("span", { style: { fontSize: "13px", color: on ? "var(--text)" : "var(--text2)" } }, [
          el("span", { style: { fontWeight: 600 }, text: r.name + ": " }), document.createTextNode(r.text)
        ])
      ]));
    });
    kids.push(spacer(8));
    if (B.openings) {
      kids.push(fold("openings", B.openings.name, function () {
        return (B.openings.paragraphs || []).map(function (p) { return help(p, { margin: "0 0 6px" }); });
      }));
    }
    if (B.ending) kids.push(fold("ending", B.ending.name, function () { return [help(B.ending.text, { margin: 0 })]; }));
    kids.push(fold("security-more", "When the clock runs", function () {
      var out = [help(S.closing, { margin: "0 0 6px" })];
      ((S.escalation && S.escalation.other) || []).forEach(function (x) { out.push(help("On a Critical Failure: " + x, { margin: 0 })); });
      return out;
    }));
    var ticked = roomRules().filter(function (r) { return own(plan.room, r.key); }).length;
    return EN.ui.panel("Site and Room", (t ? t.name.toUpperCase() + " SITE" : "NO RESPONSE") + " · " + ticked + " / " + roomRules().length + " DRESSED", kids);
  }

  /* ---- plans and templates -------------------------------------------------------- */
  function plansPanel(plan) {
    var saved = gm.list("encounters");
    var enc = gm.get().encounter;
    var dirty = unsaved(plan);
    var kids = [];
    function loader(key, label, make, what) {
      if (!dirty) return el("button.btn.sm", { onclick: function () { loadPlan(make(), what); } }, label);
      return EN.ui.armButton(key, { label: label, armedLabel: "DISCARD CHANGES?",
        armedTitle: "Loads this plan. Unsaved changes to the plan above are lost.",
        onConfirm: function () { loadPlan(make(), what); } });
    }
    if (!saved.length) kids.push(help("No saved plans yet. SAVE PLAN keeps the one above."));
    saved.forEach(function (rec) {
      var p = normPlan(copy(rec));
      var c = crewNow(p);
      var isCur = plan.id === rec.id, running = enc.sourceId === rec.id;
      kids.push(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" } }, [
        el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline", flex: "1 1 220px", minWidth: "0" } }, [
          el("span", { style: { fontWeight: 600, color: isCur ? "var(--accent)" : "var(--text)" }, text: p.name || "Untitled encounter" }),
          el("span.help", { style: { margin: 0 }, text: diffName(p.difficulty) + " · " + plural(p.lines.length, "line") + " · " +
            fmtXp(spentOf(p)) + " of " + fmtXp(EN.gmEngine.budget(c.caliber, c.headcount, p.difficulty)) + " XP" }),
          isCur ? chip("OPEN", "var(--accent)") : null,
          running ? chip("RUNNING", "var(--success)") : null
        ]),
        el("div.row", { style: { gap: "6px" } }, [
          isCur && !dirty ? null : loader("enc:load:" + rec.id, "LOAD", function () { return normPlan(copy(gm.rec("encounters", rec.id) || rec)); },
            "Loaded: " + (p.name || "Untitled encounter") + "."),
          el("button.btn.sm", { onclick: function () {
            var dup = normPlan(copy(rec));
            dup.id = null;
            dup.name = (dup.name || "Untitled encounter") + " (copy)";
            dup.lines.forEach(function (l) { l.lineId = lineUid(); });
            var nid = gm.put("encounters", dup);
            toast(nid ? "Duplicated as " + dup.name + "." : "Could not duplicate that plan.");
            EN.app.render();
          } }, "DUPLICATE"),
          EN.ui.armButton("enc:del:" + rec.id, { label: "DELETE", armedLabel: "DELETE IT?",
            armedTitle: "Deletes this saved plan. This cannot be undone.",
            onConfirm: function () {
              gm.drop("encounters", rec.id);
              toast("Deleted: " + (p.name || "Untitled encounter") + ".");
              EN.app.render();
            } })
        ])
      ]));
    });

    kids.push(EN.ui.sectionTitle("The book's worked examples"));
    templates().forEach(function (t) {
      kids.push(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" } }, [
        el("div", { style: { flex: "1 1 220px", minWidth: "0" } }, [
          el("span", { style: { fontWeight: 600 }, text: t.name }),
          help(t.sub, { margin: "2px 0 0" })
        ]),
        loader("enc:tpl:" + t.key, "LOAD", t.make, "Loaded the book's example: " + t.name + ". Save it to keep it.")
      ]));
    });
    return EN.ui.panel("Plans", saved.length + " SAVED", kids);
  }

  /* ---- the tab -------------------------------------------------------------------- */
  var _mount = null;   // where render() last drew the tab, for retype()
  function render(mount) {
    _mount = mount;
    EN.ui.clear(mount);
    if (!_s.plan) _s.plan = blankPlan();
    var h = null;
    try { h = (EN.gmView && EN.gmView.takeHandoff) ? EN.gmView.takeHandoff("encounters") : null; } catch (e) { h = null; }
    if (!ready()) {
      mount.appendChild(el("div", null, [heading("Encounters", "// budget and build a fight"),
        muted("Encounter data did not load. Check app/data/gm_encounters.js and app/data/threats.js.")]));
      return;
    }
    if (h) intake(h);
    mount.appendChild(build());
  }
  function ready() { return !!(book() && EN.threats && EN.threats.budget && EN.gmEngine); }

  /* A KEYSTROKE IN A FIELD THE WHOLE TAB READS (F19). A line's COUNT, ROUND
     and XP EACH, the crew Headcount and the quick build's Name used to redraw
     the tab on `change`, which fires when the field blurs, at the mousedown of
     the GM's next click: the button under the pointer was swapped out before
     the mouseup and the click was lost (type a COUNT, press SAVE PLAN, nothing
     saved). Now they redraw on `input`, while the GM is still typing, and
     around the field: the tab is built afresh off-screen and swapped in node
     by node, except the field itself and the ancestors that hold it, which
     keep their place (their attributes brought up to date). So the caret and
     the typed text are untouched, a line moved to another wave by its ROUND
     moves with its field, and nothing is redrawn at the blur. When the fresh
     tree does not line up with the live one, the tab is redrawn whole, which
     is safe on a keystroke. The same helpers as Payroll's, carried here per
     the house convention. */
  function chainOf(node, top) {
    var out = [], n = node;
    while (n && n !== top) { out.unshift(n); n = n.parentNode; }
    return n === top ? out : null;
  }
  function syncAttrs(live, next) {
    var i, a;
    for (i = live.attributes.length - 1; i >= 0; i--) {
      a = live.attributes[i];
      if (!next.hasAttribute(a.name)) live.removeAttribute(a.name);
    }
    for (i = 0; i < next.attributes.length; i++) {
      a = next.attributes[i];
      if (live.getAttribute(a.name) !== a.value) live.setAttribute(a.name, a.value);
    }
  }
  // every child of `lp` but `keep` is replaced by every child of `np` but `twin`, in order
  function graft(lp, np, keep, twin) {
    var before = [], after = [], past = false;
    [].slice.call(np.childNodes).forEach(function (c) {
      if (c === twin) past = true; else if (past) after.push(c); else before.push(c);
    });
    [].slice.call(lp.childNodes).forEach(function (c) { if (c !== keep) lp.removeChild(c); });
    before.forEach(function (c) { lp.insertBefore(c, keep); });
    after.forEach(function (c) { lp.appendChild(c); });
  }
  function retype(input) {
    var key = (input && input.getAttribute) ? input.getAttribute("data-enc") : null;
    if (!key || !_mount || !document.body.contains(_mount) || !_mount.contains(input) || !ready()) { EN.app.render(); return; }
    var holder = el("div");
    holder.appendChild(build());
    // matched by comparing the attribute, so no id has to be escaped into a selector
    var twin = [].slice.call(holder.querySelectorAll("[data-enc]")).filter(function (n) { return n.getAttribute("data-enc") === key; })[0] || null;
    var live = chainOf(input, _mount), next = twin ? chainOf(twin, holder) : null;
    var fits = !!(live && next && live.length === next.length);
    for (var i = 0; fits && i < live.length; i++) if (live[i].nodeName !== next[i].nodeName) fits = false;
    if (!fits) { EN.app.render(); return; }
    var sx = window.scrollX, sy = window.scrollY;
    var lp = _mount, np = holder;
    for (var k = 0; k < live.length; k++) {
      graft(lp, np, live[k], next[k]);
      syncAttrs(live[k], next[k]);
      lp = live[k]; np = next[k];
    }
    window.scrollTo(sx, sy);
  }

  // the tab's content, built from the plan and the store: render() mounts it, retype() grafts it
  function build() {
    var plan = _s.plan;
    var crew = crewNow(plan);
    var blocks = [heading("Encounters", "// budget and build a fight")];
    var strip = undoStrip();
    if (strip) blocks.push(strip);
    if (_s.banner) {
      blocks.push(el("div.feature", { style: { borderLeftColor: "var(--accent)" } }, [
        el("div.row.between", { style: { gap: "8px", alignItems: "flex-start" } }, [
          el("p", { style: { margin: 0 }, text: _s.banner }),
          el("button.btn.sm", { onclick: function () { _s.banner = null; EN.app.render(); } }, "✕")
        ])
      ]));
    }
    blocks.push(planPanel(plan, crew));
    blocks.push(spacer());
    blocks.push(cols([crewPanel(plan, crew), budgetPanel(plan, crew)]));
    blocks.push(spacer());
    blocks.push(linesPanel(plan, crew));
    blocks.push(spacer());
    blocks.push(cols([compositionPanel(plan, crew), objectivePanel(plan, crew)]));
    blocks.push(spacer());
    blocks.push(sitePanel(plan, crew));
    blocks.push(spacer());
    _paint.plans = plansPanel(plan);
    blocks.push(_paint.plans);
    return el("div", null, blocks);
  }

  /* ==== THE TABLE EXTRA ==================================================
     Drawn under the Table's initiative order on every Table render. */

  /* ---- the Security Response clock ----------------------------------------------
     MANUAL by ruling: the GM ticks it, or switches on "follow the Table round"
     and every new round ticks it once. Escalation is the GM's button too; the
     panel lights it up when the book's trigger is met (every 3 rounds of
     continued noise) and the ALERT button covers "immediately when a Node gets
     an Alert out". One row up is the next tier in the book's order, and the
     clock STAYS AT BLACK, which the book defines no row past.

     WHAT ESCALATING DOES TO THE COUNT is the app's reading, since the page does
     not say: the new tier's window caps the rounds left (it can only bring the
     response closer, never push it away). The GM can nudge it either way. */
  function hist(c, round, text) {
    if (!Array.isArray(c.history)) c.history = [];
    c.history.push({ round: round | 0, text: text });
    if (c.history.length > 20) c.history = c.history.slice(-20);
  }
  function tick(c, n, round) {
    for (var i = 0; i < n; i++) {
      if (c.roundsLeft > 0) {
        c.roundsLeft -= 1;
        if (c.roundsLeft === 0) hist(c, round, "The response arrives.");
      }
      if (c.loud) c.loudRounds = (c.loudRounds | 0) + 1;
    }
  }
  function escalate(c, why, round) {
    var ts = tiers();
    var i = -1;
    ts.forEach(function (t, k) { if (t.key === c.tier) i = k; });
    if (i < 0 || i >= ts.length - 1) {
      c.loudRounds = 0;
      hist(c, round, "Stays at " + (ts[i] ? ts[i].name : "the top row") + " (" + why + ").");
      return false;
    }
    var nt = ts[i + 1];
    c.tier = nt.key;
    c.roundsTotal = nt.roundsMax;
    c.roundsLeft = Math.min(c.roundsLeft, nt.roundsMax);
    c.loudRounds = 0;
    hist(c, round, "Escalated to " + nt.name + " (" + why + ").");
    return true;
  }
  function clockOp(fn) {
    var enc = gm.get().encounter;
    if (!enc.clock) return;
    var c = copy(enc.clock);
    fn(c, enc.round | 0);
    gm.setClock(c);
    EN.app.render();
  }
  /* Following the Table round: each round the Table has moved on since the
     clock last looked is one tick. Written silently from inside the Table's
     render, because the Table is already drawing the result.

     ROUND 0 COUNTS AS ROUND 1 (F11). Before START ROUND 1 the Table sits at
     round 0, and the move from 0 to 1 is the fight starting, not a round
     passing. Counted as one, a clock started (and set to follow) before round
     1 lost a round the moment the fight began, so it arrived a round sooner
     than the same clock started during round 1. clockSeat() is the round a
     clock is synced to when it starts or starts following.

     A ROUND STEPPED BACK IS NOT COUNTED TWICE. The Table's PREVIOUS TURN can
     step back over the wrap; the clock keeps the highest round it has counted
     and ticks again only past it, so stepping back a round and forward again
     costs the crew no extra round. A Table back at round 0 (its last row
     removed) is a fight starting over, and the clock reseats there.

     A ROUND THE GM SETS BACK IS GIVEN BACK. SET ROUND is the GM correcting the
     counter (a typed 33 that meant 3), and keeping the highest round would
     leave the clock ARRIVED and frozen at the typo. So when the Table says the
     GM set the round (ctx.roundSet) below what the clock counted, the rounds
     it counted past the new round come back. Each follow is kept as a span
     ({from, to, took, loud}: the rounds, what it took off the count, whether
     noise was counting), so exactly what those rounds took returns, the noise
     with it, and the clock reseats at the new round. A clock from before the
     spans were kept just reseats, so it can tick again. */
  function clockSeat(round) { return Math.max(1, round | 0); }
  function spansOf(c) { return Array.isArray(c.spans) ? c.spans.filter(isObj) : []; }
  function giveBack(n, to) {
    var spans = spansOf(n), back = 0, loudBack = 0;
    for (var i = spans.length - 1; i >= 0; i--) {
      var s = spans[i], sf = Number(s.from) || 0, st = Number(s.to) || 0, took = Math.max(0, Number(s.took) || 0);
      if (st <= to) break;
      var cut = Math.max(sf, to), kept = cut - sf, past = st - cut;
      // a span's ticks take from the count first, so its last `past` rounds took what its first `kept` did not
      var b = Math.max(0, took - kept);
      back += b;
      if (s.loud) loudBack += past;
      if (kept > 0) { s.to = cut; s.took = took - b; } else spans.splice(i, 1);
    }
    n.spans = spans;
    var left = (Number(n.roundsLeft) || 0) + back;
    n.roundsLeft = Number(n.roundsTotal) > 0 ? Math.min(Number(n.roundsTotal), left) : left;
    n.loudRounds = Math.max(0, (n.loudRounds | 0) - loudBack);
    n.syncedRound = to;
    hist(n, to, "Round set back to " + to + (back ? ": " + plural(back, "round") + " given back." : "."));
  }
  function syncClock(enc, set) {
    var c = enc && enc.clock;
    if (!c || !c.started || !c.followRound) return;
    // a clock synced to round 0 before this rule reads as synced to round 1 too
    var r = clockSeat(enc.round), from = clockSeat(c.syncedRound);
    if (r === from) return;
    var n = copy(c);
    if (r < from && (enc.round | 0) > 0) {
      // PREVIOUS TURN: already counted, nothing to do. SET ROUND to this round: given back.
      if (!isObj(set) || (set.to | 0) !== (enc.round | 0)) return;
      giveBack(n, r);
    } else {
      if (r > from) {
        var left = Number(n.roundsLeft) || 0;
        tick(n, r - from, r);
        n.spans = spansOf(n).concat([{ from: from, to: r, took: left - (Number(n.roundsLeft) || 0), loud: !!n.loud }]).slice(-20);
      } else n.spans = [];   // back at round 0: the fight starts over
      n.syncedRound = r;
    }
    gm.setClock(n, { silent: true });
  }

  function clockBlock(enc) {
    var c = enc.clock, S = book().security;
    var t = tierOf(c.tier) || tiers()[0];
    var every = (S.escalation && S.escalation.everyRounds) || 3;
    var ts = tiers(), top = ts.length && ts[ts.length - 1].key === c.tier;
    var kids = [EN.ui.sectionTitle("Security Response")];
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "baseline" } }, [
      chip(t.name.toUpperCase() + " · SITE G" + (c.grade || 1), t.follows ? "var(--danger)" : "var(--accent)"),
      el("span.mono", { style: { fontSize: "15px", color: !c.started ? "var(--text3)" : c.roundsLeft <= 0 ? "var(--danger)" : "var(--text)" },
        text: !c.started ? "NOT STARTED" : c.roundsLeft <= 0 ? "ARRIVED" : plural(c.roundsLeft, "ROUND") + " LEFT" })
    ]));
    if (!c.started) {
      kids.push(help(S.start, { margin: "6px 0 0" }));
      kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
        el("button.btn.sm.primary", { onclick: function () {
          clockOp(function (k, round) {
            k.started = true;
            k.syncedRound = clockSeat(round);
            k.spans = [];
            hist(k, round, "Started at " + (tierOf(k.tier) || t).name + ": " + plural(k.roundsLeft, "round") + ".");
          });
          toast("The clock is running. Tell the players you started it.");
        } }, "START THE CLOCK"),
        EN.ui.armButton("enc:clockstop", { label: "NO CLOCK", armedLabel: "REMOVE IT?",
          armedTitle: "Removes the Security Response clock from this fight.",
          onConfirm: function () { gm.setClock(null); EN.app.render(); } })
      ]));
    } else {
      if (c.roundsLeft <= 0) {
        kids.push(el("div.feature", { style: { borderLeftColor: "var(--danger)", marginTop: "8px" } }, [
          el("p", { style: { margin: 0, color: "var(--danger)", fontWeight: 600 }, text: "The response is here." }),
          el("p", { style: { margin: "3px 0 0" }, text: t.looksLike })
        ]));
      } else {
        kids.push(el("div", { style: { margin: "6px 0 4px" } }, [bar((c.roundsTotal || 0) - c.roundsLeft, c.roundsTotal || 1, "var(--warn)")]));
        kids.push(help("Arriving: " + t.looksLike, { margin: "2px 0 0" }));
      }
      var noisy = c.loud && (c.loudRounds | 0) >= every;
      kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
        el("button.btn.sm", { title: "A round of the clock passes",
          onclick: function () { clockOp(function (k, round) { tick(k, 1, round); }); } }, "ROUND PASSES"),
        el("button.btn.sm", { title: "Give a round back",
          onclick: function () { clockOp(function (k) { k.roundsLeft = Math.min((k.roundsTotal || k.roundsLeft + 1), k.roundsLeft + 1); }); } }, "+1 ROUND"),
        el("button.btn.sm" + (noisy ? ".primary" : ""), {
          title: S.escalation ? S.escalation.text : "",
          onclick: function () {
            clockOp(function (k, round) { if (!escalate(k, noisy ? every + " rounds of continued noise" : "the GM's call", round)) toast("Black is the top row. The clock stays there."); });
          } }, noisy ? "ESCALATE: " + every + " ROUNDS OF NOISE" : "ESCALATE"),
        el("button.btn.sm", { title: "A Node got an Alert out: escalate at once",
          onclick: function () {
            clockOp(function (k, round) { if (!escalate(k, "a Node got an Alert out", round)) toast("Black is the top row. The clock stays there."); });
          } }, "ALERT GOT OUT")
      ]));
      kids.push(el("div.row.wrap", { style: { gap: "6px", marginTop: "8px" } }, [
        el("span.chip" + (c.followRound ? ".on" : ""), { style: { cursor: "pointer", fontSize: "10.5px" },
          title: "Each new Table round ticks the clock once",
          onclick: function () { clockOp(function (k, round) { k.followRound = !k.followRound; k.syncedRound = clockSeat(round); k.spans = []; }); } }, "FOLLOW THE TABLE ROUND"),
        el("span.chip" + (c.loud ? ".on" : ""), { style: { cursor: "pointer", fontSize: "10.5px" },
          title: "Rounds count toward escalation while the noise continues",
          onclick: function () { clockOp(function (k) { k.loud = !k.loud; }); } }, "NOISE CONTINUES")
      ]));
      kids.push(help(c.loud
        ? (c.loudRounds | 0) + " of " + every + " rounds of continued noise toward the next row."
        : "Quiet: rounds do not count toward escalation.", { margin: "6px 0 0" }));
      if (top) kids.push(help("Black is the top row, and the clock stays there.", { color: "var(--danger)" }));
      kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
        EN.ui.armButton("enc:clockstop", { label: "STOP THE CLOCK", armedLabel: "STOP IT?",
          armedTitle: "Removes the Security Response clock from this fight.",
          onConfirm: function () { gm.setClock(null); EN.app.render(); } })
      ]));
    }
    var hs = (c.history || []).slice(-5);
    if (hs.length) {
      kids.push(el("div", { style: { marginTop: "8px" } }, hs.map(function (x) {
        return el("p.help", { style: { margin: "1px 0" }, text: (x.round ? "Round " + x.round + ": " : "") + x.text });
      })));
    }
    return el("div", null, kids);
  }

  /* The Table round a plan's round 1 fell on (run.startRound, F1): 1 for a
     plan that started the fight, or for one run before this was recorded. */
  function runStart(rec) {
    var s = (rec && isObj(rec.run)) ? Math.floor(Number(rec.run.startRound)) : 1;
    return isFinite(s) && s >= 1 ? s : 1;
  }
  // the Table round a plan's arrival round `wave` falls on
  function tableRoundOf(rec, wave) { return runStart(rec) + wave - 1; }

  /* BRING IN: one later wave of the running plan onto the Table, numbered on
     from what is already there, with its hazards starting this round. The plan
     remembers which waves are in (its `run`), so the button becomes a mark. */
  function bringIn(planId, wave) {
    var rec = gm.rec("encounters", planId);
    if (!rec) return;
    var enc = gm.get().encounter;
    var res = addWave(normPlan(copy(rec)), wave, Math.max(1, enc.round | 0));
    var p2 = copy(gm.rec("encounters", planId));
    p2.run = isObj(p2.run) ? p2.run : { at: Date.now(), waves: [1], startRound: 1 };
    if (!Array.isArray(p2.run.waves)) p2.run.waves = [1];
    if (p2.run.waves.indexOf(wave) === -1) p2.run.waves.push(wave);
    gm.put("encounters", p2, { silent: true });
    var msg = "Round " + tableRoundOf(rec, wave) + " is in: " + plural(res.threats, "threat") + (res.hazards ? ", " + plural(res.hazards, "hazard") : "") + ".";
    if (res.skippedHz) msg += " " + plural(res.skippedHz, "hazard") + " skipped: the Hazards module is not loaded.";
    if (res.missing.length) msg += " Not found in the Bestiary: " + res.missing.join(", ") + ".";
    toast(msg);
    EN.app.render();
  }

  function planCard(enc, rec) {
    var kids = [];
    var p = rec ? normPlan(copy(rec)) : null;
    if (p) {
      var crew = crewNow(p);
      kids.push(help(diffName(p.difficulty) + " · " + fmtXp(spentOf(p)) + " XP planned · Caliber " + crew.caliber + ", " +
                     plural(crew.headcount, "Freelancer") + ".", { margin: "0 0 4px" }));
      var inWaves = (isObj(rec.run) && Array.isArray(rec.run.waves)) ? rec.run.waves : [1];
      var waves = [];
      p.lines.forEach(function (l) { if (l.wave > 1 && waves.indexOf(l.wave) === -1) waves.push(l.wave); });
      waves.sort(function (a, b) { return a - b; });
      if (waves.length) {
        kids.push(EN.ui.sectionTitle("Later waves"));
        // rounds are the Table's: a plan that joined in round 4 has its round 2 wave due in round 5 (F1)
        var joined = runStart(rec);
        waves.forEach(function (w) {
          var ls = p.lines.filter(function (l) { return l.wave === w; });
          var at = tableRoundOf(rec, w);
          var isIn = inWaves.indexOf(w) !== -1, due = (enc.round | 0) >= at;
          kids.push(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)" } }, [
            el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline", flex: "1 1 220px", minWidth: "0" } }, [
              el("span.mono", { style: { fontSize: "12px", color: due && !isIn ? "var(--warn)" : "var(--text2)" },
                title: joined > 1 ? "Round " + w + " of the plan, which joined the fight in round " + joined + "." : null,
                text: "ROUND " + at }),
              joined > 1 ? el("span.help", { style: { margin: 0 }, text: "plan round " + w }) : null,
              el("span", { text: ls.map(function (l) { return l.count + " x " + l.name; }).join(", ") }),
              due && !isIn ? chip("DUE", "var(--warn)") : null
            ]),
            isIn ? chip("IN", "var(--success)")
                 : el("button.btn.sm" + (due ? ".primary" : ""), { onclick: function () { bringIn(rec.id, w); } }, "BRING IN")
          ]));
        });
      }
      var ob = p.objective, ot = objType(ob.key);
      if (ot || ob.note || ob.aliveOnly || ob.awardXp) {
        kids.push(EN.ui.sectionTitle("Objective"));
        if (ot) kids.push(el("p", { style: { margin: 0, fontSize: "13.5px" } }, [
          el("span", { style: { fontWeight: 600 }, text: ot.name + " " }), document.createTextNode(ot.text)]));
        if (ob.note) kids.push(help(ob.note, { margin: "3px 0 0" }));
        var mod = (book().objectives.modifiers || [])[0];
        if (ob.aliveOnly && mod) kids.push(help(mod.name + ". " + mod.text, { margin: "3px 0 0", color: "var(--gold)" }));
        if (ob.awardXp) kids.push(help("Objective award: " + fmtXp(ob.awardXp) + " XP.", { margin: "3px 0 0" }));
        kids.push(help(book().objectives.payout, { margin: "3px 0 0", fontStyle: "italic" }));
      }
    }
    // its own top margin: the clock's section title is a first child, which the theme sets flush
    if (enc.clock) kids.push(el("div", { style: { marginTop: kids.length ? "16px" : "0" } }, [clockBlock(enc)]));
    if (!kids.length) return null;
    var t = enc.clock ? tierOf(enc.clock.tier) : null;
    var title = p ? (p.name || "Encounter plan") : "Security Response";
    var tag = (p ? diffName(p.difficulty).toUpperCase() : "") + (t ? (p ? " · " : "") + t.name.toUpperCase() : "");
    return EN.ui.panel(title, tag || "RUNNING", kids);
  }

  /* ---- the XP award ---------------------------------------------------------------
     Shown when the Table is empty and the fight just cleared is still in
     lastEncounter. Every threat row counts as defeated by default, because the
     book's "defeated" includes captured, routed, hacked, bypassed and talked
     down; the GM can untick one that got clean away. The objective award goes
     on top. Ruled D5: every Freelancer receives the WHOLE total, not a share.
     XP is written only to records that run XP (useXp); a milestone record is
     named and skipped. */

  /* THIS FIGHT'S AWARD, READ FROM THE LEDGER (F4, F10). AWARD XP tags each of
     its writes {source: "award", encounterAt, sourceId, jobId}, so whether the
     award stands, what it paid and to whom are read from the live writes
     tagged with this snapshot's `at`. Nothing hangs on a copy that HIDE or the
     next cleared fight can take away, and a write to a record deleted since no
     longer counts as outstanding, so UNDO AWARD can finish and AWARD XP comes
     back. An award written before writes carried a tag is still found through
     the ids its snapshot kept (xpAward.writeIds). Newest first.

     `paid` true counts the writes that came in with an imported backup too:
     that is whether the award is MADE (the card reads "Awarded" and offers no
     second AWARD XP). Without it, only the writes UNDO AWARD can take back. */
  function awardWrites(last, paid) {
    if (!isObj(last)) return [];
    var legacy = (isObj(last.xpAward) && Array.isArray(last.xpAward.writeIds)) ? last.xpAward.writeIds : [];
    return (paid ? paidWrites : liveWrites)(function (r) {
      var m = metaOf(r);
      return (m.source === "award" && !!last.at && m.encounterAt === last.at) || legacy.indexOf(r.id) !== -1;
    });
  }
  // what a standing award paid, {total, names} with the names in the order written; null when none stands
  function awardSummary(ws) {
    if (!ws.length) return null;
    var total = 0, names = [];
    ws.slice().reverse().forEach(function (w) {
      (w.ops || []).forEach(function (o) { if (o && o.op === "xp") total = Number(o.amount) || 0; });
      names.push(w.charName || "a Freelancer");
    });
    return { total: total, names: names };
  }

  /* XP PAYROLL ALREADY WROTE for this fight. SEND TO PAYROLL hands the same
     snapshot to the Payroll tab, whose CREDIT THE CREW writes the encounter's
     XP with the pay, so awarding it here as well would pay it twice. A payday's
     writes name their fight by the snapshot's `at` (meta.encounterAt; an older
     payday by its own encounterAt, or the copy of the form it keeps, and its
     writeIds). It counts while one of its XP writes is paid, by the same
     reading as the award (F10, and an imported one counts): an undone payday,
     or one whose records are all gone, frees the award again. Returns the
     newest such payday as {title, total, names, imported}, or null; `imported`
     says none of its writes can be undone here (it came in with a backup). */
  function payrollXpFor(last) {
    if (!isObj(last) || !last.at) return null;
    var pds = [];
    gm.list("ledger").forEach(function (pd) {
      if (!isObj(pd) || pd.kind !== "payday" || !pd.credited || pd.undone) return;
      var at = typeof pd.encounterAt === "number" ? pd.encounterAt
        : (isObj(pd.form) && isObj(pd.form.enc) ? pd.form.enc.at : null);
      if (at === last.at) pds.push(pd);
    });
    // the payday a write belongs to: its tag, else the older payday that kept its id
    function paydayOf(w) {
      var m = metaOf(w);
      if (typeof m.paydayId === "string" && m.paydayId) return m.paydayId;
      var pd = pds.filter(function (x) { return Array.isArray(x.writeIds) && x.writeIds.indexOf(w.id) !== -1; })[0];
      return pd ? pd.id : "";
    }
    var groups = Object.create(null), order = [];
    paidWrites(function (w) {
      var m = metaOf(w);
      if (m.source === "payday") return m.encounterAt === last.at;
      return !!paydayOf(w);
    }).forEach(function (w) {
      var xp = null;
      (w.ops || []).forEach(function (o) { if (o && o.op === "xp") xp = Number(o.amount) || 0; });
      if (xp === null) return;
      var key = paydayOf(w) || "?";
      if (!own(groups, key)) { groups[key] = { total: xp, names: [], imported: true }; order.push(key); }
      // newest first in, so each name goes in front: the names read in the order written
      groups[key].names.unshift(w.charName || "a Freelancer");
      if (!w.imported) groups[key].imported = false;
    });
    if (!order.length) return null;
    var g = groups[order[0]], rec = order[0] !== "?" ? gm.rec("ledger", order[0]) : null;
    return { title: (rec && rec.title) || "Payday", total: g.total, names: g.names, imported: g.imported };
  }

  /* HIDE IS A WAY BACK, NOT A WAY OUT (F14). A hidden card leaves this small
     line on the empty Table, and SHOW LAST FIGHT brings the card back. HIDE
     itself is armed and only offered while no award write can be undone here,
     so it can never put away the card's UNDO AWARD. */
  function showLastFight(last) {
    return el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
      el("span.help", { style: { margin: 0 }, text: "The XP award for " + (last.name || "the last fight") + " is hidden." }),
      el("button.btn.sm.ghost", { title: "Show the XP award card again", onclick: function () {
        gm.update(function (st) { if (st.lastEncounter) delete st.lastEncounter.hidden; });
        EN.app.render();
      } }, "SHOW LAST FIGHT")
    ]);
  }

  function awardCard(enc) {
    var s = gm.get(), last = s.lastEncounter;
    if (!last || (enc.entries && enc.entries.length)) return null;
    if (last.hidden) return showLastFight(last);
    if (_s.award.at !== last.at) {
      // an award already made comes back with the choices it was made with, after a reload too
      var made = isObj(last.xpAward) ? last.xpAward : null;
      _s.award = { at: last.at, skip: Object.create(null), objXp: made && typeof made.objXp === "number" ? made.objXp : null };
      ((made && Array.isArray(made.skip)) ? made.skip : []).forEach(function (id) { if (typeof id === "string") _s.award.skip[id] = true; });
    }
    var X = book().xp;
    var rec = last.sourceId ? gm.rec("encounters", last.sourceId) : null;
    var p = rec ? normPlan(copy(rec)) : null;
    var rows = (last.entries || []).filter(function (r) { return r && r.kind === "threat"; }).map(function (r) {
      return { id: r.id, name: r.name || (r.block && r.block.name) || "Threat", xp: EN.gmEngine.xpOf(r.block) };
    });
    var objDefault = p ? p.objective.awardXp : 0;
    /* Read when they are needed, never kept from the render: the Objective XP
       field repaints this card in place rather than re-rendering it (F19), so a
       click writes, copies and sends the figure the GM typed last. */
    function objNow() { return _s.award.objXp === null ? objDefault : _s.award.objXp; }
    function totalNow() {
      return rows.reduce(function (a, r) { return a + (own(_s.award.skip, r.id) ? 0 : r.xp); }, 0) + objNow();
    }
    var crew = { members: [] };
    try { crew = EN.gmEngine.crew({ encounter: last }); } catch (e) { crew = { members: [] }; }
    var roster = (EN.store.roster && EN.store.roster()) || {};
    var members = crew.members.map(function (m) {
      var ch = own(roster, m.charId) ? roster[m.charId] : null;
      return { charId: m.charId, name: m.name, useXp: !!(ch && ch.useXp) };
    });
    var xpCrew = members.filter(function (m) { return m.useXp; });
    var label = "XP award: " + (last.name || "the last encounter");
    /* the award as it stands in the ledger (F4): null when nothing of it is
       paid. An award that came in with an imported backup is made all the same
       (no second AWARD XP), but only one written here can be undone here. */
    var done = awardSummary(awardWrites(last, true));
    var canUndoAward = !!done && awardWrites(last).length > 0;
    function shown() { return done ? done.total : totalNow(); }

    function text() {
      var objXp = objNow(), out = [label];
      out.push("Defeated (" + ((X && X.defeatedIncludes) || []).join(", ") + " all count):");
      rows.forEach(function (r) { if (!own(_s.award.skip, r.id)) out.push("  " + r.name + ": " + fmtXp(r.xp)); });
      if (objXp) out.push("Objective: " + fmtXp(objXp));
      out.push("Total: " + fmtXp(totalNow()) + " XP to every Freelancer.");
      if (members.length) out.push("Crew: " + members.map(function (m) { return m.name + (m.useXp ? "" : " (milestones)"); }).join(", "));
      return out.join("\n");
    }

    var kids = [];
    if (!rows.length) kids.push(help("No threats were on the Table."));
    rows.forEach(function (r) {
      var on = !own(_s.award.skip, r.id);
      kids.push(el("label", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "3px 0", cursor: "pointer",
                                       borderBottom: "1px solid var(--border)" } }, [
        // once the award is written its choices are what was paid: UNDO AWARD to change them
        el("input", { type: "checkbox", checked: on, disabled: !!done, onchange: function (e) {
          if (e.target.checked) delete _s.award.skip[r.id]; else _s.award.skip[r.id] = true;
          EN.app.render();
        } }),
        el("span", { style: { flex: "1 1 auto", textDecoration: on ? "none" : "line-through", color: on ? "var(--text)" : "var(--text3)" }, text: r.name }),
        el("span.mono", { style: { fontSize: "12px" }, text: fmtXp(r.xp) })
      ]));
    });
    if (X && X.defeated) kids.push(help(X.defeated, { margin: "6px 0 0" }));
    var objNowXp = objNow();
    var totalEl = el("div.mono", { style: { fontSize: "22px", color: "var(--accent)" }, text: fmtXp(shown()) + " XP" });
    kids.push(el("div.row.wrap", { style: { gap: "12px", alignItems: "flex-end", marginTop: "10px" } }, [
      field("Objective XP", el("input", { type: "number", min: "0", value: objNowXp ? String(objNowXp) : "", placeholder: "0", style: { width: "90px" },
        disabled: !!done,
        oninput: function (e) { _s.award.objXp = Math.max(0, Math.floor(Number(e.target.value)) || 0); paint(); } })),
      el("div", null, [
        el("span.mono", { style: { fontSize: "10px", letterSpacing: ".1em", color: "var(--text3)" }, text: "EACH FREELANCER GETS" }),
        totalEl
      ])
    ]));
    if (X && X.text) kids.push(help(X.text, { margin: "6px 0 0" }));
    if (members.length) {
      kids.push(el("div.row.wrap", { style: { gap: "6px", marginTop: "8px" } }, members.map(function (m) {
        return chip(m.name + (m.useXp ? " · XP" : " · MILESTONES"), m.useXp ? "var(--success)" : "var(--text3)");
      })));
      var ms = members.filter(function (m) { return !m.useXp; });
      if (ms.length) kids.push(help(ms.map(function (m) { return m.name; }).join(", ") + (ms.length === 1 ? " runs" : " run") +
        " milestones, so no XP is written to " + (ms.length === 1 ? "that record." : "those records.") + (X && X.milestones ? " " + X.milestones : "")));
    } else {
      kids.push(help("No crew found: file Freelancers or pull them onto the Table to award XP."));
    }

    var paidXp = done ? null : payrollXpFor(last);
    if (done) {
      kids.push(help("Awarded " + fmtXp(done.total) + " XP to " + done.names.join(", ") + "." +
        (canUndoAward ? "" : " It came in with an imported GM backup, so it cannot be undone here."),
        { color: "var(--success)", margin: "8px 0 0" }));
    } else if (paidXp) {
      // the payday already carried this fight's XP; a second award would pay it twice
      kids.push(help("Payroll already wrote " + fmtXp(paidXp.total) + " XP for this fight to " + paidXp.names.join(", ") +
        " with the payday " + paidXp.title + "." + (paidXp.imported
          ? " That payday came in with an imported GM backup, so the XP stands as paid."
          : " Undo that payday to award the XP here instead."), { color: "var(--warn)", margin: "8px 0 0" }));
    }

    // the buttons are drawn from what the card says NOW, so a typed Objective XP redraws them in place
    var btnRow = el("div.row.wrap", { style: { gap: "8px", marginTop: "10px" } });
    function fillButtons() {
      EN.ui.clear(btnRow);
      var total = totalNow();
      var btns = [el("button.btn.sm", { onclick: function () { copyText(text(), "The XP award"); } }, "COPY")];
      if (done) {
        if (canUndoAward) btns.push(el("button.btn.sm", { onclick: function () { undoAward(); } }, "UNDO AWARD"));
      } else if (!paidXp && total > 0 && xpCrew.length) {
        btns.push(EN.ui.armButton("enc:award", { label: "AWARD XP", armedLabel: "AWARD " + fmtXp(total) + " TO " + xpCrew.length + "?",
          armedTitle: "Writes " + fmtXp(total) + " XP to each Freelancer who runs XP. UNDO AWARD reverses it.",
          onConfirm: function () { awardNow(); } }));
      }
      if (EN.gmView && EN.gmView.handoff) {
        btns.push(el("button.btn.sm", { onclick: function () {
          /* `xp` carries this card's own choices (the objective award, the threats
             unticked as not defeated), so Payroll prices the fight's XP exactly as
             this card does rather than from the bare snapshot */
          var payload = { encounter: copy(gm.get().lastEncounter),
                          xp: { objective: objNow(), skip: Object.keys(_s.award.skip) } };
          if (p && p.jobId) payload.jobId = p.jobId;
          EN.gmView.handoff("payroll", payload);
        } }, "SEND TO PAYROLL"));
      }
      // never over an UNDO AWARD (F14); an imported award has none to put away
      if (!canUndoAward) {
        btns.push(EN.ui.armButton("enc:hide", { cls: ".btn.sm.ghost", label: "HIDE", armedLabel: "HIDE IT?",
          title: "Hide this card until the next fight is cleared",
          armedTitle: "Hides this card. SHOW LAST FIGHT, left in its place on the Table, brings it back.",
          onConfirm: function () {
            gm.update(function (st) { if (st.lastEncounter) st.lastEncounter.hidden = true; });
            EN.app.render();
          } }));
      }
      btns.forEach(function (b) { btnRow.appendChild(b); });
    }
    /* AWARD XP: one tagged write per Freelancer who runs XP, at the total the
       card shows at the moment of the click. The snapshot keeps the choices it
       was made with (and, for older readers, the ids), but whether the award
       stands is always read back from the ledger. */
    function awardNow() {
      var total = totalNow(), objXp = objNow();
      var meta = { source: "award", encounterAt: last.at, sourceId: last.sourceId || null, jobId: (p && p.jobId) || null };
      var ids = [], names = [];
      xpCrew.forEach(function (m) {
        var id = gm.writeCrew(m.charId, label, [{ op: "xp", amount: total }], copy(meta));
        if (id) { ids.push(id); names.push(m.name); }
      });
      if (ids.length) {
        gm.update(function (st) {
          if (st.lastEncounter && st.lastEncounter.at === last.at) {
            st.lastEncounter.xpAward = { at: Date.now(), total: total, writeIds: ids, names: names,
                                         objXp: objXp, skip: Object.keys(_s.award.skip) };
          }
        });
      }
      var missed = xpCrew.length - ids.length;
      toast(ids.length
        ? "Wrote " + fmtXp(total) + " XP to " + names.join(", ") + "." + (missed ? " " + plural(missed, "record") + " could not be written." : "")
        : "Nothing was written: no record would take it.");
      EN.app.render();
    }
    fillButtons();
    kids.push(btnRow);
    function tagText() { return (last.name ? last.name.toUpperCase() + " · " : "") + fmtXp(shown()) + " XP EACH"; }
    var card = EN.ui.panel("XP Award", tagText(), kids);
    // F19: what reads the Objective XP, repainted where it stands while the GM types
    function paint() {
      totalEl.textContent = fmtXp(shown()) + " XP";
      var t = card.querySelector(".panel-h .tag");
      if (t) t.textContent = tagText();
      fillButtons();
    }
    return card;
  }

  /* UNDO AWARD inverts this award's live writes, newest first, for as long as
     the newest undoable write is one of them. A later write (a payday) sitting
     on top stops it, and the toast names it so the GM knows what to undo
     first. Which writes are this award's, and whether any are left, is read
     from the ledger (F4), where a write to a deleted record no longer counts
     (F10), so an award whose other records are gone finishes undoing. */
  function undoAward() {
    var mine = awardWrites(gm.get().lastEncounter);
    if (!mine.length) { toast("Nothing of this award is left to undo."); EN.app.render(); return; }
    var ids = mine.map(function (w) { return w.id; }), n = 0, u = null, failed = false;
    while ((u = gm.undoable()) && ids.indexOf(u.id) !== -1) {
      if (!gm.undoLast()) { failed = true; break; }
      n++;
    }
    var left = awardWrites(gm.get().lastEncounter);
    if (!left.length) {
      gm.update(function (st) { if (st.lastEncounter) delete st.lastEncounter.xpAward; });
      toast("Award undone: " + plural(n, "write") + " reversed.");
    } else if (failed) {
      toast((n ? "Partly undone: " + plural(n, "write") + " reversed. " : "") + "This device refused to save the next undo, so the rest of the award stands.");
    } else {
      var top = gm.undoable();
      var named = top ? " (" + (top.label || "a later write") + ")" : "";
      toast(n ? "Partly undone. A later write sits on top of the rest" + named + "; undo that first."
              : "A later write sits on top of this award" + named + ". Undo that first.");
    }
    EN.app.render();
  }

  /* TWO Table extras (gm.js's hook; ctx is {encounter, crew}, each returns a
     DOM node or null). The running plan, with its waves and clock, sits first
     under the order; the XP award for the fight just cleared sits last, after
     the Hazards module's Room tray, so the Table reads top to bottom as the
     fight, the room it is in, and then the bill. */
  function tableExtra(ctx) {
    if (!book()) return null;
    var enc = (ctx && ctx.encounter) || gm.get().encounter;
    syncClock(enc, ctx && ctx.roundSet);
    enc = gm.get().encounter;
    var rec = enc.sourceId ? gm.rec("encounters", enc.sourceId) : null;
    return planCard(enc, rec);
  }
  function awardExtra(ctx) {
    if (!book()) return null;
    return awardCard((ctx && ctx.encounter) || gm.get().encounter);
  }

  return {
    render: render, tableExtra: tableExtra, awardExtra: awardExtra,
    // read-only helpers: the worked-example templates and a plan's spend
    templates: templates, spentOf: spentOf
  };
})();

/* Looked up through the namespace on every call, so a later EN.gmEncounters is
   the one drawn. The numbers are gm.js's draw slots: the running plan at 10,
   the Hazards Room tray at 20, the XP award at 30. */
if (EN.gmView && EN.gmView.registerTableExtra) {
  EN.gmView.registerTableExtra("encounters", function (ctx) { return EN.gmEncounters.tableExtra(ctx); }, 10);
  EN.gmView.registerTableExtra("encounters:award", function (ctx) { return EN.gmEncounters.awardExtra(ctx); }, 30);
}
