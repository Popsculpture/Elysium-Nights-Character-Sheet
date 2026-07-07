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
  var _open = {};   // collapse state for reference sections

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
    return f;
  }
  function faceRead(ch) {
    var f = ch.face || {};
    return { profiles: f.profiles || [], factions: f.factions || [], cred: f.cred || [], heat: f.heat || [], debts: f.debts || [] };
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
        ["Critical", "Hard Burn", "The scene turns against you. Exposure, a Profile, a posture shift."]
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
    blocks.push(el("div", { style: { marginBottom: "14px" } }, [
      el("h1", { style: { fontSize: "22px", margin: "0 0 2px", letterSpacing: ".04em" },
        html: "THE <span style='color:var(--accent)'>FACE</span> <span style='font-family:var(--disp);font-size:12px;color:var(--text3);letter-spacing:.18em'>// SOCIAL PRESSURE · FACTION STANDING</span>" }),
      el("p.help", { style: { margin: 0, maxWidth: "820px" }, text: "Some jobs end in gunfire. More end in a room: two chairs, two people working the same problem until one gives ground. This is the ledger that room leaves behind." })
    ]));
    blocks.push(profilesPanel());
    blocks.push(el("div", { style: { marginTop: "14px" } }, [factionsPanel()]));
    blocks.push(el("div.modgrid6", { style: { marginTop: "14px" } }, [
      el("div", { style: { gridColumn: "span 3", minWidth: 0 } }, [credPanel()]),
      el("div", { style: { gridColumn: "span 3", minWidth: 0 } }, [heatPanel()])
    ]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [debtsPanel()]));
    blocks.push(el("div", { style: { marginTop: "14px" } }, [referencePanel()]));
    mount.appendChild(el("div", null, blocks));
  }

  return { render: render };
})();
