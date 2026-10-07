/* ===========================================================================
   ELYSIUM NIGHTS · GM Engine
   THE resolver for threat statblocks, threat initiative, initiative order, XP
   and the encounter budget. No DOM and no writes. Nothing else in the app
   computes a threat number.

   ONE READER BREAKS "NO CHARACTER", ON PURPOSE: crew() reads the roster and the
   Table's crew rows to answer "who is the crew and what is their Caliber". It
   only reads, through EN.store and EN.gmStore, and it lives here so the
   Encounters budget, the Job Board's Grade and Payroll's pay grid all ask one
   function and cannot disagree about the crew.

   Kept out of engine.js deliberately. That file is over 4,000 lines about
   deriving a CHARACTER, and a threat shares no field with one: no Vigor, no
   Wounds, no Resilience, no proficiency tier, no Caliber. A player build should
   not pay to load the GM's math.
   =========================================================================== */
window.EN = window.EN || {};

EN.gmEngine = (function () {

  function row(grade) {
    var T = EN.threats || {};
    return ((T.array || []).filter(function (r) { return r.g === grade; })[0]) || null;
  }
  function designation(key) {
    return ((EN.threats && EN.threats.designations) || []).filter(function (d) { return d.key === key; })[0] || null;
  }
  function role(key) {
    return ((EN.threats && EN.threats.roles) || []).filter(function (r) { return r.key === key; })[0] || null;
  }

  /* FLOOR, and never below 1. Ruled 2026-09-19: the Roles table's percentages
     round DOWN, which is what the page prints everywhere. A Grade 2 Standard on a
     -25 percent Role is 30 x 0.75 = 22.5 and prints 22, matching Street Shaper,
     Gutter Hacker and Sentry Turret; every die average in the Bestiary rounds
     down too, without exception. The Roles intro now says so in words.

     This used to round half UP, and the comment here argued that a Grade 1
     Minion's 6 x 0.75 = 4.5 should not become 4. The author has considered that
     and accepted it: such a Minion reads 4. No compensating floor is added.

     The Math.max(1, ...) is NOT that compensation and stays. It catches a
     degenerate build computing to 0, where the answer is not a rounding question:
     a threat at 0 Vitality is not a threat. Nothing in the printed table reaches
     it, so it never fires on a real Grade. */
  function vit(n) { return Math.max(1, Math.floor(n)); }

  function own(o, k) { return !!o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k); }

  /* ---- THREAT INITIATIVE ---------------------------------------------------
     The book's formula, GMH p55 (and the GM's Card, p130): a threat's
     Initiative is its whole bonus, rolled as d20 plus the number. Start at
     Grade + 2; Minions take 1 off, Bruisers take 1 off, Skirmishers add 1,
     Ghosts add 2. The numbers live in EN.threats.initiative and are READ here,
     never restated, so the data file stays the one place they are written.

     The adjustments STACK. The page lists them without saying so, and stacking
     is the only reading that uses every line: a Minion Bruiser is Grade + 0.
     The book's "nudge it a point either way for the fiction" is the GM's call
     and is left to the GM.

     Read defensively. With the initiative block absent this returns 0 and
     buildThreat falls back to an initiative of 0, which is what it did before
     the book printed a formula. */
  function initRule() {
    var I = EN.threats && EN.threats.initiative;
    return (I && typeof I === "object") ? I : null;
  }
  function initAdj(map, key) {
    return own(map, key) ? (Number(map[key]) || 0) : 0;
  }
  /* The modifier WITHOUT the Grade: base plus the Designation and Role
     adjustments. The caller adds the Grade, which is how buildThreat uses it. */
  function threatInit(designationKey, roleKey) {
    var I = initRule();
    if (!I) return 0;
    return (Number(I.base) || 0) + initAdj(I.byDesignation, designationKey) + initAdj(I.byRole, roleKey);
  }

  /* One initiative roll: d20 plus the threat's whole bonus, through the same
     d20 the rest of the app rolls. Returns the natural die, the modifier used and
     the total, so a toast can show where the number came from. */
  function rollInit(mod) {
    var m = Number(mod) || 0;
    var r = EN.engine.rollD20({ mods: [{ label: "Initiative", value: m }] });
    return { roll: r.nat, mod: m, total: r.total };
  }

  /* ---- XP ------------------------------------------------------------------
     What a threat is worth, GMH p55: "its price in the encounter budget and its
     award when defeated". A built block carries `xp` as a number. A Bestiary
     entry, or a Bestiary block on the Table (which carries the entry's `stats`),
     prints XP as a string, sometimes with commas ("1,000") and once with a
     sentence after it ("100, paid for a Nixie rehomed, never for a body."). The
     LEADING NUMBER is the price, commas removed, so the Nixie counts as 100. An
     initiative entry is unwrapped to its block. Anything else is worth 0. */
  function xpOf(x) {
    if (typeof x === "number") return isFinite(x) ? x : 0;
    if (!x || typeof x !== "object") return 0;
    if (typeof x.xp === "number" && isFinite(x.xp)) return x.xp;
    var st = x.stats;
    if (st && typeof st === "object" && own(st, "XP")) {
      var m = String(st.XP).match(/^\s*(\d[\d,]*)/);
      if (m) return parseInt(m[1].replace(/,/g, ""), 10) || 0;
    }
    if (x.block && typeof x.block === "object") return xpOf(x.block);
    return 0;
  }

  /* ---- THE CREW ------------------------------------------------------------
     Who the crew is and what their Caliber is, for budgets, Grades and pay.
     Ruled for this build (D4): the crew is whoever is on the Table if anyone is,
     else the FILED roster (records carrying meta.filedAt, the same test the
     Freelancer rail uses for a registered record); Caliber is the rounded
     average, half up, the same rounding the Threats tab's band warning uses.
     Both headcount and Caliber can be overridden.

     The book prices one crew Caliber times headcount (GMH p61) and does not say
     what to do with a mixed crew, which is why the average is a ruling and the
     override exists.

     opts (all optional):
       encounter  the encounter to read crew rows from; defaults to the live one
       headcount  an override, used when it is a whole number of 1 or more
       caliber    an override, used when it is a number; clamped to 1 to 5

     Returns { members: [{charId, name, caliber}], headcount, caliber, source,
     overridden: {headcount, caliber} }. `source` is "table", "roster" or "none".
     Caliber is ALWAYS a number from 1 to 5 so a budget never multiplies by
     nothing; with nobody found and no override it is 1 and source is "none",
     which a view should read as "no crew yet, ask the GM". A member whose
     record will not derive keeps its row with caliber null and is left out of
     the average. */
  function crewName(ch) {
    var n = ((ch.firstName || "") + " " + (ch.lastName || "")).trim();
    return n || ch.name || "Freelancer";
  }
  function crew(opts) {
    opts = opts || {};
    var roster = (EN.store && EN.store.roster && EN.store.roster()) || {};
    var enc = opts.encounter;
    if (!enc) { try { enc = EN.gmStore && EN.gmStore.get && EN.gmStore.get().encounter; } catch (e) { enc = null; } }

    var ids = [], seen = Object.create(null);
    function take(id) {
      if (typeof id !== "string" || seen[id] || !own(roster, id)) return;
      seen[id] = true;
      ids.push(id);
    }
    ((enc && enc.entries) || []).forEach(function (r) { if (r && r.kind === "crew") take(r.charId); });
    var source = ids.length ? "table" : "none";
    if (!ids.length) {
      Object.keys(roster).forEach(function (k) {
        var ch = roster[k];
        if (ch && ch.meta && ch.meta.filedAt) take(k);
      });
      if (ids.length) source = "roster";
    }

    var members = ids.map(function (id) {
      var ch = roster[id], cal = null;
      try { cal = EN.engine.derive(ch).caliber; } catch (e) { cal = null; }
      return { charId: id, name: crewName(ch), caliber: typeof cal === "number" ? cal : null };
    });
    var cals = members.filter(function (m) { return m.caliber !== null; }).map(function (m) { return m.caliber; });
    var avg = cals.length ? Math.round(cals.reduce(function (a, b) { return a + b; }, 0) / cals.length) : 1;

    var hcOver = Math.floor(Number(opts.headcount));
    var useHc = opts.headcount !== null && opts.headcount !== undefined && opts.headcount !== "" && isFinite(hcOver) && hcOver >= 1;
    var calOver = Math.round(Number(opts.caliber));
    var useCal = opts.caliber !== null && opts.caliber !== undefined && opts.caliber !== "" && isFinite(calOver);

    return {
      members: members,
      headcount: useHc ? hcOver : members.length,
      caliber: Math.max(1, Math.min(5, useCal ? calOver : avg)),
      source: source,
      overridden: { headcount: useHc, caliber: useCal }
    };
  }

  /* ---- THE BUDGET ----------------------------------------------------------
     GMH p61: a Freelancer's share is the Standard XP of the matching Grade, the
     share times the headcount is the Fair Fight budget, and the four
     difficulties scale it (Milk Run, Fair Fight, Hard Contract, Red Work). The
     shares and multipliers are EN.threats.budget's, read here and not restated.
     Worked example from the page: four Caliber 2 Freelancers, share 150, Fair
     Fight 600. */
  function budgetData() {
    var B = EN.threats && EN.threats.budget;
    return (B && typeof B === "object") ? B : { shareByCaliber: {}, difficulties: [] };
  }
  function clampCal(c) { return Math.max(1, Math.min(5, Math.round(Number(c)) || 1)); }
  // One Freelancer's share at a Caliber, clamped to the table's 1 to 5.
  function share(caliber) {
    var B = budgetData(), c = clampCal(caliber);
    return own(B.shareByCaliber, c) ? (Number(B.shareByCaliber[c]) || 0) : 0;
  }
  function difficulty(key) {
    return (budgetData().difficulties || []).filter(function (d) { return d && d.key === key; })[0] || null;
  }
  /* The XP budget as a number. An unknown or missing difficulty key prices as a
     Fair Fight (x1), the budget the book defines first and scales from. */
  function budget(caliber, headcount, diffKey) {
    var d = difficulty(diffKey || "fair");
    var mult = d ? (Number(d.mult) || 0) : 1;
    var hc = Math.max(0, Math.floor(Number(headcount) || 0));
    return Math.round(share(caliber) * hc * mult);
  }
  /* Which difficulty an XP spend has reached: the HIGHEST one whose budget it
     meets or beats, or null when it is under even a Milk Run. `past2x` is the
     book's line, "Past 2x, you're writing an ambush on purpose", read against
     the top multiplier in the data rather than a literal 2. `next` is the next
     difficulty up and the spend that reaches it, or null at the top.

     Returns { key, name, mult, base, spent, ratio, past2x, next }, where `base`
     is the Fair Fight budget and `ratio` is spent over base (0 with no base). */
  function tierFor(spent, caliber, headcount) {
    var s = Math.max(0, Number(spent) || 0);
    var base = budget(caliber, headcount, "fair");
    var diffs = (budgetData().difficulties || []).slice().sort(function (a, b) { return (a.mult || 0) - (b.mult || 0); });
    var reached = null, next = null, top = 0;
    diffs.forEach(function (d) {
      var at = Math.round(base * (Number(d.mult) || 0));
      if (base > 0 && s >= at) reached = d;
      else if (!next) next = { key: d.key, name: d.name, mult: d.mult, at: at };
      if ((Number(d.mult) || 0) > top) top = Number(d.mult) || 0;
    });
    return {
      key: reached ? reached.key : null,
      name: reached ? reached.name : null,
      mult: reached ? reached.mult : 0,
      base: base,
      spent: s,
      ratio: base > 0 ? s / base : 0,
      past2x: base > 0 && top > 0 && s > base * top,
      next: base > 0 ? next : null
    };
  }

  /* "BOD" and "WIT" become "Body and Wits", which is how the book prints them. */
  function attrNames(keys) {
    var all = (EN.rules && EN.rules.attributes) || [];
    var names = (keys || []).map(function (k) {
      var a = all.filter(function (x) { return x.key === k; })[0];
      return a ? a.name : k;
    });
    if (!names.length) return "";
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  }

  /* DAMAGE A ROUND, read off a printed statblock rather than generated.
     Ruled 2026-09-19: the figure is the attack count of the threat's STRONGEST
     single (Action) attack times that attack's true average. Three things are
     deliberately excluded, and each was an overcount before:

       - Alternative Actions. A second weapon, a tail, a tongue: those are other
         things the threat can do with its one Action, not extra damage in the
         same turn. Rustmaw's figure is the Bite, not Bite plus Tail Sweep.
       - On-hit riders. The Wetwork Operative's +1d8 from hiding and the Kettle
         Dog's +1d4 Fire while scalding are situational, so only the FIRST dice
         expression in a line is read.
       - Solo Surges. The book scopes a Solo's figure to its own turn and lists
         Surges separately. A Surge's cost is never "Action", so they fall out of
         the cost test rather than needing to be parsed around.

     "vs Defense" is the guard that makes a line an ATTACK rather than any Action
     that happens to carry dice, and it is worth being exact about what it decides,
     because the cost test above has already done most of the filtering. Surges and
     Breakpoints are out on cost, not on this. Gravity Well carries no dice at all.

     What this test actually excludes, across the 48 entries, is five Action lines
     that carry dice without the phrase: Feral Script's Corrupt and the #GRID
     Guardian's Purge, which are Node math with a Security Rating and System
     Integrity in place of Defense and Vitality, so a Vitality-budget figure would
     be a category error for them; the Lantern Shoal's Graze, which is automatic
     area damage with nothing rolled to hit; the Watchfire Master's Lamplight, a
     save whose dice land only on Entities and Manifestations; and the Ashrider
     Road Boss's Haymaker, which is one Maul attack at extra dice. Haymaker is a
     real attack that names its weapon instead of repeating the phrase, and
     leaving it out changes nothing: at 4d6+4 once it is below the Maul's two
     attacks at 2d6+4, so the Road Boss's figure is the Maul either way. All 56
     lines that DO carry the phrase are real attacks. */
  var ATK_COUNT = { one: 1, two: 2, three: 3, four: 4, five: 5 };

  function attackAvg(text) {
    var t = String(text || "");
    if (t.indexOf("vs Defense") === -1) return null;
    var d = t.match(/(\d+)d(\d+)\s*([+-]\s*\d+)?/);
    if (!d) return null;
    var n = parseInt(d[1], 10), faces = parseInt(d[2], 10);
    var flat = d[3] ? parseInt(d[3].replace(/\s+/g, ""), 10) : 0;
    var perHit = n * (faces + 1) / 2 + flat;
    var c = t.match(/^\s*(One|Two|Three|Four|Five) attacks?,/i);
    var count = c ? (ATK_COUNT[c[1].toLowerCase()] || 1) : 1;
    return { perHit: perHit, count: count, total: perHit * count };
  }

  /* The best single Action, or null when a threat prints no attack at all. Ties
     keep the first, which is the order the page prints them in. */
  function roundDamage(entry) {
    var best = null, bestName = "";
    ((entry && entry.abilities) || []).forEach(function (a) {
      if (!a || a.cost !== "Action") return;
      var r = attackAvg(a.text);
      if (!r) return;
      if (!best || r.total > best.total) { best = r; bestName = a.name || ""; }
    });
    if (!best) return null;
    return { total: best.total, perHit: best.perHit, count: best.count, from: bestName };
  }

  /* A true expectation, printed without a trailing ".0". Dice averages land on
     halves, so 23 stays "23" and 22.5 stays "22.5" rather than becoming 22 or 23.
     Ruled 2026-09-19: do not floor a per-hit average before multiplying it by an
     attack count, and where the UI needs a number per hit, show the decimal. */
  function fmtAvg(n) {
    if (typeof n !== "number" || !isFinite(n)) return "0";
    return (Math.round(n * 100) / 100).toString();
  }

  /* A target average into something printable. The book gives damage as "about
     15 on a good turn" rather than an expression, because what matters is the
     budget; this offers one legal way to spend it so the card has dice on it.
     d8s keep the spread reasonable at every Grade. */
  function damageDice(avg) {
    if (!(avg > 0)) return { text: "none", dice: "", flat: 0, avg: 0 };
    var n = Math.max(1, Math.round(avg / 4.5));           // a d8 averages 4.5
    var flat = Math.round(avg - n * 4.5);
    var text = n + "d8" + (flat > 0 ? " + " + flat : flat < 0 ? " - " + Math.abs(flat) : "");
    /* THE AVERAGE REPORTED IS THE DICE'S OWN, not the target that produced them.
       It used to echo back the requested figure, so a build asking for 21 printed
       "(avg 21)" while the dice it handed you were 5d8 - 1, which truly averages
       21.5. Ruled 2026-09-19: the app computes from the dice and shows the true
       expectation. fmtAvg keeps the .5 rather than hiding it. */
    var trueAvg = n * 4.5 + flat;
    return { text: text + " (avg " + fmtAvg(trueAvg) + ")", dice: n + "d8", flat: flat, avg: trueAvg };
  }

  /* ---- THE THREAT RESOLVER -------------------------------------------------
     ORDER IS LOAD BEARING AND THE STEPS DO NOT COMMUTE. Array base, then
     Designation, then Role, then rounding. Two traps live in that sentence:

     1. MINION VITALITY IS A REPLACEMENT, NOT A MULTIPLIER. A G3 Minion is 15,
        off its own table, not 60 percent of the array's 50. The Role percentage
        then applies to the 15. Multiply instead and every Minion is wrong by a
        different amount at every Grade.
     2. DEADSHOT'S +50 PERCENT LANDS ON ONE ATTACK, not on the round's damage
        budget. Applied globally it inflates a Solo's three attacks into
        something the book never priced.

     Worked example, Skirmisher Elite at G3: array Vitality 50, Elite doubles it
     to 100, Skirmisher takes 25 percent off, giving 75. Defense 14 plus 1 for
     Elite plus 1 for Skirmisher is 16. Save DC 14 plus 1 is 15. XP is the
     Elite column at G3, 500, not the array's 250 scaled by anything. */
  function buildThreat(o) {
    o = o || {};
    var g = Math.max(1, Math.min(5, o.grade || 1));
    var base = row(g);
    if (!base) return null;
    var des = designation(o.designation || "standard") || designation("standard");
    var rol = role(o.role || "gunhand");
    var why = {};

    // --- Vitality: base, then designation (replace OR multiply), then role
    var v = base.vitality;
    var vNote = "G" + g + " base " + v;
    if (des && des.vitalityByGrade) {
      v = des.vitalityByGrade[g];
      vNote = des.name + " table " + v;                   // a replacement, see above
    } else if (des && des.vitalityMult) {
      v = v * des.vitalityMult;
      vNote += ", " + des.name + " x" + des.vitalityMult + " = " + v;
    }
    if (rol && rol.vitalityMult) {
      var before = v;
      v = v * rol.vitalityMult;
      vNote += ", " + rol.name + " " + (rol.vitalityMult > 1 ? "+" : "") +
               Math.round((rol.vitalityMult - 1) * 100) + "% of " + before;
    }
    why.vitality = vNote + " = " + vit(v);

    // --- Defense and Save DC: flat steps only
    var def = base.defense, dNote = "G" + g + " base " + base.defense;
    if (des && des.defense) { def += des.defense; dNote += ", " + des.name + " " + EN.engine.fmtMod(des.defense); }
    if (rol && rol.defense) { def += rol.defense; dNote += ", " + rol.name + " " + EN.engine.fmtMod(rol.defense); }
    why.defense = dNote + " = " + def;

    var dc = base.dc;
    if (des && des.dc) dc += des.dc;
    if (rol && rol.saveDC) dc += rol.saveDC;

    // --- Damage: the round's whole output, then the one-attack concentration
    var dmg = base.damage, mNote = "G" + g + " base " + base.damage;
    if (des && des.damageMult) { dmg = dmg * des.damageMult; mNote += ", " + des.name + " x" + des.damageMult; }
    else if (des && des.damageMultLow) {
      dmg = dmg * des.damageMultLow;                       // the low end, so a build is never over-priced by default
      mNote += ", " + des.name + " x" + des.damageMultLow + " (the book allows up to x" + des.damageMultHigh + ")";
    }
    if (rol && rol.damageMult) { dmg = dmg * rol.damageMult; mNote += ", " + rol.name + " x" + rol.damageMult; }
    var oneAttack = rol && rol.damageMultOneAttack ? rol.damageMultOneAttack : null;
    why.damage = mNote + " = about " + Math.floor(dmg) + " a round" +
                 (oneAttack ? ", concentrated in one attack at x" + oneAttack : "");

    // --- Speed: 6 unless the Role says otherwise
    var speed = (rol && rol.speed) || 6;

    // --- Initiative: Grade + 2, then the Designation and Role steps (see threatInit)
    var IR = initRule();
    var init = 0;
    if (IR) {
      var desKey = des ? des.key : "standard", rolKey = rol ? rol.key : "";
      var dAdj = initAdj(IR.byDesignation, desKey), rAdj = initAdj(IR.byRole, rolKey);
      init = g + threatInit(desKey, rolKey);
      why.init = "G" + g + " + " + (Number(IR.base) || 0) +
                 (dAdj ? ", " + (des ? des.name : desKey) + " " + EN.engine.fmtMod(dAdj) : "") +
                 (rAdj ? ", " + (rol ? rol.name : rolKey) + " " + EN.engine.fmtMod(rAdj) : "") +
                 " = " + EN.engine.fmtMod(init);
    }

    /* SAVES NAME REAL ATTRIBUTES. The book prints "+5 Body and Wits, +1 others",
       never a placeholder word: the strong save is a two-speed split and the strong
       half has to say WHICH attributes it covers or the line means nothing at the
       table. Which ones is an authoring choice, so the caller passes them and the
       role hint is only a starting point. */
    var strongAttrs = (o.strong && o.strong.length ? o.strong
      : ((EN.threats.saveHintByRole || {})[rol ? rol.key : ""] || ["BOD"])).slice(0, 2);
    var savesText = EN.engine.fmtMod(base.strong) + " " + attrNames(strongAttrs) +
                    ", " + EN.engine.fmtMod(base.weak) + " others";

    var xp = des && des.xpByGrade ? des.xpByGrade[g] : base.xp;

    var atk = [];
    var main = damageDice(oneAttack ? dmg * oneAttack : dmg);
    atk.push({ label: oneAttack ? "Aimed attack" : "Attack", toHit: base.attack, vs: "Defense",
               range: "melee or as the fiction dictates", dice: main.text });

    return {
      name: o.name || "",
      grade: g,
      designation: des ? des.key : "standard",
      designationName: des ? des.name : "Standard",
      role: rol ? rol.key : null,
      roleName: rol ? rol.name : "",
      roleText: rol ? rol.text : "",
      size: o.size || "Medium",
      type: o.type || "Human",
      identity: "Grade " + g + " " + (des ? des.name : "Standard") +
                (rol ? ", " + rol.name : "") + ". " + (o.size || "Medium") + " " + (o.type || "Human") + ".",

      defense: def,
      dr: { low: base.drLow, high: base.drHigh },
      vitality: vit(v),
      speed: speed,
      /* The whole Initiative bonus from the book's formula (GMH p55), and the
         same number again as initMod, which is the field the Table rerolls from
         and breaks ties on. 0 only when EN.threats.initiative is missing. */
      init: init,
      initMod: init,
      passivePerception: 10 + base.weak,
      saves: { strong: base.strong, weak: base.weak, attrs: strongAttrs, text: savesText },
      saveDC: dc,
      attackBonus: base.attack,
      /* Floored for the same reason as vit(), and on the same 2026-09-19 ruling:
         the page rounds every derived number down. A Grade 2 Controller is
         10 x 0.75 = 7.5 and reads 7, not 8. */
      damagePerRound: Math.floor(dmg),
      attacksNote: base.attacks,
      attacks: atk,

      // Solo economy, absent on everything else
      surges: des && des.surgesByGrade ? des.surgesByGrade[g] : 0,
      noDefensiveImpulse: !!(des && des.noDefensiveImpulse),
      unshakable: !!(des && des.unshakable),
      breakpoint: !!(des && des.breakpoint),
      needsWeakness: !!(des && des.weakness),

      trait: "", impulse: "", gear: "", resolve: null,
      xp: xp,
      why: why
    };
  }

  /* ---- INITIATIVE ORDER ----------------------------------------------------
     Returns a NEW sorted array and never sorts in place, so the stored entry
     list keeps insertion order and the acting order stays derived. A second,
     persisted copy of the order would be a second writer for one fact.

     The final tie-break is the entry id, NOT a random draw. Every keystroke in
     this view calls EN.app.render(), and ui.armButton re-renders just to arm, so
     a random tie-break would reshuffle the rail while the GM was reading it. If
     they want a coin flip they nudge the number, which is what the book's own
     "they roll off" amounts to at the table. */
  function order(entries) {
    return (entries || []).slice().sort(function (a, b) {
      if ((b.init || 0) !== (a.init || 0)) return (b.init || 0) - (a.init || 0);
      if ((b.initMod || 0) !== (a.initMod || 0)) return (b.initMod || 0) - (a.initMod || 0);
      return String(a.id) < String(b.id) ? -1 : 1;
    });
  }

  /* True when two entries are still tied after both book tie-breaks, which is
     the case the book hands back to the table ("they roll off"). Surfaced in the
     view rather than resolved here, because the app does not get to decide it. */
  function tied(entries) {
    var o = order(entries), out = [];
    for (var i = 1; i < o.length; i++) {
      if ((o[i].init || 0) === (o[i - 1].init || 0) && (o[i].initMod || 0) === (o[i - 1].initMod || 0)) {
        if (out.indexOf(o[i - 1].id) === -1) out.push(o[i - 1].id);
        out.push(o[i].id);
      }
    }
    return out;
  }

  /* Advance the cursor. `activeId` is an ENTRY ID and never an index: editing an
     initiative re-sorts the list, and an index would then point at a different
     creature mid-round. Returns {activeId, round, wrapped}. */
  function advance(enc) {
    var o = order((enc && enc.entries) || []);
    if (!o.length) return { activeId: null, round: enc ? enc.round : 0, wrapped: false };
    var idx = -1;
    for (var i = 0; i < o.length; i++) { if (o[i].id === enc.activeId) { idx = i; break; } }
    if (idx === -1) return { activeId: o[0].id, round: Math.max(1, enc.round || 0), wrapped: false };
    var next = idx + 1;
    if (next >= o.length) return { activeId: o[0].id, round: (enc.round || 0) + 1, wrapped: true };
    return { activeId: o[next].id, round: enc.round || 1, wrapped: false };
  }

  return {
    buildThreat: buildThreat, damageDice: damageDice,
    attackAvg: attackAvg, roundDamage: roundDamage, fmtAvg: fmtAvg,
    order: order, tied: tied, advance: advance,
    // threat initiative from the book's formula, and the one roll for it
    threatInit: threatInit, rollInit: rollInit,
    // XP, the crew, and the encounter budget
    xpOf: xpOf, crew: crew, share: share, budget: budget, tierFor: tierFor
  };
})();
