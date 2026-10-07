/* ===========================================================================
   ELYSIUM NIGHTS · Codex chapter: Gear & Chrome
   The rules that live inside the gear catalogs, gathered where a reader can
   find them: the trait glossaries, the weapon and ammunition notes, armor and
   shields, customization, crafting and repair, and cybernetics. The CATALOGS
   themselves (every weapon, part, mod and implant) stay in the Inventory;
   this chapter carries only the rules those catalogs are played by.
     gear: "Gear & Chrome", order 90, audience "both", panel ids "gr-"
   Everything below is read out of the data files the Inventory runs on
   (EN.gearCatalog, EN.weaponParts, EN.armorMods, EN.crafting, EN.cyberware),
   so the tab and the Codex can never state different rules. Rule text that
   used to be typed inline in inventory.js was moved into those files first.

   ANCHORS other files use (the promised ones are marked *):
     gr-traits *              the glossary
     gr-traits/<slug(key)> *  a WEAPON trait, keyed as in EN.gearCatalog.weaponTraits
                              ("gr-traits/armor-piercing-x", "gr-traits/full-auto")
     gr-traits/<slug(key)>    an ARMOR or shield trait whose name no weapon trait
                              uses ("gr-traits/bulky", "gr-traits/off-hand")
     gr-traits/armor-<slug>   an armor trait that shares its name with a weapon
                              trait (Concealable, Heavy, Light, Wear X, Worn): the
                              two mean different things, so both get an entry
     gr-weapons *, gr-armor, gr-custom *, gr-craft *, gr-chrome *
     gr-craft/armor-repair *
   EN.gearCodex.traitAnchor(printed, armorFirst) turns a trait as a catalog
   prints it ("Armor Piercing 2", "Thrown (4/12)", "Wear 12") into its anchor,
   through the one matcher in data/gear_traits.js. The Inventory's trait chips
   use it; any other trait chip can too.
   =========================================================================== */
window.EN = window.EN || {};

