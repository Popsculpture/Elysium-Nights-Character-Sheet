/* ===========================================================================
   ELYSIUM NIGHTS · Codex tab: the shared rules hub
   One rules library for both desktops. The Freelancer desktop reads it on the
   "codex" tab, the Admin desktop on "gmcodex", and every other tab links into
   it through a peek drawer, so a rule is written once and read everywhere.

   THE API. Nine chapter files and every crosslink build against exactly this,
   so it does not change shape without a contract change.

   ANCHORS
     "<panelId>" or "<panelId>/<entrySlug>", for example "rz-edge",
     "ref-conds/prone", "ref-actions/dash", "ref-cover/obscurement".
     slug(s)  lower case, "&" read as "and", every run of other characters one
              "-", no leading or trailing "-". An entry's slug is slug(name);
              when one slug repeats inside ONE panel build the later ones get
              "-2", "-3" in build order, skipping any slug already handed
              out ("Rank", "Rank 2", "Rank" gives rank, rank-2, rank-3), so
              no two entries share an anchor. Builds are deterministic, so
              anchors are stable. Anchors live in CODE only, never in a saved record.
     NAMED LINES (an extension the contract's examples need): a line of a
              ruleBlock's text written "- Name: text" (or with a bullet) is
              a sub-entry, "<panelId>/<slug(Name)>", so "ref-actions/dash"
              resolves to the Dash line of the Action entry. Sub-entries take
              their slugs after the build from what the real entries left
              free (a repeat gets -2, -3), so they never move a real entry's
              anchor. A peek shows the line as a small entry with its parent
              named; open() scrolls to and flashes the line.

   REGISTRY
     register({ id, title, order, audience, panels: [panel, ...] })
       a chapter. Chapters sort by order, then registration order. audience
       "both" or "gm"; a "gm" chapter exists on the Admin desktop only.
     addPanels(chapterId, [panel, ...])
       panels for a chapter another file registered (queued if that file has
       not run yet).
     panel: { id, title, tag, audience, order, build(ctx, kit), when }
       id      unique across the whole Codex, prefixed per chapter.
       tag     optional chip text, or a function(ctx) returning it.
       audience optional; a "gm" panel in a "both" chapter is Admin only.
       order   optional, sorts panels inside the chapter; a panel without one
               sorts after the ordered ones (it counts as 1000).
       build   returns an array of nodes (nested arrays and nulls are fine).
               Return [] when the data is missing and the panel is skipped:
               a collapsed panel with no `when` is checked against its index
               build (the ctx.indexing one has() already caches), so it never
               draws a header that opens onto nothing.
       when    OPTIONAL EXTENSION (not in the contract table): a cheap check,
               function () { return !!EN.someData; }. False skips the panel
               without building it at all; true trusts the panel to build,
               which keeps a collapsed panel from being built even for the
               index. An open panel whose build still comes back empty is
               dropped and closed, so it is never stuck open on nothing.
     ctx: { portal: "freelancer" | "admin", inPeek, indexing, active }
       active is the active record on the Freelancer desktop, else null. Read
       personalisation from ctx.active, never EN.store.active(), so the Admin
       Codex is never personalised. indexing is true while the search index or
       has() builds the panel: links come out as plain text then, with the
     same words the page shows.
     Panel bodies are LAZY: a collapsed panel's render build is never called
     by a normal render. The index that has() and the search read builds each
     panel once (ctx.indexing) and caches it until the registry changes or
     the active record is edited (any save, so a panel may personalise which
     entries exist by class, level or gear, not only their text).

   KIT (passed to build, also EN.codexView.kit)
     el                                  EN.ui.el
     ruleBlock(name, text, extra, opts)  an entry: .feature, h4 name, p text.
                                         opts.slug overrides the slug;
                                         opts.conditions links condition
                                         names; opts.linkify === false prints
                                         the text as is. Text goes through
                                         linkify.
     entry(slug, title, children, opts)  an addressable block of any nodes.
                                         slug falsy means slug(title).
                                         opts.tag (el tag, default "div"),
                                         opts.attrs (el attrs), opts.text (the
                                         text search reads; default the
                                         children's textContent).
     refTable(cols, rows, strongCols, opts)  the .sktable rule table. Cells
                                         go through linkify, one link per
                                         term per table; opts.linkify ===
                                         false prints them as is.
     proseBlock(text, opts)              lines that start with "-" become
                                         bullets; text goes through linkify.
     subTitle(label)                     a .section-title inside a panel.
     bullets(arr)                        a STRING: "• a\n• b", for
                                         ruleBlock text.
     link(anchor, label) / chip(anchor) / linkify(parent, text, opts)
     note(text, opts)                    the small italic footnote. opts.margin
                                         overrides its "0 0 8px".
     seeAlso(label, pairs)               a small italic line, label then a
                                         link per [anchor, label] pair joined
                                         by " · ", for pointers between
                                         panels.
     state(ctx)                          this desktop's Codex state, for a
                                         panel with its own collapsible entries
                                         or filter: open[anchor] true means
                                         expanded, filter[panelId] is the
                                         panel's filter string. open() sets
                                         open[panel] and open[entry] and
                                         clears filter[panel].

   NAVIGATION
     tabKey()   "codex" on the Freelancer desktop, "gmcodex" on Admin.
     has(a)     true when a resolves on the CURRENT desktop (a gm anchor is
                false on the Freelancer desktop, an empty panel is false).
     open(a)    expand the panel (and the entry; clear the panel's filter), go
                to this desktop's Codex tab with EN.app.gotoTab(tabKey()), then
                after the render (setTimeout 0) scroll the target to about
                140px from the top and flash it (.codex-flash, 1.6s). With the
                Codex tab off the rail (an unfiled Freelancer) it peeks
                instead. Returns false when a does not resolve.
     peek(a)    the drawer #codex-peek on document.body (outside #view, so a
                render keeps it): the entry, or the whole panel for a panel
                anchor, titled with chapter and panel. OPEN IN CODEX (only
                when the tab is on the rail) and CLOSE; Esc and the backdrop
                close it; a link inside swaps the drawer and offers BACK.
                It is a real modal: #os is inert while it is open and Tab
                wraps inside the card, so keyboard focus never lands on the
                page behind the backdrop.
                Right-side drawer on a wide screen, bottom sheet on a narrow
                one and on #GRIDroid. Hidden in print. Never a tab swipe.
     link(a, label, opts)  a.codex-link, role button, data-codex=a, that peeks.
                It stops propagation and prevents default. label defaults to
                the target's title. A plain text node when a does not resolve,
                of label, or with no label a readable stand-in: the entry slug
                as words ("ref-conds/prone" reads "Prone"), else the panel's
                title when the panel is visible on this desktop, else the
                panel id after its prefix as words. Never a GM title on the
                Freelancer desktop. Pass a label wherever a might not resolve
                (a console warning says so once per anchor).
     chip(a, opts)  button.codex-chip "?", aria-label "Rules: <title>", that
                peeks. null when a does not resolve. opts.title, opts.label.
     linkify(parent, text, opts)  EN.ui.applyInline's **bold** and *italic*,
                with POINTER TERMS wrapped in links. Pointer terms are chapter
                titles of MORE THAN ONE WORD, panel titles (a title with "&"
                also matches it with "and") and aliases from terms(). A one
                word chapter title ("Heat", "Scenes", "People") is ordinary
                English and is never a term by itself: its owner gives it a
                deliberate alias instead ("Heat track"). Precedence when two
                claim one phrase: alias, then panel title, then condition
                name, then chapter title (a chapter title points at its first
                panel). One exception: a panel title that is also ANOTHER
                chapter's title yields to that chapter once it has a panel
                (the Basics primers "The Flow" and "The #GRID" hand their
                titles to those chapters), so do not alias a chapter's title
                to steal it back. Condition names link only with
                opts.conditions. Longest match wins, on word boundaries. Case:
                a single word is always matched exactly; a phrase from a
                chapter or panel title is matched exactly too ("The Flow",
                never "the flow of combat"); a phrase from terms() or a
                condition name is matched in any case, because its author
                chose it. Each anchor links once per call, and never to the
                panel being built or to opts.self (a string or an array of
                anchors). opts.terms, { phrase: anchor }, adds terms for that
                one call, matched as written and ahead of every other term
                (ruleBlock, proseBlock, note and refTable pass it through), for
                a sentence that names a chapter but means one entry of it.
                A chapter name the book has and the Codex does not (PLAIN,
                below; empty since the Phase 2 chapters landed) is matched
                and printed as plain text, so it never links a shorter title
                inside it. Returns parent.
     terms({ "Edge and Snag": "rz-edge", ... })  add aliases. Each chapter
                file may add aliases for its own panels and entries.

   SEARCH  A box under the Codex heading searches every panel title, entry
     title and entry text visible on this desktop (and a panel's own prose
     when none of its entries matched). Title matches list first; each result
     opens its anchor in place. EN.codexView.search(q) returns the same hits.
     The Conditions Library keeps its own filter. Under the box, a strip of
     small buttons (nav.cx-chaps), one per chapter drawn on this desktop,
     scrolls to that chapter's heading the way open() scrolls; on Admin the
     Game Master chapters follow a label of their own.

   STATE   Open panels, filters and the search string are kept per desktop,
     in memory only. Nothing here is saved.

   EXTRAS for tests and chapter files: chapters() lists the registry,
   entries(panelId) lists a panel's entry anchors on this desktop,
   closePeek() closes the drawer.

   Guarded helpers for every link site OUTSIDE the codex files live in ui.js:
   EN.ui.ruleLink, EN.ui.ruleChip, EN.ui.ruleText. They degrade to plain text
   when this file is missing.
   =========================================================================== */
window.EN = window.EN || {};

