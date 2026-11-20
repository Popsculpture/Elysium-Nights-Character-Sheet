/* ===========================================================================
   ELYSIUM NIGHTS · the Garage tab (19 Nov 2026, the author's call)
   Once a vehicle is owned or leased the Gear tab has a Garage, and the Garage is its own complete vehicle sheet in three pages:
     VEHICLE    the ride as a character sheet: nickname, Integrity track (a hit, a direct amount, a repair), the stats the book
                gives it (Speed, Handling, Structure, Defense, Node Tier, seats, mod slots, ram and crash dice), its current speed
                (which sets the Impact DC), altitude, traits with their rules, and the piloting panel with ROLL buttons that open
                the HUD's roll tray (js/inventory.js garageBench, kept as the Vehicle Ops panel).
     CHASE      a saved Lead tracker (fleeing or pursuing, 0 to 5, each round's result, System Hits capped at one a side a round,
                crashes, Heat) and the vehicle rules a player needs, worked out for the vehicle chosen. Only what the Player's
                Handbook prints: the Toolkit's longer chase rules are the Admin desktop's (data/chases.js chase.handbook).
     CHOP SHOP  fitting and pulling Vehicle Mods, and repairs (garage repair and field repair, from the Repair Reserve).
   It reads the catalog (EN.vehicles), the rules (EN.chases) and the piloting math the Vehicle Ops panel keeps (inventory core.garage);
   every number is the book's, and what is saved is only what the player sets: ch.garage (js/store.js sanitizes it).
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.garage = (function () {
  var el = EN.ui.el, store = EN.store, toast = EN.ui.toast;
  function G() { return EN.inventoryView.core.garage; }
  function K() { return EN.combatView.core; }
  function C() { return EN.chases || {}; }

  var SPEEDS = ["Stationary", "Slow", "Standard", "Fast", "Very Fast"];
  var RATINGS = ["Slow", "Standard", "Fast", "Very Fast"];
  var BANDS = ["Deck", "Low", "High"];
  // the mass rows (data/chases.js massRows) for the seven printed chassis; a vehicle not listed reads Standard
  var MASS = { "Street Bike": "Light", "Hydrofoil": "Light", "Armored Sedan": "Standard", "Light Shuttle": "Standard", "Cargo Hauler": "Heavy", "Corporate VTOL": "Heavy", "Riot Suppression Mech": "Massive" };
  var RAM_DICE = { Light: 2, Standard: 3, Heavy: 4, Massive: 5 };
  var CRASH_DICE = { Slow: 2, Standard: 3, Fast: 4, "Very Fast": 5 };
  var BAND_NOTE = { Deck: "Street level, rooftop level, between the towers. Everything works normally.", Low: "Above the traffic. Only a weapon's long band and Mounted weapons reach, and only Deck or Low targets are reachable in return.", High: "Out of small-arms reach entirely. Only Guided weapons and other aircraft can touch it, and vice versa." };

  var _page = "vehicle";    // 'vehicle' | 'chase' | 'chop'
  var _open = {};            // the rule sections that are open (transient)
  var _amt = { hit: "", direct: "", repair: "", field: "" };
  var _applied = null;       // the record and vehicle whose chassis the Vehicle Ops panel was last set to

  function clamp(n, lo, hi) { n = Number(n); if (isNaN(n)) n = lo; return Math.max(lo, Math.min(hi, n)); }
  function plain(parent, text) { return EN.ui.ruleText(parent, text, { conditions: true, used: {} }); }
  function chip(text, color, title) { return el("span.chip", { title: title || "", style: { fontSize: "9px", color: color || "var(--text3)", borderColor: color || "var(--border)" }, text: text }); }

  /* ---- what is saved: ch.garage = { sel, v: { entryKey: { nick, dmg, spd, alt, disabled, hit, field, notes } }, chase: { ... } } ---- */
  function gs(ch) { return (ch && ch.garage) || {}; }
  var NOCHASE = { on: false, role: "fleeing", lead: 2, round: 1, mine: 0, theirs: 0, res: false, heat: 0, rival: "Standard", end: "", log: [] };
  function wset(fn, silent) {
    store.update(function (c) {
      c.garage = c.garage || {}; c.garage.v = c.garage.v || {};
      fn(c.garage);
    }, silent ? { silent: true } : undefined);
  }
  function vset(key, fn, silent) { wset(function (g) { var v = g.v[key] = g.v[key] || {}; fn(v, g); }, silent); }
  function vstate(ch, key) {
    var v = (gs(ch).v || {})[key] || {};
    return { nick: String(v.nick || ""), dmg: Math.max(0, v.dmg | 0), spd: SPEEDS.indexOf(v.spd) !== -1 ? v.spd : "Stationary", alt: BANDS.indexOf(v.alt) !== -1 ? v.alt : "Deck",
             disabled: !!v.disabled, hit: !!v.hit, field: !!v.field, notes: String(v.notes || "") };
  }
  function chaseOf(ch) {
    var c = gs(ch).chase || {};
    return { on: !!c.on, role: c.role === "pursuing" ? "pursuing" : "fleeing", lead: clamp(c.lead == null ? 2 : c.lead, 0, 5), round: Math.max(1, c.round | 0 || 1),
             mine: c.mine ? 1 : 0, theirs: c.theirs ? 1 : 0, res: !!c.res, heat: clamp(c.heat, 0, 20), rival: RATINGS.indexOf(c.rival) !== -1 || c.rival === "On foot" ? c.rival : "Standard",
             end: c.end === "escaped" || c.end === "contact" ? c.end : "", log: Array.isArray(c.log) ? c.log.filter(function (x) { return x && x.t; }) : [] };
  }
  function cset(fn, silent) { wset(function (g) { var c = g.chase = g.chase || {}; fn(c); }, silent); }
  function logIt(c, t) { c.log = Array.isArray(c.log) ? c.log : []; c.log.unshift({ t: t }); if (c.log.length > 12) c.log.length = 12; }

  /* ---- the owned vehicles, and what the book says about each ---- */
  function vehicles(ch) {
    return G().owned(ch).map(function (r) {
      var prof = G().profileOf(r.it.name);
      return prof ? { row: r, key: r.key, prof: prof, label: r.label } : null;
    }).filter(Boolean);
  }
  function selected(ch, list) {
    var k = gs(ch).sel;
    return list.filter(function (v) { return v.key === k; })[0] || list[0] || null;
  }
  // the stats as the vehicle stands, with what its fitted mods change (Plate Kit, Cabin Kit, Cut-Down)
  function statsOf(ch, v) {
    var lo = G().loadout(ch, v.key), p = v.prof, traits = p.traits.slice();
    function drop(n) { traits = traits.filter(function (t) { return t !== n; }); }
    function add(n) { if (traits.indexOf(n) === -1) traits.push(n); }
    if (lo.indexOf("cabin-kit") !== -1) { drop("Open-Frame"); add("Enclosed"); }
    if (lo.indexOf("cut-down") !== -1) { drop("Enclosed"); add("Open-Frame"); }
    var armored = traits.indexOf("Armored") !== -1;
    var structure = (armored ? 18 : p.structure) + (lo.indexOf("plate-kit") !== -1 ? 2 : 0);
    var handling = p.handling + (lo.indexOf("cabin-kit") !== -1 ? -1 : 0);
    var mass = MASS[p.name] || "Standard";
    var seats = 0;
    traits.forEach(function (t) { var m = /^Passenger \((\d+)\)$/.exec(t); if (m) seats = +m[1]; });
    // a Plate Kit's mass counts as one Speed rating lower for the straightaway
    var rank = Math.max(0, RATINGS.indexOf(p.speed) - (lo.indexOf("plate-kit") !== -1 ? 1 : 0));
    return { lo: lo, traits: traits, structure: structure, handling: handling, mass: mass, seats: seats, airborne: traits.indexOf("Flight") !== -1,
             straight: RATINGS[rank], max: p.integrity, plates: lo.indexOf("plate-kit") !== -1 };
  }
  function integrity(ch, v) {
    var st = vstate(ch, v.key), max = v.prof.integrity, cur = Math.max(0, max - st.dmg);
    return { cur: cur, max: max, wrecked: cur <= 0, below: cur < max / 2, half: Math.floor(max / 2), st: st };
  }
  // the Impact DC for a speed (data/chases.js impactDc), and the crash and ram dice
  function impact(spd) {
    var rows = C().impactDc || [], i = spd === "Stationary" ? 0 : rows.map(function (r) { return r.speed; }).indexOf(spd);
    return { dc: i >= 0 && rows[i] ? rows[i].dc : 10 };
  }
  function crashOf(spd, airborne) {
    if (spd === "Stationary") return { n: 0, dc: 10, text: "None at rest" };
    var i = RATINGS.indexOf(spd), up = airborne ? Math.min(RATINGS.length - 1, i + 1) : i;
    var n = CRASH_DICE[RATINGS[up]] + (airborne && i === RATINGS.length - 1 ? 1 : 0);
    var dc = impact(RATINGS[up]).dc;
    return { n: n, dc: dc, text: n + "d10 vs DC " + dc };
  }
  function ramOf(mass, spd) {
    var n = RAM_DICE[mass] || 3, extra = spd === "Fast" || spd === "Very Fast" ? 1 : 0;
    return { n: n, extra: extra, text: n + "d10" + (extra ? " + 1d10" : "") };
  }
  function controlDc(ch) {
    var list = vehicles(ch), v = selected(ch, list);
    if (!v) return null;
    var st = vstate(ch, v.key), im = impact(st.spd);
    return { dc: im.dc, speed: st.spd };
  }

  /* ---- ROLL: the HUD's roll tray, with the piloting numbers as the tray's own modifiers ---- */
  function roll(name, subtype, mods, o) {
    o = o || {};
    var ch = store.active(); if (!ch) return;
    var d = EN.engine.derive(ch), kc = K();
    var asp = [];
    if (o.spec) asp.push({ key: "spec", label: "Spec crit range +1" + (typeof o.spec === "string" ? " · " + o.spec : ""), critExpand: 1, color: "var(--flow)",
      title: "Specialization: " + (o.cat || "vehicles") + ". Expands the critical threat range by 1." });
    var ctx = Object.assign({
      weaponName: name, subtype: subtype, melee: false, thrownItem: false, ranged: false, usesAmmo: false,
      traits: [], baseMods: mods, critMin: 20, aspectMods: asp,
      critLabel: "◆ CRITICAL THREAT", critNote: "A piloting check crits only with the right situation or gear. Otherwise treat it as a normal success.",
      fumbleLabel: "✖ NAT 1 · GOES WRONG",
      autoSnag: o.snag ? ["Untrained: Snag"] : [], autoEdge: [], baseSnag: o.snag ? 1 : 0, baseEdge: 0,
      shaken: (ch.conditions || []).indexOf("Shaken") !== -1, dmg: null
    }, kc.moxieFlags(ch, d));
    kc.openRollTray(ctx);
  }

  /* ---- writes ---- */
  function damage(v, amount, how) {
    amount = Math.floor(Number(amount));
    if (!(amount > 0)) { toast("Enter an amount first."); return; }
    var ch = store.active(), i = integrity(ch, v), s = statsOf(ch, v);
    if (how === "hit" && amount < s.structure) { toast("No Integrity lost: " + amount + " is below the Structure of " + s.structure + "."); return; }
    var after = Math.max(0, i.cur - amount), note = "";
    vset(v.key, function (x) {
      x.dmg = Math.min(v.prof.integrity, (x.dmg | 0) + amount);
      if (i.cur >= v.prof.integrity / 2 && after < v.prof.integrity / 2 && !x.hit) { x.hit = true; note = " System Hit: Lead shifts 1 against it (the first time below half)."; }
    });
    toast(v.label + " takes " + amount + ": " + after + " / " + v.prof.integrity + " Integrity." + (after <= 0 ? " WRECKED." : "") + note, note ? 6000 : undefined);
  }
  function repair(v, amount, label) {
    amount = Math.floor(Number(amount));
    if (!(amount > 0)) { toast("Enter an amount first."); return; }
    vset(v.key, function (x) {
      x.dmg = Math.max(0, (x.dmg | 0) - amount);
      if (v.prof.integrity - x.dmg >= v.prof.integrity / 2) x.hit = false;
    });
    toast((label || "Repaired") + ": " + v.label + " regains up to " + amount + " Integrity.");
  }

  /* ================= pages ================= */
  function pageBar(list) {
    function b(key, text) { return el("button.btn.sm" + (_page === key ? ".primary" : ""), { type: "button", dataset: { garagePage: key }, onclick: function () { _page = key; EN.app.render(); } }, text); }
    return el("div.row.wrap.garage-bar", { style: { gap: "6px", margin: "0 0 12px" } }, [b("vehicle", "VEHICLE"), b("chase", "CHASE"), b("chop", "CHOP SHOP")]);
  }
  function picker(ch, list, cur) {
    if (list.length < 2) return null;
    return el("div.row.wrap.garage-pick", { style: { gap: "6px", margin: "0 0 10px", alignItems: "center" } }, [el("span.mono", { style: { fontSize: "9px", letterSpacing: ".1em", color: "var(--text3)" }, text: "VEHICLE" })].concat(list.map(function (v) {
      var nick = vstate(ch, v.key).nick;
      return el("button.btn.sm" + (cur.key === v.key ? ".primary" : ""), { type: "button", dataset: { garageSel: v.key }, onclick: function () { wset(function (g) { g.sel = v.key; }); } }, nick || v.label);
    })));
  }
  function cell(label, value, sub, opts) {
    opts = opts || {};
    return el("div.garage-cell", { dataset: { stat: opts.key || "" }, title: opts.title || "", style: { textAlign: "center", minWidth: "92px" } }, [
      el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" } }, opts.link ? [EN.ui.ruleLink(opts.link, label)] : [document.createTextNode(label)]),
      el("div.mono", { style: { fontSize: "21px", color: opts.color || "var(--text)", lineHeight: 1.15 }, text: String(value) }),
      sub ? el("div.mono", { style: { fontSize: "9px", color: "var(--text3)" }, text: sub }) : null]);
  }
  function traitRule(name) {
    var list = C().traits || [], base = String(name).replace(/\s*\(\d+\)$/, " (N)");
    return list.filter(function (t) { return t.name === name || t.name === base; })[0] || null;
  }

  // the sheet: identity, Integrity, the stats
  function sheetPanel(ch, v, pil) {
    var s = statsOf(ch, v), i = integrity(ch, v), st = i.st, p = v.prof, row = v.row, e = row.e || {};
    var legal = G().legality(p, s.lo), ms = G().mapSpeed(ch, p.speed);
    var lease = /\(Lease\)$/.test(row.it.name);
    var pct = Math.max(0, Math.min(100, i.cur / i.max * 100));
    var barCol = i.wrecked ? "var(--danger)" : i.below ? "var(--warn)" : "var(--success)";
    var head = el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "10px" } }, [
      el("input", { type: "text", value: st.nick, maxlength: "40", placeholder: p.name, "aria-label": "Nickname", dataset: { garage: "nick" }, style: { width: "220px", fontSize: "15px", padding: "4px 9px" },
        title: "What your crew calls it", oninput: function () { var val = this.value; vset(v.key, function (x) { x.nick = val.slice(0, 40); }, true); } }),
      chip(p.category.toUpperCase() + " · TIER " + p.tier, "var(--accent)", "Category and Tier drive weekly upkeep and the number of Mod Slots"),
      chip(p.nodeTier.toUpperCase().replace(/ \[.*\]/, "") + " NODE", "var(--flow)", "The vehicle's reflection on the #GRID: " + p.nodeTier),
      chip(legal.toUpperCase(), legal === "Legal" ? "var(--success)" : legal === "Licensed" ? "var(--gold)" : legal === "Restricted" ? "var(--warn)" : "var(--danger)", "The strictest Legality tag among the vehicle and everything mounted on it"),
      chip(s.mass.toUpperCase() + " MASS", "var(--text2)", "Mass row for collisions and towing"),
      lease ? chip(e.leaseDue ? "LEASE DUE" : "LEASED", e.leaseDue ? "var(--danger)" : "var(--gold)", e.leaseDue ? "Lapsed: a dead ignition. The engine won't turn over and installed mods sit inert." : "A corporate fleet lease. The list price is its Buyout.") : chip("OWNED", "var(--success)", "Owned outright")
    ]);
    var stateChips = [];
    if (i.wrecked) stateChips.push(chip("WRECKED", "var(--danger)", "At 0 Integrity: unrecoverable at the roadside. Garage lane only."));
    else if (st.disabled) stateChips.push(chip("DISABLED", "var(--warn)", "Crashed, seized or engine-killed with Integrity left. A field repair clears it."));
    if (i.below && !i.wrecked) stateChips.push(chip("BELOW HALF", "var(--warn)", "A system gave the first time it dropped below half Integrity"));
    stateChips.push(el("button.btn.sm.ghost", { type: "button", dataset: { garage: "disabled" }, title: "Mark it Disabled (crashed, seized, engine-killed with Integrity remaining)", onclick: function () { vset(v.key, function (x) { x.disabled = !x.disabled; }); } }, (st.disabled ? "✓ " : "") + "DISABLED"));
    stateChips.push(el("button.btn.sm.ghost", { type: "button", dataset: { garage: "syshit" }, title: "The first time below half Integrity a system gives and Lead shifts 1 against it. Mark it taken (CHASE moves the Lead).", onclick: function () { vset(v.key, function (x) { x.hit = !x.hit; }); } }, (st.hit ? "✓ " : "") + "SYSTEM HIT TAKEN"));
    function amtBox(k, ph, title) {
      return el("input", { type: "number", min: "1", value: _amt[k], placeholder: ph, title: title, dataset: { garage: "amt-" + k }, style: { width: "74px", padding: "4px 6px", fontSize: "12.5px" }, oninput: function () { _amt[k] = this.value; } });
    }
    var integ = el("div", { dataset: { garage: "integrity" }, style: { padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "4px", background: "var(--bg1)", marginBottom: "10px" } }, [
      el("div.row.wrap", { style: { gap: "12px", alignItems: "baseline" } }, [
        el("span.mono", { style: { fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)" } }, [EN.ui.ruleLink("vc-stats/integrity", "INTEGRITY")]),
        el("span.mono", { dataset: { garage: "integrity-val" }, style: { fontSize: "28px", color: barCol, lineHeight: 1 }, text: i.cur + " / " + i.max }),
        el("span.help", { style: { margin: 0, fontSize: "11px" }, text: "Structure " + s.structure + ": a hit below it does nothing" }),
        el("span", { style: { flex: "1 1 auto" } })].concat(stateChips)),
      el("div", { style: { height: "9px", margin: "8px 0", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "5px", overflow: "hidden", position: "relative" } }, [
        el("div", { style: { width: pct + "%", height: "100%", background: barCol } }),
        el("div", { style: { position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "var(--text3)" }, title: "Half Integrity: the first time below, a system gives" })]),
      el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
        amtBox("hit", "hit", "Damage rolled against it: below Structure does nothing, otherwise the full roll comes off"),
        el("button.btn.sm", { type: "button", dataset: { garage: "hit" }, title: "A hit: damage below Structure (" + s.structure + ") does nothing; at or above it, all of it comes off Integrity", onclick: function () { damage(v, _amt.hit, "hit"); _amt.hit = ""; } }, "HIT"),
        amtBox("direct", "direct", "Damage that ignores Structure: a crash, a ram, the engine"),
        el("button.btn.sm", { type: "button", dataset: { garage: "direct" }, title: "Damage that ignores Structure: crash damage, a ram, an overdriven engine", onclick: function () { damage(v, _amt.direct, "direct"); _amt.direct = ""; } }, "DIRECT"),
        amtBox("repair", "repair", "Integrity restored"),
        el("button.btn.sm.primary", { type: "button", dataset: { garage: "repair" }, title: "Restore Integrity (the Chop Shop has the book's repairs and their cost)", onclick: function () { repair(v, _amt.repair, "Repaired"); _amt.repair = ""; } }, "REPAIR")
      ])
    ]);
    var ft = el("div.row.wrap.garage-grid", { style: { gap: "10px 14px", margin: "0 0 10px" } }, [
      cell("SPEED", ms ? ms.spaces : "?", p.speed.toUpperCase() + (ms && ms.bonus ? " · +2 ASPHALT RIDER" : "") + " · SPACES", { key: "speed", link: "vc-stats/speed-ratings", title: "Speed on the map in spaces. The rating is what a chase compares." }),
      cell("HANDLING", (s.handling >= 0 ? "+" : "") + s.handling, "ON PILOTING CHECKS", { key: "handling", link: "vc-stats/handling" }),
      cell("STRUCTURE", s.structure, s.plates ? "+2 PLATE KIT" : "THE GATE", { key: "structure", link: "vc-stats/structure" }),
      cell("DEFENSE", pil.defense, "MOVING · " + (10 + s.handling) + " PARKED", { key: "defense", link: "vc-damage/defense", title: "Moving: 10 + Handling + the pilot's Vehicle Proficiency Bonus. Parked or unpiloted: 10 + Handling." }),
      cell("CARGO", p.cargo, "LOAD", { key: "cargo" }),
      cell("PASSENGERS", s.seats, "BESIDE THE PILOT", { key: "seats" }),
      cell("MOD SLOTS", s.lo.length + " / " + p.modSlots, "1 + TIER", { key: "slots", color: s.lo.length >= p.modSlots ? "var(--warn)" : "var(--text)" }),
      cell("UPKEEP", G().fmtG(p.upkeep), "PER WEEK · " + G().fmtG(p.fuel) + " FUEL + " + G().fmtG(p.reserve) + " RESERVE", { key: "upkeep" })
    ]);
    var kids = [head, integ, ft];
    if (p.loadout) kids.push(el("p.help", { style: { margin: "0 0 8px", fontSize: "11.5px" } }, [el("b", { text: "Stock loadout: " }), document.createTextNode(p.loadout + ". It costs neither a Mod Slot nor a Hardpoint Mount.")]));
    return EN.ui.panel(st.nick || v.label, "VEHICLE SHEET · " + p.name.toUpperCase(), kids, { corners: true, headerRight: EN.ui.ruleChip("vc-stats", { title: "Vehicle Stats & Traits" }) });
  }

  // its state in play: speed, altitude, the Impact DC and the dice
  function statePanel(ch, v, pil) {
    var s = statsOf(ch, v), st = integrity(ch, v).st, im = impact(st.spd), cr = crashOf(st.spd, s.airborne), rm = ramOf(s.mass, st.spd);
    var kids = [
      el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginBottom: "10px" } }, [el("span.mono", { style: { fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)" }, text: "SPEED RIGHT NOW" })].concat(SPEEDS.map(function (sp) {
        return el("button.btn.sm" + (st.spd === sp ? ".primary" : ""), { type: "button", dataset: { garageSpeed: sp }, onclick: function () { vset(v.key, function (x) { x.spd = sp; }); } }, sp.toUpperCase());
      }))),
      el("div.row.wrap.garage-grid", { style: { gap: "10px 14px", margin: "0 0 8px" } }, [
        cell("IMPACT DC", im.dc, st.spd.toUpperCase(), { key: "impact", link: "vc-damage/the-impact-dc", title: "One DC, keyed to speed at the moment things go wrong: Control Checks, and every save a collision or crash forces." }),
        cell("CRASH", cr.n ? cr.n + "d10" : "none", cr.n ? "DC " + cr.dc + (s.airborne ? " · AIRBORNE +1 STEP" : "") : "AT REST", { key: "crash", link: "vc-damage/crashes", title: "Crash damage ignores Structure. A controlled stop takes half and hurts no occupant." }),
        cell("RAM", rm.text, s.mass.toUpperCase() + " MASS · BLUDGEONING", { key: "ram", link: "vc-damage/collisions-and-ramming", title: "The defender takes double. Fast or Very Fast adds 1d10." }),
        cell("CONTROL CHECK", pil.barred ? "barred" : (pil.total >= 0 ? "+" : "") + pil.total, "VS DC " + im.dc, { key: "control", link: "vc-damage/crashes", color: pil.untrained ? "var(--warn)" : "var(--accent)" })
      ])
    ];
    if (G().state && /Aerial|Starcraft/.test(v.prof.category) || s.airborne) {
      kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", margin: "6px 0" } }, [el("span.mono", { style: { fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)" }, text: "ALTITUDE" })].concat(BANDS.map(function (b) {
        return el("button.btn.sm" + (st.alt === b ? ".primary" : ""), { type: "button", dataset: { garageAlt: b }, title: BAND_NOTE[b], onclick: function () { vset(v.key, function (x) { x.alt = b; }); } }, b.toUpperCase());
      })).concat([el("span.help", { style: { margin: 0, fontSize: "11px", flex: "1 1 260px" }, text: BAND_NOTE[st.alt] + " Changing bands costs one round of climb or dive." })])));
    }
    return EN.ui.panel("Right now", st.spd.toUpperCase(), kids, { corners: true, headerRight: EN.ui.ruleChip("vc-damage", { title: "Damage, Collisions & Crashes" }) });
  }

  function traitsPanel(ch, v) {
    var s = statsOf(ch, v), kids = [];
    if (!s.traits.length) kids.push(el("p.help", { style: { margin: 0 }, text: "No traits." }));
    s.traits.forEach(function (t) {
      var r = traitRule(t), id = "trait:" + t, open = !!_open[id];
      kids.push(el("div.garage-trait", { dataset: { garageTrait: t }, style: { padding: "5px 0", borderBottom: "1px solid var(--border)" } }, [
        el("button.btn.sm.ghost", { type: "button", style: { textAlign: "left" }, onclick: function () { _open[id] = !open; EN.app.render(); } }, (open ? "▾ " : "▸ ") + t.toUpperCase()),
        open && r ? plain(el("p.help", { style: { margin: "4px 0 2px 8px", fontSize: "12px" } }), r.text) : null]));
    });
    if (s.lo.length) kids.push(el("p.help", { style: { margin: "8px 0 0", fontSize: "11px" }, text: "Traits shown are as the vehicle stands with what is fitted (a Cabin Kit makes it Enclosed, a Cut-Down Open-Frame)." }));
    return EN.ui.panel("Traits", s.traits.length + " ON THE FRAME", kids, { corners: true });
  }
  function notesPanel(ch, v) {
    var st = vstate(ch, v.key);
    return EN.ui.panel("Notes", "THIS VEHICLE ONLY", [
      el("textarea", { value: st.notes, maxlength: "500", placeholder: "Quirks, plates, where it is parked, who has the keys…", "aria-label": "Notes", dataset: { garage: "notes" }, style: { width: "100%", minHeight: "70px", fontSize: "13px" },
        oninput: function () { var val = this.value; vset(v.key, function (x) { x.notes = val.slice(0, 500); }, true); } })], { corners: true });
  }

  function vehiclePage(ch, list, v) {
    var pil = G().pilot(ch);
    var out = [picker(ch, list, v)];
    out.push(sheetPanel(ch, v, pil));
    out.push(el("div", { style: { marginTop: "12px" } }, [statePanel(ch, v, pil)]));
    // the piloting panel: the Vehicle Ops numbers and the ROLL buttons (js/inventory.js)
    G().ops(ch).forEach(function (n) { out.push(el("div", { style: { marginTop: "12px" } }, [n])); });
    out.push(el("div.modgrid6", { style: { marginTop: "12px" } }, [
      el("div", { style: { gridColumn: "span 4", minWidth: 0 } }, [traitsPanel(ch, v)]),
      el("div", { style: { gridColumn: "span 2", minWidth: 0 } }, [notesPanel(ch, v)])]));
    return out;
  }

  /* ================= CHASE ================= */
  function lead(c, who) {
    var pips = [];
    var bands = (C().chase && C().chase.lead) || [];
    for (var n = 0; n <= 5; n++) {
      var b = bands[n] || {}, on = c.lead === n;
      pips.push(el("div", { dataset: { chaseLead: String(n) }, title: (b.band || "") + (b.gap ? ": " + b.gap : ""), style: {
        flex: "1 1 0", minWidth: "64px", textAlign: "center", padding: "7px 4px", border: "1px solid " + (on ? "var(--accent)" : "var(--border)"), background: on ? "var(--accent-dim, var(--bg3))" : "var(--bg1)",
        color: on ? "var(--accent-ink, var(--text))" : "var(--text3)" } }, [
        el("div.mono", { style: { fontSize: "20px", lineHeight: 1, color: on ? "var(--text)" : "var(--text3)" }, text: String(n) }),
        el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".1em" }, text: (b.band || "").toUpperCase() })]));
    }
    return el("div.row", { style: { gap: "4px", margin: "8px 0" } }, pips);
  }
  function move(c, delta, text) {
    var was = c.lead;
    c.lead = clamp(was + delta, 0, 5);
    logIt(c, text + " Lead " + was + (c.lead === was ? " stays" : " to " + c.lead) + ".");
    c.end = c.lead >= 5 ? "escaped" : c.lead <= 0 ? "contact" : "";
  }
  function chaseTracker(ch, v) {
    var c = chaseOf(ch), fleeing = c.role === "fleeing";
    var kids = [];
    if (!c.on) {
      kids.push(el("p.help", { style: { margin: "0 0 8px" }, text: "A chase begins at Lead 2 (Close) unless the fiction sets otherwise. Pick your side, then start it. It is saved on this sheet." }));
      kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
        el("button.btn.sm.primary", { type: "button", dataset: { chase: "start-fleeing" }, title: "You are the fleeing target: you escape at Lead 5", onclick: function () { cset(function (x) { Object.assign(x, NOCHASE, { on: true, role: "fleeing", log: [] }); logIt(x, "Chase begins at Lead 2 (Close). You are fleeing."); }); } }, "START: FLEEING"),
        el("button.btn.sm.primary", { type: "button", dataset: { chase: "start-pursuing" }, title: "You are the pursuer: you win at Lead 0 by resolving a capture", onclick: function () { cset(function (x) { Object.assign(x, NOCHASE, { on: true, role: "pursuing", log: [] }); logIt(x, "Chase begins at Lead 2 (Close). You are pursuing."); }); } }, "START: PURSUING")]));
      return EN.ui.panel("Chase tracker", "NO CHASE RUNNING", kids, { corners: true, headerRight: EN.ui.ruleChip("vc-chase", { title: "Chases & Lead" }) });
    }
    var bands = (C().chase && C().chase.lead) || [], b = bands[c.lead] || {};
    kids.push(el("div.row.wrap", { style: { gap: "10px", alignItems: "baseline" } }, [
      chip(fleeing ? "YOU ARE FLEEING" : "YOU ARE PURSUING", "var(--accent)"),
      el("span.mono", { dataset: { chase: "round" }, style: { fontSize: "12px", color: "var(--text2)" }, text: "ROUND " + c.round }),
      el("span.mono", { dataset: { chase: "lead-val" }, style: { fontSize: "12px", color: "var(--text2)" }, text: "LEAD " + c.lead + " · " + (b.band || "").toUpperCase() + (b.gap ? " · GAP " + b.gap : "") }),
      el("span", { style: { flex: "1 1 auto" } }),
      el("button.btn.sm.ghost", { type: "button", dataset: { chase: "end" }, title: "Stop tracking this chase", onclick: function () { cset(function (x) { Object.assign(x, NOCHASE, { log: [] }); }); } }, "END CHASE")]));
    kids.push(lead(c));
    if (c.end === "escaped") kids.push(el("div.muted-box", { dataset: { chase: "ended" }, style: { borderColor: "var(--success)", color: "var(--success)", textAlign: "left" }, text: "ESCAPED. The fleeing side vanishes into the city. Escaping never reduces the Heat the chase earned." }));
    if (c.end === "contact") kids.push(el("div.muted-box", { dataset: { chase: "ended" }, style: { borderColor: "var(--danger)", color: "var(--danger)", textAlign: "left" }, text: "CONTACT. The pursuer wins by resolving a capture on their turn: a ram, a board, or a force-stop against the target." }));
    var ended = !!c.end;
    function res(mag, sign, label) {
      return el("button.btn.sm", { type: "button", disabled: c.res || ended, dataset: { chaseResult: label }, title: "Your side " + (sign > 0 ? "wins" : sign < 0 ? "loses" : "stalls") + " the round's Chase Check" + (mag > 1 ? " by a Dominant Victory (Margin +5 on d20, +3 in Dice Pools)" : ""),
        onclick: function () {
          cset(function (x) {
            var d = (x.role === "pursuing" ? -1 : 1) * sign * mag;
            if (!sign) { logIt(x, "Round " + (x.round | 0 || 1) + ": stalemate. The GM introduces a sudden hazard for both sides."); x.res = true; return; }
            move(x, d, "Round " + (x.round | 0 || 1) + ": " + (sign > 0 ? "you win" : "you lose") + (mag > 1 ? " (Dominant)" : "") + ".");
            x.res = true;
          });
        } }, label);
    }
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", margin: "6px 0" } }, [el("span.mono", { style: { fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)" }, text: "THE ROUND" }),
      res(2, 1, "DOMINANT WIN"), res(1, 1, "WIN"), res(0, 0, "STALEMATE"), res(1, -1, "LOSS"), res(2, -1, "DOMINANT LOSS"),
      el("button.btn.sm.primary", { type: "button", disabled: ended, dataset: { chase: "next" }, title: "Start the next round: the System Hit allowance resets", onclick: function () { cset(function (x) { x.round = (x.round | 0 || 1) + 1; x.res = false; x.mine = 0; x.theirs = 0; }); } }, "NEXT ROUND")]));
    function hit(who) {
      var mine = who === "them", used = mine ? c.mine : c.theirs;
      return el("button.btn.sm", { type: "button", disabled: !!used || ended, dataset: { chaseHit: who }, title: "A System Hit moves Lead 1 at once, at most 1 step per round per side" + (used ? " (used this round)" : ""),
        onclick: function () { cset(function (x) {
          var fl = x.role !== "pursuing", d = who === "them" ? (fl ? 1 : -1) : (fl ? -1 : 1);
          if (who === "them") x.mine = 1; else x.theirs = 1;
          move(x, d, who === "them" ? "A System Hit lands on them." : "A System Hit lands on you.");
        }); } }, who === "them" ? "SYSTEM HIT ON THEM" : "SYSTEM HIT ON ME");
    }
    function crash(who) {
      return el("button.btn.sm", { type: "button", disabled: ended, dataset: { chaseCrash: who }, title: "A crash settles the chase (see Crashes)",
        onclick: function () { cset(function (x) {
          var mePursuer = x.role === "pursuing", pursuerCrashed = (who === "me") === mePursuer;
          if (pursuerCrashed) { var was = x.lead; x.lead = 5; x.end = "escaped"; logIt(x, "The pursuer crashed: the fleeing side escapes. Lead " + was + " to 5."); }
          else if (x.lead <= 2) { var w2 = x.lead; x.lead = 0; x.end = "contact"; logIt(x, "The fleeing side crashed at Lead " + w2 + ": the pursuers reach Contact at the start of their next turn."); }
          else logIt(x, "The fleeing side crashed at Lead " + x.lead + ": the GM rules whether the wreck is reachable before its crew scatters.");
        }); } }, who === "me" ? "I CRASHED" : "THEY CRASHED");
    }
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", margin: "6px 0" } }, [el("span.mono", { style: { fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)" }, text: "ON TOP OF IT" }), hit("them"), hit("me"), crash("me"), crash("them")]));
    // the straightaway: the strictly higher Speed rating gains Edge; Handling never counts
    var s = v ? statsOf(ch, v) : null, rivalRank = c.rival === "On foot" ? 0 : RATINGS.indexOf(c.rival), myRank = s ? RATINGS.indexOf(s.straight) : 0;
    var edge = myRank > rivalRank ? "YOU GAIN EDGE" : myRank < rivalRank ? "THEY GAIN EDGE" : "NEITHER";
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", margin: "6px 0" } }, [el("span.mono", { style: { fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)" }, text: "THEIR SPEED" })].concat(RATINGS.concat(["On foot"]).map(function (r) {
      return el("button.btn.sm" + (c.rival === r ? ".primary" : ""), { type: "button", dataset: { chaseRival: r }, onclick: function () { cset(function (x) { x.rival = r; }); } }, r.toUpperCase());
    })).concat([el("span.mono", { dataset: { chase: "straight" }, style: { fontSize: "11px", color: myRank === rivalRank ? "var(--text3)" : "var(--accent)" }, text: "ON A STRAIGHTAWAY: " + edge + (s ? " (yours: " + s.straight + (s.plates ? ", Plate Kit counts one lower" : "") + ")" : "") })])));
    kids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", margin: "6px 0" } }, [el("span.mono", { style: { fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)" }, text: "HEAT" }),
      el("button.btn.sm", { type: "button", dataset: { chaseHeat: "-1" }, onclick: function () { cset(function (x) { x.heat = Math.max(0, (x.heat | 0) - 1); }); } }, "−"),
      el("span.mono", { dataset: { chase: "heat" }, style: { fontSize: "18px", minWidth: "26px", textAlign: "center" }, text: String(c.heat) }),
      el("button.btn.sm", { type: "button", dataset: { chaseHeat: "1" }, onclick: function () { cset(function (x) { x.heat = Math.min(20, (x.heat | 0) + 1); }); } }, "+"),
      el("span.help", { style: { margin: 0, fontSize: "11px", flex: "1 1 280px" }, text: "+1 for a loud, public chase, +1 more for a crash, casualties, or property nobody can ignore. Keep it here; the GM owns what the territory does about it." })]));
    if (c.log.length) kids.push(el("div", { dataset: { chase: "log" }, style: { marginTop: "6px", paddingTop: "6px", borderTop: "1px solid var(--border)" } }, c.log.map(function (l, n) {
      return el("div.mono", { style: { fontSize: "11px", color: n ? "var(--text3)" : "var(--text2)", padding: "1px 0" }, text: l.t });
    })));
    return EN.ui.panel("Chase tracker", "LEAD " + c.lead + " · ROUND " + c.round, kids, { corners: true, headerRight: EN.ui.ruleChip("vc-chase", { title: "Chases & Lead" }) });
  }

  // the rules a player needs, from the Handbook's own text (EN.chases), the vehicle's numbers worked in
  function section(id, title, kids, tag) {
    var open = !!_open[id];
    return el("div.garage-rule", { dataset: { garageRule: id }, style: { borderBottom: "1px solid var(--border)", padding: "4px 0" } }, [
      el("button.btn.sm.ghost", { type: "button", style: { width: "100%", textAlign: "left", display: "flex", gap: "8px" }, "aria-expanded": open ? "true" : "false", onclick: function () { _open[id] = !open; EN.app.render(); } },
        [el("span", { text: (open ? "▾ " : "▸ ") + title.toUpperCase() }), tag ? el("span.mono", { style: { color: "var(--text3)", fontSize: "9px", marginLeft: "auto" }, text: tag }) : null]),
      open ? el("div", { style: { padding: "4px 8px 8px" } }, kids) : null]);
  }
  function p(text) { return plain(el("p", { style: { margin: "4px 0", fontSize: "12.5px", lineHeight: 1.5, color: "var(--text2)" } }), text); }
  function named(list) { return (list || []).map(function (x) { return p("**" + x.name + ".** " + x.text); }); }
  function table(head, rows, hi) {
    return el("table.garage-table", { style: { width: "100%", borderCollapse: "collapse", fontSize: "12px", margin: "4px 0" } }, [
      el("tr", null, head.map(function (h) { return el("th", { style: { textAlign: "left", fontFamily: "var(--disp)", fontSize: "9px", letterSpacing: ".1em", color: "var(--text3)", padding: "3px 6px" }, text: h }); }))]
      .concat(rows.map(function (r, n) { return el("tr", { style: { background: hi === n ? "var(--bg3)" : "transparent" } }, r.map(function (cell) { return el("td", { style: { padding: "3px 6px", borderTop: "1px solid var(--border)", color: hi === n ? "var(--text)" : "var(--text2)" }, text: String(cell) }); })); })));
  }
  function rulesPanel(ch, v) {
    var c = C(), H = c.chase || {}, HB = H.handbook || {}, s = v ? statsOf(ch, v) : null, st = v ? vstate(ch, v.key) : { spd: "Stationary" };
    var cat = v ? v.prof.category : "Ground", S = [];
    var impactRows = c.impactDc || [], hiImpact = st.spd === "Stationary" ? 0 : impactRows.map(function (r) { return r.speed; }).indexOf(st.spd);
    S.push(section("lead", "The Lead and the Chase Check", [p(H.intro), table(["Lead", "Band", "Gap in spaces"], (H.lead || []).map(function (r) { return [r.lead, r.band, r.gap]; })), p(H.ranges), p(H.startAndEnd), p(H.resolving)]
      .concat(named((H.outcomes || []).concat(HB.straightaway ? [{ name: "Edge", text: HB.straightaway }] : []))), "0 TO 5"));
    S.push(section("crew", "The crew, System Hits and Heat", [HB.crew ? p("**The crew.** " + HB.crew) : null, HB.systemHit ? p("**System Hits.** " + HB.systemHit) : null, HB.heat ? p("**Heat.** " + HB.heat) : null, HB.onFoot ? p("**On foot.** " + HB.onFoot) : null].filter(Boolean)));
    S.push(section("impact", "The Impact DC", [p(c.impactIntro), table(["Speed", "DC"], impactRows.map(function (r) { return [r.speed, r.dc]; }), hiImpact)], "YOURS: " + (impact(st.spd).dc)));
    S.push(section("crash", "Crashes", [p(c.crashes && c.crashes.intro)].concat(((c.crashes && c.crashes.steps) || []).map(function (x) { return p("**" + x.n + ". " + x.name + ".** " + x.text); })).concat(v ? [p("**For this vehicle at " + st.spd + ":** " + crashOf(st.spd, s.airborne).text + (s.airborne ? " (airborne: one speed step higher)." : "."))] : [])));
    var col = c.collisions || {};
    S.push(section("ram", "Collisions and ramming", [p(col.ram), p(col.onWin), col.ramDamage ? p("**" + col.ramDamage.name + ".** " + col.ramDamage.text) : null, col.occupants ? p("**" + col.occupants.name + ".** " + col.occupants.text) : null].concat(v ? [p("**Yours (" + s.mass + " mass at " + st.spd + "):** " + ramOf(s.mass, st.spd).text + " Bludgeoning; the defender takes double.")] : []).filter(Boolean)));
    var sh = c.shooting || {};
    S.push(section("shoot", "Shooting a vehicle", [sh.defense ? p("**" + sh.defense.name + ".** " + sh.defense.text) : null, sh.structure ? p("**" + sh.structure.name + ".** " + sh.structure.text) : null]
      .concat((sh.structure && sh.structure.gate || []).map(function (g) { return p("• " + g); })).concat([sh.structure && sh.structure.siege ? p(sh.structure.siege) : null, sh.occupants ? p("**" + sh.occupants.name + ".** " + sh.occupants.text) : null])
      .concat(((sh.occupants && sh.occupants.routes) || []).map(function (r) { return p("• " + r.text); })).concat([sh.wrecked ? p("**" + sh.wrecked.name + ".** " + sh.wrecked.text) : null]).filter(Boolean)));
    var cb = c.combat || {};
    S.push(section("fire", "Piloting under fire and Mounted weapons", [p(cb.intro), p(cb.underFire), cb.shootingMoving ? p("**" + cb.shootingMoving.name + ".** " + cb.shootingMoving.text) : null].concat((cb.mounted || []).map(p)).concat([c.openThrottle ? p("**" + c.openThrottle.name + "** (" + c.openThrottle.action + "). " + c.openThrottle.text) : null]).filter(Boolean)));
    var cr = c.categoryRules || {}, cats = [];
    function catBlock(k, label, on) {
      var x = cr[k]; if (!x) return;
      var kids = [];
      if (x.intro) kids.push(p(x.intro));
      (x.bands || []).forEach(function (b) { kids.push(p("• **" + b.name + ":** " + b.text)); });
      if (x.changing) kids.push(p(x.changing));
      if (x.stall) kids.push(p("**" + x.stall.name + ".** " + x.stall.text));
      if (x.text) kids.push(p(x.text));
      cats.push({ on: on, node: section("cat-" + k, label, kids, on ? "YOUR CATEGORY" : "") });
    }
    catBlock("aerial", "Aerial: altitude", /Aerial/.test(cat)); catBlock("marine", "Marine: water", /Marine/.test(cat)); catBlock("starcraft", "Starcraft: vacuum", /Starcraft/.test(cat)); catBlock("walker", "Industrial and Mechs: the Walker package", /Industrial/.test(cat));
    cats.sort(function (a, b) { return (b.on ? 1 : 0) - (a.on ? 1 : 0); }).forEach(function (x) { S.push(x.node); });
    S.push(section("tow", "Capacity and towing", [p(c.capacity), c.towing ? p("**" + c.towing.name + ".** " + c.towing.text) : null].filter(Boolean)));
    var hk = c.hacking || {};
    S.push(section("hack", "Hacking and rigging", [p(hk.codebreaker)].concat((hk.nodes || []).map(function (n) { return p("**" + n.name + ".** " + n.text); })).concat([p(hk.inChase), p(hk.riggingIntro)]).concat((hk.rigging || []).map(function (n) { return p("**" + n.name + ".** " + n.text); })).filter(Boolean)));
    return EN.ui.panel("The rules", "WHAT THE HANDBOOK SAYS", S, { corners: true, headerRight: EN.ui.ruleChip("vc-chase", { title: "Chases & Lead" }) });
  }
  function chasePage(ch, list, v) {
    var out = [picker(ch, list, v), chaseTracker(ch, v), el("div", { style: { marginTop: "12px" } }, [rulesPanel(ch, v)])];
    return out;
  }

  /* ================= CHOP SHOP: mods, and repairs from the Repair Reserve ================= */
  function repairPanel(ch, list, v) {
    var i = integrity(ch, v), p0 = v.prof, E = EN.vehicles || {}, st = i.st, fmt = G().fmtG;
    var kids = [];
    (E.repair || []).forEach(function (t) { kids.push(plain(el("p.help", { style: { margin: "0 0 6px", fontSize: "12px" } }), t)); });
    function spend(cost, label, then) {
      var have = Number(ch.glimmer) || 0;
      if (have < cost) { toast("Not enough Glimmer: " + label + " costs " + fmt(cost) + "."); return; }
      store.update(function (c) { c.glimmer = (c.glimmer || 0) - cost; }, { ledger: label + " (" + v.label + ")" });
      then();
    }
    var missing = i.max - i.cur, half = Math.floor(i.max / 2);
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", margin: "8px 0" } }, [
      el("span.mono", { style: { fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)" }, text: "GARAGE" }),
      el("button.btn.sm.primary", { type: "button", disabled: missing <= 0, dataset: { chop: "garage-half" }, title: "One week's Repair Reserve (" + fmt(p0.reserve) + ") in parts and labor restores up to half the maximum Integrity (" + half + "). Needs upkeep current and a garage.",
        onclick: function () { spend(p0.reserve, "Garage repair", function () { repair(v, Math.min(missing, half), "Garage repair"); }); } }, "GARAGE REPAIR · " + fmt(p0.reserve)),
      el("button.btn.sm", { type: "button", disabled: missing <= 0, dataset: { chop: "garage-full" }, title: "A full restore from 0 costs two weeks' Reserve (" + fmt(p0.reserve * 2) + ") paid at once and a full Downtime of work",
        onclick: function () { spend(p0.reserve * 2, "Full restore", function () { repair(v, missing, "Full restore"); }); } }, "FULL RESTORE · " + fmt(p0.reserve * 2))]));
    var cap = Math.max(0, half - i.cur);
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", margin: "8px 0" } }, [
      el("span.mono", { style: { fontSize: "9px", letterSpacing: ".12em", color: "var(--text3)" }, text: "FIELD" }),
      el("input", { type: "number", min: "1", value: _amt.field, placeholder: "successes", title: "Successes on the Tech (Engineering) Dice Pool with an Engineering Toolkit", dataset: { chop: "field-n" }, style: { width: "92px", padding: "4px 6px" }, oninput: function () { _amt.field = this.value; } }),
      el("button.btn.sm", { type: "button", disabled: st.field || i.wrecked || cap <= 0, dataset: { chop: "field" }, title: i.wrecked ? "Wrecked: no field repair, garage lane only" : st.field ? "Once per vehicle per day: used" : "5 Integrity per success, once per vehicle per day, and never above half the maximum. It clears Disabled.",
        onclick: function () { var n = Math.floor(Number(_amt.field)); if (!(n > 0)) { toast("Enter the successes first."); return; } _amt.field = ""; repair(v, Math.min(cap, n * 5), "Field repair"); vset(v.key, function (x) { x.field = true; x.disabled = false; }); } }, "FIELD REPAIR"),
      el("button.btn.sm.ghost", { type: "button", dataset: { chop: "field-reset" }, title: "A new day: the field repair can be used again", onclick: function () { vset(v.key, function (x) { x.field = false; }); } }, st.field ? "✓ USED TODAY · NEW DAY" : "NEW DAY")]));
    kids.push(el("p.help", { style: { margin: "6px 0 0", fontSize: "11px" } }, [document.createTextNode("Upkeep, storage and the rest: "), EN.ui.ruleLink("ref-vehicles", "Vehicles"), document.createTextNode(" in the Codex. Weekly upkeep for " + v.label + ": " + fmt(p0.upkeep) + " (" + fmt(p0.fuel) + " Fuel and Routine plus " + fmt(p0.reserve) + " Repair Reserve).")]));
    return EN.ui.panel("Repairs", i.cur + " / " + i.max + " INTEGRITY", kids, { corners: true });
  }
  function chopPage(ch, list, v) {
    return [picker(ch, list, v), G().mods(ch, v.key), el("div", { style: { marginTop: "12px" } }, [repairPanel(ch, list, v)])];
  }

  /* ================= the tab ================= */
  function render(ch) {
    var list = vehicles(ch), v = selected(ch, list);
    var root = el("div.garage", { dataset: { garage: "root" } });
    if (!v) {
      root.appendChild(pageBar());
      root.appendChild(el("div.muted-box", { style: { padding: "22px", textAlign: "center" }, text: "You do not own a vehicle. Buy or lease one in the Gray Market." }));
      return [root];
    }
    // the Vehicle Ops panel follows the vehicle chosen: its chassis, Handling, category and speed are this vehicle's the first time it is shown
    var applyKey = ((ch.meta && ch.meta.id) || "") + "|" + v.key;
    if (_applied !== applyKey) { _applied = applyKey; G().pickChassis(v.prof.name); }
    root.appendChild(pageBar());
    var page = _page === "chase" ? chasePage(ch, list, v) : _page === "chop" ? chopPage(ch, list, v) : vehiclePage(ch, list, v);
    page.forEach(function (n) { if (n) root.appendChild(n); });
    K().mountTrays(root);
    return [root];
  }

  return { render: render, roll: roll, controlDc: controlDc, setPage: function (k) { if (k === "vehicle" || k === "chase" || k === "chop") _page = k; }, page: function () { return _page; },
           state: { vstate: vstate, chaseOf: chaseOf }, vehicles: vehicles, stats: statsOf, crashOf: crashOf, ramOf: ramOf, impact: impact };
})();
