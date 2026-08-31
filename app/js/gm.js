/* ===========================================================================
   ELYSIUM NIGHTS · GM tab
   Stage 1 of the Game Master's Toolkit: the initiative tracker and the threat
   builder. Later stages add the bestiary, encounter budgeting, hazards and set
   pieces, the job board, and paying the crew.

   This is the only view in the app that is not about the active character. It
   reads the roster as "the crew" and holds its own state through EN.gmStore.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmView = (function () {
  var el = EN.ui.el, toast = EN.ui.toast;
  var eng = EN.engine, gm = EN.gmStore;

  // transient UI state: the builder's current inputs, and which panels are open.
  // Deliberately not persisted; a half-built threat is not worth a save slot.
  var _b = { gauge: 2, designation: "standard", role: "gunhand", size: "Medium", type: "Human", name: "", strong: null };
  var _open = { build: true, saved: false };
  var _preview = null;

  // local copies rather than imports, per the house convention that each view
  // carries its own small helpers instead of a shared utils file
  function bar(cur, max, color) {
    var pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
    return el("div", { style: { height: "6px", borderRadius: "3px", background: "var(--bg3)", overflow: "hidden" } },
      [el("div", { style: { height: "100%", width: pct + "%", background: color || "var(--danger)" } })]);
  }
  function stepper(onMinus, onPlus) {
    return el("div.row", { style: { gap: "4px" } }, [
      el("button.btn.sm", { onclick: onMinus, style: { padding: "0 7px" } }, "−"),
      el("button.btn.sm", { onclick: onPlus, style: { padding: "0 7px" } }, "+")
    ]);
  }
  function lbl(t) { return el("label.fl", { text: t }); }

  /* ---- the threat builder ------------------------------------------------- */
  function pick(field, options, current, onPick) {
    var s = el("select", {
      onchange: function (e) { onPick(e.target.value); _preview = null; EN.app.render(); },
      style: { minWidth: "130px" }
    }, options.map(function (o) {
      return el("option", { value: o.value, selected: String(o.value) === String(current) }, o.label);
    }));
    return el("div.field", { style: { margin: 0 } }, [lbl(field), s]);
  }

  function builderPanel() {
    var T = EN.threats;
    var block = EN.gmEngine.buildThreat(_b);
    var kids = [];

    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end" } }, [
      el("div.field", { style: { margin: 0, minWidth: "150px" } }, [
        lbl("Name"),
        el("input", { type: "text", value: _b.name, placeholder: "Corpsec Officer",
          oninput: function (e) { _b.name = e.target.value; } })
      ]),
      pick("Gauge", T.gauges.map(function (g) { return { value: g.g, label: "G" + g.g }; }), _b.gauge,
        function (v) { _b.gauge = Number(v); }),
      pick("Designation", T.designations.map(function (d) { return { value: d.key, label: d.name }; }), _b.designation,
        function (v) { _b.designation = v; }),
      pick("Role", T.roles.map(function (r) { return { value: r.key, label: r.name }; }), _b.role,
        function (v) { _b.role = v; _b.strong = null; }),
      pick("Size", (EN.rules.sizes || ["Medium"]).map(function (s) { return { value: s, label: s }; }), _b.size,
        function (v) { _b.size = v; }),
      pick("Type", T.types.map(function (t) { return { value: t, label: t }; }), _b.type,
        function (v) { _b.type = v; })
    ]));

    /* WHICH attributes this threat saves well in. The book names them outright and
       varies them per threat, so this is a choice rather than a derived value. The
       Role supplies a starting point and nothing more. */
    var curStrong = (_b.strong && _b.strong.length ? _b.strong
      : ((T.saveHintByRole || {})[_b.role] || ["BOD"])).slice(0, 2);
    var attrOpts = (EN.rules.attributes || []).map(function (a) { return { value: a.key, label: a.name }; });
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "flex-end", marginTop: "10px" } }, [
      pick("Strong save", attrOpts, curStrong[0], function (v) { _b.strong = [v].concat(curStrong[1] ? [curStrong[1]] : []); }),
      pick("and (optional)", [{ value: "", label: "none" }].concat(attrOpts), curStrong[1] || "",
        function (v) { _b.strong = v ? [curStrong[0], v] : [curStrong[0]]; }),
      el("p.help", { style: { margin: 0, maxWidth: "320px" },
        text: "The book names these per threat rather than deriving them. The Role only suggests a starting point." })
    ]));

    var gauge = T.gauges.filter(function (g) { return g.g === _b.gauge; })[0];
    if (gauge) kids.push(el("p.help", { style: { margin: "8px 0 0" }, text: "G" + gauge.g + ". " + gauge.reads + " Matched crew: " + gauge.crew + "." }));
    var rol = T.roles.filter(function (r) { return r.key === _b.role; })[0];
    if (rol) kids.push(el("p.help", { style: { margin: "3px 0 0", color: "var(--text2)" }, text: rol.name + ". " + rol.text }));

    kids.push(el("div", { style: { height: "10px" } }));
    kids.push(statblock(block));

    // the working band: a threat more than one Gauge off the crew is worth saying out loud
    var band = bandNote(_b.gauge);
    if (band) kids.push(el("p.help", { style: { margin: "8px 0 0", color: "var(--warn)" }, text: band }));

    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "12px" } }, [
      el("button.btn.sm.primary", { onclick: function () {
        var b = EN.gmEngine.buildThreat(_b);
        gm.addThreat(b, JSON.parse(JSON.stringify(_b)), 0);
        toast((b.name || "Threat") + " added to the order. Set its initiative.");
        EN.app.render();
      } }, "+ ADD TO INITIATIVE"),
      el("button.btn.sm", { onclick: function () {
        var b = EN.gmEngine.buildThreat(_b);
        gm.saveThreat(b, JSON.parse(JSON.stringify(_b)));
        toast((b.name || "Threat") + " saved.");
        EN.app.render();
      } }, "SAVE STATBLOCK")
    ]));

    return EN.ui.panel("Threat Builder", "GAUGE · DESIGNATION · ROLE", kids);
  }

  /* The crew's Caliber is the yardstick, so the warning only fires when there is
     a crew to compare against. Silence is correct with an empty roster. */
  function bandNote(g) {
    var roster = (EN.store.roster && EN.store.roster()) || {};
    var cals = Object.keys(roster).map(function (k) {
      try { return eng.derive(roster[k]).caliber; } catch (e) { return null; }
    }).filter(function (c) { return c; });
    if (!cals.length) return null;
    var avg = Math.round(cals.reduce(function (a, b) { return a + b; }, 0) / cals.length);
    var d = g - avg;
    if (d <= 1 && d >= -1) return null;
    if (d === 2) return "Two Gauges above the crew's Caliber " + avg + ". That can anchor a climax if it arrives with a plan or an escape route.";
    if (d > 2) return "Three or more Gauges above the crew's Caliber " + avg + ". The book is blunt about this one: that is not an encounter, it is weather.";
    return "Well below the crew's Caliber " + avg + ". Fine as texture or numbers, not as a fight.";
  }

  function fld(k, v) {
    return el("div", { style: { display: "flex", gap: "6px", alignItems: "baseline" } }, [
      el("span.mono", { style: { fontSize: "10px", letterSpacing: ".1em", color: "var(--text3)" }, text: k }),
      el("span", { style: { fontFamily: "var(--mono)", fontSize: "13px" }, text: String(v) })
    ]);
  }

  /* The card's own field order, so a statblock reads the same here as on the
     page. Optional fields stay absent rather than printing empty: Resolve is
     missing from most of the bestiary on purpose, and its absence means the
     conversation is over before it starts. */
  function statblock(b) {
    if (!b) return el("p.help", { text: "No statblock." });
    var kids = [];
    kids.push(el("h4", { style: { margin: "0 0 2px" }, text: b.name || "Unnamed threat" }));
    kids.push(el("p.help", { style: { margin: "0 0 8px", fontStyle: "italic" }, text: b.identity }));
    kids.push(el("div.row.wrap", { style: { gap: "14px" } }, [
      fld("DEF", b.defense), fld("DR", b.dr.low + " to " + b.dr.high), fld("VIT", b.vitality)
    ]));
    kids.push(el("div.row.wrap", { style: { gap: "14px", marginTop: "4px" } }, [
      fld("INIT", eng.fmtMod(b.init)), fld("SPEED", b.speed), fld("PASSIVE PERC", b.passivePerception)
    ]));
    kids.push(el("div.row.wrap", { style: { gap: "14px", marginTop: "4px" } }, [
      fld("SAVES", b.saves.text),
      fld("SAVE DC", b.saveDC), fld("XP", b.xp)
    ]));
    kids.push(el("div", { style: { height: "8px" } }));
    b.attacks.forEach(function (a) {
      kids.push(el("p", { style: { margin: "0 0 3px", fontSize: "13px" },
        text: a.label + ": " + eng.fmtMod(a.toHit) + " vs " + a.vs + ", " + a.range + ", " + a.dice }));
    });
    kids.push(el("p.help", { style: { margin: "4px 0 0" },
      text: "About " + b.damagePerRound + " damage a round before the crew's DR, spent as " + b.attacksNote + "." }));

    if (b.surges) kids.push(el("p.help", { style: { margin: "6px 0 0", color: "var(--gold)" },
      text: "Solo: " + b.surges + " Surges a round, one defensive Impulse per Freelancer turn, Unshakable, a Breakpoint below half Vitality, and one findable weakness. The weakness is not optional." }));
    if (b.noDefensiveImpulse) kids.push(el("p.help", { style: { margin: "6px 0 0" }, text: "Minion: no defensive Impulse." }));

    // the attribution. A GM wants to know where 45 Vitality came from, and one
    // shared explanation stops the card, the row and any later print wording it
    // three different ways.
    kids.push(el("div", { style: { marginTop: "10px", paddingTop: "8px", borderTop: "1px solid var(--border2)" } }, [
      el("p.help", { style: { margin: 0 }, text: "Vitality: " + b.why.vitality }),
      el("p.help", { style: { margin: 0 }, text: "Defense: " + b.why.defense }),
      el("p.help", { style: { margin: 0 }, text: "Damage: " + b.why.damage })
    ]));
    return el("div.feature", null, kids);
  }

  /* ---- the initiative tracker --------------------------------------------- */
  function crewRow(row, isNow) {
    var roster = EN.store.roster() || {};
    var ch = roster[row.charId];
    if (!ch) return null;                       // pruned on render; belt and braces
    var d;
    try { d = eng.derive(ch); } catch (e) { return null; }
    var name = (ch.firstName || "") + " " + (ch.lastName || "");
    return el("div.feature", { style: { borderLeftColor: isNow ? "var(--accent)" : "var(--border2)",
                                        background: isNow ? "var(--sunk, rgba(255,255,255,.03))" : "transparent" } }, [
      el("div.row.between.wrap", { style: { alignItems: "center", gap: "8px" } }, [
        el("div.row", { style: { gap: "10px", alignItems: "baseline" } }, [
          el("span.mono", { style: { fontSize: "17px", minWidth: "34px", color: isNow ? "var(--accent)" : "var(--text)" },
            text: String(row.init) }),
          el("span", { style: { fontWeight: 600 }, text: name.trim() || "Freelancer" }),
          el("span.chip", { style: { fontSize: "9.5px" }, text: "CREW" }),
          el("span.help", { text: "Caliber " + d.caliber + " · " + d.vitalityMax + " Vitality" })
        ]),
        el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
          el("input", { type: "number", value: row.init, style: { width: "58px" },
            oninput: function (e) {
              var v = Number(e.target.value) || 0;
              gm.update(function (s) { var r = s.encounter.entries.filter(function (x) { return x.id === row.id; })[0]; if (r) r.init = v; }, { silent: true });
            },
            onchange: function () { EN.app.render(); } }),
          el("button.btn.sm", { title: "Open this Freelancer's sheet",
            onclick: function () { EN.store.setActive(row.charId); EN.app.gotoTab("combat"); } }, "SHEET"),
          el("button.btn.sm", { onclick: function () { gm.removeEntry(row.id); EN.app.render(); } }, "✕")
        ])
      ])
    ]);
  }

  function threatRow(row, isNow) {
    var b = row.block || {};
    var pctColor = row.vit / (row.vitMax || 1) <= 0.5 ? "var(--danger)" : "var(--ember, var(--danger))";
    function hit(n) {
      gm.update(function (s) {
        var r = s.encounter.entries.filter(function (x) { return x.id === row.id; })[0];
        if (r) r.vit = Math.max(0, Math.min(r.vitMax, r.vit + n));
      });
      EN.app.render();
    }
    var down = row.vit <= 0;
    return el("div.feature", { style: { borderLeftColor: isNow ? "var(--accent)" : down ? "var(--text4)" : "var(--danger)",
                                        opacity: down ? 0.55 : 1 } }, [
      el("div.row.between.wrap", { style: { alignItems: "center", gap: "8px" } }, [
        el("div.row", { style: { gap: "10px", alignItems: "baseline", flexWrap: "wrap" } }, [
          el("span.mono", { style: { fontSize: "17px", minWidth: "34px", color: isNow ? "var(--accent)" : "var(--text)" },
            text: String(row.init) }),
          el("span", { style: { fontWeight: 600, textDecoration: down ? "line-through" : "none" }, text: row.name || "Threat" }),
          el("span.chip", { style: { fontSize: "9.5px", color: "var(--danger)", borderColor: "var(--danger)" },
            text: "G" + b.gauge + " " + (b.designationName || "").toUpperCase() }),
          el("span.help", { text: "DEF " + b.defense + " · DC " + b.saveDC + " · " + eng.fmtMod(b.attackBonus) + " to hit" })
        ]),
        el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
          el("span.mono", { style: { fontSize: "12px" }, text: row.vit + " / " + row.vitMax }),
          stepper(function () { hit(-1); }, function () { hit(1); }),
          el("input", { type: "number", value: row.init, style: { width: "58px" }, title: "Initiative",
            oninput: function (e) {
              var v = Number(e.target.value) || 0;
              gm.update(function (s) { var r = s.encounter.entries.filter(function (x) { return x.id === row.id; })[0]; if (r) r.init = v; }, { silent: true });
            },
            onchange: function () { EN.app.render(); } }),
          el("button.btn.sm", { onclick: function () { gm.removeEntry(row.id); EN.app.render(); } }, "✕")
        ])
      ]),
      el("div", { style: { marginTop: "6px" } }, [bar(row.vit, row.vitMax, pctColor)]),
      down ? el("p.help", { style: { margin: "5px 0 0" }, text: "Out of the fight." }) : null
    ]);
  }

  function trackerPanel() {
    var s = gm.get();
    var enc = s.encounter;
    var ordered = EN.gmEngine.order(enc.entries);
    var ties = EN.gmEngine.tied(enc.entries);
    var kids = [];

    var head = [
      el("span.mono", { style: { fontSize: "13px", letterSpacing: ".08em" },
        text: enc.round > 0 ? "ROUND " + enc.round : "NOT STARTED" })
    ];
    if (enc.entries.length) {
      if (enc.round === 0) {
        head.push(el("button.btn.sm.primary", { onclick: function () {
          gm.update(function (st) {
            st.encounter.round = 1;
            st.encounter.activeId = EN.gmEngine.order(st.encounter.entries)[0].id;
          });
          EN.app.render();
        } }, "▶ START ROUND 1"));
      } else {
        head.push(el("button.btn.sm.primary", { onclick: function () {
          gm.update(function (st) {
            var n = EN.gmEngine.advance(st.encounter);
            st.encounter.activeId = n.activeId;
            st.encounter.round = n.round;
            // end of round: the defensive Impulse comes back and a Solo's
            // Surges reset. Part 2 puts conditions and ongoing effects here too.
            if (n.wrapped) st.encounter.entries.forEach(function (r) { r.acted = false; });
          });
          EN.app.render();
        } }, "NEXT TURN ›"));
        head.push(EN.ui.armButton("gm:endenc", {
          label: "END", armedLabel: "END IT?", title: "Clear the encounter",
          armedTitle: "Clears every entry and resets the round counter. This cannot be undone.",
          onConfirm: function () { gm.clearEncounter(); EN.app.render(); }
        }));
      }
    }

    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "10px" } }, head));

    if (!enc.entries.length) {
      kids.push(el("div.muted-box", { style: { padding: "26px" },
        text: "Nobody in the order yet. Pull the crew in below, or build a threat and add it." }));
    } else {
      ordered.forEach(function (row) {
        var isNow = row.id === enc.activeId;
        var node = row.kind === "crew" ? crewRow(row, isNow) : threatRow(row, isNow);
        if (node) kids.push(node);
      });
    }

    if (ties.length) {
      kids.push(el("p.help", { style: { marginTop: "8px", color: "var(--warn)" },
        text: "Tied after both tie-breaks: " + ties.length + " entries. The book hands this back to the table, so roll off and nudge a number." }));
    }

    // the crew picker. Examples are excluded on purpose: setExample gives an
    // "ex_" id that never enters roster(), so an entry pointing at one would be
    // pruned as unattributable on every single reload.
    var roster = EN.store.roster() || {};
    var already = {};
    enc.entries.forEach(function (r) { if (r.kind === "crew") already[r.charId] = true; });
    var addable = Object.keys(roster).filter(function (k) { return !already[k]; });
    if (addable.length) {
      kids.push(el("div.section-title", { style: { margin: "14px 0 6px" } },
        [document.createTextNode("Pull in the crew"), el("span.line")]));
      kids.push(el("div.row.wrap", { style: { gap: "6px" } }, addable.map(function (k) {
        var ch = roster[k], d;
        try { d = eng.derive(ch); } catch (e) { return null; }
        var i = eng.initiative(d, 0);
        var nm = ((ch.firstName || "") + " " + (ch.lastName || "")).trim() || "Freelancer";
        return el("button.btn.sm", { onclick: function () {
          // d20 + Caliber + the better of Agility or Wits, per Part 2's Combat Sequence
          var r = eng.rollD20({ mods: [{ label: i.attrName, value: i.total }, { label: "Caliber", value: d.caliber }] });
          gm.addCrew(k, r.total, i.total + d.caliber);
          toast(nm + " rolls " + r.total + " for initiative.");
          EN.app.render();
        } }, "+ " + nm + " (" + eng.fmtMod(i.total + d.caliber) + ")");
      }).filter(Boolean)));
    }

    if (enc.entries.length) {
      kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "12px" } }, [
        el("button.btn.sm", { onclick: function () {
          gm.update(function (st) {
            st.encounter.entries.forEach(function (r) {
              var mod = r.initMod || 0;
              r.init = EN.engine.rollD20({ mods: [{ label: "Initiative", value: mod }] }).total;
            });
            st.encounter.activeId = EN.gmEngine.order(st.encounter.entries)[0].id;
            if (!st.encounter.round) st.encounter.round = 1;
          });
          toast("Initiative rolled for everyone.");
          EN.app.render();
        } }, "↻ REROLL ALL INITIATIVE")
      ]));
    }

    return EN.ui.panel("Initiative", enc.entries.length + (enc.entries.length === 1 ? " ENTRY" : " ENTRIES"), kids, { glow: enc.round > 0 });
  }

  function savedPanel() {
    var list = gm.savedThreats();
    if (!list.length) return null;
    var kids = list.map(function (t) {
      var b = t.block;
      return el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", padding: "5px 0",
                                                   borderBottom: "1px solid var(--border)" } }, [
        el("div.row", { style: { gap: "8px", alignItems: "baseline" } }, [
          el("span", { style: { fontWeight: 600 }, text: b.name || "Unnamed" }),
          el("span.help", { text: "G" + b.gauge + " " + b.designationName + (b.roleName ? ", " + b.roleName : "") +
            " · DEF " + b.defense + " · " + b.vitality + " Vit · " + b.xp + " XP" })
        ]),
        el("div.row", { style: { gap: "6px" } }, [
          el("button.btn.sm", { onclick: function () { gm.addThreat(b, t.inputs, 0); toast(b.name + " added."); EN.app.render(); } }, "+ ORDER"),
          el("button.btn.sm", { onclick: function () { gm.removeThreat(t.id); EN.app.render(); } }, "✕")
        ])
      ]);
    });
    return EN.ui.panel("Saved Threats", list.length + " SAVED", kids);
  }

  function render(mount) {
    EN.ui.clear(mount);
    // a character deleted since the last render leaves a ghost row, because
    // store.remove does not notify us. Cheap, idempotent, and it only persists
    // when something actually changed.
    gm.pruneCrew();

    var blocks = [];
    blocks.push(el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" },
        html: 'GM <span class="dim3" style="font-size:13px">// the other side of the table</span>' })
    ]));
    blocks.push(trackerPanel());
    blocks.push(el("div", { style: { height: "12px" } }));
    blocks.push(builderPanel());
    var saved = savedPanel();
    if (saved) { blocks.push(el("div", { style: { height: "12px" } })); blocks.push(saved); }
    mount.appendChild(el("div", null, blocks));
  }

  return { render: render };
})();
