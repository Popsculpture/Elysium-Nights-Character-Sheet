/* ===========================================================================
   ELYSIUM NIGHTS · Character Engine
   Pure derivation layer. Given a character record, computes every number the
   sheet needs. No DOM, no storage. This is what every tab reads from.
   =========================================================================== */
window.EN = window.EN || {};

EN.engine = (function () {
  var R = EN.rules;

  /* ---- small helpers ---------------------------------------------------- */
  function mod(score) { return R.modifier(score); }
  function caliber(level) { return R.caliberByLevel[clamp(level, 1, R.maxLevel)] || 1; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function fmtMod(n) { return (n >= 0 ? "+" : "") + n; }
  /* A character's height is stored in decimal feet (d.heightFt, 5.5) and shown as feet and
     inches ("5 ft 6 in"), rounded to the nearest inch. Every surface that prints a character's
     own height asks this; the Size band tables in the rules data keep their own wording. */
  function fmtFtIn(ft) {
    var n = Number(ft);
    if (ft == null || ft === "" || isNaN(n)) return "";
    var t = Math.round(n * 12);
    return Math.floor(t / 12) + " ft " + (t % 12) + " in";
  }
  /* One conditional Passive Check line for a narrow Skill Focus: { aspect, score } from a
     skill's passiveFocus (or grid.passiveSystemsFocus) becomes "16 vs access-control systems
     (Focus)". The aspect's leading capital drops so it reads as part of the sentence, unless
     the first word looks like an acronym or a name with more capitals in it ("AI cores").
     `bare` leaves the score off ("vs access-control systems (Focus)") for a table that
     prints the score in its own column. */
  function fmtPassiveFocus(pf, bare) {
    var a = String((pf && pf.aspect) || "").trim();
    var w = a.split(/\s+/)[0] || "";
    if (w.length > 1 && w.slice(1) === w.slice(1).toLowerCase()) a = a.charAt(0).toLowerCase() + a.slice(1);
    return (bare ? "" : pf.score + " ") + "vs " + a + " (Focus)";
  }

  /* THE INITIATIVE RESOLVER. Added 2026-08-31, because the quantity had no owner and the three
     surfaces that showed it disagreed. The Freelancer tab summed it inline from four parts; the
     print sheet and the PDF each summed a DIFFERENT, shorter list, dropping the lineage grant,
     the chrome bonus and the condition delta. A Freelancer with a Reflex Booster read one number
     on screen and a lower one on their own printed sheet.

     `condInit` is passed in rather than read, because the condition effect is assembled by
     combat.js and not here. That is also why a printed sheet correctly passes 0: a sheet is a
     snapshot of the character, and Drowsy's -2 belongs to the moment, not to the record.

     Rule, PHB p. 58 Combat Sequence: "Roll d20 + Caliber + Agility Modifier or Wits Modifier.
     Highest acts first." The player picks Agility or Wits; Caliber is always added.

     2026-10-28 creation playtest (A1): `total` now CARRIES Caliber, so the number on every
     surface is the whole bonus a d20 is added to (Kest, Level 1: 1 + the higher modifier).
     `bonus` is the old Caliber-less sum, kept for any reader that adds Caliber itself.
     The modifier is the player's pick, stored on the character as `initAttr` ("AGI" or "WIT",
     carried here as d.initChoice); with no pick it defaults to the higher (Agility on a tie).
     `label` is the sheet's text, for example "+4 (Wits)". A tie between two combatants goes to
     the higher modifier USED, which is `mod`.

     The Suit's Risk Assessment ("use your Wits Modifier instead of Agility when rolling
     Initiative") is the base rule's own Wits option; `overrides` names it as a source. Cold
     Reader ("Edge on Initiative checks made during social Encounters, and you can use your
     Presence Modifier in place of Wits for Initiative in such Encounters") turns on what kind
     of Encounter it is, which the sheet cannot see, so it is the separate `social` reading and
     never folded into `total`. */
  function initiative(d, condInit) {
    var attrs = d.attributes || {};
    var agi = (attrs.AGI || {}).mod || 0;
    var wit = (attrs.WIT || {}).mod || 0;
    var pre = (attrs.PRE || {}).mod || 0;
    var best = wit > agi ? "WIT" : "AGI";
    var choice = (d.initChoice === "AGI" || d.initChoice === "WIT") ? d.initChoice : null;
    var attr = choice || best;
    var useWit = attr === "WIT";
    var cal = typeof d.caliber === "number" ? d.caliber : 0;
    var lineage = (d.lineageInit && d.lineageInit.caliber) || 0;
    var cyber = d.cyberInit || 0;
    var cond = condInit || 0;
    /* Edge on Initiative rolls comes from the lineage (Tuned Synapses) and from class features
       (First Responder, Veteran Instincts). `edgeSources` names each so the card can say where
       the Edge comes from; the Edge itself never stacks. */
    var edgeSources = (d.initEdgeSources || []).slice();
    var m = useWit ? wit : agi;
    var bonus = m + lineage + cyber + cond;
    var total = cal + bonus;
    var overrides = [];
    if (d.initRiskAssessment) overrides.push({ source: "Risk Assessment", text: "Wits in place of Agility" });
    var social = null;
    if (d.initColdReader) {
      overrides.push({ source: "Cold Reader", text: "Presence in place of Wits, with Edge, in social Encounters" });
      // Presence stands in for Wits only: a pick of Agility keeps Agility, a pick of Wits
      // reads Presence, and with no pick the higher of the two again
      var sAttr = choice === "AGI" ? "AGI" : choice === "WIT" ? "PRE" : (pre > agi ? "PRE" : "AGI");
      var sMod = sAttr === "PRE" ? pre : agi;
      var sTotal = cal + sMod + lineage + cyber + cond;
      social = { attr: sAttr, attrName: sAttr === "PRE" ? "Presence" : "Agility", mod: sMod, total: sTotal, edge: true,
                 source: "Cold Reader", label: fmtMod(sTotal) + " (" + (sAttr === "PRE" ? "Presence" : "Agility") + ")" };
    }
    return {
      attr: attr,
      attrName: useWit ? "Wits" : "Agility",
      mod: m,
      best: best, chosen: !!choice, agi: agi, wit: wit,
      caliber: cal, lineage: lineage, cyber: cyber, cond: cond,
      edge: !!(d.lineageInit && d.lineageInit.edge) || edgeSources.length > 0,
      edgeSources: edgeSources,
      bonus: bonus,
      total: total,
      label: fmtMod(total) + " (" + (useWit ? "Wits" : "Agility") + ")",
      overrides: overrides,
      social: social
    };
  }


  function getClass(key) { return (EN.classes || {})[key] || null; }
  function getSpecies(key) { return (EN.species || []).find(function (s) { return s.key === key; }) || null; }
  function getLineage(speciesKey, lineageKey) {
    var sp = getSpecies(speciesKey);
    if (!sp) return null;
    return (sp.lineages || []).find(function (l) { return l.key === lineageKey; }) || null;
  }
  function getBackground(key) { return (EN.backgrounds || []).find(function (b) { return b.key === key; }) || null; }
  function getSubclass(cls, key) {
    if (!cls) return null;
    return (cls.subclasses || []).find(function (s) { return s.key === key; }) || null;
  }

  // Find an attribute key referenced in a chunk of formula text ("Caliber + Tech Modifier")
  function attrInText(text) {
    if (!text) return null;
    for (var name in R.attrNameToKey) {
      if (new RegExp("\\b" + name + "\\b").test(text)) return R.attrNameToKey[name];
    }
    return null;
  }
  // Parse a save-focus string like "Tech and Mystique" into attribute keys
  function parseAttrKeys(text) {
    var keys = [];
    if (!text) return keys;
    for (var name in R.attrNameToKey) {
      if (new RegExp("\\b" + name + "\\b").test(text)) keys.push(R.attrNameToKey[name]);
    }
    return keys;
  }

  /* ---- skill grant resolution (background + class are a derived floor) --- */
  function skillKeyOf(name) {
    if (!name) return null;
    var s = R.skillByName[String(name).trim().toLowerCase()];
    return s ? s.key : null;
  }
  function parseSkillGrants(arr) {
    var granted = [], choices = [];
    (arr || []).forEach(function (entry) {
      var k = skillKeyOf(entry);
      if (k) { granted.push(k); return; }
      if (/choose/i.test(entry) || /\(/.test(entry)) {
        var inside = (entry.match(/\(([^)]*)\)/) || [])[1] || entry.replace(/.*choose\s+\w+/i, "");
        var opts = inside.split(/,|\bor\b/).map(function (x) { return skillKeyOf(x); }).filter(Boolean);
        if (opts.length) choices.push({ raw: entry, options: opts });
      }
    });
    return { granted: granted, choices: choices };
  }
  /* ---- Subclass proficiency grants ------------------------------------------
     A subclass feature that prints "You gain Proficiency with ..." carries a `grants` object:
       { tools: [...], armor: [...], weapons: [...], vehicles: [...],   category names
         skills: [...],                                                   skill names
         skillChoice: [skillA, skillB] }                                  "(your choice)"
     read here for every such feature the character has reached (level <= ch.level). Each is a
     free "proficient" floor exactly like a Class or Background grant, so Training Points already
     spent on the same category are returned (cost is measured above the floor). The picks for a
     skillChoice live in ch.subclassSkillPicks[featureName]. Not folded into the Overlapping
     Starting Proficiencies map: that rule is about Background and Class only. */
  function subclassGrantFeatures(ch) {
    var cls = getClass(ch && ch.class);
    var sub = cls ? getSubclass(cls, ch.subclass) : null;
    var level = clamp((ch && ch.level) || 1, 1, R.maxLevel);
    if (!sub || !sub.features) return [];
    return sub.features.filter(function (f) { return f && f.grants && (f.level || 1) <= level; });
  }
  function skillKeyOfPick(v) {
    if (typeof v !== "string" || !v) return null;
    return R.skillByKey[v] ? v : skillKeyOf(v);
  }
  // The skill key a feature's skillChoice resolved to, or null (no pick, or not one of its options)
  function subclassSkillPick(ch, f) {
    var opts = ((f.grants && f.grants.skillChoice) || []).map(skillKeyOf).filter(Boolean);
    var k = skillKeyOfPick(ownVal(ch && ch.subclassSkillPicks, f.name));
    return (k && opts.indexOf(k) !== -1) ? k : null;
  }
  /* The "(your choice)" skill grants the subclass still owes or has answered, for the builder:
     [{ feature, level, options: [{key,name}], pick: skillKey|null }] */
  function subclassGrantChoices(ch) {
    var out = [];
    subclassGrantFeatures(ch).forEach(function (f) {
      var sc = f.grants.skillChoice;
      if (!sc || !sc.length) return;
      var options = sc.map(function (n) { var k = skillKeyOf(n); return k ? { key: k, name: R.skillByKey[k].name } : null; }).filter(Boolean);
      if (options.length) out.push({ feature: f.name, level: f.level || 1, options: options, pick: subclassSkillPick(ch, f) });
    });
    return out;
  }
  // Returns { skillKey: 'proficient' } for every skill granted by background+class+subclass.
  function grantedSkills(ch) {
    var out = {};
    function add(k) { if (k) out[k] = "proficient"; }
    var bg = getBackground(ch.background);
    if (bg && bg.skills) {
      (bg.skills.granted || []).forEach(function (n) { add(skillKeyOf(n)); });
      if (ch.backgroundSkillChoice) add(ch.backgroundSkillChoice);
    }
    var cls = getClass(ch.class);
    if (cls && cls.startingProficiencies) {
      var g = parseSkillGrants(cls.startingProficiencies.skills);
      g.granted.forEach(add);
      (ch.classSkillChoices || []).forEach(add);
    }
    subclassGrantFeatures(ch).forEach(function (f) {
      (f.grants.skills || []).forEach(function (n) { add(skillKeyOf(n)); });
      if (f.grants.skillChoice) add(subclassSkillPick(ch, f));
    });
    return out;
  }

  /* ---- Training Points available at a level ----------------------------- */
  function trainingPointsTotal(level) {
    var t = 0;
    for (var lvl in R.trainingPointLevels) {
      if (level >= Number(lvl)) t += R.trainingPointLevels[lvl];
    }
    return t;
  }

  /* ---- Training Point economy (costs, level gates, prerequisites) -------
     Per the Training & Advancement rules:
       Gain Proficiency  : 1 TP, any level   (untrained -> proficient)
       Upgrade Expertise : 2 TP, level 6+    (proficient -> expertise)
       Upgrade Mastery   : 2 TP, level 10+   (expertise  -> mastery)
       Skill Focus       : 1 TP, level 3+,  requires Proficient+ in the parent
       Specialization    : 1 TP, level 6+,  requires Expertise+ in the parent (one per parent)
     Focus and Specialization attach to any of four parents: a Skill, a Weapon
     category, a Vehicle category, or a Tool Category (never Armor). A Free
     Skill Focus granted by an Overlapping Starting Proficiency costs 0 TP and
     ignores the level 3+ gate.
     Background/class grants form a free 'proficient' floor (not paid with TP).
     The numbers are READ from EN.rules.training.costs (data/rules.js), the same
     copy the #PRINT price strip and the Codex print, so the sheet can never
     advertise one price and charge another. The literals below are only the
     fallback for a missing or partial data row. */
  var STEP_COST = { proficient: 1, expertise: 2, mastery: 2 };  // cost to step INTO a tier
  var TIER_LEVEL_REQ = { proficient: 1, expertise: 6, mastery: 10 };
  var FOCUS_COST = 1, FOCUS_LEVEL_REQ = 3;
  var SPEC_COST = 1, SPEC_LEVEL_REQ = 6;
  ((R.training && R.training.costs) || []).forEach(function (c) {
    if (!c) return;
    var tp = typeof c.tp === "number" ? c.tp : null, lv = typeof c.level === "number" ? c.level : null;
    if (c.key === "focus") {
      if (tp !== null) FOCUS_COST = tp;
      if (lv !== null) FOCUS_LEVEL_REQ = lv;
    } else if (c.key === "spec") {
      if (tp !== null) SPEC_COST = tp;
      if (lv !== null) SPEC_LEVEL_REQ = lv;
    } else if (STEP_COST.hasOwnProperty(c.key)) {
      if (tp !== null) STEP_COST[c.key] = tp;
      if (lv !== null) TIER_LEVEL_REQ[c.key] = lv;
    }
  });

  function tierIdx(t) { return R.profOrder.indexOf(t); }
  function skillFloorTier(ch, key) { return grantedSkills(ch)[key] ? "proficient" : "untrained"; }
  function effectiveSkillTier(ch, key) {
    var stored = (ch.proficiencies && ch.proficiencies.skills && ch.proficiencies.skills[key]) || "untrained";
    var floor = skillFloorTier(ch, key);
    return tierIdx(stored) > tierIdx(floor) ? stored : floor;
  }
  // TP cost of a single skill's tier, measured ABOVE its free floor
  function skillTierCost(ch, key) {
    var floor = skillFloorTier(ch, key);
    var eff = effectiveSkillTier(ch, key);
    var cost = 0;
    for (var i = tierIdx(floor) + 1; i <= tierIdx(eff); i++) cost += STEP_COST[R.profOrder[i]] || 0;
    return cost;
  }
  /* ---- Gear proficiencies (weapons / armor / tools / vehicles) ----------
     Same tier ladder as skills. Class/background starting proficiencies form a
     free 'proficient' floor. Armor can be acquired but not upgraded. */
  function matchGearCat(bucket, text) {
    if (!text) return null;
    var list = (R.gear && R.gear[bucket]) || [];
    var low = String(text).toLowerCase();
    // longest match first so "Heavy Weapons" wins over "Weapons"
    var sorted = list.slice().sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < sorted.length; i++) { if (low.indexOf(sorted[i].toLowerCase()) !== -1) return sorted[i]; }
    return null;
  }
  function grantedGear(ch) {
    var out = { weapons: {}, armor: {}, tools: {}, vehicles: {} };
    function take(bucket, arr) {
      (arr || []).forEach(function (entry) {
        if (/choose/i.test(entry)) return;           // a player choice, not an automatic grant
        var c = matchGearCat(bucket, entry); if (c) out[bucket][c] = "proficient";
      });
    }
    var cls = getClass(ch.class);
    if (cls && cls.startingProficiencies) {
      var sp = cls.startingProficiencies;
      take("weapons", sp.weapons);
      take("armor", (sp.armor || []).concat(sp.shields || []));
      take("tools", sp.tools);
      take("vehicles", sp.vehicles);
    }
    var bg = getBackground(ch.background);
    if (bg && bg.proficiencies) {
      bg.proficiencies.forEach(function (line) {
        ["weapons", "armor", "tools", "vehicles"].forEach(function (b) {
          if (/choose/i.test(line)) return;
          var c = matchGearCat(b, line); if (c) out[b][c] = "proficient";
        });
      });
    }
    // "choose one" gear picks made on the Class step
    var gc = ch.classGearChoices || {};
    ["weapons", "armor", "tools", "vehicles"].forEach(function (b) {
      (gc[b] || []).forEach(function (name) {
        var c = matchGearCat(b, name); if (c) out[b][c] = "proficient";
      });
    });
    // "choose one" gear picks from the Background (options can span buckets)
    (ch.backgroundProfChoices || []).forEach(function (name) {
      ["weapons", "armor", "tools", "vehicles"].forEach(function (b) {
        var c = matchGearCat(b, name); if (c) out[b][c] = "proficient";
      });
    });
    // subclass features that print "You gain Proficiency with ..." (see subclassGrantFeatures)
    subclassGrantFeatures(ch).forEach(function (f) {
      ["weapons", "armor", "tools", "vehicles"].forEach(function (b) {
        (f.grants[b] || []).forEach(function (name) {
          var c = matchGearCat(b, name); if (c) out[b][c] = "proficient";
        });
      });
    });
    // Talents that print "choose one category ... you're Proficient with it" (TALENT_GEAR_PICK)
    activeTalents(ch).forEach(function (t) {
      var b = talentGearBucket(t.talent.key); if (!b) return;
      var c = talentGearPick(ch, t.talent.key); if (c) out[b][c] = "proficient";
    });
    // Talents that print a fixed category (TALENT_GEAR_GRANT): no pick, always Proficient
    activeTalents(ch).forEach(function (t) {
      var g = ownVal(TALENT_GEAR_GRANT, t.talent.key); if (!g) return;
      Object.keys(g).forEach(function (b) {
        (g[b] || []).forEach(function (name) { var c = matchGearCat(b, name); if (c) out[b][c] = "proficient"; });
      });
    });
    return out;
  }
  /* Talents whose text grants Proficiency with one named category. Street Chef (the Freelancer's
     Companion): "You gain Proficiency with Culinary Tools". A free "proficient" floor, like the
     picks below, so TP already spent on that category is returned. */
  var TALENT_GEAR_GRANT = { "street-chef": { tools: ["Culinary Tools"] } };
  /* Talents whose text grants Proficiency with one category of the player's choice. Asphalt Rider:
     "You gain Proficiency with one vehicle category of your choice." Junk Tinkerer: "Choose one
     Tool Category. You're Proficient with it". The pick lives in ch.talentGearPicks[talentKey] and
     is a free "proficient" floor, so TP already spent on that category is returned. */
  var TALENT_GEAR_PICK = { "asphalt-rider": "vehicles", "junk-tinkerer": "tools" };
  function talentGearBucket(talentKey) { return ownVal(TALENT_GEAR_PICK, talentKey) || null; }
  function talentGearOptions(talentKey) {
    var b = talentGearBucket(talentKey);
    return b ? ((R.gear && R.gear[b]) || []).slice() : null;
  }
  // The category the player picked for this Talent, or null (no pick, or not one of its options)
  function talentGearPick(ch, talentKey) {
    var b = talentGearBucket(talentKey); if (!b) return null;
    var pick = ownVal(ch && ch.talentGearPicks, talentKey);
    if (typeof pick !== "string" || !pick) return null;
    return ((R.gear && R.gear[b]) || []).indexOf(pick) !== -1 ? pick : matchGearCat(b, pick);
  }
  function gearFloorTier(ch, bucket, cat) { return grantedGear(ch)[bucket] && grantedGear(ch)[bucket][cat] ? "proficient" : "untrained"; }
  function gearStoredTier(ch, bucket, cat) {
    var p = ch.proficiencies && ch.proficiencies[bucket];
    return (p && !Array.isArray(p) && p[cat]) || "untrained";
  }
  function effectiveGearTier(ch, bucket, cat) {
    var f = gearFloorTier(ch, bucket, cat), s = gearStoredTier(ch, bucket, cat);
    return tierIdx(s) > tierIdx(f) ? s : f;
  }
  function gearTierCost(ch, bucket, cat) {
    var floor = gearFloorTier(ch, bucket, cat), eff = effectiveGearTier(ch, bucket, cat), cost = 0;
    for (var i = tierIdx(floor) + 1; i <= tierIdx(eff); i++) cost += STEP_COST[R.profOrder[i]] || 0;
    return cost;
  }

  // total TP spent across skills + focuses + specializations + gear
  // (a granted Free Skill Focus from an overlap costs nothing)
  function trainingSpent(ch) {
    var total = 0;
    R.skills.forEach(function (s) { total += skillTierCost(ch, s.key); });
    focusList(ch).forEach(function (f) { if (!f.granted) total += FOCUS_COST; });
    total += specList(ch).length * SPEC_COST;
    ["weapons", "armor", "tools", "vehicles"].forEach(function (bucket) {
      ((R.gear && R.gear[bucket]) || []).forEach(function (cat) { total += gearTierCost(ch, bucket, cat); });
    });
    return total;
  }
  function trainingBudget(ch) {
    var level = clamp(ch.level || 1, 1, R.maxLevel);
    var total = trainingPointsTotal(level);
    var spent = trainingSpent(ch);
    return { total: total, spent: spent, remaining: total - spent };
  }

  /* ---- Focus & Specialization (four parent types) ------------------------
     Records live on ch.skillFocuses / ch.specializations as
       { type: "skill"|"weapons"|"vehicles"|"tools", parent, aspect, granted }
     where parent is a skill key or an R.gear category name and aspect is the
     narrow slice the Focus covers ("Machine Pistol", "Motorcycle", "Surgical
     Support"). Armor is never a valid parent. `granted` marks a Free Skill
     Focus from an Overlapping Starting Proficiency (0 TP, no level gate).
     Legacy records were {skill, aspect}; store.migrate rewrites them, and
     normFocus tolerates any that slip through an old import. */
  function normFocus(f) {
    if (!f) return null;
    if (f.type) return f;
    return { type: "skill", parent: f.skill, aspect: f.aspect || "", granted: !!f.granted };
  }
  function focusList(ch) { return ((ch && ch.skillFocuses) || []).map(normFocus).filter(Boolean); }
  function specList(ch) { return ((ch && ch.specializations) || []).map(normFocus).filter(Boolean); }
  // A granted Focus whose Background/Class overlap no longer exists is inert
  // (the builder prunes it on the next Background/Class edit).
  /* A Focus whose aspect is still blank is PENDING, not yet a Focus: it counts for nothing (no
     Focus Caliber on a check, a pool or a Deep Run) until the player names the narrow aspect.
     The author's decision of 28 October 2026, made for the Free Skill Focus the overlap
     migration records with a blank aspect; the builder still shows it as owed, and a paid one
     still costs its Training Points (trainingSpent reads focusList, not this). */
  function focusNamed(f) { return !!(f && f.aspect && String(f.aspect).trim()); }
  function activeFocusList(ch) {
    var list = focusList(ch).filter(focusNamed);
    if (!list.some(function (f) { return f.granted; })) return list;
    var ov = overlapGrants(ch);
    return list.filter(function (f) {
      if (!f.granted) return true;
      return ov.some(function (o) { return o.type === f.type && o.parent === f.parent; });
    });
  }
  function focusesFor(ch, type, parent) {
    return activeFocusList(ch).filter(function (f) { return f.type === type && f.parent === parent; });
  }
  function specFor(ch, type, parent) {
    return specList(ch).find(function (f) { return f.type === type && f.parent === parent; }) || null;
  }
  function aspectMatches(aspect, name) {
    return !!aspect && !!name && String(aspect).trim().toLowerCase() === String(name).trim().toLowerCase();
  }
  // Weapon Focus/Specialization apply per aspect: the aspect names a specific
  // weapon type ("Machine Pistol") or a named Signature Weapon, matched
  // against the item's catalog name.
  function weaponFocus(ch, cat, itemName) {
    return focusesFor(ch, "weapons", cat).find(function (f) { return aspectMatches(f.aspect, itemName); }) || null;
  }
  function weaponSpec(ch, cat, itemName) {
    var sp = specFor(ch, "weapons", cat);
    return sp && aspectMatches(sp.aspect, itemName) ? sp : null;
  }
  // Signature Weapons: the On Hit riders stay locked at any proficiency tier until a
  // Weapon Focus names the specific weapon. The base attack, area projection included, works.
  function signatureUnlocked(ch, it) {
    if (!it || !it.signature) return true;
    return activeFocusList(ch).some(function (f) { return f.type === "weapons" && aspectMatches(f.aspect, it.name); });
  }
  /* The one-line status a locked Signature Weapon shows BESIDE its full effect text (ruling of
     2026-09-29: hiding the effect told the player the base attack did not work, and the book says
     it does). Empty when the weapon is unlocked or is not a Signature Weapon. The play sheet and
     the stash card both read it, so the two cannot word the lock differently. */
  function signatureStatus(ch, it) {
    if (!it || !it.signature || signatureUnlocked(ch, it)) return "";
    var tier = R.profTiers[effectiveGearTier(ch, "weapons", it.proficiency)];
    return tier && tier.snag ? "Untrained: attacks with Snag. On Hit riders locked."
                             : "On Hit riders locked until Weapon Focus (this weapon).";
  }

  /* ---- Overlapping Starting Proficiencies --------------------------------
     If Background and Class both grant the same Skill or gear category, the
     proficiency applies once (Proficient + Proficient = Proficient, never a
     tier raise) and the character gains one Free Skill Focus scoped to that
     parent. Armor never overlaps into a Focus. */
  function overlapGrants(ch) {
    var m = grantSourceMap(ch);
    var out = [];
    Object.keys(m.skills).forEach(function (k) {
      var s = m.skills[k];
      if (s.indexOf("Class") === -1 || s.indexOf("Background") === -1) return;
      var sk = R.skillByKey[k];
      out.push({ type: "skill", parent: k, label: sk ? sk.name : k });
    });
    Object.keys(m.gear).forEach(function (key) {
      var s = m.gear[key];
      if (s.indexOf("Class") === -1 || s.indexOf("Background") === -1) return;
      var bucket = key.split("|")[0], cat = key.split("|")[1];
      if (bucket === "armor") return;   // Armor is never a Focus parent
      out.push({ type: bucket, parent: cat, label: cat });
    });
    return out;
  }
  function grantedFocusFor(ch, type, parent) {
    return focusList(ch).find(function (f) { return f.granted && f.type === type && f.parent === parent; }) || null;
  }
  // overlaps whose Free Skill Focus has not been claimed yet
  function unresolvedOverlaps(ch) {
    return overlapGrants(ch).filter(function (o) { return !grantedFocusFor(ch, o.type, o.parent); });
  }

  /* ---- effective attribute scores (base + everything that bumps one) -------
     Base score plus one point per entry attrBumpSources reports: Universal Upgrade attr
     picks, and Talents whose opening bullet raises an attribute. The enumeration lives in
     attrBumpSources so that this summer and the builder's attribute matrix read the same
     list; the matrix used to re-derive the Universal Upgrade half on its own.
     opts.excludeTalent passes straight through, for checking a Talent's own attribute
     requirement without the point that Talent grants. */
  function effectiveAttributes(ch, opts) {
    var out = {};
    R.attributes.forEach(function (a) { out[a.key] = (ch.attributes && ch.attributes[a.key]) || 10; });
    var src = attrBumpSources(ch, opts);
    Object.keys(src).forEach(function (k) {
      if (out[k] == null) return;
      src[k].forEach(function () { out[k] = clamp(out[k] + 1, 1, R.hardCapMax); });
    });
    return out;
  }

  /* ---- Point-buy spend accounting ----------------------------------------
     The Flaw: at most ONE attribute may sit at 8 (refunding 2 points); 9 has no
     cost entry and is not a legal point-buy score. */
  function pointBuySpent(scores) {
    var spent = 0, ok = true, flaws = 0;
    R.attributes.forEach(function (a) {
      var s = scores[a.key];
      var c = R.pointBuy.costToReach[s];
      if (c == null) { ok = false; } else { spent += c; }
      if (s === 8) flaws++;
    });
    if (flaws > (R.pointBuy.maxFlaws || 1)) ok = false;
    return { spent: spent, remaining: R.pointBuy.pool - spent, valid: ok, flaws: flaws };
  }

  /* ---- Grant source tracking (Background vs Class duplicates) -----------
     Proficiency never stacks: if Background and Class both grant the same
     skill or gear category, the second source is simply discarded. These
     helpers let the UI surface that. */
  function grantSourceMap(ch) {
    var skills = {};   // skillKey -> ["Class","Background",...]
    var gear = {};     // "bucket|Category" -> [sources]
    function addSkill(k, src) { if (!k) return; (skills[k] = skills[k] || []).push(src); }
    function addGear(b, cat, src) { if (!cat) return; var key = b + "|" + cat; (gear[key] = gear[key] || []).push(src); }
    var bg = getBackground(ch.background);
    if (bg && bg.skills) {
      (bg.skills.granted || []).forEach(function (n) { addSkill(skillKeyOf(n), "Background"); });
      if (ch.backgroundSkillChoice) addSkill(ch.backgroundSkillChoice, "Background");
    }
    var cls = getClass(ch.class);
    if (cls && cls.startingProficiencies) {
      var sp = cls.startingProficiencies;
      parseSkillGrants(sp.skills).granted.forEach(function (k) { addSkill(k, "Class"); });
      (ch.classSkillChoices || []).forEach(function (k) { addSkill(k, "Class"); });
      [["weapons", sp.weapons], ["armor", (sp.armor || []).concat(sp.shields || [])], ["tools", sp.tools], ["vehicles", sp.vehicles]].forEach(function (pair) {
        (pair[1] || []).forEach(function (e) {
          if (/choose/i.test(e)) return;
          var c = matchGearCat(pair[0], e); if (c) addGear(pair[0], c, "Class");
        });
      });
      var gc = ch.classGearChoices || {};
      ["weapons", "armor", "tools", "vehicles"].forEach(function (b) {
        (gc[b] || []).forEach(function (n) { var c = matchGearCat(b, n); if (c) addGear(b, c, "Class"); });
      });
    }
    if (bg && bg.proficiencies) {
      bg.proficiencies.forEach(function (line) {
        if (/choose/i.test(line)) return;
        ["weapons", "armor", "tools", "vehicles"].forEach(function (b) {
          var c = matchGearCat(b, line); if (c) addGear(b, c, "Background");
        });
      });
    }
    (ch.backgroundProfChoices || []).forEach(function (n) {
      ["weapons", "armor", "tools", "vehicles"].forEach(function (b) {
        var c = matchGearCat(b, n); if (c) addGear(b, c, "Background");
      });
    });
    /* Subclass features and Talents that grant a proficiency are listed under their own names, so a
       chip's "Source:" tooltip says where the floor came from. They are deliberately NOT "Class" or
       "Background": the Overlapping Starting Proficiencies rule (overlapGrants, duplicateGrants) needs
       both of those two and nothing else. */
    subclassGrantFeatures(ch).forEach(function (f) {
      (f.grants.skills || []).forEach(function (n) { addSkill(skillKeyOf(n), "Subclass"); });
      if (f.grants.skillChoice) addSkill(subclassSkillPick(ch, f), "Subclass");
      ["weapons", "armor", "tools", "vehicles"].forEach(function (b) {
        (f.grants[b] || []).forEach(function (n) { var c = matchGearCat(b, n); if (c) addGear(b, c, "Subclass"); });
      });
    });
    activeTalents(ch).forEach(function (t) {
      var b = talentGearBucket(t.talent.key); if (!b) return;
      var c = talentGearPick(ch, t.talent.key); if (c) addGear(b, c, "Talent");
    });
    return { skills: skills, gear: gear };
  }
  // Unmade "choose one" options on the Background / Class steps.
  // Returns [{source:"Class"|"Background", what:"Skill choice"|"Tool choice"|…}]
  function pendingChoices(ch) {
    var out = [];
    var cls = getClass(ch.class);
    if (cls && cls.startingProficiencies) {
      var sp = cls.startingProficiencies;
      parseSkillGrants(sp.skills).choices.forEach(function (c, i) {
        if (!((ch.classSkillChoices || [])[i])) out.push({ source: "Class", what: "Skill choice" });
      });
      [["weapons", "Weapon"], ["armor", "Armor"], ["tools", "Tool"], ["vehicles", "Vehicle"]].forEach(function (p) {
        var arr = p[0] === "armor" ? (sp.armor || []).concat(sp.shields || []) : (sp[p[0]] || []);
        var idx = -1;
        arr.forEach(function (e) {
          if (!/choose/i.test(e)) return;
          idx++;
          if (!(((ch.classGearChoices || {})[p[0]]) || [])[idx]) out.push({ source: "Class", what: p[1] + " choice" });
        });
      });
    }
    var bg = getBackground(ch.background);
    if (bg) {
      if (bg.skills && bg.skills.choose && !ch.backgroundSkillChoice) out.push({ source: "Background", what: "Skill choice" });
      (bg.proficiencies || []).forEach(function (line, idx) {
        if (/choose/i.test(line) && !((ch.backgroundProfChoices || [])[idx])) {
          var label = /:/.test(line) ? line.split(":")[0].trim() : "Proficiency";
          out.push({ source: "Background", what: label + " choice" });
        }
      });
    }
    return out;
  }

  function duplicateGrants(ch) {
    var m = grantSourceMap(ch);
    var dupSkills = [], dupGear = [];
    Object.keys(m.skills).forEach(function (k) {
      var s = m.skills[k];
      if (s.indexOf("Class") !== -1 && s.indexOf("Background") !== -1) dupSkills.push(k);
    });
    Object.keys(m.gear).forEach(function (key) {
      var s = m.gear[key];
      if (s.indexOf("Class") !== -1 && s.indexOf("Background") !== -1) dupGear.push(key.split("|")[1]);
    });
    return { skills: dupSkills, gear: dupGear, any: (dupSkills.length + dupGear.length) > 0 };
  }

  /* ---- Size ---------------------------------------------------------------
     Heights are inclusive ranges and a height landing exactly on a boundary
     takes the LARGER category, which this less-than cascade gives for free:
     2 ft is Small, 4 ft is Medium, 8 ft is Large. There is deliberately no
     default Size, so an unstatted body returns null rather than Medium. */
  function sizeFromHeightFt(h) {
    if (typeof h !== "number" || !isFinite(h)) return null;
    var bands = R.sizeBands || [];
    for (var i = 0; i < bands.length; i++) if (h < bands[i].underFt) return bands[i].size;
    return bands.length ? bands[bands.length - 1].size : null;
  }
  // the character's height, clamped into their lineage's printed range. A
  // lineage flagged fixed (Harbingers, always exactly 6 ft) ignores any stored
  // value entirely.
  function lineageHeightFt(ch) {
    var band = (ch && ch.lineage && R.lineageHeight) ? R.lineageHeight[ch.lineage] : null;
    // With no lineage there is no range to validate against, so a stored height
    // is not trusted: an imported record claiming 30 ft must not mint a Huge
    // player character.
    if (!band) return null;
    if (band.fixed) return band.min;
    var h = (ch && typeof ch.heightFt === "number") ? ch.heightFt : null;
    if (h == null) return null;
    return clamp(h, band.min, band.max);
  }
  function sizeEncumbranceAdj(size) {
    var t = (R.sizeTraits || {})[size];
    return t ? (t.encumbrance || 0) : 0;
  }
  /* The Level 4 Awakening slot (ch.awakeningEvolution). It holds a Lineage Evolution by name (a
     string, the long-standing shape), or, since the 2026-10-24 rulings (section 9 item 5: an
     Additive Feature can be traded for a qualifying standard Talent), one of two objects:
       { type: "evolution", evolution: "<feature name>" }   the same as the bare string
       { type: "talent", talent: "<talent key>" }           the Evolution traded for a Talent
     awakeningPick normalizes all three. activeLineageFeatures reads the evolution; activeTalents
     reads the talent (at level 4). */
  function awakeningPick(ch) {
    var a = ch && ch.awakeningEvolution;
    if (!a) return null;
    if (typeof a === "string") return { type: "evolution", evolution: a };
    if (typeof a === "object" && a.type === "talent" && a.talent) return { type: "talent", talent: a.talent };
    if (typeof a === "object" && a.type === "evolution" && a.evolution) return { type: "evolution", evolution: a.evolution };
    return null;
  }
  // All active lineage Additive Features: creation pick + Universal-Upgrade
  // evolution picks + the Level 4 Awakening evolution (unless it was traded for a Talent).
  function activeLineageFeatures(ch) {
    var names = (ch.lineageFeatures || []).slice();
    var ups = ch.universalUpgrades || {};
    Object.keys(ups).forEach(function (k) {
      var u = ups[k];
      if (u && u.type === "evolution" && u.evolution) names.push(u.evolution);
    });
    var awk = awakeningPick(ch);
    if (awk && awk.type === "evolution") names.push(awk.evolution);
    return names.filter(function (n, i) { return names.indexOf(n) === i; });
  }

  // Lineage features that change a derived number (DR, Speed, Initiative) or the
  // unarmed strike, keyed by feature name. derive() folds the numbers into the
  // sheet so the player does not have to hand-track them; the unarmed entries
  // are read by the unarmed-strike helpers instead, because a replacer is a
  // choice, a step is a count, and a rider is neither. Source values per
  // app/data/species.js.
  var LINEAGE_MECH = {
    "Ironbark Carapace":     { dr: 2 },
    "Ironhide Tusks":        { dr: 1 },
    "Slipstream Runner":     { speed: 2 },
    "Calibrated Gait":       { speed: 1 },
    // Freelancer's Companion: "You can never be Surprised, and you gain Edge on Initiative rolls."
    // (It used to add Caliber to Initiative; initCaliber stays in the reader for no row now.)
    "Static Premonition":    { initEdge: true, condImmune: ["Surprised"] },
    "Tuned Synapses":        { initEdge: true, speedFirstRound: 2 },
    "Synthetic Musculature": { unarmedStep: 1 },
    "Briar Strike":          { unarmed: { die: "1d6", type: "Piercing or Slashing", traits: "Light, Finesse",
                                 note: "pick the type each turn; Bleeding on a crit" } },
    /* The 1d4 used to live inside the note as prose, so it never reached the printed
       damage while the identically shaped Smelter's Hands and Envenomed Thorns riders
       below always did. It is a rider, and its Size condition rides with it: unarmedRider
       carries `when` precisely so a conditional rider can be shown without pretending the
       sheet knows whether the condition is met. Checked against Part 1 on 2026-08-21: the
       strike is "Bludgeoning or Slashing, chosen with each strike", and the Size gate
       covers BOTH the 1d4 and the push. */
    "Brutal Frame":          { unarmed: { die: "1d6", type: "Bludgeoning or Slashing",
                                 note: "pick the type with each strike" },
                               unarmedRider: { damage: "1d4",
                                 when: "against a Target at least one Size smaller",
                                 note: "you may also push the Target 1 space away" } },
    "Butcher Spurs":         { unarmed: { die: "1d6", type: "Slashing", traits: "Finesse",
                                 note: "once per turn on a hit, Target Speed -2 until your next turn" } },
    "Scavenger's Maw":       { unarmed: { die: "1d6", type: "Piercing", note: "bite; +1 Vitality on a hit" } },
    "Smelter's Hands":       { unarmedRider: { damage: "1d4 Fire", when: "while your hands are lit" } },
    "Envenomed Thorns":      { unarmedRider: { damage: "1d4 Toxic", when: "while active", note: "the Target then makes a Body Save" } },
    // "Your unarmed strikes AND melee weapons gain an additional 1 space of reach."
    // Both halves are stated, because both are real: the weapon half used to be prose
    // with no engine path, so an Arboreal's Longsword read the same reach as anyone's.
    "Canopy Reach":          { unarmedReach: 1, meleeReach: 1 },
    // standing damage-type grants, read by damageResistances()
    "Radiation Calluses":   { resist: ["Radiation"] },
    // Freelancer's Companion: Hazard Seal is now "Resistance to Acid and Toxic damage"
    "Hazard Seal":           { resist: ["Acid", "Toxic"] },
    // condition immunity, the axis damageResistances deliberately does not carry
    "Timber Fortitude":      { condImmune: ["Frightened"] },
    "Axiomatic Mind":        { condImmune: ["Confused"] },
    "Distributed Anatomy":   { condImmune: ["Bleeding", "Poisoned"] },
    "Hare-Trigger Instinct": { condImmune: ["Surprised"] },
    "Forge-Blooded":         { resist: ["Fire"] }
  };
  function lineageMechanics(ch) {
    var out = { dr: 0, speed: 0, speedFirstRound: 0, initCaliber: false, initEdge: false, initEdgeSources: [] };
    activeLineageFeatures(ch).forEach(function (fn) {
      var m = LINEAGE_MECH[fn]; if (!m) return;
      if (m.dr) out.dr += m.dr;
      if (m.speed) out.speed += m.speed;
      if (m.speedFirstRound) out.speedFirstRound += m.speedFirstRound;   // conditional: first round of combat only
      if (m.initCaliber) out.initCaliber = true;
      if (m.initEdge) { out.initEdge = true; out.initEdgeSources.push(fn); }
      // The unarmed entries are NOT folded here: a replacer is a player choice,
      // a step is counted against the ladder, and a rider stands apart from both.
      // The unarmed-strike helpers below collect each kind on its own terms.
    });
    return out;
  }

  /* CLASS features that change a derived number or grant a condition immunity, keyed by the
     feature's name and read for every class feature the character has unlocked (level <= ch.level).
     The same idea as LINEAGE_MECH, and the same rule: a row here is a fixed grant, never a choice.
       First Responder (Stitcher, Level 2): "You gain Edge on all Initiative rolls. Your Speed also
         increases by 2."
       Absolute Discipline (Operator, Level 9), Veteran Instincts: "You can't be Surprised, and you
         gain Edge on all Initiative rolls."
     `initEdge` is the NAME the Edge is credited to (the Initiative card prints it), `speed` a flat
     step, `condImmune` the conditions the feature rules out and `condSource` the name to credit. */
  var CLASS_FEATURE_MECH = {
    "First Responder":     { speed: 2, initEdge: "First Responder" },
    "Absolute Discipline": { initEdge: "Veteran Instincts", condImmune: ["Surprised"], condSource: "Veteran Instincts" }
  };
  // Has the character reached this class feature (by name, on the class's own level table)?
  function classFeatureUnlocked(ch, featureName) {
    var cls = getClass(ch && ch.class);
    if (!cls || !cls.featuresByLevel) return false;
    var level = clamp((ch && ch.level) || 1, 1, R.maxLevel);
    for (var L = 1; L <= level; L++) {
      var list = cls.featuresByLevel[String(L)] || [];
      for (var i = 0; i < list.length; i++) if (list[i] && list[i].name === featureName) return true;
    }
    return false;
  }
  /* { speed: [{label, val}], initEdge: [names], condImmune: [{condition, source}] }, in feature order */
  function classFeatureMechanics(ch) {
    var out = { speed: [], initEdge: [], condImmune: [] };
    var cls = getClass(ch && ch.class);
    if (!cls || !cls.featuresByLevel) return out;
    var level = clamp((ch && ch.level) || 1, 1, R.maxLevel);
    for (var L = 1; L <= level; L++) {
      (cls.featuresByLevel[String(L)] || []).forEach(function (f) {
        var m = ownVal(CLASS_FEATURE_MECH, f && f.name); if (!m) return;
        if (m.speed) out.speed.push({ label: f.name, val: m.speed });
        if (m.initEdge) out.initEdge.push(m.initEdge);
        (m.condImmune || []).forEach(function (c) { out.condImmune.push({ condition: c, source: m.condSource || f.name }); });
      });
    }
    return out;
  }

  /* ---- unarmed strike ----------------------------------------------------
     The bare strike is "1 Bludgeoning damage plus your Body Modifier": a flat 1
     and NO die at all. An unarmed strike IS a melee attack, so anything keyed to
     melee attacks reaches it; it is NOT a melee weapon, so anything that demands
     a melee weapon does not.

     Two kinds of effect touch the damage, and they resolve in that order:
       1. REPLACERS set the die and bring their own damage type, traits and
          properties, which replace whatever was there unless the effect says
          retained or combined. Two replacers never weld together: "if two
          replacers apply, the player chooses one per attack." So every replacer
          the character has is offered and exactly one resolves. Nothing here
          prefers the largest die; the pick belongs to the player.
       2. OOMPH (Unarmed) steps the resolved die up 1d4 -> 1d6 -> 1d8 -> 1d10 -> 1d12.
          Oomph from different sources adds together, and nothing caps the total;
          the ladder stops at 1d12 and the excess is lost. It lands on whichever
          replacer was chosen. On a strike with no die the first step of Oomph
          grants 1d4 (the author's ruling, 16 October handoff) and each further
          step climbs again.
     Riders are neither: they hang their own dice off the strike alongside what it
     already deals, so they never touch the die or the damage type.
     Standing benefits that are not about punching (Synthetic Musculature's
     Encumbrance Threshold, a Cyberarm's mod slots) do not ride on the pick and
     keep resolving through their own paths. */
  var UNARMED_BASE = { die: null, flat: 1, type: "Bludgeoning", note: "1 Bludgeoning plus your Body Modifier" };
  // reserved ch.unarmedPick value: the player is throwing a plain punch rather
  // than using any of the replacers available to them (a bite that eats the
  // target or a kick that carves them up is not always what you want).
  var UNARMED_BASE_PICK = "base";
  /* ---- OOMPH: THE one die ladder ------------------------------------------
     "Oomph +1 steps a damage die up one size along this ladder: 1d4, 1d6, 1d8, 1d10,
     1d12. Oomph +2 steps it twice." and "A weapon that rolls more than one die steps
     each of them: Oomph +1 turns a Greatsword's 2d6 into 2d8." So the SIDES climb and
     the COUNT stays: 2d6 at +1 is 2d8, never 3d6 or 2d6+1d8.
     "Nothing steps past 1d12; Oomph beyond that is lost." A die already at d12 keeps
     its size and every step past it is reported as `lost`, so a row can say so.
     A die with no die at all (the bare unarmed strike) takes 1d4 from its first step,
     by the author's ruling, and climbs from there.
     A die whose sides are OFF the ladder (d2, d3, d20) comes back unchanged and every
     step counts as lost; the catalog carries none today.
     stepDieInfo is the resolver; stepDie is the string-only shorthand every caller
     that only wants the die keeps using. */
  var DIE_LADDER = [4, 6, 8, 10, 12];
  // the rung the first step of Oomph grants a strike that has no die whatsoever
  var DIE_FIRST = "1d4";
  function stepDieInfo(die, steps) {
    steps = Math.max(0, Math.floor(Number(steps) || 0));
    if (die == null || die === "") {
      if (!steps) return { die: null, applied: 0, lost: 0, offLadder: false };
      var first = stepDieInfo(DIE_FIRST, steps - 1);
      return { die: first.die, applied: first.applied + 1, lost: first.lost, offLadder: false };
    }
    var m = String(die).trim().match(/^(\d*)\s*d\s*(\d+)$/i);
    var idx = m ? DIE_LADDER.indexOf(parseInt(m[2], 10)) : -1;
    if (idx === -1) return { die: die, applied: 0, lost: steps, offLadder: true };
    var applied = Math.min(steps, DIE_LADDER.length - 1 - idx);
    return { die: m[1] + "d" + DIE_LADDER[idx + applied], applied: applied, lost: steps - applied, offLadder: false };
  }
  function stepDie(die, steps) { return stepDieInfo(die, steps).die; }
  // Installed chrome that REPLACES the unarmed die, keyed by cyberware key then
  // by tier. Source values per app/data/cyberware.js.
  /* Talents granting a standing damage-type Resistance, as a table rather than a flag on
     each talent, matching TALENT_UNARMED_STEP right below. Only the FIXED grants: the
     choose-one talents (Cyber-Reinforced Vitality) need a stored pick and are not here. */
  /* Street Scrapper used to sit here with a standing Resistance to Slashing that neither the
     old text nor the 16 October text grants. Removed by the author's decision 5 (2026-10-16):
     the Talent's only Resistance is its Upgrade's, and that one is conditional on the weapon
     used against you, so it lives in TALENT_RESIST_NOTES below as a note, never a standing row. */
  /* Cutting Agent is not here: PHB "Your damage rolls ignore Resistance to Toxic damage." is offence,
     not a Resistance, and nothing in the sheet models it. */
  var TALENT_RESIST = {
    "pain-editor":     { resist: ["Psychic"] }
  };
  /* Conditional Resistances the sheet SHOWS and never applies, because ch carries no record of
     what is hitting you. `upgrade: true` gates the row on the Talent's Upgrade having been
     bought as a Universal Upgrade, the way RESIST_PICK does. Text per the Street Scrapper
     Upgrade, 16 October handoff. Read by conditionalResistances(). */
  var TALENT_RESIST_NOTES = {
    "street-scrapper": { upgrade: true, types: ["Slashing", "Bludgeoning", "Piercing"],
      when: "from improvised weapons used against you",
      text: "Resistance to Slashing, Bludgeoning, and Piercing damage from improvised weapons used against you." }
  };
  /* ---- Grants that let the PLAYER choose the damage type -------------------
     TALENT_RESIST above holds the fixed grants. This holds the menus, and the rule is the one
     TALENT_ATTR_BUMP states for attributes: the value is the OPTIONS, in the order the entry
     prints them, never the grant. A row here alone resists nothing; the answer lives on the
     record in ch.resistPicks and is validated on read.

     `upgrade: true` means the grant rides a Talent's "Upgrade (Level 6+)" rider, so it is live
     only once that Upgrade has actually been bought as a Universal Upgrade. Holding the Talent is
     not enough, and neither is being level 6.

     One entry, and it stays one: this table is for TALENT menus only. The gear menus are not
     here, because they hang off an equipment entry rather than a talent key and because a gear
     row can carry its own options; see armorResistOptions and ablativeState below, the note on
     the Warframe Shell in gear_armor.js, and the Ablative Coating row in armor_mods.js. With
     that mod wired on 2026-09-18 the family has no unwired member left.
     Source: app/data/talents.js:283. */
  var RESIST_PICK = {
    "cyber-reinforced-vitality": { options: ["Ballistic", "Piercing", "Slashing", "Bludgeoning"], upgrade: true }
  };
  function resistPickOptions(grantKey) {
    var row = ownVal(RESIST_PICK, grantKey);
    return row ? row.options : null;
  }
  /* Is the grant in effect at all? Separate from "has a pick been made", because a Talent whose
     Upgrade is unbought offers nothing to choose and must not nag. */
  function resistPickLive(ch, grantKey) {
    var row = ownVal(RESIST_PICK, grantKey);
    if (!row) return false;
    if (!row.upgrade) return true;
    return talentUpgradeHeld(ch, grantKey);
  }
  /* THE resolver, null on every way of not knowing: no such grant, the grant is not live, nobody
     has chosen, or the stored pick is not among the options THIS grant offers. A stale pick is
     left alone rather than corrected, matching talentAttr. */
  function resistPick(ch, grantKey) {
    var opts = resistPickOptions(grantKey);
    if (!opts || !resistPickLive(ch, grantKey)) return null;
    if (opts.length === 1) return opts[0];
    var picks = ch && ch.resistPicks;
    var pick = picks ? picks[grantKey] : null;
    return (typeof pick === "string" && opts.indexOf(pick) !== -1) ? pick : null;
  }
  /* A live grant whose menu nobody has answered. The builder marks the slot with it, so a waiting
     choice is visible rather than a resistance quietly missing. */
  function resistPickPending(ch, grantKey) {
    var opts = resistPickOptions(grantKey);
    return !!(opts && opts.length > 1 && resistPickLive(ch, grantKey) && !resistPick(ch, grantKey));
  }

  /* ---- THE SAME CHOICE, MADE ON A PIECE OF GEAR -----------------------------
     Four armor entries print "when you acquire it, choose ...". Unlike the Talent grants
     above, the answer belongs to one COPY of the suit: two Veilskins are two equipment
     entries and two independent answers. That is the same reason ch.armorMods and
     ch.hazards.thermalWeave are keyed on the entry rather than on the item name, and this
     map joins them on ch.armorResistPicks.

     The OPTIONS live on the armor row (gear_armor.js `resistPick`), not in a table here.
     See the note on the Warframe Shell for why the two halves of this feature keep their
     menus in different files. */
  function armorResistRow(item) {
    var r = item && item.resistPick;
    return (r && r.options && r.options.length) ? r : null;
  }
  function armorResistOptions(item) { var r = armorResistRow(item); return r ? r.options : null; }
  function armorResistCount(item) { var r = armorResistRow(item); return r ? (r.count || 1) : 0; }
  /* THE resolver, and it looks the answer up BY KEY rather than walking the map, because
     migrate() runs only on load: between selling a suit and reloading the page its dead
     key is still sitting there. Every stored value is checked against THIS item's own
     menu, so a pick naming a type the suit does not offer resolves away rather than being
     corrected, exactly as resistPick does for a Talent.

     Duplicates are NOT filtered. The Reliquary Shell's clause does not forbid choosing the
     same type twice, and pushResist collapses the pair into one row anyway; the picker
     says so rather than the engine quietly rewriting a legal choice. */
  function armorResistPicks(ch, key, item) {
    item = item || armorItem(keyToName(ch, key));
    var opts = armorResistOptions(item);
    if (!opts) return [];
    var raw = ownVal((ch && ch.armorResistPicks) || null, key);
    // a bare string is the one-pick shape written by hand or by an older export; the
    // migration widens it the same way, so both ends of the record agree about shape
    if (typeof raw === "string") raw = [raw];
    if (!Array.isArray(raw)) return [];
    var n = armorResistCount(item), out = [];
    raw.forEach(function (t) {
      if (out.length >= n) return;
      if (typeof t === "string" && opts.indexOf(t) !== -1) out.push(t);
    });
    return out;
  }
  /* How many answers this copy still owes: a NUMBER, not a boolean, because the Reliquary
     Shell picks two and owing one of them is a real state the card has to be able to say.
     0 for a suit whose entry carries no menu at all. */
  function armorResistOwed(ch, key, item) {
    item = item || armorItem(keyToName(ch, key));
    if (!armorResistOptions(item)) return 0;
    return Math.max(0, armorResistCount(item) - armorResistPicks(ch, key, item).length);
  }

  /* ---- THE ABLATIVE COATING, the one grant in this family that can be SPENT -----
     Same menu shape as the four suits, on an armor MOD row rather than an armor row, and keyed
     the same way: per armor ENTRY. That is enough on its own, because the bench refuses a second
     copy of a mod on one suit, so a suit holds at most one coating and a spare suit carries its
     own build.

     What makes it different is the second half of its clause: "The first time each scene a hit
     of that type would carry through to your Wounds, the coating burns away instead: ignore that
     damage, then the mod is spent and grants no Resistance until you re-layer it in downtime."
     So the record carries a SPENT flag as well as a type, and while that is set this grants
     nothing at all. It is the first thing in the resistance pipeline conditional on a state the
     player burns rather than a standing fact about the record.

     THE BURN IS NOT DERIVED, AND CANNOT BE. applyDamage takes a bare number the player has
     already reduced by DR and halved for Resistance by hand, with no damage type anywhere in the
     path, so the sheet cannot tell a halved Ballistic 6 from an unhalved Force 6, let alone
     whether the coating should have eaten it. The player marks it, the way they mark a torn
     hazmat seal. "The first time each scene" needs no machinery either: the app has no scene
     clock, and it would not help, because the mod stays spent until it is re-layered, which is
     bench work and strictly longer than a scene. Nothing can restore it within a scene, so the
     cap can never bind. */
  function ablativeMod() {
    var m = (EN.armorMods && EN.armorMods.byKey && EN.armorMods.byKey["ablative-coating"]) || null;
    return (m && m.resistPick && m.resistPick.options && m.resistPick.options.length) ? m : null;
  }
  function ablativeOptions() { var m = ablativeMod(); return m ? m.resistPick.options : null; }
  /* The whole answer for one suit, in one object, so the bench row, the Defense chip and the
     resistance pipeline cannot disagree about it. `fitted` is the bench's question, `type` and
     `spent` the record's, and `live` the only one damageResistances asks. The type is validated
     against the mod's own menu on read, as every other pick in this family is.

     `live` deliberately does NOT fold in the worn gate. This is asked about ONE suit by key, and
     its only engine reader is already inside `if (worn && worn.item && !worn.lapsed)`. So a
     tuned, unburned coating on a spare in the stash reads live, which is the bench's question
     ("is this one ready?") rather than the sheet's ("am I resistant right now?"). */
  function ablativeState(ch, key) {
    var opts = ablativeOptions();
    var fitted = !!key && armorModsOn(ch, key).indexOf("ablative-coating") !== -1;
    var row = ownVal((ch && ch.ablativeCoating) || null, key);
    var t = (row && typeof row.type === "string" && opts && opts.indexOf(row.type) !== -1) ? row.type : null;
    var spent = !!(row && row.spent);
    return { fitted: fitted, options: opts, type: t, spent: spent, live: fitted && !!t && !spent };
  }

  /* Talents granting a standing Vitality bonus, a table in the same shape. The value is points
     PER CHARACTER LEVEL, and Cyber-Reinforced Vitality is the only entry the catalog has.

     Its bullet reads as two clauses: "Vitality maximum jumps by twice your Character level; every
     level you gain after that adds 2 more." Those look like they need the level it
     was TAKEN at, and activeTalents does know it, since a Talent is a Universal Upgrade filed
     under the level that bought it. It is not needed, because the two clauses collapse:
     2*acquired + 2*(now - acquired) is 2*now at every level. So the simpler form is used, and the
     acquisition level is left out of the arithmetic rather than left unconsidered.

     Its Upgrade's chosen Resistance is NOT here, and no longer for want of a channel: it is a
     menu, and menus resolve through RESIST_PICK above. Source: app/data/talents.js:283. */
  var TALENT_VIT_PER_LEVEL = {
    "cyber-reinforced-vitality": 2
  };
  function talentVitality(ch, level) {
    var n = 0;
    activeTalents(ch).forEach(function (t) {
      var per = ownVal(TALENT_VIT_PER_LEVEL, t.talent.key);
      if (per) n += per * level;
    });
    return n;
  }
  /* ---- Talent attribute bumps --------------------------------------------
     36 of the 63 Talents open with a bullet reading "Increase your <ATTR> score by 1, to a
     maximum of 20", in one of three wordings: a named attribute, a choice of two or three,
     or "one Attribute score of your choice". None of them reached the sheet before this
     table existed, whether they offered a choice or not.

     A TABLE rather than a parse of the bullet, matching TALENT_RESIST above. A parse was
     tried against all 63 texts and scored 35 of 36, and the miss was silent: a character
     would simply have been one point light with nothing on screen to explain it. A table
     that misses a newly added Talent grants nothing and shows an empty picker the first
     time anyone selects it, which is visible. Talent text stays pure manuscript.

     Values are the OPTIONS, in the order the bullet prints them, never the grant. Length 1
     is fixed and needs nothing stored; anything longer is a menu whose answer lives in
     ch.talentAttrPicks. A row here ALONE never adds a point: see talentAttr.
     Source values per app/data/talents.js, line numbers in the comments. */
  var ALL_ATTRS = ["BOD", "AGI", "WIT", "TEC", "MYS", "PRE"];
  var TALENT_ATTR_BUMP = {
    "akimbo-specialist":         ["BOD", "AGI"],        // talents.js:16
    "armor-piercing-specialist": ["BOD", "AGI"],        // 23
    "arsenal-adept":             ["BOD", "AGI"],        // 30
    "close-quarters-brawler":    ["BOD"],               // 37
    "concussive-striker":        ["BOD"],               // 44
    "laceration-expert":         ["BOD", "AGI"],        // 65
    "melee-mastery":             ["BOD", "AGI"],        // 72
    "ricochet-shot":             ["AGI", "WIT"],        // 79
    "staff-spear-master":        ["BOD", "AGI"],        // 93
    "street-scrapper":           ["BOD"],               // 100
    "blade-weaver":              ["AGI"],               // 116
    "augment-specialist":        ["TEC"],               // 174
    "gridrunners-reflexes":      ["TEC", "WIT"],        // 181
    "pain-editor":               ["BOD", "TEC"],        // 209
    "script-kiddie":             ["TEC", "WIT"],        // 230, Freelancer's Companion adds the bump
    "resonance-dabbler":         ["TEC", "MYS", "PRE"], // 246
    "cyber-reinforced-vitality": ["BOD"],               // 283
    "cybernetic-surge":          ["BOD", "AGI"],        // 290
    "hardened-survivor":         ALL_ATTRS,             // 297, "the chosen Attribute"
    "siege-plating-expert":      ["BOD"],               // 304
    "tactical-harness-expert":   ["BOD", "AGI"],        // 311
    "unbreakable":               ["BOD"],               // 318
    "asphalt-rider":             ["AGI", "WIT"],        // 327
    "breach-charger":            ["BOD"],               // 341
    "parkour-runner":            ["BOD", "AGI"],        // 348
    // Cold Reader was Crowd Reader until 2026-10-16 (store.js TALENT_RENAMES moves saved picks);
    // it now sits above Crew Commander in talents.js, and the note above it there shifts the rows below
    "cold-reader":               ["PRE", "WIT"],        // 369
    "crew-commander":            ["PRE"],               // 376
    "faceless-persona":          ["PRE"],               // 390
    "field-specialist":          ALL_ATTRS,             // 404, "one Attribute of your choice"
    "hyper-aware":               ["WIT", "TEC"],        // 411
    "photographic-memory":       ["TEC", "WIT"],        // 425
    "ruin-crawler":              ["WIT", "AGI"],        // 432
    "shadow-operative":          ["AGI"],               // 439
    "spatial-delivery":          ["WIT", "MYS"],        // 460
    "street-chef":               ["BOD", "WIT"],        // 467
    "trauma-medic":              ["WIT", "TEC"],        // 474
    "undercity-survivor":        ["WIT", "TEC", "PRE"]  // 481
  };
  function talentAttrOptions(talentKey) {
    return ownVal(TALENT_ATTR_BUMP, talentKey) || null;
  }
  /* THE resolver for "which attribute did this Talent raise". Null on all three ways of
     not knowing: the Talent grants no bump, the Talent offers a choice nobody has made,
     or the stored pick is not one of the options THIS Talent offers. A pick that no longer
     validates is treated as unset rather than corrected, because a stale pick is a claim
     about a Talent the character may no longer hold and invariant 4 does not guess. */
  function talentAttr(ch, talentKey) {
    var opts = talentAttrOptions(talentKey);
    if (!opts) return null;
    if (opts.length === 1) return opts[0];
    var picks = ch && ch.talentAttrPicks;
    var pick = picks ? picks[talentKey] : null;
    return (typeof pick === "string" && opts.indexOf(pick) !== -1) ? pick : null;
  }
  /* A Talent that offers a choice the player has not made yet. The builder uses this to
     mark the slot, so a waiting choice is visible rather than a point quietly missing. */
  function talentAttrPending(ch, talentKey) {
    var opts = talentAttrOptions(talentKey);
    return !!(opts && opts.length > 1 && !talentAttr(ch, talentKey));
  }
  /* ---- Hardened Survivor's SAVE benefit ------------------------------------
     PHB: "You add your Caliber to all Saving Throws you make using the chosen Attribute, as
     though it were one of your class Saving Throw Focuses. If the chosen Attribute is already
     one of your Saving Throw Focuses, choose a different Attribute for this benefit."
     Ruling 8 (2026-10-19): only the SAVE benefit moves to the other Attribute; the +1 to the
     score stays on the chosen one (TALENT_ATTR_BUMP is unchanged). The second Attribute lives
     in ch.talentSavePicks[talentKey], validated on read like every other pick in this file. */
  function classSaveFocusKeys(ch) {
    var cls = getClass(ch && ch.class);
    return cls ? parseAttrKeys(cls.saveFocus || (cls.startingProficiencies && cls.startingProficiencies.saves || []).join(" ")) : [];
  }
  function talentHeld(ch, talentKey) {
    return activeTalents(ch).some(function (t) { return t.talent.key === talentKey; });
  }
  /* An Upgrade counts only while its base Talent is held: a slot turned to +2 ATTRIBUTES (or a
     retrained Talent) leaves an orphaned Upgrade record behind, and that record grants nothing.
     Asphalt Rider's Speed, the Cyber-Reinforced Vitality pick and Staff & Spear Master's Reach
     all ask here. */
  function talentUpgradeHeld(ch, talentKey) {
    return talentHeld(ch, talentKey) && talentUpgradeKeys(ch).indexOf(talentKey) !== -1;
  }
  /* The Attributes a second pick may name: only offered while the chosen Attribute is already a
     class Focus, and never one of the class Focuses. An empty list means no second pick is owed. */
  function talentSaveOptions(ch, talentKey) {
    if (talentKey !== "hardened-survivor") return [];
    var a = talentAttr(ch, talentKey);
    var focus = classSaveFocusKeys(ch);
    if (!a || focus.indexOf(a) === -1) return [];
    return ALL_ATTRS.filter(function (k) { return focus.indexOf(k) === -1; });
  }
  /* THE resolver for "which Attribute's saves does this Talent add Caliber to": the chosen
     Attribute when it is not already a Focus, else a valid second pick, else null. */
  function talentSaveAttr(ch, talentKey) {
    if (talentKey !== "hardened-survivor" || !talentHeld(ch, talentKey)) return null;
    var a = talentAttr(ch, talentKey);
    if (!a) return null;
    if (classSaveFocusKeys(ch).indexOf(a) === -1) return a;
    var pick = ownVal(ch && ch.talentSavePicks, talentKey);
    return (typeof pick === "string" && talentSaveOptions(ch, talentKey).indexOf(pick) !== -1) ? pick : null;
  }
  /* A held Talent whose second pick is owed and unanswered; the builder marks the slot with it. */
  function talentSavePending(ch, talentKey) {
    return talentHeld(ch, talentKey) && talentSaveOptions(ch, talentKey).length > 0 && !talentSaveAttr(ch, talentKey);
  }
  /* ONE enumeration of everything that raises an attribute after creation, so the summer
     below and the builder's attribute matrix cannot disagree about what bumped what. The
     matrix used to re-derive the Universal Upgrade half itself, which was a second answer
     to one question waiting to drift.
     Returns {ATTRKEY: [{kind, level, name, key}]}, one entry per +1.
     opts.excludeTalent omits one Talent's own bump, which is how a Talent's attribute
     requirement is checked without it propping up its own prerequisite. */
  function attrBumpSources(ch, opts) {
    var out = {}, skip = (opts && opts.excludeTalent) || null;
    var ups = (ch && ch.universalUpgrades) || {};
    Object.keys(ups).sort(function (a, b) { return (Number(a) || 0) - (Number(b) || 0); }).forEach(function (lvl) {
      var u = ups[lvl];
      if (!u || u.type !== "attr") return;
      // new shape: attrs:[key,key] (+1 each; same key twice = +2). legacy: {attr, amount}
      var keys = [];
      if (u.attrs && u.attrs.length) keys = u.attrs.slice();
      else if (u.attr) { var amt = u.amount || 1; for (var n = 0; n < amt; n++) keys.push(u.attr); }
      keys.forEach(function (k) {
        if (!k) return;
        (out[k] = out[k] || []).push({ kind: "upgrade", level: Number(lvl) || 0, name: "Universal Upgrade", key: null });
      });
    });
    activeTalents(ch).forEach(function (row) {
      if (skip && row.talent.key === skip) return;
      var k = talentAttr(ch, row.talent.key);
      if (!k) return;
      (out[k] = out[k] || []).push({ kind: "talent", level: row.level, name: row.talent.name, key: row.talent.key });
    });
    return out;
  }
  var CYBER_UNARMED = {
    skeleton: { type: "Bludgeoning", tiers: {
      Streetware: { die: "1d6" },
      Brandware:  { die: "1d6" },
      Blackware:  { die: "1d8", note: "one strike per round can be made as a Swift Action" } } },
    cyberarm: { type: "Bludgeoning", tiers: {
      Streetware: { die: "1d6", note: "the cyberarm only" },
      Brandware:  { die: "1d6", note: "the cyberarm only" },
      Blackware:  { die: "1d8", note: "the cyberarm only; cannot be disarmed, Edge on grapples with it" } } },
    handRazors: { type: "Slashing", traits: "Finesse", tiers: {
      Streetware: { die: "1d6", note: "Swift Action to extend; no Armor Piercing, Snag on Stealth the turn you deploy" },
      Brandware:  { die: "1d6", note: "Swift Action to extend; Armor Piercing 1" },
      Blackware:  { die: "1d8", note: "Swift Action to extend; Armor Piercing 2; a crit strips 1 DR from worn armor" } } }
  };
  // Talents granting Oomph +N (Unarmed), keyed by talent key. Street Scrapper:
  // "You gain Oomph +1 (Unarmed)." and its Upgrade "Your Oomph from this Talent
  // becomes +2 (Unarmed)", so one step plus a second once the Level 6+ Upgrade has
  // been unlocked with a Universal Upgrade slot. Source values per app/data/talents.js.
  var TALENT_UNARMED_STEP = {
    "street-scrapper": { steps: 1, upgradeSteps: 1,
      note: "Swift Action to Grapple after you hit with it" }
  };
  // Subclasses granting scoped Oomph, keyed by subclass key. The Walking Anvil (Juggernaut,
  // Level 1): "You gain Oomph +1 (Improvised)." Source per class_codebreaker_fury.js.
  var SUBCLASS_OOMPH = {
    "juggernaut": [{ label: "The Walking Anvil", steps: 1, scope: "Improvised", minLevel: 1 }]
  };
  // Talents that hang extra dice off the strike without touching its die.
  var TALENT_UNARMED_RIDER = {
    "cybernetic-surge": { damage: "1d6", when: "while your Surge is up" }
  };
  /* Gear that augments the strike, but only while it is actually on your hands.
     Oomph on gear is READ OFF ITS TRAITS: "Oomph +N (Scope)", as Knuckles print
     "Oomph +1 (Unarmed)". The Gear Trait: "With a scope in parentheses, as on Knuckles
     (Oomph +1 (Unarmed)), it applies to what the parentheses name while you wear or wield
     the item." That used to be a name-keyed table here (Knuckles +1); the trait made it
     data. Shock Gloves add their own die alongside whatever you were already dealing,
     which is a rider and not Oomph. Source values per app/data/gear_melee.js. */
  var GEAR_UNARMED_RIDER = { "Shock Gloves": { damage: "1d4 Electric" } };
  var OOMPH_TRAIT = /^\s*Oomph\s*\+\s*(\d+)\s*(?:\(\s*([^)]+?)\s*\))?\s*$/i;
  /* Every Oomph trait an item prints, as [{steps, scope}]; scope null for an unscoped one,
     which applies to the weapon carrying it. */
  function oomphTraits(item) {
    var out = [];
    ((item && item.traits) || []).forEach(function (t) {
      var m = OOMPH_TRAIT.exec(String(t));
      if (m) out.push({ steps: parseInt(m[1], 10), scope: m[2] || null });
    });
    return out;
  }
  function scopeKey(s) {
    return String(s || "").toLowerCase().replace(/\s+weapons?$/, "").replace(/s$/, "").trim();
  }
  /* An unarmed AUGMENT is not a weapon with a die of its own. Both pieces carry a
     `damage` string in the catalog so the stash row has something to print, but
     that number is what the augment CONTRIBUTES to a punch, never a die you roll
     in place of one. Anything scanning equipped gear for "the melee weapon I am
     holding" has to skip them, or it reads 1d4 off a pair of Knuckles and hands
     back a smaller die than the bare fist it is strapped to. Exported because the
     Parry row and the Defensive Impulse tray both do exactly that scan. An augment
     is anything printing Oomph (Unarmed), or a rider in GEAR_UNARMED_RIDER. */
  function isUnarmedAugmentName(name) {
    if (Object.prototype.hasOwnProperty.call(GEAR_UNARMED_RIDER, name)) return true;
    return oomphTraits(loadCatalogItem(name)).some(function (o) { return scopeKey(o.scope) === "unarmed"; });
  }
  /* Applied Bonuses that change the unarmed strike. The Ripper Hot-Wire
     "Pneumatic Bypass" is an increase a Stitcher hangs on somebody ELSE's
     chrome. The record used to carry no field for a Hot-Wire an ally installed
     on you, so this was a comment and nothing else; the Status Changes panel
     supplies that missing state, and the player toggling it is the GM saying it
     is live. It steps the die rather than setting it: a Freelancer already
     punching for 1d8 does not drop to 1d6 because an ally tuned their servos.
     Keyed on the EN.statusChanges option key, which is what gets persisted. */
  /* noFirstDie: the step needs a die to step. The Freelancer's Companion prints Pneumatic Bypass
     as "Their unarmed strike damage die increases by one size" and drops the old "(a strike with
     no die gains 1d4)", so on a strike with no die it changes nothing unless Oomph has already
     granted one (unarmedStepInfo below). */
  var BONUS_UNARMED_STEP = [
    { key: "bonus:pneumatic-bypass", label: "Pneumatic Bypass", steps: 1, noFirstDie: true,
      note: "Ripper Hot-Wire, installed by a Stitcher" }
  ];
  function bonusApplied(ch, key) {
    var b = ch && ch.bonuses;
    return !!(b && typeof b === "object" && b[key] === true);
  }

  // A piece of gear only augments the strike while it is on your hands: equipped
  // as a weapon, or carried at "worn". A pair in your bag augments nothing, and
  // a lapsed lease grants nothing at all.
  function unarmedGearOnHands(ch, name) {
    var eq = (ch && ch.equippedWeapons) || [], carry = (ch && ch.carry) || {};
    return ((ch && ch.equipment) || []).some(function (e) {
      if (!e || e.name !== name || !(e.qty > 0)) return false;
      var key = entryKey(e);
      if (eq.indexOf(key) === -1 && carry[key] !== "worn") return false;
      return !leaseLapsed(ch, key);
    });
  }
  /* ---- OOMPH SOURCES -------------------------------------------------------
     "Oomph on a weapon, or on a Part installed in it, applies to that weapon. Oomph from
     anywhere else, such as a talent, cyberware, a Flow effect, or worn gear, names its scope
     in parentheses: Oomph +1 (Unarmed), Oomph +1 (Improvised), Oomph +1 (Sidearms)."
     scopedOomphSources is every source of the second kind the character has right now, as
     [{label, kind, steps, scope, note}], in a fixed order: lineage, Talents, subclass, gear on
     your hands, applied Bonuses. Unarmed keeps exactly the sources and labels it always had,
     so the OOMPH chips read "Street Scrapper +1", "Street Scrapper Upgrade +1", "Knuckles +1".
     Gear counts only while worn or wielded (unarmedGearOnHands), once per item name, which is
     how the Knuckles table always behaved. */
  function scopedOomphSources(ch) {
    var out = [];
    activeLineageFeatures(ch).forEach(function (fn) {
      var m = LINEAGE_MECH[fn];
      if (!m || !m.unarmedStep) return;
      out.push({ label: fn, kind: "lineage", steps: m.unarmedStep, scope: "Unarmed", note: null });
    });
    var upKeys = talentUpgradeKeys(ch);
    activeTalents(ch).forEach(function (t) {
      var spec = TALENT_UNARMED_STEP[t.talent.key];
      if (!spec) return;
      out.push({ label: t.talent.name, kind: "talent", steps: spec.steps, scope: "Unarmed", note: spec.note || null });
      if (spec.upgradeSteps && upKeys.indexOf(t.talent.key) !== -1) {
        out.push({ label: t.talent.name + " Upgrade", kind: "talent", steps: spec.upgradeSteps, scope: "Unarmed", note: "Level 6+" });
      }
    });
    var subRows = (ch && ch.subclass && Object.prototype.hasOwnProperty.call(SUBCLASS_OOMPH, ch.subclass)) ? SUBCLASS_OOMPH[ch.subclass] : [];
    subRows.forEach(function (r) {
      if ((Number(ch.level) || 1) < (r.minLevel || 1)) return;
      out.push({ label: r.label, kind: "subclass", steps: r.steps, scope: r.scope, note: null });
    });
    var seen = Object.create(null);
    ((ch && ch.equipment) || []).forEach(function (e) {
      if (!e || !e.name || seen[e.name]) return;
      var ot = oomphTraits(loadCatalogItem(e.name)).filter(function (o) { return !!o.scope; });
      if (!ot.length || !unarmedGearOnHands(ch, e.name)) return;
      seen[e.name] = true;
      ot.forEach(function (o) {
        out.push({ label: e.name, kind: "gear", steps: o.steps, scope: o.scope, note: "while worn or wielded" });
      });
    });
    BONUS_UNARMED_STEP.forEach(function (spec) {
      if (!bonusApplied(ch, spec.key)) return;
      out.push({ label: spec.label, kind: "bonus", steps: spec.steps, scope: "Unarmed", note: spec.note || null, noFirstDie: !!spec.noFirstDie });
    });
    return out;
  }
  /* Does a scope name this weapon? "Sidearms" names group Sidearm; singular or plural, any
     case, with or without a trailing "weapons". Unarmed and Improvised never name a catalog
     weapon. Melee and Ranged name every weapon of that range. */
  function oomphScopeFits(scope, item) {
    var s = scopeKey(scope);
    if (!s || !item || s === "unarmed" || s === "improvised") return false;
    if (s === scopeKey(item.group) || s === scopeKey(item.category)) return true;
    if (s === "melee") return isMeleeWeapon(item);
    if (s === "ranged") return !isMeleeWeapon(item);
    return false;
  }
  /* The stored install-time choice on a Part that offers one (High-Tension Assembly: Oomph +1
     or the Armor Piercing 1 trait, "Choose when the modification is installed"). Stored per
     weapon ENTRY at ch.weaponParts[entryKey]._choices[partKey]. An install with no stored
     answer reads as the Part's `choice.default` (Oomph +1, the 16 October default), and an
     answer that is not one of the Part's options reads the same way. Null for a Part that
     offers no choice. */
  function weaponPartChoice(ch, key, part) {
    if (typeof part === "string") part = ((EN.weaponParts && EN.weaponParts.byKey) || {})[part];
    if (!part || !part.choice) return null;
    var lo = ((ch && ch.weaponParts) || {})[key] || {};
    var picked = (lo._choices && typeof lo._choices === "object") ? lo._choices[part.key] : null;
    var opts = (part.choice.options || []).map(function (o) { return o.value; });
    return opts.indexOf(picked) !== -1 ? picked : part.choice.default;
  }
  /* THE Oomph resolver. target is one of
       { kind: "weapon", item, key }   key = the equipment ENTRY (Parts are per entry)
       { kind: "unarmed" }
       { kind: "improvised" }
     plus an optional `die` to measure applied and lost against (a weapon defaults to its
     printed one-handed die, unarmed to the chosen strike's own die, improvised to none).
     Returns { total, applied, lost, die, partsTotal, partsCapped, sources, choices }:
       sources   [{label, kind, steps, scope, capped}], every source in scope, Parts first
       total     the Oomph that applies: Parts capped at +1, everything else added uncapped
       partsTotal / partsCapped  what the Parts printed, and whether the +1 cap bit
       applied / lost  steps that landed and steps past 1d12, for `die`
       die       `die` stepped by total (null when no die was measured)
       choices   [{key, name, choice}] for Parts with an install-time choice on this weapon
     "A weapon takes at most Oomph +1 from aftermarket Parts, however many it carries."
     "Oomph from different sources adds together." "Nothing steps past 1d12." */
  function oomphFor(ch, target) {
    target = target || {};
    var kind = target.kind || "weapon";
    var out = { kind: kind, total: 0, applied: 0, lost: 0, die: null, partsTotal: 0, partsCapped: false, sources: [], choices: [] };
    var measure;
    if (kind === "weapon") {
      var item = target.item || null;
      var running = 0;
      weaponPartsOn(ch, target.key).forEach(function (p) {
        if (!p || !p.oomph) return;
        var steps = p.oomph;
        if (p.choice) {
          var c = weaponPartChoice(ch, target.key, p);
          out.choices.push({ key: p.key, name: p.name, choice: c });
          if (c !== "oomph") return;
        }
        var before = running;
        running += steps;
        out.partsTotal += steps;
        out.sources.push({ label: p.name, kind: "part", steps: steps, scope: null, capped: before >= 1 ? steps : Math.max(0, running - 1) });
      });
      out.partsCapped = out.partsTotal > 1;
      out.total += Math.min(out.partsTotal, 1);
      oomphTraits(item).forEach(function (o) {
        if (o.scope) return;
        out.total += o.steps;
        out.sources.push({ label: (item && item.name) || "weapon", kind: "item", steps: o.steps, scope: null, capped: 0 });
      });
      scopedOomphSources(ch).forEach(function (s) {
        if (!oomphScopeFits(s.scope, item)) return;
        out.total += s.steps;
        out.sources.push({ label: s.label, kind: s.kind, steps: s.steps, scope: s.scope, capped: 0, note: s.note || null });
      });
      measure = ("die" in target) ? target.die
        : ((String((item && item.damage) || "").match(/^\s*(\d+d\d+)/) || [])[1] || null);
      // a weapon with no printed die (Knuckles' "Augments unarmed strikes") has nothing to step
      if (!measure) { out.applied = 0; out.lost = 0; out.die = null; return out; }
    } else {
      var want = kind === "unarmed" ? "unarmed" : "improvised";
      scopedOomphSources(ch).forEach(function (s) {
        if (scopeKey(s.scope) !== want) return;
        out.total += s.steps;
        out.sources.push({ label: s.label, kind: s.kind, steps: s.steps, scope: s.scope, capped: 0, note: s.note || null, noFirstDie: !!s.noFirstDie });
      });
      if ("die" in target) measure = target.die;
      else if (kind === "unarmed") {
        var rep = resolveUnarmed(ch, unarmedReplacers(ch));
        measure = rep ? rep.die : UNARMED_BASE.die;
      } else {
        out.die = null;
        return out;
      }
    }
    var info = kind === "weapon" ? stepDieInfo(measure, out.total) : unarmedStepInfo(measure, out.sources);
    out.die = info.die; out.applied = info.applied; out.lost = info.lost;
    return out;
  }
  /* Conditional Resistances, shown as notes and never applied (see TALENT_RESIST_NOTES).
     [{label, types, when, text}]. */
  function conditionalResistances(ch) {
    var out = [], upKeys = talentUpgradeKeys(ch);
    activeTalents(ch).forEach(function (t) {
      var spec = TALENT_RESIST_NOTES[t.talent.key];
      if (!spec) return;
      if (spec.upgrade && upKeys.indexOf(t.talent.key) === -1) return;
      out.push({ label: t.talent.name + (spec.upgrade ? " (Upgrade)" : ""), types: spec.types.slice(),
                 when: spec.when, text: spec.text });
    });
    return out;
  }
  // Every effect currently available to the character that REPLACES the unarmed
  // die, as [{source, pick, label, kind, die, type, traits, note}].
  /* ---- DAMAGE-TYPE RESISTANCE, VULNERABILITY AND IMMUNITY --------------------
     The last unconditional mechanical thing in the gear and chrome catalogs with nowhere to
     land. Twelve sources across five data files granted a standing Resistance in prose and
     the sheet showed none of it.

     The arithmetic is the book's, from EN.combat.damageTypeRules:
       "Resistance ... takes half damage ... Multiple sources of Resistance to the same type
        do not stack." (so this is a SET, not a sum)
       "Cancellation: Resistance and Vulnerability to the same damage type cancel each other;
        the Target takes normal damage."
       "Immunity overrides both."
     Which makes the resolution per type: immune wins outright; otherwise resist and
     vulnerable annihilate; otherwise whichever is present.

     Sources are DATA FLAGS (`resist` / `vulnerable` / `immune` arrays), never prose matching,
     so adding a resistance to an item is one field. Read from five places, because that is
     where the grants actually live: lineage features, Talents, the worn suit's own flags AND
     its traits (the Sealed trait grants Resistance to Toxic to any suit that has it),
     installed armor Mods, and installed chrome by tier.

     The choose-one-on-acquisition grants used to be excluded here for want of a stored pick.
     They are all in now, each through its own resolver rather than through a data flag, and each
     granting nothing until the player answers: Cyber-Reinforced Vitality's Upgrade through
     resistPick (2026-09-16), Veilskin, Aegis Shroud, Reliquary Shell and the Warframe Shell
     through armorResistPicks (2026-09-17), and the Ablative Coating through ablativeState
     (2026-09-18), which is the only one that can also be spent.

     Still NOT here, and correctly: the four Warding Foci (Resonance Coil, Saint's Knot, Hex
     Lattice Projector, Martyr's Halo). This comment used to file them with the acquisition
     picks, which was wrong twice over. Nothing is chosen and nothing is stored: the type is
     whatever just hit you, granted when your Ward reduces an attack to 0 and gone at the start
     of your next turn. They are transient, like the Ward clause they belong to.

     CONDITION immunity (Frightened, Bleeding, Confused) got the separate channel this comment
     used to ask for: see conditionImmunities right below, which is a different axis from a
     damage type and reads its own field. */
  /* ---- Special senses granted by features --------------------------------
     ONE table. It used to be three: combat.js, printsheet.js and pdfexport.js each carried
     a copy, and they had drifted. Echo Sighted was in two of them and not the third, so a
     Shaper with it printed a Resonance Sense line on the hardcopy and on the PDF and got
     nothing at all on the Freelancer tab. That is the failure this codebase keeps one
     resolver per mechanic to prevent, so the table moved here and the three readers ask.

     `note` is carried for every row; the print paths simply do not have the room to render
     it, which is a layout decision at the call site rather than a different table.
     Source values per app/data/species.js and the class data files. */
  var SENSE_GRANTS = {
    "Lowlight Optics":       { sense: "Darkvision",     range: "12 sp.", note: "Blinding flashes and strobes impose no Snag." },
    "Predator's Glare":      { sense: "Darkvision",     range: "6 sp." },
    "Fungal Network":        { sense: "Tremor Sense",   range: "6 sp.",  note: "While touching a connected surface; telepathic comms with allies within 12 sp." },
    "Seismic Sense":         { sense: "Tremor Sense",   range: "8 sp.",  note: "While touching the ground, a floor, or a connected structure; anyone also touching it, through walls or total darkness." },
    "Warmblood Sense":       { sense: "Heat Sense",     range: "6 sp.",  note: "Ignore Invisible and Hidden for living, heat-producing targets." },
    "Blood-Scent Tracker":   { sense: "Blood Scent",    range: "6 sp.",  note: "Know the direction of anyone Bleeding or below half Vitality, even hidden or behind cover." },
    "Disturbance Compass":   { sense: "Flow Sense",     range: "12 sp.", note: "Presence and direction of Flow disturbances and active Invocations, through walls. Always on." },
    "Scent Marker":          { sense: "Scent Tracking", range: "1 mile", note: "Tagged targets only, for 48 hours. Automatic within range, no check; Edge to hunt them beyond it." },
    "The Machine Medium":    { sense: "Sprite Sight",   range: "passive", note: "Passively see and communicate with Nixies and Gremlins, the Flow sprites in complex machinery." },
    "Echo Sighted":          { sense: "Resonance Sense", range: "12 sp." },
    /* The Ryn's headline sense, which rendered as a paragraph while both of its siblings on
       the same species got a row with a range. Its other two clauses stay prose: ignoring
       visual Snag in darkness is a table call, and the Surprised immunity is a condition,
       carried by conditionImmunities in engine.js. */
    "Hare-Trigger Instinct": { sense: "Sound Pinpoint", range: "6 sp.",  note: "Exact location of anything breathing, moving or making sound, even Invisible or Hidden, unless it is in a vacuum or total silence." }
  };
  // every special sense this character's active features grant, in feature order
  function senseGrants(featureNames) {
    var out = [];
    (featureNames || []).forEach(function (n) {
      var g = SENSE_GRANTS[n];
      if (g) out.push({ feature: n, sense: g.sense, range: g.range, note: g.note || "" });
    });
    return out;
  }
  /* ---- Alternative attack attributes, offered rather than applied ----------
     Two features let a qualifying weapon attack off a different attribute. Both are
     "you may", and First Do No Harm additionally turns on whether the target is organic,
     which the sheet cannot know. So this RENDERS the option and never applies it, the same
     posture unarmedRider.when takes and the same ruling made for the conditional lineage
     features: the sheet states the alternative and the table decides.

     The gap this closes is presentational, and it was worth closing because it is large.
     A Stitcher's pistol printed HIT +3 and 1d6 +1 off Agility while their Level 1 class
     feature made it +5 and 1d6 +3 against most targets, with nothing on the weapon row to
     say so: the feature sat on one sub-tab and the weapon on another.

     Source values per app/data/class_stitcher_resources.js and class_scoundrel_shaper.js,
     both verified word for word against Part 1 on 2026-08-21. */
  function itemTrait(it, name) {
    return (it && it.traits || []).some(function (t) { return new RegExp("^" + name).test(t); });
  }
  function isMeleeItem(it) { return !!it && (it.group === "Simple" || it.group === "Martial"); }
  var ATTACK_ATTR_OFFERS = [
    { feature: "First Do No Harm", attr: "TEC", when: "against an organic target",
      fits: function (it) { return itemTrait(it, "Light"); } },
    /* Resonant Edge is listed for completeness and, as the rules stand, never fires. It
       offers Body instead of Agility on a Finesse or Light melee weapon, and combat.js
       already resolves a melee attack to Body UNLESS the weapon is Finesse and Agility is
       the higher of the two, so the engine has always given the better attribute. The row
       stays because the next reader will otherwise ask why this feature is unhandled, and
       because it starts working the day that default changes. */
    { feature: "Resonant Edge", attr: "BOD", when: "",
      fits: function (it) { return isMeleeItem(it) && (itemTrait(it, "Finesse") || itemTrait(it, "Light")); } }
  ];
  /* THE resolver for "does anything let this weapon attack off a better attribute".
     Offers only an IMPROVEMENT: an option that ties or loses is noise on the row, and the
     feature's own text is a sub-tab away for anyone who wants the full rule. */
  function attackAttrOffers(d, it, currentMod) {
    if (!d || !it) return [];
    var names = (d.features || []).map(function (f) { return f.name; });
    var out = [];
    ATTACK_ATTR_OFFERS.forEach(function (o) {
      if (names.indexOf(o.feature) === -1 || !o.fits(it)) return;
      var a = d.attributes && d.attributes[o.attr];
      if (!a || a.mod <= currentMod) return;
      out.push({ feature: o.feature, attr: o.attr, attrName: a.name, mod: a.mod,
                 delta: a.mod - currentMod, when: o.when });
    });
    return out;
  }

  /* THE resolver for "is an offer switched on for this weapon, and is it still legal".
     Validated on read rather than pruned on write: a stored pick naming a feature the
     character has since retrained away, or an attribute that is no longer the better one,
     resolves to nothing and the row quietly goes back to its default. That keeps one
     writer (the toggle) and no cleanup path to forget.
     baseMod is the attribute modifier the weapon would use WITHOUT any offer, so the
     comparison is always against the honest default. */
  function activeAttackAttr(ch, d, it, key, baseMod) {
    var want = (ch && ch.attackAttr && key) ? ch.attackAttr[key] : null;
    if (typeof want !== "string" || !want) return null;
    var offers = attackAttrOffers(d, it, baseMod);
    for (var i = 0; i < offers.length; i++) {
      if (offers[i].feature === want) return offers[i];
    }
    return null;
  }

  /* ---- Condition immunity -------------------------------------------------
     The channel the comment above damageResistances has been asking for. Condition
     immunity is a different axis from a damage type: "immune to Frightened" is not a
     resistance level against a damage type, and folding it into that table would have
     meant a condition name masquerading as one.

     RENDERED, NEVER ENFORCED. Nothing here stops a condition being applied. A GM can put
     Frightened on an Arboreal for a reason the sheet cannot see, and a sheet that refused
     would be wrong more often than the rule is. The player gets a chip on that condition
     saying which feature says otherwise, and decides at the table. That is the same
     posture unarmedRider.when takes with its free-text condition.

     Source values per app/data/species.js, condition names per app/data/conditions.js.
     Deliberately NOT here: the two source-qualified grants. Frictionless Stasis is immune
     to Grappled "from sticky traps or biological webbing" and Olfactory Insight can never
     be Surprised "by an organic Target". ch.conditions records that a condition is on you,
     never what put it there, so the qualifier is unrepresentable and a blanket immunity
     would be a stronger claim than the manuscript makes. */
  function conditionImmunities(ch) {
    var out = [];
    activeLineageFeatures(ch).forEach(function (fn) {
      var m = LINEAGE_MECH[fn];
      (m && m.condImmune ? m.condImmune : []).forEach(function (c) {
        out.push({ condition: c, source: fn, kind: "lineage" });
      });
    });
    // class features: Absolute Discipline (Veteran Instincts) "You can't be Surprised"
    classFeatureMechanics(ch).condImmune.forEach(function (r) {
      out.push({ condition: r.condition, source: r.source, kind: "class" });
    });
    return out;
  }
  // THE lookup for "does anything say this character cannot take this condition".
  // Returns the granting rows, empty when nothing does.
  function immunitiesFor(ch, conditionName) {
    return conditionImmunities(ch).filter(function (r) { return r.condition === conditionName; });
  }
  var RESIST_LEVELS = { immune: 3, vulnerable: 2, resist: 1 };
  function pushResist(acc, level, types, label) {
    (types || []).forEach(function (t) {
      if (typeof t !== "string" || !t) return;
      acc.push({ type: t, level: level, label: label });
    });
  }
  function damageResistances(ch, linFeats, worn, attuned) {
    var acc = [];
    // lineage features
    (linFeats || []).forEach(function (fn) {
      var m = LINEAGE_MECH[fn]; if (!m) return;
      pushResist(acc, "resist", m.resist, fn);
      pushResist(acc, "vulnerable", m.vulnerable, fn);
      pushResist(acc, "immune", m.immune, fn);
    });
    // Talents
    activeTalents(ch).forEach(function (t) {
      var spec = TALENT_RESIST[t.talent.key]; if (!spec) return;
      pushResist(acc, "resist", spec.resist, t.talent.name);
      pushResist(acc, "vulnerable", spec.vulnerable, t.talent.name);
      pushResist(acc, "immune", spec.immune, t.talent.name);
    });
    /* ...and the ones whose type the player chose. resistPick returns null for an unbought
       Upgrade or an unanswered menu, so nothing is guessed. The label takes the parenthetical
       the worn-trait rows use, since the grant comes from the Upgrade rather than the Talent. */
    activeTalents(ch).forEach(function (t) {
      var picked = resistPick(ch, t.talent.key);
      if (picked) pushResist(acc, "resist", [picked], t.talent.name + " (Upgrade)");
    });
    // the worn suit: its own flags, and its TRAITS (Sealed grants Toxic)
    if (worn && worn.item && !worn.lapsed) {
      pushResist(acc, "resist", worn.item.resist, worn.item.name);
      pushResist(acc, "vulnerable", worn.item.vulnerable, worn.item.name);
      pushResist(acc, "immune", worn.item.immune, worn.item.name);
      /* ...and the type chosen when THIS copy was acquired. Only the WORN suit grants it.
         The book never prints "only while worn" as a general rule for item Resistances, so
         that gate is an inference, but it is the one every other benefit a suit carries
         already runs on: this whole block is inside `if (worn ...)`, and Part 3 prints "You
         wear one suit of armor at a time". A spare in the stash keeps its answer on the
         record and grants nothing until you put it on. The label is the suit's own name,
         because the Resistance is the suit's the way its DR is. */
      armorResistPicks(ch, worn.key, worn.item).forEach(function (t) {
        pushResist(acc, "resist", [t], worn.item.name);
      });
      var TRAIT_RESIST = (EN.gearCatalog && EN.gearCatalog.armor && EN.gearCatalog.armor.traitResist) || {};
      (worn.item.traits || []).forEach(function (tr) {
        pushResist(acc, "resist", TRAIT_RESIST[tr], worn.item.name + " (" + tr + ")");
      });
      // installed armor Mods on that suit
      var amByKey = (EN.armorMods && EN.armorMods.byKey) || {};
      (worn.fitted || []).forEach(function (k) {
        var m = amByKey[k]; if (!m) return;
        /* The Thermal Regulation Weave is tuned to Fire OR Cold when installed, and that answer
           has been stored per armor entry in ch.hazards.thermalWeave all along: the hazards
           channel reads it and says "no element chosen yet" when it is unset. This channel did
           not, because the mod's data row carried a hardcoded resist:["Fire"], so a Cold-tuned
           weave was reported as Fire with the mod's own name asserting it, and two channels
           disagreed about one mod. The array is gone from the row; this is the only reader now,
           and an untuned weave resists nothing rather than guessing. */
        if (m.key === "thermal-regulation-weave") {
          var tuned = ((ch && ch.hazards && ch.hazards.thermalWeave) || {})[worn.key];
          if (tuned === "Fire" || tuned === "Cold") pushResist(acc, "resist", [tuned], m.name);
        }
        /* The Ablative Coating, whose type is chosen at install and whose Resistance BURNS AWAY
           on the hit it stops. Nothing is pushed while it is spent, and deliberately no row
           qualified with "(spent)" either: this list is a list of Resistances you HAVE, `level`
           is derived purely from which buckets are filled, and there is no level meaning
           "granted but suspended". A spent coating says so where its two controls are, on the
           bench row and on the Defense chip, rather than as a row here that contradicts itself. */
        if (m.key === "ablative-coating") {
          var ab = ablativeState(ch, worn.key);
          if (ab.live) pushResist(acc, "resist", [ab.type], m.name);
        }
        pushResist(acc, "resist", m.resist, m.name);
        pushResist(acc, "vulnerable", m.vulnerable, m.name);
        pushResist(acc, "immune", m.immune, m.name);
      });
    }
    // installed chrome, per tier
    var items = (EN.cyberware && EN.cyberware.items) || [];
    ((ch && ch.cyberware) || []).forEach(function (cw) {
      if (!cw || typeof cw !== "object") return;
      var def = items.filter(function (i) { return i.key === cw.key; })[0];
      var tier = def && (def.tiers || []).filter(function (t) { return t.tier === cw.tier; })[0];
      var b = tier && tier.bonus; if (!b) return;
      pushResist(acc, "resist", b.resist, def.name);
      pushResist(acc, "vulnerable", b.vulnerable, def.name);
      pushResist(acc, "immune", b.immune, def.name);
      // the Unattuned half of a split clause; see cyberFlatBonuses for the pair of it
      if (!attuned && b.unattuned) {
        pushResist(acc, "resist", b.unattuned.resist, def.name + " (Unattuned)");
        pushResist(acc, "vulnerable", b.unattuned.vulnerable, def.name + " (Unattuned)");
        pushResist(acc, "immune", b.unattuned.immune, def.name + " (Unattuned)");
      }
    });

    // resolve per type, applying the book's three rules
    var byType = Object.create(null);
    acc.forEach(function (e) {
      var cur = byType[e.type] || (byType[e.type] = { type: e.type, resist: [], vulnerable: [], immune: [] });
      if (cur[e.level].indexOf(e.label) === -1) cur[e.level].push(e.label);
    });
    var out = [];
    Object.keys(byType).sort().forEach(function (t) {
      var c = byType[t], level, why;
      if (c.immune.length) { level = "Immune"; why = c.immune; }
      else if (c.resist.length && c.vulnerable.length) {
        level = "Normal"; why = c.resist.concat(c.vulnerable);   // they cancel; shown so it is not a mystery
      }
      else if (c.resist.length) { level = "Resistant"; why = c.resist; }
      else if (c.vulnerable.length) { level = "Vulnerable"; why = c.vulnerable; }
      else return;
      // the three buckets ride along so netDamage can drop one of them (Spatial Shearing
      // "ignores Resistance to Force", which turns a cancelled pair back into Vulnerable)
      out.push({ type: t, level: level, sources: why, resist: c.resist.slice(), vulnerable: c.vulnerable.slice(), immune: c.immune.slice() });
    });
    return out;
  }

  /* ---- NET DAMAGE: the Damage Order's step 3 for one hit of one type ----------------
     The Player's Handbook (25 October 2026 handoff, batches 79 and 80): "Armor DR stops only
     Standard Physical Damage; other types take it only where an entry says so." Standard
     Physical Damage is the five types the book prints under that heading (EN.combat.damageTypes,
     group "Standard Physical": Nonlethal, Ballistic, Piercing, Bludgeoning, Slashing). Every DR
     the sheet sums into d.totalDR already names physical damage in its own text (the worn suit,
     a flat-DR armor Mod, Ironbark Carapace and Ironhide Tusks, Subdermal Armor).
     The one entry that says so for another type is the Resonant Plating trait: "The armor's DR
     also applies against Resonant damage". It extends the SUIT's DR (the worn armor and its
     flat-DR Mod), never a lineage's natural DR or chrome.
     Then Resistance, Vulnerability or Immunity from d.resistances, by the book's arithmetic
     (halve rounded down, double, or none). Three clauses turn on the Target, which the sheet
     cannot see, so the caller answers them:
       opts.noPoweredTech  Tech: "Deals 0 damage to a Target with no powered tech on or in them."
       opts.plainMachine   Resonant: "Deals 0 damage to plain machines, drones, and objects."
     A type written "Force (Spatial)" or "Force (Spatial Shearing)" is Force that "ignores
     Resistance to Force" (the Spatial Damage Profile); opts.ignoreResist does the same for any type.
     `amount` is what is left after step 2 (the Active Defense).
     Returns { amount, type, physical, dr, drFrom, afterDR, level, resistIgnored, net, zeroBy }. */
  var STANDARD_PHYSICAL = ["Nonlethal", "Ballistic", "Piercing", "Bludgeoning", "Slashing"];
  function isStandardPhysical(type) {
    var rows = (EN.combat && EN.combat.damageTypes) || [];
    var row = rows.filter(function (t) { return t && t.name === type; })[0];
    if (row && row.group) return row.group === "Standard Physical";
    return STANDARD_PHYSICAL.indexOf(type) !== -1;
  }
  function armorDRAgainst(d, type) {
    var dg = (d && d.defenseGear) || {};
    var suit = (d && d.armorDR || 0) + (dg.armorModDR || 0);
    if (isStandardPhysical(type)) return { dr: (d && d.totalDR) || 0, from: "Standard Physical Damage" };
    var plated = !!(dg.armor && !dg.armorLapsed && (dg.armor.traits || []).indexOf("Resonant Plating") !== -1);
    if (type === "Resonant" && plated) return { dr: suit, from: "Resonant Plating" };
    return { dr: 0, from: null };
  }
  function netDamage(d, amount, type, opts) {
    opts = opts || {};
    var raw = Math.max(0, parseInt(amount, 10) || 0);
    var t = String(type || ""), ignoreResist = !!opts.ignoreResist;
    var sp = /^Force \(Spatial( Shearing)?\)$/.exec(t);
    if (sp) { t = "Force"; ignoreResist = true; }
    var out = { amount: raw, type: t, physical: isStandardPhysical(t), dr: 0, drFrom: null, afterDR: raw, level: "Normal", net: raw, zeroBy: null };
    if (t === "Tech" && opts.noPoweredTech) { out.afterDR = 0; out.net = 0; out.zeroBy = "Tech deals 0 damage to a Target with no powered tech on or in them."; return out; }
    if (t === "Resonant" && opts.plainMachine) { out.afterDR = 0; out.net = 0; out.zeroBy = "Resonant deals 0 damage to plain machines, drones, and objects."; return out; }
    var a = armorDRAgainst(d, t);
    out.dr = a.dr; out.drFrom = a.from;
    out.afterDR = Math.max(0, raw - a.dr);
    var row = ((d && d.resistances) || []).filter(function (r) { return r.type === t; })[0];
    var level = "Normal";
    if (row) {
      var im = (row.immune || []).length, rs = ignoreResist ? 0 : (row.resist || []).length, vu = (row.vulnerable || []).length;
      if (!row.immune && !row.resist && !row.vulnerable) level = row.level;   // a row from before the buckets
      else level = im ? "Immune" : (rs && vu) ? "Normal" : rs ? "Resistant" : vu ? "Vulnerable" : "Normal";
    }
    out.level = level;
    // a Resistance the character holds and this hit passes straight through
    out.resistIgnored = !!(ignoreResist && row && (row.resist || []).length);
    out.net = level === "Immune" ? 0 : level === "Resistant" ? Math.floor(out.afterDR / 2) : level === "Vulnerable" ? out.afterDR * 2 : out.afterDR;
    return out;
  }

  /* ---- OPEN ARCHITECTURE, generically ---------------------------------------
     "Whenever you have both halves of a listed pairing (the Lineage Feature and its
     matching cyberware, installed at any tier), that clause activates: the Engineered
     Baseline effect ends as a separate system and is absorbed into the chrome, the chrome
     gains enhanced capability, and its Static Point cost is reduced by 1 (minimum 0)."

     Measured before this was written: NONE of the seven pairings moved a single derived
     number. The only difference Open Architecture made to a character record was its own
     entry appearing in the feature list. It cost a Lineage Feature pick and bought prose.

     Driven off R.openArchitecture.combos, which already carries every feature-and-chrome
     pair as data, so this is one predicate for all seven rather than seven predicates. A
     combo's `cyberware` may name alternatives ("Cyberlegs or Spring Joints"), which is why
     the match splits on " or " the same way the builder card's comboHasChrome does.

     Matched on the installed piece's NAME rather than its key, because the Open Architecture
     card's own toggle and the Chrome tab historically wrote different shapes and the combo
     data speaks in names. The key is preferred when it resolves, so a renamed catalog entry
     still matches, which is what carried the Cybereyes to Cyberoptics rename through.

     Each combo now carries its own Integration NAME (Dermal Aegis, Springstep, ...), because
     the 2026-08-12 sync made every pairing a named record in its own right rather than an
     anonymous clause hanging off the feature. */
  function openArchCombos(ch) {
    var R = EN.rules || {};
    var oa = R.openArchitecture || {};
    var out = [];
    if (activeLineageFeatures(ch).indexOf("Open Architecture") === -1) return out;
    var feats = activeLineageFeatures(ch);
    var items = (EN.cyberware && EN.cyberware.items) || [];
    var inst = ((ch && ch.cyberware) || []).filter(function (cw) { return cw && typeof cw === "object"; });
    (oa.combos || []).forEach(function (combo) {
      if (!combo || feats.indexOf(combo.feature) === -1) return;
      var opts = String(combo.cyberware || "").split(/\s+or\s+/).map(function (x) { return x.trim(); });
      var piece = inst.filter(function (cw) {
        var def = cw.key ? items.filter(function (i) { return i.key === cw.key; })[0] : null;
        var nm = (def && def.name) || cw.base || cw.name;
        return opts.indexOf(nm) !== -1;
      })[0];
      if (piece) out.push({ combo: combo, piece: piece });
    });
    return out;
  }

  /* NO synthMusculatureIntegrated() predicate lives here any more, deliberately.
     It was written to gate the damage step and the author's ruling removed that job: the step
     is a blanket one and fires whether or not the pairing is integrated. What Open
     Architecture still owes the pairing is its "Static Point cost is reduced by 1 (minimum 0)",
     and that is NOT implemented anywhere (see staticTotal below, which knows about
     platform-slotted mods and the Resonance Crown and nothing else). When it is written it
     should be GENERIC over R.openArchitecture.combos, covering all seven pairings from data,
     rather than a one-off predicate for this one. Recorded in DEFERRED-FIXES. */
  function unarmedReplacers(ch) {
    var out = [];
    activeLineageFeatures(ch).forEach(function (fn) {
      var m = LINEAGE_MECH[fn];
      if (!m || !m.unarmed) return;
      out.push({ source: fn, pick: fn, label: fn, kind: "lineage", die: m.unarmed.die,
        type: m.unarmed.type, traits: m.unarmed.traits || null, note: m.unarmed.note || null });
    });
    installedCyberware(ch).forEach(function (cw) {
      var spec = cw && CYBER_UNARMED[cw.key];
      if (!spec) return;
      // a legacy hand-entered piece carries no tier; read it at its lowest one
      var t = spec.tiers[cw.tier] || spec.tiers.Streetware;
      var nm = cw.base || cw.name;
      // Two installs of the same piece at different tiers are different effects,
      // not one choice, so the tier and side are part of what is being chosen
      // between. Keying the pick on the name alone would make the second one
      // unreachable, which is the exact bug this function exists to remove.
      var qual = (cw.tier ? " · " + cw.tier : "") + (cw.side ? " (" + cw.side + ")" : "");
      out.push({ source: nm, pick: nm + qual, label: nm + qual, kind: "chrome", die: t.die,
        type: spec.type, traits: spec.traits || null, note: t.note || null });
    });
    // identical installs (a matched pair of arms) collapse; differing ones do not
    var seen = {};
    return out.filter(function (o) { if (seen[o.pick]) return false; seen[o.pick] = true; return true; });
  }
  // Every source of Oomph (Unarmed), as {count, sources}; count is the total Oomph. The sources stay
  // itemised so the sheet can say WHY the die reads 1d10 instead of just showing
  // a number the player has to take on faith.
  function unarmedIncreases(ch) {
    var sources = [];
    /* Synthetic Musculature's step is a BLANKET one and stays that way integrated or not.
       Brandon ruled on the razors case, 2026-08-12: "enhance all unarmed by one step, making
       the fist and the razor 1 step higher independently and not stacking."

       An earlier cut read "the Engineered Baseline effect ends ... in its place, the
       Reinforced Skeleton's unarmed strike damage die increases by one size" as relocating
       the benefit ONTO the implant, which took the step away from every other replacer. That
       made Open Architecture a downgrade for anyone running a second one: skeleton plus Hand
       Razors, striking with the razors, went 1d8 Slashing to 1d6 and lost Armor Piercing 1 at
       that die size. Measured, reported, and reversed by the author.

       "Independently and not stacking" is what the STRIKE picker already renders: each option
       is shown at its own die plus the step count, so the fist, the skeleton and the razors
       each read one size up and nothing compounds, because you only ever strike with one.

       The pairing therefore adds no DAMAGE the character did not already have, which is the
       original L4 finding standing after all. Its live benefit is the Static Point reduction,
       and the Encumbrance Threshold and Size-for-grappling halves the clause retains. */
    /* The sources are the Oomph (Unarmed) rows of scopedOomphSources, in its order: lineage
       (Synthetic Musculature), Talents (Street Scrapper and its Upgrade), gear on your hands
       printing Oomph (Unarmed) (Knuckles), and applied Bonuses. The last is the Ripper Hot-Wire
       a Stitcher installs on an ALLY, so nothing on the recipient's record can imply it; the
       player declares it in the Status Changes panel and it lands here as one step. */
    scopedOomphSources(ch).forEach(function (s) {
      if (scopeKey(s.scope) !== "unarmed") return;
      sources.push({ label: s.label, kind: s.kind, steps: s.steps, scope: s.scope, note: s.note || null, noFirstDie: !!s.noFirstDie });
    });
    var count = 0;
    sources.forEach(function (s) { count += s.steps; });
    return { count: count, sources: sources };
  }
  // Extra dice riding alongside the strike, as [{label, kind, damage, when, note}].
  // `when` names the condition a rider waits on, so the sheet can list a Surge
  // rider without pretending it is always live.
  function unarmedRiders(ch) {
    var out = [];
    activeLineageFeatures(ch).forEach(function (fn) {
      var m = LINEAGE_MECH[fn];
      if (!m || !m.unarmedRider) return;
      out.push({ label: fn, kind: "lineage", damage: m.unarmedRider.damage,
        when: m.unarmedRider.when || null, note: m.unarmedRider.note || null });
    });
    activeTalents(ch).forEach(function (t) {
      var spec = TALENT_UNARMED_RIDER[t.talent.key];
      if (!spec) return;
      out.push({ label: t.talent.name, kind: "talent", damage: spec.damage,
        when: spec.when || null, note: spec.note || null });
    });
    Object.keys(GEAR_UNARMED_RIDER).forEach(function (nm) {
      if (!unarmedGearOnHands(ch, nm)) return;
      var spec = GEAR_UNARMED_RIDER[nm];
      out.push({ label: nm, kind: "gear", damage: spec.damage,
        when: spec.when || null, note: spec.note || null });
    });
    return out;
  }
  // Extra reach, which is not damage: Canopy Reach lengthens the strike without
  // adding a single point to it, so it stays off every damage path.
  function unarmedReach(ch) {
    var spaces = 0, sources = [];
    activeLineageFeatures(ch).forEach(function (fn) {
      var m = LINEAGE_MECH[fn];
      if (!m || !m.unarmedReach) return;
      spaces += m.unarmedReach;
      sources.push(fn);
    });
    return { spaces: spaces, sources: sources };
  }
  /* ---- Weapon reach: THE one resolver -------------------------------------
     "Melee range covers any space directly adjacent to you ... Each point of Reach
     extends the weapon's range by 1 space beyond Melee range." So the number a row
     shows is 1 + total Reach points, and points simply ADD; there is no stacking
     rule to arbitrate.

     Three grants existed in the data with three different SCOPES, all of them prose
     with no engine path, which is why an Arboreal's Longsword read the same reach as
     everyone else's. A single character-level bonus would be correct for only the
     first, so this takes the WEAPON as well as the character:

       part       Extended Shaft, +1, and only on the weapon it is fitted to.
                  ch.weaponParts is keyed by the equipment ENTRY since 2026-08-12, so
                  it applies to that one weapon and not to every copy of its name.
                  The part itself only FITS a long-shafted weapon, so this and the
                  talent below now gate on the same question.
       talent     Staff & Spear Master's Level 6+ Upgrade, +1 to LONG-SHAFTED weapons.
                  Not "weapons with Reach": the manuscript retargeted this on
                  2026-08-11 and the talent now says "long-shafted weapons, such as a
                  staff or spear" throughout. A Whip has Reach 2 and is not one; a
                  shafted Longsword has Reach and is not one either. Read it off
                  isLongShafted(), never off its Reach.
       lineage    Canopy Reach, +1 to every melee weapon, unconditional, and it is
                  the one grant that BREAKS THE CAP.

     ORDER, and every step of it is load-bearing:
       base + part, because the shaft "increases Reach by 1" on the weapon itself;
       + the talent, which is also a property of the weapon in your hands;
       CAP HERE, because the general rule is "if an effect would increase a weapon's
         Reach beyond its cap ... any excess is lost. A feature can exceed this cap
         only if its own text specifically says so", and neither the part nor the
         talent says so;
       + Canopy Reach LAST and uncapped, because its text does say so: "This bonus
         can exceed a weapon's normal Reach cap, since the vine is extending the
         attack rather than the weapon itself."

     Ranged weapons are not touched: their row shows RANGE, not REACH. */
  /* Every Part installed on this weapon. It used to walk Object.keys(loadout) and index
     byKey with whatever each property held, which quietly got two things wrong: it probed
     `_profile` (a profile name, never a part key) as though it were a slot, and it handed
     byKey the whole UTILITY ARRAY, which stringifies to "key1,key2" and matches nothing.
     Utility holds two of the fifteen Utility Parts and NONE of them resolved. Latent
     rather than live, because the only Part carrying engine-read flags today
     (Extended Shaft: reachBonus, grantsTwoHanded) sits in Handling. It was a trap for the
     next one. Enumerated the same way inventory.js's allInstalledKeys() does, because
     "which Parts are on this weapon" should not have two different answers. */
  function weaponPartsOn(ch, key) {
    var lo = ((ch && ch.weaponParts) || {})[key] || {};
    var byKey = (EN.weaponParts && EN.weaponParts.byKey) || {};
    var keys = ["targeting", "output", "core", "handling"]
      .map(function (slot) { return lo[slot]; })
      .concat(Array.isArray(lo.utility) ? lo.utility : []);
    return keys.map(function (k) { return byKey[k]; }).filter(Boolean);
  }
  function isMeleeWeapon(item) { return !!item && /^Melee/i.test(String(item.range || "")); }
  /* LONG-SHAFTED is one question with one answer, asked by two unrelated systems: the
     Staff & Spear Master reach bonus below, and the mod bench's Fits gate on the
     Extended Shaft. It lived as a bare `!!item.shafted` read in exactly one of them.

     The catalog's own flag WINS whenever it states anything, true or false, because it
     is the book's word about a weapon the book carries. The name list is the fallback
     for an item that says nothing, and it is future-proofing rather than classification:
     Brandon named five weapons the book does not carry yet so that an expansion cannot
     land silently unshafted. Order matters: `typeof === "boolean"` and not a truthiness
     test, or an explicit `shafted: false` would fall through to the names and be
     overturned by the very list it is supposed to outrank. */
  function isLongShafted(item) {
    if (!item) return false;
    if (typeof item.shafted === "boolean") return item.shafted;
    var names = ((EN.combat || {}).longShaftedNames) || [];
    return names.indexOf(String(item.name || "")) !== -1;
  }
  /* `key` is the equipment ENTRY this weapon is, because a Part is fitted to one piece
     and not to a name. Passing no key is not an error and not a fallback to the name: it
     answers for an unmodded weapon of this type, which is what a caller with no entry in
     hand (a catalog preview, a shop card) is actually asking about. Falling back to the
     name would quietly restore the bug this replaced. */
  function weaponReach(ch, item, key) {
    var out = { melee: isMeleeWeapon(item), base: 0, bonus: 0, total: 0, sources: [],
                flexible: !!(item && item.flexible), cap: 0, capped: 0 };
    if (!out.melee) return out;
    var caps = ((EN.combat || {}).reachCap) || { rigid: 2, flexible: 3 };
    out.cap = out.flexible ? caps.flexible : caps.rigid;
    var m = String(item.range || "").match(/Reach\s*(\d+)/i);
    out.base = m ? parseInt(m[1], 10) : 0;
    out.shafted = isLongShafted(item);
    var pts = out.base;
    // the part, which increases the weapon's own Reach
    weaponPartsOn(ch, key).forEach(function (p) {
      if (!p || !p.reachBonus) return;
      pts += p.reachBonus;
      out.sources.push({ label: p.name, kind: "part", spaces: p.reachBonus });
    });
    // the talent, on long-shafted weapons only, and never on Reach alone
    if (out.shafted && talentUpgradeHeld(ch, "staff-spear-master")) {
      pts += 1;
      out.sources.push({ label: "Staff & Spear Master (Upgrade)", kind: "talent", spaces: 1 });
    }
    /* THE CAP, on Reach POINTS rather than on spaces, and applied HERE: a rigid shaft
       or blade stops being swingable past a point, while a lash or a filament pays
       out further. Everything above this line is the weapon plus what has been done
       to the weapon, and the rule is that its excess is lost. `capped` is how many
       points went nowhere, so the row can say so instead of quietly swallowing them. */
    var uncapped = pts;
    pts = Math.min(pts, out.cap);
    out.capped = uncapped - pts;
    /* AND THEN the grants whose own text lets them break the cap, added after it.
       "A feature can exceed this cap only if its own text specifically says so", and
       Canopy Reach says exactly that: the vine is extending the ATTACK, not the
       weapon. So a capped Quarterstaff still gains its space. */
    activeLineageFeatures(ch).forEach(function (fn) {
      var lm = LINEAGE_MECH[fn];
      if (!lm || !lm.meleeReach) return;
      pts += lm.meleeReach;
      out.uncapped = (out.uncapped || 0) + lm.meleeReach;
      out.sources.push({ label: fn, kind: "lineage", spaces: lm.meleeReach, breaksCap: true });
    });
    out.bonus = pts - out.base;
    out.total = 1 + pts;              // the adjacent space, plus a space per Reach point
    /* One sentence, built here, so the weapon row, the print sheet and the PDF cannot
       word this three different ways. It has to name the sources AND the cap when the
       cap bit: "+1 (Extended Shaft, Staff & Spear Master, Canopy Reach)" reads as three
       features producing one point, which is exactly the confusion the cap creates. */
    if (out.sources.length) {
      var capped = out.sources.filter(function (s) { return !s.breaksCap; }).map(function (s) { return s.label; });
      var breaks = out.sources.filter(function (s) { return s.breaksCap; }).map(function (s) { return s.label; });
      var bits = [];
      if (capped.length) bits.push(capped.join(", "));
      if (out.capped) {
        bits.push("capped at Reach " + out.cap + " for a " + (out.flexible ? "flexible" : "rigid")
          + " weapon, so " + out.capped + " point" + (out.capped > 1 ? "s are" : " is") + " lost");
      }
      // named separately, because a total ABOVE the cap otherwise looks like a bug
      if (breaks.length) bits.push(breaks.join(", ") + (out.capped || out.total > 1 + out.cap ? " reaches past the cap" : ""));
      out.note = "reaches " + out.total + " space" + (out.total === 1 ? "" : "s") + " (" + bits.join("; ") + ")";
    } else out.note = "";
    return out;
  }
  /* ---- Grip: THE one resolver for which damage die a weapon is actually using ----
     "Versatile: the weapon lists an alternate damage die in parentheses. Use the base
     damage when wielded in one hand, and the Versatile damage when wielded in two."
     So a Versatile weapon does not HAVE two damage ratings, it has one at a time, and
     which one is a fact about how you are holding it. The row used to print both
     ("1d8 (1d10)") and leave the player to pick, and the damage tray carried its own
     two-handed toggle that reset to one-handed every time it opened.

     "Two-Handed: requires both hands for effective use." A weapon that is Two-Handed
     therefore has no one-handed grip to choose, and if it is also Versatile the
     alternate die is simply its damage. That is reachable two ways: the trait on the
     weapon itself, and the Extended Shaft, whose text ends "and grants the Two-Handed
     trait". Fitting one to a Versatile weapon spends its lower die permanently.

     `forcedBy` names whichever did it, so the row can say why the choice is gone
     rather than silently removing a toggle the player used yesterday.

     `key` is the equipment ENTRY, for the same reason weaponReach takes one: the grip is a
     fact about the weapon in your hands, and a forced grip comes from a Part fitted to that
     one piece. No key answers for an unmodded, one-handed weapon of this type. */
  function weaponVersatileDie(item) {
    var traits = (item && item.traits) || [];
    for (var i = 0; i < traits.length; i++) {
      var m = String(traits[i]).match(/^Versatile\s*\((\d+d\d+)\)$/i);
      if (m) return m[1];
    }
    return null;
  }
  /* OOMPH IS APPLIED HERE, so every reader of baseDice / versatile / dice picks it up: those
     three now hold the STEPPED dice. "A Versatile weapon steps whichever die you're using", so
     both dice are stepped and the grip picks between them as before. The book's printed dice
     stay alongside as printedBase / printedVersatile / printedDice, for the Oomph note ("2d6
     steps to 2d8"), the print sheet and the PDF. `oomph` is oomphFor()'s answer, with applied and lost
     measured against the die in use, and `oomph.note` is the one sentence that explains it. */
  function weaponGrip(ch, item, key) {
    var traits = (item && item.traits) || [];
    var out = {
      versatile: weaponVersatileDie(item),
      baseDice: (String((item && item.damage) || "").match(/^\s*(\d+d\d+)/) || [])[1] || null,
      twoHandedTrait: traits.indexOf("Two-Handed") !== -1,
      forcedBy: null, twoHanded: false, canToggle: false, dice: null, why: ""
    };
    out.printedBase = out.baseDice;
    out.printedVersatile = out.versatile;
    if (out.twoHandedTrait) out.forcedBy = "the Two-Handed trait";
    weaponPartsOn(ch, key).forEach(function (p) {
      if (p && p.grantsTwoHanded && !out.twoHandedTrait) out.forcedBy = p.name;
    });
    if (out.forcedBy) {
      out.twoHanded = true;
      out.canToggle = false;
    } else if (out.versatile) {
      out.twoHanded = (((ch && ch.weaponGrip) || {})[key] === "two");
      out.canToggle = true;
    }
    out.printedDice = (out.twoHanded && out.printedVersatile) ? out.printedVersatile : out.printedBase;
    var oo = oomphFor(ch, { kind: "weapon", item: item, key: key, die: out.printedDice });
    // a printed die steps; a weapon with none (Knuckles) has nothing to step, never 1d4
    if (out.printedBase) out.baseDice = stepDie(out.printedBase, oo.total);
    if (out.printedVersatile) out.versatile = stepDie(out.printedVersatile, oo.total);
    out.dice = (out.twoHanded && out.versatile) ? out.versatile : out.baseDice;
    oo.note = "";
    if (oo.sources.length && out.printedDice) {
      var bits = oo.sources.map(function (s) { return s.label + " +" + s.steps; });
      oo.note = "Oomph +" + oo.total + " (" + bits.join(", ") + ")";
      oo.note += oo.applied ? ": " + out.printedDice + " steps to " + out.dice + "." : ".";
      if (oo.partsCapped) {
        oo.note += " Parts give at most Oomph +1, so " + (oo.partsTotal - 1) + " from Parts "
          + ((oo.partsTotal - 1) === 1 ? "is" : "are") + " lost.";
      }
      if (oo.lost) {
        oo.note += " Nothing steps past 1d12, so Oomph +" + oo.lost + " is lost.";
      }
    }
    out.oomph = oo;
    if (out.versatile && out.forcedBy) {
      out.why = "Held in two hands because of " + out.forcedBy + ", so it deals its Versatile "
        + out.versatile + " and its one-handed " + out.baseDice + " is out of reach.";
    } else if (out.versatile) {
      out.why = out.twoHanded ? "Held in two hands: " + out.versatile + "."
                              : "Held in one hand: " + out.baseDice + ". Two hands deals " + out.versatile + ".";
    } else if (out.forcedBy) {
      out.why = "Held in two hands because of " + out.forcedBy + ".";
    }
    if (oo.note) out.why = out.why ? out.why + " " + oo.note : oo.note;
    return out;
  }
  // The replacer the character is striking with: their stored pick while it is
  // still available, otherwise the first one. null means the bare strike, either
  // because they picked it or because they have no replacers at all.
  function resolveUnarmed(ch, replacers) {
    var pick = ch && ch.unarmedPick;
    if (pick === UNARMED_BASE_PICK) return null;
    var chosen = replacers.filter(function (o) { return o.pick === pick; })[0];
    return chosen || replacers[0] || null;
  }
  // The whole strike: the chosen replacer resolved FIRST, then Oomph (Unarmed)
  // applied on top of it. `die` null is the bare flat-1 punch.
  /* Step an unarmed or improvised die by its sources. A strike with no die takes 1d4 from its
     first step of Oomph, but a noFirstDie source (Pneumatic Bypass) only steps a die that is
     there: with no die and nothing else stepping, it changes nothing (no step applied or lost). */
  function unarmedStepInfo(die, sources) {
    var total = 0, granting = 0;
    (sources || []).forEach(function (s) { total += s.steps; if (!s.noFirstDie) granting += s.steps; });
    if ((die == null || die === "") && granting <= 0) return { die: null, applied: 0, lost: 0, offLadder: false };
    return stepDieInfo(die, total);
  }
  function resolveUnarmedStrike(ch) {
    var replacers = unarmedReplacers(ch);
    var replacer = resolveUnarmed(ch, replacers);
    var inc = unarmedIncreases(ch);
    var baseDie = replacer ? replacer.die : UNARMED_BASE.die;
    var info = unarmedStepInfo(baseDie, inc.sources);
    var die = info.die;
    return {
      die: die,
      // Oomph (Unarmed): the total, the steps that landed and the steps lost past 1d12
      oomph: { total: inc.count, applied: info.applied, lost: info.lost },
      // The flat 1 is what a strike with no die deals. Once anything grants a die
      // you roll that instead, so the 1 and the die are never both in play. There
      // is no damage floor here: the rule does not give unarmed strikes one.
      flat: die ? 0 : UNARMED_BASE.flat,
      type: replacer ? replacer.type : UNARMED_BASE.type,
      traits: replacer ? (replacer.traits || null) : null,
      note: replacer ? (replacer.note || null) : null,
      replacer: replacer, replacers: replacers,
      baseDie: baseDie, increases: inc,
      riders: unarmedRiders(ch), reach: unarmedReach(ch)
    };
  }
  // Talents the character has taken via Universal Upgrades (type "talent"), resolved
  // against EN.talents. Folded into d.features so the play sheet and print sheet
  // surface them with their action type and rules text.
  /* ONE ENTRY PER TALENT, not one per slot. A Talent is something you have, not a
     quantity you stack: nothing in the ruleset lets the same Talent apply twice, and
     the Upgrade picker has always refused to offer one it had already taken. The
     talent picker did not, so the same Talent could sit in two Universal Upgrade
     slots, and this function pushed an entry for each.

     Every consumer then counted it twice, because they all read this one list:
     unarmedIncreases pushed two step sources AND two Upgrade sources, unarmedRiders
     pushed two riders, and derive() rendered the Talent twice on the play sheet.
     Measured on a level 6 character with empty hands: Street Scrapper in slots 2 and
     4 punched 1d6 off a bare fist at `inc 2`, and adding its Upgrade in slot 6 made
     that `inc 4` and 1d10. Harmless before the unarmed rewrite, because Street
     Scrapper used to SET a die rather than step one, so a second copy set it again.

     The EARLIEST slot wins, since that is the level the character actually gained it
     at, and `level` is what the play sheet prints beside the feature. Sorted
     numerically rather than trusting key order, because these are object keys. */
  /* A Talent slot may name its Talent by KEY or by display NAME: both shapes are in saved
     records and both resolve. One function does that lookup, because three copies of it
     had grown and any disagreement between them is a disagreement about what a Talent IS.
     Returns the canonical key, or null for a name nothing answers to. */
  function canonTalentKey(keyOrName) {
    if (!keyOrName) return null;
    var t = (EN.talents || []).find(function (x) { return x.key === keyOrName || x.name === keyOrName; });
    return t ? t.key : null;
  }
  function talentRow(keyOrName) {
    var k = canonTalentKey(keyOrName);
    return k ? (EN.talents || []).find(function (x) { return x.key === k; }) : null;
  }
  function activeTalents(ch) {
    var ups = (ch && ch.universalUpgrades) || {}, out = [], seen = Object.create(null);
    Object.keys(ups)
      .sort(function (a, b) { return (Number(a) || 0) - (Number(b) || 0); })
      .forEach(function (lvl) {
        var u = ups[lvl];
        if (!u || u.type !== "talent" || !u.talent) return;
        var t = talentRow(u.talent);
        if (!t || seen[t.key]) return;
        seen[t.key] = 1;
        out.push({ level: Number(lvl) || 1, talent: t });
      });
    // the Awakening slot traded for a standard Talent ({ type: "talent", talent: key }), at Level 4
    var awk = awakeningPick(ch);
    if (awk && awk.type === "talent") {
      var at = talentRow(awk.talent);
      if (at && !seen[at.key]) { seen[at.key] = 1; out.push({ level: 4, talent: at, awakening: true }); }
      out.sort(function (a, b) { return a.level - b.level; });
    }
    return out;
  }
  /* The slots that hold a Talent some EARLIER slot already holds. They are spent
     choices buying nothing, and a player cannot see that from the sheet, so the
     builder says so rather than leaving them to wonder why the second pick did
     nothing. Reachable with no import: the picker allowed it until now, so a
     character built before this can be carrying one. */
  function duplicateTalentSlots(ch) {
    var ups = (ch && ch.universalUpgrades) || {}, seen = Object.create(null), dupes = [];
    Object.keys(ups)
      .sort(function (a, b) { return (Number(a) || 0) - (Number(b) || 0); })
      .forEach(function (lvl) {
        var u = ups[lvl];
        if (!u || u.type !== "talent" || !u.talent) return;
        // Canonicalized through talentRow, the same function activeTalents uses, so the
        // two cannot disagree about what a duplicate is. A record can name a Talent by
        // its KEY or by its display name, so "Street Scrapper" and "street-scrapper" in
        // two slots is one Talent twice and has to read as one.
        // An unresolvable key is skipped: that slot is wasted too, but for a different
        // reason, and this warning would name a Talent nobody can look up.
        var t = talentRow(u.talent);
        if (!t) return;
        if (seen[t.key]) dupes.push({ level: Number(lvl) || 1, talent: t.key, name: t.name, firstAt: seen[t.key] });
        else seen[t.key] = Number(lvl) || 1;
      });
    return dupes;
  }
  /* Talent keys whose Level 6+ Upgrade has been unlocked via a Universal Upgrade slot.

     CANONICALIZED, because every one of the five callers compares these against a key that
     came out of activeTalents (or against a key literal), and a record can name a Talent by
     its display name as readily as by its key: the dupe check two functions up exists for
     exactly that. The builder's picker always writes the key, so an in-app record was never
     affected, but an imported or hand-edited one carrying "Cyber-Reinforced Vitality" here
     lost its Upgrade silently, in all five places at once. Found 2026-09-17 while extending
     the damage-type picks to armor, since resistPickLive is one of the five. An unresolvable
     name is dropped rather than passed through: it can match nothing downstream either way,
     and passing it through is how it stayed invisible. */
  function talentUpgradeKeys(ch) {
    var ups = (ch && ch.universalUpgrades) || {}, out = [], lvl = Number(ch && ch.level) || 1;
    Object.keys(ups).forEach(function (k) {
      var u = ups[k]; if (!u || u.type !== "talentUpgrade" || !u.talent) return;
      var canon = canonTalentKey(u.talent);
      // an Upgrade held below its Level is switched off until the character reaches it (see below)
      if (canon && upgradeSwitchedOff(canon, k, lvl)) return;
      if (canon) out.push(canon);
    });
    return out;
  }
  /* [RULING, 28 October 2026] "You must meet a Talent's Level requirement when you take its
     Upgrade" (Level 6+, or Level 8+ for Hardware Harmonizer and Resonant Recovery). A save that
     already holds an Upgrade taken in a slot below that Level keeps it on the sheet, switched off:
     it applies nothing until the character reaches the Level, the slot and the Talent's feature
     say so, and the builder lets the player change that slot without spending the level's retrain.
     Never deleted. talentUpgradeKeys (and so talentUpgradeHeld and every effect) skips it. */
  function upgradeSwitchedOff(canon, slotLevel, charLevel) {
    var need = talentUpgradeLevel(canon);
    if (!need) return false;
    var sl = Number(slotLevel);
    return !isNaN(sl) && sl < need && (Number(charLevel) || 1) < need;
  }
  // [{level: slot, talent: key, name, needs}] for every Upgrade switched off by its Level
  function switchedOffUpgrades(ch) {
    var ups = (ch && ch.universalUpgrades) || {}, out = [], lvl = Number(ch && ch.level) || 1;
    Object.keys(ups).sort(function (a, b) { return (Number(a) || 0) - (Number(b) || 0); }).forEach(function (k) {
      var u = ups[k]; if (!u || u.type !== "talentUpgrade" || !u.talent) return;
      var canon = canonTalentKey(u.talent);
      if (!canon || !upgradeSwitchedOff(canon, k, lvl)) return;
      var t = talentRow(canon);
      out.push({ level: Number(k), talent: canon, name: t ? t.name : canon, needs: talentUpgradeLevel(canon) });
    });
    return out;
  }
  function upgradeSwitchedOffAt(ch, slotLevel) {
    return switchedOffUpgrades(ch).filter(function (x) { return String(x.level) === String(slotLevel); })[0] || null;
  }
  /* The level a Talent's Upgrade prints: "**Upgrade (Level 8+):**" is 8. Most are Level 6+; the
     Freelancer's Companion gives Hardware Harmonizer and Resonant Recovery Level 8+ Upgrades.
     An `upgradeLevel` field on the Talent wins over the text; no Upgrade at all reads null. */
  function talentUpgradeLevel(t) {
    if (typeof t === "string") { var ck = canonTalentKey(t); t = (EN.talents || []).filter(function (x) { return x.key === ck; })[0] || null; }
    if (!t) return null;
    if (t.upgradeLevel) return Number(t.upgradeLevel);
    var m = String(t.text || "").match(/\*\*Upgrade \(Level (\d+)\+\)/);
    if (m) return Number(m[1]);
    return String(t.text || "").indexOf("**Upgrade") !== -1 ? 6 : null;
  }
  // Split a Talent's text into its base body and its "Upgrade (Level 6+)" rider.
  function splitTalentText(text) {
    var idx = (text || "").indexOf("**Upgrade");
    if (idx === -1) return { base: text || "", upgrade: null };
    return { base: text.slice(0, idx).trim(), upgrade: text.slice(idx).replace(/^\*\*Upgrade[^*]*\*\*\s*/, "").trim() };
  }

  /* THE one resolver for "which Armor Mods are fitted to this piece". ch.armorMods was
     keyed by armor NAME until 2026-08-12, which meant a spare Courier Shell in the stash
     wore whatever its twin wore, while the same suit's DR loss and repair guard were keyed
     on the ENTRY. One object, two identities. Keyed on the entry now, and asked here so the
     four readers (mod DR, the seal questions, Load Distribution, the Block card) cannot
     drift. No key means no piece, which means no mods. */
  function armorModsOn(ch, key) {
    var l = ((ch && ch.armorMods) || {})[key];
    return Array.isArray(l) ? l : [];
  }
  // Flat DR granted by installed Armor Mods. They do not stack with each other:
  // the highest applies (part3.txt:3567). Lapsed armor carries no mods.
  function armorModDR(ch, armor, armorLapsed, key) {
    if (!armor || armorLapsed) return 0;
    var mods = armorModsOn(ch, key);
    var byKey = (EN.armorMods && EN.armorMods.byKey) || {};
    var best = 0;
    mods.forEach(function (k) {
      var m = byKey[k];
      if (m && typeof m.dr === "number" && m.dr > best) best = m.dr;
    });
    return best;
  }
  /* Which installed cyberware is currently sitting in a limb platform's slot.
     Returns a {key: true} map. A piece counts as slotted only when it names a
     host platform, that platform is installed, and the platform's tier has a
     slot left, so removing or downgrading an arm re-charges its mods. */
  function platformSlotted(ch) {
    var out = {};
    var list = (ch && ch.cyberware) || [];
    var defs = (EN.cyberware && EN.cyberware.items) || [];
    function defOf(key) { return defs.filter(function (i) { return i.key === key; })[0]; }
    function slotsOf(cw) {
      var d = defOf(cw.key); if (!d) return 0;
      var t = (d.tiers || []).filter(function (x) { return x.tier === cw.tier; })[0];
      return (t && t.slots) || 0;
    }
    var capacity = {};
    list.forEach(function (cw) {
      if (!cw || typeof cw !== "object") return;
      var d = defOf(cw.key);
      if (d && d.platform) capacity[cw.key] = (capacity[cw.key] || 0) + slotsOf(cw);
    });
    list.forEach(function (cw) {
      if (!cw || typeof cw !== "object" || !cw.slottedIn) return;
      var d = defOf(cw.key);
      if (!d || d.platformHost !== cw.slottedIn) return;      // not a legal host
      if (!(capacity[cw.slottedIn] > 0)) return;              // platform absent or full
      capacity[cw.slottedIn] -= 1;
      out[cw.key] = true;
    });
    return out;
  }
  /* THE tier rule for an Enhancement Bonus. The book (Enhancement Bonuses, and the footnote to the
     Cyberware Quick Reference): the listed +1 applies at Brandware, +2 at Blackware, none at
     Streetware; a one-off Prototype applies as listed. Asked by the attribute fold below, by the
     Chrome and Undercut chips in inventory.js and by the printed sheet, so the three cannot
     drift: the printed sheet used to print the catalog's bare "+1" whatever the tier. */
  function cyberEnhAmount(tier, base) {
    return tier === "Streetware" ? 0 : tier === "Blackware" ? base * 2 : base;
  }
  // The Enhancement a piece grants AT ITS TIER as "+N Attribute" text, or null when it grants none.
  function cyberEnhLabel(cw) {
    if (!cw || !cw.enhancement || cw.enhancement === "None") return null;
    var m = cw.enhancement.match(/\+(\d+)\s+(.+)/);
    if (!m) return cw.enhancement;
    var amt = cyberEnhAmount(cw.tier, parseInt(m[1], 10));
    return amt === 0 ? null : "+" + amt + " " + m[2];
  }
  /* ---- installed cyberware: Enhancement Bonuses (attribute) + flat sheet bonuses ----
     Enhancement scales by tier: Streetware 0, Brandware/Prototype = listed, Blackware ×2.
     'arm only' (Cyberarm) is a focused bonus and does NOT touch the general attribute. */
  function cyberEnhancements(ch) {
    var out = {}, NAME2KEY = {};
    (R.attributes || []).forEach(function (a) { NAME2KEY[a.name] = a.key; });
    ((ch && ch.cyberware) || []).forEach(function (cw) {
      if (!cw || typeof cw !== "object" || !cw.enhancement || cw.enhancement === "None") return;
      if (/\(arm/i.test(cw.enhancement)) return;
      var m = cw.enhancement.match(/\+(\d+)\s+([A-Za-z]+)/);
      if (!m) return;
      var base = parseInt(m[1], 10), key = NAME2KEY[m[2]];
      var amt = cyberEnhAmount(cw.tier, base);
      // Same-attribute Enhancement Bonuses do not stack; the highest one applies.
      if (key && amt) out[key] = Math.max(out[key] || 0, amt);
    });
    return out;
  }
  /* Flat sheet bonuses summed from installed pieces' tier `bonus` data.
     `speed` and `wounds` were the only two fields this ever read, which left most of the
     cyberware catalog as prose: a character wearing Subdermal Armor derived DR 0, and a
     Reflex Booster's "+2 Initiative" reached nothing. `dr` and `init` are the two more it
     reads now, chosen because they are UNCONDITIONAL on the pieces that carry them and
     because they are what the Open Architecture Integration clauses needed underneath them.

     Still prose, deliberately: everything conditional, per-encounter or GM-facing, including
     the Convergence Engine's ATTUNED half. Its UNATTUNED half is derived as of 2026-09-15: it
     needed a fact (`attuned`, hoisted above this function's call site) and a channel (`vit`,
     added below), and now has both. Flat Vitality from a TALENT travels separately, through
     TALENT_VIT_PER_LEVEL near TALENT_RESIST, because a Talent is not installed chrome and this
     function is a lookup over installed pieces only. Those
     want their own channels and their own display surfaces; see DEFERRED-FIXES. */
  /* `attuned` is read only by the conditional branch below. Passing it rather than deriving it
     keeps this function a pure lookup over installed chrome. */
  function cyberFlatBonuses(ch, attuned) {
    var out = { speed: 0, wounds: 0, dr: 0, init: 0, vit: 0 };
    var items = (EN.cyberware && EN.cyberware.items) || [];
    ((ch && ch.cyberware) || []).forEach(function (cw) {
      if (!cw || typeof cw !== "object") return;
      var def = items.find(function (i) { return i.key === cw.key; });
      var tier = def && (def.tiers || []).find(function (t) { return t.tier === cw.tier; });
      var b = tier && tier.bonus;
      if (!b) return;
      if (b.speed) out.speed += b.speed;
      if (b.wounds) out.wounds += b.wounds;
      if (b.dr) out.dr += b.dr;
      if (b.init) out.init += b.init;
      if (b.vit) out.vit += b.vit;
      /* A clause that applies only to the Unattuned. The Convergence Engine is the one piece of
         chrome in the catalog whose printed effect splits on attunement ("Unattuned: +1 Vitality
         max and Resistance to Resonant. Attuned: ..."), and this is the machine-readable half of
         it. Its ATTUNED half stays prose on purpose: using an implant as a Ritual Implement,
         routing Invocations through chrome, and a once-per-Long-Rest Static Threshold bypass are
         capabilities and per-rest resources, not numbers this function can carry. */
      if (!attuned && b.unattuned && b.unattuned.vit) out.vit += b.unattuned.vit;
    });
    return out;
  }

  /* ---- equipped defensive gear: worn armor (DR + flat Block Bonus), a wielded
     shield (Defense bonus + Block die), and an attuned Warding Focus (Ward die).
     A Focus-trait mystech armor can also feed a Ward die. There's no automatic
     damage pipeline on the sheet, so these resolve to displayed derived values;
     conditional bits (lease zero-state, resistance picks, Plated half-DR-on-Block)
     stay as the item's Effect text. */
  function armorItem(name) {
    if (!name) return null;
    var items = (EN.gearCatalog && EN.gearCatalog.armor && EN.gearCatalog.armor.items) || [];
    return items.find(function (i) { return i.name === name; }) || null;
  }
  function hasTrait(item, t) { return !!(item && item.traits && item.traits.indexOf(t) !== -1); }
  // Only consumables, ammo/munitions, and single-use Flow tonics pool into a
  // shared qty stack. Everything else (weapons, armor/shield/focus, kits,
  // devices, rigs, ciphers) is tracked as an individually equippable/carriable
  // instance, each with its own equipment-entry id, so owning two daggers
  // doesn't force them to share one equipped/carried state.
  /* WHAT POOLS INTO A SHARED QTY STACK, AND WHAT GETS ITS OWN TRACKED ROW.
     Brandon's ruling, 2026-08-12: "consumable gear and mods should stack ... those types
     of things are identical and for all intentions immutable. weapons, armor and vehicles
     are not." The rule as implemented is one step more precise than by-category, because
     the thing that actually forbids pooling is not what an item IS, it is whether a COPY
     of it carries state of its own. Two copies that differ in no stored way are one stack.

     Order matters: the disqualifiers run FIRST, so a leasable mod cannot be pooled by the
     mod clause below it. That single carve-out is real and not hypothetical: Sentinel
     Active Defense is an armor Mod with upkeep 90, and the buy path attaches leaseDays /
     leaseDue / leaseOwned to the ROW. Its own comment already knew: "leased gear is never
     pooled, so each contract is its own instance and re-leasing an item already in arrears
     never clears another one's debt." Pool it and two contracts share one clock. */
  function isStackableItem(it) {
    if (!it) return true;                                  // unknown/custom items: legacy pooled behavior

    /* --- carries per-copy state, therefore never pools --- */
    if (it.upkeep) return false;                            // leasable: each contract is its own row
    if (it.kind === "armor" || it.kind === "shield") return false;  // armorWear / shieldWear / armorGuard, per piece
    if (it.rigTier) return false;                           // Trauma Rigs: ch.rig.key and ch.rig.hp, per piece
    if (it.bucket === "rigs" && it.group !== "Hardware Mods") return false;  // decks and Buddies are tracked units

    /* --- fungible, immutable, identity-free, therefore pools --- */
    if (it.legality === "As weapon") return true;           // ammo & munitions, fungible by the box
    if (it.bucket === "consumables") return true;
    // the #PRINT and the Fake License Portfolio left Consumables (A4, 28 Oct 2026) and pool as before
    if (it.bucket === "identity") return true;
    if (it.group === "Resonance Tonics") return true;       // bucket "flow", but drunk once and gone
    if (it.bucket === "ciphers") return true;               // software; ch.grid holds cipher KEYS, not rows
    if (it.group === "Hardware Mods") return true;          // deck chips, the #GRID equivalent of a Part
    // Installable components. An install never references a ROW: ch.weaponParts stores the
    // part's KEY, ch.armorMods and the garage the mod's key, and ownership is counted
    // separately. The app has always treated these as fungible; it just stored them one
    // row each, which is what stranded the second copy you bought.
    if (it.benchPart || it.armorMod || it.vehicleMod) return true;

    return false;                                           // weapons, vehicles, tools, kits, devices
  }
  function isStackableName(name) { return isStackableItem(loadCatalogItem(name)); }
  // Stable identity for equip/carry state: the entry's id if it has one
  // (a tracked individual instance), else its catalog name (a pooled stack).
  function entryKey(e) { return (e && (e.id || e.name)) || null; }
  function findEntry(ch, key) { return ((ch && ch.equipment) || []).find(function (x) { return (x.id || x.name) === key; }); }
  function keyToName(ch, key) { var e = findEntry(ch, key); return e ? e.name : key; }
  // A leased item whose installment is due grants NOTHING until it is paid.
  // Lease state lives on the equipment entry (leaseDue / leaseOwned), maintained
  // by the Inventory ledger and ticked one day per Long Rest. `key` is the
  // specific equipped entry's id (or a bare name for pooled/legacy entries),
  // so two identical leased items each keep their own contract.
  function leaseLapsed(ch, key) {
    if (!key) return false;
    var e = findEntry(ch, key);
    return !!(e && e.leaseDue && !e.leaseOwned);
  }
  /* Is this copy on its catalog item's Premium plan? A plan is a SERVICE on a live lease, so
     it rides the entry the way leaseDays and leaseDue do (two of the same suit can be on
     different plans), and a bought-out contract has no plan left to be on: there is no upkeep
     to double. Lapsing is separate and handled where DR is read; an unpaid premium contract
     grants what any unpaid contract grants. The ONE reader, so the ledger's price and the
     sheet's DR cannot disagree about whether the plan is live. */
  function premiumOn(ch, key, it) {
    if (!it || !it.premium) return false;
    var e = key ? findEntry(ch, key) : null;
    return !!(e && e.premium && !e.leaseOwned);
  }
  /* ---- Armor Integrity: the ONE resolver for a piece's current DR ----------
     A suit's DR is MUTABLE. The catalog's `dr` is the BASE, which is both where a
     fresh piece starts and the ceiling repair can ever restore it to; ch.armorWear
     records how many of those points are currently gone. It is keyed on the
     equipment ENTRY (entryKey), never on the item name, so two Kevlar Weaves hold
     their damage independently and a re-bought piece, being a new entry with no
     row in the map, arrives at full DR with no heuristic anywhere. Current DR is
     base minus wear, floored at 0 per piece and never raised past base.

     ch.armorGuard is the crafting quality edge a clean repair earns: one point of
     DR the suit would lose is absorbed instead, keyed the same way and spent by
     whatever marks the damage.

     Every surface reads THIS, or the d.armorDR / d.totalDR it feeds. Nothing
     re-derives a current DR out of ch.armorWear on its own. */
  // `kind === "armor"` rather than just "has a dr number", because armor MODS carry a `dr`
  // of their own (Trauma Plates is dr 1) and they resolve through loadCatalogItem now that
  // the catalog is unified. Measured: armorModAsItem does NOT copy `dr` onto the normalized
  // object, so this is not closing a live hole, it is refusing to depend on that omission.
  // Same shape as shieldBoxesMaxOf requiring kind "shield", for the same reason.
  function armorBaseDR(it) {
    if (!it || it.kind !== "armor") return 0;
    return (typeof it.dr === "number" && it.dr > 0) ? Math.floor(it.dr) : 0;
  }
  /* Every per-entry map in this app is keyed on a string out of a save file, and the
     maps are built null-prototype for that reason. This asks the question the OTHER
     way round, so a map that is somehow plain (a record mid-flight, a caller handing
     in a literal) still cannot answer for a key it does not hold: an entry whose id
     is "toString" or "constructor" used to read as already guarded and then absorb
     every point of DR forever, because spending the guard is a delete on a property
     that was never there. Null-prototype at the creation sites stops the map being
     wrong; this stops the READ being wrong whatever the map is. */
  function ownVal(map, key) { return (map && key != null && Object.prototype.hasOwnProperty.call(map, key)) ? map[key] : undefined; }
  /* What a live Premium plan adds, in points of DR. It is a SEPARATE LAYER over the piece,
     never a bigger piece: it does not move base, lost, damaged or breached, because those four
     describe the physical suit and every repair rule keys off them. The first cut of this raised
     `base` instead, and that let a subscription un-breach a wrecked suit, reopen the cheap repair
     lanes a breach is supposed to close, and let a cancellation silently brick a suit that had
     merely been dented. A layer cannot do any of that: the suit's own integrity is untouched,
     the plan simply stops adding when it stops being paid for. */
  function premiumBonus(ch, key, it) {
    if (!premiumOn(ch, key, it) || typeof it.premium.dr !== "number") return 0;
    return Math.max(0, Math.floor(it.premium.dr) - armorBaseDR(it));
  }
  function armorState(ch, key) {
    var name = key ? keyToName(ch, key) : null;
    var it = name ? loadCatalogItem(name) : null;
    var base = armorBaseDR(it);
    var wearMap = (ch && ch.armorWear && typeof ch.armorWear === "object") ? ch.armorWear : {};
    var lost = key ? clamp(ownVal(wearMap, key) | 0, 0, base) : 0;
    var guardMap = (ch && ch.armorGuard && typeof ch.armorGuard === "object") ? ch.armorGuard : {};
    return {
      key: key || null, name: name || null, item: it || null,
      base: base,
      lost: lost,
      current: Math.max(0, base - lost),
      premiumDR: premiumBonus(ch, key, it),   // the plan's layer, on top of current; see premiumBonus
      damaged: lost > 0,
      breached: base > 0 && lost >= base,          // 0 DR: past repair, a rebuild Project
      guard: !!(key && ownVal(guardMap, key))
    };
  }
  /* The ONE writer, the other half of the one-resolver rule. Every surface that
     moves a piece's DR calls this inside a store.update rather than reaching into
     ch.armorWear itself, so the clamps and the quality edge cannot differ between
     the Defenses row and the Impact Table (they did, once, and the bench lane's
     button quietly burned a point the guard should have absorbed).
       delta > 0  lose DR. A pending armorGuard absorbs the first point instead,
                  and is spent doing it. Never past 0 DR.
       delta < 0  restore DR. Never past the base, which is why repair cannot
                  inflate a suit above its printed value however it is driven.
     `c` is the mutable character inside store.update. Returns what happened.

     THE DELTA IS APPLIED TO THE RESOLVER'S ANSWER, not to the raw stored number,
     and that is the whole reason there is a resolver. armorState() clamps a stored
     value into [0, base]; this used to read ch.armorWear[key] straight and add to
     that instead, so an out-of-range stored value survived every repair. An imported
     armorWear of 999 on a base-5 suit displayed correctly as 0/5 breached, and then a
     full rebuild Project paid 𝒢460, ran three Flawless intervals, and computed
     clamp(999 - 5, 0, 5) = 5: still 0/5, still breached, with the toast announcing
     "back to 5 of 5 DR". Reading the resolver makes the first write self-healing. */
  function applyArmorDamage(c, key, delta) {
    var st = armorState(c, key);
    if (!key || !st.base || !delta) return { absorbed: false, lost: st.lost, current: st.current, breached: st.breached, base: st.base, name: st.name };
    c.armorWear = c.armorWear || Object.create(null);
    c.armorGuard = c.armorGuard || Object.create(null);
    if (delta > 0 && ownVal(c.armorGuard, key)) {
      delete c.armorGuard[key];
      return { absorbed: true, lost: st.lost, current: st.current, breached: st.breached, base: st.base, name: st.name };
    }
    var n = clamp(st.lost + delta, 0, st.base);
    if (n > 0) c.armorWear[key] = n; else delete c.armorWear[key];
    return { absorbed: false, lost: n, current: st.base - n, breached: n >= st.base, base: st.base, name: st.name };
  }
  // The one writer for the quality edge, so the map is created in exactly one place
  // and cannot be born on Object.prototype at a second site. A plain literal there
  // reads an entry whose id is "toString" or "constructor" as already guarded, and a
  // suit keyed that way absorbs every point of DR forever.
  function grantArmorGuard(c, key) {
    if (!c || !key) return false;
    c.armorGuard = c.armorGuard || Object.create(null);
    c.armorGuard[key] = true;
    return true;
  }
  // Every suit of armor the character owns, as armorState records, in equipment
  // order. Two pieces of the same type are two records, each with its own track.
  function ownedArmorPieces(ch) {
    var out = [];
    // Array.isArray, not `|| []`: a hand-edited record whose `equipment` is a plain
    // object throws on .forEach, and load() answers a throw by discarding the whole
    // roster (DEFERRED-FIXES L10). That class is pre-existing; this does not join it.
    (Array.isArray(ch && ch.equipment) ? ch.equipment : []).forEach(function (e) {
      if (!e || (e.qty != null && e.qty <= 0)) return;
      var it = loadCatalogItem(e.name);
      if (!it || it.kind !== "armor") return;
      out.push(armorState(ch, entryKey(e)));
    });
    return out;
  }
  /* ---- Shield Durability: the ONE resolver for a shield's remaining boxes ------
     Armor got a resolver and a writer; shields got a key and neither, and the two
     are the same mechanic (a defensive piece that degrades and is repaired back
     toward its printed value). The cost of that asymmetry was measured: the Block
     row derived "boxes left" a SECOND time, off ch.shieldWear read after the update
     that had just mutated the same object, so it counted the click twice and a
     3-box Riot Shield announced its own destruction with a box still to spend.
     A 2-box Scrap Shield announced it on the FIRST click.

     Same contract as armorState: the catalog `boxes` is the ceiling, the stored
     number is boxes MARKED, absent means untouched, and a stored value out of range
     is clamped here rather than trusted anywhere downstream. */
  // Only a `kind: "shield"` row has Durability boxes. Every shield in the catalog
  // carries its own `boxes`; the 3 is the fallback for one that does not. Asking
  // `kind` rather than just "is this in the armor catalog" is what lets the
  // migration use this as a capacity cap: a suit of armor sitting in a shieldWear
  // key answers 0 boxes and its value is dropped instead of capped at a made-up 3.
  function shieldBoxesMaxOf(it) {
    if (!it || it.kind !== "shield") return 0;
    return typeof it.boxes === "number" && it.boxes > 0 ? Math.floor(it.boxes) : 3;
  }
  function shieldState(ch, key) {
    var name = key ? keyToName(ch, key) : null;
    var found = name ? armorItem(name) : null;
    var it = (found && found.kind === "shield") ? found : null;
    var max = shieldBoxesMaxOf(it);
    var wearMap = (ch && ch.shieldWear && typeof ch.shieldWear === "object") ? ch.shieldWear : {};
    var spent = key ? clamp(ownVal(wearMap, key) | 0, 0, max) : 0;
    var left = Math.max(0, max - spent);
    return {
      key: key || null, name: name || null, item: it || null,
      boxesMax: max, spent: spent, left: left,
      worn: spent > 0,
      // "no shield" is alive the way "no armor" has no DR: the absence is not a wreck
      alive: !it || left > 0,
      destroyed: !!it && left <= 0,
      emitter: !!(it && it.emitter)
    };
  }
  /* The ONE writer, and the reason the toast can be trusted: it returns what it
     actually did, so nothing has to re-derive the result from state it just changed.
     Like applyArmorDamage it applies the delta to the RESOLVER's clamped value, so a
     stored number out of range is healed by the first write rather than surviving it. */
  function applyShieldWear(c, key, delta) {
    var st = shieldState(c, key);
    if (!key || !st.item || !delta) return { changed: false, spent: st.spent, left: st.left, boxesMax: st.boxesMax, destroyed: st.destroyed, name: st.name, emitter: st.emitter };
    c.shieldWear = c.shieldWear || Object.create(null);
    var n = clamp(st.spent + delta, 0, st.boxesMax);
    if (n > 0) c.shieldWear[key] = n; else delete c.shieldWear[key];
    var left = Math.max(0, st.boxesMax - n);
    return { changed: n !== st.spent, spent: n, left: left, boxesMax: st.boxesMax,
             destroyed: left <= 0, name: st.name, emitter: st.emitter };
  }
  function defensiveLoadout(ch) {
    var armorKey = ch && ch.equippedArmor, shieldKey = ch && ch.equippedShield, focusKey = ch && ch.equippedFocus;
    var armor = armorItem(keyToName(ch, armorKey));
    var shield = armorItem(keyToName(ch, shieldKey));
    var focus = armorItem(keyToName(ch, focusKey));
    // lapsed leases keep their drawbacks (weight is weight) but grant no benefits
    var armorLapsed = !!armor && leaseLapsed(ch, armorKey);
    var shieldLapsed = !!shield && leaseLapsed(ch, shieldKey);
    var focusLapsed = !!focus && leaseLapsed(ch, focusKey);
    var wardDie = (focus && !focusLapsed && focus.wardDie) || (armor && !armorLapsed && armor.wardDie) || null;
    // Bulky armor slows you by 1. Powered frames are the exception (trained + powered
    // ignores it). The training is now the Powered Frames armor proficiency (rules.js,
    // 2026-09-28), but nothing here reads it, so we leave Powered Speed to the player.
    // A lapsed Powered frame seizes, so Bulky bites it too.
    var speedPenalty = (hasTrait(armor, "Bulky") && (!hasTrait(armor, "Powered") || armorLapsed)) ? -1 : 0;
    // Shield Durability boxes, tracked per shield ENTRY on the record. Keyed the
    // same way armor wear is, and for the same reason: two Scrap Shields are two
    // objects, and a re-bought shield arrives unworn because it is a new entry.
    // Read from the one resolver, exactly as the armor line below is: this used to
    // be derived here AND again in the Block row's wear button, and the second copy
    // was wrong.
    var shieldSt = shieldState(ch, shieldKey);
    var shieldBoxesMax = shield ? shieldSt.boxesMax : 0;
    var shieldSpent = shield ? shieldSt.spent : 0;
    // Current DR of the worn suit, from the one resolver.
    var armorSt = armorState(ch, armorKey);
    var shieldBoxesLeft = Math.max(0, shieldBoxesMax - shieldSpent);
    var shieldAlive = !shield || shieldBoxesLeft > 0;
    return {
      armor: armor, focus: focus,
      armorLapsed: armorLapsed, shieldLapsed: shieldLapsed, focusLapsed: focusLapsed,
      // part3.txt:4325 - DR 0 is only the DEFAULT zero state; an item whose own
      // Lapsed or Locked line names a different value uses that value instead.
      // Either way the number is capped by the suit's CURRENT DR: a lapsed lease
      // does not un-punch a hole in the plating, so a Sentinel Issue that has lost
      // its way to 0 grants 0 rather than falling back up to its lapsedDR of 1.
      // the plan's layer rides on top of what the suit is currently worth, and a lapsed lease
      // grants neither: an unpaid contract is unpaid whichever tier it was on
      armorDR: armor ? (armorLapsed ? Math.min(armor.lapsedDR || 0, armorSt.current) : armorSt.current + armorSt.premiumDR) : 0,
      // the whole armor-integrity record for the worn suit, so no surface has to
      // reach into ch.armorWear to find out what a piece is missing
      armorBaseDR: armorSt.base,
      armorDRLost: armorSt.lost,
      armorBreached: armorSt.breached,
      armorGuard: armorSt.guard,
      armorState: armorSt,
      armorKey: armorKey || null,
      shieldKey: shieldKey || null,
      armorModDR: armorModDR(ch, armor, armorLapsed, armorKey),
      blockBonus: (armor && !armorLapsed && armor.blockBonus) || 0,   // flat Block Bonus from medium/heavy plate
      shieldDef: (shield && !shieldLapsed && shieldAlive && typeof shield.defense === "number") ? shield.defense : 0,
      shieldBlockDie: (shield && !shieldLapsed && shieldAlive && shield.blockDie) || null,
      // Shield Durability: boxes are marked when a Blocked hit's RAW damage meets the
      // Wear Threshold (twice the Block die's maximum), or on any Blocked critical.
      // At 0 boxes a physical shield is destroyed; an emitter shield goes dark.
      shield: shield || null,
      shieldWearThreshold: shield ? (shield.wear || 0) : 0,
      shieldBoxesMax: shieldBoxesMax,
      shieldBoxesLeft: shieldBoxesLeft,
      shieldSpent: shieldSpent,
      shieldAlive: shieldAlive,
      shieldState: shieldSt,                          // the whole record, the way armorState is carried

      shieldEmitter: !!(shield && shield.emitter),
      wardDie: wardDie,                               // from the Focus item, or a Focus-trait armor
      speedPenalty: speedPenalty
    };
  }

  /* ---- Encumbrance and Load ----------------------------------------------
     Load is abstract weight/bulk. Threshold = 6 + Body Modifier, adjusted by
     Size, minimum 3, plus +2 per "step" from gear (Load-Bearing OR Load
     Distributor, non-stacking; Powered frames two steps) and Size-larger
     effects. The Loadout tier is DECLARED (ch.loadout) and picks the Load
     Budget from the threshold bands; it is not derived from carried Load.
     Hauls (ch.haul) bypass the budget and set the state directly. */
  /* ---- the catalog, and the four pools it used to be blind to ---------------
     loadCatalogItem searched seven pools while inventory.js's own catalog() searched
     those seven PLUS weapon Parts, armor Mods, vehicles and vehicle Mods. Measured in
     the live app: 327 of 327 resolved in the seven, and 0 of 105 in the other four.

     That is not a cosmetic gap. isStackableItem(null) answers TRUE on its
     "unknown/custom items" line, so every one of those 105 read as POOLED to anything
     asking the engine, while inventory.js resolved the same name to a real object and
     read it as per-instance. One question, two doors, opposite answers, which is the
     invariant this codebase exists to keep.

     Registered rather than hardcoded, and the registered source hands over the SAME
     normalized objects inventory builds for its own market cards. That matters: the raw
     data carries field names that mean something else here. A raw weapon Part has
     `slot: "handling"`, and itemSlots() reads `.slot` as a BODY slot; partAsItem()
     already renames it to partSlot for exactly that reason. Feeding raw objects in would
     have imported every one of those collisions. (Body slots are capitalized and part
     slots are not, so this particular one would have been survivable, but the next one
     might not be, and the normalized objects are already correct.)

     Lazy and cached: engine.js loads before inventory.js, so the source cannot be read
     at load time, and loadCatalogItem is called once per equipment row in several loops,
     so rebuilding 105 objects per call would be quadratic. */
  var _extraSources = [], _extraCache = null;
  function registerCatalogSource(fn) { _extraSources.push(fn); _extraCache = null; }
  function extraCatalogItems() {
    if (!_extraCache) {
      _extraCache = [];
      _extraSources.forEach(function (fn) {
        var list;
        try { list = fn() || []; } catch (e) { list = []; }
        _extraCache = _extraCache.concat(list);
      });
    }
    return _extraCache;
  }
  function loadCatalogItem(name) {
    var g = EN.gearCatalog || {};
    var pools = [g.melee && g.melee.items, g.ranged && g.ranged.items,
                 g.signature && g.signature.items, g.signature && g.signature.munitions,
                 g.ammo && g.ammo.items, g.armor && g.armor.items, g.tools && g.tools.items];
    for (var i = 0; i < pools.length; i++) {
      var p = pools[i]; if (!p) continue;
      var f = p.find(function (x) { return x.name === name; });
      if (f) return f;
    }
    // the registered pools last, so a name collision resolves to the gear catalog and
    // the seven pools keep behaving exactly as they did
    var extra = extraCatalogItems();
    for (var j = 0; j < extra.length; j++) if (extra[j] && extra[j].name === name) return extra[j];
    return null;
  }
  /* WORN IS A TRAIT RULE, NOT A RIG RULE. The Worn Gear Trait ends "While actually worn rather
     than packed or carried, its Load is reduced by 1, to a minimum of 0", so the reduction
     belongs to every item carrying the trait rather than to the one bucket that used to
     hard-code it. Seven Part 3 items carry Worn: Claws, the five Warding Foci, and the Trauma
     Rig. Claws reaching Load 0 worn is intended.

     Armor is deliberately NOT among them. It carries no Worn trait and states its own rule
     instead: "Armor counts whether worn or packed." Nine further items are labelled Type: Worn
     Gear (the Rebreather, Backpack, Sheath and so on) with no Traits line at all; those are a
     category label, not the trait, and get nothing. The Rebreather sits in both lists in a
     reader's mind and in neither in the data.

     Split in two so the reduction applies once, at the end, however the base was reached. The
     base function has a dozen early returns and bolting a check onto each is how one gets
     missed. */
  function baseItemLoad(name, opts) {
    // installable components weigh nothing on the budget
    if (EN.weaponParts && (EN.weaponParts.parts || []).some(function (p) { return p.name === name; })) return 0;
    if (EN.armorMods && (EN.armorMods.mods || []).some(function (m) { return m.name === name; })) return 0;
    var G = EN.grid || {};
    if ((G.mods || []).some(function (m) { return m.name === name; })) return 0;      // deck chips
    if ((G.ciphers || []).some(function (c) { return c.name === name; })) return 0;   // software
    if ((G.smartdecks || []).some(function (s) { return s.tier + " Smartdeck" === name; })) return 1;
    if ((G.buddies || []).some(function (b) { return b.tier + " B&E Buddy" === name; })) return 1;
    if ((G.relays || []).some(function (r) { return (r.name || (r.tier + " Burner Relay")) === name; })) return 1;
    var it = loadCatalogItem(name);
    if (!it) return 1;                                        // unknown custom item: hand-sized
    if (typeof it.load === "number") return it.load;          // explicit data override
    // a vehicle is parked, not carried, and a vehicle mod goes in the garage (the author, 31 Oct 2026)
    if (it.vehicle || it.vehicleMod) return 0;
    if (it.legality === "As weapon") return 0;                // loose ammo and munitions
    var traits = it.traits || [];
    function has(t) { return traits.indexOf(t) !== -1; }
    if (it.kind === "armor") {
      // "Armor counts whether worn or packed: 1 for Light, 2 for Medium, 3 for
      // Heavy." No discount for wearing it. Read the weight class from `type`,
      // which states it even for Mystech ("Heavy Mystech Armor"); `group` alone
      // says only "Mystech Armor" and would silently score every one of them 2.
      var ag = (it.type || "") + " " + (it.group || "");
      return /Light/i.test(ag) ? 1 : /Heavy|Exoframe/i.test(ag) ? 3 : 2;
    }
    if (it.kind === "shield") return has("Heavy") ? 3 : 2;
    if (it.kind === "focus") return 1;
    switch (it.group) {
      case "Sidearm": return 1;
      case "Longarm": return 2;
      case "Heavy": case "Launcher": return 3;
      case "Thrown": return 1;
      case "Bowfire": return /hand crossbow/i.test(it.name) ? 1 : 2;
      case "Simple": case "Martial": return (has("Heavy") || has("Two-Handed")) ? 3 : (has("Light") ? 1 : 2);
    }
    if (it.signature || /Signature/i.test(it.group || "")) return (has("Heavy") || has("Two-Handed")) ? 3 : (has("Light") ? 1 : 2);
    switch (it.bucket) {
      case "kits": return 2;
      case "consumables": return 0;
      case "identity": return 0;   // papers and tags, Load 0 as they were under Consumables
      case "carry": return 0;  // Carry Gear never counts against your own Load Budget
      case "flow": return /tonic|draught|philter|salve|vial|dose/i.test(it.name) ? 0 : 1;
      /* Trauma Rigs are the only thing left in this bucket: Smartdecks, Buddies and Relays all
         return 1 further up, before this switch is reachable. The book never prints a Load on
         the Rig; it is derived, from the Assigning Load table putting "trauma rig" in the Load 2
         row. Worn takes it to 1 through the trait rule in itemLoad, not through a branch here. */
      case "rigs": return 2;
      case "devices": return /drone|mule|case|rack/i.test(it.name) ? 2 : 1;
    }
    return 1;
  }
  function itemLoad(name, opts) {
    var load = baseItemLoad(name, opts);
    if (!(opts && opts.worn)) return load;
    var it = loadCatalogItem(name);
    var tr = (it && it.traits) || [];
    if (tr.indexOf("Worn") === -1) return load;
    return Math.max(0, load - 1);
  }
  /* ONE UNIT OF ONE ENTRY'S LOAD, with the GM's adjustment (29 Oct 2026 handoff, C1). The Assigning
     Load table is a default: the GM "may lower an item's Load by 1 if it is tiny, collapsible, worn
     cleanly, or designed to distribute its weight." That call is made per item at the table, so it is
     a flag on the equipment entry (e.loadLowered), set from the Stash card, and it takes 1 off each
     unit after the Worn Trait's own break, never below 0. Every count of an entry's Load reads this. */
  function entryUnitLoad(ch, e, opts) {
    if (!e) return 0;
    var worn = opts && opts.worn != null ? !!opts.worn : (ch ? isWornEntry(ch, e) : false);
    var l = itemLoad(e.name, { worn: worn });
    // the two don't stack (ruled 29 Oct 2026): while a Worn item is worn only the trait's -1 applies;
    // the GM's flag stays on the entry and counts again once it is packed or carried
    if (e.loadLowered && wornTraitWorn(e, worn)) return l;
    return e.loadLowered ? Math.max(0, l - 1) : l;
  }
  // a Worn-trait item that is being worn: the GM's -1 is set aside while this holds
  function wornTraitWorn(e, worn) {
    if (!e || !worn) return false;
    var it = loadCatalogItem(e.name);
    return ((it && it.traits) || []).indexOf("Worn") !== -1;
  }
  // on-person = equipped, or carry status "carried" / "worn" / "racked"
  // (Racked = stowed in a worn piece of Carry Gear, still on your person).
  // Takes the actual equipment entry (not just its name) since carry/equip state
  // is keyed by entryKey (an id for individually-tracked gear, else the name).
  function onPerson(ch, e) {
    var key = entryKey(e);
    if (!key) return false;
    if ((ch.equippedWeapons || []).indexOf(key) !== -1) return true;
    if (isSlotEquipped(ch, key)) return true;
    var cs = ch.carry && ch.carry[key];
    return cs === "carried" || cs === "worn" || cs === "racked";
  }

  /* ---- Carry Gear & Racking -----------------------------------------------
     Carry Gear (bucket "carry") is Load 0 and holds up to `rack` items; each
     validly Racked item's Load drops by 1 (minimum 0). An item Racks in one
     piece of Carry Gear at a time (ch.racked = {itemKey: gearKey}), the gear
     itself must be on-person, the item must fit (rackFits "melee"/"sidearm",
     or anything that isn't Carry Gear), and capacity is enforced in equipment
     order, so an over-stuffed bag quietly stops giving the break. */
  function isCarryGear(it) { return !!(it && it.bucket === "carry"); }
  function rackLimit(it) { return (it && it.rack) || 0; }
  function rackFits(gearIt, it) {
    if (!gearIt || !it || isCarryGear(it)) return false;      // no bags inside bags
    var melee = it.group === "Simple" || it.group === "Martial";
    var twoish = (it.traits || []).indexOf("Two-Handed") !== -1 || isLongShafted(it);
    if (gearIt.rackFits === "melee") return melee;
    if (gearIt.rackFits === "onehand") return melee && !twoish;                 // Scabbard
    if (gearIt.rackFits === "twohand") return melee && twoish;                  // Back Scabbard
    if (gearIt.rackFits === "longarm") return it.group === "Longarm";           // Weapon Sling
    if (gearIt.rackFits === "sidearm") return it.group === "Sidearm";
    return true;                                              // plausibility is the GM's call
  }
  // the character's actually-WORN Carry Gear entries, with their catalog items.
  // A bag merely Carried (in your hands, not strapped on) racks nothing; only
  // a Worn piece of Carry Gear functions, per its own Body Slot.
  function carryGearWorn(ch) {
    var carry = (ch && ch.carry) || {};
    return ((ch && ch.equipment) || []).filter(function (e) {
      return e.qty > 0 && isCarryGear(loadCatalogItem(e.name)) && carry[entryKey(e)] === "worn";
    });
  }
  // validated rack assignments: byItem {itemKey: gearEntry}, byGear {gearKey: [entries]}.
  // An item is Racked only while BOTH halves agree: carry status "racked" AND
  // a racked[key] target (equipped or not); a leftover mapping without the
  // status is inert, so an unracked-then-recarried item never silently
  // re-racks itself off stale state.
  function rackState(ch) {
    var byItem = {}, byGear = {}, counts = {};
    var racked = (ch && ch.racked) || {};
    var carry = (ch && ch.carry) || {};
    var gearByKey = {};
    carryGearWorn(ch).forEach(function (g) { gearByKey[entryKey(g)] = g; });
    ((ch && ch.equipment) || []).forEach(function (e) {
      var key = entryKey(e);
      var gk = racked[key];
      if (!gk || carry[key] !== "racked" || !(e.qty > 0) || !onPerson(ch, e)) return;
      var gear = gearByKey[gk];
      if (!gear) return;                                       // rack target not worn: no break
      var gearIt = loadCatalogItem(gear.name);
      if (!rackFits(gearIt, loadCatalogItem(e.name))) return;
      counts[gk] = counts[gk] || 0;
      if (counts[gk] >= rackLimit(gearIt)) return;             // over capacity: first come, first racked
      counts[gk]++;
      byItem[key] = gear;
      (byGear[gk] = byGear[gk] || []).push(e);
    });
    return { byItem: byItem, byGear: byGear };
  }
  // on-person Carry Gear that COULD take this entry right now (fits + free slot)
  function rackTargets(ch, entry) {
    var it = loadCatalogItem(entry.name);
    var rs = rackState(ch);
    var myKey = entryKey(entry);
    return carryGearWorn(ch).filter(function (g) {
      var gk = entryKey(g);
      if (gk === myKey) return false;
      var gearIt = loadCatalogItem(g.name);
      if (!rackFits(gearIt, it)) return false;
      var used = (rs.byGear[gk] || []).filter(function (e) { return entryKey(e) !== myKey; }).length;
      return used < rackLimit(gearIt);
    });
  }
  /* STOWED (30 Oct 2026 handoff, Carry Gear: "A Racked item is stowed, not in hand. Take it out
     before you use it: a light weapon or small item comes out as a Free Action, anything bulkier as
     a Swift Action. ... Taking an item out or putting it back doesn't change your Load.")
     A validly Racked item is stowed unless it has been taken out: ch.inHand[key] holds the key of
     the Carry Gear it came out of, and counts only while the item is still Racked in that same
     gear, so a re-rack anywhere puts it back. It stays Racked either way, so its Load and its -1
     never move; only this flag flips. Returns null when the item is in use (not Racked, or out),
     else { gear, gearName, freeDraw, action }. freeDraw: a Holster, Scabbard, Back Scabbard or
     Weapon Sling, whose weapon draws as part of the first attack each encounter (no take-out). */
  function stowedInfo(ch, e) {
    if (!ch || !e) return null;
    var key = entryKey(e), gear = rackState(ch).byItem[key];
    if (!gear) return null;
    var gk = entryKey(gear);
    if (ch.inHand && ch.inHand[key] === gk) return null;
    var gearIt = loadCatalogItem(gear.name), it = loadCatalogItem(e.name);
    // "a light weapon or small item comes out as a Free Action": the Light trait, or Load 1 or less
    var light = ((it && it.traits) || []).indexOf("Light") !== -1 || itemLoad(e.name, { worn: false }) <= 1;
    return { key: key, gear: gear, gearKey: gk, gearName: gear.name, freeDraw: !!(gearIt && gearIt.freeDraw), action: light ? "Free Action" : "Swift Action" };
  }
  // the write behind TAKE OUT / PUT BACK: in hand records the gear it came out of
  function setInHand(c, key, on) {
    c.inHand = c.inHand || {};
    if (on) { var g = rackState(c).byItem[key]; if (g) c.inHand[key] = entryKey(g); }
    else delete c.inHand[key];
  }
  // "actually worn" for the Worn Gear Trait's Load break: carry status worn, or equipped armor / slot gear / Rig
  function isWornEntry(ch, e) {
    var ek = entryKey(e);
    if ((ch.carry && ch.carry[ek] === "worn") || ch.equippedArmor === ek || isSlotEquipped(ch, ek) || (ch.rig && ch.rig.key === ek)) return true;
    /* A Worn weapon you have equipped is on you, not packed (29 Oct 2026: Shock Gloves, Knuckles,
       Snap-Blades gained Worn): its Load break applies, unless it is Racked, which is packing it. */
    if ((ch.equippedWeapons || []).indexOf(ek) !== -1 && !(ch.carry && ch.carry[ek] === "racked")) {
      var it = loadCatalogItem(e.name);
      return ((it && it.traits) || []).indexOf("Worn") !== -1;
    }
    return false;
  }
  /* The Load one equipment entry costs right now, exactly as encumbranceInfo counts it: its Load times
     its quantity, less 1 once while validly Racked (min 0). `units` limits the count to that many
     units of a stack (the rack break then applies only when the whole row is meant). Zero when the
     entry is not on your person. `racks` may be passed to save a second rackState. */
  function entryLoadNow(ch, e, units, racks) {
    if (!e || !(e.qty > 0) || !onPerson(ch, e)) return 0;
    var l = entryUnitLoad(ch, e);
    var whole = units == null || units >= e.qty;
    var total = l * (whole ? e.qty : Math.max(0, units));
    var rackedGear = (racks || rackState(ch)).byItem[entryKey(e)] || null;
    if (rackedGear && whole) total = Math.max(0, total - 1);
    return total;
  }
  /* PACKED IT LOG. When an on-person entry leaves your person for good (a drop, a drop from the
     stash, a donation), Packed It still counts its Load, so the sheet notes it beside the Load you
     carry now: ch.loadDropped = [{ name, load, key?, unit? }] (drop() rows also carry `unit`, a copy
     of the dropped unit, so PICK UP can put it back). The Dropped carry choice is retired (2026-10-24
     rulings, section 9 item 10); old saves' Dropped items are migrated into this log. Call it on the draft `c` inside
     store.update BEFORE the entry's carry or quantity changes. A Load 0 entry changes nothing and is
     not logged. Returns the Load logged (0 when nothing was).
     A call with no `units` leaves the entry in your gear, Stashed, so it can be picked back up;
     its row also carries the entry's key ({ name, load, key }). A revealed item
     counts against the budget once ("for the rest of the run"), so one entry keeps one row: a stale
     row for the same key is replaced, not doubled. Units that drop() takes out of your gear are gone
     for good and their rows carry no key. */
  function logDropped(c, e, units) {
    var load = entryLoadNow(c, e, units);
    if (!(load > 0)) return 0;
    if (!Array.isArray(c.loadDropped)) c.loadDropped = [];
    if (units == null) {
      var k = entryKey(e);
      unlogDropped(c, k);
      c.loadDropped.push({ name: e.name, load: load, key: k });
    } else c.loadDropped.push({ name: e.name, load: load });
    return load;
  }
  /* Picking a dropped item back up. "The first number is the Load you're carrying now: everything
     revealed or picked up, minus what you've dropped." An entry that goes back on your person is
     counted in that first number again, so it is no longer a dropped item: its row comes off the
     log, or Packed It would count it twice (once carried, once dropped). Call it on the draft `c`
     whenever an entry goes on-person (carried, worn, racked or equipped). Returns rows removed. */
  function unlogDropped(c, key) {
    if (!key || !c || !Array.isArray(c.loadDropped)) return 0;
    var before = c.loadDropped.length;
    c.loadDropped = c.loadDropped.filter(function (x) { return !(x && x.key === key); });
    return before - c.loadDropped.length;
  }
  // Encumbrance Threshold = 6 + Body Modifier +/- 1 for Size, minimum 3, and
  // the minimum applies AFTER the Size adjustment: a Small character on Body -3
  // lands at 3, not 2. Gear, mods, frames, cyberware and Flow effects speak in
  // STEPS of +2; the Size adjustment is a raw +/-1 and is not a step.
  function encumbranceInfo(ch, attributes, dl, linFeats, size) {
    var sizeAdj = sizeEncumbranceAdj(size);
    var base = Math.max(3, 6 + attributes.BOD.mod + sizeAdj);
    var steps = [];
    var armor = dl.armor, lapsed = dl.armorLapsed;
    // Load-Bearing and the Load Distributor mod grant a single, non-stacking step
    var hasLB = !!armor && !lapsed && hasTrait(armor, "Load-Bearing");
    var hasLD = !!armor && !lapsed && armorModsOn(ch, dl.armorKey).indexOf("load-distributor") !== -1;
    if (hasLB || hasLD) steps.push({ label: (hasLB ? "Load-Bearing" : "Load Distributor") + " (" + armor.name + ")", value: 2 });
    // Powered frames: two steps while powered (Powered Frames proficiency is left to the table; a lapsed lease grants nothing)
    if (armor && !lapsed && hasTrait(armor, "Powered")) steps.push({ label: "Powered frame (" + armor.name + ")", value: 4 });
    // Lineage features that raise the Threshold outright ("+2 Threshold, and one
    // Size larger for grappling"). Both are lineage Additive Features, never Talents.
    if ((linFeats || []).indexOf("Synthetic Musculature") !== -1) steps.push({ label: "Synthetic Musculature (+2 Threshold)", value: 2 });
    if ((linFeats || []).indexOf("Heavy Payload") !== -1) steps.push({ label: "Heavy Payload (+2 Threshold)", value: 2 });
    var threshold = base; steps.forEach(function (s) { threshold += s.value; });
    var bands = { light: threshold - 3, standard: threshold, heavy: threshold + 3 };
    var current = 0, items = [];
    // a validly Racked item (stowed in worn Carry Gear) carries 1 less Load,
    // min 0. One rack slot holds ONE item, so a pooled qty stack racked as a
    // single slot gets the break once, not once per unit.
    //
    // The { worn } flag was dead until 2026-08-21: three callers passed it and itemLoad
    // declared `opts` without ever reading it, while an older comment here claimed worn armor
    // got "-2 min 0". It never did, and armor's own branch says so explicitly: a suit counts
    // in full whether worn, packed or looted. Since 2026-08-24 the flag drives the Worn Gear
    // Trait's own reduction, so it has to mean "this piece is actually worn" for ANY item, not
    // just the two that used to be asked about. Carry status "worn" is the general answer;
    // equipped armor and an equipped Rig are worn without carrying that status.
    var racks = rackState(ch);
    (ch.equipment || []).forEach(function (e) {
      if (!(e.qty > 0) || !onPerson(ch, e)) return;
      var ek = entryKey(e);
      var wornHere = isWornEntry(ch, e);
      var l = entryUnitLoad(ch, e, { worn: wornHere });
      var rackedGear = racks.byItem[ek] || null;
      var total = entryLoadNow(ch, e, null, racks);
      if (total > 0 || rackedGear) {
        current += total;
        items.push({ name: e.name, load: l, qty: e.qty, total: total, rackedIn: rackedGear ? rackedGear.name : null });
      }
    });
    /* Packed It and dropping things (23 Oct 2026): "The first number is the Load you're carrying now:
       everything revealed or picked up, minus what you've dropped. Note dropped items beside it,
       because Packed It still counts them. The second is your Load Budget." So the sheet keeps two
       totals. `current` (drops subtract) is what Encumbrance reads; `revealed` (drops do NOT subtract)
       is what Packed It counts against the Load Budget. The dropped log is ch.loadDropped, rows of
       { name, load, key?, unit? } written by inventory drop() (and by the migration of the retired
       Dropped carry choice); absent means none.
       A row whose entry (by key) is on your person again is already in `current`, so it is skipped
       here whichever door put the entry back (unlogDropped removes it on the sheet's own doors). */
    var dropped = 0, droppedItems = [];
    (Array.isArray(ch.loadDropped) ? ch.loadDropped : []).forEach(function (x, i) {
      if (!x || typeof x.name !== "string" || !isFinite(Number(x.load)) || Number(x.load) < 0) return;
      if (x.key) { var back = findEntry(ch, x.key); if (back && back.qty > 0 && onPerson(ch, back)) return; }
      droppedItems.push({ name: x.name, load: Number(x.load), index: i });
      dropped += Number(x.load);
    });
    var revealed = current + dropped;
    // "When a job starts, each Freelancer declares one Loadout... If nobody
    // declares, assume Standard." The declared tier sets the Load Budget; it is not
    // inferred from what you happen to be carrying.
    var tier = (ch.loadout === "light" || ch.loadout === "heavy") ? ch.loadout : "standard";
    var budget = bands[tier];
    var haul = (ch.haul === "lift" || ch.haul === "dragone" || ch.haul === "drag") ? ch.haul : "none";
    // Unencumbered: "at or below your Load Budget, and your Loadout isn't Heavy."
    // Encumbered: "on a Heavy Loadout, carrying more Load than your Load Budget, or
    // hauling something that is clearly heavy but still plausible." Overloaded is defined by the haul
    // ("something that clearly belongs on a dolly, cart, vehicle, forklift, or
    // exoframe"), not by a numeric band.
    // Optional rule (Settings): with Encumbrance off, carried Load and the Loadout never encumber; a Haul still does
    var encOn = !(EN.launch && EN.launch.rule) || EN.launch.rule("encumbrance");
    var state = "unencumbered";
    if (encOn && current > budget) state = "encumbered";
    if (encOn && tier === "heavy") state = "encumbered";           // a Heavy loadout is Encumbered for the run
    if (haul === "lift") state = (state === "unencumbered") ? "encumbered" : "overloaded";
    /* Dragging, Pushing, and Pulling (Part 3): one body-sized load "treats you as Encumbered".
       Unlike the Short Lift and Carry above, that section says nothing about stepping up to
       Overloaded when you already were, so an Encumbered character stays Encumbered here. */
    if (haul === "dragone" && state === "unencumbered") state = "encumbered";
    if (haul === "drag") state = "overloaded";
    /* What the state does to Speed, as inputs to speedSteps rather than a finished number, so
       the Freelancer tab can add its conditions and still run the book's order (every flat
       reduction, then the halvings). Encumbered is a flat -2; Overloaded halves.
       While dragging, pushing or pulling, "Your Speed is usually halved, round down. Don't stack
       this with the Encumbered Speed penalty. Use the worse movement limit": dragging one body
       offers a halving in place of the -2, and speedSteps keeps whichever ends lower. The
       oversized or double haul is Overloaded, which already halves. Neither may Dash ("You can't
       Dash" while dragging; "You can't use Dash" while Overloaded). */
    var dragging = haul === "dragone" || haul === "drag";
    var speedMods = { flat: state === "encumbered" ? -2 : 0, halve: state === "overloaded" ? 1 : 0,
                      halveInstead: (haul === "dragone" && state === "encumbered") ? 2 : 0 };
    return { enabled: encOn, base: base, size: size || null,
             steps: steps, threshold: threshold, bands: bands, tier: tier, budget: budget,
             current: current, items: items, haul: haul, state: state,
             dropped: dropped, droppedItems: droppedItems, revealed: revealed, packedRoom: budget - revealed,
             dragging: dragging, noDash: dragging || state === "overloaded", speedMods: speedMods };
  }

  /* SPEED REDUCTIONS, in the book's order (Part 2, Movement & Distance, Speed): "When multiple
     Speed reductions apply, subtract all flat reductions first, then apply any halving or
     percentage reductions, rounding down. Speed can't fall below 0 (or its stated minimum)."
     The ONE place a reduction is applied. derive() runs it with the Load state alone (d.speed);
     the Freelancer tab runs it again from d.speedBase with the conditions added, so the two can
     never take the steps in different orders. It used to be split across both: derive() halved
     for Overloaded first (with a floor of 1 the book never states) and combat.js then took the
     Fatigue reductions off the halved number, so base 8, Overloaded, Fatigue 2 read 1, not
     (8 - 3) / 2 = 2.
       m.flat          every flat change summed (reductions negative)
       m.halve         how many halvings apply, each rounding down
       m.halveInstead  dragging one body: this much of m.flat (the Encumbered -2) may be swapped
                       for one more halving, and the worse (lower) result is the one kept
       m.min           a stated minimum (Fatigue 3: "halved (rounded down, minimum 3)"), else 0
       m.zero          a condition that sets Speed to 0 outright (Grappled, Restrained ...)
     Returns { total, afterFlat, halvings, swapped }: afterFlat and halvings are the path that
     produced total, so a breakdown can show the steps. */
  function speedSteps(base, m) {
    m = m || {};
    function run(flat, halve) {
      var s = base + flat;
      for (var i = 0; i < halve; i++) s = Math.floor(s / 2);
      return s;
    }
    if (m.zero) return { total: 0, afterFlat: base + (m.flat || 0), halvings: 0, swapped: false, zero: true };
    var flat = m.flat || 0, halve = m.halve || 0, swapped = false;
    var s = run(flat, halve);
    if (m.halveInstead) {
      var alt = run(flat + m.halveInstead, halve + 1);
      if (alt < s) { s = alt; flat += m.halveInstead; halve += 1; swapped = true; }
    }
    return { total: Math.max(m.min || 0, 0, s), afterFlat: base + flat, halvings: halve, swapped: swapped };
  }

  /* ---- Body Slots & Worn Gear ---------------------------------------------
     Nine canonical worn-gear groups, each with a capacity: how many distinct
     on-person items may occupy it before the player has to choose which are
     active. "Carry" here is a BODY slot (how many pieces of Carry Gear you
     can wear at once), a different mechanic from a Carry Gear item's own
     rack capacity (how many items go inside one worn bag). A validly Racked
     item is stowed inside worn Carry Gear, not worn on its own body slot, so
     it never counts here even though it is on-person. */
  var SLOT_CAPACITY = { Head: 1, Face: 1, Torso: 1, Arms: 2, Hands: 1, Legs: 1, Feet: 1, Accessories: 4, Carry: 3 };
  // normalizes a catalog item's slot field (absent, a single string, or an
  // array for multi-slot gear like Torso+Legs armor) into a flat array of
  // only recognized slot names, so malformed or custom data never breaks
  // capacity math.
  function itemSlots(it) {
    if (!it || !it.slot) return [];
    var raw = Array.isArray(it.slot) ? it.slot : [it.slot];
    return raw.filter(function (s) { return SLOT_CAPACITY.hasOwnProperty(s); });
  }
  // per-slot occupancy for every genuinely-WORN item that calls out a Body
  // Slot: which entries are active vs player-benched ("inert"), and whether
  // the active count exceeds capacity (a conflict awaiting a pick). Merely
  // Carrying a slot-bearing item (a spare in your bag, not on your body)
  // never competes for its slot, only carry status "worn" does; armor,
  // shields, and Warding Foci are "worn" via their own dedicated equip
  // field instead, since only one of each can ever be equipped at a time.
  function slotState(ch) {
    var groups = {};
    Object.keys(SLOT_CAPACITY).forEach(function (s) { groups[s] = { capacity: SLOT_CAPACITY[s], active: [], inert: [], overflow: false }; });
    var inertMap = (ch && ch.slotInert) || {};
    (ch.equipment || []).forEach(function (e) {
      if (!(e.qty > 0)) return;
      var key = entryKey(e);
      // Any single-slot equip counts as worn. Decks and rigs join this list in the registry
      // but declare no `slot`, so they cannot reach the capacity check below today. The day
      // a data edit gives one a slot they enrol in Body Slot conflicts automatically, which
      // is almost certainly right and is written down here so it is not a surprise later.
      var directlyEquipped = isSlotEquipped(ch, key);
      var isWorn = directlyEquipped || (ch.carry && ch.carry[key] === "worn");
      if (!isWorn) return;
      var slots = itemSlots(loadCatalogItem(e.name));
      if (!slots.length) return;
      var inert = !!inertMap[key];
      slots.forEach(function (s) {
        var g = groups[s];
        if (!g) return;
        (inert ? g.inert : g.active).push(e);
      });
    });
    Object.keys(groups).forEach(function (s) { groups[s].overflow = groups[s].active.length > groups[s].capacity; });
    return groups;
  }
  // just the overflowing slot groups, for a summary "N slots need a pick" banner
  function slotConflicts(ch) {
    var st = slotState(ch), out = {};
    Object.keys(st).forEach(function (s) { if (st[s].overflow) out[s] = st[s]; });
    return out;
  }

  /* ---- Burner Relays (29 October 2026 handoff) ---------------------------------
     PHB, Equipment, Burner Relays: "Disposable, overclocked, single-shot. Anyone can fire one.
     After it fires, both the Relay and the cipher are gone." A Relay is a Stash entry (one per
     unit, never pooled) named "<Tier> Burner Relay", whose tier row in EN.grid.relays carries its
     own baked-in Attack Bonus, Save DC and Max Node Tier: "Burner Relays and B&E Buddies use their
     own baked-in Attack Bonus instead of yours." The loaded cipher rides on the entry:
       e.relayCipher   the loaded cipher's name (the six suite names without their link mark)
       e.relaySlotted  a Codebreaker slotted one of their Repertoire ciphers into it
       e.relayEmpty    nothing loaded (a Codebreaker extracted it, or never loaded one)
     THE CHECK: "If the cipher's Complexity exceeds what you could normally run (Complexity 0 for
     a Standard User, your deck's Max Complexity for a Codebreaker), roll a Systems (Tech) check
     (DC 10 + Cipher Complexity, or Snag Dice equal to Cipher Complexity out of combat)". What
     you can normally run is a Codebreaker's live Smartdeck's Max Complexity; anyone else, a
     Codebreaker on a Buddy or with no deck included, is a Standard User at 0. The d20 check is
     the user's own Systems: Tech Modifier + Systems Proficiency Bonus, no Device Bonus (the
     Relay, not the deck, is doing the firing). */
  function relayRow(name) {
    var G = EN.grid || {};
    return (G.relays || []).filter(function (r) { return (r.tier + " Burner Relay") === name; })[0] || null;
  }
  function suiteName(n) { return String(n || "").replace(/\s*\u21cb\s*$/, ""); }
  // a cipher by name, from the library or the free Complexity 0 suite
  function cipherByName(name) {
    var G = EN.grid || {}, n = suiteName(name);
    var c = (G.ciphers || []).filter(function (x) { return x.name === n; })[0];
    if (c) return { name: c.name, cx: c.cx, text: c.text, activation: c.activation, range: c.range };
    var b = (G.buddyCiphers || []).filter(function (x) { return suiteName(x.name) === n; })[0];
    if (b) return { name: n, cx: 0, text: b.text, activation: b.activation, range: b.range, suite: true };
    return null;
  }
  // what a Relay of tier t comes loaded with: a cipher of the matching Complexity (the Cipher
  // Library's "Burner Relay (one-shot)" column prices Complexity 0-5 at the Relay tiers)
  function relayLoadable(t) {
    var G = EN.grid || {};
    if (t === 0) return (G.buddyCiphers || []).map(function (b) { return suiteName(b.name); });
    return (G.ciphers || []).filter(function (c) { return c.cx === t; }).map(function (c) { return c.name; });
  }
  function relayRunCap(ch, gd) {
    return (ch && ch["class"] === "codebreaker" && gd && gd.deck && gd.deck.type === "smartdeck") ? (gd.deck.maxComplexity || 0) : 0;
  }
  function relayInfo(ch, d, e) {
    var row = e ? relayRow(e.name) : null;
    if (!row) return null;
    var gd = (d && d.grid) || {};
    var cy = (e.relayCipher && !e.relayEmpty) ? cipherByName(e.relayCipher) : null;
    var cap = relayRunCap(ch, gd);
    var cx = cy ? cy.cx : null;
    /* Untrained in Systems (ruled 29 Oct 2026, the Skills tier table: "Untrained | Default | Roll
       with Snag | Add +2 Snag Dice to the pool"): Snag on the d20, and +2 Snag Dice on the pool on
       top of the Complexity's. Human Ingenuity can waive the d20 Snag only. */
    var sys = ((d && d.skills) || []).filter(function (x) { return x.key === "systems"; })[0];
    var untrained = !sys || sys.tier === "untrained" || !!sys.untrained;
    return { row: row, cipher: cy, empty: !cy, cap: cap, needed: !!cy && cx > cap,
             dc: cy ? 10 + cx : null, bonus: gd.cipherAttackBonus || 0, codebreaker: !!(ch && ch["class"] === "codebreaker"),
             untrained: untrained, human: !!(ch && ch.species === "humans"),
             poolSnag: cy ? cx + (untrained ? 2 : 0) : null };
  }
  /* The check's outcome. In combat, value is the natural d20: "Critical Failure (Nat 1, Margin
     minus 5 or worse on d20...)", "Failure (Margin minus 1 to minus 4 on d20...)". Out of combat,
     value is the Dice Pool Margin: minus 1 to minus 2 a Failure, minus 3 or worse a Critical
     Failure. "full", "reduced" (Save DC and Attack Bonus minus 2, or 2 fewer Edge Dice), "dead". */
  function relayOutcome(info, mode, value) {
    if (!info || !info.needed) return { result: "full", margin: null };
    if (value == null || value === "" || isNaN(+value)) return null;
    value = +value;
    if (mode === "pool") return { result: value >= 0 ? "full" : value >= -2 ? "reduced" : "dead", margin: value };
    if (value === 1) return { result: "dead", margin: 1 + info.bonus - info.dc, nat1: true };
    var m = value + info.bonus - info.dc;
    return { result: m >= 0 ? "full" : m >= -4 ? "reduced" : "dead", margin: m };
  }

  /* ---- #GRID hacking stats: Cipher Attack / Save DC, Links, Bandwidth, and the
     equipped rig (Smartdeck for Power Users / B&E Buddy for Standard Users).
     Cipher Attack = d20 + Tech mod + Systems Proficiency Bonus; the deck's Device
     Bonus rides on the attack roll (Quick Hack). Save DC = 8 + Tech mod + Systems prof. */
  function gridStats(ch, attributes, skills, level, cal, resource) {
    var G = EN.grid || {};
    var sys = (skills || []).find(function (s) { return s.key === "systems"; });
    var sysProf = sys ? sys.profBonus : 0, sysTier = sys ? sys.tier : "untrained";
    var techMod = attributes.TEC.mod;
    var cipherAttackBonus = techMod + sysProf;
    var cipherSaveDC = 8 + techMod + sysProf;
    // Passive Systems: what you notice without actively scanning, compared against a
    // hidden node's Scan DC ("10 + your Tech modifier + your Systems Proficiency Bonus").
    var passiveSystems = 10 + techMod + sysProf;
    // a Systems Focus is a conditional line on top of the base, as on the Systems skill row
    var passiveSystemsFocus = ((sys && sys.passiveFocus) || []).map(function (pf) { return { aspect: pf.aspect, score: passiveSystems + cal }; });
    var isCodebreaker = ch.class === "codebreaker";
    // A Sourcerer tethers through sprites rather than a deck, and counts as a Power User.
    var isSourcerer = ch.class === "shaper" && ch.subclass === "sourcerer";
    // SysAdmin (Root Access) at L9 removes the Link cap for Codebreakers
    var unlimitedLinks = isCodebreaker && level >= 9;
    var g = (ch && ch.grid) || {};
    var deck = null, deviceBonus = 0, deckBaseIntegrity = 0, modSlots = 0, deckTraits = [], maxComplexity = null;

    /* The live deck is the one you JACKED IN, and only that one. There is no best-owned
       fallback any more: selection is an explicit act on the Stash row, exactly like wearing
       armor, so a deck you own but have not equipped reads as no deck. The fallback had to go
       because it disagreed with the row, offering JACK IN on hardware that was already
       silently live. Existing characters had the fallback's own answer written into storage
       once by migrate(); see the equipSlots stamp there.

       A recorded pick only counts while that exact entry is still in the stash, so selling a
       deck makes the recording inert rather than crediting hardware that is gone, and a
       re-bought deck is a new entry with a new key that never re-locks an abandoned pick. */
    var ownedDeckList = ownedDecks(ch);
    var recordedKey = (typeof g.deckKey === "string") ? g.deckKey : null;
    var deckEntry = recordedKey ? (ownedDeckList.find(function (o) { return o.key === recordedKey; }) || null) : null;
    var deckKey = deckEntry ? deckEntry.key : null;
    var deckTypeNow = deckEntry ? deckEntry.type : null;

    if (deckTypeNow === "smartdeck") {
      deck = deckEntry.row;
      deviceBonus = deck.deviceBonus; deckBaseIntegrity = deck.integrity; modSlots = deck.modSlots; maxComplexity = Math.min(5, deck.t + 1);
      deckTraits = (G.smartdecks || []).filter(function (x) { return x.t <= deck.t; }).map(function (x) { return x.trait; });
    } else if (deckTypeNow === "buddy") {
      deck = deckEntry.row;
      deckBaseIntegrity = deck.integrity;   // buddies have no mod slots, so mods never apply
    }

    /* Mods belong to the DECK, not to the character: ch.grid.deckMods is keyed by entry, so
       kitting out one Advanced Smartdeck leaves the spare one bare. Capacity still clips the
       list, which also drops mods stranded by a downgrade and is safe against imported data. */
    var modKeys = (deckKey && g.deckMods && !Array.isArray(g.deckMods)) ? (g.deckMods[deckKey] || []) : [];
    var modIntegrity = 0, modLinks = 0, hasRedline = false, usedSlots = 0;
    modKeys.forEach(function (k) {
      var m = (G.mods || []).find(function (x) { return x.key === k; });
      if (!m || usedSlots + m.slots > modSlots) return;
      usedSlots += m.slots;
      if (m.bonus && m.bonus.integrity) modIntegrity += m.bonus.integrity;
      if (m.bonus && m.bonus.links) modLinks += m.bonus.links;
      if (k === "redline") hasRedline = true;
    });
    var deckMaxIntegrity = deck ? deckBaseIntegrity + modIntegrity : 0;
    /* Damage is read under THIS deck's key, so a fresh deck arrives full and hurting one
       cannot touch another's total. Derived here rather than in each view, because three
       places each computing "max minus spent" is three places that can disagree on Bricked. */
    var deckSpent = (deckKey && g.deckHpSpent && typeof g.deckHpSpent === "object") ? (g.deckHpSpent[deckKey] | 0) : 0;
    deckSpent = clamp(deckSpent, 0, deckMaxIntegrity);
    var deckIntegrity = Math.max(0, deckMaxIntegrity - deckSpent);
    var deckBricked = !!deck && deckIntegrity <= 0;
    var isSmart = deckTypeNow === "smartdeck" && !!deck;
    var isBuddy = deckTypeNow === "buddy" && !!deck;
    // effective attack/save with the current rig (Buddy uses its baked-in numbers)
    var effectiveAttack = isBuddy ? deck.attack : cipherAttackBonus + deviceBonus;
    var effectiveSaveDC = isBuddy ? deck.saveDc : cipherSaveDC;
    var hasAdaptiveBuffer = isSmart && deck.t >= 4;   // Elite+ trait (Elite t=4, Apex t=5)
    var stabilityDcMod = (hasAdaptiveBuffer ? -2 : 0) + (hasRedline ? 2 : 0);
    // Live Stability DC: "DC equal to 10, or half the total damage taken that turn,
    // whichever is higher." A rig modifier (an Elite deck's Adaptive Buffer lowers it,
    // a Crown Spike Array raises it) adjusts the FINAL DC, not just the 10 floor, so
    // it keeps working once the damage-derived number takes over.
    var stabilityLastDamage = Math.max(0, ((ch && ch.lastDamage) | 0));
    var stabilityDcFromDamage = Math.floor(stabilityLastDamage / 2);
    var stabilityDcBase = 10 + stabilityDcMod;
    var stabilityDcLive = Math.max(10, stabilityDcFromDamage) + stabilityDcMod;
    // Link capacity: a Codebreaker holds 2 x Caliber; a Sourcerer's sprites hold
    // Caliber-many with no hardware in the loop; everyone else holds one.
    var baseMaxLinks = isCodebreaker ? (2 * cal) : (isSourcerer ? cal : 1);
    /* Parallel Processing (Codebreaker or Sourcerer only, so the gate is the class test): "You can
       maintain one additional active Link beyond your standard class maximum", and its Upgrade
       "a second additional active Link (two beyond your class maximum total)". */
    var linkBonus = 0;
    if (isCodebreaker || isSourcerer) {
      if (activeTalents(ch).some(function (t) { return t.talent.key === "parallel-processing"; })) {
        linkBonus += 1;
        if (talentUpgradeKeys(ch).indexOf("parallel-processing") !== -1) linkBonus += 1;
      }
    }
    var maxLinks = unlimitedLinks ? null : baseMaxLinks + linkBonus + (isCodebreaker ? modLinks : 0);
    return {
      isCodebreaker: isCodebreaker, isSourcerer: isSourcerer,
      userType: (isCodebreaker || isSourcerer) ? "Power User" : "Standard User",
      techMod: techMod, systemsProf: sysProf,
      cipherAttackBonus: cipherAttackBonus, cipherSaveDC: cipherSaveDC, passiveSystems: passiveSystems, passiveSystemsFocus: passiveSystemsFocus,
      effectiveAttack: effectiveAttack, effectiveSaveDC: effectiveSaveDC,
      quickHackBonus: isSmart ? cipherAttackBonus + deviceBonus : null,
      maxLinks: maxLinks, unlimitedLinks: unlimitedLinks, modLinks: isCodebreaker ? modLinks : 0, linkBonus: linkBonus,
      bandwidthMax: (isCodebreaker && resource && resource.name === "Bandwidth") ? resource.max : null,
      stabilityDcBase: stabilityDcBase, stabilityDcMod: stabilityDcMod,
      stabilityLastDamage: stabilityLastDamage, stabilityDcFromDamage: stabilityDcFromDamage, stabilityDcLive: stabilityDcLive,
      // the owned list and the resolved key travel with the record, so a view can offer the
      // real choices without re-deriving what counts as a deck
      ownedDecks: ownedDeckList, deckKey: deckKey,
      deck: deck ? { type: deckTypeNow, tier: deck.tier, t: deck.t, key: deckKey,
                     deviceBonus: deviceBonus, maxIntegrity: deckMaxIntegrity,
                     spent: deckSpent, integrity: deckIntegrity, bricked: deckBricked,
                     modSlots: modSlots, usedSlots: usedSlots, mods: modKeys, traits: deckTraits,
                     maxComplexity: maxComplexity,
                     attack: deck.attack, saveDc: deck.saveDc, maxNode: deck.maxNode } : null
    };
  }

  /* ======================================================================
     MAIN: derive a full computed snapshot for a character
     ====================================================================== */
  /* ---- Trauma Rig, the OBJECT. Anyone can buy one ("User Type: Anyone (Standard
     Users). Stitchers (Practitioners)"), so everything that belongs to the piece of
     gear is derived for every character regardless of class: the tier, its Output
     Bonus, Mod Slots, the accumulated trait ladder, the Medical Baseline grade,
     Integrity, and the #GRID node it projects. The Stitcher CLASS RESOURCE reads this
     record and adds what only a Stitcher has (see triageStats below).

     Rig state lives on ch.rig ({key, scrap, hp}) and is keyed on the EQUIPMENT ENTRY,
     not on the tier name. Trauma Rigs are non-stackable, so every purchase already gets
     its own entry id and entryKey(e) returns it: ch.rig.key names the specific Rig the
     player picked, and ch.rig.hp maps an entry key to the Integrity spent on THAT Rig.
     This is the ONE place a Rig is resolved; every surface (the Freelancer tab's Rig
     block and its picker, the #GRID tab's node, the Tech Bay's kit scan) consumes the
     answer rather than re-deriving its own, so they cannot disagree about which Rig is
     live or how hurt it is.

     Keying on the entry is what makes two facts fall out with no heuristic:

       - A RE-ACQUIRED RIG ALWAYS ARRIVES FULL. Dropping a Rig and buying another of the
         same tier produces a DIFFERENT entry id, so the dropped Rig's damage can never
         find its way onto the new one. The app has no vocabulary for "recovered": every
         outflow is unconditional and unrecorded and the only inflows are a full-price
         purchase or a bench build, so every re-acquisition is a new object in the app's
         own terms. GM-ruled recovery is a fiction-level event: they type the damage
         back in.
       - TWO RIGS CAN BE DAMAGED INDEPENDENTLY, including two of the same tier, because
         each one owns its own slot in the hp map instead of sharing one total.

     A recorded key is only honoured while that exact entry is still in the stash. Drop
     it and the recording is inert: resolution falls through to the best Trauma Rig
     actually in the stash, which is what the AUTO path does when nothing is recorded at
     all. Own none and there is no Rig. A Scrap Rig, a stale key, and no rig at all all
     resolve to Output Bonus +0, so the DC is always a number and never NaN.

     Everything the Rig carries is read straight off the tier row, where it was derived
     from the Tier ordinal: Mod Slots (= Tier), the cumulative trait list, the Medical
     Baseline grade, Integrity, and the #GRID node tier it projects. Nothing is
     recomputed here, so the sheet and the storefront always agree. */
  function rigTierRow(tier) {
    if (!tier) return null;
    var tiers = (EN.traumaRigs && EN.traumaRigs.tiers) || [];
    return tiers.find(function (r) { return r.tier === tier; }) || null;
  }
  /* Every Trauma Rig the character owns, as {key, row} pairs, best tier first. The key
     is the equipment entry's own identity, so two Rigs of the SAME tier are two distinct
     entries here (no dedupe): they are two objects, each pickable and each damageable on
     its own. The Rig picker lists exactly these. */
  /* THE FIVE SINGLE-SLOT EQUIP SLOTS, DESCRIBED ONCE.

     Armor, shield, focus, Smartdeck and Trauma Rig are all the same mechanic: one at a time,
     recorded as an ENTRY KEY, resolved from what you actually own. Before this table the five
     were spelled out by hand in EIGHT places (onPerson, slotState, isEquippedAny, equipLabel,
     carryCtrl, unequipIfGone, undoKit, and the printed Inventory table in both printsheet.js
     and pdfexport.js), so adding a slot meant finding all eight or shipping a row that reads
     ON-PERSON forever and never releases the key when the item is sold.

     Why accessors rather than a field name. The old DEF_SLOT mapped a kind to a flat string
     ("equippedArmor") and indexed the character with it. That cannot express the two new
     slots: deckKey is nested under ch.grid, and rig.key sits beside rig.scrap and has to clear
     it. A get/set pair costs one closure and expresses both.

     Why `owned` is a function and not a predicate on the catalog row. ownedDecks and ownedRigs
     do more than read a field: they also require a matching tier row in EN.grid / EN.traumaRigs.
     Gating a button on the raw catalog field would offer EQUIP on hardware the resolver then
     refuses to resolve. One ownership answer, used by the row, the resolver and the migration. */
  function ownedByKind(ch, kind) {
    var out = [];
    ((ch && ch.equipment) || []).forEach(function (e) {
      if (!e || (e.qty != null && e.qty <= 0)) return;
      var it = loadCatalogItem(e.name);
      if (it && it.kind === kind) out.push({ key: entryKey(e), name: e.name });
    });
    return out;
  }
  var EQUIP_SLOTS = [
    { id: "armor", label: "Worn", verbs: { on: "WEAR", off: "✓ WORN", act: "worn" },
      get: function (ch) { return (ch && ch.equippedArmor) || null; },
      set: function (c, key) { c.equippedArmor = key || null; },
      owned: function (ch) { return ownedByKind(ch, "armor"); } },
    { id: "shield", label: "Wielding", verbs: { on: "RAISE", off: "✓ WIELDING", act: "wielded" },
      get: function (ch) { return (ch && ch.equippedShield) || null; },
      set: function (c, key) { c.equippedShield = key || null; },
      owned: function (ch) { return ownedByKind(ch, "shield"); } },
    { id: "focus", label: "Attuned", verbs: { on: "ATTUNE", off: "✓ ATTUNED", act: "attuned" },
      get: function (ch) { return (ch && ch.equippedFocus) || null; },
      set: function (c, key) { c.equippedFocus = key || null; },
      owned: function (ch) { return ownedByKind(ch, "focus"); } },
    /* Jacking in does NOT disturb the deck you leave: each one keeps its own mods and its own
       Integrity under its own key, so switching back finds the first exactly as you left it.
       That is why this only writes a key, where the old tier-based picker had to zero damage
       and prune stranded mods. Under that shape one flat array and one number were shared by
       every deck the character owned, so a swap had to destroy state to stay coherent.
       Pruning still happens, but as a READ: mods past the deck's slot count are ignored rather
       than deleted, so a downgrade and re-upgrade restores the loadout. The book agrees, since
       mods "can be reseated into the new chassis" rather than being lost on a swap. */
    { id: "deck", label: "Jacked in", verbs: { on: "JACK IN", off: "✓ JACKED IN", act: "jacked in" },
      get: function (ch) { return (ch && ch.grid && ch.grid.deckKey) || null; },
      set: function (c, key) { c.grid = c.grid || {}; c.grid.deckKey = key || null; },
      owned: ownedDecks },
    /* Equipping a real Rig clears the Scrap Rig, because you cannot be improvising and running
       proper hardware at once. Un-equipping deliberately does NOT set scrap: "no Rig" and
       "improvised Rig" are different states and the Stash cannot know which one was meant, so
       the Scrap Rig stays a Stitcher toggle on the Freelancer card. */
    { id: "rig", label: "Worn", verbs: { on: "WEAR", off: "✓ WORN", act: "worn" },
      get: function (ch) { return (ch && ch.rig && ch.rig.key) || null; },
      set: function (c, key) { c.rig = c.rig || {}; c.rig.key = key || null; if (key) c.rig.scrap = false; },
      owned: ownedRigs }
  ];
  function equipSlotById(id) {
    for (var i = 0; i < EQUIP_SLOTS.length; i++) if (EQUIP_SLOTS[i].id === id) return EQUIP_SLOTS[i];
    return null;
  }
  // which slot, if any, this owned entry belongs to. Null for ordinary gear.
  function equipSlotFor(ch, it, entry) {
    var key = entryKey(entry);
    if (!key) return null;
    for (var i = 0; i < EQUIP_SLOTS.length; i++) {
      var owned = EQUIP_SLOTS[i].owned(ch);
      for (var j = 0; j < owned.length; j++) if (owned[j].key === key) return EQUIP_SLOTS[i];
    }
    return null;
  }
  // every key currently filling a single slot. Weapons are a LIST and stay separate.
  function slotEquippedKeys(ch) {
    var out = [];
    EQUIP_SLOTS.forEach(function (s) { var k = s.get(ch); if (k) out.push(k); });
    return out;
  }
  function equipSlotLabel(ch, key) {
    for (var i = 0; i < EQUIP_SLOTS.length; i++) if (EQUIP_SLOTS[i].get(ch) === key) return EQUIP_SLOTS[i].label;
    return null;
  }
  function isSlotEquipped(ch, key) { return slotEquippedKeys(ch).indexOf(key) !== -1; }
  // clear this entry out of whatever slot holds it. Called when gear leaves the stash.
  function releaseEntry(c, key) {
    if (!key) return;
    EQUIP_SLOTS.forEach(function (s) { if (s.get(c) === key) s.set(c, null); });
  }
  function setEquipSlot(c, slotId, key) {
    var s = equipSlotById(slotId);
    if (s) s.set(c, key || null);
    if (s && key) unlogDropped(c, key);   // equipping a dropped item picks it back up (Packed It counts it once)
  }

  /* THE LIVE DECK IS AN OWNED ENTRY, exactly as a Trauma Rig is. ch.grid.deckKey names a
     specific equipment entry rather than a tier string, so two identical Smartdecks are two
     decks with two mod loadouts and two Integrity tracks.

     deckType and deckTier are no longer stored anywhere on the character. The catalog row for
     an owned deck already carries both, so they are read off the thing actually owned and
     cannot drift from it: selling the deck removes the type, rather than leaving a character
     claiming an Apex rig they no longer have. */
  function ownedDecks(ch) {
    var G = EN.grid || {}, out = [];
    ((ch && ch.equipment) || []).forEach(function (e) {
      if (!e || (e.qty != null && e.qty <= 0)) return;
      var it = loadCatalogItem(e.name);
      if (!it || !it.deckType || !it.deckTier) return;
      var list = it.deckType === "smartdeck" ? (G.smartdecks || []) : (G.buddies || []);
      var row = list.find(function (t) { return t.tier === it.deckTier; });
      if (row) out.push({ key: entryKey(e), type: it.deckType, tier: it.deckTier, row: row, name: e.name });
    });
    // best first: higher tier wins, and a Smartdeck outranks a Buddy of equal tier because it
    // is a Power User rig. This is the order the AUTO fallback picks from.
    return out.sort(function (a, b) {
      return (b.row.t - a.row.t) || ((a.type === "smartdeck" ? 0 : 1) - (b.type === "smartdeck" ? 0 : 1));
    });
  }

  function ownedRigs(ch) {
    var out = [];
    ((ch && ch.equipment) || []).forEach(function (e) {
      if (!e || (e.qty != null && e.qty <= 0)) return;
      var it = loadCatalogItem(e.name);
      var row = rigTierRow(it && it.rigTier);
      if (row) out.push({ key: entryKey(e), row: row });
    });
    return out.sort(function (a, b) { return b.row.t - a.row.t; });
  }
  function rigStats(ch) {
    var r = (ch && ch.rig) || {};
    var scrap = !!r.scrap;
    var owned = ownedRigs(ch);
    // A recorded pick only counts while that exact entry is still in the stash. Drop it
    // and the recording is inert, so resolution falls through to the AUTO owned-gear
    // path instead of crediting the character with hardware they no longer have. A
    // re-bought Rig is a new entry with a new key, so it never re-locks an abandoned
    // pick either.
    // Same rule as the deck: the Rig you WORE, and only that one. No best-owned fallback.
    var recordedKey = (!scrap && typeof r.key === "string") ? r.key : null;
    var entry = recordedKey ? (owned.find(function (o) { return o.key === recordedKey; }) || null) : null;
    var row = entry ? entry.row : null;
    var key = entry ? entry.key : null;
    var outputBonus = row ? (row.outputBonus || 0) : 0;
    // Integrity, the Rig's #GRID node: damage subtracts, Bricked at 0. Mirrors the
    // Smartdeck's System Integrity track (ch.grid.deckHpSpent), except that a Smartdeck
    // is one slot on the record while a character can own several Rigs. So damage is
    // read out of ch.rig.hp under THIS entry's key: a fresh Rig has no entry there and
    // arrives full, and damaging one Rig cannot touch another's total.
    var maxIntegrity = row ? (row.integrity || 0) : 0;
    var hpMap = (r.hp && typeof r.hp === "object") ? r.hp : {};
    var spent = key ? clamp((hpMap[key] | 0), 0, maxIntegrity) : 0;
    return {
      rigKey: key,
      rigTier: row ? row.tier : null,
      rigTierIndex: row ? row.t : null,
      rigLabel: row ? row.label : null,
      ownedRigs: owned,
      scrapRig: scrap,
      outputBonus: outputBonus,
      // Mod Slots equal the Tier, and the trait list accumulates; both derived in the data
      modSlots: row ? row.modSlots : 0,
      traits: row ? (row.traits || []).slice() : [],
      // Medical Baseline: Basic Medkit, or Advanced Medkit at Trauma Grade [2] and up
      medkitGrade: row ? row.medkitGrade : null,
      maxIntegrity: maxIntegrity,
      integrity: Math.max(0, maxIntegrity - spent),
      integritySpent: spent,
      bricked: maxIntegrity > 0 && spent >= maxIntegrity,
      nodeTier: row ? (row.nodeTier || null) : null,
      price: row ? (row.price || 0) : 0
    };
  }
  /* ---- Stitcher medical hardware: the CLASS RESOURCE riding on the Rig object.

     Triage Save DC = 8 + Tech Modifier + the Rig's Output Bonus. Output Bonus is the
     rig tier's own value from EN.traumaRigs.tiers. It is NOT a proficiency bonus and
     NOT Caliber. No tool-proficiency tier bonus feeds this DC, and no such tier bonus
     exists in this system; Medical Tools stays an ordinary Tool Proficiency.

     Every object fact is spread in off rigStats, so d.triage keeps the exact shape it
     always had for the surfaces that read it. What is added here is Stitcher-only: the
     Save DC and its terms, and the Scrap Rig's Snag and Swift-becomes-Action penalty,
     which are Protocol rules and mean nothing to a character with no Protocols. */
  function triageStats(ch, attributes, rig) {
    var techMod = attributes.TEC.mod;
    rig = rig || rigStats(ch);
    var out = {};
    Object.keys(rig).forEach(function (k) { out[k] = rig[k]; });
    out.techMod = techMod;
    out.saveDC = 8 + techMod + rig.outputBonus;
    out.formula = "8 + Tech Modifier + Rig's Output Bonus";
    // A Scrap Rig imposes Snag on every Triage healing roll and attack roll, and
    // upgrades any Swift Action Protocol to an Action.
    out.snagOnTriage = rig.scrapRig;
    out.swiftBecomesAction = rig.scrapRig;
    return out;
  }

  /* ======================= ENVIRONMENTAL HAZARDS ==========================
     ONE resolver, the way rigStats(ch) is the one resolver for a Trauma Rig.
     Every surface (the Freelancer tab's Hazards panel, the Long Rest, the
     Codex chapter) reads hazardStats and never re-reads raw storage, so no
     second reading of "which exposure is live" or "does this suit hold
     vacuum" can grow beside it.

     THE ESCALATING DC IS PER EXPOSURE INSTANCE, and it is kept out of a global
     counter structurally rather than by discipline: each exposure is a row in
     ch.hazards.exposures under its own minted `ex_` id, carrying its own
     `saves` count, and the DC is derived from THAT row alone
     (10 + 2 * row.saves). There is nowhere for a shared counter to live. Two
     concurrent Cold exposures are two rows and escalate independently. Leaving
     an exposure DELETES its row, so "leaving resets both the clock and the DC"
     is not a reset step that could be forgotten; the state that held the DC is
     gone. Starting again mints a new id at saves 0, which is DC 10.
     Deprivation's three tracks are three such rows, one per threshold, and
     each stacks its own Fatigue in its own field. ------------------------- */

  // Gear counts as a mitigation only when it is ON YOUR PERSON, which is the
  // Loadout's own answer (carried / worn / racked / equipped), not the stash.
  function gearOnPerson(ch, name) {
    return ((ch && ch.equipment) || []).some(function (e) {
      return e && e.name === name && !(e.qty != null && e.qty <= 0) && onPerson(ch, e);
    });
  }
  /* Owned at all, anywhere in the stash, whether or not it is on your person.
     The Status Changes panel draws the line the spec draws: a mitigation you
     OWN surfaces (greyed when it is not doing anything), and one you do not own
     does not surface at all. `gearOnPerson` answers the second, narrower
     question and is what decides whether the mitigation actually fires; this
     one only decides whether the player gets to see it listed. */
  function gearInStash(ch, name) {
    return ((ch && ch.equipment) || []).some(function (e) {
      return e && e.name === name && !(e.qty != null && e.qty <= 0);
    });
  }
  /* Is this armor mod fitted to ANY suit the character owns, not just the one
     they are wearing? ch.armorMods is {armorEntryKey: [modKey]}, so a mod on a
     spare suit in the stash is possessed but inactive, which is exactly the
     greyed-out state the panel wants to show. Unaffected by the re-key: it asks
     about VALUES across every piece, not about which piece. */
  function armorModOwned(ch, modKey) {
    var am = (ch && ch.armorMods) || {};
    return Object.keys(am).some(function (n) {
      return Array.isArray(am[n]) && am[n].indexOf(modKey) !== -1;
    });
  }
  /* Does this suit carry an armor TRAIT, for the "armorTrait" mitigation source? Its own traits, and
     for Sealed also a fitted mod whose data says it grants the seal: the Rebreather Liner, whose
     entry reads "The suit counts as Sealed" (grantsSealed). One answer for the worn suit and for
     every owned suit, so the Status Changes panel and the hazard math cannot disagree. */
  function armorHasTrait(ch, item, key, traitName) {
    if (!item) return false;
    if (hasTrait(item, traitName)) return true;
    if (traitName !== "Sealed") return false;
    var byKey = (EN.armorMods && EN.armorMods.byKey) || {};
    return armorModsOn(ch, key).some(function (k) { var m = byKey[k]; return !!(m && m.grantsSealed); });
  }
  // Is ANY suit in the stash carrying the trait? (greys the mitigation rather than hiding it)
  function armorTraitOwned(ch, traitName) {
    return (Array.isArray(ch && ch.equipment) ? ch.equipment : []).some(function (e) {
      if (!e || (e.qty != null && e.qty <= 0)) return false;
      var it = loadCatalogItem(e.name);
      return !!it && it.kind === "armor" && armorHasTrait(ch, it, entryKey(e), traitName);
    });
  }
  /* The worn suit, once: its entry key, its catalog row, whether its lease has
     lapsed, the mods fitted to it, and the two seal questions every hazard
     asks. Resolved in one place because three hazard readers used to work it
     out for themselves, which is how two of them end up disagreeing later.
     Both seal answers read the mod's own DATA FLAGS (`grantsSealed`,
     `sealToVacuum`), never its display strings. */
  function wornArmor(ch) {
    var key = (ch && ch.equippedArmor) || null;
    var item = armorItem(keyToName(ch, key));
    var byKey = (EN.armorMods && EN.armorMods.byKey) || {};
    var fitted = armorModsOn(ch, key);
    function anyMod(flag) { return fitted.some(function (k) { var m = byKey[k]; return !!(m && m[flag]); }); }
    return {
      key: key, item: item, name: item ? item.name : null,
      lapsed: !!item && leaseLapsed(ch, key),
      fitted: fitted,
      // Sealed by its own trait, or by a mod whose data says it grants one.
      sealed: !!item && (hasTrait(item, "Sealed") || anyMod("grantsSealed")),
      sealedTrait: hasTrait(item, "Sealed"),
      vacuumLiner: anyMod("sealToVacuum")
    };
  }
  /* Does the worn suit hold VACUUM? The Sealed trait alone never does. Exactly
     two paths, and each is read off the item's own data rather than off a
     generic flag: `vacuum: true` on the armor row (Warframe Shell), or a
     Rebreather Liner (`sealToVacuum`) fitted to a suit that is ALREADY Sealed.
     Since the 16 October handoff the book's vacuum rule cites only the Rebreather
     Liner (the Warframe Shell moved to the Game Master's Toolkit); the `vacuum: true`
     path stays so a saved Warframe Shell still holds vacuum.
     A lapsed lease grants nothing, here as everywhere else. */
  function vacuumSeal(ch, w) {
    w = w || wornArmor(ch);
    var armor = w.item;
    if (!armor) return { sealed: false, via: null, armor: null, sealedTrait: false, liner: false,
                         why: "No armor worn. Nothing you are wearing holds vacuum." };
    var base = { armor: w.name, sealedTrait: w.sealedTrait, liner: w.vacuumLiner, lapsed: w.lapsed };
    if (w.lapsed) { base.sealed = false; base.via = null; base.why = w.name + "'s lease has lapsed, so it grants nothing, seals included."; return base; }
    if (armor.vacuum) { base.sealed = true; base.via = w.name; base.why = w.name + " holds vacuum natively; its own entry says so."; return base; }
    if (w.vacuumLiner && w.sealedTrait) { base.sealed = true; base.via = "Rebreather Liner on " + w.name;
      base.why = "The Rebreather Liner upgraded " + w.name + "'s existing Sealed trait to hold vacuum."; return base; }
    base.sealed = false; base.via = null;
    base.why = w.vacuumLiner ? (w.name + " is not Sealed, so the Rebreather Liner only grants the Sealed benefit, which does not cover vacuum.")
             : w.sealedTrait ? (w.name + " is Sealed, and the Sealed trait alone does NOT hold vacuum. Fit a Rebreather Liner to upgrade the seal.")
             : (w.name + " is not sealed at all.");
    return base;
  }

  /* Which of the nine mitigations are live, and why the others are not.
     Every one of them resolves to an EFFECT the hazard math reads; none of
     them is decorative. */
  function hazardMitigations(ch, w) {
    var H = EN.hazards; if (!H) return { active: [], inactive: [], fx: {} };
    var hz = (ch && ch.hazards) || {};
    var linFeats = activeLineageFeatures(ch);
    w = w || wornArmor(ch);
    var armorKey = w.key, armor = w.item, armorLapsed = w.lapsed, fittedMods = w.fitted;
    var active = [], inactive = [];
    // the accumulated effect vocabulary the rest of the file reads
    var fx = { noFatigue: {}, edgeOn: {}, graceDays: {}, blocksCaustic: false,
               noCausticLinger: false, immuneCaustic: false, thinAirMinutes: 0,
               /* Breath protection is PER KIND. It used to be one number applied to every
                  row of EN.hazards.breath.kinds, which is why the Rebreather could not be
                  wired up: its own entry stops you Drowning "in water or low-oxygen air" and
                  explicitly does not cover vacuum, and a single number would have handed a
                  face-slot mouthpiece an hour of vacuum immunity. Keyed by kind, with the
                  granting mitigation's name beside it so the panel can say who is doing it
                  rather than crediting Void Lung for everything. */
               breathMinutes: Object.create(null), breathFrom: Object.create(null) };

    (H.mitigations || []).forEach(function (m) {
      var src = m.source || {}, on = false, why = "", detail = null;
      if (src.type === "lineageFeature") {
        on = linFeats.indexOf(src.name) !== -1;
        why = on ? "Active feature." : "You do not have " + src.name + ".";
      } else if (src.type === "gear") {
        on = gearOnPerson(ch, src.name);
        why = on ? "On your person." : "No " + src.name + " carried or worn.";
        if (on && m.key === "hazmat" && hz.hazmatTorn) { on = false; why = "The suit is torn; the seal has failed until it is repaired and resealed."; }
        if (on && m.key === "rebreather") detail = Math.max(0, hz.rebreatherMinutes | 0) + " min left this scene";
      } else if (src.type === "armorTrait") {
        /* Worn, unlapsed armor with the trait (Sealed: "Sealed armor turns the bad air aside"). A suit
           the Rebreather Liner is fitted to counts as Sealed, as the Liner's own entry says. */
        var hasT = !!armor && armorHasTrait(ch, armor, armorKey, src.name);
        on = hasT && !armorLapsed;
        why = !armor ? "No armor worn." : !hasT ? armor.name + " is not " + src.name + "."
            : armorLapsed ? armor.name + "'s lease has lapsed, so its traits grant nothing."
            : armor.name + " is " + src.name + (hasTrait(armor, src.name) ? "." : " (a fitted mod makes it count as " + src.name + ").");
      } else if (src.type === "armorMod") {
        var fitted = fittedMods.indexOf(src.key) !== -1;
        on = fitted && !armorLapsed;
        why = !armor ? "No armor worn." : !fitted ? "Not fitted to " + armor.name + "."
            : armorLapsed ? armor.name + "'s lease has lapsed, so its mods grant nothing." : "Fitted to " + armor.name + ".";
        if (on && m.effects && m.effects.noFatigueChosen) {
          // The element is picked at install. It is recorded per ARMOR ENTRY,
          // so two suits each keep their own tuning and neither can read the
          // other's. Untuned grants nothing, and says so rather than guessing.
          var tuned = ((hz.thermalWeave || {})[armorKey]) || null;
          detail = tuned ? "tuned to " + tuned : null;
          if (!tuned) { on = false; why = "Fitted to " + armor.name + ", but no element chosen yet. Pick Fire or Cold."; }
          else {
            var typeKey = m.effects.noFatigueChosen[String(tuned).toLowerCase()];
            if (typeKey) fx.noFatigue[typeKey] = m.name;
          }
        }
      }
      /* POSSESSED vs ACTIVE, which the Status Changes panel needs to keep
         apart. The panel shows a mitigation only when the player actually has
         it, and greys it when it is had but not doing anything.
           gear      : possessed = the item is in the STASH at all; active =
                       it is on your person (worn, equipped, or applied), which
                       is what `on` already means.
           armorMod  : possessed = fitted to ANY suit you own, so a mod on a
                       spare in the stash greys rather than vanishing; active =
                       that suit is worn, unlapsed, and (for the weave) tuned.
           lineage   : possession IS activity. A trait you have is always on and
                       needs no toggle, so possessed tracks `on` exactly, and a
                       trait you lack never surfaces. */
      var possessed = on;
      if (src.type === "gear") possessed = on || gearInStash(ch, src.name);
      else if (src.type === "armorMod") possessed = armorModOwned(ch, src.key);
      else if (src.type === "armorTrait") possessed = on || armorTraitOwned(ch, src.name);
      var row = { key: m.key, name: m.name, kind: m.kind, summary: m.summary, note: m.note || null,
                  active: on, possessed: possessed, sourceType: src.type || null,
                  sourceName: src.name || null, why: why, detail: detail };
      if (!on) { inactive.push(row); return; }
      active.push(row);
      var e = m.effects || {};
      (e.noFatigue || []).forEach(function (t) { fx.noFatigue[t] = m.name; });
      (e.edgeOn || []).forEach(function (t) { fx.edgeOn[t] = m.name; });
      Object.keys(e.graceDays || {}).forEach(function (t) { fx.graceDays[t] = Math.max(fx.graceDays[t] || 0, e.graceDays[t]); });
      if (e.blocksCaustic) fx.blocksCaustic = m.name;
      if (e.noCausticLinger) fx.noCausticLinger = m.name;
      if (e.immuneCaustic) fx.immuneCaustic = m.name;
      if (e.thinAirMinutes) fx.thinAirMinutes = Math.max(fx.thinAirMinutes, e.thinAirMinutes);
      /* A number covers every breath kind, which is Void Lung: you are simply holding your
         breath and the reason you cannot inhale does not matter. An object covers only the
         kinds it names, which is the Rebreather. */
      if (e.breathMinutes) {
        var bm = e.breathMinutes;
        var kinds = (typeof bm === "number")
          ? ((H.breath && H.breath.kinds) || []).map(function (k) { return k.key; })
          : Object.keys(bm);
        kinds.forEach(function (kk) {
          var mins = (typeof bm === "number") ? bm : bm[kk];
          if (!(mins > 0)) return;
          if (!(fx.breathMinutes[kk] > mins)) { fx.breathMinutes[kk] = mins; fx.breathFrom[kk] = m.name; }
        });
      }
    });
    return { active: active, inactive: inactive, fx: fx };
  }

  /* Caustic gear degradation. It reads armorState, the same one resolver every
     other DR surface reads, and the loss it reports IS the suit's current DR.

     It used to keep its own ledger, ch.hazards.caustic.armorDR, and hand the
     loss to EN.armorRepair.applyDegradation when that module appeared. That was
     the right shape while Armor Repair was on a branch and armor DR here was
     immutable: a second parallel DR system was exactly what must not be waiting
     when it merged. But it merged as EN.crafting.armorRepair plus
     EN.engine.applyArmorDamage, so EN.armorRepair was never defined and the hook
     could not fire. The loss sat PENDING forever while the panel told the player
     Armor Repair was "on another branch". The ledger is retired; migrate() folds
     any recorded loss into ch.armorWear once and drops the field. There is one
     map, one resolver and one writer, which is what the scope note asked for. */
  function causticArmorDR(ch, w, fx) {
    w = w || wornArmor(ch);
    var st = armorState(ch, w.key);
    /* A mitigation that stops the caustic reaching you stops it reaching your
       ARMOR too. The Hazmat Suit is "a sealed chemsuit worn over your armor",
       so a suit that nulls the damage cannot leave the plate underneath it
       corroding: the panel used to print "No damage inside it: Hazmat Suit" and
       "Vanguard Plate is unsealed and will lose 1 DR after a full scene in it"
       in the same block, and MARK FULL SCENE wrote the ledger anyway. This
       function never received fx, which is exactly why it could not know.

       `immuneCaustic` is deliberately NOT in this gate. The reasoning above is about a
       chemsuit worn OVER the plate, which is `blocksCaustic`. Hazard Seal is the other
       kind: a Durabody sealing its own internal systems ("prevents internal flooding and
       chemical burns"). It stops the Acid reaching the CHARACTER and does nothing for the
       suit strapped on the outside, so folding it in here let a Durabody's unsealed armor
       sit in the wash forever without losing its DR, and made the panel claim the trait was
       "worn over" the armor. The book degrades unsealed gear regardless of who is wearing
       it. The wearer-side immunity is read separately, in the caustic block below. */
    var blockedBy = (fx && fx.blocksCaustic) || null;
    return {
      armor: w.name,
      armorKey: w.key,
      // "Unsealed armor" is armor with no Sealed trait and no mod granting one.
      sealed: w.sealed,
      blockedBy: blockedBy,
      exposed: !!w.item && !w.sealed && !blockedBy,
      baseDR: st.base,
      // The suit's real numbers, not a caustic-only tally. Wear is one map and it
      // does not record what took each point, so this block reports the state of
      // the plate rather than claiming a share of it.
      lost: st.lost,
      current: st.current,
      guard: st.guard,
      breached: st.breached
    };
  }

  /* The whole hazard record, derived. Nothing here mutates; the Hazards panel
     owns every write and routes it back through these same numbers. */
  function hazardStats(ch, attributes, saves, woundsMax) {
    var H = EN.hazards;
    var hz = (ch && ch.hazards) || {};
    var worn = wornArmor(ch);                 // resolved once, shared by all three readers below
    var mit = hazardMitigations(ch, worn);
    var fx = mit.fx;
    var E = (H && H.exposure) || {};
    var baseDC = E.baseDC || 10, step = E.step || 2;
    var bodSave = (saves && saves.BOD && saves.BOD.bonus) || 0;
    var bodScore = (attributes && attributes.BOD && attributes.BOD.score) || 0;

    // one instance -> its live numbers. `saves` on the row is the only input to
    // the DC, so nothing global can raise it.
    function exposureRow(id, row, opts) {
      opts = opts || {};
      var type = (H.typeByKey || {})[row.type] || { key: row.type, name: row.type };
      var sev = (H.severityByKey || {})[row.severity] || (H.severityByKey || {}).mild || { minutes: 60, name: "Mild", interval: "1 hour" };
      var n = Math.max(0, row.saves | 0);
      var edgeFrom = fx.edgeOn[opts.trackKey || row.type] || null;
      var noFatigueFrom = fx.noFatigue[row.type] || null;
      // Thin air: a Rebreather buys an hour before the clock starts at all. The
      // hour is one SCENE-level pool ("refreshing between scenes", per the item's
      // own entry), not an hour per exposure, so it is read from the single
      // ch.hazards.rebreatherMinutes counter rather than from this row.
      var minutesIn = Math.max(0, row.minutes | 0);
      var shieldLeft = (row.type === "thinair" && fx.thinAirMinutes > 0)
        ? Math.max(0, Math.min(fx.thinAirMinutes, hz.rebreatherMinutes | 0)) : 0;
      return {
        id: id, type: type.key, typeName: type.name, rider: type.rider || null,
        severity: sev.key || row.severity, severityName: sev.name, interval: sev.interval,
        intervalMinutes: opts.intervalMinutes || sev.minutes,
        saves: n,
        dc: baseDC + step * n,                                  // PER INSTANCE. Read row.saves, nothing else.
        nextDC: baseDC + step * (n + 1),
        minutes: minutesIn,
        clockMinutes: Math.max(0, row.clockMinutes | 0),         // since the last success; a success restarts it
        fatigue: Math.max(0, row.fatigue | 0),                   // levels THIS instance has dealt
        saveBonus: bodSave,
        edge: !!edgeFrom, edgeFrom: edgeFrom,
        noFatigue: !!noFatigueFrom, noFatigueFrom: noFatigueFrom,
        lethalDamage: (row.severity === "lethal" && type.lethalDamage) ? type.lethalDamage : null,
        shielded: shieldLeft > 0, shieldMinutesLeft: shieldLeft, shieldFrom: shieldLeft > 0 ? "Rebreather" : null,
        // thin air only: while this instance is ACTIVE, the Fatigue it dealt does
        // not come off a Long Rest, because the Long Rest is at the same altitude
        // Per-row thin-air lock is GONE. It was an attribution stored on a row
        // whose lifetime is not the attribution's lifetime; the character-scoped
        // count below replaces it. Kept as a field so the row shape is stable,
        // and filled in after the character count is resolved.
        lockedFatigue: 0,
        track: opts.trackKey || null, trackName: opts.trackName || null,
        days: opts.days != null ? opts.days : null,
        thresholdDays: opts.thresholdDays != null ? opts.thresholdDays : null,
        graceDays: opts.graceDays || 0, graceFrom: opts.graceFrom || null,
        crossed: opts.crossed != null ? opts.crossed : true
      };
    }

    /* Which hazards the player has APPLIED in the Status Changes panel. Read
       from the record, never inferred from whether a clock is non-zero: a
       deprivation track at 0 days reads identically whether it was just applied
       or never applied at all. Exposures carry no key here because an exposure
       ROW exists only when one was applied, so the row is the statement. */
    var appliedSet = (hz.applied && typeof hz.applied === "object") ? hz.applied : {};

    var exposures = [];
    var exMap = (hz.exposures && typeof hz.exposures === "object") ? hz.exposures : {};
    Object.keys(exMap).forEach(function (id) {
      var row = exMap[id];
      if (!row || typeof row !== "object") return;
      exposures.push(exposureRow(id, row));
    });

    // Deprivation: THREE independent day-scale clocks, never one. Each is its
    // own row with its own days, its own escalating DC and its own Fatigue.
    var dep = (hz.deprivation && typeof hz.deprivation === "object") ? hz.deprivation : {};
    var depRows = ((E.deprivation || {}).tracks || []).map(function (t) {
      var row = (dep[t.key] && typeof dep[t.key] === "object") ? dep[t.key] : {};
      var grace = fx.graceDays[t.key] || 0;
      var graceFrom = grace ? (H.mitigationByKey["ration-discipline"] || {}).name : null;
      var threshold = t.thresholdDays + grace;
      var days = Math.max(0, row.days | 0);
      var r = exposureRow(t.key, { type: "deprivation", severity: (E.deprivation || {}).severity || "mild",
                                   saves: row.saves, fatigue: row.fatigue, minutes: row.minutes, clockMinutes: row.clockMinutes },
        { trackKey: t.key, trackName: t.name, days: days, thresholdDays: threshold,
          graceDays: grace, graceFrom: graceFrom, crossed: days >= threshold,
          intervalMinutes: (E.deprivation || {}).intervalMinutes || 1440 });
      r.typeName = t.name;
      r.unit = t.unit;
      r.crossedText = t.crossed;
      r.statusKey = "deprivation:" + t.key;
      r.applied = appliedSet[r.statusKey] === true;
      return r;
    });

    // Vacuum and Drowning: ONE spec, two instantiations. See EN.hazards.breath.
    var B = (H && H.breath) || {};
    var breathState = (hz.breath && typeof hz.breath === "object") ? hz.breath : {};
    var seal = vacuumSeal(ch, worn);
    var breath = (B.kinds || []).map(function (k) {
      var row = (breathState[k.key] && typeof breathState[k.key] === "object") ? breathState[k.key] : {};
      var n = Math.max(0, row.saves | 0);
      var sealedOut = k.key === "vacuum" && seal.sealed;
      // A grant measured in MINUTES converts at the book's flat rate, 10 rounds to
      // the minute (EN.rules.time). Void Lung's fifteen minutes is 150 rounds and a
      // Rebreather's hour is 600, so the clock starts late rather than never. Read
      // per kind, because a Rebreather answers Drowning and not Vacuum.
      //
      // Whichever hold is LONGER wins, so a grant can never cost a character the
      // natural hold their Body score already buys them.
      var mins = fx.breathMinutes[k.key] || 0;
      var granted = mins * (((EN.rules || {}).time || {}).roundsPerMinute || 10);
      var holdRounds = Math.max(bodScore, granted);
      return {
        kind: k.key, name: k.name, condition: k.condition,
        active: !!row.active && !sealedOut,
        // Vacuum is applied through the Hazard menu; Drowning is applied as a
        // CONDITION and renders inside it, so its applied-ness is the condition's
        // presence rather than an entry in the hazard map.
        statusKey: k.key === "vacuum" ? "environmental:vacuum" : null,
        applied: k.key === "vacuum"
          ? appliedSet["environmental:vacuum"] === true
          : ((ch && ch.conditions) || []).indexOf(k.condition || "Drowning") !== -1,
        sealedOut: sealedOut, seal: seal,
        holdRounds: holdRounds,           // "rounds equal to your Body score", or a grant
        holdFromGrant: granted > bodScore,
        rounds: Math.max(0, row.rounds | 0),
        holding: Math.max(0, holdRounds - Math.max(0, row.rounds | 0)),
        saves: n,
        dc: (B.dc || 10) + (B.step || 2) * n,
        nextDC: (B.dc || 10) + (B.step || 2) * (n + 1),
        saveBonus: bodSave,
        woundsOnFail: B.woundsOnFail || 1,
        halfWounds: Math.floor((woundsMax || 0) / 2),
        riders: k.riders || [],
        everyRoundDamage: k.everyRoundDamage || null,
        ends: k.ends,
        breathMinutes: mins,
        breathFrom: mins > 0 ? (fx.breathFrom[k.key] || null) : null,
        note: EN.hazards.breathNote
          ? EN.hazards.breathNote(k.key, granted > bodScore ? { rounds: holdRounds, from: fx.breathFrom[k.key] } : null)
          : ""
      };
    });

    // Caustic
    var cz = (hz.caustic && typeof hz.caustic === "object") ? hz.caustic : {};
    var C = (H && H.caustic) || {};
    var immune = fx.immuneCaustic || null, blocked = fx.blocksCaustic || null, noLinger = fx.noCausticLinger || null;
    var stopped = immune || blocked;
    var caustic = {
      statusKey: "environmental:caustic",
      applied: appliedSet["environmental:caustic"] === true,
      inside: !!cz.inside,
      lingering: !!cz.lingering && !stopped && !noLinger,
      sceneTicks: Math.max(0, cz.sceneTicks | 0),
      insideDamage: stopped ? null : C.inside,
      lingerDamage: (stopped || noLinger) ? null : C.lingering,
      stoppedBy: stopped || null,
      lingerStoppedBy: stopped || noLinger || null,
      wash: C.wash,
      degradation: causticArmorDR(ch, worn, fx),
      degradationRule: C.gearDegradation || {}
    };

    /* The thin-air Long Rest restriction, resolved once here so the Long Rest
       and the panel cannot disagree about it. LONG RESTS ONLY.

       The attribution is CHARACTER-scoped (ch.hazards.thinAirFatigue), not
       row-scoped, and that is the whole fix for two defects that were one root
       cause pointing in opposite directions:

         It used to read `row.fatigue` off the live thin-air row. `row.fatigue`
         is only ever incremented, so an ability or a medic clearing Fatigue
         left the lock standing over Fatigue that no longer existed, and the
         next level gained from HEAT was then locked as thin-air Fatigue. The
         rules explicitly bless that clearing path, so the drift was guaranteed.

         And because the lock lived on the row, deleting the row deleted the
         lock: LEAVE then re-ENTER at the same altitude laundered locked Fatigue
         in two clicks.

       This is the "unattributable state" family the rig work already paid for:
       the row was holding an attribution that outlived what it described.

       Two clamps make it honest. The count can never exceed the Fatigue the
       character actually has, so a clear can never leave a phantom lock; and
       the lock only APPLIES while a thin-air exposure is live, because the rule
       is about a Long Rest taken at the same altitude. Descend and the Fatigue
       comes off normally; come back up and it is locked again, which is why
       LEAVE plus re-ENTER no longer launders anything. */
    var fatigueNow = (ch && ch.conditionLevels && ((ch.conditions || []).indexOf("Fatigue") !== -1))
      ? Math.max(0, ch.conditionLevels.Fatigue | 0) : 0;
    var thinAirOwed = Math.min(Math.max(0, hz.thinAirFatigue | 0), fatigueNow);
    var thinAirLive = exposures.filter(function (r) { return r.type === "thinair"; });
    var lockedFatigue = thinAirLive.length ? thinAirOwed : 0;
    var lockSources = thinAirLive.map(function (r) { return r.typeName + " (" + r.severityName + ")"; });
    if (!lockedFatigue) lockSources = [];
    // The chip on the row reports the CHARACTER's locked count, not a per-row
    // tally, so two thin-air exposures cannot each claim the same locked levels
    // and sum to more Fatigue than the character has.
    thinAirLive.forEach(function (r) { r.lockedFatigue = lockedFatigue; });

    return {
      exposures: exposures,
      deprivation: depRows,
      breath: breath,
      vacuumSeal: seal,
      caustic: caustic,
      mitigations: mit,
      fx: fx,
      // Fatigue levels a Long Rest cannot remove because the rest is taken at
      // the same altitude. Abilities that clear Fatigue ignore this entirely.
      longRestLockedFatigue: lockedFatigue,
      longRestLockSources: lockSources,
      thermalWeaveKey: ch && ch.equippedArmor ? ch.equippedArmor : null
    };
  }

  function derive(ch) {
    ch = ch || {};
    var level = clamp(ch.level || 1, 1, R.maxLevel);
    var cal = caliber(level);
    var cls = getClass(ch.class);
    var sub = getSubclass(cls, ch.subclass);
    var sp = getSpecies(ch.species);
    var lin = getLineage(ch.species, ch.lineage);
    var bg = getBackground(ch.background);
    var warnings = [];

    /* Size is derived from the height the player picked, never chosen directly.
       Characters built before heights existed still carry a stored ch.size, so
       that is honoured as a fallback when it is legal for the lineage. */
    var sizeOpts = (ch.lineage && R.lineageSize) ? R.lineageSize[ch.lineage] : null;
    var heightFt = lineageHeightFt(ch);
    // No default: a character with no height and no legal legacy pick has NO
    // Size, and the sheet says so rather than inventing one. Falling back to
    // the lineage's first allowed Size would silently hand every freshly built
    // character a real Encumbrance adjustment nobody chose.
    var size = heightFt != null ? sizeFromHeightFt(heightFt)
      : (ch.size && sizeOpts && sizeOpts.indexOf(ch.size) !== -1) ? ch.size
      : null;

    /* attributes + modifiers (installed cyberware Enhancement Bonuses fold into the score, capped at 20) */
    var scores = effectiveAttributes(ch);
    var cyberEnh = cyberEnhancements(ch);
    /* ATTUNEMENT, hoisted here because two derived values below branch on it: the Convergence
       Engine's Unattuned clause (a flat Vitality point and Resistance to Resonant) and, further
       down, the Flow block itself. Declaring it here rather than deriving it from `flow` also
       puts the dependency the right way round: having a Flow Attribute is the fact, and the
       Reservoir is a consequence of it, not the other way about.

       It is deliberately not `!!flow` inlined again. `d.flow` is the Reservoir object, and every
       other reader of it wants exactly that: .max, the Strain track, the FP label. Only this one
       wants the predicate, which is why combat.js gates Resurge, Siphon and Ward on `d.attuned`
       rather than recomputing it. Naming them apart is what lets a future non-Shaper with a Flow
       Attribute change this one line instead of triaging fourteen `if (d.flow)` sites by hand.

       Today this is exactly the Shaper class, because Shaper is the only Attuned Class the book
       lists (see the note at the flow gate below, which quotes the passages). When a non-Shaper
       can be attuned, this line is the one that changes. */
    var attuned = (ch.class === "shaper");

    var cyberFlat = cyberFlatBonuses(ch, attuned);
    var attributes = {};
    R.attributes.forEach(function (a) {
      var bonus = cyberEnh[a.key] || 0;
      var sc = Math.min(20, scores[a.key] + bonus);
      attributes[a.key] = { key: a.key, name: a.name, score: sc, mod: mod(sc), cyberBonus: bonus };
    });
    var agiMod = attributes.AGI.mod, bodMod = attributes.BOD.mod;

    /* defense, NextGen Dermal Plating uses Body instead of Agility */
    var defenseAttr = "AGI";
    var defenseBase = 10;
    var linFeats = activeLineageFeatures(ch);
    if (linFeats.indexOf("Dermal Plating") !== -1) defenseAttr = "BOD";
    var linMech = lineageMechanics(ch);
    /* unarmed strike: the chosen replacer, every increase stepped on top of it,
       and the riders that hang off the side */
    var unarmedStrike = resolveUnarmedStrike(ch);
    var defLoadout = defensiveLoadout(ch);
    var defense = defenseBase + attributes[defenseAttr].mod + (defLoadout.shieldDef || 0);
    /* Open Architecture, Calibrated Gait + Cyberlegs or Spring Joints: "The implant grants an
       additional +1 Speed beyond its normal benefits." The only one of the seven numeric
       clauses with a channel to land in; see the note beside oaSaved for why the others do
       not. Read off the generic pairing list rather than a bespoke test, so a data change to
       the combo (a third qualifying implant, say) needs no code here. */
    /* The Integration deltas that now have a channel to land in, because cyberFlatBonuses
       learned `dr` and `init` and the implants' own numbers finally exist to stack on:
         Calibrated Gait  "+1 Speed beyond its normal benefits"
         Dermal Plating   "+1 DR (stacking with its normal bonus)"
         Tuned Synapses   "Initiative bonus increases by an additional +2"
       Read off the generic pairing list, so a data change to a combo needs no code here. */
    /* NO flat Integration bonuses here any more. The 2026-08-12 manuscript sync replaced all
       three with mechanics that are not standing modifiers, so adding them to a derived total
       would double-count against the clause text the sheet now prints:
         Dermal Aegis      +2 DR against ONE attack, the first physical hit each round, and it
                           lands at damage step 3, not on the character's standing DR.
         Synaptic Reflex   mutates the Reflex Booster's own counter (max 1 -> Caliber, capped
                           at 1 per turn). Not an Initiative bonus at all.
         Springstep        a Body Save or Prone on landing. Not a Speed bonus.
       They are surfaced as clause text and as the per-Integration records below. */
    /* Flat Speed from Talents and class features, as rows so the Speed breakdown can name them
       ([{label, val}], summed into speed before the Load state like every other flat piece).
       Asphalt Rider's Upgrade: "You and any vehicle you operate gain a +2 Speed bonus." This is the
       character's half; the vehicle half (+2 spaces on the map, the Speed rating unchanged, the
       author's ruling of 24 October 2026) and the once-per-Long-Rest KEEP IT RUNNING use live on
       the Garage (inventory.js garageMapSpeed). First Responder (Stitcher, Level
       2): "Your Speed also increases by 2." */
    var classMech = classFeatureMechanics(ch);
    var speedFeatures = [];
    // the Upgrade counts only while the Talent itself is held (as Parallel Processing checks): a
    // slot turned to +2 ATTRIBUTES leaves an orphaned Upgrade record behind
    if (talentUpgradeHeld(ch, "asphalt-rider")) speedFeatures.push({ label: "Asphalt Rider (Upgrade)", val: 2 });
    /* Blitz Logic: "Your Speed increases by 2." Speed Freak: "Your Speed increases by 2", and its
       Upgrade "Your Speed increases by an additional 2 (4 total)". Freelancer's Companion; the book
       prints no armor, Load or other condition on either, so they are flat rows (author's ruling,
       28 October 2026). */
    if (talentHeld(ch, "blitz-logic")) speedFeatures.push({ label: "Blitz Logic", val: 2 });
    if (talentHeld(ch, "speed-freak")) speedFeatures.push({ label: "Speed Freak", val: 2 });
    if (talentUpgradeHeld(ch, "speed-freak")) speedFeatures.push({ label: "Speed Freak (Upgrade)", val: 2 });
    classMech.speed.forEach(function (r) { speedFeatures.push({ label: r.label, val: r.val }); });
    var speedFeatureTotal = 0;
    speedFeatures.forEach(function (r) { speedFeatureTotal += r.val; });
    // Edge on Initiative: the lineage features that grant it (Tuned Synapses, Static Premonition),
    // then each class feature that grants it
    var initEdgeSources = linMech.initEdgeSources.concat(classMech.initEdge);
    var speed = Math.max(3, 6 + agiMod) + (cyberFlat.speed || 0) + (defLoadout.speedPenalty || 0) + linMech.speed + speedFeatureTotal;

    /* encumbrance: state from the declared Loadout, on-person Load, and hauls;
       Encumbered = Speed -2, Overloaded = Speed halved (round down), dragging one body = halved
       or -2, whichever is worse. speedBase is every flat piece above, before the Load state;
       speedSteps applies the state in the book's order, and the Freelancer tab re-runs it from
       speedBase with conditions added. No floor of 1: "Speed can't fall below 0". */
    var enc = encumbranceInfo(ch, attributes, defLoadout, linFeats, size);
    var speedBase = speed;
    speed = speedSteps(speedBase, enc.speedMods).total;
    enc.speedDelta = speed - speedBase;

    /* vitality / wounds / resilience */
    var vit = R.classVitality[ch.class];
    var vitalityMax = null, resilienceDie = null;
    if (vit) {
      var perLevel = R.dieAverage(vit.die) + bodMod;
      vitalityMax = (vit.start + bodMod) + (level - 1) * Math.max(1, perLevel)
                   + (cyberFlat.vit || 0) + talentVitality(ch, level);
      vitalityMax = Math.max(1, vitalityMax);
      resilienceDie = vit.resilience;
    }
    var woundsMax = attributes.BOD.score + (cyberFlat.wounds || 0);
    // Critical Condition triggers at 50% or less of total WOUNDS (countdown pool)
    var critThreshold = Math.floor(woundsMax / 2);
    var resilienceMax = level;   // Resilience Dice count = character level

    /* Chrome Tax, Total Static from installed cyberware drives a Static Threshold,
       cutting max Resilience Dice and (for Shapers) max Reservoir by the threshold index. */
    var installed = (ch.cyberware || []).filter(function (cw) { return cw && typeof cw === "object" && typeof cw.sp === "number"; });
    var staticTotal = 0;
    // A mod slotted into a Cyberarm or Cyberleg adds no SP: the platform has
    // already paid that cost. Only a slot that really exists counts, so a
    // stale slottedIn on a character whose platform was removed or downgraded
    // falls back to paying full price rather than silently discounting.
    var slotted = platformSlotted(ch);
    installed.forEach(function (cw) { if (!slotted[cw.key]) staticTotal += cw.sp; });
    // Resonance Crown: reduces the SP of up to 4 separate OTHER pieces by 1 each
    // (minimum 1 per piece) for Threshold purposes. It cannot harmonize itself or the
    // Disruption Lattice; the Convergence Engine can't be installed beside it (the
    // Inventory refuses the pair; a legacy save holding both is still not discounted, hence
    // convergence stays in CROWN_EXEMPT below). The rulebook lets the player
    // pick which pieces benefit; taking the 4 highest-SP eligible pieces is always
    // at least as good as any other choice, so it is applied automatically.
    /* OPEN ARCHITECTURE: "its Static Point cost is reduced by 1 (minimum 0)", on every
       pairing whose clause is active. Applied per PIECE and floored at 0 rather than
       subtracted from the running total, because a 0 SP implant must not hand a refund back
       to the pool; the clause's own "(minimum 0)" is about that piece, not about the sum.
       Skipped for a piece already discounted to nothing by a platform slot, which pays no SP
       at all, so the reduction has nothing to reduce and cannot go negative. */
    var oaSaved = 0;
    /* The pieces Open Architecture took a point off, BY IDENTITY rather than by key. It has to
       be identity: openArchCombos resolves each pairing to one record (inst.filter(...)[0]) and
       oaSaved counts one saving, so marking the key would charge that single point against a
       twin of the same key which paid its own full SP a few lines above. Two Cyberoptics is an
       ordinary character, not a hand-edited one. `installed` and openArchCombos' own list both
       filter ch.cyberware, so these are the same objects and indexOf compares what it should. */
    var oaPieces = [];
    openArchCombos(ch).forEach(function (m) {
      var cw = m.piece;
      if (!cw || slotted[cw.key]) return;
      if (typeof cw.sp !== "number" || cw.sp <= 0) return;
      oaSaved += 1;
      oaPieces.push(cw);
    });
    staticTotal -= oaSaved;
    var CROWN_EXEMPT = { resonanceCrown: 1, disruption: 1, convergence: 1 };
    var crownHarmonized = [];
    if (installed.some(function (cw) { return cw.key === "resonanceCrown"; })) {
      /* EFFECTIVE SP, not the catalog figure. This filter used to read the raw stored tier SP,
         which made it disagree with the two reductions immediately above it and take a point
         off twice:
           a piece in a platform SLOT contributes nothing to staticTotal at all, so the Crown
           had nothing to reduce and reduced it anyway, and
           a piece already discounted by Open Architecture came out at 0, which breaks the
           Crown's own printed "(min 1)".
         Both errors ran the same way, pushing Total Static too low and the Chrome Tax tier too
         high in the player's favour. The Open Architecture block above already skips slotted
         pieces and says why; this is the same reasoning, applied one line later. */
      crownHarmonized = installed
        .filter(function (cw) {
          if (CROWN_EXEMPT[cw.key]) return false;
          if (slotted[cw.key]) return false;
          if (typeof cw.sp !== "number") return false;
          return (cw.sp - (oaPieces.indexOf(cw) !== -1 ? 1 : 0)) > 1;
        })
        .sort(function (a, b) { return b.sp - a.sp; })
        .slice(0, 4);
      staticTotal -= crownHarmonized.length;      // 1 SP off each, and the filter is what holds the min at 1
    }
    var CT = (EN.cyberware && EN.cyberware.thresholds) || [];
    var ctTier = null;
    for (var ci = 0; ci < CT.length; ci++) { if (staticTotal >= CT[ci].min && staticTotal <= CT[ci].max) { ctTier = CT[ci]; break; } }
    var ctIndex = ctTier ? ctTier.index : 0;
    /* "Each Threshold keeps the extra effects of the Thresholds below it: Hardwired from Threshold 2
       stays with you at 3, 4, and 5." The tier's own `effects` are its two penalty lines; every
       `extra` from Threshold 1 up to the current one is carried after them. The mechanical flags
       below (noWoundRecovery, deadBattery) already stacked by index. Hardwired itself stays a
       manual condition: this lists it, it does not apply it. */
    var ctCarried = [];
    CT.forEach(function (t) { if (t.index > 0 && t.index <= ctIndex) ctCarried = ctCarried.concat(t.extra || []); });
    var chromeTax = {
      total: staticTotal, index: ctIndex,
      name: ctTier ? ctTier.name : "Safe Capacity",
      resDiePenalty: ctIndex, fpPenalty: ctIndex,
      effects: (ctTier ? ctTier.effects : []).concat(ctCarried),
      noWoundRecovery: ctIndex >= 4, deadBattery: ctIndex >= 5
    };
    resilienceMax = Math.max(0, resilienceMax - chromeTax.resDiePenalty);

    /* saving throws, each class has a Saving Throw Focus (two attributes).
       A focused save adds Caliber on top of the attribute modifier
       (d20 + mod + Caliber). Unlike Skill Focus, no proficiency is required. */
    var saveProfKeys = classSaveFocusKeys(ch);
    /* Hardened Survivor: its Attribute's saves add Caliber "as though it were one of your class
       Saving Throw Focuses" (talentSaveAttr picks the Attribute, see the note there). */
    var hsSaveAttr = talentSaveAttr(ch, "hardened-survivor");
    if (hsSaveAttr && saveProfKeys.indexOf(hsSaveAttr) === -1) saveProfKeys.push(hsSaveAttr);
    var saves = {};
    R.attributes.forEach(function (a) {
      var proficient = saveProfKeys.indexOf(a.key) !== -1;
      var bonus = attributes[a.key].mod + (proficient ? cal : 0);
      saves[a.key] = { key: a.key, name: a.name, proficient: proficient, focus: proficient, bonus: bonus };
      if (hsSaveAttr && a.key === hsSaveAttr) saves[a.key].focusSource = "Hardened Survivor";
    });

    /* skills, background/class grants form a 'proficient' floor; stored
       proficiencies.skills are user upgrades layered on top. */
    var skillProf = (ch.proficiencies && ch.proficiencies.skills) || {};
    var granted = grantedSkills(ch);
    var focuses = activeFocusList(ch);
    var specs = specList(ch);
    var skills = R.skills.map(function (s) {
      var storedTier = skillProf[s.key] || "untrained";
      var isGranted = !!granted[s.key];
      var tierKey = storedTier;
      if (isGranted && R.profOrder.indexOf("proficient") > R.profOrder.indexOf(storedTier)) tierKey = "proficient";
      var tier = R.profTiers[tierKey] || R.profTiers.untrained;
      var attrMod = attributes[s.attr].mod;
      var skFocuses = focuses.filter(function (f) { return f.type === "skill" && f.parent === s.key; });
      var hasFocus = skFocuses.length > 0;
      var hasSpec = specs.some(function (f) { return f.type === "skill" && f.parent === s.key; });
      var total = attrMod + tier.d20;
      /* "A relevant Skill Focus adds your Caliber to the Passive Check score." A Focus is narrow
         (Systems (Access-control systems)), so `passive` is the base score and each named Focus
         is a conditional line in `passiveFocus`: the score when the check concerns that aspect.
         Focus adds Caliber (like Saving Throw Focus above), not a flat +5. */
      var passive = 10 + total + (tierKey === "untrained" ? -5 : 0);
      var passiveFocus = skFocuses.map(function (f) { return { aspect: String(f.aspect).trim(), score: passive + cal }; });
      return {
        key: s.key, name: s.name, attr: s.attr, attrName: attributes[s.attr].name,
        tier: tierKey, tierShort: tier.short, attrMod: attrMod, profBonus: tier.d20,
        total: total, passive: passive, passiveFocus: passiveFocus, untrained: tierKey === "untrained",
        granted: isGranted, storedTier: storedTier,
        focus: hasFocus, specialization: hasSpec
      };
    });

    /* class resource pool */
    var resource = null;
    if (cls && cls.resource && ch.class !== "shaper") {
      var rAttr = attrInText(cls.resource.maxFormula) || R.attrNameToKey[cls.resource.attribute] || null;
      var rMax = Math.max(1, cal + (rAttr ? attributes[rAttr].mod : 0));
      resource = {
        name: cls.resource.name, attribute: rAttr, attributeName: rAttr ? attributes[rAttr].name : "",
        max: rMax, formula: cls.resource.maxFormula, refresh: cls.resource.refresh, fuels: cls.resource.fuels
      };
    }

    /* flow (Shaper only)

       AND CLANKERS ARE NOT AN EXCEPTION, checked against Part 2 on 2026-09-16 because a handoff
       scoped the new Flow Attribute Check to "every Shaper; a Clanker whose class sets one",
       which reads as though a species could grant one. It cannot. Part 2's "Clankers and The
       Flow" says the opposite of what that phrase suggests: "A Clanker can channel the Flow if
       their Class grants access to Invocations", "Their Flow Attribute is set by their subclass
       (Mystique, Tech, Body, or Presence)", and, decisively, "If a Clanker does not have a
       Flow-using class, they interact with the
       Flow only as targets, exactly like a non-adept being." That section exists to confirm
       Clankers use the ORDINARY rules despite being inorganic: "a Clanker Flow adept runs on the
       same rules for Flow Points, Reservoir, Strain, and Breakflow as anyone else."

       So a Clanker Shaper already gets a full, correct Flow block through this gate, and a
       Clanker of any other class correctly gets none. Shaper is the only entry under Part 2's
       "Attuned Classes", and the Check's own scope line names no species at all: "Unattuned
       Freelancers and other beings without a Flow Attribute cannot attempt Flow Attribute
       Checks." Nothing here needs a species hook; do not add one.

       The wording nit that used to sit here has SHRUNK rather than vanished. "Their Flow
       Attribute is set by their class" was corrected to "subclass" in Part 2 on 2026-09-18, and
       that was the one hard mechanical statement of it. Two softer restatements still say class:
       the back half of that same bullet ("a Clanker mystic or brawler can absolutely use Mystique
       or Body if their class demands it") and the Flow Modifier callout in Common Actions ("Each
       Flow-using class is tied to one Attribute"). Both are prose rather than rules text, and
       neither disturbs the mechanic this code implements and the book states canonically under
       Flow Connection and Unattuned Classes: attunement is CLASS-level, the Attribute is
       SUBCLASS-level, which is why the line below reads ch.subclass. */
    var flow = null;
    if (attuned) {
      var flowAttrName = (sub && sub.extra && sub.extra.flowAttribute) || (sub && sub.flowAttribute) ||
                          R.shaperFlowAttrBySubclass[ch.subclass] || "Mystique";
      var fAttr = R.attrNameToKey[flowAttrName] || "MYS";
      var fMod = attributes[fAttr].mod;
      // The Icon's Parasocial Pact: add half the Mystique modifier (rounded up,
      // minimum 0) to maximum FP, on top of the Presence-based Flow Modifier.
      var pactBonus = ch.subclass === "icon" ? Math.max(0, Math.ceil(attributes.MYS.mod / 2)) : 0;
      var strainStage = strainOf(ch);   // the one Strain value (2026-10-24 rulings, item 8)
      var stInfo = (EN.flow && EN.flow.strainTrack) ? EN.flow.strainTrack[strainStage - 1] : null;
      /* Absolute Conduit ignores Ripple and Wave at every Stage (2026-10-24 rulings, item 3), so
         `conduit` is the feature itself and `strainIgnored` says the Stage held is wholly ignored
         (Stage 1 or 2). From Stage 3 up only Surge and higher apply. */
      var conduit = classFeatureUnlocked(ch, "Absolute Conduit");
      var strainIgnored = strainStage >= 1 && strainStage <= 2 && conduit;
      flow = {
        attribute: fAttr, attributeName: flowAttrName,
        max: Math.max(0, cal * 3 + fMod + pactBonus - chromeTax.fpPenalty), dc: 8 + fMod + cal,
        /* `attack` is the bare Flow Modifier (used for FP recovery on a Short Rest
           and Resurge rebound damage). `attackBonus` is Flow Modifier + Caliber,
           which is the bonus for BOTH d20 rolls a Shaper makes with the current:
           the Flow Attack, and the Flow Attribute Check added to Part 2 on
           2026-09-16 (the roll for work that is not an attack, such as stabilizing
           after Strain, ritual recovery, linking, or sustaining a field). One
           number, deliberately one field: the book prints them as one line in
           Building the Sheet, Step 15. Neither ever adds a skill tier, because
           Flow has no skill; Caliber stands in for the Proficiency Bonus. */
        attack: fMod, attackBonus: fMod + cal,
        // Strain track and the consequences it gates (see EN.flow.strainTrack).
        strainStage: strainStage,
        strainName: stInfo ? stInfo.name : "Stable",
        strainPenalty: stInfo ? stInfo.penalty : null,
        breakflowDC: 12 + strainStage,
        overdrawDie: strainStage >= 3 ? 6 : 4,     // Surge: 1d6 per FP instead of 1d4
        fpSurcharge: conduit ? 0 : (strainStage >= 2 ? 1 : 0),   // Wave: every Invocation costs +1 FP
        precisionFp: strainStage >= 3 ? 2 : 1,     // Surge: Precision Shaping costs 2 FP
        snagInvoke: conduit ? false : strainStage >= 1,          // Ripple: Snag on all Invocation rolls
        /* Absolute Conduit (Shaper, Level 9), Strain Resistance: "You completely ignore the
           mechanical penalties of Stage 1 Strain (Ripple) and Stage 2 Strain (Wave) at any Stage.
           Penalties only begin at Stage 3 (Surge)." (2026-10-24 rulings, item 3.) The Ripple Snag
           and the Wave FP are off at every Stage; at Stage 3 and up only Surge and higher apply
           (`strainFrom` is the first Stage whose effects count). Strain the Harmonist's Burden of
           the Earth transfers is treated as Overdraw Strain and "can't be ignored by the Absolute
           Conduit feature's Strain Resistance": the note says so, and the sheet cannot tell
           transferred Strain from any other. */
        absoluteConduit: conduit,
        strainFrom: conduit ? 3 : 1,
        strainIgnored: strainIgnored,
        strainIgnoredNote: (conduit && strainStage >= 1)
          ? "Burden of the Earth: Strain transferred this way is treated as if caused by Overdraw and can't be ignored by the Absolute Conduit feature's Strain Resistance."
          : null,
        inBreakflow: !!(ch.flow && ch.flow.breakflow),
        note: "Overdraw builds Strain when FP hits 0."
      };
    }

    /* #GRID hacking stats + equipped rig */
    var grid = gridStats(ch, attributes, skills, level, cal, resource);

    /* Trauma Rig, the object: universal, because anyone can buy one. The Stitcher class
       resource layers the Triage Save DC and the Scrap Rig penalties on top of it. */
    var rig = rigStats(ch);
    var triage = ch.class === "stitcher" ? triageStats(ch, attributes, rig) : null;

    /* features unlocked up to current level (class + subclass + identity) */
    var features = [];
    /* A class or subclass feature row can carry two optional data flags through to the play sheet,
       the print sheet and the PDF: `action` (the short action type the book prints, "Swift" or
       "Action", for a feature whose text does not say it the way the parsers expect) and
       `noTracker` (the text names a limit that is not a use counter, so no 1/SCENE box). `action`
       is copied only when set; `noTracker` is always a boolean. */
    function featureFlags(row, f) {
      if (f.action) row.action = f.action;
      row.noTracker = !!f.noTracker;
    }
    if (cls && cls.featuresByLevel) {
      for (var L = 1; L <= level; L++) {
        (cls.featuresByLevel[String(L)] || []).forEach(function (f) {
          var row = { level: L, name: f.name, text: f.text, source: cls.name, kind: "class" };
          featureFlags(row, f);
          features.push(row);
        });
      }
    }
    if (sub && sub.features) {
      sub.features.forEach(function (f) {
        if ((f.level || 1) <= level) {
          var row = { level: f.level || 1, name: f.name, text: f.text, source: sub.name, kind: "subclass" };
          featureFlags(row, f);
          features.push(row);
        }
      });
    }
    if (sp && sp.traits) {
      if (sp.traits.coreTrait) features.push({ level: 1, name: sp.traits.coreTrait.name, text: sp.traits.coreTrait.text, source: sp.name, kind: "species" });
      if (sp.traits.secondaryTrait) features.push({ level: 1, name: sp.traits.secondaryTrait.name, text: sp.traits.secondaryTrait.text, source: sp.name, kind: "species" });
    }
    // chosen lineage features (creation + evolution picks the player stored)
    if (lin) {
      var allLinFeats = (lin.features || []).concat(lin.evolutionFeatures || []);
      activeLineageFeatures(ch).forEach(function (fname) {
        var match = allLinFeats.find(function (x) { return x.name === fname; });
        /* `action` rides along from 2026-09-18, when the book tagged 42 species and Lineage
           Evolution features with an action type. It is a NEW field rather than a suffix on the
           name, deliberately: ch.lineageFeatures, ch.awakeningEvolution and
           universalUpgrades[].evolution all persist raw feature-name strings, and the lookup
           three lines up matches on x.name === fname and pushes ONLY on a match, so a stored
           pick that stops matching is not mislabelled, it disappears. Tagging by field costs
           nothing and risks nothing; tagging by suffix would have renamed all 42.

           THE MIGRATION NOW EXISTS, added 2026-09-19 when the book renamed two lineage
           features outright. store.js reads EN.speciesFeatureRenames from beside the species
           catalog and rewrites all three stores, so a rename is survivable where it was not the
           day before. That does not make the field choice above wrong, it makes it cheap: a
           rename is now a table row plus this paragraph, where a suffix would still be 42.

           Undefined for the features the book leaves untagged, which is what the readers fall
           back from. */
        if (match) features.push({ level: 1, name: match.name, text: match.text, action: match.action || null, source: lin.name + " (Lineage)", kind: "lineage" });
      });
    }
    /* Open Architecture's ACTIVE clauses, one entry per live pairing. Several of them have
       no number for the engine to move (the Datajack's absent port and touch-Link, the
       untraceable comms, permanently-active Threat Targeting, the once-per-Encounter device
       slave), and those are exactly the ones a player most needs in front of them at the
       table. Pushed as features so they reach the Freelancer tab, the print sheet and the
       PDF through the paths that already carry ability text, rather than being reinvented
       three times. Named for the pairing so the row says which chrome it is riding on. */
    openArchCombos(ch).forEach(function (m) {
      /* Named record, because that is what an Integration now IS. The row reads
         "Dermal Aegis" with the pairing beneath it, rather than repeating the feature's own
         name back at a player who can already see it in the list above. */
      features.push({ level: 1, name: m.combo.name || m.combo.feature,
        text: m.combo.text,
        source: "Open Architecture · " + m.combo.feature + " + " + (m.piece.base || m.piece.name),
        kind: "lineage" });
    });
    // Talents taken via Universal Upgrades, so the play sheet renders them with
    // their action type and uses (many are active/limited-use combat abilities).
    // The Level 6+ Upgrade rider only shows as active once it has been unlocked.
    var upKeys = talentUpgradeKeys(ch), offUps = switchedOffUpgrades(ch);
    activeTalents(ch).forEach(function (t) {
      var parts = splitTalentText(t.talent.text);
      var upgraded = upKeys.indexOf(t.talent.key) !== -1;
      var off = upgraded ? null : offUps.filter(function (x) { return x.talent === t.talent.key; })[0] || null;
      var text = parts.base;
      if (parts.upgrade) {
        var upLv = talentUpgradeLevel(t.talent) || 6;
        text += upgraded ? "\n\n**Upgrade (unlocked):** " + parts.upgrade
              : off ? "\n\n*Upgrade switched off: it was taken in your Level " + off.level + " slot, but it needs Level " + off.needs
                      + ". It does nothing until you reach Level " + off.needs + "; change that slot in the builder to pick again.*"
                    : "\n\n*Upgrade available at Level " + upLv + " (spend a Talent slot to unlock).*";
      }
      features.push({ level: t.level, name: t.talent.name, text: text, source: "Talent" + (upgraded ? " · Upgraded" : off ? " · Upgrade switched off" : ""), kind: "talent",
        upgradeOff: off ? { level: off.level, needs: off.needs } : null });
    });

    /* training points, spent is computed from actual purchases */
    var tpTotal = trainingPointsTotal(level);
    var tpSpent = trainingSpent(ch);

    /* validity / warnings for the builder */
    if (!cls) warnings.push("No class selected.");
    if (cls && (cls.subclasses || []).length && !sub) warnings.push("No subclass selected.");
    if (!sp) warnings.push("No species selected.");
    if (!lin) warnings.push("No lineage selected.");
    if (lin && !(ch.lineageFeatures || []).length) warnings.push("No lineage feature chosen.");
    if (!bg) warnings.push("No background selected.");
    /* A duplicate Talent slot is deliberately NOT a `warnings` entry. That list renders
       on the dossier step under the heading "INCOMPLETE:", and a record carrying one is
       not incomplete, it is complete with a wasted choice. It is surfaced on the slot
       itself in the Advance step instead, which is both honest about what it is and the
       one place the player can act on it. `duplicateTalentSlots` is exported for that. */

    return {
      level: level, caliber: cal, xp: ch.xp || 0,
      attributes: attributes,
      defense: defense, defenseAttr: defenseAttr, speed: speed,
      // Speed before any Load state or condition; feed it back through speedSteps to add more
      speedBase: speedBase,
      vitalityMax: vitalityMax, resilienceDie: resilienceDie, resilienceMax: resilienceMax,
      armorDR: defLoadout.armorDR, blockBonus: defLoadout.blockBonus,
      // cyberDR is chrome worn UNDER the skin, so it stacks with worn armor exactly as
      // Subdermal Armor's own text says it does ("Stacks with worn armor")
      naturalDR: linMech.dr, cyberDR: (cyberFlat.dr || 0),
      totalDR: (defLoadout.armorDR || 0) + (defLoadout.armorModDR || 0) + linMech.dr + (cyberFlat.dr || 0),
      lineageSpeed: linMech.speed,
      // flat Speed from Talents and class features, [{label, val}], already inside speed/speedBase
      speedFeatures: speedFeatures,
      switchedOffUpgrades: switchedOffUpgrades(ch),
      // who grants Edge on Initiative: "Tuned Synapses" (lineage), "First Responder", "Veteran Instincts"
      initEdgeSources: initEdgeSources,
      lineageSpeedFirstRound: linMech.speedFirstRound,
      resistances: damageResistances(ch, linFeats, wornArmor(ch), attuned),
      // conditional Resistances, shown as notes and never applied ([{label, types, when, text}])
      resistNotes: conditionalResistances(ch),
      lineageInit: { caliber: linMech.initCaliber ? cal : 0, edge: linMech.initEdge },
      cyberInit: (cyberFlat.init || 0),   // Reflex Booster "+2" / "+4" at Blackware
      // the player's Initiative modifier pick ("AGI" or "WIT"; null = the higher), and the two
      // features that speak to it; initiative() reads all three
      initChoice: (ch.initAttr === "AGI" || ch.initAttr === "WIT") ? ch.initAttr : null,
      initRiskAssessment: ch.subclass === "the_suit",
      initColdReader: talentHeld(ch, "cold-reader"),
      encumbrance: enc,
      // `unarmed` is the whole resolved strike: {die, flat, type, traits, note,
      // replacer, replacers, baseDie, increases, riders, reach}, with die null
      // meaning the plain 1 + Body Modifier punch. `lineageUnarmed` and
      // `unarmedOptions` are the older names for the resolved replacer and the
      // replacer list, kept so any consumer still reading them keeps working.
      unarmed: unarmedStrike, lineageUnarmed: unarmedStrike.replacer,
      unarmedOptions: unarmedStrike.replacers, unarmedBase: UNARMED_BASE,
      shieldDef: defLoadout.shieldDef, shieldBlockDie: defLoadout.shieldBlockDie,
      wardDie: defLoadout.wardDie, defenseGear: defLoadout,
      chromeTax: chromeTax, platformSlotted: platformSlotted(ch),
      grid: grid,
      // The Trauma Rig as an OBJECT, derived for every class: {rigKey, rigTier,
      // rigTierIndex, rigLabel, fromOwnedGear, ownedRigs, scrapRig, outputBonus,
      // modSlots, traits, medkitGrade, maxIntegrity, integrity, integritySpent, bricked,
      // nodeTier, price}. Always present; rigKey and rigTier are null when the character
      // owns no Rig. rigKey names the one live entry, and every surface that writes
      // damage writes it under that key.
      rig: rig,
      // Stitcher only: every d.rig field plus the class resource's own
      // {techMod, saveDC, formula, snagOnTriage, swiftBecomesAction}; null otherwise.
      triage: triage,
      // Environmental Hazards: {exposures, deprivation, breath, vacuumSeal,
      // caustic, mitigations, fx, longRestLockedFatigue, ...}. THE resolver for
      // every hazard surface; the escalating DC on each exposure row is derived
      // from that row's own save count, so there is no global counter to share.
      hazard: hazardStats(ch, attributes, saves, woundsMax),
      woundsMax: woundsMax, critThreshold: critThreshold,
      saves: saves, skills: skills,
      resource: resource, flow: flow, attuned: attuned,
      size: size, heightFt: heightFt,
      classInfo: cls, subclassInfo: sub, speciesInfo: sp, lineageInfo: lin, backgroundInfo: bg,
      features: features,
      trainingPoints: { total: tpTotal, spent: tpSpent, remaining: tpTotal - tpSpent },
      xpForNext: level < R.maxLevel ? R.xpThresholds[level + 1] : null,
      warnings: warnings
    };
  }

  // installed cyberware, normalized to objects {base, name, tier, zone, sp, side, ...};
  // tolerates legacy string entries from older saves.
  function installedCyberware(ch) {
    return ((ch && ch.cyberware) || []).map(function (cw) {
      if (typeof cw === "string") return { base: cw, name: cw, tier: null, zone: "Hardware", sp: 0, side: null, custom: true };
      return cw;
    });
  }
  function installedCyberBases(ch) { return installedCyberware(ch).map(function (cw) { return cw.base || cw.name; }); }

  /* ---- catalog prose for an owned implant -------------------------------------------
     `desc` and `effect` are CATALOG text, not player state. The purchase path used to copy
     both onto the character's own record, so a save made before a catalog correction kept
     the stale wording forever and no migration refreshed it: the six rules restored to
     cyberware.js on 2026-08-22 would never have reached anyone who already owned the piece.
     Resolved live by key instead, here, once, so the Chrome tab and the print sheet cannot
     drift apart.

     The record's own copy survives only as a FALLBACK, for a piece the catalog no longer
     lists. A retired or homebrew implant keeps whatever text it was saved with rather than
     rendering blank, which is the same rule migrate() follows when it declines to touch an
     entry whose key does not resolve. */
  function cyberDefByKey(key) {
    if (typeof key !== "string" || !key) return null;
    return ((EN.cyberware && EN.cyberware.items) || []).filter(function (i) { return i.key === key; })[0] || null;
  }
  function cyberDef(cw) {
    if (!cw || typeof cw !== "object") return null;
    return cyberDefByKey(cw.key);
  }
  /* THE TIER RIDER, and it is a rule rather than flavour. Most chrome prints one effect and
     then AMENDS it per tier: 16 of the 20 items carry a Streetware line and 17 a Blackware
     one, and they contradict the base text on purpose. Cyberoptics is the clearest case, with
     effect "Choose two modes", street "One mode only", black "Three modes".

     The Gray Market card has shown these since it was built, through a tierNote the shop
     listing composed inline. The CHROME panel and the printed record never did, so anyone not
     on the middle tier was reading a rule that was not theirs, on their own installed piece.
     Taken by (key, tier) rather than by a record object so the shop listing and the installed
     piece can ask the same question from their two different shapes, which is what stops the
     three surfaces drifting again. */
  function cyberTierNote(key, tier) {
    var d = cyberDefByKey(key);
    if (!d) return "";
    if (tier === "Streetware" && d.street) return "Streetware: " + d.street;
    if (tier === "Blackware" && d.black) return "Blackware: " + d.black;
    return "";
  }
  function cyberDesc(cw) { var d = cyberDef(cw); return (d && d.desc) || (cw && cw.desc) || ""; }
  function cyberEffect(cw) { var d = cyberDef(cw); return (d && d.effect) || (cw && cw.effect) || ""; }

  // Resource abilities (Scoundrel Gambits, Fury Overdrive Maneuvers, Hustler Leverage
  // Abilities, Operator Tactical Maneuvers, Codebreaker Signature Exploits, Stitcher Triage
  // Protocols): a structured list on the class resource, each {name, action, cost, text}.
  function resourceAbilities(ch) {
    var cls = getClass(ch && ch.class);
    var res = cls && cls.resource;
    return (res && res.abilities) || [];
  }
  // true for classes that know their whole list (Codebreaker Bandwidth, Operator Execution)
  function resourceKnowsAll(ch) {
    var cls = getClass(ch && ch.class);
    var res = cls && cls.resource;
    return !!(res && res.learn && res.learn.knowsAll);
  }
  // how many abilities the character may choose at its current level (e.g. 3 at L1, +2 at L5)
  function resourcePicksAllowed(ch) {
    var cls = getClass(ch && ch.class);
    var res = cls && cls.resource;
    var picks = res && res.learn && res.learn.picks;
    if (!picks) return 0;
    var lvl = (ch && ch.level) || 1;
    return picks.reduce(function (n, p) { return n + (lvl >= p.level ? p.count : 0); }, 0);
  }
  // abilities the character actually has on the play sheet: all of them for a knows-all class,
  // otherwise exactly the subset chosen in the Core Traits picker (empty until any are picked)
  function chosenResourceAbilities(ch) {
    var all = resourceAbilities(ch);
    if (!all.length || resourceKnowsAll(ch)) return all;
    var chosen = (ch && ch.gambits) || [];
    // a keyed ability (the Fury's Maneuvers) is stored by key; a name is still read, for a
    // record written before its migration ran or a class whose abilities carry no key
    return all.filter(function (a) { return (a.key && chosen.indexOf(a.key) !== -1) || chosen.indexOf(a.name) !== -1; });
  }
  // the id a pick is stored under: the ability's stable key where it has one, else its name
  function resourceAbilityId(a) { return (a && (a.key || a.name)) || ""; }
  // back-compat aliases: older call sites (printsheet) use the gambit-specific names
  function gambitList(ch) { return resourceAbilities(ch); }
  function gambitsAllowed(ch) { return resourcePicksAllowed(ch); }

  /* ---- Flow: cost + output of a free-shaped Invocation -------------------
     Pure calculator over a formulation (the Order of Shaping component choices)
     and a derived snapshot. Returns the live FP cost (with Strain surcharges),
     the base formulation cost, the damage formula, the resolution line, and any
     rule warnings (level gates, sustain incompatibility). The Flow tab uses this
     for both the free-shaping builder and every saved Resonant Pattern. */
  var FLOW_INTENT_FP = { damage: 0, effect: 0, hybrid: 1 };
  var FLOW_DELIVERY_FP = { directed: 0, focused: 1, wide: 2 };
  var FLOW_FORCE_FP = { base: 0, empowered: 1 };
  function flowInvocation(form, d) {
    form = form || {};
    var F = EN.flow || {};
    var R = (F.resonanceByKey && F.resonanceByKey[form.resonance]) || null;
    var flow = d.flow || {};
    var cal = d.caliber || 1;
    var fMod = (flow.attribute && d.attributes[flow.attribute]) ? d.attributes[flow.attribute].mod : 0;
    var stage = flow.strainStage || 0;
    var hasEffect = form.intent === "effect" || form.intent === "hybrid";
    var hasDamage = form.intent === "damage" || form.intent === "hybrid";
    var empowered = form.force === "empowered";
    var areaBand = form.deliveryBand === "focused" || form.deliveryBand === "wide";

    /* base (formulation) cost, ignoring current Strain */
    var breakdown = [];
    function add(label, fp) { if (fp) breakdown.push({ label: label, fp: fp }); }
    var intentFp = FLOW_INTENT_FP[form.intent] || 0; add(form.intent === "hybrid" ? "Hybrid Intent" : "Intent", intentFp);
    var delFp = FLOW_DELIVERY_FP[form.deliveryBand] || 0; add("Delivery", delFp);
    var forceFp = FLOW_FORCE_FP[form.force] || 0; add("Empowered Force", forceFp);
    var et = Math.max(0, form.extraTargets | 0); add(et + " extra target" + (et === 1 ? "" : "s"), et);
    var es = Math.max(0, form.extraSpaces | 0); add(es + " extra space" + (es === 1 ? "" : "s"), es);
    var precOn = !!form.precision && areaBand;
    if (precOn) add("Precision Shaping", 1);
    var baseFp = intentFp + delFp + forceFp + et + es + (precOn ? 1 : 0);

    /* live cost: Wave (+1 FP to everything) and Surge (Precision costs 2 FP) */
    var waveFp = (stage >= 2 && !flow.absoluteConduit) ? 1 : 0;   // Absolute Conduit ignores Wave at every Stage
    var precSurge = (precOn && stage >= 3) ? 1 : 0;
    if (waveFp) add("Strain: Wave (+1 FP)", waveFp);
    if (precSurge) add("Strain: Surge (Precision +1 FP)", precSurge);
    var fp = baseFp + waveFp + precSurge;

    /* damage: 1d6 base, +Caliber d6 when Empowered Force feeds damage */
    var damageText = null, damageDice = 0;
    if (hasDamage) {
      damageDice = 1 + (empowered ? cal : 0);
      damageText = damageDice + "d6 " + fmtMod(fMod) + (R ? " " + R.damage : "");
    }

    /* resolution line (for an unwilling target) */
    var resolution = R && R.resolution === "save" ? "save" : "attack";
    var resolutionText;
    if (resolution === "save") {
      resolutionText = "Targets save vs Flow Save DC " + flow.dc +
        (R && R.saveAttr && R.saveAttr !== "varies" ? " (" + R.saveAttr + ")" : "") +
        (R && R.armorNote ? " · " + R.armorNote : "") +
        (R && R.damageNote && hasDamage ? " · " + R.damageNote : "");
    } else {
      resolutionText = "Flow Attack " + fmtMod(flow.attackBonus) + " vs Defense";
    }

    /* the Empowered Effect carried (when Empowered Force feeds an effect) */
    var effectObj = null;
    if (empowered && hasEffect && R && form.empoweredEffect) {
      effectObj = (R.empowered || []).find(function (e) { return e.name === form.empoweredEffect; }) || null;
    }

    /* sustain compatibility + warnings */
    var warnings = [];
    if (R && R.unlock > (d.level || 1)) warnings.push(R.name + " Resonance unlocks at Level " + R.unlock + ".");
    /* A level-gated Empowered Effect (Poltergeist, Sourcerer Level 3, Hardware Harmonization): the
       book now labels it "Poltergeist (Level 3)". The builder disables the button below that level;
       this catches a saved pattern that names it anyway. */
    if (effectObj && effectObj.unlock > (d.level || 1)) warnings.push(effectObj.name + " unlocks at Level " + effectObj.unlock + " (Hardware Harmonization).");
    if (form.intent === "hybrid" && empowered && (d.level || 1) < 5) warnings.push("Layered Force (Hybrid + Empowered) requires Level 5.");
    var sustainable = true;
    if (form.duration === "sustain") {
      if (R && R.noSustain) { sustainable = false; warnings.push(R.name + " effects are always Instant and cannot be Sustained."); }
      else if (effectObj && effectObj.sustain === false) { sustainable = false; warnings.push("\"" + effectObj.name + "\" cannot be Sustained."); }
    }

    return {
      resonance: R, baseFp: baseFp, fp: fp, breakdown: breakdown,
      damageDice: damageDice, damageText: damageText,
      resolution: resolution, resolutionText: resolutionText,
      empoweredEffect: effectObj, hasEffect: hasEffect, hasDamage: hasDamage,
      sustainable: sustainable, warnings: warnings
    };
  }

  /* ---- Dice Pool mechanics ("Dicey Situations"), generic and reusable -----
     Edge: up to 10 d10s; points past 10 sharpen d10s into d12s 1 for 1, to a
     ceiling of ten d12 at 20+. Snag: up to 5 d10s; points 6-7 add d12s to a
     7-die cap; further points sharpen the d10s, to seven d12 at 12+ (13+ same).
     A die reads 6-9 as 1 success/failure and 10 or higher as 2. ---- */
  function poolShape(color, points, d10, d12) {
    var parts = [];
    if (d10) parts.push(d10 + "d10");
    if (d12) parts.push(d12 + "d12");
    return { color: color, points: points, d10: d10, d12: d12, label: parts.join(" + ") || "no dice" };
  }
  function buildEdgePool(points) {
    points = Math.max(0, Math.floor(points || 0));
    var d10, d12;
    if (points <= 10) { d10 = points; d12 = 0; }
    else if (points >= 20) { d10 = 0; d12 = 10; }
    else { d12 = points - 10; d10 = 10 - d12; }
    return poolShape("edge", points, d10, d12);
  }
  /* A flat DC read as a Risk Level, for the printed effects that give one because they also have
     an in-combat d20 version. One die per 5 points above DC 5, rounded to nearest: 10 is 1, 15 is
     2, 20 is 3, 25 is 4, 30 is 5. Clamped to 1 through 5 because that is the whole Risk Level
     table; Snag past 5 comes from conditions and circumstances, never from the printed number.

     A ladder with its OWN named tiers does not come through here. It assigns one die per tier in
     the tier's order, which is why the #GRID Concealment table carries a Scan Snag column of its
     own rather than deriving one: Ghosted is the fourth tier and takes 4, where this function
     would read its DC 21 as 3. */
  function snagFromDc(dc) {
    dc = Number(dc);
    if (!isFinite(dc)) return 0;
    return clamp(Math.round((dc - 5) / 5), 1, 5);
  }
  function buildSnagPool(points) {
    points = Math.max(0, Math.floor(points || 0));
    var d10, d12;
    if (points <= 5) { d10 = points; d12 = 0; }
    else if (points <= 7) { d10 = 5; d12 = points - 5; }
    else if (points >= 12) { d10 = 0; d12 = 7; }
    else { d12 = points - 5; d10 = 7 - d12; }
    return poolShape("snag", points, d10, d12);
  }
  /* ---- ONE STRAIN VALUE (2026-10-24 rulings, section 9 item 8) ----------------------
     ch.flow.strain is the only Strain Stage. The Flow tab's tracker writes it, the Strain
     condition on Status Changes is drawn from it (never stored in ch.conditions any more),
     and Long Rest, Downtime, Ritual Recovery and the Breakflow restorations change it.
     A save from before the merge can still carry a "Strain" entry in ch.conditions with its
     own level: strainOf reads the higher of the two, and mergeStrain folds the old entry
     into ch.flow.strain (taking the higher) and removes it. mergeStrain is idempotent and
     every Strain write runs it first, so the old entry is gone after the first write. */
  function legacyStrainLevel(ch) {
    if (!ch || (ch.conditions || []).indexOf("Strain") === -1) return 0;
    return clamp(((ch.conditionLevels || {}).Strain | 0) || 1, 1, 5);
  }
  function strainOf(ch) {
    var own = clamp(((ch && ch.flow && ch.flow.strain) | 0), 0, 5);
    return Math.max(own, legacyStrainLevel(ch));
  }
  function mergeStrain(c) {
    if (!c) return 0;
    var legacy = legacyStrainLevel(c);
    c.flow = c.flow || { current: null, strain: 0, strainPoints: 0, sustained: null, breakflow: false, patterns: [] };
    var own = clamp((c.flow.strain | 0), 0, 5);
    if ((c.conditions || []).indexOf("Strain") !== -1) {
      c.conditions = c.conditions.filter(function (n) { return n !== "Strain"; });
      if (c.conditionLevels) delete c.conditionLevels.Strain;
    }
    if (legacy > own) {
      c.flow.strain = legacy;
      // the old condition at 5 was Collapse, which is Breakflow
      if (legacy >= 5) { c.flow.breakflow = true; c.flow.sustained = null; }
    }
    return clamp((c.flow.strain | 0), 0, 5);
  }
  /* A hand set of the Stage (the Flow tab's track, the Status Changes stepper and Remove):
     Stage 5 is Collapse and turns Breakflow on; setting it below 5 by hand turns it off, as
     the Flow tab's track always has. Removing a Stage clears the partial Strain points. */
  function setStrainStage(c, n) {
    var was = mergeStrain(c);
    n = clamp(n | 0, 0, 5);
    c.flow.strain = n;
    if (n < was) c.flow.strainPoints = 0;
    if (n < 5) c.flow.breakflow = false; else { c.flow.breakflow = true; c.flow.sustained = null; }
    return n;
  }

  /* ---- WHICH COSTS A RESULT OFFERS (2026-10-24 rulings, section 9 item 1) -----------
     Every entry in Consequence by Scene Type and Social Cost Options is tagged scene-bound
     or lasting (data/resolution.js). A Costly Success offers only the scene-bound ones; a
     Mixed Result (and any other priced result) offers either. A social scene offers its
     Consequence by Scene Type row and the Social Cost Options (the book sends a social Dice
     Pool's Costly and Mixed results there). `scene` is a row key (physical, social, grid,
     flow, crafting) or a scene name; `tier` is "costly", "mixed", "failure" or "critical". */
  function sceneCosts(scene, tier) {
    var Rz = EN.resolution || {};
    var rows = Rz.consequenceByScene || [];
    var key = String(scene || "").toLowerCase();
    var row = rows.filter(function (r) {
      return r.key === key || String(r.scene).toLowerCase() === key || (key && String(r.scene).toLowerCase().indexOf(key) !== -1);
    })[0] || null;
    var costlyOnly = tier === "costly";
    function keep(c) { return !costlyOnly || c.tag === "scene-bound"; }
    var out = [];
    if (row) (row.costs || []).forEach(function (c) {
      if (keep(c)) out.push({ cost: c.cost, tag: c.tag, from: row.scene });
    });
    if (row && row.key === "social") ((Rz.social && Rz.social.costs) || []).forEach(function (c) {
      if (keep(c)) out.push({ cost: c.cost, tag: c.tag, effect: c.effect, from: "Social Cost Options" });
    });
    return { scene: row ? row.scene : null, key: row ? row.key : null, tier: tier, costlyOnly: costlyOnly,
             sceneBound: out.filter(function (c) { return c.tag === "scene-bound"; }),
             lasting: out.filter(function (c) { return c.tag === "lasting"; }),
             all: out };
  }

  function rollDicePool(pool) {
    var rolls = [], total = 0;
    function throwDie(sides) {
      var v = 1 + Math.floor(Math.random() * sides);
      var hits = v >= 10 ? 2 : v >= 6 ? 1 : 0;
      total += hits;
      rolls.push({ sides: sides, value: v, hits: hits });
    }
    for (var i = 0; i < (pool.d10 || 0); i++) throwDie(10);
    for (var j = 0; j < (pool.d12 || 0); j++) throwDie(12);
    return { pool: pool, rolls: rolls, total: total };
  }

  /* ---- d20 resolution (the in-combat roll) --------------------------------
     One d20 plus flat modifiers. Edge and Snag each want a second d20 and
     cancel 1 for 1 before rolling, so a roll is at most 2d20: net Edge keeps
     the higher die, net Snag keeps the lower, an even split rolls a single
     straight d20. The natural kept die drives crit/fumble: a Nat 20 always
     crits and a Nat 1 always fumbles, and a Specialization can widen the crit
     floor (critMin) below 20. spec = { mods:[{label,value}], edge, snag,
     critMin }; edge/snag are source COUNTS (a Shaken character zeroes edge
     upstream). Exotic effects that break the 2d20 ceiling (Lucky Break / Jinx
     third die, Press Your Luck's bonus die) layer on top of this later. */
  function rollD20(spec) {
    spec = spec || {};
    var mods = (spec.mods || []).slice();
    var net = Math.max(0, Math.floor(spec.edge || 0)) - Math.max(0, Math.floor(spec.snag || 0));
    var state = net > 0 ? "edge" : net < 0 ? "snag" : "flat";
    function d20() { return 1 + Math.floor(Math.random() * 20); }
    var dice = state === "flat" ? [d20()] : [d20(), d20()];
    // Lucky Break (a Scoundrel Gambit) is the one thing that breaks the 2d20
    // cap: roll one extra die and keep the best, even stacked on Edge.
    var lucky = !!spec.luckyBreak;
    if (lucky) dice.push(d20());
    var keptIndex = 0;
    if (lucky) { for (var i = 1; i < dice.length; i++) if (dice[i] > dice[keptIndex]) keptIndex = i; }
    else if (state === "edge") keptIndex = dice[0] >= dice[1] ? 0 : 1;
    else if (state === "snag") keptIndex = dice[0] <= dice[1] ? 0 : 1;
    var nat = dice[keptIndex];
    // critMin can widen the crit floor (e.g. 19) but never reaches the Nat 1
    // fumble; anything malformed falls back to a Nat-20-only crit.
    var critMin = (typeof spec.critMin === "number" && spec.critMin >= 2 && spec.critMin <= 20) ? Math.floor(spec.critMin) : 20;
    var crit = nat >= critMin, fumble = nat === 1;
    // Press Your Luck (The Wildcard subclass): a d6 rides the d20. A 6 forces a
    // Critical Success, a 2 to 5 adds to the total, and a 1 busts the bet into a
    // Critical Failure that eats the Moxie, unless Counting Cards keeps the
    // natural result on a bust.
    var press = null;
    if (spec.pressLuck) {
      var pd = 1 + Math.floor(Math.random() * 6);
      press = { die: pd, bust: pd === 1, bonus: 0 };
      if (pd === 6) { crit = true; fumble = false; }
      else if (pd === 1) { if (!spec.countingCards) { fumble = true; crit = false; } }
      else { press.bonus = pd; mods.push({ label: "Press Your Luck", value: pd }); }
    }
    var flat = mods.reduce(function (s, m) { return s + (Number(m && m.value) || 0); }, 0);
    return {
      dice: dice, keptIndex: keptIndex, nat: nat, state: state, net: net,
      mods: mods, flat: flat, total: nat + flat,
      crit: crit, fumble: fumble, critMin: critMin, lucky: lucky, press: press
    };
  }

  /* ---- roll-tray: compose a rollD20 spec --------------------------------
     The tray keeps the player in charge of the net advantage: a single
     Edge / None / Snag choice, rather than an itemized list of situational
     sources. This folds that choice, the flat Help bonus, and a one-off
     manual adjustment onto the sheet's auto-applied modifiers. A Shaken
     character cannot benefit from Edge from any source, so Edge is dropped. */
  function composeRollSpec(o) {
    o = o || {};
    var mods = (o.baseMods || []).slice();
    var help = Math.max(0, Math.floor(o.helpValue || 0));
    if (help) mods.push({ label: "Help", value: help });
    var manual = Math.floor(o.manual || 0);
    if (manual) mods.push({ label: "Other", value: manual });
    var edge = Math.max(0, Math.floor(o.edge || 0));
    var snag = Math.max(0, Math.floor(o.snag || 0));
    if (o.shaken) edge = 0;
    return { mods: mods, edge: edge, snag: snag, critMin: o.critMin || 20,
      luckyBreak: !!o.luckyBreak, pressLuck: !!o.pressLuck, countingCards: !!o.countingCards };
  }

  /* ---- damage roll --------------------------------------------------------
     Rolls a weapon's damage. spec = { dice, flat, crit, bonus, types }.
     dice is the weapon damage string ("1d4", "2d6", "Unarmed + 1d4", "0", "").
     flat is the on-hit attribute mod (melee/thrown; 0 for ranged). A crit
     rolls exactly what a hit rolls: the PHB gives a critical hit no extra
     damage dice, so `crit` only flags the result for the tray and the log.
     A printed crit effect that adds a die rides in `bonus`, which Oomph
     never steps. bonus is extra dice groups [{ n, sides, label }] (Cheap
     Shot, ammo riders). Returns grouped rolls + total for a breakdown
     display. */
  function parseDamageDice(s) {
    var m = String(s == null ? "" : s).match(/(\d+)\s*d\s*(\d+)/i);
    return m ? { n: parseInt(m[1], 10), sides: parseInt(m[2], 10) } : null;
  }
  function rollDamage(spec) {
    spec = spec || {};
    function die(sides) { return 1 + Math.floor(Math.random() * sides); }
    function rollN(n, sides) { var r = []; for (var i = 0; i < n; i++) r.push(die(sides)); return r; }
    var groups = [];
    var main = parseDamageDice(spec.dice);
    if (main && main.n > 0 && main.sides > 0) {
      var rolls = rollN(main.n, main.sides);
      groups.push({ label: "Weapon", n: main.n, sides: main.sides,
        rolls: rolls, subtotal: rolls.reduce(function (a, b) { return a + b; }, 0) });
    }
    (spec.bonus || []).forEach(function (b) {
      var bn = Math.max(0, Math.floor((b && b.n) || 0)), bs = Math.max(0, Math.floor((b && b.sides) || 0));
      if (!bn || !bs) return;
      var br = rollN(bn, bs);
      groups.push({ label: (b.label || (bn + "d" + bs)), n: bn, sides: bs,
        rolls: br, subtotal: br.reduce(function (a, c) { return a + c; }, 0) });
    });
    var flat = Math.floor(spec.flat || 0);
    var diceTotal = groups.reduce(function (s, g) { return s + g.subtotal; }, 0);
    return { groups: groups, flat: flat, total: diceTotal + flat, crit: !!spec.crit, types: spec.types || [] };
  }

  /* ---- payout splitter ---------------------------------------------------
     THE one splitter. It lived in inventory.js for the player's SPLIT panel and
     moved here when the GM's Payroll tab needed the same arithmetic, so the two
     can never quote a crew different shares off one payout.

     The book's default: a fixer's cut comes off the top, then the rest splits
     evenly, and the remainder is left "to argue over" rather than rounded away.
     A crew may also vote a share into a Crew Kit, and that share comes off the
     POST-FIXER remainder, which is the order the player panel has always used.
     Book check: 3000 at a 15 percent fixer for four crew is 450 to the fixer,
     637 each, and 2 over.

     Both percentages clamp to 0 to 100. Neither input was ever bounded before,
     so a typed 150 percent fixer cut produced a negative pool and negative
     shares. Clamped, the fixer can take at most the whole payout and the kit at
     most the whole remainder, so fixer plus kit never exceeds the total and no
     share can go below 0. `clamped` says a percentage was pulled back, for a
     view that wants to explain why its number differs from what was typed.
     Inside the range the arithmetic is unchanged. */
  function splitPayout(total, crew, fixerPct, kitPct) {
    total = Math.max(0, Math.floor(Number(total) || 0));
    crew = Math.max(1, Math.floor(Number(crew) || 1));
    var fRaw = Number(fixerPct) || 0, kRaw = Number(kitPct) || 0;
    var fPct = clamp(fRaw, 0, 100), kPct = clamp(kRaw, 0, 100);
    var fixer = Math.min(total, Math.floor(total * fPct / 100));
    var afterFixer = total - fixer;
    var kit = Math.min(afterFixer, Math.floor(afterFixer * kPct / 100));
    var pool = afterFixer - kit;
    var each = Math.floor(pool / crew);
    return { total: total, fixer: fixer, kit: kit, pool: pool, each: each, over: pool - each * crew,
             fixerPct: fPct, kitPct: kPct, clamped: fPct !== fRaw || kPct !== kRaw };
  }

  return {
    derive: derive, mod: mod, caliber: caliber, fmtMod: fmtMod, clamp: clamp,
    fmtFtIn: fmtFtIn, fmtPassiveFocus: fmtPassiveFocus,
    buildEdgePool: buildEdgePool, buildSnagPool: buildSnagPool, snagFromDc: snagFromDc, rollDicePool: rollDicePool, rollD20: rollD20,
    // the one Strain value and the scene cost picker (2026-10-24 rulings, items 8 and 1)
    strainOf: strainOf, mergeStrain: mergeStrain, setStrainStage: setStrainStage, sceneCosts: sceneCosts,
    composeRollSpec: composeRollSpec, rollDamage: rollDamage,
    // the one payout splitter, shared by the player's SPLIT panel and the GM's Payroll
    splitPayout: splitPayout,
    installedCyberware: installedCyberware, installedCyberBases: installedCyberBases,
    cyberDef: cyberDef, cyberDesc: cyberDesc, cyberEffect: cyberEffect, cyberTierNote: cyberTierNote, cyberEnhLabel: cyberEnhLabel,
    gambitList: gambitList,
    resourceAbilities: resourceAbilities,
    resourcePicksAllowed: resourcePicksAllowed, chosenResourceAbilities: chosenResourceAbilities, resourceAbilityId: resourceAbilityId,
    flowInvocation: flowInvocation,
    getClass: getClass, getSpecies: getSpecies, getLineage: getLineage,
    getBackground: getBackground, getSubclass: getSubclass,
    pointBuySpent: pointBuySpent,
    parseSkillGrants: parseSkillGrants, skillKeyOf: skillKeyOf,
    skillFloorTier: skillFloorTier, effectiveSkillTier: effectiveSkillTier,
    trainingBudget: trainingBudget,
    gearFloorTier: gearFloorTier, effectiveGearTier: effectiveGearTier,
    sizeFromHeightFt: sizeFromHeightFt, lineageHeightFt: lineageHeightFt,
    activeLineageFeatures: activeLineageFeatures, awakeningPick: awakeningPick, activeTalents: activeTalents, splitTalentText: splitTalentText, talentUpgradeLevel: talentUpgradeLevel, leaseLapsed: leaseLapsed, premiumOn: premiumOn, premiumBonus: premiumBonus, itemLoad: itemLoad, entryUnitLoad: entryUnitLoad, isWornEntry: isWornEntry, entryLoadNow: entryLoadNow, logDropped: logDropped, unlogDropped: unlogDropped,
    // THE resolver for which attribute a Talent raised, and the one enumeration of every
    // post-creation attribute bump. effectiveAttributes sums attrBumpSources rather than
    // walking the upgrade slots itself, so no surface can disagree about what bumped what.
    conditionImmunities: conditionImmunities, immunitiesFor: immunitiesFor,
    attackAttrOffers: attackAttrOffers, activeAttackAttr: activeAttackAttr,
    senseGrants: senseGrants,
    canonTalentKey: canonTalentKey, talentAttr: talentAttr, talentAttrOptions: talentAttrOptions,
    talentAttrPending: talentAttrPending, attrBumpSources: attrBumpSources,
    // Hardened Survivor's second pick (its save benefit when the chosen Attribute is already a Focus)
    talentSaveOptions: talentSaveOptions, talentSaveAttr: talentSaveAttr, talentSavePending: talentSavePending,
    classSaveFocusKeys: classSaveFocusKeys,
    // Talents that grant Proficiency with one gear category of the player's choice
    talentGearBucket: talentGearBucket, talentGearOptions: talentGearOptions, talentGearPick: talentGearPick,
    // subclass features that grant proficiencies; the "(your choice)" skills still to pick
    subclassGrantChoices: subclassGrantChoices, subclassGrantFeatures: subclassGrantFeatures,
    classFeatureMechanics: classFeatureMechanics, classFeatureUnlocked: classFeatureUnlocked,
    resistPick: resistPick, resistPickOptions: resistPickOptions, resistPickPending: resistPickPending,
    talentUpgradeHeld: talentUpgradeHeld, switchedOffUpgrades: switchedOffUpgrades, upgradeSwitchedOffAt: upgradeSwitchedOffAt,
    armorResistOptions: armorResistOptions, armorResistCount: armorResistCount,
    armorResistPicks: armorResistPicks, armorResistOwed: armorResistOwed,
    ablativeOptions: ablativeOptions, ablativeState: ablativeState,
    effectiveAttributes: effectiveAttributes,
    // the Universal Upgrade slots holding a Talent an earlier slot already holds, so
    // the builder can say which slot is buying nothing
    duplicateTalentSlots: duplicateTalentSlots,
    // THE resolver for how far a melee weapon reaches, character bonuses folded in.
    // Every surface that prints a reach asks this; nothing re-derives it from the
    // catalog string, which is what let three features be prose with no effect.
    weaponReach: weaponReach,
    // THE resolver for which damage die a Versatile weapon is currently using, and
    // whether the player still has the choice. Every surface that prints weapon
    // damage asks it rather than printing both dice and hoping.
    weaponGrip: weaponGrip, weaponVersatileDie: weaponVersatileDie,
    isLongShafted: isLongShafted,   // one answer for the reach talent AND the bench's Fits gate
    unarmedBasePick: UNARMED_BASE_PICK,
    isUnarmedAugmentName: isUnarmedAugmentName,   // gear that augments a punch instead of being a weapon
    stepDie: stepDie,   // the picker walks the ladder too, so each option can show what it really deals
    // OOMPH. stepDieInfo is the ladder with its accounting ({die, applied, lost, offLadder});
    // oomphFor is THE resolver for how much Oomph reaches a weapon entry, an unarmed strike or
    // an improvised weapon; scopedOomphSources lists every scoped source the character has;
    // weaponPartChoice reads a Part's install-time choice (High-Tension Assembly).
    stepDieInfo: stepDieInfo, oomphFor: oomphFor, scopedOomphSources: scopedOomphSources,
    oomphTraits: oomphTraits, weaponPartChoice: weaponPartChoice,
    // conditional Resistances shown as notes (Street Scrapper's Upgrade), also on d.resistNotes
    conditionalResistances: conditionalResistances,
    // the Damage Order's step 3 for one hit of one type: armor DR only against Standard
    // Physical Damage (and Resonant through Resonant Plating), then Resistance
    netDamage: netDamage, isStandardPhysical: isStandardPhysical, armorDRAgainst: armorDRAgainst,
    isStackableItem: isStackableItem, isStackableName: isStackableName, entryKey: entryKey, findEntry: findEntry,
    // Armor Integrity. armorState IS the resolver for a piece's current DR: every
    // surface that shows, prints or defends with a DR asks it (or reads the
    // d.armorDR / d.totalDR it feeds) rather than reading ch.armorWear itself.
    armorState: armorState, ownedArmorPieces: ownedArmorPieces, armorBaseDR: armorBaseDR,
    armorModsOn: armorModsOn,   // one answer for which Mods are on THIS suit
    // and the one WRITER: every surface that moves a piece's DR goes through this
    // inside a store.update, so the clamps and the quality edge cannot diverge
    applyArmorDamage: applyArmorDamage, grantArmorGuard: grantArmorGuard,
    // Shield Durability, the same mechanic one piece over, and now the same shape:
    // one resolver for how many boxes are left, one writer for marking and repairing
    // them. The Block row used to derive both for itself and got the answer wrong.
    shieldState: shieldState, applyShieldWear: applyShieldWear,
    isCarryGear: isCarryGear, rackLimit: rackLimit, rackState: rackState, rackTargets: rackTargets,
    itemSlots: itemSlots, slotConflicts: slotConflicts,
    // one answer to "which Open Architecture pairings are live", for the engine, the
    // builder card and the Chrome tab card, which each used to work it out separately
    openArchCombos: openArchCombos,
    catalogItem: loadCatalogItem,
    // inventory.js owns the normalized item shapes for Parts, armor Mods, vehicles and
    // vehicle Mods, and registers them here so BOTH halves of the app resolve one catalog.
    registerCatalogSource: registerCatalogSource,
    // Trauma Rig. rigStats is THE resolver: every surface that needs to know which Rig
    // is live, and how hurt it is, reads it rather than matching ch.rig against the
    // stash itself. It answers with an ENTRY key, so the answer names one specific Rig.
    rigStats: rigStats,
    rigTierRow: rigTierRow, ownedRigs: ownedRigs, ownedDecks: ownedDecks,
    // Burner Relays (29 Oct 2026)
    relayRow: relayRow, cipherByName: cipherByName, relayLoadable: relayLoadable, relayRunCap: relayRunCap,
    relayInfo: relayInfo, relayOutcome: relayOutcome, wornTraitWorn: wornTraitWorn,
    stowedInfo: stowedInfo, setInHand: setInHand,
    // the single-slot equip registry: one description of the five slots, so no view has to
    // list the field names by hand (see EQUIP_SLOTS for why that mattered)
    equipSlotFor: equipSlotFor, slotEquippedKeys: slotEquippedKeys, equipSlotLabel: equipSlotLabel,
    // initiative is THE resolver for the quantity: every surface showing an Initiative number
    // asks it, passing its own condition delta (or 0 where conditions do not apply). It is
    // deliberately NOT a field on the derived record, because a stored value would have to
    // pick one condition state and the callers want different ones.
    initiative: initiative,
    // THE Speed reducer: flat reductions first, then halvings, floor 0 (or a stated minimum).
    // derive() uses it for the Load state; the Freelancer tab adds its conditions through it.
    speedSteps: speedSteps,
    isSlotEquipped: isSlotEquipped, releaseEntry: releaseEntry, setEquipSlot: setEquipSlot,   // Trauma Rig tier lookup and the owned-entry list
    // Environmental Hazards. hazardStats is THE resolver: the Hazards panel, the
    // Long Rest and the Codex chapter all read it rather than raw storage, so
    // "which exposure is live", "does this suit hold vacuum" and "which
    // mitigation is on" have exactly one answer each.
    hazardStats: hazardStats, hazardMitigations: hazardMitigations,
    vacuumSeal: vacuumSeal, causticArmorDR: causticArmorDR, gearOnPerson: gearOnPerson,
    focusesFor: focusesFor, specFor: specFor, focusNamed: focusNamed,
    aspectMatches: aspectMatches, weaponFocus: weaponFocus, weaponSpec: weaponSpec, signatureUnlocked: signatureUnlocked, signatureStatus: signatureStatus,
    overlapGrants: overlapGrants, unresolvedOverlaps: unresolvedOverlaps,
    grantSourceMap: grantSourceMap, duplicateGrants: duplicateGrants, pendingChoices: pendingChoices,
    tp: { STEP_COST: STEP_COST, TIER_LEVEL_REQ: TIER_LEVEL_REQ, FOCUS_COST: FOCUS_COST, FOCUS_LEVEL_REQ: FOCUS_LEVEL_REQ, SPEC_COST: SPEC_COST, SPEC_LEVEL_REQ: SPEC_LEVEL_REQ }
  };
})();
