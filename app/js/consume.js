/* ===========================================================================
   ELYSIUM NIGHTS · consumables that do what they say (19 Nov 2026, the author's call)
   USE on the HUD's Loadout spends one expendable (js/inventory.js useOne) and performs it. Each piece's effect is the catalog's own
   (data/gear_tools.js), done through the HUD's writers (js/combat.js core: Vigor, Vitality, Wounds, conditions, Status Changes), so
   nothing here works a rule out a second time. The author's answers of 19 Nov 2026:
     - a piece that can go on someone else asks: ON ME writes the result to this sheet; ON SOMEONE ELSE rolls it and says what they
       get, for the table, and leaves this sheet alone;
     - a piece with a lasting effect is turned on in Status Changes as a Bonus, with its duration and drawback, and cleared by hand.
   The dice are rolled here, as Resilience Dice are, and shown with the result. A piece that would do nothing (a Flow Tonic with no
   Reservoir, an Adrenaline Amp on someone not at 0 Wounds and Stabilized) says why and is not spent.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.consume = (function () {
  var store = EN.store;
  function C() { return EN.combatView.core; }
  function I() { return EN.inventoryView.core; }
  function eng() { return EN.engine; }

  // dice: "2d6", with a flat bonus; the rolls are kept for the readout
  function roll(n, sides, flat) {
    var r = eng().rollDamage({ dice: n + "d" + sides, flat: flat || 0 });
    var rolls = r.groups[0] ? r.groups[0].rolls : [];
    flat = flat || 0;
    return { total: r.total, text: n + "d" + sides + (flat ? (flat > 0 ? " + " : " − ") + Math.abs(flat) : "") + " → [" + rolls.join(", ") + "]" + (flat ? (flat > 0 ? " + " : " − ") + Math.abs(flat) : "") + " = " + r.total };
  }
  function prof(d, key) { var s = ((d && d.skills) || []).filter(function (x) { return x.key === key; })[0]; return s ? (s.profBonus || 0) : 0; }
  function mod(d, a) { return (d && d.attributes && d.attributes[a]) ? d.attributes[a].mod : 0; }
  // the Status Changes Bonus that stands for a piece (data/status_changes.js lists them by item)
  function bonusOf(name) {
    var SC = EN.statusChanges; if (!SC || !SC.bonus) return null;
    var hit = null;
    SC.bonus.groups.forEach(function (g) { (g.options || []).forEach(function (o) { if (o.itemName === name) hit = o; }); });
    return hit;
  }
  function bonusOn(name) { var o = bonusOf(name); if (o) C().applyStatusChange(o); return o; }
  // Vitality gained, as the HUD caps it (Wounds lost come off maximum Vitality): the line says so when the cap bites
  function vitalityLine(roll, before, after, max) {
    var got = Math.max(0, after - before);
    return roll.text + ": you gain " + got + " Vitality" + (got < roll.total ? " (your maximum Vitality, " + max + " with the Wounds you have lost, caps it)" : "") + ".";
  }
  function vitNow() { var c = EN.store.active(), d = eng().derive(c), s = C().state(c, d); return { vit: s.vit, max: s.vitMax }; }
  function levelOf(ch, cond) { return (ch.conditions || []).indexOf(cond) !== -1 ? ((ch.conditionLevels || {})[cond] || 1) : 0; }
  function strainUp(n) { store.update(function (c) { var s = eng().mergeStrain(c); eng().setStrainStage(c, Math.min(5, s + (n || 1))); }); }
  function strainBtn(label) { return { label: label || "+1 STRAIN", title: "Take 1 Strain", run: function () { strainUp(1); EN.ui.toast("1 Strain taken."); } }; }
  function lasting(name, lines) {
    var o = bonusOn(name);
    lines.push(o ? "On in Status Changes: " + name + (o.endsOn ? " (ends: " + o.endsOn + ")" : "") + ". Clear it there when it ends." : "Track it by hand: " + name + ".");
    return lines;
  }

  /* What each piece does. run(x) gets { ch, d, s (the HUD's state: wounds, vit...), me (true when it goes on this sheet) } and answers
     { lines: [what happened, in order], actions: [{ label, run }] for a drawback the player decides, short: a few words for the toast }
     or { refuse: why } to keep the piece. `target` marks the pieces that can go on someone else. */
  var SPECS = {
    "Vita-Pop": { act: "Action", run: function (x) {
      var r = roll(1, 6); C().gainVigor(r.total);
      return { short: "+" + r.total + " Vigor", lines: [r.text + ": you gain " + r.total + " Vigor (Vigor doesn't stack; you keep the higher).", "One Vita-Pop per scene."] };
    } },
    "Trauma Slap Patch": { act: "Swift Action", target: true, run: function (x) {
      if (!x.me) {
        var a = roll(1, 6), b = roll(1, 4);
        return { short: "rolled for them", lines: ["With any Wounds left: " + a.text + ": they gain " + a.total + " Vigor.", "At 0 Wounds instead: " + b.text + ": they gain " + b.total + " Vitality and are Stabilized, still Unconscious.", "One Trauma Slap Patch per Freelancer per scene."] };
      }
      if (x.s.wounds <= 0) {
        var v = roll(1, 4), b0 = vitNow();
        C().applyHeal(x.ch, x.d, v.total);
        var b1 = vitNow();
        store.update(function (c) { c.stable = true; c.deathSaves = { s: 0, f: 0 }; });
        C().addCondition("Unconscious");
        return { short: "+" + Math.max(0, b1.vit - b0.vit) + " Vitality, Stabilized", lines: [vitalityLine(v, b0.vit, b1.vit, b1.max), "You are Stabilized, and still Unconscious."] };
      }
      var g = roll(1, 6); C().gainVigor(g.total);
      return { short: "+" + g.total + " Vigor", lines: [g.text + ": you gain " + g.total + " Vigor.", "One Trauma Slap Patch per scene."] };
    } },
    "Med Foam Canister": { act: "Action", target: true, run: function (x) {
      var p = prof(x.d, "medtech"), r = roll(1, 6, p);
      if (!x.me) return { short: "rolled for them", lines: ["They recover 1 Wound.", r.text + " (your Medtech Proficiency Bonus): they gain " + r.total + " Vigor.", "Any Bleeding or ongoing open-wound damage on them ends."] };
      C().healWounds(x.ch, x.d, 1);
      C().gainVigor(r.total);
      if (levelOf(x.ch, "Bleeding")) C().setCondLevel("Bleeding", 0);
      return { short: "+1 Wound, +" + r.total + " Vigor", lines: ["You recover 1 Wound.", r.text + " (Medtech Proficiency Bonus): you gain " + r.total + " Vigor.", "Any Bleeding ends."] };
    } },
    "Detox Patch": { act: "Action", target: true, run: function (x) {
      if (!x.me) return { short: "on them", lines: ["Their Poisoned condition ends (or a similar mild toxin, at the GM's call).", "For 8 hours they roll with Edge on Body Saves against Poisoned and toxic effects."] };
      if (levelOf(x.ch, "Poisoned")) C().setCondLevel("Poisoned", 0);
      return { short: "Poisoned ends", lines: lasting("Detox Patch", ["Your Poisoned condition ends.", "For 8 hours you roll with Edge on Body Saves against Poisoned and toxic effects."]) };
    } },
    "Adrenaline Amp": { act: "Action", target: true, run: function (x) {
      var r = roll(1, 6);
      if (!x.me) return { short: "rolled for them", lines: ["Only on someone at 0 Wounds who is already Stabilized.", "They stand up with 1 Wound and " + r.text + ": " + r.total + " Vitality, Dazed until the end of their next turn.", "Afterward they gain 1 level of Fatigue."] };
      if (x.s.wounds > 0 || !x.ch.stable) return { refuse: "An Adrenaline Amp goes into someone at 0 Wounds who is already Stabilized." };
      var fat = levelOf(x.ch, "Fatigue");
      C().healWounds(x.ch, x.d, 1);
      var a0 = vitNow();
      C().applyHeal(EN.store.active(), eng().derive(EN.store.active()), r.total);
      var a1 = vitNow();
      C().setCondLevel("Unconscious", 0);
      C().addCondition("Dazed");
      C().setCondLevel("Fatigue", fat + 1);
      return { short: "back up, 1 Wound", lines: ["You stand up with 1 Wound.", vitalityLine(r, a0.vit, a1.vit, a1.max), "Dazed until the end of your next turn.", "You gain 1 level of Fatigue."] };
    } },
    "Combat Stim Pack": { act: "Swift Action", run: function () {
      return { short: "3-turn burst", lines: lasting("Combat Stim Pack", ["For 3 turns: +2 Speed, Edge on Initiative rolls and Agility Saves, and one extra Swift Action each turn.", "At the end of your 3rd turn, a DC 12 Body Save, or you are Dazed for 1 round."]) };
    } },
    "Nightwatch Tablets": { act: "Action", run: function () {
      return { short: "4 hours awake", lines: lasting("Nightwatch Tablets", ["For 4 hours you ignore Fatigue 1, and roll with Edge on Wits Saves to stay alert.", "When the last dose wears off, Fatigue returns: a DC 10 Body Save or +1 Fatigue (more for Crash Stacks)."]) };
    } },
    "Flow Tonic Vial": { act: "Action", run: function (x) {
      if (!x.d.flow) return { refuse: "You have no Flow Reservoir for a Flow Tonic to fill." };
      var r = roll(1, 4, 1), max = x.d.flow.max, cur = (x.ch.flow && x.ch.flow.current != null) ? x.ch.flow.current : max, got = Math.max(0, Math.min(max, cur + r.total) - cur);
      store.update(function (c) { c.flow = c.flow || {}; var now = c.flow.current != null ? c.flow.current : max; c.flow.current = Math.min(max, now + r.total); });
      return { short: "+" + got + " FP", lines: [r.text + ": you regain " + got + " FP" + (got < r.total ? " (up to your maximum)" : "") + "."], actions: [strainBtn("+1 STRAIN (not your first vial this scene)")] };
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
    "Flow Surge Ampoule": { act: "Swift Action", run: function () {
      var r = roll(3, 6);
      strainUp(1);
      return { short: "+" + r.total + " to the Invocation", lines: [r.text + ": that Invocation deals +" + r.total + " damage of its type, or grants " + r.total + " Vigor if it heals.", "1 Strain taken (it comes even if the Invocation fails)."] };
    } },
    "Overchannel Amp Shot": { act: "Swift Action", run: function () {
      return { short: "Overchannel", lines: lasting("Overchannel Amp Shot", ["Until the encounter ends: Edge on Flow attack rolls and Esoterica checks, +1 to Flow attack rolls and Flow Save DC, +1d6 Invocation damage once each turn, and once, an Invocation costs 3 fewer FP.", "When it ends: 2 Strain, and a DC 12 Body Save or 1 level of Fatigue. One per Long Rest."]) };
    } },
    "Breach Charge": { act: "Action", run: function (x) {
      var eg = prof(x.d, "engineering"), heavy = roll(4, 6, eg), blast = roll(2, 6), dc = 8 + mod(x.d, "TEC") + eg;
      return { short: "charge blown", lines: ["Placing it cleanly is an Engineering check (a Demolition Kit gives Edge).", "Average or weaker cover, or a standard door: destroyed outright.",
        "Against Heavy or better: " + heavy.text + " (your Engineering Proficiency Bonus) against its Integrity.",
        "Everyone adjacent: Agility Save DC " + dc + " or " + blast.text + " Force damage (" + Math.floor(blast.total / 2) + " on a success)."] };
    } }
  };
  // the pieces that do what their card says and nothing the sheet keeps: spent, and their effect said
  ["Breaching Charge", "Thermite Slug", "Emergency Sealant Foam", "Basic Rations", "Water Purification Tabs", "Ritual Reagent Pouch"].forEach(function (n) {
    SPECS[n] = { run: function () {
      var it = eng().catalogItem ? eng().catalogItem(n) : null;
      return { short: "used", lines: [it && (it.activation || it.effect) ? String(it.activation ? it.activation + " " : "") + (it.effect || "") : "Used."] };
    } };
  });

  // the last use's result, by item name, until the player closes it or uses another
  var _last = null;
  function spec(name) { return SPECS[name] || null; }

  /* USE: perform the piece, then spend one. who: "me" or "other" (a piece with `target`). Answers the result shown on the row. */
  function use(key, who) {
    var ch = store.active(); if (!ch) return null;
    var e = (ch.equipment || []).filter(function (x) { return (x.id || x.name) === key; })[0];
    if (!e || !(e.qty > 0)) return null;
    var sp = SPECS[e.name], d = eng().derive(ch), s = C().state(ch, d);
    var res = sp ? sp.run({ ch: ch, d: d, s: s, me: who !== "other" }) : { short: "used", lines: ["Used."] };
    if (res.refuse) { EN.ui.toast(res.refuse + " It is not used.", 4000); return null; }
    var spent = I().useOne(key, { quiet: true }) || { name: e.name, left: Math.max(0, e.qty - 1) };
    _last = { name: e.name, who: who === "other" ? "other" : "me", lines: res.lines || [], actions: res.actions || [], left: spent.left, at: Date.now() };
    if (spent.left > 0) EN.ui.toast("Used a " + e.name + (who === "other" ? " on someone else" : "") + ": " + (res.short || "done") + ". " + spent.left + " left.", 3500);
    // the last one says so, and for longer: the row stays, gray at 0, with RESTOCK
    else EN.ui.toast("That was your last " + e.name + (res.short ? " (" + res.short + ")" : "") + ". Its row stays on the Loadout at 0; RESTOCK opens the Gray Market on it.", 7000);
    return _last;
  }
  function last(name) { return _last && _last.name === name ? _last : null; }
  function dismiss() { _last = null; }

  return { spec: spec, use: use, last: last, dismiss: dismiss, names: function () { return Object.keys(SPECS); } };
})();
