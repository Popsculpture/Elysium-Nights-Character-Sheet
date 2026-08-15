/* ===========================================================================
   ELYSIUM NIGHTS · #GRID Smartdeck OS bootstrap
   Boot sequence, tab routing, OS chrome, autosave indicator.
   =========================================================================== */
window.EN = window.EN || {};

EN.app = (function () {
  var el = EN.ui.el, store = EN.store;

  // Tabs. Only "#PRINT" is built today; the rest are stubs that read the same
  // character record once they're implemented (the foundation is shared).
  // #PRINT lives last and is framed as "Update #PRINT": you create + file a
  // record there, then it becomes the place to level up. Tapping it lands on the
  // Advance step (onSelect), since advancing is the usual reason to return.
  var TABS = [
    { key: "combat",  label: "Freelancer", glyph: "✦", view: function (m) { EN.combatView.render(m); } },
    { key: "face",    label: "Social",    glyph: "◑", view: function (m) { EN.faceView.render(m); } },
    { key: "grid",    label: "#GRID",     glyph: "⌬", view: function (m) { EN.gridView.render(m); } },
    { key: "flow",    label: "Flow",      glyph: "❋", view: function (m) { EN.flowView.render(m); } },
    { key: "gear",    label: "Inventory", glyph: "▣", view: function (m) { EN.inventoryView.render(m); } },
    { key: "codex",   label: "Codex",     glyph: "❒", view: function (m) { EN.codexView.render(m); } },
    { key: "print",   label: "Update #PRINT", glyph: "▤", view: function (m) { EN.builder.render(m); },
      onSelect: function () { if (EN.builder && EN.builder.openAdvance) EN.builder.openAdvance(); } }
  ];
  var activeTab = "print";

  function renderTabs() {
    var nav = document.getElementById("os-tabs");
    EN.ui.clear(nav);
    // tabs live in their own scroller; the gear is a sibling outside it so it never scrolls or drifts
    var scroll = el("div.os-tabs-scroll");
    TABS.forEach(function (t) {
      scroll.appendChild(el("div.os-tab" + (t.key === activeTab ? ".active" : ""), {
        onclick: function () { activeTab = t.key; if (t.onSelect) t.onSelect(); render(); }
      }, [el("span", { text: t.glyph }), document.createTextNode(t.label)]));
    });
    nav.appendChild(scroll);
    // settings gear, pinned to the right end of the rail
    if (EN.settings && EN.settings.gearTab) nav.appendChild(EN.settings.gearTab());
  }

  var _lastTab = null;
  function render() {
    // per-character theme: repaint to whatever the active Freelancer selected (no-op if unchanged)
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
    var tab = TABS.find(function (t) { return t.key === activeTab; });
    if (tab.view) { tab.view(view); }
    else {
      view.appendChild(el("div", null, [
        el("h1", { style: { fontSize: "22px", marginBottom: "6px" }, text: tab.label.toUpperCase() }),
        el("div.muted-box", { style: { marginTop: "20px", padding: "40px" }, html: tab.glyph + " &nbsp; MODULE PENDING<br><br>" + tab.stub })
      ]));
    }
    if (_lastTab === activeTab) {                          // same view → stay put
      window.scrollTo(sx, sy);
      Array.prototype.forEach.call(document.querySelectorAll(WELLS), function (w, i) {
        if (wells[i]) w.scrollTop = wells[i];
      });
    } else window.scrollTo(0, 0);                          // tab switch → start at top
    _lastTab = activeTab;
    // reflect active name
    var ch = store.active();
    document.getElementById("active-name").textContent = ch ? (ch.name || "UNNAMED FREELANCER").toUpperCase() : "NO FREELANCER LOADED";
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
    if (!s) return;
    s.textContent = "SYNC…"; s.style.color = "var(--warn)";
    clearTimeout(flashSave._t);
    flashSave._t = setTimeout(function () { s.textContent = "SYNC OK"; s.style.color = "var(--success)"; }, 280);
  }

  /* clock */
  function tickClock() {
    var c = document.getElementById("os-clock");
    if (c) { var d = new Date(); c.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0"); }
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
      // optional access gate (js/gate.js); falls back to opening directly if removed
      if (EN.gate && EN.gate.require) EN.gate.require(reveal); else reveal();
    }
    step();
  }

  function start() {
    store.load();
    // Any non-silent store change re-renders the active view. (Text fields use
    // silent updates, so typing never triggers a disruptive re-render.)
    store.on(function () { flashSave(); render(); });
    renderTabs();
    render();
    tickClock(); setInterval(tickClock, 1000);
    boot();
  }

  return { start: start, render: render, activeTab: function () { return activeTab; }, gotoTab: function (k) { activeTab = k; render(); } };
})();

document.addEventListener("DOMContentLoaded", EN.app.start);
