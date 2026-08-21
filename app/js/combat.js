/* ===========================================================================
   ELYSIUM NIGHTS - Combat tab
   Play-time dashboard: Vitality / Vigor / Wounds, Dying & Death Saves,
   class resource + Flow/Strain, Fatigue, conditions, attacks, rests, and
   collapsible rules references. Reads the same #PRINT record as everything.
   =========================================================================== */
window.EN = window.EN || {};

EN.combatView = (function () {
  var el = EN.ui.el, clear = EN.ui.clear, toast = EN.ui.toast;
  var R = EN.rules, eng = EN.engine, store = EN.store;
  var _open = {};   // collapse state for reference panels (collapsed by default)
  /* ---------- modular layout (drag to rearrange; widths in sixths, 1/6-6/6) -- */
  var LAYOUT_KEY = "en_freelancer_layout_v3";
  var LAYOUT_KEY_V1 = "en_freelancer_layout_v1";
  var DEFAULT_LAYOUT = [
    { key: "matrix", w: 4 }, { key: "vitality", w: 2 },
    { key: "skills", w: 2 }, { key: "flow", w: 6 }, { key: "actions", w: 4 }, { key: "defend", w: 6 },
    { key: "conditions", w: 6 }, { key: "hazards", w: 6 }, { key: "senses", w: 2 },
    { key: "profs", w: 4 }
  ];
  var _drag = null;
  function loadLayout() {
    var def = DEFAULT_LAYOUT.map(function (x) { return { key: x.key, w: x.w }; });
    try {
      var l = JSON.parse(localStorage.getItem(LAYOUT_KEY) || "null");
      if (!Array.isArray(l)) {
        // migrate the old half/full layout: 1 (half) → 3 sixths, 2 (full) → 6
        var v1 = JSON.parse(localStorage.getItem(LAYOUT_KEY_V1) || "null");
        if (!Array.isArray(v1)) return def;
        l = v1.map(function (x) { return { key: x.key, w: x.w === 2 ? 6 : 3 }; });
      }
      l = l.filter(function (x) { return x && DEFAULT_LAYOUT.some(function (d) { return d.key === x.key; }); });
      l.forEach(function (x) { x.w = Math.max(1, Math.min(6, x.w || 3)); });
      DEFAULT_LAYOUT.forEach(function (d) {       // new sections added later join at their default spot
        if (!l.some(function (x) { return x.key === d.key; })) l.push({ key: d.key, w: d.w });
      });
      return l;
    } catch (e) { return def; }
  }
  function saveLayout(l) { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(l)); } catch (e) {} }


  var _editMode = false;                            // layout customization: shows drag/width/view controls
  try { _editMode = localStorage.getItem("en_freelancer_edit_v1") === "1"; } catch (e) {}
  function setEditMode(on) {
    _editMode = on;
    try { localStorage.setItem("en_freelancer_edit_v1", on ? "1" : "0"); } catch (e) {}
  }

  var _fxBox = { mode: "open", closedKey: null };   // sticky Active Condition Effects box ("open"/"min"; closedKey = content-keyed dismiss)
  var _pops = { vit: false, wound: false, rest: false, short: false, down: false, addgear: false };   // popover state (VITALITY / WOUNDS / LONG REST / SHORT REST / DOWNTIME / ＋ ADD TO LOADOUT)
  var _downDays = 7;   // last downtime span typed, remembered across renders
  var _amts = { vit: 1, wound: 1, rd: 1 };                 // remembered amounts per popover
  function closePops() { Object.keys(_pops).forEach(function (k) { _pops[k] = false; }); }
  document.addEventListener("click", function (ev) {
    if (!Object.keys(_pops).some(function (k) { return _pops[k]; })) return;
    if (ev.target.closest && ev.target.closest(".pop-anchor")) return;
    closePops(); EN.app.render();
  });

  /* ---------- Roll tray: the interactive d20 roll modal ------------------
     Transient, rebuilt from _rollTray on every render (the same state->render
     pattern the Deep Run and Tech Bench pool rollers use). ctx is a plain data
     snapshot captured when a HIT number is clicked, so the modal never reaches
     back into the weapon render scope. */
  var _rollTray = { open: false, ctx: null, mode: "none", help: 0, other: 0, roll: null, animating: false };
  // monotonic animation id: a pending scramble's callback only settles the tray
  // if no newer roll / close / mode change / open has superseded it (the same
  // guard the Deep Run and Tech Bench pool rollers use).
  var _rollAnimId = 0;
  function openRollTray(ctx) {
    // default the switch to the net the sheet already knows about, so an
    // untrained or condition-Snagged attack opens pre-set to Snag
    var mode = (ctx.baseSnag > 0) ? "snag" : (ctx.baseEdge > 0 && !ctx.shaken) ? "edge" : "none";
    _rollAnimId++;
    _rollTray = { open: true, ctx: ctx, mode: mode, help: 0, other: 0, lucky: false, press: false, asp: {}, roll: null, animating: false };
    EN.app.render();
  }
  function closeRollTray() {
    _rollAnimId++;
    _rollTray.open = false; _rollTray.roll = null; _rollTray.animating = false;
    EN.app.render();
  }
  function rollTraySetMode(m) {
    if (m === "edge" && _rollTray.ctx && _rollTray.ctx.shaken) return;   // Shaken: no Edge
    if (_rollTray.mode === m) return;
    _rollAnimId++;
    _rollTray.mode = m; _rollTray.roll = null;   // the die count changed; reroll
    EN.app.render();
  }
  // Aspect-gated bonuses (a Skill Focus, a Specialization) only apply when the
  // action falls inside their narrow aspect ("Athletics (Throwing)"). Nothing on
  // the sheet knows what the player is attempting, so they ride as opt-in pills
  // rather than being folded in silently.
  function rollTrayAspects() {
    var ctx = _rollTray.ctx || {}, on = _rollTray.asp || {};
    var mods = [], critMin = ctx.critMin || 20;
    (ctx.aspectMods || []).forEach(function (a) {
      if (!on[a.key]) return;
      if (a.value) mods.push({ label: a.modLabel || a.label, value: a.value });
      if (a.critMin) critMin = Math.min(critMin, a.critMin);
    });
    return { mods: mods, critMin: critMin };
  }
  function rollTraySpec() {
    var ctx = _rollTray.ctx || {}, asp = rollTrayAspects();
    return eng.composeRollSpec({
      baseMods: (ctx.baseMods || []).concat(asp.mods), edge: _rollTray.mode === "edge" ? 1 : 0, snag: _rollTray.mode === "snag" ? 1 : 0,
      helpValue: _rollTray.help, manual: _rollTray.other, shaken: ctx.shaken, critMin: asp.critMin,
      luckyBreak: !!(_rollTray.lucky && ctx.luckyBreak),
      pressLuck: !!(_rollTray.press && ctx.pressLuck), countingCards: !!ctx.countingCards
    });
  }
  function rollTrayCommit() {
    var ctx = _rollTray.ctx, spec = rollTraySpec();
    var res = eng.rollD20(spec);
    var it = ctx.usesAmmo ? findWeapon(ctx.weaponName) : null;
    // a Gambit costs 1 Moxie each; Press Your Luck's bet is spent whether it
    // hits or busts (a bust just cannot be recovered this turn)
    var spend = (spec.luckyBreak ? 1 : 0) + (spec.pressLuck ? 1 : 0);
    // one roll = one attack: a fired weapon spends a shot, and every roll is
    // written to the character's roll log. Done silently so the render below
    // is the one that shows the dice mid-animation.
    var entry = { w: ctx.weaponName, mode: _rollTray.mode, nat: res.nat, total: res.total,
      crit: res.crit, fumble: res.fumble, t: Date.now() };
    store.update(function (c) {
      if (it) {
        var st = readAmmo(c, it, ctx.weaponKey), cost = costFor(it, st.mode);
        c.weaponAmmo = c.weaponAmmo || {};
        var a = c.weaponAmmo[ctx.weaponKey] || { cur: st.cur, mode: st.mode, ammoType: st.ammoType };
        if (typeof a.cur !== "number") a.cur = st.cur;
        var spentRounds = Math.min(a.cur, cost);
        a.cur = Math.max(0, a.cur - cost);
        c.weaponAmmo[ctx.weaponKey] = a;
        // kick the card on the next render if this actually burned rounds
        if (spentRounds > 0) _recoil = ctx.weaponKey;
      }
      if (spend && ctx.moxie) {
        c.resources = c.resources || {}; c.resources.current = c.resources.current || {};
        var cur = (c.resources.current[ctx.moxie.name] != null) ? c.resources.current[ctx.moxie.name] : ctx.moxie.max;
        c.resources.current[ctx.moxie.name] = Math.max(0, cur - spend);
      }
      c.log = Array.isArray(c.log) ? c.log : [];
      c.log.unshift(entry);
      if (c.log.length > 30) c.log.length = 30;
    }, { silent: true });
    _rollTray.roll = res;
    _rollTray.animating = true;
    var myAnim = ++_rollAnimId;
    EN.app.render();
    EN.ui.animatePoolRoll(document.querySelector('[data-roll="d20tray"]'), function () {
      if (myAnim !== _rollAnimId) return;   // superseded by a close/reopen/reroll
      _rollTray.animating = false; EN.app.render();
    });
  }
  // Pure Luck (a Scoundrel Gambit): after a roll comes up short, spend 1 Moxie
  // to treat the kept die as a 10, then apply modifiers normally.
  function rollTrayPureLuck() {
    var ctx = _rollTray.ctx, roll = _rollTray.roll;
    if (!roll || roll.pureLuck) return;
    var dice = roll.dice.slice(); dice[roll.keptIndex] = 10;
    var next = Object.assign({}, roll, {
      dice: dice, nat: 10, total: 10 + roll.flat,
      crit: roll.crit || (10 >= (roll.critMin || 20)), fumble: false, pureLuck: true
    });
    store.update(function (c) {
      if (ctx.moxie) {
        c.resources = c.resources || {}; c.resources.current = c.resources.current || {};
        var cur = (c.resources.current[ctx.moxie.name] != null) ? c.resources.current[ctx.moxie.name] : ctx.moxie.max;
        c.resources.current[ctx.moxie.name] = Math.max(0, cur - 1);
      }
      if (Array.isArray(c.log) && c.log.length) { c.log[0].nat = 10; c.log[0].total = next.total; c.log[0].crit = next.crit; c.log[0].fumble = false; c.log[0].pure = true; }
    }, { silent: true });
    _rollTray.roll = next;
    EN.app.render();
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && _rollTray.open) closeRollTray();
  });
  function trayStepBtn(txt, fn) {
    return el("button", { onclick: fn, style: { width: "26px", height: "26px", lineHeight: "1", background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border2)", borderRadius: "6px", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "15px" } }, txt);
  }
  /* ---------- crit/fumble fanfare: a one-shot cyberpunk beat the instant a
     roll settles as a nat 20 or nat 1 (see theme.css's "fx-" rules). Keyed
     off the roll object itself (roll._fxShown) so it plays exactly once no
     matter how many times the tray re-renders while that same roll is on
     screen (Moxie gambit toggles, unrelated app state, etc). ------------- */
  function fxSparks(n) {
    var arr = [];
    for (var i = 0; i < n; i++) {
      var angle = (360 / n) * i + (Math.random() * 18 - 9);
      var dist = 46 + Math.random() * 38;
      var delay = Math.random() * 80;
      arr.push(el("span.fx-spark" + (i % 2 ? ".cy" : ""), { style: { "--a": angle + "deg", "--d": dist + "px", animationDelay: delay + "ms" } }));
    }
    return arr;
  }
  function rollTrayModal() {
    if (!_rollTray.open || !_rollTray.ctx) return null;
    var ctx = _rollTray.ctx, spec = rollTraySpec();
    var flatSum = spec.mods.reduce(function (s, m) { return s + m.value; }, 0);
    var mode = _rollTray.mode, roll = _rollTray.roll, anim = _rollTray.animating;
    var diceN = (mode === "none" ? 1 : 2) + (_rollTray.lucky && ctx.luckyBreak ? 1 : 0);
    // live Moxie (spent by Gambits on commit, so read it fresh like ammo)
    var mox = ctx.moxie ? { name: ctx.moxie.name, max: ctx.moxie.max, cur: (function () {
      var a = store.active(), c = (a && a.resources && a.resources.current && a.resources.current[ctx.moxie.name] != null) ? a.resources.current[ctx.moxie.name] : ctx.moxie.max;
      return eng.clamp(c, 0, ctx.moxie.max);
    })() } : null;
    var MOXIE_CLR = "#FF2DAA";
    var modeLabel = mode === "edge" ? "Edge · roll 2d20, keep the higher"
      : mode === "snag" ? "Snag · roll 2d20, keep the lower" : "Straight · roll one d20";
    var modeColor = mode === "edge" ? "var(--accent)" : mode === "snag" ? "var(--danger)" : "var(--text2)";

    // --- live ammo: a fired weapon spends one shot per roll ---
    var ammo = null, canFire = true;
    if (ctx.usesAmmo) {
      var wIt = findWeapon(ctx.weaponName);
      if (wIt) { var ast = readAmmo(store.active(), wIt, ctx.weaponKey); ammo = { cur: ast.cur, cap: ast.cap, cost: costFor(wIt, ast.mode), mode: ast.mode, unit: wIt.ammoUnit || "" }; canFire = ast.cur >= ammo.cost; }
    }
    var againWord = ctx.usesAmmo ? "TAP TO FIRE AGAIN" : "TAP TO ROLL AGAIN";

    // --- hero: the d20(s) you tap to roll ---
    var diceEls, prompt, shouldPlayFx = false;
    if (roll) {
      var nat = roll.nat, crit = roll.crit != null ? roll.crit : nat >= spec.critMin,
          fumble = roll.fumble != null ? roll.fumble : nat === 1, total = roll.total != null ? roll.total : nat + flatSum;
      // the fanfare fires exactly once: the first render where this roll
      // object is shown settled as a crit/fumble. Flagging the roll object
      // itself (rather than some outside counter) means it naturally survives
      // re-renders triggered by anything else while this result is on screen.
      if ((crit || fumble) && !anim && !roll._fxShown) { roll._fxShown = true; shouldPlayFx = true; }
      diceEls = roll.dice.map(function (v, i) {
        var kept = i === roll.keptIndex;
        return EN.ui.d20Face(v, { size: 62, animating: anim,
          kept: kept && !anim, dropped: !kept && roll.dice.length > 1 && !anim,
          crit: kept && crit && !anim, fumble: kept && fumble && !anim,
          fxCrit: shouldPlayFx && kept && crit, fxFault: shouldPlayFx && kept && fumble });
      });
      // Gambit-specific epilogue: Press Your Luck's bet and Pure Luck's rescue
      var luckLine = null;
      if (!anim && roll.pureLuck) luckLine = el("div.mono", { style: { fontWeight: 700, letterSpacing: ".12em", fontSize: "11px", color: "var(--flow)", marginTop: "6px" }, text: "◆ PURE LUCK · TREATED AS 10" });
      else if (!anim && roll.press) {
        var pr = roll.press;
        luckLine = pr.die === 6 ? el("div.mono", { style: { fontWeight: 700, letterSpacing: ".12em", fontSize: "11px", color: "var(--gold)", marginTop: "6px" }, text: "◆ PRESS YOUR LUCK · 6 = AUTO CRIT" })
          : pr.bust ? el("div.mono", { style: { fontWeight: 700, letterSpacing: ".12em", fontSize: "11px", color: "var(--danger)", marginTop: "6px" }, text: "✖ PRESS YOUR LUCK · 1 = MOXIE LOST" + (ctx.countingCards ? " (KEEP NAT)" : "") })
          : el("div.mono", { style: { fontWeight: 700, letterSpacing: ".12em", fontSize: "11px", color: "var(--flow)", marginTop: "6px" }, text: "◆ PRESS YOUR LUCK · d6 +" + pr.bonus });
      }
      var totalNum = el("div.mono.fx-num", {
        dataset: { text: String(total) },
        style: { fontSize: "48px", fontWeight: 700, lineHeight: "1", position: "relative",
          color: crit ? "var(--gold)" : fumble ? "var(--danger)" : "var(--accent)", textShadow: "0 0 20px currentColor" },
        text: String(total)
      });
      prompt = anim ? el("div.mono", { style: { fontSize: "11px", letterSpacing: ".22em", color: "var(--text3)", marginTop: "12px", textTransform: "uppercase" }, text: "rolling…" })
        : el("div", { style: { marginTop: "10px" } }, [
            totalNum,
            el("div.mono", { style: { fontSize: "9px", letterSpacing: ".2em", color: canFire ? "var(--text3)" : "var(--warn)", marginTop: "5px" }, text: "TOTAL · " + (canFire ? againWord : "OUT OF AMMO") }),
            crit ? el("div.mono", { title: ctx.critNote || null, style: { fontWeight: 700, letterSpacing: ".14em", fontSize: "12px", color: "var(--gold)", marginTop: "7px" }, text: ctx.critLabel || "◆ CRITICAL HIT" })
              : fumble ? el("div.mono", { style: { fontWeight: 700, letterSpacing: ".14em", fontSize: "12px", color: "var(--danger)", marginTop: "7px" }, text: ctx.fumbleLabel || "✖ FUMBLE (NAT 1)" }) : null,
            crit && ctx.critNote ? el("div.mono", { style: { fontSize: "9.5px", color: "var(--text3)", marginTop: "5px", padding: "0 14px", lineHeight: 1.5 }, text: ctx.critNote }) : null,
            luckLine
          ]);
    } else {
      diceEls = [];
      for (var i = 0; i < diceN; i++) { var d = EN.ui.d20Face("", { size: 62 }); d.style.opacity = ".45"; diceEls.push(d); }
      prompt = el("div.mono", { style: { fontSize: "11px", letterSpacing: ".22em", color: canFire ? "var(--accent)" : "var(--warn)", marginTop: "12px", textTransform: "uppercase", opacity: ".9" }, text: canFire ? "Tap to roll" : "Out of ammo" });
    }
    var reloadBtn = (ctx.usesAmmo && !canFire) ? el("button.btn.sm", { style: { marginTop: "10px", color: "var(--warn)", borderColor: "var(--warn)" },
      onclick: function () { reloadWeapon(ctx.weaponKey); } }, "⟳ RELOAD") : null;
    var fxIsCrit = shouldPlayFx && crit, fxIsFault = shouldPlayFx && fumble;
    var heroFxClass = fxIsCrit ? ".fx-crit" : fxIsFault ? ".fx-fault" : "";
    var diceRow = el("div", { dataset: { roll: "d20tray" }, style: { position: "relative", display: "flex", gap: "14px", alignItems: "center", justifyContent: "center", minHeight: "64px" } },
      diceEls.concat(fxIsCrit ? fxSparks(14) : []));
    var hero = el("div" + heroFxClass, {
      title: canFire ? "Tap to roll" : "Reload to keep firing", role: "button",
      style: { textAlign: "center", padding: "22px 16px 18px", cursor: (anim || !canFire) ? "default" : "pointer", userSelect: "none",
        position: "relative", overflow: "hidden",
        background: "radial-gradient(220px 140px at 50% 36%, rgba(0,229,255," + (canFire ? ".10" : ".03") + "), transparent 70%)" },
      onclick: function () { if (!anim && canFire) rollTrayCommit(); }
    }, [
      shouldPlayFx ? el("div.fx-flash") : null,
      fxIsCrit ? el("div.fx-scan") : null,
      fxIsFault ? el("div.fx-noise") : null,
      diceRow,
      prompt, reloadBtn
    ]);

    // --- auto modifiers as one muted caption ---
    var autoParts = [];
    (ctx.baseMods || []).forEach(function (m, i) {
      if (i) autoParts.push(el("span", { style: { color: "var(--text4)", margin: "0 5px" }, text: "·" }));
      autoParts.push(el("span", { style: { color: "var(--text2)" }, text: m.label }));
      autoParts.push(document.createTextNode(" " + eng.fmtMod(m.value)));
    });
    var autoLine = el("div.mono", { style: { fontSize: "11px", color: "var(--text3)", textAlign: "center", padding: "12px 16px 0", letterSpacing: ".02em" } }, autoParts);

    // --- breakdown caption, only after a settled roll ---
    var breakdown = null;
    if (roll && !anim) {
      var bParts = [el("span", { style: { color: "var(--text)" }, text: "d20 " + roll.nat + (roll.pureLuck ? " (Pure Luck)" : "") })];
      (roll.mods || spec.mods).forEach(function (m) {
        bParts.push(el("span", { style: { color: "var(--text4)", margin: "0 5px" }, text: "·" }));
        bParts.push(document.createTextNode(m.label + " "));
        bParts.push(el("span", { style: { color: "var(--text)" }, text: eng.fmtMod(m.value) }));
      });
      breakdown = el("div.mono", { style: { fontSize: "10.5px", color: "var(--text3)", textAlign: "center", padding: "8px 16px 0" } }, bParts);
    }

    // --- hand off to the damage tray, carrying the crit from this attack ---
    var dmgHandoff = (roll && !anim && ctx.dmg) ? el("div", { style: { padding: "12px 16px 0", textAlign: "center" } }, [
      el("button.btn.sm", {
        title: crit ? "Roll damage with the weapon dice doubled" : "Roll this weapon's damage",
        style: { color: "var(--ember)", borderColor: "var(--ember)", padding: "6px 18px", fontSize: "12px", letterSpacing: ".06em" },
        onclick: function () { var dc = Object.assign({}, ctx.dmg, { crit: crit }); closeRollTray(); openDmgTray(dc); }
      }, (crit ? "◆ ROLL DAMAGE ×2 →" : "ROLL DAMAGE →")) ]) : null;

    // --- Pure Luck: a post-roll rescue for a roll that failed, never for a crit
    // (Press Your Luck can force a crit on a low natural die, so gate on !crit) ---
    var pureLuckBtn = (mox && ctx.pureLuck && roll && !anim && !roll.pureLuck && !roll.crit && (roll.nat < 10 || roll.fumble) && mox.cur >= 1)
      ? el("div", { style: { padding: "10px 16px 0", textAlign: "center" } }, [
          el("button.btn.sm", { title: "Spend 1 Moxie to treat the kept die as a 10",
            style: { color: MOXIE_CLR, borderColor: MOXIE_CLR, padding: "6px 16px", fontSize: "12px", letterSpacing: ".04em" },
            onclick: rollTrayPureLuck }, "◆ PURE LUCK · TREAT AS 10") ]) : null;

    // --- segmented Edge / None / Snag ---
    function segBtn(m, label, onColor) {
      var on = mode === m, blocked = m === "edge" && ctx.shaken;
      return el("button", {
        title: blocked ? "Shaken: you cannot benefit from Edge right now" : (m === "snag" && (ctx.autoSnag || []).length ? "Snag by default: " + ctx.autoSnag.join(", ") : ""),
        onclick: blocked ? null : function () { rollTraySetMode(m); },
        style: { flex: "1", padding: "9px 6px", border: "none", borderRight: m !== "snag" ? "1px solid var(--border)" : "none",
          cursor: blocked ? "not-allowed" : "pointer", fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: ".06em",
          opacity: blocked ? 0.4 : 1, fontWeight: on ? 700 : 400,
          color: on ? (m === "none" ? "var(--text)" : "var(--bg1)") : "var(--text3)",
          background: on ? onColor : "transparent" }
      }, label);
    }
    var seg = el("div", { style: { display: "flex", flex: "1 1 auto", border: "1px solid var(--border2)", borderRadius: "8px", overflow: "hidden", background: "var(--bg1)" } },
      [segBtn("edge", "EDGE", "var(--accent)"), segBtn("none", "NONE", "var(--text3)"), segBtn("snag", "SNAG", "var(--danger)")]);

    function ctrlRow(lbl, kids) {
      return el("div.row", { style: { gap: "12px", alignItems: "center" } },
        [el("span.mono", { style: { fontSize: "10px", letterSpacing: ".16em", color: "var(--text3)", width: "48px", flex: "0 0 auto" }, text: lbl })].concat(kids));
    }
    var helpPills = el("div.row", { style: { gap: "6px", flex: "1 1 auto" } }, [0, 2, 3, 4].map(function (v) {
      var on = _rollTray.help === v;
      return el("span", { style: { flex: "1", textAlign: "center", padding: "7px 0", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "12px",
        border: "1px solid var(--gold)", borderRadius: "7px", color: on ? "var(--bg1)" : "var(--gold)", background: on ? "var(--gold)" : "transparent", fontWeight: on ? 700 : 400 },
        title: v === 0 ? "No ally assist" : "Ally assist " + eng.fmtMod(v) + " (Proficient / Expertise / Mastery)",
        onclick: function () { _rollTray.help = v; _rollTray.roll = null; EN.app.render(); } }, v === 0 ? "none" : eng.fmtMod(v));
    }));
    var otherRow = el("div.row", { style: { gap: "8px", alignItems: "center" } }, [
      trayStepBtn("−", function () { _rollTray.other -= 1; _rollTray.roll = null; EN.app.render(); }),
      el("span.mono", { style: { fontSize: "13px", minWidth: "34px", textAlign: "center", color: _rollTray.other ? "var(--text)" : "var(--text3)" }, text: eng.fmtMod(_rollTray.other) }),
      trayStepBtn("+", function () { _rollTray.other += 1; _rollTray.roll = null; EN.app.render(); }),
      el("span.mono", { style: { fontSize: "10px", color: "var(--text4)", marginLeft: "auto" }, text: "optional · one-off ±" })
    ]);
    // --- MOXIE: the Gambits this character actually has, each spending 1 Moxie ---
    var moxRow = null;
    if (mox && (ctx.luckyBreak || ctx.pressLuck)) {
      var activeCost = (_rollTray.lucky ? 1 : 0) + (_rollTray.press ? 1 : 0);
      var gambitPill = function (on, label, fn) {
        var canEnable = on || mox.cur > activeCost;
        return el("span", { onclick: canEnable ? fn : null,
          title: canEnable ? "" : "Not enough Moxie",
          style: { display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 10px", borderRadius: "7px",
            cursor: canEnable ? "pointer" : "not-allowed", fontFamily: "var(--mono)", fontSize: "11px",
            border: "1px solid " + MOXIE_CLR, color: on ? "var(--bg1)" : MOXIE_CLR, background: on ? MOXIE_CLR : "transparent",
            opacity: canEnable ? 1 : 0.4, fontWeight: on ? 700 : 400 } }, label);
      };
      var pills = [];
      if (ctx.luckyBreak) pills.push(gambitPill(_rollTray.lucky, "Lucky Break ◆1", function () { _rollTray.lucky = !_rollTray.lucky; _rollTray.roll = null; EN.app.render(); }));
      if (ctx.pressLuck) pills.push(gambitPill(_rollTray.press, "Press Your Luck ◆1", function () { _rollTray.press = !_rollTray.press; _rollTray.roll = null; EN.app.render(); }));
      pills.push(el("span.mono", { style: { marginLeft: "auto", fontSize: "12px", color: mox.cur > 0 ? MOXIE_CLR : "var(--text4)" }, text: "◆ " + mox.cur + " / " + mox.max }));
      moxRow = ctrlRow("MOXIE", [el("div.row.wrap", { style: { gap: "6px", flex: "1 1 auto", alignItems: "center" } }, pills)]);
    }
    // --- ASPECT: a Skill Focus or Specialization the player declares this roll falls inside ---
    var aspRow = null;
    if ((ctx.aspectMods || []).length) {
      var aspPills = ctx.aspectMods.map(function (a) {
        var on = !!_rollTray.asp[a.key], col = a.color || "var(--gold)";
        return el("span", { title: a.title || "",
          onclick: function () { _rollTray.asp[a.key] = !on; _rollTray.roll = null; _rollAnimId++; EN.app.render(); },
          style: { display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 10px", borderRadius: "7px",
            cursor: "pointer", fontFamily: "var(--mono)", fontSize: "11px", border: "1px solid " + col,
            color: on ? "var(--bg1)" : col, background: on ? col : "transparent", fontWeight: on ? 700 : 400 } }, a.label);
      });
      aspRow = ctrlRow("ASPECT", [el("div.row.wrap", { style: { gap: "6px", flex: "1 1 auto", alignItems: "center" } }, aspPills)]);
    }
    var ctrls = el("div", { style: { padding: "16px", display: "flex", flexDirection: "column", gap: "13px", borderTop: "1px solid var(--border)", marginTop: "14px" } },
      [ctrlRow("ROLL", [seg]), ctrlRow("HELP", [helpPills]), ctrlRow("OTHER", [otherRow])].concat(aspRow ? [aspRow] : []).concat(moxRow ? [moxRow] : []));

    var foot = el("div.row.between", { style: { padding: "11px 16px", borderTop: "1px solid var(--border)", alignItems: "baseline" } }, [
      el("span.mono", { style: { fontSize: "11px", color: modeColor }, text: modeLabel }),
      el("span.mono", { style: { fontSize: "13px", color: "var(--text)" }, text: "MOD " + eng.fmtMod(flatSum) + (spec.critMin < 20 ? " · crit " + spec.critMin + "-20" : "") })
    ]);

    // --- ammo readout (fired weapons) + a compact recent-rolls strip ---
    var ammoLine = ammo ? el("div.mono", { style: { fontSize: "10px", color: "var(--text3)", textAlign: "center", padding: "6px 16px 0", letterSpacing: ".06em" } },
      ["AMMO ", el("span", { style: { color: ammo.cur === 0 ? "var(--danger)" : "var(--text2)" }, text: ammo.cur + " / " + ammo.cap }), document.createTextNode("  ·  −" + ammo.cost + "/shot")]) : null;
    var actv = store.active();
    var logList = (actv && Array.isArray(actv.log) ? actv.log : []).slice(0, 4);
    var recent = logList.length ? el("div", { style: { padding: "10px 16px 12px", borderTop: "1px solid var(--border)" } }, [
      el("div.mono", { style: { fontSize: "9px", letterSpacing: ".18em", color: "var(--text4)", marginBottom: "6px" }, text: "RECENT ROLLS" }),
      el("div", { style: { display: "flex", flexDirection: "column", gap: "3px" } }, logList.map(function (e) {
        return el("div.row.between", { style: { fontFamily: "var(--mono)", fontSize: "10.5px" } }, [
          el("span", { style: { color: "var(--text3)" }, text: e.w + (e.dmg ? " dmg" : (e.mode && e.mode !== "none" ? " · " + e.mode : "")) }),
          el("span", { style: { color: e.crit ? "var(--gold)" : e.fumble ? "var(--danger)" : "var(--text)" }, text: String(e.total) + (e.crit ? " ◆" : e.fumble ? " ✖" : "") })
        ]);
      }))
    ]) : null;

    // a glanceable ammo badge in the header, on top of the detailed AMMO
    // line further down (which keeps the "-1/shot" cost note): this one is
    // just the count, colored so low/empty ammo reads at a glance without
    // scrolling to the modifiers.
    var ammoBadge = ammo ? el("div.mono", {
      title: "Ammo: " + ammo.cur + " of " + ammo.cap + (ammo.unit ? " " + ammo.unit : "") + " · −" + ammo.cost + "/shot",
      style: { fontSize: "12px", fontWeight: 700, letterSpacing: ".03em", padding: "4px 10px", borderRadius: "999px", whiteSpace: "nowrap",
        border: "1px solid " + (ammo.cur === 0 ? "var(--danger)" : ammo.cur <= Math.ceil(ammo.cap * 0.25) ? "var(--warn)" : "var(--border2)"),
        color: ammo.cur === 0 ? "var(--danger)" : ammo.cur <= Math.ceil(ammo.cap * 0.25) ? "var(--warn)" : "var(--text2)" }
    }, ammo.cur + " / " + ammo.cap) : null;
    var header = el("div.row.between", { style: { alignItems: "center", padding: "13px 16px", borderBottom: "1px solid var(--border)", background: "linear-gradient(180deg, rgba(0,229,255,.04), transparent)" } }, [
      el("div", null, [
        el("div", { style: { fontFamily: "var(--disp)", fontWeight: 700, fontSize: "15.5px", letterSpacing: ".02em", color: "var(--text)" }, text: ctx.weaponName }),
        el("div.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".08em", marginTop: "2px" }, text: ctx.subtype.toUpperCase() })
      ]),
      el("div.row", { style: { gap: "8px", alignItems: "center" } }, [
        ammoBadge,
        el("button", { title: "Close (Esc)", onclick: closeRollTray, style: { background: "transparent", border: "none", color: "var(--text4)", fontSize: "19px", cursor: "pointer", lineHeight: "1", padding: "2px 5px" } }, "✕")
      ])
    ]);

    return el("div", {
      style: { position: "fixed", inset: "0", zIndex: "4000", background: "rgba(4,7,11,.74)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
      onclick: function (e) { if (e.target === e.currentTarget) closeRollTray(); }
    }, [
      el("div", { style: { width: "min(430px, 96vw)", maxHeight: "94vh", overflowY: "auto", borderRadius: "12px",
        background: "linear-gradient(180deg, var(--bg2), var(--bg1))", border: "1px solid var(--border2)",
        boxShadow: "0 20px 60px rgba(0,0,0,.55), 0 0 40px rgba(0,229,255,.10)" } }, [header, hero, autoLine, ammoLine, breakdown, dmgHandoff, pureLuckBtn, ctrls, foot, recent])
    ]);
  }

  /* ---------- Damage tray: the companion roller for weapon damage --------
     A crit doubles the weapon dice; Cheap Shot and the versatile two-handed
     die are toggles. Opened off a weapon's DMG box, or handed off from the
     attack tray carrying the crit. Square dice, to read differently from the
     hexagonal d20. */
  var _dmgTray = { open: false, ctx: null, crit: false, cheap: false, twoHand: false, roll: null, animating: false };
  var _dmgAnimId = 0;
  function openDmgTray(ctx) {
    _dmgAnimId++;
    // twoHand opens on the grip the row is already showing, rather than resetting to
    // one-handed every time: the grip is a stored fact about how you are holding the
    // weapon, not a per-roll question.
    _dmgTray = { open: true, ctx: ctx, crit: !!ctx.crit, cheap: false,
                 twoHand: !!(ctx.grip && ctx.grip.twoHanded), roll: null, animating: false };
    EN.app.render();
  }
  function closeDmgTray() { _dmgAnimId++; _dmgTray.open = false; _dmgTray.roll = null; _dmgTray.animating = false; EN.app.render(); }
  function dmgTrayReset() { _dmgTray.roll = null; EN.app.render(); }   // a toggle changed the dice
  function dmgTraySpec() {
    var ctx = _dmgTray.ctx || {};
    var dice = (_dmgTray.twoHand && ctx.versatile) ? ctx.versatile : ctx.dice;
    var bonus = [];
    if (_dmgTray.cheap && ctx.cheapEligible) bonus.push({ n: ctx.cheapDice, sides: 6, label: "Cheap Shot" });
    return { dice: dice, flat: ctx.flat || 0, crit: _dmgTray.crit, bonus: bonus, types: ctx.types || [] };
  }
  function dmgTrayCommit() {
    var res = eng.rollDamage(dmgTraySpec());
    _dmgTray.roll = res; _dmgTray.animating = true;
    var myAnim = ++_dmgAnimId;
    store.update(function (c) {
      c.log = Array.isArray(c.log) ? c.log : [];
      c.log.unshift({ w: _dmgTray.ctx.weaponName, dmg: true, total: res.total, crit: res.crit, t: Date.now() });
      if (c.log.length > 30) c.log.length = 30;
    }, { silent: true });
    EN.app.render();
    EN.ui.animatePoolRoll(document.querySelector('[data-roll="dmgtray"]'), function () {
      if (myAnim !== _dmgAnimId) return;
      _dmgTray.animating = false; EN.app.render();
    });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && _dmgTray.open) closeDmgTray(); });
  // damage dice reuse the shared physical-die art (EN.ui.dieFaceSvg), so the d4
  // through d12 outlines here match the #GRID dice-pool set. The shape carries
  // the die size; Cheap Shot dice recolor to ember.
  function dmgDie(value, sides, opts) {
    opts = opts || {};
    var col = opts.cheap ? "var(--ember)" : "var(--accent)";
    var svg = EN.ui.dieFaceSvg(sides, {
      size: opts.cheap ? 34 : 44, edge: col, num: "var(--text)", value: value, animating: opts.animating
    });
    return el("span.tb-die" + (opts.animating ? ".rolling" : ""), {
      html: svg, dataset: opts.animating ? { die: "1", final: String(value), sides: String(sides) } : null,
      style: { display: "inline-flex", opacity: opts.dim ? 0.5 : 1 } });
  }
  function dmgFormula(ctx, st) {
    var md = /(\d+)d(\d+)/.exec((st.twoHand && ctx.versatile) ? ctx.versatile : ctx.dice);
    var parts = [];
    if (md) parts.push((parseInt(md[1], 10) * (st.crit ? 2 : 1)) + "d" + md[2]);
    if (st.cheap && ctx.cheapEligible) parts.push(ctx.cheapDice + "d6");
    var s = parts.join(" + ") || "no dice";
    if (ctx.flat) s += " " + eng.fmtMod(ctx.flat);
    if (st.crit) s += "  (crit)";
    return s;
  }
  /* ---- Defensive Impulse tray -------------------------------------------
     Rolls an active defense and resolves it against the incoming damage, so the
     player never does the subtraction by hand. Defenses that reduce damage roll
     their dice plus any flat bonuses and net it against the hit; Dodge instead
     raises Defense, so it reports the new number rather than a reduction. Some
     defenses trigger only when the damage is fully absorbed (Resurge's rebound)
     or scale off the roll itself (Siphon's Vigor). */
  var _defTray = { open: false, spec: null, incoming: "", roll: null, animating: false };
  var _defAnimId = 0;
  function openDefTray(spec) { _defAnimId++; _defTray = { open: true, spec: spec, incoming: "", roll: null, animating: false }; EN.app.render(); }
  function closeDefTray() { _defAnimId++; _defTray = { open: false, spec: null, incoming: "", roll: null, animating: false }; EN.app.render(); }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && _defTray.open) closeDefTray(); });
  function defTrayCommit() {
    var s = _defTray.spec, parts = [], total = 0;
    (s.dice || []).forEach(function (dd) {
      for (var i = 0; i < dd.n; i++) {
        var r = 1 + Math.floor(Math.random() * dd.sides);
        parts.push({ label: dd.label || ("d" + dd.sides), value: r, sides: dd.sides }); total += r;
      }
    });
    (s.flat || []).forEach(function (f) { parts.push({ label: f.label, value: f.value, flat: true }); total += f.value; });
    _defTray.roll = { parts: parts, total: total };
    EN.app.render();
  }
  function defTrayCommitAnimated() {
    _defTray.animating = true; defTrayCommit();
    var myId = ++_defAnimId;
    EN.ui.animatePoolRoll(document.querySelector('[data-roll="deftray"]'), function () {
      if (myId !== _defAnimId) return;
      _defTray.animating = false; EN.app.render();
    });
  }
  function defTrayModal() {
    if (!_defTray.open || !_defTray.spec) return null;
    var s = _defTray.spec, roll = _defTray.roll, anim = _defTray.animating;
    var isDefense = s.mode === "defense";
    var dieText = (s.dice || []).map(function (dd) { return dd.n + "d" + dd.sides; }).concat(
      (s.flat || []).filter(function (f) { return f.value; }).map(function (f) { return eng.fmtMod(f.value); })).join(" + ") || "no roll";

    // hero: the dice you tap, mirroring the attack tray
    var diceEls = [], prompt;
    if (isDefense) {
      diceEls = [el("div.mono", { style: { fontSize: "48px", fontWeight: 700, lineHeight: "1", color: "var(--accent)", textShadow: "0 0 20px currentColor" }, text: eng.fmtMod(s.bonus) })];
      prompt = el("div.mono", { style: { fontSize: "9px", letterSpacing: ".2em", color: "var(--text3)", marginTop: "8px" }, text: "DEFENSE BONUS · NO ROLL" });
    } else if (roll) {
      diceEls = roll.parts.filter(function (pp) { return !pp.flat; }).map(function (pp) {
        return dmgDie(pp.value, pp.sides, { animating: anim });
      });
      if (!diceEls.length) diceEls.push(el("span.mono", { style: { color: "var(--text3)", fontSize: "12px" }, text: "no dice" }));
      prompt = anim ? el("div.mono", { style: { fontSize: "11px", letterSpacing: ".22em", color: "var(--text3)", marginTop: "12px" }, text: "ROLLING..." })
        : el("div", { style: { marginTop: "10px" } }, [
            el("div.mono", { style: { fontSize: "48px", fontWeight: 700, lineHeight: "1", color: "var(--accent)", textShadow: "0 0 20px currentColor" }, text: String(roll.total) }),
            el("div.mono", { style: { fontSize: "9px", letterSpacing: ".2em", color: "var(--text3)", marginTop: "5px" }, text: "MITIGATED · TAP TO ROLL AGAIN" })
          ]);
    } else {
      (s.dice || []).forEach(function (dd) {
        for (var i = 0; i < dd.n; i++) diceEls.push(dmgDie("", dd.sides, { dim: true }));
      });
      if (!diceEls.length) diceEls.push(el("span.mono", { style: { color: "var(--text3)", fontSize: "12px" }, text: "no dice" }));
      prompt = el("div.mono", { style: { fontSize: "11px", letterSpacing: ".22em", color: "var(--accent)", marginTop: "12px", textTransform: "uppercase", opacity: ".9" }, text: "Tap to roll" });
    }
    var diceRow = el("div", { dataset: { roll: "deftray" }, style: { display: "flex", gap: "10px", alignItems: "center", justifyContent: "center", flexWrap: "wrap", minHeight: "54px" } }, diceEls);
    var hero = el("div", {
      title: isDefense ? "" : "Tap to roll", role: "button",
      style: { textAlign: "center", padding: "20px 16px 16px", cursor: (anim || isDefense) ? "default" : "pointer", userSelect: "none",
        position: "relative", overflow: "hidden",
        background: "radial-gradient(220px 140px at 50% 36%, rgba(0,229,255,.10), transparent 70%)" },
      onclick: function () { if (!anim && !isDefense) defTrayCommitAnimated(); }
    }, [diceRow, prompt]);

    // the parts caption, in the attack tray's voice
    var autoParts = [];
    (s.dice || []).concat((s.flat || []).filter(function (f) { return f.value; })).forEach(function (m, i) {
      if (i) autoParts.push(el("span", { style: { color: "var(--text4)", margin: "0 5px" }, text: "·" }));
      var notation = m.sides ? (m.n + "d" + m.sides) : eng.fmtMod(m.value);
      // a die whose only label is its own size ("d6") would read "d6 1d6"
      var named = m.label && m.label !== "d" + m.sides;
      if (named) autoParts.push(el("span", { style: { color: "var(--text2)" }, text: m.label + " " }));
      autoParts.push(document.createTextNode(notation));
    });
    var autoLine = el("div.mono", { style: { fontSize: "11px", color: "var(--text3)", textAlign: "center", padding: "12px 16px 0" } }, autoParts);

    /* Which implement you are parrying with. The rule is explicit that the choice is
       yours ("if you are dual-wielding, you must choose which weapon you parry with"),
       so this offers every legal source rather than picking one for you. Ordered best
       first, so the default is already the strongest and most hits need no tap.
       Switching clears any roll on screen: it was rolled with the other die. */
    var sourceRow = null;
    if ((s.sources || []).length > 1) {
      sourceRow = el("div", { style: { padding: "12px 16px 0" } }, [
        el("div.mono", { style: { fontSize: "9px", letterSpacing: ".18em", color: "var(--text3)", textAlign: "center", marginBottom: "6px" }, text: "PARRY WITH" }),
        el("div.row.wrap", { style: { gap: "6px", justifyContent: "center" } }, s.sources.map(function (src) {
          var on = src.key === s.sourceKey;
          var face = src.sides ? src.n + "d" + src.sides : "+" + (src.flat || 0);
          return el("button.btn.sm" + (on ? ".primary" : ""), {
            style: { padding: "2px 9px", fontSize: "11px" },
            title: src.kind === "unarmed" ? "Bare hands are a legal parry" : src.label,
            onclick: function () {
              if (on) return;
              s.applySource(src.key);
              _defTray.roll = null; _defTray.animating = false;   // that total belonged to the other die
              EN.app.render();
            }
          }, src.label + " " + face);
        }))
      ]);
    }

    var breakdown = (roll && !anim) ? el("div.mono", { style: { fontSize: "10.5px", color: "var(--text3)", textAlign: "center", padding: "8px 16px 0" } },
      roll.parts.map(function (pp, i) {
        return el("span", null, [
          i ? el("span", { style: { color: "var(--text4)", margin: "0 5px" }, text: "·" } ) : null,
          document.createTextNode((pp.sides && pp.label === "d" + pp.sides ? "d" + pp.sides : pp.label) + " "),
          el("span", { style: { color: "var(--text)" }, text: pp.flat ? eng.fmtMod(pp.value) : String(pp.value) })
        ]);
      })) : null;

    function outcomeText() {
      var inc = parseInt(_defTray.incoming, 10);
      if (isDefense) return "Defense " + (s.baseDefense + s.bonus) + " against this hit (was " + s.baseDefense + "). If it now misses, the attack ends here.";
      if (anim) return "Resolving...";                     // don't spoil the total while the dice are still tumbling
      if (isNaN(inc) || inc < 0) return "Enter the incoming damage to resolve it.";
      if (!roll) return "Roll to resolve against " + inc + " damage.";
      var net = Math.max(0, inc - roll.total);
      var out = inc + " reduced by " + roll.total + " to " + net + " damage";
      if (net === 0 && s.onZero) out += ". " + s.onZero;
      if (s.onRoll) out += ". " + s.onRoll(roll.total);
      return out;
    }
    var inp = el("input.mono", { type: "number", min: "0", value: _defTray.incoming, placeholder: "0",
      style: { width: "76px", textAlign: "center", padding: "5px" },
      oninput: function () { _defTray.incoming = this.value; var o = document.getElementById("def-outcome"); if (o) o.textContent = outcomeText(); } });
    var ctrls = isDefense ? null : el("div.row.wrap", { style: { gap: "8px", alignItems: "center", justifyContent: "center", padding: "12px 16px 0" } }, [
      el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".12em" }, text: "INCOMING" }), inp,
      el("button.btn.sm", { onclick: defTrayCommitAnimated, style: { color: "var(--accent)", borderColor: "var(--accent)" } }, roll ? "REROLL" : "ROLL")
    ]);
    var outcome = el("div#def-outcome.mono", { style: { margin: "12px 16px 0", padding: "9px 11px", borderRadius: "6px",
      background: "rgba(0,229,255,.06)", border: "1px solid var(--border2)", fontSize: "12px", color: "var(--text)", lineHeight: 1.5, textAlign: "center" }, text: outcomeText() });

    var header = el("div.row.between", { style: { alignItems: "flex-start", gap: "10px", padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" } }, [
      el("div", null, [
        el("div", { style: { fontFamily: "var(--disp)", fontWeight: 700, fontSize: "15.5px", letterSpacing: ".02em", color: "var(--text)" }, text: s.name }),
        el("div.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".08em", marginTop: "2px" }, text: "DEFENSIVE IMPULSE" })
      ]),
      el("button", { title: "Close (Esc)", onclick: closeDefTray, style: { background: "transparent", border: "none", color: "var(--text4)", fontSize: "19px", cursor: "pointer", lineHeight: "1", padding: "2px 5px" } }, "✕")
    ]);
    var foot = el("div.row.between", { style: { alignItems: "center", padding: "12px 16px 14px", borderTop: "1px solid var(--border)", marginTop: "14px" } }, [
      el("span.mono", { style: { fontSize: "10.5px", color: "var(--text3)" }, text: isDefense ? "No roll" : dieText }),
      el("button.btn.sm", { onclick: closeDefTray }, "DONE")
    ]);
    var note = s.note ? el("p.help", { style: { margin: "10px 16px 0", textAlign: "center" }, text: s.note }) : null;

    return el("div", {
      style: { position: "fixed", inset: "0", zIndex: "4000", background: "rgba(4,7,11,.74)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
      onclick: function (e) { if (e.target === e.currentTarget) closeDefTray(); }
    }, [
      el("div", { style: { width: "min(430px, 96vw)", maxHeight: "94vh", overflowY: "auto", borderRadius: "12px",
        background: "linear-gradient(180deg, var(--bg2), var(--bg1))", border: "1px solid var(--border2)",
        boxShadow: "0 20px 60px rgba(0,0,0,.55), 0 0 40px rgba(0,229,255,.10)" } }, [header, hero, autoLine, breakdown, sourceRow, ctrls, outcome, note, foot])
    ]);
  }

  function dmgTrayModal() {
    if (!_dmgTray.open || !_dmgTray.ctx) return null;
    var ctx = _dmgTray.ctx, roll = _dmgTray.roll, anim = _dmgTray.animating;
    var typeStr = (ctx.types && ctx.types.length) ? ctx.types.join(" + ") : "";
    var activeDice = (_dmgTray.twoHand && ctx.versatile) ? ctx.versatile : ctx.dice;
    var md = /(\d+)d(\d+)/.exec(activeDice), canRoll = !!md;

    var diceEls = [], prompt;
    if (roll) {
      roll.groups.forEach(function (g) {
        var isCheap = g.label.indexOf("Cheap") === 0;
        g.rolls.forEach(function (v) { diceEls.push(dmgDie(v, g.sides, { cheap: isCheap, animating: anim })); });
      });
      if (!diceEls.length) diceEls.push(el("span.mono", { style: { color: "var(--text3)", fontSize: "12px" }, text: "no damage dice" }));
      prompt = anim ? el("div.mono", { style: { fontSize: "11px", letterSpacing: ".22em", color: "var(--text3)", marginTop: "12px", textTransform: "uppercase" }, text: "rolling…" })
        : el("div", { style: { marginTop: "10px" } }, [
            el("div.mono", { style: { fontSize: "46px", fontWeight: 700, lineHeight: "1", color: roll.crit ? "var(--gold)" : "var(--ember)", textShadow: "0 0 20px currentColor" }, text: String(roll.total) }),
            el("div.mono", { style: { fontSize: "9px", letterSpacing: ".18em", color: "var(--text3)", marginTop: "5px" }, text: "DAMAGE" + (typeStr ? " · " + typeStr.toUpperCase() : "") + " · TAP TO ROLL AGAIN" }),
            roll.crit ? el("div.mono", { style: { fontWeight: 700, letterSpacing: ".14em", fontSize: "12px", color: "var(--gold)", marginTop: "7px" }, text: "◆ DOUBLED ON CRIT" }) : null
          ]);
    } else {
      if (md) { var wc = parseInt(md[1], 10) * (_dmgTray.crit ? 2 : 1); for (var i = 0; i < wc; i++) diceEls.push(dmgDie("", parseInt(md[2], 10), { dim: true })); }
      if (_dmgTray.cheap && ctx.cheapEligible) for (var j = 0; j < ctx.cheapDice; j++) diceEls.push(dmgDie("", 6, { cheap: true, dim: true }));
      if (!diceEls.length) diceEls.push(el("span.mono", { style: { color: "var(--text3)", fontSize: "12px" }, text: "no damage" }));
      prompt = el("div.mono", { style: { fontSize: "11px", letterSpacing: ".22em", color: canRoll ? "var(--ember)" : "var(--text3)", marginTop: "12px", textTransform: "uppercase" }, text: canRoll ? "Tap to roll damage" : "No damage" });
    }
    var hero = el("div", { title: "Tap to roll damage", role: "button",
      style: { textAlign: "center", padding: "22px 16px 16px", cursor: (anim || !canRoll) ? "default" : "pointer", userSelect: "none",
        background: "radial-gradient(230px 145px at 50% 38%, rgba(255,107,53,.11), transparent 70%)" },
      onclick: function () { if (!anim && canRoll) dmgTrayCommit(); } },
      [ el("div", { dataset: { roll: "dmgtray" }, style: { display: "flex", gap: "10px", alignItems: "center", justifyContent: "center", flexWrap: "wrap", minHeight: "54px" } }, diceEls), prompt ]);

    var autoParts = [];
    if (ctx.flat) { autoParts.push(el("span", { style: { color: "var(--text2)" }, text: ctx.flatLabel })); autoParts.push(document.createTextNode(" " + eng.fmtMod(ctx.flat) + " on hit")); }
    if (typeStr) { if (autoParts.length) autoParts.push(el("span", { style: { color: "var(--text4)", margin: "0 5px" }, text: "·" })); autoParts.push(document.createTextNode(typeStr)); }
    var autoLine = autoParts.length ? el("div.mono", { style: { fontSize: "11px", color: "var(--text3)", textAlign: "center", padding: "12px 16px 0" } }, autoParts) : null;

    var breakdown = null;
    if (roll && !anim && roll.groups.length) {
      var bParts = [];
      roll.groups.forEach(function (g, i) { if (i) bParts.push(el("span", { style: { color: "var(--text4)", margin: "0 5px" }, text: "·" })); bParts.push(document.createTextNode(g.label + " ")); bParts.push(el("span", { style: { color: "var(--text)" }, text: String(g.subtotal) })); });
      if (roll.flat) { bParts.push(el("span", { style: { color: "var(--text4)", margin: "0 5px" }, text: "·" })); bParts.push(document.createTextNode(ctx.flatLabel + " ")); bParts.push(el("span", { style: { color: "var(--text)" }, text: eng.fmtMod(roll.flat) })); }
      breakdown = el("div.mono", { style: { fontSize: "10.5px", color: "var(--text3)", textAlign: "center", padding: "8px 16px 0" } }, bParts);
    }

    function tog(on, label, col, fn) {
      return el("span", { onclick: fn, style: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 11px", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "11.5px", borderRadius: "8px",
        border: "1px solid " + col, color: on ? "var(--bg1)" : col, background: on ? col : "transparent", fontWeight: on ? 700 : 400 } }, label);
    }
    var togs = [ tog(_dmgTray.crit, "◆ Critical ×2 dice", "var(--gold)", function () { _dmgTray.crit = !_dmgTray.crit; dmgTrayReset(); }) ];
    if (ctx.cheapEligible) togs.push(tog(_dmgTray.cheap, "Cheap Shot +" + ctx.cheapDice + "d6", "var(--ember)", function () { _dmgTray.cheap = !_dmgTray.cheap; dmgTrayReset(); }));
    // offered only when the grip is a real choice; a weapon forced two-handed shows
    // what is holding it that way instead of a switch that cannot move
    if (ctx.versatile && ctx.grip && ctx.grip.canToggle) {
      togs.push(tog(_dmgTray.twoHand, "Two-handed (" + ctx.versatile + ")", "var(--accent)", function () { _dmgTray.twoHand = !_dmgTray.twoHand; dmgTrayReset(); }));
    } else if (ctx.versatile && ctx.grip && ctx.grip.forcedBy) {
      togs.push(el("span.chip", { title: ctx.grip.why, style: { color: "var(--warn)", borderColor: "var(--warn)" } },
        "TWO-HANDED ONLY · " + ctx.versatile));
    }
    var togRow = el("div", { style: { padding: "14px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", flexWrap: "wrap" } }, togs);

    var foot = el("div.row.between", { style: { padding: "11px 16px", borderTop: "1px solid var(--border)", alignItems: "baseline" } }, [
      el("span.mono", { style: { fontSize: "11px", color: "var(--text2)" }, text: dmgFormula(ctx, _dmgTray) }),
      el("span.mono", { style: { fontSize: "11px", color: typeStr ? "var(--ember)" : "var(--text3)" }, text: typeStr || "no type" })
    ]);

    var actv = store.active();
    var logList = (actv && Array.isArray(actv.log) ? actv.log : []).slice(0, 4);
    var recent = logList.length ? el("div", { style: { padding: "10px 16px 12px", borderTop: "1px solid var(--border)" } }, [
      el("div.mono", { style: { fontSize: "9px", letterSpacing: ".18em", color: "var(--text4)", marginBottom: "6px" }, text: "RECENT ROLLS" }),
      el("div", { style: { display: "flex", flexDirection: "column", gap: "3px" } }, logList.map(function (e) {
        return el("div.row.between", { style: { fontFamily: "var(--mono)", fontSize: "10.5px" } }, [
          el("span", { style: { color: "var(--text3)" }, text: e.w + (e.dmg ? " dmg" : (e.mode && e.mode !== "none" ? " · " + e.mode : "")) }),
          el("span", { style: { color: e.crit ? "var(--gold)" : e.fumble ? "var(--danger)" : "var(--text)" }, text: String(e.total) + (e.crit ? " ◆" : e.fumble ? " ✖" : "") })
        ]);
      }))
    ]) : null;

    var header = el("div.row.between", { style: { alignItems: "center", padding: "13px 16px", borderBottom: "1px solid var(--border)", background: "linear-gradient(180deg, rgba(255,107,53,.05), transparent)" } }, [
      el("div", null, [
        el("div", { style: { fontFamily: "var(--disp)", fontWeight: 700, fontSize: "15.5px", letterSpacing: ".02em", color: "var(--text)" }, text: ctx.weaponName }),
        el("div.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".08em", marginTop: "2px" }, text: ("DAMAGE · " + activeDice + (typeStr ? " " + typeStr : "")).toUpperCase() })
      ]),
      el("button", { title: "Close (Esc)", onclick: closeDmgTray, style: { background: "transparent", border: "none", color: "var(--text4)", fontSize: "19px", cursor: "pointer", lineHeight: "1", padding: "2px 5px" } }, "✕")
    ]);

    return el("div", {
      style: { position: "fixed", inset: "0", zIndex: "4001", background: "rgba(4,7,11,.74)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
      onclick: function (e) { if (e.target === e.currentTarget) closeDmgTray(); }
    }, [
      el("div", { style: { width: "min(430px, 96vw)", maxHeight: "94vh", overflowY: "auto", borderRadius: "12px",
        background: "linear-gradient(180deg, var(--bg2), var(--bg1))", border: "1px solid #3a2b22",
        boxShadow: "0 20px 60px rgba(0,0,0,.55), 0 0 40px rgba(255,107,53,.12)" } }, [header, hero, autoLine, breakdown, togRow, foot, recent])
    ]);
  }

  /* ---------- pointer-drag helpers for Freelancer panel reorder ---------- */
  function _onDragMove(e) {
    if (!_drag) return;
    _drag.ghost.style.left = (e.clientX - _drag.offX) + "px";
    _drag.ghost.style.top = (e.clientY - _drag.offY) + "px";
    var cx = e.clientX, cy = e.clientY, targetIdx = _drag.currentIdx;
    _drag.wrapEls.forEach(function (w, i) {
      if (w === _drag.ph) return;
      var r = w.getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) targetIdx = i;
    });
    if (targetIdx === _drag.currentIdx) return;
    _drag.wrapEls.forEach(function (w) { w.style.transition = "none"; w.style.transform = ""; });
    _drag.container.getBoundingClientRect();
    var snapshots = new Map();
    _drag.wrapEls.forEach(function (w) { snapshots.set(w, w.getBoundingClientRect()); });
    var fromIdx = _drag.currentIdx;
    _drag.wrapEls.splice(fromIdx, 1);
    _drag.wrapEls.splice(targetIdx, 0, _drag.ph);
    _drag.container.insertBefore(_drag.ph, _drag.wrapEls[targetIdx + 1] || null);
    _drag.currentIdx = targetIdx;
    _drag.wrapEls.forEach(function (w) {
      var before = snapshots.get(w), after = w.getBoundingClientRect();
      var dx = before.left - after.left, dy = before.top - after.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      w.style.transition = "none";
      w.style.transform = "translate(" + dx + "px," + dy + "px)";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          w.style.transition = "transform 0.18s cubic-bezier(0.25,0.46,0.45,0.94)";
          w.style.transform = "";
        });
      });
    });
  }
  function _onDragUp() { _finishDrag(true); }
  function _onDragCancel() { _finishDrag(false); }
  function _finishDrag(commit) {
    if (!_drag) return;
    document.removeEventListener("pointermove", _onDragMove);
    document.removeEventListener("pointerup", _onDragUp);
    document.removeEventListener("pointercancel", _onDragCancel);
    document.body.removeChild(_drag.ghost);
    _drag.handle.style.cursor = "grab";
    _drag.wrapEls.forEach(function (w) { w.style.transition = ""; w.style.transform = ""; });
    var phIdx = _drag.wrapEls.indexOf(_drag.ph);
    _drag.container.insertBefore(_drag.sourceWrap, _drag.ph);
    _drag.sourceWrap.style.display = "";
    _drag.container.removeChild(_drag.ph);
    _drag.wrapEls[phIdx] = _drag.sourceWrap;
    if (commit) {
      var newLayout = _drag.wrapEls.map(function (w) { return { key: w._slot.key, w: w._slot.w }; });
      saveLayout(newLayout);
    }
    _drag = null;
    EN.app.render();
  }

  /* ---------- current-state helpers (wound-adjusted vitality) ---------- */
  function state(ch, d) {
    var woundsMax = d.woundsMax;
    var wounds = (ch.wounds && ch.wounds.current != null) ? ch.wounds.current : woundsMax;
    wounds = eng.clamp(wounds, 0, woundsMax);
    var woundsLost = woundsMax - wounds;
    // Wound damage reduces both current and maximum Vitality
    var vitMax = Math.max(0, (d.vitalityMax || 0) - woundsLost);
    var vit = (ch.vitality && ch.vitality.current != null) ? ch.vitality.current : vitMax;
    vit = eng.clamp(vit, 0, vitMax);
    var vigor = (ch.vitality && ch.vitality.temp) || 0;
    var rdMax = d.resilienceMax, rdSpent = (ch.resilience && ch.resilience.spent) || 0;
    return {
      vit: vit, vitMax: vitMax, vigor: vigor,
      wounds: wounds, woundsMax: woundsMax,
      bloodied: vit <= 0 && wounds > 0,
      critical: wounds <= d.critThreshold,
      dying: wounds <= 0 && !ch.stable,
      stable: wounds <= 0 && !!ch.stable,
      rd: Math.max(0, rdMax - rdSpent), rdMax: rdMax
    };
  }

  /* ---------- damage / heal application (per the damage pipeline) ---------- */
  function applyDamage(ch, d, amount) {
    if (!amount || amount <= 0) return;
    store.update(function (c) {
      var s = state(c, d);
      c.lastDamage = amount;   // record the hit so the #GRID Stability DC auto-pulls it
      var left = amount;
      // "Taking damage while Stable returns you to Dying." Any damage does it, not
      // only a hit that reaches the Wound track.
      if (amount > 0 && c.stable) c.stable = false;
      // Vigor absorbs first
      var vig = Math.min(s.vigor, left);
      c.vitality.temp = s.vigor - vig; left -= vig;
      // then Vitality
      var hit = Math.min(s.vit, left);
      var newVit = s.vit - hit; left -= hit;
      c.vitality.current = newVit;
      // overflow becomes Wound damage (also lowers max vitality via woundsLost)
      if (left > 0) {
        var newWounds = Math.max(0, s.wounds - left);
        c.wounds.current = newWounds;
      } else {
        c.wounds.current = s.wounds;
      }
      // dying: any damage counts as one failed Death Save
      if (s.dying) { c.deathSaves.f = Math.min(3, (c.deathSaves.f || 0) + 1); }
    });
  }
  function applyHeal(ch, d, amount) {
    if (!amount || amount <= 0) return;
    store.update(function (c) {
      var s = state(c, d);
      c.vitality.current = Math.min(s.vitMax, s.vit + amount);
    });
  }
  function healWounds(ch, d, amount) {
    if (!amount) return;
    store.update(function (c) {
      var s = state(c, d);
      var nw = eng.clamp(s.wounds + amount, 0, s.woundsMax);
      c.wounds.current = nw;
      if (nw > 0 && s.wounds <= 0) { c.stable = false; c.deathSaves = { s: 0, f: 0 }; }  // restoring a Wound ends Dying/Stable
      // wound healing raises max vitality back; clamp current
      var vitMax = Math.max(0, (d.vitalityMax || 0) - (s.woundsMax - nw));
      c.vitality.current = Math.min(s.vit, vitMax);
    });
  }

  /* ---------- rests ---------- */
  function hasCyber(c, key) {
    return ((c && c.cyberware) || []).some(function (cw) { return cw && typeof cw === "object" && cw.key === key; });
  }
  function shortRest(ch, d) {
    store.update(function (c) {
      var s = state(c, d);
      // Static Threshold 5 ("Dead Battery") removes the free die you would otherwise
      // get for starting a Short Rest with none left.
      var deadBattery = !!(d.chromeTax && d.chromeTax.deadBattery);
      if (s.rd <= 0 && !deadBattery) { c.resilience.spent = Math.max(0, d.resilienceMax - 1); }
      // refresh class resource pool
      if (d.resource) c.resources.current[d.resource.name] = d.resource.max;
      // Shaper: regain FP equal to Flow modifier (min 1), plus 1 from a Resonance Crown
      if (d.flow) {
        var cur = (c.flow.current != null) ? c.flow.current : d.flow.max;
        var crownFp = hasCyber(c, "resonanceCrown") ? 1 : 0;
        c.flow.current = Math.min(d.flow.max, cur + Math.max(1, d.flow.attack) + crownFp);
      }
      // limited-use features keyed to Short Rest / Encounter / Scene refresh now
      if (c.featureUses) Object.keys(c.featureUses).forEach(function (k) {
        if ((c.featureUses[k] || {}).r !== "Long Rest") delete c.featureUses[k];
      });
    });
    toast("Short Rest taken; resource refreshed. Spend Resilience Dice to heal.");
  }
  /* ---- the story calendar -------------------------------------------------
     Everything in the app that counts down "one day per Long Rest" advances
     here, so a Long Rest and a stretch of downtime move the same clocks. Each
     system is ticked one day at a time rather than by arithmetic, because their
     per-day rules are not linear: a lease that comes due stops counting until it
     is paid, and a Persona stops at 0 rather than going negative.

     Register any future day-based timer in this one list. */
  function tickDays(c, n) {
    var out = { days: n, leaseDue: [], personaExpired: 0, householdDue: false, hypercareDue: false };
    for (var i = 0; i < n; i++) {
      if (EN.inventoryView && EN.inventoryView.leaseTick) {
        EN.inventoryView.leaseTick(c).forEach(function (nm) {
          if (out.leaseDue.indexOf(nm) === -1) out.leaseDue.push(nm);
        });
      }
      if (EN.inventoryView && EN.inventoryView.householdTick && EN.inventoryView.householdTick(c)) out.householdDue = true;
      if (EN.inventoryView && EN.inventoryView.hypercareTick && EN.inventoryView.hypercareTick(c)) out.hypercareDue = true;
      if (EN.faceView && EN.faceView.personaTick) out.personaExpired += EN.faceView.personaTick(c);
    }
    return out;
  }
  // what the day-advance did, as one sentence, shared by the rest and downtime paths
  function dayReport(t) {
    var bits = [];
    if (t.leaseDue.length) bits.push("LEASE PAYMENT DUE: " + t.leaseDue.join(", ") + " (grants nothing until paid, Inventory > Stash)");
    if (t.personaExpired) bits.push(t.personaExpired + " saved Persona" + (t.personaExpired > 1 ? "s have" : " has")
      + " gone obsolete (Social tab); taking one again needs a fresh scan or fresh observation");
    return bits.join(". ");
  }
  /* Downtime that advances the story calendar without a Long Rest. Recovery is
     deliberately NOT applied: this moves clocks only, so a GM can skip weeks
     without handing out a rest the fiction did not include. */
  function advanceDowntime(ch, days) {
    days = Math.max(1, Math.min(365, Math.floor(days) || 1));
    var t = null;
    store.update(function (c) { t = tickDays(c, days); });
    var label = days + (days === 1 ? " day" : " days") + " of downtime passes";
    var rep = dayReport(t);
    toast(rep ? label + ". " + rep + "." : label + ". Nothing came due.");
  }
  function longRest(ch, d) {
    var leaseDue = [], severeFatigue = 0, noNaturalHealing = false, personaExpired = 0, altitudeLocked = 0, altitudeFrom = [];
    store.update(function (c) {
      var s = state(c, d);
      var bodMod = d.attributes.BOD.mod;
      // Static Threshold 4 ("Maintenance Required") stops natural Wound recovery on a
      // Long Rest; Wounds then need medical or engineering treatment instead.
      var noWoundRecovery = !!(d.chromeTax && d.chromeTax.noWoundRecovery);
      if (noWoundRecovery) noNaturalHealing = true;
      var nw = noWoundRecovery ? s.wounds : eng.clamp(s.wounds + Math.max(1, bodMod), 0, s.woundsMax);
      c.wounds.current = nw;
      if (nw > 0) { c.stable = false; c.deathSaves = { s: 0, f: 0 }; }
      c.vitality.current = Math.max(0, (d.vitalityMax || 0) - (s.woundsMax - nw));  // full Vitality (wound-adjusted)
      c.vitality.temp = 0;
      c.resilience.spent = 0;                                               // all Resilience Dice
      c.featureUses = {};                                                   // all limited-use features refresh
      if (d.resource) c.resources.current[d.resource.name] = d.resource.max;
      if (d.flow) c.flow.current = d.flow.max;                              // full Reservoir
      c.flow.strain = Math.max(0, (c.flow.strain || 0) - 1);                // Strain −1
      // Fatigue −1, but only up to level 3. Severe Fatigue (4 to 6) "requires
      // medical, mystical, or technological treatment to reduce", so a night's
      // sleep does nothing for it. Tracked as a leveled condition; removed at 0.
      if ((c.conditions || []).indexOf("Fatigue") !== -1) {
        var cur = (c.conditionLevels || {})["Fatigue"] || 1;
        // Thin air: "Fatigue from thin air does NOT come off during a Long Rest
        // taken at the same altitude." LONG RESTS ONLY, which is why the check
        // lives here and not in setCondLevel: an ability or a hand adjustment
        // that clears Fatigue is deliberately unaffected. The locked count comes
        // off d.hazard, so the rest and the Hazards panel cannot disagree about
        // it. The count is CHARACTER-scoped (ch.hazards.thinAirFatigue) and the
        // lock only applies while a thin-air exposure is live, so descending
        // releases it and coming back up re-applies it. Levels that come off
        // here are always UNLOCKED ones, since the rest is refused outright when
        // it would eat into the locked count; the engine's clamp to current
        // Fatigue keeps the attribution honest from every other direction.
        var locked = (d.hazard && d.hazard.longRestLockedFatigue) || 0;
        if (cur >= 4) severeFatigue = cur;                                  // untouched; player is told why
        else if (locked > 0 && cur - 1 < locked) {
          altitudeLocked = locked;
          altitudeFrom = (d.hazard && d.hazard.longRestLockSources) || [];
        } else {
          var fl = cur - 1;
          if (fl <= 0) { c.conditions = c.conditions.filter(function (n) { return n !== "Fatigue"; }); delete c.conditionLevels["Fatigue"]; }
          else c.conditionLevels["Fatigue"] = fl;
          /* Keep the thin-air attribution honest in STORAGE, not just at derive
             time. When `locked` is 0 the character is off the altitude (or owes
             nothing), so the level that just came off is fair game and the count
             follows it down. When `locked` is above 0 this branch is not reached
             at all unless there are unlocked levels to spend first, so the level
             removed is never a locked one and the count must not move. Without
             this the record would sit on an attribution larger than the Fatigue
             it describes, which is the exact smell this whole fix removes. */
          if (!locked) {
            c.hazards = c.hazards || {};
            c.hazards.thinAirFatigue = Math.max(0, Math.min((c.hazards.thinAirFatigue | 0) - 1, fl));
          }
        }
      }
      // a Long Rest is one day on the story calendar
      var t = tickDays(c, 1);
      leaseDue = t.leaseDue; personaExpired = t.personaExpired;
    });
    var dayRep = dayReport({ leaseDue: leaseDue, personaExpired: personaExpired });
    if (altitudeLocked) toast("Long Rest complete. " + altitudeLocked + " level(s) of Fatigue came from thin air ("
      + altitudeFrom.join(", ") + ") and do not come off a Long Rest taken at the same altitude. Descend, or use an ability that clears Fatigue."
      + (dayRep ? " " + dayRep + "." : ""));
    else if (dayRep) toast("Long Rest complete. " + dayRep + ".");
    else if (noNaturalHealing) toast("Long Rest complete. Static Threshold 4: no natural Wound recovery. Wounds need medical or engineering treatment.");
    else if (severeFatigue) toast("Long Rest complete. Fatigue " + severeFatigue + " is Severe: it needs medical, mystical, or technological treatment, not sleep.");
    else toast("Long Rest complete, restored and refreshed.");
  }
  function spendResilience(ch, d, count) {
    var s = state(ch, d);
    var n = Math.min(count || 1, s.rd);
    if (n <= 0) { toast("No Resilience Dice left; they refresh on a Long Rest."); return; }
    var rolls = [], heal = 0;
    for (var i = 0; i < n; i++) {
      var roll = 1 + Math.floor(Math.random() * d.resilienceDie);
      rolls.push(roll);
      heal += Math.max(0, roll + d.attributes.BOD.mod);
    }
    store.update(function (c) {
      c.resilience.spent = (c.resilience.spent || 0) + n;
      var st = state(c, d);
      c.vitality.current = Math.min(st.vitMax, st.vit + heal);
    });
    toast(n + "×d" + d.resilienceDie + " → [" + rolls.join(", ") + "] " + eng.fmtMod(d.attributes.BOD.mod) + " BOD each = " + heal + " Vitality restored.");
  }

  /* ---------- small widgets ---------- */
  /* Magazine as one cell per round. Above 24 rounds the cells get too thin to
     read, so a belt-fed weapon falls back to the solid bar. */
  function magBar(cur, max, dry) {
    if (!(max > 0) || max > 24) return bar(cur, max, dry ? "var(--danger)" : "var(--accent)");
    var cells = [];
    for (var i = 0; i < max; i++) {
      cells.push(el("i" + (i < cur ? ".live" : ".spent"),
        { style: dry ? { borderColor: "var(--danger)" } : null }));
    }
    return el("div.mag" + (dry ? ".dry" : ""),
      { title: cur + " of " + max + " loaded" }, cells);
  }
  function bar(cur, max, color) {
    var pct = max > 0 ? Math.round(cur / max * 100) : 0;
    return el("div", { style: { height: "10px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: "5px", overflow: "hidden", margin: "6px 0" } }, [
      el("div", { style: { width: pct + "%", height: "100%", background: color, boxShadow: "0 0 10px " + color, transition: "width .25s" } })
    ]);
  }
  /* Shared Vitality bar; Vigor renders as a gold hazard-striped overlay on top
     of the green Vitality fill (left-anchored, same vitMax scale). Vigor is its
     own layer, so burning it never moves the Vitality fill underneath. */
  function vitalityBar(vit, vitMax, vigor) {
    var vPct = vitMax > 0 ? (vit / vitMax * 100) : 0;
    var gPct = vitMax > 0 ? Math.min(100, vigor / vitMax * 100) : (vigor > 0 ? 100 : 0);
    return el("div", { style: { position: "relative", height: "12px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", margin: "5px 0 10px" } }, [
      el("div", { style: { width: vPct + "%", height: "100%", background: "var(--success)", boxShadow: "0 0 8px var(--success)", transition: "width .25s" } }),
      vigor > 0 ? el("div.vigor-shield", {
        title: "Vigor " + vigor + ", absorbed before Vitality",
        style: { position: "absolute", left: 0, top: 0, width: gPct + "%", height: "100%",
                 overflow: "hidden", transition: "width .25s" }
      }) : null
    ]);
  }
  function plusMinus(onMinus, onPlus, label) {
    return el("div.stepper", { style: { marginTop: 0, width: "auto" } }, [
      el("button", { onclick: onMinus }, "−"),
      label ? el("span.mono", { style: { fontSize: "12px", minWidth: "30px", textAlign: "center", color: "var(--text2)" }, text: label }) : null,
      el("button", { onclick: onPlus }, "+")
    ]);
  }
  function pips(n, max, colorOn, onSet) {
    var row = el("div.row", { style: { gap: "5px", flexWrap: "wrap" } });
    for (var i = 1; i <= max; i++) {
      (function (i) {
        row.appendChild(el("span", {
          title: String(i), onclick: onSet ? function () { onSet(i === n ? i - 1 : i); } : null,
          style: { width: "14px", height: "14px", borderRadius: "50%", cursor: onSet ? "pointer" : "default",
                   border: "1px solid " + (i <= n ? colorOn : "var(--border2)"),
                   background: i <= n ? colorOn : "transparent", boxShadow: i <= n ? "0 0 7px " + colorOn : "none" }
        }));
      })(i);
    }
    return row;
  }
  /* ---------- leveled conditions (severity tracking, per the old sheet) ----- */
  var LEVELED = {
    "Fatigue":  { label: "Level",  max: 6, names: ["Winded", "Tired", "Worn Out", "Exhausted", "Delirious", "Helpless"], severeAt: 4,
      effects: [
        "Lose 1 Speed Point. Snag on Agility checks.",
        "Lose 3 Speed Points total. Snag on Body & Agility checks and all attack rolls.",
        "Speed pool halved (minimum 3) & Snag on Body and Agility saves.",
        "Speed pool halved (minimum 3) & gain the Drowsy condition.",
        "Speed pool halved (minimum 3) & gain the Hallucinating condition.",
        "You fall Unconscious and can only be stabilised by medical, mystical, or technological treatment."
      ] },
    "Bleeding": { label: "Stacks", max: 3,
      effects: [
        "Lose 1d4 Vitality at the start of your turn and every time you move 1 space.",
        "Lose 2d4 Vitality at the start of your turn and every time you move 1 space.",
        "Lose 3d4 Vitality at the start of your turn and every time you move 1 space."
      ] },
    "Strain":   { label: "Stage",  max: 5, names: ["Ripple", "Wave", "Surge", "Rend", "Collapse"], severeAt: 5,
      effects: [
        "Ripple: You roll with Snag on Invocation rolls.",
        "Wave: All Invocations cost +1 FP.",
        "Surge: You must roll a Breakflow Check whenever you Overdraw.",
        "Rend: You must roll a Breakflow Check whenever you spend FP.",
        "Collapse: Immediate Breakflow; you fall Unconscious."
      ] }
  };
  // Per-condition mechanical riders (straight from the condition texts).
  // fx(e, lvl) mutates the aggregate; everything else surfaces via notes.
  var COND_FX = {
    "Bleeding": function (e, l) { e.notes.push("Bleeding " + l + ": lose " + l + "d4 Vitality at start of turn and per space moved"); },
    "Bloodied": function (e) { e.speedHalved = true; e.notes.push("Bloodied: Speed halved; cannot take Complex Actions"); },
    "Breached": function (e) { e.notes.push("Breached: system actions may suffer Snag / be overridden"); },
    "Breakflow": function (e) { e.notes.push("Breakflow: FP drop to 0; cannot channel, recover FP, or sustain effects"); },
    "Burning": function (e) { e.notes.push("Burning: 1d6 Fire at start of turn; Body Save DC 10 at end of turn to extinguish"); },
    "Charmed": function (e) { e.notes.push("Charmed: cannot harm the charmer; they gain Edge on social checks vs you"); },
    "Confused": function (e) { e.notes.push("Confused: roll 1d8 on the Confusion Table at the start of your turn"); },
    "Critical Condition": function (e) { e.snagChk.BOD = e.snagChk.AGI = true; e.snagSave.BOD = e.snagSave.AGI = true; e.notes.push("Critical Condition: Focus Checks to stay conscious on Wound damage / strenuous actions / end of turn"); },
    "Critical Wound": function (e) { e.notes.push("Critical Wound: permanent penalties by body part (see entry) until replaced"); },
    "Cursed": function (e) { e.notes.push("Cursed: GM-defined affliction (see Curse Effects table)"); },
    "Dazed": function (e) { e.noImpulse = true; e.notes.push("Dazed: no Impulse Actions; only ONE of Action / Move / Swift this turn"); },
    // Drowning and Vacuum are the SAME machinery, so neither prints a hand-typed
    // sentence: both notes are generated from the one spec in EN.hazards.breath.
    // Change the spec and both conditions change together; there is no second
    // copy of "DC 10, +2 a round, 1 Wound" anywhere to fall out of step.
    "Drowning": function (e) { e.notes.push(EN.hazards ? EN.hazards.breathNote("drowning") : "Drowning"); },
    "Vacuum": function (e) {
      e.notes.push(EN.hazards ? EN.hazards.breathNote("vacuum") : "Vacuum");
      e.notes.push("Vacuum: you cannot speak, and nothing requiring air functions. The Sealed trait alone does NOT hold vacuum");
    },
    "Drowsy": function (e) { e.init -= 2; e.saveDelta -= 1; e.perceptionSnag = true; e.notes.push("Drowsy: −2 Initiative, −1 all Saves, Snag on Perception; second Drowsy effect → Body Save DC 15 or Unconscious"); },
    "Fatigue": function (e, l) {
      if (l >= 1) { e.speedDelta -= 1; e.snagChk.AGI = true; }
      if (l >= 2) { e.speedDelta -= 2; e.snagChk.BOD = true; e.snagAtk = true; }
      if (l >= 3) { e.speedHalved = true; e.speedMin = 3; e.snagSave.BOD = e.snagSave.AGI = true; }   // "halved (rounded down, minimum 3)"
      if (l >= 4) e.derived.push({ name: "Drowsy", from: "Fatigue " + l });
      if (l >= 5) e.derived.push({ name: "Hallucinating", from: "Fatigue " + l });
      if (l >= 6) e.derived.push({ name: "Unconscious", from: "Fatigue 6 · Helpless" });
    },
    "Frightened": function (e) { e.snagAtk = true; e.snagChk.ALL = true; e.notes.push("Frightened: can't approach the source; must retreat to cover within 10 spaces"); },
    "Grappled": function (e) { e.speedZero = true; e.notes.push("Grappled: Speed 0; Action + contested Athletics (Body) or Acrobatics (Agility) vs the grappler's Athletics to escape"); },
    "Hallucinating": function (e) { e.perceptionSnag = true; e.snagChk.WIT = true; e.notes.push("Hallucinating: treat false stimuli as real; Wits Save DC 12 to ignore them"); },
    "Hardwired": function (e) { e.notes.push("Hardwired: targetable by Quick Hacks; Snag on saves vs EMP / viruses / Electromagnetic"); },
    "Incapacitated": function (e) { e.cannotAct = true; e.notes.push("Incapacitated: no Actions of any kind; minor Free Actions only"); },
    "Invisible": function (e) { e.notes.push("Invisible: Edge on Stealth; attacks against you have Snag"); },
    "Lagged": function (e) { e.notes.push("Lagged: your actions resolve at the END of the round"); },
    "LinkDeath": function (e) { e.notes.push("LinkDeath: 2d6+ Psychic on failed save and Unconscious; Wits Save at end of turn to wake"); },
    "Mutating": function (e, l) { e.notes.push("Mutating " + l + " stack(s): Body Save DC " + (10 + l) + " at start of turn or suffer growth effects"); },
    "Panic": function (e) { e.notes.push("Panic: Wits Save DC 12 at start of turn or roll 1d6: Flight / Fight / Freeze"); },
    "Paralyzed": function (e) { e.cannotAct = true; e.speedZero = true; e.edgeToAttackers = true; e.autoFailBodAgiSaves = true; e.notes.push("Paralyzed: auto-fail Body & Agility saves; melee vs you may crit"); },
    "Poisoned": function (e) { e.snagAtk = true; e.snagChk.ALL = true; e.snagSave.BOD = true; },
    "Prone": function (e) { e.edgeToAttackers = true; e.notes.push("Prone: melee vs you has Edge, ranged vs you has Snag; stand for half movement or a Swift"); },
    "Restrained": function (e) { e.speedZero = true; e.snagAtk = true; e.snagSave.AGI = true; e.edgeToAttackers = true; },
    "Shaken": function (e) { e.snagAtk = true; e.snagChk.WIT = true; e.notes.push("Shaken: cannot take the Help Action or benefit from Edge from any source"); },
    "Signal Jammed": function (e) { e.notes.push("Signal Jammed: no remote devices, drones, or wireless cyberware; wired still works"); },
    "Staggered": function (e) { e.speedHalved = true; e.noSwift = true; e.noImpulse = true; e.notes.push("Staggered: Staggered again → Stunned"); },
    "Strain": function (e, l) {
      if (l >= 1) e.notes.push("Strain · Ripple: Snag on Invocation rolls");
      if (l >= 2) e.notes.push("Strain · Wave: all Invocations cost +1 FP");
      if (l >= 3) e.notes.push("Strain · Surge: Breakflow Check whenever you Overdraw");
      if (l >= 4) e.notes.push("Strain · Rend: Breakflow Check whenever you spend FP");
      if (l >= 5) { e.derived.push({ name: "Breakflow", from: "Strain 5 · Collapse" }); e.derived.push({ name: "Unconscious", from: "Strain 5 · Collapse" }); }
    },
    "Surprised": function (e) { e.cannotAct = true; e.noSwift = true; e.noImpulse = true; e.speedZero = true; e.edgeToAttackers = true;
      e.notes.push("Surprised: no Action, Move, Swift, or Impulse on your first turn (Saves still allowed); attacks against you have Edge until the start of your second turn"); },
    "Stunned": function (e) { e.speedZero = true; e.noImpulse = true; e.snagSave.BOD = e.snagSave.AGI = true; e.edgeToAttackers = true; e.notes.push("Stunned: no Move; only one Action OR Swift this turn"); },
    "Soul Shock": function (e) { e.snagChk.MYS = e.snagChk.WIT = true; e.notes.push("Soul Shock: +1d6 damage per repeat instance before resting"); },
    "Unconscious": function (e) { e.cannotAct = true; e.speedZero = true; e.edgeToAttackers = true; e.autoFailBodAgiSaves = true; e.notes.push("Unconscious: drop items, fall Prone, unaware; lose Focus/Sustains and network links"); }
  };

  // Aggregate effects across ALL active conditions, recursively including
  // derived conditions' own riders (e.g. Fatigue 4 → Drowsy → −2 Initiative).
  function condEffects(ch) {
    var e = { init: 0, saveDelta: 0, speedDelta: 0, speedHalved: false, speedZero: false, speedMin: 0,
              snagAtk: false, snagChk: {}, snagSave: {}, perceptionSnag: false,
              edgeToAttackers: false, cannotAct: false, autoFailBodAgiSaves: false,
              noImpulse: false, noSwift: false, derived: [], notes: [] };
    var applied = {};
    var queue = (ch.conditions || []).map(function (n) { return { name: n, from: null }; });
    var guard = 0;
    while (queue.length && guard++ < 50) {
      var item = queue.shift();
      if (applied[item.name]) continue;
      applied[item.name] = true;
      var fn = COND_FX[item.name];
      var before = e.derived.length;
      if (fn) fn(e, condLevel(ch, item.name));
      // newly derived conditions: queue their riders too, and keep them listed
      e.derived.slice(before).forEach(function (dc) { queue.push({ name: dc.name, from: dc.from }); });
    }
    // don't list derived conditions the player already applied manually
    e.derived = e.derived.filter(function (dc) { return (ch.conditions || []).indexOf(dc.name) === -1; });
    return e;
  }
  // Order matters: subtract every flat reduction first, THEN halve, rounding down.
  // The minimum-3 floor belongs to the Agility-derived base only ("total Speed cannot
  // drop below 3 due to Agility alone"); conditions and injuries may drive it to 0,
  // except where a condition states its own minimum (Fatigue 3 states minimum 3).
  function adjSpeed(base, e) {
    if (e.speedZero) return 0;
    var s = base + e.speedDelta;
    if (e.speedHalved) s = Math.floor(s / 2);
    return Math.max(e.speedMin || 0, s);
  }
  function snagChip(why) {
    return el("span.chip", { title: why, style: { fontSize: "9px", color: "var(--danger)", borderColor: "var(--danger)" }, text: "SNAG" });
  }

  // Duration + how-to-end metadata for the collapsed condition cards
  var COND_META = {
    "Bleeding": ["Until Healed", "Medtech DC 10 / 15 / 20"], "Bloodied": ["Until Vit > 0", "Regain any Vitality"],
    "Breached": ["Until Purged", "Engineering / Tech Check"], "Breakflow": ["24 Hours", "Flow Ritual / 1 Day Rest"],
    "Bricked": ["Until Repaired", "Engineering / Tech Check"], "Burning": ["Until Out", "End of turn Body DC 10"],
    "Cascade Failure": ["Until Resolved", "Engineering / Systems Check"], "Charmed": ["Until Broken", "End of turn Wits / Charm Save"],
    "Confused": ["Special", "End of turn Wits DC 15"], "Critical Condition": ["Until Healed", "Body DC (Varies)"],
    "Critical Wound": ["Persistent", "Surgery / Regenerative Tech"], "Cursed": ["Persistent", "Ritual / Rare Relics"],
    "Dazed": ["1 Round", "End of turn Wits DC 12"], "Drowning": ["Special", "Access to breathable air"],
    "Drowsy": ["Persistent", "Body DC 12 (shake off) / Body DC 15 (resist sleep)"], "Fatigue": ["Until Restored", "Long Rest / Treatment / Medtech"],
    "Surprised": ["1st turn of combat", "-"], "Mutating": ["Until Treated", "Complex Action Medtech DC 12 + stacks"],
    "Immunity": ["Persistent", "-"], "Resistance": ["Persistent", "-"], "Vulnerability": ["Persistent", "-"],
    "Frightened": ["Until Save", "End of turn Wits / Charm DC 15"], "Grappled": ["Until Escaped", "Contested Athletics / Acrobatics"],
    "Hallucinating": ["Persistent", "Purge / Source Expiration"], "Hardwired": ["Permanent", "Uninstall Cyberware"],
    "Incapacitated": ["Until Freed", "Removal of source"], "Invisible": ["Until Revealed", "Narrative / Tech Reveal"],
    "Lagged": ["Persistent", "Exit Zone / Purge"], "LinkDeath": ["Until Save", "End of turn Wits Save"],
    "Panic": ["Special", "End of turn Wits DC 12"], "Paralyzed": ["Until Save", "Body Save (varies)"],
    "Poisoned": ["Varies", "Antitoxin / Medtech Check"], "Prone": ["Until Stand", "Half Move or Swift Action"],
    "Restrained": ["Until Freed", "Athletics Check / Destroy Restraint"], "Shaken": ["1-3 Rounds", "End of turn Wits DC 12"],
    "Signal Jammed": ["Until Jam Ends", "Move / Disable Jammer"], "Soul Shock": ["Until Short Rest", "Short Rest"],
    "Staggered": ["1-2 Rounds", "End of turn Wits DC 10"], "Strain": ["Until Restored", "Long Rest / Ritual"],
    "Stunned": ["1 Round", "End of turn Body DC 15"], "Unconscious": ["Until Revived", "Healing / Allied Action"],
    "Vacuum": ["Special", "Pressure and air, or a suit that holds vacuum"]
  };
  function condLevel(ch, name) { return (ch.conditionLevels || {})[name] || 1; }
  function setCondLevel(name, lvl) {
    store.update(function (c) {
      c.conditionLevels = c.conditionLevels || {};
      var max = LEVELED[name] ? LEVELED[name].max : 1;
      var before = (c.conditions || []).indexOf(name) !== -1 ? (c.conditionLevels[name] || 1) : 0;
      if (lvl <= 0) { c.conditions = (c.conditions || []).filter(function (n) { return n !== name; }); delete c.conditionLevels[name]; }
      else c.conditionLevels[name] = Math.min(max, lvl);
      var after = lvl <= 0 ? 0 : Math.min(max, lvl);
      /* Clearing Fatigue also retires the thin-air attribution for the levels
         that came off. This is the path an ability or a medic uses, and the
         rules bless it ("abilities that clear Fatigue are unaffected"), so
         without this the lock outlives the Fatigue it describes.

         Thin-air levels come off FIRST when something clears Fatigue. The rules
         do not say which levels a partial clear removes, and the asymmetry of
         harm decides it the same way the rig ruling did: a wrongly-LOCKED level
         silently denies a player a Long Rest recovery they were entitled to,
         while a wrongly-unlocked one hands back a level the GM was narrating
         anyway. The engine also clamps this to the character's current Fatigue,
         so any other path that lowers it cannot leave a phantom lock either. */
      if (name === "Fatigue" && after < before) {
        c.hazards = c.hazards || {};
        c.hazards.thinAirFatigue = Math.max(0, (c.hazards.thinAirFatigue | 0) - (before - after));
      }
    });
  }

  /* =================== ENVIRONMENTAL HAZARDS (the panel) ===================
     Clocks for Exposure, Deprivation, Vacuum/Drowning and Caustic. Every
     rendered number comes off d.hazard, the engine's one resolver; this file
     owns the WRITES and nothing else.

     The escalating DC never touches a shared counter: a save writes
     `saves + 1` onto THAT exposure's own row, and the engine derives
     10 + 2 * saves from that row alone. LEAVE deletes the row, which is why
     leaving resets both the clock and the DC with no reset step to forget.
     ---------------------------------------------------------------------- */
  // (the old "enter an exposure" type/severity selects lived here; exposures are
  // entered from the Status Changes header dropdown now, and severity is picked
  // on the row itself, so there is no pending-pick state to hold between renders)
  function newExposureId(c) {
    var m = (c.hazards && c.hazards.exposures) || {};
    var id;
    do { id = "ex_" + Math.random().toString(36).slice(2, 9); } while (m[id]);
    return id;
  }
  // Fatigue is the existing leveled condition; hazards never build a parallel
  // track. Returns the levels actually gained (0 once Fatigue is capped at 6).
  function gainFatigue(c, n) {
    n = Math.max(0, Math.floor(n || 0));
    if (!n) return 0;
    c.conditions = c.conditions || [];
    c.conditionLevels = c.conditionLevels || {};
    var has = c.conditions.indexOf("Fatigue") !== -1;
    var cur = has ? (c.conditionLevels["Fatigue"] || 1) : 0;
    var next = Math.min(6, cur + n);
    if (next === cur) return 0;
    if (!has) c.conditions.push("Fatigue");
    c.conditionLevels["Fatigue"] = next;
    return next - cur;
  }
  // One d20 Body Save, with the sheet's real bonus and whatever Edge or Snag is
  // genuinely in play: a mitigation's Edge, and the Snag the character's own
  // conditions already impose on Body saves (Fatigue 3 feeds straight back in).
  function hazardSave(row, dc, fx) {
    var mods = [{ label: "Body Save", value: row.saveBonus || 0 }];
    if (fx && fx.saveDelta) mods.push({ label: "Conditions", value: fx.saveDelta });
    /* Shaken cancels Edge from ANY source, per its own condition text, and every
       other d20 surface in the app honours that (the roll tray at :86, the tray
       control at :330). A hazard mitigation's Edge is a source like any other,
       so Ration Discipline granting Edge to a Shaken character was this one
       surface disagreeing with the rest. The Snag half is untouched: Shaken
       imposes Snag on attacks and Wits checks, not on Body Saves. */
    var shaken = (((store.active() || {}).conditions) || []).indexOf("Shaken") !== -1;
    var r = eng.rollD20({ mods: mods, edge: (row.edge && !shaken) ? 1 : 0,
                          snag: (fx && fx.snagSave && fx.snagSave.BOD) ? 1 : 0 });
    r.dc = dc; r.pass = r.total >= dc;
    r.edgeBlocked = !!(row.edge && shaken);
    return r;
  }
  function rollText(r) {
    var kept = r.dice[r.keptIndex];
    var dice = r.dice.length > 1 ? "[" + r.dice.join(" / ") + "] keep " + kept : String(kept);
    return dice + " " + eng.fmtMod(r.flat) + " = " + r.total + " vs DC " + r.dc + " · " + (r.pass ? "SUCCESS" : "FAILURE");
  }
  function hazChip(text, color, title) {
    return el("span.chip", { title: title || "", style: { fontSize: "9px", color: color, borderColor: color }, text: text });
  }
  function hazSub(label) {
    return el("div.section-title", { style: { margin: "12px 0 4px" } }, [document.createTextNode(label), el("span.line")]);
  }

  /* Hazards as BLOCKS rather than as their own panel. The Status Changes panel
     is one place for every temporary state, so these render inside it beside
     the conditions and the bonuses. Each subsection is gated on the hazard
     having been APPLIED: nothing appears until the player picks it out of the
     "- add a Hazard -" dropdown, exactly the way a condition appears.

     Returns {kids, count}. Drowning is NOT here; it is a condition, and its
     breath clock renders inside the Drowning condition entry (drowningRow). */
  function hazardBlocks(ch, d, fx) {
    var H = EN.hazards || {}, hzd = d.hazard;
    if (!H.exposure || !hzd) return { kids: [el("p.help", { text: "EN.hazards did not load." })], count: 0 };
    var kids = [];

    /* ---- 3.1 Exposure -------------------------------------------------- */
    if (hzd.exposures.length) {
    kids.push(hazSub("Exposure"));
    kids.push(el("p.help", { style: { margin: "0 0 8px" }, text: H.exposure.intro }));
    hzd.exposures.forEach(function (row) {
      var right = [];
      right.push(el("span.mono", { style: { fontSize: "17px", color: row.shielded ? "var(--text3)" : "var(--warn)" }, text: "DC " + row.dc }));
      right.push(el("button.btn.sm.primary", { style: { padding: "1px 8px" }, onclick: function () { exposureTick(row, fx); } },
        row.shielded ? "⏱ SPEND " + row.intervalMinutes + " MIN" : "⏱ SAVE"));
      // Severity sets the interval and NOTHING else, and the weather can turn
      // while you are standing in it, so it is editable on the row. Changing it
      // deliberately does not touch this exposure's save count: the escalating
      // DC belongs to the exposure, not to how bad it currently is.
      right.push(el("select", { style: { width: "auto", fontSize: "11px" },
        title: "Severity sets the interval and nothing else. Changing it leaves this exposure's DC where it is.",
        onchange: function () {
          var v = this.value, id = row.id;
          store.update(function (c) {
            var r = ((c.hazards || {}).exposures || {})[id];
            if (r) r.severity = v;
          });
        } },
        (H.exposure.severities || []).map(function (s) {
          return el("option", { value: s.key, selected: row.severity === s.key, text: s.name + " · " + s.interval });
        })));
      right.push(el("button.btn.sm", { style: { padding: "1px 8px" }, title: "Leaving resets both the clock and the DC", onclick: function () { exposureLeave(row); } }, "LEAVE"));
      var chips = [];
      chips.push(hazChip(row.severityName.toUpperCase() + " · " + row.interval, "var(--accent)", "Severity sets the interval and nothing else"));
      chips.push(hazChip("SAVES " + row.saves, "var(--text3)", "This exposure's own save count; the DC is 10 + 2 per save on THIS row"));
      if (row.fatigue) chips.push(hazChip("FATIGUE " + row.fatigue, "var(--danger)", "Levels this exposure has dealt"));
      if (row.noFatigue) chips.push(hazChip("NO FATIGUE · " + row.noFatigueFrom.toUpperCase(), "var(--success)", row.noFatigueFrom + " refuses the Fatigue from this exposure"));
      if (row.edge) chips.push(hazChip("EDGE · " + row.edgeFrom.toUpperCase(), "var(--success)", row.edgeFrom + " grants Edge on this save"));
      if (row.shielded) chips.push(hazChip(row.shieldFrom.toUpperCase() + " " + row.shieldMinutesLeft + " MIN", "var(--success)",
        "The clock does not start while the " + row.shieldFrom + " is covering you"));
      if (row.lethalDamage) chips.push(hazChip("+" + row.lethalDamage.dice + " " + row.lethalDamage.type.toUpperCase() + " ON FAIL", "var(--ember)", "Lethal severity rider"));
      if (row.lockedFatigue) chips.push(hazChip("LOCKED " + row.lockedFatigue, "var(--gold)", "Thin air: this Fatigue does not come off a Long Rest taken at the same altitude"));
      kids.push(el("div.feature", { style: { borderLeftColor: row.shielded ? "var(--success)" : "var(--warn)" } }, [
        el("h4", null, [
          el("span", { text: row.typeName }),
          el("span", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" } }, right)
        ]),
        el("div.row.wrap", { style: { gap: "5px", margin: "4px 0" } }, chips),
        el("p.help", { style: { margin: 0 }, text: "Next save DC " + row.nextDC + " · " + row.minutes + " min in this exposure · clock at "
          + row.clockMinutes + " min" + (row.rider ? " · " + row.rider : "") })
      ]));
    });
    }   // end: at least one exposure applied

    /* ---- Deprivation: three independent day-scale clocks ----------------
       Only the tracks the player applied. Each is still its OWN clock with its
       own DC and its own Fatigue; applying one says nothing about the others. */
    var depOn = hzd.deprivation.filter(function (r) { return r.applied; });
    if (depOn.length) {
    kids.push(hazSub("Deprivation"));
    kids.push(el("p.help", { style: { margin: "0 0 8px" }, text: (H.typeByKey.deprivation || {}).rider || "" }));
    depOn.forEach(function (row) {
      var chips = [];
      chips.push(hazChip(row.days + " " + row.unit + (row.days === 1 ? "" : "s"), row.crossed ? "var(--danger)" : "var(--text3)",
        "Threshold: " + row.thresholdDays + " " + row.unit + (row.thresholdDays === 1 ? "" : "s")));
      chips.push(hazChip("SAVES " + row.saves, "var(--text3)", "This track's own save count, independent of the other two"));
      if (row.fatigue) chips.push(hazChip("FATIGUE " + row.fatigue, "var(--danger)", "Levels this track has stacked, its own"));
      if (row.graceDays) chips.push(hazChip("+" + row.graceDays + "D GRACE · " + row.graceFrom.toUpperCase(), "var(--success)", row.graceFrom + " pushes this threshold back " + row.graceDays + " days"));
      if (row.edge) chips.push(hazChip("EDGE · " + row.edgeFrom.toUpperCase(), "var(--success)", row.edgeFrom + " grants Edge on this save"));
      var right = [
        el("span.mono", { style: { fontSize: "17px", color: row.crossed ? "var(--warn)" : "var(--text3)" }, text: "DC " + row.dc }),
        el("div.stepper", { style: { marginTop: 0 } }, [
          el("button", { title: "One day back", onclick: function () { depDay(row, -1); } }, "−"),
          el("span.mono", { style: { fontSize: "12px", minWidth: "34px", textAlign: "center", color: "var(--text2)" }, text: row.days + "d" }),
          el("button", { title: "One more day without it", onclick: function () { depDay(row, +1); } }, "+")
        ]),
        el("button.btn.sm.primary", { style: { padding: "1px 8px" }, disabled: !row.crossed,
          title: row.crossed ? "One save per day at Mild" : "Threshold not crossed yet", onclick: function () { depTick(row, fx); } }, "⏱ SAVE"),
        el("button.btn.sm", { style: { padding: "1px 8px" }, title: "Fed, watered or slept: this clock resets, and so does its DC", onclick: function () { depReset(row); } }, "RESET"),
        // RESET zeroes the clock but keeps the track on the panel; Remove takes
        // it off entirely. An exposure needs no equivalent, because LEAVE
        // deletes its row and the row was the whole statement.
        statusRemoveBtn(row.statusKey, "Take this track off the panel")
      ];
      kids.push(el("div.feature", { style: { borderLeftColor: row.crossed ? "var(--warn)" : "var(--border2)" } }, [
        el("h4", null, [el("span", { text: row.trackName }), el("span", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" } }, right)]),
        el("div.row.wrap", { style: { gap: "5px", margin: "4px 0" } }, chips),
        el("p.help", { style: { margin: 0 }, text: row.crossed ? ("Crossed " + row.crossedText + "; one save per day at Mild. Next save DC " + row.nextDC + ".")
          : ("Threshold " + row.thresholdDays + " " + row.unit + "s (" + row.crossedText + (row.graceDays ? ", pushed back " + row.graceDays + " by " + row.graceFrom : "") + "). Nothing runs until it is crossed.") })
      ]));
    });

    }   // end: at least one deprivation track applied

    /* ---- 3.2 Vacuum ------------------------------------------------------
       Drowning used to render beside it here. It has moved to Conditions,
       where it belongs, and its row is built by the SAME breathRow() below off
       the SAME EN.hazards.breath spec, so the two still cannot drift. */
    var vacOn = hzd.breath.filter(function (b) { return b.kind === "vacuum" && b.applied; });
    if (vacOn.length) {
    kids.push(hazSub("Vacuum"));
    kids.push(el("p.help", { style: { margin: "0 0 8px" },
      text: "Vacuum mirrors Drowning exactly, and both are built from one spec, so the two cannot drift: breath held " + (H.breath || {}).holdRule
          + ", then a Body Save at the start of each of your turns, DC " + (H.breath || {}).dc + " and +" + (H.breath || {}).step + " each round." }));
    vacOn.forEach(function (b) { kids.push(breathRow(b, d, fx)); });
    }   // end: vacuum applied

    breathBlockTail(kids, hzd, d, fx);
    return { kids: kids, count: hazardCount(hzd) };
  }

  /* ONE breath row builder, used by Vacuum in the hazard blocks and by Drowning
     inside its condition. Both read the same EN.hazards.breath spec through
     d.hazard.breath, so moving Drowning to Conditions moved WHERE it renders
     and nothing else: it cannot drift from Vacuum, because there is no second
     renderer to drift. */
  function breathRow(b, d, fx) {
      var chips = [];
      chips.push(hazChip("HOLD " + b.holdRounds + " ROUNDS", "var(--accent)", "Rounds equal to your Body score"));
      chips.push(hazChip("ROUND " + b.rounds, "var(--text3)"));
      chips.push(hazChip("SAVES " + b.saves, "var(--text3)", "This exposure's own save count"));
      if (b.everyRoundDamage) chips.push(hazChip(b.everyRoundDamage.dice + " " + b.everyRoundDamage.type.toUpperCase() + " EVERY ROUND", "var(--ember)", "Regardless of the save"));
      if (!b.clockStarts) chips.push(hazChip("VOID LUNG · 15 MIN", "var(--success)", b.breathFrom + ": fifteen minutes of held breath outlasts any scene, so the save clock never starts inside one"));
      if (b.kind === "vacuum") chips.push(hazChip(b.sealedOut ? "SEALED · " + String(b.seal.via).toUpperCase() : "NOT VACUUM-SEALED",
        b.sealedOut ? "var(--success)" : "var(--danger)", b.seal.why));
      var right = [];
      // while a suit is holding vacuum the clock is not running, so its DC is
      // shown greyed rather than as a live number the player has to beat
      right.push(el("span.mono", { style: { fontSize: "17px", color: b.sealedOut ? "var(--text3)" : b.active ? "var(--danger)" : "var(--text3)",
                                            opacity: b.sealedOut ? 0.45 : 1 }, text: "DC " + b.dc }));
      if (b.sealedOut) right.push(hazChip("IMMUNE", "var(--success)", b.seal.why));
      else if (!b.active) right.push(el("button.btn.sm", { style: { padding: "1px 8px" }, onclick: function () { breathStart(b); } }, "START"));
      else {
        right.push(el("button.btn.sm.primary", { style: { padding: "1px 8px" }, disabled: !b.clockStarts, onclick: function () { breathTick(b, fx, d); } },
          b.clockStarts ? (b.holding > 0 ? "⏱ ROUND" : "⏱ SAVE") : "HOLDING"));
        right.push(el("button.btn.sm", { style: { padding: "1px 8px" }, onclick: function () { breathEnd(b); } }, "END"));
      }
      // Vacuum is applied from the Hazard dropdown, so it gets the same Remove
      // every other applied hazard has. Drowning does NOT: it is a condition,
      // and the condition's own Remove above already owns clearing it.
      if (b.statusKey) right.push(statusRemoveBtn(b.statusKey, "Take Vacuum off the panel"));
      return el("div.feature", { style: { borderLeftColor: b.active ? "var(--danger)" : b.sealedOut ? "var(--success)" : "var(--border2)" } }, [
        el("h4", null, [el("span", { text: b.name }), el("span", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" } }, right)]),
        el("div.row.wrap", { style: { gap: "5px", margin: "4px 0" } }, chips),
        el("p.help", { style: { margin: 0 }, text: b.note }),
        b.riders.length ? el("p.help", { style: { margin: "3px 0 0", color: "var(--text2)" }, text: b.riders.join(" ") }) : null,
        b.kind === "vacuum" ? el("p.help", { style: { margin: "3px 0 0", color: b.sealedOut ? "var(--success)" : "var(--warn)" }, text: b.seal.why }) : null
      ]);
  }

  /* Caustic Air & Sludge, and the Mitigations tail. Split out only so the
     hazard blocks above can return early once every subsection is gated. */
  function breathBlockTail(kids, hzd, d, fx) {
    var ch = store.active() || {};
    var H = EN.hazards || {};

    /* ---- 3.3 Caustic Environments ---------------------------------------
       Gear Degradation is deliberately NOT its own applied entry: it is a
       rider on this one, where it is most relevant, so it renders inside the
       Caustic block or not at all. */
    var cz = hzd.caustic;
    if (cz.applied) {
    kids.push(hazSub("Caustic Environments"));
    var cChips = [];
    cChips.push(hazChip(cz.inside ? "STANDING IN IT" : "OUT", cz.inside ? "var(--danger)" : "var(--text3)"));
    if (cz.lingering) cChips.push(hazChip("RESIDUE CLINGING", "var(--ember)", "1d6 Acid at the end of each of your turns until washed off"));
    if (cz.stoppedBy) cChips.push(hazChip("STOPPED · " + String(cz.stoppedBy).toUpperCase(), "var(--success)"));
    else if (cz.lingerStoppedBy) cChips.push(hazChip("NO RESIDUE · " + String(cz.lingerStoppedBy).toUpperCase(), "var(--success)"));
    cChips.push(hazChip(cz.sceneTicks + " TURN" + (cz.sceneTicks === 1 ? "" : "S") + " IN IT", cz.sceneTicks ? "var(--warn)" : "var(--text3)", "Turns spent in it so far this scene"));
    kids.push(el("div.feature", { style: { borderLeftColor: cz.inside ? "var(--danger)" : cz.lingering ? "var(--ember)" : "var(--border2)" } }, [
      el("h4", null, [
        el("span", { text: "Caustic Air & Sludge" }),
        el("span", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" } }, [
          el("button.btn.sm" + (cz.inside ? "" : ".primary"), { style: { padding: "1px 8px" }, onclick: function () { causticToggle(cz); } }, cz.inside ? "STEP OUT" : "STEP IN"),
          el("button.btn.sm", { style: { padding: "1px 8px" }, disabled: !cz.inside, title: "One turn spent in it", onclick: function () { causticTurn(cz); } }, "⏱ END OF TURN"),
          el("button.btn.sm", { style: { padding: "1px 8px" }, disabled: !cz.lingering, title: cz.wash, onclick: function () { causticWash(); } }, "WASH (ACTION)"),
          statusRemoveBtn(cz.statusKey, "Take Caustic Air & Sludge off the panel")
        ])
      ]),
      el("div.row.wrap", { style: { gap: "5px", margin: "4px 0" } }, cChips),
      el("p.help", { style: { margin: 0 }, text: cz.insideDamage ? (cz.insideDamage.dice + " " + cz.insideDamage.type + " " + cz.insideDamage.when + ".")
        : ("No damage inside it: " + cz.stoppedBy + ".") }),
      el("p.help", { style: { margin: "3px 0 0" }, text: cz.lingerDamage ? (cz.lingerDamage.dice + " " + cz.lingerDamage.type + " " + cz.lingerDamage.when + ". " + cz.wash)
        : ("Nothing lingers after you step out: " + cz.lingerStoppedBy + ".") })
    ]));
    var dg = cz.degradation;
    kids.push(el("div.feature", { style: { borderLeftColor: dg.breached ? "var(--danger)" : (dg.lost ? "var(--warn)" : "var(--border2)") } }, [
      el("h4", null, [
        el("span", { text: "Gear Degradation" }),
        el("span", { style: { display: "flex", alignItems: "center", gap: "8px" } }, [
          // the suit's real current DR, from the one resolver, so this reads the
          // same as the Defenses row rather than quoting the catalog at it
          el("span.mono", { title: dg.armor ? dg.armor + ": current DR out of the suit's printed base" : "",
            style: { fontSize: "15px", color: dg.breached ? "var(--danger)" : (dg.lost ? "var(--warn)" : "var(--text3)") },
            text: dg.armor ? (dg.current + " / " + dg.baseDR + " DR") : "NO ARMOR" }),
          dg.guard ? el("span.chip", { title: ((EN.crafting || {}).armorRepair || {}).qualityText || "",
            style: { fontSize: "9px", color: "var(--success)", borderColor: "var(--success)" } }, "PLATE SEATED") : null,
          // The app has no scene clock, and a turn is not a scene, so a full
          // scene of exposure is something the table declares rather than
          // something a turn tick can quietly add up to.
          el("button.btn.sm", { style: { padding: "1px 8px" }, disabled: !dg.exposed || dg.breached,
            title: dg.breached ? (dg.armor + " is already at 0 DR; there is nothing left to corrode")
              : dg.exposed ? "A full scene of exposure: the suit loses 1 DR"
              : dg.blockedBy ? (dg.blockedBy + " keeps the caustic off your armor as well as off you")
              : (dg.armor ? dg.armor + " is sealed; caustic exposure does not reach it" : "No armor worn"),
            onclick: function () { causticScene(cz); } }, "MARK FULL SCENE"),
          dg.lost ? el("button.btn.sm", { style: { padding: "1px 8px", color: "var(--success)", borderColor: "var(--success)" },
            title: "Open the Impact Table and repair this suit", onclick: causticOpenRepair }, "→ REPAIR") : null
        ])
      ]),
      el("p.help", { style: { margin: 0 }, text: cz.degradationRule.text || "" }),
      el("p.help", { style: { margin: "3px 0 0", color: dg.exposed ? "var(--warn)" : "var(--success)" },
        text: !dg.armor ? "No armor worn, so there is nothing to degrade."
            : dg.blockedBy ? (dg.blockedBy + " is worn over " + dg.armor + " and keeps the caustic off it too, so it does not degrade.")
            : dg.sealed ? (dg.armor + " is sealed; caustic exposure does not reach it.")
            : (dg.armor + " is unsealed and will lose 1 DR after a full scene in it.") }),
      dg.lost ? el("p.help", { style: { margin: "3px 0 0", color: dg.breached ? "var(--danger)" : "var(--warn)" },
        text: dg.armor + " has lost " + dg.lost + " DR, and that is already off the Damage Reduction above. "
          + (dg.breached ? "At 0 DR it is past repair: rebuilding it is a full Project on the Impact Table."
                         : "Repair it during Downtime on the Impact Table, at the shop or on the bench. Wear is one track per piece, so this is the suit's whole loss and not a caustic-only tally.") }) : null
    ]));

    }   // end: caustic applied

    /* ---- 3.4 Mitigations -------------------------------------------------
       Only what the player ACTUALLY HAS, per the spec. A mitigation you do not
       own is not listed at all, because a list of everything you could have
       bought is noise on a play sheet.

       Two shapes, and the difference is visible:
         GEAR (and armor mods) surface once the piece is in the stash, and
         render greyed when they are not doing anything (not worn, not
         equipped, not applied, not tuned, torn). The `why` line says which.
         ALWAYS-ON SOURCES (a lineage trait) need no toggle, because there is
         nothing to switch: if you have it, it is on. They render active and
         simply tell the player what they are benefiting from.
       The rest of the block, the per-hazard chips on the rows above, is the
       other half of the spec: mitigations also surface as riders on the hazard
       they answer, which is where a player looks mid-scene. */
    var mit = hzd.mitigations;
    var owned = mit.active.concat(mit.inactive).filter(function (m) { return m.possessed; });
    if (!owned.length) return;
    kids.push(hazSub("Mitigations (" + owned.filter(function (m) { return m.active; }).length + " of " + owned.length + " live)"));
    owned.forEach(function (m) {
      var row = [
        el("h4", null, [
          el("span", null, [document.createTextNode(m.name + " "), hazChip(m.kind.toUpperCase(), "var(--text3)")]),
          el("span", { style: { display: "flex", alignItems: "center", gap: "8px" } }, [
            m.detail ? el("span.help", { style: { margin: 0 }, text: m.detail }) : null,
            hazChip(m.active ? "ACTIVE" : "OFF", m.active ? "var(--success)" : "var(--text3)", m.why)
          ])
        ]),
        el("p.help", { style: { margin: 0, color: m.active ? "var(--text2)" : "var(--text3)" }, text: m.summary }),
        el("p.help", { style: { margin: "3px 0 0" }, text: m.why })
      ];
      if (m.note) row.push(el("p.help", { style: { margin: "3px 0 0", fontStyle: "italic" }, text: m.note }));
      if (m.key === "thermal-weave" && hzd.thermalWeaveKey) {
        var tuned = ((ch.hazards || {}).thermalWeave || {})[hzd.thermalWeaveKey] || "";
        row.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "5px" } }, [
          el("span.help", { style: { margin: 0 }, text: "Chosen at install:" }),
          el("select", { style: { width: "auto", fontSize: "12px" }, onchange: function () {
            var v = this.value, k = hzd.thermalWeaveKey;
            store.update(function (c) {
              c.hazards = c.hazards || {}; c.hazards.thermalWeave = c.hazards.thermalWeave || {};
              if (v) c.hazards.thermalWeave[k] = v; else delete c.hazards.thermalWeave[k];
            });
          } }, [
            el("option", { value: "", selected: !tuned, text: "- not chosen -" }),
            el("option", { value: "Fire", selected: tuned === "Fire", text: "Fire" }),
            el("option", { value: "Cold", selected: tuned === "Cold", text: "Cold" })
          ])
        ]));
      }
      if (m.key === "hazmat") {
        row.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "5px" } }, [
          el("button.btn.sm", { style: { padding: "1px 8px" }, onclick: function () {
            store.update(function (c) { c.hazards = c.hazards || {}; c.hazards.hazmatTorn = !c.hazards.hazmatTorn; });
          } }, (ch.hazards || {}).hazmatTorn ? "MARK REPAIRED & RESEALED" : "MARK TORN")
        ]));
      }
      if (m.key === "rebreather" && m.active) {
        row.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "5px" } }, [
          el("button.btn.sm", { style: { padding: "1px 8px" }, title: "Refreshes between scenes, per its own entry", onclick: function () {
            store.update(function (c) { c.hazards = c.hazards || {}; c.hazards.rebreatherMinutes = 60; });
            toast("Rebreather refreshed: 60 minutes of thin air.");
          } }, "REFRESH (NEW SCENE)")
        ]));
      }
      kids.push(el("div.feature", { style: { borderLeftColor: m.active ? "var(--success)" : "var(--border2)", opacity: m.active ? 1 : 0.6 } }, row));
    });
  }

  /* The Drowning breath clock, rendered inside the Drowning condition. Returns
     null for every other condition, so it can be dropped straight into the
     condition body without a branch at the call site. */
  function drowningClock(name, d, fx) {
    if (name !== "Drowning") return null;
    var b = (((d && d.hazard) || {}).breath || []).filter(function (x) { return x.kind === "drowning"; })[0];
    return b ? breathRow(b, d, fx) : null;
  }

  /* ---- applying and clearing a Status Change ---------------------------
     One entry point per direction, both keyed on the registry option, so the
     panel never writes hazard or bonus storage by hand. Each `kind` names the
     state it drives and nothing else touches it.

     Applied-ness is written as a STATEMENT (ch.hazards.applied[key] = true)
     alongside whatever clock the hazard runs, rather than being implied by that
     clock being non-zero. A freshly applied deprivation track is at 0 days and
     is on the panel; an unapplied one is at 0 days and is not. Nothing about
     the numbers can tell those apart, so the record says which it is. */
  function statusApplied(ch, opt) {
    if (!opt) return false;
    if (opt.menu === "bonus") return ((ch && ch.bonuses) || {})[opt.key] === true;
    if (opt.kind === "exposure") {
      // Exposures stack: two separate cold exposures each run their own clock
      // and their own DC, so this one is never "already applied".
      return false;
    }
    return (((ch && ch.hazards) || {}).applied || {})[opt.key] === true;
  }

  function applyStatusChange(opt) {
    if (!opt) return;
    if (opt.menu === "bonus") {
      store.update(function (c) {
        c.bonuses = c.bonuses || {};
        // One Hot-Wire at a time: applying a second REPLACES the first rather
        // than stacking, which is the rule the feature states.
        if (opt.exclusiveGroup && EN.statusChanges) {
          Object.keys(c.bonuses).forEach(function (k) {
            var o = EN.statusChanges.get(k);
            if (o && o.exclusiveGroup === opt.exclusiveGroup) delete c.bonuses[k];
          });
        }
        c.bonuses[opt.key] = true;
      });
      toast(opt.name + " applied.");
      return;
    }
    store.update(function (c) {
      c.hazards = c.hazards || {};
      var hz = c.hazards;
      if (opt.kind === "exposure") {
        hz.exposures = hz.exposures || {};
        hz.exposures[newExposureId(c)] = { type: opt.type, severity: opt.defaultSeverity || "harsh",
                                           saves: 0, fatigue: 0, minutes: 0, clockMinutes: 0 };
        return;   // the row IS the statement; no applied key for exposures
      }
      hz.applied = hz.applied || {};
      hz.applied[opt.key] = true;
      /* Vacuum is a clock AND a condition. The clock is this hazard; the
         condition is what makes you unable to speak and stops anything needing
         air. Applying the hazard applies both, so there is one door into the
         state and it opens the whole state. Drowning is the mirror of this and
         goes the other way: the condition is the door, and it starts the clock. */
      if (opt.kind === "breath" && opt.track === "vacuum") {
        c.conditions = c.conditions || [];
        if (c.conditions.indexOf("Vacuum") === -1) c.conditions.push("Vacuum");
      }
    });
    toast(opt.kind === "exposure"
      ? (opt.name + " exposure entered at DC " + ((EN.hazards || {}).exposure || {}).baseDC + ". It carries its own clock and its own DC.")
      : (opt.name + " applied."));
  }

  /* Clearing one. The clock it drove is reset at the same time, because leaving
     a hazard resets both the clock and the DC, and a hazard removed from the
     panel has certainly been left. Fatigue already gained is NOT touched: it is
     ordinary Fatigue and comes off by the ordinary rules. */
  function clearStatusChange(opt) {
    if (!opt) return;
    if (opt.menu === "bonus") {
      store.update(function (c) { if (c.bonuses) delete c.bonuses[opt.key]; });
      return;
    }
    store.update(function (c) {
      var hz = c.hazards || (c.hazards = {});
      if (hz.applied) delete hz.applied[opt.key];
      if (opt.kind === "deprivation" && hz.deprivation && hz.deprivation[opt.track]) {
        hz.deprivation[opt.track] = { days: 0, saves: 0, fatigue: 0 };
      } else if (opt.kind === "breath" && hz.breath && hz.breath[opt.track]) {
        hz.breath[opt.track] = { active: false, rounds: 0, saves: 0 };
        if (opt.track === "vacuum" && Array.isArray(c.conditions)) {
          c.conditions = c.conditions.filter(function (n) { return n !== "Vacuum"; });
        }
      } else if (opt.kind === "caustic" && hz.caustic) {
        hz.caustic.inside = false; hz.caustic.lingering = false; hz.caustic.sceneTicks = 0;
      }
    });
  }

  // The remove control every applied Status Change carries, matching the one a
  // condition already has so the panel reads as one thing.
  function statusRemoveBtn(key, label) {
    return el("button.btn.sm.danger", { style: { padding: "1px 8px" }, title: label || "Remove",
      onclick: function (e) {
        e.stopPropagation();
        clearStatusChange(EN.statusChanges && EN.statusChanges.get(key));
        EN.app.render();
      } }, "✕ Remove");
  }

  /* The panel badge counts everything on the panel: conditions the player
     applied, conditions derived from another source, applied hazards, and
     applied bonuses. */
  function statusBadge(ch, hazCount, derivedCount) {
    var conds = ((ch && ch.conditions) || []).length;
    var bonuses = Object.keys((ch && ch.bonuses) || {}).length;
    var n = conds + (derivedCount || 0) + (hazCount || 0) + bonuses;
    return n ? n + " ACTIVE" : "NOTHING APPLIED";
  }

  /* ---- Bonuses ----------------------------------------------------------
     Class Buffs and Consumables. Everything here is player-declared, because
     none of it is derivable from this sheet: a Hot-Wire lives on somebody
     else's action, and a swallowed pill leaves no trace in the record.

     Pneumatic Bypass is the one with a live mechanical consequence, and the
     row says so rather than leaving the player to wonder: the engine reads the
     applied bonus and steps the unarmed strike, and the row prints the die it
     produced. */
  function bonusBlocks(ch, d) {
    var SC = EN.statusChanges; if (!SC) return [];
    var on = Object.keys((ch && ch.bonuses) || {});
    if (!on.length) return [];
    var kids = [hazSub("Bonuses")];
    // registry order, not record order, so the list does not reshuffle itself
    // as the player toggles things
    var ordered = [];
    SC.bonus.groups.forEach(function (g) {
      (g.options || []).forEach(function (o) { if (on.indexOf(o.key) !== -1) ordered.push(o); });
    });
    ordered.forEach(function (o) {
      var chips = [hazChip(o.groupName.toUpperCase(), "var(--accent)", o.source || "")];
      var stepped = null;
      var incSrc = (((d && d.unarmed) || {}).increases || {}).sources || [];
      if (incSrc.some(function (s) { return s.kind === "bonus" && s.label === o.name; })) {
        stepped = d.unarmed.die || (d.unarmed.flat ? String(d.unarmed.flat) : null);
      }
      if (stepped) chips.push(hazChip("UNARMED " + stepped, "var(--success)", "This bonus steps your unarmed strike; the sheet already reflects it"));
      if (o.requires) chips.push(hazChip("NEEDS " + o.requires.toUpperCase(), "var(--text3)", "The tuning must match the recipient's installed hardware"));
      // A consumable takes its prose from the gear catalog rather than carrying
      // a second copy of it here.
      var summary = o.summary || "";
      if (o.itemName && EN.engine && EN.engine.catalogItem) {
        var it = EN.engine.catalogItem(o.itemName);
        if (it) summary = it.desc || it.effect || summary;
      }
      kids.push(el("div.feature", { style: { borderLeftColor: "var(--success)" } }, [
        el("h4", null, [
          el("span", { text: o.name }),
          el("span", { style: { display: "flex", alignItems: "center", gap: "8px" } }, [statusRemoveBtn(o.key)])
        ]),
        el("div.row.wrap", { style: { gap: "5px", margin: "4px 0" } }, chips),
        el("p.help", { style: { margin: 0, color: "var(--text2)" }, text: summary }),
        o.endsOn ? el("p.help", { style: { margin: "3px 0 0" }, html: "<span style='color:var(--success)'>✓ Ends:</span> " + o.endsOn }) : null
      ]));
    });
    return kids;
  }

  /* How many Status Changes the hazard side is contributing to the panel badge.
     Applied, not merely running: an applied deprivation track that has not
     crossed its threshold yet is still a thing on the sheet the player put
     there, and the badge should say so. Drowning is counted with the
     conditions, not here, because that is where it now lives. */
  function hazardCount(hzd) {
    if (!hzd) return 0;
    return hzd.exposures.length
         + hzd.deprivation.filter(function (r) { return r.applied; }).length
         + hzd.breath.filter(function (b) { return b.kind === "vacuum" && b.applied; }).length
         + (hzd.caustic && hzd.caustic.applied ? 1 : 0);
  }

  /* ---- the writes. Each one touches exactly the row it names. ---------- */
  function exposureTick(row, fx) {
    // A Rebreather covering thin air means no save at all: the interval simply
    // burns the hour down. The clock starts when the hour runs out.
    if (row.shielded) {
      var left = 0;
      store.update(function (c) {
        var ex = ((c.hazards || {}).exposures || {})[row.id];
        if (ex) { ex.minutes = (ex.minutes | 0) + row.intervalMinutes; ex.clockMinutes = (ex.clockMinutes | 0) + row.intervalMinutes; }
        c.hazards.rebreatherMinutes = left = Math.max(0, (c.hazards.rebreatherMinutes | 0) - row.intervalMinutes);
      });
      toast(row.intervalMinutes + " min of thin air passes with no save; the " + row.shieldFrom + " is covering you. "
        + (left > 0 ? left + " min of cover left." : "The cover is spent; the clock starts now at DC " + row.dc + "."));
      return;
    }
    var r = hazardSave(row, row.dc, fx);
    var gained = 0, capped = false;
    store.update(function (c) {
      var ex = ((c.hazards || {}).exposures || {})[row.id];
      if (!ex) return;
      ex.saves = (ex.saves | 0) + 1;                       // THIS row's counter, and only this one
      ex.minutes = (ex.minutes | 0) + row.intervalMinutes;
      if (r.pass) { ex.clockMinutes = 0; return; }         // success: the clock restarts, the DC does not
      ex.clockMinutes = (ex.clockMinutes | 0) + row.intervalMinutes;
      if (row.noFatigue) return;
      gained = gainFatigue(c, 1);
      capped = gained === 0;
      ex.fatigue = (ex.fatigue | 0) + gained;
      // Thin-air Fatigue is attributed to the CHARACTER, not to this row, so
      // the attribution survives the row and does not outlive the Fatigue.
      // ex.fatigue stays as this row's own tally for its chip; it is no longer
      // what the Long Rest lock reads.
      if (ex.type === "thinair" && gained) {
        c.hazards.thinAirFatigue = Math.max(0, c.hazards.thinAirFatigue | 0) + gained;
      }
    });
    var tail = r.pass ? " No effect; the clock restarts, the DC does not. Next save DC " + row.nextDC + "."
      : row.noFatigue ? (" " + row.noFatigueFrom + " refuses the Fatigue."
          + (row.lethalDamage ? " Lethal severity: still take " + row.lethalDamage.dice + " " + row.lethalDamage.type + "." : "")
          + " Next save DC " + row.nextDC + ".")
      : capped ? " Fatigue is already at 6 (Helpless)."
      : (" +1 level of Fatigue." + (row.lethalDamage ? " Lethal severity: also take " + row.lethalDamage.dice + " " + row.lethalDamage.type + "." : "")
         + " Next save DC " + row.nextDC + ".");
    toast(row.typeName + " " + rollText(r) + "." + tail);
  }
  function exposureLeave(row) {
    store.update(function (c) {
      var m = (c.hazards || {}).exposures;
      if (m) delete m[row.id];
    });
    // deleting the row IS the reset: the escalating DC lived nowhere else.
    // The thin-air ATTRIBUTION is not in the row, so leaving does not launder
    // it. Descending suspends the lock; climbing back up re-applies it to the
    // same levels, because the count lives on the character.
    var stillUp = Object.keys(((store.active() || {}).hazards || {}).exposures || {}).some(function (id) {
      var ex = store.active().hazards.exposures[id];
      return ex && ex.type === "thinair";
    });
    toast("Left the " + row.typeName + " exposure. Clock and DC both reset; a new exposure starts again at DC "
      + EN.hazards.exposure.baseDC + ". Fatigue already gained stays and comes off by the normal Fatigue rules."
      + (row.lockedFatigue && !stillUp
          ? " You are off the altitude, so its " + row.lockedFatigue + " level(s) of thin-air Fatigue are no longer locked; going back up locks them again."
          : row.lockedFatigue ? " Another thin-air exposure is still running, so those levels stay locked." : ""));
  }
  function depDay(row, delta) {
    store.update(function (c) {
      var t = ((c.hazards || {}).deprivation || {})[row.track];
      if (!t) return;
      var was = row.crossed;
      t.days = Math.max(0, (t.days | 0) + delta);
      /* Dropping back below the threshold ENDS the exposure, and leaving an
         exposure resets both the clock and the DC. An exposure row cannot get
         this wrong because LEAVE deletes it and the DC lived nowhere else; a
         deprivation track has no row to delete, so stepping the days down was
         leaving `saves` in place and a fresh thirst resumed at DC 16 instead of
         10. Stepping back down is the natural gesture for "I got a drink
         yesterday", so this cannot be left to remembering RESET. Fatigue
         already stacked is untouched, exactly as it is for an exposure. */
      if (was && t.days < row.thresholdDays) { t.saves = 0; t.clockMinutes = 0; }
    });
  }
  function depTick(row, fx) {
    var r = hazardSave(row, row.dc, fx);
    var gained = 0;
    store.update(function (c) {
      var t = ((c.hazards || {}).deprivation || {})[row.track];
      if (!t) return;
      t.saves = (t.saves | 0) + 1;                          // this track's own counter; the other two do not move
      if (r.pass) return;
      gained = gainFatigue(c, 1);
      t.fatigue = (t.fatigue | 0) + gained;                 // and its own Fatigue tally
    });
    toast(row.trackName + " " + rollText(r) + "." + (r.pass ? " No effect." : gained ? " +1 level of Fatigue." : " Fatigue is already at 6 (Helpless).")
      + " Next save DC " + row.nextDC + ".");
  }
  function depReset(row) {
    store.update(function (c) {
      var t = ((c.hazards || {}).deprivation || {})[row.track];
      if (t) { t.days = 0; t.saves = 0; t.fatigue = 0; }
    });
    toast(row.trackName + " clock and DC reset. Fatigue already gained stays.");
  }
  function breathStart(b) {
    store.update(function (c) {
      var s = ((c.hazards || {}).breath || {})[b.kind];
      if (s) { s.active = true; s.rounds = 0; s.saves = 0; }
    });
    toast(b.name + " begins. Breath held for " + b.holdRounds + " rounds (your Body score), then Body Save DC "
      + EN.hazards.breath.dc + ", +" + EN.hazards.breath.step + " each round.");
  }
  function breathEnd(b) {
    store.update(function (c) {
      var s = ((c.hazards || {}).breath || {})[b.kind];
      if (s) { s.active = false; s.rounds = 0; s.saves = 0; }
    });
    toast(b.name + " ends. " + b.ends);
  }
  function breathTick(b, fx, d) {
    var holding = b.holding > 0;
    var r = holding ? null : hazardSave(b, b.dc, fx);
    var wounds = null, dead = false, ko = false;
    store.update(function (c) {
      var s = ((c.hazards || {}).breath || {})[b.kind];
      if (!s) return;
      s.rounds = (s.rounds | 0) + 1;
      if (holding) return;
      s.saves = (s.saves | 0) + 1;                          // this exposure's own counter
      if (r.pass) return;
      var st = state(c, d);
      wounds = Math.max(0, st.wounds - b.woundsOnFail);
      c.wounds.current = wounds;
      if (wounds <= 0) dead = true;
      else if (wounds <= b.halfWounds) { ko = true; if ((c.conditions || []).indexOf("Unconscious") === -1) (c.conditions = c.conditions || []).push("Unconscious"); }
    });
    var rider = b.everyRoundDamage ? " Every round regardless of the save: " + b.everyRoundDamage.dice + " " + b.everyRoundDamage.type + "." : "";
    if (holding) { toast(b.name + " round " + (b.rounds + 1) + ": still holding (" + Math.max(0, b.holding - 1) + " of " + b.holdRounds + " left)." + rider); return; }
    toast(b.name + " " + rollText(r) + "." + (r.pass ? "" : " Take " + b.woundsOnFail + " Wound.")
      + (dead ? " Wounds reduced to 0 while exposed: you die." : ko ? " At or below half Wounds: you also fall Unconscious." : "")
      + rider + " Next save DC " + b.nextDC + ".");
  }
  function causticToggle(cz) {
    var wasInside = cz.inside;
    store.update(function (c) {
      var q = (c.hazards || {}).caustic; if (!q) return;
      if (q.inside) { q.inside = false; q.lingering = true; }   // the residue comes out with you
      else q.inside = true;
    });
    toast(wasInside ? "Stepped out. The residue comes with you: it keeps burning until washed off."
                    : "Stepped into it. 1d6 Acid at the end of each turn spent in it.");
  }
  function causticTurn(cz) {
    store.update(function (c) {
      var q = (c.hazards || {}).caustic; if (!q) return;
      q.sceneTicks = (q.sceneTicks | 0) + 1;    // turns in it, this scene; display only
    });
    toast(cz.insideDamage ? (cz.insideDamage.dice + " " + cz.insideDamage.type + " at the end of this turn.")
                          : ("No damage: " + cz.stoppedBy + "."));
  }
  /* A full scene of exposure degrades unsealed armor by 1 DR, and it goes through
     EN.engine.applyArmorDamage, the ONE writer, against the ARMOR ENTRY. So two
     identical suits cannot share it, a re-bought suit arrives at full DR, and the
     loss shows up everywhere DR shows up rather than in a ledger of its own.

     This used to write a parallel ch.hazards.caustic.armorDR and hand the loss to
     EN.armorRepair.applyDegradation if that module existed. It never did: Armor
     Repair merged as EN.crafting.armorRepair plus the engine's resolver and
     writer, so the hook could not fire and the rule was inert on a build that had
     everything it needed. The ledger is retired in migrate().

     Two consequences worth stating rather than discovering. The quality edge
     applies here like anywhere else, so a freshly repaired suit shrugs off one
     scene and says so; and "minimum 0" needs no enforcement of its own, because
     the writer clamps to [0, base] by construction. */
  function causticScene(cz) {
    var dg = cz.degradation, rule = cz.degradationRule;
    if (!dg.exposed || !dg.armorKey) return;
    var res = null;
    store.update(function (c) {
      var q = (c.hazards || {}).caustic; if (q) q.sceneTicks = 0;
      res = eng.applyArmorDamage(c, dg.armorKey, rule.drLost);
    });
    if (!res) return;
    if (res.absorbed) { toast("A full scene in it, and " + dg.armor + " holds: the freshly seated plate takes the corrosion instead. No DR lost."); return; }
    toast("A full scene in it: " + dg.armor + " is down to " + res.current + " of " + res.base + " DR"
      + (res.breached ? ", breached. Rebuilding it is a full Project on the Impact Table."
                      : ", until repaired during " + rule.repairedBy + " on the Impact Table."));
  }
  function causticWash() {
    store.update(function (c) { var q = (c.hazards || {}).caustic; if (q) q.lingering = false; });
    toast("Washed off (an Action, and something to wash with). The lingering Acid stops.");
  }
  /* "Until repaired during Downtime" is the Impact Table's job now, and it is
     priced there: a shop lane, a bench Project, or a rebuild at 0 DR. This used to
     be a free REPAIR button that deleted the ledger row, which was the only thing
     available while the loss was a pending number nothing defended with. Sending
     the player to the lanes is the rule the caustic entry has always pointed at.
     A misclick is still free: the `↶ UNDO` beside the DR track on both the Block
     row and the Impact Table gives the point back. */
  function causticOpenRepair() {
    if (EN.inventoryView.openBench) EN.inventoryView.openBench("armor");
    EN.app.gotoTab("gear");
  }

  /* ---------- the tabbed Freelancer Actions panel ----------
     One play-facing record with five tabs:
       Abilities  active, spendable, triggerable things (resource abilities + active features)
       Features   "what does my character have": passive computed features + manual GM/player entries
       Weapons    equipped-weapon attacks (unchanged behavior; pulled from the Inventory stash)
       Loadout    a filtered view of Inventory: what's carried / worn / equipped for the scene
       Notes      a freeform field (shared with the #PRINT Identity notes)
     DEFEND is intentionally NOT a tab; it lives in its own always-visible section. */
  var _panelTab = "abilities";
  var _featShowHidden = false;    // reveal computed features the player has hidden

  /* resource features that bundle several abilities (Moxie Gambits, Overdrive Maneuvers, Triage
     Protocols, ...) are broken out into their own rows, each tagged with its resource cost chip,
     instead of one wall of text. The list is the class's own resource.abilities. */
  function shortAction(a) {
    if (!a) return "";
    if (/^Action$/i.test(a)) return "Action";
    return a.replace(/\s*Action$/i, "").trim() || a;
  }
  // build { <resourceName>: { subs:[{name, action, cost, text}] } } for the active character
  function resourceExpansion(ch, d) {
    var out = {};
    if (!d || !d.resource || !d.resource.name) return out;
    // only classes whose resource carries a structured ability list get expanded (not Shaper).
    // Always expand when the list exists, even to zero rows, so the foundational feature's wall
    // of text is replaced by the chosen abilities (none until the player picks any).
    if (!eng.resourceAbilities || !eng.resourceAbilities(ch).length) return out;
    var abil = eng.chosenResourceAbilities ? eng.chosenResourceAbilities(ch) : [];
    out[d.resource.name] = { subs: abil.map(function (a) {
      return { name: a.name, action: shortAction(a.action), cost: a.cost, text: a.text };
    }) };
    return out;
  }
  function actionCost(text) {
    if (/Impulse Action/i.test(text || "")) return "Impulse";
    if (/Swift Action/i.test(text || "")) return "Swift";
    if (/Free Action/i.test(text || "")) return "Free";
    if (/Complex Action/i.test(text || "")) return "Complex";
    if (/as an Action|use your Action|spend (an|your) Action|standard Action|as a single Action|take the Attack Action/i.test(text || "")) return "Action";
    if (/Special Action/i.test(text || "")) return "Special";
    return "Passive";
  }
  function isLimited(text) {
    return /once per|per Long Rest|per Short Rest|per Encounter|number of times equal|per scene|per turn/i.test(text || "");
  }
  /* parse "uses per rest" specs out of feature text; covers every phrasing in the data:
     "a number of times/uses equal to your Caliber per Long/Short Rest", "a number of times
     per X equal to your Caliber", "once/twice/N times per Long Rest/Short Rest/Encounter/scene" */
  function parseUses(text, d) {
    if (!text) return null;
    var t = text.replace(/\s+/g, " ");
    var m;
    if ((m = t.match(/number of (?:times|uses)(?:[^.]{0,60}?)equal to your Caliber per (Long|Short) Rest/i)))
      return { max: d.caliber, recharge: cap(m[1]) + " Rest" };
    if ((m = t.match(/number of (?:times|uses) per (Long|Short) Rest equal to your Caliber/i)))
      return { max: d.caliber, recharge: cap(m[1]) + " Rest" };
    if (/number of (?:times|uses) per Encounter equal to your Caliber/i.test(t))
      return { max: d.caliber, recharge: "Encounter" };
    if ((m = t.match(/\b(once|twice|(\d+) times) per (Long Rest|Short Rest|Encounter|scene)\b/i))) {
      var max = m[2] ? Number(m[2]) : (/twice/i.test(m[1]) ? 2 : 1);
      var r = m[3].toLowerCase();
      return { max: max, recharge: r === "scene" ? "Scene" : r === "encounter" ? "Encounter" : cap(r.split(" ")[0]) + " Rest" };
    }
    return null;
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }
  }
  var COST_COLOR = { Action: "var(--accent)", Swift: "var(--gold)", Impulse: "var(--flow)", Free: "var(--success)", Active: "var(--accent)", Passive: "var(--text3)", Complex: "var(--ember)", Special: "var(--gold)" };
  /* class-resource identity colors; the resource bar + count tint to match its fuel */
  var RESOURCE_COLOR = {
    Bandwidth: "var(--bw)",   // electric blue, data / signal / system capacity (shared with #GRID)
    Overdrive: "#FF7A00",   // hazard orange, heat / adrenaline / past safe limits
    Leverage:  "#D6A21E",   // gold, influence / favors / social capital
    Execution: "#B11226",   // crimson, sharp / decisive / final
    Moxie:     "#FF2DAA",   // neon magenta, stylish / defiant / reckless
    Flow:      "var(--fp)",   // arc-violet, mystical / unstable (shared with the Flow tab)
    Triage:    "#2FE6A6"    // medical mint, clinical / restorative / urgent
  };
  function resourceColor(name) { return RESOURCE_COLOR[name] || "var(--accent)"; }

  /* ---- The Trauma Rig as an OBJECT. Anyone can buy one, so this block is not
     Stitcher-only: it renders off d.rig, which the engine derives for every class.
     The Triage Save DC, the Triage pool and the Scrap Rig's Protocol penalties are the
     class resource's business and are rendered separately, next to the pool.

     The counterpart of the #GRID tab's Rig panel, and built the same way: a picker
     over the Trauma Rigs the character actually OWNS (one option per equipment entry,
     so two Rigs of one tier are two options), the tier's derived numbers, its
     accumulated traits, and the System Integrity of the #GRID node the Rig projects.
     Every value comes off d.rig, which reads the tier row; nothing is recalculated here,
     and in particular the picker's SELECTION is the engine's resolved d.rig.rigKey rather
     than a second reading of raw storage, so what the picker shows is always the Rig the
     rest of the sheet is using. It takes only the DERIVED record, deliberately: with no
     ch in scope it cannot grow a second reading of raw storage again. */
  /* Collapsible header for the two device cards, plus the one thing worth keeping visible
     when they are shut. Of everything on those cards only Integrity moves during play: the
     picker, the chips, the traits and the next rung are all reference you read once. So the
     compact state is header + Integrity + bar, and at a glance you can still see a deck or a
     Rig walking toward Bricked without opening anything.

     Collapsed by default, matching every other collapsible panel in the app. State lives in
     the same _open map the rest of this view uses, so it survives a re-render and resets on
     reload like the others. */
  function deviceHeader(key, title, tierLabel) {
    var open = !!_open[key];
    return el("div.section-title.clickable.device-head", {
      title: open ? "Collapse: keep only the Integrity readout"
                  : "Expand: picker, chips, traits and upgrade price",
      style: { margin: "12px 0 4px", cursor: "pointer" },
      onclick: function () { _open[key] = !open; EN.app.render(); }
    }, [
      el("span.collapse-caret", { text: open ? "\u25be" : "\u25b8" }),
      document.createTextNode(" " + title),
      el("span.line"),
      el("span.mono", { style: { fontSize: "10px", color: "var(--text3)" }, text: tierLabel }),
      // names what a tap will do, because a caret on its own is not an instruction
      el("span.dev-toggle", { text: open ? "COLLAPSE" : "EXPAND" })
    ]);
  }
  // The Integrity readout shared by both cards' compact and open states, so the two can never
  // disagree about what "Bricked" looks like. Controls are passed in, and omitted when shut.
  function integrityBlock(label, cur, maxInt, bricked, controls) {
    return el("div", { style: { marginTop: "8px" } }, [
      el("div.row.between", { style: { alignItems: "baseline" } }, [
        el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".12em", color: "var(--text3)" }, text: label }),
        el("span.mono", { style: { fontSize: "13px", color: bricked ? "var(--danger)" : "var(--text2)" },
                          text: bricked ? "BRICKED" : cur + " / " + maxInt })
      ]),
      bar(cur, maxInt, bricked ? "var(--danger)" : "var(--success)"),
      controls || null
    ]);
  }

  /* The Smartdeck's Freelancer-tab card, the exact counterpart to traumaRigKids below, and
     placed by the same rule: a device that IS your class's hardware belongs inside your class
     resource card, and a device you merely own stands on its own.

         Codebreaker  -> folded into the Bandwidth resource card (Bandwidth IS the deck's output)
         anyone else  -> its own block, the way a Trauma Rig sits for a non-Stitcher
         Stitcher     -> the mirror image: the Rig folds in, the deck stands alone

     Selection and Integrity both delegate to EN.gridView, which owns those writes. Changing
     tier zeroes damage and prunes mods that no longer fit the smaller slot count, and Integrity
     is stored as damage TAKEN rather than remaining, so neither is re-implemented here. This
     card deliberately omits the Bandwidth track, the Links and the cipher list: the first is
     the resource card it sits inside, and the other two are the #GRID tab's job. */
  /* The Smartdeck as it reads on the Freelancer tab: ONE contained card holding the deck and
     the Bandwidth it produces. Those were two separate stacks with their own spacing, which
     read as two unrelated things parked next to each other.

     This is deliberately thinner than the #GRID tab's panel. It carries what a Codebreaker
     touches mid-turn, the two live numbers and their controls, so simple play needs no tab
     hop. Device Bonus, Mod Slots, traits and the upgrade price are all reference and live on
     #GRID, which is the tab for when you need the full picture.

     resKids is the class resource's own rows, handed in by the caller so the pool renders
     INSIDE this card rather than below it. It stays visible when the card is collapsed:
     Bandwidth is spent every turn, and hiding it behind a toggle would defeat the point. */
  function smartdeckKids(d, ch, resKids) {
    var gd = d.grid || {}, deck = gd.deck;
    var gv = EN.gridView || {};
    var od = gv.ownedRigRows ? gv.ownedRigRows(ch) : { smartdecks: [], buddies: [], all: [] };
    var _openKey = "fl-smartdeck", _isOpen = !!_open[_openKey];
    var body = [];

    body.push(deviceHeader(_openKey, "Smartdeck",
      deck ? (deck.tier + " \u00b7 " + (deck.type === "buddy" ? "B&E Buddy" : "Smartdeck")).toUpperCase() : "NONE JACKED IN"));

    if (!deck) {
      body.push(el("p.help", { style: { margin: "2px 0 6px", fontSize: "10.5px" },
        text: "No rig jacked in. A Codebreaker runs a Smartdeck as a Power User; anyone else can crack low-tier nodes with a B&E Buddy." }));
      body.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        el("button.btn.sm", { style: { color: "var(--flow)", borderColor: "var(--flow)" },
          title: (od.all || []).length ? "Open the Stash and jack a deck in" : "Nothing to jack in yet; buy a rig first",
          onclick: function () { if (EN.inventoryView.openStash) EN.inventoryView.openStash("Smartdecks & B&E Buddies"); EN.app.gotoTab("gear"); } },
          (od.all || []).length ? "\u21d2 EQUIP ONE IN STASH" : "\u21d2 BUY ONE IN THE MARKET")
      ]));
      (resKids || []).forEach(function (k) { body.push(k); });
      return [el("div.device-card", null, body)];
    }

    // name and the two facts that decide what you can run, mirroring the #GRID header line
    body.push(el("div.dev-line", null, [
      el("span.dev-name", { text: deck.tier + " " + (deck.type === "buddy" ? "B&E Buddy" : "Smartdeck") }),
      el("span.chip", { style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" },
        title: "Power Users run the full cipher library; Standard Users are limited to a Buddy's baked-in suite" }, String(gd.userType || "").toUpperCase()),
      deck.maxComplexity != null ? el("span.chip", { style: { fontSize: "9.5px", color: "var(--flow)", borderColor: "var(--flow)" },
        title: "Runs ciphers up to this Complexity" }, "\u2264 CX " + deck.maxComplexity) : null
    ]));

    var _maxInt = deck.maxIntegrity, _spent = deck.spent, _cur = deck.integrity, _bricked = deck.bricked;
    var amt = el("input", { type: "number", value: "1", min: "1",
      style: { width: "44px", fontSize: "12px", textAlign: "center", padding: "3px 4px" } });
    function shiftDeck(sign) {
      var n = Math.max(1, parseInt(amt.value, 10) || 1);
      if (gv.shiftDeckIntegrity) gv.shiftDeckIntegrity(sign * n, _maxInt, deck.key);
    }
    var controls = _isOpen ? el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "5px" } }, [
      amt,
      el("button.btn.sm", { disabled: _bricked, title: "Subtract this much Integrity",
        style: { color: "var(--danger)", borderColor: "var(--danger)" }, onclick: function () { shiftDeck(1); } }, "\u2212 DAMAGE"),
      el("button.btn.sm", { disabled: _spent <= 0, title: "Restore this much Integrity",
        onclick: function () { shiftDeck(-1); } }, "+ REPAIR"),
      _spent > 0 ? el("button.btn.sm", { style: { color: "var(--text2)" },
        onclick: function () { if (gv.repairDeckFully) gv.repairDeckFully(deck.key); toast("Smartdeck restored to full Integrity."); } }, "\u27f3 FULL") : null
    ]) : null;
    var meter = integrityBlock("SYSTEM INTEGRITY", _cur, _maxInt, _bricked, controls);
    meter.className = "dev-meter";
    body.push(meter);

    // the pool the deck produces, inside the same card
    (resKids || []).forEach(function (k) { body.push(k); });
    return [el("div.device-card", null, body)];
  }

  function traumaRigKids(d, resKids) {
    var t = d.rig, T = EN.traumaRigs || {}, tiers = T.tiers || [];
    var mint = resourceColor("Triage");
    var owned = t.ownedRigs || [];
    // The Scrap Rig is a Stitcher's Long Rest fallback for running Protocols, so only a
    // Stitcher is offered it; everyone else picks from the Rigs they own or none.
    var isStitcher = !!d.triage;
    var kids = [];

    var _openKey = "fl-traumarig", _isOpen = !!_open[_openKey];

    kids.push(deviceHeader(_openKey, "Trauma Rig", t.scrapRig ? "SCRAP RIG" : (t.rigLabel || "NONE EQUIPPED").toUpperCase()));

    // COMPACT: only Integrity moves in play, so that is all the shut card keeps. A Rig with
    // no tier projects no node, so there is no Integrity to show.
    if (!_isOpen) {
      if (t.rigTier) kids.push(integrityBlock("RIG INTEGRITY", t.integrity, t.maxIntegrity, t.bricked, null));
      (resKids || []).forEach(function (k) { kids.push(k); });
      return [el("div.device-card", null, kids)];
    }

    /* No picker here any more: a Rig goes live because you pressed WEAR on its Stash row.

       The SCRAP RIG stays, though, and it is not a picker. It is a Stitcher improvising with
       no hardware, so it owns no equipment entry and cannot have a Stash row without inventing
       a fake entry key, which the entry-identity rule forbids. Note the exclusion runs one way
       only: equipping a real Rig clears scrap (in the engine's EQUIP_SLOTS), but taking a Rig
       off does NOT set it, because "no Rig" and "improvised Rig" are different states and the
       Stash cannot know which one was meant. */
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "2px" } }, [
      // Same rule as the deck. The Scrap Rig toggle below is NOT gated: it is a Stitcher state,
      // not a picker, and staying reachable while a real Rig is worn is the point of it.
      t.rigTier ? null : el("button.btn.sm", { style: { color: "var(--flow)", borderColor: "var(--flow)" },
        title: owned.length ? "Open the Stash and wear a Trauma Rig" : "Nothing to wear yet; buy a Rig first",
        onclick: function () { if (EN.inventoryView.openStash) EN.inventoryView.openStash("Trauma Rigs"); EN.app.gotoTab("gear"); } },
        owned.length ? "⇒ EQUIP ONE IN STASH" : "⇒ BUY ONE IN THE MARKET"),
      isStitcher ? el("button.btn.sm" + (t.scrapRig ? ".primary" : ""), {
        title: t.scrapRig ? "Stop improvising" : "Improvise a Rig from scrap: Output Bonus +0, and Snag on all Triage healing and attack rolls",
        style: t.scrapRig ? null : { color: "var(--text2)" },
        onclick: function () {
          var on = !t.scrapRig;
          store.update(function (c) { c.rig = c.rig || {}; c.rig.scrap = on; if (on) c.rig.key = null; });
          toast(on ? "Scrap Rig cobbled together." : "Scrap Rig set aside.");
        } }, t.scrapRig ? "✓ SCRAP RIG" : "COBBLE A SCRAP RIG") : null
    ]));

    if (!t.rigTier) {
      kids.push(el("p.help", { style: { margin: "4px 0 0", fontSize: "10.5px" },
        text: t.scrapRig ? (T.scrapRig || "")
          : "No Rig equipped, so Output Bonus is +0. " + (isStitcher ? (T.startingRig || "")
            : "Anyone can buy a Trauma Rig; running Triage Protocols through one is the Stitcher's trade.") }));
      (resKids || []).forEach(function (k) { kids.push(k); });
      return [el("div.device-card", null, kids)];
    }

    // the tier's derived numbers: Output Bonus, Mod Slots (= Tier), the node it projects
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, [
      el("span.chip", { style: { fontSize: "9.5px", color: mint, borderColor: mint }, title: T.outputBonusNote || "" },
        "OUTPUT " + (t.outputBonus >= 0 ? "+" : "") + t.outputBonus),
      el("span.chip", { style: { fontSize: "9.5px", color: "var(--accent)", borderColor: "var(--accent)" }, title: T.modSlotNote || "" },
        "MOD SLOTS " + t.modSlots + " / TIER " + t.rigTierIndex),
      t.medkitGrade ? el("span.chip", { style: { fontSize: "9.5px", color: "var(--success)", borderColor: "var(--success)" },
        title: T.medicalBaseline || "" }, "COUNTS AS " + t.medkitGrade.toUpperCase()) : null,
      t.nodeTier ? el("span.chip", { style: { fontSize: "9.5px", color: "var(--bw)", borderColor: "var(--bw)" },
        title: T.integrityNote || "" }, "#GRID NODE " + t.nodeTier.toUpperCase()) : null
    ]));

    // System Integrity of the projected node, tracked the way a Smartdeck's is
    var maxInt = t.maxIntegrity, cur = t.integrity, bricked = t.bricked;
    var amt = el("input.mono", { type: "number", min: "1", value: "1", title: "Amount of Integrity to subtract or restore",
      style: { width: "54px", textAlign: "center", padding: "4px 6px" } });
    // Damage is written under the live Rig's own ENTRY key and accumulates from the
    // DERIVED spend, so it lands on this object and nothing else: no other Rig's total
    // moves, and a Rig that leaves the stash takes its damage out of play with it.
    function shift(sign) {
      var n = Math.max(1, parseInt(amt.value, 10) || 1);
      var key = t.rigKey, base = t.integritySpent;
      if (!key) return;
      store.update(function (c) {
        c.rig = c.rig || {}; c.rig.hp = c.rig.hp || {};
        var v = eng.clamp(base + sign * n, 0, maxInt);
        if (v > 0) c.rig.hp[key] = v; else delete c.rig.hp[key];
      });
    }
    kids.push(integrityBlock("RIG INTEGRITY", cur, maxInt, bricked,
        el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
          amt,
          el("button.btn.sm", { disabled: bricked, style: { color: "var(--danger)", borderColor: "var(--danger)" },
            title: "Subtract this much Integrity", onclick: function () { shift(1); } }, "− DAMAGE"),
          el("button.btn.sm", { disabled: t.integritySpent <= 0, title: "Restore this much Integrity",
            onclick: function () { shift(-1); } }, "+ REPAIR"),
          t.integritySpent > 0 ? el("button.btn.sm", { style: { color: "var(--text2)" },
            onclick: function () { var key = t.rigKey; store.update(function (c) { c.rig = c.rig || {}; if (c.rig.hp) delete c.rig.hp[key]; }); toast("Trauma Rig restored to full Integrity."); } }, "⟳ FULL") : null
        ])
    ));

    // traits: this tier's own, plus every trait below it
    if (t.traits.length) {
      var defs = T.traitDefs || {};
      kids.push(el("div.row.wrap", { style: { gap: "6px", marginTop: "8px", alignItems: "center" } },
        [el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "2px" }, text: "TRAITS" })].concat(
          t.traits.map(function (nm) {
            return el("span.chip", { title: defs[nm] || "", style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, nm);
          }))));
      kids.push(el("p.help", { style: { margin: "4px 0 0", fontSize: "10.5px" }, text: T.traitNote || "" }));
    }
    // the one rung above, so an upgrade is a known price rather than a mystery
    var next = tiers.find(function (r) { return r.t === t.rigTierIndex + 1; });
    if (next) kids.push(el("p.help", { style: { margin: "2px 0 0", fontSize: "10.5px", color: "var(--text3)" },
      text: "Next rung: " + next.label + ", \u{1D4A2}" + next.price.toLocaleString() + " · +" + next.outputBonus +
            " Output · " + next.modSlots + " mod slots · adds " + next.trait + "." }));
    // the pool the Rig feeds, inside the same card
    (resKids || []).forEach(function (k) { kids.push(k); });
    return [el("div.device-card", null, kids)];
  }

  /* a resource chip like "1 MOXIE" tints to the resource named within it */
  function chipResourceColor(chip) {
    var up = String(chip || "").toUpperCase();
    var keys = Object.keys(RESOURCE_COLOR);
    for (var i = 0; i < keys.length; i++) { if (up.indexOf(keys[i].toUpperCase()) > -1) return RESOURCE_COLOR[keys[i]]; }
    return "var(--gold)";
  }
  function actionEntry(id, name, cost, src, text, limited, chip, uses, onUse, canUse) {
    var open = !!_open[id];
    var usesRow = null;
    if (uses && uses.max > 0) {
      var boxes = [];
      for (var i = 1; i <= uses.max; i++) {
        (function (i) {
          var used = i <= uses.spent;
          boxes.push(el("span", {
            title: used ? "Used, click to undo" : "Click to spend a use",
            onclick: function () { uses.onSet(i === uses.spent ? i - 1 : i); },
            style: { width: "14px", height: "14px", borderRadius: "3px", cursor: "pointer", flex: "0 0 auto",
                     border: "1px solid " + (used ? "var(--danger)" : "var(--text3)"),
                     background: used ? "var(--danger)" : "transparent",
                     boxShadow: used ? "0 0 6px var(--danger)" : "none" }
          }));
        })(i);
      }
      usesRow = el("div.row", { style: { gap: "5px", alignItems: "center", marginTop: "6px", flexWrap: "wrap" } },
        boxes.concat([el("span.help", { style: { margin: "0 0 0 3px", fontSize: "10.5px" }, text: "/ " + uses.recharge }),
          uses.spent >= uses.max ? el("span", { style: { fontFamily: "var(--mono)", fontSize: "10px", color: "var(--danger)", letterSpacing: ".08em" }, text: "EXPENDED" }) : null]));
    }
    var useBtn = onUse ? el("button", {
      title: canUse ? ("Spend " + chip + " to activate") : "Not enough " + chip,
      onclick: function (e) { e.stopPropagation(); if (canUse) onUse(); },
      style: { marginLeft: "auto", marginRight: "8px", padding: "2px 10px", fontSize: "10px",
               fontFamily: "var(--mono)", letterSpacing: ".1em",
               background: canUse ? "rgba(255,45,170,.15)" : "transparent",
               color: canUse ? "var(--flow)" : "var(--text4)",
               border: "1px solid " + (canUse ? "var(--flow)" : "var(--border2)"),
               borderRadius: "3px", cursor: canUse ? "pointer" : "default" }
    }, "USE") : null;
    return el("div.feature", { style: { borderLeftColor: COST_COLOR[cost] || "var(--border2)" } }, [
      el("h4", { style: { cursor: "pointer" }, onclick: function () { _open[id] = !open; EN.app.render(); } }, [
        el("span", null, [el("span.collapse-caret", { text: open ? "▾" : "▸" }), document.createTextNode(" " + name),
          el("span.chip", { style: { marginLeft: "8px", fontSize: "9.5px", color: COST_COLOR[cost], borderColor: COST_COLOR[cost] }, text: cost.toUpperCase() }),
          chip ? el("span.chip", { title: "Spends the class resource", style: { marginLeft: "4px", fontSize: "9.5px", color: chipResourceColor(chip), borderColor: chipResourceColor(chip) }, text: chip }) : null]),
        useBtn
      ]),
      open ? el("div", null, [
        el("p", { style: { margin: "0 0 4px" }, text: text || "" }),
        src ? el("div", { style: { textAlign: "right", fontSize: "10px", color: "var(--text3)", fontFamily: "var(--mono)", letterSpacing: ".08em", marginTop: "6px" } }, src) : null
      ]) : null,
      usesRow
    ]);
  }
  // `extra` is an optional node that wraps onto its own line inside the same
  // bordered band as the row (the unarmed strike picker rides there).
  function attackRow(name, hit, note, color, snagWhy, onClick, extra) {
    return el("div.row.wrap", { style: { gap: "10px", alignItems: "center", padding: "8px 4px", borderBottom: "1px solid rgba(35,48,68,.5)" } }, [
      el("span", { style: { flex: 1, minWidth: "130px", fontWeight: 600 }, text: name }),
      snagWhy ? snagChip(snagWhy) : null,
      el("span.mono", { onclick: onClick || null, title: onClick ? "Tap to roll to hit" : "",
        style: { fontSize: "18px", color: color || "var(--accent)", minWidth: "48px", textAlign: "center",
          cursor: onClick ? "pointer" : "default", borderBottom: onClick ? "1px dotted currentColor" : "none" }, text: hit }),
      el("span.help", { style: { margin: 0, flex: 2 }, text: note }),
      extra || null
    ]);
  }

  /* ---------- unarmed strike picker ----------
     "If two replacers apply, the player chooses one per attack." The choice
     belongs to the player, so every replacer they have is listed on a STRIKE row
     and the live one is marked. The plain 1 + Body Modifier strike is one of the
     entries, because a bite or a spur kick is not always what you want to throw.
     Increases are NOT a choice, so they get their own row: one chip per source
     and a final chip spelling out the ladder walk, so a player looking at 1d10
     can see the three effects that got them there. Riders hang off a third row.
     With nothing to choose and nothing to explain there is no picker to draw. */
  var UNARMED_KIND = { lineage: "Natural Weapon", chrome: "Chrome", talent: "Talent" };
  // one chip row with the little all-caps label down its left
  function unarmedRow(label, chips) {
    return el("div.row.wrap", { style: { gap: "5px", marginTop: "7px", alignItems: "center", flex: "1 1 100%" } },
      [el("span", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: label })].concat(chips));
  }
  function unarmedPicker(strike, base) {
    var reps = strike.replacers, inc = strike.increases, riders = strike.riders;
    if (!reps.length && !inc.count && !riders.length && !strike.reach.spaces) return null;
    var rows = [];
    // STRIKE: the replacer choice. One replacer plus the bare punch is still a
    // real choice, so the row draws whenever there is anything to pick.
    if (reps.length) {
      // Every chip shows what THAT pick would actually deal, increases included.
      // Advertising the replacer's own die would print 1d6 next to a strike that
      // lands 1d12, and would print a flat 1 for a bare punch that steps to a die.
      var steps = inc.count;
      var baseStepped = eng.stepDie(null, steps);
      var entries = [{ pick: eng.unarmedBasePick, label: "Unarmed Strike", note: null, on: !strike.replacer,
        dmg: (baseStepped ? baseStepped : base.flat) + " " + base.type }]
        .concat(reps.map(function (o) {
          return { pick: o.pick, label: o.label || o.source, note: o.note,
            on: !!strike.replacer && strike.replacer.pick === o.pick,
            dmg: eng.stepDie(o.die, steps) + " " + o.type + (o.traits ? " (" + o.traits + ")" : "") };
        }));
      rows.push(unarmedRow("STRIKE", entries.map(function (e) {
        return el("span.chip" + (e.on ? ".on" : ""), {
          title: e.dmg + (e.note ? " · " + e.note : "") + (e.on ? "" : " · tap to strike with this instead"),
          style: { fontSize: "8.5px", cursor: "pointer" },
          onclick: function () { store.update(function (c) { c.unarmedPick = e.pick; }); }
        }, e.label + " · " + e.dmg);
      })));
    }
    // STEPS: why the die is what it is. The last chip walks the ladder from the
    // replacer's own die (or from nothing) to the die actually rolled.
    if (inc.count) {
      var chips = inc.sources.map(function (s) {
        return el("span.chip", { title: s.label + ": +" + s.steps + " die size" + (s.steps === 1 ? "" : "s") + (s.note ? " · " + s.note : ""),
          style: { fontSize: "8.5px", color: "var(--gold)", borderColor: "var(--gold)" } },
          s.label + " +" + s.steps);
      });
      chips.push(el("span.chip.on", {
        title: "Increases step the die up 1d4 to 1d6 to 1d8 to 1d10 to 1d12, they stack, and nothing caps how many apply. The ladder itself stops at 1d12.",
        style: { fontSize: "8.5px" } },
        (strike.baseDie || "no die") + " to " + strike.die + " (" + inc.count + " step" + (inc.count === 1 ? "" : "s") + ")"));
      rows.push(unarmedRow("STEPS", chips));
    }
    // PLUS: dice that ride alongside, and reach, which is not damage at all
    var plus = riders.map(function (r) {
      return el("span.chip", { title: r.label + (r.when ? " · " + r.when : "") + (r.note ? " · " + r.note : ""),
        style: { fontSize: "8.5px", color: "var(--ember)", borderColor: "var(--ember)" } },
        "+" + r.damage + " · " + r.label);
    });
    if (strike.reach.spaces) plus.push(el("span.chip", { title: strike.reach.sources.join(" + ") + ": extra reach, not extra damage",
      style: { fontSize: "8.5px", color: "var(--accent)", borderColor: "var(--accent)" } },
      "+" + strike.reach.spaces + " reach"));
    if (plus.length) rows.push(unarmedRow("PLUS", plus));
    return el("div", { style: { flex: "1 1 100%" } }, rows);
  }

  /* ---------- equipped-weapon attacks: normalization + ammo/fire-mode ----------
     Normalization spec validated against the rulebook reference tables (72/73 weapons;
     the lone flag, Harmonic Edge range, is a known reference inconsistency the
     consistent reach rule resolves correctly). */
  var FIRING_MODES = ["Single Shot", "Semi-Automatic", "Burst Fire", "Full-Auto"];
  // per-shot ammo cost. Single Shot & Semi-Automatic each spend 1 round per shot;
  // Semi-Auto differs by allowing a second shot via a Swift Action (fire it again), so
  // each tap here deducts 1. Burst Fire (3) and Full-Auto (8) spend their full volley per use.
  var MODE_COST = { "Single Shot": 1, "Semi-Automatic": 1, "Burst Fire": 3, "Full-Auto": 8 };
  var TRAIT_DISPLAY = { "Nonlethal": "Nonlethal Damage" };   // display rename to match reference

  function catWeapons() {
    var g = EN.gearCatalog || {};
    return [].concat((g.melee && g.melee.items) || [], (g.ranged && g.ranged.items) || [], (g.signature && g.signature.items) || []);
  }
  function findWeapon(name) { return catWeapons().find(function (x) { return x.name === name; }); }
  function ammoCatalog() { return (EN.gearCatalog.ammo && EN.gearCatalog.ammo.items) || []; }
  function munitions() { return (EN.gearCatalog.signature && EN.gearCatalog.signature.munitions) || []; }
  function ownedQty(ch, name) { var e = (ch.equipment || []).find(function (x) { return x.name === name; }); return e ? (e.qty || 0) : 0; }

  /* ---------- Loadout helpers (the Freelancer-tab filtered view of Inventory) ----------
     The full gear catalog (every bucket), item lookup, the per-item carry status the
     player sets, and the derived flags (heavy / restricted / limited-use) read off the
     item data so the Loadout view stays in sync with what's actually owned. */
  function fullCatalog() {
    var g = EN.gearCatalog || {};
    return [].concat(
      (g.melee && g.melee.items) || [], (g.ranged && g.ranged.items) || [],
      (g.signature && g.signature.items) || [], (g.signature && g.signature.munitions) || [],
      (g.ammo && g.ammo.items) || [], (g.armor && g.armor.items) || [], (g.tools && g.tools.items) || []);
  }
  function invItem(name) { return fullCatalog().find(function (x) { return x.name === name; }); }
  // entryKey: the stable identity a specific equipment entry equips/carries
  // under (its own id for an individually-tracked instance, else its shared
  // catalog name for a pooled consumable/ammo stack).
  function entryKey(e) { return EN.engine.entryKey ? EN.engine.entryKey(e) : (e && e.name); }
  function carryStatus(ch, key) { return (ch.carry && ch.carry[key]) || "stashed"; }
  // status is "stashed" | "carried" | "worn" | "racked|<carryGearEntryKey>";
  // racking stows the item in worn Carry Gear (Load reduced by 1, min 0)
  function setCarry(key, status) {
    store.update(function (c) {
      c.carry = c.carry || {};
      c.racked = c.racked || {};
      if (status && status.indexOf("racked|") === 0) {
        var gearKey = status.slice(7);
        if (gearKey) { c.carry[key] = "racked"; c.racked[key] = gearKey; }
        else { delete c.racked[key]; c.carry[key] = "carried"; }   // empty rack target self-heals to carried
      } else {
        delete c.racked[key];
        if (!status || status === "stashed") delete c.carry[key]; else c.carry[key] = status;
      }
    });
  }
  // Body Slot conflict resolution: benching an item stops it from counting
  // toward (or benefiting from) its slot, without touching its Load or rack state.
  function toggleSlotInert(key) {
    store.update(function (c) {
      c.slotInert = c.slotInert || {};
      if (c.slotInert[key]) delete c.slotInert[key]; else c.slotInert[key] = true;
    });
  }
  // Wear/take-off for slot-bearing gear that isn't armor/shield/focus (those
  // equip through their own dedicated field instead). Only "worn" competes
  // for its Body Slot; taking it off falls back to Carried, still on-person
  // and still costing Load, just not on your body anymore.
  function toggleWorn(key) {
    var ch = store.active();
    var cs = (ch.carry && ch.carry[key]) || "stashed";
    setCarry(key, cs === "worn" ? "carried" : "worn");
  }
  // a weapon (equippedWeapons) or the worn armor / wielded shield / attuned focus is on-person by definition
  function isEquippedAny(ch, key) {
    return (ch.equippedWeapons || []).indexOf(key) !== -1 || eng.isSlotEquipped(ch, key);
  }
  function equipLabel(ch, key) {
    if ((ch.equippedWeapons || []).indexOf(key) !== -1) return "Equipped";
    return eng.equipSlotLabel(ch, key);
  }
  function isHeavy(it) { return it.group === "Heavy" || (it.traits || []).some(function (t) { return /^Heavy\b/.test(t); }); }
  function isRestricted(it) { return it.legality === "Restricted" || it.legality === "Contraband"; }
  function isLimitedUse(it) { return !!it.counted || (it.traits || []).some(function (t) { return /^Disposable\b/.test(t); }); }

  /* damage parse: "1d8 Ballistic" / "2d6 Ballistic and Force" / "Unarmed + 1d4 Electric" / "0" */
  function parseDamage(raw) {
    var s = String(raw == null ? "" : raw).trim();
    if (s === "0" || s === "") return { dice: s === "0" ? "0" : "", types: [] };
    var m = s.match(/^Unarmed\s*\+\s*(\d+d\d+)\s+(.+)$/i);
    if (m) return { dice: "Unarmed + " + m[1], types: m[2].split(/\s+and\s+/i) };
    m = s.match(/^(\d+d\d+)\s+(.+)$/);
    if (m) return { dice: m[1], types: m[2].split(/\s+and\s+/i) };
    return { dice: s, types: [] };
  }
  function versatileDie(traits) {
    for (var i = 0; i < (traits || []).length; i++) { var m = String(traits[i]).match(/^Versatile\s*\((\d+d\d+)\)$/i); if (m) return m[1]; }
    return null;
  }
  function normalizeWeapon(it) {
    var p = parseDamage(it.damage);
    var dmg = p.dice, v = versatileDie(it.traits);
    if (v && /^\d+d\d+$/.test(p.dice)) dmg = p.dice + " (" + v + ")";
    // range
    var r = String(it.range || "").trim(), rangeDisplay;
    if (/^Melee/i.test(r)) { var rm = r.match(/Reach\s*(\d+)/i); rangeDisplay = String(1 + (rm ? +rm[1] : 0)); }
    else if (/^(Cone|Line|Aura|Cube|Sphere)$/i.test(r)) rangeDisplay = r;
    else { var nm = r.match(/^(\d+)\s*\/\s*(\d+)$/); rangeDisplay = nm ? nm[1] + "/" + nm[2] : r; }
    // ammo
    var ammoDisplay = (it.ammo == null) ? "" : (it.ammoUnit ? it.ammo + " (" + it.ammoUnit + ")" : String(it.ammo));
    // traits: mechanical (with display renames) + damage-type, deduped, alphabetized
    var set = {};
    (it.traits || []).forEach(function (t) { set[TRAIT_DISPLAY[t] || t] = 1; });
    p.types.map(function (t) { return t.trim(); }).filter(Boolean).forEach(function (t) { set[t + " Damage"] = 1; });
    var traits = Object.keys(set).sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; });
    return { rangeDisplay: rangeDisplay, damageDisplay: dmg, ammoDisplay: ammoDisplay, traits: traits };
  }

  function weaponModes(it) { return (it.traits || []).filter(function (t) { return FIRING_MODES.indexOf(t) !== -1; }); }
  function defaultMode(it) { var m = weaponModes(it); for (var i = 0; i < FIRING_MODES.length; i++) if (m.indexOf(FIRING_MODES[i]) !== -1) return FIRING_MODES[i]; return ""; }
  function capacityOf(it) { return typeof it.ammo === "number" ? it.ammo : 1; }
  function implicitCost(it) { return /spending\s+4\s+fuel/i.test(it.effect || "") ? 4 : 1; }
  function costFor(it, mode) { var m = weaponModes(it); if (!m.length) return implicitCost(it); return MODE_COST[mode] || 1; }
  function minFireCost(it) { var m = weaponModes(it); if (!m.length) return implicitCost(it); return Math.min.apply(null, m.map(function (x) { return MODE_COST[x]; })); }

  /* the weapon's base feed, what a plain reload consumes. "Standard" for Plentiful
     ballistic/bow/dart/shotgun ammo (free top-off); a signature munition or a Counted
     ammo item name for everything that's "track every unit". */
  function countedFeedsWeapon(a, it) {
    var f = (a.feeds || "").toLowerCase();
    if (f.indexOf(it.name.toLowerCase()) !== -1) return true;             // Cannon Rounds / Grenade Shells / Rocket / Missile
    if (a.name === "Machinegun Belt" && /machinegun|rotary/i.test(it.name)) return true;
    return false;
  }
  function baseFeedName(it) {
    if (it.signature) {
      var m = munitions().find(function (x) { return (x.feeds || "").indexOf(it.name) !== -1; });
      if (m) return m.name;                                              // Fuel Cell / Power Cell / Coil Slugs / ...
    }
    var counted = ammoCatalog().find(function (a) { return a.group === "Counted" && countedFeedsWeapon(a, it); });
    if (counted) return counted.name;
    return "Standard";                                                   // Plentiful, free top-off
  }

  /* non-mutating read of a weapon's magazine state (defaults: full, cheapest mode, base feed) */
  // `key` is the equipment ENTRY: since 2026-08-12 two pistols carry two magazines.
  // No key reads the weapon's defaults (a full magazine, cheapest mode, base feed),
  // which is the honest answer for a caller with no piece in hand.
  function readAmmo(ch, it, key) {
    var st = (ch.weaponAmmo && ch.weaponAmmo[key]) || {};
    var cap = capacityOf(it), modes = weaponModes(it), base = baseFeedName(it);
    var mode = (st.mode && modes.indexOf(st.mode) !== -1) ? st.mode : defaultMode(it);
    var cur = typeof st.cur === "number" ? Math.max(0, Math.min(st.cur, cap)) : cap;
    var ammoType = st.ammoType || base;
    // a special round that's run dry defaults back to the weapon's plentiful Standard feed
    if (ammoType !== "Standard" && ammoType !== base && base === "Standard" && ownedQty(ch, ammoType) <= 0) ammoType = "Standard";
    return { cur: cur, cap: cap, mode: mode, ammoType: ammoType, base: base, modes: modes };
  }
  var _recoil = null;   // weapon ENTRY KEY to kick on the next render, set when rounds are spent
  /* Dice mode. Digital is the default: the sheet rolls for you and HIT/DMG are
     pressable. Physical means real dice on the table, so those become plain
     numbers to read off, and anything that SPENDS something when used keeps a
     button, because the app is still the one tracking the magazine. */
  var _dice = "digital";
  try { if (localStorage.getItem("en_dice_mode_v1") === "physical") _dice = "physical"; } catch (e) {}
  function physicalDice() { return _dice === "physical"; }
  function diceMode() { return _dice; }
  function setDiceMode(m) {
    _dice = m;
    try { localStorage.setItem("en_dice_mode_v1", m); } catch (e) {}
    EN.app.render();
  }
  /* Physical mode: spend the round without opening a tray. Same deduction the
     roll tray makes, so the magazine and the recoil kick stay consistent. */
  /* FIRE takes the weapon's ENTRY KEY, not its name, and that was two separate bugs.

     It used to be handed a name and then reach for a bare `key` that is declared nowhere in
     this file, so every press threw "ReferenceError: key is not defined" before it could
     spend a round: the button was inert and silent, with no toast and no console notice a
     player would ever see. And `_recoil` is documented above as a weapon ENTRY KEY, and is
     compared against `wKey` at render time, so assigning a name to it meant the recoil kick
     could never match and never played.

     Both are the same leak from the entry-key refactor. A magazine belongs to an equipped
     PIECE, so two identical pistols hold two magazines; a name cannot address either one.
     weaponOfKey() is the resolver that already reads the catalog item off the entry, which
     is why it is used here rather than findWeapon(). */
  function fireWeapon(wKey) {
    var it = weaponOfKey(store.active(), wKey); if (!it) return;
    var st = readAmmo(store.active(), it, wKey), cost = costFor(it, st.mode);
    if (st.cur < cost) { toast(it.name + " needs " + cost + " round" + (cost > 1 ? "s" : "") + " for " + st.mode + "; reload first."); return; }
    store.update(function (c) {
      c.weaponAmmo = c.weaponAmmo || {};
      var cur = readAmmo(c, it, wKey);
      var a = c.weaponAmmo[wKey] || { cur: cur.cur, mode: cur.mode, ammoType: cur.ammoType };
      if (typeof a.cur !== "number") a.cur = cur.cur;
      a.cur = Math.max(0, a.cur - cost);
      c.weaponAmmo[wKey] = a;
    });
    _recoil = wKey;
    toast(it.name + ": " + st.mode + ", " + cost + " round" + (cost > 1 ? "s" : "") + " spent.");
    EN.app.render();
  }
  // one magazine per equipped PIECE, so both of these address an entry key and read the
  // catalog item off that entry rather than being handed a bare name
  function weaponOfKey(ch, key) {
    var e = (ch.equipment || []).find(function (x) { return (x.id || x.name) === key; });
    return e ? findWeapon(e.name) : null;
  }
  function writeAmmo(key, patch) {
    var it = weaponOfKey(store.active(), key); if (!it) return;
    // a re-render replaces the card node, so flag the weapon and let the
    // render attach the animation to the fresh node
    if (typeof patch.cur === "number") {
      var before = readAmmo(store.active(), it, key).cur;
      if (patch.cur < before) _recoil = key;
    }
    store.update(function (c) {
      c.weaponAmmo = c.weaponAmmo || {};
      var cur = readAmmo(c, it, key);
      var a = c.weaponAmmo[key] || { cur: cur.cur, mode: cur.mode, ammoType: cur.ammoType };
      if (typeof a.cur !== "number") a.cur = cur.cur;
      Object.keys(patch).forEach(function (k) { a[k] = patch[k]; });
      a.cur = Math.max(0, Math.min(a.cur, capacityOf(it)));   // keep persisted value in range
      c.weaponAmmo[key] = a;
    });
  }
  function reloadWeapon(key) {
    var ch0 = store.active();
    var it = weaponOfKey(ch0, key); if (!it) return;
    if ((it.traits || []).indexOf("Disposable") !== -1) { toast(it.name + " is Disposable; spent once fired, it cannot be reloaded."); return; }
    var ch = ch0, st = readAmmo(ch, it, key), base = st.base;
    var type = st.ammoType;
    if (type === "Standard" && base !== "Standard") type = base;        // coerce to the weapon's only (counted) feed
    var msg;
    if (type !== "Standard" && ownedQty(ch, type) <= 0) {              // the chosen special round is depleted
      if (base === "Standard") { msg = "Out of " + type + "; reloaded with Standard."; type = "Standard"; }  // fall back to plentiful
      else { toast("Out of ammo; no " + type + " in stash. Acquire it in Inventory."); return; }            // no plentiful variant: keep RELOAD
    }
    var needsStash = type !== "Standard";                               // counted munition / specialty round → spend from stash
    store.update(function (c) {
      c.weaponAmmo = c.weaponAmmo || {};
      if (needsStash) {
        var e = (c.equipment || []).find(function (x) { return x.name === type; });
        if (e) { e.qty = (e.qty || 1) - 1; if (e.qty <= 0) c.equipment = c.equipment.filter(function (x) { return x !== e; }); }
      }
      c.weaponAmmo[key] = { cur: capacityOf(it), mode: st.mode, ammoType: type };
    });
    toast(msg || (it.name + " reloaded, " + capacityOf(it) + " " + (it.ammoUnit || "rounds") + (type !== "Standard" ? " · " + type : "") + "."));
  }

  /* specialty-ammo compatibility (feeds is free text; match by weapon group + damage) */
  function ammoCompatible(a, w) {
    var feeds = (a.feeds || "").toLowerCase(), g = w.group;
    var ballistic = /ballistic/i.test(w.damage || "");
    var shotgun = /Shotgun/i.test(w.name) || (w.traits || []).indexOf("Spread") !== -1;
    var dart = /Dart/i.test(w.name);
    var bow = g === "Bowfire" && !/Slingshot/i.test(w.name);
    var cannon = /Assault Cannon|High-Precision Cannon/i.test(w.name);
    var hit =
      (g === "Sidearm" && /sidearm/.test(feeds) && ballistic) ||
      (g === "Longarm" && /longarm/.test(feeds) && ballistic) ||
      (g === "Heavy" && /heavy/.test(feeds) && ballistic) ||         // "Heavy Weapons" = heavy ballistic; excludes fuel/charge sprayers
      (cannon && feeds.indexOf(w.name.toLowerCase()) !== -1) ||      // Explosive Rounds → "Assault Cannons"
      (shotgun && /shotgun/.test(feeds)) ||
      (bow && /(bow|crossbow|arrow|bolt)/.test(feeds)) ||
      (dart && /dart/.test(feeds)) ||
      (/Machinegun|Rotary/i.test(w.name) && /machinegun/.test(feeds));
    if (!hit) return false;
    if (/no shotguns/.test(feeds) && shotgun) return false;
    if (/no full-auto/.test(feeds) && g === "Longarm" && (w.traits || []).indexOf("Full-Auto") !== -1) return false;  // qualifier scopes to Longarms
    if (/no heavy/.test(feeds) && g === "Heavy") return false;
    return true;
  }
  function ammoTypeOptions(ch, it) {
    var opts = [baseFeedName(it)];                                   // "Standard" or the weapon's own counted feed
    if (!it.signature) {                                             // signature weapons take only their bespoke munition
      ammoCatalog().forEach(function (a) {
        if (a.group === "Specialty" && ammoCompatible(a, it) && ownedQty(ch, a.name) > 0) opts.push(a.name);
        if (a.group === "Launcher Shell" && it.name === "Grenade Launcher" && ownedQty(ch, a.name) > 0) opts.push(a.name);
      });
    }
    return opts;
  }

  /* trait + damage-type tooltips for the attack-row chips */
  function weaponTraitTip(t) {
    var g = EN.gearCatalog || {}, defs = g.weaponTraits || {};
    var REVERSE = { "Nonlethal Damage": "Nonlethal" };   // renamed mechanical traits → real trait def
    if (REVERSE[t] && defs[REVERSE[t]]) return defs[REVERSE[t]];
    var base = t.replace(/\s*\(.*\)$/, "").trim();
    var tip = defs[base] || defs[base.replace(/\s+\d+$/, " X")] || (/^Area /.test(base) ? defs["Area X"] : "") || "";
    if (!tip) {
      var dm = t.match(/^(\w+) Damage$/);
      if (dm) { var dt = ((EN.combat && EN.combat.damageTypes) || []).find(function (x) { return x.name === dm[1]; }); tip = dt ? dt.text : dm[1] + " damage type."; }
    }
    return tip;
  }
  function wTraitChip(t) {
    return el("span.chip", { title: weaponTraitTip(t), style: { fontSize: "9px", color: "var(--text2)", borderColor: "var(--border2)" } }, t);
  }

  /* ---------- main render ---------- */
  function render(mount) {
    var ch = store.active();
    clear(mount);
    if (!ch || !ch.class) {
      mount.appendChild(el("div.muted-box", { style: { marginTop: "40px", padding: "40px" }, text: ch ? "Finish your #PRINT first; pick a class to power the combat dashboard." : "No Freelancer on file; register one on the #PRINT tab." }));
      return;
    }
    var d = eng.derive(ch);
    var s = state(ch, d);
    var fx = condEffects(ch);
    var blocks = [];

    /* sticky Active Condition Effects readout, pinned just under the tab rail */
    if (fx.notes.length) {
      var fxKey = fx.notes.join("|");
      if (_fxBox.closedKey !== fxKey) {
        var fxMin = _fxBox.mode === "min";
        var fxBtn = function (label, title, onclick) {
          return el("button", { title: title, onclick: onclick,
            style: { background: "transparent", border: "1px solid var(--border2)", color: "var(--text3)", borderRadius: "3px",
                     width: "18px", height: "18px", lineHeight: "1", fontSize: "10px", cursor: "pointer", padding: 0, flex: "0 0 auto" } }, label);
        };
        blocks.push(el("div", { style: { position: "sticky", top: "96px", zIndex: 60, marginBottom: "12px" } }, [
          el("div", { style: { padding: fxMin ? "4px 10px" : "8px 10px", background: "var(--bg1)", border: "1px dashed var(--warn)",
                               borderRadius: "4px", boxShadow: "0 6px 18px rgba(0,0,0,.5)" } }, [
            el("div.row.between", { style: { alignItems: "center", gap: "8px" } }, [
              el("label.fl", { style: { color: "var(--warn)", margin: 0 }, text: "Active Condition Effects" + (fxMin ? " (" + fx.notes.length + ")" : "") }),
              el("div.row", { style: { gap: "6px" } }, [
                fxBtn(fxMin ? "▾" : "-", fxMin ? "Expand" : "Minimize", function () { _fxBox.mode = fxMin ? "open" : "min"; EN.app.render(); }),
                fxBtn("✕", "Close, reappears when active effects change", function () { _fxBox.closedKey = fxKey; EN.app.render(); })
              ])
            ])
          ].concat(fxMin ? [] : fx.notes.map(function (n) { return el("p.help", { style: { margin: "2px 0" }, text: "• " + n }); })))
        ]));
      }
    }

    blocks.push(el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" }, html: (function () {
        var handle = (ch.identity && ch.identity.handle) || (ch.name || "Unnamed").split(" ")[0];
        var cls = (d.classInfo && d.classInfo.name) || "";
        var sub = (d.subclassInfo && d.subclassInfo.name) || "";
        var classStr = cls ? (" · " + cls + (sub ? " / " + sub : "")) : "";
        var calRoman = ["I","II","III","IV","V"][(d.caliber || 1) - 1] || String(d.caliber || 1);
        var levelStr = " · L" + (d.level || 1) + " · CAL " + calRoman;
        return 'FREELANCER <span class="dim3" style="font-size:13px">// live status · ' + handle + classStr + levelStr + "</span>";
      })() }),
      el("div.row.wrap", { style: { gap: "8px" } }, [
        el("div.pop-anchor", { style: { position: "relative" } }, [
          el("button.btn.sm", { onclick: function () { var was = _pops.short; closePops(); _pops.short = !was; EN.app.render(); } }, "⏾ SHORT REST"),
          _pops.short ? (function () {
            var rdIn = el("input", { type: "number", min: 1, max: Math.max(1, s.rd), value: Math.min(_amts.rd, Math.max(1, s.rd)),
              oninput: function () { _amts.rd = Math.max(1, Number(this.value) || 1); },
              style: { width: "56px", textAlign: "center" } });
            return el("div", { style: { position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 30, width: "262px",
                                        display: "flex", flexDirection: "column", gap: "10px", padding: "12px",
                                        background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "4px",
                                        boxShadow: "0 8px 24px rgba(0,0,0,.55)", textAlign: "left" } }, [
              el("p", { style: { margin: 0, fontSize: "12px", lineHeight: "1.5", color: "var(--text2)" },
                        html: "A <b>Short Rest</b> is at least 1 hour of downtime, where a character keeps their head low and does nothing more strenuous than eating, drinking, checking gear, reading feeds, patching wounds, or letting their system come down from the last hit of adrenaline. Taking one refreshes "
                              + (d.resource ? d.resource.name : "your class resource pool")
                              + (d.flow ? " and regains Flow Points (Flow modifier, min 1)" : "")
                              + ". You may also spend Resilience Dice to heal Vitality." }),
              el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
                el("span.help", { style: { margin: 0 }, text: "Resilience Dice:" }),
                el("span.mono", { style: { color: "var(--accent)" }, text: s.rd + " / " + s.rdMax + " (d" + d.resilienceDie + " " + eng.fmtMod(d.attributes.BOD.mod) + " BOD each)" })
              ]),
              el("div.row", { style: { gap: "8px", alignItems: "center" } }, [
                rdIn,
                el("button.btn.sm", { disabled: s.rd <= 0, style: { flex: 1, justifyContent: "center" },
                  onclick: function () { spendResilience(ch, d, Math.min(_amts.rd, s.rd)); } },
                  s.rd > 0 ? "⚄ ROLL & HEAL" : "NO DICE LEFT")
              ]),
              el("button.btn.sm.primary", { style: { justifyContent: "center" }, onclick: function () { shortRest(ch, d); } }, "⏾ TAKE SHORT REST")
            ]);
          })() : null
        ]),
        el("div.pop-anchor", { style: { position: "relative" } }, [
          el("button.btn.sm.primary", { onclick: function () { var was = _pops.rest; closePops(); _pops.rest = !was; EN.app.render(); } }, "☾ LONG REST"),
          _pops.rest ? el("div", { style: { position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 30, width: "240px",
                                            display: "flex", flexDirection: "column", gap: "10px", padding: "12px",
                                            background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "4px",
                                            boxShadow: "0 8px 24px rgba(0,0,0,.55)", textAlign: "left" } }, [
            el("p", { style: { margin: 0, fontSize: "12px", lineHeight: "1.5", color: "var(--text2)" },
                      text: "Take a Long Rest? Restores Vitality, Resilience Dice, Wounds (+Body mod), Flow, and reduces Strain/Fatigue by 1." }),
            el("div.row", { style: { gap: "8px", justifyContent: "flex-end" } }, [
              el("button.btn.sm", { onclick: function () { _pops.rest = false; EN.app.render(); } }, "CANCEL"),
              el("button.btn.sm.primary", { onclick: function () { _pops.rest = false; longRest(ch, d); } }, "☾ REST")
            ])
          ]) : null
        ]),
        /* Downtime: advance the story calendar without taking a Long Rest, for
           the stretches between jobs. Moves every day-based timer and nothing
           else, so it never hands out recovery the fiction did not include. */
        el("div.pop-anchor", { style: { position: "relative" } }, [
          el("button.btn.sm", { title: "Advance the story calendar without resting", onclick: function () { var was = _pops.down; closePops(); _pops.down = !was; EN.app.render(); } }, "⏳ DOWNTIME"),
          _pops.down ? (function () {
            var inp = el("input.mono", { type: "number", min: "1", max: "365", value: String(_downDays),
              style: { width: "72px", textAlign: "center", padding: "5px" },
              oninput: function () { _downDays = Math.max(1, Math.min(365, parseInt(this.value, 10) || 1)); } });
            function go(n) { _pops.down = false; advanceDowntime(ch, n); }
            return el("div", { style: { position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 30, width: "260px",
                                        display: "flex", flexDirection: "column", gap: "10px", padding: "12px",
                                        background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "4px",
                                        boxShadow: "0 8px 24px rgba(0,0,0,.55)", textAlign: "left" } }, [
              el("p", { style: { margin: 0, fontSize: "12px", lineHeight: "1.5", color: "var(--text2)" },
                        text: "Advance the calendar without resting. Marks lease installments and ages saved Personas. Restores nothing." }),
              el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
                el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em" }, text: "DAYS" }), inp,
                el("button.btn.sm.primary", { style: { marginLeft: "auto" }, onclick: function () { go(_downDays); } }, "ADVANCE")
              ]),
              el("div.row", { style: { gap: "6px", flexWrap: "wrap" } }, [1, 7, 30].map(function (n) {
                return el("button.btn.sm", { style: { flex: 1 }, onclick: function () { go(n); } }, n === 1 ? "1 DAY" : n + " DAYS");
              })),
              el("div.row", { style: { gap: "8px", justifyContent: "flex-end" } }, [
                el("button.btn.sm", { onclick: function () { _pops.down = false; EN.app.render(); } }, "CANCEL")
              ])
            ]);
          })() : null
        ])
      ])
    ]));

    /* status strip; each stat is clickable (toggles a breakdown panel) and
       hoverable (native tooltip) so you can see exactly what feeds the number:
       base, attribute mods, gear, chrome, lineage features, and conditions. */
    var dg = d.defenseGear || {};
    var agiMod = d.attributes.AGI.mod;
    // Initiative rolls d20 + Caliber + Agility OR Wits; use the better of the two
    var initAttr = d.attributes.WIT.mod > agiMod ? "WIT" : "AGI";
    var initMod = Math.max(agiMod, d.attributes.WIT.mod);
    var initVal = initMod + fx.init + ((d.lineageInit && d.lineageInit.caliber) || 0) + (d.cyberInit || 0);
    var spDisplay = adjSpeed(d.speed, fx);
    var lineFeats = (eng.activeLineageFeatures ? eng.activeLineageFeatures(ch) : []) || [];
    var defAttrName = d.defenseAttr === "BOD" ? "Body" : "Agility";
    var defAttrReason = d.defenseAttr === "BOD"
      ? (lineFeats.indexOf("Dermal Plating") !== -1 ? "Dermal Plating" : "lineage")
      : null;
    // chrome that moves Speed, attributed to the specific installed piece
    var cyberSpeedRows = [];
    var _cwItems = (EN.cyberware && EN.cyberware.items) || [];
    (ch.cyberware || []).forEach(function (cw) {
      if (!cw || typeof cw !== "object") return;
      var cdef = _cwItems.find(function (i) { return i.key === cw.key; });
      var ctier = cdef && (cdef.tiers || []).find(function (t) { return t.tier === cw.tier; });
      if (ctier && ctier.bonus && ctier.bonus.speed) cyberSpeedRows.push({ label: cw.name || cw.base || "chrome", val: ctier.bonus.speed });
    });
    var baseMove = Math.max(3, 6 + agiMod), spdFloored = (6 + agiMod) < 3, spCond = spDisplay - d.speed;
    function bdRow(label, val, note, raw) { return { label: label, val: val, note: note || null, raw: !!raw }; }
    function chromeNote(k) { var cb = d.attributes[k].cyberBonus; return cb ? "score includes +" + cb + " from chrome" : null; }
    var BD = {
      DEF: { title: "Defense", total: d.defense, sign: false,
        formula: "10 + " + defAttrName + " modifier" + (dg.shield ? " + shield" : "") + " + cover & active defenses (situational)",
        rows: [bdRow("Base", 10, null, true),
               bdRow(defAttrName + " modifier" + (defAttrReason ? " (" + defAttrReason + ")" : ""), d.attributes[d.defenseAttr].mod, chromeNote(d.defenseAttr))]
          .concat(dg.shield ? [bdRow("Shield · " + dg.shield.name, dg.shieldDef)] : []),
        foot: "Cover (+2 Half / +5 ¾) and a declared Active Defense add more against a specific attack, see Defend." },
      DR: { title: "Damage Reduction", total: d.totalDR || 0, sign: false,
        formula: "Worn armor + armor mods + natural lineage DR vs physical damage",
        rows: (dg.armor ? [bdRow("Armor · " + dg.armor.name + (dg.armorLapsed ? " (LEASE DUE)" : "") + (dg.armorDRLost ? " (" + dg.armorDR + " of " + dg.armorBaseDR + ", " + dg.armorDRLost + " lost)" : ""), dg.armorDR, null, true)] : [])
          .concat(dg.armorModDR ? [bdRow("Armor Mod (highest flat DR)", dg.armorModDR)] : [])
          .concat(d.naturalDR ? [bdRow("Natural (lineage)", d.naturalDR)] : [])
          .concat(d.cyberDR ? [bdRow("Chrome · Subdermal Armor", d.cyberDR)] : [])
          .concat((d.resistances || []).map(function (r) {
            return bdRow(r.type + " · " + r.level, r.sources.join(", "));
          })),
        empty: (dg.armor || d.naturalDR || d.cyberDR) ? null : "No armor equipped; WEAR armor in Inventory → Stash.",
        foot: (dg.armorDRLost ? "Damaged plating: " + dg.armorDRLost + " point" + (dg.armorDRLost === 1 ? "" : "s") + " of DR gone until repaired, on the Impact Table. " : "") +
              (dg.armor && (dg.armor.traits || []).indexOf("Plated") !== -1 ? "Plated: when you Block, add half this DR (rounded down) on top." : "") || null },
      SPD: { title: "Speed", total: spDisplay, sign: false,
        formula: "max(3, 6 + Agility modifier) + chrome + lineage − Bulky − load − conditions",
        rows: (spdFloored ? [bdRow("Base move (Agility floored to min 3)", baseMove, null, true)]
                          : [bdRow("Base move", 6, null, true), bdRow("Agility modifier", agiMod, chromeNote("AGI"))])
          .concat(cyberSpeedRows.map(function (r) { return bdRow("Chrome · " + r.label, r.val); }))
          .concat(d.lineageSpeed ? [bdRow("Lineage", d.lineageSpeed)] : [])
          .concat(dg.speedPenalty ? [bdRow("Bulky · " + dg.armor.name, dg.speedPenalty)] : [])
          .concat(d.encumbrance && d.encumbrance.speedDelta ? [bdRow(d.encumbrance.state === "overloaded" ? "Overloaded (Speed halved)" : "Encumbered", d.encumbrance.speedDelta)] : [])
          .concat(spCond ? [bdRow("Conditions", spCond)] : []),
        foot: d.lineageSpeedFirstRound ? "+" + d.lineageSpeedFirstRound + " Speed during the first round of any combat (Tuned Synapses)." : null },
      INIT: { title: "Initiative", total: initVal, sign: true,
        formula: "Agility or Wits modifier (best)" + (d.lineageInit && d.lineageInit.caliber ? " + lineage" : "") + (d.cyberInit ? " + chrome" : "") + (fx.init ? " + conditions" : ""),
        rows: [bdRow((initAttr === "WIT" ? "Wits" : "Agility") + " modifier (best of Agility/Wits)", initMod, chromeNote(initAttr))]
          .concat(d.lineageInit && d.lineageInit.caliber ? [bdRow("Lineage · Static Premonition", d.lineageInit.caliber)] : [])
          .concat(d.cyberInit ? [bdRow("Chrome · Reflex Booster", d.cyberInit)] : [])
          .concat(fx.init ? [bdRow("Conditions", fx.init)] : []),
        foot: "Initiative roll = d20 + Caliber (" + d.caliber + ") + this." + (d.lineageInit && d.lineageInit.edge ? " Roll with Edge (Tuned Synapses)." : "") },
      // Size is derived from height, and its only mechanical reach is the
      // Encumbrance Threshold and comparison (grappling, moving through a
      // space, the Body Gate). It never touches a d20 roll, Defense, or Speed.
      SIZE: (function () {
        var band = (R.lineageHeight || {})[ch.lineage] || null;
        var foot = (R.sizeFootprint || {})[d.size];
        var trait = (R.sizeTraits || {})[d.size];
        var rows = [];
        if (d.heightFt != null) rows.push({ label: "Height", val: d.heightFt + " ft", raw: true });
        if (band) rows.push({ label: "Lineage range", val: band.fixed ? band.min + " ft, no variance" : band.min + " to " + band.max + " ft", raw: true });
        if (foot) rows.push({ label: "Footprint", val: foot.square, raw: true });
        if (trait && trait.encumbrance) rows.push(bdRow("Encumbrance Threshold", trait.encumbrance));
        return { title: "Size", total: d.size || "not set", sign: false,
          formula: "derived from height; a boundary height takes the larger category",
          empty: d.size ? null : "Pick a height on the #PRINT tab to set your Size.",
          rows: rows,
          foot: trait ? trait.text : null };
      })()
    };
    function fmtVal(r) { return r.raw ? String(r.val) : (r.val >= 0 ? "+" : "") + r.val; }
    function titleFor(bd) {
      var lines = [bd.title + " = " + (bd.sign ? eng.fmtMod(bd.total) : bd.total)];
      if (bd.empty) lines.push(bd.empty);
      bd.rows.forEach(function (r) { lines.push("• " + r.label + ": " + fmtVal(r) + (r.note ? " (" + r.note + ")" : "")); });
      if (bd.foot) lines.push(bd.foot);
      lines.push("(click for details)");
      return lines.join("\n");
    }
    function statEl(key, label, value, sub, colorFn) {
      var bd = BD[key], n = EN.ui.stat(label, value, sub);
      n.style.cursor = "pointer";
      n.title = titleFor(bd);
      n.onclick = function () { _open.statbd = (_open.statbd === key ? null : key); EN.app.render(); };
      if (_open.statbd === key) { n.style.borderColor = "var(--accent)"; n.style.boxShadow = "inset 0 0 0 1px var(--accent)"; }
      if (colorFn) colorFn(n);
      return n;
    }
    blocks.push(el("div.stat-row", { style: { marginBottom: _open.statbd ? "8px" : "16px" } }, [
      statEl("DEF", "DEF", d.defense, defAttrName + (dg.shield ? " " + (dg.shieldDef >= 0 ? "+" : "") + dg.shieldDef + " shield" : "")),
      statEl("DR", "DR", d.totalDR || 0, dg.armor ? dg.armor.name : (d.naturalDR ? "natural · lineage" : (d.cyberDR ? "chrome · subdermal" : "no armor")), function (n) { if (!(d.totalDR > 0)) n.querySelector(".v").style.color = "var(--text3)"; }),
      statEl("SPD", "SPD", spDisplay, spDisplay < d.speed ? "of " + d.speed + ", conditions" : "spaces", function (n) { if (spDisplay < d.speed) n.querySelector(".v").style.color = "var(--danger)"; }),
      statEl("INIT", "INIT", eng.fmtMod(initVal), (initAttr === "WIT" ? "Wits" : "Agility") + (fx.init ? " " + eng.fmtMod(fx.init) + " cond." : ""), function (n) { if (fx.init < 0) n.querySelector(".v").style.color = "var(--danger)"; }),
      // Size sits beside Speed and Defense, the way the manuscript's Step 8
      // orders them. It is derived from height, so a character with no height
      // recorded shows a dash rather than defaulting to Medium.
      statEl("SIZE", "SIZE", d.size || "-", d.heightFt != null ? d.heightFt + " ft" : "set a height",
        function (n) { if (!d.size) n.querySelector(".v").style.color = "var(--text3)"; })
    ]));
    // breakdown panel (shows when a stat above is selected)
    if (_open.statbd && BD[_open.statbd]) {
      var sbd = BD[_open.statbd];
      var bdRows = sbd.rows.map(function (r) {
        return el("div", { style: { padding: "4px 0", borderBottom: "1px solid rgba(35,48,68,.4)" } }, [
          el("div.row.between", { style: { alignItems: "baseline" } }, [
            el("span", { style: { fontSize: "12px", color: "var(--text2)" }, text: r.label }),
            el("span.mono", { style: { fontSize: "13px", color: "var(--text)" }, text: fmtVal(r) })
          ]),
          r.note ? el("div", { style: { fontSize: "10px", color: "var(--text3)" }, text: r.note }) : null
        ]);
      });
      blocks.push(el("div", { style: { margin: "0 0 16px", padding: "10px 13px", border: "1px solid var(--accent)", borderRadius: "4px", background: "var(--bg2)" } }, [
        el("div.row.between", { style: { alignItems: "center", marginBottom: "2px" } }, [
          el("span", { style: { fontFamily: "var(--disp)", fontSize: "12px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent)" }, text: sbd.title }),
          el("div.row", { style: { gap: "10px", alignItems: "center" } }, [
            el("span.mono", { style: { fontSize: "16px", color: "var(--text)" }, text: sbd.sign ? eng.fmtMod(sbd.total) : String(sbd.total) }),
            el("button", { title: "Close", style: { background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: "14px", lineHeight: 1 }, onclick: function () { _open.statbd = null; EN.app.render(); } }, "✕")
          ])
        ]),
        el("p.help", { style: { margin: "0 0 6px", fontSize: "11px" }, text: sbd.formula }),
        sbd.empty ? el("p.help", { style: { margin: 0, color: "var(--text3)" }, text: sbd.empty }) : el("div", null, bdRows),
        sbd.foot ? el("p.help", { style: { margin: "6px 0 0", color: "var(--text3)" }, text: sbd.foot }) : null
      ]));
    }

    /* defensive loadout, worn armor / wielded shield / attuned focus and the
       numbers each one contributes (DR, Block, Defense, Ward). Built here but
       rendered inside the Defend section (Actions panel), above the maneuvers.
       Equip them in Inventory → Stash; one armor, one shield, one focus at a time. */
    function defenseLoadoutEls() {
      function gchip(label, name, parts, color) {
        return el("div", { title: parts, style: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 9px", border: "1px solid " + color, borderLeft: "3px solid " + color, borderRadius: "4px", background: "rgba(0,0,0,.18)", cursor: "default" } }, [
          el("span.mono", { style: { fontSize: "8.5px", letterSpacing: ".14em", color: color } }, label),
          el("span", { style: { fontSize: "12px", fontWeight: 600, color: "var(--text)" }, text: name })
        ]);
      }
      var chips = [];
      var DUE_TIP = "Lease installment due; it grants none of its benefits until you pay (Inventory > Stash).";
      if (dg.armor) {
        if (dg.armorLapsed) chips.push(gchip("ARMOR · LEASE DUE", dg.armor.name, DUE_TIP, "var(--danger)"));
        else { var ap = [dg.armorDRLost ? dg.armorDR + " of " + dg.armorBaseDR + " DR" : dg.armorDR + " DR"]; if (dg.blockBonus) ap.push("+" + dg.blockBonus + " Block"); if (dg.armor.wardDie && !dg.focus) ap.push(dg.armor.wardDie + " Ward"); if (dg.speedPenalty) ap.push(dg.speedPenalty + " SPD"); if (dg.armor.slots) ap.push(dg.armor.slots + " slots"); chips.push(gchip("ARMOR", dg.armor.name, ap.join(" · "), "var(--success)")); }
      }
      // installed Armor Mods (Impact Table) on the worn suit; a leased mod in arrears is dark
      if (dg.armor && EN.armorMods) {
        // dg.armorKey is the WORN suit's entry: since 2026-08-12 a spare of the same name
        // carries its own mods, so the Block card has to name the piece, not the type.
        (eng.armorModsOn ? eng.armorModsOn(ch, dg.armorKey) : []).forEach(function (k) {
          var m = EN.armorMods.byKey[k]; if (!m) return;
          var mLapsed = eng.leaseLapsed && eng.leaseLapsed(ch, m.name);
          chips.push(mLapsed ? gchip("MOD · LEASE DUE", m.name, DUE_TIP, "var(--danger)")
                             : gchip("MOD", m.name, m.grants + ". " + m.effect, "var(--ember)"));
        });
      }
      if (dg.shield) {
        if (dg.shieldLapsed) chips.push(gchip("SHIELD · LEASE DUE", dg.shield.name, DUE_TIP, "var(--danger)"));
        else if (!dg.shieldAlive) {
          // 0 Durability boxes: a physical shield is wreckage, an emitter has gone dark
          chips.push(gchip(dg.shieldEmitter ? "SHIELD · DARK" : "SHIELD · DESTROYED", dg.shield.name,
            dg.shieldEmitter ? "Emitter overloaded; grants nothing until it resets or is repaired"
                             : "Beyond repair; the wreck counts as salvage", "var(--danger)"));
        } else {
          var spv = [(dg.shieldDef >= 0 ? "+" : "") + dg.shieldDef + " DEF"];
          if (dg.shieldBlockDie) spv.push(dg.shieldBlockDie + " Block");
          if (dg.shieldWearThreshold) spv.push("Wear " + dg.shieldWearThreshold);
          spv.push("□".repeat(dg.shieldBoxesLeft) + "■".repeat(dg.shieldSpent));
          chips.push(gchip("SHIELD", dg.shield.name, spv.join(" · "), "var(--accent)"));
        }
      }
      if (dg.focus) {
        if (dg.focusLapsed) chips.push(gchip("FOCUS · LEASE DUE", dg.focus.name, DUE_TIP, "var(--danger)"));
        else chips.push(gchip("FOCUS", dg.focus.name, (dg.focus.wardDie || "") + " Ward", "var(--flow)"));
      }
      if (!chips.length) return [el("p.help", { style: { margin: "2px 0 8px", fontSize: "11px", color: "var(--text3)" }, text: "No armor, shield, or Warding Focus equipped; buy defensive gear in Inventory → The Undercut, then WEAR / RAISE / ATTUNE it from your Stash." })];
      return [el("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", margin: "2px 0 8px" } }, chips)];
    }

    /* attribute matrix, single biometric-profile panel with gradient bars */
    function attrTier(score) {
      if (score >= 20) return { label: "Peak", color: "var(--accent)", icon: "○ " };
      if (score >= 16) return { label: "Exceptional", color: "#7b5cff" };
      if (score >= 12) return { label: "Capable", color: "#4f9dff" };
      if (score >= 10) return { label: "Baseline", color: "var(--flow)" };
      if (score >= 8)  return { label: "Weak", color: "#ff4f8a" };
      return { label: "Impaired", color: "var(--danger)" };
    }
    /* skills rows (rendered beside the matrix) */
    var TIERC = { untrained: "var(--text4)", proficient: "var(--accent)", expertise: "var(--flow)", mastery: "var(--gold)" };
    // one reason at most, highest precedence first. Named so the chip on the row
    // and the Snag the roll tray opens with can never drift apart.
    function skillSnagWhy(s) {
      return s.untrained ? "Untrained; roll with Snag (or +2 Snag Dice in pools)" :
        fx.snagChk.ALL ? "Condition · Snag on all checks" :
        fx.snagChk[s.attr] ? "Condition · Snag on " + s.attrName + " checks" :
        (s.key === "perception" && fx.perceptionSnag) ? "Condition · Snag on Perception checks" : null;
    }
    /* Every skill row opens the roll tray, the same one-tap path the saves use.
       s.total is exactly attribute modifier + proficiency bonus (engine.derive),
       so itemising those two reproduces the number printed on the row: nothing is
       added on top. Untrained costs a Snag, never a negative modifier, and
       conditions penalise checks only through Snag (there is no check-side
       counterpart to the saves' flat saveDelta).
       A Skill Focus (+Caliber) and a Specialization (crit 19-20) both apply only
       inside a narrow aspect, so they ride as ASPECT pills the player turns on
       when the action fits, rather than being folded in on every check. */
    function rollSkill(s) {
      var mods = [{ label: s.attrName + " Modifier", value: s.attrMod }];
      if (s.profBonus) mods.push({ label: R.profTiers[s.tier].name + " (" + s.name + ")", value: s.profBonus });
      var why = skillSnagWhy(s);
      var asp = [];
      var sf = (eng.focusesFor(ch, "skill", s.key) || [])[0] || null;
      if (sf) asp.push({ key: "focus", label: "Focus +" + (d.caliber || 1) + (sf.aspect ? " · " + sf.aspect : ""),
        modLabel: "Skill Focus (Caliber)", value: d.caliber || 1, color: "var(--gold)",
        title: "Skill Focus: " + s.name + (sf.aspect ? " (" + sf.aspect + ")" : "") + ". Adds your Caliber only when the action falls inside that aspect, and rides outside the +15 static cap." });
      var sp = eng.specFor(ch, "skill", s.key);
      if (sp) asp.push({ key: "spec", label: "Spec crit 19-20" + (sp.aspect ? " · " + sp.aspect : ""), critMin: 19, color: "var(--flow)",
        title: "Specialization: " + s.name + (sp.aspect ? " (" + sp.aspect + ")" : "") + ". Widens the critical threat range by 1 only when the action falls inside that aspect." });
      openRollTray(Object.assign({
        weaponName: s.name + " Check", subtype: s.attrName + " · " + R.profTiers[s.tier].name,
        melee: false, thrownItem: false, ranged: false, usesAmmo: false,
        traits: [], baseMods: mods, critMin: 20, aspectMods: asp,
        // a natural 20 on a check is only a critical success with the right tools,
        // gear, or situational advantage; otherwise it is a normal success
        critLabel: "◆ CRITICAL THREAT", critNote: "A skill check crits only with appropriate tools, gear, or a situational advantage. Otherwise treat it as a normal success.",
        fumbleLabel: "✖ NAT 1 · FAILS DRAMATICALLY",
        autoSnag: why ? [why] : [], autoEdge: [], baseSnag: why ? 1 : 0, baseEdge: 0,
        shaken: (ch.conditions || []).indexOf("Shaken") !== -1, dmg: null
      }, moxieFlags()));
    }
    var skillRows = d.skills.map(function (s) {
      var why = skillSnagWhy(s);
      return el("div.row", {
        title: "Roll " + s.name + " (" + s.attrName + " " + eng.fmtMod(s.attrMod) + ", " + R.profTiers[s.tier].name + ")",
        style: { gap: "8px", alignItems: "center", padding: "5px 4px", borderBottom: "1px solid rgba(35,48,68,.4)", cursor: "pointer" },
        onclick: function () { rollSkill(s); }
      }, [
        el("span", { title: R.profTiers[s.tier].name, style: { width: "10px", height: "10px", borderRadius: "50%", flex: "0 0 auto", border: "1px solid " + TIERC[s.tier], background: s.tier === "untrained" ? "transparent" : TIERC[s.tier] } }),
        el("span.att", { text: s.attr }),
        el("span", { style: { flex: 1 }, text: s.name }),
        why ? snagChip(why) : null,
        el("span.mono", { style: { color: "var(--accent)" }, text: eng.fmtMod(s.total) })
      ]);
    });
    var sectionEls = {};   // modular sections, placed by the saved layout at the end of render
    /* compact cells: abbr / big mod / tier-colored score capsule */
    var attrBody = [el("div.attr-grid", null, R.attributes.map(function (a) {
      var sc = d.attributes[a.key].score, mod = d.attributes[a.key].mod;
      var t = attrTier(sc);
      return el("div.attr-cell", { title: a.blurb + " " + (t.icon || "") + t.label + ", score " + sc + " \u00b7 modifier " + eng.fmtMod(mod) + "." }, [
        el("div.abbr", { text: a.name.toUpperCase() }),
        el("div.mod", { text: eng.fmtMod(mod) }),
        el("div", { style: { display: "flex", justifyContent: "center", marginTop: "3px" } }, [
          el("span.mono", { style: { fontSize: "11.5px", padding: "1px 12px", borderRadius: "9px", border: "1px solid " + t.color, color: t.color, boxShadow: "0 0 6px " + t.color + "33" }, text: String(sc) })
        ])
      ]);
    }))];
    sectionEls.matrix = EN.ui.panel("Attribute Matrix", "BIOMETRIC PROFILE", attrBody, { corners: true });
    /* versatile skills, Insight · Performance · Intimidation (ported from the original sheet):
       pick an Attribute + a Proficient parent skill; the combo resolves to a named technique
       (or refuses; some pairings Do Not Work). Roll = attr mod + parent tier bonus. */
    function versatileBlock() {
      var V = EN.versatile;
      if (!V) return null;
      var profSkills = d.skills.filter(function (s) { return s.tier !== "untrained"; });
      var attrName = function (k) { var a = R.attributes.find(function (x) { return x.key === k; }); return a ? a.name : k; };
      var infoOpen = !!_open["versatile-info"];
      var kids = [
        el("div.section-title.clickable", {
          style: { margin: "12px 0 2px" },
          title: infoOpen ? "Hide explanation" : "Tap for an explanation of Versatile Skills",
          onclick: function () { _open["versatile-info"] = !infoOpen; EN.app.render(); }
        }, [
          document.createTextNode("Versatile Skills"),
          el("span.line"),
          el("span.collapse-caret", { style: { marginLeft: "4px" }, text: infoOpen ? "▾" : "▸" })
        ]),
        infoOpen ? el("p.help", { style: { margin: "0 0 4px" }, html: "<b>Insight · Performance · Intimidation</b>, " + V.note }) : null
      ];
      V.types.forEach(function (type) {
        var slot = (ch.versatile && ch.versatile[type]) || { attr: "", skill: "" };
        var color = V.colors[type], label = V.labels[type];
        function setSlot(field, val) {
          store.update(function (c) {
            c.versatile = c.versatile || {};
            c.versatile[type] = c.versatile[type] || { attr: "", skill: "" };
            c.versatile[type][field] = val;
          });
        }
        var attrSel = el("select", { style: { width: "100%", fontSize: "12px" }, onchange: function () { setSlot("attr", this.value); } },
          [el("option", { value: "", text: "- Choose Attr -" })].concat(R.attributes.map(function (a) {
            return el("option", { value: a.key, selected: a.key === slot.attr, text: a.name });
          })));
        var skillSel = el("select", { style: { width: "100%", fontSize: "12px" }, onchange: function () { setSlot("skill", this.value); } },
          [el("option", { value: "", text: "- Choose Skill -" })].concat(profSkills.length ? profSkills.map(function (s) {
            var works = !slot.attr || !!V.db[slot.attr + "|" + s.name + "|" + type];
            return el("option", { value: s.name, selected: s.name === slot.skill, text: s.name + (works ? "" : " ✗") });
          }) : [el("option", { disabled: true, text: "No proficient skills yet" })]));
        var resultBlock = null;
        if (slot.attr && slot.skill) {
          var entry = V.db[slot.attr + "|" + slot.skill + "|" + type];
          var sk = profSkills.find(function (s) { return s.name === slot.skill; });
          if (!entry) {
            resultBlock = el("div", { style: { padding: "6px 10px", background: "rgba(239,68,68,.08)", border: "1px solid var(--danger)", borderRadius: "4px", fontSize: "11px", color: "var(--danger)", marginTop: "6px" } },
              "This combination does not work; " + attrName(slot.attr) + " cannot apply to " + slot.skill + " for " + label + ".");
          } else if (!sk) {
            resultBlock = el("p.help", { style: { margin: "6px 0 0", color: "var(--warn)" }, text: "Requires Proficiency in " + slot.skill + "; train it on the #PRINT tab." });
          } else {
            var tierBonus = R.profTiers[sk.tier].d20;
            var mod = d.attributes[slot.attr].mod;
            var focus = eng.focusesFor(ch, "skill", sk.key)[0] || null;
            var spec = eng.specFor(ch, "skill", sk.key);
            resultBlock = el("div", { style: { padding: "8px 10px", background: "rgba(0,0,0,.2)", border: "1px solid " + color, borderLeft: "3px solid " + color, borderRadius: "4px", marginTop: "6px" } }, [
              el("div.row.wrap", { style: { alignItems: "center", gap: "8px", marginBottom: "3px" } }, [
                el("span", { style: { fontSize: "13px", fontWeight: 700, color: color }, text: entry.name }),
                el("span.chip", { style: { fontSize: "9px", color: color, borderColor: color }, text: label }),
                el("span", { style: { marginLeft: "auto", fontSize: "12px", color: "var(--text2)" } }, [
                  document.createTextNode("Bonus: "),
                  el("b.mono", { style: { color: "var(--accent)", fontSize: "14px" }, text: eng.fmtMod(mod + tierBonus) }),
                  el("span", { style: { color: "var(--text3)", fontSize: "10px" }, text: " (" + R.profTiers[sk.tier].name + ")" })
                ])
              ]),
              el("p.help", { style: { margin: 0, color: "var(--text2)" }, text: entry.desc }),
              el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "4px" } }, [
                el("span.help", { style: { margin: 0, fontSize: "10px" }, html: "Roll: <b>" + attrName(slot.attr) + " " + eng.fmtMod(mod) + " + " + sk.name + " " + eng.fmtMod(tierBonus) + "</b>" }),
                focus ? el("span.chip", { title: "Skill Focus on " + sk.name + " carries over: +Caliber inside the aspect", style: { fontSize: "9px", color: "var(--gold)", borderColor: "var(--gold)" }, text: "FOCUS +" + (d.caliber || 1) + (focus.aspect ? " (" + focus.aspect + ")" : "") }) : null,
                spec ? el("span.chip", { title: "Specialization on " + sk.name + " carries over: crit 19-20 inside the aspect", style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" }, text: "CRIT 19-20" + (spec.aspect ? " (" + spec.aspect + ")" : "") }) : null
              ])
            ]);
          }
        } else if (slot.attr || slot.skill) {
          resultBlock = el("p.help", { style: { margin: "6px 0 0" }, text: "Select both an attribute and a proficient skill to see the result." });
        }
        kids.push(el("div", { style: { padding: "8px 0", borderBottom: "1px solid rgba(42,52,68,.6)" } }, [
          el("div", { style: { fontSize: "11px", fontWeight: 700, color: color, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--disp)" }, text: label }),
          el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" } }, [
            el("div", null, [el("div", { style: { fontSize: "9px", color: "var(--text3)", marginBottom: "3px" }, text: "ATTRIBUTE" }), attrSel]),
            el("div", null, [el("div", { style: { fontSize: "9px", color: "var(--text3)", marginBottom: "3px" }, html: "PARENT SKILL <span style='color:var(--accent)'>(Prof+)</span>" }), skillSel])
          ]),
          resultBlock
        ]));
      });
      return el("div", null, kids);
    }
    sectionEls.skills = EN.ui.panel("Skills", "TAP TO ROLL · DOT = TIER", [el("div", { style: { columnCount: 1 } }, skillRows), versatileBlock()], { corners: true });

    /* state banners */
    if (s.dying) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--danger)", color: "var(--danger)", marginBottom: "12px", textAlign: "left" },
        html: "☠ <b>DYING</b> · Unconscious at 0 Wounds. Each turn: Death Save (Body, DC 10). Three successes = Stable, three failures = dead. Any damage = one failure." }));
    } else if (s.stable) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--warn)", color: "var(--warn)", marginBottom: "12px", textAlign: "left" },
        html: "◌ <b>STABLE</b> · Unconscious at 0 Wounds, no longer Dying. Restoring even 1 Wound wakes you with that many Wounds." }));
    } else if (s.critical) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--warn)", color: "var(--warn)", marginBottom: "12px", textAlign: "left" },
        html: "⚠ <b>CRITICAL CONDITION</b> · at 50% or less of total Wounds." }));
    }
    if (s.bloodied) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--ember)", color: "var(--ember)", marginBottom: "12px", textAlign: "left" },
        html: "🩸 <b>BLOODIED</b> · Vitality is 0. You stay conscious; further damage becomes Wound damage." }));
    }
    if (fx.cannotAct) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--danger)", color: "var(--danger)", marginBottom: "12px", textAlign: "left" },
        html: "⛔ <b>CANNOT ACT</b> · an active condition prevents you from taking actions." }));
    }
    if (fx.edgeToAttackers) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--danger)", color: "var(--danger)", marginBottom: "12px", textAlign: "left" },
        html: "🎯 <b>EDGE TO ATTACKERS</b> · attacks against you gain Edge from an active condition." }));
    }

    /* vitality + vigor + wounds, compact console; controls live in popovers on the bar labels */
    function railBtn(label, color, title, onclick) {
      return el("button.btn.sm", { title: title, onclick: onclick, style: { color: color, borderColor: color, width: "100%", textAlign: "center", justifyContent: "center" } }, label);
    }
    function popAnchor(key, color, title, labelChildren, controls) {
      return el("div.pop-anchor", { style: { position: "relative" } }, [
        el("button.pop-btn", {
          title: title,
          onclick: function () { var was = _pops[key]; closePops(); _pops[key] = !was; EN.app.render(); },
          style: { fontFamily: "var(--disp)", fontSize: "12px", letterSpacing: ".18em", fontWeight: 600,
                   color: color, background: _pops[key] ? "rgba(255,255,255,.06)" : "var(--bg1)", cursor: "pointer",
                   border: "1px solid " + color, borderRadius: "3px", padding: "3px 10px",
                   boxShadow: _pops[key] ? "0 0 10px " + color : "none" }
        }, [el("span", { style: { marginRight: "6px", fontSize: "11px" }, text: "±" })].concat(labelChildren).concat([document.createTextNode(" ▾")])),
        _pops[key] ? el("div", { style: { position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 30, width: "112px",
                                          display: "flex", flexDirection: "column", gap: "6px", padding: "8px",
                                          background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "4px",
                                          boxShadow: "0 8px 24px rgba(0,0,0,.55)" } }, controls) : null
      ]);
    }
    function amtInput(key) {
      return el("input", { type: "number", min: 1, value: _amts[key],
        oninput: function () { _amts[key] = Math.max(1, Number(this.value) || 1); },
        style: { width: "100%", textAlign: "center" } });
    }
    sectionEls.vitality = EN.ui.panel("Vitality", "DAMAGE ORDER: VIGOR → VITALITY → WOUNDS", [
      el("div", { style: { display: "flex", flexDirection: "column", justifyContent: "center" } }, [
        el("div.row.between.wrap", { style: { alignItems: "baseline" } }, [
          el("div.mono", { style: { fontSize: "19px", fontWeight: 700 } }, [
            s.vigor ? el("span", { title: "Vigor " + s.vigor + ", absorbed before Vitality. Click to clear.", style: { color: "var(--shield)", cursor: "pointer" }, onclick: function () { store.update(function (c) { c.vitality.temp = 0; }); }, text: "(" + s.vigor + ") " }) : null,
            el("span", { style: { color: "var(--text1)" }, text: s.vit + "/" + s.vitMax })
          ]),
          popAnchor("vit", "var(--success)", "Vigor, healing & damage",
            [
              s.vigor ? el("span", { style: { color: "var(--shield)" }, text: "(VIGOR)" }) : null,
              document.createTextNode("VITALITY")
            ].filter(Boolean),
            [
              railBtn("VIGOR", "var(--accent)", "Gain Vigor equal to the amount below (non-stacking, keeps the higher value; expires end of encounter)", function () {
                store.update(function (c) { c.vitality.temp = Math.max(c.vitality.temp || 0, _amts.vit); });
              }),
              railBtn("HEAL", "var(--success)", "Restore Vitality", function () { applyHeal(ch, d, _amts.vit); }),
              amtInput("vit"),
              railBtn("DAMAGE", "var(--danger)", "Apply damage: Vigor absorbs first, then Vitality; overflow becomes Wound damage", function () { applyDamage(ch, d, _amts.vit); })
            ])
        ]),
        vitalityBar(s.vit, s.vitMax, s.vigor),
        el("div.row.between.wrap", { style: { alignItems: "baseline" } }, [
          el("div.mono", { style: { fontSize: "19px", fontWeight: 700, color: s.critical ? "var(--danger)" : "var(--text1)" }, text: s.wounds + " / " + s.woundsMax }),
          popAnchor("wound", "var(--wound)", "Add or remove Wounds",
            [document.createTextNode("WOUNDS")],
            [
              railBtn("HEAL", "var(--success)", "Heal Wounds (restores max Vitality)", function () { healWounds(ch, d, _amts.wound); }),
              amtInput("wound"),
              railBtn("WOUND", "var(--danger)", "Take Wounds (also lowers current & max Vitality)", function () { healWounds(ch, d, -_amts.wound); })
            ])
        ]),
        el("div", { title: "Countdown from Body (" + s.woundsMax + "). Wound damage also lowers current & max Vitality. Critical Condition at " + d.critThreshold + " or less. 0 = Unconscious & Dying.", style: { margin: "5px 0 0" } }, [
          bar(s.wounds, s.woundsMax, s.critical ? "var(--danger)" : "var(--wound)")
        ])
      ]),
      (s.dying || s.stable) ? el("div", { style: { marginTop: "8px" } }, [
        el("div.row.wrap", { style: { gap: "12px", alignItems: "center" } }, [
          el("span.help", { style: { margin: 0 }, text: "Death Saves · ✓" }),
          pips(ch.deathSaves.s || 0, 3, "var(--success)", function (n) { store.update(function (c) { c.deathSaves.s = n; if (n >= 3) { c.stable = true; c.deathSaves = { s: 0, f: 0 }; } }); }),
          el("span.help", { style: { margin: 0 }, text: "✗" }),
          pips(ch.deathSaves.f || 0, 3, "var(--danger)", function (n) { store.update(function (c) { c.deathSaves.f = n; }); }),
          s.dying ? el("button.btn.sm", { title: "Stabilize: Medtech/Tech/Flow check DC 10", onclick: function () { store.update(function (c) { c.stable = true; c.deathSaves = { s: 0, f: 0 }; }); toast("Stabilized, unconscious at 0 Wounds."); } }, "STABILIZE") : null
        ]),
        (ch.deathSaves.f || 0) >= 3 ? el("p", { style: { color: "var(--danger)", fontFamily: "var(--mono)", marginTop: "6px" }, text: "✝ THREE FAILURES; the body stops keeping score." }) : null
      ]) : null
    ], { corners: true });

    /* Flow Reservoir + saved Patterns live inside the Actions panel (Abilities
       tab) for Shapers, mirroring how every other class shows its resource there.
       The standalone layout panel is therefore retired. */
    sectionEls.flow = null;

    /* conditions */
    var condSel = el("select", { style: { width: "auto", minWidth: "200px" } },
      [el("option", { value: "", text: "- add a condition -" })].concat((EN.conditions || [])
        // Vacuum is applied from the Hazard dropdown now (Environmental >
        // Vacuum), which brings its clock with it and adds this same condition.
        // Leaving it here too would be two doors into one state, and only one of
        // them would start the breath clock. Drowning goes the other way: it is
        // a condition, it is offered here, and applying it starts ITS clock.
        .filter(function (c) { return c.name !== "Vacuum"; })
        .map(function (c) {
          return el("option", { value: c.name, disabled: (ch.conditions || []).indexOf(c.name) !== -1, text: c.name });
        })));
    var active = (ch.conditions || []).map(function (name) {
      var info = (EN.conditions || []).find(function (x) { return x.name === name; });
      var lv = LEVELED[name];
      var lvl = lv ? condLevel(ch, name) : 0;
      var stage = lv && lv.names ? lv.names[lvl - 1] : null;
      var severe = lv && lv.severeAt && lvl >= lv.severeAt;
      var open = !!_open["cond-" + name];
      var title = name + (lv ? " " + lvl + (stage ? " · " + stage : "") : "");
      var rightKids = [];
      if (lv) {
        rightKids.push(el("span.help", { style: { margin: 0 }, text: lv.label + ":" }));
        rightKids.push(el("div.stepper", { style: { marginTop: 0 }, onclick: function (e) { e.stopPropagation(); } }, [
          el("button", { onclick: function () { setCondLevel(name, lvl - 1); } }, "−"),
          el("span.mono", { style: { fontSize: "14px", minWidth: "20px", textAlign: "center", color: severe ? "var(--danger)" : "var(--warn)" }, text: String(lvl) }),
          el("button", { disabled: lvl >= lv.max, onclick: function () { setCondLevel(name, lvl + 1); } }, "+")
        ]));
      }
      rightKids.push(el("button.btn.sm.danger", { style: { padding: "1px 8px" }, onclick: function (e) { e.stopPropagation(); setCondLevel(name, 0); } }, "✕ Remove"));
      return el("div.feature", { style: { borderLeftColor: severe ? "var(--danger)" : "var(--warn)" } }, [
        el("h4", { style: { cursor: "pointer" }, onclick: function () { _open["cond-" + name] = !open; EN.app.render(); } }, [
          el("span", null, [el("span.collapse-caret", { text: open ? "▾" : "▸" }), document.createTextNode(" " + title)]),
          el("span", { style: { display: "flex", alignItems: "center", gap: "8px" } }, rightKids)
        ]),
        !open ? el("p.help", { style: { margin: 0, color: "var(--text2)" }, text: (lv && lv.effects ? lv.effects[lvl - 1] : (info && info.summary) || "") }) : null,
        !open && COND_META[name] ? el("p.help", { style: { margin: "4px 0 0" }, html: "⏱ " + COND_META[name][0] + " &nbsp;·&nbsp; <span style='color:var(--success)'>✓ End:</span> " + COND_META[name][1] }) : null,
        // Drowning moved here from the hazards panel, so it brings its breath
        // clock with it: the held-breath rounds, the escalating Body Save, and
        // the Wound on a failure. Built by the SAME breathRow() that renders
        // Vacuum, off the same shared spec, so the two cannot drift apart.
        drowningClock(name, d, fx),
        severe ? el("p.help", { style: { margin: "4px 0 0", color: "var(--danger)" }, text: "Severe; level 4+ needs professional care or ritual support to recover." }) : null,
        info && open ? el("p", { text: info.text || info.summary || "" }) : null
      ]);
    });
    /* The two Status Change dropdowns that sit beside the conditions one. Both
       are built from EN.statusChanges, which is a registry rather than a
       hardcoded list, so a new hazard type or a new bonus appears here with no
       edit to this file. Both behave exactly like the conditions dropdown:
       pick, hit the ONE shared + APPLY, and the entry joins the panel while the
       dropdown snaps back to its placeholder ready for the next one. */
    function statusSelect(menu) {
      if (!menu) return null;
      var opts = [el("option", { value: "", text: menu.placeholder })];
      menu.groups.forEach(function (g) {
        if (!g.options || !g.options.length) return;
        opts.push(el("optgroup", { label: g.name }, g.options.map(function (o) {
          return el("option", { value: o.key, disabled: statusApplied(ch, o), text: o.name });
        })));
      });
      return el("select", { style: { width: "auto", minWidth: "170px" } }, opts);
    }
    var SC = EN.statusChanges || null;
    var hazSel = SC ? statusSelect(SC.hazard) : null;
    var bonusSel = SC ? statusSelect(SC.bonus) : null;

    /* ONE apply button for all three dropdowns. It reads whichever ones carry a
       selection, applies each, and resets each. Applying two at once is not a
       special case worth forbidding: the player picked both, so both land. */
    var applyBtn = el("button.btn.sm.primary", { onclick: function () {
      var v = condSel.value;
      var applied = 0;
      if (v) {
        store.update(function (c) {
          c.conditions = c.conditions || [];
          if (c.conditions.indexOf(v) === -1) c.conditions.push(v);
          if (LEVELED[v]) { c.conditionLevels = c.conditionLevels || {}; c.conditionLevels[v] = c.conditionLevels[v] || 1; }
        });
        condSel.value = "";
        applied++;
      }
      [hazSel, bonusSel].forEach(function (sel) {
        if (!sel || !sel.value) return;
        var opt = SC && SC.get(sel.value);
        sel.value = "";
        if (!opt) return;
        applyStatusChange(opt);
        applied++;
      });
      // Every dropdown resets to its default option whether or not anything was
      // applied, so the header never sits on a stale selection.
      if (hazSel) hazSel.value = "";
      if (bonusSel) bonusSel.value = "";
      if (applied) EN.app.render();
    } }, "+ APPLY");
    var hazBlocks = hazardBlocks(ch, d, fx);
    var bonusKids = bonusBlocks(ch, d);
    var condKids = active.length ? active : [];
    // The empty state has to speak for the whole panel now, not just for
    // conditions, or an empty sheet reads "No active conditions" while three
    // dropdowns sit above it offering two other kinds of thing.
    var nothingAtAll = !condKids.length && !fx.derived.length && !hazBlocks.count && !bonusKids.length;

    sectionEls.conditions = EN.ui.panel("Status Changes", statusBadge(ch, hazBlocks.count, fx.derived.length),
      (nothingAtAll ? [el("p.help", { style: { margin: 0 }, text: "Nothing applied. Add a condition, a hazard or a bonus above." })] : condKids)
     .concat(fx.derived.map(function (dc) {
        var info = (EN.conditions || []).find(function (x) { return x.name === dc.name; });
        return el("div.feature", { style: { borderLeftColor: "var(--danger)" } }, [
          el("h4", null, [
            el("span", null, [document.createTextNode(dc.name + " "),
              el("span.chip", { style: { fontSize: "9px", color: "var(--danger)", borderColor: "var(--danger)" }, text: "AUTO · " + dc.from })]),
            el("span.src", { text: "clears when the source drops" })
          ]),
          info ? el("p.help", { style: { margin: 0 }, text: info.summary || "" }) : null
        ]);
      })).concat(hazBlocks.kids).concat(bonusKids),
      { corners: true, headerRight: [condSel, hazSel, bonusSel, applyBtn].filter(Boolean) });

    /* ---------- Environmental Hazards ----------------------------------------
       Every number rendered here comes off d.hazard (EN.engine.hazardStats),
       the one resolver. Nothing in this block re-reads raw hazard storage to
       decide which exposure is live, whether a suit holds vacuum, or which
       mitigation is on: that would be the second resolver the Trauma Rig work
       already paid to delete once. Writes go back through store.update and are
       then re-derived, so what you see is always what the engine believes. */
    /* The standalone Environmental Hazards panel is retired. Hazards are Status
       Changes, and they now render inside that one panel beside the conditions
       and the bonuses, which is the whole point of the rework: one place to
       look for every temporary state. The layout slot stays so any saved
       arrangement referencing it keeps working; it just renders nothing. */
    sectionEls.hazards = null;

    /* saving throws + senses */
    var passives = ["perception", "investigation", "intuition", "systems"].map(function (k) {
      var s = d.skills.find(function (x) { return x.key === k; });
      return s ? el("div.row.between", { style: { padding: "6px 4px", borderBottom: "1px solid rgba(35,48,68,.5)" } }, [
        el("span", { text: "Passive " + s.name }),
        el("span.mono", { style: { color: "var(--accent)", fontSize: "17px" }, text: s.passive })
      ]) : null;
    });
    /* special senses granted by active features (lineage / class / subclass) */
    var SENSE_GRANTS = {
      "Lowlight Optics":     { sense: "Darkvision", range: "12 sp.", note: "Blinding flashes and strobes impose no Snag." },
      "Predator's Glare":    { sense: "Darkvision", range: "6 sp." },
      "Fungal Network":      { sense: "Tremor Sense", range: "6 sp.", note: "While touching a connected surface; telepathic comms with allies within 12 sp." },
      "Seismic Sense":       { sense: "Tremor Sense", range: "8 sp.", note: "Via ground contact; can't detect anyone flying, climbing, or levitating." },
      "Warmblood Sense":     { sense: "Heat Sense", range: "6 sp.", note: "Ignore Invisible and Hidden for living, heat-producing targets." },
      "Blood-Scent Tracker": { sense: "Blood Scent", range: "6 sp.", note: "Know the direction of anyone Bleeding or below half Vitality, even hidden or behind cover." },
      "Disturbance Compass": { sense: "Flow Sense", range: "12 sp.", note: "Presence and direction of Flow disturbances and active Invocations, through walls. Always on." },
      "Scent Marker":        { sense: "Scent Tracking", range: "1 mile", note: "Tagged targets only, for 48 hours." },
      "The Machine Medium":  { sense: "Sprite Sight", range: "-", note: "Passively see and communicate with Nixies and Gremlins, the Flow sprites in complex machinery." }
    };
    var senseRows = [];
    (d.features || []).forEach(function (f) {
      var g = SENSE_GRANTS[f.name];
      if (!g) return;
      senseRows.push(el("div", { style: { padding: "6px 4px", borderBottom: "1px solid rgba(35,48,68,.5)" } }, [
        el("div.row.between", null, [
          el("span", null, [document.createTextNode(g.sense),
            el("span.chip", { title: f.text || "", style: { fontSize: "9px", color: "var(--gold)", borderColor: "var(--gold)", marginLeft: "6px" }, text: f.name.toUpperCase() })]),
          el("span.mono", { style: { color: "var(--gold)", fontSize: "15px" }, text: g.range })
        ]),
        g.note ? el("p.help", { style: { margin: "2px 0 0" }, text: g.note }) : null
      ]));
    });
    if (senseRows.length) {
      passives.push(el("div.section-title", { style: { margin: "10px 0 2px" } }, [document.createTextNode("Special Senses"), el("span.line")]));
      passives = passives.concat(senseRows);
    }
    sectionEls.senses = EN.ui.panel("Senses", "10 + MOD + PROF + CALIBER IN A FOCUS (±5 EDGE/SNAG)", passives, { corners: true });

    /* ACTIONS, tabbed, like a play-sheet */
    var C = EN.combat || {};
    // only features with usable mechanics belong on the play-sheet; drop progression
    // scaffolding ("choose a subclass / Universal Upgrade" prompts) and scaling
    // reminders like "Cheap Shot (3d6)" whose base feature is already listed
    var SCAFFOLD_FEATURE = /^(Universal Upgrade|Subclass Feature|Subclass Capstone|Awakening Milestone)$|\bSubclass$/;
    var kept = d.features.filter(function (f) {
      if (SCAFFOLD_FEATURE.test(f.name)) return false;
      var base = f.name.replace(/\s*\(.*\)$/, "");
      if (base !== f.name && d.features.some(function (o) { return o !== f && o.name === base; })) return false;
      return true;
    });
    // break the bundled resource feature (Moxie/Overdrive/Triage/... ability list) into its own
    // rows, each tagged with the ability's action type and per-ability resource cost chip
    var FEATURE_EXPANSIONS = resourceExpansion(ch, d);
    var resUp = (d.resource && d.resource.name) ? d.resource.name.toUpperCase() : "";
    var expanded = [];
    kept.forEach(function (f) {
      var exp = FEATURE_EXPANSIONS[f.name];
      if (exp) {
        exp.subs.forEach(function (s) {
          expanded.push({ name: s.name, source: f.source, level: f.level, text: s.text,
                          _cost: s.action || actionCost(s.text), chip: s.cost ? s.cost + " " + resUp : null });
        });
      } else expanded.push(f);
    });
    var feats = expanded.map(function (f, i) {
      // an explicit "(Active)"/"(Passive)" marker overrides the text-based cost parse,
      // then comes off the displayed title
      var forced = /\(Active\)\s*$/i.test(f.name) ? "active" : (/\(Passive\)\s*$/i.test(f.name) ? "passive" : null);
      var cost = f._cost || actionCost(f.text);
      if (forced === "active" && cost === "Passive") cost = "Active";
      if (forced === "passive") cost = "Passive";
      return { id: "act-" + i, name: f.name.replace(/\s*\((Active|Passive)\)\s*$/i, ""), src: f.source + " · L" + f.level,
               text: f.text, cost: cost, limited: isLimited(f.text), chip: f.chip, uses: parseUses(f.text, d) };
    });
    // active vs passive split of the computed features (markers already folded into cost)
    var activeFeats = feats.filter(function (f) { return f.cost !== "Passive"; });
    var passiveFeats = feats.filter(function (f) { return f.cost === "Passive"; });

    /* shared across the Weapons tab, Defend section, and Loadout count */
    var GROUP_CAT = { Simple: "Simple Weapons", Martial: "Martial Weapons", Sidearm: "Sidearms", Longarm: "Longarms",
                      Heavy: "Heavy Weapons", Launcher: "Explosive Launchers", Thrown: "Thrown Weapons", Bowfire: "Bowfire Weapons" };
    // ch.equippedWeapons holds entry ids (each a specific owned instance); the
    // Attacks list, ammo, and hit math are all per weapon TYPE, so resolve to
    // deduped catalog names here once and let everything downstream work with
    // plain names as before.
    var equippedNames = [];
    (ch.equippedWeapons || []).forEach(function (key) {
      var e = (ch.equipment || []).find(function (x) { return (x.id || x.name) === key && x.qty > 0; });
      if (e && equippedNames.indexOf(e.name) === -1) equippedNames.push(e.name);
    });
    /* ONE ROW PER EQUIPPED PIECE, which is a different list from the deduped names above.
       Brandon's ruling of 2026-08-12 made mods, grip and magazine per ENTRY, so two
       equipped Quarterstaffs are two weapons with two builds and the panel has to be able
       to show both. `label` only grows a number when a name actually repeats, so the
       ordinary one-of-each loadout reads exactly as it always did.
       equippedNames survives for the two consumers that genuinely want names: the reorder
       arrows (whose index feeds moveWeaponName and must match the stored array) and the
       Parry source list (where two copies of one weapon offer the same die anyway). */
    var equippedRows = [];
    (ch.equippedWeapons || []).forEach(function (key) {
      var e = (ch.equipment || []).find(function (x) { return (x.id || x.name) === key && x.qty > 0; });
      if (!e) return;
      var it = findWeapon(e.name);
      if (!it) return;
      equippedRows.push({ key: eng.entryKey(e), name: e.name, it: it });
    });
    (function () {
      var total = {};
      equippedRows.forEach(function (r) { total[r.name] = (total[r.name] || 0) + 1; });
      var seen = {};
      equippedRows.forEach(function (r) {
        if (total[r.name] > 1) { seen[r.name] = (seen[r.name] || 0) + 1; r.label = r.name + " " + seen[r.name]; }
        else r.label = r.name;
      });
    })();
    var realWeaponRows = equippedRows.filter(function (r) { return !eng.isUnarmedAugmentName(r.it.name); });
    /* THE NAMES THAT ACTUALLY PRODUCE A WEAPON ROW, which is not the same question as
       "what is equipped". Anything asking "am I armed" has to ask this one.

       The row loop drops a name for two reasons, and a count that asks neither is
       wrong in two ways: an unarmed AUGMENT (Knuckles, Shock Gloves) improves the
       punch rather than being a weapon of its own, and a name the catalog cannot
       resolve renders nothing at all. Counting either produced the L6 symptom, a tab
       reading WEAPONS (2) above zero rows with the "no weapons equipped" hint
       suppressed. Defining the list as "names that produce a row" makes the count
       truthful by construction rather than by coincidence.

       DISPLAY ONLY, and this is the one way to get the fix badly wrong: the augments
       must stay in `ch.equippedWeapons`, because `engine.unarmedGearOnHands` reads
       that array to decide whether Knuckles steps the die at all. Filtering them out
       at a write site would silently stop the augment augmenting, which is the entire
       reason it is equipped.

       The reorder arrows deliberately keep using `equippedNames`: their index is fed
       to `moveWeaponName`, which swaps one slot of the raw stored array, so an index
       from a filtered list would move the wrong slot. That coupling is a separate
       pre-existing wrinkle and is left alone rather than half-changed. */
    var realWeaponNames = equippedNames.filter(function (n) {
      var w = findWeapon(n);
      return !!w && !eng.isUnarmedAugmentName(w.name);
    });
    var augmentNames = equippedNames.filter(function (n) {
      var w = findWeapon(n);
      return !!w && eng.isUnarmedAugmentName(w.name);
    });

    /* ---- ABILITIES tab: the class resource fuel + active, triggerable abilities ---- */
    function abilitiesKids() {
      var kids = [];
      // Shaper: the Flow Reservoir + saved Resonant Patterns sit at the very top,
      // so a Shaper can track FP/Strain and invoke patterns without leaving Play.
      if (d.flow) {
        var fCur = (ch.flow.current != null) ? eng.clamp(ch.flow.current, 0, d.flow.max) : d.flow.max;
        var fStrain = ch.flow.strain || 0;
        kids.push(el("div.section-title", { style: { margin: "2px 0 2px" } }, [document.createTextNode("Flow Reservoir"), el("span.line"),
          el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", marginLeft: "6px" }, text: "DC " + d.flow.dc + " · " + d.flow.attributeName }) ]));
        kids.push(el("div.row.between.wrap", { style: { alignItems: "center" } }, [
          el("div.mono", { style: { fontSize: "22px", color: resourceColor("Flow") }, html: fCur + " <span style='font-size:13px;color:var(--text3)'>/ " + d.flow.max + " FP · Attack " + eng.fmtMod(d.flow.attackBonus) + "</span>" }),
          plusMinus(function () { store.update(function (c) { c.flow.current = Math.max(0, fCur - 1); }); },
                    function () { store.update(function (c) { c.flow.current = Math.min(d.flow.max, fCur + 1); }); })
        ]));
        kids.push(bar(fCur, d.flow.max, resourceColor("Flow")));
        kids.push(el("div.row.wrap", { style: { gap: "10px", marginTop: "8px", alignItems: "center" } }, [
          el("span.help", { style: { margin: 0 }, text: "Strain:" }),
          pips(fStrain, 5, resourceColor("Flow"), function (n) { store.update(function (c) { c.flow.strain = n; }); }),
          fStrain >= 5 ? el("span", { style: { color: "var(--danger)", fontFamily: "var(--mono)", fontSize: "12px" }, text: "⚡ BREAKFLOW" })
                       : el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: "5 → Breakflow · Overdraw & Free-Shaping in the Flow tab" })
        ]));
        kids.push(el("div.section-title", { style: { margin: "12px 0 2px" } }, [document.createTextNode("My Patterns"), el("span.line")]));
        kids.push((EN.flowView && EN.flowView.myPatternsInline) ? EN.flowView.myPatternsInline(ch, d) : el("p.help", { style: { margin: 0 }, text: "Saved patterns appear here." }));
      }
      // combat actions reference sits at the top, above the resource tracker
      if ((C.commonActions || []).length) {
        var acOpen = !!_open["actions-in-combat"];
        kids.push(el("div.section-title.clickable", {
          style: { margin: "2px 0 2px" },
          title: acOpen ? "Hide the action list" : "Tap for the list of combat actions",
          onclick: function () { _open["actions-in-combat"] = !acOpen; EN.app.render(); }
        }, [document.createTextNode("Actions in Combat"), el("span.line"), el("span.collapse-caret", { style: { marginLeft: "4px" }, text: acOpen ? "▾" : "▸" })]));
        if (acOpen) kids.push(el("p.help", { style: { marginBottom: "6px" }, text: (C.commonActions || []).map(function (a) { return a.name; }).join(", ") + ", full rules in the Codex tab." }));
      }
      var rName = d.resource ? d.resource.name.toUpperCase() : null;
      var resourceFeats = rName ? activeFeats.filter(function (f) { return f.chip && f.chip.toUpperCase().indexOf(rName) !== -1; }) : [];
      var otherFeats = rName ? activeFeats.filter(function (f) { return !f.chip || f.chip.toUpperCase().indexOf(rName) === -1; }) : activeFeats;

      /* HARDWARE-DEPENDENT ABILITIES.

         A Codebreaker's Bandwidth abilities run through a Smartdeck and a Stitcher's Triage
         Protocols run through a Trauma Rig. resourceFeats is already exactly that set: the
         abilities whose cost chip names the class resource. Without the hardware they cannot
         fire, so listing them ready-to-use is a lie the sheet tells every turn.

         Two different failures, two different treatments:

           MISSING   the abilities come OUT of the list and a loud block stands in their place.
                     Deliberately not a clean collapse. The hole should be visible, sized like
                     what is gone, and it says how many went with it.
           BRICKED   the hardware is present and dead. Everything stays listed and the card,
                     the pool and the abilities all grey out together, matching the dead look
                     the #GRID tab already wears at full damage. */
      var _dep = (function () {
        if (!d.resource) return null;
        if (d.triage) {
          var t = d.rig || {};
          // a Stitcher improvising on a Scrap Rig is equipped, just badly
          if (t.scrapRig) return { state: "ok" };
          if (!t.rigTier) return { state: "missing", what: "Trauma Rig", cat: "Trauma Rigs",
            title: "No Rig on you",
            say: "You know exactly what to do and have nothing to do it with. Triage Protocols run through a Trauma Rig; steady hands and good intentions do not close a chest wound." };
          if (t.bricked) return { state: "bricked", what: "Trauma Rig" };
          return { state: "ok" };
        }
        if ((d.grid || {}).isCodebreaker) {
          var dk = (d.grid || {}).deck;
          if (!dk) return { state: "missing", what: "Smartdeck", cat: "Smartdecks & B&E Buddies",
            title: "Nothing to jack into",
            say: "Every cipher you know is sitting behind glass. The #GRID does not care how good you are if you turned up without hardware." };
          if (dk.bricked) return { state: "bricked", what: "Smartdeck" };
          return { state: "ok" };
        }
        return null;
      })();
      var _dead = !!(_dep && _dep.state === "bricked");

      function featNode(f) {
        var uses = f.uses ? {
          max: f.uses.max, recharge: f.uses.recharge,
          spent: Math.min((((ch.featureUses || {})[f.name] || {}).n) || 0, f.uses.max),
          onSet: function (n) {
            store.update(function (c) {
              c.featureUses = c.featureUses || {};
              if (n <= 0) delete c.featureUses[f.name];
              else c.featureUses[f.name] = { n: n, r: f.uses.recharge };
            });
          }
        } : null;
        var onUse = null, canUse = false;
        if (d.resource && f.chip && f.chip.toUpperCase().indexOf(rName) !== -1) {
          var moxieCost = parseInt(f.chip, 10) || 1;
          canUse = rCur >= moxieCost;
          onUse = (function (cost) {
            return function () {
              store.update(function (c) {
                c.resources.current[d.resource.name] = Math.max(0, rCur - cost);
              });
            };
          })(moxieCost);
        }
        return actionEntry(f.id, f.name, f.cost, f.src, f.text, f.limited, f.chip, uses, onUse, canUse);
      }
      /* pushFeat stays a one-argument wrapper on purpose. Several call sites are
         forEach(pushFeat), which would hand a second parameter the array index, so the
         builder is split out instead of given an optional target. */
      function pushFeat(f) { kids.push(featNode(f)); }

      if (d.resource) {
        var rCur = (ch.resources.current[d.resource.name] != null) ? ch.resources.current[d.resource.name] : d.resource.max;
        rCur = eng.clamp(rCur, 0, d.resource.max);

        /* Build the pool's rows ONCE, then decide where they land. A class whose hardware
           produces the pool gets them rendered INSIDE that device's card, because a Smartdeck
           and its Bandwidth are one object and two stacks of spacing made them read as two.
           Everyone else gets them on their own, exactly as before. */
        var resKids = [];
        resKids.push(el("div.section-title", { style: { margin: "8px 0 2px" } }, [document.createTextNode(d.resource.name), el("span.line")]));
        resKids.push(el("div.row.between.wrap", { style: { alignItems: "center" } }, [
          el("div.mono", { style: { fontSize: "20px", color: resourceColor(d.resource.name) }, html: rCur + " <span style='font-size:12px;color:var(--text3)'>/ " + d.resource.max + " · " + d.resource.attributeName + " · refresh on rest</span>" }),
          plusMinus(function () { store.update(function (c) { c.resources.current[d.resource.name] = Math.max(0, rCur - 1); }); },
                    function () { store.update(function (c) { c.resources.current[d.resource.name] = Math.min(d.resource.max, rCur + 1); }); })
        ]));
        resKids.push(bar(rCur, d.resource.max, resourceColor(d.resource.name)));
        // Stitcher: the Triage Save DC every Protocol save lands against, plus the Rig tier
        // feeding its Output Bonus. Both come off the derived record.
        if (d.triage) {
          var signed = function (n) { return (n >= 0 ? "+" : "") + n; };
          resKids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "6px" } }, [
            el("span.chip", { style: { fontSize: "9.5px", color: resourceColor("Triage"), borderColor: resourceColor("Triage") },
                              title: "Triage Save DC: 8 + your Tech Modifier + your Rig's Output Bonus" },
               "TRIAGE SAVE DC " + d.triage.saveDC),
            el("span.help", { style: { margin: 0, fontSize: "10.5px" },
                              text: (d.triage.scrapRig ? "Scrap Rig" : (d.triage.rigLabel || "no Rig recorded")) +
                                    " · Output Bonus " + signed(d.triage.outputBonus) +
                                    " · Tech " + signed(d.triage.techMod) })
          ]));
          if (d.triage.scrapRig) resKids.push(el("p.help", { style: { margin: "4px 0 0", fontSize: "10.5px" },
            text: "Scrap Rig: Snag on all Triage healing and attack rolls, and every Swift Action Protocol costs an Action." }));
        }

        var _cardKids = [];
        if (d.triage) traumaRigKids(d, resKids).forEach(function (k) { _cardKids.push(k); });
        else if ((d.grid || {}).isCodebreaker) smartdeckKids(d, ch, resKids).forEach(function (k) { _cardKids.push(k); });
        else resKids.forEach(function (k) { _cardKids.push(k); });
        // bricked: the card and the pool inside it go dead together
        if (_dead) _cardKids.forEach(function (k) { if (k.classList) k.classList.add("rig-dead"); });
        _cardKids.forEach(function (k) { kids.push(k); });

        if (_dep && _dep.state === "missing" && resourceFeats.length) {
          kids.push(el("div.gear-gone", null, [
            el("div.gg-title", { text: "⚠ " + _dep.title }),
            el("p.gg-say", { text: _dep.say }),
            el("div.gg-count", { text: resourceFeats.length + " " + d.resource.name + " " +
              (resourceFeats.length === 1 ? "ability is" : "abilities are") + " unavailable until a " + _dep.what + " is equipped." }),
            el("button.btn.sm", { style: { color: "var(--danger)", borderColor: "var(--danger)" },
              title: "Open the Stash and equip one",
              onclick: function () { if (EN.inventoryView.openStash) EN.inventoryView.openStash(_dep.cat); EN.app.gotoTab("gear"); } },
              "⇒ EQUIP A " + _dep.what.toUpperCase())
          ]));
        } else {
          // bricked keeps them listed, greyed, so you can see what you have lost
          resourceFeats.map(featNode).forEach(function (k) {
            if (_dead && k.classList) k.classList.add("rig-dead");
            kids.push(k);
          });
        }
      }
      // A Trauma Rig is ordinary gear anyone can buy, so a non-Stitcher who owns one
      // gets the object's block (tier, Output Bonus, Mod Slots, traits, Medical
      // Baseline, its #GRID node and its Integrity track) with no class resource
      // attached: no Triage Save DC, no Triage pool, no Protocols, no Scrap Rig.
      if (!d.triage && d.rig && (d.rig.rigTier || (d.rig.ownedRigs || []).length)) {
        traumaRigKids(d).forEach(function (k) { kids.push(k); });
      }
      /* The same rule from the other side: a Smartdeck is ordinary gear anyone can buy, so a
         non-Codebreaker who owns or is running one gets the object's own block with no class
         resource attached. A Codebreaker never reaches here, because their deck is already
         folded into the Bandwidth card above and showing it twice would be worse than not
         showing it at all. */
      if (!(d.grid || {}).isCodebreaker) {
        var _gv = EN.gridView || {};
        var _od = _gv.ownedRigRows ? _gv.ownedRigRows(ch) : { smartdecks: [], buddies: [] };
        if ((d.grid || {}).deck || _od.smartdecks.length || _od.buddies.length) {
          smartdeckKids(d, ch).forEach(function (k) { kids.push(k); });
        }
      }
      if (otherFeats.length) {
        kids.push(el("div.section-title", { style: { margin: d.resource ? "12px 0 2px" : "2px 0 2px" } }, [document.createTextNode("Abilities"), el("span.line")]));
        otherFeats.forEach(pushFeat);
      } else if (!resourceFeats.length) {
        kids.push(el("div.section-title", { style: { margin: d.resource ? "12px 0 2px" : "2px 0 2px" } }, [document.createTextNode("Abilities"), el("span.line")]));
        kids.push(el("p.help", { style: { margin: 0 }, text: "No active abilities yet. Resource abilities you pick on #PRINT show up here, ready to fire." }));
      }
      return kids;
    }

    /* ---- FEATURES tab: "what does my character have" ----
       Auto-built passive features (read-only rules text, player-annotatable) plus
       manual GM/player entries. Computed and custom features live in one place. */
    function annot(name) { return (ch.featureAnnotations || {})[name] || {}; }
    function setAnnot(name, patch, silent) {
      store.update(function (c) {
        c.featureAnnotations = c.featureAnnotations || {};
        var a = c.featureAnnotations[name] || {};
        Object.keys(patch).forEach(function (k) { a[k] = patch[k]; });
        if (!a.note && !a.pinned && !a.important && !a.hidden) delete c.featureAnnotations[name];
        else c.featureAnnotations[name] = a;
      }, silent ? { silent: true } : undefined);
    }
    function flagBtn(glyph, on, title, onclick) {
      return el("button", { title: title, onclick: function (e) { e.stopPropagation(); onclick(); },
        style: { background: on ? "var(--accent)" : "transparent", color: on ? "var(--bg)" : "var(--text3)",
                 border: "1px solid " + (on ? "var(--accent)" : "var(--border2)"), borderRadius: "3px",
                 minWidth: "22px", height: "20px", lineHeight: "1", fontSize: "11px", cursor: "pointer", padding: "0 3px", flex: "0 0 auto" } }, glyph);
    }
    function featureRefEntry(f) {
      // collapse + note-open state keyed by the stable feature name (not the positional id),
      // so open cards don't carry over to a different feature when the list order/length changes
      var a = annot(f.name), id = "feat-" + f.name, open = !!_open[id], noteOpen = !!_open["note-" + f.name];
      var controls = el("div.row", { style: { gap: "4px", flex: "0 0 auto" }, onclick: function (e) { e.stopPropagation(); } }, [
        flagBtn("☆", !!a.important, a.important ? "Unmark important" : "Mark important", function () { setAnnot(f.name, { important: !a.important }); }),
        flagBtn("⇧", !!a.pinned, a.pinned ? "Unpin" : "Pin to top", function () { setAnnot(f.name, { pinned: !a.pinned }); }),
        flagBtn("✎", noteOpen || !!a.note, "Personal note", function () { _open["note-" + f.name] = !noteOpen; EN.app.render(); }),
        flagBtn("⊘", false, "Hide from the list", function () { setAnnot(f.name, { hidden: true }); })
      ]);
      return el("div.feature", { style: { borderLeftColor: a.important ? "var(--gold)" : "var(--border2)" } }, [
        el("h4", { style: { cursor: "pointer", flexWrap: "wrap", gap: "6px" }, onclick: function () { _open[id] = !open; EN.app.render(); } }, [
          el("span", null, [el("span.collapse-caret", { text: open ? "▾" : "▸" }), document.createTextNode(" " + f.name),
            a.pinned ? el("span.chip", { style: { marginLeft: "8px", fontSize: "9px", color: "var(--accent)", borderColor: "var(--accent)" }, text: "PINNED" }) : null,
            el("span.chip", { style: { marginLeft: "6px", fontSize: "9px", color: "var(--text3)", borderColor: "var(--border2)" }, text: "PASSIVE" })]),
          el("span", { style: { display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" } }, [el("span.src", { text: f.src }), controls])
        ]),
        open ? EN.ui.renderText(f.text || "") : null,
        (!noteOpen && a.note) ? el("p.help", { style: { margin: "4px 0 0", color: "var(--accent)" }, text: "✎ " + a.note }) : null,
        noteOpen ? el("div", { style: { margin: "6px 0 2px" } }, [
          el("textarea", { value: a.note || "", placeholder: "Your note on this feature…",
            oninput: function () { var v = this.value; setAnnot(f.name, { note: v }, true); },
            style: { width: "100%", minHeight: "52px", fontSize: "12px" } })
        ]) : null
      ]);
    }
    function customFeatureEditor(cf, i) {
      var key = cf.id || i;
      function fld(k, label, ph, area) {
        return el("div.field", { style: { marginBottom: "6px" } }, [
          el("label.fl", { style: { margin: "0 0 2px" }, text: label }),
          el(area ? "textarea" : "input", { value: cf[k] || "", placeholder: ph || "",
            oninput: function () { var v = this.value; store.update(function (c) { if (c.customFeatures[i]) c.customFeatures[i][k] = v; }, { silent: true }); },
            style: area ? { width: "100%", minHeight: "54px", fontSize: "12px" } : { width: "100%", fontSize: "12px" } })
        ]);
      }
      var adv = !!_open["cfadv-" + key];
      return el("div.feature", { style: { borderLeftColor: "var(--accent)" } }, [
        fld("name", "Name", "Street Saint"),
        fld("source", "Source", "Faction Perk"),
        fld("effect", "Effect", "What it does…", true),
        fld("note", "Player note", "Only works in Warrens districts.", true),
        el("div.section-title.clickable", { style: { margin: "4px 0 2px" }, onclick: function () { _open["cfadv-" + key] = !adv; EN.app.render(); } },
          [document.createTextNode("Ability-like fields (optional)"), el("span.line"), el("span.collapse-caret", { style: { marginLeft: "4px" }, text: adv ? "▾" : "▸" })]),
        adv ? el("div.grid2", null, [
          fld("category", "Category", "Maneuver / Protocol / Boon"),
          fld("action", "Activation", "Swift Action / Impulse Action"),
          fld("cost", "Resource cost", "1 Moxie / 2 FP"),
          fld("uses", "Uses / recharge", "2 per Long Rest"),
          fld("range", "Range", "6 spaces"),
          fld("duration", "Duration", "1 minute")
        ]) : null,
        el("div.row", { style: { gap: "6px", marginTop: "8px", justifyContent: "flex-end" } }, [
          el("button.btn.sm.primary", { onclick: function () { _open["cfedit-" + key] = false; EN.app.render(); } }, "✓ DONE")
        ])
      ]);
    }
    function customFeatureCard(cf, i) {
      var key = cf.id || i;
      if (_open["cfedit-" + key]) return customFeatureEditor(cf, i);
      var id = "cf-" + key, open = !!_open[id];
      var chips = [];
      function ch_(text, color) { if (text) chips.push(el("span.chip", { style: { fontSize: "9px", color: color, borderColor: color }, text: text })); }
      ch_(cf.category, "var(--flow)"); ch_(cf.action, "var(--accent)"); ch_(cf.cost, "var(--gold)");
      ch_(cf.uses, "var(--text2)"); ch_(cf.range && "Range " + cf.range, "var(--text2)"); ch_(cf.duration, "var(--text2)");
      return el("div.feature", { style: { borderLeftColor: "var(--gold)" } }, [
        el("h4", { style: { cursor: "pointer", flexWrap: "wrap", gap: "6px" }, onclick: function () { _open[id] = !open; EN.app.render(); } }, [
          el("span", null, [el("span.collapse-caret", { text: open ? "▾" : "▸" }), document.createTextNode(" " + (cf.name || "Untitled Feature")),
            el("span.chip", { style: { marginLeft: "6px", fontSize: "9px", color: "var(--gold)", borderColor: "var(--gold)" }, text: "CUSTOM" })]),
          el("span.src", { text: cf.source || "" })
        ]),
        open && chips.length ? el("div.row.wrap", { style: { gap: "5px", margin: "2px 0 6px" } }, chips) : null,
        open && cf.effect ? el("p", { text: cf.effect }) : null,
        open && cf.note ? el("p.help", { style: { margin: "4px 0 0", color: "var(--accent)" }, text: "✎ " + cf.note }) : null,
        open ? el("div.row", { style: { gap: "6px", marginTop: "8px", justifyContent: "flex-end" } }, [
          el("button.btn.sm", { onclick: function () { _open["cfedit-" + key] = true; EN.app.render(); } }, "✎ EDIT"),
          el("button.btn.sm.danger", { onclick: function () { store.update(function (c) { c.customFeatures.splice(i, 1); }); } }, "✕ DELETE")
        ]) : null
      ]);
    }
    function featuresKids() {
      var kids = [];
      var visible = [], hidden = [];
      passiveFeats.forEach(function (f) { (annot(f.name).hidden ? hidden : visible).push(f); });
      visible.sort(function (a, b) {
        var aa = annot(a.name), bb = annot(b.name);
        return ((bb.pinned ? 2 : 0) + (bb.important ? 1 : 0)) - ((aa.pinned ? 2 : 0) + (aa.important ? 1 : 0));
      });
      kids.push(el("div.section-title", { style: { margin: "2px 0 2px" } }, [document.createTextNode("Class & Build Features"), el("span.line")]));
      kids.push(el("p.help", { style: { margin: "0 0 6px" }, text: "Auto-built from your class, subclass, species, lineage, and background. Star, pin, annotate, or hide any of them; the rules text stays as written." }));
      if (visible.length) visible.forEach(function (f) { kids.push(featureRefEntry(f)); });
      else kids.push(el("p.help", { style: { margin: 0 }, text: "No passive features yet." }));
      if (hidden.length) {
        kids.push(el("div.section-title.clickable", { style: { margin: "10px 0 2px" },
          onclick: function () { _featShowHidden = !_featShowHidden; EN.app.render(); } },
          [document.createTextNode("Hidden (" + hidden.length + ")"), el("span.line"), el("span.collapse-caret", { style: { marginLeft: "4px" }, text: _featShowHidden ? "▾" : "▸" })]));
        if (_featShowHidden) hidden.forEach(function (f) { kids.push(featureRefEntry(f)); });
      }
      kids.push(el("div.section-title", { style: { margin: "14px 0 2px" } }, [document.createTextNode("Custom Features"), el("span.line")]));
      var customs = ch.customFeatures || [];
      if (customs.length) customs.forEach(function (cf, i) { kids.push(customFeatureCard(cf, i)); });
      else kids.push(el("p.help", { style: { margin: 0 }, text: "Track GM boons, faction perks, story rewards, homebrew traits, and one-off rulings here." }));
      kids.push(el("button.btn.sm", { style: { marginTop: "8px", borderStyle: "dashed", color: "var(--accent)", borderColor: "var(--accent)" },
        onclick: function () {
          store.update(function (c) {
            c.customFeatures = c.customFeatures || [];
            var nid = "cf_" + Date.now().toString(36);
            c.customFeatures.push({ id: nid, name: "", source: "", effect: "", note: "", category: "", action: "", cost: "", uses: "", range: "", duration: "" });
            _open["cfedit-" + nid] = true;
          });
        } }, "＋ Add a Feature"));
      return kids;
    }

    /* ---- WEAPONS tab: equipped-weapon attacks (behavior unchanged) ---- */
    // Scoundrel Gambits ride on attack rolls, ability checks AND saving throws, so
    // this lives at render scope where both the Attacks panel and Defense panel see it.
    function moxieFlags() {
      var gambitNames = (eng.chosenResourceAbilities ? eng.chosenResourceAbilities(ch) : []).map(function (a) { return a.name; });
      var featNames = (d.features || []).map(function (f) { return f.name; });
      var moxie = (d.resource && d.resource.name === "Moxie") ? { name: "Moxie", max: d.resource.max } : null;
      return {
        moxie: moxie,
        luckyBreak: !!moxie && gambitNames.indexOf("Lucky Break") !== -1,
        pureLuck: !!moxie && gambitNames.indexOf("Pure Luck") !== -1,
        pressLuck: !!moxie && featNames.indexOf("Press Your Luck") !== -1,
        countingCards: featNames.indexOf("Counting Cards") !== -1
      };
    }
    function weaponsKids() {
      var kids = [];
      var atkSnag = fx.snagAtk ? "Active condition · Snag on all attack rolls" : null;
      // to-hit: governing attribute + weapon-category proficiency bonus
      function weaponHit(it) {
        var melee = it.group === "Simple" || it.group === "Martial";
        var thrownItem = (it.traits || []).some(function (t) { return /^Thrown/.test(t); });
        var finesse = (it.traits || []).some(function (t) { return /^Finesse/.test(t); });
        var bod = d.attributes.BOD.mod, agi = d.attributes.AGI.mod;
        var useAgi = melee ? (finesse && agi > bod) : (thrownItem ? agi >= bod : true);
        var mod = useAgi ? agi : bod, attrName = useAgi ? "Agility" : "Body";
        // Damage adds the SAME attribute modifier the attack roll used. Indirect
        // delivery adds none: "a grenade or launcher shell lands at a point, forces a
        // save, and deals only its listed damage dice." The Explosive trait marks
        // exactly that set (the thrown grenades and the three launchers).
        var indirect = (it.traits || []).some(function (t) { return /^Explosive/.test(t); });
        var cat = GROUP_CAT[it.group], tier = eng.effectiveGearTier(ch, "weapons", cat), prof = R.profTiers[tier].d20;
        // A Weapon Focus naming this weapon type adds Caliber to attack rolls;
        // Focus Caliber rides outside the +15 static modifier cap. A matching
        // Specialization widens the crit threat range by 1 (19-20).
        var focus = eng.weaponFocus(ch, cat, it.name);
        var focusCal = focus ? (d.caliber || 1) : 0;
        var spec = eng.weaponSpec(ch, cat, it.name);
        return { mod: mod, attrName: attrName, cat: cat, tier: tier, prof: prof,
                 focus: focus, focusCal: focusCal, spec: spec, indirect: indirect,
                 dmgMod: indirect ? 0 : mod,
                 total: mod + prof + focusCal, melee: melee, thrownItem: thrownItem };
      }
      // a plain snapshot the roll tray opens against (no live-scope closures)
      // Moxie Gambits and the Wildcard bet ride outside the clean 2d20 rule;
      // each is offered on any d20 attack only if the character actually has it
      // and has Moxie. Shared by weapon and class-attack contexts.
      function attackCtx(it, h, wk) {
        var baseMods = [{ label: h.attrName + " Modifier", value: h.mod }];
        if (h.prof) baseMods.push({ label: "Weapon Proficiency", value: h.prof });
        if (h.focusCal) baseMods.push({ label: h.cat + " Focus (Caliber)", value: h.focusCal });
        var autoSnag = [];
        if (fx.snagAtk) autoSnag.push("Active condition");
        if (h.tier === "untrained") autoSnag.push("Untrained (" + h.cat + ")");
        return Object.assign({
          weaponName: it.name,
          weaponKey: wk || null,   // the PIECE: its magazine, its mods, its grip
          subtype: (h.melee ? "Melee" : h.thrownItem ? "Thrown" : "Ranged") + " Weapon · " + h.cat,
          melee: h.melee, thrownItem: h.thrownItem, ranged: !h.melee && !h.thrownItem,
          usesAmmo: !h.melee && !h.thrownItem && it.ammo != null,   // a fired weapon spends a shot per roll
          traits: it.traits || [], baseMods: baseMods, critMin: h.spec ? 19 : 20,
          autoSnag: autoSnag, autoEdge: [], baseSnag: autoSnag.length, baseEdge: 0,
          shaken: (ch.conditions || []).indexOf("Shaken") !== -1,
          dmg: damageCtx(it, h, wk)   // carried so the attack tray can hand off to damage
        }, moxieFlags());
      }
      // a non-weapon attack (Cipher, Flow, natural / unarmed strike) the roll
      // tray can open against. mods is the named breakdown; opts carries an
      // auto-Snag reason, an optional damage snapshot, and a crit floor.
      function simpleAttackCtx(name, subtype, mods, opts) {
        opts = opts || {};
        var autoSnag = opts.snag ? [opts.snag] : [];
        return Object.assign({
          weaponName: name, subtype: subtype,
          melee: false, thrownItem: false, ranged: false, usesAmmo: false,
          traits: [], baseMods: mods, critMin: opts.critMin || 20,
          autoSnag: autoSnag, autoEdge: [], baseSnag: autoSnag.length, baseEdge: 0,
          shaken: (ch.conditions || []).indexOf("Shaken") !== -1,
          dmg: opts.dmg || null
        }, moxieFlags());
      }
      // a damage snapshot the damage tray opens against. Every weapon adds its
      // attack attribute modifier to damage (weapon dice + Body or Agility), so a
      // ranged weapon adds Agility exactly as its attack roll does. Cheap Shot rides
      // as an optional bonus group for a Scoundrel wielding a Sidearm, Simple, or
      // Light-melee weapon.
      function damageCtx(it, h, wk) {
        var p = parseDamage(it.damage), traits = it.traits || [];
        var hasLight = traits.some(function (t) { return /^Light$/i.test(t); });
        var cheapEligible = ch.class === "scoundrel" && (
          it.group === "Sidearm" || it.group === "Simple" || (h.melee && it.group === "Martial" && hasLight));
        return {
          weaponName: it.name,
          weaponKey: wk || null,
          subtype: (h.melee ? "Melee" : h.thrownItem ? "Thrown" : "Ranged") + " Weapon · " + h.cat,
          dice: p.dice, types: p.types,
          flat: h.dmgMod, flatLabel: h.indirect ? "Indirect: no attribute modifier" : (h.attrName + " Modifier"),
          /* `dice` stays the BASE and `versatile` stays the alternate, because the
             tray's own arithmetic picks between them off its twoHand flag. What
             changes is where that flag STARTS and whether it can be moved: the tray
             opens on the grip the row is showing, and renders the toggle only when
             the grip is actually a choice. It used to default to one-handed on every
             open, so a two-handed Longsword rolled 1d8 unless you flipped it again,
             and a weapon forced two-handed by an Extended Shaft still offered a
             one-handed option it cannot have. */
          versatile: versatileDie(traits),
          grip: eng.weaponGrip(ch, it, wk),
          cheapEligible: cheapEligible, cheapDice: d.caliber || 1,
          crit: false
        };
      }
      // ch.equippedWeapons holds ids, not names; move the first id that
      // resolves to wname past its neighboring array slot (the same
      // one-slot-per-equipped-weapon assumption the display order relies on).
      function moveWeaponName(wname, dir) {
        store.update(function (c) {
          var a = c.equippedWeapons || [], j = -1;
          for (var k = 0; k < a.length; k++) {
            var e = (c.equipment || []).find(function (x) { return (x.id || x.name) === a[k]; });
            if (e && e.name === wname) { j = k; break; }
          }
          var t = j + dir;
          if (j === -1 || t < 0 || t >= a.length) return;
          var tmp = a[j]; a[j] = a[t]; a[t] = tmp;
        });
      }
      function reorderArrows(wname, wi) {
        return el("div", { style: { display: "flex", flexDirection: "column", gap: "1px", flex: "0 0 auto" } }, [
          el("button", { title: "Move up", disabled: wi === 0,
            onclick: function () { moveWeaponName(wname, -1); },
            style: { background: "transparent", border: "none", color: wi === 0 ? "var(--text4)" : "var(--text3)", cursor: wi === 0 ? "default" : "pointer", fontSize: "9px", lineHeight: "1", padding: "1px 3px" } }, "▲"),
          el("button", { title: "Move down", disabled: wi === equippedNames.length - 1,
            onclick: function () { moveWeaponName(wname, 1); },
            style: { background: "transparent", border: "none", color: wi === equippedNames.length - 1 ? "var(--text4)" : "var(--text3)", cursor: wi === equippedNames.length - 1 ? "default" : "pointer", fontSize: "9px", lineHeight: "1", padding: "1px 3px" } }, "▼")
        ]);
      }
      /* A stat that rolls something renders as a pressable key; a stat that is
         just a number (Reach, Range) stays plain text. */
      function statBox(label, value, color, title, onClick, kind) {
        if (physicalDice()) onClick = null;   // real dice: the number is just a number
        if (!onClick) {
          return el("div", { title: title || "",
            style: { textAlign: "center", flex: "0 0 auto", minWidth: "44px" } }, [
            el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: label }),
            el("span.mono", { style: { fontSize: "15px", color: color || "var(--text)" }, text: value })
          ]);
        }
        return el("div.statwrap", { title: title || "" }, [
          el("div.lbl", { text: label }),
          el("span.mono.statkey", { style: { color: color || "var(--text)" }, onclick: onClick, text: value })
        ]);
      }
      realWeaponRows.forEach(function (row, wi) {
        var it = row.it, wname = row.name, wKey = row.key;
        if (!it) return;
        // Knuckles and Shock Gloves augment the punch rather than being weapons of
        // their own. Their catalog damage is a legacy of the old replace-the-die
        // model, so a row here would offer a strictly worse 1d4 attack beside the
        // stepped unarmed strike they are the reason for. The strike row and the
        // STRIKE picker already account for them.
        if (eng.isUnarmedAugmentName(it.name)) return;
        var h = weaponHit(it), norm = normalizeWeapon(it);
        // resolved once per row and used by both the REACH box and the traits line,
        // so the number and the chips cannot disagree. Ranged weapons come back
        // `melee: false` and nothing below touches them.
        var wr = eng.weaponReach(ch, it, wKey);
        var snagWhy = atkSnag || (h.tier === "untrained" ? "Untrained with " + h.cat + "; attacks roll with Snag" : null);
        /* ONE damage rating, the one this weapon is actually dealing. A Versatile
           weapon used to print both dice ("1d8 (1d10)") and leave the player to work
           out which applied; it has one at a time, and which one is a fact about the
           grip. The rest of the damage string (the type, any rider) is unchanged. */
        var grip = eng.weaponGrip(ch, it, wKey);
        var dmgActive = grip.dice
          ? norm.damageDisplay.replace(/^\s*\d+d\d+(\s*\(\d+d\d+\))?/, grip.dice)
          : norm.damageDisplay;
        var dmgTip = (h.indirect
          ? dmgActive + " on hit · indirect delivery adds no attribute modifier · Tap to roll damage"
          : dmgActive + " " + eng.fmtMod(h.mod) + " (" + h.attrName + ") on hit · Tap to roll damage")
          + (grip.why ? "\n" + grip.why : "");
        // DMG box shows the dice plus the attribute modifier the roll adds (e.g. "1d4 +3");
        // indirect weapons (thrown explosives) show the dice alone.
        var dmgDisplay = dmgActive + (h.indirect ? "" : " " + eng.fmtMod(h.mod));
        var hitTip = "d20 + " + h.attrName + " Modifier (" + eng.fmtMod(h.mod) + ")"
          + (h.prof ? " + Weapon Proficiency Bonus (" + eng.fmtMod(h.prof) + ")" : " (untrained, Snag)")
          + (h.focus ? " + Caliber from " + h.cat + " (" + h.focus.aspect + ") Focus (" + eng.fmtMod(h.focusCal) + ", outside the +15 static cap)" : "");
        var subtype = (h.melee ? "Melee" : h.thrownItem ? "Thrown" : "Ranged") + " Weapon · " + h.cat;
        var isRanged = !h.melee && !h.thrownItem && it.ammo != null;

        var head = el("div.row", { style: { gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "2px" } }, [
          equippedNames.length > 1 ? reorderArrows(wname, wi) : null,
          // row.label, not it.name: two equipped copies of one weapon are two rows with two
          // builds, and two identical headers over different numbers is the confusing part.
          // The label is the bare name whenever the name does not repeat.
          el("span", { title: it.desc || "", style: { fontWeight: 600, fontSize: "14px" }, text: row.label }),
          snagWhy ? snagChip(snagWhy) : null,
          h.focus ? el("span.chip", { title: "Skill Focus: " + h.cat + " (" + h.focus.aspect + ")" + (h.focus.granted ? " · Free overlap Focus" : "") + ". Adds Caliber (" + eng.fmtMod(h.focusCal) + ") to attack rolls with this weapon type, outside the +15 static cap.",
            style: { fontSize: "9px", color: "var(--gold)", borderColor: "var(--gold)" } }, "FOCUS +" + h.focusCal) : null,
          h.spec ? el("span.chip", { title: "Specialization: " + h.cat + " (" + h.spec.aspect + "). Crit threat range widens by 1 (19-20), stacking with other crit range sources.",
            style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" } }, "CRIT 19-20") : null,
          el("span", { style: { fontSize: "10px", color: "var(--text3)", flex: "1 1 auto" }, text: subtype }),
          // real dice roll on the table, but the magazine is still the app's job
          (physicalDice() && isRanged) ? el("button.btn.sm", {
            title: "Spend this weapon's ammo for one use; roll the dice yourself",
            style: { color: "var(--ember)", borderColor: "var(--ember)", flex: "0 0 auto" },
            onclick: function () { fireWeapon(wKey); } }, "FIRE") : null
        ]);

        var rowKids = [head];

        if (isRanged) {
          var st = readAmmo(ch, it, wKey);
          var selCost = costFor(it, st.mode);
          var canAny = st.cur >= minFireCost(it);   // any mode could fire?
          var canSel = st.cur >= selCost;           // the selected mode can fire?
          var hitCell;
          if (!canAny) {   // magazine can't pay even the cheapest mode → Reload affordance
            hitCell = el("div", { style: { textAlign: "center", flex: "0 0 auto", minWidth: "56px" } }, [
              el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "HIT" }),
              el("button.btn.sm", { style: { color: "var(--warn)", borderColor: "var(--warn)", padding: "1px 7px" }, onclick: function () { reloadWeapon(wKey); } }, "⟳ RELOAD")
            ]);
          } else {   // can fire something; grey the number when the SELECTED mode is unaffordable
            hitCell = physicalDice()
              ? statBox("HIT", eng.fmtMod(h.total), canSel ? "var(--ember)" : "var(--danger)", hitTip)
              : el("div.statwrap", { title: hitTip + " \u00b7 Roll to hit (" + st.mode + " \u00b7 \u2212" + selCost + ")",
                  style: { opacity: canSel ? 1 : 0.5 } }, [
                  el("div.lbl", { text: "HIT" }),
                  el("span.mono.statkey", { style: { color: canSel ? "var(--ember)" : "var(--danger)" },
                    onclick: function () { openRollTray(attackCtx(it, h, wKey)); }, text: eng.fmtMod(h.total) })
                ]);
          }
          var pct = st.cap > 0 ? Math.round(st.cur / st.cap * 100) : 0;
          var ammoCell = el("div", { style: { flex: "1 1 120px", minWidth: "110px" } }, [
            el("div.row.between", { style: { alignItems: "baseline" } }, [
              el("span", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "AMMO" }),
              el("span.mono", { style: { fontSize: "12px", color: st.cur === 0 ? "var(--danger)" : "var(--text2)" }, text: st.cur + " / " + st.cap + (it.ammoUnit ? " " + it.ammoUnit : "") })
            ]),
            magBar(st.cur, st.cap, st.cur === 0)
          ]);
          rowKids.push(el("div.row.wrap", { style: { gap: "12px", alignItems: "center", marginTop: "6px" } }, [
            statBox("RANGE", norm.rangeDisplay, "var(--gold)", it.range || ""),
            hitCell,
            statBox("DMG", dmgDisplay, "var(--accent)", dmgTip, function () { openDmgTray(damageCtx(it, h, wKey)); }, "dmg"),
            ammoCell
          ]));

          // controls: fire-mode selector, ammo-type dropdown, reload
          var controls = [];
          if (st.modes.length > 1) {
            controls.push(el("select", { style: { fontSize: "11px", width: "auto" }, onchange: function () { writeAmmo(wKey, { mode: this.value }); } },
              st.modes.map(function (m) { return el("option", { value: m, selected: m === st.mode, title: weaponTraitTip(m), text: m + " · −" + MODE_COST[m] }); })));
          } else if (st.modes.length === 1) {
            controls.push(el("span.chip", { title: weaponTraitTip(st.modes[0]), style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, st.modes[0].toUpperCase() + " · −" + MODE_COST[st.modes[0]]));
          } else {
            controls.push(el("span.chip", { style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, "FIRE · −" + implicitCost(it)));
          }
          var ammoOpts = ammoTypeOptions(ch, it);
          if (ammoOpts.indexOf(st.ammoType) === -1) ammoOpts.push(st.ammoType);   // keep the loaded type selectable even if its stash ran out
          if (ammoOpts.length > 1) {
            controls.push(el("select", { title: "Loaded ammunition (Reload to apply)", style: { fontSize: "11px", width: "auto" }, onchange: function () { writeAmmo(wKey, { ammoType: this.value }); } },
              ammoOpts.map(function (o) { return el("option", { value: o, selected: o === st.ammoType, text: o + (o !== "Standard" && ownedQty(ch, o) <= 0 ? " (none in stash)" : "") }); })));
          }
          controls.push(el("button.btn.sm", { title: "Reload to " + st.cap + (it.ammoUnit ? " " + it.ammoUnit : ""), style: { color: "var(--text2)", padding: "2px 8px" }, onclick: function () { reloadWeapon(wKey); } }, "⟳ RELOAD"));
          rowKids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, controls));

          // status sub-row: loaded special round/munition effect + (future) mods
          var statusChips = [];
          if (st.ammoType !== "Standard" && st.ammoType !== baseFeedName(it)) {
            var a = ammoCatalog().concat(munitions()).find(function (x) { return x.name === st.ammoType; });
            statusChips.push(el("span.chip", { title: a ? (a.effect || a.desc || "") : "", style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" } }, "◆ " + st.ammoType));
          }
          if (statusChips.length) rowKids.push(el("div.row.wrap", { style: { gap: "6px", marginTop: "6px" } }, statusChips));
        } else {
          // melee / thrown: Range · Hit · Damage (no ammo). HIT opens the roll tray.
          /* REACH is the one number on this row a character feature can move, so it
             comes from the engine's resolver rather than from the catalog string.
             The tooltip breaks it down, because "REACH 5" on a Quarterstaff is
             otherwise unexplainable next to a trait chip that says Reach 2. */
          var reachTip = wr.melee && (wr.bonus || wr.capped)
            ? "Melee range is the adjacent space, plus 1 space per point of Reach.\n"
              + (wr.base ? it.name + " has Reach " + wr.base + ".\n" : it.name + " has no Reach of its own.\n")
              + wr.sources.map(function (s) { return "+" + s.spaces + " " + s.label; }).join("\n")
              + (wr.capped ? "\n\n" + wr.capped + " point" + (wr.capped > 1 ? "s" : "") + " wasted: "
                  + (wr.flexible ? "a flexible weapon" : "a rigid weapon") + " caps at Reach " + wr.cap + "." : "")
              + "\nReaches " + wr.total + " spaces."
            : (it.range || "");
          rowKids.push(el("div.row.wrap", { style: { gap: "14px", alignItems: "center", marginTop: "6px" } }, [
            statBox(h.melee ? "REACH" : "RANGE", (wr.melee ? String(wr.total) : norm.rangeDisplay),
              wr.bonus ? "var(--flow)" : "var(--gold)", reachTip),
            physicalDice()
              ? statBox("HIT", eng.fmtMod(h.total), "var(--ember)", hitTip)
              : el("div.statwrap", { title: "Roll to hit \u00b7 " + hitTip }, [
                  el("div.lbl", { text: "HIT" }),
                  el("span.mono.statkey", { style: { color: "var(--ember)" },
                    onclick: function () { openRollTray(attackCtx(it, h, wKey)); }, text: eng.fmtMod(h.total) })
                ]),
            statBox("DMG", dmgDisplay, "var(--accent)", dmgTip, function () { openDmgTray(damageCtx(it, h, wKey)); }, "dmg")
          ]));
        }

        /* traits line. The catalog's own "Reach 2" chip stays exactly as printed,
           because that is the weapon's trait and it is true; the character's bonus
           rides beside it as its own chip naming its sources, the same shape the
           unarmed strike's "+1 reach" chip uses. Rewriting the trait chip instead
           would make the row claim the weapon has a Reach it does not have. */
        /* The grip control. A real button when the choice exists, because it changes
           the damage the row above is advertising; a plain chip when a Two-Handed
           trait or an Extended Shaft has taken the choice away, saying which, so a
           player whose Versatile die vanished after a bench visit can see why. */
        var gripEl = grip.canToggle
          ? el("button.btn.sm", { title: grip.why + "\nTap to switch grip.",
              style: { padding: "1px 8px", fontSize: "10.5px",
                       color: grip.twoHanded ? "var(--accent)" : "var(--text3)",
                       borderColor: grip.twoHanded ? "var(--accent)" : "var(--border2)" },
              onclick: (function (k, now) { return function () {
                store.update(function (c) {
                  c.weaponGrip = c.weaponGrip || {};
                  if (now) delete c.weaponGrip[k]; else c.weaponGrip[k] = "two";
                });
              }; })(wKey, grip.twoHanded) },
              grip.twoHanded ? "TWO-HANDED · " + grip.versatile : "ONE-HANDED · " + grip.baseDice)
          : (grip.versatile && grip.forcedBy
              ? el("span.chip", { title: grip.why, style: { color: "var(--warn)", borderColor: "var(--warn)" } },
                  "TWO-HANDED ONLY · " + grip.versatile)
              : null);
        var reachChip = (wr.melee && (wr.bonus || wr.capped))
          ? el("span.chip", { title: wr.sources.map(function (s) { return "+" + s.spaces + " " + s.label; }).join("\n")
                + (wr.capped ? "\n\n" + ((EN.combat || {}).reachCapText || "") : "")
                + "\nReaches " + wr.total + " spaces in total.",
              style: { color: wr.capped ? "var(--warn)" : "var(--flow)", borderColor: wr.capped ? "var(--warn)" : "var(--flow)" } },
              wr.bonus ? ("+" + wr.bonus + " reach" + (wr.capped ? " · AT CAP" : "")) : "REACH AT CAP")
          : null;
        /* A weapon forced into two hands has lost its Versatile trait, not just the
           use of it, so the trait chip goes too and the warn chip stands in its place.
           Leaving "Versatile (1d10)" up beside "TWO-HANDED ONLY" would advertise a
           one-handed die the weapon can no longer be held for. */
        var traitChips = norm.traits.filter(function (t) {
          return !(grip.forcedBy && grip.versatile && /^Versatile\s*\(/i.test(String(t)));
        });
        rowKids.push(el("div.row.wrap", { style: { gap: "5px", marginTop: "9px", paddingTop: "8px",
          borderTop: "1px solid rgba(35,48,68,.6)" } },
          traitChips.map(wTraitChip).concat([reachChip, gripEl].filter(Boolean))));

        // Signature Weapons: On Hit effects and area projections stay locked at
        // any proficiency tier until a Skill Focus names this specific weapon.
        if (it.signature && it.effect) {
          var sigOpen = eng.signatureUnlocked(ch, it);
          rowKids.push(sigOpen
            ? el("p.help", { style: { margin: "6px 0 0", fontSize: "11px", color: "var(--accent)" },
                text: it.effect })
            : el("div", { style: { marginTop: "6px", padding: "6px 9px", border: "1px dashed var(--border2)", borderRadius: "4px", opacity: .6 },
                title: "Weapon Proficiency alone keeps a Signature Weapon's On Hit effects and area projections locked." }, [
                el("span.mono", { style: { fontSize: "10px", color: "var(--warn)", letterSpacing: ".08em" }, text: "🔒 ON HIT LOCKED · " }),
                el("span", { style: { fontSize: "11px", color: "var(--text3)" },
                  text: "Requires a Skill Focus naming this weapon: " + h.cat + " (" + it.name + "). Base attacks still work" + (h.prof ? " with your Weapon Proficiency Bonus." : ", untrained, with Snag." ) })
              ]));
        }

        // installed Workbench Parts (Mods + Accessories) for this weapon
        var wpLo = (ch.weaponParts || {})[wKey];
        if (wpLo && EN.weaponParts) {
          var wpKeys = ["targeting", "output", "core", "handling"].map(function (s) { return wpLo[s]; }).filter(Boolean).concat(wpLo.utility || []);
          var wpChips = wpKeys.map(function (k) {
            var p = EN.weaponParts.byKey[k]; if (!p) return null;
            return el("span.chip", { title: p.name + ": " + p.effect, style: { fontSize: "8.5px", color: "var(--ember)", borderColor: "var(--ember)" } }, p.grants || p.name);
          }).filter(Boolean);
          if (wpChips.length) rowKids.push(el("div.row.wrap", { style: { gap: "5px", marginTop: "4px", alignItems: "center" } },
            [el("span", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "MODS" })].concat(wpChips)));
        }

        // same card treatment the Abilities list uses, with the left rail keyed to
        // what kind of weapon it is so the list reads at a glance
        var railColor = it.signature ? "var(--flow)"
                      : isRanged ? "var(--gold)"
                      : h.thrownItem ? "var(--ember)"
                      : "var(--accent)";
        var kicking = _recoil === wKey;
        if (kicking) _recoil = null;
        kids.push(el("div.feature" + (kicking ? ".recoil" : ""), { style: { borderLeftColor: railColor } }, rowKids));
      });
      /* Unarmed strike. Once anything replaces, steps, rides on or LENGTHENS the
         strike it is a real attack you carry and the row is always listed; with
         nothing on it at all it is the bare fallback, so it only shows with no weapon
         in hand.

         `reach` is the term this gate was missing (L5). Canopy Reach adds a space of
         reach and nothing else, so a Verdine Arboreal holding a Longsword had the one
         benefit their lineage feature grants rendered nowhere: the STRIKE picker's own
         guard counts reach, but the picker lives inside this block and never ran. The
         row it now draws is a flat-1 punch beside a real weapon, which looks thin, but
         it carries the `+1 reach` chip and that chip is the only place the feature
         surfaces on this tab.

         The fallback term is `realWeaponNames`, not `equippedNames`: holding only a
         pair of Knuckles is not holding a weapon. That term is belt and braces here,
         since an augment also pushes an increase and the gate is already true. */
      var uStrike = d.unarmed;
      if (uStrike.replacers.length || uStrike.increases.count || uStrike.riders.length
          || uStrike.reach.spaces || !realWeaponNames.length) {
        var uBase = d.unarmedBase;
        var lu = uStrike.replacer, luFin = !!(uStrike.traits && /Finesse/.test(uStrike.traits));
        var luAttr = luFin ? Math.max(d.attributes.BOD.mod, d.attributes.AGI.mod) : d.attributes.BOD.mod;
        // "Unarmed strikes use your Simple Weapons Proficiency Bonus, and follow the
        // usual Untrained rule if you lack it."
        var swTier = eng.effectiveGearTier(ch, "weapons", "Simple Weapons");
        var swProf = R.profTiers[swTier].d20, swUntrained = swTier === "untrained";
        var luMod = luAttr + swProf;
        var luKind = lu ? (UNARMED_KIND[lu.kind] || "Natural Weapon") : "Unarmed Strike";
        var luName = lu ? luKind + " · " + lu.source : "Unarmed Strike";
        var luAttrLabel = (luFin ? "Body/Agility" : "Body") + " Modifier";
        var luSnag = atkSnag || swUntrained;
        // proficiency rides the attack roll only; damage keeps the attribute
        // modifier. A strike with no die is a flat 1, so it has nothing to roll
        // and opens no damage tray; the row states its damage instead. Riders are
        // situational (a Surge that is not up adds nothing), so they stay in the
        // row text rather than being pre-loaded into the tray.
        var luDmg = uStrike.die
          ? { weaponName: luName, subtype: luKind.toUpperCase(), dice: uStrike.die, types: [uStrike.type],
              flat: luAttr, flatLabel: luAttrLabel, versatile: null, cheapEligible: false, cheapDice: d.caliber || 1, crit: false }
          : null;
        var luDmgText = (uStrike.die ? uStrike.die : uBase.flat) + " " + uStrike.type
          + (uStrike.traits ? " (" + uStrike.traits + ")" : "") + " + " + (luFin ? "mod" : "Body mod");
        uStrike.riders.forEach(function (r) { luDmgText += " + " + r.damage + (r.when ? " " + r.when : ""); });
        var luSubtype = (lu ? luKind + " · " + uStrike.type : "UNARMED STRIKE").toUpperCase();
        kids.push(attackRow(luName, eng.fmtMod(luMod), "d20 + " + luAttrLabel + " + Simple Weapons Proficiency Bonus · " + luDmgText + (uStrike.note ? " · " + uStrike.note : "") + (swUntrained ? " · Untrained (Simple Weapons): Snag" : ""), "var(--ember)", luSnag,
          (function (nm, dmg) { return function () { openRollTray(simpleAttackCtx(nm, luSubtype,
            [{ label: luAttrLabel, value: luAttr }].concat(swProf ? [{ label: "Simple Weapons Proficiency Bonus", value: swProf }] : []),
            { snag: luSnag, dmg: dmg })); }; })(luName, luDmg),
          unarmedPicker(uStrike, uBase)));
      }
      /* The empty state, and it needs two branches now that it can actually appear
         for someone holding something. Telling a player who just pressed EQUIP on
         their Knuckles to go press EQUIP is worse than the wrong count it replaced:
         the Inventory toast literally said "Knuckles equipped; it's live in the
         Attacks list". So when the only things in hand are augments, say what they
         are and point at the row they improved. */
      if (!realWeaponNames.length) {
        kids.push(el("p.help", { style: { margin: "4px 0 6px" }, text: augmentNames.length
          ? augmentNames.join(" and ") + (augmentNames.length > 1 ? " augment" : " augments")
            + " your unarmed strike rather than being a weapon in their own right, so there is no separate row: the strike above already counts them. Hit ⚔ EQUIP on an actual weapon in Inventory → Stash to list one here."
          : "No weapons equipped; hit ⚔ EQUIP on a weapon in Inventory → Stash to list it here." }));
      }
      if (ch.class === "codebreaker") {
        var cipherBonus = (d.grid && d.grid.cipherAttackBonus) != null ? d.grid.cipherAttackBonus : d.attributes.TEC.mod;
        kids.push(attackRow("Cipher Attack", eng.fmtMod(cipherBonus), "d20 + Tech Modifier + Systems Proficiency Bonus vs Node · Quick Hacks under fire", "var(--accent)", null,
          function () { openRollTray(simpleAttackCtx("Cipher Attack", "CIPHER · VS NODE DEFENSE", [{ label: "Cipher Attack", value: cipherBonus }], {})); }));
      }
      if (d.flow) kids.push(attackRow("Flow Attack", eng.fmtMod(d.flow.attackBonus), "d20 + " + d.flow.attributeName + " + Caliber · Invocation Save DC " + d.flow.dc, "var(--flow)", null,
        function () { openRollTray(simpleAttackCtx("Flow Attack", "FLOW · SAVE DC " + d.flow.dc, [{ label: d.flow.attributeName + " + Caliber", value: d.flow.attackBonus }], {})); }));
      if (ch.class === "scoundrel") {
        var csdie = d.caliber + "d6";
        kids.push(el("div", { style: { padding: "8px 4px", borderBottom: "1px solid rgba(35,48,68,.5)" } }, [
          el("div.row", { style: { gap: "8px", alignItems: "center", flexWrap: "wrap" } }, [
            el("span", { style: { fontWeight: 600, fontSize: "14px" }, text: "Cheap Shot" }),
            el("span.chip", { style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" }, text: "SCOUNDREL" }),
            el("span", { style: { fontSize: "10px", color: "var(--text3)", flex: "1 1 auto" }, text: "Bonus Damage · Once per Turn" })
          ]),
          el("div.row.wrap", { style: { gap: "14px", alignItems: "center", marginTop: "6px" } }, [
            el("div", { title: "Extra damage on qualifying attack; scales with Caliber", style: { textAlign: "center", flex: "0 0 auto", minWidth: "44px" } }, [
              el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text2)" }, text: "BONUS DMG" }),
              el("span.mono", { style: { fontSize: "15px", color: "var(--accent)" }, text: csdie })
            ]),
            el("span.help", { style: { margin: 0, flex: 2 }, text: "Requires Edge on the roll, a flanking conscious ally, or Moxie spent this round. Sidearm, Simple, or Light Melee only." })
          ])
        ]));
      }
      return kids;
    }

    /* ---- LOADOUT tab: a filtered view of Inventory (what's on you for the scene) ---- */
    function loadoutKids() {
      var kids = [];
      // Load console: the Loadout tier is DERIVED from carried Load (never picked)
      var enc = d.encumbrance || {};
      var EE = R.encumbrance || {};
      var bands = enc.bands || {};
      var stateDef = (EE.states || {})[enc.state] || {};
      var stateColor = enc.state === "overloaded" ? "var(--danger)" : enc.state === "encumbered" ? "var(--warn)" : "var(--success)";
      var tierDef = (EE.loadouts || []).find(function (t) { return t.key === enc.tier; });
      var tierColor = enc.tier === "light" ? "var(--success)" : enc.tier === "standard" ? "var(--accent)" : enc.tier === "heavy" ? "var(--warn)" : "var(--danger)";
      var thTip = "Encumbrance Threshold = 6 + Body modifier (min 3) = " + enc.base
        + ((enc.steps || []).map(function (s) { return "\n+" + s.value + "  " + s.label; }).join(""))
        + "\nThreshold " + enc.threshold + " → Light ≤ " + bands.light + " · Standard ≤ " + bands.standard + " · Heavy ≤ " + bands.heavy + " · beyond = Overloaded"
        + "\n\nLoad guide:\n" + ((EE.loadTable || []).map(function (r) { return r.load + "  " + r.items; }).join("\n"))
        + "\n\n" + (EE.notes || "");
      var loadOpen = !!_open["load-console"];
      kids.push(el("div", { style: { padding: "9px 11px", border: "1px solid " + (enc.state === "unencumbered" ? "var(--border)" : stateColor), borderRadius: "4px", background: "rgba(0,0,0,.15)", margin: "2px 0 10px" } }, [
        el("div.row.wrap", { style: { gap: "10px", alignItems: "center", cursor: "pointer" },
          title: loadOpen ? "Tap to collapse" : "Tap for the band scale and hauls",
          onclick: function () { _open["load-console"] = !loadOpen; EN.app.render(); } }, [
          el("span.collapse-caret", { text: loadOpen ? "▾" : "▸" }),
          el("span.mono", { title: thTip, style: { fontSize: "18px", color: "var(--text)" },
            html: "LOAD " + enc.current + " <span style='font-size:12px;color:var(--text3)'>/ " + enc.budget + "</span>" }),
          el("span.chip", { title: tierDef ? tierDef.effect : "Past any plausible loadout; this belongs on a cart, dolly, vehicle, or exoframe.",
            style: { fontSize: "9px", color: tierColor, borderColor: tierColor } }, (tierDef ? tierDef.name : enc.tier).toUpperCase() + " LOADOUT"),
          el("span.chip", { title: stateDef.effect || "", style: { fontSize: "9px", color: stateColor, borderColor: stateColor } }, (stateDef.name || enc.state || "").toUpperCase()),
          enc.speedDelta ? el("span.mono", { style: { fontSize: "11px", color: stateColor }, text: "SPD " + enc.speedDelta }) : null,
          enc.haul !== "none" ? el("span.chip", { title: "Active Haul; expand to change it", style: { fontSize: "9px", color: "var(--warn)", borderColor: "var(--warn)" } }, "HAULING") : null
        ]),
        // the Loadout you declared for the run; it sets the Load Budget
        loadOpen ? el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "7px" } },
          [el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em", minWidth: "58px" }, text: "LOADOUT" })].concat(
            (EE.loadouts || []).map(function (t) {
              var on = enc.tier === t.key;
              var cap = enc.threshold + t.delta;
              return el("span.chip", { title: t.effect + " (click to declare)",
                style: { fontSize: "9px", cursor: "pointer", color: on ? tierColor : "var(--text4)", borderColor: on ? tierColor : "var(--border)" },
                onclick: function () { store.update(function (c) { c.loadout = t.key; }); } },
                (on ? "● " : "") + t.name.toUpperCase() + " ≤ " + cap);
            }),
            [el("span.help", { style: { margin: 0, fontSize: "10px", color: "var(--text4)" }, text: "declared at the start of the job" })])) : null,
        loadOpen ? el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, [
          el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em", minWidth: "58px" }, text: "HAUL" }),
          el("select", { style: { fontSize: "11px", width: "auto" }, title: "A Haul (body, crate, machine) does not count as carried Load; it sets your state directly.",
            onchange: function () { var v = this.value; store.update(function (c) { c.haul = v; }); } },
            (EE.hauls || []).map(function (h) { return el("option", { value: h.key, selected: enc.haul === h.key, text: h.name, title: h.hint }); }))
        ]) : null,
        loadOpen && enc.tier === "light" && enc.state === "unencumbered" ? el("p.help", { style: { margin: "7px 0 0", fontSize: "10.5px", color: "var(--success)" }, text: (tierDef && tierDef.effect) || "" }) : null,
        loadOpen && enc.state !== "unencumbered" ? el("p.help", { style: { margin: "7px 0 0", fontSize: "10.5px", color: stateColor }, text: stateDef.effect || "" }) : null
      ]));
      var owned = (ch.equipment || []).filter(function (e) { return e.qty > 0; });
      var inScene = owned.filter(function (e) { return isEquippedAny(ch, entryKey(e)) || carryStatus(ch, entryKey(e)) !== "stashed"; });
      var racks = eng.rackState(ch);
      var slotConflicts = eng.slotConflicts ? eng.slotConflicts(ch) : {};
      var nCarried = 0, nWorn = 0, nEquipped = 0, nRacked = 0, nHeavy = 0;
      inScene.forEach(function (e) {
        var it = invItem(e.name), cs = carryStatus(ch, entryKey(e));
        // equipped wins; an equipped item is never also tallied as carried/worn
        if (isEquippedAny(ch, entryKey(e))) nEquipped++;
        else if (cs === "carried") nCarried++;
        else if (cs === "worn") nWorn++;
        else if (cs === "racked") nRacked++;
        if (it && isHeavy(it)) nHeavy++;
      });
      // add-to-loadout pop-out lives at the TOP so the whole loadout can be
      // managed from here without scrolling past every section
      var stashOnly = owned.filter(function (e) { return !isEquippedAny(ch, entryKey(e)) && carryStatus(ch, entryKey(e)) === "stashed"; });
      kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", margin: "2px 0 8px" } }, [
        el("div.pop-anchor", { style: { position: "relative" } }, [
          el("button.btn.sm" + (stashOnly.length ? ".primary" : ""), { disabled: !stashOnly.length,
            title: stashOnly.length ? "Add stashed gear to your loadout" : "Everything you own is already in your loadout",
            onclick: function () { var was = _pops.addgear; closePops(); _pops.addgear = !was; EN.app.render(); } }, "＋ ADD TO LOADOUT"),
          _pops.addgear ? el("div", { style: { position: "absolute", left: 0, top: "calc(100% + 6px)", zIndex: 30, width: "280px", maxHeight: "300px", overflowY: "auto",
            background: "var(--bg1)", border: "1px solid var(--accent)", borderRadius: "6px", padding: "8px", boxShadow: "0 8px 24px rgba(0,0,0,.5)" } },
            [el("p.help", { style: { margin: "0 0 6px", fontSize: "10.5px" }, text: "Tap an item to add it as Carried; fine-tune its status on its row after." })]
            .concat(stashOnly.map(function (e) {
              return el("button.btn.sm", { style: { display: "block", width: "100%", textAlign: "left", marginBottom: "3px" },
                onclick: function () { setCarry(entryKey(e), "carried"); } },
                e.name + (e.qty > 1 ? " ×" + e.qty : ""));
            }))) : null
        ]),
        el("p.help", { style: { margin: 0, flex: "1 1 auto" }, text: "What you brought to the scene. "
          + nEquipped + " equipped · " + nCarried + " carried" + (nWorn ? " · " + nWorn + " worn" : "") + (nRacked ? " · " + nRacked + " racked" : "") + (nHeavy ? " · " + nHeavy + " heavy" : "") + "." })
      ]));
      if (!inScene.length) {
        kids.push(el("p.help", { style: { margin: "0 0 6px", color: "var(--text3)" }, text: "Nothing in your loadout yet. Equip gear in Inventory, or use ＋ ADD TO LOADOUT above." }));
      } else {
        // a validly racked item renders NESTED under its Carry Gear, not in the flat lists
        function isNested(e) { return !!racks.byItem[entryKey(e)]; }
        var carried = inScene.filter(function (e) { return !isEquippedAny(ch, entryKey(e)) && carryStatus(ch, entryKey(e)) === "carried" && !isNested(e); });
        var worn = inScene.filter(function (e) { return !isEquippedAny(ch, entryKey(e)) && carryStatus(ch, entryKey(e)) === "worn" && !isNested(e); });
        var equipped = inScene.filter(function (e) { return isEquippedAny(ch, entryKey(e)) && !isNested(e); });
        // racked items whose Carry Gear is missing or over capacity: still on-person, no break
        var strays = inScene.filter(function (e) { return !isEquippedAny(ch, entryKey(e)) && carryStatus(ch, entryKey(e)) === "racked" && !isNested(e); });
        function pushRow(e) {
          kids.push(loadoutRow(e, false, slotConflicts));
          (racks.byGear[entryKey(e)] || []).forEach(function (child) { kids.push(loadoutRow(child, true, slotConflicts)); });
        }
        function section(label, items) {
          if (!items.length) return;
          var id = "loadout-sec:" + label;
          var open = _open[id] !== false;   // expanded by default; stays collapsed once tapped closed
          kids.push(el("div.section-title", { style: { margin: "8px 0 4px", cursor: "pointer" },
            title: open ? "Collapse " + label : "Expand " + label,
            onclick: function () { _open[id] = !open; EN.app.render(); } }, [
            el("span.collapse-caret", { text: open ? "▾" : "▸" }),
            document.createTextNode(" " + label + " "),
            el("span.mono", { style: { fontSize: "10px", color: "var(--text3)" }, text: "(" + items.length + ")" }),
            el("span.line")
          ]));
          if (open) items.forEach(pushRow);
        }
        section("Carried", carried);
        section("Worn", worn);
        section("On-Person", equipped);
        section("Racked Adrift", strays);
        if (strays.length) kids.push(el("p.help", { style: { margin: "2px 0 6px", color: "var(--warn)", fontSize: "10.5px" }, text: "These are marked Racked but their Carry Gear is not on-person, does not fit them, or is over capacity; they carry full Load until re-racked." }));
        var conflictSlots = Object.keys(slotConflicts);
        if (conflictSlots.length) {
          kids.push(el("p.help", { style: { margin: "2px 0 6px", color: "var(--warn)", fontSize: "10.5px" },
            text: "Body Slot conflict: " + conflictSlots.map(function (s) { return s + " " + slotConflicts[s].active.length + "/" + slotConflicts[s].capacity; }).join(", ")
              + ". Click ⚠ SLOT CONFLICT on an item below to bench it and free the slot." }));
        }
      }
      return kids;
    }
    function loadoutRow(e, nested, slotConflicts) {
      var it = invItem(e.name), key = entryKey(e);
      var equipped = isEquippedAny(ch, key), eqLabel = equipLabel(ch, key);
      var cs = carryStatus(ch, key);
      var racks = eng.rackState(ch);
      var rackedGear = racks.byItem[key] || null;
      var isGear = eng.isCarryGear(it);
      // slot-bearing gear that isn't armor/shield/focus (those equip through
      // their own dedicated field) gets a Wear toggle; only "worn" competes
      // for its Body Slot, so a spare merely Carried never does.
      var mySlots = it && eng.itemSlots ? eng.itemSlots(it) : [];
      var wearable = mySlots.length > 0 && it && it.kind !== "armor" && it.kind !== "shield" && it.kind !== "focus";
      var chips = [];
      if (eqLabel) chips.push(el("span.chip", { style: { fontSize: "9px", color: "var(--accent)", borderColor: "var(--accent)" }, text: eqLabel.toUpperCase() }));
      // a worn Trauma Rig takes the same break the engine gives it (2 carried, 1 worn)
      var wornArmor = ch.equippedArmor === key || (ch.rig && ch.rig.key === key);
      var baseLd = eng.itemLoad ? eng.itemLoad(e.name, { worn: wornArmor }) : 0;
      // one rack slot holds one item: a racked entry's TOTAL drops by 1, min 0
      var ldTotal = Math.max(0, baseLd * e.qty - (rackedGear ? 1 : 0));
      if (isGear) {
        var gearIt = invItem(e.name);
        var held = (racks.byGear[key] || []).length;
        var gearWorn = cs === "worn";
        chips.push(el("span.chip", { title: (gearWorn ? "" : "Wear it to use its racks. ") + ((gearIt && gearIt.effect) || "Carry Gear"), style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" }, text: "⧉ RACKS " + held + "/" + eng.rackLimit(gearIt) + (gearWorn ? "" : " (not worn)") }));
        chips.push(el("span.chip", { title: "Carry Gear is Load 0 and never counts against your own Load Budget", style: { fontSize: "9px", color: "var(--text3)", borderColor: "var(--border2)" }, text: "⚖ 0" }));
      } else if (ldTotal > 0 || rackedGear) {
        chips.push(el("span.chip", { title: "Load " + ldTotal + (rackedGear ? " (reduced by 1 while Racked in the " + rackedGear.name + ")" : "") + (wornArmor ? " (reduced by 2 while Worn, min 0)" : "") + (e.qty > 1 && !rackedGear ? " (" + baseLd + " each)" : "") + "; spends your Load Budget while on-person",
          style: { fontSize: "9px", color: (rackedGear || wornArmor) ? "var(--success)" : "var(--text2)", borderColor: (rackedGear || wornArmor) ? "var(--success)" : "var(--border2)" },
          text: "⚖ " + ldTotal + (rackedGear ? " ⧉" : "") }));
      }
      if (it) {
        if (isHeavy(it)) chips.push(el("span.chip", { title: "Heavy Item; bulky, slot-limited, or cumbersome", style: { fontSize: "9px", color: "var(--ember)", borderColor: "var(--ember)" }, text: "HEAVY" }));
        if (isRestricted(it)) chips.push(el("span.chip", { title: "Legality: " + it.legality, style: { fontSize: "9px", color: it.legality === "Contraband" ? "var(--danger)" : "var(--ember)", borderColor: it.legality === "Contraband" ? "var(--danger)" : "var(--ember)" }, text: it.legality.toUpperCase() }));
        if (isLimitedUse(it)) chips.push(el("span.chip", { title: "Counted / limited-use; track every unit", style: { fontSize: "9px", color: "var(--gold)", borderColor: "var(--gold)" }, text: "LIMITED" }));
        if (mySlots.length) {
          var slotLabel = Array.isArray(it.slot) ? it.slot.join(" + ") : it.slot;
          chips.push(el("span.chip", { title: "Body slot: " + slotLabel, style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" }, text: "◧ " + slotLabel }));
          // only a genuinely-worn item ever enters the active/inert tally, so
          // the bench toggle only ever matters (and only ever shows) here.
          if (cs === "worn") {
            var isInert = !!(ch.slotInert && ch.slotInert[key]);
            var conflicted = !isInert && mySlots.some(function (s) { return slotConflicts && slotConflicts[s]; });
            if (isInert) {
              chips.push(el("span.chip", { title: "Benched: not counted toward, or benefiting from, its Body Slot. Click to reactivate.",
                style: { fontSize: "9px", color: "var(--text3)", borderColor: "var(--border2)", cursor: "pointer" },
                onclick: function () { toggleSlotInert(key); } }, "INERT"));
            } else if (conflicted) {
              chips.push(el("span.chip", { title: "This Body Slot is over capacity. Click to bench this item and free it up for another.",
                style: { fontSize: "9px", color: "var(--warn)", borderColor: "var(--warn)", cursor: "pointer" },
                onclick: function () { toggleSlotInert(key); } }, "⚠ SLOT CONFLICT"));
            }
          }
        }
      }
      var wearBtn = wearable ? el("button.btn.sm", { title: cs === "worn" ? "Take it off; it stays Carried and keeps costing Load, but frees its Body Slot" : "Wear it; it competes for its Body Slot",
        style: { fontSize: "10px" }, onclick: function () { toggleWorn(key); } }, cs === "worn" ? "✓ WORN" : "WEAR") : null;
      // status control: equipped gear keeps its static tag (managed in Inventory)
      // plus a rack selector; everything else folds Racked targets into the
      // carry select ("racked|<gearKey>" values)
      var targets = it && !isGear ? eng.rackTargets(ch, e) : [];
      var statusCtrl;
      if (equipped) {
        // racking keeps carry status and the rack target in lockstep so an
        // unequipped item stays visibly racked (or visibly not) afterward;
        // a stale assignment renders as "adrift" so it can always be cleared
        var staleKey = !rackedGear ? (ch.racked || {})[key] : null;
        statusCtrl = el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
          el("span.mono", { title: "Equipped gear is managed in Inventory", style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".06em" }, text: "ON-PERSON" }),
          (targets.length || rackedGear || staleKey) ? el("select", { title: "Rack this in worn Carry Gear (Load reduced by 1, and a Sheath/Holster draws it free on your first attack)",
            style: { fontSize: "11px", width: "auto" },
            onchange: function () { var v = this.value; store.update(function (c) {
              c.racked = c.racked || {}; c.carry = c.carry || {};
              if (v) { c.racked[key] = v; c.carry[key] = "racked"; }
              else { delete c.racked[key]; if (c.carry[key] === "racked") c.carry[key] = "carried"; }
            }); } },
            [el("option", { value: "", selected: !rackedGear && !staleKey, text: "not racked" })].concat(targets.map(function (g) {
              var gk = entryKey(g);
              return el("option", { value: gk, selected: !!(rackedGear && entryKey(rackedGear) === gk) || staleKey === gk, text: "⧉ " + g.name });
            })).concat(staleKey && !targets.some(function (g) { return entryKey(g) === staleKey; })
              ? [el("option", { value: staleKey, selected: true, text: "⧉ racked (adrift)" })] : [])) : null
        ]);
      } else if (cs === "worn") {
        // worn is exclusive with Carried/Racked (one carry status per item), so
        // taking it off (falling back to Carried) is the only control needed here
        statusCtrl = el("div.row", { style: { gap: "6px", alignItems: "center" } }, [wearBtn]);
      } else {
        var opts = [["stashed", "Stashed"], ["carried", "Carried"]].map(function (o) {
          return el("option", { value: o[0], selected: cs === o[0] && !(cs === "racked"), text: o[1] });
        }).concat(targets.map(function (g) {
          var gk = entryKey(g);
          var on = cs === "racked" && (ch.racked || {})[key] === gk;
          return el("option", { value: "racked|" + gk, selected: on, text: "⧉ Racked: " + g.name });
        }));
        // keep a stale racked target selectable so the row shows the truth
        if (cs === "racked" && !rackedGear) opts.push(el("option", { value: "racked|" + ((ch.racked || {})[key] || ""), selected: true, text: "⧉ Racked (adrift)" }));
        var dropdown = el("select", { title: "Carry status; Racked stows it in worn Carry Gear for 1 less Load", style: { fontSize: "11px", width: "auto" },
          onchange: function () { setCarry(key, this.value); } }, opts);
        statusCtrl = el("div.row", { style: { gap: "6px", alignItems: "center" } }, [wearBtn, dropdown]);
      }
      return el("div.feature", { style: { borderLeftColor: equipped ? "var(--accent)" : cs === "worn" ? "var(--gold)" : rackedGear ? "var(--flow)" : "var(--border2)", marginLeft: nested ? "26px" : "0" } }, [
        el("div.row", { style: { gap: "8px", alignItems: "center", flexWrap: "wrap" } }, [
          nested ? el("span.mono", { title: "Racked inside the item above", style: { fontSize: "11px", color: "var(--flow)" }, text: "⧉" }) : null,
          el("span", { style: { fontWeight: 600, fontSize: "13px" }, text: e.name }),
          e.qty > 1 ? el("span.mono", { style: { fontSize: "11px", color: "var(--text3)" }, text: "×" + e.qty }) : null,
          el("span", { style: { flex: "1 1 auto" } }),
          statusCtrl
        ]),
        chips.length ? el("div.row.wrap", { style: { gap: "5px", marginTop: "6px" } }, chips) : null
      ]);
    }

    /* ---- NOTES tab: freeform, shared with the #PRINT Identity notes ---- */
    function notesKids() {
      return [
        el("p.help", { style: { margin: "2px 0 8px" }, text: "Freeform space tied to this Freelancer. Shared with the Notes field on the #PRINT Identity step." }),
        el("textarea", {
          value: (ch.identity && ch.identity.notes) || "",
          placeholder: "Origin details, Facets, Core Sparks, Tethers, Fault Lines, contacts, debts, critical injuries, reputation, faction standing, mission leads, custom rulings, unresolved complications…",
          oninput: function () { var v = this.value; store.update(function (c) { c.identity = c.identity || {}; c.identity.notes = v; }, { silent: true }); },
          style: { width: "100%", minHeight: "320px", fontSize: "13px", lineHeight: "1.6", resize: "vertical" }
        })
      ];
    }

    /* ---- the five-tab nav + active tab body ---- */
    function loadoutCount() {
      return (ch.equipment || []).filter(function (e) { return e.qty > 0 && (isEquippedAny(ch, entryKey(e)) || carryStatus(ch, entryKey(e)) !== "stashed"); }).length;
    }
    var TAB_DEFS = [
      { key: "abilities", label: "Abilities", count: activeFeats.length },
      { key: "features", label: "Features", count: passiveFeats.length + (ch.customFeatures || []).length },
      // the badge counts WEAPONS, so it counts the rows this tab will actually draw
      // for one. It used to count everything equipped, which read WEAPONS (2) over an
      // empty list for a character holding Knuckles and Shock Gloves.
      { key: "weapons", label: "Weapons", count: realWeaponRows.length },
      { key: "loadout", label: "Loadout", count: loadoutCount() },
      { key: "notes", label: "Notes", count: null }
    ];
    var navRow = el("div.row.wrap", { style: { gap: "6px", marginBottom: "10px" } }, TAB_DEFS.map(function (t) {
      return el("button.btn.sm" + (_panelTab === t.key ? ".primary" : ""), { onclick: function () { _panelTab = t.key; EN.app.render(); } },
        t.label + (t.count != null ? " (" + t.count + ")" : ""));
    }));
    var bodyKids = _panelTab === "features" ? featuresKids()
      : _panelTab === "weapons" ? weaponsKids()
      : _panelTab === "loadout" ? loadoutKids()
      : _panelTab === "notes" ? notesKids()
      : abilitiesKids();
    // pin the nav row; everything below scrolls together as one well that fills the panel
    sectionEls.actions = EN.ui.panel("Actions", _panelTab.toUpperCase(),
      [navRow, el("div.actions-frame", null, [el("div.actions-scroll", null, bodyKids)])],
      { corners: true });
    sectionEls.actions.classList.add("fill-col");
    if (sectionEls.actions.bodyEl) sectionEls.actions.bodyEl.classList.add("fill-body");

    /* ---- DEFEND, its own always-visible section (kept out of the tabs per the play spec).
       Active Defenses are Impulse maneuvers; each row shows the live value for THIS
       character and only lists defenses the character can actually use right now. ---- */
    function defendPanel() {
      var kids = [];
      var resDie = d.resilienceDie ? "d" + d.resilienceDie : "Resilience Die";
      var acro = d.skills.find(function (s) { return s.name === "Acrobatics"; });
      var attuned = !!d.flow, flowMod = d.flow ? eng.fmtMod(d.flow.attack) : null;
      var focusDie = dg.wardDie || null, focusName = dg.focus ? dg.focus.name : (dg.armor && dg.armor.wardDie ? dg.armor.name : null);
      /* A real melee weapon die for the Parry row. Unarmed AUGMENTS (Knuckles,
         Shock Gloves) are deliberately skipped: their catalog `damage` is what they
         ADD to a punch, not a die you roll instead of one, so reading it here made
         strapping them on lower your Parry below the bare fist they improve. With
         no real weapon the row falls through to the resolved unarmed strike, which
         already has the augment folded into it. */
      function realMeleeWeapon(n) {
        var w = findWeapon(n);
        if (!w || eng.isUnarmedAugmentName(w.name)) return null;
        return (w.group === "Simple" || w.group === "Martial") ? w : null;
      }
      // Parry also accepts bare hands, so the unarmed strike's own damage is a
      // parry source: the resolved die if anything granted one, else the flat 1.
      var uParryDie = d.unarmed.die, uParryFlat = d.unarmed.flat;
      /* THE PARRY SOURCES, resolved once, best first. Everything that renders or
         rolls a Parry reads this list; there is no second place that decides.

         It used to be a precedence CHAIN, weapon then shield then fists, first match
         wins, written out twice (the row summary and the tray). Three things fell out
         of that, and all three reproduced:
           a 1d4 Scrap Shield beat a resolved 1d8 unarmed strike, so strapping on a
             shield HALVED your Parry;
           a Dagger listed before a Greatsword beat 2d6 with 1d4, purely on list order;
           bare hands with no die read "Roll 1", which is not a die and not rollable.

         The book does not describe a chain. Parry's Effect is "Roll your equipped
         weapon's base damage die ... or your unarmed strike damage if your hands are
         what you brought", and its Tactical Note is explicit that "if you are
         dual-wielding, you must choose which weapon you parry with". So this offers
         the CHOICE, ordered by expected value so the default is the best one and the
         common case is still one tap.

         A SHIELD IS NOT A SOURCE HERE, and that is the correction that matters most.
         The app used to parry with the shield's `blockDie`, which is not a damage die:
         it belongs to Block, whose Effect is "Roll your Shield's Block die (if you
         carry one) and add your armor's flat Block Bonus". Parry rolls a DAMAGE die,
         and no shield in the catalog has one. Verified against both live manuscripts
         on 2026-08-11: Part 3's Physical Shields table is Name / Price / Defense /
         Block / Traits with no damage column, there is no shield bash anywhere in
         either book, and Parry never names a die for a shield.
         A shield still SATISFIES Parry's Requirement ("a Simple Weapon, Martial
         Weapon, Signature Weapon, or physical Shield equipped, or be fighting
         unarmed"), so carrying one does not stop you parrying. It just contributes no
         die, and you roll a damage die you actually have: a weapon's, or your fists'. */
      function parryValue(s) { return s.sides ? s.n * (s.sides + 1) / 2 : (s.flat || 0); }
      function parrySources() {
        var out = [];
        equippedNames.forEach(function (n) {
          var w = realMeleeWeapon(n);
          if (!w) return;
          var m = (w.damage || "").match(/(\d*)d(\d+)/);
          if (!m) return;
          out.push({ key: "w:" + n, label: w.name, kind: "weapon",
                     n: parseInt(m[1] || "1", 10), sides: parseInt(m[2], 10) });
        });
        var um = uParryDie ? /(\d*)d(\d+)/.exec(uParryDie) : null;
        if (um) out.push({ key: "unarmed", label: "your unarmed strike", kind: "unarmed",
                           n: parseInt(um[1] || "1", 10), sides: parseInt(um[2], 10) });
        else out.push({ key: "unarmed", label: "your unarmed strike", kind: "unarmed", flat: uParryFlat });
        out.sort(function (a, b) { return parryValue(b) - parryValue(a); });
        return out;
      }
      function parryText(s) {
        if (!s) return "nothing to parry with";
        return s.sides ? "Roll " + s.n + "d" + s.sides + " (" + s.label + "), subtract from incoming damage"
                       : "Bare hands with no die behind them: subtract " + (s.flat || 0) + " from incoming damage";
      }
      var pSources = parrySources(), pBest = pSources[0];
      // Block works with a shield, a flat Block Bonus, or the Plated trait; a shield's
      // die stacks on top. Gear whose lease is in arrears grants none of this.
      var liveShield = (dg.shield && !dg.shieldLapsed && dg.shieldAlive) ? dg.shield : null;
      var plated = !!(dg.armor && !dg.armorLapsed && (dg.armor.traits || []).indexOf("Plated") !== -1);
      var blockBonus = dg.blockBonus || 0;
      var platedHalf = plated ? Math.floor((dg.armorDR || 0) / 2) : 0;
      var canBlock = !!liveShield || blockBonus > 0 || plated;
      var blockAdds = [];
      if (blockBonus) blockAdds.push("+" + blockBonus + " Block Bonus");
      if (platedHalf) blockAdds.push("+" + platedHalf + " half-DR (Plated)");
      if (liveShield && dg.shieldBlockDie) blockAdds.push("+" + dg.shieldBlockDie + " (" + liveShield.name + ")");
      // Shield Durability: a Blocked hit whose RAW damage meets the Wear Threshold
      // marks a box, as does any Blocked critical. Offered as a one-tap control on
      // the Block row, since that is the only moment it can happen.
      // The one writer answers with what it did, and the toast reads THAT. It used to
      // re-derive "boxes left" out here by adding the delta to ch.shieldWear again,
      // after store.update had already added it to the same object, so every click
      // counted twice: a 3-box Riot Shield announced its destruction at 2 boxes spent
      // while still alive and still granting its Block die, and a 2-box Scrap Shield
      // announced it on the first click. Nothing outside the engine derives this now.
      function markShieldWear(delta) {
        if (!dg.shield || !dg.shieldKey) return;
        var res = null;
        store.update(function (c) { res = eng.applyShieldWear(c, dg.shieldKey, delta); });
        if (!res || !res.changed) return;
        if (delta > 0 && res.destroyed) toast(res.emitter ? res.name + " overloaded and went dark." : res.name + " is destroyed; the wreck is salvage.");
      }
      /* Armor DR is mutable, and this is the moment it moves: Demolition Engine
         attacking worn armor, a Blackware Hand Razors crit, a caustic environment.
         Damage only; the two repair lanes (shop and bench) are priced work on the
         Impact Table, and the one-point UNDO here is for a misclick, not a lane.
         A clean repair's quality edge is spent first, absorbing the point for free. */
      function markArmorDR(delta) {
        var st = dg.armorState;
        if (!st || !st.key || !st.base) return;
        var res = null;
        store.update(function (c) { res = eng.applyArmorDamage(c, st.key, delta); });
        if (!res) return;
        if (res.absorbed) { toast(st.name + ": the freshly seated plate absorbs the hit. No DR lost."); return; }
        if (delta > 0 && res.breached) toast(st.name + " is breached at 0 DR; rebuilding it is a full Project on the Impact Table.");
      }
      // Per-defense roll specs for the Defensive Impulse tray. Dice come from live
      // gear, so a Ward reads the attuned Focus and a Parry reads the equipped melee
      // weapon rather than a fixed die.
      function parseDie(str) { var m = /(\d*)d(\d+)/.exec(String(str || "")); return m ? { n: parseInt(m[1] || "1", 10), sides: parseInt(m[2], 10), label: (m[1] || "1") + "d" + m[2] } : null; }
      // (firstMeleeDie lived here and was the first half of Parry's precedence chain:
      //  "the first equipped melee weapon", which handed a Dagger the parry over a
      //  Greatsword on list order alone. parrySources() replaced it and nothing else
      //  called it, so it is gone rather than left for someone to wire back in.)
      function defSpec(name) {
        var base = { name: name, baseDefense: d.defense, dice: [], flat: [] };
        if (name === "Block") {
          var sd = liveShield ? parseDie(dg.shieldBlockDie) : null;
          if (sd) { sd.label = liveShield.name; base.dice.push(sd); }
          if (blockBonus) base.flat.push({ label: "Block Bonus", value: blockBonus });
          if (platedHalf) base.flat.push({ label: "Plated half-DR", value: platedHalf });
          base.flat.push({ label: "Armor DR", value: d.armorDR || 0 });
          base.note = "Roll the shield die and add your flat bonuses and Armor DR against this hit." + wearNote;
          return base;
        }
        if (name === "Dodge") {
          // take the same Acrobatics total the row summary advertises, so the
          // tray and the row cannot drift apart
          base.mode = "defense";
          base.bonus = acro ? acro.total : d.attributes.AGI.mod;
          base.note = "Raise your Defense against this hit. On a miss you may shift 1 space.";
          return base;
        }
        if (name === "Parry") {
          /* One list, best first, and the player picks. `applySource` is what the
             tray's chips call, so switching implement re-reads this same resolver
             rather than deriving a second answer somewhere else. */
          base.sources = pSources;
          base.applySource = function (key) {
            var s = pSources.find(function (x) { return x.key === key; }) || pBest;
            base.sourceKey = s.key;
            base.dice = []; base.flat = [];
            if (s.sides) base.dice.push({ n: s.n, sides: s.sides, label: s.label });
            else base.flat.push({ label: s.label, value: s.flat || 0 });
            base.note = (s.sides
              ? "Roll " + s.n + "d" + s.sides + " (" + s.label + ") and subtract it from the incoming damage."
              : "Bare hands with no die behind them: subtract " + (s.flat || 0) + " from the incoming damage.")
              + " Melee attacks only." + (pSources.length > 1 ? " You choose what you parry with." : "");
            return base;
          };
          return base.applySource(pBest && pBest.key);
        }
        if (name === "Resurge") {
          base.dice.push({ n: 1, sides: d.resilienceDie || 6, label: "d" + (d.resilienceDie || 6) });
          base.onZero = "Reduced to 0: the Flow attack rebounds for +3 Resonant damage.";
          base.note = "Against a Flow attack. Roll your Resilience Die and subtract it; if the damage drops to 0, it rebounds.";
          return base;
        }
        if (name === "Siphon") {
          base.dice.push({ n: 1, sides: d.resilienceDie || 6, label: "d" + (d.resilienceDie || 6) });
          base.onRoll = function (t) { return "Restore " + t + " Vigor."; };
          base.note = "Against elemental or Flow damage. Roll your Resilience Die, subtract it, and restore that much Vigor.";
          return base;
        }
        if (name === "Ward") {
          base.dice.push({ n: 1, sides: d.resilienceDie || 6, label: "d" + (d.resilienceDie || 6) });
          var wd = parseDie(dg.wardDie);
          if (wd) { wd.label = (dg.focus && dg.focus.name) || "Ward"; base.dice.push(wd); }
          base.note = "Roll d6" + (wd ? " plus your Focus die" : "") + " and subtract the total from the incoming damage.";
          return base;
        }
        base.note = "";
        return base;
      }
      var wearNote = dg.shield && dg.shieldWearThreshold
        ? " Wear " + dg.shieldWearThreshold + ": a Blocked hit of " + dg.shieldWearThreshold + "+ raw damage, or any Blocked critical, marks a box (" + dg.shieldBoxesLeft + "/" + dg.shieldBoxesMax + " left)."
        : "";
      var DEF_LIVE = {
        Block:   { avail: canBlock, req: "a shield, a Block Bonus, or Plated armor",
                   summary: (blockAdds.length
                     ? "Adds " + blockAdds.join(", ") + " to your Armor DR (" + (d.armorDR || 0) + ") against this hit" + ((liveShield && dg.shieldBlockDie) ? "" : ", no roll")
                     : "Reinforce your Armor DR against this hit") + wearNote,
                   extra: (dg.shield || (dg.armor && dg.armorBaseDR)) ? el("div", null, [
                     dg.shield ? el("div.row.wrap", { style: { gap: "6px", marginTop: "6px", alignItems: "center" } }, [
                       el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em" }, text: "DURABILITY" }),
                       el("span.mono", { style: { fontSize: "12px", color: dg.shieldAlive ? "var(--text2)" : "var(--danger)" },
                         text: "□".repeat(dg.shieldBoxesLeft) + "■".repeat(dg.shieldSpent) }),
                       el("button.btn.sm", { disabled: !dg.shieldAlive, title: "Mark 1 Durability box (a Blocked hit at or above the Wear Threshold, or a Blocked critical)",
                         style: { color: "var(--danger)", borderColor: "var(--danger)" }, onclick: function () { markShieldWear(1); } }, "− WEAR"),
                       dg.shieldSpent > 0 ? el("button.btn.sm", { title: "Restore 1 box (Repair Project)", onclick: function () { markShieldWear(-1); } }, "+ REPAIR") : null
                     ]) : null,
                     // Armor Integrity, the same track one mechanic over: a suit loses DR
                     // and is repaired back toward its printed value, never past it.
                     (dg.armor && dg.armorBaseDR) ? el("div.row.wrap", { style: { gap: "6px", marginTop: "6px", alignItems: "center" } }, [
                       el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em" }, text: "PLATING" }),
                       el("span.mono", { style: { fontSize: "12px", color: dg.armorBreached ? "var(--danger)" : (dg.armorDRLost ? "var(--warn)" : "var(--text2)") },
                         title: dg.armor.name + ": current DR out of the suit's printed base",
                         text: dg.armorDR + " / " + dg.armorBaseDR + " DR  " + "□".repeat(Math.max(0, dg.armorBaseDR - dg.armorDRLost)) + "■".repeat(dg.armorDRLost) }),
                       dg.armorGuard ? el("span.chip", { title: ((EN.crafting || {}).armorRepair || {}).qualityText || "", style: { fontSize: "9px", color: "var(--success)", borderColor: "var(--success)" } }, "PLATE SEATED") : null,
                       el("button.btn.sm", { disabled: dg.armorBreached, title: "Lose 1 DR until repaired (Demolition Engine on worn armor, a Hand Razors crit, a caustic environment)",
                         style: { color: "var(--danger)", borderColor: "var(--danger)" }, onclick: function () { markArmorDR(1); } }, "− DR"),
                       dg.armorDRLost > 0 ? el("button.btn.sm", { title: "Undo one point of DR loss. This is a misclick fix, not a repair: repairs are shop or bench work on the Impact Table.",
                         style: { color: "var(--text3)" }, onclick: function () { markArmorDR(-1); } }, "↶ UNDO") : null,
                       dg.armorDRLost > 0 ? el("button.btn.sm", { title: "Open the Impact Table and repair this suit", style: { color: "var(--success)", borderColor: "var(--success)" },
                         onclick: function () { if (EN.inventoryView.openBench) EN.inventoryView.openBench("armor"); EN.app.gotoTab("gear"); } }, "→ REPAIR") : null
                     ]) : null
                   ]) : null },
        Dodge:   { avail: true, req: "",
                   summary: (acro ? "+" + acro.total + " Defense" : "+Agility + Acrobatics to Defense") + " vs this hit; on a miss, shift 1 space" + (dg.speedPenalty ? " · GM may forbid in heavy armor" : "") },
        // "or be fighting unarmed": bare hands always satisfy the requirement, so
        // Parry is never unavailable. The row names the BEST source and says how many
        // others there are; the tray is where you switch. Both read parrySources().
        Parry:   { avail: true, req: "a melee weapon, a shield, or bare hands",
                   summary: parryText(pBest) + (pSources.length > 1 ? " · " + pSources.length + " to choose from" : "") },
        Resurge: { avail: attuned, req: "Flow attunement",
                   summary: "Roll " + resDie + " vs Flow attacks; reduce to 0 → rebound " + (flowMod || "your Flow Mod") + " Resonant" },
        Siphon:  { avail: attuned, req: "Flow attunement",
                   summary: "Roll " + resDie + " vs elemental/Flow damage; restore that much Vigor" },
        Ward:    { avail: !!focusDie || attuned, req: "a Warding Focus or class feature",
                   summary: "Roll " + resDie + (focusDie ? " + " + focusDie + " (" + focusName + ")" : "") + ", subtract from incoming damage" }
      };

      // "How Active Defenses work" collapsible spans full width above the columns
      var defOpen = !!_open["defend-rules"];
      kids.push(el("div.section-title.clickable", {
        style: { margin: "2px 0 4px" },
        title: defOpen ? "Hide the Active Defense rules" : "Tap for how Active Defenses work",
        onclick: function () { _open["defend-rules"] = !defOpen; EN.app.render(); }
      }, [document.createTextNode("How Active Defenses work"), el("span.line"), el("span.collapse-caret", { style: { marginLeft: "4px" }, text: defOpen ? "▾" : "▸" })]));
      if (defOpen) {
        if (C.defense) kids.push(el("p.help", { style: { margin: "0 0 4px", color: "var(--text2)", whiteSpace: "pre-wrap" }, text: C.defense }));
        if (C.activeDefenseRules) kids.push(el("p.help", { style: { margin: "0 0 4px", whiteSpace: "pre-wrap" }, text: C.activeDefenseRules }));
        if (C.defenseNotes) kids.push(el("p.help", { style: { margin: "0 0 6px", color: "var(--warn)" }, text: "Conditions: " + C.defenseNotes }));
      }

      // LEFT column: saving throws. Each row is a button that opens the roll tray,
      // pre-loaded with the attribute modifier, the class Save Focus Caliber, and any
      // condition delta, so a save is one tap rather than mental arithmetic.
      function rollSave(a) {
        var sv = d.saves[a.key];
        var mods = [{ label: a.name + " Modifier", value: d.attributes[a.key].mod }];
        if (sv.focus) mods.push({ label: "Caliber (Save Focus)", value: d.caliber || 0 });
        if (fx.saveDelta) mods.push({ label: "Conditions", value: fx.saveDelta });
        var why = fx.snagSave[a.key] ? "Condition: Snag on " + a.name + " saves" : null;
        openRollTray(Object.assign({
          weaponName: a.name + " Save", subtype: "SAVING THROW",
          melee: false, thrownItem: false, ranged: false, usesAmmo: false,
          traits: [], baseMods: mods, critMin: 20,
          autoSnag: why ? [why] : [], autoEdge: [], baseSnag: why ? 1 : 0, baseEdge: 0,
          shaken: (ch.conditions || []).indexOf("Shaken") !== -1, dmg: null
        }, moxieFlags()));
      }
      var savesCol = el("div", { style: { flex: "0 0 auto", borderRight: "1px solid rgba(35,48,68,.6)", paddingRight: "12px", marginRight: "4px" } }, [
        el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".14em", color: "var(--text3)", fontWeight: 700, marginBottom: "3px" } }, "SAVES"),
        el("div", { style: { fontSize: "9.5px", color: "var(--text4)", marginBottom: "5px" } }, "tap to roll"),
        el("div", { style: { display: "flex", flexDirection: "column", gap: "3px" } }, R.attributes.map(function (a) {
          var sv = d.saves[a.key];
          var svSnag = fx.snagSave[a.key];
          var autoFail = fx.autoFailBodAgiSaves && (a.key === "BOD" || a.key === "AGI");
          var bonus = sv.bonus + fx.saveDelta;
          return el("div.row", {
            title: autoFail ? a.name + " saves automatically fail while this condition holds" : "Roll a " + a.name + " Save",
            style: { gap: "7px", alignItems: "center", cursor: autoFail ? "not-allowed" : "pointer",
                     padding: "3px 6px", borderRadius: "4px", border: "1px solid var(--border)",
                     background: "var(--bg2)", opacity: autoFail ? .55 : 1 },
            onclick: function () { if (!autoFail) rollSave(a); }
          }, [
            el("span.mono", { style: { fontSize: "11px", color: "var(--text3)", minWidth: "26px" }, text: a.key }),
            sv.focus ? el("span.badge", { style: { color: "var(--flow)", fontSize: "8px" }, text: "FOCUS" }) : null,
            autoFail ? el("span.chip", { style: { fontSize: "8px", color: "var(--danger)", borderColor: "var(--danger)" }, text: "AUTO-FAIL" })
                     : (svSnag ? snagChip("Condition · Snag on " + a.name + " saves") : null),
            el("span", { style: { flex: 1 } }),
            el("span.mono", { style: { fontSize: "13px", fontWeight: 600, color: fx.saveDelta ? "var(--warn)" : "var(--accent)" },
              title: fx.saveDelta ? "includes " + eng.fmtMod(fx.saveDelta) + " from conditions" : null, text: eng.fmtMod(bonus) })
          ]);
        }))
      ]);

      // RIGHT column: loadout chips + active defense maneuvers
      var defKids = [];
      defenseLoadoutEls().forEach(function (elm) { defKids.push(elm); });
      var SHAPER_ONLY = { Resurge: true, Siphon: true };
      (C.activeDefenses || []).forEach(function (def) {
        if (SHAPER_ONLY[def.name] && ch.class !== "shaper") return;
        var L = DEF_LIVE[def.name] || { avail: true, req: "", summary: "" };
        if (!L.avail) return;
        var id = "def-" + def.name, open = !!_open[id];
        var fp = /FP/.test(def.cost || "");
        var head = el("div.row.wrap", {
          style: { gap: "9px", alignItems: "center", cursor: "pointer", padding: "7px 4px", borderBottom: "1px solid rgba(35,48,68,.5)" },
          onclick: function () { _open[id] = !open; EN.app.render(); }
        }, [
          el("span.collapse-caret", { text: open ? "▾" : "▸" }),
          el("span", { style: { fontWeight: 600, minWidth: "52px" }, text: def.name }),
          el("button.btn.sm", { title: "Resolve " + def.name + " against an incoming hit",
            style: { flex: "0 0 auto", color: "var(--accent)", borderColor: "var(--accent)" },
            onclick: function (e) { e.stopPropagation(); openDefTray(defSpec(def.name)); } },
            def.name === "Dodge" ? "USE" : "ROLL"),
          el("span.chip", { title: def.cost, style: { fontSize: "9px", color: fp ? "var(--flow)" : "var(--accent)", borderColor: fp ? "var(--flow)" : "var(--accent)" } }, fp ? "IMPULSE · 1 FP" : "IMPULSE"),
          el("span", { style: { flex: 1, minWidth: "100px", fontSize: "11.5px", color: "var(--text2)" }, text: L.summary })
        ]);
        var dkids = [head];
        if (open) dkids.push(el("p.help", { style: { margin: "4px 0 8px 18px", whiteSpace: "pre-wrap" }, text: def.text }));
        if (open && L.extra) dkids.push(el("div", { style: { margin: "0 0 8px 18px" } }, [L.extra]));
        defKids.push(el("div", null, dkids));
      });
      var defensesCol = el("div", { style: { flex: 1, minWidth: 0 } }, defKids);

      kids.push(el("div", { style: { display: "flex", gap: "0", alignItems: "flex-start" } }, [savesCol, defensesCol]));
      return EN.ui.panel("Defense", "SAVES · ACTIVE DEFENSES · IMPULSE", kids, { corners: true });
    }
    sectionEls.defend = defendPanel();

    /* gear proficiencies; mirrors the #PRINT "Skills & Proficiencies" combined pane
       (minus Skills, which have their own panel here, and Saves) */
    var TIER_LABEL = { untrained: "Untrained", proficient: "Proficient", expertise: "Expert", mastery: "Mastery" };
    var profSrc = eng.grantSourceMap(ch);
    function srcTitle(sources, viaTP) {
      var parts = (sources || []).filter(function (x, i, a) { return a.indexOf(x) === i; });
      if (viaTP) parts.push("Training Points");
      return parts.length ? "Source: " + parts.join(" + ") : "Training Points";
    }
    function gearChips(bucket, color) {
      return (R.gear[bucket] || []).map(function (cat) {
        var tier = eng.effectiveGearTier(ch, bucket, cat);
        if (tier === "untrained") return null;
        var viaTP = R.profOrder.indexOf(eng.gearFloorTier(ch, bucket, cat)) < R.profOrder.indexOf(tier) || !profSrc.gear[bucket + "|" + cat];
        return el("span.chip", { title: srcTitle(profSrc.gear[bucket + "|" + cat], viaTP) + " · " + TIER_LABEL[tier],
          style: { fontSize: "10.5px", color: color, borderColor: color } }, cat);
      }).filter(Boolean);
    }
    function profRowIf(label, chips) {
      if (!chips || !chips.length) return null;
      // fixed label column + chip column, so wrapped chips align instead of staggering under the label
      return el("div", { style: { display: "grid", gridTemplateColumns: "78px 1fr", columnGap: "8px", alignItems: "center", marginBottom: "8px" } }, [
        el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--text3)" }, text: label }),
        el("div.row.wrap", { style: { gap: "6px" } }, chips)
      ]);
    }
    function fsParentLabel(f) {
      if (f.type && f.type !== "skill") return f.parent;
      var sk = R.skillByKey[f.parent || f.skill];
      return sk ? sk.name : (f.parent || f.skill);
    }
    var focusChips = (ch.skillFocuses || []).map(function (f) {
      return el("span.chip", { title: f.granted ? "Free Skill Focus from an overlapping Background/Class grant" : "Skill Focus (Training Points)",
        style: { fontSize: "10.5px", color: f.granted ? "var(--gold)" : "var(--accent)", borderColor: f.granted ? "var(--gold)" : "var(--accent)", borderStyle: "dashed" } },
        fsParentLabel(f) + (f.aspect ? " (" + f.aspect + ")" : "") + (f.granted ? " · FREE" : ""));
    });
    var specChips = (ch.specializations || []).map(function (f) {
      return el("span.chip", { title: "Specialization (Training Points)", style: { fontSize: "10.5px", color: "var(--flow)", borderColor: "var(--flow)", borderStyle: "dashed" } },
        fsParentLabel(f) + (f.aspect ? " (" + f.aspect + ")" : ""));
    });
    var profRows = [
      profRowIf("Weapons", gearChips("weapons", "var(--ember)")),
      profRowIf("Armor", gearChips("armor", "var(--text2)")),
      profRowIf("Tools", gearChips("tools", "var(--flow)")),
      profRowIf("Vehicles", gearChips("vehicles", "var(--success)")),
      profRowIf("Focus", focusChips),
      profRowIf("Spec", specChips)
    ].filter(Boolean);
    sectionEls.profs = EN.ui.panel("Proficiencies & Training", "GEAR YOU RUN CLEAN",
      profRows.length ? profRows : [el("p.help", { style: { margin: 0 }, text: "No gear proficiencies yet; grant them via Class/Background or Training Points." })],
      { corners: true });

    /* ---- assemble the modular layout from the saved order ----
       6-column grid; each section spans 1-6 columns (−/+ in its header).
       Dense auto-flow lets later sections backfill row holes, and rows
       stretch to equal height so nothing leaves ragged gaps. */
    var layout = loadLayout();
    var container = el("div.modgrid6" + (_editMode ? "" : ".compact-heads"));
    var wrapEls = [];

    layout.forEach(function (slot) {
      var p = sectionEls[slot.key];
      if (!p) return;
      var wrap = el("div", { style: { gridColumn: "span " + slot.w, minWidth: 0 } }, [p]);
      var head = p.querySelector(".panel-h");
      if (head) {
        // at 2/6 or narrower there's no room for the header sub-label; fold it into the title tooltip
        if (slot.w <= 2) {
          var tag = head.querySelector(".tag");
          if (tag) {
            tag.style.display = "none";
            var h3 = head.querySelector("h3");
            if (h3 && !h3.title) h3.title = tag.textContent;
          }
        }
        if (_editMode) {
          var handle = el("span.drag-handle", { title: "Drag to rearrange", style: { color: "var(--accent)", fontSize: "14px", cursor: "grab" }, text: "⠿" });
          var sizeBtn = function (glyph, delta, title) {
            var next = slot.w + delta;
            var enabled = next >= 1 && next <= 6;
            return el("button", {
              title: title, disabled: !enabled,
              onclick: function () { slot.w = Math.max(1, Math.min(6, slot.w + delta)); saveLayout(layout); EN.app.render(); },
              style: { background: "transparent", border: "1px solid " + (enabled ? "var(--accent)" : "var(--border2)"), color: enabled ? "var(--accent)" : "var(--text4)",
                       borderRadius: "3px", width: "18px", height: "18px", lineHeight: "1", fontSize: "11px",
                       cursor: enabled ? "pointer" : "default", opacity: enabled ? 1 : .4, padding: 0, flex: "0 0 auto" }
            }, glyph);
          };
          var widthCtrls = [
            sizeBtn("−", -1, "Narrower (current: " + slot.w + "/6)"),
            el("span.mono", { title: "Panel width · " + slot.w + " of 6 columns", style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".05em" }, text: slot.w + "/6" }),
            sizeBtn("+", 1, "Wider (current: " + slot.w + "/6)")
          ];
          var hasRight = Array.prototype.some.call(head.children, function (c) { return c.style && c.style.marginLeft === "auto"; });
          head.appendChild(el("div", { style: { marginLeft: hasRight ? "0" : "auto", display: "flex", gap: "4px", alignItems: "center", flex: "0 0 auto", paddingLeft: "8px" } }, widthCtrls.concat([handle])));
          wrap._dragHandle = handle;
        }
      }
      wrap._slot = slot;
      wrapEls.push(wrap);
      container.appendChild(wrap);
    });

    if (_editMode) {
      wrapEls.forEach(function (wrap) {
        var handle = wrap._dragHandle;
        if (!handle) return;
        handle.addEventListener("pointerdown", function (e) {
          if (e.button !== 0 || _drag) return;
          e.preventDefault();
          handle.style.cursor = "grabbing";
          var rect = wrap.getBoundingClientRect();
          var titleText = (wrap.querySelector(".panel-h h3") || {}).textContent || wrap._slot.key;
          var ghost = document.createElement("div");
          ghost.style.cssText = [
            "position:fixed",
            "top:" + rect.top + "px", "left:" + rect.left + "px",
            "width:" + rect.width + "px", "height:44px",
            "display:flex", "align-items:center", "padding:0 12px",
            "background:var(--bg2,#0e0e1a)", "border:1px solid var(--accent)",
            "box-shadow:0 8px 32px rgba(0,220,180,0.25)",
            "border-radius:4px", "pointer-events:none", "z-index:9999",
            "font-family:var(--mono)", "font-size:11px", "letter-spacing:.1em",
            "color:var(--accent)", "user-select:none", "transition:none"
          ].join(";");
          ghost.textContent = titleText.toUpperCase();
          document.body.appendChild(ghost);
          var ph = document.createElement("div");
          ph.style.cssText = [
            "grid-column:span " + wrap._slot.w,
            "min-width:0", "min-height:60px",
            "border:1px dashed var(--accent)",
            "border-radius:4px",
            "background:rgba(0,220,180,0.04)",
            "box-sizing:border-box"
          ].join(";");
          var srcIdx = wrapEls.indexOf(wrap);
          container.insertBefore(ph, wrap);
          wrap.style.display = "none";
          wrapEls.splice(srcIdx, 1, ph);
          _drag = {
            sourceWrap: wrap, handle: handle, ph: ph, ghost: ghost,
            wrapEls: wrapEls, container: container, layout: layout,
            currentIdx: srcIdx,
            offX: e.clientX - rect.left, offY: e.clientY - rect.top
          };
          document.addEventListener("pointermove", _onDragMove);
          document.addEventListener("pointerup", _onDragUp);
          document.addEventListener("pointercancel", _onDragCancel);
        });
      });
    }

    blocks.push(container);

    mount.appendChild(el("div", null, blocks));
    var tray = rollTrayModal();
    if (tray) mount.appendChild(tray);
    var dtray = dmgTrayModal();
    if (dtray) mount.appendChild(dtray);
    var deftray = defTrayModal();
    if (deftray) mount.appendChild(deftray);
  }

  // layout customization (drag/width/attribute-view controls): surfaced from
  // #GRIDOS's settings tray, but only while the Freelancer tab is active, since
  // the layout it edits is this tab's own panel arrangement.
  function isLayoutEditMode() { return _editMode; }
  function resetLayout() { try { localStorage.removeItem(LAYOUT_KEY); localStorage.removeItem(LAYOUT_KEY_V1); } catch (e) {} }
  return { render: render, isLayoutEditMode: isLayoutEditMode, setLayoutEditMode: setEditMode, resetLayout: resetLayout,
           diceMode: diceMode, setDiceMode: setDiceMode };
})();
