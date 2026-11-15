/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDeck: Standing (P5, 15 Nov 2026).
   Where the Freelancer stands with the world, on one page: Faction Standing with its pressure state, Cred and
   Heat, the Profiles others hold, and Debts. It is the Social tab's ledger, the same rows on the same record
   (ch.face), drawn as cards to press: a faction's posture is a row of five to pick from, a pressure state
   a row of three, and Cred and Heat step between 0 and 10.

   The stage bar keeps "Classic ledger", the ledger as Classic draws it, for the two things this page does not
   hold: the Lifelike lineage's Personas, and the quick reference with its Costs After a Roll. The rules
   themselves are a press away in the Codex from each card.

   Every read and write is the Social tab's own (EN.faceView.core.read and .write), and the ladders and names
   are its rows (the book's names, from EN.social). Text is written without a redraw, as the tab does, so the
   cursor stays where it is. DOM rules as in js/deck_shell.js. No em or en dashes (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.standing = (function () {
  var el = EN.ui.el;
  function F() { return EN.faceView.core; }
  function cxHas(a) { try { return !!(a && EN.codexView && EN.codexView.has && EN.codexView.has(a)); } catch (e) { return false; } }
  function rule(anchor, label) {
    if (!cxHas(anchor)) return null;
    return el("button.dk-link", { type: "button", dataset: { dkRule: anchor }, onclick: function () { EN.codexView.peek(anchor); } }, label || "Rule");
  }
  function tone(color) { var c = String(color || ""); return /success/.test(c) ? "ok" : /danger/.test(c) ? "bad" : /warn/.test(c) ? "warn" : /accent/.test(c) ? "acc" : "dim"; }
  function set(key, i, k, v, silent) { F().write(function (f) { if (f[key][i]) f[key][i][k] = v; }, silent); }
  function field(key, i, k, value, placeholder, cls) {
    return el("input.dk-in" + (cls ? "." + cls : ""), { type: "text", value: value || "", placeholder: placeholder, "aria-label": placeholder, dataset: { dkField: key + ":" + i + ":" + k },
      oninput: function () { set(key, i, k, this.value, true); } });
  }
  function remove(key, i, what) {
    return el("button.dk-sq.dk-rm", { type: "button", "aria-label": "Remove " + what, title: "Remove", dataset: { dkRemove: key + ":" + i }, onclick: function () { F().write(function (f) { f[key].splice(i, 1); }); } }, "✕");
  }
  function scale(key, i, k, options, cur) {
    return el("div.dk-scale", { role: "group", dataset: { dkScale: key + ":" + i + ":" + k } }, options.map(function (o) {
      var on = cur === o.k;
      return el("button" + (on ? ".on.dk-s-" + tone(o.color) : ""), { type: "button", "aria-pressed": on ? "true" : "false", dataset: { dkPick: o.k }, onclick: function () { set(key, i, k, o.k); } }, o.label);
    }));
  }
  function card(key, title, sub, anchor, blank, rows, empty, wide) {
    return el("section.dk-card.dk-st" + (wide ? ".dk-full" : ""), { dataset: { dkStanding: key } }, [
      el("h4.dk-h", null, [title, sub ? el("small", { text: sub }) : null, el("span.dk-grow"), rule(anchor)])
    ].concat(rows.length ? rows : [el("p.dk-empty", { text: empty })]).concat([
      el("button.dk-btn.sm.ghost", { type: "button", dataset: { dkAdd: key }, onclick: function () { F().write(function (f) { f[key].push(JSON.parse(JSON.stringify(blank))); }); } }, "+ Add")
    ]));
  }
  function track(key, i, rec, k, placeholder, cls) {
    var v = Math.max(0, Math.min(10, rec.value || 0));
    return el("div.dk-tr", { dataset: { dkRowOf: key + ":" + i } }, [
      field(key, i, k, rec[k], placeholder),
      el("span.dk-track", null, [el("span.dk-fill." + cls, { style: { width: (v * 10) + "%" } })]),
      el("em", { text: String(v) }),
      el("button.dk-sq", { type: "button", "aria-label": "Lower", disabled: v <= 0, dataset: { dkStep: "-1" }, onclick: function () { set(key, i, "value", v - 1); } }, "−"),
      el("button.dk-sq", { type: "button", "aria-label": "Raise", disabled: v >= 10, dataset: { dkStep: "1" }, onclick: function () { set(key, i, "value", v + 1); } }, "+"),
      remove(key, i, rec[k] || "this row")
    ]);
  }

  function render(stage, c) {
    var ch = c.ch, L = F().read(ch), root = el("div.dk.dk-stand", { dataset: { dkStand: "1" } });
    var grid = el("div.dk-sgrid");
    grid.appendChild(card("factions", "Faction standing", "posture, and how the room is right now", "so-standing", { name: "", standing: "neutral", state: "open" },
      L.factions.map(function (r, i) {
        return el("div.dk-fr", { dataset: { dkRowOf: "factions:" + i } }, [field("factions", i, "name", r.name, "Faction, office or district"),
          scale("factions", i, "standing", F().standings.slice().reverse(), r.standing || "neutral"), scale("factions", i, "state", F().states, r.state || "open"), remove("factions", i, r.name || "this faction")]);
      }), "No factions tracked. Most start Neutral; standing shifts through contracts, betrayal, debts and major scenes.", true));
    grid.appendChild(card("cred", "Cred", "your name in a scene, 0 to 10", null, { scene: "", value: 0 },
      L.cred.map(function (r, i) { return track("cred", i, r, "scene", "Underground music, the fixer net...", "dk-f-ok"); }),
      "No scenes tracked. Cred is what a specific community thinks when your name comes up."));
    grid.appendChild(card("heat", "Heat", "who is looking for you, 0 to 10", null, { source: "", value: 0 },
      L.heat.map(function (r, i) { return track("heat", i, r, "source", "Corp X, the south precinct...", "dk-f-bad"); }),
      "No Heat tracked. Heat is who is actively looking for you, watching you, or willing to act against you."));
    grid.appendChild(card("profiles", "Profiles", "how each room reads you", "so-profiles/profiles", { label: "", source: "", note: "" },
      L.profiles.map(function (r, i) {
        return el("div.dk-pr", { dataset: { dkRowOf: "profiles:" + i } }, [field("profiles", i, "label", r.label, "Reliable, Under Watch..."), field("profiles", i, "source", r.source, "Held by"),
          field("profiles", i, "note", r.note, "The hook it pulls on", "dk-wide"), remove("profiles", i, r.label || "this Profile")]);
      }), "No Profiles yet. Every fixer, gang, precinct and shrine builds its own out of what it has seen."));
    grid.appendChild(card("debts", "Debts", "favors, obligations, future hooks", "so-profiles/debt", { dir: "owing", who: "", terms: "" },
      L.debts.map(function (r, i) {
        return el("div.dk-pr", { dataset: { dkRowOf: "debts:" + i } }, [scale("debts", i, "dir", F().debtDirs, r.dir || "owing"), field("debts", i, "who", r.who, "The other side"),
          field("debts", i, "terms", r.terms, "What is owed, and when it comes due", "dk-wide"), remove("debts", i, "this Debt")]);
      }), "No Debts on the books. Be specific: what is owed, and when it comes due."));
    root.appendChild(grid);
    // what this page does not hold, said where a player would look for it
    var lifelike = false;
    try { lifelike = F().personaSources(ch).length > 0; } catch (e) { lifelike = false; }
    root.appendChild(el("p.dk-empty.dk-st-foot", null, [lifelike ? "Your saved Personas and the quick reference for a social roll are in the " : "The quick reference for a social roll is in the ",
      el("button.dk-link", { type: "button", dataset: { dkDo: "classic-ledger" }, onclick: function () { EN.deck.shell.standingView("classic"); } }, "Classic ledger"), ". ",
      rule("so-pressure", "Social Pressure in the Codex")]));
    stage.appendChild(root);
  }

  return { render: render };
})();
