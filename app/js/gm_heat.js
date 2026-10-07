/* ===========================================================================
   ELYSIUM NIGHTS · GM Heat (Admin tab)
   The Downtime Heat check, run off the book's Heat Response chapter
   (EN.gmBook.heat, data/gm_heat.js): the crew's Heat read off every crew
   record, the d10 per source, the event each source sends, the events the GM
   holds for later, the Bounty a source posts at Heat 9, and Cooling Off.
   Every word of the rules is the data file's: this file decides which row,
   never what a row says.

   THE CREW'S HEAT is read, never kept here: ch.face.heat on each crew record,
   the Social tab's {source, value} rows, 0 to 10 (js/face.js heatPanel). The
   crew is ruling D4's (EN.gmEngine.crew), or every record on this device when
   nothing is filed. Two rows name one source when they match trimmed, case
   ignored, the way gmstore's heat op matches them. Two spellings the GM says
   are one source ("Homeward" and "homeward corp") are merged on this tab only
   (`aliases` below): each Freelancer's row keeps its own spelling, and a write
   lands on it.

   Rulings this file carries (author, 2026-10; the book is silent on them):
     - One d10 per source the crew has Heat with (anyone above 0), against the
       highest Heat anyone holds with it; at or under, it acts; at Heat 10 it
       always acts.
     - The File's row 6 ("roll this source at +1 Heat") raises that source's
       Heat by 1 for the next check, to at most 10, and the band its event
       comes from follows the raised number. It counts from the Downtime the
       event was played in, so a held one counts once it is spent.
     - An event is this Downtime's once rolled or picked, unless HOLD sends it
       to the held events. A held event spent later keeps the band and Heat it
       was rolled at, and cannot be spent into a Downtime where its source
       already has one (one event per source per Downtime).
     - A fight takes the event row's own difficulty where the row names one,
       else its band's once the GM says it comes to a fight. At Heat 9 to 10
       every triggered check brings a Red Work team anyway, held event or not.
     - Lie low cools only after a Downtime whose check came up empty.

   GM ONLY. The Watchfire's hidden hashtag Heat lives in this tab's own state
   record and nowhere else: it is rolled with the rest, but no write, #POST or
   copied text ever carries it: every COPY here leaves out a check hidden Heat
   had a part in.

   WRITES to a Freelancer's record (Cooling Off and ADD HEAT) go through
   EN.gmStore.writeCrew op "heat" and nowhere else, behind an armed confirm,
   with a COPY of the same lines for a crew on other devices. Each is tagged
   {source: "heat", kind, method, key, batch} so its UNDO is read off the
   ledger (gmStore.undoable), never from memory, and survives a reload.

   The bag `heat` holds four kinds of record:
     {id: "heat_state", kind: "state", hidden: [{source, value}], aliases: {rowKey: key}}
     {kind: "downtime", n, at, crew: {caliber, headcount, source}, quiet, checks: [check]}
       check: {id, key, source, names, bookKey, heat, carry, effective, gmOnly,
               roll, always, triggered, band, holders: [{charId, name, value}],
               event: {n, text, how, carry?, bountyMult?, difficulty?} | null,
               fight, held, spentIn, spentAt, dropped, planId}
     {kind: "bounty", key, source, status: "up"|"down", postedAt, postedIn,
      targets: [{charId, name, caliber}], rate, aliveOnly, raised, takenBy,
      flawAt, endedAt, endReason, cancelPaid}
     {kind: "change", at, batch, how, method, methodName, key, source, amount,
      text, downtimeId, writes: [{id, charId, name}]}
   =========================================================================== */
window.EN = window.EN || {};

