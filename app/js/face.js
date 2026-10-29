/* ===========================================================================
   ELYSIUM NIGHTS - Face tab
   The social sheet: Social Pressure and Faction Standing. It holds the
   persistent, sheet-level social ledger a Face carries between scenes (Profiles
   others hold of you, Faction Standing, Cred, Heat, Debts) plus a compact quick
   reference. The rules are EN.social (data/social.js), the one copy the Codex
   chapter Social Pressure & Faction Standing (the so- panels) renders in full:
   the quick reference reads that data and links into the chapter, and the
   ledger's names (standings, pressure states) come from it. The Sit-Down and
   the full Cred and Heat rules moved to the Game Master's Toolkit (2026-10-16
   handoff, section 8): this tab carries no Sit-Down reference and no ladder
   text, and links nothing the Freelancer Codex no longer has. The Cred and Heat
   trackers keep their 0 to 10 values (the author's decision 11).
   Three sub-tabs: the LEDGER (all of the above, and the default), CONTACTS (the
   people the Freelancer can reach, ch.face.contacts; see the CONTACTS block) and
   #POST (the mail, ch.face.post).
   State persists on ch.face; reference collapse state, the sub-tab and the
   Contacts search, filters and sort are transient.
   2026-10-24 rulings, section 9 item 1: the quick reference's Costs After a Roll section offers
   the social scene's costs for a Costly Success (scene-bound only) or a Mixed Result (either),
   read through EN.engine.sceneCosts from Core Resolution's tagged tables.
   =========================================================================== */
window.EN = window.EN || {};

