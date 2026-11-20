/* ===========================================================================
   ELYSIUM NIGHTS · consumables that do what they say, through the HUD's roll tray (19 Nov 2026, the author's call)
   USE on the HUD's Loadout opens a tray for the piece (this file draws it; js/combat.js mounts it with the other trays). The player
   rolls the dice, never the app: digital dice are tapped in the tray, physical dice are typed in. Whom it is for (ON ME or ON
   SOMEONE ELSE) and anything the piece asks about the target are chosen in the tray. The roll is the commitment: it spends one
   (js/inventory.js useOne) and, on this sheet, does what the piece says through the HUD's own writers (js/combat.js core: Vigor,
   Vitality, Wounds, conditions, Status Changes), so nothing here works a rule out a second time. On someone else the roll is shown
   for the table and this sheet is left alone. A piece with a lasting effect is turned on in Status Changes. A piece that would do
   nothing (a Flow Tonic with no Reservoir, an Adrenaline Amp on someone not at 0 Wounds and Stabilized) says why and is not spent.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.consume = (function () {
  var el = EN.ui.el, store = EN.store;
  function C() { return EN.combatView.core; }
  function I() { return EN.inventoryView.core; }
  function eng() { return EN.engine; }

  function prof(d, key) { var s = ((d && d.skills) || []).filter(function (x) { return x.key === key; })[0]; return s ? (s.profBonus || 0) : 0; }
  function mod(d, a) { return (d && d.attributes && d.attributes[a]) ? d.attributes[a].mod : 0; }
  function bonusOf(name) {
    var SC = EN.statusChanges; if (!SC || !SC.bonus) return null;
    var hit = null;
    SC.bonus.groups.forEach(function (g) { (g.options || []).forEach(function (o) { if (o.itemName === name) hit = o; }); });
    return hit;
  }
  function bonusOn(name) { var o = bonusOf(name); if (o) C().applyStatusChange(o); return o; }
  function levelOf(ch, cond) { return (ch.conditions || []).indexOf(cond) !== -1 ? ((ch.conditionLevels || {})[cond] || 1) : 0; }
  function strainUp(n) { store.update(function (c) { var s = eng().mergeStrain(c); eng().setStrainStage(c, Math.min(5, s + (n || 1))); }); }
  function strainBtn(label) { return { label: label || "+1 STRAIN", title: "Take 1 Strain", run: function () { strainUp(1); EN.ui.toast("1 Strain taken."); } }; }
  function lasting(name, lines) {
    var o = bonusOn(name);
    lines.push(o ? "On in Status Changes: " + name + (o.endsOn ? " (ends: " + o.endsOn + ")" : "") + ". Clear it there when it ends." : "Track it by hand: " + name + ".");
    return lines;
  }
  // Vitality gained, as the HUD caps it (Wounds lost come off maximum Vitality): the line says so when the cap bites
  function vitNow() { var c = store.active(), d = eng().derive(c), s = C().state(c, d); return { vit: s.vit, max: s.vitMax }; }
  function vitalityLine(t, before, after, max) {
    var got = Math.max(0, after - before);
    return t + ": you gain " + got + " Vitality" + (got < (t.total || 0) ? " (your maximum Vitality, " + max + " with the Wounds you have lost, caps it)" : "") + ".";
  }
  // a die group as the player's roll reads: the dice, what they showed, the flat, the total
  function rt(g, res) {
    var flat = g.flat ? (g.flat > 0 ? " + " : " − ") + Math.abs(g.flat) : "";
    return g.n + "d" + g.sides + flat + (res.rolls ? " → [" + res.rolls.join(", ") + "]" + flat : " (your roll)") + " = " + res.total;
  }

  /* What each piece does. Each has:
       act     the action it costs
       target  true when it can go on someone else (the tray asks ON ME or ON SOMEONE ELSE)
       extra   toggles the tray offers about someone else: [{ key, label }]
       dice(x) the dice groups it rolls: [{ key, n, sides, flat, label }] (none: it is just used)
       refuse(x) a reason the piece can't be used, or null
       run(x, r) does it. x = { ch, d, s (the HUD's state), me, tog }, r = { key: { total, rolls } }; answers
                 { short, lines, actions } (actions: buttons for what the player decides after).
     The rules are the catalog's own words (data/gear_tools.js). */
  var SPECS = {
    "Vita-Pop": { act: "Action", dice: function () { return [{ key: "v", n: 1, sides: 6, label: "Vigor" }]; },
      run: function (x, r, g) { C().gainVigor(r.v.total);
        return { short: "+" + r.v.total + " Vigor", lines: [rt(g[0], r.v) + ": you gain " + r.v.total + " Vigor (Vigor doesn't stack; you keep the higher).", "One Vita-Pop per scene."] }; } },
    "Trauma Slap Patch": { act: "Swift Action", target: true, extra: [{ key: "zero", label: "They are at 0 Wounds" }],
      dice: function (x) { var zero = x.me ? x.s.wounds <= 0 : !!x.tog.zero; return zero ? [{ key: "vit", n: 1, sides: 4, label: "Vitality (at 0 Wounds)" }] : [{ key: "vig", n: 1, sides: 6, label: "Vigor" }]; },
      run: function (x, r, g) {
        var zero = !!r.vit;
        if (!x.me) return { short: zero ? "Stabilized" : "rolled for them", lines: [zero ? rt(g[0], r.vit) + ": they gain " + r.vit.total + " Vitality and are Stabilized, still Unconscious." : rt(g[0], r.vig) + ": they gain " + r.vig.total + " Vigor.", "One Trauma Slap Patch per Freelancer per scene."] };
        if (zero) {
          var b0 = vitNow(); C().applyHeal(x.ch, x.d, r.vit.total); var b1 = vitNow();
          store.update(function (c) { c.stable = true; c.deathSaves = { s: 0, f: 0 }; });
          C().addCondition("Unconscious");
          return { short: "+" + Math.max(0, b1.vit - b0.vit) + " Vitality, Stabilized", lines: [vitalityLine(Object.assign(new String(rt(g[0], r.vit)), { total: r.vit.total }), b0.vit, b1.vit, b1.max), "You are Stabilized, and still Unconscious."] };
        }
        C().gainVigor(r.vig.total);
        return { short: "+" + r.vig.total + " Vigor", lines: [rt(g[0], r.vig) + ": you gain " + r.vig.total + " Vigor.", "One Trauma Slap Patch per scene."] };
      } },
    "Med Foam Canister": { act: "Action", target: true,
      dice: function (x) { return [{ key: "v", n: 1, sides: 6, flat: prof(x.d, "medtech"), label: "Vigor (+ Medtech)" }]; },
      run: function (x, r, g) {
        if (!x.me) return { short: "rolled for them", lines: ["They recover 1 Wound.", rt(g[0], r.v) + " (your Medtech Proficiency Bonus included): they gain " + r.v.total + " Vigor.", "Any Bleeding or ongoing open-wound damage on them ends."] };
        C().healWounds(x.ch, x.d, 1); C().gainVigor(r.v.total);
        if (levelOf(x.ch, "Bleeding")) C().setCondLevel("Bleeding", 0);
        return { short: "+1 Wound, +" + r.v.total + " Vigor", lines: ["You recover 1 Wound.", rt(g[0], r.v) + " (Medtech Proficiency Bonus included): you gain " + r.v.total + " Vigor.", "Any Bleeding ends."] };
      } },
    "Detox Patch": { act: "Action", target: true, run: function (x) {
      if (!x.me) return { short: "on them", lines: ["Their Poisoned condition ends (or a similar mild toxin, at the GM's call).", "For 8 hours they roll with Edge on Body Saves against Poisoned and toxic effects."] };
      if (levelOf(x.ch, "Poisoned")) C().setCondLevel("Poisoned", 0);
      return { short: "Poisoned ends", lines: lasting("Detox Patch", ["Your Poisoned condition ends.", "For 8 hours you roll with Edge on Body Saves against Poisoned and toxic effects."]) };
    } },
    "Adrenaline Amp": { act: "Action", target: true,
      refuse: function (x) { return x.me && (x.s.wounds > 0 || !x.ch.stable) ? "An Adrenaline Amp goes into someone at 0 Wounds who is already Stabilized." : null; },
      dice: function () { return [{ key: "v", n: 1, sides: 6, label: "Vitality" }]; },
      run: function (x, r, g) {
        if (!x.me) return { short: "rolled for them", lines: ["Only on someone at 0 Wounds who is already Stabilized.", "They stand up with 1 Wound and " + rt(g[0], r.v) + ": " + r.v.total + " Vitality, Dazed until the end of their next turn.", "Afterward they gain 1 level of Fatigue."] };
        var fat = levelOf(x.ch, "Fatigue");
        C().healWounds(x.ch, x.d, 1);
        var a0 = vitNow(); C().applyHeal(store.active(), eng().derive(store.active()), r.v.total); var a1 = vitNow();
        C().setCondLevel("Unconscious", 0); C().addCondition("Dazed"); C().setCondLevel("Fatigue", fat + 1);
        return { short: "back up, 1 Wound", lines: ["You stand up with 1 Wound.", vitalityLine(Object.assign(new String(rt(g[0], r.v)), { total: r.v.total }), a0.vit, a1.vit, a1.max), "Dazed until the end of your next turn.", "You gain 1 level of Fatigue."] };
      } },
    "Combat Stim Pack": { act: "Swift Action", run: function () {
      return { short: "3-turn burst", lines: lasting("Combat Stim Pack", ["For 3 turns: +2 Speed, Edge on Initiative rolls and Agility Saves, and one extra Swift Action each turn.", "At the end of your 3rd turn, a DC 12 Body Save, or you are Dazed for 1 round."]) };
    } },
    "Nightwatch Tablets": { act: "Action", run: function () {
      return { short: "4 hours awake", lines: lasting("Nightwatch Tablets", ["For 4 hours you ignore Fatigue 1, and roll with Edge on Wits Saves to stay alert.", "When the last dose wears off, Fatigue returns: a DC 10 Body Save or +1 Fatigue (more for Crash Stacks)."]) };
    } },
    "Flow Tonic Vial": { act: "Action",
      refuse: function (x) { return x.d.flow ? null : "You have no Flow Reservoir for a Flow Tonic to fill."; },
      dice: function () { return [{ key: "fp", n: 1, sides: 4, flat: 1, label: "FP" }]; },
      run: function (x, r, g) {
        var max = x.d.flow.max, cur = (x.ch.flow && x.ch.flow.current != null) ? x.ch.flow.current : max, got = Math.max(0, Math.min(max, cur + r.fp.total) - cur);
        store.update(function (c) { c.flow = c.flow || {}; var now = c.flow.current != null ? c.flow.current : max; c.flow.current = Math.min(max, now + r.fp.total); });
        return { short: "+" + got + " FP", lines: [rt(g[0], r.fp) + ": you regain " + got + " FP" + (got < r.fp.total ? " (up to your maximum)" : "") + "."], actions: [strainBtn("+1 STRAIN (not your first vial this scene)")] };
      } },
    "Channel Cleanse Tonic": { act: "Action", run: function (x) {
      var st = eng().strainOf ? eng().strainOf(x.ch) : 0;
      if (st > 0) store.update(function (c) { eng().setStrainStage(c, eng().mergeStrain(c) - 1); });
      return { short: st > 0 ? "−1 Strain" : "Edge on your next save", lines: [st > 0 ? "1 Strain removed." : "You carry no Strain to remove.", "Edge on your next Body or Mystique Save against Overdraw or backlash within 1 hour.", "It removes Strain once per Long Rest."] };
    } },
    "Focus Draught": { act: "Swift Action", run: function () {
      return { short: "Edge this turn", lines: lasting("Focus Draught", ["Until the end of your turn: Edge on Flow-based attack rolls and d20 checks, and your next Invocation this turn costs 1 fewer FP (minimum 1).", "Afterward, a DC 12 Mystique Save or 1 Strain."]), actions: [strainBtn("+1 STRAIN (failed the save)")] };
    } },
    "Attunement Draught": { act: "Action", run: function () {
      return { short: "10 minutes", lines: lasting("Attunement Draught", ["For 10 minutes: Edge on Awareness or Esoterica checks to sense or read the Invocation or Mystech focus you held in mind."]) };
    } },
    "Resonant Shield Elixir": { act: "Action", run: function () {
      return { short: "Resonant warded", lines: lasting("Resonant Shield Elixir", ["For 1 minute or until the encounter ends: Resistance to Resonant damage and +1 DR against it."]) };
    } },
    "Flow Surge Ampoule": { act: "Swift Action", dice: function () { return [{ key: "d", n: 3, sides: 6, label: "damage, or Vigor if it heals" }]; },
      run: function (x, r, g) {
        strainUp(1);
        return { short: "+" + r.d.total + " to the Invocation", lines: [rt(g[0], r.d) + ": that Invocation deals +" + r.d.total + " damage of its type, or grants " + r.d.total + " Vigor if it heals.", "1 Strain taken (it comes even if the Invocation fails)."] };
      } },
    "Overchannel Amp Shot": { act: "Swift Action", run: function () {
      return { short: "Overchannel", lines: lasting("Overchannel Amp Shot", ["Until the encounter ends: Edge on Flow attack rolls and Esoterica checks, +1 to Flow attack rolls and Flow Save DC, +1d6 Invocation damage once each turn, and once, an Invocation costs 3 fewer FP.", "When it ends: 2 Strain, and a DC 12 Body Save or 1 level of Fatigue. One per Long Rest."]) };
    } },
    "Breach Charge": { act: "Action",
      dice: function (x) { return [{ key: "p", n: 4, sides: 6, flat: prof(x.d, "engineering"), label: "vs Integrity (Heavy or better)" }, { key: "b", n: 2, sides: 6, label: "Force damage" }]; },
      run: function (x, r, g) {
        var dc = 8 + mod(x.d, "TEC") + prof(x.d, "engineering");
        return { short: "charge blown", lines: ["Placing it cleanly is an Engineering check (a Demolition Kit gives Edge).", "Average or weaker cover, or a standard door: destroyed outright.",
          "Against Heavy or better: " + rt(g[0], r.p) + " against its Integrity.",
          "Everyone adjacent: Agility Save DC " + dc + " or " + rt(g[1], r.b) + " Force damage (" + Math.floor(r.b.total / 2) + " on a success)."] };
      } }
  };
  // the pieces that do what their card says and nothing the sheet keeps: spent, and their effect said
  ["Breaching Charge", "Thermite Slug", "Emergency Sealant Foam", "Basic Rations", "Water Purification Tabs", "Ritual Reagent Pouch"].forEach(function (n) {
    SPECS[n] = { act: n === "Basic Rations" || n === "Water Purification Tabs" ? "" : "Action", run: function () {
      var it = eng().catalogItem ? eng().catalogItem(n) : null;
      return { short: "used", lines: [it && (it.activation || it.effect) ? String(it.activation ? it.activation + " " : "") + (it.effect || "") : "Used."] };
    } };
  });
  function spec(name) { return SPECS[name] || null; }

  /* ---- the tray ---- */
  var _tray = { open: false, key: null, name: "", who: "me", tog: {}, phase: "ready", dice: [], r: null, res: null, typed: {}, anim: false };
  var _animId = 0, _last = null;   // the last use's result, by item name, until closed or another is used
  function entryOf(key) { var ch = store.active(); return ch ? (eng().findEntry ? eng().findEntry(ch, key) : (ch.equipment || []).filter(function (x) { return x.name === key; })[0]) || null : null; }
  function xnow() {
    var ch = store.active(), d = eng().derive(ch);
    return { ch: ch, d: d, s: C().state(ch, d), me: _tray.who !== "other", tog: _tray.tog };
  }
  function groupsNow(sp, x) { return sp && sp.dice ? sp.dice(x) : []; }
  function whyNot(sp, x) { return sp && sp.refuse ? sp.refuse(x) : null; }

  function open(key) {
    var ch = store.active(); if (!ch) return;
    var e = entryOf(key); if (!e || !(e.qty > 0)) return;
    var sp = SPECS[e.name] || null;
    _animId++;
    _tray = { open: true, key: key, name: e.name, who: "me", tog: {}, phase: "ready", dice: [], r: null, res: null, typed: {}, anim: false };
    // a piece that is only ever for this sheet is refused at the door; one that can go on someone else asks in the tray
    var why = sp && !sp.target ? whyNot(sp, xnow()) : null;
    if (why) { _tray.open = false; EN.ui.toast(why + " It is not used.", 4000); return; }
    EN.app.render();
  }
  function close() { _animId++; _tray.open = false; EN.app.render(); }
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && _tray.open) close(); });

  /* THE ROLL: digital dice are rolled here by a tap, physical dice are typed; either way it is the player's roll. It spends one and
     does the piece (on this sheet), and the tray then shows what happened. */
  function commit() {
    var T = _tray; if (T.phase !== "ready") return;
    var e = entryOf(T.key); if (!e) { close(); return; }
    var sp = SPECS[T.name] || { run: function () { return { short: "used", lines: ["Used."] }; } }, x = xnow();
    if (whyNot(sp, x)) return;
    var groups = groupsNow(sp, x), r = {}, physical = C().physicalDice && C().physicalDice();
    if (physical) {
      for (var i = 0; i < groups.length; i++) {
        var g = groups[i], lo = g.n + (g.flat || 0), hi = g.n * g.sides + (g.flat || 0), v = Math.floor(Number(T.typed[g.key]));
        if (!(v >= lo && v <= hi)) { EN.ui.toast("Enter what your " + g.n + "d" + g.sides + " came to (" + lo + " to " + hi + ")."); return; }
        r[g.key] = { total: v, rolls: null };
      }
    } else {
      groups.forEach(function (g) {
        var rr = eng().rollDamage({ dice: g.n + "d" + g.sides, flat: g.flat || 0 });
        r[g.key] = { total: rr.total, rolls: rr.groups[0] ? rr.groups[0].rolls : [] };
      });
    }
    var res = sp.run(x, r, groups) || { short: "used", lines: ["Used."] };
    var spent = I().useOne(T.key, { quiet: true }) || { name: T.name, left: Math.max(0, e.qty - 1) };
    _last = { name: T.name, who: x.me ? "me" : "other", lines: res.lines || [], actions: res.actions || [], left: spent.left, at: Date.now() };
    T.dice = groups; T.r = r; T.res = res; T.phase = "done"; T.anim = !physical && groups.length > 0;
    if (spent.left > 0) EN.ui.toast("Used a " + T.name + (x.me ? "" : " on someone else") + ": " + (res.short || "done") + ". " + spent.left + " left.", 3500);
    else EN.ui.toast("That was your last " + T.name + (res.short ? " (" + res.short + ")" : "") + ". Its row stays on the Loadout at 0; RESTOCK opens the Gray Market on it.", 7000);
    var my = ++_animId;
    EN.app.render();
    if (T.anim) EN.ui.animatePoolRoll(document.querySelector('[data-use-dice]'), function () { if (my !== _animId) return; T.anim = false; EN.app.render(); });
  }

  function die(value, sides, o) {
    o = o || {};
    var svg = EN.ui.dieFaceSvg(sides, { size: 40, edge: "var(--accent)", num: "var(--text)", value: value, animating: o.animating });
    return el("span.tb-die" + (o.animating ? ".rolling" : ""), { html: svg, dataset: o.animating ? { die: "1", final: String(value), sides: String(sides) } : null, style: { display: "inline-flex", opacity: o.dim ? 0.5 : 1 } });
  }
  function seg(on, text, data, fn, col) {
    return el("button", { type: "button", dataset: data, onclick: fn, style: { flex: "1 1 0", padding: "9px 10px", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "11.5px", letterSpacing: ".06em", borderRadius: "8px",
      border: "1px solid " + (col || "var(--accent)"), color: on ? "var(--bg1)" : (col || "var(--accent)"), background: on ? (col || "var(--accent)") : "transparent", fontWeight: on ? 700 : 400 } }, text);
  }

  function trayModal() {
    var T = _tray; if (!T.open) return null;
    var ch = store.active(); if (!ch) return null;
    var e = entryOf(T.key), sp = SPECS[T.name] || null, x = xnow(), it = eng().catalogItem ? eng().catalogItem(T.name) : null;
    var done = T.phase === "done", physical = !!(C().physicalDice && C().physicalDice());
    var groups = done ? T.dice : groupsNow(sp, x), why = done ? null : whyNot(sp, x);
    var onHand = done ? (_last ? _last.left : 0) : (e ? e.qty : 0);
    var kids = [];

    // header
    kids.push(el("div.row.between", { style: { alignItems: "center", padding: "13px 16px", borderBottom: "1px solid var(--border)" } }, [
      el("div", null, [el("div", { style: { fontFamily: "var(--disp)", fontWeight: 700, fontSize: "15.5px", color: "var(--text)" }, text: T.name }),
        el("div.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".08em", marginTop: "2px" }, text: ((sp && sp.act ? sp.act.toUpperCase() + " · " : "") + (done ? onHand + " LEFT" : onHand + " ON HAND")) })]),
      el("button", { title: "Close (Esc)", dataset: { useClose: "1" }, onclick: close, style: { background: "transparent", border: "none", color: "var(--text4)", fontSize: "19px", cursor: "pointer", lineHeight: "1", padding: "2px 5px" } }, "✕")]));

    // what it is
    if (it && it.effect && !done) kids.push(EN.ui.ruleText(el("p", { style: { margin: 0, padding: "12px 16px 0", fontSize: "12.5px", lineHeight: 1.5, color: "var(--text2)" } }), it.effect, { conditions: true, used: {} }));

    // whom it is for, and what it asks about them
    if (sp && sp.target && !done) {
      kids.push(el("div", { style: { padding: "12px 16px 0" } }, [
        el("div", { style: { display: "flex", gap: "8px" } }, [
          seg(T.who === "me", "ON ME", { useWho: "me" }, function () { T.who = "me"; EN.app.render(); }),
          seg(T.who === "other", "ON SOMEONE ELSE", { useWho: "other" }, function () { T.who = "other"; EN.app.render(); })]),
        el("p.help", { style: { margin: "6px 0 0", fontSize: "11px", color: "var(--text3)" }, text: T.who === "me" ? "The result goes on this sheet." : "It rolls and says what they get. Your sheet is left alone." })]));
      if (T.who === "other" && sp.extra) kids.push(el("div", { style: { padding: "8px 16px 0", display: "flex", gap: "8px", flexWrap: "wrap" } }, sp.extra.map(function (t) {
        return seg(!!T.tog[t.key], (T.tog[t.key] ? "✓ " : "") + t.label.toUpperCase(), { useToggle: t.key }, function () { T.tog[t.key] = !T.tog[t.key]; EN.app.render(); }, "var(--gold)");
      })));
    }
    if (why) kids.push(el("div.mono", { dataset: { useRefuse: "1" }, style: { margin: "12px 16px 0", padding: "8px 10px", border: "1px solid var(--danger)", color: "var(--danger)", fontSize: "11.5px", borderRadius: "6px" }, text: why }));

    // the dice
    if (done) {
      var diceEls = [];
      groups.forEach(function (g) {
        var res = T.r[g.key];
        if (res && res.rolls) res.rolls.forEach(function (v) { diceEls.push(die(v, g.sides, { animating: T.anim })); });
        else diceEls.push(el("span.mono", { style: { fontSize: "30px", color: "var(--text)" }, text: String(res ? res.total : "?") }));
      });
      if (diceEls.length) kids.push(el("div", { dataset: { useDice: "1" }, style: { display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", padding: "16px 16px 4px", minHeight: "54px" } }, diceEls));
      var tot = groups.map(function (g) { return T.r[g.key] ? T.r[g.key].total : 0; });
      if (groups.length && !T.anim) kids.push(el("div.mono", { dataset: { useTotal: "1" }, style: { textAlign: "center", fontSize: "11px", color: "var(--text3)", letterSpacing: ".12em" }, text: groups.map(function (g) { return g.label.toUpperCase() + " " + T.r[g.key].total; }).join("  ·  ") }));
      // the result
      if (!T.anim) {
        kids.push(el("div", { dataset: { useResult: "1" }, style: { margin: "12px 16px 0", padding: "9px 11px", border: "1px solid var(--accent-dim, var(--border2))", borderLeft: "3px solid var(--accent)", background: "var(--bg2)" } },
          [el("div.mono", { style: { fontSize: "9.5px", letterSpacing: ".14em", color: "var(--accent)" }, text: _last && _last.who === "other" ? "USED ON SOMEONE ELSE" : "USED" })]
            .concat((_last ? _last.lines : []).map(function (t) { return EN.ui.ruleText(el("p", { style: { margin: "4px 0 0", fontSize: "12px", lineHeight: 1.45, color: "var(--text2)" } }), t, { conditions: true, used: {} }); }))));
        if (_last && _last.actions.length) kids.push(el("div", { style: { padding: "8px 16px 0", display: "flex", gap: "6px", flexWrap: "wrap" } }, _last.actions.map(function (a) {
          return el("button.btn.sm", { type: "button", title: a.title || "", dataset: { useAct: a.label }, onclick: function () { a.run(); } }, a.label);
        })));
        kids.push(el("div", { style: { padding: "14px 16px" } }, [el("button.btn.primary", { type: "button", dataset: { useDone: "1" }, style: { width: "100%", justifyContent: "center" }, onclick: close }, "DONE")]));
      }
    } else if (groups.length) {
      var dim = [];
      groups.forEach(function (g) { for (var i = 0; i < g.n; i++) dim.push(die("", g.sides, { dim: true })); });
      if (physical) {
        kids.push(el("div", { style: { padding: "14px 16px 0" } }, groups.map(function (g) {
          return el("div.row", { style: { gap: "8px", alignItems: "center", margin: "0 0 6px" } }, [
            el("span.mono", { style: { fontSize: "11px", color: "var(--text2)", flex: "1 1 auto" }, text: "Roll " + g.n + "d" + g.sides + (g.flat ? (g.flat > 0 ? " + " : " − ") + Math.abs(g.flat) : "") + " → " + g.label }),
            el("input", { type: "number", min: String(g.n + (g.flat || 0)), max: String(g.n * g.sides + (g.flat || 0)), value: T.typed[g.key] == null ? "" : String(T.typed[g.key]), placeholder: "total", dataset: { useInput: g.key }, style: { width: "84px", padding: "5px 7px" },
              oninput: function () { T.typed[g.key] = this.value; } })]);
        })));
        kids.push(el("div", { style: { padding: "10px 16px 14px" } }, [el("button.btn.primary", { type: "button", disabled: !!why, dataset: { useRoll: "1" }, style: { width: "100%", justifyContent: "center" }, onclick: commit }, "USE IT")]));
      } else {
        kids.push(el("div", { dataset: { useRoll: "1" }, role: "button", title: why ? why : "Tap to roll", style: { textAlign: "center", padding: "20px 16px 16px", cursor: why ? "default" : "pointer", userSelect: "none", opacity: why ? 0.5 : 1 },
          onclick: function () { if (!why) commit(); } }, [
          el("div", { style: { display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", minHeight: "48px" } }, dim),
          el("div.mono", { style: { fontSize: "11px", letterSpacing: ".22em", color: why ? "var(--text3)" : "var(--accent)", marginTop: "12px", textTransform: "uppercase" }, text: why ? "Can't be used" : "Tap to roll" }),
          el("div.mono", { style: { fontSize: "10px", color: "var(--text3)", marginTop: "4px" }, text: groups.map(function (g) { return g.n + "d" + g.sides + (g.flat ? (g.flat > 0 ? "+" : "−") + Math.abs(g.flat) : "") + " " + g.label; }).join("  ·  ") })]));
      }
      kids.push(el("p.help", { style: { margin: 0, padding: "0 16px 12px", fontSize: "10.5px", color: "var(--text4)", textAlign: "center" }, text: "Rolling spends one" + (T.who === "me" ? " and does it on your sheet." : ".") }));
    } else {
      // nothing to roll: just use it
      kids.push(el("div", { style: { padding: "14px 16px" } }, [el("button.btn.primary", { type: "button", disabled: !!why, dataset: { useRoll: "1" }, style: { width: "100%", justifyContent: "center" }, onclick: commit }, "USE IT"),
        el("p.help", { style: { margin: "8px 0 0", fontSize: "10.5px", color: "var(--text4)", textAlign: "center" }, text: "There is nothing to roll. Using it spends one" + (sp && sp.target && T.who === "me" ? " and does it on your sheet." : ".") })]));
    }

    return el("div", { dataset: { useTray: T.name }, style: { position: "fixed", inset: "0", zIndex: "4001", background: "rgba(4,7,11,.74)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
      onclick: function (ev) { if (ev.target === ev.currentTarget) close(); } },
      [el("div", { style: { width: "min(430px, 96vw)", maxHeight: "94vh", overflowY: "auto", borderRadius: "12px", background: "linear-gradient(180deg, var(--bg2), var(--bg1))", border: "1px solid var(--border2)", boxShadow: "0 20px 60px rgba(0,0,0,.55)" } }, kids)]);
  }

  function last(name) { return _last && _last.name === name ? _last : null; }
  function dismiss() { _last = null; }

  return { spec: spec, open: open, use: open, close: close, trayModal: trayModal, last: last, dismiss: dismiss, names: function () { return Object.keys(SPECS); }, tray: function () { return _tray; } };
})();
