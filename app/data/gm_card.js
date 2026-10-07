/* ===========================================================================
   ELYSIUM NIGHTS · The GM's Card  (GM Toolkit)
   A transcription of the Game Master's Handbook appendix The GM's Card (PDF
   pages 127 to 131): the Front (six run-in paragraphs in a box) and the Back
   (Dice Pools, Nodes, Sit-Downs, Chases, Heat, Building a Threat and the
   blank threat). RULES ONLY: nothing here is computed. The Card drawer on the
   Admin tabs prints it as a two-sided card.

   Every string is the page's wording, checked against the handbook text by a
   script. Headings and column names are printed in capitals on the page; they
   are stored in title case here and the drawer sets the case. Where the card
   repeats a number the app already carries, the card's own text is kept and a
   `sameAs` comment names the key that holds it, so the two can be checked
   against each other (they agree, except where a comment says otherwise).

   SHAPE (for the drawer):
     EN.gmBook.card = { schemaVersion, title, sides: [side, side] }
     side     { key: "front"|"back", name, boxed, sections: [section, ...] }
              `boxed` is true for the Front, which the page prints in a box.
     section  { key, name, runIn, blocks: [block, ...] }
              `runIn` true means the page prints no heading for the section:
              its name is the bold run-in that opens its first text block.
              Otherwise `name` is the section heading.
     block    one of three kinds, in page order:
       { kind: "text", md, text, values? }
              `md` carries the page's bold runs as **...**: render it with
              EN.ui.applyInline. `text` is the same words with no markers, for
              copying. `values` carries the numbers the sentence prints.
       { kind: "table", key, columns: [{key, name}], rows: [row, ...] }
              row.cells is the printed row, one string per column, "" where
              the page leaves a cell empty. The first column is printed bold.
              The other fields on a row are the same values typed, for
              screens that compute with them.
       { kind: "template", key, head, sub, rows: [[cell, ...], ...] }
              The blank threat: `head` fills the header bar, `sub` is the bold
              italic line under it, each row is the label and hint pairs the
              page prints on one line (label bold, hint italic). `field` on a
              cell, `headField` and `subFields` are APP LINKS, not book text:
              the keys of the built threat block (EN.gmEngine.buildThreat)
              that each line holds.

   Page references (// GMH pNN) are PDF page numbers of the handbook; the folio
   printed on each page runs 4 lower. User-facing text carries no page numbers.

   No em or en dashes anywhere in this file (house style). The bullet in the
   blank threat's second line is the page's own.
   =========================================================================== */
window.EN = window.EN || {}; EN.gmBook = EN.gmBook || {};

