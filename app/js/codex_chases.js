/* ===========================================================================
   ELYSIUM NIGHTS · Codex chapter: Vehicles & Chases
   The book's Vehicles and Chases rules, for both desktops, rendered from
   EN.chases (app/data/chases.js). They are panels of the street chapter
   (Vehicles & Economy, order 100, registered by codex.js), added here with
   EN.codexView.addPanels, between the ownership panel (ref-vehicles, 10) and
   Economy & Rewards (ref-economy, 20):
     vc-stats     Vehicle Stats & Traits        order 11
     vc-piloting  Piloting a Vehicle            order 12
     vc-damage    Damage, Collisions & Crashes  order 13
     vc-chase     Chases & Lead                 order 14
     vc-category  Category Rules & Towing       order 15
   Ownership, upkeep, repair, mods and the profile stat lines stay in
   ref-vehicles (EN.vehicles), and the book's "Vehicles as cover" paragraphs
   stay in Cover & Sight (EN.combat.vehiclesAsCover): these panels link them
   rather than print them twice. Every rule line is a field of EN.chases; the
   only words of this file's own are headings and the small pointers.
   The API is documented in the header of app/js/codex.js.
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;
  var CV = EN.codexView;

  function C() { return EN.chases || null; }
  function has(field) { return function () { var c = C(); return !!(c && c[field]); }; }
  // "• Name: text" lines: each one is a named line, so an anchor of its own
  function named(list) { return (list || []).map(function (x) { return "• " + x.name + ": " + x.text; }).join("\n"); }
  function paras(list) { return list.filter(function (x) { return !!x; }).join("\n\n"); }
  /* Rules the book cites by name that live in other chapters. Passed per call (opts.terms),
     so this file registers nothing for another chapter's rules. */
  var XT = {
    "Vehicle Ownership": "ref-vehicles",
    "Vehicle Upkeep Table": "ref-vehicles/weekly-upkeep",
    "Vehicle Repair under Vehicle Ownership": "ref-vehicles/vehicle-repair",
    "Vehicle Customization": "ref-vehicles/how-vehicle-mods-work",
    "Hardpoint Mount": "ref-vehicles/vehicle-mods",
    "Cargo Winch": "ref-vehicles/vehicle-mods",
    "Modifier Stack Cap": "gd-scan/modifier-stack-cap",
    "Encumbrance Threshold": "sk-load/encumbrance-threshold",
    "Stability Check": "gd-core/stability-check",
    "Cipher Attack": "gd-ciphers/cipher-attack",
    "Quick Hack": "gd-ciphers/quick-hack",
    "Quick Hacks": "gd-ciphers/quick-hack",
    "Firewall": "gd-nodes/firewalls",
    "Siege": "gr-traits/siege",
    "Setup": "gr-traits/setup",
    "High Recoil": "gr-traits/high-recoil",
    "Crew Served": "gr-traits/crew-served",
    "Guided": "gr-traits/guided",
    "Stabilized": "gr-traits/stabilized",
    "drowning rules": "ref-conds/drowning",
    "vacuum environmental hazard": "ref-hazards/vacuum-mirrors-drowning-exactly"
  };
  var LO = { terms: XT, conditions: true };
  function rb(K, name, text, extra, slug) {
    return K.ruleBlock(name, text, extra || null, { terms: XT, conditions: true, slug: slug || undefined });
  }
  // an entry styled as a rule block whose body is several nodes (a list, a table)
  function block(K, title, nodes, extra, slug) {
    return K.entry(slug || null, title, [K.el("h4", null, [document.createTextNode(title), extra ? K.el("span.src", { text: extra }) : null])].concat(nodes), { tag: "div.feature" });
  }
  // a bulleted list; an item may carry sub-items ({ text, sub: [...] })
  function list(K, items) {
    var ul = K.el("ul", { style: { margin: "2px 0 8px", paddingLeft: "18px", fontSize: "13.5px", color: "var(--text2)", lineHeight: "1.5" } });
    (items || []).forEach(function (it) {
      var li = K.el("li", { style: { marginBottom: "3px" } });
      K.linkify(li, typeof it === "string" ? it : it.text, LO);
      if (it && it.sub && it.sub.length) li.appendChild(list(K, it.sub));
      ul.appendChild(li);
    });
    return ul;
  }
  function prose(K, text) { return K.proseBlock(text, LO); }

  CV.addPanels("street", [

    /* ---- 1 · what a vehicle is, in numbers ----------------------------------- */
    { id: "vc-stats", title: "Vehicle Stats & Traits", tag: "CORE CONCEPTS · SPEED · TRAITS", order: 11, when: has("coreConcepts"), build: function (ctx, K) {
      var c = C();
      return [
        prose(K, paras([c.intro, c.statBlocksIntro])),
        K.entry("core-concepts", "Core Concepts", [K.subTitle("Core Concepts"),
          K.refTable(["Term", "Summary"], c.coreConcepts.map(function (t) { return [t.term, t.text]; }), [0], LO)]),
        K.entry("vehicle-categories", "Vehicle Categories", [K.subTitle("Vehicle Categories"), prose(K, c.categoriesNote),
          K.refTable(["Category", "What It Covers", "Examples"], c.categories.map(function (r) { return [r.category, r.covers, r.examples]; }), [0], LO)]),
        rb(K, "Vehicle Stats", named(c.stats)),
        K.seeAlso("Each printed vehicle's numbers:", [["ref-vehicles/vehicle-stats", "Vehicle Stats in Vehicles"]]),
        block(K, "Speed Ratings", [
          K.refTable(["Rating", "Speed (spaces)"], c.speedRatings.map(function (r) { return [r.rating, String(r.spaces)]; }), [0], LO),
          prose(K, paras([c.speedOrder, c.speedOnMap]))
        ]),
        c.openThrottle ? rb(K, c.openThrottle.name, c.openThrottle.text, c.openThrottle.action.toUpperCase()) : null,
        c.massRows ? rb(K, "Mass Rows", c.massRows) : null,
        rb(K, "Vehicle Traits", named(c.traits))
      ];
    } },

    /* ---- 2 · the pilot ---------------------------------------------------------- */
    { id: "vc-piloting", title: "Piloting a Vehicle", tag: "PILOTING CHECK · PROFICIENCY · RIGGING", order: 12, when: has("operating"), build: function (ctx, K) {
      var c = C(), O = c.operating, P = c.proficiencies, CB = c.combat, H = c.hacking;
      var kids = [
        rb(K, O.pilotingCheck.name, O.pilotingCheck.text),
        // the Garage is the Freelancer's calculator for this check; the GM runs chases on Scenes
        ctx.portal === "admin" ? null : K.note("The Inventory tab's Garage works this check out for the vehicle you pick."),
        rb(K, "Proficient and Untrained Pilots", O.proficiency)
      ];
      if (P) kids.push(block(K, "Vehicle Proficiencies", [prose(K, paras([P.intro, P.rule])),
        K.refTable(["Category", "What it Covers", "Examples", "In Play"], P.rows.map(function (r) { return [r.category, r.covers, r.examples, r.inPlay]; }), [0], LO)]));
      if (O.ownership) kids.push(K.note(O.ownership, { terms: XT }));
      if (CB) {
        kids.push(K.subTitle("Combat Integration"));
        kids.push(rb(K, "Piloting Under Fire", paras([CB.intro, CB.underFire])));
        kids.push(rb(K, CB.shootingMoving.name.charAt(0).toUpperCase() + CB.shootingMoving.name.slice(1), CB.shootingMoving.text.charAt(0).toUpperCase() + CB.shootingMoving.text.slice(1)));
        kids.push(rb(K, "Mounted Weapons", paras(CB.mounted)));
      }
      if (H) {
        kids.push(K.subTitle("Cyberware and #GRID Hacking Hooks"));
        kids.push(prose(K, H.intro));
        kids.push(block(K, "Codebreaker Intrusions", [prose(K, H.codebreaker),
          list(K, H.nodes.map(function (n) { return "**" + n.name + ":** " + n.text; })), prose(K, H.inChase)]));
        kids.push(rb(K, "Rigging and Cyberware", paras([H.riggingIntro, named(H.rigging), H.severed])));
      }
      return kids;
    } },

    /* ---- 3 · when the metal meets something ------------------------------------- */
    { id: "vc-damage", title: "Damage, Collisions & Crashes", tag: "DEFENSE · IMPACT DC · RAMS · CRASHES", order: 13, when: has("shooting"), build: function (ctx, K) {
      var c = C(), S = c.shooting, CO = c.collisions, CR = c.crashes;
      var kids = [
        K.subTitle("Shooting a Vehicle"),
        rb(K, S.defense.name, S.defense.text),
        block(K, S.structure.name, [prose(K, S.structure.text), list(K, S.structure.gate), prose(K, S.structure.siege)]),
        K.seeAlso("Sheltering behind a vehicle:", [["ref-cover/vehicles-as-cover", "Vehicles as Cover"]]),
        block(K, S.occupants.name, [prose(K, S.occupants.text), list(K, S.occupants.routes)]),
        rb(K, S.wrecked.name, S.wrecked.text),
        K.subTitle("The Impact DC"),
        block(K, "The Impact DC", [prose(K, c.impactIntro),
          K.refTable(["Speed at impact", "Impact DC"], c.impactDc.map(function (r) { return [r.speed, String(r.dc)]; }), [0], LO)])
      ];
      if (CO) {
        kids.push(K.subTitle("Collisions and Ramming"));
        kids.push(rb(K, "Collisions and Ramming", paras([CO.ram, CO.onWin])));
        kids.push(rb(K, CO.ramDamage.name, CO.ramDamage.text));
        kids.push(rb(K, CO.occupants.name, CO.occupants.text.charAt(0).toUpperCase() + CO.occupants.text.slice(1)));
      }
      if (CR) {
        kids.push(K.subTitle("Crashes"));
        kids.push(rb(K, "Crashes", CR.intro));
        CR.steps.forEach(function (s) { kids.push(rb(K, s.name, s.text, "STEP " + s.n)); });
      }
      return kids;
    } },

    /* ---- 4 · the chase ------------------------------------------------------------ */
    { id: "vc-chase", title: "Chases & Lead", tag: "LEAD · CHASE CHECK · CREW · ESCALATION", order: 14, when: has("chase"), build: function (ctx, K) {
      var c = C(), H = c.chase, E = H.escalation, SH = H.systemHits;
      var kids = [
        block(K, "Lead", [prose(K, H.intro),
          K.refTable(["Lead", "Band", "Gap in spaces"], H.lead.map(function (r) { return [String(r.lead), r.band, r.gap]; }), [0, 1], LO),
          prose(K, paras([H.ranges, H.startAndEnd]))]),
        rb(K, "Resolving the Chase", paras([H.resolving, named(H.outcomes)])),
        rb(K, "Edge and Snag Interactions", paras([H.edgeSnagIntro, named(H.edgeSnag)])),
        rb(K, "The Crew", paras([H.crewIntro, named([H.tilt])])),
        block(K, SH.name, [prose(K, SH.text), list(K, SH.list), prose(K, "**" + SH.cap.name + ":** " + SH.cap.text)]),
        block(K, "Pursuit Escalation", [prose(K, paras([E.heat, E.firstResponse])),
          K.refTable(["Heat with the source", "What shows up"], E.rows.map(function (r) { return [r.heat, r.shows]; }), [0], LO)]),
        rb(K, "Chases Beyond Vehicles", paras([H.beyondIntro, H.beyond.map(function (b) {
          return "• " + b.name + ": " + b.text.charAt(0).toUpperCase() + b.text.slice(1); }).join("\n")])),
        c.summary ? rb(K, c.summary.name, c.summary.text, c.summary.label.toUpperCase()) : null
      ];
      // the GM's chase tracker and its prep card, on the Admin desktop only
      if (ctx.portal === "admin") kids.push(K.seeAlso("Running one at the table:", [["gms-chase", "Chase Rules"]]));
      return kids;
    } },

    /* ---- 5 · the other four categories, and hauling ------------------------------- */
    { id: "vc-category", title: "Category Rules & Towing", tag: "ALTITUDE · WATER · VACUUM · WALKERS", order: 15, when: has("categoryRules"), build: function (ctx, K) {
      var c = C(), R = c.categoryRules, A = R.aerial;
      function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
      return [
        prose(K, R.intro),
        rb(K, A.name, paras([A.intro, A.bands.map(function (b) { return "• " + b.name + ": " + cap(b.text); }).join("\n"), A.changing])),
        rb(K, A.stall.name, cap(A.stall.text)),
        rb(K, R.marine.name, R.marine.text),
        rb(K, R.starcraft.name, R.starcraft.text),
        rb(K, R.walker.name, R.walker.text),
        c.capacity ? rb(K, "Capacity and Towing", c.capacity) : null,
        c.towing ? rb(K, c.towing.name, cap(c.towing.text)) : null
      ];
    } }
  ]);

  /* ---- pointer terms ------------------------------------------------------------
     The names the book, the GM data and the Bestiary cite. A phrase matches in any
     case; a single word only as written. "Vehicles and Chases", the book's chapter
     name, opens the first of these panels. */
  CV.terms({
    "Vehicles and Chases": "vc-stats",
    "Vehicles & Chases": "vc-stats",
    "Vehicle Traits": "vc-stats/vehicle-traits",
    "Speed Ratings": "vc-stats/speed-ratings",
    "Speed rating": "vc-stats/speed-ratings",
    "Open Throttle": "vc-stats/open-throttle",
    "Piloting Check": "vc-piloting/the-piloting-check",
    "Piloting Checks": "vc-piloting/the-piloting-check",
    "Vehicle Proficiencies": "vc-piloting/vehicle-proficiencies",
    "Combat Integration": "vc-piloting/piloting-under-fire",
    "Piloting Under Fire": "vc-piloting/piloting-under-fire",
    "Mounted Weapons": "vc-piloting/mounted-weapons",
    "Mounted weapon": "vc-piloting/mounted-weapons",
    "Codebreaker Intrusions": "vc-piloting/codebreaker-intrusions",
    "Rigging and Cyberware": "vc-piloting/rigging-and-cyberware",
    "Direct Drive": "vc-piloting/direct-drive",
    "Machine Symbiosis": "vc-piloting/machine-symbiosis",
    "Shooting a Vehicle": "vc-damage/defense",
    "Wrecked and Disabled": "vc-damage/wrecked-and-disabled",
    "Impact DC": "vc-damage/the-impact-dc",
    "Collisions and Ramming": "vc-damage/collisions-and-ramming",
    "ram damage table": "vc-damage/ram-damage-by-vehicle-mass",
    "Crashes": "vc-damage/crashes",
    "Control Check": "vc-damage/control-check",
    "Control Checks": "vc-damage/control-check",
    "Lead track": "vc-chase/lead",
    "Lead system": "vc-chase/lead",
    "Chase Check": "vc-chase/resolving-the-chase",
    "Chase Checks": "vc-chase/resolving-the-chase",
    "straightaway trigger": "vc-chase/edge",
    "System Hit": "vc-chase/system-hits",
    "System Hits": "vc-chase/system-hits",
    "Pursuit Escalation": "vc-chase/pursuit-escalation",
    "Chases Beyond Vehicles": "vc-chase/chases-beyond-vehicles",
    "Category Rules": "vc-category",
    "Capacity and Towing": "vc-category/capacity-and-towing"
  });
})();
