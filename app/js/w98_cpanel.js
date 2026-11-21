/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDOS '98, THE CONTROL PANEL (phase 4, 21 Nov 2026, the author: "the full Control Panel rebuild").
   Start, Settings, Control Panel opens a folder of icons, and each icon opens a properties sheet: a window with tabs and a Close
   button, the way a Control Panel item looked. Nothing here keeps a setting of its own except the desktop extras; the sheets
   host the SAME sections the Settings tray builds (js/settings.js, EN.settings.sections), so every control, every rule and every
   palette editor is the real one, and a change made in a sheet is a change made in Settings. Display Properties is built from three
   of those sections plus a Screen Saver tab of its own. Nothing is drawn on another skin: Settings itself is untouched there.

   Original work only. No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
(function () {
  if (!EN.w98 || !EN.w98.kit || !EN.settings || !EN.settings.sections) return;
  var K = EN.w98.kit, X = EN.w98.ext, el = K.el, store = K.store;

  /* more pixel icons, for the items that have no art of the author's: two linked machines, a window grid, a die */
  K.PIX.link = '<rect x="1" y="1" width="8" height="6" fill="#000"/><rect x="2" y="2" width="6" height="4" fill="#00ffff"/><rect x="7" y="8" width="8" height="6" fill="#000"/><rect x="8" y="9" width="6" height="4" fill="#00ffff"/><rect x="5" y="7" width="1" height="2" fill="#000"/><rect x="5" y="9" width="3" height="1" fill="#000"/>';
  K.PIX.layout = '<rect x="1" y="2" width="14" height="12" fill="#000"/><rect x="2" y="3" width="12" height="10" fill="#c0c0c0"/><rect x="3" y="4" width="5" height="4" fill="#fff"/><rect x="9" y="4" width="4" height="4" fill="#fff"/><rect x="3" y="9" width="10" height="3" fill="#fff"/><rect x="3" y="4" width="5" height="1" fill="#000080"/><rect x="9" y="4" width="4" height="1" fill="#000080"/>';
  K.PIX.die = '<rect x="2" y="2" width="12" height="12" fill="#000"/><rect x="3" y="3" width="10" height="10" fill="#fff"/><rect x="4" y="4" width="2" height="2" fill="#000"/><rect x="7" y="7" width="2" height="2" fill="#000"/><rect x="10" y="10" width="2" height="2" fill="#000"/>';
  K.PIX.speaker32 = K.PIX.speaker;

  function pretty(title) {
    var t = String(title || "").replace(/^\/\/\s*/, "").trim();
    if (/^#/.test(t)) return t.replace(/^#(\w+)(.*)$/, function (m, a, b) { return "#" + a.toUpperCase() + cap(b); });
    return cap(t);
  }
  function cap(s) { return String(s).toLowerCase().replace(/(^|[\s-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); }); }

  /* an icon for each of Settings' own sections: the author's tab icons where there is one */
  var ART = {
    "CLOUD LINK": "link", "FREELANCER LAYOUT": "layout", "CHARACTERS": "docs", "DICE": "die", "WORKSPACE": "desk", "CONTENT": "folder",
    "TABLE RULES": "page", "GUIDED TOUR": "bulb", "FLOW": "tab:flow", "#GRID": "tab:grid", "TABLE": "page"
  };
  function art(name, px) {
    if (name && name.indexOf("tab:") === 0) { var p = K.programs().filter(function (x) { return x.key === name.slice(4); })[0] || { key: name.slice(4), icon: EN.app.tabIcon(name.slice(4)), glyph: "?" }; return K.tile32(p); }
    return K.pix(name || "panel", px || 32);
  }

  /* ---- a checkbox row, for the pages that are ours */
  function check(text, get, set, hint) {
    var box = el("input.w98-chk", { type: "checkbox", checked: !!get(), onchange: function () { set(box.checked); } });
    return el("div.w98-ps-row", null, [el("label.w98-tip-c", { style: { marginTop: "0" } }, [box, el("span", null, K.label(text))]), hint ? el("p.set-hint", { style: { margin: "3px 0 0 21px" }, text: hint }) : null]);
  }
  function group(legend, kids) { return el("fieldset.w98-grp", null, [el("legend", { text: legend })].concat(kids)); }

  /* ---- the sheets that are not Settings' own sections */
  function soundsPage() {
    return [
      group("Sounds", [
        check("&Play sounds", K.soundOn, function (v) { store("en_w98_sound_v1", v ? "1" : "0"); if (v) K.sound("ding"); }, "A bell for a message, a low pair for an error, a chord to start. They are made on the spot, not played from a file."),
      ]),
      group("Try them", [el("div.w98-ps-btns", null, [
        el("button.btn.sm", { type: "button", onclick: function () { K.sound("start"); } }, "Start-up"),
        el("button.btn.sm", { type: "button", onclick: function () { K.sound("ding"); } }, "Message"),
        el("button.btn.sm", { type: "button", onclick: function () { K.sound("chord"); } }, "Error"),
        el("button.btn.sm", { type: "button", onclick: function () { K.sound("stop"); } }, "Shut down")
      ])])
    ];
  }
  function extrasPage() {
    var E = EN.w98.extras || {};
    var rows = [];
    X.cplExtras.forEach(function (fn) { try { rows = rows.concat(fn()); } catch (e) {} });
    return [group("Desktop extras", rows)];
  }

  var NATIVE = [
    { id: "display", title: "Display", art: "panel", size: [480, 560], parts: function () {
      var A = EN.settings.appearance(), tabs = [
        { name: "Background", kids: A.wall },
        { name: "Appearance", kids: A.theme }
      ];
      X.display.forEach(function (t) { tabs.push({ name: t.name, kids: t.build() }); });
      tabs.push({ name: "Operating System", kids: A.skin });
      return tabs;
    } },
    { id: "sounds", title: "Sounds", art: "speaker", size: [440, 330], parts: function () { return [{ name: "Sounds", kids: soundsPage() }]; } },
    { id: "extras", title: "Desktop Extras", art: "bulb", size: [470, 400], parts: function () { return [{ name: "General", kids: extrasPage() }]; } }
  ];

  /* ---- the property-sheet window: tabs along the top, the page below, one Close button */
  var SHEETS = {};   // app key -> { id, title, parts() }
  function sheetKey(id) { return "cpl:" + id; }
  function register(id, title, artName, size, parts) {
    var key = sheetKey(id);
    SHEETS[key] = { id: id, title: title, parts: parts };
    if (K.APPS[key]) return key;
    K.APPS[key] = {
      size: size || [480, 540],
      title: function () { return title + " Properties"; },
      icon: function (px) { return art(artName, px); },
      build: function (w) {
        w.client.classList.add("w98-psclient");
        w._ps = { tab: 0, scroll: 0 };
        w.client.appendChild(el("div.w98-ps", null, [el("div.w98-tabs", { role: "tablist" }), el("div.w98-tabpane.w98-pspane", { role: "tabpanel" }), el("div.w98-ps-foot", null, [
          el("button.w98-btn.w98-def", { type: "button", onclick: function () { K.closeApp(key); } }, "Close")
        ])]));
        w.sb.querySelector(".w98-sb-b").style.display = "none";
        draw(w, key);
      },
      refresh: function (w, force) { if (force) draw(w, key); }
    };
    return key;
  }
  function draw(w, key) {
    var S = SHEETS[key], tabsEl = w.client.querySelector(".w98-tabs"), pane = w.client.querySelector(".w98-pspane");
    if (!S || !tabsEl) return;
    var parts = S.parts(), st = w._ps;
    if (st.tab >= parts.length) st.tab = 0;
    st.scroll = pane.scrollTop || st.scroll;
    EN.ui.clear(tabsEl); EN.ui.clear(pane);
    parts.forEach(function (p, i) {
      tabsEl.appendChild(el("button.w98-tab" + (i === st.tab ? ".w98-tab-on" : ""), { type: "button", role: "tab", "aria-selected": i === st.tab ? "true" : "false",
        onclick: function () { if (st.tab !== i) { st.tab = i; st.scroll = 0; draw(w, key); } } }, p.name));
    });
    (parts[st.tab].kids || []).forEach(function (n) { if (n) pane.appendChild(n); });
    pane.scrollTop = st.scroll || 0;
    w.sb.querySelector(".w98-sb-a").textContent = "Changes take effect as you make them";
  }

  /* ---- the Control Panel folder */
  function items() {
    var out = [];
    NATIVE.forEach(function (n) { out.push({ id: n.id, title: n.title, art: n.art, size: n.size, parts: n.parts }); });
    X.cpl.forEach(function (n) { out.push(n); });
    EN.settings.sections(true).forEach(function (s, i) {
      if (/APPEARANCE/i.test(s.title)) return;   // Display Properties holds it
      var id = "s" + i + "-" + s.title.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
      out.push({ id: id, title: pretty(s.title), art: ART[s.title.replace(/^\/\/\s*/, "").trim().toUpperCase()] || "panel", size: [480, 560], secTitle: s.title,
        parts: function () {
          var now = EN.settings.sections(true).filter(function (x) { return x.title === s.title; })[0];
          return [{ name: "General", kids: now ? now.kids.slice(1) : [] }];
        } });
    });
    return out;
  }
  function openItem(it) {
    var key = register(it.id, it.title, it.art, it.size, it.parts);
    K.openApp(key);
  }
  K.APPS.cpl = {
    size: [500, 380],
    title: function () { return "Control Panel"; },
    icon: function (px) { return K.pix("panel", px); },
    build: function (w) { w._sig = ""; this.refresh(w, true); },
    refresh: function (w, force) {
      var its = items(), sig = its.map(function (i) { return i.id + "=" + i.title; }).join("|");
      if (w._sig === sig && !force) return; w._sig = sig;
      EN.ui.clear(w.client);
      var box = el("div.w98-lg", { role: "listbox", "aria-label": "Control Panel" });
      its.forEach(function (it) {
        var b = el("button.w98-lgi", { type: "button", role: "option", title: it.title, dataset: { cpl: it.id },
          onpointerdown: function () { qa(".w98-sel", box).forEach(function (x) { x.classList.remove("w98-sel"); }); b.classList.add("w98-sel"); },
          ondblclick: function () { openItem(it); },
          onclick: function (e) { if (e.pointerType === "touch" || e.detail === 0) openItem(it); }
        }, [el("span.w98-ic", { html: art(it.art, 32) }), el("span.w98-dl", { text: it.title })]);
        box.appendChild(b);
      });
      w.client.appendChild(box);
      w.sb.querySelector(".w98-sb-a").textContent = its.length + " object" + (its.length === 1 ? "" : "s");
      w.sb.querySelector(".w98-sb-b").style.display = "none";
    }
  };
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // every sheet follows Settings: a control that rebuilds the tray rebuilds the open sheets too
  EN.settings.subscribe(function () {
    Object.keys(SHEETS).forEach(function (key) {
      var w = K.winOf("a:" + key);
      if (w && w.open && w.client && w.client.querySelector(".w98-pspane")) draw(w, key);
    });
    var cp = K.winOf("a:cpl");
    if (cp && cp.open) K.APPS.cpl.refresh(cp, false);
  });

  EN.w98.openControlPanel = function (item) {
    K.openApp("cpl");
    if (item) { var it = items().filter(function (x) { return x.id === item; })[0]; if (it) openItem(it); }
  };
  X.controlPanel = function () { EN.w98.openControlPanel(); };
  X.runNames["control"] = X.runNames["control panel"] = X.runNames["settings"] = function () { EN.w98.openControlPanel(); };
  X.runNames["display"] = X.runNames["desk.cpl"] = function () { EN.w98.openControlPanel("display"); };
  X.runNames["sounds"] = function () { EN.w98.openControlPanel("sounds"); };
  EN.w98.cpl = { items: items, register: register };
})();
