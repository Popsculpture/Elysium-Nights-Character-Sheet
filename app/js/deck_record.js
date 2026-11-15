/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDeck: the Record drawer (P2, 15 Nov 2026).
   The Freelancer's own record, pulled out over whatever screen is open from the name in the status bar:
     DOSSIER      features, proficiencies, senses and the freeform notes (read from the engine; nothing here
                  works a number out)
     LEVEL UP     where the level stands, and whichever choices are waiting; the choosing itself is still the
                  Advance step of #PRINT, one press away, until this skin grows its own
     EDIT RECORD  each step of the #PRINT builder, opened where it lives; the hardcopy and the PDF
     CHARACTERS   every record on file and the examples: switch, new, import, export, manage
   It is an overlay of its own, outside #view, like the Codex peek: opening it leaves the page behind exactly
   where it was. js/deck_shell.js calls sync() on every render, so it always shows the record that is open,
   and closes with the dock when there is none.

   Everything it does is a function another screen already had: EN.builder (goStep, openAdvance, newRecord,
   importPrompt, exportChar, openManager), EN.store (setActive, setExample), EN.printSheet, EN.pdfExport.
   DOM rules as in js/deck_shell.js: one .dk root, dk- classes only. No em or en dashes (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.record = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;
  var TABS = [["dossier", "Dossier"], ["level", "Level up"], ["edit", "Edit record"], ["chars", "Characters"]];
  var D = null;          // the open drawer: { root, tab, head, tabs, body, from }
  var OPENED = {};       // the features whose text is unfolded, by name

  function reading() { try { return EN.deck.shell.reading(); } catch (e) { return null; } }
  function isOpen() { return !!D; }

  /* The choices a level has handed out and nobody has made yet: a Universal Upgrade slot with nothing in
     it (levels 2, 4, 6 and 8) and the free Awakening Evolution of Level 4. The Advance step marks the same
     slots; this is only the count the status bar and this drawer show. Unspent Training Points are listed in
     the drawer and do not raise the flag: banking them is a choice too. */
  function owed(c) {
    var ch = c && c.ch, out = [];
    if (!ch || !ch.class) return out;
    var lvl = ch.level || 1, uu = ch.universalUpgrades || {};
    [2, 4, 6, 8].forEach(function (L) { if (L <= lvl && !uu[L]) out.push("Level " + L + " Universal Upgrade"); });
    try { if (lvl >= 4 && EN.engine.awakeningPick && !EN.engine.awakeningPick(ch)) out.push("Level 4 Awakening: a free Lineage Evolution"); } catch (e) {}
    return out;
  }

  function close(refocus) {
    if (!D) return;
    var d = D; D = null;
    if (d.root.parentNode) d.root.parentNode.removeChild(d.root);
    document.removeEventListener("keydown", onKey, true);
    if (refocus !== false && d.from && document.contains(d.from)) { try { d.from.focus({ preventScroll: true }); } catch (e) {} }
  }
  function onKey(e) {
    if (!D) return;
    // a rule opened from here, the settings tray and the character manager each take their own Escape first
    if (document.getElementById("codex-peek") || document.getElementById("set-ov") || document.getElementById("mgr")) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== "Tab") return;
    var f = Array.prototype.slice.call(D.root.querySelectorAll("button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href], [tabindex='0']"))
      .filter(function (n) { return n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], at = document.activeElement;
    if (e.shiftKey && (at === first || !D.root.contains(at))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (at === last || !D.root.contains(at))) { e.preventDefault(); first.focus(); }
  }
  function open(tab) {
    var c = reading();
    if (!c) return false;
    var want = TABS.some(function (t) { return t[0] === tab; }) ? tab : "dossier";
    if (D) { D.tab = want; paint(c, true); return true; }
    var os = document.getElementById("os");
    if (!os) return false;
    D = { tab: want, from: document.activeElement };
    D.head = el("div.dk-recid");
    D.tabs = el("div.dk-seg", { role: "tablist" });
    D.body = el("div.dk-drb", { role: "tabpanel" });
    D.x = el("button.dk-x", { type: "button", "aria-label": "Close", dataset: { dkRec: "close" }, onclick: function () { close(); } }, "✕");
    D.root = el("div#dk-rec.dk", null, [
      el("div.dk-scrim", { onclick: function () { close(); } }),
      el("aside.dk-drawer", { role: "dialog", "aria-modal": "true", "aria-label": "Your record" }, [D.x, el("div.dk-drh", null, [D.head, D.tabs]), D.body])
    ]);
    os.appendChild(D.root);
    document.addEventListener("keydown", onKey, true);
    paint(c, true);
    try { D.x.focus({ preventScroll: true }); } catch (e) {}
    return true;
  }
  // every render: the record that is open now, or nothing at all
  function sync(c) {
    if (!D) return;
    if (!c) { close(false); return; }
    paint(c, false);
  }

  /* ---- drawing ---- */
  function h(text, small) { return el("h4.dk-h", null, [text, small ? el("small", { text: small }) : null]); }
  function note(text) { return el("p.dk-empty", { text: text }); }
  function btn(label, tone, name, fn, title) { return el("button.dk-btn" + (tone ? "." + tone : ""), { type: "button", title: title || null, dataset: { dkDo: name }, onclick: fn }, label); }
  function chip(text, title, tone) { return el("span.dk-chip" + (tone ? "." + tone : ""), { title: title || null, text: text }); }

  function paint(c, force) {
    var ch = c.ch, d = c.d || {};
    // who
    clear(D.head);
    var bits = [];
    if (d.speciesInfo && d.speciesInfo.name) bits.push(d.speciesInfo.name + (d.lineageInfo && d.lineageInfo.name ? " (" + d.lineageInfo.name + ")" : ""));
    if (d.backgroundInfo && d.backgroundInfo.name) bits.push(d.backgroundInfo.name);
    if (d.classInfo && d.classInfo.name) bits.push(d.classInfo.name + (d.subclassInfo && d.subclassInfo.name ? ", " + d.subclassInfo.name : ""));
    D.head.appendChild(el("span.dk-lvbig", { text: String(d.level || ch.level || 1) }));
    D.head.appendChild(el("div", null, [
      el("h2", { text: ch.name || "Unnamed Freelancer" }),
      el("p", { text: bits.join(" · ") || "No class yet" }),
      el("p", { text: "Level " + (d.level || ch.level || 1) + (d.caliber ? " · Caliber " + d.caliber : "") + (c.readOnly ? " · read only" : "") })
    ]));
    // which page
    var waiting = c.readOnly ? 0 : owed(c).length, held = D.tabs.contains(document.activeElement) ? document.activeElement.getAttribute("data-dk-rec") : null;
    clear(D.tabs);
    TABS.forEach(function (t) {
      D.tabs.appendChild(el("button.dk-segb" + (D.tab === t[0] ? ".on" : ""), { type: "button", role: "tab", "aria-selected": D.tab === t[0] ? "true" : "false", dataset: { dkRec: t[0] },
        onclick: function () { D.tab = t[0]; paint(reading() || c, true); } },
        [t[1], t[0] === "level" && waiting ? el("i.dk-dot", { title: waiting + (waiting === 1 ? " choice is waiting" : " choices are waiting") }) : null]));
    });
    if (held) { var again = D.tabs.querySelector('[data-dk-rec="' + held + '"]'); if (again) { try { again.focus({ preventScroll: true }); } catch (e) {} } }
    // the page: left alone while something in it is being typed (a cloud sync redraws the app under the player)
    var at = document.activeElement;
    if (!force && at && D.body.contains(at) && /^(TEXTAREA|INPUT)$/.test(at.tagName)) return;
    // a button pressed in the page is redrawn with it (Switch, a feature's fold): the one that takes its place keeps the focus
    var heldIn = at && D.body.contains(at) ? (at.getAttribute("data-dk-do") ? '[data-dk-do="' + at.getAttribute("data-dk-do") + '"]'
      : at.parentNode && at.parentNode.getAttribute("data-dk-feat") ? '[data-dk-feat="' + String(at.parentNode.getAttribute("data-dk-feat")).replace(/["\\]/g, "\\$&") + '"] .dk-fth' : "*") : null;
    clear(D.body);
    D.body.setAttribute("data-dk-rec-tab", D.tab);
    (D.tab === "level" ? level : D.tab === "edit" ? edit : D.tab === "chars" ? chars : dossier)(c).forEach(function (n) { if (n) D.body.appendChild(n); });
    if (heldIn) {
      var keep = heldIn === "*" ? null : D.body.querySelector(heldIn);
      try { (keep || D.x).focus({ preventScroll: true }); } catch (e) {}
    }
  }

  function dossier(c) {
    var ch = c.ch, d = c.d, eng = EN.engine, R = EN.rules, out = [];
    if (!d) return [note("This record could not be read.")];
    // features: the name and where it comes from; a press unfolds the text as the book has it
    out.push(h("Features", "press one to read it"));
    var feats = d.features || [];
    if (!feats.length) out.push(note("No features yet."));
    feats.forEach(function (f) {
      var on = !!OPENED[f.name];
      out.push(el("div.dk-ft" + (on ? ".on" : ""), { dataset: { dkFeat: f.name } }, [
        el("button.dk-fth", { type: "button", "aria-expanded": on ? "true" : "false", onclick: function () { OPENED[f.name] = !on; paint(reading() || c, true); } },
          [el("b", { text: f.name }), typeof f.action === "string" && f.action ? chip(f.action) : null, el("small", { text: f.source || "" }), el("span.dk-caret", { text: on ? "▾" : "▸" })]),
        on ? el("div.dk-ftx", null, [EN.ui.renderText(f.text || "", {})]) : null
      ]));
    });

    // proficiencies: the gear this Freelancer runs clean, the languages, and the narrow training
    var TIER = { proficient: "Proficient", expertise: "Expert", mastery: "Mastery" };
    function gearRow(label, bucket) {
      var chips = ((R.gear && R.gear[bucket]) || []).map(function (cat) {
        var tier = eng.effectiveGearTier(ch, bucket, cat);
        return tier === "untrained" ? null : chip(cat + (tier !== "proficient" ? " · " + TIER[tier] : ""), TIER[tier]);
      }).filter(Boolean);
      return chips.length ? el("div.dk-prow", null, [el("i", { text: label }), el("div.dk-chips", null, chips)]) : null;
    }
    function listRow(label, chips) { return chips.length ? el("div.dk-prow", null, [el("i", { text: label }), el("div.dk-chips", null, chips)]) : null; }
    function parent(f) { if (f.type && f.type !== "skill") return f.parent; var sk = R.skillByKey[f.parent || f.skill]; return sk ? sk.name : (f.parent || f.skill); }
    var prof = [gearRow("Weapons", "weapons"), gearRow("Armor", "armor"), gearRow("Tools", "tools"), gearRow("Vehicles", "vehicles"),
      listRow("Languages", (eng.languages ? eng.languages(ch) : []).map(function (l) { return chip(l.name + (l.understandOnly ? " · understand only" : "")); })),
      listRow("Focus", (ch.skillFocuses || []).map(function (f) { return chip(parent(f) + (f.aspect && String(f.aspect).trim() ? " (" + f.aspect + ")" : " (aspect not named)"), "Skill Focus", "acc"); })),
      listRow("Spec", (ch.specializations || []).map(function (f) { return chip(parent(f) + (f.aspect ? " (" + f.aspect + ")" : ""), "Specialization", "acc"); }))
    ].filter(Boolean);
    out.push(h("Proficiencies and training"));
    if (prof.length) prof.forEach(function (n) { out.push(n); }); else out.push(note("No gear proficiencies yet. They come from your class and background, or from Training Points."));

    // senses: the passive scores, a named Focus as its own line, then what a feature grants
    out.push(h("Senses"));
    ["perception", "investigation", "intuition", "systems"].forEach(function (k) {
      var s = (d.skills || []).filter(function (x) { return x.key === k; })[0];
      if (!s) return;
      out.push(el("div.dk-srow", { dataset: { dkPassive: k } }, [el("span", { text: "Passive " + s.name }), el("b", { text: String(s.passive) })]));
      (s.passiveFocus || []).forEach(function (pf) { out.push(el("div.dk-srow.dk-sub", null, [el("span", { text: eng.fmtPassiveFocus(pf) })])); });
    });
    (eng.senseGrants ? eng.senseGrants(feats.map(function (f) { return f.name; })) : []).forEach(function (g) {
      out.push(el("div.dk-srow", { title: g.note || null }, [el("span", null, [g.sense, " ", chip(g.feature)]), el("b", { text: g.range })]));
    });

    // notes: the same field as the Sheet's NOTES and the #PRINT Identity step
    out.push(h("Notes"));
    out.push(el("textarea.dk-in.dk-notes", { value: (ch.identity && ch.identity.notes) || "", disabled: !!c.readOnly, dataset: { dkRec: "notes" },
      placeholder: "Freeform notes for this Freelancer: debts, leads, injuries, rulings, anything",
      oninput: function () { var v = this.value; EN.store.update(function (r) { r.identity = r.identity || {}; r.identity.notes = v; }, { silent: true }); } }));
    return out;
  }

  function toPrint(step) {
    close(false);
    try { if (step === "advance") EN.builder.openAdvance(); else EN.builder.goStep(step); } catch (e) {}
    EN.app.gotoTab("print");
    // the rail's own tap on #PRINT lands on Advance; this names its step, so say it again once the tab is up
    try { if (step !== "advance") EN.builder.goStep(step); } catch (e) {}
  }
  function level(c) {
    var ch = c.ch, d = c.d || {}, out = [], lvl = d.level || ch.level || 1;
    var onXp = EN.campaigns && EN.campaigns.usesXp ? EN.campaigns.usesXp(ch) : !!ch.useXp;
    var card = [el("h4", { text: "Level " + lvl + (d.caliber ? " · Caliber " + d.caliber : "") })];
    if (onXp) {
      var from = EN.rules.xpThresholds[lvl] || 0, to = d.xpForNext, xp = Number(ch.xp) || 0;
      card.push(el("p", { text: to != null ? xp + " XP. Level " + (lvl + 1) + " at " + to + " XP." : xp + " XP. This is the highest level." }));
      if (to != null && to > from) card.push(el("span.dk-track", null, [el("span.dk-fill", { style: { width: Math.max(0, Math.min(100, 100 * (xp - from) / (to - from))) + "%" } })]));
    } else {
      var m = ch.milestones || {};
      card.push(el("p", { text: "Milestones: " + (m.major || 0) + " major, " + (m.minor || 0) + " minor." }));
    }
    out.push(el("div.dk-card", { dataset: { dkRec: "level-card" } }, card));
    var list = c.readOnly ? [] : owed(c);
    if (list.length) {
      out.push(el("div.dk-card.dk-lu", { dataset: { dkRec: "owed" } }, [
        el("h4", { text: list.length === 1 ? "A choice is waiting" : list.length + " choices are waiting" }),
        el("ul", null, list.map(function (t) { return el("li", { text: t }); })),
        btn("Choose on the Advance step", "pri", "advance", function () { toPrint("advance"); })
      ]));
    } else {
      out.push(note("Nothing to choose right now. When a level hands you a choice, the status bar says so and it is listed here."));
    }
    var tp = d.trainingPoints;
    if (tp && tp.remaining > 0) out.push(el("div.dk-card", { dataset: { dkRec: "tp" } }, [el("h4", { text: tp.remaining + (tp.remaining === 1 ? " Training Point" : " Training Points") + " unspent" }),
      el("p", { text: "Spend them on skills, gear proficiencies, a Skill Focus or a language, on the Advance step." })]));
    if (!list.length && !c.readOnly) out.push(el("div.dk-row", null, [btn("Open the Advance step", "", "advance", function () { toPrint("advance"); }, "Level, XP or milestones, Training Points and Universal Upgrades")]));
    return out;
  }
  function edit(c) {
    var out = [note("Each row opens that step of #PRINT, where the record is edited.")];
    [["identity", "Identity", "Name, handle, look, notes"], ["attributes", "Attributes", ""], ["species", "Species and lineage", ""], ["background", "Background", ""],
     ["class", "Class", "Class, subclass and their picks"], ["advance", "Advance", "Level, Training Points, Universal Upgrades"], ["dossier", "#PRINT", "The record as filed"]].forEach(function (x) {
      out.push(el("div.dk-ft.dk-line", null, [el("b", { text: x[1] }), el("small", { text: x[2] }), el("span.dk-grow"), btn("Open", "sm", "step-" + x[0], function () { toPrint(x[0]); })]));
    });
    out.push(el("div.dk-row", null, [
      EN.printSheet && EN.printSheet.open ? btn("Print hardcopy", "ghost", "print", function () { close(false); EN.printSheet.open(); }) : null,
      EN.pdfExport && EN.pdfExport.download ? btn("Fillable PDF", "ghost", "pdf", function () { EN.pdfExport.download(EN.store.active()); }) : null
    ]));
    return out;
  }
  function chars(c) {
    var store = EN.store, ch = c.ch, out = [], roster = store.roster(), ids = Object.keys(roster);
    var ex = !!(store.activeIsExample && store.activeIsExample()), viewing = !!(store.activeIsViewing && store.activeIsViewing());
    function line(r, id) {
      var cls = r && r["class"] ? String(r["class"]) : "", camp = "";
      try { camp = EN.campaigns && id ? EN.campaigns.recordCampaignName(id) : ""; } catch (e) { camp = ""; }
      return (cls ? cls.charAt(0).toUpperCase() + cls.slice(1) : "No class") + " · Level " + (typeof r.level === "number" ? r.level : 1) + (camp ? " · " + camp : "") + (r.meta && !r.meta.filedAt ? " · not filed" : "");
    }
    function row(name, sub, live, label, key, fn) {
      return el("div.dk-ft.dk-line" + (live ? ".on" : ""), { dataset: { dkChar: key } }, [
        el("span.dk-two", null, [el("b", { text: name }), el("small", { text: sub })]), el("span.dk-grow"),
        live ? chip("Active", null, "ok") : btn(label, "sm", "open-" + key, fn)
      ]);
    }
    if (viewing) out.push(row(typeof ch.name === "string" && ch.name ? ch.name : "A sheet", "Another player's sheet, read only", true, "", "viewing", null));
    out.push(h("On file"));
    if (!ids.length) out.push(note("No record of your own yet."));
    ids.forEach(function (id) {
      var r = roster[id];
      out.push(row(typeof r.name === "string" && r.name ? r.name : "Unnamed", line(r, id), !ex && !viewing && ch.meta && ch.meta.id === id, "Switch", id,
        function () { store.setActive(id); try { EN.builder.goStep("identity"); } catch (e) {} EN.app.render(); }));
    });
    if ((EN.examples || []).length) {
      out.push(h("Examples", "not saved: a reload restores them"));
      EN.examples.forEach(function (x) {
        out.push(row(x.name, x.label, ex && ch.meta && ch.meta.example === x.key, "Open", "ex-" + x.key,
          function () { store.setExample(x.key); try { EN.builder.goStep("identity"); } catch (e) {} EN.app.render(); }));
      });
    }
    out.push(el("div.dk-row", null, [
      btn("+ New character", "pri", "new", function () { close(false); EN.builder.newRecord(); }),
      btn("Import", "", "import", function () { EN.builder.importPrompt(); }),
      btn("Export", "", "export", function () { EN.builder.exportChar(EN.store.active()); }),
      btn("Manage", "", "manage", function () { close(false); EN.builder.openManager(); }, "Rename, delete and campaign membership")
    ]));
    return out;
  }

  return { open: open, close: close, sync: sync, isOpen: isOpen, owed: owed };
})();
