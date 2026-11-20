/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDeck: the Sheet (P3, 15 Nov 2026).
   The Freelancer tab as three columns that stay put, in place of panels to arrange:
     CHECKS    the six attributes, each with its save and the skills that roll on it
     ACTIONS   what is in hand (a slot strip that swaps in place), the class resource, attacks, abilities
     DEFENSE   Defense, DR, Speed, Initiative and Size with what adds up to each, the Active Defenses, the
               defensive loadout, the effects conditions are having, and the features pinned in the Dossier
   Anything urgent (a Wound damage Body Save, Dying, cannot act) is drawn across the top of all three.

   NOTHING IS WORKED OUT HERE. Every number and every roll comes from the Freelancer tab's own code through
   EN.combatView.core: the models lifted from its render (statModel, defenseModel, defenseLoadout, feats,
   hardwareDep, unarmedAttack, specialAttacks), the check and attack contexts (skillCtx, saveCtx, attackCtx,
   damageCtx), its trays (openRollTray, openDmgTray, openDefTray, mounted here by mountTrays) and its writers.
   Equipping goes through EN.inventoryView.core. What this file adds is where things sit and how they look.

   NOT HERE YET, and still one press away in the stage bar's "Classic sheet": Versatile Skills, hazards and
   the Status Change bonuses, the Smartdeck and Trauma Rig cards, the Scrap Companion, custom features and a
   feature's notes, the Loadout list with its containers, and the layout editor (which is retired here).

   DOM rules as in js/deck_shell.js: one .dk root, dk- classes only; the trays are Classic's and are mounted
   outside it. It is redrawn on every render, so what is unfolded is kept in S, not in the DOM.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.sheet = (function () {
  var el = EN.ui.el;
  var S = { bd: null, slot: null, ab: {}, df: {}, col: "actions" };   // what is unfolded, and the column a phone shows

  function core() { return EN.combatView.core; }
  function inv() { return EN.inventoryView.core; }
  function fm(n) { return EN.engine.fmtMod(n); }
  function redraw() { EN.app.render(); }
  function cxHas(a) { try { return !!(a && EN.codexView && EN.codexView.has && EN.codexView.has(a)); } catch (e) { return false; } }
  function rule(anchor, label) {
    if (!cxHas(anchor)) return null;
    return el("button.dk-link", { type: "button", "data-ro-keep": "1", dataset: { dkRule: anchor }, onclick: function (e) { e.stopPropagation(); EN.codexView.peek(anchor); } }, label || "Rule");
  }
  function chip(text, tone, title) { return el("span.dk-chip" + (tone ? "." + tone : ""), { title: title || null, text: text }); }
  function btn(label, tone, name, fn, title, off) {
    return el("button.dk-btn" + (tone ? "." + tone : ""), { type: "button", title: title || null, disabled: !!off, dataset: { dkDo: name }, onclick: fn }, label);
  }
  // a button that only changes what is showing: it still takes a click on a read-only record (js/deck_shell.js, segBar)
  function nav(label, tone, name, fn, title, off) { var n = btn(label, tone, name, fn, title, off); n.setAttribute("data-ro-keep", "1"); return n; }
  function h(text, right) { return el("h4.dk-sec", null, [el("span", { text: text }), el("span.dk-grow"), right || null]); }
  // n filled of max; a press sets it, and a press on the last filled one takes it back
  function pips(n, max, tone, name, onSet) {
    var out = el("span.dk-pipset.dk-press" + (tone ? "." + tone : ""), { dataset: { dkPips: name } });
    for (var i = 1; i <= max; i++) (function (i) {
      out.appendChild(el("button.dk-pip" + (i <= n ? ".on" : ""), { type: "button", "aria-label": name + " " + i, "aria-pressed": i <= n ? "true" : "false",
        onclick: function () { onSet(i === n ? i - 1 : i); } }));
    })(i);
    return out;
  }
  function toneOf(color) {
    var c = String(color || "");
    return /danger/.test(c) ? "bad" : /warn/.test(c) ? "warn" : /success/.test(c) ? "ok" : /ember|gold/.test(c) ? "gold" : /text3/.test(c) ? "dim" : "acc";
  }

  /* ---- across the top: what cannot wait ------------------------------------------------------------- */
  function alerts(X) {
    var ch = X.ch, d = X.d, fx = X.fx, st = X.st, K = core(), R = EN.rules, out = [];
    var all = K.woundSaves(ch);
    if (all.length) {
      var ws = all[0], bod = R.attributes.filter(function (a) { return a.key === "BOD"; })[0];
      var text = !ws.result
        ? "You took " + ws.dmg + " Wound damage: make a Body Save, DC " + ws.dc + ". Failure: gain 1 Fatigue and suffer a Critical Wound (roll on the Critical Wound Table)."
        : ws.result === "fail"
        ? "Failed (" + (ws.total != null ? ws.total + " against DC " + ws.dc : "an automatic failure") + "). " + (ws.fatigued ? "+1 Fatigue added. " : "Fatigue is already at 6. ") + "Suffer a Critical Wound: roll on the Critical Wound Table and add the condition it gives."
        : "Saved (" + ws.total + " against DC " + ws.dc + "). No effect.";
      if (all.length > 1) text += " " + (all.length - 1) + " more waiting.";
      var kids = [];
      if (!ws.result && fx.autoFailBodAgiSaves) kids.push(btn("Automatic failure: apply", "bad", "ws-auto", function () { K.settleWoundSave(ws.id, null); redraw(); }, "Body saves fail automatically while this condition holds"));
      else if (!ws.result && bod) kids.push(btn("Roll Body Save", "pri", "ws-roll", function () { K.openRollTray(K.saveCtx(ch, d, fx, bod, { dc: ws.dc, woundSave: ws.id })); }));
      if (K.maxOverdriveOn(ch)) {
        var used = !!(ch.resources && ch.resources.maxOdWound);
        kids.push(ws.odTaken ? chip("+1 Overdrive gained", "gold")
          : btn(used ? "Overdrive: used this round" : "+1 Overdrive: an Enemy's attack", "gold", "ws-od", function () { if (K.maxOverdriveGain(true)) { ws.odTaken = true; EN.ui.toast("+1 Overdrive (Maximum Overdrive)."); redraw(); } },
              "Maximum Overdrive: if an Enemy's attack dealt this Wound damage, gain 1 Overdrive (once per round). It can pass your maximum.", used));
      }
      kids.push(btn(ws.result ? "OK" : "Dismiss", "ghost", "ws-dismiss", function () { K.dismissWoundSave(ws.id); }));
      out.push(el("div.dk-alert." + (ws.result === "pass" ? "ok" : "bad"), { dataset: { woundsavePrompt: ws.result || "open" } }, [
        el("div", null, [el("b", { text: "Body Save · Wound damage" }), el("p", null, [text + " ", rule("rc-vitality/wound-effects", "Wound effects")])]),
        el("div.dk-row", null, kids)
      ]));
    }
    if (st.dying || st.stable) {
      var ds = ch.deathSaves || {};
      out.push(el("div.dk-alert.bad", { dataset: { dkAlert: "dying" } }, [
        el("div", null, [el("b", { text: st.dying ? "Dying" : "Stable, unconscious at 0 Wounds" }),
          el("p", null, [(ds.f || 0) >= 3 ? "Three failures: the body stops keeping score. " : "Death Saves: three successes stabilize you, three failures do not. ", rule("rc-dying/death-saves", "Death Saves")])]),
        el("div.dk-row", null, [
          el("span.dk-lab", { text: "Passed" }), pips(ds.s || 0, 3, "ok", "Death Save passed", function (n) { K.setDeathSaves("s", n); }),
          el("span.dk-lab", { text: "Failed" }), pips(ds.f || 0, 3, "bad", "Death Save failed", function (n) { K.setDeathSaves("f", n); }),
          st.dying ? btn("Stabilize", "", "stabilize", function () { K.stabilize(); }, "Someone treated you: you are Stable") : null,
          st.dying ? rule("rc-medical/stabilize", "Stabilize") : null
        ])
      ]));
    }
    if (fx.cannotAct) out.push(el("div.dk-alert.bad", { dataset: { dkAlert: "cannot-act" } }, [el("div", null, [el("b", { text: "Cannot act" }), el("p", { text: "A condition on you prevents you from taking actions." })])]));
    // one line a lane, by net: sources cancel 1 for 1, the way d20 Stacking says
    var vy = fx.vsYou || {}, lanes = [], worst = 0;
    [["Melee", vy.meleeEdge, vy.meleeSnag], ["Ranged", vy.rangedEdge, vy.rangedSnag]].forEach(function (L) {
      if (!L[1] && !L[2]) return;
      var net = (L[1] || 0) - (L[2] || 0);
      if (net > 0) worst = 1; else if (net < 0 && !worst) worst = -1;
      lanes.push(L[0] + ": " + (net > 0 ? "Edge" : net < 0 ? "Snag" : "a normal roll (Edge and Snag cancel 1 for 1)"));
    });
    if (lanes.length) out.push(el("div.dk-alert." + (worst > 0 ? "bad" : worst < 0 ? "ok" : "dim"), { dataset: { dkAlert: "vs-you" } }, [
      el("div", null, [el("b", { text: "Attacks against you" }), el("p", null, [lanes.join(" · ") + ", from a condition on you. ", rule("rz-edge/stacking-d20", "Edge and Snag")])])]));
    return out;
  }

  /* ---- CHECKS ---------------------------------------------------------------------------------------- */
  function checks(X) {
    var ch = X.ch, d = X.d, fx = X.fx, K = core(), R = EN.rules;
    return R.attributes.map(function (a) {
      var at = d.attributes[a.key], sv = d.saves[a.key];
      var auto = !!(fx.autoFailBodAgiSaves && (a.key === "BOD" || a.key === "AGI")), snag = !!fx.snagSave[a.key];
      var save = el("button.dk-save" + (sv.focus ? ".dk-foc" : "") + (auto ? ".dk-off" : ""), { type: "button", disabled: auto, dataset: { dkSave: a.key },
        title: auto ? a.name + " saves fail automatically while this condition holds" : "Roll a " + a.name + " Save" + (sv.focus ? " (Save Focus)" : "") + (fx.saveDelta ? ", " + fm(fx.saveDelta) + " from conditions" : ""),
        onclick: function () { K.openRollTray(K.saveCtx(ch, d, fx, a)); } },
        [auto ? "Auto-fail" : "Save", auto ? null : el("b", { text: fm(sv.bonus + fx.saveDelta) }), !auto && snag ? chip("Snag", "bad", "A condition puts Snag on " + a.name + " saves") : null]);
      var rows = d.skills.filter(function (s) { return s.attr === a.key; }).map(function (s) {
        var why = K.skillSnagWhy(fx, s);
        return el("button.dk-sk" + (s.tier === "untrained" ? ".dk-un" : ""), { type: "button", dataset: { dkSkill: s.key },
          title: "Roll " + s.name + " (" + s.attrName + " " + fm(s.attrMod) + ", " + R.profTiers[s.tier].name + ")",
          onclick: function () { K.openRollTray(K.skillCtx(ch, d, fx, s)); } },
          [el("i.dk-pf.dk-t-" + s.tier, { title: R.profTiers[s.tier].name }), el("span", { text: s.name }), why ? chip("Snag", "bad", why) : null, el("em", { text: fm(s.total) })]);
      });
      return el("section.dk-card.dk-att", { dataset: { dkAttr: a.key } }, [
        el("header", null, [el("span.dk-mod", { text: fm(at.mod) }), el("span.dk-nm", null, [el("b", { text: a.name }), el("span", { text: a.key + " " + at.score })]), el("span.dk-grow"), save])
      ].concat(rows));
    });
  }

  /* ---- ACTIONS: what is in hand ---------------------------------------------------------------------- */
  var SLOT_NAME = { armor: "Armor", shield: "Shield", focus: "Focus", deck: "Deck", rig: "Rig" };
  function slotModel(X) {
    var ch = X.ch, eng = EN.engine, I = inv(), weapons = [], slots = {}, order = [];
    (ch.equipment || []).forEach(function (e) {
      if (!e || (e.qty != null && e.qty <= 0)) return;
      var it = eng.catalogItem(e.name);
      if (!it) return;
      var key = eng.entryKey(e);
      if (I.isWeapon(it)) { weapons.push({ key: key, name: e.name, it: it, entry: e, on: (ch.equippedWeapons || []).indexOf(key) !== -1 }); return; }
      var slot = eng.equipSlotFor(ch, it, e);
      if (!slot) return;
      if (!slots[slot.id]) { slots[slot.id] = { slot: slot, items: [] }; order.push(slot.id); }
      slots[slot.id].items.push({ key: key, name: e.name, it: it, entry: e, on: slot.get(ch) === key });
    });
    return { weapons: weapons, slots: ["armor", "shield", "focus", "deck", "rig"].filter(function (id) { return !!slots[id]; }).map(function (id) { return slots[id]; }) };
  }
  function slotStrip(X) {
    var ch = X.ch, d = X.d, eng = EN.engine, I = inv(), M = slotModel(X), enc = d.encumbrance || {}, out = [];
    function tile(id, label, name, sub, empty) {
      return el("button.dk-slot" + (empty ? ".dk-empty-slot" : "") + (S.slot === id ? ".on" : ""), { type: "button", "data-ro-keep": "1", "aria-expanded": S.slot === id ? "true" : "false", dataset: { dkSlot: id },
        onclick: function () { S.slot = S.slot === id ? null : id; redraw(); } }, [el("i", { text: label }), el("b", { text: name }), el("span", { text: sub })]);
    }
    var held = M.weapons.filter(function (w) { return w.on; });
    var tiles = [tile("weapons", "Weapons", held.length ? held[0].name : "None in hand", held.length > 1 ? "+" + (held.length - 1) + " more in hand" : held.length ? "in hand" : M.weapons.length ? "press to equip" : "none owned", !held.length)];
    M.slots.forEach(function (g) {
      var on = g.items.filter(function (x) { return x.on; })[0];
      tiles.push(tile(g.slot.id, SLOT_NAME[g.slot.id] || g.slot.id, on ? on.name : "None", on ? g.slot.verbs.act : "press to choose", !on));
    });
    tiles.push(el("button.dk-slot", { type: "button", "data-ro-keep": "1", dataset: { dkSlot: "load" }, title: "Your Loadout, in the Stash", onclick: function () { EN.deck.shell.go("gear"); } },
      [el("i", { text: "Load" }), el("b", { text: (enc.current != null ? enc.current : 0) + " / " + (enc.budget != null ? enc.budget : "?") }),
       el("span" + (enc.state === "overloaded" ? ".dk-badt" : enc.state === "encumbered" ? ".dk-warnt" : ""), { text: enc.state ? enc.state.charAt(0).toUpperCase() + enc.state.slice(1) : "open the Stash" })]));
    out.push(el("div.dk-slots", { dataset: { dkSlots: "1" } }, tiles));
    if (S.slot === "weapons") {
      out.push(el("div.dk-card.dk-swap", { dataset: { dkSwap: "weapons" } }, [el("h5", { text: "Weapons you own" })].concat(M.weapons.length ? M.weapons.map(function (w) {
        return el("button.dk-opt" + (w.on ? ".dk-on" : ""), { type: "button", "aria-pressed": w.on ? "true" : "false", dataset: { dkEquip: w.key }, onclick: function () { I.toggleEquip(w.entry); } },
          [el("b", { text: w.name }), el("small", { text: w.on ? "in hand: press to put away" : "press to equip" })]);
      }) : [el("p.dk-empty", { text: "You own no weapons. The Market is in the Stash." })])));
    } else if (S.slot) {
      var g = M.slots.filter(function (x) { return x.slot.id === S.slot; })[0];
      if (g) out.push(el("div.dk-card.dk-swap", { dataset: { dkSwap: g.slot.id } }, [el("h5", { text: (SLOT_NAME[g.slot.id] || g.slot.id) + ": one at a time" })].concat(g.items.map(function (x) {
        return el("button.dk-opt" + (x.on ? ".dk-on" : ""), { type: "button", "aria-pressed": x.on ? "true" : "false", dataset: { dkEquip: x.key }, onclick: function () { I.toggleSlotEquip(g.slot, x.it, x.entry); } },
          [el("b", { text: x.name }), el("small", { text: x.on ? g.slot.verbs.act + ": press to stow" : "press to choose" })]);
      }))));
      else S.slot = null;
    }
    return out;
  }

  /* ---- ACTIONS: the class resource ------------------------------------------------------------------- */
  function stepper(val, name, onLess, onMore, lessOff, moreOff) {
    return el("div.dk-step", null, [
      el("button.dk-sq", { type: "button", "aria-label": "Spend 1", disabled: !!lessOff, dataset: { dkDo: name + "-less" }, onclick: onLess }, "−"), val,
      el("button.dk-sq", { type: "button", "aria-label": "Regain 1", disabled: !!moreOff, dataset: { dkDo: name + "-more" }, onclick: onMore }, "+")]);
  }
  function resource(X) {
    var ch = X.ch, d = X.d, K = core(), eng = EN.engine, out = [];
    if (d.flow) {
      var cur = K.flowNow(ch, d), strain = eng.strainOf(ch);
      out.push(el("div.dk-card.dk-res-card", { dataset: { dkRes: "flow" } }, [
        el("div.dk-gauge", null, [
          el("span.dk-big", null, [String(cur), el("em", { text: " / " + d.flow.max })]),
          el("span.dk-two", null, [el("b", { text: "Flow Reservoir" }), el("small", { text: "Attack " + fm(d.flow.attackBonus) + " · DC " + d.flow.dc + " · " + d.flow.attributeName })]),
          el("span.dk-grow"), stepper(null, "flow", function () { K.flowStep(ch, d, -1); }, function () { K.flowStep(ch, d, 1); }, cur <= 0, cur >= d.flow.max)]),
        el("div.dk-row", null, [el("span.dk-lab", null, [rule(K.condAnchor("Strain"), "Strain") || "Strain"]), pips(strain, 5, strain >= 5 ? "bad" : "warn", "Strain Stage", function (n) { K.setCondLevel("Strain", n); }),
          strain >= 5 ? chip("Breakflow", "bad") : null, el("span.dk-grow"),
          nav("Patterns and Free-Shaping", "ghost.sm", "open-flow", function () { EN.app.gotoTab("flow"); })])
      ]));
    }
    if (d.resource) {
      var rc = K.resourceNow(ch, d), mx = d.resource.max, over = Math.max(0, rc - mx), od = K.maxOverdriveOn(ch);
      var kids = [el("div.dk-gauge", null, [
        el("span.dk-big" + (over ? ".dk-over" : ""), { title: over ? "Past your maximum: lost when the encounter ends" : null }, [String(rc), el("em", { text: " / " + mx })]),
        el("span.dk-two", null, [el("b", { text: d.resource.name }), el("small", { text: d.resource.attributeName + " · refreshes on a rest" + (over ? " · +" + over + " overflow" : "") })]),
        el("span.dk-grow"), stepper(null, "res", function () { K.resourceStep(ch, d, -1); }, function () { K.resourceStep(ch, d, 1); }, rc <= 0, rc >= mx)])];
      if (od) {
        var used = !!(ch.resources && ch.resources.maxOdWound);
        kids.push(el("div.dk-row", { dataset: { dkMaxOd: "1" } }, [chip("Maximum Overdrive", "gold", "Fury Level 9: gain 1 Overdrive on a Natural 20 attack roll, or once per round when an Enemy's attack deals you Wound damage. It can pass your maximum; the extra is lost when the encounter ends."),
          btn("Natural 20: +1", "sm", "od-nat20", function () { K.maxOverdriveGain(false); }, "A Natural 20 on an attack roll: gain 1 Overdrive. No limit per round."),
          btn(used ? "Wound hit: used" : "Wound hit: +1", "sm", "od-wound", function () { K.maxOverdriveGain(true); }, "An Enemy's attack dealt you Wound damage: gain 1 Overdrive, once per round.", used),
          btn("New round", "sm.ghost", "od-round", function () { K.maxOdNewRound(); }, "The Wound trigger is ready again", !used),
          btn("End encounter", "sm.ghost", "od-end", function () { K.maxOdEndEncounter(d); }, "Overdrive above your maximum is lost, and the Wound trigger resets", !(over > 0 || used))]));
      }
      if (d.triage) kids.push(el("div.dk-row", null, [chip("Triage Save DC " + d.triage.saveDC, "acc", "8 + your Tech Modifier + your Rig's Output Bonus"),
        el("small.dk-dim", { text: (d.triage.scrapRig ? "Scrap Rig" : (d.triage.rigLabel || "no Rig recorded")) + " · Output Bonus " + fm(d.triage.outputBonus) + (d.triage.scrapRig ? " · Snag on Triage healing and attack rolls; a Swift Action Protocol costs an Action" : "") })]));
      out.push(el("div.dk-card.dk-res-card", { dataset: { dkRes: "pool" } }, kids));
    }
    return out;
  }

  /* ---- ACTIONS: attacks ------------------------------------------------------------------------------ */
  function rb(label, value, name, fn, tone, title, off) {
    return el("button.dk-rb" + (tone ? "." + tone : ""), { type: "button", title: title || null, disabled: !!off, dataset: { dkRoll: name }, onclick: fn }, [el("i", { text: label }), el("b", { text: value })]);
  }
  function weaponCard(X, row) {
    var ch = X.ch, d = X.d, fx = X.fx, K = core(), eng = EN.engine, key = row.key;
    var it = EN.combatView.loadedWeapon(ch, row.it, key);   // a Launcher fires what is loaded in it
    var hit = K.weaponHit(ch, d, it, key), norm = K.normalizeWeapon(it), grip = eng.weaponGrip(ch, it, key), wr = eng.weaponReach(ch, it, key);
    var snag = fx.snagAtk ? "A condition puts Snag on all attack rolls" : hit.tier === "untrained" ? "Untrained with " + hit.cat + ": attacks roll with Snag" : null;
    var dice = grip.dice ? norm.damageDisplay.replace(/^\s*\d+d\d+(\s*\(\d+d\d+\))?/, grip.dice) : norm.damageDisplay;
    var noDmg = K.dealsNoDamage(it, hit), dmgText = dice + (hit.indirect ? "" : " " + fm(hit.mod));
    var ranged = !hit.melee && !hit.thrownItem && it.ammo != null;
    var crit = K.weaponCrit(ch, it, key, hit);
    var entry = key ? eng.findEntry(ch, key) : null, stow = entry && eng.stowedInfo ? eng.stowedInfo(ch, entry) : null, blocked = !!(stow && !stow.freeDraw);
    var jamKey = K.jamKeyOf(key, it.name), jammed = ranged && K.isJammed(ch, jamKey) && !/Bowfire/i.test(hit.cat || "");
    var st = ranged ? K.readAmmo(ch, it, key) : null, dry = !!(st && st.cur < K.minFireCost(it));
    var real = !K.physicalDice();
    function takeOut() { return btn("Take out (" + stow.action + ")", "warn", "take-out", function () { K.setInHand(key, true); EN.ui.toast(it.name + " taken out of the " + stow.gearName + " (" + stow.action + ")."); }, "Stowed in your " + stow.gearName + ". Take it out before you attack; its Load doesn't change."); }

    var rolls = [];
    if (blocked) rolls.push(takeOut());
    else if (jammed) rolls.push(btn("Jammed: clear (Swift Action)", "warn", "jam-clear", function () { K.setJammed(jamKey, false); EN.ui.toast(it.name + " cleared (Swift Action)."); }));
    else if (dry) rolls.push(btn("Reload", "warn", "reload-empty", function () { K.reloadWeapon(key); }, "The magazine can't pay for a shot"));
    else rolls.push(rb("Hit", fm(hit.total), "hit", function () { if (real) K.openRollTray(K.attackCtx(ch, d, fx, it, hit, key)); }, "dk-hit",
      "d20 + " + hit.attrName + " Modifier (" + fm(hit.mod) + ")" + (hit.prof ? " + Weapon Proficiency Bonus (" + fm(hit.prof) + ")" : " (untrained, Snag)") + (hit.focus ? " + Caliber from a Focus (" + fm(hit.focusCal) + ")" : "")));
    if (!noDmg) rolls.push(rb("Damage", dmgText, "dmg", function () { if (real) K.openDmgTray(K.damageCtx(ch, d, it, hit, key)); }, "", dice + (hit.indirect ? ", indirect: no attribute Modifier" : " " + fm(hit.mod) + " (" + hit.attrName + ")") + (grip.why ? ". " + grip.why : "")));
    if (hit.throwInfo && !blocked) {
      var ti = hit.throwInfo, hT = K.throwHit(hit);
      rolls.push(rb("Throw", fm(ti.total), "throw", function () { if (real) K.openRollTray(K.attackCtx(ch, d, fx, it, hT, key)); }, "dk-hit", "Thrown, out to " + (ti.range || "its thrown range") + ": the higher of Body and Agility"));
      var tDice = grip.baseDice ? norm.damageDisplay.replace(/^\s*\d+d\d+(\s*\(\d+d\d+\))?/, grip.baseDice) : norm.damageDisplay, tText = tDice + " " + fm(ti.mod);
      if (tText !== dmgText) rolls.push(rb("Throw dmg", tText, "throw-dmg", function () { if (real) K.openDmgTray(K.damageCtx(ch, d, it, hT, key)); }, "", "On a thrown hit, held in one hand"));
    }
    if (!real && ranged && !blocked && !jammed) rolls.push(btn("Fire", "gold", "fire", function () { K.fireWeapon(key); }, "Spend this weapon's ammo for one use; roll the dice yourself"));

    var sub = (hit.melee ? "Melee" : hit.thrownItem ? "Thrown" : "Ranged") + " · " + hit.cat + " · " + (wr.melee ? "Reach " + wr.total : "Range " + norm.rangeDisplay);
    var head = el("div.dk-atk-i", null, [el("b", { title: it.desc || null, text: row.label }), el("span", { text: sub }),
      el("span.dk-chips", null, [snag ? chip("Snag", "bad", snag) : null, hit.focus ? chip("Focus +" + hit.focusCal, "gold", "Skill Focus: " + hit.cat + " (" + hit.focus.aspect + ")") : null]
        .concat(crit.sources.map(function (s) { return chip("Crit " + crit.min + " to 20", "acc", s.why); })))]);
    var kids = [el("div.dk-atk-top", null, [head, el("div.dk-rolls", null, rolls)])];

    if (ranged) {
      var cells = [];
      if (st.cap > 0 && st.cap <= 24) for (var i = 0; i < st.cap; i++) cells.push(el("u" + (i < st.cur ? ".on" : "")));
      var ctl = [el("span.dk-ammo" + (st.cur === 0 ? ".dk-dry" : ""), { title: st.cur + " of " + st.cap + " loaded", dataset: { dkAmmo: st.cur + "/" + st.cap } }, cells.concat([el("small", { text: st.cur + " / " + st.cap + (it.ammoUnit ? " " + it.ammoUnit : "") })])), el("span.dk-grow")];
      if (st.modes.length > 1) ctl.push(el("select.dk-in.dk-sel", { "aria-label": "Fire mode", dataset: { dkMode: "1" }, onchange: function () { K.writeAmmo(key, { mode: this.value }); } },
        st.modes.map(function (m) { return el("option", { value: m, selected: m === st.mode, text: m + " · " + K.modeCost[m] }); })));
      else ctl.push(chip((st.modes[0] || "Fire") + " · " + (st.modes.length ? K.modeCost[st.modes[0]] : K.implicitCost(it)), "", "Rounds a shot spends"));
      var opts = K.ammoTypeOptions(ch, it);
      if (opts.indexOf(st.ammoType) === -1) opts.push(st.ammoType);
      if (st.next && opts.indexOf(st.next) === -1) opts.push(st.next);
      var nextLoad = st.next || st.ammoType;
      if (opts.length > 1) ctl.push(el("select.dk-in.dk-sel", { "aria-label": "Ammunition for the next reload", title: "Loaded on the next Reload", dataset: { dkAmmoType: "1" }, onchange: function () { var v = this.value; K.writeAmmo(key, { nextType: v === st.ammoType ? null : v }); } },
        opts.map(function (o) { return el("option", { value: o, selected: o === nextLoad, text: o + (o !== "Standard" && K.ownedQty(ch, o) <= 0 ? " (none in stash)" : "") }); })));
      if (!dry) ctl.push(btn("Reload", "sm.ghost", "reload", function () { K.reloadWeapon(key); }));
      kids.push(el("div.dk-row.dk-ammo-row", null, ctl));
      if (st.next) kids.push(el("p.dk-note", { text: "Next reload: " + st.next + ". The magazine still fires what is in it." }));
    }
    // traits, the grip, and an attribute a feature lets this weapon use
    var tr = norm.traits.filter(function (t) { return !(grip.forcedBy && grip.versatile && /^Versatile\s*\(/i.test(String(t))); }).map(function (t) { return chip(String(t), "", K.traitInfo(t).tip); });
    if (grip.canToggle) tr.push(el("button.dk-chip.dk-tog", { type: "button", title: grip.why + " Press to switch grip.", dataset: { dkDo: "grip" }, onclick: function () { K.setWeaponGrip(key, !grip.twoHanded); } },
      grip.twoHanded ? "Two-handed · " + grip.versatile : "One-handed · " + grip.baseDice));
    else if (grip.versatile && grip.forcedBy) tr.push(chip("Two-handed only · " + grip.versatile, "warn", grip.why));
    (hit.offers || []).forEach(function (o) {
      var on = hit.offerOn && hit.offerOn.feature === o.feature;
      tr.push(el("button.dk-chip" + (on ? ".act" : ".gold"), { type: "button", "aria-pressed": on ? "true" : "false", dataset: { dkDo: "offer" },
        title: o.feature + ": you may use your " + o.attrName + " modifier instead of " + hit.baseAttrName + " for the attack and damage rolls" + (o.when ? ", " + o.when : "") + ". The sheet cannot tell whether it applies, so it is yours to declare.",
        onclick: function () { K.toggleAttackOffer(key, o.feature); } }, (on ? "✓ " : "") + o.attrName + " " + fm(o.mod + hit.prof + hit.focusCal) + " · " + o.feature));
    });
    if (tr.length) kids.push(el("div.dk-chips.dk-traits", null, tr));
    var effect = it.signature ? it.effect : (it.shell ? (K.shellRow(it.shell) || {}).effect : it.effect);
    if (effect) kids.push(el("p.dk-note", { text: (it.signature ? "" : "On hit: ") + effect }));
    if (it.signature && it.effect) { var sg = eng.signatureStatus(ch, it); if (sg) kids.push(el("p.dk-note.dk-warnt", { text: sg })); }
    if (!blocked && entry && eng.rackState && eng.rackState(ch).byItem[key] && !stow) {
      var pb = eng.rackState(ch).byItem[key];
      if (!(eng.catalogItem(pb.name) || {}).freeDraw) kids.push(el("div.dk-row", null, [el("small.dk-dim", { text: "In hand, out of your " + pb.name + "." }), btn("Put back", "sm.ghost", "put-back", function () { K.setInHand(key, false); })]));
    }
    return el("div.dk-card.dk-atk" + (blocked ? ".dk-stowed" : ""), { dataset: { dkWeapon: key } }, kids);
  }
  function simpleCard(name, sub, hit, onRoll, snag, dataName, extra) {
    return el("div.dk-card.dk-atk", { dataset: { dkAttack: dataName } }, [el("div.dk-atk-top", null, [
      el("div.dk-atk-i", null, [el("b", { text: name }), el("span", { text: sub }), snag ? el("span.dk-chips", null, [chip("Snag", "bad", typeof snag === "string" ? snag : "Untrained with Simple Weapons")]) : null]),
      el("div.dk-rolls", null, [rb("Hit", fm(hit), "hit", onRoll, "dk-hit")])])].concat(extra || []));
  }
  function attacks(X) {
    var ch = X.ch, d = X.d, fx = X.fx, K = core(), out = [h("Attacks")];
    X.real.forEach(function (row) { if (row.it) out.push(weaponCard(X, row)); });
    var ua = K.unarmedAttack(ch, d, fx, X.real.length > 0);
    if (ua) out.push(simpleCard(ua.name, ua.dmgText + (ua.note ? " · " + ua.note : ""), ua.hit, function () { K.openRollTray(ua.ctx()); }, ua.snag, "unarmed"));
    K.specialAttacks(ch, d).forEach(function (a) {
      out.push(simpleCard(a.name, a.note, a.hit, function () { K.openRollTray(K.simpleAttackCtx(ch, d, a.name, a.subtype, a.mods, {})); }, null, a.name === "Flow Attack" ? "flow" : "cipher"));
    });
    if (ch.class === "scoundrel") out.push(el("div.dk-card.dk-atk", { dataset: { dkAttack: "cheap-shot" } }, [el("div.dk-atk-top", null, [
      el("div.dk-atk-i", null, [el("b", { text: "Cheap Shot" }), el("span", { text: "Bonus damage, once per turn. Needs Edge on the attack, or another conscious enemy of the target within 1 space of it and no Snag, or 1 Moxie spent this round. Sidearm, Simple or Light Melee only." })]),
      el("div.dk-rolls", null, [el("span.dk-rb", null, [el("i", { text: "Bonus" }), el("b", { text: d.caliber + "d6" })])])])]));
    if (!X.real.length) out.push(el("p.dk-empty", { text: "No weapon in hand. Press Weapons above to equip one." }));
    return out;
  }

  /* ---- ACTIONS: abilities ---------------------------------------------------------------------------- */
  function abilityCard(X, f, rName, dead) {
    var ch = X.ch, d = X.d, K = core(), open = !!S.ab[f.name];
    var costs = !!(d.resource && f.chip && f.chip.toUpperCase().indexOf(rName) !== -1), cost = costs ? (parseInt(f.chip, 10) || 1) : 0, rc = d.resource ? K.resourceNow(ch, d) : 0;
    var spite = f.key === K.spiteKey && d.resource && rc >= d.resource.max;
    var use = costs ? btn("Use", rc >= cost && !dead && !spite ? "pri.sm" : "sm", "use", function (e) { e.stopPropagation(); K.resourceStep(ch, d, -cost); }, rc >= cost ? "Spend " + f.chip : "Not enough " + d.resource.name, rc < cost || dead || spite) : null;
    var spent = f.uses ? K.featUsesSpent(ch, f) : 0;
    var kids = [el("div.dk-abl-top", null, [
      el("button.dk-abl-n", { type: "button", "data-ro-keep": "1", "aria-expanded": open ? "true" : "false", onclick: function () { S.ab[f.name] = !open; redraw(); } }, [el("b", { text: f.name }), el("span.dk-caret", { text: open ? "▾" : "▸" })]),
      el("span.dk-grow"),
      f.cost ? (cxHas(K.costAnchor[f.cost]) ? el("button.dk-chip.dk-act-" + f.cost.toLowerCase(), { type: "button", "data-ro-keep": "1", title: "The " + f.cost + " rule", onclick: function () { EN.codexView.peek(K.costAnchor[f.cost]); } }, f.cost) : chip(f.cost, "dk-act-" + f.cost.toLowerCase())) : null,
      f.chip ? chip(f.chip, "acc", "Spends the class resource") : null,
      use])];
    if (f.uses && f.uses.max > 0) kids.push(el("div.dk-row.dk-uses", null, [pips(spent, f.uses.max, "bad", "Use of " + f.name, function (n) { K.setFeatUses(f, n); }),
      el("small.dk-dim", { text: "used, per " + f.uses.recharge + (spent >= f.uses.max ? " · expended" : "") })]));
    if (spite) kids.push(el("p.dk-note.dk-warnt", { text: "Can't use Spite now: your Overdrive is " + rc + " / " + d.resource.max + ", and Spite can't take you past your maximum." }));
    if (open) kids.push(el("div.dk-ftx", null, [EN.ui.ruleText(el("p"), f.text || ""), f.requirements ? el("p.dk-dim", { text: "Requires: " + (Array.isArray(f.requirements) ? f.requirements.join(", ") : String(f.requirements)) }) : null, el("p.dk-dim", { text: f.src || "" })]));
    return el("div.dk-card.dk-abl" + (dead ? ".dk-dead" : ""), { dataset: { dkAbility: f.name } }, kids);
  }
  function abilities(X) {
    var ch = X.ch, d = X.d, K = core(), act = X.feats.activeFeats, out = [];
    var rName = d.resource ? d.resource.name.toUpperCase() : null;
    var mine = rName ? act.filter(function (f) { return f.chip && f.chip.toUpperCase().indexOf(rName) !== -1; }) : [];
    var rest = rName ? act.filter(function (f) { return !f.chip || f.chip.toUpperCase().indexOf(rName) === -1; }) : act;
    var dep = d.resource ? K.hardwareDep(ch, d) : null, dead = !!(dep && dep.state === "bricked");
    if (dep && dep.state === "missing" && mine.length) {
      out.push(el("div.dk-alert.warn", { dataset: { dkAlert: "hardware" } }, [
        el("div", null, [el("b", { text: dep.title }), el("p", { text: dep.say + " " + mine.length + " " + d.resource.name + (mine.length === 1 ? " ability is" : " abilities are") + " unavailable until " + (dep.stowed ? "you take your " + dep.what + " out." : "a " + dep.what + " is equipped.") })]),
        el("div.dk-row", null, [dep.stowed
          ? btn("Take out (" + dep.stowed.action + ")", "warn", "dep-take-out", function () { K.setInHand(dep.deckKey, true); EN.ui.toast("Your " + dep.what + " is out (" + dep.stowed.action + ")."); })
          : nav("Equip a " + dep.what + " in the Stash", "", "dep-equip", function () { if (EN.inventoryView.openStash) EN.inventoryView.openStash(dep.cat); EN.app.gotoTab("gear"); })])]));
    } else if (mine.length) {
      out.push(h(d.resource.name + " abilities", dead ? chip(dep.what + " bricked", "bad") : null));
      mine.forEach(function (f) { out.push(abilityCard(X, f, rName, dead)); });
    }
    out.push(h("Abilities"));
    if (rest.length) rest.forEach(function (f) { out.push(abilityCard(X, f, rName, false)); });
    else if (!mine.length) out.push(el("p.dk-empty", { text: "No active abilities yet. Resource abilities you pick on #PRINT show up here." }));
    else out.pop();
    return out;
  }

  /* ---- DEFENSE --------------------------------------------------------------------------------------- */
  function tiles(X) {
    var d = X.d, fx = X.fx, SM = X.SM, dg = SM.dg, BD = SM.BD, K = core(), out = [];
    function tile(key, label, value, sub, tone) {
      return el("button.dk-tile" + (S.bd === key ? ".on" : "") + (tone ? "." + tone : ""), { type: "button", "data-ro-keep": "1", "aria-expanded": S.bd === key ? "true" : "false", title: sub, dataset: { dkStat: key },
        onclick: function () { S.bd = S.bd === key ? null : key; redraw(); } }, [el("i", { text: label }), el("b", { text: String(value) })]);
    }
    out.push(el("div.dk-tiles", null, [
      tile("DEF", "Def", d.defense, SM.defAttrName + (dg.shield ? " + shield" : "")),
      tile("DR", "DR", d.totalDR || 0, dg.armor ? dg.armor.name : "no armor", d.totalDR > 0 ? "" : "dk-zero"),
      tile("SPD", "Spd", SM.spDisplay, SM.spDisplay < d.speed ? "of " + d.speed + ", reduced" : "spaces", SM.spDisplay < d.speed ? "dk-down" : ""),
      tile("INIT", "Init", fm(SM.initVal), (SM.initAttr === "WIT" ? "Wits" : "Agility"), fx.init < 0 ? "dk-down" : ""),
      tile("SIZE", "Size", d.size || "?", d.heightFt != null ? EN.engine.fmtFtIn(d.heightFt) : "set a height", d.size ? "" : "dk-zero")]));
    var bd = S.bd && BD[S.bd];
    if (bd) {
      var init = SM.init, kids = [el("div.dk-row.dk-bd-h", null, [el("b", { text: bd.title }), el("span.dk-grow"), el("b.dk-bd-t", { text: bd.sign ? fm(bd.total) : String(bd.total) })]), el("p.dk-note", { text: bd.formula })];
      if (S.bd === "INIT") {
        var cal = init.caliber, more = init.lineage + init.cyber + init.cond;
        kids.push(el("div.dk-seg", { dataset: { dkInitPick: "1" } }, [["AGI", "Agility", cal + init.agi + more], ["WIT", "Wits", cal + init.wit + more], [null, "Higher", cal + Math.max(init.agi, init.wit) + more]].map(function (o) {
          var on = o[0] ? init.chosen && init.attr === o[0] : !init.chosen;
          return el("button.dk-segb" + (on ? ".on" : ""), { type: "button", "aria-pressed": on ? "true" : "false", dataset: { dkInit: o[0] || "auto" }, onclick: function () { K.setInitAttr(o[0]); } }, o[1] + " " + fm(o[2]));
        })));
      }
      if (bd.empty) kids.push(el("p.dk-note.dk-dim", { text: bd.empty }));
      bd.rows.forEach(function (r) { kids.push(el("div.dk-srow", null, [el("span", null, [r.label, r.note ? el("small.dk-dim", { text: " " + r.note }) : null]), el("b", { text: r.raw ? String(r.val) : (r.val >= 0 ? "+" : "") + r.val })])); });
      if (bd.foot) kids.push(el("p.dk-note.dk-dim", { text: bd.foot }));
      var links = (bd.rules || []).map(function (p) { return rule(p[0], p[1]); }).filter(Boolean);
      if (links.length) kids.push(el("div.dk-row", null, links));
      out.push(el("div.dk-card.dk-bd", { dataset: { dkBreakdown: S.bd } }, kids));
    }
    return out;
  }
  function defenses(X) {
    var ch = X.ch, DM = X.DM, dg = X.SM.dg, K = core(), C = EN.combat || {}, out = [h("Active Defenses", rule("ref-def/active-defense-rules", "How they work"))];
    (C.activeDefenses || []).forEach(function (def) {
      if ((def.name === "Resurge" || def.name === "Siphon") && ch.class !== "shaper") return;
      var L = DM.DEF_LIVE[def.name] || { avail: true, summary: "" };
      if (!L.avail) return;
      var open = !!S.df[def.name], fp = /FP/.test(def.cost || "");
      var kids = [el("div.dk-abl-top", null, [
        btn(def.name === "Dodge" ? "Use" : "Roll", "pri.sm", "def-" + def.name, function () { K.openDefTray(DM.defSpec(def.name)); }, "Resolve " + def.name + " against an incoming hit"),
        el("button.dk-abl-n", { type: "button", "data-ro-keep": "1", "aria-expanded": open ? "true" : "false", onclick: function () { S.df[def.name] = !open; redraw(); } }, [el("b", { text: def.name }), el("span.dk-caret", { text: open ? "▾" : "▸" })]),
        el("span.dk-grow"), chip(fp ? "Impulse · 1 FP" : "Impulse", fp ? "acc" : "", def.cost)]),
        el("p.dk-note", { text: L.summary })];
      if (def.name === "Block" && dg.shield) kids.push(el("div.dk-row", { dataset: { dkWear: "shield" } }, [el("span.dk-lab", { text: "Durability" }),
        el("span.dk-boxes", { text: "□".repeat(dg.shieldBoxesLeft) + "■".repeat(dg.shieldSpent) }), el("span.dk-grow"),
        btn("Mark wear", "sm.bad", "wear", function () { DM.markShieldWear(1); }, "Mark 1 Durability box: a Blocked hit at or above the Wear Threshold, or a Blocked critical", !dg.shieldAlive),
        dg.shieldSpent > 0 ? btn("Repair 1", "sm.ghost", "wear-undo", function () { DM.markShieldWear(-1); }, "Restore 1 box (Repair Project)") : null]));
      if (def.name === "Block" && dg.armor && dg.armorBaseDR) kids.push(el("div.dk-row", { dataset: { dkWear: "armor" } }, [el("span.dk-lab", { text: "Plating" }),
        el("span.dk-boxes", { title: dg.armor.name + ": current DR out of the suit's printed base", text: dg.armorDR + " / " + dg.armorBaseDR + " DR" }), el("span.dk-grow"),
        btn("Lose 1 DR", "sm.bad", "dr-loss", function () { DM.markArmorDR(1); }, "Lose 1 DR until repaired", dg.armorBreached),
        dg.armorDRLost > 0 ? btn("Undo", "sm.ghost", "dr-undo", function () { DM.markArmorDR(-1); }, "Undo one point of DR loss: a misclick fix, not a repair") : null,
        dg.armorDRLost > 0 ? nav("Repair in the Stash", "sm.ghost", "dr-repair", function () { if (EN.inventoryView.openBench) EN.inventoryView.openBench("armor"); EN.deck.shell.gearView("classic"); }) : null]));
      if (open) kids.push(el("div.dk-ftx", null, [el("p", { text: def.text }), rule("ref-def/" + EN.codexView.slug(def.name), def.name + " in the Codex")]));
      out.push(el("div.dk-card.dk-abl", { dataset: { dkDefense: def.name } }, kids));
    });
    var gear = K.defenseLoadout(ch, X.d, dg);
    if (gear.length) out.push(el("div.dk-chips.dk-loadout", { dataset: { dkLoadout: "1" } }, gear.map(function (g) {
      var kids = [el("i", { text: g.label }), g.name];
      return g.onclick ? el("button.dk-chip.dk-gear." + toneOf(g.color), { type: "button", title: g.tip, onclick: g.onclick }, kids) : el("span.dk-chip.dk-gear." + toneOf(g.color), { title: g.tip }, kids);
    })));
    else out.push(el("p.dk-empty", { text: "No armor, shield or Warding Focus equipped. Press a slot in Actions to choose one." }));
    return out;
  }
  function effects(X) {
    var fx = X.fx, out = [];
    if (!fx.notes || !fx.notes.length) return out;
    out.push(h("What your conditions are doing"));
    out.push(el("div.dk-card.dk-fx", { dataset: { dkEffects: fx.notes.length } }, fx.notes.map(function (n) { return EN.ui.ruleText(el("p.dk-note"), n, { conditions: true }); })));
    return out;
  }
  function pinned(X) {
    var ch = X.ch, ann = ch.featureAnnotations || {}, out = [h("Pinned features", nav("Dossier", "sm.ghost", "open-dossier", function () { if (EN.deck.record) EN.deck.record.open("dossier"); }))];
    var pins = X.feats.passiveFeats.filter(function (f) { var a = ann[f.name] || {}; return a.pinned || a.important; });
    if (!pins.length) { out.push(el("p.dk-empty", { text: "Star a feature in your Dossier to keep it here." })); return out; }
    pins.forEach(function (f) {
      var open = !!S.ab["pin:" + f.name];
      out.push(el("div.dk-card.dk-abl", { dataset: { dkPin: f.name } }, [
        el("div.dk-abl-top", null, [el("button.dk-abl-n", { type: "button", "data-ro-keep": "1", "aria-expanded": open ? "true" : "false", onclick: function () { S.ab["pin:" + f.name] = !open; redraw(); } },
          [el("b", { text: f.name }), el("span.dk-caret", { text: open ? "▾" : "▸" })]), el("span.dk-grow"), el("small.dk-dim", { text: f.src || "" })]),
        open ? el("div.dk-ftx", null, [EN.ui.renderText(f.text || "", {})]) : null]));
    });
    return out;
  }

  /* ---- the page -------------------------------------------------------------------------------------- */
  function render(stage, c) {
    var K = core(), eng = EN.engine, ch = c.ch, d = c.d, fx = c.fx;
    var rows = K.equippedRows(ch), real = rows.filter(function (r) { return r.it && !eng.isUnarmedAugmentName(r.it.name); });
    var SM = K.statModel(ch, d, fx);
    var X = { ch: ch, d: d, fx: fx, st: c.st, real: real, SM: SM, DM: K.defenseModel(ch, d, SM.dg, real), feats: K.feats(ch, d) };
    var root = el("div.dk.dk-sheet", { dataset: { dkSheet: "1", dkCol: S.col } });
    root.appendChild(el("div.dk-seg.dk-colseg", { role: "group", "aria-label": "Column" }, [["checks", "Checks"], ["actions", "Actions"], ["defense", "Defense"]].map(function (x) {
      return el("button.dk-segb" + (S.col === x[0] ? ".on" : ""), { type: "button", "data-ro-keep": "1", "aria-pressed": S.col === x[0] ? "true" : "false", dataset: { dkColBtn: x[0] }, onclick: function () { S.col = x[0]; redraw(); } }, x[1]);
    })));
    var al = alerts(X);
    if (al.length) root.appendChild(el("div.dk-alerts", null, al));
    root.appendChild(el("div.dk-col.dk-c-checks", { dataset: { dkColumn: "checks" } }, checks(X)));
    // data-tour: the guided tour's "You're on the #GRID" step points at the Actions column (js/tour.js)
    root.appendChild(el("div.dk-col.dk-c-actions", { dataset: { dkColumn: "actions", tour: "sheet-actions" } }, slotStrip(X).concat(resource(X)).concat(attacks(X)).concat(abilities(X))));
    root.appendChild(el("div.dk-col.dk-c-defense", { dataset: { dkColumn: "defense" } }, tiles(X).concat(defenses(X)).concat(effects(X)).concat(pinned(X))));
    stage.appendChild(root);
    // the roll, damage and defense trays are the Freelancer tab's own, drawn outside the .dk root so they look as tested
    var host = el("div.dk-host.dk-trays");
    stage.appendChild(host);
    K.mountTrays(host);
  }

  return { render: render, state: S };
})();
