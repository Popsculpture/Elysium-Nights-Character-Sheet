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
  var _sub = "post";     // #POST's page: 'post' (Chat) | 'mail'; transient, like the Inventory's
  var _soc = "ledger";   // the Social tab's page: 'ledger' | 'contacts' (Contacts moved here from #POST, 18 Nov 2026); transient
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
        document.createTextNode("Each feature keeps its own active Persona, and the two can copy different people. Running both widens what your cover holds up against; it does not raise any one roll.")
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
     Messages live on ch.face.post, which means they ride the RECORD, and the record is
     still where mail lives: it exports with a Freelancer, imports with them, and a GM
     sitting at the same device can open a player's record and leave one there. An Admin
     on another device reaches it through the character_inbox table. The inbox is the
     courier, not the mailbox: js/cloud.js files each row here and marks it delivered,
     and from then on the message is the player's, on the record like any other.
     A message arrives unread, because the common case is that one arrived.
     Opening it marks it read, and that is what feeds the rail's badge.
     A message from the inbox can carry a package (rec.package, rec.taken: see PACKAGES
     below). The toast at the end of this block is what says one came. */
  // the author's envelope: the #POST sub-tab and the toast
  var ICON_POST = '<svg viewBox="0 0 122.88 88.86" fill="currentColor" aria-hidden="true"><path d="M7.05,0H115.83a7.07,7.07,0,0,1,7,7.05V81.81a7,7,0,0,1-1.22,4,2.78,2.78,0,0,1-.66,1,2.62,2.62,0,0,1-.66.46,7,7,0,0,1-4.51,1.65H7.05a7.07,7.07,0,0,1-7-7V7.05A7.07,7.07,0,0,1,7.05,0Zm-.3,78.84L43.53,40.62,6.75,9.54v69.3ZM49.07,45.39,9.77,83.45h103L75.22,45.39l-11,9.21h0a2.7,2.7,0,0,1-3.45,0L49.07,45.39Zm31.6-4.84,35.46,38.6V9.2L80.67,40.55ZM10.21,5.41,62.39,47.7,112.27,5.41Z"/></svg>';
  // the author's speech bubble with a hashtag (Chat Icon.svg, 18 Nov 2026), copied verbatim: #POST's Chat page. Mail is ICON_POST,
  // the author's envelope, which is Email Icon.svg path for path
  var ICON_CHAT = '<svg viewBox="0 0 512 443.3" fill="currentColor" aria-hidden="true"><path fill-rule="nonzero" d="m292.07 117.34.04-.17c1-4.24 3.57-7.72 6.95-9.93 3.48-2.28 7.84-3.23 12.24-2.31l.43.1c4.24 1 7.71 3.57 9.93 6.94 2.28 3.48 3.23 7.84 2.31 12.25-2.19 9.47-4.01 19.3-6 28.85h11.44c4.49 0 8.58 1.83 11.55 4.8l.02.02c2.97 2.98 4.8 7.06 4.8 11.55 0 4.49-1.84 8.57-4.8 11.54l-.02.03c-2.98 2.96-7.07 4.79-11.55 4.79H311.2l-8.13 40.99h28.6c4.5 0 8.58 1.84 11.55 4.8 2.98 2.96 4.82 7.05 4.82 11.57 0 4.5-1.84 8.58-4.8 11.55a16.26 16.26 0 0 1-11.57 4.81h-35.31l-7.37 35.4a16.38 16.38 0 0 1-6.91 9.72 16.096 16.096 0 0 1-12.24 2.34l-.43-.1c-4.24-1-7.72-3.57-9.93-6.95a16.217 16.217 0 0 1-2.31-12.24c2.13-9.25 3.92-18.84 5.86-28.17h-42.37c-2.4 11.56-4.6 23.49-7.27 34.95-1 4.23-3.57 7.71-6.94 9.92-3.42 2.24-7.7 3.2-12.02 2.36l-.63-.14c-4.25-1-7.74-3.57-9.95-6.95l-.32-.53a16.203 16.203 0 0 1-2.04-11.47l5.86-28.17-15.26.01c-4.52.02-8.61-1.81-11.57-4.77-2.96-2.96-4.8-7.06-4.8-11.57 0-4.5 1.84-8.59 4.81-11.56 2.95-2.97 7.04-4.81 11.56-4.81h21.98l8.09-40.99h-32.39c-4.52 0-8.62-1.83-11.57-4.79l-.39-.42c-2.73-2.93-4.41-6.85-4.41-11.15 0-4.52 1.84-8.62 4.8-11.58 2.96-2.96 7.05-4.79 11.57-4.79h39.16l7.26-34.89c.05-.38.13-.75.24-1.1 1.04-4.15 3.58-7.55 6.9-9.72l.53-.31c3.24-1.96 7.17-2.79 11.14-2.11.41.04.81.13 1.19.25 4.15 1.04 7.57 3.58 9.74 6.9 2.27 3.47 3.22 7.81 2.32 12.19l-6 28.79h42.37c2.48-11.88 5.12-23.83 7.45-35.73zM262.36.14l.25.01c69.94 2.13 132.69 27 177.61 65.52 45.9 39.34 73.43 92.92 71.7 151.4v.13c-1.77 58.57-32.51 110.5-80.75 147.12-47.27 35.86-111.5 57.02-181.46 54.96-19.62-.58-38.54-2.9-56.53-6.78-16.43-3.54-32.23-8.38-47.22-14.36L31.13 443.3l38.47-91.49c-21.11-18.54-38.19-40.12-50.13-63.79C6.13 261.59-.84 232.55.08 202.22c1.77-58.57 32.5-110.5 80.75-147.12C128.1 19.24 192.32-1.92 262.29.14h.07zm-.76 32.23-.26-.01c-62.44-1.83-119.42 16.81-161.05 48.39C59.64 111.6 33.76 154.83 32.3 203.1c-.75 24.79 5 48.62 15.98 70.39 11.6 22.98 29 43.71 50.76 60.95l9.61 7.61-18.17 43.21 55.85-21.96 6.08 2.6c14.89 6.34 30.79 11.41 47.46 15.01a279.91 279.91 0 0 0 50.72 6.15c62.47 1.83 119.47-16.79 161.11-48.39 40.66-30.85 66.54-74.08 68-122.35v-.13c1.42-48.24-21.78-92.86-60.45-126.01-39.64-33.98-95.3-55.93-157.59-57.81h-.06zm8.15 194.42 8.13-40.99h-42.37l-8.14 40.99h42.38z"/></svg>';
  var POST_HELP = "Routed to your registered deck. #POST guarantees delivery. It has never guaranteed privacy.";
  function pid() { return "pm_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
  /* Read by the rail (see the TABS entry in app.js), so it has to tolerate a
     null character and a record that predates the inbox. */
  function unread(ch) {
    var list = (ch && ch.face && ch.face.post) || [];
    return list.filter(function (m) { return !m.read; }).length;
  }

  /* ---- PACKAGES (campaigns batch 3) -----------------------------------------
     A message from the Admin can carry items: rec.package, a list of { name, qty }, and
     rec.taken. Until it is taken the row keeps a glyph and the opened message shows a box
     with Take it, which puts each item in the Stash the way a purchase does
     (EN.inventoryView.takePackage) and reports back (EN.cloud.markTaken), so the Admin sees
     Taken. The items and rec.taken land in one write, so this record can't take it twice.

     Two devices. A record open on two devices is two copies, and the sync keeps one of them
     whole, so a second Take it can't double anything: whichever copy wins holds the items
     once. It could still overwrite what the first device did since, though, so Take it asks
     the inbox first. If the row already says taken and a pull brings that copy here, nothing
     more happens. If it does not (that copy never reached the account, or this one is newer),
     this is the copy that will win, and it takes the items after all.

     A recall. A row can be recalled while the message is here, if a network failure kept this device
     from saying it had arrived. If the player has already opened the letter it stays, because nobody
     can unread one, but the sender took the package back, so that goes at Take it. A package taken
     with no network at all can't be asked about, and stays taken.

     A read-only record (a viewed sheet, a locked record, an example) can't take it. */
  var _taking = {};    // message id -> a Take it is asking the inbox
  var _opening = {};   // message id -> play the box-opening moment on the next draw, once
  // no art for this yet, so it is drawn here: a carton with its flaps up. The flaps are their own paths for the moment.
  var ICON_PKG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path class="pkg-flap pkg-flap-l" d="M2.5 8.5 5.4 3.2c.2-.4.6-.7 1.1-.7h4.9v6z"/><path class="pkg-flap pkg-flap-r" d="M21.5 8.5l-2.9-5.3c-.2-.4-.6-.7-1.1-.7h-4.9v6z"/><path fill-rule="evenodd" d="M2.5 9.8h19v10.4c0 .7-.6 1.3-1.3 1.3H3.8c-.7 0-1.3-.6-1.3-1.3zM10 9.8v4.4l2-1 2 1V9.8z"/></svg>';
  function hasPackage(rec) { return Array.isArray(rec.package) && rec.package.length > 0; }
  function msgOf(ch, id) { return faceRead(ch).post.filter(function (m) { return m && m.id === id; })[0] || null; }
  function readOnlyRecord() {
    if (store.activeIsViewing && store.activeIsViewing()) return true;
    if (store.activeIsExample && store.activeIsExample()) return true;
    var ch = store.active(), id = ch && ch.meta && ch.meta.id;
    return !!(id && store.isLocked && store.isLocked(id));
  }
  function takeNow(lid, id) {
    var refused = [], went = 0, inbox = null;
    _opening[id] = true;
    var ok = store.updateById(lid, function (c) {
      var m = msgOf(c, id);
      if (!m || !hasPackage(m) || m.taken) return;
      refused = EN.inventoryView.takePackage(c, m.package);
      went = m.package.length - refused.length;
      if (went) { m.taken = true; inbox = m.inboxId || null; }
    });
    if (!went) delete _opening[id];
    if (!ok) { EN.ui.toast("Could not save that. The package is still here."); EN.app.render(); return; }
    if (refused.length) EN.ui.toast("Not in the catalog: " + refused.join(", ") + (went ? ". The rest went to your Stash." : ". Nothing went to your Stash."));
    if (inbox && EN.cloud && EN.cloud.markTaken) EN.cloud.markTaken(inbox);
  }
  function takeIt(id) {
    if (_taking[id]) return;
    if (readOnlyRecord()) { EN.ui.toast("This record is read-only, so the package stays where it is."); return; }
    var ch = store.active(), lid = ch && ch.meta && ch.meta.id, m = ch ? msgOf(ch, id) : null;
    if (!m || !hasPackage(m) || m.taken) return;
    var cloud = EN.cloud;
    _taking[id] = true;
    (m.inboxId && cloud && cloud.inboxStatus ? cloud.inboxStatus(m.inboxId) : Promise.resolve(null)).then(function (status) {
      if (status === "recalled") return "recalled";
      if (status !== "taken") return "";
      return cloud.sync({ pull: true }).then(function () {
        var rec = store.roster()[lid], now = rec ? msgOf(rec, id) : null;
        return !now || now.taken ? "taken" : "";
      });
    }).catch(function (e) {
      console.warn("Could not ask about the package", e);
      return "";
    }).then(function (settled) {
      delete _taking[id];
      if (settled === "taken") { EN.ui.toast("Already taken on another device."); EN.app.render(); return; }
      if (settled === "recalled") {
        store.updateById(lid, function (c) { var was = msgOf(c, id); if (was) { delete was.package; delete was.taken; } });
        EN.ui.toast("The sender recalled this package.");
        return;
      }
      takeNow(lid, id);
    });
  }
  function pkgBox(rec) {
    var opening = !!_opening[rec.id], ro = readOnlyRecord();
    delete _opening[rec.id];
    var names = el("ul.post-box-list", null, rec.package.map(function (r) {
      return el("li" + (r.refused ? ".post-box-refused" : ""), { title: r.refused ? "Not in the catalog, so it never reached your Stash." : "" }, [
        el("span.post-box-name", { text: r.name }),
        el("span.mono.post-box-qty", { text: "× " + r.qty })
      ]);
    }));
    return el("div.post-box" + (opening ? ".post-box-opening" : ""), { "data-post": "box" }, [
      el("span.post-box-glyph", { html: ICON_PKG }),
      names,
      rec.taken
        ? el("button.btn.sm.post-take", { type: "button", disabled: true, "data-post": "taken" }, "Taken, in your Stash.")
        : el("button.btn.sm.primary.post-take", { type: "button", disabled: ro, "data-post": "take",
            title: ro ? "This record is read-only." : "Move these into your Stash.",
            onclick: function () { takeIt(rec.id); } }, "Take it")
    ]);
  }

  /* ---- #POST TO YOUR GM (14 Nov 2026) -----------------------------------------------------------
     A Freelancer in a campaign can write to the people who run it, or answer a letter they were sent. Both go through
     the database (EN.campaigns.sendToGm, the GM mailbox migration): who it is from is the character's name, as the
     database stamps it, and an answer is to the name the letter it answers was signed with. Text only. It needs the
     cloud link and a record that is in a campaign and is the player's own, so a viewed sheet, an example and a record
     with no row never offer it. What was sent is read back from the database (a player reads only what they sent) and
     listed under the inbox, with whether the GM has read it. Nothing about it is kept on the record. */
  var _gmDraft = null;   // { lid, replyTo (an inbox row id or null), persona, subj, body, busy }
  /* Who the app writes as when it sends a notice or a receipt rather than a person: House Rules and Advancement Type
     come from "Campaign", and the paydays and awards from the names below. A letter signed so carries an inbox row
     like any other, but there is nobody to answer, so it offers no REPLY. A GM who signs a letter with one of these
     names by hand is signing as the system, and gets the same. */
  var SYSTEM_SENDERS = { "campaign": 1, "payroll": 1, "xp award": 1, "milestones": 1 };
  function fromSystem(rec) { return !!SYSTEM_SENDERS[String(rec && rec.from || "").trim().toLowerCase()]; }
  function gmContext(ch) {
    var lid = ch && ch.meta && ch.meta.id, C = EN.campaigns, cl = EN.cloud;
    if (!lid || readOnlyRecord() || !C || !C.sendToGm || !cl || !cl.rowOf || !cl.signedIn || !cl.signedIn()) return null;
    var row = cl.rowOf(lid), cid = C.campaignOf(ch);
    if (!row || !cid) return null;
    var camp = C.find ? C.find(cid) : null;
    return { lid: lid, row: row, campaignId: cid, campaignName: camp && camp.name ? camp.name : "your campaign" };
  }
  function newGmDraft(ctx, rec) {
    var subj = rec && rec.subj ? (/^re:/i.test(rec.subj) ? rec.subj : "Re: " + rec.subj) : "";
    _gmDraft = { lid: ctx.lid, replyTo: rec && rec.inboxId ? rec.inboxId : null, persona: rec ? String(rec.from || "") : "", subj: subj, body: "", busy: false };
    return _gmDraft;
  }
  /* The draft for one target, made if it is not the one in hand (#GRIDeck P5): a messenger keeps a composer under the thread
     that is open, so the draft follows the thread and what is typed in it stays while the thread does. No redraw. */
  function gmDraftFor(ctx, rec) {
    var replyTo = rec && rec.inboxId ? rec.inboxId : null;
    if (_gmDraft && _gmDraft.lid === ctx.lid && _gmDraft.replyTo === replyTo) return _gmDraft;
    return newGmDraft(ctx, rec);
  }
  function sendGm(ctx) {
    var d = _gmDraft, C = EN.campaigns;
    if (!d || d.busy) return;
    var subj = String(d.subj || "").trim(), body = String(d.body || "").trim();
    if (!subj && !body) { EN.ui.toast("Add a subject or a message."); return; }
    d.busy = true;
    C.sendToGm(ctx.row, { subj: subj, body: body }, d.replyTo).then(function () {
      if (_gmDraft === d) _gmDraft = null;
      if (EN.chat) EN.chat.heard(null);   // what was sent is read back at once (js/chat.js)
      EN.ui.toast(d.persona ? "Sent. It is on its way to " + d.persona + "." : "Sent to your GM.");
      EN.app.render();
    }, function (e) {
      console.warn("Could not send to the GM", e);
      d.busy = false;
      EN.ui.toast(C.errText(e));
      EN.app.render();
    });
  }
  /* ---- THE MESSENGER (17 Nov 2026, the author's calls): Messages as a chat app reads ----
     The people the Freelancer talks to down the left, the most recent conversation first, and the one picked on the right as a
     thread: everything said both ways, oldest at the top and newest at the bottom, in the order it was written, with the
     message box under it. A thread is one person: an NPC the GM writes as, the GM themself ("The GM"), or another player's
     character in the same campaign. What the GM sent is on the record (ch.face.post, filed by js/cloud.js); what the player
     sent, the letters between players and when each side read the other's are in the database, held by js/chat.js.
     What it keeps from the inbox it replaced, because the mail works that way: a letter can carry a package (Take it is pkgBox),
     a letter can be logged by hand and edited, and the notices the app signs cannot be answered. No subjects in the chat:
     a letter that has one shows it in bold. Every skin draws this page; #GRIDeck has a messenger of its own (js/deck_post.js),
     which shares threadsOf. */
  var _mg = { th: null, q: "", only: "all", edit: null, stick: false, drafts: {}, busy: {}, pending: null, picking: false, selecting: false, picked: {} };
  /* DELETE IS FOR THE ONE DELETING (18 Nov 2026, the author's call): a delete takes a letter or a line out of this record's own
     #POST and never out of anybody else's. A letter on the record is taken off it; meta.inboxApplied still lists its inbox row, so
     it is never filed again (js/cloud.js). What lives only in the database (what this character wrote to the GM, and letters
     between players) is listed by row id in face.hidden, on the record, so it stays gone on every device. */
  var HIDE_MAX = 2000;
  function hiddenOf(ch) { var h = {}; ((ch && ch.face && ch.face.hidden) || []).forEach(function (id) { h[id] = 1; }); return h; }
  function forget(letterIds, rowIds) {
    if (!letterIds.length && !rowIds.length) return;
    var drop = {};
    letterIds.forEach(function (id) { drop[id] = 1; });
    fset(function (f) {
      if (letterIds.length) f.post = f.post.filter(function (m) { return !(m && drop[m.id]); });
      if (rowIds.length) {
        var h = Array.isArray(f.hidden) ? f.hidden.slice() : [];
        rowIds.forEach(function (id) { if (id && h.indexOf(id) === -1) h.push(id); });
        f.hidden = h.length > HIDE_MAX ? h.slice(h.length - HIDE_MAX) : h;
      }
    });
  }
  // everything in some chats, for a delete: the letters on the record and the rows in the database
  function forgetThreads(list) {
    var letters = [], rows = [];
    list.forEach(function (t) {
      t.msgs.forEach(function (x) { letters.push(x.m.id); });
      t.sent.forEach(function (r) { rows.push(r.id); });
      t.pm.forEach(function (r) { rows.push(r.id); });
    });
    forget(letters, rows);
  }
  // a delete pressed twice (a package goes with its letter, and nothing deleted comes back)
  function armDel(key, label, armedLabel, title, post, fn) {
    var b = EN.ui.armButton(key, { label: label, armedLabel: armedLabel, title: title, onConfirm: fn });
    b.setAttribute("data-post", post);
    return b;
  }
  function threadKey(name) { return "t:" + String(name || "").trim().toLowerCase(); }
  // letters signed as the GM themself are the GM's own chat, as the GM's side has them (js/gm_post.js)
  var GM_NAMES = { "the gm": 1, "your gm": 1, "gm": 1 };
  function gmName(name) { return !!GM_NAMES[String(name || "").trim().toLowerCase()]; }
  function timeOf(iso) { var t = iso ? Date.parse(iso) : NaN; return isNaN(t) ? null : t; }
  /* the threads, the most recent first. Each has msgs (its letters on the record, newest first, as the mail is kept), sent
     (what this character wrote to the GM under that name), pm (letters with another player) and items: all of it in the
     order it was written. A letter filed before letters carried a time sorts by the database's time for it when js/chat.js
     has one, and otherwise ahead of everything timed, in the order the mail keeps. */
  function threadsOf(ch, ctx, opts) {
    var chat = !!(opts && opts.chat);   // the Chat page: letters are Mail's (18 Nov 2026); #GRIDeck's messenger still has them all
    var post = faceRead(ch).post, map = {}, order = [], gone = hiddenOf(ch);
    // the GM's letters' times are read from the database only while a letter on the record has none (js/chat.js)
    var D = ctx && EN.chat ? EN.chat.ensure(Object.assign({ needTimes: post.some(function (m) { return m && m.inboxId && !m.at; }) }, ctx)) : null;
    function get(key, name, more) {
      if (!map[key]) { map[key] = { key: key, name: name, kind: "npc", msgs: [], sent: [], pm: [], unread: 0, sys: false, gm: false }; order.push(key); }
      if (more) Object.keys(more).forEach(function (k) { map[key][k] = more[k]; });
      return map[key];
    }
    function gmThread() { return get("gm", "The GM", { gm: true, kind: "gm", sub: ctx ? ctx.campaignName : "" }); }
    /* A line the GM wrote as one of the campaign's other characters is in the chat with that player, as if they had written it
       (the author's call): an answer there goes to that player, as any line in that chat does. */
    var asPlayer = {};
    if (chat && ctx && D) Object.keys(D.names).forEach(function (id) { if (id !== ctx.row) asPlayer[String(D.names[id].name || "").trim().toLowerCase()] = id; });
    function playerThread(id) { var who = D.names[id]; return get("p:" + id, who ? who.name : "A Freelancer", { kind: "player", other: id, player: who ? who.player : "" }); }
    post.forEach(function (m, i) {
      if (!m || (chat && isMail(m))) return;
      var name = String(m.from || "").trim() || "Unknown node", spoof = asPlayer[name.toLowerCase()];
      var t = spoof ? playerThread(spoof) : gmName(name) ? gmThread() : get(threadKey(name), name);
      t.msgs.push({ m: m, i: i });
      if (!m.read) t.unread++;
      if (fromSystem(m)) { t.sys = true; t.kind = "sys"; }
    });
    if (ctx) {
      (D ? D.gm : []).forEach(function (r) {
        if (gone[r.id]) return;   // deleted from this record's #POST
        if (chat && sentMail(r)) return;   // a letter with a subject is Mail's
        var who = String(r.persona || "").trim();
        (who && !gmName(who) ? get(threadKey(who), who) : gmThread()).sent.push(r);
      });
      gmThread();
      (D && D.pm ? D.pm : []).forEach(function (r) {
        if (gone[r.id]) return;
        var other = r.from_character === ctx.row ? r.to_character : r.from_character;
        var t = playerThread(other);
        t.pm.push(r);
        if (r.to_character === ctx.row && !r.read_at) t.unread++;
      });
    }
    var list = order.map(function (k) {
      var t = map[k], untimed = [], timed = [];
      t.msgs.forEach(function (x) {
        var at = timeOf(x.m.at) || (D && x.m.inboxId && D.inbox[x.m.inboxId] ? timeOf(D.inbox[x.m.inboxId].at) : null);
        (at === null ? untimed : timed).push({ dir: "in", type: "letter", at: at, x: x });
      });
      t.sent.forEach(function (r) { var at = timeOf(r.created_at); (at === null ? untimed : timed).push({ dir: "out", type: "gm", at: at, r: r }); });
      t.pm.forEach(function (r) { var at = timeOf(r.created_at); (at === null ? untimed : timed).push({ dir: r.from_character === (ctx && ctx.row) ? "out" : "in", type: "pm", at: at, r: r }); });
      untimed.reverse();   // the mail is kept newest first
      timed.sort(function (a, b) { return a.at - b.at; });
      t.items = untimed.concat(timed);
      t.lastAt = timed.length ? timed[timed.length - 1].at : null;
      t.pos = order.indexOf(k);
      return t;
    });
    // the most recent first; a thread with nothing timed keeps the mail's order, after them; an empty one goes last
    list.sort(function (a, b) {
      var ea = !a.items.length, eb = !b.items.length;
      if (ea !== eb) return ea ? 1 : -1;
      if (a.lastAt !== null && b.lastAt !== null) return b.lastAt - a.lastAt;
      if (a.lastAt !== null) return -1;
      if (b.lastAt !== null) return 1;
      return a.pos - b.pos;
    });
    return list;
  }
  function initialsOf(n) { return String(n || "?").replace(/["'#]/g, "").split(/\s+/).filter(Boolean).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase() || "?"; }
  function mgAvatar(t) {
    return el("span.msgr-av" + (t.sys || t.gm ? ".sys" : t.kind === "player" ? ".pc" : ""), t.sys || t.gm ? { html: ICON_POST } : { text: initialsOf(t.name) });
  }
  function itemText(it) {
    if (it.type === "letter") return it.x.m.body || it.x.m.subj || "(empty)";
    if (it.type === "gm") { var mail = it.r.mail || {}; return mail.body || mail.subj || ""; }
    return it.r.body || "";
  }
  function mgLine(t) {
    var last = t.items[t.items.length - 1];
    if (last) return (last.dir === "out" ? "You: " : "") + itemText(last);
    return t.gm ? "Write to the people who run " + (t.sub || "your campaign") + "." : t.kind === "player" ? "Say hello." : "No letters.";
  }
  // a time to read: today's as a clock, this week's with the day, older with the date
  function stamp(ms) {
    var d = new Date(ms), now = new Date();
    var clock = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    if (d.toDateString() === now.toDateString()) return clock;
    if (now - d < 6 * 864e5) return d.toLocaleDateString(undefined, { weekday: "short" }) + " " + clock;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + clock;
  }
  function itemsUnreadToMe(t, ctx) {
    var inbox = t.msgs.filter(function (x) { return x.m.inboxId; }).map(function (x) { return x.m.inboxId; });
    var pm = t.pm.filter(function (r) { return ctx && r.to_character === ctx.row && !r.read_at; }).map(function (r) { return r.id; });
    return { inbox: inbox, pm: pm };
  }
  /* Opening a thread is reading it: the letters on the record are marked read (what clears the rail's dot), and the database
     is told, so the other side can say Seen. Not on a read-only record: the store refuses the write without a word, and
     somebody looking at a sheet has not read its owner's mail. */
  function mgRead(t, ro, ctx) {
    if (ro) return false;
    var u = itemsUnreadToMe(t, ctx);
    if (ctx && EN.chat) EN.chat.seen(ctx, u.inbox, u.pm);
    if (!t.msgs.some(function (x) { return !x.m.read; })) return false;
    fset(function (f) { t.msgs.forEach(function (x) { if (f.post[x.i] && f.post[x.i].id === x.m.id) f.post[x.i].read = true; }); });
    return true;
  }
  function mgOpen(t, ro, ctx) {
    _mg.th = t.key; _mg.edit = null; _mg.stick = true; _mg.picking = false;
    if (!mgRead(t, ro, ctx === undefined ? gmContext(store.active()) : ctx)) EN.app.render();
  }
  // one letter on the record, as a bubble with its few actions under it; a letter being edited is its fields in the bubble
  function mgLetter(t, x, ro) {
    var m = x.m, i = x.i, waiting = hasPackage(m) && !m.taken;
    function put(k, v, silent) { fset(function (f) { if (f.post[i] && f.post[i].id === m.id) f.post[i][k] = v; }, silent); }
    var kids = [];
    if (m.subj) kids.push(el("b.msgr-s", { text: m.subj }));
    if (m.body) kids.push(el("p.msgr-t", { text: m.body }));
    if (!m.subj && !m.body) kids.push(el("p.msgr-t.dim", { text: "(empty)" }));
    if (hasPackage(m)) kids.push(pkgBox(m));
    var acts = ro ? [] : [
      el("button.btn.sm.ghost", { type: "button", dataset: { post: "mark" }, title: m.read ? "Put it back in the unread pile." : "Clear it off the rail's badge.",
        onclick: function () { var to = !m.read; put("read", to); } }, m.read ? "MARK UNREAD" : "MARK READ"),
      // a package nobody has taken goes with the message, so that one asks first
      waiting
        ? armDel("postdel:" + (m.id || i), "✕ DELETE", "SURE? THE PACKAGE GOES TOO", "Delete this message and the package in it, from your #POST.", "delete", function () { forget([m.id], []); })
        : el("button.btn.sm.ghost", { type: "button", dataset: { post: "delete" }, title: "Delete this message from your #POST. The sender's copy stays.",
            onclick: function () { forget([m.id], []); } }, "✕ DELETE")
    ];
    return el("div.msgr-m" + (m.read ? "" : ".new"), { dataset: { msg: m.id || String(i) } }, [el("div.msgr-b", null, kids), acts.length ? el("div.msgr-act", null, acts) : null]);
  }
  // what was said in the database: a letter to the GM, or a letter between players, either way
  function mgSaid(it, ro) {
    var r = it.r, mail = it.type === "gm" ? (r.mail || {}) : { body: r.body };
    return el("div.msgr-m" + (it.dir === "out" ? ".me" : ""), { dataset: { post: it.type === "gm" ? "gm-sent" : "pm", status: r.status || "", msg: r.id } }, [
      el("div.msgr-b", null, [mail.subj ? el("b.msgr-s", { text: mail.subj }) : null, mail.body ? el("p.msgr-t", { text: mail.body }) : null]),
      ro ? null : el("div.msgr-act", null, [el("button.btn.sm.ghost", { type: "button", dataset: { post: "delete" },
        title: it.dir === "out" ? "Delete it from your #POST. They keep their copy." : "Delete it from your #POST. The sender keeps their copy.",
        onclick: function () { forget([], [r.id]); } }, "✕ DELETE")])]);
  }
  function seenOf(it) { return it.type === "gm" ? (it.r.status === "read" || !!it.r.read_at) : it.type === "pm" ? !!it.r.read_at : false; }
  // the answer box: one line of words and SEND, as a messenger has. Enter sends; Shift and Enter is a new line.
  function mgCompose(t, ctx, ro) {
    function note(text) { return el("div.msgr-note", { dataset: { post: "compose-none" }, text: text }); }
    if (ro) return note("");
    if (t.sys) return note("Notices arrive here with your mail. They cannot be answered.");
    if (!ctx) return note("Answers go through your campaign: link this record to one, and jack in, to write back.");
    // an NPC is answered through the newest letter they sent through the campaign
    var target = t.kind === "npc" ? (t.msgs.filter(function (x) { return x.m.inboxId && !fromSystem(x.m); })[0] || {}).m || null : null;
    if (t.kind === "npc" && !target) return note("This letter was logged by hand, so there is nobody on the other end to answer here.");
    var key = t.key, busy = !!_mg.busy[key];
    var box = el("textarea", { maxlength: "4000", rows: 1, value: _mg.drafts[key] || "", placeholder: t.gm ? "Write to the people who run " + (ctx.campaignName || "your campaign") : "Message " + t.name,
      "aria-label": "Message", dataset: { post: "gm-body" },
      oninput: function (e) { _mg.drafts[key] = e.target.value; },
      onkeydown: function (e) { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } } });
    function send() {
      var body = String(_mg.drafts[key] || "").trim();
      if (!body || _mg.busy[key]) { if (!body) EN.ui.toast("Write something first."); return; }
      _mg.busy[key] = true; _mg.stick = true;
      var go = t.kind === "player" ? EN.chat.toPlayer(ctx, t.other, body) : EN.chat.toGm(ctx, body, target ? target.inboxId : null);
      go.then(function () {
        delete _mg.busy[key]; _mg.drafts[key] = ""; _mg.stick = true;
        if (_mg.pending && _mg.pending.key === key) _mg.pending = null;
        EN.app.render();
        var again = document.querySelector('#view [data-post="gm-body"]'); if (again) { try { again.focus({ preventScroll: true }); } catch (e) {} }
      }, function (e) {
        delete _mg.busy[key];
        console.warn("#POST could not send", e);
        EN.ui.toast(EN.campaigns.errText(e));
        EN.app.render();
      });
    }
    return el("div.msgr-cmp", { dataset: { post: "gm-compose" } }, [el("div.msgr-cmp-row", null, [box,
      el("button.btn.primary", { type: "button", disabled: busy, dataset: { post: "gm-send" }, title: t.kind === "player" ? "It goes to " + t.name : t.gm ? "It goes to your GM" : "It goes to the GM, as " + t.name + "'s reply",
        onclick: send }, busy ? "…" : "SEND")])]);
  }
  function mgThread(ch, t, ctx, ro) {
    var feed = el("div.msgr-feed", { dataset: { keepScroll: "msgr-feed" } }), lastLabel = null, lastAt = null;
    var lastOut = null;
    t.items.forEach(function (it) { if (it.dir === "out") lastOut = it; });
    t.items.forEach(function (it) {
      // a time over each run: a letter's own When where it has no time, else the time, once a gap opens or the day turns
      var label = it.at !== null ? stamp(it.at) : (it.type === "letter" ? it.x.m.when : "");
      var show = it.at !== null ? (lastAt === null || it.at - lastAt > 15 * 60000 || new Date(it.at).toDateString() !== new Date(lastAt).toDateString()) : (label && label !== lastLabel);
      if (show && label) feed.appendChild(el("div.msgr-when", { text: label }));
      if (label) lastLabel = label;
      if (it.at !== null) lastAt = it.at;
      feed.appendChild(it.type === "letter" ? mgLetter(t, it.x, ro) : mgSaid(it, ro));
      // under the last thing the player said: whether the other side has read it, as a messenger says
      if (it === lastOut) feed.appendChild(el("div.msgr-seen", { dataset: { post: "seen", seen: seenOf(it) ? "1" : "0" }, text: seenOf(it) ? "Seen" : "Sent" }));
    });
    if (!feed.children.length) feed.appendChild(el("p.msgr-empty", { text: t.gm ? "Nothing sent yet. What you write goes to the people who run " + (t.sub || "your campaign") + "."
      : t.kind === "player" ? "Nothing yet. Only the two of you see this chat." : "No letters." }));
    var sub = t.kind === "player" ? (t.player ? "Played by " + t.player : "In your campaign") : t.gm ? (t.sub || "") : "";
    var head = el("div.msgr-h", null, [
      el("button.btn.sm.ghost.msgr-back", { type: "button", "data-ro-keep": "1", dataset: { post: "back" }, title: "Back to the chats", onclick: function () { _mg.th = null; EN.app.render(); } }, "‹"),
      mgAvatar(t), el("span.msgr-hn", null, [el("b", { text: t.name }), sub ? el("small", { text: sub }) : null]),
      t.sys ? el("span.chip", { text: "NOTICE" }) : t.kind === "player" ? el("span.chip", { text: "PLAYER" }) : null,
      el("span", { style: { flex: "1 1 auto" } }),
      ro || !t.items.length ? null : armDel("chatdel:" + t.key, "✕ DELETE CHAT", "SURE? THE WHOLE CHAT", "Delete everything in this chat from your #POST. Nobody else's copy changes.",
        "delete-chat", function () { _mg.th = null; forgetThreads([t]); })]);
    return [head, feed, mgCompose(t, ctx, ro)];
  }
  // who a new chat can be with: the GM, and every other character in the campaign
  function mgPicker(ctx, all) {
    var D = ctx && EN.chat ? EN.chat.data(ctx) : null, rows = [];
    function pick(key, name, more) {
      _mg.picking = false;
      var have = all.filter(function (t) { return t.key === key; })[0];
      if (have) { mgOpen(have, false, ctx); return; }
      _mg.pending = Object.assign({ key: key, name: name }, more || {});
      _mg.th = key; _mg.stick = true; EN.app.render();
    }
    rows.push(el("button.msgr-th", { type: "button", dataset: { post: "pick", pick: "gm" }, onclick: function () { pick("gm", "The GM", { gm: true, kind: "gm", sub: ctx.campaignName }); } }, [
      el("span.msgr-av.sys", { html: ICON_POST }), el("span.msgr-tt", null, [el("b", { text: "The GM" }), el("span", { text: ctx.campaignName || "" })])]));
    Object.keys(D ? D.names : {}).filter(function (id) { return id !== ctx.row; }).sort(function (a, b) { return D.names[a].name.localeCompare(D.names[b].name); }).forEach(function (id) {
      var n = D.names[id];
      rows.push(el("button.msgr-th", { type: "button", dataset: { post: "pick", pick: id }, onclick: function () { pick("p:" + id, n.name, { kind: "player", other: id, player: n.player }); } }, [
        el("span.msgr-av.pc", { text: initialsOf(n.name) }), el("span.msgr-tt", null, [el("b", { text: n.name }), el("span", { text: n.mine ? "Your own character" : n.player ? "Played by " + n.player : "" })])]));
    });
    if (D && !Object.keys(D.names).length) rows.push(el("p.msgr-empty", { text: "Reading who is in the campaign…" }));
    return el("div.msgr-list.msgr-pickl", { dataset: { post: "picker" } }, rows);
  }
  function messengerPanel() {
    var ch = store.active(), ro = readOnlyRecord();
    var ctx = gmContext(ch);
    var all = threadsOf(ch, ctx, { chat: true }), n = all.reduce(function (a, t) { return a + t.unread; }, 0), cur = all.filter(function (x) { return x.key === _mg.th; })[0] || null;
    // a chat chosen to start, that has nothing in it yet
    if (!cur && _mg.pending && _mg.pending.key === _mg.th && ctx) cur = Object.assign({ kind: "npc", msgs: [], sent: [], pm: [], items: [], unread: 0, sys: false, gm: false }, _mg.pending);
    if (!cur) _mg.th = null;
    // what arrives in the chat that is open is read as it comes, once the page is drawn
    if (cur && !ro && cur.unread) setTimeout(function () { if (_mg.th === cur.key) mgRead(cur, ro, ctx); }, 0);
    backfill(ch, ctx);
    var selecting = _mg.selecting && !ro && !_mg.picking;
    if (!selecting) _mg.selecting = false;
    // the chats, filtered by the box and by All / Unread without a redraw of the page, so the caret stays where it is
    var listBox = el("div.msgr-list", { dataset: { keepScroll: "msgr-list", post: "chats" } });
    function fill() {
      var q = _mg.q.trim().toLowerCase();
      var shown = all.filter(function (t) {
        if (_mg.only === "unread" && !t.unread) return false;
        if (!q) return true;
        return t.name.toLowerCase().indexOf(q) !== -1 || t.items.some(function (it) { return (it.type === "letter" ? (it.x.m.subj || "") + " " : "") .concat(itemText(it)).toLowerCase().indexOf(q) !== -1; });
      });
      EN.ui.clear(listBox);
      listBox.setAttribute("data-shown", String(shown.length));
      if (!shown.length) listBox.appendChild(el("p.msgr-empty", { dataset: { post: "none" }, text: all.length ? "No chat matches." : "No traffic. #POST is holding nothing for this handle." }));
      shown.forEach(function (t) {
        var last = t.items[t.items.length - 1], parcel = t.msgs.some(function (x) { return hasPackage(x.m) && !x.m.taken; });
        var when = last ? (last.at !== null ? stamp(last.at) : (last.type === "letter" ? last.x.m.when : "")) : "";
        var picked = selecting && !!_mg.picked[t.key];
        listBox.appendChild(el("button.msgr-th" + (cur && cur.key === t.key && !selecting ? ".on" : "") + (t.unread ? ".un" : "") + (selecting ? ".pick" : "") + (picked ? ".picked" : ""), { type: "button", "data-ro-keep": "1",
          "aria-pressed": (selecting ? picked : cur && cur.key === t.key) ? "true" : "false", dataset: { thread: t.key, post: "chat" },
          onclick: function () { if (selecting) { if (_mg.picked[t.key]) delete _mg.picked[t.key]; else _mg.picked[t.key] = true; EN.app.render(); } else mgOpen(t, ro, ctx); } }, [
          selecting ? el("span.pick-box", { "aria-hidden": "true", text: picked ? "✓" : "" }) : null,
          mgAvatar(t),
          el("span.msgr-tt", null, [el("b", { text: t.name }), el("span", { text: mgLine(t) + (when ? "  ·  " + when : "") })]),
          parcel ? el("span.msgr-pk", { html: ICON_PKG, title: "A package is waiting" }) : null,
          t.unread ? el("i.msgr-ud", { title: t.unread + " unread", text: String(t.unread) }) : null]));
      });
    }
    fill();
    var search = el("input", { type: "text", value: _mg.q, placeholder: "Search #POST", "aria-label": "Search #POST", dataset: { post: "search" },
      oninput: function (e) { _mg.q = e.target.value; fill(); } });
    var chips = ["all", "unread"].map(function (k) {
      return el("button.msgr-chip" + (_mg.only === k ? ".on" : ""), { type: "button", "data-ro-keep": "1", dataset: { post: "only-" + k }, onclick: function () {
        _mg.only = k; chips.forEach(function (c) { c.classList.toggle("on", c.getAttribute("data-post") === "only-" + k); }); fill(); } }, k === "all" ? "All" : "Unread" + (n ? " · " + n : ""));
    });
    var picking = _mg.picking && !ro;
    // the chats that can be deleted: those with something in them (the GM's own chat is always listed, empty or not)
    var full = all.filter(function (t) { return t.items.length; }).map(function (t) { return t.key; });
    var bar = selecting ? EN.mailView.pickBar({ key: "chats", noun: "chat", ids: full, state: _mg,
      // the page's state first: the delete writes the record, and that write is what draws the page again
      del: function (keys) { if (keys.indexOf(_mg.th) !== -1) _mg.th = null; _mg.selecting = false; _mg.picked = {}; forgetThreads(all.filter(function (t) { return keys.indexOf(t.key) !== -1; })); },
      done: function () { _mg.selecting = false; _mg.picked = {}; EN.app.render(); } }) : null;
    var side = el("div.msgr-side", null, [
      el("div.msgr-sh", null, [el("h3", { text: picking ? "New chat" : "Chats" }), el("span", { style: { flex: "1 1 auto" } }),
        ro || selecting ? null : picking
          ? el("button.btn.sm.ghost", { type: "button", dataset: { post: "pick-cancel" }, onclick: function () { _mg.picking = false; EN.app.render(); } }, "CANCEL")
          : ctx ? el("button.btn.sm", { type: "button", dataset: { post: "new-chat" }, title: "Start a chat with the GM or another player", onclick: function () { _mg.picking = true; EN.app.render(); } }, "+ NEW CHAT")
          : null,
        ro || picking || selecting || !full.length ? null : EN.mailView.selectButton(function () { _mg.selecting = true; _mg.picked = {}; EN.app.render(); })]),
      picking ? null : el("div.msgr-sb", null, [search]), picking ? null : el("div.msgr-chips", null, chips),
      bar ? el("div.pick-bar", { dataset: { post: "pick-bar" } }, bar) : null,
      picking ? mgPicker(ctx, all) : listBox, el("p.msgr-foot", { text: POST_HELP })]);
    var main = el("div.msgr-main", { dataset: { thread: cur ? cur.key : "" } }, cur ? mgThread(ch, cur, ctx, ro)
      : [el("p.msgr-empty.msgr-pick", { dataset: { post: "nopick" }, text: all.length ? "Select a chat to read it." : "No traffic. #POST is holding nothing for this handle." })]);
    return el("div.msgr", { dataset: { post: "messenger", pane: cur ? "thread" : "list", count: String(all.length), unread: String(n) } }, [side, main]);
  }
  /* A letter filed before letters carried a time gets the database's, once js/chat.js has read it, written onto the record
     without a redraw: the order then holds offline and on another device too. */
  function backfill(ch, ctx) {
    var D = ctx && EN.chat ? EN.chat.data(ctx) : null;
    if (!D || readOnlyRecord()) return;
    var fix = faceRead(ch).post.filter(function (m) { return m && m.inboxId && !m.at && D.inbox[m.inboxId] && timeOf(D.inbox[m.inboxId].at) !== null; });
    if (!fix.length) return;
    var times = {};
    fix.forEach(function (m) { times[m.id] = D.inbox[m.inboxId].at; });
    setTimeout(function () { fset(function (f) { f.post.forEach(function (m) { if (m && times[m.id] && !m.at) m.at = times[m.id]; }); }, true); }, 0);
  }
  // letters from other players that this record has not read yet (the rail's dot counts them with the mail)
  function chatUnread() {
    var ch = store.active(), ctx = ch ? gmContext(ch) : null, D = ctx && EN.chat ? EN.chat.data(ctx) : null;
    if (!D || !D.pm) return 0;
    var gone = hiddenOf(ch);
    return D.pm.filter(function (r) { return r.to_character === ctx.row && !r.read_at && !gone[r.id]; }).length;
  }
  // a thread opens on its newest letter, which is at the bottom. After the page is in, and after the app has put each scroller
  // back where it was (it does that when a render ends), so neither can undo this
  function mgAfter(mount) {
    if (!_mg.stick) return;
    _mg.stick = false;
    var go = function () { var f = mount.querySelector(".msgr-feed"); if (f) f.scrollTop = f.scrollHeight; };
    go(); setTimeout(go, 0);
  }

  /* ---- MAIL (18 Nov 2026, the author's call): #POST is Chat / Mail / Contacts ----
     Chat is the back-and-forth. Mail is the letters: anything with a subject or a package (what the GM sends from the Admin's
     MAIL page), the notices the app signs (Payroll, Campaign), and letters logged by hand. It reads like an inbox: the
     letters down the left, newest first, with Inbox and Sent; the one picked on the right, whole, with its package and, for a
     letter that came through the campaign, REPLY, an answer with a subject. Drawn as an email reads (js/mailview.js). A player writes to the GM with a subject here.
     A player writes only as themself: the database signs every letter with the character's own name, and only a letter
     logged by hand can be edited (one the GM sent is the GM's words). */
  var _ml = { sel: null, folder: "in", writing: false, draft: { subj: "", body: "" }, reply: {}, replying: null, busy: false, edit: null, selecting: false, picked: {} };
  function isMail(m) { return !!(m && (String(m.subj || "").trim() || hasPackage(m) || fromSystem(m) || !m.inboxId)); }
  function sentMail(r) { return !!String(((r && r.mail) || {}).subj || "").trim(); }
  function mailWhen(m) { var t = timeOf(m.at); return t !== null ? stamp(t) : (m.when || ""); }
  function mailOpen(x, ro, ctx) {
    _ml.sel = x.m.id; _ml.writing = false; _ml.edit = null; _ml.replying = null;
    if (!ro && ctx && EN.chat && x.m.inboxId) EN.chat.seen(ctx, [x.m.inboxId], []);
    if (!ro && !x.m.read) fset(function (f) { if (f.post[x.i] && f.post[x.i].id === x.m.id) f.post[x.i].read = true; });
    else EN.app.render();
  }
  // + LOG (a letter logged by hand) is gone (18 Nov 2026, the author's call); a letter logged before then keeps its EDIT
  function mailSend(ctx, replyTo, d, key) {
    var subj = String(d.subj || "").trim(), body = String(d.body || "").trim();
    if (!subj && !body) { EN.ui.toast("Add a subject or a message."); return; }
    if (_ml.busy) return;
    _ml.busy = true; EN.app.render();
    EN.chat.toGm(ctx, body, replyTo, subj).then(function () {
      _ml.busy = false;
      if (key) { delete _ml.reply[key]; _ml.replying = null; } else { _ml.draft = { subj: "", body: "" }; _ml.writing = false; _ml.folder = "sent"; }
      EN.ui.toast(replyTo ? "Sent. Your answer is on its way." : "Sent to your GM.");
      EN.app.render();
    }, function (e) {
      _ml.busy = false;
      console.warn("#POST could not send", e);
      EN.ui.toast(EN.campaigns.errText(e));
      EN.app.render();
    });
  }
  // a letter on the record, open, as an email reads (js/mailview.js): Reply, Mark, Edit (a letter logged by hand only), Delete
  function mailLetter(x, ro, ctx) {
    var m = x.m, i = x.i, waiting = hasPackage(m) && !m.taken, who = String(m.from || "").trim() || "Unknown node";
    function put(k, v, silent) { fset(function (f) { if (f.post[i] && f.post[i].id === m.id) f.post[i][k] = v; }, silent); }
    if (_ml.edit === m.id && !ro && !m.inboxId) {
      function fld(k, label, ph) {
        return el("div.mail-crow", null, [el("span.mail-k", { text: label }),
          el("input", { type: "text", value: m[k] || "", placeholder: ph, dataset: { post: "edit-" + k }, oninput: function () { put(k, this.value, true); } })]);
      }
      return el("div.mail-compose", { dataset: { post: "mail-edit", msg: m.id } }, [el("div.mail-ctitle", { text: "A letter logged by hand" }),
        fld("from", "From", "NULLJACK"), fld("subj", "Subject", "Work, if you want it"), fld("when", "When", "03:14, Tuesday"),
        el("textarea.mail-ctext", { value: m.body || "", placeholder: "The letter…", dataset: { post: "edit-body" }, oninput: function () { put("body", this.value, true); } }),
        el("div.mail-cfoot", null, [el("button.btn.primary", { type: "button", dataset: { post: "edit-done" }, onclick: function () { _ml.edit = null; EN.app.render(); } }, "DONE")])]);
    }
    var canReply = !ro && ctx && m.inboxId && !fromSystem(m);
    var tools = ro ? [] : [
      canReply ? el("button.btn.sm", { type: "button", dataset: { post: "reply-open" }, title: "Answer " + who, onclick: function () { _ml.replying = m.id; EN.app.render(); } }, "↩ REPLY") : null,
      el("button.btn.sm.ghost", { type: "button", dataset: { post: "mark" }, title: m.read ? "Put it back in the unread pile." : "Clear it off the rail's badge.",
        onclick: function () { var to = !m.read; put("read", to); } }, m.read ? "MARK UNREAD" : "MARK READ"),
      m.inboxId ? null : el("button.btn.sm.ghost", { type: "button", dataset: { post: "edit" }, title: "A letter you logged by hand is yours to correct", onclick: function () { _ml.edit = m.id; EN.app.render(); } }, "EDIT"),
      waiting
        ? armDel("maildel:" + (m.id || i), "✕ DELETE", "SURE? THE PACKAGE GOES TOO", "Delete this letter and the package in it, from your Mail.", "delete", function () { _ml.sel = null; forget([m.id], []); })
        : el("button.btn.sm.ghost", { type: "button", dataset: { post: "delete" }, title: "Delete this letter from your Mail. The sender's copy stays.",
            onclick: function () { _ml.sel = null; forget([m.id], []); } }, "✕ DELETE")];
    var after = [];
    // the answer goes to whoever signed the letter, through the GM, with Re: and its subject
    if (canReply && _ml.replying === m.id) {
      var d = _ml.reply[m.id] || (_ml.reply[m.id] = { subj: m.subj ? (/^re:/i.test(m.subj) ? m.subj : "Re: " + m.subj) : "", body: "" });
      after.push(EN.mailView.compose({ title: "Reply", to: who, subj: d.subj, body: d.body, busy: _ml.busy, post: "mail-reply", placeholder: "Answer " + who,
        onSubj: function (v) { d.subj = v; }, onBody: function (v) { d.body = v; },
        send: function () { mailSend(ctx, m.inboxId, d, m.id); },
        discard: function () { delete _ml.reply[m.id]; _ml.replying = null; EN.app.render(); } }));
    }
    return EN.mailView.letter({ id: m.id, subj: m.subj, from: who, to: "You", when: mailWhen(m), body: m.body, unread: !m.read,
      avatar: fromSystem(m) ? { html: ICON_POST } : null, tools: tools, attach: hasPackage(m) ? pkgBox(m) : null, after: after,
      back: function () { _ml.sel = null; _ml.replying = null; EN.app.render(); } });
  }
  function mailSentView(r, ro) {
    var mail = r.mail || {}, at = timeOf(r.created_at), read = r.status === "read" || !!r.read_at, me = String((mail.from || "")).trim() || "You";
    return EN.mailView.letter({ id: r.id, subj: mail.subj, from: me, to: String(r.persona || "").trim() || "The GM", when: at !== null ? stamp(at) : "", body: mail.body, me: true,
      status: read ? "Seen" : "Not read yet", back: function () { _ml.sel = null; EN.app.render(); },
      tools: ro ? [] : [el("button.btn.sm.ghost", { type: "button", dataset: { post: "delete" }, title: "Delete it from your Sent. The GM keeps theirs.",
        onclick: function () { _ml.sel = null; forget([], [r.id]); } }, "✕ DELETE")] });
  }
  function mailPanel() {
    var ch = store.active(), ro = readOnlyRecord(), ctx = gmContext(ch), post = faceRead(ch).post;
    var D = ctx && EN.chat ? EN.chat.ensure(Object.assign({ needTimes: post.some(function (m) { return m && m.inboxId && !m.at; }) }, ctx)) : null;
    var inbox = post.map(function (m, i) { return { m: m, i: i }; }).filter(function (x) { return x.m && isMail(x.m); });
    var gone = hiddenOf(ch), sent = D ? D.gm.filter(function (r) { return sentMail(r) && !gone[r.id]; }) : [];
    if (!ctx) _ml.writing = false;
    var folder = _ml.folder === "sent" && ctx ? "sent" : "in";
    var n = inbox.filter(function (x) { return !x.m.read; }).length;
    var cur = folder === "in" ? inbox.filter(function (x) { return x.m.id === _ml.sel; })[0] || null : sent.filter(function (r) { return r.id === _ml.sel; })[0] || null;
    if (!cur) { _ml.sel = null; }
    if (!cur || !cur.m || _ml.replying !== cur.m.id) _ml.replying = null;
    var rows = folder === "in"
      ? inbox.map(function (x) { var m = x.m; return { id: m.id, x: x, who: String(m.from || "").trim() || "Unknown node", when: mailWhen(m), subj: m.subj, body: m.body, unread: !m.read, pkg: hasPackage(m) && !m.taken, pkgIcon: ICON_PKG }; })
      : sent.map(function (r) { var mail = r.mail || {}, at = timeOf(r.created_at); return { id: r.id, r: r, post: "sent-letter", who: "To " + (String(r.persona || "").trim() || "The GM"), when: at !== null ? stamp(at) : "", subj: mail.subj, body: mail.body }; });
    var pane;
    if (_ml.writing && ctx && !ro) {
      var d = _ml.draft;
      pane = [EN.mailView.compose({ title: "New letter", to: "The GM, " + (ctx.campaignName || "your campaign"), subj: d.subj, body: d.body, busy: _ml.busy, post: "mail",
        placeholder: "Write to the people who run " + (ctx.campaignName || "your campaign"),
        onSubj: function (v) { d.subj = v; }, onBody: function (v) { d.body = v; },
        send: function () { mailSend(ctx, null, d, null); },
        discard: function () { _ml.writing = false; _ml.draft = { subj: "", body: "" }; EN.app.render(); } })];
    } else if (cur) pane = [folder === "in" ? mailLetter(cur, ro, ctx) : mailSentView(cur, ro)];
    else pane = [el("p.msgr-empty.msgr-pick", { dataset: { post: "nopick" }, text: inbox.length || sent.length ? "Select a letter to read it." : "No letters yet." })];
    // SELECT: letters picked to delete, in the folder showing. A letter on the record comes off it; a sent one is hidden (forget)
    var selecting = _ml.selecting && !ro && rows.length > 0;
    if (!selecting) _ml.selecting = false;
    var select = selecting ? { on: true, picked: _ml.picked,
      onToggle: function (row) { if (_ml.picked[row.id]) delete _ml.picked[row.id]; else _ml.picked[row.id] = true; EN.app.render(); },
      bar: EN.mailView.pickBar({ key: "mail-" + folder, noun: "letter", ids: rows.map(function (r) { return r.id; }), state: _ml,
        del: function (ids) {
          if (ids.indexOf(_ml.sel) !== -1) _ml.sel = null;
          _ml.selecting = false; _ml.picked = {};
          if (folder === "in") forget(ids, []); else forget([], ids);
        },
        done: function () { _ml.selecting = false; _ml.picked = {}; EN.app.render(); } }) } : null;
    return EN.mailView.client({ title: "Mail", folder: folder, sel: _ml.sel, rows: rows, pane: pane, open: !!cur || (_ml.writing && !!ctx), foot: POST_HELP, select: select,
      empty: folder === "in" ? "No letters. What comes with a subject or a package lands here." : "Nothing sent with a subject yet.",
      folders: [{ key: "in", label: "Inbox", count: n }].concat(ctx ? [{ key: "sent", label: "Sent" }] : []),
      onFolder: function (k) { _ml.folder = k; _ml.sel = null; _ml.writing = false; _ml.replying = null; _ml.selecting = false; _ml.picked = {}; EN.app.render(); },
      onOpen: function (row) { if (row.x) mailOpen(row.x, ro, ctx); else { _ml.sel = row.id; _ml.writing = false; EN.app.render(); } },
      actions: selecting ? [] : [
        !ro && ctx ? el("button.btn.sm.primary", { type: "button", dataset: { post: "mail-write" }, title: "A letter to your GM, with a subject", onclick: function () { _ml.writing = true; _ml.sel = null; EN.app.render(); } }, "+ WRITE") : null,
        !ro && rows.length ? EN.mailView.selectButton(function () { _ml.selecting = true; _ml.picked = {}; EN.app.render(); }) : null] });
  }
  function mailUnread(ch) { return faceRead(ch).post.filter(function (m) { return m && isMail(m) && !m.read; }).length; }

  /* ---- the toast (campaigns batch 3) -----------------------------------------
     EN.ui.toast is text only and lasts under two seconds, and this one is a button that has to
     stay long enough to press. The envelope, what came, and a bubble with the unread count. No
     sound. Mail that comes while one is still up joins it, so several at once, or a stack that
     came while the player was away, is one toast. It stands for each piece of mail as
     { lid, from, pkg }, and js/cloud.js holds it back until the desktop is up. */
  var TOAST_MS = 6000;
  var _toast = null;   // { items, timer }
  function dropToast() {
    if (_toast) clearTimeout(_toast.timer);
    _toast = null;
    var box = document.getElementById("post-toast");
    if (box) box.parentNode.removeChild(box);
  }
  function hideToast() {
    var box = document.getElementById("post-toast");
    if (box) box.classList.remove("show");
    if (_toast) clearTimeout(_toast.timer);
    _toast = null;
    // long enough for the slide; under reduced motion there is no slide to wait for, and this is still harmless
    setTimeout(function () { if (!_toast) dropToast(); }, 260);
  }
  /* The way in from outside the tab (the new-mail toast). `from` says whose chat the Messages page opens on Classic: a name opens that
     sender's thread, and reads it, as pressing its chat does; null opens the list of chats; left out, the page is as it was. */
  function openPost(lid, from, toMail) {
    var ch = store.active(), cur = ch && ch.meta ? ch.meta.id : null;
    if (lid && lid !== cur && store.roster()[lid]) store.setActive(lid);
    // a letter (a subject, a package, a notice) is Mail's: the press opens Mail on its inbox
    if (toMail) { _sub = "mail"; _ml.folder = "in"; _ml.sel = null; _ml.writing = false; EN.app.gotoTab("post"); return; }
    _sub = "post";
    if (from === null) { _mg.th = null; _mg.edit = null; }
    else if (typeof from === "string") {
      var now = store.active(), nctx = now ? gmContext(now) : null, all = now ? threadsOf(now, nctx, { chat: true }) : [];
      var nm = from.trim() || "Unknown node", key = gmName(nm) ? "gm" : threadKey(nm);
      var t = all.filter(function (x) { return x.key === key || (x.kind === "player" && x.name.toLowerCase() === nm.toLowerCase()); })[0];
      if (t) mgOpen(t, readOnlyRecord(), nctx); else { _mg.th = null; _mg.edit = null; }
    }
    EN.app.gotoTab("post");
  }
  function recordName(lid) {
    var rec = store.roster()[lid], n = rec && typeof rec.name === "string" ? rec.name.trim() : "";
    return n || "Unnamed Freelancer";
  }
  function toastCopy(items) {
    if (items.length > 1) return items.length + " new on #POST.";
    return (items[0].pkg ? "Package from " : "New on #POST from ") + (items[0].from || "UNKNOWN NODE");
  }
  // mail for a character who isn't open names them, and the press opens them
  function toastFor(items, cur) {
    var seen = {}, lids = [];
    items.forEach(function (x) { if (!seen[x.lid]) { seen[x.lid] = 1; lids.push(x.lid); } });
    if (seen[cur] && lids.length === 1) return "";
    if (lids.length === 1) return "For " + recordName(lids[0]);
    return lids.length === 2 ? "For " + recordName(lids[0]) + " and " + recordName(lids[1]) : "For " + lids.length + " characters";
  }
  // whose letters the toast is about, for the one it opens: a name if they are all from one sender, else null (the list of chats)
  function senderOf(items, lid) {
    var names = {}, n = 0, last = "";
    items.forEach(function (x) {
      if (x.lid !== lid) return;
      var name = String(x.from || "").trim() || "Unknown node", k = name.toLowerCase();
      if (!names[k]) { names[k] = 1; n++; last = name; }
    });
    return n === 1 ? last : null;
  }
  function postToast(items) {
    if (!items || !items.length) return;
    var all = (_toast ? _toast.items : []).concat(items);
    if (_toast) clearTimeout(_toast.timer);
    var ch = store.active(), cur = ch && ch.meta ? ch.meta.id : null;
    var seen = {}, count = 0, target = null;
    all.forEach(function (x) {
      if (x.lid === cur) target = cur;
      if (!seen[x.lid]) { seen[x.lid] = 1; count += unread(store.roster()[x.lid]); }
    });
    if (!target) target = all[0].lid;
    var box = document.getElementById("post-toast"), fresh = !box;
    if (fresh) { box = el("div#post-toast.post-toast", { "aria-live": "polite" }); document.body.appendChild(box); }
    EN.ui.clear(box);
    var under = toastFor(all, cur);
    box.appendChild(el("button.post-toast-btn", { type: "button", title: "Open #POST",
      onclick: function () { dropToast(); openPost(target, senderOf(all, target), all.some(function (x) { return x.lid === target && x.mail; })); } }, [
      el("span.post-toast-ico", { html: ICON_POST }),
      el("span.post-toast-text", null, [
        el("b.post-toast-line", { text: toastCopy(all) }),
        under ? el("span.post-toast-sub", { text: under }) : null
      ]),
      el("span.post-toast-count", { text: String(count), title: count === 1 ? "1 unread" : count + " unread" })
    ]));
    if (fresh) { void box.offsetWidth; }   // drawn once where it starts, so it has somewhere to slide from
    box.classList.add("show");
    _toast = { items: all, timer: setTimeout(hideToast, TOAST_MS) };
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
  // a jump to where a linked row is edited: the ledger panel, or the Stash tab's Bills
  function toLedger(panelKey) {
    _soc = "ledger";   // the Social tab's ledger, from its own Contacts page (18 Nov 2026)
    EN.app.gotoTab("face");
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
      out.push(linkLine([tagChip("BILLS", "var(--danger)", "A debt in the Stash tab's Bills, held by " + (r.holder || "them")),
        el("span", { text: bits.join(" · ") || "a debt" }),
        jumpBtn("BILLS ›", "Edit it in the Stash tab's Bills", toBills)]));
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
    var card = el("div.bgct-card", { dataset: { tour: "contacts-modal" }, role: "dialog", "aria-modal": "true", "aria-labelledby": "bgct-title", tabindex: "-1" }, [
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
      _soc = "contacts"; _ct.q = ""; _ct.kind = "all"; _ct.faction = "";
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
              filed ? el("button.btn.sm.ghost", { title: "Open this contact's full card on the #POST tab", onclick: function () { toSocial(key); } }, "FULL CARD ›") : null,
              EN.ui.armButton("bgct:del:" + ctKey(ch, key), { label: "✕", armedLabel: "REMOVE?",
                title: "Remove this contact", armedTitle: "Click again to remove. It also leaves the #POST tab.",
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
          ? "These are the same cards as #POST › CONTACTS. Open a card there (or press FULL CARD above) to add their #PRINT name, Kind, Faction, Fence, a Tell, notes, and to link the Profiles and Debts that name them."
          : "These cards also live on the #POST tab, which opens once your #PRINT is filed. There, #POST › CONTACTS holds each contact's full card: their #PRINT name, Kind, Faction, Fence, a Tell, notes, and links to the Profiles and Debts that name them." }),
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

  // the author's clipboard, linked figures and envelope, one per Social sub-tab; same [icon,
  // text] convention the Inventory sub-nav uses for Stash, Chrome and Gray Market
  var ICON_LEDGER = '<svg viewBox="0 0 101.83 122.88" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.77,12.82h16.25v10.5h-7.01c-3.13,0-5.72,2.59-5.72,5.72v78.43c0,3.13,2.58,5.72,5.72,5.72h69.8 c3.14,0,5.72-2.58,5.72-5.72V29.04c0-3.14-2.59-5.72-5.72-5.72h-7.01v-10.5h16.25c3.73,0,6.77,3.07,6.77,6.77v96.51 c0,3.71-3.06,6.77-6.77,6.77H6.77c-3.71,0-6.77-3.05-6.77-6.77V19.59C0,15.86,3.05,12.82,6.77,12.82L6.77,12.82z M37.79,95.89 c-2.01,0-3.64-1.63-3.64-3.64c0-2.01,1.63-3.64,3.64-3.64h26.24c2.01,0,3.64,1.63,3.64,3.64c0,2.01-1.63,3.64-3.64,3.64H37.79 L37.79,95.89z M30.03,73.91c-2.01,0-3.64-1.63-3.64-3.64c0-2.01,1.63-3.64,3.64-3.64h41.76c2.01,0,3.64,1.63,3.64,3.64 c0,2.01-1.63,3.64-3.64,3.64H30.03L30.03,73.91z M23.2,51.94c-2.01,0-3.64-1.63-3.64-3.64s1.63-3.64,3.64-3.64h55.44 c2.01,0,3.64,1.63,3.64,3.64s-1.63,3.64-3.64,3.64H23.2L23.2,51.94z M32.4,9.46h7.68C40.73,4.13,45.04,0,50.26,0 c5.19,0,9.47,4.07,10.17,9.35l8.99,0.11c0.63,0,1.13,0.5,1.13,1.13v15.33c0,0.63-0.5,1.13-1.13,1.13h-37 c-0.61,0-1.13-0.5-1.13-1.13V10.59C31.27,9.97,31.78,9.46,32.4,9.46L32.4,9.46L32.4,9.46L32.4,9.46z M46.06,14.1 c0.69,0.95,1.69,1.89,2.74,2.37c0.86,0.26,1.8,0.28,2.67,0.04c1.36-0.63,2.62-2.14,3.2-3.4c0.07-0.36,0.11-0.73,0.11-1.13 c0-2.67-2.05-4.84-4.57-4.84c-2.53,0-4.57,2.17-4.57,4.84C45.64,12.8,45.79,13.51,46.06,14.1L46.06,14.1L46.06,14.1L46.06,14.1z"/></svg>';
  // the author's own Social tab mark (ICON_SOCIAL in app.js), copied verbatim, never redrawn
  var ICON_CONTACTS = '<svg viewBox="0 0 122.88 119.91" fill="currentColor" aria-hidden="true"><path d="M20,52a4.32,4.32,0,0,1-7.79-3.73A52.4,52.4,0,0,1,15,43.09a54.42,54.42,0,0,1,3.4-4.83l.06-.08a55.27,55.27,0,0,1,3.83-4.33,54.44,54.44,0,0,1,4.36-4l0,0a4.33,4.33,0,0,1,3.15-.93,4.27,4.27,0,0,1,2.89,1.56l0,0a4.33,4.33,0,0,1,.93,3.15,4.27,4.27,0,0,1-1.56,2.89h0a44.87,44.87,0,0,0-3.68,3.34A44.45,44.45,0,0,0,20,52ZM8.91,95.49l.25-.19c2.57-1.53,6.46-1.13,9-2.9a5.41,5.41,0,0,0,.47-.91c.24-.54.45-1.13.59-1.53a18.83,18.83,0,0,1-1.54-2.2l-1.56-2.48A4.54,4.54,0,0,1,15.23,83a1.79,1.79,0,0,1,.15-.82,1.44,1.44,0,0,1,.53-.62,1.93,1.93,0,0,1,.38-.19,41.2,41.2,0,0,1-.07-4.46,5.64,5.64,0,0,1,2.83-4.37,8.36,8.36,0,0,1,2.2-1c.5-.14-.42-1.72.09-1.77,2.48-.26,6.49,2,8.21,3.87a6,6,0,0,1,1.53,3.83l-.09,4h0a1.13,1.13,0,0,1,.82.85,3.54,3.54,0,0,1-.43,2.13h0l0,0-1.77,2.93a15.8,15.8,0,0,1-2.18,3,4,4,0,0,0,.23.34,10.37,10.37,0,0,0,1.16,1.5s0,0,0,0c2,1.45,7,1.8,8.94,2.86l.07,0,.24.19a19.11,19.11,0,0,0-1-25.74L37,69.64A19.11,19.11,0,0,0,8.91,95.49ZM23.5,59.65a23.41,23.41,0,0,1,16.61,6.88l.13.14a23.49,23.49,0,0,1-.13,33.09l-.14.13A23.49,23.49,0,1,1,23.5,59.65ZM85.56,96.11c1.91-1.68,6-2.1,8.51-3.58,2.2-1.32,1.82-2.65,1.81-4.83H92.39c-9.06,0-3.09.71-1.86-9.13,1.84-13.9,15.84-13.91,17.91,0,1.32,9.47,7,9.13-1.87,9.13H103c0,2.41-.39,3.64,2.11,5,1.86,1,6.09,1.65,8.12,3.33A19.12,19.12,0,0,0,113,69.5l-.12-.1A19.11,19.11,0,0,0,86,69.28l-.11.12a19.13,19.13,0,0,0-.31,26.71Zm13.82-36.7A23.44,23.44,0,0,1,116,66.29l.12.14A23.48,23.48,0,0,1,116,99.52l-.14.13a23.47,23.47,0,0,1-33.09-.13l-.13-.13a23.48,23.48,0,0,1,.13-33.1l.13-.13a23.44,23.44,0,0,1,16.48-6.75ZM48.72,35.84l.25-.2c2.58-1.52,6.46-1.12,9-2.89a7.53,7.53,0,0,0,.47-.91c.23-.54.45-1.13.58-1.53a20.12,20.12,0,0,1-1.54-2.2l-1.56-2.48A4.54,4.54,0,0,1,55,23.36a1.78,1.78,0,0,1,.15-.81,1.46,1.46,0,0,1,.54-.62,1.5,1.5,0,0,1,.38-.19A38.76,38.76,0,0,1,56,17.28a5.8,5.8,0,0,1,.19-1,6,6,0,0,1,2.64-3.36,8.42,8.42,0,0,1,2.21-1c.49-.14-.42-1.72.09-1.78,2.47-.25,6.48,2,8.21,3.88a6.11,6.11,0,0,1,1.53,3.82l-.1,4h0a1.13,1.13,0,0,1,.82.85,3.54,3.54,0,0,1-.43,2.13h0a.17.17,0,0,1,0,.05l-1.78,2.93a15.38,15.38,0,0,1-2.18,3l.23.34a10.29,10.29,0,0,0,1.16,1.49l0,.05c2,1.45,7,1.8,8.94,2.86l.07,0,.24.19a19.13,19.13,0,0,0-1-25.74L76.82,10a19.11,19.11,0,0,0-28.1,25.85ZM63.31,0A23.41,23.41,0,0,1,79.92,6.88l.13.14a23.47,23.47,0,0,1-.13,33.09l-.13.13A23.49,23.49,0,1,1,63.31,0Zm29,37.29a4.32,4.32,0,0,1,2.4-7.6,4.34,4.34,0,0,1,3.14,1L99.37,32l1.49,1.42c1,1,2,2,2.86,3s1.73,2.06,2.52,3.12,1.59,2.22,2.32,3.38,1.42,2.34,2,3.52l0,.12a4.31,4.31,0,0,1-5.15,6A4.23,4.23,0,0,1,103,50.51c-.52-1-1.1-2-1.71-2.94s-1.27-1.92-1.94-2.81S97.9,42.94,97.12,42s-1.52-1.68-2.3-2.45-1.65-1.55-2.53-2.3ZM76.05,109a4.27,4.27,0,0,1,3.28.23l.08,0a4.33,4.33,0,0,1,2.1,2.45v0a4.31,4.31,0,0,1-2.73,5.42c-1.37.46-2.75.86-4.15,1.21s-2.76.62-4.19.85-2.86.41-4.27.52-2.89.18-4.32.18-2.92-.06-4.38-.18-2.9-.3-4.36-.54-2.92-.55-4.31-.9-2.83-.78-4.19-1.24a4.33,4.33,0,0,1-2.48-2.2,4.28,4.28,0,0,1-.21-3.3,4.34,4.34,0,0,1,2.19-2.48,4.28,4.28,0,0,1,3.3-.21l0,0c1.13.38,2.3.73,3.49,1l0,0c1.16.29,2.33.54,3.49.73h0c1.16.19,2.37.34,3.61.44s2.43.15,3.7.15,2.46-.05,3.64-.15,2.42-.24,3.56-.43h.07c1.16-.19,2.33-.43,3.49-.72s2.32-.62,3.44-1Z"/></svg>';
  /* `opts` is a shell with its own navigation (#GRIDeck P5): { sub } draws that page whatever this tab is on, and { bare }
     leaves out the heading and the three-way switch, which the shell stands in for. With neither, exactly as before. */
  /* THE SOCIAL TAB AND THE #POST TAB (17 Nov 2026, the author's call). Social is the standing ledger alone. #POST is a tab of
     its own, to the left of Social on the rail, with two pages: Messages (the mail, the default) and Contacts. Both tabs are drawn
     here: render() is Social, renderPost() is #POST. The page held in _sub is #POST's ("post" or "mail"), and _soc is Social's ("ledger" or "contacts").
     A shell with its own navigation (#GRIDeck) passes opts = { sub, bare } to render() and gets that page, whichever tab it is. */
  var POST_HEAD = {
    post: ["SECURE COMM CHANNEL", "Every handle gets an address whether it wants one or not. What lands here is work, warnings, and the occasional person who knows too much about where you sleep."],
    mail: ["LETTERS AND PACKAGES", "What comes with a subject line: work orders, receipts, the notices the system sends, and the odd crate. Write to your GM here when it needs one."],
    contacts: ["PEOPLE YOU CAN REACH", "The people who still pick up when you call, and the reasons they do. Half of what a Freelancer can do is who a Freelancer can reach."]
  };
  function heading(title, tail, help) {
    return el("div", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", margin: "0 0 2px", letterSpacing: ".04em" },
        html: title + " <span style='font-family:var(--disp);font-size:12px;color:var(--text3);letter-spacing:.18em'>// " + tail + "</span>" }),
      el("p.help", { style: { margin: 0, maxWidth: "820px" }, text: help })
    ]);
  }
  // the page #POST is on: Chat unless Mail was asked for. Contacts and the ledger are the Social tab's (socialPage)
  function postPage() { return _sub === "mail" ? "mail" : "post"; }
  function socialPage() { return _soc === "contacts" ? "contacts" : "ledger"; }
  function renderPost(mount) {
    var ch = store.active();
    EN.ui.clear(mount);
    if (!ch) { mount.appendChild(el("p.help", { text: "No Freelancer loaded." })); return; }
    var page = postPage(), H = POST_HEAD[page];
    var nMail = mailUnread(ch), nChat = Math.max(0, unread(ch) - nMail) + chatUnread();
    function subTab(key, label) {
      return el("button.btn.sm" + (page === key ? ".primary" : ""),
        { dataset: { post: "page-" + key }, onclick: function () { _sub = key; EN.app.render(); } },
        [el("span", { html: label[0] }), document.createTextNode(" " + label[1])]);
    }
    var blocks = [
      heading("<span style='color:var(--accent)'>#POST</span>", H[0], H[1]),
      /* Two pages of one tab: Chat and Mail (Contacts moved to Social, 18 Nov 2026). Deliberately NOT sticky like the Inventory's bar,
         which has to carry the wallets; two buttons do not earn a pinned strip on a phone (#GRIDroid lays them out as equal cells,
         theme.css .face-bar). */
      el("div.row.wrap.face-bar", { style: { gap: "6px", marginBottom: "12px" } }, [
        subTab("post", [ICON_CHAT, "CHAT" + (nChat ? " \u00b7 " + nChat : "")]),
        subTab("mail", [ICON_POST, "MAIL" + (nMail ? " \u00b7 " + nMail : "")])
      ])
    ];
    // Each page has a wrapper of its own. Neither is .post-sub: theme.css draws the '98 mail client off that class, around the
    // inbox this page used to be, and it would rebuild either page as one.
    blocks.push(page === "post" ? el("div.msgr-sub", null, [messengerPanel()]) : el("div.msgr-sub", null, [mailPanel()]));
    mount.appendChild(el("div", null, blocks));
    if (page === "post") mgAfter(mount);
  }
  function render(mount, opts) {
    var ch = store.active();
    EN.ui.clear(mount);
    if (!ch) { mount.appendChild(el("p.help", { text: "No Freelancer loaded." })); return; }
    var blocks = [];
    var page = (opts && opts.sub) || socialPage(), bare = !!(opts && opts.bare);
    var onPost = page === "post", onContacts = page === "contacts";
    /* The Social tab has two pages (18 Nov 2026): the ledger and Contacts, which came over from #POST. One heading, then the
       switch, as #POST draws its own. A shell that draws its own navigation (bare) gets the page alone. */
    if (!bare && !onPost && page !== "mail") {
      blocks.push(onContacts ? heading("MY <span style='color:var(--accent)'>SOCIALS</span>", POST_HEAD.contacts[0], POST_HEAD.contacts[1])
        : heading("MY <span style='color:var(--accent)'>SOCIALS</span>", "SOCIAL PRESSURE · FACTION STANDING",
          "Some jobs end in gunfire. More end in a room: two chairs, two people working the same problem until one gives ground. This is the ledger that room leaves behind."));
      blocks.push(el("div.row.wrap.face-bar", { style: { gap: "6px", marginBottom: "12px" } }, [["ledger", ICON_LEDGER, "STANDING"], ["contacts", ICON_CONTACTS, "CONTACTS"]].map(function (x) {
        // social-contacts is the guided tour's last anchor (data/tour_creation.js)
        return el("button.btn.sm" + (page === x[0] ? ".primary" : ""), { type: "button", "data-ro-keep": "1", dataset: { tour: "social-" + x[0], soc: x[0] },
          onclick: function () { _soc = x[0]; EN.app.render(); } }, [el("span", { html: x[1] }), document.createTextNode(" " + x[2])]);
      })));
    }
    if (page === "mail") {
      // a shell that has no mail page of its own gets this one
      blocks.push(el("div.msgr-sub", null, [mailPanel()]));
      mount.appendChild(el("div", null, blocks)); return;
    }
    if (onPost) {
      // a shell that has no messenger of its own to show gets this one (see renderPost)
      blocks.push(el("div.msgr-sub", null, [messengerPanel()]));
      mount.appendChild(el("div", null, blocks)); mgAfter(mount); return;
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

  return { render: render, renderPost: renderPost, postPage: postPage, personaTick: personaTick, unread: unread, postToast: postToast, closeToast: dropToast, openPost: openPost, chatUnread: chatUnread,
           bgContactsDialog: bgContactsDialog, bgContactsSummary: bgContactsSummary, bgContactsTarget: BG_CONTACTS,
           /* Which of this tab's pages is up ("ledger", "contacts" or "post"), read and set from outside
              (#GRIDeck P0, 14 Nov 2026): a second shell shows Standing or #POST by it, so there is one answer to
              "where is the player" and openPost, the #POST toast and the tour keep working as they are. State
              only; the caller renders. */
           // the author's envelope, clipboard and linked figures, for a shell that draws its own navigation
           icons: { post: ICON_POST, chat: ICON_CHAT, ledger: ICON_LEDGER, contacts: ICON_CONTACTS },
           // the Social tab's page ("ledger" or "contacts"); #POST's is postPage()
           sub: function () { return socialPage(); },
           // "ledger" and "contacts" are the Social tab's pages, "post" and "mail" #POST's
           setSub: function (k) { if (k === "ledger" || k === "contacts") _soc = k; else if (k === "post" || k === "mail") _sub = k; },
           socialPage: socialPage,
           // the rules side of this tab, by name and with no copies: they write the active record
           core: { threads: threadsOf, threadKey: threadKey, sendGm: sendGm, takeIt: takeIt, newContact: newContact, ctSet: ctSet,
                   /* P5 (15 Nov 2026), what #GRIDeck's messenger and Standing read and write: the ledger as it is read and its
                      one writer, the ladders the trackers pick from, the mail's own helpers, and the letter to the GM. */
                   read: faceRead, write: fset, standings: STANDINGS, states: STATES, debtDirs: DEBTDIRS, kinds: KINDS,
                   newMessageId: pid, postHelp: POST_HELP, hasPackage: hasPackage, readOnly: readOnlyRecord, fromSystem: fromSystem,
                   taking: function (id) { return !!_taking[id]; }, pkgIcon: ICON_PKG,
                   gmContext: gmContext, gmDraftFor: gmDraftFor, gmDraft: function () { return _gmDraft; }, dropGmDraft: function () { _gmDraft = null; },
                   sentToGm: function (ctx) { var D = EN.chat ? EN.chat.ensure(ctx) : null; return D ? D.gm : []; },
                   personaSources: personaSources } };
})();
