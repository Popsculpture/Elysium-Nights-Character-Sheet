/* ===========================================================================
   ELYSIUM NIGHTS · Bestiary  (GM Toolkit)
   The 48 statblocks of the Game Master's Handbook, The Bestiary (PDF pages 67
   to 99), regenerated from the handbook on 2026-10-06, with the reference
   matter the chapter prints around them: its intro, the category intros, the
   subgroup run-ins, the cryptid hunt procedure, the Species Templates and the
   Hostile Vehicles. THE BOOK'S PRINTED NUMBERS ARE THE NUMBERS, always: where
   an entry does not reproduce what the threat generator would build, the page
   wins. The handbook is the text of record and the app does not get to
   quietly correct it.

   THE WORDING IS THE BOOK'S, contractions and capitals included ("doesn't",
   "1 (Hypeplate)"). The 33-entry file this replaces spelled contractions out
   and lowercased item names; that house style is gone, so every string here
   can be found in the handbook as printed. Line breaks are rejoined and page
   furniture is dropped; nothing else was changed. Surge names keep the book's
   italics as *...*, and the one bold cross-reference (**Remembers**, in a
   Kettle Dog hook) as **...**. Both sit only in ability and hook text, which
   the card runs through EN.ui.applyInline.

   THE FIELD SET IS NOT UNIFORM, and that is the book's design rather than an
   export artifact:
     - 46 entries carry the physical block (Defense, DR, Vitality, Speed,
       Initiative, Saves, Passive Perception). Two #GRID entries do NOT: a
       digital threat runs on Node math, so Feral Script carries Security
       Rating, Cipher Save, System Integrity and a Firewall Damage Threshold,
       and the #GRID Guardian carries a third shape again (Cipher Attack and
       Cipher Save DC, with its Persona Node as an ability).
     - Resolve is on 23 entries only. Its ABSENCE is meaningful: it means the
       conversation is over before it starts, so a renderer must leave it out
       rather than print a blank.
     - XP is on every entry as the printed string ("1,000"; the Nixie's runs
       on into a sentence). EN.gmEngine.xpOf reads its leading number.
     - People leave `gear` (23, and the Afterimage carries one too, 24 in
       all); `salvage` is on 20 and `signs` on the 5 cryptids. 7 add a
       `gmNote` (the book's GM Guidance), 4 a `variant`, 4 a named skill
       bonus in `skills`, 1 a list of job `hooks`, and the 4 Solos the
       line "Unshakable, Defensive Impulses" inside `stats`. The Cascade
       Orphan alone prints `Immune` and `Resistance` lines, also in `stats`.
     - `role` is null on the 8 entries the book prints no Role for (the
       Index calls them "none"), and an ability with no printed cost has
       `cost: null`.

   SUBGROUPS. The People and the Flow Side print run-in subheads, each with a
   short intro, ahead of the entries they cover. `subgroups[]` carries them in
   book order, and an entry's `subgroup` is that subgroup's key, or null for
   an entry printed before its category's first run-in (and for every entry
   of a category that has none).

   COUNTS. A category's `count` is the number the Bestiary Index prints, kept
   because the chips already read it. EN.bestiary.countOf(key) counts the
   entries instead, and the two agree.

   SOURCES. `page` on an entry and on a vehicle profile is its PDF page in the
   handbook (the folio printed on the page runs 4 lower). It is there to trace
   a string back to the book, never for display. Every other block carries a
   // GMH pNN comment. User-facing text carries no page numbers.

   Assembled from five transcriptions, each checked string by string against
   the handbook text on its stated page and diffed field by field against the
   33-entry file. An edit here should be an edit the page also carries.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.bestiary = {
  schemaVersion: 1,

  // GMH p67, the chapter intro. The second paragraph is the rule for every `variant`.
  intro: [
    "A starting roster, sorted by what the crew is actually facing: people, machines, programs, things the Flow made, things a lab made, and the things the street only half believes in. Every entry is built from the rules in Threats, some with numbers tuned by hand. To re-Grade one, use the new Grade's row of the Standard Threat Array (Designation and Role adjustments included), carry its abilities across, and review any fixed numbers or intentional departures from the row before play. The city doesn't stop at one of each, and neither should you.",
    "Where an entry lists a Variant, it is the same stat block with the listed changes, priced at the new XP."
  ],

  /* The six categories in book order. `count` is the Index's printed count
     (GMH pp68 to 70); `intro` is the paragraph under each category heading. */
  categories: [
    // GMH p70
    { key: "people", name: "People of the Trade", count: 23,
      intro: "Most of what a crew fights is people: underpaid, overarmed, and convinced of something. Kill them and somebody files a report, lights a candle, or posts a bounty. The Resolve line is there because every one of them can, in principle, be talked to. Whether there is time is the crew's problem." },
    // GMH p81
    { key: "machines", name: "Machines and Proxies", count: 6,
      intro: "Nothing personal. That is the point of them: hardware holds a position without wondering why, and a Proxy bleeds in one district while its operator finishes dinner in another. Remember the #GRID layer: most machines carry a Node, and the Node is a second way to win." },
    // GMH p84
    { key: "grid", name: "The #GRID Side", count: 4,
      intro: "Some threats never touch pavement. They live in Nodes, ride the city's traffic, and reach into meatspace through everything wired to listen. Digital threats use Node math (Security Rating, System Integrity, Firewall Damage Threshold) instead of Defense and Vitality; the crew fights them with ciphers and Quick Hacks. A judicious power cut works too." },
    // GMH p87
    { key: "flow", name: "The Flow Side", count: 7,
      intro: "The current leaves residue. Some of it lingers, some of it walks, and some of it hunts. Threats in this section interact with Shapers the way weather interacts with umbrellas: personally." },
    // GMH p90
    { key: "bioforms", name: "Bioforms and Subjects", count: 3,
      intro: "Engineered meat, escaped experiments, and heavily mutated organics: the kind of Targets that bleed weird colors and refuse to stay dead. The corporate paperwork calls them Subjects while they are loose and Specimens once they are strapped down. Both words mean somebody's R&D budget is walking around unsupervised, and somebody's legal department will pay to have that stop being true." },
    // GMH p92
    { key: "cryptids", name: "Cryptids of Elysium", count: 5,
      intro: "The street keeps its own bestiary. No corporate taxonomy, no assay record: just the thing the night crew won't talk about sober, filed under Specimens if it is ever caged and under insurance exclusions the rest of the time. A cryptid is any creature the city half believes in: Flow-warped fauna, escaped Bioforms gone generations feral, Manifestations that found a diet, machinery that learned appetite. Cryptid hunts are real work with real postings, and the number on the posting is a Grade somebody paid blood to estimate." }
  ],

  /* Run-in subheads. `intro` is the printed run-in without its heading, which
     is `name`. An entry joins on entry.subgroup === key. */
  subgroups: [
    // GMH p75
    { key: "street", name: "The Street", category: "people",
      intro: "The city's gangs mostly field what's already above: Street Gangers, a Shotcaller, a Chromed Bruiser. These entries are the ones that only make sense in one district." },
    // GMH p77
    { key: "corporate-hands", name: "The Corporate Hands", category: "people",
      intro: "Homeward and Kindred field Corpsec Officers and Sergeants for ordinary work. These are what they send when the work isn't ordinary." },
    // GMH p78
    { key: "hunters-knights", name: "Hunters and Knights", category: "people",
      intro: "The Watchfire hunts what the current makes. X-Calibur hunts whatever the city decides is too big for the precinct. Both send people built for one job, and they rarely come alone." },
    // GMH p88
    { key: "scar-line", name: "The Scar Line", category: "flow",
      intro: "What the First Cascade left, and what's still walking around in it. All four belong in Scar Line sites, and in any Incursion that remembers the Cascade." }
  ],

  entries: [
    {
      name: "Street Ganger", category: "people", subgroup: null, page: 70,
      grade: 1, designation: "Minion", role: "Gunhand",
      identity: "Grade 1 Minion, Gunhand. Medium Human (any species wears colors).",
      stats: { "Defense": "12", "DR": "0", "Vitality": "6", "Speed": "6", "Initiative": "+2", "Saves": "+4 Body, +1 others", "Passive Perception": "11", "XP": "25", "Resolve": "3 (Pushover)" },
      abilities: [
        { name: "Pocket Pistol", cost: "Action", text: "+5 vs Defense, Range 4 / 12, 1d6+1 Ballistic (4)." },
        { name: "Knife", cost: "Action", text: "+5 vs Defense, melee, 1d4+1 Slashing (3)." },
        { name: "Pack Nerve", cost: null, text: "This ganger's attacks gain +1 while an allied ganger is adjacent to its Target." }
      ],
      gear: "Pocket Pistol, Knife, colors, 𝒢2d20 in mixed Flickers."
    },
    {
      name: "Ganger Shotcaller", category: "people", subgroup: null, page: 71,
      grade: 1, designation: "Standard", role: "Support",
      identity: "Grade 1 Standard, Support. Medium Human.",
      stats: { "Defense": "12", "DR": "1 (Hypeplate)", "Vitality": "20", "Speed": "6", "Initiative": "+3", "Saves": "+4 Charm and Wits, +1 others", "Passive Perception": "12", "XP": "100", "Resolve": "5 (Standard)" },
      abilities: [
        { name: "Machine Pistol", cost: "Action", text: "+5 vs Defense, Range 6 / 18, 1d6+2 Ballistic (5)." },
        { name: "Call the Play", cost: "Swift", text: "One allied ganger threat within 6 spaces gains Edge on its next attack." },
        { name: "Not Paid Enough", cost: "Special", text: "The first time the Shotcaller drops below half Vitality, they start negotiating. What they know is usually worth more than what they were guarding." }
      ],
      gear: "Machine Pistol, Hypeplate, comm, a ledger someone will want back."
    },
    {
      name: "Chained Watchdog", category: "people", subgroup: null, page: 71,
      grade: 1, designation: "Standard", role: "Bruiser",
      identity: "Grade 1 Standard, Bruiser. Medium spliced guard-hound.",
      stats: { "Defense": "11", "DR": "1 (scarred hide)", "Vitality": "25", "Speed": "7", "Initiative": "+3", "Saves": "+4 Body, +1 others", "Passive Perception": "13 (Edge to smell)", "XP": "100" },
      abilities: [
        { name: "Bite", cost: "Action", text: "+5 vs Defense, melee, 1d8+3 Piercing (7). On a hit, the Target makes a Body Save DC 12 or falls Prone." },
        { name: "Death Grip", cost: null, text: "A Target the watchdog has knocked Prone takes +2 damage from its bites while Prone." }
      ],
      gear: "A chain somebody should have checked, a tag with a kennel address."
    },
    {
      name: "Riot Trooper", category: "people", subgroup: null, page: 71,
      grade: 2, designation: "Minion", role: "Gunhand",
      identity: "Grade 2 Minion, Gunhand. Medium Human.",
      stats: { "Defense": "14 (Riot Shield)", "DR": "3 (Enforcer Rig)", "Vitality": "10", "Speed": "5", "Initiative": "+2", "Saves": "+5 Body, +1 others", "Passive Perception": "12", "XP": "50", "Resolve": "3 (Pushover)" },
      abilities: [
        { name: "Shock Baton", cost: "Action", text: "+6 vs Defense, melee, 1d6+2 Electric (5), Nonlethal. The baton is for arrests. The paperwork is for survivors." },
        { name: "Shield Wall", cost: null, text: "+1 Defense for each adjacent Riot Trooper, to a maximum of +2." },
        { name: "Advance in Step", cost: null, text: "While two or more Riot Troopers are adjacent to each other, each can Shove as a Swift Action." }
      ],
      gear: "Riot Shield, Shock Baton, Enforcer Rig, zip restraints."
    },
    {
      name: "Corpsec Officer", category: "people", subgroup: null, page: 72,
      grade: 2, designation: "Standard", role: "Gunhand",
      identity: "Grade 2 Standard, Gunhand. Medium Human.",
      stats: { "Defense": "13", "DR": "3 (Composite Kit)", "Vitality": "30", "Speed": "6", "Initiative": "+4", "Saves": "+5 Body and Wits, +1 others", "Passive Perception": "13", "XP": "150", "Resolve": "5 (Standard)" },
      abilities: [
        { name: "Carbine", cost: "Action", text: "+6 vs Defense, Range 12 / 36, 1d10+3 Ballistic (8)." },
        { name: "Shock Baton", cost: "Action", text: "+6 vs Defense, melee, 1d6+3 Electric (6)." },
        { name: "Hold the Line", cost: null, text: "While within 2 spaces of an allied Corpsec Officer, this officer's attacks score a critical hit on a 19 or 20." },
        { name: "Fall Back", cost: "Impulse", text: "When first reduced below half Vitality, move up to half Speed toward cover without provoking Opportunity Attacks." }
      ],
      gear: "Carbine, Shock Baton, Composite Kit, corp credentials.",
      variant: { label: "Variant, Corpsec Sergeant (Elite, 300 XP)", text: "Vitality 60, Defense 14, Save DC 14, Carbine becomes two attacks (17 a round). Adds Focus Fire (Swift): one Target is marked; allied corpsec gain +1 on attacks against it until the sergeant's next turn." }
    },
    {
      name: "Chromed Bruiser", category: "people", subgroup: null, page: 72,
      grade: 2, designation: "Standard", role: "Bruiser",
      identity: "Grade 2 Standard, Bruiser. Medium Human, more aftermarket than warranty.",
      stats: { "Defense": "12", "DR": "2 (subdermal weave)", "Vitality": "37", "Speed": "6", "Initiative": "+3", "Saves": "+5 Body, +1 others", "Passive Perception": "11", "XP": "150", "Resolve": "5 (Standard)" },
      skills: [{ name: "Athletics", value: "+6" }],
      abilities: [
        { name: "Cyberarm Slam", cost: "Action", text: "+6 vs Defense, melee, 1d6+6 Bludgeoning (9)." },
        { name: "Clinch", cost: "Action", text: "Grapple contest (Athletics +6). While holding a Target, the Bruiser drags at half Speed and puts the body between itself and gunfire." },
        { name: "Hardwired", cost: null, text: "Counts as Hardwired (Conditions): hackable, and rolls with Snag against EMP and Electromagnetic effects." }
      ],
      gear: "The arm is Streetware and survives its owner. So do the debts on it."
    },
    {
      name: "Wetwork Operative", category: "people", subgroup: null, page: 73,
      grade: 3, designation: "Elite", role: "Ghost",
      identity: "Grade 3 Elite, Ghost. Medium Human, officially unemployed.",
      stats: { "Defense": "16", "DR": "2 (Slip Undervest)", "Vitality": "75", "Speed": "7", "Initiative": "+7", "Saves": "+7 Agility and Wits, +2 others", "Passive Perception": "15", "XP": "500", "Resolve": "8 (Hardened)" },
      skills: [{ name: "Stealth", value: "+8" }],
      abilities: [
        { name: "Suppressed SMG", cost: "Action", text: "Two attacks, +7 vs Defense, Range 8 / 24, 1d8+7 Ballistic (11)." },
        { name: "Afterbite Katana", cost: "Action", text: "Two attacks, +7 vs Defense, melee, 1d8+3 Slashing (7), Armor Piercing 1. On a critical hit, the Target gains 1 stack of Bleeding." },
        { name: "From Nowhere", cost: null, text: "Attacks from hiding deal +1d8 damage." },
        { name: "Smoke Discipline", cost: "Swift", text: "Drop a smoke charge: an Area 2 sphere is heavily obscured until the end of the operative's next turn. Three charges." },
        { name: "Sidestep", cost: "Impulse", text: "After being missed by an attack, move 2 spaces without provoking Opportunity Attacks." }
      ],
      gear: "Suppressed SMG, Afterbite Katana (Signature), Slip Undervest, a #PRINT that scans clean and is lying."
    },
    {
      name: "Corporate Handler", category: "people", subgroup: null, page: 73,
      grade: 3, designation: "Standard", role: "Support",
      identity: "Grade 3 Standard, Support. Medium Human in a suit worth more than the crew's rent.",
      stats: { "Defense": "14", "DR": "1 (Liner Mesh)", "Vitality": "50", "Speed": "6", "Initiative": "+5", "Saves": "+6 Charm and Wits, +2 others", "Passive Perception": "14", "XP": "250", "Resolve": "12 (Iron)" },
      abilities: [
        { name: "Pocket Pistol", cost: "Action", text: "+7 vs Defense, Range 4 / 12, 1d6+3 Ballistic (6). They would rather not. Their insurer would rather they didn't." },
        { name: "Spotter", cost: "Swift", text: "One allied threat gains Edge on its next attack against a Target the Handler can see." },
        { name: "Terms and Conditions", cost: "Action", text: "One Target that can hear the Handler makes a Wits Save DC 14 or rolls with Snag on attacks against the Handler until the end of its next turn. It is hard to shoot somebody mid-offer." },
        { name: "Exit Clause", cost: "Special", text: "The first time the Handler drops below half Vitality, their extraction contract activates. Somebody is now coming, and the response clock advances one row." }
      ],
      gear: "Pocket Pistol, a Nexus-linked tablet in audit lock, business cards with no company on them."
    },
    {
      name: "Street Shaper", category: "people", subgroup: null, page: 74,
      grade: 2, designation: "Standard", role: "Controller",
      identity: "Grade 2 Standard, Controller. Medium, any species, marked by the current.",
      stats: { "Defense": "13", "DR": "1 (layered coats and charms)", "Vitality": "22", "Speed": "6", "Initiative": "+4", "Saves": "+5 Mystique and Body, +1 others", "Passive Perception": "12", "XP": "150", "Resolve": "5 (Standard)" },
      abilities: [
        { name: "Current Lash", cost: "Action", text: "+6 vs Defense, Range 6, 2d6 Force (7)." },
        { name: "Gravity Pinch", cost: "Action", text: "One Target within 6 spaces makes a Body Save DC 14 or is Restrained until the end of its next turn." },
        { name: "Ward", cost: "Impulse", text: "Reduce incoming damage by 1d6." },
        { name: "Running Hot", cost: null, text: "When the Shaper uses Gravity Pinch two rounds in a row, static crawls across their skin and their next save rolls with Snag. The current keeps its own books." }
      ],
      gear: "Charms, chalk, a warding focus one bad week from pawn."
    },
    {
      name: "Gutter Hacker", category: "people", subgroup: null, page: 74,
      grade: 2, designation: "Standard", role: "Controller",
      identity: "Grade 2 Standard, Controller. Medium Human, folding chair, warm deck.",
      stats: { "Defense": "13", "DR": "1 (Liner Mesh)", "Vitality": "22", "Speed": "6", "Initiative": "+5", "Saves": "+5 Tech and Wits, +1 others", "Passive Perception": "12", "XP": "150", "Resolve": "5 (Standard)" },
      skills: [{ name: "Systems", value: "+7" }],
      abilities: [
        { name: "Machine Pistol", cost: "Action", text: "+6 vs Defense, Range 6 / 18, 1d6+2 Ballistic (5)." },
        { name: "Optic Static", cost: "Action", text: "One Target with cyberware or networked gear makes a Tech Save DC 14 or is Blinded until the end of its next turn." },
        { name: "Brick the Toy", cost: "Action", text: "Quick Hack (+7) against a device or Node the crew is using, per the #GRID rules. Drones, smart weapons, and door locks are all fair game." },
        { name: "Deck Node", cost: null, text: "Improved [1] Node (Security Rating 14, System Integrity 30). Brick it and the hacker is just a person in a folding chair." }
      ],
      gear: "Improved Smartdeck, Machine Pistol, energy drinks in violation of several treaties."
    },
    {
      name: "Cult Cantor", category: "people", subgroup: null, page: 75,
      grade: 3, designation: "Standard", role: "Controller",
      identity: "Grade 3 Standard, Controller. Medium, any species, voice like a dial tone you want to trust.",
      stats: { "Defense": "14", "DR": "1 (vestments)", "Vitality": "37", "Speed": "6", "Initiative": "+5", "Saves": "+6 Mystique and Charm, +2 others", "Passive Perception": "13", "XP": "250", "Resolve": "8 (Hardened; double Pressure from Insight-driven approaches, none from Intimidation. They have already imagined worse than the crew.)" },
      abilities: [
        { name: "Chorus Peal", cost: "Action", text: "+7 vs Defense, Range 8, 2d6 Psychic (7)." },
        { name: "The Verse", cost: "Action", text: "One Target that can hear the Cantor makes a Wits Save DC 15 or is Frightened of the Cantor, or Charmed by them (Cantor's choice), until the end of the Target's next turn." },
        { name: "Congregation", cost: null, text: "The Cantor's Save DC rises by 1 while three or more allied believers are within 6 spaces." }
      ],
      gear: "Vestments, donation ledger, keys to a shrine that isn't on any registry.",
      variant: { label: "Variant, Believer (Grade 1 Minion, 25 XP)", text: "As Street Ganger, unarmed or knives, immune to morale checks while the Cantor stands." }
    },
    {
      name: "X-Calibur Knight", category: "people", subgroup: null, page: 75,
      grade: 4, designation: "Elite", role: "Gunhand",
      identity: "Grade 4 Elite, Gunhand. Medium Human under enough licensed chrome to be a category error. The city's contracted answer to high-Caliber problems.",
      stats: { "Defense": "16", "DR": "4 (knight plate)", "Vitality": "140", "Speed": "6", "Initiative": "+6", "Saves": "+7 Body and Wits, +2 others", "Passive Perception": "15", "XP": "700", "Resolve": "8 (Hardened)" },
      abilities: [
        { name: "X-Calibur Rifle", cost: "Action", text: "Two attacks, +9 vs Defense, Range 16 / 48, 2d8+7 Ballistic (16)." },
        { name: "Arc Glaive", cost: "Action", text: "Two attacks, +9 vs Defense, Reach 1, 1d10+6 Energy (11), Armor Piercing 1." },
        { name: "Takedown Doctrine", cost: "Action", text: "One weapon attack; on a hit, smart-cable deploys and the Target makes a Body Save DC 16 or is Restrained (escape contest vs Athletics +9)." },
        { name: "Chrome Overdrive", cost: "Swift, once per scene", text: "Until the end of the Knight's turn, its attacks gain Edge." },
        { name: "Aegis", cost: "Impulse", text: "Block: reduce incoming physical damage by 1d6+4." }
      ],
      gear: "X-Calibur Rifle (Signature: a battle rifle chambered heavy, 2d8 Ballistic, Rare, Restricted), Arc Glaive, knight plate, a warrant with a blank space where the collateral goes.",
      gmNote: "Knights deploy in pairs with a Handler on comms. Two Knights and a Corporate Handler is 1,650 XP: a shade past a Fair Fight for the Caliber 4 crew XCal budgets against, and a wall for anyone below that. When the city wants Red Work, it sends a second pair (see the difficulty bands in The Budget)."
    },
    {
      name: "Sump Rat Pump Crew", category: "people", subgroup: "street", page: 76,
      grade: 1, designation: "Minion", role: "Bruiser",
      identity: "Grade 1 Minion, Bruiser. Medium, any species, in waders.",
      stats: { "Defense": "11", "DR": "0", "Vitality": "7", "Speed": "6", "Initiative": "+1", "Saves": "+4 Body, +1 others", "Passive Perception": "10", "XP": "25", "Resolve": "3 (Pushover)" },
      abilities: [
        { name: "Hammer", cost: "Action", text: "+5 vs Defense, melee or thrown 4 / 12, 1d6+1 Bludgeoning (4)." },
        { name: "Home Ground", cost: null, text: "Water, mud, and flooded floors aren't Difficult Terrain for the Sump Rats." }
      ],
      gear: "Hammer, waders, a pump key that fits half the stations in Sumpside."
    },
    {
      name: "Ferryman", category: "people", subgroup: "street", page: 76,
      grade: 2, designation: "Standard", role: "Gunhand",
      identity: "Grade 2 Standard, Gunhand. Medium, any species, salt in the creases.",
      stats: { "Defense": "13", "DR": "1 (Hypeplate)", "Vitality": "30", "Speed": "6", "Initiative": "+4", "Saves": "+5 Agility and Wits, +1 others", "Passive Perception": "13", "XP": "150", "Resolve": "5 (Standard; Iron against anything that would make them break their word)" },
      abilities: [
        { name: "Shotgun", cost: "Action", text: "+6 vs Defense, Range 5 / 12, 2d6+3 Ballistic (10)." },
        { name: "Spear", cost: "Action", text: "+6 vs Defense, Reach 1, 1d6+3 Piercing (6)." },
        { name: "Overboard", cost: "Impulse", text: "While on or adjacent to water, when hit by an attack, the Ferryman drops into the water and resurfaces up to 6 spaces away at the end of its next turn." }
      ],
      gear: "Shotgun, Spear, Hypeplate, a ferry token good on any crossing."
    },
    {
      name: "Ashrider Outrider", category: "people", subgroup: "street", page: 76,
      grade: 2, designation: "Standard", role: "Skirmisher",
      identity: "Grade 2 Standard, Skirmisher. Medium, any species, coated in Badlands dust.",
      stats: { "Defense": "14", "DR": "1 (Hypeplate)", "Vitality": "22", "Speed": "7", "Initiative": "+5", "Saves": "+5 Agility, +1 others", "Passive Perception": "12", "XP": "150", "Resolve": "5 (Standard)" },
      abilities: [
        { name: "Machine Pistol", cost: "Action", text: "+6 vs Defense, Range 6 / 18, 1d6+5 Ballistic (8)." },
        { name: "Hatchet", cost: "Action", text: "+6 vs Defense, melee or thrown 4 / 12, 1d6+5 Slashing (8)." },
        { name: "Ride-By", cost: "Action", text: "While mounted, the Outrider's bike moves up to its Speed and the Outrider makes one attack at any point during the move. Opportunity Attacks against the bike during that move roll with Snag." },
        { name: "Ash Wake", cost: null, text: "When its bike moves 8 or more spaces in a turn, every space it passed through is lightly obscured until the start of the Outrider's next turn." }
      ],
      gear: "Machine Pistol, Hatchet, Hypeplate, an Ashrider War Bike (Hostile Vehicles), road patches."
    },
    {
      name: "Ashrider Road Boss", category: "people", subgroup: "street", page: 77,
      grade: 4, designation: "Standard", role: "Bruiser",
      identity: "Grade 4 Standard, Bruiser. Medium, any species, more scar than road rash.",
      stats: { "Defense": "14", "DR": "4 (Scrap Plate)", "Vitality": "87", "Speed": "6", "Initiative": "+5", "Saves": "+7 Body and Charm, +2 others", "Passive Perception": "14", "XP": "350", "Resolve": "8 (Hardened)" },
      abilities: [
        { name: "Maul", cost: "Action", text: "Two attacks, +9 vs Defense, melee, 2d6+4 Bludgeoning (11)." },
        { name: "Shotgun", cost: "Action", text: "+9 vs Defense, Range 5 / 12, 2d6+4 Ballistic (11)." },
        { name: "Haymaker", cost: "Action", text: "One Maul attack at +2 damage dice, 4d6+4 Bludgeoning (18). On a hit, the Target makes a Body Save DC 15 or is knocked Prone." },
        { name: "Road Captain", cost: "Swift", text: "One allied Ashrider within 12 spaces moves up to half its Speed, or half its vehicle's Speed if mounted, without provoking Opportunity Attacks." },
        { name: "Brace", cost: "Impulse", text: "Reduce incoming damage by 1d8." }
      ],
      gear: "Maul, Shotgun, Scrap Plate (you hear it before you see it), a war bike with more miles on it than the Tollgate has lanes."
    },
    {
      name: "Homeward Interdiction Unit", category: "people", subgroup: "corporate-hands", page: 77,
      grade: 4, designation: "Minion", role: "Gunhand",
      identity: "Grade 4 Minion, Gunhand. Medium, any species, faceplate down.",
      stats: { "Defense": "15", "DR": "4 (Vanguard Plate)", "Vitality": "25", "Speed": "6", "Initiative": "+5", "Saves": "+7 Body, +2 others", "Passive Perception": "14", "XP": "100", "Resolve": "5 (Standard)" },
      abilities: [
        { name: "Carbine", cost: "Action", text: "+9 vs Defense, Range 12 / 36, 1d10+7 Ballistic (12)." },
        { name: "Cordon", cost: null, text: "While three or more Interdiction Units are within 3 spaces of one another, the spaces between them are Difficult Terrain for anyone they're hunting." }
      ],
      gear: "Carbine, Vanguard Plate, a Homeward transit badge, a drone overhead that hums three notes."
    },
    {
      name: "Kindred Recovery Specialist", category: "people", subgroup: "corporate-hands", page: 78,
      grade: 3, designation: "Standard", role: "Controller",
      identity: "Grade 3 Standard, Controller. Medium, any species, gloves on, voice soft.",
      stats: { "Defense": "14", "DR": "2 (Slip Undervest)", "Vitality": "37", "Speed": "6", "Initiative": "+5", "Saves": "+6 Tech and Wits, +2 others", "Passive Perception": "14", "XP": "250", "Resolve": "8 (Hardened)" },
      abilities: [
        { name: "Shock Baton", cost: "Action", text: "+7 vs Defense, melee, 1d6+5 Electric (8), Nonlethal." },
        { name: "Dart Gun", cost: "Action", text: "+7 vs Defense, Range 4 / 12, 1d4+5 Toxic (7). On a hit, the Target makes a Body Save DC 15 or is Poisoned until the end of its next turn." },
        { name: "Sedation Mist", cost: "Action", text: "Area 2 sphere within 6 spaces. Each Target in it makes a Body Save DC 15 or is Staggered until the end of its next turn." },
        { name: "Repossession", cost: "Action", text: "Touch a Restrained, Stunned, or Unconscious Target carrying Kindred cyberware. If the Specialist is still adjacent at the start of its next turn, one Kindred implant goes offline until it's reinstalled at a clinic. Kindred considers this a courtesy." }
      ],
      gear: "Shock Baton, Dart Gun, Slip Undervest, a surgical kit, a signed form.",
      gmNote: "A recovery team is two Specialists and two Corpsec Officers (800 XP). The officers hold the door. The Specialists handle returns."
    },
    {
      name: "Kindred Apex Guard", category: "people", subgroup: "corporate-hands", page: 78,
      grade: 5, designation: "Elite", role: "Bruiser",
      identity: "Grade 5 Elite, Bruiser. Medium, any species, more Kindred than not.",
      stats: { "Defense": "16", "DR": "5 (integrated plating)", "Vitality": "237", "Speed": "6", "Initiative": "+7", "Saves": "+8 Body and Wits, +3 others", "Passive Perception": "17", "XP": "900", "Resolve": "12 (Iron)" },
      abilities: [
        { name: "Brandware Arms", cost: "Action", text: "Three attacks, +10 vs Defense, melee, 2d6+8 Bludgeoning (15)." },
        { name: "Magnum Pistol", cost: "Action", text: "Two attacks, +10 vs Defense, Range 6 / 18, 1d10+10 Ballistic (15), Armor Piercing 1." },
        { name: "Overclock", cost: "Swift, once per scene", text: "Until the end of the Guard's turn, its attacks gain Edge." },
        { name: "Interpose", cost: "Impulse", text: "When its principal is targeted by an attack within 2 spaces of the Guard, the Guard swaps places with them and takes the attack instead." },
        { name: "On the Clock", cost: null, text: "Immune to Frightened and Charmed while its principal is alive." }
      ],
      gear: "Magnum Pistol, integrated plating and Brandware arms (not salvage: Kindred repossesses both within the week), a principal who pretends not to know its name."
    },
    {
      name: "Watchfire Hunter", category: "people", subgroup: "hunters-knights", page: 79,
      grade: 4, designation: "Standard", role: "Controller",
      identity: "Grade 4 Standard, Controller. Medium, any species, a lamp at the belt.",
      stats: { "Defense": "15", "DR": "3 (Gig Harness)", "Vitality": "52", "Speed": "6", "Initiative": "+6", "Saves": "+7 Mystique and Wits, +2 others", "Passive Perception": "17", "XP": "350", "Resolve": "8 (Hardened)" },
      abilities: [
        { name: "Marksman Rifle", cost: "Action", text: "+9 vs Defense, Range 20 / 60, 1d10+9 Ballistic (14)." },
        { name: "Binding Lamp", cost: "Action", text: "One Target within 12 spaces makes a Body Save DC 16 or is Restrained until the end of its next turn. Entities and Manifestations make this save with Snag." },
        { name: "Read the Trail", cost: null, text: "Gains Edge on any check to track a quarry whose belongings it has handled. The block's spirits answer its questions." },
        { name: "Lamp Ward", cost: "Impulse", text: "Reduce incoming damage from a Flow effect by 1d10." }
      ],
      gear: "Marksman Rifle, Gig Harness, a shrine lamp that never quite goes out, a Watchfire card."
    },
    {
      name: "Watchfire Master", category: "people", subgroup: "hunters-knights", page: 79,
      grade: 5, designation: "Elite", role: "Controller",
      identity: "Grade 5 Elite, Controller. Medium, any species, eyes that don't reflect the lamp.",
      stats: { "Defense": "17", "DR": "4 (Breaker Harness)", "Vitality": "142", "Speed": "6", "Initiative": "+8", "Saves": "+8 Mystique and Wits, +3 others", "Passive Perception": "18", "XP": "900", "Resolve": "12 (Iron)" },
      abilities: [
        { name: "Marksman Rifle", cost: "Action", text: "Two attacks, +10 vs Defense, Range 20 / 60, 1d10+12 Ballistic (17)." },
        { name: "Lamplight", cost: "Action", text: "Area 3 sphere within 16 spaces. Each Target in it makes a Wits Save DC 18 or is Blinded until the end of its next turn. Entities and Manifestations in the area also take 3d6 Resonant (10)." },
        { name: "Binding Lamp", cost: "Action", text: "As the Hunter's, at DC 18." },
        { name: "Eleven Nights", cost: "Special", text: "The first time the Master drops below half Vitality, it regains 20 Vitality, and each ally within 6 spaces gains Edge on its next attack." },
        { name: "Lamp Ward", cost: "Impulse", text: "Reduce incoming damage from a Flow effect by 2d8." }
      ],
      gear: "Marksman Rifle, Breaker Harness, a founding lamp, an invitation they decided not to send you."
    },
    {
      name: "X-Calibur Aspirant", category: "people", subgroup: "hunters-knights", page: 80,
      grade: 5, designation: "Minion", role: "Gunhand",
      identity: "Grade 5 Minion, Gunhand. Medium Human, probationary chrome.",
      stats: { "Defense": "16", "DR": "4 (trainee knight plate)", "Vitality": "35", "Speed": "6", "Initiative": "+6", "Saves": "+8 Body, +3 others", "Passive Perception": "15", "XP": "125", "Resolve": "5 (Standard)" },
      abilities: [
        { name: "Battle Rifle", cost: "Action", text: "+10 vs Defense, Range 16 / 48, 1d12+10 Ballistic (16)." },
        { name: "Proving Ground", cost: null, text: "Gains Edge on attacks against a Target that an X-Calibur Knight or Knight-Captain attacked this round." }
      ],
      gear: "Battle Rifle, trainee knight plate, a probation tag with a countdown on it."
    },
    {
      name: "X-Calibur Knight-Captain", category: "people", subgroup: "hunters-knights", page: 80,
      grade: 5, designation: "Elite", role: "Gunhand",
      identity: "Grade 5 Elite, Gunhand. Medium Human, the reason the warrant is already signed.",
      stats: { "Defense": "17", "DR": "5 (captain's knight plate)", "Vitality": "190", "Speed": "6", "Initiative": "+7", "Saves": "+8 Body and Wits, +3 others", "Passive Perception": "17", "XP": "900", "Resolve": "12 (Iron)" },
      abilities: [
        { name: "X-Calibur Rifle", cost: "Action", text: "Two attacks, +10 vs Defense, Range 16 / 48, 2d8+12 Ballistic (21)." },
        { name: "Arc Glaive", cost: "Action", text: "Two attacks, +10 vs Defense, Reach 1, 1d10+12 Energy (17), Armor Piercing 1." },
        { name: "Takedown Doctrine", cost: "Action", text: "One weapon attack. On a hit, smart-cable deploys and the Target makes a Body Save DC 17 or is Restrained (escape contest vs Athletics +10)." },
        { name: "Command Net", cost: "Swift", text: "Up to two allied X-Calibur threats within 24 spaces each move up to half their Speed or use their Aegis." },
        { name: "Aegis", cost: "Impulse", text: "Block: reduce incoming physical damage by 1d6+5." }
      ],
      gear: "X-Calibur Rifle (Signature), Arc Glaive, captain's knight plate, a warrant that's already signed.",
      gmNote: "A Knight-Captain runs a pair of Knights and a Handler: 2,550 XP, just under a Hard Contract for a Caliber 5 crew of four (2,700). Add a third Knight and four Aspirants and it's Red Work (3,750 against 3,600)."
    },
    {
      name: "Spotter Drone", category: "machines", subgroup: null, page: 81,
      grade: 1, designation: "Minion", role: "Support",
      identity: "Grade 1 Minion, Support. Tiny rotor drone.",
      stats: { "Defense": "13", "DR": "0", "Vitality": "6", "Speed": "8 (flight)", "Initiative": "+4", "Saves": "+4 Agility, +1 others", "Passive Perception": "15", "XP": "25" },
      abilities: [
        { name: "Mindless", cost: null, text: "Psychic damage deals 0 to it. Immune to Toxic damage and to anything that reads a mind it doesn't have." },
        { name: "Eyes Up", cost: null, text: "Allied threats gain +1 on attacks against Targets this drone can see." },
        { name: "Squawk", cost: "Special", text: "When it spots the crew or takes damage, it transmits. The site's response clock starts, or advances one row if already running." },
        { name: "Onboard Node", cost: null, text: "Rudimentary [-1] (Security Rating 10). One successful hack bricks, blinds, or flips it." }
      ],
      salvage: "Rotors, a camera, 𝒢40 in parts to the right kiosk."
    },
    {
      name: "Combat Drone", category: "machines", subgroup: null, page: 81,
      grade: 2, designation: "Standard", role: "Gunhand",
      identity: "Grade 2 Standard, Gunhand. Small treaded or rotor chassis with a gun where the customer service should be.",
      stats: { "Defense": "14", "DR": "2 (plating)", "Vitality": "25", "Speed": "7 (ground or flight by model)", "Initiative": "+4", "Saves": "+5 Agility, +1 others", "Passive Perception": "14", "XP": "150" },
      abilities: [
        { name: "Mindless", cost: null, text: "Psychic damage deals 0. Immune to Toxic, Frightened, and morale." },
        { name: "SMG Pod", cost: "Action", text: "+6 vs Defense, Range 8 / 24, 1d8+3 Ballistic (7)." },
        { name: "Target Lock", cost: "Swift", text: "Gain Edge on the drone's next attack against a Target it can see." },
        { name: "Onboard Node", cost: null, text: "Standard [0] (Security Rating 12). A successful hostile cipher or Quick Hack against it Staggers the drone until the end of its next turn; bricking the Node drops the drone where it stands." }
      ],
      salvage: "Chassis and weapon pod; as salvage it can zero the parts cost of a Companion Drone rebuild."
    },
    {
      name: "Sentry Turret", category: "machines", subgroup: null, page: 82,
      grade: 2, designation: "Standard", role: "Deadshot",
      identity: "Grade 2 Standard, Deadshot. Small fixed emplacement.",
      stats: { "Defense": "12", "DR": "3 (housing)", "Vitality": "22", "Speed": "0", "Initiative": "+2", "Saves": "+5 vs Tech effects, +1 others", "Passive Perception": "14 (90-degree arc)", "XP": "150" },
      abilities: [
        { name: "Mindless", cost: null, text: "Psychic damage deals 0. Immune to Toxic and to everything a paycheck usually buys." },
        { name: "Mounted Machinegun", cost: "Action", text: "+7 vs Defense, Range 20 / 60, 2d8+4 Ballistic (13)." },
        { name: "Covering Burst", cost: "Action", text: "Pick a space in arc. The turret attacks the first Target that enters within 2 spaces of it before its next turn." },
        { name: "Onboard Node", cost: null, text: "Improved [1] (Security Rating 17, System Integrity 20, Firewall Damage Threshold 3). A crew's Codebreaker turning a turret is a proud tradition." }
      ],
      salvage: "The machinegun survives with an Engineering check and a crowbar."
    },
    {
      name: "Puppeted Body", category: "machines", subgroup: null, page: 82,
      grade: 2, designation: "Standard", role: "Bruiser",
      identity: "Grade 2 Standard, Bruiser. Medium Proxy: a rented body, a hijacked frame, or a volunteer who signed something they should have read.",
      stats: { "Defense": "13", "DR": "1 (Hypeplate)", "Vitality": "30", "Speed": "6", "Initiative": "+3", "Saves": "+5 Body, +1 others", "Passive Perception": "12", "XP": "150" },
      abilities: [
        { name: "Whatever Is In Hand", cost: "Action", text: "+6 vs Defense, melee or Range 6 / 18, 1d8+3 damage by weapon (7)." },
        { name: "Nobody Home", cost: null, text: "Immune to Frightened, Panic, and morale. Pain arrives somewhere else, as a line item." },
        { name: "Signal Cut", cost: null, text: "The body runs on a Standard [0] relay Node (Security Rating 12). Brick it, or catch the body in Signal Jammed, and it folds like a marionette with the strings cut. The operator is elsewhere, and now they know the crew's faces." }
      ],
      salvage: "The relay rig, a Hypeplate, and a routing trail worth more than the rig."
    },
    {
      name: "Kettle Dog", category: "machines", subgroup: null, page: 83,
      grade: 3, designation: "Elite", role: "Skirmisher",
      identity: "Grade 3 Elite, Skirmisher. Small Construct built around a living core. The catalog listing says Resident Guardian Unit. The subscription tier has the word Peace in it somewhere. The manufacturer's position is that the behavioral core is fully synthetic, and the manufacturer's position has never once survived a teardown. The street named it for the sound it makes when it has decided you are leaving.",
      stats: { "Defense": "16", "DR": "2 (composite shell)", "Vitality": "75", "Speed": "10", "Initiative": "+8", "Saves": "+6 Agility and Body, +2 others", "Passive Perception": "16 (scent and thermal; it clocked the crew's route yesterday)", "XP": "500" },
      abilities: [
        { name: "Not Quite a Machine", cost: null, text: "Psychic damage lands in full. It can be Frightened. It never checks morale while defending its address: loyalty isn't a discipline problem." },
        { name: "Bite", cost: "Action", text: "Two attacks, +7 vs Defense, melee, 1d12+5 Piercing (11). If both hit the same Target, the Target is dragged 2 spaces or knocked Prone, Kettle Dog's choice. While the dog is scalding, its bites deal +1d4 Fire." },
        { name: "Scald Sprint", cost: "Swift", text: "Move up to 20 spaces in a straight or gently curving line without provoking Opportunity Attacks. Footage of this exists. It is mostly arguments about frame rate. Until the end of its next turn the dog is scalding: it sheds visible shimmer, whistles loud enough to hear through walls (no Stealth), and any Target that grapples it or hits it with a melee attack takes 1d4 Fire (2). The first two sprints in a scene are within tolerance. From the third on it is burning itself: it takes 2d6 Fire (7) at the end of each of its turns until it spends a full round motionless in water, coolant, or its dock. It will pay that anyway, for a friend." },
        { name: "Slip Away", cost: "Impulse", text: "When missed by a melee attack, move 2 spaces without provoking Opportunity Attacks." },
        { name: "Built for the Straightaway", cost: null, text: "In a chase (Vehicles and Chases), it counts as Fast for the straightaway trigger, or Very Fast while its sprints are still within tolerance." },
        { name: "The Leash Is Not the Dog", cost: null, text: "The subscription runs through an onboard Node, Improved [1] (Security Rating 17, System Integrity 20, Firewall Damage Threshold 3). Bricking it doesn't stop the dog. It deletes the subscriber table: the recall command, the handler override, the customer at all. What is left runs on memory." },
        { name: "Remembers", cost: null, text: "Anyone who has fed it, freed it, or sheltered it is friend-tagged, permanently, above every entry on the subscriber table. It won't attack a friend, it can pick a friend's voice out of a riot, and if a friend screams somewhere in the district, the GM should start counting sprints." }
      ],
      salvage: "The chassis parts out at 𝒢800. The core is worth 𝒢2,000 to a licensed lab and more to the other kind, and its dock telemetry, in a file labeled calibration loop, renders a low-resolution field and a thrown ball that never lands. It is still running when you pull the core. What kind of story that makes this is the crew's call.",
      variant: { label: "Variant, Estate Unit (Grade 4 Elite, 700 XP)", text: "Vitality 105, Defense 17, attacks +9, bites 2d8+7 (16). Premium addresses field two, and the pair covers each other's cooling." },
      hooks: { title: "This product can generate three job hooks:", items: [
        { name: "The Recall", text: "A family's subscription lapses, and the company sends a team to repossess its unit. The problem is that the dog friend-tagged the family years ago and intends to stay. The crew might be the recall team or the people standing in its way, depending on who hired them and how they feel once they get there." },
        { name: "The Old Friend", text: "Years before the campaign, a Freelancer fed a stray unit or cut one free from a wreck. **Remembers** is permanent. That same unit has changed owners twice since, and tonight it is guarding the site the crew came to break into. It won't attack its friend, and its current owner is going to want to know why." },
        { name: "The Whistling Watch", text: "Every night, an estate's unit sits at the property line, running hot and staring toward the Warrens at something the cameras can't see. The estate hires the crew to find out what has its attention. Maybe the dog's old family is out there in trouble. Maybe something only it can sense is circling the grounds. Either answer is a job." }
      ] }
    },
    {
      name: "Warform Chassis", category: "machines", subgroup: null, page: 84,
      grade: 4, designation: "Elite", role: "Bruiser",
      identity: "Grade 4 Elite, Bruiser. Large military Construct, decommissioned on paper.",
      stats: { "Defense": "15", "DR": "5 (wartime plate)", "Vitality": "175", "Speed": "5", "Initiative": "+5", "Saves": "+7 Body, +2 others", "Passive Perception": "15", "XP": "700" },
      abilities: [
        { name: "Mindless", cost: null, text: "Psychic damage deals 0. Immune to Toxic, Frightened, and to the concept of a warning shot." },
        { name: "Piston Fist", cost: "Action", text: "Two attacks, +9 vs Defense, melee, 2d10+5 Bludgeoning (16). On a critical hit, the Target makes a Body Save DC 16 or is pushed 2 spaces and knocked Prone." },
        { name: "Rotary Pod", cost: "Action", text: "+9 vs Defense, Range 24 / 72, 2d8+5 Ballistic (14)." },
        { name: "Overheat Vents", cost: null, text: "While below half Vitality, at the end of the Warform's turn, each adjacent Target takes 1d6 Fire damage (Body Save DC 16 for none)." },
        { name: "Hardened Node", cost: null, text: "Advanced [2] (Security Rating 20, System Integrity 30, Firewall Damage Threshold 4). Hijacking one is a Codebreaker's war story. Surviving the attempt is the hard part." }
      ],
      salvage: "Plate, actuators, and a fire-control core that is Restricted everywhere worth standing."
    },
    {
      name: "Feral Script", category: "grid", subgroup: null, page: 84,
      grade: 2, designation: "Standard", role: null,
      identity: "Grade 2 Standard. A program that outlived its purpose and kept eating. Scripts and worse are Elements; this one has opinions.",
      stats: { "Security Rating": "17", "Cipher Save": "+5", "System Integrity": "25", "Firewall Damage Threshold": "3", "XP": "150" },
      abilities: [
        { name: "Corrupt", cost: "Action", text: "Cipher Attack +6 against a Linked device or a Node it shares with a Target's Persona: 2d6 Tech damage." },
        { name: "Screech", cost: "Action", text: "Every Persona in its Node makes a Wits Save DC 13 or is Dazed until the end of its next turn (the feed goes wrong in a way eyes aren't for)." },
        { name: "Nest", cost: null, text: "It lives in a host Node. Brick the host and the Script dies with the furniture. It knows this, and it moves." }
      ],
      salvage: "Fragments worth 𝒢150 to a cipher crafter as materials."
    },
    {
      name: "#GRID Guardian", category: "grid", subgroup: null, page: 85,
      grade: 4, designation: "Elite", role: null,
      identity: "Grade 4 Elite. The reason corporate Nodes don't stay breached: an elite corporate counter-hacker with admin authority over a whole Node cluster. The Guardian is a person, somewhere, in a chair the crew will probably never see. What the crew meets is the cluster turning against them.",
      stats: { "Cipher Attack": "+9", "Cipher Save DC": "17", "XP": "700" },
      abilities: [
        { name: "Persona Node", cost: null, text: "Security Rating 23, System Integrity 45, Firewall Damage Threshold 5" },
        { name: "Admin Authority", cost: null, text: "Within their cluster, the Guardian adds +2 to contested digital checks, and every Node they stand in counts as running Aggressive IC (Alert, Analyze, Counterattack, Lockdown), with the Guardian choosing the response." },
        { name: "Purge", cost: "Action", text: "4d6 Tech damage against an intruding deck or device, resolved as an IC Counterattack." },
        { name: "Backtrace", cost: "Action", text: "Contested Systems check against one intruder. On a win, the intruder's physical location is burned: the site's response clock jumps to the Black row, and it doesn't stop when the crew leaves the building." },
        { name: "Slam the Doors", cost: "Swift", text: "One Node in the cluster the Guardian can reach applies Lockdown as Aggressive IC." },
        { name: "The Chair", cost: null, text: "The Guardian's body is elsewhere, statted as a Corpsec Officer if the crew ever finds the room. Finding the room is a campaign event. Corporations bury their Guardians the way banks bury their vaults." }
      ],
      gmNote: "A Guardian fight is a race, not a slugging match: what the crew's Codebreaker is buying with every round is time for the rest of the crew to finish the physical job before Backtrace lands."
    },
    {
      name: "Gremlin", category: "grid", subgroup: null, page: 85,
      grade: 2, designation: "Standard", role: "Skirmisher",
      identity: "Grade 2 Standard, Skirmisher. Small Flow-Sprite, meat-side and delighted about it. Officially a maintenance excuse. Unofficially the reason the charging station bit somebody.",
      stats: { "Defense": "15", "DR": "0", "Vitality": "22", "Speed": "7 (climbs anything with a cable in it)", "Initiative": "+6", "Saves": "+5 Agility and Mystique, +1 others", "Passive Perception": "13", "XP": "150" },
      abilities: [
        { name: "Static Body", cost: null, text: "Resistance to Ballistic, Piercing, and Slashing damage. Vulnerability to Resonant damage. It is only mostly here." },
        { name: "Arc Bite", cost: "Action", text: "+6 vs Defense, melee, 1d6+2 Electric (5)." },
        { name: "Break the Toy", cost: "Action", text: "One device the Gremlin touches makes a Tech Save DC 13 or is Glitched until the end of its next turn. Complex machinery it inhabits misbehaves without a save; that is just tenancy." },
        { name: "Ride the Wire", cost: "Swift", text: "Vanish into powered cabling and reappear within 6 spaces at anything electrified." }
      ],
      gmNote: "A Gremlin is feral-seeming, not stupid. It picks targets. It holds grudges. It plays. Some of them, maybe all of them, were Nixies once: mistreat one long enough and this is what comes back down the wire. Whether the road runs the other way, whether a Gremlin can be soothed back into a Nixie, is a question this book leaves open on purpose. Nobody has proof it works. There is at least one shrine that keeps trying anyway."
    },
    {
      name: "Nixie", category: "grid", subgroup: null, page: 86,
      grade: 1, designation: "Standard", role: null,
      identity: "Grade 1 Standard. Tiny Flow-Sprite in residence: a houseguest, not a burglar. Officially, Nixies don't exist. The maintenance union prints a form for them anyway.",
      stats: { "Defense": "13", "DR": "0", "Vitality": "15", "Speed": "7 (climbs anything with a cable in it)", "Initiative": "+5", "Saves": "+4 Agility and Mystique, +1 others", "Passive Perception": "14", "XP": "100, paid for a Nixie rehomed, never for a body." },
      abilities: [
        { name: "Static Body", cost: null, text: "Resistance to Ballistic, Piercing, and Slashing damage. Vulnerability to Resonant damage. It is only mostly here." },
        { name: "Never Where the Hand Lands", cost: null, text: "Attacks and grabs against a Nixie by a Target it can see roll with Snag. It reads intent off the current the way the crew reads a drawn gun." },
        { name: "In Residence", cost: null, text: "A Nixie keeps a host: a machine it has decided is worth living in. The host runs past its spec sheet: checks made using it gain Edge (or +1 Edge Die on a Dice Pool), and treat its Node as one Tier higher (Security Rating and Cipher Save Bonus). This is why certain corners have a vending machine that never jams and a door that never sticks, and why nobody who knows fixes what isn't broken." },
        { name: "Small Favors", cost: "Special, once per scene", text: "A machine within 6 spaces hiccups in somebody's favor: a door unbolts, a camera looks away, a fare reader waves someone through, a payout lands. The Nixie decides who it likes. Bribery is possible." },
        { name: "Spark Fuss", cost: "Impulse", text: "When grabbed, struck, or when its host is damaged, the offender takes 1d6 Electric (3). It isn't an attack. It is punctuation." },
        { name: "Ride the Wire", cost: "Swift", text: "Vanish into powered cabling and reappear within 6 spaces at anything electrified." },
        { name: "Moving one", cost: null, text: "A Nixie can't be seized, only courted. Three steps, all out of combat. Learn its taste (an Awareness or Esoterica Dice Pool against 2 Snag Dice): what it loves about the home it has, warmth, music, ritual attention, the number seven. Furnish the invitation: a vessel it would prefer, prepared with real care, because the difference between an offering and a trap is one the current can smell. Make the ask: a Dice Pool using Persuasion, Performance, or Esoterica. On a Flawless Success it moves the same night and the new home hums. Strong or Mixed, it comes, and brings one habit nobody negotiated. On a Failure it sulks deeper into the walls, and the next attempt needs a better gift." },
        { name: "Wronged", cost: "Special", text: "Kill a Nixie and the neighborhood remembers: until amends are made at a shrine that knows its name, once per session the GM may have one of the offender's devices fail at the worst plausible moment. And a Nixie that survives mistreatment doesn't stay a Nixie. Caging it, starving it of attention, or misusing its home is enough. What comes back down the wire eventually is a Gremlin, and it remembers whose fault that is." }
      ],
      salvage: "None worth having. Anything pulled from a Nixie's host sells as Flow-touched and buys exactly the kind of buyer the crew deserves."
    },
    {
      name: "Echo", category: "flow", subgroup: null, page: 87,
      grade: 2, designation: "Standard", role: null,
      identity: "Grade 2 Standard. Medium spiritual imprint: the residue of an old miracle or a bad death, still running its last minute on loop.",
      stats: { "Defense": "14", "DR": "0", "Vitality": "25", "Speed": "6 (ignores terrain that arrived after it died)", "Initiative": "+4", "Saves": "+5 Mystique, +1 others", "Passive Perception": "11", "XP": "150" },
      abilities: [
        { name: "Immaterial", cost: null, text: "Resistance to Ballistic, Piercing, Slashing, and Bludgeoning damage. Immune to Toxic. Fire, Electric, Energy, Psychic, and Resonant damage land in full." },
        { name: "Cold Touch", cost: "Action", text: "+6 vs Defense, melee, 2d6 Cold (7)." },
        { name: "Replay Wail", cost: "Action", text: "Area 2 sphere on itself: organic Targets make a Wits Save DC 13 or are Shaken until the end of their next turn." },
        { name: "The Loop", cost: null, text: "Until disturbed, an Echo re-enacts its imprint and notices nothing. Interrupt the loop (cross it, alter the scene it died in, channel nearby) and it notices everything." }
      ],
      gmNote: "An Echo can be cleansed instead of fought: treat it as a Severity 2 Anomaly and run a Cleansing Project (Flow Disturbances). Cleansing pays the same XP. The neighbors pay in gratitude, which spends worse but lasts longer."
    },
    {
      name: "Lantern Shoal", category: "flow", subgroup: null, page: 87,
      grade: 1, designation: "Standard", role: null,
      identity: "Grade 1 Standard. A drifting school of thumb-sized lights, Entities on the wrong side of the current, starving.",
      stats: { "Defense": "14", "DR": "0", "Vitality": "18", "Speed": "6 (flight)", "Initiative": "+4", "Saves": "+4 Mystique, +1 others", "Passive Perception": "12", "XP": "100" },
      abilities: [
        { name: "Swarm", cost: null, text: "Resistance to any damage from a single attack (it is a crowd, not a body). Area effects deal full damage. The Shoal shares spaces freely." },
        { name: "Graze", cost: "Action", text: "Each Target in the Shoal's space or adjacent to it takes 1d4 Electric damage (2), and any attuned Target among them loses 1 FP." },
        { name: "Hungry Light", cost: null, text: "Unattended powered gear in the Shoal's space loses charge: comms drop, lamps gutter, a Smartdeck whines. It's only eating." }
      ],
      salvage: "A captured handful, jarred, sells to shrines and collectors as a Flow-touched curiosity. Feeding it is the buyer's problem."
    },
    {
      name: "Null Hound", category: "flow", subgroup: null, page: 88,
      grade: 3, designation: "Standard", role: "Bruiser",
      identity: "Grade 3 Standard, Bruiser. Large Manifestation shaped like the word \"dog\" spoken by someone who hates dogs. It eats the current, and it has learned where the current pools: in people.",
      stats: { "Defense": "13", "DR": "2 (scar-tissue hide)", "Vitality": "62", "Speed": "8", "Initiative": "+5", "Saves": "+6 Body and Mystique, +2 others", "Passive Perception": "15 (smells resonance; a Shaper reads as a lit window)", "XP": "250" },
      abilities: [
        { name: "Silence Coat", cost: null, text: "Aura 2. Inside it, attuned Targets can't recover FP, and Invocations cost +1 FP. The air feels like a held breath." },
        { name: "Bite", cost: "Action", text: "+7 vs Defense, melee, 1d10+4 Piercing (9). An attuned Target hit also loses 1 FP." },
        { name: "Pounce", cost: "Action", text: "Move up to Speed and bite with Edge if it covered 4 or more spaces; on a hit the Target falls Prone." }
      ],
      salvage: "The coat, cured, lines a case that hides Flow-touched goods from anything that smells the way it did. Shrines pay for it and don't thank you."
    },
    {
      name: "Scar Drift", category: "flow", subgroup: "scar-line", page: 88,
      grade: 4, designation: "Minion", role: "Skirmisher",
      identity: "Grade 4 Minion, Skirmisher. Medium knot of somewhere else, drifting at head height.",
      stats: { "Defense": "16", "DR": "0", "Vitality": "18", "Speed": "7 (hovers)", "Initiative": "+7", "Saves": "+7 Agility, +2 others", "Passive Perception": "14", "XP": "100" },
      abilities: [
        { name: "Fold", cost: "Action", text: "+9 vs Defense, melee, 2d6+6 Force (13)." },
        { name: "Not All There", cost: null, text: "Resistance to Ballistic, Piercing, and Slashing damage. Immune to Psychic damage." },
        { name: "Unravels", cost: null, text: "When a Scar Drift drops to 0 Vitality, its space becomes Difficult Terrain until the end of the next round." }
      ],
      salvage: "A fist-sized shard of wrong-colored glass, Flow-touched."
    },
    {
      name: "Rift Stalker", category: "flow", subgroup: "scar-line", page: 89,
      grade: 4, designation: "Standard", role: "Skirmisher",
      identity: "Grade 4 Standard, Skirmisher. Medium predator that lives in the rift walls and hunts along the waterline.",
      stats: { "Defense": "16", "DR": "1 (rift-glass hide)", "Vitality": "52", "Speed": "7 (climbs at full Speed)", "Initiative": "+7", "Saves": "+7 Agility and Wits, +2 others", "Passive Perception": "16", "XP": "350" },
      abilities: [
        { name: "Claws", cost: "Action", text: "Two attacks, +9 vs Defense, melee, 1d10+5 Slashing (10)." },
        { name: "Taste of Elsewhere", cost: null, text: "When both claws hit the same Target in one turn, the Target makes a Wits Save DC 15 or is Dazed until the end of its next turn." },
        { name: "Rift Step", cost: "Swift", text: "Teleport up to 4 spaces to a space in dim light or water." },
        { name: "Slip Away", cost: "Impulse", text: "When missed by a melee attack, move 2 spaces without provoking Opportunity Attacks." }
      ],
      salvage: "Rift-glass teeth, Flow-touched, at the G4 band."
    },
    {
      name: "Afterimage", category: "flow", subgroup: "scar-line", page: 89,
      grade: 5, designation: "Standard", role: "Gunhand",
      identity: "Grade 5 Standard, Gunhand. Medium. A Freelancer from a crew that went into the First Cascade and never came out, still running the last job.",
      stats: { "Defense": "16", "DR": "0", "Vitality": "95", "Speed": "6", "Initiative": "+7", "Saves": "+8 Agility and Wits, +3 others", "Passive Perception": "15", "XP": "450", "Resolve": "8 (Hardened; it can be talked to, and it thinks it's still the day of the Cascade)" },
      abilities: [
        { name: "Carbine", cost: "Action", text: "Two attacks, +10 vs Defense, Range 12 / 36, 1d10+9 Ballistic (14)." },
        { name: "Immaterial", cost: null, text: "Resistance to Ballistic, Piercing, Slashing, and Bludgeoning damage. Immune to Toxic. Fire, Electric, Energy, Psychic, and Resonant damage land in full." },
        { name: "The Last Job", cost: null, text: "An Afterimage follows the plan of a job from the day of the Cascade, objective, route, timing, and all. It ignores the crew unless they're between it and the objective, or until it's harmed." },
        { name: "Laid to Rest", cost: null, text: "An Afterimage can be cleansed instead of fought: treat it as a Severity 3 Anomaly and run a Cleansing Project (Flow Disturbances). Cleansing pays the same XP." }
      ],
      gear: "None that stays solid. The contract it's running is real, and someone may still owe it money.",
      gmNote: "Afterimages come as crews. Four of them is a Fair Fight for a Caliber 5 crew of four, and an obvious mirror."
    },
    {
      name: "Unmade", category: "flow", subgroup: "scar-line", page: 90,
      grade: 5, designation: "Minion", role: "Bruiser",
      identity: "Grade 5 Minion, Bruiser. Large. Whatever was nearby when the Cascade hit, folded together and walking: rebar, a bus shelter, a vending machine, sometimes a person.",
      stats: { "Defense": "15", "DR": "0", "Vitality": "43", "Speed": "6", "Initiative": "+4", "Saves": "+8 Body, +3 others", "Passive Perception": "12", "XP": "125" },
      abilities: [
        { name: "Slam", cost: "Action", text: "+10 vs Defense, melee, 2d8+8 Bludgeoning (17)." },
        { name: "Wrong Mass", cost: null, text: "An Unmade can't be moved against its will or knocked Prone. Immune to Psychic damage." }
      ],
      salvage: "Scrap, mostly. Sometimes a working vending machine that dispenses things from before the Cascade."
    },
    {
      name: "Vatspill Husk", category: "bioforms", subgroup: null, page: 90,
      grade: 1, designation: "Minion", role: "Bruiser",
      identity: "Grade 1 Minion, Bruiser. Medium Bioform: growth-media stock that set wrong and got up anyway.",
      stats: { "Defense": "11", "DR": "0", "Vitality": "6", "Speed": "5", "Initiative": "+1", "Saves": "+4 Body, +1 others", "Passive Perception": "10", "XP": "25" },
      abilities: [
        { name: "Claw", cost: "Action", text: "+5 vs Defense, melee, 1d6+2 Slashing (5)." },
        { name: "Refuses to Stay Dead", cost: "Special", text: "The first time a Husk drops to 0 Vitality, it stands back up with 1 Vitality at the start of its next turn, unless the body was destroyed outright (fire, acid, or deliberate work). Crews learn to spend the extra round. Once." }
      ],
      salvage: "Nothing anyone should carry. Labs pay 𝒢100 a sample anyway."
    },
    {
      name: "Warstock Feral", category: "bioforms", subgroup: null, page: 91,
      grade: 3, designation: "Standard", role: "Bruiser",
      identity: "Grade 3 Standard, Bruiser. Large Bioform: pre-collapse military splice stock, generations feral, still following the last order it understood.",
      stats: { "Defense": "13", "DR": "2 (dense hide)", "Vitality": "62", "Speed": "7", "Initiative": "+5", "Saves": "+6 Body, +2 others", "Passive Perception": "14 (Edge to smell)", "XP": "250" },
      abilities: [
        { name: "Claws", cost: "Action", text: "Two attacks, +7 vs Defense, melee, 1d8+4 Slashing (8)." },
        { name: "Bring Them Down", cost: null, text: "The Feral's attacks gain Edge against Prone or Restrained Targets." },
        { name: "Territorial Bellow", cost: "Swift, once per scene", text: "Area 3 sphere on itself: organic Targets make a Wits Save DC 14 or are Shaken until the end of their next turn." }
      ],
      salvage: "Hide (armorer interest), glands (lab interest), tags (historian interest, and the historians pay worst but ask the best questions)."
    },
    {
      name: "Reclamation Bloom", category: "bioforms", subgroup: null, page: 91,
      grade: 3, designation: "Standard", role: "Controller",
      identity: "Grade 3 Standard, Controller. Large engineered filter-stock gone feral: a corporate ecology unit that kept doing its job after the job ended. Not Verdine, and the Verdine are pointed about the distinction. This is what they were built to prevent.",
      stats: { "Defense": "13", "DR": "3 (fibrous mass)", "Vitality": "55 (rooted: a deliberate exception to the Controller Vitality adjustment)", "Speed": "2 (rooted; the bed doesn't move, the reach does)", "Initiative": "+2", "Saves": "+6 Body, +2 others", "Passive Perception": "12 (vibration)", "XP": "250" },
      skills: [{ name: "Athletics", value: "+7" }],
      abilities: [
        { name: "Tendril", cost: "Action", text: "Two attacks, +7 vs Defense, Reach 3 (flexible), 1d8+3 Bludgeoning (7). On a hit, the Bloom may attempt a Grapple contest (Athletics +7) for free." },
        { name: "Spore Sigh", cost: "Action", text: "Area 3 sphere within Reach: organic Targets make a Body Save DC 15 or are Poisoned until the end of their next turn." },
        { name: "Compost", cost: null, text: "A Grappled Target the Bloom starts its turn holding takes 1d6 Acid damage (3). Vulnerability to Fire damage, and it knows: it drops anything burning." }
      ],
      salvage: "Filter cores fetch 𝒢400 clean; the Verdine pay more, partly to study it, mostly to bury it."
    },
    {
      name: "Wiredog", category: "cryptids", subgroup: null, page: 92,
      grade: 2, designation: "Standard", role: "Skirmisher",
      identity: "Grade 2 Standard, Skirmisher. Small feral Construct: maintenance frames that outlived their depot, rebuilt themselves out of the district, and rediscovered the pack.",
      stats: { "Defense": "14", "DR": "1 (scrap plating)", "Vitality": "22", "Speed": "8", "Initiative": "+5", "Saves": "+5 Agility, +1 others", "Passive Perception": "14", "XP": "150" },
      abilities: [
        { name: "Mindless enough", cost: null, text: "Psychic damage deals 0. Not immune to fear; a Wiredog understands consequences better than most employees." },
        { name: "Shear Bite", cost: "Action", text: "+6 vs Defense, melee, 1d8+3 Slashing (7). Against a Target an allied Wiredog is adjacent to, the bite gains Edge." },
        { name: "Drag", cost: "Swift", text: "A Wiredog adjacent to a Prone Target can pull it 2 spaces toward the nest. They don't eat people. They strip gear. It is worse for morale than eating people." }
      ],
      signs: "Stripped copper, tidy piles of nonmetal effects, solder-bright toothmarks on conduit.",
      variant: { label: "Variant, Pack Alpha (Elite, 300 XP)", text: "Vitality 45, Defense 15, Shear Bite becomes two attacks (15 a round). Adds Jamming Howl (Action): Area 3 sphere: the zone is Signal Jammed until the end of the Alpha's next turn. The pack hunts phones first. It has learned what calling for help means." }
    },
    {
      name: "Rustmaw", category: "cryptids", subgroup: null, page: 93,
      grade: 2, designation: "Solo", role: null,
      identity: "Grade 2 Solo. Large Bioform, or possibly machinery, and the argument funds two dissertations: a metal-eater that works parked lanes and impound yards the way bears work rivers.",
      stats: { "Defense": "14", "DR": "3 (oxidized plate)", "Vitality": "120", "Speed": "6 (climbs structure at full speed)", "Initiative": "+4", "Saves": "+5 Body, +1 others", "Passive Perception": "13 (tastes current in the air; running engines read as cooking smells)", "Unshakable, Defensive Impulses": "as a Solo (its listed Impulse is Brace: reduce incoming damage by 1d10+4).", "XP": "600" },
      abilities: [
        { name: "Bite", cost: "Action", text: "Two attacks, +6 vs Defense, melee, 2d8+6 Piercing (15). Armor it bites loses 1 DR until repaired (the saliva does the work)." },
        { name: "Tail Sweep", cost: "Action", text: "+6 vs Defense, Reach 2, 1d10+5 Bludgeoning (10); on a hit the Target makes a Body Save DC 15 or is pushed 2 spaces." },
        { name: "Surges", cost: "2 per round", text: "*Lunge* (move half Speed); *Spray* (Area 2 cone: Agility Save DC 15, 1d6 Acid on a failure, none on a success); *Shed* (its space and each adjacent space become Difficult Terrain of shed scrap)." },
        { name: "Breakpoint", cost: null, text: "Something volatile it swallowed this week ruptures: once, Area 3 cone, Agility Save DC 15, 2d6 Fire on a failure, half on a success. After this, its DR drops to 2 and it starts looking for an exit. It is a feeder, not a fighter, and the distinction is the crew's best weapon." },
        { name: "Weakness", cost: null, text: "A charged anode (any vehicle battery rigged to bleed, one Engineering check) reads as an irresistible meal. While feeding on one, the Rustmaw ignores everything smaller than a gunshot, and attacks against it gain Edge." }
      ],
      salvage: "The gizzard carries 𝒢2d6 x 100 in refined slugs. The acid glands are worth 𝒢500 to chemists, less whatever the container costs. The container matters.",
      signs: "Vehicles stripped to polymer skeletons overnight; gutter runoff that etches boot soles; missing manhole covers, and then missing manholes."
    },
    {
      name: "Sublevel Angler", category: "cryptids", subgroup: null, page: 94,
      grade: 3, designation: "Solo", role: null,
      identity: "Grade 3 Solo. Large ambush predator of the flooded levels: a lure, a jaw, and a patience the dark has been refining since before the pumps failed.",
      stats: { "Defense": "15", "DR": "3 (pressure hide)", "Vitality": "200", "Speed": "5 (swim 8)", "Initiative": "+6", "Saves": "+6 Body, +2 others", "Passive Perception": "16 (Tremor Sense 12 spaces; it feels footsteps through standing water)", "Unshakable, Defensive Impulses": "as a Solo (listed Impulse: Submerge: gain Half Cover against one ranged attack).", "XP": "1,000" },
      abilities: [
        { name: "The Lure", cost: null, text: "A dangling light that reads, at distance, as a working maintenance lamp, a comm ping, a wearable's lost-and-found strobe. The first time a Target sees the lit lure each scene, it makes a Wits Save DC 16 or must use its next Move to close toward the light. Crews that know what the light is still lose people to it. It looks like somebody alive." },
        { name: "Jaw", cost: "Action", text: "Two attacks, +7 vs Defense, melee, 3d10+6 Piercing (22). On a hit, the Angler may attempt a Grapple contest for free (Athletics +8)." },
        { name: "Tongue Lash", cost: "Action", text: "+7 vs Defense, Reach 3 (flexible), 2d8+6 Bludgeoning (15); on a hit the Target is pulled 2 spaces toward the jaw." },
        { name: "Surges", cost: "3 per round", text: "*Douse* (extinguish its lure and any unshielded light within 2 spaces: that area is heavily obscured); *Undertow* (each Target in water within 2 spaces makes a Body Save DC 16 or is pulled 1 space and falls Prone); *Snap* (one bite at the bottom of its range: 1d10+5)." },
        { name: "Breakpoint", cost: null, text: "It swallows a Grappled Target whole. Inside: Blinded, Restrained, 2d6 Acid at the start of each turn, and freedom costs 15 damage dealt to the gullet with a blade, a torch, or something worse. The Angler will start withdrawing toward deep water the round it feeds. It has what it came for." },
        { name: "Weakness", cost: null, text: "The lure's frequency logs as a recurring fault code in the level's maintenance manifests, which is how you find its beat. Cut the district mains and it hunts on Tremor Sense alone: it trusts the lure too much to hunt well without playing it, and a crew standing still is, briefly, invisible." }
      ],
      salvage: "The lure organ is Flow-touched (2x to 10x multipliers apply, per Economy and Rewards) and shrines, labs, and exactly one nightclub owner all want it. The pressure hide patches vehicle armor at half parts cost.",
      signs: "Work crews that clock in and vanish between checkpoints; a maintenance lamp that appears on no work order; waterline scars three spaces up the wall."
    },
    {
      name: "The Smiling Man", category: "cryptids", subgroup: null, page: 95,
      grade: 4, designation: "Solo", role: "Ghost",
      identity: "Grade 4 Solo, Ghost. Medium, allegedly. He is in the back of a crowd photo from before the crew was born, and the same photo taken last week. The file says Unregistered Extradimensional Asset. The file is guessing.",
      stats: { "Defense": "17", "DR": "0", "Vitality": "210", "Speed": "7 (never observed running; he is simply nearer)", "Initiative": "+8", "Saves": "+7 Mystique and Wits, +2 others", "Passive Perception": "17", "Unshakable, Defensive Impulses": "as a Solo (listed Impulse: Flicker: an attack that hits him is rerolled once; the second result stands).", "XP": "1,400" },
      abilities: [
        { name: "Wrong Geometry", cost: null, text: "Resistance to Ballistic and Piercing damage. The wound is never quite where he was." },
        { name: "Long Fingers", cost: "Action", text: "Three attacks, +9 vs Defense, melee, 2d12+8 Slashing (21)." },
        { name: "The Smile", cost: null, text: "The first time each scene a Target sees his face, it makes a Wits Save DC 17 or is Frightened until the end of its next turn." },
        { name: "Surges", cost: "3 per round", text: "*Closer* (teleport up to 6 spaces to any space no one can currently see); *Borrowed Face* (until someone looks twice, he reads as a person one Target knows: Wits Save DC 17 to look twice in time); *Still Frame* (one Target makes a Wits Save DC 17 or is Stunned until the end of its next turn; once per round)." },
        { name: "Breakpoint", cost: null, text: "The smile opens. Area 3 sphere on him: organic Targets make a Wits Save DC 17 or gain the Panic condition. He doesn't fight after this. He harvests whoever ran alone." },
        { name: "Weakness", cost: null, text: "He can't enter a space where his own image is displayed, and a mirror or a live playback of him forces him, once per scene, to stop and regard himself for a round (treat as Restrained until the start of his next turn). Nobody knows if it is a rule or a vanity, and nobody has survived being wrong in both directions." }
      ],
      salvage: "None. Proof of him, though, is worth 𝒢10,000 to a cult, a tabloid, or a corporate anomalist, and each buyer is its own consequence.",
      signs: "An extra guest in old photos; dogs that refuse a block; witnesses who disagree on his clothes and agree on his teeth."
    },
    {
      name: "Cascade Orphan", category: "cryptids", subgroup: null, page: 96,
      grade: 5, designation: "Solo", role: null,
      identity: "Grade 5 Solo. Large. Something calved from the First Cascade, older than the Guilds, wearing local physics like a borrowed coat. The city has recordings. The city has arguments about the recordings.",
      stats: { "Defense": "17", "DR": "5 (reality callus)", "Vitality": "380", "Speed": "7", "Initiative": "+8", "Saves": "+8 Body and Mystique, +3 others", "Passive Perception": "16", "Immune": "Psychic.", "Resistance": "Resonant and Entropy. The inside of it isn't a mind, and it has been unraveling since birth without noticing.", "Unshakable, Defensive Impulses": "as a Solo (listed Impulse: Unravel: reduce incoming damage by 2d6; damage so reduced to 0 rebounds 1d6 Resonant to the attacker).", "XP": "1,800" },
      abilities: [
        { name: "Static Bleed", cost: null, text: "Aura 3. The aura is a Static Zone, and the full entry in Flow Disturbances governs it: Invocations cost more, their teeth are halved, and the current doesn't come back inside the line." },
        { name: "Unmade Limb", cost: "Action", text: "Three attacks, +10 vs Defense, Reach 2, 4d10+6 Force (Spatial) (28). Ignores armor DR; space itself is doing the cutting." },
        { name: "Gravity Well", cost: "Action", text: "Area 3 sphere within 12 spaces: Targets make a Body Save DC 18 or are pulled 3 spaces toward its center and knocked Prone." },
        { name: "Surges", cost: "3 per round", text: "*Fold Step* (teleport 4 spaces); *Shear* (one Unmade Limb attack at 2d10+6); *Howl of the Birth Hour* (one Target makes a Wits Save DC 18 or is Shaken until the end of its next turn)." },
        { name: "Breakpoint", cost: null, text: "It stops holding itself together. The Static Bleed aura collapses outward and the whole engagement area becomes a Severity 3 Resonant Storm (Invocations +1 FP; failed checks deal 1d4 Vitality) for the rest of the scene, and the Orphan's DR drops to 2. The armor was the leash." },
        { name: "Weakness", cost: null, text: "Its birth site holds a Focal Anchor, the fused object it crystallized around: Defense 14, Vitality 45, immune to Flow damage and effects. While the Anchor exists, an Orphan dropped to 0 Vitality re-forms there in 1d4 days. Destroy the Anchor first, or stand on it, and the Orphan must come to the crew, on ground the crew chose. Killing it anywhere else is a rental." }
      ],
      salvage: "The reality callus, chipped free, is the rarest crafting material in the city: relic-tier, per the Project rules, and every faction that learns the crew has it becomes a scene.",
      signs: "Districtwide static in every language; rain that falls slightly wrong; shrines going quiet and corporations going loud."
    }
  ],

  /* RUNNING A HUNT, GMH p92: the run-in inside the Cryptids of Elysium intro.
     `beats[].n` is the printed box number (01 to 03). */
  huntProcedure: {
    title: "Running a hunt",
    lead: "A cryptid is a Solo plus a procedure. Give every hunt three beats:",
    beats: [
      { n: 1, name: "Signs", text: "The cheap evidence: what it leaves, what it takes, what changed in the neighborhood. Signs are how the crew confirms the Grade before betting their bodies on it." },
      { n: 2, name: "Territory", text: "Where it operates and why: a food source, a nest condition, a boundary it won't cross. Territory work means questioning witnesses and following leads with Dice Pools. It's where the crew finds the weakness every Solo carries." },
      { n: 3, name: "The Lair", text: "The fight, on the cryptid's terms unless the crew's preparation stole those terms. Every point of research should be worth blood saved: found weaknesses, chosen ground, an exit the thing doesn't know about." }
    ],
    closing: "A crew that skips to beat three learns why the last crew's gear was still in the lair."
  },

  /* SPECIES TEMPLATES, GMH p97. Reference data, not threats: one template laid
     over an "any species" statblock adds its traits and changes nothing else.
       title, intro[] (paragraphs), columns[] (the printed table headers),
       templates[]: { species, classification (the Corporate Classification
         column), traits[] }, each trait in the abilities shape { name, cost,
         text } so a card can print it the way it prints an ability,
       footer (the line under the table). */
  speciesTemplates: {
    title: "Species Templates",
    intro: [
      "Most stat blocks for people read \"any species,\" and they mean it. When the species matters, lay one of these over the block: add the traits, change nothing else. The XP, the Grade, and the Resolve stay as printed. Each template draws on the species' PHB entry, adapting its traits for a fight, so a Verdine Corpsec Officer fights like a Corpsec Officer who happens to be Verdine.",
      "One template per threat. Templates don't apply to machines, programs, or anything Mindless."
    ],
    columns: ["Species", "Add These Traits", "Corporate Classification"],
    templates: [
      { species: "Verdine", classification: "Engineered Ecological Filters", traits: [
        { name: "Ecological Filter", cost: null, text: "Resistance to Toxic damage; immune to smog and ambient pollutants." },
        { name: "Rooted Stance", cost: null, text: "When the threat would be moved against its will or knocked Prone, it can spend its defensive Impulse to cancel the movement; it can't be knocked Prone until the end of its next turn." }
      ] },
      { species: "Clanker", classification: "Cognitive Anomalies", traits: [
        { name: "Machine Physiology", cost: null, text: "Immune to disease, organic poisons, toxic gases, and the Poisoned condition." },
        { name: "Resonant Circuitry", cost: null, text: "Edge on saves against EMP, digital viruses, and Tech damage. Psychic damage lands in full. A Clanker isn't Mindless." }
      ] },
      { species: "Chimera", classification: "Rogue Bio-Assets", traits: [
        { name: "Primal Reflex", cost: null, text: "When Initiative is rolled, the threat moves up to half its Speed." },
        { name: "Keen Senses", cost: null, text: "+2 Passive Perception. Use the lineage for flavor: a Hulsk Bruiser, a Skarn Ghost, a Ryn Skirmisher." }
      ] },
      { species: "Outsider", classification: "Unregistered Extradimensional Assets", traits: [
        { name: "Cosmic Disconnect", cost: null, text: "Immune to mind-reading; scanners and #PRINT checks return corrupted data." },
        { name: "Reality Fracture", cost: "Swift, once per scene", text: "Teleport up to 6 spaces to an unoccupied space it can see; each Target adjacent to where it left takes 1d4 Entropy damage (2)." }
      ] }
    ],
    footer: "Humans need no template. They're the default the blocks were written for, and they'd like you to know they're special anyway."
  },

  /* HOSTILE VEHICLES, GMH pp98 to 99. Reference data, not threats: a vehicle
     has no XP and no Grade. The chapter block is
       title, intro[] (paragraphs), rules[] ({ name, text }: Threat pilots,
       which sets a piloting threat's check and its vehicle's moving Defense),
       profiles[].
     A profile uses the field names and types of EN.vehicles.profiles, so one
     renderer can serve both: name, tier, category (the vehicle category,
     "Ground", "Marine" or "Aerial", not a Bestiary category key), speed
     (printed band), handling (a number; show it signed), structure,
     integrity, cargo (numbers), nodeTier (printed), traits[]. The book adds
     mass (printed), identity (the printed header line), rules[] ({ name, text },
     the run-ins under the profile, often empty), text (the description) and
     page (source only). */
  vehicles: {
    title: "Hostile Vehicles",
    intro: [
      "The vehicles the city sends after a crew, in the PHB's profile format. They use Vehicles and Chases as written: Structure and Integrity, the Impact DC, Lead, and Mounted Weapons with their doubled range bands."
    ],
    rules: [
      { name: "Threat pilots", text: "A threat behind the wheel uses its Attack bonus + the vehicle's Handling for every piloting check, including the Chase Check and the Control Check. Its vehicle's Defense while moving is 10 + Handling + 2 at Grade 1 to 2, + 4 at Grade 3 to 4, or + 6 at Grade 5." }
    ],
    profiles: [
      {
        name: "Ashrider War Bike", page: 98, tier: 2, category: "Ground", mass: "Light",
        speed: "Fast", handling: 2, structure: 9, integrity: 25, nodeTier: "Standard [0]", cargo: 2,
        traits: ["Agile", "Open-Frame"],
        identity: "Tier 2 Ground vehicle, Light mass. Agile, Open-Frame.",
        rules: [],
        text: "A Street Bike rebuilt on the road for years: heavier frame, bigger tank, a stripe of ash baked into the paint. Ashriders ride them in packs. A pack of four at Lead 2 is a Close-band problem, all of them shooting from the saddle."
      },
      {
        name: "Homeward Interceptor", page: 98, tier: 3, category: "Ground", mass: "Standard",
        speed: "Very Fast", handling: 1, structure: 14, integrity: 50, nodeTier: "Advanced [2]", cargo: 4,
        traits: ["Enclosed", "Passenger (2)"],
        identity: "Tier 3 Ground vehicle, Standard mass. Enclosed, Passenger (2).",
        rules: [
          { name: "Mounted Weapon", text: "Light Machinegun on a fixed forward mount, 1d10 Ballistic, Range 32 / 96 mounted." }
        ],
        text: "The car that arrives before the call ends. Homeward runs them in pairs, with a Patrol Drone as the spotter (the PHB's pursuit table, 7 to 8)."
      },
      {
        name: "Recovery Van", page: 98, tier: 3, category: "Ground", mass: "Heavy",
        speed: "Standard", handling: -1, structure: 18, integrity: 70, nodeTier: "Advanced [2]", cargo: 20,
        traits: ["Armored", "Enclosed", "Passenger (6)"],
        identity: "Tier 3 Ground vehicle, Heavy mass. Armored, Enclosed, Passenger (6).",
        rules: [],
        text: "Kindred's, mostly, and anyone else who needs to take something back without asking twice. White, unmarked, and Armored, so nothing short of its Structure 18 touches the people inside. The back is a clinic. The doors lock from the outside."
      },
      {
        name: "Ferry Skiff", page: 99, tier: 1, category: "Marine", mass: "Standard",
        speed: "Standard", handling: 1, structure: 9, integrity: 35, nodeTier: "Rudimentary [-1]", cargo: 15,
        traits: ["Open-Frame", "Passenger (8)"],
        identity: "Tier 1 Marine vehicle, Standard mass. Open-Frame, Passenger (8).",
        rules: [
          { name: "River Pilot", text: "A Ferryman pilot gains Edge on Chase Checks on the river." }
        ],
        text: "The Ferrymen's workhorse. Slow next to anything with a motor worth stealing, but it goes where the bridges don't, and every Ferryman knows the river's shortcuts."
      },
      {
        name: "Homeward Patrol Drone", page: 99, tier: 2, category: "Aerial", mass: "Light",
        speed: "Standard", handling: 0, structure: 7, integrity: 15, nodeTier: "Improved [1]", cargo: 0,
        traits: ["Flight", "Hover"],
        identity: "Tier 2 Aerial vehicle, Light mass. Flight, Hover.",
        rules: [
          { name: "Mounted Weapon", text: "Light Machinegun on a turret ring, 1d10 Ballistic, Range 32 / 96 mounted." },
          { name: "Pilot", text: "None aboard. It's a Proxy: an operator in Northmouth flies it at +6, or it runs its own route at +4 when nobody's watching." }
        ],
        text: "Brick its Node and it lands itself, politely."
      }
    ]
  }
};

/* How many entries a category holds, or one subgroup of it, counted from
   `entries` rather than read off the printed `count`. Pass null as the
   subgroup to count the entries printed outside every run-in. */
EN.bestiary.countOf = function (categoryKey, subgroupKey) {
  var n = 0;
  EN.bestiary.entries.forEach(function (e) {
    if (e.category !== categoryKey) return;
    if (subgroupKey !== undefined && e.subgroup !== subgroupKey) return;
    n++;
  });
  return n;
};
