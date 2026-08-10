/* ===========================================================================
   ELYSIUM NIGHTS · Status Changes
   The menu behind the Status Changes panel: every temporary state a Freelancer
   can be put under, grouped the way the panel offers them.

   This file is a REGISTRY, not a second rules source. Every option here points
   at state that already exists somewhere else (an exposure row, a deprivation
   clock, a breath clock, the caustic zone, a Hot-Wire tuning, a catalog
   consumable) and carries only what the panel needs to offer it and to switch
   it on: a stable key, a display name, and the kind of state it drives. The
   prose comes from the owning source at render time, so nothing here can drift
   from the chapter it describes.

   EXTENDING IT. The spec asks for this to grow rather than be rewritten, so
   every menu is built by walking data that already exists. Adding an Aftermarket
   Hot-Wire tuning, an exposure type or a consumable adds an option here with no
   edit to this file. To add a whole new GROUP, push onto EN.statusChanges.bonus
   .groups (or .hazard.groups); the panel renders whatever it finds and the store
   sanitizes against optionByKey, so a new group needs no store or panel change.

   Option keys are namespaced ("exposure:cold", "bonus:pneumatic-bypass") and are
   what gets persisted. They are stable identifiers: renaming a display name is
   free, changing a key is a migration.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.statusChanges = (function () {

  var H = EN.hazards || {};
  var E = H.exposure || {};

  /* ---- Hazards ---------------------------------------------------------
     Three groups, per the spec. Two placement decisions are baked in here
     rather than left to the panel:

     DROWNING IS NOT HERE. It is more a condition than an environmental
     hazard, so it lives in the conditions dropdown and its breath clock
     renders inside the Drowning condition. The breath spec is still shared
     with Vacuum (EN.hazards.breath), so the two cannot drift.

     GEAR DEGRADATION IS NOT ITS OWN ENTRY. It is a rider on Caustic Air &
     Sludge, where it is most relevant, and renders inside it. */
  var hazardGroups = [
    {
      key: "exposure",
      name: "Exposure",
      // Cold, Heat and Thin Air. Deprivation is deliberately absent: it is
      // severityDriven:false and runs its own day-scale clocks, so it is its
      // own group below rather than a fourth exposure.
      options: (E.types || []).filter(function (t) { return t.severityDriven; }).map(function (t) {
        return {
          key: "exposure:" + t.key,
          name: t.name,
          kind: "exposure",
          type: t.key,
          // Severity sets the interval and nothing else, and it can change
          // while an exposure runs (weather turns), so it is picked on the ROW
          // rather than frozen into the menu option. Harsh is the default
          // because it is the middle rung, not because the rules prefer it.
          defaultSeverity: "harsh",
          summary: t.rider || ""
        };
      })
    },
    {
      key: "deprivation",
      name: "Deprivation",
      options: ((E.deprivation || {}).tracks || []).map(function (t) {
        return {
          key: "deprivation:" + t.key,
          name: t.name,
          kind: "deprivation",
          track: t.key,
          summary: "Threshold: " + t.crossed + ". Its own clock, its own DC, its own Fatigue."
        };
      })
    },
    {
      key: "environmental",
      name: "Environmental",
      options: [
        { key: "environmental:vacuum", kind: "breath", track: "vacuum", name: "Vacuum",
          summary: "Held breath, then an escalating Body Save every round. A vacuum-rated seal sits it out." },
        { key: "environmental:caustic", kind: "caustic", name: "Caustic Air & Sludge",
          summary: "Damage while you stand in it, residue that clings after you leave, and a full scene of it costs your suit 1 DR." }
      ]
    }
  ];

  /* ---- Bonuses ---------------------------------------------------------
     Class Buffs and Consumables. Both are player-declared: the sheet cannot
     derive either of them, which is the whole reason this menu exists.

     CLASS BUFFS are the Ripper Aftermarket Hot-Wires. A Stitcher installs
     these on an ALLY, so the recipient's own record has no way to know one is
     live; the player says so. Pneumatic Bypass is the one with a mechanical
     consequence the engine already knows how to apply (it steps the unarmed
     strike), and that wiring lives in engine.js keyed on the option key below.
     The other five are recorded and displayed; none of them touches a number
     this sheet computes. */
  var tunings = (((EN.classes || {}).stitcher || {}).extra || {}).aftermarketTunings || [];

  function slug(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  var classBuffs = tunings.map(function (t) {
    return {
      key: "bonus:" + slug(t.name),
      name: t.name,
      kind: "classBuff",
      source: "Ripper Hot-Wired Implants",
      requires: t.requires || "",
      summary: t.text || "",
      // An ally can hold only one Hot-Wire at a time, and it lasts until the
      // installer's next Short or Long Rest. The panel enforces the first and
      // says the second; it does not tick anybody else's rest clock.
      exclusiveGroup: "hotwire",
      endsOn: "The installer's next Short or Long Rest, when it must be recalibrated or it powers down."
    };
  });

  /* CONSUMABLES that leave a lasting state behind. A Vita-Pop is a heal and
     not a status, so it is not here; a Combat Stim Pack runs for three turns
     and is. Each names a catalog item by NAME and takes its prose from the
     catalog at render time, so this list carries no duplicated rules text.
     Growing it is one entry per item. */
  var CONSUMABLE_STATUSES = [
    { item: "Combat Stim Pack",   endsOn: "End of your 3rd turn, then a Body save DC 12 or Dazed 1 round." },
    { item: "Nightwatch Tablets", endsOn: "4 hours, or extended by a fresh dose at the cost of a Crash Stack." },
    { item: "Detox Patch",        endsOn: "8 hours." }
  ];

  var consumables = CONSUMABLE_STATUSES.map(function (c) {
    return {
      key: "bonus:" + slug(c.item),
      name: c.item,
      kind: "consumable",
      source: "Consumables",
      itemName: c.item,          // resolved against the gear catalog at render time
      endsOn: c.endsOn
    };
  });

  var bonusGroups = [
    { key: "classBuffs",  name: "Class Buffs",  options: classBuffs },
    { key: "consumables", name: "Consumables",  options: consumables }
  ];

  /* ---- lookup ----------------------------------------------------------
     Null-prototype, because it is indexed by keys that arrive out of a save
     file. A stored key of "constructor" or "toString" would otherwise resolve
     through the prototype chain and read as a real option. This is the same
     hazard the equipment split and the hazard maps already answer this way. */
  var optionByKey = Object.create(null);
  var menus = { hazard: { placeholder: "- add a Hazard -", groups: hazardGroups },
                bonus:  { placeholder: "- add a Bonus -",  groups: bonusGroups } };

  Object.keys(menus).forEach(function (menuKey) {
    menus[menuKey].groups.forEach(function (g) {
      (g.options || []).forEach(function (o) {
        o.menu = menuKey;
        o.groupKey = g.key;
        o.groupName = g.name;
        optionByKey[o.key] = o;
      });
    });
  });

  return {
    hazard: menus.hazard,
    bonus: menus.bonus,
    optionByKey: optionByKey,
    // every key any menu can produce, for the store's sanitizer
    isKey: function (k) { return typeof k === "string" && !!optionByKey[k]; },
    get: function (k) { return (typeof k === "string" && optionByKey[k]) || null; }
  };
})();
