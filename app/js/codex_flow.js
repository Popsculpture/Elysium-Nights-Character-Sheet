/* ===========================================================================
   ELYSIUM NIGHTS · Codex chapter: The Flow
   The Flow rules in full, for both desktops, rendered from EN.flow (app/data/flow.js),
   which is also what the Flow tab's tools read. Before this chapter the only home of
   these rules was the Flow tab's reference panel, which draws for an attuned Shaper
   alone, so a GM or an Unattuned player could never read Strain, Overdraw, Breakflow
   or Ritual Recovery. The tab now keeps its working tools and links here.
     flow: "The Flow", order 70, audience "both", panel ids "fl-"
   The Basics keeps its primer (bx-flow); this chapter is the full text. Nothing is
   written here that the data does not say: every rule line is a field of EN.flow
   (or EN.basics.flow.check, the one Flow Attribute Check text), and the only words of
   this file's own are headings and the small pointers between panels.
   The API is documented in the header of app/js/codex.js.
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;
  var CV = EN.codexView;

  function F() { return EN.flow || null; }
  function has(field) { return function () { var f = F(); return !!(f && f[field]); }; }
  function byKey(list, key) { return (list || []).filter(function (x) { return x.key === key; })[0] || null; }
  // the subclass a Unique Resonance belongs to, by its own name ("The Sourcerer")
  function subclassName(key) {
    var cls = (EN.classes || {}).shaper || {}, sc = (cls.subclasses || []).filter(function (s) { return s.key === key; })[0];
    return (sc && sc.name) || key;
  }
  EN.codexView.register({ id: "flow", title: "The Flow", order: 70, audience: "both", panels: [

    /* ---- 1 · the words and the three numbers -------------------------------- */
    { id: "fl-core", title: "Core Concepts & Formulas", tag: "RESERVOIR · ATTACK · SAVE DC", order: 10, when: has("coreConcepts"), build: function (ctx, K) {
      var f = F(), B = (EN.basics || {}).flow;
      var extra = { "Reservoir": f.reservoirFormula };
      return [
        K.subTitle("Core Concepts"),
        K.el("div", null, f.coreConcepts.map(function (c) { return K.ruleBlock(c.term, c.text, extra[c.term] || null); })),
        K.subTitle("Rolling with the Current"),
        K.ruleBlock("Flow Attack", f.checkNote, f.flowAttackFormula),
        K.ruleBlock("Flow Save DC", f.saveNotation, f.saveDcFormula),
        // the one Flow Attribute Check text, the Basics primer's own
        B && B.check ? K.ruleBlock("Flow Attribute Check", B.check, f.flowAttackFormula) : null
      ];
    } },

    /* ---- 2 · the Order of Shaping ------------------------------------------- */
    { id: "fl-shaping", title: "The Order of Shaping", tag: "INTENT · DELIVERY · FORCE · DURATION", order: 20, when: has("intent"), build: function (ctx, K) {
      var f = F();
      function fp(n) { return n ? "+" + n : "0"; }
      return [
        K.entry("intent", "Intent", [
          K.subTitle("1 · Intent"),
          K.refTable(["Intent", "FP", "Effect"], f.intent.map(function (i) { return [i.name, fp(i.fp), i.desc]; }), [0])
        ]),
        K.entry("delivery", "Delivery", [
          K.subTitle("2 · Delivery"),
          K.refTable(["Band", "FP", "Options", "Scaling", "Effect"], f.delivery.map(function (b) {
            return [b.band, fp(b.fp), b.options.join(", "), b.scaling, b.desc];
          }), [0])
        ]),
        K.entry("force", "Force", [
          K.subTitle("3 · Force"),
          K.refTable(["Force", "FP", "Effect"], f.force.map(function (o) { return [o.name, fp(o.fp), o.desc]; }), [0])
        ]),
        K.entry("duration", "Duration", [
          K.subTitle("4 · Duration"),
          K.refTable(["Duration", "Effect"], f.duration.map(function (d) { return [d.name, d.desc]; }), [0])
        ]),
        f.precisionShaping ? K.ruleBlock("Precision Shaping", f.precisionShaping.desc, "+" + f.precisionShaping.fp + " FP") : null,
        f.layeredForce ? K.ruleBlock("Layered Force", f.layeredForce, "LEVEL 5") : null,
        K.seeAlso("Each Resonance's Empowered Effects:", [["fl-resonances", "Resonances"]]),
        K.seeAlso("Holding an effect past this turn:", [["fl-sustain", "Sustained Effects"]])
      ];
    } },

    /* ---- 3 · the Resonances ---------------------------------------------------
       All of them, the Unique one included and marked as its subclass's: the Flow tab's
       builder lists only the Resonances a character could hold, but a rulebook (and a GM
       facing a Sourcerer) reads the whole list. Each Empowered Effect is a named line, so it
       is an anchor of its own ("fl-resonances/gravity-pin"). */
    { id: "fl-resonances", title: "Resonances", tag: function () { var f = F(); return ((f && f.resonances) || []).length + " RESONANCES"; }, order: 30, when: has("resonances"), build: function (ctx, K) {
      var f = F();
      var out = [];
      if (f.saveNotation) out.push(K.note(f.saveNotation));
      if (f.resonanceUnlockNote) out.push(K.ruleBlock("Resonance Unlocks", f.resonanceUnlockNote));
      f.resonances.forEach(function (r) {
        var how = r.resolution === "save"
          ? "Flow Save DC" + (r.saveAttr && r.saveAttr !== "varies" ? " (" + r.saveAttr + ")" : "")
          : "Flow Attack vs Defense";
        var lines = ["Focus: " + r.focus + ". Resolves with a " + how + "."];
        [r.armorNote, r.targeting, r.stabilityNote, r.special].forEach(function (t) { if (t) lines.push(t); });
        lines.push("Base: " + r.base);
        if ((r.empowered || []).length) {
          lines.push("Empowered Effects:");
          r.empowered.forEach(function (e) { lines.push("- " + e.name + ": " + (e.sustain ? "Sustainable. " : "") + e.text); });
        }
        var extra = "L" + r.unlock + (r.unique ? " · UNIQUE: " + subclassName(r.unique).toUpperCase() : "") + " · " + r.damage;
        out.push(K.ruleBlock(r.name, lines.join("\n"), extra, { conditions: true }));
      });
      return out;
    } },

    /* ---- 4 · Sustain ---------------------------------------------------------- */
    { id: "fl-sustain", title: "Sustained Effects", tag: "UPKEEP · CAPACITY · COMPATIBILITY", order: 40, when: has("sustainCompat"), build: function (ctx, K) {
      var f = F(), sus = byKey(f.duration, "sustain"), fd = f.focusDisruption;
      return [
        sus ? K.ruleBlock("Sustain", sus.desc, "1 FP / TURN") : null,
        f.sustainCapacity ? K.ruleBlock("Sustain Capacity", f.sustainCapacity, null, { conditions: true }) : null,
        fd ? K.ruleBlock("Focus Disruption", fd.text, fd.save) : null,
        K.entry("sustain-compatibility", "Sustain Compatibility", [
          K.subTitle("Sustain Compatibility"),
          K.refTable(["Resonance", "Empowered Effect", "Sustain", "Notes"], f.sustainCompat.map(function (s) {
            return [s.resonance, s.effect, s.allowed ? "Yes" : "No", s.notes];
          }), [1, 2])
        ])
      ];
    } },

    /* ---- 5 · the Strain track ------------------------------------------------- */
    { id: "fl-strain", title: "The Strain Track", tag: "FIVE STAGES", order: 50, when: has("strainTrack"), build: function (ctx, K) {
      var f = F();
      return [
        K.entry("strain-stages", "Strain Stages", [
          K.refTable(["Stage", "Name", "Consequence"], f.strainTrack.map(function (s) { return [String(s.stage), s.name, s.penalty]; }), [0, 1])
        ]),
        K.seeAlso("How Strain builds:", [["fl-overdraw/strain-points", "Strain Points"], ["fl-overdraw/non-combat-overdraw", "Non-Combat Overdraw"]]),
        K.seeAlso("Clearing it:", [["fl-recovery", "Ritual Recovery"], ["fl-breakflow/breakflow-restoration", "Breakflow Restoration"]]),
        K.seeAlso("The condition:", [["ref-conds/strain", "Strain"]])
      ];
    } },

    /* ---- 6 · Overdraw ----------------------------------------------------------- */
    { id: "fl-overdraw", title: "Overdraw", tag: "PAST AN EMPTY RESERVOIR", order: 60, when: has("overdraw"), build: function (ctx, K) {
      var o = F().overdraw;
      return [
        K.ruleBlock("Vitality Loss", o.vitalityLoss),
        K.ruleBlock("Strain Points", o.strain),
        /* "cleansing an anomaly" is the Cleansing Project, whose own table is stricter (a
           Mixed Result and a Critical Failure cost Strain too), so it links there */
        o.nonCombat ? K.ruleBlock("Non-Combat Overdraw", o.nonCombat, null, { terms: { "cleansing an anomaly": "fl-dist-cleanse/the-cleansing-project" } }) : null,
        K.seeAlso("What each Stage does:", [["fl-strain", "The Strain Track"]])
      ];
    } },

    /* ---- 7 · Breakflow and coming back from it ---------------------------------- */
    { id: "fl-breakflow", title: "Breakflow & Restoration", tag: "SEVERED FROM THE CURRENT", order: 70, when: has("breakflow"), build: function (ctx, K) {
      var f = F(), b = f.breakflow, r = f.breakflowRestoration;
      return [
        b.triggers ? K.ruleBlock("Triggers", b.triggers) : null,
        K.ruleBlock("Breakflow Check", b.check, "DC " + b.dcFormula),
        K.ruleBlock("In Breakflow", b.onFailure, null, { conditions: true }),
        // the two routes are named lines, so each is an anchor of its own (full-restoration, rough-restoration)
        r ? K.ruleBlock("Breakflow Restoration", "- " + r.full + "\n- " + r.rough) : null,
        K.seeAlso("The condition:", [["ref-conds/breakflow", "Breakflow"]])
      ];
    } },

    /* ---- 8 · Ritual Recovery ---------------------------------------------------- */
    { id: "fl-recovery", title: "Ritual Recovery", tag: "ONCE PER 24 HOURS", order: 80, when: has("ritualRecovery"), build: function (ctx, K) {
      var rr = F().ritualRecovery;
      return [
        K.ruleBlock("The Ritual", rr.note),
        K.entry("time-and-snag-dice", "Time and Snag Dice by Stage", [
          K.subTitle("Time and Snag Dice by Stage"),
          K.refTable(["Stage", "Time per Stage", "Snag Dice"], rr.byStage.map(function (s) { return [s.stage + " · " + s.name, s.time, String(s.snag)]; }), [0])
        ]),
        K.entry("outcomes", "Outcomes", [
          K.subTitle("Outcomes"),
          K.refTable(["Margin", "Result", "Effect"], rr.outcomes.map(function (o) { return [o.margin, o.result, o.text]; }), [0, 1])
        ]),
        rr.cooperative ? K.ruleBlock("Cooperative Recovery", rr.cooperative) : null,
        K.seeAlso("Out of Breakflow:", [["fl-breakflow/breakflow-restoration", "Breakflow Restoration"]]),
        // a ritual inside a disturbance adds Snag Dice equal to its Severity (Flow Disturbances)
        K.seeAlso("Inside a Flow Disturbance:", [["fl-dist/environmental-impact", "Environmental Impact"], ["fl-dist/failure-margin", "Failure Margin"]])
      ];
    } }
  ] });

  /* Pointer terms: the names the data, the conditions and the class text use for these
     panels. The chapter title "The Flow" and the panel titles link on their own; these are
     the other spellings ("the Flow chapter" in the Breakflow condition, "Breakflow Check"
     in the Strain track). Strain and Breakflow on their own stay the conditions' words. */
  CV.terms({
    "Flow chapter": "fl-core",
    "Order of Shaping": "fl-shaping",
    "Free-Shaping": "fl-shaping",
    "Precision Shaping": "fl-shaping/precision-shaping",
    "Layered Force": "fl-shaping/layered-force",
    "Flow Attribute Check": "fl-core/flow-attribute-check",
    "Sustain Compatibility": "fl-sustain/sustain-compatibility",
    "Focus Disruption": "fl-sustain/focus-disruption",
    "Strain track": "fl-strain",
    "Breakflow Check": "fl-breakflow/breakflow-check",
    "Breakflow Checks": "fl-breakflow/breakflow-check",
    "Breakflow Restoration": "fl-breakflow/breakflow-restoration",
    "Rough Restoration": "fl-breakflow/rough-restoration"
  });

  /* ===========================================================================
     FLOW DISTURBANCES (Codex Phase 2): the Anomalies, Severity, detection, the
     Cleansing Project, Counter Flow, the Focal Anchor and repairing a Null Scar,
     rendered from EN.flow.disturbances (app/data/flow.js, which names its source
     lines in the book). Five panels for both desktops and one for the Admin
     desktop (Placing an Anomaly), which reads the GM's own data: the Breakflow
     Bleed Set Piece (EN.gmBook.hazards) and the Filtration Stack worked example
     (EN.gmBook.encounters), the two GM sites that send a reader here.
       fl-dist          Flow Disturbances (core concepts, the six Anomalies)
       fl-dist-detect   Detecting and Analyzing
       fl-dist-cleanse  Cleansing & Counter Flow (with the Ritual Chorus)
       fl-dist-anchor   Inside a Null Scar: The Focal Anchor
       fl-dist-repair   Repairing a Null Scar
       fl-dist-gm       Placing an Anomaly (audience gm)
     The words are the data's; this file adds only headings, chip text and the
     small pointers between panels.
     =========================================================================== */
  function D() { var f = F(); return (f && f.disturbances) || null; }
  function hasD(field) { return function () { var d = D(); return !!(d && d[field]); }; }
  // "- Name: text" lines, so each item is a named line (an anchor of its own)
  function named(list, nameKey) {
    return (list || []).map(function (x) { return "- " + x[nameKey || "name"] + ": " + x.text; }).join("\n");
  }
  function paras(arr, K) { return (arr || []).map(function (t) { return K.proseBlock(t); }); }
  function outcomeTable(K, rows) {
    return K.refTable(["Margin", "Result", "Progress"], rows.map(function (o) { return [o.margin, o.result, o.text]; }), [0, 1]);
  }
  // the GM's own data, for the Admin-only panel
  function gmBleed() {
    var H = EN.gmBook && EN.gmBook.hazards, items = (H && H.setPieces && H.setPieces.items) || [];
    return byKey(items, "bleed");
  }
  function gmFiltration() {
    var E = EN.gmBook && EN.gmBook.encounters;
    return byKey((E && E.examples) || [], "filtration");
  }

  CV.addPanels("flow", [

    /* ---- 9 · the Anomalies -------------------------------------------------- */
    { id: "fl-dist", title: "Flow Disturbances", tag: "ANOMALIES · SEVERITY 1 TO 5", order: 90, when: hasD("classifications"), build: function (ctx, K) {
      var d = D();
      return [
        K.proseBlock(d.intro),
        K.subTitle("Core Concepts"),
        d.coreConcepts.map(function (c) { return K.ruleBlock(c.term, c.text); }),
        K.subTitle("Anomaly Classifications"),
        d.classifications.map(function (a) { return K.ruleBlock(a.name, a.effect); }),
        d.clankers ? K.ruleBlock("Clankers", d.clankers) : null,
        (d.ritualImpact || []).length ? K.subTitle("Rituals in a Flow Disturbance") : null,
        // borrowed from Rough Restoration's GM Guidance box, so tagged as the book has it
        (d.ritualImpact || []).map(function (r) { return K.ruleBlock(r.label, r.text, "GM GUIDANCE · BREAKFLOW RESTORATION"); }),
        K.seeAlso("A Flow-rich area is Anomaly Severity 0:", [["fl-breakflow/full-restoration", "Full Restoration"], ["fl-recovery", "Ritual Recovery"]]),
        K.seeAlso("Finding and clearing one:", [["fl-dist-detect", "Detecting and Analyzing"], ["fl-dist-cleanse", "Cleansing & Counter Flow"]]),
        K.seeAlso("Inside a Null Scar:", [["fl-dist-anchor", "The Focal Anchor"], ["fl-dist-repair", "Repairing a Null Scar"]])
      ];
    } },

    /* ---- 10 · finding one ---------------------------------------------------- */
    { id: "fl-dist-detect", title: "Detecting and Analyzing", tag: "PASSIVE · ACTIVE · MEDITATION", order: 100, when: hasD("detection"), build: function (ctx, K) {
      var t = D().detection;
      return [
        K.proseBlock(t.intro),
        t.methods.map(function (m) { return K.ruleBlock(m.name, m.text, m.mode.toUpperCase()); }),
        K.seeAlso("What the Severity sets:", [["fl-dist-cleanse/the-cleansing-project", "The Cleansing Project"], ["fl-dist-cleanse/counter-flow", "Counter Flow"]])
      ];
    } },

    /* ---- 11 · clearing one ---------------------------------------------------- */
    { id: "fl-dist-cleanse", title: "Cleansing & Counter Flow", tag: "PROJECT · d20 · RITUAL CHORUS", order: 110, when: hasD("cleansing"), build: function (ctx, K) {
      var d = D(), c = d.cleansing, cf = d.counterFlow;
      return [
        K.subTitle("Cleansing and Repair"),
        K.proseBlock(c.intro),
        K.ruleBlock("The Cleansing Project", c.project + "\n" + named(c.rules), "DICE POOL"),
        K.entry("resolving-cleansing-intervals", "Resolving Cleansing Intervals", [
          K.subTitle("Resolving Cleansing Intervals"),
          K.proseBlock(c.intervals),
          outcomeTable(K, c.outcomes),
          K.proseBlock(c.complete)
        ]),
        cf ? K.ruleBlock("Counter Flow", cf.intro + "\n" + named(cf.rules) + "\n" + cf.note, "d20 METHOD") : null,
        d.ritualChorus ? K.ruleBlock("Ritual Chorus", d.ritualChorus) : null,
        (d.gmGuidance || []).length ? K.ruleBlock("GM Guidance", named(d.gmGuidance, "label")) : null,
        (d.summary || []).length ? K.ruleBlock("Gameplay Summary", named(d.summary, "label")) : null,
        K.seeAlso("The Strain it costs:", [["fl-strain", "The Strain Track"], ["fl-overdraw/non-combat-overdraw", "Non-Combat Overdraw"], ["fl-recovery", "Ritual Recovery"]]),
        K.seeAlso("How a Dice Pool runs:", [["rz-pool", "Dice Pools"], ["rz-margin", "Success Margin & Consequence"]])
      ];
    } },

    /* ---- 12 · the Focal Anchor ------------------------------------------------- */
    { id: "fl-dist-anchor", title: "Inside a Null Scar: The Focal Anchor", tag: "DEFENSE 14 · VITALITY 15 × SEVERITY", order: 120, when: hasD("focalAnchor"), build: function (ctx, K) {
      var d = D(), fa = d.focalAnchor, id = fa.identify, de = fa.destroy;
      return [
        paras(fa.intro, K),
        K.ruleBlock("Identifying the Anchor", id.text + "\n- DC: " + id.dc + "\n- On Success: " + id.onSuccess, "ACTION"),
        K.ruleBlock("Destroying the Anchor", de.text + "\n- Defense: " + de.defense + "\n- Vitality: " + de.vitality + "\n- Immunities: " + de.immunities),
        K.ruleBlock("When the Anchor Falls", fa.falls.text + "\n" + K.bullets(fa.falls.effects)),
        K.proseBlock(fa.closing),
        d.nullScarGuidance ? K.ruleBlock("GM Guidance", d.nullScarGuidance) : null,
        K.seeAlso("Making it permanent:", [["fl-dist-repair", "Repairing a Null Scar"]]),
        K.seeAlso("The Anomaly itself:", [["fl-dist/null-scar", "Null Scar"]])
      ];
    } },

    /* ---- 13 · repairing a Null Scar ---------------------------------------------- */
    { id: "fl-dist-repair", title: "Repairing a Null Scar", tag: "THE RECONSTRUCTION RITUAL", order: 130, when: hasD("repair"), build: function (ctx, K) {
      var r = D().repair;
      return [
        paras(r.intro, K),
        K.ruleBlock("Establishing Anchors", r.anchors.text + "\n- Mechanics: " + r.anchors.mechanics + "\n- Failure: " + r.anchors.failure, "d20 METHOD"),
        K.ruleBlock("The Reconstruction Ritual", r.ritual.text),
        K.ruleBlock("The Null Scar Project", named(r.ritual.rules), "DICE POOL"),
        K.entry("scar-size", "Scar Size", [
          K.subTitle("Scar Size"),
          K.refTable(["Scar Size", "Target Progress", "Residual Severity (on Completion)"], r.sizes.map(function (s) {
            return [s.size + " (" + s.scale + ")", String(s.target), s.residual];
          }), [0])
        ]),
        K.entry("resolving-null-intervals", "Resolving Null Intervals", [
          K.subTitle("Resolving Null Intervals"),
          K.proseBlock(r.intervals),
          outcomeTable(K, r.outcomes)
        ]),
        K.subTitle("Outcome and Aftermath"),
        K.ruleBlock("On Completion", K.bullets(r.completion), "TARGET PROGRESS REACHED"),
        K.ruleBlock("On Ritual Collapse", K.bullets(r.collapse), "CRITICAL FAILURE"),
        (r.gmGuidance || []).length ? K.ruleBlock("GM Guidance", named(r.gmGuidance, "label")) : null,
        K.seeAlso("A window, not a repair:", [["fl-dist-anchor", "The Focal Anchor"]])
      ];
    } },

    /* ---- 14 · the GM's side: where the book puts one ---------------------------
       Admin only. Nothing here is new text: the Set Piece and the worked example are
       the GM data's own copies, shown here because both send their reader to this
       chapter for the rules. */
    { id: "fl-dist-gm", title: "Placing an Anomaly", tag: "SET PIECE · WORKED EXAMPLE", audience: "gm", order: 140,
      when: function () { return !!(D() && gmBleed()); },
      build: function (ctx, K) {
        var sp = gmBleed(), ex = gmFiltration();
        if (!sp) return [];
        return [
          K.ruleBlock(sp.name, sp.text, "SET PIECE · GRADE " + sp.grade),
          ex ? K.ruleBlock(ex.name, ex.text, "WORKED EXAMPLE · CALIBER " + ex.caliber) : null,
          K.seeAlso("An Incursion's object anchor runs as a Focal Anchor:", [["gms-incursion/the-anchor", "The anchor"], ["fl-dist-anchor", "The Focal Anchor"]]),
          K.seeAlso("Pricing and running it as a hazard:", [["gmh-pricing", "Pricing Hazards"], ["gmh-count", "How Many Hazards"]])
        ];
      } }
  ]);

  /* Pointer terms for the disturbances: the book's names for the Anomalies and the
     procedures, singular and plural, matched in any case. "Flow Disturbances" (also
     the fl-dist panel title) links every citation of the book's section, in the GM
     data, the Bestiary, the gear and the lineages. */
  CV.terms({
    "Flow Disturbances": "fl-dist",
    "Flow Disturbance": "fl-dist",
    "Anomaly Classifications": "fl-dist",
    "Severity Rating": "fl-dist/severity-rating",
    "Anomaly Severity": "fl-dist/severity-rating",
    "Echo Field": "fl-dist/echo-field",
    "Echo Fields": "fl-dist/echo-field",
    "Static Zone": "fl-dist/static-zone",
    "Static Zones": "fl-dist/static-zone",
    "Resonant Storm": "fl-dist/resonant-storm",
    "Resonant Storms": "fl-dist/resonant-storm",
    "Corrupted Signature": "fl-dist/corrupted-signature",
    "Flow Parasite": "fl-dist/flow-parasite",
    "Null Scar": "fl-dist/null-scar",
    "Null Scars": "fl-dist/null-scar",
    "Resonance Sense": "fl-dist-detect/resonance-sense",
    "Focused Tuning": "fl-dist-detect/focused-tuning",
    "Echo Listening": "fl-dist-detect/echo-listening",
    "Cleansing Project": "fl-dist-cleanse/the-cleansing-project",
    "Harmonic Realignment Project": "fl-dist-cleanse/the-cleansing-project",
    "Counter Flow": "fl-dist-cleanse/counter-flow",
    "Counter Progress": "fl-dist-cleanse/counter-flow",
    "Ritual Chorus": "fl-dist-cleanse/ritual-chorus",
    "Focal Anchor": "fl-dist-anchor",
    "Reconstruction Ritual": "fl-dist-repair/the-reconstruction-ritual",
    "Anchor Nodes": "fl-dist-repair/establishing-anchors"
  });
})();
