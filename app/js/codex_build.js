/* ===========================================================================
   ELYSIUM NIGHTS · Codex chapter: Skills & Advancement
   The rules a Freelancer is BUILT from, read from the data that already holds
   them, never retyped here. Four panels (the API is the header of
   app/js/codex.js):

     sk-skills     Skills & Proficiencies: EN.rules.skills with their
                   Attributes and example aspects, profTiers, the passive and
                   check formulas, Skill Focus, Specialization, overlapping
                   training, Versatile Skills (EN.versatile), Training Point
                   costs and gates (EN.rules.training) and gear proficiency
                   categories (EN.rules.gear).
     sk-advance    Advancement: the level table (xpThresholds, caliberByLevel,
                   trainingPointLevels), the milestone pace (read from the GM's
                   Payroll data through EN.rules.milestonePace, not retyped) and
                   EN.talentRules, which no screen rendered before.
     sk-resources  Class Resource Rules: EN.resourceRules in full, which also
                   rendered nowhere. The Basics primer (bx-res) keeps its short
                   table; this is the rule text behind it.
     sk-load       Encumbrance & Load: EN.rules.encumbrance, including the
                   Threshold formula that used to live only in a hover title.

   The long transcribed strings (EN.talentRules, EN.resourceRules) are book
   text with blank-line paragraphs, short heading lines and "A / B / C"
   tables. bookText() below reads that shape as it stands: a heading starts a
   new entry, a table becomes a rule table, everything else prints as
   written. Nothing is reworded on the way through.

   Pointer terms (EN.codexView.terms) for the rule names this chapter owns
   are registered at the foot of the file.
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;
  var CV = EN.codexView, el = EN.ui.el, slug = CV.slug;

  /* ---- book text ---------------------------------------------------------
     A heading is a paragraph of one short line with no closing punctuation
     ("Progression", "Core Concepts", "Lineage Evolution"). A table is a
     paragraph whose first line splits on " / " and whose every other line
     splits into as many cells on " / " or " = " ("Class Level / Caliber:",
     then "1 to 2 = 1"). */
  function isHeading(line) {
    line = String(line || "").trim();
    return !!line && line.indexOf("\n") === -1 && line.length <= 40 && !/[.:;,!?]$/.test(line) && !/^[•\-]/.test(line);
  }
  function cells(line) { return line.split(/ \/ | = /).map(function (c) { return c.trim(); }); }
  function tableOf(chunk) {
    var lines = chunk.split("\n");
    if (lines.length < 2 || lines[0].indexOf(" / ") === -1) return null;
    var head = cells(lines[0].replace(/:\s*$/, ""));
    var rows = lines.slice(1).map(cells);
    return rows.every(function (r) { return r.length === head.length; }) ? { head: head, rows: rows } : null;
  }
  function sections(text) {
    var out = [{ title: null, chunks: [] }];
    String(text || "").split(/\n\s*\n/).forEach(function (c) {
      c = c.trim();
      if (!c) return;
      if (isHeading(c)) out.push({ title: c, chunks: [] });
      else out[out.length - 1].chunks.push(c);
    });
    return out.filter(function (s) { return s.chunks.length; });
  }
  /* One paragraph as a node: a table, or a <p> whose first line is bold when it
     is a heading over its own body ("Leverage Pool" over "Maximum Leverage = ..."). */
  function chunkNode(K, chunk, lo) {
    var t = tableOf(chunk);
    if (t) return wide(K.refTable(t.head, t.rows, [0]), t.head.length);
    var lines = chunk.split("\n"), p = el("p");
    if (lines.length > 1 && isHeading(lines[0])) {
      p.appendChild(el("strong", { text: lines[0] }));
      p.appendChild(document.createTextNode("\n"));
      K.linkify(p, lines.slice(1).join("\n"), lo);
    } else K.linkify(p, chunk, lo);
    return p;
  }
  // a table of four or more columns scrolls inside itself on a phone rather than widening the page
  function wide(table, cols) { return cols >= 4 ? el("div", { style: { overflowX: "auto" } }, [table]) : table; }
  /* An entry made of several paragraphs and tables, styled like a ruleBlock. */
  function blockEntry(K, s, title, chunks, extra) {
    // one link per rule across the whole entry, as a ruleBlock does, not one per paragraph
    var lo = { used: {} };
    return K.entry(s, title, [
      el("h4", null, [document.createTextNode(title), extra ? el("span.src", { text: extra }) : null])
    ].concat(chunks.map(function (c) { return chunkNode(K, c, lo); })), { tag: "div.feature" });
  }
  /* "Requirements: You must ..." in an untitled run is a rule of its own; a long
     sentence that merely contains a colon ("Training Points give you breadth: ...")
     is not, so the name is held to three words. */
  var NAMED = /^([A-Z][A-Za-z]*(?: [A-Za-z]+){0,2}): (.+)$/;
  function bookText(K, text) {
    var out = [];
    sections(text).forEach(function (s) {
      if (!s.title) {
        var prose = [];
        var flush = function () { if (prose.length) { out.push(K.proseBlock(prose.join("\n"))); prose = []; } };
        s.chunks.forEach(function (c) {
          c.split("\n").forEach(function (line) {
            var m = NAMED.exec(line);
            if (m) { flush(); out.push(K.ruleBlock(m[1], m[2])); } else prose.push(line);
          });
          prose.push("");
        });
        flush();
        return;
      }
      if (s.chunks.some(tableOf)) out.push(blockEntry(K, null, s.title, s.chunks));
      else out.push(K.ruleBlock(s.title, s.chunks.join("\n\n")));
    });
    return out;
  }

  /* ---- shared readers ------------------------------------------------------ */
  function rules() { return EN.rules || {}; }
  function list(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  // "+5 Training Points at levels 3, 6 and 10", from EN.rules.trainingPointLevels
  function tpLevelsText() {
    var by = rules().trainingPointLevels || {};
    var lv = Object.keys(by).map(Number).sort(function (a, b) { return a - b; });
    if (!lv.length) return "";
    var same = lv.every(function (l) { return by[l] === by[lv[0]]; });
    return same ? "+" + by[lv[0]] + " Training Points at levels " + list(lv.map(String)) + "."
      : lv.map(function (l) { return "+" + by[l] + " Training Points at level " + l; }).join("; ") + ".";
  }
  function costLevel(c) { return c.level > 1 ? "Level " + c.level + "+" : "Any level"; }

  /* ---- Skills & Proficiencies ---------------------------------------------- */
  function skillsPanel(ctx, K) {
    var R = rules(), T = R.training || {}, F = R.formulas || {}, V = EN.versatile || {};
    var kids = [];
    kids.push(K.subTitle("Skills"));
    // grouped by parent Attribute, in the book's Attribute order; the Attribute rides on the heading
    (R.attributes || []).forEach(function (a) {
      (R.skills || []).filter(function (s) { return s.attr === a.key; }).forEach(function (s) {
        var ex = (R.focusExamples || {})[s.key];
        kids.push(K.ruleBlock(s.name, s.desc + (ex ? "\nExample aspects: " + ex : ""), a.name));
      });
    });

    kids.push(K.subTitle("Proficiency"));
    var tiers = (R.profOrder || []).map(function (k) { return (R.profTiers || {})[k]; }).filter(Boolean);
    if (tiers.length) {
      var snag = tiers.filter(function (t) { return t.snag; }).map(function (t) { return t.name; });
      kids.push(K.entry("proficiency-tiers", "Proficiency Tiers", [
        el("h4", { text: "Proficiency Tiers" }),
        K.refTable(["Tier", "d20 Bonus", "Dice Pool"], tiers.map(function (t) {
          return [t.name, "+" + (t.d20 || 0), t.pool ? "+" + t.pool + " Edge Dice" : "None"];
        }), [0]),
        snag.length ? K.note(list(snag) + ": rolls with Snag.", { margin: "0" }) : null
      ], { tag: "div.feature" }));
    }
    if (F.passive || F.check) {
      kids.push(K.ruleBlock("Passive Checks", [
        F.passive ? "Passive: " + F.passive : null,
        F.check ? "Skill check: " + F.check : null,
        "See also Collaborative & Opposed Checks."
      ].filter(Boolean).join("\n")));
    }
    if (T.focus) kids.push(K.ruleBlock("Skill Focus", T.focus));
    if (T.specialization) kids.push(K.ruleBlock("Specialization", T.specialization));
    if (T.overlap) kids.push(K.ruleBlock("Overlapping Training", T.overlap.when + " " + T.overlap.rule));
    if ((R.versatileSkills || []).length) {
      kids.push(K.ruleBlock("Versatile Skills", [V.rule, V.note].filter(Boolean).join("\n")
        + "\n" + R.versatileSkills.map(function (v) { return "- " + v.name + ": " + v.desc; }).join("\n")));
    }

    kids.push(K.subTitle("Training Points"));
    if ((T.costs || []).length) {
      kids.push(K.entry("training-points", "Training Points", [
        el("h4", { text: "Training Points" }),
        K.linkify(el("p"), tpLevelsText(), { self: "sk-skills/training-points" }),
        wide(K.refTable(["Purchase", "Cost", "Gate", "What it buys"], T.costs.map(function (c) {
          return [c.name, c.tp + " TP", costLevel(c), c.what];
        }), [0]), 4),
        T.grants ? K.linkify(el("p"), T.grants, { self: "sk-skills/training-points" }) : null
      ], { tag: "div.feature" }));
    }
    if (R.gear) {
      var BUCKET = { weapons: "Weapons", armor: "Armor", tools: "Tools", vehicles: "Vehicles" };
      /* an entry rather than a ruleBlock so the Vehicles rules panel can be held back: "Vehicles"
         here is a proficiency bucket, and the panel title would otherwise claim it */
      var gp = el("p");
      K.linkify(gp, (T.gearRule ? T.gearRule + "\n\n" : "")
        + Object.keys(BUCKET).filter(function (b) { return (R.gear[b] || []).length; }).map(function (b) {
          return BUCKET[b] + ": " + R.gear[b].join(", ") + ((R.gearUpgradable || {})[b] === false && T.armorNote ? " (" + T.armorNote + ")" : "");
        }).join("\n"), { self: ["sk-skills/gear-proficiencies", "ref-vehicles"] });
      kids.push(K.entry("gear-proficiencies", "Gear Proficiencies", [el("h4", { text: "Gear Proficiencies" }), gp], { tag: "div.feature" }));
    }
    return kids;
  }

  /* ---- Advancement ---------------------------------------------------------- */
  function advancePanel(ctx, K) {
    var R = rules(), kids = [];
    var xp = R.xpThresholds || {}, cal = R.caliberByLevel || {}, tp = R.trainingPointLevels || {};
    var max = R.maxLevel || 10, rows = [];
    for (var L = 1; L <= max; L++) rows.push([String(L), xp[L] != null ? String(xp[L]) : "", cal[L] != null ? String(cal[L]) : "", tp[L] ? "+" + tp[L] : ""]);
    kids.push(K.entry("levels-and-xp", "Levels and XP", [
      el("h4", null, [document.createTextNode("Levels and XP"), el("span.src", { text: "MAX LEVEL " + max })]),
      wide(K.refTable(["Level", "XP", "Caliber", "Training Points"], rows, [0]), 4)
    ], { tag: "div.feature" }));
    var pace = R.milestonePace ? R.milestonePace() : null;
    if (pace) kids.push(K.ruleBlock("Milestones", "A Freelancer levels up after " + pace + "." + ((R.advancement || {}).when ? " " + R.advancement.when : "")));
    var TR = EN.talentRules || {};
    [TR.progression, TR.requirementsRetraining, TR.categoriesIntro].forEach(function (t) {
      if (t) kids.push(bookText(K, t));
    });
    return kids;
  }

  /* ---- Class Resource Rules --------------------------------------------------- */
  var POOL_RULES = [
    ["maximumPool", "Maximum Pool"], ["minimumPool", "Minimum Pool"], ["spending", "Spending"],
    ["variableCosts", "Variable Costs"], ["refreshing", "Refreshing"], ["temporary", "Temporary Points"],
    ["multiplePools", "Multiple Pools"]
  ];
  function resourcesPanel(ctx, K) {
    var RR = EN.resourceRules || {}, kids = [];
    if (RR.general) kids.push(bookText(K, RR.general));
    POOL_RULES.forEach(function (r) { if (RR[r[0]]) kids.push(K.ruleBlock(r[1], RR[r[0]])); });
    var by = RR.byClass || {};
    if (Object.keys(by).length) {
      kids.push(K.subTitle("By Class"));
      /* "Hustler: Leverage" leads each one; its slug is the resource's own key
         ("sk-resources/leverage"), the name a class card links with */
      Object.keys(by).forEach(function (k) {
        var chunks = String(by[k]).split(/\n\s*\n/).map(function (c) { return c.trim(); }).filter(Boolean);
        var title = chunks.shift() || k;
        kids.push(blockEntry(K, k, title, chunks));
      });
    }
    if (RR.budgetByLevel) {
      kids.push(K.subTitle("Summary and Budget"));
      kids.push(bookText(K, RR.budgetByLevel));
    }
    return kids;
  }

  /* ---- Encumbrance & Load ------------------------------------------------------- */
  function loadPanel(ctx, K) {
    var E = rules().encumbrance || {}, kids = [];
    if (E.threshold) kids.push(K.ruleBlock("Encumbrance Threshold", E.threshold));
    if ((E.loadouts || []).length) {
      kids.push(K.entry("loadouts", "Loadouts", [
        el("h4", { text: "Loadouts" }),
        E.budget ? K.linkify(el("p"), E.budget, { self: "sk-load/loadouts" }) : null,
        K.refTable(["Loadout", "Load Budget", "Effect"], E.loadouts.map(function (l) {
          return [l.name, "Threshold" + (l.delta ? (l.delta > 0 ? " + " : " - ") + Math.abs(l.delta) : ""), l.effect];
        }), [0])
      ], { tag: "div.feature" }));
    }
    var S = E.states || {};
    ["unencumbered", "encumbered", "overloaded"].forEach(function (k) {
      var st = S[k];
      if (st) kids.push(K.ruleBlock(st.name, (st.when ? "When: " + st.when + "\n" : "") + "Effect: " + st.effect));
    });
    if ((E.hauls || []).length) {
      kids.push(K.entry("hauls", "Hauls", [
        el("h4", { text: "Hauls" }),
        K.refTable(["Haul", "Effect"], E.hauls.map(function (h) { return [h.name, h.hint]; }), [0])
      ], { tag: "div.feature" }));
    }
    if ((E.loadTable || []).length) {
      kids.push(K.entry("load-table", "Load Table", [
        el("h4", { text: "Load Table" }),
        K.refTable(["Load", "Typical Items"], E.loadTable.map(function (r) { return [r.load, r.items]; }), [0]),
        E.notes ? K.linkify(el("p"), E.notes) : null
      ], { tag: "div.feature" }));
    }
    return kids;
  }

  EN.codexView.register({ id: "build", title: "Skills & Advancement", order: 30, audience: "both", panels: [
    { id: "sk-skills", title: "Skills & Proficiencies", order: 10,
      tag: function () { return (rules().skills || []).length + " SKILLS · " + (rules().profOrder || []).length + " TIERS"; },
      when: function () { return !!(EN.rules && EN.rules.skills && EN.rules.profTiers); }, build: skillsPanel },
    { id: "sk-advance", title: "Advancement", tag: function () { return "LEVELS 1 TO " + (rules().maxLevel || 10); }, order: 20,
      when: function () { return !!(EN.rules && EN.rules.xpThresholds); }, build: advancePanel },
    { id: "sk-resources", title: "Class Resource Rules", tag: "POOLS · REFRESH · BUDGET", order: 30,
      when: function () { return !!EN.resourceRules; }, build: resourcesPanel },
    { id: "sk-load", title: "Encumbrance & Load", tag: "THRESHOLD · LOADOUT · HAULS", order: 40,
      when: function () { return !!(EN.rules && EN.rules.encumbrance); }, build: loadPanel }
  ] });

  /* ---- pointer terms ------------------------------------------------------------
     The panel titles already link "Skills and Proficiencies" (the Passive Checks
     pointer in Core Resolution) and "Encumbrance and Load" (the Mule). These are
     the rule names the book and the app use for entries inside them. Each is a
     phrase or a proper rule word, so it matches only where that rule is meant. */
  CV.terms({
    "Universal Upgrade": "sk-advance/progression",
    "Universal Upgrades": "sk-advance/progression",
    "Talent Upgrade": "sk-advance/talent-upgrades",
    "Talent Upgrades": "sk-advance/talent-upgrades",
    "Lineage Evolution": "sk-advance/lineage-evolution",
    // the whole Lineage Evolution entry, where the Awakening is one of its two lines
    "Awakening Milestone": "sk-advance/lineage-evolution",
    "Training Point": "sk-skills/training-points",
    "Training Points": "sk-skills/training-points",
    "Skill Focus": "sk-skills/skill-focus",
    "Free Skill Focus": "sk-skills/overlapping-training",
    "Specialization": "sk-skills/specialization",
    "Versatile Skill": "sk-skills/versatile-skills",
    "Versatile Skills": "sk-skills/versatile-skills",
    "Proficiency Bonus": "sk-skills/proficiency-tiers",
    "Encumbrance Threshold": "sk-load/encumbrance-threshold",
    "Load Budget": "sk-load/loadouts",
    "Encumbered": "sk-load/encumbered",
    "Overloaded": "sk-load/overloaded"
  });
})();
