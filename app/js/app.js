/* ===========================================================================
   ELYSIUM NIGHTS — #GRID Smartdeck OS bootstrap
   Boot sequence, tab routing, OS chrome, autosave indicator.
   =========================================================================== */
window.EN = window.EN || {};

EN.app = (function () {
  var el = EN.ui.el, store = EN.store;

  // Tabs. Only "#PRINT" is built today; the rest are stubs that read the same
  // character record once they're implemented (the foundation is shared).
  var TABS = [
    { key: "print",   label: "#PRINT",    glyph: "▤", view: function (m) { EN.builder.render(m); } },
    { key: "combat",  label: "Freelancer", glyph: "✦", view: function (m) { EN.combatView.render(m); } },
    { key: "grid",    label: "#GRID",     glyph: "⌬", view: function (m) { EN.gridView.render(m); } },
    { key: "flow",    label: "Flow",      glyph: "❋", stub: "Reservoir, Invocations, Resonances, Strain — for Shapers." },
    { key: "gear",    label: "Inventory", glyph: "▣", view: function (m) { EN.inventoryView.render(m); } },
    { key: "codex",   label: "Codex",     glyph: "❒", view: function (m) { EN.codexView.render(m); } }
  ];
  var activeTab = "print";

  function renderTabs() {
    var nav = document.getElementById("os-tabs");
    EN.ui.clear(nav);
    TABS.forEach(function (t) {
      nav.appendChild(el("div.os-tab" + (t.key === activeTab ? ".active" : ""), {
        onclick: function () { activeTab = t.key; render(); }
      }, [el("span", { text: t.glyph }), document.createTextNode(t.label)]));
    });
  }

  var _lastTab = null;
  function render() {
    // re-renders empty the view, which momentarily collapses the page and lets
    // the browser clamp scroll to the top — capture and restore the position.
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
      var b = document.getElementById("boot");
      b.classList.add("hide");
      document.getElementById("os").style.display = "flex";
      setTimeout(function () { b.style.display = "none"; }, 520);
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

  return { start: start, render: render, gotoTab: function (k) { activeTab = k; render(); } };
})();

document.addEventListener("DOMContentLoaded", EN.app.start);
