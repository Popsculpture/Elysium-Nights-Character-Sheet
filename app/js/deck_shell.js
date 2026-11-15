/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDeck: the shell (P1, 14 Nov 2026).
   The fourth OS skin is more than a restyle: the Freelancer desktop gets a dock of four apps (Sheet, Gear,
   #POST, Standing) and a status bar that is on every screen (js/deck_hud.js). This file is the shell around
   them; css/deck.css is its look. It runs only while html.skin-deck is on, which settings.js (effectiveSkin)
   sets on the Freelancer desktop alone.

   NO TAB STATE OF ITS OWN. The app shown is worked out from the tab the rest of the program already tracks
   (EN.app.activeTab(): combat, flow, grid, gear, face, codex, print), so EN.app.gotoTab and every caller of it
   land where they should with no edits: combat, flow and grid are the Sheet; gear is Gear; face is Standing or
   #POST by the Social tab's own page (EN.faceView.sub()); codex is the Codex; print is the record.

   STRANGLER BUILD. Every app began by HOSTING THE EXISTING VIEW (tab.view) inside a stage, so the skin was
   usable from the first day; each phase swaps one for a screen of its own, and this file is the only place
   that decides which is drawn. The Sheet is its own since P3 (js/deck_sheet.js), Gear since P4
   (js/deck_gear.js), and #POST and Standing since P5 (js/deck_post.js, js/deck_standing.js). The tab each
   replaced, as Classic draws it, stays one press away on the stage's bar ("Classic sheet", "Classic
   inventory", "Classic ledger"), for the few things the new screen does not hold yet. Contacts is still the
   Social tab's own page, drawn bare (no heading, no three-way switch) under #POST's bar.

   DOM RULES. Everything this skin draws itself sits under a `.dk` root and uses `dk-` classes only: never
   .panel, .btn, .chip or .stat, and never an inline border-radius. The Classic rules in theme.css
   (html:not(.skin-98):not(.skin-droid) ...) match this skin too, on purpose: a hosted view and a reused overlay
   look exactly like tested Classic, and nothing here can pick those rules up by accident. A hosted view is
   mounted OUTSIDE any .dk root for the same reason.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.shell = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;

  // the four apps, in dock order: the tab each opens, and the Social page for the two that share one tab
  var APPS = [
    { key: "sheet",    label: "Sheet",    tab: "combat" },
    { key: "gear",     label: "Gear",     tab: "gear" },
    { key: "post",     label: "#POST",    tab: "face", sub: "post" },
    { key: "standing", label: "Standing", tab: "face", sub: "ledger" }
  ];

  function on() { return document.documentElement.classList.contains("skin-deck"); }
  function faceSub() { try { return EN.faceView.sub(); } catch (e) { return "ledger"; } }
  // which app a tab key shows as
  function appOf(key) {
    if (key === "combat" || key === "flow" || key === "grid") return "sheet";
    if (key === "gear") return "gear";
    if (key === "face") return faceSub() === "ledger" ? "standing" : "post";
    if (key === "codex") return "codex";
    return "record";
  }
  // what else decides the view under a tab key: js/app.js adds it to the key a scroll position is kept under
  var _classic = false;   // the Sheet app is showing the Freelancer tab as Classic draws it (transient, like a sub-tab)
  var _gear = "mine";     // Gear's page: mine | market | classic (the Inventory tab as Classic draws it)
  var _ledger = "standing";   // Standing's page: standing | classic (the Social tab's ledger as Classic draws it)
  function subKey(key) { return key === "face" ? faceSub() + (faceSub() === "ledger" && _ledger === "classic" ? "-classic" : "") : (key === "combat" && _classic) ? "classic" : key === "gear" ? _gear : ""; }
  function nativeFace(c) { return !!(c && c.ch && EN.faceView && EN.faceView.core && EN.faceView.core.read); }
  function standingView(k) { _ledger = k === "classic" ? "classic" : "standing"; if (EN.faceView && EN.faceView.setSub) EN.faceView.setSub("ledger"); EN.app.gotoTab("face"); EN.app.render(); }
  function nativeGear(c) { return !!(c && c.ch && c.d && EN.deck.gear); }
  function gearView(k) { _gear = (k === "market" || k === "classic") ? k : "mine"; EN.app.gotoTab("gear"); EN.app.render(); }

  // the author's own icons, from where they already live: nothing is redrawn here
  function icon(name) {
    var A = EN.app, F = (EN.faceView && EN.faceView.icons) || {};
    if (name === "sheet") return A.tabIcon("combat");
    if (name === "gear") return A.tabIcon("gear");
    if (name === "post") return F.post || "";
    if (name === "standing") return F.ledger || "";
    if (name === "codex") return A.tabIcon("codex");
    if (name === "flow") return A.tabIcon("flow");
    if (name === "grid") return A.tabIcon("grid");
    if (name === "settings") return (EN.settings && EN.settings.gearIcon) || "";
    return "";
  }

  /* ONE READING OF THE OPEN RECORD PER RENDER. derive() is not kept between calls, so the stage's bar, the dock
     and the status bar all read this one. view() makes it and chrome() takes it, since js/app.js runs them in
     that order within one render; a render that drew no stage makes its own. */
  var _ctx = null;
  function context() {
    var ch = EN.store.active();
    if (!ch) return null;
    var c = { ch: ch, d: null, st: null, fx: null,
              readOnly: !!((EN.store.activeIsViewing && EN.store.activeIsViewing()) || (ch.meta && EN.store.isLocked && EN.store.isLocked(ch.meta.id) && !(EN.store.activeIsExample && EN.store.activeIsExample()))) };
    try {
      c.d = EN.engine.derive(ch);
      var core = EN.combatView && EN.combatView.core;
      if (ch.class && core) { c.st = core.state(ch, c.d); c.fx = core.condEffects(ch, c.d); }
    } catch (e) { console.error("#GRIDeck could not read this record", e); }
    return c;
  }

  function go(app) {
    var a = APPS.filter(function (x) { return x.key === app; })[0];
    if (!a) return;
    // a popover left open on the tab being left goes with it, the way a rail tap closes it
    try { if (EN.combatView && EN.combatView.closePops) EN.combatView.closePops(); } catch (e) {}
    try { if (EN.inventoryView && EN.inventoryView.closePops) EN.inventoryView.closePops(); } catch (e) {}
    if (a.sub && EN.faceView && EN.faceView.setSub) EN.faceView.setSub(a.sub);
    EN.app.gotoTab(a.tab);
  }

  /* ---- the stage: one wrapper in #view, a bar of its own where an app has more than one face, and the view.
     js/app.js puts the read-only banner in front of #view's first child, so the stage must be that one child. */
  function segBar(items) {
    return el("div.dk.dk-bar", null, [el("div.dk-seg", { role: "group" }, items.map(function (i) {
      var data = { dkSeg: i.key }; if (i.tour) data.tour = i.tour;
      return el("button.dk-segb" + (i.on ? ".on" : ""), { type: "button", dataset: data, "aria-pressed": i.on ? "true" : "false", onclick: i.go },
        [i.icon ? el("span.dk-ic", { html: i.icon }) : null, document.createTextNode(i.label)]);
    }))]);
  }
  function stageBar(key, app, c) {
    if (app === "sheet") {
      var d = c && c.d;
      // Flow is the Shaper's; #GRID is for whoever jacks in (a Codebreaker, or anyone with a deck). The view that is
      // open is always listed, so a jump from a card (a Relay's FIRE ON #GRID) never leaves the player with no way back.
      var flow = !!(d && d.flow) || key === "flow";
      var grid = !!(d && d.grid && (d.grid.isCodebreaker || d.grid.deck)) || key === "grid";
      var own = nativeSheet(c);   // a record with no class yet has no Sheet of this skin's to offer
      if (!flow && !grid && !own) return null;
      var items = [{ key: "combat", label: "Sheet", icon: icon("sheet") }];
      if (flow) items.push({ key: "flow", label: "Flow", icon: icon("flow") });
      if (grid) items.push({ key: "grid", label: "#GRID", icon: icon("grid") });
      items.forEach(function (i) { i.on = i.key === key && !(key === "combat" && _classic && own); i.go = function () { _classic = false; EN.app.gotoTab(i.key); EN.app.render(); }; });
      if (own) items.push({ key: "classic", label: "Classic sheet", on: key === "combat" && _classic, go: function () { _classic = true; EN.app.gotoTab("combat"); EN.app.render(); } });
      return segBar(items);
    }
    if (app === "gear") {
      if (!nativeGear(c)) return null;
      return segBar([["mine", "Mine"], ["market", "Market"], ["classic", "Classic inventory"]].map(function (x) {
        return { key: x[0], label: x[1], icon: x[0] === "mine" ? icon("gear") : null, on: _gear === x[0], go: function () { gearView(x[0]); } };
      }));
    }
    if (app === "standing") {
      if (!nativeFace(c) || !EN.deck.standing) return null;
      return segBar([["standing", "Standing"], ["classic", "Classic ledger"]].map(function (x) {
        return { key: x[0], label: x[1], icon: x[0] === "standing" ? icon("standing") : null, on: _ledger === x[0], go: function () { standingView(x[0]); } };
      }));
    }
    if (app === "post") {
      var s = faceSub();
      return segBar([["post", "Messages", icon("post")], ["contacts", "Contacts", (EN.faceView.icons || {}).contacts]].map(function (x) {
        // the guided tour's last step points at Contacts (data-tour, js/tour.js)
        return { key: x[0], label: x[1], icon: x[2], on: s === x[0], tour: x[0] === "contacts" ? "social-contacts" : null, go: function () { EN.faceView.setSub(x[0]); EN.app.render(); } };
      }));
    }
    return null;
  }
  /* CREATION IS ITS OWN ENVIRONMENT (P6). #PRINT is where a record is made and where a filed one is edited; under this skin it
     takes the whole screen (chrome() puts the dock and the status bar away) under one bar that says whose record it is, which
     step of the builder is up, and the way back. The builder itself is hosted as it is, with its own rail and its tour. */
  function createBar(c) {
    var ch = c && c.ch, filed = EN.app.registered(), steps = [], key = null, at = -1;
    try { steps = EN.builder.steps(); key = EN.builder.stepKey(); } catch (e) { steps = []; }
    steps.forEach(function (s, i) { if (s.key === key) at = i; });
    var name = ch && typeof ch.name === "string" ? ch.name.trim() : "";
    return el("div.dk.dk-crt", { dataset: { dkCreate: filed ? "edit" : "new", dkStep: key || "" } }, [
      el("div.dk-crt-t", null, [
        el("b", { text: filed ? (name || "Your Freelancer") + ": the record" : name ? "Creating " + name : "Creating a Freelancer" }),
        el("span", { text: at >= 0 ? "Step " + (at + 1) + " of " + steps.length + " \u00b7 " + steps[at].t : "#PRINT" })]),
      el("div.dk-crt-p", { "aria-hidden": "true" }, steps.map(function (s, i) { return el("i" + (i < at ? ".done" : i === at ? ".on" : "")); })),
      // data-ro-keep: on a read-only record the whole view ignores clicks (theme.css, #view.en-ro); with the dock put away this is the way out
      filed ? el("button.dk-btn.pri", { type: "button", "data-ro-keep": "1", dataset: { dkDo: "leave-create" }, onclick: function () { EN.app.gotoTab("combat"); } }, "Back to your Sheet")
            : el("span.dk-crt-n", { text: "File the record to open your deck." })
    ]);
  }
  /* THE CREATION BAR STAYS ON SCREEN while the builder scrolls (15 Nov 2026, the author's call). It is sticky (css/deck.css)
     under whatever is already pinned above it: the top bar, and the rail when no dock stands in for it (a record not filed
     yet). The builder's own step rail is sticky too and reads --sticky-top, so the stage tells it how far down that is now:
     under the bar, not behind it. Both figures are measured, because the bar's height turns on the name, the width and the
     font. chrome() calls this on every render; a bar that changes size afterwards (a web font landing, the window turning)
     is measured again. */
  var _pinWatch = null;
  function pinMeasure(bar) {
    var top = 0;
    [".os-topbar", "#os-tabs"].forEach(function (s) {
      var n = document.querySelector(s), cs = n ? getComputedStyle(n) : null;
      if (!cs || cs.display === "none" || cs.position !== "sticky") return;
      top = Math.max(top, (parseFloat(cs.top) || 0) + n.offsetHeight);
    });
    var stage = bar.parentNode, stuck = getComputedStyle(bar).position === "sticky";
    stage.style.setProperty("--dk-crt-top", (top + 8) + "px");
    // a bar that scrolls away (a record not filed yet, on a phone) leaves the step rail right under what is pinned
    stage.style.setProperty("--sticky-top", (stuck ? top + 8 + bar.offsetHeight : top + 6) + "px");
  }
  function pinnedBar() { return document.querySelector("#view .dk-stage > .dk-crt"); }
  function pinCreate() {
    var bar = pinnedBar();
    if (_pinWatch) _pinWatch.disconnect();
    if (!bar) return;
    pinMeasure(bar);
    if (window.ResizeObserver) {
      _pinWatch = _pinWatch || new ResizeObserver(function () { var b = pinnedBar(); if (b) pinMeasure(b); });
      _pinWatch.observe(bar);
    }
  }
  window.addEventListener("resize", function () { var b = pinnedBar(); if (b) pinMeasure(b); });
  function nativeSheet(c) { return !!(c && c.d && c.st && c.fx && EN.deck.sheet); }
  function view(mount, tab) {
    var c = _ctx = context(), app = appOf(tab.key);
    var stage = el("div.dk-stage", { dataset: { dkApp: app } });
    var bar = app === "record" && c ? createBar(c) : stageBar(tab.key, app, c);
    if (bar) stage.appendChild(bar);
    mount.appendChild(stage);
    // the Sheet is this skin's own; if it cannot be drawn, the Freelancer tab stands in rather than a blank page
    if (app === "sheet" && tab.key === "combat" && !_classic && nativeSheet(c)) {
      try { EN.deck.sheet.render(stage, c); stage.setAttribute("data-dk-native", "sheet"); return; }
      catch (e) {
        console.error("#GRIDeck could not draw the Sheet; showing the Freelancer tab", e);
        clear(stage);
        if (bar) stage.appendChild(bar);
      }
    }
    // #POST is a messenger and Standing a page of cards; Contacts and the Classic ledger are the Social tab's own pages, bare
    if (tab.key === "face" && nativeFace(c)) {
      var page = faceSub();
      try {
        if (page === "post" && EN.deck.post) { EN.deck.post.render(stage, c); stage.setAttribute("data-dk-native", "post"); return; }
        if (page === "ledger" && _ledger !== "classic" && EN.deck.standing) { EN.deck.standing.render(stage, c); stage.setAttribute("data-dk-native", "standing"); return; }
      } catch (e3) {
        console.error("#GRIDeck could not draw this page; showing the Social tab's", e3);
        clear(stage);
        if (bar) stage.appendChild(bar);
      }
      var bareHost = el("div.dk-host");
      stage.appendChild(bareHost);
      EN.faceView.render(bareHost, { sub: page, bare: true });
      return;
    }
    if (app === "gear" && _gear !== "classic" && nativeGear(c)) {
      try { EN.deck.gear.render(stage, c, _gear); stage.setAttribute("data-dk-native", "gear"); return; }
      catch (e2) {
        console.error("#GRIDeck could not draw Gear; showing the Inventory tab", e2);
        clear(stage);
        if (bar) stage.appendChild(bar);
      }
    }
    var host = el("div.dk-host");
    stage.appendChild(host);
    tab.view(host);
  }

  /* ---- the dock: its own node inside #os (so print.css hides it with the rest), made when the skin needs it
     and removed when it does not, which leaves every other skin's page exactly as it was. */
  function dockBtn(name, label, cur, onclick, badge, tour) {
    var data = { dk: name }; if (tour) data.tour = tour;
    return el("button.dk-app" + (cur ? ".on" : ""), { type: "button", title: label, dataset: data, "aria-current": cur ? "page" : null, onclick: onclick }, [
      el("span.dk-ic", { html: icon(name) }), el("span.dk-lb", { text: label }),
      badge ? el("span.dk-badge", { title: badge + (badge === 1 ? " unread message" : " unread messages") + " in #POST", text: String(badge) }) : null
    ]);
  }
  function paintDock(os, key, c) {
    var dock = document.getElementById("dk-dock");
    if (!dock) {
      dock = el("nav#dk-dock.dk", { "aria-label": "Apps" });
      os.insertBefore(dock, document.getElementById("view"));
    }
    var held = dock.contains(document.activeElement) ? document.activeElement.getAttribute("data-dk") : null;
    var cur = appOf(key), unread = 0;
    try { unread = EN.faceView.unread(c.ch) || 0; } catch (e) { unread = 0; }
    clear(dock);
    dock.appendChild(el("div.dk-mark", { "aria-hidden": "true", text: "#" }));
    APPS.forEach(function (a) {
      // away from #POST, the way to Contacts is the dock's #POST button: the tour points there until the switch is on screen
      dock.appendChild(dockBtn(a.key, a.label, cur === a.key, function () { go(a.key); }, a.key === "post" && cur !== "post" ? unread : 0,
        a.key === "post" && cur !== "post" ? "social-contacts" : null));
    });
    dock.appendChild(el("span.dk-grow"));
    dock.appendChild(dockBtn("codex", "Codex", cur === "codex", function () { EN.app.gotoTab("codex"); }));
    dock.appendChild(dockBtn("settings", "Settings", false, function () {
      if (!EN.settings) return;
      if (document.getElementById("set-ov")) EN.settings.close(); else EN.settings.open();
    }));
    // a key press on a dock button redraws the dock under it: the same button keeps the focus
    if (held) { var again = dock.querySelector('[data-dk="' + held + '"]'); if (again) { try { again.focus({ preventScroll: true }); } catch (e) {} } }
  }
  function drop(id) { var n = document.getElementById(id); if (n && n.parentNode) n.parentNode.removeChild(n); }

  /* ---- chrome(): called by js/app.js on EVERY render, whatever the skin. It draws the dock and the status bar
     when this skin is in force on the Freelancer desktop with a filed record open, and takes both away
     otherwise (another skin, the Admin desktop, no record, or a record still being built: that one sees
     #PRINT alone, as it does on every skin). */
  function chrome(portal, key) {
    var os = document.getElementById("os"), top = document.querySelector(".os-topbar");
    var c = _ctx; _ctx = null;
    var show = !!os && !!top && on() && portal === "freelancer" && !!EN.store.active() && EN.app.registered();
    if (os) os.classList.toggle("dk-creating", show && key === "print");
    if (!show) {
      drop("dk-dock");
      if (EN.deck.hud) EN.deck.hud.remove();
      if (EN.deck.record) EN.deck.record.sync(null);
      if (EN.deck.find) EN.deck.find.sync(false);
      if (os) os.style.removeProperty("--dk-accent");
      pinCreate();   // a record not filed yet has no dock and no status bar, but it has the creation bar
      return;
    }
    if (!c || c.ch !== EN.store.active()) c = context();
    // the deck wears the class's own colour (data/class_identity.js, the author's pairs); no class, the palette's accent
    var cls = c.ch.class, CI = EN.classIdentity;
    if (cls && CI && CI.has(cls)) os.style.setProperty("--dk-accent", CI.colors[cls].main); else os.style.removeProperty("--dk-accent");
    paintDock(os, key, c);
    // in creation the status bar is put away with the dock (css/deck.css hides the dock, which stays so the rail stays hidden)
    if (EN.deck.hud) { if (key === "print") EN.deck.hud.remove(); else EN.deck.hud.paint(top, c); }
    // the Record drawer, when it is out, shows the record as it is now (js/deck_record.js)
    if (EN.deck.record) EN.deck.record.sync(c);
    // last, once the dock and the status bar are as they will be: where the creation bar pins
    pinCreate();
  }

  return { on: on, appOf: appOf, subKey: subKey, view: view, chrome: chrome, go: go, reading: context, gearView: gearView, standingView: standingView, apps: function () { return APPS.map(function (a) { return a.key; }); } };
})();
