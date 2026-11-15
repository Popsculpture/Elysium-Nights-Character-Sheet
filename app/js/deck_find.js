/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDeck: search (P2, 15 Nov 2026).
   One box for "where is that": the rules (the Codex's own search), the gear on the record, the people the
   Freelancer can reach, and the handful of things a player goes looking for a button to do. Opened from the
   status bar or with Ctrl K (Cmd K on a Mac), over whatever screen is open, and gone again on Escape.
   Since P4 a piece of gear opens in Gear with that piece picked.

   It is an overlay of its own, outside #view and outside the render loop, like the Codex peek: typing in it
   is never interrupted by a redraw. A rule opens in the peek drawer over the page; gear and people open the
   app that holds them; a "do" row calls what its button would.
   Nothing is searched that another file does not already hold: EN.codexView.search, the record's equipment
   and contacts. DOM rules as in js/deck_shell.js. No em or en dashes (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.find = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;
  var F = null;        // the open overlay: { root, input, list, from, sel }
  var MAX_RULES = 8, MAX_EACH = 6;

  function live() { return !!document.getElementById("dk-dock"); }   // the shell is up: this skin, a filed record, the Freelancer desktop
  function reading() { try { return EN.deck.shell.reading(); } catch (e) { return null; } }

  // what a player goes looking for a button to do. `when` hides a row that would do nothing right now.
  function actions(c) {
    var canAct = !!(c && !c.readOnly && c.st);
    var rec = EN.deck.record, hud = EN.deck.hud, shell = EN.deck.shell;
    return [
      { label: "Take a short rest", hint: "Rest", when: canAct, go: function () { hud.openRest("short"); } },
      { label: "Take a long rest", hint: "Rest", when: canAct, go: function () { hud.openRest("long"); } },
      { label: "Downtime", hint: "Rest", when: canAct, go: function () { hud.openRest("down"); } },
      { label: "Level up", hint: "Record", when: !!rec, go: function () { rec.open("level"); } },
      { label: "Switch character", hint: "Record", when: !!rec, go: function () { rec.open("chars"); } },
      { label: "Create a new character", hint: "Record", when: !!(EN.builder && EN.builder.newRecord), go: function () { EN.builder.newRecord(); } },
      { label: "Open your record", hint: "Record", when: !!rec, go: function () { rec.open("dossier"); } },
      { label: "Edit your record", hint: "Record", when: !!rec, go: function () { rec.open("edit"); } },
      { label: "Open the Codex", hint: "Rules", when: true, go: function () { EN.app.gotoTab("codex"); } },
      { label: "Open Settings", hint: "", when: !!EN.settings, go: function () { EN.settings.open(); } },
      { label: "Go to the Sheet", hint: "App", when: true, go: function () { shell.go("sheet"); } },
      { label: "Go to Gear", hint: "App", when: true, go: function () { shell.go("gear"); } },
      { label: "Go to #POST", hint: "App", when: true, go: function () { shell.go("post"); } },
      { label: "Go to Standing", hint: "App", when: true, go: function () { shell.go("standing"); } }
    ].filter(function (a) { return a.when; });
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
        out.push({ group: "Your gear", title: e.name, count: seen[e.name], hint: "Gear", go: function () {
          if (EN.deck.gear && EN.deck.gear.show) EN.deck.gear.show(EN.engine.entryKey(e)); else EN.deck.shell.go("gear");
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
  // every render: gone with the dock (another skin, the Admin desktop, no filed record)
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
