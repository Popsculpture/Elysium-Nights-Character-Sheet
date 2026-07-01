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
  var _sub = "stash";      // 'stash' | 'chrome' | 'market' | 'workbench'
  var _bench = "ballistics"; // Workbench sub-tab: 'ballistics' | 'armor' | 'tech' | 'garage'
  var _benchWeapon = null;   // Arms Table: the weapon currently being customized
  var _benchArmor = null;    // Impact Table: the armor currently being customized
  var _open = {};          // collapse state for item cards
  var _ledgerAmt = 100;    // remembered credit/debit amount
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
  function streetPrice(it) {
    if (it.upkeep) return 0;   // leased gear always has a 𝒢0 buy-in; the cost is the recurring Upkeep, not a sale price
    if (_mode === "register") return Math.ceil(it.price * (LEGAL_MULT[it.legality] || 1) * (AVAIL_MULT[it.availability] || 1));
    if (_mode === "surplus") return Math.max(1, Math.floor(it.price * FENCE_RATE));
    if (_mode === "fivefinger") return 0;
    return it.price;   // The Undercut, straight book list price
  }
  function fencePrice(it) { return Math.max(1, Math.floor(it.price * FENCE_RATE)); }
  function priceTitle(it) {
    var sp = streetPrice(it);
    if (it.upkeep) return "Leased, 𝒢0 buy-in, " + fmtG(it.upkeep) + "/wk Upkeep. Lapse, get flagged, or cross the issuer and it drops to its zero state.";
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
  function isEquipped(ch, name) { return (ch.equippedWeapons || []).indexOf(name) !== -1; }
  function toggleEquip(name) {
    var ch = store.active();
    var on = !isEquipped(ch, name);
    store.update(function (c) {
      c.equippedWeapons = c.equippedWeapons || [];
      var i = c.equippedWeapons.indexOf(name);
      if (i === -1) c.equippedWeapons.push(name); else c.equippedWeapons.splice(i, 1);
    });
    toast(on ? name + " equipped; it's live in the Attacks list on the Freelancer tab." : name + " unequipped.");
  }
  // Defensive gear is single-slot per kind: one worn armor, one wielded shield,
  // one attuned Warding Focus. Equipping another in the same slot replaces it.
  var DEF_SLOT = { armor: "equippedArmor", shield: "equippedShield", focus: "equippedFocus" };
  var DEF_VERB = { armor: { on: "WEAR", off: "✓ WORN", act: "worn" }, shield: { on: "RAISE", off: "✓ WIELDING", act: "wielded" }, focus: { on: "ATTUNE", off: "✓ ATTUNED", act: "attuned" } };
  function isDefEquipped(ch, it) { return !!(it && DEF_SLOT[it.kind] && ch[DEF_SLOT[it.kind]] === it.name); }
  function toggleDefEquip(it) {
    var slot = DEF_SLOT[it.kind]; if (!slot) return;
    var ch = store.active();
    var was = ch[slot] === it.name;
    store.update(function (c) { c[slot] = was ? null : it.name; });
    var v = DEF_VERB[it.kind] || DEF_VERB.armor;
    toast(was ? it.name + " stowed." : it.name + " " + v.act + "; its DR, Block, Defense, and Ward now read on the Freelancer tab.");
  }
  function unequipIfGone(c, name) {
    var still = (c.equipment || []).some(function (x) { return x.name === name && x.qty > 0; });
    if (!still) {
      if (c.equippedWeapons) c.equippedWeapons = c.equippedWeapons.filter(function (n) { return n !== name; });
      if (c.weaponAmmo) delete c.weaponAmmo[name];   // drop the tracked magazine when the weapon leaves the stash
      if (c.equippedArmor === name) c.equippedArmor = null;     // a sold/dropped piece can't stay worn
      if (c.equippedShield === name) c.equippedShield = null;
      if (c.equippedFocus === name) c.equippedFocus = null;
      if (c.carry) delete c.carry[name];                        // drop its Loadout carry status too (no orphaned key)
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
      armorModItems()
    );
  }
  function findItem(name) { return catalog().find(function (i) { return i.name === name; }); }
  function traitDefs() {
    var g = EN.gearCatalog || {};
    var out = {};
    [(g.melee && g.melee.traits), (g.ranged && g.ranged.traits), (g.signature && g.signature.traits)].forEach(function (d) {
      if (d) Object.keys(d).forEach(function (k) { out[k] = d[k]; });
    });
    return out;
  }
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
      c.equipment = c.equipment || [];
      var e = c.equipment.find(function (x) { return x.name === it.name; });
      if (e) e.qty = (e.qty || 1) + 1; else c.equipment.push({ name: it.name, qty: 1 });
    });
    toast(_mode === "register" ? it.name + " purchased for " + fmtG(sp) + ". Compliance fees included. All sales final." :
          _mode === "surplus" ? it.name + " claimed from the Guild lot for " + fmtG(sp) + ". Mostly works." :
          _mode === "fivefinger" ? it.name + " taken. You were never here." :
          it.name + " acquired for " + fmtG(sp) + ". No receipt. It never happened.");
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
      c.cyberStash.push({ key: it.cyberKey, base: it.base, name: it.name, tier: it.tier, zone: it.zone,
        sp: it.sp, slots: it.slots || 0, sided: !!it.sided, side: it.sided ? "R" : null, mystech: !!it.mystech, enhancement: it.enhancement,
        desc: it.desc, effect: it.effect });
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
  function sell(name) {
    if (_mode === "fivefinger") { toast("No provenance, no payout. The fence won't touch it."); return; }
    var it = findItem(name);
    var pay = it ? fencePrice(it) : 1;
    store.update(function (c) {
      var e = (c.equipment || []).find(function (x) { return x.name === name; });
      if (!e) return;
      e.qty = (e.qty || 1) - 1;
      if (e.qty <= 0) c.equipment = c.equipment.filter(function (x) { return x !== e; });
      c.glimmer = (c.glimmer || 0) + pay;
      unequipIfGone(c, name);
    });
    toast("Fence takes the " + name + " at street rate. " + fmtG(pay) + " credited. No questions asked.");
  }
  function drop(name) {
    store.update(function (c) {
      var e = (c.equipment || []).find(function (x) { return x.name === name; });
      if (!e) return;
      e.qty = (e.qty || 1) - 1;
      if (e.qty <= 0) c.equipment = c.equipment.filter(function (x) { return x !== e; });
      unequipIfGone(c, name);
    });
  }
  function donate(name) {
    drop(name);
    toast(name + " donated. Somebody eats tonight.");
  }

  /* ---- shared item card (market + stash render through this) ---- */
  // MODS chip line for a customized weapon, mirroring the Freelancer weapon row.
  function installedPartsLine(ch, it) {
    if (!isWeapon(it) || !EN.weaponParts) return null;
    var lo = (ch.weaponParts || {})[it.name];
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
  function itemCard(it, ch, mode) {
    var id = mode + "-" + it.name, open = !!_open[id];
    var owned = (ch.equipment || []).find(function (e) { return e.name === it.name; });
    var sp = streetPrice(it);
    var afford = (ch.glimmer || 0) >= sp;
    var head = el("h4", { style: { cursor: "pointer" }, onclick: function () { _open[id] = !open; EN.app.render(); } }, [
      el("span", null, [
        el("span.collapse-caret", { text: open ? "▾" : "▸" }),
        document.createTextNode(" " + it.name),
        tagChip(it.legality, LEGAL_COLOR[it.legality], "Legality: " + it.legality),
        tagChip(it.availability, AVAIL_COLOR[it.availability], "Availability: " + it.availability),
        (it.slot && it.slot !== "None") ? tagChip("◧ " + it.slot, "var(--flow)", "Body Slot: " + it.slot) : null,
        it.counted ? tagChip("Counted", "var(--ember)", "Counted, track every unit from purchase to spend") : null,
        it.cyber ? tagChip("◆ " + it.zone, "var(--accent)", "Interface Zone: " + it.zone) : null,
        it.cyber ? tagChip(it.sp + " SP", it.sp >= 3 ? "var(--ember)" : "var(--gold)", "Static Points, adds to your Total Static / Chrome Tax") : null,
        (it.cyber && it.slots) ? tagChip(it.slots + " slots", "var(--flow)", "Mod slots, compatible mods don't add SP") : null,
        (it.nexus && it.vendor !== false) ? tagChip("◎ " + it.nexus.replace(/^◎/, ""), "var(--flow)", "Nexus alternative: " + it.nexus) : null,
        it.upkeep ? tagChip("LEASED", "var(--ember)", "Leased, 𝒢0 buy-in, " + fmtG(it.upkeep) + "/wk Upkeep. Lapse and it drops to its zero state.") : null,
        (mode === "mkt" && owned) ? tagChip("Owned ×" + owned.qty, "var(--success)") : null,
        (mode === "stash" && isEquipped(ch, it.name)) ? tagChip("⚔ Equipped", "var(--accent)", "Live in the Attacks list on the Freelancer tab") : null,
        (mode === "stash" && isDefEquipped(ch, it)) ? tagChip((DEF_VERB[it.kind] || {}).off || "✓ Equipped", "var(--accent)", "Active, its stats read on the Freelancer tab") : null
      ]),
      el("span.mono", { title: mode === "mkt" ? priceTitle(it) : (_mode === "fivefinger" ? "No provenance, no payout, the fence won't touch it." : "Fence pays " + fmtG(fencePrice(it)) + " (street rate, ~35% of list)"),
        style: { color: mode === "mkt" ? (_mode === "fivefinger" ? "var(--success)" : (it.vendor === false ? "var(--flow)" : (it.upkeep ? "var(--ember)" : (afford ? "var(--gold)" : "var(--danger)")))) : "var(--text3)", fontSize: "13px" } },
        mode === "mkt"
          ? (_mode === "fivefinger" ? "FREE" : it.vendor === false ? (it.nexus || "-") : it.upkeep ? fmtG(it.upkeep) + "/wk" : fmtG(sp) + (it.unit ? " " + it.unit : ""))
          : "×" + ((owned && owned.qty) || 0))
    ]);
    var statChips = [];
    if (it.damage && it.damage !== "0") statChips.push(el("span.mono", { style: { fontSize: "11.5px", color: "var(--accent)", marginRight: "4px" }, text: it.damage }));
    if (it.range && !/^Melee/.test(it.range)) statChips.push(el("span.chip", { title: "Range (normal / long, long range rolls with Snag)", style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, "RNG " + it.range.replace(/\s/g, "")));
    if (typeof it.ammo === "number" && it.ammo > 1) statChips.push(el("span.chip", { title: "Magazine / capacity", style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, "MAG " + it.ammo));
    /* defensive-gear stat chips: DR / Block / Defense / Ward / mod slots */
    function statChip(text, color, title) { return el("span.chip", { title: title || "", style: { fontSize: "9.5px", color: color, borderColor: color, fontWeight: 600 } }, text); }
    if (typeof it.dr === "number") statChips.push(statChip("⛨ " + it.dr + " DR", "var(--success)", "Damage Reduction against physical damage (passive mitigation)"));
    if (it.blockBonus) statChips.push(statChip("⛊ +" + it.blockBonus + " Block", "var(--gold)", "Flat Block Bonus, improves the Block Defensive Impulse"));
    if (typeof it.defense === "number") statChips.push(statChip((it.defense >= 0 ? "+" : "") + it.defense + " DEF", it.defense ? "var(--accent)" : "var(--text3)", "Defense bonus while this shield is wielded"));
    if (it.blockDie) statChips.push(statChip("⛊ " + it.blockDie + " Block", "var(--gold)", "Block die, added when you Block with this shield"));
    if (it.wardDie) statChips.push(statChip("✦ " + it.wardDie + " Ward", "var(--flow)", "Ward die, once per round, added to your Ward reduction"));
    if (isDefensive(it) && it.slots) statChips.push(statChip(it.slots + " mod slots", "var(--text2)", "Armor Mod slots (Modular trait)"));
    var defDefs = isDefensive(it) ? armorTraitDefs() : null;
    var mktBtn;
    if (_mode === "fivefinger") {
      // Five-Finger is the looted / recovered / pulled-from-a-body channel, the
      // only way a found-only artifact (vendor:false) legitimately reaches a player.
      mktBtn = el("button.btn.sm.primary", { title: it.cyber ? "Take to your Chrome Stash" : (it.vendor === false ? "The story handed it to you; take it." : priceTitle(it)), onclick: function () { it.cyber ? buyCyber(it) : buy(it); } }, "TAKE");
    } else if (it.vendor === false) {
      mktBtn = el("button.btn.sm", { disabled: true, title: "Not vendor stock, found, recovered, or campaign-granted, not bought. It can still turn up in Five-Finger Supply.", style: { color: "var(--flow)", borderColor: "var(--flow)" } }, "FOUND, NOT SOLD");
    } else if (it.upkeep) {
      mktBtn = el("button.btn.sm.primary", { title: "Sign the lease, 𝒢0 buy-in, " + fmtG(it.upkeep) + "/wk Upkeep. It works until the autopay lapses.", onclick: function () { buy(it); } }, "LEASE · " + fmtG(it.upkeep) + "/wk");
    } else {
      mktBtn = el("button.btn.sm" + (afford ? ".primary" : ""), { disabled: !afford, title: it.cyber ? "Buy to your Chrome Stash; install it later at a clinic (Chrome tab)" : priceTitle(it), onclick: function () { it.cyber ? buyCyber(it) : buy(it); } },
        afford ? "BUY · " + fmtG(sp) : "CAN'T AFFORD");
    }
    // action button(s): a single market button, or the stash equip/fence/drop group
    var actionEl = mode === "mkt"
      ? mktBtn
      : el("div.row.wrap", { style: { gap: "6px", justifyContent: "flex-end" } },
          (isWeapon(it) ? [
            isEquipped(ch, it.name)
              ? el("button.btn.sm.primary", { title: "Unequip, remove from the Attacks list on the Freelancer tab", onclick: function () { toggleEquip(it.name); } }, "✓ EQUIPPED")
              : el("button.btn.sm", { title: "Equip, add to the Attacks list on the Freelancer tab", style: { color: "var(--accent)", borderColor: "var(--accent)" }, onclick: function () { toggleEquip(it.name); } }, "⚔ EQUIP")
          ] : []).concat(isDefensive(it) ? [
            isDefEquipped(ch, it)
              ? el("button.btn.sm.primary", { title: "Stow, it stops applying on the Freelancer tab", onclick: function () { toggleDefEquip(it); } }, (DEF_VERB[it.kind] || {}).off || "✓ EQUIPPED")
              : el("button.btn.sm", { title: "Equip, its DR / Block / Defense / Ward read on the Freelancer tab (one " + it.kind + " at a time)", style: { color: "var(--accent)", borderColor: "var(--accent)" }, onclick: function () { toggleDefEquip(it); } }, ((DEF_VERB[it.kind] || {}).on || "EQUIP"))
          ] : []).concat(_mode === "fivefinger" ? [
            el("button.btn.sm", { title: "Give one away", style: { color: "var(--success)", borderColor: "var(--success)" }, onclick: function () { donate(it.name); } }, "DONATE"),
            el("button.btn.sm", { title: "Discard one", onclick: function () { drop(it.name); } }, "DROP")
          ] : [
            el("button.btn.sm", { title: "Sell to the fence at street rate", style: { color: "var(--gold)", borderColor: "var(--gold)" }, onclick: function () { sell(it.name); } }, "FENCE · " + fmtG(fencePrice(it))),
            el("button.btn.sm", { title: "Discard one", onclick: function () { drop(it.name); } }, "DROP")
          ]));
    // chips wrap freely on the left; the action group is always pinned to the right
    var info = el("div.row", { style: { gap: "10px", alignItems: "flex-start", margin: "4px 0 0", flexWrap: "nowrap" } }, [
      el("div.row.wrap", { style: { gap: "6px", alignItems: "center", flex: "1 1 auto", minWidth: 0 } },
        statChips.concat((it.traits || []).map(function (t) { return traitChip(t, defDefs); }))),
      el("div.row.wrap", { style: { gap: "6px", flex: "0 0 auto", marginLeft: "auto", justifyContent: "flex-end", alignItems: "center" } }, [actionEl])
    ]);
    return el("div.feature", { style: { borderLeftColor: LEGAL_COLOR[it.legality] || "var(--border2)" } }, [
      head, info,
      it.benchPart ? partInfoLine(ch, it) : it.armorMod ? armorModInfoLine(ch, it) : (mode !== "mkt" ? installedPartsLine(ch, it) : null),
      open && it.desc ? el("p", { style: { marginTop: "8px" }, text: it.desc }) : null,
      open && it.type ? el("p.help", { style: { margin: "4px 0 0", color: "var(--text2)" }, text: "Type: " + it.type + (it.upkeep ? " · Leased: 𝒢0 buy-in, " + fmtG(it.upkeep) + "/wk Upkeep" : "") + (it.nexus ? " · Nexus: " + it.nexus : "") }) : null,
      open && it.proficiency ? el("p.help", { style: { margin: "4px 0 0", color: "var(--flow)" }, text: "Proficiency: " + it.proficiency + (it.signature ? " · Signature weapon (0 customization slots)" : "") }) : null,
      open && (it.category || it.skill) ? el("p.help", { style: { margin: "4px 0 0", color: "var(--flow)" }, text: (it.category ? "Tool Category: " + it.category : "") + (it.category && it.skill ? " · " : "") + (it.skill ? "Governing Skill: " + it.skill : "") }) : null,
      open && it.feeds ? el("p.help", { style: { margin: "4px 0 0", color: "var(--gold)" }, text: "Feeds: " + it.feeds }) : null,
      open && it.effect ? el("p.help", { style: { margin: "4px 0 0", color: "var(--accent)" }, text: (it.signature ? "" : "Effect: ") + it.effect }) : null,
      open && it.poweredBenefits ? el("p.help", { style: { margin: "4px 0 0", color: "var(--gold)" }, html: "<b style='color:var(--gold)'>Powered Benefits:</b> " + it.poweredBenefits }) : null,
      open && it.cyber ? el("p.help", { style: { margin: "4px 0 0", color: "var(--flow)" }, text: "Install: " + it.zone + " zone · " + it.sp + " SP" + (it.slots ? " · " + it.slots + " mod slots" : "") + " · Enhancement: " + (enhScaled(it) || "None") }) : null,
      open && it.cyber && it.tierNote ? el("p.help", { style: { margin: "4px 0 0" }, text: it.tierNote }) : null,
      open && it.basic ? el("p.help", { style: { margin: "4px 0 0" }, html: "<b style='color:var(--text2)'>Basic Use:</b> " + it.basic }) : null,
      open && it.proficient ? el("p.help", { style: { margin: "4px 0 0" }, html: "<b style='color:var(--gold)'>Proficient Use:</b> " + it.proficient }) : null,
      open && it.range ? el("p.help", { style: { margin: "4px 0 0" }, text: "Range: " + it.range + (it.ammoUnit ? " · Ammo: " + it.ammo + " " + it.ammoUnit : "") }) : null
    ]);
  }

  /* ---- sub-views ---- */
  function stashView(ch) {
    var entries = (ch.equipment || []).filter(function (e) { return e.qty > 0; });
    var cards = entries.map(function (e) {
      var it = findItem(e.name);
      if (it) return itemCard(it, ch, "stash");
      // unknown / custom item, minimal row
      return el("div.feature", null, [
        el("h4", null, [el("span", { text: e.name }), el("span.mono", { style: { color: "var(--text3)", fontSize: "13px" }, text: "×" + e.qty })]),
        el("div.row", { style: { gap: "6px", marginTop: "4px", justifyContent: "flex-end" } }, [el("button.btn.sm", { onclick: function () { drop(e.name); } }, "DROP")])
      ]);
    });
    return [EN.ui.panel("Stash", entries.length + " ITEM TYPES", cards.length ? cards :
      [el("p.help", { style: { margin: 0 }, text: "Empty. The Undercut is open; it's always open." })], { corners: true })];
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
        cw.tier ? tagChip(cw.tier, tierChipColor(cw.tier)) : null,
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
        open && cw.effect ? el("p.help", { style: { margin: "4px 0 0", color: "var(--accent)" }, text: cw.effect }) : null,
        open && cw.desc ? el("p", { style: { margin: "6px 0 0" }, text: cw.desc }) : null
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
    blocks.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "14px" } },
      STOREFRONTS.map(function (m) {
        var on = _mode === m.key;
        return el("button.btn.sm" + (on ? ".primary" : ""), {
          title: m.desc,
          onclick: function () { _mode = m.key; EN.app.render(); }
        }, m.name.toUpperCase());
      })
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
      { key: "melee", title: "Melee Weapons", short: "MELEE", subs: [
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
        { label: "Launcher Shells", intro: "Fired from a Grenade Launcher. Targets save Agility vs your Weapon Save DC.", items: byGroup(ammo, "Launcher Shell") }
      ] }
    ];
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
        intro: (AM().rules ? AM().rules.host + " " + AM().rules.legality : "") + " Buy a mod here, then fit it from the Workbench (Impact Table).",
        subs: (AM().categories || []).map(function (cg) { return { label: cg.name, intro: cg.blurb, items: modsByCat(cg.key) }; })
      });
    }
    var T = g.tools;
    if (T && T.buckets) {
      var SHORT = { kits: "KITS", devices: "DEVICES", consumables: "CONSUMABLES", flow: "FLOW", rigs: "RIGS", ciphers: "CIPHERS" };
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
    var tierLabel = function (t) { var col = { Streetware: "var(--text3)", Brandware: "var(--accent)", Blackware: "var(--danger)", Prototype: "var(--flow)" }[t] || "var(--text3)"; return el("div", { style: { margin: "6px 0 3px 12px", fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: ".14em", textTransform: "uppercase", color: col } }, "› " + t); };
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
    { key: "tech", label: "Tech Bay", icon: "⌬", color: "var(--accent)", tag: "TECH CRAFTING & MODDING",
      blurb: "Assemble devices and gadgets, service chrome, and wire Smartdeck hardware mods and ciphers.",
      handles: "Field Devices & Gadgets · Cyberware · Smartdeck Mods · Ciphers · Skill Kits" },
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
  function isFirearmGroup(g) { return ["Sidearm", "Longarm", "Heavy", "Launcher", "Thrown"].indexOf(g) !== -1; }
  function weaponCategory(it) { return it.signature ? "signature" : isBowGroup(it.group) ? "bowfire" : isMeleeGroup(it.group) ? "melee" : "ranged"; }
  function ownedWeapons(ch) {
    var seen = {};
    return (ch.equipment || []).filter(function (e) { return e.qty > 0; })
      .map(function (e) { return findItem(e.name); })
      .filter(function (it) { return it && isWeapon(it) && !seen[it.name] && (seen[it.name] = 1); });
  }
  function weaponLoadout(ch, name) {
    var wp = (ch.weaponParts || {})[name] || {};
    return { _profile: wp._profile || "auto", targeting: wp.targeting || null, output: wp.output || null,
             core: wp.core || null, handling: wp.handling || null, utility: (wp.utility || []).slice() };
  }
  function setLoadout(name, mut) {
    store.update(function (c) {
      c.weaponParts = c.weaponParts || {};
      var wp = c.weaponParts[name] || { _profile: "auto", targeting: null, output: null, core: null, handling: null, utility: [] };
      mut(wp);
      c.weaponParts[name] = wp;
    });
  }
  function slotCountFor(it, lo) {
    if (it.signature) return 0;
    var prof = (WP().profiles || []).find(function (p) { return p.key === lo._profile; });
    if (prof && prof.count != null) return prof.count;
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
  // (legality chip colors reuse the module-level LEGAL_COLOR defined near the top)
  var RARITY_COLOR = { Common: "var(--text3)", Uncommon: "var(--accent)", Rare: "var(--flow)" };
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
  function ownedQtyOf(ch, name) { var e = (ch.equipment || []).find(function (x) { return x.name === name; }); return e ? (e.qty || 0) : 0; }
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
      case "Bulky non-Powered": return has("Bulky") && !(has("Powered") || g === "Powered Exoframe");
      default: return true;
    }
  }
  function isModularArmor(armor) { return (armor.traits || []).indexOf("Modular") !== -1 || (armor.slots || 0) > 0; }
  function armorSlotCount(armor) { return armor.slots || 0; }
  function ownedArmor(ch) {
    var seen = {};
    return (ch.equipment || []).filter(function (e) { return e.qty > 0; })
      .map(function (e) { return findItem(e.name); })
      .filter(function (it) { return it && isDefensive(it) && !seen[it.name] && (seen[it.name] = 1); });
  }
  function armorLoadout(ch, name) { return ((ch.armorMods || {})[name] || []).slice(); }
  function setArmorMods(name, fn) {
    store.update(function (c) { c.armorMods = c.armorMods || {}; c.armorMods[name] = fn((c.armorMods[name] || []).slice()); });
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
             nexus: m.nexus, upkeep: m.upkeep, vendor: m.vendor };
  }
  function armorModItems() { return (AM().mods || []).map(armorModAsItem); }
  function aggregateArmorLegality(armor, lo) {
    var order = ["Legal", "Licensed", "Restricted", "Contraband"];
    var worst = armor.legality || "Legal";
    (lo || []).forEach(function (k) { var m = AM().byKey[k]; if (m && order.indexOf(m.legality) > order.indexOf(worst)) worst = m.legality; });
    return worst;
  }
  function tryInstallArmorMod(armor, lo, key) {
    var mod = AM().byKey[key]; if (!mod) return;
    if (availableArmorModQty(store.active(), mod) <= 0) { toast("You do not own a free " + mod.name + ". Buy it in the gray market first."); return; }
    if (lo.indexOf(key) !== -1) { toast(mod.name + " is already fitted to this suit."); return; }
    if (lo.length >= armorSlotCount(armor)) { toast("No open Mod Slots. Only Modular armor carries slots, up to its listed count."); return; }
    setArmorMods(armor.name, function (l) { l.push(key); return l; });
    toast(mod.name + " worked into " + armor.name + " (bench work: a rest with a kit).");
  }
  function removeArmorMod(armorName, key) { setArmorMods(armorName, function (l) { return l.filter(function (k) { return k !== key; }); }); }
  function tryInstall(it, lo, slotKey, key) {
    var part = WP().byKey[key]; if (!part) return;
    if (availablePartQty(store.active(), part) <= 0) { toast("You do not own a free " + part.name + ". Buy it in the gray market first."); return; }
    if (installedCount(lo) >= slotCountFor(it, lo)) { toast("Slot Count is full. Over-Engineering past it makes this a Prototype-tier Project with a Mandatory Flaw; track it as a Project."); return; }
    var installed = allInstalledKeys(lo);
    var conflictKey = installed.find(function (k) { var ip = WP().byKey[k]; return (part.excludes || []).indexOf(k) !== -1 || (ip && (ip.excludes || []).indexOf(key) !== -1); });
    if (conflictKey) { toast(part.name + " cannot share a build with " + (WP().byKey[conflictKey] || {}).name + "."); return; }
    setLoadout(it.name, function (wp) {
      if (slotKey === "utility") { wp.utility = wp.utility || []; if (wp.utility.length < 2) wp.utility.push(key); }
      else wp[slotKey] = key;
    });
    toast(part.name + (part.partType === "Mod" ? " worked in (Mod: needs a rest + kit)" : " snapped on") + " · " + it.name);
  }
  function removePart(name, slotKey, key) {
    setLoadout(name, function (wp) {
      if (slotKey === "utility") wp.utility = (wp.utility || []).filter(function (k) { return k !== key; });
      else wp[slotKey] = null;
    });
  }
  function slotCard(ch, it, lo, sd) {
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
            partChip(p.legality, LEGAL_COLOR[p.legality]), partChip(p.rarity, RARITY_COLOR[p.rarity])
          ]),
          el("p.help", { style: { margin: "2px 0 0", fontSize: "11px" }, text: p.grants })
        ]),
        el("button.btn.sm", { title: "Remove " + p.name, style: { color: "var(--text3)" }, onclick: function () { removePart(it.name, slotKey, key); } }, "✕")
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
      kids.push(el("select", { style: { marginTop: "5px", fontSize: "11px", width: "auto", maxWidth: "100%" }, onchange: function (e) { var k = e.target.value; e.target.value = ""; if (k) tryInstall(it, lo, slotKey, k); } },
        [el("option", { value: "", text: "+ install from stash" })].concat(ownedOpts.map(function (p) {
          var av = availablePartQty(ch, p);
          return el("option", { value: p.key, text: p.name + " · " + p.partType + (av > 1 ? " ×" + av : "") });
        }))));
    } else if (fitting.length) {
      kids.push(el("p.help", { style: { margin: "5px 0 0", fontSize: "10.5px", color: "var(--text3)" }, text: "You own no Parts for this slot. Buy Mods & Accessories in the gray market." }));
    } else {
      kids.push(el("p.help", { style: { margin: "5px 0 0", fontSize: "10.5px", color: "var(--text4)" }, text: "No Parts fit this weapon's " + sd.name + " slot." }));
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
    if (!_benchWeapon || !weapons.some(function (w) { return w.name === _benchWeapon; })) _benchWeapon = weapons[0].name;
    out.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "10px", alignItems: "center" } },
      [el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "4px" }, text: "ON THE BENCH" })].concat(
        weapons.map(function (w) {
          var on = _benchWeapon === w.name;
          return el("button.btn.sm" + (on ? ".primary" : ""), { onclick: function () { _benchWeapon = w.name; EN.app.render(); } }, w.name);
        }))));
    var it = weapons.find(function (w) { return w.name === _benchWeapon; }) || weapons[0];
    var lo = weaponLoadout(ch, it.name);

    if (it.signature) {
      out.push(EN.ui.panel(it.name, it.group.toUpperCase() + " · SIGNATURE", [
        el("p.help", { style: { margin: 0 }, text: "Signature weapon: 0 customization slots. It arrives complete, with fixed Parts and a built-in property you cannot replicate with bolt-ons. Its power lives in the wielder, not the rails." })
      ], { corners: true }));
      return out;
    }

    var count = installedCount(lo), max = slotCountFor(it, lo), legal = aggregateLegality(it, lo);
    var profSel = el("select", { style: { fontSize: "11px", width: "auto" }, onchange: function (e) { var v = e.target.value; setLoadout(it.name, function (wp) { wp._profile = v; }); } },
      (WP().profiles || []).map(function (p) { return el("option", { value: p.key, selected: lo._profile === p.key, text: p.name + (p.count != null ? " (" + p.count + ")" : "") }); }));
    var header = el("div.row.between.wrap", { style: { gap: "10px", alignItems: "center", marginBottom: "10px" } }, [
      el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        el("span.mono", { style: { fontSize: "18px", color: count > max ? "var(--danger)" : "var(--ember)" }, html: count + " <span style='font-size:12px;color:var(--text3)'>/ " + max + " slots</span>" }),
        partChip(legal, LEGAL_COLOR[legal]),
        el("span.help", { style: { margin: 0, fontSize: "10.5px" }, text: legal === (it.legality || "Legal") ? "as a scanner reads it" : "scanner reads it as " + legal + " (was " + (it.legality || "Legal") + ")" })
      ]),
      el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [el("span.help", { style: { margin: 0, fontSize: "10px" }, text: "PROFILE" }), profSel])
    ]);
    var grid = el("div.grid2", { style: { gap: "10px" } }, (WP().slots || []).map(function (sd) { return slotCard(ch, it, lo, sd); }));
    out.push(EN.ui.panel(it.name, it.group.toUpperCase() + " · " + (it.damage || ""), [
      el("p.help", { style: { margin: "0 0 8px", fontSize: "11.5px" }, text: "One Part per slot (Utility holds two). Accessories snap on anytime; Mods are bench work on a rest with a kit. The strictest legality on the build is what a scanner reports." }),
      header, grid,
      el("p.help", { style: { margin: "10px 0 0", fontSize: "10.5px", color: "var(--text3)" }, text: WP().rules ? WP().rules.dieStep + " " + WP().rules.stabilized : "" })
    ], { corners: true }));
    return out;
  }

  function impactTable(ch) {
    var out = [];
    var armors = ownedArmor(ch);
    if (!armors.length) {
      out.push(el("div.muted-box", { style: { padding: "28px 20px", textAlign: "center", borderColor: "var(--success)" },
        html: "<div style='font-family:var(--disp);font-size:13px;letter-spacing:.18em;color:var(--success)'>⛨ NO ARMOR ON THE BENCH</div><div style='font-size:12px;color:var(--text3);margin-top:8px'>Acquire armor in the gray market or your stash, then bring it here to fit Armor Mods.</div>" }));
      return out;
    }
    if (!_benchArmor || !armors.some(function (a) { return a.name === _benchArmor; })) _benchArmor = armors[0].name;
    out.push(el("div.row.wrap", { style: { gap: "6px", marginBottom: "10px", alignItems: "center" } },
      [el("span.mono", { style: { fontSize: "10px", color: "var(--text3)", letterSpacing: ".1em", marginRight: "4px" }, text: "ON THE BENCH" })].concat(
        armors.map(function (a) {
          var on = _benchArmor === a.name;
          return el("button.btn.sm" + (on ? ".primary" : ""), { onclick: function () { _benchArmor = a.name; EN.app.render(); } }, a.name);
        }))));
    var it = armors.find(function (a) { return a.name === _benchArmor; }) || armors[0];
    var lo = armorLoadout(ch, it.name);
    var tag = (it.group || "").toUpperCase() + (typeof it.dr === "number" ? " · " + it.dr + " DR" : "");
    var kids = [el("p.help", { style: { margin: "0 0 8px", fontSize: "11.5px" }, text: "One mod per slot; only Modular armor carries slots (Integrated adds one). Every Armor Mod is bench work. The strictest legality on the suit is what a scanner reports." })];

    if (!isModularArmor(it) || armorSlotCount(it) === 0) {
      kids.push(el("div.muted-box", { style: { padding: "18px", textAlign: "center", borderColor: "var(--border2)" },
        html: "<div style='font-size:12px;color:var(--text3)'>" + it.name + " is not <b>Modular</b>; it has no Mod Slots. Only Modular armor takes Armor Mods.</div>" }));
      out.push(EN.ui.panel(it.name, tag, kids, { corners: true }));
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
        el("button.btn.sm", { title: "Pull " + m.name, style: { color: "var(--text3)" }, onclick: function () { removeArmorMod(it.name, key); } }, "✕")
      ]));
    });
    var fitting = (AM().mods || []).filter(function (m) { return armorModFits(m, it) && lo.indexOf(m.key) === -1; });
    var ownedOpts = fitting.filter(function (m) { return availableArmorModQty(ch, m) > 0; });
    if (lo.length >= slots) {
      kids.push(el("p.help", { style: { margin: "8px 0 0", fontSize: "10.5px", color: "var(--warn)" }, text: "Mod Slots full; pull a mod to fit another." }));
    } else if (ownedOpts.length) {
      kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginTop: "8px" } }, [
        el("span", { style: { fontFamily: "var(--disp)", fontSize: "9.5px", letterSpacing: ".12em", color: "var(--text3)" }, text: "FIT A MOD" }),
        el("select", { style: { fontSize: "11px", width: "auto", maxWidth: "100%" }, onchange: function (e) { var k = e.target.value; e.target.value = ""; if (k) tryInstallArmorMod(it, lo, k); } },
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
    out.push(EN.ui.panel(it.name, tag, kids, { corners: true }));
    return out;
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
    var amtIn = el("input", { type: "number", min: 1, value: _ledgerAmt, style: { width: "80px", textAlign: "center" },
      oninput: function () { _ledgerAmt = Math.max(1, Number(this.value) || 1); } });
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
        subTab("market", "◉ GRAY MARKET"),
        subTab("workbench", "⚒ WORKBENCH")
      ]),
      el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        el("span.mono", { title: "Glimmer, issued by the Luster Interchange Treasury. What ordinary life costs.",
          style: { fontSize: "20px", color: "var(--gold)" }, text: fmtG(ch.glimmer || 0) }),
        amtIn,
        el("button.btn.sm", { title: "Credit the ledger (payouts, fenced goods, day-job pay)", style: { color: "var(--success)", borderColor: "var(--success)" },
          onclick: function () { store.update(function (c) { c.glimmer = (c.glimmer || 0) + _ledgerAmt; }); } }, "+ CREDIT"),
        el("button.btn.sm", { title: "Debit the ledger (lifestyle, upkeep, bribes, bad nights)", style: { color: "var(--danger)", borderColor: "var(--danger)" },
          onclick: function () { store.update(function (c) { c.glimmer = Math.max(0, (c.glimmer || 0) - _ledgerAmt); }); } }, "− DEBIT")
      ])
    ]));

    var body = _sub === "market" ? marketView(ch) : _sub === "chrome" ? chromeView(ch) : _sub === "workbench" ? workbenchView(ch) : stashView(ch);
    body.forEach(function (b) { blocks.push(b); });
    mount.appendChild(el("div", null, blocks));
  }

  return { render: render };
})();
