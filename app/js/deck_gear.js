/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDeck: Gear (P4, 15 Nov 2026).
   One place for what a Freelancer owns, in place of four tabs that each held a piece of it:
     MINE     every piece in one list, grouped by WHERE IT IS (in hand and worn, carried, stashed, installed
              chrome), and beside it the piece that is picked: what it is, where it is with the controls to
              move it, its mods, its condition, its lease, and selling or dropping it
     MARKET   the same shelves the Gray Market stocks, at the storefront picked, and a purchase that lands
              where the player says (in hand, carried, or the stash) in the one press
   The stage bar keeps "Classic gear", the Inventory tab as Classic draws it, for what this screen does
   not hold yet: the benches (Arms Table, Impact Table, Tech Bay, Fabrication, Garage), installing and
   removing chrome, the wallet ledger, Bills and the payout splitter.

   NOTHING IS WORKED OUT HERE. Prices, shelves, Load, slots, racks and leases come from EN.inventoryView.core
   and EN.engine; every button calls the function the Inventory tab's own control calls (toggleEquip,
   toggleSlotEquip, setCarry, toggleConceal, buy with a storefront and a place, buyCyber, sell, drop,
   payLease, setPremium, buyoutLease, pickUpDropped).
   DOM rules as in js/deck_shell.js: one .dk root, dk- classes only. It is redrawn on every render, so what is
   picked and typed is kept in S. No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.gear = (function () {
  var el = EN.ui.el;
  var S = { sel: null, msel: null, q: "", f: "All", front: "undercut", mq: "", mtype: null, prem: false, pane: "list" };
  var MAX_ROWS = 240;

  function I() { return EN.inventoryView.core; }
  function eng() { return EN.engine; }
  function redraw() { EN.app.render(); }
  function cxHas(a) { try { return !!(a && EN.codexView && EN.codexView.has && EN.codexView.has(a)); } catch (e) { return false; } }
  function chip(text, tone, title) { return el("span.dk-chip" + (tone ? "." + tone : ""), { title: title || null, text: text }); }
  function btn(label, tone, name, fn, title, off) {
    return el("button.dk-btn" + (tone ? "." + tone : ""), { type: "button", title: title || null, disabled: !!off, dataset: { dkDo: name }, onclick: fn }, label);
  }
  // a button that only changes what is showing: it still takes a click on a read-only record (js/deck_shell.js, segBar)
  function nav(label, tone, name, fn, title, off) { var n = btn(label, tone, name, fn, title, off); n.setAttribute("data-ro-keep", "1"); return n; }
  function sec(title, kids, name) { return el("div.dk-gsec", { dataset: { dkGsec: name } }, [el("h4.dk-sec", { text: title })].concat(kids)); }
  function classic(sub) { try { if (sub) I().openSub(sub); } catch (e) {} EN.deck.shell.gearView("classic"); }
  var LEGAL = { Legal: "ok", Licensed: "gold", Restricted: "warn", Contraband: "bad" };

  /* ---- what a piece says about itself: the catalog's own lines, for an owned piece and a listing alike ---- */
  function traitTip(t, armorFirst) {
    try { var L = EN.gearCatalog.traitLookup(t, armorFirst), d = L && L.def; return typeof d === "string" ? d : (d && (d.tip || d.text || d.summary || d.desc)) || ""; } catch (e) { return ""; }
  }
  function statBits(ch, it, key) {
    var out = [], E = eng();
    if (it.damage && it.damage !== "0") {
      var grip = key && I().isWeapon(it) && E.weaponGrip ? E.weaponGrip(ch, it, key) : null;
      var dmg = grip && grip.dice ? String(it.damage).replace(/^\s*\d+d\d+/, grip.dice) : it.damage;
      out.push(EN.ui.damageText ? EN.ui.damageText(el("span.dk-chip.acc", { title: "Damage" }), dmg) : chip(dmg, "acc"));
    }
    if (it.range && !/^Melee/.test(it.range)) out.push(chip("Range " + it.range.replace(/\s/g, ""), "", "Normal / long"));
    if (typeof it.ammo === "number" && it.ammo > 1) out.push(chip("Magazine " + it.ammo));
    if (typeof it.dr === "number") {
      var st = key && E.armorState ? E.armorState(ch, key) : null;
      out.push(st && st.base && st.lost > 0 ? chip((st.current + st.premiumDR) + " / " + (st.base + st.premiumDR) + " DR", st.breached ? "bad" : "warn", st.lost + " lost until repaired")
        : chip((st ? st.base + st.premiumDR : it.dr) + " DR", "ok", "Damage Reduction against Standard Physical Damage"));
    }
    if (it.blockBonus) out.push(chip("+" + it.blockBonus + " Block", "gold"));
    if (typeof it.defense === "number") out.push(chip((it.defense >= 0 ? "+" : "") + it.defense + " Def", "acc", "While this shield is wielded"));
    if (it.blockDie) out.push(chip(it.blockDie + " Block", "gold"));
    if (it.wardDie) out.push(chip(it.wardDie + " Ward", "acc"));
    if (it.cyber) { out.push(chip(it.zone, "acc", "Interface Zone")); out.push(chip(it.sp + " SP", it.sp >= 3 ? "warn" : "gold", "Static Points: adds to your Chrome Tax")); if (it.slots) out.push(chip(it.slots + " mod slots")); }
    else if (I().isDefensive(it) && it.slots) out.push(chip(it.slots + " mod slots"));
    var slotText = it.slotText || (Array.isArray(it.slot) ? it.slot.join(" + ") : it.slot);
    if (slotText && E.itemSlots && E.itemSlots(it).length) out.push(chip(slotText, "", "Body Slot"));
    return out;
  }
  function proseLines(it) {
    var lo = { conditions: true, used: {} }, out = [];
    function line(label, text, tone) { if (text) out.push(el("p.dk-gline" + (tone ? "." + tone : ""), null, [label ? el("b", { text: label + ": " }) : null, EN.ui.ruleText(el("span"), String(text), lo)])); }
    line("", it.desc);
    line(it.signature || /^Effect \(/.test(it.effect || "") ? "" : "Effect", it.effect);
    line("Powered Benefits", it.poweredBenefits); line("Activation", it.activation); line("Limitation", it.limitation, "dk-warnt");
    line("Drawback", it.drawback, "dk-badt"); line("Synergy", it.synergy); line("Basic Use", it.basic); line("Proficient Use", it.proficient);
    line("Prerequisite For", it.cyber && it.prereqFor); line("", it.cyber && it.tierNote);
    var facts = [it.type ? "Type: " + it.type : "", it.proficiency ? "Proficiency: " + it.proficiency : "",
      it.category ? "Tool Category: " + it.category + (it.categoryAlt ? " or " + it.categoryAlt : "") : "", it.skill ? "Governing Skill: " + it.skill : "", it.feeds ? "Feeds: " + it.feeds : "",
      it.nexus ? "Nexus: " + it.nexus : ""].filter(Boolean);
    if (facts.length) out.push(el("p.dk-gline.dk-dim", { text: facts.join(" · ") }));
    var traits = Array.isArray(it.traits) ? it.traits : [];
    if (traits.length) out.push(el("div.dk-chips.dk-traits", null, traits.map(function (t) { return chip(String(t), "", traitTip(t, I().isDefensive(it))); })));
    return out;
  }

  /* ---- MINE: what there is, and where ---------------------------------------------------------------- */
  var WHERE = [["on", "In hand and worn"], ["carried", "Carried"], ["stash", "Stashed"], ["chrome", "Installed chrome"], ["cstash", "Chrome stash"]];
  var KIND = { "Melee Weapons": "Weapons", "Ranged Weapons": "Weapons", "Signature Weapons": "Weapons", "Ammunition & Munitions": "Ammo", "Armor & Defensive Gear": "Armor",
    "Weapon Parts": "Parts", "Armor Mods": "Parts", "Vehicle Mods": "Parts", "Vehicles": "Vehicles" };
  function mineModel(ch) {
    var E = eng(), racks = E.rackState ? E.rackState(ch) : { byItem: {} }, out = [];
    (ch.equipment || []).forEach(function (e) {
      if (!e || !(e.qty > 0)) return;
      var it = I().findItem(e.name), key = I().entryKey(e), cs = (ch.carry && ch.carry[key]) || "stashed";
      var inHand = (ch.equippedWeapons || []).indexOf(key) !== -1, slotOn = E.isSlotEquipped(ch, key), rack = racks.byItem[key] || null;
      var where = (inHand || slotOn || cs === "worn") ? "on" : (cs === "carried" || cs === "racked") ? "carried" : "stash";
      var cat = I().stashCategory(it);
      out.push({ key: key, e: e, it: it, name: e.name, qty: e.qty, where: where, kind: KIND[cat] || "Gear", cat: cat, inHand: inHand, slotOn: slotOn, cs: cs, rack: rack,
        sub: inHand ? "in hand" + (rack ? ", racked in " + rack.name : "") : slotOn ? (E.equipSlotLabel ? String(E.equipSlotLabel(ch, key) || "equipped").toLowerCase() : "equipped")
          : cs === "worn" ? "worn" : cs === "racked" ? "racked" + (rack ? " in " + rack.name : " (adrift)") : cs === "carried" ? "carried" : (it && I().notCarried(it)) ? "parked" : cat });
    });
    (ch.cyberware || []).forEach(function (cw, i) {
      if (!cw || typeof cw !== "object") return;
      out.push({ key: "cw:" + i, cw: cw, name: cw.name || cw.base || "Chrome", qty: 1, where: "chrome", kind: "Chrome", cat: "Chrome", sub: (cw.zone || "") + (cw.sp != null ? " · " + cw.sp + " SP" : "") });
    });
    (ch.cyberStash || []).forEach(function (cw, i) {
      if (!cw || typeof cw !== "object") return;
      out.push({ key: "cs:" + i, cw: cw, stashed: true, name: cw.name || cw.base || "Chrome", qty: 1, where: "cstash", kind: "Chrome", cat: "Chrome", sub: "not installed" });
    });
    return out;
  }
  function row(x, on, pick) {
    return el("button.dk-gr" + (on ? ".on" : ""), { type: "button", "data-ro-keep": "1", "aria-pressed": on ? "true" : "false", dataset: { dkRow: x.key }, onclick: pick },
      [el("span.dk-two", null, [el("b", { text: x.name + (x.qty > 1 ? " ×" + x.qty : "") }), el("small", { text: x.sub || "" })]), x.price != null ? el("em", { text: x.price }) : null]);
  }
  function mineList(X, items) {
    var q = S.q.trim().toLowerCase(), out = [];
    var kinds = ["All"].concat(["Weapons", "Ammo", "Armor", "Gear", "Parts", "Vehicles", "Chrome"].filter(function (k) { return items.some(function (x) { return x.kind === k; }); }));
    if (kinds.indexOf(S.f) === -1) S.f = "All";
    var shown = items.filter(function (x) { return (S.f === "All" || x.kind === S.f) && (!q || x.name.toLowerCase().indexOf(q) !== -1); });
    out.push(el("input.dk-in", { "data-ro-keep": "1", type: "text", value: S.q, placeholder: "Search your gear", "aria-label": "Search your gear", dataset: { dkGq: "mine" }, oninput: function () { S.q = this.value; redraw(); } }));
    out.push(el("div.dk-gf", null, kinds.map(function (k) {
      return el("button.dk-fc" + (S.f === k ? ".on" : ""), { type: "button", "data-ro-keep": "1", "aria-pressed": S.f === k ? "true" : "false", dataset: { dkFilter: k }, onclick: function () { S.f = k; redraw(); } }, k);
    })));
    WHERE.forEach(function (w) {
      var list = shown.filter(function (x) { return x.where === w[0]; });
      if (!list.length) return;
      out.push(el("div.dk-gg", { dataset: { dkGroup: w[0] } }, [w[1], el("span", { text: String(list.length) })]));
      list.forEach(function (x) { out.push(row(x, S.sel === x.key, function () { S.sel = x.key; S.pane = "detail"; redraw(); })); });
    });
    if (!shown.length) out.push(el("p.dk-empty", { text: items.length ? "Nothing matches." : "You own nothing yet. The Market is one press away." }));
    return out;
  }
  function whereControls(X, x) {
    var ch = X.ch, E = eng(), it = x.it, e = x.e, key = x.key, out = [];
    if (it && I().notCarried(it)) return [el("p.dk-note", { text: "Parked: a vehicle or its mods carry no Load and are never on your person." })];
    var slot = it ? E.equipSlotFor(ch, it, e) : null, weapon = !!(it && I().isWeapon(it));
    var main = [];
    if (weapon) main.push(el("button.dk-tgl" + (x.inHand ? ".on" : ""), { type: "button", "aria-pressed": x.inHand ? "true" : "false", dataset: { dkDo: "equip" },
      title: x.inHand ? "Put it away: it leaves your attacks" : "Take it in hand: it joins your attacks on the Sheet", onclick: function () { I().toggleEquip(e); } }, x.inHand ? "✓ In hand" : "Take in hand"));
    if (slot) main.push(el("button.dk-tgl" + (x.slotOn ? ".on" : ""), { type: "button", "aria-pressed": x.slotOn ? "true" : "false", dataset: { dkDo: "slot" },
      title: x.slotOn ? "Stow it: it stops applying" : "Make this the live one (one at a time)", onclick: function () { I().toggleSlotEquip(slot, it, e); } },
      x.slotOn ? "✓ " + slot.verbs.act.charAt(0).toUpperCase() + slot.verbs.act.slice(1) : slot.verbs.on.charAt(0) + slot.verbs.on.slice(1).toLowerCase()));
    var targets = it && !E.isCarryGear(it) ? E.rackTargets(ch, e) : [], stale = !x.rack ? (ch.racked || {})[key] : null;
    var wearable = it ? (E.isWearable ? E.isWearable(it) : false) : false;
    if (!(x.inHand || x.slotOn)) {
      var opts = [["stashed", "Stashed"], ["carried", "Carried"]].concat(wearable ? [["worn", "Worn"]] : []);
      main.push(el("div.dk-seg", { role: "group", "aria-label": "Where it is", dataset: { dkCarry: x.cs } }, opts.map(function (o) {
        var on = x.cs === o[0] || (o[0] === "carried" && x.cs === "racked");
        return el("button.dk-segb" + (on ? ".on" : ""), { type: "button", "aria-pressed": on ? "true" : "false", dataset: { dkCarryTo: o[0] }, onclick: function () { I().setCarry(key, o[0]); } }, o[1]);
      })));
    }
    out.push(el("div.dk-row", null, main));
    // racked in worn Carry Gear: 1 less Load, and a holster or scabbard draws it free
    if ((targets.length || x.rack || stale) && (x.inHand || x.slotOn || x.cs === "carried" || x.cs === "racked")) {
      var cur = x.rack ? I().entryKey(x.rack) : (stale || "");
      var o2 = [el("option", { value: "", selected: !cur, text: "Not racked" })].concat(targets.map(function (g) { var gk = I().entryKey(g); return el("option", { value: gk, selected: cur === gk, text: "Racked in " + g.name }); }));
      if (cur && !targets.some(function (g) { return I().entryKey(g) === cur; })) o2.push(el("option", { value: cur, selected: true, text: x.rack ? "Racked in " + x.rack.name : "Racked (adrift)" }));
      out.push(el("div.dk-row", null, [el("span.dk-lab", { text: "Rack" }), el("select.dk-in.dk-sel", { "aria-label": "Rack it in worn Carry Gear", title: "Racked in worn Carry Gear it costs 1 less Load", dataset: { dkRack: "1", tour: "inventory-rack" },
        onchange: function () { var v = this.value; I().setCarry(key, v ? "racked|" + v : "carried"); } }, o2)]));
    }
    var extra = [];
    if (E.canConceal && E.canConceal(ch, e)) {
      var hid = E.isConcealed(ch, e), info = E.concealInfo(ch, e);
      extra.push(el("button.dk-tgl" + (hid ? ".on" : ""), { type: "button", "aria-pressed": hid ? "true" : "false", dataset: { dkDo: "conceal" }, title: (hid ? "Concealed. " : "Hide it on your person. ") + (info.note || ""),
        onclick: function () { I().toggleConceal(key); } }, hid ? "✓ Concealed" : "Conceal"));
    }
    var st = E.stowedInfo ? E.stowedInfo(ch, e) : null;
    if (x.rack && st && !(st.freeDraw && weapon)) extra.push(btn("Take out (" + st.action + ")", "warn", "take-out", function () { EN.combatView.core.setInHand(key, true); EN.ui.toast(x.name + " taken out (" + st.action + ")."); }, "Stowed in your " + st.gearName + ": take it out before you use it"));
    else if (x.rack && !st) extra.push(btn("Put back in the " + x.rack.name, "ghost", "put-back", function () { EN.combatView.core.setInHand(key, false); }));
    if (extra.length) out.push(el("div.dk-row", null, extra));
    return out;
  }
  function mineDetail(X, x) {
    var ch = X.ch, E = eng(), out = [el("button.dk-link.dk-back.dk-gback", { type: "button", "data-ro-keep": "1", dataset: { dkDo: "back" }, onclick: function () { S.pane = "list"; redraw(); } }, "‹ Your gear")];
    if (x.cw) {
      var cw = x.cw, prose = "";
      try { prose = (E.cyberDesc && E.cyberDesc(cw)) || ""; } catch (e) { prose = ""; }
      var effect = "";
      try { effect = (E.cyberEffect && E.cyberEffect(cw)) || ""; } catch (e) { effect = ""; }
      out.push(el("h2", { text: x.name }));
      out.push(el("div.dk-chips", null, [chip("Chrome"), cw.tier ? chip(cw.tier) : null, cw.zone ? chip(cw.zone, "acc", "Interface Zone") : null, cw.sp != null ? chip(cw.sp + " SP", "gold", "Static Points") : null, cw.side ? chip(cw.side === "L" ? "Left" : "Right") : null]));
      if (typeof prose === "string" && prose) out.push(el("p.dk-gline", null, [EN.ui.ruleText(el("span"), prose, { conditions: true })]));
      if (typeof effect === "string" && effect) out.push(el("p.dk-gline", null, [el("b", { text: "Effect: " }), EN.ui.ruleText(el("span"), effect, { conditions: true })]));
      out.push(sec(x.stashed ? "Not installed" : "Installed", [el("p.dk-note", { text: x.stashed ? "Bought and waiting. Installing it is clinic work, on the Chrome page of the Classic gear." : "Installing, removing and the Chrome Tax are on the Chrome page of the Classic gear." }),
        el("div.dk-row", null, [nav("Open the Chrome page", "", "open-chrome", function () { classic("chrome"); })])], "chrome"));
      return out;
    }
    var it = x.it, e = x.e, key = x.key;
    out.push(el("h2", { text: x.name + (x.qty > 1 ? " ×" + x.qty : "") }));
    if (!it) {
      out.push(el("div.dk-chips", null, [chip("Custom or unknown")]));
      out.push(sec("Where it is", whereControls(X, x), "where"));
      out.push(sec("Drop it", [el("div.dk-row", null, [btn("Drop one", "ghost", "drop", function () { I().drop(key); })])], "sell"));
      return out;
    }
    var worn = E.isWornEntry ? E.isWornEntry(ch, e) : false, load = E.entryUnitLoad ? E.entryUnitLoad(ch, e, { worn: worn }) : (E.itemLoad ? E.itemLoad(it.name, { worn: worn }) : 0);
    out.push(el("div.dk-chips", null, [chip(x.cat), chip(it.legality, LEGAL[it.legality] || ""), I().notCarried(it) ? null : chip("Load " + load, "", "What it spends of your Load Budget while it is on you"),
      e.part > 0 ? chip("1 part-used: " + e.part + " left") : null].concat(statBits(ch, it, key))));
    out.push(sec("Where it is", whereControls(X, x), "where"));
    // mods: read here, fitted at the bench (the benches are still the Classic inventory's)
    if (I().isWeapon(it) && EN.weaponParts && !it.signature) {
      var lo = (ch.weaponParts || {})[key] || {}, pk = ["targeting", "output", "core", "handling"].map(function (s) { return lo[s]; }).filter(Boolean).concat(lo.utility || []);
      var parts = pk.map(function (k) { var p = EN.weaponParts.byKey[k]; return p ? chip(p.name, "gold", p.effect) : null; }).filter(Boolean);
      out.push(sec("Mods", [el("div.dk-chips", null, parts.length ? parts : [el("small.dk-dim", { text: "No Parts fitted." })]),
        el("div.dk-row", null, [nav("Fit Parts at the Arms Table", "ghost", "bench-arms", function () { I().openBenchOn("ballistics", key); classic(); })])], "mods"));
    } else if (it.kind === "armor" && it.slots && EN.armorMods) {
      var mods = (E.armorModsOn ? E.armorModsOn(ch, key) : []).map(function (k) { var m = EN.armorMods.byKey[k]; return m ? chip(m.name, "gold", m.grants + ". " + m.effect) : null; }).filter(Boolean);
      out.push(sec("Mods", [el("div.dk-chips", null, mods.length ? mods : [el("small.dk-dim", { text: "No mods fitted, " + it.slots + (it.slots === 1 ? " slot." : " slots.") })]),
        el("div.dk-row", null, [nav("Fit mods at the Impact Table", "ghost", "bench-armor", function () { I().openBenchOn("armor", key); classic(); })])], "mods"));
    }
    var ast = typeof it.dr === "number" && E.armorState ? E.armorState(ch, key) : null;
    if (ast && ast.base) out.push(sec("Condition", [el("div.dk-row", null, [el("b.dk-cond", { text: (ast.current + ast.premiumDR) + " / " + (ast.base + ast.premiumDR) + " DR" }),
      el("small.dk-dim", { text: ast.breached ? "Breached: rebuilding it is a Project" : ast.lost ? ast.lost + " lost until repaired" : "Whole" }), el("span.dk-grow"),
      ast.lost ? nav("Repair at the Impact Table", "ghost", "bench-repair", function () { I().openBenchOn("armor", key); classic(); }) : null])], "condition"));
    if (it.upkeep) {
      var up = I().upkeepOf(it, e), bo = I().buyoutCost(it), lk = [];
      var state = e.leaseOwned ? "Owned outright: the lease is bought out." : e.leaseDue ? "Payment due: " + I().fmtG(up) + ". It grants none of its benefits until you pay."
        : (e.premium ? "Premium plan. " : "Leased. ") + "Next installment " + I().fmtG(up) + " in " + I().leaseDaysOf(e) + (I().leaseDaysOf(e) === 1 ? " day" : " days") + "; each Long Rest is a day.";
      if (!e.leaseOwned) {
        if (e.leaseDue) lk.push(btn("Pay " + I().fmtG(up), "bad", "lease-pay", function () { I().payLease(key); }));
        if (it.premium) lk.push(e.premium ? btn("Cancel Premium", "ghost", "lease-premium-off", function () { I().setPremium(key, false); }, "It drops to " + it.dr + " DR at once and nothing is refunded")
          : btn("Premium · " + I().fmtG(it.premium.upkeep), "ok", "lease-premium", function () { I().setPremium(key, true); }, it.premium.dr + " DR while the plan is live; charged now, and the 7 day clock restarts"));
        if (bo) lk.push(btn("Buy out · " + I().fmtBuyout(bo), "", "lease-buyout", function () { I().buyoutLease(key); }, "Only the Buyout closes the lease"));
      }
      out.push(sec("Lease", [el("p.dk-note" + (e.leaseDue ? ".dk-badt" : ""), { text: state }), lk.length ? el("div.dk-row", null, lk) : null], "lease"));
    }
    out.push(sec("Sell or drop", [el("div.dk-row", null, [
      btn("Fence for " + I().fmtG(I().fencePrice(it)), "gold", "sell", function () { I().sell(key, "undercut"); }, "Sell one to the fence at street rate, about a third of list"),
      btn("Drop one", "ghost", "drop", function () { I().drop(key); }, "It goes on the dropped log beside your Load, where it can be picked back up")])], "sell"));
    out.push(sec("About it", proseLines(it), "about"));
    return out;
  }

  /* ---- MARKET: the shelves, and a purchase that lands where it is told to ------------------------------ */
  function listings(ch) {
    var out = [];
    I().marketCats(ch).forEach(function (c) { c.subs.forEach(function (s) { (s.items || []).forEach(function (it) { out.push({ cat: c, sub: s, it: it }); }); }); });
    return out;
  }
  function priceText(it) {
    if (S.front === "fivefinger") return "Free";
    if (it.vendor === false) return it.nexus || "Found";
    if (it.upkeep) return I().fmtG(it.upkeep) + "/wk";
    return I().fmtG(I().streetPrice(it, S.front)) + (it.unit ? " " + it.unit : "");
  }
  function marketList(X, all, cats) {
    var out = [], q = S.mq.trim().toLowerCase(), fronts = I().storefronts();
    if (!fronts.some(function (f) { return f.key === S.front; })) S.front = fronts[0].key;
    if (!S.mtype || (S.mtype !== "all" && !cats.some(function (c) { return c.key === S.mtype; }))) S.mtype = cats.length ? cats[0].key : "all";
    out.push(el("div.dk-seg.dk-fronts", { role: "group", "aria-label": "Storefront" }, fronts.map(function (f) {
      return el("button.dk-segb" + (S.front === f.key ? ".on" : ""), { type: "button", "data-ro-keep": "1", title: f.desc, "aria-pressed": S.front === f.key ? "true" : "false", dataset: { dkFront: f.key }, onclick: function () { S.front = f.key; redraw(); } }, f.name);
    })));
    out.push(el("input.dk-in", { "data-ro-keep": "1", type: "text", value: S.mq, placeholder: "Search the market: name, effect, category", "aria-label": "Search the market", dataset: { dkGq: "market" }, oninput: function () { S.mq = this.value; redraw(); } }));
    out.push(el("div.dk-gf", null, [["all", "All"]].concat(cats.map(function (c) { return [c.key, c.short.charAt(0) + c.short.slice(1).toLowerCase()]; })).map(function (t) {
      var on = !q && S.mtype === t[0];
      return el("button.dk-fc" + (on ? ".on" : ""), { type: "button", "data-ro-keep": "1", "aria-pressed": on ? "true" : "false", dataset: { dkType: t[0] }, onclick: function () { S.mtype = t[0]; S.mq = ""; redraw(); } }, t[1]);
    })));
    // a search looks along every shelf; without one, the shelf picked
    var shown = all.filter(function (r) {
      if (!q) return S.mtype === "all" || r.cat.key === S.mtype;
      var it = r.it;
      return (it.name + " " + (it.desc || "") + " " + (it.effect || "") + " " + (it.group || "") + " " + (it.category || "") + " " + (it.skill || "")).toLowerCase().indexOf(q) !== -1;
    });
    var last = "";
    shown.slice(0, MAX_ROWS).forEach(function (r) {
      var head = r.cat.title + " · " + r.sub.label;
      if (head !== last) { last = head; out.push(el("div.dk-gg", null, [head])); }
      var owned = (X.ch.equipment || []).filter(function (e) { return e.name === r.it.name; }).reduce(function (n, e) { return n + (e.qty || 0); }, 0);
      out.push(row({ key: r.it.name, name: r.it.name, qty: 1, sub: (r.it.tier && r.it.cyber ? r.it.tier + " · " : "") + r.it.legality + (owned ? " · owned ×" + owned : ""), price: priceText(r.it) },
        S.msel === r.it.name, function () { S.msel = r.it.name; S.prem = false; S.pane = "detail"; redraw(); }));
    });
    if (!shown.length) out.push(el("p.dk-empty", { text: "Nothing on the shelves matches." }));
    else if (shown.length > MAX_ROWS) out.push(el("p.dk-empty", { text: (shown.length - MAX_ROWS) + " more. Search or pick a shelf to narrow it." }));
    return out;
  }
  function equipWord(it) {
    if (I().isWeapon(it)) return "In hand";
    if (it.kind === "armor" || it.rigTier) return "Wear it";
    if (it.kind === "shield") return "Raise it";
    if (it.kind === "focus") return "Attune it";
    if (it.deckType) return "Jack in";
    return eng().isWearable && eng().isWearable(it) ? "Wear it" : null;
  }
  function marketDetail(X, r) {
    var ch = X.ch, it = r.it, out = [el("button.dk-link.dk-back.dk-gback", { type: "button", "data-ro-keep": "1", dataset: { dkDo: "back" }, onclick: function () { S.pane = "list"; redraw(); } }, "‹ The shelves")];
    var free = S.front === "fivefinger", sp = I().streetPrice(it, S.front), fee = (S.prem && it.upkeep && it.premium) ? it.premium.upkeep : 0, have = Number(ch.glimmer) || 0, short = sp + fee - have;
    var owned = (ch.equipment || []).filter(function (e) { return e.name === it.name; }).reduce(function (n, e) { return n + (e.qty || 0); }, 0);
    var load = !it.cyber && eng().itemLoad ? eng().itemLoad(it.name, { worn: false }) : 0;
    out.push(el("h2", { text: it.name }));
    out.push(el("div.dk-chips", null, [chip(r.sub.label), chip(it.legality, LEGAL[it.legality] || ""), load > 0 ? chip("Load " + load) : null, owned ? chip("Owned ×" + owned, "ok") : null,
      it.counted ? chip("Counted", "warn", "Track every unit from purchase to spend") : null, it.upkeep ? chip("Leased", "warn") : null].concat(statBits(ch, it, null))));
    var found = it.vendor === false && !free;
    out.push(el("div.dk-price", { dataset: { dkPrice: found ? "found" : String(sp + fee) } }, [found ? (it.nexus || "Found, not sold") : free ? "Free" : it.upkeep ? I().fmtG(sp) + " buy-in, then " + I().fmtG(fee || it.upkeep) + " a week" : I().fmtG(sp) + (it.unit ? " " + it.unit : "")]));
    out.push(el("p.dk-note", { text: found ? "Not vendor stock: found, recovered or granted by the story, never bought." + (I().storefronts().some(function (f) { return f.key === "fivefinger"; }) ? " It can turn up in Five-Finger Supply." : "")
      : "You have " + I().fmtG(have) + "." + (short > 0 ? " Short by " + I().fmtG(short) + "." : "") }));
    if (!found) {
      var off = short > 0, go = function (place) { return function () {
        var key = it.cyber ? (I().buyCyber(it, S.front), null) : I().buy(it, S.prem, { front: S.front, place: place });
        if (key) S.sel = key;
      }; };
      var kids = [];
      if (it.upkeep && it.premium) kids.push(el("label.dk-check", null, [el("input", { type: "checkbox", checked: S.prem, dataset: { dkDo: "premium" }, onchange: function () { S.prem = this.checked; redraw(); } }),
        el("span", { text: "Premium plan: " + it.premium.dr + " DR while it is live, " + I().fmtG(it.premium.upkeep) + " charged now and every 7 days" })]));
      var word = equipWord(it), verb = it.upkeep ? "Lease it" : free ? "Take it" : "Buy it";
      if (it.cyber) kids.push(el("div.dk-row", null, [btn(verb + " for your Chrome stash", "pri", "buy-chrome", go(null), "It waits in your Chrome stash until a clinic installs it", off)]));
      else if (I().notCarried(it) || it.benchPart || it.armorMod) kids.push(el("div.dk-row", null, [btn(verb, "pri", "buy-stash", go("stash"), it.benchPart || it.armorMod ? "It goes to your stash; fit it at the bench" : "It goes to your stash", off)]));
      else kids.push(el("div.dk-row", null, [
        word ? btn(word, "pri", "buy-equip", go("equip"), verb + " and " + word.toLowerCase() + " in one press", off) : null,
        btn("Carried", word ? "" : "pri", "buy-carried", go("carried"), verb + " and carry it", off),
        btn("In the stash", "", "buy-stash", go("stash"), verb + " and leave it in the stash", off)]));
      out.push(sec(it.cyber || I().notCarried(it) || it.benchPart || it.armorMod ? verb : verb + " and put it", kids, "buy"));
      if (S.sel && owned && (ch.equipment || []).some(function (e) { return I().entryKey(e) === S.sel && e.name === it.name; }))
        out.push(el("div.dk-row", null, [nav("Show it in Mine", "ghost", "show-mine", function () { S.pane = "detail"; EN.deck.shell.gearView("mine"); })]));
    }
    out.push(sec("About it", proseLines(it), "about"));
    return out;
  }

  /* ---- the page -------------------------------------------------------------------------------------- */
  function topBar(X) {
    var ch = X.ch, enc = (X.d && X.d.encumbrance) || {}, kids = [];
    if (enc.enabled !== false) kids.push(el("div.dk-load", { dataset: { tour: "inventory-load", dkLoad: (enc.current != null ? enc.current : 0) + "/" + (enc.budget != null ? enc.budget : "?") }, title: "On-person Load against your Load Budget" }, [
      el("i", { text: "Load" }), el("b", { text: (enc.current != null ? enc.current : 0) + " / " + (enc.budget != null ? enc.budget : "?") }),
      enc.tier ? chip(enc.tier.charAt(0).toUpperCase() + enc.tier.slice(1) + " loadout", "", "Your declared Loadout sets your Load Budget") : null,
      enc.state ? chip(enc.state.charAt(0).toUpperCase() + enc.state.slice(1), enc.state === "overloaded" ? "bad" : enc.state === "encumbered" ? "warn" : "ok") : null,
      enc.dropped > 0 ? chip("Packed It " + enc.revealed + " / " + enc.budget, enc.revealed > enc.budget ? "warn" : "", "Packed It still counts what you dropped") : null]));
    kids.push(el("span.dk-grow"));
    kids.push(el("div.dk-purse", { dataset: { dkPurse: String(Number(ch.glimmer) || 0) } }, [el("b.dk-gold", { text: I().fmtG(Number(ch.glimmer) || 0) }), ch.nexus ? el("b", { text: I().fmtNx(ch.nexus) }) : null]));
    kids.push(nav("Wallet, Bills and Split", "ghost.sm", "open-wallet", function () { classic("stash"); }, "The wallet ledger, household bills and the payout splitter are in the Classic gear"));
    return el("div.dk-gbar", null, kids);
  }
  function dropped(X) {
    var ch = X.ch, enc = (X.d && X.d.encumbrance) || {}, rows = enc.droppedItems || [];
    if (!rows.length) return null;
    return el("div.dk-card.dk-dropped", { dataset: { dkDropped: rows.length } }, [el("h5", { text: "Dropped: Packed It still counts them" })].concat(rows.map(function (di) {
      var r = (ch.loadDropped || [])[di.index];
      return el("div.dk-line", null, [el("b", { text: di.name }), el("small", { text: "Load " + di.load }), el("span.dk-grow"),
        I().droppedRowPickable(ch, r) ? btn("Pick up", "sm", "pick-up-" + di.index, function () { I().pickUpDropped(di.index); }, "It returns Carried, and Packed It still counts it once") : null,
        btn("✕", "sm.ghost", "forget-" + di.index, function () { EN.store.update(function (c) { if (Array.isArray(c.loadDropped)) c.loadDropped.splice(di.index, 1); }); }, "Undo this row: it stops counting toward Packed It")]);
    })));
  }
  function render(stage, c, mode) {
    var X = { ch: c.ch, d: c.d };
    var root = el("div.dk.dk-gear", { dataset: { dkGear: mode, dkPane: S.pane } }), list, detail;
    root.appendChild(topBar(X));
    if (mode === "market") {
      var cats = I().marketCats(X.ch), all = listings(X.ch);
      list = marketList(X, all, cats);
      var r = all.filter(function (x) { return x.it.name === S.msel; })[0] || null;
      if (!r) S.msel = null;
      detail = r ? marketDetail(X, r) : [el("p.dk-empty", { text: "Pick something off the shelves to read it and buy it." })];
    } else {
      var items = mineModel(X.ch), x = items.filter(function (i) { return i.key === S.sel; })[0] || null;
      if (!x) S.sel = null;
      var dl = dropped(X);
      list = (dl ? [dl] : []).concat(mineList(X, items));
      detail = x ? mineDetail(X, x) : [el("p.dk-empty", { text: items.length ? "Pick a piece on the left to see what it is and where it is." : "Nothing here yet." })];
    }
    if (!(mode === "market" ? S.msel : S.sel)) S.pane = "list";
    root.setAttribute("data-dk-pane", S.pane);
    root.appendChild(el("div.dk-g2c", null, [el("div.dk-col.dk-glist", { dataset: { dkGearList: mode } }, list), el("div.dk-col.dk-card.dk-gdet", { dataset: { dkGearDetail: mode === "market" ? (S.msel || "") : (S.sel || "") } }, detail)]));
    /* The guided tour's "Rack your carry gear" step (js/tour.js) points at the rack control of the piece that is picked. With
       none picked, or one that cannot be racked, it points at the first piece in the list that would show that control (it is
       on the Freelancer and fits worn Carry Gear), which is the one to pick; with no such piece, at the list. */
    if (mode !== "market" && !root.querySelector('[data-tour="inventory-rack"]')) {
      var E = eng(), fit = (items || []).filter(function (i) {
        return i.e && i.it && !E.isCarryGear(i.it) && (i.inHand || i.slotOn || i.cs === "carried" || i.cs === "racked") && (E.rackTargets(X.ch, i.e) || []).length > 0;
      })[0];
      var at = fit ? Array.prototype.filter.call(root.querySelectorAll("[data-dk-row]"), function (n) { return n.getAttribute("data-dk-row") === fit.key; })[0] : null;
      (at || root.querySelector(".dk-glist")).setAttribute("data-tour", "inventory-rack");
    }
    stage.appendChild(root);   // js/app.js gives the search box its cursor back after the redraw, as it does for any field in #view
  }
  // search and the Sheet can ask for a piece to be shown: it is picked, and Mine opens on it
  function show(key) { S.sel = key; S.pane = "detail"; EN.deck.shell.gearView("mine"); }

  return { render: render, show: show, state: S };
})();
