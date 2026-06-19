/* ===========================================================================
   ELYSIUM NIGHTS · Character Builder
   The foundation tab: create a Freelancer and level them 1 -> 10.
   Reads/writes EN.store; derives via EN.engine.
   =========================================================================== */
window.EN = window.EN || {};

EN.builder = (function () {
  var el = EN.ui.el, clear = EN.ui.clear, toast = EN.ui.toast;
  var R = EN.rules, eng = EN.engine, store = EN.store;

  var STEPS = [
    { key: "identity",  n: "01", t: "Identity" },
    { key: "attributes",n: "02", t: "Attributes" },
    { key: "species",   n: "03", t: "Species" },
    { key: "background",n: "04", t: "Background" },
    { key: "class",     n: "05", t: "Class" },
    { key: "advance",   n: "06", t: "Advance" },
    { key: "dossier",   n: "07", t: "#PRINT" }
  ];
  var _step = 0;
  var _intake = false;   // show the register-or-import gate even when records already exist
  var _collapsed = {};   // {sectionId: true}, UI-only collapse state (persists across re-renders)
  var _dismissed = {};   // {sectionId: dismissKey}, attention markers the player has dismissed

  // Advance-tab sections default to COLLAPSED: a section is collapsed unless the
  // player has explicitly expanded it (_collapsed[id] === false).
  function isCollapsed(id) { return _collapsed[id] !== false; }
  function toggleCollapse(id) { _collapsed[id] = isCollapsed(id) ? false : true; EN.app.render(); }
  // a dismissible "attention" dot; dismissKey ties dismissal to a state (e.g. level)
  function attnDot(id, dismissKey, title) {
    return el("span.attn-dot", { title: title || "New options or unspent points, click to dismiss",
      onclick: function (e) { e.stopPropagation(); _dismissed[id] = dismissKey; EN.app.render(); } });
  }
  function attnShown(id, need, dismissKey) { return !!need && _dismissed[id] !== dismissKey; }

  // Collapsible panel with optional attention dot in the header.
  function collapsiblePanel(id, title, tag, bodyChildren, opts) {
    opts = opts || {};
    var collapsed = isCollapsed(id);
    var head = [el("span.collapse-caret", { text: collapsed ? "▸" : "▾" }), el("h3", { text: title })];
    if (tag) head.push(el("span.tag", { text: tag }));
    head.push(el("span.attn-spacer"));
    if (attnShown(id, opts.attention, opts.dismissKey)) head.push(attnDot(id, opts.dismissKey, opts.attentionTitle));
    var node = el("div.panel", null, [
      el("div.panel-h.clickable", { onclick: function () { toggleCollapse(id); } }, head),
      el("div.panel-b", collapsed ? { style: { display: "none" } } : null, bodyChildren)
    ]);
    if (opts.corners) ["tl", "tr", "bl", "br"].forEach(function (c) { node.appendChild(el("span.corner." + c)); });
    return node;
  }

  // Collapsible .feature entry (used for Universal Upgrade / Awakening slots).
  function collapsibleEntry(id, opts) {
    var collapsed = isCollapsed(id);
    var left = el("span", { style: { display: "flex", alignItems: "center", gap: "6px" } }, [
      el("span.collapse-caret", { text: collapsed ? "▸" : "▾" }), document.createTextNode(opts.title)
    ]);
    var rightKids = [el("span.src", { text: opts.summary })];
    if (attnShown(id, opts.attention, opts.dismissKey)) rightKids.push(attnDot(id, opts.dismissKey, opts.attentionTitle));
    var right = el("span", { style: { display: "flex", alignItems: "center", gap: "8px" } }, rightKids);
    var node = el("div.feature", { class: opts.gold ? "lineage" : "", style: { borderLeftColor: opts.filled ? (opts.gold ? "var(--gold)" : "var(--accent)") : "var(--border2)" } }, [
      el("h4", { style: { cursor: "pointer" }, onclick: function () { toggleCollapse(id); } }, [left, right])
    ]);
    if (!collapsed && opts.body) node.appendChild(opts.body);
    return node;
  }

  /* ---------- skill grant parsing ---------- */
  function skillKey(name) {
    if (!name) return null;
    var s = R.skillByName[String(name).trim().toLowerCase()];
    return s ? s.key : null;
  }
  function parseSkillGrants(arr) {
    var granted = [], choices = [];
    (arr || []).forEach(function (entry) {
      var k = skillKey(entry);
      if (k) { granted.push(k); return; }
      if (/choose/i.test(entry) || /\(/.test(entry)) {
        var inside = (entry.match(/\(([^)]*)\)/) || [])[1] || entry.replace(/.*choose\s+\w+/i, "");
        var opts = inside.split(/,|\bor\b/).map(function (x) { return skillKey(x); }).filter(Boolean);
        if (opts.length) choices.push({ raw: entry, options: opts });
      }
    });
    return { granted: granted, choices: choices };
  }

  /* ---------- vitals strip (live readout) ---------- */
  function vitalsStrip(d) {
    var items = [
      EN.ui.stat("LVL", d.level, "CAL " + d.caliber),
      EN.ui.stat("DEF", d.defense, d.defenseAttr === "BOD" ? "BODY" : "AGI"),
      EN.ui.stat("SPD", d.speed, "spaces"),
      EN.ui.stat("VIT", d.vitalityMax != null ? d.vitalityMax : "-", d.classInfo ? "max" : "pick class"),
      EN.ui.stat("WND", d.woundsMax, "= Body"),
      EN.ui.stat("RES", d.resilienceDie ? "d" + d.resilienceDie : "-", "dice")
    ];
    if (d.resource) items.push(EN.ui.stat(d.resource.name.toUpperCase(), d.resource.max, d.resource.attributeName));
    if (d.flow) items.push(EN.ui.stat("FLOW", d.flow.max, "DC " + d.flow.dc, true));
    return el("div.stat-row", { style: { marginBottom: "18px" } }, items);
  }

  /* ---------- STEP 1: IDENTITY ---------- */
  function stepIdentity(ch) {
    function txt(field, label, ph, area) {
      var node = el(area ? "textarea" : "input", {
        type: "text", value: (ch.identity[field] || ""), placeholder: ph || "",
        oninput: function (e) { store.update(function (c) { c.identity[field] = e.target.value; }, { silent: true }); }
      });
      return el("div.field", null, [el("label.fl", { text: label }), node]);
    }
    var nameNode = el("input", {
      type: "text", value: ch.name || "", placeholder: "Freelancer's name…",
      oninput: function (e) { store.update(function (c) { c.name = e.target.value; }, { silent: true }); document.getElementById("active-name").textContent = (e.target.value || "NO FREELANCER").toUpperCase(); }
    });
    return el("div", null, [
      EN.ui.panel("Freelancer Profile", "IDENTITY.SYS", [
        el("div.grid2", null, [
          el("div.field", null, [el("label.fl", { text: "Name" }), nameNode]),
          txt("handle", "Handle", "Street handle / alias…")
        ]),
        txt("concept", "Concept, the one-line pitch", "An ex-corporate Stitcher with a stolen triage rig…", true),
        txt("whereFrom", "Where You Came From", "Burbclave, Warrens, void station, corporate creche…", true)
      ], { corners: true }),
      el("div", { style: { height: "16px" } }),
      EN.ui.panel("Inner Profile", "PURE STORY · NO MECHANICS", [
        el("p.help", { text: "Keeps your Freelancer from collapsing into a meme with a gun. No bonuses, just truth." }),
        el("div", { style: { height: "10px" } }),
        el("div.grid2", null, [
          txt("facets", "Facets, habits & tells", R.innerProfile.facets, true),
          txt("coreSparks", "Core Sparks, what drives you", R.innerProfile.coreSparks, true),
          txt("tethers", "Tethers, who you won't abandon", R.innerProfile.tethers, true),
          txt("faultLines", "Fault Lines, fears & hard limits", R.innerProfile.faultLines, true)
        ]),
        txt("appearance", "Appearance & style", "Neon rain, scavenged chrome, biometric tattoos…", true),
        txt("notes", "Notes", "", true)
      ])
    ]);
  }

  /* ---------- STEP 2: ATTRIBUTES ---------- */
  function stepAttributes(ch, d) {
    var method = ch.attributeMethod || "pointbuy";
    function setMethod(m) {
      store.update(function (c) {
        c.attributeMethod = m;
        if (m === "pointbuy") { R.attributes.forEach(function (a) { c.attributes[a.key] = 10; }); }
        if (m === "array") { R.attributes.forEach(function (a) { c.attributes[a.key] = 10; }); c.arrayAssign = {}; }
      });
    }
    var methodRow = el("div.row.wrap", { style: { marginBottom: "14px" } }, [
      ["pointbuy", "Point Buy"], ["array", "Standard Array"], ["manual", "Manual/Roll"]
    ].map(function (m) {
      return el("button.btn.sm" + (method === m[0] ? ".primary" : ""), { onclick: function () { setMethod(m[0]); } }, m[1]);
    }));

    var info;
    if (method === "pointbuy") {
      var pb = eng.pointBuySpent(ch.attributes);
      info = el("div.row.wrap", { style: { gap: "16px", marginBottom: "12px" } }, [
        el("span.chip" + (pb.remaining < 0 ? "" : ".on"), { text: "POINTS: " + pb.remaining + " / " + R.pointBuy.pool }),
        el("span.help", { text: "Costs: 11-13 = 1 ea · 14-15 = 2 ea · 16 = 3 · drop to 8 refunds 2 · cap 16." })
      ]);
    } else if (method === "array") {
      info = el("div.row.wrap", { style: { gap: "8px", marginBottom: "12px" } },
        [el("span.help", { text: "Assign each value once:" })].concat(
          arrayRemaining(ch).map(function (v) { return el("span.chip", { text: String(v) }); })
        ));
    } else {
      info = el("p.help", { text: "Type scores directly (range 1-20), or roll 4d6-drop-lowest groups below and apply one. Rolling is an optional, GM-approved rule; it creates outliers the bounded math isn't tuned for." });
    }

    var cells = R.attributes.map(function (a) {
      var score = ch.attributes[a.key];
      var m = R.modifier(score);
      var ctrl;
      if (method === "array") {
        ctrl = el("select", {
          onchange: function (e) { assignArray(ch, a.key, e.target.value === "" ? null : Number(e.target.value)); }
        }, [el("option", { value: "", text: "-" })].concat(arrayOptions(ch, a.key).map(function (o) {
          return el("option", { value: o.v, text: String(o.v), selected: o.sel, disabled: o.disabled });
        })));
      } else {
        var lo = method === "pointbuy" ? R.pointBuy.minStart : 1;
        var hi = method === "pointbuy" ? R.pointBuy.maxStart : R.hardCapMax;
        ctrl = el("div.stepper", null, [
          el("button", { disabled: !canStep(ch, a.key, -1, method), onclick: function () { stepAttr(ch, a.key, -1, method); } }, "−"),
          el("input", { type: "number", value: score, min: lo, max: hi, onchange: function (e) { setAttr(ch, a.key, Number(e.target.value), method); } }),
          el("button", { disabled: !canStep(ch, a.key, 1, method), onclick: function () { stepAttr(ch, a.key, 1, method); } }, "+")
        ]);
      }
      var bump = (ch.universalUpgrades && Object.keys(ch.universalUpgrades).some(function (l) { var u = ch.universalUpgrades[l]; return u && u.type === "attr" && ((u.attrs && u.attrs.indexOf(a.key) !== -1) || u.attr === a.key); }));
      return el("div.attr-cell", { title: a.blurb }, [
        el("div.abbr", { text: a.abbr }),
        el("div.mod", { text: eng.fmtMod(d.attributes[a.key].mod) }),
        el("div.s.mono", { html: "score " + score + (bump ? " <span class='cyan'>▲</span>" : "") }),
        ctrl
      ]);
    });

    return el("div", null, [
      EN.ui.panel("Attribute Matrix", "BIOMETRIC PROFILE", [
        methodRow, info, el("div.attr-grid", null, cells),
        el("p.help", { style: { marginTop: "12px" }, text: "Modifier = ⌊(score − 10) / 2⌋. Level-up attribute increases (▲) are applied on top in the Advance step." }),
        method === "manual" ? rollGroupsSection(ch) : null
      ], { corners: true })
    ]);
  }
  function canStep(ch, key, dir, method) {
    var s = ch.attributes[key] + dir;
    if (method === "pointbuy") {
      if (s < R.pointBuy.minStart || s > R.pointBuy.maxStart) return false;
      var test = Object.assign({}, ch.attributes); test[key] = s;
      var pb = eng.pointBuySpent(test);
      return pb.remaining >= 0;
    }
    return s >= 1 && s <= R.hardCapMax;
  }
  function stepAttr(ch, key, dir, method) { setAttr(ch, key, ch.attributes[key] + dir, method); }
  function setAttr(ch, key, val, method) {
    var lo = method === "pointbuy" ? R.pointBuy.minStart : 1;
    var hi = method === "pointbuy" ? R.pointBuy.maxStart : R.hardCapMax;
    val = eng.clamp(val || lo, lo, hi);
    if (method === "pointbuy") {
      var test = Object.assign({}, ch.attributes); test[key] = val;
      if (eng.pointBuySpent(test).remaining < 0) { toast("Not enough points."); return; }
    }
    store.update(function (c) { c.attributes[key] = val; });
  }
  function arrayRemaining(ch) {
    var pool = R.standardArray.slice();
    Object.keys(ch.arrayAssign || {}).forEach(function (k) {
      var v = ch.arrayAssign[k]; var i = pool.indexOf(v); if (i !== -1) pool.splice(i, 1);
    });
    return pool;
  }
  function arrayOptions(ch, key) {
    var current = (ch.arrayAssign || {})[key];
    var counts = {}; R.standardArray.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
    var used = {}; Object.keys(ch.arrayAssign || {}).forEach(function (k) { var v = ch.arrayAssign[k]; used[v] = (used[v] || 0) + 1; });
    var uniq = Array.from(new Set(R.standardArray)).sort(function (a, b) { return b - a; });
    return uniq.map(function (v) {
      var avail = counts[v] - (used[v] || 0) + (current === v ? 1 : 0);
      return { v: v, sel: current === v, disabled: avail <= 0 };
    });
  }
  function assignArray(ch, key, val) {
    store.update(function (c) {
      c.arrayAssign = c.arrayAssign || {};
      if (val == null) { delete c.arrayAssign[key]; c.attributes[key] = 10; }
      else { c.arrayAssign[key] = val; c.attributes[key] = val; }
    });
  }

  /* ---- Dice roller (Manual/Roll): 4d6 drop lowest × 6, banked as groups ---- */
  var DICE_STYLES = {
    neon:  { label: "Neon Cyan",   color: "var(--accent)" },
    ember: { label: "Corp Ember",  color: "var(--ember)" },
    flow:  { label: "Flow Violet", color: "var(--flow)" },
    gold:  { label: "Glimmer Gold", color: "var(--gold)" }
  };
  var _diceStyle = (function () { try { return localStorage.getItem("en_dice_style") || "neon"; } catch (e) { return "neon"; } })();
  var _animGroup = null;

  function roll4d6() { return [0, 0, 0, 0].map(function () { return 1 + Math.floor(Math.random() * 6); }); }
  function droppedIndex(dice) { return dice.indexOf(Math.min.apply(null, dice)); }
  function slotTotal(slot) { var s = slot.dice.slice().sort(function (a, b) { return a - b; }); return s[1] + s[2] + s[3]; }
  function newRollGroup() {
    return {
      id: "rg_" + Math.random().toString(36).slice(2, 9),
      slots: [0, 1, 2, 3, 4, 5].map(function () { return { dice: roll4d6() }; }),
      assign: [null, null, null, null, null, null]
    };
  }

  function rollGroupsSection(ch) {
    var style = DICE_STYLES[_diceStyle] || DICE_STYLES.neon;
    var groups = ch.rollGroups || [];
    var head = el("div.row.wrap", { style: { gap: "10px", alignItems: "center", margin: "16px 0 4px" } }, [
      el("div.section-title", { style: { margin: 0, flex: 1, minWidth: "200px" } }, [document.createTextNode("Dice Roll Groups (4d6, drop the lowest)"), el("span.line")]),
      el("select", { title: "Dice style", style: { width: "auto", padding: "4px 28px 4px 8px", fontSize: "12px" },
        onchange: function (e) { _diceStyle = e.target.value; try { localStorage.setItem("en_dice_style", _diceStyle); } catch (err) {} EN.app.render(); } },
        Object.keys(DICE_STYLES).map(function (k) { return el("option", { value: k, selected: _diceStyle === k, text: "◇ " + DICE_STYLES[k].label }); })),
      el("button.btn.sm.primary", { onclick: function () {
        var g = newRollGroup();
        _animGroup = g.id;
        store.update(function (c) { c.rollGroups = c.rollGroups || []; c.rollGroups.unshift(g); });
        animateDiceRoll(g);
        _animGroup = null;
      } }, "⚄ ROLL GROUP")
    ]);
    var body = [head,
      el("p.help", { style: { marginBottom: "8px" }, text: "Bank as many roll groups as your GM allows, assign each value to an Attribute, then apply one group to your scores." })];
    if (!groups.length) body.push(el("div.muted-box", { text: "No banked rolls yet; hit ROLL GROUP to throw 6 × 4d6." }));
    groups.forEach(function (g) { body.push(rollGroupBox(ch, g, style)); });
    return el("div", null, body);
  }

  function rollGroupBox(ch, g, style) {
    var animating = g.id === _animGroup;
    var assignedKeys = g.assign.filter(Boolean);
    var complete = assignedKeys.length === 6;
    var slots = g.slots.map(function (slot, i) {
      var total = slotTotal(slot);
      var drop = droppedIndex(slot.dice);
      var dice = slot.dice.map(function (v, di) {
        return el("span.die" + (animating ? ".rolling" : (di === drop ? ".dropped" : "")), {
          dataset: animating ? { die: "1", final: String(v), dropped: di === drop ? "1" : "" } : null,
          style: { color: style.color, borderColor: style.color },
          text: animating ? "?" : String(v)
        });
      });
      var sel = el("select", { style: { marginTop: "6px", padding: "3px 24px 3px 6px", fontSize: "12px" },
        onchange: function (e) { store.update(function (c) { var gg = (c.rollGroups || []).find(function (x) { return x.id === g.id; }); if (gg) gg.assign[i] = e.target.value || null; }); } },
        [el("option", { value: "", text: "-" })].concat(R.attributes.map(function (a) {
          var used = g.assign.indexOf(a.key) !== -1 && g.assign[i] !== a.key;
          return el("option", { value: a.key, selected: g.assign[i] === a.key, disabled: used, text: a.abbr });
        })));
      return el("div.roll-slot", null, [
        el("div.roll-total", { dataset: animating ? { tot: "1", final: String(total) } : null, style: { color: style.color }, text: animating ? "··" : String(total) }),
        el("div", { style: { margin: "5px 0 0" } }, dice),
        sel
      ]);
    });
    return el("div.roll-group", { dataset: { rg: g.id } }, [
      el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: "8px" } }, slots),
      el("div.row.wrap", { style: { gap: "8px", marginTop: "10px", justifyContent: "flex-end" } }, [
        el("button.btn.sm", { onclick: function () { store.update(function (c) { var gg = (c.rollGroups || []).find(function (x) { return x.id === g.id; }); if (gg) gg.assign = [null, null, null, null, null, null]; }); } }, "RESET"),
        el("button.btn.sm.danger", { onclick: function () { store.update(function (c) { c.rollGroups = (c.rollGroups || []).filter(function (x) { return x.id !== g.id; }); }); } }, "✕ DELETE"),
        el("button.btn.sm" + (complete ? ".primary" : ""), { disabled: !complete, title: complete ? "Set your six scores from this group" : "Assign all six values first",
          onclick: function () {
            store.update(function (c) { g.assign.forEach(function (a, i) { if (a) c.attributes[a] = slotTotal(g.slots[i]); }); });
            toast("Roll group applied to attributes.");
          } }, "APPLY SCORES")
      ])
    ]);
  }

  // brief scramble animation: dice flicker random faces, then settle on the real roll
  function animateDiceRoll(g) {
    var root = document.querySelector('[data-rg="' + g.id + '"]');
    if (!root) return;
    var dice = [].slice.call(root.querySelectorAll("[data-die]"));
    var totals = [].slice.call(root.querySelectorAll("[data-tot]"));
    var t = 0, dur = 700;
    var timer = setInterval(function () {
      t += 50;
      dice.forEach(function (d, i) {
        if (!d.isConnected) return;
        if (t < dur - (dice.length - i) * 4) { d.textContent = String(1 + Math.floor(Math.random() * 6)); return; }
        d.textContent = d.dataset.final;
        if (d.classList.contains("rolling")) {
          d.classList.remove("rolling");
          if (d.dataset.dropped) d.classList.add("dropped");
        }
      });
      totals.forEach(function (n) { if (n.isConnected && t < dur) n.textContent = String(3 + Math.floor(Math.random() * 16)); });
      if (t >= dur) {
        clearInterval(timer);
        totals.forEach(function (n) { if (n.isConnected) n.textContent = n.dataset.final; });
      }
    }, 50);
  }

  // Features selectable AT CREATION (Species tab) vs unlockable via Evolution (Advance tab)
  function creationFeatures(lin) {
    var set = (R.lineageCreationFeatures && R.lineageCreationFeatures[lin.key]) || null;
    if (!set) return lin.features || [];
    return (lin.features || []).filter(function (f) { return set.indexOf(f.name) !== -1; });
  }
  function evolutionFeatures(lin) {
    return (lin.features || []).filter(function (f) { return f.evolution !== false; });
  }

  /* ---------- STEP 3: SPECIES ---------- */
  function stepSpecies(ch) {
    var sp = eng.getSpecies(ch.species);
    var lin = eng.getLineage(ch.species, ch.lineage);
    var blocks = [];

    blocks.push(EN.ui.sectionTitle("Choose a Species"));
    blocks.push(el("div.card-grid", null, (EN.species || []).map(function (s) {
      return el("div.opt-card" + (ch.species === s.key ? ".sel" : ""), {
        onclick: function () { store.update(function (c) { if (c.species !== s.key) { c.species = s.key; c.lineage = null; c.lineageFeatures = []; c.size = null; } }); }
      }, [
        el("span.check", { text: "◉ ONLINE" }),
        el("h4", { text: s.name }),
        el("div.sub", { text: (s.lineages || []).map(function (l) { return l.name; }).join(" · ") }),
        el("p", { text: s.blurb || "" })
      ]);
    })));

    if (sp) {
      blocks.push(el("div", { style: { height: "18px" } }));
      blocks.push(EN.ui.sectionTitle(sp.name + " · Species Traits"));
      var t = sp.traits || {};
      blocks.push(el("div", null, [
        sizeRow(ch, lin, t.size), traitLine("Languages", t.languages),
        t.coreTrait ? feature(t.coreTrait.name, t.coreTrait.text, "species", "Core Trait") : null,
        t.secondaryTrait ? feature(t.secondaryTrait.name, t.secondaryTrait.text, "species", "Secondary Trait") : null
      ]));

      blocks.push(el("div", { style: { height: "18px" } }));
      blocks.push(EN.ui.sectionTitle("Choose a Lineage"));
      blocks.push(el("div.card-grid", null, (sp.lineages || []).map(function (l) {
        return el("div.opt-card" + (ch.lineage === l.key ? ".sel" : ""), {
          onclick: function () { store.update(function (c) { if (c.lineage !== l.key) { c.lineage = l.key; c.lineageFeatures = []; c.size = (R.lineageSize[l.key] || ["Medium"])[0]; } }); }
        }, [el("span.check", { text: "◉" }), el("h4", { text: l.name }), el("p", { text: l.description || "" })]);
      })));
    }

    if (lin) {
      blocks.push(el("div", { style: { height: "18px" } }));
      blocks.push(EN.ui.sectionTitle("Lineage Feature, choose one"));
      if (lin.featuresNote) blocks.push(el("p.help", { style: { marginBottom: "8px" }, text: lin.featuresNote }));
      var chosen = ch.lineageFeatures || [];
      blocks.push(el("div", null, creationFeatures(lin).map(function (f) {
        var on = chosen.indexOf(f.name) !== -1;
        return el("div.feature.lineage", { style: { cursor: "pointer", opacity: on ? "1" : ".82", borderLeftColor: on ? "var(--gold)" : "var(--border2)" },
          onclick: function () { store.update(function (c) { c.lineageFeatures = on ? [] : [f.name]; }); } }, [
          el("h4", null, [document.createTextNode(f.name), el("span.src", { text: on ? "● SELECTED" : "○ select" })]),
          el("p", { text: f.text })
        ]);
      })));
      blocks.push(el("p.help", { style: { marginTop: "8px" }, text: "Pick one now. You unlock additional Additive Features from this same list through Lineage Evolution (Advance step)." }));
    }
    return el("div", null, blocks);
  }
  function traitLine(label, val) {
    if (!val) return null;
    return el("div", { style: { marginBottom: "8px" } }, [el("span.chip", { text: label }), el("span", { style: { marginLeft: "10px", color: "var(--text2)", fontSize: "14px" }, text: val })]);
  }
  // effective creature Size: player pick if valid, else the lineage default
  function effectiveSize(ch) {
    var opts = ch.lineage && R.lineageSize ? R.lineageSize[ch.lineage] : null;
    if (!opts) return ch.size || null;
    return (ch.size && opts.indexOf(ch.size) !== -1) ? ch.size : opts[0];
  }
  // Size as a chip; variable-size lineages get clickable options
  function sizeRow(ch, lin, speciesDesc) {
    if (!lin) return traitLine("Size", speciesDesc);   // species-level flavor before a lineage is picked
    var opts = R.lineageSize[lin.key] || ["Medium"];
    var current = effectiveSize(ch);
    var kids = [el("span.chip", { text: "Size" })];
    if (opts.length === 1) {
      kids.push(solidChip(opts[0], "var(--accent)"));
    } else {
      kids.push(el("span", { style: { fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text3)" }, text: "choose one:" }));
      opts.forEach(function (o) { kids.push(pickChip(o, "var(--accent)", current === o, function () { store.update(function (c) { c.size = o; }); })); });
    }
    return el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "8px" } }, kids);
  }

  /* ---------- STEP 4: BACKGROUND ---------- */
  function stepBackground(ch) {
    var bg = eng.getBackground(ch.background);
    var blocks = [EN.ui.sectionTitle("Choose a Background")];
    blocks.push(el("div.card-grid", null, (EN.backgrounds || []).map(function (b) {
      return el("div.opt-card" + (ch.background === b.key ? ".sel" : ""), {
        onclick: function () {
          store.update(function (c) { if (c.background !== b.key) { c.background = b.key; c.backgroundSkillChoice = null; c.backgroundProfChoices = []; } });
          if (eng.duplicateGrants(store.active()).any) toast("⚠ Duplicate Background/Class grant; second source discarded.");
        }
      }, [
        el("span.check", { text: "◉" }), el("h4", { text: b.name }),
        el("div.sub", { text: "Skills: " + (b.skills && b.skills.granted || []).join(", ") }),
        el("p", { text: b.blurb || "" })
      ]);
    })));

    if (bg) {
      blocks.push(el("div", { style: { height: "18px" } }));
      blocks.push(EN.ui.panel(bg.name, "BACKGROUND DOSSIER", [
        el("label.fl", { text: "Skills & Proficiencies" }),
        el("p.help", { style: { margin: "0 0 6px" }, text: "Dashed chips are background options; click one to lock in your pick." }),
        bgSkillChipRow(ch, bg),
        (bg.proficiencies || []).length ? el("div", null, bg.proficiencies.map(function (p, idx) { return bgProfChipRow(ch, p, idx); })) : null,
        bg.contacts ? infoBlock("Contacts", bg.contacts) : null,
        bg.personalItem ? infoBlock("Personal Item", bg.personalItem) : null,
        (bg.hooks || []).length ? el("div", { style: { marginTop: "10px" } }, [el("label.fl", { text: "Backstory Hooks" })].concat(
          bg.hooks.map(function (h) { return el("p.help", { text: h }); }))) : null
      ]));
      blocks.push(duplicateWarningBox(ch));
    }
    return el("div", null, blocks);
  }
  function infoBlock(label, text) {
    return el("div", { style: { marginTop: "10px" } }, [el("label.fl", { text: label }), el("p", { style: { color: "var(--text2)", fontSize: "14px" }, text: text })]);
  }

  /* ---- Background dossier chip rows (mirrors the class Starting Proficiencies) ---- */
  var GEAR_CHIP_COLORS = { weapons: "var(--ember)", armor: "var(--text2)", tools: "var(--flow)", vehicles: "var(--success)" };
  function gearBucketOf(name) {
    var low = String(name).toLowerCase();
    var buckets = ["weapons", "armor", "tools", "vehicles"];
    for (var i = 0; i < buckets.length; i++) {
      var list = R.gear[buckets[i]] || [];
      for (var j = 0; j < list.length; j++) { if (low.indexOf(list[j].toLowerCase()) !== -1) return buckets[i]; }
    }
    return null;
  }
  function rowLabel(text) {
    return el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text3)", minWidth: "62px", flex: "0 0 auto" }, text: text });
  }
  function solidChip(text, color) {
    return el("span.chip", { style: { fontSize: "10.5px", color: color, borderColor: color }, text: text });
  }
  function pickChip(text, color, on, onPick) {
    return el("span.chip", {
      title: on ? "Selected" : "Click to select " + text,
      style: { fontSize: "10.5px", color: color, borderColor: color, cursor: "pointer",
               borderStyle: on ? "solid" : "dashed", opacity: on ? 1 : .55,
               boxShadow: on ? "0 0 9px " + color : "none" },
      onclick: onPick
    }, (on ? "✓ " : "") + text);
  }
  function bgSkillChipRow(ch, bg) {
    var kids = [rowLabel("Skills")];
    ((bg.skills && bg.skills.granted) || []).forEach(function (n) { kids.push(solidChip(n, "var(--accent)")); });
    if (bg.skills && bg.skills.choose) {
      kids.push(el("span", { style: { fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text3)" }, text: "choose one:" }));
      bg.skills.choose.options.forEach(function (opt) {
        var k = skillKey(opt) || opt;
        kids.push(pickChip(opt, "var(--accent)", ch.backgroundSkillChoice === k,
          function () { store.update(function (c) { c.backgroundSkillChoice = k; }); }));
      });
    }
    return el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginBottom: "6px" } }, kids);
  }
  // One background proficiency line, e.g. "Tools: Choose one (Systems Tools, Investigation Tools)"
  // or a fixed grant like "Medical Tools". Options may span buckets (weapon/vehicle mixes).
  function bgProfChipRow(ch, line, idx) {
    var label = /:/.test(line) ? line.split(":")[0].trim() : (gearBucketOf(line) || "Gear");
    var kids = [rowLabel(label)];
    if (/choose/i.test(line)) {
      var inside = (line.match(/\(([^)]*)\)/) || [])[1] || "";
      var opts = inside.split(/,|\bor\b/).map(function (x) { return x.trim(); }).filter(Boolean);
      kids.push(el("span", { style: { fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text3)" }, text: "choose one:" }));
      opts.forEach(function (o) {
        var color = GEAR_CHIP_COLORS[gearBucketOf(o)] || "var(--text2)";
        kids.push(pickChip(o, color, ((ch.backgroundProfChoices || [])[idx]) === o,
          function () { store.update(function (c) { c.backgroundProfChoices = c.backgroundProfChoices || []; c.backgroundProfChoices[idx] = o; }); }));
      });
    } else {
      var content = /:/.test(line) ? line.split(":").slice(1).join(":").trim() : line;
      content.split(",").map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (n) {
        kids.push(solidChip(n, GEAR_CHIP_COLORS[gearBucketOf(n)] || "var(--text2)"));
      });
    }
    return el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginBottom: "6px" } }, kids);
  }

  // Warning box when Background and Class grant the same skill/proficiency.
  // Proficiency never stacks; the second source is simply discarded.
  function duplicateWarningBox(ch) {
    var dups = eng.duplicateGrants(ch);
    if (!dups.any) return null;
    var names = dups.skills.map(function (k) { return R.skillByKey[k] ? R.skillByKey[k].name : k; }).concat(dups.gear);
    return el("div.muted-box", { style: { borderColor: "var(--warn)", color: "var(--warn)", textAlign: "left", margin: "14px 0 0" },
      html: "⚠ <b>DUPLICATE GRANTS:</b> your Background and Class both grant <b>" + names.join(", ") +
        "</b>. You can keep this combination, but you only benefit once from a Proficiency; two sources don't stack or advance it to Expertise; the second source is simply discarded." });
  }

  // Dismissible warning box (Dossier): ACKNOWLEDGE hides it until its content
  // changes (the dismiss key is derived from what's being warned about).
  function dismissibleWarn(id, key, htmlText) {
    if (_dismissed[id] === key) return null;
    return el("div.muted-box", { style: { borderColor: "var(--warn)", color: "var(--warn)", textAlign: "left", margin: "14px 0 0" } }, [
      el("div", { html: htmlText }),
      el("div", { style: { marginTop: "8px", textAlign: "right" } }, [
        el("button.btn.sm", { style: { color: "var(--warn)", borderColor: "var(--warn)" },
          onclick: function () { _dismissed[id] = key; EN.app.render(); } }, "✓ ACKNOWLEDGE")
      ])
    ]);
  }

  // Combined Skills & Proficiencies summary (Background + Class grants/picks +
  // Advance-tab Training Point purchases), rendered as tiered chips.
  function skillProfSummary(ch, d) {
    var src = eng.grantSourceMap(ch);
    var dups = eng.duplicateGrants(ch);
    function srcTitle(sources, viaTP) {
      var parts = (sources || []).filter(function (s, i, a) { return a.indexOf(s) === i; });
      if (viaTP) parts.push("Training Points");
      return parts.length ? "Source: " + parts.join(" + ") : "Training Points";
    }
    // skills
    var skillChips = d.skills.filter(function (s) { return s.tier !== "untrained"; }).map(function (s) {
      var dup = dups.skills.indexOf(s.key) !== -1;
      var viaTP = R.profOrder.indexOf(s.storedTier || "untrained") > R.profOrder.indexOf(eng.skillFloorTier(ch, s.key));
      var c = el("span.chip", { title: srcTitle(src.skills[s.key], viaTP) + (dup ? ", duplicate grant, second source discarded" : ""),
        style: { fontSize: "10.5px", color: "var(--accent)", borderColor: "var(--accent)" } },
        (dup ? "⚠ " : "") + s.name + " · " + TIER_LABEL[s.tier]);
      return c;
    });
    // gear buckets
    function gearChips(bucket, color) {
      return (R.gear[bucket] || []).map(function (cat) {
        var tier = eng.effectiveGearTier(ch, bucket, cat);
        if (tier === "untrained") return null;
        var dup = dups.gear.indexOf(cat) !== -1;
        var viaTP = R.profOrder.indexOf(eng.gearFloorTier(ch, bucket, cat)) < R.profOrder.indexOf(tier) || !src.gear[bucket + "|" + cat];
        return el("span.chip", { title: srcTitle(src.gear[bucket + "|" + cat], viaTP) + (dup ? ", duplicate grant, second source discarded" : ""),
          style: { fontSize: "10.5px", color: color, borderColor: color } },
          (dup ? "⚠ " : "") + cat + " · " + TIER_LABEL[tier]);
      }).filter(Boolean);
    }
    function rowIf(label, chips) {
      if (!chips || !chips.length) return null;
      return el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginBottom: "6px" } }, [rowLabel(label)].concat(chips));
    }
    // saves (class Save Focus)
    var saveChips = R.attributes.filter(function (a) { return d.saves[a.key].focus; }).map(function (a) {
      return el("span.chip", { title: "Saving Throw Focus · d20 + mod + Caliber", style: { fontSize: "10.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, a.name);
    });
    // focuses & specializations from the Advance tab
    var focusChips = (ch.skillFocuses || []).map(function (f) {
      var sk = R.skillByKey[f.skill];
      return el("span.chip", { title: "Skill Focus (Training Points)", style: { fontSize: "10.5px", color: "var(--accent)", borderColor: "var(--accent)", borderStyle: "dashed" } }, (sk ? sk.name : f.skill) + (f.aspect ? " (" + f.aspect + ")" : ""));
    });
    var specChips = (ch.specializations || []).map(function (f) {
      var sk = R.skillByKey[f.skill];
      return el("span.chip", { title: "Specialization (Training Points)", style: { fontSize: "10.5px", color: "var(--flow)", borderColor: "var(--flow)", borderStyle: "dashed" } }, (sk ? sk.name : f.skill) + (f.aspect ? " (" + f.aspect + ")" : ""));
    });
    var rows = [
      rowIf("Skills", skillChips),
      rowIf("Weapons", gearChips("weapons", "var(--ember)")),
      rowIf("Armor", gearChips("armor", "var(--text2)")),
      rowIf("Tools", gearChips("tools", "var(--flow)")),
      rowIf("Vehicles", gearChips("vehicles", "var(--success)")),
      rowIf("Saves", saveChips),
      rowIf("Focus", focusChips),
      rowIf("Spec", specChips)
    ].filter(Boolean);
    if (!rows.length) rows = [el("p.help", { style: { margin: 0 }, text: "No skills or proficiencies yet; pick a Background and Class, then spend Training Points on the Advance tab." })];
    // unselected "choose one" options still waiting on the Background / Class tabs
    var pending = eng.pendingChoices(ch);
    var pendingBox = null;
    if (pending.length) {
      var bySource = {};
      pending.forEach(function (p) { (bySource[p.source] = bySource[p.source] || []).push(p.what); });
      var parts = Object.keys(bySource).map(function (s) { return "<b>" + s + " tab</b>: " + bySource[s].join(", "); });
      var pendKey = pending.map(function (p) { return p.source + ":" + p.what; }).join("|");
      pendingBox = dismissibleWarn("dossier-pending", pendKey,
        "⚠ <b>UNSELECTED OPTIONS</b>; you still have picks waiting. " + parts.join(" &nbsp;·&nbsp; ") + ". Head back to those tabs and click the dashed chips to lock them in.");
    }
    // duplicate-grant warning (acknowledgeable; the ⚠ chips above always remain)
    var dupBox = null;
    if (dups.any) {
      var dupNames = dups.skills.map(function (k) { return R.skillByKey[k] ? R.skillByKey[k].name : k; }).concat(dups.gear);
      dupBox = dismissibleWarn("dossier-dups", dupNames.join("|"),
        "⚠ <b>DUPLICATE GRANTS:</b> your Background and Class both grant <b>" + dupNames.join(", ") +
        "</b>. You can keep this combination, but you only benefit once from a Proficiency; two sources don't stack or advance it to Expertise; the second source is simply discarded.");
    }
    return EN.ui.panel("Skills & Proficiencies", "COMBINED · BACKGROUND + CLASS + ADVANCE", [
      el("p.help", { style: { margin: "0 0 8px" }, text: "Everything granted or purchased, at its effective tier. Hover a chip for its source. ⚠ marks duplicate Background/Class grants; the second source is discarded." })
    ].concat(rows).concat([pendingBox, dupBox]), { corners: true });
  }

  // Normalize attributePriorities (data is either ["Tech","Wits"] or
  // ["1. Agility (Primary): long description…", …]) into short labels + notes.
  function priorityParts(cls) {
    var entries = (cls && cls.attributePriorities) || [];
    var short = [], notes = [];
    entries.forEach(function (e) {
      var s = String(e).replace(/^\s*\d+\.\s*/, "");          // drop "1. "
      var label = s.split(":")[0].replace(/\s*\([^)]*\)\s*/g, "").trim();  // "Agility (Primary)" -> "Agility"
      if (label) short.push(label);
      if (/:/.test(s)) notes.push(s.trim());                  // descriptive entries become notes
    });
    // clean-array classes keep their separate notes field, if present
    if (!notes.length && cls && cls.attributePriorityNotes) notes = cls.attributePriorityNotes.slice();
    return { short: short, notes: notes };
  }

  /* ---------- STEP 5: CLASS ---------- */
  function stepClass(ch, d) {
    var clsKeys = ["codebreaker", "fury", "hustler", "operator", "scoundrel", "shaper", "stitcher"];
    var cls = eng.getClass(ch.class);
    var blocks = [EN.ui.sectionTitle("Choose a Class")];
    blocks.push(el("div.card-grid", null, clsKeys.map(function (k) {
      var c = eng.getClass(k); if (!c) return null;
      return el("div.opt-card" + (ch.class === k ? ".sel" : ""), {
        onclick: function () {
          store.update(function (cc) { if (cc.class !== k) { cc.class = k; cc.subclass = null; cc.classSkillChoices = []; cc.classGearChoices = { weapons: [], armor: [], tools: [], vehicles: [] }; } });
          if (eng.duplicateGrants(store.active()).any) toast("⚠ Duplicate Background/Class grant; second source discarded.");
        }
      }, [
        el("span.check", { text: "◉" }),
        el("h4", { text: c.name.replace(/^The\s+/, "") }),
        el("div.sub", { text: (c.resource ? c.resource.name + " · " : "") + "d" + (R.classVitality[k] ? R.classVitality[k].die : "?") + " VIT" }),
        el("p", { text: (c.tagline || "").slice(0, 150) + ((c.tagline || "").length > 150 ? "…" : "") })
      ]);
    })));

    if (cls) {
      var sub = eng.getSubclass(cls, ch.subclass);
      blocks.push(el("div", { style: { height: "18px" } }));

      // core traits panel
      var corePb = [];
      var prio = priorityParts(cls);
      corePb.push(el("div.row.wrap", { style: { gap: "8px", marginBottom: "10px" } }, [
        el("span.chip.on", { text: "VIT " + (R.classVitality[ch.class].start) + " + Body" }),
        el("span.chip", { text: "RES d" + R.classVitality[ch.class].resilience }),
        prio.short.length ? el("span.chip", { text: "PRIORITY: " + prio.short.join(" › ") }) : null,
        cls.saveFocus ? el("span.chip.flow", { text: "SAVE FOCUS: " + cls.saveFocus }) : null
      ]));
      if (prio.notes.length) {
        corePb.push(el("div", { style: { marginBottom: "6px" } }, [el("label.fl", { text: "Attribute Priorities" })].concat(
          prio.notes.map(function (n) { return el("p.help", { text: n }); }))));
      }
      if (cls.resource && ch.class !== "shaper") {
        corePb.push(feature(cls.resource.name + " (Resource)", (cls.resource.maxFormula ? "Max Pool = " + cls.resource.maxFormula + "\n\n" : "") + (cls.resource.fuels || ""), "class", "Pool " + (d.resource ? d.resource.max : "")));
        var gp = resourcePicker(ch); if (gp) corePb.push(gp);
      }
      if (ch.class === "shaper" && d.flow) {
        corePb.push(feature("Flow Points (Reservoir)", "Max Flow = (Caliber × 3) + " + d.flow.attributeName + " Modifier = " + d.flow.max + "\nFlow Save DC = 8 + " + d.flow.attributeName + " Mod + Caliber = " + d.flow.dc, "flow", "Flow " + d.flow.max));
      }
      // starting proficiencies, color-coded chip rows
      var sp = cls.startingProficiencies || {};
      corePb.push(el("div", { style: { marginTop: "6px" } }, [
        el("label.fl", { text: "Starting Proficiencies" }),
        el("p.help", { style: { margin: "0 0 6px" }, text: "Dashed chips are class options; click one to lock in your pick." }),
        profChipRow("Skills", sp.skills, "var(--accent)", { ch: ch, bucket: "skills" }),
        profChipRow("Weapons", sp.weapons, "var(--ember)", { ch: ch, bucket: "weapons" }),
        profChipRow("Armor", (sp.armor || []).concat(sp.shields || []), "var(--text2)", { ch: ch, bucket: "armor" }),
        profChipRow("Tools", sp.tools, "var(--flow)", { ch: ch, bucket: "tools" }),
        profChipRow("Saves", sp.saves, "var(--gold)")
      ]));
      blocks.push(EN.ui.panel(cls.name + " · Core Traits", "CLASS.SYS", corePb, { corners: true }));
      blocks.push(duplicateWarningBox(ch));

      // subclass
      if ((cls.subclasses || []).length) {
        blocks.push(el("div", { style: { height: "16px" } }));
        blocks.push(EN.ui.sectionTitle("Subclass"));
        blocks.push(el("div.card-grid", null, cls.subclasses.map(function (s) {
          return el("div.opt-card" + (ch.subclass === s.key ? ".sel" : ""), {
            onclick: function () { store.update(function (c) { c.subclass = s.key; }); }
          }, [el("span.check", { text: "◉" }), el("h4", { text: s.name }), el("p", { text: (s.description || "").slice(0, 180) })]);
        })));
      }

      // class skill choices
      // (class skill/tool choices are picked directly on the Starting Proficiencies chips above)

      // full class progression, all 10 levels as collapsible boxes (collapsed by default)
      blocks.push(el("div", { style: { height: "16px" } }));
      blocks.push(EN.ui.sectionTitle("Class Progression · Level " + ch.level + " / 10"));
      blocks.push(el("p.help", { style: { marginBottom: "10px" }, text: "Click a level to expand its features. Base class features are cyan; subclass features are purple. Set your level on the Advance tab." }));
      for (var L = 1; L <= R.maxLevel; L++) {
        (function (L) {
          var id = "clsprog-" + L;
          var collapsed = isCollapsed(id);
          var active = L <= ch.level;
          var clsFeats = (cls.featuresByLevel && cls.featuresByLevel[String(L)]) || [];
          var subFeats = sub ? (sub.features || []).filter(function (x) { return (x.level || 1) === L; }) : [];
          var featChips = clsFeats.map(function (f) {
            return el("span.chip", { style: { fontSize: "10px", color: "var(--accent)", borderColor: "var(--accent-dim)", opacity: active ? 1 : .7 }, text: f.name });
          }).concat(subFeats.map(function (f) {
            return el("span.chip", { style: { fontSize: "10px", color: "var(--flow)", borderColor: "var(--flow)", opacity: active ? 1 : .7 }, text: f.name });
          }));
          var head = el("div.panel-h.clickable", { style: { flexWrap: "wrap", rowGap: "4px" }, onclick: function () { toggleCollapse(id); } }, [
            el("span.collapse-caret", { text: collapsed ? "▸" : "▾" }),
            el("h3", { style: { color: active ? "var(--text)" : "var(--text3)" }, text: "Level " + L })
          ].concat(featChips, [
            R.trainingPointLevels[L] ? el("span.chip", { style: { fontSize: "10px", color: "var(--warn)", borderColor: "var(--warn)" }, text: "+" + R.trainingPointLevels[L] + " Training Points" }) : null,
            el("span.attn-spacer"),
            L === ch.level ? el("span.chip.on", { text: "● CURRENT" }) : (active ? null : el("span.chip", { text: "LOCKED" }))
          ]));
          var bodyKids = [];
          if (!clsFeats.length && !subFeats.length) bodyKids.push(el("p.help", { style: { margin: 0 }, text: "No new features at this level." }));
          clsFeats.forEach(function (f) {
            if (cls.resource && f.name === cls.resource.name && (cls.resource.abilities || []).length) bodyKids.push(resourceFeatureView(f, cls.resource, !active));
            else bodyKids.push(progFeature(f, false, null, !active));
          });
          subFeats.forEach(function (f) { bodyKids.push(progFeature(f, true, sub.name, !active)); });
          blocks.push(el("div.panel", { style: { marginBottom: "10px", opacity: active ? 1 : .72 } }, [
            head,
            el("div.panel-b", collapsed ? { style: { display: "none" } } : null, bodyKids)
          ]));
        })(L);
      }
    }
    return el("div", null, blocks);
  }
  // Starting-proficiency chip row: dim category label + color-coded chips.
  // "choose one (A, B, or C)" entries render their options as clickable dashed
  // chips; the pick is stored (skills -> classSkillChoices, gear -> classGearChoices)
  // and feeds the granted-proficiency floor.
  function profChipRow(label, arr, color, pick) {
    if (!arr || !arr.length) return null;
    var ch = pick && pick.ch, bucket = pick && pick.bucket;
    var kids = [el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text3)", minWidth: "62px", flex: "0 0 auto" }, text: label })];
    var chooseIdx = -1;
    function isPicked(idx, option) {
      if (!ch) return false;
      if (bucket === "skills") return (ch.classSkillChoices || [])[idx] === skillKey(option);
      return ((ch.classGearChoices && ch.classGearChoices[bucket]) || [])[idx] === option;
    }
    function pickOption(idx, option) {
      store.update(function (c) {
        if (bucket === "skills") { c.classSkillChoices = c.classSkillChoices || []; c.classSkillChoices[idx] = skillKey(option); }
        else {
          c.classGearChoices = c.classGearChoices || {};
          var a = c.classGearChoices[bucket] = c.classGearChoices[bucket] || [];
          a[idx] = option;
        }
      });
    }
    arr.forEach(function (entry) {
      if (/choose/i.test(entry)) {
        chooseIdx++;
        var idx = chooseIdx;
        var inside = (entry.match(/\(([^)]*)\)/) || [])[1] || "";
        var opts = inside.split(/,|\bor\b/).map(function (x) { return x.trim(); }).filter(Boolean);
        kids.push(el("span", { style: { fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text3)" }, text: "choose one:" }));
        opts.forEach(function (o) {
          var on = isPicked(idx, o);
          kids.push(el("span.chip", {
            title: ch ? (on ? "Selected" : "Click to select " + o) : null,
            style: { fontSize: "10.5px", color: color, borderColor: color, cursor: ch ? "pointer" : "default",
                     borderStyle: on ? "solid" : "dashed", opacity: on ? 1 : .55,
                     boxShadow: on ? "0 0 9px " + color : "none" },
            onclick: ch ? function () { pickOption(idx, o); } : null
          }, (on ? "✓ " : "") + o));
        });
      } else {
        kids.push(el("span.chip", { style: { fontSize: "10.5px", color: color, borderColor: color }, text: entry }));
      }
    });
    return el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginBottom: "6px" } }, kids);
  }

  // Resource ability picker (Scoundrel Gambits, Fury Overdrive Maneuvers, Hustler Leverage,
  // Stitcher Triage Protocols): toggle chips to choose the abilities you know, capped to the
  // count unlocked by level. Classes that know their whole list (Codebreaker, Operator) show
  // every ability as a locked-on chip instead of a capped picker. Each chip shows its action type.
  function resourcePicker(ch) {
    var all = eng.resourceAbilities(ch);
    if (!all.length) return null;
    var res = eng.getClass(ch.class).resource;
    var noun = res.abilityNoun || "Ability", nounPl = res.abilityNounPlural || (noun + "s");
    function chip(g, on, dim, onclick) {
      return el("span.chip", {
        title: (g.action ? g.action + " · " : "") + g.text,
        style: { fontSize: "10.5px", color: "var(--accent)", borderColor: "var(--accent)",
                 cursor: onclick ? (dim ? "not-allowed" : "pointer") : "default", borderStyle: on ? "solid" : "dashed",
                 opacity: on ? 1 : (dim ? .3 : .6), boxShadow: on ? "0 0 9px var(--accent)" : "none" },
        onclick: onclick
      }, [
        el("span", { text: (on ? "✓ " : "") + g.name }),
        g.action ? el("span", { style: { color: "var(--text3)", marginLeft: "5px", fontSize: "9px" }, text: g.action.replace(/ Action$/, "") }) : null
      ]);
    }
    // knows-all classes (Codebreaker, Operator) have no choice to make, so they get no picker
    // here; their full ability list already appears in the resource feature and Class Progression.
    if (res.learn && res.learn.knowsAll) return null;
    // pick classes: capped toggle chips
    var allowed = eng.resourcePicksAllowed(ch);
    var chosen = ch.gambits || [];
    var hint = ((res.learn && res.learn.picks) || []).map(function (p, i) { return (i ? "+" : "") + p.count + " at L" + p.level; }).join(", ");
    var head = el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline", margin: "10px 0 6px" } }, [
      el("label.fl", { text: nounPl + " Known" }),
      el("span.chip" + (chosen.length >= allowed ? ".on" : ""), { style: { fontSize: "10px" }, text: chosen.length + " / " + allowed + " chosen" }),
      el("span", { style: { fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text3)" }, text: hint + "; click to learn" })
    ]);
    var chipRow = el("div.row.wrap", { style: { gap: "6px" } });
    all.forEach(function (g) {
      var on = chosen.indexOf(g.name) !== -1;
      var full = !on && chosen.length >= allowed;
      chipRow.appendChild(chip(g, on, full, function () {
        if (full) { toast("You know " + allowed + " " + nounPl + " at Level " + (ch.level || 1) + "."); return; }
        store.update(function (c) {
          c.gambits = c.gambits || [];
          var i = c.gambits.indexOf(g.name);
          if (i >= 0) c.gambits.splice(i, 1); else c.gambits.push(g.name);
        });
      }));
    });
    return el("div", null, [head, chipRow]);
  }

  /* ---------- STEP 6: SKILLS (Training Point economy) ---------- */
  var TP = eng.tp;
  function stepInto(tier) { return TP.STEP_COST[tier] || 0; }
  function tierLevelReq(tier) { return TP.TIER_LEVEL_REQ[tier] || 1; }

  function raiseSkill(ch, key) {
    var b = eng.trainingBudget(ch);
    var eff = eng.effectiveSkillTier(ch, key);
    var idx = R.profOrder.indexOf(eff);
    if (idx >= R.profOrder.length - 1) { toast("Already at Mastery."); return; }
    var next = R.profOrder[idx + 1];
    if (ch.level < tierLevelReq(next)) { toast(R.profTiers[next].name + " requires level " + tierLevelReq(next) + "+."); return; }
    var cost = stepInto(next);
    if (b.remaining < cost) { toast("Need " + cost + " Training Points, " + b.remaining + " left."); return; }
    store.update(function (c) { c.proficiencies.skills = c.proficiencies.skills || {}; c.proficiencies.skills[key] = next; });
  }
  function lowerSkill(ch, key) {
    var floor = eng.skillFloorTier(ch, key);
    var eff = eng.effectiveSkillTier(ch, key);
    if (R.profOrder.indexOf(eff) <= R.profOrder.indexOf(floor)) {
      toast(floor === "proficient" ? "Proficiency is granted by your background/class; can't refund." : "Already Untrained."); return;
    }
    var prev = R.profOrder[R.profOrder.indexOf(eff) - 1];
    store.update(function (c) {
      c.proficiencies.skills = c.proficiencies.skills || {};
      if (prev === "untrained" && eng.skillFloorTier(c, key) !== "proficient") delete c.proficiencies.skills[key];
      else c.proficiencies.skills[key] = prev;
      var newIdx = Math.max(R.profOrder.indexOf(prev), R.profOrder.indexOf(floor));
      if (newIdx < R.profOrder.indexOf("expertise")) c.specializations = (c.specializations || []).filter(function (x) { return x.skill !== key; });
      if (newIdx < R.profOrder.indexOf("proficient")) c.skillFocuses = (c.skillFocuses || []).filter(function (x) { return x.skill !== key; });
    });
  }
  function toggleFocus(ch, key) {
    var has = (ch.skillFocuses || []).some(function (x) { return x.skill === key; });
    if (has) { store.update(function (c) { c.skillFocuses = (c.skillFocuses || []).filter(function (x) { return x.skill !== key; }); }); return; }
    if (ch.level < TP.FOCUS_LEVEL_REQ) { toast("Skill Focus requires level " + TP.FOCUS_LEVEL_REQ + "+."); return; }
    if (R.profOrder.indexOf(eng.effectiveSkillTier(ch, key)) < R.profOrder.indexOf("proficient")) { toast("Be Proficient in the skill first."); return; }
    if (eng.trainingBudget(ch).remaining < TP.FOCUS_COST) { toast("Need " + TP.FOCUS_COST + " Training Point."); return; }
    store.update(function (c) { c.skillFocuses = c.skillFocuses || []; c.skillFocuses.push({ skill: key, aspect: "" }); });
  }
  function toggleSpec(ch, key) {
    var has = (ch.specializations || []).some(function (x) { return x.skill === key; });
    if (has) { store.update(function (c) { c.specializations = (c.specializations || []).filter(function (x) { return x.skill !== key; }); }); return; }
    if (ch.level < TP.SPEC_LEVEL_REQ) { toast("Specialization requires level " + TP.SPEC_LEVEL_REQ + "+."); return; }
    if (R.profOrder.indexOf(eng.effectiveSkillTier(ch, key)) < R.profOrder.indexOf("expertise")) { toast("Need Expertise in the skill first."); return; }
    if (eng.trainingBudget(ch).remaining < TP.SPEC_COST) { toast("Need " + TP.SPEC_COST + " Training Point."); return; }
    store.update(function (c) { c.specializations = c.specializations || []; c.specializations.push({ skill: key, aspect: "" }); });
  }
  function aspectInput(ch, listName, key) {
    var obj = (ch[listName] || []).find(function (x) { return x.skill === key; });
    return el("input", { type: "text", value: (obj && obj.aspect) || "", placeholder: "aspect: " + (R.focusExamples[key] || "…"),
      style: { width: "200px", padding: "3px 8px", fontSize: "13px" },
      oninput: function (e) { store.update(function (c) { var o = (c[listName] || []).find(function (x) { return x.skill === key; }); if (o) o.aspect = e.target.value; }, { silent: true }); } });
  }

  // refund a skill down to a specific tier (used by the purchase log)
  function lowerSkillTo(ch, key, toTier) {
    store.update(function (c) {
      c.proficiencies.skills = c.proficiencies.skills || {};
      var floor = eng.skillFloorTier(c, key);
      if (toTier === "untrained" && floor !== "proficient") delete c.proficiencies.skills[key];
      else c.proficiencies.skills[key] = toTier;
      var newIdx = Math.max(R.profOrder.indexOf(toTier), R.profOrder.indexOf(floor));
      if (newIdx < R.profOrder.indexOf("expertise")) c.specializations = (c.specializations || []).filter(function (x) { return x.skill !== key; });
      if (newIdx < R.profOrder.indexOf("proficient")) c.skillFocuses = (c.skillFocuses || []).filter(function (x) { return x.skill !== key; });
    });
  }

  /* ---- Gear proficiencies (weapons / armor / tools / vehicles) ---------- */
  function gearUpgradable(bucket) { return R.gearUpgradable[bucket] !== false; }
  function ensureGear(c, bucket) { if (!c.proficiencies[bucket] || Array.isArray(c.proficiencies[bucket])) c.proficiencies[bucket] = {}; }
  function acquireGear(ch, bucket, cat) {
    if (eng.effectiveGearTier(ch, bucket, cat) !== "untrained") return;
    if (eng.trainingBudget(ch).remaining < 1) { toast("Need 1 Training Point."); return; }
    store.update(function (c) { ensureGear(c, bucket); c.proficiencies[bucket][cat] = "proficient"; });
  }
  function upgradeGear(ch, bucket, cat) {
    if (!gearUpgradable(bucket)) { toast("Armor proficiencies can't be upgraded to higher tiers."); return; }
    var idx = R.profOrder.indexOf(eng.effectiveGearTier(ch, bucket, cat));
    var next = R.profOrder[idx + 1];
    if (!next) { toast("Already at Mastery."); return; }
    if (ch.level < tierLevelReq(next)) { toast(TIER_LABEL[next] + " requires level " + tierLevelReq(next) + "+."); return; }
    var cost = stepInto(next);
    if (eng.trainingBudget(ch).remaining < cost) { toast("Need " + cost + " Training Points."); return; }
    store.update(function (c) { ensureGear(c, bucket); c.proficiencies[bucket][cat] = next; });
  }
  function refundGearTo(ch, bucket, cat, toTier) {
    store.update(function (c) {
      ensureGear(c, bucket);
      if (toTier === "untrained" && eng.gearFloorTier(c, bucket, cat) !== "proficient") delete c.proficiencies[bucket][cat];
      else c.proficiencies[bucket][cat] = toTier;
    });
  }
  function refundGear(ch, bucket, cat) {
    var floor = eng.gearFloorTier(ch, bucket, cat), eff = eng.effectiveGearTier(ch, bucket, cat);
    if (R.profOrder.indexOf(eff) <= R.profOrder.indexOf(floor)) { toast(floor === "proficient" ? "Granted by class/background; can't refund." : "Untrained."); return; }
    refundGearTo(ch, bucket, cat, R.profOrder[R.profOrder.indexOf(eff) - 1]);
  }

  function gearRow(ch, bucket, cat) {
    var floor = eng.gearFloorTier(ch, bucket, cat);
    var eff = eng.effectiveGearTier(ch, bucket, cat);
    var idx = R.profOrder.indexOf(eff);
    var aboveFloor = idx > R.profOrder.indexOf(floor);
    var granted = floor === "proficient";
    var budget = eng.trainingBudget(ch);
    var right = [];
    if (aboveFloor) right.push(el("button.btn.sm.ghost", { title: "Refund one tier", style: { padding: "3px 8px", color: "var(--text3)" }, onclick: function () { refundGear(ch, bucket, cat); } }, "↩"));
    right.push(el("span", { style: { minWidth: "76px", textAlign: "right", fontFamily: "var(--disp)", letterSpacing: ".04em", fontWeight: eff === "mastery" ? "700" : "500", color: TIER_COLOR[eff] }, text: TIER_LABEL[eff] }));
    if (eff === "untrained") {
      var ok = budget.remaining >= 1;
      right.push(el("button.btn.sm" + (ok ? ".primary" : ""), { disabled: !ok, style: { minWidth: "138px" }, title: ok ? "Spend 1 TP" : "Need 1 TP", onclick: function () { acquireGear(ch, bucket, cat); } }, "ACQUIRE (1 TP)"));
    } else if (!gearUpgradable(bucket)) {
      right.push(el("span.help", { style: { margin: 0, minWidth: "138px", textAlign: "right" }, text: "- acquired -" }));
    } else {
      var next = R.profOrder[idx + 1];
      if (next) {
        var cost = stepInto(next), req = tierLevelReq(next);
        var blocked = ch.level < req || budget.remaining < cost;
        var why = ch.level < req ? (TIER_LABEL[next] + " requires level " + req + "+") : (budget.remaining < cost ? ("Need " + cost + " TP") : ("Spend " + cost + " TP"));
        right.push(el("button.btn.sm" + (blocked ? "" : ".primary"), { disabled: blocked, title: why, style: { minWidth: "138px" }, onclick: function () { upgradeGear(ch, bucket, cat); } }, UP_VERB[next] + " (" + cost + " TP)"));
      } else right.push(el("span.help", { style: { margin: 0, minWidth: "138px", textAlign: "right" }, text: "Max tier reached" }));
    }
    return el("div.row", { style: { gap: "10px", alignItems: "center", padding: "7px 2px", borderBottom: "1px solid rgba(35,48,68,.5)" } }, [
      el("div", { style: { flex: 1, minWidth: "120px" } }, [el("span", { text: cat }), granted ? el("span.badge", { style: { marginLeft: "8px" }, title: "Granted free by class/background", text: "GRANTED" }) : null]),
      el("div.row", { style: { gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" } }, right)
    ]);
  }
  function gearSection(ch, bucket, title, note) {
    return [el("div.section-title", { style: { margin: "16px 0 2px" } }, [document.createTextNode(title), el("span.line")]),
      note ? el("p.help", { style: { marginBottom: "4px" }, text: note }) : null
    ].concat(R.gear[bucket].map(function (cat) { return gearRow(ch, bucket, cat); }));
  }

  // Derive a granular, refundable ledger of every current TP expenditure.
  function buildPurchaseLog(ch) {
    var out = [];
    R.skills.forEach(function (s) {
      var fIdx = R.profOrder.indexOf(eng.skillFloorTier(ch, s.key));
      var eIdx = R.profOrder.indexOf(eng.effectiveSkillTier(ch, s.key));
      for (var i = fIdx + 1; i <= eIdx; i++) {
        (function (t, below) { out.push({ label: s.name + " → " + TIER_LABEL[t], cost: stepInto(t), refund: function () { lowerSkillTo(ch, s.key, below); } }); })(R.profOrder[i], R.profOrder[i - 1]);
      }
    });
    (ch.skillFocuses || []).forEach(function (f) {
      var sk = R.skillByKey[f.skill];
      out.push({ label: (sk ? sk.name : f.skill) + " · Focus" + (f.aspect ? " (" + f.aspect + ")" : ""), cost: TP.FOCUS_COST, refund: function () { store.update(function (c) { c.skillFocuses = (c.skillFocuses || []).filter(function (x) { return x !== f; }); }); } });
    });
    (ch.specializations || []).forEach(function (sp) {
      var sk = R.skillByKey[sp.skill];
      out.push({ label: (sk ? sk.name : sp.skill) + " · Specialization" + (sp.aspect ? " (" + sp.aspect + ")" : ""), cost: TP.SPEC_COST, refund: function () { store.update(function (c) { c.specializations = (c.specializations || []).filter(function (x) { return x !== sp; }); }); } });
    });
    ["weapons", "armor", "tools", "vehicles"].forEach(function (bucket) {
      R.gear[bucket].forEach(function (cat) {
        var fIdx = R.profOrder.indexOf(eng.gearFloorTier(ch, bucket, cat));
        var eIdx = R.profOrder.indexOf(eng.effectiveGearTier(ch, bucket, cat));
        for (var i = fIdx + 1; i <= eIdx; i++) {
          (function (t, below) { out.push({ label: cat + " → " + TIER_LABEL[t], cost: stepInto(t), refund: function () { refundGearTo(ch, bucket, cat, below); } }); })(R.profOrder[i], R.profOrder[i - 1]);
        }
      });
    });
    return out;
  }
  function purchaseLogPanel(ch) {
    var entries = buildPurchaseLog(ch);
    var total = entries.reduce(function (a, e) { return a + e.cost; }, 0);
    var body;
    if (!entries.length) body = [el("p.help", { text: "No Training Point purchases yet. Acquire skills or gear above to populate the ledger." })];
    else body = entries.map(function (e) {
      return el("div.row", { style: { gap: "8px", alignItems: "center", padding: "5px 9px", marginBottom: "3px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: "3px" } }, [
        el("span", { style: { flex: 1, color: "var(--text2)", fontSize: "13.5px" }, text: e.label }),
        el("span.badge", { text: e.cost + " TP" }),
        el("button.btn.sm.danger", { title: "Refund this purchase", style: { padding: "2px 9px" }, onclick: e.refund }, "✕")
      ]);
    });
    return collapsiblePanel("purchaseLog", "Purchase Log", "LEDGER · " + total + " TP SPENT", body, { corners: true });
  }

  function skillRow(ch, s) {
    var floor = eng.skillFloorTier(ch, s.key);
    var effIdx = R.profOrder.indexOf(s.tier);
    var aboveFloor = effIdx > R.profOrder.indexOf(floor);
    var next = R.profOrder[effIdx + 1];
    var budget = eng.trainingBudget(ch);

    // right cluster: [refund] [tier label] [upgrade button | "Max tier reached"]
    var right = [];
    if (aboveFloor) right.push(el("button.btn.sm.ghost", { title: "Refund one tier", style: { padding: "3px 8px", color: "var(--text3)" }, onclick: function () { lowerSkill(ch, s.key); } }, "↩"));
    right.push(el("span", { style: { minWidth: "76px", textAlign: "right", fontFamily: "var(--disp)", letterSpacing: ".04em", fontWeight: s.tier === "mastery" ? "700" : "500", color: TIER_COLOR[s.tier] }, title: s.profBonus ? "d20 " + eng.fmtMod(s.total) + " · passive " + s.passive : "", text: TIER_LABEL[s.tier] }));
    if (next) {
      var cost = stepInto(next), req = tierLevelReq(next);
      var blocked = ch.level < req || budget.remaining < cost;
      var why = ch.level < req ? (TIER_LABEL[next] + " requires level " + req + "+") : (budget.remaining < cost ? ("Need " + cost + " TP · " + budget.remaining + " left") : ("Spend " + cost + " TP"));
      right.push(el("button.btn.sm" + (blocked ? "" : ".primary"), { disabled: blocked, title: why, style: { minWidth: "138px" }, onclick: function () { raiseSkill(ch, s.key); } }, UP_VERB[next] + " (" + cost + " TP)"));
    } else {
      right.push(el("span.help", { style: { margin: 0, minWidth: "138px", textAlign: "right" }, text: "Max tier reached" }));
    }

    var head = el("div.row", { style: { gap: "10px", alignItems: "center" } }, [
      el("div", { style: { flex: 1, minWidth: "120px" } }, [
        el("span", { text: s.name }),
        el("span.att", { style: { marginLeft: "7px" }, text: "(" + s.attr + ")" }),
        s.granted ? el("span.badge", { style: { marginLeft: "8px" }, title: "Granted free by background/class", text: "GRANTED" }) : null
      ]),
      el("div.row", { style: { gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" } }, right)
    ]);

    // Focus / Specialization appear only once requirements are met
    var sub = [];
    if (effIdx >= R.profOrder.indexOf("proficient")) {
      sub.push(el("button.btn.sm" + (s.focus ? ".primary" : ""), { title: "Skill Focus · 1 TP · L3+ · grants Edge on focused checks", onclick: function () { toggleFocus(ch, s.key); } }, s.focus ? "✓ Focus" : "+ Focus · 1TP"));
      if (s.focus) sub.push(aspectInput(ch, "skillFocuses", s.key));
    }
    if (effIdx >= R.profOrder.indexOf("expertise")) {
      sub.push(el("button.btn.sm" + (s.specialization ? ".flow" : ""), { title: "Specialization · 1 TP · L6+ · expands crit range", onclick: function () { toggleSpec(ch, s.key); } }, s.specialization ? "✓ Spec" : "+ Spec · 1TP"));
      if (s.specialization) sub.push(aspectInput(ch, "specializations", s.key));
    }
    var subRow = sub.length ? el("div.row.wrap", { style: { gap: "8px", marginTop: "6px" } }, sub) : null;
    return el("div", { style: { padding: "8px 2px", borderBottom: "1px solid rgba(35,48,68,.5)" } }, [head, subRow]);
  }

  // Skills + gear + purchase log + versatile, as an array of blocks (merged
  // into the Advance step beneath Advancement Type).
  function skillsBlocks(ch, d) {
    var b = d.trainingPoints;
    var overspent = b.remaining < 0;
    var tpKey = "L" + d.level;
    return [
      collapsiblePanel("skillLoadout", "Skill Loadout", "PROFICIENCY MATRIX", [
        el("div.row.wrap", { style: { gap: "16px", alignItems: "center" } }, [
          EN.ui.stat("TRAINING PTS", b.remaining, "of " + b.total, false),
          el("div", { style: { flex: 1, minWidth: "220px" } }, [
            el("p.help", { style: { margin: 0, color: overspent ? "var(--danger)" : "var(--text3)" }, html:
              "<b>Acquire</b> 1TP · any &nbsp;|&nbsp; <b>Expert</b> 2TP · L6+ &nbsp;|&nbsp; <b>Mastery</b> 2TP · L10+ &nbsp;|&nbsp; <b>Focus</b> 1TP · L3+ &nbsp;|&nbsp; <b>Spec</b> 1TP · L6+" }),
            b.total === 0 ? el("p.help", { style: { color: "var(--warn)", margin: "4px 0 0" }, text: "No Training Points yet; your first 5 arrive at level 3." }) : null,
            overspent ? el("p.help", { style: { color: "var(--danger)", margin: "4px 0 0" }, text: "Over budget; refund some upgrades (↩)." }) : null
          ])
        ]),
        el("div.section-title", { style: { margin: "16px 0 2px" } }, [document.createTextNode("Skill Tiers"), el("span.line")]),
        el("p.help", { style: { marginBottom: "6px" }, text: "Background & class grants give a free Proficient floor (GRANTED). Focus & Specialization buttons appear once a skill qualifies." }),
        el("div", null, d.skills.map(function (s) { return skillRow(ch, s); }))
      ], { corners: true, attention: b.remaining > 0, dismissKey: tpKey, attentionTitle: "Unspent Training Points; click to dismiss" }),
      el("div", { style: { height: "14px" } }),
      collapsiblePanel("gearProficiencies", "Gear Proficiencies", "WEAPONS · ARMOR · TOOLS · VEHICLES", [].concat(
        [el("p.help", { text: "Acquire a category for 1 TP. Weapons, Tools, and Vehicles upgrade to Expert (L6+) and Mastery (L10+) for 2 TP each; Armor can be acquired but not upgraded." })],
        gearSection(ch, "weapons", "Weapon Proficiencies", null),
        gearSection(ch, "armor", "Armor Proficiencies", "Acquire only; cannot be raised to higher tiers."),
        gearSection(ch, "tools", "Tool Proficiencies", null),
        gearSection(ch, "vehicles", "Vehicle Proficiencies", null)
      ), { corners: true, attention: b.remaining > 0, dismissKey: tpKey, attentionTitle: "Unspent Training Points; click to dismiss" }),
      el("div", { style: { height: "14px" } }),
      purchaseLogPanel(ch),
      el("div", { style: { height: "14px" } }),
      collapsiblePanel("versatileSkills", "Versatile Skills", "DERIVED · NOT TRAINED DIRECTLY", [
        el("p.help", { text: "Insight, Performance, and Intimidation borrow the tier of whatever parent skill you lean on in the moment; you can't buy them with Training Points." }),
        el("div.row.wrap", { style: { marginTop: "8px" } }, R.versatileSkills.map(function (v) { return el("span.chip", { title: v.desc, text: v.name }); }))
      ], { corners: true })
    ];
  }
  var TIER_LABEL = { untrained: "Untrained", proficient: "Proficient", expertise: "Expert", mastery: "Mastery" };
  var UP_VERB = { proficient: "ACQUIRE", expertise: "→ EXPERT", mastery: "→ MASTERY" };
  var TIER_COLOR = { untrained: "var(--text3)", proficient: "var(--text)", expertise: "var(--accent)", mastery: "var(--gold)" };

  // Milestone tracker (shown in Milestone advancement mode)
  function milestoneTracker(ch) {
    var m = ch.milestones || { major: 0, minor: 0, notes: "" };
    function bump(field, delta) {
      store.update(function (c) {
        c.milestones = c.milestones || { major: 0, minor: 0, notes: "" };
        c.milestones[field] = Math.max(0, (c.milestones[field] || 0) + delta);
      });
    }
    function card(title, field, color, caption) {
      return el("div", { style: { flex: 1, minWidth: "220px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "12px 14px", textAlign: "center" } }, [
        el("div.k", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--text3)" }, text: title }),
        el("div.stepper", { style: { marginTop: "6px" } }, [
          el("button", { disabled: (m[field] || 0) <= 0, onclick: function () { bump(field, -1); } }, "−"),
          el("span", { style: { fontFamily: "var(--mono)", fontSize: "28px", minWidth: "44px", textAlign: "center", color: color, textShadow: "0 0 14px " + color }, text: String(m[field] || 0) }),
          el("button", { onclick: function () { bump(field, 1); } }, "+")
        ]),
        el("p.help", { style: { color: color, marginTop: "6px", opacity: .75 }, text: caption })
      ]);
    }
    return el("div", null, [
      el("p.help", { style: { marginTop: 0, marginBottom: "12px" }, html: "Standard pacing: level up after <b>2 Major Milestones</b>, or <b>1 Major + 2 Minor Milestones</b>. Level during downtime, after a Long Rest, or between story arcs." }),
      el("div.row.wrap", { style: { gap: "12px" } }, [
        card("Major Milestones", "major", "var(--accent)", "Major contract, vital asset secured, faction shift"),
        card("Minor Milestones", "minor", "var(--flow)", "Session goal, key lead, minor alliance")
      ]),
      el("div", { style: { marginTop: "12px" } }, [
        el("button.btn.sm", { onclick: function () { if (confirm("Reset milestone counters to 0? (Notes are preserved.)")) { store.update(function (c) { c.milestones = c.milestones || {}; c.milestones.major = 0; c.milestones.minor = 0; }); } } }, "RESET MILESTONES")
      ]),
      el("div", { style: { marginTop: "12px" } }, [
        el("label.fl", { text: "Milestone Notes (preserved on reset)" }),
        el("textarea", { placeholder: "Track what happened this arc…", text: (m.notes || ""),
          oninput: function (e) { store.update(function (c) { c.milestones = c.milestones || { major: 0, minor: 0, notes: "" }; c.milestones.notes = e.target.value; }, { silent: true }); } })
      ])
    ]);
  }

  /* ---------- STEP 7: ADVANCE (leveling) ---------- */
  function stepAdvance(ch, d) {
    var cls = eng.getClass(ch.class);
    var blocks = [];
    // level control
    blocks.push(EN.ui.panel("Advancement", "LVL " + d.level + " · CALIBER " + d.caliber, [
      el("div.row.wrap.between", null, [
        el("div.row", null, [
          el("button.btn.sm", { disabled: ch.level <= 1, onclick: function () { setLevel(ch, ch.level - 1); } }, "− LEVEL"),
          el("div.stat", { style: { minWidth: "80px" } }, [el("div.k", { text: "LEVEL" }), el("div.v", { text: ch.level })]),
          el("button.btn.sm", { disabled: ch.level >= R.maxLevel, onclick: function () { setLevel(ch, ch.level + 1); } }, "+ LEVEL")
        ]),
        el("div.row.wrap", null, [
          el("span.chip", { text: "TRAINING PTS " + d.trainingPoints.total }),
          el("span.chip" + (d.flow ? ".flow" : ".on"), { text: d.resource ? d.resource.name + " " + d.resource.max : (d.flow ? "FLOW " + d.flow.max : "") })
        ])
      ]),
      el("p.help", { style: { marginTop: "10px" }, text: "Milestone default: level after ~2 Major Milestones (or 1 Major + 2 Minor). +5 Training Points arrive at L3, L6, and L10. Update during downtime, never mid-firefight." })
    ], { corners: true }));

    // Advancement Type, mode toggle lives in the header (XP MODE / MILESTONE)
    blocks.push(el("div", { style: { height: "14px" } }));
    var advCollapsed = isCollapsed("advType");
    var modeToggle = el("div.row", { style: { gap: "4px" } }, [
      el("button.btn.sm" + (ch.useXp ? ".primary" : ""), { onclick: function (e) { e.stopPropagation(); store.update(function (c) { c.useXp = true; }); } }, "XP MODE"),
      el("button.btn.sm" + (!ch.useXp ? ".primary" : ""), { onclick: function (e) { e.stopPropagation(); store.update(function (c) { c.useXp = false; }); } }, "MILESTONE")
    ]);
    var advBody = ch.useXp
      ? el("div.row.wrap", { style: { gap: "12px", alignItems: "flex-end" } }, [
          el("div.field", { style: { margin: 0, minWidth: "160px" } }, [el("label.fl", { text: "Current XP" }),
            el("input", { type: "number", value: ch.xp || 0, oninput: function (e) { store.update(function (c) { c.xp = Number(e.target.value) || 0; }, { silent: true }); } })]),
          d.xpForNext != null ? el("span.help", { text: "Next level at " + d.xpForNext + " XP" }) : el("span.help", { text: "Max level." })
        ])
      : milestoneTracker(ch);
    var advPanel = el("div.panel", null, [
      el("div.panel-h.clickable", { onclick: function () { toggleCollapse("advType"); } }, [
        el("span.collapse-caret", { text: advCollapsed ? "▸" : "▾" }), el("h3", { text: "Advancement Type" }), el("span.attn-spacer"), modeToggle
      ]),
      el("div.panel-b", advCollapsed ? { style: { display: "none" } } : null, [advBody])
    ]);
    ["tl", "tr", "bl", "br"].forEach(function (c) { advPanel.appendChild(el("span.corner." + c)); });
    blocks.push(advPanel);

    // merged Skills & Proficiencies content (Skill Loadout, Gear, Purchase Log, Versatile)
    blocks.push(el("div", { style: { height: "14px" } }));
    skillsBlocks(ch, d).forEach(function (n) { blocks.push(n); });

    // Talents, awarded as Universal Upgrades at levels 2, 4, 6, and 8
    blocks.push(el("div", { style: { height: "14px" } }));
    blocks.push(EN.ui.sectionTitle("Universal Upgrade"));
    blocks.push(el("p.help", { html: "At <b>levels 2, 4, 6, and 8</b> you gain a <b>Universal Upgrade</b>. Choose <b>+2 Attributes</b> (one by 2, or two by 1, max 20), <b>Gain Talent</b>, or <b>Gain Evolution</b> (unlock an Additive Feature from your Lineage). At <b>Level 4</b>, the <b>Awakening Milestone</b> grants one Lineage Evolution for free, on top of your Universal Upgrade. At Level 6+ a slot may instead upgrade a Talent you already have. You may retrain one choice whenever you level." }));
    var uuLevels = [2, 4, 6, 8];
    var anyUU = false;
    uuLevels.forEach(function (L) {
      if (L > ch.level) return;
      anyUU = true;
      var cur = (ch.universalUpgrades || {})[L];
      var summary = cur ? (
        cur.type === "attr" ? attrUpgradeSummary(cur) :
        cur.type === "evolution" ? (cur.evolution || "Evolution, choose") :
        (cur.talent ? talentName(cur.talent) : "Talent, choose")
      ) : "Unspent";
      blocks.push(collapsibleEntry("uu-" + L, {
        title: "Level " + L + " · Universal Upgrade", summary: summary,
        attention: !cur, dismissKey: "L" + d.level, attentionTitle: "Unspent Universal Upgrade; click to dismiss",
        filled: !!cur, body: universalUpgradePicker(ch, L)
      }));
      // Level 4 Awakening Milestone, a free, evolution-only bonus slot
      if (L === 4) {
        var awk = ch.awakeningEvolution;
        blocks.push(collapsibleEntry("uu-awakening", {
          title: "Level 4 · Awakening Milestone", summary: awk || "Free Evolution, choose",
          attention: !awk, dismissKey: "L" + d.level, attentionTitle: "Free Lineage Evolution unclaimed; click to dismiss",
          filled: !!awk, gold: true,
          body: el("div", null, [
            el("p.help", { style: { margin: "2px 0 8px" }, text: "Total mastery of your nature; gain one Lineage Evolution for free, in addition to your Level 4 Universal Upgrade." }),
            evolutionSelect(ch, awk, function (name) { store.update(function (c) { c.awakeningEvolution = name; }); })
          ])
        }));
      }
    });
    if (ch.level < 2) blocks.push(el("div.muted-box", { text: "Your first Universal Upgrade arrives at Level 2." }));
    else if (!anyUU) blocks.push(el("div.muted-box", { text: "No Universal Upgrades available yet." }));

    return el("div", null, blocks);
  }
  function setLevel(ch, lvl) {
    lvl = eng.clamp(lvl, 1, R.maxLevel);
    store.update(function (c) {
      c.level = lvl;
      // clean upgrade choices above the new level
      Object.keys(c.universalUpgrades || {}).forEach(function (k) { if (Number(k) > lvl) delete c.universalUpgrades[k]; });
      if (lvl < 4) c.awakeningEvolution = null;
    });
  }
  function universalUpgradePicker(ch, L) {
    var cur = (ch.universalUpgrades || {})[L];
    var wrap = el("div", { style: { margin: "0 0 10px 14px", paddingLeft: "10px", borderLeft: "1px dashed var(--border2)" } });
    wrap.appendChild(el("div.row.wrap", { style: { gap: "8px", marginBottom: "8px" } }, [
      el("button.btn.sm" + (cur && cur.type === "attr" ? ".primary" : ""), { onclick: function () { store.update(function (c) { var p = c.universalUpgrades[L]; var a = (p && p.attrs) || ["", ""]; c.universalUpgrades[L] = { type: "attr", attrs: [a[0] || "", a[1] || ""] }; }); } }, "+2 ATTRIBUTES"),
      el("button.btn.sm" + (cur && cur.type === "talent" ? ".primary" : ""), { onclick: function () { store.update(function (c) { var p = c.universalUpgrades[L]; c.universalUpgrades[L] = { type: "talent", talent: (p && p.talent) || null }; }); } }, "GAIN TALENT"),
      el("button.btn.sm" + (cur && cur.type === "evolution" ? ".primary" : ""), { onclick: function () { store.update(function (c) { var p = c.universalUpgrades[L]; c.universalUpgrades[L] = { type: "evolution", evolution: (p && p.evolution) || null }; }); } }, "GAIN EVOLUTION")
    ]));
    if (cur && cur.type === "evolution") {
      wrap.appendChild(evolutionSelect(ch, cur.evolution, function (name) { store.update(function (c) { c.universalUpgrades[L] = { type: "evolution", evolution: name }; }); }));
    } else if (cur && cur.type === "attr") {
      var a = cur.attrs || ["", ""];
      function attrSelect(idx) {
        return el("select", { style: { maxWidth: "210px" }, onchange: function (e) {
          store.update(function (c) { var u = c.universalUpgrades[L]; var arr = (u.attrs || [a[0], a[1]]).slice(); arr[idx] = e.target.value; c.universalUpgrades[L] = { type: "attr", attrs: arr }; });
        } }, [el("option", { value: "", selected: !a[idx], text: "- choose an Attribute -" })].concat(
          R.attributes.map(function (at) { return el("option", { value: at.key, selected: a[idx] === at.key, text: at.name + " +1" }); })));
      }
      wrap.appendChild(el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [attrSelect(0), el("span.dim3", { text: "+" }), attrSelect(1)]));
      wrap.appendChild(el("p.help", { style: { marginTop: "4px" }, text: "Pick the same Attribute twice to raise it by 2, or two different Attributes for +1 each (max 20)." }));
    } else if (cur && cur.type === "talent") {
      wrap.appendChild(talentPicker(ch, L, cur.talent));
    }
    return wrap;
  }
  function talentName(key) { var t = (EN.talents || []).find(function (x) { return x.key === key; }); return t ? t.name : "Talent"; }

  // Lineage Evolution picker; works like the Talent picker, gated to your Lineage's
  // pool minus features you already have (the current slot's own pick stays selectable).
  function availableEvolutions(ch, currentName) {
    var lin = eng.getLineage(ch.species, ch.lineage);
    if (!lin) return [];
    var active = eng.activeLineageFeatures(ch);
    return (lin.features || []).filter(function (f) { return f.name === currentName || active.indexOf(f.name) === -1; });
  }
  function evolutionSelect(ch, currentName, onChoose) {
    var lin = eng.getLineage(ch.species, ch.lineage);
    var opts = availableEvolutions(ch, currentName);
    var sel = el("select", { onchange: function (e) { onChoose(e.target.value || null); } },
      [el("option", { value: "", text: lin ? "- choose a " + lin.name + " Evolution -" : "- select a Lineage first -" })].concat(
        opts.map(function (f) { return el("option", { value: f.name, selected: currentName === f.name, text: f.name }); })));
    var info = null;
    var f = lin && (lin.features || []).find(function (x) { return x.name === currentName; });
    if (f && f.name === "Open Architecture") {
      info = openArchitectureCard(ch, lin);
    } else if (f) {
      info = el("div.feature.lineage", { style: { marginTop: "8px" } }, [
        el("h4", null, [document.createTextNode(f.name), el("span.src", { text: (lin ? lin.name : "") + " Evolution" })]),
        el("p", { text: f.text })]);
    }
    return el("div", null, [sel, info]);
  }

  // Open Architecture, readable per-combo accordion with integration detection.
  // The lineage-feature half is auto-detected; the cyberware half is a manual
  // toggle until the Inventory tab tracks installed chrome.
  function toggleChrome(ch, cyberName) {
    store.update(function (c) {
      c.cyberware = c.cyberware || [];
      var i = c.cyberware.findIndex(function (cw) { return (cw && (cw.base || cw.name)) === cyberName || cw === cyberName; });
      if (i === -1) c.cyberware.push({ base: cyberName, name: cyberName, tier: null, zone: "Hardware", sp: 0, side: null, custom: true });
      else c.cyberware.splice(i, 1);
    });
  }
  // a combo's cyberware string may be "X or Y"; match any installed base against the options
  function comboHasChrome(bases, cyberStr) {
    var opts = cyberStr.split(/\s+or\s+/);
    return bases.some(function (b) { return b === cyberStr || opts.indexOf(b) !== -1; });
  }
  function openArchitectureCard(ch, lin) {
    var oa = R.openArchitecture;
    var owned = eng.activeLineageFeatures(ch);
    var hasOA = owned.indexOf("Open Architecture") !== -1;
    var bases = eng.installedCyberBases(ch);
    var rows = oa.combos.map(function (combo) {
      var id = "oa-" + combo.key;
      var collapsed = isCollapsed(id);
      var hasFeat = owned.indexOf(combo.feature) !== -1;
      var hasChrome = comboHasChrome(bases, combo.cyberware);
      var integrated = hasOA && hasFeat && hasChrome;
      var head = el("div.row.wrap", { style: { gap: "8px", alignItems: "center", cursor: "pointer", padding: "7px 4px" },
        onclick: function () { toggleCollapse(id); } }, [
        el("span.collapse-caret", { text: collapsed ? "▸" : "▾" }),
        el("span", { style: { flex: 1, minWidth: "150px", fontWeight: 600, color: integrated ? "var(--gold)" : "var(--text)" }, text: combo.feature + " + " + combo.cyberware }),
        el("span.chip" + (hasFeat ? ".on" : ""), { title: hasFeat ? "You have this Lineage Feature" : "Requires the " + combo.feature + " Lineage Feature", text: hasFeat ? "FEATURE ✓" : "NO FEATURE" }),
        el("button.btn.sm" + (hasChrome ? ".primary" : ""), { title: "Mark whether the matching cyberware is installed (manual until Inventory tracks chrome)",
          onclick: function (e) { e.stopPropagation(); toggleChrome(ch, combo.cyberware); } }, hasChrome ? "✓ CHROME" : "+ CHROME"),
        integrated ? el("span.chip", { style: { color: "var(--gold)", borderColor: "var(--gold)", boxShadow: "0 0 10px rgba(255,207,92,.3)" }, text: "● INTEGRATED" }) : null
      ]);
      var body = collapsed ? null : el("p", { style: { padding: "0 4px 9px 23px", margin: 0, color: "var(--text2)", fontSize: "13.5px", lineHeight: 1.45 }, text: combo.text });
      return el("div", { style: { borderBottom: "1px solid rgba(35,48,68,.5)", borderLeft: integrated ? "2px solid var(--gold)" : "2px solid transparent" } }, [head, body]);
    });
    return el("div.feature.lineage", { style: { marginTop: "8px" } }, [
      el("h4", null, [document.createTextNode("Open Architecture"), el("span.src", { text: (lin ? lin.name : "NextGen") + " Evolution" })]),
      el("p", { text: oa.intro }),
      el("p.help", { style: { margin: "6px 0 4px" }, text: oa.rule }),
      el("p.help", { style: { margin: "0 0 8px", color: "var(--warn)" }, text: "Your Lineage Features are detected automatically. Mark installed chrome with the + CHROME toggle; a pairing lights up INTEGRATED when both halves are present." }),
      el("div", null, rows)
    ]);
  }
  function attrUpgradeSummary(cur) {
    var a = (cur.attrs && cur.attrs.slice()) || (cur.attr ? [cur.attr, cur.amount > 1 ? cur.attr : null] : []);
    a = a.filter(Boolean);
    if (!a.length) return "+2 Attributes, choose";
    var counts = {}; a.forEach(function (k) { counts[k] = (counts[k] || 0) + 1; });
    return Object.keys(counts).map(function (k) { return "+" + counts[k] + " " + (R.attrByKey[k] ? R.attrByKey[k].name : k); }).join(" / ");
  }
  function talentPicker(ch, L, current) {
    // group talents by category into <optgroup>s
    var cats = {};
    (EN.talents || []).forEach(function (t) { (cats[t.category || "Other"] = cats[t.category || "Other"] || []).push(t); });
    var sel = el("select", { onchange: function (e) { store.update(function (c) { c.universalUpgrades[L] = { type: "talent", talent: e.target.value || null }; }); } },
      [el("option", { value: "", text: "- choose a Talent -" })]);
    Object.keys(cats).forEach(function (cat) {
      var grp = el("optgroup", { label: cat });
      cats[cat].forEach(function (t) { grp.appendChild(el("option", { value: t.key, selected: current === t.key, text: t.name })); });
      sel.appendChild(grp);
    });
    var info = null;
    var t = (EN.talents || []).find(function (x) { return x.key === current; });
    if (t) info = el("div.feature", { style: { marginTop: "8px" } }, [
      el("h4", null, [document.createTextNode(t.name), el("span.src", { text: t.category || "" })]),
      t.requirements ? el("p.help", { style: { color: "var(--warn)" }, text: "Requires: " + t.requirements }) : null,
      el("p", { text: t.text })]);
    return el("div", null, [sel, info]);
  }

  /* ---------- STEP 8: DOSSIER (review) ---------- */
  function stepDossier(ch, d) {
    var blocks = [];
    // header card
    blocks.push(EN.ui.panel((ch.name || "UNNAMED FREELANCER").toUpperCase(), "#PRINT RECORD", [
      el("div.row.wrap", { style: { gap: "8px", marginBottom: "10px" } }, [
        d.speciesInfo ? el("span.chip.on", { text: d.speciesInfo.name + (d.lineageInfo ? " / " + d.lineageInfo.name : "") }) : null,
        d.classInfo ? el("span.chip.on", { text: d.classInfo.name.replace(/^The\s+/, "") + (d.subclassInfo ? " · " + d.subclassInfo.name : "") }) : null,
        d.backgroundInfo ? el("span.chip", { text: d.backgroundInfo.name }) : null,
        d.size ? el("span.chip", { text: d.size + " Size" }) : null,
        el("span.chip", { text: "LVL " + d.level })
      ]),
      ch.identity.concept ? el("p", { style: { color: "var(--text2)" }, text: "“" + ch.identity.concept + "”" }) : null
    ], { corners: true, glow: true }));

    blocks.push(el("div", { style: { height: "14px" } }));
    blocks.push(vitalsStrip(d));

    // attributes + saves
    blocks.push(el("div.grid2", null, [
      EN.ui.panel("Attributes", null, [el("div.attr-grid", { style: { gridTemplateColumns: "repeat(3,1fr)" } }, R.attributes.map(function (a) {
        return el("div.attr-cell", null, [el("div.abbr", { text: a.abbr }), el("div.mod", { text: eng.fmtMod(d.attributes[a.key].mod) }), el("div.s.mono", { text: "score " + d.attributes[a.key].score })]);
      }))]),
      EN.ui.panel("Saving Throws", "d20 + MOD + CALIBER (focus)", [el("table.sktable", null, [el("tbody", null, R.attributes.map(function (a) {
        var s = d.saves[a.key];
        return el("tr", null, [el("td", { text: a.name }), el("td", null, [s.focus ? el("span.badge", { style: { color: "var(--flow)" }, text: "FOCUS" }) : null]), el("td.tot", { text: eng.fmtMod(s.bonus) })]);
      }))])])
    ]));

    // combined skills & proficiencies (Background + Class + Advance)
    blocks.push(el("div", { style: { height: "14px" } }));
    blocks.push(skillProfSummary(ch, d));

    // warnings
    if (d.warnings.length) {
      blocks.push(el("div", { style: { height: "14px" } }));
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--warn)", color: "var(--warn)" }, html: "INCOMPLETE: " + d.warnings.join(" · ") }));
    }

    // features
    blocks.push(el("div", { style: { height: "14px" } }));
    blocks.push(EN.ui.sectionTitle("All Features (" + d.features.length + ")"));
    var fb = el("div.scroll-box");
    d.features.forEach(function (f) {
      if (f.name === "Open Architecture") fb.appendChild(openArchitectureCard(ch, d.lineageInfo));
      else fb.appendChild(feature(f.name, f.text, f.kind, f.source + " · L" + f.level));
    });
    blocks.push(fb);

    // export
    blocks.push(el("div", { style: { height: "16px" } }));
    blocks.push(el("div.row.wrap", null, [
      el("button.btn.primary", { onclick: function () { exportChar(ch); } }, "⤓ EXPORT RECORD (.JSON)"),
      el("button.btn", { onclick: function () { EN.printSheet.open(); } }, "⎙ PRINT HARDCOPY"),
      el("button.btn.danger", { onclick: function () { if (confirm("Revoke and permanently delete this #PRINT record? This cannot be undone.")) { store.remove(ch.meta.id); EN.app.render(); } } }, "✕ REVOKE #PRINT")
    ]));
    return el("div", null, blocks);
  }
  function exportChar(ch) {
    var blob = new Blob([JSON.stringify(ch, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (ch.name || "freelancer").replace(/[^\w]+/g, "_") + ".json";
    a.click();
    toast("#PRINT record exported.");
  }

  /* ---------- shared feature renderer ---------- */
  function feature(name, text, kind, src, locked) {
    var extra = (kind === "flow" || kind === "species" || kind === "lineage") ? kind : "";
    if (locked) extra += " locked";
    return el("div.feature", { class: extra.trim() }, [
      el("h4", null, [document.createTextNode(name), src ? el("span.src", { text: src }) : null]),
      el("p", { text: text || "" })
    ]);
  }

  // Class Progression feature block, cyan for base class, purple for subclass
  // (with an inline "· Subclass Name" suffix, per the reference layout).
  function progFeature(f, isSub, subName, locked) {
    var color = isSub ? "var(--flow)" : "var(--accent)";
    return el("div.feature" + (locked ? ".locked" : ""), { style: { borderLeftColor: color } }, [
      el("h4", null, [
        el("span", null, [
          el("span", { style: { color: locked ? "var(--text2)" : color }, text: f.name }),
          isSub && subName ? el("span", { style: { color: "var(--text3)", fontWeight: 400, fontSize: "11.5px", marginLeft: "8px", letterSpacing: ".04em" }, text: "· " + subName }) : null
        ])
      ]),
      el("p", { text: f.text || "" })
    ]);
  }

  // Resource feature with a structured ability list (Moxie Gambits, Overdrive Maneuvers, Triage
  // Protocols, ...): an intro line, then one spaced line per ability with its name (and action
  // type) in bold. Scoundrel supplies its own intro prose; other classes get a generated one.
  function resourceFeatureView(f, res, locked) {
    var color = locked ? "var(--text2)" : "var(--accent)";
    var node = el("div.feature" + (locked ? ".locked" : ""), { style: { borderLeftColor: color } }, [
      el("h4", null, [el("span", { style: { color: color }, text: f.name })]),
      el("p", { style: { margin: "0 0 8px" }, text: res.gambitsIntro || resourceIntro(res) })
    ]);
    (res.abilities || []).forEach(function (g) {
      node.appendChild(el("p", { style: { margin: "0 0 8px", lineHeight: "1.5" } }, [
        el("strong", { style: { color: locked ? "var(--text2)" : "var(--text)" }, text: g.name + (g.action ? " (" + g.action + ")" : "") + ": " }),
        document.createTextNode(g.text)
      ]));
    });
    return node;
  }
  // one-line intro for a resource ability list, built from its pool formula + learn rule
  function resourceIntro(res) {
    var noun = res.abilityNoun || "ability", nounPl = res.abilityNounPlural || (noun + "s");
    var parts = [];
    if (res.maxFormula) parts.push("Max " + res.name + " = " + res.maxFormula + ".");
    if (res.learn && res.learn.knowsAll) parts.push("You know every " + noun + " below.");
    else {
      var picks = (res.learn && res.learn.picks) || [];
      if (picks.length) {
        var s = "At Level " + picks[0].level + " you learn " + picks[0].count + " " + (picks[0].count === 1 ? noun : nounPl);
        picks.slice(1).forEach(function (p) { s += ", and " + p.count + " more at Level " + p.level; });
        parts.push(s + ". Unless an entry says otherwise, each costs 1 " + res.name + ".");
      }
    }
    return parts.join(" ");
  }

  /* ---------- main render ---------- */
  function render(mount) {
    var ch = store.active();
    clear(mount);
    if (!ch || _intake) { mount.appendChild(rosterGate()); return; }
    var d = eng.derive(ch);

    // wizard rail
    var rail = el("div.wizard-rail", null, STEPS.map(function (s, i) {
      var done = stepComplete(ch, s.key);
      return el("div.wstep" + (i === _step ? ".active" : (done ? ".done" : "")), { onclick: function () { _step = i; render(mount); } }, [
        el("div.n", { text: s.n }), el("div.t", { text: s.t })
      ]);
    }));

    var body;
    var key = STEPS[_step].key;
    if (key === "identity") body = stepIdentity(ch);
    else if (key === "attributes") body = stepAttributes(ch, d);
    else if (key === "species") body = stepSpecies(ch);
    else if (key === "background") body = stepBackground(ch);
    else if (key === "class") body = stepClass(ch, d);
    else if (key === "advance") body = stepAdvance(ch, d);
    else body = stepDossier(ch, d);

    var foot = el("div.wizard-foot", null, [
      el("button.btn.ghost", { disabled: _step === 0, onclick: function () { _step = Math.max(0, _step - 1); render(mount); } }, "◄ BACK"),
      el("span.help", { text: STEPS[_step].n + " / " + STEPS.length + "  ·  " + STEPS[_step].t }),
      el("button.btn.primary", { disabled: _step === STEPS.length - 1, onclick: function () { _step = Math.min(STEPS.length - 1, _step + 1); render(mount); } }, "NEXT ►")
    ]);

    mount.appendChild(el("div", null, [
      el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
        el("div", null, [
          el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" }, html: '#PRINT <span class="dim3" style="font-size:13px">// Personal Record &amp; Identity Network Tag</span>' }),
          el("div.mono", { style: { fontSize: "10px", letterSpacing: ".1em", color: "var(--warn)", marginTop: "3px" }, text: "⚠ VERIFIED IDENTITY RECORD · UNAUTHORIZED EDITS ARE LOGGED AND PROSECUTED" })
        ]),
        rosterSwitcher(ch)
      ]),
      key !== "dossier" ? vitalsStrip(d) : null,
      rail, body, foot
    ]));
  }

  // All level-driven elections on the Advance step made? (Universal Upgrade
  // slots at 2/4/6/8 fully chosen + the Level 4 Awakening evolution.)
  function advanceElectionsComplete(ch) {
    var uuLevels = [2, 4, 6, 8];
    for (var i = 0; i < uuLevels.length; i++) {
      var L = uuLevels[i];
      if (L > (ch.level || 1)) continue;
      var u = (ch.universalUpgrades || {})[L];
      if (!u) return false;
      if (u.type === "attr") {
        if (u.attrs) { if (!(u.attrs[0] && u.attrs[1])) return false; }
        else if (!u.attr) return false;   // legacy single-attr shape
      } else if (u.type === "talent") { if (!u.talent) return false; }
      else if (u.type === "evolution") { if (!u.evolution) return false; }
      else return false;
    }
    if ((ch.level || 1) >= 4 && !ch.awakeningEvolution) return false;
    return true;
  }
  function stepComplete(ch, key) {
    switch (key) {
      case "identity": return !!(ch.name || ch.identity.concept);
      case "attributes": return ch.attributeMethod === "manual" || (ch.attributeMethod === "pointbuy" ? true : Object.keys(ch.arrayAssign || {}).length === 6);
      case "species": return !!(ch.species && ch.lineage && (ch.lineageFeatures || []).length);
      case "background": return !!ch.background && !eng.pendingChoices(ch).some(function (p) { return p.source === "Background"; });
      case "class": return !!(ch.class && (!(eng.getClass(ch.class) || {}).subclasses || !((eng.getClass(ch.class) || {}).subclasses || []).length || ch.subclass)) &&
        !eng.pendingChoices(ch).some(function (p) { return p.source === "Class"; });
      case "advance": return advanceElectionsComplete(ch);
      case "dossier": return ["identity", "attributes", "species", "background", "class", "advance"].every(function (k) { return stepComplete(ch, k); });
      default: return false;
    }
  }

  /* ---------- roster controls ---------- */
  function rosterSwitcher(ch) {
    var roster = store.roster();
    var ids = Object.keys(roster);
    var sel = el("select", { style: { width: "auto", minWidth: "160px" }, onchange: function (e) {
      if (e.target.value === "__new") { _intake = true; EN.app.render(); return; }
      store.setActive(e.target.value); _step = 0; EN.app.render();
    } }, ids.map(function (id) { return el("option", { value: id, selected: id === ch.meta.id, text: (roster[id].name || "Unnamed") + " · L" + roster[id].level }); }).concat([el("option", { value: "__new", text: "+ Register New #PRINT" })]));
    return el("div.row", null, [el("label.fl", { style: { margin: 0 }, text: "On File" }), sel]);
  }
  function rosterGate() {
    var hasExisting = !!store.active();   // reached via "+ Register" while records already exist
    return el("div", { style: { textAlign: "center", paddingTop: "60px" } }, [
      el("h1", { style: { fontSize: "26px", marginBottom: "8px" }, text: hasExisting ? "NEW #PRINT" : "NO #PRINT ON FILE" }),
      el("p.help", { style: { marginBottom: "20px" }, text: "Register a new Freelancer to issue a verified #PRINT identity, or import an exported record (.JSON)." }),
      el("button.btn.primary", { onclick: function () { _intake = false; store.createAndActivate(""); _step = 0; EN.app.render(); } }, "+ REGISTER NEW #PRINT"),
      el("div", { style: { height: "12px" } }),
      el("button.btn.ghost", { onclick: function () { importPrompt(); } }, "⤒ IMPORT RECORD (.JSON)"),
      hasExisting ? el("div", { style: { height: "20px" } }) : null,
      hasExisting ? el("button.btn.ghost", { style: { color: "var(--text3)", borderColor: "var(--border2)" }, onclick: function () { _intake = false; EN.app.render(); } }, "← BACK TO CURRENT #PRINT") : null
    ]);
  }
  function importPrompt() {
    var inp = el("input", { type: "file", accept: ".json", style: { display: "none" }, onchange: function (e) {
      var f = e.target.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { try { store.importCharacter(JSON.parse(r.result)); _intake = false; _step = 0; EN.app.render(); toast("Imported."); } catch (err) { toast("Invalid file."); } };
      r.readAsText(f);
    } });
    document.body.appendChild(inp); inp.click(); setTimeout(function () { inp.remove(); }, 1000);
  }

  return { render: render, setStep: function (i) { _step = i; }, importPrompt: importPrompt };
})();
