/* ===========================================================================
   ELYSIUM NIGHTS · GM toolkit views
   Three tabs on the Admin desktop: Table (the initiative tracker), Threats
   (the builder plus saved statblocks), and Bestiary. Later stages add
   Encounters, Hazards, the Job Board, and Payroll (stubs today, see app.js).

   None of this is about the active character. It reads the roster as "the
   crew" and holds its own state through EN.gmStore. The Admin desktop exists
   entirely because of this module: app.js gates every Admin tab on
   EN.gmView/EN.gmStore/EN.gmEngine all being present, so deleting the four GM
   files collapses the app back to the Freelancer-only sheet it was before.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmView = (function () {
  var el = EN.ui.el, toast = EN.ui.toast;
  var eng = EN.engine, gm = EN.gmStore;

  // transient UI state: the builder's current inputs and the bestiary filter.
  // Deliberately not persisted; a half-built threat is not worth a save slot.
  // Survives a tab switch AND a portal flip, since this is still one module.
  var _b = { gauge: 2, designation: "standard", role: "gunhand", size: "Medium", type: "Human", name: "", strong: null };
  var _best = { cat: "people", q: "" };   // bestiary filter

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
      onchange: function (e) { onPick(e.target.value); EN.app.render(); },
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

  /* ABSENT FIELDS STAY ABSENT, the same rule the bestiary data file follows for
     Resolve. A creature can have no printed attack and no single Save DC, and
     "DC null" on a tracker row is worse than a row with no DC on it. */
  function rowSummary(b) {
    var bits = [];
    if (typeof b.defense === "number") bits.push("DEF " + b.defense);
    if (typeof b.saveDC === "number") bits.push("DC " + b.saveDC);
    if (typeof b.attackBonus === "number") bits.push(eng.fmtMod(b.attackBonus) + " to hit");
    return bits.join(" · ");
  }

  /* What the book PRINTS for a creature's attack and its Save DC, which is not a
     stat line: both live inside the ability prose, as "+6 vs Defense" and
     "Tech Save DC 13".

     INITIATIVE IS NOT THE ATTACK BONUS. Reading one as the other was wrong on 26
     of the 33 entries. It survived because the two are coincidentally equal on
     the Gremlin, which is the entry this was eyeballed against, and because no
     creature that has no attack at all had been added to the order until the
     Nixie arrived and printed a number it does not have.

     A Save DC is reported only when the entry prints exactly ONE. The Warform
     Chassis forces two different DCs, and naming either as "the" DC would be a
     wrong number the GM has no way to see past. */
  function printed(e) {
    var st = e.stats || {};
    var body = (e.abilities || []).map(function (a) { return a.text; }).join(" ");
    var atk = body.match(/([+-]\d+)\s+vs\s+Defense/);
    var uniq = [];
    (body.match(/Save\s+DC\s+(\d+)/g) || []).forEach(function (d) {
      var v = d.replace(/[^0-9]+/g, "");
      if (uniq.indexOf(v) < 0) uniq.push(v);
    });
    var a = atk ? Number(atk[1]) : null;
    var dc = uniq.length === 1 ? Number(uniq[0]) : null;
    // a digital threat swings and forces saves under its own names, and states
    // both outright rather than inside prose, so the row reads them directly
    if (a === null && st["Cipher Attack"]) a = parseInt(st["Cipher Attack"], 10);
    if (dc === null && st["Cipher Save DC"]) dc = parseInt(st["Cipher Save DC"], 10);
    return { attackBonus: isNaN(a) ? null : a, saveDC: isNaN(dc) ? null : dc };
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
          /* Sets the active character and stops there, rather than jumping to
             their sheet. A jump would cross desktops (gotoTab is portal-aware,
             so "combat" lives on the Freelancer side) and pull the GM off the
             Admin desktop mid-fight, which is the thing the two-desktop split
             exists to stop happening. */
          el("button.btn.sm", { title: "Make this the active Freelancer",
            onclick: function () {
              EN.store.setActive(row.charId);
              toast((name.trim() || "Freelancer") + " is now the active Freelancer. Open the Freelancer portal to see the sheet.");
            } }, "SET ACTIVE"),
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
          el("span.help", { text: rowSummary(b) })
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


  /* ---- the bestiary --------------------------------------------------------
     Renders the book's printed numbers, and only those. Several entries do not
     reproduce what the generator would build for them; that is a note for the
     author and it lives in DEFERRED-FIXES, not on a card somebody is reading
     mid-fight. An earlier version printed the mismatch here in warning amber on
     eleven of the thirty-one entries, which put QA output in a working tool and
     told a GM nothing they could act on. */
  function bestiaryCard(e) {
    var kids = [];
    kids.push(el("h4", { style: { margin: "0 0 2px" }, text: e.name }));
    kids.push(el("p.help", { style: { margin: "0 0 8px", fontStyle: "italic" }, text: e.identity || "" }));

    var st = e.stats || {};
    // 29 entries carry the physical block. The two #GRID threats do not, and a
    // renderer that assumed they did would print a row of blanks for them.
    var physical = ["Defense", "DR", "Vitality", "Speed", "Initiative", "Saves", "Passive Perception"];
    var node = ["Security Rating", "Cipher Save", "System Integrity", "Firewall Damage Threshold",
                "Cipher Attack", "Cipher Save DC"];
    var shown = physical.filter(function (k) { return st[k]; });
    if (!shown.length) shown = node.filter(function (k) { return st[k]; });
    if (shown.length) {
      kids.push(el("div.row.wrap", { style: { gap: "12px" } }, shown.map(function (k) {
        return fld(k.toUpperCase().replace("PASSIVE PERCEPTION", "PASSIVE PERC"), st[k]);
      })));
    }
    if (e.skills && e.skills.length) {
      kids.push(el("p.help", { style: { margin: "4px 0 0" },
        text: e.skills.map(function (k) { return k.name + " " + k.value; }).join(" \u00b7 ") }));
    }
    if (st["Unshakable, Defensive Impulses"]) {
      kids.push(el("p.help", { style: { margin: "5px 0 0", color: "var(--gold)" },
        text: "Solo: " + st["Unshakable, Defensive Impulses"] }));
    }
    ["Immune", "Resistance"].forEach(function (k) {
      if (st[k]) kids.push(el("p.help", { style: { margin: "3px 0 0" }, text: k + ": " + st[k] }));
    });

    (e.abilities || []).forEach(function (a) {
      var ap = el("p", { style: { margin: "6px 0 0", fontSize: "13px" } }, [
        el("span", { style: { fontWeight: 600 }, text: a.name + (a.cost ? " (" + a.cost + ")" : "") + ": " })
      ]);
      EN.ui.applyInline(ap, a.text);
      kids.push(ap);
    });

    var tail = [];
    if (st.XP) tail.push("XP " + st.XP);
    // Resolve is on 11 entries only, and its ABSENCE means the conversation is
    // over before it starts, so a blank must not be printed in its place.
    if (st.Resolve) tail.push("Resolve " + st.Resolve);
    if (tail.length) kids.push(el("p.help", { style: { margin: "8px 0 0" }, text: tail.join(" \u00b7 ") }));
    if (e.gear) kids.push(el("p.help", { style: { margin: "3px 0 0" }, text: "Gear: " + e.gear }));
    if (e.salvage) kids.push(el("p.help", { style: { margin: "3px 0 0" }, text: "Salvage: " + e.salvage }));
    if (e.signs) kids.push(el("p.help", { style: { margin: "3px 0 0" }, text: "Signs: " + e.signs }));
    if (e.variant) kids.push(el("p.help", { style: { margin: "5px 0 0", color: "var(--text2)" },
      text: e.variant.label + ": " + e.variant.text }));
    if (e.gmNote) kids.push(el("p.help", { style: { margin: "5px 0 0", color: "var(--accent)" },
      text: "GM: " + e.gmNote }));
    /* Job hooks are a titled LIST, not a paragraph: each one is its own idea with
       its own name, and a GM skimming for tonight's job wants to find the one
       they want rather than read a block to the end. */
    if (e.hooks) {
      kids.push(el("p.help", { style: { margin: "8px 0 3px", color: "var(--accent)" }, text: e.hooks.title }));
      e.hooks.items.forEach(function (h) {
        var hp = el("p.help", { style: { margin: "0 0 3px 12px" } }, [
          el("span", { style: { fontWeight: 600, fontStyle: "italic" }, text: h.name + ". " })
        ]);
        // the book cross-references an ability by name in bold inside hook prose,
        // so this text carries inline markup and a plain text node printed the
        // asterisks raw. EN.ui.applyInline is the existing reader for that.
        EN.ui.applyInline(hp, h.text);
        kids.push(hp);
      });
    }

    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "10px" } }, [
      el("button.btn.sm.primary", { onclick: function () {
        // a bestiary entry enters the order as its PRINTED self, not as a build
        var st = e.stats || {};
        // a #GRID threat has no Vitality; System Integrity is the track that depletes
        var vit = parseInt(st.Vitality, 10);
        if (isNaN(vit)) vit = parseInt(st["System Integrity"], 10);
        var def = parseInt(st.Defense, 10);
        var initM = parseInt((st.Initiative || "0").replace("+", ""), 10) || 0;
        var p = printed(e);
        var block = {
          name: e.name, gauge: e.gauge, designationName: e.designation || "Standard",
          roleName: e.role || "", defense: isNaN(def) ? null : def,
          saveDC: p.saveDC, attackBonus: p.attackBonus, vitality: isNaN(vit) ? 1 : vit,
          fromBestiary: true, stats: st, abilities: e.abilities || []
        };
        var r = eng.rollD20({ mods: [{ label: "Initiative", value: initM }] });
        gm.addThreat(block, null, r.total);
        toast(e.name + " rolls " + r.total + " for initiative.");
        EN.app.render();
      } }, "+ ADD TO INITIATIVE")
    ]));
    return el("div.feature", null, kids);
  }

  function bestiaryPanel() {
    var B = EN.bestiary;
    if (!B) return null;
    var kids = [];

    kids.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "8px" } },
      B.categories.map(function (c) {
        return el("span.chip" + (_best.cat === c.key ? ".on" : ""), {
          style: { cursor: "pointer", fontSize: "10.5px" },
          onclick: function () { _best.cat = c.key; EN.app.render(); }
        }, c.name + " (" + c.count + ")");
      })));

    kids.push(el("input", { type: "text", value: _best.q, placeholder: "search every entry by name, ability or gear",
      style: { width: "100%", marginBottom: "10px" },
      oninput: function (ev) {
        _best.q = ev.target.value;
        // a local re-render, because a full one would steal focus mid-word
        var host = ev.target.parentNode.querySelector(".best-list");
        if (host) { EN.ui.clear(host); listInto(host); }
      } }));

    var list = el("div.best-list");
    kids.push(list);
    listInto(list);

    function listInto(host) {
      var q = (_best.q || "").trim().toLowerCase();
      var rows = B.entries.filter(function (e) {
        if (q) return JSON.stringify(e).toLowerCase().indexOf(q) !== -1;
        return e.category === _best.cat;
      });
      if (!rows.length) {
        host.appendChild(el("p.help", { text: "Nothing matches." }));
        return;
      }
      if (q) host.appendChild(el("p.help", { style: { marginBottom: "6px" },
        text: rows.length + " of " + B.entries.length + " entries match, across every category." }));
      rows.forEach(function (e) { host.appendChild(bestiaryCard(e)); });
    }

    return EN.ui.panel("Bestiary", B.entries.length + " STATBLOCKS", kids);
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

  /* ---- the Admin desktop's own tab rail, one renderer per tab -------------
     Each one writes its own heading block rather than sharing a header
     helper across views, per the house convention that views carry their own
     small pieces instead of importing from one another. */
  function heading(title, sub) {
    return el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" },
        html: title + ' <span class="dim3" style="font-size:13px">' + sub + "</span>" })
    ]);
  }

  function renderTable(mount) {
    EN.ui.clear(mount);
    // the tracker is the only surface that draws a crew row, so it is the
    // only place a ghost from a character deleted since the last render
    // can appear
    gm.pruneCrew();
    mount.appendChild(el("div", null, [heading("Table", "// initiative and the order"), trackerPanel()]));
  }

  function renderThreats(mount) {
    EN.ui.clear(mount);
    var blocks = [heading("Threats", "// build a statblock from Gauge, Designation and Role"), builderPanel()];
    var saved = savedPanel();
    if (saved) { blocks.push(el("div", { style: { height: "12px" } })); blocks.push(saved); }
    mount.appendChild(el("div", null, blocks));
  }

  function renderBestiary(mount) {
    EN.ui.clear(mount);
    var best = bestiaryPanel();
    // bestiaryPanel() returns null when EN.bestiary never loaded. A tab that
    // is entirely absent reads as broken, so say so rather than showing nothing.
    var body = best || el("div.muted-box", { text: "Bestiary data did not load. Check app/data/bestiary.js." });
    mount.appendChild(el("div", null, [heading("Bestiary", "// 33 statblocks, transcribed from Part 4"), body]));
  }

  return { renderTable: renderTable, renderThreats: renderThreats, renderBestiary: renderBestiary };
})();
