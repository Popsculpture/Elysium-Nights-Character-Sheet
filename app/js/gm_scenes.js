/* ===========================================================================
   ELYSIUM NIGHTS · GM Scenes (Admin tab)
   Three scenes that aren't a fight, each its own sub-page:
     SIT-DOWN   the prep card off the book's checklist, a Resolve meter, the
                Pressure track, weak spots, the clock in the room, the Floor
                and its flips, fallout written in advance, the results table
     CHASE      the vehicles (Hostile Vehicles from the Bestiary, the crew's
                own rides read off their records, or typed), Lead 0 to 5 and
                its bands, Chase Checks with the chase-only Dominant Victory
                thresholds, the district stalemate roll with the Impact DC
                picker, and the first response timed from the crew's Heat
     INCURSION  the briefing (rating against the crew's Caliber,
                classification, dive profile, the posting), the anchor, Local
                Rules off the d12, the dive and return stages, collapse and the
                Breach Save by rating, and the pay column the rating maps to on
                Payroll, with PAY THIS INCURSION
   Each sub-page edits one open scene. SAVE files it in the GM bag `scenes`,
   and a saved scene keeps every later change as it goes, so a reload in the
   middle of a scene loses nothing. Every word of the rules is
   EN.gmBook.scenes (data/gm_scenes.js) or a file it points at, read through
   EN.gmBook.scenes.ref; this file decides what is shown and does the
   arithmetic, never what a rule says.

   NOTHING HERE WRITES TO A PLAYER RECORD. The crew (EN.gmEngine.crew, ruling
   D4) is read for its Calibers, its Heat rows and its vehicles, and never
   written. What a scene produces (fallout, Heat, Wounds, pay) leaves this tab
   as copyable text, or as a handoff to the tab that does the writing.

   App readings this file makes (the book is silent, or the rule is the PHB's,
   which the app does not carry):
     - Weak spots multiply a result's Pressure by 2 ("double") or 0 ("none"),
       per the data's pressureMult. Insight deals no Pressure.
     - The Resolve meter is the starting Resolve plus any hand adjustment, less
       each logged Pressure, plus each Critical's +1, never below 0. The card
       prints no cap on the +1, so none is applied.
     - A chase's Lead is moved by hand: what each margin does to Lead is the
       PHB's Vehicles and Chases. A check reports the winner, the margin,
       whether it reaches the chase's own Dominant Victory threshold, and a
       tie as a Stalemate.
     - First response: N = 5 minus half the Heat rounded down, minimum 1, and
       the response is due once N rounds of the chase have passed. A round
       passes when the GM presses NEXT ROUND.
     - An Incursion no push has moved is at stage 0 (holding). Pushes are
       logged; the GM moves the stage, since each push CAN move it one.
     - PAY THIS INCURSION hands Payroll the Incursion as an encounter snapshot
       with no threat rows, so Payroll's paid-twice check (F8) knows it again:
       the snapshot's `at` is fixed per Incursion (`payAt`, saved with the
       scene). Beside it go `incursion` ({rating, ...}, which sets Payroll's
       Incursion pricer), `title`, the objective XP for the collapse as `xp`,
       and after a controlled collapse `milestone` (the Major Milestone's key),
       all fields Payroll's intake reads.

   A saved scene (bag `scenes`): { id, kind: "sitdown"|"chase"|"incursion",
     name, ...that kind's fields (blankSitdown, blankChase and blankIncursion
     below are the shapes), createdAt, updatedAt }. Typed fields are kept as
     the strings typed and parsed where they are used.
   Handoff in (EN.gmView.handoff("scenes", payload)): { page } opens that
     sub-page; { page: "sitdown", opposition: {name, resolve, profile, weak} }
     starts a Sit-Down across the table from that person (`resolve` as the
     threat blocks write it, "5 (Standard)"; `weak` as a contact card keeps it).
   =========================================================================== */
window.EN = window.EN || {};

