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

  intro: "Knowledge, tools, and time, turned into gear that matters. Most work is a downtime Project on the Dice Pool Method; the d20 Method is for emergency fixes under fire.",

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
    { key: "modify", name: "Modify", desc: "Install one mod or customization. One Project per mod. Past the item's Max Mods it becomes a Prototype with a Mandatory Flaw." },
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
    method: "Most crafting is a downtime Project on the Dice Pool Method. Build the pool from the primary Skill and its Attribute, add Edge from kits, Focus, Specialization, setup, and help, apply Snag for missing tools or bad materials, then convert each Work Interval into Progress until it meets the Target.",
    emergency: "The d20 Method is for emergency fixes under pressure: one roll of d20 plus the Skill, and the fix holds for the scene. It rarely creates a permanent upgrade.",
    materials: "Building from scratch, raw materials and components cost half the item's market price. Salvaging parts from similar broken gear can reduce or eliminate that cost.",
    kits: "A kit's Basic Use is open to anyone. Its Proficient Use needs the matching Tool Proficiency; without it you own the kit but not its edge. Missing suitable kits can raise the Target or add Snag.",
    oneProjectPerMod: "Each modification is its own Project. You cannot batch several upgrades into a single roll.",
    overEngineering: "Every weapon and armor has a Max Mods limit and fixed mounts, one mod per mount. Pushing an item past its safe capacity instantly elevates the work to a Prototype Project, and the finished piece carries a Mandatory Flaw: a permanent quirk, a heavy maintenance burden, or an obvious tell.",
    focusSpec: "Inside a Skill Focus you add Edge Dice equal to your Caliber to Work Intervals, and your Caliber to emergency d20 fixes. Inside a Specialization you add plus 2 Edge Dice, and widen your emergency crit range by 1."
  },

  /* ---- derivation: map a catalog item to a craft Skill, a Project tier, a cost ---- */
  _weaponGroups: { Simple: 1, Martial: 1, Sidearm: 1, Longarm: 1, Heavy: 1, Launcher: 1, Thrown: 1, Bowfire: 1 },
  _availTier:   { Common: "standard", Uncommon: "standard", Rare: "advanced", Iconic: "prototype", Legendary: "prototype", Mythical: "prototype", Artifact: "relic" },
  _tierRank:    { simple: 0, standard: 1, advanced: 2, prototype: 3, relic: 4 },

  // ammo and munitions carry the legality tag "As weapon"; use that plus category text
  _isAmmo: function (it) { return it && (it.legality === "As weapon" || /Ammunition|Munition|Grenade|Shell/i.test(it.category || it.type || "")); },

  skillForItem: function (it) {
    it = it || {};
    var cat = it.category || "", traits = it.traits || [];
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
    if ((it.traits || []).indexOf("Mystech") !== -1 && this._tierRank[t] < this._tierRank.prototype) t = "prototype";
    if (it.signature && this._tierRank[t] < this._tierRank.prototype) t = "prototype";
    return t;
  },

  materialCost: function (it) { return Math.ceil((((it && it.price) || 0)) / 2); },

  tier: function (key) { for (var i = 0; i < this.tiers.length; i++) { if (this.tiers[i].key === key) return this.tiers[i]; } return this.tiers[1]; },
  outcome: function (key) { for (var i = 0; i < this.outcomes.length; i++) { if (this.outcomes[i].key === key) return this.outcomes[i]; } return null; }
};
