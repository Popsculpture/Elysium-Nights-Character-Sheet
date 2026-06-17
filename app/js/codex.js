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

  function render(mount) {
    clear(mount);
    var C = EN.combat || {};
    var blocks = [];
    blocks.push(el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" }, html: 'CODEX <span class="dim3" style="font-size:13px">// rules reference library</span>' })
    ]));

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
