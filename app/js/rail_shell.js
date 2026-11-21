/* ===========================================================================
   ELYSIUM NIGHTS · CLASSIC'S STATUS RAIL: where it is mounted (15 Nov 2026, the author's call).
   Classic's Freelancer desktop carries a status bar on a rail of its own, #os-rail, between the top bar and the tab rail, on
   every tab, for a filed record (an example and a viewed sheet count, as they do for the tabs). The bar is js/rail_hud.js;
   the name on it opens the Record drawer (js/rail_record.js); the search box that takes the name's place in the top bar, and
   Ctrl K, open the search (js/rail_find.js). html.st-rail turns their look on (css/rail.css) and moves the pinned chrome
   down. Not on #GRIDroid or '98, which lay their chrome out their own way, and not on the Admin desktop.

   These files began as #GRIDeck, a fourth OS skin, which was removed on 20 Nov 2026 (the author's call: it gave good ideas
   but did not meet the mark). What Classic borrowed from it stays, under the same names: EN.deck.shell, .hud, .record and
   .find, `.dk` roots and `dk-` classes.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.shell = (function () {
  var el = EN.ui.el;

  /* ONE READING OF THE OPEN RECORD PER RENDER. derive() is not kept between calls, so the rail, the Record drawer and the
     search all read this one. */
  function context() {
    var ch = EN.store.active();
    if (!ch) return null;
    var c = { ch: ch, d: null, st: null, fx: null,
              readOnly: !!((EN.store.activeIsViewing && EN.store.activeIsViewing()) || (ch.meta && EN.store.isLocked && EN.store.isLocked(ch.meta.id) && !(EN.store.activeIsExample && EN.store.activeIsExample()))) };
    try {
      c.d = EN.engine.derive(ch);
      var core = EN.combatView && EN.combatView.core;
      if (ch.class && core) { c.st = core.state(ch, c.d); c.fx = core.condEffects(ch, c.d); }
    } catch (e) { console.error("The status rail could not read this record", e); }
    return c;
  }

  function drop(id) { var n = document.getElementById(id); if (n && n.parentNode) n.parentNode.removeChild(n); }

  function railWanted(os, portal) {
    var h = document.documentElement.classList;
    return !!os && !h.contains("skin-98") && !h.contains("skin-droid") && portal === "freelancer" && !!EN.store.active() && EN.app.registered() && !!EN.deck.hud;
  }
  function paintRail(os, c) {
    var rail = document.getElementById("os-rail");
    if (!rail) {
      rail = el("div#os-rail", { role: "group", "aria-label": "Status" });
      os.insertBefore(rail, document.getElementById("os-tabs"));
    }
    // Classic's own class colours (theme.css, [data-cls]): --cls on the rail, for the resource's name and pips
    if (c.ch.class) rail.setAttribute("data-cls", c.ch.class); else rail.removeAttribute("data-cls");
    EN.deck.hud.paint(rail, c);
  }
  /* THE SEARCH BOX IN CLASSIC'S TOP BAR (15 Nov 2026, the author's call). With the rail up the record's name is on the rail,
     so the name in the top bar's right corner is put away (css/rail.css) and its place holds a search box: a press, or
     Ctrl K, opens the search (js/rail_find.js), which sends a find to Classic's own tabs. */
  function paintFindBox(top) {
    if (!top || document.getElementById("os-find")) return;
    top.appendChild(el("button#os-find", { type: "button", title: "Search rules, your gear and people (Ctrl K)", "aria-label": "Search", "aria-haspopup": "dialog",
      onclick: function () { if (EN.deck.find) EN.deck.find.open(); } },
      [el("span.os-find-ic", { html: EN.app.tabIcon("codex") }), el("span.os-find-l", { text: "Search" }), el("kbd", { text: "Ctrl K" })]));
  }

  /* ---- chrome(): called by js/app.js on EVERY render, whatever the skin. It draws the rail when it is wanted and takes it
     away otherwise (another skin, the Admin desktop, no record, or a record still being built), with the search box, the
     Record drawer and the search, which go with it. */
  var _was = false;
  function chrome(portal) {
    var os = document.getElementById("os"), top = document.querySelector(".os-topbar");
    var rail = railWanted(os, portal);
    document.documentElement.classList.toggle("st-rail", rail);
    if (rail) paintFindBox(top); else { drop("os-rail"); drop("os-find"); }
    if (rail !== _was) { _was = rail; if (EN.deck.find) EN.deck.find.sync(false); if (EN.deck.record) EN.deck.record.close(false); }
    var c = rail ? context() : null;
    if (rail) paintRail(os, c);
    else if (EN.deck.hud) EN.deck.hud.remove();
    if (EN.deck.record) EN.deck.record.sync(c);
    if (EN.deck.find) EN.deck.find.sync(rail);
  }

  return { chrome: chrome, reading: context,
           // will this render carry the status rail? js/combat.js asks, so the Freelancer tab does not draw what the rail holds
           railOn: function () { return railWanted(document.getElementById("os"), EN.app.portal()); } };
})();
