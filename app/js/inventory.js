/* ===========================================================================
   ELYSIUM NIGHTS — Inventory tab
   Sub-tabs: Stash (owned gear) · Chrome (installed cyberware) · The Undercut
   (gray-market storefront). Currency is Glimmer (𝒢). List prices come from
   the Gear & Equipment catalog and assume a major district; the Undercut is
   not a major district — legality and scarcity mark prices up, and the fence
   pays street rate (~35% of list) when you sell.
   =========================================================================== */
window.EN = window.EN || {};

EN.inventoryView = (function () {
  var el = EN.ui.el, clear = EN.ui.clear, toast = EN.ui.toast;
  var store = EN.store;
  var _sub = "stash";      // 'stash' | 'chrome' | 'market'
  var _open = {};          // collapse state for item cards
  var _ledgerAmt = 100;    // remembered credit/debit amount
  // Storefront (picked via the ⚙ settings popover; same stock, different pricing):
  //   'undercut'   — The Undercut: book list prices, no markups
  //   'register'   — The Register: predatory corporate markups (legality × scarcity)
  //   'surplus'    — Guild Surplus: Deep Discount, ~35% of list
  //   'fivefinger' — Five-Finger Supply: free; fencing disabled (Drop/Donate only)
  var _mode = "undercut";
  var _settingsOpen = false;
  document.addEventListener("click", function (ev) {
    if (!_settingsOpen) return;
    if (ev.target.closest && ev.target.closest(".inv-pop-anchor")) return;
    _settingsOpen = false; EN.app.render();
  });

  /* ---- pricing (Economy & Rewards: prices assume a major district;
          scarcity, faction control & legality shift them — sometimes a lot) */
  var LEGAL_COLOR = { "Legal": "var(--text3)", "Licensed": "var(--gold)", "Restricted": "var(--ember)", "Contraband": "var(--danger)", "As weapon": "var(--text3)" };
  var AVAIL_COLOR = { "Common": "var(--text3)", "Uncommon": "var(--accent)", "Rare": "var(--flow)" };
  var LEGAL_MULT = { "Legal": 1, "Licensed": 1.15, "Restricted": 1.4, "Contraband": 1.75 };
  var AVAIL_MULT = { "Common": 1, "Uncommon": 1.2, "Rare": 1.5 };
  var FENCE_RATE = 0.35;   // common contraband fences at 30–50% of market

  var STOREFRONTS = [
    { key: "undercut", name: "The Undercut", desc: "Book list prices. Gray market — no markups, no paperwork, no receipts." },
    { key: "register", name: "The Register", desc: "Corporate retail. Compliance surcharges and scarcity-indexed markups." },
    { key: "surplus", name: "Guild Surplus", desc: "Deep Discount — Guild overstock & salvage at ~35% of list." },
    { key: "fivefinger", name: "Five-Finger Supply", desc: "Free. Looted, recovered, donated. Fencing disabled — Drop or Donate only." }
  ];
  function storefront() { return STOREFRONTS.find(function (s) { return s.key === _mode; }) || STOREFRONTS[0]; }

  function fmtG(n) { return "𝒢" + (n || 0).toLocaleString(); }
  function streetPrice(it) {
    if (_mode === "register") return Math.ceil(it.price * (LEGAL_MULT[it.legality] || 1) * (AVAIL_MULT[it.availability] || 1));
    if (_mode === "surplus") return Math.max(1, Math.floor(it.price * FENCE_RATE));
    if (_mode === "fivefinger") return 0;
    return it.price;   // The Undercut — straight book list price
  }
  function fencePrice(it) { return Math.max(1, Math.floor(it.price * FENCE_RATE)); }
  function priceTitle(it) {
    var sp = streetPrice(it);
    if (_mode === "register") {
      if (sp === it.price) return "List price " + fmtG(it.price) + (it.unit ? " " + it.unit : "") + ". Standard compliance handling included. All sales final.";
      return "List " + fmtG(it.price) + " · compliance surcharge ×" + (LEGAL_MULT[it.legality] || 1) + " (" + it.legality + ") · scarcity index ×" +
             (AVAIL_MULT[it.availability] || 1) + " (" + it.availability + ") = " + fmtG(sp) + ". Fees are non-negotiable. All sales final.";
    }
    if (_mode === "surplus") return "List " + fmtG(it.price) + " — Guild members' rate " + fmtG(sp) + ". Overstock, salvage, serial numbers conveniently worn off.";
    if (_mode === "fivefinger") return "It fell off a transport. Looted, recovered, donated, or pulled from a body. Free — and the fence won't touch it.";
    if (it.legality === "As weapon") return "List price " + fmtG(it.price) + (it.unit ? " " + it.unit : "") + " — standard ammo carries the legality of the weapon it feeds.";
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
    toast(on ? name + " equipped — it's live in the Attacks list on the Freelancer tab." : name + " unequipped.");
  }
  function unequipIfGone(c, name) {
    var still = (c.equipment || []).some(function (x) { return x.name === name && x.qty > 0; });
    if (!still) {
      if (c.equippedWeapons) c.equippedWeapons = c.equippedWeapons.filter(function (n) { return n !== name; });
      if (c.weaponAmmo) delete c.weaponAmmo[name];   // drop the tracked magazine when the weapon leaves the stash
    }
  }

  function catalog() {
    var g = EN.gearCatalog || {};
    return [].concat(
      (g.melee && g.melee.items) || [],
      (g.ranged && g.ranged.items) || [],
      (g.signature && g.signature.items) || [],
      (g.signature && g.signature.munitions) || [],
      (g.ammo && g.ammo.items) || []
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

  function traitChip(t) {
    var defs = traitDefs();
    var base = t.replace(/\s*\(.*\)$/, "").trim();
    var def = defs[base] || defs[base.replace(/\s+\d+$/, " X")] || (/^Area /.test(base) ? defs["Area X"] : "") || "";
    return el("span.chip", { title: def, style: { fontSize: "9.5px", color: "var(--text2)", borderColor: "var(--border2)" } }, t);
  }
  function tagChip(text, color, title) {
    return el("span.chip", { title: title || "", style: { fontSize: "9px", color: color, borderColor: color, marginLeft: "6px" } }, text.toUpperCase());
  }

  /* ---- mutations ---- */
  function buy(it) {
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
        (mode === "mkt" && owned) ? tagChip("Owned ×" + owned.qty, "var(--success)") : null,
        (mode === "stash" && isEquipped(ch, it.name)) ? tagChip("⚔ Equipped", "var(--accent)", "Live in the Attacks list on the Freelancer tab") : null
      ]),
      el("span.mono", { title: mode === "mkt" ? priceTitle(it) : (_mode === "fivefinger" ? "No provenance, no payout — the fence won't touch it." : "Fence pays " + fmtG(fencePrice(it)) + " (street rate, ~35% of list)"),
        style: { color: mode === "mkt" ? (_mode === "fivefinger" ? "var(--success)" : (afford ? "var(--gold)" : "var(--danger)")) : "var(--text3)", fontSize: "13px" } },
        mode === "mkt" ? (_mode === "fivefinger" ? "FREE" : fmtG(sp) + (it.unit ? " " + it.unit : "")) : "×" + ((owned && owned.qty) || 0))
    ]);
    var statChips = [];
    if (it.damage && it.damage !== "0") statChips.push(el("span.mono", { style: { fontSize: "11.5px", color: "var(--accent)", marginRight: "4px" }, text: it.damage }));
    if (it.range && !/^Melee/.test(it.range)) statChips.push(el("span.chip", { title: "Range (normal / long — long range rolls with Snag)", style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, "RNG " + it.range.replace(/\s/g, "")));
    if (typeof it.ammo === "number" && it.ammo > 1) statChips.push(el("span.chip", { title: "Magazine / capacity", style: { fontSize: "9.5px", color: "var(--gold)", borderColor: "var(--gold)" } }, "MAG " + it.ammo));
    var info = el("div.row.wrap", { style: { gap: "6px", alignItems: "center", margin: "4px 0 0" } },
      statChips
        .concat((it.traits || []).map(traitChip))
        .concat([el("span", { style: { flex: 1 } }),
          mode === "mkt"
            ? el("button.btn.sm" + (afford ? ".primary" : ""), { disabled: !afford, title: priceTitle(it), onclick: function () { buy(it); } },
                _mode === "fivefinger" ? "TAKE" : (afford ? "BUY · " + fmtG(sp) : "CAN'T AFFORD"))
            : el("div.row", { style: { gap: "6px" } },
                (isWeapon(it) ? [
                  isEquipped(ch, it.name)
                    ? el("button.btn.sm.primary", { title: "Unequip — remove from the Attacks list on the Freelancer tab", onclick: function () { toggleEquip(it.name); } }, "✓ EQUIPPED")
                    : el("button.btn.sm", { title: "Equip — add to the Attacks list on the Freelancer tab", style: { color: "var(--accent)", borderColor: "var(--accent)" }, onclick: function () { toggleEquip(it.name); } }, "⚔ EQUIP")
                ] : []).concat(_mode === "fivefinger" ? [
                el("button.btn.sm", { title: "Give one away", style: { color: "var(--success)", borderColor: "var(--success)" }, onclick: function () { donate(it.name); } }, "DONATE"),
                el("button.btn.sm", { title: "Discard one", onclick: function () { drop(it.name); } }, "DROP")
              ] : [
                el("button.btn.sm", { title: "Sell to the fence at street rate", style: { color: "var(--gold)", borderColor: "var(--gold)" }, onclick: function () { sell(it.name); } }, "FENCE · " + fmtG(fencePrice(it))),
                el("button.btn.sm", { title: "Discard one", onclick: function () { drop(it.name); } }, "DROP")
              ]))
        ]));
    return el("div.feature", { style: { borderLeftColor: LEGAL_COLOR[it.legality] || "var(--border2)" } }, [
      head, info,
      open && it.desc ? el("p", { style: { marginTop: "8px" }, text: it.desc }) : null,
      open && it.proficiency ? el("p.help", { style: { margin: "4px 0 0", color: "var(--flow)" }, text: "Proficiency: " + it.proficiency + (it.signature ? " · Signature weapon (0 customization slots)" : "") }) : null,
      open && it.feeds ? el("p.help", { style: { margin: "4px 0 0", color: "var(--gold)" }, text: "Feeds: " + it.feeds }) : null,
      open && it.effect ? el("p.help", { style: { margin: "4px 0 0", color: "var(--accent)" }, text: (it.signature ? "" : "Effect: ") + it.effect }) : null,
      open && it.range ? el("p.help", { style: { margin: "4px 0 0" }, text: "Range: " + it.range + (it.ammoUnit ? " · Ammo: " + it.ammo + " " + it.ammoUnit : "") }) : null
    ]);
  }

  /* ---- sub-views ---- */
  function stashView(ch) {
    var entries = (ch.equipment || []).filter(function (e) { return e.qty > 0; });
    var cards = entries.map(function (e) {
      var it = findItem(e.name);
      if (it) return itemCard(it, ch, "stash");
      // unknown / custom item — minimal row
      return el("div.feature", null, [
        el("h4", null, [el("span", { text: e.name }), el("span.mono", { style: { color: "var(--text3)", fontSize: "13px" }, text: "×" + e.qty })]),
        el("div.row", { style: { gap: "6px", marginTop: "4px" } }, [el("button.btn.sm", { onclick: function () { drop(e.name); } }, "DROP")])
      ]);
    });
    return [EN.ui.panel("Stash", entries.length + " ITEM TYPES", cards.length ? cards :
      [el("p.help", { style: { margin: 0 }, text: "Empty. The Undercut is open — it's always open." })], { corners: true })];
  }

  function chromeView(ch) {
    var nameIn = el("input", { type: "text", placeholder: "chrome designation…", style: { maxWidth: "240px" } });
    var cards = (ch.cyberware || []).map(function (name) {
      return el("div.feature", { style: { borderLeftColor: "var(--accent)" } }, [
        el("h4", null, [
          el("span", { text: name }),
          el("button.btn.sm", { title: "Uninstall (surgery not included)", onclick: function () { store.update(function (c) { c.cyberware = (c.cyberware || []).filter(function (n) { return n !== name; }); }); } }, "✕ UNINSTALL")
        ])
      ]);
    });
    return [EN.ui.panel("Chrome", (ch.cyberware || []).length + " INSTALLED", (cards.length ? cards :
      [el("p.help", { style: { margin: 0 }, text: "No augments on record. Clean body, short résumé." })]).concat([
      el("p.help", { style: { margin: "10px 0 0" }, text: "Open Architecture combos are detected automatically on the #PRINT tab. The chrome catalog and ripperdoc services come to the Undercut later." })
    ]), { corners: true, headerRight: [nameIn, el("button.btn.sm.primary", { onclick: function () {
        var v = nameIn.value.trim(); if (!v) return;
        store.update(function (c) { c.cyberware = c.cyberware || []; if (c.cyberware.indexOf(v) === -1) c.cyberware.push(v); });
      } }, "+ INSTALL")] })];
  }

  function marketView(ch) {
    var g = EN.gearCatalog || {};
    var melee = (g.melee && g.melee.items) || [];
    var ranged = (g.ranged && g.ranged.items) || [];
    var sig = (g.signature && g.signature.items) || [];
    var sigMun = (g.signature && g.signature.munitions) || [];
    var ammo = (g.ammo && g.ammo.items) || [];
    var blocks = [];
    var BANNERS = {
      undercut: {
        title: "THE UNDERCUT", color: "var(--ember)", glow: "rgba(255,90,40,.05)",
        sub: "GRAY-MARKET UPLINK · LIST PRICE, NO PAPERWORK · NO RECEIPTS · NO NAMES",
        body: ["Every legitimate storefront charges for compliance, verification, and the privilege of being watched while you pay. The Undercut skips all of it and sells at the number printed in the book. Cash up front. Don't ask for a receipt — asking for a receipt is how they find you."]
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
               "Take what the story gave you. The fence won't touch any of it — no provenance, no payout. Drop it or donate it when you're done.",
               "No receipts. No refunds. No snitching."]
      }
    };
    var B = BANNERS[_mode] || BANNERS.undercut;
    blocks.push(el("div", { style: { marginBottom: "14px", padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "4px",
                                     background: "linear-gradient(180deg, " + B.glow + ", transparent)" } }, [
      el("div", { style: { fontFamily: "var(--disp)", fontSize: "16px", letterSpacing: ".22em", color: B.color }, text: B.title }),
      el("div.mono", { style: { fontSize: "10.5px", color: "var(--text3)", letterSpacing: ".1em", marginTop: "2px" }, text: B.sub })
    ].concat(B.body.map(function (p, i) {
      return el("p.help", { style: { margin: (i === 0 ? "8px" : "4px") + " 0 0" }, text: p });
    }))));

    /* collapsible stock sections */
    function section(id, title, intro, items) {
      if (!items.length) return [];
      var open = !!_open[id];
      var head = el("div.section-title", { style: { margin: "8px 0 4px", cursor: "pointer" },
        onclick: function () { _open[id] = !open; EN.app.render(); } }, [
        document.createTextNode((open ? "▾ " : "▸ ") + title + " (" + items.length + ")"), el("span.line")
      ]);
      if (!open) return [head];
      var kids = [head];
      if (intro) kids.push(el("p.help", { style: { margin: "0 0 6px" }, text: intro }));
      items.forEach(function (it) { kids.push(itemCard(it, ch, "mkt")); });
      return kids;
    }
    var ri = (g.ranged && g.ranged.groupIntros) || {};
    var si = (g.signature && g.signature.groupIntros) || {};
    var byGroup = function (list, grp) { return list.filter(function (i) { return i.group === grp; }); };
    var byKind = function (list, k) { return list.filter(function (i) { return i.kind === k; }); };
    var kids = [];
    kids = kids.concat(
      section("mkt-melee-s", "Melee — Simple", g.melee && g.melee.simpleIntro, byGroup(melee, "Simple")),
      section("mkt-melee-m", "Melee — Martial", g.melee && g.melee.martialIntro, byGroup(melee, "Martial")),
      section("mkt-side", "Sidearms", ri["Sidearm"], byGroup(ranged, "Sidearm")),
      section("mkt-long", "Longarms", ri["Longarm"], byGroup(ranged, "Longarm")),
      section("mkt-heavy", "Heavy Weapons", ri["Heavy"], byGroup(ranged, "Heavy")),
      section("mkt-launch", "Explosive Launchers", ri["Launcher"], byGroup(ranged, "Launcher")),
      section("mkt-thrown", "Thrown Weapons", ri["Thrown"], byGroup(ranged, "Thrown")),
      section("mkt-bow", "Bowfire", ri["Bowfire"], byGroup(ranged, "Bowfire")),
      section("mkt-sig-m", "Signature — Melee", (g.signature && g.signature.intro ? g.signature.intro + " " : "") + (si.melee || ""), byKind(sig, "melee")),
      section("mkt-sig-r", "Signature — Ranged", si.ranged, byKind(sig, "ranged")),
      section("mkt-sig-mun", "Signature Munitions", g.signature && g.signature.munitionsIntro, sigMun),
      section("mkt-ammo-p", "Ammo — Standard, Plentiful", "Track only the loaded magazine; restock to full between contracts. Prices buy one reload.", byGroup(ammo, "Plentiful")),
      section("mkt-ammo-c", "Ammo — Standard, Counted", "Heavy, expensive, watched, and scarce. Track each unit from purchase to spend. A missile is a decision, not a refill.", byGroup(ammo, "Counted")),
      section("mkt-ammo-s", "Ammo — Specialty", "All Counted: Load it, Declare it before the attack, Apply it on resolution. The difference between a legal magazine and a felony is sometimes just which three rounds you loaded on top.", byGroup(ammo, "Specialty")),
      section("mkt-ammo-l", "Launcher Shells", "Fired from a Grenade Launcher: same arc, same range, entirely different problem on the other end. Targets save Agility vs your Weapon Save DC.", byGroup(ammo, "Launcher Shell"))
    );
    if (g.ranged) kids.push(el("p.help", { style: { margin: "10px 0 0", color: "var(--text4)" }, text: (g.ranged.saveDcNote || "") + " Armor, tools and worse arrive when the next shipment clears the checkpoint." }));
    var total = melee.length + ranged.length + sig.length + sigMun.length + ammo.length;
    blocks.push(EN.ui.panel("Stock", "WEAPONS & AMMO · " + total + " LISTINGS", kids, { corners: true }));
    return blocks;
  }

  /* ---- main render ---- */
  function render(mount) {
    var ch = store.active();
    clear(mount);
    if (!ch) {
      mount.appendChild(el("div.muted-box", { style: { marginTop: "40px", padding: "40px" }, text: "No Freelancer on file — register one on the #PRINT tab." }));
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
    var settingsAnchor = el("div.inv-pop-anchor", { style: { position: "relative" } }, [
      el("button.btn.sm", { title: "Storefront settings — pick how the market prices its stock",
        style: _settingsOpen ? { color: "var(--accent)", borderColor: "var(--accent)" } : null,
        onclick: function () { _settingsOpen = !_settingsOpen; EN.app.render(); } }, "⚙"),
      _settingsOpen ? el("div", { style: { position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 40, width: "280px",
                                           display: "flex", flexDirection: "column", gap: "6px", padding: "10px",
                                           background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "4px",
                                           boxShadow: "0 8px 24px rgba(0,0,0,.55)", textAlign: "left" } },
        [el("label.fl", { style: { margin: "0 0 2px" }, text: "Storefront" })].concat(STOREFRONTS.map(function (m) {
          var on = _mode === m.key;
          return el("button", {
            onclick: function () { _mode = m.key; _settingsOpen = false; EN.app.render(); },
            style: { textAlign: "left", padding: "8px 10px", cursor: "pointer", borderRadius: "4px", color: "var(--text)",
                     background: on ? "rgba(0,229,255,.07)" : "transparent",
                     border: "1px solid " + (on ? "var(--accent)" : "var(--border2)") }
          }, [
            el("div", { style: { fontFamily: "var(--disp)", fontSize: "12px", letterSpacing: ".12em", color: on ? "var(--accent)" : "var(--text2)" }, text: m.name.toUpperCase() + (on ? " ✓" : "") }),
            el("div", { style: { fontSize: "11px", color: "var(--text3)", marginTop: "2px", fontFamily: "var(--body)" }, text: m.desc })
          ]);
        }))) : null
    ]);
    blocks.push(el("div.row.between.wrap", { style: { gap: "10px", marginBottom: "14px", alignItems: "center" } }, [
      el("div.row.wrap", { style: { gap: "6px" } }, [
        subTab("stash", "▣ STASH"),
        subTab("chrome", "⌖ CHROME"),
        subTab("market", "◉ " + storefront().name.toUpperCase())
      ]),
      el("div.row.wrap", { style: { gap: "8px", alignItems: "center" } }, [
        el("span.mono", { title: "Glimmer — issued by the Luster Interchange Treasury. What ordinary life costs.",
          style: { fontSize: "20px", color: "var(--gold)" }, text: fmtG(ch.glimmer || 0) }),
        amtIn,
        el("button.btn.sm", { title: "Credit the ledger (payouts, fenced goods, day-job pay)", style: { color: "var(--success)", borderColor: "var(--success)" },
          onclick: function () { store.update(function (c) { c.glimmer = (c.glimmer || 0) + _ledgerAmt; }); } }, "+ CREDIT"),
        el("button.btn.sm", { title: "Debit the ledger (lifestyle, upkeep, bribes, bad nights)", style: { color: "var(--danger)", borderColor: "var(--danger)" },
          onclick: function () { store.update(function (c) { c.glimmer = Math.max(0, (c.glimmer || 0) - _ledgerAmt); }); } }, "− DEBIT"),
        settingsAnchor
      ])
    ]));

    var body = _sub === "market" ? marketView(ch) : _sub === "chrome" ? chromeView(ch) : stashView(ch);
    body.forEach(function (b) { blocks.push(b); });
    mount.appendChild(el("div", null, blocks));
  }

  return { render: render };
})();
