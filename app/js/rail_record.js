/* ===========================================================================
   ELYSIUM NIGHTS · THE RECORD DRAWER (16 Nov 2026, the author's call; it began as #GRIDeck's, and that skin was removed on
   20 Nov 2026). The name on Classic's status rail pulls the Freelancer's own record out over whatever tab is open:
     #PRINT       the Freelancer's identity tag (js/badge.js), drawn from the record, with a headshot the player uploads
     LEVEL UP     where the level stands, and whichever choices are waiting; the choosing itself is the Advance step of #PRINT
     EDIT RECORD  each step of the #PRINT builder, opened where it lives; the hardcopy and the PDF
     CHARACTERS   every record on file and the examples: switch, new, import, export, manage
     NOTES        the freeform notes, the same field as the Freelancer tab's and the #PRINT Identity step's
   Anything that asks for a page this drawer does not have ("dossier", say) opens the first one.
   It is an overlay of its own, outside #view, like the Codex peek: opening it leaves the page behind exactly where it was.
   js/rail_shell.js calls sync() on every render, so it always shows the record that is open, and closes with the rail.

   Everything it does is a function another screen already had: EN.builder (goStep, openAdvance, newRecord, importPrompt,
   exportChar, openManager), EN.store (setActive, setExample), EN.printSheet, EN.pdfExport, EN.badge.
   One .dk root, dk- classes only. No em or en dashes (house style).
   =========================================================================== */