EN.gmHeat = (function () {
  var el = EN.ui.el, toast = EN.ui.toast, gm = EN.gmStore;
  // the currency mark the book prints: Glimmer U+1D4A2
  var G = "𝒢", DOT = " · ";
  var STATE_ID = "heat_state";
  // a name that is one of the four hashtags, with or without its #
  var HASHTAG = /(^|[^a-z0-9])#?(print|mint|reach|grid)([^a-z0-9]|$)/;
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* Transient UI state, deliberately not persisted, like every Admin form:
     the open folds, the two write forms (Cooling Off and ADD HEAT), and the
     GM's choices on a fight's team. Maps keyed by ids or typed text are
     null-prototype. A missing pick means the default: on for Cooling Off
     (everyone who holds the Heat), off for ADD HEAT (whoever earned it). */
  var _h = {
    open: Object.create(null),
    cool: { key: "", method: "dataScrub", pick: Object.create(null), amount: 1, flawless: false },
    add: { key: "", typed: "", pick: Object.create(null), amount: 1 },
    merge: { from: "", to: "" },  // the two board sources MERGE is about to join
    team: Object.create(null),   // checkId + ":" + Bestiary name -> false when left out
    cat: Object.create(null)     // checkId + ":" + team item index -> the Bestiary name picked
  };
  var _crew = null, _board = null;
  // the parts the ADD HEAT form repaints in place while a source name is typed (F19)
  var _paint = null;

  /* ---- small helpers, local per the house convention ----------------------- */
  function H() { return (EN.gmBook && EN.gmBook.heat) || null; }
  function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function copy(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function die(sides) { return 1 + Math.floor(Math.random() * sides); }
  function lid(p) { return p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36); }
  function commas(n) {
    n = Math.round(Number(n) || 0);
    return (n < 0 ? "-" : "") + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function fmtG(n) { return G + commas(n); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function pad2(n) { n = Number(n) || 0; return (n < 10 ? "0" : "") + n; }
  function fmtDay(ts) {
    if (!ts) return "";
    var t = new Date(ts);
    return t.getDate() + " " + MONTHS[t.getMonth()] + ", " + pad2(t.getHours()) + ":" + pad2(t.getMinutes());
  }
  function maxHeat() { var B = H(); return (B && B.check && Number(B.check.max)) || 10; }
  // a source as two rows are compared: trimmed, case ignored (gmstore's heatKey)
  function heatKey(s) { return typeof s === "string" ? s.trim().toLowerCase() : ""; }
  // a stored Heat value as a number on the track; the Social tab reads a missing one as 0
  function heatVal(v) { var n = Number(v); return isFinite(n) ? Math.max(0, Math.min(maxHeat(), n)) : 0; }
  function clampCal(c) { return Math.max(1, Math.min(5, Math.round(Number(c)) || 1)); }
  function rosterNow() { return (EN.store && EN.store.roster && EN.store.roster()) || {}; }
  function nameOf(ch) {
    var n = ((ch.firstName || "") + " " + (ch.lastName || "")).trim();
    return n || ch.name || "Freelancer";
  }

  function help(text, style) { return el("p.help", { style: style || { margin: "0 0 6px" }, text: text }); }
  function chip(text, color, title) {
    return el("span.chip", { title: title || null,
      style: color ? { fontSize: "9.5px", color: color, borderColor: color } : { fontSize: "9.5px" }, text: text });
  }
  function fieldHead(t, color) {
    return el("div.mono", { style: { fontSize: "10px", letterSpacing: ".14em", color: color || "var(--text3)", margin: "10px 0 3px" }, text: t });
  }
  function spacer(h) { return el("div", { style: { height: (h || 12) + "px" } }); }
  function muted(text) { return el("div.muted-box", { style: { padding: "18px" }, text: text }); }
  // a small button carrying a data-heat hook, so the tests find it by its job
  function btn(label, hook, onclick, opts) {
    opts = opts || {};
    return el("button.btn.sm" + (opts.primary ? ".primary" : ""), { dataset: { heat: hook },
      title: opts.title || null, disabled: !!opts.disabled, onclick: onclick,
      style: opts.style || null }, label);
  }
  // an armed button (EN.ui.armButton) with the same hook; `cls` keeps a write from reading as a delete
  function arm(key, hook, o) {
    var b = EN.ui.armButton(key, o);
    b.dataset.heat = hook;
    return b;
  }
  function dieFace(sides, n, color) {
    return el("span", { title: "d" + sides + (n ? ": " + n : ""), style: { display: "inline-flex", alignItems: "center", flex: "0 0 auto" },
      html: EN.ui.dieFaceSvg(sides, { size: 30, value: n || "", edge: color, num: color }) });
  }
  function fold(key, title, build) {
    var isOpen = !!_h.open[key];
    var head = el("div.section-title.clickable", { dataset: { fold: key },
      onclick: function () { _h.open[key] = !isOpen; EN.app.render(); }
    }, EN.ui.nameCaret(title, isOpen).concat([el("span.line")]));
    return el("div", null, [head, isOpen ? el("div", { style: { margin: "0 0 10px" } }, build()) : null]);
  }
  // the text a COPY puts on the clipboard, on screen beside the button so a blocked copy is never lost
  function textBox(kind, text) {
    return el("div", { dataset: { copy: kind },
      style: { whiteSpace: "pre-wrap", fontSize: "12.5px", lineHeight: "1.45", background: "var(--bg1)",
               border: "1px solid var(--border)", borderRadius: "3px", padding: "8px 10px", maxHeight: "220px",
               overflowY: "auto", color: "var(--text2)", userSelect: "text", overflowWrap: "anywhere" }, text: text });
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
      toast(ok ? what + " copied." : "The browser blocked the copy. Select the text beside the button instead.");
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast(what + " copied."); }, fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  // the GM'S CARD button beside the heading, when gm.js offers one
  function cardButton() {
    try {
      if (EN.gmView && typeof EN.gmView.cardDrawer === "function") {
        var n = EN.gmView.cardDrawer();
        return (n && n.nodeType) ? n : null;
      }
    } catch (e) {
      try { console.warn("GM Heat: the GM's Card button failed to draw.", e); } catch (e2) {}
    }
    return null;
  }
  // the same heading every Admin tab draws for itself (see gm.js)
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
    } catch (e) {
      try { console.error("GM Heat: the undo strip failed", e); } catch (e2) {}
      return null;
    }
  }

  /* ---- the book ----------------------------------------------------------- */
  function ladderRow(key) { var B = H(); return B ? (B.ladder.rows.filter(function (r) { return r.key === key; })[0] || null) : null; }
  function bandAt(v) { var B = H(); return (B && v > 0) ? (B.ladder.rows.filter(function (r) { return v >= r.min && v <= r.max; })[0] || null) : null; }
  function eventsBand(key) { var B = H(); return B ? (B.events.bands.filter(function (b) { return b.key === key; })[0] || null) : null; }
  function bookRow(key) { var B = H(); return (B && key) ? (B.sources.rows.filter(function (r) { return r.key === key; })[0] || null) : null; }
  function coolRow(key) { var B = H(); return B ? (B.cooling.rows.filter(function (r) { return r.key === key; })[0] || null) : null; }
  /* The By Source row a source's names point at: the first row, in the book's
     order, one of whose `match` fragments appears in one of the names. A rival
     crew, a hashtag or an unnamed corp has none, and the ladder still applies. */
  function matchRow(names) {
    var B = H();
    if (!B) return null;
    for (var i = 0; i < B.sources.rows.length; i++) {
      var r = B.sources.rows[i];
      for (var j = 0; j < (r.match || []).length; j++) {
        var f = r.match[j];
        if (names.some(function (n) { return n.indexOf(f) !== -1; })) return r;
      }
    }
    return null;
  }
  function difficultyOf(key) {
    var D = (EN.threats && EN.threats.budget && EN.threats.budget.difficulties) || [];
    return D.filter(function (d) { return d && d.key === key; })[0] || null;
  }
  function diffName(key) { var d = difficultyOf(key); return d ? d.name : String(key || ""); }
  function entryByName(name) {
    var B = EN.bestiary;
    return (B && B.entries) ? (B.entries.filter(function (e) { return e.name === name; })[0] || null) : null;
  }
  function xpOf(e) { try { return EN.gmEngine.xpOf(e) || 0; } catch (x) { return 0; } }
  // the hashtag a source's name is ("#PRINT"), or null
  function hashtagOf(name) {
    var m = String(name || "").toLowerCase().match(HASHTAG);
    return m ? "#" + m[2].toUpperCase() : null;
  }
  function bandTitle(key) { var e = eventsBand(key); return e ? e.title : ""; }

  /* ---- the crew --------------------------------------------------------------
     Ruling D4's crew (the Table's crew rows, else the filed roster). With
     nobody filed, every record on this device stands in, since Heat a GM can
     see is Heat worth rolling for; the board says which it read. */
  function crewNow() {
    if (_crew) return _crew;
    var c = null;
    try { c = EN.gmEngine.crew(); } catch (e) { c = null; }
    if (!c) c = { members: [], headcount: 0, caliber: 1, source: "none" };
    if (!c.members.length) {
      var roster = rosterNow(), ms = [];
      Object.keys(roster).forEach(function (k) {
        var ch = roster[k];
        if (!isObj(ch)) return;
        var cal = null;
        try { cal = EN.engine.derive(ch).caliber; } catch (e) { cal = null; }
        ms.push({ charId: k, name: nameOf(ch), caliber: typeof cal === "number" ? cal : null });
      });
      if (ms.length) {
        var cals = ms.filter(function (m) { return m.caliber !== null; }).map(function (m) { return m.caliber; });
        var avg = cals.length ? Math.round(cals.reduce(function (a, b) { return a + b; }, 0) / cals.length) : 1;
        c = { members: ms, headcount: ms.length, caliber: clampCal(avg), source: "device" };
      }
    }
    _crew = c;
    return c;
  }
  function crewSays(c) {
    if (c.source === "table") return "the crew on the Table";
    if (c.source === "roster") return "the filed crew";
    if (c.source === "device") return "every record on this device (none is filed yet)";
    return "nobody yet";
  }
  function budgetFor(diff) {
    var c = crewNow();
    try { return EN.gmEngine.budget(c.caliber, c.headcount, diff); } catch (e) { return 0; }
  }

  /* ---- this tab's records ----------------------------------------------------
     put() stores a copy and rec() hands back the live record (gmstore.js), so a
     change is always a copy, edited, then put back. */
  function stateRec() {
    var r = gm.rec("heat", STATE_ID);
    var s = { hidden: [], aliases: Object.create(null) };
    if (isObj(r)) {
      if (Array.isArray(r.hidden)) {
        r.hidden.forEach(function (h) {
          if (!isObj(h) || !String(h.source || "").trim()) return;
          s.hidden.push({ source: String(h.source).trim(), value: heatVal(h.value) });
        });
      }
      if (isObj(r.aliases)) {
        Object.keys(r.aliases).forEach(function (k) {
          if (own(r.aliases, k) && typeof r.aliases[k] === "string" && r.aliases[k]) s.aliases[k] = r.aliases[k];
        });
      }
    }
    return s;
  }
  function saveState(s) {
    var a = {};
    Object.keys(s.aliases).forEach(function (k) { a[k] = s.aliases[k]; });
    return gm.put("heat", { id: STATE_ID, kind: "state", hidden: s.hidden, aliases: a });
  }
  function canon(st, k) { return (own(st.aliases, k) && st.aliases[k]) ? st.aliases[k] : k; }
  /* A record of one kind. A Downtime counts only with its checks list and its
     number, so a hand-edited or half-written one (an imported file can hold
     anything) is passed over instead of printing "Downtime undefined". */
  function recsOf(kind) {
    return gm.list("heat").filter(function (r) {
      if (!r || r.kind !== kind) return false;
      return kind !== "downtime" || (Array.isArray(r.checks) && typeof r.n === "number" && isFinite(r.n));
    });
  }
  function downtimes() {
    return recsOf("downtime").sort(function (a, b) { return ((b.n || 0) - (a.n || 0)) || ((b.at || 0) - (a.at || 0)); });
  }
  function current() { return downtimes()[0] || null; }
  // every check of every Downtime, with the Downtime it belongs to
  function allChecks() {
    var out = [];
    recsOf("downtime").forEach(function (d) {
      (Array.isArray(d.checks) ? d.checks : []).forEach(function (c) { if (isObj(c)) out.push({ dt: d, c: c }); });
    });
    return out;
  }
  // a held event spent into Downtime `dt`
  function spentInto(dt) {
    return dt ? allChecks().filter(function (x) { return x.c.event && x.c.held && !x.c.dropped && x.c.spentIn === dt.id; }) : [];
  }
  /* The events played in Downtime `dt`: its own (not held), and the held ones
     spent into it. These are what a +1 carry counts from. */
  function playedIn(dt) {
    if (!dt) return [];
    var out = (dt.checks || []).filter(function (c) { return isObj(c) && c.event && !c.held; });
    spentInto(dt).forEach(function (x) { out.push(x.c); });
    return out;
  }
  function carriesFrom(dt, st) {
    var out = Object.create(null);
    playedIn(dt).forEach(function (c) {
      if (c.event && c.event.carry) out[canon(st, c.key)] = Number(c.event.carry) || 1;
    });
    return out;
  }
  function bountyFor(key, st) {
    return recsOf("bounty").filter(function (b) { return b.status === "up" && canon(st, b.key) === key; })[0] || null;
  }
  // edits one check of one Downtime record through a copy, and puts it back
  function mutateCheck(dtId, ckId, fn) {
    var r = gm.rec("heat", dtId);
    if (!r) return false;
    var d = copy(r);
    var c = (d.checks || []).filter(function (x) { return x && x.id === ckId; })[0];
    if (!c) return false;
    fn(c, d);
    d.quiet = !(d.checks || []).some(function (x) { return x && x.triggered; });
    gm.put("heat", d);
    _board = null;
    return true;
  }
  function mutateRec(id, fn) {
    var r = gm.rec("heat", id);
    if (!r) return false;
    var c = copy(r);
    fn(c);
    gm.put("heat", c);
    _board = null;
    return true;
  }

  /* ---- the board ---------------------------------------------------------------
     Every source the crew holds Heat with: the highest anyone holds (the
     number the check rolls against), who holds it, its band, its By Source
     row, a +1 carried from last Downtime, a Bounty up. A GM-only source (the
     Watchfire's hidden hashtag Heat) joins its board slot with `hidden` and
     counts toward the highest, but has no holders and is never written. */
  function board() {
    if (_board) return _board;
    var crew = crewNow(), roster = rosterNow(), st = stateRec();
    var map = Object.create(null), keys = [];
    function slot(k) {
      if (!own(map, k)) { map[k] = { key: k, spellings: [], holders: [], hidden: null, hiddenSource: "" }; keys.push(k); }
      return map[k];
    }
    crew.members.forEach(function (m) {
      var ch = own(roster, m.charId) ? roster[m.charId] : null;
      var rows = (ch && isObj(ch.face) && Array.isArray(ch.face.heat)) ? ch.face.heat : [];
      // one entry per Freelancer per source: their highest row (gmstore's heat op writes to that one)
      var best = Object.create(null);
      rows.forEach(function (r) {
        if (!isObj(r)) return;
        var raw = typeof r.source === "string" ? r.source.trim() : "";
        if (!raw) return;
        var k = canon(st, heatKey(raw)), v = heatVal(r.value), s = slot(k);
        // one spelling per row key: "Kindred" and " kindred " are one way of writing it
        if (!s.spellings.some(function (x) { return heatKey(x) === heatKey(raw); })) s.spellings.push(raw);
        if (!own(best, k) || v > best[k].value) best[k] = { value: v, source: raw };
      });
      Object.keys(best).forEach(function (k) {
        map[k].holders.push({ charId: m.charId, name: m.name, caliber: m.caliber, value: best[k].value, source: best[k].source });
      });
    });
    st.hidden.forEach(function (h) {
      var k = canon(st, heatKey(h.source));
      if (!k) return;
      var s = slot(k);
      if (s.hidden === null || h.value > s.hidden) { s.hidden = h.value; s.hiddenSource = h.source; }
    });
    var cur = current(), carries = carriesFrom(cur, st);
    var list = keys.map(function (k) {
      var s = map[k];
      s.holders.sort(function (a, b) { return (b.value - a.value) || a.name.localeCompare(b.name); });
      s.held = s.holders.length ? s.holders[0].value : 0;
      s.highest = Math.max(s.held, s.hidden === null ? 0 : s.hidden);
      s.gmOnly = !s.holders.length;
      // its name: a spelling of the key itself where someone holds one, else the highest holder's, else the GM's
      var exact = s.holders.filter(function (h) { return heatKey(h.source) === k; })[0];
      s.name = exact ? exact.source : (s.holders[0] ? s.holders[0].source : (s.hiddenSource || k));
      s.names = s.spellings.map(heatKey).concat(s.hiddenSource ? [heatKey(s.hiddenSource)] : []).concat([k]);
      s.row = matchRow(s.names);
      s.band = bandAt(s.highest);
      s.carry = own(carries, k) ? carries[k] : 0;
      s.bounty = bountyFor(k, st);
      s.merged = Object.keys(st.aliases).filter(function (a) { return st.aliases[a] === k && a !== k; });
      return s;
    });
    list.sort(function (a, b) {
      return (b.highest - a.highest) || a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    _board = { crew: crew, sources: list, state: st, current: cur };
    return _board;
  }
  function sourceOn(b, key) { return b.sources.filter(function (s) { return s.key === key; })[0] || null; }
  function bandColor(key) {
    return key === "order" ? "var(--danger)" : key === "team" ? "var(--ember, var(--danger))"
      : key === "interference" ? "var(--warn)" : key === "eyes" ? "var(--gold)" : key === "file" ? "var(--text2)" : "var(--text4)";
  }
  // "Hard Contract (1.5x): 900 XP for this crew." or the band's own "No fight."
  function fightLine(bandKey) {
    var r = ladderRow(bandKey);
    if (!r) return "";
    if (!r.difficulty) return r.fight;
    var c = crewNow();
    return r.fight + (c.headcount ? ": " + commas(budgetFor(r.difficulty)) + " XP for this crew (Caliber " + c.caliber + ", " +
      plural(c.headcount, "Freelancer") + ")." : ". No crew to budget it for yet.");
  }

  /* ---- merging two spellings ------------------------------------------------
     A tab-only alias: rows keyed `from` count as the source keyed `to` on this
     board. One level deep: what pointed at `from` now points at `to`. */
  function mergeInto(from, to) {
    var st = stateRec();
    to = canon(st, to);
    if (!from || !to || from === to) return;
    st.aliases[from] = to;
    Object.keys(st.aliases).forEach(function (k) { if (st.aliases[k] === from) st.aliases[k] = to; });
    saveState(st);
    _board = null;
  }
  function unmerge(alias) {
    var st = stateRec();
    if (!own(st.aliases, alias)) return;
    delete st.aliases[alias];
    saveState(st);
    _board = null;
  }

  function sourceCard(s, b) {
    var B = H(), band = s.band, ev = band ? eventsBand(band.key) : null, color = bandColor(band ? band.key : null);
    var kids = [];
    var head = [
      el("span.mono", { style: { fontSize: "20px", minWidth: "28px", color: color }, text: String(s.highest) }),
      el("span", { style: { fontWeight: 600, overflowWrap: "anywhere" }, text: s.name }),
      band ? chip((ev ? ev.name : band.heat).toUpperCase() + DOT + band.phbSays.toUpperCase(), color) : chip("NO HEAT", "var(--text4)"),
      s.carry ? chip("+" + s.carry + " NEXT CHECK", "var(--warn)", "The File's row 6: next Downtime this source rolls at +" + s.carry + " Heat") : null,
      s.bounty ? chip("BOUNTY UP", "var(--danger)") : null,
      s.hidden !== null ? chip(s.gmOnly ? "GM ONLY" : "GM ONLY HEAT " + s.hidden, "var(--danger)", "Hidden Heat the crew never learns about") : null
    ];
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, head));
    if (s.holders.length) {
      kids.push(help("Held by " + s.holders.map(function (h) { return h.name + " " + h.value; }).join(", ") +
        (s.spellings.length > 1 ? DOT + "written as " + s.spellings.join(", ") : "") + ".", { margin: "4px 0 0" }));
    } else {
      kids.push(help("No crew record holds this Heat. It lives on this tab for the GM alone.", { margin: "4px 0 0", color: "var(--danger)" }));
    }
    if (!band) {
      kids.push(help("At Heat 0 the source has nothing on the crew, so it is not rolled.", { margin: "3px 0 0", color: "var(--text4)" }));
    } else {
      kids.push(help("What it sends: " + band.sends, { margin: "4px 0 0", color: "var(--text2)" }));
      if (s.row) {
        kids.push(help(s.row.name + ": " + s.row.how, { margin: "3px 0 0", fontStyle: "italic" }));
        kids.push(help("Who it sends: " + s.row.sends + ".", { margin: "3px 0 0" }));
      } else {
        kids.push(help("No By Source notes for this source. The ladder and the events still apply.", { margin: "3px 0 0", color: "var(--text3)" }));
      }
      kids.push(help("If it comes to a fight: " + fightLine(band.key), { margin: "3px 0 0", color: "var(--accent)" }));
    }
    // the Bounty: posted the moment a source reaches Heat 9, retired once the crew's Heat with it falls below 7
    if (s.held >= B.bounty.postsAt && !s.bounty && s.holders.length) {
      kids.push(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "6px" } }, [
        el("span.help", { style: { margin: 0, color: "var(--danger)", flex: "1 1 200px", minWidth: "0" },
          text: "At Heat " + B.bounty.postsAt + " its own people stop being enough: it posts a Bounty on the Exchange." }),
        btn("POST THE BOUNTY", "post-bounty", function () { postBounty(s.key); EN.app.render(); }, { primary: true })
      ]));
    }
    if (s.bounty && s.held < B.bounty.endsBelow) {
      kids.push(help("Heat below " + B.bounty.endsBelow + ": the Bounty comes down. Retire it under The Bounty.", { margin: "6px 0 0", color: "var(--warn)" }));
    }
    // spellings merged into this source on this board (MERGE under the board); a tap splits one off again
    if (s.merged.length) {
      kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, s.merged.map(function (a) {
        return el("span.chip", { dataset: { heat: "unmerge", alias: a }, style: { fontSize: "9.5px", cursor: "pointer" },
          title: "Count \"" + a + "\" as its own source again",
          onclick: function () { unmerge(a); EN.app.render(); } }, "MERGED: " + a + " ✕");
      })));
    }
    return el("div.feature", { dataset: { heatSource: s.key },
      style: { borderLeftColor: color, opacity: band ? 1 : 0.6 } }, kids);
  }

  /* ---- GM only --------------------------------------------------------------
     The Watchfire's note: at Watchfire Heat 7 or higher, a hashtag source the
     crew has never angered starts climbing too, at Heat 1. That hidden Heat is
     kept in this tab's state record and moved by hand; Octothorpe's note shows
     whenever the crew holds hashtag Heat. */
  function gmOnlyBox(b) {
    var B = H(), st = b.state;
    var W = B.gmOnly.filter(function (n) { return n.key === "watchfire"; })[0] || null;
    var O = B.gmOnly.filter(function (n) { return n.key === "octothorpe"; })[0] || null;
    var watch = W ? b.sources.filter(function (s) { return s.row && s.row.key === W.source && s.holders.length; }) : [];
    var watchHeat = watch.reduce(function (a, s) { return Math.max(a, s.held); }, 0);
    var angered = Object.create(null);
    b.sources.forEach(function (s) {
      if (s.held <= 0) return;
      s.names.forEach(function (n) { var t = hashtagOf(n); if (t) angered[t] = true; });
    });
    var hasHash = Object.keys(angered).length > 0;
    if (!watch.length && !st.hidden.length && !hasHash) return null;
    var kids = [el("div.mono", { style: { fontSize: "10px", letterSpacing: ".14em", color: "var(--danger)", marginBottom: "4px" },
      text: "GM ONLY. NEVER WRITTEN TO A RECORD, A #POST OR ANY COPY." })];
    if (W && watch.length) {
      kids.push(el("p.help", { style: { margin: "4px 0 0" } }, [
        el("span", { style: { fontWeight: 600, color: "var(--text)" }, text: W.name + " " }), document.createTextNode(W.text)
      ]));
      if (watchHeat >= W.fromHeat) {
        var open = B.hashtags.filter(function (t) {
          return !own(angered, t) && !st.hidden.some(function (h) { return hashtagOf(h.source) === t; });
        });
        kids.push(help("The crew's Watchfire Heat is " + watchHeat + ". " + (open.length
          ? "Hashtags the crew has never angered: start one climbing."
          : "Every hashtag is already climbing or angered."), { margin: "6px 0 4px", color: "var(--danger)" }));
        if (open.length) {
          kids.push(el("div.row.wrap", { style: { gap: "6px" } }, open.map(function (t) {
            return el("button.btn.sm", { dataset: { heatStart: t }, onclick: function () {
              var s2 = stateRec();
              s2.hidden.push({ source: t, value: W.startsAt });
              saveState(s2);
              toast(t + " starts climbing at Heat " + W.startsAt + ", for the GM's eyes only.");
              EN.app.render();
            } }, "START " + t + " AT HEAT " + W.startsAt);
          })));
        }
      } else {
        kids.push(help("The crew's Watchfire Heat is " + watchHeat + ": below " + W.fromHeat + ", nothing hidden starts.", { margin: "6px 0 0" }));
      }
    }
    if (O && hasHash) {
      kids.push(el("p.help", { style: { margin: "8px 0 0" } }, [
        el("span", { style: { fontWeight: 600, color: "var(--text)" }, text: O.name + " " }), document.createTextNode(O.text)
      ]));
    }
    if (st.hidden.length) {
      kids.push(fieldHead("HIDDEN HEAT", "var(--danger)"));
      st.hidden.forEach(function (h, i) {
        function nudge(d) {
          var s2 = stateRec(), row = s2.hidden[i];
          if (!row) return;
          row.value = Math.max(0, Math.min(maxHeat(), row.value + d));
          saveState(s2);
          EN.app.render();
        }
        kids.push(el("div.row.between.wrap", { dataset: { heatHidden: h.source }, style: { gap: "8px", alignItems: "center", padding: "3px 0" } }, [
          el("span", { style: { fontWeight: 600 }, text: h.source + " " }),
          el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
            el("span.mono", { style: { fontSize: "13px" }, text: "HEAT " + h.value }),
            btn("−", "hid-down", function () { nudge(-1); }, { style: { padding: "0 8px" }, disabled: h.value <= 0 }),
            btn("+", "hid-up", function () { nudge(1); }, { style: { padding: "0 8px" }, disabled: h.value >= maxHeat() }),
            arm("heat:hid:" + i + ":" + h.source, "hid-remove", { label: "REMOVE", armedLabel: "REMOVE IT?",
              armedTitle: "Stops this hidden Heat. It was only ever on this tab.",
              onConfirm: function () {
                var s2 = stateRec();
                s2.hidden = s2.hidden.filter(function (x, j) { return j !== i; });
                saveState(s2);
                EN.app.render();
              } })
          ])
        ]));
      });
    }
    return el("div.feature", { dataset: { heat: "gmonly" }, style: { borderLeftColor: "var(--danger)", marginTop: "10px" } }, kids);
  }

  function boardPanel(b) {
    var crew = b.crew, kids = [];
    var cals = crew.members.map(function (m) { return m.name + (m.caliber !== null ? " (Caliber " + m.caliber + ")" : ""); });
    kids.push(help(crew.members.length
      ? "Read from " + crewSays(crew) + ": " + cals.join(", ") + ". Caliber " + crew.caliber + ", " + plural(crew.headcount, "Freelancer") + "."
      : "No crew yet. File a Freelancer, or pull one onto the Table, and their Heat shows here.", { margin: "0 0 10px" }));
    if (!b.sources.length) {
      kids.push(muted("No Heat on the crew's records. Each Freelancer keeps it on the Social tab, one row per source, and ADD HEAT below writes it there."));
    }
    b.sources.forEach(function (s) { kids.push(sourceCard(s, b)); });
    var g = gmOnlyBox(b);
    if (g) kids.push(g);
    var m = mergeFold(b);
    if (m) kids.push(m);
    var hot = b.sources.filter(function (s) { return s.highest > 0; }).length;
    return EN.ui.panel("Crew Heat", plural(hot, "SOURCE", "SOURCES") + (crew.headcount ? DOT + "CALIBER " + crew.caliber : ""), kids);
  }
  /* Two spellings, one source: the players type their sources freely, so
     "Homeward" and "homeward corp" would roll twice. MERGE counts the first as
     the second on this board; each Freelancer's own row keeps its spelling. */
  function mergeFold(b) {
    var list = b.sources.filter(function (s) { return !s.gmOnly; });
    if (list.length < 2) return null;
    var st = _h.merge;
    if (!sourceOn(b, st.from)) st.from = "";
    if (!sourceOn(b, st.to)) st.to = "";
    return fold("merge", "Two spellings, one source", function () {
      function pickOne(hook, cur, onPick, first) {
        return el("select", { dataset: { heat: hook }, style: { width: "100%" }, onchange: function (e) { onPick(e.target.value); EN.app.render(); } },
          [el("option", { value: "", selected: !cur }, first)].concat(list.map(function (s) {
            return el("option", { value: s.key, selected: s.key === cur }, s.name);
          })));
      }
      var ready = st.from && st.to && st.from !== st.to;
      return [
        help("A source the crew wrote two ways rolls twice. Merge them here: the check rolls once, and each Freelancer's own row keeps its spelling.", { margin: "0 0 6px" }),
        el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
          el("div", { style: { flex: "1 1 160px", minWidth: "0" } }, [pickOne("merge-from", st.from, function (v) { st.from = v; }, "Count this...")]),
          el("div", { style: { flex: "1 1 160px", minWidth: "0" } }, [pickOne("merge-to", st.to, function (v) { st.to = v; }, "...as this source")]),
          btn("MERGE", "merge", function () {
            var a = sourceOn(b, st.from), c = sourceOn(b, st.to);
            mergeInto(st.from, st.to);
            st.from = ""; st.to = "";
            toast((a ? a.name : "That source") + " now counts as " + (c ? c.name : "the other") + ".");
            EN.app.render();
          }, { primary: !!ready, disabled: !ready })
        ])
      ];
    });
  }

  /* ---- the check ------------------------------------------------------------
     RUN THE HEAT CHECK starts the next Downtime: one d10 per source above 0,
     against its highest Heat plus any carry, a fresh record in the log. */
  function runCheck() {
    _board = null;
    var B = H(), b = board();
    var rolled = b.sources.filter(function (s) { return s.highest > 0; });
    if (!rolled.length) { toast("No source holds any Heat, so there is nothing to roll."); return null; }
    var crew = b.crew, prev = b.current;
    // the dice first, one per source in the board's order, then the records around them
    var rolls = rolled.map(function () { return die(B.check.sides); });
    var checks = rolled.map(function (s, i) {
      var eff = Math.min(maxHeat(), s.highest + s.carry);
      var roll = rolls[i];
      var always = eff >= B.check.alwaysAt;
      var band = bandAt(eff);
      return { id: lid("ck_"), key: s.key, source: s.name, names: s.names.slice(), bookKey: s.row ? s.row.key : null,
               heat: s.highest, carry: s.carry, effective: eff, gmOnly: s.gmOnly, hiddenPart: s.hidden !== null && s.hidden > s.held,
               roll: roll, always: always, triggered: always || (B.check.triggersAtOrBelow ? roll <= eff : roll < eff),
               band: band ? band.key : null,
               holders: s.holders.map(function (h) { return { charId: h.charId, name: h.name, value: h.value }; }),
               event: null, fight: false, held: false, spentIn: null, dropped: false, planId: null };
    });
    var n = ((prev && prev.n) || 0) + 1;
    var id = gm.put("heat", { kind: "downtime", n: n, at: Date.now(),
      crew: { caliber: crew.caliber, headcount: crew.headcount, source: crew.source },
      checks: checks, quiet: !checks.some(function (c) { return c.triggered; }) });
    _board = null;
    var acted = checks.filter(function (c) { return c.triggered; });
    toast(id ? "Downtime " + n + ": " + (acted.length ? plural(acted.length, "source") + " acted." : "every source stayed quiet.")
             : "The check could not be saved.");
    return id;
  }
  function setEvent(dtId, ckId, n, how) {
    return mutateCheck(dtId, ckId, function (c) {
      var band = eventsBand(c.band);
      var row = band ? band.rows.filter(function (r) { return r.n === n; })[0] : null;
      if (!row) return;
      c.event = { n: row.n, text: row.text, how: how };
      if (row.carry) c.event.carry = row.carry;
      if (row.bountyMult) c.event.bountyMult = row.bountyMult;
      if (row.difficulty) c.event.difficulty = row.difficulty;
    });
  }
  /* What the current Downtime already holds for a source key: its own event
     (not held), or a held one spent into it. One event per source per Downtime. */
  function eventHere(cur, key, st) {
    if (!cur) return null;
    var own0 = (cur.checks || []).filter(function (c) { return isObj(c) && canon(st, c.key) === key && c.event && !c.held; })[0];
    if (own0) return own0;
    return (spentInto(cur).filter(function (x) { return canon(st, x.c.key) === key; })[0] || {}).c || null;
  }

  /* The fight a triggered check brings, or null: the event row's own
     difficulty (once the event is played), else the top band's Red Work team
     (always, at 9 to 10), else the band's fight once the GM marks it. */
  function fightOf(c) {
    if (!c || !c.triggered) return null;
    var band = ladderRow(c.band);
    if (!band) return null;
    var top = H().ladder.topBand, isTop = !!top && c.effective >= top.min;
    var live = c.event && (!c.held || c.spentIn);
    var diff = (live && c.event.difficulty) || null, why = diff ? "event" : null;
    if (!diff && isTop) { diff = top.difficulty; why = "top"; }
    if (!diff && c.fight && band.difficulty) { diff = band.difficulty; why = "band"; }
    if (!diff) return null;
    return { difficulty: diff, why: why, top: isTop, band: band };
  }
  /* The By Source team for a check, as the book prints it: an entry with
     `minHeat` only at that Heat or more, one with `only` only when the
     source's name carries one of its fragments. */
  function teamOf(c) {
    var row = bookRow(c.bookKey);
    if (!row) return [];
    var names = (Array.isArray(c.names) && c.names.length) ? c.names : [heatKey(c.source)];
    var out = [];
    (row.team || []).forEach(function (t, i) {
      if (t.minHeat && c.effective < t.minHeat) return;
      if (t.only && !t.only.some(function (f) { return names.some(function (n) { return n.indexOf(f) !== -1; }); })) return;
      out.push({ idx: i, name: t.name || null, category: t.category || null, quote: t.quote || "",
                 count: Number(t.count) || 1, highCaliber: !!t.highCaliber, group: t.group || null });
    });
    return out;
  }
  // a named entry is in unless the GM left it out; the high-Caliber one is out unless the GM puts it in
  function teamIn(c, t) {
    var k = c.id + ":" + t.name;
    return own(_h.team, k) ? !!_h.team[k] : !t.highCaliber;
  }
  // a category's entries, nearest the crew's Caliber first
  function categoryEntries(cat) {
    var B = EN.bestiary, cal = crewNow().caliber;
    if (!B || !B.entries) return [];
    return B.entries.filter(function (e) { return e.category === cat; }).sort(function (a, b) {
      return (Math.abs((a.grade || 0) - cal) - Math.abs((b.grade || 0) - cal)) || a.name.localeCompare(b.name);
    });
  }
  // the Bestiary lines a fight sends to Encounters: one per name, the printed counts added up
  function planLines(c) {
    var by = Object.create(null), order = [];
    teamOf(c).forEach(function (t) {
      var name = t.name;
      if (t.category) name = own(_h.cat, c.id + ":" + t.idx) ? _h.cat[c.id + ":" + t.idx] : "";
      else if (!teamIn(c, t)) return;
      if (!name || !entryByName(name)) return;
      if (!own(by, name)) { by[name] = 0; order.push(name); }
      by[name] += t.count;
    });
    return order.map(function (n) { return { kind: "bestiary", name: n, count: by[n] }; });
  }
  function takersLine(b) {
    if (!b) return "";
    var who = String(b.takenBy || "").trim();
    return who ? "A Bounty is up, taken by " + who + ": they come too." : "A Bounty is up: whoever has taken it comes too.";
  }
  function fightNote(c, f) {
    var top = H().ladder.topBand, out = [];
    out.push("Heat " + c.effective + " with " + c.source + ", " + bandTitle(c.band) + ".");
    if (c.event && (!c.held || c.spentIn)) out.push("The event (d6 " + c.event.n + "): " + c.event.text);
    out.push("If it comes to a fight: " + diffName(f.difficulty) + (f.why === "top" ? ", " + top.text + "." : "."));
    var row = bookRow(c.bookKey);
    out.push(row ? "Who it sends: " + row.sends + "." : "No By Source notes for this source: build the team from its own people first.");
    var bt = bountyFor(c.key, stateRec());
    if (bt) out.push(takersLine(bt));
    return out.join("\n");
  }
  function lineUid() { return "ln_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
  /* SEND TO ENCOUNTERS: a saved plan in the shared plan shape (SPEC_B), its
     difficulty set from the fight and the team as Bestiary lines, and the GM is
     taken straight to it: the handoff's openPlanId opens it in the Encounters
     editor (gm_encounters.js intake), so it is never left waiting under Plans
     (author's call, 2026-10-07). + ADD TO OPEN PLAN is the
     handoff instead: its lines join whatever plan is open, and its difficulty
     sets that plan's only when the plan held no lines yet (gm_encounters.js
     intake), so a plan the GM already started keeps its own. */
  function sendToEncounters(dt, c) {
    var f = fightOf(c);
    if (!f) return;
    if (c.planId && gm.rec("encounters", c.planId)) { openPlan(c.planId); return; }
    var name = "Heat: " + c.source + ", " + ((eventsBand(c.band) || {}).name || "the check");
    var plan = {
      name: name, difficulty: f.difficulty, crewOverride: null,
      lines: planLines(c).map(function (l) {
        return { lineId: lineUid(), kind: "bestiary", name: l.name, count: l.count, wave: 1, xpEach: xpOf(entryByName(l.name)) };
      }),
      objective: { key: null, aliveOnly: false, note: "", awardXp: 0 },
      site: { tier: null, grade: null, rounds: null }, room: {},
      notes: fightNote(c, f), jobId: null
    };
    var id = gm.put("encounters", plan);
    if (!id) { toast("The plan could not be saved."); return; }
    mutateCheck(dt.id, c.id, function (ck) { ck.planId = id; });
    toast("Saved to Encounters as a " + diffName(f.difficulty) + " plan: " + name + ".");
    openPlan(id);
  }
  // opens a saved plan in the Encounters editor, or just the tab if the handoff is missing
  function openPlan(id) {
    if (EN.gmView && EN.gmView.handoff) EN.gmView.handoff("encounters", { openPlanId: id });
    else EN.app.gotoTab("encounters");
  }
  function addToOpenPlan(c) {
    var f = fightOf(c);
    if (!f || !EN.gmView || !EN.gmView.handoff) return;
    EN.gmView.handoff("encounters", { addLines: planLines(c), note: fightNote(c, f), difficulty: f.difficulty });
  }

  function eventControls(dt, c, b) {
    var band = eventsBand(c.band), kids = [];
    if (!band) return kids;
    var sel = el("select", { dataset: { heat: "pick-event" }, style: { width: "100%", maxWidth: "100%", fontSize: "12.5px", padding: "5px 8px" },
      onchange: function (e) {
        var n = Number(e.target.value);
        if (!n) return;
        setEvent(dt.id, c.id, n, "picked");
        EN.app.render();
      } }, [el("option", { value: "", selected: !c.event }, c.event ? "Pick a different row..." : "Or pick a row...")].concat(band.rows.map(function (r) {
        return el("option", { value: String(r.n), selected: false }, r.n + ". " + r.text);
      })));
    if (!c.event) {
      kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "6px" } }, [
        btn("ROLL " + H().events.die.toUpperCase(), "roll-event", function () {
          setEvent(dt.id, c.id, die(H().events.sides), "rolled");
          EN.app.render();
        }, { primary: true }),
        el("div", { style: { flex: "1 1 200px", minWidth: "0" } }, [sel])
      ]));
    } else {
      kids.push(el("div", { style: { marginTop: "6px" } }, [sel]));
    }
    return kids;
  }

  function eventCard(dt, c, b, ctx) {
    var cur = b.current, isCur = !!cur && dt.id === cur.id, kids = [];
    var band = eventsBand(c.band);
    if (!c.event) {
      var taken = isCur ? eventHere(cur, canon(b.state, c.key), b.state) : null;
      if (taken && taken !== c) {
        kids.push(help("This source's event this Downtime is the held one spent below (one event per source per Downtime).", { margin: "6px 0 0" }));
      } else if (isCur) {
        kids.push(help(band ? band.title + ": roll a d6 on the band, or pick." : "", { margin: "6px 0 0", color: "var(--text2)" }));
        eventControls(dt, c, b).forEach(function (k) { kids.push(k); });
      }
    } else {
      var e = c.event, live = !c.held || c.spentIn;
      var chips = [chip(e.how === "picked" ? "PICKED" : "ROLLED", "var(--text3)")];
      if (e.difficulty) chips.push(chip(diffName(e.difficulty).toUpperCase(), "var(--danger)"));
      if (e.carry) chips.push(chip("+" + e.carry + " HEAT NEXT CHECK", "var(--warn)"));
      if (e.bountyMult) chips.push(chip("BOUNTY x" + e.bountyMult, "var(--danger)"));
      if (c.held && !c.spentIn) chips.push(chip("HELD", "var(--gold)"));
      if (c.spentIn) chips.push(chip("SPENT", "var(--success)"));
      kids.push(el("div.row", { style: { gap: "10px", alignItems: "flex-start", marginTop: "8px" } }, [
        dieFace(6, e.n, live ? "var(--accent)" : "var(--text3)"),
        el("div", { style: { flex: "1 1 auto", minWidth: "0" } }, [
          el("p", { dataset: { heat: "event-text" }, style: { margin: 0, fontSize: "13.5px", color: live ? "var(--text)" : "var(--text3)" }, text: e.text }),
          el("div.row.wrap", { style: { gap: "5px", marginTop: "4px" } }, chips)
        ])
      ]));
      if (isCur && !c.held && !ctx.spent) {
        eventControls(dt, c, b).forEach(function (k) { kids.push(k); });
        kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "6px", alignItems: "center" } }, [
          btn("HOLD FOR LATER", "hold", function () {
            mutateCheck(dt.id, c.id, function (ck) { ck.held = true; ck.fight = false; });
            toast("Held. " + c.source + " doesn't forget: it reschedules.");
            EN.app.render();
          }, { title: H().check.guidelines.filter(function (g) { return g.key === "canWait"; }).map(function (g) { return g.name + " " + g.text; })[0] || "" })
        ]));
      } else if (c.held && !c.spentIn && isCur) {
        var busy = eventHere(cur, canon(b.state, c.key), b.state);
        kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "6px", alignItems: "center" } }, [
          help("Held for later: it waits under Held Events.", { margin: 0, color: "var(--gold)" }),
          btn("PLAY IT NOW", "unhold", function () {
            mutateCheck(dt.id, c.id, function (ck) { ck.held = false; });
            EN.app.render();
          }, { disabled: !!busy, title: busy ? "One event per source per Downtime: " + c.source + " already has one this Downtime." : "" })
        ]));
      }
      // the Order's row 1 doubles the posted price of the source's Bounty
      if (e.bountyMult && live) {
        var bt = bountyFor(c.key, b.state);
        if (!bt) {
          kids.push(help("No Bounty is up for " + c.source + " yet. POST THE BOUNTY on its card under Crew Heat first.", { margin: "6px 0 0", color: "var(--warn)" }));
        } else if (!bt.raised) {
          kids.push(el("div", { style: { marginTop: "6px" } }, [btn("RAISE THE BOUNTY x" + e.bountyMult, "raise", function () {
            mutateRec(bt.id, function (r) { r.raised = true; });
            toast("The Bounty on the crew is doubled.");
            EN.app.render();
          }, { primary: true })]));
        } else {
          kids.push(help("The Bounty is raised: double the posted price.", { margin: "6px 0 0", color: "var(--danger)" }));
        }
      }
    }
    var fb = fightBlock(dt, c, b, isCur || ctx.spent);
    if (fb) kids.push(fb);
    return kids;
  }

  function fightBlock(dt, c, b, editable) {
    var band = ladderRow(c.band), f = fightOf(c);
    if (!band) return null;
    if (!f) {
      // a played event (or a held one spent since) can turn into the band's fight
      var canMark = editable && band.difficulty && c.event && (!c.held || c.spentIn);
      if (!canMark) return null;
      return el("div.row.wrap", { style: { gap: "8px", marginTop: "8px", alignItems: "center" } }, [
        btn("IT COMES TO A FIGHT", "fight", function () {
          mutateCheck(dt.id, c.id, function (ck) { ck.fight = true; });
          EN.app.render();
        }),
        el("span.help", { style: { margin: 0 }, text: "At this band: " + band.fight + "." })
      ]);
    }
    var top = H().ladder.topBand, kids = [];
    var why = f.why === "event" ? "The event names the fight." : f.why === "top" ? cap(top.text) + "." : "The band's fight size.";
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
      el("span.mono", { style: { fontSize: "11px", letterSpacing: ".12em", color: "var(--danger)" }, text: "FIGHT" }),
      el("span", { style: { fontWeight: 600 }, text: diffName(f.difficulty) + (difficultyOf(f.difficulty) ? " (" + difficultyOf(f.difficulty).mult + "x)" : "") }),
      el("span.help", { style: { margin: 0 }, text: commas(budgetFor(f.difficulty)) + " XP for this crew" })
    ]));
    kids.push(help(why, { margin: "3px 0 0", color: "var(--text2)" }));
    if (f.why === "band" && editable) {
      kids.push(el("div", { style: { marginTop: "4px" } }, [btn("NOT A FIGHT", "unfight", function () {
        mutateCheck(dt.id, c.id, function (ck) { ck.fight = false; });
        EN.app.render();
      })]));
    }
    var row = bookRow(c.bookKey);
    if (row) {
      kids.push(help("Who it sends: " + row.sends + ".", { margin: "6px 0 4px" }));
      var team = teamOf(c), seen = Object.create(null), chipsN = [];
      team.forEach(function (t) {
        if (t.category) {
          var opts = categoryEntries(t.category), k = c.id + ":" + t.idx, cur = own(_h.cat, k) ? _h.cat[k] : "";
          chipsN.push(el("select", { dataset: { heat: "team-cat" }, style: { width: "auto", maxWidth: "100%", fontSize: "12px", padding: "3px 6px" },
            title: t.quote,
            onchange: function (e) { _h.cat[k] = e.target.value; EN.app.render(); } },
            [el("option", { value: "", selected: !cur }, cap(t.quote) + ": pick one...")].concat(opts.map(function (e2) {
              return el("option", { value: e2.name, selected: e2.name === cur }, e2.name + " (G" + e2.grade + ")");
            }))));
          return;
        }
        if (seen[t.name]) return;
        seen[t.name] = true;
        var total = team.filter(function (x) { return x.name === t.name; }).reduce(function (a, x) { return a + x.count; }, 0);
        var on = teamIn(c, t), known = !!entryByName(t.name);
        chipsN.push(el("span.chip" + (on ? ".on" : ""), { dataset: { heatTeam: t.name },
          style: { cursor: known ? "pointer" : "default", fontSize: "10.5px", opacity: known ? 1 : 0.5 },
          title: (t.highCaliber ? "Only " + t.quote + ". " : "") + (known ? (on ? "Goes to Encounters" : "Left out") : "Not in the Bestiary"),
          onclick: known ? function () { _h.team[c.id + ":" + t.name] = !on; EN.app.render(); } : null },
          (on ? "✓ " : "") + t.name + (total > 1 ? " x" + total : "") + (t.highCaliber ? " (high Caliber)" : "")));
      });
      if (chipsN.length) kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, chipsN));
    } else {
      kids.push(help("No By Source notes for this source: build the team from its own people first.", { margin: "6px 0 0" }));
    }
    var bt = bountyFor(c.key, b.state);
    if (bt) kids.push(help(takersLine(bt), { margin: "6px 0 0", color: "var(--danger)" }));
    var lines = planLines(c), saved = c.planId && gm.rec("encounters", c.planId);
    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px", alignItems: "center" } }, [
      btn(saved ? "OPEN THE PLAN" : "SEND TO ENCOUNTERS", "send-enc", function () { sendToEncounters(dt, c); }, { primary: !saved,
        title: "Saves a " + diffName(f.difficulty) + " plan with " + plural(lines.length, "Bestiary line") + " on the Encounters tab" }),
      btn("+ ADD TO OPEN PLAN", "add-plan", function () { addToOpenPlan(c); },
        { disabled: !lines.length, title: lines.length ? "Adds the team to the plan open on the Encounters tab, with a note naming the fight"
                                                      : "No Bestiary entry is picked for this fight" }),
      saved ? chip("PLAN SAVED", "var(--success)") : null
    ]));
    return el("div.feature", { dataset: { heat: "fight" }, style: { borderLeftColor: "var(--danger)", marginTop: "8px", background: "var(--bg2)" } }, kids);
  }

  function checkRow(dt, c, b) {
    var B = H(), color = c.triggered ? "var(--danger)" : "var(--text3)";
    var band = ladderRow(c.band), evb = eventsBand(c.band), kids = [];
    var verdict = c.always ? chip("HEAT " + B.check.alwaysAt + ": IT ALWAYS ACTS", "var(--danger)")
      : c.triggered ? chip("ACTS", "var(--danger)") : chip("QUIET", "var(--success)");
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "center" } }, [
      dieFace(B.check.sides, c.roll, color),
      el("span", { style: { fontWeight: 600, overflowWrap: "anywhere" }, text: c.source }),
      el("span.mono", { style: { fontSize: "12px", color: "var(--text2)" },
        text: "HEAT " + c.effective + (c.carry ? " (" + c.heat + " +" + c.carry + ")" : "") }),
      verdict,
      c.gmOnly || c.hiddenPart ? chip("GM ONLY", "var(--danger)") : null
    ]));
    kids.push(help((evb ? evb.title : "") + (band ? DOT + band.phbSays : "") + DOT + "rolled " + c.roll +
      (c.triggered ? (c.always ? "" : ", at or under " + c.effective) : ", over " + c.effective), { margin: "4px 0 0" }));
    // the takers come on every check; a fight card says so itself, so the row says it only without one
    var bt = bountyFor(c.key, b.state);
    if (bt && !fightOf(c)) kids.push(help(takersLine(bt) + " Every Heat check against the source brings them.", { margin: "3px 0 0", color: "var(--danger)" }));
    if (c.triggered) eventCard(dt, c, b, { spent: false }).forEach(function (k) { kids.push(k); });
    return el("div.feature", { dataset: { heatCheck: c.id }, style: { borderLeftColor: color } }, kids);
  }

  function checkPanel(b) {
    var B = H(), cur = b.current, kids = [];
    kids.push(help(B.check.paragraphs[0], { margin: "0 0 4px" }));
    kids.push(help(B.check.paragraphs[1], { margin: "0 0 10px", color: "var(--text2)" }));
    var rollable = b.sources.filter(function (s) { return s.highest > 0; }).length;
    var run = !cur
      ? btn("RUN THE HEAT CHECK", "run", function () { runCheck(); EN.app.render(); },
          { primary: true, disabled: !rollable, title: rollable ? "A d10 for every source the crew has Heat with" : "No source holds any Heat" })
      : (rollable ? arm("heat:run:" + cur.id, "run", { cls: ".btn.sm", label: "RUN THE HEAT CHECK", armedLabel: "START DOWNTIME " + (cur.n + 1) + "?",
          title: "Start the next Downtime with a fresh check",
          armedTitle: "Rolls the check for Downtime " + (cur.n + 1) + ". Downtime " + cur.n + " stays in the log. Click again to confirm.",
          onConfirm: function () { runCheck(); EN.app.render(); } })
        : btn("RUN THE HEAT CHECK", "run", null, { disabled: true, title: "No source holds any Heat" }));
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "8px" } }, [
      run,
      cur ? btn("COPY THIS DOWNTIME", "copy-downtime", function () { copyText(downtimeText(cur), "Downtime " + cur.n); }) : null
    ]));
    if (!cur) {
      kids.push(muted("No Downtime rolled yet. At the start of each Downtime, RUN THE HEAT CHECK rolls a d10 for every source the crew has Heat with."));
    } else {
      var acted = (cur.checks || []).filter(function (c) { return c && c.triggered; });
      kids.push(EN.ui.sectionTitle("Downtime " + cur.n + DOT + fmtDay(cur.at)));
      (cur.checks || []).forEach(function (c) { if (isObj(c)) kids.push(checkRow(cur, c, b)); });
      var spent = spentInto(cur);
      if (spent.length) {
        kids.push(EN.ui.sectionTitle("Held events spent this Downtime"));
        spent.forEach(function (x) {
          var c = x.c;
          var k2 = [el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
            el("span", { style: { fontWeight: 600 }, text: c.source }),
            el("span.help", { style: { margin: 0 }, text: bandTitle(c.band) + DOT + "held from Downtime " + x.dt.n }),
            btn("PUT IT BACK", "unspend", function () {
              mutateCheck(x.dt.id, c.id, function (ck) { ck.spentIn = null; ck.spentAt = null; });
              EN.app.render();
            })
          ])].concat(eventCard(x.dt, c, b, { spent: true }));
          kids.push(el("div.feature", { dataset: { heatSpent: c.id }, style: { borderLeftColor: "var(--gold)" } }, k2));
        });
      }
      if (cur.quiet) {
        kids.push(help("No source acted this Downtime. Lying low cools every source this month (Cooling Off, below).", { margin: "8px 0 0", color: "var(--success)" }));
      } else if (!acted.length) {
        kids.push(help("Nothing acted.", { margin: "8px 0 0" }));
      }
    }
    kids.push(fold("guidelines", B.check.guidelinesLead.replace(/:$/, ""), function () {
      return B.check.guidelines.map(function (g) {
        return el("p.help", { style: { margin: "0 0 6px" } }, [
          el("span", { style: { fontWeight: 600, color: "var(--text)" }, text: g.name + " " }), document.createTextNode(g.text)
        ]);
      });
    }));
    var tag = cur ? "DOWNTIME " + cur.n + DOT + (cur.checks || []).filter(function (c) { return c && c.triggered; }).length + " ACTED"
                  : B.check.die.toUpperCase() + " PER SOURCE";
    return EN.ui.panel(B.check.name, tag, kids, { glow: !!cur && !cur.quiet });
  }

  /* ---- held events ------------------------------------------------------------ */
  function heldList() {
    return allChecks().filter(function (x) { return x.c.event && x.c.held && !x.c.spentIn && !x.c.dropped; })
      .sort(function (a, b) { return ((a.dt.n || 0) - (b.dt.n || 0)) || ((a.dt.at || 0) - (b.dt.at || 0)); });
  }
  function heldPanel(b) {
    var cur = b.current, items = heldList(), kids = [];
    var wait = H().check.guidelines.filter(function (g) { return g.key === "canWait"; })[0];
    if (!items.length) {
      kids.push(help(wait ? wait.name + " " + wait.text + " HOLD FOR LATER on an event keeps it here." : "No events held.", { margin: 0 }));
    }
    items.forEach(function (x) {
      var c = x.c, isCur = !!cur && x.dt.id === cur.id;
      // one event per source per Downtime: a held event cannot join a Downtime where its source already has one
      var clash = cur ? eventHere(cur, canon(b.state, c.key), b.state) : null;
      var acts = [];
      if (isCur) {
        acts.push(btn("PLAY IT NOW", "unhold", function () {
          mutateCheck(x.dt.id, c.id, function (ck) { ck.held = false; });
          EN.app.render();
        }, { disabled: !!clash, title: clash ? "One event per source per Downtime: " + c.source + " already has one this Downtime." : "" }));
      } else if (cur) {
        acts.push(btn("SPEND IT THIS DOWNTIME", "spend", function () {
          mutateCheck(x.dt.id, c.id, function (ck) { ck.spentIn = cur.id; ck.spentAt = Date.now(); });
          toast(c.source + "'s held event lands this Downtime.");
          EN.app.render();
        }, { primary: !clash, disabled: !!clash,
             title: clash ? "One event per source per Downtime: " + c.source + " already has one in Downtime " + cur.n + "." : "Play it in Downtime " + cur.n }));
      }
      acts.push(arm("heat:drop:" + c.id, "drop", { label: "DROP", armedLabel: "DROP IT?",
        armedTitle: "Drops this held event. It stays in the log as dropped.",
        onConfirm: function () {
          mutateCheck(x.dt.id, c.id, function (ck) { ck.dropped = true; });
          EN.app.render();
        } }));
      kids.push(el("div.feature", { dataset: { heatHeld: c.id }, style: { borderLeftColor: "var(--gold)" } }, [
        el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
          el("span", { style: { fontWeight: 600 }, text: c.source }),
          chip(bandTitle(c.band).toUpperCase(), bandColor(c.band)),
          el("span.help", { style: { margin: 0 }, text: "held from Downtime " + x.dt.n + DOT + "d6 " + c.event.n })
        ]),
        el("p", { style: { margin: "4px 0 0", fontSize: "13.5px" }, text: c.event.text }),
        clash ? help("One event per source per Downtime: " + c.source + " already has one this Downtime.", { margin: "4px 0 0", color: "var(--warn)" }) : null,
        el("div.row.wrap", { style: { gap: "8px", marginTop: "6px" } }, acts)
      ]));
    });
    return EN.ui.panel("Held Events", items.length + " WAITING", kids);
  }

  /* ---- the Bounty -------------------------------------------------------------
     Posted when a source reaches Heat 9, priced per Freelancer as a Solo of
     the Grade matching their Caliber, at a rate of 3 to 5 per XP (the middle by
     default, as Payroll does), alive doubled, and doubled again when the Order
     raises it. It comes down when the source pulls it, the crew's Heat with it
     falls below 7, or someone pays the full kill price to cancel it. */
  function postBounty(key) {
    var B = H(), b = board(), s = sourceOn(b, key);
    if (!s || bountyFor(key, b.state)) return null;
    var hot = s.holders.filter(function (h) { return h.value >= B.bounty.postsAt; });
    var targets = (hot.length ? hot : s.holders).map(function (h) { return { charId: h.charId, name: h.name, caliber: h.caliber }; });
    var cur = b.current;
    var id = gm.put("heat", { kind: "bounty", key: s.key, source: s.name, status: "up", postedAt: Date.now(),
      postedIn: cur ? cur.n : null, targets: targets, rate: Math.round((B.bounty.perXpLow + B.bounty.perXpHigh) / 2),
      aliveOnly: false, raised: false, takenBy: "", flawAt: null });
    _board = null;
    toast(id ? s.name + " posts a Bounty on the Exchange." : "The Bounty could not be saved.");
    return id;
  }
  function priceRow(cal) {
    var rows = H().bounty.rows, c = clampCal(cal == null ? crewNow().caliber : cal);
    return rows.filter(function (r) { return r.caliber === c; })[0] || rows[0];
  }
  function rateOf(r) {
    var B = H().bounty, n = Number(r.rate);
    return (n >= B.perXpLow && n <= B.perXpHigh) ? Math.round(n) : Math.round((B.perXpLow + B.perXpHigh) / 2);
  }
  function priceOf(r, t) {
    var B = H().bounty, row = priceRow(t.caliber), rate = rateOf(r), mult = r.raised ? 2 : 1;
    var kill = row.xp * rate * mult;
    return { row: row, rate: rate, mult: mult, kill: kill, alive: kill * B.aliveMult };
  }
  function cancelPrice(r) {
    return (r.targets || []).reduce(function (a, t) { return a + priceOf(r, t).kill; }, 0);
  }
  function postingText(r) {
    var B = H().bounty, out = [];
    out.push("BOUNTY on the Hazard Contractors' Exchange, posted by " + r.source + (r.raised ? ", price doubled" : "") + ".");
    (r.targets || []).forEach(function (t) {
      var p = priceOf(r, t);
      out.push(t.name + ", Caliber " + p.row.caliber + " (counts as " + p.row.countsAs + "): " +
        (r.aliveOnly ? "alive only, " + fmtG(p.alive) : "kill " + fmtG(p.kill) + ", alive " + fmtG(p.alive)) + ".");
    });
    if (String(r.takenBy || "").trim()) out.push("Taken by: " + String(r.takenBy).trim() + ".");
    out.push("Cancelling it costs the full kill price: " + fmtG(cancelPrice(r)) + ".");
    if (r.flawAt) out.push("The Exchange's lawyers found a flaw in the posting: it buys " + B.flawBuys + ".");
    return out.join("\n");
  }
  function retire(r, reason, paid) {
    mutateRec(r.id, function (x) {
      x.status = "down"; x.endedAt = Date.now(); x.endReason = reason;
      if (paid) x.cancelPaid = paid;
    });
  }
  function bountyCard(r, b) {
    var B = H().bounty, crew = b.crew, s = sourceOn(b, canon(b.state, r.key));
    var held = s ? s.held : 0, kids = [];
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
      el("span", { style: { fontWeight: 600 }, text: r.source }),
      chip("UP", "var(--danger)"),
      r.raised ? chip("RAISED x2", "var(--danger)") : null,
      r.flawAt ? chip("A FLAW: IT BUYS " + B.flawBuys.toUpperCase(), "var(--gold)") : null,
      el("span.help", { style: { margin: 0 }, text: "posted " + fmtDay(r.postedAt) + (r.postedIn ? ", Downtime " + r.postedIn : "") +
        DOT + "Heat now " + held })
    ]));
    /* who is on the posting: the crew, each a chip, and after them anyone on
       it who is no longer in the crew (a deleted record, or not among the
       Table's crew rows), each a chip that only takes them off: they are still
       priced and still in the cancel price until the GM does. */
    kids.push(fieldHead("ON THE POSTING"));
    var inIds = (r.targets || []).map(function (t) { return t.charId; });
    var crewIds = crew.members.map(function (m) { return m.charId; });
    var gone = (r.targets || []).filter(function (t) { return isObj(t) && crewIds.indexOf(t.charId) === -1; });
    function offPosting(id) {
      mutateRec(r.id, function (x) { x.targets = (x.targets || []).filter(function (t) { return t.charId !== id; }); });
    }
    kids.push(el("div.row.wrap", { style: { gap: "6px" } }, crew.members.map(function (m) {
      var on = inIds.indexOf(m.charId) !== -1;
      return el("span.chip" + (on ? ".on" : ""), { dataset: { heatTarget: m.charId }, style: { cursor: "pointer", fontSize: "10.5px" },
        onclick: function () {
          mutateRec(r.id, function (x) {
            x.targets = (x.targets || []).filter(function (t) { return t.charId !== m.charId; });
            if (!on) x.targets.push({ charId: m.charId, name: m.name, caliber: m.caliber });
          });
          EN.app.render();
        } }, (on ? "✓ " : "") + m.name);
    }).concat(gone.map(function (t) {
      return el("span.chip.on", { dataset: { heatTarget: String(t.charId), heatGone: "1" }, style: { cursor: "pointer", fontSize: "10.5px" },
        title: "No longer in the crew. Tap to take them off the posting.",
        onclick: function () { offPosting(t.charId); EN.app.render(); } }, "✓ " + String(t.name || "Target") + " (NOT IN THE CREW)");
    }))));
    if (gone.length) {
      kids.push(help(gone.map(function (t) { return String(t.name || "Target"); }).join(", ") + (gone.length === 1 ? " is" : " are") +
        " on the posting but no longer in the crew, and still priced below. Tap " + (gone.length === 1 ? "the chip" : "a chip") +
        " to take them off.", { margin: "6px 0 0", color: "var(--warn)" }));
    }
    var rates = [];
    for (var rt = B.perXpLow; rt <= B.perXpHigh; rt++) rates.push(rt);
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "8px" } }, rates.map(function (n) {
      var on = n === rateOf(r);
      return el("span.chip" + (on ? ".on" : ""), { dataset: { heatRate: String(n) }, style: { cursor: "pointer", fontSize: "10.5px" },
        onclick: function () { mutateRec(r.id, function (x) { x.rate = n; }); EN.app.render(); } }, G + n + " / XP");
    }).concat([
      el("span.chip" + (r.aliveOnly ? ".on" : ""), { dataset: { heat: "alive" }, style: { cursor: "pointer", fontSize: "10.5px" },
        title: B.after[1],
        onclick: function () { mutateRec(r.id, function (x) { x.aliveOnly = !x.aliveOnly; }); EN.app.render(); } },
        (r.aliveOnly ? "✓ " : "") + "ALIVE ONLY"),
      el("span.chip" + (r.raised ? ".on" : ""), { dataset: { heat: "raised" }, style: { cursor: "pointer", fontSize: "10.5px" },
        title: "The Order's row 1: double the posted price",
        onclick: function () { mutateRec(r.id, function (x) { x.raised = !x.raised; }); EN.app.render(); } },
        (r.raised ? "✓ " : "") + "RAISED x2")
    ])));
    var nexus = false;
    if (!(r.targets || []).length) kids.push(help("Nobody is on the posting. Tap the crew above to put them on it.", { margin: "8px 0 0", color: "var(--warn)" }));
    (r.targets || []).forEach(function (t) {
      var p = priceOf(r, t);
      if ((r.aliveOnly ? p.alive : Math.max(p.kill, p.alive)) > B.nexusAbove) nexus = true;
      kids.push(el("div.row.between.wrap", { dataset: { heatPrice: t.charId }, style: { gap: "8px", padding: "5px 0", borderBottom: "1px solid var(--border)" } }, [
        el("span", { style: { flex: "1 1 200px", minWidth: "0" } }, [
          el("span", { style: { fontWeight: 600 }, text: t.name }),
          el("span.help", { style: { margin: "0 0 0 6px" }, text: "Caliber " + p.row.caliber + ", counts as " + p.row.countsAs +
            DOT + "the book: " + p.row.kill + " kill, " + p.row.alive + " alive" })
        ]),
        el("span.mono", { style: { fontSize: "12.5px", color: "var(--danger)" },
          text: r.aliveOnly ? "ALIVE " + fmtG(p.alive) : "KILL " + fmtG(p.kill) + DOT + "ALIVE " + fmtG(p.alive) })
      ]));
    });
    if (nexus) kids.push(help(B.after[0], { margin: "6px 0 0", color: "var(--gold)" }));
    kids.push(help("Cancelling it costs the full kill price: " + fmtG(cancelPrice(r)) + ", paid by the crew or by someone who owes them a great deal.", { margin: "6px 0 0" }));
    // who took it: typed, kept as typed, never a re-render (F19)
    kids.push(el("div.field", { style: { margin: "8px 0 0" } }, [
      el("label.fl", { text: "Taken by" }),
      el("input", { type: "text", value: r.takenBy || "", dataset: { heat: "taken" }, placeholder: "a rival crew, a Ringer, a familiar van",
        style: { width: "100%" },
        oninput: function (e) {
          var v = e.target.value, live = gm.rec("heat", r.id);
          if (!live) return;
          var c2 = copy(live);
          c2.takenBy = v;
          gm.put("heat", c2, { silent: true });
          _board = null;
        } })
    ]));
    kids.push(help(B.whoTakesIt.text, { margin: "4px 0 0", color: "var(--text3)" }));
    if (held < B.endsBelow) {
      kids.push(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [
        el("span.help", { style: { margin: 0, color: "var(--warn)", flex: "1 1 200px", minWidth: "0" },
          text: "The crew's Heat with " + r.source + " is " + held + ", below " + B.endsBelow + ": the posting comes down." }),
        arm("heat:retire:" + r.id, "retire", { cls: ".btn.sm.primary", label: "RETIRE IT", armedLabel: "RETIRE IT?",
          armedTitle: "Takes the Bounty down. It stays in the list below as retired.",
          onConfirm: function () { retire(r, "below"); toast("The Bounty on the crew comes down."); EN.app.render(); } })
      ]));
    }
    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
      btn("COPY THE POSTING", "copy-bounty", function () { copyText(postingText(r), "The posting"); }),
      r.flawAt
        ? btn("THE WEEK IS UP", "flaw", function () { mutateRec(r.id, function (x) { x.flawAt = null; }); EN.app.render(); })
        : btn("FLAW FOUND", "flaw", function () { mutateRec(r.id, function (x) { x.flawAt = Date.now(); }); EN.app.render(); },
            { title: "The Exchange's lawyers find a flaw in the posting, for a fee: it buys " + B.flawBuys }),
      arm("heat:pulled:" + r.id, "pulled", { cls: ".btn.sm", label: "PULLED BY THE SOURCE", armedLabel: "PULLED?",
        armedTitle: "The source pulls its posting. Click again to confirm.",
        onConfirm: function () { retire(r, "pulled"); EN.app.render(); } }),
      arm("heat:cancel:" + r.id, "cancel", { cls: ".btn.sm", label: "CANCELLED", armedLabel: "CANCELLED FOR " + fmtG(cancelPrice(r)) + "?",
        armedTitle: "Someone paid the Exchange the full kill price to cancel it. Click again to confirm.",
        onConfirm: function () { retire(r, "cancelled", cancelPrice(r)); EN.app.render(); } })
    ]));
    return el("div.feature", { dataset: { heatBounty: r.id }, style: { borderLeftColor: "var(--danger)" } }, kids);
  }
  function bountyPanel(b) {
    var B = H().bounty, kids = [];
    kids.push(help(B.text, { margin: "0 0 4px" }));
    kids.push(help(B.price.text, { margin: "0 0 10px", color: "var(--text2)" }));
    var all = recsOf("bounty");
    var up = all.filter(function (r) { return r.status === "up"; }), down = all.filter(function (r) { return r.status !== "up"; });
    var due = b.sources.filter(function (s) { return s.held >= B.postsAt && !s.bounty && s.holders.length; });
    due.forEach(function (s) {
      kids.push(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", margin: "0 0 8px" } }, [
        el("span.help", { style: { margin: 0, color: "var(--danger)" }, text: s.name + " is at Heat " + s.held + " and has no Bounty up." }),
        btn("POST THE BOUNTY", "post-bounty", function () { postBounty(s.key); EN.app.render(); }, { primary: true })
      ]));
    });
    if (!up.length && !due.length) kids.push(help("No Bounty is up. A source posts one the moment it reaches Heat " + B.postsAt + ".", { margin: "0 0 8px" }));
    up.forEach(function (r) { kids.push(bountyCard(r, b)); });
    if (down.length) {
      kids.push(EN.ui.sectionTitle("Retired"));
      var why = { below: "Heat fell below " + B.endsBelow, pulled: "pulled by the source", cancelled: "cancelled" };
      down.forEach(function (r) {
        kids.push(el("div.row.between.wrap", { dataset: { heatRetired: r.id }, style: { gap: "8px", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)" } }, [
          el("span.help", { style: { margin: 0, flex: "1 1 200px", minWidth: "0" }, text: r.source + DOT + (why[r.endReason] || "retired") +
            (r.cancelPaid ? " for " + fmtG(r.cancelPaid) : "") + DOT + fmtDay(r.endedAt) }),
          arm("heat:bdel:" + r.id, "bounty-del", { label: "DELETE", armedLabel: "DELETE?", armedTitle: "Removes this retired Bounty from the list.",
            onConfirm: function () { gm.drop("heat", r.id); _board = null; EN.app.render(); } })
        ]));
      });
    }
    kids.push(fold("bounty-table", "The price by Caliber", function () {
      return B.rows.map(function (row) {
        return el("div.row.between.wrap", { style: { gap: "8px", padding: "4px 0", borderBottom: "1px solid var(--border)" } }, [
          el("span", { style: { fontSize: "13px" }, text: "Caliber " + row.caliber + DOT + row.countsAs }),
          el("span.mono", { style: { fontSize: "12px" }, text: row.kill + " kill" + DOT + row.alive + " alive" })
        ]);
      }).concat(B.after.map(function (t) { return help(t, { margin: "6px 0 0" }); }));
    }));
    kids.push(fold("bounty-down", B.takingItDown.name.replace(/\.$/, ""), function () { return [help(B.takingItDown.text, { margin: 0 })]; }));
    return EN.ui.panel(B.name, up.length + " UP", kids);
  }

  /* ---- writes to the crew's records -------------------------------------------
     Both forms below write through writeCrew op "heat", one write per
     Freelancer, all of one APPLY sharing a `batch` tag, so UNDO takes the
     whole apply back while its newest write is still the newest standing. */
  function picked(map, id, dflt) { return own(map, id) ? !!map[id] : dflt; }
  function heatTarget() {
    var u = null;
    try { u = gm.undoable ? gm.undoable() : null; } catch (e) { u = null; }
    return (u && isObj(u.meta) && u.meta.source === "heat" && u.meta.batch) ? u : null;
  }
  function undoBatch() {
    var u = heatTarget();
    if (!u) { toast("Nothing left to undo."); EN.app.render(); return; }
    var batch = u.meta.batch, names = [], stuck = false;
    while ((u = gm.undoable()) && isObj(u.meta) && u.meta.source === "heat" && u.meta.batch === batch) {
      var r = gm.undoLast();
      if (!r) { stuck = true; break; }
      names.push(r.charName || "a Freelancer");
    }
    toast((names.length ? "Undone on " + names.join(", ") + "." : "Nothing was undone.") +
      (stuck ? " The browser refused a save, so the rest is still in place." : ""));
    EN.app.render();
  }
  function undoBar(kinds) {
    var u = heatTarget();
    if (!u || kinds.indexOf(u.meta.kind) === -1) return null;
    var ws = gm.liveWrites ? gm.liveWrites(function (w) { return isObj(w.meta) && w.meta.batch === u.meta.batch; }) : [u];
    var who = ws.map(function (w) { return w.charName || "a Freelancer"; });
    return el("div.row.between.wrap", { dataset: { heat: "undo-bar" }, style: { gap: "8px", alignItems: "center", marginTop: "10px",
      padding: "6px 8px", border: "1px dashed var(--warn)", borderRadius: "3px" } }, [
      el("span.help", { style: { margin: 0, flex: "1 1 200px", minWidth: "0" }, text: "Standing: " + u.label + " on " + who.join(", ") + "." }),
      arm("heat:undo:" + u.id, "undo-heat", { cls: ".btn.sm", label: "UNDO", armedLabel: "UNDO IT?",
        title: "Take this back off " + who.join(", "),
        armedTitle: "Puts the Heat back exactly as it was on " + who.join(", ") + ". Click again to confirm.",
        onConfirm: undoBatch })
    ]);
  }
  function applyPlan(plan, how) {
    if (!plan.lines.length) return;
    var batch = lid("hb_"), cur = current(), writes = [], failed = [];
    var meta = { source: "heat", kind: how, method: plan.method, key: plan.key, batch: batch, downtimeId: cur ? cur.id : null };
    plan.lines.forEach(function (ln) {
      var w = gm.writeCrew(ln.charId, plan.label, ln.ops, meta);
      if (w) writes.push({ id: w, charId: ln.charId, name: ln.name });
      else failed.push(ln.name);
    });
    if (writes.length) {
      gm.put("heat", { kind: "change", at: Date.now(), batch: batch, how: how, method: plan.method, methodName: plan.methodName,
        key: plan.key, source: plan.source, amount: plan.amount, text: plan.text, downtimeId: cur ? cur.id : null, writes: writes });
    }
    _board = null;
    toast((writes.length ? plan.label + " written to " + writes.map(function (w) { return w.name; }).join(", ") + "." : "Nothing was written.") +
      (failed.length ? " Not written: " + failed.join(", ") + "." : ""));
    EN.app.render();
  }

  /* COOLING OFF. Lie low takes 1 from every source a Freelancer holds, and only
     after a Downtime whose check came up empty. The rest take the method's
     number off one source, from each Freelancer picked who holds it: a legal
     scrub 2 on a Flawless Success, an intervention 1 to 3, a bigger fish up to
     half the source's Heat. Hidden Heat is never touched: it has no holders. */
  function coolable(b) { return b.sources.filter(function (s) { return s.holders.some(function (h) { return h.value > 0; }); }); }
  function coolAmounts(m, s) {
    var out = [], i;
    if (m.key === "intervention") {
      for (i = m.drop.low; i <= m.drop.high; i++) out.push(i);
      return out;
    }
    if (m.key === "biggerFish") {
      var half = Math.floor((s ? s.held : 0) / 2);
      for (i = 1; i <= half; i++) out.push(i);
      return out;
    }
    return null;
  }
  function coolAmount(m, s) {
    if (m.key === "legalScrub") return _h.cool.flawless ? m.flawlessDrop : m.drop.low;
    var opts = coolAmounts(m, s);
    if (opts) return opts.indexOf(_h.cool.amount) !== -1 ? _h.cool.amount : (opts[opts.length - 1] || 0);
    return m.drop ? m.drop.low : 0;
  }
  /* Lying low is once a month: the Freelancers whose lie-low write for
     Downtime `cur` still stands, as charId -> name. Read from the ledger
     (each APPLY tags its writes with the method and the Downtime), so
     deleting the log line does not open the month again; an UNDO does. A
     second APPLY for the same quiet month passes them over instead of taking
     another 1 off every source. */
  function lieLowDone(cur) {
    var done = Object.create(null);
    if (!cur) return done;
    gm.list("ledger").forEach(function (w) {
      if (!isObj(w) || w.kind !== "write" || w.undone || !isObj(w.meta) || typeof w.charId !== "string") return;
      if (w.meta.source !== "heat" || w.meta.method !== "lieLow" || w.meta.downtimeId !== cur.id || own(done, w.charId)) return;
      done[w.charId] = String(w.charName || "a Freelancer");
    });
    return done;
  }
  function coolPlan(b) {
    var C = H().cooling, st = _h.cool, m = coolRow(st.method) || C.rows[0], roster = rosterNow();
    var plan = { method: m.key, methodName: m.name, key: null, source: "", amount: 0, lines: [], why: "", label: "", text: "" };
    if (m.key === "lieLow") {
      var cur = b.current;
      if (!cur) { plan.why = "Run the Heat check first: lying low cools only after a month whose check came up empty."; return plan; }
      if (!cur.quiet) {
        var acted = (cur.checks || []).filter(function (c) { return c && c.triggered && !c.gmOnly; }).map(function (c) { return c.source; });
        plan.why = "The Heat check in Downtime " + cur.n + " did not come up empty" + (acted.length ? " (" + acted.join(", ") + " acted)" : "") +
          ", so lying low cools nothing this month.";
        return plan;
      }
      plan.amount = m.drop.low;
      var done = lieLowDone(cur), doneNames = [];
      b.crew.members.forEach(function (mem) {
        if (own(done, mem.charId)) { doneNames.push(mem.name || done[mem.charId]); return; }
        if (!picked(st.pick, mem.charId, true)) return;
        var ch = own(roster, mem.charId) ? roster[mem.charId] : null;
        var rows = (ch && isObj(ch.face) && Array.isArray(ch.face.heat)) ? ch.face.heat : [];
        var best = Object.create(null), order = [];
        rows.forEach(function (r) {
          if (!isObj(r)) return;
          var raw = typeof r.source === "string" ? r.source.trim() : "", k = heatKey(raw), v = heatVal(r.value);
          if (!raw || v <= 0) return;
          if (!own(best, k)) order.push(k);
          if (!own(best, k) || v > best[k].value) best[k] = { source: raw, value: v };
        });
        if (!order.length) return;
        plan.lines.push({ charId: mem.charId, name: mem.name,
          ops: order.map(function (k) { return { op: "heat", source: best[k].source, delta: -plan.amount }; }),
          steps: order.map(function (k) { return { source: best[k].source, from: best[k].value, to: Math.max(0, best[k].value - plan.amount) }; }) });
      });
      plan.label = "Heat: Lie low, every source -" + plan.amount;
      plan.text = "Cooling Off, " + m.name + ": " + m.does + ".\n" + plan.lines.map(function (l) {
        return l.name + ": " + l.steps.map(function (x) { return x.source + " " + x.from + " to " + x.to; }).join(", ") + ".";
      }).join("\n");
      if (doneNames.length) {
        plan.why = "Already cooled for Downtime " + cur.n + ": " + doneNames.join(", ") + (doneNames.length === 1 ? " has" : " have") +
          " lain low this month. Lying low takes 1 Heat with every source, once a month.";
      } else if (!plan.lines.length) plan.why = "Nobody picked holds any Heat.";
      return plan;
    }
    var list = coolable(b);
    var s = sourceOn(b, st.key);
    if (!s || list.indexOf(s) === -1) s = list[0] || null;
    if (!s) { plan.why = "No crew record holds any Heat to cool."; return plan; }
    plan.key = s.key; plan.source = s.name;
    plan.amount = coolAmount(m, s);
    if (!plan.amount) { plan.why = "Half of Heat " + s.held + " is less than 1: a bigger fish takes nothing off it."; return plan; }
    s.holders.forEach(function (h) {
      if (h.value <= 0 || !picked(st.pick, h.charId, true)) return;
      plan.lines.push({ charId: h.charId, name: h.name, ops: [{ op: "heat", source: h.source, delta: -plan.amount }],
        steps: [{ source: h.source, from: h.value, to: Math.max(0, h.value - plan.amount) }] });
    });
    plan.label = "Heat: " + m.name + ", " + s.name + " -" + plan.amount;
    plan.text = "Cooling Off, " + m.name + ": Heat with " + s.name + " drops by " + plan.amount + ".\n" + plan.lines.map(function (l) {
      return l.name + ": " + l.steps[0].source + " " + l.steps[0].from + " to " + l.steps[0].to + ".";
    }).join("\n");
    if (!plan.lines.length) plan.why = "Nobody picked holds Heat with " + s.name + ".";
    return plan;
  }
  // a new method or source starts the form over: its picks were for the old one
  function coolReset() {
    _h.cool.amount = 1;
    _h.cool.flawless = false;
    _h.cool.pick = Object.create(null);
    EN.ui.disarm();
  }
  function coolPanel(b) {
    var C = H().cooling, st = _h.cool, kids = [];
    var m = coolRow(st.method) || C.rows[0];
    kids.push(help(C.intro, { margin: "0 0 8px" }));
    kids.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "6px" } }, C.rows.map(function (r) {
      var on = r.key === m.key;
      return el("span.chip" + (on ? ".on" : ""), { dataset: { heatMethod: r.key }, style: { cursor: "pointer", fontSize: "10.5px" },
        onclick: function () { coolReset(); _h.cool.method = r.key; EN.app.render(); } }, r.name);
    })));
    kids.push(el("div.row.wrap", { style: { gap: "12px", alignItems: "flex-start" } }, [
      el("div", { style: { flex: "1 1 220px", minWidth: "0" } }, [fieldHead(C.columns[1]), help(m.costs, { margin: 0 })]),
      el("div", { style: { flex: "1 1 220px", minWidth: "0" } }, [fieldHead(C.columns[2]), help(m.does, { margin: 0 })])
    ]));
    var plan = coolPlan(b);
    var s = plan.key ? sourceOn(b, plan.key) : null;
    if (m.key !== "lieLow") {
      var list = coolable(b);
      if (list.length) {
        var ctl = [el("div.field", { style: { margin: 0, flex: "1 1 200px", minWidth: "0" } }, [
          el("label.fl", { text: "Source" }),
          el("select", { dataset: { heat: "cool-source" }, style: { width: "100%" },
            onchange: function (e) { coolReset(); _h.cool.key = e.target.value; EN.app.render(); } },
            list.map(function (x) { return el("option", { value: x.key, selected: !!s && x.key === s.key }, x.name + " (Heat " + x.held + ")"); }))
        ])];
        var amts = coolAmounts(m, s);
        if (amts && amts.length) {
          ctl.push(el("div.field", { style: { margin: 0 } }, [
            el("label.fl", { text: "Heat off" }),
            el("select", { dataset: { heat: "cool-amount" }, style: { width: "auto" },
              onchange: function (e) { _h.cool.amount = Number(e.target.value) || 1; EN.ui.disarm(); EN.app.render(); } },
              amts.map(function (n) { return el("option", { value: String(n), selected: n === plan.amount }, String(n)); }))
          ]));
        }
        if (m.key === "legalScrub") {
          ctl.push(el("span.chip" + (st.flawless ? ".on" : ""), { dataset: { heat: "flawless" }, style: { cursor: "pointer", fontSize: "10.5px" },
            onclick: function () { _h.cool.flawless = !_h.cool.flawless; EN.ui.disarm(); EN.app.render(); } },
            (st.flawless ? "✓ " : "") + "FLAWLESS SUCCESS (" + m.flawlessDrop + ")"));
        }
        kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "10px" } }, ctl));
        // the book's two cautions: a Mixed Result on money, and a gang or a shrine rarely taking it
        var money = m.key === "bribe" || m.key === "dataScrub";
        if (s && s.row && money && C.moneyRarelyWorks.indexOf(s.row.key) !== -1) {
          kids.push(help("Heat with " + s.row.name.toLowerCase() + " rarely responds to money. " + (s.row.cooling || ""), { margin: "6px 0 0", color: "var(--warn)" }));
        }
        var mixed = (String(C.after[0]).match(/Bribes and scrubs[^.]*\./) || [""])[0];
        if (money && mixed) kids.push(help(mixed, { margin: "4px 0 0", color: "var(--text3)" }));
        if (s && s.band && m.key === "bribe") kids.push(help(s.name + " is at Heat " + s.held + " (" + s.band.heat + "): price the bribe tier for that band.", { margin: "4px 0 0" }));
      }
    }
    // who it cools: everyone who holds it, picked by default
    var who = [];
    if (m.key === "lieLow") {
      var roster = rosterNow(), lain = lieLowDone(b.current);
      who = b.crew.members.filter(function (mem) {
        if (own(lain, mem.charId)) return false;
        var ch = own(roster, mem.charId) ? roster[mem.charId] : null;
        return ch && isObj(ch.face) && Array.isArray(ch.face.heat) && ch.face.heat.some(function (r) { return isObj(r) && heatVal(r.value) > 0; });
      }).map(function (mem) { return { charId: mem.charId, name: mem.name }; });
    } else if (s) {
      who = s.holders.filter(function (h) { return h.value > 0; }).map(function (h) { return { charId: h.charId, name: h.name + " " + h.value }; });
    }
    // lying low picks nobody until the month's check has come up empty
    if (who.length && (m.key !== "lieLow" || (b.current && b.current.quiet))) {
      kids.push(fieldHead("WHO IT COOLS"));
      kids.push(el("div.row.wrap", { style: { gap: "6px" } }, who.map(function (w) {
        var on = picked(st.pick, w.charId, true);
        return el("span.chip" + (on ? ".on" : ""), { dataset: { heatPick: w.charId }, style: { cursor: "pointer", fontSize: "10.5px" },
          onclick: function () { _h.cool.pick[w.charId] = !on; EN.ui.disarm(); EN.app.render(); } }, (on ? "✓ " : "") + w.name);
      })));
    }
    if (plan.why) kids.push(help(plan.why, { margin: "8px 0 0", color: "var(--warn)" }));
    if (plan.lines.length) {
      kids.push(fieldHead("WHAT IT WRITES"));
      kids.push(textBox("cool", plan.text));
      kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
        arm("heat:cool", "cool-apply", { cls: ".btn.sm.primary", label: "APPLY", armedLabel: "WRITE TO " + plan.lines.length + (plan.lines.length === 1 ? " RECORD?" : " RECORDS?"),
          title: "Write this to the crew's records",
          armedTitle: "Lowers Heat on " + plan.lines.map(function (l) { return l.name; }).join(", ") + ". UNDO takes it back. Click again to confirm.",
          onConfirm: function () { applyPlan(coolPlan(board()), m.key === "lieLow" ? "lielow" : "cooling"); } }),
        btn("COPY", "cool-copy", function () { copyText(plan.text, "The Cooling Off lines"); })
      ]));
    }
    var ub = undoBar(["cooling", "lielow"]);
    if (ub) kids.push(ub);
    kids.push(fold("cooling-ref", "Every way down", function () {
      return C.rows.map(function (r) {
        return el("p.help", { style: { margin: "0 0 6px" } }, [
          el("span", { style: { fontWeight: 600, color: "var(--text)" }, text: r.name + ". " }),
          document.createTextNode(r.costs + ". " + r.does + ".")
        ]);
      }).concat(C.after.map(function (t) { return help(t, { margin: "6px 0 0" }); }));
    }));
    return EN.ui.panel(C.name, C.rows.length + " WAYS DOWN", kids);
  }

  /* ADD HEAT: Heat after a job, the Fallout step of the job. The GM picks who
     earned it, the source (one the board knows, or a new one typed), and how
     much; each Freelancer's row of that source rises, or a row is made. */
  function addPlan(b) {
    var st = _h.add, roster = rosterNow();
    var plan = { method: "add", methodName: "Heat after a job", key: null, source: "", amount: Number(st.amount) || 1, lines: [], why: "", label: "", text: "" };
    var s = st.key ? sourceOn(b, st.key) : null;
    var typed = String(st.typed || "").trim();
    var name = s ? s.name : typed;
    if (!name) { plan.why = "Pick a source, or type a new one."; return plan; }
    if (!s && b.state && b.sources.some(function (x) { return x.key === canon(b.state, heatKey(typed)); })) s = sourceOn(b, canon(b.state, heatKey(typed)));
    plan.key = s ? s.key : heatKey(typed);
    plan.source = s ? s.name : typed;
    b.crew.members.forEach(function (mem) {
      if (!picked(st.pick, mem.charId, false)) return;
      var h = s ? s.holders.filter(function (x) { return x.charId === mem.charId; })[0] : null;
      var from = h ? h.value : 0;
      if (!h) {
        // a typed name the record already holds under that spelling
        var ch = own(roster, mem.charId) ? roster[mem.charId] : null;
        var rows = (ch && isObj(ch.face) && Array.isArray(ch.face.heat)) ? ch.face.heat : [];
        rows.forEach(function (r) { if (isObj(r) && heatKey(r.source) === heatKey(name) && heatVal(r.value) >= from) { from = heatVal(r.value); h = { source: String(r.source).trim() }; } });
      }
      var src = h ? h.source : name;
      plan.lines.push({ charId: mem.charId, name: mem.name, ops: [{ op: "heat", source: src, delta: plan.amount }],
        steps: [{ source: src, from: from, to: Math.min(maxHeat(), from + plan.amount), made: !h }] });
    });
    plan.label = "Heat: +" + plan.amount + " " + plan.source;
    plan.text = "Heat after a job: +" + plan.amount + " with " + plan.source + ".\n" + plan.lines.map(function (l) {
      var x = l.steps[0];
      return l.name + ": " + x.source + " " + x.from + " to " + x.to + (x.made ? " (a new row)" : "") + ".";
    }).join("\n");
    if (!plan.lines.length) plan.why = "Pick who earned it.";
    return plan;
  }
  // the preview and the buttons under it, repainted in place while the source is typed
  function addActs(b) {
    var plan = addPlan(b), kids = [];
    if (plan.why) kids.push(help(plan.why, { margin: "8px 0 0", color: "var(--text3)" }));
    if (plan.lines.length) {
      kids.push(fieldHead("WHAT IT WRITES"));
      kids.push(textBox("add", plan.text));
      kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
        arm("heat:add", "add-apply", { cls: ".btn.sm.primary", label: "ADD HEAT", armedLabel: "WRITE TO " + plan.lines.length + (plan.lines.length === 1 ? " RECORD?" : " RECORDS?"),
          title: "Write this to the crew's records",
          armedTitle: "Raises Heat on " + plan.lines.map(function (l) { return l.name; }).join(", ") + ". UNDO takes it back. Click again to confirm.",
          onConfirm: function () { applyPlan(addPlan(board()), "add"); } }),
        btn("COPY", "add-copy", function () { copyText(addPlan(board()).text, "The Heat lines"); })
      ]));
    }
    return kids;
  }
  function addPanel(b) {
    var st = _h.add, kids = [];
    var known = b.sources.filter(function (s) { return !s.gmOnly; });
    if (st.key && !sourceOn(b, st.key)) st.key = "";
    kids.push(help("Heat after a job: who earned it, with whom, and how much. Each Freelancer's own row of that source rises, or the row is made.", { margin: "0 0 8px" }));
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
      el("div.field", { style: { margin: 0, flex: "1 1 200px", minWidth: "0" } }, [
        el("label.fl", { text: "Source" }),
        el("select", { dataset: { heat: "add-source" }, style: { width: "100%" },
          onchange: function (e) { _h.add.key = e.target.value; EN.ui.disarm(); EN.app.render(); } },
          [el("option", { value: "", selected: !st.key }, "A new source (type it)")].concat(known.map(function (s) {
            return el("option", { value: s.key, selected: s.key === st.key }, s.name);
          })))
      ]),
      st.key ? null : el("div.field", { style: { margin: 0, flex: "1 1 200px", minWidth: "0" } }, [
        el("label.fl", { text: "New source" }),
        el("input", { type: "text", value: st.typed, dataset: { heat: "add-typed" }, placeholder: "Kindred, South precinct, the Ashriders...",
          style: { width: "100%" },
          oninput: function (e) { _h.add.typed = e.target.value; EN.ui.disarm(); paintAdd(); } })
      ]),
      el("div.field", { style: { margin: 0 } }, [
        el("label.fl", { text: "Heat" }),
        el("select", { dataset: { heat: "add-amount" }, style: { width: "auto" },
          onchange: function (e) { _h.add.amount = Number(e.target.value) || 1; EN.ui.disarm(); EN.app.render(); } },
          [1, 2, 3, 4, 5].map(function (n) { return el("option", { value: String(n), selected: n === Number(st.amount) }, "+" + n); }))
      ])
    ]));
    kids.push(fieldHead("WHO EARNED IT"));
    if (!b.crew.members.length) kids.push(help("No crew records on this device.", { margin: 0 }));
    kids.push(el("div.row.wrap", { style: { gap: "6px" } }, b.crew.members.map(function (m) {
      var on = picked(st.pick, m.charId, false);
      return el("span.chip" + (on ? ".on" : ""), { dataset: { heatAddpick: m.charId }, style: { cursor: "pointer", fontSize: "10.5px" },
        onclick: function () { _h.add.pick[m.charId] = !on; EN.ui.disarm(); EN.app.render(); } }, (on ? "✓ " : "") + m.name);
    })));
    var acts = el("div", { dataset: { heat: "add-acts" } }, addActs(b));
    if (_paint) _paint.addActs = acts;
    kids.push(acts);
    var ub = undoBar(["add"]);
    if (ub) kids.push(ub);
    return EN.ui.panel("Add Heat", "AFTER A JOB", kids);
  }
  // a keystroke in the new source's name repaints the preview and the buttons, never the field (F19)
  function paintAdd() {
    if (!_paint || !_paint.addActs || !_paint.addActs.isConnected) return;
    _board = null;
    var node = _paint.addActs;
    EN.ui.clear(node);
    addActs(board()).forEach(function (k) { if (k) node.appendChild(k); });
    if (EN.ui.substituteCurrencyGlyphs) EN.ui.substituteCurrencyGlyphs(node);
  }

  /* ---- the Downtime log -----------------------------------------------------
     Downtimes and the Heat writes made from this tab, newest first. A write's
     standing is read off the ledger. The log's COPY leaves out every check
     hidden Heat had a part in: a source the crew holds no Heat with, or one
     whose hidden Heat stood above the crew's own. */
  function checkLine(c, dt) {
    var out = c.source + ", Heat " + c.effective + (c.carry ? " (+" + c.carry + " carried)" : "") + ": rolled " + c.roll + ", " +
      (c.triggered ? (c.always ? "acts (Heat 10 always does)" : "acts") : "quiet") + ".";
    if (c.event) {
      out += " " + bandTitle(c.band) + ", d6 " + c.event.n + ": " + c.event.text;
      if (c.held && c.spentIn) out += " (held, then spent)";
      else if (c.held && c.dropped) out += " (held, then dropped)";
      else if (c.held) out += " (held for later)";
    }
    var f = fightOf(c);
    if (f && !c.held) out += " Fight: " + diffName(f.difficulty) + ".";
    return out;
  }
  function downtimeText(dt) {
    var out = ["Downtime " + dt.n + " (" + fmtDay(dt.at) + ")" + (dt.crew ? ", crew Caliber " + dt.crew.caliber + ", " + plural(dt.crew.headcount || 0, "Freelancer") : "") + "."];
    (dt.checks || []).forEach(function (c) { if (isObj(c) && !c.gmOnly && !c.hiddenPart) out.push(checkLine(c, dt)); });
    spentInto(dt).forEach(function (x) { if (!x.c.gmOnly && !x.c.hiddenPart) out.push("Held from Downtime " + x.dt.n + ": " + x.c.source + ", " + x.c.event.text); });
    if (dt.quiet) out.push("No source acted.");
    return out.join("\n");
  }
  function changeState(r) {
    var ws = Array.isArray(r.writes) ? r.writes : [];
    var gone = ws.filter(function (w) { var L = gm.rec("ledger", w.id); return !L || L.undone; }).length;
    return !ws.length || gone === ws.length ? "undone" : gone ? "part" : "standing";
  }
  function logPanel() {
    var recs = recsOf("downtime").concat(recsOf("change"))
      .sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    var kids = [];
    if (!recs.length) kids.push(help("Nothing logged yet. Each Heat check and each Heat write from this tab is kept here.", { margin: 0 }));
    recs.forEach(function (r) {
      if (r.kind === "downtime") {
        var checks = (r.checks || []).filter(isObj), acted = checks.filter(function (c) { return c.triggered; });
        var open = !!_h.open["log:" + r.id];
        kids.push(el("div", { dataset: { heatLog: r.id }, style: { padding: "6px 0", borderBottom: "1px solid var(--border)" } }, [
          el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
            el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline", flex: "1 1 220px", minWidth: "0" } }, [
              el("span", { style: { fontWeight: 600 }, text: "Downtime " + r.n }),
              el("span.help", { style: { margin: 0 }, text: fmtDay(r.at) + DOT + plural(checks.length, "source") + " rolled" + DOT + acted.length + " acted" })
            ]),
            el("div.row.wrap", { style: { gap: "6px" } }, [
              btn(open ? "HIDE" : "VIEW", "log-view", function () { _h.open["log:" + r.id] = !open; EN.app.render(); }),
              btn("COPY", "log-copy", function () { copyText(downtimeText(r), "Downtime " + r.n); }),
              arm("heat:logdel:" + r.id, "log-del", { label: "DELETE", armedLabel: "DELETE?",
                armedTitle: "Removes this Downtime from the log, with its held events. Heat already written stays written.",
                onConfirm: function () { gm.drop("heat", r.id); _board = null; EN.app.render(); } })
            ])
          ]),
          open ? textBox("downtime", downtimeText(r)) : null
        ]));
      } else {
        var stt = changeState(r);
        kids.push(el("div.row.between.wrap", { dataset: { heatLog: r.id }, style: { gap: "8px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" } }, [
          el("div", { style: { flex: "1 1 220px", minWidth: "0" } }, [
            el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
              el("span", { style: { fontWeight: 600 }, text: (r.how === "add" ? "Add Heat" : "Cooling Off, " + (r.methodName || r.method)) }),
              chip(stt === "standing" ? "STANDING" : stt === "part" ? "PARTLY UNDONE" : "UNDONE",
                stt === "standing" ? "var(--success)" : "var(--text3)"),
              el("span.help", { style: { margin: 0 }, text: fmtDay(r.at) })
            ]),
            help(String(r.text || "").split("\n").slice(1).join(" "), { margin: "2px 0 0" })
          ]),
          el("div.row.wrap", { style: { gap: "6px" } }, [
            btn("COPY", "log-copy", function () { copyText(String(r.text || ""), "The Heat lines"); }),
            arm("heat:logdel:" + r.id, "log-del", { label: "DELETE", armedLabel: "DELETE?",
              armedTitle: "Removes this line from the log. The Heat it wrote stays written: UNDO is the way to take it back.",
              onConfirm: function () { gm.drop("heat", r.id); EN.app.render(); } })
          ])
        ]));
      }
    });
    return EN.ui.panel("Downtime Log", plural(recs.length, "ENTRY", "ENTRIES"), kids);
  }

  /* ---- the chapter, for reference ------------------------------------------- */
  function referencePanel() {
    var B = H(), kids = [];
    kids.push(fold("ref-ladder", B.ladder.name, function () {
      var out = [help(B.ladder.intro, { margin: "0 0 8px" })];
      B.ladder.rows.forEach(function (r) {
        out.push(el("div.feature", { style: { borderLeftColor: bandColor(r.key) } }, [
          el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
            el("span.mono", { style: { fontSize: "13px", color: bandColor(r.key) }, text: B.ladder.columns[0] + " " + r.heat }),
            el("span", { style: { fontWeight: 600 }, text: r.phbSays })
          ]),
          help(r.sends, { margin: "4px 0 0" }),
          help(B.ladder.columns[3] + ": " + r.fight, { margin: "3px 0 0", color: "var(--accent)" })
        ]));
      });
      B.ladder.after.forEach(function (t) { out.push(help(t, { margin: "6px 0 0" })); });
      return out;
    }));
    kids.push(fold("ref-events", B.events.name, function () {
      var out = [help(B.events.intro, { margin: "0 0 8px" })];
      B.events.bands.forEach(function (band) {
        out.push(el("div.feature", { style: { borderLeftColor: bandColor(band.key) } }, [
          el("div", { style: { fontWeight: 600, marginBottom: "4px" }, text: band.title })
        ].concat(band.rows.map(function (r) {
          return el("div.row", { style: { gap: "8px", alignItems: "baseline", margin: "3px 0" } }, [
            el("span.mono", { style: { fontSize: "12px", color: "var(--text3)", minWidth: "14px" }, text: String(r.n) }),
            el("span", { style: { fontSize: "13px", minWidth: "0" }, text: r.text })
          ]);
        }))));
      });
      return out;
    }));
    kids.push(fold("ref-sources", B.sources.name, function () {
      return [help(B.sources.intro, { margin: "0 0 8px" })].concat(B.sources.rows.map(function (r) {
        return el("div.feature", null, [
          el("div", { style: { fontWeight: 600 }, text: r.name }),
          help(B.sources.columns[1] + ": " + r.how, { margin: "4px 0 0" }),
          help(B.sources.columns[2] + ": " + r.sends, { margin: "3px 0 0", color: "var(--text2)" })
        ]);
      }));
    }));
    kids.push(fold("ref-intro", B.name, function () {
      return B.intro.map(function (t) { return help(t, { margin: "0 0 6px" }); })
        .concat([help(B.check.guidelines.filter(function (g) { return g.key === "territory"; }).map(function (g) { return g.name + " " + g.text; })[0] || "", { margin: 0 })]);
    }));
    return EN.ui.panel("The Chapter", "HEAT RESPONSE", kids);
  }

  /* ---- the tab ---------------------------------------------------------------- */
  function render(mount) {
    EN.ui.clear(mount);
    _crew = null;
    _board = null;
    _paint = {};
    var B = H();
    if (!B || !gm || typeof gm.list !== "function") {
      mount.appendChild(el("div", null, [heading("Heat", "// the downtime check"), undoStrip(),
        el("div.muted-box", { text: "Heat data did not load. Check app/data/gm_heat.js." })].filter(Boolean)));
      return;
    }
    var b = board();
    var gap = function () { return spacer(12); };
    mount.appendChild(el("div", null, [
      heading("Heat", "// the downtime check"),
      undoStrip(),
      el("p.help", { style: { margin: "-6px 0 14px", maxWidth: "860px" }, text: B.intro[1] }),
      boardPanel(b), gap(),
      checkPanel(b), gap(),
      heldPanel(b), gap(),
      bountyPanel(b), gap(),
      coolPanel(b), gap(),
      addPanel(b), gap(),
      logPanel(), gap(),
      referencePanel()
    ].filter(Boolean)));
  }

  return {
    render: render,
    // read only: the crew's Heat per source as this tab sees it, for any view that wants the same reading
    board: function () { _board = null; _crew = null; var b = board(); _board = null; _crew = null; return b; }
  };
})();
