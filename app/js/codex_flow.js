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
        o.nonCombat ? K.ruleBlock("Non-Combat Overdraw", o.nonCombat) : null,
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
        K.seeAlso("Out of Breakflow:", [["fl-breakflow/breakflow-restoration", "Breakflow Restoration"]])
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
})();
