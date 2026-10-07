/* ===========================================================================
   ELYSIUM NIGHTS · Codex chapter: The #GRID
   The #GRID rules in full, for both desktops, rendered from EN.grid
   (app/data/grid.js), the same data the #GRID tab's console reads. Before this
   chapter these rules lived in the #GRID tab's Reference panel, which only the
   Freelancer desktop has, and a dozen of them (the core concepts, Links, the
   Stability Check, the cipher formulas, device Integrity and repair, the rig
   notes) rendered nowhere at all. The tab keeps its working tools and the
   catalogs (ciphers, the B&E Buddy suite, rigs, relays, mods) and links here.
     grid: "The #GRID", order 80, audience "both", panel ids "gd-"
   The Basics keeps its primer (bx-grid); this chapter is the full text. Every
   rule line is a field of EN.grid, or of EN.classes.codebreaker.extra for the
   Signature #GRID Exploits; the only words of this file's own are headings,
   table heads and the small pointers between panels.
   The API is documented in the header of app/js/codex.js.
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;

  function G() { return EN.grid || null; }
  function has(field) { return function () { var g = G(); return !!(g && g[field]); }; }
  function exploits() {
    var cb = (EN.classes || {}).codebreaker, x = cb && cb.extra;
    return (x && x.gridExploits) || [];
  }
  function glim(n) { return "𝒢" + Number(n).toLocaleString(); }
  function plus(n) { return "+" + n; }
  /* Several notes open with their own name ("Cipher Attack: d20 + ..."). The entry already
     prints that name as its heading, so the lead is dropped from the text, never reworded. */
  function unlead(text, name) {
    var t = String(text || ""), lead = name + ": ";
    return t.indexOf(lead) === 0 ? t.slice(lead.length) : t;
  }
  EN.codexView.register({ id: "grid", title: "The #GRID", order: 80, audience: "both", panels: [

    /* ---- 1 · the words ------------------------------------------------------ */
    { id: "gd-core", title: "#GRID Fundamentals", tag: "NODES · ELEMENTS · LINKS", order: 10, when: has("coreConcepts"), build: function (ctx, K) {
      var g = G();
      return [
        g.intro ? K.proseBlock(g.intro) : null,
        K.subTitle("Core Concepts"),
        K.el("div", null, g.coreConcepts.map(function (c) { return K.ruleBlock(c.term, c.summary); })),
        (g.elements || []).length ? K.subTitle("Elements") : null,
        K.el("div", null, (g.elements || []).map(function (e) { return K.ruleBlock(e.kind, e.text); }))
      ];
    } },

    /* ---- 2 · what you are breaking into -------------------------------------- */
    { id: "gd-nodes", title: "Nodes & Firewalls", tag: "SECURITY · SAVES · INTEGRITY", order: 20, when: has("nodeTiers"), build: function (ctx, K) {
      var g = G();
      return [
        K.entry("node-tiers", "Node Tiers", [
          K.refTable(["Tier", "Security Rating", "Cipher Save Bonus", "System Integrity"], g.nodeTiers.map(function (n) {
            return [n.tier, String(n.security), plus(n.saveBonus), n.integrity == null ? "-" : String(n.integrity)];
          }), [0])
        ]),
        g.lowSecurityNote ? K.ruleBlock("Low-Security Nodes", g.lowSecurityNote) : null,
        g.hardenedNote ? K.ruleBlock("Hardened Nodes", g.hardenedNote) : null,
        (g.firewalls || []).length ? K.subTitle("Firewalls") : null,
        (g.firewalls || []).length ? K.entry("firewalls", "Firewalls", [
          K.refTable(["Tier", "Price", "Security Bonus", "Damage Threshold"], g.firewalls.map(function (f) {
            return [f.tier, glim(f.price), plus(f.securityBonus), String(f.threshold)];
          }), [0]),
          g.firewallNote ? K.proseBlock(g.firewallNote) : null
        ], { text: g.firewallNote || "" }) : null,
        K.seeAlso("Cipher damage against a Firewall:", [["gd-ciphers/cipher-damage", "Cipher Damage"], ["gd-ciphers/minion-rule", "Minion Rule"]])
      ];
    } },

    /* ---- 3 · finding the Node ------------------------------------------------- */
    { id: "gd-scan", title: "Scanning & Detection", tag: "FINDING THE NODE", order: 30, when: has("scanning"), build: function (ctx, K) {
      var g = G();
      return [
        g.scanIntro ? K.proseBlock(g.scanIntro) : null,
        K.entry("concealment", "Concealment", [
          K.refTable(["Concealment", "Scan DC", "Scan Snag", "Reads As"], g.scanning.map(function (s) {
            return [s.quality, String(s.dc), String(s.snag), s.reads];
          }), [0])
        ]),
        (g.scanMods || []).length ? K.subTitle("What Helps, What Hurts") : null,
        (g.scanMods || []).length ? K.entry("scan-modifiers", "Scan Modifiers", [
          K.refTable(["Modifier", "Condition", "d20", "Dice Pool"], g.scanMods.map(function (m) {
            return [m.name, m.condition, m.d20, m.pool];
          }), [0])
        ]) : null,
        g.scanCapNote ? K.ruleBlock("Modifier Stack Cap", unlead(g.scanCapNote, "Modifier Stack Cap")) : null
      ];
    } },

    /* ---- 4 · Links, and what tearing one out costs ------------------------------ */
    { id: "gd-links", title: "Links & LinkDeath", tag: "STABILITY · LINKDEATH · CASCADE", order: 40, when: has("linkEstablish"), build: function (ctx, K) {
      var g = G(), cond = { conditions: true };
      return [
        K.ruleBlock("Establishing a Link", g.linkEstablish),
        g.linkLimits ? K.ruleBlock("Link Limits", g.linkLimits) : null,
        g.stabilityCheck ? K.ruleBlock("Stability Check", g.stabilityCheck, null, cond) : null,
        K.subTitle("LinkDeath"),
        g.linkDeathIntro ? K.ruleBlock("LinkDeath", g.linkDeathIntro + (g.linkDeathResolution ? "\n\n" + g.linkDeathResolution : ""), null, cond) : null,
        g.cascadeFailure ? K.ruleBlock("Cascade Failure", g.cascadeFailure, null, cond) : null,
        g.standardUserLinkDeath ? K.ruleBlock("Standard Users and LinkDeath", g.standardUserLinkDeath, null, cond) : null,
        g.sourcererLinkDeath ? K.ruleBlock("Sourcerers and LinkDeath", g.sourcererLinkDeath, null, cond) : null,
        K.seeAlso("The conditions themselves:", [["ref-conds/linkdeath", "LinkDeath"], ["ref-conds/cascade-failure", "Cascade Failure"], ["ref-conds/bricked", "Bricked"]])
      ];
    } },

    /* ---- 5 · running a cipher ---------------------------------------------------- */
    { id: "gd-ciphers", title: "Running Ciphers", tag: "ATTACK · SAVE · DAMAGE", order: 50, when: has("cipherAttackFormula"), build: function (ctx, K) {
      var g = G(), ex = exploits();
      return [
        K.ruleBlock("Cipher Attack", unlead(g.cipherAttackFormula, "Cipher Attack")),
        g.cipherSaveFormula ? K.ruleBlock("Cipher Save DC", unlead(g.cipherSaveFormula, "Cipher Save DC")) : null,
        g.cipherOutcomes ? K.ruleBlock("Cipher Outcomes", g.cipherOutcomes) : null,
        g.quickHackNote ? K.ruleBlock("Quick Hack", g.quickHackNote) : null,
        g.cipherComplexityNote ? K.ruleBlock("Complexity and Casting Cost", g.cipherComplexityNote) : null,
        (g.cipherDamage || []).length ? K.subTitle("Cipher Damage") : null,
        (g.cipherDamage || []).length ? K.entry("cipher-damage", "Cipher Damage", [
          K.refTable(["Complexity", "CX", "Damage"], g.cipherDamage.map(function (r) { return [r.complexity, String(r.c), r.roll]; }), [0, 2]),
          g.cipherDamageNote ? K.proseBlock(g.cipherDamageNote) : null
        ], { text: g.cipherDamageNote || "" }) : null,
        g.minionRule ? K.ruleBlock("Minion Rule", g.minionRule) : null,
        /* The Codebreaker's own moves. The #GRID tab spends their Bandwidth (USE); the rule
           text reads here, so a GM can read what the player just did. */
        ex.length ? K.subTitle("Signature #GRID Exploits") : null,
        ex.length ? K.entry("signature-grid-exploits", "Signature #GRID Exploits", [
          K.note("Codebreaker. Each costs " + (ex[0].cost || 1) + " Bandwidth; meet its recharge trigger to refund it."),
          /* the class's own casting-cost line, which the #GRID tab printed above these exploits before the Codex */
          (((EN.classes || {}).codebreaker || {}).extra || {}).cipherCastingCosts ? K.proseBlock(EN.classes.codebreaker.extra.cipherCastingCosts) : null,
          K.el("div", null, ex.map(function (x) {
            return K.ruleBlock(x.name, x.text + (x.recharge ? "\n\nRecharge: " + x.recharge : ""), x.action + " · " + (x.cost || 1) + " Bandwidth");
          }))
        ], { text: "Codebreaker Signature #GRID Exploits" }) : null,
        K.seeAlso("Who can run what:", [["gd-devices", "Smartdecks, Buddies & Relays"], ["gd-repertoire", "Repertoire & Cipher Costs"]])
      ];
    } },

    /* ---- 6 · when the Node fights back ------------------------------------------- */
    { id: "gd-ic", title: "Intrusion Countermeasures", tag: "WHEN THE NODE FIGHTS BACK", order: 60, when: has("ic"), build: function (ctx, K) {
      var g = G(), counter = {};
      (g.icCounter || []).forEach(function (c) { counter[c.tier] = c.dmg; });
      return [
        g.icIntro ? K.proseBlock(g.icIntro) : null,
        K.entry("ic-tiers", "IC Tiers", [
          K.refTable(["IC Tier", "Price", "Detection", "Counterattack", "Responses"], g.ic.map(function (r) {
            return [r.tier, glim(r.price), plus(r.detection), counter[r.tier] || "-", (r.responses || []).join(", ")];
          }), [0])
        ]),
        (g.icResponses || []).length ? K.subTitle("Responses") : null,
        K.el("div", null, (g.icResponses || []).map(function (r) { return K.ruleBlock(r.name, r.text, null, { conditions: true }); })),
        g.interceptionNote ? K.ruleBlock("Codebreaker Damage Interception", unlead(g.interceptionNote, "Codebreaker Damage Interception")) : null,
        g.icDetectionNote ? K.ruleBlock("Detection Bonus", g.icDetectionNote) : null,
        g.guardians ? K.ruleBlock("#GRID Guardians", g.guardians) : null
      ];
    } },

    /* ---- 7 · building the library -------------------------------------------------- */
    { id: "gd-repertoire", title: "Repertoire & Cipher Costs", tag: "ACQUIRE · CRAFT · RECOVER", order: 70, when: has("repertoireNote"), build: function (ctx, K) {
      var g = G();
      return [
        K.ruleBlock("Building a Repertoire", g.repertoireNote),
        (g.cipherCosts || []).length ? K.entry("cipher-costs", "Cipher Costs", [
          K.refTable(["Cipher Tier", "CX", "Craft (half)", "Acquire Clean", "Recovery"], g.cipherCosts.map(function (r) {
            return [r.tier, String(r.cx), r.craft != null ? glim(r.craft) : "-", glim(r.material), glim(r.recovery)];
          }), [0])
        ]) : null,
        K.note("The Cipher Library itself is a catalog: it is sold in the Inventory tab's gray market and run from the #GRID tab.")
      ];
    } },

    /* ---- 8 · the hardware -------------------------------------------------------------- */
    { id: "gd-devices", title: "Smartdecks, Buddies & Relays", tag: "THE RIGS", order: 80, when: has("smartdeckTraitNote"), build: function (ctx, K) {
      var g = G();
      return [
        K.ruleBlock("Smartdecks", g.smartdeckTraitNote),
        (g.smartdeckTraits || []).length ? K.subTitle("Smartdeck Traits") : null,
        K.el("div", null, (g.smartdeckTraits || []).map(function (t) { return K.ruleBlock(t.name, t.text); })),
        g.buddyNote ? K.subTitle("Other Rigs") : null,
        g.buddyNote ? K.ruleBlock("B&E Buddy", g.buddyNote) : null,
        g.relayNote ? K.ruleBlock("Burner Relays", g.relayNote) : null,
        K.note("Tier rows, prices and the hardware mods are catalogs: they are in the Inventory tab's gray market, and the #GRID tab runs the B&E Buddy Cipher Suite.")
      ];
    } },

    /* ---- 9 · keeping a rig alive ----------------------------------------------------------- */
    { id: "gd-repair", title: "Device Integrity & Repair", tag: "BRICKED AND BACK", order: 90, when: has("durabilityNote"), build: function (ctx, K) {
      var g = G();
      return [
        K.ruleBlock("Device Integrity", g.durabilityNote, null, { conditions: true }),
        K.el("div", null, (g.repairs || []).map(function (r) { return K.ruleBlock(r.name, r.text, null, { conditions: true }); }))
      ];
    } }
  ] });

  /* Pointer terms. The chapter and panel titles are terms already (matched as written);
     these are the rule names the data and the other tabs cite, matched in any case. No
     condition name is aliased here (LinkDeath, Cascade Failure, Bricked): those link to
     the Conditions Library, and the Links & LinkDeath panel links back to it.
     "the #GRID chapter" is cited once, by LinkDeath, for the deck absorbing the surge,
     which is the Links & LinkDeath panel. The alias is "#GRID chapter" without the
     article, so a capitalised "The #GRID chapter" still reads the chapter title first
     (the title starts earlier and wins) and the title is never aliased away. */
  EN.codexView.terms({
    "#GRID chapter": "gd-links",
    "Field Repair (Partial)": "gd-repair/field-repair-partial",
    "Downtime Repair": "gd-repair/downtime-repair-full-restore",
    "Node Attributes": "gd-nodes/node-tiers",
    "Node Tiers": "gd-nodes/node-tiers",
    "Firewall table": "gd-nodes/firewalls",
    "Firewall Damage Threshold": "gd-nodes/firewalls",
    "Security Rating": "gd-nodes/node-tiers",
    "Cipher Save Bonus": "gd-nodes/node-tiers",
    "Hardened Node": "gd-nodes/hardened-nodes",
    "Hardened Nodes": "gd-nodes/hardened-nodes",
    "Scan DC": "gd-scan/concealment",
    "Modifier Stack Cap": "gd-scan/modifier-stack-cap",
    "Stability Check": "gd-links/stability-check",
    "Stability Checks": "gd-links/stability-check",
    "Cipher Attack": "gd-ciphers/cipher-attack",
    "Cipher Attacks": "gd-ciphers/cipher-attack",
    "Cipher Save DC": "gd-ciphers/cipher-save-dc",
    "Quick Hack": "gd-ciphers/quick-hack",
    "Quick Hacks": "gd-ciphers/quick-hack",
    "Minion Rule": "gd-ciphers/minion-rule",
    "Signature #GRID Exploits": "gd-ciphers/signature-grid-exploits",
    "IC Counterattack": "gd-ic/counterattack",
    "Damage Interception": "gd-ic/codebreaker-damage-interception",
    "#GRID Guardian": "gd-ic/grid-guardians",
    "#GRID Guardians": "gd-ic/grid-guardians",
    "B&E Buddy": "gd-devices/b-and-e-buddy",
    "Burner Relay": "gd-devices/burner-relays",
    "Burner Relays": "gd-devices/burner-relays"
  });
})();
