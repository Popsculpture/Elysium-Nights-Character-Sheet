/* ===========================================================================
   ELYSIUM NIGHTS · Codex chapters: Heat, Scenes, People, Paying the Crew (Game Master)
   The reference half of four Admin tabs, as Codex chapters. The tabs keep
   their working tools (the Heat check, the trackers, the rollers, the
   Payroll writer) and link here for the rules; every word below is read
   from the GM data files, never retyped:
     gm-heat    "Heat", order 230       EN.gmBook.heat     (data/gm_heat.js)
     gm-scenes  "Scenes", order 240     EN.gmBook.scenes   (data/gm_scenes.js)
     gm-people  "People", order 250     EN.gmBook.people   (data/gm_people.js)
     gm-pay     "Paying the Crew", 260  EN.gmBook.payroll  (data/gm_payroll.js)
   All four are audience "gm": rendered, searchable and peekable on the Admin
   desktop only. The API is documented in the header of app/js/codex.js.

   PANELS AND THE ANCHORS THE TABS LINK TO
     gmx-check     The Heat Check: the chapter's opening, the check, and one
                   entry per guideline (slug of its name)
     gmx-ladder    The Ladder: one entry per band, slug = the band key
                   (file, eyes, interference, team, order)
     gmx-events    Heat Events: one entry per band, slug = the band key
     gmx-sources   By Source: one entry per source, slug = the source key
     gmx-bounty    The Bounty: the-price, the-price-by-caliber, who-takes-it,
                   taking-it-down
     gmx-cooling   Cooling Off: one entry per method (lie-low, data-scrub,
                   bribe, legal-scrub, intervention, a-bigger-fish)
     gms-sitdown   Sit-Down Rules       gms-chase   Chase Rules
     gms-incursion Incursion Rules (claims-and-salvage, filing, holding-it,
                   salvage, the-spectacle, private-ground among its entries)
     gmp-quickbuild NPC Quick-Build (the-contact-card, the-book-s-example)
     gmp-resolve   Resolve by Role: one entry per tier, slug = the tier key
     gmp-profiles  Their Profile of You
     gmy-pay       Paying the Crew (contract-pay, what-moves-the-number,
                   bounties, salvage-and-parts, experience,
                   milestones-and-pacing, the-other-ledger, paying-for-it,
                   payday-in-the-book-s-order)

   SECRET GM MATERIAL NEVER ENTERS THE CODEX. EN.gmBook.heat.gmOnly (the
   Watchfire's hidden hashtag Heat, Octothorpe) is never read here; it stays
   on the Heat tab, behind its own GM ONLY box.

   THE PLAYER RULES THESE PANELS LEAN ON are Codex chapters of their own since
   Phase 2 (Social Pressure & Faction Standing, so-; the chase panels of
   Vehicles & Economy, vc-; Flow Disturbances, fl-dist). Their names link
   through the aliases those files register, and the Sit-Down and Chase panels
   end on links to the exact entries (Postures, the Floor, the Social Fallout
   table, Lead and its margins, Pursuit Escalation).
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;
  var el = EN.ui.el;

  /* ---- the books ------------------------------------------------------------ */
  function book(k) { return (EN.gmBook && EN.gmBook[k]) || null; }
  function H() { return book("heat"); }
  function S() { return book("scenes"); }
  function P() { return book("people"); }
  function Y() { return book("payroll"); }
  // a dotted path under EN, through the Scenes data file's own resolver
  function ref(path) { var s = S(); return (s && typeof s.ref === "function") ? s.ref(path) : null; }
  function byKey(arr, k) { return (arr || []).filter(function (x) { return x && x.key === k; })[0] || null; }
  function rowAt(ptr) { var a = ptr ? ref(ptr.ref) : null; return Array.isArray(a) ? byKey(a, ptr.rowKey) : null; }
  // "WHAT IT COSTS" as a run-in label: "What it costs"
  function runIn(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }
  // a run-in name the data prints with its closing stop ("The price.") as a heading
  function head(s) { return String(s || "").replace(/[.:]\s*$/, ""); }
  function stop(s) { s = String(s || "").replace(/\s+$/, ""); return !s || /[.!?]["')]?$/.test(s) ? s : s + "."; }
  function paras(a) { return (a || []).filter(Boolean).join("\n"); }

  /* Links after a block's own text: " Lead A, B." with each a Codex link. The
     anchors are this chapter's or another chapter's; K.link prints the label
     as plain text when one does not resolve on this desktop. */
  function linkLine(K, lead, list, style) {
    var p = el("p", { style: style || { margin: "0 0 8px", fontSize: "12.5px", color: "var(--text3)" } });
    p.appendChild(document.createTextNode(lead + " "));
    list.forEach(function (it, i) {
      if (i) p.appendChild(document.createTextNode(i === list.length - 1 ? " and " : ", "));
      p.appendChild(K.link(it[0], it[1]));
    });
    p.appendChild(document.createTextNode("."));
    return p;
  }
  function addLinks(node, K, lead, list) {
    var p = node && node.querySelector ? node.querySelector("p") : null;
    if (!p) return node;
    p.appendChild(document.createTextNode("\n" + lead + " "));
    list.forEach(function (it, i) {
      if (i) p.appendChild(document.createTextNode(i === list.length - 1 ? " and " : ", "));
      p.appendChild(K.link(it[0], it[1]));
    });
    p.appendChild(document.createTextNode("."));
    return node;
  }

  /* ======================================================================
     HEAT, from EN.gmBook.heat. Never B.gmOnly.
     ====================================================================== */
  function hasHeat() { return !!H(); }
  var heatChapter = { id: "gm-heat", title: "Heat", order: 230, audience: "gm", panels: [
    { id: "gmx-check", title: "The Heat Check", order: 10, when: hasHeat,
      tag: function () { var B = H(); return B && B.check ? String(B.check.die).toUpperCase() + " PER SOURCE · EACH DOWNTIME" : ""; },
      build: function (ctx, K) {
        var B = H(), C = B.check;
        return [
          K.proseBlock(paras(B.intro)),
          K.subTitle(C.name),
          K.proseBlock(paras(C.paragraphs)),
          K.subTitle(head(C.guidelinesLead)),
          (C.guidelines || []).map(function (g) { return K.ruleBlock(head(g.name), g.text); })
        ];
      } },
    { id: "gmx-ladder", title: "The Ladder", tag: "WHAT EACH BAND SENDS", order: 20, when: hasHeat, build: function (ctx, K) {
      var L = H().ladder, cols = L.columns || [];
      return [
        K.proseBlock(L.intro),
        (L.rows || []).map(function (r) {
          return K.ruleBlock(r.phbSays, r.sends + "\n" + runIn(cols[3]) + ": " + r.fight, cols[0] + " " + r.heat, { slug: r.key });
        }),
        K.proseBlock(paras(L.after))
      ];
    } },
    { id: "gmx-events", title: "Heat Events", order: 30, when: hasHeat,
      tag: function () { var B = H(); return B && B.events ? String(B.events.die).toUpperCase() + " BY BAND" : ""; },
      build: function (ctx, K) {
        var E = H().events;
        return [
          K.proseBlock(E.intro),
          (E.bands || []).map(function (b) {
            return K.ruleBlock(b.title, (b.rows || []).map(function (r) { return r.n + ". " + r.text; }).join("\n"),
              String(E.die).toUpperCase(), { slug: b.key });
          })
        ];
      } },
    { id: "gmx-sources", title: "By Source", tag: "WHO COMES, AND HOW", order: 40, when: hasHeat, build: function (ctx, K) {
      var So = H().sources, cols = So.columns || [];
      return [
        K.proseBlock(So.intro),
        (So.rows || []).map(function (r) {
          return K.ruleBlock(r.name, runIn(cols[1]) + ": " + r.how + "\n" + runIn(cols[2]) + ": " + stop(r.sends), null, { slug: r.key });
        })
      ];
    } },
    { id: "gmx-bounty", title: "The Bounty", order: 50, when: hasHeat,
      tag: function () { var B = H(); return B && B.bounty ? "POSTED AT HEAT " + B.bounty.postsAt : ""; },
      build: function (ctx, K) {
        var B = H().bounty;
        return [
          K.proseBlock(B.text),
          K.ruleBlock(head(B.price.name), B.price.text),
          K.entry("the-price-by-caliber", "The price by Caliber", [
            K.subTitle("The price by Caliber"),
            K.refTable(B.columns, (B.rows || []).map(function (r) { return [String(r.caliber), r.countsAs, r.kill, r.alive]; }), [0]),
            K.proseBlock(paras(B.after))
          ]),
          K.ruleBlock(head(B.whoTakesIt.name), B.whoTakesIt.text),
          K.ruleBlock(head(B.takingItDown.name), B.takingItDown.text)
        ];
      } },
    { id: "gmx-cooling", title: "Cooling Off", order: 60, when: hasHeat,
      tag: function () { var B = H(); return B && B.cooling ? (B.cooling.rows || []).length + " WAYS DOWN" : ""; },
      build: function (ctx, K) {
        var C = H().cooling, cols = C.columns || [];
        return [
          K.proseBlock(C.intro),
          (C.rows || []).map(function (r) {
            var node = K.ruleBlock(r.name, runIn(cols[1]) + ": " + r.costs + "\n" + runIn(cols[2]) + ": " + r.does);
            // Lie low asks for the lifestyle to be paid: the player rule it means
            if (r.key === "lieLow") addLinks(node, K, "Lifestyle:", [["ref-economy/lifestyle-costs", "Lifestyle Costs"]]);
            if (r.key === "legalScrub") addLinks(node, K, "Running it:", [["gms-sitdown", "Sit-Down Rules"]]);
            return node;
          }),
          K.proseBlock(paras(C.after))
        ];
      } }
  ] };

  /* ======================================================================
     SCENES, from EN.gmBook.scenes (and the files its refs point at). The
     three Reference panels of the Scenes tab.
     ====================================================================== */
  function hasScenes() { return !!S(); }
  var scenesChapter = { id: "gm-scenes", title: "Scenes", order: 240, audience: "gm", panels: [
    { id: "gms-sitdown", title: "Sit-Down Rules", tag: "RESOLVE · PRESSURE · THE FLOOR", order: 10, when: hasScenes, build: function (ctx, K) {
      var B = S().sitdown, kids = [];
      kids.push(K.proseBlock(B.intro));
      // where the rules live: Social Pressure and Faction Standing, the social chapter (so-), linked by its title
      kids.push(K.note(B.home));
      kids.push(K.entry("results", "Results", [
        K.subTitle("Results"),
        K.refTable(["Result", "Pressure", "Also"], (B.results || []).map(function (r) { return [r.name, String(r.pressure), r.also || ""]; }), [0]),
        linkLine(K, "Each result is its Dice Pool margin in", [["rz-margin", "Success Margin & Consequence"]]),
        linkLine(K, "Social Fallout:", [["so-fallout", "Social Fallout Table"], ["rz-social/social-fallout-rule", "Social Fallout Rule"]])
      ]));
      if (B.postures) {
        // the full list of Postures is the social chapter's (so-postures)
        var Po = B.postures;
        kids.push(addLinks(K.ruleBlock("Postures", Po.rule + "\nThe book names " + (Po.named || []).map(function (p) { return p.name; }).join(", ") + "." +
          (Po.named || []).filter(function (p) { return p.text; }).map(function (p) { return " " + p.text; }).join("")),
          K, "Every Posture:", [["so-postures", "Postures"]]));
      }
      kids.push(addLinks(K.ruleBlock("Resolve", B.bestiaryResolve), K, "Who sits at each tier:",
        [["gmp-resolve", "Resolve by Role"], ["gmp-profiles", "Their Profile of You"]]));
      if (B.criticalFailure) kids.push(K.ruleBlock("Critical Failure", B.criticalFailure.domain + ": " + B.criticalFailure.text));
      var scrub = rowAt(B.legalScrub);
      if (scrub) {
        kids.push(addLinks(K.ruleBlock("A Sit-Down that clears Heat", scrub.name + ". " + stop(scrub.costs) + " " + stop(scrub.does)),
          K, "In Cooling Off:", [["gmx-cooling/legal-scrub", scrub.name]]));
      }
      var won = rowAt(B.milestone);
      if (won) {
        kids.push(addLinks(K.ruleBlock("A Sit-Down won", stop(won.text) + " A " + (won.kind === "major" ? "Major" : "Minor") + " Milestone."),
          K, "See", [["gmy-pay/milestones-and-pacing", "Milestones and Pacing"]]));
      }
      // the player-facing rules this panel runs, entry by entry, in the social chapter
      kids.push(K.seeAlso("The book's Sit-Down:", [["so-sitdown", "The Sit-Down"], ["so-plays", "Rounds & Plays"],
        ["so-floor", "The Floor"], ["so-conditions", "Sit-Down Conditions"]]));
      return kids;
    } },
    { id: "gms-chase", title: "Chase Rules", tag: "LEAD · CHASE CHECKS · STALEMATES", order: 20, when: hasScenes, build: function (ctx, K) {
      var B = S().chase, kids = [];
      kids.push(K.proseBlock(B.intro));
      // Lead is the book's Vehicles and Chases, now the chase panels of Vehicles & Economy:
      // "Lead from Vehicles and Chases" peeks the Lead entry itself
      kids.push(K.note(B.home, { terms: { "Vehicles and Chases": "vc-chase/lead" } }));
      kids.push(K.ruleBlock("Lead and its bands", (B.lead.bands || []).map(function (b) {
        return b.name + ": Lead " + b.text + (b.gapText ? ", " + b.gapText : "") + ".";
      }).join("\n") + "\n" + B.lead.startText));
      // what each margin does to Lead is the book's Resolving the Chase
      var check = addLinks(K.ruleBlock("The Chase Check", B.check.dominant.text + "\n" + B.stalemate.text),
        K, "What each margin does to Lead:", [["vc-chase/resolving-the-chase", "Resolving the Chase"]]);
      kids.push(addLinks(check, K, "Picking d20 or Dice Pools:", [["rz-collab/method-choice", "Method Choice"]]));
      kids.push(K.ruleBlock("First response", B.firstResponse.checklistText));
      var sp = ref(B.refs.impactBySpeed);
      if (Array.isArray(sp) && sp.length) {
        kids.push(K.ruleBlock("Impact DC by speed", sp.map(function (x) { return x.speed + " " + x.dc; }).join(", ") + "."));
      }
      kids.push(K.ruleBlock("Threat pilots", B.threatPilot.piloting + "\n" + (B.threatPilot.movingDefense || []).map(function (r) {
        return "Grade " + r.gradeLow + (r.gradeHigh !== r.gradeLow ? " to " + r.gradeHigh : "") + ": moving Defense " + r.text + ".";
      }).join("\n")));
      // the book's Pursuit Escalation table, and the crash rules a stalemate or a failed check leads to
      kids.push(K.seeAlso("Also in the book's chase:", [["vc-chase/pursuit-escalation", "Pursuit Escalation"], ["vc-damage/control-check", "Control Check"], ["vc-damage/crashes", "Crashes"]]));
      return kids;
    } },
    { id: "gms-incursion", title: "Incursion Rules", tag: "RATING · THE DIVE · THE RETURN", order: 30, when: hasScenes, build: function (ctx, K) {
      var I = S().incursion, kids = [];
      kids.push(K.proseBlock(paras([I.intro, I.briefing])));
      if (I.rating) kids.push(K.ruleBlock(I.rating.name, paras([I.rating.text, I.rating.legal, I.rating.posting && I.rating.posting.text])));
      kids.push(K.ruleBlock("Threat Calibers", paras([I.calibers.intro].concat((I.calibers.rows || []).map(function (r) {
        return r.shorthand + ". " + r.expect;
      })).concat([I.calibers.note]))));
      var Cl = I.classification;
      kids.push(K.ruleBlock("Classification", paras([Cl.intro].concat((Cl.rows || []).map(function (r) { return r.name + ". " + r.text; }))
        .concat([Cl.chromatic && Cl.chromatic.text, Cl.ratingStays, Cl.disclosure, Cl.sealedWorse]))));
      kids.push(K.ruleBlock("The anchor", I.anchor.text));
      kids.push(K.ruleBlock("Dive profiles", paras([I.profiles.intro].concat((I.profiles.rows || []).map(function (r) { return r.name + ". " + r.text; })))));
      if (I.dive) kids.push(K.ruleBlock(I.dive.name, paras([I.dive.text, I.dive.pressure])));
      var C = ref(I.claims && I.claims.ref);
      if (C) {
        kids.push(K.subTitle(C.name || "Claims and Salvage"));
        kids.push(K.ruleBlock(C.name || "Claims and Salvage", C.intro));
        (I.claims.parts || []).forEach(function (p) {
          var t = ref(p.ref);
          if (!t) return;
          var body = typeof t === "string" ? t : t.paragraphs ? paras(t.paragraphs) : (t.text || "");
          var jobs = (t.jobs || []).map(function (j) { return j.name + ". " + j.text; });
          kids.push(K.ruleBlock(p.name, paras([body].concat(jobs))));
        });
        var pg = (I.claims.ground || []).filter(function (g) { return g.key === "private"; })[0];
        var PG = pg ? ref(pg.ref) : null;
        if (PG && PG.paragraphs) kids.push(K.ruleBlock(PG.name || pg.name, paras(PG.paragraphs)));
      }
      if (I.paying) kids.push(linkLine(K, "Pay for a cleared Incursion with", [["gmy-pay/paying-for-it", I.paying.name]]));
      return kids;
    } }
  ] };

  /* ======================================================================
     PEOPLE, from EN.gmBook.people: the People tab's From the Book panel.
     Resolve by Role is here once; Scenes and People both link to it.
     ====================================================================== */
  function hasPeople() { return !!P(); }
  var peopleChapter = { id: "gm-people", title: "People", order: 250, audience: "gm", panels: [
    { id: "gmp-quickbuild", title: "NPC Quick-Build", tag: "THE CONTACT CARD", order: 10, when: hasPeople, build: function (ctx, K) {
      var B = P(), NI = B.notInInitiative || {}, C = B.card || {}, E = B.example, kids = [];
      kids.push(K.subTitle(NI.title || "People Who Aren't in Initiative"));
      kids.push(K.proseBlock(paras(NI.paragraphs)));
      kids.push(K.entry("the-contact-card", C.title || "The Contact Card", [
        K.subTitle(C.title || "The Contact Card"),
        K.proseBlock(C.intro),
        K.refTable(C.columns || ["Line", "What It Holds"], (C.lines || []).map(function (l) { return [l.line, l.holds]; }), [0]),
        K.proseBlock(paras([C.promote, C.fromThreat]))
      ]));
      if (E) {
        // the book's own example, one line per card line, the way the People tab writes a card
        var out = [E.name + (E.print ? " (#PRINT: " + E.print + ")" : "")];
        (C.lines || []).forEach(function (l) {
          if (l.field === "name") return;
          var v = l.field === "resolve" ? E.resolve : E[l.field];
          if (v) out.push(l.line + ": " + stop(v));
        });
        kids.push(K.entry("the-book-s-example", "The Book's Example", [
          el("div.feature", null, [
            el("h4", { text: "The Book's Example" }),
            el("p", { style: { whiteSpace: "pre-wrap" }, text: out.join("\n") })
          ])
        ]));
      }
      return kids;
    } },
    { id: "gmp-resolve", title: "Resolve by Role", tag: "WHO SITS AT EACH TIER", order: 20, when: hasPeople, build: function (ctx, K) {
      var R = P().resolveByRole || {};
      return [
        K.proseBlock(R.intro),
        (R.tiers || []).map(function (t) {
          return K.ruleBlock(t.tier, t.who, (R.columns ? R.columns[1] : "Resolve").toUpperCase() + " " + t.resolve, { slug: t.key });
        }),
        K.proseBlock(R.moving),
        R.weakSpots ? K.ruleBlock("Weak spots", R.weakSpots.text) : null
      ];
    } },
    { id: "gmp-profiles", title: "Their Profile of You", order: 30, when: hasPeople,
      tag: function () { var B = P(); return B && B.profiles ? String(B.profiles.die || "d12").toUpperCase() + ", OR PICK" : ""; },
      build: function (ctx, K) {
        var Pr = P().profiles || {};
        return [
          K.proseBlock(paras([Pr.intro, Pr.prompt])),
          K.refTable(Pr.columns || ["d12", "Profile", "What They've Heard"], (Pr.rows || []).map(function (r) { return [String(r.n), r.name, r.heard]; }), [1]),
          Pr.earned ? K.ruleBlock("Earned in play", Pr.earned.text) : null,
          Pr.howItWorks ? K.ruleBlock("How a Profile works", Pr.howItWorks) : null
        ];
      } }
  ] };

  /* ======================================================================
     PAYING THE CREW, from EN.gmBook.payroll: the Payroll folds' rules prose
     and the book text beside its tools. The split itself is the player
     rule, Splitting a Payout, in Economy & Rewards.
     ====================================================================== */
  function hasPay() { return !!Y(); }
  var payChapter = { id: "gm-pay", title: "Paying the Crew", order: 260, audience: "gm", panels: [
    { id: "gmy-pay", title: "Paying the Crew", tag: "CONTRACTS · BOUNTIES · SALVAGE · XP", order: 10, when: hasPay, build: function (ctx, K) {
      var B = Y(), C = B.contract, kids = [];
      kids.push(K.proseBlock(B.intro));
      if (C) {
        kids.push(K.entry("contract-pay", "Contract Pay", [
          K.subTitle("Contract Pay"),
          K.proseBlock(C.lead),
          K.refTable(["Caliber"].concat((C.columns || []).map(function (c) { return c.name; })),
            (C.rows || []).map(function (r) { return [String(r.caliber)].concat((r.cells || []).map(function (c) { return c.text; })); }), [0]),
          K.proseBlock(C.after),
          linkLine(K, "The split itself:", [["ref-economy/splitting-a-payout", "Splitting a Payout"]])
        ]));
        if (C.shifts) kids.push(K.ruleBlock(C.shifts.name, C.shifts.text));
      }
      if (B.bounties) {
        kids.push(K.entry("bounties", "Bounties", [K.subTitle("Bounties"), K.proseBlock(paras(B.bounties.paragraphs))]));
      }
      var Sv = B.salvage;
      if (Sv) {
        kids.push(K.entry("salvage-and-parts", "Salvage and Parts", [
          K.subTitle("Salvage and Parts"),
          K.proseBlock(Sv.lead),
          K.refTable(["Grade of the kill", "Clean parts value", "The buyers"], (Sv.bands || []).map(function (b) { return ["G" + b.grade, b.text, b.buyers]; }), [0])
        ]));
        (Sv.sources || []).forEach(function (s) { kids.push(K.ruleBlock(s.name, s.text)); });
        if (Sv.guidance) kids.push(K.ruleBlock(Sv.guidance.label, Sv.guidance.text));
        kids.push(linkLine(K, "What an Incursion's haul owes its owner:", [["gms-incursion/salvage", "Salvage"]]));
      }
      var X = B.xp;
      if (X) {
        kids.push(K.entry("experience", "Experience", [
          K.subTitle("Experience"),
          K.proseBlock(paras([X.milestone, X.text])),
          K.refTable(["Grade"].concat((X.columns || []).map(runIn)), (X.priceList || []).map(function (r) {
            return ["G" + r.grade].concat((X.columns || []).map(function (c) { return String(r[c]); }));
          }), [0])
        ]));
      }
      var M = B.milestones;
      if (M) {
        var n = Math.max((M.major || []).length, (M.minor || []).length), rows = [];
        for (var i = 0; i < n; i++) rows.push([(M.major[i] && M.major[i].text) || "", (M.minor[i] && M.minor[i].text) || ""]);
        kids.push(K.entry("milestones-and-pacing", M.name, [
          K.subTitle(M.name),
          K.proseBlock(M.lead),
          K.refTable((M.columns || []).map(function (c) { return c.name; }), rows),
          K.proseBlock(paras([M.notMilestone && M.notMilestone.text, M.pace, M.notesLead]))
        ]));
        (M.notes || []).forEach(function (nt) { kids.push(K.ruleBlock(head(nt.name), nt.text)); });
      }
      if (B.ledger) kids.push(K.ruleBlock(B.ledger.name, B.ledger.text));
      if (B.incursion) kids.push(K.ruleBlock(B.incursion.name, B.incursion.text));
      if (B.payday) kids.push(K.ruleBlock("Payday, in the book's order", B.payday.text));
      return kids;
    } }
  ] };

  [heatChapter, scenesChapter, peopleChapter, payChapter].forEach(EN.codexView.register);

  /* Pointer terms: the handbook's own names for these panels, as the GM data
     cites them ("see Resolve by Role", "(see Incursion Briefings)", "per
     Claims and Salvage"). Panel titles are terms already; these add the book's
     other names. The player chapters' names (Sit-Down, Lead track, Flow
     Disturbances) are registered by their own files, not here. */
  EN.codexView.terms({
    "Heat Response": "gmx-check",
    "Heat check": "gmx-check",
    "Incursion Briefings": "gms-incursion",
    "Resolve by Role": "gmp-resolve",
    "Their Profile of You": "gmp-profiles",
    "Contact Card": "gmp-quickbuild/the-contact-card",
    "Claims and Salvage": "gms-incursion/claims-and-salvage",
    "Salvage and Parts": "gmy-pay/salvage-and-parts",
    "Milestones and Pacing": "gmy-pay/milestones-and-pacing",
    "Paying for It": "gmy-pay/paying-for-it"
  });
})();
