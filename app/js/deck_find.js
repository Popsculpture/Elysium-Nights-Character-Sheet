/* ===========================================================================
   ELYSIUM NIGHTS · SEARCH (15 Nov 2026, the author's call; it began as #GRIDeck's, and that skin was removed on 20 Nov 2026).
   One box for "where is that": the rules (the Codex's own search), the gear on the record, the people the Freelancer can
   reach, and the handful of things a player goes looking for a button to do. With Classic's status rail up, a search box
   stands in the top bar where the record's name was (js/deck_shell.js, paintFindBox), and Ctrl K (Cmd K on a Mac) opens it
   over whatever tab is open; Escape puts it away. A find goes to Classic's own places: a rule opens in the peek drawer, a
   piece of gear opens the Stash's Gear page on its shelf, a person opens Contacts, and a "do" row opens #PRINT or a tab.

   It is an overlay of its own, outside #view and outside the render loop, like the Codex peek: typing in it is never
   interrupted by a redraw. Nothing is searched that another file does not already hold: EN.codexView.search, the record's
   equipment and contacts. One .dk root, dk- classes only. No em or en dashes (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.find = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;
  var F = null;        // the open overlay: { root, input, list, from, sel }
  var MAX_RULES = 8, MAX_EACH = 6;

  function live() { return !!document.getElementById("os-rail"); }   // Classic's status rail is up
  function reading() { try { return EN.deck.shell.reading(); } catch (e) { return null; } }

  // what a player goes looking for a button to do. `when` hides a row that would do nothing right now.
  function actions(c) {
    var canAct = !!(c && !c.readOnly && c.st);
    var hud = EN.deck.hud;
    function rest(view) { hud.openRest(view); }
    // Classic's own places: #PRINT for the record, and the tabs as its rail names them
    var B = EN.builder || {}, tabs = Array.prototype.map.call(document.querySelectorAll("#os-tabs .os-tab[data-tab]"), function (n) { return { key: n.getAttribute("data-tab"), label: (n.textContent || "").trim() }; });
    return [
      { label: "Take a short rest", hint: "Rest", when: canAct, go: function () { rest("short"); } },
      { label: "Take a long rest", hint: "Rest", when: canAct, go: function () { rest("long"); } },
      { label: "Downtime", hint: "Rest", when: canAct, go: function () { rest("down"); } },
      { label: "Level up", hint: "#PRINT", when: !!B.openAdvance, go: function () { try { B.openAdvance(); } catch (e) {} EN.app.gotoTab("print"); } },
      { label: "Switch character", hint: "#PRINT", when: !!B.openManager, go: function () { EN.app.gotoTab("print"); B.openManager(); } },
      { label: "Create a new character", hint: "#PRINT", when: !!B.newRecord, go: function () { B.newRecord(); } },
      { label: "Open your record", hint: "#PRINT", when: true, go: function () { EN.app.gotoTab("print"); } },
      { label: "Open the Codex", hint: "Rules", when: true, go: function () { EN.app.gotoTab("codex"); } },
      { label: "Open Settings", hint: "", when: !!EN.settings, go: function () { EN.settings.open(); } }
    ].concat(tabs.filter(function (t) { return t.key !== "codex" && t.key !== "print"; }).map(function (t) {
      return { label: "Go to " + t.label, hint: "Tab", when: true, go: function () { EN.app.gotoTab(t.key); } };
    })).filter(function (a) { return a.when; });
  }
  function results(q) {
    var c = reading(), ch = c && c.ch, want = q.trim().toLowerCase(), out = [];
    function has(s) { return String(s || "").toLowerCase().indexOf(want) !== -1; }
    var acts = actions(c);
    if (!want) {
      acts.slice(0, 8).forEach(function (a) { out.push({ group: "Do", title: a.label, hint: a.hint, go: a.go }); });
      return out;
    }
    acts.filter(function (a) { return has(a.label); }).slice(0, MAX_EACH).forEach(function (a) { out.push({ group: "Do", title: a.label, hint: a.hint, go: a.go }); });
    // the rules: the Codex's own search, two letters and up, opened in the peek drawer over the page
    var hits = [];
    try { hits = EN.codexView && EN.codexView.search ? EN.codexView.search(q) : []; } catch (e) { hits = []; }
    hits.slice(0, MAX_RULES).forEach(function (hit) {
      out.push({ group: "Rules", title: hit.title, hint: hit.crumb, anchor: hit.anchor, go: function () { EN.codexView.peek(hit.anchor); } });
    });
    if (ch) {
      // what is on the record: one row a name, however many entries carry it
      var seen = {};
      (ch.equipment || []).filter(function (e) { return e && e.name && has(e.name) && !(e.qty != null && e.qty <= 0); }).forEach(function (e) {
        if (seen[e.name]) { seen[e.name].n += (e.qty || 1); return; }
        seen[e.name] = { n: e.qty || 1 };
        if (Object.keys(seen).length > MAX_EACH) return;
        out.push({ group: "Your gear", title: e.name, count: seen[e.name], hint: "Stash", go: function () {
          // the Stash's Gear page, with the shelf this piece is on unfolded
          try { var I = EN.inventoryView, it = I.core.findItem(e.name); if (I.openStash) I.openStash(it ? I.core.stashCategory(it) : null); } catch (x) {}
          EN.app.gotoTab("gear");
        } });
      });
      ((ch.face && ch.face.contacts) || []).filter(function (p) { return p && (has(p.name) || has(p.handle)); }).slice(0, MAX_EACH).forEach(function (p) {
        out.push({ group: "People", title: p.name || p.handle || "Unnamed contact", hint: p.work || "Contact", go: function () {
          try { EN.faceView.setSub("contacts"); } catch (e) {}
          EN.app.gotoTab("face");
        } });
      });
    }
    return out;
  }

  function close(refocus) {
    if (!F) return;
    var f = F; F = null;
    if (f.root.parentNode) f.root.parentNode.removeChild(f.root);
    if (refocus !== false && f.from && document.contains(f.from)) { try { f.from.focus({ preventScroll: true }); } catch (e) {} }
  }
  function rows() { return F ? Array.prototype.slice.call(F.list.querySelectorAll(".dk-opt")) : []; }
  function select(i) {
    var r = rows();
    if (!r.length) { F.sel = -1; F.input.removeAttribute("aria-activedescendant"); return; }
    F.sel = (i + r.length) % r.length;
    r.forEach(function (n, k) { n.classList.toggle("dk-sel", k === F.sel); n.setAttribute("aria-selected", k === F.sel ? "true" : "false"); });
    F.input.setAttribute("aria-activedescendant", r[F.sel].id);
    try { r[F.sel].scrollIntoView({ block: "nearest" }); } catch (e) {}
  }
  function fill() {
    var q = F.input.value, list = results(q), group = "";
    clear(F.list);
    list.forEach(function (x, i) {
      if (x.group !== group) { group = x.group; F.list.appendChild(el("div.dk-palg", { text: group })); }
      var data = { dkFind: x.group }; if (x.anchor) data.dkAnchor = x.anchor;
      F.list.appendChild(el("button.dk-opt", { type: "button", id: "dk-find-" + i, role: "option", dataset: data,
        onclick: function () { close(false); x.go(); },
        onmousemove: function () { if (F && F.sel !== i) select(i); } },
        [el("b", { text: x.title + (x.count && x.count.n > 1 ? " ×" + x.count.n : "") }), el("small", { text: x.hint || "" })]));
    });
    if (!list.length) F.list.appendChild(el("p.dk-empty", { text: q.trim().length < 2 ? "Keep typing: rules are searched from two letters." : "Nothing by that name." }));
    else if (!q.trim()) F.list.appendChild(el("p.dk-empty", { text: "Type to search the rules, your gear and the people you know." }));
    select(0);
  }
  function open() {
    if (!live()) return false;
    if (F) { try { F.input.focus(); F.input.select(); } catch (e) {} return true; }
    var os = document.getElementById("os");
    if (!os) return false;
    try { if (EN.deck.hud) EN.deck.hud.closePop(); } catch (e) {}
    F = { from: document.activeElement, sel: -1 };
    F.list = el("div.dk-pall", { id: "dk-find-list", role: "listbox", "aria-label": "Results" });
    F.input = el("input.dk-in.dk-palq", { type: "text", placeholder: "Search rules, your gear and people, or type what you want to do", autocomplete: "off", spellcheck: "false",
      role: "combobox", "aria-expanded": "true", "aria-controls": "dk-find-list", "aria-label": "Search",
      oninput: fill,
      onkeydown: function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); select(F.sel + 1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); select(F.sel - 1); }
        else if (e.key === "Enter") { e.preventDefault(); var r = rows()[F.sel]; if (r) r.click(); }
      } });
    F.root = el("div#dk-find.dk", null, [
      el("div.dk-scrim", { onclick: function () { close(); } }),
      el("div.dk-pal", { role: "dialog", "aria-modal": "true", "aria-label": "Search" }, [F.input, F.list])
    ]);
    os.appendChild(F.root);
    fill();
    try { F.input.focus({ preventScroll: true }); } catch (e) {}
    return true;
  }
  // every render: gone with the rail (another skin, the Admin desktop, no filed record)
  function sync(show) { if (F && !show) close(false); }

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && String(e.key).toLowerCase() === "k") {
      if (!live()) return;
      e.preventDefault();
      if (F) close(); else open();
      return;
    }
    if (e.key === "Escape" && F) { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  }, true);

  return { open: open, close: close, sync: sync, isOpen: function () { return !!F; }, results: results };
})();
