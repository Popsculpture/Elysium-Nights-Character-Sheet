/* ===========================================================================
   ELYSIUM NIGHTS · GM Engine
   THE resolver for threat statblocks and initiative order. Pure: no DOM, no
   storage, no character. Nothing else in the app computes a threat number.

   Kept out of engine.js deliberately. That file is 3,700 lines about deriving a
   CHARACTER, and a threat shares no field with one: no Vigor, no Wounds, no
   Resilience, no proficiency tier, no Caliber. A player build should not pay to
   load the GM's math, and the bestiary in stage 2 has an obvious home here.
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

     What this test actually excludes is three Action lines that carry dice without
     the phrase: Feral Script's Corrupt and the #GRID Guardian's Purge, which are
     Node math with a Security Rating and System Integrity in place of Defense and
     Vitality, so a Vitality-budget figure would be a category error for them; and
     the Lantern Shoal's Graze, which is automatic area damage with nothing rolled
     to hit. All 35 lines that DO carry the phrase are real attacks. */
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
      init: 0,                                  // the GM sets this; the book gives no formula for threats
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
    order: order, tied: tied, advance: advance
  };
})();
