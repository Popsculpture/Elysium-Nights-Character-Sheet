/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDOS '98, THE FREELANCER'S PROPERTIES (23 Nov 2026, the author's call)

   What Classic's status rail gives a Freelancer, the '98 way:
     THE NAMEPLATE  heads the HUD window: the level in a sunken box, the headshot if there is one, the name over the class and
                    subclass. Pressing it opens the Properties window.
     PROPERTIES     "<name> Properties", a property sheet like the Control Panel's: the #PRINT badge and the record's pages as
                    tabs (#PRINT, Level Up, Edit Record, Characters, Notes). The pages are Classic's Record drawer's own
                    (js/rail_record.js page()), so the badge, the headshot upload and every button do exactly what they do there.
                    A button that goes to another screen (a #PRINT step, the manager) closes the window, as OK would.
     THE #PRINT ICON's right-click menu gains Properties, which opens the same window.
   The Freelancer desktop only; the Admin desktop has no record to show. No em or en dashes anywhere (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.w98props = (function () {
  if (!EN.w98 || !EN.w98.kit || !EN.w98.ext) return {};
  var K = EN.w98.kit, X = EN.w98.ext, el = K.el, KEY = "props", ID = "a:props";
  var TABS = [["badge", "#PRINT"], ["level", "Level Up"], ["edit", "Edit Record"], ["chars", "Characters"], ["notes", "Notes"]];

  function fl() { return K.portal() === "freelancer"; }
  function on() { return document.documentElement.classList.contains("skin-98") && fl(); }
  function rec() { return EN.deck && EN.deck.record && EN.deck.record.page ? EN.deck.record : null; }
  function reading() { try { return EN.deck.shell.reading(); } catch (e) { return null; } }
  function printProg() { return K.programs().filter(function (p) { return p.key === "print"; })[0] || { key: "print", label: "#PRINT" }; }
  function win() { return K.winOf(ID); }

  /* ======================================================================== THE WINDOW */
  var _want = "badge";
  K.APPS[KEY] = {
    size: [520, 640],
    title: function () { var ch = EN.store.active(); return (ch && ch.name ? ch.name : "Freelancer") + " Properties"; },
    icon: function (px) { var p = printProg(); return px >= 32 ? K.tile32(p) : K.glyph16(p); },
    build: function (w) {
      w.client.classList.add("w98-psclient", "w98-props");
      w._pr = { tab: _want, scroll: 0 };
      w._tabs = el("div.w98-tabs", { role: "tablist", "aria-label": "Pages" });
      w._pane = el("div.w98-tabpane.w98-pspane.dk", { role: "tabpanel" });
      w.client.appendChild(el("div.w98-ps", null, [w._tabs, w._pane, el("div.w98-ps-foot", null, [
        el("button.w98-btn.w98-def", { type: "button", dataset: { props: "ok" }, onclick: close }, "OK")
      ])]));
      var sb = w.sb && w.sb.querySelector(".w98-sb-b"); if (sb) sb.style.display = "none";
      draw(w, true);
    },
    refresh: function (w, force) { draw(w, force); }
  };
  function close() { K.closeApp(KEY); }
  function draw(w, force) {
    if (!w || !w._pane) return;
    var R = rec(), c = reading(), st = w._pr;
    var owed = c && R && !c.readOnly ? R.owed(c).length : 0;
    // the tabs
    EN.ui.clear(w._tabs);
    TABS.forEach(function (t) {
      var onT = st.tab === t[0];
      w._tabs.appendChild(el("button.w98-tab" + (onT ? ".w98-tab-on" : ""), { type: "button", role: "tab", "aria-selected": onT ? "true" : "false", dataset: { props: t[0] },
        onclick: function () { if (st.tab !== t[0]) { st.tab = t[0]; st.scroll = 0; draw(w, true); } } },
        [t[1], t[0] === "level" && owed ? el("i.w98-pr-dot", { title: owed + (owed === 1 ? " choice is waiting" : " choices are waiting") }) : null]));
    });
    w.sb.querySelector(".w98-sb-a").textContent = !c ? "" : c.readOnly ? "Read only" : owed ? owed + (owed === 1 ? " choice is waiting" : " choices are waiting") : "Ready";
    // the page: left alone while something in it is being typed (a sync redraws the app under the player)
    var at = document.activeElement;
    if (!force && at && w._pane.contains(at) && /^(TEXTAREA|INPUT)$/.test(at.tagName)) return;
    st.scroll = force ? st.scroll : (w._pane.scrollTop || st.scroll);
    EN.ui.clear(w._pane);
    w._pane.setAttribute("data-props-tab", st.tab);
    if (!c || !R) { w._pane.appendChild(el("p.dk-empty", { text: "No Freelancer is open. Open one from My Documents." })); return; }
    R.page(st.tab, c, close).forEach(function (n) { if (n) w._pane.appendChild(n); });
    w._pane.scrollTop = st.scroll || 0;
  }
  // open the window on a page (the nameplate and the icon open #PRINT); a window already open comes to the front on it
  function open(tab) {
    if (!fl()) return false;
    _want = TABS.some(function (t) { return t[0] === tab; }) ? tab : "badge";
    var w = win();
    if (w && w._pr) { w._pr.tab = _want; w._pr.scroll = 0; }
    K.openApp(KEY);
    w = win();
    if (w && w._pr) { w._pr.tab = _want; draw(w, true); }
    return true;
  }
  // the Admin desktop, or another skin: no window
  X.paint.push(function () { var w = win(); if (w && w.open && !fl()) close(); });

  /* ======================================================================== THE #PRINT ICON'S RIGHT-CLICK MENU */
  X.iconMenu.push(function (k) {
    if (k !== "p:print" || !fl()) return null;
    return [{ label: "P&roperties", go: function () { K.closeMenus(); open("badge"); } }];
  });

  /* ======================================================================== THE NAMEPLATE (the HUD window's head; js/combat.js asks for it) */
  function nameplate(ch, d) {
    d = d || {};
    var lvl = d.level || ch.level || 1, cal = d.caliber;
    var cl = [d.classInfo && d.classInfo.name, d.subclassInfo && d.subclassInfo.name].filter(Boolean).join(" · ");
    var pic = EN.badge && EN.badge.photo ? EN.badge.photo(ch) : "";
    var name = ch.name || "Unnamed Freelancer";
    return el("button.w98-np", { type: "button", dataset: { props: "nameplate" }, title: "Open " + name + " Properties: the #PRINT card and the record",
      "aria-label": name + ", level " + lvl + ". Open Properties", onclick: function () { open("badge"); } }, [
      el("span.w98-np-lv", { title: "Level " + lvl + (cal ? " · Caliber " + cal : "") }, [el("i", { text: "LVL" }), el("b", { text: String(lvl) })]),
      pic ? el("span.w98-np-pic", null, [el("img", { src: pic, alt: "" })]) : null,
      el("span.w98-np-t", null, [el("b", { text: name }), el("span", { text: cl || "No class yet" })]),
      ch.editFreely === true ? el("span.chip.edit-freely", { title: "Edit freely is on: this character's Talents and Lineage Evolutions can change at any time, outside the one retrain per level", text: "EDIT FREELY" }) : null
    ]);
  }

  return { on: on, open: open, close: close, nameplate: nameplate, tabs: TABS };
})();
