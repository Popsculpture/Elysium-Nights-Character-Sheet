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
  var _cipherView = "power";                         // Codebreaker Ciphers panel: "power" | "buddy"
  var _stabilityOpen = false;                         // STABILITY stat: tap to expand the damage tracker

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
  // Bandwidth lives on resources.current (not ch.grid), like every other class resource.
  function setBandwidth(n) { store.update(function (c) { c.resources = c.resources || {}; c.resources.current = c.resources.current || {}; c.resources.current.Bandwidth = n; }); }
  // Cipher casting cost: Complexity 0 free, 1-3 = 1 BW, 4-5 = 2 BW, Signature flat 1 BW.
  function cipherCost(cy) { var cx = cy.cx || 0; if (cx <= 0) return 0; if (cy.signature) return 1; return cx <= 3 ? 1 : 2; }
  // Category accent: Offense red, Protection green, Manipulation purple.
  function catColor(cat) { return cat === "Offense" ? "var(--danger)" : cat === "Protection" ? "var(--success)" : "var(--flow)"; }

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
    if (!ownedSmartdecks.length && !ownedBuddies.length) selChildren.push(el("option", { disabled: true, text: "No rigs in stash; buy one in Inventory" }));

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
          el("span.mono", { style: { fontSize: "13px", color: "var(--bw)" }, text: bwCur + " / " + bwMax + "  ·  Caliber + Tech" })
        ]),
        bar(bwCur, bwMax, "var(--bw)"),
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

    // Smartdeck mods: read-only on the #GRID. Install and remove live at the Tech Bay (Inventory > Workbench).
    if (deck.type === "smartdeck") {
      var installed = grid.deckMods || [], used = 0;
      (G.mods || []).forEach(function (m) { if (installed.indexOf(m.key) !== -1) used += m.slots; });
      var slots = deck.modSlots;
      var installedMods = (G.mods || []).filter(function (m) { return installed.indexOf(m.key) !== -1; });
      rows.push(el("div.section-title", { style: { margin: "14px 0 4px" } }, [document.createTextNode("Hardware Mods"), el("span.line"),
        el("span.mono", { style: { fontSize: "10px", color: used > slots ? "var(--danger)" : "var(--text3)", marginLeft: "6px" }, text: used + " / " + slots + " slots" })]));
      if (slots === 0) rows.push(noteP("A Standard Smartdeck has no mod slots. Upgrade the deck to install hardware mods."));
      else if (!installedMods.length) rows.push(noteP("No hardware mods installed. Fit them at the Tech Bay (Inventory > Workbench > Tech Bay)."));
      else {
        rows.push(el("div.row.wrap", { style: { gap: "6px" } }, installedMods.map(function (m) {
          return el("span.chip", { title: m.type + ": " + m.text, style: { fontSize: "9.5px", color: "var(--accent)", borderColor: "var(--accent)" } }, m.name + " · " + m.slots + (m.slots === 1 ? " slot" : " slots"));
        })));
        rows.push(noteP("Add or remove hardware mods at the Tech Bay (Inventory > Workbench > Tech Bay)."));
      }
    }
    return EN.ui.panel("Rig", (deck.type === "smartdeck" ? "SMARTDECK" : "B&E BUDDY") + " · " + deck.tier.toUpperCase(), rows, { corners: true });
  }

  /* ===================== CIPHERS & BANDWIDTH ======================
     Power Users (Codebreakers) get a Bandwidth tracker, usable Signature #GRID
     Exploits, and a player-managed Repertoire (the full cipher library lives in
     the rulebook, not the app, so the player hand-tracks what they know). Everyone
     else is a Standard User and gets the universal B&E Buddy cipher list. */
  // One acquired-cipher card in the Repertoire: collapsible detail, complexity-gated CAST.
  function cipherCard(cy, runCx, bwCur) {
    var cx = cy.cx || 0, cost = cipherCost(cy);
    var castable = runCx >= cx, can = castable && bwCur >= cost;
    var key = "cipher-" + cy.name, open = !!_open[key], color = catColor(cy.cat);
    return el("div.feature", { style: { borderLeftColor: castable ? color : "var(--border2)", opacity: castable ? 1 : .6 } }, [
      el("div.row.between", { style: { alignItems: "center", gap: "8px" } }, [
        el("span", { style: { fontWeight: 600, fontSize: "13px", cursor: "pointer" }, onclick: function () { _open[key] = !open; EN.app.render(); } },
          [el("span.collapse-caret", { text: open ? "▾ " : "▸ " }), document.createTextNode(cy.name)]),
        el("div.row.wrap", { style: { gap: "6px", alignItems: "center", justifyContent: "flex-end" } }, [
          el("span.chip", { style: { fontSize: "9px", color: color, borderColor: color }, title: cy.cat + " · " + cy.sub }, "CX " + cx),
          cy.signature ? el("span.chip", { style: { fontSize: "9px", color: "var(--gold)", borderColor: "var(--gold)" }, title: "Signature cipher: flat 1 Bandwidth" }, "SIG") : null,
          el("span.chip", { style: { fontSize: "9px", color: "var(--text3)", borderColor: "var(--border2)" } }, cost === 0 ? "FREE" : cost + " BW"),
          el("button.btn.sm", { disabled: !can, title: !castable ? "Your rig can't run Complexity " + cx : (bwCur < cost ? "Not enough Bandwidth" : "Run: spend " + (cost === 0 ? "no" : cost) + " Bandwidth"),
            style: can ? { color: "var(--accent)", borderColor: "var(--accent)" } : null,
            onclick: function () { if (can) { if (cost) setBandwidth(Math.max(0, bwCur - cost)); toast(cy.name + (cost ? " · −" + cost + " Bandwidth" : " · run")); } } }, "RUN")
        ])
      ]),
      open ? el("p.help", { style: { margin: "4px 0 1px", color: "var(--text2)", fontFamily: "var(--mono)", fontSize: "10px" },
        text: cy.cat + " (" + cy.sub + ") · " + cy.exec + " · " + cy.range + " · " + cy.runtime + (cy.link ? " · needs Link" : "") }) : null,
      open ? el("p.help", { style: { margin: "2px 0 0" }, text: cy.text }) : null
    ]);
  }

  function buddyCipherCard(cy) {
    return el("div.feature", { style: { borderLeftColor: "var(--border2)" } }, [
      el("div.row.between", { style: { alignItems: "center", gap: "8px" } }, [
        el("span", { style: { fontWeight: 600, fontSize: "13px" }, text: cy.name }),
        el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
          cy.type ? el("span.chip", { style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" } }, cy.type) : null,
          cy.exec ? el("span.chip", { style: { fontSize: "9px", color: "var(--text3)", borderColor: "var(--border2)" } }, cy.exec) : null
        ])
      ]),
      el("p.help", { style: { margin: "4px 0 0" }, html: (cy.range ? "<b>" + cy.range + "</b> · " : "") + cy.text })
    ]);
  }
  function cipherViewToggle(label, to) {
    return el("button.btn.sm", { style: { fontSize: "10px", color: "var(--accent)", borderColor: "var(--accent)" },
      onclick: function () { _cipherView = to; EN.app.render(); } }, label);
  }

  function ciphersPanel(ch, d, G) {
    var gd = d.grid, rows = [];
    // A Codebreaker normally runs a Smartdeck, but if they swap to a B&E Buddy they can
    // flip the panel to the Standard-User cipher suite that rig actually runs.
    var buddyEquipped = gd.isCodebreaker && gd.deck && gd.deck.type === "buddy";
    if (buddyEquipped && _cipherView === "buddy") {
      rows.push(noteP("You're running a B&E Buddy: this rig executes the Standard-User cipher suite only (Complexity 0). Switch back to a Smartdeck in the Rig panel to use your Repertoire and Bandwidth."));
      (G.buddyCiphers || []).forEach(function (cy) { rows.push(buddyCipherCard(cy)); });
      return EN.ui.panel("Ciphers", "B&E BUDDY CIPHER SUITE", rows, { corners: true, headerRight: cipherViewToggle("Repertoire", "power") });
    }

    if (gd.isCodebreaker) {
      var res = d.resource;
      var bwMax = (res && res.name === "Bandwidth") ? res.max : 0;
      var bwCur = (ch.resources && ch.resources.current && ch.resources.current.Bandwidth != null) ? ch.resources.current.Bandwidth : bwMax;
      bwCur = eng.clamp(bwCur, 0, bwMax);
      // Bandwidth pool lives in the Rig panel; cipher/exploit costs below still read bwCur.
      var firstSection = true;   // the first section hugs the panel top (no extra margin)

      // ---- Signature #GRID Exploits ----
      var exploits = eng.resourceAbilities(ch) || [];
      if (exploits.length) {
        rows.push(el("div.section-title", { style: { margin: (firstSection ? "2px" : "14px") + " 0 4px" } }, [document.createTextNode("Signature #GRID Exploits"), el("span.line")]));
        firstSection = false;
        rows.push(noteP("Each costs 1 Bandwidth; meet its recharge trigger to refund it (use + to restore). USE spends the Bandwidth now."));
        exploits.forEach(function (ab) {
          var k = "exploit-" + ab.name, open = !!_open[k];
          var cost = ab.cost || 1, can = bwCur >= cost;
          rows.push(el("div.feature", { style: { borderLeftColor: "var(--accent)" } }, [
            el("div.row.between", { style: { alignItems: "center", gap: "8px" } }, [
              el("span", { style: { fontWeight: 600, fontSize: "13px", cursor: "pointer" }, onclick: function () { _open[k] = !open; EN.app.render(); } },
                [el("span.collapse-caret", { text: open ? "▾ " : "▸ " }), document.createTextNode(ab.name)]),
              el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
                ab.action ? el("span.chip", { style: { fontSize: "9px", color: "var(--text3)", borderColor: "var(--border2)" } }, ab.action.replace(/ Action$/, "")) : null,
                el("span.chip", { style: { fontSize: "9px", color: "var(--accent)", borderColor: "var(--accent)" } }, cost + " BW"),
                el("button.btn.sm", { disabled: !can, title: can ? "Spend " + cost + " Bandwidth" : "Not enough Bandwidth", style: can ? { color: "var(--accent)", borderColor: "var(--accent)" } : null,
                  onclick: function () { if (can) { setBandwidth(Math.max(0, bwCur - cost)); toast(ab.name + " · −" + cost + " Bandwidth"); } } }, "USE")
              ])
            ]),
            open ? el("p.help", { style: { margin: "4px 0 0" }, text: ab.text }) : null,
            open && ab.recharge ? el("p.help", { style: { margin: "4px 0 0", color: "var(--success)" }, text: "Recharge: " + ab.recharge }) : null
          ]));
        });
      }

      // ---- Repertoire (drawn from ciphers acquired in the gray market) ----
      var deck = gd.deck;
      var runCx = deck ? (deck.type === "smartdeck" ? deck.maxComplexity : 0) : -1;  // highest Complexity this rig casts; -1 = no rig
      var cipherByName = {}; (G.ciphers || []).forEach(function (c) { cipherByName[c.name] = c; });
      var owned = (ch.equipment || []).map(function (e) { return (e.qty > 0) ? cipherByName[e.name] : null; })
        .filter(Boolean).sort(function (a, b) { return (a.cx - b.cx) || a.name.localeCompare(b.name); });
      rows.push(el("div.section-title", { style: { margin: (firstSection ? "2px" : "14px") + " 0 4px" } }, [document.createTextNode("Repertoire"), el("span.line"),
        el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", marginLeft: "6px" }, text: owned.length + " acquired" })]));
      rows.push(noteP(deck
        ? (deck.type === "smartdeck"
            ? ("Your " + deck.tier + " Smartdeck runs ciphers up to Complexity " + runCx + ". Higher ones stay in your Repertoire but won't cast until you upgrade. Plus the 6 free Complexity 0 ciphers (see B&E Buddy Cipher Suite).")
            : "You're on a B&E Buddy: only the free Complexity 0 suite runs (see B&E Buddy Cipher Suite). Acquired ciphers won't cast until you equip a Smartdeck.")
        : "No rig equipped. Equip a Smartdeck in the Rig panel to cast ciphers."));
      if (!owned.length) {
        rows.push(noteP("No ciphers acquired yet. Buy them in the Inventory tab's gray market (Cipher Library), then cast them here.", "var(--text2)"));
      } else {
        owned.forEach(function (cy) { rows.push(cipherCard(cy, runCx, bwCur)); });
      }
      rows.push(noteP("Casting costs: Complexity 0 free · 1-3 = 1 BW · 4-5 = 2 BW · Signature Ciphers a flat 1 BW.", "var(--text2)"));
      return EN.ui.panel("Ciphers", "EXPLOITS · REPERTOIRE", rows,
        { corners: true, headerRight: buddyEquipped ? cipherViewToggle("B&E Buddy Cipher Suite", "buddy") : null });
    }

    // ---- Standard User: the universal B&E Buddy / Burner Relay cipher set ----
    rows.push(noteP("Standard Users run this universal cipher set off any B&E Buddy or Burner Relay (Complexity 0 only). Bandwidth, higher-Complexity ciphers, and a custom Repertoire are the Codebreaker's domain."));
    (G.buddyCiphers || []).forEach(function (cy) { rows.push(buddyCipherCard(cy)); });
    return EN.ui.panel("Ciphers", "STANDARD USER CIPHER LIST", rows, { corners: true });
  }

  /* ============================ HACKING STATS ============================ */
  // Live Stability DC control: record the damage taken this turn while linked and
  // the disconnection DC updates to the higher of the rig floor or half that damage.
  function stabilityDamageControl(gd) {
    var driven = gd.stabilityDcFromDamage > gd.stabilityDcBase;
    var dcSpan = el("span.mono", { style: { fontSize: "17px", color: driven ? "var(--danger)" : "var(--accent)" }, text: "DC " + gd.stabilityDcLive });
    var explSpan = el("span", { style: { fontSize: "10.5px", color: "var(--text3)", flex: "1 1 120px", minWidth: "120px" } });
    function expl(dmg, live, isDriven) {
      return isDriven ? "½ of " + dmg + " beats the DC " + gd.stabilityDcBase + " floor"
        : (dmg > 0 ? "DC " + gd.stabilityDcBase + " floor holds (½ of " + dmg + " is " + Math.floor(dmg / 2) + ")" : "DC " + gd.stabilityDcBase + " floor, auto-fills from your last hit on the Freelancer tab");
    }
    explSpan.textContent = expl(gd.stabilityLastDamage, gd.stabilityDcLive, driven);
    var input = el("input", { type: "number", min: "0", value: gd.stabilityLastDamage || "", placeholder: "0",
      title: "Damage taken this turn while linked; auto-pulls the last damage you applied on the Freelancer tab",
      style: { width: "62px", textAlign: "center", fontFamily: "var(--mono)" },
      oninput: function () {
        var v = Math.max(0, parseInt(this.value, 10) || 0);
        gset(function (g, c) { c.lastDamage = v; }, true);   // silent: keep focus while typing
        var live = Math.max(gd.stabilityDcBase, Math.floor(v / 2)), d2 = Math.floor(v / 2) > gd.stabilityDcBase;
        dcSpan.textContent = "DC " + live; dcSpan.style.color = d2 ? "var(--danger)" : "var(--accent)";
        explSpan.textContent = expl(v, live, d2);
      },
      onchange: function () { EN.app.render(); } });   // commit: sync the LinkDeath panel
    return el("div.row.wrap", { style: { gap: "9px", alignItems: "center", margin: "2px 0 4px", padding: "8px 10px", border: "1px solid var(--border2)", borderRadius: "4px", background: "rgba(0,0,0,.18)" } }, [
      el("span", { style: { fontFamily: "var(--disp)", fontSize: "9.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "DAMAGE TAKEN THIS TURN" }),
      input,
      el("span.mono", { style: { fontSize: "12px", color: "var(--text3)" }, text: "→ STABILITY" }),
      dcSpan, explSpan,
      el("button.btn.sm", { title: "Clear for a new turn", style: { color: "var(--text3)" }, onclick: function () { gset(function (g, c) { c.lastDamage = 0; }); } }, "NEW TURN")
    ]);
  }

  // Compact STABILITY stat that taps open into the full damage tracker. Stays
  // live even while collapsed (the DC reflects the last Freelancer-tab hit).
  function stabilityStat(gd) {
    var driven = gd.stabilityDcFromDamage > gd.stabilityDcBase;
    var caret = _stabilityOpen ? " ▾" : " ▸";
    var sub = (driven ? "½ of " + gd.stabilityLastDamage + " dmg"
      : (gd.stabilityDcMod ? (gd.stabilityDcMod > 0 ? "+" : "") + gd.stabilityDcMod + " from rig" : "or ½ dmg taken")) + caret;
    var node = EN.ui.stat("STABILITY", "DC " + gd.stabilityDcLive, sub);
    if (driven) { var v = node.querySelector(".v"); if (v) v.style.color = "var(--danger)"; }
    node.style.cursor = "pointer";
    node.title = _stabilityOpen ? "Tap to collapse the damage tracker" : "Tap to log damage taken this turn while linked";
    node.onclick = function () { _stabilityOpen = !_stabilityOpen; EN.app.render(); };
    return node;
  }

  function statsPanel(ch, d) {
    var gd = d.grid, fmt = eng.fmtMod;
    var stats = [
      EN.ui.stat("CIPHER ATK", fmt(gd.effectiveAttack), gd.deck ? (gd.deck.type === "buddy" ? "Buddy bonus" : "Tech+Systems+dev") : "Tech+Systems"),
      EN.ui.stat("SAVE DC", gd.effectiveSaveDC, gd.deck && gd.deck.type === "buddy" ? "Buddy DC" : "8+Tech+Systems"),
      EN.ui.stat("LINKS", gd.unlimitedLinks ? "∞" : gd.maxLinks, gd.isCodebreaker ? (gd.unlimitedLinks ? "SysAdmin" : "2 × Caliber" + (gd.modLinks ? " +" + gd.modLinks : "")) : "Standard User"),
      stabilityStat(gd)
    ];
    if (gd.quickHackBonus != null) stats.splice(1, 0, EN.ui.stat("QUICK HACK", fmt(gd.quickHackBonus), "+ Device Bonus"));
    var body = [el("div.stat-row", null, stats)];
    if (_stabilityOpen) body.push(stabilityDamageControl(gd));
    body.push(noteP("Cipher Attack: d20 " + fmt(gd.cipherAttackBonus) + " vs node Security Rating" + (gd.deck && gd.deck.type === "smartdeck" && gd.deck.deviceBonus ? " (+" + gd.deck.deviceBonus + " Device Bonus = " + fmt(gd.effectiveAttack) + " on a Quick Hack)" : "") + ". Node resists save-ciphers with d20 + its Cipher Save Bonus vs your Save DC " + gd.effectiveSaveDC + ".", "var(--text2)"));
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
        el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".12em", color: "var(--danger)" }, text: "LINKDEATH RISK" }) ]),
      noteP("Fail a Stability Check (Body or Wits, vs the higher of DC " + gd.stabilityDcBase + " or ½ the damage taken this turn, set in the Hacking panel) → all Links sever and you take " + dmg + " Psychic, Unconscious." + (links.length >= 2 ? " Fail by 5+ with 2+ Links = Cascade Failure (deck auto-Bricked)." : " Succeed → ride it: half damage, Dazed."), links.length >= 2 ? "var(--danger)" : "var(--text3)")
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
    blocks.push(el("div", { style: { marginTop: "14px" } }, [ciphersPanel(ch, d, G)]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [targetPanel(ch, d, G)]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [referencePanel(ch, d, G)]));

    mount.appendChild(el("div", null, blocks));
  }

  return { render: render };
})();
