/* ===========================================================================
   ELYSIUM NIGHTS - Printable Hardcopy ("Freelancer Field Dossier")
   A full character record: five sections, each its own print page, rendered as
   an on-screen preview overlay that prints clean via @media print. Auto-filled
   from EN.engine.derive(ch). EN vocabulary only; no D&D terms; no em/en dashes.
     01 Front Sheet      - combat: stats, attributes, survival, skills, saves, senses, attacks, defend, conditions, proficiencies
     02 Talents & Lineage- abilities at a glance + talents + lineage + universal upgrades
     03 Gear & Holdings  - currency, inventory, equipped state
     04 Profile          - appearance, contacts, backstory, inner profile, Cred / Heat
     05 Systems          - Flow, Cyberware, #GRID (only the panels a build uses)
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
    return el("div.ps-wl", null, [label ? el("span.ps-fl", { text: label }) : null, el("span.ps-wl-line")]);
  }
  function pblock(label, value, tall) {
    return el("div.ps-block" + (tall ? ".ps-block-tall" : ""), null, [
      el("div.ps-fl", { text: label }),
      value ? el("div.ps-block-v", { text: txt(value) }) : null
    ]);
  }
  function note(t, cls) { return el("p.ps-note" + (cls || ""), { text: t }); }
  function col(kids, cls) { return el("div.ps-col" + (cls || ""), null, kids); }
  function cols(a, b) { return el("div.ps-cols", null, [col(a), col(b)]); }

  function pageHead(title, tag, ch) {
    var serial = "ID." + ((ch.meta && ch.meta.id) ? ch.meta.id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() : "000000");
    return el("div.ps-head", null, [
      el("div", null, [el("div.ps-kicker", { text: "ELYSIUM NIGHTS" }), el("div.ps-title", { text: title })]),
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

  /* ---- ability snippets: tags (action / cost / uses) + a one-line brief ---- */
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
    if (pick.length > 116) pick = pick.slice(0, 114).replace(/\s+\S*$/, "") + "...";
    return pick;
  }
  function briefFor(f) { var b = EN.briefs && EN.briefs[f._base || f.name]; return b || autoBrief(f.text); }
  function talentFeatures(ch) {
    var TAL = Array.isArray(EN.talents) ? EN.talents : [];
    return (ch.talents || []).map(function (tk) {
      var t = TAL.find(function (x) { return x.key === tk || x.name === tk; });
      return t ? { name: t.name, text: t.text || t.desc || "", source: "Talent", level: 0 } : null;
    }).filter(Boolean);
  }
  // merged, deduped feature list shared by the front sheet and page 2. Tiered upgrade
  // chains - a base ability ("Cheap Shot") plus "Base (variant)" rows ("Cheap Shot (2d6)"
  // ... "(5d6)") - collapse to one entry: the base text, relabeled to the highest tier.
  function gatherFeatures(ch, d) {
    var feats = (d.features || []).concat(talentFeatures(ch));
    if (ch.class === "codebreaker") {
      var EX = (EN.classes && EN.classes.codebreaker && EN.classes.codebreaker.extra && EN.classes.codebreaker.extra.gridExploits) || [];
      feats = feats.concat(EX.map(function (x) { return { name: x.name, text: (x.action ? x.action + ". " : "") + (x.text || ""), source: "Signature Exploit", level: 0 }; }));
    }
    feats = feats.filter(function (f) { return !/^(Universal Upgrade|Subclass Feature)$/.test(f.name) && !/Subclass( Capstone)?$/.test(f.name); });
    function base(n) { return n.replace(/\s*\([^)]*\)\s*$/, "").trim(); }
    var present = {}; feats.forEach(function (f) { present[f.name] = true; });
    var top = {}; // base name -> highest-level variant reached
    feats.forEach(function (f) {
      var b = base(f.name);
      if (b !== f.name && present[b]) { var c = top[b]; if (!c || (f.level || 0) >= (c.level || 0)) top[b] = { name: f.name, level: f.level || 0 }; }
    });
    return feats.filter(function (f) { var b = base(f.name); return !(b !== f.name && present[b]); }) // drop intermediate variant rows
      .map(function (f) { return top[f.name] ? { name: top[f.name].name, _base: f.name, text: f.text, source: f.source, level: f.level } : f; }); // show top tier, keep base brief
  }
  // currency abbreviation matching costTag()'s output (Moxie->MOX, Flow->FP, Bandwidth->BW)
  function resAbbr(name) {
    var r = (name || "").toLowerCase();
    if (r.indexOf("bandwidth") === 0) return "BW";
    if (r.indexOf("flow") === 0 || r === "fp") return "FP";
    return (name || "RES").slice(0, 3).toUpperCase();
  }
  // active abilities that spend the class resource, for the front-sheet quick reference:
  //   (1) the named options the resource is spent on - e.g. Scoundrel Gambits - parsed
  //       from the resource feature, picking up each one's action type ("(Impulse Action)");
  //   (2) named features that actively spend it ("As an Action, you spend 2 Moxie": Cripple,
  //       Pressure), but NOT passive riders (Fight Dirty) or triggers ("have spent ... Moxie").
  // Returns [name, cost, actionType] rows.
  function actLabel(s) {
    if (/Impulse/i.test(s)) return "Impulse";
    if (/Swift/i.test(s)) return "Swift";
    if (/Free/i.test(s)) return "Free";
    if (/Action/i.test(s)) return "Action";
    return "";
  }
  function resourceSpenders(ch, d, feats) {
    var res = d.resource || d.flow;
    if (!res || !res.name) return [];
    var rname = res.name, abbr = resAbbr(rname), seen = {}, rows = [];
    function add(name, cost, act) { var k = name.toLowerCase(); if (seen[k]) return; seen[k] = 1; rows.push([name, cost, act || ""]); }
    var resFeat = (d.features || []).find(function (f) { return f.name === rname; });
    var blurb = (resFeat && resFeat.text) || "";
    var fuels = res.fuels || blurb;
    var defCost = ((blurb || fuels).match(/costs?\s+(\d+)\s/i) || [])[1] || "1";
    // (1) named options (Gambits) - list lives after the ":" in the fuels blurb
    var ci = fuels.indexOf(":");
    if (ci >= 0) {
      fuels.slice(ci + 1).split(/\.\s/)[0].split(/,\s*/).forEach(function (s) {
        var nm = s.replace(/^and\s+/i, "").trim();
        if (!nm || !/^[A-Z]/.test(nm) || nm.length >= 38) return;
        var esc = nm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // explicit "(Impulse Action):" tag wins; otherwise a "When ..." trigger is a reaction (Impulse)
        var m = blurb.match(new RegExp(esc + "\\s*(?:\\(([^)]*)\\))?\\s*:\\s*(\\w+)", "i"));
        var act = m && m[1] ? actLabel(m[1]) : (m && /^When$/i.test(m[2] || "") ? "Impulse" : "");
        add(nm, defCost + " " + abbr, act);
      });
    }
    // (2) named features that actively spend the resource. Classify by the clause that
    // actually spends it - not stray action-type mentions elsewhere in the effect text
    // (e.g. Fight Dirty's "cannot take Impulse Actions") - so passive riders drop out.
    var spend = new RegExp("spend(?:s|ing)?\\s+\\d+\\s+" + rname, "i");
    (feats || []).forEach(function (f) {
      var t = f.text || "";
      if (f.name === rname || !spend.test(t)) return;
      var clause = t.split(/\.\s+/).find(function (s) { return spend.test(s); }) || t;
      var act = actionCost(clause);
      if (act === "Passive") return;
      add(f.name, costTag(t) || (defCost + " " + abbr), act);
    });
    return rows;
  }

  /* ---- weapon / item lookup ---- */
  var GROUP_CAT = { Simple: "Simple Weapons", Martial: "Martial Weapons", Sidearm: "Sidearms", Longarm: "Longarms", Heavy: "Heavy Weapons", Launcher: "Explosive Launchers", Thrown: "Thrown Weapons", Bowfire: "Bowfire Weapons" };
  function allGear() {
    var g = EN.gearCatalog || {};
    return [].concat((g.melee && g.melee.items) || [], (g.ranged && g.ranged.items) || [], (g.signature && g.signature.items) || [],
      (g.signature && g.signature.munitions) || [], (g.ammo && g.ammo.items) || [], (g.armor && g.armor.items) || [], (g.tools && g.tools.items) || []);
  }
  function findWeapon(name) {
    var g = EN.gearCatalog || {};
    return [].concat((g.melee && g.melee.items) || [], (g.ranged && g.ranged.items) || [], (g.signature && g.signature.items) || []).find(function (w) { return w.name === name; });
  }
  function catItem(name) { return allGear().find(function (i) { return i.name === name; }); }
  function weaponHit(ch, d, w) {
    var melee = w._melee || w.group === "Simple" || w.group === "Martial";
    var thrown = (w.traits || []).some(function (t) { return /^Thrown/.test(t); });
    var finesse = (w.traits || []).some(function (t) { return /^Finesse/.test(t); });
    var bod = d.attributes.BOD.mod, agi = d.attributes.AGI.mod;
    var useAgi = melee ? (finesse && agi > bod) : (thrown ? agi >= bod : true);
    var mod = useAgi ? agi : bod;
    var cat = GROUP_CAT[w.group], tier = cat ? eng.effectiveGearTier(ch, "weapons", cat) : "untrained";
    var prof = ((EN.rules.profTiers || {})[tier] || {}).d20 || 0;
    return mod + prof;
  }

  /* ---- special senses granted by features ---- */
  var SENSE_GRANTS = {
    "Lowlight Optics": { sense: "Darkvision", range: "12 sp." },
    "Predator's Glare": { sense: "Darkvision", range: "6 sp." },
    "Fungal Network": { sense: "Tremor Sense", range: "6 sp." },
    "Seismic Sense": { sense: "Tremor Sense", range: "8 sp." },
    "Warmblood Sense": { sense: "Heat Sense", range: "6 sp." },
    "Blood-Scent Tracker": { sense: "Blood Scent", range: "6 sp." },
    "Disturbance Compass": { sense: "Flow Sense", range: "12 sp." },
    "Scent Marker": { sense: "Scent Tracking", range: "1 mile" },
    "The Machine Medium": { sense: "Sprite Sight", range: "passive" },
    "Echo Sighted": { sense: "Resonance Sense", range: "12 sp." }
  };
  function proficientCats(ch, bucket) {
    return ((EN.rules.gear || {})[bucket] || []).filter(function (cat) { return eng.effectiveGearTier(ch, bucket, cat) !== "untrained"; });
  }
  // Proficiencies & Training rows (weapons/armor/tools/vehicles + skill foci/specializations)
  function proficiencyRows(ch) {
    var rows = [];
    [["Weapons", "weapons"], ["Armor", "armor"], ["Tools", "tools"], ["Vehicles", "vehicles"]].forEach(function (p) {
      var cats = proficientCats(ch, p[1]);
      if (cats.length) rows.push(el("div.ps-proc", null, [el("span.ps-fl", { text: p[0] }), el("span.ps-proc-v", { text: cats.join(", ") })]));
    });
    var foci = (ch.skillFocuses || []).map(function (f) { var sk = EN.rules.skillByKey[f.skill]; return (sk ? sk.name : f.skill) + (f.aspect ? " (" + f.aspect + ")" : ""); });
    if (foci.length) rows.push(el("div.ps-proc", null, [el("span.ps-fl", { text: "Focus" }), el("span.ps-proc-v", { text: foci.join(", ") })]));
    var specs = (ch.specializations || []).map(function (f) { var sk = EN.rules.skillByKey[f.skill]; return (sk ? sk.name : f.skill) + (f.aspect ? " (" + f.aspect + ")" : ""); });
    if (specs.length) rows.push(el("div.ps-proc", null, [el("span.ps-fl", { text: "Spec" }), el("span.ps-proc-v", { text: specs.join(", ") })]));
    return rows;
  }

  /* =======================================================================
     SECTION 01 - FRONT SHEET
     ======================================================================= */
  function frontSheet(ch, d) {
    var id = ch.identity || {}, body = [];
    var classLine = [d.classInfo ? d.classInfo.name : "-", d.subclassInfo ? d.subclassInfo.name : null].filter(Boolean).join(" · ");
    var speciesLine = [d.speciesInfo ? d.speciesInfo.name : "-", d.lineageInfo ? d.lineageInfo.name : null].filter(Boolean).join(" · ");
    var progression = ch.useXp ? ("XP " + (d.xp || 0) + (d.xpForNext ? " / " + d.xpForNext : "")) : ("Milestones " + ((ch.milestones && ch.milestones.major) || 0) + " maj, " + ((ch.milestones && ch.milestones.minor) || 0) + " min");

    body.push(el("div.ps-grid2", null, [field("Handle / alias", id.handle || ch.name), field("Name on record", ch.name)]));
    body.push(el("div.ps-row", null, [
      field("Class · level", classLine + " · L" + d.level, { style: { flex: "3 1 0" } }),
      field("Lineage", speciesLine, { style: { flex: "2 1 0" } }),
      field("Cal", d.caliber, { style: { flex: "0 0 40px" } }),
      field("Size", d.size || "-", { style: { flex: "0 0 70px" } })
    ]));
    body.push(el("div.ps-row", null, [
      field("Background", d.backgroundInfo ? d.backgroundInfo.name : "-", { style: { flex: "2 1 0" } }),
      field("Progression", progression, { style: { flex: "2 1 0" } })
    ]));

    // top stat strip
    var dg = d.defenseGear || {};
    body.push(el("div.ps-statrow", { style: { margin: "10px 0 4px" } }, [
      stat("DEF", d.defense, (d.defenseAttr === "BOD" ? "Body" : "Agility") + (dg.shield ? " +shield" : "")),
      stat("DR", d.armorDR || 0, dg.armor ? dg.armor.name : "no armor"),
      stat("SPD", d.speed, "spaces"),
      stat("INIT", sgn(d.attributes.AGI.mod), "Agility")
    ]));

    // attribute matrix - compact horizontal strip directly under the stat strip
    body.push(sect("Attribute Matrix"));
    var attrStrip = el("div.ps-attr-strip");
    (EN.rules.attributes || []).forEach(function (a) {
      var A = d.attributes[a.key];
      attrStrip.appendChild(el("div.ps-attrc", { title: A.cyberBonus ? "includes +" + A.cyberBonus + " from chrome" : "" }, [
        el("div.ps-attrc-n", { text: a.name }),
        el("div.ps-attrc-v", { text: A.score + (A.cyberBonus ? "*" : "") }),
        el("div.ps-attrc-m", { text: sgn(A.mod) })
      ]));
    });
    body.push(attrStrip);
    // blank/write-in table: header row + prefilled rows + blank rows up to minRows
    function wtable(headers, rows, minRows, clsName) {
      var t = el("table.ps-tbl.ps-tbl-w" + (clsName || ""));
      t.appendChild(el("tr", null, headers.map(function (h) { return el("th", { text: h }); })));
      var n = 0;
      (rows || []).forEach(function (r) { t.appendChild(el("tr", null, r.map(function (c) { return el("td", { text: c == null ? "" : String(c) }); }))); n++; });
      for (; n < (minRows || 0); n++) t.appendChild(el("tr", null, headers.map(function () { return el("td", { html: "&nbsp;" }); })));
      return t;
    }

    /* ===== LEFT column: Skills, Versatile, Saves, Conditions, Senses ===== */
    var L = [sect("Skills", "d20 bonus · Snag = untrained")];
    var sk2 = el("div.ps-sk2");
    (d.skills || []).forEach(function (s) {
      sk2.appendChild(el("div.ps-skrow", null, [
        el("span.ps-sk-a", { text: s.attr }),
        el("span.ps-sk-n", { text: s.name }),
        s.untrained ? chip("Snag", ".ps-chip-snag") : (s.focus ? chip("Focus", ".ps-chip-box") : null),
        el("span.ps-sk-b", { text: sgn(s.total) })
      ]));
    });
    L.push(sk2);
    var V = ch.versatile || {};
    L.push(sect("Versatile Skills"));
    ["insight", "performance", "intimidation"].forEach(function (k) {
      var s = V[k] || {};
      L.push(el("div.ps-skrow", null, [
        el("span.ps-sk-n", { text: k.charAt(0).toUpperCase() + k.slice(1) }),
        el("span.ps-sk-a", { text: s.attr || "__" }),
        el("span.ps-sk-b2", { text: s.skill || "__________" })
      ]));
    });
    L.push(sect("Saves", "d20 + MOD + Caliber (Focus)"));
    var sv = el("table.ps-tbl");
    sv.appendChild(el("tr", null, ["SAVE", "FOCUS", "BONUS"].map(function (h) { return el("th", { text: h }); })));
    (EN.rules.attributes || []).forEach(function (a) {
      var S = d.saves[a.key] || {};
      sv.appendChild(el("tr", null, [el("td", { text: a.name }), el("td", { text: S.focus ? "FOCUS" : "" }), el("td", { text: sgn(S.bonus != null ? S.bonus : d.attributes[a.key].mod) })]));
    });
    L.push(sv);
    L.push(sect("Conditions & Fatigue"));
    var active = (ch.conditions || []);
    L.push(el("div.ps-block.ps-block-tall", null, [active.length ? el("div.ps-block-v", { text: active.join(", ") }) : null]));
    L.push(el("div.ps-surv-row", { style: { marginTop: "6px" } }, [el("span.ps-fl", { text: "FATIGUE" }), pips(ch.fatigue || 0, 6, "")]));
    L.push(sect("Senses", "10 + MOD + PROF (+/- 5 Edge/Snag)"));
    ["perception", "investigation", "intuition", "systems"].forEach(function (k) {
      var s = (d.skills || []).find(function (x) { return x.key === k; });
      if (s) L.push(el("div.ps-skrow", null, [el("span.ps-sk-n", { text: "Passive " + s.name }), el("span.ps-sk-b", { text: s.passive })]));
    });
    var special = (d.features || []).map(function (f) { var g = SENSE_GRANTS[f.name]; return g ? el("div.ps-skrow", null, [el("span.ps-sk-n", { text: g.sense }), el("span.ps-sk-a", { text: f.name }), el("span.ps-sk-b2", { text: g.range })]) : null; }).filter(Boolean);
    if (special.length) { L.push(sect("Special Senses")); special.forEach(function (r) { L.push(r); }); }

    /* ===== RIGHT column: Vitality & Wounds, Attacks, Abilities, Proficiencies ===== */
    var R = [sect("Vitality & Wounds", "Vigor to Vitality to Wounds")];
    // 2-column grid: left = Vigor / Vitality / Death Saves, right = Resilience / Wounds.
    // boxes read "current / max"; the write box is current, the printed box is max.
    var vw = el("div.ps-vw");
    vw.appendChild(el("div.ps-vw-cell", null, [
      el("span.ps-fl", { text: "VIGOR" }), el("span.ps-box.ps-write")
    ]));
    vw.appendChild(el("div.ps-vw-cell", null, [
      el("span.ps-fl", { text: "RESILIENCE d" + (d.resilienceDie || "?") }), pips(d.resilienceMax, d.resilienceMax, "dot")
    ]));
    vw.appendChild(el("div.ps-vw-cell", null, [
      el("span.ps-fl", { text: "VITALITY" }), el("span.ps-box.ps-write"), el("span.ps-vw-sl", { text: "/" }), el("span.ps-box", { text: d.vitalityMax })
    ]));
    vw.appendChild(el("div.ps-vw-cell", null, [
      el("span.ps-fl.ps-emb", { text: "WOUNDS" }), el("span.ps-box.ps-write"), el("span.ps-vw-sl", { text: "/" }), el("span.ps-box", { text: d.woundsMax })
    ]));
    vw.appendChild(el("div.ps-vw-cell.ps-vw-span", null, [
      el("span.ps-fl", { text: "DEATH SAVES" }), el("span.ps-fl.ps-acc", { text: "S" }), pips((ch.deathSaves && ch.deathSaves.s) || 0, 3, "dot"), el("span.ps-fl.ps-emb", { text: "F" }), pips((ch.deathSaves && ch.deathSaves.f) || 0, 3, "dot")
    ]));
    R.push(vw);
    // Attacks table (equipped weapons auto-filled, blank rows for the rest)
    R.push(sect("Attacks"));
    var atkRows = (ch.equippedWeapons || []).map(findWeapon).filter(Boolean).map(function (w) {
      return [w.name, sgn(weaponHit(ch, d, w)), w.damage || "", (w.traits || []).join(", ")];
    });
    R.push(wtable(["Name", "Atk Bonus / DC", "Damage & Type", "Notes"], atkRows, Math.max(6, atkRows.length + 2), ".ps-tbl-atk"));
    // Abilities table (blank write-in; resource tracker in the header)
    var resLabel = d.resource ? (d.resource.name.toUpperCase() + " MAX " + d.resource.max) : (d.flow ? "FLOW FP MAX " + d.flow.max : "");
    var trackPips = d.resource ? pips(d.resource.max, Math.min(d.resource.max, 12), "dot") : null;
    R.push(el("div.ps-sect", null, [
      el("span", { text: "Abilities" }),
      el("span.ps-sect-track", null, [resLabel ? el("span.ps-fl", { text: resLabel }) : null, trackPips].filter(Boolean))
    ]));
    // auto-fill with the active abilities that spend the class resource (e.g. Moxie),
    // capped to keep the section on one page; pad with blank rows for write-ins.
    var spenders = resourceSpenders(ch, d, gatherFeatures(ch, d)).slice(0, 10);
    R.push(wtable(["Name", "Cost", "Action Type"], spenders, 10, ".ps-tbl-abl"));
    // (Proficiencies & Training now lives on page 2, under Universal Upgrades.)

    body.push(cols(L, R));
    return page("FREELANCER FIELD DOSSIER", "01 · FRONT", ch, body);
  }

  /* =======================================================================
     SECTION 02 - TALENTS & LINEAGE (abilities at a glance)
     ======================================================================= */
  function abilitiesBlocks(ch, d) {
    var out = [];
    var feats = gatherFeatures(ch, d);
    if (!feats.length) { out.push(note("No features yet.")); return out; }
    var ACT_OVERRIDE = { Bandwidth: "Passive", Overdrive: "Passive", Leverage: "Passive", Moxie: "Passive", "Battlefield Command": "Passive", Triage: "Passive", Reservoir: "Passive", "Core Channeling": "Passive", "Reality Fracture": "Swift" };
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
      if (uses) { var u = el("span.ps-snip-uses", { title: uses.max + " / " + uses.recharge }); for (var i = 0; i < Math.min(uses.max, 6); i++) u.appendChild(el("span.ps-pip")); row.appendChild(u); }
      return row;
    }
    [["Passive", "PASSIVE"], ["Action", "ACTION"], ["Swift", "SWIFT ACTION"], ["Impulse", "IMPULSE · REACTION"], ["Free", "FREE ACTION"]].forEach(function (g) {
      var arr = groups[g[0]]; if (!arr.length) return;
      out.push(el("div.ps-snip-gh", { text: g[1] + " · " + arr.length }));
      arr.forEach(function (f) { out.push(snipRow(f)); });
    });
    return out;
  }
  function talentsLineage(ch, d) {
    var body = [sect("Abilities at a Glance", "track uses")];
    abilitiesBlocks(ch, d).forEach(function (b) { body.push(b); });
    // universal upgrades chosen
    var uu = ch.universalUpgrades || {};
    var uuKeys = Object.keys(uu);
    if (uuKeys.length) {
      body.push(el("div.ps-rule.ps-faint"));
      body.push(sect("Universal Upgrades"));
      uuKeys.sort(function (a, b) { return Number(a) - Number(b); }).forEach(function (lv) {
        var u = uu[lv] || {};
        var what = u.type === "attr" ? ("+1 " + (u.attr || "Attribute")) : u.type === "talent" ? ("Talent: " + (u.talent || u.name || "")) : u.type === "evolution" ? ("Lineage Evolution: " + (u.feature || u.name || "")) : (u.name || u.type || "choice");
        body.push(el("div.ps-skrow", null, [el("span.ps-sk-a", { text: "L" + lv }), el("span.ps-sk-n", { text: what })]));
      });
    }
    // proficiencies & training (relocated from the front sheet)
    var prof = proficiencyRows(ch);
    if (prof.length) {
      body.push(el("div.ps-rule.ps-faint"));
      body.push(sect("Proficiencies & Training"));
      prof.forEach(function (r) { body.push(r); });
    }
    return page("TALENTS & LINEAGE", "02 · PROGRESSION", ch, body);
  }

  /* =======================================================================
     SECTION 03 - GEAR & HOLDINGS
     ======================================================================= */
  function gearHoldings(ch, d) {
    var body = [];
    // currency
    body.push(el("div.ps-row", null, [
      field("Glimmer", "G " + (ch.glimmer || 0).toLocaleString(), { style: { flex: "1 1 0" } }),
      el("div.ps-field", { style: { flex: "1 1 0" } }, [el("div.ps-fl", { text: "Nexus Tokens" }), el("div.ps-fv ps-write-fv", { html: "&nbsp;" })])
    ]));

    // equipped loadout summary
    var dg = d.defenseGear || {};
    var loadout = [];
    (ch.equippedWeapons || []).forEach(function (n) { loadout.push(chip(n, ".ps-chip-box")); });
    if (dg.armor) loadout.push(chip("Armor: " + dg.armor.name, ".ps-chip-box"));
    if (dg.shield) loadout.push(chip("Shield: " + dg.shield.name, ".ps-chip-box"));
    if (dg.focus) loadout.push(chip("Focus: " + dg.focus.name, ".ps-chip-box"));
    body.push(sect("Equipped / Worn"));
    body.push(loadout.length ? el("div.ps-chiprow", null, loadout) : note("Nothing equipped."));

    // inventory table
    body.push(sect("Inventory", "qty · state · tags"));
    var entries = (ch.equipment || []).filter(function (e) { return e.qty > 0; });
    if (!entries.length) body.push(note("Stash empty."));
    else {
      var tbl = el("table.ps-tbl.ps-tbl-inv");
      tbl.appendChild(el("tr", null, ["ITEM", "QTY", "STATE", "TAGS"].map(function (h) { return el("th", { text: h }); })));
      entries.forEach(function (e) {
        var it = catItem(e.name);
        var worn = (ch.equippedWeapons || []).indexOf(e.name) !== -1 || ch.equippedArmor === e.name || ch.equippedShield === e.name || ch.equippedFocus === e.name;
        var tags = it ? [it.group || it.kind || it.bucket, it.legality, it.availability].filter(Boolean).join(" · ") : "";
        tbl.appendChild(el("tr", null, [
          el("td", { text: e.name }), el("td", { text: "x" + e.qty }), el("td", { text: worn ? "equipped" : "stash" }), el("td", { text: tags })
        ]));
      });
      body.push(tbl);
    }

    // chrome stash (uninstalled)
    var stash = (ch.cyberStash || []);
    if (stash.length) {
      body.push(sect("Chrome Stash", "uninstalled"));
      stash.forEach(function (cw) { body.push(el("div.ps-skrow", null, [el("span.ps-sk-n", { text: cw.name || cw.base }), el("span.ps-sk-a", { text: cw.zone || "" }), el("span.ps-sk-b2", { text: (cw.sp || 0) + " SP" })])); });
    }

    body.push(el("div.ps-rule.ps-faint"));
    body.push(sect("Load / Carry"));
    body.push(note("Encumbrance is tracked at the table per the rulebook; note carried bulk here."));
    body.push(el("div.ps-block.ps-block-tall"));
    return page("GEAR & HOLDINGS", "03 · GEAR", ch, body);
  }

  /* =======================================================================
     SECTION 04 - PROFILE
     ======================================================================= */
  function profile(ch, d) {
    var id = ch.identity || {}, body = [];
    body.push(el("div.ps-grid2", null, [
      pblock("Concept", id.concept, false),
      pblock("Where you came from", id.whereFrom, false)
    ]));
    body.push(sect("Appearance"));
    body.push(pblock("", id.appearance, true));
    body.push(sect("Inner Profile", "pure story"));
    body.push(el("div.ps-grid2", null, [pblock("Facets", id.facets, true), pblock("Core Sparks", id.coreSparks, true)]));
    body.push(el("div.ps-grid2", null, [pblock("Tethers", id.tethers, true), pblock("Fault Lines", id.faultLines, true)]));
    body.push(sect("Contacts & Crews"));
    body.push(pblock("", null, true));
    body.push(sect("Backstory & Notes"));
    body.push(pblock("", id.notes, true));
    // Cred / Heat standing tracks (table-tracked; write-in)
    body.push(sect("Standing", "Cred · Heat"));
    body.push(el("div.ps-surv-row", null, [el("span.ps-fl", { text: "CRED" }), pips(0, 10, "dot")]));
    body.push(el("div.ps-surv-row", null, [el("span.ps-fl.ps-emb", { text: "HEAT" }), pips(0, 10, "dot")]));
    return page("PROFILE", "04 · PROFILE", ch, body);
  }

  /* =======================================================================
     SECTION 05 - SYSTEMS (Flow / Cyberware / #GRID; only what the build uses)
     ======================================================================= */
  function chromeBlock(ch, d) {
    var installed = (eng.installedCyberware ? eng.installedCyberware(ch) : (ch.cyberware || []));
    var tax = d.chromeTax || { total: 0, index: 0, resDiePenalty: 0, fpPenalty: 0 };
    var zones = (EN.cyberware && EN.cyberware.zones) || {};
    var SIL_W = 825, SIL_H = 1970;
    var markers = installed.map(function (cw) {
      var z = zones[cw.zone] || zones.Hardware || { at: { x: SIL_W / 2, y: SIL_H / 2 } };
      var p = (z.sided && cw.side === "L") ? z.left : (z.sided && cw.side === "R") ? z.right : z.at;
      if (!p) p = z.at || { x: SIL_W / 2, y: SIL_H / 2 };
      return el("span.ps-sil-mark", { style: { left: (p.x / SIL_W * 100) + "%", top: (p.y / SIL_H * 100) + "%" } });
    });
    var OUTLINE = '<svg viewBox="0 0 825 1970" preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;width:100%;height:100%">' +
      '<g fill="none" stroke="#b6af9c" stroke-width="62" stroke-linecap="round">' +
      '<line x1="362" y1="330" x2="185" y2="720"/><line x1="463" y1="330" x2="645" y2="720"/>' +
      '<line x1="372" y1="640" x2="332" y2="1880"/><line x1="453" y1="640" x2="495" y2="1880"/></g>' +
      '<circle cx="412" cy="150" r="82" fill="#e3ddcc" stroke="#b6af9c" stroke-width="6"/>' +
      '<rect x="320" y="250" width="184" height="432" rx="46" fill="#e3ddcc" stroke="#b6af9c" stroke-width="6"/></svg>';
    var sil = el("div.ps-sil", { html: OUTLINE });
    markers.forEach(function (m) { sil.appendChild(m); });

    // group installed by Interface Zone
    var ZONES = ["Neural", "Core", "Integument", "Arms", "Legs", "Hardware"];
    var listRows = [];
    ZONES.forEach(function (z) {
      var inZone = installed.filter(function (cw) { return cw.zone === z; });
      if (!inZone.length) return;
      listRows.push(el("div.ps-snip-gh", { text: z.toUpperCase() + " · " + inZone.length }));
      inZone.forEach(function (cw) {
        listRows.push(el("div.ps-skrow", null, [
          el("span.ps-sk-n", { text: cw.name || cw.base || "Chrome" }),
          el("span.ps-sk-a", { text: (cw.tier || "") + (cw.side ? " " + cw.side : "") }),
          el("span.ps-sk-b2", { text: (cw.sp || 0) + " SP" })
        ]));
      });
    });
    if (!installed.length) listRows = [note("No chrome installed.")];

    var rightKids = [
      sect("Cybernetic Frame", "Static " + tax.total + " SP"),
      el("div.ps-statrow", null, [
        stat("STATIC", tax.total, "total SP"),
        stat("CHROME TAX", "T" + (tax.index || 0), tax.index ? "-" + tax.resDiePenalty + " RD / FP" : "safe"),
        stat("INSTALLED", installed.length, "pieces")
      ])
    ].concat(listRows);
    return el("div.ps-cols", null, [col([sect("Body Map"), sil], ".ps-col-sil"), col(rightKids)]);
  }
  function flowSystem(ch, d) {
    var f = d.flow; if (!f) return null;
    var out = [sect("Flow Reservoir", f.attributeName + " · Overdraw at 0 FP")];
    out.push(el("div.ps-statrow", null, [
      stat("FP MAX", f.max, "(Cal x3) + mod"),
      stat("FLOW DC", f.dc, "enemy saves"),
      stat("FLOW ATK", sgn(f.attack), "d20 + this"),
      stat("STRAIN", "0 to 6", "track in play")
    ]));
    out.push(el("div.ps-surv-row", { style: { marginTop: "4px" } }, [el("span.ps-fl", { text: "FP NOW" }), el("span.ps-box.ps-write") , el("span.ps-fl", { text: "STRAIN" }), pips(0, 6, "dot")]));
    out.push(sect("Known Resonances", "Kinetic · Thermal · EM · Visceral · Spatial · Cognitive · Temporal"));
    var res = el("div.ps-rep"); for (var i = 0; i < 5; i++) res.appendChild(writeLine("")); out.push(res);
    out.push(el("div.ps-grid2", null, [pblock("Counter Flow", null, false), pblock("Static Zones", null, false)]));
    out.push(note("Invocation = Resonance + Intent + Delivery + Force + Duration. Spend FP; Overdraw costs 1d4 Vitality per FP and risks Strain."));
    return el("div", null, out);
  }
  function gridSystem(ch, d) {
    var g = d.grid; if (!g) return null;
    if (g.userType !== "Power User" && !(ch.grid && ch.grid.deckType)) return null;
    var deck = g.deck;
    var out = [sect("#GRID Rig", g.userType)];
    out.push(el("div.ps-statrow", null, [
      stat("CIPHER ATK", sgn(g.effectiveAttack), "vs Security"),
      stat("SAVE DC", g.effectiveSaveDC, "node saves"),
      stat("LINKS", g.unlimitedLinks ? "no cap" : g.maxLinks, g.unlimitedLinks ? "SysAdmin" : "2 x Caliber"),
      stat("STABILITY", "DC " + g.stabilityDcBase, "or half dmg")
    ]));
    out.push(el("div.ps-row", null, [
      field("Smartdeck / Buddy", deck ? deck.tier + (deck.type === "buddy" ? " Buddy" : " Deck") : "-", { style: { flex: "2 1 0" } }),
      field("Device", deck ? sgn(deck.deviceBonus) : "-", { style: { flex: "0 0 54px" } }),
      field("Deck HP", deck ? deck.maxHp : "-", { style: { flex: "0 0 54px" } }),
      field("Bandwidth", g.bandwidthMax != null ? g.bandwidthMax : "-", { style: { flex: "0 0 70px" } })
    ]));
    if (deck && deck.traits && deck.traits.length) out.push(el("div.ps-chiprow", null, deck.traits.map(function (t) { return chip(t); })));
    if (ch.grid && (ch.grid.deckMods || []).length) {
      var mods = (EN.grid.mods || []).filter(function (m) { return ch.grid.deckMods.indexOf(m.key) !== -1; });
      out.push(el("div.ps-chiprow", null, mods.map(function (m) { return chip(m.name, ".ps-chip-box"); })));
    }
    out.push(sect("Repertoire", "cipher · CX · cost"));
    var rep = el("div.ps-rep"); for (var i = 0; i < 8; i++) rep.appendChild(writeLine("")); out.push(rep);
    return el("div", null, out);
  }
  function systems(ch, d) {
    var blocks = [];
    var flow = flowSystem(ch, d); if (flow) blocks.push(flow);
    var installed = (eng.installedCyberware ? eng.installedCyberware(ch) : (ch.cyberware || []));
    if (installed.length) { if (blocks.length) blocks.push(el("div.ps-rule.ps-faint")); blocks.push(chromeBlock(ch, d)); }
    var grid = gridSystem(ch, d); if (grid) { if (blocks.length) blocks.push(el("div.ps-rule.ps-faint")); blocks.push(grid); }
    if (!blocks.length) return null;   // build uses no systems - omit the page
    return page("SYSTEMS", "05 · SYSTEMS", ch, blocks);
  }

  /* ---- overlay control ---- */
  function close() { var o = document.getElementById("print-overlay"); if (o) o.parentNode.removeChild(o); document.removeEventListener("keydown", onKey); }
  function onKey(e) { if (e.key === "Escape") close(); }
  function open() {
    var ch = store.active();
    if (!ch) { EN.ui.toast("No #PRINT on file."); return; }
    close();
    var d = eng.derive(ch);
    var pages = [frontSheet(ch, d), talentsLineage(ch, d), gearHoldings(ch, d), profile(ch, d), systems(ch, d)].filter(Boolean);
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
