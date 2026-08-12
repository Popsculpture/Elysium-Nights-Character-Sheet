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
  // Returns { skillKey: 'proficient' } for every skill granted by background+class.
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
     Background/class grants form a free 'proficient' floor (not paid with TP). */
  var STEP_COST = { proficient: 1, expertise: 2, mastery: 2 };  // cost to step INTO a tier
  var TIER_LEVEL_REQ = { proficient: 1, expertise: 6, mastery: 10 };
  var FOCUS_COST = 1, FOCUS_LEVEL_REQ = 3;
  var SPEC_COST = 1, SPEC_LEVEL_REQ = 6;

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
    return out;
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
  function activeFocusList(ch) {
    var list = focusList(ch);
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
  // Signature Weapons: On Hit effects and area projections stay locked at any
  // proficiency tier until a Skill Focus names the specific weapon.
  function signatureUnlocked(ch, it) {
    if (!it || !it.signature) return true;
    return activeFocusList(ch).some(function (f) { return f.type === "weapons" && aspectMatches(f.aspect, it.name); });
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

  /* ---- effective attribute scores (base + Universal Upgrade bumps) ------- */
  function effectiveAttributes(ch) {
    var out = {};
    R.attributes.forEach(function (a) { out[a.key] = (ch.attributes && ch.attributes[a.key]) || 10; });
    var ups = ch.universalUpgrades || {};
    Object.keys(ups).forEach(function (lvl) {
      var u = ups[lvl];
      if (!u || u.type !== "attr") return;
      // new shape: attrs:[key,key] (+1 each; same key twice = +2). legacy: {attr, amount}
      var keys = [];
      if (u.attrs && u.attrs.length) keys = u.attrs.slice();
      else if (u.attr) { var amt = u.amount || 1; for (var n = 0; n < amt; n++) keys.push(u.attr); }
      keys.forEach(function (k) { if (out[k] != null) out[k] = clamp(out[k] + 1, 1, R.hardCapMax); });
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
  // All active lineage Additive Features: creation pick + Universal-Upgrade
  // evolution picks + the Level 4 Awakening evolution.
  function activeLineageFeatures(ch) {
    var names = (ch.lineageFeatures || []).slice();
    var ups = ch.universalUpgrades || {};
    Object.keys(ups).forEach(function (k) {
      var u = ups[k];
      if (u && u.type === "evolution" && u.evolution) names.push(u.evolution);
    });
    if (ch.awakeningEvolution) names.push(ch.awakeningEvolution);
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
    "Static Premonition":    { initCaliber: true },
    "Tuned Synapses":        { initEdge: true, speedFirstRound: 2 },
    "Synthetic Musculature": { unarmedStep: 1 },
    "Briar Strike":          { unarmed: { die: "1d6", type: "Piercing or Slashing", traits: "Light, Finesse",
                                 note: "pick the type each turn; Bleeding on a crit" } },
    "Brutal Frame":          { unarmed: { die: "1d6", type: "Bludgeoning or Slashing",
                                 note: "pick the type each strike; +1d4 and push 1 space against a Target at least one Size smaller" } },
    "Butcher Spurs":         { unarmed: { die: "1d6", type: "Slashing", traits: "Finesse",
                                 note: "once per turn on a hit, Target Speed -2 until your next turn" } },
    "Scavenger's Maw":       { unarmed: { die: "1d6", type: "Piercing", note: "bite; +1 Vitality on a hit" } },
    "Smelter's Hands":       { unarmedRider: { damage: "1d4 Fire", when: "while your hands are lit" } },
    "Envenomed Thorns":      { unarmedRider: { damage: "1d4 Toxic", when: "while active", note: "the Target then makes a Body Save" } },
    // "Your unarmed strikes AND melee weapons gain an additional 1 space of reach."
    // Both halves are stated, because both are real: the weapon half used to be prose
    // with no engine path, so an Arboreal's Longsword read the same reach as anyone's.
    "Canopy Reach":          { unarmedReach: 1, meleeReach: 1 }
  };
  function lineageMechanics(ch) {
    var out = { dr: 0, speed: 0, speedFirstRound: 0, initCaliber: false, initEdge: false };
    activeLineageFeatures(ch).forEach(function (fn) {
      var m = LINEAGE_MECH[fn]; if (!m) return;
      if (m.dr) out.dr += m.dr;
      if (m.speed) out.speed += m.speed;
      if (m.speedFirstRound) out.speedFirstRound += m.speedFirstRound;   // conditional: first round of combat only
      if (m.initCaliber) out.initCaliber = true;
      if (m.initEdge) out.initEdge = true;
      // The unarmed entries are NOT folded here: a replacer is a player choice,
      // a step is counted against the ladder, and a rider stands apart from both.
      // The unarmed-strike helpers below collect each kind on its own terms.
    });
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
       2. INCREASERS step the resolved die up 1d4 -> 1d6 -> 1d8 -> 1d10 -> 1d12.
          They stack, and nothing caps how many apply. They land on whichever
          replacer was chosen. On a strike with no die the first increase grants
          1d4 and each further one steps again.
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
  // The printed ladder. It ends at 1d12, so a die already there saturates rather
  // than climbing; the COUNT of increases is never capped.
  var DIE_STEP = { "1d4": "1d6", "1d6": "1d8", "1d8": "1d10", "1d10": "1d12" };
  // the rung the first increase grants a strike that has no die whatsoever
  var DIE_FIRST = "1d4";
  function stepDie(die, steps) {
    var out = die;
    for (var i = 0; i < steps; i++) out = out ? (DIE_STEP[out] || out) : DIE_FIRST;
    return out;
  }
  // Installed chrome that REPLACES the unarmed die, keyed by cyberware key then
  // by tier. Source values per app/data/cyberware.js.
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
  // Talents that STEP the unarmed die, keyed by talent key. Street Scrapper
  // reads like a die-setter in print ("your unarmed strikes deal 1d4") but the
  // rule files it as an increase: one step, plus a second once the Level 6+
  // Upgrade has been unlocked with a Universal Upgrade slot. Source values per
  // app/data/talents.js.
  var TALENT_UNARMED_STEP = {
    "street-scrapper": { steps: 1, upgradeSteps: 1,
      note: "Swift Action to Grapple after you hit with it" }
  };
  // Talents that hang extra dice off the strike without touching its die.
  var TALENT_UNARMED_RIDER = {
    "cybernetic-surge": { damage: "1d6", when: "while your Surge is up" }
  };
  // Gear that augments the strike, but only while it is actually on your hands.
  // Knuckles step the die (so a strike with no die gets 1d4) and say in as many
  // words that they stack; Shock Gloves add their own die alongside whatever you
  // were already dealing. Source values per app/data/gear_melee.js.
  var GEAR_UNARMED_STEP = { "Knuckles": { steps: 1, note: "stacks with every other increase" } };
  var GEAR_UNARMED_RIDER = { "Shock Gloves": { damage: "1d4 Electric" } };
  /* An unarmed AUGMENT is not a weapon with a die of its own. Both pieces carry a
     `damage` string in the catalog so the stash row has something to print, but
     that number is what the augment CONTRIBUTES to a punch, never a die you roll
     in place of one. Anything scanning equipped gear for "the melee weapon I am
     holding" has to skip them, or it reads 1d4 off a pair of Knuckles and hands
     back a smaller die than the bare fist it is strapped to. Exported because the
     Parry row and the Defensive Impulse tray both do exactly that scan. */
  function isUnarmedAugmentName(name) {
    return Object.prototype.hasOwnProperty.call(GEAR_UNARMED_STEP, name) ||
           Object.prototype.hasOwnProperty.call(GEAR_UNARMED_RIDER, name);
  }
  /* Applied Bonuses that change the unarmed strike. The Ripper Hot-Wire
     "Pneumatic Bypass" is an increase a Stitcher hangs on somebody ELSE's
     chrome. The record used to carry no field for a Hot-Wire an ally installed
     on you, so this was a comment and nothing else; the Status Changes panel
     supplies that missing state, and the player toggling it is the GM saying it
     is live. It steps the die rather than setting it: a Freelancer already
     punching for 1d8 does not drop to 1d6 because an ally tuned their servos.
     Keyed on the EN.statusChanges option key, which is what gets persisted. */
  var BONUS_UNARMED_STEP = [
    { key: "bonus:pneumatic-bypass", label: "Pneumatic Bypass", steps: 1,
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
  // Every effect currently available to the character that REPLACES the unarmed
  // die, as [{source, pick, label, kind, die, type, traits, note}].
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
  // Every effect stepping the die up, as {count, sources}. The sources stay
  // itemised so the sheet can say WHY the die reads 1d10 instead of just showing
  // a number the player has to take on faith.
  function unarmedIncreases(ch) {
    var sources = [], linFeats = activeLineageFeatures(ch);
    // Open Architecture pairing: with Synthetic Musculature and an installed
    // Reinforced Skeleton "the Engineered Baseline effect ends" and the implant's
    // die goes up one size in its place. That step IS Synthetic Musculature's,
    // now that the feature is an increase, so the pairing relabels the step
    // rather than adding a second one: the clause prints 1d8 at Brandware and
    // 1d10 at Blackware, exactly one rung above the implant's own die. The
    // Encumbrance Threshold and Size-for-grappling halves are retained, and they
    // were never on this path in the first place.
    var integrated = linFeats.indexOf("Open Architecture") !== -1 &&
      linFeats.indexOf("Synthetic Musculature") !== -1 &&
      installedCyberware(ch).some(function (cw) { return cw && cw.key === "skeleton" && CYBER_UNARMED[cw.key]; });
    linFeats.forEach(function (fn) {
      var m = LINEAGE_MECH[fn];
      if (!m || !m.unarmedStep) return;
      sources.push({ label: fn, kind: "lineage", steps: m.unarmedStep,
        note: (fn === "Synthetic Musculature" && integrated)
          ? "Open Architecture: the step lands on the Reinforced Skeleton's die" : null });
    });
    var upKeys = talentUpgradeKeys(ch);
    activeTalents(ch).forEach(function (t) {
      var spec = TALENT_UNARMED_STEP[t.talent.key];
      if (!spec) return;
      sources.push({ label: t.talent.name, kind: "talent", steps: spec.steps, note: spec.note || null });
      if (spec.upgradeSteps && upKeys.indexOf(t.talent.key) !== -1) {
        sources.push({ label: t.talent.name + " Upgrade", kind: "talent", steps: spec.upgradeSteps, note: "Level 6+" });
      }
    });
    Object.keys(GEAR_UNARMED_STEP).forEach(function (nm) {
      if (!unarmedGearOnHands(ch, nm)) return;
      var spec = GEAR_UNARMED_STEP[nm];
      sources.push({ label: nm, kind: "gear", steps: spec.steps, note: spec.note || null });
    });
    // Applied Bonuses. This is the path the Pneumatic Bypass comment below used
    // to say did not exist. It is a Ripper Hot-Wire a Stitcher installs on an
    // ALLY, so nothing on the recipient's record can imply it; the player
    // declares it in the Status Changes panel and it lands here as one step,
    // exactly as the old comment said it should whenever the GM says it is live.
    BONUS_UNARMED_STEP.forEach(function (spec) {
      if (!bonusApplied(ch, spec.key)) return;
      sources.push({ label: spec.label, kind: "bonus", steps: spec.steps, note: spec.note || null });
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
                  ch.weaponParts is keyed by weapon NAME, so it applies to that TYPE.
                  Since 2026-08-12 the part itself only FITS a long-shafted weapon,
                  so this and the talent below now gate on the same question.
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
  function weaponPartsOn(ch, item) {
    var lo = ((ch && ch.weaponParts) || {})[item && item.name] || {};
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
  function weaponReach(ch, item) {
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
    weaponPartsOn(ch, item).forEach(function (p) {
      if (!p || !p.reachBonus) return;
      pts += p.reachBonus;
      out.sources.push({ label: p.name, kind: "part", spaces: p.reachBonus });
    });
    // the talent, on long-shafted weapons only, and never on Reach alone
    if (out.shafted && talentUpgradeKeys(ch).indexOf("staff-spear-master") !== -1) {
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
     rather than silently removing a toggle the player used yesterday. */
  function weaponVersatileDie(item) {
    var traits = (item && item.traits) || [];
    for (var i = 0; i < traits.length; i++) {
      var m = String(traits[i]).match(/^Versatile\s*\((\d+d\d+)\)$/i);
      if (m) return m[1];
    }
    return null;
  }
  function weaponGrip(ch, item) {
    var traits = (item && item.traits) || [];
    var out = {
      versatile: weaponVersatileDie(item),
      baseDice: (String((item && item.damage) || "").match(/^\s*(\d+d\d+)/) || [])[1] || null,
      twoHandedTrait: traits.indexOf("Two-Handed") !== -1,
      forcedBy: null, twoHanded: false, canToggle: false, dice: null, why: ""
    };
    if (out.twoHandedTrait) out.forcedBy = "the Two-Handed trait";
    weaponPartsOn(ch, item).forEach(function (p) {
      if (p && p.grantsTwoHanded && !out.twoHandedTrait) out.forcedBy = p.name;
    });
    if (out.forcedBy) {
      out.twoHanded = true;
      out.canToggle = false;
    } else if (out.versatile) {
      out.twoHanded = (((ch && ch.weaponGrip) || {})[item && item.name] === "two");
      out.canToggle = true;
    }
    out.dice = (out.twoHanded && out.versatile) ? out.versatile : out.baseDice;
    if (out.versatile && out.forcedBy) {
      out.why = "Held in two hands because of " + out.forcedBy + ", so it deals its Versatile "
        + out.versatile + " and its one-handed " + out.baseDice + " is out of reach.";
    } else if (out.versatile) {
      out.why = out.twoHanded ? "Held in two hands: " + out.versatile + "."
                              : "Held in one hand: " + out.baseDice + ". Two hands deals " + out.versatile + ".";
    } else if (out.forcedBy) {
      out.why = "Held in two hands because of " + out.forcedBy + ".";
    }
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
  // The whole strike: the chosen replacer resolved FIRST, then every increase
  // applied on top of it. `die` null is the bare flat-1 punch.
  function resolveUnarmedStrike(ch) {
    var replacers = unarmedReplacers(ch);
    var replacer = resolveUnarmed(ch, replacers);
    var inc = unarmedIncreases(ch);
    var baseDie = replacer ? replacer.die : UNARMED_BASE.die;
    var die = stepDie(baseDie, inc.count);
    return {
      die: die,
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
  function activeTalents(ch) {
    var ups = (ch && ch.universalUpgrades) || {}, out = [], seen = Object.create(null);
    Object.keys(ups)
      .sort(function (a, b) { return (Number(a) || 0) - (Number(b) || 0); })
      .forEach(function (lvl) {
        var u = ups[lvl];
        if (!u || u.type !== "talent" || !u.talent) return;
        var t = (EN.talents || []).find(function (x) { return x.key === u.talent || x.name === u.talent; });
        if (!t || seen[t.key]) return;
        seen[t.key] = 1;
        out.push({ level: Number(lvl) || 1, talent: t });
      });
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
        // Canonicalize exactly the way activeTalents does, or the two disagree about
        // what a duplicate is. A record can name a Talent by its KEY or by its display
        // name (activeTalents accepts either), so "Street Scrapper" and
        // "street-scrapper" in two slots is one Talent twice and has to read as one.
        // An unresolvable key is skipped: that slot is wasted too, but for a different
        // reason, and this warning would name a Talent nobody can look up.
        var t = (EN.talents || []).find(function (x) { return x.key === u.talent || x.name === u.talent; });
        if (!t) return;
        if (seen[t.key]) dupes.push({ level: Number(lvl) || 1, talent: t.key, name: t.name, firstAt: seen[t.key] });
        else seen[t.key] = Number(lvl) || 1;
      });
    return dupes;
  }
  // Talent keys whose Level 6+ Upgrade has been unlocked via a Universal Upgrade slot.
  function talentUpgradeKeys(ch) {
    var ups = (ch && ch.universalUpgrades) || {}, out = [];
    Object.keys(ups).forEach(function (k) { var u = ups[k]; if (u && u.type === "talentUpgrade" && u.talent) out.push(u.talent); });
    return out;
  }
  // Split a Talent's text into its base body and its "Upgrade (Level 6+)" rider.
  function splitTalentText(text) {
    var idx = (text || "").indexOf("**Upgrade");
    if (idx === -1) return { base: text || "", upgrade: null };
    return { base: text.slice(0, idx).trim(), upgrade: text.slice(idx).replace(/^\*\*Upgrade[^*]*\*\*\s*/, "").trim() };
  }

  // Flat DR granted by installed Armor Mods. They do not stack with each other:
  // the highest applies (part3.txt:3567). Lapsed armor carries no mods.
  function armorModDR(ch, armor, armorLapsed) {
    if (!armor || armorLapsed) return 0;
    var mods = ((ch && ch.armorMods) || {})[armor.name] || [];
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
      var amt = cw.tier === "Streetware" ? 0 : cw.tier === "Blackware" ? base * 2 : base;
      // Same-attribute Enhancement Bonuses do not stack; the highest one applies.
      if (key && amt) out[key] = Math.max(out[key] || 0, amt);
    });
    return out;
  }
  // flat sheet bonuses (speed / wounds) summed from installed pieces' tier `bonus` data
  function cyberFlatBonuses(ch) {
    var out = { speed: 0, wounds: 0 };
    var items = (EN.cyberware && EN.cyberware.items) || [];
    ((ch && ch.cyberware) || []).forEach(function (cw) {
      if (!cw || typeof cw !== "object") return;
      var def = items.find(function (i) { return i.key === cw.key; });
      var tier = def && (def.tiers || []).find(function (t) { return t.tier === cw.tier; });
      var b = tier && tier.bonus;
      if (!b) return;
      if (b.speed) out.speed += b.speed;
      if (b.wounds) out.wounds += b.wounds;
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
  function isStackableItem(it) {
    if (!it) return true;                                  // unknown/custom items: legacy pooled behavior
    if (it.legality === "As weapon") return true;           // ammo & munitions, fungible by the box
    if (it.bucket === "consumables") return true;
    if (it.group === "Resonance Tonics") return true;       // bucket "flow", but drunk once and gone
    return false;
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
  function armorBaseDR(it) { return (it && typeof it.dr === "number" && it.dr > 0) ? Math.floor(it.dr) : 0; }
  /* Every per-entry map in this app is keyed on a string out of a save file, and the
     maps are built null-prototype for that reason. This asks the question the OTHER
     way round, so a map that is somehow plain (a record mid-flight, a caller handing
     in a literal) still cannot answer for a key it does not hold: an entry whose id
     is "toString" or "constructor" used to read as already guarded and then absorb
     every point of DR forever, because spending the guard is a delete on a property
     that was never there. Null-prototype at the creation sites stops the map being
     wrong; this stops the READ being wrong whatever the map is. */
  function ownVal(map, key) { return (map && key != null && Object.prototype.hasOwnProperty.call(map, key)) ? map[key] : undefined; }
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
    // ignores it), but training isn't modeled, so we leave Powered Speed to the player.
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
      armorDR: armor ? (armorLapsed ? Math.min(armor.lapsedDR || 0, armorSt.current) : armorSt.current) : 0,
      // the whole armor-integrity record for the worn suit, so no surface has to
      // reach into ch.armorWear to find out what a piece is missing
      armorBaseDR: armorSt.base,
      armorDRLost: armorSt.lost,
      armorBreached: armorSt.breached,
      armorGuard: armorSt.guard,
      armorState: armorSt,
      armorKey: armorKey || null,
      shieldKey: shieldKey || null,
      armorModDR: armorModDR(ch, armor, armorLapsed),
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
     Load is abstract weight/bulk. Threshold = 6 + Body modifier (min 3), plus
     +2 per "step" from gear (Load-Bearing OR Load Distributor, non-stacking;
     Powered frames two steps) and Size-larger effects. The declared Loadout
     tier is DERIVED from carried Load against the threshold bands. Hauls
     (ch.haul) bypass the budget and set the state directly. */
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
    return null;
  }
  function itemLoad(name, opts) {
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
      case "carry": return 0;   // Carry Gear never counts against your own Load Budget
      case "flow": return /tonic|draught|philter|salve|vial|dose/i.test(it.name) ? 0 : 1;
      case "rigs": return 2;
      case "devices": return /drone|mule|case|rack/i.test(it.name) ? 2 : 1;
    }
    return 1;
  }
  // on-person = equipped, or carry status "carried" / "worn" / "racked"
  // (Racked = stowed in a worn piece of Carry Gear, still on your person).
  // Takes the actual equipment entry (not just its name) since carry/equip state
  // is keyed by entryKey (an id for individually-tracked gear, else the name).
  function onPerson(ch, e) {
    var key = entryKey(e);
    if (!key) return false;
    if ((ch.equippedWeapons || []).indexOf(key) !== -1) return true;
    if (ch.equippedArmor === key || ch.equippedShield === key || ch.equippedFocus === key) return true;
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
    if (gearIt.rackFits === "melee") return it.group === "Simple" || it.group === "Martial";
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
    var hasLD = !!armor && !lapsed && (((ch.armorMods || {})[armor.name]) || []).indexOf("load-distributor") !== -1;
    if (hasLB || hasLD) steps.push({ label: (hasLB ? "Load-Bearing" : "Load Distributor") + " (" + armor.name + ")", value: 2 });
    // Powered frames: two steps while powered (training left to the table; a lapsed lease grants nothing)
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
    // single slot gets the break once, not once per unit. Worn armor gets its
    // own separate break (itemLoad's { worn } option, -2 min 0): it counts in
    // full whenever carried, packed, or looted, since supporting its own
    // weight is what "worn" means for a suit of armor.
    var racks = rackState(ch);
    (ch.equipment || []).forEach(function (e) {
      if (!(e.qty > 0) || !onPerson(ch, e)) return;
      var l = itemLoad(e.name, { worn: ch.equippedArmor === entryKey(e) });
      var rackedGear = racks.byItem[entryKey(e)] || null;
      var total = l * e.qty;
      if (rackedGear) total = Math.max(0, total - 1);
      if (total > 0 || rackedGear) {
        current += total;
        items.push({ name: e.name, load: l, qty: e.qty, total: total, rackedIn: rackedGear ? rackedGear.name : null });
      }
    });
    // "When a job starts, each Freelancer declares one Loadout... If nobody
    // declares, assume Standard." The declared tier sets the Load Budget; it is not
    // inferred from what you happen to be carrying.
    var tier = (ch.loadout === "light" || ch.loadout === "heavy") ? ch.loadout : "standard";
    var budget = bands[tier];
    var haul = (ch.haul === "lift" || ch.haul === "drag") ? ch.haul : "none";
    // Encumbered: "carrying more Load than your Load Budget, or hauling something
    // that is clearly heavy but still plausible." Overloaded is defined by the haul
    // ("something that clearly belongs on a dolly, cart, vehicle, forklift, or
    // exoframe"), not by a numeric band.
    var state = "unencumbered";
    if (current > budget) state = "encumbered";
    if (tier === "heavy") state = "encumbered";           // a Heavy loadout is Encumbered for the run
    if (haul === "lift") state = (state === "unencumbered") ? "encumbered" : "overloaded";
    if (haul === "drag") state = "overloaded";
    return { base: base, size: size || null,
             steps: steps, threshold: threshold, bands: bands, tier: tier, budget: budget,
             current: current, items: items, haul: haul, state: state };
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
      var directlyEquipped = ch.equippedArmor === key || ch.equippedShield === key || ch.equippedFocus === key;
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
    var isCodebreaker = ch.class === "codebreaker";
    // A Sourcerer tethers through sprites rather than a deck, and counts as a Power User.
    var isSourcerer = ch.class === "shaper" && ch.subclass === "sourcerer";
    // SysAdmin (Root Access) at L9 removes the Link cap for Codebreakers
    var unlimitedLinks = isCodebreaker && level >= 9;
    var g = (ch && ch.grid) || {};
    var deck = null, deviceBonus = 0, deckBaseIntegrity = 0, modSlots = 0, deckTraits = [], maxComplexity = null;
    if (g.deckType === "smartdeck") {
      deck = (G.smartdecks || []).find(function (t) { return t.tier === g.deckTier; });
      if (deck) {
        deviceBonus = deck.deviceBonus; deckBaseIntegrity = deck.integrity; modSlots = deck.modSlots; maxComplexity = Math.min(5, deck.t + 1);
        deckTraits = (G.smartdecks || []).filter(function (x) { return x.t <= deck.t; }).map(function (x) { return x.trait; });
      }
    } else if (g.deckType === "buddy") {
      deck = (G.buddies || []).find(function (t) { return t.tier === g.deckTier; });
      if (deck) { deckBaseIntegrity = deck.integrity; }   // buddies have no mod slots → mods never apply
    }
    // mods apply only up to the deck's mod-slot capacity (0 for buddies / no rig).
    // This also drops mods left stranded after a deck downgrade, and is safe against stale/imported data.
    var modKeys = g.deckMods || [], modIntegrity = 0, modLinks = 0, hasRedline = false, usedSlots = 0;
    modKeys.forEach(function (k) {
      var m = (G.mods || []).find(function (x) { return x.key === k; });
      if (!m || usedSlots + m.slots > modSlots) return;
      usedSlots += m.slots;
      if (m.bonus && m.bonus.integrity) modIntegrity += m.bonus.integrity;
      if (m.bonus && m.bonus.links) modLinks += m.bonus.links;
      if (k === "redline") hasRedline = true;
    });
    var deckMaxIntegrity = deck ? deckBaseIntegrity + modIntegrity : 0;
    var isSmart = g.deckType === "smartdeck" && !!deck;
    var isBuddy = g.deckType === "buddy" && !!deck;
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
    var maxLinks = unlimitedLinks ? null : baseMaxLinks + (isCodebreaker ? modLinks : 0);
    return {
      isCodebreaker: isCodebreaker, isSourcerer: isSourcerer,
      userType: (isCodebreaker || isSourcerer) ? "Power User" : "Standard User",
      techMod: techMod, systemsProf: sysProf,
      cipherAttackBonus: cipherAttackBonus, cipherSaveDC: cipherSaveDC, passiveSystems: passiveSystems,
      effectiveAttack: effectiveAttack, effectiveSaveDC: effectiveSaveDC,
      quickHackBonus: isSmart ? cipherAttackBonus + deviceBonus : null,
      maxLinks: maxLinks, unlimitedLinks: unlimitedLinks, modLinks: isCodebreaker ? modLinks : 0,
      bandwidthMax: (isCodebreaker && resource && resource.name === "Bandwidth") ? resource.max : null,
      stabilityDcBase: stabilityDcBase, stabilityDcMod: stabilityDcMod,
      stabilityLastDamage: stabilityLastDamage, stabilityDcFromDamage: stabilityDcFromDamage, stabilityDcLive: stabilityDcLive,
      deck: deck ? { type: g.deckType, tier: deck.tier, t: deck.t, deviceBonus: deviceBonus, maxIntegrity: deckMaxIntegrity,
                     modSlots: modSlots, traits: deckTraits, maxComplexity: maxComplexity,
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
    var recordedKey = (!scrap && typeof r.key === "string") ? r.key : null;
    var recorded = recordedKey ? (owned.find(function (o) { return o.key === recordedKey; }) || null) : null;
    var entry = scrap ? null : (recorded || owned[0] || null);
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
      // true when the Rig came from the owned-gear fallback rather than a recorded pick
      fromOwnedGear: !!(entry && !recorded),
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
     they are wearing? ch.armorMods is {armorName: [modKey]}, so a mod on a
     spare suit in the stash is possessed but inactive, which is exactly the
     greyed-out state the panel wants to show. */
  function armorModOwned(ch, modKey) {
    var am = (ch && ch.armorMods) || {};
    return Object.keys(am).some(function (n) {
      return Array.isArray(am[n]) && am[n].indexOf(modKey) !== -1;
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
    var fitted = (item && ((ch && ch.armorMods) || {})[item.name]) || [];
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
               noCausticLinger: false, immuneCaustic: false, thinAirMinutes: 0, breathMinutes: 0 };

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
      if (e.breathMinutes) fx.breathMinutes = Math.max(fx.breathMinutes, e.breathMinutes);
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
       function never received fx, which is exactly why it could not know. */
    var blockedBy = (fx && (fx.immuneCaustic || fx.blocksCaustic)) || null;
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
        holdRounds: bodScore,                                    // "rounds equal to your Body score"
        rounds: Math.max(0, row.rounds | 0),
        holding: Math.max(0, bodScore - Math.max(0, row.rounds | 0)),
        saves: n,
        dc: (B.dc || 10) + (B.step || 2) * n,
        nextDC: (B.dc || 10) + (B.step || 2) * (n + 1),
        saveBonus: bodSave,
        woundsOnFail: B.woundsOnFail || 1,
        halfWounds: Math.floor((woundsMax || 0) / 2),
        riders: k.riders || [],
        everyRoundDamage: k.everyRoundDamage || null,
        ends: k.ends,
        // Void Lung measures held breath in MINUTES, which outlasts any scene,
        // so the save clock never starts inside one. No minutes-to-rounds
        // conversion is attempted: nothing in EN states how long a round is.
        breathMinutes: fx.breathMinutes || 0,
        clockStarts: !(fx.breathMinutes > 0),
        breathFrom: fx.breathMinutes > 0 ? (H.mitigationByKey["void-lung"] || {}).name : null,
        note: EN.hazards.breathNote ? EN.hazards.breathNote(k.key) : ""
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
    var cyberFlat = cyberFlatBonuses(ch);
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
    var speed = Math.max(3, 6 + agiMod) + (cyberFlat.speed || 0) + (defLoadout.speedPenalty || 0) + linMech.speed;

    /* encumbrance: state from the declared Loadout, on-person Load, and hauls;
       Encumbered = Speed -2, Overloaded = Speed halved (round down, min 1) */
    var enc = encumbranceInfo(ch, attributes, defLoadout, linFeats, size);
    enc.speedDelta = enc.state === "encumbered" ? -2
                   : enc.state === "overloaded" ? (Math.floor(speed / 2) - speed) : 0;
    if (enc.speedDelta) speed = Math.max(1, speed + enc.speedDelta);

    /* vitality / wounds / resilience */
    var vit = R.classVitality[ch.class];
    var vitalityMax = null, resilienceDie = null;
    if (vit) {
      var perLevel = R.dieAverage(vit.die) + bodMod;
      vitalityMax = (vit.start + bodMod) + (level - 1) * Math.max(1, perLevel);
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
    // (minimum 1 per piece) for Threshold purposes. It cannot harmonize itself, the
    // Disruption Lattice, or the Convergence Engine. The rulebook lets the player
    // pick which pieces benefit; taking the 4 highest-SP eligible pieces is always
    // at least as good as any other choice, so it is applied automatically.
    var CROWN_EXEMPT = { resonanceCrown: 1, disruption: 1, convergence: 1 };
    var crownHarmonized = [];
    if (installed.some(function (cw) { return cw.key === "resonanceCrown"; })) {
      crownHarmonized = installed
        .filter(function (cw) { return !CROWN_EXEMPT[cw.key] && cw.sp > 1; })
        .sort(function (a, b) { return b.sp - a.sp; })
        .slice(0, 4);
      staticTotal -= crownHarmonized.length;      // 1 SP off each, min 1 guaranteed by the sp > 1 filter
    }
    var CT = (EN.cyberware && EN.cyberware.thresholds) || [];
    var ctTier = null;
    for (var ci = 0; ci < CT.length; ci++) { if (staticTotal >= CT[ci].min && staticTotal <= CT[ci].max) { ctTier = CT[ci]; break; } }
    var ctIndex = ctTier ? ctTier.index : 0;
    var chromeTax = {
      total: staticTotal, index: ctIndex,
      name: ctTier ? ctTier.name : "Safe Capacity",
      resDiePenalty: ctIndex, fpPenalty: ctIndex,
      effects: ctTier ? ctTier.effects : [],
      noWoundRecovery: ctIndex >= 4, deadBattery: ctIndex >= 5
    };
    resilienceMax = Math.max(0, resilienceMax - chromeTax.resDiePenalty);

    /* saving throws, each class has a Saving Throw Focus (two attributes).
       A focused save adds Caliber on top of the attribute modifier
       (d20 + mod + Caliber). Unlike Skill Focus, no proficiency is required. */
    var saveProfKeys = cls ? parseAttrKeys(cls.saveFocus || (cls.startingProficiencies && cls.startingProficiencies.saves || []).join(" ")) : [];
    var saves = {};
    R.attributes.forEach(function (a) {
      var proficient = saveProfKeys.indexOf(a.key) !== -1;
      var bonus = attributes[a.key].mod + (proficient ? cal : 0);
      saves[a.key] = { key: a.key, name: a.name, proficient: proficient, focus: proficient, bonus: bonus };
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
      var hasFocus = focuses.some(function (f) { return f.type === "skill" && f.parent === s.key; });
      var hasSpec = specs.some(function (f) { return f.type === "skill" && f.parent === s.key; });
      var total = attrMod + tier.d20;
      // Focus adds Caliber (like Saving Throw Focus above), not a flat +5
      var passive = 10 + total + (hasFocus ? cal : 0) + (tierKey === "untrained" ? -5 : 0);
      return {
        key: s.key, name: s.name, attr: s.attr, attrName: attributes[s.attr].name,
        tier: tierKey, tierShort: tier.short, attrMod: attrMod, profBonus: tier.d20,
        total: total, passive: passive, untrained: tierKey === "untrained",
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

    /* flow (Shaper only) */
    var flow = null;
    if (ch.class === "shaper") {
      var flowAttrName = (sub && sub.extra && sub.extra.flowAttribute) || (sub && sub.flowAttribute) ||
                          R.shaperFlowAttrBySubclass[ch.subclass] || "Mystique";
      var fAttr = R.attrNameToKey[flowAttrName] || "MYS";
      var fMod = attributes[fAttr].mod;
      // The Icon's Parasocial Pact: add half the Mystique modifier (rounded up,
      // minimum 0) to maximum FP, on top of the Charm-based Flow Modifier.
      var pactBonus = ch.subclass === "icon" ? Math.max(0, Math.ceil(attributes.MYS.mod / 2)) : 0;
      var strainStage = clamp((ch.flow && ch.flow.strain) || 0, 0, 5);
      var stInfo = (EN.flow && EN.flow.strainTrack) ? EN.flow.strainTrack[strainStage - 1] : null;
      flow = {
        attribute: fAttr, attributeName: flowAttrName,
        max: Math.max(0, cal * 3 + fMod + pactBonus - chromeTax.fpPenalty), dc: 8 + fMod + cal,
        // `attack` is the bare Flow Modifier (used for FP recovery on a Short Rest
        // and Resurge rebound damage). `attackBonus` is the d20 Flow Attack roll
        // bonus, which per the core rules is Flow Modifier + Caliber.
        attack: fMod, attackBonus: fMod + cal,
        // Strain track and the consequences it gates (see EN.flow.strainTrack).
        strainStage: strainStage,
        strainName: stInfo ? stInfo.name : "Stable",
        strainPenalty: stInfo ? stInfo.penalty : null,
        breakflowDC: 12 + strainStage,
        overdrawDie: strainStage >= 3 ? 6 : 4,     // Surge: 1d6 per FP instead of 1d4
        fpSurcharge: strainStage >= 2 ? 1 : 0,     // Wave: every Invocation costs +1 FP
        precisionFp: strainStage >= 3 ? 2 : 1,     // Surge: Precision Shaping costs 2 FP
        snagInvoke: strainStage >= 1,              // Ripple: Snag on all Invocation rolls
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
    if (cls && cls.featuresByLevel) {
      for (var L = 1; L <= level; L++) {
        (cls.featuresByLevel[String(L)] || []).forEach(function (f) {
          features.push({ level: L, name: f.name, text: f.text, source: cls.name, kind: "class" });
        });
      }
    }
    if (sub && sub.features) {
      sub.features.forEach(function (f) {
        if ((f.level || 1) <= level) features.push({ level: f.level || 1, name: f.name, text: f.text, source: sub.name, kind: "subclass" });
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
        if (match) features.push({ level: 1, name: match.name, text: match.text, source: lin.name + " (Lineage)", kind: "lineage" });
      });
    }
    // Talents taken via Universal Upgrades, so the play sheet renders them with
    // their action type and uses (many are active/limited-use combat abilities).
    // The Level 6+ Upgrade rider only shows as active once it has been unlocked.
    var upKeys = talentUpgradeKeys(ch);
    activeTalents(ch).forEach(function (t) {
      var parts = splitTalentText(t.talent.text);
      var upgraded = upKeys.indexOf(t.talent.key) !== -1;
      var text = parts.base;
      if (parts.upgrade) {
        text += upgraded ? "\n\n**Upgrade (unlocked):** " + parts.upgrade
                         : "\n\n*Upgrade available at Level 6 (spend a Talent slot to unlock).*";
      }
      features.push({ level: t.level, name: t.talent.name, text: text, source: "Talent" + (upgraded ? " · Upgraded" : ""), kind: "talent" });
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
      vitalityMax: vitalityMax, resilienceDie: resilienceDie, resilienceMax: resilienceMax,
      armorDR: defLoadout.armorDR, blockBonus: defLoadout.blockBonus,
      naturalDR: linMech.dr, totalDR: (defLoadout.armorDR || 0) + (defLoadout.armorModDR || 0) + linMech.dr,
      lineageSpeed: linMech.speed,
      lineageSpeedFirstRound: linMech.speedFirstRound,
      lineageInit: { caliber: linMech.initCaliber ? cal : 0, edge: linMech.initEdge },
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
      resource: resource, flow: flow,
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
    return all.filter(function (a) { return chosen.indexOf(a.name) !== -1; });
  }
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
    var waveFp = stage >= 2 ? 1 : 0;
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
        (R && R.armorNote ? " · " + R.armorNote : "");
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
  function buildSnagPool(points) {
    points = Math.max(0, Math.floor(points || 0));
    var d10, d12;
    if (points <= 5) { d10 = points; d12 = 0; }
    else if (points <= 7) { d10 = 5; d12 = points - 5; }
    else if (points >= 12) { d10 = 0; d12 = 7; }
    else { d12 = points - 5; d10 = 7 - d12; }
    return poolShape("snag", points, d10, d12);
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
     doubles the WEAPON dice count only; flat mods and bonus dice are not
     doubled. bonus is extra dice groups [{ n, sides, label }] (Cheap Shot,
     ammo riders). Returns grouped rolls + total for a breakdown display. */
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
      var n = main.n * (spec.crit ? 2 : 1);
      var rolls = rollN(n, main.sides);
      groups.push({ label: "Weapon" + (spec.crit ? " (crit x2)" : ""), n: n, sides: main.sides,
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

  return {
    derive: derive, mod: mod, caliber: caliber, fmtMod: fmtMod, clamp: clamp,
    buildEdgePool: buildEdgePool, buildSnagPool: buildSnagPool, rollDicePool: rollDicePool, rollD20: rollD20,
    composeRollSpec: composeRollSpec, rollDamage: rollDamage,
    installedCyberware: installedCyberware, installedCyberBases: installedCyberBases,
    gambitList: gambitList,
    resourceAbilities: resourceAbilities,
    resourcePicksAllowed: resourcePicksAllowed, chosenResourceAbilities: chosenResourceAbilities,
    flowInvocation: flowInvocation,
    getClass: getClass, getSpecies: getSpecies, getLineage: getLineage,
    getBackground: getBackground, getSubclass: getSubclass,
    pointBuySpent: pointBuySpent,
    parseSkillGrants: parseSkillGrants, skillKeyOf: skillKeyOf,
    skillFloorTier: skillFloorTier, effectiveSkillTier: effectiveSkillTier,
    trainingBudget: trainingBudget,
    gearFloorTier: gearFloorTier, effectiveGearTier: effectiveGearTier,
    sizeFromHeightFt: sizeFromHeightFt, lineageHeightFt: lineageHeightFt,
    activeLineageFeatures: activeLineageFeatures, splitTalentText: splitTalentText, leaseLapsed: leaseLapsed, itemLoad: itemLoad,
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
    isStackableItem: isStackableItem, isStackableName: isStackableName, entryKey: entryKey, findEntry: findEntry,
    // Armor Integrity. armorState IS the resolver for a piece's current DR: every
    // surface that shows, prints or defends with a DR asks it (or reads the
    // d.armorDR / d.totalDR it feeds) rather than reading ch.armorWear itself.
    armorState: armorState, ownedArmorPieces: ownedArmorPieces, armorBaseDR: armorBaseDR,
    // and the one WRITER: every surface that moves a piece's DR goes through this
    // inside a store.update, so the clamps and the quality edge cannot diverge
    applyArmorDamage: applyArmorDamage, grantArmorGuard: grantArmorGuard,
    // Shield Durability, the same mechanic one piece over, and now the same shape:
    // one resolver for how many boxes are left, one writer for marking and repairing
    // them. The Block row used to derive both for itself and got the answer wrong.
    shieldState: shieldState, applyShieldWear: applyShieldWear,
    isCarryGear: isCarryGear, rackLimit: rackLimit, rackState: rackState, rackTargets: rackTargets,
    itemSlots: itemSlots, slotConflicts: slotConflicts,
    catalogItem: loadCatalogItem,
    // Trauma Rig. rigStats is THE resolver: every surface that needs to know which Rig
    // is live, and how hurt it is, reads it rather than matching ch.rig against the
    // stash itself. It answers with an ENTRY key, so the answer names one specific Rig.
    rigStats: rigStats,
    rigTierRow: rigTierRow, ownedRigs: ownedRigs,   // Trauma Rig tier lookup and the owned-entry list
    // Environmental Hazards. hazardStats is THE resolver: the Hazards panel, the
    // Long Rest and the Codex chapter all read it rather than raw storage, so
    // "which exposure is live", "does this suit hold vacuum" and "which
    // mitigation is on" have exactly one answer each.
    hazardStats: hazardStats, hazardMitigations: hazardMitigations,
    vacuumSeal: vacuumSeal, causticArmorDR: causticArmorDR, gearOnPerson: gearOnPerson,
    focusesFor: focusesFor, specFor: specFor,
    aspectMatches: aspectMatches, weaponFocus: weaponFocus, weaponSpec: weaponSpec, signatureUnlocked: signatureUnlocked,
    overlapGrants: overlapGrants, unresolvedOverlaps: unresolvedOverlaps,
    grantSourceMap: grantSourceMap, duplicateGrants: duplicateGrants, pendingChoices: pendingChoices,
    tp: { STEP_COST: STEP_COST, TIER_LEVEL_REQ: TIER_LEVEL_REQ, FOCUS_COST: FOCUS_COST, FOCUS_LEVEL_REQ: FOCUS_LEVEL_REQ, SPEC_COST: SPEC_COST, SPEC_LEVEL_REQ: SPEC_LEVEL_REQ }
  };
})();