EN.gmBook.card = {
  schemaVersion: 1,

  // GMH p127
  title: "The GM's Card",

  sides: [
    /* ---- FRONT -------------------------------------------------------------
       Six paragraphs in one box, each opened by a bold run-in. */
    { key: "front", name: "Front", boxed: true, sections: [

      /* sameAs EN.threats.array (attack, dc, defense, vitality, drLow and
         drHigh, damage, strong, weak). */
      // GMH p127
      { key: "array", name: "Standard Threat Array", runIn: true, blocks: [
        { kind: "text",
          md: "**Standard Threat Array.** G1: +5, DC 12, Def 12, Vit 20, DR 0-1, ~7 damage. G2: +6, DC 13, Def 13, Vit 30, DR 1-2, ~10. G3: +7, DC 14, Def 14, Vit 50, DR 2-3, ~15. G4: +9, DC 15, Def 15, Vit 70, DR 3-4, ~21. G5: +10, DC 16, Def 16, Vit 95, DR 4-5, ~28. Saves: strong +3 plus Grade, weak +1/+1/+2/+2/+3 by Grade.",
          text: "Standard Threat Array. G1: +5, DC 12, Def 12, Vit 20, DR 0-1, ~7 damage. G2: +6, DC 13, Def 13, Vit 30, DR 1-2, ~10. G3: +7, DC 14, Def 14, Vit 50, DR 2-3, ~15. G4: +9, DC 15, Def 15, Vit 70, DR 3-4, ~21. G5: +10, DC 16, Def 16, Vit 95, DR 4-5, ~28. Saves: strong +3 plus Grade, weak +1/+1/+2/+2/+3 by Grade." }
      ] },

      /* sameAs EN.threats.designations (minion vitalityByGrade, damageMult,
         noDefensiveImpulse; elite vitalityMult, defense, dc, damageMultLow and
         damageMultHigh; solo vitalityMult, defense, dc, surgesByGrade,
         unshakable, breakpoint, weakness). The card leaves out the Solo's
         triple damage, which EN.threats carries from Building a Solo. */
      // GMH p127
      { key: "designations", name: "Designations", runIn: true, blocks: [
        { kind: "text",
          md: "**Designations.** Minion: Vit 6/10/15/25/35, 60 percent damage, no defensive Impulse. Elite: double Vitality, +1 Defense and DC, 1.5 to 2x damage. Solo: quadruple Vitality, +1 Defense, +2 DC, Surges (2 per round, 3 at G3+), one defensive Impulse per Freelancer turn, Unshakable, a Breakpoint, and a findable weakness.",
          text: "Designations. Minion: Vit 6/10/15/25/35, 60 percent damage, no defensive Impulse. Elite: double Vitality, +1 Defense and DC, 1.5 to 2x damage. Solo: quadruple Vitality, +1 Defense, +2 DC, Surges (2 per round, 3 at G3+), one defensive Impulse per Freelancer turn, Unshakable, a Breakpoint, and a findable weakness." }
      ] },

      /* sameAs EN.threats.budget (shareByCaliber, difficulties mult, soloNote)
         and EN.gmBook.encounters.budget. */
      // GMH p127
      { key: "budgets", name: "Budgets", runIn: true, blocks: [
        { kind: "text",
          md: "**Budgets.** Share per Freelancer: 100/150/250/350/450 by Caliber. Milk Run half, Fair Fight 1x, Hard Contract 1.5x, Red Work 2x. A matched-Grade Solo alone is a Fair Fight for four.",
          text: "Budgets. Share per Freelancer: 100/150/250/350/450 by Caliber. Milk Run half, Fair Fight 1x, Hard Contract 1.5x, Red Work 2x. A matched-Grade Solo alone is a Fair Fight for four." }
      ] },

      /* sameAs EN.resolution.d20.dcTable (the six steps) and
         EN.gmBook.hazards.dcByGrade, EN.threats.hazardDCByGrade (by Grade). */
      // GMH p127
      { key: "dcs", name: "DCs on the fly", runIn: true, blocks: [
        { kind: "text",
          md: "**DCs on the fly.** Very Easy 5, Easy 10, Standard 15, Hard 20, Very Hard 25, Nearly Impossible 30. Hazards by Grade: 12 / 13 / 15 / 16 / 18.",
          text: "DCs on the fly. Very Easy 5, Easy 10, Standard 15, Hard 20, Very Hard 25, Nearly Impossible 30. Hazards by Grade: 12 / 13 / 15 / 16 / 18." }
      ] },

      /* sameAs EN.combat.cover (Half +2, Three-Quarter +5),
         EN.combat.coverMaterials and EN.gmBook.hazards.objects.materials (the
         six Structure/Integrity pairs), EN.gmBook.hazards.falling. */
      // GMH p127
      { key: "room", name: "The room", runIn: true, blocks: [
        { kind: "text",
          md: "**The room.** Cover: +2 Half, +5 Three-Quarter. Structure/Integrity: Fragile 5/3, Cheap 7/8, Average 9/12, Heavy 11/18, Fortified 14/24, Hardened 18/40. Falling: 1d6 per 2 spaces.",
          text: "The room. Cover: +2 Half, +5 Three-Quarter. Structure/Integrity: Fragile 5/3, Cheap 7/8, Average 9/12, Heavy 11/18, Fortified 14/24, Hardened 18/40. Falling: 1d6 per 2 spaces." }
      ] },

      /* sameAs EN.gmBook.encounters.security (tiers roundsMin and roundsMax,
         escalation everyRounds and onAlert). */
      // GMH p127
      { key: "response", name: "Response clock", runIn: true, blocks: [
        { kind: "text",
          md: "**Response clock.** Soft 8-10 rounds, Working 5-6, Hardened 3-4, Black 2. Escalate every 3 loud rounds or on an Alert.",
          text: "Response clock. Soft 8-10 rounds, Working 5-6, Hardened 3-4, Black 2. Escalate every 3 loud rounds or on an Alert." }
      ] }
    ] },

    /* ---- BACK --------------------------------------------------------------
       Six headed sections of tables, in page order. */
    { key: "back", name: "Back", boxed: false, sections: [

      // GMH p127 (both tables), p128 (the ladder line)
      { key: "pools", name: "Dice Pools", runIn: false, blocks: [
        /* sameAs EN.resolution.pool.snagAssign (risk and dice) and the flat DC
           ladder in EN.resolution.pool.snagFromDcIntro. */
        { kind: "table", key: "risk",
          columns: [ { key: "risk", name: "Risk Level" }, { key: "snag", name: "Snag Dice" }, { key: "dc", name: "Flat DC" } ],
          rows: [
            { key: "easy",       cells: ["Easy", "1", "DC 10"],              risk: "Easy",              snag: 1, dc: 10 },
            { key: "moderate",   cells: ["Moderate", "2", "DC 15"],          risk: "Moderate",          snag: 2, dc: 15 },
            { key: "hard",       cells: ["Hard", "3", "DC 20"],              risk: "Hard",              snag: 3, dc: 20 },
            { key: "daunting",   cells: ["Daunting", "4", "DC 25"],          risk: "Daunting",          snag: 4, dc: 25 },
            { key: "impossible", cells: ["Nearly Impossible", "5", "DC 30"], risk: "Nearly Impossible", snag: 5, dc: 30 }
          ] },
        /* sameAs the die reading in EN.resolution.pool.procedure. `max` is null
           on the open top row. */
        { kind: "table", key: "reading",
          columns: [ { key: "shows", name: "Die Shows" }, { key: "counts", name: "Counts As" } ],
          rows: [
            { key: "nothing", cells: ["1 to 5", "Nothing"],    min: 1,  max: 5,    counts: 0 },
            { key: "one",     cells: ["6 to 9", "One"],        min: 6,  max: 9,    counts: 1 },
            { key: "two",     cells: ["10 or higher", "Two"],  min: 10, max: null, counts: 2 }
          ] },
        /* sameAs the second paragraph of EN.resolution.pool.snagFromDcIntro,
           the rule EN.grid.scanning applies. */
        { kind: "text",
          md: "A ladder with named tiers gives one Snag Die per tier, in order.",
          text: "A ladder with named tiers gives one Snag Die per tier, in order." }
      ] },

      // GMH p128
      { key: "nodes", name: "Nodes", runIn: false, blocks: [
        /* sameAs EN.grid.nodeTiers (security, saveBonus, integrity). The values
           agree; the numbering does not: the card prints each tier's rank in
           brackets from -1 (Rudimentary) to 5 (Apex), which is `rank` here,
           while EN.grid counts `t` from 0 to 6. `integrity` is null where the
           card prints "none". */
        { kind: "table", key: "tiers",
          columns: [ { key: "tier", name: "Tier" }, { key: "security", name: "Security Rating" },
                     { key: "cipherSave", name: "Cipher Save" }, { key: "integrity", name: "System Integrity" } ],
          rows: [
            { key: "rudimentary", cells: ["Rudimentary [-1]", "10", "+3", "none"], tier: "Rudimentary", rank: -1, security: 10, cipherSave: 3, integrity: null },
            { key: "standard",    cells: ["Standard [0]", "12", "+4", "none"],     tier: "Standard",    rank: 0,  security: 12, cipherSave: 4, integrity: null },
            { key: "improved",    cells: ["Improved [1]", "14", "+5", "20"],       tier: "Improved",    rank: 1,  security: 14, cipherSave: 5, integrity: 20 },
            { key: "advanced",    cells: ["Advanced [2]", "16", "+6", "30"],       tier: "Advanced",    rank: 2,  security: 16, cipherSave: 6, integrity: 30 },
            { key: "premium",     cells: ["Premium [3]", "18", "+7", "35"],        tier: "Premium",     rank: 3,  security: 18, cipherSave: 7, integrity: 35 },
            { key: "elite",       cells: ["Elite [4]", "20", "+8", "40"],          tier: "Elite",       rank: 4,  security: 20, cipherSave: 8, integrity: 40 },
            { key: "apex",        cells: ["Apex [5]", "21", "+9", "50"],           tier: "Apex",        rank: 5,  security: 21, cipherSave: 9, integrity: 50 }
          ] },
        /* sameAs EN.grid.hardenedNote. The card limits Hardened to Improved
           and up; EN.grid.hardenedNote states no lower limit. */
        { kind: "text",
          md: "**Hardened** (Improved and up): add the Tier to Cipher Save.",
          text: "Hardened (Improved and up): add the Tier to Cipher Save.",
          values: { fromTier: "Improved", fromRank: 1 } },
        /* sameAs EN.grid.firewalls (securityBonus and threshold, which are the
           same number on every row). One printed column holds both, so
           `bonus` is added to the Security Rating and is also the Damage
           Threshold. */
        { kind: "table", key: "firewall",
          columns: [ { key: "tier", name: "Firewall" }, { key: "bonus", name: "Security Rating and Damage Threshold" } ],
          rows: [
            { key: "standard", cells: ["Standard", "+2"], tier: "Standard", bonus: 2 },
            { key: "improved", cells: ["Improved", "+3"], tier: "Improved", bonus: 3 },
            { key: "advanced", cells: ["Advanced", "+4"], tier: "Advanced", bonus: 4 },
            { key: "premium",  cells: ["Premium", "+5"],  tier: "Premium",  bonus: 5 },
            { key: "elite",    cells: ["Elite", "+6"],    tier: "Elite",    bonus: 6 },
            { key: "apex",     cells: ["Apex", "+7"],     tier: "Apex",     bonus: 7 }
          ] },
        /* sameAs EN.grid.ic (responses), EN.grid.icCounter (the Counterattack
           dice) and EN.grid.icResponses (Analyze and Lockdown in full).
           `counterattack` is the printed dice, or null where the tier has
           none. */
        { kind: "table", key: "ic",
          columns: [ { key: "tier", name: "IC" }, { key: "responses", name: "Responses" } ],
          rows: [
            { key: "basic",      cells: ["Basic", "Alert"], tier: "Basic",
              responses: ["Alert"], counterattack: null },
            { key: "advanced",   cells: ["Advanced", "Alert, Analyze (+2 Cipher Save against that hacker, stacking)"], tier: "Advanced",
              responses: ["Alert", "Analyze"], counterattack: null },
            { key: "adaptive",   cells: ["Adaptive", "Alert, Analyze, Counterattack (3d6)"], tier: "Adaptive",
              responses: ["Alert", "Analyze", "Counterattack"], counterattack: "3d6" },
            { key: "aggressive", cells: ["Aggressive", "Alert, Analyze, Counterattack (4d6), Lockdown (no voluntary disconnect for 1d4 rounds, and a #GRID Guardian is on its way)"], tier: "Aggressive",
              responses: ["Alert", "Analyze", "Counterattack", "Lockdown"], counterattack: "4d6" }
          ] }
      ] },

      // GMH p129
      { key: "sitdowns", name: "Sit-Downs", runIn: false, blocks: [
        /* sameAs the player-side Sit-Down reference in js/face.js (the Tier and
           Resolve table) and the Resolve line the Bestiary prints on People
           entries (for example "3 (Pushover)"). `orMore` marks Apex's "16+". */
        { kind: "table", key: "opposition",
          columns: [ { key: "tier", name: "Opposition" }, { key: "resolve", name: "Resolve" } ],
          rows: [
            { key: "pushover", cells: ["Pushover", "3"],  tier: "Pushover", resolve: 3,  orMore: false },
            { key: "standard", cells: ["Standard", "5"],  tier: "Standard", resolve: 5,  orMore: false },
            { key: "hardened", cells: ["Hardened", "8"],  tier: "Hardened", resolve: 8,  orMore: false },
            { key: "iron",     cells: ["Iron", "12"],     tier: "Iron",     resolve: 12, orMore: false },
            { key: "apex",     cells: ["Apex", "16+"],    tier: "Apex",     resolve: 16, orMore: true }
          ] },
        /* The Pressure each result deals to the Opposition's Resolve. The
           Flawless 3, Strong 2, Mixed 1 also appear in the player-side
           Sit-Down text in js/face.js. `also` is the third column, null where
           it is empty; `resolveGain` is the 1 Resolve a Critical gives the
           target. */
        { kind: "table", key: "results",
          columns: [ { key: "result", name: "Result" }, { key: "pressure", name: "Pressure" }, { key: "also", name: "Also" } ],
          rows: [
            { key: "flawless", cells: ["Flawless", "3", ""], result: "Flawless", pressure: 3, also: null },
            { key: "strong",   cells: ["Strong", "2", ""],   result: "Strong",   pressure: 2, also: null },
            { key: "mixed",    cells: ["Mixed", "1", "The target picks the crew's Social Fallout"], result: "Mixed", pressure: 1,
              also: "The target picks the crew's Social Fallout" },
            { key: "failure",  cells: ["Failure", "0", "Social Fallout possible"], result: "Failure", pressure: 0,
              also: "Social Fallout possible" },
            { key: "critical", cells: ["Critical", "0", "The target gains 1 Resolve; strong Social Fallout"], result: "Critical", pressure: 0,
              also: "The target gains 1 Resolve; strong Social Fallout", resolveGain: 1 }
          ] },
        { kind: "text",
          md: "The Opposition gets one Posture a Round.",
          text: "The Opposition gets one Posture a Round.",
          values: { posturesPerRound: 1 } }
      ] },

      // GMH p129 (both tables), p130 (the rules line)
      { key: "chases", name: "Chases", runIn: false, blocks: [
        /* `gapSpaces` is the Gap column's two numbers in printed order, which
           the page sets beside the band's two Leads; null where the Gap cell
           is empty. */
        { kind: "table", key: "lead",
          columns: [ { key: "lead", name: "Lead" }, { key: "band", name: "Band" }, { key: "gap", name: "Gap" } ],
          rows: [
            { key: "contact", cells: ["0", "Contact", ""],                band: "Contact", leadMin: 0, leadMax: 0, gapSpaces: null },
            { key: "close",   cells: ["1 to 2", "Close", "6 and 12 spaces"],    band: "Close",   leadMin: 1, leadMax: 2, gapSpaces: [6, 12] },
            { key: "distant", cells: ["3 to 4", "Distant", "24 and 48 spaces"], band: "Distant", leadMin: 3, leadMax: 4, gapSpaces: [24, 48] },
            { key: "escape",  cells: ["5", "Escape", ""],                 band: "Escape",  leadMin: 5, leadMax: 5, gapSpaces: null }
          ] },
        /* sameAs EN.gmBook.hazards.stalemate.impactBySpeed (same keys). */
        { kind: "table", key: "impact",
          columns: [ { key: "speed", name: "Speed" }, { key: "dc", name: "Impact DC" } ],
          rows: [
            { key: "stopped",  cells: ["Stopped", "10"],   speed: "Stopped",   dc: 10 },
            { key: "slow",     cells: ["Slow", "12"],      speed: "Slow",      dc: 12 },
            { key: "standard", cells: ["Standard", "14"],  speed: "Standard",  dc: 14 },
            { key: "fast",     cells: ["Fast", "16"],      speed: "Fast",      dc: 16 },
            { key: "veryfast", cells: ["Very Fast", "18"], speed: "Very Fast", dc: 18 }
          ] },
        /* The stalemate sentence is the rule EN.gmBook.hazards.stalemate.rule
           states at length. The Dominant Victory thresholds are the chase's
           own: the general contested table,
           EN.resolution.collaborative.contested.outcomes, puts Dominant
           Victory at +10 on a d20 and +3 in Dice Pools. The card does not say
           how "half the crew's Heat" rounds. */
        // GMH p130
        { kind: "text",
          md: "**Start** at Lead 2. **Dominant Victory** at +5 on d20, +3 in Dice Pools. **Stalemate:** each pilot makes a Control Check against the Impact DC for their speed; a failure is Snag on the next Chase Check. **First response** in 5 minus half the crew's Heat, minimum 1.",
          text: "Start at Lead 2. Dominant Victory at +5 on d20, +3 in Dice Pools. Stalemate: each pilot makes a Control Check against the Impact DC for their speed; a failure is Snag on the next Chase Check. First response in 5 minus half the crew's Heat, minimum 1.",
          values: { startLead: 2, dominantD20: 5, dominantPool: 3, firstResponseFrom: 5, firstResponseMin: 1 } }
      ] },

      /* sameAs EN.gmBook.heat (the Heat Check and the Ladder's fight column).
         `difficulty` keys match EN.threats.budget.difficulties, null for "No
         fight"; `bounty` marks the top band's Bounty on the Exchange. */
      // GMH p130
      { key: "heat", name: "Heat", runIn: false, blocks: [
        { kind: "text",
          md: "Each Downtime, roll a d10 per source against the crew's highest Heat with it. At or under, it acts (at Heat 10, always).",
          text: "Each Downtime, roll a d10 per source against the crew's highest Heat with it. At or under, it acts (at Heat 10, always).",
          values: { die: "d10", sides: 10, alwaysAt: 10 } },
        { kind: "table", key: "fight",
          columns: [ { key: "heat", name: "Heat" }, { key: "fight", name: "If It Comes to a Fight" } ],
          rows: [
            { key: "h1", cells: ["1 to 2", "No fight"],        heatMin: 1, heatMax: 2,  difficulty: null,   bounty: false },
            { key: "h3", cells: ["3 to 4", "A Milk Run"],      heatMin: 3, heatMax: 4,  difficulty: "milk", bounty: false },
            { key: "h5", cells: ["5 to 6", "A Fair Fight"],    heatMin: 5, heatMax: 6,  difficulty: "fair", bounty: false },
            { key: "h7", cells: ["7 to 8", "A Hard Contract"], heatMin: 7, heatMax: 8,  difficulty: "hard", bounty: false },
            { key: "h9", cells: ["9 to 10", "Red Work every time, plus a Bounty on the Exchange"],
              heatMin: 9, heatMax: 10, difficulty: "red", bounty: true }
          ] }
      ] },

      // GMH p130 (both tables), p131 (the wheel line and the blank threat)
      { key: "threat", name: "Building a Threat", runIn: false, blocks: [
        /* sameAs EN.threats.initiative (base, byDesignation, byRole). `group`
           says which map a row's adjustment lives in; the Base row adds the
           threat's Grade (`plusGrade`). */
        { kind: "table", key: "initiative",
          columns: [ { key: "initiative", name: "Initiative" }, { key: "adj", name: "Adjustment" } ],
          rows: [
            { key: "base",       cells: ["Base", "Grade + 2"], group: "base",        adj: 2, plusGrade: true },
            { key: "minion",     cells: ["Minion", "-1"],      group: "designation", adj: -1 },
            { key: "bruiser",    cells: ["Bruiser", "-1"],     group: "role",        adj: -1 },
            { key: "skirmisher", cells: ["Skirmisher", "+1"],  group: "role",        adj: 1 },
            { key: "ghost",      cells: ["Ghost", "+2"],       group: "role",        adj: 2 }
          ] },
        /* sameAs the "Threat pilots" rule in EN.bestiary.vehicles.rules.
           Moving Defense is 10 + the vehicle's Handling + `bonus`. */
        { kind: "table", key: "pilot",
          columns: [ { key: "grade", name: "Threat Pilot's Grade" }, { key: "defense", name: "Moving Defense" } ],
          rows: [
            { key: "g1", cells: ["G1 to G2", "10 + Handling + 2"], gradeMin: 1, gradeMax: 2, base: 10, bonus: 2 },
            { key: "g3", cells: ["G3 to G4", "10 + Handling + 4"], gradeMin: 3, gradeMax: 4, base: 10, bonus: 4 },
            { key: "g5", cells: ["G5", "10 + Handling + 6"],       gradeMin: 5, gradeMax: 5, base: 10, bonus: 6 }
          ] },
        /* sameAs the same rule in EN.bestiary.vehicles.rules. */
        // GMH p131
        { kind: "text",
          md: "A threat at the wheel pilots at Attack + Handling.",
          text: "A threat at the wheel pilots at Attack + Handling." },
        // GMH p131
        { kind: "text",
          md: "**Blank threat.**",
          text: "Blank threat." },
        /* The page prints the XP row as two pairs split differently from the
           three-pair rows above it; the drawer lays each row's pairs out
           evenly. */
        // GMH p131
        { kind: "template", key: "blankThreat",
          head: "Threat Name",
          sub: "Grade • Designation • Role • Size/Type",
          headField: "name",
          subFields: ["grade", "designation", "role", "size", "type"],
          rows: [
            [ { label: "Defense", hint: "value", field: "defense" },
              { label: "DR", hint: "value", field: "dr" },
              { label: "Vitality", hint: "value", field: "vitality" } ],
            [ { label: "Initiative", hint: "value", field: "init" },
              { label: "Speed", hint: "value", field: "speed" },
              { label: "Passive Perception", hint: "value", field: "passivePerception" } ],
            [ { label: "Saves", hint: "+value and +value", field: "saves" } ],
            [ { label: "Attack/Ability", hint: "+ value vs Defense, range, dice (avg)", field: "attacks" } ],
            [ { label: "Attack/Ability", hint: "+ value vs Defense, range, dice (avg)", field: "attacks" } ],
            [ { label: "Trait", hint: "description", field: "trait" } ],
            [ { label: "Impulse", hint: "description", field: "impulse" } ],
            [ { label: "XP", hint: "value", field: "xp" },
              { label: "Resolve", hint: "value", field: "resolve" } ],
            [ { label: "Gear", hint: "What the body leaves", field: "gear" } ]
          ] }
      ] }
    ] }
  ]
};
