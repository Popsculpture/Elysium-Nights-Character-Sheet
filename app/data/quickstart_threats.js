/* Quick-Start (EN1003): threats. Filled in by its own pass; see js/quickstart.js for how it is switched on. */
window.EN = window.EN || {};
EN.quickstart = EN.quickstart || {};

/* ===========================================================================
   ELYSIUM NIGHTS · Quick-Start threats  (EN1003)
   The 7 statblocks on the Threats page of the Quick-Start Rules (playtest
   draft 2026-11-28A, PDF page 49), the people and machines of the job The
   Fifth Flavor, A to Z as printed. js/quickstart.js merges the category and
   the entries into EN.bestiary while EN.launch.quickstart() is on, and takes
   them back out when it is off; nothing here is read otherwise.

   THE SCHEMA IS data/bestiary.js'S, field for field, and so are its rules.
   THE BOOK'S PRINTED NUMBERS ARE THE NUMBERS. THE WORDING IS THE BOOK'S:
   line breaks rejoined, ligatures spelled out, page furniture dropped,
   nothing else changed. Scene notes the job adds elsewhere (a driver's
   piloting bonus, who sits where) stay with the job, not here.

   WHAT THIS PAGE PRINTS that the Toolkit's blocks do not:
     - Resolve is on 6 of the 7. The Spotter Drone has none, and as in the
       Toolkit its ABSENCE is meaningful; Bystander's runs on into a clause.
     - XP is on every entry as the printed string. Bystander's and Forklift
       Jerry's are "0" followed by a sentence; EN.gmEngine.xpOf reads the
       leading number, so both count as 0.
     - `role` is null on Bystander, the one block that prints no Role.
     - Gear on the 6 people, `salvage` on the drone. No subgroups: the page
       prints no run-in subheads.

   NAMES. Three blocks are the Toolkit's threats retuned for the job. The
   officer keeps the page's full heading, "Corpsec Officer (Quill, Doan,
   Pryce)". "Riot Trooper" and "Spotter Drone" are printed bare, the same
   names as Toolkit entries; the app looks threats up by name (the first
   match wins), so the author had them renamed "Riot Trooper (Quick-Start)"
   and "Spotter Drone (Quick-Start)" (28 Nov 2026).

   SOURCES. `page` is the PDF page in EN1003 (its printed folio is 45), for
   tracing only and never displayed. User-facing text carries no page numbers.
   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
EN.quickstart.threats = {
  // EN1003 p49, the page's lead-in
  category: {
    key: "quickstart", name: "The Fifth Flavor (Quick-Start)", count: 7,
    intro: "Everyone in the job who might end up in a fight, A to Z. The first line gives the Grade, Designation, and Role. The number in parentheses after a damage roll is its average, for when you'd rather not roll for a crowd. Minions are out of the fight at 0 Vitality. Every person here has a Resolve line, because everyone here can, in principle, be talked to."
  },

  subgroups: [],

  entries: [
    {
      name: "Bystander", category: "quickstart", subgroup: null, page: 49,
      grade: 1, designation: "Minion", role: null,
      identity: "Grade 1 Minion. Medium, any species or a machine with a job, on the wrong shift. Silt, Kettle, Teo, Marisol, Restock, Cassia, Nalo, Odette, and anyone else who's just working.",
      stats: { "Defense": "10", "DR": "0", "Vitality": "6", "Speed": "6", "Initiative": "+1", "Saves": "+1 all", "Passive Perception": "10", "XP": "0. Nobody pays for this.", "Resolve": "3 (Pushover), unless their card says otherwise" },
      abilities: [
        { name: "Whatever's in Reach", cost: "Action", text: "+3 vs Defense, melee, 1d4 Bludgeoning (2)." },
        { name: "Not a Fighter", cost: null, text: "A Bystander spends its turns getting away, getting down, or getting help. It attacks only when cornered." }
      ],
      gear: "Whatever they were holding."
    },
    {
      name: "Corpsec Officer (Quill, Doan, Pryce)", category: "quickstart", subgroup: null, page: 49,
      grade: 2, designation: "Standard", role: "Gunhand",
      identity: "Grade 2 Standard, Gunhand. Medium Human.",
      stats: { "Defense": "13", "DR": "3 (Composite Kit)", "Vitality": "30", "Speed": "6", "Initiative": "+4", "Saves": "+5 Body and Wits, +1 others", "Passive Perception": "13", "XP": "150", "Resolve": "5 (Standard)" },
      abilities: [
        { name: "Carbine", cost: "Action", text: "+6 vs Defense, Range 12 / 36, 1d10+3 Ballistic (8)." },
        { name: "Shock Baton", cost: "Action", text: "+6 vs Defense, melee, 1d6+3 Electric (6), Nonlethal, Shock: the Target makes a Body Save (DC 12) or is Staggered until the end of its next turn." },
        { name: "Hold the Line", cost: null, text: "While within 2 spaces of an allied Corpsec Officer, this officer's attacks score a critical hit on a 19 or 20." },
        { name: "Fall Back", cost: "Impulse", text: "When first reduced below half Vitality, move up to half Speed toward cover without provoking Opportunity Attacks." }
      ],
      gear: "Carbine, Shock Baton, Composite Kit, corp credentials."
    },
    {
      name: "Forklift Jerry", category: "quickstart", subgroup: null, page: 49,
      grade: 1, designation: "Standard", role: "Bruiser",
      identity: "Grade 1 Standard, Bruiser. Large Clanker on a forklift chassis.",
      stats: { "Defense": "11", "DR": "1 (steel chassis)", "Vitality": "25", "Speed": "5", "Initiative": "+2", "Saves": "+4 Body, +1 others", "Passive Perception": "11", "XP": "0. It wasn't a threat.", "Resolve": "3 (Pushover)" },
      abilities: [
        { name: "Forks", cost: "Action", text: "+5 vs Defense, melee, 1d8+3 Bludgeoning (7)." },
        { name: "Lift", cost: "Action", text: "One Medium or smaller Target in reach rides the forks: a willing rider goes up to Jerry's Speed, or up through the pallet gate to the mezzanine, and steps off standing; anyone else makes an Agility Save (DC 12) or is set down 4 spaces away." },
        { name: "Pallet Wall", cost: "Action", text: "Jerry sets its pallet down in an adjacent space: Average cover (Structure 9, Integrity 12)." },
        { name: "Machine Physiology", cost: null, text: "Immune to disease, organic poisons, toxic gases, and the Poisoned condition. Psychic damage lands in full." },
        { name: "Resonant Circuitry", cost: null, text: "Edge on Saves against EMP, digital viruses, and Tech damage." },
        { name: "Not Authorized", cost: null, text: "Jerry never starts a fight, and it swings its forks only at someone who hit it first. For a crew that was decent to it, it builds cover, gives rides, and lifts people out of the way. It will not swing for them. It's not authorized to." }
      ],
      gear: "Forks, a pallet of cartons, JERRY stenciled on the mast in someone else's handwriting."
    },
    {
      name: "Riot Trooper (Quick-Start)", category: "quickstart", subgroup: null, page: 49,
      grade: 2, designation: "Minion", role: "Gunhand",
      identity: "Grade 2 Minion, Gunhand. Medium Human. Paid by the hour.",
      stats: { "Defense": "14 (Riot Shield)", "DR": "3 (Enforcer Rig)", "Vitality": "10", "Speed": "5", "Initiative": "+2", "Saves": "+5 Body, +1 others", "Passive Perception": "12", "XP": "50", "Resolve": "3 (Pushover)" },
      abilities: [
        { name: "Shock Baton", cost: "Action", text: "+6 vs Defense, melee, 1d6+2 Electric (5), Nonlethal, Shock: the Target makes a Body Save (DC 12) or is Staggered until the end of its next turn. The baton is for arrests. The paperwork is for survivors." },
        { name: "Shield Wall", cost: null, text: "+1 Defense for each adjacent Riot Trooper, to a maximum of +2." },
        { name: "Advance in Step", cost: null, text: "While two or more Riot Troopers are adjacent to each other, each can Shove as a Swift Action (Athletics +5)." }
      ],
      gear: "Shock Baton, Riot Shield, Enforcer Rig, zip restraints."
    },
    {
      name: "Spotter Drone (Quick-Start)", category: "quickstart", subgroup: null, page: 49,
      grade: 1, designation: "Minion", role: "Support",
      identity: "Grade 1 Minion, Support. Tiny rotor drone.",
      stats: { "Defense": "13", "DR": "0", "Vitality": "6", "Speed": "8 (flight)", "Initiative": "+4", "Saves": "+4 Agility, +1 others", "Passive Perception": "15", "XP": "25" },
      abilities: [
        { name: "Mindless", cost: null, text: "Psychic damage deals 0 to it. Immune to Toxic damage and to anything that reads a mind it doesn't have." },
        { name: "Eyes Up", cost: null, text: "Allied threats gain +1 on attacks against Targets this drone can see." },
        { name: "Squawk", cost: "Special", text: "When it spots the crew or takes damage, it transmits. The site's response clock starts, or skips a line if it's already running." },
        { name: "Onboard Node", cost: null, text: "Rudimentary [-1] (Security Rating 10). One successful hack bricks, blinds, or flips it. Flipped, it turns its light on the troopers and announces, \"Customer located.\"" }
      ],
      salvage: "Rotors, a camera, 𝒢40 in parts to the right kiosk."
    },
    {
      name: "Sump Rat Pump Crew", category: "quickstart", subgroup: null, page: 49,
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
      name: "Undertow of the Quiet Sump", category: "quickstart", subgroup: null, page: 49,
      grade: 2, designation: "Standard", role: "Controller",
      identity: "Grade 2 Standard, Controller. Medium Verdine, old, with leaves grown in pale.",
      stats: { "Defense": "13", "DR": "1 (thick waders)", "Vitality": "30", "Speed": "6", "Initiative": "+4", "Saves": "+5 Body and Wits, +1 others", "Passive Perception": "13", "XP": "150", "Resolve": "5 (Standard)" },
      abilities: [
        { name: "Valve Key", cost: "Action", text: "+6 vs Defense, melee, 1d8+5 Bludgeoning (9). A steel key as long as a leg, for valves nobody else can turn." },
        { name: "Open the Sluice", cost: "Action, once per scene", text: "A fight is a loud act, so the pump has already cycled (The Midnight Cycle, Scene 2). Undertow throws the main valve and cycles it again: anyone on the open floor makes an Agility Save (DC 13) or goes Prone in the water." },
        { name: "Home Ground", cost: null, text: "Water, mud, and flooded floors aren't Difficult Terrain for Undertow." },
        { name: "Ecological Filter", cost: null, text: "Resistance to Toxic damage; immune to smog." },
        { name: "Rooted Stance", cost: "Impulse", text: "When moved against their will or knocked Prone, Undertow cancels it and can't be knocked Prone until the end of their next turn." },
        { name: "The Room", cost: null, text: "Attack Undertow and every Sump Rat at the drum stands up (If It Goes Sideways, Scene 2)." }
      ],
      gear: "Valve key, waders, the FULLWELL INTAKE pump key on a cord."
    }
  ]
};
