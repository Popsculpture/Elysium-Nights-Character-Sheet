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
  // unarmed strike, keyed by feature name. derive() folds these into the sheet so
  // the player does not have to hand-track them. Source values per app/data/species.js.
  var LINEAGE_MECH = {
    "Ironbark Carapace":     { dr: 2 },
    "Ironhide Tusks":        { dr: 1 },
    "Slipstream Runner":     { speed: 2 },
    "Calibrated Gait":       { speed: 1 },
    "Static Premonition":    { initCaliber: true },
    "Tuned Synapses":        { initEdge: true, speedFirstRound: 2 },
    "Synthetic Musculature": { unarmed: { die: "1d6", type: "Bludgeoning" } },
    "Briar Strike":          { unarmed: { die: "1d6", type: "Piercing/Slashing", traits: "Light, Finesse" } },
    "Brutal Frame":          { unarmed: { die: "1d6", type: "Bludgeoning", note: "+1d4 Bludgeoning or Slashing on a hit with this die" } },
    "Butcher Spurs":         { unarmed: { die: "1d6", type: "Slashing", note: "−2 target Speed on hit" } },
    "Scavenger's Maw":       { unarmed: { die: "1d6", type: "Piercing", note: "bite; +1 Vitality on hit" } }
  };
  function lineageMechanics(ch) {
    var out = { dr: 0, speed: 0, speedFirstRound: 0, initCaliber: false, initEdge: false, unarmed: null };
    activeLineageFeatures(ch).forEach(function (fn) {
      var m = LINEAGE_MECH[fn]; if (!m) return;
      if (m.dr) out.dr += m.dr;
      if (m.speed) out.speed += m.speed;
      if (m.speedFirstRound) out.speedFirstRound += m.speedFirstRound;   // conditional: first round of combat only
      if (m.initCaliber) out.initCaliber = true;
      if (m.initEdge) out.initEdge = true;
      if (m.unarmed) out.unarmed = { source: fn, die: m.unarmed.die, type: m.unarmed.type, traits: m.unarmed.traits || null, note: m.unarmed.note || null };
    });
    return out;
  }
  // Talents the character has taken via Universal Upgrades (type "talent"), resolved
  // against EN.talents. Folded into d.features so the play sheet and print sheet
  // surface them with their action type and rules text.
  function activeTalents(ch) {
    var ups = (ch && ch.universalUpgrades) || {}, out = [];
    Object.keys(ups).forEach(function (lvl) {
      var u = ups[lvl];
      if (u && u.type === "talent" && u.talent) {
        var t = (EN.talents || []).find(function (x) { return x.key === u.talent || x.name === u.talent; });
        if (t) out.push({ level: Number(lvl) || 1, talent: t });
      }
    });
    return out;
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
    // Shield Durability boxes, tracked per shield name on the record.
    var shieldBoxesMax = shield ? (typeof shield.boxes === "number" ? shield.boxes : 3) : 0;
    var shieldSpent = shield ? clamp(((ch.shieldWear || {})[shield.name]) | 0, 0, shieldBoxesMax) : 0;
    var shieldBoxesLeft = Math.max(0, shieldBoxesMax - shieldSpent);
    var shieldAlive = !shield || shieldBoxesLeft > 0;
    return {
      armor: armor, focus: focus,
      armorLapsed: armorLapsed, shieldLapsed: shieldLapsed, focusLapsed: focusLapsed,
      // part3.txt:4325 - DR 0 is only the DEFAULT zero state; an item whose own
      // Lapsed or Locked line names a different value uses that value instead.
      armorDR: armor ? (armorLapsed ? (armor.lapsedDR || 0) : (armor.dr || 0)) : 0,
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
      lineageUnarmed: linMech.unarmed,
      shieldDef: defLoadout.shieldDef, shieldBlockDie: defLoadout.shieldBlockDie,
      wardDie: defLoadout.wardDie, defenseGear: defLoadout,
      chromeTax: chromeTax, platformSlotted: platformSlotted(ch),
      grid: grid,
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
    isStackableItem: isStackableItem, isStackableName: isStackableName, entryKey: entryKey, findEntry: findEntry,
    isCarryGear: isCarryGear, rackLimit: rackLimit, rackState: rackState, rackTargets: rackTargets,
    itemSlots: itemSlots, slotConflicts: slotConflicts,
    catalogItem: loadCatalogItem,
    focusesFor: focusesFor, specFor: specFor,
    aspectMatches: aspectMatches, weaponFocus: weaponFocus, weaponSpec: weaponSpec, signatureUnlocked: signatureUnlocked,
    overlapGrants: overlapGrants, unresolvedOverlaps: unresolvedOverlaps,
    grantSourceMap: grantSourceMap, duplicateGrants: duplicateGrants, pendingChoices: pendingChoices,
    tp: { STEP_COST: STEP_COST, TIER_LEVEL_REQ: TIER_LEVEL_REQ, FOCUS_COST: FOCUS_COST, FOCUS_LEVEL_REQ: FOCUS_LEVEL_REQ, SPEC_COST: SPEC_COST, SPEC_LEVEL_REQ: SPEC_LEVEL_REQ }
  };
})();
