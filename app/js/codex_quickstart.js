/* ===========================================================================
   ELYSIUM NIGHTS · Codex chapter: The Fifth Flavor (Quick-Start, Game Master)
   The Game Master section of the Quick-Start Rules (EN1003): the job, The
   Fifth Flavor (RUN / THE JOB), and RUN / THE TABLE's Running It Solo and
   GM's Card, as one Admin Codex chapter. Every word is read from
   EN.quickstart.job (data/quickstart_job.js), never retyped here:
     gm-quickstart  "The Fifth Flavor", order 280 (after Gear Catalog, 270),
                    audience "gm": rendered, searchable and peekable on the
                    Admin desktop only, never the Freelancer Codex.

   ONLY WHILE THE SETTING IS ON. Every panel's `when` asks
   EN.launch.quickstart() (the device's Quick-Start setting, data/launch.js),
   and that its section is in the data. Off, the chapter has no panel, so it
   draws nothing, links to it fall back to plain text and search finds none
   of it. js/quickstart.js calls EN.codexView.refresh() when the setting
   flips, which rebuilds the index.

   PANELS, in order (id "qs-" + the data section's key), AND THEIR ANCHORS
   Each data block that is an entry is anchored by the slug of its name
   (codex.js's slug rule; a repeat in one panel gets -2):
     qs-overview   The Fifth Flavor: game-master-only, at-a-glance,
                   the-shape-of-it, scaling
     qs-desk       Scene 1: The Desk: the-posting, read-aloud,
                   odette-delaune, the-terms, what-legwork-turns-up,
                   cassia-moor, restock, nalo-fenwick, kettle
     qs-pumphouse  Scene 2: The Pump House: read-aloud,
                   hollow-bend-pump-station-4, the-midnight-cycle, undertow,
                   how-the-approaches-land, the-sit-down-filled-in,
                   where-it-lands, if-it-goes-sideways, silt-the-runner,
                   the-intake-tunnel, the-draw
     qs-plant      Scene 3: The Plant: read-aloud,
                   the-night-minute-by-minute,
                   fullwell-bottling-room-by-room, one entry per room key
                   (t-treatment-and-intake, e-electrical-room, ...,
                   x-qa-lab-and-formula-server, the-yard, the-roof) and
                   the-washdown-bot, the-parts-cage, the-palletizer,
                   the-underlings, the-catwalk
     qs-ways       Scene 3: Ways In and the File: the-ways-in,
                   the-no-heat-clause, way-in, into-the-lab, the-network,
                   getting-the-file, ways-to-the-file, ways-out, salvage,
                   hazards
     qs-alarm      Scene 3: People and the Alarm: the-line-workers,
                   marisol-tan, forklift-jerry, the-on-call-tech, running-it,
                   how-the-alarm-climbs, why-quill-waits, the-response-clock,
                   when-it-goes-wrong, optional-machine-twelve
     qs-handouts   Scene 3: Handouts: the-breaker-schedule,
                   the-retain-fridge-and-the-whiteboard,
                   the-break-room-corkboard
     qs-nightshift Scene 3: The Night Shift: who-s-on-shift, tomasz-quill,
                   the-riot-troopers, running-the-fight
     qs-outback    Scene 4: Out the Back: read-aloud, the-setup,
                   fullwell-security-sedan, the-lead-track, the-chase-check,
                   the-route, the-hollow-bend-ramp, the-two-endings,
                   the-traffic-drone, stalemates-sumpside
     qs-payday     Scene 5: Payday: read-aloud, the-file, the-choice,
                   who-s-the-client, what-it-leaves, loose-ends,
                   after-the-run
     qs-solo       Running It Solo: the-budget, a-second-pair-of-hands,
                   scene-by-scene, going-down-alone
     qs-card       Quick-Start GM's Card: dcs-on-the-fly, d20-margin,
                   dice-pools, the-round, the-room, response-clock, nodes,
                   chases, the-sit-down, who-s-at-the-table
   Panel titles are Codex pointer terms, so none is a phrase other chapters
   print: the Night Shift panel is "Scene 3: The Night Shift" (Hazards has a
   gang called The Night Shift) and the card is "Quick-Start GM's Card" (the
   Toolkit's own card is "The GM's Card").

   THREATS. The booklet sends the fights to its Threats page; here a threat's
   printed name links to its Bestiary entry, which data/quickstart_threats.js
   adds under the names below (the author renamed two, "(Quick-Start)", so
   they never shadow the Toolkit's). The link label stays the booklet's
   wording. The anchor is threatAnchor(name): the Bestiary panel of
   codex_gm_threats.js, gmt-bestiary, and the slug of the entry's name. Where
   that does not resolve the kit prints the label as plain text.

   RULE LINKS go through the kit's linkify (chapter and panel titles, the
   other files' aliases, condition names) plus the terms below, for this
   chapter only: nothing here calls EN.codexView.terms(), so turning the
   setting on never changes another chapter's links.
   The API is documented in the header of app/js/codex.js. ES5. No em or en
   dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;
  var CV = EN.codexView, el = EN.ui.el;

  function slug(s) {
    if (CV.slug) return CV.slug(s);
    return String(s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function job() { return (EN.quickstart && EN.quickstart.job) || null; }
  function section(key) {
    var j = job();
    return j ? (j.sections || []).filter(function (s) { return s && s.key === key; })[0] || null : null;
  }

  /* ---- threats: the booklet's wording, the Bestiary entry it means ---------- */
  var BESTIARY_PANEL = "gmt-bestiary";
  function threatAnchor(name) { return BESTIARY_PANEL + "/" + slug(name); }
  var THREATS = {
    "Sump Rat Pump Crew": "Sump Rat Pump Crew",
    "Undertow of the Quiet Sump": "Undertow of the Quiet Sump",
    "Corpsec Officers": "Corpsec Officer (Quill, Doan, Pryce)",
    "Corpsec Officer": "Corpsec Officer (Quill, Doan, Pryce)",
    "Riot Troopers": "Riot Trooper (Quick-Start)",
    "Riot Trooper": "Riot Trooper (Quick-Start)",
    "Spotter Drone": "Spotter Drone (Quick-Start)",
    "Forklift Jerry": "Forklift Jerry",
    "Bystander": "Bystander"
  };
  // the label a Bestiary name prints under: the booklet's own wording
  function threatLabel(name) { return String(name).replace(/\s*\(Quick-Start\)$/, ""); }

  /* ---- terms for every block of this chapter --------------------------------
     Matched exactly as written, ahead of the global table, for one call each. */
  var RULES = {
    // play rules the job names
    "Friction": "so-friction",
    "Their Turf": "so-floor/their-turf",
    "Time Pressure": "so-floor/time-pressure",
    "Snag Dice": "rz-edge", "Snag Die": "rz-edge",
    "Dice Pool": "rz-pool",
    "Pool Margin": "rz-margin", "d20 Margin": "rz-margin",
    "Stalemate": "vc-chase/stalemate",
    "Heavy cover": "ref-cover/cover-material-table", "Average cover": "ref-cover/cover-material-table",
    "Fragile cover": "ref-cover/cover-material-table", "Average material": "ref-cover/cover-material-table",
    "heavily obscured": "ref-cover/obscurement",
    "falling damage": "mv-fall",
    "Cipher Save": "gd-nodes/node-tiers", "Cipher Saves": "gd-nodes/node-tiers",
    "Standard Firewalls": "gd-nodes/firewalls", "Standard Firewall": "gd-nodes/firewalls",
    "Basic IC": "gd-ic", "Advanced IC": "gd-ic",
    // GM rules
    "Hard Contract": "gmy-pay/contract-pay",
    "Major Milestone": "gmy-pay/milestones-and-pacing",
    "Fair Fight": "gme-budget", "Milk Run": "gme-budget",
    "response clock": "gme-security",
    "Morale": "gmt-conventions/morale",
    // this chapter's own entries
    "Scaling": "qs-overview/scaling",
    "The Draw": "qs-pumphouse/the-draw",
    "The No-Heat Clause": "qs-ways/the-no-heat-clause",
    "Getting the File": "qs-ways/getting-the-file",
    "a way in": "qs-ways/way-in",
    "Hazards": "qs-ways/hazards",
    "The Presses": "qs-ways/hazards", "The Syrup Floor": "qs-ways/hazards", "The Foam": "qs-ways/hazards",
    "The Washdown": "qs-ways/hazards", "The Palletizer": "qs-ways/hazards", "The Underlings": "qs-ways/hazards",
    "The Pallet Canyon": "qs-ways/hazards", "The Lab Seal": "qs-ways/hazards",
    "The On-Call Tech": "qs-alarm/the-on-call-tech",
    "Dispatch lines": "qs-alarm/the-response-clock",
    "Sumpside table": "qs-outback/stalemates-sumpside",
    "the route": "qs-outback/the-route",
    "Salvage": "qs-ways/salvage"
  };
  // a block whose words mean one entry where other blocks mean another
  var BLOCK_TERMS = {
    "E, Electrical room": { "Handout": "qs-handouts/the-breaker-schedule" },
    "V, Break room": { "Handout": "qs-handouts/the-break-room-corkboard" },
    "The No-Heat Clause": { "Scene 4": "qs-outback/the-traffic-drone" }
  };
  var BASE = (function () {
    var t = {};
    Object.keys(RULES).forEach(function (k) { t[k] = RULES[k]; });
    Object.keys(THREATS).forEach(function (k) { t[k] = threatAnchor(THREATS[k]); });
    return t;
  })();
  function termsFor(b) {
    var extra = b && b.name ? BLOCK_TERMS[b.name] : null;
    if (!extra) return BASE;
    var t = {};
    Object.keys(BASE).forEach(function (k) { t[k] = BASE[k]; });
    Object.keys(extra).forEach(function (k) { t[k] = extra[k]; });
    return t;
  }

  /* ---- the block kinds (data/quickstart_job.js documents them) -------------- */
  function aloudBox(name, text, tag) {
    return el("div.feature", null, [
      el("h4", null, [document.createTextNode(name || "Read Aloud"), el("span.src", { text: tag || "READ ALOUD" })]),
      el("p", { style: { fontStyle: "italic" }, text: text || "" })
    ]);
  }
  function handoutBox(h) {
    return el("div.feature", null, [
      el("h4", null, [document.createTextNode(h.name || "Handout"), el("span.src", { text: "HANDOUT" })]),
      el("p", { style: { fontFamily: "var(--mono)", fontSize: "12.5px", whiteSpace: "pre-wrap" }, text: (h.lines || []).join("\n") })
    ]);
  }
  function prose(K, text, lo) { return text ? K.proseBlock(text, lo) : null; }
  function table(K, b, lo) {
    var opts = b.plain ? { linkify: false } : lo;
    return el("div", { style: { overflowX: "auto" } }, [K.refTable(b.columns || [], b.rows || [], b.strong || [], opts)]);
  }
  function card(K, b, lo) {
    var head = [document.createTextNode(b.name)];
    if (b.tag) head.push(el("span.src", { text: b.tag }));
    var kids = [el("h4", null, head)];
    if (b.aside) kids.push(el("p", { style: { fontStyle: "italic", margin: "0 0 4px" }, text: b.aside }));
    if (b.print) kids.push(el("p", { style: { fontStyle: "italic", margin: "0 0 4px" }, text: "#PRINT: " + b.print }));
    if ((b.lines || []).length) {
      var p = el("p");
      K.linkify(p, b.lines.map(function (l) { return "**" + l[0] + ":** " + l[1]; }).join("\n"), lo);
      kids.push(p);
    }
    if (b.text) kids.push(el("div", { style: { marginTop: "6px" } }, [K.proseBlock(b.text, lo)]));
    return K.entry(b.slug || null, b.name, [el("div.feature", null, kids)]);
  }
  function block(K, b) {
    if (!b || !b.kind) return null;
    var lo = { conditions: true, terms: termsFor(b) };
    switch (b.kind) {
      case "prose": return prose(K, b.text, lo);
      case "sub": return K.subTitle(b.name);
      case "note": return K.note(b.text, lo);
      case "map": return K.note(b.text);
      case "aloud": return K.entry(b.slug || slug(b.name || "Read Aloud"), b.name || "Read Aloud", [aloudBox(b.name, b.text, b.tag)]);
      case "rule": return K.ruleBlock(b.name, b.text, b.tag || null, { conditions: true, terms: lo.terms, slug: b.slug });
      case "card": return card(K, b, lo);
      case "section":
        return K.entry(b.slug || null, b.name, [
          K.subTitle(b.name), prose(K, b.text, lo),
          b.aloud ? aloudBox("Read Aloud", b.aloud) : null,
          b.handout ? handoutBox(b.handout) : null,
          prose(K, b.after, lo)
        ]);
      case "table":
        return K.entry(b.slug || null, b.name, [K.subTitle(b.name), prose(K, b.lead, lo), table(K, b, lo), prose(K, b.after, lo)]);
      case "handout":
        return K.entry(b.slug || null, b.name, [K.subTitle(b.name), prose(K, b.lead, lo), handoutBox({ name: b.name, lines: b.lines })]);
      case "threats":
        return K.seeAlso(b.lead || "Stat blocks in the Bestiary:", (b.names || []).map(function (n) { return [threatAnchor(n), threatLabel(n)]; }));
    }
    return null;
  }

  /* ---- the chapter ------------------------------------------------------------ */
  var PANELS = [
    ["overview", "The Fifth Flavor"],
    ["desk", "Scene 1: The Desk"],
    ["pumphouse", "Scene 2: The Pump House"],
    ["plant", "Scene 3: The Plant"],
    ["ways", "Scene 3: Ways In and the File"],
    ["alarm", "Scene 3: People and the Alarm"],
    ["handouts", "Scene 3: Handouts"],
    ["nightshift", "Scene 3: The Night Shift"],
    ["outback", "Scene 4: Out the Back"],
    ["payday", "Scene 5: Payday"],
    ["solo", "Running It Solo"],
    ["card", "Quick-Start GM's Card"]
  ];
  function panel(key, title, i) {
    var S0 = section(key);
    return {
      id: "qs-" + key, title: (S0 && S0.title) || title, order: (i + 1) * 10,
      tag: function () { var S = section(key); return (S && S.tag) || ""; },
      // only while the device's Quick-Start setting is on (and the section is in the data)
      when: function () { return !!(EN.launch && EN.launch.quickstart && EN.launch.quickstart()) && !!section(key); },
      build: function (ctx, K) {
        var S = section(key);
        return S ? (S.blocks || []).map(function (b) { return block(K, b); }) : [];
      }
    };
  }

  EN.codexView.register({ id: "gm-quickstart", title: "The Fifth Flavor", order: 280, audience: "gm",
    panels: PANELS.map(function (p, i) { return panel(p[0], p[1], i); }) });
})();
