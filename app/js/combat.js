/* ===========================================================================
   ELYSIUM NIGHTS — Combat tab
   Play-time dashboard: Vitality / Vigor / Wounds, Dying & Death Saves,
   class resource + Flow/Strain, Fatigue, conditions, attacks, rests, and
   collapsible rules references. Reads the same #PRINT record as everything.
   =========================================================================== */
window.EN = window.EN || {};

EN.combatView = (function () {
  var el = EN.ui.el, clear = EN.ui.clear, toast = EN.ui.toast;
  var R = EN.rules, eng = EN.engine, store = EN.store;
  var _open = {};   // collapse state for reference panels (collapsed by default)
  /* ---------- modular layout (drag to rearrange; widths in sixths, 1/6–6/6) -- */
  var LAYOUT_KEY = "en_freelancer_layout_v2";
  var LAYOUT_KEY_V1 = "en_freelancer_layout_v1";
  var DEFAULT_LAYOUT = [
    { key: "matrix", w: 4 }, { key: "vitality", w: 2 },
    { key: "skills", w: 2 }, { key: "flow", w: 6 }, { key: "actions", w: 4 },
    { key: "saves", w: 3 }, { key: "conditions", w: 6 }, { key: "senses", w: 3 },
    { key: "profs", w: 6 }
  ];
  var _dragIdx = null;
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

  var _attrCompact = false;                         // Attribute Matrix view: bars (default) or compact cells
  try { _attrCompact = localStorage.getItem("en_attr_compact_v1") === "1"; } catch (e) {}

  var _editMode = false;                            // layout customization: shows drag/width/view controls
  try { _editMode = localStorage.getItem("en_freelancer_edit_v1") === "1"; } catch (e) {}
  function setEditMode(on) {
    _editMode = on;
    try { localStorage.setItem("en_freelancer_edit_v1", on ? "1" : "0"); } catch (e) {}
  }

  var _fxBox = { mode: "open", closedKey: null };   // sticky Active Condition Effects box ("open"/"min"; closedKey = content-keyed dismiss)
  var _pops = { vit: false, wound: false, rest: false, short: false, settings: false };   // popover state (VITALITY / WOUNDS / REST / ⚙ buttons)
  var _amts = { vit: 1, wound: 1, rd: 1 };                 // remembered amounts per popover
  function closePops() { Object.keys(_pops).forEach(function (k) { _pops[k] = false; }); }
  document.addEventListener("click", function (ev) {
    if (!Object.keys(_pops).some(function (k) { return _pops[k]; })) return;
    if (ev.target.closest && ev.target.closest(".pop-anchor")) return;
    closePops(); EN.app.render();
  });

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
      var left = amount;
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
        if (newWounds <= 0) { c.stable = false; }   // damage while stable returns to Dying
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
  function shortRest(ch, d) {
    store.update(function (c) {
      var s = state(c, d);
      if (s.rd <= 0) { c.resilience.spent = Math.max(0, d.resilienceMax - 1); }  // regain 1 die if empty
      // refresh class resource pool
      if (d.resource) c.resources.current[d.resource.name] = d.resource.max;
      // Shaper: regain FP equal to Flow modifier (min 1)
      if (d.flow) {
        var cur = (c.flow.current != null) ? c.flow.current : d.flow.max;
        c.flow.current = Math.min(d.flow.max, cur + Math.max(1, d.flow.attack));
      }
      // limited-use features keyed to Short Rest / Encounter / Scene refresh now
      if (c.featureUses) Object.keys(c.featureUses).forEach(function (k) {
        if ((c.featureUses[k] || {}).r !== "Long Rest") delete c.featureUses[k];
      });
    });
    toast("Short Rest taken — resource refreshed. Spend Resilience Dice to heal.");
  }
  function longRest(ch, d) {
    store.update(function (c) {
      var s = state(c, d);
      var bodMod = d.attributes.BOD.mod;
      var nw = eng.clamp(s.wounds + Math.max(1, bodMod), 0, s.woundsMax);   // recover Wounds = Body mod (min 1)
      c.wounds.current = nw;
      if (nw > 0) { c.stable = false; c.deathSaves = { s: 0, f: 0 }; }
      c.vitality.current = Math.max(0, (d.vitalityMax || 0) - (s.woundsMax - nw));  // full Vitality (wound-adjusted)
      c.vitality.temp = 0;
      c.resilience.spent = 0;                                               // all Resilience Dice
      c.featureUses = {};                                                   // all limited-use features refresh
      if (d.resource) c.resources.current[d.resource.name] = d.resource.max;
      if (d.flow) c.flow.current = d.flow.max;                              // full Reservoir
      c.flow.strain = Math.max(0, (c.flow.strain || 0) - 1);                // Strain −1
      // Fatigue −1 (tracked as a leveled condition; removed at 0)
      if ((c.conditions || []).indexOf("Fatigue") !== -1) {
        var fl = ((c.conditionLevels || {})["Fatigue"] || 1) - 1;
        if (fl <= 0) { c.conditions = c.conditions.filter(function (n) { return n !== "Fatigue"; }); delete c.conditionLevels["Fatigue"]; }
        else c.conditionLevels["Fatigue"] = fl;
      }
    });
    toast("Long Rest complete — restored and refreshed.");
  }
  function spendResilience(ch, d, count) {
    var s = state(ch, d);
    var n = Math.min(count || 1, s.rd);
    if (n <= 0) { toast("No Resilience Dice left — they refresh on a Long Rest."); return; }
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
  function bar(cur, max, color) {
    var pct = max > 0 ? Math.round(cur / max * 100) : 0;
    return el("div", { style: { height: "10px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: "5px", overflow: "hidden", margin: "6px 0" } }, [
      el("div", { style: { width: pct + "%", height: "100%", background: color, boxShadow: "0 0 10px " + color, transition: "width .25s" } })
    ]);
  }
  /* Shared Vitality bar — Vigor renders as a gold hazard-striped overlay on top
     of the green Vitality fill (left-anchored, same vitMax scale). Vigor is its
     own layer, so burning it never moves the Vitality fill underneath. */
  function vitalityBar(vit, vitMax, vigor) {
    var vPct = vitMax > 0 ? (vit / vitMax * 100) : 0;
    var gPct = vitMax > 0 ? Math.min(100, vigor / vitMax * 100) : (vigor > 0 ? 100 : 0);
    return el("div", { style: { position: "relative", height: "12px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", margin: "5px 0 10px" } }, [
      el("div", { style: { width: vPct + "%", height: "100%", background: "var(--success)", boxShadow: "0 0 8px var(--success)", transition: "width .25s" } }),
      vigor > 0 ? el("div", {
        title: "Vigor " + vigor + " — absorbed before Vitality",
        style: { position: "absolute", left: 0, top: 0, width: gPct + "%", height: "100%",
                 background: "repeating-linear-gradient(45deg, var(--gold) 0 6px, rgba(8,10,14,.35) 6px 10px)",
                 opacity: ".9", boxShadow: "0 0 8px var(--gold)", transition: "width .25s" }
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
    "Drowning": function (e) { e.notes.push("Drowning: Body Save DC 10 (+2/round) or take 1 Wound; at ≤half Wounds also fall Unconscious"); },
    "Drowsy": function (e) { e.init -= 2; e.saveDelta -= 1; e.perceptionSnag = true; e.notes.push("Drowsy: −2 Initiative, −1 all Saves, Snag on Perception; second Drowsy effect → Body Save DC 15 or Unconscious"); },
    "Fatigue": function (e, l) {
      if (l >= 1) { e.speedDelta -= 1; e.snagChk.AGI = true; }
      if (l >= 2) { e.speedDelta -= 2; e.snagChk.BOD = true; e.snagAtk = true; }
      if (l >= 3) { e.speedHalved = true; e.snagSave.BOD = e.snagSave.AGI = true; }
      if (l >= 4) e.derived.push({ name: "Drowsy", from: "Fatigue " + l });
      if (l >= 5) e.derived.push({ name: "Hallucinating", from: "Fatigue " + l });
      if (l >= 6) e.derived.push({ name: "Unconscious", from: "Fatigue 6 — Helpless" });
    },
    "Frightened": function (e) { e.snagAtk = true; e.snagChk.ALL = true; e.notes.push("Frightened: can't approach the source; must retreat to cover within 10m"); },
    "Grappled": function (e) { e.speedZero = true; e.notes.push("Grappled: Speed 0; Action + contested Brawl/Acrobatics to escape"); },
    "Hallucinating": function (e) { e.perceptionSnag = true; e.snagChk.WIT = true; e.notes.push("Hallucinating: treat false stimuli as real; Wits Save DC 12 to ignore them"); },
    "Hardwired": function (e) { e.notes.push("Hardwired: targetable by Quick Hacks; Snag on saves vs EMP / viruses / Electromagnetic"); },
    "Incapacitated": function (e) { e.cannotAct = true; e.notes.push("Incapacitated: no Actions of any kind; minor Free Actions only"); },
    "Invisible": function (e) { e.notes.push("Invisible: Edge on Stealth; attacks against you have Snag"); },
    "Lagged": function (e) { e.notes.push("Lagged: your actions resolve at the END of the round"); },
    "LinkDeath": function (e) { e.notes.push("LinkDeath: 2d6+ Psychic on failed save and Unconscious; Wits Save at end of turn to wake"); },
    "Mutating": function (e, l) { e.notes.push("Mutating " + l + " stack(s): Body Save DC " + (10 + l) + " at start of turn or suffer growth effects"); },
    "Panic": function (e) { e.notes.push("Panic: Wits Save DC 12 at start of turn or roll 1d6 — Flight / Fight / Freeze"); },
    "Paralyzed": function (e) { e.cannotAct = true; e.speedZero = true; e.edgeToAttackers = true; e.autoFailBodAgiSaves = true; e.notes.push("Paralyzed: auto-fail Body & Agility saves; melee vs you may crit"); },
    "Poisoned": function (e) { e.snagAtk = true; e.snagChk.ALL = true; e.snagSave.BOD = true; },
    "Prone": function (e) { e.edgeToAttackers = true; e.notes.push("Prone: melee vs you has Edge, ranged vs you has Snag; stand for half movement or a Swift"); },
    "Restrained": function (e) { e.speedZero = true; e.snagAtk = true; e.snagSave.AGI = true; e.edgeToAttackers = true; },
    "Shaken": function (e) { e.snagAtk = true; e.snagChk.WIT = true; e.notes.push("Shaken: cannot take the Help Action or benefit from Edge from any source"); },
    "Signal Jammed": function (e) { e.notes.push("Signal Jammed: no remote devices, drones, or wireless cyberware; wired still works"); },
    "Staggered": function (e) { e.speedHalved = true; e.noSwift = true; e.noImpulse = true; e.notes.push("Staggered: Staggered again → Stunned"); },
    "Strain": function (e, l) {
      if (l >= 1) e.notes.push("Strain — Ripple: Snag on Invocation rolls");
      if (l >= 2) e.notes.push("Strain — Wave: all Invocations cost +1 FP");
      if (l >= 3) e.notes.push("Strain — Surge: Breakflow Check whenever you Overdraw");
      if (l >= 4) e.notes.push("Strain — Rend: Breakflow Check whenever you spend FP");
      if (l >= 5) { e.derived.push({ name: "Breakflow", from: "Strain 5 — Collapse" }); e.derived.push({ name: "Unconscious", from: "Strain 5 — Collapse" }); }
    },
    "Stunned": function (e) { e.speedZero = true; e.noImpulse = true; e.snagSave.BOD = e.snagSave.AGI = true; e.edgeToAttackers = true; e.notes.push("Stunned: no Move; only one Action OR Swift this turn"); },
    "Soul Shock": function (e) { e.snagChk.MYS = e.snagChk.WIT = true; e.notes.push("Soul Shock: +1d6 damage per repeat instance before resting"); },
    "Unconscious": function (e) { e.cannotAct = true; e.speedZero = true; e.edgeToAttackers = true; e.autoFailBodAgiSaves = true; e.notes.push("Unconscious: drop items, fall Prone, unaware; lose Focus/Sustains and network links"); }
  };

  // Aggregate effects across ALL active conditions, recursively including
  // derived conditions' own riders (e.g. Fatigue 4 → Drowsy → −2 Initiative).
  function condEffects(ch) {
    var e = { init: 0, saveDelta: 0, speedDelta: 0, speedHalved: false, speedZero: false,
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
  function adjSpeed(base, e) {
    if (e.speedZero) return 0;
    var s = base + e.speedDelta;
    if (e.speedHalved) s = Math.min(s, Math.floor(base / 2));
    return Math.max(3, s);
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
    "Confused": ["Special", "End of turn Wits DC 15"], "Critical Condition": ["Until Healed", "Heal above 50% Wounds"],
    "Critical Wound": ["Persistent", "Surgery / Regenerative Tech"], "Cursed": ["Persistent", "Ritual / Rare Relics"],
    "Dazed": ["1 Round", "End of turn Wits DC 12"], "Drowning": ["Special", "Access to breathable air"],
    "Drowsy": ["Persistent", "Exertion / Action to wake"], "Fatigue": ["Until Restored", "Long Rest / Treatment / Medtech"],
    "Frightened": ["Until Save", "End of turn Wits / Charm DC 15"], "Grappled": ["Until Escaped", "Contested Brawl / Acrobatics"],
    "Hallucinating": ["Persistent", "Purge / Source Expiration"], "Hardwired": ["Permanent", "Uninstall Cyberware"],
    "Incapacitated": ["Until Freed", "Removal of source"], "Invisible": ["Until Revealed", "Narrative / Tech Reveal"],
    "Lagged": ["Persistent", "Exit Zone / Purge"], "LinkDeath": ["Until Save", "End of turn Wits Save"],
    "Panic": ["Special", "End of turn Wits DC 12"], "Paralyzed": ["Until Save", "Body Save (varies)"],
    "Poisoned": ["Varies", "Antitoxin / Medtech Check"], "Prone": ["Until Stand", "Half Move or Swift Action"],
    "Restrained": ["Until Freed", "Strength / Brawl Check"], "Shaken": ["1–3 Rounds", "End of turn Wits DC 12"],
    "Signal Jammed": ["Until Jam Ends", "Move / Disable Jammer"], "Soul Shock": ["Until Short Rest", "Short Rest"],
    "Staggered": ["1–2 Rounds", "End of turn Wits DC 10"], "Strain": ["Until Restored", "Long Rest / Ritual"],
    "Stunned": ["1 Round", "End of turn Body DC 15"], "Unconscious": ["Until Revived", "Healing / Allied Action"]
  };
  function condLevel(ch, name) { return (ch.conditionLevels || {})[name] || 1; }
  function setCondLevel(name, lvl) {
    store.update(function (c) {
      c.conditionLevels = c.conditionLevels || {};
      var max = LEVELED[name] ? LEVELED[name].max : 1;
      if (lvl <= 0) { c.conditions = (c.conditions || []).filter(function (n) { return n !== name; }); delete c.conditionLevels[name]; }
      else c.conditionLevels[name] = Math.min(max, lvl);
    });
  }

  /* ---------- action classification (for the tabbed Actions panel) ---------- */
  var _tab = "ALL";
  var _featTab = "features";   // Features (active attacks & interactions) | Abilities (passives)

  /* resource features that bundle several tricks — break them out into their own
     entries, each tagged with the resource cost chip, instead of one wall of text */
  var FEATURE_EXPANSIONS = {
    "Moxie": {
      chip: "1 MOXIE",
      subs: [
        { name: "Lucky Break", cost: "Free",
          text: "When you make an attack roll, ability check, or saving throw, spend 1 Moxie to roll an additional d20 and choose which die to use — even if already rolling with Edge. Breaks the 2d20 cap (Edge + Lucky Break = 3d20, keep whichever you like)." },
        { name: "Jinx", cost: "Impulse",
          text: "When an enemy you can see makes an attack roll or saving throw, spend 1 Moxie to force them to roll an additional d20 and use the lowest — even if already rolling with Snag (3d20, worst result)." },
        { name: "Slip the Blow", cost: "Impulse",
          text: "When hit by an attack you can see, spend 1 Moxie to gain Resistance to that attack's damage and immediately move 1 space without provoking opportunity attacks." },
        { name: "Smash and Grab", cost: "Action",
          text: "Spend 1 Moxie; your Speed doubles this turn and your movement does not provoke opportunity attacks (you cannot end in an enemy's space). Make one weapon attack during the move; on a hit, shove the target 1 space or snatch one small, unsecured item they carry (contested Sleight to lift anything secured)." },
        { name: "Bad Feeling", cost: "Impulse",
          text: "When an enemy moves within your reach, or you are targeted by an attack you can see, spend 1 Moxie to move up to half your Speed without provoking — break away before it lands. Reflexes, not teleportation." },
        { name: "Shake It Off", cost: "Swift",
          text: "Spend 1 Moxie to end one condition clouding your senses or footing, such as Staggered, Shaken, or Dazed." },
        { name: "Ace Up the Sleeve", cost: "Free",
          text: "Spend 1 Moxie to reveal you saw this coming: produce a plausible mundane item you could have stashed, call in a minor favor, or point out a small environmental out (GM approval). Never conjures gear you could not carry; never rewrites the scene." },
        { name: "Kick Them While They're Down", cost: "Impulse",
          text: "When an enemy within reach misses you with a melee attack, or an ally scores a Critical Hit on an enemy within your reach, spend 1 Moxie to make a single weapon attack against that enemy that automatically qualifies for your Cheap Shot damage." }
      ]
    }
  };
  function actionCost(text) {
    if (/Impulse Action/i.test(text || "")) return "Impulse";
    if (/Swift Action/i.test(text || "")) return "Swift";
    if (/Free Action/i.test(text || "")) return "Free";
    if (/as an Action|use your Action|spend (an|your) Action|standard Action|as a single Action|take the Attack Action/i.test(text || "")) return "Action";
    return "Passive";
  }
  function isLimited(text) {
    return /once per|per Long Rest|per Short Rest|per Encounter|number of times equal|per scene|per turn/i.test(text || "");
  }
  /* parse "uses per rest" specs out of feature text — covers every phrasing in the data:
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
  var COST_COLOR = { Action: "var(--accent)", Swift: "var(--gold)", Impulse: "var(--flow)", Free: "var(--success)", Active: "var(--accent)", Passive: "var(--text3)" };
  function actionEntry(id, name, cost, src, text, limited, chip, uses) {
    var open = !!_open[id];
    var usesRow = null;
    if (uses && uses.max > 0) {
      var boxes = [];
      for (var i = 1; i <= uses.max; i++) {
        (function (i) {
          var used = i <= uses.spent;
          boxes.push(el("span", {
            title: used ? "Used — click to undo" : "Click to spend a use",
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
    return el("div.feature", { style: { borderLeftColor: COST_COLOR[cost] || "var(--border2)" } }, [
      el("h4", { style: { cursor: "pointer" }, onclick: function () { _open[id] = !open; EN.app.render(); } }, [
        el("span", null, [el("span.collapse-caret", { text: open ? "▾" : "▸" }), document.createTextNode(" " + name),
          el("span.chip", { style: { marginLeft: "8px", fontSize: "9.5px", color: COST_COLOR[cost], borderColor: COST_COLOR[cost] }, text: cost.toUpperCase() }),
          chip ? el("span.chip", { title: "Spends the class resource", style: { marginLeft: "4px", fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" }, text: chip }) : null]),
        el("span.src", { text: src || "" })
      ]),
      open ? el("p", { text: text || "" }) : null,
      usesRow
    ]);
  }
  function attackRow(name, hit, note, color, snagWhy) {
    return el("div.row.wrap", { style: { gap: "10px", alignItems: "center", padding: "8px 4px", borderBottom: "1px solid rgba(35,48,68,.5)" } }, [
      el("span", { style: { flex: 1, minWidth: "130px", fontWeight: 600 }, text: name }),
      snagWhy ? snagChip(snagWhy) : null,
      el("span.mono", { style: { fontSize: "18px", color: color || "var(--accent)", minWidth: "48px", textAlign: "center" }, text: hit }),
      el("span.help", { style: { margin: 0, flex: 2 }, text: note })
    ]);
  }

  /* ---------- equipped-weapon attacks: normalization + ammo/fire-mode ----------
     Normalization spec validated against the rulebook reference tables (72/73 weapons;
     the lone flag, Harmonic Edge range, is a known reference inconsistency the
     consistent reach rule resolves correctly). */
  var FIRING_MODES = ["Single Shot", "Semi-Automatic", "Burst", "Full-Auto"];
  // per-shot ammo cost. Single Shot & Semi-Automatic each spend 1 round per shot;
  // Semi-Auto differs by allowing a second shot via a Swift Action (fire it again), so
  // each tap here deducts 1. Burst (3) and Full-Auto (8) spend their full volley per use.
  var MODE_COST = { "Single Shot": 1, "Semi-Automatic": 1, "Burst": 3, "Full-Auto": 8 };
  var TRAIT_DISPLAY = { "Nonlethal": "Nonlethal Damage" };   // display rename to match reference

  function catWeapons() {
    var g = EN.gearCatalog || {};
    return [].concat((g.melee && g.melee.items) || [], (g.ranged && g.ranged.items) || [], (g.signature && g.signature.items) || []);
  }
  function findWeapon(name) { return catWeapons().find(function (x) { return x.name === name; }); }
  function ammoCatalog() { return (EN.gearCatalog.ammo && EN.gearCatalog.ammo.items) || []; }
  function munitions() { return (EN.gearCatalog.signature && EN.gearCatalog.signature.munitions) || []; }
  function ownedQty(ch, name) { var e = (ch.equipment || []).find(function (x) { return x.name === name; }); return e ? (e.qty || 0) : 0; }

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

  /* the weapon's base feed — what a plain reload consumes. "Standard" for Plentiful
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
    return "Standard";                                                   // Plentiful — free top-off
  }

  /* non-mutating read of a weapon's magazine state (defaults: full, cheapest mode, base feed) */
  function readAmmo(ch, it) {
    var st = (ch.weaponAmmo && ch.weaponAmmo[it.name]) || {};
    var cap = capacityOf(it), modes = weaponModes(it), base = baseFeedName(it);
    var mode = (st.mode && modes.indexOf(st.mode) !== -1) ? st.mode : defaultMode(it);
    var cur = typeof st.cur === "number" ? Math.max(0, Math.min(st.cur, cap)) : cap;
    var ammoType = st.ammoType || base;
    // a special round that's run dry defaults back to the weapon's plentiful Standard feed
    if (ammoType !== "Standard" && ammoType !== base && base === "Standard" && ownedQty(ch, ammoType) <= 0) ammoType = "Standard";
    return { cur: cur, cap: cap, mode: mode, ammoType: ammoType, base: base, modes: modes };
  }
  function writeAmmo(wname, patch) {
    var it = findWeapon(wname); if (!it) return;
    store.update(function (c) {
      c.weaponAmmo = c.weaponAmmo || {};
      var cur = readAmmo(c, it);
      var a = c.weaponAmmo[wname] || { cur: cur.cur, mode: cur.mode, ammoType: cur.ammoType };
      if (typeof a.cur !== "number") a.cur = cur.cur;
      Object.keys(patch).forEach(function (k) { a[k] = patch[k]; });
      a.cur = Math.max(0, Math.min(a.cur, capacityOf(it)));   // keep persisted value in range
      c.weaponAmmo[wname] = a;
    });
  }
  function fireWeapon(wname) {
    var it = findWeapon(wname); if (!it) return;
    var st = readAmmo(store.active(), it), cost = costFor(it, st.mode);
    if (st.cur < cost) { toast(it.name + " — needs " + cost + " for " + (st.mode || "Fire") + ", magazine has " + st.cur + ". Switch mode or reload."); return; }
    writeAmmo(wname, { cur: Math.max(0, st.cur - cost) });
  }
  function reloadWeapon(wname) {
    var it = findWeapon(wname); if (!it) return;
    if ((it.traits || []).indexOf("Disposable") !== -1) { toast(it.name + " is Disposable — spent once fired, it cannot be reloaded."); return; }
    var ch = store.active(), st = readAmmo(ch, it), base = st.base;
    var type = st.ammoType;
    if (type === "Standard" && base !== "Standard") type = base;        // coerce to the weapon's only (counted) feed
    var msg;
    if (type !== "Standard" && ownedQty(ch, type) <= 0) {              // the chosen special round is depleted
      if (base === "Standard") { msg = "Out of " + type + " — reloaded with Standard."; type = "Standard"; }  // fall back to plentiful
      else { toast("Out of ammo — no " + type + " in stash. Acquire it in Inventory."); return; }            // no plentiful variant: keep RELOAD
    }
    var needsStash = type !== "Standard";                               // counted munition / specialty round → spend from stash
    store.update(function (c) {
      c.weaponAmmo = c.weaponAmmo || {};
      if (needsStash) {
        var e = (c.equipment || []).find(function (x) { return x.name === type; });
        if (e) { e.qty = (e.qty || 1) - 1; if (e.qty <= 0) c.equipment = c.equipment.filter(function (x) { return x !== e; }); }
      }
      c.weaponAmmo[wname] = { cur: capacityOf(it), mode: st.mode, ammoType: type };
    });
    toast(msg || (it.name + " reloaded — " + capacityOf(it) + " " + (it.ammoUnit || "rounds") + (type !== "Standard" ? " · " + type : "") + "."));
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
    var g = EN.gearCatalog || {}, defs = {};
    [(g.melee && g.melee.traits), (g.ranged && g.ranged.traits), (g.signature && g.signature.traits)].forEach(function (dd) {
      if (dd) Object.keys(dd).forEach(function (k) { defs[k] = dd[k]; });
    });
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
      mount.appendChild(el("div.muted-box", { style: { marginTop: "40px", padding: "40px" }, text: ch ? "Finish your #PRINT first — pick a class to power the combat dashboard." : "No Freelancer on file — register one on the #PRINT tab." }));
      return;
    }
    var d = eng.derive(ch);
    var s = state(ch, d);
    var fx = condEffects(ch);
    var blocks = [];

    /* sticky Active Condition Effects readout — pinned just under the tab rail */
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
                fxBtn(fxMin ? "▾" : "—", fxMin ? "Expand" : "Minimize", function () { _fxBox.mode = fxMin ? "open" : "min"; EN.app.render(); }),
                fxBtn("✕", "Close — reappears when active effects change", function () { _fxBox.closedKey = fxKey; EN.app.render(); })
              ])
            ])
          ].concat(fxMin ? [] : fx.notes.map(function (n) { return el("p.help", { style: { margin: "2px 0" }, text: "• " + n }); })))
        ]));
      }
    }

    blocks.push(el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" }, html: 'FREELANCER <span class="dim3" style="font-size:13px">// live status · ' +
        ((ch.identity && ch.identity.handle) || (ch.name || "Unnamed").split(" ")[0]) + "</span>" }),
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
        el("div.pop-anchor", { style: { position: "relative" } }, [
          el("button.btn.sm", { title: "Sheet settings",
            style: _pops.settings ? { color: "var(--accent)", borderColor: "var(--accent)" } : null,
            onclick: function () { var was = _pops.settings; closePops(); _pops.settings = !was; EN.app.render(); } }, "⚙"),
          _pops.settings ? el("div", { style: { position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 30, width: "232px",
                                                display: "flex", flexDirection: "column", gap: "8px", padding: "10px",
                                                background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "4px",
                                                boxShadow: "0 8px 24px rgba(0,0,0,.55)", textAlign: "left" } }, [
            el("label.fl", { style: { margin: 0 }, text: "Sheet Settings" }),
            el("button.btn.sm" + (_editMode ? ".primary" : ""), {
              title: "Show the layout controls on every panel — drag to rearrange, − / + width, attribute view toggle",
              style: { justifyContent: "center" },
              onclick: function () { setEditMode(!_editMode); EN.app.render(); } },
              _editMode ? "🔧 CUSTOMIZE LAYOUT: ON" : "🔧 CUSTOMIZE LAYOUT: OFF"),
            _editMode ? el("button.btn.sm", { title: "Restore the default panel arrangement and widths", style: { justifyContent: "center" },
              onclick: function () { try { localStorage.removeItem(LAYOUT_KEY); localStorage.removeItem(LAYOUT_KEY_V1); } catch (e) {} _pops.settings = false; EN.app.render(); } }, "⊞ RESET LAYOUT") : null,
            el("p.help", { style: { margin: 0 }, text: _editMode
              ? "Drag ⠿ on a panel to rearrange; − / + sets its width (1–6 columns)."
              : "Customization is off — panels are locked and headers slimmed for play." })
          ]) : null
        ])
      ])
    ]));

    /* status strip */
    blocks.push(el("div.stat-row", { style: { marginBottom: "16px" } }, [
      EN.ui.stat("DEF", d.defense, d.defenseAttr === "BOD" ? "Body" : "Agility"),
      (function () { var fx0 = condEffects(ch); var sp = adjSpeed(d.speed, fx0);
        var n = EN.ui.stat("SPD", sp, sp < d.speed ? "of " + d.speed + " — conditions" : "spaces");
        if (sp < d.speed) n.querySelector(".v").style.color = "var(--danger)";
        return n; })(),
      (function () { var iv = d.attributes.AGI.mod + fx.init;
        var n = EN.ui.stat("INIT", eng.fmtMod(iv), fx.init ? "Agility " + eng.fmtMod(fx.init) + " cond." : "Agility");
        if (fx.init < 0) n.querySelector(".v").style.color = "var(--danger)";
        return n; })(),
    ]));

    /* attribute matrix — single biometric-profile panel with gradient bars */
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
    var skillRows = d.skills.map(function (s) {
      return el("div.row", { style: { gap: "8px", alignItems: "center", padding: "5px 4px", borderBottom: "1px solid rgba(35,48,68,.4)" } }, [
        el("span", { title: R.profTiers[s.tier].name, style: { width: "10px", height: "10px", borderRadius: "50%", flex: "0 0 auto", border: "1px solid " + TIERC[s.tier], background: s.tier === "untrained" ? "transparent" : TIERC[s.tier] } }),
        el("span.att", { text: s.attr }),
        el("span", { style: { flex: 1 }, text: s.name }),
        (function () {
          var why = s.untrained ? "Untrained — roll with Snag (or +2 Snag Dice in pools)" :
            fx.snagChk.ALL ? "Condition — Snag on all checks" :
            fx.snagChk[s.attr] ? "Condition — Snag on " + s.attrName + " checks" :
            (s.key === "perception" && fx.perceptionSnag) ? "Condition — Snag on Perception checks" : null;
          return why ? snagChip(why) : null;
        })(),
        el("span.mono", { style: { color: "var(--accent)" }, text: eng.fmtMod(s.total) })
      ]);
    });
    var sectionEls = {};   // modular sections — placed by the saved layout at the end of render
    var ATTR_GRAD = "linear-gradient(90deg, #ff2e88 0%, #8b3dff 55%, #00b3ff 100%)";
    var attrBody;
    if (_attrCompact) {
      /* compact cells: abbr / big mod / tier-colored score capsule / mini gradient strip */
      attrBody = [el("div.attr-grid", null, R.attributes.map(function (a) {
        var sc = d.attributes[a.key].score, mod = d.attributes[a.key].mod;
        var t = attrTier(sc);
        var pct = Math.max(4, Math.min(100, sc / 20 * 100));
        return el("div.attr-cell", { title: a.blurb + " " + (t.icon || "") + t.label + " — score " + sc + " · modifier " + eng.fmtMod(mod) + "." }, [
          el("div.abbr", { text: a.name.toUpperCase() }),
          el("div.mod", { text: eng.fmtMod(mod) }),
          el("div", { style: { display: "flex", justifyContent: "center", marginTop: "3px" } }, [
            el("span.mono", { style: { fontSize: "11.5px", padding: "1px 12px", borderRadius: "9px", border: "1px solid " + t.color, color: t.color, boxShadow: "0 0 6px " + t.color + "33" }, text: String(sc) })
          ]),
          el("div", { style: { height: "3px", margin: "8px 6px 0", borderRadius: "2px", background: "var(--bg1)", overflow: "hidden" } }, [
            el("div", { style: { width: pct + "%", height: "100%", background: ATTR_GRAD } })
          ])
        ]);
      }))];
    } else {
      attrBody = R.attributes.map(function (a) {
        var sc = d.attributes[a.key].score, mod = d.attributes[a.key].mod;
        var t = attrTier(sc);
        var pct = Math.max(4, Math.min(100, sc / 20 * 100));
        var peak = sc >= 20;
        return el("div", { title: a.blurb + " Score " + sc + " · modifier " + eng.fmtMod(mod) + ".",
                           style: { display: "grid", gridTemplateColumns: "68px 1fr 46px", columnGap: "12px", alignItems: "center", padding: "7px 4px", borderBottom: "1px solid rgba(35,48,68,.5)" } }, [
          el("span", { style: { fontWeight: 600 }, text: a.name }),
          el("div", null, [
            el("div", { style: { position: "relative", height: "10px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: "5px", overflow: "hidden" } }, [
              el("div", { style: { width: pct + "%", height: "100%", background: ATTR_GRAD,
                                   boxShadow: "0 0 8px rgba(120,80,255,.5)", transition: "width .25s" } })
            ]),
            el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "1px" } }, [
              el("span.mono", { style: { fontSize: "9px", color: "var(--text4)" }, text: "1" }),
              el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".12em", color: t.color }, text: (t.icon || "") + t.label }),
              el("span.mono", { style: { fontSize: "10px", color: "var(--text3)" }, text: String(sc) })
            ])
          ]),
          el("span.mono", { style: { fontSize: peak ? "19px" : "16px", textAlign: "center", color: "var(--accent)",
                                     border: peak ? "1px solid var(--accent)" : "none", borderRadius: "4px", padding: peak ? "1px 4px" : "0",
                                     boxShadow: peak ? "0 0 10px rgba(0,229,255,.4)" : "none", justifySelf: "end" }, text: eng.fmtMod(mod) })
        ]);
      });
    }
    var attrToggle = _editMode ? el("button", {
      title: _attrCompact ? "Switch to bar view" : "Switch to compact view",
      onclick: function () { _attrCompact = !_attrCompact; try { localStorage.setItem("en_attr_compact_v1", _attrCompact ? "1" : "0"); } catch (e) {} EN.app.render(); },
      style: { background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: "3px",
               width: "18px", height: "18px", lineHeight: "1", fontSize: "10px", cursor: "pointer", padding: 0, flex: "0 0 auto" }
    }, _attrCompact ? "▤" : "▦") : null;
    sectionEls.matrix = EN.ui.panel("Attribute Matrix", "BIOMETRIC PROFILE", attrBody, { corners: true, headerRight: attrToggle ? [attrToggle] : null });
    /* versatile skills — Insight · Performance · Intimidation (ported from the original sheet):
       pick an Attribute + a Proficient parent skill; the combo resolves to a named technique
       (or refuses — some pairings Do Not Work). Roll = attr mod + parent tier bonus. */
    function versatileBlock() {
      var V = EN.versatile;
      if (!V) return null;
      var profSkills = d.skills.filter(function (s) { return s.tier !== "untrained"; });
      var attrName = function (k) { var a = R.attributes.find(function (x) { return x.key === k; }); return a ? a.name : k; };
      var kids = [
        el("div.section-title", { style: { margin: "12px 0 2px" } }, [document.createTextNode("Versatile Skills"), el("span.line")]),
        el("p.help", { style: { margin: "0 0 2px" }, html: "<b>Insight · Performance · Intimidation</b> — " + V.note })
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
          [el("option", { value: "", text: "— Choose Attr —" })].concat(R.attributes.map(function (a) {
            return el("option", { value: a.key, selected: a.key === slot.attr, text: a.name });
          })));
        var skillSel = el("select", { style: { width: "100%", fontSize: "12px" }, onchange: function () { setSlot("skill", this.value); } },
          [el("option", { value: "", text: "— Choose Skill —" })].concat(profSkills.length ? profSkills.map(function (s) {
            var works = !slot.attr || !!V.db[slot.attr + "|" + s.name + "|" + type];
            return el("option", { value: s.name, selected: s.name === slot.skill, text: s.name + (works ? "" : " ✗") });
          }) : [el("option", { disabled: true, text: "No proficient skills yet" })]));
        var resultBlock = null;
        if (slot.attr && slot.skill) {
          var entry = V.db[slot.attr + "|" + slot.skill + "|" + type];
          var sk = profSkills.find(function (s) { return s.name === slot.skill; });
          if (!entry) {
            resultBlock = el("div", { style: { padding: "6px 10px", background: "rgba(239,68,68,.08)", border: "1px solid var(--danger)", borderRadius: "4px", fontSize: "11px", color: "var(--danger)", marginTop: "6px" } },
              "This combination does not work — " + attrName(slot.attr) + " cannot apply to " + slot.skill + " for " + label + ".");
          } else if (!sk) {
            resultBlock = el("p.help", { style: { margin: "6px 0 0", color: "var(--warn)" }, text: "Requires Proficiency in " + slot.skill + " — train it on the #PRINT tab." });
          } else {
            var tierBonus = R.profTiers[sk.tier].d20;
            var mod = d.attributes[slot.attr].mod;
            var focus = (ch.skillFocuses || []).find(function (f) { return f.skill === sk.key; });
            var spec = (ch.specializations || []).find(function (f) { return f.skill === sk.key; });
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
                focus ? el("span.chip", { title: "Skill Focus on " + sk.name + " carries over", style: { fontSize: "9px", color: "var(--accent)", borderColor: "var(--accent)" }, text: "EDGE" + (focus.aspect ? " (" + focus.aspect + ")" : "") }) : null,
                spec ? el("span.chip", { title: "Specialization on " + sk.name + " carries over", style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" }, text: "CRIT 19–20" + (spec.aspect ? " (" + spec.aspect + ")" : "") }) : null
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
    sectionEls.skills = EN.ui.panel("Skills", "d20 BONUS · DOT = TIER", [el("div", { style: { columnCount: 1 } }, skillRows), versatileBlock()], { corners: true });

    /* state banners */
    if (s.dying) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--danger)", color: "var(--danger)", marginBottom: "12px", textAlign: "left" },
        html: "☠ <b>DYING</b> — Unconscious at 0 Wounds. Each turn: Death Save (Body, DC 10). Three successes = Stable, three failures = dead. Any damage = one failure." }));
    } else if (s.stable) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--warn)", color: "var(--warn)", marginBottom: "12px", textAlign: "left" },
        html: "◌ <b>STABLE</b> — Unconscious at 0 Wounds, no longer Dying. Restoring even 1 Wound wakes you with that many Wounds." }));
    } else if (s.critical) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--warn)", color: "var(--warn)", marginBottom: "12px", textAlign: "left" },
        html: "⚠ <b>CRITICAL CONDITION</b> — at 50% or less of total Wounds." }));
    }
    if (s.bloodied) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--ember)", color: "var(--ember)", marginBottom: "12px", textAlign: "left" },
        html: "🩸 <b>BLOODIED</b> — Vitality is 0. You stay conscious; further damage becomes Wound damage." }));
    }
    if (fx.cannotAct) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--danger)", color: "var(--danger)", marginBottom: "12px", textAlign: "left" },
        html: "⛔ <b>CANNOT ACT</b> — an active condition prevents you from taking actions." }));
    }
    if (fx.edgeToAttackers) {
      blocks.push(el("div.muted-box", { style: { borderColor: "var(--danger)", color: "var(--danger)", marginBottom: "12px", textAlign: "left" },
        html: "🎯 <b>EDGE TO ATTACKERS</b> — attacks against you gain Edge from an active condition." }));
    }

    /* vitality + vigor + wounds — compact console; controls live in popovers on the bar labels */
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
            s.vigor ? el("span", { title: "Vigor " + s.vigor + " — absorbed before Vitality. Click to clear.", style: { color: "var(--gold)", cursor: "pointer" }, onclick: function () { store.update(function (c) { c.vitality.temp = 0; }); }, text: "(" + s.vigor + ") " }) : null,
            el("span", { style: { color: "var(--text1)" }, text: s.vit + "/" + s.vitMax })
          ]),
          popAnchor("vit", "var(--success)", "Vigor, healing & damage",
            [
              s.vigor ? el("span", { style: { color: "var(--gold)" }, text: "(VIGOR)" }) : null,
              document.createTextNode("VITALITY")
            ].filter(Boolean),
            [
              railBtn("VIGOR", "var(--accent)", "Gain Vigor equal to the amount below (non-stacking — keeps the higher value; expires end of encounter)", function () {
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
          el("span.help", { style: { margin: 0 }, text: "Death Saves — ✓" }),
          pips(ch.deathSaves.s || 0, 3, "var(--success)", function (n) { store.update(function (c) { c.deathSaves.s = n; if (n >= 3) { c.stable = true; c.deathSaves = { s: 0, f: 0 }; } }); }),
          el("span.help", { style: { margin: 0 }, text: "✗" }),
          pips(ch.deathSaves.f || 0, 3, "var(--danger)", function (n) { store.update(function (c) { c.deathSaves.f = n; }); }),
          s.dying ? el("button.btn.sm", { title: "Stabilize: Medtech/Tech/Flow check DC 10", onclick: function () { store.update(function (c) { c.stable = true; c.deathSaves = { s: 0, f: 0 }; }); toast("Stabilized — unconscious at 0 Wounds."); } }, "STABILIZE") : null
        ]),
        (ch.deathSaves.f || 0) >= 3 ? el("p", { style: { color: "var(--danger)", fontFamily: "var(--mono)", marginTop: "6px" }, text: "✝ THREE FAILURES — the body stops keeping score." }) : null
      ]) : null
    ], { corners: true });

    /* flow / strain (class resource lives in the Actions panel) */
    var trackers = [];
    if (d.flow) {
      var fCur = (ch.flow.current != null) ? ch.flow.current : d.flow.max;
      fCur = eng.clamp(fCur, 0, d.flow.max);
      var strain = ch.flow.strain || 0;
      trackers.push(EN.ui.panel("Flow Reservoir", "DC " + d.flow.dc + " · " + d.flow.attributeName.toUpperCase(), [
        el("div.row.between.wrap", null, [
          el("div.mono", { style: { fontSize: "26px", color: "var(--flow)" }, html: fCur + " <span style='font-size:14px;color:var(--text3)'>/ " + d.flow.max + " FP</span>" }),
          plusMinus(function () { store.update(function (c) { c.flow.current = Math.max(0, fCur - 1); }); },
                    function () { store.update(function (c) { c.flow.current = Math.min(d.flow.max, fCur + 1); }); })
        ]),
        bar(fCur, d.flow.max, "var(--flow)"),
        el("div.row.wrap", { style: { gap: "10px", marginTop: "8px", alignItems: "center" } }, [
          el("span.help", { style: { margin: 0 }, text: "Strain:" }),
          pips(strain, 5, "var(--flow)", function (n) { store.update(function (c) { c.flow.strain = n; }); }),
          strain >= 5 ? el("span", { style: { color: "var(--danger)", fontFamily: "var(--mono)", fontSize: "12px" }, text: "⚡ BREAKFLOW" }) : el("span.help", { style: { margin: 0 }, text: "5 stages → Breakflow" })
        ])
      ]));
    }
    sectionEls.flow = trackers.length ? trackers[0] : null;

    /* conditions */
    var condSel = el("select", { style: { width: "auto", minWidth: "200px" } },
      [el("option", { value: "", text: "— add a condition —" })].concat((EN.conditions || []).map(function (c) {
        return el("option", { value: c.name, disabled: (ch.conditions || []).indexOf(c.name) !== -1, text: c.name });
      })));
    var active = (ch.conditions || []).map(function (name) {
      var info = (EN.conditions || []).find(function (x) { return x.name === name; });
      var lv = LEVELED[name];
      var lvl = lv ? condLevel(ch, name) : 0;
      var stage = lv && lv.names ? lv.names[lvl - 1] : null;
      var severe = lv && lv.severeAt && lvl >= lv.severeAt;
      var open = !!_open["cond-" + name];
      var title = name + (lv ? " " + lvl + (stage ? " — " + stage : "") : "");
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
        severe ? el("p.help", { style: { margin: "4px 0 0", color: "var(--danger)" }, text: "Severe — level 4+ needs professional care or ritual support to recover." }) : null,
        info && open ? el("p", { text: info.text || info.summary || "" }) : null
      ]);
    });
    var applyBtn = el("button.btn.sm.primary", { onclick: function () {
      var v = condSel.value;
      if (v) store.update(function (c) {
        c.conditions = c.conditions || [];
        if (c.conditions.indexOf(v) === -1) c.conditions.push(v);
        if (LEVELED[v]) { c.conditionLevels = c.conditionLevels || {}; c.conditionLevels[v] = c.conditionLevels[v] || 1; }
      });
    } }, "+ APPLY");
    sectionEls.conditions = EN.ui.panel("Conditions", (ch.conditions || []).length + " ACTIVE",
      (active.length ? active : [el("p.help", { style: { margin: 0 }, text: "No active conditions." })])
     .concat(fx.derived.map(function (dc) {
        var info = (EN.conditions || []).find(function (x) { return x.name === dc.name; });
        return el("div.feature", { style: { borderLeftColor: "var(--danger)" } }, [
          el("h4", null, [
            el("span", null, [document.createTextNode(dc.name + " "),
              el("span.chip", { style: { fontSize: "9px", color: "var(--danger)", borderColor: "var(--danger)" }, text: "AUTO — " + dc.from })]),
            el("span.src", { text: "clears when the source drops" })
          ]),
          info ? el("p.help", { style: { margin: 0 }, text: info.summary || "" }) : null
        ]);
      })), { corners: true, headerRight: [condSel, applyBtn] });

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
      "Seismic Sense":       { sense: "Tremor Sense", range: "8 sp.", note: "Via ground contact; can't detect flying, climbing, or levitating creatures." },
      "Warmblood Sense":     { sense: "Heat Sense", range: "6 sp.", note: "Ignore Invisible and Hidden for living, heat-producing targets." },
      "Blood-Scent Tracker": { sense: "Blood Scent", range: "6 sp.", note: "Know the direction of any Bleeding or below-half-Vitality creature, even hidden or behind cover." },
      "Disturbance Compass": { sense: "Flow Sense", range: "12 sp.", note: "Presence and direction of Flow disturbances and active Invocations, through walls. Always on." },
      "Scent Marker":        { sense: "Scent Tracking", range: "1 mile", note: "Tagged targets only, for 48 hours." },
      "The Machine Medium":  { sense: "Sprite Sight", range: "—", note: "Passively see and communicate with Nixies and Gremlins, the Flow sprites in complex machinery." }
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
    sectionEls.saves = EN.ui.panel("Saving Throws", "d20 + MOD + CALIBER (focus)", [el("table.sktable", null, [el("tbody", null, R.attributes.map(function (a) {
        var sv = d.saves[a.key];
        var svSnag = fx.snagSave[a.key];
        var autoFail = fx.autoFailBodAgiSaves && (a.key === "BOD" || a.key === "AGI");
        var bonus = sv.bonus + fx.saveDelta;
        return el("tr", null, [el("td", { text: a.name }), el("td", null, [
          sv.focus ? el("span.badge", { style: { color: "var(--flow)" }, text: "FOCUS" }) : null,
          autoFail ? el("span.chip", { style: { fontSize: "9px", color: "var(--danger)", borderColor: "var(--danger)" }, text: "AUTO-FAIL" }) :
            (svSnag ? snagChip("Condition — Snag on " + a.name + " saves") : null)
        ]), el("td.tot", { style: fx.saveDelta ? { color: "var(--warn)" } : null, title: fx.saveDelta ? "includes " + eng.fmtMod(fx.saveDelta) + " from conditions" : null, text: eng.fmtMod(bonus) })]);
      }))])], { corners: true });
    sectionEls.senses = EN.ui.panel("Senses", "10 + MOD + PROF (±5 EDGE/SNAG)", passives, { corners: true });

    /* ACTIONS — tabbed, like a play-sheet */
    var C = EN.combat || {};
    // only features with usable mechanics belong on the play-sheet — drop progression
    // scaffolding ("choose a subclass / Universal Upgrade" prompts) and scaling
    // reminders like "Cheap Shot (3d6)" whose base feature is already listed
    var SCAFFOLD_FEATURE = /^(Universal Upgrade|Subclass Feature|Subclass Capstone|Awakening Milestone)$|\bSubclass$/;
    var kept = d.features.filter(function (f) {
      if (SCAFFOLD_FEATURE.test(f.name)) return false;
      var base = f.name.replace(/\s*\(.*\)$/, "");
      if (base !== f.name && d.features.some(function (o) { return o !== f && o.name === base; })) return false;
      return true;
    });
    // break bundled resource features (e.g. Moxie's tricks) into their own entries
    var expanded = [];
    kept.forEach(function (f) {
      var exp = FEATURE_EXPANSIONS[f.name];
      if (exp) {
        exp.subs.forEach(function (s) {
          expanded.push({ name: s.name, source: f.source, level: f.level, text: s.text, _cost: s.cost, chip: exp.chip });
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
    var TABS = ["ALL", "ATTACK", "ACTION", "SWIFT", "IMPULSE", "PASSIVE", "LIMITED"];
    var tabRow = el("div.row.wrap", { style: { gap: "6px", marginBottom: "10px" } }, TABS.map(function (t) {
      return el("button.btn.sm" + (_tab === t ? ".primary" : ""), { onclick: function () { _tab = t; EN.app.render(); } }, t);
    }));
    var actionKids = [tabRow];
    // attacks (shown on ALL + ATTACK) — built from the weapons equipped in the Inventory stash
    if (_tab === "ALL" || _tab === "ATTACK") {
      actionKids.push(el("div.section-title", { style: { margin: "6px 0 2px" } }, [document.createTextNode("Attacks"), el("span.line")]));
      var atkSnag = fx.snagAtk ? "Active condition — Snag on all attack rolls" : null;
      var GROUP_CAT = { Simple: "Simple Weapons", Martial: "Martial Weapons", Sidearm: "Sidearms", Longarm: "Longarms",
                        Heavy: "Heavy Weapons", Launcher: "Explosive Launchers", Thrown: "Thrown Weapons", Bowfire: "Bowfire Weapons" };
      var equippedNames = (ch.equippedWeapons || []).filter(function (n) {
        return (ch.equipment || []).some(function (e) { return e.name === n && e.qty > 0; });
      });
      // to-hit: governing attribute + weapon-category proficiency bonus
      function weaponHit(it) {
        var melee = it.group === "Simple" || it.group === "Martial";
        var thrownItem = (it.traits || []).some(function (t) { return /^Thrown/.test(t); });
        var finesse = (it.traits || []).some(function (t) { return /^Finesse/.test(t); });
        var bod = d.attributes.BOD.mod, agi = d.attributes.AGI.mod;
        var useAgi = melee ? (finesse && agi > bod) : (thrownItem ? agi >= bod : true);
        var mod = useAgi ? agi : bod, attrName = useAgi ? "Agility" : "Body";
        var cat = GROUP_CAT[it.group], tier = eng.effectiveGearTier(ch, "weapons", cat), prof = R.profTiers[tier].d20;
        return { mod: mod, attrName: attrName, cat: cat, tier: tier, prof: prof, total: mod + prof, melee: melee, thrownItem: thrownItem };
      }
      function reorderArrows(wname, wi) {
        return el("div", { style: { display: "flex", flexDirection: "column", gap: "1px", flex: "0 0 auto" } }, [
          el("button", { title: "Move up", disabled: wi === 0,
            onclick: function () { store.update(function (c) { var a = c.equippedWeapons, j = a.indexOf(wname); if (j > 0) { a.splice(j, 1); a.splice(j - 1, 0, wname); } }); },
            style: { background: "transparent", border: "none", color: wi === 0 ? "var(--text4)" : "var(--text3)", cursor: wi === 0 ? "default" : "pointer", fontSize: "9px", lineHeight: "1", padding: "1px 3px" } }, "▲"),
          el("button", { title: "Move down", disabled: wi === equippedNames.length - 1,
            onclick: function () { store.update(function (c) { var a = c.equippedWeapons, j = a.indexOf(wname); if (j !== -1 && j < a.length - 1) { a.splice(j, 1); a.splice(j + 1, 0, wname); } }); },
            style: { background: "transparent", border: "none", color: wi === equippedNames.length - 1 ? "var(--text4)" : "var(--text3)", cursor: wi === equippedNames.length - 1 ? "default" : "pointer", fontSize: "9px", lineHeight: "1", padding: "1px 3px" } }, "▼")
        ]);
      }
      function statBox(label, value, color, title) {
        return el("div", { title: title || "", style: { textAlign: "center", flex: "0 0 auto", minWidth: "44px" } }, [
          el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text4)" }, text: label }),
          el("span.mono", { style: { fontSize: "15px", color: color || "var(--text)" }, text: value })
        ]);
      }

      equippedNames.forEach(function (wname, wi) {
        var it = findWeapon(wname);
        if (!it) return;
        var h = weaponHit(it), norm = normalizeWeapon(it);
        var snagWhy = atkSnag || (h.tier === "untrained" ? "Untrained with " + h.cat + " — attacks roll with Snag" : null);
        var dmgTip = norm.damageDisplay + (h.melee || h.thrownItem ? " " + eng.fmtMod(h.mod) + " (" + h.attrName + ") on hit" : "");
        var hitTip = "d20 " + eng.fmtMod(h.mod) + " " + h.attrName + (h.prof ? " " + eng.fmtMod(h.prof) + " " + R.profTiers[h.tier].name : " (untrained — Snag)");
        var subtype = (h.melee ? "Melee" : h.thrownItem ? "Thrown" : "Ranged") + " Weapon · " + h.cat;
        var isRanged = !h.melee && !h.thrownItem && it.ammo != null;

        var head = el("div.row", { style: { gap: "8px", alignItems: "center", flexWrap: "wrap" } }, [
          equippedNames.length > 1 ? reorderArrows(wname, wi) : null,
          el("span", { title: it.desc || "", style: { fontWeight: 600, fontSize: "14px" }, text: it.name }),
          snagWhy ? snagChip(snagWhy) : null,
          el("span", { style: { fontSize: "10px", color: "var(--text3)", flex: "1 1 auto" }, text: subtype })
        ]);

        var rowKids = [head];

        if (isRanged) {
          var st = readAmmo(ch, it);
          var selCost = costFor(it, st.mode);
          var canAny = st.cur >= minFireCost(it);   // any mode could fire?
          var canSel = st.cur >= selCost;           // the selected mode can fire?
          var hitCell;
          if (!canAny) {   // magazine can't pay even the cheapest mode → Reload affordance
            hitCell = el("div", { style: { textAlign: "center", flex: "0 0 auto", minWidth: "56px" } }, [
              el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text4)" }, text: "HIT" }),
              el("button.btn.sm", { style: { color: "var(--warn)", borderColor: "var(--warn)", padding: "1px 7px" }, onclick: function () { reloadWeapon(wname); } }, "⟳ RELOAD")
            ]);
          } else {   // can fire something; grey the number when the SELECTED mode is unaffordable
            hitCell = el("div", { title: canSel ? "Tap to fire (" + st.mode + " · −" + selCost + ")" : "Needs " + selCost + " for " + st.mode + " — switch to a cheaper mode or reload",
              style: { textAlign: "center", flex: "0 0 auto", minWidth: "44px", cursor: "pointer", opacity: canSel ? 1 : 0.5 }, onclick: function () { fireWeapon(wname); } }, [
              el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text4)" }, text: "HIT" }),
              el("span.mono", { title: hitTip, style: { fontSize: "16px", color: canSel ? "var(--ember)" : "var(--danger)" }, text: eng.fmtMod(h.total) })
            ]);
          }
          var pct = st.cap > 0 ? Math.round(st.cur / st.cap * 100) : 0;
          var ammoCell = el("div", { style: { flex: "1 1 120px", minWidth: "110px" } }, [
            el("div.row.between", { style: { alignItems: "baseline" } }, [
              el("span", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text4)" }, text: "AMMO" }),
              el("span.mono", { style: { fontSize: "12px", color: st.cur === 0 ? "var(--danger)" : "var(--text2)" }, text: st.cur + " / " + st.cap + (it.ammoUnit ? " " + it.ammoUnit : "") })
            ]),
            bar(st.cur, st.cap, st.cur === 0 ? "var(--danger)" : "var(--accent)")
          ]);
          rowKids.push(el("div.row.wrap", { style: { gap: "12px", alignItems: "center", marginTop: "6px" } }, [
            statBox("RANGE", norm.rangeDisplay, "var(--gold)", it.range || ""),
            hitCell,
            statBox("DMG", norm.damageDisplay, "var(--accent)", dmgTip),
            ammoCell
          ]));

          // controls: fire-mode selector, ammo-type dropdown, reload
          var controls = [];
          if (st.modes.length > 1) {
            controls.push(el("select", { style: { fontSize: "11px", width: "auto" }, onchange: function () { writeAmmo(wname, { mode: this.value }); } },
              st.modes.map(function (m) { return el("option", { value: m, selected: m === st.mode, title: weaponTraitTip(m), text: m + " · −" + MODE_COST[m] }); })));
          } else if (st.modes.length === 1) {
            controls.push(el("span.chip", { title: weaponTraitTip(st.modes[0]), style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, st.modes[0].toUpperCase() + " · −" + MODE_COST[st.modes[0]]));
          } else {
            controls.push(el("span.chip", { style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, "FIRE · −" + implicitCost(it)));
          }
          var ammoOpts = ammoTypeOptions(ch, it);
          if (ammoOpts.indexOf(st.ammoType) === -1) ammoOpts.push(st.ammoType);   // keep the loaded type selectable even if its stash ran out
          if (ammoOpts.length > 1) {
            controls.push(el("select", { title: "Loaded ammunition (Reload to apply)", style: { fontSize: "11px", width: "auto" }, onchange: function () { writeAmmo(wname, { ammoType: this.value }); } },
              ammoOpts.map(function (o) { return el("option", { value: o, selected: o === st.ammoType, text: o + (o !== "Standard" && ownedQty(ch, o) <= 0 ? " (none in stash)" : "") }); })));
          }
          controls.push(el("button.btn.sm", { title: "Reload to " + st.cap + (it.ammoUnit ? " " + it.ammoUnit : ""), style: { color: "var(--text2)", padding: "2px 8px" }, onclick: function () { reloadWeapon(wname); } }, "⟳ RELOAD"));
          rowKids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, controls));

          // status sub-row: loaded special round/munition effect + (future) mods
          var statusChips = [];
          if (st.ammoType !== "Standard" && st.ammoType !== baseFeedName(it)) {
            var a = ammoCatalog().concat(munitions()).find(function (x) { return x.name === st.ammoType; });
            statusChips.push(el("span.chip", { title: a ? (a.effect || a.desc || "") : "", style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" } }, "◆ " + st.ammoType));
          }
          if (statusChips.length) rowKids.push(el("div.row.wrap", { style: { gap: "6px", marginTop: "6px" } }, statusChips));
        } else {
          // melee / thrown: Range · Hit · Damage (no ammo)
          rowKids.push(el("div.row.wrap", { style: { gap: "14px", alignItems: "center", marginTop: "6px" } }, [
            statBox(h.melee ? "REACH" : "RANGE", norm.rangeDisplay, "var(--gold)", it.range || ""),
            statBox("HIT", eng.fmtMod(h.total), "var(--ember)", hitTip),
            statBox("DMG", norm.damageDisplay, "var(--accent)", dmgTip)
          ]));
        }

        // traits line
        rowKids.push(el("div.row.wrap", { style: { gap: "5px", marginTop: "6px" } }, norm.traits.map(wTraitChip)));

        actionKids.push(el("div", { style: { padding: "8px 4px", borderBottom: "1px solid rgba(35,48,68,.5)" } }, rowKids));
      });
      if (!equippedNames.length) {
        actionKids.push(attackRow("Unarmed Strike", eng.fmtMod(d.attributes.BOD.mod), "d20 + Body + proficiency · unarmed damage + Body mod", "var(--ember)", atkSnag));
        actionKids.push(el("p.help", { style: { margin: "4px 0 6px" }, text: "No weapons equipped — hit ⚔ EQUIP on a weapon in Inventory → Stash to list it here." }));
      }
      if (ch.class === "codebreaker") actionKids.push(attackRow("Cipher Attack", eng.fmtMod(d.attributes.TEC.mod), "d20 + Tech + proficiency vs Node · Quick Hacks under fire", "var(--accent)"));
      if (d.flow) actionKids.push(attackRow("Flow Attack", eng.fmtMod(d.flow.attack), "d20 + " + d.flow.attributeName + " · Invocation Save DC " + d.flow.dc, "var(--flow)"));
    }
    // common actions chips (ALL + ACTION)
    if ((_tab === "ALL" || _tab === "ACTION") && (C.commonActions || []).length) {
      actionKids.push(el("div.section-title", { style: { margin: "12px 0 2px" } }, [document.createTextNode("Actions in Combat"), el("span.line")]));
      actionKids.push(el("p.help", { style: { marginBottom: "6px" }, text: (C.commonActions || []).map(function (a) { return a.name; }).join(", ") + " — full rules in the Codex tab." }));
    }
    // class resource tracker — the fuel for the features below
    if (d.resource) {
      var rCur = (ch.resources.current[d.resource.name] != null) ? ch.resources.current[d.resource.name] : d.resource.max;
      rCur = eng.clamp(rCur, 0, d.resource.max);
      actionKids.push(el("div.section-title", { style: { margin: "12px 0 2px" } }, [document.createTextNode(d.resource.name), el("span.line")]));
      actionKids.push(el("div.row.between.wrap", { style: { alignItems: "center" } }, [
        el("div.mono", { style: { fontSize: "22px", color: "var(--accent)" }, html: rCur + " <span style='font-size:13px;color:var(--text3)'>/ " + d.resource.max + " · " + d.resource.attributeName + " · refresh on rest</span>" }),
        plusMinus(function () { store.update(function (c) { c.resources.current[d.resource.name] = Math.max(0, rCur - 1); }); },
                  function () { store.update(function (c) { c.resources.current[d.resource.name] = Math.min(d.resource.max, rCur + 1); }); })
      ]));
      actionKids.push(bar(rCur, d.resource.max, "var(--accent)"));
    }
    // feature actions, filtered by tab
    var shown = feats.filter(function (f) {
      if (_tab === "ALL") return true;
      if (_tab === "LIMITED") return f.limited;
      if (_tab === "ATTACK") return /attack/i.test(f.text) && f.cost !== "Passive";
      return f.cost.toUpperCase() === _tab;
    });
    if (shown.length) {
      // Features = active attacks & interactions; Abilities = the passives
      // (name markers were already resolved into the cost when feats were built)
      var activeFeats = shown.filter(function (f) { return f.cost !== "Passive"; });
      var passiveFeats = shown.filter(function (f) { return f.cost === "Passive"; });
      var featList = _featTab === "abilities" ? passiveFeats : activeFeats;
      actionKids.push(el("div.row.wrap", { style: { gap: "6px", margin: "12px 0 8px" } }, [
        el("button.btn.sm" + (_featTab !== "abilities" ? ".primary" : ""), {
          title: "Active features — attacks, actions, and interactions you trigger",
          onclick: function () { _featTab = "features"; EN.app.render(); } }, "FEATURES (" + activeFeats.length + ")"),
        el("button.btn.sm" + (_featTab === "abilities" ? ".primary" : ""), {
          title: "Passive abilities — always-on benefits",
          onclick: function () { _featTab = "abilities"; EN.app.render(); } }, "ABILITIES (" + passiveFeats.length + ")")
      ]));
      // both lists grow with every level — keep them in the scrollable well
      actionKids.push(el("div.feature-scroll", null, featList.length
        ? featList.map(function (f) {
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
            return actionEntry(f.id, f.name, f.cost, f.src, f.text, f.limited, f.chip, uses);
          })
        : [el("p.help", { style: { margin: 0 }, text: _featTab === "abilities" ? "No passive abilities in this category." : "No active features in this category." })]));
    } else if (_tab !== "ALL" && _tab !== "ACTION") {
      actionKids.push(el("p.help", { text: "Nothing in this category." }));
    }
    sectionEls.actions = EN.ui.panel("Actions", _tab, actionKids, { corners: true });

    /* gear proficiencies — mirrors the #PRINT "Skills & Proficiencies" combined pane
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
    var focusChips = (ch.skillFocuses || []).map(function (f) {
      var sk = R.skillByKey[f.skill];
      return el("span.chip", { title: "Skill Focus (Training Points)", style: { fontSize: "10.5px", color: "var(--accent)", borderColor: "var(--accent)", borderStyle: "dashed" } }, (sk ? sk.name : f.skill) + (f.aspect ? " (" + f.aspect + ")" : ""));
    });
    var specChips = (ch.specializations || []).map(function (f) {
      var sk = R.skillByKey[f.skill];
      return el("span.chip", { title: "Specialization (Training Points)", style: { fontSize: "10.5px", color: "var(--flow)", borderColor: "var(--flow)", borderStyle: "dashed" } }, (sk ? sk.name : f.skill) + (f.aspect ? " (" + f.aspect + ")" : ""));
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
      profRows.length ? profRows : [el("p.help", { style: { margin: 0 }, text: "No gear proficiencies yet — grant them via Class/Background or Training Points." })],
      { corners: true });

    /* ---- assemble the modular layout from the saved order ----
       6-column grid; each section spans 1–6 columns (−/+ in its header).
       Dense auto-flow lets later sections backfill row holes, and rows
       stretch to equal height so nothing leaves ragged gaps. */
    var layout = loadLayout();
    var container = el("div.modgrid6" + (_editMode ? "" : ".compact-heads"));
    layout.forEach(function (slot, idx) {
      var p = sectionEls[slot.key];
      if (!p) return;
      var wrap = el("div", { style: { gridColumn: "span " + slot.w, minWidth: 0 } }, [p]);
      var head = p.querySelector(".panel-h");
      if (head) {
        // at 2/6 or narrower there's no room for the header sub-label — fold it into the title tooltip
        if (slot.w <= 2) {
          var tag = head.querySelector(".tag");
          if (tag) {
            tag.style.display = "none";
            var h3 = head.querySelector("h3");
            if (h3 && !h3.title) h3.title = tag.textContent;
          }
        }
        if (_editMode) {
          var handle = el("span.drag-handle", { title: "Drag to rearrange", style: { color: "var(--accent)", fontSize: "14px" }, text: "⠿" });
          handle.draggable = true;
          handle.addEventListener("dragstart", function (e) {
            _dragIdx = idx;
            e.dataTransfer.setData("text/plain", String(idx));
            e.dataTransfer.effectAllowed = "move";
          });
          handle.addEventListener("dragend", function () { _dragIdx = null; });
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
            el("span.mono", { title: "Panel width — " + slot.w + " of 6 columns", style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".05em" }, text: slot.w + "/6" }),
            sizeBtn("+", 1, "Wider (current: " + slot.w + "/6)")
          ];
          // if the header already has right-aligned content (its own auto margin), sit flush beside it
          var hasRight = Array.prototype.some.call(head.children, function (c) { return c.style && c.style.marginLeft === "auto"; });
          head.appendChild(el("div", { style: { marginLeft: hasRight ? "0" : "auto", display: "flex", gap: "4px", alignItems: "center", flex: "0 0 auto", paddingLeft: "8px" } }, widthCtrls.concat([handle])));
        }
      }
      if (_editMode) {
        wrap.addEventListener("dragover", function (e) { if (_dragIdx == null) return; e.preventDefault(); wrap.style.outline = "1px dashed var(--accent)"; wrap.style.outlineOffset = "3px"; });
        wrap.addEventListener("dragleave", function () { wrap.style.outline = ""; });
        wrap.addEventListener("drop", function (e) {
          e.preventDefault(); wrap.style.outline = "";
          var from = _dragIdx; _dragIdx = null;
          if (from == null || from === idx) return;
          var moved = layout.splice(from, 1)[0];
          layout.splice(idx, 0, moved);
          saveLayout(layout); EN.app.render();
        });
      }
      container.appendChild(wrap);
    });
    blocks.push(container);

    mount.appendChild(el("div", null, blocks));
  }

  return { render: render };
})();
