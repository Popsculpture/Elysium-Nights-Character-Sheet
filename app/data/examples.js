/* ===========================================================================
   ELYSIUM NIGHTS - Pre-made example Freelancers

   Empty for now: the seven original pre-mades were retired on 28 October 2026
   and new ones are on the way. While this list is empty the gate shows no
   pre-made section, the switcher and Manage characters list no examples, and
   everything else behaves as if the feature were not there.

   HOW TO ADD A PRE-MADE. Drop a record into EN.examples below. It is DEFINED
   HERE AND NEVER STORED: store.setExample(key) mints a fresh copy on every
   selection, so an example cannot be deleted or drift, and edits to it vanish on
   reload. SAVE AS MY OWN (store.adoptExample) copies one into the real roster.
   It then shows on the gate's pre-made grid, the On File switcher and Manage
   characters, with no other code to touch.

   Each entry is a PATCH over a real blank character (newCharacter() in store.js), not a
   full record, so it inherits every future default field for free. migrate()
   then normalizes it exactly as it would an import. The shape:

     {
       key:   "codebreaker",               // unique; the live copy's id is "ex_" + key
       name:  "First \"Handle\" Last",      // the full display name
       label: "Codebreaker",               // the class line on the gate card and switcher
       blurb: "One line for the gate card.",
       patch: {                            // any character fields; objects merge deeply
         firstName: "First", lastName: "Last",
         level: 5, species: "humans", lineage: "nextgen", background: "cipher-punk",
         class: "codebreaker", subclass: "gridweaver",
         attributes: { TEC: 16, WIT: 15, AGI: 13, PRE: 12, MYS: 10, BOD: 10 },
         identity: { handle: "Handle", concept: "...", whereFrom: "..." },
         equipment: [ ... ],                // item names must resolve in the gear catalog
         universalUpgrades: { ... }, weaponParts: { ... }
       }
     }

   Arrays (equipment and the like) replace the blank's array outright; plain
   objects merge key by key. Keep chrome off a pre-made: the Chrome card reads an
   implant's text straight off the stored object, so shipping one would copy
   catalog prose into this file.
   =========================================================================== */
window.EN = window.EN || {};

EN.examples = [];
