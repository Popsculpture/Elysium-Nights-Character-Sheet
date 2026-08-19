/* ===========================================================================
   ELYSIUM NIGHTS · The #GRID tab
   Play-time hacking console: your rig (Smartdeck / B&E Buddy) with System Integrity +
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
  // Run Mode: HOT RUN = in-combat d20 math; DEEP RUN = out-of-combat Dice Pool intrusion
  var _runMode = "hot";
  var _deep = { edges: {}, snags: {}, kitsOff: {}, risk: 2, result: null, animating: false, animToken: 0, focusSrc: "skill" };

  // Battle Damage: the whole #GRID tab visibly degrades as rig System Integrity drops.
  // Device-level preference, matching the Flow immersive pattern (en_flow_*).
  var DMG_KEY = "en_grid_damage_v1", DMG_INT_KEY = "en_grid_damage_intensity_v1";
  var _dmgOn = true, _dmgIntensity = "auto";               // default: on, follow live Integrity
  try { _dmgOn = localStorage.getItem(DMG_KEY) !== "0"; } catch (e) {}
  try { var _dv = localStorage.getItem(DMG_INT_KEY); if (_dv) _dmgIntensity = _dv; } catch (e) {}
  function isDamage() { return _dmgOn; }
  function setDamage(on) { _dmgOn = !!on; try { localStorage.setItem(DMG_KEY, on ? "1" : "0"); } catch (e) {} }
  function getDmgIntensity() { return _dmgIntensity; }
  function setDmgIntensity(v) { _dmgIntensity = String(v); try { localStorage.setItem(DMG_INT_KEY, _dmgIntensity); } catch (e) {} }

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
  /* Casting cost: Complexity 0 free, 1-3 cost 1 Bandwidth, 4-5 cost 2, Signature a flat 1.
     THE QUANTUM CORE TRAIT IS THE EXCEPTION (Part 2, verified 2026-08-19): "ciphers of
     Complexity 4 or 5 cost 1 Bandwidth instead of 2". It is the TRAIT'S rule, not a property
     of the tier. Matching on "Apex" is exact today because Quantum Core sits on the Apex row
     and nothing else grants it, and a deck keeps every lower tier's traits rather than
     swapping them. If anything ever grants Quantum Core to a lesser rig, this becomes a
     lookup against the deck's trait list rather than its tier name. */
  function cipherCost(cy, deckTier) {
    var cx = cy.cx || 0;
    if (cx <= 0) return 0;
    if (cy.signature) return 1;
    if (cx <= 3) return 1;
    return deckTier === "Apex" ? 1 : 2;
  }
  // Category accent: Offense red, Protection green, Manipulation purple.
  function catColor(cat) { return cat === "Offense" ? "var(--danger)" : cat === "Protection" ? "var(--success)" : "var(--flow)"; }

  /* ============================ RIG ============================ */
  function rigPanel(ch, d, G) {
    var grid = ch.grid || {}, gd = d.grid, deck = gd.deck;
    var rows = [];

    // rig selector: only show owned smartdecks/buddies from the character's inventory.
    // Trauma Rigs are enumerated too, but not here: they are not hacking platforms, so
    // they cannot be your deck. They appear below as the #GRID node each one projects,
    // which is what makes a Rig reachable from this tab at all.
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
      return el("option", { value: "smartdeck:" + s.tier, selected: grid.deckType === "smartdeck" && grid.deckTier === s.tier, text: s.tier + " · +" + s.deviceBonus + " dev · " + s.integrity + " HP" });
    })));
    if (ownedBuddies.length) selChildren.push(el("optgroup", { label: "B&E Buddies (Standard User)" }, ownedBuddies.map(function (b) {
      return el("option", { value: "buddy:" + b.tier, selected: grid.deckType === "buddy" && grid.deckTier === b.tier, text: b.tier + " · +" + b.attack + " atk · " + b.integrity + " HP" });
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

    /* A Trauma Rig is powered gear: it projects a #GRID node at its own Tier and is a
       valid #GRID target, so it belongs on this tab and not only on the Freelancer tab.
       Object facts come off d.rig, which the engine resolves for every class, so the
       node tier and the Integrity total here are the same numbers the Rig block shows.
       Purely the OBJECT: no Output Bonus, no Triage Save DC, nothing class-flavoured. */
    function traumaRigRows() {
      var t = d.rig;
      if (!t || !t.rigTier) return [];
      var T = EN.traumaRigs || {};
      var maxI = t.maxIntegrity, curI = t.integrity, br = t.bricked;
      var amtR = el("input.mono", { type: "number", min: "1", value: "1", title: "Amount of System Integrity to subtract or restore",
        style: { width: "56px", textAlign: "center", padding: "4px 6px" } });
      // damage is written under the live Rig's own entry key and accumulates off the
      // derived spend, so it lands on this object and no other Rig's total moves
      function shiftRig(sign) {
        var n = Math.max(1, parseInt(amtR.value, 10) || 1), key = t.rigKey, base = t.integritySpent;
        if (!key) return;
        store.update(function (c) {
          c.rig = c.rig || {}; c.rig.hp = c.rig.hp || {};
          var v = eng.clamp(base + sign * n, 0, maxI);
          if (v > 0) c.rig.hp[key] = v; else delete c.rig.hp[key];
        });
      }
      return [
        el("div.section-title", { style: { margin: "14px 0 4px" } }, [document.createTextNode("Trauma Rig Node"), el("span.line"),
          el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", marginLeft: "6px" }, text: (t.rigLabel || "").toUpperCase() })]),
        el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
          t.nodeTier ? el("span.chip", { style: { fontSize: "9.5px", color: "var(--bw)", borderColor: "var(--bw)" },
            title: T.integrityNote || "" }, "NODE " + t.nodeTier.toUpperCase()) : null,
          el("span.chip", { style: { fontSize: "9.5px", color: "var(--text2)", borderColor: "var(--border2)" },
            title: "Modification Slots equal the Rig's Tier" }, "TIER " + t.rigTierIndex)
        ]),
        el("div", { style: { marginTop: "8px" } }, [
          el("div.row.between", { style: { alignItems: "baseline" } }, [
            el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".12em", color: "var(--text3)" }, text: "RIG INTEGRITY" }),
            el("span.mono", { style: { fontSize: "13px", color: br ? "var(--danger)" : "var(--text2)" }, text: br ? "BRICKED" : curI + " / " + maxI })
          ]),
          bar(curI, maxI, br ? "var(--danger)" : "var(--success)"),
          el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, [
            amtR,
            el("button.btn.sm", { disabled: br, title: "Subtract this much Integrity",
              style: { color: "var(--danger)", borderColor: "var(--danger)" }, onclick: function () { shiftRig(1); } }, "− DAMAGE"),
            el("button.btn.sm", { disabled: t.integritySpent <= 0, title: "Restore this much Integrity",
              onclick: function () { shiftRig(-1); } }, "+ REPAIR"),
            t.integritySpent > 0 ? el("button.btn.sm", { style: { color: "var(--text2)" },
              onclick: function () { var key = t.rigKey; store.update(function (c) { c.rig = c.rig || {}; if (c.rig.hp) delete c.rig.hp[key]; }); toast("Trauma Rig restored to full Integrity."); } }, "⟳ FULL") : null
          ])
        ]),
        noteP(T.integrityNote || "")
      ];
    }

    if (!deck) {
      rows.push(noteP("No rig selected. Codebreakers run a Smartdeck (Power User); everyone else can crack low-tier nodes with a B&E Buddy."));
      traumaRigRows().forEach(function (r) { rows.push(r); });
      return EN.ui.panel("Rig", "SMARTDECK / B&E BUDDY", rows, { corners: true });
    }

    // System Integrity: damage subtracts (cipher damage after the Firewall, physical
    // damage at full value). Amounts are rolled, so take a typed number, not a +1 tick.
    var maxInt = deck.maxIntegrity, spent = grid.deckHpSpent || 0, cur = Math.max(0, maxInt - spent), bricked = cur <= 0;
    var amtInput = el("input.mono", { type: "number", min: "1", value: "1", title: "Amount of System Integrity to subtract or restore",
      style: { width: "56px", textAlign: "center", padding: "4px 6px" } });
    function shiftIntegrity(sign) {
      var n = Math.max(1, parseInt(amtInput.value, 10) || 1);
      gset(function (g) { g.deckHpSpent = eng.clamp((g.deckHpSpent || 0) + sign * n, 0, maxInt); });
    }
    rows.push(el("div", { style: { marginTop: "10px" } }, [
      el("div.row.between", { style: { alignItems: "baseline" } }, [
        el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".12em", color: "var(--text3)" }, text: "SYSTEM INTEGRITY" }),
        el("span.mono", { style: { fontSize: "13px", color: bricked ? "var(--danger)" : "var(--text2)" }, text: bricked ? "BRICKED" : cur + " / " + maxInt })
      ]),
      bar(cur, maxInt, bricked ? "var(--danger)" : "var(--success)"),
      el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, [
        amtInput,
        el("button.btn.sm", { disabled: bricked, title: "Subtract this much System Integrity",
          style: { color: "var(--danger)", borderColor: "var(--danger)" }, onclick: function () { shiftIntegrity(1); } }, "− DAMAGE"),
        el("button.btn.sm", { disabled: spent <= 0, title: "Restore this much System Integrity",
          onclick: function () { shiftIntegrity(-1); } }, "+ REPAIR"),
        spent > 0 ? el("button.btn.sm", { style: { color: "var(--text2)" }, onclick: function () { gset(function (g) { g.deckHpSpent = 0; }); toast("Rig restored to full Integrity."); } }, "⟳ FULL") : null
      ]),
      el("span.help", { style: { margin: "4px 0 0", fontSize: "10.5px", display: "block" },
        text: bricked ? "Bricked; all Links sever (LinkDeath as a forced disconnect). Downtime repair only."
                      : "Cipher damage subtracts after the Firewall Threshold; physical damage lands at full value." })
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
    traumaRigRows().forEach(function (r) { rows.push(r); });
    return EN.ui.panel("Rig", (deck.type === "smartdeck" ? "SMARTDECK" : "B&E BUDDY") + " · " + deck.tier.toUpperCase(), rows, { corners: true });
  }

  /* ===================== CIPHERS & BANDWIDTH ======================
     Power Users (Codebreakers) get a Bandwidth tracker, usable Signature #GRID
     Exploits, and a player-managed Repertoire (the full cipher library lives in
     the rulebook, not the app, so the player hand-tracks what they know). Everyone
     else is a Standard User and gets the universal B&E Buddy cipher list. */
  // One acquired-cipher card in the Repertoire: collapsible detail, complexity-gated CAST.
  function cipherCard(cy, runCx, bwCur, deckTier) {
    var cx = cy.cx || 0, cost = cipherCost(cy, deckTier);
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
        owned.forEach(function (cy) { rows.push(cipherCard(cy, runCx, bwCur, deck && deck.tier)); });
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
    function expl(dmg, isDriven) {
      return isDriven ? "½ of " + dmg + " beats the DC " + gd.stabilityDcBase + " floor"
        : (dmg > 0 ? "DC " + gd.stabilityDcBase + " floor holds (½ of " + dmg + " is " + Math.floor(dmg / 2) + ")" : "DC " + gd.stabilityDcBase + " floor, auto-fills from your last hit on the Freelancer tab");
    }
    explSpan.textContent = expl(gd.stabilityLastDamage, driven);
    var input = el("input", { type: "number", min: "0", value: gd.stabilityLastDamage || "", placeholder: "0",
      title: "Damage taken this turn while linked; auto-pulls the last damage you applied on the Freelancer tab",
      style: { width: "62px", textAlign: "center", fontFamily: "var(--mono)" },
      oninput: function () {
        var v = Math.max(0, parseInt(this.value, 10) || 0);
        gset(function (g, c) { c.lastDamage = v; }, true);   // silent: keep focus while typing
        var live = Math.max(gd.stabilityDcBase, Math.floor(v / 2)), d2 = Math.floor(v / 2) > gd.stabilityDcBase;
        dcSpan.textContent = "DC " + live; dcSpan.style.color = d2 ? "var(--danger)" : "var(--accent)";
        explSpan.textContent = expl(v, d2);
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
      EN.ui.stat("PASSIVE SYS", gd.passiveSystems, "vs hidden Scan DC"),
      EN.ui.stat("LINKS", gd.unlimitedLinks ? "∞" : gd.maxLinks,
        gd.isCodebreaker ? (gd.unlimitedLinks ? "SysAdmin" : "2 × Caliber" + (gd.modLinks ? " +" + gd.modLinks : ""))
        : gd.isSourcerer ? "Caliber · sprites" : "Standard User"),
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
    // LinkDeath risk. Feedback is 2d6 PER severed Link, and the failed Stability
    // Check's margin decides how hard it lands (soft landing vs hard landing).
    var n = Math.max(1, links.length);
    var poolAll = (2 * n) + "d6";
    rows.push(el("div", { style: { marginTop: "8px", padding: "8px 10px", border: "1px solid " + (links.length >= 2 ? "var(--danger)" : "var(--border2)"), borderRadius: "4px", background: "rgba(0,0,0,.18)" } }, [
      el("div.row.between", { style: { alignItems: "baseline" } }, [
        el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".12em", color: "var(--danger)" }, text: "LINKDEATH RISK" }) ]),
      noteP("Fail a Stability Check (Body or Wits, vs the higher of DC " + gd.stabilityDcBase + " or ½ the damage taken this turn, set in the Hacking panel) and one Link of your choice tears away. Every Link severed involuntarily deals 2d6 Psychic feedback.", "var(--text3)"),
      noteP("Failed by 4 or less: half the feedback, Dazed until the end of your next turn. Failed by 5 or more: full feedback and Unconscious (Wits Save vs the same DC at the end of each of your turns to wake, Dazed).", links.length >= 2 ? "var(--danger)" : "var(--text3)"),
      noteP("Falling Unconscious severs every Link you hold: roll 2d6 per Link as one pool (" + poolAll + " at " + n + " Link" + (n === 1 ? "" : "s") + "). Your Smartdeck absorbs it first, subtracting from its remaining System Integrity with no Firewall applied; if the deck hits 0 it is Bricked and every point beyond spills into you as Psychic damage in full. A deckless user has no hardware in the way.", "var(--text3)"),
      links.length >= 2 ? noteP("Cascade Failure: losing a Link while holding others forces a fresh Stability Check for the rest, at a DC that now counts that feedback in the turn's damage total.", "var(--danger)") : null
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
        tableEl([{ label: "Concealment", key: "quality" }, { label: "Scan DC", key: "dc", align: "center", mono: true }, { label: "Reads As", key: "reads" }], G.scanning || []),
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
        tableEl([{ label: "Cipher Tier", key: "tier" },
                 { label: "CX", key: "cx", align: "center", mono: true },
                 { label: "Craft (half)", get: function (r) { return r.craft != null ? "𝒢" + r.craft : "-"; }, align: "right", mono: true },
                 { label: "Acquire Clean", get: function (r) { return "𝒢" + r.material; }, align: "right", mono: true },
                 { label: "Recovery", get: function (r) { return "𝒢" + r.recovery; }, align: "right", mono: true }], G.cipherCosts || [])
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

  /* ============================ DEEP RUN (Dice Pool) ============================
     Hacking resolves by pace: a combat round is d20 (Hot Run), but extended
     out-of-combat intrusion runs the Dice Pool Method. This console builds the
     pool live: Tech + Systems proficiency + the deck's Device Bonus as gear
     dice, Focus/Specialization, owned Systems kits, and the rulebook's hacking
     Edge/Snag sources, then rolls it with the shared animated dice. */
  var DEEP_EDGES = [
    { key: "code",   name: "Superior code",      hint: "Custom intrusion software beyond your stock suite" },
    { key: "creds",  name: "Stolen credentials", hint: "A legitimate login the node trusts" },
    { key: "back",   name: "Hidden backdoor",    hint: "A way in someone left open" },
    { key: "local",  name: "Local access",       hint: "You are on-site, jacked into the hardware" }
  ];
  var DEEP_SNAGS = [
    { key: "ice",    name: "ICE resistance",     hint: "Active countermeasures fighting back" },
    { key: "unst",   name: "Unstable access",    hint: "A flaky connection or borrowed uplink" },
    { key: "trace",  name: "Trace lock",         hint: "Something already has your scent" },
    { key: "degr",   name: "Degraded hardware",  hint: "Damaged deck, bad lines, salvage parts" }
  ];
  function deepOwned(ch, name) { return (ch.equipment || []).some(function (e) { return e.name === name && e.qty > 0; }); }
  // owned Systems-Tools kits with a printed pool Edge, honoring Proficient Use
  function deepKits(ch) {
    var items = (EN.gearCatalog && EN.gearCatalog.tools && EN.gearCatalog.tools.items) || [];
    var prof = !!((ch.proficiencies && ch.proficiencies.tools) || {})["Systems Tools"];
    return items.filter(function (it) {
      return it.category === "Systems Tools" && it.edgeDice > 0 && deepOwned(ch, it.name) && (!it.requiresProficient || prof);
    });
  }
  function deepEdge(ch, d, gd) {
    var s = (d.skills || []).find(function (x) { return x.key === "systems"; });
    var parts = [];
    var attr = Math.max(0, d.attributes.TEC.mod);
    if (attr) parts.push({ label: "Tech Modifier", value: attr });
    var prof = s ? (((EN.rules.profTiers[s.tier] || {}).pool) || 0) : 0;
    if (prof) parts.push({ label: "Systems Proficiency Bonus (" + (EN.rules.profTiers[s.tier] || {}).name + ")", value: prof });
    if (gd.deck && gd.deck.type === "smartdeck" && gd.deck.deviceBonus) parts.push({ label: gd.deck.tier + " Smartdeck Device Bonus (gear)", value: gd.deck.deviceBonus });
    var activeKits = deepKits(ch).filter(function (k) { return !_deep.kitsOff[k.name]; });
    // Only one Focus Caliber can apply to a single roll. A Systems Skill Focus
    // and a Systems Tools Focus (via an active kit) can both cover an
    // intrusion; exactly one fires, picked on the FOCUS toggle row.
    var focusCands = [];
    if (s && s.focus) {
      var sf = eng.focusesFor(ch, "skill", "systems")[0];
      focusCands.push({ key: "skill", label: "Caliber from Systems" + (sf && sf.aspect ? " (" + sf.aspect + ")" : "") + " Focus", value: d.caliber || 1 });
    }
    if (activeKits.length) {
      eng.focusesFor(ch, "tools", "Systems Tools").forEach(function (f) {
        focusCands.push({ key: "tool|" + (f.aspect || ""), label: "Caliber from Systems Tools" + (f.aspect ? " (" + f.aspect + ")" : "") + " Focus", value: d.caliber || 1 });
      });
    }
    var focusPick = null;
    if (focusCands.length) {
      focusPick = focusCands.find(function (c) { return c.key === _deep.focusSrc; }) || focusCands[0];
      parts.push({ label: focusPick.label + (focusCands.length > 1 ? " (one Focus per roll)" : ""), value: focusPick.value });
    }
    if (s && s.specialization) parts.push({ label: "Specialization: Systems", value: 2 });
    var toolSpec = activeKits.length ? eng.specFor(ch, "tools", "Systems Tools") : null;
    if (toolSpec) parts.push({ label: "Specialization: Systems Tools" + (toolSpec.aspect ? " (" + toolSpec.aspect + ")" : ""), value: 2 });
    activeKits.forEach(function (k) {
      parts.push({ label: k.name + (k.edgeNote ? ", " + k.edgeNote : ""), value: k.edgeDice });
    });
    // situational sources cap at +3 combined (base-pool rule)
    var sit = DEEP_EDGES.filter(function (e) { return _deep.edges[e.key]; });
    if (sit.length) parts.push({ label: "Situational: " + sit.map(function (e) { return e.name; }).join(", ") + (sit.length > 3 ? " (capped at +3)" : ""), value: Math.min(3, sit.length) });
    var points = 0; parts.forEach(function (p) { points += p.value; });
    return { skill: s, points: points, parts: parts, pool: eng.buildEdgePool(points), focusCands: focusCands, focusPick: focusPick };
  }
  function deepSnagTotal(s) {
    var togs = DEEP_SNAGS.filter(function (x) { return _deep.snags[x.key]; }).length;
    var untrained = (s && s.untrained) ? 2 : 0;
    return { risk: _deep.risk, togs: togs, untrained: untrained, total: _deep.risk + togs + untrained };
  }
  // Dice Pool Success Margin row + color for a rolled margin
  function deepMarginRow(margin) {
    var rows = (EN.resolution && EN.resolution.margins && EN.resolution.margins.pool) || [];
    var i = margin >= 3 ? 0 : margin >= 1 ? 1 : margin === 0 ? 2 : margin >= -2 ? 3 : 4;
    return { row: rows[i] || null, color: ["var(--success)", "var(--success)", "var(--gold)", "var(--warn)", "var(--danger)"][i], costly: i >= 2 };
  }
  function deepRunPanel(ch, d, G) {
    var gd = d.grid;
    var edge = deepEdge(ch, d, gd);
    var snag = deepSnagTotal(edge.skill);
    var snagPool = eng.buildSnagPool(snag.total);
    var tip = edge.parts.length ? edge.parts.map(function (p) { return "+" + p.value + "  " + p.label; }).join("\n") : "No Edge sources yet";
    var kids = [];
    kids.push(noteP("Extended, out-of-combat intrusion runs the Dice Pool Method: your pool against the GM's Snag. The moment a combat round starts, flip back to Hot Run and the d20.", "var(--text2)"));
    // Codebreaker Suite gate
    var hasSuite = deepOwned(ch, "Codebreaker Suite");
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", margin: "0 0 6px" } }, [
      el("span.chip", { title: hasSuite ? "Core hacking software installed; hacks and executables run at full effect." : "Required for most hacks; without it, hacking procedures are usually impossible at GM discretion. Buy it in the gray market.",
        style: { fontSize: "9px", color: hasSuite ? "var(--success)" : "var(--danger)", borderColor: hasSuite ? "var(--success)" : "var(--danger)" } },
        hasSuite ? "✓ CODEBREAKER SUITE" : "⚠ NO CODEBREAKER SUITE"),
      edge.skill && edge.skill.untrained ? el("span.chip", { title: "Untrained in Systems: +2 Snag Dice on the pool", style: { fontSize: "9px", color: "var(--warn)", borderColor: "var(--warn)" } }, "UNTRAINED +2 SNAG") : null,
      (snag.total > 0 && edge.points >= snag.total * 2) ? el("span.chip", { title: "Automatic success occurs if your total Edge Dice pool is at least double the GM's Snag Dice, unless extraordinary risk or opposition is present.",
        style: { fontSize: "9px", color: "var(--success)", borderColor: "var(--success)" } }, "◎ AUTO-SUCCESS RANGE") : null
    ]));
    // EDGE row: total + composition + situational toggles
    function sitToggle(list, state, color) {
      return list.map(function (e) {
        var on = !!state[e.key];
        return el("button.btn.sm", { title: e.hint + (on ? " (counted; click to remove)" : " (click to add)"),
          style: { fontSize: "9px", color: on ? color : "var(--text4)", borderColor: on ? color : "var(--border)" },
          onclick: function () { state[e.key] = !on; _deep.result = null; EN.app.render(); } }, (on ? "✓ " : "") + e.name);
      });
    }
    var kitToggles = deepKits(ch).map(function (k) {
      var on = !_deep.kitsOff[k.name];
      return el("button.btn.sm", { title: (k.edgeNote ? k.edgeNote + ". " : "") + (on ? "Counted; click to leave it out." : "Not counted; click to include."),
        style: { fontSize: "9px", color: on ? "var(--success)" : "var(--text4)", borderColor: on ? "var(--success)" : "var(--border)" },
        onclick: function () { _deep.kitsOff[k.name] = on; _deep.result = null; EN.app.render(); } }, (on ? "✓ " : "") + k.name + " +" + k.edgeDice);
    });
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } },
      [el("span.mono", { style: { fontSize: "9px", color: "var(--success)", letterSpacing: ".1em", minWidth: "38px" }, text: "EDGE" }),
       el("span.mono", { style: { fontSize: "13px", color: "var(--text)" }, title: "Edge Dice for the intrusion:\n" + tip, text: edge.points + " → " + edge.pool.label })
      ].concat(kitToggles)));
    // situational Edge sources sit on their own line, aligned under the value
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", margin: "4px 0 0 44px" } },
      sitToggle(DEEP_EDGES, _deep.edges, "var(--gold)")));
    // one Focus per roll: when both a Systems Skill Focus and a Systems Tools
    // Focus cover this intrusion, pick which one fires (never both)
    if (edge.focusCands.length > 1) {
      kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", margin: "4px 0 0 44px" } },
        [el("span.mono", { title: "Only one Focus Caliber can apply to a single roll", style: { fontSize: "9px", color: "var(--gold)", letterSpacing: ".1em" }, text: "FOCUS" })]
        .concat(edge.focusCands.map(function (cand) {
          var on = edge.focusPick && edge.focusPick.key === cand.key;
          return el("button.btn.sm", { title: cand.label + ". Only one Focus Caliber can apply per roll; click to make this the one that fires.",
            style: { fontSize: "9px", color: on ? "var(--gold)" : "var(--text4)", borderColor: on ? "var(--gold)" : "var(--border)" },
            onclick: function () { _deep.focusSrc = cand.key; _deep.result = null; EN.app.render(); } }, (on ? "● " : "") + cand.label.replace(/^Caliber from /, ""));
        }))));
    }
    // SNAG row: GM risk picker + hacking friction toggles
    var riskBtns = ((EN.resolution && EN.resolution.pool && EN.resolution.pool.snagAssign) || []).map(function (r) {
      var n = Number(r.dice), on = _deep.risk === n;
      return el("button.btn.sm" + (on ? ".primary" : ""), { title: r.risk + ": " + r.desc, style: { fontSize: "10px" },
        onclick: function () { _deep.risk = n; _deep.result = null; EN.app.render(); } }, String(n));
    });
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } },
      [el("span.mono", { style: { fontSize: "9px", color: "var(--danger)", letterSpacing: ".1em", minWidth: "38px" }, text: "SNAG" })]
      .concat(riskBtns)
      .concat([el("span.mono", { style: { fontSize: "13px", color: "var(--text)" }, title: "GM-set difficulty plus hacking friction" + (snag.untrained ? "; includes +2 untrained" : ""), text: snag.total + " → " + snagPool.label })])));
    // hacking friction sources sit on their own line, aligned under the value
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", margin: "4px 0 0 44px" } },
      sitToggle(DEEP_SNAGS, _deep.snags, "var(--danger)")));
    // ROLL + result
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [
      el("button.btn.sm.primary", {
        title: "Roll the intrusion: Edge vs Snag, each die reads 6-9 as 1 and 10+ as 2, Margin = successes - failures",
        onclick: function () {
          var eRes = eng.rollDicePool(eng.buildEdgePool(edge.points));
          var sRes = eng.rollDicePool(snagPool);
          _deep.result = { edge: eRes, snag: sRes, margin: eRes.total - sRes.total };
          _deep.animating = true;
          _deep.animToken = (_deep.animToken || 0) + 1;
          EN.app.render();
          var token = _deep.animToken;
          EN.ui.animatePoolRoll(document.querySelector('[data-roll="deep-run"]'), function () {
            if (_deep.animToken === token) { _deep.animating = false; EN.app.render(); }
          });
        }
      }, "⇋ ROLL DEEP RUN"),
      !_deep.result ? el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: "or roll at the table and read the Margin below" }) : null
    ]));
    if (_deep.result) {
      var res = _deep.result;
      var diceRow = function (label, color, r, word) {
        return el("div.row.wrap", { style: { gap: "3px", alignItems: "center", marginTop: "4px" } },
          [el("span.mono", { style: { fontSize: "9px", color: color, letterSpacing: ".1em", minWidth: "38px" }, text: label })]
          .concat(r.rolls.length ? r.rolls.map(function (die) { return EN.ui.dieFace(die, color, _deep.animating); })
                                 : [el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: "no dice" })])
          .concat([_deep.animating
            ? el("span.mono", { dataset: { tot: "1", word: word }, style: { fontSize: "11px", color: "var(--text3)", marginLeft: "5px" }, text: "= · " + word })
            : el("span.mono", { style: { fontSize: "11px", color: "var(--text2)", marginLeft: "5px" }, text: "= " + r.total + " " + word })]));
      };
      kids.push(diceRow("EDGE", "var(--success)", res.edge, "successes"));
      kids.push(diceRow("SNAG", "var(--danger)", res.snag, "failures"));
      if (!_deep.animating) {
        var mr = deepMarginRow(res.margin);
        var scene = ((EN.resolution && EN.resolution.consequenceByScene) || []).find(function (r) { return /Hacking/.test(r.scene); });
        kids.push(el("div", { style: { marginTop: "6px" } }, [
          el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
            el("span.mono", { style: { fontSize: "13px", color: mr.color }, text: "MARGIN " + (res.margin >= 0 ? "+" : "") + res.margin + " · " + (mr.row ? mr.row.result : "") }),
            el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: mr.row ? mr.row.desc : "" })
          ]),
          mr.costly && scene ? noteP("Hacking-scene costs: " + scene.consequences + ".", "var(--warn)") : null
        ]));
      }
    }
    var body = el("div", { dataset: { roll: "deep-run" } }, kids);
    return EN.ui.panel("Deep Run", "OUT-OF-COMBAT INTRUSION · DICE POOL METHOD", [body], { corners: true });
  }

  // the console switch: which resolution model is this run using?
  function runModeBar() {
    function modeBtn(key, label, color, title) {
      var on = _runMode === key;
      return el("button.btn.sm" + (on ? ".primary" : ""), { title: title,
        style: on ? null : { color: color, borderColor: color },
        onclick: function () { _runMode = key; EN.app.render(); } }, label);
    }
    return el("div.row.wrap", { style: { gap: "8px", alignItems: "center", margin: "0 0 12px" } }, [
      el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".14em" }, text: "RUN MODE" }),
      modeBtn("hot", "⚡ HOT RUN · d20", "var(--accent)", "In a combat round or under fire: Quick Hacks, cipher attacks, Saves. One die, right now."),
      modeBtn("deep", "❄ DEEP RUN · DICE POOL", "var(--bw)", "Out of combat: extended intrusion, research, tailing a signal. Build the pool, read the Margin."),
      el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: "In a combat round? It's d20. Otherwise, build the pool." })
    ]);
  }

  /* ===================== BATTLE-DAMAGE LAYER =====================
     The tab degrades as rig System Integrity falls. Stage 0 pristine; 1-3 escalate
     (glow, chip lurch, button glitch, panel flicker/interlace, TV static);
     4 = bricked (dead, desaturated). Most tells are CSS driven off data-dmg;
     only the rare letter-scramble needs JS. prefers-reduced-motion respected. */
  function reducedMotion() {
    try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  // Map current rig System Integrity to a 0-4 damage stage. Off / no rig -> 0.
  // A pinned Intensity (1-4) previews that stage regardless of actual HP.
  function damageStage(ch, d) {
    if (!_dmgOn) return 0;
    if (_dmgIntensity !== "auto") return Math.max(0, Math.min(4, parseInt(_dmgIntensity, 10) || 0));
    var dk = d.grid && d.grid.deck;
    if (!dk || !(dk.maxIntegrity > 0)) return 0;                    // no rig -> nothing to damage
    var cur = Math.max(0, dk.maxIntegrity - (((ch.grid || {}).deckHpSpent) || 0));
    if (cur <= 0) return 4;                                  // bricked
    var pct = cur / dk.maxIntegrity;
    return pct <= 0.25 ? 3 : pct <= 0.5 ? 2 : pct <= 0.75 ? 1 : 0;   // last quarter = 3 (static)
  }
  // Deterministic 0..1 hash: staggered animation delays look random but stay
  // stable across re-renders (no reshuffle jump on every store change).
  function _h(i) { var x = Math.sin(i * 99.13) * 43758.5453; return x - Math.floor(x); }
  function _stagger(list, prop, span) {
    [].slice.call(list).forEach(function (n, i) { n.style.setProperty(prop, "-" + (_h(i + 1) * span).toFixed(2) + "s"); });
  }
  var GLITCH_CHARS = "!<>-_\\/[]{}=+*^?#01ABCDEF▓▒░";
  var _glitchTimer = null;
  function stopGlitch() { if (_glitchTimer) { clearTimeout(_glitchTimer); _glitchTimer = null; } }
  // The rarest tell: occasionally scramble a few characters of one readout, then
  // restore it. Leaf text only, never inputs, self-stops when the tab unmounts.
  function startGlitch(root, stage) {
    var pool = [].slice.call(root.querySelectorAll(".mono, .panel-h h3")).filter(function (n) {
      if (n.children.length) return false;                  // leaf text nodes only
      if (n.closest("input, textarea, .stepper")) return false;
      var t = n.textContent.trim();
      return t.length >= 2 && t.length <= 26;
    });
    if (!pool.length) return;
    var base = stage >= 3 ? 2600 : 4400;                     // heavier stage scrambles a touch more often
    function scramble(node) {
      var orig = node.textContent, chars = orig.split(""), n = chars.length, frame = 0;
      (function step() {
        if (!node.isConnected) return;                       // detached mid-scramble: drop it
        if (frame >= 4) { node.textContent = orig; return; } // always restore the true text
        var out = chars.slice(), picks = Math.min(3, Math.max(1, Math.floor(n * 0.25)));
        for (var k = 0; k < picks; k++) {
          var idx = Math.floor(Math.random() * n);
          if (out[idx] !== " ") out[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }
        node.textContent = out.join(""); frame++;
        setTimeout(step, 45);
      })();
    }
    function tick() {
      if (!root.isConnected) { stopGlitch(); return; }       // left the tab / re-rendered
      var node = pool[Math.floor(Math.random() * pool.length)];
      if (node && node.isConnected) scramble(node);
      _glitchTimer = setTimeout(tick, base + Math.random() * base * 0.8);
    }
    _glitchTimer = setTimeout(tick, 900 + Math.random() * 1400);
  }
  // Wire the damage stage onto the mounted tab: desync the CSS tells so only some
  // chips/buttons/panels act up at once, then arm the letter-scramble driver.
  function applyDamage(root, stage) {
    stopGlitch();
    if (stage <= 0) return;
    _stagger(root.querySelectorAll(".panel"), "--pd", 6);
    _stagger(root.querySelectorAll(".chip"), "--cd", 5);
    _stagger(root.querySelectorAll(".btn, .stepper button"), "--bd", 4);
    if (!reducedMotion() && stage >= 2 && stage < 4) startGlitch(root, stage);   // letters: the rarest tell, heavy/critical only (dead when bricked)
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

    // resolution-model switch: the d20 console vs the Dice Pool console
    blocks.push(runModeBar());
    var deep = _runMode === "deep";

    // two-column-ish: rig + (console over links), then ciphers, then target (d20 only), then reference
    blocks.push(el("div.modgrid6", { style: { marginBottom: "0" } }, [
      el("div", { style: { gridColumn: "span 3", minWidth: 0 } }, [rigPanel(ch, d, G)]),
      el("div", { style: { gridColumn: "span 3", minWidth: 0, display: "flex", flexDirection: "column", gap: "14px" } },
        [deep ? deepRunPanel(ch, d, G) : statsPanel(ch, d), linksPanel(ch, d, G)])
    ]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [ciphersPanel(ch, d, G)]));
    if (!deep) blocks.push(el("div", { style: { marginTop: "14px" } }, [targetPanel(ch, d, G)]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [referencePanel(ch, d, G)]));

    // Wrap in .gridtab and stamp the live Integrity damage stage; the CSS layer
    // and the JS glitch driver read it from here.
    var dmg = damageStage(ch, d);
    var root = el("div.gridtab", { dataset: { dmg: String(dmg) } }, blocks);
    mount.appendChild(root);
    applyDamage(root, dmg);
  }

  return { render: render, isDamage: isDamage, setDamage: setDamage, getDmgIntensity: getDmgIntensity, setDmgIntensity: setDmgIntensity };
})();