EN.codexView = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;

  /* ---- anchors -------------------------------------------------------- */
  function slug(s) {
    return String(s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function splitAnchor(a) {
    a = String(a == null ? "" : a);
    var i = a.indexOf("/");
    return i < 0 ? { panel: a, entry: "" } : { panel: a.slice(0, i), entry: a.slice(i + 1) };
  }
  function warn(msg) { try { if (window.console && console.warn) console.warn("[codex] " + msg); } catch (e) {} }

  /* ---- the registry ----------------------------------------------------
     _rev bumps on every change and keys every cache below, so a chapter file
     that registers late (or a test that registers a chapter) is picked up by
     the index, the term table and the search with no other plumbing. */
  var _chapters = [], _chapterById = {}, _panelById = {}, _pending = {}, _aliases = {};
  var _rev = 0, _seq = 0;

  function register(def) {
    if (!def || !def.id) { warn("register: a chapter needs an id"); return null; }
    var ch = _chapterById[def.id];
    if (ch) warn("register: chapter " + def.id + " was already registered; its panels are added to it");
    else {
      ch = { id: String(def.id), title: def.title || String(def.id), order: typeof def.order === "number" ? def.order : 500,
             audience: def.audience === "gm" ? "gm" : "both", panels: [], seq: _seq++ };
      _chapters.push(ch);
      _chapterById[ch.id] = ch;
      if (_pending[ch.id]) { var q = _pending[ch.id]; delete _pending[ch.id]; addPanels(ch.id, q); }
    }
    addPanels(ch.id, def.panels || []);
    _rev++;
    return ch.id;
  }
  function addPanels(chapterId, list) {
    var ch = _chapterById[chapterId];
    if (!ch) { _pending[chapterId] = (_pending[chapterId] || []).concat(list || []); return; }
    (list || []).forEach(function (p) {
      if (!p || !p.id || typeof p.build !== "function") { warn("addPanels: a panel needs an id and a build (" + chapterId + ")"); return; }
      if (_panelById[p.id]) { warn("addPanels: panel id " + p.id + " is already registered"); return; }
      var rec = { id: String(p.id), title: p.title || String(p.id), tag: p.tag, audience: p.audience === "gm" ? "gm" : "both",
                  order: typeof p.order === "number" ? p.order : 1000, seq: _seq++, build: p.build, when: p.when, chapter: ch };
      ch.panels.push(rec);
      _panelById[rec.id] = rec;
    });
    _rev++;
  }
  function terms(map) {
    if (map && typeof map === "object") {
      Object.keys(map).forEach(function (k) { if (k && map[k]) _aliases[k] = String(map[k]); });
      _rev++;
    }
    var out = {};
    Object.keys(_aliases).forEach(function (k) { out[k] = _aliases[k]; });
    return out;
  }

  /* ---- desktops and visibility ---------------------------------------- */
  function portal() {
    try { return (EN.app && EN.app.portal && EN.app.portal() === "admin") ? "admin" : "freelancer"; } catch (e) { return "freelancer"; }
  }
  function tabKey() { return portal() === "admin" ? "gmcodex" : "codex"; }
  // the Codex tab is on the rail: false for an unfiled Freelancer, whose rail is #PRINT alone
  function onRail() { try { return EN.app.tabOrder().indexOf(tabKey()) !== -1; } catch (e) { return false; } }
  function gmOnly(p) { return p.audience === "gm" || p.chapter.audience === "gm"; }
  function visible(p, pt) { return !gmOnly(p) || pt === "admin"; }
  function byOrder(a, b) { return (a.order - b.order) || (a.seq - b.seq); }
  function chaptersSorted() { return _chapters.slice().sort(byOrder); }
  function panelsOf(ch, pt) { return ch.panels.filter(function (p) { return visible(p, pt); }).sort(byOrder); }
  function ready(p) {
    if (typeof p.when !== "function") return true;
    try { return !!p.when(); } catch (e) { return false; }
  }

  /* ---- per-desktop state ---------------------------------------------- */
  function newState() { return { open: {}, filter: {}, search: "" }; }
  var _state = { freelancer: newState(), admin: newState() };
  function stateFor(pt) { return _state[pt === "admin" ? "admin" : "freelancer"]; }

  function activeRec(pt) {
    if (pt !== "freelancer") return null;
    try { return (EN.store && EN.store.active && EN.store.active()) || null; } catch (e) { return null; }
  }
  function makeCtx(pt, inPeek, indexing) { return { portal: pt, inPeek: !!inPeek, indexing: !!indexing, active: activeRec(pt) }; }

  /* ---- builds ----------------------------------------------------------
     _cur is the build in progress: which panel, its ctx, the slugs it has
     handed out (for the -2, -3 rule) and the entries it made. A stack in
     effect, since an index build can start while a render build runs. */
  var _cur = null;
  function flat(list, out) {
    out = out || [];
    (Array.isArray(list) ? list : [list]).forEach(function (n) {
      if (n == null || n === false) return;
      if (Array.isArray(n)) flat(n, out);
      else if (typeof n === "string" || typeof n === "number") out.push(document.createTextNode(String(n)));
      else out.push(n);
    });
    return out;
  }
  function runBuild(p, ctx) {
    var prev = _cur;
    _cur = { panel: p, ctx: ctx, taken: {}, entries: [], subs: [], prev: prev };
    var nodes = [];
    if (ready(p)) {
      try { nodes = flat(p.build(ctx, kit) || []); }
      catch (e) {
        nodes = [];
        try { console.error("[codex] panel " + p.id + " failed to build: " + (e && e.message || e)); } catch (x) {}
      }
    }
    // sub-entries take what the real entries left free, in build order
    var taken = {}, cur = _cur;
    cur.entries.forEach(function (e) { taken[e.slug] = 1; });
    cur.subs.forEach(function (sb) {
      var sl = sb.base, n = 1;
      while (taken[sl]) { n++; sl = sb.base + "-" + n; }
      taken[sl] = 1;
      var a = p.id + "/" + sl;
      sb.node.setAttribute("data-cx-entry", a);
      unlinkSelf(sb.node, a);
      cur.entries.push({ slug: sl, anchor: a, title: sb.title, text: sb.text, sub: true, parent: sb.parent, parentAnchor: sb.parentAnchor });
    });
    var res = { nodes: nodes, entries: cur.entries };
    _cur = prev;
    return res;
  }
  /* The first free slug of s, s-2, s-3...: counting per base slug alone could hand out one
     already taken ("Rank", "Rank 2", "Rank" gave rank-2 twice), so the slugs issued are kept. */
  function claim(s) {
    s = s || "entry";
    if (!_cur) return s;
    var out = s, n = 1;
    while (_cur.taken[out]) { n++; out = s + "-" + n; }
    _cur.taken[out] = 1;
    return out;
  }
  function record(s, title, text) {
    if (!_cur) return null;
    var a = _cur.panel.id + "/" + s;
    _cur.entries.push({ slug: s, anchor: a, title: String(title == null ? "" : title), text: String(text == null ? "" : text) });
    return a;
  }
  function indexing() { return !!(_cur && _cur.ctx.indexing); }

  /* ---- the index --------------------------------------------------------
     What has() and the search read: each panel built once with ctx.indexing,
     keyed on the desktop, the registry revision and the active record (the
     Juggernaut's dice change the Improvised Weapons text). The record part
     is its id plus meta.updatedAt, which store.js stamps on every save, so
     any edit (class, level, lineage, gear) rebuilds the panels on demand;
     class, subclass and level ride along in case two saves share a
     millisecond. One desktop is cached at a time; flipping desktops
     rebuilds on demand. */
  var _idx = { key: "", panels: {} }, _busy = {};
  function activeKey(pt) {
    var a = activeRec(pt);
    if (!a) return "";
    var m = a.meta || {};
    return [m.id || "", m.updatedAt || "", a["class"] || "", a.subclass || "", a.level || ""].join(":");
  }
  function pIndex(p, pt) {
    var key = pt + "|" + _rev + "|" + activeKey(pt);
    if (_idx.key !== key) _idx = { key: key, panels: {} };
    var hit = _idx.panels[p.id];
    if (hit) return hit;
    if (_busy[p.id]) return { building: true, empty: false, entries: [], bySlug: {}, text: "" };
    _busy[p.id] = true;
    var res;
    try { res = runBuild(p, makeCtx(pt, false, true)); } finally { delete _busy[p.id]; }
    var by = {};
    res.entries.forEach(function (e) { by[e.slug] = e; });
    hit = { empty: !res.nodes.length, entries: res.entries, bySlug: by,
            text: res.nodes.map(readText).join(" ").replace(/\s+/g, " ").trim() };
    _idx.panels[p.id] = hit;
    return hit;
  }
  function resolve(anchor, pt) {
    pt = pt || portal();
    var a = splitAnchor(anchor);
    var p = _panelById[a.panel];
    if (!p || !visible(p, pt) || !ready(p)) return null;
    var ix = pIndex(p, pt);
    if (ix.empty) return null;
    if (!a.entry) return { panel: p, entry: null, anchor: p.id, title: p.title };
    if (ix.building) return null;
    var e = ix.bySlug[a.entry];
    return e ? { panel: p, entry: e, anchor: e.anchor, title: e.title } : null;
  }
  function has(anchor) { try { return !!resolve(anchor); } catch (e) { return false; } }
  function entries(panelId) {
    var p = _panelById[panelId], pt = portal();
    if (!p || !visible(p, pt) || !ready(p)) return [];
    return pIndex(p, pt).entries.map(function (e) { return e.anchor; });
  }
  function chapters() {
    return chaptersSorted().map(function (ch) {
      return { id: ch.id, title: ch.title, order: ch.order, audience: ch.audience,
               panels: ch.panels.slice().sort(byOrder).map(function (p) { return { id: p.id, title: p.title, audience: p.audience, order: p.order }; }) };
    });
  }

  /* ---- links and chips -------------------------------------------------- */
  function inDrawer(node) { return !!(node && node.closest && node.closest("#codex-peek")); }
  function wire(node, anchor) {
    function go(e) { e.preventDefault(); e.stopPropagation(); peek(anchor, { push: inDrawer(node) }); }
    node.addEventListener("click", go);
    node.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") go(e); });
  }
  /* The words a label-less link prints when its anchor does not resolve, so the rule's name
     stays in the sentence: the entry slug as words, else the panel's title when the panel is
     visible on this desktop, else the panel id after its prefix ("gmx-heat" reads "Heat").
     Never a hidden panel's title, so a GM title cannot reach the Freelancer page or its index.
     EN.ui.ruleLink uses the same slug rule when this file is missing. */
  function words(s) {
    return String(s || "").split("-").filter(Boolean).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  }
  function standIn(anchor) {
    var a = splitAnchor(anchor), p = _panelById[a.panel];
    if (a.entry) return words(a.entry);
    if (p && visible(p, portal())) return p.title;
    var bits = a.panel.split("-");
    return words(bits.length > 1 ? bits.slice(1).join("-") : a.panel);
  }
  /* While a panel is still building its index, an entry of that panel (or of one further up
     the build stack) does not resolve yet; the entries it has made so far are on _cur. */
  function buildingTitle(anchor) {
    var a = splitAnchor(anchor);
    for (var c = _cur; c; c = c.prev) {
      if (c.panel.id !== a.panel) continue;
      if (!a.entry) return c.panel.title;
      for (var i = 0; i < c.entries.length; i++) if (c.entries[i].slug === a.entry) return c.entries[i].title;
      return null;
    }
    return null;
  }
  var _warned = {};
  function link(anchor, label, opts) {
    var txt = label == null ? null : String(label);
    var r = null;
    if (indexing()) {
      /* the same words a render prints, so the search reads what the page shows: resolve()
         nests an index build of the target panel (its own _cur), and _busy stops a cycle */
      if (txt == null) {
        try { r = resolve(anchor); } catch (e) { r = null; }
        txt = r ? r.title : (buildingTitle(anchor) || standIn(anchor));
      }
      return document.createTextNode(txt);
    }
    try { r = resolve(anchor); } catch (e) { r = null; }
    if (!r) {
      if (txt == null) {
        txt = standIn(anchor);
        if (!_warned[anchor]) { _warned[anchor] = 1; warn("link: " + anchor + " does not resolve here and has no label; printed \"" + txt + "\""); }
      }
      return document.createTextNode(txt);
    }
    var a = el("a.codex-link", { role: "button", tabindex: "0", dataset: { codex: String(anchor) }, title: "Rules: " + r.title },
      txt == null ? r.title : txt);
    wire(a, String(anchor));
    return a;
  }
  /* An entry never links to itself: a link inside node that points at anchor goes back to its words. */
  function unlinkSelf(node, anchor) {
    Array.prototype.slice.call(node.querySelectorAll("a.codex-link")).forEach(function (a) {
      if (a.getAttribute("data-codex") === anchor) a.parentNode.replaceChild(document.createTextNode(a.textContent), a);
    });
  }
  function chip(anchor, opts) {
    opts = opts || {};
    if (indexing()) return null;
    var r = null;
    try { r = resolve(anchor); } catch (e) { r = null; }
    if (!r) return null;
    var t = opts.title || r.title;
    var b = el("button.codex-chip", { type: "button", "aria-label": "Rules: " + t, title: "Rules: " + t, dataset: { codex: String(anchor) } },
      opts.label || "?");
    wire(b, String(anchor));
    return b;
  }

  /* ---- pointer terms ----------------------------------------------------
     One table per desktop, revision and conditions flag, in two halves:
       exact  every single word, and every phrase taken from a chapter or
              panel title, matched as written ("The Flow" links, "the flow
              of combat" does not)
       loose  a phrase from terms() or a condition name, matched in any case
              and kept under its lower case, because its author chose it
     Two regexes, because one regex cannot carry both flags. The scan takes
     whichever matches first, the longer on a tie, and on a tie of both the
     higher layer (alias 4, panel title 3, condition 2, chapter title 1).
     Word boundaries are written out rather than \b so a term that starts
     with "#" (The #GRID) still matches.
     A one word chapter title is skipped (Heat, Scenes and People are common
     English), and a panel title that is another chapter's title yields to
     that chapter, so the Basics primers never shadow The Flow or The #GRID
     once those chapters have panels. */
  var _termCache = {};
  /* Chapters the book has and the Codex does not yet. A citation of one stays plain text
     rather than linking whichever shorter title it happens to contain. Drop a name here
     when its chapter lands. Empty since Phase 2 (2026-10-07): the six names it held now
     link through their own chapters, panels and aliases (Vitality & Recovery and Dying
     and Death Saves to rc-, Social Pressure and Faction Standing to so-, Vehicles and
     Chases to vc-stats, Falling & Forced Movement to mv-fall, Flow Disturbances to
     fl-dist). */
  var PLAIN = [];
  /* Feature names that hold a rule word. Matched whole and printed plain, so the Codebreaker's
     "#GRID Initiative" is not read as a link to Initiative, and the "roll Initiative" after it
     in the same sentence keeps that link. */
  var NAMES = ["#GRID Initiative"];
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&"); }
  function isPhrase(s) { return /\s/.test(s); }
  function termTable(pt, conds) {
    var key = pt + "|" + _rev + "|" + (conds ? 1 : 0);
    if (_termCache.key === key) return _termCache.table;
    var exact = {}, loose = {};
    function layer(pairs, rank, chosen) {
      var local = {};
      pairs.forEach(function (pr) {
        var ph = String(pr[0] || "").trim();
        if (!ph || !pr[1]) return;
        [ph, ph.indexOf("&") !== -1 ? ph.replace(/\s*&\s*/g, " and ") : null].forEach(function (v) {
          if (!v) return;
          var lo = chosen && isPhrase(v);
          var k = lo ? "l" + v.toLowerCase() : "e" + v;
          if (!(k in local)) local[k] = { anchor: pr[1], phrase: v, rank: rank };
        });
      });
      Object.keys(local).forEach(function (k) { (k.charAt(0) === "l" ? loose : exact)[k.slice(1)] = local[k]; });
    }
    var chs = chaptersSorted();
    // each chapter's target: its first panel on this desktop that is ready
    var chTarget = {}, chByTitle = {};
    chs.forEach(function (ch) {
      var first = panelsOf(ch, pt).filter(ready)[0];
      if (first) { chTarget[ch.id] = first.id; chByTitle[ch.title.toLowerCase()] = ch.id; }
    });
    // lowest first: chapter titles, condition names, panel titles, aliases
    layer(chs.filter(function (ch) { return isPhrase(ch.title); }).map(function (ch) { return [ch.title, chTarget[ch.id] || null]; }), 1, false);
    if (conds) layer((EN.conditions || []).map(function (c) { return [c.name, "ref-conds/" + slug(c.name)]; }), 2, true);
    var pts = [];
    chs.forEach(function (ch) {
      panelsOf(ch, pt).forEach(function (p) {
        var owner = chByTitle[p.title.toLowerCase()];
        if (owner && owner !== ch.id && isPhrase(p.title)) return;   // that chapter owns its title
        pts.push([p.title, p.id]);
      });
    });
    layer(pts, 3, false);
    layer(Object.keys(_aliases).map(function (k) { return [k, _aliases[k]]; }), 4, true);
    // a chapter name with no chapter yet (PLAIN), and the feature names (NAMES): matched, so
    // a longer name is never read as a shorter title plus words, and printed as plain text
    PLAIN.concat(NAMES).forEach(function (ph) {
      [ph, ph.indexOf("&") !== -1 ? ph.replace(/\s*&\s*/g, " and ") : null].forEach(function (v) {
        if (v) loose[v.toLowerCase()] = { anchor: null, phrase: v, rank: 6 };
      });
    });
    function rx(map, flags) {
      var list = Object.keys(map).map(function (k) { return map[k].phrase; });
      if (!list.length) return null;
      list.sort(function (a, b) { return b.length - a.length; });
      return new RegExp("(^|[^A-Za-z0-9_])(" + list.map(esc).join("|") + ")(?![A-Za-z0-9_])", flags);
    }
    var table = { exact: exact, loose: loose, rxExact: rx(exact, "g"), rxLoose: rx(loose, "gi") };
    _termCache = { key: key, table: table };
    return table;
  }
  function nextMatch(re, s, pos) {
    if (!re) return null;
    re.lastIndex = pos > 0 ? pos - 1 : 0;
    for (;;) {
      var m = re.exec(s);
      if (!m) return null;
      var start = m.index + m[1].length;
      if (start >= pos) return { start: start, text: m[2] };
      re.lastIndex = m.index + 1;
    }
  }
  var MARKUP = /(\*\*[^*]+\*\*|\*(?!\*)[^*]+\*(?!\*))/;
  /* opts.terms: { phrase: anchor } for THIS call only, matched exactly as written and
     ahead of every table term. A sentence that names a chapter when it means one entry of
     it ("Combat Rules below has the details, including how a blast behaves when there's
     cover in the way") points at that entry without stealing the chapter title everywhere. */
  function localTable(map) {
    var hits = {}, list = [];
    Object.keys(map || {}).forEach(function (k) {
      var ph = String(k || "").trim();
      if (!ph || !map[k] || hits[ph]) return;
      hits[ph] = { anchor: String(map[k]), phrase: ph, rank: 5 };
      list.push(ph);
    });
    if (!list.length) return null;
    list.sort(function (a, b) { return b.length - a.length; });
    return { hits: hits, rx: new RegExp("(^|[^A-Za-z0-9_])(" + list.map(esc).join("|") + ")(?![A-Za-z0-9_])", "g") };
  }
  function linkify(parent, text, opts) {
    opts = opts || {};
    if (!parent) parent = el("span");
    text = String(text == null ? "" : text);
    var T = (indexing() || opts.links === false) ? null : termTable(portal(), !!opts.conditions);
    var L = T && opts.terms ? localTable(opts.terms) : null;
    var used = opts.used || {}, self = {};
    [].concat(opts.self || []).forEach(function (a) { if (a) self[a] = 1; });
    if (_cur) self[_cur.panel.id] = 1;
    function emit(node, s) {
      if (!T) { if (s) node.appendChild(document.createTextNode(s)); return; }
      var pos = 0, buf = "";
      while (pos < s.length) {
        var a = nextMatch(T.rxExact, s, pos), b = nextMatch(T.rxLoose, s, pos);
        if (a) a.hit = T.exact[a.text];
        if (b) b.hit = T.loose[b.text.toLowerCase()];
        var best = !a ? b : !b ? a
          : a.start !== b.start ? (a.start < b.start ? a : b)
          : a.text.length !== b.text.length ? (a.text.length > b.text.length ? a : b)
          : ((a.hit ? a.hit.rank : 0) >= (b.hit ? b.hit.rank : 0) ? a : b);
        var c = L ? nextMatch(L.rx, s, pos) : null;
        if (c) {
          c.hit = L.hits[c.text];
          if (!best || c.start < best.start || (c.start === best.start && c.text.length >= best.text.length)) best = c;
        }
        if (!best) break;
        var hit = best.hit;
        var end = best.start + best.text.length;
        var anchor = hit ? hit.anchor : null;
        if (anchor && !used[anchor] && !self[anchor] && has(anchor)) {
          buf += s.slice(pos, best.start);
          if (buf) { node.appendChild(document.createTextNode(buf)); buf = ""; }
          node.appendChild(link(anchor, best.text));
          used[anchor] = 1;
        } else buf += s.slice(pos, end);
        pos = end;
      }
      buf += s.slice(pos);
      if (buf) node.appendChild(document.createTextNode(buf));
    }
    // the same split and the same tests as EN.ui.applyInline, so the markup reads identically
    text.split(MARKUP).forEach(function (part) {
      if (part.slice(0, 2) === "**" && part.slice(-2) === "**") {
        var st = el("strong"); emit(st, part.slice(2, -2)); parent.appendChild(st);
      } else if (part.charAt(0) === "*" && part.charAt(part.length - 1) === "*") {
        var em = el("em"); emit(em, part.slice(1, -1)); parent.appendChild(em);
      } else if (part) emit(parent, part);
    });
    return parent;
  }

  /* ---- the kit ----------------------------------------------------------- */
  /* A NAMED LINE inside a rule block, "- Dash: Move an additional distance...", is an
     entry of its own (a sub-entry), so "ref-actions/dash" resolves although Dash is one
     line of the Action entry. Its line is wrapped in a span.cx-sub, which changes no
     text. Sub-entries take their slugs AFTER the build, from what the real entries left
     free, so they never shift a real entry's -2 or -3. */
  var SUBLINE = /^\s*(?:-|•)\s*([A-Z0-9][^:\n.]{0,38}?)\s*:\s/;
  function ruleText(p, text, lo, anchor, name) {
    var lines = String(text).split("\n");
    if (!_cur || !lines.some(function (l) { return SUBLINE.test(l); })) { linkify(p, text, lo); return; }
    lines.forEach(function (line, i) {
      if (i) p.appendChild(document.createTextNode("\n"));
      var m = SUBLINE.exec(line);
      if (!m) { if (line) linkify(p, line, lo); return; }
      var sp = el("span.cx-sub");
      // the line's own name is not a link to itself; runBuild unlinks it again should its slug come out as -2
      linkify(sp, line, { conditions: lo.conditions, self: [].concat(lo.self || [], _cur.panel.id + "/" + (slug(m[1]) || "entry")), used: lo.used, terms: lo.terms });
      p.appendChild(sp);
      _cur.subs.push({ base: slug(m[1]) || "entry", title: m[1], text: line.slice(m[0].length).trim(), node: sp, parent: name, parentAnchor: anchor });
    });
  }
  function ruleBlock(name, text, extra, opts) {
    opts = opts || {};
    var s = claim(opts.slug || slug(name));
    var anchor = _cur ? _cur.panel.id + "/" + s : null;
    var p = el("p");
    if (opts.linkify === false) p.textContent = text || "";
    else ruleText(p, text || "", { conditions: opts.conditions, self: anchor, used: {}, terms: opts.terms }, anchor, name);
    var node = el("div.feature", anchor ? { dataset: { cxEntry: anchor } } : null, [
      el("h4", null, [document.createTextNode(name), extra ? el("span.src", { text: extra }) : null]),
      p
    ]);
    record(s, name, text || "");
    return node;
  }
  function entry(s, title, children, opts) {
    opts = opts || {};
    s = claim(s || slug(title));
    var anchor = _cur ? _cur.panel.id + "/" + s : null;
    var attrs = {};
    Object.keys(opts.attrs || {}).forEach(function (k) { attrs[k] = opts.attrs[k]; });
    if (anchor) {
      var ds = {};
      Object.keys(attrs.dataset || {}).forEach(function (k) { ds[k] = attrs.dataset[k]; });
      ds.cxEntry = anchor;
      attrs.dataset = ds;
    }
    var node = el((opts.tag || "div") + ".cx-entry", attrs, children);
    // the children were built before this anchor existed, so a link of theirs may point here
    if (anchor) unlinkSelf(node, anchor);
    record(s, title, opts.text != null ? opts.text : readText(node));
    return node;
  }
  /* A node's words for the index. textContent runs a table's cells together ("rest.VigorTemporary
     protection"), so a snippet misreads and a query can match across a cell edge: a row's cells
     join with " · " and block elements with a space. */
  var BLOCKS = /^(DIV|P|UL|OL|LI|H[1-6]|TABLE|THEAD|TBODY|TD|TH|SECTION|DETAILS|SUMMARY|BR)$/;
  function readText(n) {
    function walk(x) {
      if (x.nodeType === 3) return x.nodeValue;
      if (x.nodeType !== 1) return "";
      if (x.tagName === "TR") return " " + [].map.call(x.children, function (c) { return walk(c).replace(/\s+/g, " ").trim(); }).filter(Boolean).join(" · ") + " ";
      var t = [].map.call(x.childNodes, walk).join("");
      return BLOCKS.test(x.tagName) ? " " + t + " " : t;
    }
    return n ? walk(n).replace(/\s+/g, " ").trim() : "";
  }
  // Compact rule table built on the existing .sktable styling. `strongCols`
  // is an optional list of column indices to render emphasized. Cells go
  // through linkify ("(see Help Action)" in a Dice Pools row is a link), and
  // the table shares one `used` map, so a term repeated down a column links
  // once per table rather than once per cell. opts.linkify === false prints
  // the cells as is; opts.conditions and opts.terms pass to linkify.
  function refTable(cols, rows, strongCols, opts) {
    strongCols = strongCols || [];
    opts = opts || {};
    var lo = { conditions: opts.conditions, terms: opts.terms, used: {} };
    var head = el("tr", null, cols.map(function (c) { return el("th", { text: c }); }));
    var body = rows.map(function (r) {
      return el("tr", null, r.map(function (cell, i) {
        var em = strongCols.indexOf(i) !== -1;
        var td = el("td", em ? { style: { color: "var(--text)", fontWeight: 600 } } : null);
        var s = cell == null ? "" : String(cell);
        if (opts.linkify === false) td.appendChild(document.createTextNode(s));
        else linkify(td, s, lo);
        return td;
      }));
    });
    return el("table.sktable", { style: { marginBottom: "10px" } }, [el("thead", null, [head]), el("tbody", null, body)]);
  }
  // Multi-line prose where lines starting with "-" become a bullet list.
  function proseBlock(text, opts) {
    opts = opts || {};
    var wrap = el("div"), ul = null;
    var lo = { conditions: opts.conditions, self: opts.self, terms: opts.terms };
    String(text || "").split("\n").forEach(function (line) {
      var t = line.trim();
      if (!t) { ul = null; return; }
      if (t.charAt(0) === "-") {
        if (!ul) { ul = el("ul", { style: { margin: "2px 0 8px", paddingLeft: "18px", fontSize: "13.5px", color: "var(--text2)", lineHeight: "1.5" } }); wrap.appendChild(ul); }
        var li = el("li", { style: { marginBottom: "3px" } }); linkify(li, t.slice(1).trim(), lo); ul.appendChild(li);
      } else {
        ul = null;
        var p = el("p", { style: { margin: "0 0 8px", fontSize: "13.5px", color: "var(--text2)", lineHeight: "1.5" } }); linkify(p, t, lo); wrap.appendChild(p);
      }
    });
    return wrap;
  }
  function subTitle(label) {
    return el("div.section-title", null, [document.createTextNode(label), el("span.line")]);
  }
  function bullets(a) { return (a || []).map(function (x) { return "• " + x; }).join("\n"); }
  function note(text, opts) {
    opts = opts || {};
    var p = el("p", { style: { margin: opts.margin || "0 0 8px", fontSize: "12.5px", fontStyle: "italic", color: "var(--text3)" } });
    return linkify(p, text, { conditions: opts.conditions, self: opts.self, terms: opts.terms });
  }
  // a line of links, for the pointers between panels (only the ones that resolve are links)
  function seeAlso(label, pairs) {
    var p = el("p", { style: { margin: "4px 0 0", fontSize: "12.5px", fontStyle: "italic", color: "var(--text3)" } }, [label + " "]);
    (pairs || []).forEach(function (pr, i) {
      if (i) p.appendChild(document.createTextNode(" · "));
      p.appendChild(link(pr[0], pr[1]));
    });
    return p;
  }
  var kit = {
    el: el, ruleBlock: ruleBlock, entry: entry, refTable: refTable, proseBlock: proseBlock, subTitle: subTitle,
    bullets: bullets, link: link, chip: chip, linkify: linkify, note: note, seeAlso: seeAlso,
    state: function (ctx) { return stateFor(ctx && ctx.portal); }
  };

  /* ---- finding and flashing a target --------------------------------------
     Attribute comparison rather than a selector, so an anchor never needs CSS
     escaping. data-cx-panel marks a panel, data-cx-entry an entry; data-codex
     is reserved for the links that point at them. */
  function findIn(root, anchor) {
    if (!root || !anchor) return null;
    var isEntry = anchor.indexOf("/") !== -1;
    var attr = isEntry ? "data-cx-entry" : "data-cx-panel";
    var list = root.querySelectorAll("[" + attr + "]");
    for (var i = 0; i < list.length; i++) if (list[i].getAttribute(attr) === anchor) return list[i];
    return null;
  }
  function flash(node) {
    if (!node) return;
    node.classList.remove("codex-flash");
    void node.offsetWidth;   // restart the animation when the same target is opened twice
    node.classList.add("codex-flash");
    setTimeout(function () { node.classList.remove("codex-flash"); }, 1600);
  }

  /* ---- open: go to the entry on this desktop's Codex tab ------------------ */
  function open(anchor) {
    var pt = portal(), r = resolve(anchor, pt);
    if (!r) return false;
    if (!onRail()) return peek(anchor);
    closePeek();
    var st = stateFor(pt);
    st.open[r.panel.id] = true;
    if (r.entry) st.open[r.entry.anchor] = true;
    delete st.filter[r.panel.id];
    var target = r.anchor, panelId = r.panel.id;
    EN.app.gotoTab(tabKey());
    /* AFTER the render: a tab switch scrolls to the top inside render(), and a
       same-tab render restores the old scroll, so either way this comes last. */
    setTimeout(function () {
      var view = document.getElementById("view") || document.body;
      var node = findIn(view, target) || findIn(view, panelId);
      if (!node) return;
      scrollToNode(node);
      flash(node);
    }, 0);
    return true;
  }
  // the page scrolls so the node sits about 140px from the top, clear of the sticky bar and rail
  function scrollToNode(node) {
    var y = node.getBoundingClientRect().top + (window.pageYOffset || 0) - 140;
    window.scrollTo(0, Math.max(0, y));
  }

  /* ---- peek: the drawer ----------------------------------------------------
     On document.body, outside #view: render() clears #view and would take the
     drawer with it, and swipe.js listens on #view, so a drag inside the drawer
     never reaches the tab swipe (data-no-swipe says so as well). A watcher on
     #view closes it if the desktop flips under it, so a GM chapter cannot be
     left open on the Freelancer desktop. */
  var _peek = null;
  var FOCUSABLE = 'button:not([disabled]), a.codex-link, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';
  /* Tab wraps inside the card. #os is inert behind the drawer as well (makeDrawer), so this is
     the belt to that: a browser without inert, or focus that somehow left the card, still
     comes back to the drawer and never reaches the links behind the backdrop. */
  function trapTab(e) {
    var card = _peek.card;
    var list = Array.prototype.filter.call(card.querySelectorAll(FOCUSABLE), function (n) { return n.getClientRects().length > 0 && n.getAttribute("tabindex") !== "-1"; });
    var act = document.activeElement, inside = card.contains(act);
    if (!list.length) { e.preventDefault(); card.focus(); return; }
    var first = list[0], last = list[list.length - 1];
    if (!inside) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
    if (e.shiftKey && (act === first || act === card)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
  }
  function peekKey(e) {
    if (!_peek) return;
    /* With the GM's Card open its own keys work first: a drawer opened before the card is under
       it and leaves Tab and Escape to the card, and a drawer raised over it from a card link
       (gm.js raiseOverCard, data-over-card) keeps Tab inside itself and leaves Escape to the
       card's handler, which closes the drawer before the card. */
    var card = document.getElementById("print-overlay");
    if (card && !_peek.root.getAttribute("data-over-card")) return;
    if (e.key === "Tab") { trapTab(e); return; }
    if (card) return;
    if (e.key !== "Escape") return;
    e.preventDefault(); e.stopPropagation();
    closePeek();
  }
  function closePeek() {
    if (!_peek) return;
    var pk = _peek;
    _peek = null;
    document.removeEventListener("keydown", peekKey, true);
    window.removeEventListener("resize", onPeekResize);
    if (pk.mo) { try { pk.mo.disconnect(); } catch (e) {} }
    if (pk.os) { try { pk.os.inert = !!pk.inertWas; } catch (e) {} }
    if (pk.root.parentNode) pk.root.parentNode.removeChild(pk.root);
    try { if (pk.opener && pk.opener.focus && document.body.contains(pk.opener)) pk.opener.focus({ preventScroll: true }); } catch (e) {}
  }
  function makeDrawer(pt) {
    var kick = el("div.cxp-kick"), title = el("div.cxp-title", { id: "cxp-title" });
    var btns = el("div.cxp-btns");
    var body = el("div.panel-b.cxp-body");
    var card = el("div.cxp-card", { role: "dialog", "aria-modal": "true", "aria-labelledby": "cxp-title", tabindex: "-1" }, [
      el("div.cxp-head", null, [el("div.cxp-heads", null, [kick, title])]),
      btns,
      body
    ]);
    var root = el("div#codex-peek", { "data-no-swipe": "1" }, [el("div.cxp-scrim", { onclick: closePeek }), card]);
    document.body.appendChild(root);
    document.addEventListener("keydown", peekKey, true);
    window.addEventListener("resize", onPeekResize);
    var pk = { root: root, card: card, kick: kick, title: title, btns: btns, body: body, history: [], anchor: null, pt: pt,
               opener: document.activeElement, mo: null, os: null, inertWas: false };
    /* a modal in fact, not only in aria: the desktop behind the backdrop takes no focus and no
       clicks while the drawer is open. The drawer and the GM's Card (#print-overlay) are on
       document.body, outside #os, so both keep working. */
    var os = document.getElementById("os");
    if (os) { pk.os = os; pk.inertWas = !!os.inert; try { os.inert = true; } catch (e) {} }
    var view = document.getElementById("view");
    if (view && window.MutationObserver) {
      pk.mo = new MutationObserver(function () { if (_peek === pk && portal() !== pk.pt) closePeek(); });
      pk.mo.observe(view, { childList: true });
    }
    return pk;
  }
  /* A rule table wider than the drawer is STACKED rather than scrolled or squeezed: each row
     becomes a block and each cell carries its column's name (data-label, read from the
     table's own head), so a five-column table reads at 360px with no word broken mid-way and
     nothing pushing the sheet sideways. Measured, not assumed, so a table that fits keeps its
     grid; re-measured when the window changes size while the drawer is open. */
  function fitTables(body) {
    var tables = body.querySelectorAll("table");
    if (!tables.length) return;
    var cs = getComputedStyle(body);
    var room = body.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    Array.prototype.forEach.call(tables, function (t) {
      t.classList.remove("cx-stack");
      if (t.offsetWidth <= room + 1) return;
      var heads = Array.prototype.map.call(t.querySelectorAll("thead th"), function (th) { return th.textContent; });
      Array.prototype.forEach.call(t.querySelectorAll("tbody tr"), function (tr) {
        Array.prototype.forEach.call(tr.children, function (td, i) { if (heads[i] && !td.hasAttribute("data-label")) td.setAttribute("data-label", heads[i]); });
      });
      t.classList.add("cx-stack");
    });
  }
  function onPeekResize() { if (_peek) fitTables(_peek.body); }
  /* The Codex page's open panels get the same stacking, so a wide rule table never pushes the
     page sideways at phone width either. Measured once the page has a width (a render into a
     hidden mount waits a tick), and again when the window changes size. */
  function fitPage(root) {
    var bodies = root ? root.querySelectorAll("[data-cx-panel] > .panel-b") : [];
    if (!bodies.length) return;
    if (!root.clientWidth) { setTimeout(function () { if (root.clientWidth) fitPage(root); }, 0); return; }
    Array.prototype.forEach.call(bodies, fitTables);
  }
  var _pageFitT = null;
  window.addEventListener("resize", function () {
    clearTimeout(_pageFitT);
    _pageFitT = setTimeout(function () { fitPage(document.getElementById("view")); }, 80);
  });
  function peek(anchor, opts) {
    opts = opts || {};
    var pt = portal(), r = resolve(anchor, pt);
    if (!r) return false;
    if (_peek && _peek.pt !== pt) closePeek();
    if (!_peek) _peek = makeDrawer(pt);
    else if (opts.push && _peek.anchor) _peek.history.push(_peek.anchor);
    else if (!opts.back) _peek.history = [];   // a fresh peek from outside the drawer starts a new trail
    _peek.anchor = r.anchor;
    paintPeek(r, pt);
    return true;
  }
  function paintPeek(r, pt) {
    var pk = _peek;
    var res = runBuild(r.panel, makeCtx(pt, true, false));
    var content = res.nodes;
    if (r.entry && r.entry.sub) {
      // a named line, drawn as a small entry of its own with its parent entry named beside it
      var sp = el("p");
      linkify(sp, r.entry.text, { self: [r.entry.anchor, r.entry.parentAnchor, r.panel.id] });
      content = [el("div.feature", { dataset: { cxEntry: r.entry.anchor } }, [
        el("h4", null, [document.createTextNode(r.entry.title), el("span.src", { text: r.entry.parent || "" })]), sp
      ])];
    } else if (r.entry) {
      var holder = el("div", null, res.nodes);
      var node = findIn(holder, r.entry.anchor);
      content = node ? [node] : [];
      // an entry() block of arbitrary nodes may carry no heading of its own
      if (node && !node.querySelector("h3, h4")) content.unshift(el("h4.cxp-etitle", { text: r.entry.title }));
    }
    pk.root.setAttribute("data-anchor", r.anchor);
    // a chapter and its only panel can share a title; the drawer says it once
    pk.kick.textContent = r.panel.chapter.title.toLowerCase() === r.panel.title.toLowerCase() ? "" : r.panel.chapter.title;
    pk.title.textContent = r.panel.title;
    clear(pk.btns);
    if (pk.history.length) pk.btns.appendChild(el("button.btn.sm", { type: "button", dataset: { cxp: "back" },
      onclick: function () { if (_peek && _peek.history.length) peek(_peek.history.pop(), { back: true }); } }, "‹ BACK"));
    if (onRail()) pk.btns.appendChild(el("button.btn.sm.primary", { type: "button", dataset: { cxp: "open" },
      onclick: function () { var a = _peek && _peek.anchor; closePeek(); if (a) open(a); } }, "OPEN IN CODEX"));
    pk.btns.appendChild(el("button.btn.sm", { type: "button", dataset: { cxp: "close" }, onclick: closePeek }, "✕ CLOSE"));
    clear(pk.body);
    content.forEach(function (n) { pk.body.appendChild(n); });
    if (!content.length) pk.body.appendChild(el("p.help", { text: "Nothing to show." }));
    pk.body.scrollTop = 0;
    if (EN.ui.substituteCurrencyGlyphs) { try { EN.ui.substituteCurrencyGlyphs(pk.body); } catch (e) {} }
    fitTables(pk.body);
    try { pk.card.focus({ preventScroll: true }); } catch (e) {}
  }

  /* ---- search ------------------------------------------------------------ */
  /* An entry's text as the page shows it: the same split and tests as linkify, minus the
     asterisks, so a snippet never prints "**Free Skill Focus**". Kept on the cached entry. */
  function bare(e) {
    if (e.bare == null) {
      e.bare = String(e.text || "").split(MARKUP).map(function (part) {
        if (part.slice(0, 2) === "**" && part.slice(-2) === "**") return part.slice(2, -2);
        if (part.charAt(0) === "*" && part.charAt(part.length - 1) === "*") return part.slice(1, -1);
        return part;
      }).join("");
    }
    return e.bare;
  }
  // f: a match from the matcher, or null for the opening words (a hit on the title alone)
  function snippet(text, f) {
    text = String(text || "");
    if (!f) {
      if (!text) return null;
      var n = Math.min(text.length, 120);
      return { pre: "", hit: "", post: text.slice(0, n) + (n < text.length ? "…" : "") };
    }
    var i = f.i, a = Math.max(0, i - 40), b = Math.min(text.length, i + f.n + 80);
    return { pre: (a > 0 ? "…" : "") + text.slice(a, i), hit: text.slice(i, i + f.n), post: text.slice(i + f.n, b) + (b < text.length ? "…" : "") };
  }
  /* The query's words match with or without a space or hyphen between them ("link death" finds
     LinkDeath, "half-cover" finds Half Cover). A match at the start of a word outranks one in the
     middle of a word, and a query under three letters takes word starts only ("xp" is not
     Expanding). Ranked: a title that IS the query (or its plural), a title with it at a word
     start, a title with it mid-word, then text at a word start, then text mid-word; titles first,
     as before, and book order within a rank. Inside a title rank a panel comes a step ahead of an
     entry and a named line a step behind one, so the one-line "Vigor: Subtract damage from Vigor
     first." never outranks the Vigor panel; hits sharing a rank and a title sit together at the
     first one's place, led by the one the name's registered term points at (Difficult Terrain's
     Movement line before the Move action's cost row), then book order. */
  function matcher(q) {
    var words = String(q || "").trim().split(/[\s\-]+/).filter(Boolean);
    if (!words.length) return null;
    var core = words.map(esc).join("[\\s\\-]*");
    var wordRx = new RegExp("(^|[^a-z0-9])(" + core + ")", "i"), anyRx = new RegExp(core, "i");
    var exactRx = new RegExp("^" + core + "(?:s|es)?$", "i"), short = words.join("").length < 3;
    return {
      exact: function (s) { return exactRx.test(String(s || "").trim()); },
      find: function (s) {
        s = String(s || "");
        var m = wordRx.exec(s);
        if (m) return { i: m.index + m[1].length, n: m[2].length, word: true };
        if (short) return null;
        m = anyRx.exec(s);
        return m ? { i: m.index, n: m[0].length, word: false } : null;
      }
    };
  }
  function search(q, pt) {
    pt = pt || portal();
    if (String(q || "").trim().length < 2) return [];
    var M = matcher(q);
    if (!M) return [];
    var hits = [];
    function add(score, h) { h.score = score; h.seq = hits.length; hits.push(h); }
    function titleScore(t, f) { return M.exact(t) ? 0 : f.word ? 1 : 2; }
    chaptersSorted().forEach(function (ch) {
      panelsOf(ch, pt).forEach(function (p) {
        if (!ready(p)) return;
        var ix = pIndex(p, pt);
        if (ix.empty) return;
        // a chapter and its only panel can share a title ("Paying the Crew"): said once
        var crumb = p.title.toLowerCase() === ch.title.toLowerCase() ? ch.title : ch.title + " / " + p.title, any = false;
        var pf = M.find(p.title);
        if (pf) { any = true; add(titleScore(p.title, pf) - 0.25, { anchor: p.id, title: p.title, crumb: ch.title, snip: null }); }
        ix.entries.forEach(function (e) {
          var tf = M.find(e.title), xf = M.find(bare(e));
          // a named line carries its entry's name, so six "The Effect" lines read Block, Dodge, Ward...
          var ec = e.sub && e.parent && e.parent !== e.title ? crumb + " / " + e.parent : crumb;
          // a panel's first entry can share its title ("Medical Treatment"): the panel hit says it once
          if (tf && pf && !e.sub && e.title.toLowerCase() === p.title.toLowerCase()) return;
          if (tf) { any = true; add(titleScore(e.title, tf) + (e.sub ? 0.25 : 0), { anchor: e.anchor, title: e.title, crumb: ec, snip: snippet(bare(e), xf) }); }
          // a sub-entry's text is already its parent entry's text, so only its name is a hit of its own
          else if (!e.sub && xf) { any = true; add(xf.word ? 3 : 4, { anchor: e.anchor, title: e.title, crumb: ec, snip: snippet(bare(e), xf) }); }
        });
        var pt2 = any ? null : M.find(ix.text);
        if (pt2) add(pt2.word ? 3 : 4, { anchor: p.id, title: p.title, crumb: ch.title, snip: snippet(ix.text, pt2) });
      });
    });
    var first = {}, home = {};
    Object.keys(_aliases).forEach(function (k) { home[k.toLowerCase()] = _aliases[k]; });
    hits.forEach(function (h) {
      var k = h.score + "|" + h.title.toLowerCase();
      if (first[k] == null) first[k] = h.seq;
      h.gseq = first[k];
      h.home = home[h.title.toLowerCase()] === h.anchor ? 0 : 1;
    });
    hits.sort(function (a, b) { return a.score - b.score || a.gseq - b.gseq || a.home - b.home || a.seq - b.seq; });
    return hits.map(function (h) { return { anchor: h.anchor, title: h.title, crumb: h.crumb, snip: h.snip }; });
  }
  var MAX_HITS = 40;
  function searchBlock(pt, st) {
    var results = el("div.cx-results");
    function paint() {
      clear(results);
      var q = st.search.trim();
      if (q.length < 2) return;
      var hits = search(q, pt);
      results.appendChild(el("div.cx-count", { text: hits.length ? (hits.length + (hits.length === 1 ? " MATCH" : " MATCHES") + (hits.length > MAX_HITS ? ", FIRST " + MAX_HITS + " SHOWN" : "")) : "NO MATCHES" }));
      hits.slice(0, MAX_HITS).forEach(function (h) {
        results.appendChild(el("button.cx-hit", { type: "button", dataset: { cxHit: h.anchor }, onclick: function () { open(h.anchor); } }, [
          el("div.cx-hit-p", { text: h.crumb }),
          el("div.cx-hit-t", { text: h.title }),
          h.snip ? el("div.cx-hit-s", null, [document.createTextNode(h.snip.pre), h.snip.hit ? el("mark", { text: h.snip.hit }) : null, document.createTextNode(h.snip.post)]) : null
        ]));
      });
    }
    var input = el("input.cx-search-in", { type: "text", value: st.search, placeholder: "Search the Codex…", autocomplete: "off",
      "aria-label": "Search the Codex",
      oninput: function (e) { st.search = e.target.value; paint(); },
      onkeydown: function (e) { if (e.key === "Escape" && st.search) { e.preventDefault(); st.search = ""; e.target.value = ""; paint(); } } });
    paint();
    return el("div.cx-search", null, [input, results]);
  }

  /* ---- the page ------------------------------------------------------------ */
  function tagOf(p, ctx) {
    if (typeof p.tag !== "function") return p.tag || null;
    try { return p.tag(ctx); } catch (e) { return null; }
  }
  function panelNode(p, ctx, st) {
    var open = !!st.open[p.id], built = null;
    if (open) {
      built = runBuild(p, ctx);
      // empty after all: drop it and close it, so a panel whose data comes back later is not stuck open
      if (!built.nodes.length) { delete st.open[p.id]; return null; }
    } else if (typeof p.when !== "function" && pIndex(p, ctx.portal).empty) {
      /* "return [] when the data is missing" with no `when`: the index build (cached, and
         the one has() runs anyway) says so, and the render build stays lazy */
      return null;
    }
    var tag = tagOf(p, ctx);
    return el("div.panel", { style: { marginBottom: "12px" }, dataset: { cxPanel: p.id } }, [
      el("div.panel-h.clickable", { onclick: function () { st.open[p.id] = !open; EN.app.render(); } }, [
        el("h3", { text: p.title }), el("span.collapse-caret", { text: open ? "▾" : "▸" }), tag ? el("span.tag", { text: tag }) : null
      ]),
      // collapsed: no body at all, which is the laziness (the build above never ran)
      open ? el("div.panel-b", null, built.nodes) : null
    ]);
  }
  function render(mount) {
    clear(mount);
    var pt = portal(), st = stateFor(pt), ctx = makeCtx(pt, false, false);
    var blocks = [];
    // the h1 sits alone in this row so app.js cardButton can put the GM's Card beside it on Admin
    blocks.push(el("div.row.between.wrap", { style: { marginBottom: "14px", gap: "8px", alignItems: "center" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" }, html: 'CODEX <span class="dim3" style="font-size:13px">// rules reference library</span>' })
    ]));
    blocks.push(searchBlock(pt, st));
    var strip = el("nav.cx-chaps", { "aria-label": "Codex chapters" });
    blocks.push(strip);
    var first = true, gmHead = false;
    chaptersSorted().forEach(function (ch) {
      var nodes = panelsOf(ch, pt).filter(ready).map(function (p) { return panelNode(p, ctx, st); }).filter(Boolean);
      if (!nodes.length) return;
      // the Game Master's chapters gather under one heading of their own on the Admin desktop
      if (ch.audience === "gm" && !gmHead) {
        gmHead = true;
        blocks.push(el("div.cx-part", null, [el("span", { text: "Game Master" }), el("span.line")]));
        // a zero-height break, so the label and its chapters start a row of their own
        strip.appendChild(el("span.cx-chaps-br"));
        strip.appendChild(el("span.cx-chaps-sep", { text: "Game Master" }));
      } else if (!first) blocks.push(el("div", { style: { height: "10px" } }));
      first = false;
      var head = EN.ui.sectionTitle(ch.title);
      head.setAttribute("data-cx-chapter", ch.id);
      blocks.push(head);
      nodes.forEach(function (n) { blocks.push(n); });
      strip.appendChild(chapterButton(ch));
    });
    mount.appendChild(el("div", null, blocks));
    fitPage(mount);
  }
  /* The chapter strip under the search: a small button per drawn chapter that scrolls to its
     heading, as open() scrolls to an entry. Only drawn chapters get one, so the Freelancer
     desktop lists its own and the Game Master ones follow their label on Admin. */
  function chapterButton(ch) {
    return el("button.btn.sm.cx-chap", { type: "button", text: ch.title, dataset: { cxJump: ch.id }, onclick: function () {
      var list = (document.getElementById("view") || document.body).querySelectorAll("[data-cx-chapter]");
      for (var i = 0; i < list.length; i++) if (list[i].getAttribute("data-cx-chapter") === ch.id) { scrollToNode(list[i]); return; }
    } });
  }

  /* =======================================================================
     THE FOUNDATION CHAPTERS. Every panel below kept its id, its text and its
     order from the single-page Codex it was; Vehicles and Economy & Rewards
     moved from Combat Rules into Vehicles & Economy.
     ======================================================================= */

  /* ---- The Basics ------------------------------------------------------
     The primer chapter, first because it is what you read first. Every number
     it quotes is pulled from wherever that number already lives rather than
     restated here: the Caliber ladder from EN.rules, and every class resource
     from EN.classes. Rolls, Edge and Snag, and Margin are not here at all,
     because Core Resolution below already owns them in full. See the header of
     app/data/basics.js. */
  function calRows() {
    var by = (EN.rules || {}).caliberByLevel;
    if (!by) return [];
    /* The ladder is stored one entry per level. Printed one row per level it is ten rows of
       mostly repetition, so consecutive levels sharing a Caliber are folded into a range, which
       is how the book prints it and how it stays right if the ladder is ever reshaped. */
    var lv = Object.keys(by).map(Number).sort(function (a, b) { return a - b; });
    var rows = [], run = null;
    lv.forEach(function (n) {
      if (run && by[n] === run.cal) { run.hi = n; return; }
      if (run) rows.push(run);
      run = { lo: n, hi: n, cal: by[n] };
    });
    if (run) rows.push(run);
    return rows.map(function (r) {
      return [r.lo === r.hi ? String(r.lo) : r.lo + " to " + r.hi, String(r.cal)];
    });
  }
  function resourceRows() {
    var cls = EN.classes || {};
    // sorted rather than listed, so a class added later shows up here with no edit
    return Object.keys(cls).sort().map(function (k) {
      var c = cls[k] || {}, r = c.resource || {};
      if (!r.name) return null;
      return [c.name || k, r.name, r.attribute || "", r.maxFormula || "", c.saveFocus || ""];
    }).filter(Boolean);
  }
  function hasBasics() { return !!EN.basics; }
  var basicsChapter = { id: "basics", title: "The Basics", order: 10, audience: "both", panels: [
    { id: "bx-start", title: "Start Here", tag: "THE VOCABULARY", order: 10, when: hasBasics, build: function (ctx, K) {
      var B = EN.basics;
      return [
        K.proseBlock(B.intro),
        K.subTitle("Reading a Class Entry"),
        K.proseBlock(B.together.intro),
        el("div.muted-box", { style: { margin: "0 0 10px", padding: "10px 12px" } }, [
          el("p", { style: { margin: 0, fontSize: "13px", fontStyle: "italic", color: "var(--text2)", lineHeight: "1.5" }, text: B.together.example })
        ]),
        K.proseBlock(B.together.reading),
        K.proseBlock(B.together.closing),
        // the same footnote style, now through linkify so "Core Resolution below" is a link
        K.note(B.covered, { margin: "0" })
      ];
    } },
    { id: "bx-space", title: "Space, Speed & Area", tag: "FIVE FEET TO A SPACE", order: 20, when: hasBasics, build: function (ctx, K) {
      var B = EN.basics;
      /* The interactive template is a tool for the Codex page itself: its own module, its own
         local redraw (it never calls EN.app.render(), so its controls are never torn out from
         under the pointer). The peek drawer and the index read the rules around it. */
      var aoe = !ctx.inPeek && !ctx.indexing && EN.aoeGrid && EN.aoeGrid.build;
      return [
        K.proseBlock(B.space.intro),
        /* the book's closing pointer (Part 1, Speed): "The Combat chapter handles the rest:
           difficult terrain, falling, and what happens when something shoves you into a wall."
           Each of the three links its own entry in Combat Rules ("difficult terrain" through
           its alias); the Shove entry ends on a pointer to where a shoved body lands */
        K.proseBlock(B.space.speed, { terms: { "falling": "mv-fall/falling-and-forced-movement", "shoves": "mv-maneuvers/shove" } }),
        K.subTitle("Areas of Effect"),
        K.proseBlock(B.space.areaIntro),
        el("div", null, B.space.shapes.map(function (sh) { return K.ruleBlock(sh.name, sh.text); })),
        // "Combat Rules below has the details, including how a blast behaves when there's cover
        // in the way": that detail is the third line of Cover and Defense, so it links there
        K.proseBlock(B.space.areaNote, { terms: { "Combat Rules": "ref-cover/cover-and-defense" } }),
        aoe ? K.subTitle("Try It On A Grid") : null,
        aoe ? EN.aoeGrid.build() : null
      ];
    } },
    { id: "bx-caliber", title: "Caliber", tag: "THE GROWTH DIAL", order: 30, when: hasBasics, build: function (ctx, K) {
      var B = EN.basics;
      return [
        K.proseBlock(B.caliber.intro),
        K.refTable(["Class Level", "Caliber"], calRows(), [1]),
        K.proseBlock(B.caliber.reading),
        K.subTitle("Saving Throw Focus"),
        K.proseBlock(B.caliber.focus)
      ];
    } },
    { id: "bx-res", title: "Class Resources", tag: function () { return resourceRows().length + " CLASSES"; }, order: 40, when: hasBasics, build: function (ctx, K) {
      var B = EN.basics;
      return [
        K.proseBlock(B.resources.intro),
        K.refTable(["Class", "Resource", "Attribute", "Maximum", "Save Focus"], resourceRows(), [1]),
        K.proseBlock(B.resources.refresh),
        K.proseBlock(B.resources.note)
      ];
    } },
    { id: "bx-flow", title: "The Flow", tag: "SHAPERS & INVOCATIONS", order: 50, when: hasBasics, build: function (ctx, K) {
      var B = EN.basics;
      return [
        K.proseBlock(B.flow.intro),
        K.proseBlock(B.flow.invocation),
        K.proseBlock(B.flow.check),
        K.proseBlock(B.flow.overdraw),
        K.subTitle("Unattuned"),
        K.proseBlock(B.flow.unattuned)
      ];
    } },
    { id: "bx-grid", title: "The #GRID", tag: "NODES, LINKS & CIPHERS", order: 60, when: hasBasics, build: function (ctx, K) {
      var B = EN.basics;
      return [
        K.proseBlock(B.grid.intro),
        K.proseBlock(B.grid.who),
        K.subTitle("Terms"),
        el("div", null, B.grid.terms.map(function (t) { return K.ruleBlock(t.name, t.text); }))
      ];
    } }
  ] };

  /* ---- Core Resolution, from EN.resolution ------------------------------ */
  function hasRz() { return !!EN.resolution; }
  function bold(text) { return el("p", { style: { margin: "0 0 4px", fontSize: "13px", color: "var(--text)", fontWeight: 600 }, text: text }); }
  function mono(text) { return el("p", { style: { margin: "0 0 6px", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)" }, text: text }); }
  var resolutionChapter = { id: "resolution", title: "Core Resolution", order: 20, audience: "both", panels: [
    // 1 · Resolution Basics
    { id: "rz-basics", title: "Resolution Basics", tag: "METHOD & STAKES", order: 10, when: hasRz, build: function (ctx, K) {
      var Rz = EN.resolution;
      return [
        K.proseBlock(Rz.intro),
        K.subTitle("Core Concepts"),
        K.refTable(["Term", "Summary"], Rz.coreConcepts.map(function (c) { return [c.term, c.text]; }), [0]),
        K.subTitle("Choosing a Method"),
        bold(Rz.methodSplit.d20Intro),
        K.proseBlock(Rz.methodSplit.d20Uses.map(function (s) { return "- " + s; }).join("\n")),
        bold(Rz.methodSplit.poolIntro),
        K.proseBlock(Rz.methodSplit.poolUses.map(function (s) { return "- " + s; }).join("\n")),
        K.ruleBlock("In Combat, Stay on d20", Rz.methodSplit.rule),
        K.subTitle("Quick Lookup"),
        K.refTable(["Situation", "Method"], Rz.methodSplit.lookup.map(function (r) { return [r.situation, r.method]; }), [1]),
        K.note(Rz.methodSplit.tiebreaker, { margin: "6px 0 0" })
      ];
    } },
    // 2 · d20 Checks
    { id: "rz-d20", title: "d20 Checks", tag: "ATTACKS · SAVES · SNAP", order: 20, when: hasRz, build: function (ctx, K) {
      var Rz = EN.resolution;
      return [
        K.proseBlock(Rz.d20.process),
        K.ruleBlock("Static Modifier Cap (+15)", Rz.d20.modCap),
        K.subTitle("Difficulty Reference"),
        K.refTable(["Task", "DC", "Example"], Rz.d20.dcTable.map(function (r) { return [r.task, r.dc, r.example]; }), [0, 1]),
        K.subTitle("Combat Rolls"),
        K.refTable(["Roll", "Formula", "Target"], Rz.d20.combatRolls.map(function (r) { return [r.type, r.formula, r.target]; }), [0]),
        K.subTitle("Critical Rolls"),
        K.refTable(["Roll", "Effect"], Rz.d20.crits.map(function (r) { return [r.roll, r.effect]; }), [0])
      ];
    } },
    // 3 · Dice Pools
    { id: "rz-pool", title: "Dice Pools", tag: "EXTENDED · OUT OF COMBAT", order: 30, when: hasRz, build: function (ctx, K) {
      var Rz = EN.resolution;
      return [
        K.proseBlock(Rz.pool.intro),
        K.refTable(["Color", "Rolls d10s up to", "Dice cap"], Rz.pool.colorTable.map(function (r) { return [r.color, r.d10Range, r.diceCap]; }), [0]),
        K.ruleBlock("Pushing into d12s", Rz.pool.d12Rules),
        K.subTitle("Building Edge Dice"),
        K.proseBlock(Rz.pool.edgeIntro),
        K.refTable(["Source", "Edge Dice"], Rz.pool.edgeBuild.map(function (r) { return [r.source, r.dice]; }), [0]),
        K.note(Rz.pool.baseNote),
        K.subTitle("Edge Past 10"),
        K.proseBlock(Rz.pool.edgePast10Intro),
        K.refTable(["Edge Built", "Pool"], Rz.pool.edgePast10.map(function (r) { return [r.built, r.pool]; }), [1]),
        K.note(Rz.pool.edgeCeiling),
        K.subTitle("Assigning Snag Dice"),
        K.proseBlock(Rz.pool.snagIntro),
        K.refTable(["Risk Level", "Snag Dice", "Description"], Rz.pool.snagAssign.map(function (r) { return [r.risk, r.dice, r.desc]; }), [0, 1]),
        K.subTitle("Converting a Flat DC"),
        K.proseBlock(Rz.pool.snagFromDcIntro),
        K.subTitle("Snag Past 5"),
        K.proseBlock(Rz.pool.snagPast5Intro),
        K.refTable(["Total Snag", "Pool"], Rz.pool.snagPast5.map(function (r) { return [r.total, r.pool]; }), [1]),
        K.note(Rz.pool.snagCeiling),
        K.subTitle("Rolling Procedure"),
        K.proseBlock(Rz.pool.procedure),
        K.note("Example: " + Rz.pool.example, { margin: "0" })
      ];
    } },
    // 4 · Success Margin & Consequence
    { id: "rz-margin", title: "Success Margin & Consequence", tag: "READING THE ROLL", order: 40, when: hasRz, build: function (ctx, K) {
      var Rz = EN.resolution;
      return [
        K.subTitle("d20 Success Margin"),
        mono(Rz.margins.d20Intro),
        K.refTable(["Margin", "Result", "Description"], Rz.margins.d20.map(function (r) { return [r.margin, r.result, r.desc]; }), [0, 1]),
        K.subTitle("Dice Pool Success Margin"),
        mono(Rz.margins.poolIntro),
        K.refTable(["Margin", "Result", "Description"], Rz.margins.pool.map(function (r) { return [r.margin, r.result, r.desc]; }), [0, 1]),
        K.ruleBlock("Match the Cost to the Scene", Rz.margins.sceneRule),
        K.subTitle("Consequence by Scene Type"),
        K.refTable(["Scene Type", "Appropriate Consequences"], Rz.consequenceByScene.map(function (r) { return [r.scene, r.consequences]; }), [0])
      ];
    } },
    // 5 · Social Consequences & Cost Tracks
    { id: "rz-social", title: "Social Consequences & Cost Tracks", tag: "FATIGUE · STRAIN · FALLOUT", order: 50, when: hasRz, build: function (ctx, K) {
      var Rz = EN.resolution;
      var guide = el("p", { style: { margin: "0 0 8px", fontSize: "13px", color: "var(--text2)", lineHeight: "1.5" } });
      linkify(guide, Rz.costTracks.guidance);
      return [
        K.proseBlock(Rz.social.intro),
        K.refTable(["Social Cost", "Effect"], Rz.social.costs.map(function (r) { return [r.cost, r.effect]; }), [0]),
        K.ruleBlock("Social Fallout Rule", Rz.social.falloutRule),
        // the social chapter's own ten-row table is the menu a Mixed Result picks from
        K.seeAlso("The full menu, and where it is spent:", [["so-fallout", "Social Fallout Table"], ["so-outcomes", "Social Margins & Outcomes"], ["so-sitdown", "The Sit-Down"]]),
        K.subTitle("Fatigue vs Strain vs Social Fallout"),
        K.refTable(["Track", "Meaning"], Rz.costTracks.tracks.map(function (r) { return [r.term, r.meaning]; }), [0]),
        guide,
        K.subTitle("Automatic Success and Failure"),
        el("div", null, Rz.autoResolve.map(function (a) { return K.ruleBlock(a.name, a.text); }))
      ];
    } },
    // 6 · Edge & Snag
    { id: "rz-edge", title: "Edge & Snag", tag: "MOMENTUM & FRICTION", order: 60, when: hasRz, build: function (ctx, K) {
      var Rz = EN.resolution;
      return [
        K.proseBlock(Rz.edgeSnag.intro),
        K.subTitle("d20 Method"),
        K.proseBlock(Rz.edgeSnag.d20),
        K.ruleBlock("Stacking (d20)", Rz.edgeSnag.d20Stacking),
        K.subTitle("Dice Pool Method"),
        K.proseBlock(Rz.edgeSnag.pool),
        K.subTitle("Common Sources"),
        K.refTable(["Arena", "Edge", "Snag"], Rz.edgeSnag.sources.map(function (r) { return [r.area, r.edge, r.snag]; }), [0]),
        K.note(Rz.edgeSnag.sourcesNote),
        K.ruleBlock("GM Guidance", Rz.edgeSnag.gmGuidance)
      ];
    } },
    // 7 · Collaborative & Opposed Checks
    { id: "rz-collab", title: "Collaborative & Opposed Checks", tag: "CONTEST · GROUP · HELP", order: 70, when: hasRz, build: function (ctx, K) {
      var Co = EN.resolution.collaborative;
      return [
        K.proseBlock(Co.intro),
        K.ruleBlock("Method Choice", Co.methodChoice),
        K.subTitle("Contested Actions"),
        K.proseBlock(Co.contested.intro),
        K.ruleBlock("d20 Process", Co.contested.d20Process),
        K.ruleBlock("Dice Pool Process", Co.contested.poolProcess),
        K.refTable(["d20 Margin", "Pool Margin", "Result", "Description"], Co.contested.outcomes.map(function (r) { return [r.d20, r.pool, r.result, r.desc]; }), [2]),
        K.subTitle("Group Checks"),
        K.proseBlock(Co.group.intro),
        K.ruleBlock("d20 Process", Co.group.d20Process),
        K.ruleBlock("Dice Pool Process", Co.group.poolProcess),
        K.refTable(["d20 Avg Margin", "Pool Net Margin", "Result", "Description"], Co.group.outcomes.map(function (r) { return [r.d20, r.pool, r.result, r.desc]; }), [2]),
        K.note(Co.group.difficulty),
        /* the Help Action section is one entry wrapped round its own blocks, so "(see Help
           Action)" in the Dice Pools table and every "Help Action" in class text can peek the
           whole rule. entry() claims its slug after its children, so theirs do not move. */
        K.entry("help-action", "Help Action", [
          K.subTitle("Help Action"),
          K.proseBlock(Co.help.intro),
          K.ruleBlock("Timing & Cost", Co.help.timing),
          K.ruleBlock("d20 Method", Co.help.d20),
          K.ruleBlock("Dice Pool Method", Co.help.pool),
          K.ruleBlock("Limitations", Co.help.limits)
        ], { text: Co.help.intro }),   // the blocks inside are entries of their own for the search
        K.subTitle("Passive Checks"),
        K.proseBlock(Co.passive)
      ];
    } }
  ] };

  /* ---- Combat Rules, from EN.combat and EN.rules -------------------------
     Every EN.combat rule is read here, in the place a reader looks for it:
     the round and its timing, then actions, defenses, cover, the attack, how
     damage lands, the damage types, Size and improvised weapons. Several of
     these (the sequence, the Defense formula, the Active Defense core rules,
     the cover intro, Shield Durability, the damage order, Resistance and the
     reach cap) were carried in EN.combat and rendered nowhere, or only on the
     Freelancer tab, so the GM could not read them at all. */
  function hasCombat() { return !!EN.combat; }
  // the Opportunity Attacks rules close the Impulse Action entry in the data; drawn as an
  // entry of their own so "See Opportunity Attacks below" has somewhere to land
  var OPP = "\n\nOpportunity Attacks\n\n";
  /* rows of the Move cost table whose full rules sit in the movement panels (Difficult
     terrain and Through a body link through their own aliases) */
  var MOVE_TERMS = { "Jump or leap": "mv-jump/jump-cost", "Climb or vault": "mv-move/vault-climb" };
  var combatChapter = { id: "combat", title: "Combat Rules", order: 40, audience: "both", panels: [
    { id: "ref-round", title: "Initiative & the Round", tag: "THE COMBAT SEQUENCE", order: 5, when: hasCombat, build: function (ctx, K) {
      var C = EN.combat, T = (EN.rules || {}).time;
      var kids = [];
      if (C.combatSequence) kids.push(K.ruleBlock("Combat Sequence", C.combatSequence));
      /* EN.rules.time is the book's flat conversion, stated in its own words in the comment
         above it in data/rules.js: a round is six to ten seconds, and "a duration of 1 minute
         is treated as 10 rounds of active combat". */
      if (T && T.roundsPerMinute) kids.push(K.ruleBlock("Rounds and Time",
        (T.roundSeconds ? "A round is " + T.roundSeconds + " seconds of action. " : "")
        + "A duration of 1 minute is treated as " + T.roundsPerMinute + " rounds of active combat."));
      return kids;
    } },
    { id: "ref-actions", title: "Action Economy", tag: "TURN STRUCTURE", order: 10, when: hasCombat, build: function (ctx, K) {
      var C = EN.combat;
      var kids = [];
      (C.actionTypes || []).forEach(function (a) {
        var text = String(a.text || ""), i = text.indexOf(OPP);
        if (i < 0) { kids.push(K.ruleBlock(a.name, text, null, a.name === "Move" ? { terms: MOVE_TERMS } : null)); return; }
        kids.push(K.ruleBlock(a.name, text.slice(0, i)));
        kids.push(K.ruleBlock("Opportunity Attacks", text.slice(i + OPP.length)));
      });
      return kids
        .concat(C.tradingMove ? [K.ruleBlock("Trading Your Move", C.tradingMove)] : [])
        .concat((C.commonActions || []).length ? [K.subTitle("Common Actions")] : [])
        .concat((C.commonActions || []).map(function (a) { return K.ruleBlock(a.name, a.text, a.cost); }))
        // the Flow Attack and Flow Save DC rows above both read this modifier
        .concat(C.flowModifierNote ? [K.ruleBlock("Flow Modifier", C.flowModifierNote)] : []);
    } },
    { id: "ref-def", title: "Active Defenses", tag: "IMPULSE ACTIONS", order: 20, when: hasCombat, build: function (ctx, K) {
      var C = EN.combat;
      return (C.defense ? [K.ruleBlock("Defense", C.defense)] : [])
        .concat(C.activeDefenseRules ? [K.ruleBlock("Active Defense Rules", C.activeDefenseRules)] : [])
        .concat((C.activeDefenses || []).map(function (a) { return K.ruleBlock(a.name, a.text, a.cost); }))
        .concat(C.shieldDurability ? [K.ruleBlock("Shield Durability", C.shieldDurability)] : [])
        .concat(C.defenseNotes ? [K.ruleBlock("Conditions and Defense", C.defenseNotes)] : []);
    } },
    { id: "ref-cover", title: "Cover & Sight", tag: "DEFENSE MODIFIERS", order: 30, when: hasCombat, build: function (ctx, K) {
      var C = EN.combat;
      return (C.coverIntro ? [K.ruleBlock("Cover", C.coverIntro)] : [])
        .concat((C.cover || []).map(function (cv) { return K.ruleBlock(cv.name, cv.effect); }))
        .concat(C.coverAndDefense ? [K.ruleBlock("Cover and Defense", C.coverAndDefense)] : [])
        .concat(C.shieldsAndCover ? [K.ruleBlock("Shields and Cover", C.shieldsAndCover)] : [])
        .concat(C.lineOfSight ? [K.ruleBlock("Line of Sight", C.lineOfSight)] : [])
        .concat(C.obscurement ? [K.ruleBlock("Obscurement", C.obscurement)] : [])
        .concat(C.tremorSense ? [K.ruleBlock("Tremor Sense", C.tremorSense)] : [])
        /* Destructible Cover and its material table were carried in EN.combat but rendered
           nowhere, so a player could not reach either. They print in this order in the book:
           Destructible Cover, the table it refers to, Effects and Objects, Overflow Damage,
           and then the vehicle mapping over in Vehicles and Chases. The table is an entry
           under the name the rules cite it by ("uses the Cover Material Table as normal"). */
        .concat(C.destructibleCover ? [K.ruleBlock("Destructible Cover", C.destructibleCover)] : [])
        .concat((C.coverMaterials || []).length
          /* each category's reading ("No physical protection. Obscures vision only.") is a second
             two-column table under the first, so the four-column table stays phone-width */
          ? [K.entry("cover-material-table", "Cover Material Table", [K.refTable(["Category", "Structure", "Integrity", "Examples"],
              C.coverMaterials.map(function (m) { return [m.category, String(m.structure), String(m.integrity), m.examples]; }), [0]),
              C.coverMaterials.some(function (m) { return m.meaning; })
                ? K.refTable(["Category", "What it means"], C.coverMaterials.filter(function (m) { return m.meaning; }).map(function (m) { return [m.category, m.meaning]; }), [0])
                : null])]
          : [])
        .concat(C.effectsAndObjects ? [K.ruleBlock("Effects and Objects", C.effectsAndObjects)] : [])
        .concat(C.overflowDamage ? [K.ruleBlock("Overflow Damage", C.overflowDamage)] : [])
        .concat(C.vehiclesAsCover ? [K.ruleBlock("Vehicles as Cover", C.vehiclesAsCover)] : []);
    } },
    { id: "ref-attack", title: "Attack Resolution", tag: "MARGINS & CRITS", order: 40, when: hasCombat, build: function (ctx, K) {
      var C = EN.combat;
      return (C.attackResolution ? [K.ruleBlock("Resolution", C.attackResolution)] : [])
        .concat((C.attackMargins || []).map(function (m) { return K.ruleBlock(m.margin + " · " + (m.result || ""), m.outcome); }))
        // how far a melee attack reaches belongs beside the attack it limits
        .concat(C.reachCapText ? [K.ruleBlock("Reach Caps", C.reachCapText)] : []);
    } },
    /* How a hit becomes lost Vigor, Vitality and Wounds, and what Resistance,
       Vulnerability and Immunity do to it on the way. */
    { id: "ref-damage", title: "Damage & Mitigation", tag: "HIT · MITIGATE · DR · DEPLETE", order: 45, when: function () { return !!(EN.combat && (EN.combat.damagePipeline || EN.combat.damageTypeRules)); },
      build: function (ctx, K) {
        var C = EN.combat;
        return (C.damagePipeline ? [K.ruleBlock("Damage Order", C.damagePipeline)] : [])
          .concat(C.damageTypeRules ? [K.ruleBlock("Resistance, Vulnerability and Immunity", C.damageTypeRules)] : []);
      } },
    { id: "ref-dmg", title: "Damage Types", tag: function () { return ((EN.combat || {}).damageTypes || []).length + " TYPES"; }, order: 50, when: hasCombat,
      build: function (ctx, K) {
        var C = EN.combat;
        // a pointer, not a copy: the type rules themselves live in Damage & Mitigation
        return (C.damageTypeRules ? [K.note("What Resistance, Vulnerability and Immunity do to each type is under Damage & Mitigation.")] : [])
          .concat((C.damageTypes || []).map(function (t) { return K.ruleBlock(t.name, t.text); }));
      } },

    /* Size: comparative, derived from height, and its whole mechanical reach is
       the Encumbrance Threshold plus comparison. It touches no d20 roll. */
    { id: "ref-size", title: "Size", tag: "DERIVED FROM HEIGHT", order: 60, when: function () { return !!(EN.rules && EN.rules.sizeBands); },
      build: function (ctx, K) {
        var R = EN.rules, ruleBlock = K.ruleBlock;
        var kids = [];
        kids.push(ruleBlock("The Scale", (R.sizes || []).join(", ") + ". Size is comparative: \"one Size larger\" means one step up this list. It is derived from height, never chosen directly, and there is no default: an unstatted NPC, drone, or vehicle does not silently become Medium."));
        kids.push(ruleBlock("Height Bands", R.sizeBands.map(function (b) {
          return b.size + ": " + b.imperial + " (" + b.metric + ")";
        }).join("\n") + "\n\nA height landing exactly on a boundary takes the larger category, so 2 ft is Small, 4 ft is Medium and 8 ft is Large.\n\n" + (R.sizeBandNote || "")));
        kids.push(ruleBlock("Grid Footprint", (R.sizes || []).map(function (s) {
          var f = (R.sizeFootprint || {})[s]; return f ? s + ": " + f.square + " | hex: " + f.hex : null;
        }).filter(Boolean).join("\n") + "\n\nA body filling more than one space is measured from the nearest of its spaces, in both directions, which governs Range, Reach and line of sight. An effect centred on you starts from whichever of your spaces you choose when you use it, because Large on a hex grid is three hexes meeting at a corner and has no centre hex."));
        kids.push(ruleBlock("Small and Large", ["Small", "Medium", "Large"].map(function (s) {
          var t = (R.sizeTraits || {})[s]; return t ? s + ": " + t.text : null;
        }).filter(Boolean).join("\n") + "\n\nNeither touches a d20 roll. Size grants no Edge, no Snag, no Defense modifier, and no Speed modifier apart from the squeeze below."));
        if (R.tightGeometry) kids.push(ruleBlock("Tight Geometry", R.tightGeometry));
        var SC = R.sizeComparison || {};
        if (SC.maneuvers) kids.push(ruleBlock("Shove, Trip and Grapple", SC.maneuvers));
        if (SC.maneuvers) kids.push(K.seeAlso("The maneuvers themselves:", [["mv-maneuvers", "Shove, Trip & Grapple"]]));
        if (SC.dragLift) kids.push(ruleBlock("Dragging and Lifting", SC.dragLift));
        if (SC.dragLift) kids.push(K.seeAlso("Speed while hauling a load:", [["mv-move/dragging-pushing-and-pulling", "Dragging, Pushing, and Pulling"]]));
        if (SC.occupiedSpace) kids.push(ruleBlock("Moving Through an Occupied Space", SC.occupiedSpace));
        if ((SC.bodyGate || []).length) kids.push(ruleBlock("The Body Gate", SC.bodyGate.map(function (r) {
          return r.theirSize + " | Body " + r.body + " | " + r.holding;
        }).join("\n")));
        // one definition, rendered here for Size context and in full under Improvised Weapons
        if ((((R.improvised || {}).meatShield) || []).length) kids.push(ruleBlock("Meat Shield",
          R.improvised.meatShield[0] + "\n\nFull rules under Improvised Weapons."));
        if ((R.sizeShiftFeatures || []).length) kids.push(ruleBlock("Features That Shift Effective Size",
          R.sizeShiftFeatures.map(function (f) { return f.name + " (" + f.lineage + "): " + f.effect; }).join("\n")
          + "\n\nEach shifts Size for its stated purpose only. None changes your actual Size, footprint, or Encumbrance beyond what it says."));
        return kids;
      } },

    { id: "ref-improvised", title: "Improvised Weapons", tag: "ANYTHING IN REACH", order: 70, when: function () { return !!(EN.rules && EN.rules.improvised); },
      build: function (ctx, K) {
        var IW = EN.rules.improvised, ruleBlock = K.ruleBlock, bullets = K.bullets;
        var kids = [];
        kids.push(ruleBlock("Using Improvised Weapons", IW.intro + "\n\n" + bullets(IW.using)));
        /* The Walking Anvil steps every improvised die up one, capped at 1d12. The
           table is the only place improvised damage is stated, so a Juggernaut who
           reads it here would otherwise get the wrong number every time. Read from
           ctx.active, which is null on the Admin desktop, so the GM's Codex always
           prints the book's dice. */
        var c = ctx.active;
        var anvil = !!(c && c.subclass === "juggernaut");   // stored as the subclass key, not its display name
        var LADDER = ["1d4", "1d6", "1d8", "1d10", "1d12"];
        function stepUp(die) {
          var i = LADDER.indexOf(String(die).match(/^\d*d\d+/) ? String(die).match(/^\d*d\d+/)[0] : die);
          if (i < 0 || i >= LADDER.length - 1) return null;
          return LADDER[i + 1];
        }
        kids.push(ruleBlock("Improvised Damage", IW.damageNote
          + (anvil ? "\n\nThe Walking Anvil steps each of these up one die, to a maximum of 1d12. Your dice are shown after the arrow." : "")
          + "\n\n"
          + (IW.damage || []).map(function (d) {
              var up = anvil ? stepUp(d.die) : null;
              return d.size + " | " + d.die + (up ? " → " + up : "") + " | " + d.examples;
            }).join("\n")));
        kids.push(ruleBlock("Improvised Thrown Weapons", IW.thrownNote + "\n\n"
          + (IW.thrown || []).map(function (d) { return d.kind + " | " + d.range + " | " + d.examples; }).join("\n")));
        kids.push(ruleBlock("Desperation Attacks", bullets(IW.desperation)));
        kids.push(ruleBlock("Special Effects and Conditions", IW.specialEffects));
        kids.push(ruleBlock("People as Improvised Weapons", IW.peopleIntro + "\n\n" + IW.wieldedBody
          /* A wielded body IS an improvised weapon, so the Walking Anvil steps it too (manuscript
             2026-08-19, reversing the earlier exemption). Its 1d10 is stated in three separate
             places, the body itself plus the Bludgeon and Throw attacks, so this says it once here
             rather than rewriting prose that is correct for everyone who is not a Juggernaut. */
          + (anvil ? "\n\nThe Walking Anvil steps a wielded body up one die like any other improvised weapon: your Bludgeon and Throw each deal " + (stepUp("1d10") || "1d10") + " Bludgeoning, not 1d10." : "")
          + "\n\nWhether you can lift and swing someone at all is the Body Gate, under Size."));
        kids.push(ruleBlock("Meat Shield", bullets(IW.meatShield)));
        kids.push(ruleBlock("Bludgeon", IW.bludgeon));
        kids.push(ruleBlock("Throw", IW.throw));
        return kids;
      } }
  ] };

  /* ---- Conditions Library -----------------------------------------------
     Every condition is an entry, ref-conds/<slug(name)>, built once per render
     and opened, closed and filtered in place so typing in the filter never
     re-renders the tab. The peek drawer and the index see every entry open. */
  var conditionsChapter = { id: "conditions", title: "Conditions Library", order: 50, audience: "both", panels: [
    { id: "ref-conds", title: "Conditions", tag: function () { return (EN.conditions || []).length + " ENTRIES"; }, order: 10,
      when: function () { return !!EN.conditions; },
      build: function (ctx, K) {
        var list = EN.conditions || [];
        var st = stateFor(ctx.portal), live = !ctx.inPeek && !ctx.indexing;
        var rows = list.map(function (c) {
          var text = c.text || c.summary || "";
          var node = K.entry(slug(c.name), c.name, null, { tag: "div.feature", attrs: { style: { borderLeftColor: "var(--warn)" } }, text: text });
          var a = node.getAttribute("data-cx-entry");
          function paint() {
            clear(node);
            if (ctx.indexing) return;
            var openNow = !live || !!st.open[a];
            node.appendChild(el("h4", live ? { style: { cursor: "pointer" }, onclick: function () { st.open[a] = !st.open[a]; paint(); } } : null, [
              el("span", null, live ? EN.ui.nameCaret(c.name, openNow) : [document.createTextNode(c.name)]),
              el("span.src", { text: c.summary ? c.summary.slice(0, 60) : "" })
            ]));
            if (openNow) { var p = el("p"); linkify(p, text, { conditions: true, self: [a, "ref-conds"] }); node.appendChild(p); }
          }
          paint();
          return { c: c, node: node };
        });
        if (!live) return rows.map(function (r) { return r.node; });
        var listBox = el("div", null, rows.map(function (r) { return r.node; }));
        var none = el("p.help", { text: "No conditions match." });
        function applyFilter() {
          var q = String(st.filter["ref-conds"] || "").trim().toLowerCase(), any = false;
          rows.forEach(function (r) {
            var ok = !q || r.c.name.toLowerCase().indexOf(q) !== -1 || (r.c.summary || "").toLowerCase().indexOf(q) !== -1;
            r.node.style.display = ok ? "" : "none";
            if (ok) any = true;
          });
          if (!any && !none.parentNode) listBox.appendChild(none);
          if (any && none.parentNode) listBox.removeChild(none);
        }
        var search = el("input", { type: "text", value: st.filter["ref-conds"] || "", placeholder: "Filter conditions…", style: { maxWidth: "280px", marginBottom: "10px" },
          oninput: function (e) { st.filter["ref-conds"] = e.target.value; applyFilter(); } });
        applyFilter();
        return [search, listBox];
      } }
  ] };

  /* ---- Environmental Hazards ---------------------------------------------
     Everything here is read out of EN.hazards, the same data the live clocks
     on the Freelancer tab run on, so the reference and the sheet cannot state
     different numbers. */
  var hazardsChapter = { id: "hazards", title: "Environmental Hazards", order: 60, audience: "both", panels: [
    { id: "ref-hazards", title: "Environmental Hazards", tag: "EXPOSURE · VACUUM · CAUSTIC", order: 10, when: function () { return !!EN.hazards; },
      build: function (ctx, K) {
        var H = EN.hazards, ruleBlock = K.ruleBlock, subTitle = K.subTitle, refTable = K.refTable;
        var E = H.exposure, B = H.breath, C = H.caustic;
        var kids = [];
        if (H.intro) kids.push(K.proseBlock(H.intro));
        kids.push(ruleBlock("Exposure", E.intro + "\n\n" + E.onLeave + "\n\n" + E.fatigueNote));
        kids.push(subTitle("Severity sets the interval"));
        kids.push(refTable(["Severity", "Interval"], E.severities.map(function (s) { return [s.name, s.interval]; }), [0]));
        kids.push(subTitle("The clock"));
        kids.push(K.proseBlock("- First save in an exposure: DC " + E.baseDC
          + "\n- Each save after it: previous DC + " + E.step
          + "\n- On failure: " + E.onFail
          + "\n- On success: " + E.onSuccess
          + "\n- The escalating DC is per EXPOSURE INSTANCE, not a global counter. Two separate exposures each start at DC " + E.baseDC + "."));
        kids.push(subTitle("Per-type riders"));
        kids.push(refTable(["Type", "Rider"], E.types.map(function (t) { return [t.name, t.rider]; }), [0]));
        kids.push(subTitle("Deprivation's three clocks"));
        kids.push(refTable(["Track", "Threshold", "Runs"], E.deprivation.tracks.map(function (t) {
          return [t.name, t.crossed, "One save per day at Mild, on its own clock, stacking its own Fatigue"];
        }), [0, 1]));
        kids.push(subTitle("Vacuum"));
        kids.push(ruleBlock("Vacuum mirrors Drowning exactly",
          "Breath held: " + B.holdRule + ".\nThen, at " + B.timing + ": Body Save DC " + B.dc + ", +" + B.step + " each round."
          + "\n- On failure: take " + B.woundsOnFail + " Wound."
          + "\n- On failure and at or below half max Wounds: also fall Unconscious."
          + "\n- Wounds reach 0 while exposed: death."
          + "\n\n" + (B.kinds[1].riders || []).join("\n")
          + "\n\nBoth conditions are built from one spec in the data, so if Drowning changes, Vacuum changes with it."));
        kids.push(ruleBlock("Sealing against vacuum", B.vacuumSeal.rule + "\n\n"
          + B.vacuumSeal.paths.map(function (p) { return p.name + ": " + p.how; }).join("\n\n")));
        kids.push(subTitle("Caustic Environments"));
        kids.push(ruleBlock("In it, and after it", C.intro
          + "\n- " + C.inside.dice + " " + C.inside.type + " " + C.inside.when + "."
          + "\n- Persists after exit: " + C.lingering.dice + " " + C.lingering.type + " " + C.lingering.when + "."
          + "\n- " + C.wash));
        /* What the sheet does with the loss, as the Caustic block on the Freelancer tab does it
           (combat.js causticScene, through EN.engine.applyArmorDamage): one wear track per suit,
           the same one Armor Repair restores. This replaced a note from before Armor Repair
           merged, which said nothing subtracted from DR. */
        kids.push(ruleBlock("Gear degradation", C.gearDegradation.text
          + "\n\nThe sheet takes this loss off the exact suit that took it, on the same wear track Armor Repair restores, so it is already off your Damage Reduction everywhere DR shows. A sealed suit takes nothing. Repair it during Downtime on the Impact Table, at the shop or on the bench. At 0 DR the suit is breached, and rebuilding it is a full Project.",
          null, { terms: { "Armor Repair": "gr-craft/armor-repair" } }));
        kids.push(subTitle("Mitigations"));
        kids.push(el("p", { style: { margin: "0 0 8px", fontSize: "13px", color: "var(--text2)", lineHeight: "1.5" },
          text: "Nothing new. Each of these already exists elsewhere in the book, and each one changes an outcome on a Freelancer's Hazards panel rather than only being described." }));
        kids.push(refTable(["Mitigation", "Source", "Effect"], H.mitigations.map(function (m) {
          return [m.name, m.kind, m.summary];
        }), [0]));
        H.mitigations.filter(function (m) { return m.note; }).forEach(function (m) {
          kids.push(ruleBlock(m.name, m.note, m.kind));
        });
        if (H.gmGuidance) kids.push(ruleBlock("GM Guidance", H.gmGuidance));
        return kids;
      } }
  ] };

  /* ---- Vehicles & Economy ------------------------------------------------
     Ownership, upkeep and mods from EN.vehicles; currency, lifestyle, rewards
     and the payout split from EN.economy. Both used to sit under Combat Rules. */
  function g(v) { return "𝒢" + Number(v).toLocaleString(); }
  var streetChapter = { id: "street", title: "Vehicles & Economy", order: 100, audience: "both", panels: [
    { id: "ref-vehicles", title: "Vehicles", tag: "OWNERSHIP & CUSTOMIZATION", order: 10, when: function () { return !!EN.vehicles; },
      build: function (ctx, K) {
        var V = EN.vehicles, ruleBlock = K.ruleBlock, bullets = K.bullets;
        var kids = [];
        kids.push(ruleBlock("Buying a Vehicle", V.intro
          + "\n\nA vehicle's list price is twenty weeks of its upkeep.\n\n"
          + V.profiles.map(function (v) {
              return v.name + " | " + g(v.listPrice) + " | " + v.category + " T" + v.tier + " | " + v.availability + " | " + v.legality
                     + (v.loadout ? " | stock: " + v.loadout : "");
            }).join("\n")
          + "\n\n" + V.unlisted));
        // the printed stat lines, which nothing else in the app shows a buyer before the Garage
        if (V.statsNote) kids.push(ruleBlock("Vehicle Stats", V.statsNote + "\n\n"
          + V.profiles.map(function (v) {
              return v.name + " | Speed " + v.speed + " | Handling " + (v.handling > 0 ? "+" : "") + v.handling
                + " | Structure " + v.structure + " | Integrity " + v.integrity + " | Node " + v.nodeTier
                + " | Cargo " + v.cargo + ((v.traits || []).length ? " | " + v.traits.join(", ") : "");
            }).join("\n")));
        kids.push(ruleBlock("How to Get One", V.acquisition.map(function (a) {
          return a.mode + " (" + a.cost + "): " + a.note; }).join("\n")));
        kids.push(ruleBlock("Weekly Upkeep", V.upkeepNote + "\n\n"
          + V.profiles.map(function (v) {
              return v.name + " | fuel " + g(v.fuel) + " + reserve " + g(v.reserve) + " = " + g(v.upkeep) + " per week";
            }).join("\n")));
        kids.push(ruleBlock("Parking, Docking, and Storage",
          V.storage.map(function (s2) { return s2.service + " | 𝒢" + s2.cost; }).join("\n")));
        kids.push(ruleBlock("Vehicle Repair", bullets(V.repair)));
        kids.push(ruleBlock("How Vehicle Mods Work", bullets(V.modRules)));
        kids.push(ruleBlock("Vehicle Mods", V.mods.map(function (m) {
          return m.name + " | " + (m.priceNote || g(m.price)) + " | fits " + m.fits
               + " | " + m.availability + ", " + m.legality + "\n    " + m.effect;
        }).join("\n\n")));
        kids.push(ruleBlock("Mod Slots by Profile", V.profiles.map(function (v) {
          return v.name + " | Tier " + v.tier + " | " + v.modSlots + " slots"; }).join("\n")
          + "\n\nMod Slot Count is 1 + the vehicle's Tier."));
        return kids;
      } },
    { id: "ref-economy", title: "Economy & Rewards", tag: "COSTS · INCOME · REWARDS", order: 20, when: function () { return !!EN.economy; },
      build: function (ctx, K) {
        var E = EN.economy, ruleBlock = K.ruleBlock, bullets = K.bullets;
        var kids = [];
        kids.push(ruleBlock("Currency and Exchange",
          E.currencies.map(function (c) { return c.symbol + " " + c.name + " | " + c.use; }).join("\n")
          + "\n\n" + E.exchangeRate));
        // What a token actually returns, as opposed to what the ledger says it is worth.
        // Reference only: nothing in the app converts a wallet, because the bands are wide
        // and the cheap one comes with strings that are a scene rather than a number.
        if (E.nexusConversion) kids.push(ruleBlock("Converting Nexus to Glimmer",
          E.nexusConversionNote + "\n\n"
          + E.nexusConversion.map(function (c) { return c.channel + " | " + g(c.low) + " to " + g(c.high) + " per ◎ | " + c.note; }).join("\n")
          + "\n\nUnlicensed conversion may also involve:\n" + bullets(E.nexusUnlicensedRisks)
          + "\n\n" + E.nexusAssumptions
          + "\n\nThe sheet never converts a wallet for you. A cash-out is a scene: who is changing it, what they want, and what it costs you later."));
        kids.push(ruleBlock("Lifestyle Costs", E.lifestyleNote + "\n\n"
          + E.lifestyleTiers.map(function (t) {
              return t.tier + " | " + g(t.weekly) + "/wk | " + g(t.monthly) + "/mo | " + t.living; }).join("\n")
          + "\n\n" + bullets(E.lifestyleRules)));
        kids.push(ruleBlock("Safehouse Rent", E.safehouseRent.map(function (r) {
          return r.type + " | " + g(r.weekly) + "/wk | " + g(r.monthly) + "/mo | " + r.notes; }).join("\n")));
        kids.push(ruleBlock("Safehouse Upgrades", E.safehouseUpgrades.map(function (u) {
          return u.name + " | " + g(u.cost) + " | ongoing " + u.ongoing + " | " + u.benefit; }).join("\n")));
        /* Hypercare and debts were readable only in the Inventory tab's Bills. Hypercare bills
           MONTHLY, and its top two tiers are priced in Nexus, so each tier carries its own
           currency. */
        if ((E.hypercareTiers || []).length) kids.push(ruleBlock("Hypercare", (E.hypercareNote ? E.hypercareNote + "\n\n" : "")
          + E.hypercareTiers.map(function (t) {
              return t.tier + " | " + (t.currency === "nexus" ? "◎" + t.cost : g(t.cost)) + "/mo | " + t.coverage + " | " + t.response;
            }).join("\n")));
        kids.push(ruleBlock("Licenses, Papers, and Legitimacy", E.licenses.map(function (l) {
          return l.item + " | 𝒢" + l.cost + " | " + l.renewal; }).join("\n")));
        // the shape the Bills tab tracks, and nothing more: the book runs debt as pressure, not interest
        if (E.debtNote) kids.push(ruleBlock("Debt", E.debtNote
          + ((E.debtKinds || []).length ? "\n\nKinds of debt: " + E.debtKinds.join(", ") + "." : "")));
        kids.push(ruleBlock("Day Jobs and Between-Contract Income", E.dayJobs.map(function (j) {
          return j.job + " | 𝒢" + j.pay + "/wk | " + j.time + " | " + j.web; }).join("\n")));
        kids.push(ruleBlock("Reward Types", E.rewardTypes.map(function (r) {
          return r.type + " | " + r.meaning; }).join("\n")));
        kids.push(ruleBlock("GM Reward Tables", E.rewardTablesNote + "\n\nGlimmer Rewards (1d8)\n"
          + E.glimmerRewards.map(function (r) { return r.roll + ". " + r.reward + " | 𝒢" + r.value; }).join("\n")
          + "\n\nNexus Token Rewards (1d8). " + E.nexusRewardsNote + "\n"
          + E.nexusRewards.map(function (r) { return r.roll + ". " + r.reward; }).join("\n")));
        kids.push(ruleBlock("Splitting a Payout", E.splitNote + "\n\n" + E.splitExample
          + "\n\nNot every reward divides cleanly:\n" + bullets(E.splitNonStandard)
          // the tool that does the math is on a different tab on each desktop (one splitter, EN.engine.splitPayout)
          + (ctx.portal === "admin" ? "\n\nThe Payroll tab splits a payout with the same math as a Freelancer's Payout Splitter."
                                    : "\n\nThe Inventory tab has a Payout Splitter that does this math.")));
        kids.push(ruleBlock("Not Yet In The App",
          "These parts of the chapter are rules the sheet does not model yet. They live in the book:\n\n"
          + bullets(E.notModelled)));
        return kids;
      } }
  ] };

  [basicsChapter, resolutionChapter, combatChapter, conditionsChapter, hazardsChapter, streetChapter].forEach(register);

  /* ---- pointer terms for the chapters this file owns ---------------------
     The names the data, the class text and the GM text actually cite, where
     they differ from a panel title (titles are terms already) or point at one
     entry of a panel. A phrase here matches in any case; a single word only
     as written. The Phase 2 chapters (Vitality & Recovery, Social Pressure &
     Faction Standing, and the panels for chases, movement and Flow
     Disturbances) register their own names in their own files.
     "Social Fallout" on its own is the book's menu of social consequences, the
     Social Fallout table of the social chapter (so-fallout); Core Resolution's
     usage rule keeps its full name, "Social Fallout Rule". */
  terms({
    // The Basics
    "Saving Throw Focus": "bx-caliber",
    "Unattuned": "bx-flow",
    // Core Resolution
    "Edge and Snag": "rz-edge",
    "d20 Method": "rz-d20",
    "Static Modifier Cap": "rz-d20/static-modifier-cap-15",
    "Dice Pool Method": "rz-pool",
    "Success Margin": "rz-margin",
    "Social Fallout": "so-fallout",
    "Social Fallout Rule": "rz-social/social-fallout-rule",
    "Help Action": "rz-collab/help-action",
    // Combat Rules
    "Timing, Action Economy & Combat": "ref-actions",
    "Timing, Action Economy and Combat": "ref-actions",
    "Initiative": "ref-round/combat-sequence",
    "Move Action": "ref-actions/move",
    "Swift Action": "ref-actions/swift-action",
    "Impulse Action": "ref-actions/impulse-action",
    "Free Action": "ref-actions/free-action",
    "Complex Action": "ref-actions/complex-action",
    "Special Action": "ref-actions/special-action",
    "Opportunity Attacks": "ref-actions/opportunity-attacks",
    "Active Defense": "ref-def/active-defense-rules",
    "Shield Durability": "ref-def/shield-durability",
    "Shield Durability in the Combat chapter": "ref-def/shield-durability",
    "Half Cover": "ref-cover/half-cover",
    "Three-Quarter Cover": "ref-cover/three-quarter-cover",
    "Total Cover": "ref-cover/total-cover",
    "Line of Sight": "ref-cover/line-of-sight",
    "Obscurement": "ref-cover/obscurement",
    "Tremor Sense": "ref-cover/tremor-sense",
    "Destructible Cover": "ref-cover/destructible-cover",
    "Cover Material Table": "ref-cover/cover-material-table",
    "Overflow Damage": "ref-cover/overflow-damage",
    "Reach Caps": "ref-attack/reach-caps",
    "Damage Order": "ref-damage/damage-order",
    "Resistance, Vulnerability and Immunity": "ref-damage/resistance-vulnerability-and-immunity",
    "Resistance, Vulnerability, and Immunity": "ref-damage/resistance-vulnerability-and-immunity",
    "Damage Types chapter": "ref-dmg",
    "Body Gate": "ref-size/the-body-gate",
    "Meat Shield": "ref-improvised/meat-shield",
    // Conditions Library
    "Conditions chapter": "ref-conds",
    // Vehicles & Economy
    "Vehicle Mods": "ref-vehicles/vehicle-mods",
    "Economy and Rewards": "ref-economy",
    "Hypercare": "ref-economy/hypercare",
    "Splitting a Payout": "ref-economy/splitting-a-payout"
  });

  return {
    render: render,
    register: register, addPanels: addPanels, slug: slug, has: has, open: open, peek: peek,
    link: link, chip: chip, linkify: linkify, terms: terms, tabKey: tabKey, kit: kit,
    search: search, chapters: chapters, entries: entries, closePeek: closePeek
  };
})();