EN.gmScenes = (function () {
  var el = EN.ui.el, toast = EN.ui.toast, gm = EN.gmStore;
  var DOT = " · ", MINUS = "−";

  var PAGES = [
    { k: "sitdown",   label: "SIT-DOWN",  tag: "RESOLVE · PRESSURE · THE FLOOR" },
    { k: "chase",     label: "CHASE",     tag: "LEAD · CHASE CHECKS · STALEMATES" },
    { k: "incursion", label: "INCURSION", tag: "RATING · THE DIVE · THE RETURN" }
  ];
  // the Caliber colors as chips (app colors for the book's color names)
  var CAL_COLOR = { 1: "var(--success)", 2: "var(--warn)", 3: "var(--danger)", 4: "var(--flow)", 5: "var(--text)" };

  /* ---- small helpers, local per the house convention ----------------------- */
  function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function copy(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function die(sides) { return 1 + Math.floor(Math.random() * sides); }
  function int(v) {
    var n = parseInt(String(v == null ? "" : v).replace(/,/g, "").trim(), 10);
    return isNaN(n) ? null : n;
  }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function plural(n, one, many) { return n === 1 ? one : (many || one + "s"); }
  function upperFirst(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function fmtMod(n) { return (n >= 0 ? "+" : "") + n; }
  function lid(p) { return p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36); }
  function str(v) { return v == null ? "" : String(v); }
  // a line the GM wrote, as a sentence: its own closing stop kept, one added when it has none
  function said(v) {
    var t = str(v).trim();
    if (!t) return "nothing written yet.";
    return /[.!?]["')]?$/.test(t) ? t : t + ".";
  }
  function byKey(arr, k) { return (arr || []).filter(function (x) { return x && x.key === k; })[0] || null; }
  function two(n) { return (n < 10 ? "0" : "") + n; }
  function stamp(t) {
    var d = new Date(Number(t) || 0);
    return d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate()) + " " + two(d.getHours()) + ":" + two(d.getMinutes());
  }

  function S() { return (EN.gmBook && EN.gmBook.scenes) || null; }
  // a dotted path under EN, through the data file's own resolver
  function ref(path) { var s = S(); return (s && typeof s.ref === "function") ? s.ref(path) : null; }
  // a {ref, rowKey} pointer: the row in that list whose key is rowKey
  function rowAt(ptr) {
    if (!isObj(ptr)) return null;
    var arr = ref(ptr.ref);
    return Array.isArray(arr) ? byKey(arr, ptr.rowKey) : null;
  }

  function help(t, style) {
    return el("p.help", { style: Object.assign({ margin: "4px 0 0" }, style || {}), text: t });
  }
  function label(t) {
    return el("span.mono", { style: { fontSize: "10px", letterSpacing: ".12em", color: "var(--text3)" }, text: t });
  }
  function lbl(t) { return el("label.fl", { text: t }); }
  function chipTag(t, color, hook) {
    return el("span.chip", { dataset: hook ? { sc: hook } : null,
      style: { fontSize: "9.5px", color: color || "var(--text3)", borderColor: color || "var(--border2)" }, text: t });
  }
  function gap() { return el("div", { style: { height: "12px" } }); }
  function bar(cur, max, color) {
    var pct = max > 0 ? clamp((cur / max) * 100, 0, 100) : 0;
    return el("div.meter", { style: { height: "8px", borderRadius: "4px", background: "var(--bg3)", overflow: "hidden" } },
      [el("div.meter-fill", { style: { height: "100%", width: pct + "%", background: color || "var(--accent)" } })]);
  }
  // a numbered step head, the checklist's own run-in name beside it
  function stepHead(n, name) {
    return el("div.row", { style: { gap: "10px", alignItems: "baseline", margin: "14px 0 2px" } }, [
      el("span.mono", { style: { fontSize: "13px", color: "var(--accent)", minWidth: "22px" }, text: two(n) }),
      el("span", { style: { fontWeight: 600 }, text: name })
    ]);
  }
  function row(kids, style) {
    return el("div.row.wrap", { style: Object.assign({ gap: "10px", alignItems: "flex-end", marginTop: "6px" }, style || {}) }, kids);
  }

  /* ---- the open scenes --------------------------------------------------------
     One open scene per sub-page, in memory, plus `base`: how it stood when it
     was last started, opened or saved, which is what "unsaved changes" is
     measured against. The other fields are working inputs that belong to no
     scene (a check being typed, a damage amount), deliberately not saved. */
  var _v = {
    page: "sitdown",
    d: { sitdown: null, chase: null, incursion: null },
    base: { sitdown: "", chase: "", incursion: "" },
    approach: "",                 // the Approach the next Sit-Down result is logged under
    chk: { a: "", b: "", rollA: "", rollB: "", last: null },
    dmg: Object.create(null),     // vehicle line id -> damage amount, as typed
    anchorDmg: "",
    lrPick: "", lrText: "",
    addHostile: "", addCrew: "",
    pend: null                   // a handoff waiting on the GM's word over unsaved work
  };
  var _mount = null;
  var _keepT = null, _keepKind = null;

  function floorBlank() {
    var F = S() && S().sitdown && S().sitdown.floor;
    return ((F && F.pressures) || []).map(function (p) {
      return { key: p.key, live: false, where: "", effect: "", flip: "", flipped: false };
    });
  }
  function blankSitdown() {
    return { id: null, name: "",
      stakes: { crewWants: "", oppWants: "", concedes: "", offers: "" },
      opp: { who: "", from: "", tier: "standard", resolve: "5", profile: "" },
      weak: { double: "", doubleWhy: "", none: "", noneWhy: "" },
      postures: { first: "", firstNote: "", second: "", secondNote: "" },
      floor: floorBlank(),
      clock: { round: "", rounds: "", runsLong: "" },
      fallout: { win: "", mixed: "", critical: "" },
      track: { round: 1, posture: false, adj: 0, log: [] },
      notes: "" };
  }
  function blankChase() {
    return { id: null, name: "",
      who: { running: "", chasing: "", wants: "" },
      vehicles: [],
      lead: { start: 2, why: "", now: 2 },
      route: { district: "", territory: "", straightaway: "", tangle: "" },
      esc: { source: "", heat: "", row: "" },
      endings: { escape: "", capture: "" },
      method: "d20",
      track: { round: 0, log: [], stale: null, speed: "", impact: "" },
      notes: "" };
  }
  function blankIncursion() {
    return { id: null, name: "",
      rating: 1, cal: "",
      base: "open", addOns: { instanced: false, contested: false, chromatic: false }, provisional: false,
      chromatic: { from: "open", becomes: "sealed", trigger: "", known: false, met: false },
      profile: "", ground: "public",
      entries: "", estimate: "", body: "",
      anchor: { kind: "", text: "", hit: 0 },
      rules: [],
      zones: "",
      dive: { stage: 0, pushes: [], collapse: "" },
      objXp: "", payAt: 0, steps: [],
      notes: "" };
  }
  function blank(kind) {
    return kind === "chase" ? blankChase() : kind === "incursion" ? blankIncursion() : blankSitdown();
  }
  // a new scene: the blank, with an Incursion rated at the crew's Caliber to start
  function fresh(kind) {
    var d = blank(kind);
    if (kind === "incursion") { var c = crewInfo(); if (c && c.source !== "none") d.rating = c.caliber; }
    return d;
  }
  function pageOk(k) { return k === "sitdown" || k === "chase" || k === "incursion"; }
  function sig(d) {
    var c = copy(d) || {};
    delete c.id; delete c.createdAt; delete c.updatedAt; delete c.kind;
    return JSON.stringify(c);
  }
  function draft(kind) {
    if (!_v.d[kind]) { _v.d[kind] = fresh(kind); _v.base[kind] = sig(_v.d[kind]); }
    return _v.d[kind];
  }
  function setDraft(kind, d) { _v.d[kind] = d; _v.base[kind] = sig(d); }
  // a saved scene whose record is still in the bag
  function savedRec(d) { return (d && typeof d.id === "string" && d.id) ? gm.rec("scenes", d.id) : null; }
  // an open scene that is not saved and holds changes: what NEW, OPEN and an example would throw away
  function unsavedWork(kind) {
    var d = _v.d[kind];
    return !!d && !savedRec(d) && sig(d) !== _v.base[kind];
  }

  /* RESTORING A SAVED SCENE. A record comes back from storage, which an import
     can write, so each field is taken only when it has the type the blank
     gives it, and every list is rebuilt row by row. */
  function merge(into, src) {
    if (!isObj(src)) return into;
    Object.keys(into).forEach(function (k) {
      if (!own(src, k)) return;
      var b = into[k], v = src[k];
      if (isObj(b)) merge(b, v);
      else if (Array.isArray(b)) { /* lists are rebuilt by restore() */ }
      else if (typeof b === "string" && (typeof v === "string" || typeof v === "number")) into[k] = String(v);
      else if (typeof b === "number" && typeof v === "number" && isFinite(v)) into[k] = v;
      else if (typeof b === "boolean" && typeof v === "boolean") into[k] = v;
      else if (b === null && (typeof v === "string" || isObj(v))) into[k] = copy(v);
    });
    return into;
  }
  function strFields(o, keys) {
    var out = {};
    keys.forEach(function (k) { out[k] = (isObj(o) && (typeof o[k] === "string" || typeof o[k] === "number")) ? String(o[k]) : ""; });
    return out;
  }
  function restore(kind, rec) {
    var d = merge(blank(kind), rec);
    d.id = (isObj(rec) && typeof rec.id === "string") ? rec.id : null;
    if (kind === "sitdown") {
      var fl = Array.isArray(rec.floor) ? rec.floor : [];
      d.floor.forEach(function (f) {
        var r = fl.filter(function (x) { return isObj(x) && x.key === f.key; })[0];
        if (!r) return;
        f.live = r.live === true; f.flipped = r.flipped === true;
        ["where", "effect", "flip"].forEach(function (k) { if (typeof r[k] === "string") f[k] = r[k]; });
      });
      d.track.log = (isObj(rec.track) && Array.isArray(rec.track.log) ? rec.track.log : []).filter(isObj).map(function (x) {
        return { id: typeof x.id === "string" ? x.id : lid("sl"), round: Math.max(1, int(x.round) || 1),
                 approach: typeof x.approach === "string" ? x.approach : "", result: typeof x.result === "string" ? x.result : "",
                 pressure: Math.max(0, int(x.pressure) || 0), gain: Math.max(0, int(x.gain) || 0), why: typeof x.why === "string" ? x.why : "" };
      });
      d.track.adj = int(d.track.adj) || 0;
      d.track.round = Math.max(1, int(d.track.round) || 1);
    } else if (kind === "chase") {
      d.vehicles = (Array.isArray(rec.vehicles) ? rec.vehicles : []).filter(isObj).map(function (v) {
        var o = strFields(v, ["side", "from", "name", "owner", "speed", "handling", "structure", "integrity", "weapons", "notes", "grade", "attack", "aboard", "bestiary"]);
        o.lid = typeof v.lid === "string" && v.lid ? v.lid : lid("v");
        if (o.side !== "running" && o.side !== "chasing") o.side = "chasing";
        o.hit = Math.max(0, int(v.hit) || 0);
        return o;
      });
      d.track.log = (isObj(rec.track) && Array.isArray(rec.track.log) ? rec.track.log : []).filter(isObj).map(function (x) {
        return { id: typeof x.id === "string" ? x.id : lid("cl"), round: int(x.round) || 0, text: typeof x.text === "string" ? x.text : "" };
      });
      var st = isObj(rec.track) ? rec.track.stale : null;
      d.track.stale = (isObj(st) && typeof st.district === "string" && int(st.n)) ? { district: st.district, n: int(st.n) } : null;
      d.lead.start = clamp(int(d.lead.start) === null ? 2 : int(d.lead.start), 0, 5);
      d.lead.now = clamp(int(d.lead.now) === null ? d.lead.start : int(d.lead.now), 0, 5);
      d.track.round = Math.max(0, int(d.track.round) || 0);
      if (d.method !== "pool") d.method = "d20";
    } else {
      d.rating = clamp(int(d.rating) || 1, 1, 5);
      d.rules = (Array.isArray(rec.rules) ? rec.rules : []).filter(isObj).map(function (r) {
        return { lid: typeof r.lid === "string" ? r.lid : lid("lr"), n: int(r.n), text: typeof r.text === "string" ? r.text : "" };
      });
      d.dive.pushes = (isObj(rec.dive) && Array.isArray(rec.dive.pushes) ? rec.dive.pushes : []).filter(isObj).map(function (p) {
        return { id: typeof p.id === "string" ? p.id : lid("pu"), kind: typeof p.kind === "string" ? p.kind : "", stage: int(p.stage) || 0 };
      });
      d.dive.stage = clamp(int(d.dive.stage) || 0, 0, 3);
      d.anchor.hit = Math.max(0, int(d.anchor.hit) || 0);
      if (d.dive.collapse !== "controlled" && d.dive.collapse !== "uncontrolled") d.dive.collapse = "";
      d.steps = (Array.isArray(rec.steps) ? rec.steps : []).filter(function (n) { return typeof n === "number"; });
      if (d.base !== "sealed") d.base = "open";
      if (d.ground !== "private") d.ground = "public";
    }
    return d;
  }

  /* ---- keeping a saved scene ---------------------------------------------------
     A saved scene keeps every change: a click at once, typing after a short
     pause. Silent, since no other view draws a saved scene. A scene whose
     record was deleted meanwhile is left unsaved rather than resurrected. */
  function putKeep(kind, now) {
    var d = _v.d[kind];
    if (!d || !savedRec(d)) return;
    var rec = copy(d);
    rec.kind = kind;
    if (gm.put("scenes", rec, { silent: true, immediate: !!now })) _v.base[kind] = sig(d);
  }
  /* `now` writes through at once rather than on gmStore's own debounce: the
     page is going away (pagehide), and gmStore's flush on the same event has
     already run, since its listener was added first. */
  function flushKeep(now) {
    if (_keepT) { clearTimeout(_keepT); _keepT = null; if (_keepKind) putKeep(_keepKind, now); }
  }
  function keep(now) {
    var kind = _v.page;
    if (_keepT && _keepKind !== kind) flushKeep();
    if (!savedRec(_v.d[kind])) return;
    if (_keepT) { clearTimeout(_keepT); _keepT = null; }
    if (now) { putKeep(kind); return; }
    _keepKind = kind;
    _keepT = setTimeout(function () { _keepT = null; putKeep(kind); }, 400);
  }
  try { window.addEventListener("pagehide", function () { flushKeep(true); }); } catch (e) {}

  // a click: keep, and redraw the app
  function changed() { keep(true); EN.app.render(); }
  // a keystroke: keep, and repaint around the field being typed in
  function typed(input) { keep(false); retype(input); }

  /* ---- inputs --------------------------------------------------------------------
     A typed field writes the scene on every keystroke and repaints the tab
     around itself (retype). It never re-renders on change: a re-render on
     change swaps out the button under the pointer, so the first click after
     typing never landed (F19). `key` (data-sf) is how retype finds the field
     again in the fresh tree, so each is unique on the page. */
  function textIn(key, value, ph, set, opts) {
    opts = opts || {};
    var attrs = { dataset: { sf: key }, value: str(value), placeholder: ph || "",
      style: Object.assign({ width: "100%" }, opts.style || {}),
      oninput: function (e) { set(e.target.value); typed(e.target); } };
    if (opts.area) attrs.rows = String(opts.rows || 2);
    else attrs.type = opts.type || "text";
    if (opts.list) attrs.list = opts.list;
    if (opts.min != null) attrs.min = String(opts.min);
    if (opts.max != null) attrs.max = String(opts.max);
    if (opts.title) attrs.title = opts.title;
    return el(opts.area ? "textarea" : "input", attrs);
  }
  function numIn(key, value, set, opts) {
    opts = opts || {};
    return textIn(key, value, opts.ph || "", set, { type: "number", min: opts.min, max: opts.max, title: opts.title,
      style: { width: opts.width || "84px" } });
  }
  function field(text, node, flex) {
    return el("div.field", { style: { margin: 0, flex: flex || "1 1 220px", minWidth: 0 } }, [lbl(text), node]);
  }
  function selectIn(key, options, current, pick, opts) {
    opts = opts || {};
    return el("select", { dataset: { sf: key }, title: opts.title || null,
      style: Object.assign({ width: "auto", maxWidth: "100%" }, opts.style || {}),
      onchange: function (e) { pick(e.target.value); changed(); } },
      options.map(function (o) {
        return el("option", { value: str(o.value), selected: str(o.value) === str(current) }, o.label);
      }));
  }
  function btn(text, hook, onClick, opts) {
    opts = opts || {};
    return el("button.btn.sm" + (opts.primary ? ".primary" : "") + (opts.ghost ? ".ghost" : ""), {
      dataset: hook ? { sc: hook } : null, title: opts.title || null, disabled: !!opts.disabled,
      style: opts.style || null,
      onclick: function () { if (onClick() !== false) changed(); } }, text);
  }
  function toggle(text, on, hook, onClick, opts) {
    opts = opts || {};
    return btn((on ? "✓ " : "") + text, hook, onClick, { primary: on, title: opts.title });
  }

  /* RETYPE, as Payroll does it (F13): the tab is built afresh off-screen and
     swapped in around the field being typed into. Every node is replaced
     except that field and the ancestors holding it, which keep their place
     (their attributes are brought up to date), so the caret, the typed string
     and a phone keyboard's composing word are never touched while every
     readout follows the keystroke. When the fresh tree does not line up, the
     tab is redrawn and the field focused again. */
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
  function graft(lp, np, keepNode, twin) {
    var before = [], after = [], past = false;
    [].slice.call(np.childNodes).forEach(function (c) {
      if (c === twin) past = true; else if (past) after.push(c); else before.push(c);
    });
    [].slice.call(lp.childNodes).forEach(function (c) { if (c !== keepNode) lp.removeChild(c); });
    before.forEach(function (c) { lp.insertBefore(c, keepNode); });
    after.forEach(function (c) { lp.appendChild(c); });
  }
  function redrawFocus(key, s0, s1) {
    EN.app.render();
    if (!key || !_mount) return;
    var n = _mount.querySelector('[data-sf="' + key + '"]');
    if (!n) return;
    try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); }
    if (typeof s0 === "number") { try { n.setSelectionRange(s0, s1); } catch (e) {} }
  }
  function retype(input) {
    var key = input && input.getAttribute ? input.getAttribute("data-sf") : null;
    var s0 = null, s1 = null;
    try { s0 = input.selectionStart; s1 = input.selectionEnd; } catch (e) { s0 = null; }
    if (!_mount || !document.body.contains(_mount) || !input || !_mount.contains(input) || !S()) { redrawFocus(key, s0, s1); return; }
    var holder = el("div");
    holder.appendChild(build());
    var twin = key ? holder.querySelector('[data-sf="' + key + '"]') : null;
    var live = chainOf(input, _mount), next = twin ? chainOf(twin, holder) : null;
    var fits = !!(live && next && live.length === next.length);
    for (var i = 0; fits && i < live.length; i++) if (live[i].nodeName !== next[i].nodeName) fits = false;
    if (!fits) { redrawFocus(key, s0, s1); return; }
    var sx = window.scrollX, sy = window.scrollY;
    var lp = _mount, np = holder;
    for (var k = 0; k < live.length; k++) {
      graft(lp, np, live[k], next[k]);
      syncAttrs(live[k], next[k]);
      lp = live[k]; np = next[k];
    }
    window.scrollTo(sx, sy);
  }

  /* COPY. The clipboard API first; a hidden textarea and execCommand where the
     API is missing or refuses (a file:// page can be either). */
  function copyText(text, what) {
    function fallback() {
      var ta = el("textarea", { value: text, style: { position: "fixed", top: "-1000px", left: "0", opacity: "0" } });
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? what + " copied." : "The browser blocked the copy. The text is in the box under the button.");
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast(what + " copied."); }, fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  /* ---- the crew, read and never written ----------------------------------- */
  function crewInfo(cal) {
    try { return EN.gmEngine.crew((cal !== undefined && cal !== null && cal !== "") ? { caliber: cal } : {}); }
    catch (e) { return null; }
  }
  function rosterRec(id) {
    var r = (EN.store && EN.store.roster && EN.store.roster()) || {};
    return own(r, id) ? r[id] : null;
  }
  /* The crew's Heat, one line per source: the highest value anyone on the
     crew holds with it (Heat is per Freelancer, and the book's checks run
     against the highest), with who holds that much. Sources compare trimmed
     and case-blind, the way the Heat write op matches them. */
  function crewHeat() {
    var c = crewInfo(), map = Object.create(null), out = [];
    ((c && c.members) || []).forEach(function (m) {
      var ch = rosterRec(m.charId);
      var rows = (ch && ch.face && Array.isArray(ch.face.heat)) ? ch.face.heat : [];
      rows.forEach(function (r) {
        if (!r || typeof r.source !== "string" || !r.source.trim()) return;
        var k = r.source.trim().toLowerCase(), v = clamp(Math.floor(Number(r.value)) || 0, 0, 10);
        var s = own(map, k) ? map[k] : null;
        if (!s) { s = map[k] = { key: k, source: r.source.trim(), value: v, holders: [] }; out.push(s); }
        if (v > s.value) { s.value = v; s.holders = []; }
        if (v === s.value && s.holders.indexOf(m.name) === -1) s.holders.push(m.name);
      });
    });
    return out.sort(function (a, b) { return (b.value - a.value) || (a.source < b.source ? -1 : 1); });
  }
  // the By Source row a typed source names ("South precinct" finds the precinct)
  function sourceRow(text) {
    var Src = ref(S().chase.refs.heatSources), t = str(text).trim().toLowerCase();
    if (!Src || !t) return null;
    return (Src.rows || []).filter(function (r) {
      return (r.match || []).some(function (m) { return t.indexOf(m) !== -1; });
    })[0] || null;
  }
  // every vehicle the crew's records hold, owned or leased
  function crewVehicles() {
    var c = crewInfo(), V = EN.vehicles, out = [];
    if (!V || !V.byName) return out;
    ((c && c.members) || []).forEach(function (m) {
      var ch = rosterRec(m.charId);
      (ch && Array.isArray(ch.equipment) ? ch.equipment : []).forEach(function (e) {
        if (!e || !(Number(e.qty) > 0) || typeof e.name !== "string") return;
        var base = e.name.replace(/\s*\(Lease\)$/, "");
        if (!own(V.byName, base)) return;
        out.push({ owner: m.name, name: e.name, prof: V.byName[base] });
      });
    });
    return out;
  }

  /* ---- the heading, the GM's Card, the undo strip ------------------------- */
  /* THE GM'S CARD lives in gm.js (EN.gmView.cardDrawer); every Admin tab
     shows its button beside the heading. Guarded the way the undo strip is:
     no drawer, no button. */
  function cardButton() {
    if (!EN.gmView || typeof EN.gmView.cardDrawer !== "function") return null;
    var n = null;
    try { n = EN.gmView.cardDrawer(); } catch (e) { n = null; }
    return (n && n.nodeType) ? n : null;
  }
  function heading(title, sub) {
    return el("div.row.between.wrap", { style: { marginBottom: "14px", gap: "8px", alignItems: "center" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" },
        html: title + ' <span class="dim3" style="font-size:13px">' + sub + "</span>" }),
      cardButton()
    ]);
  }
  // the newest standing GM write with its armed UNDO, as every Admin tab shows it
  function undoStrip() {
    try {
      return (EN.gmView && typeof EN.gmView.undoStrip === "function") ? (EN.gmView.undoStrip() || null) : null;
    } catch (e) { return null; }
  }

  /* The rules a scene runs on are Codex chapters (js/codex_gm_play.js, the
     gms- panels and the People and Heat ones they cite). These two draw the
     links; through EN.ui they print plain text when codex.js is missing. */
  // a help line whose rule names link into the Codex
  function rhelp(t, style) {
    return EN.ui.ruleText(el("p.help", { style: Object.assign({ margin: "4px 0 0" }, style || {}) }), t);
  }
  // a pointer into the Codex: a lead, then one link per [anchor, label]
  function codexLinks(lead, list) {
    var p = el("p.help", { dataset: { sc: "codex" }, style: { margin: "6px 0 0" } }, [document.createTextNode(lead + " ")]);
    list.forEach(function (it, i) {
      if (i) p.appendChild(document.createTextNode(DOT));
      p.appendChild(EN.ui.ruleLink(it[0], it[1]));
    });
    return p;
  }
  // a small "?" beside a working control, for the rule it runs on (null when the rule is not in reach)
  function ruleChip(anchor, title) { return EN.ui.ruleChip(anchor, title ? { title: title } : null); }

  /* ---- the sub-page bar and the open scene's controls ---------------------- */
  function pageBar() {
    var counts = { sitdown: 0, chase: 0, incursion: 0 };
    gm.list("scenes").forEach(function (r) { if (isObj(r) && own(counts, r.kind)) counts[r.kind] += 1; });
    return el("div.row.wrap", { dataset: { sc: "pages" }, style: { gap: "6px" } }, PAGES.map(function (p) {
      var on = _v.page === p.k;
      return el("span.chip" + (on ? ".on" : ""), { dataset: { sc: "page-" + p.k },
        style: { cursor: "pointer", fontSize: "11px", padding: "5px 12px" },
        onclick: function () { flushKeep(); _v.page = p.k; EN.app.render(); } },
        p.label + (counts[p.k] ? " (" + counts[p.k] + ")" : ""));
    }));
  }

  function exampleOf(kind) {
    var B = S()[kind];
    return B && B.example ? B.example : null;
  }
  function exampleName(kind) {
    var X = exampleOf(kind);
    if (!X) return "";
    if (kind === "incursion") return "The laundromat mirror";
    return X.name || "";
  }

  /* A button that throws away the open scene's unsaved changes asks first:
     armed (two clicks) while there is unsaved work, plain otherwise. */
  function discarding(key, text, hook, title, fn) {
    var kind = _v.page;
    if (unsavedWork(kind)) {
      var b = EN.ui.armButton("sc:" + key, { cls: ".btn.sm", label: text, armedLabel: "DISCARD THE DRAFT?",
        title: title, armedTitle: "The open scene has changes that are not saved. Click again to throw them away.",
        onConfirm: function () { fn(); changed(); } });
      b.setAttribute("data-sc", hook);
      return b;
    }
    return btn(text, hook, fn, { title: title });
  }

  function summaryOf(r) {
    if (!isObj(r)) return "";
    if (r.kind === "sitdown") {
      var d = restore("sitdown", r), max = startResolve(d);
      return "Resolve " + resolveNow(d) + " of " + max + DOT + "Round " + d.track.round + (d.opp.who ? DOT + d.opp.who : "");
    }
    if (r.kind === "chase") {
      var c = restore("chase", r), b = bandOf(c.lead.now);
      return "Lead " + c.lead.now + (b ? " (" + b.name + ")" : "") + DOT + (c.track.round ? "Round " + c.track.round : "not started") +
        DOT + c.vehicles.length + " " + plural(c.vehicles.length, "vehicle");
    }
    if (r.kind === "incursion") {
      var i = restore("incursion", r), st = stageOf(i.dive.stage);
      return "Rating " + i.rating + DOT + (st ? st.name : "Holding") + (i.dive.collapse ? DOT + upperFirst(i.dive.collapse) + " collapse" : "");
    }
    return "";
  }

  function scenePanel(kind) {
    var d = draft(kind), saved = !!savedRec(d), kids = [];
    var unsaved = unsavedWork(kind);
    var status = saved ? chipTag("SAVED" + DOT + "KEPT AS YOU GO", "var(--success)", "status")
      : unsaved ? chipTag("NOT SAVED", "var(--warn)", "status") : chipTag("NEW", "var(--text3)", "status");
    kids.push(row([
      field("Scene name", textIn("name", d.name, kind === "sitdown" ? "Thirty days at the clinic"
        : kind === "chase" ? "Out of Synth Flats" : "The laundromat mirror", function (v) { d.name = v; })),
      status
    ], { alignItems: "center", marginTop: 0 }));

    var btns = [];
    if (!saved) {
      btns.push(btn("SAVE", "save", function () {
        var rec = copy(d);
        rec.kind = kind;
        if (!str(rec.name).trim()) rec.name = d.name = defaultName(kind, d);
        var id = gm.put("scenes", rec);
        if (!id) { toast("Not saved: the GM data refused the write."); return; }
        d.id = id;
        _v.base[kind] = sig(d);
        toast("Saved " + d.name + ". Changes are kept as you go from here.");
      }, { primary: true }));
    } else {
      btns.push(btn("SAVE AS A NEW SCENE", "save-new", function () {
        var rec = copy(d);
        delete rec.id; delete rec.createdAt; delete rec.updatedAt;
        rec.kind = kind;
        rec.name = (str(d.name).trim() || defaultName(kind, d)) + " (copy)";
        var id = gm.put("scenes", rec);
        if (!id) { toast("Not saved: the GM data refused the write."); return; }
        setDraft(kind, restore(kind, gm.rec("scenes", id)));
        toast("Saved a copy: " + rec.name + ".");
      }));
    }
    btns.push(discarding("new:" + kind, "+ NEW", "new", "Start a blank " + pageOf(kind).label.toLowerCase(), function () {
      setDraft(kind, fresh(kind));
      _v.chk = { a: "", b: "", rollA: "", rollB: "", last: null };
    }));
    if (exampleOf(kind)) {
      btns.push(discarding("example:" + kind, "LOAD THE BOOK'S EXAMPLE", "example",
        "Open the book's worked example: " + exampleName(kind), function () {
          setDraft(kind, exampleDraft(kind));
          _v.chk = { a: "", b: "", rollA: "", rollB: "", last: null };
          toast("The book's example is open: " + exampleName(kind) + ".");
        }));
    }
    btns.push(btn("COPY", "copy", function () { copyText(sceneText(kind, d), "The scene"); return false; },
      { title: "Copy the whole scene as text" }));
    var reset = EN.ui.armButton("sc:reset:" + kind, { cls: ".btn.sm", label: "RESET THE TRACK", armedLabel: "RESET IT?",
      title: "Clear the live tracking and keep the prep",
      armedTitle: "Clears the rounds, the log and the meters, and keeps every prep field. Click again to confirm.",
      onConfirm: function () { resetTrack(kind, d); changed(); } });
    reset.setAttribute("data-sc", "reset");
    btns.push(reset);
    kids.push(row(btns, { alignItems: "center" }));

    // the saved scenes of this kind, newest first
    var list = gm.list("scenes").filter(function (r) { return isObj(r) && r.kind === kind; });
    if (list.length) {
      kids.push(el("div", { dataset: { sc: "saved" }, style: { marginTop: "12px" } }, [label("SAVED " + pageOf(kind).label + "S")].concat(list.map(function (r) {
        var isOpen = d.id === r.id;
        var del = EN.ui.armButton("sc:del:" + r.id, { cls: ".btn.sm", label: "✕", armedLabel: "DELETE?",
          title: "Delete this saved scene", armedTitle: "Deletes " + (r.name || "this scene") + " for good. Click again to confirm.",
          onConfirm: function () {
            gm.drop("scenes", r.id);
            if (_v.d[kind] && _v.d[kind].id === r.id) { _v.d[kind].id = null; _v.base[kind] = ""; }
            toast("Deleted " + (r.name || "the scene") + ".");
            EN.app.render();
          } });
        del.setAttribute("data-sc", "delete-" + r.id);
        return el("div.row.between.wrap", { dataset: { sc: "saved-" + r.id },
          style: { gap: "8px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" } }, [
          el("div", { style: { minWidth: 0, flex: "1 1 220px" } }, [
            el("span", { style: { fontWeight: 600, color: isOpen ? "var(--accent)" : "var(--text)" }, text: (r.name || "Untitled") + (isOpen ? "  (open)" : "") }),
            help(summaryOf(r) + DOT + "kept " + stamp(r.updatedAt), { margin: "2px 0 0" })
          ]),
          el("div.row", { style: { gap: "6px" } }, [
            isOpen ? null : discarding("open:" + r.id, "OPEN", "open-" + r.id, "Open this scene", function () {
              flushKeep();
              setDraft(kind, restore(kind, gm.rec("scenes", r.id)));
            }),
            del
          ])
        ]);
      }))));
    }
    var P = pageOf(kind);
    return EN.ui.panel(P.label === "SIT-DOWN" ? "The Sit-Down" : P.label === "CHASE" ? "The Chase" : "The Incursion",
      P.tag, kids);
  }
  function pageOf(kind) { return PAGES.filter(function (p) { return p.k === kind; })[0] || PAGES[0]; }
  function defaultName(kind, d) {
    if (kind === "sitdown") return d.opp.who ? "Sit-Down with " + d.opp.who : "A Sit-Down";
    if (kind === "chase") return d.who.chasing ? "Chase: " + d.who.chasing : "A chase";
    return "A rating " + d.rating + " Incursion";
  }
  function resetTrack(kind, d) {
    if (kind === "sitdown") d.track = { round: 1, posture: false, adj: 0, log: [] };
    else if (kind === "chase") { d.track = { round: 0, log: [], stale: null, speed: "", impact: "" }; d.lead.now = d.lead.start; d.vehicles.forEach(function (v) { v.hit = 0; }); _v.chk.last = null; }
    else { d.dive = { stage: 0, pushes: [], collapse: "" }; d.anchor.hit = 0; d.steps = []; if (d.chromatic.met) { d.chromatic.met = false; d.base = d.chromatic.from === "sealed" ? "sealed" : "open"; } }
  }

  /* =====================================================================
     SIT-DOWN
     ===================================================================== */
  function SD() { return S().sitdown; }
  function tierOf(key) { return byKey(SD().resolveTiers, key); }
  function startResolve(d) { return Math.max(0, int(d.opp.resolve) || 0); }
  function resolveNow(d) {
    var cur = startResolve(d) + (int(d.track.adj) || 0);
    if (cur < 0) cur = 0;
    d.track.log.forEach(function (x) { cur = Math.max(0, cur - (x.pressure | 0) + (x.gain | 0)); });
    return cur;
  }
  function approachName(k) {
    if (!k) return "";
    var W = SD().weakSpots;
    if (k === W.insight.key) return W.insight.name;
    var a = byKey(W.approaches, k);
    return a ? a.name : k;
  }
  // the multiplier the open scene's weak spots put on an Approach, and why
  function multOf(d, k) {
    var W = SD().weakSpots;
    if (k === W.insight.key) return { mult: 0, why: W.insight.text };
    if (k && k === d.weak.double) return { mult: W.pressureMult.double, why: "weak spot: double Pressure" };
    if (k && k === d.weak.none) return { mult: W.pressureMult.none, why: "weak spot: no Pressure" };
    return { mult: 1, why: "" };
  }
  function lastResult(d) { var L = d.track.log; return L.length ? L[L.length - 1] : null; }

  // where the person in the chair can come from: a Bestiary entry that prints Resolve, or a saved contact
  /* A contact is the People tab's card (bag `contacts`): its Resolve line
     ("5 (Standard)", or the number when only that is kept), its Profile of the
     crew and its weak spots, which use the same Approach keys as this file. */
  function oppSources() {
    var out = [];
    ((EN.bestiary && EN.bestiary.entries) || []).forEach(function (e) {
      if (e && e.stats && e.stats.Resolve) out.push({ value: "bestiary:" + e.name, label: e.name + " (Resolve " + e.stats.Resolve + ")",
        name: e.name, resolve: String(e.stats.Resolve), profile: "", weak: null });
    });
    gm.list("contacts").forEach(function (c) {
      if (!isObj(c) || typeof c.id !== "string") return;
      var nm = str(c.name).trim() || "A contact";
      var rs = str(c.resolve).trim() || (typeof c.resolveValue === "number" ? String(c.resolveValue) : "");
      out.push({ value: "contact:" + c.id, label: nm + (rs ? " (Resolve " + rs + ")" : "") + DOT + "contact",
        name: nm, resolve: rs, profile: str(c.profile), weak: isObj(c.weak) ? c.weak : null });
    });
    return out;
  }
  /* "8 (Hardened)" read as the number and the tier key. The Bestiary prints
     some with a qualifier after the tier ("5 (Standard; Iron against anything
     that would make them break their word)"): the tier is the name before the
     first ";", and the rest comes back as `note`. */
  function readResolve(s) {
    var m = String(s || "").match(/(\d+)\s*\+?\s*(?:\((.*)\))?/);
    if (!m) return null;
    var inner = str(m[2]), cut = inner.indexOf(";");
    var name = (cut === -1 ? inner : inner.slice(0, cut)).trim().toLowerCase();
    var t = name ? (SD().resolveTiers || []).filter(function (x) { return x.name.toLowerCase() === name; })[0] : null;
    return { value: Number(m[1]), tier: t ? t.key : "", note: cut === -1 ? "" : inner.slice(cut + 1).trim() };
  }
  /* The weak spots a qualifier names: "double Pressure from X" and "none from
     Y", each only where X or Y starts with an Approach's name ("Insight-driven
     approaches" names none: Insight never moves Resolve). The reason is the
     qualifier's other sentences. */
  function weakFromNote(note) {
    var s = str(note), out = { double: "", none: "", why: "" }, aps = SD().weakSpots.approaches;
    function ap(phrase) {
      var p = phrase.trim().toLowerCase(), hit = "";
      aps.forEach(function (a) {
        var n = a.name.toLowerCase();
        if (!hit && p.indexOf(n) === 0 && !/[a-z]/.test(p.charAt(n.length))) hit = a.key;
      });
      return hit;
    }
    var md = s.match(/\bdouble(?:\s+Pressure)?\s+from\s+([^,.;]+)/i), mn = s.match(/\bnone\s+from\s+([^,.;]+)/i);
    if (md) out.double = ap(md[1]);
    if (mn) out.none = ap(mn[1]);
    if (out.double && out.double === out.none) out.double = "";
    if (out.double || out.none) {
      out.why = s.split(/\.\s+/).filter(function (x) { return !/\b(double|none)\b[^.]*\bfrom\b/i.test(x); })
        .map(function (x) { return x.trim().replace(/\.$/, ""); }).filter(Boolean).join(". ");
    }
    return out;
  }
  function setOpposition(d, o) {
    d.opp.who = str(o.name);
    var r = readResolve(o.resolve);
    if (r) { d.opp.resolve = String(r.value); d.opp.tier = r.tier || ""; }
    // a printed qualifier: a weak spot it names fills that line, and the whole of it goes in the notes
    if (r && r.note) {
      var nw = weakFromNote(r.note);
      ["double", "none"].forEach(function (k) {
        if (!nw[k]) return;
        d.weak[k] = nw[k];
        d.weak[k + "Why"] = nw.why;
        var other = k === "double" ? "none" : "double";
        if (d.weak[other] === nw[k]) { d.weak[other] = ""; d.weak[other + "Why"] = ""; }
      });
      var line = "Resolve: " + r.note.replace(/\.$/, "") + ".";
      if (str(d.notes).indexOf(line) === -1) d.notes = str(d.notes).trim() ? str(d.notes).replace(/\s+$/, "") + "\n" + line : line;
    }
    if (o.profile) d.opp.profile = str(o.profile);
    // a card's weak spots come across when it has them, an Approach key only where it names one
    var w = isObj(o.weak) ? o.weak : null, aps = SD().weakSpots.approaches;
    if (w) {
      ["double", "none"].forEach(function (k) {
        if (typeof w[k] === "string" && byKey(aps, w[k])) d.weak[k] = w[k];
        if (typeof w[k + "Why"] === "string" && w[k + "Why"].trim()) d.weak[k + "Why"] = w[k + "Why"];
      });
    }
  }

  function sitdownPage(d) {
    return [sitdownPrep(d), gap(), sitdownTable(d), gap(), sitdownRef(d)];
  }

  function sitdownPrep(d) {
    var B = SD(), C = B.checklist, kids = [help(B.intro, { margin: "0 0 4px" })];
    function step(n) { return C.filter(function (s) { return s.n === n; })[0]; }
    function stepBlock(s, body) {
      return el("div", { dataset: { sc: "step-" + s.key } }, [stepHead(s.n, s.name), rhelp(s.text, { margin: "0 0 2px" })].concat(body));
    }
    function lab(s, k) { var f = (s.fields || []).filter(function (x) { return x.key === k; })[0]; return f ? upperFirst(f.label) : k; }

    // 1. stakes
    var s1 = step(1);
    kids.push(stepBlock(s1, [row([
      field(lab(s1, "crewWants"), textIn("sd.crewWants", d.stakes.crewWants, "", function (v) { d.stakes.crewWants = v; })),
      field(lab(s1, "oppWants"), textIn("sd.oppWants", d.stakes.oppWants, "", function (v) { d.stakes.oppWants = v; }))
    ]), row([
      field(lab(s1, "concedes"), textIn("sd.concedes", d.stakes.concedes, "", function (v) { d.stakes.concedes = v; })),
      field(lab(s1, "offers"), textIn("sd.offers", d.stakes.offers, "", function (v) { d.stakes.offers = v; }))
    ])]));

    // 2. the Opposition
    var s2 = step(2), srcs = oppSources();
    var tiers = (B.resolveTiers || []).map(function (t) { return { value: t.key, label: t.name + " (" + t.text + ")" }; });
    kids.push(stepBlock(s2, [row([
      field(lab(s2, "who"), textIn("sd.who", d.opp.who, "A Kindred recovery lead", function (v) { d.opp.who = v; })),
      srcs.length ? field("From the Bestiary or a contact", selectIn("sd.from",
        [{ value: "", label: "Typed in..." }].concat(srcs), d.opp.from, function (v) {
          d.opp.from = v;
          var hit = srcs.filter(function (x) { return x.value === v; })[0];
          if (hit) setOpposition(d, hit);
        }, { style: { width: "100%" } })) : null
    ]), row([
      field("Opposition tier", selectIn("sd.tier", [{ value: "", label: "Not a listed tier" }].concat(tiers), d.opp.tier, function (v) {
        d.opp.tier = v;
        var t = tierOf(v);
        if (t) d.opp.resolve = String(t.resolve);
      }), "0 1 180px"),
      field(upperFirst(lab(s2, "resolve")), numIn("sd.resolve", d.opp.resolve, function (v) { d.opp.resolve = v; },
        { min: 0, title: "The Resolve they start the scene with" }), "0 1 110px"),
      field(upperFirst(lab(s2, "profile")), textIn("sd.profile", d.opp.profile, "Desperate", function (v) { d.opp.profile = v; },
        { list: "sc-profiles" }), "1 1 180px"),
      profileRoll(d)
    ]), profileLine(d), help(s2.contact, { color: "var(--text3)" })]));

    // 3. weak spots
    var s3 = step(3), W = B.weakSpots;
    var apOpts = [{ value: "", label: "Not set" }].concat(W.approaches.map(function (a) { return { value: a.key, label: a.name }; }));
    kids.push(stepBlock(s3, [row([
      field(lab(s3, "double"), selectIn("sd.double", apOpts, d.weak.double, function (v) { d.weak.double = v; if (v && v === d.weak.none) d.weak.none = ""; }), "0 1 200px"),
      field("The reason", textIn("sd.doubleWhy", d.weak.doubleWhy, "", function (v) { d.weak.doubleWhy = v; }))
    ]), row([
      field(upperFirst(lab(s3, "none")), selectIn("sd.none", apOpts, d.weak.none, function (v) { d.weak.none = v; if (v && v === d.weak.double) d.weak.double = ""; }), "0 1 200px"),
      field("The reason", textIn("sd.noneWhy", d.weak.noneWhy, "", function (v) { d.weak.noneWhy = v; }))
    ])]));

    // 4. postures
    var s4 = step(4), Po = B.postures;
    kids.push(stepBlock(s4, [row([
      field("First Posture", textIn("sd.posture1", d.postures.first, "Stonewall", function (v) { d.postures.first = v; }, { list: "sc-postures" }), "0 1 170px"),
      field("How they do it", textIn("sd.posture1note", d.postures.firstNote, "she reads the contract aloud, slowly", function (v) { d.postures.firstNote = v; }))
    ]), row([
      field("Second Posture", textIn("sd.posture2", d.postures.second, "Compose", function (v) { d.postures.second = v; }, { list: "sc-postures" }), "0 1 170px"),
      field("How they do it", textIn("sd.posture2note", d.postures.secondNote, "", function (v) { d.postures.secondNote = v; }))
    ]), help("The book names " + Po.named.map(function (p) { return p.name; }).join(", ") + ". " +
      (Po.notCarried ? Po.notCarried.replace(/\.$/, ", so type any other.") : "Type any other."), { color: "var(--text3)" })]));

    // 5. the Floor
    var s5 = step(5), F = B.floor;
    var floorKids = [el("div.row.wrap", { style: { gap: "6px", marginTop: "6px" } }, d.floor.map(function (f) {
      var p = byKey(F.pressures, f.key);
      return toggle(p ? p.name : f.key, f.live, "floor-live-" + f.key, function () { f.live = !f.live; if (!f.live) f.flipped = false; },
        { title: "Is this pressure live in the room?" });
    }))];
    d.floor.forEach(function (f) {
      if (!f.live) return;
      var p = byKey(F.pressures, f.key);
      floorKids.push(el("div.feature", { dataset: { sc: "floor-" + f.key }, style: { marginTop: "8px" } }, [
        el("span", { style: { fontWeight: 600 }, text: p ? p.name : f.key }),
        row([
          field("Where", textIn("sd.floor." + f.key + ".where", f.where, "a Kindred clinic waiting room", function (v) { f.where = v; })),
          field("What it does here", textIn("sd.floor." + f.key + ".effect", f.effect, "Snag for the crew", function (v) { f.effect = v; }))
        ]),
        row([field("The legwork that flips it", textIn("sd.floor." + f.key + ".flip", f.flip, "", function (v) { f.flip = v; }))])
      ]));
    });
    floorKids.push(help(F.callOut, { color: "var(--text3)" }));
    kids.push(stepBlock(s5, floorKids));

    // 6. the clock in the room
    var s6 = step(6);
    kids.push(stepBlock(s6, [row([
      field(lab(s6, "round"), textIn("sd.round", d.clock.round, "A Round is a few minutes.", function (v) { d.clock.round = v; })),
      field("Rounds before it runs long", numIn("sd.rounds", d.clock.rounds, function (v) { d.clock.rounds = v; }, { min: 1, ph: "5" }), "0 1 150px")
    ]), row([
      field(upperFirst(lab(s6, "runsLong")), textIn("sd.runsLong", d.clock.runsLong, (s6.examples || []).join(", "), function (v) { d.clock.runsLong = v; }, { area: true }))
    ])]));

    // 7. fallout, written in advance
    var s7 = step(7), CF = B.criticalFailure;
    kids.push(stepBlock(s7, [row([
      field("On a win", textIn("sd.win", d.fallout.win, "", function (v) { d.fallout.win = v; }, { area: true }))
    ]), row([
      field("On a Mixed Result", textIn("sd.mixed", d.fallout.mixed, "", function (v) { d.fallout.mixed = v; }, { area: true })),
      field("On a Critical Failure", textIn("sd.critical", d.fallout.critical, "", function (v) { d.fallout.critical = v; }, { area: true }))
    ]), help(CF.domain + ": " + CF.text, { color: "var(--text3)" }),
      codexLinks("Social Fallout, as near as the app carries it:", [["rz-social", "Social Consequences & Cost Tracks"]])]));

    kids.push(row([field("Notes", textIn("sd.notes", d.notes, "", function (v) { d.notes = v; }, { area: true }))], { marginTop: "14px" }));

    // the suggestion lists the Posture and Profile fields offer
    var prof = ref(B.refs.theirProfile);
    kids.push(el("datalist#sc-postures", null, Po.named.map(function (p) { return el("option", { value: p.name }); })));
    kids.push(el("datalist#sc-profiles", null, ((prof && prof.rows) || []).map(function (r) { return el("option", { value: r.name }); })
      .concat(((prof && prof.earned && prof.earned.names) || []).map(function (n) { return el("option", { value: n }); }))));
    return EN.ui.panel("Prepping a Sit-Down", "THE PREP CARD", kids);
  }

  // Their Profile of You: roll the d12 for the Opposition's Profile of the crew
  function profileRoll(d) {
    var P = ref(SD().refs.theirProfile);
    if (!P || !P.rows || !P.rows.length) return null;
    return btn("ROLL " + String(P.die || "d12").toUpperCase(), "sd-profile-roll", function () {
      var n = die(P.sides || 12), r = P.rows.filter(function (x) { return x.n === n; })[0];
      if (r) { d.opp.profile = r.name; toast("Their Profile of the crew: " + r.name + " (" + n + ")."); }
    }, { title: "Roll their Profile of the crew on the book's d12" });
  }
  function profileLine(d) {
    var P = ref(SD().refs.theirProfile), name = str(d.opp.profile).trim().toLowerCase();
    if (!P || !name) return null;
    var r = (P.rows || []).filter(function (x) { return x.name.toLowerCase() === name; })[0];
    return r ? help(r.name + ": " + r.heard, { color: "var(--text2)" }) : null;
  }

  function sitdownTable(d) {
    var B = SD(), kids = [];
    var max = startResolve(d), now = resolveNow(d), last = lastResult(d);
    var tier = tierOf(d.opp.tier);
    var broke = max > 0 && now <= B.breaksAt;

    // the meter
    kids.push(el("div.row.between.wrap", { style: { gap: "10px", alignItems: "baseline" } }, [
      el("div", null, [
        label("RESOLVE"),
        el("div", { dataset: { sc: "resolve", now: String(now), max: String(max) },
          style: { fontFamily: "var(--mono)", fontSize: "26px", color: broke ? "var(--success)" : "var(--accent)" },
          text: now + " / " + max })
      ]),
      el("div", { style: { textAlign: "right" } }, [
        label("OPPOSITION"),
        el("div", { style: { fontWeight: 600 }, text: (str(d.opp.who).trim() || "Not named yet") +
          (max ? ", Resolve " + max + (tier ? " (" + tier.name + ")" : "") : "") }),
        d.opp.profile ? help("Profile of the crew: " + d.opp.profile, { margin: 0 }) : null
      ])
    ]));
    kids.push(el("div", { style: { margin: "6px 0 4px" } }, [bar(now, max, broke ? "var(--success)" : "var(--accent)")]));
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
      label("BY HAND"),
      btn(MINUS + "1", "sd-adj-minus", function () { d.track.adj = (int(d.track.adj) || 0) - 1; }, { title: "Take 1 Resolve off by hand" }),
      btn("+1", "sd-adj-plus", function () { d.track.adj = (int(d.track.adj) || 0) + 1; }, { title: "Put 1 Resolve back by hand" }),
      d.track.adj ? help("Adjusted by hand: " + fmtMod(int(d.track.adj) || 0) + ".", { margin: 0 }) : null
    ]));

    // the round, the one Posture a Round, the clock in the room
    var rounds = int(d.clock.rounds);
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "12px" } }, [
      el("span.mono", { dataset: { sc: "sd-round" }, style: { fontSize: "14px", letterSpacing: ".08em" },
        text: "ROUND " + d.track.round + (rounds ? " OF " + rounds : "") }),
      btn("NEXT ROUND ›", "sd-next", function () { d.track.round += 1; d.track.posture = false; }, { primary: true }),
      toggle("POSTURE USED THIS ROUND", d.track.posture, "sd-posture", function () { d.track.posture = !d.track.posture; },
        { title: B.postures.rule })
    ]));
    kids.push(help(B.postures.rule + (d.postures.first || d.postures.second ? " They reach for " +
      [d.postures.first, d.postures.second].filter(function (x) { return str(x).trim(); }).join(" and ") + " first." : ""), { color: "var(--text3)" }));
    if (d.clock.round) kids.push(help(d.clock.round, { color: "var(--text2)" }));
    if (rounds && d.track.round > rounds) {
      kids.push(el("div.feature", { dataset: { sc: "sd-clock" }, style: { borderLeftColor: "var(--warn)", marginTop: "8px" } }, [
        el("span", { style: { fontWeight: 600, color: "var(--warn)" }, text: "The scene has run past " + rounds + " " + plural(rounds, "Round") + "." }),
        help(str(d.clock.runsLong).trim() || "Nothing written for this yet.", { margin: "2px 0 0" })
      ]));
    }

    // weak spots, as the next result will read them
    var wk = [];
    if (d.weak.double) wk.push(chipTag("DOUBLE: " + approachName(d.weak.double).toUpperCase(), "var(--success)"));
    if (d.weak.none) wk.push(chipTag("NONE: " + approachName(d.weak.none).toUpperCase(), "var(--danger)"));
    if (wk.length) kids.push(el("div.row.wrap", { style: { gap: "6px", marginTop: "10px" } }, wk));

    // the Approach, then the result: the results table is the input
    var W = B.weakSpots;
    var aps = [{ k: "", n: "ANY" }].concat(W.approaches.map(function (a) { return { k: a.key, n: a.name.toUpperCase() }; }))
      .concat([{ k: W.insight.key, n: W.insight.name.toUpperCase() }]);
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "12px" } }, [label("APPROACH")].concat(aps.map(function (a) {
      return el("span.chip" + (_v.approach === a.k ? ".on" : ""), { dataset: { sc: "ap-" + (a.k || "any") },
        style: { cursor: "pointer", fontSize: "10.5px" }, onclick: function () { _v.approach = a.k; EN.app.render(); } }, a.n);
    }))));
    var m = multOf(d, _v.approach);
    if (m.why) kids.push(help(upperFirst(m.why) + ".", { color: m.mult > 1 ? "var(--success)" : "var(--warn)" }));

    /* The card's RESULT, PRESSURE and ALSO columns, one row per result, set as
       wrapping rows rather than a table so a phone never scrolls sideways. Each
       result is a Dice Pool margin (`margin`), whose rule the "?" opens. */
    var mchip = ruleChip("rz-margin", "Dice Pool Success Margin");
    if (mchip) kids.push(el("div.row.wrap", { dataset: { sc: "results-head" }, style: { gap: "6px", alignItems: "center", marginTop: "10px" } },
      [label("RESULT, AS ITS DICE POOL MARGIN"), mchip]));
    kids.push(el("div", { dataset: { sc: "results" }, style: { marginTop: "8px" } }, B.results.map(function (r) {
      var p = r.pressure * m.mult;
      return el("div.row.between.wrap", { dataset: { sc: "res-row-" + r.key },
        style: { gap: "6px 10px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" } }, [
        el("div", { style: { flex: "1 1 200px", minWidth: 0 } }, [
          el("div.row.wrap", { style: { gap: "4px 10px", alignItems: "baseline" } }, [
            el("span", { style: { fontWeight: 600, minWidth: "72px" }, text: r.name }),
            el("span.mono", { style: { fontSize: "12px", color: "var(--text2)" }, text: "PRESSURE " + r.pressure }),
            el("span.mono", { style: { fontSize: "12px", color: p !== r.pressure ? "var(--accent)" : "var(--text3)" },
              text: "THIS APPROACH: " + (p ? p : "none") + (r.resolveGain ? ", +" + r.resolveGain + " RESOLVE" : "") })
          ]),
          r.also ? help(r.also, { margin: "2px 0 0" }) : null
        ]),
        btn("LOG", "res-" + r.key, function () {
          if (broke) { toast("Resolve is already at 0: the Opposition has broken."); return false; }
          var mm = multOf(d, _v.approach);
          d.track.log.push({ id: lid("sl"), round: d.track.round, approach: _v.approach, result: r.key,
            pressure: r.pressure * mm.mult, gain: r.resolveGain || 0, why: mm.why });
        }, { disabled: !max })
      ]);
    })));
    if (!max) kids.push(help("Set the Opposition's Resolve on the prep card to start logging results.", { color: "var(--warn)" }));

    // what the last result asks for, and the break
    if (broke) {
      var won = rowAt(B.milestone);
      kids.push(el("div.feature", { dataset: { sc: "sd-broke" }, style: { borderLeftColor: "var(--success)", marginTop: "10px" } }, [
        el("span", { style: { fontWeight: 600, color: "var(--success)" }, text: "Resolve 0. The Opposition breaks." }),
        help("They concede: " + said(d.stakes.concedes)),
        help("Written for a win: " + said(d.fallout.win)),
        won ? help("A " + (won.kind === "major" ? "Major" : "Minor") + " Milestone: " + won.text + ".", { color: "var(--gold)" }) : null
      ]));
    } else if (last && last.result === "mixed") {
      var Rm = byKey(B.results, "mixed");
      kids.push(el("div.feature", { dataset: { sc: "sd-mixed" }, style: { borderLeftColor: "var(--warn)", marginTop: "10px" } }, [
        el("span", { style: { fontWeight: 600 }, text: "Mixed Result: " + Rm.also + "." }),
        help("Written for a Mixed Result: " + said(d.fallout.mixed))
      ]));
    } else if (last && last.result === "critical") {
      var Rc = byKey(B.results, "critical"), CF = B.criticalFailure;
      kids.push(el("div.feature", { dataset: { sc: "sd-critical" }, style: { borderLeftColor: "var(--danger)", marginTop: "10px" } }, [
        el("span", { style: { fontWeight: 600, color: "var(--danger)" }, text: "Critical: " + Rc.also + "." }),
        help("Written for a Critical Failure: " + said(d.fallout.critical)),
        help(CF.heatText, { color: "var(--text3)" })
      ]));
    }

    // the Floor in play: the live pressures, and the ones the crew has flipped
    var live = d.floor.filter(function (f) { return f.live; });
    if (live.length) {
      kids.push(el("div", { style: { marginTop: "12px" } }, [label("THE FLOOR")].concat(live.map(function (f) {
        var p = byKey(B.floor.pressures, f.key);
        return el("div.row.between.wrap", { dataset: { sc: "floor-play-" + f.key },
          style: { gap: "8px", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)" } }, [
          el("div", { style: { minWidth: 0, flex: "1 1 220px", textDecoration: f.flipped ? "line-through" : "none",
            color: f.flipped ? "var(--text3)" : "var(--text)" } }, [
            el("span", { style: { fontWeight: 600 }, text: (p ? p.name : f.key) + (f.where ? ": " + f.where : "") }),
            f.effect ? help(f.effect, { margin: 0 }) : null,
            f.flip && !f.flipped ? help("Flip it: " + f.flip, { margin: 0, color: "var(--text3)" }) : null
          ]),
          toggle(f.flipped ? "FLIPPED" : "FLIP IT", f.flipped, "floor-flip-" + f.key, function () { f.flipped = !f.flipped; })
        ]);
      }))));
    }

    // the log
    if (d.track.log.length) {
      kids.push(el("div", { dataset: { sc: "sd-log" }, style: { marginTop: "12px" } }, [
        el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
          label("PRESSURE LOG"),
          btn("UNDO THE LAST", "sd-undo", function () { d.track.log.pop(); }, { ghost: true })
        ])
      ].concat(d.track.log.map(function (x) {
        var r = byKey(B.results, x.result);
        return help("Round " + x.round + DOT + (x.approach ? approachName(x.approach) + DOT : "") + (r ? r.name : x.result) + ": " +
          (x.pressure ? x.pressure + " Pressure" : "no Pressure") + (x.gain ? ", +" + x.gain + " Resolve" : "") + (x.why ? " (" + x.why + ")" : ""),
          { margin: "2px 0 0" });
      }))));
    }
    return EN.ui.panel("Across the Table", broke ? "BROKEN" : "ROUND " + d.track.round, kids, { glow: !broke && d.track.log.length > 0 });
  }

  /* The reference the Sit-Down runs on is the Codex's Sit-Down Rules, with
     Resolve by Role and Their Profile of You (one copy, which People links to
     as well) and Cooling Off's legal scrub. The home line stays: it says the
     PHB's own rules are not in the app. */
  function sitdownRef(d) {
    var B = SD(), kids = [];
    kids.push(help(B.home, { margin: 0 }));
    var R = ref(B.refs.resolveByRole), P = ref(B.refs.theirProfile), scrub = rowAt(B.legalScrub);
    kids.push(codexLinks("In the Codex:", [["gms-sitdown", "Sit-Down Rules"]]
      .concat(R ? [["gmp-resolve", R.title || "Resolve by Role"]] : [])
      .concat(P ? [["gmp-profiles", P.title || "Their Profile of You"]] : [])
      .concat(scrub ? [["gmx-cooling/legal-scrub", "A Sit-Down that clears Heat"]] : [])));
    return EN.ui.panel("Reference", "SIT-DOWN RULES", kids);
  }

  /* =====================================================================
     CHASE
     ===================================================================== */
  function CH() { return S().chase; }
  function speeds() {
    var s = ref(CH().refs.impactBySpeed);
    return Array.isArray(s) ? s.filter(function (x) { return x && typeof x.dc === "number"; }) : [];
  }
  function speedKey(text) {
    var t = str(text).trim().toLowerCase();
    var hit = speeds().filter(function (x) { return x.speed.toLowerCase() === t || x.key === t; })[0];
    return hit ? hit.key : "";
  }
  function speedOf(key) { return byKey(speeds(), key); }
  function bandOf(lead) {
    return (CH().lead.bands || []).filter(function (b) { return lead >= b.from && lead <= b.to; })[0] || null;
  }
  function gapAt(lead) {
    var b = bandOf(lead), g = b ? (b.gaps || []).filter(function (x) { return x.lead === lead; })[0] : null;
    return g ? g.spaces : null;
  }
  function pilotRow(grade) {
    return (CH().threatPilot.movingDefense || []).filter(function (r) { return grade >= r.gradeLow && grade <= r.gradeHigh; })[0] || null;
  }
  function movingDefense(v) {
    var g = int(v.grade), h = int(v.handling);
    if (g === null || h === null) return null;
    var r = pilotRow(g);
    return r ? r.base + h + r.bonus : null;
  }
  function pilotingOf(v) {
    var a = int(v.attack), h = int(v.handling);
    return (a === null || h === null) ? null : a + h;
  }
  function integrityNow(v) {
    var m = int(v.integrity);
    return m === null ? null : Math.max(0, m - (v.hit | 0));
  }
  function firstResponse(heat) {
    var F = CH().firstResponse, h = int(heat);
    if (h === null) return null;
    h = clamp(h, 0, 10);
    return Math.max(F.min, F.base - Math.floor(h / F.heatDivisor));
  }
  // a side of the chase by its vehicles: "The runner (The crew's sedan)"
  function sideName(d, side) {
    var who = side === "running" ? "The runner" : "The pursuit";
    var names = d.vehicles.filter(function (v) { return v.side === side && str(v.name).trim(); }).map(function (v) { return v.name.trim(); });
    return names.length ? who + " (" + names.join(", ") + ")" : who;
  }
  // a vehicle line from a printed profile (a Hostile Vehicle or a crew catalog ride)
  function lineFrom(p, from, side, owner) {
    var rules = p.rules || [];
    var weapons = rules.filter(function (r) { return /weapon/i.test(r.name); }).map(function (r) { return r.text; }).join(" ");
    if (!weapons && p.loadout) weapons = p.loadout;
    var notes = rules.filter(function (r) { return !/weapon/i.test(r.name); }).map(function (r) { return r.name + ": " + r.text; }).join(" ");
    return { lid: lid("v"), side: side, from: from, name: p.name, owner: owner || "", speed: speedKey(p.speed),
             handling: str(p.handling), structure: str(p.structure), integrity: str(p.integrity), hit: 0,
             weapons: weapons, notes: notes, grade: "", attack: "", aboard: "", bestiary: "" };
  }
  function blankLine(side) {
    return { lid: lid("v"), side: side, from: "custom", name: "", owner: "", speed: "", handling: "", structure: "", integrity: "",
             hit: 0, weapons: "", notes: "", grade: "", attack: "", aboard: "", bestiary: "" };
  }
  function bestEntry(name) {
    var n = str(name).trim();
    if (!n || !EN.bestiary || !EN.bestiary.entries) return null;
    return EN.bestiary.entries.filter(function (e) { return e && e.name === n; })[0] || null;
  }
  function chaseLog(d, text) { d.track.log.push({ id: lid("cl"), round: d.track.round, text: text }); }

  function chasePage(d) {
    return [chasePrep(d), gap(), chaseTable(d), gap(), chaseRef(d)];
  }

  function chasePrep(d) {
    var B = CH(), C = B.checklist, kids = [help(B.intro, { margin: "0 0 4px" })];
    function step(n) { return C.filter(function (s) { return s.n === n; })[0]; }
    function stepBlock(s, body) {
      var text = s.text || (s.textRef ? ref(s.textRef) : "") || "";
      return el("div", { dataset: { sc: "step-" + s.key } }, [stepHead(s.n, s.name), text ? help(text, { margin: "0 0 2px" }) : null].concat(body));
    }

    // 1. who
    var s1 = step(1);
    kids.push(stepBlock(s1, [row([
      field("Who's running", textIn("ch.running", d.who.running, "the crew, in their sedan", function (v) { d.who.running = v; })),
      field("Who's chasing", textIn("ch.chasing", d.who.chasing, "two Homeward Interdiction Units", function (v) { d.who.chasing = v; }))
    ]), row([
      field("What the pursuer wants", textIn("ch.wants", d.who.wants, (s1.wants || []).join(", "), function (v) { d.who.wants = v; }))
    ])]));

    // 2. the vehicles
    kids.push(stepBlock(step(2), vehiclesBlock(d)));

    // 3. starting Lead
    var s3 = step(3), leadOpts = [];
    for (var L = B.lead.min; L <= B.lead.max; L++) {
      var bb = bandOf(L);
      leadOpts.push({ value: L, label: L + (bb ? " (" + bb.name + ")" : "") });
    }
    kids.push(stepBlock(s3, [row([
      field("Starting Lead", selectIn("ch.start", leadOpts, d.lead.start, function (v) {
        d.lead.start = clamp(int(v) || 0, B.lead.min, B.lead.max);
        if (!d.track.round) d.lead.now = d.lead.start;
      }), "0 1 150px"),
      field("Why, when it isn't " + B.lead.start, textIn("ch.why", d.lead.why, "The crew got to the car first.", function (v) { d.lead.why = v; }))
    ])]));

    // 4. the route
    var s4 = step(4), St = ref(B.refs.stalemate);
    var dists = ((St && St.districts) || []).map(function (x) { return { value: x.key, label: x.name }; });
    kids.push(stepBlock(s4, [row([
      dists.length ? field("Which district", selectIn("ch.district", [{ value: "", label: "Pick a district..." }].concat(dists), d.route.district,
        function (v) { d.route.district = v; }), "0 1 170px") : null,
      field("Whose territory", textIn("ch.territory", d.route.territory, "", function (v) { d.route.territory = v; }))
    ]), row([
      field("The straightaway (" + s4.straightaway + ")", textIn("ch.straight", d.route.straightaway, "", function (v) { d.route.straightaway = v; })),
      field("The tangle (" + s4.tangle + ")", textIn("ch.tangle", d.route.tangle, "", function (v) { d.route.tangle = v; }))
    ])]));

    // 5. escalation
    var s5 = step(5), heat = crewHeat();
    var srcOpts = heat.map(function (h) {
      return { value: h.key, label: h.source + DOT + "Heat " + h.value + (h.holders.length ? " (" + h.holders.join(", ") + ")" : "") };
    });
    var esc = [row([
      srcOpts.length ? field("The crew's Heat", selectIn("ch.heatPick", [{ value: "", label: "Pick a source..." }].concat(srcOpts),
        str(d.esc.source).trim().toLowerCase(), function (v) {
          var h = heat.filter(function (x) { return x.key === v; })[0];
          if (h) { d.esc.source = h.source; d.esc.heat = String(h.value); }
        }), "0 1 240px") : null,
      field("The source", textIn("ch.source", d.esc.source, "Homeward", function (v) { d.esc.source = v; }), "1 1 160px"),
      field("Heat with it", numIn("ch.heat", d.esc.heat, function (v) { d.esc.heat = v; }, { min: 0, max: 10 }), "0 1 100px")
    ])];
    if (!srcOpts.length) esc.push(help("No Heat on the crew's records yet. Type the source and the Heat.", { color: "var(--text3)" }));
    var fr = firstResponse(d.esc.heat), FR = B.firstResponse;
    esc.push(el("p.help", { dataset: { sc: "first-response", rounds: fr === null ? "" : String(fr) },
      style: { margin: "6px 0 0", color: "var(--accent)" },
      text: fr === null ? "Type the crew's Heat with the source to time the first response."
        : "First response in " + fr + " " + plural(fr, "round") + ": " + FR.base + " minus half of Heat " + clamp(int(d.esc.heat), 0, 10) +
          ", rounded " + FR.rounding + ", minimum " + FR.min + "." }));
    var srow = sourceRow(d.esc.source);
    if (srow) esc.push(el("p.help", { dataset: { sc: "heat-sends", source: srow.key }, style: { margin: "4px 0 0", color: "var(--text2)" },
      text: "Who " + srow.name + " sends: " + said(srow.sends) }));
    esc.push(row([field("Which row of Pursuit Escalation shows up", textIn("ch.row", d.esc.row, "a Homeward Patrol Drone joins as a new pursuer", function (v) { d.esc.row = v; }))]));
    if (B.notCarried && B.notCarried.escalation) esc.push(help(B.notCarried.escalation, { color: "var(--text3)" }));
    kids.push(stepBlock(s5, esc));

    // 6. the two endings
    var s6 = step(6);
    kids.push(stepBlock(s6, [row([
      field("Escape, at Lead " + B.lead.escape, textIn("ch.escape", d.endings.escape, "", function (v) { d.endings.escape = v; }, { area: true })),
      field("Capture, at Lead " + B.lead.capture, textIn("ch.capture", d.endings.capture, (s6.captureKinds || []).join(", "), function (v) { d.endings.capture = v; }, { area: true }))
    ])]));

    // 7. the method
    var s7 = step(7);
    kids.push(stepBlock(s7, [el("div.row.wrap", { style: { gap: "6px", marginTop: "6px", alignItems: "center" } }, (s7.options || []).map(function (o) {
      return toggle(o.name + ", " + o.when, d.method === o.key, "method-" + o.key, function () { d.method = o.key; });
    }).concat([ruleChip("rz-collab/method-choice", "Method Choice")]))]));

    // 8. stalemates
    kids.push(stepBlock(step(8), []));
    kids.push(row([field("Notes", textIn("ch.notes", d.notes, "", function (v) { d.notes = v; }, { area: true }))], { marginTop: "14px" }));
    return EN.ui.panel("Setting Up a Chase", "THE PREP CARD", kids);
  }

  function vehiclesBlock(d) {
    var B = CH(), out = [], HV = ref(B.refs.hostileVehicles) || [], mine = crewVehicles();
    var adders = [];
    if (HV.length) {
      adders.push(field("A Hostile Vehicle", selectIn("ch.addHostile", [{ value: "", label: "Pick one..." }].concat(HV.map(function (p, i) {
        return { value: String(i), label: p.name + DOT + p.speed };
      })), _v.addHostile, function (v) { _v.addHostile = v; }), "0 1 230px"));
      adders.push(btn("+ ADD", "ch-add-hostile", function () {
        var p = HV[int(_v.addHostile)];
        if (!p) { toast("Pick a Hostile Vehicle first."); return false; }
        d.vehicles.push(lineFrom(p, "hostile", "chasing", ""));
        _v.addHostile = "";
      }));
    }
    if (mine.length) {
      adders.push(field("A crew vehicle", selectIn("ch.addCrew", [{ value: "", label: "Pick one..." }].concat(mine.map(function (m, i) {
        return { value: String(i), label: m.name + DOT + m.owner };
      })), _v.addCrew, function (v) { _v.addCrew = v; }), "0 1 230px"));
      adders.push(btn("+ ADD", "ch-add-crew", function () {
        var m = mine[int(_v.addCrew)];
        if (!m) { toast("Pick a crew vehicle first."); return false; }
        var ln = lineFrom(m.prof, "crew", "running", m.owner);
        ln.name = m.name;
        d.vehicles.push(ln);
        _v.addCrew = "";
      }));
    }
    adders.push(btn("+ TYPE ONE IN", "ch-add-custom", function () { d.vehicles.push(blankLine("chasing")); }));
    out.push(row(adders, { alignItems: "flex-end" }));
    if (!mine.length) out.push(help("No vehicles on the crew's records. Type the crew's ride in.", { color: "var(--text3)" }));
    var pilots = ref(B.refs.threatPilots);
    var tp = Array.isArray(pilots) ? pilots.filter(function (r) { return /pilot/i.test(r.name); })[0] : null;
    if (tp) out.push(help(tp.name + ". " + tp.text, { color: "var(--text3)" }));
    d.vehicles.forEach(function (v) { out.push(vehicleCard(d, v)); });
    return out;
  }

  function vehicleCard(d, v) {
    var B = CH(), k = "veh." + v.lid + ".";
    var sp = speedOf(v.speed), md = movingDefense(v), pil = pilotingOf(v), itg = integrityNow(v), max = int(v.integrity);
    var spOpts = [{ value: "", label: "Speed..." }].concat(speeds().map(function (x) { return { value: x.key, label: x.speed }; }));
    var grades = [{ value: "", label: "No threat pilot" }];
    for (var g = 1; g <= 5; g++) grades.push({ value: g, label: "Grade " + g + " pilot" });
    var kids = [];
    kids.push(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
      el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
        el("span", { style: { fontWeight: 600 }, text: str(v.name).trim() || "A vehicle" }),
        chipTag(v.side === "running" ? "RUNNING" : "CHASING", v.side === "running" ? "var(--accent)" : "var(--danger)"),
        v.owner ? chipTag(v.owner.toUpperCase(), "var(--text3)") : null,
        v.from === "hostile" ? chipTag("HOSTILE VEHICLE", "var(--text3)") : null
      ]),
      el("div.row", { style: { gap: "6px" } }, [
        btn(v.side === "running" ? "MAKE IT A PURSUER" : "MAKE IT THE RUNNER", "veh-side-" + v.lid, function () {
          v.side = v.side === "running" ? "chasing" : "running";
        }, { ghost: true }),
        btn("✕", "veh-del-" + v.lid, function () { d.vehicles = d.vehicles.filter(function (x) { return x.lid !== v.lid; }); delete _v.dmg[v.lid]; },
          { title: "Remove this vehicle" })
      ])
    ]));
    kids.push(row([
      field("Name", textIn(k + "name", v.name, "Homeward Interceptor", function (x) { v.name = x; }), "1 1 180px"),
      field("Speed", selectIn(k + "speed", spOpts, v.speed, function (x) { v.speed = x; }), "0 1 120px"),
      field("Handling", numIn(k + "handling", v.handling, function (x) { v.handling = x; }, { width: "70px" }), "0 0 auto"),
      field("Structure", numIn(k + "structure", v.structure, function (x) { v.structure = x; }, { width: "70px", min: 0 }), "0 0 auto"),
      field("Integrity", numIn(k + "integrity", v.integrity, function (x) { v.integrity = x; }, { width: "76px", min: 0 }), "0 0 auto")
    ]));
    kids.push(row([field("Mounted weapons", textIn(k + "weapons", v.weapons, "none, or what is mounted and where", function (x) { v.weapons = x; }))]));
    if (v.notes) kids.push(help(v.notes, { color: "var(--text2)" }));

    // who is at the wheel
    if (v.side === "chasing" || v.from !== "crew") {
      kids.push(row([
        field("At the wheel", selectIn(k + "grade", grades, v.grade, function (x) { v.grade = x; }), "0 1 170px"),
        field("Pilot's Attack", numIn(k + "attack", v.attack, function (x) { v.attack = x; }, { width: "70px", ph: "+9" }), "0 0 auto"),
        field("Aboard", textIn(k + "aboard", v.aboard, "who rides along", function (x) { v.aboard = x; }), "1 1 180px")
      ]));
    }
    var reads = [];
    if (md !== null) reads.push("moving Defense " + md);
    if (pil !== null) reads.push("piloting checks at " + fmtMod(pil));
    if (sp) reads.push(sp.speed + " Impact DC " + sp.dc);
    if (reads.length) kids.push(el("p.help", { dataset: { sc: "veh-reads-" + v.lid, md: md === null ? "" : String(md), pil: pil === null ? "" : String(pil),
      impact: sp ? String(sp.dc) : "" }, style: { margin: "6px 0 0", color: "var(--accent)" }, text: upperFirst(reads.join(DOT)) + "." }));
    if (v.from === "crew" && v.side === "running") kids.push(help("The driver rolls their own Chase Check off the Inventory's Garage.", { color: "var(--text3)" }));

    // Integrity, as it takes damage
    if (max !== null) {
      var amt = own(_v.dmg, v.lid) ? _v.dmg[v.lid] : "";
      kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [
        el("span.mono", { dataset: { sc: "veh-int-" + v.lid, now: String(itg) }, style: { fontSize: "13px", color: itg === 0 ? "var(--danger)" : "var(--text)" },
          text: "INTEGRITY " + itg + " / " + max }),
        el("div", { style: { flex: "1 1 120px", minWidth: "80px" } }, [bar(itg, max, itg <= max / 2 ? "var(--danger)" : "var(--success)")]),
        textIn("veh." + v.lid + ".dmg", amt, "amount", function (x) { _v.dmg[v.lid] = x; }, { type: "number", style: { width: "84px" }, min: 0 }),
        btn("DAMAGE", "veh-hit-" + v.lid, function () {
          var n = int(_v.dmg[v.lid]);
          if (!n || n < 0) { toast("Type the damage first."); return false; }
          v.hit = Math.min(max, (v.hit | 0) + n);
          chaseLog(d, (str(v.name).trim() || "A vehicle") + " takes " + n + " damage, Integrity " + integrityNow(v) + ".");
        }),
        btn("REPAIR", "veh-fix-" + v.lid, function () {
          var n = int(_v.dmg[v.lid]);
          if (!n || n < 0) { toast("Type the amount first."); return false; }
          v.hit = Math.max(0, (v.hit | 0) - n);
        }, { ghost: true }),
        itg === 0 ? chipTag("0 INTEGRITY", "var(--danger)") : null
      ]));
    }
    var be = bestEntry(v.bestiary);
    if (be) kids.push(row([btn("VIEW " + be.name.toUpperCase(), "view-pilot-" + v.lid, function () {
      EN.gmView.handoff("bestiary", { query: be.name }); return false;
    }, { ghost: true })], { marginTop: "6px" }));
    return el("div.feature", { dataset: { sc: "veh-" + v.lid }, style: { marginTop: "10px",
      borderLeftColor: v.side === "running" ? "var(--accent)" : "var(--danger)" } }, kids);
  }

  function chaseTable(d) {
    var B = CH(), kids = [], L = B.lead, now = d.lead.now, band = bandOf(now);

    // the round and the first response
    var fr = firstResponse(d.esc.heat), passed = Math.max(0, d.track.round - 1);
    var head = [el("span.mono", { dataset: { sc: "ch-round" }, style: { fontSize: "14px", letterSpacing: ".08em" },
      text: d.track.round ? "ROUND " + d.track.round : "NOT STARTED" })];
    if (!d.track.round) {
      head.push(btn("▶ START THE CHASE", "ch-start", function () {
        d.track.round = 1; d.lead.now = d.lead.start;
        chaseLog(d, "The chase starts at Lead " + d.lead.start + ".");
      }, { primary: true }));
    } else {
      head.push(btn("NEXT ROUND ›", "ch-next", function () {
        d.track.round += 1;
        var f = firstResponse(d.esc.heat);
        if (f !== null && d.track.round - 1 === f) chaseLog(d, "The first response arrives" + (d.esc.source ? " from " + d.esc.source : "") + ".");
      }, { primary: true }));
    }
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, head));
    if (fr !== null) {
      var due = d.track.round && passed >= fr;
      kids.push(el("p.help", { dataset: { sc: "fr-clock", due: due ? "1" : "0", left: String(Math.max(0, fr - passed)) },
        style: { margin: "6px 0 0", color: due ? "var(--danger)" : "var(--text2)", fontWeight: due ? 600 : 400 },
        text: !d.track.round ? "The first response is " + fr + " " + plural(fr, "round") + " out once the chase starts."
          : due ? "The first response is here" + (d.esc.source ? " (" + d.esc.source + ")" : "") + (d.esc.row ? ": " + d.esc.row : ".")
          : "First response in " + (fr - passed) + " more " + plural(fr - passed, "round") + "." }));
    }

    // Lead, 0 to 5, with its bands and gaps
    var cells = [];
    for (var i = L.min; i <= L.max; i++) {
      var b = bandOf(i), gsp = gapAt(i), on = i === now;
      cells.push(el("div", { dataset: { sc: "lead-" + i }, style: { flex: "1 1 48px", minWidth: "48px", textAlign: "center", padding: "6px 2px",
        border: "1px solid " + (on ? "var(--accent)" : "var(--border2)"), background: on ? "rgba(255,255,255,.05)" : "transparent" } }, [
        el("div.mono", { style: { fontSize: "18px", color: on ? "var(--accent)" : "var(--text2)" }, text: String(i) }),
        el("div", { style: { fontSize: "10px", letterSpacing: ".08em", color: on ? "var(--text)" : "var(--text3)" }, text: b ? b.name.toUpperCase() : "" }),
        el("div", { style: { fontSize: "10px", color: "var(--text3)" }, text: gsp ? gsp + " spaces" : "\u00a0" })
      ]));
    }
    kids.push(el("div", { style: { marginTop: "12px" } }, [
      el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "6px" } }, [
        el("span", { dataset: { sc: "lead", lead: String(now), band: band ? band.key : "" }, style: { fontWeight: 600 },
          text: "Lead " + now + (band ? ", " + band.name : "") + (gapAt(now) ? ", " + gapAt(now) + " spaces apart" : "") }),
        el("div.row", { style: { gap: "6px" } }, [
          btn(MINUS + " LEAD", "lead-minus", function () {
            if (d.lead.now <= L.min) return false;
            d.lead.now -= 1; chaseLog(d, "Lead " + d.lead.now + ".");
          }, { title: "The pursuit closes" }),
          btn("+ LEAD", "lead-plus", function () {
            if (d.lead.now >= L.max) return false;
            d.lead.now += 1; chaseLog(d, "Lead " + d.lead.now + ".");
          }, { title: "The runner pulls away" })
        ])
      ]),
      el("div.row.wrap", { style: { gap: "4px" } }, cells)
    ]));
    if (now === L.capture) {
      kids.push(el("div.feature", { dataset: { sc: "ch-capture" }, style: { borderLeftColor: "var(--danger)", marginTop: "8px" } }, [
        el("span", { style: { fontWeight: 600, color: "var(--danger)" }, text: "Lead " + L.capture + ": capture." }),
        help(str(d.endings.capture).trim() || "Nothing written for capture yet.")
      ]));
    } else if (now === L.escape) {
      kids.push(el("div.feature", { dataset: { sc: "ch-escape" }, style: { borderLeftColor: "var(--success)", marginTop: "8px" } }, [
        el("span", { style: { fontWeight: 600, color: "var(--success)" }, text: "Lead " + L.escape + ": escape." }),
        help(str(d.endings.escape).trim() || "Nothing written for escape yet.")
      ]));
    }

    // the Chase Check
    kids.push(EN.ui.sectionTitle("Chase Check"));
    kids.push(checkBlock(d));

    // stalemates
    kids.push(EN.ui.sectionTitle("Stalemate"));
    kids.push(stalemateBlock(d));

    // the log
    if (d.track.log.length) {
      kids.push(el("div", { dataset: { sc: "ch-log" }, style: { marginTop: "12px" } }, [
        el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
          label("CHASE LOG"),
          btn("UNDO THE LAST LINE", "ch-undo", function () { d.track.log.pop(); }, { ghost: true, title: "Takes the line off the log; Lead and Integrity stay as they are" })
        ])
      ].concat(d.track.log.map(function (x) {
        return help((x.round ? "Round " + x.round + DOT : "") + x.text, { margin: "2px 0 0" });
      }))));
    }
    return EN.ui.panel("The Chase", d.track.round ? "ROUND " + d.track.round + DOT + "LEAD " + now : "LEAD " + now, kids, { glow: d.track.round > 0 });
  }

  /* A CHASE CHECK, as the GM's Card prints it for chases: a tie is a
     Stalemate, and Dominant Victory comes at +5 on a d20 or +3 in Dice Pools
     (not the general contested table's +10). Each side's total is typed; a
     side with a threat pilot can roll it here (d20 + Attack + Handling). */
  function checkBlock(d) {
    var C = CH().check, pool = d.method === "pool", thr = pool ? C.dominant.pool : C.dominant.d20, out = [];
    out.push(help(C.dominant.text + " A tie is a Stalemate.", { margin: "0 0 6px", color: "var(--text2)" }));
    function sideBox(side, keyTotal, keyRoll) {
      var lines = d.vehicles.filter(function (v) { return v.side === side && pilotingOf(v) !== null; });
      var kids = [field((side === "running" ? "Running" : "Chasing") + (pool ? ", successes" : ", total"),
        numIn("chk." + side, _v.chk[keyTotal], function (x) { _v.chk[keyTotal] = x; }, { width: "90px" }), "0 0 auto")];
      if (!pool && lines.length) {
        var pickV = _v.chk[keyRoll] && lines.filter(function (v) { return v.lid === _v.chk[keyRoll]; })[0] ? _v.chk[keyRoll] : lines[0].lid;
        if (lines.length > 1) kids.push(field("Rolls for", selectIn("chk." + side + ".who", lines.map(function (v) {
          return { value: v.lid, label: (str(v.name).trim() || "A vehicle") + " (" + fmtMod(pilotingOf(v)) + ")" };
        }), pickV, function (x) { _v.chk[keyRoll] = x; }), "0 1 200px"));
        kids.push(btn("ROLL " + fmtMod(pilotingOf(lines.filter(function (v) { return v.lid === pickV; })[0])), "chk-roll-" + side, function () {
          var v = lines.filter(function (x) { return x.lid === pickV; })[0], r = die(20), tot = r + pilotingOf(v);
          _v.chk[keyTotal] = String(tot);
          toast((str(v.name).trim() || "The pilot") + " rolls " + r + " " + fmtMod(pilotingOf(v)) + " = " + tot + ".");
        }, { title: "d20 + the pilot's Attack + Handling" }));
      }
      return el("div.row.wrap", { style: { gap: "8px", alignItems: "flex-end", flex: "1 1 260px" } }, kids);
    }
    out.push(el("div.row.wrap", { style: { gap: "14px", alignItems: "flex-end" } }, [
      sideBox("running", "a", "rollA"), sideBox("chasing", "b", "rollB")
    ]));
    out.push(row([btn("CALL IT", "chk-call", function () {
      var a = int(_v.chk.a), b = int(_v.chk.b);
      if (a === null || b === null) { toast("Type both sides' " + (pool ? "successes" : "totals") + " first."); return false; }
      var res;
      if (a === b) res = { tie: true, text: "A tie at " + a + ": Stalemate. Roll the district table." };
      else {
        var m = Math.abs(a - b), win = a > b ? "running" : "chasing", dom = m >= thr;
        res = { tie: false, winner: win, margin: m, dominant: dom,
          text: sideName(d, win) + " wins by " + m + (dom ? ": Dominant Victory." : ".") };
      }
      res.a = a; res.b = b; res.method = d.method;
      _v.chk.last = res;
      chaseLog(d, "Chase Check, " + (pool ? "Dice Pools" : "d20") + ", " + a + " against " + b + ". " + res.text);
      _v.chk.a = ""; _v.chk.b = "";
    }, { primary: true })]));
    var last = _v.chk.last;
    if (last) {
      out.push(el("div.feature", { dataset: { sc: "chk-out", result: last.tie ? "stalemate" : last.dominant ? "dominant" : "win", margin: last.tie ? "0" : String(last.margin) },
        style: { marginTop: "8px", borderLeftColor: last.tie ? "var(--warn)" : last.dominant ? "var(--gold)" : "var(--accent)" } }, [
        el("span", { style: { fontWeight: 600 }, text: last.text }),
        last.tie || !(CH().notCarried && CH().notCarried.leadMargins) ? null : help(CH().notCarried.leadMargins, { color: "var(--text3)" })
      ]));
    }
    return el("div", null, out);
  }

  /* The district's stalemate table and its default rule, read from the
     Hazards data (EN.gmBook.hazards.stalemate), with each vehicle's Impact DC
     for its speed and a picker for the speed the pilots are at, which the GM
     can type over. */
  function stalemateBlock(d) {
    var St = ref(CH().refs.stalemate), out = [];
    if (!St || !St.districts) return help("The stalemate tables did not load.");
    var dist = byKey(St.districts, d.route.district);
    out.push(help(CH().stalemate.text, { margin: "0 0 6px", color: "var(--text2)" }));
    var dists = St.districts.map(function (x) { return { value: x.key, label: x.name }; });
    out.push(row([
      field("District", selectIn("ch.staleDistrict", [{ value: "", label: "Pick a district..." }].concat(dists), d.route.district,
        function (v) { d.route.district = v; }), "0 1 170px"),
      btn("ROLL " + String(St.die || "d6").toUpperCase(), "stale-roll", function () {
        if (!dist) { toast("Pick the district first."); return false; }
        var n = die(St.sides || 6);
        d.track.stale = { district: dist.key, n: n };
        var r = dist.rows.filter(function (x) { return x.n === n; })[0];
        chaseLog(d, "Stalemate in " + dist.name + ", " + n + ": " + (r ? r.text : ""));
      }, { primary: true })
    ], { marginTop: 0 }));
    var stale = d.track.stale && dist && d.track.stale.district === dist.key ? d.track.stale.n : null;
    var hit = stale ? dist.rows.filter(function (x) { return x.n === stale; })[0] : null;
    if (hit) {
      out.push(el("div.feature", { dataset: { sc: "stale-out", n: String(hit.n) }, style: { marginTop: "8px" } }, [
        el("div.row", { style: { gap: "10px", alignItems: "baseline" } }, [
          el("span.mono", { style: { fontSize: "20px", color: "var(--accent)" }, text: String(hit.n) }),
          el("span", { style: { fontSize: "13.5px" }, text: hit.text })
        ]),
        hit.rider ? help("This entry adds to or changes the default: " + hit.rider, { color: "var(--warn)" }) : null
      ]));
    }
    out.push(help(St.rule));
    var sp = speeds();
    var withSpeed = d.vehicles.filter(function (v) { return speedOf(v.speed); });
    if (withSpeed.length) {
      out.push(el("div", { dataset: { sc: "impact-list" }, style: { marginTop: "4px" } }, withSpeed.map(function (v) {
        var s = speedOf(v.speed);
        return help((str(v.name).trim() || "A vehicle") + " at " + s.speed + ": Impact DC " + s.dc + ".", { margin: "2px 0 0", color: "var(--text2)" });
      })));
    }
    var pick = speedOf(d.track.speed), typedDc = int(d.track.impact);
    var dc = typedDc !== null ? typedDc : (pick ? pick.dc : null);
    out.push(row([
      field("Speed", selectIn("ch.speed", [{ value: "", label: "Pick a speed..." }].concat(sp.map(function (x) {
        return { value: x.key, label: x.speed + " (DC " + x.dc + ")" };
      })), d.track.speed, function (v) { d.track.speed = v; var s = speedOf(v); d.track.impact = s ? String(s.dc) : ""; }), "0 1 170px"),
      field("Impact DC", numIn("ch.impact", d.track.impact, function (v) { d.track.impact = v; }, { ph: pick ? String(pick.dc) : "DC" }), "0 0 auto")
    ]));
    var dr = St.defaultRule || {};
    out.push(el("p.help", { dataset: { sc: "impact-line", dc: dc === null ? "" : String(dc) }, style: { margin: "4px 0 0", color: "var(--accent)" },
      text: dc === null ? "Pick the pilots' speed or type the Impact DC."
        : upperFirst(dr.who || "each pilot") + " makes a " + (dr.check || "Control Check") + " against DC " + dc + "; a failure gives " +
          (dr.onFail || "Snag on the next Chase Check") + "." + (pick && typedDc !== null && typedDc !== pick.dc ? " Typed over the " + pick.speed + " Impact DC of " + pick.dc + "." : "") }));
    return el("div", null, out);
  }

  // the chase's reference is the Codex's Chase Rules; the home line says Lead itself is the PHB's
  function chaseRef(d) {
    var B = CH(), kids = [help(B.home, { margin: 0 })];
    kids.push(codexLinks("In the Codex:", [
      ["gms-chase", "Chase Rules"], ["gms-chase/lead-and-its-bands", "Lead and its bands"], ["gms-chase/the-chase-check", "The Chase Check"],
      ["gms-chase/impact-dc-by-speed", "Impact DC by speed"], ["gms-chase/threat-pilots", "Threat pilots"]]));
    return EN.ui.panel("Reference", "CHASE RULES", kids);
  }

  /* =====================================================================
     INCURSION
     ===================================================================== */
  function IN() { return S().incursion; }
  function calRow(r) { return (IN().calibers.rows || []).filter(function (x) { return x.caliber === r; })[0] || null; }
  function stageOf(n) { return n ? (IN().dive.stages || []).filter(function (s) { return s.n === n; })[0] || null : null; }
  function classRow(k) { return byKey(IN().classification.rows, k); }
  function breachDC(rating) {
    var I = IN(), t = ref(I.refs.hazardDC) || ref(I.refs.hazardDCAlt);
    return (t && own(t, String(rating)) && typeof t[rating] === "number") ? t[rating] : null;
  }
  function incCrew(d) { return crewInfo(d.cal); }
  function payroll() { return (EN.gmBook && EN.gmBook.payroll) || null; }
  /* What a rating pays at the crew's Caliber: Paying for It names the column
     (at the crew's Caliber, one step above), and the column's band at that
     Caliber is the Payroll quote's, so the two tabs never disagree. */
  function payQuote(rating, cal) {
    var I = ref(IN().refs.pay), P = payroll();
    if (!I || !P || !P.contract) return null;
    var map = (I.ratingToColumn || []).filter(function (x) { return x.offset === rating - cal; })[0] || null;
    var col = map ? byKey(P.contract.columns, map.col) : null;
    var band = "";
    if (map && EN.gmPayroll && typeof EN.gmPayroll.quote === "function") {
      try { var q = EN.gmPayroll.quote(cal, map.col, {}); band = q ? q.band : ""; } catch (e) { band = ""; }
    }
    if (map && !band) {
      var r = (P.contract.rows || []).filter(function (x) { return x.caliber === cal; })[0];
      var cell = r ? (r.cells || []).filter(function (c) { return c && c.col === map.col; })[0] : null;
      band = cell ? cell.text : "";
    }
    return { I: I, map: map, col: col, band: band };
  }
  function postingLine(d) {
    var c = calRow(d.rating), cls = [];
    var base = classRow(d.base);
    if (base) cls.push(base.name);
    ["instanced", "contested"].forEach(function (k) { if (d.addOns[k]) cls.push(classRow(k).name); });
    if (d.addOns.chromatic && d.chromatic.known) cls.push(classRow("chromatic").name);
    var line = "Rating " + d.rating + (c ? " (" + c.color + ")" : "") + DOT + cls.join(", ") + (d.provisional ? ", provisional" : "");
    var pr = byKey(IN().profiles.rows, d.profile);
    if (pr) line += DOT + pr.name;
    return line;
  }
  function postingText(d) {
    var out = [];
    if (str(d.name).trim()) out.push(d.name.trim());
    out.push(postingLine(d));
    if (str(d.body).trim()) out.push(d.body.trim());
    if (str(d.entries).trim()) out.push("Previous entries: " + d.entries.trim() + ".");
    if (str(d.estimate).trim()) out.push("Where the estimate came from: " + d.estimate.trim());
    return out.join("\n");
  }

  function incursionPage(d) {
    return [incBriefing(d), gap(), incAnchor(d), gap(), incRules(d), gap(), incDive(d), gap(), incPay(d), gap(), incRef(d)];
  }

  function incBriefing(d) {
    var I = IN(), kids = [help(I.briefing, { margin: 0, color: "var(--text2)" })];
    var c = calRow(d.rating), col = CAL_COLOR[d.rating] || "var(--text2)";
    var ratings = [];
    for (var r = I.rating.min; r <= I.rating.max; r++) { var cr = calRow(r); ratings.push({ value: r, label: "Rating " + r + (cr ? " (" + cr.color + ")" : "") }); }

    // the rating against the crew
    var crew = incCrew(d);
    kids.push(row([
      field("Rating", selectIn("in.rating", ratings, d.rating, function (v) { d.rating = clamp(int(v) || 1, I.rating.min, I.rating.max); }), "0 1 170px"),
      el("span.chip", { dataset: { sc: "rating-chip", rating: String(d.rating) }, style: { fontSize: "12px", padding: "5px 12px",
        color: col, borderColor: col, fontWeight: 600 }, text: c ? c.shorthand.toUpperCase() : "C" + d.rating }),
      field("Crew Caliber", numIn("in.cal", d.cal, function (v) { d.cal = v; }, { min: 1, max: 5,
        ph: crew && crew.source !== "none" ? String(crew.caliber) : "1", title: "Leave blank to follow the crew" }), "0 0 auto")
    ], { alignItems: "center" }));
    if (c) kids.push(help(c.expect, { color: "var(--text2)" }));
    kids.push(help(I.rating.text, { color: "var(--text3)" }));
    kids.push(help("Threats and hazards inside are Grade " + d.rating + ".", { color: "var(--accent)" }));

    var members = (crew && crew.members) || [];
    var legal = [help(I.rating.legal, { margin: "8px 0 2px", fontWeight: 600 })];
    if (!members.length) legal.push(help("No crew yet: put the crew on the Table, or file their records.", { color: "var(--text3)" }));
    members.forEach(function (m) {
      var okk = typeof m.caliber === "number" && m.caliber >= d.rating;
      legal.push(el("p.help", { dataset: { sc: "legal-" + m.charId, ok: okk ? "1" : "0" },
        style: { margin: "2px 0 0", color: okk ? "var(--success)" : "var(--warn)" },
        text: m.name + ", Caliber " + (m.caliber === null ? "unknown" : m.caliber) + ": " +
          (okk ? "at or below their Caliber." : "rated above their Caliber.") }));
    });
    if (members.some(function (m) { return !(typeof m.caliber === "number" && m.caliber >= d.rating); })) {
      var pg = ref("gmBook.payroll.claims.privateGround");
      var fraud = pg && pg.paragraphs ? (pg.paragraphs.join(" ").match(/Entering an Incursion rated above[^.]*\./) || [])[0] : null;
      if (fraud) legal.push(help(fraud, { color: "var(--text3)" }));
    }
    kids.push(el("div", { dataset: { sc: "legal" } }, legal));

    // classification
    var Cl = I.classification;
    kids.push(EN.ui.sectionTitle("Classification"));
    kids.push(help(Cl.intro, { margin: "0 0 6px" }));
    kids.push(el("div.row.wrap", { style: { gap: "6px" } }, Cl.base.map(function (k) {
      var rr = classRow(k);
      return toggle(rr.name.toUpperCase(), d.base === k, "base-" + k, function () { d.base = k; });
    }).concat(Cl.addOns.map(function (k) {
      var rr = classRow(k);
      return toggle(rr.name.toUpperCase(), !!d.addOns[k], "addon-" + k, function () { d.addOns[k] = !d.addOns[k]; });
    })).concat([toggle("PROVISIONAL", d.provisional, "provisional", function () { d.provisional = !d.provisional; }, { title: Cl.provisional })])));
    kids.push(help(classRow(d.base).text, { color: "var(--text2)" }));
    Cl.addOns.forEach(function (k) { if (d.addOns[k]) kids.push(help(classRow(k).name + ": " + classRow(k).text, { color: "var(--text2)" })); });
    if (d.provisional) kids.push(help(Cl.provisional, { color: "var(--text3)" }));
    if (d.base === "sealed") kids.push(help(Cl.sealedWorse, { color: "var(--text3)" }));
    if (d.addOns.chromatic) kids.push(chromaticBox(d));

    // the dive profile and the ground
    var profs = [{ value: "", label: "Pick a dive profile..." }].concat(I.profiles.rows.map(function (p) { return { value: p.key, label: p.name }; }));
    kids.push(EN.ui.sectionTitle("Dive profile and ground"));
    kids.push(row([
      field("Dive profile", selectIn("in.profile", profs, d.profile, function (v) { d.profile = v; }), "0 1 200px"),
      el("div.row.wrap", { style: { gap: "6px" } }, (IN().claims.ground || []).map(function (g) {
        return toggle(g.key === "public" ? "PUBLIC GROUND" : "PRIVATE GROUND", d.ground === g.key, "ground-" + g.key, function () { d.ground = g.key; });
      }))
    ], { alignItems: "flex-end" }));
    var pr = byKey(I.profiles.rows, d.profile);
    kids.push(help(pr ? pr.text : I.profiles.intro, { color: "var(--text2)" }));
    var gr = byKey(IN().claims.ground, d.ground), grText = gr ? ref(gr.ref) : null;
    if (grText) {
      var gt = typeof grText === "string" ? grText : (grText.paragraphs ? grText.paragraphs[0] : grText.text);
      if (gt) kids.push(help(gt, { color: "var(--text3)" }));
    }

    // the posting
    kids.push(EN.ui.sectionTitle("The posting"));
    kids.push(help(I.rating.posting.text, { margin: "0 0 4px" }));
    kids.push(row([
      field("What happened there", textIn("in.body", d.body, "A staircase has appeared behind a laundromat's back mirror.", function (v) { d.body = v; }, { area: true, rows: 3 }))
    ]));
    kids.push(row([
      field("Previous entries", textIn("in.entries", d.entries, "Three crews entered; one returned", function (v) { d.entries = v; })),
      field("Where the estimate came from", textIn("in.estimate", d.estimate, "scouting, previous entries, what came back", function (v) { d.estimate = v; }))
    ]));
    kids.push(el("pre.mono", { dataset: { sc: "posting" }, style: { whiteSpace: "pre-wrap", fontSize: "12px", margin: "8px 0 0", padding: "8px",
      border: "1px solid var(--border2)", background: "var(--bg2)" }, text: postingText(d) }));
    kids.push(row([btn("COPY THE POSTING", "copy-posting", function () { copyText(postingText(d), "The posting"); return false; })]));
    kids.push(help(Cl.disclosure, { color: "var(--text3)" }));
    return EN.ui.panel("The Briefing", "RATING · CLASSIFICATION · DIVE PROFILE", kids);
  }

  function chromaticBox(d) {
    var Cl = IN().classification, CR = Cl.chromatic, kids = [];
    var bases = Cl.base.map(function (k) { return { value: k, label: classRow(k).name }; });
    kids.push(el("span", { style: { fontWeight: 600 }, text: "Chromatic: the GM's record" }));
    kids.push(row([
      field(upperFirst(CR.record[0].label), selectIn("in.chFrom", bases, d.chromatic.from, function (v) { d.chromatic.from = v; if (!d.chromatic.met) d.base = v; }), "0 1 170px"),
      field(upperFirst(CR.record[1].label), selectIn("in.chBecomes", bases, d.chromatic.becomes, function (v) { d.chromatic.becomes = v; }), "0 1 170px"),
      field(upperFirst(CR.record[2].label), textIn("in.chTrigger", d.chromatic.trigger, "when the crew reaches the third-floor dryers", function (v) { d.chromatic.trigger = v; }))
    ]));
    kids.push(row([
      toggle("KNOWN, SO THE POSTING SAYS SO", d.chromatic.known, "chromatic-known", function () { d.chromatic.known = !d.chromatic.known; }),
      d.chromatic.met
        ? btn("TAKE THE CHANGE BACK", "chromatic-unmet", function () { d.chromatic.met = false; d.base = d.chromatic.from; }, { ghost: true })
        : btn("THE TRIGGER IS MET", "chromatic-met", function () {
            d.chromatic.met = true; d.base = d.chromatic.becomes;
            toast("The Incursion is " + classRow(d.base).name + " now.");
          }, { primary: true })
    ], { alignItems: "center" }));
    if (d.chromatic.met) kids.push(help("Changed: it began " + classRow(d.chromatic.from).name + " and is " + classRow(d.base).name + " now. " + Cl.ratingStays, { color: "var(--warn)" }));
    kids.push(help(CR.signs.join(" "), { color: "var(--text3)" }));
    return el("div.feature", { dataset: { sc: "chromatic" }, style: { marginTop: "8px", borderLeftColor: "var(--flow)" } }, kids);
  }

  function incAnchor(d) {
    var A = IN().anchor, kids = [];
    kids.push(el("div.row.wrap", { style: { gap: "6px" } }, A.kinds.map(function (k) {
      return toggle(k.key === "thing" ? "A THING" : k.key === "resident" ? "A RESIDENT" : "A CONDITION", d.anchor.kind === k.key, "anchor-" + k.key,
        function () { d.anchor.kind = d.anchor.kind === k.key ? "" : k.key; }, { title: k.name });
    })));
    var kind = byKey(A.kinds, d.anchor.kind);
    if (kind) kids.push(help(upperFirst(kind.name) + (kind.examples ? " (" + kind.examples + ")" : "") + ".", { color: "var(--text2)" }));
    kids.push(row([field("What it is", textIn("in.anchor", d.anchor.text, "a fused jukebox", function (v) { d.anchor.text = v; }))]));
    if (d.anchor.kind === "thing") {
      var Fo = A.focal, max = Fo.vitalityPerRating * d.rating, now = Math.max(0, max - (d.anchor.hit | 0));
      kids.push(el("div.feature", { dataset: { sc: "focal", vit: String(now), max: String(max), def: String(Fo.defense) }, style: { marginTop: "8px", borderLeftColor: "var(--accent)" } }, [
        el("span", { style: { fontWeight: 600 }, text: "Focal Anchor, Severity " + d.rating + ": Defense " + Fo.defense + ", Vitality " + max }),
        help(Fo.when + ": " + Fo.text + ".", { color: "var(--text3)" }),
        el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "6px" } }, [
          el("span.mono", { style: { fontSize: "13px", color: now === 0 ? "var(--success)" : "var(--text)" }, text: "VITALITY " + now + " / " + max }),
          el("div", { style: { flex: "1 1 120px", minWidth: "80px" } }, [bar(now, max, "var(--danger)")]),
          textIn("in.anchorDmg", _v.anchorDmg, "damage", function (v) { _v.anchorDmg = v; }, { type: "number", min: 0, style: { width: "90px" } }),
          btn("DAMAGE", "anchor-hit", function () {
            var n = int(_v.anchorDmg);
            if (!n || n < 0) { toast("Type the damage first."); return false; }
            d.anchor.hit = Math.min(max, (d.anchor.hit | 0) + n);
            _v.anchorDmg = "";
          }),
          btn("HEAL", "anchor-heal", function () {
            var n = int(_v.anchorDmg);
            if (!n || n < 0) { toast("Type the amount first."); return false; }
            d.anchor.hit = Math.max(0, (d.anchor.hit | 0) - n);
            _v.anchorDmg = "";
          }, { ghost: true })
        ]),
        now === 0 ? help("The anchor is destroyed. Mark the collapse below.", { color: "var(--success)" }) : null
      ]));
    }
    kids.push(help(A.cascade, { color: "var(--text3)" }));
    return EN.ui.panel("The Anchor", "WHAT HOLDS THE OVERWRITE", kids);
  }

  function lrText(r) {
    var LR = IN().localRules;
    if (r.n) {
      var row0 = LR.rows.filter(function (x) { return x.n === r.n; })[0];
      if (row0) return LR.stem + " " + row0.text.replace(/^\.\.\./, "");
    }
    return r.text;
  }
  function incRules(d) {
    var LR = IN().localRules, kids = [help(LR.text, { margin: 0 })];
    kids.push(row([
      btn("ROLL " + String(LR.die || "d12").toUpperCase(), "lr-roll", function () {
        var n = die(LR.sides || 12);
        d.rules.push({ lid: lid("lr"), n: n, text: "" });
        toast("Local rule " + n + ".");
      }, { primary: true }),
      field("Or pick one", selectIn("in.lrPick", [{ value: "", label: "Pick a rule..." }].concat(LR.rows.map(function (x) {
        return { value: x.n, label: x.n + ". " + LR.stem + " " + x.text.replace(/^\.\.\./, "").slice(0, 46) + "..." };
      })), _v.lrPick, function (v) { _v.lrPick = v; }, { style: { width: "100%" } }), "1 1 240px"),
      btn("+ ADD", "lr-add", function () {
        var n = int(_v.lrPick);
        if (!n) { toast("Pick a rule first."); return false; }
        d.rules.push({ lid: lid("lr"), n: n, text: "" });
        _v.lrPick = "";
      })
    ]));
    kids.push(row([
      field("Or write one", textIn("in.lrText", _v.lrText, "The inside...", function (v) { _v.lrText = v; })),
      btn("+ ADD", "lr-add-text", function () {
        var t = str(_v.lrText).trim();
        if (!t) { toast("Write the rule first."); return false; }
        d.rules.push({ lid: lid("lr"), n: null, text: t });
        _v.lrText = "";
      })
    ]));
    d.rules.forEach(function (r) {
      kids.push(el("div.row.between", { dataset: { sc: "lr-" + r.lid }, style: { gap: "8px", alignItems: "baseline", padding: "5px 0", borderBottom: "1px solid var(--border)" } }, [
        el("div", { style: { display: "flex", gap: "8px", alignItems: "baseline", minWidth: 0 } }, [
          el("span.mono", { style: { color: "var(--accent)", minWidth: "22px" }, text: r.n ? two(r.n) : "•" }),
          el("span", { style: { fontSize: "13px" }, text: lrText(r) })
        ]),
        btn("✕", "lr-del-" + r.lid, function () { d.rules = d.rules.filter(function (x) { return x.lid !== r.lid; }); }, { title: "Remove this rule" })
      ]));
    });
    if (d.rules.length > LR.pickHigh) kids.push(help("More than the one or two the book suggests.", { color: "var(--warn)" }));
    return EN.ui.panel(LR.name, d.rules.length + " " + plural(d.rules.length, "RULE"), kids);
  }

  function incDive(d) {
    var I = IN(), D = I.dive, kids = [help(D.text, { margin: 0 })];
    kids.push(row([field("The zones, in a chain to the anchor", textIn("in.zones", d.zones, "lobby, the mile of fourth floor, the dryers", function (v) { d.zones = v; }, { area: true }))]));

    // the stage track
    var st = d.dive.stage, cur = stageOf(st);
    var cells = [{ n: 0, name: "Holding" }].concat(D.stages).map(function (s) {
      var on = s.n === st;
      return el("div", { dataset: { sc: "stage-" + s.n }, style: { flex: "1 1 90px", textAlign: "center", padding: "6px 4px",
        border: "1px solid " + (on ? (s.n === 3 ? "var(--danger)" : "var(--accent)") : "var(--border2)"),
        background: on ? "rgba(255,255,255,.05)" : "transparent" } }, [
        el("div.mono", { style: { fontSize: "11px", letterSpacing: ".08em", color: on ? "var(--text)" : "var(--text3)" }, text: s.name.toUpperCase() })
      ]);
    });
    kids.push(EN.ui.sectionTitle("Pressure on the site"));
    kids.push(help(D.pressure, { margin: "0 0 6px" }));
    kids.push(el("div.row.wrap", { dataset: { sc: "stage", stage: String(st) }, style: { gap: "4px" } }, cells));
    if (cur) {
      // at Breach the card below carries what it means, so the track gives only its signs
      kids.push(help(cur.signs + "." + (st === 3 ? "" : " " + cur.means), { color: st === 3 ? "var(--danger)" : "var(--text2)" }));
    } else {
      kids.push(help("No push has moved the site yet.", { color: "var(--text3)" }));
    }
    var since = 0;
    for (var i = d.dive.pushes.length - 1; i >= 0 && d.dive.pushes[i].stage === st; i--) since++;
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "8px" } }, [label("A PUSH")].concat(D.pushes.map(function (p) {
      return btn("+ " + p.name.toUpperCase(), "push-" + p.key, function () {
        d.dive.pushes.push({ id: lid("pu"), kind: p.key, stage: d.dive.stage });
        toast("Logged: " + p.name + ". It can move the site one stage.");
      });
    }))));
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, [
      btn("MOVE IT ONE STAGE", "stage-up", function () {
        if (d.dive.stage >= 3) return false;
        d.dive.stage += 1;
        var s = stageOf(d.dive.stage);
        toast("The site is at " + (s ? s.name : "stage " + d.dive.stage) + ".");
      }, { primary: true, disabled: st >= 3 }),
      btn("BACK A STAGE", "stage-down", function () { if (d.dive.stage <= 0) return false; d.dive.stage -= 1; }, { ghost: true, disabled: st <= 0 }),
      d.dive.pushes.length ? help(d.dive.pushes.length + " " + plural(d.dive.pushes.length, "push", "pushes") + " logged, " + since + " at this stage.", { margin: 0 }) : null
    ]));
    if (d.dive.pushes.length) {
      kids.push(el("div", { dataset: { sc: "push-log" }, style: { marginTop: "4px" } }, d.dive.pushes.map(function (p, i) {
        var pk = byKey(D.pushes, p.kind), s = stageOf(p.stage);
        return help((i + 1) + ". " + (pk ? upperFirst(pk.name) : p.kind) + " at " + (s ? s.name : "Holding") + ".", { margin: "1px 0 0", color: "var(--text3)" });
      })));
    }

    // Breach, and the collapse
    if (st === 3 && !d.dive.collapse) kids.push(breachCard(d));
    kids.push(EN.ui.sectionTitle("The collapse"));
    if (!d.dive.collapse) {
      kids.push(el("div.row.wrap", { style: { gap: "6px" } }, [
        btn("CONTROLLED COLLAPSE: THE ANCHOR IS DONE", "collapse-controlled", function () { d.dive.collapse = "controlled"; }, { primary: true }),
        btn("UNCONTROLLED COLLAPSE", "collapse-uncontrolled", function () { d.dive.collapse = "uncontrolled"; d.dive.stage = 3; })
      ]));
      if (d.base === "sealed") kids.push(help(classRow("sealed").text, { color: "var(--text3)" }));
    } else if (d.dive.collapse === "controlled") {
      var ms = rowAt(I.milestone);
      kids.push(el("div.feature", { dataset: { sc: "collapsed", how: "controlled" }, style: { borderLeftColor: "var(--success)" } }, [
        el("span", { style: { fontWeight: 600, color: "var(--success)" }, text: "Controlled collapse." }),
        ms ? help("A " + (ms.kind === "minor" ? "Minor" : "Major") + " Milestone: " + ms.text + ".", { color: "var(--gold)" }) : null,
        help("The payday's steps are under Paying for It.", { color: "var(--text3)" })
      ]));
    } else {
      kids.push(breachCard(d, true));
    }
    if (d.dive.collapse) kids.push(row([btn("TAKE THE COLLAPSE BACK", "collapse-clear", function () { d.dive.collapse = ""; }, { ghost: true })]));
    return EN.ui.panel(D.name, (cur ? cur.name.toUpperCase() : "HOLDING") + (d.dive.collapse ? DOT + d.dive.collapse.toUpperCase() + " COLLAPSE" : ""), kids,
      { glow: st === 3 && !d.dive.collapse });
  }

  // the Breach: one scene, then the spill, the Body Save at the rating's hazard DC, and who comes for it
  function breachCard(d, spilled) {
    var I = IN(), Br = I.dive.breach, dc = breachDC(d.rating), XR = I.collapseResponse;
    // the stage's own first sentence names what Breach is ("Uncontrolled collapse.")
    var bs = stageOf(3), what = bs ? String(bs.means).split(". ")[0].replace(/\.$/, "") + "." : "";
    var kids = [
      el("span", { style: { fontWeight: 600, color: "var(--danger)" }, text: spilled ? what || "Breach." : "Breach. " + what }),
      spilled ? null : help(Br.reach),
      help(Br.spill),
      el("p.help", { dataset: { sc: "breach-save", dc: dc === null ? "" : String(dc) }, style: { margin: "6px 0 0", fontWeight: 600 },
        text: "Each Freelancer still inside makes a " + Br.save.attr + " Save, DC " + (dc === null ? "by the hazard ladder (" + Br.save.dcText + ")" : dc) +
          " at rating " + d.rating + "." }),
      help(Br.onSuccess + " " + Br.onFailure),
      help(XR.text + " " + XR.arrives, { color: "var(--text2)" })
    ];
    var xb = bestEntry(XR.bestiary);
    if (xb && EN.gmView) kids.push(row([btn("VIEW " + xb.name.toUpperCase(), "view-xcal", function () { EN.gmView.handoff("bestiary", { query: xb.name }); return false; }, { ghost: true })]));
    return el("div.feature", { dataset: { sc: spilled ? "collapsed" : "breach", how: spilled ? "uncontrolled" : "" },
      style: { marginTop: "10px", borderLeftColor: "var(--danger)" } }, kids);
  }

  function incPay(d) {
    var I = IN(), crew = incCrew(d), cal = crew ? crew.caliber : 1, q = payQuote(d.rating, cal), kids = [];
    var P = q ? q.I : ref(I.refs.pay);
    if (!q || !P) return EN.ui.panel(I.paying.name, "PAYROLL", [help("The pay data did not load.")]);
    kids.push(help(P.text, { margin: 0 }));
    if (q.map && q.col) {
      kids.push(el("p", { dataset: { sc: "pay-col", col: q.map.col }, style: { margin: "8px 0 0", fontWeight: 600 },
        text: "A rating " + d.rating + " Incursion for a Caliber " + cal + " crew pays as " + q.col.name + (q.band ? ": " + q.band : "") + "." }));
    } else {
      var named = (P.ratingToColumn || []).map(function (x) {
        var c = byKey(payroll().contract.columns, x.col);
        return (x.offset === 0 ? "at the crew's Caliber" : x.offset + " " + plural(x.offset, "step") + " above it") + " (" + (c ? c.name : x.col) + ")";
      }).join(" or ");
      kids.push(el("p.help", { dataset: { sc: "pay-col", col: "" }, style: { margin: "8px 0 0", color: "var(--warn)" },
        text: "Rating " + d.rating + " against a Caliber " + cal + " crew: the book names a column only for a rating " + named + ". Price it by hand on Payroll." }));
    }
    var OA = P.objectiveAward;
    kids.push(row([
      field("Objective XP for the collapse", numIn("in.objXp", d.objXp, function (v) { d.objXp = v; },
        { min: 0, ph: OA ? OA.min + " to " + OA.max : "", width: "110px" }), "0 0 auto"),
      OA ? help("From " + OA.minText + " to " + OA.maxText + ".", { margin: "0 0 6px", color: "var(--text3)" }) : null
    ]));

    // the payday, in the book's order
    var PD = ref(I.refs.payday);
    if (PD && PD.steps) {
      kids.push(EN.ui.sectionTitle("After a controlled collapse"));
      PD.steps.forEach(function (s, i) {
        var on = d.steps.indexOf(i) !== -1;
        kids.push(el("div.row", { style: { gap: "8px", alignItems: "baseline", padding: "3px 0" } }, [
          toggle(String(i + 1), on, "step-" + i, function () {
            if (on) d.steps = d.steps.filter(function (x) { return x !== i; }); else d.steps.push(i);
          }),
          el("span", { style: { fontSize: "13px", color: on ? "var(--text3)" : "var(--text)", textDecoration: on ? "line-through" : "none" }, text: upperFirst(s) })
        ]));
      });
    }
    kids.push(row([
      btn("PAY THIS INCURSION", "pay-incursion", function () { payIncursion(d, cal, q); return false; },
        { primary: true, title: "Open Payroll with this Incursion" }),
      d.payAt ? help("Sent to Payroll before. Payroll knows it again and says so if it is already paid.", { margin: 0, color: "var(--text3)" }) : null
    ], { alignItems: "center" }));
    return EN.ui.panel(I.paying.name, q.col ? q.col.name.toUpperCase() : "PRICE BY HAND", kids);
  }

  /* PAY THIS INCURSION. Payroll's handoff takes an encounter snapshot and an
     XP objective; an Incursion goes as a snapshot with no threat rows, named
     for the Incursion, with `at` fixed the first time it is sent, so a second
     PAY lands on the same payday instead of paying it twice. The scene is
     saved first if it is not, so that `at` survives a reload. */
  function payIncursion(d, cal, q) {
    if (!EN.gmView || typeof EN.gmView.handoff !== "function") { toast("Payroll is not available."); return; }
    var kind = "incursion";
    if (!d.payAt) d.payAt = Date.now();
    if (!str(d.name).trim()) d.name = defaultName(kind, d);
    if (!savedRec(d)) {
      var rec = copy(d); rec.kind = kind;
      var id = gm.put("scenes", rec);
      if (id) { d.id = id; _v.base[kind] = sig(d); toast("Saved " + d.name + ", so Payroll knows it again later."); }
    } else { putKeep(kind); }
    var name = "Incursion: " + d.name.trim();
    var payload = {
      encounter: { at: d.payAt, name: name, entries: [], round: 0 },
      incursion: { rating: d.rating, caliber: cal, column: (q && q.map) ? q.map.col : null, name: d.name.trim(), sceneId: d.id || null },
      title: name
    };
    var obj = int(d.objXp);
    if (obj !== null && obj > 0) payload.xp = { objective: obj, skip: [] };
    // a controlled collapse is the book's Major Milestone; Payroll's Milestones panel picks it
    var ms = rowAt(IN().milestone);
    if (d.dive.collapse === "controlled" && ms) payload.milestone = ms.key;
    EN.gmView.handoff("payroll", payload);
  }

  // the Incursion's reference is the Codex's Incursion Rules, Claims and Salvage among them
  function incRef(d) {
    var I = IN(), C = ref(I.claims && I.claims.ref);
    return EN.ui.panel("Reference", "INCURSION RULES", [codexLinks("In the Codex:", [
      ["gms-incursion", "Incursion Rules"], ["gms-incursion/threat-calibers", "Threat Calibers"],
      ["gms-incursion/classification", "Classification"], ["gms-incursion/the-anchor", "The anchor"],
      ["gms-incursion/dive-profiles", "Dive profiles"]]
      .concat(C ? [["gms-incursion/claims-and-salvage", C.name || "Claims and Salvage"]] : []))]);
  }

  /* ---- the book's worked examples, as scenes ------------------------------ */
  function exampleDraft(kind) {
    var X = exampleOf(kind), d = blank(kind);
    if (!X) return d;
    if (kind === "sitdown") {
      d.name = X.name;
      d.stakes = { crewWants: X.stakes.crewWants, oppWants: X.stakes.oppWants, concedes: X.stakes.concedes, offers: X.stakes.offers };
      d.opp = { who: X.opposition.who, from: "", tier: X.opposition.tier, resolve: String(X.opposition.resolve), profile: X.opposition.profile };
      d.weak = { double: X.weakSpots.double, doubleWhy: X.weakSpots.doubleWhy, none: X.weakSpots.none, noneWhy: X.weakSpots.noneWhy };
      var pk = X.postures.picks || [];
      d.postures = { first: pk[0] ? pk[0].name : "", firstNote: pk[0] && pk[0].note ? pk[0].note : "",
                     second: pk[1] ? pk[1].name : "", secondNote: pk[1] && pk[1].note ? pk[1].note : "" };
      (X.floor || []).forEach(function (f) {
        var t = d.floor.filter(function (x) { return x.key === f.pressure; })[0];
        if (!t) return;
        t.live = true;
        t.where = f.where.replace(/\.$/, "");
        t.effect = f.effect;
        t.flip = f.flip;
      });
      d.clock = { round: X.clock.round, rounds: String(X.clock.rounds || ""), runsLong: X.clock.runsLong };
      d.fallout = { win: X.fallout.win, mixed: X.fallout.mixed, critical: X.fallout.critical };
    } else if (kind === "chase") {
      d.name = X.name;
      d.who = { running: X.running, chasing: X.chasing, wants: "" };
      var sedan = blankLine("running");
      sedan.name = "The crew's sedan";
      d.vehicles.push(sedan);
      var HV = ref(CH().refs.hostileVehicles) || [];
      (X.vehicles.lines || []).forEach(function (l) {
        var p = HV.filter(function (h) { return h.name === l.bestiary; })[0];
        var ln = p ? lineFrom(p, "hostile", l.side === "running" ? "running" : "chasing", "") : blankLine("chasing");
        if (!p) ln.name = l.name;
        ln.grade = String(l.pilotGrade || "");
        ln.attack = l.attack == null ? "" : String(l.attack);
        var pu = (X.pursuers || [])[0];
        if (pu) { ln.aboard = (pu.count === 2 ? "two " : pu.count + " ") + pu.name + (pu.count === 1 ? "" : "s"); ln.bestiary = pu.bestiary || ""; }
        d.vehicles.push(ln);
      });
      d.lead = { start: X.lead.lead, why: X.lead.why, now: X.lead.lead };
      d.route = { district: X.route.district, territory: "", straightaway: X.route.straightaway, tangle: X.route.tangle };
      d.esc = { source: X.escalation.source, heat: String(X.escalation.heat), row: X.escalation.arrives.replace(/\.$/, "") };
      d.endings = { escape: X.endings.escape, capture: X.endings.capture };
    } else {
      var Po = X.posting, G = X.gmRecord;
      d.name = exampleName(kind);
      d.rating = Po.rating;
      d.base = (Po.classification || [])[0] === "sealed" ? "sealed" : "open";
      d.provisional = !!Po.provisional;
      d.profile = Po.profile || "";
      d.ground = Po.ground === "private" ? "private" : "public";
      d.body = Po.body;
      if (G && G.chromatic) {
        d.addOns.chromatic = true;
        d.chromatic = { from: G.chromatic.from, becomes: G.chromatic.becomes, trigger: G.chromatic.trigger, known: false, met: false };
      }
    }
    return d;
  }

  /* ---- the scene as text, for COPY ----------------------------------------- */
  function lines(arr) { return arr.filter(function (x) { return x !== null && x !== undefined && String(x).trim() !== ""; }).join("\n"); }
  function sceneText(kind, d) {
    if (kind === "sitdown") return sitdownText(d);
    if (kind === "chase") return chaseText(d);
    return incursionText(d);
  }
  function sitdownText(d) {
    var B = SD(), t = tierOf(d.opp.tier), max = startResolve(d);
    var out = ["SIT-DOWN: " + (str(d.name).trim() || defaultName("sitdown", d))];
    out.push("Stakes. The crew wants: " + (d.stakes.crewWants || "-") + ". The Opposition wants: " + (d.stakes.oppWants || "-") +
      ". At Resolve 0 they concede: " + (d.stakes.concedes || "-") + ". Before that they offer: " + (d.stakes.offers || "-") + ".");
    out.push("Opposition: " + (d.opp.who || "-") + ", Resolve " + max + (t ? " (" + t.name + ")" : "") + ". Profile of the crew: " + (d.opp.profile || "-") + ".");
    if (d.weak.double || d.weak.none) out.push("Weak spots: " + (d.weak.double ? approachName(d.weak.double) + " deals double" + (d.weak.doubleWhy ? " (" + d.weak.doubleWhy + ")" : "") : "") +
      (d.weak.double && d.weak.none ? ". " : "") + (d.weak.none ? approachName(d.weak.none) + " deals none" + (d.weak.noneWhy ? " (" + d.weak.noneWhy + ")" : "") : "") + ".");
    var po = [d.postures.first ? d.postures.first + (d.postures.firstNote ? " (" + d.postures.firstNote + ")" : "") : "",
              d.postures.second ? d.postures.second + (d.postures.secondNote ? " (" + d.postures.secondNote + ")" : "") : ""].filter(Boolean);
    if (po.length) out.push("Postures: " + po.join(" and ") + ".");
    d.floor.forEach(function (f) {
      if (!f.live) return;
      var p = byKey(B.floor.pressures, f.key);
      out.push("The Floor, " + (p ? p.name : f.key) + ": " + [f.where, f.effect, f.flip ? "Flip it: " + f.flip : ""].filter(Boolean).join(". ") + (f.flipped ? " (flipped)" : ""));
    });
    if (d.clock.round || d.clock.runsLong) out.push("The clock: " + [d.clock.round, d.clock.rounds ? "After " + d.clock.rounds + " Rounds: " + d.clock.runsLong : d.clock.runsLong].filter(Boolean).join(" "));
    out.push("Fallout. Win: " + (d.fallout.win || "-") + " Mixed: " + (d.fallout.mixed || "-") + " Critical: " + (d.fallout.critical || "-"));
    out.push("Round " + d.track.round + ", Resolve " + resolveNow(d) + " of " + max + ".");
    d.track.log.forEach(function (x) {
      var r = byKey(B.results, x.result);
      out.push("  Round " + x.round + ": " + (x.approach ? approachName(x.approach) + ", " : "") + (r ? r.name : x.result) + ", " +
        (x.pressure ? x.pressure + " Pressure" : "no Pressure") + (x.gain ? ", +" + x.gain + " Resolve" : ""));
    });
    if (d.notes) out.push("Notes: " + d.notes);
    return lines(out);
  }
  function chaseText(d) {
    var out = ["CHASE: " + (str(d.name).trim() || defaultName("chase", d))];
    out.push("Running: " + (d.who.running || "-") + " Chasing: " + (d.who.chasing || "-") + (d.who.wants ? " They want: " + d.who.wants : ""));
    d.vehicles.forEach(function (v) {
      var sp = speedOf(v.speed), md = movingDefense(v), pil = pilotingOf(v), it = integrityNow(v);
      out.push("  " + (v.side === "running" ? "Running" : "Chasing") + ": " + (v.name || "a vehicle") + [
        sp ? sp.speed : "", v.handling !== "" ? "Handling " + fmtMod(int(v.handling) || 0) : "", v.structure ? "Structure " + v.structure : "",
        it !== null ? "Integrity " + it + " of " + v.integrity : "", v.weapons, md !== null ? "moving Defense " + md : "", pil !== null ? "piloting " + fmtMod(pil) : "",
        v.aboard ? "aboard: " + v.aboard : ""].filter(Boolean).map(function (x) { return ", " + x; }).join(""));
    });
    var b = bandOf(d.lead.now), dist = byKey((ref(CH().refs.stalemate) || {}).districts, d.route.district);
    out.push("Lead " + d.lead.now + (b ? " (" + b.name + ")" : "") + ", started at " + d.lead.start + (d.lead.why ? " (" + d.lead.why + ")" : "") + ".");
    if (dist || d.route.straightaway || d.route.tangle) out.push("Route: " + [dist ? dist.name : "", d.route.territory, d.route.straightaway ? "straightaway " + d.route.straightaway : "", d.route.tangle ? "tangle " + d.route.tangle : ""].filter(Boolean).join(", ") + ".");
    var fr = firstResponse(d.esc.heat);
    if (d.esc.source || fr !== null) out.push("Escalation: " + (d.esc.source || "the source") + ", Heat " + (d.esc.heat || "?") + (fr !== null ? ", first response in " + fr + " " + plural(fr, "round") : "") + (d.esc.row ? ": " + d.esc.row : "") + ".");
    out.push("Escape at Lead 5: " + (d.endings.escape || "-") + " Capture at Lead 0: " + (d.endings.capture || "-"));
    out.push("Method: " + (d.method === "pool" ? "Dice Pools" : "d20") + ".");
    d.track.log.forEach(function (x) { out.push("  " + (x.round ? "Round " + x.round + ": " : "") + x.text); });
    if (d.notes) out.push("Notes: " + d.notes);
    return lines(out);
  }
  function incursionText(d) {
    var out = ["INCURSION (GM): " + (str(d.name).trim() || defaultName("incursion", d)), postingText(d)];
    if (d.addOns.chromatic) out.push("Chromatic: begins " + classRow(d.chromatic.from).name + ", becomes " + classRow(d.chromatic.becomes).name +
      (d.chromatic.trigger ? " " + d.chromatic.trigger : "") + (d.chromatic.met ? " (the trigger is met)" : "") + ".");
    var ak = byKey(IN().anchor.kinds, d.anchor.kind);
    if (ak || d.anchor.text) out.push("Anchor: " + [ak ? ak.name : "", d.anchor.text].filter(Boolean).join(", ") +
      (d.anchor.kind === "thing" ? ". Focal Anchor, Defense " + IN().anchor.focal.defense + ", Vitality " + (IN().anchor.focal.vitalityPerRating * d.rating - (d.anchor.hit | 0)) + " of " + (IN().anchor.focal.vitalityPerRating * d.rating) : "") + ".");
    d.rules.forEach(function (r) { out.push("Local rule: " + lrText(r)); });
    if (d.zones) out.push("Zones: " + d.zones);
    var st = stageOf(d.dive.stage);
    out.push("Stage: " + (st ? st.name : "Holding") + ", " + d.dive.pushes.length + " " + plural(d.dive.pushes.length, "push", "pushes") + " logged." +
      (d.dive.collapse ? " " + upperFirst(d.dive.collapse) + " collapse." : ""));
    var dc = breachDC(d.rating);
    if (dc !== null) out.push("Breach Save: Body, DC " + dc + ".");
    if (d.notes) out.push("Notes: " + d.notes);
    return lines(out);
  }

  /* ---- a handoff in --------------------------------------------------------- */
  function receive(h) {
    if (typeof h.page === "string" && pageOk(h.page)) { flushKeep(); _v.page = h.page; }
    if (h.page === "sitdown" && isObj(h.opposition)) {
      if (unsavedWork("sitdown")) { _v.pend = h; return; }
      takeOpposition(h.opposition);
    }
  }
  function takeOpposition(o) {
    var d = fresh("sitdown");
    setOpposition(d, o);
    setDraft("sitdown", d);
    _v.pend = null;
  }
  function pendPanel() {
    var h = _v.pend;
    if (!isObj(h) || !isObj(h.opposition)) return null;
    var nm = str(h.opposition.name).trim() || "someone";
    var take = EN.ui.armButton("sc:pend", { cls: ".btn.sm", label: "START A SIT-DOWN WITH " + nm.toUpperCase(), armedLabel: "DISCARD THE DRAFT?",
      title: "Start a new Sit-Down across from " + nm, armedTitle: "The open Sit-Down has changes that are not saved. This replaces them.",
      onConfirm: function () { takeOpposition(h.opposition); EN.app.render(); } });
    take.setAttribute("data-sc", "pend-take");
    return EN.ui.panel("Sent to Scenes", "WAITING", [
      help("A Sit-Down with " + nm + " was sent here. The open Sit-Down has changes that are not saved, so nothing was replaced.", { margin: 0 }),
      row([take, btn("IGNORE IT", "pend-drop", function () { _v.pend = null; }, { ghost: true })])
    ]);
  }

  /* ---- the tab ----------------------------------------------------------------- */
  // the tab's content, built from the open scenes and the store: render() mounts it, retype() grafts it
  function build() {
    var kind = _v.page, d = draft(kind);
    var blocks = [heading("Scenes", "// sit-downs, chases, incursions")];
    var strip = undoStrip();
    if (strip && strip.nodeType) blocks.push(strip);
    blocks.push(pageBar());
    blocks.push(gap());
    var pend = kind === "sitdown" ? pendPanel() : null;
    if (pend) { blocks.push(pend); blocks.push(gap()); }
    blocks.push(scenePanel(kind));
    blocks.push(gap());
    var page = kind === "chase" ? chasePage(d) : kind === "incursion" ? incursionPage(d) : sitdownPage(d);
    return el("div", { dataset: { sc: "root", page: kind } }, blocks.concat(page).filter(Boolean));
  }

  function render(mount) {
    _mount = mount;
    EN.ui.clear(mount);
    var h = null;
    try { h = (EN.gmView && EN.gmView.takeHandoff) ? EN.gmView.takeHandoff("scenes") : null; } catch (e) { h = null; }
    if (isObj(h)) receive(h);
    if (!S() || !S().sitdown || !S().chase || !S().incursion) {
      mount.appendChild(el("div", null, [heading("Scenes", "// sit-downs, chases, incursions"), undoStrip(),
        el("div.muted-box", { style: { padding: "26px" }, text: "Scenes data did not load. Check app/data/gm_scenes.js." })].filter(Boolean)));
      return;
    }
    mount.appendChild(build());
    if (EN.ui.substituteCurrencyGlyphs) EN.ui.substituteCurrencyGlyphs(mount);
  }

  return {
    render: render,
    // pure helpers, for anything else that wants the same arithmetic
    firstResponse: function (heat) { return S() ? firstResponse(heat) : null; },
    breachDC: function (rating) { return S() ? breachDC(rating) : null; }
  };
})();
