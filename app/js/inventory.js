/* ===========================================================================
   ELYSIUM NIGHTS · Inventory tab
   Sub-tabs: Stash (owned gear) · Chrome (installed cyberware) · The Undercut
   (gray-market storefront). Currency is Glimmer (𝒢). List prices come from
   the Gear & Equipment catalog and assume a major district; the Undercut is
   not a major district; legality and scarcity mark prices up, and the fence
   pays street rate (~35% of list) when you sell.
   =========================================================================== */
window.EN = window.EN || {};

EN.inventoryView = (function () {
  var el = EN.ui.el, clear = EN.ui.clear, toast = EN.ui.toast;
  var store = EN.store;
  // module-level, because entry identity is now read at the top level of this file
  // (the bench addresses weapon ENTRIES, not weapon names) and the older `eng` aliases
  // are local to individual render functions.
  var ENG = function () { return EN.engine; };
  var _sub = "stash";      // 'stash' | 'chrome' | 'market' | 'workbench'
  var _bench = "ballistics"; // Workbench sub-tab: 'ballistics' | 'armor' | 'tech' | 'garage'
  var _benchWeapon = null;   // Arms Table: the weapon ENTRY KEY currently being customized
  var _benchArmor = null;    // Impact Table: the armor currently being customized
  // Armor Integrity: how many points of DR the player is buying back on each piece,
  // {armorEntryKey: points}. The rule prices repair PER POINT, so a player with three
  // points gone and a thin wallet has to be able to buy one. Absent means "all of it",
  // which is the common case and keeps the default one click.
  //
  // Null-prototype, like every other map in this app keyed on a raw entry key. This is
  // transient view state rather than anything persisted, which is why the earlier sweep
  // over the three character maps did not reach it, but the hazard is the same and it
  // bites here: an entry whose id is "__proto__" makes `_armorPts[key] = 2` invoke the
  // Object.prototype setter, which silently discards a non-object value, so the read
  // back is Object.prototype, fails the typeof test, and re-defaults to the whole loss.
  // The picker then reads "3 / 3" forever and the row can only be bought whole.
  // `_open` below is safe as it stands because every one of its keys is prefixed.
  var _armorPts = Object.create(null);
  var _open = {};          // collapse state for item cards (keys are all prefixed, never a bare entry key)
  // Storefront (picked via the ⚙ settings popover; same stock, different pricing):
  //   'undercut'   · The Undercut: book list prices, no markups
  //   'register'   · The Register: predatory corporate markups (legality × scarcity)
  //   'surplus'    · Guild Surplus: Deep Discount, ~35% of list
  //   'fivefinger' · Five-Finger Supply: free; fencing disabled (Drop/Donate only)
  var _mode = "undercut";
  // market filtering + per-panel collapse (panels collapsed by default; a filter/search auto-expands matches)
  var _mktQuery = "";
  var _mktType = "all";    // 'all' or a major-type key (melee/ranged/signature/ammo/kits/devices/consumables/flow)
  var _mktLegal = "all";   // 'all' | Legal | Licensed | Restricted | Contraband
  var _mktAvail = "all";   // 'all' | Common | Uncommon | Rare
  var _mktFiltersOpen = false;   // filter rows nested behind the funnel button
  var _panelOpen = {};     // { catKey: bool }

  /* ---- pricing (Economy & Rewards: prices assume a major district;
          scarcity, faction control & legality shift them, sometimes a lot) */
  var LEGAL_COLOR = { "Legal": "var(--text3)", "Licensed": "var(--gold)", "Restricted": "var(--ember)", "Contraband": "var(--danger)", "As weapon": "var(--text3)" };
  // Common/Uncommon/Rare is the standard scale; Mystech gear runs its own (Iconic → Legendary → Mythical → Artifact).
  var AVAIL_COLOR = { "Common": "var(--text3)", "Uncommon": "var(--accent)", "Rare": "var(--flow)",
    "Iconic": "var(--accent)", "Legendary": "var(--flow)", "Mythical": "#c084fc", "Artifact": "var(--gold)" };
  var LEGAL_MULT = { "Legal": 1, "Licensed": 1.15, "Restricted": 1.4, "Contraband": 1.75 };
  var AVAIL_MULT = { "Common": 1, "Uncommon": 1.2, "Rare": 1.5, "Iconic": 1.5, "Legendary": 1.8, "Mythical": 2.2, "Artifact": 3 };
  var FENCE_RATE = 0.35;   // common contraband fences at 30-50% of market

  var STOREFRONTS = [
    { key: "undercut", name: "The Undercut", desc: "Book list prices. Gray market, no markups, no paperwork, no receipts." },
    { key: "register", name: "The Register", desc: "Corporate retail. Compliance surcharges and scarcity-indexed markups." },
    { key: "surplus", name: "Guild Surplus", desc: "Deep Discount, Guild overstock & salvage at ~35% of list." },
    { key: "fivefinger", name: "Five-Finger Supply", desc: "Free. Looted, recovered, donated. Fencing disabled, Drop or Donate only." }
  ];
  function storefront() { return STOREFRONTS.find(function (s) { return s.key === _mode; }) || STOREFRONTS[0]; }

  function fmtG(n) { return "𝒢" + (n || 0).toLocaleString(); }
  function fmtNx(n) { return "◎" + (Math.round((n || 0) * 100) / 100); }
  // the ◎ number inside an item's nexus tag ("◎0.3 buyout" -> 0.3); null when absent
  function nexusPrice(it) { var m = String((it && it.nexus) || "").match(/[\d.]+/); return m ? parseFloat(m[0]) : null; }
  // A Buyout is a one-time lump sum that ends a lease. Most entries price it in
  // Glimmer (a numeric `buyout`); a few price it in Nexus (inside the `nexus`
  // tag). Whichever the entry lists is the purse it debits.
  function buyoutCost(it) {
    if (!it || !it.upkeep) return null;
    if (typeof it.buyout === "number") return { amt: it.buyout, nexus: false };
    var px = nexusPrice(it);
    return px == null ? null : { amt: px, nexus: true };
  }
  function fmtBuyout(b) { return b.nexus ? fmtNx(b.amt) : fmtG(b.amt); }
  function streetPrice(it) {
    if (_mode === "register") return Math.ceil(it.price * (LEGAL_MULT[it.legality] || 1) * (AVAIL_MULT[it.availability] || 1));
    if (_mode === "surplus") return Math.max(1, Math.floor(it.price * FENCE_RATE));
    if (_mode === "fivefinger") return 0;
    return it.price;   // The Undercut, straight book list price
  }
  function fencePrice(it) { return Math.max(1, Math.floor(it.price * FENCE_RATE)); }
  function priceTitle(it) {
    var sp = streetPrice(it);
    if (it.upkeep) return "Leased, " + fmtG(it.price || 0) + " buy-in, " + fmtG(it.upkeep) + "/wk Upkeep"
      + (buyoutCost(it) ? ", " + fmtBuyout(buyoutCost(it)) + " Buyout" : "")
      + ". Lapse, get flagged, or cross the issuer and it drops to its zero state.";
    if (_mode === "register") {
      if (sp === it.price) return "List price " + fmtG(it.price) + (it.unit ? " " + it.unit : "") + ". Standard compliance handling included. All sales final.";
      return "List " + fmtG(it.price) + " · compliance surcharge ×" + (LEGAL_MULT[it.legality] || 1) + " (" + it.legality + ") · scarcity index ×" +
             (AVAIL_MULT[it.availability] || 1) + " (" + it.availability + ") = " + fmtG(sp) + ". Fees are non-negotiable. All sales final.";
    }
    if (_mode === "surplus") return "List " + fmtG(it.price) + ", Guild members' rate " + fmtG(sp) + ". Overstock, salvage, serial numbers conveniently worn off.";
    if (_mode === "fivefinger") return "It fell off a transport. Looted, recovered, donated, or pulled from a body. Free, and the fence won't touch it.";
    if (it.legality === "As weapon") return "List price " + fmtG(it.price) + (it.unit ? " " + it.unit : "") + ", standard ammo carries the legality of the weapon it feeds.";
    return "List price " + fmtG(it.price) + (it.unit ? " " + it.unit : "") + ", straight off the book. The Undercut skips the corporate fees, not the cash.";
  }
  var WEAPON_GROUPS = { Simple: 1, Martial: 1, Sidearm: 1, Longarm: 1, Heavy: 1, Launcher: 1, Thrown: 1, Bowfire: 1 };
  function isWeapon(it) { return !!(it && WEAPON_GROUPS[it.group]); }
  // entryKey: the stable identity a specific equipment entry equips/carries
  // under (its own id for an individually-tracked instance, else its shared
  // catalog name for a pooled consumable/ammo stack).
  function entryKey(e) { return EN.engine.entryKey ? EN.engine.entryKey(e) : (e && e.name); }
  function findEntry(ch, key) { return EN.engine.findEntry ? EN.engine.findEntry(ch, key) : (ch.equipment || []).find(function (x) { return x.name === key; }); }
  function isStackable(it) { return EN.engine.isStackableItem ? EN.engine.isStackableItem(it) : true; }
  function newEquipId() { return "eq_" + Math.random().toString(36).slice(2, 9); }
  // push a purchased/crafted item into the stash: pooled items merge into the
  // shared qty stack, everything else becomes its own individually equippable
  // instance so two daggers never have to share one equipped/carried state.
  function addToStash(c, name, extra) {
    c.equipment = c.equipment || [];
    if (isStackable(findItem(name))) {
      var e = c.equipment.find(function (x) { return x.name === name && !x.id; });
      if (e) { e.qty = (e.qty || 1) + 1; return e; }
      e = { name: name, qty: 1 };
    } else {
      var e = { id: newEquipId(), name: name, qty: 1 };
    }
    if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; });
    c.equipment.push(e);
    return e;
  }
  function isEquipped(ch, key) { return (ch.equippedWeapons || []).indexOf(key) !== -1; }
  function toggleEquip(entry) {
    var ch = store.active();
    var key = entryKey(entry);
    var on = !isEquipped(ch, key);
    store.update(function (c) {
      c.equippedWeapons = c.equippedWeapons || [];
      var i = c.equippedWeapons.indexOf(key);
      if (i === -1) c.equippedWeapons.push(key); else c.equippedWeapons.splice(i, 1);
    });
    // An unarmed augment gets no row of its own on the Attacks list, so promising one
    // sets the player looking for something that will never appear. It DOES arrive,
    // folded into the unarmed strike, which is what to point at.
    var aug = EN.engine.isUnarmedAugmentName && EN.engine.isUnarmedAugmentName(entry.name);
    toast(!on ? entry.name + " unequipped."
      : aug ? entry.name + " equipped; it augments your unarmed strike on the Freelancer tab rather than listing as a weapon of its own."
            : entry.name + " equipped; it's live in the Attacks list on the Freelancer tab.");
  }
  /* SINGLE-SLOT GEAR EQUIPS FROM ITS OWN ROW: one worn armor, one wielded shield, one
     attuned Focus, one jacked-in Smartdeck, one worn Trauma Rig. Which slots exist and how
     each is stored lives in EN.engine's EQUIP_SLOTS, not here, so a Smartdeck activates the
     same way a breastplate does instead of through a dropdown on another tab.

     Equipping the same slot twice replaces the occupant silently. That is pre-existing
     behaviour for armor and is kept deliberately: the toast names what went on, and for a
     deck or Rig nothing is lost by swapping, since mods and Integrity are stored per entry. */
  function toggleSlotEquip(slot, it, entry) {
    if (!slot || !entry) return;
    var key = entryKey(entry);
    var was = slot.get(store.active()) === key;
    store.update(function (c) { EN.engine.setEquipSlot(c, slot.id, was ? null : key); });
    toast(was ? it.name + " stowed."
              : it.name + " " + slot.verbs.act + "; it now reads live on the Freelancer tab.");
  }
  /* ---- Loadout status from the Stash (carried / worn / racked) -----------
     Mirrors the Freelancer tab's Loadout controls so the whole loadout can be
     built here. "racked|<gearKey>" stows the item in worn Carry Gear: its
     Load drops by 1 (minimum 0), one piece of Carry Gear per item. */
  function invSetCarry(key, status) {
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
  function carryCtrl(ch, it, entry) {
    var key = entryKey(entry);
    var equipped = (ch.equippedWeapons || []).indexOf(key) !== -1 || EN.engine.isSlotEquipped(ch, key);
    var cs = (ch.carry && ch.carry[key]) || "stashed";
    var racks = EN.engine.rackState(ch);
    var rackedGear = racks.byItem[key] || null;
    var isGear = EN.engine.isCarryGear(it);
    var targets = !isGear ? EN.engine.rackTargets(ch, entry) : [];
    // slot-bearing gear that isn't armor/shield/focus (those equip through
    // their own dedicated field) gets a Wear toggle; only "worn" competes
    // for its Body Slot, so a spare merely Carried never does.
    var mySlots = it && EN.engine.itemSlots ? EN.engine.itemSlots(it) : [];
    var wearable = mySlots.length > 0 && it && it.kind !== "armor" && it.kind !== "shield" && it.kind !== "focus";
    var wearBtn = wearable ? el("button.btn.sm", { title: cs === "worn" ? "Take it off; it stays Carried and keeps costing Load, but frees its Body Slot" : "Wear it; it competes for its Body Slot",
      style: { fontSize: "10px" }, onclick: function () { invSetCarry(key, cs === "worn" ? "carried" : "worn"); } }, cs === "worn" ? "✓ WORN" : "WEAR") : null;
    if (equipped) {
      // equip state already reads on the card; racking keeps carry status and
      // the rack target in lockstep, and a stale assignment renders as
      // "adrift" so it can always be cleared
      var staleKey = !rackedGear ? (ch.racked || {})[key] : null;
      if (!targets.length && !rackedGear && !staleKey) return null;
      return el("select", { title: "Rack this in worn Carry Gear: Load reduced by 1, and a Sheath or Holster draws it free on your first attack",
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
          ? [el("option", { value: staleKey, selected: true, text: "⧉ racked (adrift)" })] : []));
    }
    if (cs === "worn") {
      // worn is exclusive with Carried/Racked (one carry status per item), so
      // taking it off (falling back to Carried) is the only control needed here
      return el("div.row", { style: { gap: "6px", alignItems: "center" } }, [wearBtn]);
    }
    var opts = [["stashed", "Stashed"], ["carried", "Carried"]].map(function (o) {
      return el("option", { value: o[0], selected: cs === o[0], text: o[1] });
    }).concat(targets.map(function (g) {
      var gk = entryKey(g);
      return el("option", { value: "racked|" + gk, selected: cs === "racked" && (ch.racked || {})[key] === gk, text: "⧉ Racked: " + g.name });
    }));
    if (cs === "racked" && !rackedGear) opts.push(el("option", { value: "racked|" + ((ch.racked || {})[key] || ""), selected: true, text: "⧉ Racked (adrift)" }));
    var dropdown = el("select", { title: "Loadout status; Racked stows it in worn Carry Gear for 1 less Load", style: { fontSize: "11px", width: "auto" },
      onchange: function () { invSetCarry(key, this.value); } }, opts);
    return el("div.row", { style: { gap: "6px", alignItems: "center" } }, [wearBtn, dropdown]);
  }

  // called after an entry's qty drops to <=0 (sell/drop); key is the specific
  // entry's identity (id for a tracked instance, name for a pooled stack) and
  // name is its catalog name (magazine tracking is name-keyed and shared
  // across copies, so it only drops once the LAST copy leaves the stash)
  function unequipIfGone(c, key, name) {
    var still = (c.equipment || []).some(function (x) { return (x.id || x.name) === key && x.qty > 0; });
    if (!still) {
      if (c.equippedWeapons) c.equippedWeapons = c.equippedWeapons.filter(function (n) { return n !== key; });
      EN.engine.releaseEntry(c, key);                          // a sold/dropped piece can't stay equipped in any slot
      if (c.carry) delete c.carry[key];                        // drop its Loadout carry status too (no orphaned key)
      if (c.racked) {
        delete c.racked[key];                                  // it can't stay racked anywhere
        Object.keys(c.racked).forEach(function (k) {           // and nothing can stay racked IN it
          if (c.racked[k] === key) {
            delete c.racked[k];
            if (c.carry && c.carry[k] === "racked") c.carry[k] = "carried";   // contents fall back to carried
          }
        });
      }
      if (name && c.weaponAmmo && !(c.equipment || []).some(function (x) { return x.name === name && x.qty > 0; })) delete c.weaponAmmo[name];
    }
  }

  function catalog() {
    var g = EN.gearCatalog || {};
    return [].concat(
      (g.melee && g.melee.items) || [],
      (g.ranged && g.ranged.items) || [],
      (g.signature && g.signature.items) || [],
      (g.signature && g.signature.munitions) || [],
      (g.ammo && g.ammo.items) || [],
      (g.armor && g.armor.items) || [],
      (g.tools && g.tools.items) || [],
      partItems(),
      armorModItems(),
      vehicleItems(),
      vehicleModItems()
    );
  }
  function findItem(name) { return catalog().find(function (i) { return i.name === name; }); }
  // one canonical weapon glossary (app/data/gear_traits.js); armor keeps its own,
  // because Heavy, Light, Loud and Concealable mean different things on armor
  function traitDefs() { return (EN.gearCatalog && EN.gearCatalog.weaponTraits) || {}; }
  // Armor/defensive traits live in their own table; several keys (Heavy, Light,
  // Loud, Concealable) mean different things on armor than on weapons, so a
  // defensive item resolves its chips against this set first.
  function armorTraitDefs() { return (EN.gearCatalog && EN.gearCatalog.armor && EN.gearCatalog.armor.traits) || {}; }
  function isDefensive(it) { return !!(it && (it.kind === "armor" || it.kind === "shield" || it.kind === "focus")); }

  function traitChip(t, defsOverride) {
    var defs = defsOverride || traitDefs();
    var base = t.replace(/\s*\(.*\)$/, "").trim();
    var def = defs[base] || defs[base.replace(/\s+\d+$/, " X")] || (/^Area /.test(base) ? defs["Area X"] : "") || (defsOverride ? traitDefs()[base] : "") || "";
    return el("span.chip", { title: def, style: { fontSize: "9.5px", color: "var(--text2)", borderColor: "var(--border2)" } }, t);
  }
  function tagChip(text, color, title) {
    return el("span.chip", { title: title || "", style: { fontSize: "9px", color: color, borderColor: color, marginLeft: "8px" } }, text.toUpperCase());
  }

  /* ---- mutations ---- */
  function buy(it) {
    if (it.vendor === false && _mode !== "fivefinger") { toast(it.name + " isn't vendor stock; it's found, not bought. (" + (it.nexus || "rarely sold") + ")"); return; }
    var sp = streetPrice(it);
    var ch = store.active();
    if ((ch.glimmer || 0) < sp) {
      toast(_mode === "register" ? "Payment not approved. Please verify your account standing." :
            _mode === "surplus" ? "Dues not current. The Guild remembers." :
            "Account declined. The vendor's smile doesn't move.");
      return;
    }
    store.update(function (c) {
      c.glimmer = (c.glimmer || 0) - sp;
      // signing a lease starts the 7-day installment clock (one day per Long Rest);
      // leased gear is never pooled, so each contract is its own instance and
      // re-leasing an item already in arrears never clears another one's debt.
      var extra = it.upkeep ? { leaseDays: 7, leaseDue: false, leaseOwned: false } : null;
      addToStash(c, it.name, extra);
    });
    toast(_mode === "register" ? it.name + " purchased for " + fmtG(sp) + ". Compliance fees included. All sales final." :
          _mode === "surplus" ? it.name + " claimed from the Guild lot for " + fmtG(sp) + ". Mostly works." :
          _mode === "fivefinger" ? it.name + " taken. You were never here." :
          it.upkeep ? it.name + " lease signed: " + fmtG(it.price || 0) + " buy-in, " + fmtG(it.upkeep) + " due in 7 days (Long Rests)." :
          it.name + " acquired for " + fmtG(sp) + ". No receipt. It never happened.");
  }

  /* ---- lease lifecycle: countdown, installment, buyout -------------------
     Lease state rides on the equipment entry: leaseDays (days to the next
     installment), leaseDue (payment due; the item grants NOTHING until paid),
     leaseOwned (bought out; owned outright, upkeep over). A Long Rest ticks
     every active lease one day via leaseTick (called from the Freelancer tab). */
  function leaseDaysOf(e) { return e.leaseDays == null ? 7 : e.leaseDays; }
  function leaseTick(c) {
    var due = [];
    (c.equipment || []).forEach(function (e) {
      if (!(e.qty > 0) || e.leaseOwned || e.leaseDue) return;
      var it = findItem(e.name);
      if (!it || !it.upkeep) return;
      var days = leaseDaysOf(e) - 1;
      if (days <= 0) { e.leaseDays = 0; e.leaseDue = true; due.push(e.name); }
      else e.leaseDays = days;
    });
    return due;
  }
  /* ---- household: lifestyle + safehouse, one weekly clock ---------------
     Same shape as a lease: a day ticks per Long Rest, at 0 the week is due and
     the app says so. Nothing auto-debits; paying is a button, because a crew
     choosing NOT to pay is a story beat the book asks the GM to lean on. */
  function ECON() { return EN.economy || {}; }
  function householdWeekly(c) {
    var hh = c.household || {}, total = 0, lines = [];
    var lt = (ECON().lifestyleTiers || []).filter(function (t) { return t.tier === hh.lifestyle; })[0];
    if (lt) { total += lt.weekly; lines.push(lt.tier + " lifestyle " + fmtG(lt.weekly)); }
    var sh = (ECON().safehouseRent || []).filter(function (r) { return r.type === hh.safehouse; })[0];
    if (sh) { total += sh.weekly; lines.push(sh.type + " " + fmtG(sh.weekly)); }
    (hh.upgrades || []).forEach(function (nm) {
      var u = (ECON().safehouseUpgrades || []).filter(function (x) { return x.name === nm; })[0];
      if (u && u.ongoingWeekly) { total += u.ongoingWeekly; lines.push(u.name + " " + fmtG(u.ongoingWeekly)); }
    });
    return { total: total, lines: lines };
  }
  function hypercareTick(c) {
    var hh = c.household; if (!hh || !hh.hypercare || hh.hypercareDue) return false;
    var d = (typeof hh.hypercareDays === "number" ? hh.hypercareDays : 30) - 1;
    if (d <= 0) { hh.hypercareDays = 0; hh.hypercareDue = true; return true; }
    hh.hypercareDays = d; return false;
  }
  function hypercareOf(c) {
    var hh = c.household || {};
    return (ECON().hypercareTiers || []).filter(function (t) { return t.tier === hh.hypercare; })[0] || null;
  }
  function payHypercare() {
    var c = store.active(), t = hypercareOf(c); if (!t) return;
    var nexus = t.currency === "nexus";
    var purse = nexus ? (c.nexus || 0) : (c.glimmer || 0);
    if (purse < t.cost) { toast("Not enough " + (nexus ? "Nexus" : "Glimmer") + " for " + t.tier + " (" + (nexus ? fmtNx(t.cost) : fmtG(t.cost)) + ")."); return; }
    store.update(function (x) {
      if (nexus) x.nexus = Math.round(((x.nexus || 0) - t.cost) * 100) / 100;
      else x.glimmer = (x.glimmer || 0) - t.cost;
      x.household.hypercareDue = false; x.household.hypercareDays = 30;
    });
    toast(t.tier + " renewed for " + (nexus ? fmtNx(t.cost) : fmtG(t.cost)) + ".");
    EN.app.render();
  }
  function householdTick(c) {
    var hh = c.household; if (!hh) return false;
    if (householdWeekly(c).total <= 0 || hh.due) return false;
    var d = (typeof hh.days === "number" ? hh.days : 7) - 1;
    if (d <= 0) { hh.days = 0; hh.due = true; return true; }
    hh.days = d; return false;
  }
  function payHousehold() {
    var c = store.active(), w = householdWeekly(c);
    if (!w.total) return;
    if ((c.glimmer || 0) < w.total) { toast("Not enough Glimmer for the week (" + fmtG(w.total) + ")."); return; }
    store.update(function (x) { x.glimmer = (x.glimmer || 0) - w.total; x.household.due = false; x.household.days = 7; });
    toast("Week paid: " + fmtG(w.total) + ". " + w.lines.join(", ") + ".");
    EN.app.render();
  }
  function setHousehold(fn) { store.update(function (c) { fn(c.household); }); EN.app.render(); }

  function payLease(key) {
    var ch = store.active(), e0 = findEntry(ch, key), it = e0 && findItem(e0.name);
    if (!it || !it.upkeep || !e0 || !e0.leaseDue || e0.leaseOwned) return;   // nothing due, nothing to pay
    if ((ch.glimmer || 0) < it.upkeep) { toast("Not enough Glimmer for the installment (" + fmtG(it.upkeep) + ")."); return; }
    store.update(function (c) {
      var e = findEntry(c, key);
      if (!e || !e.leaseDue || e.leaseOwned) return;   // re-check live: a double-fire cannot double-charge
      c.glimmer = (c.glimmer || 0) - it.upkeep;
      e.leaseDue = false; e.leaseDays = 7;
    });
    toast(it.name + " installment paid (" + fmtG(it.upkeep) + "); next payment in 7 days. Benefits restored.");
  }
  function buyoutLease(key) {
    var ch = store.active(), e0 = findEntry(ch, key), it = e0 && findItem(e0.name), b = buyoutCost(it);
    if (!it || !b || !e0 || e0.leaseOwned) return;   // only leased, not-yet-owned gear
    var purse = b.nexus ? (ch.nexus || 0) : (ch.glimmer || 0);
    if (purse < b.amt) { toast("Not enough " + (b.nexus ? "Nexus" : "Glimmer") + " for the buyout (" + fmtBuyout(b) + ")."); return; }
    store.update(function (c) {
      var e = findEntry(c, key);
      if (!e || e.leaseOwned) return;   // re-check live: a double-fire cannot double-charge
      if (b.nexus) c.nexus = Math.round(((c.nexus || 0) - b.amt) * 100) / 100;
      else c.glimmer = (c.glimmer || 0) - b.amt;
      e.leaseOwned = true; e.leaseDue = false; delete e.leaseDays;
    });
    toast(it.name + " bought out for " + fmtBuyout(b) + ". It's yours outright; no more Upkeep, no off switch.");
  }
  // buying chrome drops it in the Chrome Stash (uninstalled); you install it at a clinic from the Chrome tab
  function buyCyber(it) {
    var sp = streetPrice(it);
    var ch = store.active();
    if (_mode !== "fivefinger" && (ch.glimmer || 0) < sp) {
      toast(_mode === "register" ? "Payment not approved. Verify your account standing." :
            _mode === "surplus" ? "Dues not current. The Guild remembers." :
            "Account declined, not enough Glimmer for the chrome.");
      return;
    }
    store.update(function (c) {
      c.glimmer = (c.glimmer || 0) - sp;
      c.cyberStash = c.cyberStash || [];
      // No desc or effect. Those are CATALOG text, not player state: copying them here is
      // what left saves holding prose the catalog had since corrected, with no migration to
      // refresh it. The record keeps only identity, tier and what the player chose; the
      // Chrome tab and the print sheet resolve the prose live through engine.cyberDesc.
      c.cyberStash.push({ key: it.cyberKey, base: it.base, name: it.name, tier: it.tier, zone: it.zone,
        sp: it.sp, slots: it.slots || 0, sided: !!it.sided, side: it.sided ? "R" : null, mystech: !!it.mystech, enhancement: it.enhancement });
    });
    toast(it.name + " acquired; it's in your Chrome Stash. Hit a clinic (Chrome tab) to install it.");
  }
  function installFromStash(idx) {
    store.update(function (c) {
      var cw = (c.cyberStash || [])[idx]; if (!cw) return;
      c.cyberStash.splice(idx, 1);
      c.cyberware = c.cyberware || []; c.cyberware.push(cw);
    });
    toast("Chrome installed. Static updated on the Cybernetic Frame.");
  }
  function uninstallToStash(idx) {
    store.update(function (c) {
      var cw = (c.cyberware || [])[idx]; if (!cw) return;
      c.cyberware.splice(idx, 1);
      c.cyberStash = c.cyberStash || []; c.cyberStash.push(cw);
    });
    toast("Chrome uninstalled, back in your Chrome Stash.");
  }
  function dropStash(idx) {
    store.update(function (c) { if ((c.cyberStash || [])[idx]) c.cyberStash.splice(idx, 1); });
  }
  function sell(key) {
    if (_mode === "fivefinger") { toast("No provenance, no payout. The fence won't touch it."); return; }
    var e0 = findEntry(store.active(), key);
    var name = e0 ? e0.name : key;
    var it = findItem(name);
    var pay = it ? fencePrice(it) : 1;
    store.update(function (c) {
      var e = findEntry(c, key);
      if (!e) return;
      e.qty = (e.qty || 1) - 1;
      if (e.qty <= 0) c.equipment = c.equipment.filter(function (x) { return x !== e; });
      c.glimmer = (c.glimmer || 0) + pay;
      unequipIfGone(c, key, e.name);
    });
    toast("Fence takes the " + name + " at street rate. " + fmtG(pay) + " credited. No questions asked.");
  }
  function drop(key) {
    store.update(function (c) {
      var e = findEntry(c, key);
      if (!e) return;
      e.qty = (e.qty || 1) - 1;
      if (e.qty <= 0) c.equipment = c.equipment.filter(function (x) { return x !== e; });
      unequipIfGone(c, key, e.name);
    });
  }
  function donate(key) {
    var e0 = findEntry(store.active(), key);
    var name = e0 ? e0.name : key;
    drop(key);
    toast(name + " donated. Somebody eats tonight.");
  }

  /* ---- shared item card (market + stash render through this) ---- */
  // MODS chip line for a customized weapon, mirroring the Freelancer weapon row.
  function installedPartsLine(ch, it, entry) {
    if (!isWeapon(it) || !EN.weaponParts) return null;
    // per ENTRY: the card is drawn for one piece, so it must report that piece's build
    var lo = (ch.weaponParts || {})[entry ? ENG().entryKey(entry) : null];
    if (!lo) return null;
    var keys = ["targeting", "output", "core", "handling"].map(function (s) { return lo[s]; }).filter(Boolean).concat(lo.utility || []);
    var chips = keys.map(function (k) {
      var p = EN.weaponParts.byKey[k]; if (!p) return null;
      return el("span.chip", { title: p.name + ": " + p.effect, style: { fontSize: "8.5px", color: "var(--ember)", borderColor: "var(--ember)" } }, p.grants || p.name);
    }).filter(Boolean);
    if (!chips.length) return null;
    return el("div.row.wrap", { style: { gap: "5px", marginTop: "6px", alignItems: "center" } },
      [el("span", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "MODS" })].concat(chips));
  }
  // info line for a weapon Part item (slot, type, what it grants, install count)
  function partInfoLine(ch, it) {
    if (!it.benchPart || !EN.weaponParts) return null;
    var p = EN.weaponParts.byKey[it.partKey];
    var slotName = p ? ((EN.weaponParts.slots.find(function (s) { return s.key === p.slot; }) || {}).name || p.slot) : "";
    var installedN = installedPartCount(ch, it.partKey);
    return el("div.row.wrap", { style: { gap: "6px", marginTop: "5px", alignItems: "center" } }, [
      el("span.chip", { title: "Installs in the " + slotName + " slot", style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" } }, slotName + " slot"),
      el("span.chip", { title: it.partType === "Mod" ? "Bench work: a rest with a kit" : "Snap-on, no tools, no roll", style: { fontSize: "9px", color: it.partType === "Mod" ? "var(--ember)" : "var(--text2)", borderColor: it.partType === "Mod" ? "var(--ember)" : "var(--text2)" } }, it.partType),
      /* The frame gate, on the card you buy from. The Armor Mod line beside this one has
         drawn its "fits" chip all along; the Part line never did, because for melee the
         gate was Any Melee or Blades and effectively always passed. Long-Shafted made it
         bite: the market would happily sell you an Extended Shaft with nothing but a
         Longsword to your name, and only the bench would ever mention it. A broad
         category is left unchipped, the same way "Any" is on the armor line, so this
         stays a warning about a narrow frame and not noise on every card. */
      (it.fits && !/^Any\b/i.test(String(it.fits)))
        ? el("span.chip", { title: "Only fits " + it.fits + " weapons", style: { fontSize: "9px", color: "var(--warn)", borderColor: "var(--warn)" } }, "fits " + it.fits) : null,
      el("span.help", { style: { margin: 0, fontSize: "11px", color: "var(--text2)" }, text: it.grants }),
      installedN ? el("span.chip", { style: { fontSize: "9px", color: "var(--success)", borderColor: "var(--success)" } }, "installed ×" + installedN) : null
    ]);
  }
  // info line for an Armor Mod item (fits gate, what it grants, install count)
  function armorModInfoLine(ch, it) {
    if (!it.armorMod || !EN.armorMods) return null;
    var installedN = installedArmorModCount(ch, it.modKey);
    return el("div.row.wrap", { style: { gap: "6px", marginTop: "5px", alignItems: "center" } }, [
      el("span.chip", { title: "Bench work: a rest with a kit, on Modular armor", style: { fontSize: "9px", color: "var(--ember)", borderColor: "var(--ember)" } }, "Armor Mod"),
      (it.fits && it.fits !== "Any") ? el("span.chip", { title: "Only fits " + it.fits + " armor", style: { fontSize: "9px", color: "var(--warn)", borderColor: "var(--warn)" } }, "fits " + it.fits) : null,
      el("span.help", { style: { margin: 0, fontSize: "11px", color: "var(--text2)" }, text: it.grants }),
      installedN ? el("span.chip", { style: { fontSize: "9px", color: "var(--success)", borderColor: "var(--success)" } }, "installed ×" + installedN) : null
    ]);
  }
  // `entry` is the specific equipment-entry instance this card renders in
  // stash mode (each individually-tracked item, e.g. one of two owned daggers,
  // gets its own card); unused in market mode, which just shows the catalog
  // item and a combined owned count across every matching entry.
  function itemCard(it, ch, mode, entry) {
    var ownedKey = entry ? entryKey(entry) : it.name;
    var id = mode + "-" + ownedKey, open = !!_open[id];
    var owned = mode === "stash" ? entry : (ch.equipment || []).find(function (e) { return e.name === it.name; });
    var ownedTotal = (ch.equipment || []).filter(function (e) { return e.name === it.name; }).reduce(function (n, e) { return n + (e.qty || 0); }, 0);
    var sp = streetPrice(it);
    var afford = (ch.glimmer || 0) >= sp;
    var slotLabel = Array.isArray(it.slot) ? it.slot.join(" + ") : it.slot;
    // Worn armor supports its own weight; the same suit merely carried,
    // packed, or freshly looted counts its full Load instead. Nothing is
    // "worn" pre-purchase, so this (and the Load reduction it drives) is
    // always false in market mode. Armor/shield/focus equip through their
    // own dedicated field; everything else (a slot-bearing device) reads
    // its generic Worn carry status instead.
    // A single-slot item is worn when it fills its slot; everything else reads its generic
    // carry status. Only the Trauma Rig actually converts this into a Load break.
    var isWorn = mode === "stash" && (
      EN.engine.isSlotEquipped(ch, ownedKey) || !!(ch.carry && ch.carry[ownedKey] === "worn"));
    var ld = EN.engine.itemLoad ? EN.engine.itemLoad(it.name, { worn: isWorn }) : 0;
    // Benched by a Body Slot conflict (ch.slotInert): still worn, still keeps
    // its Load break, it just isn't actively benefiting from (or competing
    // for) the slot right now, so the pill shouldn't glow "worn" while inert.
    var isInert = isWorn && !!(ch.slotInert && ch.slotInert[ownedKey]);
    var pillWorn = isWorn && !isInert;
    var traits = Array.isArray(it.traits) ? it.traits : [];
    var traitsId = id + "-traits", traitsOpen = !!_open[traitsId];
    var head = el("h4", { style: { cursor: "pointer" }, onclick: function () { _open[id] = !open; EN.app.render(); } }, [
      el("span", null, [
        el("span.collapse-caret", { text: open ? "▾" : "▸" }),
        document.createTextNode(" " + it.name),
        (mode === "mkt" && ownedTotal > 0) ? tagChip("Owned ×" + ownedTotal, "var(--success)") : null,
        it.counted ? tagChip("Counted", "var(--ember)", "Counted, track every unit from purchase to spend") : null,
        it.cyber ? tagChip("◆ " + it.zone, "var(--accent)", "Interface Zone: " + it.zone) : null,
        it.cyber ? tagChip(it.sp + " SP", it.sp >= 3 ? "var(--ember)" : "var(--gold)", "Static Points, adds to your Total Static / Chrome Tax") : null,
        (it.cyber && it.slots) ? tagChip(it.slots + " slots", "var(--flow)", "Mod slots, compatible mods don't add SP") : null,
        (it.nexus && it.vendor !== false) ? tagChip("◎ " + it.nexus.replace(/^◎/, ""), "var(--flow)", "Nexus alternative: " + it.nexus) : null,
        it.upkeep ? (mode === "stash" && owned
          ? (owned.leaseOwned ? tagChip("OWNED OUTRIGHT", "var(--success)", "Lease bought out; it is yours, no more Upkeep.")
             : owned.leaseDue ? tagChip("⚠ PAYMENT DUE", "var(--danger)", "Installment due: " + fmtG(it.upkeep) + ". It grants none of its benefits until you pay.")
             : tagChip("LEASE · " + leaseDaysOf(owned) + (leaseDaysOf(owned) === 1 ? " DAY" : " DAYS"), "var(--gold)", "Next installment " + fmtG(it.upkeep) + " in " + leaseDaysOf(owned) + " day(s); each Long Rest marks one day."))
          : tagChip("LEASED", "var(--ember)", "Leased, " + fmtG(it.price || 0) + " buy-in, " + fmtG(it.upkeep) + "/wk Upkeep. Lapse and it drops to its zero state.")) : null
      ]),
      el("span", { style: { display: "inline-flex", alignItems: "baseline", gap: "10px", flexShrink: 0 } }, [
        el("span.mono", { style: { fontSize: "10.5px", letterSpacing: ".03em" } }, [
          el("span", { style: { color: LEGAL_COLOR[it.legality] || "var(--text3)" }, text: it.legality }),
          document.createTextNode(" · "),
          el("span", { style: { color: AVAIL_COLOR[it.availability] || "var(--text3)" }, text: it.availability }),
          (isDefensive(it) && it.slots) ? document.createTextNode(" · " + it.slots + " mod slots") : null
        ]),
        el("span.mono", { title: mode === "mkt" ? priceTitle(it) : (_mode === "fivefinger" ? "No provenance, no payout, the fence won't touch it." : "Fence pays " + fmtG(fencePrice(it)) + " (street rate, ~35% of list)"),
          style: { color: mode === "mkt" ? (_mode === "fivefinger" ? "var(--success)" : (it.vendor === false ? "var(--flow)" : (it.upkeep ? "var(--ember)" : (afford ? "var(--gold)" : "var(--danger)")))) : "var(--text3)", fontSize: "13px" } },
          mode === "mkt"
            ? (_mode === "fivefinger" ? "FREE" : it.vendor === false ? (it.nexus || "-") : it.upkeep ? fmtG(it.upkeep) + "/wk" : fmtG(sp) + (it.unit ? " " + it.unit : ""))
            : "×" + ((owned && owned.qty) || 0))
      ])
    ]);
    var statChips = [];
    if (it.damage && it.damage !== "0") statChips.push(el("span.mono", { style: { fontSize: "11.5px", color: "var(--accent)", marginRight: "4px" }, text: it.damage }));
    if (it.range && !/^Melee/.test(it.range)) statChips.push(el("span.chip", { title: "Range (normal / long, long range rolls with Snag)", style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, "RNG " + it.range.replace(/\s/g, "")));
    if (typeof it.ammo === "number" && it.ammo > 1) statChips.push(el("span.chip", { title: "Magazine / capacity", style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, "MAG " + it.ammo));
    /* defensive-gear stat chips: DR / Block / Defense / Ward (mod slots moved into the caption line) */
    function statChip(text, color, title) { return el("span.chip", { title: title || "", style: { fontSize: "9.5px", color: color, borderColor: color, fontWeight: 600 } }, text); }
    // DR is per PIECE and mutable, so a stash card shows THIS entry's current DR
    // out of its base (the market card, which has no entry, shows the base alone).
    if (typeof it.dr === "number") {
      var drSt = (mode === "stash" && EN.engine.armorState) ? EN.engine.armorState(ch, ownedKey) : null;
      if (drSt && drSt.base && drSt.lost > 0) {
        statChips.push(statChip("⛨ " + drSt.current + " / " + drSt.base + " DR", drSt.breached ? "var(--danger)" : "var(--warn)",
          "Damage Reduction: " + drSt.lost + " point" + (drSt.lost === 1 ? "" : "s") + " lost until repaired (Workbench > Impact Table)"));
      } else {
        statChips.push(statChip("⛨ " + it.dr + " DR", "var(--success)", "Damage Reduction against physical damage (passive mitigation)"));
      }
    }
    if (it.blockBonus) statChips.push(statChip("⛊ +" + it.blockBonus + " Block", "var(--gold)", "Flat Block Bonus, improves the Block Defensive Impulse"));
    if (typeof it.defense === "number") statChips.push(statChip((it.defense >= 0 ? "+" : "") + it.defense + " DEF", it.defense ? "var(--accent)" : "var(--text3)", "Defense bonus while this shield is wielded"));
    if (it.blockDie) statChips.push(statChip("⛊ " + it.blockDie + " Block", "var(--gold)", "Block die, added when you Block with this shield"));
    if (it.wardDie) statChips.push(statChip("✦ " + it.wardDie + " Ward", "var(--flow)", "Ward die, once per round, added to your Ward reduction"));
    // Body Slot + Worn state read as one merged pill: filled gold while
    // actively worn, outlined while merely owned-but-not-worn, previewed in
    // the market (nothing is ever "worn" pre-purchase), or benched by a Body
    // Slot conflict (still worn, just not currently competing for the slot).
    if (EN.engine.itemSlots && EN.engine.itemSlots(it).length) {
      statChips.push(el("span.chip", {
        title: "Body Slot: " + slotLabel + (isInert ? " (Worn, but benched by a Body Slot conflict, see Freelancer > Loadout)" : pillWorn ? " (Worn)" : ""),
        style: pillWorn
          ? { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)", background: "rgba(255,207,92,.14)" }
          : { fontSize: "9.5px", color: "var(--text3)", borderColor: "var(--border2)" }
      }, [
        el("span", { style: { display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", marginRight: "5px",
          background: pillWorn ? "var(--gold)" : "var(--text4)", boxShadow: pillWorn ? "0 0 6px var(--gold)" : "none" } }),
        document.createTextNode(slotLabel)
      ]));
    }
    if (ld > 0) statChips.push(tagChip("⚖ " + ld, "var(--text2)", "Load " + ld + (isWorn ? " (reduced by 2 while Worn, min 0)" : "") + "; spends your Load Budget while on-person (equipped, carried, worn, or racked)"));
    // every trait tucks behind one tap-to-expand count chip instead of its own pill
    if (traits.length) statChips.push(el("span.chip", {
      title: "Traits: " + traits.join(", "),
      style: { fontSize: "9.5px", cursor: "pointer", color: traitsOpen ? "var(--accent)" : "var(--text2)", borderColor: traitsOpen ? "var(--accent)" : "var(--border2)" },
      onclick: function () { _open[traitsId] = !traitsOpen; EN.app.render(); }
    }, traits.length + (traits.length === 1 ? " trait " : " traits ") + (traitsOpen ? "▾" : "▸")));
    var defDefs = isDefensive(it) ? armorTraitDefs() : null;
    var mktBtn;
    if (_mode === "fivefinger") {
      // Five-Finger is the looted / recovered / pulled-from-a-body channel, the
      // only way a found-only artifact (vendor:false) legitimately reaches a player.
      mktBtn = el("button.btn.sm.primary", { title: it.cyber ? "Take to your Chrome Stash" : (it.vendor === false ? "The story handed it to you; take it." : priceTitle(it)), onclick: function () { it.cyber ? buyCyber(it) : buy(it); } }, "TAKE");
    } else if (it.vendor === false) {
      mktBtn = el("button.btn.sm", { disabled: true, title: "Not vendor stock, found, recovered, or campaign-granted, not bought. It can still turn up in Five-Finger Supply.", style: { color: "var(--flow)", borderColor: "var(--flow)" } }, "FOUND, NOT SOLD");
    } else if (it.upkeep) {
      mktBtn = el("button.btn.sm.primary", { title: "Sign the lease, " + fmtG(it.price || 0) + " buy-in, " + fmtG(it.upkeep) + "/wk Upkeep. It works until the autopay lapses.", onclick: function () { buy(it); } }, "LEASE · " + fmtG(it.upkeep) + "/wk");
    } else {
      mktBtn = el("button.btn.sm" + (afford ? ".primary" : ""), { disabled: !afford, title: it.cyber ? "Buy to your Chrome Stash; install it later at a clinic (Chrome tab)" : priceTitle(it), onclick: function () { it.cyber ? buyCyber(it) : buy(it); } },
        afford ? "BUY · " + fmtG(sp) : "CAN'T AFFORD");
    }
    // lease servicing (stash): PAY when the installment is due, BUYOUT while leased
    var leaseBtns = [];
    if (it.upkeep && owned && !owned.leaseOwned) {
      if (owned.leaseDue) leaseBtns.push(el("button.btn.sm", {
        title: "Pay the installment (" + fmtG(it.upkeep) + "). Until paid, " + it.name + " grants none of its benefits.",
        style: { color: "var(--danger)", borderColor: "var(--danger)" }, onclick: function () { payLease(ownedKey); } }, "⚠ PAY · " + fmtG(it.upkeep)));
      var bo = buyoutCost(it);
      if (bo) leaseBtns.push(el("button.btn.sm", {
        title: "Buy out the lease for " + fmtBuyout(bo) + ". Separate from Upkeep and never offset by Upkeep already paid; only the Buyout closes the lease.",
        style: { color: "var(--flow)", borderColor: "var(--flow)" }, onclick: function () { buyoutLease(ownedKey); } }, "BUYOUT · " + fmtBuyout(bo)));
    }
    // action button(s): a single market button, or the stash loadout/equip/fence/drop group
    /* Which single slot, if any, this owned entry fills. Asked of the engine so the button
       appears for exactly the things the resolver will actually accept: ownedDecks and
       ownedRigs require a matching tier row, so gating on the catalog field alone would offer
       EQUIP on hardware that then refuses to go live. Market rows never equip. */
    var equipSlot = (mode !== "mkt" && entry) ? EN.engine.equipSlotFor(ch, it, entry) : null;
    var actionEl = mode === "mkt"
      ? mktBtn
      : el("div.row.wrap", { style: { gap: "6px", justifyContent: "flex-end" } },
          (entry ? [carryCtrl(ch, it, entry)] : []).concat(leaseBtns).concat(isWeapon(it) ? [
            isEquipped(ch, ownedKey)
              ? el("button.btn.sm.primary", { title: "Unequip, remove from the Attacks list on the Freelancer tab", onclick: function () { toggleEquip(entry); } }, "✓ EQUIPPED")
              : el("button.btn.sm", { title: "Equip, add to the Attacks list on the Freelancer tab", style: { color: "var(--accent)", borderColor: "var(--accent)" }, onclick: function () { toggleEquip(entry); } }, "⚔ EQUIP")
          ] : []).concat(equipSlot ? [
            equipSlot.get(ch) === ownedKey
              ? el("button.btn.sm.primary", { title: "Stow it; it stops applying on the Freelancer tab", onclick: function () { toggleSlotEquip(equipSlot, it, entry); } }, equipSlot.verbs.off)
              : el("button.btn.sm", { title: "Make this the live one (one at a time)", style: { color: "var(--accent)", borderColor: "var(--accent)" }, onclick: function () { toggleSlotEquip(equipSlot, it, entry); } }, equipSlot.verbs.on)
          ] : []).concat(_mode === "fivefinger" ? [
            el("button.btn.sm", { title: "Give one away", style: { color: "var(--success)", borderColor: "var(--success)" }, onclick: function () { donate(ownedKey); } }, "DONATE"),
            el("button.btn.sm", { title: "Discard one", onclick: function () { drop(ownedKey); } }, "DROP")
          ] : [
            el("button.btn.sm", { title: "Sell to the fence at street rate", style: { color: "var(--gold)", borderColor: "var(--gold)" }, onclick: function () { sell(ownedKey); } }, "FENCE · " + fmtG(fencePrice(it))),
            el("button.btn.sm", { title: "Discard one", onclick: function () { drop(ownedKey); } }, "DROP")
          ]));
    // chips wrap freely on the left; the action group is always pinned to the right
    var info = el("div.row", { style: { gap: "10px", alignItems: "flex-start", margin: "4px 0 0", flexWrap: "nowrap" } }, [
      el("div.row.wrap", { style: { gap: "6px", alignItems: "center", flex: "1 1 auto", minWidth: 0 } }, statChips),
      el("div.row.wrap", { style: { gap: "6px", flex: "0 0 auto", marginLeft: "auto", justifyContent: "flex-end", alignItems: "center" } }, [actionEl])
    ]);
    // the traits chip above only shows a count; tapping it opens this row with the real trait chips
    var traitsExpandRow = (traits.length && traitsOpen)
      ? el("div.row.wrap", { style: { gap: "6px", marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed var(--border)" } },
          traits.map(function (t) { return traitChip(t, defDefs); }))
      : null;
    return el("div.feature", { style: { borderLeftColor: LEGAL_COLOR[it.legality] || "var(--border2)" } }, [
      head, info, traitsExpandRow,
      it.benchPart ? partInfoLine(ch, it) : it.armorMod ? armorModInfoLine(ch, it) : (mode !== "mkt" ? installedPartsLine(ch, it, entry) : null),
      open && it.desc ? el("p", { style: { marginTop: "8px" }, text: it.desc }) : null,
      open && it.type ? el("p.help", { style: { margin: "4px 0 0", color: "var(--text2)" }, text: "Type: " + it.type + (it.upkeep ? " · Leased: " + fmtG(it.price || 0) + " buy-in, " + fmtG(it.upkeep) + "/wk Upkeep" : "") + (it.nexus ? " · Nexus: " + it.nexus : "") }) : null,
      open && it.proficiency ? el("p.help", { style: { margin: "4px 0 0", color: "var(--flow)" }, text: "Proficiency: " + it.proficiency + (it.signature ? " · Signature weapon (0 customization slots)" : "") }) : null,
      open && (it.category || it.skill) ? el("p.help", { style: { margin: "4px 0 0", color: "var(--flow)" }, text: (it.category ? "Tool Category: " + it.category : "") + (it.category && it.skill ? " · " : "") + (it.skill ? "Governing Skill: " + it.skill : "") }) : null,
      open && it.feeds ? el("p.help", { style: { margin: "4px 0 0", color: "var(--gold)" }, text: "Feeds: " + it.feeds }) : null,
      // Signature Weapons: On Hit effects and area projections stay locked at
      // any proficiency tier until a Skill Focus names this specific weapon
      open && it.effect ? (it.signature && !EN.engine.signatureUnlocked(ch, it)
        ? el("div", { style: { marginTop: "6px", padding: "6px 9px", border: "1px dashed var(--border2)", borderRadius: "4px", opacity: .6 },
            title: "Weapon Proficiency alone keeps a Signature Weapon's On Hit effects and area projections locked." }, [
            el("span.mono", { style: { fontSize: "10px", color: "var(--warn)", letterSpacing: ".08em" }, text: "🔒 ON HIT LOCKED · " }),
            el("span", { style: { fontSize: "11px", color: "var(--text3)" },
              text: "Requires a Skill Focus naming this weapon: " + (it.proficiency || "its weapon category") + " (" + it.name + "). Buy it on the #PRINT Advance tab (L3+), or claim it as a Free overlap Focus at level 1." })
          ])
        : el("p.help", { style: { margin: "4px 0 0", color: "var(--accent)" }, text: (it.signature ? "" : "Effect: ") + it.effect })) : null,
      open && it.poweredBenefits ? el("p.help", { style: { margin: "4px 0 0", color: "var(--gold)" }, html: "<b style='color:var(--gold)'>Powered Benefits:</b> " + it.poweredBenefits }) : null,
      open && it.cyber ? el("p.help", { style: { margin: "4px 0 0", color: "var(--flow)" }, text: "Install: " + it.zone + " zone · " + it.sp + " SP" + (it.slots ? " · " + it.slots + " mod slots" : "") + " · Enhancement: " + (enhScaled(it) || "None") }) : null,
      open && it.cyber && it.tierNote ? el("p.help", { style: { margin: "4px 0 0" }, text: it.tierNote }) : null,
      open && it.basic ? el("p.help", { style: { margin: "4px 0 0" }, html: "<b style='color:var(--text2)'>Basic Use:</b> " + it.basic }) : null,
      open && it.proficient ? el("p.help", { style: { margin: "4px 0 0" }, html: "<b style='color:var(--gold)'>Proficient Use:</b> " + it.proficient }) : null,
      open && it.range ? el("p.help", { style: { margin: "4px 0 0" }, text: "Range: " + it.range + (it.ammoUnit ? " · Ammo: " + it.ammo + " " + it.ammoUnit : "") }) : null
    ]);
  }

  /* ---- sub-views ---- */
  // Stash categories: fixed display order, collapsible (collapsed by default)
  var STASH_CATS = ["Melee Weapons", "Ranged Weapons", "Signature Weapons", "Ammunition & Munitions",
    "Armor & Defensive Gear", "Carry Gear", "Skill Kits", "Field Devices & Gadgets", "Consumables",
    "Flow Tonics & Resonant Devices", "Smartdecks & B&E Buddies", "Trauma Rigs", "Cipher Library", "Weapon Parts", "Armor Mods", "Vehicles", "Vehicle Mods", "Custom & Unknown"];
  var _stashOpen = {};   // category name -> true when expanded
  function stashCategory(it) {
    if (!it) return "Custom & Unknown";
    if (it.vehicle) return "Vehicles";
    if (it.vehicleMod) return "Vehicle Mods";
    if (it.benchPart) return "Weapon Parts";
    if (it.armorMod) return "Armor Mods";
    if (it.rigTier) return "Trauma Rigs";     // shares the rigs bucket with the hacking hardware
    if (it.signature) return "Signature Weapons";
    if (isWeapon(it)) return (it.group === "Simple" || it.group === "Martial") ? "Melee Weapons" : "Ranged Weapons";
    if (isDefensive(it)) return "Armor & Defensive Gear";
    if (it.legality === "As weapon" || ["Plentiful", "Counted", "Specialty", "Launcher Shell", "Signature Munition", "Mystech"].indexOf(it.group) !== -1) return "Ammunition & Munitions";
    switch (it.bucket) {
      case "carry": return "Carry Gear";
      case "kits": return "Skill Kits";
      case "devices": return "Field Devices & Gadgets";
      case "consumables": return "Consumables";
      case "flow": return "Flow Tonics & Resonant Devices";
      case "rigs": return "Smartdecks & B&E Buddies";
      case "ciphers": return "Cipher Library";
    }
    return "Custom & Unknown";
  }
  function stashView(ch) {
    var entries = (ch.equipment || []).filter(function (e) { return e.qty > 0; });
    // Load readout: what your on-person gear spends against the declared Loadout's budget
    var enc = (EN.engine.derive(ch) || {}).encumbrance || {};
    var encBands = enc.bands || {};
    var encStates = (EN.rules.encumbrance || {}).states || {};
    var stateColor = enc.state === "overloaded" ? "var(--danger)" : enc.state === "encumbered" ? "var(--warn)" : "var(--success)";
    var tierColor = enc.tier === "light" ? "var(--success)" : enc.tier === "standard" ? "var(--accent)" : enc.tier === "heavy" ? "var(--warn)" : "var(--danger)";
    var loadBar = el("div.row.wrap", { style: { gap: "10px", alignItems: "center", padding: "7px 10px", border: "1px solid var(--border)", borderRadius: "4px", background: "rgba(0,0,0,.15)", marginBottom: "10px" } }, [
      el("span.mono", { title: "On-person Load (equipped + carried + worn + racked gear). Each item's ⚖ chip is its Load; 0-Load gear rides free, and a Racked item carries 1 less.\nLight ≤ " + encBands.light + " · Standard ≤ " + encBands.standard + " · Heavy ≤ " + encBands.heavy + " · beyond = Overloaded",
        style: { fontSize: "16px", color: "var(--text)" },
        html: "LOAD " + enc.current + " <span style='font-size:11px;color:var(--text3)'>/ " + enc.budget + "</span>" }),
      el("span.chip", { title: "Your Loadout tier, calculated from what you carry", style: { fontSize: "9px", color: tierColor, borderColor: tierColor } },
        String(enc.tier || "").toUpperCase() + " LOADOUT"),
      el("span.chip", { title: (encStates[enc.state] || {}).effect || "", style: { fontSize: "9px", color: stateColor, borderColor: stateColor } },
        String((encStates[enc.state] || {}).name || enc.state || "").toUpperCase()),
      el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: "Calculated from on-person gear; hauls live on the Freelancer tab's Loadout sub-tab." })
    ]);
    if (!entries.length) {
      return [EN.ui.panel("Stash", "0 ENTRIES", [el("p.help", { style: { margin: 0 }, text: "Empty. The Undercut is open; it's always open." })], { corners: true })];
    }
    // group entries by category, keep the fixed order
    var groups = {};
    entries.forEach(function (e) {
      var it = findItem(e.name);
      var cat = stashCategory(it);
      (groups[cat] = groups[cat] || []).push({ e: e, it: it });
    });
    var catNames = STASH_CATS.filter(function (c) { return groups[c]; });
    var allOpen = catNames.every(function (c) { return _stashOpen[c]; });
    var controls = el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "4px" } }, [
      el("button.btn.sm", { title: allOpen ? "Collapse every category" : "Expand every category",
        onclick: function () { var target = !allOpen; catNames.forEach(function (c) { _stashOpen[c] = target; }); EN.app.render(); } },
        allOpen ? "▾ COLLAPSE ALL" : "▸ EXPAND ALL"),
      el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: "Sorted by category. Set each item's loadout status (carried, worn, racked) right on its card." })
    ]);
    var body = [loadBar, controls];
    catNames.forEach(function (cat) {
      var list = groups[cat];
      var open = !!_stashOpen[cat];
      body.push(el("div.section-title", { style: { margin: "10px 0 4px", cursor: "pointer" },
        title: open ? "Collapse " + cat : "Expand " + cat,
        onclick: function () { _stashOpen[cat] = !open; EN.app.render(); } }, [
        el("span.collapse-caret", { text: open ? "▾" : "▸" }),
        document.createTextNode(" " + cat + " "),
        el("span.mono", { style: { fontSize: "10px", color: "var(--text3)" }, text: "(" + list.length + ")" }),
        el("span.line")
      ]));
      if (open) list.forEach(function (x) {
        if (x.it) { body.push(itemCard(x.it, ch, "stash", x.e)); return; }
        // unknown / custom item (incl. #GRID rigs), minimal row with its Load
        var e = x.e;
        var ld = EN.engine.itemLoad ? EN.engine.itemLoad(e.name) : 0;
        body.push(el("div.feature", null, [
          el("h4", null, [el("span", null, [document.createTextNode(e.name),
            ld > 0 ? tagChip("⚖ " + ld, "var(--text2)", "Load " + ld + "; spends your Load Budget while on-person") : null]),
            el("span.mono", { style: { color: "var(--text3)", fontSize: "13px" }, text: "×" + e.qty })]),
          el("div.row", { style: { gap: "6px", marginTop: "4px", justifyContent: "flex-end" } }, [
            carryCtrl(ch, null, e),
            el("button.btn.sm", { onclick: function () { drop(entryKey(e)); } }, "DROP")
          ])
        ]));
      });
    });
    return [EN.ui.panel("Stash", entries.length + " ENTRIES", body, { corners: true })];
  }

  /* ---- Chrome tab: body silhouette + Chrome-Tax heat map, installed list, Open Architecture ---- */
  function heatColor(spv) { return spv <= 0 ? "#2a3446" : spv <= 2 ? "#00e5ff" : spv <= 4 ? "#ffcf5c" : spv <= 6 ? "#ff6b35" : "#ff4d5e"; }
  var THRESH_COLOR = ["#34465f", "#ffcf5c", "#ff6b35", "#ff6b35", "#ff4d5e", "#ff4d5e"];
  // Enhancement Bonus scaled by tier (Streetware grants none; Blackware doubles); null = no bonus shown
  function enhScaled(cw) {
    if (!cw || !cw.enhancement || cw.enhancement === "None") return null;
    var m = cw.enhancement.match(/\+(\d+)\s+(.+)/);
    if (!m) return cw.enhancement;
    var base = parseInt(m[1], 10), rest = m[2];
    var amt = cw.tier === "Streetware" ? 0 : cw.tier === "Blackware" ? base * 2 : base;
    return amt === 0 ? null : "+" + amt + " " + rest;
  }

  // The silhouette SVG sits in the BACKGROUND; the heat markers ride on a
  // transparent SVG overlay in the FOREGROUND, aligned to the same 854x1972 space.
  var SIL_W = 825, SIL_H = 1970;
  function silhouetteBody(installed, tax) {
    var CW = EN.cyberware || { zones: {} };
    var points = {};
    installed.forEach(function (cw) {
      var z = CW.zones[cw.zone] || CW.zones.Hardware || { at: { x: SIL_W / 2, y: SIL_H / 2 } };
      var p = (z.sided && cw.side === "L") ? z.left : (z.sided && cw.side === "R") ? z.right : z.at;
      var key = cw.zone + (z.sided && cw.side ? cw.side : "");
      if (!points[key]) points[key] = { x: p.x, y: p.y, sp: 0, zone: cw.zone, side: (z.sided ? cw.side : null), n: 0 };
      points[key].sp += (cw.sp || 0); points[key].n += 1;
    });
    var blobs = "", labels = "";
    Object.keys(points).forEach(function (k) {
      var pt = points[k], r = 50 + Math.min(80, pt.sp * 14), col = heatColor(pt.sp);
      blobs += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="' + r + '" fill="' + col + '" opacity="0.38" filter="url(#chsoft)"/>' +
               '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="11" fill="' + col + '"/>';
      // readable chip: rounded panel behind a zone line + an SP/count line, offset to the nearer side
      var zoneTxt = pt.zone.toUpperCase() + (pt.side ? " " + pt.side : "");
      var spTxt = pt.sp + " SP · " + pt.n + (pt.n === 1 ? " pc" : " pcs");
      var pad = 16, w = Math.max(zoneTxt.length * 18, spTxt.length * 15.5) + pad * 2, h = 66, gap = 22;
      var leftSide = pt.x < SIL_W / 2;
      var cx = leftSide ? (pt.x - gap - w) : (pt.x + gap), cy = pt.y - h / 2, tx = cx + pad;
      var nearX = leftSide ? (cx + w) : cx;
      labels += '<line x1="' + pt.x + '" y1="' + pt.y + '" x2="' + nearX + '" y2="' + pt.y + '" stroke="' + col + '" stroke-width="2" opacity="0.5"/>' +
        '<rect x="' + cx + '" y="' + cy + '" width="' + w + '" height="' + h + '" rx="11" fill="rgba(8,12,18,0.84)" stroke="' + col + '" stroke-width="1.5"/>' +
        '<text x="' + tx + '" y="' + (cy + 28) + '" fill="' + col + '" font-size="30" font-weight="bold" font-family="monospace">' + zoneTxt + '</text>' +
        '<text x="' + tx + '" y="' + (cy + 55) + '" fill="#9fb3c8" font-size="26" font-family="monospace">' + spTxt + '</text>';
    });
    var aura = THRESH_COLOR[Math.min(5, tax.index)] || "#34465f";
    var overlay = '<svg viewBox="0 0 ' + SIL_W + ' ' + SIL_H + '" preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><filter id="chsoft" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="22"/></filter></defs>' + blobs + labels + '</svg>';
    var bg = '<img src="img/silhouette.svg" alt="body silhouette" style="width:100%;display:block;filter:drop-shadow(0 0 8px ' + aura + ')" onerror="this.style.visibility=\'hidden\'"/>';
    return '<div style="position:relative;width:100%;max-width:225px;margin:0 auto">' + bg + overlay + '</div>';
  }

  function chromeView(ch) {
    var eng = EN.engine, R = EN.rules, CW = EN.cyberware || { zones: {}, items: [] };
    var d = eng.derive(ch);
    var installed = eng.installedCyberware(ch);
    var tax = d.chromeTax || { total: 0, index: 0, name: "Safe Capacity", resDiePenalty: 0, fpPenalty: 0, effects: [] };
    var taxColor = THRESH_COLOR[Math.min(5, tax.index)] || "var(--text2)";

    /* --- frame panel: silhouette + whole-body Chrome-Tax gauge --- */
    // vertical gauge: one segment per Static Point, colored across the threshold bands,
    // with Tn ticks at each threshold boundary. Chrome Tax is a single whole-body total.
    var GAUGE_MAX = 12;
    function bandTick(i) { return (i === 3) ? "T1" : (i === 5) ? "T2" : (i === 7) ? "T3" : (i === 9) ? "T4" : (i === 11) ? "T5" : ""; }
    var gaugeRows = [];
    for (var gi = GAUGE_MAX; gi >= 1; gi--) {
      (function (i) {
        var lit = i <= tax.total, col = heatColor(i), tick = bandTick(i);
        gaugeRows.push(el("div.row", { style: { gap: "5px", alignItems: "center", height: "11px" } }, [
          el("div", { title: i + " SP", style: { width: "38px", height: "100%", borderRadius: "2px",
            background: lit ? col : "rgba(120,140,170,.10)", boxShadow: lit ? "0 0 5px " + col : "none",
            border: (lit && i === tax.total) ? "1px solid var(--text)" : "none" } }),
          el("span.mono", { style: { fontSize: "8.5px", width: "16px", color: tick ? (i <= tax.total ? heatColor(i) : "var(--text4)") : "transparent" }, text: tick || "·" })
        ]));
      })(gi);
    }
    var gauge = el("div", { title: "Chrome Tax, total Static across the whole body, not per zone", style: { display: "flex", flexDirection: "column", gap: "2px" } }, gaugeRows);
    var scaleLegend = ["1-2", "3-4", "5-6", "7+"].map(function (lbl, i) {
      var col = [heatColor(1), heatColor(3), heatColor(5), heatColor(7)][i];
      return el("span.row", { style: { gap: "4px", alignItems: "center" } }, [
        el("span", { style: { width: "10px", height: "10px", borderRadius: "50%", background: col, display: "inline-block" } }),
        el("span.mono", { style: { fontSize: "9.5px", color: "var(--text3)" }, text: lbl })
      ]);
    });
    var taxText = el("div", { style: { display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: 0 } }, [
      el("div", null, [
        el("div.mono", { style: { fontSize: "40px", color: taxColor, lineHeight: 1 }, text: String(tax.total) }),
        el("div.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em" }, text: "TOTAL STATIC · FULL BODY" })
      ]),
      el("div", null, [
        el("div", { style: { fontFamily: "var(--disp)", fontSize: "14px", letterSpacing: ".06em", color: taxColor }, text: "T" + tax.index + " · " + tax.name }),
        tax.index > 0
          ? el("div.mono", { style: { fontSize: "11px", color: "var(--text2)", marginTop: "2px" }, text: "−" + tax.resDiePenalty + (tax.resDiePenalty === 1 ? " Resilience Die" : " Resilience Dice") + " · −" + tax.fpPenalty + " max FP" })
          : el("div.mono", { style: { fontSize: "11px", color: "var(--success)", marginTop: "2px" }, text: "Safe capacity, no penalty" })
      ]),
      (tax.effects && tax.effects.length) ? el("ul", { style: { margin: "2px 0 0", paddingLeft: "16px", color: "var(--text3)", fontSize: "11.5px", lineHeight: 1.5 } },
        tax.effects.map(function (e) { return el("li", { text: e }); })) : null,
      el("div", { style: { marginTop: "2px" } }, [
        el("div.mono", { style: { fontSize: "9.5px", color: "var(--text3)", letterSpacing: ".1em", marginBottom: "3px" }, text: "STATIC SCALE (SP)" }),
        el("div.row.wrap", { style: { gap: "10px" } }, scaleLegend)
      ])
    ]);
    var taxReadout = el("div", { style: { display: "flex", gap: "16px", alignItems: "flex-start" } }, [gauge, taxText]);
    var frameGrid = el("div", { style: { display: "grid", gridTemplateColumns: "minmax(150px, 0.85fr) minmax(240px, 1.15fr)", gap: "16px", alignItems: "center" } }, [
      el("div", { html: silhouetteBody(installed, tax) }),
      taxReadout
    ]);
    /* --- small Attribute Matrix (bar view) + Resilience / Flow impact boxes --- */
    var ATTR_GRAD = "linear-gradient(90deg, #ff2e88 0%, #8b3dff 55%, #00b3ff 100%)";
    function attrTier(score) {
      if (score >= 20) return { label: "Peak", color: "var(--accent)", icon: "○ " };
      if (score >= 16) return { label: "Exceptional", color: "#7b5cff" };
      if (score >= 12) return { label: "Capable", color: "#4f9dff" };
      if (score >= 10) return { label: "Baseline", color: "var(--flow)" };
      if (score >= 8) return { label: "Weak", color: "#ff4f8a" };
      return { label: "Impaired", color: "var(--danger)" };
    }
    var attrRows = (R.attributes || []).map(function (a) {
      var A = d.attributes[a.key], sc = A.score, mod = A.mod, cb = A.cyberBonus || 0, t = attrTier(sc), pct = Math.max(4, Math.min(100, sc / 20 * 100));
      return el("div", { title: a.name + " " + sc + " · " + eng.fmtMod(mod) + (cb ? " (includes +" + cb + " from chrome)" : ""), style: { display: "grid", gridTemplateColumns: "50px 1fr 30px", columnGap: "8px", alignItems: "center", padding: "2px 0" } }, [
        el("span", { style: { fontWeight: 600, fontSize: "11px" }, text: a.name }),
        el("div", null, [
          el("div", { style: { height: "8px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: "4px", overflow: "hidden" } },
            [el("div", { style: { width: pct + "%", height: "100%", background: ATTR_GRAD } })]),
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline" } }, [
            el("span", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".1em", color: t.color }, text: (t.icon || "") + t.label }),
            el("span", null, [
              cb ? el("span.mono", { style: { fontSize: "8.5px", color: "var(--accent)", marginRight: "3px" }, title: "+" + cb + " from installed chrome", text: "◆+" + cb }) : null,
              el("span.mono", { style: { fontSize: "9px", color: "var(--text3)" }, text: String(sc) })
            ])
          ])
        ]),
        el("span.mono", { style: { fontSize: "13px", color: cb ? "var(--accent)" : "var(--accent)", textAlign: "right" }, text: eng.fmtMod(mod) })
      ]);
    });
    var attrMatrix = el("div", null, [
      el("div.mono", { style: { fontSize: "9.5px", letterSpacing: ".12em", color: "var(--text3)", marginBottom: "5px" }, text: "ATTRIBUTE MATRIX" }),
      el("div", null, attrRows)
    ]);
    function impactBox(label, current, total, penalty, col) {
      return el("div", { style: { padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "4px", background: "var(--bg1)" } }, [
        el("div.mono", { style: { fontSize: "9.5px", letterSpacing: ".1em", color: "var(--text3)" }, text: label }),
        el("div", { style: { display: "flex", alignItems: "baseline", gap: "5px", marginTop: "3px" } }, [
          el("div.mono", { style: { fontSize: "26px", lineHeight: 1, color: penalty > 0 ? col : "var(--text)" }, text: String(current) }),
          el("div.mono", { style: { fontSize: "13px", color: "var(--text3)" }, text: "/ " + total })
        ]),
        el("div.mono", { style: { fontSize: "10px", marginTop: "3px", color: penalty > 0 ? "var(--danger)" : "var(--success)" }, text: penalty > 0 ? "−" + penalty + " · Chrome Tax (T" + tax.index + ")" : "no reduction" })
      ]);
    }
    var resBase = d.resilienceMax + tax.resDiePenalty;
    var boxes = [impactBox("RESILIENCE DICE", d.resilienceMax, resBase, tax.resDiePenalty, taxColor)];
    if (d.flow) boxes.push(impactBox("FLOW RESERVOIR (FP)", d.flow.max, d.flow.max + tax.fpPenalty, tax.fpPenalty, taxColor));
    var statsRow = el("div", { style: { display: "grid", gridTemplateColumns: "minmax(220px, 1.25fr) minmax(170px, 1fr)", gap: "16px", alignItems: "start", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" } }, [
      attrMatrix,
      el("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } }, boxes)
    ]);

    var framePanel = EN.ui.panel("Cybernetic Frame", "BIOMETRIC OVERLAY · CHROME TAX", [
      frameGrid,
      statsRow,
      el("p.help", { style: { margin: "10px 0 0", color: "var(--text4)" }, text: "The gauge is your whole-body Chrome Tax (Total Static → Threshold). Silhouette dots mark where each implant sits; species / gender / lineage variants come later." })
    ], { corners: true });

    /* --- Chrome panel: Chrome Stash (owned, uninstalled) | Installed Chrome --- */
    var tierChipColor = function (t) { return t === "Blackware" ? "var(--danger)" : t === "Brandware" ? "var(--accent)" : t === "Prototype" ? "var(--flow)" : "var(--text3)"; };
    function cyberRow(cw, idx, where) {
      var sided = !!cw.sided, oid = where + "-cw-" + idx, open = !!_open[oid];
      var chips = [
        where === "installed" ? tagChip("● INSTALLED", "var(--success)", "Installed, counts toward your Static") : tagChip("STASHED", "var(--text3)", "In your stash, not yet installed"),
        cw.tier ? tagChip(cw.tier, tierChipColor(cw.tier), ((EN.cyberware || {}).qualityTiers || {})[cw.tier] || "") : null,
        tagChip((cw.sp || 0) + " SP", heatColor(cw.sp || 0)),
        tagChip("◆ " + cw.zone, "var(--accent)", "Interface Zone"),
        (function () { var e = enhScaled(cw); return e ? tagChip("✦ " + e, "var(--gold)", where === "installed" ? "Enhancement Bonus, applied to your attributes" : "Enhancement Bonus, applies once installed") : null; })()
      ];
      var actions;
      if (where === "stash") {
        actions = el("div.row", { style: { gap: "6px" } }, [
          el("button.btn.sm.primary", { title: "Install at a clinic; moves it to Installed Chrome and adds its SP to your Static", onclick: function (e) { e.stopPropagation(); installFromStash(idx); } }, "⧉ INSTALL"),
          el("button.btn.sm", { title: "Discard this implant", style: { color: "var(--danger)", borderColor: "var(--danger)" }, onclick: function (e) { e.stopPropagation(); dropStash(idx); } }, "DROP")
        ]);
      } else {
        var sideToggle = sided ? el("div.row", { style: { gap: "3px" } }, ["L", "R"].map(function (s) {
          return el("button.btn.sm" + (cw.side === s ? ".primary" : ""), { title: "Install side", style: { padding: "1px 8px", minWidth: "24px" },
            onclick: function (e) { e.stopPropagation(); store.update(function (c) { if (c.cyberware[idx]) c.cyberware[idx].side = s; }); } }, s);
        })) : null;
        actions = el("div.row", { style: { gap: "8px", alignItems: "center" } }, [
          sideToggle,
          el("button.btn.sm", { title: "Uninstall, returns to your Chrome Stash", style: { color: "var(--danger)", borderColor: "var(--danger)" }, onclick: function (e) { e.stopPropagation(); uninstallToStash(idx); } }, "✕")
        ]);
      }
      return el("div.feature", { style: { borderLeftColor: where === "installed" ? heatColor(cw.sp || 0) : "var(--border2)" } }, [
        el("h4", { style: { cursor: "pointer", flexWrap: "wrap", gap: "6px" }, onclick: function () { _open[oid] = !open; EN.app.render(); } }, [
          el("span", null, [el("span.collapse-caret", { text: open ? "▾" : "▸" }), document.createTextNode(" " + cw.name)].concat(chips)),
          actions
        ]),
        open && ENG().cyberEffect(cw) ? el("p.help", { style: { margin: "4px 0 0", color: "var(--accent)" }, text: ENG().cyberEffect(cw) }) : null,
        open && ENG().cyberDesc(cw) ? el("p", { style: { margin: "6px 0 0" }, text: ENG().cyberDesc(cw) }) : null
      ]);
    }
    // one list: INSTALLED pieces float to the top, auto-sorted by Zone → Tier; STASHED pieces follow
    var ZONE_ORD = { Neural: 0, Core: 1, Integument: 2, Arms: 3, Legs: 4, Hardware: 5 };
    var TIER_ORD = { Streetware: 0, Brandware: 1, Blackware: 2, Prototype: 3 };
    function ord(map, key, fallback) { var v = map[key]; return v === undefined ? fallback : v; }
    var stash = ch.cyberStash || [];
    var installedSorted = installed.map(function (cw, i) { return { cw: cw, idx: i }; }).sort(function (a, b) {
      var dz = ord(ZONE_ORD, a.cw.zone, 9) - ord(ZONE_ORD, b.cw.zone, 9);
      return dz !== 0 ? dz : (ord(TIER_ORD, a.cw.tier, 8) - ord(TIER_ORD, b.cw.tier, 8));
    });
    var chromeRows = installedSorted.map(function (o) { return cyberRow(o.cw, o.idx, "installed"); })
      .concat(stash.map(function (cw, i) { return cyberRow(cw, i, "stash"); }));
    if (!chromeRows.length) chromeRows = [el("p.help", { style: { margin: 0 }, text: "Empty. Buy chrome from the gray-market Cybernetics panel; it lands here, then hit INSTALL to bring it online." })];
    var stashPanel = EN.ui.panel("Chrome", installed.length + " INSTALLED · " + stash.length + " STASHED · " + tax.total + " SP",
      chromeRows, { corners: true });

    /* --- Open Architecture, only for NextGen-lineage characters --- */
    var blocks = [framePanel, stashPanel];
    if (ch.lineage === "nextgen") { var oaPanel = chromeOAPanel(ch); if (oaPanel) blocks.push(oaPanel); }
    return blocks;
  }

  function chromeOAPanel(ch) {
    var eng = EN.engine, R = EN.rules, oa = R && R.openArchitecture;
    if (!oa) return null;
    var owned = eng.activeLineageFeatures(ch);
    var hasOA = owned.indexOf("Open Architecture") !== -1;
    var bases = eng.installedCyberBases(ch);
    function comboHasChrome(cyberStr) { var opts = cyberStr.split(/\s+or\s+/); return bases.some(function (b) { return b === cyberStr || opts.indexOf(b) !== -1; }); }
    var rows = oa.combos.map(function (combo) {
      var hasFeat = owned.indexOf(combo.feature) !== -1, hasChrome = comboHasChrome(combo.cyberware), integrated = hasOA && hasFeat && hasChrome;
      var oid = "coa-" + combo.key, open = !!_open[oid];
      return el("div", { style: { borderBottom: "1px solid rgba(35,48,68,.5)", borderLeft: integrated ? "2px solid var(--gold)" : "2px solid transparent" } }, [
        el("div.row.wrap", { style: { gap: "8px", alignItems: "center", cursor: "pointer", padding: "7px 4px" }, onclick: function () { _open[oid] = !open; EN.app.render(); } }, [
          el("span.collapse-caret", { text: open ? "▾" : "▸" }),
          el("span", { style: { flex: 1, minWidth: "150px", fontWeight: 600, color: integrated ? "var(--gold)" : "var(--text)" }, text: combo.feature + " + " + combo.cyberware }),
          tagChip(hasFeat ? "FEATURE ✓" : "NO FEATURE", hasFeat ? "var(--success)" : "var(--text3)"),
          tagChip(hasChrome ? "CHROME ✓" : "NO CHROME", hasChrome ? "var(--accent)" : "var(--text3)"),
          integrated ? tagChip("● INTEGRATED", "var(--gold)") : null
        ]),
        open ? el("p", { style: { padding: "0 4px 9px 23px", margin: 0, color: "var(--text2)", fontSize: "13px", lineHeight: 1.45 }, text: combo.text }) : null
      ]);
    });
    return EN.ui.panel("Open Architecture", hasOA ? "NEXTGEN INTEGRATION · ACTIVE" : "REQUIRES THE OPEN ARCHITECTURE EVOLUTION", [
      el("p.help", { style: { margin: "0 0 6px" }, text: oa.rule || oa.intro }),
      !hasOA ? el("p.help", { style: { margin: "0 0 8px", color: "var(--warn)" }, text: "You don't have the Open Architecture lineage evolution yet; pairings stay inert until you do." }) : null,
      el("div", null, rows)
    ], { corners: true });
  }

  function marketView(ch) {
    var g = EN.gearCatalog || {};
    var melee = (g.melee && g.melee.items) || [];
    var ranged = (g.ranged && g.ranged.items) || [];
    var sig = (g.signature && g.signature.items) || [];
    var sigMun = (g.signature && g.signature.munitions) || [];
    var ammo = (g.ammo && g.ammo.items) || [];
    var armorItems = (g.armor && g.armor.items) || [];
    var blocks = [];
    var BANNERS = {
      undercut: {
        title: "THE UNDERCUT", color: "var(--ember)", glow: "rgba(255,90,40,.05)",
        sub: "GRAY-MARKET UPLINK · LIST PRICE, NO PAPERWORK · NO RECEIPTS · NO NAMES",
        body: ["Every legitimate storefront charges for compliance, verification, and the privilege of being watched while you pay. The Undercut skips all of it and sells at the number printed in the book. Cash up front. Don't ask for a receipt; asking for a receipt is how they find you."]
      },
      register: {
        title: "THE REGISTER", color: "var(--accent)", glow: "rgba(0,229,255,.05)",
        sub: "CERTIFIED SUPPLY · MANDATORY VERIFICATION · COMPLIANCE SURCHARGES · ALL SALES FINAL",
        body: ["All transactions include regulated district adjustments: compliance handling, #PRINT verification, licensing escrow, and scarcity-indexed pricing. Licensed and Restricted goods incur additional processing surcharges at point of sale.",
               "Thank you for shopping responsibly. Fees are non-negotiable. All sales final."]
      },
      surplus: {
        title: "GUILD SURPLUS", color: "var(--gold)", glow: "rgba(255,200,80,.05)",
        sub: "FREELANCERS GUILD · OVERSTOCK BINS · SALVAGE LOTS · MEMBERS' RATES",
        body: ["Job lots, recovered cargo, overstock nobody claimed, and salvage with the serial numbers conveniently worn off. Everything works, mostly. Everything runs about a third of book, roughly.",
               "Guild members only. Dues current? Dig in."]
      },
      fivefinger: {
        title: "FIVE-FINGER SUPPLY", color: "var(--success)", glow: "rgba(60,255,140,.05)",
        sub: "LOOTED · RECOVERED · DONATED · PULLED FROM A BODY",
        body: ["Nothing here is for sale because nothing here was ever bought. This is what the job left behind: looted off the floor, recovered from the wreck, donated by a grateful stranger, or pried out of hands that stopped needing it.",
               "Take what the story gave you. The fence won't touch any of it, no provenance, no payout. Drop it or donate it when you're done.",
               "No receipts. No refunds. No snitching."]
      }
    };
    blocks.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "14px" } },
      [el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".14em" }, text: "MARKET UPLINK" })].concat(
      STOREFRONTS.map(function (m) {
        var on = _mode === m.key;
        return el("button.btn.sm" + (on ? ".primary" : ""), {
          title: m.desc,
          onclick: function () { _mode = m.key; EN.app.render(); }
        }, m.name.toUpperCase());
      }))
    ));
    var B = BANNERS[_mode] || BANNERS.undercut;
    blocks.push(el("div", { style: { marginBottom: "14px", padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "4px",
                                     background: "linear-gradient(180deg, " + B.glow + ", transparent)" } }, [
      el("div", { style: { fontFamily: "var(--disp)", fontSize: "16px", letterSpacing: ".22em", color: B.color }, text: B.title }),
      el("div.mono", { style: { fontSize: "10.5px", color: "var(--text3)", letterSpacing: ".1em", marginTop: "2px" }, text: B.sub })
    ].concat(B.body.map(function (p, i) {
      return el("p.help", { style: { margin: (i === 0 ? "8px" : "4px") + " 0 0" }, text: p });
    }))));

    /* ---- major-type categories → one collapsible panel each ---- */
    var ri = (g.ranged && g.ranged.groupIntros) || {};
    var si = (g.signature && g.signature.groupIntros) || {};
    var byGroup = function (list, grp) { return list.filter(function (i) { return i.group === grp; }); };
    var byKind = function (list, k) { return list.filter(function (i) { return i.kind === k; }); };
    var cats = [
      { key: "melee", title: "Melee Weapons", short: "MELEE", intro: g.melee && g.melee.saveDcNote, subs: [
        { label: "Simple", intro: g.melee && g.melee.simpleIntro, items: byGroup(melee, "Simple") },
        { label: "Martial", intro: g.melee && g.melee.martialIntro, items: byGroup(melee, "Martial") }
      ] },
      { key: "ranged", title: "Ranged Weapons", short: "RANGED", subs: [
        { label: "Sidearms", intro: ri["Sidearm"], items: byGroup(ranged, "Sidearm") },
        { label: "Longarms", intro: ri["Longarm"], items: byGroup(ranged, "Longarm") },
        { label: "Heavy Weapons", intro: ri["Heavy"], items: byGroup(ranged, "Heavy") },
        { label: "Explosive Launchers", intro: ri["Launcher"], items: byGroup(ranged, "Launcher") },
        { label: "Thrown Weapons", intro: ri["Thrown"], items: byGroup(ranged, "Thrown") },
        { label: "Bowfire", intro: ri["Bowfire"], items: byGroup(ranged, "Bowfire") }
      ] },
      { key: "signature", title: "Signature Weapons", short: "SIGNATURE", intro: g.signature && g.signature.intro, subs: [
        { label: "Signature · Melee", intro: si.melee, items: byKind(sig, "melee") },
        { label: "Signature · Ranged", intro: si.ranged, items: byKind(sig, "ranged") },
        { label: "Signature Munitions", intro: g.signature && g.signature.munitionsIntro, items: sigMun }
      ] },
      { key: "ammo", title: "Ammunition", short: "AMMO", intro: g.ranged && g.ranged.saveDcNote, subs: [
        { label: "Standard · Plentiful", intro: "Track only the loaded magazine; restock to full between contracts. Prices buy one reload.", items: byGroup(ammo, "Plentiful") },
        { label: "Standard · Counted", intro: "Heavy, expensive, watched, and scarce. Track each unit from purchase to spend.", items: byGroup(ammo, "Counted") },
        { label: "Specialty", intro: "All Counted: Load it, Declare it before the attack, Apply it on resolution.", items: byGroup(ammo, "Specialty") },
        { label: "Launcher Shells", intro: "Fired from a Grenade Launcher. Targets save Agility vs your Weapon Save DC.", items: byGroup(ammo, "Launcher Shell") },
        { label: "Mystech", intro: (EN.gearCatalog.ammo && EN.gearCatalog.ammo.mystechNote) || "", items: byGroup(ammo, "Mystech") }
      ] }
    ];
    if (VEH().length) {
      var V = EN.vehicles;
      cats.push({ key: "vehicles", title: "Vehicles", short: "VEHICLES", intro: V.intro, subs: [
        { label: "Buy Outright", intro: "List price is twenty weeks of upkeep. " + (V.unlisted || ""),
          items: VEH().map(vehicleAsItem) },
        { label: "Corporate Lease", intro: (V.acquisition || []).filter(function (a) { return a.mode === "Leased"; })
            .map(function (a) { return a.note; }).join(" "),
          items: VEH().map(vehicleLeaseAsItem) },
        { label: "Vehicle Mods", intro: (V.modRules || []).join(" "), items: vehicleModItems() }
      ] });
    }
    if (g.armor && armorItems.length) {
      var ai = g.armor.groupIntros || {};
      cats.push({ key: "armor", title: "Armor & Defensive Gear", short: "ARMOR", intro: g.armor.intro, subs: [
        { label: "Light Armor", intro: ai["Light Armor"], items: byGroup(armorItems, "Light Armor") },
        { label: "Medium Armor", intro: ai["Medium Armor"], items: byGroup(armorItems, "Medium Armor") },
        { label: "Heavy Armor", intro: ai["Heavy Armor"], items: byGroup(armorItems, "Heavy Armor") },
        { label: "Powered Exoframes", intro: ai["Powered Exoframe"], items: byGroup(armorItems, "Powered Exoframe") },
        { label: "Mystech Armor", intro: ai["Mystech Armor"], items: byGroup(armorItems, "Mystech Armor") },
        { label: "Physical Shields", intro: ai["Physical Shield"], items: byGroup(armorItems, "Physical Shield") },
        { label: "Warding Foci", intro: ai["Warding Focus"], items: byGroup(armorItems, "Warding Focus") }
      ] });
    }
    // Weapon Parts: Mods + Accessories for the Arms Table
    if (WP().parts && WP().parts.length) {
      var allParts = partItems();
      var slotOrder = (WP().slots || []).map(function (s) { return s.key; });
      var partsByCat = function (catKey) {
        return allParts.filter(function (p) { return p.partCategory === catKey; })
          .sort(function (a, b) { return (slotOrder.indexOf(a.partSlot) - slotOrder.indexOf(b.partSlot)) || a.name.localeCompare(b.name); });
      };
      cats.push({ key: "parts", title: "Mods & Accessories", short: "PARTS",
        intro: (WP().rules ? WP().rules.install + " " + WP().rules.legality : "") + " Buy a Part here, then install it from the Workbench (Arms Table).",
        subs: [
          { label: "Melee Parts", intro: "Edges, heads, cores, hilts, and locks worked into a melee weapon.", items: partsByCat("melee") },
          { label: "Firearm Parts", intro: "Optics, barrels, receivers, stocks, and muzzle gear. Bows also draw Targeting, Handling, and Utility from here.", items: partsByCat("ranged") },
          { label: "Bowfire Parts", intro: "Limbs and cams for bows and crossbows.", items: partsByCat("bowfire") }
        ] });
    }
    // Armor Mods for the Impact Table
    if (AM().mods && AM().mods.length) {
      var allMods = armorModItems();
      var modsByCat = function (catKey) { return allMods.filter(function (m) { return m.modCategory === catKey; }); };
      cats.push({ key: "armormods", title: "Armor Mods", short: "ARMOR MODS",
        intro: (AM().intro ? AM().intro + " " : "") + (AM().rules ? AM().rules.host + " " + AM().rules.legality : "") + " Buy a mod here, then fit it from the Workbench (Impact Table).",
        subs: (AM().categories || []).map(function (cg) { return { label: cg.name, intro: cg.blurb, items: modsByCat(cg.key) }; })
      });
    }
    var T = g.tools;
    if (T && T.buckets) {
      var SHORT = { kits: "KITS", devices: "DEVICES", carry: "CARRY", consumables: "CONSUMABLES", flow: "FLOW", rigs: "RIGS", ciphers: "CIPHERS" };
      T.buckets.forEach(function (bucket) {
        cats.push({ key: bucket.key, title: bucket.title, short: SHORT[bucket.key] || bucket.key.toUpperCase(), intro: bucket.intro,
          subs: (bucket.groups || []).map(function (grp) {
            return { label: grp.name, intro: grp.intro, items: (T.items || []).filter(function (i) { return i.bucket === bucket.key && i.group === grp.name; }) };
          }) });
      });
    }
    /* Cybernetics, tier variants per piece, grouped by Interface Zone. Installed
       chrome is hidden here (it moves to the Chrome tab). Buying installs it. */
    var CW = EN.cyberware;
    if (CW && CW.items) {
      var TIER_AVAIL = { Streetware: "Common", Brandware: "Uncommon", Blackware: "Rare", Prototype: "Rare" };
      var installedNames = (ch.cyberware || []).map(function (c) { return c.name || c; });
      var cyberSubs = ["Neural", "Core", "Integument", "Arms", "Legs", "Hardware"].map(function (zk) {
        var z = CW.zones[zk], listings = [];
        CW.items.filter(function (it) { return it.zone === zk; }).forEach(function (it) {
          (it.tiers || []).forEach(function (t) {
            var nm = t.tier === "Prototype" ? it.short + " (Prototype)" : t.tier + " " + it.short;
            if (installedNames.indexOf(nm) !== -1) return;   // already installed → lives in Chrome tab
            listings.push({ name: nm, cyber: true, cyberKey: it.key, base: it.name, tier: t.tier,
              zone: it.zone, sp: t.sp, slots: t.slots || 0, sided: !!it.sided, mystech: !!it.mystech,
              enhancement: it.enhancement, price: t.price, legality: t.legality, availability: TIER_AVAIL[t.tier] || "Uncommon",
              desc: it.desc, effect: it.effect,
              tierNote: t.tier === "Streetware" && it.street ? "Streetware: " + it.street : t.tier === "Blackware" && it.black ? "Blackware: " + it.black : "" });
          });
        });
        return { label: z.label, intro: z.blurb, items: listings, byTier: true };
      });
      cats.push({ key: "cybernetics", title: "Cybernetics", short: "CHROME", intro: CW.intro, subs: cyberSubs });
    }

    /* ---- filter predicate ---- */
    var q = (_mktQuery || "").trim().toLowerCase();
    var anyFilter = !!q || _mktType !== "all" || _mktLegal !== "all" || _mktAvail !== "all";
    function itemPass(it) {
      if (_mktLegal !== "all" && it.legality !== _mktLegal) return false;
      if (_mktAvail !== "all" && it.availability !== _mktAvail) return false;
      if (q) {
        var hay = (it.name + " " + (it.desc || "") + " " + (it.effect || "") + " " + (it.group || "") + " " + (it.category || "") + " " + (it.skill || "")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }

    /* ---- filter / search control bar (below the storefront banner) ---- */
    function fbtn(active, label, on, color) {
      return el("button.btn.sm" + (active ? ".primary" : ""), { style: (active && color) ? { color: color, borderColor: color } : null, onclick: on }, label);
    }
    function setF(key, val) { return function () { if (key === "type") _mktType = val; else if (key === "legal") _mktLegal = val; else _mktAvail = val; EN.app.render(); }; }
    var typeBtns = [fbtn(_mktType === "all", "ALL", setF("type", "all"))].concat(cats.map(function (c) { return fbtn(_mktType === c.key, c.short, setF("type", c.key)); }));
    var legalBtns = [fbtn(_mktLegal === "all", "ALL", setF("legal", "all"))].concat(["Legal", "Licensed", "Restricted", "Contraband"].map(function (l) { return fbtn(_mktLegal === l, l.toUpperCase(), setF("legal", l), LEGAL_COLOR[l]); }));
    var availBtns = [fbtn(_mktAvail === "all", "ALL", setF("avail", "all"))].concat(["Common", "Uncommon", "Rare", "Iconic", "Legendary", "Mythical", "Artifact"].map(function (a) { return fbtn(_mktAvail === a, a.toUpperCase(), setF("avail", a), AVAIL_COLOR[a]); }));
    var searchIn = el("input", { id: "mkt-search", type: "text", value: _mktQuery, placeholder: "search name, effect, category…",
      style: { maxWidth: "300px", flex: "1 1 200px" },
      oninput: function () { _mktQuery = this.value; var pos = this.selectionStart; EN.app.render(); var n = document.getElementById("mkt-search"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } } });
    function frow(label, btns) { return el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "8px" } }, [el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em", minWidth: "64px" }, text: label })].concat(btns)); }
    var totalCount = 0, matchCount = 0;
    cats.forEach(function (c) {
      var typeOk = _mktType === "all" || _mktType === c.key;
      c.subs.forEach(function (s) { (s.items || []).forEach(function (it) { totalCount++; if (typeOk && itemPass(it)) matchCount++; }); });
    });
    var activeFilters = (_mktType !== "all" ? 1 : 0) + (_mktLegal !== "all" ? 1 : 0) + (_mktAvail !== "all" ? 1 : 0);
    var filterOn = _mktFiltersOpen || activeFilters > 0;
    var filterBtn = el("button.btn.sm", { title: "Show or hide filters" + (activeFilters ? " (" + activeFilters + " active)" : ""),
      style: filterOn ? { color: "var(--accent)", borderColor: "var(--accent)" } : null,
      onclick: function () { _mktFiltersOpen = !_mktFiltersOpen; EN.app.render(); } },
      (_mktFiltersOpen ? "△" : "▽") + " FILTER" + (activeFilters ? " · " + activeFilters : ""));
    var ctrlKids = [
      el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em", minWidth: "64px" }, text: "SEARCH" }),
        searchIn,
        el("span.mono", { style: { fontSize: "11px", color: anyFilter ? "var(--accent)" : "var(--text3)" }, text: anyFilter ? matchCount + " / " + totalCount + " match" : totalCount + " listings" }),
        el("span", { style: { flex: 1 } }),
        anyFilter ? el("button.btn.sm", { title: "Clear search and all filters", style: { color: "var(--danger)", borderColor: "var(--danger)" },
          onclick: function () { _mktQuery = ""; _mktType = "all"; _mktLegal = "all"; _mktAvail = "all"; EN.app.render(); } }, "✕ CLEAR") : null,
        filterBtn,
        el("button.btn.sm", { title: "Expand or collapse every panel",
          onclick: function () { var allOpen = cats.every(function (c) { return _panelOpen[c.key]; }); cats.forEach(function (c) { _panelOpen[c.key] = !allOpen; }); EN.app.render(); } }, "⊟ ALL")
      ])
    ];
    if (_mktFiltersOpen) {
      ctrlKids.push(el("div", { style: { marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)" } }, [
        frow("TYPE", typeBtns), frow("LEGALITY", legalBtns), frow("AVAIL", availBtns)
      ]));
    }
    blocks.push(el("div", { style: { marginBottom: "14px", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "4px", background: "var(--bg2)" } }, ctrlKids));

    /* ---- one collapsible panel per major type ---- */
    var subLabel = function (t) { return el("div", { style: { margin: "10px 0 4px", fontFamily: "var(--disp)", fontSize: "11px", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--text2)" }, text: t }); };
    var collapsibleSubLabel = function (text, key, isOpen, clickable) {
      return el("div", { style: { margin: "10px 0 4px", fontFamily: "var(--disp)", fontSize: "11px", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--text2)", display: "flex", alignItems: "center", gap: "7px", cursor: clickable ? "pointer" : "default" },
        onclick: clickable ? function () { _open[key] = !isOpen; EN.app.render(); } : null }, [
        el("span.collapse-caret", { text: isOpen ? "▾" : "▸" }),
        el("span", { text: text }),
        el("span", { style: { flex: 1, height: "1px", background: "linear-gradient(90deg,var(--border),transparent)" } })
      ]);
    };
    // the quality tier decides price, SP and whether you get an Enhancement at all,
    // so hang the book's own description of each one off its market header
    var tierBlurb = function (t) { return ((EN.cyberware || {}).qualityTiers || {})[t] || ""; };
    var tierLabel = function (t) { var col = { Streetware: "var(--text3)", Brandware: "var(--accent)", Blackware: "var(--danger)", Prototype: "var(--flow)" }[t] || "var(--text3)"; return el("div", { title: tierBlurb(t), style: { margin: "6px 0 3px 12px", fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: ".14em", textTransform: "uppercase", color: col } }, "› " + t); };
    var introP = function (t) { return el("p.help", { style: { margin: "0 0 6px", fontSize: "11.5px" }, text: t }); };
    var TIER_ORDER = ["Streetware", "Brandware", "Blackware", "Prototype"];
    cats.forEach(function (c) {
      if (_mktType !== "all" && _mktType !== c.key) return;
      var open = anyFilter ? true : !!_panelOpen[c.key];
      var subBlocks = [], cMatch = 0, cTotal = 0;
      c.subs.forEach(function (sub) {
        var all = sub.items || [];
        cTotal += all.length;
        var items = anyFilter ? all.filter(itemPass) : all;
        if (!items.length) return;
        cMatch += items.length;
        if (!open) return;
        // every subsection is collapsible (default collapsed); a filter/search forces them open
        var subKey = "mktz-" + c.key + "-" + sub.label;
        var subOpen = anyFilter ? true : !!_open[subKey];
        subBlocks.push(collapsibleSubLabel(sub.label + " · " + items.length, subKey, subOpen, !anyFilter));
        if (!subOpen) return;
        if (sub.intro) subBlocks.push(introP(sub.intro));
        if (sub.byTier) {
          TIER_ORDER.forEach(function (tr) {
            var inTier = items.filter(function (it) { return it.tier === tr; });
            if (!inTier.length) return;
            subBlocks.push(tierLabel(tr));
            inTier.forEach(function (it) { subBlocks.push(itemCard(it, ch, "mkt")); });
          });
        } else {
          items.forEach(function (it) { subBlocks.push(itemCard(it, ch, "mkt")); });
        }
      });
      if (!cTotal) return;                       // category has no stock
      if (anyFilter && cMatch === 0) return;     // nothing matches the active filter
      var shown = anyFilter ? cMatch : cTotal;
      var body = [];
      if (open && c.intro) body.push(introP(c.intro));
      body = body.concat(subBlocks);
      var p = EN.ui.panel(c.title, shown + (shown === 1 ? " LISTING" : " LISTINGS"), body, { corners: true });
      var head = p.querySelector(".panel-h");
      if (head) {
        head.classList.add("clickable");
        if (!anyFilter) head.onclick = function () { _panelOpen[c.key] = !_panelOpen[c.key]; EN.app.render(); };
        var h3 = head.querySelector("h3");
        if (h3) h3.textContent = (open ? "▾ " : "▸ ") + c.title;
      }
      if (!open && p.bodyEl) p.bodyEl.style.display = "none";   // tight collapsed panel (no empty body padding)
      blocks.push(p);
    });
    return blocks;
  }

  /* ---- main render ---- */
  /* ---- Workbench: crafting & modding benches (rules plug in per bench) ---- */
  var BENCHES = [
    { key: "ballistics", label: "Arms Table", icon: "⊚", color: "var(--ember)", tag: "WEAPON CRAFTING & MODDING",
      blurb: "Build, tune, and customize weapons: firearms, blades, bows, and the attachments that ride them.",
      handles: "Ranged Weapons · Melee Weapons · Signature Weapons · Ammunition · weapon mods & attachments" },
    { key: "armor", label: "Impact Table", icon: "⛨", color: "var(--success)", tag: "ARMOR BENCH · CRAFTING & MODDING",
      blurb: "The Armor Bench. Fit plates, slot Armor Mods, reinforce shells, and keep defensive gear in the fight.",
      handles: "Light / Medium / Heavy Armor · Powered Exoframes · Mystech shells · Shields & Foci · Armor Mods" },
    { key: "tech", label: "Tech Bay", icon: "⌬", color: "var(--flow)", tag: "SMARTDECK & CYBERWARE MODS",
      blurb: "Integrate hardware: slot mods into Smartdecks and platform chrome. This is the only bench that installs Smartdeck mods.",
      handles: "Smartdeck Hardware Mods · Cyberware Platform Mods" },
    { key: "fab", label: "Fabrication", icon: "⚒", color: "var(--accent)", tag: "FABRICATION · CRAFTING & PROJECTS",
      blurb: "Build, repair, and modify gear as downtime Projects. Recipes, material costs, and live Engineering and Systems checks.",
      handles: "Build from scratch · Repairs · Custom mods · Material costs · Engineering / Systems Projects" },
    { key: "garage", label: "Garage", icon: "⛭", color: "var(--gold)", tag: "VEHICLE CRAFTING & MODDING",
      blurb: "Wrench on rides: engines, plating, and weapon mounts for everything from a courier bike to a mech.",
      handles: "Ground / Aerial / Marine Vehicles · Industrial / Mechs · vehicle upgrades & mounts" }
  ];
  /* ============================ BALLISTICS BENCH ============================
     Weapon Customization: install Parts (Mods + Accessories) into a weapon's
     five slots, capped by Slot Count, gated by Fits, with legality aggregated to
     the strictest tag. Loadout persists on ch.weaponParts[weaponName]. */
  var WP = function () { return EN.weaponParts || {}; };
  function isBowGroup(g) { return g === "Bowfire"; }
  function isMeleeGroup(g) { return g === "Simple" || g === "Martial"; }
  function isFirearmGroup(g) { return ["Sidearm", "Longarm", "Heavy", "Launcher"].indexOf(g) !== -1; }
  function weaponCategory(it) { return it.signature ? "signature" : isBowGroup(it.group) ? "bowfire" : isMeleeGroup(it.group) ? "melee" : "ranged"; }
  /* EVERY owned weapon entry, not one per name. It used to dedupe on it.name, so a
     character holding three Quarterstaffs saw one bench chip and necessarily one loadout.
     Brandon's ruling of 2026-08-12: "same-named weapons should be independently moddable",
     so the bench addresses PIECES. Each row carries the entry, its catalog item and its
     entryKey, plus a label that only grows a number when a name actually repeats, so the
     ordinary one-of-each case reads exactly as it always did. */
  function ownedWeapons(ch) {
    var rows = (ch.equipment || []).filter(function (e) { return e && e.qty > 0; })
      .map(function (e) { var it = findItem(e.name); return it && isWeapon(it) ? { e: e, it: it, key: ENG().entryKey(e) } : null; })
      .filter(Boolean);
    var total = {};
    rows.forEach(function (r) { total[r.it.name] = (total[r.it.name] || 0) + 1; });
    var seen = {};
    rows.forEach(function (r) {
      if (total[r.it.name] > 1) { seen[r.it.name] = (seen[r.it.name] || 0) + 1; r.label = r.it.name + " " + seen[r.it.name]; }
      else r.label = r.it.name;
    });
    return rows;
  }
  // keyed on the equipment ENTRY, so two copies of one weapon hold two builds
  function weaponLoadout(ch, key) {
    var wp = (ch.weaponParts || {})[key] || {};
    return { _profile: wp._profile || "auto", targeting: wp.targeting || null, output: wp.output || null,
             core: wp.core || null, handling: wp.handling || null, utility: (wp.utility || []).slice() };
  }
  function setLoadout(key, mut) {
    store.update(function (c) {
      c.weaponParts = c.weaponParts || {};
      var wp = c.weaponParts[key] || { _profile: "auto", targeting: null, output: null, core: null, handling: null, utility: [] };
      mut(wp);
      c.weaponParts[key] = wp;
    });
  }
  function slotCountFor(it, lo) {
    if (it.signature) return 0;
    var prof = (WP().profiles || []).find(function (p) { return p.key === lo._profile; });
    if (prof && prof.count != null) return prof.count;
    // an entry may state its own Slot Count (a Revolver is a Sidearm that
    // carries 2, per the Slot Count by Profile table)
    if (typeof it.slots === "number") return it.slots;
    var byG = WP().slotCountByGroup || {};
    return byG[it.group] != null ? byG[it.group] : 4;
  }
  function partFits(part, it) {
    var g = it.group, traits = it.traits || [], name = (it.name || "").toLowerCase(), dmg = (it.damage || "").toLowerCase();
    function hasTrait(t) { return traits.some(function (x) { return x.toLowerCase().indexOf(t.toLowerCase()) !== -1; }); }
    switch (part.fits) {
      case "Any": return true;
      case "Any Melee": return isMeleeGroup(g);
      case "Any Ranged": return isFirearmGroup(g) || isBowGroup(g);
      case "Any Firearm": return isFirearmGroup(g);
      case "Any bow": return isBowGroup(g);
      case "Blades": return isMeleeGroup(g) && (/slashing|piercing/.test(dmg) || hasTrait("Blade"));
      // "Fits: a HARD frame gate." Long-Shafted arrived as a frame on 2026-08-12 and gates
      // exactly one Part, the Extended Shaft. Asked of the engine rather than answered here,
      // because the reach talent asks the same question and two answers would drift.
      case "Long-Shafted": return isMeleeGroup(g) && !!(EN.engine.isLongShafted && EN.engine.isLongShafted(it));
      // Two-Handed Melee arrived as a frame on 2026-08-19 with three Parts. The book names
      // Greatsword, Halberd and Maul as examples, so this asks for the TRAIT they share
      // rather than those three names, and a future two-handed weapon fits without an edit.
      case "Two-Handed Melee": return isMeleeGroup(g) && hasTrait("Two-Handed");
      case "Shotgun": return /shotgun/.test(name) || hasTrait("Spread");
      case "Longarm": return g === "Longarm" || g === "Heavy";
      case "Sidearm": return g === "Sidearm";
      case "Semi-Auto Firearm": return isFirearmGroup(g) && hasTrait("Semi-Auto");
      case "Compound": return isBowGroup(g) && /compound/.test(name);
      case "Crossbow": return isBowGroup(g) && /crossbow/.test(name);
      default: return false;
    }
  }
  function allInstalledKeys(lo) {
    return ["targeting", "output", "core", "handling"].map(function (s) { return lo[s]; }).filter(Boolean).concat(lo.utility || []);
  }
  function installedCount(lo) { return allInstalledKeys(lo).length; }
  function aggregateLegality(it, lo) {
    var order = WP().legalityOrder || ["Legal", "Licensed", "Restricted", "Contraband"];
    var worst = it.legality || "Legal";
    allInstalledKeys(lo).forEach(function (k) { var p = WP().byKey[k]; if (p && order.indexOf(p.legality) > order.indexOf(worst)) worst = p.legality; });
    return worst;
  }
  // (legality chip colors reuse the module-level LEGAL_COLOR defined near the top;
  //  rarity chips reuse AVAIL_COLOR, which covers the Mystech tiers too)
  // local chip for the bench slot cards: mixed-case, no extra margin (parent rows own the gap).
  // named distinctly so it does NOT hoist over the header/Chrome tagChip() at the top of the module.
  function partChip(text, color) { return el("span.chip", { style: { fontSize: "9px", color: color, borderColor: color } }, text); }
  function fittingParts(it, slotKey) { return (WP().parts || []).filter(function (p) { return p.slot === slotKey && partFits(p, it); }); }
  // Parts as buyable / ownable inventory items so they sell in the gray market and
  // live in the stash. `partSlot` (not `slot`) so the card does not draw a body-slot chip.
  function partAsItem(p) {
    return { name: p.name, price: p.price, legality: p.legality, availability: p.rarity, desc: p.effect,
             benchPart: true, partKey: p.key, partType: p.partType, partSlot: p.slot, fits: p.fits, grants: p.grants, partCategory: p.category };
  }
  function partItems() { return (WP().parts || []).map(partAsItem); }
  /* How many of a named thing you own, counted across EVERY row that carries the name.
     It used to `.find` the first row and report that row's qty, which is only right when
     one name means one row. It does not: installable components (weapon Parts, armor Mods,
     vehicle Mods) are non-stackable HERE, so addToStash mints a fresh id-bearing row of
     qty 1 for each one bought. Buy two Extended Shafts and you own two rows of 1; this
     reported 1. Since availablePartQty is owned-minus-installed, installing the first took
     the count to 0 and the SECOND COPY BECAME PERMANENTLY UNINSTALLABLE: absent from the
     picker, refused by tryInstall, and still sitting in the Stash. Reproduced through the
     real gray market at 𝒢180 a copy before this was changed.
     One function, three mechanics: availablePartQty, availableArmorModQty and
     availableVehicleModQty all read it, so all three were wrong the same way.
     Number() because a hand-edited or imported qty can be a numeric STRING, and `0 + "3"`
     is "03", which then compares as a string against the install count. */
  function ownedQtyOf(ch, name) {
    return (ch.equipment || []).reduce(function (n, x) {
      if (!x || x.name !== name) return n;
      var q = Number(x.qty);
      return n + (isFinite(q) && q > 0 ? q : 0);
    }, 0);
  }
  function installedPartCount(ch, partKey) {
    var n = 0, wp = ch.weaponParts || {};
    Object.keys(wp).forEach(function (wn) {
      var lo = wp[wn];
      ["targeting", "output", "core", "handling"].forEach(function (s) { if (lo[s] === partKey) n++; });
      (lo.utility || []).forEach(function (k) { if (k === partKey) n++; });
    });
    return n;
  }
  function availablePartQty(ch, p) { return ownedQtyOf(ch, p.name) - installedPartCount(ch, p.key); }

  /* ============================ IMPACT TABLE (armor) ========================
     Armor Mods for Modular armor. Generic slots (no slot type); every mod is
     bench work. Loadout persists on ch.armorMods[armorName] as a flat key list. */
  var AM = function () { return EN.armorMods || {}; };
  function armorModFits(mod, armor) {
    var traits = armor.traits || [], g = armor.group || "";
    function has(t) { return traits.indexOf(t) !== -1; }
    switch (mod.fits) {
      case "Any": return true;
      case "Plated": return has("Plated");
      case "Sealed": return has("Sealed");
      case "Powered": return has("Powered") || g === "Powered Exoframe";
      case "Mystech": return has("Mystech") || g === "Mystech Armor";
      case "Loud or Powered": return has("Loud") || has("Powered") || g === "Powered Exoframe";
      case "Bulky, non-Powered": return has("Bulky") && !(has("Powered") || g === "Powered Exoframe");
      default: return true;
    }
  }
  /* One row per owned PIECE, disambiguated only when a name repeats. Three benches need
     the identical shape (weapons, armor, vehicles), so the numbering lives here once
     rather than three times. `pred` picks the catalog items this bench cares about. */
  function ownedPieces(ch, pred) {
    var rows = (ch.equipment || []).filter(function (e) { return e && e.qty > 0; })
      .map(function (e) { var it = findItem(e.name); return it && pred(it) ? { e: e, it: it, key: ENG().entryKey(e) } : null; })
      .filter(Boolean);
    var total = {};
    rows.forEach(function (r) { total[r.it.name] = (total[r.it.name] || 0) + 1; });
    var seen = {};
    rows.forEach(function (r) {
      if (total[r.it.name] > 1) { seen[r.it.name] = (seen[r.it.name] || 0) + 1; r.label = r.it.name + " " + seen[r.it.name]; }
      else r.label = r.it.name;
    });
    return rows;
  }
  function isModularArmor(armor) { return (armor.traits || []).indexOf("Modular") !== -1 || (armor.slots || 0) > 0; }
  function armorSlotCount(armor) { return armor.slots || 0; }
  function ownedArmor(ch) { return ownedPieces(ch, isDefensive); }
  // keyed on the equipment ENTRY, so a spare suit of the same name holds its own build
  function armorLoadout(ch, key) { return ((ch.armorMods || {})[key] || []).slice(); }
  function setArmorMods(key, fn) {
    store.update(function (c) { c.armorMods = c.armorMods || {}; c.armorMods[key] = fn((c.armorMods[key] || []).slice()); });
  }
  function installedArmorModCount(ch, modKey) {
    var n = 0, am = ch.armorMods || {};
    Object.keys(am).forEach(function (an) { (am[an] || []).forEach(function (k) { if (k === modKey) n++; }); });
    return n;
  }
  function availableArmorModQty(ch, m) { return ownedQtyOf(ch, m.name) - installedArmorModCount(ch, m.key); }
  function armorModAsItem(m) {
    return { name: m.name, price: m.price, legality: m.legality, availability: m.rarity, desc: m.effect,
             armorMod: true, modKey: m.key, fits: m.fits, grants: m.grants, modCategory: m.category,
             nexus: m.nexus, upkeep: m.upkeep, buyout: m.buyout, vendor: m.vendor };
  }
  function armorModItems() { return (AM().mods || []).map(armorModAsItem); }

  /* ---- vehicles in the market -----------------------------------------
     Each profile lists twice: outright at list price, and on a corporate
     lease. The book gives a vehicle lease no buy-in and makes the list
     price its Buyout, so the lease entry is price 0 with buyout set. */
  function VEH() { return (EN.vehicles && EN.vehicles.profiles) || []; }
  function vehicleDesc(v) {
    // A stock loadout is a weapon the profile comes armed with, costing neither a Mod Slot
    // nor a Hardpoint Mount, so it belongs on the line the owner actually reads.
    return v.category + ", Tier " + v.tier + ". " + v.modSlots + " Mod Slots (1 + Tier). Weekly upkeep " + fmtG(v.upkeep) + ": " + fmtG(v.fuel) + " Fuel and Routine plus " + fmtG(v.reserve) + " Repair Reserve."
      + (v.loadout ? " Stock loadout: " + v.loadout + "." : "");
  }
  function vehicleAsItem(v) {
    return { name: v.name, kind: "vehicle", group: "Vehicle", price: v.listPrice,
             availability: v.availability, legality: v.legality, vehicle: true,
             desc: vehicleDesc(v) + " List price is twenty weeks of upkeep.",
             effect: "Owned outright. You still owe weekly upkeep of " + fmtG(v.upkeep) + " per week of active use." };
  }
  function vehicleLeaseAsItem(v) {
    return { name: v.name + " (Lease)", kind: "vehicle", group: "Vehicle Lease", price: 0,
             upkeep: v.upkeep, buyout: v.listPrice,
             availability: v.availability, legality: v.legality, vehicle: true,
             desc: vehicleDesc(v) + " A corporate fleet lease: no buy-in, and the list price is the Buyout.",
             effect: "Runs the Leased trait. Lapsed or Locked is a dead ignition: the engine will not turn over, installed mods sit inert, and the doors open for whoever holds the note. Miss a payment and the repo arrives as people, not paperwork." };
  }
  function vehicleItems() { return VEH().map(vehicleAsItem).concat(VEH().map(vehicleLeaseAsItem)); }
  function VMODS() { return (EN.vehicles && EN.vehicles.mods) || []; }
  function vehicleModAsItem(m) {
    return { name: m.name, kind: "vehiclemod", group: "Vehicle Mod", vehicleMod: true, modKey: m.key,
             price: m.price == null ? 0 : m.price, vendor: m.price != null,
             availability: m.availability, legality: m.legality, fits: m.fits,
             desc: "Fits " + m.fits + ". Bench work: downtime, a garage, and Engineering Tools."
                   + (m.priceNote ? " Price: " + m.priceNote + "." : ""),
             effect: m.effect };
  }
  function vehicleModItems() { return VMODS().map(vehicleModAsItem); }
  function aggregateArmorLegality(armor, lo) {
    var order = ["Legal", "Licensed", "Restricted", "Contraband"];
    var worst = armor.legality || "Legal";
    (lo || []).forEach(function (k) { var m = AM().byKey[k]; if (m && order.indexOf(m.legality) > order.indexOf(worst)) worst = m.legality; });
    return worst;
  }
  function tryInstallArmorMod(armor, aKey, lo, key) {
    var mod = AM().byKey[key]; if (!mod) return;
    if (availableArmorModQty(store.active(), mod) <= 0) { toast("You do not own a free " + mod.name + ". Buy it in the gray market first."); return; }
    if (lo.indexOf(key) !== -1) { toast(mod.name + " is already fitted to this suit."); return; }
    if (lo.length >= armorSlotCount(armor)) { toast("No open Mod Slots. Only Modular armor carries slots, up to its listed count."); return; }
    setArmorMods(aKey, function (l) { l.push(key); return l; });
    toast(mod.name + " worked into " + armor.name + " (bench work: a rest with a kit).");
  }
  function removeArmorMod(aKey, key) { setArmorMods(aKey, function (l) { return l.filter(function (k) { return k !== key; }); }); }

  /* ---- vehicle mods ---------------------------------------------------
     Slots are generic (1 + Tier), so this follows the armor-mod bench
     rather than the slot-typed Arms Table. A leased vehicle is stashed as
     "<Name> (Lease)", so the profile is resolved from the base name. */
  function vehicleProfileOf(itemName) {
    var base = String(itemName || "").replace(/\s*\(Lease\)$/, "");
    return (EN.vehicles && EN.vehicles.byName && EN.vehicles.byName[base]) || null;
  }
  function ownedVehicles(ch) { return ownedPieces(ch, function (it) { return !!it.vehicle; }); }
  function vehicleLoadout(ch, key) { return ((ch.vehicleMods || {})[key] || []).slice(); }
  function setVehicleMods(key, fn) {
    store.update(function (c) { c.vehicleMods = c.vehicleMods || {}; c.vehicleMods[key] = fn((c.vehicleMods[key] || []).slice()); });
  }
  function installedVehicleModCount(ch, key) {
    var t = 0, vm = ch.vehicleMods || {};
    Object.keys(vm).forEach(function (vn) { (vm[vn] || []).forEach(function (k) { if (k === key) t++; }); });
    return t;
  }
  function availableVehicleModQty(ch, m) { return ownedQtyOf(ch, m.name) - installedVehicleModCount(ch, m.key); }
  function aggregateVehicleLegality(prof, lo) {
    var order = ["Legal", "Licensed", "Restricted", "Contraband"];
    var worst = (prof && prof.legality) || "Legal";
    (lo || []).forEach(function (k) {
      var m = EN.vehicles.byKey[k];
      if (m && order.indexOf(m.legality) > order.indexOf(worst)) worst = m.legality;
    });
    return worst;
  }
  function tryInstallVehicleMod(vItem, vKey, prof, lo, key) {
    var mod = EN.vehicles.byKey[key]; if (!mod || !prof) return;
    if (availableVehicleModQty(store.active(), mod) <= 0) { toast("You do not own a free " + mod.name + ". Buy it in the gray market first."); return; }
    if (lo.indexOf(key) !== -1) { toast(mod.name + " is already fitted to this vehicle."); return; }
    if (!EN.vehicles.modFits(mod, prof)) { toast(mod.name + " fits " + mod.fits + "; the " + prof.name + " is " + prof.category + "."); return; }
    if (lo.length >= prof.modSlots) { toast("No open Mod Slots. A " + prof.name + " carries " + prof.modSlots + " (1 + Tier " + prof.tier + ")."); return; }
    setVehicleMods(vKey, function (l) { l.push(key); return l; });
    toast(mod.name + " fitted to " + vItem.name + " (bench work: downtime, a garage, and Engineering Tools).");
  }
  function removeVehicleMod(vKey, key) { setVehicleMods(vKey, function (l) { return l.filter(function (k) { return k !== key; }); }); }
  function tryInstall(it, wKey, lo, slotKey, key) {
    var part = WP().byKey[key]; if (!part) return;
    // The frame gate, checked by the WRITER and not only by the picker that feeds it.
    // Unreachable through the dropdown, which only ever offers fitting Parts, and that is
    // exactly why it belongs here: "Fits" is a hard gate and the only thing enforcing it
    // was a filter on a list. The vehicle bench already guards its own install this way
    // (see installVehicleMod). Cheap, and it keeps the rule in the same place as the rule.
    if (!partFits(part, it)) { toast(part.name + " fits " + part.fits + "; the " + it.name + " is not."); return; }
    if (availablePartQty(store.active(), part) <= 0) { toast("You do not own a free " + part.name + ". Buy it in the gray market first."); return; }
    if (installedCount(lo) >= slotCountFor(it, lo)) { toast("Slot Count is full. Over-Engineering past it makes this a Prototype-tier Project with a Mandatory Flaw; track it as a Project."); return; }
    var installed = allInstalledKeys(lo);
    var conflictKey = installed.find(function (k) { var ip = WP().byKey[k]; return (part.excludes || []).indexOf(k) !== -1 || (ip && (ip.excludes || []).indexOf(key) !== -1); });
    if (conflictKey) { toast(part.name + " cannot share a build with " + (WP().byKey[conflictKey] || {}).name + "."); return; }
    setLoadout(wKey, function (wp) {
      if (slotKey === "utility") { wp.utility = wp.utility || []; if (wp.utility.length < 2) wp.utility.push(key); }
      else wp[slotKey] = key;
    });
    toast(part.name + (part.partType === "Mod" ? " worked in (Mod: needs a rest + kit)" : " snapped on") + " · " + it.name);
  }
  function removePart(wKey, slotKey, key) {
    setLoadout(wKey, function (wp) {
      if (slotKey === "utility") wp.utility = (wp.utility || []).filter(function (k) { return k !== key; });
      else wp[slotKey] = null;
    });
  }
  function slotCard(ch, it, wKey, lo, sd) {
    var slotKey = sd.key;
    var installed = slotKey === "utility" ? (lo.utility || []) : (lo[slotKey] ? [lo[slotKey]] : []);
    var cat = weaponCategory(it);
    var subLabel = cat === "melee" ? sd.melee : cat === "bowfire" ? sd.bow : sd.firearm;
    var kids = [el("div.row.between.wrap", { style: { alignItems: "baseline", marginBottom: "4px" } }, [
      el("span", { style: { fontFamily: "var(--disp)", fontSize: "10px", letterSpacing: ".12em", color: "var(--text3)" }, text: sd.name.toUpperCase() + (sd.capacity ? " · holds " + sd.capacity : "") }),
      el("span.help", { style: { margin: 0, fontSize: "10px" }, text: subLabel })
    ])];
    if (subLabel === "N/A") { kids.push(el("p.help", { style: { margin: 0, fontSize: "11px" }, text: "Not applicable to this weapon." })); return el("div", { style: { padding: "8px 10px", border: "1px solid var(--border2)", borderRadius: "4px", background: "rgba(0,0,0,.12)", opacity: .55 } }, kids); }
    installed.forEach(function (key) {
      var p = WP().byKey[key]; if (!p) return;
      kids.push(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", padding: "5px 0", borderTop: "1px solid rgba(35,48,68,.4)" } }, [
        el("div", { style: { flex: "1 1 160px", minWidth: 0 } }, [
          el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
            el("span", { style: { fontWeight: 600, fontSize: "12.5px" }, text: p.name }),
            partChip(p.partType, p.partType === "Mod" ? "var(--ember)" : "var(--text2)"),
            partChip(p.legality, LEGAL_COLOR[p.legality]), partChip(p.rarity, AVAIL_COLOR[p.rarity] || "var(--text3)")
          ]),
          el("p.help", { style: { margin: "2px 0 0", fontSize: "11px" }, text: p.grants })
        ]),
        el("button.btn.sm", { title: "Remove " + p.name, style: { color: "var(--text3)" }, onclick: function () { removePart(wKey, slotKey, key); } }, "✕")
      ]));
    });
    var full = slotKey === "utility" ? installed.length >= 2 : installed.length >= 1;
    var capReached = installedCount(lo) >= slotCountFor(it, lo);
    var fitting = fittingParts(it, slotKey).filter(function (p) { return installed.indexOf(p.key) === -1; });
    var ownedOpts = fitting.filter(function (p) { return availablePartQty(ch, p) > 0; });
    if (full) {
      kids.push(el("p.help", { style: { margin: "5px 0 0", fontSize: "10.5px", color: "var(--text4)" }, text: slotKey === "utility" ? "Both Utility Parts fitted." : "Slot filled." }));
    } else if (capReached) {
      kids.push(el("p.help", { style: { margin: "5px 0 0", fontSize: "10.5px", color: "var(--warn)" }, text: "Slot Count full; remove a Part or Over-Engineer (Prototype Project)." }));
    } else if (ownedOpts.length) {
      kids.push(el("select", { style: { marginTop: "5px", fontSize: "11px", width: "auto", maxWidth: "100%" }, onchange: function (e) { var k = e.target.value; e.target.value = ""; if (k) tryInstall(it, wKey, lo, slotKey, k); } },
        [el("option", { value: "", text: "+ install from stash" })].concat(ownedOpts.map(function (p) {
          var av = availablePartQty(ch, p);
          return el("option", { value: p.key, text: p.name + " · " + p.partType + (av > 1 ? " ×" + av : "") });
        }))));
    } else if (fitting.length) {
      kids.push(el("p.help", { style: { margin: "5px 0 0", fontSize: "10.5px", color: "var(--text3)" }, text: "You own no Parts for this slot. Buy Mods & Accessories in the gray market." }));
    } else {
      kids.push(el("p.help", { style: { margin: "5px 0 0", fontSize: "10.5px", color: "var(--text4)" }, text: "No Parts fit this weapon's " + sd.name + " slot." }));
    }
    /* Owned but does not fit THIS frame. Worth a line of its own since Long-Shafted
       arrived: before it, "Fits" for melee was Any Melee or Blades, so owning a Handling
       Part and standing at a Longsword meant it went on. Now a player can own two Extended
       Shafts, see "You own no Parts for this slot", and have no way to learn that the mod
       is shaft-only. The Garage says exactly this for a chassis mismatch; the same sentence
       belongs here. Listed whatever the slot's state, because a full slot does not explain
       a misfit either. */
    var misfit = (WP().parts || []).filter(function (p) {
      return p.slot === slotKey && !partFits(p, it) && ownedQtyOf(ch, p.name) > 0;
    });
    if (misfit.length) {
      kids.push(el("p.help", { style: { margin: "4px 0 0", fontSize: "10.5px", color: "var(--warn)" },
        text: "Owned but will not fit a " + it.name + ": "
            + misfit.map(function (p) { return p.name + " (fits " + p.fits + ")"; }).join(", ") + "." }));
    }
    return el("div", { style: { padding: "8px 10px", border: "1px solid var(--border2)", borderRadius: "4px", background: "rgba(0,0,0,.12)" } }, kids);
  }
  function ballisticsBench(ch) {
    var out = [];
    var weapons = ownedWeapons(ch);
    if (!weapons.length) {
      out.push(el("div.muted-box", { style: { padding: "28px 20px", textAlign: "center", borderColor: "var(--ember)" },
        html: "<div style='font-family:var(--disp);font-size:13px;letter-spacing:.18em;color:var(--ember)'>⊚ NO WEAPONS ON THE BENCH</div><div style='font-size:12px;color:var(--text3);margin-top:8px'>Acquire a weapon in the gray market or your stash, then bring it here to customize.</div>" }));
      return out;
    }
    // _benchWeapon holds an entry KEY, so selecting "the second Quarterstaff" is a thing
    // the bench can express. A stale key (the piece was sold) falls back to the first row.
    if (!_benchWeapon || !weapons.some(function (w) { return w.key === _benchWeapon; })) _benchWeapon = weapons[0].key;
    out.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "10px", alignItems: "center" } },
      [el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "4px" }, text: "ON THE BENCH" })].concat(
        weapons.map(function (w) {
          var on = _benchWeapon === w.key;
          return el("button.btn.sm" + (on ? ".primary" : ""), { onclick: (function (k) { return function () { _benchWeapon = k; EN.app.render(); }; })(w.key) }, w.label);
        }))));
    var row = weapons.find(function (w) { return w.key === _benchWeapon; }) || weapons[0];
    var it = row.it, wKey = row.key;
    var lo = weaponLoadout(ch, wKey);

    if (it.signature) {
      out.push(EN.ui.panel(row.label, it.group.toUpperCase() + " · SIGNATURE", [
        el("p.help", { style: { margin: 0 }, text: "Signature weapon: 0 customization slots. It arrives complete, with fixed Parts and a built-in property you cannot replicate with bolt-ons. Its power lives in the wielder, not the rails." })
      ], { corners: true }));
      return out;
    }

    var count = installedCount(lo), max = slotCountFor(it, lo), legal = aggregateLegality(it, lo);
    var profSel = el("select", { style: { fontSize: "11px", width: "auto" }, onchange: function (e) { var v = e.target.value; setLoadout(wKey, function (wp) { wp._profile = v; }); } },
      (WP().profiles || []).map(function (p) { return el("option", { value: p.key, selected: lo._profile === p.key, text: p.name + (p.count != null ? " (" + p.count + ")" : "") }); }));
    var header = el("div.row.between.wrap", { style: { gap: "10px", alignItems: "center", marginBottom: "10px" } }, [
      el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "18px", color: count > max ? "var(--danger)" : "var(--ember)" }, html: count + " <span style='font-size:12px;color:var(--text3)'>/ " + max + " slots</span>" }),
        partChip(legal, LEGAL_COLOR[legal]),
        el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: legal === (it.legality || "Legal") ? "as a scanner reads it" : "scanner reads it as " + legal + " (was " + (it.legality || "Legal") + ")" })
      ]),
      el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [el("span.help", { style: { margin: 0, fontSize: "10px" }, text: "PROFILE" }), profSel])
    ]);
    var grid = el("div.grid2", { style: { gap: "10px" } }, (WP().slots || []).map(function (sd) { return slotCard(ch, it, wKey, lo, sd); }));
    out.push(EN.ui.panel(row.label, it.group.toUpperCase() + " · " + (it.damage || ""), [
      el("p.help", { style: { margin: "0 0 8px", fontSize: "11.5px" }, text: "One Part per slot (Utility holds two). Accessories snap on anytime; Mods are bench work on a rest with a kit. The strictest legality on the build is what a scanner reports." }),
      header, grid,
      el("p.help", { style: { margin: "10px 0 0", fontSize: "10.5px", color: "var(--text3)" }, text: WP().rules ? WP().rules.dieStep + " " + WP().rules.stabilized : "" })
    ], { corners: true }));
    return out;
  }

  /* ============================ ARMOR INTEGRITY ============================
     Armor Repair, the rule behind the four features that said "until repaired
     during Downtime" and had nothing behind them. A suit's catalog DR is its BASE
     and its ceiling; ch.armorWear says how much of it is currently gone, keyed on
     the equipment ENTRY, so this panel lists PIECES and not item types: two Kevlar
     Weaves are two rows with two independent tracks.

     Two lanes, both priced per point restored off the suit's LISTED price (its
     Buyout when it is leased, per CRAFT().listPrice), both read out of
     EN.crafting.armorRepair so the numbers live in the rules data:

       SHOP    10 percent per point, one Downtime period, no roll. Pays on the spot.
       BENCH    5 percent per point in parts, opened as a Simple Project using
                Engineering on the Fabrication bench, where it rolls, salvages and
                completes like any other Project. A Portable Fabrication Rig prints
                the plate from stock, so its parts cost is 0.

     Per POINT means per point: each piece carries a points picker, so a Freelancer
     with three points gone and 200 Glimmer can buy one back. Both lanes price the
     number that is picked.

     There is NO crafter gate on either lane, and that is deliberate rather than an
     omission. The Project tier's `skillTier` is advisory everywhere else in this app
     (Blueprints, custom Projects, the rebuild below), and an untrained crafter pays
     for it in the roll at +2 Snag per Work Interval. A gate here and nowhere else
     was worse than no gate at all, because it closed the cheap lane and left the
     expensive one open. See the note where meetsTier used to live in crafting.js.

     A suit at 0 DR is not repairable at all: the button routes to an ordinary
     Project at the item's own tier and full parts cost, exactly the Project the
     Blueprints panel would open for it. */
  function armorRepairRules() { return (CRAFT().armorRepair) || {}; }
  // How many points this piece is currently set to buy back: the player's pick,
  // clamped live to what the suit has actually lost, defaulting to all of it.
  function armorPtsFor(st) {
    var want = _armorPts[st.key];
    if (typeof want !== "number" || !(want > 0)) want = st.lost;
    return Math.max(1, Math.min(Math.floor(want), st.lost));
  }
  function setArmorPts(st, n) {
    _armorPts[st.key] = Math.max(1, Math.min(n, st.lost));
    EN.app.render();
  }
  // The character's live tier in a craft skill, asked of the engine rather than of
  // ch.proficiencies, so trained-by-feature floors count the way they do everywhere.
  function craftSkillTier(ch, skillName) {
    var key = EN.engine.skillKeyOf ? EN.engine.skillKeyOf(skillName) : null;
    return key && EN.engine.effectiveSkillTier ? EN.engine.effectiveSkillTier(ch, key) : "untrained";
  }
  function ownsFabRig(ch) {
    var nm = armorRepairRules().freeParts;
    return !!nm && (ch.equipment || []).some(function (e) { return e && e.name === nm && (e.qty == null || e.qty > 0); });
  }
  // Damage and its undo both go through the engine's one writer, so the bench and
  // the Defenses row clamp the same way and spend the quality edge the same way.
  function markArmorDR(st, delta) {
    var res = null;
    store.update(function (c) { res = EN.engine.applyArmorDamage(c, st.key, delta); });
    if (res && res.absorbed) toast(st.name + ": the freshly seated plate absorbs the hit. No DR lost.");
    else if (res && delta > 0 && res.breached) toast(st.name + " is breached at 0 DR; rebuilding it is a full Project.");
    EN.app.render();
  }
  // The shop lane: no roll, one Downtime period, Glimmer off the top. Restoring is
  // always toward the base and never past it, because the points paid for are
  // clamped to what the piece has actually lost.
  //
  // The debit and the restore happen inside ONE store.update, against state re-read
  // live in that same tick, and the count that is charged for is the count that is
  // restored. That is the whole point: the two cannot be separated by any ordering,
  // so no sequence of clicks, no stale render and no double-fire can take Glimmer
  // for DR it did not give back. It used to price and check the purse off the `st`
  // captured when the row was rendered and then apply the delta to whatever the
  // character looked like later. The lease ledger already guards its own writes this
  // way ("re-check live: a double-fire cannot double-charge"); this is that.
  function armorShopRepair(st, points) {
    var AR = armorRepairRules();
    var done = null, short = null;
    store.update(function (c) {
      var live = EN.engine.armorState(c, st.key);
      var pts = Math.max(0, Math.min(Math.floor(points || 0), live.lost));
      if (!pts) return;                                     // nothing left to buy back: charge nothing
      var cost = AR.shopCost(live.item, pts);
      if (cost > (c.glimmer || 0)) { short = cost; return; }
      var res = EN.engine.applyArmorDamage(c, st.key, -pts);  // the one writer; it is what stops DR passing the base
      var restored = live.lost - res.lost;                    // what the writer actually gave back
      if (restored <= 0) return;                              // it gave nothing, so it takes nothing
      c.glimmer = (c.glimmer || 0) - AR.shopCost(live.item, restored);
      done = { pts: restored, cost: AR.shopCost(live.item, restored), current: res.current, base: res.base, name: live.name };
    });
    if (short != null) { toast("Not enough Glimmer for the shop repair (" + fmtG(short) + ")."); return; }
    if (!done) { toast(st.name + " has no DR to buy back."); EN.app.render(); return; }
    delete _armorPts[st.key];   // the pick was spent; the row re-defaults to whatever is still gone
    toast(done.name + " repaired to " + done.current + " of " + done.base + " DR for " + fmtG(done.cost) + ". " + AR.shopTime + ".");
    EN.app.render();
  }
  // The bench lane: hand the work to the Projects system and get out of the way.
  // The Project carries which piece it repairs and how many points it buys back,
  // and tbComplete applies them.
  function armorBenchProject(ch, st, points) {
    var AR = armorRepairRules();
    var pts = Math.max(0, Math.min(points, st.lost));
    if (!pts) return;
    tbStart({
      kind: "repair",
      name: "Repair " + st.name + " (+" + pts + " DR)",
      itemName: st.name,
      skill: AR.benchSkill || "Engineering",
      tier: AR.benchTier || "simple",
      materialCost: ownsFabRig(ch) ? 0 : AR.benchCost(st.item, pts),
      addOnComplete: false,
      repairKey: st.key,
      repairPoints: pts
    });
    delete _armorPts[st.key];
    _bench = "fab";   // the Project is live on the Fabrication bench; land the player on it
    EN.app.render();
  }
  // A breached suit is a rebuild, not a repair: the ordinary Project the Blueprints
  // panel would open for this item, at full parts cost, restoring the whole base.
  // Parts are half the LISTED price, so a leased suit rebuilds off its Buyout and
  // not off the deposit it takes to walk out wearing one.
  function armorRebuildProject(st) {
    var it = st.item || {};
    tbStart({
      kind: "repair",
      name: "Rebuild " + st.name,
      itemName: st.name,
      skill: CRAFT().skillForItem(it),
      // The book names this tier outright ("Rebuilding it is a Standard Project"), so it
      // does not float with the suit's availability the way a Blueprint's does.
      tier: armorRepairRules().rebuildTier || "standard",
      materialCost: armorRepairRules().rebuildCost(it),
      addOnComplete: false,
      repairKey: st.key,
      repairPoints: st.base
    });
    _bench = "fab";   // the Project is live on the Fabrication bench; land the player on it
    EN.app.render();
  }
  function armorIntegrityPanel(ch) {
    var AR = armorRepairRules();
    var pieces = (EN.engine.ownedArmorPieces ? EN.engine.ownedArmorPieces(ch) : []).filter(function (p) { return p.base > 0; });
    var engTier = craftSkillTier(ch, AR.benchSkill || "Engineering");
    var benchTierName = CRAFT().tier(AR.benchTier || "simple").name;
    var needTier = CRAFT().tier(AR.benchTier || "simple").skillTier || "proficient";
    var needName = (((EN.rules || {}).profTiers || {})[needTier] || {}).name || needTier;
    // Advisory, exactly as it is on every other Project: an untrained crafter may open
    // the work and pays the ordinary untrained price for it, +2 Snag per Work Interval.
    var engUntrained = engTier === "untrained";
    var hasRig = ownsFabRig(ch);
    /* The advisory has to appear on BOTH lanes this panel opens, and it used to appear
       on only the cheap one. The whole justification for leaving the tier expectation
       advisory is that it is communicated and paid for rather than enforced, and the
       communication was landing on the 𝒢138 Simple bench Project while the 𝒢460
       Standard rebuild beside it, which expects the same Proficient and takes the same
       +2 Snag, said nothing at all.
       The rebuild's skill is the ITEM's, not the bench lane's: Resonant Carapace, Aegis
       Shroud and Reliquary Shell rebuild under Esoterica, so reusing the Engineering
       reading here would have printed the wrong skill's training. */
    function untrainedChip(skillName, tierKey) {
      if (craftSkillTier(ch, skillName) !== "untrained") return null;
      var tn = CRAFT().tier(tierKey).name;
      var need = CRAFT().tier(tierKey).skillTier || "proficient";
      var needNm = (((EN.rules || {}).profTiers || {})[need] || {}).name || need;
      return tagChip("UNTRAINED +2 SNAG", "var(--warn)",
        "A " + tn + " Project expects " + skillName + " " + needNm + ". Untrained you can still do the work; every Work Interval adds +2 Snag Dice, the same as any other Project.");
    }
    var kids = [el("p.help", { style: { margin: "0 0 8px", fontSize: "11.5px" },
      text: "Damage lowers a suit's DR; repair raises it back toward the printed value and never past it. " + (AR.shopText || "") + " " + (AR.benchText || "") })];
    if (!pieces.length) {
      kids.push(el("p.help", { style: { margin: "6px 0 0", fontSize: "11px", color: "var(--text3)" }, text: "No armor in your Stash to keep in the fight." }));
      return EN.ui.panel("Armor Integrity", "DR TRACK · REPAIR LANES", kids, { corners: true });
    }
    pieces.forEach(function (st) {
      // The suit's LISTED price: for a leased suit that is its Buyout, not the
      // buy-in it took to put it on. Everything below prices off this.
      var price = CRAFT().listPrice(st.item);
      var leased = !!(st.item && st.item.upkeep);
      // A row with no Glimmer price at all is priced off its Nexus asking figure, and
      // the label has to say so rather than claim a list price the catalog does not
      // print. The Reliquary Shell's own text is "Rarely offered for sale (◎2+)": that
      // is a floor, not a figure, and calling the number derived from it a "list price"
      // asserts something the book does not.
      var nexusOnly = !leased && !(st.item && st.item.price > 0) && price > 0;
      var priceLabel = leased ? " Buyout" : (nexusOnly ? " value at its " + (st.item.nexus || "Nexus") + " asking figure" : " list price");
      var worn = ch.equippedArmor === st.key;
      var head = el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        el("div.row.wrap", { style: { gap: "7px", alignItems: "center", flex: "1 1 auto", minWidth: 0 } }, [
          el("span", { style: { fontWeight: 600, fontSize: "13px" }, text: st.name }),
          worn ? tagChip("WORN", "var(--gold)", "This is the suit you have on") : null,
          el("span.mono", { title: "Current DR out of the suit's printed base",
            style: { fontSize: "13px", color: st.breached ? "var(--danger)" : (st.damaged ? "var(--warn)" : "var(--success)") },
            text: st.current + " / " + st.base + " DR" }),
          el("span.mono", { style: { fontSize: "12px", color: "var(--text3)" }, text: "□".repeat(st.current) + "■".repeat(st.lost) }),
          st.breached ? tagChip("BREACHED", "var(--danger)", AR.breachedText) : null,
          st.guard ? tagChip("PLATE SEATED", "var(--success)", AR.qualityText) : null
        ]),
        el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
          el("button.btn.sm", { disabled: st.breached, title: "Mark 1 point of DR lost (Demolition Engine on worn armor, a Hand Razors crit, a caustic environment)",
            style: { color: "var(--danger)", borderColor: "var(--danger)" },
            onclick: function () { markArmorDR(st, 1); } }, "− DR"),
          st.lost > 0 ? el("button.btn.sm", { title: "Undo one point of DR loss. A misclick fix, not a repair.",
            style: { color: "var(--text3)" },
            onclick: function () { markArmorDR(st, -1); } }, "↶ UNDO") : null
        ])
      ]);
      var lanes;
      if (st.breached) {
        var rebuild = AR.rebuildCost(st.item || {});
        var rbSkill = CRAFT().skillForItem(st.item || {}), rbTier = CRAFT().tierForItem(st.item || {});
        lanes = el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "7px" } }, [
          el("span.help", { style: { margin: 0, fontSize: "11px", color: "var(--danger)" }, text: AR.breachedText }),
          el("button.btn.sm.primary", { title: "Open a full Project for this suit at " + fmtG(rebuild) + " in parts, half its " + fmtG(price) + priceLabel + ", restoring all " + st.base + " DR"
              + " · " + CRAFT().tier(rbTier).name + " Project using " + rbSkill,
            onclick: function () { armorRebuildProject(st); } }, "⚒ REBUILD PROJECT · " + fmtG(rebuild)),
          untrainedChip(rbSkill, rbTier)
        ]);
      } else if (!st.lost) {
        lanes = el("p.help", { style: { margin: "6px 0 0", fontSize: "11px", color: "var(--text4)" }, text: "Undamaged. Nothing to repair." });
      } else {
        // Per POINT: pick how much of the loss to buy back, and both lanes price
        // exactly that. Defaults to the whole loss, so the common case is one click.
        var pts = armorPtsFor(st);
        var shop = AR.shopCost(st.item, pts), bench = hasRig ? 0 : AR.benchCost(st.item, pts);
        var perPoint = AR.shopCost(st.item, 1);
        var priceNote = fmtG(perPoint) + " per point at this suit's " + fmtG(price) + priceLabel
          + (leased ? " (a leased suit is priced off what it is worth, not off the deposit)"
                    : (nexusOnly ? " (this suit has no Glimmer price; the figure is its Nexus asking value at the ledger rate)" : "")) + ".";
        lanes = el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "7px" } }, [
          el("div.row", { style: { gap: "4px", alignItems: "center" } }, [
            el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "2px" }, text: "REPAIR" }),
            el("button.btn.sm", { disabled: pts <= 1, title: "Buy back one point fewer",
              style: { padding: "1px 7px" }, onclick: function () { setArmorPts(st, pts - 1); } }, "−"),
            el("span.mono", { title: "Points of DR this repair buys back, out of the " + st.lost + " this suit has lost",
              style: { fontSize: "12px", minWidth: "42px", textAlign: "center", color: "var(--text)" }, text: pts + " / " + st.lost }),
            el("button.btn.sm", { disabled: pts >= st.lost, title: "Buy back one point more",
              style: { padding: "1px 7px" }, onclick: function () { setArmorPts(st, pts + 1); } }, "+")
          ]),
          el("button.btn.sm", { title: (AR.shopText || "") + " " + priceNote,
            style: { color: "var(--gold)", borderColor: "var(--gold)" },
            onclick: function () { armorShopRepair(st, pts); } }, "▤ SHOP · " + fmtG(shop)),
          el("button.btn.sm", {
            title: (AR.benchText || "") + " Opens a " + benchTierName + " Project on the Fabrication bench"
              + (hasRig ? " with parts printed by your " + AR.freeParts + "." : " for " + fmtG(bench) + " in parts.")
              + (engUntrained ? " Your " + (AR.benchSkill || "Engineering") + " is untrained: the Project expects " + needName + ", so every Work Interval runs with +2 Snag." : ""),
            style: { color: "var(--accent)", borderColor: "var(--accent)" },
            onclick: function () { armorBenchProject(ch, st, pts); } },
            "⚒ BENCH · " + (hasRig ? "PARTS FREE" : fmtG(bench))),
          untrainedChip(AR.benchSkill || "Engineering", AR.benchTier || "simple"),
          hasRig ? tagChip("FAB RIG", "var(--accent)", AR.freeParts + ": prints the plate from stock, so the parts cost nothing.") : null
        ]);
      }
      kids.push(el("div.feature", { style: { borderLeftColor: st.breached ? "var(--danger)" : (st.damaged ? "var(--warn)" : "var(--success)") } }, [head, lanes]));
    });
    kids.push(el("p.help", { style: { margin: "10px 0 0", fontSize: "10.5px", color: "var(--text3)" },
      text: "Rate check: at 10 percent per point the shop lane re-plates a 5 DR suit for half its price, the same ratio the crafting rules charge in materials to build one from scratch. " + (AR.qualityText || "") }));
    return EN.ui.panel("Armor Integrity", "DR TRACK · SHOP & BENCH REPAIR", kids, { corners: true });
  }

  function impactTable(ch) {
    var out = [armorIntegrityPanel(ch)];
    var armors = ownedArmor(ch);
    if (!armors.length) {
      out.push(el("div.muted-box", { style: { padding: "28px 20px", textAlign: "center", borderColor: "var(--success)" },
        html: "<div style='font-family:var(--disp);font-size:13px;letter-spacing:.18em;color:var(--success)'>⛨ NO ARMOR ON THE BENCH</div><div style='font-size:12px;color:var(--text3);margin-top:8px'>Acquire armor in the gray market or your stash, then bring it here to fit Armor Mods.</div>" }));
      return out;
    }
    // _benchArmor holds an entry KEY, so "the second Courier Shell" is addressable
    if (!_benchArmor || !armors.some(function (a) { return a.key === _benchArmor; })) _benchArmor = armors[0].key;
    out.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "10px", alignItems: "center" } },
      [el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "4px" }, text: "ON THE BENCH" })].concat(
        armors.map(function (a) {
          var on = _benchArmor === a.key;
          return el("button.btn.sm" + (on ? ".primary" : ""), { onclick: (function (k) { return function () { _benchArmor = k; EN.app.render(); }; })(a.key) }, a.label);
        }))));
    var aRow = armors.find(function (a) { return a.key === _benchArmor; }) || armors[0];
    var it = aRow.it, aKey = aRow.key;
    var lo = armorLoadout(ch, aKey);
    /* The bench addresses the PIECE now, so this header prints THAT piece's current DR
       instead of the catalog base plus an apology about not knowing which suit it was.
       Both numbers when it is damaged, because a suit at 2 of 4 wants both on one line. */
    var aSt = ENG().armorState ? ENG().armorState(ch, aKey) : null;
    var drTag = (aSt && aSt.base)
      ? (aSt.lost > 0 ? " · " + aSt.current + " OF " + aSt.base + " DR" : " · " + aSt.base + " DR")
      : (typeof it.dr === "number" ? " · " + it.dr + " BASE DR" : "");
    var tag = (it.group || "").toUpperCase() + drTag;
    var kids = [el("p.help", { style: { margin: "0 0 8px", fontSize: "11.5px" }, text: "One mod per slot; only Modular armor carries slots (Integrated adds one). Every Armor Mod is bench work. The strictest legality on the suit is what a scanner reports." })];

    if (!isModularArmor(it) || armorSlotCount(it) === 0) {
      kids.push(el("div.muted-box", { style: { padding: "18px", textAlign: "center", borderColor: "var(--border2)" },
        html: "<div style='font-size:12px;color:var(--text3)'>" + it.name + " is not <b>Modular</b>; it has no Mod Slots. Only Modular armor takes Armor Mods.</div>" }));
      out.push(EN.ui.panel(aRow.label, tag, kids, { corners: true }));
      return out;
    }

    var slots = armorSlotCount(it), legal = aggregateArmorLegality(it, lo);
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "10px" } }, [
      el("span.mono", { style: { fontSize: "18px", color: lo.length > slots ? "var(--danger)" : "var(--success)" }, html: lo.length + " <span style='font-size:12px;color:var(--text3)'>/ " + slots + " mod slots</span>" }),
      tagChip(legal, LEGAL_COLOR[legal]),
      el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: legal === (it.legality || "Legal") ? "as a scanner reads it" : "scanner reads it as " + legal + " (was " + (it.legality || "Legal") + ")" })
    ]));
    lo.forEach(function (key) {
      var m = AM().byKey[key]; if (!m) return;
      kids.push(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", padding: "6px 0", borderTop: "1px solid rgba(35,48,68,.4)" } }, [
        el("div", { style: { flex: "1 1 200px", minWidth: 0 } }, [
          el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [
            el("span", { style: { fontWeight: 600, fontSize: "13px" }, text: m.name }),
            partChip(m.legality, LEGAL_COLOR[m.legality]), partChip(m.rarity, AVAIL_COLOR[m.rarity] || "var(--text3)")
          ]),
          el("p.help", { style: { margin: "2px 0 0", fontSize: "11px" }, title: m.effect, text: m.grants })
        ]),
        el("button.btn.sm", { title: "Pull " + m.name, style: { color: "var(--text3)" }, onclick: function () { removeArmorMod(aKey, key); } }, "✕")
      ]));
    });
    var fitting = (AM().mods || []).filter(function (m) { return armorModFits(m, it) && lo.indexOf(m.key) === -1; });
    var ownedOpts = fitting.filter(function (m) { return availableArmorModQty(ch, m) > 0; });
    if (lo.length >= slots) {
      kids.push(el("p.help", { style: { margin: "8px 0 0", fontSize: "10.5px", color: "var(--warn)" }, text: "Mod Slots full; pull a mod to fit another." }));
    } else if (ownedOpts.length) {
      kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [
        el("span", { style: { fontFamily: "var(--disp)", fontSize: "9.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "FIT A MOD" }),
        el("select", { style: { fontSize: "11px", width: "auto", maxWidth: "100%" }, onchange: function (e) { var k = e.target.value; e.target.value = ""; if (k) tryInstallArmorMod(it, aKey, lo, k); } },
          [el("option", { value: "", text: "+ fit from stash" })].concat(ownedOpts.map(function (m) {
            var av = availableArmorModQty(ch, m);
            return el("option", { value: m.key, text: m.name + (av > 1 ? " ×" + av : "") });
          })))
      ]));
    } else if (fitting.length) {
      kids.push(el("p.help", { style: { margin: "8px 0 0", fontSize: "10.5px", color: "var(--text3)" }, text: "You own no mods that fit this suit. Buy Armor Mods in the gray market." }));
    } else {
      kids.push(el("p.help", { style: { margin: "8px 0 0", fontSize: "10.5px", color: "var(--text4)" }, text: "No Armor Mods fit this suit." }));
    }
    kids.push(el("p.help", { style: { margin: "10px 0 0", fontSize: "10.5px", color: "var(--text3)" }, text: AM().rules ? AM().rules.flatDR + " " + AM().rules.resistance : "" }));
    out.push(EN.ui.panel(aRow.label, tag, kids, { corners: true }));
    return out;
  }

  /* ============================================================================
     TECH BAY (Crafting & Projects). Runs the Projects system: a tier sets a
     Target Progress, a craft Skill drives the roll, kits feed the pool, and each
     logged Work Interval moves Progress until the Target is met. Blueprints are
     derived from the gear catalog (materials = half list price). State lives on
     ch.projects, mutated through tbSetProjects (lazy-init like weaponParts).
     ============================================================================ */
  function CRAFT() { return EN.crafting || {}; }
  var _tbQuery = "";     // blueprint search
  var _tbForm = null;    // in-progress custom-project draft, or null

  var TB_TIER_COLOR = { simple: "var(--text3)", standard: "var(--accent)", advanced: "var(--gold)", prototype: "var(--ember)", relic: "var(--danger)" };
  var TB_SKILL_COLOR = { Engineering: "var(--ember)", Systems: "var(--accent)", Medtech: "var(--success)", Esoterica: "var(--flow)", Investigation: "var(--gold)", Awareness: "var(--gold)" };
  function tbMod(n) { n = n || 0; return (n >= 0 ? "+" : "") + n; }
  function tbChip(text, color, title) { return el("span.chip", { title: title || "", style: { fontSize: "9px", color: color, borderColor: color } }, text); }
  function tbTierChip(tierKey) {
    var t = CRAFT().tier(tierKey);
    // the tier also records the training it expects; the Snag count alone never says so
    var expects = t.skillTier ? " · Expects " + t.skillTier.charAt(0).toUpperCase() + t.skillTier.slice(1) : "";
    return tbChip(t.name.toUpperCase() + (t.target ? " · " + t.target : ""), TB_TIER_COLOR[tierKey] || "var(--text2)", t.difficulty + " · " + t.time + expects);
  }
  function tbSkillChip(skill) { return tbChip(skill, TB_SKILL_COLOR[skill] || "var(--text2)", "Primary Skill"); }

  // shared Dice Pool visuals live in EN.ui (also used by the #GRID Deep Run console)
  function tbDieFace(die, poolColor, animating) { return EN.ui.dieFace(die, poolColor, animating); }

  // the Attribute Matrix roll choreography, pointed at a Project's roll box:
  // EN.ui.animatePoolRoll scrambles the dice, then a final render reveals the
  // counted colors, totals, Margin, and the matching outcome.
  function tbAnimateRoll(id) {
    var rs = _tbRoll[id];
    var root = document.querySelector('[data-roll="' + id + '"]');
    if (!rs || !root) { if (rs) rs.animating = false; return; }
    var token = rs.animToken;
    EN.ui.animatePoolRoll(root, function () {
      if (rs.animToken === token) { rs.animating = false; EN.app.render(); }
    });
  }

  function tbSkill(d, name) { return (d.skills || []).find(function (s) { return (s.name || "").toLowerCase() === name.toLowerCase(); }); }

  // owned crafting kits, flagged Basic vs Proficient by the character's tool proficiencies.
  // kitEquivalent is how a piece of gear that is not itself a Skill Kit stands in for one:
  // a Trauma Rig's Medical Baseline makes it count as a Basic Medkit, or an Advanced Medkit
  // at Trauma Grade [2] and up, so it feeds a Medtech pool exactly like the kit it replaces.
  // Only the Rig you are running counts; spares sitting in the stash are just stock.
  // WHICH Rig that is, and whether it counts as owned at all, is entirely the engine
  // resolver's answer: the bench compares this row's own entry key against the resolved
  // rigKey and asks nothing else. So it has no ownership predicate of its own to drift
  // from the engine's, and two Rigs of the same tier no longer both match one live Rig
  // and grant its Edge twice.
  function tbKits(ch) {
    var cats = CRAFT().kitCategories || {};
    var profs = (ch.proficiencies && ch.proficiencies.tools) || {};
    var liveRigKey = EN.engine.rigStats(ch).rigKey;
    return (ch.equipment || []).map(function (e) {
      var it = findItem(e.name);
      if (!it || (it.bucket !== "kits" && !it.kitEquivalent)) return null;
      if (it.rigTier) { if (entryKey(e) !== liveRigKey) return null; }
      else if (!(e.qty > 0)) return null;
      var cat = it.category || "";
      if (!cats[cat]) return null;
      /* Tool Category Expertise: "You treat kits in this category as one quality grade
         higher than listed, up to the +3 Edge Dice maximum." The tier ladder was already
         stored and already cost Training Points, but nothing spent it: a crafter with
         Engineering Tools (Expertise) got exactly the catalog's Edge Dice at the bench.
         Mastery sits above Expertise on the same ladder and so carries the bump too. */
      var toolTier = ENG().effectiveGearTier(ch, "tools", cat);
      var listed = it.edgeDice || 0;
      var bumped = listed;
      if (listed > 0 && (toolTier === "expertise" || toolTier === "mastery")) bumped = Math.min(3, listed + 1);
      return { name: it.name, category: cat, skill: cats[cat], proficient: !!profs[cat], effect: it.effect || it.desc || "",
               edgeDice: bumped, listedEdgeDice: listed, toolTier: toolTier,
               edgeNote: bumped > listed
                 ? ((it.edgeNote ? it.edgeNote + ", " : "") + "one grade higher for Tool " +
                    (toolTier === "mastery" ? "Mastery" : "Expertise"))
                 : (it.edgeNote || null),
               requiresProficient: !!it.requiresProficient,
               kitEquivalent: it.kitEquivalent || null };
    }).filter(Boolean);
  }

  /* ---- Dice Pool assembly for the bench: Edge from the character, kits, and
     per-roll toggles; Snag from the Project's difficulty. Roll state (toggles,
     last roll result) is transient, keyed by project id. ---- */
  var _tbRoll = {};
  function tbRollState(id) { return (_tbRoll[id] = _tbRoll[id] || { kitsOff: {}, prep: false, narrative: false, result: null }); }
  // kits that can feed this skill's pool: matching skill, a real Edge grant, and
  // the proficiency their text demands; rollState can toggle one off for a roll
  function tbActiveKits(ch, skillName, rollState) {
    return tbKits(ch).filter(function (k) {
      return k.skill === skillName && k.edgeDice > 0 && (!k.requiresProficient || k.proficient) &&
             !(rollState && rollState.kitsOff[k.name]);
    });
  }
  // Only one Focus Caliber can apply to a single roll: gather every Focus that
  // could cover this Work Interval (the skill's own Focus plus a Tool Focus on
  // any active kit's category), then the roll applies exactly one, picked on
  // the project card's FOCUS toggle row (default: the skill's).
  function tbFocusCandidates(ch, d, s, kits) {
    var out = [];
    if (s && s.focus) {
      var sf = EN.engine.focusesFor(ch, "skill", s.key)[0];
      out.push({ key: "skill", label: "Caliber from " + s.name + (sf && sf.aspect ? " (" + sf.aspect + ")" : "") + " Focus", value: d.caliber || 1 });
    }
    var seen = {};
    (kits || []).forEach(function (k) {
      if (!k.category || seen[k.category]) return;
      seen[k.category] = 1;
      EN.engine.focusesFor(ch, "tools", k.category).forEach(function (f) {
        out.push({ key: "tool|" + k.category + "|" + (f.aspect || ""), label: "Caliber from " + k.category + (f.aspect ? " (" + f.aspect + ")" : "") + " Focus", value: d.caliber || 1 });
      });
    });
    return out;
  }
  function tbEdgeFor(ch, d, skillName, rollState) {
    var s = tbSkill(d, skillName);
    var kits = tbActiveKits(ch, skillName, rollState);
    var rs = rollState || {};
    var cands = tbFocusCandidates(ch, d, s, kits);
    var pick = cands.length ? (cands.find(function (c) { return c.key === rs.focusKey; }) || cands[0]) : null;
    rs.focusResolved = true;
    rs.focusPart = pick ? { label: pick.label + (cands.length > 1 ? " (one Focus per roll)" : ""), value: pick.value } : null;
    // a Specialization on an active kit's Tool Category stacks with its own
    // parent's Focus and with the skill's Specialization (different parents)
    rs.extraSpecParts = [];
    var seenSpec = {};
    kits.forEach(function (k) {
      if (!k.category || seenSpec[k.category]) return;
      seenSpec[k.category] = 1;
      var sp = EN.engine.specFor(ch, "tools", k.category);
      if (sp) rs.extraSpecParts.push({ label: "Specialization: " + k.category + (sp.aspect ? " (" + sp.aspect + ")" : ""), value: 2 });
    });
    var ep = CRAFT().edgePointsFor(s, d.caliber, kits, rs);
    return { skill: s, points: ep.points, parts: ep.parts, pool: EN.engine.buildEdgePool(ep.points), focusCands: cands, focusPick: pick };
  }
  function tbEdgeTip(e) {
    return e.parts.length ? e.parts.map(function (p) { return "+" + p.value + "  " + p.label; }).join("\n") : "No Edge sources yet; train the skill or buy a kit.";
  }
  function tbSnagPts(p, skillEntry) {
    var base = (p.snag != null) ? p.snag : (CRAFT().snagForTier[p.overEngineered ? "prototype" : p.tier] || 2);
    // untrained adds +2 Snag Dice to a Dice Pool per the core rules
    return { base: base, untrained: (skillEntry && skillEntry.untrained) ? 2 : 0, total: base + ((skillEntry && skillEntry.untrained) ? 2 : 0) };
  }
  function tbSetSnag(id, n) {
    tbSetProjects(function (list) {
      var pp = list.find(function (x) { return x.id === id; });
      if (pp) pp.snag = Math.max(0, Math.min(13, n));
    });
  }

  function tbRecipeClass(it) {
    if (isWeapon(it)) return "Weapons";
    if (it.kind === "armor") return "Armor";
    if (it.kind === "shield" || it.kind === "focus") return "Shields & Foci";
    if (CRAFT()._isAmmo && CRAFT()._isAmmo(it)) return "Ammo & Munitions";
    if (it.benchPart) return "Weapon Mods";
    if (it.armorMod) return "Armor Mods";
    if (it.bucket === "kits" || /Tools|Implements/i.test(it.category || "")) return "Tools & Kits";
    return "Field Gear";
  }

  /* ---- project state mutators (ch.projects) ---- */
  function tbSetProjects(fn) { store.update(function (c) { c.projects = c.projects || []; fn(c.projects, c); }); }
  function tbNewId() { return "prj_" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function tbFind(ch, id) { return (ch.projects || []).find(function (p) { return p.id === id; }); }

  function tbStart(spec) {
    var baseTarget = CRAFT().tier(spec.tier).target || 10;
    var over = !!spec.overEngineered;
    var p = {
      id: tbNewId(),
      name: (spec.name || "Untitled Project").trim() || "Untitled Project",
      kind: spec.kind || "build",
      itemName: spec.itemName || null,
      skill: spec.skill || "Engineering",
      tier: spec.tier || "standard",
      target: over ? Math.max(baseTarget, CRAFT().tier("prototype").target) : baseTarget,
      snag: CRAFT().snagForTier[over ? "prototype" : (spec.tier || "standard")] || 2,
      progress: 0,
      materialCost: spec.materialCost || 0,
      materialsSecured: false,
      salvaged: false,
      overEngineered: over,
      addOnComplete: spec.addOnComplete !== false && !!spec.itemName,
      // Armor Repair rides the ordinary Project: repairKey names the armor ENTRY
      // this work restores and repairPoints how much DR it buys back. tbComplete
      // applies them, clamped by the piece's own base, so a Project that outlived
      // the suit it was for quietly restores nothing instead of resurrecting it.
      repairKey: spec.repairKey || null,
      repairPoints: spec.repairPoints || 0,
      log: [],
      createdAt: Date.now()
    };
    tbSetProjects(function (list) { list.push(p); });
    toast("Project started: " + p.name + " (" + CRAFT().tier(p.tier).name + ", Target " + p.target + ").");
  }
  function tbLog(id, outcomeKey) {
    var oc = CRAFT().outcome(outcomeKey); if (!oc) return;
    tbSetProjects(function (list) {
      var p = list.find(function (x) { return x.id === id; }); if (!p) return;
      p.log = p.log || [];
      p.log.push({ o: outcomeKey, d: oc.progress });
      p.progress = Math.min(p.target, (p.progress || 0) + oc.progress);
    });
  }
  function tbUndo(id) {
    tbSetProjects(function (list) {
      var p = list.find(function (x) { return x.id === id; }); if (!p || !(p.log || []).length) return;
      var last = p.log.pop();
      p.progress = Math.max(0, (p.progress || 0) - (last.d || 0));
    });
  }
  function tbToggleOverEng(id) {
    tbSetProjects(function (list) {
      var p = list.find(function (x) { return x.id === id; }); if (!p) return;
      p.overEngineered = !p.overEngineered;
      var base = CRAFT().tier(p.tier).target || 10;
      p.target = p.overEngineered ? Math.max(base, CRAFT().tier("prototype").target) : base;
      p.progress = Math.min(p.progress, p.target);
    });
  }
  function tbToggleSalvage(id) {
    tbSetProjects(function (list) { var p = list.find(function (x) { return x.id === id; }); if (p && !p.materialsSecured) p.salvaged = !p.salvaged; });
  }
  // Materials are paid for HERE, and materialsPaid records what actually left the
  // wallet. A Project that pays out in something other than an item (Armor Repair
  // pays in DR) has to be able to hand that money back if the payout turns out to be
  // nothing, and it cannot do that by re-deriving the price later: salvage may have
  // been toggled, or the rate may have moved.
  function tbSecure(id) {
    var ch = store.active(), p = tbFind(ch, id); if (!p) return;
    if (p.materialsSecured) return;                      // already paid; a double-fire cannot double-charge
    var cost = p.salvaged ? 0 : (p.materialCost || 0);
    if (cost > (ch.glimmer || 0)) { toast("Not enough Glimmer for materials (" + fmtG(cost) + ")."); return; }
    tbSetProjects(function (list, c) {
      var pp = list.find(function (x) { return x.id === id; }); if (!pp || pp.materialsSecured) return;
      c.glimmer = (c.glimmer || 0) - cost;
      pp.materialsSecured = true;
      pp.materialsPaid = cost;
    });
    toast(cost ? "Materials secured for " + fmtG(cost) + "." : "Salvaged; no Glimmer spent.");
  }
  // Can this Project be finished? Its materials have to be paid for (or salvaged)
  // first. Completing an unsecured Project used to hand over the finished work with
  // the bill still outstanding, which made every material cost in the app optional,
  // the bench lane's parts included.
  function tbUnpaid(p) { return !p.materialsSecured && (p.materialCost || 0) > 0; }
  /* EVERY read AND every write happens inside ONE store.update, against the live
     character in that same tick, and the Project is re-found by id in there rather
     than trusted from the node that was clicked. `p` is only ever used for its id.

     That is not tidiness. tbComplete used to take the Project OBJECT captured at
     render, splice it out by id, and pay a refund read off that still-live object.
     Re-firing one rendered button therefore recomputed `restored` as 0 (the suit was
     already whole) and paid the refund again, every time: 5000 -> 4862 for a
     legitimate 3 DR repair, then 5000, 5138, 5276. It CREATED currency. tbSecure got
     exactly this guard ("a double-fire cannot double-charge") and armorShopRepair got
     the live re-read; this function got neither, and it is the one that pays out.

     The same re-entry also handed out one Build item per fire off a single payment.
     That half was pre-existing rather than new, and it is closed here too: a Project
     that is no longer in the list completes NOTHING and says nothing. */
  function tbComplete(p) {
    var done = null, unpaid = null;
    tbSetProjects(function (list, c) {
      var i = list.map(function (x) { return x.id; }).indexOf(p.id);
      if (i < 0) return;                                    // already completed: a re-fire is a no-op
      var pp = list[i];
      if (tbUnpaid(pp)) { unpaid = pp.materialCost || 0; return; }
      // An Armor Repair Project pays out in DR. The engine's resolver says what the
      // piece is missing right now, so the restore can never take it past its base
      // and a piece that left the stash mid-Project restores nothing.
      var st = (pp.repairKey && EN.engine.armorState) ? EN.engine.armorState(c, pp.repairKey) : null;
      var restored = (st && st.base) ? Math.max(0, Math.min(pp.repairPoints || 0, st.lost)) : 0;
      /* The other half of "no path pays without restoring", and it is per POINT
         because that is how the parts were priced. Parts bought `repairPoints` points
         of work; whatever share of them the Project cannot deliver went into nothing,
         so that share comes back. It used to refund all-or-nothing, firing only when
         `restored` was exactly 0, which meant a Project that bought 3 points and
         landed 1 kept the other two points' parts: 𝒢138 for 𝒢46 of work. Floor, so
         rounding never invents Glimmer. */
      var pts = pp.repairPoints || 0;
      var paid = pp.materialsSecured ? (pp.materialsPaid || 0) : 0;
      var refund = (pp.repairKey && paid > 0 && pts > 0)
        ? Math.floor(paid * Math.max(0, pts - restored) / pts) : 0;
      // The ordinary Project results table's quality edge, spent on armor as the
      // manuscript suggests: a clean run (a Flawless Work Interval) seats the plate
      // so the next point of DR the suit would lose is absorbed for free.
      var clean = restored > 0 && (pp.log || []).some(function (l) { return l && l.o === "flawless"; });
      list.splice(i, 1);
      var addName = pp.addOnComplete ? pp.itemName : null;
      if (addName) addToStash(c, addName);
      var res = null;
      if (restored > 0) {
        res = EN.engine.applyArmorDamage(c, pp.repairKey, -restored);   // the one writer, clamped at the base
        if (clean) EN.engine.grantArmorGuard(c, pp.repairKey);          // and the one writer for the guard
      }
      if (refund > 0) c.glimmer = (c.glimmer || 0) + refund;
      done = { name: pp.name, addName: addName, repair: !!pp.repairKey, refund: refund, clean: clean,
               // what the WRITER actually gave back, not what was asked for
               restored: res ? Math.max(0, st.lost - res.lost) : 0,
               piece: st ? st.name : null, current: res ? res.current : (st ? st.current : 0), base: st ? st.base : 0 };
    });
    if (unpaid != null) { toast("Secure the materials first (" + fmtG(unpaid) + ")."); return; }
    if (!done) return;                                      // nothing was completed, so nothing is announced
    var back = done.refund > 0 ? " " + fmtG(done.refund) + " in unused parts refunded." : "";
    toast(done.addName ? done.name + " complete; " + done.addName + " added to your Stash."
      : done.restored > 0 ? done.name + " complete; " + done.piece + " back to " + done.current + " of " + done.base + " DR." + (done.clean ? " Clean run: the next point of DR it would lose is absorbed." : "") + back
      : done.repair ? done.name + " closed with no DR to restore" + (done.refund > 0 ? ";" + back : "; nothing was spent on it.")
      : done.name + " complete.");
  }
  /* Abandoning a repair is a zero-DR outcome reached through the other door, so it
     answers the same way COMPLETE does: the parts come back. It used to keep them,
     which meant the player who could not afford to finish paid for nothing and was
     not told, while the identical outcome one button over was refunded. The confirm
     says so, because a prompt that mentions only Progress is not consent to a debit.
     Build Projects are untouched: their materials are consumed by the attempt, and
     COMPLETE does not refund them either. */
  function tbAbandon(id) {
    var ch = store.active(), p = tbFind(ch, id); if (!p) return;
    var back = (p.repairKey && p.materialsSecured) ? (p.materialsPaid || 0) : 0;
    // confirmation is the caller's two-click arm, not a browser dialog: a suppressed
    // confirm() returns false instantly and the button silently does nothing.
    var paidBack = 0;
    tbSetProjects(function (list, c) {
      var i = list.map(function (x) { return x.id; }).indexOf(id);
      if (i < 0) return;                                    // already gone: a re-fire cannot refund twice
      var pp = list[i];
      paidBack = (pp.repairKey && pp.materialsSecured) ? (pp.materialsPaid || 0) : 0;
      list.splice(i, 1);
      if (paidBack > 0) c.glimmer = (c.glimmer || 0) + paidBack;
    });
    if (paidBack > 0) toast("Project abandoned; " + fmtG(paidBack) + " in parts refunded.");
  }

  /* ---- Panel 1: Fabrication Profile (live Engineering / Systems checks + kits) ---- */
  function tbFabProfile(ch, d) {
    function skillRow(nm, big) {
      var s = tbSkill(d, nm);
      if (!s) return null;
      var e = tbEdgeFor(ch, d, nm, null);
      var chips = [tbChip((s.tierShort || (s.tier || "untrained")).toUpperCase(), s.untrained ? "var(--text3)" : "var(--accent)", "Skill tier")];
      if (s.focus) chips.push(tbChip("FOCUS +" + (d.caliber || 1), "var(--gold)", "Skill Focus: +Caliber Edge Dice, folded into the pool below (and +Caliber on emergency d20 fixes)"));
      if (s.specialization) chips.push(tbChip("SPEC +2", "var(--flow)", "Specialization: +2 Edge Dice, folded into the pool below (and a wider crit range on emergency d20 fixes)"));
      if (s.untrained) chips.push(tbChip("UNTRAINED +2 SNAG", "var(--warn)", "Untrained: Work Intervals with this skill add +2 Snag Dice"));
      return el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", padding: big ? "7px 0" : "4px 0", borderTop: "1px solid rgba(35,48,68,.4)" } }, [
        el("div.row.wrap", { style: { gap: "8px", alignItems: "center", flex: "1 1 auto", minWidth: 0 } },
          [el("span", { style: { fontWeight: 600, fontSize: big ? "13.5px" : "12px", minWidth: "92px", color: TB_SKILL_COLOR[nm] || "var(--text)" }, text: nm }),
           el("span.mono", { style: { fontSize: big ? "15px" : "12px", color: "var(--text)" }, title: "Edge Dice for a Work Interval:\n" + tbEdgeTip(e), text: "Edge " + e.points }),
           el("span.mono", { style: { fontSize: big ? "12px" : "11px", color: "var(--text3)" }, title: "Pool composition (Edge past 10 sharpens d10s into d12s)", text: "→ " + e.pool.label })
          ].concat(chips))
      ]);
    }
    var kids = [
      el("p.help", { style: { margin: "0 0 6px", fontSize: "11.5px" }, text: "Work Intervals roll the Dice Pool Method: Edge Dice from a Skill and its Attribute, its Skill Proficiency Bonus, kits, Focus, and Specialization, against the GM's Snag Dice. Engineering and Systems drive most of the bench." }),
      skillRow("Engineering", true),
      skillRow("Systems", true)
    ];
    // emergency fixes stay d20; keep that distinct rule visible but separate
    var engS = tbSkill(d, "Engineering"), sysS = tbSkill(d, "Systems");
    kids.push(el("p.help", { style: { margin: "6px 0 0", fontSize: "10.5px", color: "var(--text3)" },
      title: CRAFT().rules.emergency,
      text: "Emergency fixes under pressure stay d20: Engineering " + tbMod(engS ? engS.total : 0) + " · Systems " + tbMod(sysS ? sysS.total : 0) + " (+ Caliber inside a Focus). That fix holds for the scene and rarely becomes a permanent upgrade. Everything below rolls the pool." }));
    // secondary craft skills, compact
    var secondary = ["Medtech", "Esoterica", "Investigation", "Awareness"].map(function (nm) {
      var s = tbSkill(d, nm); if (!s) return null;
      var e = tbEdgeFor(ch, d, nm, null);
      return tbChip(nm + " · Edge " + e.points + (s.focus ? " ·F" : "") + (s.specialization ? " ·S" : ""), TB_SKILL_COLOR[nm] || "var(--text2)",
        nm + " (" + (s.attrName || "") + ")\nPool: " + e.pool.label + "\nEmergency d20 " + tbMod(s.total || 0) + "\n" + tbEdgeTip(e));
    }).filter(Boolean);
    if (secondary.length) kids.push(el("div.row.wrap", { style: { gap: "6px", marginTop: "8px", alignItems: "center" } },
      [el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "2px" }, text: "ALSO" })].concat(secondary)));
    // kits
    var kits = tbKits(ch);
    kids.push(el("div", { style: { marginTop: "10px", paddingTop: "8px", borderTop: "1px solid var(--border)" } }, [
      el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em" }, text: "CRAFTING KITS" }),
      kits.length
        ? el("div.row.wrap", { style: { gap: "6px", marginTop: "6px", alignItems: "center" } }, kits.map(function (k) {
            return el("span.chip", { title: (k.kitEquivalent ? "Counts as " + (/^[AEIOU]/.test(k.kitEquivalent) ? "an " : "a ") + k.kitEquivalent + ".\n" : "") + k.effect,
              style: { fontSize: "9.5px", color: k.proficient ? "var(--success)" : "var(--text2)", borderColor: k.proficient ? "var(--success)" : "var(--border2)" } },
              (k.kitEquivalent ? k.kitEquivalent + " (" + k.name + ")" : k.name) + " · " + (k.proficient ? "PROFICIENT" : "BASIC"));
          }))
        : el("p.help", { style: { margin: "4px 0 0", fontSize: "11px", color: "var(--text3)" }, text: "No crafting kits in your Stash. Buy an Engineering Toolkit, Fabrication Rig, or Smartdeck kit in the gray market; demanding Projects without the right kit run with Snag or a higher Target." })
    ]));
    return EN.ui.panel("Fabrication Profile", "ENGINEERING · SYSTEMS · KITS", kids, { corners: true });
  }

  /* ---- Panel 2: Projects tracker ---- */
  function tbCustomForm(ch) {
    _tbForm = _tbForm || { name: "", kind: "custom", skill: "Engineering", tier: "standard" };
    var f = _tbForm;
    function sel(val, opts, onCh) {
      return el("select", { style: { fontSize: "11px", width: "auto" }, onchange: onCh },
        opts.map(function (o) { return el("option", { value: o.v, selected: val === o.v, text: o.t }); }));
    }
    return el("div", { style: { padding: "12px", border: "1px solid var(--accent-dim)", borderRadius: "6px", background: "var(--bg1)", marginBottom: "12px" } }, [
      el("div.set-editor-h", { style: { fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: ".2em", color: "var(--accent)", marginBottom: "10px" }, text: "NEW CUSTOM PROJECT" }),
      el("input", { type: "text", value: f.name, placeholder: "What are you building or fixing?", style: { width: "100%", marginBottom: "10px" }, oninput: function (e) { f.name = e.target.value; } }),
      el("div.row.wrap", { style: { gap: "12px", alignItems: "center", marginBottom: "10px" } }, [
        el("label.row.wrap", { style: { gap: "5px", alignItems: "center", fontSize: "11px", color: "var(--text3)" } }, ["KIND", sel(f.kind, CRAFT().kinds.map(function (k) { return { v: k.key, t: k.name }; }), function (e) { f.kind = e.target.value; EN.app.render(); })]),
        el("label.row.wrap", { style: { gap: "5px", alignItems: "center", fontSize: "11px", color: "var(--text3)" } }, ["SKILL", sel(f.skill, CRAFT().craftSkills.map(function (s) { return { v: s, t: s }; }), function (e) { f.skill = e.target.value; })]),
        el("label.row.wrap", { style: { gap: "5px", alignItems: "center", fontSize: "11px", color: "var(--text3)" } }, ["TIER", sel(f.tier, CRAFT().tiers.filter(function (t) { return t.target; }).map(function (t) { return { v: t.key, t: t.name + " (" + t.target + ")" }; }), function (e) { f.tier = e.target.value; EN.app.render(); })])
      ]),
      CRAFT().kinds.find(function (k) { return k.key === f.kind; }) ? el("p.help", { style: { margin: "0 0 10px", fontSize: "11px" }, text: CRAFT().kinds.find(function (k) { return k.key === f.kind; }).desc }) : null,
      // custom work has no catalog row to calibrate against, so show what the chosen tier looks like
      (function () {
        var t = CRAFT().tier(f.tier);
        return (t && t.examples) ? el("p.help", { style: { margin: "0 0 10px", fontSize: "11px", color: "var(--text3)" },
          text: "Work at this tier looks like: " + t.examples + "." }) : null;
      })(),
      el("div.row.wrap", { style: { gap: "8px" } }, [
        el("button.btn.sm.primary", { onclick: function () { tbStart(f); _tbForm = null; EN.app.render(); } }, "✓ START PROJECT"),
        el("button.btn.sm", { onclick: function () { _tbForm = null; EN.app.render(); } }, "CANCEL")
      ])
    ]);
  }

  function tbProjectCard(ch, d, p) {
    var tier = CRAFT().tier(p.tier);
    var s = tbSkill(d, p.skill);
    var pct = p.target ? Math.min(100, Math.round((p.progress / p.target) * 100)) : 0;
    var done = p.target && p.progress >= p.target;
    var kindName = (CRAFT().kinds.find(function (k) { return k.key === p.kind; }) || {}).name || p.kind;
    var head = el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center" } }, [
      el("div.row.wrap", { style: { gap: "7px", alignItems: "center", flex: "1 1 auto", minWidth: 0 } }, [
        el("span", { style: { fontWeight: 600, fontSize: "13.5px" }, text: p.name }),
        tbChip(kindName.toUpperCase(), "var(--text2)", "Project kind"),
        tbTierChip(p.overEngineered ? "prototype" : p.tier),
        tbSkillChip(p.skill),
        // Armor Repair: name the piece and what completing this buys back, read
        // from the engine's resolver so the chip cannot drift from the sheet
        (function () {
          if (!p.repairKey || !EN.engine.armorState) return null;
          var st = EN.engine.armorState(ch, p.repairKey);
          if (!st.base) return tbChip("PIECE GONE", "var(--text4)", "The armor this Project was repairing is no longer in the Stash; completing it restores nothing.");
          return tbChip("+" + Math.min(p.repairPoints || 0, st.lost) + " DR · " + st.current + "/" + st.base, "var(--success)",
            st.name + " is at " + st.current + " of " + st.base + " DR. Completing this Project restores up to " + (p.repairPoints || 0) + ".");
        })(),
        p.overEngineered ? tbChip("OVER-ENGINEERED", "var(--danger)", "Pushed past safe capacity: Prototype tier, and the result carries a Mandatory Flaw") : null
      ]),
      EN.ui.armButton("abandon:" + p.id, { label: "✕", armedLabel: "SURE?",
        title: "Abandon this Project. Its Progress is lost.",
        onConfirm: function () { tbAbandon(p.id); } })
    ]);
    // Work Interval roll box: Edge (character + kits + toggles) vs Snag (GM-set difficulty)
    var rs = tbRollState(p.id);
    var edge = tbEdgeFor(ch, d, p.skill, rs);
    var snag = tbSnagPts(p, s);
    var snagPool = EN.engine.buildSnagPool(snag.total);
    var rollBox;
    if (!s) {
      rollBox = el("p.help", { style: { margin: "6px 0 6px", fontSize: "11.5px" }, text: p.skill + " is not on this Freelancer's sheet; the GM sets the roll." });
    } else {
      var rollKids = [];
      // EDGE row: total + composition, with kit and situational toggles feeding the pool
      var kitToggles = tbKits(ch).filter(function (k) { return k.skill === p.skill && k.edgeDice > 0 && (!k.requiresProficient || k.proficient); }).map(function (k) {
        var on = !rs.kitsOff[k.name];
        return el("button.btn.sm", {
          title: (k.edgeNote ? k.edgeNote + ". " : "") + (on ? "Counted in the pool; click to leave it out of this roll." : "Not counted; click to include it."),
          style: { fontSize: "9px", color: on ? "var(--success)" : "var(--text4)", borderColor: on ? "var(--success)" : "var(--border)" },
          onclick: function () { rs.kitsOff[k.name] = on; rs.result = null; EN.app.render(); }
        }, (on ? "✓ " : "") + k.name + " +" + k.edgeDice);
      });
      function sitToggle(key, label, title) {
        var on = !!rs[key];
        return el("button.btn.sm", { title: title, style: { fontSize: "9px", color: on ? "var(--gold)" : "var(--text4)", borderColor: on ? "var(--gold)" : "var(--border)" },
          onclick: function () { rs[key] = !on; rs.result = null; EN.app.render(); } }, (on ? "✓ " : "") + label);
      }
      rollKids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } },
        [el("span.mono", { style: { fontSize: "9px", color: "var(--success)", letterSpacing: ".1em", minWidth: "38px" }, text: "EDGE" }),
         el("span.mono", { style: { fontSize: "13px", color: "var(--text)" }, title: tbEdgeTip(edge), text: edge.points + " → " + edge.pool.label })
        ].concat(kitToggles, [
          sitToggle("prep", "PREP +1", "Special Preparation: +1 Edge Die"),
          sitToggle("narrative", "ADV +1", "Narrative Advantage (GM discretion): +1 Edge Die")
        ])));
      // one Focus per roll: when both a Skill Focus and a Tool Focus cover
      // this Work Interval, pick which one fires (never both)
      if (edge.focusCands.length > 1) {
        rollKids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", margin: "4px 0 0 44px" } },
          [el("span.mono", { title: "Only one Focus Caliber can apply to a single roll", style: { fontSize: "9px", color: "var(--gold)", letterSpacing: ".1em" }, text: "FOCUS" })]
          .concat(edge.focusCands.map(function (cand) {
            var on = edge.focusPick && edge.focusPick.key === cand.key;
            return el("button.btn.sm", { title: cand.label + ". Only one Focus Caliber can apply per roll; click to make this the one that fires.",
              style: { fontSize: "9px", color: on ? "var(--gold)" : "var(--text4)", borderColor: on ? "var(--gold)" : "var(--border)" },
              onclick: function () { rs.focusKey = cand.key; rs.result = null; EN.app.render(); } }, (on ? "● " : "") + cand.label.replace(/^Caliber from /, ""));
          }))));
      }
      // SNAG row: risk-level quick picker (Dicey Situations table) + fine adjust
      var riskBtns = ((EN.resolution && EN.resolution.pool && EN.resolution.pool.snagAssign) || []).map(function (r) {
        var n = Number(r.dice), on = snag.base === n;
        return el("button.btn.sm" + (on ? ".primary" : ""), { title: r.risk + ": " + r.desc, style: { fontSize: "10px" },
          onclick: function () { rs.result = null; tbSetSnag(p.id, n); } }, String(n));
      });
      rollKids.push(el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } },
        [el("span.mono", { style: { fontSize: "9px", color: "var(--danger)", letterSpacing: ".1em", minWidth: "38px" }, text: "SNAG" })]
        .concat(riskBtns)
        .concat([
          el("button.btn.sm", { title: "One less Snag Die", disabled: snag.base <= 0, onclick: function () { rs.result = null; tbSetSnag(p.id, snag.base - 1); } }, "−"),
          el("button.btn.sm", { title: "One more Snag Die: bad conditions, missing kits, rushed work", disabled: snag.base >= 13, onclick: function () { rs.result = null; tbSetSnag(p.id, snag.base + 1); } }, "+"),
          el("span.mono", { style: { fontSize: "13px", color: "var(--text)" }, title: "GM-set difficulty per Work Interval (Snag past 5 sharpens into d12s)", text: snag.total + " → " + snagPool.label }),
          snag.untrained ? tbChip("+2 UNTRAINED", "var(--warn)", "Untrained in " + p.skill + ": +2 Snag Dice") : null
        ])));
      // ROLL + result
      rollKids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [
        el("button.btn.sm.primary", {
          title: "Roll the Work Interval: Edge vs Snag, each die reads 6-9 as 1 and 10+ as 2, Margin = successes - failures",
          onclick: function () {
            var eRes = EN.engine.rollDicePool(EN.engine.buildEdgePool(edge.points));
            var sRes = EN.engine.rollDicePool(snagPool);
            var margin = eRes.total - sRes.total;
            rs.result = { edge: eRes, snag: sRes, margin: margin, outcome: CRAFT().marginToOutcomeKey(margin) };
            rs.animating = true;
            rs.animToken = (rs.animToken || 0) + 1;
            EN.app.render();
            tbAnimateRoll(p.id);
          }
        }, "⚄ ROLL WORK INTERVAL"),
        !rs.result ? el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: "or roll at the table and log the outcome below" }) : null
      ]));
      if (rs.result) {
        var res = rs.result, oc = CRAFT().outcome(res.outcome);
        var diceRow = function (label, color, r, word) {
          return el("div.row.wrap", { style: { gap: "3px", alignItems: "center", marginTop: "4px" } },
            [el("span.mono", { style: { fontSize: "9px", color: color, letterSpacing: ".1em", minWidth: "38px" }, text: label })]
            .concat(r.rolls.length ? r.rolls.map(function (die) { return tbDieFace(die, color, rs.animating); })
                                   : [el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: "no dice" })])
            .concat([rs.animating
              ? el("span.mono", { dataset: { tot: "1", word: word }, style: { fontSize: "11px", color: "var(--text3)", marginLeft: "5px" }, text: "= · " + word })
              : el("span.mono", { style: { fontSize: "11px", color: "var(--text2)", marginLeft: "5px" }, text: "= " + r.total + " " + word })]));
        };
        rollKids.push(diceRow("EDGE", "var(--success)", res.edge, "successes"));
        rollKids.push(diceRow("SNAG", "var(--danger)", res.snag, "failures"));
        if (!rs.animating) {
          rollKids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "6px" } }, [
            el("span.mono", { style: { fontSize: "13px", color: oc ? oc.color : "var(--text)" }, text: "MARGIN " + (res.margin >= 0 ? "+" : "") + res.margin + " · " + (oc ? oc.name : res.outcome) }),
            el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: (oc ? oc.note + ". " : "") + "Log it below." })
          ]));
        }
      }
      rollBox = el("div", { dataset: { roll: p.id }, style: { padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "4px", background: "rgba(0,0,0,.15)", margin: "6px 0 8px" } }, rollKids);
    }
    // progress bar
    var bar = el("div", { style: { margin: "2px 0 8px" } }, [
      el("div.row.between", { style: { marginBottom: "3px" } }, [
        el("span.mono", { style: { fontSize: "11px", color: done ? "var(--success)" : "var(--accent)" }, text: "PROGRESS " + p.progress + " / " + (p.target || "?") }),
        el("span.mono", { style: { fontSize: "10px", color: "var(--text3)" }, text: tier.time })
      ]),
      el("div", { style: { height: "8px", borderRadius: "4px", background: "var(--bg)", border: "1px solid var(--border)", overflow: "hidden" } },
        [el("div", { style: { height: "100%", width: pct + "%", background: done ? "var(--success)" : "var(--accent)", transition: "width .2s" } })])
    ]);
    // materials
    var cost = p.salvaged ? 0 : (p.materialCost || 0);
    var matKids;
    if (p.materialsSecured) {
      matKids = [el("span.chip", { style: { fontSize: "9.5px", color: "var(--success)", borderColor: "var(--success)" }, text: p.salvaged ? "✓ SALVAGED" : "✓ MATERIALS SECURED" })];
    } else if ((p.materialCost || 0) > 0) {
      matKids = [
        // a Build's materials are half list; an Armor Repair's parts are priced per
        // point of DR restored, so the caption must not claim the wrong rate
        el("span.mono", { style: { fontSize: "11px", color: "var(--text2)" },
          text: "Materials " + fmtG(cost) + (p.salvaged ? " (salvaged)" : p.repairKey ? " (repair parts)" : " (half list)") }),
        el("button.btn.sm", { style: { color: "var(--flow)", borderColor: "var(--flow)" }, title: "Salvage parts from broken gear to cut the material cost", onclick: function () { tbToggleSalvage(p.id); } }, p.salvaged ? "UNSALVAGE" : "SALVAGE"),
        el("button.btn.sm.primary", { title: "Pay the material cost from your Glimmer", onclick: function () { tbSecure(p.id); } }, cost ? "SECURE · " + fmtG(cost) : "SECURE (FREE)")
      ];
    } else {
      matKids = [el("span.help", { style: { fontSize: "11px", color: "var(--text3)", margin: 0 }, text: "No material cost." })];
    }
    var materials = el("div.row.wrap", { style: { gap: "8px", alignItems: "center", margin: "0 0 8px" } }, matKids);
    // work interval logger; a rolled result pre-highlights its matching outcome
    // (withheld while the dice are still tumbling, no spoilers)
    var rolledKey = (rs.result && !rs.animating) ? rs.result.outcome : null;
    var logRow = el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } },
      [el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "2px" }, text: "LOG INTERVAL" })].concat(
        CRAFT().outcomes.map(function (o) {
          var isRolled = rolledKey === o.key;
          return el("button.btn.sm", { title: o.note + (isRolled ? " (matches your roll)" : ""),
            style: { color: o.color, borderColor: o.color, fontSize: "10px", boxShadow: isRolled ? "0 0 8px " + o.color : null, background: isRolled ? "rgba(255,255,255,.06)" : null },
            onclick: function () { rs.result = null; tbLog(p.id, o.key); } },
            (isRolled ? "● " : "") + o.name + (o.progress ? " +" + o.progress : " +0"));
        })).concat([
          (p.log || []).length ? el("button.btn.sm", { title: "Undo the last interval", style: { color: "var(--text3)" }, onclick: function () { tbUndo(p.id); } }, "↶ UNDO") : null
        ]));
    // footer: over-engineer toggle + complete
    var foot = el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [
      el("label.row.wrap", { style: { gap: "6px", alignItems: "center", fontSize: "11px", color: "var(--text3)", cursor: "pointer" } }, [
        el("input", { type: "checkbox", checked: !!p.overEngineered, onchange: function () { tbToggleOverEng(p.id); } }),
        document.createTextNode("Over-engineer (past Max Mods → Prototype + flaw)")
      ]),
      // Completing is gated on the materials being paid for. The bill is not optional
      // and never was; the button simply used to ignore it.
      done ? el("button.btn.sm.primary", {
        disabled: tbUnpaid(p),
        title: tbUnpaid(p) ? "Secure the materials first: " + fmtG(p.materialCost || 0) + " in parts, or mark the Project salvaged." : "Finish the Project",
        onclick: function () { tbComplete(p); } }, p.addOnComplete ? "✓ COMPLETE · ADD TO STASH" : "✓ COMPLETE") : null,
      (done && tbUnpaid(p)) ? el("span.help", { style: { margin: 0, fontSize: "10.5px", color: "var(--warn)" },
        text: "Materials still owed: " + fmtG(p.materialCost || 0) + "." }) : null
    ]);
    return el("div.feature", { style: { borderLeftColor: done ? "var(--success)" : (TB_TIER_COLOR[p.overEngineered ? "prototype" : p.tier] || "var(--border2)") } },
      [head, rollBox, bar, materials, logRow, foot]);
  }

  function tbProjects(ch, d) {
    var projects = ch.projects || [];
    var kids = [];
    if (_tbForm) kids.push(tbCustomForm(ch));
    else kids.push(el("button.btn.sm", { style: { marginBottom: "12px" }, onclick: function () { _tbForm = { name: "", kind: "custom", skill: "Engineering", tier: "standard" }; EN.app.render(); } }, "+ NEW CUSTOM PROJECT"));
    if (!projects.length) {
      kids.push(el("div.muted-box", { style: { padding: "22px 18px", textAlign: "center", borderColor: "var(--border2)" },
        html: "<div style='font-size:12px;color:var(--text3)'>No active Projects. Start one from a Blueprint below, or open a custom Project above.</div>" }));
    } else {
      projects.forEach(function (p) { kids.push(tbProjectCard(ch, d, p)); });
    }
    return EN.ui.panel("Projects", projects.length + " ACTIVE · DICE POOL METHOD", kids, { corners: true });
  }

  /* ---- Panel 3: Blueprints (recipes derived from the gear catalog) ---- */
  function tbRecipeRow(ch, it) {
    var skill = CRAFT().skillForItem(it), tierKey = CRAFT().tierForItem(it), cost = CRAFT().materialCost(it);
    return el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", padding: "5px 0", borderTop: "1px solid rgba(35,48,68,.4)" } }, [
      el("div.row.wrap", { style: { gap: "7px", alignItems: "center", flex: "1 1 auto", minWidth: 0 } }, [
        el("span", { style: { fontWeight: 600, fontSize: "12.5px" }, text: it.name }),
        tbTierChip(tierKey),
        tbSkillChip(skill),
        // the tooltip has to quote the same figure the cost is half OF, which is
        // listPrice and not `price`: a leased row's price is a deposit and a
        // Nexus-only row has no Glimmer price at all
        el("span.mono", { style: { fontSize: "10.5px", color: "var(--gold)" }, title: "Materials cost half of " + fmtG(CRAFT().listPrice(it)) + ", what this item is worth", text: "mat " + fmtG(cost) })
      ]),
      el("button.btn.sm.primary", { title: "Open a Build Project for this item", onclick: function () {
        tbStart({ kind: "build", name: "Build " + it.name, itemName: it.name, skill: skill, tier: tierKey, materialCost: cost });
      } }, "+ PROJECT")
    ]);
  }
  function tbBlueprints(ch) {
    var q = (_tbQuery || "").trim().toLowerCase();
    var items = catalog().filter(function (it) { return it && it.name && !it.upkeep; });
    var groups = {};
    items.forEach(function (it) { var c = tbRecipeClass(it); (groups[c] = groups[c] || []).push(it); });
    var ORDER = ["Weapons", "Armor", "Shields & Foci", "Ammo & Munitions", "Weapon Mods", "Armor Mods", "Tools & Kits", "Field Gear"];
    var kids = [
      el("p.help", { style: { margin: "0 0 8px", fontSize: "11.5px" }, text: "Anything you can name, you can build. Each shows its Project tier, primary Skill, and material cost (half list price). Open one as a Build Project." }),
      el("input", { type: "text", value: _tbQuery, placeholder: "Search blueprints…", style: { width: "100%", marginBottom: "10px" }, oninput: function (e) { _tbQuery = e.target.value; EN.app.render(); } })
    ];
    var shown = 0;
    ORDER.forEach(function (cls) {
      var list = (groups[cls] || []).filter(function (it) { return !q || it.name.toLowerCase().indexOf(q) !== -1; });
      if (!list.length) return;
      list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      shown += list.length;
      var key = "tb-recipe-" + cls, open = !!_open[key] || !!q;
      kids.push(el("div.section-title.clickable", { style: { margin: "8px 0 2px", cursor: "pointer" }, onclick: function () { _open[key] = !open; EN.app.render(); } },
        [document.createTextNode(cls + "  (" + list.length + ")"), el("span.line"), el("span.collapse-caret", { style: { marginLeft: "4px" }, text: open ? "▾" : "▸" })]));
      if (open) list.forEach(function (it) { kids.push(tbRecipeRow(ch, it)); });
    });
    if (!shown) kids.push(el("p.help", { style: { margin: "6px 0 0", color: "var(--text3)" }, text: "No blueprints match that search." }));
    return EN.ui.panel("Blueprints", "RECIPES · TIER · SKILL · MATERIALS", kids, { corners: true });
  }

  /* ---- Panel 4: Modding & Mounts reference ---- */
  function tbModding() {
    var R = CRAFT().rules || {};
    var kids = [
      el("p.help", { style: { margin: "0 0 6px" }, html: "<b style='color:var(--text2)'>One Project per Mod.</b> " + (R.oneProjectPerMod || "") }),
      el("p.help", { style: { margin: "0 0 6px" }, html: "<b style='color:var(--ember)'>Over-Engineering.</b> " + (R.overEngineering || "") }),
      el("p.help", { style: { margin: "0 0 6px" }, html: "<b style='color:var(--gold)'>Materials.</b> " + (R.materials || "") }),
      el("p.help", { style: { margin: "0 0 10px" }, html: "<b style='color:var(--accent)'>Kits.</b> " + (R.kits || "") }),
      el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "2px" }, text: "SLOTTED MODS LIVE AT" }),
        el("button.btn.sm", { style: { color: "var(--ember)", borderColor: "var(--ember)" }, onclick: function () { _bench = "ballistics"; EN.app.render(); } }, "⊚ ARMS TABLE"),
        el("button.btn.sm", { style: { color: "var(--success)", borderColor: "var(--success)" }, onclick: function () { _bench = "armor"; EN.app.render(); } }, "⛨ IMPACT TABLE")
      ])
    ];
    return EN.ui.panel("Modding & Mounts", "ONE MOD PER MOUNT · MAX MODS · OVER-ENGINEERING", kids, { corners: true });
  }

  function fabricationBench(ch) {
    var d = EN.engine.derive(ch);
    return [tbFabProfile(ch, d), tbProjects(ch, d), tbBlueprints(ch), tbModding()];
  }

  /* ============================================================================
     TECH BAY (Smartdeck & Cyberware mod integration). The only bench that
     installs Smartdeck hardware mods (the #GRID tab shows them read-only).
     Reads the active rig from ch.grid (selected on #GRID) and slots mods from
     EN.grid.mods into ch.grid.deckMods, capped by the deck's modSlots. Cyberware
     mods have no catalog yet, so that half is a work-in-progress placeholder.
     ============================================================================ */
  /* Mods belong to the DECK on the bench, not to the character, so this edits the loadout
     under that deck's own entry key. Kitting out one Advanced Smartdeck leaves a second one
     bare, and swapping back finds the first exactly as it was built. */
  function tbSetDeckMods(fn, deckKey) {
    if (!deckKey) return;
    store.update(function (c) {
      c.grid = c.grid || {};
      if (!c.grid.deckMods || typeof c.grid.deckMods !== "object" || Array.isArray(c.grid.deckMods)) c.grid.deckMods = Object.create(null);
      var next = fn((c.grid.deckMods[deckKey] || []).slice());
      if (next && next.length) c.grid.deckMods[deckKey] = next; else delete c.grid.deckMods[deckKey];
    });
  }
  function tbSmartdeckMods(ch, d) {
    var G = EN.grid || {}, grid = ch.grid || {}, deck = d.grid && d.grid.deck;
    var kids = [];
    if (!deck || deck.type !== "smartdeck") {
      kids.push(el("div.muted-box", { style: { padding: "22px 18px", textAlign: "center", borderColor: "var(--flow)" },
        html: "<div style='font-family:var(--disp);font-size:13px;letter-spacing:.18em;color:var(--flow)'>⌬ NO SMARTDECK ON THE BENCH</div><div style='font-size:12px;color:var(--text3);margin-top:8px;max-width:460px;margin-left:auto;margin-right:auto'>Set a Smartdeck as your active rig on the #GRID tab, then bring it here to slot hardware mods. B&amp;E Buddies have no mod slots.</div>" }));
      kids.push(el("div.row", { style: { justifyContent: "center", marginTop: "10px" } }, [
        el("button.btn.sm", { style: { color: "var(--flow)", borderColor: "var(--flow)" }, onclick: function () { EN.app.gotoTab("grid"); } }, "→ OPEN #GRID")
      ]));
      return EN.ui.panel("Smartdeck Mods", "HARDWARE MOD SLOTS", kids, { corners: true });
    }
    var installed = deck.mods || [], used = 0;   // this deck's loadout, resolved by the engine
    (G.mods || []).forEach(function (m) { if (installed.indexOf(m.key) !== -1) used += m.slots; });
    var slots = deck.modSlots;
    function ownsMod(m) { return (ch.equipment || []).some(function (e) { return e.name === m.name && e.qty > 0; }); }
    var listMods = (G.mods || []).filter(function (m) { return ownsMod(m) || installed.indexOf(m.key) !== -1; });
    kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "8px" } }, [
      el("span.mono", { style: { fontSize: "18px", color: used > slots ? "var(--danger)" : "var(--accent)" }, html: used + " <span style='font-size:12px;color:var(--text3)'>/ " + slots + " mod slots</span>" }),
      el("span.chip", { style: { fontSize: "9.5px", color: "var(--flow)", borderColor: "var(--flow)" }, title: "Your active rig, chosen on the #GRID tab" }, deck.tier + " Smartdeck")
    ]));
    if (slots === 0) { kids.push(el("p.help", { style: { margin: "0" }, text: "A Standard Smartdeck has no mod slots. Upgrade to an Improved deck or higher to install hardware mods." })); return EN.ui.panel("Smartdeck Mods", deck.tier.toUpperCase() + " SMARTDECK", kids, { corners: true }); }
    if (!listMods.length) kids.push(el("p.help", { style: { margin: "0 0 6px" }, text: "No hardware mods in your Stash. Buy them in the gray market (Rigs), then slot them here." }));
    listMods.forEach(function (m) {
      var on = installed.indexOf(m.key) !== -1, fits = used + m.slots <= slots;
      kids.push(el("div.feature", { style: { borderLeftColor: on ? "var(--accent)" : "var(--border2)" } }, [
        el("div.row.between", { style: { alignItems: "center", gap: "8px" } }, [
          el("div.row.wrap", { style: { gap: "7px", alignItems: "center", flex: "1 1 auto", minWidth: 0 } }, [
            el("span", { style: { fontWeight: 600, fontSize: "13px" }, text: m.name }),
            el("span.chip", { style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" } }, m.type),
            el("span.chip", { style: { fontSize: "9px", color: "var(--text3)", borderColor: "var(--border2)" } }, m.slots + (m.slots === 1 ? " slot" : " slots"))
          ]),
          on ? el("button.btn.sm.primary", { title: "Remove this mod, freeing its slots", onclick: function () { tbSetDeckMods(function (l) { return l.filter(function (k) { return k !== m.key; }); }, deck.key); } }, "✓ INSTALLED")
             : el("button.btn.sm", { disabled: !fits, title: fits ? "Slot this mod (bench work)" : "Not enough mod slots", style: fits ? { color: "var(--accent)", borderColor: "var(--accent)" } : null, onclick: function () { tbSetDeckMods(function (l) { return l.concat([m.key]); }, deck.key); } }, fits ? "INSTALL" : "NO SLOTS")
        ]),
        el("p.help", { style: { margin: "4px 0 0" }, text: m.text })
      ]));
    });
    return EN.ui.panel("Smartdeck Mods", deck.tier.toUpperCase() + " SMARTDECK · " + used + " / " + slots + " SLOTS", kids, { corners: true });
  }
  /* ---- Cyberware platform slots ----------------------------------------
     A Cyberarm or Cyberleg carries slots by tier (2/3/4). A compatible mod
     seated in one adds no SP to Total Static, because the platform already
     paid that cost. Only two mods are limb-compatible in the book: Hand Razors
     in a Cyberarm, Spring Joints in a Cyberleg. */
  function tbCyberwareMods(ch, d) {
    var defs = ((EN.cyberware || {}).items) || [];
    function defOf(k) { return defs.filter(function (i) { return i.key === k; })[0]; }
    function slotsOf(cw) {
      var def = defOf(cw.key); if (!def) return 0;
      var t = (def.tiers || []).filter(function (x) { return x.tier === cw.tier; })[0];
      return (t && t.slots) || 0;
    }
    var installed = (ch.cyberware || []).filter(function (cw) { return cw && typeof cw === "object"; });
    var platforms = installed.filter(function (cw) { var def = defOf(cw.key); return def && def.platform; });
    var slottedMap = (d && d.platformSlotted) || {};
    var kids = [];

    if (!platforms.length) {
      kids.push(el("div.muted-box", { style: { padding: "18px", textAlign: "center" },
        html: "<div style='font-size:12px;color:var(--text3)'>No platform chrome installed. A <b>Cyberarm</b> or <b>Cyberleg</b> carries mod slots; a compatible mod seated in one costs no Static.</div>" }));
      return EN.ui.panel("Cyberware Mods", "PLATFORM SLOTS", kids, { corners: true });
    }

    platforms.forEach(function (plat) {
      var cap = slotsOf(plat);
      var seated = installed.filter(function (cw) { return cw.slottedIn === plat.key && slottedMap[cw.key]; });
      kids.push(el("div.section-title", { style: { margin: "10px 0 4px" } },
        [document.createTextNode(plat.name + (plat.tier ? " \u00b7 " + plat.tier : "")), el("span.line"),
         el("span.mono", { style: { fontSize: "9.5px", color: seated.length >= cap ? "var(--warn)" : "var(--text3)" },
           text: seated.length + " / " + cap + " SLOTS" })]));

      if (seated.length) {
        kids.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "6px" } }, seated.map(function (cw) {
          return el("button.btn.sm", { title: "Pull " + cw.name + " out of the platform; it starts paying its own " + cw.sp + " SP again",
            style: { color: "var(--gold)", borderColor: "var(--gold)" },
            onclick: function () {
              store.update(function (c) {
                (c.cyberware || []).forEach(function (x) { if (x && x.key === cw.key) delete x.slottedIn; });
              });
              toast(cw.name + " pulled from " + plat.name + "; it costs " + cw.sp + " SP again.");
              EN.app.render();
            } }, "\u2716 " + cw.name + " \u00b7 \u22120 SP");
        })));
      }

      // compatible, installed, and not already seated somewhere
      var avail = installed.filter(function (cw) {
        var def = defOf(cw.key);
        return def && def.platformHost === plat.key && !slottedMap[cw.key];
      });
      if (!avail.length) {
        kids.push(el("p.help", { style: { margin: "0 0 8px", fontSize: "11px", color: "var(--text3)" },
          text: seated.length ? "Nothing else compatible is installed."
            : "Install a compatible mod to seat it here. This platform takes: "
              + defs.filter(function (i) { return i.platformHost === plat.key; }).map(function (i) { return i.name; }).join(", ") + "." }));
      } else {
        kids.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "8px" } }, avail.map(function (cw) {
          var full = seated.length >= cap;
          return el("button.btn.sm", { disabled: full,
            title: full ? plat.name + " has no free slot." : "Seat " + cw.name + " in " + plat.name + "; it stops adding its " + cw.sp + " SP to Total Static",
            onclick: function () {
              store.update(function (c) {
                (c.cyberware || []).forEach(function (x) { if (x && x.key === cw.key) x.slottedIn = plat.key; });
              });
              toast(cw.name + " seated in " + plat.name + "; its " + cw.sp + " SP no longer counts.");
              EN.app.render();
            } }, "+ " + cw.name + " \u00b7 \u2212" + cw.sp + " SP");
        })));
      }
    });

    var saved = installed.filter(function (cw) { return slottedMap[cw.key]; })
      .reduce(function (t, cw) { return t + (cw.sp || 0); }, 0);
    kids.push(el("p.help", { style: { margin: "6px 0 0", fontSize: "11px" },
      text: "A compatible mod seated in a platform adds no SP to Total Static; the platform already paid it. "
        + (saved ? "You are currently saving " + saved + " SP." : "Nothing is seated yet.")
        + " A mod that is not compatible cannot occupy a slot and pays its full SP." }));
    return EN.ui.panel("Cyberware Mods", "PLATFORM SLOTS", kids, { corners: true });
  }
  function techBay(ch) {
    var d = EN.engine.derive(ch);
    return [tbSmartdeckMods(ch, d), tbCyberwareMods(ch, d)];
  }

  /* ============================ GARAGE (Vehicle Ops) ========================
     The Garage runs Vehicle Ops: live math for operating a ride. Picking a
     chassis from the catalog (EN.vehicles) fills in its category, type and
     Handling from the Part 2 table; "Custom" leaves all three free for a
     ride the story invented. Category proficiency reads off the sheet. Chase Check, d20 Method: Agility or Tech Modifier
     + Vehicle Proficiency Bonus (if proficient) + Handling. Dice Pool Method:
     Edge Dice from the same sources. A Vehicle Focus naming the specific
     type adds Caliber to attack rolls, vehicle checks, AND damage rolls;
     a matching Specialization adds crit 19-20 (d20) and +2 Edge Dice (pools).
     Untrained: the check is allowed but rolls with Snag, and the GM can bar
     operation entirely for complex, restricted, or specialized vehicles. */
  var _garage = { chassis: "", cat: "Ground Vehicles", type: "", handling: 0, attr: "AGI", bar: false };
  // a catalog chassis carries its own category, type and Handling; selecting one
  // fills all three, and the fields stay editable for a custom ride
  function garageProfiles() { return (EN.vehicles && EN.vehicles.profiles) || []; }
  function garageCatFor(profileCat) {
    var list = (EN.rules.gear && EN.rules.gear.vehicles) || [];
    return list.filter(function (c) { return c === profileCat || c.indexOf(profileCat) === 0; })[0] || list[0];
  }
  function garagePickChassis(name) {
    _garage.chassis = name;
    var v = (EN.vehicles && EN.vehicles.byName && EN.vehicles.byName[name]) || null;
    if (!v) return;                       // "Custom" leaves the fields alone
    _garage.cat = garageCatFor(v.category);
    _garage.type = v.name;
    _garage.handling = v.handling;
  }

  /* ---- Garage panel 2: fit Vehicle Mods to an owned vehicle -------------- */
  function garageMods(ch) {
    var owned = ownedVehicles(ch);
    var kids = [];
    if (!owned.length) {
      kids.push(el("div.muted-box", { style: { padding: "18px", textAlign: "center" },
        html: "<div style='font-size:12px;color:var(--text3)'>You do not own a vehicle yet. Buy or lease one in the <b>Gray Market</b>, then fit mods here.</div>" }));
      return EN.ui.panel("Vehicle Mods", "NO VEHICLE OWNED", kids, { corners: true });
    }
    owned.forEach(function (vRow) {
      var vIt = vRow.it, vKey = vRow.key;
      var prof = vehicleProfileOf(vIt.name);
      if (!prof) return;
      var lo = vehicleLoadout(ch, vKey);
      var legal = aggregateVehicleLegality(prof, lo);
      var full = lo.length >= prof.modSlots;
      kids.push(el("div.section-title", { style: { margin: "10px 0 4px" } },
        [document.createTextNode(vRow.label), el("span.line"),
         el("span.mono", { style: { fontSize: "9.5px", color: full ? "var(--warn)" : "var(--text3)" },
           text: lo.length + " / " + prof.modSlots + " SLOTS" }),
         el("span.chip", { title: "Strictest tag among the vehicle and everything mounted on it",
           style: { fontSize: "9px", marginLeft: "6px", color: LEGAL_COLOR[legal] || "var(--text3)", borderColor: LEGAL_COLOR[legal] || "var(--border)" },
           text: legal.toUpperCase() })]));
      // fitted
      if (lo.length) {
        kids.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "6px" } }, lo.map(function (k) {
          var m = EN.vehicles.byKey[k] || { name: k };
          return el("button.btn.sm", { title: (m.effect || "") + "  (click to pull it)",
            style: { color: "var(--gold)", borderColor: "var(--gold)" },
            onclick: function () { removeVehicleMod(vKey, k); reRender(); } }, "\u2716 " + m.name);
        })));
      }
      // installable: owned, free, and fitting this chassis
      var avail = VMODS().filter(function (m) {
        return lo.indexOf(m.key) === -1 && availableVehicleModQty(ch, m) > 0 && EN.vehicles.modFits(m, prof);
      });
      if (!avail.length) {
        kids.push(el("p.help", { style: { margin: "0 0 8px", fontSize: "11px", color: "var(--text3)" },
          text: "No owned mods fit this chassis right now. Vehicle Mods are bought in the Gray Market under Vehicles." }));
      } else {
        kids.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "8px" } }, avail.map(function (m) {
          return el("button.btn.sm", { disabled: full, title: m.effect + "  (fits " + m.fits + ")",
            onclick: function () { tryInstallVehicleMod(vIt, vKey, prof, lo, m.key); reRender(); } }, "+ " + m.name);
        })));
      }
      // mods owned but blocked by the Fits gate, so the reason is visible
      var misfit = VMODS().filter(function (m) {
        return lo.indexOf(m.key) === -1 && availableVehicleModQty(ch, m) > 0 && !EN.vehicles.modFits(m, prof);
      });
      if (misfit.length) {
        kids.push(el("p.help", { style: { margin: "0 0 10px", fontSize: "10.5px", color: "var(--text4)" },
          text: "Owned but will not mount on a " + prof.category + " chassis: " + misfit.map(function (m) { return m.name + " (" + m.fits + ")"; }).join(", ") + "." }));
      }
    });
    kids.push(el("p.help", { style: { margin: "6px 0 0", fontSize: "11px" },
      text: "Mod Slots are 1 + the vehicle's Tier. One mod per slot, fitting or pulling is bench work in downtime, and a mod never lowers a vehicle's Legality, it only raises the heat." }));
    return EN.ui.panel("Vehicle Mods", "FIT & PULL \u00b7 BENCH WORK", kids, { corners: true });
  }

  function garageBench(ch) {
    var d = EN.engine.derive(ch);
    var eng = EN.engine, R = EN.rules;
    var cat = _garage.cat;
    var tier = eng.effectiveGearTier(ch, "vehicles", cat);
    var tierInfo = R.profTiers[tier] || R.profTiers.untrained;
    var untrained = tier === "untrained";
    var typeName = (_garage.type || "").trim();
    var focus = typeName ? eng.focusesFor(ch, "vehicles", cat).filter(function (f) { return eng.aspectMatches(f.aspect, typeName); })[0] : null;
    var specRec = eng.specFor(ch, "vehicles", cat);
    var spec = typeName && specRec && eng.aspectMatches(specRec.aspect, typeName) ? specRec : null;
    var cal = focus ? (d.caliber || 1) : 0;
    var mod = d.attributes[_garage.attr].mod;
    var attrName = d.attributes[_garage.attr].name;
    var handling = Number(_garage.handling) || 0;
    var barred = _garage.bar && untrained;
    function reRender() { EN.app.render(); }
    // controls: chassis, category, vehicle type, Handling, governing attribute, GM bar
    var chassisSel = el("select", { style: { fontSize: "12px", width: "auto" },
      title: "Pick a chassis from the catalog to fill in its category, type and Handling",
      onchange: function () { garagePickChassis(this.value); reRender(); } },
      [el("option", { value: "", selected: !_garage.chassis, text: "Custom ride\u2026" })].concat(
        garageProfiles().map(function (v) {
          return el("option", { value: v.name, selected: v.name === _garage.chassis,
            text: v.name + " (" + (v.handling >= 0 ? "+" : "") + v.handling + ")" });
        })));
    var controls = el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "10px" } }, [
      chassisSel,
      el("select", { style: { fontSize: "12px", width: "auto" }, title: "Vehicle category (proficiency reads off your sheet)",
        onchange: function () { _garage.cat = this.value; reRender(); } },
        (R.gear.vehicles || []).map(function (c) { return el("option", { value: c, selected: c === cat, text: c }); })),
      el("input", { type: "text", value: _garage.type, placeholder: "vehicle type: Motorcycle, VTOL…",
        title: "The specific vehicle type you are operating; a Vehicle Focus naming it adds Caliber",
        style: { width: "200px", padding: "4px 9px", fontSize: "12.5px" },
        oninput: function () { _garage.type = this.value; reRender(); } }),
      el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em" }, text: "HANDLING" }),
      el("input", { type: "number", value: String(handling), min: "-3", max: "5",
        title: "The vehicle's Handling stat (GM-supplied); adds to Chase Checks",
        style: { width: "58px", padding: "4px 6px", fontSize: "12.5px" },
        oninput: function () { _garage.handling = this.value; reRender(); } }),
      el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em" }, text: "VIA" }),
      el("button.btn.sm" + (_garage.attr === "AGI" ? ".primary" : ""), { title: "Drive it by reflex", onclick: function () { _garage.attr = "AGI"; reRender(); } }, "AGILITY"),
      el("button.btn.sm" + (_garage.attr === "TEC" ? ".primary" : ""), { title: "Drive it by interface", onclick: function () { _garage.attr = "TEC"; reRender(); } }, "TECH")
    ]);
    var chips = el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginBottom: "8px" } }, [
      el("span.chip", { title: "Vehicle Proficiency in " + cat + (untrained ? "" : "; adds your Vehicle Proficiency Bonus to vehicle checks"),
        style: { fontSize: "9px", color: untrained ? "var(--warn)" : "var(--success)", borderColor: untrained ? "var(--warn)" : "var(--success)" } },
        cat.toUpperCase() + " · " + tierInfo.name.toUpperCase()),
      untrained ? el("span.chip", { title: "Untrained: the check is allowed but rolls with Snag", style: { fontSize: "9px", color: "var(--warn)", borderColor: "var(--warn)" } }, "UNTRAINED · SNAG") : null,
      focus ? el("span.chip", { title: "Skill Focus: " + cat + " (" + focus.aspect + ")" + (focus.granted ? " · Free overlap Focus" : "") + ". Caliber applies to attack rolls, vehicle checks, and damage rolls with this vehicle type, outside the +15 static cap.",
        style: { fontSize: "9px", color: "var(--gold)", borderColor: "var(--gold)" } }, "FOCUS +" + cal) : null,
      spec ? el("span.chip", { title: "Specialization: " + cat + " (" + spec.aspect + "). Crit 19-20 on d20 vehicle rolls, +2 Edge Dice on pools.",
        style: { fontSize: "9px", color: "var(--flow)", borderColor: "var(--flow)" } }, "CRIT 19-20 · +2 EDGE") : null,
      untrained ? el("button.btn.sm", { title: "GM option: bar untrained operation entirely for complex, restricted, or specialized vehicles",
        style: { fontSize: "9px", color: _garage.bar ? "var(--danger)" : "var(--text4)", borderColor: _garage.bar ? "var(--danger)" : "var(--border)" },
        onclick: function () { _garage.bar = !_garage.bar; reRender(); } }, (_garage.bar ? "✓ " : "") + "GM: BAR UNTRAINED OPERATION") : null
    ]);
    var body = [controls, chips];
    if (barred) {
      body.push(el("div.muted-box", { style: { borderColor: "var(--danger)", color: "var(--danger)", textAlign: "left" },
        html: "⛔ <b>OPERATION BARRED.</b> The GM has barred untrained operation of this vehicle (complex, restricted, or specialized). Train " + cat + " on the #PRINT Advance tab to take the controls." }));
    } else {
      var d20Total = mod + tierInfo.d20 + handling + cal;
      var d20Tip = "d20 + " + attrName + " Modifier (" + eng.fmtMod(mod) + ")"
        + (tierInfo.d20 ? " + Vehicle Proficiency Bonus (" + eng.fmtMod(tierInfo.d20) + ")" : " (untrained, Snag)")
        + (handling ? " + Handling (" + eng.fmtMod(handling) + ")" : "")
        + (focus ? " + Caliber from " + cat + " (" + focus.aspect + ") Focus (" + eng.fmtMod(cal) + ", outside the +15 static cap)" : "")
        + (spec ? " · Specialization: crit 19-20" : "");
      var edgeParts = [];
      if (mod > 0) edgeParts.push({ label: attrName + " Modifier", value: mod });
      if (tierInfo.pool) edgeParts.push({ label: "Vehicle Proficiency Bonus (" + tierInfo.name + ")", value: tierInfo.pool });
      if (handling > 0) edgeParts.push({ label: "Handling", value: handling });
      if (focus) edgeParts.push({ label: "Caliber from " + cat + " (" + focus.aspect + ") Focus", value: cal });
      if (spec) edgeParts.push({ label: "Specialization: " + cat + " (" + spec.aspect + ")", value: 2 });
      var edgePts = edgeParts.reduce(function (a, p) { return a + p.value; }, 0);
      var edgePool = eng.buildEdgePool(edgePts);
      var edgeTip = edgeParts.length ? edgeParts.map(function (p) { return "+" + p.value + "  " + p.label; }).join("\n") : "No Edge sources yet";
      if (handling < 0) edgeTip += "\nNegative Handling (" + handling + ") reads as Snag Dice at the table.";
      body.push(el("div.row.wrap", { style: { gap: "16px", alignItems: "center", margin: "2px 0 8px" } }, [
        el("div", { title: d20Tip, style: { textAlign: "center", minWidth: "110px" } }, [
          el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "CHASE CHECK · D20" }),
          el("span.mono", { style: { fontSize: "22px", color: untrained ? "var(--warn)" : "var(--accent)" }, text: eng.fmtMod(d20Total) }),
          untrained ? el("div.mono", { style: { fontSize: "9px", color: "var(--warn)" }, text: "with Snag" }) : null
        ]),
        el("div", { title: edgeTip, style: { textAlign: "center", minWidth: "130px" } }, [
          el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "CHASE CHECK · DICE POOL" }),
          el("span.mono", { style: { fontSize: "22px", color: "var(--success)" }, text: edgePts + " → " + edgePool.label }),
          untrained ? el("div.mono", { style: { fontSize: "9px", color: "var(--warn)" }, text: "+2 Snag Dice untrained" }) : null
        ]),
        el("div", { title: "Vehicle attack rolls: d20 + " + attrName + " Modifier" + (tierInfo.d20 ? " + Vehicle Proficiency Bonus" : "") + (focus ? " + Caliber from the Focus" : ""), style: { textAlign: "center", minWidth: "90px" } }, [
          el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "VEHICLE ATTACK" }),
          el("span.mono", { style: { fontSize: "22px", color: "var(--ember)" }, text: eng.fmtMod(mod + tierInfo.d20 + cal) })
        ]),
        focus ? el("div", { title: "A Vehicle Focus adds Caliber to damage rolls with this vehicle type as well", style: { textAlign: "center", minWidth: "90px" } }, [
          el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "DAMAGE RIDER" }),
          el("span.mono", { style: { fontSize: "22px", color: "var(--gold)" }, text: eng.fmtMod(cal) })
        ]) : null
      ]));
      body.push(el("p.help", { style: { margin: "0", fontSize: "11px" },
        text: untrained
          ? "Untrained operation is allowed but rolls with Snag. The GM may bar operation entirely for complex, restricted, or specialized vehicles (toggle above)."
          : "Vehicle checks add your Vehicle Proficiency Bonus. A Vehicle Focus naming this type adds Caliber to attack rolls, vehicle checks, and damage rolls; a Specialization adds crit 19-20 and +2 Edge Dice." }));
    }
    return [EN.ui.panel("Garage · Vehicle Ops", cat.toUpperCase() + (typeName ? " · " + typeName.toUpperCase() : ""), body, { corners: true }),
            garageMods(ch)];
  }

  /* ---- payout splitter -------------------------------------------------
     The book's default: a fixer's cut comes off the top, then the rest splits
     evenly, and the remainder is left "to argue over" rather than rounded away.
     A crew may also vote 10 to 30 percent into a shared Crew Kit; that share is
     computed here but not tracked, because the Crew Kit is a table-level fund
     the sheet has no notion of. */
  var _split = { total: "", crew: 4, fixer: 15, kit: 0, open: false };
  function splitPayout(total, crew, fixerPct, kitPct) {
    total = Math.max(0, Math.floor(Number(total) || 0));
    crew = Math.max(1, Math.floor(Number(crew) || 1));
    var fixer = Math.floor(total * (Number(fixerPct) || 0) / 100);
    var afterFixer = total - fixer;
    var kit = Math.floor(afterFixer * (Number(kitPct) || 0) / 100);
    var pool = afterFixer - kit;
    var each = Math.floor(pool / crew);
    return { total: total, fixer: fixer, kit: kit, pool: pool, each: each, over: pool - each * crew };
  }
  function splitterPanel() {
    var r = splitPayout(_split.total, _split.crew, _split.fixer, _split.kit);
    function num(label, key, min, max, w, tip) {
      return el("div.row", { style: { gap: "4px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em" }, text: label }),
        el("input", { type: "number", value: String(_split[key]), min: String(min), max: String(max), title: tip,
          style: { width: w, padding: "4px 6px", fontSize: "12.5px" },
          oninput: function () { _split[key] = this.value; EN.app.render(); } })
      ]);
    }
    function stat(label, value, color) {
      return el("div", { style: { textAlign: "center", minWidth: "96px" } }, [
        el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: label }),
        el("span.mono", { style: { fontSize: "19px", color: color }, text: fmtG(value) })
      ]);
    }
    var kids = [
      el("div.row.wrap", { style: { gap: "10px", alignItems: "center", marginBottom: "10px" } }, [
        num("PAYOUT", "total", 0, 9999999, "110px", "The contract's lump sum, before anyone takes a cut"),
        num("CREW", "crew", 1, 12, "56px", "How many Freelancers split it"),
        num("FIXER %", "fixer", 0, 100, "56px", "The fixer's cut, taken off the top before the split"),
        num("CREW KIT %", "kit", 0, 100, "56px", "Optional shared fund; the book suggests 10 to 30 percent")
      ]),
      el("div.row.wrap", { style: { gap: "16px", alignItems: "center" } }, [
        stat("FIXER", r.fixer, "var(--ember)"),
        stat("CREW KIT", r.kit, "var(--flow)"),
        stat("EACH SHARE", r.each, "var(--success)"),
        el("div", { style: { textAlign: "center", minWidth: "96px" } }, [
          el("div", { style: { fontFamily: "var(--disp)", fontSize: "8.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "LEFT OVER" }),
          el("span.mono", { style: { fontSize: "19px", color: r.over ? "var(--gold)" : "var(--text4)" }, text: fmtG(r.over) })
        ]),
        r.each > 0 ? el("button.btn.sm", { title: "Credit one share to this character",
          style: { color: "var(--success)", borderColor: "var(--success)" },
          onclick: function () {
            store.update(function (c) { c.glimmer = (c.glimmer || 0) + r.each; });
            toast("Share of " + fmtG(r.each) + " credited.");
            EN.app.render();
          } }, "+ MY SHARE") : null
      ]),
      el("p.help", { style: { margin: "10px 0 0", fontSize: "11px" },
        text: (EN.economy && EN.economy.splitNote) || "" }),
      r.over ? el("p.help", { style: { margin: "4px 0 0", fontSize: "11px", color: "var(--gold)" },
        text: fmtG(r.over) + " does not divide evenly. Somebody always notices." }) : null
    ];
    return EN.ui.panel("Payout Splitter", "FIXER \u00b7 CREW KIT \u00b7 SHARES", kids, { corners: true });
  }

  var _hh = { open: false };
  var _newDebt = { kind: "Personal", holder: "", principal: "", clock: "" };

  /* every recurring cost the book defines, in one place: lifestyle and
     safehouse (weekly), gear and vehicle leases (their own 7-day clocks),
     Hypercare (monthly), licences, and debts. Nothing is invented here. */
  function activeLeases(ch) {
    return (ch.equipment || []).filter(function (e) {
      if (!(e.qty > 0) || e.leaseOwned) return false;
      var it = findItem(e.name);
      return !!(it && it.upkeep);
    });
  }
  function billsOverdue(ch) {
    var hh = ch.household || {};
    if (hh.due || hh.hypercareDue) return true;
    return activeLeases(ch).some(function (e) { return e.leaseDue; });
  }
  function billSection(title, kids) {
    return el("div", { style: { marginBottom: "14px" } },
      [el("div.section-title", { style: { margin: "0 0 6px" } }, [document.createTextNode(title), el("span.line")])].concat(kids));
  }
  function billsPanel(ch) {
    var E = ECON(), hh = ch.household || {}, w = householdWeekly(ch), out = [];

    /* --- lifestyle + safehouse, weekly --- */
    function pick(label, cur, opts, tip, apply) {
      return el("div.row", { style: { gap: "5px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em" }, text: label }),
        el("select", { style: { fontSize: "12px", width: "auto" }, title: tip,
          onchange: function () { var v = this.value; setHousehold(function (h) { apply(h, v); }); } },
          [el("option", { value: "", selected: !cur, text: "none" })].concat(
            opts.map(function (o) { return el("option", { value: o.v, selected: o.v === cur, text: o.v + " (" + fmtG(o.w) + "/wk)" }); })))
      ]);
    }
    out.push(billSection("Lifestyle & Safehouse \u00b7 weekly", [
      el("div.row.wrap", { style: { gap: "12px", alignItems: "center", marginBottom: "8px" } }, [
        pick("LIFESTYLE", hh.lifestyle, (E.lifestyleTiers || []).map(function (t) { return { v: t.tier, w: t.weekly }; }),
          "What it costs to live between jobs", function (h, v) { h.lifestyle = v; }),
        pick("SAFEHOUSE", hh.safehouse, (E.safehouseRent || []).map(function (r) { return { v: r.type, w: r.weekly }; }),
          "A base costs rent whether you sleep in it or not", function (h, v) { h.safehouse = v; })
      ]),
      el("div.row.wrap", { style: { gap: "6px", marginBottom: "8px", alignItems: "center" } },
        [el("span.mono", { style: { fontSize: "9px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "2px" }, text: "UPGRADES" })].concat(
          (E.safehouseUpgrades || []).map(function (u) {
            var on = (hh.upgrades || []).indexOf(u.name) !== -1;
            return el("button.btn.sm" + (on ? ".primary" : ""), {
              title: u.benefit + ". Build " + fmtG(u.cost) + (u.ongoingWeekly ? ", then " + fmtG(u.ongoingWeekly) + "/wk" : ", no ongoing cost") + ".",
              onclick: function () { setHousehold(function (h) {
                h.upgrades = h.upgrades || [];
                var i = h.upgrades.indexOf(u.name);
                if (i === -1) h.upgrades.push(u.name); else h.upgrades.splice(i, 1);
              }); } }, (on ? "\u2713 " : "") + u.name);
          }))),
      el("div.row.wrap", { style: { gap: "14px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "13px", color: w.total ? "var(--ember)" : "var(--text4)" },
          text: fmtG(w.total) + " / week" }),
        el("span.mono", { style: { fontSize: "11px", color: hh.due ? "var(--danger)" : "var(--text3)" },
          text: !w.total ? "nothing owed" : hh.due ? "DUE NOW" : "due in " + (hh.days || 7) + "d" }),
        (w.total && hh.due) ? el("button.btn.sm", { style: { color: "var(--danger)", borderColor: "var(--danger)" },
          title: w.lines.join(", "), onclick: payHousehold }, "PAY \u00b7 " + fmtG(w.total)) : null
      ])
    ]));

    /* --- leases already tracked elsewhere in the app --- */
    var leases = activeLeases(ch);
    out.push(billSection("Leases \u00b7 per 7 days", leases.length ? [
      el("div", null, leases.map(function (e) {
        var it = findItem(e.name), bo = buyoutCost(it);
        return el("div.row.wrap", { style: { gap: "10px", alignItems: "center", marginBottom: "4px" } }, [
          el("span", { style: { fontSize: "12.5px", minWidth: "190px" }, text: e.name }),
          el("span.mono", { style: { fontSize: "11.5px", color: "var(--ember)" }, text: fmtG(it.upkeep) + "/wk" }),
          el("span.mono", { style: { fontSize: "10.5px", color: e.leaseDue ? "var(--danger)" : "var(--text3)" },
            text: e.leaseDue ? "DUE NOW" : "due in " + (e.leaseDays == null ? 7 : e.leaseDays) + "d" }),
          e.leaseDue ? el("button.btn.sm", { style: { color: "var(--danger)", borderColor: "var(--danger)" },
            onclick: function () { payLease(e.id); EN.app.render(); } }, "PAY \u00b7 " + fmtG(it.upkeep)) : null,
          bo ? el("button.btn.sm", { style: { color: "var(--flow)", borderColor: "var(--flow)" },
            title: "Only the Buyout closes a lease; Upkeep just keeps the plan current.",
            onclick: function () { buyoutLease(e.id); EN.app.render(); } }, "BUYOUT \u00b7 " + fmtBuyout(bo)) : null
        ]);
      }))
    ] : [el("p.help", { style: { margin: 0, fontSize: "11px", color: "var(--text3)" },
      text: "No active leases. Leased armor, shields, mods and vehicles show up here with their installment clocks." })]));

    /* --- Hypercare, the book's only ongoing coverage contract, monthly --- */
    var hc = hypercareOf(ch);
    out.push(billSection("Hypercare \u00b7 monthly", [
      el("div.row.wrap", { style: { gap: "6px", marginBottom: "6px", alignItems: "center" } },
        [el("button.btn.sm" + (!hh.hypercare ? ".primary" : ""), {
          onclick: function () { setHousehold(function (h) { h.hypercare = ""; h.hypercareDue = false; h.hypercareDays = 30; }); } }, "none")].concat(
          (E.hypercareTiers || []).map(function (t) {
            var on = t.tier === hh.hypercare;
            return el("button.btn.sm" + (on ? ".primary" : ""), {
              title: t.coverage + ". " + t.response + ".",
              onclick: function () { setHousehold(function (h) { h.hypercare = t.tier; h.hypercareDays = 30; h.hypercareDue = false; }); } },
              t.tier + " (" + (t.currency === "nexus" ? fmtNx(t.cost) : fmtG(t.cost)) + ")");
          }))),
      hc ? el("div.row.wrap", { style: { gap: "14px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "13px", color: "var(--ember)" },
          text: (hc.currency === "nexus" ? fmtNx(hc.cost) : fmtG(hc.cost)) + " / month" }),
        el("span.mono", { style: { fontSize: "11px", color: hh.hypercareDue ? "var(--danger)" : "var(--text3)" },
          text: hh.hypercareDue ? "DUE NOW" : "due in " + (hh.hypercareDays || 30) + "d" }),
        hh.hypercareDue ? el("button.btn.sm", { style: { color: "var(--danger)", borderColor: "var(--danger)" },
          onclick: payHypercare }, "PAY \u00b7 " + (hc.currency === "nexus" ? fmtNx(hc.cost) : fmtG(hc.cost))) : null
      ]) : el("p.help", { style: { margin: 0, fontSize: "11px", color: "var(--text3)" }, text: E.hypercareNote || "" })
    ]));

    /* --- licences: the book gives ranges, so the app tracks what you hold --- */
    out.push(billSection("Licences & Papers", [
      el("div.row.wrap", { style: { gap: "6px", marginBottom: "6px" } },
        (E.licenses || []).map(function (l) {
          var on = (hh.licenses || []).indexOf(l.item) !== -1;
          return el("button.btn.sm" + (on ? ".primary" : ""), {
            title: fmtG(0).replace("0", "") + l.cost + ", renewed " + l.renewal,
            onclick: function () { setHousehold(function (h) {
              h.licenses = h.licenses || [];
              var i = h.licenses.indexOf(l.item);
              if (i === -1) h.licenses.push(l.item); else h.licenses.splice(i, 1);
            }); } }, (on ? "\u2713 " : "") + l.item);
        })),
      el("p.help", { style: { margin: 0, fontSize: "11px", color: "var(--text3)" },
        text: "The book prices these as ranges renewed monthly, quarterly, or as needed, so the exact number and cadence are the GM's call. Held papers are tracked here as a checklist." })
    ]));

    /* --- debts: holder and clock, no interest math --- */
    var debts = ch.debts || [];
    out.push(billSection("Debts", [
      debts.length ? el("div", null, debts.map(function (d, idx) {
        return el("div.row.wrap", { style: { gap: "10px", alignItems: "center", marginBottom: "4px" } }, [
          el("span.chip", { style: { fontSize: "9px" }, text: d.kind }),
          el("span", { style: { fontSize: "12.5px", minWidth: "150px" }, text: d.holder || "unnamed holder" }),
          el("span.mono", { style: { fontSize: "11.5px", color: "var(--gold)" }, text: d.principal || "?" }),
          el("span.mono", { style: { fontSize: "10.5px", color: "var(--text3)" }, text: d.clock || "no clock set" }),
          el("button.btn.sm", { title: "Settled, forgiven, or paid in something that is not money",
            onclick: function () { store.update(function (c) { (c.debts || []).splice(idx, 1); }); EN.app.render(); } }, "\u2716")
        ]);
      })) : el("p.help", { style: { margin: "0 0 6px", fontSize: "11px", color: "var(--text3)" },
        text: "No debts recorded. " + (E.debtNote || "") }),
      el("div.row.wrap", { style: { gap: "6px", alignItems: "center", marginTop: "6px" } }, [
        el("select", { style: { fontSize: "12px", width: "auto" },
          onchange: function () { _newDebt.kind = this.value; } },
          (E.debtKinds || []).map(function (k) { return el("option", { value: k, selected: k === _newDebt.kind, text: k }); })),
        el("input", { type: "text", placeholder: "holder", value: _newDebt.holder,
          style: { width: "150px", padding: "4px 8px", fontSize: "12.5px" },
          oninput: function () { _newDebt.holder = this.value; } }),
        el("input", { type: "text", placeholder: "principal", value: _newDebt.principal,
          style: { width: "110px", padding: "4px 8px", fontSize: "12.5px" },
          oninput: function () { _newDebt.principal = this.value; } }),
        el("input", { type: "text", placeholder: "clock: when it comes due", value: _newDebt.clock,
          style: { width: "180px", padding: "4px 8px", fontSize: "12.5px" },
          oninput: function () { _newDebt.clock = this.value; } }),
        el("button.btn.sm", { onclick: function () {
          if (!_newDebt.holder.trim()) { toast("A debt needs a holder. Somebody is owed."); return; }
          var d = { kind: _newDebt.kind, holder: _newDebt.holder.trim(), principal: _newDebt.principal.trim(), clock: _newDebt.clock.trim() };
          store.update(function (c) { c.debts = c.debts || []; c.debts.push(d); });
          _newDebt.holder = ""; _newDebt.principal = ""; _newDebt.clock = "";
          EN.app.render();
        } }, "+ ADD")
      ]),
      el("p.help", { style: { margin: "6px 0 0", fontSize: "11px", color: "var(--text4)" },
        text: "Principal, holder, and a clock. No interest is calculated: debt here escalates through pressure, not paperwork." })
    ]));

    return EN.ui.panel("Bills", "RECURRING COSTS \u00b7 LEASES \u00b7 DEBTS", out, { corners: true });
  }

  function workbenchView(ch) {
    var out = [];
    out.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "12px" } }, BENCHES.map(function (b) {
      var on = _bench === b.key;
      return el("button.btn.sm" + (on ? ".primary" : ""), { style: on ? { color: b.color, borderColor: b.color } : null,
        onclick: function () { _bench = b.key; EN.app.render(); } }, b.icon + " " + b.label);
    })));
    var b = BENCHES.find(function (x) { return x.key === _bench; }) || BENCHES[0];
    if (_bench === "ballistics") {
      out.push(el("p.help", { style: { margin: "0 0 10px", maxWidth: "720px" }, text: b.blurb }));
      ballisticsBench(ch).forEach(function (n) { out.push(n); });
      return out;
    }
    if (_bench === "armor") {
      out.push(el("p.help", { style: { margin: "0 0 10px", maxWidth: "720px" }, text: b.blurb }));
      impactTable(ch).forEach(function (n) { out.push(n); });
      return out;
    }
    if (_bench === "tech") {
      out.push(el("p.help", { style: { margin: "0 0 10px", maxWidth: "720px" }, text: b.blurb }));
      techBay(ch).forEach(function (n) { out.push(n); });
      return out;
    }
    if (_bench === "fab") {
      out.push(el("p.help", { style: { margin: "0 0 10px", maxWidth: "720px" }, text: b.blurb }));
      fabricationBench(ch).forEach(function (n) { out.push(n); });
      return out;
    }
    if (_bench === "garage") {
      out.push(el("p.help", { style: { margin: "0 0 10px", maxWidth: "720px" }, text: "Vehicle Ops: the live operating math for the ride you are in. Pick a chassis to pull its category, type and Handling from the catalog, or leave it on Custom and enter your own. Vehicle Mods are fitted in the panel below; the full catalog of thirteen is in the Codex under Vehicles." }));
      garageBench(ch).forEach(function (n) { out.push(n); });
      return out;
    }
    var body = [
      el("p.help", { style: { margin: "0 0 10px", maxWidth: "720px" }, text: b.blurb }),
      el("div.row.wrap", { style: { gap: "6px", marginBottom: "4px", alignItems: "center" } },
        [el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "4px" }, text: "HANDLES" })]
          .concat(b.handles.split(" · ").map(function (h) { return el("span.chip", { style: { fontSize: "9.5px", color: "var(--text2)", borderColor: "var(--border2)" } }, h); }))),
      el("div.muted-box", { style: { marginTop: "14px", padding: "34px 20px", textAlign: "center", borderColor: b.color },
        html: "<div style='font-family:var(--disp);font-size:14px;letter-spacing:.22em;color:" + b.color + "'>" + b.icon + " &nbsp;MODULE PENDING</div>"
            + "<div style='font-size:12px;color:var(--text3);margin-top:10px;max-width:500px;margin-left:auto;margin-right:auto'>Crafting &amp; modding lives here. Drop the " + b.label + " rules and this bench comes online: recipes, mod slots, material costs, and Engineering/Systems checks.</div>" })
    ];
    out.push(EN.ui.panel(b.label, b.tag, body, { corners: true }));
    return out;
  }

  function render(mount) {
    var ch = store.active();
    clear(mount);
    if (!ch) {
      mount.appendChild(el("div.muted-box", { style: { marginTop: "40px", padding: "40px" }, text: "No Freelancer on file; register one on the #PRINT tab." }));
      return;
    }
    var blocks = [];
    blocks.push(el("div.row.between.wrap", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", letterSpacing: ".06em" }, html: 'INVENTORY <span class="dim3" style="font-size:13px">// gear · chrome · gray market</span>' })
    ]));

    /* sub-tab rail + glimmer ledger */
    // ledger inputs start empty; whichever field you fill is the currency CREDIT/DEBIT
    // acts on, and both are cleared after (re-render rebuilds them empty).
    var amtIn = el("input", { type: "number", min: 0, placeholder: "𝒢 amt", style: { width: "80px", textAlign: "center" } });
    var nxIn = el("input", { type: "number", min: 0, step: 0.05, placeholder: "◎ amt", style: { width: "68px", textAlign: "center" } });
    function ledgerApply(sign) {
      var g = parseFloat(amtIn.value), n = parseFloat(nxIn.value);
      var hasG = !isNaN(g) && g > 0, hasN = !isNaN(n) && n > 0;
      if (!hasG && !hasN) { toast("Enter an amount in the Glimmer or Nexus field first."); return; }
      store.update(function (c) {
        if (hasG) c.glimmer = Math.max(0, (c.glimmer || 0) + sign * g);
        if (hasN) c.nexus = Math.max(0, Math.round(((c.nexus || 0) + sign * n) * 100) / 100);
      });
    }
    function subTab(key, label) {
      return el("button.btn.sm" + (_sub === key ? ".primary" : ""), { onclick: function () { _sub = key; EN.app.render(); } }, label);
    }
    blocks.push(el("div.row.between.wrap", { style: { gap: "10px", marginBottom: "12px", alignItems: "center",
        position: "sticky", top: "92px", zIndex: 60,
        padding: "10px clamp(14px,3vw,40px)",
        marginLeft: "calc(-1 * clamp(14px,3vw,40px))",
        marginRight: "calc(-1 * clamp(14px,3vw,40px))",
        background: "var(--bg1)",
        backdropFilter: "blur(6px)",
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" } }, [
      el("div.row.wrap", { style: { gap: "6px" } }, [
        subTab("stash", "▣ STASH"),
        subTab("chrome", "⌖ CHROME"),
        subTab("workbench", "⚒ WORKBENCH"),
        subTab("market", "◉ GRAY MARKET")
      ]),
      // wallets on top, ledger controls beneath, so the bar stays compact
      el("div", { style: { display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end" } }, [
        el("div.row.wrap", { style: { gap: "8px", alignItems: "center", justifyContent: "flex-end" } }, [
          el("span.mono", { title: "Glimmer, issued by the Luster Interchange Treasury. What ordinary life costs.",
            style: { fontSize: "20px", color: "var(--gold)" }, text: fmtG(ch.glimmer || 0) }),
          amtIn,
          // Nexus wallet: the high-scrutiny currency (lease buyouts, brokered commissions)
          el("span.mono", { title: "Nexus tokens, the high-scrutiny currency. Brokered commissions, lease buyouts, favors with a paper trail.",
            style: { fontSize: "20px", color: "var(--flow)", marginLeft: "6px" }, text: fmtNx(ch.nexus || 0) }),
          nxIn
        ]),
        el("div.row.wrap", { style: { gap: "6px", alignItems: "center", justifyContent: "flex-end" } }, [
          // CREDIT / DEBIT act on whichever field you filled (Glimmer or Nexus), then clear
          el("button.btn.sm", { title: "Credit whichever field you filled: Glimmer (payouts, fenced goods) or Nexus (brokered payouts, favors called in).", style: { color: "var(--success)", borderColor: "var(--success)" },
            onclick: function () { ledgerApply(1); } }, "+ CREDIT"),
          el("button.btn.sm", { title: "Debit whichever field you filled: Glimmer (lifestyle, bribes) or Nexus (buyouts, high-scrutiny buys).", style: { color: "var(--danger)", borderColor: "var(--danger)" },
            onclick: function () { ledgerApply(-1); } }, "− DEBIT"),
          el("button.btn.sm" + (_split.open ? ".primary" : ""), { title: "Split a contract payout: fixer's cut off the top, then even shares",
            onclick: function () { _split.open = !_split.open; EN.app.render(); } }, "÷ SPLIT"),
          el("button.btn.sm" + (_hh.open ? ".primary" : ""), { title: "Bills: lifestyle, safehouse, leases, Hypercare, licences and debts",
            style: billsOverdue(ch) ? { color: "var(--danger)", borderColor: "var(--danger)" } : null,
            onclick: function () { _hh.open = !_hh.open; EN.app.render(); } },
            (billsOverdue(ch) ? "⚠ " : "") + "▤ BILLS")
        ])
      ])
    ]));
    if (_split.open) blocks.push(splitterPanel());
    if (_hh.open) blocks.push(billsPanel(ch));

    var body = _sub === "market" ? marketView(ch) : _sub === "chrome" ? chromeView(ch) : _sub === "workbench" ? workbenchView(ch) : stashView(ch);
    body.forEach(function (b) { blocks.push(b); });
    mount.appendChild(el("div", null, blocks));
  }

  // leaseTick: mutator for store.update, marks one day on every active lease
  // (called by the Freelancer tab's Long Rest); returns names that came due
  // openBench: land on one Workbench sub-tab from another view (the Freelancer
  // tab's damaged-plating readout sends the player to the Impact Table)
  function openBench(key) {
    _sub = "workbench";
    if (BENCHES.some(function (b) { return b.key === key; })) _bench = key;
  }
  /* Land on the Stash with one category already expanded. The device cards send you here to
     equip a deck or a Rig, and every stash category is collapsed by default, so without the
     expand the card tells you to go press a button and then drops you three clicks away from
     it. Named by category string because that is the key _stashOpen already uses. */
  function openStash(category) {
    _sub = "stash";
    if (category) _stashOpen[category] = true;
  }
  /* ONE CATALOG. These four sources were visible only from in here, so the engine's
     loadCatalogItem answered null for all 105 of them and isStackableItem then answered
     "pooled" off its unknown-item fallback, while this module resolved the same names and
     answered "per-instance". Registering the same normalized objects both halves already
     agree on ends that split at the source rather than papering over it downstream.
     The engine caches what it is handed, and these builders are pure over static data. */
  if (EN.engine && EN.engine.registerCatalogSource) {
    [partItems, armorModItems, vehicleItems, vehicleModItems].forEach(function (fn) {
      EN.engine.registerCatalogSource(fn);
    });
  }

  return { render: render, leaseTick: leaseTick, householdTick: householdTick, hypercareTick: hypercareTick,
           openBench: openBench, openStash: openStash };
})();
