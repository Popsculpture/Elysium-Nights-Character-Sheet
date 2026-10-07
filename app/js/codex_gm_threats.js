/* ===========================================================================
   ELYSIUM NIGHTS · Codex chapter: Running Threats (Game Master)
   The Game Master's Handbook chapter Threats, and the rules prose the Bestiary
   prints around its statblocks, for the Admin desktop. Rendered from
   EN.threats (app/data/threats.js) and EN.bestiary (app/data/bestiary.js),
   which are also what the Threat Builder, the Table's Solo helper and the
   Bestiary tab read, so the Codex and the tools cannot drift.
     gm-threats: "Running Threats", order 200, audience "gm", panel ids "gmt-"
   audience "gm": rendered, searchable and peekable on the Admin desktop only.

   THE WORKING TABLES STAY WHERE THEY ARE. The builder, the resolver
   (EN.gmEngine) and the Table read the array, the Designation and Role numbers,
   the initiative maps and the Bestiary's entries from their data; the panels
   below read the same objects and copy nothing. The Bestiary's catalogs (the
   48 statblocks, the Species Templates' traits, the Hostile Vehicles'
   profiles) stay on the Bestiary tab: this chapter carries the prose around
   them.

   Nothing is written here that the data does not say. The only words of this
   file's own are headings, column names and the short pointers between panels.
   Secret GM material (EN.gmBook.heat.gmOnly, the Watchfire's hidden Heat,
   Octothorpe) never enters the Codex, and nothing in this chapter reads it.
   The API is documented in the header of app/js/codex.js.
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;

  function T() { return EN.threats || null; }
  function B() { return EN.bestiary || null; }
  function hasT(field) { return function () { var t = T(); return !!(t && t[field]); }; }
  function fmt(n) { return (n > 0 ? "+" : "") + n; }
  function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  // a multiplier as the card prints it: "x2", "x0.6"
  function times(m) { return "x" + m; }
  // a Role's multiplier as the Roles table reads it: 0.75 is "-25%", 1.25 is "+25%"
  function pct(m) { var n = Math.round((m - 1) * 100); return (n > 0 ? "+" : "") + n + "%"; }
  function byGrade(map) {
    return [1, 2, 3, 4, 5].map(function (g) { return own(map, g) ? map[g] : "?"; }).join(" / ");
  }
  function nameOf(list, key) {
    var x = (list || []).filter(function (d) { return d && d.key === key; })[0];
    return x ? x.name : key;
  }

  /* What a Role changes, read off its fields. Absent is neutral (the resolver
     reads it that way too), so Gunhand reads "No adjustment". */
  function roleAdjust(r) {
    var bits = [];
    if (typeof r.vitalityMult === "number") bits.push(pct(r.vitalityMult) + " Vitality");
    if (typeof r.defense === "number") bits.push("Defense " + fmt(r.defense));
    if (typeof r.speed === "number") bits.push("Speed " + r.speed);
    if (typeof r.damageMult === "number") bits.push(pct(r.damageMult) + " damage");
    if (typeof r.damageMultOneAttack === "number") bits.push(pct(r.damageMultOneAttack) + " damage on one attack");
    if (typeof r.saveDC === "number") bits.push("Save DC " + fmt(r.saveDC));
    return bits.length ? bits.join(", ") : "No adjustment";
  }

  /* A convention is prose with its rule in the first sentence ("Vitality only."),
     which becomes the entry's name; the rest of the paragraph is its text, so
     every word of the data is printed once. */
  function splitLead(s) {
    var m = String(s || "").match(/^([^.]+)\.\s*([\s\S]*)$/);
    return m ? { name: m[1], text: m[2] } : { name: String(s || ""), text: "" };
  }

  EN.codexView.register({ id: "gm-threats", title: "Running Threats", order: 200, audience: "gm", panels: [

    /* ---- the Grade and the working band ------------------------------------- */
    { id: "gmt-grades", title: "Grades & the Working Band", tag: "GRADE 1 TO 5", order: 10, when: hasT("grades"), build: function (ctx, K) {
      var t = T();
      return [
        K.el("div", null, t.grades.map(function (g) { return K.ruleBlock("Grade " + g.g, g.reads, "Matched crew: " + g.crew); })),
        t.workingBand ? K.ruleBlock("Working Band", t.workingBand) : null
      ];
    } },

    /* ---- the Standard Threat Array ------------------------------------------ */
    { id: "gmt-array", title: "The Standard Threat Array", tag: "BY GRADE", order: 20, when: hasT("array"), build: function (ctx, K) {
      var t = T();
      return [
        K.entry("attack-defense-and-vitality", "Attack, Defense and Vitality", [
          K.subTitle("Attack, Defense and Vitality"),
          K.refTable(["Grade", "Attack", "Save DC", "Defense", "Vitality", "DR"], t.array.map(function (r) {
            return ["G" + r.g, fmt(r.attack), String(r.dc), String(r.defense), String(r.vitality), r.drLow + " to " + r.drHigh];
          }), [0])
        ]),
        K.entry("damage-saves-and-xp", "Damage, Saves and XP", [
          K.subTitle("Damage, Saves and XP"),
          K.refTable(["Grade", "Damage a Round", "Attacks", "Strong Save", "Weak Save", "XP"], t.array.map(function (r) {
            return ["G" + r.g, "~" + r.damage, r.attacks, fmt(r.strong), fmt(r.weak), String(r.xp)];
          }), [0])
        ]),
        K.note("Damage a Round is the threat's whole output on a good turn, before the crew's DR, spent as the Attacks column says. Designation and Role adjustments apply on top of the row.")
      ];
    } },

    /* ---- Designations: the blurbs and the modifiers -------------------------- */
    { id: "gmt-designations", title: "Designations", tag: "MINION · STANDARD · ELITE · SOLO", order: 30, when: hasT("designations"), build: function (ctx, K) {
      var t = T();
      function vit(d) {
        if (d.vitalityByGrade) return byGrade(d.vitalityByGrade) + " by Grade";
        return typeof d.vitalityMult === "number" ? times(d.vitalityMult) : "as the Array";
      }
      function dmg(d) {
        if (typeof d.damageMultLow === "number") return times(d.damageMultLow) + " to " + times(d.damageMultHigh);
        return typeof d.damageMult === "number" ? times(d.damageMult) : "as the Array";
      }
      function xp(d) { return d.xpByGrade ? byGrade(d.xpByGrade) : "as the Array"; }
      var solo = t.designations.filter(function (d) { return d.key === "solo"; })[0];
      var minion = t.designations.filter(function (d) { return d.key === "minion"; })[0];
      return [
        K.el("div", null, t.designations.map(function (d) { return K.ruleBlock(d.name, d.blurb || ""); })),
        K.entry("designation-modifiers", "Designation Modifiers", [
          K.subTitle("Designation Modifiers"),
          K.refTable(["Designation", "Vitality", "Defense", "Save DC", "Damage", "XP by Grade"], t.designations.map(function (d) {
            return [d.name, vit(d), typeof d.defense === "number" ? fmt(d.defense) : "+0", typeof d.dc === "number" ? fmt(d.dc) : "+0", dmg(d), xp(d)];
          }), [0])
        ]),
        minion && minion.noDefensiveImpulse ? K.note("A Minion's Vitality is its own number by Grade, not a share of the Array's, and a Minion gets no defensive Impulse.") : null,
        solo && solo.surgesByGrade ? K.note("A Solo also carries Surges (" + byGrade(solo.surgesByGrade) + " a round by Grade), one defensive Impulse per Freelancer turn, Unshakable, a Breakpoint below half Vitality, and one findable weakness: see Running Solos.") : null
      ];
    } },

    /* ---- Roles --------------------------------------------------------------- */
    { id: "gmt-roles", title: "Roles", tag: "WHAT IT DOES WITH ITS NUMBERS", order: 40, when: hasT("roles"), build: function (ctx, K) {
      var t = T();
      return [
        t.rolesIntro ? K.note(t.rolesIntro) : null,
        K.el("div", null, t.roles.map(function (r) { return K.ruleBlock(r.name, r.text, roleAdjust(r), { conditions: true }); }))
      ];
    } },

    /* ---- the Ability Menu, by Role ------------------------------------------- */
    { id: "gmt-abilities", title: "The Ability Menu", tag: "BY ROLE", order: 45, when: hasT("abilityGroups"), build: function (ctx, K) {
      var t = T();
      return t.abilityGroups.map(function (grp) {
        var label = grp.role === "anything" ? "Any Role" : nameOf(t.roles, grp.role);
        return [K.subTitle(label)].concat((grp.abilities || []).map(function (a) {
          return K.ruleBlock(a.name, a.text, a.cost || null, { conditions: true });
        }));
      });
    } },

    /* ---- the Threat Conventions and the optional Morale rule ------------------ */
    { id: "gmt-conventions", title: "Threat Conventions", tag: "EVERY THREAT · MORALE", order: 50, when: hasT("conventions"), build: function (ctx, K) {
      var t = T();
      return [
        K.el("div", null, t.conventions.map(function (c) {
          var s = splitLead(c);
          return K.ruleBlock(s.name, s.text, null, { conditions: true });
        })),
        t.morale ? K.subTitle("GM Guidance") : null,
        t.morale ? K.ruleBlock("Morale", t.morale, "OPTIONAL", { conditions: true }) : null
      ];
    } },

    /* ---- Threat initiative and Running Solos ---------------------------------- */
    { id: "gmt-solos", title: "Initiative & Running Solos", tag: "INITIATIVE · SURGES · BREAKPOINT", order: 60,
      when: function () { var t = T(); return !!(t && (t.runningSolos || t.initiative)); }, build: function (ctx, K) {
      var t = T(), I = t.initiative, R = t.runningSolos;
      var out = [];
      if (I) {
        var rows = [["Base", "Grade " + fmt(I.base)]];
        Object.keys(I.byDesignation || {}).forEach(function (k) { rows.push([nameOf(t.designations, k), fmt(I.byDesignation[k])]); });
        Object.keys(I.byRole || {}).forEach(function (k) { rows.push([nameOf(t.roles, k), fmt(I.byRole[k])]); });
        out.push(K.entry("threat-initiative", "Threat Initiative", [
          K.subTitle("Threat Initiative"),
          K.refTable(["Initiative", "Adjustment"], rows, [0]),
          // the "Initiative" alias peeks the Freelancer roll (Caliber plus a modifier), which threats do not use
          K.note("A threat's Initiative is the Base plus its Designation's and Role's adjustments, rolled as d20 plus the number.", { self: "ref-round/combat-sequence" }),
          I.note ? K.proseBlock(I.note) : null
        ]));
      }
      if (R) {
        out.push(K.subTitle(R.title || "Running Solos"));
        if (R.intro) out.push(K.proseBlock(R.intro));
        (R.rules || []).forEach(function (r) { out.push(K.ruleBlock(r.name, r.text, r.tag ? "(" + r.tag + ")" : null, { conditions: true })); });
      }
      return out;
    } },

    /* ---- the Bestiary's rules prose ------------------------------------------
       The chapter intro, the category intros, the hunt procedure, the Species
       Templates' rule and the Hostile Vehicles' rule. The statblocks, the
       templates' traits and the vehicle profiles are catalogs: they stay on the
       Bestiary tab. */
    { id: "gmt-bestiary", title: "The Bestiary", tag: "INTRO · HUNTS · TEMPLATES · VEHICLES", order: 70,
      when: function () { return !!B(); }, build: function (ctx, K) {
      var b = B(), out = [];
      var intro = b.intro || [];
      if (intro[0]) out.push(K.ruleBlock("Using the Bestiary", intro[0]));
      if (intro[1]) out.push(K.ruleBlock("Variants", intro.slice(1).join("\n\n")));
      if ((b.categories || []).length) {
        out.push(K.subTitle("The Categories"));
        b.categories.forEach(function (c) { if (c.intro) out.push(K.ruleBlock(c.name, c.intro)); });
      }
      var H = b.huntProcedure;
      if (H) {
        // each beat is a named line, so "gmt-bestiary/signs" opens the one beat
        var lines = [H.lead || ""].concat((H.beats || []).map(function (x) { return "- " + x.name + ": " + x.text; }));
        if (H.closing) lines.push(H.closing);
        out.push(K.subTitle("Cryptid Hunts"));
        out.push(K.ruleBlock(H.title || "Running a hunt", lines.join("\n")));
      }
      var S = b.speciesTemplates;
      if (S) {
        out.push(K.subTitle("Species Templates"));
        out.push(K.ruleBlock(S.title || "Species Templates", (S.intro || []).concat(S.footer ? [S.footer] : []).join("\n\n")));
      }
      var V = b.vehicles;
      if (V) {
        out.push(K.subTitle("Hostile Vehicles"));
        // the Threat pilots rule is a named line, "gmt-bestiary/threat-pilots"
        out.push(K.ruleBlock(V.title || "Hostile Vehicles", (V.intro || []).join("\n\n") +
          ((V.rules || []).length ? "\n" + V.rules.map(function (r) { return "- " + r.name + ": " + r.text; }).join("\n") : "")));
      }
      if (out.length) out.push(K.note("The statblocks, the templates' traits and the vehicle profiles are on the Bestiary tab."));
      return out;
    } }
  ] });

  /* The names the book and the GM data use for these panels. Each is a phrase,
     matched in any case. "Threat Conventions" and "The Standard Threat Array"
     are panel titles already; the array is also cited without its article. */
  EN.codexView.terms({
    "Standard Threat Array": "gmt-array",
    "working band": "gmt-grades/working-band",
    "Running Solos": "gmt-solos",
    "Designation Modifiers": "gmt-designations/designation-modifiers",
    "Ability Menu": "gmt-abilities",
    "Cryptids of Elysium": "gmt-bestiary/running-a-hunt",
    "Running a hunt": "gmt-bestiary/running-a-hunt",
    "Species Templates": "gmt-bestiary/species-templates",
    "Hostile Vehicles": "gmt-bestiary/hostile-vehicles",
    "Threat pilots": "gmt-bestiary/threat-pilots"
  });
})();
