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
          var id = "cond-" + c.name, open = !!_open[id];
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

    mount.appendChild(el("div", null, blocks));
  }

  return { render: render };
})();
