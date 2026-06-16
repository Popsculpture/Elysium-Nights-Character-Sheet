/* ===========================================================================
   ELYSIUM NIGHTS — Printable Hardcopy ("Freelancer Field Dossier")
   A class-aware, multi-page print sheet rendered as an on-screen preview overlay
   that prints clean via @media print. Auto-filled from EN.engine.derive(ch).
     Page 1 — play sheet (identity, attributes, survival, defenses, attacks)
     Page 2 — full skills + saves + chrome silhouette + talents
     Page 3+ — class spotlight (#GRID rig & repertoire / Flow reservoir / …) + features
   =========================================================================== */
window.EN = window.EN || {};

EN.printSheet = (function () {
  var el = EN.ui.el, store = EN.store, eng = EN.engine;
  function sgn(n) { return eng.fmtMod(n); }
  function txt(v) { return (v == null || v === "") ? "" : String(v); }

  /* ---- small builders ---- */
  function sect(title, right) {
    return el("div.ps-sect", null, [el("span", { text: title }), right ? el("span.ps-sect-r", { text: right }) : null]);
  }
  function field(label, value, opts) {
    opts = opts || {};
    return el("div.ps-field" + (opts.cls || ""), { style: opts.style || null },
      [el("div.ps-fl", { text: label }), el("div.ps-fv", { text: txt(value) })]);
  }
  function stat(label, value, sub) {
    return el("div.ps-stat", null, [
      el("div.ps-fl", { text: label }),
      el("div.ps-statv", { text: txt(value) }),
      sub ? el("div.ps-statn", { text: sub }) : null
    ]);
  }
  function chip(t, cls) { return el("span.ps-chip" + (cls || ""), { text: t }); }
  function pips(filled, total, shape) {
    var r = el("div.ps-pips");
    for (var i = 0; i < total; i++) r.appendChild(el("span.ps-pip" + (shape ? "." + shape : "") + (i < filled ? ".on" : "")));
    return r;
  }
  function writeLine(label) {
    return el("div.ps-wl", null, [el("span.ps-fl", { text: label }), el("span.ps-wl-line")]);
  }
  function note(t, cls) { return el("p.ps-note" + (cls || ""), { text: t }); }

  function pageHead(title, tag, ch) {
    var serial = "ID·" + ((ch.meta && ch.meta.id) ? ch.meta.id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() : "000000");
    return el("div.ps-head", null, [
      el("div", null, [
        el("div.ps-kicker", { text: "ELYSIUM NIGHTS" }),
        el("div.ps-title", { text: title })
      ]),
      el("div.ps-head-r", null, [
        el("div.ps-barcode"),
        el("div.ps-tagrow", null, [el("span.ps-tag", { text: "#PRINT" }), el("span.ps-serial", { text: serial }), el("span.ps-serial", { text: tag })])
      ])
    ]);
  }
  function page(title, tag, ch, body) {
    var kids = [el("span.ps-frame")];
    ["tl", "tr", "bl", "br"].forEach(function (c) { kids.push(el("span.ps-corner.ps-" + c)); });
    kids.push(pageHead(title, tag, ch));
    kids.push(el("div.ps-rule"));
    body.forEach(function (b) { if (b) kids.push(b); });
    kids.push(el("div.ps-foot", { text: "// UNAUTHORIZED EDITS ARE LOGGED AND PROSECUTED · LUSTER INTERCHANGE TREASURY" }));
    return el("div.sheet-page", null, kids);
  }

  /* ---- ability snippets: tags (action / cost / uses) + a one-line brief ----
     Brief comes from the authored EN.briefs map; falls back to auto-compressing
     the rules text. Tag parsers mirror the Freelancer tab's heuristics. */
  function actionCost(text) {
    text = text || "";
    if (/Impulse Action/i.test(text)) return "Impulse";
    if (/Swift Action/i.test(text)) return "Swift";
    if (/Free Action/i.test(text)) return "Free";
    if (/Complex Action/i.test(text)) return "Action";
    if (/as an Action|use your Action|spend (?:an|your) Action|standard Action|as a single Action|take the Attack Action/i.test(text)) return "Action";
    return "Passive";
  }
  function parseUses(text, d) {
    if (!text) return null;
    var t = text.replace(/\s+/g, " "), m;
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }
    if ((m = t.match(/number of (?:times|uses)(?:[^.]{0,60}?)equal to your Caliber per (Long|Short) Rest/i))) return { max: d.caliber, recharge: cap(m[1]) + " Rest" };
    if (/number of (?:times|uses) per Encounter equal to your Caliber/i.test(t)) return { max: d.caliber, recharge: "Encounter" };
    if ((m = t.match(/\b(once|twice|(\d+) times) per (Long Rest|Short Rest|Encounter|scene)\b/i))) {
      var max = m[2] ? Number(m[2]) : (/twice/i.test(m[1]) ? 2 : 1);
      return { max: max, recharge: m[3] };
    }
    return null;
  }
  function costTag(text) {
    var m = (text || "").match(/(\d+)\s*(Bandwidth|Flow Points?|FP|Overdrive|Moxie|Leverage|Execution|Triage|Grit)\b/i);
    if (!m) return null;
    var r = m[2].toLowerCase();
    var abbr = r.indexOf("bandwidth") === 0 ? "BW" : (r.indexOf("flow") === 0 || r === "fp") ? "FP" : m[2].slice(0, 3).toUpperCase();
    return m[1] + " " + abbr;
  }
  function autoBrief(text) {
    if (!text) return "";
    var t = text.replace(/\s+/g, " ").trim();
    var parts = t.split(/\.\s+/);
    var kw = /\b(gain|add|spend|roll|reroll|Edge|Snag|DC|damage|Resist|Immun|Advantage|reduce|deal|ignore|Speed|Defense|Vitality|Wound|Vigor|FP|Bandwidth|d4|d6|d8|d10|d12|d20|once per|\+\d)/i;
    var pick = parts.find(function (s) { return kw.test(s); }) || parts[0] || t;
    pick = pick.trim().replace(/[.]+$/, "");
    if (pick.length > 116) pick = pick.slice(0, 114).replace(/\s+\S*$/, "") + "…";
    return pick;
  }
  function briefFor(f) { var b = EN.briefs && EN.briefs[f.name]; return b || autoBrief(f.text); }
  function talentFeatures(ch) {
    var TAL = Array.isArray(EN.talents) ? EN.talents : [];
    return (ch.talents || []).map(function (tk) {
      var t = TAL.find(function (x) { return x.key === tk || x.name === tk; });
      return t ? { name: t.name, text: t.text || t.desc || "", source: "Talent", level: 0 } : null;
    }).filter(Boolean);
  }

  /* ---- weapon catalog lookup (for the attacks block) ---- */
  function findWeapon(name) {
    var g = EN.gearCatalog || {};
    var all = [].concat((g.melee && g.melee.items) || [], (g.ranged && g.ranged.items) || [], (g.signature && g.signature.items) || []);
    return all.find(function (w) { return w.name === name; });
  }

  /* =======================================================================
     PAGE 1 — play sheet
     ======================================================================= */
  function page1(ch, d) {
    var id = ch.identity || {};
    var body = [];

    // identity
    body.push(el("div.ps-grid2", null, [
      field("Handle / alias", id.handle || ch.name),
      field("Name on record", ch.name)
    ]));
    var classLine = [d.classInfo ? d.classInfo.name : "—", d.subclassInfo ? d.subclassInfo.name : null].filter(Boolean).join(" · ");
    var speciesLine = [d.speciesInfo ? d.speciesInfo.name : "—", d.lineageInfo ? d.lineageInfo.name : null].filter(Boolean).join(" · ");
    body.push(el("div.ps-row", null, [
      field("Class · subclass", classLine, { style: { flex: "2 1 0" } }),
      field("Species · lineage", speciesLine, { style: { flex: "2 1 0" } }),
      field("Lvl", d.level, { style: { flex: "0 0 42px" } }),
      field("Cal", d.caliber, { style: { flex: "0 0 42px" } }),
      field("Size", d.size || "—", { style: { flex: "1 1 0" } })
    ]));

    // two columns
    var left = [], right = [];

    // LEFT: attribute matrix
    left.push(sect("Attribute matrix"));
    var grid = el("div.ps-attr-grid");
    (EN.rules.attributes || []).forEach(function (a) {
      var A = d.attributes[a.key];
      grid.appendChild(el("div.ps-attr", null, [
        el("div.ps-attr-n", { text: a.name }),
        el("div.ps-attr-row", null, [
          el("div.ps-attr-score", { text: A.score + (A.cyberBonus ? " ◆" : "") }),
          el("div.ps-attr-mod", null, [el("div.ps-fl", { text: "MOD" }), el("div.ps-attr-modv", { text: sgn(A.mod) })])
        ])
      ]));
    });
    left.push(grid);

    // LEFT: trained skills quick-list (full list on p.2)
    left.push(sect("Trained skills", "d20 bonus"));
    var trained = (d.skills || []).filter(function (s) { return !s.untrained; });
    if (!trained.length) left.push(note("No trained skills — full list overleaf."));
    trained.forEach(function (s) {
      left.push(el("div.ps-skrow", null, [
        el("span.ps-sk-n", { text: s.name }),
        el("span.ps-sk-a", { text: s.attr }),
        el("span.ps-sk-t", { text: s.tierShort }),
        el("span.ps-sk-b", { text: sgn(s.total) })
      ]));
    });

    // RIGHT: survival
    right.push(sect("Survival", "Vigor → Vitality → Wounds"));
    right.push(el("div.ps-surv", null, [
      el("div.ps-surv-row", null, [el("span.ps-fl", { text: "VITALITY" }), el("span.ps-box", { text: d.vitalityMax }), el("span.ps-fl", { text: "MAX · NOW" }), el("span.ps-box.ps-write")]),
      el("div.ps-surv-row", null, [el("span.ps-fl", { text: "VIGOR" }), el("span.ps-fl", { text: "TEMP" }), pips(0, 6, "hex")]),
      el("div.ps-surv-row", null, [el("span.ps-fl.ps-emb", { text: "WOUNDS" }), el("span.ps-box", { text: d.woundsMax }), el("span.ps-fl", { text: "MAX · CRIT ≤ " + d.critThreshold }), el("span.ps-box.ps-write")]),
      el("div.ps-surv-row", null, [el("span.ps-fl", { text: "RESILIENCE" }), el("span.ps-fl", { text: "d" + (d.resilienceDie || "?") }), pips(d.resilienceMax, d.resilienceMax, "dot")])
    ]));
    // defense stat row
    var dg = d.defenseGear || {};
    right.push(el("div.ps-statrow", null, [
      stat("DEF", d.defense, (d.defenseAttr === "BOD" ? "Body" : "Agi") + (dg.shield ? " +shield" : "")),
      stat("DR", d.armorDR || 0, dg.armor ? "armor" : "—"),
      stat("SPD", d.speed, "spaces"),
      stat("INIT", sgn(d.attributes.AGI.mod), "Agility")
    ]));
    // class resource
    if (d.resource) {
      right.push(sect(d.resource.name, d.resource.attributeName + " · refresh on rest"));
      right.push(el("div.ps-surv-row", null, [el("span.ps-fl", { text: "MAX " + d.resource.max }), pips(d.resource.max, d.resource.max, "dot")]));
    } else if (d.flow) {
      right.push(sect("Flow reservoir", "see Flow page"));
      right.push(el("div.ps-surv-row", null, [el("span.ps-fl", { text: "MAX FP " + d.flow.max }), el("span.ps-box.ps-write"), el("span.ps-fl", { text: "STRAIN" }), pips(0, 6, "dot")]));
    }

    // attacks
    right.push(sect("Attacks"));
    var atk = el("table.ps-tbl");
    atk.appendChild(el("tr", null, ["WEAPON", "HIT", "DMG", "RANGE"].map(function (h) { return el("th", { text: h }); })));
    var equipped = (ch.equippedWeapons || []).map(findWeapon).filter(Boolean);
    if (!equipped.length) equipped = [{ name: "Unarmed Strike", damage: "Body mod", range: "Melee", _melee: true }];
    equipped.slice(0, 5).forEach(function (w) {
      var melee = w._melee || w.group === "Simple" || w.group === "Martial";
      var hit = sgn(melee ? d.attributes.BOD.mod : d.attributes.AGI.mod) + "+";
      atk.appendChild(el("tr", null, [
        el("td", { text: w.name }), el("td", { text: hit }), el("td", { text: w.damage || "—" }), el("td", { text: (w.range || "Melee") })
      ]));
    });
    right.push(atk);

    // active defenses
    right.push(sect("Active defenses", "1 Impulse"));
    var defs = ["Block", "Dodge", "Parry", "Ward"];
    if (ch.class === "shaper") defs = ["Dodge", "Parry", "Ward", "Resurge"];
    right.push(el("div.ps-chiprow", null, defs.map(function (x) { return chip(x, ".ps-chip-box"); })));

    body.push(el("div.ps-cols", null, [el("div.ps-col", null, left), el("div.ps-col", null, right)]));

    // bottom band
    body.push(el("div.ps-rule.ps-faint"));
    var bl = [], br = [];
    bl.push(sect("Conditions & fatigue"));
    bl.push(el("div.ps-box.ps-write.ps-tall"));
    bl.push(el("div.ps-surv-row", null, [el("span.ps-fl", { text: "FATIGUE" }), pips(0, 6, "")]));
    bl.push(el("div.ps-surv-row", null, [el("span.ps-fl", { text: "DEATH SAVES" }), el("span.ps-fl.ps-acc", { text: "S" }), pips(0, 3, "dot"), el("span.ps-fl.ps-emb", { text: "F" }), pips(0, 3, "dot")]));
    br.push(sect("Glimmer · gear · inner profile"));
    br.push(el("div.ps-surv-row", null, [el("span.ps-fl", { text: "𝒢 GLIMMER" }), el("span.ps-box", { text: (ch.glimmer || 0).toLocaleString() })]));
    br.push(writeLine("Tethers"));
    br.push(writeLine("Fault lines"));
    body.push(el("div.ps-cols", null, [el("div.ps-col", null, bl), el("div.ps-col", null, br)]));

    return page("FREELANCER FIELD DOSSIER", "01 · PLAY", ch, body);
  }

  /* =======================================================================
     PAGE 2 — skills, saves, chrome
     ======================================================================= */
  function page2(ch, d) {
    var body = [];
    var cols = [], left = [], right = [];

    // full skills
    left.push(sect("Skills", "tier · d20 · passive"));
    var tbl = el("table.ps-tbl.ps-tbl-sk");
    tbl.appendChild(el("tr", null, ["SKILL", "ATT", "TIER", "d20", "PASV"].map(function (h) { return el("th", { text: h }); })));
    (d.skills || []).forEach(function (s) {
      tbl.appendChild(el("tr" + (s.untrained ? ".ps-dim" : ""), null, [
        el("td", { text: s.name + (s.focus ? " ◆" : "") + (s.specialization ? " ★" : "") }),
        el("td", { text: s.attr }),
        el("td", { text: s.untrained ? "—" : s.tierShort }),
        el("td", { text: sgn(s.total) }),
        el("td", { text: s.passive })
      ]));
    });
    left.push(tbl);

    // saves
    right.push(sect("Saving throws"));
    var sv = el("table.ps-tbl");
    sv.appendChild(el("tr", null, ["SAVE", "PROF", "BONUS"].map(function (h) { return el("th", { text: h }); })));
    (EN.rules.attributes || []).forEach(function (a) {
      var S = d.saves[a.key] || {};
      sv.appendChild(el("tr", null, [el("td", { text: a.name }), el("td", { text: S.focus || S.proficient ? "●" : "○" }), el("td", { text: sgn(S.bonus || d.attributes[a.key].mod) })]));
    });
    right.push(sv);

    // versatile
    var V = ch.versatile || {};
    var anyV = ["insight", "performance", "intimidation"].some(function (k) { return V[k] && (V[k].attr || V[k].skill); });
    if (anyV) {
      right.push(sect("Versatile skills"));
      ["insight", "performance", "intimidation"].forEach(function (k) {
        var s = V[k] || {};
        right.push(el("div.ps-skrow", null, [el("span.ps-sk-n", { text: k.charAt(0).toUpperCase() + k.slice(1) }), el("span.ps-sk-a", { text: s.attr || "—" }), el("span.ps-sk-b", { text: s.skill || "—" })]));
      });
    }

    // talents
    if ((ch.talents || []).length) {
      right.push(sect("Talents"));
      right.push(el("div.ps-chiprow", null, (ch.talents || []).map(function (t) { return chip(t); })));
    }

    cols.push(el("div.ps-col", null, left), el("div.ps-col", null, right));
    body.push(el("div.ps-cols", null, cols));

    // chrome
    body.push(el("div.ps-rule.ps-faint"));
    body.push(chromeBlock(ch, d));

    return page("CHROME & PROFICIENCY", "02 · DETAIL", ch, body);
  }

  function chromeBlock(ch, d) {
    var installed = (eng.installedCyberware ? eng.installedCyberware(ch) : (ch.cyberware || []));
    var tax = d.chromeTax || { total: 0, index: 0, resDiePenalty: 0, fpPenalty: 0 };
    var zones = (EN.cyberware && EN.cyberware.zones) || {};
    var SIL_W = 825, SIL_H = 1970;
    // silhouette + markers
    var markers = installed.map(function (cw) {
      var z = zones[cw.zone] || zones.Hardware || { at: { x: SIL_W / 2, y: SIL_H / 2 } };
      var p = (z.sided && cw.side === "L") ? z.left : (z.sided && cw.side === "R") ? z.right : z.at;
      if (!p) p = z.at || { x: SIL_W / 2, y: SIL_H / 2 };
      return el("span.ps-sil-mark", { style: { left: (p.x / SIL_W * 100) + "%", top: (p.y / SIL_H * 100) + "%" } });
    });
    // lightweight vector body outline (825×1970 space, matches zone coords) — keeps print files small
    var OUTLINE = '<svg viewBox="0 0 825 1970" preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;width:100%;height:100%">' +
      '<g fill="none" stroke="#b6af9c" stroke-width="62" stroke-linecap="round">' +
      '<line x1="362" y1="330" x2="185" y2="720"/><line x1="463" y1="330" x2="645" y2="720"/>' +
      '<line x1="372" y1="640" x2="332" y2="1880"/><line x1="453" y1="640" x2="495" y2="1880"/></g>' +
      '<circle cx="412" cy="150" r="82" fill="#e3ddcc" stroke="#b6af9c" stroke-width="6"/>' +
      '<rect x="320" y="250" width="184" height="432" rx="46" fill="#e3ddcc" stroke="#b6af9c" stroke-width="6"/></svg>';
    var sil = el("div.ps-sil", { html: OUTLINE });
    markers.forEach(function (m) { sil.appendChild(m); });

    var listRows = installed.length ? installed.map(function (cw) {
      return el("div.ps-skrow", null, [
        el("span.ps-sk-n", { text: cw.name || cw.base || "Chrome" }),
        el("span", { style: { width: "78px", fontSize: "9px", color: "#6a747b" }, text: cw.zone + (cw.side ? "·" + cw.side : "") }),
        el("span", { style: { width: "38px", textAlign: "right", fontSize: "9px", color: "#0c6f81" }, text: (cw.sp || 0) + " SP" })
      ]);
    }) : [note("No chrome installed.")];

    var right = [
      sect("Cybernetic frame", "Static " + tax.total + " SP"),
      el("div.ps-statrow", null, [
        stat("STATIC", tax.total, "total SP"),
        stat("CHROME TAX", "T" + (tax.index || 0), tax.index ? "−" + tax.resDiePenalty + " RD / FP" : "safe"),
        stat("INSTALLED", installed.length, "pieces")
      ])
    ].concat(listRows);

    return el("div.ps-cols", null, [
      el("div.ps-col.ps-col-sil", null, [sect("Body map"), sil]),
      el("div.ps-col", null, right)
    ]);
  }

  /* =======================================================================
     PAGE 3 — class spotlight (+ features)
     ======================================================================= */
  function gridBlock(ch, d) {
    var g = d.grid; if (!g) return null;
    var deck = g.deck;
    var out = [sect("#GRID rig", g.userType)];
    out.push(el("div.ps-statrow", null, [
      stat("CIPHER ATK", sgn(g.effectiveAttack), "vs Security"),
      stat("SAVE DC", g.effectiveSaveDC, "node saves"),
      stat("LINKS", g.unlimitedLinks ? "∞" : g.maxLinks, g.unlimitedLinks ? "SysAdmin" : "2×Cal"),
      stat("STABILITY", "DC " + g.stabilityDcBase, "or ½ dmg")
    ]));
    out.push(el("div.ps-row", null, [
      field("Smartdeck / Buddy", deck ? deck.tier + (deck.type === "buddy" ? " Buddy" : " Deck") : "—", { style: { flex: "2 1 0" } }),
      field("Device", deck ? sgn(deck.deviceBonus) : "—", { style: { flex: "0 0 56px" } }),
      field("Deck HP", deck ? deck.maxHp : "—", { style: { flex: "0 0 56px" } }),
      field("Bandwidth", g.bandwidthMax != null ? g.bandwidthMax : "—", { style: { flex: "0 0 70px" } })
    ]));
    if (deck && deck.traits && deck.traits.length) out.push(el("div.ps-chiprow", null, deck.traits.map(function (t) { return chip(t); })));
    if (ch.grid && (ch.grid.deckMods || []).length) {
      var mods = (EN.grid.mods || []).filter(function (m) { return ch.grid.deckMods.indexOf(m.key) !== -1; });
      out.push(el("div.ps-chiprow", null, mods.map(function (m) { return chip(m.name, ".ps-chip-box"); })));
    }
    // repertoire write-in grid
    out.push(sect("Repertoire", "cipher · CX · cost"));
    var rep = el("div.ps-rep");
    for (var i = 0; i < 8; i++) rep.appendChild(writeLine(""));
    out.push(rep);
    return el("div", null, out);
  }
  function flowBlock(ch, d) {
    var f = d.flow; if (!f) return null;
    var out = [sect("Flow reservoir", f.attributeName + " · Overdraw at 0 FP")];
    out.push(el("div.ps-statrow", null, [
      stat("FP MAX", f.max, "(Cal×3)+mod"),
      stat("FLOW DC", f.dc, "enemy saves"),
      stat("FLOW ATK", sgn(f.attack), "d20 + this"),
      stat("STRAIN", "0–6", "track in play")
    ]));
    out.push(sect("Known resonances", "Kinetic · Thermal · EM · Visceral · Spatial · Cognitive · Temporal"));
    var res = el("div.ps-rep");
    for (var i = 0; i < 5; i++) res.appendChild(writeLine(""));
    out.push(res);
    out.push(note("Invocation = Resonance + Intent + Delivery + Force + Duration. Spend FP; Overdraw costs 1d4 Vitality/FP and risks Strain."));
    return el("div", null, out);
  }
  function page3(ch, d) {
    var body = [];
    var spotlight = ch.class === "codebreaker" ? gridBlock(ch, d) : ch.class === "shaper" ? flowBlock(ch, d) : null;
    if (spotlight) { body.push(spotlight); body.push(el("div.ps-rule.ps-faint")); }

    // abilities — at a glance: one-line snippets grouped by action economy, with use-trackers
    body.push(sect("Abilities — at a glance", "track uses"));
    var feats = (d.features || []).concat(talentFeatures(ch));
    if (ch.class === "codebreaker") {
      var EX = (EN.classes && EN.classes.codebreaker && EN.classes.codebreaker.extra && EN.classes.codebreaker.extra.gridExploits) || [];
      feats = feats.concat(EX.map(function (x) { return { name: x.name, text: (x.action ? x.action + ". " : "") + (x.text || ""), source: "Signature Exploit", level: 0 }; }));
    }
    feats = feats.filter(function (f) { return !/^(Universal Upgrade|Subclass Feature)$/.test(f.name) && !/Subclass( Capstone)?$/.test(f.name); });
    if (!feats.length) body.push(note("No features yet."));
    // resource-pool features describe their spend-Actions in prose; pin them Passive
    var ACT_OVERRIDE = { Bandwidth: "Passive", Overdrive: "Passive", Leverage: "Passive", Moxie: "Passive", "Battlefield Command": "Passive", Triage: "Passive", Reservoir: "Passive", "Core Channeling": "Passive" };
    var groups = { Passive: [], Action: [], Swift: [], Impulse: [], Free: [] };
    feats.forEach(function (f) { f._act = ACT_OVERRIDE[f.name] || actionCost(f.text); (groups[f._act] || groups.Passive).push(f); });
    function snipRow(f) {
      var cost = f._act !== "Passive" ? costTag(f.text) : null, uses = parseUses(f.text, d);
      var row = el("div.ps-snip", null, [
        el("span.ps-snip-n", { text: f.name }),
        cost ? el("span.ps-snip-cost", { text: cost }) : null,
        el("span.ps-snip-b", { text: briefFor(f) }),
        el("span.ps-snip-src", { text: (f.source || "") + (f.level ? " · L" + f.level : "") })
      ]);
      if (uses) {
        var u = el("span.ps-snip-uses", { title: uses.max + " / " + uses.recharge });
        for (var i = 0; i < Math.min(uses.max, 6); i++) u.appendChild(el("span.ps-pip"));
        row.appendChild(u);
      }
      return row;
    }
    [["Passive", "PASSIVE"], ["Action", "ACTION"], ["Swift", "SWIFT ACTION"], ["Impulse", "IMPULSE · REACTION"], ["Free", "FREE ACTION"]].forEach(function (g) {
      var arr = groups[g[0]];
      if (!arr.length) return;
      body.push(el("div.ps-snip-gh", { text: g[1] + " · " + arr.length }));
      arr.forEach(function (f) { body.push(snipRow(f)); });
    });

    var tag = ch.class === "codebreaker" ? "03 · #GRID" : ch.class === "shaper" ? "03 · FLOW" : "03 · ABILITIES";
    var title = ch.class === "codebreaker" ? "#GRID OPERATIONS" : ch.class === "shaper" ? "FLOW & RESONANCE" : "FEATURES & ABILITIES";
    return page(title, tag, ch, body);
  }

  /* ---- overlay control ---- */
  function close() { var o = document.getElementById("print-overlay"); if (o) o.parentNode.removeChild(o); document.removeEventListener("keydown", onKey); }
  function onKey(e) { if (e.key === "Escape") close(); }
  function open() {
    var ch = store.active();
    if (!ch) { EN.ui.toast("No #PRINT on file."); return; }
    close();
    var d = eng.derive(ch);
    var pages = [page1(ch, d), page2(ch, d), page3(ch, d)];
    var bar = el("div.print-bar", null, [
      el("span.print-bar-t", { text: "⎙ HARDCOPY PREVIEW" }),
      el("span.print-bar-s", { text: (ch.name || "Unnamed") + " · " + pages.length + " pages · Letter" }),
      el("span", { style: { flex: 1 } }),
      el("button.btn.sm.primary", { onclick: function () { window.print(); } }, "⎙ PRINT / SAVE PDF"),
      el("button.btn.sm", { onclick: close }, "✕ CLOSE")
    ]);
    var ov = el("div#print-overlay", null, [bar, el("div.print-scroll", null, pages)]);
    document.body.appendChild(ov);
    document.addEventListener("keydown", onKey);
  }

  return { open: open, close: close };
})();
