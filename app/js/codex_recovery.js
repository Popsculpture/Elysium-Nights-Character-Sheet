/* ===========================================================================
   ELYSIUM NIGHTS · Codex chapter: Vitality & Recovery
   The book's Vitality & Recovery chapter for both desktops, rendered from
   EN.recovery (app/data/recovery.js, a transcription of Part 2). Before it the
   only statement of these rules was inline text on the Combat tab: the DYING,
   STABLE and BLOODIED banners, the Vigor button's tooltip, and the three rest
   popovers. Those sites can now link here.
     recovery: "Vitality & Recovery", order 45 (between Combat Rules and the
     Conditions Library), audience "both", panel ids "rc-"
   What other chapters already hold is linked, never repeated: the damage order
   (ref-damage/damage-order), the conditions this chapter names (Bloodied,
   Critical Condition, Critical Wound, Fatigue, Unconscious), and the full rules
   of Ritual Recovery and Breakflow Restoration (the Flow chapter). Every rule
   line is a field of EN.recovery; this file's own words are entry labels, the
   "Example in Play" kicker and the small pointers between panels.
   The API is documented in the header of app/js/codex.js.
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;
  var CV = EN.codexView;

  function D() { return EN.recovery || null; }
  function has(field) { return function () { var d = D(); return !!(d && d[field]); }; }

  /* A bullet that leads with a bold label ("**0 Wounds:** Fall ...") as a NAMED LINE
     ("0 Wounds: Fall ..."), so the label is an anchor of its own. */
  function named(s) { return String(s).replace(/^\*\*([^*:]+):\*\*\s*/, "$1: "); }
  /* The book's bullets as rule text: a string is a bullet, a nested array the sub-bullets
     of the one before it. `asNamed` turns bold-labelled bullets into named lines. `skip`
     lists top-level indices to leave out (a nested array goes with its parent). */
  function list(arr, asNamed, skip) {
    var out = [], top = -1, skipping = false;
    (arr || []).forEach(function (x) {
      if (Array.isArray(x)) {
        if (skipping) return;
        x.forEach(function (s) { out.push("  - " + (asNamed ? named(s) : s)); });
        return;
      }
      top++;
      skipping = !!(skip && skip.indexOf(top) !== -1);
      if (!skipping) out.push("- " + (asNamed ? named(x) : x));
    });
    return out.join("\n");
  }
  /* The book's "Example in Play" boxes: an illustration, not a rule, so a box rather than
     an entry (a panel with two would otherwise hold example-in-play and example-in-play-2). */
  function example(K, text) {
    if (!text) return null;
    return K.el("div.muted-box", { style: { margin: "0 0 10px", padding: "10px 12px", textAlign: "left" } }, [
      K.el("div", { style: { fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: ".12em", color: "var(--text3)", margin: "0 0 4px" }, text: "EXAMPLE IN PLAY" }),
      K.linkify(K.el("p", { style: { margin: 0, fontSize: "13px", fontStyle: "italic", color: "var(--text2)", lineHeight: "1.5" } }), text, { conditions: true })
    ]);
  }

  EN.codexView.register({ id: "recovery", title: "Vitality & Recovery", order: 45, audience: "both", panels: [

    /* ---- 1 · the words ------------------------------------------------------ */
    { id: "rc-glance", title: "At a Glance", tag: "CORE CONCEPTS", order: 10, when: has("concepts"), build: function (ctx, K) {
      var r = D();
      return [
        r.intro ? K.proseBlock(r.intro) : null,
        K.entry("core-concepts", "Core Concepts", [
          K.subTitle("Core Concepts"),
          K.refTable(["Term", "Summary"], r.concepts.map(function (c) { return [c.term, c.text]; }), [0])
        ]),
        r.summary ? K.ruleBlock("Gameplay Summary", r.summary) : null,
        K.seeAlso("How a hit comes off the pools:", [["ref-damage/damage-order", "Damage Order"]])
      ];
    } },

    /* ---- 2 · Vitality and Wounds ---------------------------------------------- */
    { id: "rc-vitality", title: "Vitality & Wounds", tag: "STAMINA · LASTING TRAUMA", order: 20, when: has("vitality"), build: function (ctx, K) {
      var v = D().vitality, w = D().wounds;
      var kids = [
        K.ruleBlock("Vitality", v.intro + "\n\n" + list(v.rules), null, { conditions: true }),
        K.entry("calculating-vitality", "Calculating Vitality", [
          K.subTitle("Calculating Vitality"),
          K.refTable(["Class", "Resilience Die", "Vitality at 1st Level", "Vitality Gain Per Level"],
            v.byClass.map(function (c) { return [c.cls, c.die, c.start, c.perLevel]; }), [0])
        ]),
        example(K, v.example)
      ];
      if (w) kids.push(
        K.ruleBlock("Wounds", w.intro),
        K.ruleBlock("Calculating Wounds", "**" + w.max.trait + ":** " + w.max.value),
        K.ruleBlock("Wound Effects", list(w.effects), null, { conditions: true, terms: { "Critical Wound Table": "ref-conds/critical-wound" } }),
        K.ruleBlock("Healing Wounds", list(w.healing), null, { terms: { "Recovery section": "rc-rests", "Medical treatment": "rc-medical" } }),
        example(K, w.example)
      );
      kids.push(K.seeAlso("The conditions:", [["ref-conds/bloodied", "Bloodied"], ["ref-conds/critical-condition", "Critical Condition"],
                                              ["ref-conds/critical-wound", "Critical Wound"], ["ref-conds/fatigue", "Fatigue"]]));
      return kids;
    } },

    /* ---- 3 · Death and Dying ----------------------------------------------------
       Each threshold and each Death Save outcome is a named line, so "rc-dying/0-wounds"
       and "rc-dying/three-failures" are anchors of their own. */
    { id: "rc-dying", title: "Death and Dying", tag: "0 WOUNDS · DEATH SAVES", order: 30, when: has("dying"), build: function (ctx, K) {
      var d = D().dying;
      return [
        K.proseBlock(d.intro),
        K.ruleBlock("Thresholds", list(d.thresholds, true), null, { conditions: true }),
        K.ruleBlock("Dying", d.dying, null, { conditions: true }),
        K.ruleBlock("Death Saves", list(d.deathSaves, true) + (d.notDying ? "\n\n" + d.notDying : ""), null,
          { conditions: true, terms: { "Nonlethal": "ref-dmg/nonlethal" } }),
        K.ruleBlock("Stable", d.stable.text + "\n" + list(d.stable.rules), null, { conditions: true }),
        K.ruleBlock("Stabilizing Someone", d.stabilizing.text + "\n" + list(d.stabilizing.rules), null, { conditions: true }),
        K.ruleBlock("Coming Back", d.comingBack.text + "\n" + list(d.comingBack.rules)),
        K.ruleBlock("Dying Outright", d.outright.join("\n\n"))
      ];
    } },

    /* ---- 4 · Resilience Dice ---------------------------------------------------- */
    { id: "rc-resilience", title: "Resilience Dice", tag: "ONE PER LEVEL", order: 40, when: has("resilience"), build: function (ctx, K) {
      var r = D().resilience;
      return [
        K.ruleBlock("Resilience Dice", r.intro + "\n\n" + list(r.rules)),
        K.ruleBlock("Spending Resilience Dice", list(r.spending)),
        K.ruleBlock("Regaining Resilience Dice", list(r.regaining)),
        example(K, r.example),
        K.seeAlso("Each class's die:", [["rc-vitality/calculating-vitality", "Calculating Vitality"]])
      ];
    } },

    /* ---- 5 · Vigor ----------------------------------------------------------- */
    { id: "rc-vigor", title: "Vigor", tag: "ABSORBED FIRST · NEVER STACKS", order: 50, when: has("vigor"), build: function (ctx, K) {
      var v = D().vigor;
      return [
        K.ruleBlock("Vigor", v.intro),
        K.ruleBlock("Vigor Does Not Stack", v.noStack),
        K.ruleBlock("Expiration", v.expiration),
        example(K, v.example),
        K.seeAlso("Where it sits in the damage order:", [["ref-damage/damage-order", "Damage Order"]])
      ];
    } },

    /* ---- 6 · the rests ------------------------------------------------------------
       In the book's order. Ritual Recovery and Breakflow Restoration show their duration
       and the bullets the Flow chapter does not already state, then point at it. */
    { id: "rc-rests", title: "Rests", tag: "SHORT · LONG · RITUAL · DOWNTIME · BREAKFLOW", order: 60, when: has("rests"), build: function (ctx, K) {
      var r = D();
      var FLOW = {
        ritual: { terms: { "The Ritual of Alignment": "fl-recovery" }, see: [["fl-recovery", "Ritual Recovery"]] },
        breakflow: { see: [["fl-breakflow/full-restoration", "Full Restoration"], ["fl-breakflow/rough-restoration", "Rough Restoration"]] }
      };
      var kids = [r.recoveryIntro ? K.proseBlock(r.recoveryIntro) : null];
      r.rests.forEach(function (rest) {
        var f = FLOW[rest.key] || {};
        // the book's pointer is a sub-bullet of the first bullet, so it goes when that bullet does
        var pointer = rest.pointer && (rest.inFlowChapter || []).indexOf(0) === -1 ? "\n\n" + rest.pointer : "";
        var text = "*Duration: " + rest.duration + "*\n" + list(rest.lines, false, rest.inFlowChapter) + pointer;
        kids.push(K.ruleBlock(rest.name, text, null, { conditions: true, terms: f.terms }));
        // the pointer sits under the block it completes; the book's italic closing line follows
        if (f.see) kids.push(K.seeAlso("The full rules, in The Flow:", f.see));
        if (rest.flavor) kids.push(K.note(rest.flavor));
      });
      kids.push(K.seeAlso("Care beyond rest:", [["rc-medical", "Medical Treatment"], ["rc-other", "Other Recovery Sources"]]));
      return kids;
    } },

    /* ---- 7 · Medical Treatment ---------------------------------------------------- */
    { id: "rc-medical", title: "Medical Treatment", tag: "STABILIZE · TREAT WOUNDS · TREAT FATIGUE", order: 70, when: has("medical"), build: function (ctx, K) {
      var m = D().medical, tf = m.treatFatigue;
      return [
        K.ruleBlock("Medical Treatment", m.intro + "\n\n" + list(m.rules)),
        K.ruleBlock("Stabilize", m.stabilize.use + "\n" + list(m.stabilize.lines)),
        K.ruleBlock("Treat Wounds", m.treatWounds.use + "\n" + list(m.treatWounds.lines)),
        K.entry("treat-fatigue", "Treat Fatigue", [
          K.subTitle("Treat Fatigue"),
          K.proseBlock(tf.use),
          K.refTable(["Fatigue", "Snag Dice", "Equipment", "Effect"], tf.rows.map(function (x) { return [x.fatigue, x.snag, x.equipment, x.effect]; }), [0, 1])
        ]),
        K.seeAlso("Who the treatment is for:", [["rc-dying/stabilizing-someone", "Stabilizing Someone"], ["ref-conds/fatigue", "Fatigue"]])
      ];
    } },

    /* ---- 8 · everything else that restores --------------------------------------- */
    { id: "rc-other", title: "Other Recovery Sources", tag: "STIMS · RELICS · RITES", order: 80, when: has("otherSources"), build: function (ctx, K) {
      return [K.ruleBlock("Other Recovery Sources", list(D().otherSources, true))];
    } }
  ] });

  /* Pointer terms: the names class text, gear, conditions and the GM chapters use for these
     rules. The panel titles link on their own ("Vigor", "Resilience Dice", "Medical
     Treatment"); these are the other spellings and the single entries. The book's
     "Dying and Death Saves" links rc-dying, and the chapter title links its first panel. */
  CV.terms({
    "Death Save": "rc-dying/death-saves",
    "Death Saves": "rc-dying/death-saves",
    "Dying": "rc-dying/dying",
    "Dying and Death Saves": "rc-dying",
    "Wound pool": "rc-dying",
    "Wound damage": "rc-vitality/wound-effects",
    "Maximum Wounds": "rc-vitality/calculating-wounds",
    "Resilience Die": "rc-resilience",
    "Resilience Dice": "rc-resilience",
    "Short Rest": "rc-rests/short-rest",
    "Short Rests": "rc-rests/short-rest",
    "Long Rest": "rc-rests/long-rest",
    "Long Rests": "rc-rests/long-rest",
    "Downtime Healing": "rc-other/downtime-healing",
    "Stabilize": "rc-medical/stabilize",
    "Treat Wounds": "rc-medical/treat-wounds",
    "Treat Fatigue": "rc-medical/treat-fatigue"
  });
})();
