/* ===========================================================================
   ELYSIUM NIGHTS · Codex chapter: Social Pressure & Faction Standing
   The rulebook chapter of that name in full, for both desktops, rendered from
   EN.social (app/data/social.js), a transcription of Part 2.
     social: "Social Pressure & Faction Standing", order 66, audience "both",
     panel ids "so-"
   Before this chapter the only home of these rules was the Social tab's Quick
   Reference (js/face.js), which carried the Approaches, a short Outcomes table and
   the Resolve tiers, and said the rest was a later pass. The GM's Scenes and People
   data said the full Postures list, the Floor and the Social Fallout table were not
   in the app. They are here now.
   Nothing is written here that the data does not say: every rule line is a field
   of EN.social, and the only words of this file's own are headings, the labels of
   a few entries, and the small pointers between panels.
   Core Resolution keeps the Social Cost Options, the Social Fallout Rule and the
   cost tracks (rz-social); this chapter links there and does not repeat them.
   The API is documented in the header of app/js/codex.js.
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;
  var CV = EN.codexView;

  function S() { return EN.social || null; }
  function has(field) { return function () { var s = S(); return !!(s && s[field]); }; }
  function sd(field) { return function () { var s = S(); return !!(s && s.sitDown && s.sitDown[field]); }; }
  /* Inside this chapter "Social Fallout" means the chapter's own ten-row table. The
     global alias in codex.js points there too since wave 2 (Core Resolution's usage rule
     answers to "Social Fallout Rule"); these per-call terms stay so the chapter reads the
     same even without that alias, and carry the chapter's other local names. */
  var LOCAL = { "Social Fallout table": "so-fallout", "Social Fallout menu": "so-fallout", "Social Fallout": "so-fallout",
                "Economy chapter": "ref-economy" };
  function lo(more) {
    var t = {};
    Object.keys(LOCAL).forEach(function (k) { t[k] = LOCAL[k]; });
    if (more) Object.keys(more).forEach(function (k) { t[k] = more[k]; });
    return { terms: t };
  }
  // "**Name** text", a bold run-in paragraph as the book prints it
  function runIn(r) { return "**" + r.name + "** " + r.text; }
  // "- Name: text" named lines, so each is an anchor of its own
  function named(list) { return list.map(function (r) { return "- " + r.name + ": " + r.text; }).join("\n"); }
  // the Admin desktop's GM chapters, linked only where they resolve
  function gmSee(ctx, K, label, pairs) {
    if (ctx.portal !== "admin") return null;
    var ok = pairs.filter(function (p) { return CV.has(p[0]); });
    return ok.length ? K.seeAlso(label, ok) : null;
  }

  EN.codexView.register({ id: "social", title: "Social Pressure & Faction Standing", order: 66, audience: "both", panels: [

    /* ---- 1 · the words and the three depths ------------------------------------- */
    { id: "so-core", title: "Social Terms & Depths", tag: "FRICTION · SIT-DOWN · CRED AND HEAT", order: 10, when: has("coreConcepts"), build: function (ctx, K) {
      var s = S(), e = s.engages;
      return [
        K.proseBlock(s.intro, lo()),
        K.entry("core-concepts", "Core Concepts", [
          K.subTitle("Core Concepts"),
          K.refTable(["Term", "Summary"], s.coreConcepts.map(function (c) { return [c.term, c.text]; }), [0], lo())
        ]),
        K.subTitle("Three Depths"),
        K.proseBlock(s.depthsLead, lo()),
        K.el("div", null, s.depths.map(function (d) { return K.ruleBlock(d.name, runIn(d), null, lo()); })),
        K.ruleBlock(e.name, K.bullets(e.items) + "\n\n" + e.after, null, lo()),
        K.proseBlock(e.fit, lo())
      ];
    } },

    /* ---- 2 · the eight steps, the chapter's own summary -------------------------- */
    { id: "so-summary", title: "Social Play Summary", tag: "EIGHT STEPS", order: 15, when: has("summary"), build: function (ctx, K) {
      var g = S().summary;
      return [
        K.entry("gameplay-summary", g.title, [
          K.refTable(g.columns, g.steps.map(function (r) { return [r.n + ". " + r.name, r.text]; }), [0], lo())
        ])
      ];
    } },

    /* ---- 3 · Friction: the pool, the Approach, stakes and sway ------------------ */
    { id: "so-friction", title: "Friction & Approaches", tag: "POOL · APPROACH · STAKES · SWAY", order: 20, when: has("approach"), build: function (ctx, K) {
      var s = S(), f = s.friction, a = s.approach;
      return [
        K.ruleBlock("Friction", f.text, "ALWAYS ON", lo()),
        K.ruleBlock("Building the Pool", f.pool + "\n\n" + f.d20, null, lo()),
        K.entry("approach", "Approach", [
          K.subTitle("Approach"),
          K.proseBlock(a.text, lo()),
          K.refTable(a.columns, a.rows.map(function (r) { return [r.name, r.skill, r.attributes, r.text]; }), [0], lo()),
          K.proseBlock(a.powerhouses + "\n" + a.examples + "\n" + a.versatile, lo())
        ]),
        K.ruleBlock(a.insight.name, a.insight.text, null, lo()),
        K.ruleBlock("Stakes", s.stakes.text + "\n\n" + s.stakes.common + "\n\n" + s.stakes.example, null, lo()),
        K.ruleBlock("Sway", s.sway.text + "\n\n" + s.sway.sources + "\n\n" + s.sway.rule, null, lo()),
        K.seeAlso("The skills behind each Approach:", [["sk-skills/persuasion", "Persuasion"], ["sk-skills/intimidation", "Intimidation"],
          ["sk-skills/performance", "Performance"], ["sk-skills/deception", "Deception"], ["sk-skills/insight", "Insight"], ["sk-skills/versatile-skills", "Versatile Skills"]]),
        K.seeAlso("Rolling it:", [["rz-pool", "Dice Pools"], ["rz-d20", "d20 Checks"], ["rz-edge", "Edge & Snag"]])
      ];
    } },

    /* ---- 4 · Margins and Outcomes ---------------------------------------------------- */
    { id: "so-outcomes", title: "Social Margins & Outcomes", tag: "TOTAL WIN TO HARD BURN", order: 30, when: has("margins"), build: function (ctx, K) {
      var m = S().margins;
      return [
        K.entry("margins-and-outcomes", "Margins and Outcomes", [
          K.refTable(m.columns, m.rows.map(function (r) { return [r.margin, r.result, r.text]; }), [0, 1], lo())
        ]),
        K.seeAlso("Reading the margin:", [["rz-margin", "Success Margin & Consequence"]]),
        K.seeAlso("Paying for it:", [["so-fallout", "Social Fallout Table"], ["so-standing", "Faction Standing & Pressure States"], ["so-profiles", "Profiles & Debt"]])
      ];
    } },

    /* ---- 5 · Profiles and Debt ---------------------------------------------------------- */
    { id: "so-profiles", title: "Profiles & Debt", tag: "HOW EACH ROOM READS YOU", order: 40, when: has("profiles"), build: function (ctx, K) {
      var s = S(), p = s.profiles;
      return [
        K.ruleBlock("Profiles", p.paragraphs.join("\n\n"), null, lo()),
        K.ruleBlock("Profile Examples", p.examples.map(function (x) { return "*" + x + "*"; }).join(" · "), null, lo()),
        K.ruleBlock("How Long a Profile Lasts", p.lasts, null, lo()),
        K.ruleBlock("Debt", s.debt.paragraphs.join("\n\n"), null, lo()),
        K.seeAlso("Debt across a campaign:", [["ref-economy", "Economy & Rewards"]]),
        gmSee(ctx, K, "For the GM:", [["gmp-profiles", "Their Profile of You"]])
      ];
    } },

    /* ---- 6 · Faction Standing and the Pressure States ------------------------------------ */
    { id: "so-standing", title: "Faction Standing & Pressure States", tag: "ALLIED TO HOSTILE · OPEN TO LOCKED", order: 50, when: has("factionStanding"), build: function (ctx, K) {
      var s = S(), f = s.factionStanding, ps = s.pressureStates;
      return [
        K.entry("faction-standing", "Faction Standing", [
          K.subTitle("Faction Standing"),
          K.proseBlock(f.intro, lo()),
          K.refTable(f.columns, f.ladder.map(function (r) { return [r.name, r.text]; }), [0], lo()),
          K.proseBlock(f.start + "\n" + f.shifts, lo())
        ]),
        K.entry("social-pressure-states", "Social Pressure States", [
          K.subTitle("Social Pressure States"),
          K.proseBlock(ps.intro, lo()),
          K.refTable(ps.columns, ps.states.map(function (r) { return [r.name, r.text]; }), [0], lo()),
          K.proseBlock(ps.shifts, lo())
        ])
      ];
    } },

    /* ---- 7 · the Social Fallout table ------------------------------------------------------ */
    { id: "so-fallout", title: "Social Fallout Table", tag: function () { var s = S(); return ((s && s.fallout && s.fallout.rows) || []).length + " CONSEQUENCES"; }, order: 60, when: has("fallout"), build: function (ctx, K) {
      var fo = S().fallout;
      return [
        K.proseBlock(fo.intro, lo()),
        K.entry("social-fallout", "Social Fallout", [
          K.refTable(fo.columns, fo.rows.map(function (r) { return [r.name, r.text]; }), [0], lo())
        ]),
        K.note(fo.outro, lo()),
        K.seeAlso("Core Resolution's version, and when to use it over Fatigue:", [["rz-social", "Social Consequences & Cost Tracks"], ["rz-social/social-fallout-rule", "Social Fallout Rule"]])
      ];
    } },

    /* ---- 8 · the Sit-Down: the frame, Resolve, Pressure, breaking ---------------------------- */
    { id: "so-sitdown", title: "The Sit-Down", tag: "OPTIONAL · RESOLVE · PRESSURE", order: 70, when: has("sitDown"), build: function (ctx, K) {
      var d = S().sitDown, r = d.resolve, p = d.pressure, v = d.vulnerabilities;
      return [
        K.proseBlock(d.intro.join("\n"), lo()),
        // the five parts are named lines, so "so-sitdown/the-floor" and the rest are anchors
        K.ruleBlock("The Frame", d.frameLead + "\n" + named(d.frame), null, lo()),
        K.entry("setting-resolve", "Setting Resolve", [
          K.subTitle("Setting Resolve"),
          K.proseBlock(r.intro, lo()),
          K.refTable(r.columns, r.tiers.map(function (t) { return [t.name, t.text, t.examples]; }), [0, 1], lo()),
          K.proseBlock(r.reset, lo())
        ]),
        K.entry("pressure", "Pressure", [
          K.subTitle("Pressure"),
          K.proseBlock(p.intro, lo()),
          K.refTable(p.columns, p.results.map(function (x) { return [x.result + " (" + x.margin + ")", x.text]; }), [0], lo())
        ]),
        K.ruleBlock(v.name, v.text + "\n" + K.bullets(v.examples) + "\n\n" + v.signal, null, lo()),
        K.ruleBlock("When Resolve Breaks", d.breaks.join("\n\n"), null, lo()),
        K.seeAlso("Running the table:", [["so-plays", "Rounds & Plays"], ["so-postures", "Postures"], ["so-floor", "The Floor"], ["so-conditions", "Sit-Down Conditions"]]),
        gmSee(ctx, K, "For the GM:", [["gms-sitdown", "Sit-Down Rules"], ["gmp-resolve", "Resolve by Role"]])
      ];
    } },

    /* ---- 9 · Rounds and Plays ------------------------------------------------------------------ */
    { id: "so-plays", title: "Rounds & Plays", tag: "PRESS · SUPPORT · READ · DISRUPT · HOLD", order: 80, when: sd("plays"), build: function (ctx, K) {
      var d = S().sitDown;
      return [
        K.ruleBlock("Rounds", d.rounds + "\n\n" + d.playsLead, null, lo()),
        K.el("div", null, d.plays.map(function (pl) {
          return K.ruleBlock(pl.name, pl.text + (pl.key === "hold" && d.holdNote ? "\n\n" + d.holdNote : ""), null, lo());
        })),
        K.seeAlso("What the Opposition answers with:", [["so-postures", "Postures"]])
      ];
    } },

    /* ---- 10 · Postures --------------------------------------------------------------------------- */
    { id: "so-postures", title: "Postures", tag: "ONE IMPULSE ACTION A ROUND", order: 90, when: sd("postures"), build: function (ctx, K) {
      var po = S().sitDown.postures;
      return [
        K.proseBlock(po.intro, lo()),
        K.entry("posture-table", "Postures", [
          K.refTable(po.columns, po.rows.map(function (r) { return [r.name, r.looks, r.text]; }), [0], lo())
        ]),
        K.note(po.recharge, lo()),
        K.seeAlso("Cornered, and the rest:", [["so-conditions", "Sit-Down Conditions"]])
      ];
    } },

    /* ---- 11 · the Floor ---------------------------------------------------------------------------- */
    { id: "so-floor", title: "The Floor", tag: "ENVIRONMENTAL PRESSURE", order: 100, when: sd("floor"), build: function (ctx, K) {
      var fl = S().sitDown.floor;
      return [
        K.proseBlock(fl.intro, lo()),
        K.el("div", null, fl.pressures.map(function (x) { return K.ruleBlock(x.name, x.text, null, lo()); })),
        K.ruleBlock("Changing the Floor", fl.legwork, null, lo())
      ];
    } },

    /* ---- 12 · Sit-Down Conditions -------------------------------------------------------------------
       Scene conditions, separate from the Conditions Library: they end with the scene. */
    { id: "so-conditions", title: "Sit-Down Conditions", tag: "FOR THE SCENE ONLY", order: 110, when: sd("conditions"), build: function (ctx, K) {
      var c = S().sitDown.conditions;
      return [
        K.proseBlock(c.intro, lo()),
        K.el("div", null, c.rows.map(function (x) { return K.ruleBlock(x.name, x.text, null, lo()); })),
        K.ruleBlock("Doubted, Marked, Discredited", c.crew, "CREW", lo())
      ];
    } },

    /* ---- 13 · Cred and Heat ---------------------------------------------------------------------------- */
    { id: "so-credheat", title: "Cred & Heat", tag: "OPTIONAL · 0 TO 10 · CRED PER SCENE, HEAT PER SOURCE", order: 120, when: has("credHeat"), build: function (ctx, K) {
      var ch = S().credHeat, c = ch.cred, h = ch.heat;
      // "Cred" on its own is this panel's own word, so it points at the panel and prints plain
      var L = lo({ "Cred": "so-credheat" });
      return [
        K.proseBlock(ch.intro, L),
        K.ruleBlock("What Cred Is", c.paragraphs.join("\n\n") + "\n\n" + c.range, null, L),
        K.entry("cred-ladder", "Cred Ladder", [
          K.refTable(c.columns, c.ladder.map(function (r) { return [r.range, r.text]; }), [0], L)
        ]),
        K.ruleBlock("What Heat Is", h.paragraphs.join("\n\n"), null, L),
        K.entry("heat-ladder", "Heat Ladder", [
          K.refTable(h.columns, h.ladder.map(function (r) { return [r.range, r.text]; }), [0], L)
        ]),
        // each shift and each effect is a named line ("so-credheat/heat-decreases")
        K.ruleBlock("How They Shift", ch.shiftIntro + "\n" + named(ch.shifts), null, L),
        K.ruleBlock("Mechanical Effects", ch.effectsIntro + "\n" + named(ch.effects), null, L),
        K.ruleBlock("Using Cred and Heat Together", ch.together.join("\n\n"), null, L),
        gmSee(ctx, K, "For the GM, what high Heat sends:", [["gmx-check", "Heat Response"]])
      ];
    } },

    /* ---- 14 · Examples in Play and the Deposition --------------------------------------------------- */
    { id: "so-examples", title: "Social Scenes in Play", tag: "FIVE EXAMPLES · THE DEPOSITION", order: 130, when: has("examples"), build: function (ctx, K) {
      var s = S(), dp = s.deposition;
      return [
        K.entry("examples-in-play", "Examples in Play", [
          K.subTitle("Examples in Play"),
          K.proseBlock(s.examples.map(function (x) { return "- " + x; }).join("\n"), lo())
        ]),
        dp ? K.ruleBlock("The Deposition", dp.setup + "\n" + named(dp.rounds), "SIT-DOWN EXAMPLE", lo()) : null
      ];
    } },

    /* ---- 15 · the chapter's own GM Guidance ------------------------------------------------------------ */
    { id: "so-guidance", title: "Running Social Scenes", tag: "GM GUIDANCE", order: 140, when: has("gmGuidance"), build: function (ctx, K) {
      return S().gmGuidance.map(function (g) { return K.ruleBlock(g.name.replace(/\.$/, ""), g.text, null, lo()); });
    } }
  ] });

  /* Pointer terms: the names the book, the gear text and the GM data use for these
     rules. The panel titles link on their own ("The Sit-Down", "Postures", "Cred & Heat"
     and its "and" spelling, "Sit-Down Conditions", "The Floor"); these are the other
     spellings. Heat alone is not one: it is the GM's chapter title too, and ordinary
     English. "Social Fallout" itself is registered in codex.js, pointing at so-fallout. */
  CV.terms({
    "Sit-Down": "so-sitdown",
    "Sit-Downs": "so-sitdown",
    "Opposition Tiers": "so-sitdown/setting-resolve",
    "Opposition Tier": "so-sitdown/setting-resolve",
    "Setting Resolve": "so-sitdown/setting-resolve",
    "Vulnerabilities and Resistances": "so-sitdown/vulnerabilities-and-resistances",
    "When Resolve Breaks": "so-sitdown/when-resolve-breaks",
    "Environmental Pressure": "so-floor",
    "Environmental Pressures": "so-floor",
    "Social Fallout table": "so-fallout",
    "Social Fallout menu": "so-fallout",
    "Faction Standing": "so-standing/faction-standing",
    "Social Pressure States": "so-standing/social-pressure-states",
    "Pressure State": "so-standing/social-pressure-states",
    "Social Help Action": "so-friction/insight-as-the-social-help-action",
    "Cred": "so-credheat/what-cred-is"
  });
})();