(function () {
  if (!EN.codexView || !EN.codexView.register) return;
  var CV = EN.codexView, slug = CV.slug, el = EN.ui.el;

  function G() { return EN.gearCatalog || {}; }
  function weaponTraits() { return G().weaponTraits || null; }
  function armorTraits() { return (G().armor && G().armor.traits) || null; }
  function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }

  /* An armor trait's entry slug: its own slug, unless a weapon trait already has that name. */
  function armorSlug(key) { return (own(weaponTraits(), key) ? "armor-" : "") + slug(key); }
  function traitAnchor(printed, armorFirst) {
    var look = G().traitLookup ? G().traitLookup(printed, armorFirst) : null;
    if (!look) return null;
    return "gr-traits/" + (look.armor ? armorSlug(look.key) : slug(look.key));
  }
  EN.gearCodex = { traitAnchor: traitAnchor, armorSlug: armorSlug };

  /* "Weapon Save DC (Melee): whenever..." printed under the heading "Weapon Save DC (Melee)"
     would say its own name twice, so a note that opens with its heading loses that opening. */
  function afterLabel(text, label) {
    text = String(text || "");
    return text.indexOf(label + ":") === 0 ? text.slice(label.length + 1).trim() : text;
  }
  function plus(n) { return n > 0 ? "+" + n : String(n); }

  /* ---- Weapon & Armor Traits ------------------------------------------------ */
  var traitsPanel = { id: "gr-traits", title: "Weapon & Armor Traits", order: 10,
    tag: function () { return (Object.keys(weaponTraits() || {}).length + Object.keys(armorTraits() || {}).length) + " TRAITS"; },
    when: function () { return !!weaponTraits(); },
    build: function (ctx, K) {
      var W = weaponTraits(), A = armorTraits(), kids = [];
      // a glossary reads alphabetically; the data keeps Tracing where Marking used to sit
      kids.push(K.subTitle("Weapon Traits"));
      Object.keys(W).sort(function (a, b) { return a.localeCompare(b); }).forEach(function (k) {
        kids.push(K.ruleBlock(k, W[k], null, { conditions: true }));
      });
      if (A) {
        kids.push(K.subTitle("Armor & Shield Traits"));
        // the book's own order: the armor traits, then the shield traits
        Object.keys(A).forEach(function (k) {
          var shared = own(W, k);
          kids.push(K.ruleBlock(k, A[k], shared ? "on armor and shields" : null, { slug: armorSlug(k), conditions: true }));
        });
      }
      return kids;
    } };

  /* ---- Weapons & Ammunition ----------------------------------------------- */
  var weaponsPanel = { id: "gr-weapons", title: "Weapons & Ammunition", tag: "SAVE DC · RANGE · AMMO", order: 20,
    when: function () { return !!(G().melee || G().ranged || G().ammo); },
    build: function (ctx, K) {
      var g = G(), kids = [];
      if (g.melee && g.melee.saveDcNote) kids.push(K.ruleBlock("Weapon Save DC (Melee)", afterLabel(g.melee.saveDcNote, "Weapon Save DC (Melee)")));
      if (g.ranged && g.ranged.saveDcNote) kids.push(K.ruleBlock("Weapon Save DC (Range)", afterLabel(g.ranged.saveDcNote, "Weapon Save DC (Range)")));
      if (g.ranged && g.ranged.rangeNote) kids.push(K.ruleBlock("Range", g.ranged.rangeNote));
      /* Firing Modes is four traits, defined in the glossary with their ammo costs, so this
         entry is only the way in: one link per mode, never a second copy of the text. */
      var modes = (g.firingModes || []).filter(function (m) { return own(weaponTraits(), m); });
      if (modes.length) {
        var line = el("p");
        modes.forEach(function (m, i) {
          if (i) line.appendChild(document.createTextNode(" · "));
          line.appendChild(K.link("gr-traits/" + slug(m), m));
        });
        kids.push(K.entry("firing-modes", "Firing Modes", [el("h4", { text: "Firing Modes" }), line],
          { tag: "div.feature", text: modes.join(", ") }));
      }
      var am = g.ammo;
      if (am) {
        kids.push(K.subTitle("Ammunition"));
        if (am.trackingNote) kids.push(K.ruleBlock("Tracking Ammunition", am.trackingNote));
        var gi = am.groupIntros || {};
        [["Plentiful", "Plentiful Ammo"], ["Counted", "Counted Ammo"], ["Specialty", "Specialty Ammo"], ["Launcher Shell", "Launcher Shells"]].forEach(function (p) {
          if (gi[p[0]]) kids.push(K.ruleBlock(p[1], gi[p[0]]));
        });
        if (am.mystechNote) kids.push(K.ruleBlock("Mystech Ammunition", am.mystechNote));
      }
      var sg = g.signature;
      if (sg && sg.usingNote) {
        kids.push(K.subTitle("Signature Weapons"));
        kids.push(K.ruleBlock("Using a Signature Weapon", sg.usingNote));
      }
      return kids;
    } };

  /* ---- Armor & Shields: the catalog's own intros, which carry rules ------- */
  var armorPanel = { id: "gr-armor", title: "Armor & Shields", tag: "DR · BLOCK · WARD", order: 30,
    when: function () { return !!G().armor; },
    build: function (ctx, K) {
      var A = G().armor, kids = [];
      if (A.intro) kids.push(K.proseBlock(A.intro));
      var gi = A.groupIntros || {};
      Object.keys(gi).forEach(function (k) { if (gi[k]) kids.push(K.ruleBlock(k, gi[k])); });
      return kids;
    } };

  /* ---- Weapon & Armor Customization ---------------------------------------- */
  function WP() { return EN.weaponParts || {}; }
  function AM() { return EN.armorMods || {}; }
  var customPanel = { id: "gr-custom", title: "Weapon & Armor Customization", tag: "PARTS · SLOTS · ARMOR MODS", order: 40,
    when: function () { return !!(EN.weaponParts || EN.armorMods); },
    build: function (ctx, K) {
      var kids = [], wp = WP(), am = AM();
      if (EN.weaponParts) {
        kids.push(K.subTitle("Weapon Parts"));
        if ((wp.slots || []).length) {
          kids.push(K.entry("weapon-slots", "Weapon Slots", [
            el("h4", { text: "Weapon Slots" }),
            K.refTable(["Slot", "Firearm", "Melee", "Bow"], wp.slots.map(function (s) {
              return [s.name + (s.capacity ? " (holds " + s.capacity + ")" : ""), s.firearm || "", s.melee || "", s.bow || ""];
            }), [0])
          ], { tag: "div.feature" }));
        }
        var byGroup = wp.slotCountByGroup || {};
        var profiles = (wp.profiles || []).filter(function (p) { return p.count != null; });
        if (Object.keys(byGroup).length || profiles.length) {
          kids.push(K.entry("slot-count", "Slot Count", [
            el("h4", { text: "Slot Count" }),
            Object.keys(byGroup).length ? K.refTable(["Weapon Type", "Slots"], Object.keys(byGroup).map(function (k) { return [k, String(byGroup[k])]; }), [1]) : null,
            profiles.length ? K.refTable(["Frame Profile", "Slots"], profiles.map(function (p) { return [p.name, String(p.count)]; }), [1]) : null
          ], { tag: "div.feature" }));
        }
        var r = wp.rules || {};
        if (r.install) kids.push(K.ruleBlock("Installing Parts", r.install));
        if (r.legality) kids.push(K.ruleBlock("Part Legality", r.legality));
        if (r.dieStep) kids.push(K.ruleBlock("Damage Die Steps", r.dieStep));
        if (r.stabilized) kids.push(K.ruleBlock("Stabilized Sources", r.stabilized));
      }
      if (EN.armorMods) {
        kids.push(K.subTitle("Armor Mods"));
        var ar = am.rules || {};
        if (ar.host) kids.push(K.ruleBlock("Hosting Armor Mods", ar.host));
        if (ar.flatDR) kids.push(K.ruleBlock("Flat DR from Mods", ar.flatDR));
        if (ar.resistance) kids.push(K.ruleBlock("Resistance from Mods", ar.resistance));
        if (ar.legality) kids.push(K.ruleBlock("Mod Legality", ar.legality));
      }
      if (kids.length && CV.has("ref-vehicles/how-vehicle-mods-work")) {
        kids.push(el("p", { style: { margin: "6px 0 0", fontSize: "12.5px", fontStyle: "italic", color: "var(--text3)" } },
          ["Vehicle Mods: ", K.link("ref-vehicles/how-vehicle-mods-work", "How Vehicle Mods Work"), ", under Vehicles."]));
      }
      return kids;
    } };

  /* ---- Crafting & Repair ------------------------------------------------------ */
  function CR() { return EN.crafting || {}; }
  /* Which Dice Pool margins land on each Work Interval outcome, read off the bench's own
     marginToOutcomeKey so the table is the rule the Fabrication bench actually runs. */
  function marginBands() {
    var f = CR().marginToOutcomeKey;
    if (typeof f !== "function") return {};
    var LO = -10, HI = 10, out = {}, run = null;
    function close() {
      if (!run) return;
      out[run.key] = run.lo === LO ? plus(run.hi) + " or less" : run.hi === HI ? plus(run.lo) + " or more"
        : run.lo === run.hi ? plus(run.lo) : plus(run.lo) + " to " + plus(run.hi);
    }
    for (var m = LO; m <= HI; m++) {
      var k = f(m);
      if (run && run.key === k) { run.hi = m; continue; }
      close();
      run = { key: k, lo: m, hi: m };
    }
    close();
    return out;
  }
  var craftPanel = { id: "gr-craft", title: "Crafting & Repair", tag: "PROJECTS · WORK INTERVALS · ARMOR REPAIR", order: 50,
    when: function () { return !!EN.crafting; },
    build: function (ctx, K) {
      var C = CR(), kids = [], r = C.rules || {};
      var tiers = ((EN.rules || {}).profTiers) || {};
      var snag = C.snagForTier || {};
      kids.push(K.subTitle("Projects"));
      if ((C.tiers || []).length) {
        kids.push(K.entry("project-tiers", "Project Tiers", [
          el("h4", { text: "Project Tiers" }),
          K.refTable(["Tier", "Target Progress", "Expected Skill", "Base Snag Dice", "Time", "Difficulty", "Examples"], C.tiers.map(function (t) {
            return [t.name, t.target == null ? "GM-defined" : String(t.target), (tiers[t.skillTier] || {}).name || t.skillTier || "",
                    snag[t.key] == null ? "" : String(snag[t.key]), t.time || "", t.difficulty || "", t.examples || ""];
          }), [0, 1])
        ], { tag: "div.feature" }));
      }
      if (r.workInterval) kids.push(K.ruleBlock("Work Intervals", r.workInterval));
      if ((C.outcomes || []).length) {
        var bands = marginBands(), hasBands = Object.keys(bands).length > 0;
        kids.push(K.entry("work-interval-outcomes", "Work Interval Outcomes", [
          el("h4", { text: "Work Interval Outcomes" }),
          K.refTable(hasBands ? ["Pool Margin", "Outcome", "Progress"] : ["Outcome", "Progress"], C.outcomes.map(function (o) {
            var row = [o.name, o.note || String(o.progress)];
            return hasBands ? [bands[o.key] || ""].concat(row) : row;
          }), hasBands ? [1] : [0])
        ], { tag: "div.feature" }));
      }
      if (r.untrained) kids.push(K.ruleBlock("Untrained Crafters", r.untrained));
      if ((C.kinds || []).length) {
        kids.push(K.subTitle("Kinds of Project"));
        C.kinds.forEach(function (k) { kids.push(K.ruleBlock(k.name, k.desc)); });
      }
      var kc = C.kitCategories || {};
      if ((C.craftSkills || []).length) {
        kids.push(K.entry("craft-skills", "Craft Skills", [
          el("h4", { text: "Craft Skills" }),
          el("p", { text: C.craftSkills.join(", ") }),
          Object.keys(kc).length ? K.refTable(["Tool Category", "Serves"], Object.keys(kc).map(function (k) { return [k, kc[k]]; }), [0]) : null
        ], { tag: "div.feature" }));
      }
      kids.push(K.subTitle("Crafting Rules"));
      if (r.emergency) kids.push(K.ruleBlock("Emergency Fixes", r.emergency));
      if (r.materials) kids.push(K.ruleBlock("Materials", r.materials));
      if (r.kits) kids.push(K.ruleBlock("Kits", r.kits));
      if (r.oneProjectPerMod) kids.push(K.ruleBlock("One Project per Mod", r.oneProjectPerMod));
      if (r.overEngineering) kids.push(K.ruleBlock("Over-Engineering", r.overEngineering));
      var AR = C.armorRepair;
      if (AR) {
        kids.push(K.subTitle("Armor Repair"));
        kids.push(K.ruleBlock("Armor Repair", [AR.intro, AR.shopText, AR.benchText, AR.breachedText, AR.leasedText, AR.qualityText]
          .filter(Boolean).join("\n\n")));
      }
      return kids;
    } };

  /* ---- Cybernetics & Chrome Tax ------------------------------------------------ */
  function CW() { return EN.cyberware || null; }
  var chromePanel = { id: "gr-chrome", title: "Cybernetics & Chrome Tax", tag: "STATIC · THRESHOLDS · TIERS", order: 60,
    when: function () { return !!CW(); },
    build: function (ctx, K) {
      var W = CW(), kids = [];
      if (W.intro) kids.push(K.proseBlock(W.intro));
      var z = W.zones || {};
      if (Object.keys(z).length) {
        kids.push(K.entry("interface-zones", "Interface Zones", [
          el("h4", { text: "Interface Zones" }),
          K.refTable(["Zone", "Covers"], Object.keys(z).map(function (k) { return [z[k].label || k, z[k].blurb || ""]; }), [0])
        ], { tag: "div.feature" }));
      }
      if ((W.thresholds || []).length) {
        kids.push(K.entry("the-chrome-tax", "The Chrome Tax", [
          el("h4", { text: "The Chrome Tax" }),
          W.taxNote ? K.proseBlock(W.taxNote) : null,
          K.refTable(["Threshold", "Total Static", "Name", "Effects"], W.thresholds.map(function (t) {
            return ["T" + t.index, t.max === Infinity ? t.min + "+" : t.min + " to " + t.max, t.name, (t.effects || []).length ? t.effects.join("; ") : "None"];
          }), [0, 1])
        ], { tag: "div.feature" }));
      }
      if (W.platformNote) kids.push(K.ruleBlock("Platform Mod Slots", W.platformNote));
      var q = W.qualityTiers || {};
      if (Object.keys(q).length) {
        kids.push(K.subTitle("Quality Tiers"));
        Object.keys(q).forEach(function (k) { kids.push(K.ruleBlock(k, q[k])); });
      }
      return kids;
    } };

  EN.codexView.register({ id: "gear", title: "Gear & Chrome", order: 90, audience: "both",
    panels: [traitsPanel, weaponsPanel, armorPanel, customPanel, craftPanel, chromePanel] });

  /* Pointer terms: the names the data and the app use for these rules. "Encumbrance and Load"
     is the build chapter's, and the Firing Modes alias is how combat.js's "(see Firing Modes)"
     on Suppressive Fire finds its way here. */
  EN.codexView.terms({
    "Weapon Traits": "gr-traits",
    "Armor Traits": "gr-traits",
    "Firing Modes": "gr-weapons/firing-modes",
    "Signature Weapon": "gr-weapons/using-a-signature-weapon",
    "Signature Weapons": "gr-weapons/using-a-signature-weapon",
    "Weapon Parts": "gr-custom",
    "Armor Mods": "gr-custom/hosting-armor-mods",
    "Crafting and Projects": "gr-craft",
    "Crafting & Projects": "gr-craft",
    "Work Interval": "gr-craft/work-intervals",
    "Work Intervals": "gr-craft/work-intervals",
    "Over-Engineering": "gr-craft/over-engineering",
    "Armor Repair": "gr-craft/armor-repair",
    "Cybernetics": "gr-chrome",
    "Chrome Tax": "gr-chrome/the-chrome-tax",
    "Static Threshold": "gr-chrome/the-chrome-tax",
    "Interface Zone": "gr-chrome/interface-zones",
    "Interface Zones": "gr-chrome/interface-zones"
  });
})();
