/* ===========================================================================
   ELYSIUM NIGHTS · GM toolkit views
   Three tabs on the Admin desktop: Table (the initiative tracker), Threats
   (the builder plus saved statblocks), and Bestiary. Encounters, Hazards, the
   Job Board and Payroll are their own files (js/gm_encounters.js and its
   siblings) and reach this one through three hooks at the bottom: a handoff
   that carries a payload to another tab, and Table extras that hang their own
   panels under the initiative order.

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
  var _b = { grade: 2, designation: "standard", role: "gunhand", size: "Medium", type: "Human", name: "", strong: null };
  // bestiary filter. `cat` is a category key, or one of the two reference views
  // ("templates", "vehicles"), which no category key collides with
  var _best = { cat: "people", q: "" };

  // local copies rather than imports, per the house convention that each view
  // carries its own small helpers instead of a shared utils file
  function bar(cur, max, color) {
    var pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
    return el("div.meter", { style: { height: "6px", borderRadius: "3px", background: "var(--bg3)", overflow: "hidden" } },
      [el("div.meter-fill", { style: { height: "100%", width: pct + "%", background: color || "var(--danger)" } })]);
  }
  function stepper(onMinus, onPlus) {
    return el("div.row", { style: { gap: "4px" } }, [
      el("button.btn.sm", { onclick: onMinus, style: { padding: "0 7px" } }, "−"),
      el("button.btn.sm", { onclick: onPlus, style: { padding: "0 7px" } }, "+")
    ]);
  }
  function lbl(t) { return el("label.fl", { text: t }); }

  /* Sends lines to the Encounters tab's plan through the shared handoff. The
     block is a copy, so a builder that keeps changing its preview after the
     click cannot change the line it just sent. An unnamed build travels under
     the name its own inputs give it, since a plan of three lines all called
     "Threat" tells the GM nothing.

     NO PROVENANCE NOTE (F21). Each button here used to send "Street Ganger, from
     the Bestiary." as the note, and the plan's intake files every note in the
     plan's own Notes, so a GM's prep notes collected one such line per line
     added and printed them in the plan's COPY. The Encounters banner already
     says what arrived, so these send an empty note, as the handoff's payload
     shape has it. */
  function toPlan(lines, note) {
    handoff("encounters", { addLines: lines, note: note || "" });
  }
  function threatLine(block) {
    var b = JSON.parse(JSON.stringify(block || {}));
    if (!b.name) b.name = "G" + b.grade + " " + (b.designationName || "Standard") + (b.roleName ? " " + b.roleName : "");
    return { kind: "threat", block: b, count: 1 };
  }

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
      pick("Grade", T.grades.map(function (g) { return { value: g.g, label: "G" + g.g }; }), _b.grade,
        function (v) { _b.grade = Number(v); }),
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

    var grade = T.grades.filter(function (g) { return g.g === _b.grade; })[0];
    if (grade) kids.push(el("p.help", { style: { margin: "8px 0 0" }, text: "G" + grade.g + ". " + grade.reads + " Matched crew: " + grade.crew + "." }));
    var rol = T.roles.filter(function (r) { return r.key === _b.role; })[0];
    if (rol) kids.push(el("p.help", { style: { margin: "3px 0 0", color: "var(--text2)" }, text: rol.name + ". " + rol.text }));

    kids.push(el("div", { style: { height: "10px" } }));
    kids.push(statblock(block));

    // the working band: a threat more than one Grade off the crew is worth saying out loud
    var band = bandNote(_b.grade);
    if (band) {
      kids.push(el("p.help", { style: { margin: "8px 0 0", color: "var(--warn)" }, text: band.lead }));
      if (band.book) kids.push(el("p.help", { style: { margin: "3px 0 0", color: "var(--text2)" }, text: band.book }));
    }

    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "12px" } }, [
      el("button.btn.sm.primary", { onclick: function () {
        var b = EN.gmEngine.buildThreat(_b);
        // a real roll off the book's formula, rather than arriving at 0 for the GM to type over
        var r = EN.gmEngine.rollInit(b.initMod);
        gm.addThreat(b, JSON.parse(JSON.stringify(_b)), r.total);
        toast((b.name || "Threat") + " rolls " + r.total + " for initiative.");
        EN.app.render();
      } }, "+ ADD TO INITIATIVE"),
      el("button.btn.sm", { onclick: function () {
        var b = EN.gmEngine.buildThreat(_b);
        gm.saveThreat(b, JSON.parse(JSON.stringify(_b)));
        toast((b.name || "Threat") + " saved.");
        EN.app.render();
      } }, "SAVE STATBLOCK"),
      el("button.btn.sm", { title: "Add this build as a line on an encounter plan", onclick: function () {
        toPlan([threatLine(EN.gmEngine.buildThreat(_b))], "");
      } }, "+ ADD TO ENCOUNTER PLAN")
    ]));

    return EN.ui.panel("Threat Builder", "GRADE · DESIGNATION · ROLE", kids);
  }

  /* The crew's Caliber is the yardstick, so the warning only fires when there is
     a crew to compare against. Silence is correct with no crew.

     THE CREW IS EN.gmEngine.crew(), the one reader Encounters, the Job Board and
     Payroll also ask (the Table's crew rows, else the filed roster). This used to
     average the whole roster, unfiled drafts included, so the Threats tab could
     warn about a crew the Encounters budget did not think existed.

     Returns { lead, book } or null. `lead` is the app's own sentence placing this
     Grade against the crew; `book` is the working band as the Handbook prints it,
     read from EN.threats.workingBand and never paraphrased here, which is how the
     third reason a two-up threat can work stopped going missing. */
  function bandNote(g) {
    var c = null;
    try { c = EN.gmEngine.crew(); } catch (e) { c = null; }
    if (!c || c.source === "none") return null;
    var d = g - c.caliber;
    if (d <= 1 && d >= -1) return null;
    var whose = (c.source === "table" ? "the crew on the Table" : "the filed crew") + " (Caliber " + c.caliber + ")";
    var lead = d >= 3 ? "Three or more Grades above " + whose + "."
      : d === 2 ? "Two Grades above " + whose + "."
      : "Two or more Grades below " + whose + ".";
    return { lead: lead, book: (EN.threats && EN.threats.workingBand) || "" };
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

     INITIATIVE IS NOT THE ATTACK BONUS. Reading one as the other is wrong on 44
     of the 46 entries that print an Initiative. It survived because the two are
     coincidentally equal on the Gremlin (and the Wetwork Operative), the Gremlin
     being the entry this was eyeballed against, and because no
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
      b.why.init ? el("p.help", { style: { margin: 0 }, text: "Initiative: " + b.why.init }) : null,
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
          // a record with no class yet derives no Vitality, and "null Vitality" is worse than nothing
          el("span.help", { text: "Caliber " + d.caliber + (typeof d.vitalityMax === "number" ? " · " + d.vitalityMax + " Vitality" : "") })
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
            text: "G" + b.grade + " " + (b.designationName || "").toUpperCase() }),
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
      kids.push(el("div.section-title", null,
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

    // an encounter run from a plan carries its name, and the tag is where the
    // panel says which fight this is
    var tag = enc.entries.length + (enc.entries.length === 1 ? " ENTRY" : " ENTRIES");
    if (enc.name) tag = String(enc.name).toUpperCase() + " · " + tag;
    return EN.ui.panel("Initiative", tag, kids, { glow: enc.round > 0 });
  }


  /* ---- the bestiary --------------------------------------------------------
     Renders the book's printed numbers, and only those. Several entries do not
     reproduce what the generator would build for them; that is a note for the
     author and it lives in DEFERRED-FIXES, not on a card somebody is reading
     mid-fight. An earlier version printed the mismatch here in warning amber on
     about a third of the cards, which put QA output in a working tool and told a
     GM nothing they could act on. */

  /* The track a Bestiary threat's damage comes off when it enters the order. A
     #GRID threat has no Vitality; System Integrity is the track that depletes.
     Feral Script prints it as a stat, but the #GRID Guardian prints it only inside
     its Persona Node ability ("Security Rating 23, System Integrity 45, ..."), so
     the ability text is read before giving up. 1 only when the entry prints none
     of the three, so a row is never a 0 Vitality ghost. An entry with Vitality
     keeps it even when an ability also names a Node's System Integrity (the
     Gutter Hacker's deck): that Node is a second target, not the body. */
  function trackOf(e) {
    var st = e.stats || {};
    var v = parseInt(st.Vitality, 10);
    if (isNaN(v)) v = parseInt(st["System Integrity"], 10);
    if (isNaN(v)) {
      var m = (e.abilities || []).map(function (a) { return a.text; }).join(" ").match(/System Integrity\s+(\d+)/);
      if (m) v = parseInt(m[1], 10);
    }
    return isNaN(v) ? 1 : v;
  }

  function bestiaryCard(e) {
    var kids = [];
    kids.push(el("h4", { style: { margin: "0 0 2px" }, text: e.name }));
    kids.push(el("p.help", { style: { margin: "0 0 8px", fontStyle: "italic" }, text: e.identity || "" }));

    var st = e.stats || {};
    // 46 entries carry the physical block. Two #GRID threats (Feral Script and the
    // #GRID Guardian) do not, and a renderer that assumed they did would print a
    // row of blanks for them.
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

    /* Damage a round, computed from the printed dice rather than read off the
       page's parenthetical. The parenthetical is floored by house style, so
       1d8+7 prints "(11)" where the true expectation is 11.5 and two attacks are
       23, not 22. Ruled 2026-09-19: the app shows the true figure, decimal and
       all, so a GM comparing a statblock against the Standard Threat Array is
       comparing like with like. */
    var rd = EN.gmEngine.roundDamage(e);
    if (rd) {
      kids.push(el("p.help", { style: { margin: "5px 0 0", color: "var(--accent)" },
        text: "Damage a round: " + EN.gmEngine.fmtAvg(rd.total) + " (" + rd.from + ", " +
              (rd.count > 1 ? rd.count + " attacks at " : "one attack at ") +
              EN.gmEngine.fmtAvg(rd.perHit) + ")" }));
    }

    (e.abilities || []).forEach(function (a) {
      var ap = el("p", { style: { margin: "6px 0 0", fontSize: "13px" } }, [
        el("span", { style: { fontWeight: 600 }, text: a.name + (a.cost ? " (" + a.cost + ")" : "") + ": " })
      ]);
      EN.ui.applyInline(ap, a.text);
      kids.push(ap);
    });

    var tail = [];
    if (st.XP) tail.push("XP " + st.XP);
    // Resolve is on 23 of the 48 entries only, and its ABSENCE means the
    // conversation is over before it starts, so a blank must not be printed in
    // its place.
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
        // a #GRID threat has no Vitality; System Integrity is the track that depletes (trackOf)
        var vit = trackOf(e);
        var def = parseInt(st.Defense, 10);
        var initM = parseInt(String(st.Initiative || "0").replace("+", ""), 10) || 0;
        var p = printed(e);
        /* The PRINTED Initiative rides on the block as initMod, which is the field
           REROLL ALL and the tie-break read. It used to be rolled once and then
           dropped, so every Bestiary threat rerolled at +0. `init` carries the same
           number because on a built block `init` IS the Initiative bonus, and a
           reader of either field should find the page's number. */
        // `designation` is the lowercase key a built block carries, so a reader
        // can ask either kind of row the same question (the Encounters tab's run
        // builds this same block for its Bestiary lines)
        var block = {
          name: e.name, grade: e.grade, designation: String(e.designation || "Standard").toLowerCase(),
          designationName: e.designation || "Standard",
          roleName: e.role || "", defense: isNaN(def) ? null : def,
          saveDC: p.saveDC, attackBonus: p.attackBonus, vitality: vit,
          init: initM, initMod: initM,
          fromBestiary: true, stats: st, abilities: e.abilities || []
        };
        var r = EN.gmEngine.rollInit(initM);
        gm.addThreat(block, null, r.total);
        toast(e.name + " rolls " + r.total + " for initiative.");
        EN.app.render();
      } }, "+ ADD TO INITIATIVE"),
      // the plan prices and runs a Bestiary line by its name, so the name is all it carries
      el("button.btn.sm", { title: "Add this entry as a line on an encounter plan", onclick: function () {
        toPlan([{ kind: "bestiary", name: e.name, count: 1 }], "");
      } }, "+ ADD TO ENCOUNTER PLAN")
    ]));
    return el("div.feature", null, kids);
  }

  /* ---- the Bestiary's reference matter -------------------------------------
     The chapter prints more than statblocks: a hunt procedure inside the
     cryptid intro, the Species Templates table and the Hostile Vehicles. All of
     it is read from EN.bestiary as printed; the cards below only lay it out. */

  // an ability-shaped line ({name, cost, text}), bold head and inline-marked prose
  function abilityP(a, style) {
    var p = el("p", { style: style || { margin: "6px 0 0", fontSize: "13px" } }, [
      el("span", { style: { fontWeight: 600 }, text: a.name + (a.cost ? " (" + a.cost + ")" : "") + ": " })
    ]);
    EN.ui.applyInline(p, String(a.text || ""));
    return p;
  }

  // the hunt's three beats, numbered as the page boxes them (01 to 03)
  function huntCard(H) {
    var kids = [el("h4", { style: { margin: "0 0 4px" }, text: H.title })];
    if (H.lead) kids.push(el("p.help", { style: { margin: "0 0 6px", color: "var(--text2)" }, text: H.lead }));
    (H.beats || []).forEach(function (b) {
      kids.push(el("div", { style: { display: "flex", gap: "10px", alignItems: "baseline", margin: "6px 0 0" } }, [
        el("span.mono", { style: { fontSize: "13px", color: "var(--accent)", minWidth: "22px" },
          text: (b.n < 10 ? "0" : "") + b.n }),
        el("p", { style: { margin: 0, fontSize: "13px" } }, [
          el("span", { style: { fontWeight: 600 }, text: b.name + ". " }),
          document.createTextNode(b.text)
        ])
      ]));
    });
    if (H.closing) kids.push(el("p.help", { style: { margin: "8px 0 0", fontStyle: "italic" }, text: H.closing }));
    return el("div.feature", { style: { borderLeftColor: "var(--accent)" } }, kids);
  }

  function referenceIntro(host, paras) {
    (paras || []).forEach(function (t) {
      host.appendChild(el("p.help", { style: { margin: "0 0 8px", color: "var(--text2)" }, text: t }));
    });
  }

  /* SPECIES TEMPLATES: one card per species, its traits printed the way a
     statblock prints an ability, and the Corporate Classification column under
     the column's own printed heading. */
  function templatesInto(host) {
    var S = EN.bestiary.speciesTemplates;
    if (!S) { host.appendChild(el("p.help", { text: "No Species Templates in the Bestiary data." })); return; }
    referenceIntro(host, S.intro);
    var classLabel = (S.columns && S.columns[2]) || "Classification";
    (S.templates || []).forEach(function (t) {
      var kids = [el("h4", { style: { margin: "0 0 2px" }, text: t.species })];
      if (t.classification) kids.push(el("p.help", { style: { margin: "0 0 4px", fontStyle: "italic" },
        text: classLabel + ": " + t.classification }));
      (t.traits || []).forEach(function (a) { kids.push(abilityP(a)); });
      host.appendChild(el("div.feature", null, kids));
    });
    if (S.footer) host.appendChild(el("p.help", { style: { margin: "4px 0 0" }, text: S.footer }));
  }

  /* A vehicle's Defense while moving depends on its pilot's Grade. The numbers
     are READ out of the book's own Threat pilots sentence ("10 + Handling + 2 at
     Grade 1 to 2, + 4 at Grade 3 to 4, or + 6 at Grade 5") rather than restated
     here, so the data file stays the one place they are written. Looks in the
     Bestiary's vehicle rules, then EN.vehicles.rules if that ever exists. Null
     when no rule parses, and the card then shows the rule's text alone. */
  function movingDefenseRule() {
    var pools = [(EN.bestiary.vehicles && EN.bestiary.vehicles.rules) || [], (EN.vehicles && EN.vehicles.rules) || []];
    for (var i = 0; i < pools.length; i++) {
      for (var j = 0; j < pools[i].length; j++) {
        var t = String((pools[i][j] && pools[i][j].text) || "");
        var base = t.match(/(\d+)\s*\+\s*Handling/i);
        if (!base) continue;
        var bands = [], re = /\+\s*(\d+)\s+at\s+Grade\s+(\d+)(?:\s+to\s+(\d+))?/gi, m;
        while ((m = re.exec(t))) bands.push({ bonus: Number(m[1]), lo: Number(m[2]), hi: m[3] ? Number(m[3]) : Number(m[2]) });
        if (bands.length) return { base: Number(base[1]), bands: bands };
      }
    }
    return null;
  }

  /* HOSTILE VEHICLES: their own card, not a statblock. A vehicle has no XP and no
     Grade; it has a profile (the PHB's vehicle fields) and a Defense that comes
     from whoever is driving. */
  function vehiclesInto(host) {
    var V = EN.bestiary.vehicles;
    if (!V) { host.appendChild(el("p.help", { text: "No Hostile Vehicles in the Bestiary data." })); return; }
    referenceIntro(host, V.intro);
    (V.rules || []).forEach(function (r) {
      host.appendChild(el("p.help", { style: { margin: "0 0 10px" } }, [
        el("span", { style: { fontWeight: 600, color: "var(--text)" }, text: r.name + ". " }),
        document.createTextNode(r.text)
      ]));
    });
    var md = movingDefenseRule();
    (V.profiles || []).forEach(function (p) {
      var kids = [el("h4", { style: { margin: "0 0 2px" }, text: p.name })];
      if (p.identity) kids.push(el("p.help", { style: { margin: "0 0 8px", fontStyle: "italic" }, text: p.identity }));
      // absent fields stay absent, as on a statblock
      var prof = [["SPEED", p.speed],
                  ["HANDLING", typeof p.handling === "number" ? eng.fmtMod(p.handling) : p.handling],
                  ["STRUCTURE", p.structure], ["INTEGRITY", p.integrity],
                  ["NODE", p.nodeTier], ["CARGO", p.cargo]];
      kids.push(el("div.row.wrap", { style: { gap: "12px" } }, prof.filter(function (f) {
        return f[1] !== undefined && f[1] !== null && f[1] !== "";
      }).map(function (f) { return fld(f[0], f[1]); })));
      if (md && typeof p.handling === "number") {
        kids.push(el("p.help", { style: { margin: "5px 0 0", color: "var(--accent)" },
          text: "Defense while moving: " + md.bands.map(function (b) {
            return (md.base + p.handling + b.bonus) + " with a Grade " + b.lo + (b.hi !== b.lo ? " to " + b.hi : "") + " pilot";
          }).join(", ") + "." }));
      }
      (p.rules || []).forEach(function (r) { kids.push(abilityP({ name: r.name, cost: null, text: r.text })); });
      if (p.text) kids.push(el("p.help", { style: { margin: "6px 0 0" }, text: p.text }));
      host.appendChild(el("div.feature", null, kids));
    });
  }

  /* SEARCH reads what a GM would type to find a threat: its name, identity,
     abilities, gear, salvage and signs. Not the whole entry serialized, which also
     matched its PDF page ("77" found every entry on that page) and its keys. The
     inline italics and bold markers are dropped so a search can span them. */
  function searchText(e) {
    var bits = [e.name, e.identity, e.gear, e.salvage, e.signs];
    (e.abilities || []).forEach(function (a) { bits.push(a.name); bits.push(a.text); });
    return bits.filter(function (b) { return b; }).join(" \n ").replace(/\*/g, "").toLowerCase();
  }

  function bestiaryPanel() {
    var B = EN.bestiary;
    if (!B) return null;
    var kids = [];

    /* Chip counts are COUNTED from the entries, not read off the Index's printed
       `count`, so a chip can never promise a number of cards the list does not
       draw. The two reference views sit after the categories, set apart by a
       dashed border: they hold no statblocks and no search reaches them. */
    function countIn(key) {
      if (typeof B.countOf === "function") return B.countOf(key);
      return B.entries.filter(function (e) { return e.category === key; }).length;
    }
    function chip(key, label, ref) {
      var st = { cursor: "pointer", fontSize: "10.5px" };
      if (ref) st.borderStyle = "dashed";
      return el("span.chip" + (_best.cat === key ? ".on" : ""), {
        style: st, title: ref ? "Reference, not statblocks" : null,
        onclick: function () { _best.cat = key; EN.app.render(); }
      }, label);
    }
    var chips = B.categories.map(function (c) { return chip(c.key, c.name + " (" + countIn(c.key) + ")", false); });
    if (B.speciesTemplates) chips.push(chip("templates", (B.speciesTemplates.title || "Species Templates") +
      " (" + (B.speciesTemplates.templates || []).length + ")", true));
    if (B.vehicles) chips.push(chip("vehicles", (B.vehicles.title || "Hostile Vehicles") +
      " (" + (B.vehicles.profiles || []).length + ")", true));
    kids.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "8px" } }, chips));

    kids.push(el("input", { type: "text", value: _best.q,
      placeholder: "search every entry by name, identity, ability, gear, salvage or signs",
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
      if (q) {
        var rows = B.entries.filter(function (e) { return searchText(e).indexOf(q) !== -1; });
        host.appendChild(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "6px" } }, [
          el("p.help", { style: { margin: 0 },
            text: rows.length ? rows.length + " of " + B.entries.length + " entries match, across every category." : "Nothing matches." }),
          el("button.btn.sm.ghost", { onclick: function () { _best.q = ""; EN.app.render(); } }, "CLEAR SEARCH")
        ]));
        rows.forEach(function (e) { host.appendChild(bestiaryCard(e)); });
        return;
      }
      if (_best.cat === "templates") { templatesInto(host); return; }
      if (_best.cat === "vehicles") { vehiclesInto(host); return; }
      var cat = B.categories.filter(function (c) { return c.key === _best.cat; })[0];
      if (!cat) { _best.cat = (B.categories[0] || {}).key; cat = B.categories[0]; }
      if (!cat) { host.appendChild(el("p.help", { text: "Nothing matches." })); return; }
      categoryInto(host, cat);
    }

    /* One category as the book lays it out: its intro, then the entries printed
       before any run-in, then each subgroup in the order of `subgroups[]` under
       its own heading and intro. An entry naming a subgroup this category does not
       list is drawn with the ungrouped ones rather than dropped. */
    function categoryInto(host, cat) {
      if (cat.intro) host.appendChild(el("p.help", { style: { margin: "0 0 10px", color: "var(--text2)" }, text: cat.intro }));
      if (cat.key === "cryptids" && B.huntProcedure) host.appendChild(huntCard(B.huntProcedure));
      var ents = B.entries.filter(function (e) { return e.category === cat.key; });
      var groups = (B.subgroups || []).filter(function (g) { return g.category === cat.key; });
      var known = Object.create(null);
      groups.forEach(function (g) { known[g.key] = true; });
      var loose = ents.filter(function (e) { return !e.subgroup || !Object.prototype.hasOwnProperty.call(known, e.subgroup); });
      if (!ents.length) { host.appendChild(el("p.help", { text: "Nothing matches." })); return; }
      loose.forEach(function (e) { host.appendChild(bestiaryCard(e)); });
      groups.forEach(function (g) {
        var members = ents.filter(function (e) { return e.subgroup === g.key; });
        if (!members.length) return;
        host.appendChild(EN.ui.sectionTitle(g.name + " (" + members.length + ")"));
        if (g.intro) host.appendChild(el("p.help", { style: { margin: "0 0 8px", color: "var(--text2)" }, text: g.intro }));
        members.forEach(function (e) { host.appendChild(bestiaryCard(e)); });
      });
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
          el("span.help", { text: "G" + b.grade + " " + b.designationName + (b.roleName ? ", " + b.roleName : "") +
            " · DEF " + b.defense + " · " + b.vitality + " Vit · " + b.xp + " XP" })
        ]),
        el("div.row.wrap", { style: { gap: "6px" } }, [
          el("button.btn.sm", { onclick: function () {
            /* rolled at the block's own bonus. A statblock saved before the book's
               formula reached the builder arrived with no initMod; gmstore.js fills
               that one missing field from its saved inputs on load, so it rolls at
               the formula too. The init 0 it prints is left as printed. */
            var r = EN.gmEngine.rollInit(typeof b.initMod === "number" ? b.initMod : (b.init | 0));
            gm.addThreat(b, t.inputs, r.total);
            toast((b.name || "Threat") + " rolls " + r.total + " for initiative.");
            EN.app.render();
          } }, "+ ORDER"),
          el("button.btn.sm", { title: "Add this statblock as a line on an encounter plan", onclick: function () {
            toPlan([threatLine(b)], "");
          } }, "+ ENCOUNTER PLAN"),
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

  /* ---- the undo strip ------------------------------------------------------
     THE ALWAYS-AVAILABLE WAY TO POP THE STACK (F4). Undo of GM writes to player
     records is newest first, and each module offers its own UNDO only while the
     newest write is one of its own. A write whose module had lost track of it (a
     posting after a reload, an award after HIDE or the next fight) used to be
     unreachable, and it blocked the undo of every older payday and award under
     it for good. This strip names the newest write that still stands, whichever
     module made it, and undoes it. Every Admin tab draws it under its heading:
     this file for the Table, Threats and Bestiary, each module file for its own.

     Armed, because it changes a player's record, and keyed on the write's id, so
     a newer write arriving between the two clicks disarms it instead of the
     second click undoing something the GM never saw named. It also says NOT
     SAVED while the last write of the GM data was refused (gmStore.saveOk).
     Returns null when there is nothing to say. */
  function ago(at) {
    var mins = Math.floor(Math.max(0, Date.now() - (Number(at) || 0)) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + (mins === 1 ? " minute ago" : " minutes ago");
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + (hrs === 1 ? " hour ago" : " hours ago");
    var days = Math.floor(hrs / 24);
    return days + (days === 1 ? " day ago" : " days ago");
  }
  function undoStrip() {
    if (!gm || typeof gm.undoable !== "function") return null;
    var u = null;
    try { u = gm.undoable(); } catch (e) { u = null; }
    var unsaved = typeof gm.saveOk === "function" && gm.saveOk() === false;
    if (!u && !unsaved) return null;
    var kids = [];
    if (unsaved) {
      kids.push(el("p.help", { style: { margin: u ? "0 0 6px" : 0, color: "var(--danger)" },
        text: "NOT SAVED. This device refused the last write of the GM data. Export it from Settings, under GM DATA, to keep a copy." }));
    }
    if (u) {
      var label = u.label || "A GM write";
      var who = u.charName || "a Freelancer";
      kids.push(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        el("span.help", { style: { margin: 0 },
          text: "Last write to a Freelancer record: " + label + " (" + who + "), " + ago(u.at) + "." }),
        EN.ui.armButton("gm:undostrip:" + u.id, {
          label: "UNDO", armedLabel: "UNDO IT?",
          title: "Take this write back off " + who + "'s record",
          armedTitle: "Takes " + label + " back off " + who + "'s record. Click again to confirm.",
          onConfirm: function () {
            var now = null;
            try { now = gm.undoable(); } catch (e) { now = null; }
            if (!now || now.id !== u.id) { toast("A newer write arrived. Check the strip again."); EN.app.render(); return; }
            var r = gm.undoLast();
            if (r) toast("Undone: " + (r.label || "a GM write") + " on " + (r.charName || "a Freelancer") + "'s record.");
            else if (r === false) toast("Not undone: this device refused the write, so nothing changed.");
            else toast("Nothing left to undo.");
            EN.app.render();
          }
        })
      ]));
    }
    return el("div.feature", { dataset: { gm: "undostrip" },
      style: { borderLeftColor: unsaved ? "var(--danger)" : "var(--warn)", marginBottom: "12px" } }, kids);
  }

  /* ---- hooks for the module tabs ------------------------------------------
     HANDOFF. One tab sending a payload to another ("run this encounter on the
     Table", "pay this job") stores it here and switches tabs; the receiving
     tab's render takes it ONCE. Once, because every store change re-renders
     the open tab, and a payload read on every render would re-apply itself
     on every keystroke. The receiver copies it into its own transient state
     on first sight. Not persisted: a reload drops an untaken handoff, which is
     the same as the GM never having clicked. Keyed by tab key, null-prototype
     because the key arrives from a caller. */
  var _handoff = Object.create(null);
  function handoff(tabKey, payload) {
    _handoff[tabKey] = payload;
    EN.app.gotoTab(tabKey);
  }
  function takeHandoff(tabKey) {
    if (!Object.prototype.hasOwnProperty.call(_handoff, tabKey)) return null;
    var p = _handoff[tabKey];
    delete _handoff[tabKey];
    return p === undefined ? null : p;
  }

  /* TABLE EXTRAS. A module hangs its own live panel under the initiative order
     (Encounters: the running plan with its waves and Security Response clock,
     and the XP award; Hazards: the Room tray) without this file knowing what it
     draws. Each fn is called on every Table render with {encounter, crew} and
     returns a DOM node or null.

     DRAWN BY `order`, then registration order. The slots in use are the
     running plan (10), the Room (20) and the XP award (30): the fight being
     run, what is live in the room it is run in, and only then the bill for the
     fight that just ended. Script order alone could not give that, because one
     file draws both the first and the last. An extra registered without an
     order goes after the numbered ones, in script order. Registering a key
     again replaces its fn IN PLACE (and its order, when one is given), so a
     module that re-registers keeps its slot. One extra that throws is skipped
     and logged; it must not take the initiative order down with it in the
     middle of a fight. */
  var _extras = [];
  function registerTableExtra(key, fn, order) {
    if (typeof fn !== "function") return;
    var ord = (typeof order === "number" && isFinite(order)) ? order : null;
    for (var i = 0; i < _extras.length; i++) {
      if (_extras[i].key === key) {
        _extras[i].fn = fn;
        if (ord !== null) _extras[i].order = ord;
        return;
      }
    }
    _extras.push({ key: key, fn: fn, order: ord, seq: _extras.length });
  }
  // an unnumbered extra sorts after every numbered slot
  function drawOrder() {
    function rank(x) { return x.order === null ? 1e6 : x.order; }
    return _extras.slice().sort(function (a, b) { return (rank(a) - rank(b)) || (a.seq - b.seq); });
  }
  function tableExtras() {
    if (!_extras.length) return [];
    var enc = gm.get().encounter;
    var crew = null;
    try { crew = EN.gmEngine.crew({ encounter: enc }); } catch (e) { crew = null; }
    var out = [];
    drawOrder().forEach(function (x) {
      var node = null;
      try { node = x.fn({ encounter: enc, crew: crew }); }
      catch (e) { try { console.warn("GM: the Table extra '" + x.key + "' failed to draw.", e); } catch (e2) {} node = null; }
      if (node && node.nodeType) {
        out.push(el("div", { style: { height: "12px" } }));
        out.push(node);
      }
    });
    return out;
  }

  function renderTable(mount) {
    EN.ui.clear(mount);
    // the tracker is the only surface that draws a crew row, so it is the
    // only place a ghost from a character deleted since the last render
    // can appear
    gm.pruneCrew();
    // two rows sharing a name are numbered however they arrived (addThreat
    // numbers on the way in; this catches a row written by any other path)
    if (gm.numberThreats) gm.numberThreats();
    var blocks = [heading("Table", "// initiative and the order"), undoStrip(), trackerPanel()].filter(Boolean);
    mount.appendChild(el("div", null, blocks.concat(tableExtras())));
  }

  function renderThreats(mount) {
    EN.ui.clear(mount);
    var blocks = [heading("Threats", "// build a statblock from Grade, Designation and Role"), undoStrip(), builderPanel()].filter(Boolean);
    var saved = savedPanel();
    if (saved) { blocks.push(el("div", { style: { height: "12px" } })); blocks.push(saved); }
    mount.appendChild(el("div", null, blocks));
  }

  function renderBestiary(mount) {
    EN.ui.clear(mount);
    // another tab sent a name to look up (the Job Board's VIEW): it becomes the
    // search, taken once, and stays editable like any typed search
    var h = takeHandoff("bestiary");
    if (h && typeof h.query === "string") _best.q = h.query;
    var best = bestiaryPanel();
    // bestiaryPanel() returns null when EN.bestiary never loaded. A tab that
    // is entirely absent reads as broken, so say so rather than showing nothing.
    var body = best || el("div.muted-box", { text: "Bestiary data did not load. Check app/data/bestiary.js." });
    mount.appendChild(el("div", null, [heading("Bestiary", "// Gangers, Sentries, and Cryptids. Oh my!"), undoStrip(), body].filter(Boolean)));
  }

  return {
    renderTable: renderTable, renderThreats: renderThreats, renderBestiary: renderBestiary,
    // the module tabs' hooks (see "hooks for the module tabs" above)
    handoff: handoff, takeHandoff: takeHandoff, registerTableExtra: registerTableExtra,
    // the newest standing GM write with its armed UNDO, for the top of every Admin tab
    undoStrip: undoStrip
  };
})();
