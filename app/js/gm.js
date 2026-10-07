/* ===========================================================================
   ELYSIUM NIGHTS · GM toolkit views
   Three tabs on the Admin desktop: Table (the initiative tracker), Threats
   (the builder plus saved statblocks), and Bestiary. Encounters, Hazards, the
   Job Board and Payroll are their own files (js/gm_encounters.js and its
   siblings) and reach this one through three hooks at the bottom: a handoff
   that carries a payload to another tab, and Table extras that hang their own
   panels under the initiative order. Every Admin tab also takes two things from
   here for under and beside its heading: the undo strip and the GM's Card
   drawer.

   A Table row is a working surface, not a readout: damage and heal by an
   amount, rename, max Vitality, its full statblock, conditions and a note, a
   Hostile Vehicle under its pilot, and the Solo helper (see "the Table's row
   tools"). Turn flow passes downed threats and marks who has acted.

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
  // the Species Template laid over a People card, by entry name ("" or absent: as printed).
  // A view choice like the filter above, so it survives a tab switch and not a reload.
  var _species = Object.create(null);
  // which saved threats have their statblock open, by saved id
  var _savedOpen = Object.create(null);

  // local copies rather than imports, per the house convention that each view
  // carries its own small helpers instead of a shared utils file
  function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
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

  /* ---- links into the Codex ---------------------------------------------------
     The rules these tabs work with live in the Admin Codex (the Running Threats
     chapter, js/codex_gm_threats.js, and the player chapters). A rule NAME links
     through EN.ui's guarded helpers: ruleLink is plain text, and ruleChip null,
     when js/codex.js is missing or the anchor does not resolve here, so a tab
     never shows a dead link. cxSlug is the Codex's own slug rule
     (EN.codexView.slug), a local copy per the house convention. Chips sit BESIDE
     the hooked elements (data-gm="surgesleft", "movingdef", a field's label),
     never inside them, so the text those carry is unchanged. */
  function cxSlug(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function ruleChip(anchor, title) {
    try { return EN.ui.ruleChip ? EN.ui.ruleChip(anchor, title ? { title: title } : null) : null; } catch (e) { return null; }
  }
  // a chip with a little air before it, for the end of a line of text
  function tailChip(anchor, title) {
    var c = ruleChip(anchor, title);
    if (c) { c.style.marginLeft = "6px"; c.style.verticalAlign = "middle"; }
    return c;
  }
  // the entry a convention opens on is the slug of its first sentence ("Conditions work normally.")
  function conventionAnchor(text) {
    var m = String(text || "").match(/^([^.]+)\./);
    return m ? "gmt-conventions/" + cxSlug(m[1]) : "gmt-conventions";
  }

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
  /* `anchor`, when given, is the Codex entry for the current choice: a "?" chip
     beside the label (not inside it, so the label still reads the field's name). */
  function pick(field, options, current, onPick, anchor) {
    var s = el("select", {
      onchange: function (e) { onPick(e.target.value); EN.app.render(); },
      style: { minWidth: "130px" }
    }, options.map(function (o) {
      return el("option", { value: o.value, selected: String(o.value) === String(current) }, o.label);
    }));
    var c = anchor ? ruleChip(anchor) : null;
    var head = c ? el("div.row", { style: { gap: "6px", alignItems: "center", justifyContent: "space-between" } }, [lbl(field), c]) : lbl(field);
    return el("div.field", { style: { margin: 0 } }, [head, s]);
  }

  function nameIn(list, key) {
    var x = (list || []).filter(function (d) { return d && d.key === key; })[0];
    return x ? x.name : key;
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
      // each picker's chip opens the Codex entry for what is picked now
      pick("Grade", T.grades.map(function (g) { return { value: g.g, label: "G" + g.g }; }), _b.grade,
        function (v) { _b.grade = Number(v); }, "gmt-grades/grade-" + _b.grade),
      pick("Designation", T.designations.map(function (d) { return { value: d.key, label: d.name }; }), _b.designation,
        function (v) { _b.designation = v; }, "gmt-designations/" + cxSlug(nameIn(T.designations, _b.designation))),
      pick("Role", T.roles.map(function (r) { return { value: r.key, label: r.name }; }), _b.role,
        function (v) { _b.role = v; _b.strong = null; }, "gmt-roles/" + cxSlug(nameIn(T.roles, _b.role))),
      pick("Size", (EN.rules.sizes || ["Medium"]).map(function (s) { return { value: s, label: s }; }), _b.size,
        function (v) { _b.size = v; }, "ref-size"),
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
      if (band.book) kids.push(el("p.help", { style: { margin: "3px 0 0", color: "var(--text2)" } },
        [document.createTextNode(band.book), tailChip("gmt-grades/working-band", "Working Band")]));
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

    if (b.surges) kids.push(el("p.help", { style: { margin: "6px 0 0", color: "var(--gold)" } }, [
      document.createTextNode("Solo: " + b.surges + " Surges a round, one defensive Impulse per Freelancer turn, Unshakable, a Breakpoint below half Vitality, and one findable weakness. The weakness is not optional."),
      tailChip("gmt-solos", "Running Solos")]));
    if (b.noDefensiveImpulse) kids.push(el("p.help", { style: { margin: "6px 0 0" } },
      [document.createTextNode("Minion: no defensive Impulse."), tailChip("gmt-designations/minion", "Minion")]));

    /* The blank threat's other lines (Trait, Impulse, Resolve, Gear), printed
       only when the block carries them. The builder leaves them empty, so its
       card is unchanged; a block that arrives with them filled in shows them. */
    [["Trait", b.trait], ["Impulse", b.impulse], ["Resolve", b.resolve], ["Gear", b.gear]].forEach(function (f) {
      if (f[1] !== null && f[1] !== undefined && String(f[1]).replace(/\s+/g, "")) {
        kids.push(el("p.help", { style: { margin: "4px 0 0" }, text: f[0] + ": " + f[1] }));
      }
    });

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
  // the mark NEXT TURN leaves on the row whose turn just ended; clicking it clears it
  function actedChip(row) {
    if (!row.acted) return null;
    return el("span.chip", { dataset: { gm: "acted" }, title: "Took its turn this round. Click to clear the mark.",
      style: { fontSize: "9.5px", cursor: "pointer" },
      onclick: function () { editRow(row.id, function (r) { r.acted = false; }); EN.app.render(); } }, "✓ ACTED");
  }

  function crewRow(row, isNow) {
    var roster = EN.store.roster() || {};
    var ch = roster[row.charId];
    if (!ch) return null;                       // pruned on render; belt and braces
    var d;
    try { d = eng.derive(ch); } catch (e) { return null; }
    var name = (ch.firstName || "") + " " + (ch.lastName || "");
    return el("div.feature", { dataset: { gmRow: row.id }, style: { borderLeftColor: isNow ? "var(--accent)" : "var(--border2)",
                                        background: isNow ? "var(--sunk, rgba(255,255,255,.03))" : "transparent" } }, [
      el("div.row.between.wrap", { style: { alignItems: "center", gap: "8px" } }, [
        el("div.row", { style: { gap: "10px", alignItems: "baseline", flexWrap: "wrap" } }, [
          el("span.mono", { style: { fontSize: "17px", minWidth: "34px", color: isNow ? "var(--accent)" : "var(--text)" },
            text: String(row.init) }),
          el("span", { style: { fontWeight: 600 }, text: name.trim() || "Freelancer" }),
          el("span.chip", { style: { fontSize: "9.5px" }, text: "CREW" }),
          actedChip(row),
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
          el("button.btn.sm", { onclick: function () { removeRow(row.id); } }, "✕")
        ])
      ])
    ]);
  }

  /* ---- the Table's row tools -----------------------------------------------
     What a GM does to a threat row mid-fight: damage or heal it by an amount,
     rename it, change its max Vitality, open its full statblock, mark its
     conditions and a note, put it behind the wheel of a Hostile Vehicle, and
     (on a Solo) count its Surges and catch its Breakpoint. Everything the GM
     decides is saved ON THE ROW through gmStore.update, so it rides the
     encounter through a reload and into the lastEncounter snapshot.

     The transient half (which rows are opened up, an amount or a name typed
     but not yet applied) lives here and is not persisted, like the builder's
     inputs above. A typed field never re-renders the tab on change: a render
     under a blur swallows the click that caused the blur (F19), so what is
     typed is held here and applied by its own button, or by Enter. Keyed by
     row id, null-prototype, since the ids ride in the GM's own data. */
  var _rows = Object.create(null);
  function rowUi(id) {
    if (!own(_rows, id)) _rows[id] = { amt: "", vamt: "", block: false, edit: false, name: null, max: null };
    return _rows[id];
  }
  /* NEXT and PREVIOUS TURN pass over threats at 0 Vitality: a downed threat has
     no turn left to take. The SKIP THE DOWNED chip turns that off. A view
     choice, like the Bestiary filter, so it survives a tab switch and not a
     reload. Crew rows are never passed over: a Freelancer at 0 is still in the
     fight, making Death Saves. */
  var _turn = { skipDown: true, round: null, set: null };   // `set`: a SET ROUND not yet passed to the Table extras
  function downed(r) { return !!r && r.kind === "threat" && Number(r.vit) <= 0; }
  function turnOpts() { return _turn.skipDown ? { skip: downed } : null; }
  /* A row's X. Removing the row that is acting moves the cursor on as NEXT
     TURN would, and when that runs off the bottom of the order gmStore ends
     the round as NEXT TURN does (the counter, the marks); a round typed and
     never set gives way to the new one, and the GM is told. */
  function removeRow(id) {
    if (gm.removeEntry(id, turnOpts())) {
      _turn.round = null;
      toast("Round " + gm.get().encounter.round + ".");
    }
    EN.app.render();
  }

  function editRow(id, fn, opts) {
    gm.update(function (s) {
      var r = s.encounter.entries.filter(function (x) { return x.id === id; })[0];
      if (r) fn(r, s.encounter);
    }, opts);
  }
  // a typed amount as a whole number of 1 or more, else 0 (a sign typed in is ignored: the button says which way)
  function wholeAmt(v) {
    var n = Math.floor(Math.abs(Number(v)));
    return isFinite(n) && n > 0 ? n : 0;
  }
  function isSolo(b) { return !!b && String(b.designation || "").toLowerCase() === "solo"; }

  /* EVERY VITALITY CHANGE ON A THREAT ROW comes through here: the stepper, the
     amount, DAMAGE and HEAL. Clamped to 0 and the row's max. It is also where a
     Solo's Breakpoint is caught, because "the first time a Solo drops below half
     Vitality" is a property of the change, not of any one button: the first
     drop below half that this row sees leaves `bp` on the row (the round it
     fired in), and it never fires again, healed or not. */
  function setVit(id, fn, what) {
    var fired = null, landed = null;
    editRow(id, function (r, enc) {
      var max = Math.max(1, Number(r.vitMax) || 1);
      var was = Math.max(0, Number(r.vit) || 0);
      var next = Math.round(Number(fn(was, max)));
      if (!isFinite(next)) next = was;
      next = Math.max(0, Math.min(max, next));
      r.vit = next;
      if (isSolo(r.block) && !r.bp && next < was && next < max / 2) {
        r.bp = { round: enc.round | 0, seen: false };
        fired = r.name || "The Solo";
      }
      landed = (r.name || "Threat") + (what || "") + ": " + next + " / " + max + ".";
    });
    if (fired) toast("Breakpoint: " + fired + " just dropped below half Vitality.");
    else if (what && landed) toast(landed);
    EN.app.render();
  }

  /* ---- the Solo helper -------------------------------------------------------
     Running Solos (EN.threats.runningSolos, the book's text) on the row of any
     threat whose Designation is Solo: the Surges it has left this round, the
     Unshakable reminder with its once-a-round Surge spend, its Defensive
     Impulse, and the Breakpoint. */
  function soloRule(key) {
    var R = EN.threats && EN.threats.runningSolos;
    return ((R && R.rules) || []).filter(function (r) { return r && r.key === key; })[0] || null;
  }
  function abilityNamed(b, name) {
    return ((b && b.abilities) || []).filter(function (a) { return a && a.name === name; })[0] || null;
  }
  /* How many Surges a Solo has a round. The block's own number first: a built
     Solo carries `surges`, a Bestiary Solo prints it on its Surges line ("3 per
     round"). Else the book's count by Grade, from the Solo row of
     EN.threats.designations (two at Grade 1 and 2, three at 3 and up). */
  function surgesOf(b) {
    if (typeof b.surges === "number" && b.surges > 0) return b.surges;
    var s = abilityNamed(b, "Surges"), m = s && String(s.cost || "").match(/(\d+)\s+per\s+round/i);
    if (m) return Number(m[1]);
    var g = Math.max(1, Math.min(5, Number(b.grade) || 1));
    var sd = ((EN.threats && EN.threats.designations) || []).filter(function (d) { return d && d.key === "solo"; })[0];
    if (sd && sd.surgesByGrade && typeof sd.surgesByGrade[g] === "number") return sd.surgesByGrade[g];
    return g >= 3 ? 3 : 2;
  }
  /* The Surges a Bestiary Solo lists, split the way the page prints them,
     "*Lunge* (move half Speed); *Spray* (...)". Only a semicolon followed by a
     new italic name starts a new Surge, since one description carries its own
     semicolon ("...; once per round"). A built Solo lists none and counts. */
  function surgeList(b) {
    var s = abilityNamed(b, "Surges");
    if (!s || !s.text) return [];
    var out = [];
    String(s.text).split(/;\s*(?=\*)/).forEach(function (part) {
      var m = part.match(/^\s*\*([^*]+)\*\s*([\s\S]*?)\.?\s*$/);
      if (m) out.push({ name: m[1], text: m[2].replace(/^\(/, "").replace(/\)$/, "") });
    });
    return out;
  }
  /* The Surges spent THIS round. Read lazily: the list on the row names the
     round it was spent in, and a list from any other round is spent no longer.
     So the Surges refill whenever the round changes, however it changed (NEXT
     TURN, PREVIOUS TURN, SET ROUND, a reroll), with nothing to reset. The
     Unshakable spend is in the same list, under "Unshakable". */
  function surgesSpent(row, enc) {
    var s = row.surge;
    return (s && s.round === (enc.round | 0) && Array.isArray(s.used)) ? s.used : [];
  }
  function spendSurge(id, label, give) {
    editRow(id, function (r, enc) {
      var used = surgesSpent(r, enc).slice();
      if (give) { var i = used.lastIndexOf(label); if (i !== -1) used.splice(i, 1); }
      else used.push(label);
      r.surge = { round: enc.round | 0, used: used };
    });
    EN.app.render();
  }
  // one Defensive Impulse per Freelancer turn, so it is spent for the turn the cursor is on
  function turnKey(enc) { return (enc.round | 0) + ":" + (enc.activeId || ""); }
  /* The Impulse a Bestiary Solo's entry lists, read out of its "Unshakable,
     Defensive Impulses" line: "as a Solo (listed Impulse: Submerge: gain Half
     Cover ...)" or "(its listed Impulse is Brace: ...)". A built block's own
     `impulse` otherwise; "" when neither says. */
  function listedImpulse(b) {
    var st = (b && b.stats) || {};
    var m = String(st["Unshakable, Defensive Impulses"] || "").match(/listed Impulse(?: is|:)\s*([\s\S]+?)\)\.?\s*$/);
    if (m) return m[1];
    return (b && b.impulse) ? String(b.impulse) : "";
  }
  // the block's own Breakpoint when it prints one, else the book's rule
  function breakpointText(b) {
    var a = abilityNamed(b, "Breakpoint");
    if (a && a.text) return String(a.text);
    var r = soloRule("breakpoint");
    return r ? r.text : "";
  }
  function ruleP(rule, extra, color) {
    var p = el("p.help", { style: { margin: "5px 0 0", color: color || "var(--text2)" } }, [
      el("span", { style: { fontWeight: 600, color: "var(--text)" }, text: rule.name + ". " })
    ]);
    EN.ui.applyInline(p, String(rule.text || ""));
    if (extra) p.appendChild(extra);
    // the rule in full in Running Solos, at the end of the line so its text reads as before
    var c = tailChip("gmt-solos/" + cxSlug(rule.name), rule.name);
    if (c) p.appendChild(c);
    return p;
  }
  function soloPanel(row, enc) {
    var b = row.block || {};
    var total = surgesOf(b), used = surgesSpent(row, enc), left = Math.max(0, total - used.length);
    var list = surgeList(b);
    var kids = [];

    // the Surges rule rides on the counter's title: the counter and the chips already say what it means
    var sr = soloRule("surges");
    var top = [
      el("span.mono", { style: { fontSize: "11px", letterSpacing: ".12em", color: "var(--gold)" }, text: "SOLO" }),
      el("span.mono", { dataset: { gm: "surgesleft" }, title: sr ? sr.name + ". " + sr.text : "", style: { fontSize: "12px", cursor: "help" },
        text: "SURGES LEFT THIS ROUND " + left + " / " + total }),
      // beside the counter, not in it: the counter's text is what it counts
      ruleChip("gmt-solos/surges", sr ? sr.name : "Surges")
    ];
    if (list.length) {
      // each listed Surge once a round: a chip per Surge, struck through once spent
      list.forEach(function (s) {
        var spent = used.indexOf(s.name) !== -1;
        top.push(el("span.chip", { dataset: { gm: "surge", surge: s.name },
          title: s.text + (spent ? ". Spent this round: click to take it back." : left ? ". Click to spend it." : ". No Surges left this round."),
          style: { cursor: "pointer", fontSize: "10px", textDecoration: spent ? "line-through" : "none", opacity: (spent || left) ? 1 : 0.45 },
          onclick: function () {
            if (spent) spendSurge(row.id, s.name, true);
            else if (left) spendSurge(row.id, s.name, false);
            else toast("No Surges left this round.");
          } }, s.name.toUpperCase()));
      });
    } else {
      top.push(el("button.btn.sm", { dataset: { gm: "surgespend" }, disabled: !left,
        onclick: function () { spendSurge(row.id, "Surge", false); } }, "SPEND A SURGE"));
      if (used.indexOf("Surge") !== -1) {
        top.push(el("button.btn.sm.ghost", { dataset: { gm: "surgegive" },
          onclick: function () { spendSurge(row.id, "Surge", true); } }, "GIVE ONE BACK"));
      }
    }
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, top));

    // Unshakable: a failed save can be turned with one of the remaining Surges, once a round
    var un = soloRule("unshakable");
    if (un) {
      var turned = used.indexOf("Unshakable") !== -1;
      var act = turned
        ? el("span.chip.on", { dataset: { gm: "unshaken" }, title: "Click to take the Surge back.",
            style: { cursor: "pointer", fontSize: "9.5px", marginLeft: "6px" },
            onclick: function () { spendSurge(row.id, "Unshakable", true); } }, "SAVE TURNED THIS ROUND")
        : el("button.btn.sm", { dataset: { gm: "unshake" }, disabled: !left, style: { marginLeft: "6px" },
            title: left ? "Spend one of the Surges left this round to succeed on the save it just failed" : "No Surges left this round",
            onclick: function () { spendSurge(row.id, "Unshakable", false); toast((row.name || "The Solo") + " spends a Surge and succeeds on the save."); } },
            "FAILED A SAVE: SPEND A SURGE");
      kids.push(ruleP(un, act));
    }

    // its Defensive Impulse, one per Freelancer turn
    var im = soloRule("impulses");
    if (im) {
      var listed = listedImpulse(b);
      var spentNow = row.impulse === turnKey(enc);
      var extra = el("span", null, [
        listed ? el("span", { style: { color: "var(--accent)" }, text: " Its listed Impulse: " + listed + "." }) : null,
        el("span.chip" + (spentNow ? ".on" : ""), { dataset: { gm: "impulse" },
          title: spentNow ? "Spent on this turn. Click to take it back." : "Mark it spent for this turn. It comes back on the next turn.",
          style: { cursor: "pointer", fontSize: "9.5px", marginLeft: "6px" },
          onclick: function () {
            editRow(row.id, function (r, e) { r.impulse = (r.impulse === turnKey(e)) ? null : turnKey(e); });
            EN.app.render();
          } }, spentNow ? "IMPULSE SPENT THIS TURN" : "SPEND THE IMPULSE")
      ]);
      kids.push(ruleP(im, extra));
    }

    // the Breakpoint: an alert the turn it fires, then a line saying when it did
    var bpText = breakpointText(b);
    var max = Math.max(1, Number(row.vitMax) || 1);
    if (row.bp && !row.bp.seen) {
      var alertP = el("p", { style: { margin: "4px 0 0", fontSize: "13px" } });
      EN.ui.applyInline(alertP, bpText);
      kids.push(el("div", { dataset: { gm: "breakpoint" }, style: { margin: "8px 0 0", padding: "8px 10px",
          border: "1px solid var(--gold)", borderLeft: "3px solid var(--gold)", background: "rgba(255,200,80,.06)" } }, [
        el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
          el("span.mono", { style: { fontSize: "12px", letterSpacing: ".1em", color: "var(--gold)" },
            text: "BREAKPOINT" + (row.bp.round ? " · ROUND " + row.bp.round : "") }),
          el("button.btn.sm", { dataset: { gm: "bpseen" },
            onclick: function () { editRow(row.id, function (r) { if (r.bp) r.bp.seen = true; }); EN.app.render(); } }, "GOT IT")
        ]),
        alertP
      ]));
    } else {
      var bpLine = el("p.help", { dataset: { gm: "bpline" }, style: { margin: "5px 0 0", color: "var(--text2)" } }, [
        el("span", { style: { fontWeight: 600, color: "var(--text)" },
          text: row.bp ? "Breakpoint fired" + (row.bp.round ? " in round " + row.bp.round : "") + ". "
                       : "Breakpoint, below " + (Math.round(max / 2 * 10) / 10) + " Vitality. " })
      ]);
      EN.ui.applyInline(bpLine, bpText);
      var bc = tailChip("gmt-solos/breakpoint", "Breakpoint");
      if (bc) bpLine.appendChild(bc);
      kids.push(bpLine);
    }
    return el("div", { dataset: { gm: "solo" }, style: { marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--border2)" } }, kids);
  }

  /* ---- vehicles on the Table -------------------------------------------------
     ATTACH VEHICLE puts a threat row behind the wheel of one of the Bestiary's
     Hostile Vehicles. The row then shows the vehicle's Defense while moving
     (10 + Handling + 2, 4 or 6 by the PILOT's Grade, read out of the book's
     Threat pilots rule by movingDefenseRule below), the pilot's check (its Attack
     bonus + Handling), and the vehicle's Integrity with its own damage controls.
     The vehicle is COPIED onto the row, so a later data change cannot move a
     number mid-chase, the same rule a threat's block follows.

     THE PRINTED PAIRINGS are offered first to the pilots they name. Each is a
     sentence in the vehicle's own description, and it is read from there, never
     restated: `cue` is a fragment of that sentence and the picker shows the
     whole sentence that holds it. A pairing whose sentence the data no longer
     carries is simply not suggested. The pilot test is the statblock's own
     name, so a renamed or numbered row still finds its vehicle. */
  var PAIRINGS = [
    // GMH p98: "Ashriders ride them in packs." (War Bike; the Outrider's gear names it too)
    { vehicle: "Ashrider War Bike", pilot: /^Ashrider\b/, cue: "Ashriders ride them" },
    // GMH p98: "Homeward runs them in pairs, ..." (Interceptor)
    { vehicle: "Homeward Interceptor", pilot: /^Homeward\b/, cue: "Homeward runs them" },
    // GMH p98: "Kindred's, mostly, ..." (Recovery Van)
    { vehicle: "Recovery Van", pilot: /^Kindred\b/, cue: "Kindred's, mostly" },
    // GMH p99: "The Ferrymen's workhorse." (Ferry Skiff)
    { vehicle: "Ferry Skiff", pilot: /^Ferryman\b/, cue: "The Ferrymen's workhorse" }
  ];
  function vehicleProfiles() { return (EN.bestiary && EN.bestiary.vehicles && EN.bestiary.vehicles.profiles) || []; }
  function vehicleByName(n) { return vehicleProfiles().filter(function (p) { return p && p.name === n; })[0] || null; }
  function sentenceWith(p, cue) {
    var body = [String(p.text || "")].concat((p.rules || []).map(function (r) { return r.name + ": " + r.text; })).join(" ");
    var sents = body.match(/[^.!?]+[.!?]+/g) || [body];
    for (var i = 0; i < sents.length; i++) { if (sents[i].indexOf(cue) !== -1) return sents[i].replace(/^\s+|\s+$/g, ""); }
    return "";
  }
  function pairingsFor(b) {
    var nm = String((b && b.name) || ""), out = [];
    PAIRINGS.forEach(function (pr) {
      if (!pr.pilot.test(nm)) return;
      var p = vehicleByName(pr.vehicle);
      var why = p ? sentenceWith(p, pr.cue) : "";
      if (why) out.push({ profile: p, why: why });
    });
    return out;
  }
  // the moving Defense for a pilot of this Grade, or null when the rule or the Handling is missing
  function movingDefense(handling, grade) {
    var md = movingDefenseRule();
    if (!md || typeof handling !== "number") return null;
    var g = Math.max(1, Math.min(5, Number(grade) || 1));
    var band = md.bands.filter(function (x) { return g >= x.lo && g <= x.hi; })[0];
    if (!band) return null;
    return { value: md.base + handling + band.bonus, base: md.base, bonus: band.bonus, lo: band.lo, hi: band.hi };
  }
  function attachVehicle(row, name) {
    var p = vehicleByName(name);
    if (!p) return;
    editRow(row.id, function (r) {
      r.vehicle = { name: p.name, tier: p.tier, category: p.category, speed: p.speed, handling: p.handling,
                    structure: p.structure, integrity: p.integrity, int: p.integrity, nodeTier: p.nodeTier,
                    traits: (p.traits || []).slice() };
    });
    toast((row.name || "Threat") + " is at the wheel of the " + p.name + ".");
    EN.app.render();
  }
  function setInt(id, fn, what) {
    var landed = null;
    editRow(id, function (r) {
      var v = r.vehicle;
      if (!v) return;
      var max = Math.max(0, Number(v.integrity) || 0);
      var next = Math.round(Number(fn(Math.max(0, Number(v.int) || 0), max)));
      if (!isFinite(next)) return;
      v.int = Math.max(0, Math.min(max, next));
      landed = v.name + what + ": " + v.int + " / " + max + " Integrity.";
    });
    if (what && landed) toast(landed);
    EN.app.render();
  }
  // the vehicle rules' own line for a vehicle at 0 Integrity (EN.vehicles.repair), when the data carries it
  function wreckedLine() {
    return ((EN.vehicles && EN.vehicles.repair) || []).filter(function (t) { return /^Wrecked\b/.test(String(t)); })[0] || "";
  }
  function vehiclePicker(row) {
    var b = row.block || {};
    var pairs = pairingsFor(b), first = Object.create(null);
    pairs.forEach(function (x) { first[x.profile.name] = true; });
    var opts = [el("option", { value: "" }, row.vehicle ? "Swap for..." : "Pick a vehicle...")];
    if (pairs.length) {
      opts.push(el("optgroup", { label: "The book pairs these with this pilot" }, pairs.map(function (x) {
        return el("option", { value: x.profile.name, title: x.why }, x.profile.name);
      })));
    }
    var rest = vehicleProfiles().filter(function (p) { return p && !own(first, p.name); });
    opts.push(el("optgroup", { label: pairs.length ? "Every Hostile Vehicle" : "Hostile Vehicles" }, rest.map(function (p) {
      return el("option", { value: p.name }, p.name);
    })));
    var kids = [
      lbl("Attach vehicle"),
      el("select", { dataset: { gm: "vehpick" }, style: { maxWidth: "220px" },
        onchange: function (e) { if (e.target.value) attachVehicle(row, e.target.value); } }, opts)
    ];
    pairs.forEach(function (x) {
      kids.push(el("p.help", { style: { margin: "4px 0 0", color: "var(--accent)" }, text: x.profile.name + ": " + x.why }));
    });
    return el("div.field", { style: { margin: 0, minWidth: "170px", flex: "1 1 200px" } }, kids);
  }
  function vehiclePanel(row) {
    var v = row.vehicle, b = row.block || {}, ui = rowUi(row.id);
    var max = Math.max(0, Number(v.integrity) || 0), cur = Math.max(0, Number(v.int) || 0);
    var kids = [];
    var prof = [];
    if (v.speed) prof.push("Speed " + v.speed);
    if (typeof v.handling === "number") prof.push("Handling " + eng.fmtMod(v.handling));
    if (v.structure !== undefined && v.structure !== null) prof.push("Structure " + v.structure);
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
      el("span.chip", { dataset: { gm: "vehicle" }, style: { fontSize: "9.5px", color: "var(--accent)", borderColor: "var(--accent)" },
        text: String(v.name || "Vehicle").toUpperCase() }),
      el("span.help", { text: prof.join(" · ") })
    ]));
    var md = movingDefense(v.handling, b.grade);
    // the Threat pilots rule the two lines below compute from, in the Codex (beside the
    // profile, so the movingdef and pilotcheck lines read as before)
    var pc = tailChip("gmt-bestiary/threat-pilots", "Threat pilots");
    if (pc) kids[0].appendChild(pc);
    if (md) {
      kids.push(el("p.help", { dataset: { gm: "movingdef" }, style: { margin: "5px 0 0", color: "var(--accent)" },
        text: "Defense while moving " + md.value + ": " + md.base + " + Handling " + eng.fmtMod(v.handling) + " + " + md.bonus +
              " for a Grade " + (Number(b.grade) || 1) + " pilot." }));
    }
    if (typeof b.attackBonus === "number" && typeof v.handling === "number") {
      kids.push(el("p.help", { dataset: { gm: "pilotcheck" }, style: { margin: "3px 0 0" },
        text: "Pilots at " + eng.fmtMod(b.attackBonus + v.handling) + " (Attack " + eng.fmtMod(b.attackBonus) +
              " + Handling " + eng.fmtMod(v.handling) + ") on every piloting check, the Chase Check and the Control Check included." }));
    }
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, [
      el("span.mono", { dataset: { gm: "integrity" }, style: { fontSize: "12px" }, text: "INTEGRITY " + cur + " / " + max }),
      stepper(function () { setInt(row.id, function (n) { return n - 1; }); }, function () { setInt(row.id, function (n) { return n + 1; }); }),
      el("input", { type: "number", min: "0", value: ui.vamt, placeholder: "amount", title: "An amount of Integrity",
        dataset: { gm: "vamt" }, style: { width: "72px" },
        oninput: function (e) { ui.vamt = e.target.value; },
        onkeydown: function (e) { if (e.key === "Enter") vDamage(-1); } }),
      el("button.btn.sm", { dataset: { gm: "vdmg" }, onclick: function () { vDamage(-1); } }, "DAMAGE"),
      el("button.btn.sm", { dataset: { gm: "vrepair" }, onclick: function () { vDamage(1); } }, "REPAIR"),
      el("button.btn.sm.ghost", { dataset: { gm: "vdetach" }, title: "Take the vehicle off this row",
        onclick: function () {
          editRow(row.id, function (r) { delete r.vehicle; });
          toast((row.name || "Threat") + " is out of the " + (v.name || "vehicle") + ".");
          EN.app.render();
        } }, "DETACH")
    ]));
    function vDamage(sign) {
      var n = wholeAmt(ui.vamt);
      if (!n) { toast("Type an amount first."); return; }
      setInt(row.id, function (x) { return x + sign * n; }, sign < 0 ? " takes " + n : " gets " + n + " back");
    }
    kids.push(el("div", { style: { marginTop: "6px" } }, [bar(cur, max || 1, "var(--accent)")]));
    if (cur <= 0 && max > 0) {
      var w = wreckedLine();
      kids.push(el("p.help", { dataset: { gm: "wrecked" }, style: { margin: "5px 0 0", color: "var(--danger)" }, text: w || "0 Integrity." }));
    }
    return el("div", { dataset: { gm: "vehiclepanel" }, style: { marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--border2)" } }, kids);
  }

  /* ---- conditions and notes ----------------------------------------------------
     Chips from EN.conditions, the player side's own list, as REMINDERS: a threat
     does not run combat.js's condition effects (the Threat Conventions: "When a
     condition's save comes due, use the threat's listed save bonus"). Saved on the
     row as a list of condition names, with a one-line note beside them. */
  function condList() { return Array.isArray(EN.conditions) ? EN.conditions : []; }
  function condInfo(name) { return condList().filter(function (c) { return c && c.name === name; })[0] || null; }
  function rowConds(r) {
    return (Array.isArray(r.conditions) ? r.conditions : []).map(function (c) {
      return (c && typeof c === "object") ? c.name : c;
    }).filter(function (c) { return typeof c === "string" && c; });
  }
  function setConds(id, fn) {
    editRow(id, function (r) { r.conditions = fn(rowConds(r)); });
    EN.app.render();
  }
  function conditionsLine(row) {
    var have = rowConds(row);
    var chips = have.map(function (name) {
      var c = condInfo(name);
      /* the name peeks its Conditions Library entry. The link's own title ("Rules: ...")
         would cover the chip's, so the link carries the summary too; the chip keeps it
         for the plain-text fallback. */
      var nm = EN.ui.ruleLink ? EN.ui.ruleLink("ref-conds/" + cxSlug(name), name.toUpperCase()) : document.createTextNode(name.toUpperCase());
      if (nm && nm.nodeType === 1) {
        nm.style.color = "inherit"; nm.setAttribute("data-gm", "condlink");
        if (c && c.summary) nm.setAttribute("title", c.summary + "\n(tap for the rule)");
      }
      return el("span.chip", { dataset: { gm: "cond", cond: name }, title: c ? c.summary : name,
        style: { fontSize: "10px", color: "var(--warn)", borderColor: "var(--warn)" } }, [
        nm,
        el("button", { title: "Remove " + name, dataset: { gm: "conddrop" },
          style: { background: "none", border: "0", color: "inherit", cursor: "pointer", padding: "0 0 0 2px", font: "inherit" },
          onclick: function () { setConds(row.id, function (l) { return l.filter(function (x) { return x !== name; }); }); } }, "✕")
      ]);
    });
    /* The Threat Conventions' conditions rule ("When a condition's save comes due,
       use the threat's listed save bonus") used to ride on the picker as a tooltip,
       which no touch screen shows. It is a chip beside the picker now, opening the
       convention in the Codex, whose text links the conditions it names. The
       tooltip stays only when there is no chip to carry it. */
    var conv = ((EN.threats && EN.threats.conventions) || [])[1] || "";
    var convChip = conv ? ruleChip(conventionAnchor(conv), "Threat Conventions: " + (conv.match(/^[^.]+/) || [""])[0]) : null;
    if (convChip) convChip.setAttribute("data-gm", "condrule");
    var picker = el("select", { dataset: { gm: "addcond" }, title: convChip ? "" : conv, style: { maxWidth: "160px" },
      onchange: function (e) {
        var v = e.target.value;
        if (v) setConds(row.id, function (l) { if (l.indexOf(v) === -1) l.push(v); return l; });
      } }, [el("option", { value: "" }, "+ CONDITION")].concat(condList().filter(function (c) {
        return c && have.indexOf(c.name) === -1;
      }).map(function (c) { return el("option", { value: c.name, title: c.summary || "" }, c.name); })));
    var notes = el("input", { type: "text", value: typeof row.notes === "string" ? row.notes : "", placeholder: "notes",
      dataset: { gm: "rownotes" }, style: { flex: "1 1 150px", minWidth: "0" },
      // saved as it is typed and never re-rendered, so a click after typing lands (F19)
      oninput: function (e) { var t = e.target.value; editRow(row.id, function (r) { r.notes = t; }, { silent: true }); } });
    return el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, chips.concat([picker, convChip, notes]));
  }

  /* ---- rename, max Vitality and the vehicle picker -------------------------- */
  function renameRow(row) {
    var ui = rowUi(row.id);
    var want = String(ui.name === null ? row.name : ui.name).replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    if (!want) { toast("A row needs a name."); return; }
    /* Two rows never share a name (gmstore's rule), so the typed name goes
       through the same numbering every other path does, measured against
       every row but this one. */
    var blockName = row.block && typeof row.block.name === "string" ? row.block.name : "";
    var name = gm.freeName(gm.get().encounter.entries, want, row.id, blockName);
    editRow(row.id, function (r) { r.name = name; });
    ui.name = null;
    toast(name === want ? "Renamed to " + name + "." : want + " is taken on the Table, so this row is " + name + ".");
    EN.app.render();
  }
  /* A new max Vitality. An undamaged row comes up to the new max with it (a
     re-statted threat starts fresh); a damaged one keeps its Vitality, cut to
     the new max if that is lower. */
  function setMaxVit(row) {
    var ui = rowUi(row.id);
    var n = Math.floor(Number(ui.max === null ? row.vitMax : ui.max));
    if (!isFinite(n) || n < 1) { toast("Max Vitality is a whole number of 1 or more."); return; }
    editRow(row.id, function (r) {
      var was = Math.max(1, Number(r.vitMax) || 1);
      var full = (Number(r.vit) || 0) >= was;
      r.vitMax = n;
      r.vit = full ? n : Math.min(Math.max(0, Number(r.vit) || 0), n);
    });
    ui.max = null;
    toast((row.name || "Threat") + ": max Vitality " + n + ".");
    EN.app.render();
  }
  function editPanel(row) {
    var ui = rowUi(row.id);
    return el("div.row.wrap", { dataset: { gm: "editpanel" },
        style: { gap: "10px", alignItems: "flex-end", marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--border2)" } }, [
      el("div.field", { style: { margin: 0, flex: "1 1 170px", minWidth: "0" } }, [
        lbl("Name"),
        el("div.row", { style: { gap: "6px" } }, [
          el("input", { type: "text", value: ui.name === null ? (row.name || "") : ui.name, dataset: { gm: "renamein" },
            style: { flex: "1 1 auto", minWidth: "0" },
            oninput: function (e) { ui.name = e.target.value; },
            onkeydown: function (e) { if (e.key === "Enter") renameRow(row); } }),
          el("button.btn.sm", { dataset: { gm: "rename" }, onclick: function () { renameRow(row); } }, "RENAME")
        ])
      ]),
      el("div.field", { style: { margin: 0 } }, [
        lbl("Max Vitality"),
        el("div.row", { style: { gap: "6px" } }, [
          el("input", { type: "number", min: "1", value: ui.max === null ? row.vitMax : ui.max, dataset: { gm: "maxin" },
            style: { width: "72px" },
            oninput: function (e) { ui.max = e.target.value; },
            onkeydown: function (e) { if (e.key === "Enter") setMaxVit(row); } }),
          el("button.btn.sm", { dataset: { gm: "setmax" }, onclick: function () { setMaxVit(row); } }, "SET MAX")
        ])
      ]),
      vehiclePicker(row)
    ]);
  }

  /* ---- the full statblock, opened on a row or a saved threat ----------------
     The SAME renderers the Threats and Bestiary tabs use: a Bestiary block
     (fromBestiary, carrying the entry's stats and abilities) draws as its
     Bestiary card, with the entry's identity and gear filled in from the
     Bestiary by name and its own stats and abilities (a Species Template
     included) winning; a built block draws as the builder's statblock. A row
     whose block is neither (a hand-made row from another path) shows what it
     has rather than failing. */
  function fullBlock(b) {
    b = b || {};
    try {
      if (b.fromBestiary || b.stats) return el("div.feature", { dataset: { gm: "fullblock" } }, entryBody(entryOf(b), { table: true }));
      if (b.dr && b.saves && Array.isArray(b.attacks) && b.why) {
        var sb = statblock(b);
        sb.setAttribute("data-gm", "fullblock");
        return sb;
      }
    } catch (e) { try { console.warn("GM: a statblock failed to draw.", e); } catch (e2) {} }
    var bits = [];
    if (typeof b.vitality === "number") bits.push("VIT " + b.vitality);
    var sum = rowSummary(b);
    return el("div.feature", { dataset: { gm: "fullblock" } }, [
      el("h4", { style: { margin: "0 0 4px" }, text: b.name || "Threat" }),
      el("p.help", { style: { margin: 0 }, text: [sum].concat(bits).filter(Boolean).join(" · ") || "This row carries no statblock beyond its numbers." })
    ]);
  }

  function threatRow(row, isNow, enc) {
    var b = row.block || {};
    var ui = rowUi(row.id);
    var max = Math.max(1, Number(row.vitMax) || 1);
    var pctColor = row.vit / max <= 0.5 ? "var(--danger)" : "var(--ember, var(--danger))";
    function hit(n) { setVit(row.id, function (v) { return v + n; }); }
    function byAmount(sign) {
      var n = wholeAmt(ui.amt);
      if (!n) { toast("Type an amount first."); return; }
      setVit(row.id, function (v) { return v + sign * n; }, sign < 0 ? " takes " + n : " heals " + n);
    }
    var down = row.vit <= 0;
    var tag = "G" + b.grade + " " + (b.designationName || "").toUpperCase() + (b.species ? " · " + String(b.species).toUpperCase() : "");
    var kids = [
      el("div.row.between.wrap", { style: { alignItems: "center", gap: "8px" } }, [
        el("div.row", { style: { gap: "10px", alignItems: "baseline", flexWrap: "wrap" } }, [
          el("span.mono", { style: { fontSize: "17px", minWidth: "34px", color: isNow ? "var(--accent)" : "var(--text)" },
            text: String(row.init) }),
          el("span", { dataset: { gm: "rowname" }, style: { fontWeight: 600, textDecoration: down ? "line-through" : "none" }, text: row.name || "Threat" }),
          el("span.chip", { style: { fontSize: "9.5px", color: "var(--danger)", borderColor: "var(--danger)" }, text: tag }),
          actedChip(row),
          el("span.help", { text: rowSummary(b) })
        ]),
        el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
          el("span.mono", { dataset: { gm: "vit" }, style: { fontSize: "12px" }, text: row.vit + " / " + row.vitMax }),
          stepper(function () { hit(-1); }, function () { hit(1); }),
          el("input", { type: "number", value: row.init, style: { width: "58px" }, title: "Initiative",
            oninput: function (e) {
              var v = Number(e.target.value) || 0;
              gm.update(function (s) { var r = s.encounter.entries.filter(function (x) { return x.id === row.id; })[0]; if (r) r.init = v; }, { silent: true });
            },
            onchange: function () { EN.app.render(); } }),
          el("button.btn.sm", { onclick: function () { removeRow(row.id); } }, "✕")
        ])
      ]),
      el("div", { style: { marginTop: "6px" } }, [bar(row.vit, max, pctColor)]),
      down ? el("p.help", { style: { margin: "5px 0 0" },
        text: "Out of the fight." + (_turn.skipDown ? " NEXT TURN passes it by." : "") }) : null,
      // damage or heal by an amount, and the two panels that open under the row
      el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "8px" } }, [
        el("input", { type: "number", min: "0", value: ui.amt, placeholder: "amount", title: "An amount of Vitality",
          dataset: { gm: "amt" }, style: { width: "76px" },
          oninput: function (e) { ui.amt = e.target.value; },
          onkeydown: function (e) { if (e.key === "Enter") byAmount(-1); } }),
        el("button.btn.sm", { dataset: { gm: "dmg" }, onclick: function () { byAmount(-1); } }, "DAMAGE"),
        el("button.btn.sm", { dataset: { gm: "heal" }, onclick: function () { byAmount(1); } }, "HEAL"),
        el("button.btn.sm.ghost", { dataset: { gm: "expand" }, title: "The full statblock",
          onclick: function () { ui.block = !ui.block; EN.app.render(); } }, (ui.block ? "▾" : "▸") + " STATBLOCK"),
        el("button.btn.sm.ghost", { dataset: { gm: "edit" }, title: "Rename, max Vitality, and the vehicle",
          onclick: function () { ui.edit = !ui.edit; EN.app.render(); } }, (ui.edit ? "▾" : "▸") + " EDIT")
      ]),
      conditionsLine(row),
      ui.edit ? editPanel(row) : null,
      row.vehicle ? vehiclePanel(row) : null,
      isSolo(b) ? soloPanel(row, enc) : null,
      ui.block ? el("div", { style: { marginTop: "8px" } }, [fullBlock(b)]) : null
    ];
    return el("div.feature", { dataset: { gmRow: row.id },
      style: { borderLeftColor: isNow ? "var(--accent)" : down ? "var(--text4)" : "var(--danger)", opacity: down ? 0.55 : 1 } }, kids);
  }

  /* ---- turn flow -------------------------------------------------------------
     NEXT TURN marks the row whose turn just ended as acted and moves the cursor
     on, past threats at 0 Vitality while SKIP THE DOWNED is on. A new round
     clears every mark. PREVIOUS TURN is its inverse: the row it lands on is
     about to act again, so its mark goes, and stepping back over the top of
     the order (into the round before) leaves every other row marked, since
     they had all acted by then. It stops at the first turn of round 1. SET
     ROUND corrects the counter alone: the cursor and the marks stay put. */
  function nextTurn() {
    var passed = 0;
    gm.update(function (st) {
      var e = st.encounter;
      var cur = e.entries.filter(function (r) { return r.id === e.activeId; })[0];
      var n = EN.gmEngine.advance(e, turnOpts());
      if (cur) cur.acted = true;
      e.activeId = n.activeId;
      e.round = n.round;
      // end of round: the marks clear and the defensive Impulse comes back. A
      // Solo's Surges refill on their own (surgesSpent reads them by round).
      if (n.wrapped) e.entries.forEach(function (r) { r.acted = false; });
      passed = n.skipped || 0;
    });
    _turn.round = null;   // a round typed and never set gives way to the live one
    if (passed) toast("Passed over " + passed + (passed === 1 ? " threat" : " threats") + " at 0 Vitality.");
    EN.app.render();
  }
  function previousTurn() {
    var enc = gm.get().encounter;
    var p = EN.gmEngine.retreat(enc, turnOpts());
    if (p.atStart) { toast("This is the first turn of round 1. Nothing comes before it."); return; }
    gm.update(function (st) {
      var e = st.encounter;
      if (p.wrapped) e.entries.forEach(function (r) { r.acted = r.id !== p.activeId; });
      else e.entries.forEach(function (r) { if (r.id === p.activeId) r.acted = false; });
      e.activeId = p.activeId;
      e.round = p.round;
    });
    _turn.round = null;
    EN.app.render();
  }
  function setRound() {
    var cur = gm.get().encounter.round;
    var n = Math.floor(Number(_turn.round === null ? cur : _turn.round));
    if (!isFinite(n) || n < 1) { toast("A round is a whole number of 1 or more."); return; }
    /* The Table extras hear that the GM SET this round (ctx.roundSet), once,
       on the next draw: a clock following the round gives back what it
       counted past a round set lower (a typo corrected), where a round
       stepped back by PREVIOUS TURN is only not counted twice. Set before the
       write, since the write's own redraw can be the one that reads it. */
    _turn.set = { from: cur | 0, to: n };
    gm.update(function (st) { st.encounter.round = n; });
    _turn.round = null;
    toast("Round " + n + ".");
    EN.app.render();
  }

  function trackerPanel() {
    var s = gm.get();
    var enc = s.encounter;
    var ordered = EN.gmEngine.order(enc.entries);
    var ties = EN.gmEngine.tied(enc.entries);
    var kids = [];

    var head = [
      el("span.mono", { dataset: { gm: "round" }, style: { fontSize: "13px", letterSpacing: ".08em" },
        text: enc.round > 0 ? "ROUND " + enc.round : "NOT STARTED" })
    ];
    if (enc.entries.length) {
      if (enc.round === 0) {
        head.push(el("button.btn.sm.primary", { onclick: function () {
          gm.update(function (st) {
            st.encounter.round = 1;
            // the first entry that can act, so a fight that opens with a downed row skips it too
            st.encounter.activeId = EN.gmEngine.advance({ entries: st.encounter.entries, activeId: null, round: 0 }, turnOpts()).activeId;
          });
          EN.app.render();
        } }, "▶ START ROUND 1"));
      } else {
        head.push(el("button.btn.sm", { dataset: { gm: "prevturn" }, onclick: previousTurn }, "‹ PREVIOUS TURN"));
        head.push(el("button.btn.sm.primary", { dataset: { gm: "nextturn" }, onclick: nextTurn }, "NEXT TURN ›"));
        head.push(EN.ui.armButton("gm:endenc", {
          label: "END", armedLabel: "END IT?", title: "Clear the encounter",
          armedTitle: "Clears every entry and resets the round counter. This cannot be undone.",
          onConfirm: function () { gm.clearEncounter(); EN.app.render(); }
        }));
      }
    }

    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: enc.round > 0 ? "6px" : "10px" } }, head));
    if (enc.entries.length && enc.round > 0) {
      kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "10px" } }, [
        el("span.chip" + (_turn.skipDown ? ".on" : ""), { dataset: { gm: "skipdown" },
          title: _turn.skipDown ? "NEXT and PREVIOUS TURN pass over threats at 0 Vitality. Click to stop." : "Click to pass over threats at 0 Vitality.",
          style: { cursor: "pointer", fontSize: "10px" },
          onclick: function () { _turn.skipDown = !_turn.skipDown; EN.app.render(); } }, "SKIP THE DOWNED"),
        el("input", { type: "number", min: "1", value: _turn.round === null ? enc.round : _turn.round, title: "Round",
          dataset: { gm: "roundin" }, style: { width: "62px" },
          oninput: function (e) { _turn.round = e.target.value; },
          onkeydown: function (e) { if (e.key === "Enter") setRound(); } }),
        el("button.btn.sm", { dataset: { gm: "setround" }, onclick: setRound }, "SET ROUND")
      ]));
    }

    // the transient half of a row that has left the Table goes with it
    var live = Object.create(null);
    enc.entries.forEach(function (r) { live[r.id] = true; });
    Object.keys(_rows).forEach(function (id) { if (!own(live, id)) delete _rows[id]; });

    if (!enc.entries.length) {
      kids.push(el("div.muted-box", { style: { padding: "26px" },
        text: "Nobody in the order yet. Pull the crew in below, or build a threat and add it." }));
    } else {
      ordered.forEach(function (row) {
        var isNow = row.id === enc.activeId;
        var node = row.kind === "crew" ? crewRow(row, isNow) : threatRow(row, isNow, enc);
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
        el("button.btn.sm", { dataset: { gm: "rerollall" }, onclick: function () {
          gm.update(function (st) {
            st.encounter.entries.forEach(function (r) {
              var mod = r.initMod || 0;
              r.init = EN.engine.rollD20({ mods: [{ label: "Initiative", value: mod }] }).total;
              // a new order starts from its top: nobody in it has acted yet
              r.acted = false;
            });
            // the first entry that can act, as START ROUND 1 picks it, so a downed row is passed over
            st.encounter.activeId = EN.gmEngine.advance({ entries: st.encounter.entries, activeId: null, round: 0 }, turnOpts()).activeId;
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

  /* An Immune or Resistance line (the Cascade Orphan prints both). Its word peeks
     the Codex's Resistance, Vulnerability and Immunity rule, or the Conditions
     Library entry of the same name where that panel is not there, and every damage
     type the line names peeks that type. The words print exactly as before. */
  function firstAnchor(list) {
    for (var i = 0; i < list.length; i++) {
      try { if (EN.codexView && EN.codexView.has(list[i])) return list[i]; } catch (e) {}
    }
    return null;
  }
  function dmgLine(k, v) {
    var p = el("p.help", { dataset: { gm: "dmgline" }, style: { margin: "3px 0 0" } });
    var a = firstAnchor(["ref-damage/resistance-vulnerability-and-immunity", "ref-conds/" + (k === "Immune" ? "immunity" : "resistance")]);
    p.appendChild(a ? EN.ui.ruleLink(a, k) : document.createTextNode(k));
    p.appendChild(document.createTextNode(": "));
    var s = String(v == null ? "" : v);
    var types = ((EN.combat && EN.combat.damageTypes) || []).map(function (t) { return t && t.name; })
      .filter(function (n) { return typeof n === "string" && /^[A-Za-z ]+$/.test(n); });
    if (!types.length) { p.appendChild(document.createTextNode(s)); return p; }
    var re = new RegExp("\\b(" + types.join("|") + ")\\b", "g"), last = 0, seen = {}, m;
    while ((m = re.exec(s))) {
      if (own(seen, m[1])) continue;
      seen[m[1]] = true;
      if (m.index > last) p.appendChild(document.createTextNode(s.slice(last, m.index)));
      p.appendChild(EN.ui.ruleLink("ref-dmg/" + cxSlug(m[1]), m[1]));
      last = m.index + m[1].length;
    }
    if (last < s.length) p.appendChild(document.createTextNode(s.slice(last)));
    return p;
  }

  /* A Bestiary entry's card body, without its buttons: the Bestiary tab draws it
     with them, and the Table draws it as an opened row's full statblock. One
     renderer, so a threat reads the same in both places. `opts.table` leaves
     out the job hooks, which are prep, not play. */
  function entryBody(e, opts) {
    opts = opts || {};
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
        text: e.skills.map(function (k) { return k.name + " " + k.value; }).join(" · ") }));
    }
    if (st["Unshakable, Defensive Impulses"]) {
      kids.push(el("p.help", { style: { margin: "5px 0 0", color: "var(--gold)" } }, [
        document.createTextNode("Solo: " + st["Unshakable, Defensive Impulses"]), tailChip("gmt-solos", "Running Solos")]));
    }
    ["Immune", "Resistance"].forEach(function (k) {
      if (st[k]) kids.push(dmgLine(k, st[k]));
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

    // a Species Template's traits come after the printed abilities, under one line naming it
    var tplSaid = false;
    (e.abilities || []).forEach(function (a) {
      if (a.template && !tplSaid) {
        tplSaid = true;
        kids.push(el("p.help", { dataset: { gm: "template" }, style: { margin: "8px 0 0", color: "var(--gold)" },
          text: "Species Template: " + a.template + (e.speciesClass ? " (" + e.speciesClass + ")" : "") + "." }));
      }
      var ap = el("p", { style: { margin: "6px 0 0", fontSize: "13px" } }, [
        el("span", { style: { fontWeight: 600 }, text: a.name + (a.cost ? " (" + a.cost + ")" : "") + ": " })
      ]);
      // the same **bold** and *italic* as applyInline, with the conditions and rule names it cites linked
      EN.ui.ruleText(ap, String(a.text || ""), { conditions: true });
      kids.push(ap);
    });

    var tail = [];
    if (st.XP) tail.push("XP " + st.XP);
    // Resolve is on 23 of the 48 entries only, and its ABSENCE means the
    // conversation is over before it starts, so a blank must not be printed in
    // its place.
    if (st.Resolve) tail.push("Resolve " + st.Resolve);
    if (tail.length) kids.push(el("p.help", { style: { margin: "8px 0 0" }, text: tail.join(" · ") }));
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
    if (e.hooks && !opts.table) {
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
    return kids;
  }

  /* ---- Species Templates on People cards --------------------------------------
     The page: "When the species matters, lay one of these over the block: add
     the traits, change nothing else. The XP, the Grade, and the Resolve stay as
     printed." and "One template per threat. Templates don't apply to machines,
     programs, or anything Mindless." (EN.bestiary.speciesTemplates.)

     WHO CAN TAKE ONE is read off the entry: a People entry whose identity line
     names a person, "Human" (the default the blocks were written for) or "any
     species", and nothing Mindless. That leaves out the Chained Watchdog, a
     spliced guard-hound. Machines, programs and the rest are other categories.

     WHAT IT CHANGES on the card and on the block it sends: the template's traits
     are added after the printed abilities, the identity line's "Human" reads as
     the species, and the one trait that moves a printed number (Chimera's Keen
     Senses, "+2 Passive Perception") moves it. The XP, the Grade and the Resolve
     are untouched, as the page says. The block keeps the entry's own name, so the
     Bestiary lookups by name (Payroll's salvage, the Encounters plan) still find
     it; the species rides on the block as `species` and the Table row is named
     "Verdine Corpsec Officer", the book's own phrasing. */
  function templateList() {
    return (EN.bestiary && EN.bestiary.speciesTemplates && EN.bestiary.speciesTemplates.templates) || [];
  }
  function templateOf(sp) { return templateList().filter(function (t) { return t && t.species === sp; })[0] || null; }
  function overlayable(e) {
    if (!e || e.category !== "people" || !templateList().length) return false;
    if (!/\bHuman\b|any species/i.test(String(e.identity || ""))) return false;
    var body = [JSON.stringify(e.stats || {})].concat((e.abilities || []).map(function (a) { return a.text; })).join(" ");
    return !/\bMindless\b/.test(body);
  }
  function withTemplate(e, sp) {
    var t = templateOf(sp);
    if (!t) return e;
    var out = {};
    Object.keys(e).forEach(function (k) { out[k] = e[k]; });
    out.identity = String(e.identity || "").replace(/\bHuman\b/, t.species);
    out.stats = {};
    Object.keys(e.stats || {}).forEach(function (k) { out.stats[k] = e.stats[k]; });
    (t.traits || []).forEach(function (tr) {
      var m = String(tr.text || "").match(/^([+-]\d+) Passive Perception\b/);
      var pp = out.stats["Passive Perception"];
      if (!m || pp === undefined || pp === null) return;
      out.stats["Passive Perception"] = String(pp).replace(/^\s*(\d+)/, function (all, n) { return String(Number(n) + Number(m[1])); });
    });
    out.abilities = (e.abilities || []).concat((t.traits || []).map(function (tr) {
      return { name: tr.name, cost: tr.cost || null, text: tr.text, template: t.species };
    }));
    out.species = t.species;
    out.speciesClass = t.classification || "";
    return out;
  }
  function overlaid(e) {
    var sp = own(_species, e.name) ? _species[e.name] : "";
    return (sp && overlayable(e)) ? withTemplate(e, sp) : e;
  }

  /* A Bestiary entry as a Table block: its PRINTED self, not a build. The
     Encounters tab builds the same block for its Bestiary lines. */
  function entryBlock(e) {
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
       reader of either field should find the page's number. `designation` and
       `role` are the lowercase keys a built block carries, so a reader can ask
       either kind of row the same question (the Encounters plan reads `role`
       on a threat line, which is how a templated Bestiary block arrives). */
    var block = {
      name: e.name, grade: e.grade, designation: String(e.designation || "Standard").toLowerCase(),
      designationName: e.designation || "Standard",
      role: e.role ? String(e.role).toLowerCase() : null,
      roleName: e.role || "", defense: isNaN(def) ? null : def,
      saveDC: p.saveDC, attackBonus: p.attackBonus, vitality: vit,
      init: initM, initMod: initM,
      fromBestiary: true, stats: st, abilities: e.abilities || []
    };
    if (e.species) { block.species = e.species; block.speciesClass = e.speciesClass || ""; block.identity = e.identity; }
    return block;
  }
  /* The other way: what a Table row's Bestiary block draws as. The entry is
     found by the block's name for the parts a block does not carry (identity,
     gear, salvage, variant), and the block's own stats and abilities win, so a
     Species Template on the block shows. */
  function entryOf(b) {
    var B = EN.bestiary, base = null, e = {};
    if (B && Array.isArray(B.entries)) base = B.entries.filter(function (x) { return x && x.name === b.name; })[0] || null;
    if (base) Object.keys(base).forEach(function (k) { e[k] = base[k]; });
    e.name = b.name || e.name || "Threat";
    if (b.stats) e.stats = b.stats;
    if (Array.isArray(b.abilities)) e.abilities = b.abilities;
    if (b.identity) e.identity = b.identity;
    if (b.species) { e.species = b.species; e.speciesClass = b.speciesClass || ""; }
    return e;
  }

  function speciesPick(e) {
    var S = EN.bestiary.speciesTemplates || {};
    var cur = own(_species, e.name) ? _species[e.name] : "";
    return el("div.field", { style: { margin: "8px 0 0", maxWidth: "260px" } }, [
      lbl("Species"),
      el("select", { dataset: { gm: "species" }, title: S.footer || "",
        onchange: function (ev) { _species[e.name] = ev.target.value; EN.app.render(); } },
        [el("option", { value: "", selected: !cur }, "As printed")].concat(templateList().map(function (t) {
          return el("option", { value: t.species, selected: cur === t.species }, t.species);
        })))
    ]);
  }

  function bestiaryCard(raw) {
    var e = overlaid(raw);
    var kids = entryBody(e);
    if (overlayable(raw)) kids.push(speciesPick(raw));
    kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "10px" } }, [
      el("button.btn.sm.primary", { onclick: function () {
        var block = entryBlock(e);
        var r = EN.gmEngine.rollInit(block.initMod);
        // a templated threat's ROW says which species it is; its block keeps the entry's name
        var rowName = e.species ? e.species + " " + e.name : null;
        gm.addThreat(block, null, r.total, rowName);
        toast((rowName || e.name) + " rolls " + r.total + " for initiative.");
        EN.app.render();
      } }, "+ ADD TO INITIATIVE"),
      /* The plan prices and runs a Bestiary line by its name, so a plain entry
         sends its name. A templated one sends its resolved block instead, since
         a name alone would arrive on the plan without the template. */
      el("button.btn.sm", { title: "Add this entry as a line on an encounter plan", onclick: function () {
        if (e.species) toPlan([{ kind: "threat", block: entryBlock(e), count: 1 }], "");
        else toPlan([{ kind: "bestiary", name: e.name, count: 1 }], "");
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
      var open = own(_savedOpen, t.id) && _savedOpen[t.id];
      var head = el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", padding: "5px 0" } }, [
        el("div.row", { style: { gap: "8px", alignItems: "baseline", flexWrap: "wrap" } }, [
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
          // the stored block in full, through the same renderer the Table's rows open
          el("button.btn.sm.ghost", { dataset: { gm: "savedexpand" }, title: "The full statblock",
            onclick: function () { _savedOpen[t.id] = !open; EN.app.render(); } }, (open ? "▾" : "▸") + " STATBLOCK"),
          el("button.btn.sm", { onclick: function () { gm.removeThreat(t.id); EN.app.render(); } }, "✕")
        ])
      ]);
      return el("div", { dataset: { gmSaved: t.id }, style: { borderBottom: "1px solid var(--border)", paddingBottom: open ? "8px" : "0" } },
        [head, open ? fullBlock(b) : null]);
    });
    return EN.ui.panel("Saved Threats", list.length + " SAVED", kids);
  }

  /* ---- the Admin desktop's own tab rail, one renderer per tab -------------
     Each one writes its own heading block rather than sharing a header
     helper across views, per the house convention that views carry their own
     small pieces instead of importing from one another. */
  function heading(title, sub) {
    return el("div.row.between.wrap", { style: { marginBottom: "14px", gap: "8px", alignItems: "center" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" },
        html: title + ' <span class="dim3" style="font-size:13px">' + sub + "</span>" }),
      cardDrawer()
    ]);
  }

  /* ---- the GM's Card ----------------------------------------------------------
     EN.gmBook.card, both sides, in a printable overlay. cardDrawer() is the
     GM'S CARD button every Admin tab puts beside its heading: this file's three
     tabs draw it in heading() above, and app.js adds it to a module tab that
     did not draw its own (modules call it the way they call undoStrip).

     It REUSES THE HARDCOPY OVERLAY the #PRINT sheet prints through (print.css:
     #print-overlay, .print-bar, .sheet-page). Its print rules already hide the
     desktop and give every .sheet-page a Letter page of its own, so the two
     sides print as two pages, a card to fold or print double-sided, with no new
     stylesheet. The paper palette is that sheet's own: ink, teal and rule. The
     Front is the page's one box of run-in paragraphs; the Back is set in
     columns of about three inches, which is two on paper and one on a phone.
     Headings and column names are stored in title case (gm_card.js) and set in
     capitals here, as the page prints them. */
  var INK = "#18222c", TEAL = "#0c6f81", RULE = "#cfc8b7", DIM = "#6a747b", PAPER = "#f1ede1";
  /* Two type scales: the boxed Front has a page to itself and sets its six
     paragraphs large; the Back sets twelve tables, seven lines and the blank
     threat on one sheet, so it is denser. */
  function scale(front) {
    return front
      ? { text: "12.5px", textGap: "0 0 10px", cell: "10.5px", head: "9px", pad: "2px 6px 2px 0" }
      : { text: "10px", textGap: "0 0 5px", cell: "10px", head: "8.5px", pad: "1px 6px 1px 0" };
  }
  function cardText(b, S) {
    var p = el("p", { style: { margin: S.textGap, fontSize: S.text, lineHeight: "1.45", color: INK } });
    EN.ui.applyInline(p, String(b.md || b.text || ""));
    return p;
  }
  /* The first column (the row's name, printed bold) never breaks inside a word;
     the other columns wrap between words, which is what keeps the IC table's
     long Responses inside a phone's width. */
  function cardTable(b, S) {
    var cols = b.columns || [];
    var cell = { padding: S.pad, verticalAlign: "top", textAlign: "left" };
    var head = el("tr", null, cols.map(function (c) {
      return el("th", { style: Object.assign({}, cell, { fontSize: S.head, letterSpacing: ".08em", textTransform: "uppercase",
        color: TEAL, borderBottom: "1px solid " + TEAL, fontWeight: 600 }) }, c.name);
    }));
    var rows = (b.rows || []).map(function (r) {
      return el("tr", null, (r.cells || []).map(function (c, i) {
        return el("td", { style: Object.assign({}, cell, { fontSize: S.cell, borderBottom: ".5px solid #e2dccb",
          fontWeight: i === 0 ? 700 : 400, whiteSpace: i === 0 ? "nowrap" : "normal" }) }, c);
      }));
    });
    return el("table", { dataset: { card: b.key || "table" },
      style: { width: "100%", borderCollapse: "collapse", margin: "0 0 6px", color: INK, breakInside: "avoid" } },
      [el("thead", null, head), el("tbody", null, rows)]);
  }
  // the blank threat: a header bar, the bold italic line under it, and a write-in line per row of pairs
  function cardTemplate(b, S) {
    var kids = [
      el("div", { style: { background: INK, color: PAPER, padding: "2px 8px", fontSize: "10.5px", fontWeight: 700,
        letterSpacing: ".1em", textTransform: "uppercase" } }, b.head),
      el("div", { style: { padding: "2px 8px", fontSize: S.cell, fontWeight: 700, fontStyle: "italic", color: INK,
        borderBottom: "1px solid " + RULE } }, b.sub)
    ];
    (b.rows || []).forEach(function (cells) {
      kids.push(el("div", { style: { display: "flex", flexWrap: "wrap", gap: "1px 12px", padding: "2px 8px 6px",
          borderBottom: ".5px solid " + RULE } }, cells.map(function (c) {
        return el("div", { style: { flex: "1 1 0", minWidth: "80px", fontSize: S.cell, color: INK } }, [
          el("strong", { text: c.label + " " }), el("em", { style: { color: DIM }, text: c.hint })
        ]);
      })));
    });
    return el("div", { dataset: { card: b.key || "template" }, style: { border: "1px solid " + INK, margin: "3px 0 5px", breakInside: "avoid" } }, kids);
  }
  function cardSection(sec, S) {
    var kids = [];
    // a run-in section opens on its own bold words, so it prints no heading of its own
    if (!sec.runIn) {
      kids.push(el("div", { style: { borderLeft: "3px solid " + TEAL, paddingLeft: "7px", margin: "0 0 4px", fontSize: "10.5px",
        letterSpacing: ".14em", textTransform: "uppercase", color: TEAL, fontWeight: 600 } }, sec.name));
    }
    (sec.blocks || []).forEach(function (b) {
      if (b.kind === "table") kids.push(cardTable(b, S));
      else if (b.kind === "template") kids.push(cardTemplate(b, S));
      else kids.push(cardText(b, S));
    });
    kids.push(cardCodex(sec.key));
    return el("div", { dataset: { cardSection: sec.key || "" }, style: { margin: "0 0 9px", breakInside: "avoid" } }, kids);
  }
  /* WHERE EACH SECTION'S RULES LIVE IN THE CODEX, after data/gm_card.js's sameAs
     notes: the panel (or entry) holding what the section summarises. A section
     whose target is not on this desktop's Codex yet simply gets no line. */
  var CARD_CODEX = {
    array: ["gmt-array"],
    designations: ["gmt-designations"],
    budgets: ["gme-budget"],
    dcs: ["rz-d20", "gmh-dc"],
    room: ["ref-cover"],
    response: ["gme-security"],
    pools: ["rz-pool"],
    nodes: ["gd-nodes"],
    sitdowns: ["gms-sitdown"],
    chases: ["gms-chase"],
    heat: ["gmx-check", "gmx-ladder"],
    threat: ["gmt-solos/threat-initiative", "gmt-bestiary/threat-pilots"]
  };
  /* A SCREEN-ONLY line under a section: "In the Codex:" and a link per target.
     data-card-codex marks it, and the overlay's own print rule (openCard) hides
     it, so nothing on the printed card is a link. A link peeks over the card
     (raiseOverCard). */
  function cardCodex(key) {
    var list = own(CARD_CODEX, key) ? CARD_CODEX[key] : null;
    if (!list || !EN.codexView || !EN.codexView.has) return null;
    var live = list.filter(function (a) { try { return EN.codexView.has(a); } catch (e) { return false; } });
    if (!live.length) return null;
    var line = el("div", { dataset: { cardCodex: key }, style: { margin: "0 0 4px", fontSize: "10px", letterSpacing: ".04em", color: DIM } },
      [document.createTextNode("In the Codex: ")]);
    live.forEach(function (a, i) {
      if (i) line.appendChild(document.createTextNode(" · "));
      var ln = EN.ui.ruleLink(a);
      if (ln && ln.nodeType === 1) {
        ln.style.color = TEAL;
        ln.addEventListener("click", raiseOverCard);
        ln.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") raiseOverCard(); });
      }
      line.appendChild(ln);
    });
    return line;
  }
  /* The peek drawer stacks under the card overlay by default (print.css puts
     #print-overlay at 9999), so a drawer opened FROM the card is lifted above it.
     OPEN IN CODEX leaves the card for the Codex tab, so it closes the card first;
     Esc closes the drawer before the card (cardKey). Read after the link's own
     click has opened the drawer. */
  function raiseOverCard() {
    var pk = document.getElementById("codex-peek");
    if (!pk || pk.getAttribute("data-over-card")) return;
    pk.setAttribute("data-over-card", "1");
    pk.style.zIndex = "10000";
    pk.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('[data-cxp="open"]')) closeCard();
    }, true);
  }
  /* WHERE THE BACK BREAKS INTO ITS SECOND COLUMN. Two explicit columns, not
     CSS columns: Chrome will not split a multi-column block across a printed
     page and moves the whole of it onto the next sheet instead. The sections
     keep page order, and the right column starts at the section that leaves
     the two closest in height, measured roughly in lines: a table row is a line
     (a long cell more), a text block is its length at a column's width, and a
     row of the blank threat is a line and a half. */
  function sectionLines(sec) {
    var n = sec.runIn ? 0 : 1.5;
    (sec.blocks || []).forEach(function (b) {
      if (b.kind === "table") {
        n += 1.5;
        (b.rows || []).forEach(function (r) {
          var longest = 0;
          (r.cells || []).forEach(function (c) { longest = Math.max(longest, String(c).length); });
          n += Math.max(1, Math.ceil(longest / 40));
        });
      } else if (b.kind === "template") n += 2 + (b.rows || []).length * 1.6;
      else n += Math.max(1, Math.ceil(String(b.text || "").length / 55));
    });
    return n;
  }
  function splitAt(sections) {
    var ws = sections.map(sectionLines), total = 0, run = 0, best = 1, bestGap = Infinity;
    ws.forEach(function (w) { total += w; });
    for (var i = 0; i < ws.length - 1; i++) {
      run += ws[i];
      var gap = Math.abs(total - 2 * run);
      if (gap < bestGap) { bestGap = gap; best = i + 1; }
    }
    return best;
  }
  function cardSide(C, side) {
    var S = scale(!!side.boxed);
    var secs = side.sections || [];
    var inner;
    if (side.boxed) {
      inner = el("div", { style: { border: "1.4px solid " + TEAL, padding: "12px 14px" } }, secs.map(function (s) { return cardSection(s, S); }));
    } else {
      var cut = secs.length > 1 ? splitAt(secs) : secs.length;
      var col = function (part) {
        return el("div", { dataset: { cardCol: "1" }, style: { flex: "1 1 3in", minWidth: "0" } }, part.map(function (s) { return cardSection(s, S); }));
      };
      // at phone width the two columns wrap into one, in page order
      inner = el("div", { style: { display: "flex", flexWrap: "wrap", gap: "0 .3in", alignItems: "flex-start" } },
        [col(secs.slice(0, cut)), secs.length > cut ? col(secs.slice(cut)) : null]);
    }
    return el("div.sheet-page", { dataset: { cardSide: side.key || "" } }, [
      el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", flexWrap: "wrap" } }, [
        el("div", { style: { fontFamily: "var(--disp)", fontWeight: 700, fontSize: "21px", letterSpacing: ".14em",
          color: INK, textTransform: "uppercase" } }, C.title || "The GM's Card"),
        el("div", { style: { fontSize: "10px", letterSpacing: ".22em", color: DIM, textTransform: "uppercase" } }, side.name || "")
      ]),
      el("div", { style: { height: "1px", background: TEAL, margin: "6px 0 10px" } }),
      inner
    ]);
  }
  function cardKey(e) {
    if (e.key !== "Escape") return;
    // a rule peeked FROM the card sits above it (raiseOverCard), and goes first; a drawer
    // that was open before the card is under it, and waits for the next Escape
    var pk = document.getElementById("codex-peek");
    if (pk && pk.getAttribute("data-over-card") && EN.codexView && EN.codexView.closePeek) { EN.codexView.closePeek(); return; }
    closeCard();
  }
  function closeCard() {
    var o = document.getElementById("print-overlay");
    if (o && o.getAttribute("data-gm") === "card") o.parentNode.removeChild(o);
    document.removeEventListener("keydown", cardKey);
  }
  function openCard() {
    var C = EN.gmBook && EN.gmBook.card;
    if (!C || !Array.isArray(C.sides) || !C.sides.length) { toast("The GM's Card did not load. Check app/data/gm_card.js."); return; }
    // one overlay at a time, whoever opened the last one
    var old = document.getElementById("print-overlay");
    if (old) old.parentNode.removeChild(old);
    var bar = el("div.print-bar", { style: { flexWrap: "wrap" } }, [
      el("span.print-bar-t", { text: "THE GM'S CARD" }),
      el("span.print-bar-s", { text: C.sides.length + (C.sides.length === 1 ? " side" : " sides") + " · Letter" }),
      el("span", { style: { flex: 1 } }),
      el("button.btn.sm.primary", { dataset: { gm: "cardprint" }, onclick: function () { window.print(); } }, "⎙ PRINT"),
      el("button.btn.sm", { dataset: { gm: "cardclose" }, onclick: closeCard }, "✕ CLOSE")
    ]);
    var ov = el("div#print-overlay", { dataset: { gm: "card" }, role: "dialog", "aria-label": C.title || "The GM's Card" }, [
      // the Codex lines are a screen aid: the card prints as the page prints it
      el("style", { text: "@media print{ [data-card-codex]{ display:none !important; } }" }),
      bar, el("div.print-scroll", null, C.sides.map(function (s) { return cardSide(C, s); }))
    ]);
    document.body.appendChild(ov);
    document.addEventListener("keydown", cardKey);
  }
  // the button, or null when the card's data is missing (a heading then simply has no button)
  function cardDrawer() {
    if (!EN.gmBook || !EN.gmBook.card) return null;
    return el("button.btn.sm", { dataset: { gm: "cardbtn" }, title: "The GM's Card, both sides, ready to print",
      onclick: function () { openCard(); } }, "GM'S CARD");
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
     draws. Each fn is called on every Table render with {encounter, crew,
     roundSet} and returns a DOM node or null. `roundSet` is {from, to} on the
     one draw right after the GM's SET ROUND, else null.

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
    // a SET ROUND is passed on once, to the draw right after it (see setRound)
    var set = _turn.set;
    _turn.set = null;
    var out = [];
    drawOrder().forEach(function (x) {
      var node = null;
      try { node = x.fn({ encounter: enc, crew: crew, roundSet: set }); }
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
    undoStrip: undoStrip,
    // the GM'S CARD button for beside every Admin tab's heading, and the card it opens
    cardDrawer: cardDrawer, openCard: openCard, closeCard: closeCard
  };
})();
