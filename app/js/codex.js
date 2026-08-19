/* ===========================================================================
   ELYSIUM NIGHTS · Codex tab
   Rules reference library: combat rules + the full conditions catalog.
   =========================================================================== */
window.EN = window.EN || {};

EN.codexView = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;
  var _open = {};
  var _filter = "";

  function refPanel(id, title, tag, body) {
    var open = !!_open[id];
    return el("div.panel", { style: { marginBottom: "12px" } }, [
      el("div.panel-h.clickable", { onclick: function () { _open[id] = !open; EN.app.render(); } }, [
        el("span.collapse-caret", { text: open ? "▾" : "▸" }), el("h3", { text: title }), tag ? el("span.tag", { text: tag }) : null
      ]),
      el("div.panel-b", open ? null : { style: { display: "none" } }, body)
    ]);
  }
  function ruleBlock(name, text, extra) {
    return el("div.feature", null, [
      el("h4", null, [document.createTextNode(name), extra ? el("span.src", { text: extra }) : null]),
      el("p", { text: text || "" })
    ]);
  }

  /* ---- helpers for the Core Resolution reference ----------------------- */
  // Compact rule table built on the existing .sktable styling. `strongCols`
  // is an optional list of column indices to render emphasized.
  function refTable(cols, rows, strongCols) {
    strongCols = strongCols || [];
    var head = el("tr", null, cols.map(function (c) { return el("th", { text: c }); }));
    var body = rows.map(function (r) {
      return el("tr", null, r.map(function (cell, i) {
        var em = strongCols.indexOf(i) !== -1;
        return el("td", em ? { style: { color: "var(--text)", fontWeight: 600 } } : null, [document.createTextNode(cell)]);
      }));
    });
    return el("table.sktable", { style: { marginBottom: "10px" } }, [el("thead", null, [head]), el("tbody", null, body)]);
  }
  // Multi-line prose where lines starting with "-" become a bullet list.
  function proseBlock(text) {
    var wrap = el("div"), ul = null;
    String(text || "").split("\n").forEach(function (line) {
      var t = line.trim();
      if (!t) { ul = null; return; }
      if (t.charAt(0) === "-") {
        if (!ul) { ul = el("ul", { style: { margin: "2px 0 8px", paddingLeft: "18px", fontSize: "13.5px", color: "var(--text2)", lineHeight: "1.5" } }); wrap.appendChild(ul); }
        var li = el("li", { style: { marginBottom: "3px" } }); EN.ui.applyInline(li, t.slice(1).trim()); ul.appendChild(li);
      } else {
        ul = null;
        var p = el("p", { style: { margin: "0 0 8px", fontSize: "13.5px", color: "var(--text2)", lineHeight: "1.5" } }); EN.ui.applyInline(p, t); wrap.appendChild(p);
      }
    });
    return wrap;
  }
  function subTitle(label) {
    return el("div.section-title", { style: { margin: "14px 0 6px" } }, [document.createTextNode(label), el("span.line")]);
  }

  // Build the Core Resolution reference panels from EN.resolution.
  function resolutionPanels() {
    var Rz = EN.resolution;
    if (!Rz) return [];
    var out = [];

    // 1 · Resolution Basics
    out.push(refPanel("rz-basics", "Resolution Basics", "METHOD & STAKES", [
      proseBlock(Rz.intro),
      subTitle("Core Concepts"),
      refTable(["Term", "Summary"], Rz.coreConcepts.map(function (c) { return [c.term, c.text]; }), [0]),
      subTitle("Choosing a Method"),
      el("p", { style: { margin: "0 0 4px", fontSize: "13px", color: "var(--text)", fontWeight: 600 }, text: Rz.methodSplit.d20Intro }),
      proseBlock(Rz.methodSplit.d20Uses.map(function (s) { return "- " + s; }).join("\n")),
      el("p", { style: { margin: "0 0 4px", fontSize: "13px", color: "var(--text)", fontWeight: 600 }, text: Rz.methodSplit.poolIntro }),
      proseBlock(Rz.methodSplit.poolUses.map(function (s) { return "- " + s; }).join("\n")),
      ruleBlock("In Combat, Stay on d20", Rz.methodSplit.rule),
      subTitle("Quick Lookup"),
      refTable(["Situation", "Method"], Rz.methodSplit.lookup.map(function (r) { return [r.situation, r.method]; }), [1]),
      el("p", { style: { margin: "6px 0 0", fontSize: "12.5px", fontStyle: "italic", color: "var(--text3)" }, text: Rz.methodSplit.tiebreaker })
    ]));

    // 2 · d20 Checks
    out.push(refPanel("rz-d20", "d20 Checks", "ATTACKS · SAVES · SNAP", [
      proseBlock(Rz.d20.process),
      ruleBlock("Static Modifier Cap (+15)", Rz.d20.modCap),
      subTitle("Difficulty Reference"),
      refTable(["Task", "DC", "Example"], Rz.d20.dcTable.map(function (r) { return [r.task, r.dc, r.example]; }), [0, 1]),
      subTitle("Combat Rolls"),
      refTable(["Roll", "Formula", "Target"], Rz.d20.combatRolls.map(function (r) { return [r.type, r.formula, r.target]; }), [0]),
      subTitle("Critical Rolls"),
      refTable(["Roll", "Effect"], Rz.d20.crits.map(function (r) { return [r.roll, r.effect]; }), [0])
    ]));

    // 3 · Dice Pools
    out.push(refPanel("rz-pool", "Dice Pools", "EXTENDED · OUT OF COMBAT", [
      proseBlock(Rz.pool.intro),
      refTable(["Color", "Rolls d10s up to", "Dice cap"], Rz.pool.colorTable.map(function (r) { return [r.color, r.d10Range, r.diceCap]; }), [0]),
      ruleBlock("Pushing into d12s", Rz.pool.d12Rules),
      subTitle("Building Edge Dice"),
      proseBlock(Rz.pool.edgeIntro),
      refTable(["Source", "Edge Dice"], Rz.pool.edgeBuild.map(function (r) { return [r.source, r.dice]; }), [0]),
      el("p", { style: { margin: "0 0 8px", fontSize: "12.5px", fontStyle: "italic", color: "var(--text3)" }, text: Rz.pool.baseNote }),
      subTitle("Edge Past 10"),
      proseBlock(Rz.pool.edgePast10Intro),
      refTable(["Edge Built", "Pool"], Rz.pool.edgePast10.map(function (r) { return [r.built, r.pool]; }), [1]),
      el("p", { style: { margin: "0 0 8px", fontSize: "12.5px", fontStyle: "italic", color: "var(--text3)" }, text: Rz.pool.edgeCeiling }),
      subTitle("Assigning Snag Dice"),
      proseBlock(Rz.pool.snagIntro),
      refTable(["Risk Level", "Snag Dice", "Description"], Rz.pool.snagAssign.map(function (r) { return [r.risk, r.dice, r.desc]; }), [0, 1]),
      subTitle("Snag Past 5"),
      proseBlock(Rz.pool.snagPast5Intro),
      refTable(["Total Snag", "Pool"], Rz.pool.snagPast5.map(function (r) { return [r.total, r.pool]; }), [1]),
      el("p", { style: { margin: "0 0 8px", fontSize: "12.5px", fontStyle: "italic", color: "var(--text3)" }, text: Rz.pool.snagCeiling }),
      subTitle("Rolling Procedure"),
      proseBlock(Rz.pool.procedure),
      el("p", { style: { margin: "0", fontSize: "12.5px", fontStyle: "italic", color: "var(--text3)" }, text: "Example: " + Rz.pool.example })
    ]));

    // 4 · Success Margin & Consequence
    out.push(refPanel("rz-margin", "Success Margin & Consequence", "READING THE ROLL", [
      subTitle("d20 Success Margin"),
      el("p", { style: { margin: "0 0 6px", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)" }, text: Rz.margins.d20Intro }),
      refTable(["Margin", "Result", "Description"], Rz.margins.d20.map(function (r) { return [r.margin, r.result, r.desc]; }), [0, 1]),
      subTitle("Dice Pool Success Margin"),
      el("p", { style: { margin: "0 0 6px", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)" }, text: Rz.margins.poolIntro }),
      refTable(["Margin", "Result", "Description"], Rz.margins.pool.map(function (r) { return [r.margin, r.result, r.desc]; }), [0, 1]),
      ruleBlock("Match the Cost to the Scene", Rz.margins.sceneRule),
      subTitle("Consequence by Scene Type"),
      refTable(["Scene Type", "Appropriate Consequences"], Rz.consequenceByScene.map(function (r) { return [r.scene, r.consequences]; }), [0])
    ]));

    // 5 · Social Consequences & Cost Tracks
    out.push(refPanel("rz-social", "Social Consequences & Cost Tracks", "FATIGUE · STRAIN · FALLOUT", [
      proseBlock(Rz.social.intro),
      refTable(["Social Cost", "Effect"], Rz.social.costs.map(function (r) { return [r.cost, r.effect]; }), [0]),
      ruleBlock("Social Fallout Rule", Rz.social.falloutRule),
      subTitle("Fatigue vs Strain vs Social Fallout"),
      refTable(["Track", "Meaning"], Rz.costTracks.tracks.map(function (r) { return [r.term, r.meaning]; }), [0]),
      el("p", { style: { margin: "0 0 8px", fontSize: "13px", color: "var(--text2)", lineHeight: "1.5" }, text: Rz.costTracks.guidance }),
      subTitle("Automatic Success and Failure"),
      el("div", null, Rz.autoResolve.map(function (a) { return ruleBlock(a.name, a.text); }))
    ]));

    // 6 · Edge & Snag
    out.push(refPanel("rz-edge", "Edge & Snag", "MOMENTUM & FRICTION", [
      proseBlock(Rz.edgeSnag.intro),
      subTitle("d20 Method"),
      proseBlock(Rz.edgeSnag.d20),
      ruleBlock("Stacking (d20)", Rz.edgeSnag.d20Stacking),
      subTitle("Dice Pool Method"),
      proseBlock(Rz.edgeSnag.pool),
      subTitle("Common Sources"),
      refTable(["Arena", "Edge", "Snag"], Rz.edgeSnag.sources.map(function (r) { return [r.area, r.edge, r.snag]; }), [0]),
      el("p", { style: { margin: "0 0 8px", fontSize: "12.5px", fontStyle: "italic", color: "var(--text3)" }, text: Rz.edgeSnag.sourcesNote }),
      ruleBlock("GM Guidance", Rz.edgeSnag.gmGuidance)
    ]));

    // 7 · Collaborative & Opposed Checks
    out.push(refPanel("rz-collab", "Collaborative & Opposed Checks", "CONTEST · GROUP · HELP", [
      proseBlock(Rz.collaborative.intro),
      ruleBlock("Method Choice", Rz.collaborative.methodChoice),
      subTitle("Contested Actions"),
      proseBlock(Rz.collaborative.contested.intro),
      ruleBlock("d20 Process", Rz.collaborative.contested.d20Process),
      ruleBlock("Dice Pool Process", Rz.collaborative.contested.poolProcess),
      refTable(["d20 Margin", "Pool Margin", "Result", "Description"], Rz.collaborative.contested.outcomes.map(function (r) { return [r.d20, r.pool, r.result, r.desc]; }), [2]),
      subTitle("Group Checks"),
      proseBlock(Rz.collaborative.group.intro),
      ruleBlock("d20 Process", Rz.collaborative.group.d20Process),
      ruleBlock("Dice Pool Process", Rz.collaborative.group.poolProcess),
      refTable(["d20 Avg Margin", "Pool Net Margin", "Result", "Description"], Rz.collaborative.group.outcomes.map(function (r) { return [r.d20, r.pool, r.result, r.desc]; }), [2]),
      el("p", { style: { margin: "0 0 8px", fontSize: "12.5px", fontStyle: "italic", color: "var(--text3)" }, text: Rz.collaborative.group.difficulty }),
      subTitle("Help Action"),
      proseBlock(Rz.collaborative.help.intro),
      ruleBlock("Timing & Cost", Rz.collaborative.help.timing),
      ruleBlock("d20 Method", Rz.collaborative.help.d20),
      ruleBlock("Dice Pool Method", Rz.collaborative.help.pool),
      ruleBlock("Limitations", Rz.collaborative.help.limits),
      subTitle("Passive Checks"),
      proseBlock(Rz.collaborative.passive)
    ]));

    return out;
  }

  function render(mount) {
    clear(mount);
    var C = EN.combat || {};
    var blocks = [];
    blocks.push(el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" }, html: 'CODEX <span class="dim3" style="font-size:13px">// rules reference library</span>' })
    ]));

    blocks.push(EN.ui.sectionTitle("Core Resolution"));
    resolutionPanels().forEach(function (p) { blocks.push(p); });

    blocks.push(el("div", { style: { height: "10px" } }));
    blocks.push(EN.ui.sectionTitle("Combat Rules"));
    blocks.push(refPanel("ref-actions", "Action Economy", "TURN STRUCTURE",
      (C.actionTypes || []).map(function (a) { return ruleBlock(a.name, a.text); })
        .concat(C.tradingMove ? [ruleBlock("Trading Your Move", C.tradingMove)] : [])
        .concat((C.commonActions || []).length ? [el("div.section-title", { style: { margin: "14px 0 6px" } }, [document.createTextNode("Common Actions"), el("span.line")])] : [])
        .concat((C.commonActions || []).map(function (a) { return ruleBlock(a.name, a.text, a.cost); }))));
    blocks.push(refPanel("ref-def", "Active Defenses", "IMPULSE ACTIONS",
      (C.activeDefenses || []).map(function (a) { return ruleBlock(a.name, a.text, a.cost); })
        .concat(C.defenseNotes ? [ruleBlock("Conditions and Defense", C.defenseNotes)] : [])));
    blocks.push(refPanel("ref-cover", "Cover & Sight", "DEFENSE MODIFIERS",
      (C.cover || []).map(function (cv) { return ruleBlock(cv.name, cv.effect); })
        .concat(C.lineOfSight ? [ruleBlock("Line of Sight", C.lineOfSight)] : [])
        .concat(C.obscurement ? [ruleBlock("Obscurement", C.obscurement)] : [])
        .concat(C.overflowDamage ? [ruleBlock("Overflow Damage", C.overflowDamage)] : [])));
    blocks.push(refPanel("ref-attack", "Attack Resolution", "MARGINS & CRITS",
      (C.attackResolution ? [ruleBlock("Resolution", C.attackResolution)] : [])
        .concat((C.attackMargins || []).map(function (m) { return ruleBlock(m.margin + " · " + (m.result || ""), m.outcome); }))));
    blocks.push(refPanel("ref-dmg", "Damage Types", (C.damageTypes || []).length + " TYPES",
      (C.damageTypes || []).map(function (t) { return ruleBlock(t.name, t.text); })));

    /* Size: comparative, derived from height, and its whole mechanical reach is
       the Encumbrance Threshold plus comparison. It touches no d20 roll. */
    (function () {
      var R = EN.rules; if (!R || !R.sizeBands) return;
      var kids = [];
      kids.push(ruleBlock("The Scale", (R.sizes || []).join(", ") + ". Size is comparative: \"one Size larger\" means one step up this list. It is derived from height, never chosen directly, and there is no default: an unstatted NPC, drone, or vehicle does not silently become Medium."));
      kids.push(ruleBlock("Height Bands", R.sizeBands.map(function (b) {
        return b.size + ": " + b.imperial + " (" + b.metric + ")";
      }).join("\n") + "\n\nA height landing exactly on a boundary takes the larger category, so 2 ft is Small, 4 ft is Medium and 8 ft is Large.\n\n" + (R.sizeBandNote || "")));
      kids.push(ruleBlock("Grid Footprint", (R.sizes || []).map(function (s) {
        var f = (R.sizeFootprint || {})[s]; return f ? s + ": " + f.square + " | hex: " + f.hex : null;
      }).filter(Boolean).join("\n") + "\n\nA body filling more than one space is measured from the nearest of its spaces, in both directions, which governs Range, Reach and line of sight. An effect centred on you starts from whichever of your spaces you choose when you use it, because Large on a hex grid is three hexes meeting at a corner and has no centre hex."));
      kids.push(ruleBlock("Small and Large", ["Small", "Medium", "Large"].map(function (s) {
        var t = (R.sizeTraits || {})[s]; return t ? s + ": " + t.text : null;
      }).filter(Boolean).join("\n") + "\n\nNeither touches a d20 roll. Size grants no Edge, no Snag, no Defense modifier, and no Speed modifier apart from the squeeze below."));
      if (R.tightGeometry) kids.push(ruleBlock("Tight Geometry", R.tightGeometry));
      var SC = R.sizeComparison || {};
      if (SC.maneuvers) kids.push(ruleBlock("Shove, Trip and Grapple", SC.maneuvers));
      if (SC.dragLift) kids.push(ruleBlock("Dragging and Lifting", SC.dragLift));
      if (SC.occupiedSpace) kids.push(ruleBlock("Moving Through an Occupied Space", SC.occupiedSpace));
      if ((SC.bodyGate || []).length) kids.push(ruleBlock("The Body Gate", SC.bodyGate.map(function (r) {
        return r.theirSize + " | Body " + r.body + " | " + r.holding;
      }).join("\n")));
      // one definition, rendered here for Size context and in full under Improvised Weapons
      if ((((R.improvised || {}).meatShield) || []).length) kids.push(ruleBlock("Meat Shield",
        R.improvised.meatShield[0] + "\n\nFull rules under Improvised Weapons."));
      if ((R.sizeShiftFeatures || []).length) kids.push(ruleBlock("Features That Shift Effective Size",
        R.sizeShiftFeatures.map(function (f) { return f.name + " (" + f.lineage + "): " + f.effect; }).join("\n")
        + "\n\nEach shifts Size for its stated purpose only. None changes your actual Size, footprint, or Encumbrance beyond what it says."));
      blocks.push(refPanel("ref-size", "Size", "DERIVED FROM HEIGHT", kids));
    })();

    /* improvised weapons */
    (function () {
      var R = EN.rules; if (!R) return;
      var IW = R.improvised;
      if (!IW) return;
      var kids = [];
      function bullets(a) { return (a || []).map(function (x) { return "\u2022 " + x; }).join("\n"); }
      kids.push(ruleBlock("Using Improvised Weapons", IW.intro + "\n\n" + bullets(IW.using)));
      /* The Walking Anvil steps every improvised die up one, capped at 1d12. The
         table is the only place improvised damage is stated, so a Juggernaut who
         reads it here would otherwise get the wrong number every time. */
      var anvil = (function () {
        var c = EN.store && EN.store.active();
        return !!(c && c.subclass === "juggernaut");   // stored as the subclass key, not its display name
      })();
      var LADDER = ["1d4", "1d6", "1d8", "1d10", "1d12"];
      function stepUp(die) {
        var i = LADDER.indexOf(String(die).match(/^\d*d\d+/) ? String(die).match(/^\d*d\d+/)[0] : die);
        if (i < 0 || i >= LADDER.length - 1) return null;
        return LADDER[i + 1];
      }
      kids.push(ruleBlock("Improvised Damage", IW.damageNote
        + (anvil ? "\n\nThe Walking Anvil steps each of these up one die, to a maximum of 1d12. Your dice are shown after the arrow." : "")
        + "\n\n"
        + (IW.damage || []).map(function (d) {
            var up = anvil ? stepUp(d.die) : null;
            return d.size + " | " + d.die + (up ? " → " + up : "") + " | " + d.examples;
          }).join("\n")));
      kids.push(ruleBlock("Improvised Thrown Weapons", IW.thrownNote + "\n\n"
        + (IW.thrown || []).map(function (d) { return d.kind + " | " + d.range + " | " + d.examples; }).join("\n")));
      kids.push(ruleBlock("Desperation Attacks", bullets(IW.desperation)));
      kids.push(ruleBlock("Special Effects and Conditions", IW.specialEffects));
      kids.push(ruleBlock("People as Improvised Weapons", IW.peopleIntro + "\n\n" + IW.wieldedBody
        /* A wielded body IS an improvised weapon, so the Walking Anvil steps it too (manuscript
           2026-08-19, reversing the earlier exemption). Its 1d10 is stated in three separate
           places, the body itself plus the Bludgeon and Throw attacks, so this says it once here
           rather than rewriting prose that is correct for everyone who is not a Juggernaut. */
        + (anvil ? "\n\nThe Walking Anvil steps a wielded body up one die like any other improvised weapon: your Bludgeon and Throw each deal " + (stepUp("1d10") || "1d10") + " Bludgeoning, not 1d10." : "")
        + "\n\nWhether you can lift and swing someone at all is the Body Gate, under Size."));
      kids.push(ruleBlock("Meat Shield", bullets(IW.meatShield)));
      kids.push(ruleBlock("Bludgeon", IW.bludgeon));
      kids.push(ruleBlock("Throw", IW.throw));
      blocks.push(refPanel("ref-improvised", "Improvised Weapons", "ANYTHING IN REACH", kids));
    })();

    /* vehicles: ownership and customization */
    (function () {
      var V = EN.vehicles; if (!V) return;
      var kids = [];
      function bullets(a) { return (a || []).map(function (x) { return "\u2022 " + x; }).join("\n"); }
      function g(nv) { return "𝒢" + Number(nv).toLocaleString(); }
      kids.push(ruleBlock("Buying a Vehicle", V.intro
        + "\n\nA vehicle's list price is twenty weeks of its upkeep.\n\n"
        + V.profiles.map(function (v) {
            return v.name + " | " + g(v.listPrice) + " | " + v.category + " T" + v.tier + " | " + v.availability + " | " + v.legality;
          }).join("\n")
        + "\n\n" + V.unlisted));
      kids.push(ruleBlock("How to Get One", V.acquisition.map(function (a) {
        return a.mode + " (" + a.cost + "): " + a.note; }).join("\n")));
      kids.push(ruleBlock("Weekly Upkeep", V.upkeepNote + "\n\n"
        + V.profiles.map(function (v) {
            return v.name + " | fuel " + g(v.fuel) + " + reserve " + g(v.reserve) + " = " + g(v.upkeep) + " per week";
          }).join("\n")));
      kids.push(ruleBlock("Parking, Docking, and Storage",
        V.storage.map(function (s2) { return s2.service + " | 𝒢" + s2.cost; }).join("\n")));
      kids.push(ruleBlock("Vehicle Repair", bullets(V.repair)));
      kids.push(ruleBlock("How Vehicle Mods Work", bullets(V.modRules)));
      kids.push(ruleBlock("Vehicle Mods", V.mods.map(function (m) {
        return m.name + " | " + (m.priceNote || g(m.price)) + " | fits " + m.fits
             + " | " + m.availability + ", " + m.legality + "\n    " + m.effect;
      }).join("\n\n")));
      kids.push(ruleBlock("Mod Slots by Profile", V.profiles.map(function (v) {
        return v.name + " | Tier " + v.tier + " | " + v.modSlots + " slots"; }).join("\n")
        + "\n\nMod Slot Count is 1 + the vehicle's Tier."));
      blocks.push(refPanel("ref-vehicles", "Vehicles", "OWNERSHIP & CUSTOMIZATION", kids));
    })();

    /* economy and rewards */
    (function () {
      var E = EN.economy; if (!E) return;
      var kids = [];
      function bullets(a) { return (a || []).map(function (x) { return "\u2022 " + x; }).join("\n"); }
      function g(v) { return "𝒢" + Number(v).toLocaleString(); }
      kids.push(ruleBlock("Currency and Exchange",
        E.currencies.map(function (c) { return c.symbol + " " + c.name + " | " + c.use; }).join("\n")
        + "\n\n" + E.exchangeRate));
      // What a token actually returns, as opposed to what the ledger says it is worth.
      // Reference only: nothing in the app converts a wallet, because the bands are wide
      // and the cheap one comes with strings that are a scene rather than a number.
      if (E.nexusConversion) kids.push(ruleBlock("Converting Nexus to Glimmer",
        E.nexusConversionNote + "\n\n"
        + E.nexusConversion.map(function (c) { return c.channel + " | " + g(c.low) + " to " + g(c.high) + " per ◎ | " + c.note; }).join("\n")
        + "\n\nUnlicensed conversion may also involve:\n" + bullets(E.nexusUnlicensedRisks)
        + "\n\n" + E.nexusAssumptions
        + "\n\nThe sheet never converts a wallet for you. A cash-out is a scene: who is changing it, what they want, and what it costs you later."));
      kids.push(ruleBlock("Lifestyle Costs", E.lifestyleNote + "\n\n"
        + E.lifestyleTiers.map(function (t) {
            return t.tier + " | " + g(t.weekly) + "/wk | " + g(t.monthly) + "/mo | " + t.living; }).join("\n")
        + "\n\n" + bullets(E.lifestyleRules)));
      kids.push(ruleBlock("Safehouse Rent", E.safehouseRent.map(function (r) {
        return r.type + " | " + g(r.weekly) + "/wk | " + g(r.monthly) + "/mo | " + r.notes; }).join("\n")));
      kids.push(ruleBlock("Safehouse Upgrades", E.safehouseUpgrades.map(function (u) {
        return u.name + " | " + g(u.cost) + " | ongoing " + u.ongoing + " | " + u.benefit; }).join("\n")));
      kids.push(ruleBlock("Licenses, Papers, and Legitimacy", E.licenses.map(function (l) {
        return l.item + " | 𝒢" + l.cost + " | " + l.renewal; }).join("\n")));
      kids.push(ruleBlock("Day Jobs and Between-Contract Income", E.dayJobs.map(function (j) {
        return j.job + " | 𝒢" + j.pay + "/wk | " + j.time + " | " + j.web; }).join("\n")));
      kids.push(ruleBlock("Reward Types", E.rewardTypes.map(function (r) {
        return r.type + " | " + r.meaning; }).join("\n")));
      kids.push(ruleBlock("GM Reward Tables", E.rewardTablesNote + "\n\nGlimmer Rewards (1d8)\n"
        + E.glimmerRewards.map(function (r) { return r.roll + ". " + r.reward + " | 𝒢" + r.value; }).join("\n")
        + "\n\nNexus Token Rewards (1d8). " + E.nexusRewardsNote + "\n"
        + E.nexusRewards.map(function (r) { return r.roll + ". " + r.reward; }).join("\n")));
      kids.push(ruleBlock("Splitting a Payout", E.splitNote + "\n\n" + E.splitExample
        + "\n\nNot every reward divides cleanly:\n" + bullets(E.splitNonStandard)
        + "\n\nThe Inventory tab has a Payout Splitter that does this math."));
      kids.push(ruleBlock("Not Yet In The App",
        "These parts of the chapter are rules the sheet does not model yet. They live in the book:\n\n"
        + bullets(E.notModelled)));
      blocks.push(refPanel("ref-economy", "Economy & Rewards", "COSTS \u00b7 INCOME \u00b7 REWARDS", kids));
    })();

    /* conditions library */
    blocks.push(el("div", { style: { height: "10px" } }));
    blocks.push(EN.ui.sectionTitle("Conditions Library"));
    var search = el("input", { type: "text", value: _filter, placeholder: "Filter conditions…", style: { maxWidth: "280px", marginBottom: "10px" },
      oninput: function (e) { _filter = e.target.value; renderList(); } });
    var listBox = el("div");
    function renderList() {
      clear(listBox);
      var q = _filter.trim().toLowerCase();
      (EN.conditions || []).filter(function (c) { return !q || c.name.toLowerCase().indexOf(q) !== -1 || (c.summary || "").toLowerCase().indexOf(q) !== -1; })
        .forEach(function (c) {
          var id = "cond-" + c.name;
          listBox.appendChild(el("div.feature", { style: { borderLeftColor: "var(--warn)" } }, [
            el("h4", { style: { cursor: "pointer" }, onclick: function () { _open[id] = !_open[id]; renderList(); } }, [
              el("span", null, [el("span.collapse-caret", { text: _open[id] ? "▾" : "▸" }), document.createTextNode(" " + c.name)]),
              el("span.src", { text: c.summary ? c.summary.slice(0, 60) : "" })
            ]),
            _open[id] ? el("p", { text: c.text || c.summary || "" }) : null
          ]));
        });
      if (!listBox.firstChild) listBox.appendChild(el("p.help", { text: "No conditions match." }));
    }
    renderList();
    blocks.push(refPanel("ref-conds", "Conditions", (EN.conditions || []).length + " ENTRIES", [search, listBox]));

    /* Environmental Hazards: the chapter that sits between Conditions and The
       Flow. Everything here is read out of EN.hazards, the same data the live
       clocks on the Freelancer tab run on, so the reference and the sheet
       cannot state different numbers. */
    (function () {
      var H = EN.hazards; if (!H) return;
      var E = H.exposure, B = H.breath, C = H.caustic;
      var kids = [];
      kids.push(ruleBlock("Exposure", E.intro + "\n\n" + E.onLeave + "\n\n" + E.fatigueNote));
      kids.push(subTitle("Severity sets the interval"));
      kids.push(refTable(["Severity", "Interval"], E.severities.map(function (s) { return [s.name, s.interval]; }), [0]));
      kids.push(subTitle("The clock"));
      kids.push(proseBlock("- First save in an exposure: DC " + E.baseDC
        + "\n- Each save after it: previous DC + " + E.step
        + "\n- On failure: " + E.onFail
        + "\n- On success: " + E.onSuccess
        + "\n- The escalating DC is per EXPOSURE INSTANCE, not a global counter. Two separate exposures each start at DC " + E.baseDC + "."));
      kids.push(subTitle("Per-type riders"));
      kids.push(refTable(["Type", "Rider"], E.types.map(function (t) { return [t.name, t.rider]; }), [0]));
      kids.push(subTitle("Deprivation's three clocks"));
      kids.push(refTable(["Track", "Threshold", "Runs"], E.deprivation.tracks.map(function (t) {
        return [t.name, t.crossed, "One save per day at Mild, on its own clock, stacking its own Fatigue"];
      }), [0, 1]));
      kids.push(subTitle("Vacuum"));
      kids.push(ruleBlock("Vacuum mirrors Drowning exactly",
        "Breath held: " + B.holdRule + ".\nThen, at " + B.timing + ": Body Save DC " + B.dc + ", +" + B.step + " each round."
        + "\n- On failure: take " + B.woundsOnFail + " Wound."
        + "\n- On failure and at or below half max Wounds: also fall Unconscious."
        + "\n- Wounds reach 0 while exposed: death."
        + "\n\n" + (B.kinds[1].riders || []).join("\n")
        + "\n\nBoth conditions are built from one spec in the data, so if Drowning changes, Vacuum changes with it."));
      kids.push(ruleBlock("Sealing against vacuum", B.vacuumSeal.rule + "\n\n"
        + B.vacuumSeal.paths.map(function (p) { return p.name + ": " + p.how; }).join("\n\n")));
      kids.push(subTitle("Caustic Environments"));
      kids.push(ruleBlock("In it, and after it", C.intro
        + "\n- " + C.inside.dice + " " + C.inside.type + " " + C.inside.when + "."
        + "\n- Persists after exit: " + C.lingering.dice + " " + C.lingering.type + " " + C.lingering.when + "."
        + "\n- " + C.wash));
      kids.push(ruleBlock("Gear degradation", C.gearDegradation.text
        + "\n\nThe sheet computes and records this loss against the exact suit that took it, and reports it as pending. Current DR per piece belongs to Armor Repair, which is not on this branch, so nothing here subtracts from your Damage Reduction: a second armor DR system is exactly what must not exist when Armor Repair arrives."));
      kids.push(subTitle("Mitigations"));
      kids.push(el("p", { style: { margin: "0 0 8px", fontSize: "13px", color: "var(--text2)", lineHeight: "1.5" },
        text: "Nothing new. Each of these already exists elsewhere in the book, and each one changes an outcome on the Hazards panel rather than only being described." }));
      kids.push(refTable(["Mitigation", "Source", "Effect"], H.mitigations.map(function (m) {
        return [m.name, m.kind, m.summary];
      }), [0]));
      H.mitigations.filter(function (m) { return m.note; }).forEach(function (m) {
        kids.push(ruleBlock(m.name, m.note, m.kind));
      });
      blocks.push(refPanel("ref-hazards", "Environmental Hazards", "EXPOSURE · VACUUM · CAUSTIC", kids));
    })();

    mount.appendChild(el("div", null, blocks));
  }

  return { render: render };
})();
