/* ===========================================================================
   ELYSIUM NIGHTS · Flow tab
   For Shapers: the Reservoir + Strain + Breakflow tracker, a Free-Shaping
   (Order of Shaping) Invocation calculator, a Sustain tracker, and a saved
   Resonant Pattern log. Unattuned classes get a short status panel instead.
   Flow state persists on ch.flow; the builder form is transient module state.
   =========================================================================== */
window.EN = window.EN || {};

EN.flowView = (function () {
  var el = EN.ui.el, toast = EN.ui.toast, store = EN.store, eng = EN.engine;
  var FP = "var(--fp)";        // arc-violet, shared with the Freelancer FP bar
  var VIO = "var(--flow)";     // resonance accent

  // transient builder formulation (not persisted until Saved as a Pattern)
  var _form = { name: null, resonance: "kinetic", intent: "damage", deliveryBand: "directed",
                deliveryOption: "Remote", force: "base", duration: "instant", precision: false,
                extraTargets: 0, extraSpaces: 0, empoweredEffect: null, unwilling: true };
  var _open = {};              // collapse state for reference sections
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
  function fset(mut, silent) { store.update(function (c) { c.flow = c.flow || {}; mut(c.flow, c); }, silent ? { silent: true } : undefined); }
  function noteP(t, color) { return el("p.help", { style: { margin: "2px 0 6px", color: color || "var(--text3)", fontSize: "11.5px" }, text: t }); }
  function bar(cur, max, color) {
    var pct = max > 0 ? Math.max(0, Math.min(100, cur / max * 100)) : 0;
    return el("div.flow-bar", { style: { height: "11px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", margin: "5px 0 2px" } },
      [el("div.flow-bar-fill", { style: { width: pct + "%", height: "100%", background: color, boxShadow: "0 0 8px " + color, transition: "width .2s" } })]);
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
  function fieldLabel(t) { return el("span", { style: { fontFamily: "var(--disp)", fontSize: "9.5px", letterSpacing: ".12em", color: "var(--text3)", minWidth: "72px", display: "inline-block" }, text: t }); }
  function curFP(ch, d) { var c = (ch.flow && ch.flow.current != null) ? ch.flow.current : d.flow.max; return eng.clamp(c, 0, d.flow.max); }
  function collapsible(key, title, build) {
    var open = !!_open[key];
    var head = el("div.section-title.clickable", { style: { margin: "12px 0 4px" }, onclick: function () { _open[key] = !open; EN.app.render(); } },
      [document.createTextNode(title), el("span.line"), el("span.collapse-caret", { style: { marginLeft: "4px" }, text: open ? "▾" : "▸" })]);
    return open ? [head, build()] : [head];
  }

  // accumulate Overdraw strain points; 3 points = +1 Stage, Stage 5 = Breakflow
  function bumpStrain(fl, pts) {
    fl.strainPoints = (fl.strainPoints || 0) + pts;
    var stage = fl.strain || 0;
    while (fl.strainPoints >= 3 && stage < 5) { stage++; fl.strainPoints -= 3; }
    fl.strain = Math.min(5, stage);
    if (fl.strain >= 5) { fl.breakflow = true; fl.sustained = null; }
  }

  // Resonances this Shaper actually knows. If the character recorded picks in
  // #PRINT, use those; otherwise (legacy build) fall back to everything unlocked
  // by level so older Shapers keep working.
  function knownResKeys(ch, d) {
    var rec = (ch && ch.resonances) || [];
    if (rec.length) return rec.slice();
    return EN.flow.resonances.filter(function (r) { return r.unlock <= d.level; }).map(function (r) { return r.key; });
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
      if (names.indexOf(_form.empoweredEffect) === -1) _form.empoweredEffect = names[0] || null;
    } else { _form.empoweredEffect = null; }
    return R;
  }

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
    kids.push(noteP("Reservoir = (Caliber x 3) + Flow Modifier. Flow Attack " + eng.fmtMod(f.attackBonus) + " vs Defense · Flow Save DC " + f.dc + " (" + f.attributeName + ")."));

    // Strain track: 5 stages, click to set (toggles to N-1 if already at N)
    kids.push(el("div.section-title", { style: { margin: "12px 0 4px" } }, [document.createTextNode("Strain"), el("span.line")]));
    var STC = ["var(--success)", "var(--warn)", "var(--warn)", "var(--ember)", "var(--danger)", "var(--danger)"];
    var cells = (EN.flow.strainTrack).map(function (s) {
      var on = stage >= s.stage, col = STC[s.stage];
      return el("button", { title: s.name + ": " + s.penalty,
        onclick: function () { fset(function (fl) { var ns = (fl.strain === s.stage) ? s.stage - 1 : s.stage; fl.strain = ns; fl.strainPoints = 0; if (ns < 5) fl.breakflow = false; else { fl.breakflow = true; fl.sustained = null; } }); },
        style: { flex: "1 1 0", minWidth: "54px", padding: "5px 2px", cursor: "pointer", borderRadius: "4px",
                 fontFamily: "var(--disp)", fontSize: "9px", letterSpacing: ".08em",
                 border: "1px solid " + (on ? col : "var(--border2)"), background: on ? "rgba(0,0,0,.25)" : "transparent",
                 color: on ? col : "var(--text4)", boxShadow: on ? "0 0 7px " + col + "55" : "none" } },
        s.stage + " · " + s.name.toUpperCase());
    });
    kids.push(el("div.row", { style: { gap: "5px" } }, cells));
    kids.push(stage > 0
      ? noteP("Stage " + stage + " (" + f.strainName + "): " + f.strainPenalty, "var(--warn)")
      : noteP("No Strain. Overdraw and failed Flow rituals build it."));

    // Overdraw logger
    var odIn = el("input", { type: "number", min: "1", value: _od, style: { width: "54px", textAlign: "center", fontFamily: "var(--mono)" },
      oninput: function () { _od = Math.max(1, parseInt(this.value, 10) || 1); }, onchange: function () { EN.app.render(); } });
    kids.push(el("div.row.wrap.flow-overdraw", { style: { gap: "8px", alignItems: "center", marginTop: "10px", padding: "8px 10px", border: "1px solid var(--border2)", borderRadius: "4px", background: "rgba(0,0,0,.18)" } }, [
      el("span", { style: { fontFamily: "var(--disp)", fontSize: "9.5px", letterSpacing: ".12em", color: "var(--danger)" }, text: "OVERDRAW" }),
      odIn, el("span.mono", { style: { fontSize: "11px", color: "var(--text3)" }, text: "FP past empty" }),
      el("span.help", { style: { margin: 0, flex: "1 1 120px", fontSize: "10.5px" }, text: "→ lose " + _od + "d" + f.overdrawDie + " Vitality, +" + _od + " Strain point" + (_od === 1 ? "" : "s") }),
      el("button.btn.sm", { title: "Log an Overdraw: builds Strain and zeroes FP (apply the Vitality loss on the Freelancer tab)",
        style: { color: "var(--danger)", borderColor: "var(--danger)" },
        onclick: function () { var n = _od, die = f.overdrawDie; fset(function (fl) { fl.current = 0; bumpStrain(fl, n); }); toast("Overdrew " + n + " FP · lose " + n + "d" + die + " Vitality · +" + n + " Strain"); } }, "LOG")
    ]));

    // Breakflow banner + restoration
    if (f.inBreakflow || stage >= 5) {
      kids.push(el("div", { style: { marginTop: "10px", padding: "10px", border: "1px solid var(--danger)", borderRadius: "4px", background: "rgba(255,77,94,.06)" } }, [
        el("div.row.between", { style: { alignItems: "baseline" } }, [
          el("span", { style: { fontFamily: "var(--disp)", fontSize: "11px", letterSpacing: ".14em", color: "var(--danger)" }, text: "⚡ BREAKFLOW" }),
          el("span.mono", { style: { fontSize: "12px", color: "var(--text2)" }, text: "Check DC " + f.breakflowDC })
        ]),
        noteP("FP is severed and you cannot channel until restored. Breakflow Check: Flow Attribute Save vs DC 12 + Strain Stage" + (stage >= 3 ? " (Snag at Stage 3+)" : "") + ".", "var(--text2)"),
        el("div.row.wrap", { style: { gap: "8px", marginTop: "4px" } }, [
          el("button.btn.sm", { title: "Ritual Restoration success: Reservoir to half, Strain to Stage 2", onclick: function () { fset(function (fl) { fl.current = Math.floor(f.max / 2); fl.strain = 2; fl.strainPoints = 0; fl.breakflow = false; }); toast("Restored: half Reservoir, Strain → Wave"); } }, "RITUAL (½ · Stage 2)"),
          el("button.btn.sm", { title: "Rough Restoration success: Reservoir to one-quarter, Strain to Stage 3", onclick: function () { fset(function (fl) { fl.current = Math.floor(f.max / 4); fl.strain = 3; fl.strainPoints = 0; fl.breakflow = false; }); toast("Rough restore: ¼ Reservoir, Strain → Surge"); } }, "ROUGH (¼ · Stage 3)")
        ])
      ]));
    }
    var rp = EN.ui.panel("Reservoir", "DC " + f.dc + " · " + f.attributeName.toUpperCase(), kids, { corners: true });
    rp.classList.add("res-panel"); return rp;
  }

  /* ============================ SUSTAIN TRACKER ========================== */
  function sustainPanel(ch, d) {
    var s = ch.flow && ch.flow.sustained, cur = curFP(ch, d), kids = [];
    if (s) {
      kids.push(el("div.row.between.wrap", { style: { alignItems: "baseline" } }, [
        el("div", null, [
          el("span", { style: { fontWeight: 600, fontSize: "14px", color: VIO }, text: s.effect || s.name }),
          s.resonance ? el("span.chip", { style: { marginLeft: "6px", fontSize: "9px", color: VIO, borderColor: VIO }, text: s.resonance }) : null
        ]),
        el("span.mono", { style: { fontSize: "11px", color: "var(--text3)" }, text: "1 FP / turn" })
      ]));
      kids.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
        el("button.btn.sm", { disabled: cur <= 0, title: cur <= 0 ? "No FP; sustaining at 0 FP is an Overdraw" : "Spend 1 FP upkeep at the start of your turn",
          style: cur > 0 ? { color: FP, borderColor: VIO } : null,
          onclick: function () { fset(function (fl) { fl.current = Math.max(0, cur - 1); }); toast("Sustain upkeep · −1 FP"); } }, "UPKEEP −1 FP"),
        el("button.btn.sm", { title: "End the sustained effect", style: { color: "var(--text3)" }, onclick: function () { fset(function (fl) { fl.sustained = null; }); toast("Sustained effect ended"); } }, "END")
      ]));
      kids.push(noteP("Capacity: one sustained effect at a time. Ends if you are Incapacitated, Unconscious, or enter Breakflow. Starting a new sustain replaces this one."));
    } else {
      kids.push(noteP("No sustained effect. Build a Sustain Invocation and Channel it to anchor one here. Only one runs at a time."));
    }
    var sp = EN.ui.panel("Sustain", "MAINTENANCE · CAPACITY", kids, { corners: true });
    sp.classList.add("sustain-panel"); if (s) sp.classList.add("occupied"); return sp;
  }

  /* ========================= FREE-SHAPING BUILDER ======================== */
  function builderPanel(ch, d) {
    var F = EN.flow, R = normForm(ch, d);
    var inv = eng.flowInvocation(_form, d);
    var known = knownResKeys(ch, d);
    var rows = [];

    // Resonance (only the ones this Shaper knows are selectable)
    rows.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "6px" } }, [fieldLabel("RESONANCE"),
      seg(F.resonances.map(function (r) {
        var isKnown = known.indexOf(r.key) !== -1;
        return { key: r.key, label: r.name, disabled: !isKnown,
                 title: isKnown ? r.focus + " · " + r.damage : (r.unlock > d.level ? "Eligible at Level " + r.unlock : "Not known; learn it in #PRINT") };
      }), function (k) { return _form.resonance === k; }, function (k) { setForm({ resonance: k }); })]));
    rows.push(noteP(R.focus + " · " + R.damage + (R.resolution === "save" ? " · resolves with a Flow Save DC" : " · Flow Attack vs Defense") + ". " + (R.base || ""), "var(--text2)"));

    // Intent
    rows.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [fieldLabel("INTENT"),
      seg(F.intent.map(function (i) { return { key: i.key, label: i.name + (i.fp ? " (+" + i.fp + ")" : ""), title: i.desc }; }),
        function (k) { return _form.intent === k; }, function (k) { setForm({ intent: k }); })]));

    // Delivery band + option
    rows.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [fieldLabel("DELIVERY"),
      seg(F.delivery.map(function (b) { return { key: b.key, label: b.band + (b.fp ? " (+" + b.fp + ")" : ""), title: b.desc }; }),
        function (k) { return _form.deliveryBand === k; }, function (k) { var b = F.delivery.find(function (x) { return x.key === k; }); setForm({ deliveryBand: k, deliveryOption: b.options[0], precision: false, extraTargets: 0, extraSpaces: 0 }); })]));
    var band = F.delivery.find(function (b) { return b.key === _form.deliveryBand; });
    rows.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "4px" } }, [fieldLabel(""),
      seg(band.options.map(function (o) { return { key: o, label: o }; }), function (k) { return _form.deliveryOption === k; }, function (k) { setForm({ deliveryOption: k }); })]));

    // Scaling + Precision
    var scaleRow = [fieldLabel("SCALING")];
    if (_form.deliveryBand === "directed") {
      scaleRow.push(el("span.help", { style: { margin: 0, fontSize: "11px" }, text: "Extra targets:" }));
      scaleRow.push(stepper(function () { setForm({ extraTargets: Math.max(0, _form.extraTargets - 1) }); }, function () { setForm({ extraTargets: _form.extraTargets + 1 }); }, _form.extraTargets <= 0));
      scaleRow.push(el("span.mono", { style: { fontSize: "13px", color: "var(--text2)" }, text: String(_form.extraTargets) }));
    } else {
      scaleRow.push(el("span.help", { style: { margin: 0, fontSize: "11px" }, text: "Extra spaces:" }));
      scaleRow.push(stepper(function () { setForm({ extraSpaces: Math.max(0, _form.extraSpaces - 1) }); }, function () { setForm({ extraSpaces: _form.extraSpaces + 1 }); }, _form.extraSpaces <= 0));
      scaleRow.push(el("span.mono", { style: { fontSize: "13px", color: "var(--text2)" }, text: String(_form.extraSpaces) }));
      scaleRow.push(el("button.btn.sm" + (_form.precision ? ".primary" : ""), { title: F.precisionShaping.desc, style: { marginLeft: "8px" }, onclick: function () { setForm({ precision: !_form.precision }); } },
        "PRECISION" + (_form.precision ? " (+" + d.flow.precisionFp + ")" : "")));
    }
    rows.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, scaleRow));

    // Force
    rows.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [fieldLabel("FORCE"),
      seg(F.force.map(function (fo) { return { key: fo.key, label: fo.name + (fo.fp ? " (+" + fo.fp + ")" : ""), title: fo.desc }; }),
        function (k) { return _form.force === k; }, function (k) { setForm({ force: k }); })]));
    // Empowered effect picker (when Empowered + an effect is carried)
    if (_form.force === "empowered" && inv.hasEffect && (R.empowered || []).length) {
      rows.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "4px" } }, [fieldLabel("EFFECT"),
        seg(R.empowered.map(function (e) { return { key: e.name, label: e.name, title: e.text }; }), function (k) { return _form.empoweredEffect === k; }, function (k) { setForm({ empoweredEffect: k }); })]));
    }

    // Duration + target willingness
    rows.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [fieldLabel("DURATION"),
      seg(F.duration.map(function (du) { return { key: du.key, label: du.name, title: du.desc }; }), function (k) { return _form.duration === k; }, function (k) { setForm({ duration: k }); }),
      el("span", { style: { width: "10px" } }),
      seg([{ key: true, label: "Unwilling" }, { key: false, label: "Willing / Object" }], function (k) { return _form.unwilling === k; }, function (k) { setForm({ unwilling: k }); })]));

    // ---- live summary ----
    var cost = inv.fp, cur = curFP(ch, d), over = Math.max(0, cost - cur);
    var summary = [];
    summary.push(el("div.row.between.wrap", { style: { alignItems: "baseline" } }, [
      el("div.mono.flow-fp", { style: { fontSize: "30px", color: over > 0 ? "var(--danger)" : FP }, html: cost + " <span style='font-size:13px;color:var(--text3)'>FP" + (inv.baseFp !== cost ? " · base " + inv.baseFp : "") + "</span>" }),
      inv.damageText ? el("div", { style: { textAlign: "right" } }, [
        el("div", { style: { fontFamily: "var(--disp)", fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)" }, text: "DAMAGE" }),
        el("span.mono", { style: { fontSize: "18px", color: "var(--accent)" }, text: inv.damageText })
      ]) : null
    ]));
    summary.push(noteP(_form.unwilling ? inv.resolutionText : "Automatic (willing target or object); no roll.", _form.unwilling ? "var(--text2)" : "var(--success)"));
    if (inv.empoweredEffect) summary.push(noteP("Empowered: " + inv.empoweredEffect.name + " · " + inv.empoweredEffect.text, VIO));
    if (_form.duration === "sustain") summary.push(noteP(inv.sustainable ? "Sustain: 1 FP at the start of each turn; replaces any current sustain." : "This effect cannot be Sustained.", inv.sustainable ? "var(--text2)" : "var(--warn)"));
    if (d.flow.snagInvoke) summary.push(noteP("Strain (Ripple+): roll this Invocation with Snag.", "var(--warn)"));
    (inv.warnings || []).forEach(function (w) { summary.push(noteP("⚠ " + w, "var(--warn)")); });
    summary.push(el("div.row.wrap", { style: { gap: "8px", marginTop: "8px" } }, [
      el("button.btn.sm.primary", { title: over > 0 ? "Not enough FP; channeling will Overdraw " + over + " FP" : "Spend " + cost + " FP",
        onclick: function () { doChannel(ch, d, inv, defaultName(R)); } }, over > 0 ? "CHANNEL · OVERDRAW " + over : "CHANNEL · " + cost + " FP"),
      el("button.btn.sm", { title: "Save this formulation as a Resonant Pattern", style: { color: VIO, borderColor: VIO }, onclick: function () { savePattern(R); } }, "✚ SAVE PATTERN")
    ]));
    rows.push(el("div.flow-result", { style: { marginTop: "12px", padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "4px", background: "rgba(123,44,255,.05)" } }, summary));

    var bp = EN.ui.panel("Free-Shaping", "ORDER OF SHAPING", rows, { corners: true });
    bp.classList.add("builder"); return bp;
  }

  function defaultName(R) {
    if (_form.empoweredEffect) return _form.empoweredEffect;
    var tail = _form.intent === "damage" ? "Strike" : _form.intent === "hybrid" ? "Hybrid" : "Shaping";
    return R.name + " " + tail;
  }
  function cloneForm() {
    return { name: _form.name, resonance: _form.resonance, intent: _form.intent, deliveryBand: _form.deliveryBand,
             deliveryOption: _form.deliveryOption, force: _form.force, duration: _form.duration, precision: _form.precision,
             extraTargets: _form.extraTargets, extraSpaces: _form.extraSpaces, empoweredEffect: _form.empoweredEffect, unwilling: _form.unwilling };
  }
  function loadForm(p) {
    Object.keys(_form).forEach(function (k) { if (p[k] !== undefined) _form[k] = p[k]; });
    if (p.unwilling === undefined) _form.unwilling = true;
    EN.app.render();
  }
  function doChannel(ch, d, inv, fallbackName) {
    var cur = curFP(ch, d), cost = inv.fp, over = Math.max(0, cost - cur), die = d.flow.overdrawDie;
    var nm = _form.name || (inv.empoweredEffect ? inv.empoweredEffect.name : fallbackName);
    fset(function (fl) {
      var have = (fl.current != null) ? eng.clamp(fl.current, 0, d.flow.max) : d.flow.max;
      fl.current = Math.max(0, have - cost);
      if (over > 0) bumpStrain(fl, over);
      if (_form.duration === "sustain" && inv.sustainable && !fl.breakflow) {
        fl.sustained = { name: nm, resonance: inv.resonance ? inv.resonance.name : "", effect: inv.empoweredEffect ? inv.empoweredEffect.name : nm };
      }
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
    var sub = (R ? R.name : p.resonance) + " · " + p.deliveryOption + " · " + (p.force === "empowered" ? "Empowered" : "Base") + (p.duration === "sustain" ? " · Sustain" : "");
    var nameEl = premade
      ? el("span", { style: { fontWeight: 600, fontSize: "13px" }, text: p.name })
      : el("input", { type: "text", value: p.name || "", placeholder: "pattern name…", style: { fontWeight: 600, fontSize: "13px", flex: "1 1 140px", minWidth: "120px" },
          oninput: function () { var v = this.value; fset(function (fl) { if (fl.patterns[idx]) fl.patterns[idx].name = v; }, true); } });
    var right = el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
      el("span.chip", { style: { fontSize: "9px", color: over > 0 ? "var(--danger)" : FP, borderColor: over > 0 ? "var(--danger)" : VIO }, text: inv.fp + " FP" }),
      inv.damageText ? el("span.chip", { style: { fontSize: "9px", color: "var(--accent)", borderColor: "var(--accent)" }, text: inv.damageText } ) : null,
      el("button.btn.sm", { title: "Load this formulation into the builder", style: { color: "var(--text2)" }, onclick: function () { loadForm(p); toast("Loaded " + p.name + " into Free-Shaping"); } }, "LOAD"),
      premade
        ? el("button.btn.sm", { title: "Copy to your saved patterns", style: { color: VIO, borderColor: VIO }, onclick: function () { var e = {}; Object.keys(p).forEach(function (k) { e[k] = p[k]; }); fset(function (fl) { fl.patterns = (fl.patterns || []).concat([e]); }); toast("Saved " + p.name); } }, "✚ SAVE")
        : el("button.btn.sm", { title: "Delete this pattern", style: { color: "var(--text3)" }, onclick: function () { fset(function (fl) { fl.patterns.splice(idx, 1); }); } }, "✕"),
      el("button.btn.sm.primary", { title: over > 0 ? "Invoke · Overdraw " + over + " FP" : "Invoke · spend " + inv.fp + " FP",
        onclick: function () { loadFormSilent(p); doChannel(ch, d, inv, p.name); } }, over > 0 ? "OVERDRAW" : "INVOKE")
    ]);
    return el("div", { style: { padding: "8px 4px", borderBottom: "1px solid rgba(35,48,68,.4)" } }, [
      el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [nameEl, right]),
      el("div.row.between.wrap", { style: { marginTop: "3px" } }, [
        el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: sub }),
        el("span.help", { style: { margin: 0, fontSize: "10.5px", color: "var(--text2)" }, text: _formResolution(p, d) })
      ])
    ]);
  }
  // resolution text for a saved pattern without disturbing the live builder form
  function _formResolution(p, d) { var inv = eng.flowInvocation(p, d); return p.unwilling === false ? "Automatic" : inv.resolutionText; }
  // set the form fields silently (no render) so a list RUN channels that pattern's cost
  function loadFormSilent(p) { Object.keys(_form).forEach(function (k) { if (p[k] !== undefined) _form[k] = p[k]; }); if (p.unwilling === undefined) _form.unwilling = true; }

  // Saved Resonant Patterns as embeddable rows (no panel chrome, no premade list).
  // Shared by the Flow tab and the Freelancer dashboard so INVOKE works in both.
  function myPatternsInline(ch, d) {
    var saved = (ch.flow && ch.flow.patterns) || [];
    if (!saved.length) return noteP("No saved patterns yet. Build one in the Flow tab's Free-Shaping and hit SAVE.");
    return el("div", null, saved.map(function (p, i) { return patternRow(ch, d, p, i, false); }));
  }

  function patternsPanel(ch, d) {
    var saved = (ch.flow && ch.flow.patterns) || [], rows = [];
    rows.push(el("div.section-title", { style: { margin: "2px 0 4px" } }, [document.createTextNode("My Patterns"), el("span.line"),
      el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", marginLeft: "6px" }, text: saved.length + " saved" })]));
    rows.push(myPatternsInline(ch, d));
    collapsible("flow-premade", "Premade Templates", function () {
      return el("div", null, [noteP(EN.flow.premadeNote, "var(--text2)")].concat((EN.flow.premadePatterns || []).map(function (p) { return patternRow(ch, d, p, -1, true); })));
    }).forEach(function (n) { rows.push(n); });
    var pp = EN.ui.panel("Resonant Patterns", "SAVED FORMULATIONS", rows, { corners: true });
    pp.classList.add("flow-patterns"); return pp;
  }

  /* ============================== REFERENCE ============================== */
  function refTable(cols, data, strongCols) {
    strongCols = strongCols || [];
    var head = el("tr", null, cols.map(function (c) { return el("th", { text: c }); }));
    var body = data.map(function (r) { return el("tr", null, r.map(function (cell, i) { return el("td", strongCols.indexOf(i) !== -1 ? { style: { color: "var(--text)", fontWeight: 600 } } : null, [document.createTextNode(cell)]); })); });
    return el("table.sktable", { style: { marginBottom: "10px" } }, [el("thead", null, [head]), el("tbody", null, body)]);
  }
  function referencePanel(ch, d) {
    var F = EN.flow, kids = [];
    kids = kids.concat(collapsible("ref-res", "Resonances", function () {
      return el("div", null, F.resonances.map(function (r) {
        return el("div.feature", { style: { borderLeftColor: VIO } }, [
          el("h4", null, [document.createTextNode(r.name), el("span.src", { text: "L" + r.unlock + " · " + r.damage })]),
          el("p", { text: r.base }),
          el("div", null, (r.empowered || []).map(function (e) { return el("p.help", { style: { margin: "2px 0" }, text: "◆ " + e.name + (e.sustain ? " (sustainable)" : "") + ": " + e.text }); }))
        ]);
      }));
    }));
    kids = kids.concat(collapsible("ref-sustain", "Sustain Compatibility", function () {
      return refTable(["Resonance", "Empowered Effect", "Sustain", "Notes"], F.sustainCompat.map(function (s) { return [s.resonance, s.effect, s.allowed ? "Yes" : "No", s.notes]; }), [1, 2]);
    }));
    kids = kids.concat(collapsible("ref-strain", "Strain · Overdraw · Breakflow", function () {
      return el("div", null, [
        refTable(["Stage", "Name", "Consequence"], F.strainTrack.map(function (s) { return [String(s.stage), s.name, s.penalty]; }), [0, 1]),
        noteP("Overdraw: " + F.overdraw.vitalityLoss + " " + F.overdraw.strain, "var(--text2)"),
        noteP("Breakflow: " + F.breakflow.check + " " + F.breakflow.onFailure, "var(--text2)")
      ]);
    }));
    kids = kids.concat(collapsible("ref-ritual", "Ritual Recovery", function () {
      return el("div", null, [
        noteP(F.ritualRecovery.note, "var(--text2)"),
        refTable(["Stage", "Time per Stage", "Snag Dice"], F.ritualRecovery.byStage.map(function (s) { return [s.stage + " · " + s.name, s.time, String(s.snag)]; }), [0]),
        el("div", null, F.ritualRecovery.outcomes.map(function (o) { return noteP(o.margin + " (" + o.result + "): " + o.text, "var(--text2)"); })),
        noteP(F.breakflowRestoration.full, "var(--text2)"),
        noteP(F.breakflowRestoration.rough, "var(--text2)")
      ]);
    }));
    var fp = EN.ui.panel("Flow Reference", "RULES", kids, { corners: true });
    fp.classList.add("flow-reference"); return fp;
  }

  /* The compliance tip line never actually works. Pressing REPORT opens an
     uplink modal whose progress bar climbs to a random 50-75%, stalls, and
     then fails one of three ways (a Codebreaker cutting the wire, a Nixie
     swarm eating the packets, or #FLAG being down for maintenance). Every
     path ends the same: the report is never delivered. */
  var REPORT_FAILS = [
    { head: "TRANSMISSION INTERCEPTED",
      body: "A Codebreaker riding the district relay folded your uplink into noise before it cleared the block. Someone on the wire did not want this tip filed." },
    { head: "UNKNOWN FAULT · 0x6E??", swarm: true,
      body: "The uplink opened from the outside and went quiet. #FLAG logs no source and no fault code it can match. There is no record this transmission was ever made." },
    { head: "#FLAG UNAVAILABLE",
      body: "Tip line #FLAG is down for scheduled maintenance. Please hold. Your vigilance is important to us. Estimated wait: indefinite." }
  ];
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
    var card = el("div", { style: { width: "min(440px, 94vw)", position: "relative", overflow: "hidden", borderRadius: "8px",
      background: "linear-gradient(180deg, var(--bg2), var(--bg1))", border: "1px solid var(--warn)",
      boxShadow: "0 20px 60px rgba(0,0,0,.6), 0 0 40px rgba(255,179,64,.12)" } }, [
      el("div", { style: { height: "6px", background: "repeating-linear-gradient(45deg, var(--warn) 0 10px, #0a0e14 10px 20px)", opacity: .8 } }),
      el("div", { style: { padding: "16px 20px 16px" } }, [
        el("div.mono", { style: { fontSize: "10px", letterSpacing: ".22em", color: "var(--warn)" }, text: "// RESONANCE COMPLIANCE · SECURE UPLINK" }),
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
      card.style.borderColor = "var(--danger)";
      fill.style.background = "linear-gradient(90deg, var(--danger), var(--ember))";
      fill.style.boxShadow = "0 0 12px var(--danger)";
      head.textContent = ev.head; head.style.color = "var(--danger)";
      body.textContent = ev.body;
      result.textContent = "REPORT NOT DELIVERED · NO BOUNTY CREDITED"; result.style.color = "var(--danger)";
      pct.textContent = "FAILED"; pct.style.color = "var(--danger)";
      closeBtn.textContent = "DISMISS"; closeBtn.className = "btn sm primary"; closeBtn.style.color = "";
      if (ev.swarm) {
        // the mysterious one: tracer pin-lights run the border at variable
        // speeds and the whole modal wobbles until dismissed (see theme.css).
        card.classList.add("uplink-swarmed");
        ["b1", "b2", "b3", "b4"].forEach(function (c) { card.insertAdjacentHTML("beforeend", '<i class="uplink-beam ' + c + '"></i>'); });
      } else if (card.animate) {
        card.animate([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(4px)" }, { transform: "translateX(-2px)" }, { transform: "translateX(0)" }], { duration: 300 });
      }
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

    var banner = el("div", { style: { position: "relative", overflow: "hidden", borderRadius: "6px", marginBottom: "14px",
      border: "1px solid var(--warn)", background: "linear-gradient(180deg, rgba(255,179,64,.10), rgba(255,77,94,.04) 60%, transparent)" } }, [
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
      el("div.section-title", { style: { margin: "12px 0 6px" } }, [document.createTextNode("Know the Signs"), el("span.line")]),
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
      awareness ? el("div.row.wrap", { style: { gap: "10px", alignItems: "center", marginTop: "6px" } }, [
        el("span", { style: { fontFamily: "var(--disp)", fontSize: "9.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "AWARENESS" }),
        el("span.mono", { style: { fontSize: "16px", color: "var(--accent)" }, text: eng.fmtMod(awareness.total) }),
        el("span.help", { style: { margin: 0 }, text: "Mystique-based: sense unseen forces, detect an Enemy shaping the Flow, and read resonance anomalies before you walk into them." })
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
    blocks.push(el("div", { style: { marginTop: "14px" } }, [referencePanel(ch, d)]));

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
