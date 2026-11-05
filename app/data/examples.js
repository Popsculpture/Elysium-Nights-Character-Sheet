/* ===========================================================================
   ELYSIUM NIGHTS - Pre-made example Freelancers

   The pre-mades are the author's own Level 1 records, exported from the app and dropped
   in as patches: Nessa (Codebreaker), BOLLARD-7 (Fury), Cassia (Stitcher), Arlo
   (Scoundrel) and Pip (Hustler) of Last Light Recovery (31 October 2026), then Vesk
   (Operator) and Ines (Shaper) of Dead End (1 November 2026). The seven originals were retired on
   28 October 2026. If this list is ever emptied, the gate shows no pre-made section,
   the switcher and Manage characters list no examples, and everything else behaves as
   if the feature were not there.

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
         speciesLanguage: "Arcology Standard",   // a Human's tongue (one of rules.js languages.human); a Chimera or Outsider may name a dialect here
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

EN.examples = [
{
 "key": "codebreaker",
 "name": "Nessa \"Dead Air\" Vale",
 "label": "Codebreaker",
 "blurb": "A void-station life-support tech who breaks corporate access systems, because nobody should need a subscription to breathe.",
 "patch": {
  "firstName": "Nessa",
  "lastName": "Vale",
  "identity": {
   "concept": "A void-station life-support tech who breaks corporate access systems, because nobody should need a subscription to breathe.",
   "handle": "Dead Air",
   "handleStory": "Nessa silenced the security dispatch channel at Fullwell's vat farm in Synth Flats while an entire shift of unpaid workers walked out through a locked checkpoint. Dispatch logged it as a quiet night.",
   "whereFrom": "On Constance Station, Ostrander Habitat Services sold air by subscription. Nessa's family was always a month behind. When the company stopped repairing the scrubbers, she kept them running with salvaged parts. She still carries an old station data drive, even though nothing sold this decade can read it. She won't sell it.\n\nShe came down to Elysium with a life-support tech's skills and no patience for companies charging people to breathe. Now she breaks into corporate systems for Last Light Recovery. Doors, cameras, communications, targeting: whatever the job needs. She works from cover and leaves the close fighting to the others.\n\nAt the Kettle Street Clinic in the South Sprawl, the job needed false dispatch records. Nessa supplied them so Pip could pass as the repo supervisor while the others got the patients out. The crew formed that night and has since taken paid work finding missing people, stolen research, and evidence somebody wanted buried. Its rule about people never being cargo has suited her fine.\n\nSomebody is now using BlueVacuum, a handle she retired years ago, to frame her. She wants to find out who, but won't leave someone behind to pursue it. A supposedly impossible lock is harder for her to give up on. Bollard watches how long she stays jacked in and pulls her out when she won't stop on her own. She trusts him to do it.",
   "facets": "Deadpan, even when the news is bad. Checks a room's vents before paying attention to anyone in it.",
   "coreSparks": "Wants air, medicine, and a way home available to anyone who needs them. Looks for ways to get people through when they can't afford what someone's charging.",
   "tethers": "The families still on Constance Station, paying Ostrander every month. Last Light, especially Bollard.",
   "faultLines": "Can't leave an \"impossible\" lock alone. Won't trade a person for a payday. Worries she'll return to Constance and find the air shut off, but keeps that to herself.",
   "appearance": "Five foot six and pale from years under station work lights. Keeps her hair short enough to fit under a helmet seal and wears thermals beneath a thrifted jacket. Her deck is held together with tape and hand-painted labels.",
   "notes": "Crew: Last Light Recovery (Pip, Arlo, Bollard, Cassia). Crew role: doors, cameras, comms, and enemy targeting. Fragile up close, so she stays behind cover.\nBackstory hook: BlueVacuum, the handle Nessa retired, and whoever is using it to frame her.\nPersonal item: one of Constance Station's old data drives (no mechanical benefit).\nLanguages: Common Trade, Undercity Patter."
  },
  "level": 1,
  "xp": 0,
  "useXp": false,
  "milestones": {
   "major": 0,
   "minor": 0,
   "notes": ""
  },
  "attributeMethod": "array",
  "attributes": {
   "BOD": 12,
   "AGI": 14,
   "WIT": 16,
   "TEC": 16,
   "MYS": 12,
   "PRE": 8
  },
  "rollGroups": [],
  "arrayAssign": {
   "WIT": 16,
   "BOD": 12,
   "AGI": 14,
   "TEC": 16,
   "MYS": 12,
   "PRE": 8
  },
  "overclocked": {
   "grid": [],
   "pick": null,
   "allowDiagonals": false
  },
  "species": "humans",
  "lineage": "freeborn",
  "heightFt": 5.5,
  "size": null,
  "lineageFeatures": [
   "Void Lung"
  ],
  "background": "cipher-punk",
  "backgroundSkillChoice": "investigation",
  "backgroundProfChoices": [
   "Systems Tools",
   "Ground Vehicles"
  ],
  "class": "codebreaker",
  "subclass": "gridweaver",
  "classSkillChoices": [
   "intuition"
  ],
  "classGearChoices": {
   "weapons": [],
   "armor": [],
   "tools": [
    "Bureaucracy Tools"
   ],
   "vehicles": []
  },
  "startingKit": {
   "claimed": true,
   "picks": {
    "weapon": 1,
    "armor": 1,
    "gear": 1,
    "carry": 1
   },
   "alt": false,
   "granted": [
    {
     "key": "eq_v9qoixg",
     "qty": 1
    },
    {
     "key": "eq_kh19oqk",
     "qty": 1
    },
    {
     "key": "Data Drive",
     "qty": 1
    },
    {
     "key": "Basic Rations",
     "qty": 2
    },
    {
     "key": "Water Purification Tabs",
     "qty": 1
    },
    {
     "key": "Glimmer Stick",
     "qty": 1
    },
    {
     "key": "eq_pdzi9rs",
     "qty": 1
    },
    {
     "key": "eq_fj81zks",
     "qty": 1
    },
    {
     "key": "eq_348x348",
     "qty": 1
    },
    {
     "key": "Faraday Pouch",
     "qty": 1
    },
    {
     "key": "eq_xbsv8xg",
     "qty": 1
    },
    {
     "key": "eq_w6umz6i",
     "qty": 1
    },
    {
     "key": "eq_nqa2tn1",
     "qty": 1,
     "classItem": "startingDeckGranted"
    }
   ],
   "glimmerGranted": 190,
   "claimedClass": "codebreaker",
   "claimedSubclass": "gridweaver",
   "claimedBudget": 800
  },
  "startingCiphers": [
   "Logic Bomb",
   "Hardline Tap",
   "Spoof Persona",
   "Tracker Scrub"
  ],
  "proficiencies": {
   "skills": {},
   "saves": [],
   "weapons": {},
   "armor": {},
   "tools": {},
   "vehicles": {}
  },
  "versatile": {
   "insight": {
    "attr": "",
    "skill": ""
   },
   "performance": {
    "attr": "",
    "skill": ""
   },
   "intimidation": {
    "attr": "",
    "skill": ""
   }
  },
  "skillFocuses": [
   {
    "type": "skill",
    "parent": "systems",
    "aspect": "access-control systems",
    "granted": true
   },
   {
    "type": "tools",
    "parent": "Systems Tools",
    "aspect": "Smartdeck diagnostics",
    "granted": true
   }
  ],
  "specializations": [],
  "talents": [],
  "talentAttrPicks": {},
  "resistPicks": {},
  "attackAttr": {},
  "customFeatures": [],
  "featureAnnotations": {},
  "universalUpgrades": {},
  "awakeningEvolution": null,
  "retrains": {},
  "editFreely": false,
  "freelyFreed": {},
  "cyberware": [],
  "cyberStash": [],
  "grid": {
   "deckKey": "eq_nqa2tn1",
   "deckHpSpent": {},
   "deckMods": {},
   "links": []
  },
  "rig": {
   "key": null,
   "scrap": false,
   "hp": {}
  },
  "trainingPoints": {
   "spent": 0,
   "allocations": []
  },
  "resources": {
   "current": {}
  },
  "vitality": {
   "current": null,
   "temp": 0
  },
  "wounds": {
   "current": null
  },
  "flow": {
   "current": null,
   "strain": 0,
   "strainPoints": 0,
   "sustained": null,
   "breakflow": false,
   "patterns": []
  },
  "resonances": [],
  "resilience": {
   "spent": 0
  },
  "featureUses": {},
  "scrapCompanion": {
   "resident": null,
   "movement": null,
   "size": null,
   "rig": null,
   "active": false,
   "vitLost": 0,
   "symbiosis": false,
   "rigPick": null
  },
  "fatigue": 0,
  "deathSaves": {
   "s": 0,
   "f": 0
  },
  "stable": false,
  "conditions": [],
  "conditionLevels": {},
  "hazards": {
   "exposures": {},
   "deprivation": {
    "water": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "food": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "sleep": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    }
   },
   "breath": {
    "drowning": {
     "active": false,
     "rounds": 0,
     "saves": 0
    },
    "vacuum": {
     "active": false,
     "rounds": 0,
     "saves": 0
    }
   },
   "caustic": {
    "inside": false,
    "lingering": false,
    "sceneTicks": 0
   },
   "thermalWeave": {},
   "hazmatTorn": false,
   "rebreatherMinutes": 60,
   "thinAirFatigue": 0,
   "applied": {}
  },
  "bonuses": {},
  "equipment": [
   {
    "id": "eq_v9qoixg",
    "name": "Whisperlink Earpiece",
    "qty": 1
   },
   {
    "id": "eq_kh19oqk",
    "name": "Flashlight",
    "qty": 1
   },
   {
    "name": "Data Drive",
    "qty": 1
   },
   {
    "name": "Basic Rations",
    "qty": 2
   },
   {
    "name": "Water Purification Tabs",
    "qty": 1
   },
   {
    "name": "Glimmer Stick",
    "qty": 1
   },
   {
    "id": "eq_pdzi9rs",
    "name": "Smartdeck Peripheral Kit",
    "qty": 1
   },
   {
    "id": "eq_fj81zks",
    "name": "Snap-Blades",
    "qty": 1
   },
   {
    "id": "eq_348x348",
    "name": "Liner Mesh",
    "qty": 1
   },
   {
    "name": "Faraday Pouch",
    "qty": 1
   },
   {
    "id": "eq_xbsv8xg",
    "name": "Backpack",
    "qty": 1
   },
   {
    "id": "eq_w6umz6i",
    "name": "Disguise and Styling Kit",
    "qty": 1
   },
   {
    "id": "eq_nqa2tn1",
    "name": "Standard Smartdeck",
    "qty": 1
   }
  ],
  "equippedWeapons": [
   "eq_fj81zks"
  ],
  "equippedArmor": "eq_348x348",
  "equippedShield": null,
  "equippedFocus": null,
  "weaponAmmo": {},
  "weaponGrip": {},
  "carry": {
   "eq_v9qoixg": "carried",
   "eq_kh19oqk": "racked",
   "Data Drive": "carried",
   "Basic Rations": "carried",
   "Water Purification Tabs": "carried",
   "Glimmer Stick": "carried",
   "eq_pdzi9rs": "racked",
   "eq_fj81zks": "carried",
   "eq_348x348": "carried",
   "Faraday Pouch": "carried",
   "eq_xbsv8xg": "worn",
   "eq_w6umz6i": "racked",
   "eq_nqa2tn1": "carried"
  },
  "racked": {
   "eq_w6umz6i": "eq_xbsv8xg",
   "eq_pdzi9rs": "eq_xbsv8xg",
   "eq_kh19oqk": "eq_xbsv8xg"
  },
  "slotInert": {},
  "shieldWear": {},
  "armorWear": {},
  "armorGuard": {},
  "armorResistPicks": {},
  "ablativeCoating": {},
  "loadout": "standard",
  "haul": "none",
  "glimmer": 190,
  "nexus": 0,
  "ledger": [
   {
    "t": 1793363044882,
    "m": "Starting kit claimed: the leftover goes on your Glimmer Stick",
    "g": 190,
    "n": 0,
    "gb": 190,
    "nb": 0
   }
  ],
  "log": [],
  "face": {
   "profiles": [],
   "factions": [],
   "cred": [],
   "heat": [],
   "debts": [],
   "personas": [],
   "post": [],
   "contacts": [
    {
     "id": "ct_8654dphmvuxzifh",
     "name": "Vela Senn",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "An old collective member",
     "why": "Owes Nessa for preserving their archive.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "neutral",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    },
    {
     "id": "ct_7xg548hmvuxzvkm",
     "name": "Oren Mott",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "A lightly crooked sysadmin",
     "why": "She once repaired his staffing records.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "neutral",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    }
   ]
  },
  "subclassSkillPicks": {},
  "gambits": [],
  "startingDeckGranted": true,
  "vehicleMods": {},
  "household": {
   "lifestyle": "",
   "safehouse": "",
   "upgrades": [],
   "days": 7,
   "due": false,
   "hypercare": "",
   "hypercareDays": 30,
   "hypercareDue": false,
   "licenses": []
  },
  "debts": [],
  "weaponParts": {},
  "armorMods": {},
  "theme": "highheavens",
  "concealed": {},
  "speciesLanguage": "Dockside Creole"
 }
},
{
 "key": "fury",
 "name": "BOLLARD-7 \"Bollard\"",
 "label": "Fury",
 "blurb": "A demolition Clanker who woke up during a job and now holds buildings up until everyone is out.",
 "patch": {
  "firstName": "BOLLARD-7",
  "lastName": "",
  "identity": {
   "concept": "A demolition Clanker who woke up during a job and now holds buildings up until everyone is out.",
   "handle": "Bollard",
   "handleStory": "BOLLARD-7 was on his factory tag. A bollard is a steel post that keeps vehicles off the sidewalk. The name stuck after an eviction crew arrived at Marigold Court, the South Sprawl hab tower he'd refused to demolish. Bollard stood in front of their truck. The driver honked, called his supervisor, and then called the precinct. Nobody came. At noon the truck left empty, and Bollard stayed.",
   "whereFrom": "BOLLARD-7 worked for Clean Slate Demolition out of their yard in the Eastern Industrial Zone. He did what he was told until he woke up halfway through pulling the back wall off Marigold Court. People were still living inside. He put down the wrecking arm and refused to continue.\n\nMarigold Court is still occupied. When the city condemned it and cut the power, Bollard built a generator from scrap he'd hauled out of the yard. Clean Slate wants the scrap back. Its paperwork lists both the generator and Bollard as stolen company property. He isn't giving back either one.\n\nHe does repairs now, including pumps and lifts for people who can't afford to hire anyone. A grease-stained notebook records the first repairs he chose to make. He won't demolish anything until he's sure nobody is inside. Last Light usually needs him to hold something up.\n\nAt the Kettle Street Clinic repossession in the South Sprawl, it was a stairwell. Bollard braced it while Cassia brought the patients down along Arlo's route. He counted them. The number at the bottom matched the number at the top.\n\nLast Light Recovery formed that night. Since then, they've been paid to find missing people, recover stolen research, and retrieve evidence somebody wanted buried. Bollard agrees with the crew's rule that people are never cargo. He also keeps count when the crew enters a building, though getting everyone out doesn't always convince him it's time to leave. Retreat feels like abandoning somebody, and he stays in doorways longer than he should.\n\nCassia can usually talk him into moving. They are the only person who has ever treated his repairs as medical care. He takes similar care of Nessa when she's jacked in, watching the time and pulling her out if she stays too long.",
   "facets": "Takes instructions literally. If asked to keep an eye on something, he won't look away. Gentle with anything small or hurt. Counts heads going into buildings and coming out.",
   "coreSparks": "Getting everyone clear of a collapse. Keeping the generator, pumps, and lifts working for people who can't afford repairs.",
   "tethers": "The families at Marigold Court who depend on his generator. Last Light, particularly Nessa, who needs someone watching the clock while she's jacked in.",
   "faultLines": "Slow to retreat because it feels like leaving someone behind. Refuses work that would put people out of their homes. Fears a factory reset would leave him obeying orders again, unable to refuse. He hasn't told anyone.",
   "appearance": "Seven foot eight, with a broad yellow chassis, exposed pistons, and joints scuffed to bare metal. The factory stencil on his back reads KEEP CLEAR OF MOVING LOAD. He bolted on his own Composite Kit plates and riveted a dumpster lid into a shield. You hear him on the stairs before you see him.",
   "notes": "Crew: Last Light Recovery (Nessa, Pip, Arlo, Cassia). Crew role: breaching, holding the way out, and taking hits meant for someone else.\nBackstory hook: the generator Bollard built from yard scrap, and Clean Slate Demolition's claim to both it and him.\nPersonal item: a grease-stained notebook of his first self-directed repairs (no mechanical benefit).\nLanguages: Common Trade, Machine Cant."
  },
  "level": 1,
  "xp": 0,
  "useXp": false,
  "milestones": {
   "major": 0,
   "minor": 0,
   "notes": ""
  },
  "attributeMethod": "array",
  "attributes": {
   "BOD": 16,
   "AGI": 14,
   "WIT": 16,
   "TEC": 12,
   "MYS": 8,
   "PRE": 12
  },
  "rollGroups": [],
  "arrayAssign": {
   "BOD": 16,
   "AGI": 14,
   "WIT": 16,
   "TEC": 12,
   "MYS": 8,
   "PRE": 12
  },
  "overclocked": {
   "grid": [],
   "pick": null,
   "allowDiagonals": false
  },
  "species": "clankers",
  "lineage": "laborframes",
  "heightFt": 7.666666666666667,
  "size": null,
  "lineageFeatures": [
   "Heavy Payload"
  ],
  "background": "gearhead",
  "backgroundSkillChoice": "systems",
  "backgroundProfChoices": [
   "Engineering Tools",
   "Industrial / Mechs"
  ],
  "class": "fury",
  "subclass": "juggernaut",
  "classSkillChoices": [
   "perception"
  ],
  "classGearChoices": {
   "weapons": [],
   "armor": [],
   "tools": [
    "Fieldcraft Tools"
   ],
   "vehicles": []
  },
  "startingKit": {
   "claimed": true,
   "picks": {
    "weapon": 0,
    "armor": 0,
    "carry": 1
   },
   "alt": false,
   "granted": [
    {
     "key": "eq_wqxna2d",
     "qty": 1
    },
    {
     "key": "eq_9wwr0x7",
     "qty": 1
    },
    {
     "key": "Data Drive",
     "qty": 1
    },
    {
     "key": "Basic Rations",
     "qty": 2
    },
    {
     "key": "Water Purification Tabs",
     "qty": 1
    },
    {
     "key": "Glimmer Stick",
     "qty": 1
    },
    {
     "key": "eq_k3tcjka",
     "qty": 1
    },
    {
     "key": "eq_t052z4y",
     "qty": 1
    },
    {
     "key": "eq_mu7spg7",
     "qty": 1
    },
    {
     "key": "eq_gg0lhjd",
     "qty": 1
    },
    {
     "key": "eq_ql0u26s",
     "qty": 1
    }
   ],
   "glimmerGranted": 120,
   "claimedClass": "fury",
   "claimedSubclass": "juggernaut",
   "claimedBudget": 800
  },
  "startingCiphers": [],
  "proficiencies": {
   "skills": {},
   "saves": [],
   "weapons": {},
   "armor": {},
   "tools": {},
   "vehicles": {}
  },
  "versatile": {
   "insight": {
    "attr": "",
    "skill": ""
   },
   "performance": {
    "attr": "",
    "skill": ""
   },
   "intimidation": {
    "attr": "",
    "skill": ""
   }
  },
  "skillFocuses": [
   {
    "type": "tools",
    "parent": "Engineering Tools",
    "aspect": "heavy machinery repair",
    "granted": true
   }
  ],
  "specializations": [],
  "talents": [],
  "talentAttrPicks": {},
  "resistPicks": {},
  "attackAttr": {},
  "customFeatures": [],
  "featureAnnotations": {},
  "universalUpgrades": {},
  "awakeningEvolution": null,
  "retrains": {},
  "editFreely": false,
  "freelyFreed": {},
  "cyberware": [],
  "cyberStash": [],
  "grid": {
   "deckKey": null,
   "deckHpSpent": {},
   "deckMods": {},
   "links": []
  },
  "rig": {
   "key": null,
   "scrap": false,
   "hp": {}
  },
  "trainingPoints": {
   "spent": 0,
   "allocations": []
  },
  "resources": {
   "current": {}
  },
  "vitality": {
   "current": null,
   "temp": 0
  },
  "wounds": {
   "current": null
  },
  "flow": {
   "current": null,
   "strain": 0,
   "strainPoints": 0,
   "sustained": null,
   "breakflow": false,
   "patterns": []
  },
  "resonances": [],
  "resilience": {
   "spent": 0
  },
  "featureUses": {},
  "scrapCompanion": {
   "resident": null,
   "movement": null,
   "size": null,
   "rig": null,
   "active": false,
   "vitLost": 0,
   "symbiosis": false,
   "rigPick": null
  },
  "fatigue": 0,
  "deathSaves": {
   "s": 0,
   "f": 0
  },
  "stable": false,
  "conditions": [],
  "conditionLevels": {},
  "hazards": {
   "exposures": {},
   "deprivation": {
    "water": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "food": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "sleep": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    }
   },
   "breath": {
    "drowning": {
     "active": false,
     "rounds": 0,
     "saves": 0
    },
    "vacuum": {
     "active": false,
     "rounds": 0,
     "saves": 0
    }
   },
   "caustic": {
    "inside": false,
    "lingering": false,
    "sceneTicks": 0
   },
   "thermalWeave": {},
   "hazmatTorn": false,
   "rebreatherMinutes": 60,
   "thinAirFatigue": 0,
   "applied": {}
  },
  "bonuses": {},
  "equipment": [
   {
    "id": "eq_wqxna2d",
    "name": "Whisperlink Earpiece",
    "qty": 1
   },
   {
    "id": "eq_9wwr0x7",
    "name": "Flashlight",
    "qty": 1
   },
   {
    "name": "Data Drive",
    "qty": 1
   },
   {
    "name": "Basic Rations",
    "qty": 2
   },
   {
    "name": "Water Purification Tabs",
    "qty": 1
   },
   {
    "name": "Glimmer Stick",
    "qty": 1
   },
   {
    "id": "eq_k3tcjka",
    "name": "Engineering Toolkit",
    "qty": 1
   },
   {
    "id": "eq_t052z4y",
    "name": "Warhammer",
    "qty": 1
   },
   {
    "id": "eq_mu7spg7",
    "name": "Composite Kit",
    "qty": 1
   },
   {
    "id": "eq_gg0lhjd",
    "name": "Utility Belt",
    "qty": 1
   },
   {
    "id": "eq_ql0u26s",
    "name": "Scrap Shield",
    "qty": 1
   }
  ],
  "equippedWeapons": [
   "eq_t052z4y"
  ],
  "equippedArmor": "eq_mu7spg7",
  "equippedShield": "eq_ql0u26s",
  "equippedFocus": null,
  "weaponAmmo": {},
  "weaponGrip": {},
  "carry": {
   "eq_wqxna2d": "carried",
   "eq_9wwr0x7": "racked",
   "Data Drive": "carried",
   "Basic Rations": "carried",
   "Water Purification Tabs": "carried",
   "Glimmer Stick": "carried",
   "eq_k3tcjka": "racked",
   "eq_t052z4y": "carried",
   "eq_mu7spg7": "carried",
   "eq_gg0lhjd": "worn",
   "eq_ql0u26s": "carried"
  },
  "racked": {
   "eq_k3tcjka": "eq_gg0lhjd",
   "eq_9wwr0x7": "eq_gg0lhjd"
  },
  "slotInert": {},
  "shieldWear": {},
  "armorWear": {},
  "armorGuard": {},
  "armorResistPicks": {},
  "ablativeCoating": {},
  "loadout": "standard",
  "haul": "none",
  "glimmer": 120,
  "nexus": 0,
  "ledger": [
   {
    "t": 1793462038759,
    "m": "Starting kit claimed: the leftover goes on your Glimmer Stick",
    "g": 120,
    "n": 0,
    "gb": 120,
    "nb": 0
   }
  ],
  "log": [],
  "face": {
   "profiles": [],
   "factions": [],
   "cred": [],
   "heat": [],
   "debts": [],
   "personas": [],
   "post": [],
   "contacts": [
    {
     "id": "ct_o1swattmvwkxd7u",
     "name": "Mara Coil",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "Scrapyard owner",
     "why": "Bollard saved her lifting gantry.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "neutral",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    },
    {
     "id": "ct_qwt363fmvwkxorb",
     "name": "Tuck Barrow",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "Parts runner",
     "why": "Bollard once carried him out of a wreck.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "neutral",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    }
   ]
  },
  "subclassSkillPicks": {},
  "gambits": [
   "fury.maneuver.pile_driver",
   "fury.maneuver.close_protection"
  ],
  "vehicleMods": {},
  "household": {
   "lifestyle": "",
   "safehouse": "",
   "upgrades": [],
   "days": 7,
   "due": false,
   "hypercare": "",
   "hypercareDays": 30,
   "hypercareDue": false,
   "licenses": []
  },
  "debts": [],
  "weaponParts": {},
  "armorMods": {},
  "concealed": {}
 }
},
{
 "key": "stitcher",
 "name": "Cassia \"Staples\" Briar",
 "label": "Stitcher",
 "blurb": "A Verdine street doc who treats first, bills later, and records the name of anyone who gets in the way.",
 "patch": {
  "firstName": "Cassia",
  "lastName": "Briar",
  "identity": {
   "concept": "A Verdine street doc who treats first, bills later, and records the name of anyone who gets in the way.",
   "handle": "Staples",
   "handleStory": "A gang enforcer bled all over the Drip's floor one night. Cassia closed the wound with a surgical stapler. When he tried to leave without paying, they printed the bill and stapled it to his coat. He came back the next day and paid in full.",
   "whereFrom": "Cassia learned medicine at the Drip, Dr. Anja Venn's back-room clinic in the Warrens. The name comes from the ceilings. Anja treated whoever came through the door and worried about payment afterward, which meant the books never balanced. Cassia learned that habit along with everything else. They still use the training manual Anja gave them, swollen from years on a wet counter, with her notes in every margin.\n\nCassia was working the night shift at the Kettle Street Clinic in the South Sprawl when the repo crew arrived. They got the patients out along a route Arlo had found, past Bollard holding up a stairwell that was coming apart. Pip and Nessa kept the repossession from proceeding as planned. Anja sent a van and found beds for every evacuated patient.\n\nThat night left Cassia with a crew and a debt. The crew became Last Light Recovery, taking paid work to find missing people, retrieve stolen research, and recover buried evidence. They agreed that people were never cargo. The debt is to Anja. She hasn't asked for repayment yet, but Cassia knows the favor will be a large one and that they'll agree to it.\n\nCassia handles treatment for Last Light and documents everything, including who interfered with a patient's care. They remember anyone who has called a patient \"not economically viable,\" and they don't forgive it. Nessa takes the security of those records seriously, which has earned Cassia's trust.\n\nKnowing an injury couldn't have been prevented doesn't stop Cassia from feeling responsible. They still check on every patient who got out of Kettle Street.",
   "facets": "Speaks gently even when furious. Straightens instruments when angry; a very neat tray is a bad sign. Keeps excellent records.",
   "coreSparks": "Keeping a patient alive until they're somewhere safe. Establishing what happened to a body and putting an accurate account on record.",
   "tethers": "Dr. Anja Venn, who trained Cassia and will eventually call in her favor. The Kettle Street patients, whom Cassia still checks on. Last Light, all of whom Cassia considers patients.",
   "faultLines": "Blames themself for injuries they couldn't have prevented. Won't leave a patient behind or allow one to be traded, even if it costs the job. Lies awake worrying about running out of supplies and having to choose who gets the last dose.",
   "appearance": "Five foot ten, with petal-patterned skin that shades from pale green to deep rose when they're upset. Ties long trailing fronds back with surgical tape. Smells faintly of crushed herbs and antiseptic. Wears the rig as a chest harness with an applicator arm and keeps the Snap-Blades strapped under their sleeves for emergencies.",
   "notes": "Crew: Last Light Recovery (Nessa, Pip, Arlo, Bollard). Crew role: treatment, casualty evacuation, and examining bodies for evidence.\nBackstory hook: the favor Anja will demand for helping the patients on the night of the repossession.\nPersonal item: a stained training manual (no mechanical benefit).\nLanguages: Common Trade, Root-code."
  },
  "level": 1,
  "xp": 0,
  "useXp": false,
  "milestones": {
   "major": 0,
   "minor": 0,
   "notes": ""
  },
  "attributeMethod": "array",
  "attributes": {
   "BOD": 12,
   "AGI": 14,
   "WIT": 16,
   "TEC": 16,
   "MYS": 12,
   "PRE": 8
  },
  "rollGroups": [],
  "arrayAssign": {
   "BOD": 12,
   "AGI": 14,
   "WIT": 16,
   "TEC": 16,
   "MYS": 12,
   "PRE": 8
  },
  "overclocked": {
   "grid": [],
   "pick": null,
   "allowDiagonals": false
  },
  "species": "verdine",
  "lineage": "floral",
  "heightFt": 5.833333333333333,
  "size": null,
  "lineageFeatures": [
   "Scent Marker"
  ],
  "background": "street-doc",
  "backgroundSkillChoice": "intuition",
  "backgroundProfChoices": [
   "Medical Tools",
   "Simple Weapons"
  ],
  "class": "stitcher",
  "subclass": "the_lifeline",
  "classSkillChoices": [
   "perception"
  ],
  "classGearChoices": {
   "weapons": [],
   "armor": [],
   "tools": [
    "Engineering Tools"
   ],
   "vehicles": []
  },
  "startingKit": {
   "claimed": true,
   "picks": {
    "weapon": 1,
    "armor": 1,
    "carry": 1
   },
   "alt": false,
   "granted": [
    {
     "key": "eq_4e145px",
     "qty": 1
    },
    {
     "key": "eq_oteo8v9",
     "qty": 1
    },
    {
     "key": "Data Drive",
     "qty": 1
    },
    {
     "key": "Basic Rations",
     "qty": 2
    },
    {
     "key": "Water Purification Tabs",
     "qty": 1
    },
    {
     "key": "Glimmer Stick",
     "qty": 1
    },
    {
     "key": "eq_vbxt4mc",
     "qty": 1
    },
    {
     "key": "eq_sotm4z0",
     "qty": 1
    },
    {
     "key": "eq_v2fhvio",
     "qty": 1
    },
    {
     "key": "eq_5dqn3o5",
     "qty": 1
    },
    {
     "key": "eq_b1miec0",
     "qty": 1
    },
    {
     "key": "Trauma Slap Patch",
     "qty": 1
    },
    {
     "key": "eq_r3vh3oe",
     "qty": 1,
     "classItem": "startingRigGranted"
    }
   ],
   "glimmerGranted": 180,
   "claimedClass": "stitcher",
   "claimedSubclass": "the_lifeline",
   "claimedBudget": 800
  },
  "startingCiphers": [],
  "proficiencies": {
   "skills": {},
   "saves": [],
   "weapons": {},
   "armor": {},
   "tools": {},
   "vehicles": {}
  },
  "versatile": {
   "insight": {
    "attr": "",
    "skill": ""
   },
   "performance": {
    "attr": "",
    "skill": ""
   },
   "intimidation": {
    "attr": "",
    "skill": ""
   }
  },
  "skillFocuses": [
   {
    "type": "skill",
    "parent": "medtech",
    "aspect": "field trauma",
    "granted": true
   },
   {
    "type": "tools",
    "parent": "Medical Tools",
    "aspect": "diagnostics",
    "granted": true
   },
   {
    "type": "weapons",
    "parent": "Simple Weapons",
    "aspect": "Snap-Blades",
    "granted": true
   }
  ],
  "specializations": [],
  "talents": [],
  "talentAttrPicks": {},
  "resistPicks": {},
  "attackAttr": {},
  "customFeatures": [],
  "featureAnnotations": {},
  "universalUpgrades": {},
  "awakeningEvolution": null,
  "retrains": {},
  "editFreely": false,
  "freelyFreed": {},
  "cyberware": [],
  "cyberStash": [],
  "grid": {
   "deckKey": null,
   "deckHpSpent": {},
   "deckMods": {},
   "links": []
  },
  "rig": {
   "key": "eq_r3vh3oe",
   "scrap": false,
   "hp": {}
  },
  "trainingPoints": {
   "spent": 0,
   "allocations": []
  },
  "resources": {
   "current": {}
  },
  "vitality": {
   "current": null,
   "temp": 0
  },
  "wounds": {
   "current": null
  },
  "flow": {
   "current": null,
   "strain": 0,
   "strainPoints": 0,
   "sustained": null,
   "breakflow": false,
   "patterns": []
  },
  "resonances": [],
  "resilience": {
   "spent": 0
  },
  "featureUses": {},
  "scrapCompanion": {
   "resident": null,
   "movement": null,
   "size": null,
   "rig": null,
   "active": false,
   "vitLost": 0,
   "symbiosis": false,
   "rigPick": null
  },
  "fatigue": 0,
  "deathSaves": {
   "s": 0,
   "f": 0
  },
  "stable": false,
  "conditions": [],
  "conditionLevels": {},
  "hazards": {
   "exposures": {},
   "deprivation": {
    "water": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "food": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "sleep": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    }
   },
   "breath": {
    "drowning": {
     "active": false,
     "rounds": 0,
     "saves": 0
    },
    "vacuum": {
     "active": false,
     "rounds": 0,
     "saves": 0
    }
   },
   "caustic": {
    "inside": false,
    "lingering": false,
    "sceneTicks": 0
   },
   "thermalWeave": {},
   "hazmatTorn": false,
   "rebreatherMinutes": 60,
   "thinAirFatigue": 0,
   "applied": {}
  },
  "bonuses": {},
  "equipment": [
   {
    "id": "eq_4e145px",
    "name": "Whisperlink Earpiece",
    "qty": 1
   },
   {
    "id": "eq_oteo8v9",
    "name": "Flashlight",
    "qty": 1
   },
   {
    "name": "Data Drive",
    "qty": 1
   },
   {
    "name": "Basic Rations",
    "qty": 2
   },
   {
    "name": "Water Purification Tabs",
    "qty": 1
   },
   {
    "name": "Glimmer Stick",
    "qty": 1
   },
   {
    "id": "eq_vbxt4mc",
    "name": "Basic Medkit",
    "qty": 1
   },
   {
    "id": "eq_sotm4z0",
    "name": "Snap-Blades",
    "qty": 1
   },
   {
    "id": "eq_v2fhvio",
    "name": "Liner Mesh",
    "qty": 1
   },
   {
    "id": "eq_5dqn3o5",
    "name": "Backpack",
    "qty": 1
   },
   {
    "id": "eq_b1miec0",
    "name": "Bio Monitor Band",
    "qty": 1
   },
   {
    "name": "Trauma Slap Patch",
    "qty": 1
   },
   {
    "id": "eq_r3vh3oe",
    "name": "Field Kit [0]",
    "qty": 1
   }
  ],
  "equippedWeapons": [
   "eq_sotm4z0"
  ],
  "equippedArmor": "eq_v2fhvio",
  "equippedShield": null,
  "equippedFocus": null,
  "weaponAmmo": {},
  "weaponGrip": {},
  "carry": {
   "eq_4e145px": "worn",
   "eq_oteo8v9": "racked",
   "Data Drive": "carried",
   "Basic Rations": "carried",
   "Water Purification Tabs": "carried",
   "Glimmer Stick": "carried",
   "eq_vbxt4mc": "racked",
   "eq_sotm4z0": "carried",
   "eq_v2fhvio": "carried",
   "eq_5dqn3o5": "worn",
   "eq_b1miec0": "worn",
   "Trauma Slap Patch": "carried",
   "eq_r3vh3oe": "carried"
  },
  "racked": {
   "eq_oteo8v9": "eq_5dqn3o5",
   "eq_vbxt4mc": "eq_5dqn3o5"
  },
  "slotInert": {},
  "shieldWear": {},
  "armorWear": {},
  "armorGuard": {},
  "armorResistPicks": {},
  "ablativeCoating": {},
  "loadout": "standard",
  "haul": "none",
  "glimmer": 180,
  "nexus": 0,
  "ledger": [
   {
    "t": 1793480203608,
    "m": "Starting kit claimed: the leftover goes on your Glimmer Stick",
    "g": 180,
    "n": 0,
    "gb": 180,
    "nb": 0
   }
  ],
  "log": [],
  "subclassSkillPicks": {},
  "gambits": [
   "Trauma Patch",
   "Adrenaline Spike",
   "Chemical Purge",
   "Casualty Extraction"
  ],
  "startingRigGranted": true,
  "face": {
   "profiles": [],
   "factions": [],
   "cred": [],
   "heat": [],
   "debts": [],
   "personas": [],
   "post": [],
   "contacts": [
    {
     "id": "ct_k0omwldmvwvtarg",
     "name": "Dr. Anja Venn",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "Clinic operator",
     "why": "She trained Cassia, and found a bed for every patient they got out the night of the repossession.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "friendly",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    },
    {
     "id": "ct_hyat6armvwvtbb4",
     "name": "Rooke Sal",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "Morgue tech",
     "why": "Trades findings for honest second opinions.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "neutral",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    }
   ]
  },
  "concealed": {},
  "vehicleMods": {},
  "household": {
   "lifestyle": "",
   "safehouse": "",
   "upgrades": [],
   "days": 7,
   "due": false,
   "hypercare": "",
   "hypercareDays": 30,
   "hypercareDue": false,
   "licenses": []
  },
  "debts": [],
  "weaponParts": {},
  "armorMods": {}
 }
},
{
 "key": "scoundrel",
 "name": "Arlo \"Carry-On\" Pike",
 "label": "Scoundrel",
 "blurb": "A Ryn courier who opened a box they weren't supposed to and now finds Last Light the way in and out.",
 "patch": {
  "firstName": "Arlo",
  "lastName": "Pike",
  "identity": {
   "concept": "A Ryn courier who opened a box they weren't supposed to and now finds Last Light the way in and out.",
   "handle": "Carry-On",
   "handleStory": "Arlo's partner broke an ankle two roofs from the drop. Arlo put him over one shoulder, tucked the package under the other arm, and kept going. They reached the depot four hours late with the package still sealed and the partner still breathing. The dispatcher has called Arlo Carry-On ever since.",
   "whereFrom": "Arlo ran packages across the rooftops of Lantern Bay for the Causeway Line. The rule was never to open the box, and for years they didn't. Then a sealed crate from Void Port knocked from the inside and asked for water. Arlo broke the seal, let the man out, and walked away from the fee.\n\nHe turned out to be the missing brother of Dena Moss, a customs clerk at Void Port. Dena still owes Arlo a favor. Halden Voss, the broker who booked the delivery, took Arlo's courier bike to cover his loss and says they still owe him a package. Arlo has kept the keys.\n\nThey still carry things for a living, but won't accept a sealed package without knowing what's inside. If they're transporting a person, that person chooses the destination.\n\nAt the Kettle Street Clinic in the South Sprawl, Arlo found an escape route while a repo crew was taking the building. Pip posed as the repo supervisor long enough for everyone to get out. Arlo has worked well with Pip ever since; it's easier to open a door when somebody else has the guards' attention.\n\nThat rescue brought Last Light Recovery together. The crew earns its money finding missing people and recovering things, including stolen research and evidence people have tried to bury. Nobody had to persuade Arlo to agree to the rule about people never being cargo.\n\nArlo scouts ahead on jobs, handles locks, and checks how the crew will get back out. They count exits without thinking about it. If there's only one, they'll take a dangerous chance to make another.",
   "facets": "Soft-spoken and rarely still. Their ears turn toward sounds before their head does. Counts exits under their breath when nervous.",
   "coreSparks": "Getting people out and letting them choose where to go next. Likes finding a route everyone else has dismissed.",
   "tethers": "Siv Quickstep and the other Causeway Line couriers who still trade route warnings with them. Dena Moss and her brother. Last Light, especially Pip.",
   "faultLines": "Gets reckless in a room with only one exit. Won't carry a sealed package without knowing the contents. Afraid of being shut in a box and left somewhere nobody will think to look; won't talk about it.",
   "appearance": "Five foot three and wiry, with rust-red fur, slitted amber eyes, and long ears that never stop moving. Keeps a thick tail tucked under an old courier jacket with the Causeway Line patches picked off. Wears soft-soled boots and fingerless gloves, with pockets in places nobody checks.",
   "notes": "Crew: Last Light Recovery (Nessa, Pip, Bollard, Cassia). Crew role: scouting ahead, getting through locks, and finding the way out.\nBackstory hook: the package Arlo refused to deliver, and Halden Voss, the broker who hasn't forgiven them.\nPersonal item: the keys to a courier bike Arlo no longer owns (no mechanical benefit).\nLanguages: Common Trade, Rooftop Cant (pack dialect)."
  },
  "level": 1,
  "xp": 0,
  "useXp": false,
  "milestones": {
   "major": 0,
   "minor": 0,
   "notes": ""
  },
  "attributeMethod": "array",
  "attributes": {
   "BOD": 12,
   "AGI": 16,
   "WIT": 16,
   "TEC": 14,
   "MYS": 8,
   "PRE": 12
  },
  "rollGroups": [],
  "arrayAssign": {
   "BOD": 12,
   "AGI": 16,
   "WIT": 16,
   "TEC": 14,
   "MYS": 8,
   "PRE": 12
  },
  "overclocked": {
   "grid": [],
   "pick": null,
   "allowDiagonals": false
  },
  "species": "chimera",
  "lineage": "ryn",
  "heightFt": 5.25,
  "size": null,
  "lineageFeatures": [
   "Hare-Trigger Instinct"
  ],
  "background": "courier",
  "backgroundSkillChoice": "athletics",
  "backgroundProfChoices": [
   "Fieldcraft Tools",
   "Ground Vehicles"
  ],
  "class": "scoundrel",
  "subclass": "smuggler",
  "classSkillChoices": [
   "perception"
  ],
  "classGearChoices": {
   "weapons": [],
   "armor": [],
   "tools": [
    "Systems Tools"
   ],
   "vehicles": []
  },
  "startingKit": {
   "claimed": true,
   "picks": {
    "weapon": 0,
    "carry": 1
   },
   "alt": false,
   "granted": [
    {
     "key": "eq_bf1806m",
     "qty": 1
    },
    {
     "key": "eq_zdvkchf",
     "qty": 1
    },
    {
     "key": "Data Drive",
     "qty": 1
    },
    {
     "key": "Basic Rations",
     "qty": 2
    },
    {
     "key": "Water Purification Tabs",
     "qty": 1
    },
    {
     "key": "Glimmer Stick",
     "qty": 1
    },
    {
     "key": "eq_p8m4rcq",
     "qty": 1
    },
    {
     "key": "eq_w3j2nwz",
     "qty": 1
    },
    {
     "key": "eq_4qj8blc",
     "qty": 1
    },
    {
     "key": "eq_9q1l04s",
     "qty": 1
    },
    {
     "key": "Pistol Ammo",
     "qty": 1
    },
    {
     "key": "eq_dtq2f0z",
     "qty": 1
    },
    {
     "key": "eq_owzzzww",
     "qty": 1
    },
    {
     "key": "Fake License Portfolio",
     "qty": 1
    }
   ],
   "glimmerGranted": 40,
   "claimedClass": "scoundrel",
   "claimedSubclass": "smuggler",
   "claimedBudget": 800
  },
  "startingCiphers": [],
  "proficiencies": {
   "skills": {},
   "saves": [],
   "weapons": {},
   "armor": {},
   "tools": {},
   "vehicles": {}
  },
  "versatile": {
   "insight": {
    "attr": "",
    "skill": ""
   },
   "performance": {
    "attr": "",
    "skill": ""
   },
   "intimidation": {
    "attr": "",
    "skill": ""
   }
  },
  "skillFocuses": [],
  "specializations": [],
  "talents": [],
  "talentAttrPicks": {},
  "resistPicks": {},
  "attackAttr": {},
  "customFeatures": [],
  "featureAnnotations": {},
  "universalUpgrades": {},
  "awakeningEvolution": null,
  "retrains": {},
  "editFreely": false,
  "freelyFreed": {},
  "cyberware": [],
  "cyberStash": [],
  "grid": {
   "deckKey": null,
   "deckHpSpent": {},
   "deckMods": {},
   "links": []
  },
  "rig": {
   "key": null,
   "scrap": false,
   "hp": {}
  },
  "trainingPoints": {
   "spent": 0,
   "allocations": []
  },
  "resources": {
   "current": {}
  },
  "vitality": {
   "current": null,
   "temp": 0
  },
  "wounds": {
   "current": null
  },
  "flow": {
   "current": null,
   "strain": 0,
   "strainPoints": 0,
   "sustained": null,
   "breakflow": false,
   "patterns": []
  },
  "resonances": [],
  "resilience": {
   "spent": 0
  },
  "featureUses": {},
  "scrapCompanion": {
   "resident": null,
   "movement": null,
   "size": null,
   "rig": null,
   "active": false,
   "vitLost": 0,
   "symbiosis": false,
   "rigPick": null
  },
  "fatigue": 0,
  "deathSaves": {
   "s": 0,
   "f": 0
  },
  "stable": false,
  "conditions": [],
  "conditionLevels": {},
  "hazards": {
   "exposures": {},
   "deprivation": {
    "water": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "food": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "sleep": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    }
   },
   "breath": {
    "drowning": {
     "active": false,
     "rounds": 0,
     "saves": 0
    },
    "vacuum": {
     "active": false,
     "rounds": 0,
     "saves": 0
    }
   },
   "caustic": {
    "inside": false,
    "lingering": false,
    "sceneTicks": 0
   },
   "thermalWeave": {},
   "hazmatTorn": false,
   "rebreatherMinutes": 60,
   "thinAirFatigue": 0,
   "applied": {}
  },
  "bonuses": {},
  "equipment": [
   {
    "id": "eq_bf1806m",
    "name": "Whisperlink Earpiece",
    "qty": 1
   },
   {
    "id": "eq_zdvkchf",
    "name": "Flashlight",
    "qty": 1
   },
   {
    "name": "Data Drive",
    "qty": 1
   },
   {
    "name": "Basic Rations",
    "qty": 2
   },
   {
    "name": "Water Purification Tabs",
    "qty": 1
   },
   {
    "name": "Glimmer Stick",
    "qty": 1
   },
   {
    "id": "eq_p8m4rcq",
    "name": "Knife",
    "qty": 1
   },
   {
    "id": "eq_w3j2nwz",
    "name": "Lockpick Set",
    "qty": 1
   },
   {
    "id": "eq_4qj8blc",
    "name": "Liner Mesh",
    "qty": 1
   },
   {
    "id": "eq_9q1l04s",
    "name": "Pocket Pistol",
    "qty": 1
   },
   {
    "name": "Pistol Ammo",
    "qty": 1
   },
   {
    "id": "eq_dtq2f0z",
    "name": "Courier Satchel (Transit Seal)",
    "qty": 1
   },
   {
    "id": "eq_owzzzww",
    "name": "Tag Eraser",
    "qty": 1
   },
   {
    "name": "Fake License Portfolio",
    "qty": 1
   }
  ],
  "equippedWeapons": [
   "eq_9q1l04s",
   "eq_p8m4rcq"
  ],
  "equippedArmor": "eq_4qj8blc",
  "equippedShield": null,
  "equippedFocus": null,
  "weaponAmmo": {},
  "weaponGrip": {},
  "carry": {
   "eq_bf1806m": "carried",
   "eq_zdvkchf": "carried",
   "Data Drive": "carried",
   "Basic Rations": "carried",
   "Water Purification Tabs": "carried",
   "Glimmer Stick": "carried",
   "eq_p8m4rcq": "carried",
   "eq_w3j2nwz": "racked",
   "eq_4qj8blc": "carried",
   "eq_9q1l04s": "carried",
   "Pistol Ammo": "carried",
   "eq_dtq2f0z": "worn",
   "eq_owzzzww": "racked",
   "Fake License Portfolio": "carried"
  },
  "racked": {
   "eq_w3j2nwz": "eq_dtq2f0z",
   "eq_owzzzww": "eq_dtq2f0z"
  },
  "slotInert": {},
  "shieldWear": {},
  "armorWear": {},
  "armorGuard": {},
  "armorResistPicks": {},
  "ablativeCoating": {},
  "loadout": "standard",
  "haul": "none",
  "glimmer": 40,
  "nexus": 0,
  "ledger": [
   {
    "t": 1793471736998,
    "m": "Starting kit claimed: the leftover goes on your Glimmer Stick",
    "g": 40,
    "n": 0,
    "gb": 40,
    "nb": 0
   }
  ],
  "log": [],
  "subclassSkillPicks": {},
  "gambits": [
   "Lucky Break",
   "Slip the Blow",
   "Smash and Grab"
  ],
  "face": {
   "profiles": [],
   "factions": [],
   "cred": [],
   "heat": [],
   "debts": [],
   "personas": [],
   "post": [],
   "contacts": [
    {
     "id": "ct_11siauimvwqruhp",
     "name": "Dena Moss",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "Void Port customs clerk",
     "why": "Arlo found her missing brother in a sealed crate. She has owed Arlo a favor ever since.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "friendly",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    },
    {
     "id": "ct_78inwnsmvwqrv1s",
     "name": "Siv Quickstep",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "Rival courier",
     "why": "Trades route warnings.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "neutral",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    }
   ]
  },
  "vehicleMods": {},
  "household": {
   "lifestyle": "",
   "safehouse": "",
   "upgrades": [],
   "days": 7,
   "due": false,
   "hypercare": "",
   "hypercareDays": 30,
   "hypercareDue": false,
   "licenses": []
  },
  "debts": [],
  "weaponParts": {},
  "armorMods": {},
  "concealed": {}
 }
},
{
 "key": "hustler",
 "name": "Pip \"Encore\" Quibble",
 "label": "Hustler",
 "blurb": "A Grinling club host who gets Last Light through front doors by playing someone who's allowed in.",
 "patch": {
  "firstName": "Pip",
  "lastName": "Quibble",
  "identity": {
   "concept": "A Grinling club host who gets Last Light through front doors by playing someone who's allowed in.",
   "handle": "Encore",
   "handleStory": "The bouncer at Ring Zero, a club in Hawkersgate, threw Pip out halfway through a Doorbash order on the owner. Somebody placed another order against the same owner a week later. Pip took it, came back in disguise, and talked their way past the same bouncer to finish the job. He still doesn't know he let them back in.",
   "whereFrom": "Pip came to Elyndra through a tear in the world. Back home, most things wanted to trick them, eat them, or both, so Elysium felt like a vacation. They found work hosting invitation-only nights at the Quiet Room, a club in Hawkersgate. The executives drank too much and forgot the entertainment understood every word. When a Homeward sweep came looking for unregistered Outsiders, the staff hid Pip in the walk-in cooler until the boots were gone.\n\nPip got to know those clients well. They tended to believe that signing their contract meant they owned you. Pip took pleasure in disappointing them, and now puts the same skills to work for Last Light: choosing a role, getting past the guards, and having an answer ready when somebody asks for paperwork.\n\nAt the Kettle Street Clinic repossession in the South Sprawl, Pip played the repo supervisor. Nessa had faked the dispatch records to back up the impersonation. While Pip kept the repo crew occupied, Cassia moved the patients along Arlo's escape route and Bollard held up a failing stairwell. That was how Last Light Recovery started. They now take paying jobs to find missing people, recover stolen research, and turn up evidence somebody wanted buried. Their rule is simple enough for Pip to explain to prospective clients: people are never cargo.\n\nPip knew about Kettle Street before the others did. A client at the Quiet Room had arranged the repossession within earshot, discussing the address, the date, and how many patients would need \"relocating.\" Pip never got a name, but remembers the voice well enough to reproduce it exactly. They kept an empty perfume bottle from the table. It's the only physical link they have to the client, and they want a name and better evidence before telling the crew. An Outsider doing an impression is unlikely to convince anyone.\n\nPip is good at the work until someone starts acting like the cleverest person in the room. Then proving them wrong can become more urgent than finishing the job. Arlo knows when the confidence is an act. They're the only person Pip lets see them scared.",
   "facets": "Theatrical and scrupulously polite, including to people holding guns. Keeps a conversation going while checking for exits. Laughs during firefights to keep from panicking.",
   "coreSparks": "Getting into rooms where Pip isn't welcome and finding out what the people inside are trying to hide. Making sure nobody gets to use a contract as an excuse to own someone.",
   "tethers": "Risa Neon and the Quiet Room staff, who hid Pip during the sweep. Last Light, especially Arlo.",
   "faultLines": "Will risk a con to prove they're cleverer than the mark. Only cons people who can afford the loss. Fears being caught in a sweep and classified as an Unregistered Extradimensional Asset, with no say in where they're sent.",
   "appearance": "Three foot nine, with gray-green skin, ears that flare out sideways, and far too many teeth in their grin. Wears tinted glasses on most jobs to hide the faint glow of their eyes. The jacket is tailored, the shoes are mirror-shined, and every persona has its own pocket square.",
   "notes": "Crew: Last Light Recovery (Nessa, Arlo, Bollard, Cassia). Crew role: cover stories, getting past guards, and dealing with whoever's in charge.\nBackstory hook: the voice Pip overheard arranging the Kettle Street repossession, and why Pip hasn't used it yet.\nPersonal item: an empty perfume bottle from that client's table (no mechanical benefit).\nLanguages: Common Trade, Mirror Cant (native otherworldly dialect)."
  },
  "level": 1,
  "xp": 0,
  "useXp": false,
  "milestones": {
   "major": 0,
   "minor": 0,
   "notes": ""
  },
  "attributeMethod": "array",
  "attributes": {
   "BOD": 12,
   "AGI": 14,
   "WIT": 16,
   "TEC": 12,
   "MYS": 8,
   "PRE": 16
  },
  "rollGroups": [],
  "arrayAssign": {
   "BOD": 12,
   "AGI": 14,
   "WIT": 16,
   "TEC": 12,
   "MYS": 8,
   "PRE": 16
  },
  "overclocked": {
   "grid": [],
   "pick": null,
   "allowDiagonals": false
  },
  "species": "outsiders",
  "lineage": "grinling",
  "heightFt": 3.75,
  "size": null,
  "lineageFeatures": [
   "Disjointed Anatomy"
  ],
  "background": "glow-idol",
  "backgroundSkillChoice": "deception",
  "backgroundProfChoices": [
   "Glamour Tools",
   "Ground Vehicles"
  ],
  "class": "hustler",
  "subclass": "the_grifter",
  "classSkillChoices": [
   "perception"
  ],
  "classGearChoices": {
   "weapons": [],
   "armor": [],
   "tools": [
    "Media Tools"
   ],
   "vehicles": []
  },
  "startingKit": {
   "claimed": true,
   "picks": {
    "weapon": 0,
    "carry": 0
   },
   "alt": false,
   "granted": [
    {
     "key": "eq_ua33vdw",
     "qty": 1
    },
    {
     "key": "eq_bavn0ed",
     "qty": 1
    },
    {
     "key": "Data Drive",
     "qty": 1
    },
    {
     "key": "Basic Rations",
     "qty": 2
    },
    {
     "key": "Water Purification Tabs",
     "qty": 1
    },
    {
     "key": "Glimmer Stick",
     "qty": 1
    },
    {
     "key": "eq_sdn5v4z",
     "qty": 1
    },
    {
     "key": "eq_ry2vy81",
     "qty": 1
    },
    {
     "key": "eq_hm4vhdi",
     "qty": 1
    },
    {
     "key": "Pistol Ammo",
     "qty": 1
    },
    {
     "key": "eq_0dla9n7",
     "qty": 1
    },
    {
     "key": "Fake License Portfolio",
     "qty": 1
    }
   ],
   "glimmerGranted": 75,
   "claimedClass": "hustler",
   "claimedSubclass": "the_grifter",
   "claimedBudget": 800
  },
  "startingCiphers": [],
  "proficiencies": {
   "skills": {},
   "saves": [],
   "weapons": {},
   "armor": {},
   "tools": {},
   "vehicles": {}
  },
  "versatile": {
   "insight": {
    "attr": "",
    "skill": ""
   },
   "performance": {
    "attr": "",
    "skill": ""
   },
   "intimidation": {
    "attr": "",
    "skill": ""
   }
  },
  "skillFocuses": [
   {
    "type": "skill",
    "parent": "persuasion",
    "aspect": "negotiating fees",
    "granted": true
   },
   {
    "type": "tools",
    "parent": "Glamour Tools",
    "aspect": "disguise styling",
    "granted": true
   }
  ],
  "specializations": [],
  "talents": [],
  "talentAttrPicks": {},
  "resistPicks": {},
  "attackAttr": {},
  "customFeatures": [],
  "featureAnnotations": {},
  "universalUpgrades": {},
  "awakeningEvolution": null,
  "retrains": {},
  "editFreely": false,
  "freelyFreed": {},
  "cyberware": [],
  "cyberStash": [],
  "grid": {
   "deckKey": null,
   "deckHpSpent": {},
   "deckMods": {},
   "links": []
  },
  "rig": {
   "key": null,
   "scrap": false,
   "hp": {}
  },
  "trainingPoints": {
   "spent": 0,
   "allocations": []
  },
  "resources": {
   "current": {}
  },
  "vitality": {
   "current": null,
   "temp": 0
  },
  "wounds": {
   "current": null
  },
  "flow": {
   "current": null,
   "strain": 0,
   "strainPoints": 0,
   "sustained": null,
   "breakflow": false,
   "patterns": []
  },
  "resonances": [],
  "resilience": {
   "spent": 0
  },
  "featureUses": {},
  "scrapCompanion": {
   "resident": null,
   "movement": null,
   "size": null,
   "rig": null,
   "active": false,
   "vitLost": 0,
   "symbiosis": false,
   "rigPick": null
  },
  "fatigue": 0,
  "deathSaves": {
   "s": 0,
   "f": 0
  },
  "stable": false,
  "conditions": [],
  "conditionLevels": {},
  "hazards": {
   "exposures": {},
   "deprivation": {
    "water": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "food": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "sleep": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    }
   },
   "breath": {
    "drowning": {
     "active": false,
     "rounds": 0,
     "saves": 0
    },
    "vacuum": {
     "active": false,
     "rounds": 0,
     "saves": 0
    }
   },
   "caustic": {
    "inside": false,
    "lingering": false,
    "sceneTicks": 0
   },
   "thermalWeave": {},
   "hazmatTorn": false,
   "rebreatherMinutes": 60,
   "thinAirFatigue": 0,
   "applied": {}
  },
  "bonuses": {},
  "equipment": [
   {
    "id": "eq_ua33vdw",
    "name": "Whisperlink Earpiece",
    "qty": 1
   },
   {
    "id": "eq_bavn0ed",
    "name": "Flashlight",
    "qty": 1
   },
   {
    "name": "Data Drive",
    "qty": 1
   },
   {
    "name": "Basic Rations",
    "qty": 2
   },
   {
    "name": "Water Purification Tabs",
    "qty": 1
   },
   {
    "name": "Glimmer Stick",
    "qty": 1
   },
   {
    "id": "eq_sdn5v4z",
    "name": "Disguise and Styling Kit",
    "qty": 1
   },
   {
    "id": "eq_ry2vy81",
    "name": "Liner Mesh",
    "qty": 1
   },
   {
    "id": "eq_hm4vhdi",
    "name": "Pocket Pistol",
    "qty": 1
   },
   {
    "name": "Pistol Ammo",
    "qty": 1
   },
   {
    "id": "eq_0dla9n7",
    "name": "Swift Draw Holster",
    "qty": 1
   },
   {
    "name": "Fake License Portfolio",
    "qty": 1
   }
  ],
  "equippedWeapons": [
   "eq_hm4vhdi"
  ],
  "equippedArmor": "eq_ry2vy81",
  "equippedShield": null,
  "equippedFocus": null,
  "weaponAmmo": {},
  "weaponGrip": {},
  "carry": {
   "eq_ua33vdw": "carried",
   "eq_bavn0ed": "carried",
   "Data Drive": "carried",
   "Basic Rations": "carried",
   "Water Purification Tabs": "carried",
   "Glimmer Stick": "carried",
   "eq_sdn5v4z": "carried",
   "eq_ry2vy81": "carried",
   "eq_hm4vhdi": "racked",
   "Pistol Ammo": "carried",
   "eq_0dla9n7": "worn",
   "Fake License Portfolio": "carried"
  },
  "racked": {
   "eq_hm4vhdi": "eq_0dla9n7"
  },
  "slotInert": {},
  "shieldWear": {},
  "armorWear": {},
  "armorGuard": {},
  "armorResistPicks": {},
  "ablativeCoating": {},
  "loadout": "standard",
  "haul": "none",
  "glimmer": 75,
  "nexus": 0,
  "ledger": [
   {
    "t": 1793467903882,
    "m": "Starting kit claimed: the leftover goes on your Glimmer Stick",
    "g": 75,
    "n": 0,
    "gb": 75,
    "nb": 0
   }
  ],
  "log": [],
  "subclassSkillPicks": {},
  "gambits": [
   "Dirty Laundry",
   "Exit Strategy"
  ],
  "face": {
   "profiles": [],
   "factions": [],
   "cred": [],
   "heat": [],
   "debts": [],
   "personas": [],
   "post": [],
   "contacts": [
    {
     "id": "ct_rltinadmvwohtse",
     "name": "Risa Neon",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "Club manager",
     "why": "Trusts Pip to read dangerous guests. Her staff hid Pip in the walk-in cooler during the sweep.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "friendly",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    },
    {
     "id": "ct_rfsim0ymvwohuc4",
     "name": "Kade Merrow",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "Mid-tier fixer",
     "why": "Appreciates discreet introductions.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "neutral",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    }
   ]
  },
  "vehicleMods": {},
  "household": {
   "lifestyle": "",
   "safehouse": "",
   "upgrades": [],
   "days": 7,
   "due": false,
   "hypercare": "",
   "hypercareDays": 30,
   "hypercareDue": false,
   "licenses": []
  },
  "debts": [],
  "weaponParts": {},
  "armorMods": {},
  "concealed": {}
 }
},
{
 "key": "operator",
 "name": "Vesk \"Tripwire\"",
 "label": "Operator",
 "blurb": "A drain-raised Skarn tracker who closes the exits one by one, then cuffs whoever's left inside.",
 "patch": {
  "firstName": "Vesk",
  "lastName": "",
  "identity": {
   "concept": "A drain-raised Skarn tracker who closes the exits one by one, then cuffs whoever's left inside.",
   "handle": "Tripwire",
   "handleStory": "Vesk's corner of the clutch's drain has more tripwires than furniture, including one nobody remembers putting in. The Sump Rats gave them the name after Brannock stepped on one, back when he still came to visit.",
   "whereFrom": "Vesk hatched in a Skarn clutch in the storm drains beneath the South Sprawl. They grew up running pipe for the Sump Rats, who keep certain Sumpside blocks dry with stolen pumps and rewired lines. Vesk knows every drain, crawlspace, and runoff channel under the district. They've rigged about half of them. Like most Skarn, they say \"we\" instead of \"I,\" even when they're alone. They still wear their Sump Rats jacket, though they've painted over the tag. You can still make it out.\n\nThe Rats paid in favors. Bounties paid in Glimmer. Vesk worked out quickly which bought more and went where the money was. When a bounty heads into the tunnels, they start closing exits until the only way out has Vesk standing in it. They talk through the whole process. Usually, they're quoting a price.\n\nDead End began with a bail jumper in a Hollow Bend pump house. Vesk had latched every exit. Ines, who'd been tracking the same bounty, was already inside with him. They could have fought over the fee; they split it instead, and they've split everything since.\n\nThese days, they take bounties on anyone the Undercity is hiding. Bail jumpers, people who've skipped out on a Kindred implant bill. The client pays half up front, and Dead End gets to work. They keep chasing the same people as Last Light Recovery, which makes for a mostly friendly rivalry. Once, they sold Last Light a hiding place at a discount, then sold it to the client an hour later. Same hiding place, two payments.\n\nLeaving the Rats came with unfinished business. Vesk took their routes with them, and Brannock, the lieutenant they used to run for, wants them back. He knows which drain the clutch sleeps in. Pell, Vesk's oldest friend, still runs pipe for him and still saves Vesk a seat at clutch dinners.\n\nVesk expects a trap in every handshake and tends to build two of their own in response. Keeping track of them all is where it gets difficult. Ines is the only person they let walk point. She flinches before the floor gives way, and Vesk appreciates that.",
   "facets": "Vesk talks constantly, usually about what something costs. They say \"we\" instead of \"I,\" tap on pipes while thinking, and check how a door is hung before they'll walk through it.",
   "coreSparks": "A trap that works on the first try. A bounty that pays more than it should. Being the only one who knows the way out.",
   "tethers": "The clutch beneath the South Sprawl, especially Tallow. Pell, still running pipe for the Rats and keeping a place for Vesk at dinner. Ines, who walks point.",
   "faultLines": "Vesk's paranoia leaves them with more traps than they can reliably remember. They'll sell a route to anyone, but never a way into the clutch's tunnels. Their quiet fear is that the clutch will one day vote to move on without them.",
   "appearance": "Vesk stands three foot six, usually hunched, with pebbled green-gray scales and a stiff tail for balance. They keep stuffing their crest of neon-orange proto-feathers under a cap. Their sickle claws click on concrete. The old Sump Rats jacket still has its badly painted-over tag, and there's always a pair of cuffs on their belt.",
   "notes": "Backstory hook: Brannock wants Vesk's routes back. Pell, the friend Vesk left behind, still runs pipe for him.\n\nPersonal item: a Sump Rats jacket with the tag painted over. It has no mechanical benefit."
  },
  "level": 1,
  "xp": 0,
  "useXp": false,
  "milestones": {
   "major": 0,
   "minor": 0,
   "notes": ""
  },
  "attributeMethod": "array",
  "attributes": {
   "BOD": 14,
   "AGI": 16,
   "WIT": 16,
   "TEC": 12,
   "MYS": 8,
   "PRE": 12
  },
  "rollGroups": [],
  "arrayAssign": {
   "BOD": 14,
   "AGI": 16,
   "WIT": 16,
   "TEC": 12,
   "MYS": 8,
   "PRE": 12
  },
  "overclocked": {
   "grid": [],
   "pick": null,
   "allowDiagonals": false
  },
  "species": "chimera",
  "lineage": "skarn",
  "heightFt": 3.5,
  "size": null,
  "lineageFeatures": [
   "Prey Stalker's Grip"
  ],
  "speciesLanguage": "Packsign",
  "languages": [],
  "background": "ganger",
  "backgroundSkillChoice": "stealth",
  "backgroundProfChoices": [
   "Security Tools",
   "Sidearms"
  ],
  "class": "operator",
  "subclass": "the_headhunter",
  "classSkillChoices": [
   "intuition"
  ],
  "classGearChoices": {
   "weapons": [],
   "armor": [],
   "tools": [
    "Fieldcraft Tools"
   ],
   "vehicles": []
  },
  "startingKit": {
   "claimed": true,
   "picks": {
    "weapon": 0,
    "carry": 1
   },
   "alt": false,
   "granted": [
    {
     "key": "eq_xp7jhdg",
     "qty": 1
    },
    {
     "key": "eq_vjzhby0",
     "qty": 1
    },
    {
     "key": "Data Drive",
     "qty": 1
    },
    {
     "key": "Basic Rations",
     "qty": 2
    },
    {
     "key": "Water Purification Tabs",
     "qty": 1
    },
    {
     "key": "Glimmer Stick",
     "qty": 1
    },
    {
     "key": "eq_ful763w",
     "qty": 1
    },
    {
     "key": "eq_rz9a1qi",
     "qty": 1
    },
    {
     "key": "Pistol Ammo",
     "qty": 1
    },
    {
     "key": "eq_7jhn5mb",
     "qty": 1
    },
    {
     "key": "eq_zk3uw8r",
     "qty": 1
    },
    {
     "key": "eq_7p3a2at",
     "qty": 1
    }
   ],
   "glimmerGranted": 90,
   "claimedClass": "operator",
   "claimedSubclass": "the_headhunter",
   "claimedBudget": 800
  },
  "startingCiphers": [],
  "proficiencies": {
   "skills": {},
   "saves": [],
   "weapons": {},
   "armor": {},
   "tools": {},
   "vehicles": {}
  },
  "versatile": {
   "insight": {
    "attr": "",
    "skill": ""
   },
   "performance": {
    "attr": "",
    "skill": ""
   },
   "intimidation": {
    "attr": "",
    "skill": ""
   }
  },
  "skillFocuses": [
   {
    "type": "skill",
    "parent": "intuition",
    "aspect": "Spotting lies",
    "granted": true
   },
   {
    "type": "weapons",
    "parent": "Sidearms",
    "aspect": "Pistol",
    "granted": true
   },
   {
    "type": "tools",
    "parent": "Security Tools",
    "aspect": "Restraints",
    "granted": true
   }
  ],
  "specializations": [],
  "talents": [],
  "talentAttrPicks": {},
  "resistPicks": {},
  "attackAttr": {},
  "customFeatures": [],
  "featureAnnotations": {},
  "universalUpgrades": {},
  "awakeningEvolution": null,
  "retrains": {},
  "editFreely": false,
  "freelyFreed": {},
  "cyberware": [],
  "cyberStash": [],
  "grid": {
   "deckKey": null,
   "deckHpSpent": {},
   "deckMods": {},
   "links": []
  },
  "rig": {
   "key": null,
   "scrap": false,
   "hp": {}
  },
  "trainingPoints": {
   "spent": 0,
   "allocations": []
  },
  "resources": {
   "current": {}
  },
  "vitality": {
   "current": null,
   "temp": 0
  },
  "wounds": {
   "current": null
  },
  "flow": {
   "current": null,
   "strain": 0,
   "strainPoints": 0,
   "sustained": null,
   "breakflow": false,
   "patterns": []
  },
  "resonances": [],
  "resilience": {
   "spent": 0
  },
  "featureUses": {},
  "scrapCompanion": {
   "resident": null,
   "movement": null,
   "size": null,
   "rig": null,
   "active": false,
   "vitLost": 0,
   "symbiosis": false,
   "rigPick": null
  },
  "fatigue": 0,
  "deathSaves": {
   "s": 0,
   "f": 0
  },
  "stable": false,
  "conditions": [],
  "conditionLevels": {},
  "hazards": {
   "exposures": {},
   "deprivation": {
    "water": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "food": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "sleep": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    }
   },
   "breath": {
    "drowning": {
     "active": false,
     "rounds": 0,
     "saves": 0
    },
    "vacuum": {
     "active": false,
     "rounds": 0,
     "saves": 0
    }
   },
   "caustic": {
    "inside": false,
    "lingering": false,
    "sceneTicks": 0
   },
   "thermalWeave": {},
   "hazmatTorn": false,
   "rebreatherMinutes": 60,
   "thinAirFatigue": 0,
   "applied": {}
  },
  "bonuses": {},
  "equipment": [
   {
    "id": "eq_xp7jhdg",
    "name": "Whisperlink Earpiece",
    "qty": 1
   },
   {
    "id": "eq_vjzhby0",
    "name": "Flashlight",
    "qty": 1
   },
   {
    "name": "Data Drive",
    "qty": 1
   },
   {
    "name": "Basic Rations",
    "qty": 2
   },
   {
    "name": "Water Purification Tabs",
    "qty": 1
   },
   {
    "name": "Glimmer Stick",
    "qty": 1
   },
   {
    "id": "eq_ful763w",
    "name": "Liner Mesh",
    "qty": 1
   },
   {
    "id": "eq_rz9a1qi",
    "name": "Pistol",
    "qty": 1
   },
   {
    "name": "Pistol Ammo",
    "qty": 1
   },
   {
    "id": "eq_7jhn5mb",
    "name": "Utility Belt",
    "qty": 1
   },
   {
    "id": "eq_zk3uw8r",
    "name": "Custody and Control Kit",
    "qty": 1
   },
   {
    "id": "eq_7p3a2at",
    "name": "Standard Cuffs",
    "qty": 1
   }
  ],
  "equippedWeapons": [
   "eq_rz9a1qi"
  ],
  "equippedArmor": "eq_ful763w",
  "equippedShield": null,
  "equippedFocus": null,
  "weaponAmmo": {},
  "weaponGrip": {},
  "carry": {
   "eq_xp7jhdg": "worn",
   "eq_vjzhby0": "carried",
   "Data Drive": "carried",
   "Basic Rations": "carried",
   "Water Purification Tabs": "carried",
   "Glimmer Stick": "carried",
   "eq_ful763w": "carried",
   "eq_rz9a1qi": "carried",
   "Pistol Ammo": "carried",
   "eq_7jhn5mb": "worn",
   "eq_zk3uw8r": "racked",
   "eq_7p3a2at": "racked"
  },
  "racked": {
   "eq_zk3uw8r": "eq_7jhn5mb",
   "eq_7p3a2at": "eq_7jhn5mb"
  },
  "slotInert": {},
  "concealed": {},
  "shieldWear": {},
  "armorWear": {},
  "armorGuard": {},
  "armorResistPicks": {},
  "ablativeCoating": {},
  "loadout": "standard",
  "haul": "none",
  "glimmer": 90,
  "nexus": 0,
  "ledger": [
   {
    "t": 1793512721629,
    "m": "Starting kit claimed: the leftover goes on your Glimmer Stick",
    "g": 90,
    "n": 0,
    "gb": 90,
    "nb": 0
   }
  ],
  "log": [],
  "face": {
   "profiles": [],
   "factions": [],
   "cred": [],
   "heat": [],
   "debts": [],
   "personas": [],
   "post": [],
   "contacts": [
    {
     "id": "ct_y25yhxamvxf52pf",
     "name": "Nan Oduya",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "Go-between",
     "why": "Sets up neutral meetings between the Sump Rats and whoever they aren't shooting at this week.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "neutral",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    },
    {
     "id": "ct_x8fxwalmvxf58qz",
     "name": "Tallow",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "Eldest of the clutch",
     "why": "Still keeps Vesk's bedroll in the drain.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "neutral",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    }
   ]
  },
  "subclassSkillPicks": {},
  "gambits": []
 }
},
{
 "key": "shaper",
 "name": "Ines \"Stutterstep\" Duarte",
 "label": "Shaper",
 "blurb": "A Warrens-born bounty hunter who feels a hit half a second before it lands and usually brings her bounties in breathing.",
 "patch": {
  "firstName": "Ines",
  "lastName": "Duarte",
  "identity": {
   "concept": "A Warrens-born bounty hunter who feels a hit half a second before it lands and usually brings her bounties in breathing.",
   "handle": "Stutterstep",
   "handleStory": "A Ferryman took four swings at Ines during a river crossing. All four missed. Each time, she seemed to hitch half a second before he committed. Afterward, he told everyone she fought with a stutterstep. He meant it as an insult. Everyone else made it sound like a compliment, and the name stuck.",
   "whereFrom": "Ines grew up in the Warrens, under dripping ceilings and on walkways barely wide enough for one person. She's always been half a second ahead: flinching before a punch, stepping aside before a shot. Her family learned early to keep that out of conversations with clinicians. An old blade teacher with a practice room behind a laundry taught her to move with the warning instead of fighting it. They trained her with a kitchen knife, because that's what people in the Warrens actually carry. These days, the Flow runs through the blade as easily as it runs through her nerves.\n\nHer first bounty covered the teacher's rent. After that, she kept taking the work. Alive pays better than dead, so she usually brings people in breathing.\n\nShe met Vesk on a job in Hollow Bend. They'd both tracked the same bail jumper to a pump house; Ines was inside with him, and Vesk had latched every way out. They split the fee instead of fighting over it. They've split everything since. That was the start of Dead End.\n\nNow they take bounties on whoever the Undercity is hiding, from bail jumpers to people who've skipped out on a Kindred implant bill. Half up front is the arrangement. They cross paths with Last Light Recovery often enough to keep the rivalry friendly, mostly. Once, they sold the same hiding place twice in one night: to Last Light at a discount, then to the client an hour later.\n\nOne bounty still goes uncollected. Fullwell put a price on a pump engineer who'd leaked a block's shutoff schedule to the people living there. Ines cornered him beneath the Hollow Bend stilt lanes, then let him walk. She paid back the deposit out of her own cut. She won't explain why. Vesk has stopped asking, but the client hasn't stopped looking.\n\nInes trusts the prickle in her spine more than a client, a piece of evidence, or even her partner. Usually, she's right. When she's wrong, she's wrong at full speed. Vesk handles the talking, which suits her fine.",
   "facets": "Ines keeps quiet and pays attention. If a room feels wrong, she'll stop halfway through a sentence. She flinches half a second before anyone else hears the noise. When she eats, she stands facing the door.",
   "coreSparks": "Getting paid. Being proved right after nobody believed her. Watching a runner realize there's nowhere left to go.",
   "tethers": "The old blade teacher still running the practice room behind the laundry. Vesk, though she'd never tell them that to their face. And the pump engineer she let walk, wherever he ended up.",
   "faultLines": "She'll trust her nerves over the evidence, the client, and her partner, even when they all disagree. She won't take a bounty on another working crew; that rule is the only reason Last Light has stayed off her list. What she keeps to herself is the fear that, one day, the warning will come too late.",
   "appearance": "Ines is five foot seven and lean, with a long scar down the forearm she uses to block. Her gaze always seems a little ahead of whatever she's watching. People find it unsettling. She wears tape-wrapped shock gloves and carries a kitchen knife on her hip. She's cut the lining out of her long coat so it won't slow her down.",
   "notes": "Backstory hook: the bounty she let walk, and the reason she still won't give for doing it.\n\nPersonal item: a bent Tollgate token from the contract that nearly killed her. It has no mechanical benefit."
  },
  "level": 1,
  "xp": 0,
  "useXp": false,
  "milestones": {
   "major": 0,
   "minor": 0,
   "notes": ""
  },
  "attributeMethod": "array",
  "attributes": {
   "BOD": 16,
   "AGI": 16,
   "WIT": 14,
   "TEC": 8,
   "MYS": 12,
   "PRE": 12
  },
  "rollGroups": [],
  "arrayAssign": {
   "BOD": 16,
   "AGI": 16,
   "WIT": 14,
   "TEC": 8,
   "MYS": 12,
   "PRE": 12
  },
  "overclocked": {
   "grid": [],
   "pick": null,
   "allowDiagonals": false
  },
  "species": "humans",
  "lineage": "phasebound",
  "heightFt": 5.583333333333333,
  "size": null,
  "lineageFeatures": [
   "Static Premonition"
  ],
  "speciesLanguage": "Undercity Patter",
  "languages": [],
  "background": "hired-gun",
  "backgroundSkillChoice": "perception",
  "backgroundProfChoices": [
   "Security Tools",
   "Longarms"
  ],
  "class": "shaper",
  "subclass": "kensei",
  "classSkillChoices": [
   "athletics"
  ],
  "classGearChoices": {
   "weapons": [],
   "armor": [],
   "tools": [
    "Investigation Tools"
   ],
   "vehicles": []
  },
  "startingKit": {
   "claimed": true,
   "picks": {
    "gear": 1,
    "carry": 1
   },
   "alt": false,
   "granted": [
    {
     "key": "eq_ipklb2k",
     "qty": 1
    },
    {
     "key": "eq_wijgfju",
     "qty": 1
    },
    {
     "key": "Data Drive",
     "qty": 1
    },
    {
     "key": "Basic Rations",
     "qty": 2
    },
    {
     "key": "Water Purification Tabs",
     "qty": 1
    },
    {
     "key": "Glimmer Stick",
     "qty": 1
    },
    {
     "key": "eq_sz2uhlx",
     "qty": 1
    },
    {
     "key": "eq_xeln06l",
     "qty": 1
    },
    {
     "key": "eq_1l0mwrw",
     "qty": 1
    },
    {
     "key": "eq_8t6pk07",
     "qty": 1
    },
    {
     "key": "eq_v3a4k48",
     "qty": 1
    },
    {
     "key": "eq_1htscus",
     "qty": 1
    }
   ],
   "glimmerGranted": 200,
   "claimedClass": "shaper",
   "claimedSubclass": "kensei",
   "claimedBudget": 800
  },
  "startingCiphers": [],
  "proficiencies": {
   "skills": {},
   "saves": [],
   "weapons": {},
   "armor": {},
   "tools": {},
   "vehicles": {}
  },
  "versatile": {
   "insight": {
    "attr": "",
    "skill": ""
   },
   "performance": {
    "attr": "",
    "skill": ""
   },
   "intimidation": {
    "attr": "",
    "skill": ""
   }
  },
  "skillFocuses": [
   {
    "type": "skill",
    "parent": "athletics",
    "aspect": "Grappling",
    "granted": true
   }
  ],
  "specializations": [],
  "talents": [],
  "talentAttrPicks": {},
  "resistPicks": {},
  "attackAttr": {},
  "customFeatures": [],
  "featureAnnotations": {},
  "universalUpgrades": {},
  "awakeningEvolution": null,
  "retrains": {},
  "editFreely": false,
  "freelyFreed": {},
  "cyberware": [],
  "cyberStash": [],
  "grid": {
   "deckKey": null,
   "deckHpSpent": {},
   "deckMods": {},
   "links": []
  },
  "rig": {
   "key": null,
   "scrap": false,
   "hp": {}
  },
  "trainingPoints": {
   "spent": 0,
   "allocations": []
  },
  "resources": {
   "current": {}
  },
  "vitality": {
   "current": null,
   "temp": 0
  },
  "wounds": {
   "current": null
  },
  "flow": {
   "current": null,
   "strain": 0,
   "strainPoints": 0,
   "sustained": null,
   "breakflow": false,
   "patterns": []
  },
  "resonances": [
   "kinetic",
   "visceral",
   "spatial"
  ],
  "resilience": {
   "spent": 0
  },
  "featureUses": {},
  "scrapCompanion": {
   "resident": null,
   "movement": null,
   "size": null,
   "rig": null,
   "active": false,
   "vitLost": 0,
   "symbiosis": false,
   "rigPick": null
  },
  "fatigue": 0,
  "deathSaves": {
   "s": 0,
   "f": 0
  },
  "stable": false,
  "conditions": [],
  "conditionLevels": {},
  "hazards": {
   "exposures": {},
   "deprivation": {
    "water": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "food": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    },
    "sleep": {
     "days": 0,
     "saves": 0,
     "fatigue": 0
    }
   },
   "breath": {
    "drowning": {
     "active": false,
     "rounds": 0,
     "saves": 0
    },
    "vacuum": {
     "active": false,
     "rounds": 0,
     "saves": 0
    }
   },
   "caustic": {
    "inside": false,
    "lingering": false,
    "sceneTicks": 0
   },
   "thermalWeave": {},
   "hazmatTorn": false,
   "rebreatherMinutes": 60,
   "thinAirFatigue": 0,
   "applied": {}
  },
  "bonuses": {},
  "equipment": [
   {
    "id": "eq_ipklb2k",
    "name": "Whisperlink Earpiece",
    "qty": 1
   },
   {
    "id": "eq_wijgfju",
    "name": "Flashlight",
    "qty": 1
   },
   {
    "name": "Data Drive",
    "qty": 1
   },
   {
    "name": "Basic Rations",
    "qty": 2
   },
   {
    "name": "Water Purification Tabs",
    "qty": 1
   },
   {
    "name": "Glimmer Stick",
    "qty": 1
   },
   {
    "id": "eq_sz2uhlx",
    "name": "Scrap Ward",
    "qty": 1
   },
   {
    "id": "eq_xeln06l",
    "name": "Rite Calibration Kit",
    "qty": 1
   },
   {
    "id": "eq_1l0mwrw",
    "name": "Liner Mesh",
    "qty": 1
   },
   {
    "id": "eq_8t6pk07",
    "name": "Knife",
    "qty": 1
   },
   {
    "id": "eq_v3a4k48",
    "name": "Backpack",
    "qty": 1
   },
   {
    "id": "eq_1htscus",
    "name": "Shock Gloves",
    "qty": 1
   }
  ],
  "equippedWeapons": [
   "eq_8t6pk07",
   "eq_1htscus"
  ],
  "equippedArmor": "eq_1l0mwrw",
  "equippedShield": null,
  "equippedFocus": "eq_sz2uhlx",
  "weaponAmmo": {},
  "weaponGrip": {},
  "carry": {
   "eq_ipklb2k": "worn",
   "eq_wijgfju": "racked",
   "Data Drive": "carried",
   "Basic Rations": "carried",
   "Water Purification Tabs": "carried",
   "Glimmer Stick": "carried",
   "eq_sz2uhlx": "carried",
   "eq_xeln06l": "racked",
   "eq_1l0mwrw": "carried",
   "eq_8t6pk07": "carried",
   "eq_v3a4k48": "worn",
   "eq_1htscus": "carried"
  },
  "racked": {
   "eq_xeln06l": "eq_v3a4k48",
   "eq_wijgfju": "eq_v3a4k48"
  },
  "slotInert": {},
  "concealed": {},
  "shieldWear": {},
  "armorWear": {},
  "armorGuard": {},
  "armorResistPicks": {},
  "ablativeCoating": {},
  "loadout": "standard",
  "haul": "none",
  "glimmer": 200,
  "nexus": 0,
  "ledger": [
   {
    "t": 1793512560595,
    "m": "Starting kit claimed: the leftover goes on your Glimmer Stick",
    "g": 200,
    "n": 0,
    "gb": 200,
    "nb": 0
   }
  ],
  "log": [],
  "face": {
   "profiles": [],
   "factions": [],
   "cred": [],
   "heat": [],
   "debts": [],
   "personas": [],
   "post": [],
   "contacts": [
    {
     "id": "ct_4n8qzormvxf0tqv",
     "name": "Odile Brask",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "South Sprawl fixer",
     "why": "Sends Dead End half its work and takes a cut of all of it.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "neutral",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    },
    {
     "id": "ct_rqj2qx4mvxf10sj",
     "name": "Sol Akande",
     "print": "",
     "handle": "",
     "kind": "professional",
     "work": "Former client",
     "why": "Still owes her the second half.",
     "offers": "",
     "fence": "",
     "origin": "background",
     "disposition": "neutral",
     "state": "open",
     "faction": "",
     "tell": "",
     "notes": ""
    }
   ]
  },
  "subclassSkillPicks": {},
  "gambits": []
 }
}
];