EN.faceView = (function () {
  var el = EN.ui.el, store = EN.store;
  var _open = {};   // collapse state for reference sections, open messages and open contact cards
  var _sub = "ledger";   // 'ledger' | 'contacts' | 'post'; transient, like the Inventory's
  var _costTier = "costly";   // the Costs After a Roll section's result: 'costly' | 'mixed'; transient

  // a faction's posture toward the crew
  var STANDINGS = [
    { k: "allied",   label: "Allied",   color: "var(--success)" },
    { k: "friendly", label: "Friendly", color: "var(--accent)" },
    { k: "neutral",  label: "Neutral",  color: "var(--text3)" },
    { k: "wary",     label: "Wary",     color: "var(--warn)" },
    { k: "hostile",  label: "Hostile",  color: "var(--danger)" }
  ];
  // a recurring relationship's current pressure state
  var STATES = [
    { k: "open",     label: "Open",     color: "var(--text2)" },
    { k: "strained", label: "Strained", color: "var(--warn)" },
    { k: "locked",   label: "Locked",   color: "var(--danger)" }
  ];
  // which way a Debt points
  var DEBTDIRS = [
    { k: "owing", label: "You owe",     color: "var(--danger)" },
    { k: "owed",  label: "Owed to you", color: "var(--success)" }
  ];
  // The names are the book's (EN.social uses the same keys); the colors are the app's.
  // The literals above stay as the fallback when the data file did not load.
  (function () {
    var S = EN.social || {};
    function relabel(rows, src) {
      (src || []).forEach(function (r) { rows.forEach(function (o) { if (o.k === r.key && r.name) o.label = r.name; }); });
    }
    relabel(STANDINGS, S.factionStanding && S.factionStanding.ladder);
    relabel(STATES, S.pressureStates && S.pressureStates.states);
  })();
  function pick(list, k) {
    for (var i = 0; i < list.length; i++) if (list[i].k === k) return list[i];
    return list[0];
  }

  // ch.face is the social ledger. Mutating accessor (used on writes) establishes
  // the shape so old characters upgrade in place; faceRead() is the render-time
  // read that never mutates the stored character.
  function face(c) {
    c.face = c.face || {};
    var f = c.face;
    f.profiles = f.profiles || [];
    f.factions = f.factions || [];
    f.cred = f.cred || [];
    f.heat = f.heat || [];
    f.debts = f.debts || [];
    // Lifelike lineage: saved biometric and behavioral profiles of real people.
    // NOT the #GRID Persona (an avatar inside a node), not Ghost Persona
    // Protocol, and not the Faceless Persona Talent. Four unrelated things share
    // the word, so this list stays in the social ledger and out of ch.grid.
    f.personas = f.personas || [];
    f.post = f.post || [];   // the #POST inbox; see the POST block below
    f.contacts = f.contacts || [];   // the people you can reach; see the CONTACTS block below
    return f;
  }
  function faceRead(ch) {
    var f = ch.face || {};
    return { profiles: f.profiles || [], factions: f.factions || [], cred: f.cred || [], heat: f.heat || [], debts: f.debts || [],
             personas: f.personas || [], post: f.post || [], contacts: f.contacts || [] };
  }
  function fset(mut, silent) { store.update(function (c) { mut(face(c)); }, silent ? { silent: true } : undefined); }

  function help(t, color) { return el("p.help", { style: { margin: "0 0 10px", color: color || "var(--text3)" }, text: t }); }

  /* ---- generic editable tracker list --------------------------------------
     opts: { title, tag, key, cols, blank, empty, rule, ruleTitle }. rule is a Codex
     anchor for the panel's "?" chip (the rule the tracker keeps). Each col:
       { k, label, type:"text"|"select"|"num", options, ladder, tone, placeholder, flex } */
  function tracker(opts) {
    var rows = faceRead(store.active())[opts.key];
    var kids = [];
    if (rows.length) {
      kids.push(el("div.row", { style: { gap: "8px", padding: "0 30px 6px 2px", fontFamily: "var(--disp)", fontSize: "9px", letterSpacing: ".14em", color: "var(--text4)", textTransform: "uppercase" } },
        opts.cols.map(function (c) { return el("span", { style: { flex: c.flex || "1", minWidth: 0 }, text: c.label }); })));
      rows.forEach(function (rec, i) { kids.push(trackerRow(opts, rec, i)); });
    } else {
      kids.push(help(opts.empty || "None yet."));
    }
    kids.push(el("button.btn.sm", { style: { marginTop: "8px" }, onclick: function () { fset(function (f) { f[opts.key].push(Object.assign({}, opts.blank)); }); } }, "+ ADD"));
    var chip = opts.rule ? EN.ui.ruleChip(opts.rule, { title: opts.ruleTitle || opts.title }) : null;
    var p = EN.ui.panel(opts.title, opts.tag, kids, { corners: true, headerRight: chip });
    p.dataset.facePanel = opts.key;   // where a contact card's "see it in the ledger" lands
    return p;
  }
  function trackerRow(opts, rec, i) {
    var cells = opts.cols.map(function (c) {
      return el("span", { style: { flex: c.flex || "1", minWidth: 0 } }, [cellControl(opts, rec, i, c)]);
    });
    cells.push(el("button.btn.sm.ghost", { title: "Remove", style: { width: "26px", flex: "0 0 auto", color: "var(--text4)" },
      onclick: function () { fset(function (f) { f[opts.key].splice(i, 1); }); } }, "✕"));
    return el("div.row", { style: { gap: "8px", alignItems: "center", marginBottom: "7px" } }, cells);
  }
  function cellControl(opts, rec, i, c) {
    if (c.type === "select") {
      var cur = pick(c.options, rec[c.k]);
      var sel = el("select", { style: { color: cur.color, borderColor: cur.color },
        onchange: function () { fset(function (f) { f[opts.key][i][c.k] = sel.value; }); } },
        c.options.map(function (o) { return el("option", { value: o.k, text: o.label, selected: rec[c.k] === o.k }); }));
      return sel;
    }
    if (c.type === "num") {
      var v = Math.max(0, Math.min(10, rec[c.k] || 0));
      function set(nv) { nv = Math.max(0, Math.min(10, nv)); fset(function (f) { f[opts.key][i][c.k] = nv; }); }
      return el("div.row", { style: { gap: "6px", alignItems: "center" } }, [
        el("button.btn.sm", { disabled: v <= 0, onclick: function () { set(v - 1); } }, "−"),
        el("span.mono", { title: c.ladder ? c.ladder[Math.min(v, c.ladder.length - 1)] : "", style: { minWidth: "50px", textAlign: "center", color: c.tone || "var(--text)" }, text: v + " / 10" }),
        el("button.btn.sm", { disabled: v >= 10, onclick: function () { set(v + 1); } }, "+")
      ]);
    }
    var inp = el("input", { type: "text", value: rec[c.k] || "", placeholder: c.placeholder || "",
      oninput: function () { fset(function (f) { f[opts.key][i][c.k] = inp.value; }, true); } });
    return inp;
  }

  /* ---- Personas (Lifelike lineage) ----------------------------------------
     Biometric Spoofing saves a measurable body, Method Actor saves a behavior.

     Three tiers, kept distinguishable so a later manuscript sync does not
     "correct" the app toward a book that never covered the case.

     [PRINTED]   Storage equal to your Caliber score, overwrite at any time,
                 recovery costing another 10 minutes of scanning or observation,
                 obsolescence after 30 days, the Edge grants, and ONE PERSONA
                 ACTIVE PER FEATURE with the two free to be different people.
                 The last of these used to be an unprinted ruling; it is in the
                 book now (Method Actor, third paragraph), so it is enforced as
                 a rule and no longer flagged as house policy.
     [INFERRED]  Each feature holds its own pool of Caliber Personas rather than
                 the two sharing one. Not printed: it reads that way because each
                 feature independently grants "Personas equal to your Caliber
                 score" and the two store different kinds of profile. Still
                 labelled as a reading in the panel.
     [ABSENCE]   No action cost is printed for assuming or dropping a Persona.
                 The silence is the rule; do not fill it.
     [APP]       The 30-day decay counts one day per Long Rest or per day of
                 downtime, because that is the only in-world day unit this app
                 has and gear leases already work that way.

     A second Persona buys COVERAGE ACROSS TWO SKILL LANES, never a bigger
     number, which is what the printed line means by covering more ground. Do NOT
     restate this as "Edge does not stack on a Deception check": that sentence
     was drafted for the manuscript and deliberately cut, because it is false out
     of combat where Dice Pool Edge accumulates to +2 Edge Dice. */
  var PERSONA_SRC = {
    // the verbs are deliberately different: Biometric Spoofing SCANS a body,
    // Method Actor OBSERVES a person, and each recovers the way it acquired
    BiometricSpoofing: { feature: "Biometric Spoofing", label: "BODY",     color: "var(--accent)",
                         regain: "another 10 minutes of scanning",    saves: "physical and vocal profile" },
    MethodActor:       { feature: "Method Actor",       label: "BEHAVIOR", color: "var(--flow)",
                         regain: "another 10 minutes of observation", saves: "behavioral profile" }
  };
  var PERSONA_DAYS = 30;
  function personaSources(ch) {
    var have = (EN.engine.activeLineageFeatures(ch) || []);
    return Object.keys(PERSONA_SRC).filter(function (k) { return have.indexOf(PERSONA_SRC[k].feature) !== -1; });
  }
  function personasPanel() {
    var ch = store.active();
    var srcs = personaSources(ch);
    if (!srcs.length) return null;                 // nothing to track without the feature
    var cap = EN.engine.caliber(ch.level || 1);
    var rows = faceRead(ch).personas;
    var kids = [];
    kids.push(help("A saved profile of a real person. Overwriting is how you exceed your storage, and a Persona goes obsolete " + PERSONA_DAYS + " days after it is taken. Deleting one is permanent: getting it back costs another 10 minutes of scanning or observation, whichever the feature uses."));
    // The one-active-per-feature rule is printed now, so it reads as a rule
    // rather than as house policy. Only the pool count is still an inference.
    if (srcs.length > 1) {
      kids.push(el("p.help", { style: { margin: "0 0 10px", color: "var(--text2)" } }, [
        el("span.chip", { style: { fontSize: "8.5px", color: "var(--accent)", borderColor: "var(--accent)", marginRight: "7px" }, text: "ONE PER FEATURE" }),
        document.createTextNode("One Persona may be active per feature, and the two do not have to belong to the same individual: you can wear one person's fingerprints and another's mannerisms at once. A second Persona does not make the lie better. It makes the lie cover more ground.")
      ]));
    }
    kids.push(el("p.help", { style: { margin: "0 0 10px", color: "var(--text3)" } }, [
      el("span.chip", { style: { fontSize: "8.5px", color: "var(--text4)", borderColor: "var(--border2)", marginRight: "7px" }, text: "READING" }),
      document.createTextNode("Storage is counted as " + cap + " per feature at your Caliber. The rules give each feature its own “Personas equal to your Caliber score” without saying whether the two share one pool, so this is an interpretation rather than a printed rule.")
    ]));

    srcs.forEach(function (key) {
      var S = PERSONA_SRC[key];
      var mine = rows.map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return x.r.sourceFeature === key; });
      var over = mine.length > cap;
      kids.push(el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline", margin: "12px 0 6px" } }, [
        el("span.chip", { style: { color: S.color, borderColor: S.color, fontSize: "9px" }, text: S.label }),
        el("span", { style: { fontWeight: 600 }, text: S.feature }),
        el("span.mono", { style: { fontSize: "10.5px", color: over ? "var(--warn)" : "var(--text3)" }, text: mine.length + " / " + cap + (over ? " OVER CAP" : "") }),
        el("span.help", { style: { margin: 0, fontSize: "10px", color: "var(--text4)" }, text: "saves the " + S.saves })
      ]));
      if (over) kids.push(help("Over your storage limit. Nothing is dropped automatically, since losing a Persona costs " + S.regain + " to undo. Remove one yourself.", "var(--warn)"));
      if (!mine.length) kids.push(help("None saved."));
      mine.forEach(function (x) { kids.push(personaRow(x.r, x.i, S)); });
      kids.push(el("button.btn.sm", { style: { marginTop: "4px", color: S.color, borderColor: S.color },
        onclick: function () {
          fset(function (f) {
            f.personas.push({ id: "p" + Date.now() + Math.floor(Math.random() * 1000),
              sourceFeature: key, subjectName: "", daysLeft: PERSONA_DAYS, isActive: false });
          });
        } }, "+ SAVE A PERSONA"));
    });
    return EN.ui.panel("Personas", "LIFELIKE · SAVED PROFILES", kids, { corners: true });
  }
  function personaRow(rec, idx, S) {
    var days = typeof rec.daysLeft === "number" ? rec.daysLeft : PERSONA_DAYS;
    var dead = days <= 0;
    var name = el("input", { type: "text", value: rec.subjectName || "", placeholder: "who you scanned",
      oninput: function () { fset(function (f) { f.personas[idx].subjectName = name.value; }, true); } });
    // [RULING] one active PER FEATURE, so this clears the other Personas from
    // the SAME source only. A Biometric Spoofing face and a Method Actor
    // performance can run together, and can be two different people.
    var assume = el("button.btn.sm", {
      title: rec.isActive ? "Stop assuming this Persona"
        : "Assume this Persona. Replaces any other " + S.feature + " Persona you are wearing; a Persona from the other feature is unaffected.",
      style: { flex: "0 0 auto", color: rec.isActive ? "var(--bg1)" : S.color, borderColor: S.color,
               background: rec.isActive ? S.color : "transparent", fontWeight: rec.isActive ? 700 : 400 },
      onclick: function () {
        var on = !rec.isActive, src = rec.sourceFeature;
        fset(function (f) {
          f.personas.forEach(function (p) { if (p.sourceFeature === src) p.isActive = false; });
          f.personas[idx].isActive = on;
        });
      } }, rec.isActive ? "ASSUMED" : "ASSUME");
    return el("div.row.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "7px", opacity: dead ? .55 : 1 } }, [
      el("span", { style: { flex: 1, minWidth: "120px" } }, [name]),
      el("span.mono", { title: "Counts down one day per Long Rest",
        style: { fontSize: "10.5px", flex: "0 0 auto", minWidth: "74px", textAlign: "center",
                 color: dead ? "var(--danger)" : days <= 5 ? "var(--warn)" : "var(--text3)" },
        text: dead ? "OBSOLETE" : days + " DAYS" }),
      assume,
      el("button.btn.sm.ghost", { title: "Delete permanently; recovering it needs " + S.regain,
        style: { width: "26px", flex: "0 0 auto", color: "var(--text4)" },
        onclick: function () { fset(function (f) { f.personas.splice(idx, 1); }); } }, "✕")
    ]);
  }
  // one Long Rest is one in-world day, the same unit gear leases use
  function personaTick(c) {
    var f = c.face; if (!f || !f.personas || !f.personas.length) return 0;
    var expired = 0;
    f.personas.forEach(function (p) {
      if (typeof p.daysLeft !== "number") p.daysLeft = PERSONA_DAYS;
      if (p.daysLeft > 0) { p.daysLeft -= 1; if (p.daysLeft <= 0) expired++; }
    });
    return expired;
  }

  /* ---- #POST (the mail service) --------------------------------------------
     #POST is the civic mail utility, sibling to #PRINT, #MINT and #FLAG: a
     delivery service with a compliance department and no interest in privacy.
     Messages live on ch.face.post, which means they ride the RECORD. There is no
     network in this app and there never will be, so the record is the transport:
     mail exports with a Freelancer, imports with them, and a GM sitting at the
     same device can open a player's record and leave one there.
     A message arrives unread, because the common case is that one arrived.
     Opening it marks it read, and that is what feeds the rail's badge. */
  var POST_HELP = "Routed to your registered deck. #POST guarantees delivery. It has never guaranteed privacy.";
  function pid() { return "pm_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
  /* Read by the rail (see the TABS entry in app.js), so it has to tolerate a
     null character and a record that predates the inbox. */
  function unread(ch) {
    var list = (ch && ch.face && ch.face.post) || [];
    return list.filter(function (m) { return !m.read; }).length;
  }
  function postRow(rec, i) {
    var key = rec.id || String(i);
    var open = !!_open["post-" + key];
    /* The row's geometry lives in theme.css off .post-row and .post-cell, not inline. Two reasons.
       A skin can then restate it without fighting an inline style, and #GRIDroid's tracker-cell
       rule keys off an inline min-width:0, which would otherwise claim these cells and stack the
       header into four lines with the unread dot orphaned on one of them. Only the state colors,
       which change per message, are set from here. */
    var dot = el("span.post-dot", { style: {
      background: rec.read ? "transparent" : "var(--gold)", boxShadow: rec.read ? "none" : "0 0 8px var(--gold)",
      border: rec.read ? "1px solid var(--border)" : "0" } });
    /* The three header cells are held by name because the editor below edits the SAME three
       values through a silent write, which deliberately does not re-render (the caret has to
       survive a keystroke). So each keystroke patches its cell by hand, the way builder.js keeps
       the top bar's name live while you type it. Without this the header sits directly above the
       editor still reading UNKNOWN NODE and (no subject) while you fill them in. */
    var fromEl = el("span.mono.post-cell.post-from", { style: { color: rec.read ? "var(--text3)" : "var(--accent)" },
      text: rec.from || "UNKNOWN NODE" });
    var subjEl = el("span.post-cell.post-subj", { style: { color: rec.read ? "var(--text3)" : "var(--text)" },
      text: rec.subj || "(no subject)" });
    var whenEl = el("span.mono.post-cell.post-when", { text: rec.when || "" });
    var head = el("div.row.post-row", {
      onclick: function () {
        _open["post-" + key] = !open;
        // opening a message is the one thing that marks it read; fset re-renders,
        // and an already-read message still needs a render to expand
        if (!open && !rec.read) fset(function (f) { if (f.post[i]) f.post[i].read = true; });
        else EN.app.render();
      } }, [dot, fromEl, subjEl, whenEl, el("span.post-caret", { text: open ? "▾" : "▸" })]);
    function fld(k, label, ph, flex) {
      var inp = el("input", { type: "text", value: rec[k] || "", placeholder: ph,
        oninput: function () {
          var v = inp.value;
          fset(function (f) { if (f.post[i]) f.post[i][k] = v; }, true);
          if (k === "from") fromEl.textContent = v || "UNKNOWN NODE";
          else if (k === "subj") subjEl.textContent = v || "(no subject)";
          else whenEl.textContent = v;
        },
        style: { width: "100%", fontSize: "12px" } });
      return el("div.field", { style: { flex: flex, minWidth: 0, margin: 0 } },
        [el("label.fl", { style: { margin: "0 0 2px" }, text: label }), inp]);
    }
    var body = open ? el("div", { style: { margin: "6px 0 2px", paddingLeft: "14px", borderLeft: "1px solid var(--border)" } }, [
      el("div.row.wrap", { style: { gap: "8px", marginBottom: "7px" } }, [
        fld("from", "From", "NULLJACK", "1 1 150px"),
        fld("subj", "Subject", "Work, if you want it", "2 1 210px"),
        fld("when", "When", "03:14, Tuesday", "1 1 110px")
      ]),
      el("textarea", { value: rec.body || "", placeholder: "The message…",
        oninput: function (e) { var v = e.target.value; fset(function (f) { if (f.post[i]) f.post[i].body = v; }, true); },
        style: { width: "100%", minHeight: "96px", fontSize: "12px" } }),
      el("div.row.wrap", { style: { gap: "6px", marginTop: "7px" } }, [
        /* A toggle, not a one-way trip. Opening a message is what normally marks it read,
           but a message you WROTE opens straight into its editor and so is still sitting
           in the unread pile with the rail badge lit; this clears it without the
           collapse-and-reopen dance. The glyph matches the row's own unread dot. */
        el("button.btn.sm", { title: rec.read ? "Put it back in the unread pile." : "Clear it off the rail's badge without closing it.",
          onclick: function () { var to = !rec.read; fset(function (f) { if (f.post[i]) f.post[i].read = to; }); } },
          rec.read ? "● MARK UNREAD" : "○ MARK READ"),
        el("button.btn.sm.ghost", { title: "Delete this message. It is not kept anywhere else.",
          style: { color: "var(--danger)", borderColor: "var(--danger)" },
          onclick: function () { delete _open["post-" + key]; fset(function (f) { f.post.splice(i, 1); }); } }, "✕ DELETE")
      ])
    ]) : null;
    // .post-unread and .post-open are skin hooks (the '98 mail client bolds the one and paints
    // the other as the selected row); nothing in here reads them
    return el("div.feature" + (rec.read ? "" : ".post-unread") + (open ? ".post-open" : ""),
      { style: { borderLeftColor: rec.read ? "var(--border)" : "var(--gold)", marginBottom: "7px" } },
      [head, body]);
  }
  function postPanel() {
    var ch = store.active(), list = faceRead(ch).post, n = unread(ch);
    var kids = [help(POST_HELP)];
    /* The button sits ABOVE the list because a new message goes to the top of it. Newest first is
       right for mail, but it means a compose button at the FOOT of a long inbox creates a row the
       reader never sees: the re-render restores the scroll position it started at, so the only
       visible effect is the page shifting down by the height of an editor that is off screen
       above. The trackers can put + ADD at the bottom because they append. */
    kids.push(el("button.btn.sm", { style: { marginBottom: "12px" }, title: "Log something that came in, or write one yourself.",
      onclick: function () {
        var m = { id: pid(), from: "", subj: "", when: "", body: "", read: false };
        _open["post-" + m.id] = true;   // a new message opens straight into its own editor
        fset(function (f) { f.post.unshift(m); });
      } }, "+ NEW MESSAGE"));
    if (list.length) list.forEach(function (rec, i) { kids.push(postRow(rec, i)); });
    else kids.push(help("No traffic. #POST is holding nothing for this handle.", "var(--text4)"));
    var p = EN.ui.panel("#POST", "SECURE COMM CHANNEL", kids, { corners: true,
      headerRight: n ? [el("span.mono", { style: { fontSize: "11px", color: "var(--gold)", letterSpacing: ".08em" }, text: n + " UNREAD" })] : null });
    // skin hooks: the '98 mail client reads its folder pane and status bar off these
    p.dataset.count = String(list.length); p.dataset.unread = String(n);
    return p;
  }

  /* ---- CONTACTS (the people you can reach) ----------------------------------
     Every Background grants "Two people you can reach", and the book asks for names, roles
     and a reason they still pick up; they start neutral or slightly friendly (Part 1, the
     Backgrounds chapter; the Codex panel so-contacts carries it). The one hard benefit is the
     right Fence Contact skipping the search phase (Part 3, Choosing a Fence). The rest of a
     contact's mechanics already live in the ledger, so a card LINKS them rather than holding
     a copy: their Profile of you is a Profiles row, a favor is a Debts row (or a Bills debt),
     their faction is a Faction Standing row. Those links are found at render time by name and
     never stored, so renaming or deleting a row breaks nothing and no third debt list appears.
     Stored on ch.face.contacts, cards with ids, modelled on #POST's rows: _open keyed by id,
     text written silently with the closed header patched by hand, + NEW above the list.
     NOT the GM's People cards (EN.gmStore's "contacts" bag), which this never reads or writes;
     gmShared and gmContactId are reserved on the record for a later GM share and this sheet
     never sets them. The select keys below are STORED KEYS, whitelisted in store.js migrate().
     [APP] Personal or Professional, the disposition ladder (the Faction Standing steps, borrowed
     for people), Burned as a fourth state (the Burned Bridge result), offers and notes: the
     book has none of these for contacts; they are bookkeeping, not rules. */
  var KINDS = [
    { k: "professional", label: "Professional", color: "var(--accent)" },
    { k: "personal",     label: "Personal",     color: "var(--flow)" }
  ];
  var ORIGINS = [
    { k: "play",       label: "Earned in play" },
    { k: "background", label: "Background" },
    { k: "dayjob",     label: "Day job" }
  ];
  // the pressure states plus Burned; it shares STATES' rows, so the book's names reach it too
  var CSTATES = STATES.concat([{ k: "burned", label: "Burned", color: "var(--text4)" }]);
  // the book's four fence types (EN.economy.fences); the literals are the fallback
  var FENCES = [{ k: "", label: "Not a fence", color: "var(--text4)" }].concat(
    ((EN.economy && EN.economy.fences && EN.economy.fences.types) || [
      { key: "relic", label: "Relic broker" }, { key: "cyber", label: "Cyberware fence" },
      { key: "data", label: "Data broker" }, { key: "street", label: "Street fence" }
    ]).map(function (t) { return { k: t.key, label: t.label, color: "var(--gold)" }; }));
  var CT_TEXT = ["name", "print", "handle", "work", "why", "offers", "faction", "tell", "notes"];
  // the two small filter selects sit in the chip row at their own width, not the form's 100%
  var CT_SEL = { width: "auto", maxWidth: "100%", fontSize: "11px", padding: "4px 28px 4px 8px" };
  var BG_CONTACTS = 2;   // "Two people you can reach": a nudge on the banner, never a cap
  // the search, filters and sort; transient like _sub, never saved
  var _ct = { q: "", kind: "all", burned: false, faction: "", sort: "name" };
  /* Open cards whose own Kind or Faction was edited: kept in view through the kind and faction
     filters until they close or the filter changes, so an edit never vanishes the card you are
     in, while a filter you pick still filters. Transient, keyed as _open is. */
  var _ctHeld = {};
  function ctid() { return "ct_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
  // pick() falls back to a list's FIRST row, which on STANDINGS is Allied; a contact's default is not
  function pickOr(list, k, dflt) {
    for (var i = 0; i < list.length; i++) if (list[i].k === k) return list[i];
    return pick(list, dflt);
  }
  function trimL(s) { return String(s == null ? "" : s).replace(/^\s+|\s+$/g, "").toLowerCase(); }
  // writes go by id, not position: the list is shown sorted and filtered
  function ctOf(f, id) {
    for (var i = 0; i < f.contacts.length; i++) if (f.contacts[i].id === id) return f.contacts[i];
    return null;
  }
  /* Open state and the armed delete are keyed by record and contact: an adopted example and a
     record imported back as a copy share contact ids, and the switcher does not disarm. */
  function ctKey(ch, id) { return ((ch && ch.meta && ch.meta.id) || "") + ":" + id; }
  function ctSet(id, k, v, silent) { fset(function (f) { var c = ctOf(f, id); if (c) c[k] = v; }, silent); }
  function blankContact(over) {
    var c = { id: ctid(), name: "", print: "", handle: "", kind: "professional", work: "", why: "", offers: "",
              fence: "", origin: "play", disposition: "neutral", state: "open", faction: "", tell: "", notes: "" };
    Object.keys(over || {}).forEach(function (k) { c[k] = over[k]; });
    return c;
  }
  function bgOf(ch) { return EN.engine && EN.engine.getBackground ? EN.engine.getBackground(ch.background) : null; }
  // the Background's own example roles ("such as a former partner, ..."), for a placeholder
  function bgRoles(bg) {
    var m = bg && bg.contacts ? /such as (.*?)\.?$/.exec(bg.contacts) : null;
    return m ? m[1] : "";
  }
  function ctSearchText(c) {
    return CT_TEXT.map(function (k) { return c[k]; }).filter(Boolean).join(" \n ").toLowerCase();
  }
  /* The ties to the rest of the ledger, by name. A row belongs to a contact when its own name
     field contains the contact's name, handle or #PRINT name (three letters or more, so a
     one-letter handle does not claim every row). The faction tie is an exact name match. */
  function ctLinks(ch, c) {
    var F = faceRead(ch);
    var names = [c.name, c.handle, c.print].map(trimL).filter(function (s) { return s.length >= 3; });
    function hit(s) { var h = trimL(s); return !!h && names.some(function (n) { return h.indexOf(n) !== -1; }); }
    var fac = trimL(c.faction), facRow = null;
    F.factions.forEach(function (r) { if (fac && trimL(r.name) === fac) facRow = r; });
    function facHit(s) { var h = trimL(s); return !!fac && !!h && (h.indexOf(fac) !== -1 || fac.indexOf(h) !== -1); }
    return {
      profiles: F.profiles.filter(function (r) { return hit(r.source); }),
      debts: F.debts.filter(function (r) { return hit(r.who); }),
      bills: (ch.debts || []).filter(function (r) { return r && hit(r.holder); }),
      faction: facRow,
      cred: F.cred.filter(function (r) { return facHit(r.scene); }),
      heat: F.heat.filter(function (r) { return facHit(r.source) || hit(r.source); })
    };
  }
  function tagChip(t, color, title) {
    return el("span.chip.contact-chip", { title: title || "", style: { color: color, borderColor: color }, text: t });
  }
  // a jump to where a linked row is edited: the ledger panel, or the Inventory's Bills
  function toLedger(panelKey) {
    _sub = "ledger"; EN.app.render();
    setTimeout(function () {
      var p = document.querySelector("#view [data-face-panel='" + panelKey + "']");
      if (p && p.scrollIntoView) p.scrollIntoView({ block: "start" });
    }, 0);
  }
  function toBills() {
    if (EN.inventoryView && EN.inventoryView.openBills) EN.inventoryView.openBills();
    EN.app.gotoTab("gear");
  }
  function jumpBtn(label, title, fn) {
    return el("button.btn.sm.ghost.contact-jump", { title: title, onclick: fn }, label);
  }
  function linkLine(kids) { return el("div.row.wrap.contact-link", null, kids); }
  function linksBlock(ch, c) {
    var L = ctLinks(ch, c), out = [];
    // Their Profile of you: held by them, kept in Profiles (one copy)
    out.push(el("div.contact-lh", null, [rl("so-profiles/profiles", "Their Profile of you")]));
    if (L.profiles.length) L.profiles.forEach(function (r) {
      out.push(linkLine([el("span", { style: { fontWeight: 600 }, text: r.label || "(no label yet)" }),
        r.note ? el("span.contact-dim", { text: r.note }) : null,
        jumpBtn("PROFILES ›", "Edit it in the ledger's Profiles", function () { toLedger("profiles"); })]));
    });
    else out.push(el("p.help.contact-none", { text: c.name ? "No Profiles row names " + c.name + " as its source." : "Name them to find their Profile of you." }));
    out.push(el("button.btn.sm", { style: { marginTop: "4px" }, disabled: !trimL(c.name),
      title: "Adds a Profiles row held by this contact. You write the label in the ledger.",
      onclick: function () { var src = c.name; if (!trimL(src)) return; fset(function (f) { f.profiles.push({ label: "", source: src, note: "" }); }); } }, "+ PROFILE"));
    // Debts both ways, from the ledger and from the Inventory's Bills
    out.push(el("div.contact-lh", null, [rl("so-profiles/debt", "Debts")]));
    L.debts.forEach(function (r) {
      var d = pick(DEBTDIRS, r.dir);
      out.push(linkLine([tagChip(d.label.toUpperCase(), d.color), el("span", { text: r.terms || "(terms not written)" }),
        jumpBtn("DEBTS ›", "Edit it in the ledger's Debts", function () { toLedger("debts"); })]));
    });
    L.bills.forEach(function (r) {
      var bits = [r.kind, r.principal != null && r.principal !== "" ? String(r.principal) : "", r.clock != null && r.clock !== "" ? "clock " + r.clock : ""].filter(Boolean);
      out.push(linkLine([tagChip("BILLS", "var(--danger)", "A debt in the Inventory's Bills, held by " + (r.holder || "them")),
        el("span", { text: bits.join(" · ") || "a debt" }),
        jumpBtn("BILLS ›", "Edit it in the Inventory's Bills", toBills)]));
    });
    if (!L.debts.length && !L.bills.length) out.push(el("p.help.contact-none", { text: "No Debts or Bills name them." }));
    // their faction's Standing with the crew: separate from their own Profile of you
    if (c.faction) {
      out.push(el("div.contact-lh", null, [rl("so-standing/faction-standing", "Faction Standing")]));
      if (L.faction) {
        var fs = pickOr(STANDINGS, L.faction.standing, "neutral"), fst = pick(STATES, L.faction.state);
        out.push(linkLine([el("span", { style: { fontWeight: 600 }, text: L.faction.name }),
          tagChip(fs.label.toUpperCase(), fs.color), tagChip(fst.label.toUpperCase(), fst.color),
          jumpBtn("STANDING ›", "Edit it in the ledger's Faction Standing", function () { toLedger("factions"); })]));
      } else out.push(el("p.help.contact-none", { text: "No Faction Standing row is called " + c.faction + "." }));
    }
    var ch2 = L.cred.map(function (r) { return "Cred " + (r.value || 0) + " in " + (r.scene || "a scene"); })
      .concat(L.heat.map(function (r) { return "Heat " + (r.value || 0) + " from " + (r.source || "a source"); }));
    if (ch2.length) out.push(linkLine([el("span.contact-dim", { text: ch2.join(" · ") }),
      jumpBtn("CRED & HEAT ›", "Edit them in the ledger", function () { toLedger("cred"); })]));
    /* The line that tied a contact to How They Shift ("Burning a contact costs Cred...") went
       with the full Cred and Heat rules to the Game Master's Toolkit (2026-10-16). */
    return el("div.contact-links", null, out);
  }
  var LINK_KEYS = { name: 1, print: 1, handle: 1, faction: 1 };
  function contactRow(rec, ch) {
    var key = rec.id, okey = ctKey(ch, key), open = !!_open["contact-" + okey];
    var burned = rec.state === "burned";
    var disp = pickOr(STANDINGS, rec.disposition, "neutral"), st = pickOr(CSTATES, rec.state, "open");
    var S = EN.social || {}, PS = (S.pressureStates && S.pressureStates.states) || [];
    function stateText(k) { var t = ""; PS.forEach(function (r) { if (r.key === k) t = r.text; }); return t; }
    var burnedText = "";
    ((S.fallout && S.fallout.rows) || []).forEach(function (r) { if (r.key === "burnedBridge") burnedText = r.name + ": " + r.text; });
    /* Geometry is in theme.css off .contact-row and .contact-cell, never inline, for the reason
       #POST's row gives: #GRIDroid's tracker rule claims any inline flex plus min-width:0 span.
       Name and work are held by name so a silent keystroke can patch them, as #POST does. */
    var nameEl = el("span.contact-cell.contact-name", { text: rec.name || "Unnamed contact" });
    var workEl = el("span.contact-cell.contact-work", { text: rec.work || "" });
    var chips = [tagChip(disp.label.toUpperCase(), disp.color, "Disposition: how they lean toward you")];
    chips.push(tagChip(st.label.toUpperCase(), st.color, burned ? burnedText : stateText(st.k)));
    if (rec.state === "strained") chips.push(tagChip("+1 SNAG DIE", "var(--warn)", stateText("strained")));
    if (rec.fence) chips.push(tagChip("FENCE", "var(--gold)", pickOr(FENCES, rec.fence, "").label + ". Skips the search phase (Choosing a Fence)."));
    var head = el("div.row.contact-row", {
      onclick: function () { _open["contact-" + okey] = !open; delete _ctHeld[okey]; EN.ui.disarm(); EN.app.render(); } },
      [nameEl, workEl, el("span.contact-chips", null, chips), el("span.contact-caret", { text: open ? "▾" : "▸" })]);
    var body = null, linksEl = null;
    if (open) {
      var bg = bgOf(ch), roles = rec.origin === "background" ? bgRoles(bg) : "";
      var txt = function (k, label, ph, flex) {
        var inp = el("input", { type: "text", value: rec[k] || "", placeholder: ph, dataset: { faceContactField: k },
          oninput: function () {
            var v = inp.value;
            if (k === "faction") _ctHeld[okey] = true;
            ctSet(key, k, v, true);
            if (k === "name") nameEl.textContent = v || "Unnamed contact";
            else if (k === "work") workEl.textContent = v;
            if (LINK_KEYS[k] && linksEl && linksEl.parentNode) {
              var nl = linksBlock(ch, rec);
              linksEl.parentNode.replaceChild(nl, linksEl); linksEl = nl;
            }
          },
          style: { width: "100%", fontSize: "12px" } });
        return el("div.field", { style: { flex: flex, minWidth: 0, margin: 0 } },
          [el("label.fl", { style: { margin: "0 0 2px" }, text: label }), inp]);
      };
      var sel = function (k, label, list, dflt, flex, rule) {
        var cur = pickOr(list, rec[k], dflt);
        var s = el("select", { dataset: { faceContactField: k }, style: { width: "100%", fontSize: "12px", color: cur.color || "", borderColor: cur.color || "" },
          onchange: function () { if (k === "kind") _ctHeld[okey] = true; ctSet(key, k, s.value); } },
          list.map(function (o) { return el("option", { value: o.k, text: o.label, selected: cur.k === o.k }); }));
        return el("div.field", { style: { flex: flex, minWidth: 0, margin: 0 } },
          [el("label.fl", { style: { margin: "0 0 2px" } }, rule ? [rl(rule, label)] : [label]), s]);
      };
      var notes = el("textarea", { value: rec.notes || "", placeholder: "Anything else: where to find them, what they cost, what they know", dataset: { faceContactField: "notes" },
        oninput: function () { ctSet(key, "notes", notes.value, true); },
        style: { width: "100%", minHeight: "70px", fontSize: "12px" } });
      var stateHelp = burned ? burnedText : rec.state === "open" ? "" : stateText(rec.state);
      body = el("div.contact-body", null, [
        el("div.row.wrap.contact-fields", null, [
          txt("name", "Name", "Their name", "2 1 160px"),
          txt("print", "#PRINT name", "If it differs", "1 1 130px"),
          txt("handle", "Handle", "What the street calls them", "1 1 130px")
        ]),
        el("div.row.wrap.contact-fields", null, [
          txt("work", "Work", roles ? "Their role, such as " + roles : "Their role", "2 1 200px"),
          sel("kind", "Kind", KINDS, "professional", "1 1 120px"),
          sel("origin", "Met through", ORIGINS, "play", "1 1 130px")
        ]),
        el("div.row.wrap.contact-fields", null, [
          txt("why", "Why they pick up", "Why they still pick up when you call", "1 1 100%")
        ]),
        el("div.row.wrap.contact-fields", null, [
          sel("disposition", "Disposition", STANDINGS, "neutral", "1 1 110px", "so-standing/faction-standing"),
          sel("state", "State", CSTATES, "open", "1 1 110px", "so-standing/social-pressure-states"),
          sel("fence", "Fence", FENCES, "", "1 1 130px", "so-contacts/choosing-a-fence"),
          txt("faction", "Faction", "Who they answer to", "1 1 140px")
        ]),
        stateHelp ? el("p.help", { style: { margin: "0 0 7px", color: burned ? "var(--text3)" : "var(--warn)" }, text: stateHelp }) : null,
        rec.fence ? el("p.help", { style: { margin: "0 0 7px", color: "var(--gold)" } }, [
          "The right Fence Contact skips the search phase and goes straight to negotiation (",
          rl("so-contacts/choosing-a-fence", "Choosing a Fence"), ")."]) : null,
        el("div.row.wrap.contact-fields", null, [
          txt("offers", "What they can do for you", "A safehouse door, a ride, a buyer", "2 1 200px"),
          txt("tell", "Tell", "One habit you would recognize", "1 1 160px")
        ]),
        el("div.field", { style: { margin: "0 0 7px" } }, [el("label.fl", { style: { margin: "0 0 2px" }, text: "Notes" }), notes]),
        linksEl = linksBlock(ch, rec),
        el("div.row.wrap", { style: { gap: "6px", marginTop: "10px" } }, [
          EN.ui.armButton("face:contact:del:" + okey, { label: "✕ DELETE", armedLabel: "DELETE THIS CONTACT?",
            title: "Delete this contact card. Profiles and Debts rows that name them stay in the ledger.",
            armedTitle: "Click again to delete. It is not kept anywhere else.",
            onConfirm: function () { delete _open["contact-" + okey]; fset(function (f) { f.contacts = f.contacts.filter(function (c) { return c.id !== key; }); }); } })
        ])
      ]);
    }
    return el("div.feature.contact-card" + (burned ? ".contact-burned" : "") + (open ? ".contact-open" : ""),
      { dataset: { faceContact: key }, style: { borderLeftColor: burned ? "var(--border)" : disp.color } }, [head, body]);
  }
  function contactsShown(all, ch) {
    var q = trimL(_ct.q), idx = {};
    STANDINGS.forEach(function (s, i) { idx[s.k] = i; });
    var rows = all.filter(function (c) {
      var ck = ctKey(ch, c.id), held = !!_open["contact-" + ck] && !!_ctHeld[ck];
      if (_ct.kind !== "all" && (c.kind || "professional") !== _ct.kind && !held) return false;
      // a burned card stays in view while it is open, so burning one does not vanish it mid-edit
      if (c.state === "burned" && !_ct.burned && !_open["contact-" + ck]) return false;
      if (_ct.faction && trimL(c.faction) !== _ct.faction && !held) return false;
      return !q || ctSearchText(c).indexOf(q) !== -1;
    });
    rows.sort(function (a, b) {
      var ba = a.state === "burned" ? 1 : 0, bb = b.state === "burned" ? 1 : 0;
      if (ba !== bb) return ba - bb;   // Burned always last
      // an unnamed card is one being written, so it leads
      var na = trimL(a.name), nb = trimL(b.name);
      if (!na !== !nb) return na ? 1 : -1;
      if (_ct.sort === "standing") {
        var sa = idx[a.disposition] != null ? idx[a.disposition] : 2, sb = idx[b.disposition] != null ? idx[b.disposition] : 2;
        if (sa !== sb) return sa - sb;
      }
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
    return rows;
  }
  // the list alone, refilled in place on a search keystroke (a full render would steal focus)
  function contactsInto(host) {
    var ch = store.active(), all = faceRead(ch).contacts, rows = contactsShown(all, ch);
    var hiddenBurned = _ct.burned ? 0 : all.filter(function (c) { return c.state === "burned" && !_open["contact-" + ctKey(ch, c.id)]; }).length;
    var filtered = !!trimL(_ct.q) || _ct.kind !== "all" || !!_ct.faction;
    if (filtered || hiddenBurned) {
      host.appendChild(el("div.row.between.wrap", { style: { gap: "8px", alignItems: "center", marginBottom: "6px" } }, [
        el("p.help", { style: { margin: 0 }, dataset: { faceContact: "count" },
          text: (filtered ? (rows.length ? rows.length + " of " + all.length + " match." : "Nothing matches.") : rows.length + " shown.")
            + (hiddenBurned ? " " + hiddenBurned + " burned, hidden." : "") }),
        trimL(_ct.q) ? el("button.btn.sm.ghost", { onclick: function () { _ct.q = ""; EN.app.render(); } }, "CLEAR SEARCH") : null
      ]));
    }
    rows.forEach(function (c) { host.appendChild(contactRow(c, ch)); });
  }
  function bgBanner(ch, all) {
    var bg = bgOf(ch);
    if (!bg || !bg.contacts) return null;
    var n = all.filter(function (c) { return c.origin === "background"; }).length;
    return el("div.contact-bg", null, [
      el("div.row.wrap", { style: { gap: "8px", alignItems: "baseline" } }, [
        el("span", { style: { fontWeight: 600 }, text: bg.name }),
        el("span.mono", { dataset: { faceContact: "bgcount" }, style: { fontSize: "10.5px", color: n >= BG_CONTACTS ? "var(--success)" : "var(--text3)" },
          text: "Background contacts: " + n + " of " + BG_CONTACTS }),
        rl("so-contacts/background-grant", "Two people you can reach")
      ]),
      el("p.help", { style: { margin: "4px 0 0" }, text: bg.contacts }),
      n < BG_CONTACTS ? el("button.btn.sm", { style: { marginTop: "8px" }, dataset: { faceContact: "new-bg" },
        title: "A card marked as one of your Background's two. Nothing is filled in for you.",
        onclick: function () { newContact({ origin: "background" }); } }, "+ BACKGROUND CONTACT") : null
    ]);
  }
  function newContact(over) {
    var c = blankContact(over);
    // a filter that would hide the new card is cleared, or it opens somewhere you cannot see
    if (_ct.kind !== "all") c.kind = _ct.kind;
    _ct.q = ""; _ct.faction = "";
    _open["contact-" + ctKey(store.active(), c.id)] = true;   // a new card opens straight into its editor
    fset(function (f) { f.contacts.unshift(c); });
  }
  /* ---- the Background tab's quick card (builder.js, under the dossier's Contacts) ------------
     A pop-out with the minimum a Background contact needs: name, handle, role, why they pick up
     and a starting disposition. It reads and writes the SAME ch.face.contacts cards the Social
     tab's Contacts shows (origin "background"), so there is one copy and nothing to sync: a card
     made here appears there and an edit there shows here. Text writes silently, as the full card
     does; adding or removing a card repaints the pop-out alone. The Background tab repaints on
     close, so its summary line catches up. The Social tab is gated until filing, so the pointer
     to the full card says so on an unfiled record. */
  var BG_DISPS = ["neutral", "friendly"];   // "neutral or slightly friendly" at the start
  function bgContactsOf(ch) { return faceRead(ch).contacts.filter(function (c) { return c.origin === "background"; }); }
  function bgContactsDialog() {
    if (document.getElementById("bgct-ov")) return;
    var opener = document.activeElement;
    var body = el("div.bgct-body");
    var closeBtn = el("button.btn.sm.ghost", { title: "Close (Esc)", "aria-label": "Close", onclick: close }, "✕ CLOSE");
    var card = el("div.bgct-card", { role: "dialog", "aria-modal": "true", "aria-labelledby": "bgct-title", tabindex: "-1" }, [
      el("div.bgct-head", null, [
        el("div", null, [el("div.bgct-kick", { text: "BACKGROUND CONTACTS" }), el("div.bgct-title", { id: "bgct-title" })]),
        closeBtn
      ]),
      body
    ]);
    var ov = el("div#bgct-ov", { "data-no-swipe": "1" }, [el("div.bgct-scrim", { onclick: close }), card]);
    document.body.appendChild(ov);
    var os = document.getElementById("os"), inertWas = os ? !!os.inert : false;
    if (os) { try { os.inert = true; } catch (e) {} }
    function onKey(e) { if (e.key === "Escape") { e.preventDefault(); close(); } }
    document.addEventListener("keydown", onKey, true);
    function close() {
      document.removeEventListener("keydown", onKey, true);
      if (os) { try { os.inert = inertWas; } catch (e) {} }
      EN.ui.disarm();
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      EN.app.render();
      try { if (opener && opener.focus && document.body.contains(opener)) opener.focus({ preventScroll: true }); } catch (e) {}
    }
    function toSocial(id) {
      var ch = store.active();
      _sub = "contacts"; _ct.q = ""; _ct.kind = "all"; _ct.faction = "";
      if (id) _open["contact-" + ctKey(ch, id)] = true;
      close();
      EN.app.gotoTab("face");
    }
    function paint(focusId) {
      var ch = store.active(), bg = bgOf(ch), list = bgContactsOf(ch), roles = bgRoles(bg);
      // the Social tab's own gate (registered() in app.js): filed, or an example
      var filed = !!((ch.meta && ch.meta.filedAt) || (store.activeIsExample && store.activeIsExample()));
      var S = (EN.social && EN.social.contacts) || {};
      card.querySelector(".bgct-title").textContent = (bg ? bg.name : "No Background") + " · " + list.length + " of " + BG_CONTACTS;
      EN.ui.clear(body);
      body.appendChild(el("p.help", { style: { margin: "0 0 6px" } }, [
        "Your Background gives you two people you can reach (", rl("so-contacts/background-grant", "Contacts"), "). ",
        bg && bg.contacts ? bg.contacts : ""]));
      body.appendChild(el("p.help", { style: { margin: "0 0 12px", color: "var(--text3)" },
        text: (S.makeItYours || "Give your contacts names, roles, and a reason they still pick up when you call.")
          + " A name and a role are enough to start; the rest can wait until you need them." }));
      var first = null;
      list.forEach(function (rec, i) {
        var key = rec.id;
        function inp(k, label, ph, flex) {
          var n = el("input", { type: "text", value: rec[k] || "", placeholder: ph, dataset: { bgContactField: k },
            oninput: function () { ctSet(key, k, n.value, true); },
            style: { width: "100%" } });
          if (!first || key === focusId && k === "name") first = n;
          return el("div.field", { style: { flex: flex, minWidth: 0, margin: 0 } }, [el("label.fl", { text: label }), n]);
        }
        var cur = BG_DISPS.indexOf(rec.disposition) === -1 ? [rec.disposition || "neutral"].concat(BG_DISPS) : BG_DISPS;
        var ds = el("select", { dataset: { bgContactField: "disposition" }, style: { width: "100%" },
          onchange: function () { ctSet(key, "disposition", ds.value, true); } },
          cur.map(function (k) { var o = pickOr(STANDINGS, k, "neutral"); return el("option", { value: o.k, text: o.label, selected: (rec.disposition || "neutral") === o.k }); }));
        body.appendChild(el("div.bgct-contact", { dataset: { bgContact: key } }, [
          el("div.row.between", { style: { alignItems: "center", marginBottom: "6px" } }, [
            el("span.mono.bgct-n", { text: "CONTACT " + (i + 1) }),
            el("div.row", { style: { gap: "6px" } }, [
              filed ? el("button.btn.sm.ghost", { title: "Open this contact's full card on the Social tab", onclick: function () { toSocial(key); } }, "FULL CARD ›") : null,
              EN.ui.armButton("bgct:del:" + ctKey(ch, key), { label: "✕", armedLabel: "REMOVE?",
                title: "Remove this contact", armedTitle: "Click again to remove. It also leaves the Social tab.",
                onArm: function () { paint(); },
                onConfirm: function () { fset(function (f) { f.contacts = f.contacts.filter(function (c) { return c.id !== key; }); }, true); paint(); } })
            ])
          ]),
          el("div.row.wrap.bgct-fields", null, [
            inp("name", "Name", "Their name", "2 1 180px"),
            inp("handle", "Handle (optional)", "What the street calls them", "1 1 150px")
          ]),
          el("div.row.wrap.bgct-fields", null, [
            inp("work", "Role", roles ? "Such as " + roles : "What they do", "2 1 220px"),
            el("div.field", { style: { flex: "1 1 120px", minWidth: 0, margin: 0 } }, [el("label.fl", null, [rl("so-standing/faction-standing", "Disposition")]), ds])
          ]),
          el("div.row.wrap.bgct-fields", null, [
            inp("why", "Why they pick up", "Why they still answer when you call", "1 1 100%")
          ])
        ]));
      });
      if (list.length < BG_CONTACTS) {
        body.appendChild(el("button.btn.sm" + (list.length ? "" : ".primary"), { dataset: { bgContact: "add" }, style: { marginBottom: "12px" },
          onclick: function () {
            var c = blankContact({ origin: "background" });
            fset(function (f) { f.contacts.push(c); }, true);
            paint(c.id);
          } }, "+ ADD CONTACT " + (list.length + 1)));
      }
      body.appendChild(el("div.bgct-more", null, [
        el("div.mono", { style: { fontSize: "10.5px", letterSpacing: ".14em", color: "var(--accent)", marginBottom: "3px" }, text: "MORE DETAIL LATER" }),
        el("p.help", { style: { margin: 0 }, text: filed
          ? "These are the same cards as Social › CONTACTS. Open a card there (or press FULL CARD above) to add their #PRINT name, Kind, Faction, Fence, a Tell, notes, and to link the Profiles and Debts that name them."
          : "These cards also live on the Social tab, which opens once your #PRINT is filed. There, Social › CONTACTS holds each contact's full card: their #PRINT name, Kind, Faction, Fence, a Tell, notes, and links to the Profiles and Debts that name them." }),
        filed ? el("button.btn.sm", { style: { marginTop: "8px" }, onclick: function () { toSocial(null); } }, "OPEN SOCIAL › CONTACTS") : null
      ]));
      if (first && focusId) { try { first.focus(); } catch (e) {} }
    }
    paint();
    var f0 = body.querySelector("input");
    try { (f0 || card).focus(); } catch (e) {}
  }
  // the Background tab's summary under its Contacts line
  function bgContactsSummary(ch) {
    return bgContactsOf(ch).map(function (c) {
      return { name: c.name || "Unnamed contact", work: c.work || "" };
    });
  }
  function contactsPanel() {
    var ch = store.active(), all = faceRead(ch).contacts, kids = [];
    var banner = bgBanner(ch, all);
    if (banner) kids.push(banner);
    kids.push(el("p.help", { style: { margin: "0 0 10px", color: "var(--text3)" } }, [
      "Give each one a name, a role, and a reason they still pick up when you call. They start Neutral or Friendly until rapport or the fiction moves them (",
      rl("so-contacts/make-it-yours", "Make it Yours"), ")."]));
    // above the list, as on #POST: a new card goes to the top
    kids.push(el("button.btn.sm", { style: { marginBottom: "10px" }, dataset: { faceContact: "new" },
      onclick: function () { newContact(); } }, "+ NEW CONTACT"));
    if (all.length) {
      var host = el("div", { dataset: { live: "face-contacts" } });
      kids.push(el("input", { type: "text", value: _ct.q, dataset: { faceContact: "search" },
        placeholder: "search names, work, why they pick up, factions and notes",
        style: { width: "100%", marginBottom: "8px" },
        oninput: function (e) { _ct.q = e.target.value; EN.ui.clear(host); contactsInto(host); } }));
      var kindChip = function (k, label) {
        return el("button.chip" + (_ct.kind === k ? ".on" : ""), { dataset: { faceContactKind: k },
          onclick: function () { _ct.kind = k; _ctHeld = {}; EN.app.render(); } }, label);
      };
      var facs = {}, facList = [];
      all.forEach(function (c) { var f = trimL(c.faction); if (f && !facs[f]) { facs[f] = c.faction.replace(/^\s+|\s+$/g, ""); facList.push(f); } });
      if (_ct.faction && !facs[_ct.faction]) _ct.faction = "";
      var nBurned = all.filter(function (c) { return c.state === "burned"; }).length;
      var facSel = facList.length >= 2 ? el("select", { dataset: { faceContact: "faction" }, style: CT_SEL,
        onchange: function (e) { _ct.faction = e.target.value; _ctHeld = {}; EN.app.render(); } },
        [el("option", { value: "", text: "Every faction", selected: !_ct.faction })].concat(facList.sort().map(function (f) {
          return el("option", { value: f, text: facs[f], selected: _ct.faction === f }); }))) : null;
      var sortSel = el("select", { dataset: { faceContact: "sort" }, style: CT_SEL,
        onchange: function (e) { _ct.sort = e.target.value; EN.app.render(); } }, [
        el("option", { value: "name", text: "Sort by name", selected: _ct.sort !== "standing" }),
        el("option", { value: "standing", text: "Sort by disposition", selected: _ct.sort === "standing" })]);
      kids.push(el("div.row.wrap.contact-filters", null, [
        kindChip("all", "ALL"), kindChip("personal", "PERSONAL"), kindChip("professional", "PROFESSIONAL"),
        el("button.chip" + (_ct.burned ? ".on" : ""), { dataset: { faceContact: "burned" }, title: "Burned contacts are hidden unless this is on.",
          onclick: function () { _ct.burned = !_ct.burned; EN.app.render(); } }, "SHOW BURNED" + (nBurned ? " · " + nBurned : "")),
        facSel, sortSel
      ]));
      contactsInto(host);
      kids.push(host);
    } else {
      kids.push(help("No contacts yet. Your Background names the kind of people you start with; the rest you earn in play.", "var(--text4)"));
    }
    var p = EN.ui.panel("Contacts", all.length + (all.length === 1 ? " CONTACT" : " CONTACTS"), kids, { corners: true,
      headerRight: EN.ui.ruleChip("so-contacts", { title: "Contacts & Fences" }) });
    p.dataset.count = String(all.length);
    return p;
  }

  /* ---- quick reference (collapsible) --------------------------------------
     A pocket copy of the two tables a Face reaches for mid-scene (Approaches, Margins
     and Outcomes), read from EN.social, the same copy the Codex chapter Social Pressure
     & Faction Standing renders. Every section ends in links to the rules: the so-
     panels, and the Skills and Core Resolution entries behind them (each Approach's
     skill, Help, Edge, margins, costs). The Sit-Down's Pressure and Resolve section left
     with the Sit-Down for the Game Master's Toolkit (2026-10-16). */
  // a cell is a string, or an array of strings and nodes (a Codex link inside the text)
  function refTable(headers, rows) {
    return el("table.sktable", { style: { width: "100%", fontSize: "11.5px" } }, [
      el("thead", null, [el("tr", null, headers.map(function (h) { return el("th", { style: { textAlign: "left" }, text: h }); }))]),
      el("tbody", null, rows.map(function (r) { return el("tr", null, r.map(function (cell, ci) {
        return el("td", { style: ci === 0 ? { color: "var(--text)", whiteSpace: "nowrap" } : null }, cell);
      })); }))
    ]);
  }
  function rl(anchor, label) { return EN.ui.ruleLink(anchor, label); }
  // "Codex: A · B · C", one line of pointers into the rules hub
  function codexLine(pairs) {
    var kids = [document.createTextNode("Codex: ")];
    pairs.forEach(function (pr, i) { if (i) kids.push(document.createTextNode(" \u00b7 ")); kids.push(rl(pr[0], pr[1])); });
    return el("p.help", { style: { margin: "8px 0 0", color: "var(--text3)" } }, kids);
  }
  function refSection(key, title, node) {
    var open = !!_open[key];
    return el("div", { style: { marginBottom: "6px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" } }, [
      el("button.btn.sm.ghost", { style: { width: "100%", justifyContent: "flex-start", fontFamily: "var(--disp)", letterSpacing: ".1em" },
        onclick: function () { _open[key] = !open; EN.app.render(); } }, (open ? "▾  " : "▸  ") + title),
      open ? el("div", { style: { padding: "10px 2px 4px", overflowX: "auto" } }, [node]) : null
    ]);
  }
  // a cell through the Codex linker, so a rule name inside the book's text peeks
  function rt(text) { return [EN.ui.ruleText(el("span"), String(text == null ? "" : text))]; }
  // "Intimidation (Versatile)": the skill name links its Skills entry, the tag stays text
  function skillCell(r) {
    var m = /^(.*?)(\s*\(Versatile\))?$/.exec(r.skill || r.name);
    return [rl("sk-skills/" + r.key, m[1]), m[2] || ""];
  }
  /* Costs After a Roll: what a social roll's result offers. A Costly Success offers only the
     scene-bound costs, a Mixed Result scene-bound or lasting ones (2026-10-24 rulings, section 9
     item 1): the Social / Negotiation row of Consequence by Scene Type and the Social Cost
     Options, each tagged in data/resolution.js and picked by EN.engine.sceneCosts. */
  function costsSection() {
    var C = EN.engine.sceneCosts("social", _costTier);
    function tierBtn(k, label) {
      var on = _costTier === k;
      return el("button.btn.sm" + (on ? ".primary" : ""), { dataset: { costTierBtn: k }, onclick: function () { _costTier = k; EN.app.render(); } }, label);
    }
    function group(title, list) {
      if (!list.length) return null;
      return el("div", { style: { margin: "6px 0 0" } }, [
        el("div.mono", { style: { fontSize: "9.5px", letterSpacing: ".1em", color: "var(--text3)", margin: "0 0 3px" }, text: title }),
        el("div.row.wrap", { style: { gap: "5px" } }, list.map(function (c) {
          var lasting = c.tag === "lasting";
          return el("span.chip", { dataset: { cost: c.cost, tag: c.tag }, title: (c.effect ? c.effect + " " : "") + "(" + c.from + ")",
            style: { fontSize: "9.5px", color: lasting ? "var(--danger)" : "var(--warn)", borderColor: lasting ? "var(--danger)" : "var(--warn)" } }, c.cost);
        }))
      ]);
    }
    var note = (EN.resolution && EN.resolution.margins && EN.resolution.margins.costTagNote) || "";
    return el("div", { dataset: { costs: "social", tier: _costTier } }, [
      el("div.row.wrap", { style: { gap: "6px", alignItems: "center" } }, [tierBtn("costly", "COSTLY SUCCESS"), tierBtn("mixed", "MIXED RESULT")]),
      group("SCENE-BOUND", C.sceneBound),
      group("LASTING", C.lasting),
      note ? el("p.help", { style: { margin: "8px 0 0", color: "var(--text3)" }, text: note }) : null,
      codexLine([["rz-margin", "Consequence by Scene Type"], ["rz-social", "Social Cost Options"]])
    ]);
  }
  function referencePanel() {
    var S = EN.social || {};
    var A = S.approach || {}, M = S.margins || {};
    var appr = (A.rows || []).map(function (r) { return [r.name, skillCell(r), r.attributes, r.text]; });
    // Insight's Social Help rule (Insight as the Social Help Action), a line under the table so the cell stays short
    // ("Help" stays on the Core Resolution Help Action, as the rv1 fix ruled; the book's own entry follows)
    var socialHelp = !(A.rows || []).some(function (r) { return r.key === "insight"; }) ? null : el("p.help", { style: { margin: "8px 0 0", color: "var(--text3)" } }, ["Social ",
      rl("rz-collab/help-action", "Help"), ": on a success, grant ",
      rl("rz-edge", "Edge"), " to one ally's next social roll in the same scene (",
      rl("so-friction/insight-as-the-social-help-action", "Insight as the Social Help Action"), ")."]);
    var marg = (M.rows || []).map(function (r) { return [r.margin, r.result, rt(r.text)]; });
    var chip = EN.ui.ruleChip("so-summary", { title: "Social Play Summary" });
    return EN.ui.panel("Quick Reference", "APPROACHES · OUTCOMES", [
      refSection("appr", "Approaches", el("div", null, [
        appr.length ? refTable(["Approach", "Skill", "Attributes", "What it does"], appr) : null,
        socialHelp,
        codexLine([["so-friction/approach", "Approach"], ["sk-skills/versatile-skills", "Versatile Skills"], ["rz-collab", "Collaborative & Opposed Checks"]])
      ])),
      refSection("marg", "Margins and Outcomes", el("div", null, [
        marg.length ? refTable(["Margin", "Result", "What happens"], marg) : null,
        codexLine([["so-outcomes", "Social Margins & Outcomes"], ["so-fallout", "Social Fallout Table"],
                   ["rz-margin", "Success Margin & Consequence"], ["rz-social", "Social Consequences & Cost Tracks"]])
      ])),
      refSection("costs", "Costs After a Roll", costsSection())
    ], { corners: true, headerRight: chip });
  }

  /* ---- tracker configs ---------------------------------------------------- */
  function profilesPanel() {
    return tracker({
      title: "Profiles", tag: "HOW EACH ROOM READS YOU", key: "profiles", rule: "so-profiles/profiles",
      blank: { label: "", source: "", note: "" },
      empty: "No Profiles yet. Every fixer, gang, precinct, and shrine builds its own out of what it has seen.",
      cols: [
        { k: "label", flex: "1.1", placeholder: "Reliable / Under Watch / Shrine Touched" },
        { k: "source", flex: "1", placeholder: "Held by: a fixer, the precinct..." },
        { k: "note", flex: "1.6", placeholder: "the hook it pulls on; Edge or Snag it grants" }
      ]
    });
  }
  function factionsPanel() {
    return tracker({
      title: "Faction Standing", tag: "POSTURE · PRESSURE STATE", key: "factions", rule: "so-standing",
      ruleTitle: "Faction Standing & Pressure States",
      blank: { name: "", standing: "neutral", state: "open" },
      empty: "No factions tracked. Most start Neutral; standing shifts through contracts, betrayal, debts, and major scenes.",
      cols: [
        { k: "name", flex: "1.6", placeholder: "Faction, office, or district" },
        { k: "standing", type: "select", options: STANDINGS, flex: "1" },
        { k: "state", type: "select", options: STATES, flex: "1" }
      ]
    });
  }
  /* The Cred and Heat trackers keep their 0 to 10 values (the author's decision 11, 16
     October). The full ladders that named each value, their hover text and the rule chips
     into them moved with the full Cred and Heat rules to the Game Master's Toolkit, so the
     values carry no ladder line and no chip. EN.social.credHeat stays whole for the GM. */
  function credPanel() {
    return tracker({
      title: "Cred", tag: "STANDING PER SCENE", key: "cred",
      blank: { scene: "", value: 0 },
      empty: "No scenes tracked. Cred is contextual: what a specific community thinks when your name comes up.",
      cols: [
        { k: "scene", flex: "1.6", placeholder: "Underground music, fixer net, corp sphere..." },
        { k: "value", type: "num", tone: "var(--accent)", flex: "0 0 auto" }
      ]
    });
  }
  function heatPanel() {
    return tracker({
      title: "Heat", tag: "HOSTILE ATTENTION PER SOURCE", key: "heat",
      blank: { source: "", value: 0 },
      empty: "No Heat tracked. Heat is who is actively looking for you, watching you, or willing to act against you.",
      cols: [
        { k: "source", flex: "1.6", placeholder: "Corp X, South precinct, a rival crew..." },
        { k: "value", type: "num", tone: "var(--danger)", flex: "0 0 auto" }
      ]
    });
  }
  function debtsPanel() {
    return tracker({
      title: "Debts", tag: "FAVORS, OBLIGATIONS, FUTURE HOOKS", key: "debts", rule: "so-profiles/debt",
      blank: { dir: "owing", who: "", terms: "" },
      empty: "No Debts on the books. Specify them: not \"you owe me one\" but \"you owe me one, collected before month's end.\"",
      cols: [
        { k: "dir", type: "select", options: DEBTDIRS, flex: "0 0 auto" },
        { k: "who", flex: "1.1", placeholder: "The other side" },
        { k: "terms", flex: "1.9", placeholder: "What is owed, and when it comes due" }
      ]
    });
  }

  function render(mount) {
    var ch = store.active();
    EN.ui.clear(mount);
    if (!ch) { mount.appendChild(el("p.help", { text: "No Freelancer loaded." })); return; }
    var blocks = [];
    var onPost = _sub === "post", onContacts = _sub === "contacts", n = unread(ch);
    blocks.push(el("div", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", margin: "0 0 2px", letterSpacing: ".04em" },
        html: "MY <span style='color:var(--accent)'>SOCIALS</span> <span style='font-family:var(--disp);font-size:12px;color:var(--text3);letter-spacing:.18em'>// " +
              (onPost ? "SECURE COMM CHANNEL" : onContacts ? "PEOPLE YOU CAN REACH" : "SOCIAL PRESSURE · FACTION STANDING") + "</span>" }),
      el("p.help", { style: { margin: 0, maxWidth: "820px" }, text: onPost
        ? "Every handle gets an address whether it wants one or not. What lands here is work, warnings, and the occasional person who knows too much about where you sleep."
        : onContacts ? "The people who still pick up when you call, and the reasons they do. Half of what a Freelancer can do is who a Freelancer can reach."
        : "Some jobs end in gunfire. More end in a room: two chairs, two people working the same problem until one gives ground. This is the ledger that room leaves behind." })
    ]));
    /* Three faces of the same tab: the standing ledger, the people, and the mail.
       Deliberately NOT sticky like the Inventory's bar, which has to carry the wallets;
       three buttons do not earn a pinned strip on a phone (#GRIDroid lays them out as
       three equal cells, theme.css .face-bar). */
    // the author's clipboard, linked figures and envelope, one per Social sub-tab; same [icon,
    // text] convention the Inventory sub-nav uses for Stash, Chrome and Gray Market
    var ICON_LEDGER = '<svg viewBox="0 0 101.83 122.88" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.77,12.82h16.25v10.5h-7.01c-3.13,0-5.72,2.59-5.72,5.72v78.43c0,3.13,2.58,5.72,5.72,5.72h69.8 c3.14,0,5.72-2.58,5.72-5.72V29.04c0-3.14-2.59-5.72-5.72-5.72h-7.01v-10.5h16.25c3.73,0,6.77,3.07,6.77,6.77v96.51 c0,3.71-3.06,6.77-6.77,6.77H6.77c-3.71,0-6.77-3.05-6.77-6.77V19.59C0,15.86,3.05,12.82,6.77,12.82L6.77,12.82z M37.79,95.89 c-2.01,0-3.64-1.63-3.64-3.64c0-2.01,1.63-3.64,3.64-3.64h26.24c2.01,0,3.64,1.63,3.64,3.64c0,2.01-1.63,3.64-3.64,3.64H37.79 L37.79,95.89z M30.03,73.91c-2.01,0-3.64-1.63-3.64-3.64c0-2.01,1.63-3.64,3.64-3.64h41.76c2.01,0,3.64,1.63,3.64,3.64 c0,2.01-1.63,3.64-3.64,3.64H30.03L30.03,73.91z M23.2,51.94c-2.01,0-3.64-1.63-3.64-3.64s1.63-3.64,3.64-3.64h55.44 c2.01,0,3.64,1.63,3.64,3.64s-1.63,3.64-3.64,3.64H23.2L23.2,51.94z M32.4,9.46h7.68C40.73,4.13,45.04,0,50.26,0 c5.19,0,9.47,4.07,10.17,9.35l8.99,0.11c0.63,0,1.13,0.5,1.13,1.13v15.33c0,0.63-0.5,1.13-1.13,1.13h-37 c-0.61,0-1.13-0.5-1.13-1.13V10.59C31.27,9.97,31.78,9.46,32.4,9.46L32.4,9.46L32.4,9.46L32.4,9.46z M46.06,14.1 c0.69,0.95,1.69,1.89,2.74,2.37c0.86,0.26,1.8,0.28,2.67,0.04c1.36-0.63,2.62-2.14,3.2-3.4c0.07-0.36,0.11-0.73,0.11-1.13 c0-2.67-2.05-4.84-4.57-4.84c-2.53,0-4.57,2.17-4.57,4.84C45.64,12.8,45.79,13.51,46.06,14.1L46.06,14.1L46.06,14.1L46.06,14.1z"/></svg>';
    var ICON_POST = '<svg viewBox="0 0 122.88 88.86" fill="currentColor" aria-hidden="true"><path d="M7.05,0H115.83a7.07,7.07,0,0,1,7,7.05V81.81a7,7,0,0,1-1.22,4,2.78,2.78,0,0,1-.66,1,2.62,2.62,0,0,1-.66.46,7,7,0,0,1-4.51,1.65H7.05a7.07,7.07,0,0,1-7-7V7.05A7.07,7.07,0,0,1,7.05,0Zm-.3,78.84L43.53,40.62,6.75,9.54v69.3ZM49.07,45.39,9.77,83.45h103L75.22,45.39l-11,9.21h0a2.7,2.7,0,0,1-3.45,0L49.07,45.39Zm31.6-4.84,35.46,38.6V9.2L80.67,40.55ZM10.21,5.41,62.39,47.7,112.27,5.41Z"/></svg>';
    // the author's own Social tab mark (ICON_SOCIAL in app.js), copied verbatim, never redrawn
    var ICON_CONTACTS = '<svg viewBox="0 0 122.88 119.91" fill="currentColor" aria-hidden="true"><path d="M20,52a4.32,4.32,0,0,1-7.79-3.73A52.4,52.4,0,0,1,15,43.09a54.42,54.42,0,0,1,3.4-4.83l.06-.08a55.27,55.27,0,0,1,3.83-4.33,54.44,54.44,0,0,1,4.36-4l0,0a4.33,4.33,0,0,1,3.15-.93,4.27,4.27,0,0,1,2.89,1.56l0,0a4.33,4.33,0,0,1,.93,3.15,4.27,4.27,0,0,1-1.56,2.89h0a44.87,44.87,0,0,0-3.68,3.34A44.45,44.45,0,0,0,20,52ZM8.91,95.49l.25-.19c2.57-1.53,6.46-1.13,9-2.9a5.41,5.41,0,0,0,.47-.91c.24-.54.45-1.13.59-1.53a18.83,18.83,0,0,1-1.54-2.2l-1.56-2.48A4.54,4.54,0,0,1,15.23,83a1.79,1.79,0,0,1,.15-.82,1.44,1.44,0,0,1,.53-.62,1.93,1.93,0,0,1,.38-.19,41.2,41.2,0,0,1-.07-4.46,5.64,5.64,0,0,1,2.83-4.37,8.36,8.36,0,0,1,2.2-1c.5-.14-.42-1.72.09-1.77,2.48-.26,6.49,2,8.21,3.87a6,6,0,0,1,1.53,3.83l-.09,4h0a1.13,1.13,0,0,1,.82.85,3.54,3.54,0,0,1-.43,2.13h0l0,0-1.77,2.93a15.8,15.8,0,0,1-2.18,3,4,4,0,0,0,.23.34,10.37,10.37,0,0,0,1.16,1.5s0,0,0,0c2,1.45,7,1.8,8.94,2.86l.07,0,.24.19a19.11,19.11,0,0,0-1-25.74L37,69.64A19.11,19.11,0,0,0,8.91,95.49ZM23.5,59.65a23.41,23.41,0,0,1,16.61,6.88l.13.14a23.49,23.49,0,0,1-.13,33.09l-.14.13A23.49,23.49,0,1,1,23.5,59.65ZM85.56,96.11c1.91-1.68,6-2.1,8.51-3.58,2.2-1.32,1.82-2.65,1.81-4.83H92.39c-9.06,0-3.09.71-1.86-9.13,1.84-13.9,15.84-13.91,17.91,0,1.32,9.47,7,9.13-1.87,9.13H103c0,2.41-.39,3.64,2.11,5,1.86,1,6.09,1.65,8.12,3.33A19.12,19.12,0,0,0,113,69.5l-.12-.1A19.11,19.11,0,0,0,86,69.28l-.11.12a19.13,19.13,0,0,0-.31,26.71Zm13.82-36.7A23.44,23.44,0,0,1,116,66.29l.12.14A23.48,23.48,0,0,1,116,99.52l-.14.13a23.47,23.47,0,0,1-33.09-.13l-.13-.13a23.48,23.48,0,0,1,.13-33.1l.13-.13a23.44,23.44,0,0,1,16.48-6.75ZM48.72,35.84l.25-.2c2.58-1.52,6.46-1.12,9-2.89a7.53,7.53,0,0,0,.47-.91c.23-.54.45-1.13.58-1.53a20.12,20.12,0,0,1-1.54-2.2l-1.56-2.48A4.54,4.54,0,0,1,55,23.36a1.78,1.78,0,0,1,.15-.81,1.46,1.46,0,0,1,.54-.62,1.5,1.5,0,0,1,.38-.19A38.76,38.76,0,0,1,56,17.28a5.8,5.8,0,0,1,.19-1,6,6,0,0,1,2.64-3.36,8.42,8.42,0,0,1,2.21-1c.49-.14-.42-1.72.09-1.78,2.47-.25,6.48,2,8.21,3.88a6.11,6.11,0,0,1,1.53,3.82l-.1,4h0a1.13,1.13,0,0,1,.82.85,3.54,3.54,0,0,1-.43,2.13h0a.17.17,0,0,1,0,.05l-1.78,2.93a15.38,15.38,0,0,1-2.18,3l.23.34a10.29,10.29,0,0,0,1.16,1.49l0,.05c2,1.45,7,1.8,8.94,2.86l.07,0,.24.19a19.13,19.13,0,0,0-1-25.74L76.82,10a19.11,19.11,0,0,0-28.1,25.85ZM63.31,0A23.41,23.41,0,0,1,79.92,6.88l.13.14a23.47,23.47,0,0,1-.13,33.09l-.13.13A23.49,23.49,0,1,1,63.31,0Zm29,37.29a4.32,4.32,0,0,1,2.4-7.6,4.34,4.34,0,0,1,3.14,1L99.37,32l1.49,1.42c1,1,2,2,2.86,3s1.73,2.06,2.52,3.12,1.59,2.22,2.32,3.38,1.42,2.34,2,3.52l0,.12a4.31,4.31,0,0,1-5.15,6A4.23,4.23,0,0,1,103,50.51c-.52-1-1.1-2-1.71-2.94s-1.27-1.92-1.94-2.81S97.9,42.94,97.12,42s-1.52-1.68-2.3-2.45-1.65-1.55-2.53-2.3ZM76.05,109a4.27,4.27,0,0,1,3.28.23l.08,0a4.33,4.33,0,0,1,2.1,2.45v0a4.31,4.31,0,0,1-2.73,5.42c-1.37.46-2.75.86-4.15,1.21s-2.76.62-4.19.85-2.86.41-4.27.52-2.89.18-4.32.18-2.92-.06-4.38-.18-2.9-.3-4.36-.54-2.92-.55-4.31-.9-2.83-.78-4.19-1.24a4.33,4.33,0,0,1-2.48-2.2,4.28,4.28,0,0,1-.21-3.3,4.34,4.34,0,0,1,2.19-2.48,4.28,4.28,0,0,1,3.3-.21l0,0c1.13.38,2.3.73,3.49,1l0,0c1.16.29,2.33.54,3.49.73h0c1.16.19,2.37.34,3.61.44s2.43.15,3.7.15,2.46-.05,3.64-.15,2.42-.24,3.56-.43h.07c1.16-.19,2.33-.43,3.49-.72s2.32-.62,3.44-1Z"/></svg>';
    function subTab(key, label) {
      var kids = Array.isArray(label) ? [el("span", { html: label[0] }), document.createTextNode(" " + label[1])] : [document.createTextNode(label)];
      return el("button.btn.sm" + (_sub === key ? ".primary" : ""),
        { onclick: function () { _sub = key; EN.app.render(); } }, kids);
    }
    blocks.push(el("div.row.wrap.face-bar", { style: { gap: "6px", marginBottom: "12px" } }, [
      subTab("ledger", [ICON_LEDGER, "LEDGER"]),
      subTab("contacts", [ICON_CONTACTS, "CONTACTS"]),
      subTab("post", [ICON_POST, "#POST" + (n ? " · " + n : "")])
    ]));
    if (onPost) {
      // One wrapper around the inbox so a skin can frame it (theme.css draws the '98 mail
      // client off .post-sub, the sibling of the Inventory's .inv-sub). Nothing else keys on it.
      blocks.push(el("div.post-sub", null, [postPanel()]));
      mount.appendChild(el("div", null, blocks)); return;
    }
    if (onContacts) {
      // its own wrapper, NEVER .post-sub: the '98 mail-client rules there would rebuild it as
      // an inbox. '98 shares only the light-document palette and controls (theme.css).
      blocks.push(el("div.contact-sub", null, [contactsPanel()]));
      mount.appendChild(el("div", null, blocks)); return;
    }
    blocks.push(profilesPanel());
    blocks.push(el("div", { style: { marginTop: "14px" } }, [factionsPanel()]));
    blocks.push(el("div.modgrid6", { style: { marginTop: "14px" } }, [
      el("div", { style: { gridColumn: "span 3", minWidth: 0 } }, [credPanel()]),
      el("div", { style: { gridColumn: "span 3", minWidth: 0 } }, [heatPanel()])
    ]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [debtsPanel()]));
    var pp = personasPanel();
    if (pp) blocks.push(el("div", { style: { marginTop: "14px" } }, [pp]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [referencePanel()]));
    mount.appendChild(el("div", null, blocks));
  }

  return { render: render, personaTick: personaTick, unread: unread,
           bgContactsDialog: bgContactsDialog, bgContactsSummary: bgContactsSummary, bgContactsTarget: BG_CONTACTS };
})();
