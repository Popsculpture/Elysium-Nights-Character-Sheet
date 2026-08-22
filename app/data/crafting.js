/* ===========================================================================
   ELYSIUM NIGHTS · Crafting and Projects (Tech Bay data)
   The Tech Bay runs crafting as Projects: a tier sets a Target Progress, a
   primary Skill drives the roll, kits and Focus feed the pool, and each Work
   Interval converts an outcome into Progress until the Target is met. Building
   from scratch costs half the item's market price in materials; salvage cuts
   that. This file holds the rules constants plus the derivation that maps any
   catalog item to a craft Skill, a Project tier, and a material cost.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.crafting = {

  /* ---- Project tiers: Target Progress, expected skill tier, time, difficulty ---- */
  tiers: [
    { key: "simple",    name: "Simple",    target: 3,   skillTier: "proficient", time: "A scene or a few hours",         difficulty: "Routine DC or easy pool",          examples: "Patch armor, routine repairs, a standard dose, basic disguise touch-ups" },
    { key: "standard",  name: "Standard",  target: 5,   skillTier: "proficient", time: "One downtime period",            difficulty: "Moderate DC or standard pool",     examples: "New sidearm, upgraded plate, sensor add-on, clean paperwork" },
    { key: "advanced",  name: "Advanced",  target: 7,   skillTier: "expertise",  time: "Several downtime periods",       difficulty: "Hard DC or increased successes",   examples: "Custom weapon mod, surgical implant, hardened software suite" },
    { key: "prototype", name: "Prototype", target: 10,  skillTier: "expertise",  time: "Ongoing across sessions",        difficulty: "Very hard, complications likely",  examples: "New device pattern, experimental mystech, unstable systems" },
    { key: "relic",     name: "Relic or Breakthrough", target: null, skillTier: "mastery", time: "Long-term campaign project", difficulty: "GM-defined requirements", examples: "Setting-altering tech, legendary Flow artifact" }
  ],

  /* ---- Work Interval outcomes to Progress (Dice Pool Method) ---- */
  outcomes: [
    { key: "flawless", name: "Flawless", progress: 2, color: "var(--success)", note: "2 Progress, plus a minor benefit if the fiction supports it" },
    { key: "strong",   name: "Strong",   progress: 1, color: "var(--success)", note: "1 Progress" },
    { key: "mixed",    name: "Mixed",    progress: 1, color: "var(--gold)",    note: "1 Progress, plus a complication, cost, or minor flaw" },
    { key: "failure",  name: "Failure",  progress: 0, color: "var(--warn)",    note: "0 Progress, plus a complication, extra cost, or wasted time" },
    { key: "crit",     name: "Critical", progress: 0, color: "var(--danger)",  note: "0 Progress, plus a major setback or dangerous mishap" }
  ],

  /* ---- kinds of Project ---- */
  kinds: [
    { key: "build",  name: "Build",  desc: "Fabricate a new item from scratch. Materials cost half the item's market price." },
    { key: "repair", name: "Repair", desc: "Restore damaged gear. Cosmetic upkeep needs no roll; functional damage is a Simple or Standard Project; catastrophic is Advanced or higher." },
    { key: "modify", name: "Modify", desc: "Install one mod or customization. One Project per mod. Past the item's Slot Count it becomes a Prototype with a Mandatory Flaw." },
    { key: "custom", name: "Custom", desc: "Freeform work the catalog does not cover: software suite, disguise, drug, ritual implement, surveillance rig." }
  ],

  /* primary craft skills; each skill's Attribute and bonus are read live from the character */
  craftSkills: ["Engineering", "Systems", "Medtech", "Investigation", "Esoterica", "Awareness"],

  /* crafting tool categories to the skill they serve (drives the Kits readout) */
  kitCategories: {
    "Engineering Tools": "Engineering",
    "Systems Tools": "Systems",
    "Medical Tools": "Medtech",
    "Investigation Tools": "Investigation",
    "Ritual Implements": "Esoterica",
    "Media Tools": "Systems"
  },

  rules: {
    emergency: "The d20 Method is for emergency fixes under pressure: one roll of d20 plus the Skill, and the fix holds for the scene. It rarely creates a permanent upgrade.",
    materials: "Building from scratch, raw materials and components cost half the item's market price. Salvaging parts from similar broken gear can reduce or eliminate that cost.",
    kits: "A kit's Basic Use is open to anyone. Its Proficient Use needs the matching Tool Proficiency; without it you own the kit but not its edge. Missing suitable kits can raise the Target or add Snag.",
    oneProjectPerMod: "Each modification is its own Project. You cannot batch several upgrades into a single roll.",
    overEngineering: "Every weapon has a Slot Count and every suit of armor a Mod Slot count, one Part or mod per slot. Pushing an item past its safe capacity instantly elevates the work to a Prototype Project, and the finished piece carries a Mandatory Flaw: a permanent quirk, a heavy maintenance burden, or an obvious tell."
  },

  /* ---- Dice Pool assembly (Dicey Situations, Dice Pool Method) -------------
     Edge points for a Work Interval: attribute modifier (floored at 0, a
     negative mod grants no dice) + proficiency pool bonus (0/2/4/6) + kit Edge
     Dice + Skill Focus (Caliber) + Specialization (+2) + situational toggles
     (Special Preparation +1, Narrative Advantage +1). The d10/d12 composition
     tables live in EN.engine.buildEdgePool / buildSnagPool. ---- */
  edgePointsFor: function (skillEntry, caliber, kits, opts) {
    opts = opts || {};
    var parts = [];
    if (!skillEntry) return { points: 0, parts: parts };
    var tiers = (EN.rules && EN.rules.profTiers) || {};
    // house ruling: the source table says "+1 Edge Die per point" of attribute
    // modifier and never addresses negatives, so a negative mod grants 0 dice
    // rather than subtracting from the pool
    var attr = Math.max(0, skillEntry.attrMod || 0);
    if (attr) parts.push({ label: (skillEntry.attrName || "Attribute") + " modifier", value: attr });
    var prof = ((tiers[skillEntry.tier] || {}).pool) || 0;
    if (prof) parts.push({ label: "Skill Proficiency Bonus (" + ((tiers[skillEntry.tier] || {}).name || skillEntry.tier) + ")", value: prof });
    (kits || []).forEach(function (k) {
      if (!k.edgeDice) return;
      parts.push({ label: k.name + (k.edgeNote ? ", " + k.edgeNote : ""), value: k.edgeDice });
    });
    // Only one Focus Caliber can apply to a single roll. When the caller has
    // resolved which Focus fires (Skill Focus vs a Tool Focus on an active
    // kit's category), it passes the chosen part via opts; otherwise fall back
    // to the plain Skill Focus read.
    if (opts.focusResolved) { if (opts.focusPart) parts.push(opts.focusPart); }
    else if (skillEntry.focus) parts.push({ label: "Skill Focus (Caliber)", value: caliber || 1 });
    if (skillEntry.specialization) parts.push({ label: "Specialization: " + (skillEntry.name || "Skill"), value: 2 });
    (opts.extraSpecParts || []).forEach(function (p) { parts.push(p); });
    if (opts.prep) parts.push({ label: "Special Preparation", value: 1 });
    if (opts.narrative) parts.push({ label: "Narrative Advantage", value: 1 });
    var points = 0;
    parts.forEach(function (p) { points += p.value; });
    return { points: points, parts: parts };
  },

  /* Dice Pool margin to a Work Interval outcome key (Dice Pool Success Margin table) */
  marginToOutcomeKey: function (margin) {
    if (margin >= 3) return "flawless";
    if (margin >= 1) return "strong";
    if (margin === 0) return "mixed";
    if (margin >= -2) return "failure";
    return "crit";
  },

  /* suggested base Snag Dice by Project tier; the table adjusts from there */
  snagForTier: { simple: 1, standard: 2, advanced: 3, prototype: 4, relic: 5 },

  /* A tier's `skillTier` is an EXPECTATION, not a bar, and it is advisory at every
     Project this app opens. There is deliberately no meetsTier() predicate here:
     one existed briefly, it was asked from the Armor Repair bench lane and from
     nowhere else, and a rule enforced in one of four Project lanes is worse than
     one enforced in none. It gated the cheap 5-percent parts lane while leaving
     the same suit's full rebuild, every Blueprint Build and every custom Project
     wide open to the same untrained crafter.
     Advisory is the app's existing and consistent answer: an untrained crafter
     opens the Project and pays for it in the roll, +2 Snag Dice on every Work
     Interval (see EN.rules.profTiers and the UNTRAINED chip on the bench), which
     is exactly how this ruleset expresses "you may try this without the training".
     `rules.kits` says the same thing about a missing kit: it raises the Target or
     adds Snag, it does not refuse the work. Turning the expectation into a hard
     requirement is a real change to every Project in the app and belongs to
     whoever decides it deliberately, not to an armor patch. */

  /* ---- Armor Repair -------------------------------------------------------
     Armor DR is mutable. The catalog `dr` is the BASE and the ceiling; damage
     lowers a suit's CURRENT DR and repair raises it back, never past the base.
     Two lanes, both priced per POINT of DR restored off the suit's listed price:

       SHOP    10 percent per point. One Downtime period, no roll.
       BENCH    5 percent per point in parts, and it resolves as a Simple Project
                using Engineering like any other. A Portable Fabrication Rig prints
                the plate, so with stock on hand the parts cost nothing; salvage cuts
                or clears it the ordinary way any Project's materials are cut.

     A suit at 0 DR is not repaired, it is rebuilt: a STANDARD Project at full parts
     cost (half the listed price, the same ratio materialCost charges). The book names
     that tier outright and it does not float with the suit, which is why the rebuild
     lane below carries `rebuildTier` rather than asking tierForItem: deriving it made
     a Rare suit rebuild at Advanced and a Legendary one at Prototype.

     Every one of those numbers is a percentage of the suit's LISTED price, which
     for LEASED armor is its Buyout and not its buy-in. See listPrice below.

     Where 10 percent comes from, so nobody retunes it by accident: at that rate
     re-plating a 5 DR suit from 0 costs half its price, exactly the ratio the
     materials rule above already charges to build one from nothing. */
  armorRepair: {
    shopRate: 0.10,
    benchRate: 0.05,
    benchTier: "simple",
    benchSkill: "Engineering",
    freeParts: "Portable Fabrication Rig",
    shopTime: "1 Downtime period",
    // Both lanes take the ITEM, never a bare number, so no call site can hand them
    // a leased suit's deposit by reaching for `it.price` (they all used to).
    shopCost:  function (it, points) { return Math.ceil(EN.crafting.listPrice(it) * this.shopRate  * Math.max(0, points || 0)); },
    benchCost: function (it, points) { return Math.ceil(EN.crafting.listPrice(it) * this.benchRate * Math.max(0, points || 0)); },
    // A breached suit is rebuilt, not repaired: half the listed price in parts, which
    // is materialCost's own ratio. It is now the same number as materialCost for
    // everything, leased included, because materialCost reads listPrice too; the two
    // used to diverge on a leased row and, once listPrice learned Nexus-only rows, on
    // those as well. Kept as its own name because the rebuild lane means something
    // different from a Blueprint even when the figure matches.
    rebuildCost: function (it) { return EN.crafting.materialCost(it); },
    rebuildTier: "standard",
    shopText: "Hand it to a shop. One Downtime period and 10 percent of the suit's listed price per point of DR restored. No roll.",
    benchText: "Do it yourself. A Simple Project using Engineering, parts at 5 percent of the listed price per point. A Portable Fabrication Rig prints the plate from stock, so the parts cost nothing.",
    breachedText: "A suit at 0 DR is past repair. Rebuilding it is a Standard Project at full parts cost.",
    qualityText: "Clean run: the plate seats true, and the next point of DR this suit would lose is absorbed for free."
  },

  /* ---- derivation: map a catalog item to a craft Skill, a Project tier, a cost ---- */
  _availTier:   { Common: "standard", Uncommon: "standard", Rare: "advanced", Iconic: "prototype", Legendary: "prototype", Mythical: "prototype", Artifact: "relic" },
  _tierRank:    { simple: 0, standard: 1, advanced: 2, prototype: 3, relic: 4 },

  // standard ammo (groups Plentiful and Counted) carries the legality tag
  // "As weapon". Specialty ammo and Signature Munitions do NOT, and carry no
  // `category` or `type`, so they are not classified as ammo here and craft at
  // their own availability tier instead of the flat "simple" tier.
  _isAmmo: function (it) { return it && (it.legality === "As weapon" || /Ammunition|Munition|Grenade|Shell/i.test(it.category || it.type || "")); },

  skillForItem: function (it) {
    it = it || {};
    // `group` is read alongside `category` because only the KITS carry a category:
    // the eight Medical Consumables rows carry only group "Medical Consumables", so
    // testing category alone sent every drug and dose to the Engineering default and
    // the bench offered "Build Combat Stim Pack" as an Engineering Project.
    var cat = (it.category || "") + " " + (it.group || ""), traits = it.traits || [];
    if (traits.indexOf("Mystech") !== -1 || it.kind === "focus" || it.wardDie || /Ritual/i.test(cat)) return "Esoterica";
    if (it.cyber || /Systems|Media/i.test(cat)) return "Systems";
    if (/Medical/i.test(cat)) return "Medtech";
    return "Engineering";   // weapons, armor, mechanical tools, parts, mods, ammo default here
  },

  tierForItem: function (it) {
    it = it || {};
    var t = this._availTier[it.availability] || "standard";
    if (this._isAmmo(it)) t = "simple";
    if (it.cyber && this._tierRank[t] < this._tierRank.advanced) t = "advanced";
    // No blanket Mystech force. Part 2 names only an "experimental mystech build" at
    // Prototype, and Part 3 says the crude, repeatedly manufactured Mystech "uses the
    // regular Common through Rare scale instead". _availTier already lifts the genuinely
    // rare Mystech (Iconic, Legendary, Mythical, Artifact) to prototype or relic, so the
    // force only ever hit the cheap end: the Scrap Ward, a 120 Glimmer Common charm, was
    // opening as a Prototype Project at Target 10 with 4 Snag.
    if (it.signature && this._tierRank[t] < this._tierRank.prototype) t = "prototype";
    return t;
  },

  /* Half what the thing is WORTH, which is the same question listPrice answers, so it
     asks listPrice rather than reading `price` itself. It used to read `price`, and once
     listPrice learned to read a Nexus-only row the two disagreed on screen: the
     Blueprints panel offered a brand new Reliquary Shell for `mat 𝒢0` while the Impact
     Table priced rebuilding the damaged one at 𝒢10,000, four inches apart. Measured, the
     only rows where listPrice and price differ are leased ones (which tbBlueprints
     already refuses, `!it.upkeep`) and the two Nexus-only rows, so this moves exactly
     those two Blueprint entries and nothing else in the catalog. rebuildCost is now
     literally this function, which is what its own comment always claimed. */
  materialCost: function (it) { return Math.ceil(EN.crafting.listPrice(it) / 2); },

  /* What the thing is WORTH, as opposed to what it costs to get your hands on it.
     For ordinary gear those are the same number and this returns `price`.

     For LEASED gear they are not. A leased entry's `price` is the buy-in, a deposit
     that buys a week of service and no ownership; the sum that represents the item
     itself is its Buyout, the one-time payment that ends the lease and makes it
     yours. The app already draws that line: inventory.js buyoutCost(it) reads a
     numeric `buyout` or the ◎ figure inside the `nexus` tag, gated on `it.upkeep`
     the way every other lease check is, and the vehicle catalog mapping is explicit
     that a lease row is "price 0 with buyout set". This is that same distinction,
     asked for pricing rather than for a purchase button.

     A Nexus buyout converts at the reference value the economy chapter states, the
     one that "appears in contracts, ledgers, and official books" (EN.economy). That
     is the ledger value of the object, which is exactly the question being asked.

     A row with NO Glimmer price at all is the third case, and it reads the same ◎
     figure for the same reason. The Reliquary Shell is `price: 0, nexus: "◎2+"`: it
     is not sold for Glimmer, so its Glimmer price is 0, and taking that literally
     made a 4 DR Artifact repair for 𝒢0 a point and rebuild for 𝒢0. Nothing is being
     converted and no wallet changes currency; the ◎ figure is being read as the
     ledger value of the object, which is the only question repair pricing asks.
     Measured: it is the one armor row in the catalog with a listed value of zero.

     Anything priced off what a piece is worth (repair per point, a rebuild's parts)
     reads this. Anything priced off what you handed over at the counter keeps
     reading `price`. */
  listPrice: function (it) {
    if (!it) return 0;
    var price = Math.max(0, it.price || 0);
    if (it.upkeep && typeof it.buyout === "number" && it.buyout > 0) return it.buyout;
    // a leased row's ◎ Buyout, or an unpriced row's ◎ asking figure
    if (it.upkeep || !price) {
      var m = String(it.nexus || "").match(/[\d.]+/);
      var rate = (EN.economy && EN.economy.nexusToGlimmer) || 10000;
      if (m) return Math.ceil(parseFloat(m[0]) * rate);
    }
    return price;   // a lease with no stated way out: the deposit is all there is
  },

  tier: function (key) { for (var i = 0; i < this.tiers.length; i++) { if (this.tiers[i].key === key) return this.tiers[i]; } return this.tiers[1]; },
  outcome: function (key) { for (var i = 0; i < this.outcomes.length; i++) { if (this.outcomes[i].key === key) return this.outcomes[i]; } return null; }
};
