/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDeck: the status bar (P1 14 Nov 2026, working since P2 15 Nov 2026).
   What a Freelancer needs in sight and in reach on every screen: who they are and their level, Vitality and
   Wounds, the class resource, the conditions on them, the wallet, a rest, and search. Taking a hit while
   shopping in Gear no longer means a trip back to the Sheet.

   It lives in the top bar (header.os-topbar), which is already the page's pinned chrome, as #dk-hud. THE
   SKELETON IS BUILT ONCE AND PATCHED: js/app.js re-renders on every store change, a cloud sync included, and a
   bar rebuilt each time would drop the amount being typed into it. paint() only writes text, widths and
   classes into nodes it keeps; an open popover is kept the same way and asked to refresh itself.

   NOTHING IS WORKED OUT HERE. Every number comes from EN.engine.derive and EN.combatView.core.state, handed in
   by the shell as one reading per render, and every button calls the function the Freelancer tab's own
   control calls (EN.combatView.core): applyDamage, applyHeal, gainVigor, healWounds, addCondition,
   setCondLevel, shortRest, spendResilience, longRest, advanceDowntime, downtimeRest. A viewed sheet and a
   locked record are refused by the store, as they always were; the bar also draws itself disabled for them.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.hud = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;
  var RING = 2 * Math.PI * 19;   // the level ring's circumference (r = 19 in a 44 box)
  var N = null;                  // the kept nodes
  var C = null;                  // the reading the shell handed in last: { ch, d, st, fx, readOnly }
  var P = null;                  // the open popover: { key, kind, arg, root, refresh }
  var AMT = { vit: 1, wd: 1, rd: 1, days: 7 };   // the amounts typed last, kept while the page is open
  var PROV = true;               // the Long Rest's one question (shelter, food and water), on by default as on the Sheet

  function core() { return EN.combatView.core; }
  function can() { return !!(C && !C.readOnly && C.st && C.d); }
  function cxHas(a) { try { return !!(EN.codexView && EN.codexView.has && EN.codexView.has(a)); } catch (e) { return false; } }
  function peek(a) { try { if (EN.codexView && EN.codexView.peek) EN.codexView.peek(a); } catch (e) {} }
  function icon(html) { return el("span.dk-ic", { html: html || "" }); }
  // a small "rule" button that opens the Codex entry over the page, or nothing where the entry does not resolve
  function ruleBtn(anchor, label) {
    if (!cxHas(anchor)) return null;
    return el("button.dk-link", { type: "button", dataset: { dkRule: anchor }, onclick: function () { peek(anchor); } }, label || "Rule");
  }

  /* ---- popovers: one at a time, built when opened, kept until closed -------------------------------- */
  function popBtn(key) { return N && N.root.querySelector('[data-dk-pop-btn="' + key + '"]'); }
  function closePop(refocus) {
    if (!P) return;
    var p = P; P = null;
    if (p.root.parentNode) p.root.parentNode.removeChild(p.root);
    var b = popBtn(p.key);
    if (b) { b.setAttribute("aria-expanded", "false"); if (refocus) { try { b.focus({ preventScroll: true }); } catch (e) {} } }
  }
  /* make(root, arg) fills the popover and returns the function that patches it from the latest reading.
     `wrap` is the positioned box it hangs from. Opening the one that is open closes it. */
  function openPop(kind, arg, wrap, label, make) {
    var key = kind + (arg ? ":" + arg : "");
    var same = P && P.key === key;
    closePop();
    if (same) return;
    var root = el("div.dk-pop", { role: "dialog", "aria-label": label, dataset: { dkPop: key } });
    P = { key: key, kind: kind, arg: arg || null, root: root, refresh: null };
    P.refresh = make(root, arg) || null;
    wrap.appendChild(root);
    // keep it on the screen: one hung near the right edge slides left by what would hang off
    try { var r = root.getBoundingClientRect(), over = r.right - (window.innerWidth - 10); if (over > 0 && r.left - over >= 0) root.style.left = (-over) + "px"; } catch (e) {}
    var b = popBtn(key);
    if (b) b.setAttribute("aria-expanded", "true");
    if (P.refresh) P.refresh();
    var f = root.querySelector("[data-dk-focus]") || root.querySelector("button:not([disabled])");
    if (f) { try { f.focus({ preventScroll: true }); if (f.select) f.select(); } catch (e) {} }
  }
  // a press anywhere else puts it away. On the press, not the click: the click's own handler may redraw what was pressed.
  document.addEventListener("pointerdown", function (ev) {
    if (!P) return;
    var t = ev.target;
    if (!t || !t.closest) return;
    if (t.closest(".dk-pop") || t.closest("#codex-peek")) return;
    var b = t.closest("[data-dk-pop-btn]");
    if (b && b.getAttribute("data-dk-pop-btn") === P.key) return;   // its own button closes it on the click
    closePop();
  }, true);
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape" || !P || document.getElementById("codex-peek")) return;
    ev.stopPropagation();
    closePop(true);
  }, true);

  // [-] [amount] [+]: the number is typed or stepped, and is remembered under `key`
  function amount(key, min, max, label) {
    function fit(v) { v = Math.floor(Number(v)) || min; return Math.max(min, max ? Math.min(max, v) : v); }
    var inp = el("input.dk-in.dk-num", { type: "number", min: String(min), max: max ? String(max) : null, value: String(AMT[key]), inputmode: "numeric",
      "aria-label": label || "Amount", dataset: { dkAmt: key, dkFocus: "1" },
      oninput: function () { AMT[key] = fit(this.value); },
      onblur: function () { this.value = String(AMT[key]); } });
    function bump(by) { AMT[key] = fit(AMT[key] + by); inp.value = String(AMT[key]); }
    return el("div.dk-step", null, [
      el("button.dk-sq", { type: "button", "aria-label": "Less", onclick: function () { bump(-1); } }, "−"),
      inp,
      el("button.dk-sq", { type: "button", "aria-label": "More", onclick: function () { bump(1); } }, "+")
    ]);
  }
  function act(label, tone, name, fn) {
    return el("button.dk-btn" + (tone ? "." + tone : ""), { type: "button", dataset: { dkDo: name }, onclick: fn }, label);
  }

  function vitPop(root) {
    var clr = act("Clear Vigor", "ghost", "vigor-clear", function () { core().clearVigor(); });
    root.appendChild(el("h5", { text: "Vitality" }));
    root.appendChild(amount("vit", 1, 0, "Amount of damage, healing or Vigor"));
    root.appendChild(el("div.dk-row", null, [
      act("Damage", "bad", "damage", function () { var c = C; closePop(true); core().applyDamage(c.ch, c.d, AMT.vit); }),
      act("Heal", "ok", "heal", function () { var c = C; closePop(true); core().applyHeal(c.ch, c.d, AMT.vit); }),
      act("Vigor", "gold", "vigor", function () { closePop(true); core().gainVigor(AMT.vit); })
    ]));
    root.appendChild(clr);
    root.appendChild(el("p.dk-note", null, ["Damage comes off Vigor first, then Vitality, and what is left over becomes Wound damage. Vigor does not stack: the higher value stands. ",
      ruleBtn("ref-damage/damage-order", "Damage order")]));
    return function () { clr.hidden = !(C.st.vigor > 0); clr.textContent = "Clear Vigor (" + C.st.vigor + ")"; };
  }
  function wdPop(root) {
    root.appendChild(el("h5", { text: "Wounds" }));
    root.appendChild(amount("wd", 1, 0, "Number of Wounds"));
    root.appendChild(el("div.dk-row", null, [
      act("Wound", "bad", "wound", function () { var c = C; closePop(true); core().healWounds(c.ch, c.d, -AMT.wd); }),
      act("Heal", "ok", "wound-heal", function () { var c = C; closePop(true); core().healWounds(c.ch, c.d, AMT.wd); })
    ]));
    root.appendChild(el("p.dk-note", null, ["A Wound taken lowers your current and maximum Vitality by the same amount, and calls for a Body Save. ",
      ruleBtn("rc-vitality/wound-effects", "Wound effects")]));
    return null;
  }

  /* ---- conditions: + adds one from the Conditions Library, a chip opens the one it names ------------- */
  function condInfo(name) { return (EN.conditions || []).filter(function (x) { return x.name === name; })[0] || null; }
  function addPop(root) {
    var list = el("div.dk-opts", { role: "listbox" });
    var q = el("input.dk-in", { type: "text", placeholder: "Find a condition", autocomplete: "off", "aria-label": "Find a condition", dataset: { dkFocus: "1" },
      oninput: function () { fill(); },
      onkeydown: function (e) { if (e.key === "Enter") { var first = list.querySelector("button:not([disabled])"); if (first) first.click(); } } });
    function fill() {
      var on = core().activeConditions(C.ch), want = q.value.trim().toLowerCase();
      clear(list);
      // what is on them already, first: on a narrow bar the chips may not all fit, and this is where the rest are
      if (!want && on.length) {
        list.appendChild(el("div.dk-palg", { text: "On you" }));
        on.forEach(function (name) {
          var lv = core().leveled[name], lvl = lv ? core().condLevel(C.ch, name) : 0;
          list.appendChild(el("button.dk-opt", { type: "button", dataset: { dkOn: name }, onclick: function () { openPop("chip", name, N.condWrap, name, chipPop); } },
            [el("b", { text: name + (lvl > 1 ? " " + lvl : "") }), el("small", { text: "open" })]));
        });
        list.appendChild(el("div.dk-palg", { text: "Add" }));
      }
      // Vacuum is entered as a hazard (it brings its breath clock), as on the Sheet's own picker
      (EN.conditions || []).filter(function (c) { return c.name !== "Vacuum" && (!want || c.name.toLowerCase().indexOf(want) !== -1); }).forEach(function (c) {
        var has = on.indexOf(c.name) !== -1;
        if (has && !want) return;   // listed above
        var imm = EN.engine.immunitiesFor ? EN.engine.immunitiesFor(C.ch, c.name) : [];
        list.appendChild(el("button.dk-opt", { type: "button", role: "option", disabled: has, dataset: { dkCond: c.name },
          title: imm.length ? imm[0].source + " says you cannot take this. It can still be applied: the table outranks the sheet." : null,
          onclick: function () { closePop(true); core().addCondition(c.name); } },
          [el("b", { text: c.name }), el("small", { text: has ? "on you" : imm.length ? "immune: " + imm[0].source : (c.summary || "") })]));
      });
      if (!list.firstChild) list.appendChild(el("p.dk-note", { text: "No condition by that name." }));
    }
    root.appendChild(el("h5", { text: "Add a condition" }));
    root.appendChild(q);
    root.appendChild(list);
    return fill;
  }
  function chipPop(root, name) {
    var head = el("h5"), sum = el("p.dk-note"), meta = el("p.dk-note.dk-dim"), sev = el("p.dk-note.dk-warnt");
    var lvLabel = el("i"), lvVal = el("b");
    var less = el("button.dk-sq", { type: "button", "aria-label": "Lower", dataset: { dkDo: "cond-less" }, onclick: function () { core().setCondLevel(name, core().condLevel(C.ch, name) - 1); } }, "−");
    var more = el("button.dk-sq", { type: "button", "aria-label": "Raise", dataset: { dkDo: "cond-more" }, onclick: function () { core().setCondLevel(name, core().condLevel(C.ch, name) + 1); } }, "+");
    var step = el("div.dk-lv", null, [lvLabel, el("div.dk-step", null, [less, lvVal, more])]);
    var rm = act("Remove", "bad", "cond-remove", function () { closePop(true); core().setCondLevel(name, 0); });
    root.appendChild(head); root.appendChild(sum); root.appendChild(meta); root.appendChild(sev); root.appendChild(step);
    root.appendChild(el("div.dk-row", null, [rm, ruleBtn(core().condAnchor(name), "Read the rule")]));
    return function () {
      var lv = core().leveled[name], lvl = lv ? core().condLevel(C.ch, name) : 0, stage = lv && lv.names ? lv.names[lvl - 1] : null;
      head.textContent = name + (lv ? " " + lvl + (stage ? " · " + stage : "") : "");
      sum.textContent = core().condSummary(name, lv, lvl, condInfo(name), C.d);
      var m = core().condMeta[name];
      meta.hidden = !m; if (m) meta.textContent = "Lasts: " + m[0] + ". Ends: " + m[1] + ".";
      var severe = !!(lv && lv.severeAt && lvl >= lv.severeAt && lv.severeNote);
      sev.hidden = !severe; if (severe) sev.textContent = lv.severeNote;
      step.hidden = !lv || !can();
      if (lv) { lvLabel.textContent = lv.label; lvVal.textContent = String(lvl); more.disabled = lvl >= lv.max; }
      rm.hidden = !can();
    };
  }

  /* ---- rests: a menu of three, then the one picked. The rules each applies are the Sheet's own functions. */
  function restPop(root, first) {
    var body = el("div.dk-restb"), patch = null;
    function back() { return el("button.dk-link.dk-back", { type: "button", dataset: { dkDo: "rest-back" }, onclick: function () { show("menu"); } }, "‹ Rests"); }
    function bfNote(withStrain) {
      if (!(C.d.flow && core().inBreakflow(C.ch))) return null;
      return el("p.dk-note.dk-warnt", { dataset: { dkRestBreakflow: "1" }, text: "In Breakflow: this rest restores no Flow Points. You can't recover them until Breakflow ends, and a rest alone can't end it."
        + (withStrain ? " While you're in Breakflow, only Breakflow Restoration or Rough Restoration lowers your Strain." : "") });
    }
    function menu() {
      var I = core().icons || {};
      function row(key, ic, name, sub) {
        return el("button.dk-opt.dk-opt-ic", { type: "button", dataset: { dkRest: key }, onclick: function () { show(key); } }, [icon(ic), el("b", { text: name }), el("small", { text: sub })]);
      }
      body.appendChild(el("h5", { text: "Rest" }));
      body.appendChild(row("short", I.shortRest, "Short rest", "about an hour"));
      body.appendChild(row("long", I.longRest, "Long rest", "a night"));
      body.appendChild(row("down", I.downtime, "Downtime", "days pass"));
      return null;
    }
    function shortView() {
      // opening this view BEGINS the Short Rest: the dice left now decide the free die (the Sheet's own rule)
      core().openShortRest(C.ch, C.st.rd);
      var R = core().restInfo("short"), d0 = C.d;
      var free = el("p.dk-note.dk-acct", { dataset: { dkShortFree: "1" }, text: "You began this rest with 0 Resilience Dice: taking it regains 1, and you may spend it before you close this." });
      var dice = el("b.dk-dice");
      var roll = act("Roll and heal", "", "rd-roll", function () { var c = C; core().spendResilience(c.ch, c.d, Math.min(AMT.rd, c.st.rd), { shortRest: true }); });
      body.appendChild(back());
      body.appendChild(el("h5", { text: "Short rest" }));
      body.appendChild(el("p.dk-note", null, [(R && R.duration ? R.duration.charAt(0).toUpperCase() + R.duration.slice(1) + ". " : "About an hour. ")
        + "Taking it refreshes " + (d0.resource ? d0.resource.name : "your class resource") + (d0.flow ? " and regains Flow Points equal to your Flow Modifier (minimum 1)" : "")
        + ". You may also spend Resilience Dice to heal Vitality. ", ruleBtn("rc-rests/short-rest", "Short Rest")]));
      var bf = bfNote(false); if (bf) body.appendChild(bf);
      body.appendChild(free);
      body.appendChild(el("div.dk-lv", null, [el("i", { text: "Resilience Dice" }), dice]));
      body.appendChild(el("div.dk-row", null, [amount("rd", 1, 0, "Resilience Dice to spend"), roll]));
      body.appendChild(act("Take short rest", "pri", "rest-short", function () { var c = C; core().shortRest(c.ch, c.d); }));
      return function () {
        var st = C.st, d = C.d, began = core().shortBegan(C.ch), feral = core().feralBonus(d);
        free.hidden = !(began != null && began <= 0 && !(d.chromeTax && d.chromeTax.deadBattery));
        dice.textContent = st.rd + " / " + st.rdMax + " · d" + d.resilienceDie + " " + EN.engine.fmtMod(d.attributes.BOD.mod) + " Body" + (feral ? " +" + feral + " Feral" : "") + " each";
        roll.disabled = st.rd <= 0;
        roll.textContent = st.rd > 0 ? "Roll and heal" : "No dice left";
      };
    }
    function longView() {
      var clanker = C.ch.species === "clankers";
      var box = el("input", { type: "checkbox", checked: PROV !== false, dataset: { dkDo: "rest-prov" }, onchange: function () { PROV = this.checked; } });
      body.appendChild(back());
      body.appendChild(el("h5", { text: "Long rest" }));
      body.appendChild(el("p.dk-note", null, ["Restores Vitality, Resilience Dice, Wounds equal to your Body Modifier (minimum 1) and Flow Points, lowers Strain by 1 and resets the sleep clock. One day passes on the calendar. ",
        ruleBtn("rc-rests/long-rest", "Long Rest")]));
      var bf = bfNote(true); if (bf) body.appendChild(bf);
      body.appendChild(el("label.dk-check", null, [box, el("span", { text: clanker ? "Equivalent maintenance and charge (Fatigue 1 to 3 comes down by 1)" : "Safe shelter, food, and water (Fatigue 1 to 3 comes down by 1)" })]));
      body.appendChild(act("Take long rest", "pri", "rest-long", function () { var c = C; closePop(true); core().longRest(c.ch, c.d, PROV !== false); }));
      return null;
    }
    function downView() {
      function go(n) { var c = C; closePop(true); core().advanceDowntime(c.ch, n); }
      body.appendChild(back());
      body.appendChild(el("h5", { text: "Downtime" }));
      body.appendChild(el("p.dk-note", { text: "Advance the calendar without resting. Marks lease installments and ages saved Personas. Restores nothing." }));
      body.appendChild(el("div.dk-row", null, [amount("days", 1, 365, "Days of downtime"), act("Advance", "", "down-go", function () { go(AMT.days); })]));
      body.appendChild(el("div.dk-row", null, [1, 7, 30].map(function (n) { return act(n === 1 ? "1 day" : n + " days", "ghost", "down-" + n, function () { go(n); }); })));
      body.appendChild(el("h6", null, ["Downtime rest (1 week) ", ruleBtn("rc-rests/downtime", "Rule")]));
      body.appendChild(EN.ui.ruleText(el("p.dk-note"),
        "One uninterrupted week. Gives everything a Long Rest gives (Vitality, FP, Resilience Dice, abilities, the sleep clock) and more: restores all Wounds, removes all Strain, clears Fatigue and temporary conditions. In Breakflow, FP and Strain stay: Breakflow ends only through Breakflow Restoration, and Downtime clears all Strain (unless you're in Breakflow). Critical Wound, Cursed, Hardwired, Mutating, Bricked and Breakflow stay. Does not advance the calendar.",
        { terms: { "One uninterrupted week": "rc-other/downtime-healing" } }));
      body.appendChild(act("Rest a week", "pri", "rest-week", function () { var c = C; closePop(true); core().downtimeRest(c.ch, c.d); }));
      return null;
    }
    function show(v) {
      clear(body);
      patch = (v === "short" ? shortView : v === "long" ? longView : v === "down" ? downView : menu)();
      root.setAttribute("data-dk-rest-view", v);
      if (patch) patch();
      var f = body.querySelector(v === "menu" ? "[data-dk-rest]" : "[data-dk-do^='rest-']:not(.dk-back)");
      if (f && root.parentNode) { try { f.focus({ preventScroll: true }); } catch (e) {} }
    }
    root.appendChild(body);
    show(first || "menu");
    return function () { if (patch) patch(); };
  }

  function openRest(view) {
    if (!N || !can()) return false;
    if (P && P.kind === "rest") closePop();
    openPop("rest", null, N.restWrap, "Rest", function (root) { return restPop(root, view); });
    return true;
  }

  /* ---- the bar itself ------------------------------------------------------------------------------- */
  function meter(cls, label, kind, title, make) {
    var m = {};
    m.btn = el("button.dk-meter." + cls, { type: "button", title: title, "aria-haspopup": "dialog", "aria-expanded": "false", dataset: { dkPopBtn: kind, dkHud: kind },
      onclick: function () { if (can()) openPop(kind, null, m.root, label, make); } }, [
      el("span.dk-ml", null, [el("i", { text: label }), el("b", null, [m.vigor = el("span.dk-vg"), m.val = el("span"), m.max = el("em")])]),
      el("span.dk-track", null, [m.fill = el("span.dk-fill")])
    ]);
    m.root = el("div.dk-has-pop", null, [m.btn]);
    return m;
  }
  function build() {
    var n = {};
    n.ring = el("span.dk-ring", { html: '<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="dk-rt" cx="22" cy="22" r="19"/><circle class="dk-rp" cx="22" cy="22" r="19"/></svg>' });
    n.level = el("b"); n.ring.appendChild(n.level);
    n.arc = n.ring.querySelector(".dk-rp");
    n.arc.setAttribute("stroke-dasharray", RING.toFixed(1));
    n.idn = el("button.dk-idn", { type: "button", dataset: { dkHud: "identity" }, title: "Your record", onclick: function () { if (EN.deck.record) EN.deck.record.open("dossier"); else EN.app.gotoTab("print"); } },
      [n.ring, el("span.dk-idt", null, [n.name = el("b"), n.sub = el("span")])]);
    n.lvl = el("button.dk-lvl", { type: "button", dataset: { dkHud: "levelup" }, title: "A choice from your level is waiting", onclick: function () { if (EN.deck.record) EN.deck.record.open("level"); } }, "Level up");
    n.vit = meter("dk-vit", "Vitality", "vit", "Damage, healing and Vigor", vitPop);
    n.wd = meter("dk-wd", "Wounds", "wd", "Take or heal Wounds", wdPop);
    n.res = el("div.dk-res", null, [n.resName = el("i"), el("div.dk-pips", null, [n.pips = el("span.dk-pipset"), n.resVal = el("b")])]);
    n.add = el("button.dk-add", { type: "button", title: "Add a condition", "aria-label": "Add a condition", "aria-haspopup": "dialog", "aria-expanded": "false", dataset: { dkPopBtn: "cond", dkHud: "cond-add" },
      onclick: function () { if (can()) openPop("cond", null, n.condWrap, "Add a condition", addPop); } }, "+");
    n.conds = el("div.dk-conds", { dataset: { dkHud: "conditions" } });
    n.condWrap = el("div.dk-condw.dk-has-pop", null, [n.add, n.conds]);
    n.wallet = el("div.dk-wal", null, [el("i", { text: "Glimmer" }), n.glim = el("b")]);
    n.rest = el("button.dk-hb", { type: "button", title: "Rest", "aria-label": "Rest", "aria-haspopup": "dialog", "aria-expanded": "false", dataset: { dkPopBtn: "rest", dkHud: "rest" },
      onclick: function () { if (can()) openPop("rest", null, n.restWrap, "Rest", function (root) { return restPop(root, "menu"); }); } }, [icon((core().icons || {}).longRest)]);
    n.restWrap = el("div.dk-has-pop.dk-pop-r", null, [n.rest]);
    n.find = el("button.dk-find", { type: "button", title: "Search rules, your gear and people (Ctrl K)", dataset: { dkHud: "search" }, onclick: function () { if (EN.deck.find) EN.deck.find.open(); } },
      [icon(EN.app.tabIcon("codex")), el("span", { text: "Search" }), el("kbd", { text: "Ctrl K" })]);
    n.root = el("div#dk-hud.dk", { dataset: { dkHud: "bar" } }, [n.idn, n.lvl, n.vit.root, n.wd.root, n.res, n.condWrap, n.wallet, n.restWrap, n.find]);
    return n;
  }
  function setMeter(m, cur, max, vigor, low) {
    m.vigor.textContent = vigor ? "+" + vigor + " " : "";
    m.val.textContent = String(cur);
    m.max.textContent = " / " + max;
    m.fill.style.width = (max > 0 ? Math.max(0, Math.min(100, 100 * cur / max)) : 0) + "%";
    m.fill.classList.toggle("dk-low", !!low);
  }
  // a state the pools put the Freelancer in: it reads its rule, and is not theirs to remove
  var STATE_RULE = { "Dying": "rc-dying/death-saves", "Stable": "rc-medical/stabilize" };
  function stateChip(name) {
    var a = STATE_RULE[name] || core().condAnchor(name);
    if (!cxHas(a)) return el("span.dk-chip.bad", { text: name });
    return el("button.dk-chip.bad", { type: "button", title: "Read the rule", dataset: { dkState: name }, onclick: function () { peek(a); } }, name);
  }
  function condChip(name) {
    var lv = core().leveled[name], lvl = lv ? core().condLevel(C.ch, name) : 0;
    return el("button.dk-chip.warn", { type: "button", "aria-haspopup": "dialog", "aria-expanded": P && P.key === "chip:" + name ? "true" : "false", dataset: { dkPopBtn: "chip:" + name, dkCond: name },
      onclick: function () { openPop("chip", name, N.condWrap, name, chipPop); } }, name + (lvl > 1 ? " " + lvl : ""));
  }
  // a Wound damage Body Save is rolled on the Sheet, where its prompt is: this chip goes there from any screen
  function saveChip(ws) {
    var w = ws[0];
    return el("button.dk-chip.act", { type: "button", dataset: { dkHud: "bodysave" }, title: "You took Wound damage: a Body Save is waiting on your Sheet",
      onclick: function () {
        closePop();
        EN.app.gotoTab("combat");
        var box = document.querySelector("#view [data-woundsave-prompt]");
        if (box) EN.ui.scrollUnderChrome(box);
      } }, !w.result ? "Body Save DC " + w.dc + (ws.length > 1 ? " (+" + (ws.length - 1) + ")" : "") : w.result === "fail" ? "Body Save failed" : "Body Save passed");
  }

  function paint(top, c) {
    C = c;
    if (!N) N = build();
    if (N.root.parentNode !== top) top.appendChild(N.root);
    var ch = c.ch, d = c.d, st = c.st;
    N.root.classList.toggle("dk-ro", !!c.readOnly);

    // who, and how far along
    N.name.textContent = ch.name || "Unnamed Freelancer";
    var cls = d && d.classInfo && d.classInfo.name, sub = d && d.subclassInfo && d.subclassInfo.name;
    N.sub.textContent = cls ? cls + (sub ? " · " + sub : "") : "No class yet";
    var level = (d && d.level) || ch.level || 1;
    N.level.textContent = String(level);
    var pct = 0;
    try {
      var onXp = EN.campaigns && EN.campaigns.usesXp ? EN.campaigns.usesXp(ch) : !!ch.useXp;
      var from = EN.rules.xpThresholds[level] || 0, to = d && d.xpForNext;
      if (onXp && to && to > from) pct = Math.max(0, Math.min(1, ((d.xp || 0) - from) / (to - from)));
    } catch (e) { pct = 0; }
    N.arc.setAttribute("stroke-dashoffset", (RING * (1 - pct)).toFixed(1));
    var owed = 0;
    try { owed = EN.deck.record && !c.readOnly ? EN.deck.record.owed(c).length : 0; } catch (e) { owed = 0; }
    N.lvl.hidden = !owed;

    // the pools: only a record with a class has them
    var pools = !!(st && d), live = pools && !c.readOnly;
    N.vit.root.hidden = N.wd.root.hidden = !pools;
    N.vit.btn.disabled = N.wd.btn.disabled = !live;
    if (pools) {
      setMeter(N.vit, st.vit, st.vitMax, st.vigor, st.vitMax > 0 && st.vit <= st.vitMax / 2);
      setMeter(N.wd, st.wounds, st.woundsMax, 0, false);
    }

    // the class resource: the Reservoir for a Shaper, the class pool for everyone else
    var res = null;
    if (pools && d.flow) res = { name: "Flow Points", max: d.flow.max, cur: (ch.flow && ch.flow.current != null) ? EN.engine.clamp(ch.flow.current, 0, d.flow.max) : d.flow.max };
    else if (pools && d.resource) {
      var have = ch.resources && ch.resources.current ? ch.resources.current[d.resource.name] : null;
      res = { name: d.resource.name, max: d.resource.max, cur: have != null ? have : d.resource.max };
    }
    N.res.hidden = !res;
    if (res) {
      N.resName.textContent = res.name;
      N.resVal.textContent = res.max > 12 ? res.cur + " / " + res.max : String(res.cur);
      clear(N.pips);
      N.pips.classList.toggle("dk-many", res.max > 8);
      if (res.max <= 12) for (var i = 1; i <= res.max; i++) N.pips.appendChild(el("span.dk-pip" + (i <= res.cur ? ".on" : "")));
    }

    // what is on them: a save that is waiting, the states the pools put them in, then the conditions on the record
    clear(N.conds);
    var names = pools ? core().activeConditions(ch) : (ch.conditions || []).slice();
    if (pools) {
      var ws = core().woundSaves(ch);
      if (ws.length && !c.readOnly) N.conds.appendChild(saveChip(ws));
      if (st.dying) N.conds.appendChild(stateChip("Dying"));
      else if (st.stable) N.conds.appendChild(stateChip("Stable"));
      else if (st.critical && names.indexOf("Critical Condition") === -1) N.conds.appendChild(stateChip("Critical Condition"));
      if (st.bloodied && names.indexOf("Bloodied") === -1) N.conds.appendChild(stateChip("Bloodied"));
    }
    names.forEach(function (name) {
      N.conds.appendChild(pools ? condChip(name) : el("span.dk-chip.warn", { text: name }));
    });
    N.add.hidden = N.restWrap.hidden = !live;

    N.glim.textContent = String(Number(ch.glimmer) || 0);

    // the popover that is open: gone with what it was about, patched otherwise
    if (P) {
      var gone = !pools || (P.kind === "chip" ? names.indexOf(P.arg) === -1 : !live);
      if (gone) closePop(); else if (P.refresh) P.refresh();
    }
  }
  function remove() { closePop(); if (N && N.root.parentNode) N.root.parentNode.removeChild(N.root); }

  return { paint: paint, remove: remove, closePop: closePop, openRest: openRest, popOpen: function () { return P ? P.key : null; } };
})();
