/* ===========================================================================
   ELYSIUM NIGHTS · Sourcerer Scrap Companion (Level 7)
   The builder and tracker for the Scrap Companion, which replaced the Scrap
   Familiar on 25 October 2026 (handoff batch 78). Each assembly or refit picks
   a resident (Nixie or Gremlin), one movement type, a size and one rig. The
   numbers come from the book's base stats:
     Defense  = 12 + your Tech Modifier
     Vitality = 15 + (your Caliber x 5)
   The Relay works for Synthetica Invocations only, and the resident decides
   the free fold (Nixie Favor or Gremlin Jinx). While Absolute Symbiosis runs
   and the companion is active, both sprites crowd in and it folds both.
   State lives on ch.scrapCompanion (see store.js); the words live in
   EN.classes.shaper.extra.scrapCompanion.
   =========================================================================== */
window.EN = window.EN || {};

EN.companion = (function () {
  var FEATURE = "Scrap Companion";

  function data() {
    var sh = EN.classes && EN.classes.shaper;
    return (sh && sh.extra && sh.extra.scrapCompanion) || null;
  }
  function byKey(list, key) {
    for (var i = 0; i < (list || []).length; i++) if (list[i].key === key) return list[i];
    return null;
  }
  function hasFeature(d, name) {
    return !!(d && (d.features || []).some(function (f) { return f && f.name === name; }));
  }

  /* The stored build, read defensively: a value the data does not offer reads as unchosen. */
  function state(ch) {
    var X = data() || { residents: [], movements: [], sizes: [], rigs: [] };
    var s = (ch && ch.scrapCompanion && typeof ch.scrapCompanion === "object") ? ch.scrapCompanion : {};
    var pick = Array.isArray(s.rigPick) ? s.rigPick.filter(function (k) { return !!byKey(X.rigs, k); }) : [];
    return {
      resident: byKey(X.residents, s.resident) ? s.resident : null,
      movement: byKey(X.movements, s.movement) ? s.movement : null,
      size: X.sizes.indexOf(s.size) !== -1 ? s.size : null,
      rig: byKey(X.rigs, s.rig) ? s.rig : null,
      active: !!s.active,
      vitLost: Math.max(0, Math.floor(Number(s.vitLost) || 0)),
      symbiosis: !!s.symbiosis,
      rigPick: pick.length > 1 ? pick : null,
      migratedFrom: typeof s.migratedFrom === "string" ? s.migratedFrom : null
    };
  }

  function derive(ch, d) {
    d = d || EN.engine.derive(ch);
    var X = data();
    var st = state(ch);
    var tec = (d.attributes && d.attributes.TEC) ? d.attributes.TEC.mod : 0;
    var cal = d.caliber || 0;
    var res = byKey(X && X.residents, st.resident);
    var mov = byKey(X && X.movements, st.movement);
    var rig = byKey(X && X.rigs, st.rig);
    var defense = 12 + tec;
    var vitality = 15 + cal * 5;
    var symb = hasFeature(d, "Absolute Symbiosis");
    var both = symb && st.symbiosis && st.active;
    var folds = both ? ["Nixie Favor", "Gremlin Jinx"] : (res ? [res.fold] : []);
    return {
      has: hasFeature(d, FEATURE),
      hasSymbiosis: symb,
      resident: st.resident, residentName: res ? res.name : null,
      movement: st.movement, movementName: mov ? mov.name : null,
      size: st.size,
      rig: st.rig, rigName: rig ? rig.name : null, rigText: rig ? rig.text : null,
      rigPick: st.rigPick, migratedFrom: st.migratedFrom,
      defense: defense, vitality: vitality,
      vitCurrent: Math.max(0, vitality - st.vitLost),
      broken: st.active && st.vitLost >= vitality,
      speed: X ? X.stats.speed : 6,
      active: st.active, symbiosis: both,
      relayFolds: folds,
      complete: !!(st.resident && st.movement && st.size && st.rig)
    };
  }

  /* One line for the print sheet and the card header. */
  function summary(ch, d) {
    var c = derive(ch, d);
    if (!c.complete) return "Scrap Companion: not built yet (choose a resident, movement, size and rig).";
    return "Scrap Companion: " + c.residentName + " resident, " + c.movementName + ", " + c.size +
      ", " + c.rigName + " rig. Defense " + c.defense + ", Vitality " + c.vitality + ", Speed " + c.speed +
      ". Relay folds a " + c.relayFolds.join(" and a ") + " for free.";
  }

  function set(patch) {
    EN.store.update(function (c) {
      var s = c.scrapCompanion;
      if (!s || typeof s !== "object" || Array.isArray(s)) s = c.scrapCompanion = {};
      Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
    });
  }

  function card(ch, d) {
    var el = EN.ui.el;
    var X = data();
    if (!X) return null;
    var c = derive(ch, d);
    function pickSel(field, label, opts, cur) {
      return el("div.field", { style: { margin: 0, minWidth: "120px", flex: "1 1 120px" } }, [
        el("label.fl", { style: { margin: "0 0 2px" }, text: label }),
        el("select", { dataset: { sc: field }, style: { width: "100%" },
          onchange: function (e) {
            var v = e.target.value || null, p = {};
            p[field] = v;
            if (field === "rig") p.rigPick = null;
            set(p);
          } },
          [el("option", { value: "", text: "- choose -" })].concat(opts.map(function (o) {
            return el("option", { value: o.value, selected: cur === o.value, text: o.text });
          })))
      ]);
    }
    var kids = [];
    kids.push(el("h4", null, [document.createTextNode("Scrap Companion"), el("span.src", { text: "Build and track" })]));
    if (c.rigPick) {
      kids.push(el("div.muted-box", { dataset: { sc: "prompt" }, style: { borderColor: "var(--warn)", color: "var(--warn)", margin: "4px 0 8px" } }, [
        el("p", { style: { margin: "0 0 6px" }, text: "Your " + (c.migratedFrom || "Scrap Familiar") +
          " is now a Scrap Companion with a Gremlin resident. Pick its rig: " +
          c.rigPick.map(function (k) { var r = byKey(X.rigs, k); return r ? r.name : k; }).join(" or ") +
          ". Until you choose, it runs " + (c.rigName || "Hush") + "." }),
        el("div.row", { style: { gap: "6px" } }, c.rigPick.map(function (k) {
          var r = byKey(X.rigs, k);
          return el("button.btn.sm" + (k === c.rig ? ".primary" : ""), { dataset: { scpick: k },
            onclick: function () { set({ rig: k, rigPick: null }); } }, (r ? r.name : k).toUpperCase());
        }))
      ]));
    }
    kids.push(el("div.row.wrap", { style: { gap: "8px", margin: "4px 0 8px" } }, [
      pickSel("resident", "Resident", X.residents.map(function (r) { return { value: r.key, text: r.name }; }), c.resident),
      pickSel("movement", "Movement", X.movements.map(function (m) { return { value: m.key, text: m.name + " (" + m.text + ")" }; }), c.movement),
      pickSel("size", "Size", X.sizes.map(function (s) { return { value: s, text: s + " Construct" }; }), c.size),
      pickSel("rig", "Rig", X.rigs.map(function (r) { return { value: r.key, text: r.name }; }), c.rig)
    ]));
    kids.push(el("div.row.wrap", { dataset: { sc: "stats" }, style: { gap: "6px", alignItems: "center" } }, [
      el("span.chip", { dataset: { sc: "defense" }, title: "12 + your Tech Modifier", text: "DEFENSE " + c.defense }),
      el("span.chip", { dataset: { sc: "vitality" }, title: "15 + (your Caliber × 5)", text: "VITALITY " + c.vitCurrent + " / " + c.vitality }),
      el("span.chip", { text: "SPEED " + c.speed + (c.movementName ? " " + c.movementName.toUpperCase() : "") }),
      c.size ? el("span.chip", { text: c.size.toUpperCase() + " CONSTRUCT" }) : null,
      el("button.btn.sm", { title: "The companion takes 1 damage", onclick: function () { set({ vitLost: Math.min(c.vitality, (c.vitality - c.vitCurrent) + 1) }); } }, "−"),
      el("button.btn.sm", { title: "Restore 1 Vitality", onclick: function () { set({ vitLost: Math.max(0, (c.vitality - c.vitCurrent) - 1) }); } }, "+"),
      el("button.btn.sm" + (c.active ? ".primary" : ""), { dataset: { sc: "active" },
        title: c.active ? "Let the shell go" : "A new body: assembling resets its Vitality",
        onclick: function () { set(c.active ? { active: false, symbiosis: false } : { active: true, vitLost: 0 }); } },
        c.active ? "✓ ASSEMBLED" : "ASSEMBLE"),
      c.broken ? el("span.chip", { style: { color: "var(--danger)", borderColor: "var(--danger)" }, text: "SHELL BROKEN" }) : null
    ]));
    kids.push(el("p.help", { style: { margin: "6px 0 0" }, text: "Immunities: " + X.stats.immunities.join(", ") + ". Checks and Saves: " + X.stats.checks + "." }));
    var relayLine = c.relayFolds.length
      ? "The Relay (Synthetica Invocations only): once per turn, fold a " + c.relayFolds.join(" and a ") + " into it for free."
      : "The Relay (Synthetica Invocations only): choose a resident to set the free fold.";
    kids.push(el("p.help", { dataset: { sc: "relay" }, style: { margin: "4px 0 0", color: "var(--flow)" }, text: relayLine }));
    if (c.hasSymbiosis) {
      kids.push(el("label.row", { style: { gap: "6px", alignItems: "center", marginTop: "4px", fontSize: "12px" } }, [
        el("input", { type: "checkbox", checked: c.symbiosis, disabled: !c.active, dataset: { sc: "symbiosis" },
          onchange: function (e) { set({ symbiosis: !!e.target.checked }); } }),
        el("span", { text: "Absolute Symbiosis running (both sprites crowd into the companion)" })
      ]));
    }
    if (c.rigText) kids.push(el("div", { dataset: { sc: "rigtext" }, style: { marginTop: "6px" } },
      [el("p", { style: { margin: "0 0 2px", fontWeight: 600 }, text: c.rigName })].concat([EN.ui.renderText(c.rigText, {})])));
    return el("div.feature.companion", { dataset: { sc: "card" }, style: { marginTop: "6px", borderLeftColor: "var(--flow)" } }, kids);
  }

  return { FEATURE: FEATURE, data: data, state: state, derive: derive, summary: summary, card: card };
})();