window.EN = window.EN || {};
EN.deck = EN.deck || {};
EN.deck.record = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;
  var TABS = [["badge", "#PRINT"], ["level", "Level up"], ["edit", "Edit record"], ["chars", "Characters"], ["notes", "Notes"]];
  function tabs() { return TABS; }
  var D = null;          // the open drawer: { root, tab, head, tabs, body, from }

  function reading() { try { return EN.deck.shell.reading(); } catch (e) { return null; } }
  function isOpen() { return !!D; }

  /* The choices a level has handed out and nobody has made yet: a Universal Upgrade slot with nothing in
     it (levels 2, 4, 6 and 8) and the free Awakening Evolution of Level 4. The Advance step marks the same
     slots; this is only the count this drawer shows. Unspent Training Points are listed in
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
    var T = tabs(), want = T.some(function (t) { return t[0] === tab; }) ? tab : T[0][0];
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
    var ch = c.ch, d = c.d || {}, T = tabs();
    if (!T.some(function (t) { return t[0] === D.tab; })) D.tab = T[0][0];
    // who
    clear(D.head);
    // the level in a cut box as on the rail, the name over the class and subclass
    var cl = [d.classInfo && d.classInfo.name, d.subclassInfo && d.subclassInfo.name].filter(Boolean).join(" \u00b7 ");
    D.head.appendChild(el("span.dk-lvbox", { title: "Level " + (d.level || ch.level || 1) + (d.caliber ? " \u00b7 Caliber " + d.caliber : "") }, [el("i", { text: "LVL" }), el("b", { text: String(d.level || ch.level || 1) })]));
    D.head.appendChild(el("div", null, [el("h2", { text: ch.name || "Unnamed Freelancer" }), el("p", { text: (cl || "No class yet") + (c.readOnly ? " \u00b7 read only" : "") })]));
    // which page
    var waiting = c.readOnly ? 0 : owed(c).length, held = D.tabs.contains(document.activeElement) ? document.activeElement.getAttribute("data-dk-rec") : null;
    clear(D.tabs);
    T.forEach(function (t) {
      D.tabs.appendChild(el("button.dk-segb" + (D.tab === t[0] ? ".on" : ""), { type: "button", role: "tab", "aria-selected": D.tab === t[0] ? "true" : "false", dataset: { dkRec: t[0] },
        onclick: function () { D.tab = t[0]; paint(reading() || c, true); } },
        [t[1], t[0] === "level" && waiting ? el("i.dk-dot", { title: waiting + (waiting === 1 ? " choice is waiting" : " choices are waiting") }) : null]));
    });
    if (held) { var again = D.tabs.querySelector('[data-dk-rec="' + held + '"]'); if (again) { try { again.focus({ preventScroll: true }); } catch (e) {} } }
    // the page: left alone while something in it is being typed (a cloud sync redraws the app under the player)
    var at = document.activeElement;
    if (!force && at && D.body.contains(at) && /^(TEXTAREA|INPUT)$/.test(at.tagName)) return;
    // a button pressed in the page is redrawn with it (Switch, say): the one that takes its place keeps the focus
    var held = null;
    if (at && D.body.contains(at)) held = { act: at.getAttribute("data-dk-do") };
    clear(D.body);
    D.body.setAttribute("data-dk-rec-tab", D.tab);
    (D.tab === "level" ? level : D.tab === "edit" ? edit : D.tab === "chars" ? chars : D.tab === "notes" ? notes : badge)(c).forEach(function (n) { if (n) D.body.appendChild(n); });
    if (held) {
      // found by comparing values, never by building a selector out of a record's name
      var keep = held.act ? Array.prototype.filter.call(D.body.querySelectorAll("button"), function (b) { return b.getAttribute("data-dk-do") === held.act; })[0] : null;
      try { (keep || D.x).focus({ preventScroll: true }); } catch (e) {}
    }
  }

  function notesField(c) {
    var ch = c.ch;
    return el("textarea.dk-in.dk-notes", { value: (ch.identity && ch.identity.notes) || "", disabled: !!c.readOnly, dataset: { dkRec: "notes" },
      placeholder: "Freeform notes for this Freelancer: debts, leads, injuries, rulings, anything",
      oninput: function () { var v = this.value; EN.store.update(function (r) { r.identity = r.identity || {}; r.identity.notes = v; }, { silent: true }); } });
  }
  // the NOTES page
  function notes(c) { return [h("Notes", "the same field as the Sheet's Notes and the #PRINT Identity step"), notesField(c)]; }

  /* THE #PRINT BADGE (the first page): the Freelancer's identity tag, drawn from the record by js/badge.js, and the
     headshot that goes on it. A picture is picked, centre-cropped and shrunk in the browser, and kept on the record
     (identity.portrait), so it goes wherever the record goes. A viewed or locked sheet cannot change it. */
  function badge(c) {
    var ch = c.ch, d = c.d || {}, B = EN.badge, ro = !!c.readOnly;
    if (!B) return [note("The badge could not be drawn.")];
    var file = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp", hidden: true, dataset: { dkRec: "portrait-file" },
      onchange: function () { var f = this.files && this.files[0]; this.value = ""; if (f) upload(f); } });
    function upload(f) {
      B.fromFile(f).then(function (url) { if (B.setPhoto(url)) EN.ui.toast("Headshot saved to this record."); })
        .catch(function (err) { EN.ui.toast(err && err.message ? err.message : "That picture could not be used."); });
    }
    var has = !!B.photo(ch);
    var wrap = el("div.dk-badge", { dataset: { dkBadge: "1" } }, [B.svg(ch, d, { onPhoto: ro ? null : function () { file.click(); } })]);
    var off = ro ? "This record is read only" : null;
    return [wrap, el("div.dk-row", null, [file,
      el("button.dk-btn.pri", { type: "button", disabled: ro, title: off || "Pick a picture: it is cropped to the badge's frame and kept on this record", dataset: { dkDo: "portrait" }, onclick: function () { file.click(); } }, has ? "Replace headshot" : "Upload headshot"),
      has ? el("button.dk-btn.ghost", { type: "button", disabled: ro, title: off, dataset: { dkDo: "portrait-clear" }, onclick: function () { B.clearPhoto(); } }, "Remove") : null]),
      // what a player needs to know to prepare the picture: the shape and size it ends up, and the kinds of file and their limit (js/badge.js)
      el("p.dk-empty", { dataset: { dkRec: "headshot-spec" } }, [el("b", { text: "Best size: 240 x 300 px, a portrait (4:5). " }),
        "Any 4:5 size, such as 480 x 600, is shrunk to that and stays sharp. JPEG, PNG or WebP, up to 12 MB."]),
      note("A picture of another shape is cropped from its centre, so crop it first to choose what shows. It is kept with the record: on every device you sign in on, in an export, and on the sheet your GM sees.")];
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
      out.push(note("Nothing to choose right now. When a level hands you a choice, it is listed here."));
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
