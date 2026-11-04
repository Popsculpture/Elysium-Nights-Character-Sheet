/* ===========================================================================
   ELYSIUM NIGHTS · Flow tab
   For Shapers: the Reservoir + Strain + Breakflow tracker, a Free-Shaping
   (Order of Shaping) Invocation calculator, a Sustain tracker, and a saved
   Resonant Pattern log. Unattuned classes get a short status panel instead.
   Flow state persists on ch.flow; the builder form is transient module state.
   23 Oct 2026: Strain stages list cumulatively (each Stage keeps the Stages below it), a stage
   click clears partial points only when it lowers the Stage, an attack-resolved Hybrid shows the
   damage-plus-effect rule, and Poltergeist is gated to Level 3 (Hardware Harmonization).
   24 Oct 2026 rulings, section 9: the Strain track here is the one Strain value (item 8): every
   write goes through fset, which folds an old saved Strain condition in first (EN.engine
   .mergeStrain), and the Status Changes card draws the condition from it. Ritual Recovery logs
   its result here (item 8). Absolute Conduit ignores Ripple and Wave at every Stage (item 3).
   =========================================================================== */
window.EN = window.EN || {};

EN.flowView = (function () {
  var el = EN.ui.el, toast = EN.ui.toast, store = EN.store, eng = EN.engine;
  var FP = "var(--fp)";        // arc-violet, shared with the Freelancer FP bar
  var VIO = "var(--flow)";     // resonance accent

  // transient builder formulation (not persisted until Saved as a Pattern)
  var _form = { name: null, resonance: "kinetic", intent: "damage", deliveryBand: "directed",
                deliveryOption: "Remote", force: "base", duration: "instant", precision: false,
                extraTargets: 0, extraSpaces: 0, empoweredEffect: null, baseEffect: null, unwilling: true, layer: null };
  var _fieldShare = 5;          // FP a Sustained Field reserves (a shared Field splits the 5)
  var _open = {};              // collapse state for folds (Premade Templates)
  var _od = 1;                 // overdraw amount input
  /* Immersive Flow tab: opt-in cosmetic layer (see theme.css ".flowtab.immersive").
     Device-level preference; intensity "auto" follows the live Strain stage, or a
     forced "1".."5" pins the animation to that escalation level. */
  var IMM_KEY = "en_flow_immersive_v1", INT_KEY = "en_flow_intensity_v1";
  var _immersive = false, _intensity = "auto";
  try { _immersive = localStorage.getItem(IMM_KEY) === "1"; } catch (e) {}
  try { var _iv = localStorage.getItem(INT_KEY); if (_iv) _intensity = _iv; } catch (e) {}
  function isImmersive() { return _immersive; }
  function setImmersive(on) { _immersive = !!on; try { localStorage.setItem(IMM_KEY, on ? "1" : "0"); } catch (e) {} }
  function getIntensity() { return _intensity; }
  function setIntensity(v) { _intensity = String(v); try { localStorage.setItem(INT_KEY, _intensity); } catch (e) {} }

  /* ---- small shared bits ---- */
  // every Flow write folds an old saved Strain condition into ch.flow.strain first (one Strain value)
  function fset(mut, silent) { store.update(function (c) { c.flow = c.flow || {}; eng.mergeStrain(c); mut(c.flow, c); }, silent ? { silent: true } : undefined); }
  function noteP(t, color) { return el("p.help", { style: { margin: "2px 0 6px", color: color || "var(--text3)", fontSize: "11.5px" }, text: t }); }
  function bar(cur, max, color) {
    var pct = max > 0 ? Math.max(0, Math.min(100, cur / max * 100)) : 0;
    return el("div.flow-bar.meter", { style: { height: "11px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", margin: "5px 0 2px" } },
      [el("div.flow-bar-fill.meter-fill", { style: { width: pct + "%", height: "100%", background: color, boxShadow: "0 0 8px " + color, transition: "width .2s" } })]);
  }
  function stepper(onMinus, onPlus, minusOff, plusOff) {
    return el("div.stepper", { style: { marginTop: 0, width: "auto" } }, [
      el("button", { disabled: !!minusOff, onclick: onMinus }, "−"),
      el("button", { disabled: !!plusOff, onclick: onPlus }, "+")
    ]);
  }
  // segmented button group; items: [{key,label,disabled,title}]
  function seg(items, isOn, onPick) {
    return el("div.row.wrap", { style: { gap: "6px" } }, items.map(function (it) {
      var on = isOn(it.key);
      return el("button.btn.sm" + (on ? ".primary" : ""), { disabled: !!it.disabled, title: it.title || "",
        onclick: function () { if (!it.disabled) onPick(it.key); } }, it.label);
    }));
  }
  function setForm(patch) { Object.keys(patch).forEach(function (k) { _form[k] = patch[k]; }); EN.app.render(); }
  // a builder row's label; with an anchor the label itself peeks that rule in the Codex
  function fieldLabel(t, anchor) {
    return el("span.row-label", { style: { fontFamily: "var(--disp)", fontSize: "9.5px", letterSpacing: ".12em", color: "var(--text3)", minWidth: "72px", display: "inline-block" } },
      [anchor && t ? EN.ui.ruleLink(anchor, t) : t]);
  }

  /* ---- links into the Codex ----
     The Flow rules live in the Codex's chapter The Flow (js/codex_flow.js), read from the
     same EN.flow this tab's tools read. These go through EN.ui's guarded helpers, so with
     no Codex every label still prints as plain text. */
  function slug(s) { return String(s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  // a small note like noteP whose rule names (Overdraw, Breakflow Check, Layered Force...) link
  function ruleNote(t, color, opts) {
    var p = el("p.help", { style: { margin: "2px 0 6px", color: color || "var(--text3)", fontSize: "11.5px" } });
    EN.ui.ruleText(p, t, opts);
    return p;
  }
  // the "?" chip for a panel header; headerRight only when the Codex is there to answer it
  function headChip(anchor, title) { var c = EN.ui.ruleChip(anchor, { title: title }); return c ? { headerRight: c } : {}; }
  function withCorners(o) { o.corners = true; return o; }
  function curFP(ch, d) { var c = (ch.flow && ch.flow.current != null) ? ch.flow.current : d.flow.max; return eng.clamp(c, 0, d.flow.max); }
  function collapsible(key, title, build) {
    var open = !!_open[key];
    var head = el("div.section-title.clickable", { onclick: function () { _open[key] = !open; EN.app.render(); } },
      [document.createTextNode(title), el("span.line"), el("span.collapse-caret", { style: { marginLeft: "4px" }, text: open ? "▾" : "▸" })]);
    return open ? [head, build()] : [head];
  }

  // accumulate Overdraw strain points; 3 points = +1 Stage, Stage 5 = Breakflow
  function bumpStrain(fl, pts) {
    fl.strainPoints = (fl.strainPoints || 0) + pts;
    var stage = fl.strain || 0;
    while (fl.strainPoints >= 3 && stage < 5) { stage++; fl.strainPoints -= 3; }
    fl.strain = Math.min(5, stage);
    if (fl.strain >= 5) { fl.breakflow = true; fl.sustained = null; fl.sustained2 = null; fl.fieldReserve = 0; }
  }

  // A Unique Resonance is never picked: it is granted by the subclass that owns
  // it (Synthetica, for the Sourcerer), and counts as one of the three known at
  // Level 1.
  function grantedResKeys(ch) {
    return ownResonances(ch).filter(function (r) { return r.unique; }).map(function (r) { return r.key; });
  }
  // every Resonance this character could ever hold: the standard list, plus a
  // Unique Resonance only if it belongs to their subclass
  function ownResonances(ch) {
    return EN.flow.resonances.filter(function (r) { return !r.unique || (ch && ch.subclass === r.unique); });
  }
  // Resonances this Shaper actually knows. If the character recorded picks in
  // #PRINT, use those; otherwise (legacy build) fall back to everything unlocked
  // by level so older Shapers keep working.
  function knownResKeys(ch, d) {
    var granted = grantedResKeys(ch);
    var rec = (ch && ch.resonances) || [];
    var picked = rec.length
      ? rec.slice()
      : EN.flow.resonances.filter(function (r) { return !r.unique && r.unlock <= d.level; }).map(function (r) { return r.key; });
    return granted.concat(picked.filter(function (k) { return granted.indexOf(k) === -1; }));
  }
  /* normalize the transient form against the known resonance set (called each render) */
  function normForm(ch, d) {
    var F = EN.flow;
    var known = knownResKeys(ch, d);
    var R = F.resonanceByKey[_form.resonance] || F.resonances[0];
    if (known.indexOf(_form.resonance) === -1) { // selected a resonance you do not know: fall back
      var firstKey = known[0] || F.resonances[0].key;
      _form.resonance = firstKey; R = F.resonanceByKey[firstKey] || F.resonances[0];
    }
    var band = F.delivery.find(function (b) { return b.key === _form.deliveryBand; }) || F.delivery[0];
    if (band.options.indexOf(_form.deliveryOption) === -1) _form.deliveryOption = band.options[0];
    if (_form.deliveryBand === "directed") { _form.precision = false; _form.extraSpaces = 0; }
    else { _form.extraTargets = 0; }
    var hasEffect = _form.intent === "effect" || _form.intent === "hybrid";
    if (_form.force === "empowered" && hasEffect) {
      var names = (R.empowered || []).map(function (e) { return e.name; });
      // the default pick skips an effect the character has not unlocked (Poltergeist, Level 3); an explicit pick (a loaded pattern) is left alone
      var open = (R.empowered || []).filter(function (e) { return !(e.unlock && e.unlock > (d.level || 1)); }).map(function (e) { return e.name; });
      if (names.indexOf(_form.empoweredEffect) === -1) _form.empoweredEffect = open[0] || names[0] || null;
    } else { _form.empoweredEffect = null; }
    // Base Force feeding an effect picks one of the Resonance's base effects (the first until chosen)
    var baseOpts = R.baseOptions || [];
    if (_form.force !== "empowered" && hasEffect && baseOpts.length) {
      if (!baseOpts.some(function (e) { return e.name === _form.baseEffect; })) _form.baseEffect = baseOpts[0].name;
    } else { _form.baseEffect = null; }
    // Layered Force (Level 5): a second Resonance in one Invocation. Same intent as the primary; its own Base or Empowered row.
    if (_form.layer) {
      var Ly = _form.layer, LR = F.resonanceByKey[Ly.resonance];
      if (!d.flow.layeredForce || !LR || known.indexOf(Ly.resonance) === -1) { _form.layer = null; }
      else {
        if (Ly.force !== "empowered") Ly.force = "base";
        if (Ly.force === "empowered" && hasEffect) {
          var lnames = (LR.empowered || []).map(function (e) { return e.name; });
          var lopen = (LR.empowered || []).filter(function (e) { return !(e.unlock && e.unlock > (d.level || 1)); }).map(function (e) { return e.name; });
          if (lnames.indexOf(Ly.empoweredEffect) === -1) Ly.empoweredEffect = lopen[0] || lnames[0] || null;
        } else { Ly.empoweredEffect = null; }
        var lbase = LR.baseOptions || [];
        if (Ly.force !== "empowered" && hasEffect && lbase.length) {
          if (!lbase.some(function (e) { return e.name === Ly.baseEffect; })) Ly.baseEffect = lbase[0].name;
        } else { Ly.baseEffect = null; }
      }
    }
    return R;
  }
  function costRow(key) { return EN.flow.costRows.filter(function (r) { return r.key === key; })[0] || null; }
  function costRowFor(intent, force) { return EN.flow.costRows.filter(function (r) { return r.intent === intent && r.force === (force === "empowered" ? "empowered" : "base"); })[0] || null; }

  /* ====================== RESERVOIR · STRAIN · BREAKFLOW ================== */
  function reservoirPanel(ch, d) {
    var f = d.flow, cur = curFP(ch, d), stage = f.strainStage;
    var kids = [];

    // FP readout + spend/restore + rest
    kids.push(el("div.row.between.wrap", { style: { alignItems: "baseline" } }, [
      el("div.mono.flow-fp", { style: { fontSize: "26px", color: FP }, html: cur + " <span style='font-size:14px;color:var(--text3)'>/ " + f.max + " FP</span>" }),
      el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        stepper(function () { fset(function (fl) { fl.current = Math.max(0, cur - 1); }); },
                function () { fset(function (fl) { fl.current = Math.min(f.max, cur + 1); }); }, cur <= 0, cur >= f.max),
        cur < f.max ? el("button.btn.sm", { title: "Realign: refill the Reservoir on a rest", style: { color: "var(--text2)" }, onclick: function () { fset(function (fl) { fl.current = f.max; }); } }, "⟳ REALIGN") : null
      ])
    ]));
    kids.push(bar(cur, f.max, FP));
    // the live numbers, each named by its rule; the formulas are EN.flow's own
    kids.push(el("p.help", { style: { margin: "2px 0 6px", color: "var(--text3)", fontSize: "11.5px" } }, [
      EN.ui.ruleLink("fl-core/reservoir", "Reservoir"), " = " + EN.flow.reservoirFormula + ". ",
      EN.ui.ruleLink("fl-core/flow-attack", "Flow Attack"), " " + eng.fmtMod(f.attackBonus) + " vs Defense · ",
      EN.ui.ruleLink("fl-core/flow-save-dc", "Flow Save DC"), " " + f.dc + " (" + f.attributeName + ")."
    ]));
    /* The second d20 roll with the current, added to Part 2 on 2026-09-16. Same bonus as the
       attack, so it reads the same derived field rather than recomputing it. What it covers
       is the Codex's (one copy, EN.basics.flow.check); the tab keeps the number and a hint. */
    kids.push(el("p.help", { style: { margin: "2px 0 6px", color: "var(--text3)", fontSize: "11.5px" } }, [
      EN.ui.ruleLink("fl-core/flow-attribute-check", "Flow Attribute Check"), " " + eng.fmtMod(f.attackBonus) + " for work with the current that is not an attack."
    ]));

    // Strain track: 5 stages, click to set (toggles to N-1 if already at N)
    kids.push(el("div.section-title", null, [EN.ui.ruleLink("ref-conds/strain", "Strain"), EN.ui.ruleChip("fl-strain", { title: "The Strain Track" }), el("span.line")]));
    var STC = ["var(--success)", "var(--warn)", "var(--warn)", "var(--ember)", "var(--danger)", "var(--danger)"];
    var cells = (EN.flow.strainTrack).map(function (s) {
      var on = stage >= s.stage, col = STC[s.stage];
      return el("button", { title: s.name + ": " + s.penalty,
        onclick: function () { fset(function (fl, c) { eng.setStrainStage(c, (fl.strain === s.stage) ? s.stage - 1 : s.stage); }); },
        style: { flex: "1 1 0", minWidth: "54px", padding: "5px 2px", cursor: "pointer", borderRadius: "4px",
                 fontFamily: "var(--disp)", fontSize: "9px", letterSpacing: ".08em",
                 border: "1px solid " + (on ? col : "var(--border2)"), background: on ? "rgba(0,0,0,.25)" : "transparent",
                 color: on ? col : "var(--text4)", boxShadow: on ? "0 0 7px " + col + "55" : "none" } },
        s.stage + " · " + s.name.toUpperCase());
    });
    kids.push(el("div.row", { style: { gap: "5px" } }, cells));
    /* Absolute Conduit (Shaper, Level 9) ignores Ripple and Wave at every Stage (2026-10-24 rulings,
       item 3): Stages 1 and 2 say "ignored" in place of their penalty, and from Stage 3 only Surge and
       higher list theirs. The Burden of the Earth exception rides under it. */
    if (stage > 0 && f.absoluteConduit) {
      EN.flow.strainTrack.filter(function (t) { return t.stage <= stage; }).forEach(function (t) {
        kids.push(t.stage < f.strainFrom
          ? el("p.help", { dataset: { strainLine: String(t.stage), ignored: "1" }, style: { margin: "2px 0 6px", color: "var(--success)", fontSize: "11.5px" }, text: "Stage " + t.stage + " (" + t.name + "): ignored (Absolute Conduit)." })
          : el("p.help", { dataset: { strainLine: String(t.stage) }, style: { margin: "2px 0 6px", color: "var(--warn)", fontSize: "11.5px" }, text: "Stage " + t.stage + " (" + t.name + "): " + t.penalty }));
      });
      if (f.strainIgnoredNote) kids.push(noteP(f.strainIgnoredNote, "var(--text3)"));
    } else if (stage > 0) {
      /* Each Stage keeps the effects of the Stages below it (the Strain Track, PHB), so Stage N lists
         the effects of Stages 1 to N, one line each, read from EN.flow.strainTrack. */
      EN.flow.strainTrack.filter(function (t) { return t.stage <= stage; }).forEach(function (t) {
        kids.push(el("p.help", { dataset: { strainLine: String(t.stage) }, style: { margin: "2px 0 6px", color: "var(--warn)", fontSize: "11.5px" }, text: "Stage " + t.stage + " (" + t.name + "): " + t.penalty }));
      });
    } else {
      kids.push(ruleNote("No Strain. Overdraw and failed Flow rituals build it."));
    }

    // Overdraw logger
    var odIn = el("input", { type: "number", min: "1", value: _od, style: { width: "54px", textAlign: "center", fontFamily: "var(--mono)" },
      oninput: function () { _od = Math.max(1, parseInt(this.value, 10) || 1); }, onchange: function () { EN.app.render(); } });
    kids.push(el("div.row.wrap.flow-overdraw", { style: { gap: "8px", alignItems: "center", marginTop: "10px", padding: "8px 10px", border: "1px solid var(--border2)", borderRadius: "4px", background: "rgba(0,0,0,.18)" } }, [
      el("span", { style: { fontFamily: "var(--disp)", fontSize: "9.5px", letterSpacing: ".12em", color: "var(--danger)" } }, [EN.ui.ruleLink("fl-overdraw", "OVERDRAW")]),
      odIn, el("span.mono", { style: { fontSize: "11px", color: "var(--text3)" }, text: "FP past empty" }),
      el("span.help", { style: { margin: 0, flex: "1 1 120px", fontSize: "10.5px" }, text: "→ lose " + _od + "d" + f.overdrawDie + " Vitality, +" + _od + " Strain point" + (_od === 1 ? "" : "s") }),
      el("button.btn.sm", { title: "Log an Overdraw: builds Strain and zeroes FP (apply the Vitality loss on the Freelancer tab)",
        style: { color: "var(--danger)", borderColor: "var(--danger)" },
        onclick: function () { var n = _od, die = f.overdrawDie; fset(function (fl) { fl.current = 0; bumpStrain(fl, n); }); toast("Overdrew " + n + " FP · lose " + n + "d" + die + " Vitality · +" + n + " Strain"); } }, "LOG")
    ]));

    kids.push(ritualRecoveryRow(ch, d, cur, stage));
    if (f.masterForging) kids.push(fieldRow(ch, d, cur));

    // Breakflow banner + restoration
    if (f.inBreakflow || stage >= 5) {
      kids.push(el("div", { style: { marginTop: "10px", padding: "10px", border: "1px solid var(--danger)", borderRadius: "4px", background: "rgba(255,77,94,.06)" } }, [
        el("div.row.between", { style: { alignItems: "baseline" } }, [
          el("span", { style: { fontFamily: "var(--disp)", fontSize: "11px", letterSpacing: ".14em", color: "var(--danger)" } },
            ["⚡ ", EN.ui.ruleLink("ref-conds/breakflow", "BREAKFLOW"), EN.ui.ruleChip("fl-breakflow", { title: "Breakflow & Restoration" })]),
          el("span.mono", { style: { fontSize: "12px", color: "var(--text2)" }, text: "Check DC " + f.breakflowDC })
        ]),
        // read from EN.flow.breakflow, so the banner cannot drift from the rule it summarises
        ruleNote(EN.flow.breakflow.onFailure + " Breakflow Check: " + EN.flow.breakflow.check, "var(--text2)"),
        el("div.row.wrap", { style: { gap: "8px", marginTop: "4px" } }, [
          el("button.btn.sm", { dataset: { restore: "full" }, title: "Ritual Restoration success: Reservoir to half, Strain to Stage 2", onclick: function () { fset(function (fl) { fl.current = Math.floor(f.max / 2); fl.strain = 2; fl.strainPoints = 0; fl.breakflow = false; }); toast("Restored: half Reservoir, Strain → Wave"); } }, "RITUAL (½ · Stage 2)"),
          el("button.btn.sm", { dataset: { restore: "rough" }, title: "Rough Restoration success: Reservoir to one-quarter, Strain to Stage 3", onclick: function () { fset(function (fl) { fl.current = Math.floor(f.max / 4); fl.strain = 3; fl.strainPoints = 0; fl.breakflow = false; }); toast("Rough restore: ¼ Reservoir, Strain → Surge"); } }, "ROUGH (¼ · Stage 3)")
        ])
      ]));
    }
    var rp = EN.ui.panel("Reservoir", "DC " + f.dc + " · " + f.attributeName.toUpperCase(), kids, withCorners(headChip("fl-core", "Core Concepts & Formulas")));
    rp.classList.add("res-panel"); return rp;
  }

  /* Sustained Fields (Master Forging, Level 7): while one stands it reserves FP of your maximum
     (5, or a share of it for a Field several Shapers hold). ANCHOR spends the FP and reserves them;
     a FAILED anchoring spends the 5 FP and reserves nothing; END gives back the maximum, not the
     points. Stored as ch.flow.fieldReserve; engine.derive subtracts it from the maximum. */
  function fieldRow(ch, d, cur) {
    var reserve = d.flow.fieldReserve | 0, share = Math.max(1, Math.min(5, _fieldShare));
    var label = el("span", { style: { fontFamily: "var(--disp)", fontSize: "9.5px", letterSpacing: ".12em", color: VIO } }, [EN.ui.ruleLink("fl-advanced/sustained-fields", "SUSTAINED FIELD")]);
    var kids = [label];
    if (reserve) {
      kids.push(el("span.mono", { dataset: { fieldReserve: String(reserve) }, style: { fontSize: "11px", color: "var(--warn)" }, text: "Field: −" + reserve + " max FP" }));
      kids.push(el("button.btn.sm", { dataset: { fieldEnd: "1" }, title: "End the Field: restores your maximum, not the points", style: { color: "var(--text3)" },
        onclick: function () { fset(function (fl) { fl.fieldReserve = 0; }); toast("Field ended · maximum restored"); } }, "END"));
    } else {
      kids.push(el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: "Share:" }));
      kids.push(stepper(function () { _fieldShare = Math.max(1, share - 1); EN.app.render(); }, function () { _fieldShare = Math.min(5, share + 1); EN.app.render(); }, share <= 1, share >= 5));
      kids.push(el("span.mono", { style: { fontSize: "12px", color: "var(--text2)" }, text: share + " FP" }));
      kids.push(el("button.btn.sm", { dataset: { fieldAnchor: "1" }, disabled: cur < share, title: cur < share ? "You need the FP on hand; Overdraw can't pay for it" : "Anchor the Field: spend " + share + " FP and lower your maximum by " + share,
        style: cur >= share ? { color: FP, borderColor: VIO } : null,
        onclick: function () { fset(function (fl) { var have = (fl.current != null) ? eng.clamp(fl.current, 0, d.flow.max) : d.flow.max; fl.fieldReserve = share; fl.current = Math.max(0, have - share); }); toast("Field anchored · maximum −" + share + " FP"); } }, "ANCHOR"));
      kids.push(el("button.btn.sm", { dataset: { fieldFailed: "1" }, disabled: cur < 5, title: "A failed anchoring spends the 5 FP, anchors nothing, and applies 1 Stage of Strain",
        onclick: function () { fset(function (fl, c) { var have = (fl.current != null) ? eng.clamp(fl.current, 0, d.flow.max) : d.flow.max; fl.current = Math.max(0, have - 5); eng.setStrainStage(c, Math.min(5, (fl.strain | 0) + 1)); }); toast("Anchoring failed · −5 FP · +1 Strain Stage"); } }, "FAILED (spend 5)"));
    }
    return el("div.row.wrap", { dataset: { field: "1" }, style: { gap: "6px", alignItems: "center", marginTop: "8px", padding: "6px 10px", border: "1px solid var(--border2)", borderRadius: "4px" } }, kids);
  }

  /* Ritual Recovery (The Ritual of Alignment): roll the Flow Dice Pool at the table, then log the
     result here. Each button applies its row of EN.flow.ritualRecovery.outcomes to the one Strain
     value: Flawless removes 2 Stages and restores 2d4 FP, Costly restores 1d4 FP and removes 1
     Stage, Mixed removes 1 Stage, Failure applies 1 Stage. While you're in Breakflow it does
     nothing ("Long Rests and Ritual Recovery work again once it ends"), so the row says so. */
  var RITUAL_FX = { Flawless: { strain: -2, fpDice: 2 }, Costly: { strain: -1, fpDice: 1 }, Mixed: { strain: -1, fpDice: 0 }, Failure: { strain: 1, fpDice: 0 } };
  function rollD4s(n) { var t = 0; for (var i = 0; i < n; i++) t += 1 + Math.floor(Math.random() * 4); return t; }
  function ritualRecoveryRow(ch, d, cur, stage) {
    var rr = EN.flow.ritualRecovery || {}, f = d.flow;
    var label = el("span", { style: { fontFamily: "var(--disp)", fontSize: "9.5px", letterSpacing: ".12em", color: VIO } }, [EN.ui.ruleLink("fl-recovery", "RITUAL RECOVERY")]);
    var box = { dataset: { ritual: "recovery" }, style: { gap: "6px", alignItems: "center", marginTop: "8px", padding: "6px 10px", border: "1px solid var(--border2)", borderRadius: "4px" } };
    if (f.inBreakflow) {
      return el("div.row.wrap", box, [label, el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: "While you're in Breakflow, only Breakflow Restoration or Rough Restoration lowers your Strain; Long Rests and Ritual Recovery work again once it ends." })]);
    }
    var btns = (rr.outcomes || []).map(function (o) {
      var fx = RITUAL_FX[o.result];
      if (!fx) return null;
      return el("button.btn.sm", { dataset: { ritualResult: o.result }, title: o.margin + ": " + o.text,
        onclick: function () {
          var gained = fx.fpDice ? rollD4s(fx.fpDice) : 0, now = 0;
          fset(function (fl, c) {
            var was = fl.strain | 0;
            now = Math.max(0, Math.min(5, was + fx.strain));
            fl.strain = now;
            if (now < was) fl.strainPoints = 0;
            if (now >= 5) { fl.breakflow = true; fl.sustained = null; fl.sustained2 = null; fl.fieldReserve = 0; }
            if (gained) { var have = (fl.current != null) ? eng.clamp(fl.current, 0, f.max) : f.max; fl.current = Math.min(f.max, have + gained); }
          });
          toast("Ritual Recovery, " + o.result + ": Strain Stage " + now + (gained ? " · +" + gained + " FP" : "") + ".");
        } }, o.result.toUpperCase());
    });
    return el("div.row.wrap", box, [label].concat(btns).concat([
      el("span.help", { style: { margin: 0, fontSize: "10.5px", flex: "1 1 160px" }, text: "Roll the Flow Dice Pool, then log the result. Once per 24 hours." })]));
  }

  /* ============================ SUSTAIN TRACKER ========================== */
  function sustainPanel(ch, d) {
    var cur = curFP(ch, d), kids = [];
    var keys = d.flow.sustainSlots >= 2 ? ["sustained", "sustained2"] : ["sustained"];
    var heldKeys = keys.filter(function (k) { return !!(ch.flow && ch.flow[k]); });
    heldKeys.forEach(function (k) {
      var s = ch.flow[k];
      kids.push(el("div.row.between.wrap", { dataset: { sustainSlot: k }, style: { alignItems: "baseline", marginTop: k === keys[0] ? "0" : "10px" } }, [
        el("div", null, [
          el("span", { style: { fontWeight: 600, fontSize: "14px", color: VIO }, text: s.effect || s.name }),
          s.resonance ? el("span.chip", { style: { marginLeft: "6px", fontSize: "9px", color: VIO, borderColor: VIO }, text: s.resonance }) : null
        ]),
        el("span.mono", { style: { fontSize: "11px", color: "var(--text3)" }, text: "1 FP / minute" })
      ]));
      kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
        el("button.btn.sm", { disabled: cur <= 0, title: cur <= 0 ? "No FP; sustaining at 0 FP is an Overdraw" : "Pay 1 FP for another minute",
          style: cur > 0 ? { color: FP, borderColor: VIO } : null,
          onclick: function () { fset(function (fl) { fl.current = Math.max(0, cur - 1); }); toast("Sustain upkeep · −1 FP"); } }, "UPKEEP −1 FP"),
        el("button.btn.sm", { title: "End the sustained effect", style: { color: "var(--text3)" }, onclick: function () { fset(function (fl) { fl[k] = null; }); toast("Sustained effect ended"); } }, "END")
      ]));
    });
    if (heldKeys.length) {
      // the capacity rule is EN.flow's (it used to be typed here), so the Codex reads the same words
      var cap = EN.flow.sustainCapacity;
      if (cap) kids.push(ruleNote("Capacity: " + cap.charAt(0).toLowerCase() + cap.slice(1) + (keys.length > 1 ? " Layered Force gives you two slots." : ""), null, { conditions: true }));
      // Stability Factor: taking damage while sustaining threatens the effect.
      var fdz = (EN.flow && EN.flow.focusDisruption) || null;
      if (fdz) kids.push(ruleNote("Focus Disruption: " + fdz.checkPoint + " " + fdz.dcNote + " " + fdz.failure, "var(--warn)"));
    } else {
      kids.push(noteP("No sustained effect. Build a Sustain Invocation and Channel it to hold one here."));
    }
    var sp = EN.ui.panel("Sustain", "UPKEEP · CAPACITY", kids, withCorners(headChip("fl-sustain", "Sustained Effects")));
    sp.classList.add("sustain-panel"); if (heldKeys.length) sp.classList.add("occupied"); return sp;
  }

  /* ========================= FREE-SHAPING BUILDER ======================== */
  function builderPanel(ch, d) {
    var F = EN.flow, R = normForm(ch, d);
    var inv = eng.flowInvocation(_form, d);
    var known = knownResKeys(ch, d);
    var rows = [];

    /* Laid out as the Visualize window's deck (4 Nov 2026, the author's brief): each step a labelled row,
       its choices one even grid of same-size keys (vseg, below), a Resonance key in its own colour, the
       scaling a stepper with its count, Precision a switch. Each label still opens its rule in the Codex. */
    var rcol = function (k) { return EN.flowViz && EN.flowViz.resColor ? EN.flowViz.resColor(k) : null; };
    function drow(label, anchor, nodes, data) {
      return el("div.fv-row", data ? { dataset: data } : null, [
        el("span.fv-lab", null, [anchor && label ? EN.ui.ruleLink(anchor, label) : label]),
        el("div.fv-row-b", null, nodes)]);
    }

    // Resonance (only the ones this Shaper knows are selectable). A Unique
    // Resonance belongs to one subclass and no other Shaper can learn, buy, or
    // steal it, so it is not listed at all for anyone else.
    rows.push(drow("RESONANCE", "fl-resonances/" + slug(R.name), [
      vseg(ownResonances(ch).map(function (r) {
        var isKnown = known.indexOf(r.key) !== -1;
        return { key: r.key, label: r.name, disabled: !isKnown, color: rcol(r.key),
                 title: isKnown ? r.focus + " · " + r.damage : (r.unlock > d.level ? "Eligible at Level " + r.unlock : "Not known; learn it in #PRINT") };
      }), function (k) { return _form.resonance === k; }, function (k) { setForm({ resonance: k }); }, "res", "res"),
      el("p.help.fv-desc", { text: R.focus + " · " + R.damage + (R.resolution === "save" ? " · resolves with a Flow Save DC" : " · Flow Attack vs Defense") + ". " + (R.base || "") })
    ]));

    // Intent and Force: one step, six printed rows (each sets the engine's intent + force pair)
    rows.push(drow("INTENT AND FORCE", "fl-shaping/intent-and-force", [
      vseg(F.costRows.map(function (r) {
        var locked = !!(r.minLevel > (d.level || 1) || (r.minLevel >= 5 && !d.flow.layeredForce));
        return { key: r.key, label: r.name, disabled: locked, title: locked ? "Level " + r.minLevel + " (Layered Force)" : r.desc };
      }), function (k) { var r = costRow(k); return !!r && _form.intent === r.intent && _form.force === r.force; },
      function (k) { var r = costRow(k); setForm({ intent: r.intent, force: r.force }); }, "three", "intent")], { flowRows: "1" }));

    // Delivery band + option
    var band = F.delivery.find(function (b) { return b.key === _form.deliveryBand; });
    rows.push(drow("DELIVERY", "fl-shaping/delivery", [
      vseg(F.delivery.map(function (b) { return { key: b.key, label: b.band, title: b.desc }; }),
        function (k) { return _form.deliveryBand === k; }, function (k) { var b = F.delivery.find(function (x) { return x.key === k; }); setForm({ deliveryBand: k, deliveryOption: b.options[0], precision: false, extraTargets: 0, extraSpaces: 0 }); }, "three", "band"),
      vseg(band.options.map(function (o) { return { key: o, label: o.replace(/ \([^)]*\)$/, "") }; }), function (k) { return _form.deliveryOption === k; }, function (k) { setForm({ deliveryOption: k }); }, "sub", "opt")
    ]));

    // Scaling + Precision
    var directed = _form.deliveryBand === "directed", nScale = directed ? _form.extraTargets : _form.extraSpaces;
    var scale = [el("div.fv-step", null, [
      el("span.fv-step-l", { text: directed ? "EXTRA TARGETS" : "EXTRA SPACES" }),
      stepper(function () { setForm(directed ? { extraTargets: Math.max(0, _form.extraTargets - 1) } : { extraSpaces: Math.max(0, _form.extraSpaces - 1) }); },
              function () { setForm(directed ? { extraTargets: _form.extraTargets + 1 } : { extraSpaces: _form.extraSpaces + 1 }); }, nScale <= 0),
      el("span.fv-step-n.mono", { text: String(nScale) })
    ])];
    if (!directed) {
      scale.push(el("button.btn.sm.fv-switch" + (_form.precision ? ".on.primary" : ""), { type: "button", role: "switch", "aria-checked": _form.precision ? "true" : "false", title: F.precisionShaping.desc,
        onclick: function () { setForm({ precision: !_form.precision }); } }, [el("span.fv-switch-k"), el("span.fv-switch-t", { text: "PRECISION" })]));
      scale.push(EN.ui.ruleChip("fl-shaping/precision-shaping", { title: "Precision Shaping" }));
    }
    rows.push(drow("SCALING", "fl-shaping/delivery", [el("div.fv-scale", null, scale)]));

    // Base effect picker (when Base Force carries an effect): the Resonance's own base options
    if (_form.force !== "empowered" && inv.hasEffect && (R.baseOptions || []).length) {
      rows.push(drow("EFFECT", "fl-resonances/" + slug(R.name), [
        vseg(R.baseOptions.map(function (e) { return { key: e.name, label: e.name, title: e.text }; }),
          function (k) { return _form.baseEffect === k; }, function (k) { setForm({ baseEffect: k }); }, "wrap", "base")], { flowEffect: "base" }));
    }
    // Empowered effect picker (when Empowered + an effect is carried)
    if (_form.force === "empowered" && inv.hasEffect && (R.empowered || []).length) {
      /* A level-gated effect (Poltergeist) prints its level on its label, as the Handbook does, and is
         disabled until the character reaches it. The anchor is the Codex's named-line slug, which takes
         the label with its level. */
      var effObj = R.empowered.filter(function (e) { return e.name === _form.empoweredEffect; })[0] || null;
      rows.push(drow("EFFECT", effObj ? "fl-resonances/" + slug(effectLabel(effObj)) : null, [
        vseg(R.empowered.map(function (e) {
          var locked = !!(e.unlock && e.unlock > (d.level || 1));
          return { key: e.name, label: effectLabel(e), disabled: locked, title: locked ? "Eligible at Level " + e.unlock + " (Hardware Harmonization)" : e.text };
        }), function (k) { return _form.empoweredEffect === k; }, function (k) { setForm({ empoweredEffect: k }); }, "wrap", "emp")], { flowEffect: "empowered" }));
    }

    // Layered Force (Level 5): layer a second Resonance onto the primary
    if (d.flow.layeredForce) {
      var Ly = _form.layer, lnodes = [];
      lnodes.push(vseg([{ key: "", label: "None" }].concat(ownResonances(ch).filter(function (r) { return known.indexOf(r.key) !== -1; }).map(function (r) { return { key: r.key, label: r.name, title: r.focus + " · " + r.damage, color: rcol(r.key) }; })),
        function (k) { return (Ly ? Ly.resonance : "") === k; },
        function (k) { setForm({ layer: k ? { resonance: k, force: "base", empoweredEffect: null, baseEffect: null } : null }); }, "res", "layer"));
      if (Ly) {
        var LRz = F.resonanceByKey[Ly.resonance];
        var lrows = ["base", "empowered"].map(function (fo) { var r = costRowFor(_form.intent, fo); return { key: fo, label: r.name, title: r.desc }; });
        var lrowSeg = vseg(lrows, function (k) { return Ly.force === k; }, function (k) { Ly.force = k; setForm({ layer: Ly }); }, "two", "lforce");
        lrowSeg.dataset.flowLayerRow = "1";
        lnodes.push(lrowSeg);
        if (inv.hasEffect && Ly.force !== "empowered" && (LRz.baseOptions || []).length) {
          lnodes.push(vseg(LRz.baseOptions.map(function (e) { return { key: e.name, label: e.name, title: e.text }; }), function (k) { return Ly.baseEffect === k; }, function (k) { Ly.baseEffect = k; setForm({ layer: Ly }); }, "wrap", "lbase"));
        }
        if (inv.hasEffect && Ly.force === "empowered" && (LRz.empowered || []).length) {
          lnodes.push(vseg(LRz.empowered.map(function (e) {
            var locked = !!(e.unlock && e.unlock > (d.level || 1));
            return { key: e.name, label: effectLabel(e), disabled: locked, title: locked ? "Eligible at Level " + e.unlock + " (Hardware Harmonization)" : e.text };
          }), function (k) { return Ly.empoweredEffect === k; }, function (k) { Ly.empoweredEffect = k; setForm({ layer: Ly }); }, "wrap", "lemp"));
        }
      }
      rows.push(drow("LAYER", "fl-advanced/layered-force", lnodes, { flowLayer: "1" }));
    }

    // Duration + target willingness
    rows.push(drow("DURATION", "fl-shaping/duration", [
      vseg(F.duration.map(function (du) { return { key: du.key, label: du.name, title: du.desc }; }), function (k) { return _form.duration === k; }, function (k) { setForm({ duration: k }); }, "two", "dur")]));
    rows.push(drow("TARGET", null, [
      vseg([{ key: true, label: "Unwilling" }, { key: false, label: "Willing / Object" }], function (k) { return _form.unwilling === k; }, function (k) { setForm({ unwilling: k }); }, "two", "tgt")]));
    rows = [el("div.fv-deck.fs-deck", null, rows)];

    // ---- live summary ----
    var cost = inv.fp, cur = curFP(ch, d), over = Math.max(0, cost - cur);
    var summary = [];
    summary.push(el("div.row.between.wrap", { style: { alignItems: "baseline" } }, [
      el("div.mono.flow-fp", { style: { fontSize: "30px", color: (over > 0 || inv.overCap) ? "var(--danger)" : FP }, html: cost + " <span style='font-size:13px;color:var(--text3)'>FP" + (inv.baseFp !== cost ? " · base " + inv.baseFp : "") + " · cap " + inv.cap + "</span>" }),
      inv.damageText ? el("div", { style: { textAlign: "right" } }, [
        el("div", { style: { fontFamily: "var(--disp)", fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)" }, text: "DAMAGE" }),
        EN.ui.damageText(el("span.mono.dmg-readout", { style: { fontSize: "18px", color: "var(--accent)" } }), inv.damageText)   // the Resonance's types as icons
      ]) : null
    ]));
    /* Size and shape: the chosen Delivery's own row of the Delivery table (what it reaches and its shape),
       with the extra spaces or targets bought on top of it */
    var delName = String(_form.deliveryOption || "").replace(/ \([^)]*\)$/, "");
    var delRow = (F.deliveryTable || []).filter(function (r) { return r.name === delName; })[0];
    if (delRow) {
      var grown = _form.deliveryBand === "directed"
        ? (_form.extraTargets ? " · +" + _form.extraTargets + " extra target" + (_form.extraTargets === 1 ? "" : "s") : "")
        : (_form.extraSpaces ? " · +" + _form.extraSpaces + " space" + (_form.extraSpaces === 1 ? "" : "s") + " to one dimension" : "");
      summary.push(el("p.help", { dataset: { flowDelivery: delRow.key }, style: { margin: "2px 0 6px", color: "var(--text2)", fontSize: "11.5px" }, text: delRow.name + ": " + delRow.reaches + grown }));
    }
    summary.push(noteP(_form.unwilling ? inv.resolutionText : "Automatic (willing target or object); no roll.", _form.unwilling ? "var(--text2)" : "var(--success)"));
    if (inv.baseEffect) summary.push(el("p.help", { dataset: { flowEffectLine: "base" }, style: { margin: "2px 0 6px", color: VIO, fontSize: "11.5px" }, text: "Effect: " + inv.baseEffect.name + " · " + inv.baseEffect.text }));
    if (inv.empoweredEffect) summary.push(noteP("Empowered: " + inv.empoweredEffect.name + " · " + inv.empoweredEffect.text, VIO));
    if (inv.layer) {
      var lyEff = inv.layer.empoweredEffect || inv.layer.baseEffect;
      summary.push(noteP("Layer: " + inv.layer.resonance.name + " · " + inv.layer.row.name + (lyEff ? " · " + lyEff.name + ": " + lyEff.text : "") + " (+" + inv.layer.fp + " FP with layering)", VIO));
      summary.push(noteP(inv.action + ". Layered Force.", "var(--text2)"));
    }
    if (_form.duration === "sustain") summary.push(inv.sustainable
      ? noteP("Sustain: +1 FP, holds it 1 minute (10 rounds); each extra minute costs 1 FP.", "var(--text2)")
      : ruleNote("This effect cannot be Sustained (see Sustain Compatibility).", "var(--warn)"));
    if (d.flow.snagInvoke && _form.unwilling && inv.resolution !== "none") summary.push(noteP(inv.resolution === "save" ? "Strain (Ripple+): targets roll their saves with Edge." : "Strain (Ripple+): roll this Invocation with Snag.", "var(--warn)"));
    (inv.warnings || []).forEach(function (w) { summary.push(ruleNote("⚠ " + w, "var(--warn)")); });
    // the order the author asked for (3 Nov 2026): VISUALIZE, CHANNEL, SAVE PATTERN
    summary.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
      EN.flowViz ? el("button.btn.sm" + (EN.flowViz.isOpen() ? ".primary" : ""), { dataset: { flowVisualize: "1" }, title: "Open a window that draws this Invocation: its reach and the size of its area, redrawn as you shape", style: EN.flowViz.isOpen() ? null : { color: VIO, borderColor: VIO },
        onclick: function () { EN.flowViz.toggle(); } }, [el("span.fv-eye", { "aria-hidden": "true", html: VIZ_ICON }), "VISUALIZE"]) : null,
      el("button.btn.sm.primary", { disabled: !!inv.overCap, title: inv.overCap ? "Over your cap (Caliber + Flow Modifier). Overdraw can't pay past it." : (over > 0 ? "Not enough FP; channeling will Overdraw " + over + " FP" : "Spend " + cost + " FP"),
        onclick: function () { doChannel(ch, d, inv, defaultName(R)); } }, over > 0 ? "CHANNEL · OVERDRAW " + over : "CHANNEL · " + cost + " FP"),
      el("button.btn.sm", { title: "Save this formulation as a Resonant Pattern", style: { color: VIO, borderColor: VIO }, onclick: function () { savePattern(R); } }, "✚ SAVE PATTERN")
    ]));
    rows.push(el("div.flow-result", { style: { marginTop: "12px", padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "4px", background: "rgba(123,44,255,.05)" } }, summary));

    var bp = EN.ui.panel("Free-Shaping", "ORDER OF SHAPING", rows, withCorners(headChip("fl-shaping", "The Order of Shaping")));
    bp.classList.add("builder");
    bp.style.setProperty("--fv-res", rcol(_form.resonance) || "var(--flow)");
    bp.style.setProperty("--fv-res2", rcol(_form.resonance) || "var(--flow)");
    var fxNow = _intensity === "auto" ? (d.flow.strainStage || 0) : (parseInt(_intensity, 10) || 0);
    bp.style.setProperty("--fv-pulse", String(1 + Math.max(0, Math.min(5, fxNow)) * 0.35));
    // the tab is rebuilt on every change: one clock keeps the deck's looping animations in step
    bp.style.setProperty("--fv-t", "-" + (Date.now() % 600000) + "ms");
    // the Visualize window redraws from the same form on every render (a no-op while it is closed)
    if (EN.flowViz) EN.flowViz.refresh({ ch: ch, d: d, form: JSON.parse(JSON.stringify(_form)), inv: inv,
      controls: EN.flowViz.isOpen() ? vizControls(ch, d, R, inv) : null,
      fx: _intensity === "auto" ? (d.flow.strainStage || 0) : (parseInt(_intensity, 10) || 0) });
    _vJust = null;   // the flash belongs to this one redraw (the window's deck, when open, has drawn by now too)
    return bp;
  }

  /* The Visualize window's controls: the SAME free-shaping form (every button writes _form through
     setForm and the tab re-renders), so you can keep shaping inside the window and watch it change.
     Laid out as a deck (3 Nov 2026, the author's brief: uniform, easy to read): each step a labelled
     row, its choices one even grid of same-size keys, a Resonance key carrying its own colour, the
     scaling a stepper with its count between the buttons, Precision a switch. The window's CSS
     (theme.css, "VISUALIZE WINDOW") draws it, Immersive included. */
  var _vJust = null;   // the key just pressed in either deck ("row:key"): only it flashes, not every chosen key on each redraw
  // the Visualize icon, the author's own vector (Art/App Icons/Visualize.svg), drawn in the button's colour
  var VIZ_ICON = '<svg viewBox="0 0 122.88 83.78" focusable="false"><path fill="currentColor" d="M95.73,10.81c10.53,7.09,19.6,17.37,26.48,29.86l0.67,1.22l-0.67,1.21c-6.88,12.49-15.96,22.77-26.48,29.86 C85.46,79.88,73.8,83.78,61.44,83.78c-12.36,0-24.02-3.9-34.28-10.81C16.62,65.87,7.55,55.59,0.67,43.1L0,41.89l0.67-1.22 c6.88-12.49,15.95-22.77,26.48-29.86C37.42,3.9,49.08,0,61.44,0C73.8,0,85.45,3.9,95.73,10.81L95.73,10.81z M60.79,22.17l4.08,0.39 c-1.45,2.18-2.31,4.82-2.31,7.67c0,7.48,5.86,13.54,13.1,13.54c2.32,0,4.5-0.62,6.39-1.72c0.03,0.47,0.05,0.94,0.05,1.42 c0,11.77-9.54,21.31-21.31,21.31c-11.77,0-21.31-9.54-21.31-21.31C39.48,31.71,49.02,22.17,60.79,22.17L60.79,22.17L60.79,22.17z M109,41.89c-5.5-9.66-12.61-17.6-20.79-23.11c-8.05-5.42-17.15-8.48-26.77-8.48c-9.61,0-18.71,3.06-26.76,8.48 c-8.18,5.51-15.29,13.45-20.8,23.11c5.5,9.66,12.62,17.6,20.8,23.1c8.05,5.42,17.15,8.48,26.76,8.48c9.62,0,18.71-3.06,26.77-8.48 C96.39,59.49,103.5,51.55,109,41.89L109,41.89z"/></svg>';
  function vseg(items, isOn, onPick, cls, rowId) {
    return el("div.fv-seg" + (cls ? "." + cls : ""), { role: "group" }, items.map(function (it) {
      var on = isOn(it.key), just = on && _vJust === rowId + ":" + it.key;
      var b = el("button.btn.sm.fv-opt" + (on ? ".on.primary" : "") + (just ? ".fv-just" : ""), { type: "button", disabled: !!it.disabled, title: it.title || "", "aria-pressed": on ? "true" : "false",
        onclick: function () { if (!it.disabled) { _vJust = rowId + ":" + it.key; onPick(it.key); } } }, [el("span.fv-opt-t", { text: it.label })]);
      if (it.color) b.style.setProperty("--rc", it.color);
      return b;
    }));
  }
  function vizControls(ch, d, R, inv) {
    var F = EN.flow, known = knownResKeys(ch, d), kids = [];
    var rc = function (k) { return EN.flowViz && EN.flowViz.resColor ? EN.flowViz.resColor(k) : null; };
    function row(label, node, extra) { kids.push(el("div.fv-row", null, [el("span.fv-lab", { text: label }), el("div.fv-row-b", null, [node].concat(extra || []))])); }
    var mine = ownResonances(ch).filter(function (r) { return known.indexOf(r.key) !== -1; });
    row("RESONANCE", vseg(mine.map(function (r) { return { key: r.key, label: r.name, title: r.focus + " · " + r.damage, color: rc(r.key) }; }),
      function (k) { return _form.resonance === k; }, function (k) { setForm({ resonance: k }); }, "res", "res"));
    row("INTENT", vseg(F.costRows.map(function (r) {
      var locked = !!(r.minLevel > (d.level || 1) || (r.minLevel >= 5 && !d.flow.layeredForce));
      return { key: r.key, label: r.name, disabled: locked, title: locked ? "Level " + r.minLevel + " (Layered Force)" : r.desc };
    }), function (k) { var r = costRow(k); return !!r && _form.intent === r.intent && _form.force === r.force; }, function (k) { var r = costRow(k); setForm({ intent: r.intent, force: r.force }); }, "three", "intent"));
    var band = F.delivery.find(function (b) { return b.key === _form.deliveryBand; });
    row("DELIVERY", vseg(F.delivery.map(function (b) { return { key: b.key, label: b.band, title: b.desc }; }),
      function (k) { return _form.deliveryBand === k; }, function (k) { var b = F.delivery.find(function (x) { return x.key === k; }); setForm({ deliveryBand: k, deliveryOption: b.options[0], precision: false, extraTargets: 0, extraSpaces: 0 }); }, "three", "band"),
      [vseg(band.options.map(function (o) { return { key: o, label: o.replace(/ \([^)]*\)$/, "") }; }), function (k) { return _form.deliveryOption === k; }, function (k) { setForm({ deliveryOption: k }); }, "sub", "opt")]);
    var directed = _form.deliveryBand === "directed", n = directed ? _form.extraTargets : _form.extraSpaces;
    var step = el("div.fv-step", null, [
      el("span.fv-step-l", { text: directed ? "EXTRA TARGETS" : "EXTRA SPACES" }),
      stepper(function () { setForm(directed ? { extraTargets: Math.max(0, _form.extraTargets - 1) } : { extraSpaces: Math.max(0, _form.extraSpaces - 1) }); },
              function () { setForm(directed ? { extraTargets: _form.extraTargets + 1 } : { extraSpaces: _form.extraSpaces + 1 }); }, n <= 0),
      el("span.fv-step-n.mono", { text: String(n) })
    ]);
    var sc = [step];
    if (!directed) sc.push(el("button.btn.sm.fv-switch" + (_form.precision ? ".on.primary" : ""), { type: "button", role: "switch", "aria-checked": _form.precision ? "true" : "false", title: F.precisionShaping.desc,
      onclick: function () { setForm({ precision: !_form.precision }); } }, [el("span.fv-switch-k"), el("span.fv-switch-t", { text: "PRECISION" })]));
    row("SCALING", el("div.fv-scale", null, sc));
    row("DURATION", vseg(F.duration.map(function (du) { return { key: du.key, label: du.name, title: du.desc }; }), function (k) { return _form.duration === k; }, function (k) { setForm({ duration: k }); }, "two", "dur"));
    if (d.flow.layeredForce) {
      var Ly = _form.layer;
      row("LAYER", vseg([{ key: "", label: "None" }].concat(mine.map(function (r) { return { key: r.key, label: r.name, color: rc(r.key) }; })),
        function (k) { return (Ly ? Ly.resonance : "") === k; }, function (k) { setForm({ layer: k ? { resonance: k, force: "base", empoweredEffect: null, baseEffect: null } : null }); }, "res", "layer"));
    }
    return el("div.fv-deck", { dataset: { fvCtl: "1" } }, kids);
  }

  // an Empowered Effect's label as the Handbook prints it: "Poltergeist (Level 3)"
  function effectLabel(e) { return e.name + (e.unlock ? " (Level " + e.unlock + ")" : ""); }
  function defaultName(R) {
    if (_form.empoweredEffect) return _form.empoweredEffect;
    if (_form.baseEffect) return R.name + " " + (_form.intent === "hybrid" ? "Hybrid " : "") + _form.baseEffect;
    var tail = _form.intent === "damage" ? "Strike" : _form.intent === "hybrid" ? "Hybrid" : "Shaping";
    return R.name + " " + tail;
  }
  function cloneForm() {
    return { name: _form.name, resonance: _form.resonance, intent: _form.intent, deliveryBand: _form.deliveryBand,
             deliveryOption: _form.deliveryOption, force: _form.force, duration: _form.duration, precision: _form.precision,
             extraTargets: _form.extraTargets, extraSpaces: _form.extraSpaces, empoweredEffect: _form.empoweredEffect, baseEffect: _form.baseEffect, unwilling: _form.unwilling,
             layer: _form.layer ? JSON.parse(JSON.stringify(_form.layer)) : null };
  }
  function loadForm(p) { loadFormSilent(p); EN.app.render(); }
  /* Sustain slots: one effect at a time, two from Layered Force (Level 5). A Layered Invocation held with
     Sustain fills one slot per held layer. When the slots are full, one of the Shaper's choice ends. */
  function askEnd(a, b) {
    try { return window.confirm("Both sustain slots are full. End " + (a && a.name) + " to hold the new effect? Cancel ends " + (b && b.name) + " instead.") ? "sustained" : "sustained2"; }
    catch (e) { return "sustained"; }
  }
  function doChannel(ch, d, inv, fallbackName) {
    var cur = curFP(ch, d), cost = inv.fp, over = Math.max(0, cost - cur), die = d.flow.overdrawDie;
    var nm = _form.name || (inv.empoweredEffect ? inv.empoweredEffect.name : fallbackName);
    var entries = [];
    if (_form.duration === "sustain" && !(ch.flow && ch.flow.breakflow)) {
      if (inv.sustainable) entries.push({ name: nm, resonance: inv.resonance ? inv.resonance.name : "", effect: inv.empoweredEffect ? inv.empoweredEffect.name : inv.baseEffect ? inv.baseEffect.name : nm });
      if (inv.layer && inv.heldCount > (inv.sustainable ? 1 : 0)) {
        var le = inv.layer.empoweredEffect || inv.layer.baseEffect;
        entries.push({ name: nm + " (layer)", resonance: inv.layer.resonance.name, effect: le ? le.name : nm });
      }
    }
    var keys = d.flow.sustainSlots >= 2 ? ["sustained", "sustained2"] : ["sustained"];
    var held = {}; keys.forEach(function (k) { held[k] = !!(ch.flow && ch.flow[k]); });
    var plan = entries.map(function (e) {
      var k = keys.filter(function (x) { return !held[x]; })[0];
      if (!k) { k = keys.length > 1 ? askEnd(ch.flow.sustained, ch.flow.sustained2) : keys[0]; }
      held[k] = true; return k;
    });
    fset(function (fl) {
      var have = (fl.current != null) ? eng.clamp(fl.current, 0, d.flow.max) : d.flow.max;
      fl.current = Math.max(0, have - cost);
      if (over > 0) bumpStrain(fl, over);
      if (!fl.breakflow) entries.forEach(function (e, i) { fl[plan[i]] = e; });
    });
    toast(over > 0 ? nm + " · OVERDRAW " + over + " FP · lose " + over + "d" + die + " Vitality" : nm + " · −" + cost + " FP");
  }
  function savePattern(R) {
    var entry = cloneForm(); entry.name = entry.name || defaultName(R);
    fset(function (fl) { fl.patterns = (fl.patterns || []).concat([entry]); });
    toast("Saved pattern: " + entry.name);
  }

  /* =========================== RESONANT PATTERNS ========================= */
  function patternRow(ch, d, p, idx, premade) {
    var inv = eng.flowInvocation(p, d), cur = curFP(ch, d), over = Math.max(0, inv.fp - cur);
    var R = EN.flow.resonanceByKey[p.resonance];
    var sub = (R ? R.name : p.resonance) + " · " + p.deliveryOption + " · " + ((costRowFor(p.intent, p.force) || {}).name || (p.force === "empowered" ? "Empowered" : "Base")) +
      (inv.baseEffect ? " · " + inv.baseEffect.name : "") + (inv.layer ? " · Layered" : "") + (p.duration === "sustain" ? " · Sustain" : "");
    var nameEl = premade
      ? el("span", { style: { fontWeight: 600, fontSize: "13px" }, text: p.name })
      : el("input", { type: "text", value: p.name || "", placeholder: "pattern name…", style: { fontWeight: 600, fontSize: "13px", flex: "1 1 140px", minWidth: "120px" },
          oninput: function () { var v = this.value; fset(function (fl) { if (fl.patterns[idx]) fl.patterns[idx].name = v; }, true); } });
    // A pattern can carry a level gate (Layered Force needs Level 5); show it, and
    // flag it red once we know the character cannot legally build it yet.
    var gated = p.minLevel && (d.level || 1) < p.minLevel;
    var right = el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
      p.minLevel ? el("span.chip", { title: p.gateNote || ("Requires Level " + p.minLevel),
        style: { fontSize: "9px", color: gated ? "var(--danger)" : "var(--text3)", borderColor: gated ? "var(--danger)" : "var(--border2)" },
        text: "LVL " + p.minLevel + (gated ? " ✕" : "") }) : null,
      el("span.chip", { style: { fontSize: "9px", color: over > 0 ? "var(--danger)" : FP, borderColor: over > 0 ? "var(--danger)" : VIO }, text: inv.fp + " FP" }),
      inv.damageText ? EN.ui.damageText(el("span.chip.dmg-readout", { style: { fontSize: "9px", color: "var(--accent)", borderColor: "var(--accent)" } }), inv.damageText) : null,
      el("button.btn.sm", { title: "Load this formulation into the builder", style: { color: "var(--text2)" }, onclick: function () { loadForm(p); toast("Loaded " + p.name + " into Free-Shaping"); } }, "LOAD"),
      premade
        ? el("button.btn.sm", { title: "Copy to your saved patterns", style: { color: VIO, borderColor: VIO }, onclick: function () { var e = {}; Object.keys(p).forEach(function (k) { e[k] = p[k]; }); fset(function (fl) { fl.patterns = (fl.patterns || []).concat([e]); }); toast("Saved " + p.name); } }, "✚ SAVE")
        : el("button.btn.sm", { title: "Delete this pattern", style: { color: "var(--text3)" }, onclick: function () { fset(function (fl) { fl.patterns.splice(idx, 1); }); } }, "✕"),
      el("button.btn.sm.primary", { disabled: !!inv.overCap, title: inv.overCap ? "Over your cap (Caliber + Flow Modifier). Overdraw can't pay past it." : (over > 0 ? "Invoke · Overdraw " + over + " FP" : "Invoke · spend " + inv.fp + " FP"),
        onclick: function () { loadFormSilent(p); doChannel(ch, d, inv, p.name); } }, over > 0 ? "OVERDRAW" : "INVOKE")
    ]);
    return el("div", { style: { padding: "8px 4px", borderBottom: "1px solid rgba(35,48,68,.4)" } }, [
      el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [nameEl, right]),
      el("div.row.between.wrap", { style: { marginTop: "3px" } }, [
        el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: sub }),
        el("span.help", { style: { margin: 0, fontSize: "10.5px", color: "var(--text2)" }, text: _formResolution(p, d) })
      ]),
      // a premade's own printed line (Flash-Freeze Zone's "Resolution: No roll..."), carried along when it is saved
      p.note ? el("p.help.pattern-note", { style: { margin: "3px 0 0", fontSize: "10.5px", color: "var(--text3)" }, text: p.note }) : null
    ]);
  }
  // resolution text for a saved pattern without disturbing the live builder form
  function _formResolution(p, d) { var inv = eng.flowInvocation(p, d); return p.unwilling === false ? "Automatic" : inv.resolutionText; }
  // set the form fields silently (no render) so a list RUN channels that pattern's cost
  function loadFormSilent(p) {
    Object.keys(_form).forEach(function (k) { if (p[k] !== undefined) _form[k] = p[k]; });
    if (p.unwilling === undefined) _form.unwilling = true;
    _form.layer = p.layer ? JSON.parse(JSON.stringify(p.layer)) : null;   // a pattern with no layer is unlayered
    if (p.baseEffect === undefined) _form.baseEffect = null;   // a pattern saved before the picker: the builder offers the first
  }

  // Saved Resonant Patterns as embeddable rows (no panel chrome, no premade list).
  // Shared by the Flow tab and the Freelancer dashboard so INVOKE works in both.
  function myPatternsInline(ch, d) {
    var saved = (ch.flow && ch.flow.patterns) || [];
    if (!saved.length) return noteP("No saved patterns yet. Build one in the Flow tab's Free-Shaping and hit SAVE.");
    return el("div", null, saved.map(function (p, i) { return patternRow(ch, d, p, i, false); }));
  }

  function patternsPanel(ch, d) {
    var saved = (ch.flow && ch.flow.patterns) || [], rows = [];
    rows.push(el("div.section-title", null, [document.createTextNode("My Patterns"), el("span.line"),
      el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", marginLeft: "6px" }, text: saved.length + " saved" })]));
    rows.push(myPatternsInline(ch, d));
    collapsible("flow-premade", "Premade Templates", function () {
      return el("div", null, [noteP(EN.flow.premadeNote, "var(--text2)")].concat((EN.flow.premadePatterns || []).map(function (p) { return patternRow(ch, d, p, -1, true); })));
    }).forEach(function (n) { rows.push(n); });
    var pp = EN.ui.panel("Resonant Patterns", "SAVED FORMULATIONS", rows, { corners: true });
    pp.classList.add("flow-patterns"); return pp;
  }

  /* ============================== REFERENCE ==============================
     The Flow rules moved to the Codex's chapter The Flow (js/codex_flow.js). This panel
     used to carry them, and it draws for an attuned Shaper alone, so a GM or an Unattuned
     player could never read them; the Codex reads to everyone, from the same EN.flow. What
     stays here is a pointer, one link per Codex panel, each of which peeks the rule in
     place without leaving the tab. */
  var REF_LINKS = [
    ["fl-core", "Core Concepts & Formulas"], ["fl-shaping", "The Order of Shaping"], ["fl-resonances", "Resonances"],
    ["fl-sustain", "Sustained Effects"], ["fl-strain", "The Strain Track"], ["fl-overdraw", "Overdraw"],
    ["fl-breakflow", "Breakflow & Restoration"], ["fl-recovery", "Ritual Recovery"],
    ["fl-advanced", "Advanced Techniques"],
    ["fl-dist", "Flow Disturbances"]
  ];
  /* ruleLink falls back to a text node when codex.js did not load or an anchor does not
     resolve; `live` counts the ones that came back as real links, so the note above them
     only says "tap one" when there is something to tap. */
  function refLinks() {
    var row = el("div.row.wrap.flow-ref-links", { style: { gap: "6px 14px", fontSize: "12.5px" } });
    row.live = 0;
    REF_LINKS.forEach(function (r) {
      var a = EN.ui.ruleLink(r[0], r[1]);
      if (a && a.nodeType === 1) row.live++;
      row.appendChild(el("span", null, [a]));
    });
    return row;
  }
  function referencePanel() {
    var links = refLinks();
    var fp = EN.ui.panel("Flow Reference", "RULES · IN THE CODEX", [
      noteP(links.live
        ? "The Flow rules live in the Codex, chapter The Flow. Tap one to read it here."
        : "The Flow rules live in the Codex, chapter The Flow. The Codex did not load, so they cannot open here.", "var(--text2)"),
      links
    ], { corners: true });
    fp.classList.add("flow-reference"); return fp;
  }

  /* The compliance tip line never actually works. Pressing REPORT opens an
     uplink modal whose progress bar climbs to a random 50-75%, stalls, and
     then fails one of three ways (a Codebreaker cutting the wire, a Nixie
     swarm eating the packets, or #FLAG being down for maintenance). Every
     path ends the same: the report is never delivered. */
  var REPORT_FAILS = [
    { hack: true },   // the Codebreaker: glitches and rewrites itself as a message (hackFail)
    { head: "UNKNOWN FAULT · 0x6E??", swarm: true,
      body: "The uplink opened from the outside and went quiet. #FLAG logs no source and no fault code it can match. There is no record this transmission was ever made." },
    { head: "#FLAG UNAVAILABLE",
      body: "Tip line #FLAG is down for scheduled maintenance. Please hold. Your vigilance is important to us. Estimated wait: indefinite." }
  ];
  // canned messages the intercepting Codebreaker leaves behind: some framed as a
  // favor for stopping the tip, some as a threat for sending it at all.
  var HACK_MSGS = [
    { from: "NULLJACK", text: "You almost handed the Bureau a live one. I folded your uplink before it cleared the relay. Call it a favor. Do not make me spend another one on you." },
    { from: "a friend you do not have", text: "That tip files a person into a cell or a coffin. I ate it at the relay. Nobody will ever know you reached. Go home." },
    { from: "GHOST // #FLAG", text: "I watched you trade a life for a bounty. I have your deck ID, your handle, and the room you are sitting in. Reach for #FLAG again and the next signal to drop will be yours." },
    { from: "UNKNOWN NODE", text: "Cute. Filing tips for Glimmer. I traced the uplink back before it went dark, so now I know exactly who you are. This is the only warning the wire gives." }
  ];
  function reducedMotion() { try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  // scramble el's text through a glitchy charset, then land on finalText
  function glitchText(node, finalText, opts) {
    opts = opts || {};
    if (reducedMotion()) { node.textContent = finalText; return; }
    var charset = "!<>-_\\/[]{}=+*^?#01ABCDEF▓▒░", dur = opts.dur || 600, stutter = !!opts.stutter, start = null;
    function frame(ts) {
      if (!node.isConnected) return;
      if (start == null) start = ts;
      var t = ts - start, pct = Math.min(1, t / dur), lock = Math.floor(pct * finalText.length * (stutter ? 1.3 : 1.12)), out = "";
      for (var i = 0; i < finalText.length; i++) {
        if (finalText[i] === " ") { out += " "; continue; }
        var on = i < lock; if (on && stutter && Math.random() < 0.05 && pct < 0.9) on = false;
        out += on ? finalText[i] : charset[Math.floor(Math.random() * charset.length)];
      }
      node.textContent = out;
      if (t < dur) requestAnimationFrame(frame); else node.textContent = finalText;
    }
    requestAnimationFrame(frame);
  }
  function reportTransmission() {
    var old = document.getElementById("flag-uplink"); if (old) old.remove();
    var raf = 0;
    var fill = el("div", { style: { width: "0%", height: "100%", borderRadius: "5px",
      background: "linear-gradient(90deg, var(--warn), var(--gold))", boxShadow: "0 0 10px var(--warn)", transition: "background .25s, box-shadow .25s" } });
    var track = el("div", { style: { height: "12px", background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: "6px", overflow: "hidden", marginTop: "14px" } }, [fill]);
    var head = el("div", { style: { fontFamily: "var(--disp)", fontWeight: 700, fontSize: "17px", letterSpacing: ".04em", color: "var(--text)" }, text: "TRANSMITTING TIP" });
    var body = el("p", { style: { margin: "4px 0 0", fontSize: "12.5px", color: "var(--text2)", lineHeight: 1.5, minHeight: "52px" },
      text: "Establishing secure uplink to compliance tip line #FLAG. Do not close this window. Your report is being routed." });
    var result = el("div.mono", { style: { fontSize: "10.5px", letterSpacing: ".1em", color: "var(--text4)", marginTop: "10px", minHeight: "13px" }, text: "" });
    var pct = el("span.mono", { style: { fontSize: "11px", color: "var(--text3)" }, text: "0%" });
    var closeBtn = el("button.btn.sm", { style: { color: "var(--text3)" }, onclick: close }, "CANCEL");
    var kicker = el("div.mono", { style: { fontSize: "10px", letterSpacing: ".22em", color: "var(--warn)" }, text: "// RESONANCE COMPLIANCE · SECURE UPLINK" });
    var card = el("div", { style: { width: "min(440px, 94vw)", position: "relative", overflow: "hidden", borderRadius: "8px",
      background: "linear-gradient(180deg, var(--bg2), var(--bg1))", border: "1px solid var(--warn)",
      boxShadow: "0 20px 60px rgba(0,0,0,.6), 0 0 40px rgba(255,179,64,.12)" } }, [
      el("div", { style: { height: "6px", background: "repeating-linear-gradient(45deg, var(--warn) 0 10px, #0a0e14 10px 20px)", opacity: .8 } }),
      el("div", { style: { padding: "16px 20px 16px" } }, [
        kicker,
        el("div", { style: { marginTop: "6px" } }, [head, body, track, result]),
        el("div.row.between", { style: { alignItems: "center", marginTop: "14px" } }, [pct, closeBtn])
      ])
    ]);
    var overlay = el("div#flag-uplink", { style: { position: "fixed", inset: "0", zIndex: "5000", background: "rgba(4,7,11,.74)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
      onclick: function (e) { if (e.target === overlay) close(); } }, [card]);
    function onKey(e) { if (e.key === "Escape") close(); }
    function close() { if (raf) cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);

    var target = 50 + Math.floor(Math.random() * 26);   // stalls somewhere in 50-75%
    var start = null, dur = 1700;
    function frame(ts) {
      if (start == null) start = ts;
      var t = Math.min(1, (ts - start) / dur), eased = 1 - Math.pow(1 - t, 2);
      var v = eased * target;
      fill.style.width = v + "%"; pct.textContent = Math.round(v) + "%";
      if (t < 1) raf = requestAnimationFrame(frame);
      else { raf = 0; setTimeout(fail, 480); }
    }
    raf = requestAnimationFrame(frame);

    function fail() {
      var ev = REPORT_FAILS[Math.floor(Math.random() * REPORT_FAILS.length)];
      closeBtn.textContent = "DISMISS"; closeBtn.className = "btn sm primary"; closeBtn.style.color = "";
      if (ev.hack) { hackFail(); return; }
      card.style.borderColor = "var(--danger)";
      fill.style.background = "linear-gradient(90deg, var(--danger), var(--ember))";
      fill.style.boxShadow = "0 0 12px var(--danger)";
      head.textContent = ev.head; head.style.color = "var(--danger)";
      body.textContent = ev.body;
      result.textContent = "REPORT NOT DELIVERED · NO BOUNTY CREDITED"; result.style.color = "var(--danger)";
      pct.textContent = "FAILED"; pct.style.color = "var(--danger)";
      if (ev.swarm) {
        // the mysterious one: tracer pin-lights run the border at variable
        // speeds and the whole modal wobbles until dismissed (see theme.css).
        card.classList.add("uplink-swarmed");
        ["b1", "b2", "b3", "b4"].forEach(function (c) { card.insertAdjacentHTML("beforeend", '<i class="uplink-beam ' + c + '"></i>'); });
      } else if (card.animate) {
        card.animate([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(4px)" }, { transform: "translateX(-2px)" }, { transform: "translateX(0)" }], { duration: 300 });
      }
    }
    // the Codebreaker branch: a one-shot glitch cascade tears the modal, then its
    // text is rewritten as a message from whoever intercepted the tip. The card
    // keeps a residual glitch (theme.css) and holds until DISMISS.
    function hackFail() {
      var m = HACK_MSGS[Math.floor(Math.random() * HACK_MSGS.length)];
      card.style.borderColor = "var(--accent)";
      fill.style.background = "linear-gradient(90deg, var(--accent), var(--flow))";
      fill.style.boxShadow = "0 0 12px var(--accent)";
      pct.textContent = "//"; pct.style.color = "var(--accent)";
      head.style.color = "var(--accent)";
      card.classList.add("uplink-hacked");
      if (!reducedMotion() && card.animate) card.animate([
        { transform: "translate(0,0)", clipPath: "inset(0 0 0 0)" },
        { transform: "translate(-4px,2px) skewX(1deg)" },
        { transform: "translate(5px,-2px) skewX(-1.2deg)", clipPath: "inset(0 0 55% 0)" },
        { transform: "translate(-6px,1px)", clipPath: "inset(45% 0 0 0)" },
        { transform: "translate(4px,0)", clipPath: "inset(0 0 0 0)" },
        { transform: "translate(-2px,1px) skewX(.6deg)" }, { transform: "translate(2px,-1px)" },
        { transform: "translate(0,0)", clipPath: "inset(0 0 0 0)" }
      ], { duration: 900, easing: "ease-out" });
      glitchText(kicker, "// UPLINK HIJACKED · SOURCE UNKNOWN", { dur: 520 });
      glitchText(head, m.from, { dur: 640 });
      result.textContent = ""; result.style.color = "var(--text3)";
      setTimeout(function () { glitchText(body, m.text, { dur: 1050, stutter: true }); }, 260);
      setTimeout(function () { glitchText(result, "// the report never left this deck.", { dur: 640 }); }, 780);
    }
  }

  /* ===================== UNATTUNED (non-Shaper) ==========================
     Non-Shapers do not get a Flow interface. Instead they get the Bureau of
     Resonance Compliance's public-service propaganda: a "see something, say
     something" advisory about reporting unregistered Shapers. The actual game
     mechanics stay barebones, tucked into a small secondary panel below. */
  function unattunedPanel(ch, d) {
    var awareness = (d.skills || []).find(function (s) { return s.key === "awareness"; });
    var stamp = el("span", { style: { position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%) rotate(-11deg)",
      fontFamily: "var(--disp)", fontWeight: 700, fontSize: "13px", letterSpacing: ".2em", color: "var(--danger)", opacity: .5,
      border: "2px solid var(--danger)", borderRadius: "4px", padding: "5px 9px", textAlign: "center", lineHeight: 1.05, pointerEvents: "none" },
      html: "COMPLIANCE<br><span style='font-size:8px;letter-spacing:.12em;opacity:.9'>MANDATORY POSTING</span>" });

    /* The wash is two translucent layers over an OPAQUE ground, not a fade to transparent. It
       used to end at transparent, which was fine while the only thing behind it was the page,
       and stopped being fine on a '98 desktop wearing a wallpaper: the picture came straight
       through the poster and the copy sat on it. --panel-solid is the opaque panel material, which
       on '98 is the Windows button face the windows under it are made of, so the notice reads as
       posted on the same stock rather than floating over the desktop. (Not --bg1: that is the
       panel ground on Classic and #GRIDroid but one step too dark on '98, where it dropped the
       amber kicker to 2.35:1 against 3.56:1 here.) */
    var banner = el("div", { style: { position: "relative", overflow: "hidden", borderRadius: "6px", marginBottom: "14px",
      border: "1px solid var(--warn)", background: "linear-gradient(180deg, rgba(255,179,64,.10), rgba(255,77,94,.04) 60%, transparent), var(--panel-solid)" } }, [
      el("div", { style: { height: "8px", background: "repeating-linear-gradient(45deg, var(--warn) 0 12px, #0a0e14 12px 24px)", opacity: .8 } }),
      el("div", { style: { padding: "16px 18px" } }, [
        el("div.mono", { style: { fontSize: "10px", letterSpacing: ".22em", color: "var(--warn)" }, text: "// RESONANCE COMPLIANCE ADVISORY" }),
        el("div", { style: { fontFamily: "var(--disp)", fontWeight: 700, fontSize: "30px", letterSpacing: ".02em", color: "var(--text)", lineHeight: 1.05, margin: "4px 0 6px", textShadow: "0 0 18px rgba(255,77,94,.35)" }, text: "SEE SOMETHING. SAY SOMETHING." }),
        el("p", { style: { margin: 0, maxWidth: "560px", fontSize: "13px", color: "var(--text2)", lineHeight: 1.5 }, text: "An unregistered Shaper is an unlicensed hazard. Report resonance anomalies before they report you to the morgue." }),
        stamp
      ])
    ]);

    var signs = ["Objects that move, freeze, or ignite with no hand on them.",
      "Cyberware and cameras failing in a tight circle around one person.",
      "Wounds that knit too fast. Fear that lands a half-second early.",
      "A face the #GRID keeps losing, a name the registry never had.",
      "Ozone in a room with nothing plugged in."
    ].map(function (s) {
      return el("div.row", { style: { gap: "8px", alignItems: "baseline", margin: "3px 0" } }, [
        el("span", { style: { color: "var(--warn)", fontFamily: "var(--mono)", flex: "0 0 auto" }, text: "▸" }),
        el("span", { style: { fontSize: "12.5px", color: "var(--text2)", lineHeight: 1.4 }, text: s })
      ]);
    });

    var notice = EN.ui.panel("Public Notice", "BUREAU OF RESONANCE COMPLIANCE", [
      noteP("The Flow does not respect zoning. One unlicensed resonance event can drop a tenement, brick a block of chrome, or stop a heart from across the room. Registered Shapers file their frequencies with the Bureau. The unregistered file nothing. That is the whole difference between an accident and a crime.", "var(--text2)"),
      noteP("Reporting is fast, anonymous, and rewarded. Flag a verified unregistered Shaper and the Bureau credits your account in Glimmer, no questions logged. Vigilance is its own protection.", "var(--text2)"),
      el("div.section-title", null, [document.createTextNode("Know the Signs"), el("span.line")]),
      el("div", null, signs),
      el("div.row.wrap", { style: { gap: "10px", alignItems: "center", marginTop: "12px" } }, [
        el("button.btn.sm", { style: { color: "var(--danger)", borderColor: "var(--danger)" },
          onclick: reportTransmission }, "⚑ REPORT A RESONANCE ANOMALY"),
        el("span.mono", { style: { fontSize: "10.5px", color: "var(--text3)", letterSpacing: ".06em" }, text: "TIP LINE // dial #FLAG on any registered deck · paid in Glimmer" })
      ]),
      noteP("Filing a false report is a Class-2 civic offense. Harboring an unregistered Shaper carries the sentence of being one.", "var(--text4)")
    ], { corners: true });

    var status = EN.ui.panel("Unattuned", "NO FLOW CONNECTION", [
      noteP("Your class runs on grit, chrome, and gunpowder, not resonance. You have 0 Flow Points and cannot cast Invocations, join cooperative channeling, or spend FP. You also never risk Overdraw."),
      noteP("Defending against the Flow: when targeted by an Enemy Invocation, roll the saving throw attribute it dictates (for example an Agility Save to dodge a Kinetic blast)."),
      // the Unattuned rule is the Basics primer's; the whole Flow chapter reads to every player
      el("p.help", { style: { margin: "2px 0 6px", color: "var(--text3)", fontSize: "11.5px" } },
        ["In the Codex: ", EN.ui.ruleLink("bx-flow", "The Flow primer"), " · ", EN.ui.ruleLink("fl-core", "the Flow chapter")]),
      awareness ? el("div.row.wrap", { style: { gap: "10px", alignItems: "center", marginTop: "6px" } }, [
        el("span", { style: { fontFamily: "var(--disp)", fontSize: "9.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "AWARENESS" }),
        el("span.mono", { style: { fontSize: "16px", color: "var(--accent)" }, text: eng.fmtMod(awareness.total) }),
        // the anomalies are the Flow chapter's Flow Disturbances; reading them is Detecting and Analyzing
        el("span.help", { style: { margin: 0 } }, [
          document.createTextNode("Mystique-based: sense unseen forces, detect an Enemy shaping the Flow, and "),
          EN.ui.ruleLink("fl-dist-detect", "read resonance anomalies"),
          document.createTextNode(" before you walk into them.")
        ])
      ]) : null
    ], { corners: true });

    return el("div", null, [banner, notice, el("div", { style: { marginTop: "14px" } }, [status])]);
  }

  /* ================================ RENDER =============================== */
  function render(mount) {
    var ch = store.active();
    EN.ui.clear(mount);
    if (!ch) { mount.appendChild(el("p.help", { text: "No Freelancer loaded." })); return; }
    var d = eng.derive(ch);
    var blocks = [];
    blocks.push(el("div", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", margin: "0 0 2px", letterSpacing: ".04em" }, html: "THE <span style='color:var(--flow)'>FLOW</span> <span style='font-family:var(--disp);font-size:12px;color:var(--text3);letter-spacing:.18em'>// RESERVOIR · INVOCATIONS · STRAIN</span>" }),
      el("p.help", { style: { margin: 0, maxWidth: "820px" }, text: "The current under everything. Shape it by leaning your attention against it until it bends." })
    ]));

    // Non-Shaper (Unattuned) view never gets the immersive layer.
    if (!d.flow) { blocks.push(unattunedPanel(ch, d)); mount.appendChild(el("div", null, blocks)); return; }

    blocks.push(el("div.modgrid6", { style: { marginBottom: "0" } }, [
      el("div", { style: { gridColumn: "span 3", minWidth: 0, display: "flex", flexDirection: "column", gap: "14px" } }, [reservoirPanel(ch, d), sustainPanel(ch, d)]),
      el("div", { style: { gridColumn: "span 3", minWidth: 0 } }, [builderPanel(ch, d)])
    ]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [patternsPanel(ch, d)]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [referencePanel()]));

    // Immersive layer: wrap in .flowtab(.immersive) and set the escalation level.
    // fx follows the live Strain stage on "auto", or a pinned 1-5 from the setting.
    var imm = isImmersive();
    var fx = imm ? (_intensity === "auto" ? (d.flow.strainStage || 0) : (parseInt(_intensity, 10) || 0)) : 0;
    // .attuned: the gentle always-on flow-color pulse for Shapers (baseline when
    // Immersive is off; the richer Immersive layer supersedes it when on).
    var root = el("div.flowtab.attuned" + (imm ? ".immersive" : ""), { dataset: { fx: String(fx) } }, blocks);
    if (imm) {
      root.insertBefore(el("div.flow-glitch"), root.firstChild);
      root.insertBefore(el("div.flow-bg"), root.firstChild);   // both sit behind (z-index in CSS)
    }
    mount.appendChild(root);
    if (imm) {                                                 // two running pin-lights per panel
      [].slice.call(root.querySelectorAll(".panel")).forEach(function (p) {
        p.insertAdjacentHTML("beforeend", '<i class="beam"></i><i class="beam b2"></i>');
      });
    }
  }

  return { render: render, myPatternsInline: myPatternsInline,
           isImmersive: isImmersive, setImmersive: setImmersive, getIntensity: getIntensity, setIntensity: setIntensity };
})();
