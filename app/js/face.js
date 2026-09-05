/* ===========================================================================
   ELYSIUM NIGHTS - Face tab
   The social sheet: Social Pressure and Faction Standing. This is a FRAMEWORK
   scaffold. It holds the persistent, sheet-level social ledger a Face carries
   between scenes (Profiles others hold of you, Faction Standing, Cred, Heat,
   Debts) plus a compact quick-reference. The heavier runtime machinery (the
   Sit-Down: rounds, Plays, Pressure vs Resolve, Postures) and the full Social
   Fallout tables are stubbed here and get fleshed out in a later pass.
   State persists on ch.face; reference collapse state is transient.
   =========================================================================== */
window.EN = window.EN || {};

EN.faceView = (function () {
  var el = EN.ui.el, store = EN.store;
  var _open = {};   // collapse state for reference sections and open messages
  var _sub = "ledger";   // 'ledger' | 'post'; transient, like the Inventory's

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
  function pick(list, k) { return list.find(function (o) { return o.k === k; }) || list[0]; }

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
    return f;
  }
  function faceRead(ch) {
    var f = ch.face || {};
    return { profiles: f.profiles || [], factions: f.factions || [], cred: f.cred || [], heat: f.heat || [], debts: f.debts || [],
             personas: f.personas || [], post: f.post || [] };
  }
  function fset(mut, silent) { store.update(function (c) { mut(face(c)); }, silent ? { silent: true } : undefined); }

  function help(t, color) { return el("p.help", { style: { margin: "0 0 10px", color: color || "var(--text3)" }, text: t }); }

  /* ---- generic editable tracker list --------------------------------------
     opts: { title, tag, key, cols, blank, empty }. Each col:
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
    return EN.ui.panel(opts.title, opts.tag, kids, { corners: true });
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
    return el("div.feature", { style: { borderLeftColor: rec.read ? "var(--border)" : "var(--gold)", marginBottom: "7px" } },
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
    return EN.ui.panel("#POST", "SECURE COMM CHANNEL", kids, { corners: true,
      headerRight: n ? [el("span.mono", { style: { fontSize: "11px", color: "var(--gold)", letterSpacing: ".08em" }, text: n + " UNREAD" })] : null });
  }

  /* ---- quick reference (collapsible) -------------------------------------- */
  function refTable(headers, rows) {
    return el("table.sktable", { style: { width: "100%", fontSize: "11.5px" } }, [
      el("thead", null, [el("tr", null, headers.map(function (h) { return el("th", { style: { textAlign: "left" }, text: h }); }))]),
      el("tbody", null, rows.map(function (r) { return el("tr", null, r.map(function (cell, ci) { return el("td", { style: ci === 0 ? { color: "var(--text)", whiteSpace: "nowrap" } : null, text: cell }); })); }))
    ]);
  }
  function refSection(key, title, node) {
    var open = !!_open[key];
    return el("div", { style: { marginBottom: "6px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" } }, [
      el("button.btn.sm.ghost", { style: { width: "100%", justifyContent: "flex-start", fontFamily: "var(--disp)", letterSpacing: ".1em" },
        onclick: function () { _open[key] = !open; EN.app.render(); } }, (open ? "▾  " : "▸  ") + title),
      open ? el("div", { style: { padding: "10px 2px 4px", overflowX: "auto" } }, [node]) : null
    ]);
  }
  function referencePanel() {
    return EN.ui.panel("Quick Reference", "APPROACHES · OUTCOMES · SIT-DOWN", [
      refSection("appr", "Approaches", refTable(["Approach", "Skill", "Attributes", "What it does"], [
        ["Persuasion", "Persuasion", "Charm, Wits", "Warmth, reason, rapport, mutual interest. The long game."],
        ["Intimidation", "Intimidation", "Body, Wits, Tech, Mystique, Charm", "Threat, weight, presence. Make them flinch first."],
        ["Performance", "Performance", "Charm, Agility, Body, Mystique", "Theater, distraction, rallying an audience, controlling tone."],
        ["Deception", "Deception", "Charm, Wits", "Misdirection, false flags, slipping past their guard."],
        ["Insight", "Insight", "Any", "Read the room, find the lever. Social Help: grants Edge, no Pressure."]
      ])),
      refSection("marg", "Margins and Outcomes", refTable(["Margin", "Result", "What happens"], [
        ["Flawless", "Total Win", "Get what you want and gain ground (Profile, Standing, future Edge)."],
        ["Strong", "Solid Win", "Get what you want at a minor cost (Concession, Scrutiny, Debt)."],
        ["Mixed", "Yes, But", "Succeed with a real social cost. One benefit, one Social Fallout."],
        ["Failure", "No, And", "Miss. Lose position, alienate the room, or worsen terms."],
        ["Critical", "Hard Burn", "The scene turns against you. A Tipped Hand, a Profile, a posture shift."]
      ])),
      refSection("sit", "The Sit-Down (Resolve)", el("div", null, [
        help("A big negotiation run like a combat encounter: the Opposition has Resolve, the crew has Rounds to break it. Each successful Approach deals Pressure equal to its success tier (Flawless 3, Strong 2, Mixed 1). At 0 Resolve, the target breaks."),
        refTable(["Tier", "Resolve", "Example"], [
          ["Pushover", "3", "A low-level clerk, a desperate informant"],
          ["Standard", "5", "A mid-tier fixer, a competent guard captain"],
          ["Hardened", "8", "A faction lieutenant, a senior compliance officer"],
          ["Iron", "12", "A corporate executive, a faction patron, a scripted lawyer"],
          ["Apex", "16+", "A faction head, an Icon, an Apex executive who will not bend"]
        ]),
        help("Rounds, Plays (Press / Support / Read / Disrupt / Hold), Postures, Environmental Pressure, and the full Social Fallout table are the next detailing pass.", "var(--text4)")
      ]))
    ], { corners: true });
  }

  /* ---- tracker configs ---------------------------------------------------- */
  function profilesPanel() {
    return tracker({
      title: "Profiles", tag: "HOW EACH ROOM READS YOU", key: "profiles",
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
      title: "Faction Standing", tag: "POSTURE · PRESSURE STATE", key: "factions",
      blank: { name: "", standing: "neutral", state: "open" },
      empty: "No factions tracked. Most start Neutral; standing shifts through contracts, betrayal, debts, and major scenes.",
      cols: [
        { k: "name", flex: "1.6", placeholder: "Faction, office, or district" },
        { k: "standing", type: "select", options: STANDINGS, flex: "1" },
        { k: "state", type: "select", options: STATES, flex: "1" }
      ]
    });
  }
  var CRED_LADDER = ["Unknown", "New face", "New face", "Known quantity", "Known quantity", "Established", "Established", "Legend", "Legend", "Mythic", "Mythic"];
  var HEAT_LADDER = ["Off the radar", "A file in an inbox", "A file in an inbox", "Active interest", "Active interest", "Targeted", "Targeted", "Hunted", "Hunted", "Marked", "Marked"];
  function credPanel() {
    return tracker({
      title: "Cred", tag: "STANDING PER SCENE", key: "cred",
      blank: { scene: "", value: 0 },
      empty: "No scenes tracked. Cred is contextual: what a specific community thinks when your name comes up.",
      cols: [
        { k: "scene", flex: "1.6", placeholder: "Underground music, fixer net, corp sphere..." },
        { k: "value", type: "num", ladder: CRED_LADDER, tone: "var(--accent)", flex: "0 0 auto" }
      ]
    });
  }
  function heatPanel() {
    return tracker({
      title: "Heat", tag: "HOSTILE ATTENTION PER SOURCE", key: "heat",
      blank: { source: "", value: 0 },
      empty: "No Heat tracked. Heat is who is actively looking for you, watching you, or willing to move against you.",
      cols: [
        { k: "source", flex: "1.6", placeholder: "Corp X, South precinct, a rival crew..." },
        { k: "value", type: "num", ladder: HEAT_LADDER, tone: "var(--danger)", flex: "0 0 auto" }
      ]
    });
  }
  function debtsPanel() {
    return tracker({
      title: "Debts", tag: "FAVORS, OBLIGATIONS, FUTURE HOOKS", key: "debts",
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
    var onPost = _sub === "post", n = unread(ch);
    blocks.push(el("div", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", margin: "0 0 2px", letterSpacing: ".04em" },
        html: "MY <span style='color:var(--accent)'>SOCIALS</span> <span style='font-family:var(--disp);font-size:12px;color:var(--text3);letter-spacing:.18em'>// " +
              (onPost ? "SECURE COMM CHANNEL" : "SOCIAL PRESSURE · FACTION STANDING") + "</span>" }),
      el("p.help", { style: { margin: 0, maxWidth: "820px" }, text: onPost
        ? "Every handle gets an address whether it wants one or not. What lands here is work, warnings, and the occasional person who knows too much about where you sleep."
        : "Some jobs end in gunfire. More end in a room: two chairs, two people working the same problem until one gives ground. This is the ledger that room leaves behind." })
    ]));
    /* Two faces of the same tab: the standing ledger, and the mail. Deliberately
       NOT sticky like the Inventory's bar, which has to carry the wallets; two
       buttons do not earn a pinned strip on a phone. */
    function subTab(key, label) {
      return el("button.btn.sm" + (_sub === key ? ".primary" : ""),
        { onclick: function () { _sub = key; EN.app.render(); } }, label);
    }
    blocks.push(el("div.row.wrap.face-bar", { style: { gap: "6px", marginBottom: "12px" } }, [
      subTab("ledger", "◑ LEDGER"),
      subTab("post", "◧ #POST" + (n ? " · " + n : ""))
    ]));
    if (onPost) { blocks.push(postPanel()); mount.appendChild(el("div", null, blocks)); return; }
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

  return { render: render, personaTick: personaTick, unread: unread };
})();
