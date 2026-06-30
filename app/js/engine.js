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
       Skill Focus       : 1 TP, level 3+,  requires Proficient+ in skill
       Specialization    : 1 TP, level 6+,  requires Expertise+ in skill (1/skill)
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
  function trainingSpent(ch) {
    var total = 0;
    R.skills.forEach(function (s) { total += skillTierCost(ch, s.key); });
    total += ((ch.skillFocuses || []).length) * FOCUS_COST;
    total += ((ch.specializations || []).length) * SPEC_COST;
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

  /* ---- Point-buy spend accounting --------------------------------------- */
  function pointBuySpent(scores) {
    var spent = 0, ok = true;
    R.attributes.forEach(function (a) {
      var s = scores[a.key];
      var c = R.pointBuy.costToReach[s];
      if (c == null) { ok = false; } else { spent += c; }
    });
    return { spent: spent, remaining: R.pointBuy.pool - spent, valid: ok };
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
    "Tuned Synapses":        { initEdge: true },
    "Synthetic Musculature": { unarmed: { die: "1d6", type: "Bludgeoning" } },
    "Briar Strike":          { unarmed: { die: "1d6", type: "Piercing/Slashing", traits: "Light, Finesse" } },
    "Brutal Frame":          { unarmed: { die: "1d6", type: "Bludgeoning", note: "+1d4 on hit" } },
    "Butcher Spurs":         { unarmed: { die: "1d6", type: "Slashing", note: "−2 target Speed on hit" } },
    "Scavenger's Maw":       { unarmed: { die: "1d6", type: "Piercing", note: "bite; +1 Vitality on hit" } }
  };
  function lineageMechanics(ch) {
    var out = { dr: 0, speed: 0, initCaliber: false, initEdge: false, unarmed: null };
    activeLineageFeatures(ch).forEach(function (fn) {
      var m = LINEAGE_MECH[fn]; if (!m) return;
      if (m.dr) out.dr += m.dr;
      if (m.speed) out.speed += m.speed;
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
      if (key && amt) out[key] = (out[key] || 0) + amt;
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
  function defensiveLoadout(ch) {
    var armor = armorItem(ch && ch.equippedArmor);
    var shield = armorItem(ch && ch.equippedShield);
    var focus = armorItem(ch && ch.equippedFocus);
    var wardDie = (focus && focus.wardDie) || (armor && armor.wardDie) || null;
    // Bulky armor slows you by 1. Powered frames are the exception (trained + powered
    // ignores it), but training isn't modeled, so we leave Powered Speed to the player.
    var speedPenalty = (hasTrait(armor, "Bulky") && !hasTrait(armor, "Powered")) ? -1 : 0;
    return {
      armor: armor, shield: shield, focus: focus,
      armorDR: (armor && armor.dr) || 0,
      blockBonus: (armor && armor.blockBonus) || 0,   // flat Block Bonus from medium/heavy plate
      shieldDef: (shield && typeof shield.defense === "number") ? shield.defense : 0,
      shieldBlockDie: (shield && shield.blockDie) || null,
      wardDie: wardDie,                               // from the Focus item, or a Focus-trait armor
      wardFromArmor: !focus && !!(armor && armor.wardDie),   // the Ward die comes from the armor, not a separate focus
      speedPenalty: speedPenalty
    };
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
    var isCodebreaker = ch.class === "codebreaker";
    // SysAdmin (Root Access) at L9 removes the Link cap for Codebreakers
    var unlimitedLinks = isCodebreaker && level >= 9;
    var g = (ch && ch.grid) || {};
    var deck = null, deviceBonus = 0, deckBaseHp = 0, modSlots = 0, deckTraits = [], maxComplexity = null;
    if (g.deckType === "smartdeck") {
      deck = (G.smartdecks || []).find(function (t) { return t.tier === g.deckTier; });
      if (deck) {
        deviceBonus = deck.deviceBonus; deckBaseHp = deck.hp; modSlots = deck.modSlots; maxComplexity = Math.min(5, deck.t + 1);
        deckTraits = (G.smartdecks || []).filter(function (x) { return x.t <= deck.t; }).map(function (x) { return x.trait; });
      }
    } else if (g.deckType === "buddy") {
      deck = (G.buddies || []).find(function (t) { return t.tier === g.deckTier; });
      if (deck) { deckBaseHp = deck.hp; }   // buddies have no mod slots → mods never apply
    }
    // mods apply only up to the deck's mod-slot capacity (0 for buddies / no rig).
    // This also drops mods left stranded after a deck downgrade, and is safe against stale/imported data.
    var modKeys = g.deckMods || [], modHp = 0, modLinks = 0, hasRedline = false, usedSlots = 0;
    modKeys.forEach(function (k) {
      var m = (G.mods || []).find(function (x) { return x.key === k; });
      if (!m || usedSlots + m.slots > modSlots) return;
      usedSlots += m.slots;
      if (m.bonus && m.bonus.hp) modHp += m.bonus.hp;
      if (m.bonus && m.bonus.links) modLinks += m.bonus.links;
      if (k === "redline") hasRedline = true;
    });
    var deckMaxHp = deck ? deckBaseHp + modHp : 0;
    var isSmart = g.deckType === "smartdeck" && !!deck;
    var isBuddy = g.deckType === "buddy" && !!deck;
    // effective attack/save with the current rig (Buddy uses its baked-in numbers)
    var effectiveAttack = isBuddy ? deck.attack : cipherAttackBonus + deviceBonus;
    var effectiveSaveDC = isBuddy ? deck.saveDc : cipherSaveDC;
    var hasAdaptiveBuffer = isSmart && deck.t >= 4;   // Elite+ trait (Elite t=4, Apex t=5)
    var stabilityDcMod = (hasAdaptiveBuffer ? -2 : 0) + (hasRedline ? 2 : 0);
    // Live Stability DC: the disconnection save is the HIGHER of the rig-adjusted
    // DC 10 floor or half (rounded down) of the damage taken this turn while linked.
    var stabilityDcBase = 10 + stabilityDcMod;
    var stabilityLastDamage = Math.max(0, ((ch && ch.lastDamage) | 0));
    var stabilityDcFromDamage = Math.floor(stabilityLastDamage / 2);
    var stabilityDcLive = Math.max(stabilityDcBase, stabilityDcFromDamage);
    var baseMaxLinks = isCodebreaker ? (2 * cal) : 1;
    var maxLinks = unlimitedLinks ? null : baseMaxLinks + (isCodebreaker ? modLinks : 0);
    return {
      isCodebreaker: isCodebreaker, userType: isCodebreaker ? "Power User" : "Standard User",
      techMod: techMod, systemsProf: sysProf, systemsTier: sysTier,
      cipherAttackBonus: cipherAttackBonus, cipherSaveDC: cipherSaveDC,
      effectiveAttack: effectiveAttack, effectiveSaveDC: effectiveSaveDC,
      quickHackBonus: isSmart ? cipherAttackBonus + deviceBonus : null,
      maxLinks: maxLinks, unlimitedLinks: unlimitedLinks, modLinks: isCodebreaker ? modLinks : 0,
      bandwidthMax: (isCodebreaker && resource && resource.name === "Bandwidth") ? resource.max : null,
      stabilityDcBase: stabilityDcBase, stabilityDcMod: stabilityDcMod,
      stabilityLastDamage: stabilityLastDamage, stabilityDcFromDamage: stabilityDcFromDamage, stabilityDcLive: stabilityDcLive,
      deck: deck ? { type: g.deckType, tier: deck.tier, t: deck.t, deviceBonus: deviceBonus, maxHp: deckMaxHp,
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

    /* creature size, player pick if valid for the lineage, else lineage default */
    var sizeOpts = (ch.lineage && R.lineageSize) ? R.lineageSize[ch.lineage] : null;
    var size = sizeOpts ? ((ch.size && sizeOpts.indexOf(ch.size) !== -1) ? ch.size : sizeOpts[0]) : (ch.size || null);

    /* attributes + modifiers (installed cyberware Enhancement Bonuses fold into the score, capped at 20) */
    var scores = effectiveAttributes(ch);
    var cyberEnh = cyberEnhancements(ch);
    var cyberFlat = cyberFlatBonuses(ch);
    var attributes = {};
    R.attributes.forEach(function (a) {
      var bonus = cyberEnh[a.key] || 0;
      var sc = Math.min(20, scores[a.key] + bonus);
      attributes[a.key] = { key: a.key, name: a.name, score: sc, mod: mod(sc), baseScore: scores[a.key], cyberBonus: bonus };
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
    var staticTotal = 0;
    (ch.cyberware || []).forEach(function (cw) { if (cw && typeof cw === "object" && typeof cw.sp === "number") staticTotal += cw.sp; });
    var CT = (EN.cyberware && EN.cyberware.thresholds) || [];
    var ctTier = null;
    for (var ci = 0; ci < CT.length; ci++) { if (staticTotal >= CT[ci].min && staticTotal <= CT[ci].max) { ctTier = CT[ci]; break; } }
    var ctIndex = ctTier ? ctTier.index : 0;
    var chromeTax = {
      total: staticTotal, index: ctIndex,
      name: ctTier ? ctTier.name : "Safe Capacity",
      resDiePenalty: ctIndex, fpPenalty: ctIndex,
      effects: ctTier ? ctTier.effects : [],
      hardwired: ctIndex >= 2, noWoundRecovery: ctIndex >= 4, deadBattery: ctIndex >= 5
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
    var focuses = ch.skillFocuses || [];
    var specs = ch.specializations || [];
    var skills = R.skills.map(function (s) {
      var storedTier = skillProf[s.key] || "untrained";
      var isGranted = !!granted[s.key];
      var tierKey = storedTier;
      if (isGranted && R.profOrder.indexOf("proficient") > R.profOrder.indexOf(storedTier)) tierKey = "proficient";
      var tier = R.profTiers[tierKey] || R.profTiers.untrained;
      var attrMod = attributes[s.attr].mod;
      var hasFocus = focuses.some(function (f) { return f.skill === s.key; });
      var hasSpec = specs.some(function (f) { return f.skill === s.key; });
      var total = attrMod + tier.d20;
      var passive = 10 + total + (hasFocus ? 5 : 0) + (tierKey === "untrained" ? -5 : 0);
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
      var strainStage = clamp((ch.flow && ch.flow.strain) || 0, 0, 5);
      var stInfo = (EN.flow && EN.flow.strainTrack) ? EN.flow.strainTrack[strainStage - 1] : null;
      flow = {
        isShaper: true, attribute: fAttr, attributeName: flowAttrName,
        max: Math.max(0, cal * 3 + fMod - chromeTax.fpPenalty), dc: 8 + fMod + cal,
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
        vitalityPerFp: strainStage >= 4 ? 1 : 0,   // Rend: spending FP costs 1 flat Vitality/FP
        breakflowOnOverdraw: strainStage >= 4,     // Rend: Overdraw forces a Breakflow Check
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
      naturalDR: linMech.dr, totalDR: (defLoadout.armorDR || 0) + linMech.dr,
      lineageSpeed: linMech.speed,
      lineageInit: { caliber: linMech.initCaliber ? cal : 0, edge: linMech.initEdge },
      lineageUnarmed: linMech.unarmed,
      shieldDef: defLoadout.shieldDef, shieldBlockDie: defLoadout.shieldBlockDie,
      wardDie: defLoadout.wardDie, defenseGear: defLoadout,
      chromeTax: chromeTax, cyberEnh: cyberEnh, cyberFlat: cyberFlat,
      grid: grid,
      woundsMax: woundsMax, critThreshold: critThreshold,
      saves: saves, skills: skills,
      resource: resource, flow: flow,
      size: size,
      classInfo: cls, subclassInfo: sub, speciesInfo: sp, lineageInfo: lin, backgroundInfo: bg,
      features: features,
      trainingPoints: { total: tpTotal, spent: tpSpent, remaining: tpTotal - tpSpent },
      xpForNext: level < R.maxLevel ? R.xpThresholds[level + 1] : null,
      xpForCurrent: R.xpThresholds[level] || 0,
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

  return {
    derive: derive, mod: mod, caliber: caliber, fmtMod: fmtMod, clamp: clamp,
    installedCyberware: installedCyberware, installedCyberBases: installedCyberBases,
    gambitList: gambitList, gambitsAllowed: gambitsAllowed,
    resourceAbilities: resourceAbilities, resourceKnowsAll: resourceKnowsAll,
    resourcePicksAllowed: resourcePicksAllowed, chosenResourceAbilities: chosenResourceAbilities,
    flowInvocation: flowInvocation,
    getClass: getClass, getSpecies: getSpecies, getLineage: getLineage,
    getBackground: getBackground, getSubclass: getSubclass,
    pointBuySpent: pointBuySpent, trainingPointsTotal: trainingPointsTotal,
    attrInText: attrInText, parseAttrKeys: parseAttrKeys,
    grantedSkills: grantedSkills, parseSkillGrants: parseSkillGrants, skillKeyOf: skillKeyOf,
    skillFloorTier: skillFloorTier, effectiveSkillTier: effectiveSkillTier,
    skillTierCost: skillTierCost, trainingSpent: trainingSpent, trainingBudget: trainingBudget,
    grantedGear: grantedGear, gearFloorTier: gearFloorTier, effectiveGearTier: effectiveGearTier, gearTierCost: gearTierCost,
    activeLineageFeatures: activeLineageFeatures,
    grantSourceMap: grantSourceMap, duplicateGrants: duplicateGrants, pendingChoices: pendingChoices,
    tp: { STEP_COST: STEP_COST, TIER_LEVEL_REQ: TIER_LEVEL_REQ, FOCUS_COST: FOCUS_COST, FOCUS_LEVEL_REQ: FOCUS_LEVEL_REQ, SPEC_COST: SPEC_COST, SPEC_LEVEL_REQ: SPEC_LEVEL_REQ }
  };
})();
