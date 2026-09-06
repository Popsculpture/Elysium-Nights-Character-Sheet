/* ===========================================================================
   ELYSIUM NIGHTS · #GRID Smartdeck OS bootstrap
   Boot sequence, tab routing, OS chrome, autosave indicator.

   TWO DESKTOPS SHARE THIS OS AND NOTHING ELSE. The Freelancer portal is the
   seven player tabs; the Admin portal is the GM toolkit on its own rail. A
   tab's `portal` field says which one it belongs to and is never inferred,
   because which desktop a tab lands on is exactly what a silent default gets
   wrong. Tab KEYS MUST STAY UNIQUE ACROSS BOTH RAILS: gotoTab's portal
   resolution and _lastTab's scroll restore both depend on that silently.
   =========================================================================== */
window.EN = window.EN || {};

EN.app = (function () {
  var el = EN.ui.el, store = EN.store;

  // The Admin desktop is drawn entirely by the GM modules. If they are deleted
  // the desktop does not exist, the splash offers one card, and the app is
  // exactly the player-only app it was before the toolkit landed.
  function adminReady() { return !!(EN.gmView && EN.gmStore && EN.gmEngine); }

  /* The Freelancer rail is for REGISTERED Freelancers. Until the active record
     has been through #PRINT's Submit & File (which stamps meta.filedAt), the
     rail hides everything but the gear: an unfiled draft gets the wizard and
     nothing else. #PRINT itself is never gated on this, or a draft could never
     reach the step that files it. An example counts as registered: it is a
     finished demo record that cannot be stored, and the tabs are what it is
     for. Records from before the gate shipped are grandfathered in store.js.
     The first `gated` that reads character state rather than module presence;
     it is re-evaluated on every render, which is every store change, so the
     rail appears the moment a record is filed with no further plumbing. */
  function registered() {
    var ch = EN.store.active();
    if (!ch) return false;
    if (EN.store.activeIsExample && EN.store.activeIsExample()) return true;
    return !!(ch.meta && ch.meta.filedAt);
  }

  // Tabs. Only "#PRINT" is built today on the Freelancer side; the rest read
  // the same character record once they're implemented (the foundation is
  // shared). #PRINT lives last: you create + file a record there, then it
  // becomes the place to level up. Tapping it lands on the Advance step
  // (onSelect), since advancing is the usual reason to return.
  /* A tab may carry an SVG icon instead of a text glyph. The Codex wears the author's own art
     (a book with a question mark, from book-question-icon.svg, its path copied unchanged); it
     is inline rather than an <img> so it takes the tab's current colour on every skin, and
     `glyph` stays beside it for the stub page and anything else that wants a character. */
  // the author's archive box (a lidded storage crate), used for Inventory's rail tab and its
  // Stash sub-tab, which is the same idea at two scales: the whole tab and one bucket inside it
  var ICON_ARCHIVE = '<svg viewBox="0 0 122.878 110.041" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.149,0h120.583c0.631,0,1.146,0.518,1.146,1.149v28.383 c0,0.634-0.516,1.149-1.146,1.149H1.149C0.518,30.681,0,30.166,0,29.532V1.149C0,0.518,0.518,0,1.149,0L1.149,0z M7.224,36.787 h108.433c0.526,0,0.962,0.43,0.962,0.961v71.331c0,0.529-0.436,0.962-0.962,0.962H7.224c-0.528,0-0.961-0.433-0.961-0.962V37.749 C6.263,37.217,6.695,36.787,7.224,36.787L7.224,36.787z M45.005,48.526h32.87c3.529,0,6.419,2.888,6.419,6.417l0,0 c0,3.529-2.89,6.416-6.419,6.416h-32.87c-3.532,0-6.419-2.887-6.419-6.416l0,0C38.586,51.414,41.474,48.526,45.005,48.526 L45.005,48.526z"/></svg>';
  var ICON_CODEX = '<svg viewBox="0 0 442 512.12" fill="currentColor" aria-hidden="true"><path d="M73.5 0h354.32v395.44c-.64 11.05-14.91 11.3-30.32 10.62H68.28c-21.33 0-38.77 17.43-38.77 38.76 0 21.34 17.44 38.77 38.77 38.77h343.39v-41.25H442v52.43c0 9.55-7.8 17.35-17.35 17.35H69.78C22.54 511.76 0 494.94 0 456.56V73.5C0 33.07 33.07 0 73.5 0zm107.17 253.02v-10.73c0-12.59 1-22.66 2.95-30.13 1.97-7.48 4.95-13.5 8.88-18.07 3.87-4.52 8.66-8.66 14.31-12.32 4.89-3.23 9.25-6.29 13.12-9.31 3.88-2.95 6.89-6.13 9.15-9.46 2.26-3.39 3.39-7.21 3.39-11.46 0-3.82-.92-7.21-2.75-10.11-1.82-2.91-4.3-5.17-7.42-6.78-3.17-1.56-6.61-2.37-10.43-2.37-4.15 0-7.96.92-11.41 2.85-3.49 1.88-6.29 4.52-8.39 7.91-2.1 3.34-3.12 7.26-3.12 11.67h-58.69c.11-16.78 3.93-30.44 11.46-40.93 7.48-10.55 17.43-18.24 29.8-23.19 12.37-4.95 25.98-7.37 40.78-7.37 16.35 0 30.93 2.37 43.78 7.16 12.86 4.78 22.97 11.94 30.4 21.51 7.37 9.64 11.08 21.58 11.08 35.94 0 9.25-1.56 17.37-4.74 24.37-3.17 6.99-7.58 13.12-13.17 18.45-5.6 5.32-12.16 10.17-19.64 14.52-5.54 3.17-10.16 6.51-13.88 9.9-3.76 3.39-6.59 7.25-8.5 11.57-1.9 4.29-2.85 9.52-2.85 15.65v10.73h-54.11zm27.97 82.28c-8.88 0-16.48-3.1-22.76-9.3-6.3-6.22-9.36-13.83-9.36-22.76 0-8.71 3.07-16.19 9.36-22.38 6.3-6.18 13.88-9.25 22.76-9.25 8.39 0 15.82 3.07 22.27 9.25 6.45 6.19 9.84 13.67 9.84 22.38 0 5.92-1.66 11.35-4.68 16.2-3.01 4.84-6.94 8.7-11.72 11.56-4.85 2.89-10.06 4.3-15.71 4.3zM68.17 452.81h315.37c3.19 0 5.8 2.62 5.8 5.8v3.53c0 3.18-2.61 5.8-5.8 5.8H68.17c-3.18 0-5.79-2.61-5.79-5.8v-3.53c0-3.19 2.6-5.8 5.79-5.8zm0-29.96h315.37c3.19 0 5.8 2.62 5.8 5.8v3.53c0 3.18-2.61 5.8-5.8 5.8H68.17c-3.18 0-5.79-2.61-5.79-5.8v-3.53c0-3.19 2.6-5.8 5.79-5.8z"/></svg>';
  var TABS = [
    { key: "combat",  label: "Freelancer", glyph: "✦", sub: "live play dashboard", portal: "freelancer", gated: registered, view: function (m) { EN.combatView.render(m); } },
    { key: "face",    label: "Social",    glyph: "◑", sub: "people and reputation", portal: "freelancer", gated: registered, view: function (m) { EN.faceView.render(m); },
      // unread #POST raises the rail's attention dot; renderTabs runs on every render, so it clears itself
      badge: function () { try { return EN.faceView.unread(store.active()); } catch (e) { return 0; } } },
    { key: "grid",    label: "#GRID",     glyph: "⌬", sub: "the network", portal: "freelancer", gated: registered, view: function (m) { EN.gridView.render(m); } },
    { key: "flow",    label: "Flow",      glyph: "❋", sub: "the current", portal: "freelancer", gated: registered, view: function (m) { EN.flowView.render(m); } },
    { key: "gear",    label: "Inventory", glyph: "▣", icon: ICON_ARCHIVE, sub: "gear, chrome, gray market", portal: "freelancer", gated: registered, view: function (m) { EN.inventoryView.render(m); } },
    { key: "codex",   label: "Codex",     glyph: "❒", icon: ICON_CODEX, sub: "rules on hand", portal: "freelancer", gated: registered, view: function (m) { EN.codexView.render(m); } },
    { key: "print",   label: "#PRINT", glyph: "▤", sub: "identity record and leveling", portal: "freelancer", view: function (m) { EN.builder.render(m); },
      onSelect: function () { if (EN.builder && EN.builder.openAdvance) EN.builder.openAdvance(); } },

    /* The Admin rail. Every entry is gated on adminReady, so the desktop is
       all-or-nothing rather than degrading to four MODULE PENDING pages with
       a working Table tab above them. */
    { key: "table",      label: "Table",      glyph: "◆", sub: "initiative and the crew", portal: "admin", gated: adminReady,
      view: function (m) { EN.gmView.renderTable(m); } },
    { key: "threats",    label: "Threats",    glyph: "✦", sub: "build a threat", portal: "admin", gated: adminReady,
      view: function (m) { EN.gmView.renderThreats(m); } },
    { key: "bestiary",   label: "Bestiary",   glyph: "▤", sub: "gangers, sentries, cryptids", portal: "admin", gated: adminReady,
      view: function (m) { EN.gmView.renderBestiary(m); } },
    { key: "encounters", label: "Encounters", glyph: "⌗", sub: "module pending", portal: "admin", gated: adminReady,
      stub: "Budgeting an encounter: XP shares by crew Caliber, four difficulty bands from Milk Run " +
            "to Red Work, and the book's own line that past 2x is not an encounter, it is an ambush " +
            "you are writing on purpose. The tables already live in data/threats.js." },
    { key: "hazards",    label: "Hazards",    glyph: "⚠", sub: "module pending", portal: "admin", gated: adminReady,
      stub: "Set Pieces: the eight pre-written hazards, all authored at Gauge 3, plus the DC ladder " +
            "and bite tables Part 4 already prices." },
    { key: "jobs",       label: "Job Board",  glyph: "▣", sub: "module pending", portal: "admin", gated: adminReady,
      stub: "The Job Board: five roll tables and twelve postings." },
    { key: "payroll",    label: "Payroll",    glyph: "◈", sub: "module pending", portal: "admin", gated: adminReady,
      stub: "Paying the Crew: contract pay bands, bounties, and salvage values, likely lifting " +
            "splitPayout out of inventory.js rather than writing a second splitter." }
  ];

  /* Device state: which desktop, persisted; which tab on each desktop, not.
     Neither an activeTab reset nor a portal choice needs to survive a reload
     any harder than that, and the splash is deliberately per-first-run. */
  var PORTAL_KEY = "en_portal_v1";
  var portal = "freelancer";
  var LAST = { freelancer: "print", admin: "table" };

  function storedPortal() {
    try {
      var v = localStorage.getItem(PORTAL_KEY);
      return (v === "admin" || v === "freelancer") ? v : null;
    } catch (e) { return null; }
  }

  /* One reader for "which tabs exist right now" IN THE CURRENT PORTAL. Both
     the rail and the dispatch ask it, so they can never disagree about
     whether a tab is there. */
  function visibleTabs() {
    return TABS.filter(function (t) { return t.portal === portal && (!t.gated || t.gated()); });
  }
  function hasAdmin() {
    return TABS.some(function (t) { return t.portal === "admin" && (!t.gated || t.gated()); });
  }
  // the rail in swipe order and a tab's label, for swipe.js (read live, never captured)
  function tabOrder() { return visibleTabs().map(function (t) { return t.key; }); }
  function tabLabel(k) { var t = TABS.filter(function (x) { return x.key === k; })[0]; return t ? t.label : k; }

  /* THE one writer for `portal`. Validates (Admin is meaningless with the GM
     modules gone; the Freelancer side is never empty, so no symmetric check
     is needed), persists so a splash pick, a tray flip, and the empty-rail
     self-heal below can never disagree, and clears any confirm armed on the
     desktop being left (ui.js's _armedKey is a single global slot). */
  /* #GRIDroid's app list folds itself when you open another app, but every OTHER route out of a
     tab (a portal flip, a gotoTab from a card, a skin change in settings.js) used to leave the
     class set, so the list came back unfolded later, sometimes on a rail with no rows to tap. */
  function foldRail() { try { document.documentElement.classList.remove("rail-open"); } catch (e) {} }
  function usePortal(p) {
    portal = (p === "admin" && hasAdmin()) ? "admin" : "freelancer";
    try { localStorage.setItem(PORTAL_KEY, portal); } catch (e) {}
    EN.ui.disarm();
    foldRail();
  }
  function setPortal(p) { usePortal(p); render(); }

  function renderTabs() {
    var nav = document.getElementById("os-tabs");
    EN.ui.clear(nav);
    // tabs live in their own scroller; the gear is a sibling outside it so it never scrolls or drifts
    var scroll = el("div.os-tabs-scroll");
    /* An unregistered Freelancer gets NO tabs, only the gear. visibleTabs()
       still holds #PRINT for them, and render() still dispatches to it; this
       only decides whether that lone tab is drawn. The scroller itself is
       always appended, empty when locked: it is the flex spacer that keeps the
       gear pinned to the right, and dropping it slid the gear to the left edge.
       Admin is untouched: a GM needs no character. */
    /* #GRIDroid folds the rail down to the app you are in, so a dot on a row nobody can see
       announces nothing. This says "one of the rows you are NOT looking at wants you", which is
       the only thing a folded list can honestly say; the skin draws it on the folded row. Inert
       on Classic and '98, where every row is on screen wearing its own dot. */
    var railAttn = false;
    if (!(portal === "freelancer" && !registered())) {
      visibleTabs().forEach(function (t) {
        // a tab may report something waiting on it; the dot is decorative and the tap
        // falls through to the tab itself, which is where the reader wants to go anyway
        var badge = t.badge ? t.badge() : 0;
        if (badge && t.key !== LAST[portal]) railAttn = true;
        // data-sub is a skin hook: #GRIDroid prints it under the label as the app row's subtitle
        scroll.appendChild(el("div.os-tab" + (t.key === LAST[portal] ? ".active" : ""), {
          dataset: t.sub ? { sub: t.sub } : null,
          onclick: function () {
            // #GRIDroid draws the rail as a phone's app list, folded to the open app: tapping
            // that app unfolds or folds the list instead of re-opening it (so #PRINT's
            // re-tap-for-Advance is a desktop gesture). No other skin ever sees rail-open.
            var root = document.documentElement;
            if (t.key === LAST[portal] && root.classList.contains("skin-droid")) { root.classList.toggle("rail-open"); return; }
            root.classList.remove("rail-open");
            LAST[portal] = t.key; if (t.onSelect) t.onSelect(); render();
          }
        }, [t.icon ? el("span", { html: t.icon }) : el("span", { text: t.glyph }), document.createTextNode(t.label),
            badge ? el("span.attn-dot", { title: badge + (badge === 1 ? " unread message" : " unread messages") + " in #POST" }) : null]));
      });
    }
    if (railAttn) document.documentElement.classList.add("rail-attn");
    else document.documentElement.classList.remove("rail-attn");
    nav.appendChild(scroll);
    // settings gear, pinned to the right end of the rail
    if (EN.settings && EN.settings.gearTab) nav.appendChild(EN.settings.gearTab());
    /* The system tray: two status glyphs and a second clock. Always rendered,
       because the DOM cannot move the top-bar clock into the rail, and a skin
       is CSS only. Classic hides it; a skin with a bottom taskbar ('98) shows
       it and hides the top-bar clock instead, so there is always exactly one
       clock on screen. Both are ticked by tickClock. */
    // ⇋ is LINK STABLE and ⬤ is SYNC OK, the two top-bar readouts the '98 title
    // bar drops; the words survive as hover titles, and ⬤ flashes with the save
    // pulse exactly as SYNC OK does (see flashSave).
    /* With the list unfolded its scrim covers the page, so a tap that lands on the rail itself
       (not on a row) folds it back rather than being swallowed. Inert on the other skins. */
    nav.onclick = function (e) { if (e.target === nav) foldRail(); };
    nav.appendChild(el("div.os-tray", null, [
      el("span.os-tray-ico", { text: "⇋", title: "LINK STABLE" }),
      el("span.os-tray-ico", { id: "os-tray-sync", text: "⬤", title: "SYNC OK" }),
      el("span.os-tray-clock", { id: "os-tray-clock", text: clockText() })
    ]));
    if (_saveKind === "fail") paintSave("fail");   // a fresh tray glyph must not read as healthy
  }

  var _lastTab = null;
  var _swipe = null;   // the swipe gesture, when the module is present (see start)
  function render() {
    // a rebuild under a finger strands its touch (the events keep targeting the removed node),
    // so the gesture is told to snap back first; a no-op unless a drag is in flight
    if (_swipe) _swipe.abort();
    // per-character theme: repaint to whatever the active Freelancer selected (no-op if unchanged).
    // In Admin this resolves to the Admin desktop's own device theme instead (see settings.js).
    if (EN.theme && EN.theme.syncToActive) EN.theme.syncToActive();
    // re-renders empty the view, which momentarily collapses the page and lets
    // the browser clamp scroll to the top, capture and restore the position.
    // Inner scrollable wells (.feature-scroll, .actions-scroll) are rebuilt too, so save theirs as well.
    var sy = window.scrollY, sx = window.scrollX;
    var WELLS = "#view .feature-scroll, #view .actions-scroll";
    var wells = Array.prototype.map.call(document.querySelectorAll(WELLS), function (w) { return w.scrollTop; });
    renderTabs();
    var view = document.getElementById("view");
    EN.ui.clear(view);
    var vis = visibleTabs();
    // Same self-healing shape as the tab fallback below, for the same reason:
    // the rail and the dispatch must never disagree. Reachable only if the GM
    // modules vanish while Admin is the current desktop.
    if (!vis.length) { usePortal("freelancer"); vis = visibleTabs(); }
    /* Resolve through the VISIBLE list and fall back, writing LAST[portal] back
       so the rail highlight agrees. Without this, a tab disappearing (GM mode
       toggling off used to do this) throws on `tab.view` and blanks the page
       with the rail still painted. The same hole made gotoTab("nope") throw;
       it was simply unreachable until a tab could disappear. */
    var tab = vis.filter(function (t) { return t.key === LAST[portal]; })[0];
    if (!tab) { tab = vis[0]; LAST[portal] = tab.key; }
    if (tab.view) { tab.view(view); }
    else {
      view.appendChild(el("div", null, [
        el("h1", { style: { fontSize: "22px", marginBottom: "6px" }, text: tab.label.toUpperCase() }),
        el("div.muted-box", { style: { marginTop: "20px", padding: "40px" }, html: tab.glyph + " &nbsp; MODULE PENDING<br><br>" + tab.stub })
      ]));
    }
    if (_lastTab === LAST[portal]) {                       // same view → stay put
      window.scrollTo(sx, sy);
      Array.prototype.forEach.call(document.querySelectorAll(WELLS), function (w, i) {
        if (wells[i]) w.scrollTop = wells[i];
      });
    } else window.scrollTo(0, 0);                          // tab switch → start at top
    _lastTab = LAST[portal];
    // top bar's active-name slot: the loaded Freelancer on the player side, the
    // live encounter on the GM side, since Admin is not about a character
    var nameEl = document.getElementById("active-name");
    if (portal === "admin") {
      var enc = null;
      try { enc = EN.gmStore && EN.gmStore.get && EN.gmStore.get().encounter; } catch (e) {}
      nameEl.textContent = (enc && enc.round > 0) ? ("ROUND " + enc.round) : "NO ENCOUNTER";
    } else {
      var ch = store.active();
      nameEl.textContent = ch ? (ch.name || "UNNAMED FREELANCER").toUpperCase() : "NO FREELANCER LOADED";
    }
    /* Currency marks, last, once the view is fully built. A NO-OP on any device whose fonts
       carry U+1D4A2 and U+25CE, which is the common case and costs one cached measurement;
       on devices that lack them it walks the freshly-rendered text and swaps the tofu box
       for a readable letter. Runs here rather than inside el() because most of these marks
       arrive as catalog PROSE, never passing through a builder at all. */
    if (EN.ui.substituteCurrencyGlyphs) EN.ui.substituteCurrencyGlyphs(document.getElementById("os") || document.body);
  }

  /* save indicator pulse */
  /* The save readout, in the top bar and as the tray's ⬤ on a skin with a taskbar. It reports
     the WRITE, not the edit: an edit only ever flashes it, and the store's own save watcher
     below settles it to what actually happened. A failure is sticky, because the record on this
     device really is behind until a later write lands. */
  var _saveKind = "ok";                                 // "ok" | "saving" | "fail"
  var SAVE_FAIL_TIP = "This device refused the write, so changes since then are NOT stored here. Export the record from #PRINT to keep them.";
  function paintSave(kind) {
    var s = document.getElementById("save-state");
    var g = document.getElementById("os-tray-sync");   // the tray's ⬤, which IS SYNC OK on a skin with a taskbar
    if (!s && !g) return;
    var txt = kind === "saving" ? "SYNC…" : kind === "fail" ? "NOT SAVED" : "SYNC OK";
    var col = kind === "saving" ? "var(--warn)" : kind === "fail" ? "var(--danger)" : "var(--success)";
    var tip = kind === "fail" ? SAVE_FAIL_TIP : txt;
    if (s) { s.textContent = txt; s.style.color = col; s.title = tip; }
    // on a good save the glyph's inline color is CLEARED rather than set, so it falls back to
    // the skin's own rule and keeps its pulse; a warning has to override that rule to be seen
    if (g) { g.title = tip; g.style.color = kind === "ok" ? "" : col; }
  }
  function flashSave() {
    paintSave("saving");
    clearTimeout(flashSave._t);
    // settle to whatever the last write reported, NOT to success: an immediate write has
    // already landed and reported by the time this runs, and a debounced one reports right after
    flashSave._t = setTimeout(function () { paintSave(_saveKind); }, 300);
  }

  /* clock */
  function clockText() {
    var d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0");
  }
  function tickClock() {
    var t = clockText();
    var c = document.getElementById("os-clock");
    if (c) c.textContent = t;
    var tray = document.getElementById("os-tray-clock");   // the taskbar clock, when a skin shows one
    if (tray) tray.textContent = t;
  }

  /* boot sequence */
  function boot() {
    var lines = [
      "init grid.kernel ……… <b>OK</b>",
      "mount smartdeck.fs ……… <b>OK</b>",
      "load ruleset elysium_nights ……… <b>OK</b>",
      "spin flow.reservoir ……… <b>OK</b>",
      "auth freelancer credentials ……… <b>OK</b>",
      "decrypt local roster ……… <b>OK</b>"
    ];
    var box = document.getElementById("boot-lines");
    var i = 0;
    function step() {
      if (i < lines.length) {
        box.innerHTML += "&gt; " + lines[i] + "<br>";
        i++; setTimeout(step, 150 + Math.floor((i % 3) * 40));
      } else {
        box.innerHTML += '<span class="cyan">&gt; smartdeck online.</span> <span class="cursor"></span>';
        setTimeout(finish, 420);
      }
    }
    function finish() {
      var reveal = function () {
        var b = document.getElementById("boot");
        b.classList.add("hide");
        document.getElementById("os").style.display = "flex";
        setTimeout(function () { b.style.display = "none"; }, 520);
      };
      /* After the gate: which desktop. The gate answers with the profile the
         player entered as (or resumed as, silently), and that profile IS the
         desktop. Set the portal FIRST, then reveal, so the render inside
         setPortal happens while #os is still display:none and any repaint is
         invisible. With gate.js deleted the app boots straight into the
         remembered desktop, and the settings tray's desktop buttons are the
         only way across. */
      var land = function (p) { setPortal(p || portal); reveal(); };
      if (EN.gate && EN.gate.require) EN.gate.require(land); else land(portal);
    }
    step();
  }

  function start() {
    store.load();
    // after store.load, always: the crew prune needs the roster to tell a live
    // charId from a dead one, and running first would drop every crew entry
    if (EN.gmStore && EN.gmStore.load) EN.gmStore.load();
    // Resolve the remembered desktop BEFORE the first render, so a returning
    // user's first paint is already correct rather than a Freelancer flash.
    // validated the same way usePortal validates, in case Admin was saved
    // while the GM modules were present and they are gone now.
    var sp = storedPortal();
    if (sp) portal = (sp === "admin" && hasAdmin()) ? "admin" : "freelancer";
    // Any non-silent store change re-renders the active view. (Text fields use
    // silent updates, so typing never triggers a disruptive re-render.)
    // render FIRST, then flash: render rebuilds the rail, and the tray's sync
    // glyph lives in it, so a flash applied before the rebuild would be thrown
    // away with the old rail a moment later (the top bar's readout is static
    // HTML and never noticed the difference)
    store.on(function () { render(); flashSave(); });
    /* The one place that knows whether the record is really on this device. It also has to
       out-live a re-render, which rebuilds the tray glyph from scratch, so renderTabs repaints
       a failure after appending it. */
    store.onSave(function (ok) {
      var was = _saveKind;
      _saveKind = ok ? "ok" : "fail";
      clearTimeout(flashSave._t);
      paintSave(_saveKind);
      if (!ok && was !== "fail") EN.ui.toast("NOT SAVED. This device refused the write; export the record from #PRINT to keep your changes.");
      if (ok && was === "fail") EN.ui.toast("Saved. This device is storing the record again.");
    });
    renderTabs();
    render();
    tickClock(); setInterval(tickClock, 1000);
    /* Swipe between tabs, on the phone skin only: its rail is folded to the app you are in,
       so a swipe is the way between tabs there. enabled() is the SAME test that folds the
       rail, so the two can never disagree, and it refuses while the list is unfolded. #view
       is the container because render() replaces its children and never the node, which is
       the one thing swipe.js requires of it, and render() tells the gesture when it does so
       (see _swipe.abort there). The module itself refuses a drag that starts inside anything
       position:fixed, which covers the roll trays, the rest sheets and the roster manager,
       overlays a translated #view would otherwise carry off with it; the exclude adds the rest
       buttons themselves and the Freelancer dashboard's layout-edit drag handle. A committed
       swipe runs the tab's onSelect exactly as a rail tap does, so swiping into #PRINT lands
       on Advance like tapping it, and closes any rest popover first, since the claimed drag
       swallows the click the popovers' own closer listens for. */
    if (EN.swipe) _swipe = EN.swipe.create({
      container: document.getElementById("view"),
      order: tabOrder,
      current: function () { return LAST[portal]; },
      onChange: function (k) {
        if (EN.combatView && EN.combatView.closePops) EN.combatView.closePops();
        var t = TABS.filter(function (x) { return x.key === k; })[0];
        if (t && t.onSelect) t.onSelect();
        EN.app.gotoTab(k);
      },
      label: tabLabel,
      enabled: function () { var c = document.documentElement.classList; return c.contains("skin-droid") && !c.contains("rail-open"); },
      exclude: "input, textarea, select, [contenteditable], [data-no-swipe], .drag-handle, .pop-anchor"
    });
    boot();
  }

  return {
    start: start, render: render,
    activeTab: function () { return LAST[portal]; },
    tabOrder: tabOrder,
    iconArchive: ICON_ARCHIVE,   // shared with inventory.js's Stash sub-tab, same art at two scales
    /* Resolves the key's own portal rather than assuming the caller's, so
       every existing caller (all of which name a Freelancer tab today) stays
       correct with zero edits, and the function can never strand the app on
       an unknown key. */
    gotoTab: function (k) {
      foldRail();
      var t = TABS.filter(function (x) { return x.key === k; })[0];
      if (!t) return;
      usePortal(t.portal);
      LAST[portal] = k;
      render();
    },
    portal: function () { return portal; },
    setPortal: setPortal,
    hasAdmin: hasAdmin
  };
})();

document.addEventListener("DOMContentLoaded", EN.app.start);
