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
  var TABS = [
    { key: "combat",  label: "Freelancer", glyph: "✦", portal: "freelancer", gated: registered, view: function (m) { EN.combatView.render(m); } },
    { key: "face",    label: "Social",    glyph: "◑", portal: "freelancer", gated: registered, view: function (m) { EN.faceView.render(m); } },
    { key: "grid",    label: "#GRID",     glyph: "⌬", portal: "freelancer", gated: registered, view: function (m) { EN.gridView.render(m); } },
    { key: "flow",    label: "Flow",      glyph: "❋", portal: "freelancer", gated: registered, view: function (m) { EN.flowView.render(m); } },
    { key: "gear",    label: "Inventory", glyph: "▣", portal: "freelancer", gated: registered, view: function (m) { EN.inventoryView.render(m); } },
    { key: "codex",   label: "Codex",     glyph: "❒", portal: "freelancer", gated: registered, view: function (m) { EN.codexView.render(m); } },
    { key: "print",   label: "#PRINT", glyph: "▤", portal: "freelancer", view: function (m) { EN.builder.render(m); },
      onSelect: function () { if (EN.builder && EN.builder.openAdvance) EN.builder.openAdvance(); } },

    /* The Admin rail. Every entry is gated on adminReady, so the desktop is
       all-or-nothing rather than degrading to four MODULE PENDING pages with
       a working Table tab above them. */
    { key: "table",      label: "Table",      glyph: "◆", portal: "admin", gated: adminReady,
      view: function (m) { EN.gmView.renderTable(m); } },
    { key: "threats",    label: "Threats",    glyph: "✦", portal: "admin", gated: adminReady,
      view: function (m) { EN.gmView.renderThreats(m); } },
    { key: "bestiary",   label: "Bestiary",   glyph: "▤", portal: "admin", gated: adminReady,
      view: function (m) { EN.gmView.renderBestiary(m); } },
    { key: "encounters", label: "Encounters", glyph: "⌗", portal: "admin", gated: adminReady,
      stub: "Budgeting an encounter: XP shares by crew Caliber, four difficulty bands from Milk Run " +
            "to Red Work, and the book's own line that past 2x is not an encounter, it is an ambush " +
            "you are writing on purpose. The tables already live in data/threats.js." },
    { key: "hazards",    label: "Hazards",    glyph: "⚠", portal: "admin", gated: adminReady,
      stub: "Set Pieces: the eight pre-written hazards, all authored at Gauge 3, plus the DC ladder " +
            "and bite tables Part 4 already prices." },
    { key: "jobs",       label: "Job Board",  glyph: "▣", portal: "admin", gated: adminReady,
      stub: "The Job Board: five roll tables and twelve postings." },
    { key: "payroll",    label: "Payroll",    glyph: "◈", portal: "admin", gated: adminReady,
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

  /* THE one writer for `portal`. Validates (Admin is meaningless with the GM
     modules gone; the Freelancer side is never empty, so no symmetric check
     is needed), persists so a splash pick, a tray flip, and the empty-rail
     self-heal below can never disagree, and clears any confirm armed on the
     desktop being left (ui.js's _armedKey is a single global slot). */
  function usePortal(p) {
    portal = (p === "admin" && hasAdmin()) ? "admin" : "freelancer";
    try { localStorage.setItem(PORTAL_KEY, portal); } catch (e) {}
    EN.ui.disarm();
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
    if (!(portal === "freelancer" && !registered())) {
      visibleTabs().forEach(function (t) {
        scroll.appendChild(el("div.os-tab" + (t.key === LAST[portal] ? ".active" : ""), {
          onclick: function () { LAST[portal] = t.key; if (t.onSelect) t.onSelect(); render(); }
        }, [el("span", { text: t.glyph }), document.createTextNode(t.label)]));
      });
    }
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
    nav.appendChild(el("div.os-tray", null, [
      el("span.os-tray-ico", { text: "⇋", title: "LINK STABLE" }),
      el("span.os-tray-ico", { id: "os-tray-sync", text: "⬤", title: "SYNC OK" }),
      el("span.os-tray-clock", { id: "os-tray-clock", text: clockText() })
    ]));
  }

  var _lastTab = null;
  function render() {
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
  function flashSave() {
    var s = document.getElementById("save-state");
    var g = document.getElementById("os-tray-sync");   // the tray's ⬤, which IS SYNC OK on a skin with a taskbar
    if (!s && !g) return;
    if (s) { s.textContent = "SYNC…"; s.style.color = "var(--warn)"; }
    if (g) { g.style.color = "var(--warn)"; g.title = "SYNC…"; }
    clearTimeout(flashSave._t);
    flashSave._t = setTimeout(function () {
      if (s) { s.textContent = "SYNC OK"; s.style.color = "var(--success)"; }
      // clear the inline color rather than set it, so the glyph falls back to
      // the skin's own rule and keeps its pulse
      if (g) { g.style.color = ""; g.title = "SYNC OK"; }
    }, 280);
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
    renderTabs();
    render();
    tickClock(); setInterval(tickClock, 1000);
    boot();
  }

  return {
    start: start, render: render,
    activeTab: function () { return LAST[portal]; },
    /* Resolves the key's own portal rather than assuming the caller's, so
       every existing caller (all of which name a Freelancer tab today) stays
       correct with zero edits, and the function can never strand the app on
       an unknown key. */
    gotoTab: function (k) {
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
