/* ===========================================================================
   ELYSIUM NIGHTS · GM Payroll (Admin tab)
   Paying the crew, top to bottom in the order a payday runs: the contract
   quote off the book's Caliber by difficulty grid, bounties priced off a
   Target's XP, salvage and parts by the Grade of the kill, the split, the XP
   award and the Other Ledger, ending in a payday the GM can copy as text,
   save to the ledger, and credit to the crew's own records.

   THE BOOK IS DATA. Every band, rate, percentage and sentence of rules text
   is read from EN.gmBook.payroll (data/gm_payroll.js), and the split note from
   EN.economy; nothing here restates a number the page prints. The arithmetic
   of the split is EN.engine.splitPayout, the helper the player's SPLIT panel
   uses, so the two can never quote one payout as different shares. The crew is
   EN.gmEngine.crew() (ruling D4), so Payroll, the Encounters budget and the
   Job Board agree on who the crew is and what their Caliber is.

   RULINGS this file carries out (author, 2026-10):
     D1  a write to a player record goes through EN.gmStore.writeCrew only,
         behind an armed confirm, logged in the ledger and undoable, and the
         same content is always on offer as copyable text for the crews whose
         records live on other devices.
     D5  every Freelancer gets the full encounter XP; only records with
         useXp take it, and the milestone ones are named and skipped.
     D6  the printed band is shown and its midpoint prefilled as an editable
         total; clause shifts stack and clamp at the grid edges, with a note.
     And the defaults: bounties show the 3 to 5 range with a rate picker and
     double for alive; the Crew Kit comes off the post-fixer remainder (that
     is splitPayout's own order); the payday checklist is the book's order.

   MILESTONES (the author's quality of life pick, 2026-10). Milestone tables
   level on the book's Major and Minor Milestones, not XP, so the Milestones
   panel awards one: the two lists from Milestones and Pacing
   (EN.gmBook.payroll.milestones) or the GM's own reason, to any crew member,
   through writeCrew's milestone op. See section 8.

   AN APP READING, not book text: the fixer's cut comes off the CLIENT'S money,
   the contract and any bounties, because the page prices those as "totals,
   before the fixer's 10 to 20 percent". Salvage is the crew's own sale to a
   fence, so it splits through the same helper with no fixer, and the Crew
   Kit's percentage applies to both, since the crew votes it "of every payout".

   STATE. The form is transient (module scope), like the Threats builder's
   inputs: a half-priced payday is not worth a save slot until the GM says so.
   SAVE PAYDAY files it in the GM ledger (bag `ledger`, kind "payday") with a
   copy of the form, so OPEN can bring it back. Typing never rebuilds the
   field being typed into (retype): everything around it is redrawn and the
   field itself stays, so a half-typed "1." or a phone keyboard's composing
   word survives. A click redraws this tab locally (refresh). Because the form
   is not saved as it is typed, OPEN and a handoff from another tab ask before
   they replace changes that are not saved (dirty).

   WHAT STILL STANDS is read off the ledger's write records, never from a copy
   this tab or a snapshot holds: gmStore.paidWrites (not undone, to a record
   still on this device, imported or not) for what is already paid, the
   Table's XP award for the fight being paid and an earlier payday for the
   same fight or job, which hold CREDIT THE CREW back so nothing is paid
   twice; gmStore.liveWrites (the same, imported ones left out) for UNDO.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmPayroll = (function () {
  var el = EN.ui.el, toast = EN.ui.toast;
  var gm = EN.gmStore;
  // the currency marks the book prints: Glimmer U+1D4A2, Nexus U+25CE
  var G = "𝒢", NX = "◎", DOT = " · ";

  function P() { return (EN.gmBook && EN.gmBook.payroll) || null; }
  function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function copy(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

  /* ---- numbers and their print forms ----------------------------------- */
  // Glimmer is whole and never negative here; a blank or a typo reads as 0
  function glim(v) {
    var n = Number(String(v == null ? "" : v).replace(/,/g, ""));
    return isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  // Nexus is kept to hundredths, the way the Inventory's wallet rounds it
  function nex(v) {
    var n = Number(String(v == null ? "" : v).replace(/,/g, ""));
    return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
  }
  function commas(n) {
    n = Math.floor(Number(n) || 0);
    return (n < 0 ? "-" : "") + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function fmtG(n) { return G + commas(n); }
  function fmtNx(n) { return NX + (Math.round((Number(n) || 0) * 100) / 100); }
  function plural(n, one, many) { return n === 1 ? one : (many || one + "s"); }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function two(n) { return (n < 10 ? "0" : "") + n; }
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  // the #POST "when" field's own shape ("03:14, Tuesday", the Social tab's placeholder)
  function clock(t) { var d = new Date(t); return two(d.getHours()) + ":" + two(d.getMinutes()) + ", " + DAYS[d.getDay()]; }
  function stamp(t) {
    var d = new Date(t);
    return d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate()) + " " + two(d.getHours()) + ":" + two(d.getMinutes());
  }
  function midOf(lo, hi) { return Math.round(((Number(lo) || 0) + (Number(hi) || 0)) / 2); }

  /* ---- the form ---------------------------------------------------------
     Every typed number is kept as the string typed, so a half-typed "30" is
     not rewritten to 3 under the caret; the model parses it. Maps keyed by an
     id are null-prototype; lists of ids are plain arrays, which survive the
     JSON round trip into a saved payday unchanged. */
  var _n = 0;
  function lid(p) { _n += 1; return p + _n + Date.now().toString(36); }
  function defFixer() { var C = P() && P().contract; return C ? midOf(C.fixerPctLow, C.fixerPctHigh) : 15; }
  function defRate() { var B = P() && P().bounties; return B ? midOf(B.perXpLow, B.perXpHigh) : 4; }

  function fresh() {
    return {
      paydayId: null,              // the ledger record this form was saved to or opened from
      jobId: null, title: "",
      enc: null,                   // the encounter being paid: a lastEncounter-shaped snapshot
      hc: "", cal: "",             // crew overrides, as typed
      diff: "fair",                // the base difficulty column, before clauses
      shifts: Object.create(null), // clause key -> the step picked; absent is off
      total: null,                 // the contract total as typed, or null for the band's midpoint
      nexus: "",                   // Nexus terms, as typed
      inc: "",                     // an Incursion's rating, for the pricer
      bounties: [],                // {id, name, xp, rate, alive}
      bSrc: "encounter", bEnc: "", bBest: "", bName: "", bXp: "",
      salv: Object.create(null),   // encounter entry id -> salvage value, as typed
      salvage: [],                 // hand-entered salvage lines {id, name, value}
      sName: "", sValue: "", awValue: "", awPct: "",
      fixer: defFixer(), kit: 0,
      noXp: [],                    // encounter entry ids NOT counted as defeated
      objXp: "",
      xpAgain: false,              // write XP even though the Table already awarded this fight's (tableAward)
      cred: "", heat: "",
      stub: true,                  // send a #POST pay stub with the credit
      noCredit: [],                // charIds left out of the credit
      steps: []                    // ticked payday checklist steps, by index
    };
  }
  var _p = fresh();
  var _open = Object.create(null);   // which reference folds are open
  var _mount = null;
  var _pend = null;                  // a handoff waiting on the GM's word, because the form had unsaved changes (F18)

  /* UNSAVED CHANGES (F18). The form is compared with how it stood when it was
     last started, opened, handed in, saved or credited (_base). The picker
     selections are left out (they choose, they do not hold work), keys are
     sorted (a null-prototype map keeps insertion order), and a number and the
     same number typed as a string compare equal (a typed "15" over the default
     15 is no change). */
  var SIG_SKIP = { paydayId: true, bSrc: true, bEnc: true, bBest: true };
  function stable(v) {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (v && typeof v === "object") {
      return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + stable(v[k]); }).join(",") + "}";
    }
    if (typeof v === "number") return JSON.stringify(String(v));
    return JSON.stringify(v === undefined ? null : v);
  }
  function sigOf(p) {
    var o = Object.create(null);
    Object.keys(p).forEach(function (k) { if (!own(SIG_SKIP, k)) o[k] = p[k]; });
    return stable(o);
  }
  var _base = sigOf(_p);
  function settle() { _base = sigOf(_p); }
  function dirty() { return sigOf(_p) !== _base; }

  // a saved form comes back from storage, which an import can write, so each
  // field is taken only when it has the type this file wrote
  function restoreForm(f) {
    var p = fresh();
    if (!isObj(f)) return p;
    ["title", "hc", "cal", "diff", "nexus", "inc", "bSrc", "bEnc", "bBest", "bName", "bXp",
     "sName", "sValue", "awValue", "awPct", "objXp", "cred", "heat"].forEach(function (k) {
      if (typeof f[k] === "string") p[k] = f[k];
    });
    if (typeof f.jobId === "string" && f.jobId) p.jobId = f.jobId;
    if (typeof f.total === "string" || typeof f.total === "number") p.total = String(f.total);
    if (typeof f.fixer === "string" || typeof f.fixer === "number") p.fixer = f.fixer;
    if (typeof f.kit === "string" || typeof f.kit === "number") p.kit = f.kit;
    p.stub = f.stub !== false;
    p.xpAgain = f.xpAgain === true;
    if (isObj(f.enc) && Array.isArray(f.enc.entries)) p.enc = f.enc;
    if (isObj(f.shifts)) Object.keys(f.shifts).forEach(function (k) {
      var v = Number(f.shifts[k]);
      if (own(f.shifts, k) && isFinite(v) && v) p.shifts[k] = v;
    });
    if (isObj(f.salv)) Object.keys(f.salv).forEach(function (k) {
      if (own(f.salv, k) && typeof f.salv[k] === "string") p.salv[k] = f.salv[k];
    });
    (Array.isArray(f.bounties) ? f.bounties : []).forEach(function (b) {
      if (!isObj(b) || typeof b.id !== "string") return;
      p.bounties.push({ id: b.id, name: String(b.name || "Target"), xp: String(b.xp == null ? "" : b.xp),
                        rate: Number(b.rate) || defRate(), alive: !!b.alive });
    });
    (Array.isArray(f.salvage) ? f.salvage : []).forEach(function (s) {
      if (!isObj(s) || typeof s.id !== "string") return;
      p.salvage.push({ id: s.id, name: String(s.name || ""), value: String(s.value == null ? "" : s.value) });
    });
    ["noXp", "noCredit"].forEach(function (k) {
      (Array.isArray(f[k]) ? f[k] : []).forEach(function (v) { if (typeof v === "string") p[k].push(v); });
    });
    (Array.isArray(f.steps) ? f.steps : []).forEach(function (v) { if (typeof v === "number") p.steps.push(v); });
    return p;
  }

  /* ---- reading the book ------------------------------------------------- */
  function colList() { return P().contract.columns; }
  function colIndex(key) {
    var cs = colList();
    for (var i = 0; i < cs.length; i++) if (cs[i].key === key) return i;
    return -1;
  }
  function colName(key) { var i = colIndex(key); return i < 0 ? key : colList()[i].name; }
  function rowAt(cal) { return P().contract.rows.filter(function (r) { return r.caliber === cal; })[0] || null; }
  // by the cell's own column key, so a reordered row could not misquote; the index is the fallback
  function cellOf(row, i) {
    if (!row) return null;
    var key = colList()[i].key;
    return (row.cells || []).filter(function (c) { return c && c.col === key; })[0] || row.cells[i] || null;
  }
  function stepsOf(clause) { return Array.isArray(clause.steps) ? clause.steps : []; }
  function clauses() { var S = P().contract.shifts; return (S && S.clauses) || []; }

  // the clause shifts STACK (D6): their sum, counting only a step the clause allows
  function shiftOf(shifts) {
    var n = 0;
    clauses().forEach(function (cl) {
      if (!own(shifts, cl.key)) return;
      var v = Number(shifts[cl.key]) || 0;
      if (v && stepsOf(cl).indexOf(v) !== -1) n += v;
    });
    return n;
  }

  /* THE QUOTE. The crew's Caliber picks the row, the base difficulty plus the
     clause shifts picks the column, and the column CLAMPS at either edge of the
     grid (D6): the book says nothing about running off it, so the quote holds
     at the last column and `over` says by how much it tried to go past. `mid`
     is the band's midpoint, the prefilled total; an "about" cell carries the
     one figure as both ends, and the Nexus-only cell has none (null). */
  function quote(caliber, baseKey, shifts) {
    var C = P().contract, cs = C.columns;
    var cals = C.rows.map(function (r) { return r.caliber; });
    var lo = Math.min.apply(null, cals), hi = Math.max.apply(null, cals);
    var cal = Math.max(lo, Math.min(hi, Math.round(Number(caliber)) || lo));
    var base = colIndex(baseKey);
    if (base < 0) base = Math.max(0, colIndex("fair"));
    var shift = shiftOf(shifts || {});
    var raw = base + shift, idx = Math.max(0, Math.min(cs.length - 1, raw));
    var cell = cellOf(rowAt(cal), idx);
    var mid = (cell && typeof cell.low === "number" && typeof cell.high === "number") ? midOf(cell.low, cell.high) : null;
    return { caliber: cal, base: cs[base].key, baseName: cs[base].name, shift: shift, raw: raw, over: raw - idx,
             index: idx, key: cs[idx].key, name: cs[idx].name, clamped: raw !== idx, cell: cell,
             band: cell ? cell.text : "", mid: mid, nexus: cell ? cell.nexus : null };
  }

  /* A bounty: the Target's XP times the rate, times aliveMult for breathing
     delivery. The rate is held to the book's perXpLow to perXpHigh. */
  function bountyValue(xp, rate, alive) {
    var B = P().bounties;
    var r = Math.max(B.perXpLow, Math.min(B.perXpHigh, Math.round(Number(rate)) || B.perXpLow));
    return glim(xp) * r * (alive ? (Number(B.aliveMult) || 1) : 1);
  }

  /* ---- the encounter being paid ----------------------------------------- */
  function encThreats(enc) {
    return ((enc && Array.isArray(enc.entries)) ? enc.entries : []).filter(function (r) {
      return r && r.kind === "threat" && typeof r.id === "string" && isObj(r.block);
    });
  }
  function encCrew(enc) {
    return ((enc && Array.isArray(enc.entries)) ? enc.entries : []).filter(function (r) { return r && r.kind === "crew"; });
  }
  /* THE WRITES STILL STANDING (F4, F9, F10). gmStore.liveWrites answers what
     UNDO can take back: write records not undone, not imported from a backup
     (history only on this device), and to a Freelancer still in the roster,
     newest first. A write to a deleted record went with the record, so it no
     longer counts as paid.
     gmStore.paidWrites answers what is ALREADY PAID: the same, with the
     imported writes kept in. Restoring a backup brings back records that
     really hold those writes, so the Table's award, an earlier payday and a
     job's own payday all hold CREDIT THE CREW back whether or not they came
     in with an import. The fallbacks are the same rules, for a store that
     predates them. */
  function standingWrites(filter, withImported) {
    var roster = (EN.store && EN.store.roster && EN.store.roster()) || {};
    return gm.list("ledger").filter(function (r) {
      return isObj(r) && r.kind === "write" && !r.undone && (withImported || !r.imported) && typeof r.charId === "string" &&
        own(roster, r.charId) && (!filter || filter(r));
    }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  }
  function liveWrites(filter) {
    if (typeof gm.liveWrites === "function") return gm.liveWrites(filter) || [];
    return standingWrites(filter, false);
  }
  function paidWrites(filter) {
    if (typeof gm.paidWrites === "function") return gm.paidWrites(filter) || [];
    return standingWrites(filter, true);
  }
  function metaOf(w) { return (w && isObj(w.meta)) ? w.meta : {}; }
  // the XP a write carries (the whole fight's total under D5), or 0
  function xpOfWrite(w) {
    var n = 0;
    (Array.isArray(w.ops) ? w.ops : []).forEach(function (o) { if (o && o.op === "xp") n = Number(o.amount) || 0; });
    return n;
  }

  /* XP THE TABLE ALREADY WROTE for this fight (F9, F10). The Encounters tab's
     AWARD XP writes an encounter's XP from the Table, and its SEND TO PAYROLL
     hands the same fight here, so crediting the XP again would pay it twice.
     The award is found in the ledger, by the writes Encounters tags
     {source: "award", encounterAt}, matched to the `at` of the fight being
     paid. The form's own copy of the snapshot is never read for it: that copy
     is as old as the handoff, so an award made after it was missed and paid
     again. An award written before writes carried a tag is still found on the
     live lastEncounter while that is this fight, counting only its writes that
     still stand. An award that came in with an imported backup counts: it is
     paid, even though it cannot be undone here. Returns {total, names} or null. */
  function tableAward(enc) {
    if (!isObj(enc) || typeof enc.at !== "number") return null;
    var at = enc.at, seen = Object.create(null), hits = [];
    var live = paidWrites();
    live.forEach(function (w) {
      var mt = metaOf(w);
      if (mt.source === "award" && mt.encounterAt === at) { seen[w.id] = true; hits.push(w); }
    });
    var last = gm.get().lastEncounter;
    var aw = (isObj(last) && last.at === at && isObj(last.xpAward)) ? last.xpAward : null;
    if (aw && Array.isArray(aw.writeIds)) {
      live.forEach(function (w) {
        if (aw.writeIds.indexOf(w.id) !== -1 && !own(seen, w.id)) { seen[w.id] = true; hits.push(w); }
      });
    }
    if (!hits.length) return null;
    var total = 0, names = [];
    hits.slice().reverse().forEach(function (w) {
      total = Math.max(total, xpOfWrite(w));
      names.push(w.charName || "a Freelancer");
    });
    return { total: total, names: names };
  }

  /* AN EARLIER PAYDAY FOR THE SAME FIGHT OR THE SAME JOB (F8). A credited
     payday with a write still standing that paid the fight this form pays (the
     same encounterAt) or the job it pays. CREDIT THE CREW waits for the GM's
     armed word when there is one, and the fight's XP is never written twice.
     A payday's writes are the ones tagged with its id, or (credited before
     writes carried a tag) the ones its writeIds list, counted by paidWrites, so
     a payday that came in with an imported backup still holds the credit.

     EVERY MATCH IS READ, not only the newest. A newer payday for the job alone
     used to hide an older one that wrote this fight's XP, and the fight's XP
     was then written a second time. Returns the newest match as {pd, fight,
     job, xpNames, imported, xp, others}, or null: `xp` is the newest match
     that wrote this fight's XP (the same object when that is the newest; null
     when none did), and `others` the older matches. selfId is the form's own
     payday. */
  function paydayAt(pd) {
    if (typeof pd.encounterAt === "number") return pd.encounterAt;
    return (isObj(pd.form) && isObj(pd.form.enc) && typeof pd.form.enc.at === "number") ? pd.form.enc.at : null;
  }
  function earlierPayday(encAt, jobId, selfId) {
    var hasAt = typeof encAt === "number", paid = null, hits = [];
    if (!hasAt && !jobId) return null;
    gm.list("ledger").forEach(function (pd) {
      if (!isObj(pd) || pd.kind !== "payday" || pd.id === selfId || !pd.credited || pd.undone) return;
      var fight = hasAt && paydayAt(pd) === encAt;
      var jobHit = !!jobId && pd.jobId === jobId;
      if (!fight && !jobHit) return;
      if (!paid) paid = paidWrites();
      var ids = Array.isArray(pd.writeIds) ? pd.writeIds : [];
      var ws = paid.filter(function (w) {
        var mt = metaOf(w);
        return (mt.source === "payday" && mt.paydayId === pd.id) || ids.indexOf(w.id) !== -1;
      });
      if (!ws.length) return;
      // in the order written (paidWrites is newest first)
      var xpNames = ws.filter(function (w) { return xpOfWrite(w) > 0; }).reverse().map(function (w) { return w.charName || "a Freelancer"; });
      // `imported`: none of its writes can be undone here, so the hold cannot say "undo that payday"
      hits.push({ pd: pd, fight: fight, job: jobHit, xpNames: xpNames,
                  imported: !ws.some(function (w) { return !w.imported; }) });
    });
    if (!hits.length) return null;
    var hit = hits[0];
    hit.xp = hits.filter(function (h) { return h.fight && h.xpNames.length; })[0] || null;
    hit.others = hits.slice(1);
    return hit;
  }
  /* THE FIGHT BEING PAID, taken into the form with the same XP the Table's award
     card counts. That card adds the plan's objective award on top of the
     defeated threats and lets the GM untick a threat that got away; without
     them here the two tabs priced one fight's XP differently. `xp` is what the
     award card hands over with SEND TO PAYROLL ({objective, skip}); without it
     (USE THE LAST ENCOUNTER, or an older caller) the objective comes from the
     plan the fight was run from. A figure the GM already typed is kept. */
  function takeEncounter(enc, xp) {
    _p.enc = copy(enc);
    _p.salv = Object.create(null);
    _p.noXp = [];
    var ids = encThreats(_p.enc).map(function (r) { return r.id; });
    var obj = null;
    if (isObj(xp)) {
      obj = Math.max(0, Math.floor(Number(xp.objective)) || 0);
      (Array.isArray(xp.skip) ? xp.skip : []).forEach(function (id) {
        if (typeof id === "string" && ids.indexOf(id) !== -1) _p.noXp.push(id);
      });
    } else {
      var plan = (typeof _p.enc.sourceId === "string" && _p.enc.sourceId) ? gm.rec("encounters", _p.enc.sourceId) : null;
      if (plan && isObj(plan.objective)) obj = Math.max(0, Math.floor(Number(plan.objective.awardXp)) || 0);
    }
    if (obj && !String(_p.objXp || "").replace(/\s+/g, "")) _p.objXp = String(obj);
  }
  /* A Table row is named after its statblock, numbered when it arrived as one
     of several ("Street Ganger 2"), so the block's own name is tried first and
     the row name without its number second. */
  function bestEntry(row) {
    var B = EN.bestiary, b = row.block || {};
    if (!B || !Array.isArray(B.entries)) return null;
    var names = [b.name, String(row.name || "").replace(/\s+\d+$/, "")];
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      if (!n) continue;
      var hit = B.entries.filter(function (e) { return e && e.name === n; })[0];
      if (hit) return hit;
    }
    return null;
  }
  /* Which of the book's four salvage sources a Bestiary category falls under.
     The page names people, machines, #GRID kills, and "Flow-side and cryptid
     kills" (the one the Grade bands price). Bioforms are read as that fourth
     source: an app reading, since the page names no fifth and a Bioform's
     printed salvage is parts, like a cryptid's. */
  var SOURCE_OF = { people: "people", machines: "machines", grid: "grid", flow: "flow", cryptids: "flow", bioforms: "flow" };
  function sourceDef(key) {
    return key ? (P().salvage.sources || []).filter(function (s) { return s.key === key; })[0] || null : null;
  }
  function bandOf(grade) { return (P().salvage.bands || []).filter(function (b) { return b.grade === grade; })[0] || null; }
  function threatInfo(row) {
    var b = row.block || {}, e = bestEntry(row);
    var cat = e ? e.category : null;
    var xp = EN.gmEngine.xpOf(row) || (e ? EN.gmEngine.xpOf(e) : 0);
    return { id: row.id, name: row.name || b.name || "Threat", grade: Number(b.grade) || (e ? Number(e.grade) || 0 : 0),
             xp: xp, entry: e, source: (cat && own(SOURCE_OF, cat)) ? SOURCE_OF[cat] : null };
  }

  /* ---- the crew --------------------------------------------------------- */
  /* D4 through gmEngine.crew, with one payroll touch: when the encounter being
     paid carries crew rows, THOSE are the crew, because they are who fought.
     Otherwise crew() answers as it does everywhere (the Table, then the filed
     roster). The overrides apply either way. */
  function crewNow() {
    var opts = { headcount: _p.hc, caliber: _p.cal };
    var fromEnc = encCrew(_p.enc).length > 0;
    if (fromEnc) opts.encounter = _p.enc;
    var c = null;
    try { c = EN.gmEngine.crew(opts); } catch (e) { c = null; }
    if (!c) c = { members: [], headcount: 0, caliber: 1, source: "none", overridden: { headcount: false, caliber: false } };
    c.fromEncounter = fromEnc && c.source === "table";
    return c;
  }

  /* ---- the model: every number on the page, computed once a render ------ */
  function job() { return _p.jobId ? gm.rec("jobs", _p.jobId) : null; }
  /* The title when none is typed (F20): the job's, else the name of the fight
     being paid, else plain "Payday". A payday from the Table's award for a plan
     with no job used to be called "Payday", and its stub read "Payday: Payday". */
  function defaultTitle() {
    var j = job();
    if (j && typeof j.title === "string" && j.title.trim()) return j.title.trim();
    if (_p.enc && typeof _p.enc.name === "string" && _p.enc.name.trim()) return _p.enc.name.trim();
    return "Payday";
  }
  /* "Payday: The Toll", the stub's subject and the summary's first line, but
     never the word twice: a title that already starts with it stands alone
     ("Payday", "Payday at the docks"). `word` is "Payday" or "PAYDAY". */
  function titled(word, title) {
    var t = String(title || "").trim();
    if (!t) return word;
    return /^payday\b/i.test(t) ? word + t.slice(6) : word + ": " + t;
  }

  function model() {
    var c = crewNow();
    var q = quote(c.caliber, _p.diff, _p.shifts);
    var typed = _p.total !== null;
    var contract = typed ? glim(_p.total) : (q.mid || 0);
    var nexus = nex(_p.nexus);

    var bl = _p.bounties.map(function (b) {
      return { id: b.id, name: b.name, xp: glim(b.xp), rate: Number(b.rate) || defRate(), alive: !!b.alive,
               value: bountyValue(b.xp, b.rate, b.alive) };
    });
    var bTotal = bl.reduce(function (a, b) { return a + b.value; }, 0);

    var threats = encThreats(_p.enc).map(threatInfo);
    var sl = [];
    threats.forEach(function (t) {
      var v = glim(own(_p.salv, t.id) ? _p.salv[t.id] : "");
      if (v > 0) sl.push({ name: t.name, value: v });
    });
    _p.salvage.forEach(function (s) {
      var v = glim(s.value);
      if (v > 0) sl.push({ name: (s.name || "").trim() || "Salvage", value: v });
    });
    var sTotal = sl.reduce(function (a, s) { return a + s.value; }, 0);

    // the one splitter, twice: the client's money through the fixer, the salvage without
    var split = EN.engine.splitPayout(contract + bTotal, c.headcount, _p.fixer, _p.kit);
    var sSplit = EN.engine.splitPayout(sTotal, c.headcount, 0, _p.kit);

    // Nexus splits evenly in hundredths; what will not divide is left over, like Glimmer's
    var hc = Math.max(1, Math.floor(Number(c.headcount) || 0));
    var cents = Math.round(nexus * 100), eachC = Math.floor(cents / hc);

    var xpRows = threats.filter(function (t) { return _p.noXp.indexOf(t.id) === -1; });
    var xpObj = glim(_p.objXp);
    var xpTotal = xpRows.reduce(function (a, t) { return a + t.xp; }, 0) + xpObj;
    // an earlier payday still standing for this fight or this job holds the credit back (F8)
    var encAt = (_p.enc && typeof _p.enc.at === "number") ? _p.enc.at : null;
    var dup = earlierPayday(encAt, _p.jobId, _p.paydayId);
    // any earlier payday that wrote this fight's XP, not only the newest match
    var xpPaid = dup ? dup.xp : null;
    /* what CREDIT THE CREW writes: nothing when an earlier payday already wrote
       this fight's XP (never twice, override or not), and nothing when the Table
       already awarded it, unless the GM says to write it again */
    var tAward = tableAward(_p.enc);
    var xpWrite = xpPaid ? 0 : (tAward && !_p.xpAgain) ? 0 : xpTotal;

    var roster = (EN.store && EN.store.roster && EN.store.roster()) || {};
    var credit = c.members.filter(function (x) {
      return _p.noCredit.indexOf(x.charId) === -1 && own(roster, x.charId);
    }).map(function (x) {
      var ch = roster[x.charId];
      return { charId: x.charId, name: x.name, caliber: x.caliber, useXp: !!(ch && ch.useXp === true) };
    });

    var rec = _p.paydayId ? gm.rec("ledger", _p.paydayId) : null;
    return {
      crew: c, q: q, typed: typed, contract: contract, nexus: nexus,
      bounties: bl, bTotal: bTotal, threats: threats, salvage: sl, sTotal: sTotal,
      split: split, sSplit: sSplit, eachG: split.each + sSplit.each,
      nexEach: eachC / 100, nexOver: (cents - eachC * hc) / 100,
      xpRows: xpRows, xpObj: xpObj, xpTotal: xpTotal, tAward: tAward, xpPaid: xpPaid, xpWrite: xpWrite,
      credit: credit, title: (_p.title || "").trim() || defaultTitle(),
      encAt: encAt, dup: dup,
      rec: rec, paid: !!(rec && rec.credited && !rec.undone)
    };
  }

  /* ---- small view pieces (local, per the house convention) --------------- */
  // the GM'S CARD button beside the heading, when gm.js offers one (EN.gmView.cardDrawer, like the undo strip)
  function cardButton() {
    try {
      if (EN.gmView && typeof EN.gmView.cardDrawer === "function") {
        var n = EN.gmView.cardDrawer();
        return (n && n.nodeType) ? n : null;
      }
    } catch (e) {
      try { console.warn("Payroll: the GM's Card button failed to draw.", e); } catch (e2) {}
    }
    return null;
  }
  function heading(title, sub) {
    return el("div.row.between.wrap", { style: { marginBottom: "14px", gap: "8px", alignItems: "center" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" },
        html: title + ' <span class="dim3" style="font-size:13px">' + sub + "</span>" }),
      cardButton()
    ]);
  }
  function gap() { return el("div", { style: { height: "12px" } }); }
  function lbl(t) { return el("label.fl", { text: t }); }
  function label(t) { return el("span.mono", { style: { fontSize: "10px", letterSpacing: ".1em", color: "var(--text3)" }, text: t }); }
  function help(t, style) {
    var s = { margin: "4px 0 0" };
    if (style) Object.keys(style).forEach(function (k) { s[k] = style[k]; });
    return el("p.help", { style: s, text: t });
  }
  function field(t, input) { return el("div.field", { style: { margin: 0 } }, [lbl(t), input]); }
  function chip(text, on, pay, onclick, title) {
    return el("span.chip" + (on ? ".on" : ""), { dataset: pay ? { pay: pay } : null, title: title || null,
      style: { cursor: "pointer", fontSize: "10.5px" }, onclick: onclick }, text);
  }
  /* A typed field: the value lands in the form and everything around the field
     is redrawn while the field itself is left alone (retype, F13). A number
     field the browser cannot read yet (a lone "-") changes nothing until it can;
     the typed string stays on screen either way. */
  function numIn(key, value, width, onval, attrs) {
    var a = { type: "number", value: value == null ? "" : String(value), dataset: { pf: key },
      style: { width: width || "90px" },
      oninput: function (e) {
        var t = e.target;
        if (t.validity && t.validity.badInput) return;
        onval(t.value);
        retype(t);
      } };
    if (attrs) Object.keys(attrs).forEach(function (k) { a[k] = attrs[k]; });
    return el("input", a);
  }
  function textIn(key, value, placeholder, onval, style) {
    var s = { width: "100%" };
    if (style) Object.keys(style).forEach(function (k) { s[k] = style[k]; });
    return el("input", { type: "text", value: value || "", placeholder: placeholder || "", dataset: { pf: key }, style: s,
      oninput: function (e) { onval(e.target.value); retype(e.target); } });
  }
  // a money readout; data-v carries the raw number for anything that reads the page
  function money(lab, n, text, color, pay) {
    return el("div", { style: { textAlign: "center", minWidth: "92px" } }, [
      el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: lab }),
      el("span.mono", { dataset: pay ? { pay: pay, v: String(n) } : null,
        style: { fontSize: "19px", color: color || "var(--text)" }, text: text })
    ]);
  }
  // a reference fold, closed by default: the book's prose is there when wanted and out of the way when not
  function fold(key, title, kids) {
    var open = !!_open[key];
    return el("div", { style: { marginTop: "10px" } }, [
      el("div", { dataset: { pay: "fold-" + key },
        style: { cursor: "pointer", fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".12em",
                 color: "var(--text3)", textTransform: "uppercase" },
        onclick: function () { _open[key] = !open; refresh(); } }, EN.ui.nameCaret(title, open)),
      open ? el("div", { style: { marginTop: "6px" } }, kids) : null
    ]);
  }

  /* COPY. The clipboard API where the page may use it, else the old select and
     execCommand route, which file:// pages still get. Either way the same text
     is on screen to select by hand. */
  function copyText(text, what) {
    function fallback() {
      var ta = el("textarea", { style: { position: "fixed", left: "-9999px", top: "0" } });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? what + " copied." : "The clipboard is not reachable here. Select the text and copy it by hand.");
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast(what + " copied."); }, fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  /* ---- 1. this payday: the job, the encounter, the crew ----------------- */
  function headPanel(m) {
    var kids = [], j = job(), c = m.crew;
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
      el("div", { style: { flex: "1 1 220px", minWidth: 0 } }, [
        field("Payday title", textIn("title", _p.title, defaultTitle(), function (v) { _p.title = v; }))
      ])
    ]));
    if (_p.jobId) {
      kids.push(help(j ? "For the job " + (j.title || "untitled") + DOT + "status " + String(j.status || "draft") + "."
                       : "The job this payday was opened for is no longer in the log.", { color: "var(--text2)" }));
    }

    // the encounter being paid
    var last = gm.get().lastEncounter;
    if (_p.enc) {
      var ts = encThreats(_p.enc);
      kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [
        label("ENCOUNTER"),
        el("span", { dataset: { pay: "enc-name" }, style: { fontWeight: 600 }, text: _p.enc.name || "The last encounter" }),
        el("span.help", { style: { margin: 0 }, text: ts.length + " " + plural(ts.length, "threat") +
          (_p.enc.at ? DOT + "cleared " + stamp(_p.enc.at) : "") }),
        el("button.btn.sm", { dataset: { pay: "enc-drop" }, title: "Stop paying from this encounter",
          onclick: function () { _p.enc = null; _p.salv = Object.create(null); _p.noXp = []; refresh(); } }, "✕ DROP")
      ]));
    } else if (last && encThreats(last).length) {
      kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [
        label("ENCOUNTER"),
        el("button.btn.sm", { dataset: { pay: "enc-last" }, onclick: function () { takeEncounter(last, null); refresh(); } },
          "+ USE THE LAST ENCOUNTER"),
        el("span.help", { style: { margin: 0 }, text: (last.name || "Unnamed") + DOT + encThreats(last).length + " " +
          plural(encThreats(last).length, "threat") + (last.at ? DOT + "cleared " + stamp(last.at) : "") })
      ]));
    } else {
      kids.push(help("No finished encounter to pay from yet. Bounties, salvage and XP can be typed in by hand."));
    }

    // the crew
    var src = c.fromEncounter ? "the crew rows of the encounter being paid"
      : c.source === "table" ? "the crew on the Table"
      : c.source === "roster" ? "the filed roster" : null;
    kids.push(el("div", { style: { height: "10px" } }));
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
      label("CREW"),
      el("span", { dataset: { pay: "crew-line" }, style: { fontWeight: 600 },
        text: c.headcount + " " + plural(c.headcount, "Freelancer") + DOT + "Caliber " + c.caliber }),
      el("span.help", { style: { margin: 0 }, text: src ? "from " + src : "no crew yet: set a headcount and a Caliber" })
    ]));
    var roster = (EN.store.roster && EN.store.roster()) || {};
    if (c.members.length) {
      kids.push(el("div.row.wrap", { style: { gap: "6px", marginTop: "6px" } }, c.members.map(function (x) {
        var ch = roster[x.charId];
        var onXp = !!(ch && ch.useXp === true);
        return el("span.chip", { style: { fontSize: "10px" },
          text: x.name + DOT + (x.caliber ? "C" + x.caliber : "C?") + DOT + (onXp ? "XP" : "MILESTONE") });
      })));
    }
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "8px" } }, [
      field("Headcount", numIn("hc", _p.hc, "80px", function (v) { _p.hc = v; }, { min: "1", placeholder: String(c.members.length || "") })),
      field("Caliber", numIn("cal", _p.cal, "70px", function (v) { _p.cal = v; _p.total = null; }, { min: "1", max: "5" })),
      (_p.hc !== "" || _p.cal !== "") ? el("button.btn.sm", { dataset: { pay: "crew-clear" },
        onclick: function () { _p.hc = ""; _p.cal = ""; _p.total = null; refresh(); } }, "CLEAR OVERRIDES") : null
    ]));
    if (c.overridden && (c.overridden.headcount || c.overridden.caliber)) {
      kids.push(help("Set by hand: " + [c.overridden.headcount ? "headcount" : null, c.overridden.caliber ? "Caliber" : null]
        .filter(Boolean).join(" and ") + ". The book prices one Caliber for the whole crew, so a mixed crew is the GM's call."));
    }
    return EN.ui.panel("This Payday", "JOB" + DOT + "ENCOUNTER" + DOT + "CREW", kids);
  }

  /* ---- 2. contract pay -------------------------------------------------- */
  function setShift(k, v) {
    if (v) _p.shifts[k] = v; else delete _p.shifts[k];
    _p.total = null;
    refresh();
  }
  function stepWord(s) { return Math.abs(s) + (s < 0 ? " LEFT" : " RIGHT"); }
  function clauseRow(cl) {
    var steps = stepsOf(cl);
    var cur = own(_p.shifts, cl.key) ? Number(_p.shifts[cl.key]) || 0 : 0;
    var chips = steps.length === 1
      ? [chip(stepWord(steps[0]), cur === steps[0], "clause-" + cl.key, function () { setShift(cl.key, cur ? 0 : steps[0]); })]
      : [chip("OFF", !cur, "clause-" + cl.key + "-0", function () { setShift(cl.key, 0); })].concat(steps.map(function (s) {
          return chip(stepWord(s), cur === s, "clause-" + cl.key + "-" + s, function () { setShift(cl.key, s); });
        }));
    return el("div.row.wrap", { style: { gap: "8px", alignItems: "flex-start", padding: "5px 0", borderBottom: "1px solid var(--border)" } }, [
      el("div.row", { style: { gap: "4px", flex: "0 0 auto" } }, chips),
      el("span.help", { style: { margin: 0, flex: "1 1 200px", minWidth: 0 }, text: cl.text })
    ]);
  }

  function gridTable(q) {
    var C = P().contract;
    var head = el("tr", null, [el("th", { text: "Caliber" })].concat(C.columns.map(function (c) { return el("th", { text: c.name }); })));
    var body = C.rows.map(function (r) {
      var mine = r.caliber === q.caliber;
      return el("tr", null, [el("td.mono", { style: { color: mine ? "var(--accent)" : "var(--text3)" }, text: String(r.caliber) })]
        .concat(C.columns.map(function (c, i) {
          var cell = cellOf(r, i);
          var sel = mine && i === q.index, base = mine && q.shift !== 0 && c.key === q.base;
          return el("td", {
            dataset: { pay: "cell-" + r.caliber + "-" + c.key, sel: sel ? "1" : "0" },
            title: "Quote Caliber " + r.caliber + ", " + c.name,
            style: { cursor: "pointer", color: sel ? "var(--accent)" : mine ? "var(--text)" : "var(--text3)",
                     fontWeight: sel ? 600 : 400, background: sel ? "rgba(255,255,255,.05)" : "transparent",
                     outline: sel ? "1px solid var(--accent)" : base ? "1px dashed var(--border2)" : "none", outlineOffset: "-2px" },
            // a click picks the base column; the clauses still shift it from there
            onclick: function () {
              _p.diff = c.key; _p.total = null;
              if (r.caliber !== q.caliber) _p.cal = String(r.caliber);
              refresh();
            }
          }, cell ? cell.text : "");
        })));
    });
    return el("div", { style: { overflowX: "auto", margin: "10px 0 4px" } }, [
      el("table.sktable", { style: { fontSize: "12.5px" } }, [el("thead", null, [head]), el("tbody", null, body)])
    ]);
  }

  function incursionBox(m) {
    var I = P().incursion;
    if (!I) return null;
    var q = m.q, r = parseInt(_p.inc, 10), kids = [];
    var opts = [el("option", { value: "", selected: !r }, "Not an Incursion")];
    P().contract.rows.forEach(function (row) {
      opts.push(el("option", { value: String(row.caliber), selected: r === row.caliber }, "Rating " + row.caliber));
    });
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
      label("INCURSION"),
      el("select", { dataset: { pay: "inc-rating" }, style: { width: "auto", maxWidth: "100%" },
        onchange: function (e) { _p.inc = e.target.value; refresh(); } }, opts)
    ]));
    if (r) {
      var map = (I.ratingToColumn || []).filter(function (x) { return x.offset === r - q.caliber; })[0];
      if (map && colIndex(map.col) >= 0) {
        var cell = cellOf(rowAt(q.caliber), colIndex(map.col));
        kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "6px" } }, [
          el("span.help", { dataset: { pay: "inc-out" }, style: { margin: 0 },
            text: "A rating " + r + " Incursion for a Caliber " + q.caliber + " crew prices as " + colName(map.col) +
                  ": " + (cell ? cell.text : "no cell") + "." }),
          q.base !== map.col ? el("button.btn.sm", { dataset: { pay: "inc-use" },
            onclick: function () { _p.diff = map.col; _p.total = null; refresh(); } }, "PRICE AS " + colName(map.col).toUpperCase()) : null
        ]));
      } else {
        var named = (I.ratingToColumn || []).map(function (x) {
          return (x.offset === 0 ? "at the crew's Caliber" : x.offset + " " + plural(x.offset, "step") + " above it") + " (" + colName(x.col) + ")";
        }).join(" or ");
        kids.push(help("The book names a column only for a rating " + named + ". Price this one by hand.",
          { color: "var(--warn)" }));
      }
    }
    kids.push(fold("incursion", I.name, [help(I.text, { margin: 0 })]));
    return el("div", { style: { marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border2)" } }, kids);
  }

  function contractPanel(m) {
    var C = P().contract, q = m.q, kids = [];
    kids.push(help(C.lead, { margin: "0 0 10px" }));
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginBottom: "6px" } },
      [label("DIFFICULTY")].concat(C.columns.map(function (c) {
        return chip(c.name, _p.diff === c.key, "diff-" + c.key, function () { _p.diff = c.key; _p.total = null; refresh(); });
      }))));
    kids.push(el("div", null, clauses().map(clauseRow)));
    if (q.shift) {
      kids.push(help("Clauses: " + Math.abs(q.shift) + " " + plural(Math.abs(q.shift), "column") + " " +
        (q.shift > 0 ? "right" : "left") + " from " + q.baseName + ".", { color: "var(--text2)" }));
    }
    if (q.clamped) {
      var o = Math.abs(q.over);
      kids.push(el("p.help", { dataset: { pay: "clamp-note" }, style: { margin: "4px 0 0", color: "var(--warn)" },
        text: "The clauses run " + o + " " + plural(o, "column") + " past the " + q.name + " edge of the grid, so the quote holds at " + q.name + "." }));
    }
    kids.push(gridTable(q));
    kids.push(help(C.after, { margin: "0 0 10px" }));

    // the quote: the printed band, its midpoint prefilled, and the total the GM settles on
    var cell = q.cell, midText;
    if (q.mid === null) midText = "This cell prints no Glimmer figure, so nothing is prefilled.";
    else if (cell && cell.about) midText = "The page prints about " + fmtG(q.mid) + ", prefilled as the total.";
    else midText = "The band's midpoint, " + fmtG(q.mid) + ", is prefilled as the total.";
    var box = [
      label("CALIBER " + q.caliber + DOT + q.name.toUpperCase()),
      el("div", { dataset: { pay: "band" }, style: { fontSize: "18px", fontFamily: "var(--mono)", color: "var(--accent)", margin: "2px 0 8px" },
        text: q.band || "No cell" }),
      el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
        field("Contract total " + G, numIn("total", m.typed ? _p.total : (q.mid === null ? "" : q.mid), "130px",
          function (v) { _p.total = v; }, { min: "0" })),
        field("Nexus " + NX, numIn("nexus", _p.nexus, "90px", function (v) { _p.nexus = v; }, { min: "0", step: "0.01" })),
        m.typed ? el("button.btn.sm", { dataset: { pay: "total-reset" }, onclick: function () { _p.total = null; refresh(); } },
          "BACK TO THE BAND") : null
      ]),
      help(midText)
    ];
    if (m.typed && cell && !cell.about && typeof cell.low === "number" && typeof cell.high === "number" &&
        (m.contract < cell.low || m.contract > cell.high)) {
      box.push(help("Outside the printed band of " + cell.text + ".", { color: "var(--warn)" }));
    }
    if (q.nexus === "or") box.push(el("p.help", { dataset: { pay: "nexus-note" }, style: { margin: "4px 0 0", color: "var(--gold)" },
      text: "This cell prints a Glimmer figure or Nexus terms. If the client pays in Nexus, enter it under Nexus and set the Glimmer total to what is left." }));
    if (q.nexus === "only") box.push(el("p.help", { dataset: { pay: "nexus-note" }, style: { margin: "4px 0 0", color: "var(--gold)" },
      text: "This cell prints Nexus terms and no Glimmer figure. Enter the Nexus the client offers, and any Glimmer by hand." }));
    kids.push(el("div.feature", { style: { borderLeftColor: "var(--accent)" } }, box));
    kids.push(incursionBox(m));
    return EN.ui.panel("Contract Pay", "CALIBER × DIFFICULTY", kids);
  }

  /* ---- 3. bounties ------------------------------------------------------ */
  function addBounty(name, xp) {
    _p.bounties.push({ id: lid("b"), name: String(name || "Target"), xp: String(glim(xp)), rate: defRate(), alive: false });
    refresh();
  }
  function bountyLine(b, mb) {
    var B = P().bounties, rates = [];
    for (var r = B.perXpLow; r <= B.perXpHigh; r++) rates.push(r);
    var mult = b.alive ? (Number(B.aliveMult) || 1) : 1;
    return el("div.feature", { dataset: { bid: b.id }, style: { padding: "8px 10px" } }, [
      el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
          el("span", { style: { fontWeight: 600 }, text: b.name }),
          numIn("bx-" + b.id, b.xp, "80px", function (v) { b.xp = v; }, { min: "0", title: "The Target's XP" }),
          label("XP")
        ]),
        el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, rates.map(function (rt) {
          return chip(G + rt + " / XP", Number(b.rate) === rt, "rate-" + b.id + "-" + rt, function () { b.rate = rt; refresh(); });
        }).concat([
          chip("ALIVE ×" + B.aliveMult, !!b.alive, "alive-" + b.id, function () { b.alive = !b.alive; refresh(); },
            "Breathing delivery"),
          el("span.mono", { dataset: { pay: "bval-" + b.id, v: String(mb.value) },
            style: { fontSize: "16px", color: "var(--success)", minWidth: "76px", textAlign: "right" }, text: fmtG(mb.value) }),
          el("button.btn.sm", { dataset: { pay: "bdel-" + b.id }, title: "Remove this bounty",
            onclick: function () { _p.bounties = _p.bounties.filter(function (x) { return x.id !== b.id; }); refresh(); } }, "✕")
        ]))
      ]),
      help("The range: " + fmtG(mb.xp * B.perXpLow * mult) + " to " + fmtG(mb.xp * B.perXpHigh * mult) +
        (b.alive ? ", alive." : ", a kill.")),
      mb.value > B.nexusAbove ? el("p.help", { dataset: { pay: "bnexus-" + b.id }, style: { margin: "4px 0 0", color: "var(--gold)" },
        text: "Past " + fmtG(B.nexusAbove) + ". " + B.nexusText }) : null
    ]);
  }

  function bountyPanel(m) {
    var B = P().bounties, kids = [];
    kids.push(help(B.paragraphs[0], { margin: "0 0 10px" }));
    var srcs = [["encounter", "FROM THE ENCOUNTER"], ["bestiary", "FROM THE BESTIARY"], ["xp", "BY XP"]];
    kids.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "8px" } }, srcs.map(function (s) {
      return chip(s[1], _p.bSrc === s[0], "bsrc-" + s[0], function () { _p.bSrc = s[0]; refresh(); });
    })));

    var pick = [];
    if (_p.bSrc === "encounter") {
      // the encounter being paid, else the last one cleared, so a bounty can be priced before the rest
      var src = _p.enc || gm.get().lastEncounter;
      var ts = encThreats(src).map(threatInfo);
      if (!ts.length) pick.push(help("No finished encounter with threats in it. Pick from the Bestiary or type the XP.", { margin: 0 }));
      else {
        var curE = ts.filter(function (t) { return t.id === _p.bEnc; })[0] || ts[0];
        pick.push(el("select", { dataset: { pay: "bpick-enc" }, style: { width: "auto", maxWidth: "100%" },
          onchange: function (e) { _p.bEnc = e.target.value; refresh(); } }, ts.map(function (t) {
            return el("option", { value: t.id, selected: t.id === curE.id }, t.name + DOT + "G" + t.grade + DOT + commas(t.xp) + " XP");
          })));
        pick.push(el("button.btn.sm", { dataset: { pay: "badd-enc" }, onclick: function () { addBounty(curE.name, curE.xp); } }, "+ BOUNTY"));
      }
    } else if (_p.bSrc === "bestiary") {
      var Bst = EN.bestiary, all = (Bst && Array.isArray(Bst.entries)) ? Bst.entries : [];
      if (!all.length) pick.push(help("Bestiary data did not load.", { margin: 0 }));
      else {
        var curB = all.filter(function (e) { return e.name === _p.bBest; })[0] || all[0];
        var groups = (Bst.categories || []).map(function (cat) {
          return el("optgroup", { label: cat.name }, all.filter(function (e) { return e.category === cat.key; }).map(function (e) {
            return el("option", { value: e.name, selected: e === curB },
              e.name + DOT + "G" + e.grade + DOT + commas(EN.gmEngine.xpOf(e)) + " XP");
          }));
        });
        pick.push(el("select", { dataset: { pay: "bpick-best" }, style: { width: "auto", maxWidth: "100%" },
          onchange: function (e) { _p.bBest = e.target.value; refresh(); } }, groups));
        pick.push(el("button.btn.sm", { dataset: { pay: "badd-best" },
          onclick: function () { addBounty(curB.name, EN.gmEngine.xpOf(curB)); } }, "+ BOUNTY"));
      }
    } else {
      pick.push(el("div", { style: { flex: "1 1 160px", minWidth: 0 } }, [
        field("Target", textIn("bName", _p.bName, "Target", function (v) { _p.bName = v; }))]));
      pick.push(field("XP", numIn("bXp", _p.bXp, "90px", function (v) { _p.bXp = v; }, { min: "0" })));
      pick.push(el("button.btn.sm", { dataset: { pay: "badd-xp" }, onclick: function () {
        if (!glim(_p.bXp)) { toast("Type the Target's XP first."); return; }
        var n = (_p.bName || "").trim() || "Target", x = _p.bXp;
        _p.bName = ""; _p.bXp = "";
        addBounty(n, x);
      } }, "+ BOUNTY"));
    }
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "flex-end", marginBottom: "8px" } }, pick));

    if (!_p.bounties.length) kids.push(help("No bounties on this payday.", { margin: 0 }));
    _p.bounties.forEach(function (b) {
      var mb = m.bounties.filter(function (x) { return x.id === b.id; })[0];
      if (mb) kids.push(bountyLine(b, mb));
    });
    if (_p.bounties.length) {
      kids.push(el("div.row", { style: { justifyContent: "flex-end", gap: "8px", alignItems: "baseline", marginTop: "6px" } }, [
        label("BOUNTIES"),
        el("span.mono", { dataset: { pay: "bounty-total", v: String(m.bTotal) }, style: { fontSize: "16px" }, text: fmtG(m.bTotal) })
      ]));
    }
    kids.push(fold("bounties", "The book on bounties", [help(B.paragraphs[1], { margin: 0 })].concat(
      (B.examples || []).map(function (x) { return help(x.text); }))));
    return EN.ui.panel("Bounties", "PRICED OFF THE TARGET'S XP", kids);
  }

  /* ---- 4. salvage and parts --------------------------------------------- */
  function killRow(t) {
    var src = sourceDef(t.source), band = bandOf(t.grade), e = t.entry, bits = [];
    if (e && e.salvage) bits.push("Salvage: " + e.salvage);
    if (t.source === "people" && e && e.gear) {
      bits.push("Gear: " + e.gear + (src && src.fencePctLow ? " Fences pay " + src.fencePctLow + " to " + src.fencePctHigh + " percent for street kit." : ""));
    }
    if (t.source === "grid" && src && src.glimmerPerXp) bits.push("Code worth about " + fmtG(t.xp * src.glimmerPerXp) + " to the right buyer.");
    if (t.source === "flow" && band) bits.push("Clean parts at G" + band.grade + ": " + band.text + DOT + band.buyers + ".");
    if (!e) bits.push("A built threat: the Bestiary prints no salvage for it.");
    return el("div", { style: { padding: "7px 0", borderBottom: "1px solid var(--border)" } }, [
      el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
          el("span", { style: { fontWeight: 600 }, text: t.name }),
          el("span.chip", { style: { fontSize: "9.5px" }, text: "G" + t.grade }),
          src ? el("span.help", { style: { margin: 0 }, text: src.name }) : null
        ]),
        el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
          label(G),
          numIn("sv-" + t.id, own(_p.salv, t.id) ? _p.salv[t.id] : "", "100px", function (v) { _p.salv[t.id] = v; },
            { min: "0", placeholder: "value", title: "What it sold for, or will" })
        ])
      ])
    ].concat(bits.map(function (b) { return help(b); })));
  }

  function salvagePanel(m) {
    var S = P().salvage, A = P().claims && P().claims.salvage, kids = [];
    kids.push(help(S.lead, { margin: "0 0 8px" }));

    // the Grade bands; a Grade a Flow-side or cryptid kill in this encounter reached is lit
    var lit = Object.create(null);
    m.threats.forEach(function (t) { if (t.source === "flow") lit[t.grade] = true; });
    var head = el("tr", null, [el("th", { text: "Grade of the kill" }), el("th", { text: "Clean parts value" }), el("th", { text: "The buyers" })]);
    var rows = (S.bands || []).map(function (b) {
      var on = !!lit[b.grade];
      return el("tr", { dataset: { pay: "band-" + b.grade } }, [
        el("td.mono", { style: { color: on ? "var(--accent)" : "var(--text3)" }, text: "G" + b.grade }),
        el("td", { style: { color: on ? "var(--accent)" : "var(--text)" }, text: b.text }),
        el("td", { style: { color: "var(--text2)" }, text: b.buyers })
      ]);
    });
    kids.push(el("div", { style: { overflowX: "auto" } }, [
      el("table.sktable", { style: { fontSize: "12.5px" } }, [el("thead", null, [head]), el("tbody", null, rows)])
    ]));

    if (m.threats.length) {
      kids.push(EN.ui.sectionTitle("From the encounter"));
      m.threats.forEach(function (t) { kids.push(killRow(t)); });
    }

    kids.push(EN.ui.sectionTitle("Other salvage"));
    _p.salvage.forEach(function (s) {
      kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", padding: "4px 0", borderBottom: "1px solid var(--border)" } }, [
        el("span", { style: { flex: "1 1 160px", minWidth: 0 }, text: s.name || "Salvage" }),
        label(G),
        numIn("sl-" + s.id, s.value, "100px", function (v) { s.value = v; }, { min: "0" }),
        el("button.btn.sm", { dataset: { pay: "sdel-" + s.id },
          onclick: function () { _p.salvage = _p.salvage.filter(function (x) { return x.id !== s.id; }); refresh(); } }, "✕")
      ]));
    });
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "flex-end", marginTop: "6px" } }, [
      el("div", { style: { flex: "1 1 160px", minWidth: 0 } }, [
        field("Item", textIn("sName", _p.sName, "A cryptid's gland, a drone's sensor suite", function (v) { _p.sName = v; }))]),
      field("Value " + G, numIn("sValue", _p.sValue, "100px", function (v) { _p.sValue = v; }, { min: "0" })),
      el("button.btn.sm", { dataset: { pay: "sadd" }, onclick: function () {
        if (!glim(_p.sValue)) { toast("Type what it is worth first."); return; }
        _p.salvage.push({ id: lid("s"), name: (_p.sName || "").trim() || "Salvage", value: String(glim(_p.sValue)) });
        _p.sName = ""; _p.sValue = "";
        refresh();
      } }, "+ ADD")
    ]));

    // the salvage award: an owner's property recovered from an Incursion
    if (A) {
      var lo = Number(A.awardPctLow) || 0, hi = Number(A.awardPctHigh) || 100;
      var typedPct = _p.awPct === "" ? midOf(lo, hi) : Number(_p.awPct);
      var pct = Math.max(lo, Math.min(hi, isFinite(typedPct) ? typedPct : lo));
      var award = Math.floor(glim(_p.awValue) * pct / 100);
      kids.push(EN.ui.sectionTitle(A.name + " award"));
      kids.push(help(cap(A.awardText) + ".", { margin: "0 0 6px" }));
      kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
        field("Item value " + G, numIn("awValue", _p.awValue, "110px", function (v) { _p.awValue = v; }, { min: "0" })),
        field("Percent", numIn("awPct", _p.awPct, "70px", function (v) { _p.awPct = v; },
          { min: String(lo), max: String(hi), placeholder: String(midOf(lo, hi)) })),
        money("AWARD", award, fmtG(award), "var(--success)", "award"),
        el("button.btn.sm", { dataset: { pay: "award-add" }, onclick: function () {
          if (!award) { toast("Type the item's value first."); return; }
          _p.salvage.push({ id: lid("s"), name: A.name + " award, " + pct + " percent of " + fmtG(glim(_p.awValue)), value: String(award) });
          _p.awValue = ""; _p.awPct = "";
          refresh();
        } }, "+ ADD AS SALVAGE")
      ]));
      if (_p.awPct !== "" && pct !== typedPct) {
        kids.push(help("Held to the book's " + lo + " to " + hi + " percent.", { color: "var(--warn)" }));
      }
    }

    kids.push(el("div.row", { style: { justifyContent: "flex-end", gap: "8px", alignItems: "baseline", marginTop: "10px" } }, [
      label("SALVAGE"),
      el("span.mono", { dataset: { pay: "salv-total", v: String(m.sTotal) }, style: { fontSize: "16px" }, text: fmtG(m.sTotal) })
    ]));
    var ref = (S.sources || []).map(function (s) {
      var p = el("p.help", { style: { margin: "0 0 6px" } });
      p.appendChild(el("span", { style: { fontWeight: 600 }, text: s.name + ". " }));
      p.appendChild(document.createTextNode(s.text));
      return p;
    });
    if (S.guidance) ref.push(help(S.guidance.label + ": " + S.guidance.text, { color: "var(--accent)" }));
    if (A && A.paragraphs) A.paragraphs.forEach(function (t) { ref.push(help(t)); });
    kids.push(fold("salvage", "What threats leave", ref));
    return EN.ui.panel("Salvage and Parts", "BY THE GRADE OF THE KILL", kids);
  }

  /* ---- 5. the split ----------------------------------------------------- */
  function splitPanel(m) {
    var C = P().contract, sp = m.split, ss = m.sSplit, kids = [];
    var flo = Number(C.fixerPctLow), fhi = Number(C.fixerPctHigh);
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginBottom: "10px" } }, [
      field("Fixer %", numIn("fixer", _p.fixer, "70px", function (v) { _p.fixer = v; }, { min: "0", max: "100" })),
      field("Crew Kit %", numIn("kit", _p.kit, "70px", function (v) { _p.kit = v; }, { min: "0", max: "100" })),
      el("div", { style: { paddingBottom: "7px" } }, [
        label("HEADCOUNT "),
        el("span.mono", { dataset: { pay: "split-hc", v: String(m.crew.headcount) }, text: String(m.crew.headcount) })
      ])
    ]));
    if (sp.fixerPct < flo || sp.fixerPct > fhi) {
      kids.push(help("Outside the book's " + flo + " to " + fhi + " percent for a fixer.", { color: "var(--warn)", margin: "0 0 8px" }));
    }
    kids.push(el("div.row.wrap", { style: { gap: "14px", alignItems: "center" } }, [
      money("THROUGH THE FIXER", sp.total, fmtG(sp.total), "var(--text)", "split-total"),
      money("FIXER", sp.fixer, fmtG(sp.fixer), "var(--ember, var(--danger))", "split-fixer"),
      money("CREW KIT", sp.kit, fmtG(sp.kit), "var(--flow, var(--accent))", "split-kit"),
      money("EACH SHARE", sp.each, fmtG(sp.each), "var(--success)", "split-each"),
      money("LEFT OVER", sp.over, fmtG(sp.over), sp.over ? "var(--gold)" : "var(--text3)", "split-over")
    ]));
    if (m.sTotal > 0) {
      kids.push(el("div.row.wrap", { style: { gap: "14px", alignItems: "center", marginTop: "10px" } }, [
        money("SALVAGE", ss.total, fmtG(ss.total), "var(--text)", "ssplit-total"),
        money("CREW KIT", ss.kit, fmtG(ss.kit), "var(--flow, var(--accent))", "ssplit-kit"),
        money("EACH SHARE", ss.each, fmtG(ss.each), "var(--success)", "ssplit-each"),
        money("LEFT OVER", ss.over, fmtG(ss.over), ss.over ? "var(--gold)" : "var(--text3)", "ssplit-over")
      ]));
    }
    var per = [money("EACH FREELANCER", m.eachG, fmtG(m.eachG), "var(--success)", "each-g")];
    if (m.nexus > 0) {
      per.push(money("NEXUS EACH", m.nexEach, fmtNx(m.nexEach), "var(--gold)", "each-nx"));
      if (m.nexOver > 0) per.push(money("NEXUS LEFT OVER", m.nexOver, fmtNx(m.nexOver), "var(--gold)", "nx-over"));
    }
    kids.push(el("div.row.wrap", { style: { gap: "14px", alignItems: "center", marginTop: "12px", paddingTop: "10px",
                                            borderTop: "1px solid var(--border2)" } }, per));
    if (sp.clamped) kids.push(help("A percentage past 0 to 100 was held at the edge, so no share can go below nothing.", { color: "var(--warn)" }));
    if (!m.crew.headcount) kids.push(help("No crew yet, so the split is for one. Set a headcount above.", { color: "var(--warn)" }));
    if (sp.over) kids.push(help(fmtG(sp.over) + " does not divide evenly.", { color: "var(--gold)" }));
    kids.push(help("The fixer's cut comes off the client's money, the contract and any bounties. Salvage is the crew's own sale and splits without it; the Crew Kit's percent applies to both."));
    if (EN.economy && EN.economy.splitNote) kids.push(help(EN.economy.splitNote));

    // the payday checklist, the book's own order
    var D = P().payday;
    if (D && Array.isArray(D.steps)) {
      kids.push(EN.ui.sectionTitle("Payday, in the book's order"));
      D.steps.forEach(function (s, i) {
        var on = _p.steps.indexOf(i) !== -1;
        kids.push(el("label", { style: { display: "flex", gap: "8px", alignItems: "flex-start", padding: "3px 0", cursor: "pointer",
                                         color: on ? "var(--text3)" : "var(--text)", textDecoration: on ? "line-through" : "none" } }, [
          el("input", { type: "checkbox", checked: on, dataset: { pay: "step-" + i }, onchange: function () {
            if (on) _p.steps = _p.steps.filter(function (x) { return x !== i; }); else _p.steps.push(i);
            refresh();
          } }),
          el("span", { text: (i + 1) + ". " + cap(s) })
        ]));
      });
    }
    return EN.ui.panel("The Split", "FIXER" + DOT + "CREW KIT" + DOT + "SHARES", kids);
  }

  /* ---- 6. experience ---------------------------------------------------- */
  function xpPanel(m) {
    var X = P().xp, kids = [];
    if (!_p.enc) kids.push(help("No encounter is being paid. Use the last encounter above, or enter an objective award.", { margin: "0 0 8px" }));
    m.threats.forEach(function (t) {
      var on = _p.noXp.indexOf(t.id) === -1;
      kids.push(el("label", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "3px 0", cursor: "pointer" } }, [
        el("input", { type: "checkbox", checked: on, dataset: { pay: "xp-" + t.id }, onchange: function () {
          if (on) _p.noXp.push(t.id); else _p.noXp = _p.noXp.filter(function (x) { return x !== t.id; });
          refresh();
        } }),
        el("span", { style: { flex: "1 1 auto", textDecoration: on ? "none" : "line-through", color: on ? "var(--text)" : "var(--text3)" },
          text: t.name }),
        el("span.mono", { style: { fontSize: "12px" }, text: commas(t.xp) + " XP" })
      ]));
    });
    var OA = X.objectiveAward || {};
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "8px" } }, [
      field("Objective award", numIn("objXp", _p.objXp, "100px", function (v) { _p.objXp = v; },
        { min: "0", placeholder: commas(OA.min) + " to " + commas(OA.max) })),
      money("EACH FREELANCER", m.xpTotal, commas(m.xpTotal) + " XP", "var(--accent)", "xp-total")
    ]));
    if (OA.minText) kids.push(help(cap(OA.minText) + ", " + OA.maxText + "."));
    // an earlier payday already wrote this fight's XP: it is not written again, override or not (F8)
    if (m.xpPaid && !m.paid) {
      kids.push(el("div.feature", { dataset: { pay: "xp-paid" }, style: { borderLeftColor: "var(--warn)", marginTop: "8px" } }, [
        el("p", { style: { margin: 0, color: "var(--warn)", fontWeight: 600 },
          text: titled("Payday", m.xpPaid.pd.title) + " already wrote this fight's XP to " + m.xpPaid.xpNames.join(", ") + "." }),
        help("CREDIT THE CREW leaves XP out, so one fight's XP is never paid twice. " + (m.xpPaid.imported
          ? "That payday came in with an imported GM backup, so it cannot be undone here."
          : "Undo that payday to pay the XP here instead."), { margin: "3px 0 0" })
      ]));
    }
    // the Table's AWARD XP already paid this fight's XP: say so, and write it again only on the GM's word
    if (m.tAward && !m.xpPaid) {
      kids.push(el("div.feature", { dataset: { pay: "xp-awarded" }, style: { borderLeftColor: "var(--warn)", marginTop: "8px" } }, [
        el("p", { style: { margin: 0, color: "var(--warn)", fontWeight: 600 },
          text: "The Table already awarded " + commas(m.tAward.total) + " XP for this fight" +
                (m.tAward.names.length ? " to " + m.tAward.names.join(", ") : "") + "." }),
        help(_p.xpAgain ? "CREDIT THE CREW writes the XP again, on top of that award."
                        : "CREDIT THE CREW leaves XP out, so it is not paid twice.", { margin: "3px 0 0" }),
        el("div.row.wrap", { style: { gap: "6px", marginTop: "6px" } }, [
          chip("WRITE XP HERE TOO", _p.xpAgain, "xp-again", function () { _p.xpAgain = !_p.xpAgain; refresh(); },
            "Credit this XP as well as the Table's award")
        ])
      ]));
    }
    var onXp = m.credit.filter(function (x) { return x.useXp; }), ms = m.credit.filter(function (x) { return !x.useXp; });
    if (m.credit.length) {
      kids.push(help(onXp.length ? "On XP, each takes the full total: " + onXp.map(function (x) { return x.name; }).join(", ") + "."
                                 : "Nobody here is on XP.", { color: "var(--text2)" }));
      if (ms.length) kids.push(el("p.help", { dataset: { pay: "xp-skip" }, style: { margin: "4px 0 0", color: "var(--text2)" },
        text: "On milestones, so no XP is written: " + ms.map(function (x) { return x.name; }).join(", ") + "." }));
    }
    kids.push(fold("xp", "The book on XP", [help(X.text, { margin: 0 }), help(X.milestone)]));
    return EN.ui.panel("Experience", "EVERY FREELANCER, THE FULL TOTAL", kids);
  }

  /* ---- 7. the Other Ledger ---------------------------------------------- */
  function ledgerPanel() {
    var L = P().ledger, kids = [help(L.text, { margin: "0 0 8px" })];
    (L.lines || []).forEach(function (line) {
      if (line.key !== "cred" && line.key !== "heat") return;
      kids.push(el("div", { style: { marginTop: "6px" } }, [
        field(line.name, textIn(line.key, _p[line.key], line.example, function (v) { _p[line.key] = v; }))
      ]));
    });
    return EN.ui.panel(L.name, "ONE LINE EACH", kids);
  }

  /* ---- 8. milestones ---------------------------------------------------- */
  /* AWARD MILESTONE (D1). The book's two lists from Milestones and Pacing to
     pick from, or the GM's own reason, for any crew member: the records on
     Milestone advancement are ticked first, and a record on XP can be ticked
     too. One writeCrew per Freelancer through the milestone op, which adds to
     ch.milestones.major or .minor, the counters the #PRINT tab's Milestone
     tracker keeps. Behind an armed confirm, logged in the ledger, tagged
     {source: "milestone", awardId, ...}, undoable, and on offer as copyable
     text for the crews whose records live on other devices.

     The pick is its own transient state (_ms), outside the payday form: an
     award is a write of its own, so it never makes the form read as unsaved
     and is never saved with a payday. What the form is paying only SUGGESTS a
     pick: an Incursion being priced suggests clearing one, and a job or a fight
     being paid suggests the item whose words name its difficulty column (the
     base column: a clause moves the price, not the job), through the book's
     byDifficulty. A Milk Run suggests nothing, because the page calls it rent.
     The last award and its UNDO MILESTONE are read off the ledger (liveWrites,
     by meta.awardId), so they survive a reload like every other undo here. */
  function freshMs() {
    return { key: null,                  // the picked item's key, "other" for the GM's own reason, or null
             kind: "major",             // the kind of the GM's own reason
             reason: "",                // the GM's own reason, as typed
             amount: "",                // how many, as typed; blank is one
             who: Object.create(null) };  // charId -> true or false, the GM's own ticks over the default
  }
  var _ms = freshMs();
  function MS() { return (P() && P().milestones) || null; }
  function msItems() { var M = MS(); return M ? (M.major || []).concat(M.minor || []) : []; }
  function msItem(key) {
    if (typeof key !== "string" || !key) return null;
    return msItems().filter(function (it) { return it && it.key === key; })[0] || null;
  }
  function kindName(k) { return k === "major" ? "Major" : "Minor"; }
  function msCount(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  // the PHB's pace as the page restates it: a Freelancer is ready when any one levelUp pair is reached
  function msReady(c) {
    return (MS().levelUp || []).some(function (p) { return c.major >= p.major && c.minor >= p.minor; });
  }
  function paceText() {
    return (MS().levelUp || []).map(function (p) {
      return p.minor ? p.major + " Major and " + p.minor + " Minor" : p.major + " Major";
    }).join(", or ");
  }
  function msNote(key) { return (MS().notes || []).filter(function (n) { return n && n.key === key; })[0] || null; }

  function msSuggest() {
    var M = MS();
    if (!M) return null;
    if (parseInt(_p.inc, 10) > 0) {
      var inc = msItem("incursion");
      return inc ? { key: inc.key, why: "This payday prices an Incursion." } : null;
    }
    if (!(_p.jobId || _p.enc || _p.paydayId)) return null;
    var d = _p.diff, by = isObj(M.byDifficulty) ? M.byDifficulty : {};
    if (!own(by, d)) return null;
    var why = "This payday is priced in the " + colName(d) + " column.";
    if (by[d] === null) return { key: null, rent: true, why: why };
    var hit = (M[by[d]] || []).filter(function (it) { return Array.isArray(it.difficulties) && it.difficulties.indexOf(d) !== -1; })[0];
    return hit ? { key: hit.key, why: why } : null;
  }

  /* Everything the panel shows, from _ms and the records. `amount` is null
     when what is typed is not a whole number of 1 or more (blank is one).
     A person's `next` is what their counters will read after the award. */
  function msModel(m) {
    var M = MS(), roster = (EN.store.roster && EN.store.roster()) || {};
    var item = msItem(_ms.key), other = _ms.key === "other";
    var kind = item ? item.kind : other ? (_ms.kind === "minor" ? "minor" : "major") : null;
    var reason = item ? item.text : other ? String(_ms.reason || "").trim() : "";
    var raw = String(_ms.amount == null ? "" : _ms.amount).trim();
    var n = raw === "" ? 1 : Number(raw);
    var amount = (isFinite(n) && n >= 1 && Math.floor(n) === n) ? n : null;
    var above = Number(M.majorOnlyAbove);
    var people = m.crew.members.filter(function (x) { return own(roster, x.charId) && isObj(roster[x.charId]); }).map(function (x) {
      var ch = roster[x.charId], ms = isObj(ch.milestones) ? ch.milestones : {};
      var useXp = ch.useXp === true;
      var on = own(_ms.who, x.charId) ? !!_ms.who[x.charId] : !useXp;
      var cur = { major: msCount(ms.major), minor: msCount(ms.minor) };
      var next = { major: cur.major, minor: cur.minor };
      if (on && kind && amount) next[kind] += amount;
      return { charId: x.charId, name: x.name, caliber: x.caliber, level: Number(ch.level) || 0, useXp: useXp, on: on,
               cur: cur, next: next, readyNow: msReady(cur), readyNext: msReady(next),
               pastCal: isFinite(above) && typeof x.caliber === "number" && x.caliber > above };
    });
    return { kind: kind, reason: reason, amount: amount, item: item, other: other, people: people,
             to: people.filter(function (p) { return p.on; }), ok: !!kind && !!reason && amount !== null, sugg: msSuggest() };
  }

  function msLabel(kind, amount, reason) {
    return "Milestone: " + (amount > 1 ? amount + " " : "") + kindName(kind) + (reason ? ", " + reason : "");
  }
  function stop(s) { s = String(s || ""); return /[.!?]$/.test(s) ? s : s + "."; }
  function joinNames(a) { return a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a[a.length - 1] : (a[0] || ""); }
  function msHead(kind, amount) {
    return "MILESTONE: " + (amount > 1 ? amount + " " : "") + kindName(kind).toUpperCase() + (amount > 1 ? " MILESTONES" : "");
  }
  // the award as text, before it is made: each ticked Freelancer's counter, from and to
  function msText(mm) {
    var other = mm.kind === "major" ? "minor" : "major";
    var L = [msHead(mm.kind, mm.amount), "For: " + stop(mm.reason)];
    mm.to.forEach(function (p) {
      L.push(p.name + ": " + kindName(mm.kind) + " " + p.cur[mm.kind] + " to " + p.next[mm.kind] + ", " +
        kindName(other) + " " + p.cur[other] + "." + (p.readyNext ? " Ready to level." : ""));
    });
    L.push("A Freelancer levels up after " + paceText() + ".");
    return L.join("\n");
  }

  /* THE AWARDS STILL STANDING, read off the ledger. An award is the writes
     sharing one awardId; its kind and amount are read from the ops written,
     and its reason from the tag. */
  function msOp(w) { return (Array.isArray(w.ops) ? w.ops : []).filter(function (o) { return o && o.op === "milestone"; })[0] || null; }
  function msGroups(ws) {
    var by = Object.create(null), out = [];
    ws.forEach(function (w) {
      var mt = metaOf(w), op = msOp(w);
      if (mt.source !== "milestone" || typeof mt.awardId !== "string" || !op) return;
      if (!own(by, mt.awardId)) {
        by[mt.awardId] = { id: mt.awardId, kind: op.kind, amount: Number(op.amount) || 1, reason: String(mt.reason || ""),
                           jobId: mt.jobId || null, at: w.at, writes: [] };
        out.push(by[mt.awardId]);
      }
      by[mt.awardId].writes.push(w);
    });
    // each award's writes in the order written (the lists come newest first)
    out.forEach(function (g) { g.writes.reverse(); g.names = g.writes.map(function (w) { return w.charName || "a Freelancer"; }); });
    return out;
  }
  function lastAward() { return msGroups(liveWrites())[0] || null; }
  function canUndoAward(id) {
    var u = gm.undoable(), mt = metaOf(u);
    return !!(u && mt.source === "milestone" && mt.awardId === id);
  }
  function awardText(g) {
    var roster = (EN.store.roster && EN.store.roster()) || {};
    var L = [msHead(g.kind, g.amount), "For: " + stop(g.reason)];
    g.writes.forEach(function (w) {
      var ch = roster[w.charId], ms = (ch && isObj(ch.milestones)) ? ch.milestones : {};
      var now = { major: msCount(ms.major), minor: msCount(ms.minor) };
      L.push((w.charName || "a Freelancer") + ": now Major " + now.major + ", Minor " + now.minor + "." + (msReady(now) ? " Ready to level." : ""));
    });
    L.push("A Freelancer levels up after " + paceText() + ".");
    return L.join("\n");
  }

  function awardMilestone() {
    var mm = msModel(model());
    if (!mm.ok || !mm.to.length) { toast("Pick a milestone and tick who it is for first."); refresh(); return; }
    var meta = { source: "milestone", awardId: gm.uid(), kind: mm.kind, amount: mm.amount,
                 key: mm.item ? mm.item.key : "other", reason: mm.reason,
                 jobId: _p.jobId || null, paydayId: _p.paydayId || null };
    var label = msLabel(mm.kind, mm.amount, mm.reason), done = [], refused = [];
    mm.to.forEach(function (p) {
      var id = gm.writeCrew(p.charId, label, { op: "milestone", kind: mm.kind, amount: mm.amount }, meta);
      if (id) done.push(p.name); else refused.push(p.name);
    });
    if (!done.length) {
      toast(refused.length ? "Nothing was written: the records refused it." : "Nothing to award.");
      EN.app.render();
      return;
    }
    // the pick is spent; who is ticked stays for the next award
    var who = _ms.who;
    _ms = freshMs();
    _ms.who = who;
    toast("Milestone awarded: " + (mm.amount > 1 ? mm.amount + " " : "") + kindName(mm.kind) + " to " + joinNames(done) + "." +
      (refused.length ? " Refused: " + refused.join(", ") + "." : "") + " UNDO MILESTONE takes it back.");
    EN.app.render();
  }

  /* UNDO MILESTONE walks the award's writes back newest first, while the
     newest undoable write is one of them; a newer write on top stops it, the
     same rule UNDO PAYDAY keeps. */
  function undoAward(id) {
    if (!canUndoAward(id)) { toast("A newer write sits on top of this award. Undo that first."); EN.app.render(); return; }
    var n = 0, guard = 0, refused = false;
    while (canUndoAward(id) && guard < 500) {
      guard += 1;
      var r = gm.undoLast();
      if (!r) { refused = r === false; break; }
      n += 1;
    }
    var left = liveWrites(function (w) { return metaOf(w).awardId === id; }).length;
    toast(!left ? "Milestone undone: " + n + " " + plural(n, "record") + " put back as they were."
      : refused ? (n ? "Undid " + n + " of the award's writes. " : "") + "This device refused to save the next undo, so the rest of the award stands."
      : "Undid " + n + " of the award's writes. A newer write sits on top of the rest.");
    EN.app.render();
  }

  function msRow(it, suggested) {
    var on = _ms.key === it.key;
    return el("label", { style: { display: "flex", gap: "8px", alignItems: "flex-start", padding: "4px 0", cursor: "pointer",
                                  borderBottom: "1px solid var(--border)" } }, [
      el("input", { type: "radio", name: "pay-ms-pick", checked: on, dataset: { pay: "ms-pick-" + it.key }, style: { marginTop: "3px" },
        onchange: function () { _ms.key = it.key; refresh(); } }),
      el("span", { style: { flex: "1 1 auto", minWidth: 0, color: on ? "var(--accent)" : "var(--text)", fontWeight: on ? 600 : 400 }, text: it.text }),
      suggested ? el("span.chip", { dataset: { pay: "ms-suggested" },
        style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)", flex: "0 0 auto" }, text: "SUGGESTED" }) : null
    ]);
  }

  function msPersonRow(p, mm) {
    var counts = "Major " + p.cur.major + DOT + "Minor " + p.cur.minor;
    var moves = p.on && mm.kind && mm.amount !== null;
    var ready = moves ? p.readyNext : p.readyNow;
    return el("label", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "3px 0", cursor: "pointer", flexWrap: "wrap" } }, [
      el("input", { type: "checkbox", checked: p.on, dataset: { pay: "ms-who-" + p.charId }, onchange: function () {
        _ms.who[p.charId] = !p.on;
        refresh();
      } }),
      el("span", { style: { fontWeight: 600, color: p.on ? "var(--text)" : "var(--text3)" }, text: p.name }),
      el("span.chip", { style: { fontSize: "9.5px" }, text: (p.useXp ? "XP" : "MILESTONES") + DOT + (p.caliber ? "C" + p.caliber : "C?") + DOT + "L" + (p.level || "?") }),
      el("span.help", { dataset: { pay: "ms-count-" + p.charId }, style: { margin: 0 },
        text: counts + (moves ? " → " + kindName(mm.kind) + " " + p.next[mm.kind] : "") }),
      ready ? el("span.chip.on", { dataset: { pay: "ms-ready-" + p.charId }, style: { fontSize: "9.5px" }, text: "READY TO LEVEL" }) : null
    ]);
  }

  function msPanel(m) {
    var M = MS();
    if (!M) return null;
    var mm = msModel(m), sg = mm.sugg, kids = [];
    kids.push(help(M.lead, { margin: "0 0 10px" }));

    // what this payday suggests
    if (sg && sg.key) {
      var si = msItem(sg.key);
      kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "8px" } }, [
        el("span.help", { dataset: { pay: "ms-suggest" }, style: { margin: 0, color: "var(--gold)", flex: "1 1 220px", minWidth: 0 },
          text: sg.why + " Suggested from the " + kindName(si.kind) + " list: \"" + si.text + "\"." }),
        _ms.key !== si.key ? el("button.btn.sm", { dataset: { pay: "ms-use-suggest" }, onclick: function () { _ms.key = si.key; refresh(); } }, "PICK IT") : null
      ]));
    }

    // the two lists, the table's columns top to bottom
    kids.push(el("div.row.wrap", { style: { gap: "14px", alignItems: "flex-start" } }, (M.columns || []).map(function (c) {
      return el("div", { style: { flex: "1 1 260px", minWidth: 0 } }, [el("div", { style: { marginBottom: "2px" } }, [label(c.name)])].concat((M[c.kind] || []).map(function (it) {
        return msRow(it, !!(sg && sg.key === it.key));
      })));
    })));
    if (M.notMilestone) {
      var rent = !!(sg && sg.rent);
      kids.push(el("p.help", { dataset: { pay: "ms-rent" }, style: { margin: "6px 0 0", color: rent ? "var(--gold)" : "var(--text3)" },
        text: (rent ? sg.why + " " : "") + M.notMilestone.text }));
    }

    // the GM's own reason
    var otherOn = mm.other;
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [
      el("label", { style: { display: "flex", gap: "6px", alignItems: "center", cursor: "pointer", flex: "0 0 auto" } }, [
        el("input", { type: "radio", name: "pay-ms-pick", checked: otherOn, dataset: { pay: "ms-pick-other" },
          onchange: function () { _ms.key = "other"; refresh(); } }),
        el("span", { text: "Something else" })
      ]),
      el("div", { style: { flex: "1 1 200px", minWidth: 0 } }, [
        textIn("msReason", _ms.reason, "What the milestone was for", function (v) { _ms.reason = v; _ms.key = "other"; })
      ]),
      chip("MAJOR", otherOn && _ms.kind !== "minor", "ms-kind-major", function () { _ms.kind = "major"; _ms.key = "other"; refresh(); }),
      chip("MINOR", otherOn && _ms.kind === "minor", "ms-kind-minor", function () { _ms.kind = "minor"; _ms.key = "other"; refresh(); })
    ]));

    // who it is for
    kids.push(EN.ui.sectionTitle("Who it is for"));
    if (!mm.people.length) kids.push(help("No Freelancer records on this device. Copy the milestone to the crew instead.", { margin: 0 }));
    mm.people.forEach(function (p) { kids.push(msPersonRow(p, mm)); });
    var onXp = mm.to.filter(function (p) { return p.useXp; });
    if (onXp.length) {
      kids.push(el("p.help", { dataset: { pay: "ms-onxp" }, style: { margin: "4px 0 0", color: "var(--text2)" },
        text: "On XP, so their #PRINT tab shows milestone counts only once the record is switched to Milestone mode: " +
              joinNames(onXp.map(function (p) { return p.name; })) + "." }));
    }
    var slow = msNote("slowDown"), past = mm.to.filter(function (p) { return p.pastCal; });
    if (slow && mm.kind === "minor" && past.length) {
      kids.push(el("p.help", { dataset: { pay: "ms-slow" }, style: { margin: "4px 0 0", color: "var(--warn)" },
        text: joinNames(past.map(function (p) { return p.name; })) + " " + plural(past.length, "is", "are") + " past Caliber " +
              M.majorOnlyAbove + ". " + slow.text }));
    }
    var awk = msNote("awakening");
    var awkTo = mm.to.filter(function (p) { return awk && p.readyNext && mm.kind && mm.amount !== null && p.level === Number(awk.level) - 1; });
    if (awkTo.length) {
      kids.push(el("p.help", { dataset: { pay: "ms-awakening" }, style: { margin: "4px 0 0", color: "var(--accent)" },
        text: joinNames(awkTo.map(function (p) { return p.name; })) + " will be ready for Level " + awk.level + ". " +
              awk.name + " " + awk.text }));
    }
    // earlier awards for the job this payday pays, still standing (imported ones included: they are paid)
    if (_p.jobId) {
      msGroups(paidWrites()).filter(function (g) { return g.jobId === _p.jobId; }).forEach(function (g) {
        kids.push(el("p.help", { dataset: { pay: "ms-job-" + g.id }, style: { margin: "4px 0 0", color: "var(--warn)" },
          text: "Already awarded for this job: " + (g.amount > 1 ? g.amount + " " : "") + kindName(g.kind) + ", " + g.reason +
                ", to " + joinNames(g.names) + " (" + stamp(g.at) + ")." }));
      });
    }

    // how many, the award, and the same award as text
    var text = mm.ok ? msText(mm) : "";
    var awardBtn;
    if (mm.ok && mm.to.length) {
      // keyed on the whole award, so changing any part of it disarms the button instead of confirming the new one
      var key = "pay:ms-award:" + mm.kind + ":" + _ms.key + ":" + mm.amount + ":" + mm.to.map(function (p) { return p.charId; }).join(",") + ":" + mm.reason;
      var many = mm.amount > 1 ? mm.amount + " " + kindName(mm.kind) + " Milestones" : "1 " + kindName(mm.kind) + " Milestone";
      awardBtn = EN.ui.armButton(key, {
        cls: ".btn.sm", label: "AWARD MILESTONE", armedLabel: "AWARD TO " + mm.to.length + "?",
        title: "Add this milestone to each ticked record",
        armedTitle: "Adds " + many + " to " + joinNames(mm.to.map(function (p) { return p.name; })) + ". UNDO MILESTONE takes it back.",
        onConfirm: awardMilestone
      });
      awardBtn.setAttribute("data-pay", "ms-award");
      if (!EN.ui.isArmed(key)) { awardBtn.style.color = "var(--accent)"; awardBtn.style.borderColor = "var(--accent)"; }
    } else {
      awardBtn = el("button.btn.sm", { disabled: true, dataset: { pay: "ms-award" },
        title: !mm.kind ? "Pick a milestone first" : !mm.reason ? "Say what the milestone was for" : mm.amount === null ? "How many is a whole number, 1 or more"
          : "Tick who it is for" }, "AWARD MILESTONE");
    }
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "10px" } }, [
      field("How many", numIn("msAmt", _ms.amount, "70px", function (v) { _ms.amount = v; }, { min: "1", step: "1", placeholder: "1" })),
      awardBtn,
      el("button.btn.sm", { dataset: { pay: "ms-copy" }, disabled: !mm.ok, title: mm.ok ? "Copy this milestone as text" : "Pick a milestone first",
        onclick: function () { copyText(text, "The milestone"); } }, "COPY")
    ]));
    if (mm.amount === null) kids.push(help("How many is a whole number, 1 or more.", { color: "var(--warn)" }));
    if (mm.ok) {
      kids.push(el("div.mono", { dataset: { pay: "ms-text" },
        style: { whiteSpace: "pre-wrap", fontSize: "12px", lineHeight: "1.5", background: "var(--bg2)", border: "1px solid var(--border2)",
                 borderRadius: "4px", padding: "10px 12px", marginTop: "8px", userSelect: "text", overflowWrap: "anywhere" }, text: text }));
    } else if (mm.other && !mm.reason) {
      kids.push(help("Type what the milestone was for to award it."));
    } else if (!mm.kind) {
      kids.push(help("Pick a milestone from the lists, or type your own, to award it."));
    }

    // the last award still standing, with its own undo
    var la = lastAward();
    if (la) {
      var lt = awardText(la), lbl = msLabel(la.kind, la.amount, la.reason);
      var undo = canUndoAward(la.id)
        ? EN.ui.armButton("pay:ms-undo:" + la.id, { cls: ".btn.sm.danger", label: "↶ UNDO MILESTONE", armedLabel: "UNDO IT?",
            title: "Take this milestone back off the records it was written to",
            armedTitle: "Takes " + lbl + " back off " + joinNames(la.names) + "'s " + plural(la.names.length, "record") + ".",
            onConfirm: function () { undoAward(la.id); } })
        : el("span.help", { style: { margin: 0 }, text: "A newer write sits on top, so this award can no longer be undone from here." });
      if (undo.tagName === "BUTTON") undo.setAttribute("data-pay", "ms-undo");
      kids.push(el("div.feature", { dataset: { pay: "ms-last" }, style: { borderLeftColor: "var(--success)", marginTop: "10px" } }, [
        el("p", { style: { margin: 0, color: "var(--success)", fontWeight: 600 },
          text: "Last milestone award: " + (la.amount > 1 ? la.amount + " " : "") + kindName(la.kind) + ", " + la.reason + ", to " +
                joinNames(la.names) + ", " + stamp(la.at) + "." }),
        el("div.row.wrap", { style: { gap: "8px", marginTop: "6px", alignItems: "center" } }, [
          el("button.btn.sm", { dataset: { pay: "ms-last-copy" }, onclick: function () { copyText(lt, "The milestone"); } }, "COPY"),
          undo
        ])
      ]));
    }

    // the book on pacing
    var ref = [help(M.pace, { margin: 0 })];
    if (M.notesLead) ref.push(help(M.notesLead));
    (M.notes || []).forEach(function (nt) {
      var p = el("p.help", { style: { margin: "4px 0 0" } });
      p.appendChild(el("span", { style: { fontWeight: 600 }, text: nt.name + " " }));
      p.appendChild(document.createTextNode(nt.text));
      ref.push(p);
    });
    kids.push(fold("milestones", "The book on pacing", ref));
    return EN.ui.panel(M.name, "MAJOR" + DOT + "MINOR" + DOT + "PACING", kids);
  }

  /* ---- 9. the payday: summary, save, credit, undo ----------------------- */
  function signed(n) { return n > 0 ? "+" + n : String(n); }
  function summaryText(m) {
    var L = [], q = m.q, sp = m.split, ss = m.sSplit;
    L.push(titled("PAYDAY", m.title));
    var names = m.crew.members.map(function (x) { return x.name; });
    L.push("Crew: " + m.crew.headcount + " at Caliber " + m.crew.caliber + (names.length ? " (" + names.join(", ") + ")" : "") + ".");
    L.push("Contract: " + q.name + " at Caliber " + q.caliber +
      (q.shift ? " (from " + q.baseName + ", clauses " + signed(q.shift) + (q.clamped ? ", held at the grid's edge" : "") + ")" : "") +
      ", printed " + q.band + ". Total " + fmtG(m.contract) + ".");
    if (m.nexus > 0) L.push("Nexus: " + fmtNx(m.nexus) + ".");
    m.bounties.forEach(function (b) {
      L.push("Bounty: " + b.name + ", " + commas(b.xp) + " XP at " + fmtG(b.rate) + " per XP" + (b.alive ? ", alive" : "") + ": " + fmtG(b.value) + ".");
    });
    m.salvage.forEach(function (s) { L.push("Salvage: " + s.name + ": " + fmtG(s.value) + "."); });
    L.push("Split: " + fmtG(sp.total) + " through the fixer. Fixer " + sp.fixerPct + " percent, " + fmtG(sp.fixer) +
      ". Crew Kit " + sp.kitPct + " percent, " + fmtG(sp.kit) + ". " + fmtG(sp.each) + " each, " + fmtG(sp.over) + " left over.");
    if (m.sTotal > 0) {
      L.push("Salvage split: " + fmtG(ss.total) + (ss.kit ? ", Crew Kit " + fmtG(ss.kit) : "") + ". " +
        fmtG(ss.each) + " each, " + fmtG(ss.over) + " left over.");
    }
    L.push("Each Freelancer: " + fmtG(m.eachG) + (m.nexEach > 0 ? " and " + fmtNx(m.nexEach) : "") + ".");
    if (m.xpTotal > 0) {
      L.push("XP: " + commas(m.xpTotal) + " to every Freelancer on XP" +
        (m.xpPaid && !m.xpWrite ? ", already paid with " + titled("Payday", m.xpPaid.pd.title) + "."
          : m.tAward && !m.xpWrite ? ", already awarded at the Table." : ". Milestone tables skip it."));
    }
    if ((_p.cred || "").trim()) L.push("Cred: " + _p.cred.trim());
    if ((_p.heat || "").trim()) L.push("Heat: " + _p.heat.trim());
    return L.join("\n");
  }
  // the #POST pay stub: what this one Freelancer got, in their own inbox
  function stubText(m, x) {
    var L = [titled("Payday", m.title), "Your share: " + fmtG(m.eachG)];
    if (m.nexEach > 0) L.push("Nexus: " + fmtNx(m.nexEach));
    if (m.xpTotal > 0) {
      L.push(!x.useXp ? "XP: none, you level on milestones"
        : m.xpWrite > 0 ? "XP: " + commas(m.xpWrite)
        : m.xpPaid ? "XP: " + commas(m.xpTotal) + ", paid with an earlier payday"
        : "XP: " + commas(m.xpTotal) + ", awarded at the Table");
    }
    if ((_p.cred || "").trim()) L.push("Cred: " + _p.cred.trim());
    if ((_p.heat || "").trim()) L.push("Heat: " + _p.heat.trim());
    return L.join("\n");
  }
  function opsFor(m, x, now) {
    var ops = [];
    if (m.eachG > 0) ops.push({ op: "glimmer", amount: m.eachG });
    if (m.nexEach > 0) ops.push({ op: "nexus", amount: m.nexEach });
    // D5, and only on an XP table: a milestone record never takes XP. xpWrite is
    // 0 when the Table's AWARD XP already paid this fight's (see tableAward)
    if (x.useXp && m.xpWrite > 0) ops.push({ op: "xp", amount: m.xpWrite });
    if (_p.stub) ops.push({ op: "post", mail: { from: "Payroll", subj: titled("Payday", m.title), when: clock(now), body: stubText(m, x) } });
    return ops;
  }
  function recordFrom(m) {
    return {
      kind: "payday", at: Date.now(), jobId: _p.jobId || null, title: m.title,
      // the fight this payday paid, by its snapshot's stamp: the Table's XP award reads it to avoid paying XP twice
      encounterAt: (_p.enc && typeof _p.enc.at === "number") ? _p.enc.at : null,
      crew: m.credit.map(function (x) { return { charId: x.charId, name: x.name }; }),
      headcount: m.crew.headcount,
      contract: { caliber: m.q.caliber, difficulty: m.q.key, base: m.q.base, shifts: copy(_p.shifts) || {}, shift: m.q.shift,
                  clamped: m.q.clamped, band: m.q.band, total: m.contract, nexus: m.nexus },
      bounties: { lines: copy(m.bounties), total: m.bTotal },
      salvage: { lines: copy(m.salvage), total: m.sTotal, split: copy(m.sSplit) },
      fixerPct: m.split.fixerPct, kitPct: m.split.kitPct,
      split: copy(m.split),
      nexus: { total: m.nexus, each: m.nexEach, over: m.nexOver },
      each: { glimmer: m.eachG, nexus: m.nexEach },
      xp: { total: m.xpTotal, each: m.xpTotal, objective: m.xpObj, written: m.xpWrite,
            tableAward: m.tAward ? m.tAward.total : 0 },
      ledgerLines: { cred: (_p.cred || "").trim(), heat: (_p.heat || "").trim() },
      writeIds: [], credited: false, undone: false,
      summary: summaryText(m),
      form: copy(_p)
    };
  }

  function savePayday() {
    var m = model(), prev = m.rec;
    if (m.paid) { toast("This payday is credited. Undo it, or start a new payday."); return; }
    var r = recordFrom(m);
    if (prev) r.id = prev.id;
    _p.paydayId = gm.put("ledger", r, { silent: true });
    settle();
    toast("Payday saved: " + m.title + ".");
    EN.app.render();
  }

  /* A paid job is marked paid with this payday's id; what it said before is
     kept on the payday, so UNDO PAYDAY can put it back exactly. */
  function markJobPaid(pdId) {
    var j = job();
    if (!j) return null;
    var prev = { status: typeof j.status === "string" ? j.status : "", paydayId: typeof j.paydayId === "string" ? j.paydayId : null };
    var next = copy(j);
    next.status = "paid";
    next.paydayId = pdId;
    gm.put("jobs", next, { silent: true });
    return prev;
  }
  function unmarkJob(pd) {
    if (typeof pd.jobId !== "string" || !pd.jobId) return;
    var j = gm.rec("jobs", pd.jobId);
    if (!j || j.paydayId !== pd.id) return;
    var prev = isObj(pd.jobPrev) ? pd.jobPrev : null, next = copy(j);
    next.status = (prev && prev.status) ? prev.status : "done";
    next.paydayId = (prev && prev.paydayId) ? prev.paydayId : null;
    gm.put("jobs", next, { silent: true });
  }

  /* CREDIT THE CREW (D1). One writeCrew per Freelancer: their share of Glimmer,
     their share of Nexus, the full XP if their record is on XP, and the pay
     stub. Each write is its own ledger record, tagged with this payday's id,
     the fight and the job (meta), and the payday keeps their ids, which is what
     UNDO PAYDAY walks back. With an earlier payday still standing for the same
     fight or job (F8) it writes nothing unless `again` is the GM's armed
     CREDIT ANYWAY. */
  function credit(again) {
    var m = model();
    if (m.paid) { toast("This payday is already credited."); return; }
    if (!m.credit.length) { toast("Nobody on this device to credit. Copy the summary instead."); return; }
    if (m.dup && again !== true) {
      toast("Held: " + titled("Payday", m.dup.pd.title) + " already paid this " + (m.dup.fight ? "fight" : "job") + ". CREDIT ANYWAY pays it again.");
      EN.app.render();
      return;
    }
    // the id is minted before the writes, so every write can carry it
    var pdId = m.rec ? m.rec.id : gm.uid();
    var meta = { source: "payday", paydayId: pdId, encounterAt: m.encAt, jobId: _p.jobId || null };
    var label = titled("Payday", m.title), now = Date.now(), ids = [], paid = [], refused = [];
    m.credit.forEach(function (x) {
      var ops = opsFor(m, x, now);
      if (!ops.length) return;
      var id = gm.writeCrew(x.charId, label, ops, meta);
      if (id) { ids.push(id); paid.push(x); } else refused.push(x.name);
    });
    if (!ids.length) {
      toast(refused.length ? "Nothing was written: the records refused it." : "Nothing to credit on this payday.");
      EN.app.render();
      return;
    }
    _p.paydayId = pdId;
    var jobPrev = markJobPaid(pdId);
    var r = recordFrom(m);
    r.id = pdId;
    r.crew = paid.map(function (x) { return { charId: x.charId, name: x.name }; });
    r.writeIds = ids;
    r.credited = true;
    r.creditedAt = now;
    r.jobPrev = jobPrev;
    gm.put("ledger", r, { silent: true });
    settle();
    var xpN = paid.filter(function (x) { return x.useXp; }).length;
    toast("Credited " + paid.length + " " + plural(paid.length, "Freelancer") + ": " + fmtG(m.eachG) + " each" +
      (m.nexEach > 0 ? ", " + fmtNx(m.nexEach) + " Nexus" : "") +
      (m.xpWrite > 0 && xpN ? ", " + commas(m.xpWrite) + " XP to " + xpN + " on XP" : "") +
      (_p.stub ? ", and a pay stub" : "") + (refused.length ? ". Refused: " + refused.join(", ") : "") + ".");
    EN.app.render();
  }

  // UNDO PAYDAY is live while the newest undoable write is one of this payday's
  function canUndo(pd) {
    if (!pd || !Array.isArray(pd.writeIds) || !pd.writeIds.length) return false;
    var u = gm.undoable();
    return !!(u && pd.writeIds.indexOf(u.id) !== -1);
  }
  // a payday whose writes all came in with an imported backup: paid, but never undoable here (F6)
  function importedPayday(pd) {
    var ids = (pd && Array.isArray(pd.writeIds)) ? pd.writeIds : [];
    return ids.length > 0 && ids.every(function (id) { var w = gm.rec("ledger", id); return !!(w && w.imported); });
  }
  function undoPayday(pdId) {
    var pd = gm.rec("ledger", pdId);
    if (!canUndo(pd)) { toast("A newer write sits on top of this payday. Undo that first."); return; }
    var n = 0, guard = 0, refused = false;
    while (canUndo(pd) && guard < 500) {
      guard += 1;
      // false (not null) is this device refusing to save the undo (F5): nothing changed
      var r = gm.undoLast();
      if (!r) { refused = r === false; break; }
      n += 1;
    }
    /* what still stands, by the ledger (F10): a write to a record deleted since
       went with the record, so it is not left; an imported one cannot be undone
       here but is still paid, so the payday stays credited while one stands
       (the same rule reconcile() keeps) */
    var standing = Object.create(null);
    paidWrites().forEach(function (w) { standing[w.id] = true; });
    var left = pd.writeIds.filter(function (id) { return own(standing, id); });
    var next = copy(pd);
    if (!left.length) {
      next.undone = true;
      next.undoneAt = Date.now();
      next.credited = false;
      unmarkJob(pd);
    }
    gm.put("ledger", next, { silent: true });
    toast(!left.length ? "Payday undone: " + n + " " + plural(n, "record") + " put back as they were."
      : refused ? (n ? "Undid " + n + " of " + pd.writeIds.length + " writes. " : "") + "This device refused to save the next undo, so the rest of the payday stands."
      : "Undid " + n + " of " + pd.writeIds.length + " writes. A newer write sits on top of the rest.");
    EN.app.render();
  }

  function openPayday(pd) {
    _p = restoreForm(pd.form);
    if (!isObj(pd.form)) { _p.title = String(pd.title || ""); _p.jobId = typeof pd.jobId === "string" ? pd.jobId : null; }
    _p.paydayId = pd.id;
    settle();
  }
  /* OPEN, armed while the form has changes that are not saved (F18): one click
     used to replace typed bounties, salvage and a typed total with no word. */
  function openButton(pd, pay, label) {
    function go() { openPayday(pd); EN.app.render(); }
    if (!dirty()) return el("button.btn.sm", { dataset: { pay: pay }, title: "Open this payday in the form", onclick: go }, label);
    var b = EN.ui.armButton("pay:open:" + pay, { cls: ".btn.sm", label: label, armedLabel: "DISCARD THE FORM?",
      title: "Open this payday in the form",
      armedTitle: "The form has changes that are not saved. Opening this payday replaces them.", onConfirm: go });
    b.setAttribute("data-pay", pay);
    return b;
  }

  function summaryPanel(m) {
    var kids = [], rec = m.rec, text = summaryText(m);
    if (rec && rec.credited && !rec.undone) {
      kids.push(el("div.feature", { dataset: { pay: "credited" }, style: { borderLeftColor: "var(--success)" } }, [
        el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
          el("span", { style: { color: "var(--success)", fontWeight: 600 },
            text: "Credited " + stamp(rec.creditedAt || rec.at) + " to " + (rec.crew || []).length + " " + plural((rec.crew || []).length, "Freelancer") + "." }),
          canUndo(rec) ? el("button.btn.sm.danger", { dataset: { pay: "undo-payday" }, onclick: function () { undoPayday(rec.id); } }, "↶ UNDO PAYDAY")
                       : el("span.help", { style: { margin: 0 }, text: importedPayday(rec)
                           ? "It came in with an imported GM backup, so it cannot be undone here."
                           : "A newer write sits on top, so this payday can no longer be undone from here." })
        ]),
        help("Changes made below now are not paid. Undo the payday to change it, or start a new one.")
      ]));
    } else if (rec && rec.undone) {
      kids.push(help("This payday was credited and then undone. Credit it again when it is right.", { color: "var(--text2)", margin: "0 0 8px" }));
    }

    kids.push(el("div.mono", { dataset: { pay: "summary" },
      style: { whiteSpace: "pre-wrap", fontSize: "12px", lineHeight: "1.5", background: "var(--bg2)", border: "1px solid var(--border2)",
               borderRadius: "4px", padding: "10px 12px", userSelect: "text", overflowWrap: "anywhere" }, text: text }));
    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
      el("button.btn.sm", { dataset: { pay: "copy" }, onclick: function () { copyText(text, "The payday summary"); } }, "COPY")
    ]));

    // who gets credited on this device
    kids.push(EN.ui.sectionTitle("Credit the crew"));
    var all = m.crew.members, roster = (EN.store.roster && EN.store.roster()) || {};
    if (!all.length) kids.push(help("No Freelancer records on this device. Copy the summary to the crew instead.", { margin: 0 }));
    all.forEach(function (x) {
      var on = _p.noCredit.indexOf(x.charId) === -1;
      var ch = roster[x.charId], onXp = !!(ch && ch.useXp === true);
      var gets = fmtG(m.eachG) + (m.nexEach > 0 ? DOT + fmtNx(m.nexEach) : "") +
        (m.xpTotal > 0 ? DOT + (!onXp ? "milestones, no XP" : m.xpWrite > 0 ? commas(m.xpWrite) + " XP"
          : m.xpPaid ? "XP already paid" : "XP already awarded") : "");
      kids.push(el("label", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "3px 0", cursor: "pointer", flexWrap: "wrap" } }, [
        el("input", { type: "checkbox", checked: on, dataset: { pay: "cc-" + x.charId }, onchange: function () {
          if (on) _p.noCredit.push(x.charId); else _p.noCredit = _p.noCredit.filter(function (k) { return k !== x.charId; });
          refresh();
        } }),
        el("span", { style: { fontWeight: 600, color: on ? "var(--text)" : "var(--text3)" }, text: x.name }),
        el("span.help", { style: { margin: 0 }, text: on ? gets : "not credited here" })
      ]));
    });
    if (m.credit.length && m.credit.length !== m.crew.headcount) {
      kids.push(help("The split is for " + m.crew.headcount + "; " + m.credit.length + " " + plural(m.credit.length, "is", "are") +
        " credited here. Copy the summary for the rest.", { color: "var(--warn)" }));
    }
    kids.push(el("div.row.wrap", { style: { gap: "6px", marginTop: "8px", alignItems: "center" } }, [
      chip("#POST PAY STUB " + (_p.stub ? "ON" : "OFF"), _p.stub, "stub", function () { _p.stub = !_p.stub; refresh(); },
        "Also file a pay stub in each credited Freelancer's #POST")
    ]));

    /* AN EARLIER PAYDAY STILL STANDS for this fight or job (F8): it is named,
       CREDIT THE CREW is held, and paying again takes the GM's own armed CREDIT
       ANYWAY, a separate button, so the usual two clicks cannot pay twice. */
    var canCredit = !m.paid && m.credit.length > 0;
    var held = canCredit && !!m.dup;
    if (held) {
      /* every earlier payday that matches is named, the newest first, so an
         older one that paid the fight is not hidden behind a newer one that
         paid only the job */
      var d = m.dup, all = [d].concat(d.others || []);
      var whatOf = function (h) { return h.fight && h.job ? "this fight and this job" : h.fight ? "this fight" : "this job"; };
      var lineOf = function (h) { return titled("Payday", h.pd.title) + ", credited " + stamp(h.pd.creditedAt || h.pd.at) + ", paid " + whatOf(h) + "."; };
      var titles = all.map(function (h) { return titled("Payday", h.pd.title); });
      var onTop = titles.length > 1 ? titles.slice(0, -1).join(", ") + " and " + titles[titles.length - 1] : titles[0];
      var many = all.length > 1;
      var allImported = !all.some(function (h) { return !h.imported; });
      var xpBy = !m.xpPaid ? "" : (m.xpPaid === d && !many) ? "that payday" : titled("Payday", m.xpPaid.pd.title);
      var again = EN.ui.armButton("pay:credit-anyway", {
        cls: ".btn.sm", label: "CREDIT ANYWAY", armedLabel: "PAY " + m.credit.length + " AGAIN?",
        title: "Credit this payday as well as the earlier " + (many ? "ones" : "one"),
        armedTitle: "Writes this payday to " + m.credit.length + " " + plural(m.credit.length, "record") + " on top of " +
          onTop + (m.xpPaid ? ", without the fight's XP" : "") + ". UNDO PAYDAY puts them back.",
        onConfirm: function () { credit(true); }
      });
      again.setAttribute("data-pay", "credit-anyway");
      var dupKids = [el("p", { style: { margin: 0, color: "var(--warn)", fontWeight: 600 }, text: "Already paid: " + lineOf(d) })];
      (d.others || []).forEach(function (h) {
        dupKids.push(el("p", { style: { margin: "2px 0 0", color: "var(--warn)", fontWeight: 600 }, text: "Also paid: " + lineOf(h) }));
      });
      dupKids.push(help("CREDIT THE CREW is held so the crew is not paid twice. " +
        (allImported
          ? (many ? "Those paydays" : "That payday") + " came in with an imported GM backup, so " + (many ? "they" : "it") +
            " cannot be undone here. Credit anyway"
          : "Undo " + (many ? "those paydays" : "that payday") + " to pay this one instead, or credit anyway") +
        (m.xpPaid ? " (the fight's XP stays out: " + xpBy + " wrote it)." : "."), { margin: "3px 0 0" }));
      dupKids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "6px" } }, [openButton(d.pd, "dup-open", "OPEN IT"), again]));
      kids.push(el("div.feature", { dataset: { pay: "dup" }, style: { borderLeftColor: "var(--warn)", marginTop: "10px" } }, dupKids));
    }
    var creditBtn;
    if (canCredit && !held) {
      creditBtn = EN.ui.armButton("pay:credit", {
        cls: ".btn.sm", label: "CREDIT THE CREW", armedLabel: "CREDIT " + m.credit.length + "?",
        title: "Write each share to the crew's records", armedTitle: "Writes Glimmer, Nexus, XP and the pay stub to " + m.credit.length +
          " " + plural(m.credit.length, "record") + ". UNDO PAYDAY puts them back.",
        onConfirm: function () { credit(false); }
      });
      creditBtn.setAttribute("data-pay", "credit");
      if (!EN.ui.isArmed("pay:credit")) { creditBtn.style.color = "var(--success)"; creditBtn.style.borderColor = "var(--success)"; }
    } else {
      creditBtn = el("button.btn.sm", { disabled: true, dataset: { pay: "credit" },
        title: m.paid ? "Already credited" : held ? "Held: an earlier payday already paid this" : "Nobody on this device to credit" },
        m.paid ? "CREDITED" : "CREDIT THE CREW");
    }
    // a new payday keeps the GM's fixer and Crew Kit percentages and the stub choice
    var newBtn = EN.ui.armButton("pay:new", { label: "NEW PAYDAY", armedLabel: "CLEAR THE FORM?",
      armedTitle: "Clears this form. Saved and credited paydays stay in the list below.",
      onConfirm: function () {
        var keep = { fixer: _p.fixer, kit: _p.kit, stub: _p.stub };
        _p = fresh();
        _p.fixer = keep.fixer; _p.kit = keep.kit; _p.stub = keep.stub;
        settle();
        EN.app.render();
      } });
    newBtn.setAttribute("data-pay", "new-payday");
    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "10px" } }, [
      el("button.btn.sm.primary", { dataset: { pay: "save-payday" }, disabled: m.paid,
        title: m.paid ? "Already credited" : "File this payday in the ledger without writing to anyone",
        onclick: savePayday }, rec ? "SAVE CHANGES" : "SAVE PAYDAY"),
      creditBtn,
      newBtn
    ]));
    return EN.ui.panel("Payday", m.paid ? "CREDITED" : (rec ? "SAVED" : "NOT SAVED"), kids, { glow: m.paid });
  }

  /* ---- 10. past paydays ------------------------------------------------- */
  function pastPanel() {
    var list = gm.list("ledger").filter(function (r) { return r && r.kind === "payday"; });
    if (!list.length) return null;
    var kids = list.map(function (pd) {
      var live = pd.credited && !pd.undone;
      var st = live ? ["CREDITED", "var(--success)"] : pd.undone ? ["UNDONE", "var(--text3)"] : ["SAVED", "var(--accent)"];
      var c = pd.contract || {}, each = pd.each || {};
      var current = pd.id === _p.paydayId;
      var del = live ? null : EN.ui.armButton("pay:del:" + pd.id, { label: "✕", armedLabel: "DELETE?",
        title: "Delete this payday record", armedTitle: "Deletes the record only. Nothing on the crew's records changes.",
        onConfirm: function () {
          gm.drop("ledger", pd.id, { silent: true });
          // the open form is now saved nowhere, so replacing it asks first (F18)
          if (_p.paydayId === pd.id) { _p.paydayId = null; _base = null; }
          EN.app.render();
        } });
      if (del) del.setAttribute("data-pay", "pd-del-" + pd.id);
      return el("div.row.between.wrap", { dataset: { pay: "pd-" + pd.id },
        style: { gap: "8px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" } }, [
        el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
          el("span", { style: { fontWeight: 600 }, text: pd.title || "Payday" }),
          el("span.chip", { style: { fontSize: "9.5px", color: st[1], borderColor: st[1] }, text: st[0] }),
          current ? el("span.chip", { style: { fontSize: "9.5px" }, text: "OPEN" }) : null,
          el("span.help", { style: { margin: 0 }, text: stamp(pd.at) + DOT + "contract " + fmtG(c.total) + DOT +
            fmtG(each.glimmer) + " each" + DOT + (pd.crew || []).length + " credited" })
        ]),
        el("div.row", { style: { gap: "6px" } }, [
          current ? null : openButton(pd, "pd-open-" + pd.id, "OPEN"),
          el("button.btn.sm", { onclick: function () { copyText(pd.summary || "", "The payday summary"); } }, "COPY"),
          canUndo(pd) ? el("button.btn.sm.danger", { dataset: { pay: "pd-undo-" + pd.id },
            onclick: function () { undoPayday(pd.id); } }, "↶ UNDO") : null,
          del
        ])
      ]);
    });
    return EN.ui.panel("Past Paydays", list.length + " IN THE LEDGER", kids);
  }

  /* ---- handoff and render ----------------------------------------------- */
  /* { jobId, encounter, xp, paydayId } from the Job Board's PAY THIS JOB or
     the Encounters XP award (`xp` is that card's {objective, skip}, see
     takeEncounter; `paydayId`, when present, names a payday to open). A handoff
     starts a fresh payday (the GM's fixer and Crew Kit percentages and the stub
     choice carry over), except that a job or a fight already paid opens the
     payday that paid it instead of starting a second one (F8).
     Three optional fields more, for the Scenes tab's PAY THIS INCURSION and
     anything else that prices one: `incursion` (or `inc`), the Incursion's
     rating as a number, a numeric string or {rating}, which sets the pricer
     ({rating, caliber, column} also carries the crew Caliber and the column
     the sender priced it with);
     `title`, the payday's title when no job names one; and `milestone`, an
     item key from the book's lists (or {key}), which picks it in the
     Milestones panel without touching the form. */
  function payloadJob(h) { return (typeof h.jobId === "string" && h.jobId) ? h.jobId : null; }
  function payloadEnc(h) { return (isObj(h.encounter) && Array.isArray(h.encounter.entries)) ? h.encounter : null; }
  // only a rating the pay grid has a row for, so the pricer's select can show it
  function payloadInc(h) {
    var v = own(h, "incursion") ? h.incursion : own(h, "inc") ? h.inc : null;
    if (isObj(v)) v = v.rating;
    var r = parseInt(v, 10);
    return (r > 0 && P() && rowAt(r)) ? String(r) : null;
  }
  /* The crew Caliber the sender priced the Incursion with ({caliber}: the
     Scenes tab's Crew Caliber, typed or followed) and the column it named
     ({column}). Each only when the grid has it, and only beside a rating. */
  function payloadIncCal(h) {
    var v = own(h, "incursion") ? h.incursion : own(h, "inc") ? h.inc : null;
    if (!payloadInc(h) || !isObj(v) || typeof v.caliber !== "number") return null;
    var c = v.caliber;
    return (c === Math.floor(c) && rowAt(c)) ? c : null;
  }
  function payloadIncCol(h) {
    var v = own(h, "incursion") ? h.incursion : own(h, "inc") ? h.inc : null;
    if (!payloadInc(h) || !isObj(v) || typeof v.column !== "string") return null;
    return colIndex(v.column) >= 0 ? v.column : null;
  }
  /* Take the sender's Caliber into the form's Caliber field when the crew
     Payroll reads has another, so the Incursion prices at the row and column
     the sender showed (a Caliber typed on the Scenes tab, say). A form with a
     Caliber already typed keeps it. */
  function takeIncCal(h) {
    var cal = payloadIncCal(h);
    if (cal === null || _p.cal !== "") return;
    if (crewNow().caliber !== cal) { _p.cal = String(cal); _p.total = null; }
  }
  function payloadTitle(h) { return (typeof h.title === "string" && h.title.trim()) ? h.title.trim() : ""; }
  function payloadMs(h) {
    var v = own(h, "milestone") ? h.milestone : null;
    if (isObj(v)) v = v.key;
    return msItem(v) ? v : null;
  }
  // a payload that carries something for the form, not only a milestone pick
  function payloadForm(h) {
    return !!(payloadJob(h) || payloadEnc(h) || payloadInc(h) || payloadTitle(h) || (typeof h.paydayId === "string" && h.paydayId));
  }
  /* the payday a handoff opens rather than starting a new one, or null. A
     job's own paydayId is honoured when that payday is credited and came in
     with an imported backup: its records may live on another device, so no
     write of it counts here, but the job was paid all the same and PAY THIS
     JOB must open that payday, not a second one. */
  function payloadPayday(h) {
    var named = (typeof h.paydayId === "string" && h.paydayId) ? gm.rec("ledger", h.paydayId) : null;
    if (isObj(named) && named.kind === "payday") return named;
    var jid = payloadJob(h), j = jid ? gm.rec("jobs", jid) : null;
    var held = (j && typeof j.paydayId === "string" && j.paydayId) ? gm.rec("ledger", j.paydayId) : null;
    if (isObj(held) && held.kind === "payday" && held.credited && !held.undone && importedPayday(held)) return held;
    var enc = payloadEnc(h);
    var d = earlierPayday(enc && typeof enc.at === "number" ? enc.at : null, jid, null);
    return d ? d.pd : null;
  }
  function takePayload(h) {
    var keep = { fixer: _p.fixer, kit: _p.kit, stub: _p.stub };
    var jid = payloadJob(h), enc = payloadEnc(h);
    var j = jid ? gm.rec("jobs", jid) : null;
    var pd = payloadPayday(h);
    if (pd) {
      openPayday(pd);
      if (typeof h.paydayId !== "string" || h.paydayId !== pd.id) {
        toast("Already paid with " + titled("Payday", pd.title) + ". Its payday is open.");
      }
      return;
    }
    _p = fresh();
    _p.fixer = keep.fixer; _p.kit = keep.kit; _p.stub = keep.stub;
    if (jid) _p.jobId = jid;
    if (j && typeof j.title === "string") _p.title = j.title;
    if (!_p.title && payloadTitle(h)) _p.title = payloadTitle(h);
    if (payloadInc(h)) _p.inc = payloadInc(h);
    if (enc) takeEncounter(enc, isObj(h.xp) ? h.xp : null);
    if (_p.inc && !jid) { takeIncCal(h); priceIncursion(payloadIncCol(h)); }
    settle();
  }
  /* An Incursion handed in with no job (the Scenes tab's PAY THIS INCURSION)
     starts priced: the base column moves to the one its rating maps to for
     this crew, the move the pricer's PRICE AS button makes. A column the
     sender named wins, so Payroll opens the column the sender showed. A rating
     the book names no column for leaves the column alone, and the pricer says
     so. */
  function priceIncursion(col) {
    var I = P() && P().incursion, r = parseInt(_p.inc, 10);
    if (!I || !r) return;
    if (col && colIndex(col) >= 0) { _p.diff = col; _p.total = null; return; }
    var cal = quote(crewNow().caliber, _p.diff, {}).caliber;
    var map = (I.ratingToColumn || []).filter(function (x) { return x.offset === r - cal; })[0];
    if (map && colIndex(map.col) >= 0) { _p.diff = map.col; _p.total = null; }
  }

  /* A HANDOFF OVER UNSAVED WORK (F18). A handoff used to replace the form
     outright, typed bounties, salvage and totals with it. When the form has
     changes that are not saved, the payload waits in a panel at the top and the
     GM says what happens: take it (armed, since it discards the form), keep the
     form and take only its job and fight, or let it go. A handoff for the job
     and fight the form already holds changes nothing and asks nothing. */
  function receive(h) {
    if (!dirty()) { _pend = null; takePayload(h); return; }
    var jid = payloadJob(h), enc = payloadEnc(h), inc = payloadInc(h);
    var sameJob = !jid || jid === _p.jobId;
    var sameEnc = !enc || !!(_p.enc && _p.enc.at === enc.at);
    var sameInc = !inc || inc === String(_p.inc);
    if ((jid || enc) && sameJob && sameEnc && sameInc && !(typeof h.paydayId === "string" && h.paydayId && h.paydayId !== _p.paydayId)) {
      _pend = null;
      toast("This payday is already open here, with its changes kept.");
      return;
    }
    _pend = h;
  }
  function keepWith(h) {
    var jid = payloadJob(h), enc = payloadEnc(h), inc = payloadInc(h);
    if (jid) _p.jobId = jid;
    if (enc) takeEncounter(enc, isObj(h.xp) ? h.xp : null);
    // the Caliber comes with the rating, so the pricer reads as the sender did
    if (inc) { _p.inc = inc; takeIncCal(h); }
    _pend = null;
    toast("The form is kept" + (jid || enc || inc ? ", now for " + pendWhat(h) : "") + ".");
    refresh();
  }
  function pendWhat(h) {
    var jid = payloadJob(h), enc = payloadEnc(h), inc = payloadInc(h), j = jid ? gm.rec("jobs", jid) : null, bits = [];
    if (jid) bits.push("the job " + ((j && j.title) || "no longer in the log"));
    if (enc) bits.push("the fight " + (enc.name || "just cleared"));
    var ical = inc ? payloadIncCal(h) : null;
    if (inc) bits.push("an Incursion at rating " + inc + (ical !== null ? " for a Caliber " + ical + " crew" : "") +
      (!jid && payloadTitle(h) ? ", " + payloadTitle(h) : ""));
    return bits.join(" and ");
  }
  function pendPanel() {
    var h = _pend;
    if (!isObj(h)) return null;
    var jid = payloadJob(h), enc = payloadEnc(h), what = pendWhat(h), opens = payloadPayday(h);
    var takeLabel = opens ? "OPEN ITS PAYDAY" : "START A NEW PAYDAY FROM IT";
    function take() { _pend = null; takePayload(h); EN.app.render(); }
    var takeBtn;
    if (dirty()) {
      takeBtn = EN.ui.armButton("pay:pend-take", { cls: ".btn.sm", label: takeLabel, armedLabel: "DISCARD THE FORM?",
        title: "Replace this form with what was sent",
        armedTitle: "The form has changes that are not saved. This replaces them.", onConfirm: take });
      takeBtn.setAttribute("data-pay", "pend-take");
    } else {
      takeBtn = el("button.btn.sm", { dataset: { pay: "pend-take" }, onclick: take }, takeLabel);
    }
    var parts = [jid ? "JOB" : null, enc ? "FIGHT" : null, payloadInc(h) ? "INCURSION" : null].filter(Boolean);
    var keepLabel = !parts.length ? null : "KEEP THE FORM, TAKE ITS " +
      (parts.length > 1 ? parts.slice(0, -1).join(", ") + " AND " + parts[parts.length - 1] : parts[0]);
    return EN.ui.panel("Sent to Payroll", "WAITING", [
      el("p", { dataset: { pay: "pend" }, style: { margin: 0, fontWeight: 600 }, text: "Sent here: " + (what || "a new payday") + "." }),
      help((opens ? "It is already paid with " + titled("Payday", opens.title) + ". " : "") +
        "This form has changes that are not saved, so nothing was replaced."),
      el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
        takeBtn,
        keepLabel ? el("button.btn.sm", { dataset: { pay: "pend-keep" }, onclick: function () { keepWith(h); } }, keepLabel) : null,
        el("button.btn.sm.ghost", { dataset: { pay: "pend-drop" }, onclick: function () { _pend = null; refresh(); } }, "IGNORE IT")
      ])
    ]);
  }

  /* A click redraws THIS tab in place and puts the caret back where it was:
     the form is module state, not the store, so nothing else needs to redraw. */
  function refresh() {
    if (!_mount || !document.body.contains(_mount)) { EN.app.render(); return; }
    var a = document.activeElement, key = (a && a.getAttribute) ? a.getAttribute("data-pf") : null, s0 = null, s1 = null;
    if (key) { try { s0 = a.selectionStart; s1 = a.selectionEnd; } catch (e) { s0 = null; } }
    var sx = window.scrollX, sy = window.scrollY;
    render(_mount);
    window.scrollTo(sx, sy);
    if (key) {
      var n = _mount.querySelector('[data-pf="' + key + '"]');
      if (n) {
        try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); }
        if (typeof s0 === "number") { try { n.setSelectionRange(s0, s1); } catch (e) {} }
      }
    }
    if (EN.ui.substituteCurrencyGlyphs) EN.ui.substituteCurrencyGlyphs(_mount);
  }

  /* A KEYSTROKE (F13). The tab used to be rebuilt on every keystroke and the
     rebuilt number field refilled from the parsed value, so a trailing "." was
     lost under the caret: Nexus 1.5 typed as 15, and 0.25 as 25, and that went
     to every record on CREDIT THE CREW. Now the tab is built afresh off-screen
     and swapped in around the field being typed into: every node is replaced
     except that field and the ancestors that hold it, which keep their place
     (their attributes are brought up to date). So the typed string, the caret
     and a phone keyboard's composing word are never touched, and every readout
     still follows the keystroke. When the fresh tree does not line up with the
     live one (the field is gone, or its ancestors changed shape) the whole tab
     is redrawn instead, as a click redraws it. */
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
    if (!_mount || !document.body.contains(_mount) || !input || !_mount.contains(input) || !P()) { refresh(); return; }
    var key = input.getAttribute("data-pf");
    var holder = el("div");
    holder.appendChild(build());
    var twin = key ? holder.querySelector('[data-pf="' + key + '"]') : null;
    var live = chainOf(input, _mount), next = twin ? chainOf(twin, holder) : null;
    var fits = !!(live && next && live.length === next.length);
    for (var i = 0; fits && i < live.length; i++) if (live[i].nodeName !== next[i].nodeName) fits = false;
    if (!fits) { refresh(); return; }
    var sx = window.scrollX, sy = window.scrollY;
    var lp = _mount, np = holder;
    for (var k = 0; k < live.length; k++) {
      graft(lp, np, live[k], next[k]);
      syncAttrs(live[k], next[k]);
      lp = live[k]; np = next[k];
    }
    window.scrollTo(sx, sy);
    if (EN.ui.substituteCurrencyGlyphs) EN.ui.substituteCurrencyGlyphs(_mount);
  }

  // the tab's content, built from the form and the store: render() mounts it, retype() grafts it
  function build() {
    var m = model();
    var blocks = [heading("Payroll", "// paying the crew")];
    // the last write to a Freelancer record, with its UNDO, on every Admin tab (gm.js, F4)
    var strip = null;
    try { strip = (EN.gmView && typeof EN.gmView.undoStrip === "function") ? EN.gmView.undoStrip() : null; } catch (e) { strip = null; }
    if (strip && strip.nodeType) blocks.push(strip);
    var pend = pendPanel();
    if (pend) { blocks.push(pend); blocks.push(gap()); }
    blocks = blocks.concat([
      headPanel(m), gap(), contractPanel(m), gap(), bountyPanel(m), gap(), salvagePanel(m), gap(), splitPanel(m), gap(),
      el("div.row.wrap", { style: { gap: "12px", alignItems: "stretch" } }, [
        el("div", { style: { flex: "1 1 300px", minWidth: 0 } }, [xpPanel(m)]),
        el("div", { style: { flex: "1 1 300px", minWidth: 0 } }, [ledgerPanel()])
      ]),
      gap(), msPanel(m), gap(), summaryPanel(m)]);
    var past = pastPanel();
    if (past) { blocks.push(gap()); blocks.push(past); }
    return el("div", null, blocks);
  }

  /* A PAYDAY UNDONE ELSEWHERE. The undo strip every Admin tab carries (F4) can
     take a payday's writes back one by one without UNDO PAYDAY. When none of
     its writes stands any more and at least one was undone (none imported:
     those are history from a GM file), the payday is marked undone and its job
     put back, exactly as UNDO PAYDAY would have left them. Silent, and a no-op
     once done, so it is safe on every render. */
  function reconcile() {
    var standing = null;
    gm.list("ledger").forEach(function (pd) {
      if (!isObj(pd) || pd.kind !== "payday" || !pd.credited || pd.undone) return;
      var ids = Array.isArray(pd.writeIds) ? pd.writeIds : [];
      if (!ids.length) return;
      if (!standing) {
        standing = Object.create(null);
        liveWrites().forEach(function (w) { standing[w.id] = true; });
      }
      var undone = 0, keep = false;
      ids.forEach(function (id) {
        var w = gm.rec("ledger", id);
        if (own(standing, id) || (w && w.imported)) keep = true;
        else if (w && w.undone) undone += 1;
      });
      if (keep || !undone) return;
      var next = copy(pd);
      next.undone = true;
      next.undoneAt = Date.now();
      next.credited = false;
      unmarkJob(pd);
      gm.put("ledger", next, { silent: true });
    });
  }

  function render(mount) {
    _mount = mount;
    EN.ui.clear(mount);
    try { reconcile(); } catch (e) { try { console.warn("Payroll: could not reconcile the paydays.", e); } catch (e2) {} }
    var h = null;
    try { h = (EN.gmView && EN.gmView.takeHandoff) ? EN.gmView.takeHandoff("payroll") : null; } catch (e) { h = null; }
    if (isObj(h)) {
      // a payload that carries only a milestone pick is for the Milestones panel and leaves the form as it is
      var hm = payloadMs(h);
      if (!own(h, "milestone") || payloadForm(h)) receive(h);
      if (hm) _ms.key = hm;
    }
    if (!P() || !EN.gmEngine || !EN.engine.splitPayout) {
      mount.appendChild(el("div", null, [heading("Payroll", "// paying the crew"),
        el("div.muted-box", { style: { padding: "26px" }, text: "Payroll data did not load. Check app/data/gm_payroll.js." })]));
      return;
    }
    mount.appendChild(build());
  }

  return {
    render: render,
    /* a payday the undo strip took back on another tab, marked undone with its
       job put back; the Job Board calls it before drawing a job's status, so a
       job never reads PAID OUT for a payday that no longer stands */
    reconcile: function () { try { reconcile(); } catch (e) { try { console.warn("Payroll: could not reconcile the paydays.", e); } catch (e2) {} } },
    // pure helpers, for anything else that wants to quote pay the same way
    quote: function (caliber, diffKey, shifts) { return P() ? quote(caliber, diffKey, shifts || {}) : null; },
    bountyValue: function (xp, rate, alive) { return P() ? bountyValue(xp, rate, alive) : 0; }
  };
})();
