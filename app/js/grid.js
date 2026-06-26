/* ===========================================================================
   ELYSIUM NIGHTS · The #GRID tab
   Play-time hacking console: your rig (Smartdeck / B&E Buddy) with durability +
   Bandwidth, live Cipher Attack / Save DC / Link math, an active-Link tracker, a
   target-node calculator, and the full #GRID rules reference. Reads the same
   #PRINT record; rig + links persist on ch.grid, Bandwidth on resources.current.
   =========================================================================== */
window.EN = window.EN || {};

EN.gridView = (function () {
  var el = EN.ui.el, toast = EN.ui.toast, store = EN.store;
  var eng = EN.engine;
  var _open = {};                                   // collapse state for reference sections
  var _calc = { tier: "Standard", fw: "none", hardened: false };   // target-node scratch calculator

  /* ---- small shared bits ---- */
  function bar(cur, max, color) {
    var pct = max > 0 ? Math.max(0, Math.min(100, cur / max * 100)) : 0;
    return el("div", { style: { height: "10px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: "5px", overflow: "hidden", margin: "5px 0 2px" } },
      [el("div", { style: { width: pct + "%", height: "100%", background: color, boxShadow: "0 0 7px " + color, transition: "width .2s" } })]);
  }
  function stepper(onMinus, onPlus, minusOff, plusOff) {
    return el("div.stepper", { style: { marginTop: 0, width: "auto" } }, [
      el("button", { disabled: !!minusOff, onclick: onMinus }, "−"),
      el("button", { disabled: !!plusOff, onclick: onPlus }, "+")
    ]);
  }
  function gset(mut, silent) { store.update(function (c) { c.grid = c.grid || {}; mut(c.grid, c); }, silent ? { silent: true } : undefined); }
  function tableEl(cols, rows, highlightFn) {
    var head = el("tr", null, cols.map(function (c) {
      return el("th", { style: { textAlign: c.align || "left", padding: "4px 8px", fontFamily: "var(--disp)", fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)", borderBottom: "1px solid var(--border2)", textTransform: "uppercase" } }, c.label);
    }));
    var body = rows.map(function (r) {
      var hot = highlightFn && highlightFn(r);
      return el("tr", { style: hot ? { background: "rgba(0,229,255,.07)" } : null }, cols.map(function (c) {
        var v = typeof c.get === "function" ? c.get(r) : r[c.key];
        return el("td", { style: { textAlign: c.align || "left", padding: "4px 8px", fontSize: "11.5px", color: c.mono ? "var(--text)" : "var(--text2)", fontFamily: c.mono ? "var(--mono)" : "inherit", borderBottom: "1px solid rgba(35,48,68,.4)" } }, String(v == null ? "-" : v));
      }));
    });
    return el("table", { style: { width: "100%", borderCollapse: "collapse" } }, [el("thead", null, [head]), el("tbody", null, body)]);
  }
  function collapsible(key, title, buildBody) {
    var open = !!_open[key];
    var head = el("div.section-title.clickable", { style: { margin: "12px 0 4px" }, onclick: function () { _open[key] = !open; EN.app.render(); } },
      [document.createTextNode(title), el("span.line"), el("span.collapse-caret", { style: { marginLeft: "4px" }, text: open ? "▾" : "▸" })]);
    return open ? [head, buildBody()] : [head];
  }
  function noteP(t, color) { return el("p.help", { style: { margin: "2px 0 6px", color: color || "var(--text3)", fontSize: "11.5px" }, text: t }); }

  /* ============================ RIG ============================ */
  function rigPanel(ch, d, G) {
    var grid = ch.grid || {}, gd = d.grid, deck = gd.deck;
    var rows = [];

    // rig selector: only show owned smartdecks/buddies from the character's inventory
    var ownedDecks = (ch.equipment || []).filter(function (e) { return e.qty > 0 && (e.name.endsWith(" Smartdeck") || e.name.endsWith(" B&E Buddy")); });
    var ownedSmartdecks = ownedDecks.filter(function (e) { return e.name.endsWith(" Smartdeck"); }).map(function (e) {
      var tier = e.name.replace(" Smartdeck", "");
      return (G.smartdecks || []).find(function (s) { return s.tier === tier; });
    }).filter(Boolean);
    var ownedBuddies = ownedDecks.filter(function (e) { return e.name.endsWith(" B&E Buddy"); }).map(function (e) {
      var tier = e.name.replace(" B&E Buddy", "");
      return (G.buddies || []).find(function (b) { return b.tier === tier; });
    }).filter(Boolean);

    var selChildren = [el("option", { value: "none", selected: !grid.deckType, text: "- No rig -" })];
    if (ownedSmartdecks.length) selChildren.push(el("optgroup", { label: "Smartdecks (Power User)" }, ownedSmartdecks.map(function (s) {
      return el("option", { value: "smartdeck:" + s.tier, selected: grid.deckType === "smartdeck" && grid.deckTier === s.tier, text: s.tier + " · +" + s.deviceBonus + " dev · " + s.hp + " HP" });
    })));
    if (ownedBuddies.length) selChildren.push(el("optgroup", { label: "B&E Buddies (Standard User)" }, ownedBuddies.map(function (b) {
      return el("option", { value: "buddy:" + b.tier, selected: grid.deckType === "buddy" && grid.deckTier === b.tier, text: b.tier + " · +" + b.attack + " atk · " + b.hp + " HP" });
    })));
    if (!ownedSmartdecks.length && !ownedBuddies.length) selChildren.push(el("option", { disabled: true, text: "No rigs in stash — buy one in Inventory" }));

    var sel = el("select", { style: { fontSize: "12px", width: "auto", minWidth: "220px" },
      onchange: function () {
        var v = this.value;
        gset(function (g) {
          if (v === "none") { g.deckType = null; g.deckTier = null; g.deckMods = []; g.deckHpSpent = 0; return; }
          var p = v.split(":"); g.deckType = p[0]; g.deckTier = p[1]; g.deckHpSpent = 0;
          if (p[0] !== "smartdeck") { g.deckMods = []; return; }
          // keep only mods that still fit the new tier's slots (drop stranded mods on a downgrade)
          var nd = (G.smartdecks || []).find(function (s) { return s.tier === p[1]; }), cap = nd ? nd.modSlots : 0, u = 0, kept = [];
          (g.deckMods || []).forEach(function (k) { var m = (G.mods || []).find(function (x) { return x.key === k; }); if (m && u + m.slots <= cap) { u += m.slots; kept.push(k); } });
          g.deckMods = kept;
        });
      } }, selChildren);
    rows.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "center" } }, [
      el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em", minWidth: "44px" }, text: "RIG" }), sel,
      deck ? el("span.chip", { style: { fontSize: "9.5px", color: "var(--accent)", borderColor: "var(--accent)" }, title: "User Type on the #GRID" }, gd.userType.toUpperCase()) : null,
      (deck && deck.type === "smartdeck") ? el("span.chip", { style: { fontSize: "9.5px", color: "var(--flow)", borderColor: "var(--flow)" }, title: "Runs ciphers up to this Complexity" }, "≤ CX " + deck.maxComplexity) : null
    ]));

    if (!deck) { rows.push(noteP("No rig selected. Codebreakers run a Smartdeck (Power User); everyone else can crack low-tier nodes with a B&E Buddy.")); return EN.ui.panel("Rig", "SMARTDECK / B&E BUDDY", rows, { corners: true }); }

    // durability HP
    var maxHp = deck.maxHp, spent = grid.deckHpSpent || 0, cur = Math.max(0, maxHp - spent), bricked = cur <= 0;
    rows.push(el("div", { style: { marginTop: "10px" } }, [
      el("div.row.between", { style: { alignItems: "baseline" } }, [
        el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".12em", color: "var(--text3)" }, text: "DURABILITY HP" }),
        el("span.mono", { style: { fontSize: "13px", color: bricked ? "var(--danger)" : "var(--text2)" }, text: bricked ? "BRICKED" : cur + " / " + maxHp })
      ]),
      bar(cur, maxHp, bricked ? "var(--danger)" : "var(--success)"),
      el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "4px" } }, [
        stepper(function () { gset(function (g) { g.deckHpSpent = Math.min(maxHp, (g.deckHpSpent || 0) + 1); }); },
                function () { gset(function (g) { g.deckHpSpent = Math.max(0, (g.deckHpSpent || 0) - 1); }); }, cur <= 0, spent <= 0),
        el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: bricked ? "Bricked; all Links sever (LinkDeath). Downtime repair only." : "−1 per hit (any successful hit deals 1 HP)." }),
        spent > 0 ? el("button.btn.sm", { style: { color: "var(--text2)" }, onclick: function () { gset(function (g) { g.deckHpSpent = 0; }); toast("Rig repaired to full."); } }, "⟳ REPAIR FULL") : null
      ])
    ]));

    // Bandwidth (Codebreaker)
    if (gd.bandwidthMax != null) {
      var bwMax = gd.bandwidthMax, bwCur = (ch.resources && ch.resources.current && ch.resources.current.Bandwidth != null) ? eng.clamp(ch.resources.current.Bandwidth, 0, bwMax) : bwMax;
      rows.push(el("div", { style: { marginTop: "12px" } }, [
        el("div.row.between", { style: { alignItems: "baseline" } }, [
          el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".12em", color: "var(--text3)" }, text: "BANDWIDTH" }),
          el("span.mono", { style: { fontSize: "13px", color: "var(--accent)" }, text: bwCur + " / " + bwMax + "  ·  Caliber + Tech" })
        ]),
        bar(bwCur, bwMax, "var(--accent)"),
        el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "4px" } }, [
          stepper(function () { store.update(function (c) { c.resources = c.resources || { current: {} }; c.resources.current.Bandwidth = Math.max(0, bwCur - 1); }); },
                  function () { store.update(function (c) { c.resources = c.resources || { current: {} }; c.resources.current.Bandwidth = Math.min(bwMax, bwCur + 1); }); }, bwCur <= 0, bwCur >= bwMax),
          el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: "CX 0 free · CX 1-3 = 1 · CX 4-5 = 2 · Signature = 1. Refreshes on a rest." }),
          bwCur < bwMax ? el("button.btn.sm", { style: { color: "var(--text2)" }, onclick: function () { store.update(function (c) { c.resources = c.resources || { current: {} }; c.resources.current.Bandwidth = bwMax; }); } }, "⟳ REST") : null
        ])
      ]));
    }

    // traits
    if (deck.traits && deck.traits.length) {
      var traitDefs = {}; (G.smartdeckTraits || []).forEach(function (t) { traitDefs[t.name] = t.text; });
      rows.push(el("div.row.wrap", { style: { gap: "6px", marginTop: "12px" } }, [el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "4px" }, text: "TRAITS" })].concat(
        deck.traits.map(function (t) { return el("span.chip", { title: traitDefs[t] || "", style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, t); }))));
    }

    // Smartdeck mods: install/slot only mods bought from the gray market (owned in stash)
    if (deck.type === "smartdeck") {
      var installed = grid.deckMods || [], used = 0;
      (G.mods || []).forEach(function (m) { if (installed.indexOf(m.key) !== -1) used += m.slots; });
      var slots = deck.modSlots;
      function ownsMod(m) { return (ch.equipment || []).some(function (e) { return e.name === m.name && e.qty > 0; }); }
      // a mod is listed here if owned, or already slotted (so a previously-slotted mod can still be removed)
      var listMods = (G.mods || []).filter(function (m) { return ownsMod(m) || installed.indexOf(m.key) !== -1; });
      rows.push(el("div.section-title", { style: { margin: "14px 0 4px" } }, [document.createTextNode("Hardware Mods"), el("span.line"),
        el("span.mono", { style: { fontSize: "10px", color: used > slots ? "var(--danger)" : "var(--text3)", marginLeft: "6px" }, text: used + " / " + slots + " slots" })]));
      if (slots === 0) rows.push(noteP("A Standard Smartdeck has no mod slots. Upgrade the deck to install hardware mods."));
      else if (!listMods.length) rows.push(noteP("No hardware mods in your stash. Buy them in the Inventory tab's gray market (Rigs → Hardware Mods), then slot them here."));
      listMods.forEach(function (m) {
        var on = installed.indexOf(m.key) !== -1, fits = used + m.slots <= slots;
        rows.push(el("div.feature", { style: { borderLeftColor: on ? "var(--accent)" : "var(--border2)" } }, [
          el("div.row.between", { style: { alignItems: "center", gap: "8px" } }, [
            el("span", { style: { fontWeight: 600, fontSize: "13px" }, text: m.name }),
            el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
              el("span.chip", { style: { fontSize: "9px", color: "var(--text3)", borderColor: "var(--border2)" } }, m.slots + (m.slots === 1 ? " slot" : " slots")),
              on ? el("button.btn.sm.primary", { onclick: function () { gset(function (g) { g.deckMods = (g.deckMods || []).filter(function (k) { return k !== m.key; }); }); } }, "✓ INSTALLED")
                 : el("button.btn.sm", { disabled: !fits, title: fits ? "" : "Not enough mod slots", style: fits ? { color: "var(--accent)", borderColor: "var(--accent)" } : null, onclick: function () { gset(function (g) { g.deckMods = (g.deckMods || []).concat([m.key]); }); } }, fits ? "INSTALL" : "NO SLOTS")
            ])
          ]),
          el("div.row.wrap", { style: { gap: "6px", margin: "3px 0 0" } }, [el("span.chip", { style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" } }, m.type)]),
          el("p.help", { style: { margin: "4px 0 0" }, text: m.text })
        ]));
      });
    }
    return EN.ui.panel("Rig", (deck.type === "smartdeck" ? "SMARTDECK" : "B&E BUDDY") + " · " + deck.tier.toUpperCase(), rows, { corners: true });
  }

  /* ============================ HACKING STATS ============================ */
  function statsPanel(ch, d) {
    var gd = d.grid, fmt = eng.fmtMod;
    var stats = [
      EN.ui.stat("CIPHER ATK", fmt(gd.effectiveAttack), gd.deck ? (gd.deck.type === "buddy" ? "Buddy bonus" : "Tech+Systems+dev") : "Tech+Systems"),
      EN.ui.stat("SAVE DC", gd.effectiveSaveDC, gd.deck && gd.deck.type === "buddy" ? "Buddy DC" : "8+Tech+Systems"),
      EN.ui.stat("LINKS", gd.unlimitedLinks ? "∞" : gd.maxLinks, gd.isCodebreaker ? (gd.unlimitedLinks ? "SysAdmin" : "2 × Caliber" + (gd.modLinks ? " +" + gd.modLinks : "")) : "Standard User"),
      EN.ui.stat("STABILITY", "DC " + gd.stabilityDcBase, gd.stabilityDcMod ? (gd.stabilityDcMod > 0 ? "+" : "") + gd.stabilityDcMod + " from rig" : "or ½ dmg taken")
    ];
    if (gd.quickHackBonus != null) stats.splice(1, 0, EN.ui.stat("QUICK HACK", fmt(gd.quickHackBonus), "+ Device Bonus"));
    var body = [el("div.stat-row", null, stats),
      noteP("Cipher Attack: d20 " + fmt(gd.cipherAttackBonus) + " vs node Security Rating" + (gd.deck && gd.deck.type === "smartdeck" && gd.deck.deviceBonus ? " (+" + gd.deck.deviceBonus + " Device Bonus = " + fmt(gd.effectiveAttack) + " on a Quick Hack)" : "") + ". Node resists save-ciphers with d20 + its Cipher Save Bonus vs your Save DC " + gd.effectiveSaveDC + ".", "var(--text2)")];
    if (!gd.isCodebreaker) body.push(noteP("You're a Standard User: 1 Link at a time, no Bandwidth, and a B&E Buddy locks out of Premium+ nodes. Deep #GRID play is the Codebreaker's domain.", "var(--warn)"));
    return EN.ui.panel("Hacking", "CIPHER MATH", body, { corners: true });
  }

  /* ============================ LINKS ============================ */
  function linksPanel(ch, d, G) {
    var gd = d.grid, links = (ch.grid && ch.grid.links) || [];
    var atMax = !gd.unlimitedLinks && gd.maxLinks != null && links.length >= gd.maxLinks;
    var tiers = (G.nodeTiers || []).map(function (n) { return n.tier; });
    var rows = [];
    rows.push(el("div.row.between.wrap", { style: { alignItems: "center", marginBottom: "6px" } }, [
      el("span.mono", { style: { fontSize: "20px", color: atMax ? "var(--warn)" : "var(--accent)" }, html: links.length + " <span style='font-size:12px;color:var(--text3)'>/ " + (gd.unlimitedLinks ? "∞" : gd.maxLinks) + " active Links</span>" }),
      el("button.btn.sm" + (atMax ? "" : ".primary"), { disabled: atMax, title: atMax ? "At your Link cap" : "Open a new Link", onclick: function () { gset(function (g) { g.links = (g.links || []).concat([{ name: "Node", tier: "Standard" }]); }); } }, "+ LINK")
    ]));
    if (!links.length) rows.push(noteP("No active Links. Establish one with a Cipher Attack vs the node's Security Rating (Access Spike / Hardline Tap)."));
    links.forEach(function (lk, i) {
      rows.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", padding: "6px 4px", borderBottom: "1px solid rgba(35,48,68,.4)" } }, [
        el("span.mono", { style: { color: "var(--accent)", fontSize: "12px" }, text: "⇋" }),
        el("input", { type: "text", value: lk.name || "", placeholder: "node label…", style: { flex: "1 1 120px", fontSize: "12px" },
          oninput: function () { var v = this.value; gset(function (g) { if (g.links[i]) g.links[i].name = v; }, true); } }),
        el("select", { style: { fontSize: "11px", width: "auto" }, onchange: function () { var v = this.value; gset(function (g) { if (g.links[i]) g.links[i].tier = v; }); } },
          tiers.map(function (t) { return el("option", { value: t, selected: lk.tier === t, text: t }); })),
        el("button.btn.sm", { title: "Close this Link (clean, no backlash)", style: { color: "var(--text3)" }, onclick: function () { gset(function (g) { g.links.splice(i, 1); }); } }, "✕")
      ]));
    });
    // LinkDeath risk
    var extra = Math.max(0, links.length - 1);
    var dmg = "2d6" + (extra ? " + " + extra + "d6" : "");
    rows.push(el("div", { style: { marginTop: "8px", padding: "8px 10px", border: "1px solid " + (links.length >= 2 ? "var(--danger)" : "var(--border2)"), borderRadius: "4px", background: "rgba(0,0,0,.18)" } }, [
      el("div.row.between", { style: { alignItems: "baseline" } }, [
        el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".12em", color: "var(--danger)" }, text: "LINKDEATH RISK" }),
        el("span.mono", { style: { fontSize: "12px", color: "var(--text2)" }, text: "Stability DC " + gd.stabilityDcBase }) ]),
      noteP("Fail a Stability Check (Body or Wits, DC " + gd.stabilityDcBase + " or ½ damage taken this turn) → all Links sever and you take " + dmg + " Psychic, Unconscious." + (links.length >= 2 ? " Fail by 5+ with 2+ Links = Cascade Failure (deck auto-Bricked)." : " Succeed → ride it: half damage, Dazed."), links.length >= 2 ? "var(--danger)" : "var(--text3)")
    ]));
    return EN.ui.panel("Links", gd.unlimitedLinks ? "UNLIMITED THREADING" : "MULTI-LINK", rows, { corners: true });
  }

  /* ============================ TARGET NODE CALCULATOR ============================ */
  function targetPanel(ch, d, G) {
    var gd = d.grid;
    var tiers = G.nodeTiers || [];
    var node = tiers.find(function (n) { return n.tier === _calc.tier; }) || tiers[0];
    if (!node) return EN.ui.panel("Target Node", "WHAT YOU'RE UP AGAINST", [noteP("#GRID data unavailable.")], { corners: true });
    var fw = _calc.fw === "none" ? null : (G.firewalls || []).find(function (f) { return f.tier === _calc.fw; });
    var security = node.security + (fw ? fw.securityBonus : 0);
    // Hardened adds the node's Tier on the shared scale (Standard 0 … Apex 5 = node.t − 1)
    var saveBonus = node.saveBonus + (_calc.hardened ? Math.max(0, node.t - 1) : 0);
    var integrity = node.integrity;
    var sel = function (label, opts, val, on) {
      return el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".08em", minWidth: "70px" }, text: label }),
        el("select", { style: { fontSize: "12px", width: "auto" }, onchange: function () { on(this.value); EN.app.render(); } },
          opts.map(function (o) { return el("option", { value: o.v, selected: o.v === val, text: o.t }); }))
      ]);
    };
    var controls = el("div.row.wrap", { style: { gap: "12px", alignItems: "center", marginBottom: "8px" } }, [
      sel("NODE TIER", (G.nodeTiers || []).map(function (n) { return { v: n.tier, t: n.tier }; }), _calc.tier, function (v) { _calc.tier = v; }),
      sel("FIREWALL", [{ v: "none", t: "None" }].concat((G.firewalls || []).map(function (f) { return { v: f.tier, t: f.tier + " (+" + f.securityBonus + " / thr " + f.threshold + ")" }; })), _calc.fw, function (v) { _calc.fw = v; }),
      el("label.row", { style: { gap: "5px", alignItems: "center", cursor: "pointer", fontSize: "11.5px", color: "var(--text2)" } }, [
        el("input", { type: "checkbox", checked: _calc.hardened, onchange: function () { _calc.hardened = this.checked; EN.app.render(); } }),
        document.createTextNode("Hardened")
      ])
    ]);
    var box = function (label, val, color, sub) {
      return el("div", { style: { flex: "1 1 120px", padding: "8px 10px", border: "1px solid var(--border2)", borderRadius: "4px", textAlign: "center" } }, [
        el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text4)" }, text: label }),
        el("div.mono", { style: { fontSize: "18px", color: color || "var(--text)" }, text: String(val) }),
        sub ? el("div", { style: { fontSize: "9.5px", color: "var(--text3)" }, text: sub } ) : null
      ]);
    };
    var grids = el("div.row.wrap", { style: { gap: "8px" } }, [
      box("SECURITY RATING", security, "var(--accent)", "beat with d20 " + eng.fmtMod(gd.effectiveAttack)),
      box("CIPHER SAVE", "+" + saveBonus, "var(--gold)", "node rolls d20 vs your DC " + gd.effectiveSaveDC),
      box("INTEGRITY", integrity == null ? "-" : integrity, integrity == null ? "var(--text3)" : "var(--flow)", integrity == null ? "Minion (1 hit bricks)" : "hits to brick"),
      box("FIREWALL THR", fw ? fw.threshold : "-", fw ? "var(--danger)" : "var(--text3)", fw ? "dmg must exceed" : "no firewall")
    ]);
    var verdict = noteP(
      (node.t <= 1 ? "Rudimentary/Standard node, Minion Rule: any successful cipher bricks it outright (Firewall threshold ignored). " : "") +
      "You hit on a roll of " + Math.max(2, security - gd.effectiveAttack) + "+ on the d20" + (gd.deck && gd.deck.type === "buddy" && node.t >= 4 ? ", but a B&E Buddy LOCKS OUT of Premium+ nodes (sparks, takes 1 HP, fails)." : "") + ".",
      (gd.deck && gd.deck.type === "buddy" && node.t >= 4) ? "var(--danger)" : "var(--text2)");
    return EN.ui.panel("Target Node", "WHAT YOU'RE UP AGAINST", [controls, grids, verdict], { corners: true });
  }

  /* ============================ REFERENCE ============================ */
  function referencePanel(ch, d, G) {
    var kids = [];
    var cb = ch.class === "codebreaker";

    if (cb) {
      var cbx = (EN.classes && EN.classes.codebreaker && EN.classes.codebreaker.extra) || {};
      kids = kids.concat(collapsible("ref-exploits", "Signature #GRID Exploits", function () {
        var list = (cbx.gridExploits || []).map(function (x) {
          return el("div.feature", null, [
            el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
              el("span", { style: { fontWeight: 600, fontSize: "13px" }, text: x.name }),
              el("span.chip", { style: { fontSize: "9px", color: "var(--accent)", borderColor: "var(--accent)" } }, x.action.toUpperCase()),
              el("span.chip", { style: { fontSize: "9px", color: "var(--gold)", borderColor: "var(--gold)" } }, "1 BW")
            ]),
            el("p.help", { style: { margin: "4px 0 0", whiteSpace: "pre-wrap" }, text: x.text })
          ]);
        });
        if (cbx.cipherCastingCosts) list.unshift(noteP(cbx.cipherCastingCosts, "var(--text2)"));
        return el("div", null, list);
      }));
    }

    kids = kids.concat(collapsible("ref-nodes", "Node Tiers", function () {
      return el("div", null, [
        tableEl([{ label: "Tier", key: "tier" }, { label: "Security", key: "security", align: "center", mono: true }, { label: "Save Bonus", get: function (r) { return "+" + r.saveBonus; }, align: "center", mono: true }, { label: "Integrity", get: function (r) { return r.integrity == null ? "-" : r.integrity; }, align: "center", mono: true }], G.nodeTiers || []),
        noteP(G.hardenedNote), noteP(G.lowSecurityNote), noteP(G.quickHackNote)
      ]);
    }));

    kids = kids.concat(collapsible("ref-cipher", "Cipher Damage by Complexity", function () {
      return el("div", null, [
        tableEl([{ label: "Complexity", get: function (r) { return r.complexity + " (CX " + r.c + ")"; } }, { label: "Damage", key: "roll", align: "center", mono: true }], G.cipherDamage || []),
        noteP(G.cipherDamageNote), noteP(G.minionRule, "var(--warn)")
      ]);
    }));

    kids = kids.concat(collapsible("ref-firewall", "Firewalls", function () {
      return el("div", null, [
        tableEl([{ label: "Tier", key: "tier" }, { label: "Price", get: function (r) { return "𝒢" + r.price.toLocaleString(); }, align: "right", mono: true }, { label: "+Security", get: function (r) { return "+" + r.securityBonus; }, align: "center", mono: true }, { label: "Threshold", key: "threshold", align: "center", mono: true }], G.firewalls || []),
        noteP(G.firewallNote)
      ]);
    }));

    kids = kids.concat(collapsible("ref-ic", "Intrusion Countermeasures", function () {
      var counter = {}; (G.icCounter || []).forEach(function (c) { counter[c.tier] = c.dmg; });
      var t = tableEl([{ label: "IC Tier", key: "tier" }, { label: "Price", get: function (r) { return "𝒢" + r.price.toLocaleString(); }, align: "right", mono: true }, { label: "Detect", get: function (r) { return "+" + r.detection; }, align: "center", mono: true }, { label: "Counter", get: function (r) { return counter[r.tier] || "-"; }, align: "center", mono: true }, { label: "Responses", get: function (r) { return r.responses.join(", "); } }], G.ic || []);
      var resp = (G.icResponses || []).map(function (r) { return el("p.help", { style: { margin: "2px 0" }, html: "<b style='color:var(--accent)'>" + r.name + ".</b> " + r.text }); });
      return el("div", null, [t, noteP(G.icIntro)].concat(resp).concat([noteP(G.interceptionNote, "var(--gold)"), noteP(G.icDetectionNote)]));
    }));

    kids = kids.concat(collapsible("ref-scan", "Scanning & Detection", function () {
      return el("div", null, [
        noteP(G.scanIntro, "var(--text2)"),
        tableEl([{ label: "Node Quality", key: "quality" }, { label: "Base DC", key: "dc", align: "center", mono: true }, { label: "Snag Dice", key: "snag", align: "center", mono: true }], G.scanning || []),
        el("div", { style: { height: "6px" } }),
        tableEl([{ label: "Modifier", key: "name" }, { label: "Condition", key: "condition" }, { label: "d20", key: "d20", align: "center", mono: true }, { label: "Dice Pool", key: "pool", align: "center" }], G.scanMods || []),
        noteP(G.scanCapNote, "var(--warn)")
      ]);
    }));

    kids = kids.concat(collapsible("ref-linkdeath", "LinkDeath & Cascade", function () {
      return el("div", null, [
        noteP(G.linkDeathIntro, "var(--text2)"), noteP(G.linkDeathResolution),
        noteP(G.cascadeFailure, "var(--danger)"), noteP(G.standardUserLinkDeath), noteP(G.sourcererLinkDeath), noteP(G.guardians, "var(--warn)")
      ]);
    }));

    kids = kids.concat(collapsible("ref-repertoire", "Repertoire & Ciphers", function () {
      return el("div", null, [
        noteP(G.repertoireNote, "var(--text2)"),
        tableEl([{ label: "Cipher Tier", key: "tier" }, { label: "Material Cost", get: function (r) { return "𝒢" + r.material; }, align: "right", mono: true }, { label: "Recovery", get: function (r) { return "𝒢" + r.recovery; }, align: "right", mono: true }], G.cipherCosts || [])
      ]);
    }));

    kids = kids.concat(collapsible("ref-buddy", "B&E Buddy Cipher Suite", function () {
      var list = (G.buddyCiphers || []).map(function (c) {
        return el("div.feature", null, [
          el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
            el("span", { style: { fontWeight: 600, fontSize: "12.5px" }, text: c.name }),
            el("span.chip", { style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" } }, c.type),
            el("span.chip", { style: { fontSize: "9px", color: "var(--text3)", borderColor: "var(--border2)" } }, c.exec),
            el("span.chip", { style: { fontSize: "9px", color: "var(--text3)", borderColor: "var(--border2)" } }, c.range)
          ]),
          el("p.help", { style: { margin: "4px 0 0" }, text: c.text })
        ]);
      });
      list.unshift(noteP(G.buddyNote, "var(--text2)"));
      return el("div", null, list);
    }));

    return EN.ui.panel("Reference", "THE #GRID · RULES & GEAR", kids, { corners: true });
  }

  /* ============================ RENDER ============================ */
  function render(mount) {
    var ch = store.active();
    EN.ui.clear(mount);
    if (!ch) { mount.appendChild(el("p.help", { text: "No #PRINT loaded." })); return; }
    var d = eng.derive(ch), G = EN.grid || {};
    var blocks = [];

    blocks.push(el("div", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", margin: "0 0 2px", letterSpacing: ".04em" }, html: "THE <span style='color:var(--accent)'>#GRID</span> <span style='font-family:var(--disp);font-size:12px;color:var(--text3);letter-spacing:.18em'>// SMARTDECK · CIPHERS · LINKS</span>" }),
      el("p.help", { style: { margin: 0, maxWidth: "780px" }, text: G.intro || "" })
    ]));

    // two-column-ish: rig + (stats over links), then target, then reference
    blocks.push(el("div.modgrid6", { style: { marginBottom: "0" } }, [
      el("div", { style: { gridColumn: "span 3", minWidth: 0 } }, [rigPanel(ch, d, G)]),
      el("div", { style: { gridColumn: "span 3", minWidth: 0, display: "flex", flexDirection: "column", gap: "14px" } }, [statsPanel(ch, d), linksPanel(ch, d, G)])
    ]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [targetPanel(ch, d, G)]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [referencePanel(ch, d, G)]));

    mount.appendChild(el("div", null, blocks));
  }

  return { render: render };
})();
