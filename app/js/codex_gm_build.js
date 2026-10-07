/* ===========================================================================
   ELYSIUM NIGHTS · Codex chapters: Building Encounters, Hazards & Set Pieces (Game Master)
   Two Game Master chapters, audience "gm": rendered, searchable and peekable
   on the Admin desktop only. The API is documented in the header of
   app/js/codex.js.
     gm-encounters  "Building Encounters"   order 210, panel ids "gme-"
     gm-hazards     "Hazards & Set Pieces"  order 220, panel ids "gmh-"

   READS, NEVER RESTATES. Every rule sentence here comes from
   EN.gmBook.encounters (data/gm_encounters.js) or EN.gmBook.hazards
   (data/gm_hazards.js). The words written in this file are headers, table
   labels and the short pointer lines that tie a table to its rule. The
   Encounters and Hazards tabs keep their working tools (the plan, its
   checks, the room dressing, the Composer, the Room tray, the Tools) and
   point here for the reading.

   Secret GM material (EN.gmBook.heat.gmOnly, the Watchfire's hidden Heat,
   Octothorpe) never enters the Codex; nothing in these two chapters is
   secret, it is the Handbook's own prep chapter.

   PHRASE LINKS. Linkify links pointer terms (chapter and panel titles,
   aliases). The book's room and object text also names rules that are ENTRY
   titles ("Half Cover", "Line of Sight", the Cover Material Table), which
   are not pointer terms, so those are linked by name from the LINKS table
   below: each pair is [the phrase as printed, its anchor], handed to the
   kit as opts.terms, so the phrase (word boundaries, case as printed) links
   ahead of the shared terms, once per anchor. The table is
   exported as EN.codexGmBuild so the Encounters and Hazards tabs link the
   same words to the same rules, and a tab that finds no EN.codexGmBuild
   (codex.js missing) prints its text plain through EN.ui.ruleText.
   An anchor that does not resolve (a panel another agent has not built
   yet, a gm anchor on the Freelancer desktop) prints the phrase as text.
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;
  var CV = EN.codexView;

  /* ---- the phrase table (anchors live in code only) ----------------------- */
  var LINKS = {
    // Building Encounters, The Room Is a Combatant: the intro and each dressing rule by its key
    roomIntro: [["Cover", "ref-cover"], ["obscurement", "ref-cover/obscurement"],
                ["destructible terrain", "ref-cover/destructible-cover"], ["Edge and Snag", "rz-edge"]],
    room: {
      cover: [["Half Cover", "ref-cover/half-cover"], ["Three-Quarter Cover", "ref-cover/three-quarter-cover"]],
      destructible: [["Structure", "ref-cover/structure"], ["Integrity", "ref-cover/integrity"]],
      grid: [["Node Attributes table", "gd-nodes"]],
      fixtures: [["Hazards and Set Pieces", "gmh-anatomy"]],
      light: [["obscurement", "ref-cover/obscurement"], ["Line of Sight", "ref-cover/line-of-sight"]]
    },
    openings: [["Edge", "rz-edge"], ["Passive Perception", "sk-skills/passive-checks"]],
    ending: [["Morale", "gmt-conventions/morale"], ["Threat Conventions", "gmt-conventions"]],
    bounties: [["Nonlethal", "ref-dmg/nonlethal"]],
    // Hazards & Set Pieces
    hazardsIntro: [["Exposure", "ref-hazards/exposure"]],
    objects: [["Cover Material Table", "ref-cover/cover-material-table"], ["Structure", "ref-cover/structure"],
              ["Integrity", "ref-cover/integrity"]],
    // words every Set Piece paragraph may print, for the Hazards tab's cards
    setPiece: [["Difficult Terrain", "ref-actions/difficult-terrain"], ["heavily obscured", "ref-cover/obscurement"],
               ["Snag", "rz-edge"], ["Dashes", "ref-actions/dash"]]
  };
  /* A Set Piece's own link words, read off its data: the bite's damage type
     (bite.type) and its Exposure (exposure), ahead of the shared words. The
     condition it names (condition) is linked by linkify with conditions on. */
  function setPieceLinks(item) {
    var out = [];
    var t = item && item.bite && item.bite.type;
    if (t) out.push([String(t), "ref-dmg/" + CV.slug(t)]);
    if (item && item.exposure) out.push(["Exposure", "ref-hazards/exposure"]);
    return out.concat(LINKS.setPiece);
  }

  /* A pair list as the kit's opts.terms map, { phrase: anchor }; the first pair
     for a phrase wins. linkify does the linking: each phrase is matched as
     written, ahead of the shared terms, one link per anchor per call. */
  function termMap(pairs) {
    var map = {};
    (pairs || []).forEach(function (pr) {
      if (pr && pr[0] && pr[1] && !Object.prototype.hasOwnProperty.call(map, pr[0])) map[pr[0]] = pr[1];
    });
    return map;
  }
  /* text into parent with each pair's phrase linked (opts.conditions links
     condition names): linkify with opts.terms. Kept for the Encounters and
     Hazards tabs. Returns parent. */
  function phrased(parent, text, pairs, opts) {
    opts = opts || {};
    return CV.linkify(parent, text, { terms: termMap(pairs), conditions: opts.conditions, self: opts.self });
  }

  EN.codexGmBuild = { links: LINKS, setPieceLinks: setPieceLinks, phrased: phrased };

  /* ---- small builders ----------------------------------------------------- */
  function enc() { return (EN.gmBook && EN.gmBook.encounters) || null; }
  function hz() { return (EN.gmBook && EN.gmBook.hazards) || null; }
  function fmtXp(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  // a proseBlock paragraph whose text takes phrase links
  function para(K, text, pairs, opts) {
    return K.proseBlock(text, { terms: termMap(pairs), conditions: (opts || {}).conditions });
  }
  /* K.ruleBlock whose text takes phrase links. paras is one string or several,
     joined by a blank line. */
  function block(K, name, paras, pairs, opts) {
    opts = opts || {};
    return K.ruleBlock(name, [].concat(paras).filter(Boolean).join("\n\n"), opts.extra,
      { slug: opts.slug, conditions: opts.conditions, terms: termMap(pairs) });
  }
  function byKey(obj) {
    return Object.keys(obj || {}).map(Number).filter(function (k) { return k > 0; }).sort(function (a, b) { return a - b; });
  }

  /* ======== Building Encounters ======== */
  EN.codexView.register({ id: "gm-encounters", title: "Building Encounters", order: 210, audience: "gm", panels: [

    { id: "gme-budget", title: "The Encounter Budget", tag: "SHARE · DIFFICULTY · XP", order: 10,
      when: function () { return !!(enc() && enc().budget); },
      build: function (ctx, K) {
        var E = enc(), B = E.budget;
        var kids = [];
        if (E.intro) kids.push(K.proseBlock(E.intro));
        kids.push(K.ruleBlock("How the budget works", [B.intro].concat((B.steps || []).map(function (s) {
          return s.n + ". " + s.text;
        })).join("\n")));
        var cals = byKey(B.shareByCaliber);
        if (cals.length) {
          kids.push(K.subTitle("Share by Caliber"));
          kids.push(K.refTable(["Caliber", "Share (one Freelancer)"], cals.map(function (c) {
            return ["Caliber " + c, fmtXp(B.shareByCaliber[c]) + " XP"];
          }), [0]));
        }
        if (B.difficulties && B.difficulties.length) {
          kids.push(K.subTitle("Scale for intent"));
          kids.push(K.refTable(["Difficulty", "Budget", "What it costs"], B.difficulties.map(function (d) {
            return [d.name, d.budget, d.costs];
          }), [0]));
        }
        if (B.pastText) kids.push(K.ruleBlock("Past " + (B.pastMult || 2) + "x", B.pastText));
        if (B.example && B.example.text) kids.push(K.ruleBlock("Example", B.example.text));
        return kids;
      } },

    { id: "gme-composition", title: "Composition Rules", tag: "HOW THE BUDGET PLAYS", order: 20,
      when: function () { return !!(enc() && enc().composition); },
      build: function (ctx, K) {
        var C = enc().composition;
        var kids = [];
        if (C.intro) kids.push(K.proseBlock(C.intro));
        (C.rules || []).forEach(function (r) {
          kids.push(K.ruleBlock(r.name, r.text));
          if (r.key === "band" && C.workingBand) kids.push(K.note(C.workingBand));
        });
        if (C.guidance) kids.push(K.ruleBlock(C.guidance.name, C.guidance.text, (C.guidance.label || "").toUpperCase()));
        return kids;
      } },

    { id: "gme-objectives", title: "Objectives & Payout", tag: "THE REASON FOR THE FIGHT", order: 30,
      when: function () { return !!(enc() && enc().objectives); },
      build: function (ctx, K) {
        var O = enc().objectives;
        var kids = [];
        if (O.intro) kids.push(K.proseBlock(O.intro));
        // "• Hold: until..." lines, so each type is a named line of its own (gme-objectives/hold)
        if (O.types && O.types.length) {
          kids.push(K.ruleBlock("Objective types", K.bullets(O.types.map(function (t) { return t.name + ": " + t.text; }))));
        }
        if (O.payout) kids.push(K.ruleBlock("Payout", O.payout));
        if (O.bounties) kids.push(block(K, O.bounties.name, O.bounties.text, LINKS.bounties));
        return kids;
      } },

    { id: "gme-room", title: "The Room Is a Combatant", tag: "COVER · TERRAIN · NODES · LIGHT", order: 40,
      when: function () { return !!(enc() && enc().room); },
      build: function (ctx, K) {
        var Rm = enc().room;
        var kids = [];
        if (Rm.intro) kids.push(para(K, Rm.intro, LINKS.roomIntro));
        (Rm.rules || []).forEach(function (r) {
          kids.push(block(K, r.name, r.text, LINKS.room[r.key] || []));
        });
        return kids;
      } },

    { id: "gme-openings", title: "Openings and Surprise", tag: "THE FIRST ROUND", order: 50,
      when: function () { return !!(enc() && enc().openings); },
      build: function (ctx, K) {
        var Op = enc().openings;
        return [block(K, Op.name, Op.paragraphs || [], LINKS.openings, { conditions: true })];
      } },

    { id: "gme-security", title: "Security Response", tag: "THE RESPONSE CLOCK", order: 60,
      when: function () { return !!(enc() && enc().security); },
      build: function (ctx, K) {
        var S = enc().security;
        var kids = [];
        if (S.intro) kids.push(K.proseBlock(S.intro));
        if (S.tiers && S.tiers.length) {
          kids.push(K.refTable(["Site", "Arrives in", "What arrives"], S.tiers.map(function (t) {
            return [t.site, t.arrives, t.looksLike];
          }), [0]));
        }
        var other = (S.escalation && S.escalation.other) || [];
        if (S.closing || other.length) {
          kids.push(K.ruleBlock("When the clock runs", [S.closing].concat(other.map(function (x) {
            return "On a Critical Failure: " + x;
          })).filter(Boolean).join("\n\n")));
        }
        return kids;
      } },

    { id: "gme-ending", title: "Ending Fights", tag: "THE QUESTION ANSWERED", order: 70,
      when: function () { return !!(enc() && enc().ending); },
      build: function (ctx, K) {
        var En = enc().ending;
        return [block(K, En.name, En.text, LINKS.ending)];
      } },

    { id: "gme-xp", title: "Awarding Experience", tag: "XP · MILESTONES", order: 80,
      when: function () { return !!(enc() && enc().xp); },
      build: function (ctx, K) {
        var X = enc().xp;
        var kids = [];
        if (X.defeated) kids.push(K.ruleBlock("Defeated", X.defeated));
        if (X.text) kids.push(K.ruleBlock("Awarding XP", X.text));
        if (X.milestones) kids.push(K.ruleBlock("Milestones", X.milestones));
        return kids;
      } }
  ] });

  /* ======== Hazards & Set Pieces ======== */
  EN.codexView.register({ id: "gm-hazards", title: "Hazards & Set Pieces", order: 220, audience: "gm", panels: [

    { id: "gmh-anatomy", title: "Hazard Anatomy", tag: "TRIGGER · SAVE · BITE · COUNTER", order: 10,
      when: function () { return !!(hz() && hz().anatomy); },
      build: function (ctx, K) {
        var H = hz();
        var kids = [];
        if (H.intro) kids.push(para(K, H.intro, LINKS.hazardsIntro, { conditions: true }));
        if (H.anatomy.lead) kids.push(K.proseBlock(H.anatomy.lead));
        (H.anatomy.fields || []).forEach(function (f) { kids.push(K.ruleBlock(f.name, f.text)); });
        return kids;
      } },

    { id: "gmh-dc", title: "DC by Grade", tag: "THE HAZARD LADDER", order: 20,
      when: function () { return !!(hz() && hz().dcByGrade); },
      build: function (ctx, K) {
        var H = hz(), gs = byKey(H.dcByGrade);
        if (!gs.length) return [];
        var kids = [K.refTable(["Grade of the scene", "Save DC"], gs.map(function (g) { return ["G" + g, "DC " + H.dcByGrade[g]]; }), [0])];
        if (H.dcLegalText) kids.push(K.ruleBlock("DC " + (H.dcLegal || 20) + " is legal", H.dcLegalText));
        return kids;
      } },

    { id: "gmh-bites", title: "Bite Bands", tag: "NUISANCE TO LETHAL", order: 30,
      when: function () { return !!(hz() && hz().bites && hz().bites.length); },
      build: function (ctx, K) {
        return [K.refTable(["Band", "Dice", "Reads as"], hz().bites.map(function (b) { return [b.name, b.dice, b.readsAs]; }), [0])];
      } },

    { id: "gmh-pricing", title: "Pricing Hazards", tag: "FLAVOR OR OPPOSITION", order: 40,
      when: function () { return !!(hz() && hz().pricing); },
      build: function (ctx, K) {
        var H = hz(), P = H.pricing;
        // the book's one sentence carries both cases and both equivalents; the table restates its numbers by Grade
        var kids = [];
        if (P.text) kids.push(K.proseBlock(P.text));
        var eqs = P.equivalents || [];
        var gs = byKey(H.dcByGrade);
        if (eqs.length && gs.length) {
          kids.push(K.subTitle("Recurring hazards, priced as threats"));
          var bandName = {}, desName = {};
          (H.bites || []).forEach(function (b) { bandName[b.key] = b.name; });
          ((EN.threats && EN.threats.designations) || []).forEach(function (d) { desName[d.key] = d.name; });
          kids.push(K.refTable(["Recurring", "Priced as"].concat(gs.map(function (g) { return "G" + g; })), eqs.map(function (e) {
            return [bandName[e.bite] || e.bite, desName[e.designation] || e.designation].concat(gs.map(function (g) {
              return e.xpByGrade && e.xpByGrade[g] != null ? fmtXp(e.xpByGrade[g]) : "";
            }));
          }), [0]));
        }
        if (P.unpricedNote) kids.push(K.note(P.unpricedNote));
        return kids;
      } },

    { id: "gmh-objects", title: "Objects and Materials", tag: "STRUCTURE TO MATTER · INTEGRITY TO DIE", order: 50,
      when: function () { return !!(hz() && hz().objects); },
      build: function (ctx, K) {
        var O = hz().objects;
        var kids = [para(K, O.text, LINKS.objects)];
        if (O.materials && O.materials.length) {
          kids.push(K.refTable(["Material", "Structure", "Integrity"], O.materials.map(function (m) {
            return [m.name, String(m.structure), String(m.integrity)];
          }), [0]));
        }
        return kids;
      } },

    { id: "gmh-acts", title: "How a Hazard Acts", tag: "A PRESENCE, NOT A SLOT", order: 60,
      when: function () { return !!(hz() && hz().acts); },
      build: function (ctx, K) {
        var A = hz().acts;
        var kids = [K.proseBlock(A.text)];
        if (A.appNote) kids.push(K.note(A.appNote));
        return kids;
      } },

    { id: "gmh-count", title: "How Many Hazards", tag: "SEASONING · SET PIECE · THE FIGHT", order: 70,
      when: function () { var H = hz(); return !!(H && H.setPieces && H.setPieces.guidance); },
      build: function (ctx, K) {
        var G = hz().setPieces.guidance;
        var kids = [K.ruleBlock(G.label || "GM Guidance", G.text)];
        if (G.perFight && G.perFight.length) {
          kids.push(K.refTable(["Hazards in the fight", "Reads as"], G.perFight.map(function (x) { return [String(x.count), x.reads]; }), [0]));
        }
        return kids;
      } },

    // "Falling" alone is no title: it would link the Phase 2 name "Falling & Forced Movement"
    { id: "gmh-falling", title: "Falling Damage", tag: "PER 2 SPACES", order: 80,
      when: function () { return !!(hz() && hz().falling); },
      build: function (ctx, K) {
        return [K.proseBlock(hz().falling.text)];
      } }
  ] });

  /* The book's own names for these chapters, matched in any case. A phrase that
     names a Phase 2 chapter (Falling & Forced Movement, Flow Disturbances) is
     deliberately absent. */
  EN.codexView.terms({
    "Hazards and Set Pieces": "gmh-anatomy",
    "encounter budget": "gme-budget"
  });
})();
