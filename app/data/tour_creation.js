/* ===========================================================================
   ELYSIUM NIGHTS - Guided character-creation tour: the content
   The author's tour (character-creation-tour.json, 0.1.2), carried as data so the file:// app can
   read it. Copy is the author's; 0.1.3 brought stale lines up to date with the app (see changelog).
   Each step: id, screen, wizardStep, anchor { dataTour, fallback { css, text } }, placement, action,
   advanceOn (click | condition | next | done), title, body, example, warning, optional; plus `tab`
   (the app's tab key) and `wizard` (the #PRINT step key) for navigation. js/tour.js is the engine;
   remove both script tags in index.html to remove the feature.
   =========================================================================== */
window.EN = window.EN || {};
EN.tourData = EN.tourData || {};
EN.tourData["character-creation"] = {
 "tour": "character-creation",
 "version": "0.1.4",
 "changelog": [
  "0.1.4: gear-claim reports Load against the Load Budget, the same name and number the Inventory readout uses (the author, 31 Oct 2026).",
  "0.1.3: In the app (31 Oct 2026), with copy brought up to date with the app. register: mentions the pre-mades. wizard-rail: Advance reads NOT YET until there are Training Points. identity-notes: backstory goes in Where You Came From and languages are tracked; example drops the languages. attr-assign and class-free-focus: completeWhen matches the screen (CLAIMED is a chip). species-traits: languages, the Human pick and dialect names; example adds Common Trade and Machine Cant. lineage-feature: pick the lineage first when there is more than one. background-cards: no fixed count. contacts-modal: the cards are under Social, Contacts once filed. background-prompts: the item goes in Notes, the hook in Where You Came From. class-maneuvers: retitled Pick your starting abilities, covers every pick class. class-free-focus warning: Background and Class both lose their checks. subclass: no fixed count. gear-slots: the free Class Item. advance: Languages live here too. print-skills: the Focus row is no longer last. print-certify: the box stays locked until every tab is checked. inventory-rack: Carry Gear racks only while worn. inventory-load: the Inventory readout is the Loadout's Load Budget. social-contacts: open Social and tap CONTACTS (action click). Screenshot fields dropped.",
  "0.1.2: Bollard examples updated to his revised profile (last name Seven, Marigold Court, Clean Slate Demolition). Where You Came From advice now says open with the place.",
  "0.1.1: Identity merged Backstory & Motivation into Where You Came From. Updated identity-origin anchor, copy and example; flagged identity screenshots for reshoot."
 ],
 "rulesSource": "Elysium Nights Player's Handbook, Playtest October 2026",
 "exampleCharacter": {
  "name": "BOLLARD-7 \"Bollard\" Seven",
  "build": "Clanker / Laborframes, Fury / The Juggernaut, Gearhead, level 1",
  "registryTag": "RF-WKTKZM"
 },
 "steps": [
  {
   "id": "register",
   "screen": "landing",
   "wizardStep": null,
   "anchor": {
    "dataTour": "register-print",
    "fallback": {
     "css": "main button.btn.primary",
     "text": "REGISTER NEW #PRINT"
    }
   },
   "placement": "bottom",
   "action": "click",
   "advanceOn": "click",
   "title": "Register a new #PRINT",
   "body": "Every Freelancer starts here. Hit Register to open a blank record. Got an exported .json from another device? Import it instead. Want to see a finished one first? Open a pre-made below; it never saves unless you keep it.",
   "example": "Bollard starts from scratch.",
   "optional": false,
   "tab": "print",
   "wizard": null
  },
  {
   "id": "wizard-rail",
   "screen": "identity",
   "wizardStep": "01",
   "anchor": {
    "dataTour": "wizard-rail",
    "fallback": {
     "css": ".wizard-rail"
    }
   },
   "placement": "bottom",
   "action": "none",
   "advanceOn": "next",
   "title": "Seven tabs, left to right",
   "body": "Identity, Attributes, Species, Background, Class, Advance, #PRINT. Finished tabs get a check, and Advance reads NOT YET until you have Training Points to spend. Click any tab to jump back.",
   "example": null,
   "optional": false,
   "tab": "print",
   "wizard": "identity"
  },
  {
   "id": "identity-names",
   "screen": "identity",
   "wizardStep": "01",
   "anchor": {
    "dataTour": "identity-names",
    "fallback": {
     "css": ".panel .grid3"
    },
    "note": "Row holding First name, Handle, Last name inputs"
   },
   "placement": "bottom",
   "action": "type",
   "advanceOn": "next",
   "title": "Name and handle",
   "body": "Shows as First \"Handle\" Last. The handle is optional at level one; you can earn one in play.",
   "example": "First: BOLLARD-7. Handle: Bollard. Last: Seven.",
   "optional": false,
   "tab": "print",
   "wizard": "identity"
  },
  {
   "id": "identity-handle-story",
   "screen": "identity",
   "wizardStep": "01",
   "anchor": {
    "dataTour": "identity-handle-story",
    "fallback": {
     "css": "textarea[placeholder^='Who first called you that']"
    }
   },
   "placement": "bottom",
   "action": "type",
   "advanceOn": "next",
   "optional": true,
   "title": "How you got your handle",
   "body": "Who named you, and why it stuck. One good scene beats a paragraph of history.",
   "example": "He stood in front of an eviction truck at Marigold Court until it left empty.",
   "tab": "print",
   "wizard": "identity"
  },
  {
   "id": "identity-concept",
   "screen": "identity",
   "wizardStep": "01",
   "anchor": {
    "dataTour": "identity-concept",
    "fallback": {
     "css": "textarea[placeholder^='An ex-corporate Stitcher']"
    }
   },
   "placement": "bottom",
   "action": "type",
   "advanceOn": "next",
   "title": "Your one-line pitch",
   "body": "If a fixer had ten seconds to describe you to a client, what would they say?",
   "example": "A demolition Clanker who woke up during a job and now holds buildings up until everyone is out.",
   "optional": false,
   "tab": "print",
   "wizard": "identity"
  },
  {
   "id": "identity-origin",
   "screen": "identity",
   "wizardStep": "01",
   "anchor": {
    "dataTour": "identity-origin",
    "fallback": {
     "css": "textarea[placeholder^='Where you grew up']"
    }
   },
   "placement": "bottom",
   "action": "type",
   "advanceOn": "next",
   "title": "Where you came from",
   "body": "Your whole backstory lives here. Where you grew up, who you were before the job, what broke, what you're after now, and what you won't do to get it. Open with the place, then tell the story.",
   "example": "Clean Slate Demolition's yard in the Eastern Industrial Zone. Then Marigold Court, the generator, Kettle Street, and why he stays in doorways too long.",
   "optional": false,
   "tab": "print",
   "wizard": "identity"
  },
  {
   "id": "identity-inner-profile",
   "screen": "identity",
   "wizardStep": "01",
   "anchor": {
    "dataTour": "identity-inner-profile",
    "fallback": {
     "css": ".panel",
     "text": "INNER PROFILE"
    }
   },
   "placement": "top",
   "action": "type",
   "advanceOn": "next",
   "optional": true,
   "title": "Inner Profile",
   "body": "No bonuses, just truth. Habits, sparks, tethers, fault lines, and how you look. This is what your GM steals for scenes.",
   "example": "Tell: he counts heads going into buildings and coming out.",
   "tab": "print",
   "wizard": "identity"
  },
  {
   "id": "identity-notes",
   "screen": "identity",
   "wizardStep": "01",
   "anchor": {
    "dataTour": "identity-notes",
    "fallback": {
     "css": ".field textarea"
    },
    "note": "Last textarea in the Inner Profile panel, labeled NOTES"
   },
   "placement": "top",
   "action": "type",
   "advanceOn": "next",
   "optional": true,
   "title": "Notes catch the rest",
   "body": "Crew, a personal item, anything with no field of its own. One line each. Your backstory belongs in Where You Came From, and your languages are tracked for you.",
   "example": "Crew role and a grease-stained repair notebook.",
   "tab": "print",
   "wizard": "identity"
  },
  {
   "id": "next-button",
   "screen": "identity",
   "wizardStep": "01",
   "anchor": {
    "dataTour": "wizard-next",
    "fallback": {
     "css": "main button.btn.primary",
     "text": "NEXT"
    }
   },
   "placement": "left",
   "action": "click",
   "advanceOn": "click",
   "title": "On to the numbers",
   "body": "Identity can wait. Everything here is editable until you file.",
   "example": null,
   "optional": false,
   "tab": "print",
   "wizard": "identity"
  },
  {
   "id": "attr-method",
   "screen": "attributes",
   "wizardStep": "02",
   "anchor": {
    "dataTour": "attr-method",
    "fallback": {
     "css": "main button.btn.sm",
     "text": "STANDARD ARRAY"
    },
    "note": "Four method buttons: POINT BUY, STANDARD ARRAY, MANUAL/ROLL, OVERCLOCKED ARRAY"
   },
   "placement": "bottom",
   "action": "click",
   "advanceOn": "click",
   "title": "Pick a method",
   "body": "Point Buy gives you 27 points to spend. Standard Array hands you 16, 16, 14, 12, 12, 8 to place. New players: take the array.",
   "example": "Bollard uses Standard Array.",
   "warning": "This tab shows a check before you touch it. Ten across the board is valid, not good.",
   "optional": false,
   "tab": "print",
   "wizard": "attributes"
  },
  {
   "id": "attr-assign",
   "screen": "attributes",
   "wizardStep": "02",
   "anchor": {
    "dataTour": "attr-grid",
    "fallback": {
     "css": ".attr-grid"
    }
   },
   "placement": "bottom",
   "action": "select",
   "advanceOn": "condition",
   "completeWhen": "Every attribute placed (array) or every point spent (Point Buy)",
   "title": "Put your 16s where your class lives",
   "body": "Each value goes in once. Your class tells you its priority. Modifier is (score minus 10) divided by 2, rounded down.",
   "example": "BOD 16, AGI 14, WIT 16, TEC 12, MYS 8, PRE 12. Fury runs on Body, then Wits.",
   "optional": false,
   "tab": "print",
   "wizard": "attributes"
  },
  {
   "id": "species-cards",
   "screen": "species",
   "wizardStep": "03",
   "anchor": {
    "dataTour": "species-cards",
    "fallback": {
     "css": ".card-grid"
    }
   },
   "placement": "bottom",
   "action": "click",
   "advanceOn": "click",
   "title": "Choose a Species",
   "body": "Humans, Verdine, Clankers, Chimera, Outsiders. Pick the one whose story you want to live in.",
   "example": "Clankers: the accident the corporations can't reproduce.",
   "optional": false,
   "tab": "print",
   "wizard": "species"
  },
  {
   "id": "species-traits",
   "screen": "species",
   "wizardStep": "03",
   "anchor": {
    "dataTour": "species-traits",
    "fallback": {
     "css": ".feature.species"
    }
   },
   "placement": "top",
   "action": "none",
   "advanceOn": "next",
   "title": "Traits come free",
   "body": "Species traits come free. Read them anyway: they're half your toolkit. Your languages are here too: Common Trade plus your species tongue. Humans choose theirs here before filing, and Chimera and Outsiders can name their dialect.",
   "example": "Machine Physiology: no disease, poison, toxic gas, food, air, or sleep. Resonant Circuitry: Edge on Saves against EMP or Tech damage. Languages: Common Trade and Machine Cant.",
   "optional": false,
   "tab": "print",
   "wizard": "species"
  },
  {
   "id": "species-height",
   "screen": "species",
   "wizardStep": "03",
   "anchor": {
    "dataTour": "species-height",
    "fallback": {
     "css": "main select.mono"
    },
    "note": "Feet and inches selects; cm and Size fill in automatically"
   },
   "placement": "bottom",
   "action": "select",
   "advanceOn": "condition",
   "completeWhen": "Feet and inches selected; Your Size badge shows a value",
   "title": "Set your height",
   "body": "Pick feet and inches. The app works out centimeters and your Size.",
   "example": "7 ft 8 in. Still Medium.",
   "optional": false,
   "tab": "print",
   "wizard": "species"
  },
  {
   "id": "lineage-feature",
   "screen": "species",
   "wizardStep": "03",
   "anchor": {
    "dataTour": "lineage-features",
    "fallback": {
     "css": ".feature.lineage"
    }
   },
   "placement": "top",
   "action": "click",
   "advanceOn": "click",
   "title": "One lineage feature, for now",
   "body": "If your species offers one lineage, it's preselected; otherwise pick it first. Then pick one feature. The others unlock later through Lineage Evolution.",
   "example": "Heavy Payload: lift wreckage, drag allies clear, and once per Encounter free a pinned ally with no roll.",
   "optional": false,
   "tab": "print",
   "wizard": "species"
  },
  {
   "id": "background-cards",
   "screen": "background",
   "wizardStep": "04",
   "anchor": {
    "dataTour": "background-cards",
    "fallback": {
     "css": ".card-grid"
    }
   },
   "placement": "bottom",
   "action": "click",
   "advanceOn": "click",
   "title": "Who were you before the job?",
   "body": "Pick the life you led before the job. Each card names the skill it always grants.",
   "example": "Gearhead: you're the reason broken things keep moving.",
   "optional": false,
   "tab": "print",
   "wizard": "background"
  },
  {
   "id": "background-chips",
   "screen": "background",
   "wizardStep": "04",
   "anchor": {
    "dataTour": "background-chips",
    "fallback": {
     "css": "main .chip"
    },
    "note": "Rows SKILLS / TOOLS / WEAPON-VEHICLE; dashed = option, solid = granted"
   },
   "placement": "bottom",
   "action": "click",
   "advanceOn": "condition",
   "completeWhen": "One chip picked in each 'choose one' row",
   "title": "Lock your picks",
   "body": "Solid chips are yours. Dashed chips are choices: click one per row. Peek at your class first and skip anything it already gives you.",
   "example": "Systems (Fury already grants Athletics), Engineering Tools, Industrial / Mechs.",
   "optional": false,
   "tab": "print",
   "wizard": "background"
  },
  {
   "id": "background-contacts",
   "screen": "background",
   "wizardStep": "04",
   "anchor": {
    "dataTour": "background-contacts",
    "fallback": {
     "css": "main button",
     "text": "ADD YOUR CONTACTS"
    }
   },
   "placement": "top",
   "action": "click",
   "advanceOn": "click",
   "title": "Two people who still pick up",
   "body": "A name and a role is enough to start. Why they answer your call is worth adding.",
   "example": null,
   "optional": false,
   "tab": "print",
   "wizard": "background"
  },
  {
   "id": "contacts-modal",
   "screen": "background",
   "wizardStep": "04",
   "anchor": {
    "dataTour": "contacts-modal",
    "fallback": {
     "css": "[class*=modal]",
     "text": "BACKGROUND CONTACTS"
    },
    "note": "Dialog; title shows 'Gearhead · N of 2'"
   },
   "placement": "left",
   "action": "type",
   "advanceOn": "condition",
   "completeWhen": "Counter reads 2 of 2 and dialog is closed",
   "title": "Fill in your contacts",
   "body": "They start Neutral or Friendly. Once you file, they're waiting under Social, Contacts.",
   "example": "Mara Coil, scrapyard owner (he saved her gantry). Tuck Barrow, parts runner (he carried him out of a wreck).",
   "optional": false,
   "tab": "print",
   "wizard": "background"
  },
  {
   "id": "background-prompts",
   "screen": "background",
   "wizardStep": "04",
   "anchor": {
    "dataTour": "background-prompts",
    "fallback": {
     "css": "main",
     "text": "PERSONAL ITEM"
    },
    "note": "Read-only prompt text under Contacts"
   },
   "placement": "top",
   "action": "none",
   "advanceOn": "next",
   "optional": true,
   "title": "Prompts, not fields",
   "body": "Personal Item and Backstory Hook are ideas to steal. Put the item in Identity Notes and fold the hook into Where You Came From.",
   "example": "The generator he built for Marigold Court, and Clean Slate Demolition's claim to both it and him.",
   "tab": "print",
   "wizard": "background"
  },
  {
   "id": "class-cards",
   "screen": "class",
   "wizardStep": "05",
   "anchor": {
    "dataTour": "class-cards",
    "fallback": {
     "css": ".card-grid"
    }
   },
   "placement": "bottom",
   "action": "click",
   "advanceOn": "click",
   "title": "Your angle",
   "body": "Seven classes. Each card shows its resource and Vitality die. Species says who you are. Class says what people pay you for.",
   "example": "Fury: Overdrive, d12. A battering ram that soaks the hits meant for the crew.",
   "optional": false,
   "tab": "print",
   "wizard": "class"
  },
  {
   "id": "class-core",
   "screen": "class",
   "wizardStep": "05",
   "anchor": {
    "dataTour": "class-core",
    "fallback": {
     "css": ".panel",
     "text": "CORE TRAITS"
    }
   },
   "placement": "bottom",
   "action": "none",
   "advanceOn": "next",
   "title": "Read the core traits",
   "body": "Vitality, Resilience, attribute priority, focused saves, and your resource pool.",
   "example": "VIT 12 + Body, RES d12, saves Body and Presence, Overdrive pool 4.",
   "optional": false,
   "tab": "print",
   "wizard": "class"
  },
  {
   "id": "class-maneuvers",
   "screen": "class",
   "wizardStep": "05",
   "anchor": {
    "dataTour": "class-maneuvers",
    "fallback": {
     "css": "main span.chip",
     "text": "chosen"
    },
    "note": "Counter chip 'N / 2 chosen' and the maneuver chips after it"
   },
   "placement": "bottom",
   "action": "click",
   "advanceOn": "condition",
   "completeWhen": "Counter reads 2 / 2 chosen",
   "title": "Pick your starting abilities",
   "body": "Click until the counter is full. Each costs your class resource to use. For a Fury that's Overdrive, and Berserk lines kick in while you're Bloodied.",
   "example": "Pile Driver to shove a guard into a wall. Close Protection to take the hit for an ally.",
   "optional": false,
   "tab": "print",
   "wizard": "class"
  },
  {
   "id": "class-proficiencies",
   "screen": "class",
   "wizardStep": "05",
   "anchor": {
    "dataTour": "class-proficiencies",
    "fallback": {
     "css": "main .chip"
    },
    "note": "STARTING PROFICIENCIES rows"
   },
   "placement": "bottom",
   "action": "click",
   "advanceOn": "condition",
   "completeWhen": "One chip picked in each 'choose one' row",
   "title": "Pick your training",
   "body": "Same as Background: dashed chips are choices. A circled plus means you already have it; picking it again earns a Free Skill Focus.",
   "example": "Perception and Fieldcraft Tools.",
   "optional": false,
   "tab": "print",
   "wizard": "class"
  },
  {
   "id": "class-free-focus",
   "screen": "class",
   "wizardStep": "05",
   "anchor": {
    "dataTour": "class-free-focus",
    "fallback": {
     "css": "main input[placeholder^='narrow aspect']"
    }
   },
   "placement": "top",
   "action": "type+click",
   "advanceOn": "condition",
   "completeWhen": "The box shows CLAIMED",
   "title": "Overlap? Claim a Focus",
   "body": "Background and class gave you the same training. It stays Proficient, never Expertise. You get a Free Skill Focus instead: name a narrow slice and claim it.",
   "example": "Engineering Tools (heavy machinery repair).",
   "warning": "Until you claim it, the Background and Class tabs both lose their checks.",
   "optional": false,
   "tab": "print",
   "wizard": "class"
  },
  {
   "id": "subclass",
   "screen": "class",
   "wizardStep": "05",
   "anchor": {
    "dataTour": "subclass-cards",
    "fallback": {
     "css": "main .opt-card",
     "text": "The Juggernaut"
    },
    "note": "Two subclass cards under the SUBCLASS section title"
   },
   "placement": "top",
   "action": "click",
   "advanceOn": "click",
   "title": "Choose a Subclass",
   "body": "Chosen now. It decides how you do the job and unlocks your Subclass Extra gear.",
   "example": "The Juggernaut. Level one grants The Walking Anvil.",
   "optional": false,
   "tab": "print",
   "wizard": "class"
  },
  {
   "id": "gear-slots",
   "screen": "class",
   "wizardStep": "05",
   "anchor": {
    "dataTour": "gear-kit",
    "fallback": {
     "css": ".panel",
     "text": "STARTING GEAR KIT"
    }
   },
   "placement": "top",
   "action": "click",
   "advanceOn": "condition",
   "completeWhen": "Every 'choose one' slot has a pick",
   "title": "Spend your 𝒢800",
   "body": "Core Pack, Class Kit, Subclass Extra, plus a free Class Item. Where a slot lists two items, pick one. Whatever's left loads onto your Glimmer Stick as cash.",
   "example": "Warhammer, Composite Kit, Utility Belt, plus the Juggernaut's Scrap Shield.",
   "optional": false,
   "tab": "print",
   "wizard": "class"
  },
  {
   "id": "gear-totals",
   "screen": "class",
   "wizardStep": "05",
   "anchor": {
    "dataTour": "kit-totals",
    "fallback": {
     "css": ".kit-totals"
    }
   },
   "placement": "top",
   "action": "none",
   "advanceOn": "next",
   "title": "Watch the total",
   "body": "Cheap kit, more cash. Expensive kit, nothing to spare. Nobody's kit runs past 𝒢800.",
   "example": "𝒢680 spent. 𝒢120 left.",
   "optional": false,
   "tab": "print",
   "wizard": "class"
  },
  {
   "id": "gear-claim",
   "screen": "class",
   "wizardStep": "05",
   "anchor": {
    "dataTour": "claim-kit",
    "fallback": {
     "css": "main button",
     "text": "CLAIM STARTING KIT"
    }
   },
   "placement": "top",
   "action": "click",
   "advanceOn": "click",
   "title": "Claim it",
   "body": "The app equips your weapon, wears your armor, and reports Load against your Load Budget. Undo is right there if you change your mind.",
   "example": "Load 9 / 11 right after claiming.",
   "warning": "Load looks high because nothing is racked yet. The rack step after filing brings it down.",
   "optional": false,
   "tab": "print",
   "wizard": "class"
  },
  {
   "id": "class-progression",
   "screen": "class",
   "wizardStep": "05",
   "anchor": {
    "dataTour": "class-progression",
    "fallback": {
     "css": "main .panel",
     "text": "LEVEL 1"
    }
   },
   "placement": "top",
   "action": "none",
   "advanceOn": "next",
   "optional": true,
   "title": "What's coming",
   "body": "Ten levels. Cyan is your class, purple is your subclass. Click a level to read ahead.",
   "example": "Level 2 brings Relentless Advance.",
   "tab": "print",
   "wizard": "class"
  },
  {
   "id": "advance",
   "screen": "advance",
   "wizardStep": "06",
   "anchor": {
    "dataTour": "advance-panel",
    "fallback": {
     "css": ".panel",
     "text": "ADVANCEMENT"
    }
   },
   "placement": "bottom",
   "action": "none",
   "advanceOn": "next",
   "title": "Nothing to spend yet",
   "body": "Levels, Training Points, upgrades and Languages live here. At level one you have 0 TP; the first 5 arrive at level 3. NOT YET is normal. A language you learned in Downtime can be recorded here any time.",
   "example": null,
   "optional": false,
   "tab": "print",
   "wizard": "advance"
  },
  {
   "id": "skill-loadout",
   "screen": "advance",
   "wizardStep": "06",
   "anchor": {
    "dataTour": "skill-loadout",
    "fallback": {
     "css": ".panel",
     "text": "SKILL LOADOUT"
    }
   },
   "placement": "bottom",
   "action": "click",
   "advanceOn": "next",
   "optional": true,
   "title": "Double-check your skills",
   "body": "Open Skill Loadout. Everything your background and class gave you reads Proficient and GRANTED.",
   "example": "Athletics, Acrobatics, Perception, Engineering, Systems.",
   "tab": "print",
   "wizard": "advance"
  },
  {
   "id": "print-vitals",
   "screen": "print",
   "wizardStep": "07",
   "anchor": {
    "dataTour": "print-vitals",
    "fallback": {
     "css": "main",
     "text": "VITAL STATISTICS"
    }
   },
   "placement": "bottom",
   "action": "none",
   "advanceOn": "next",
   "title": "Form RF-07",
   "body": "Your registry filing. Read it like a contract. Corrections after filing need a re-verification request.",
   "example": "DEF 13, SPD 8, VIT 15, WND 16, RES d12, Overdrive 4.",
   "optional": false,
   "tab": "print",
   "wizard": "dossier"
  },
  {
   "id": "print-skills",
   "screen": "print",
   "wizardStep": "07",
   "anchor": {
    "dataTour": "print-skills",
    "fallback": {
     "css": ".panel",
     "text": "SKILLS & PROFICIENCIES"
    }
   },
   "placement": "top",
   "action": "none",
   "advanceOn": "next",
   "optional": true,
   "title": "Everything, combined",
   "body": "Background, class, advance and your languages in one list. Your Free Focus sits in the Focus row.",
   "example": "Focus: Engineering Tools (heavy machinery repair), FREE.",
   "tab": "print",
   "wizard": "dossier"
  },
  {
   "id": "print-certify",
   "screen": "print",
   "wizardStep": "07",
   "anchor": {
    "dataTour": "print-certify",
    "fallback": {
     "css": "main input[type=checkbox]"
    }
   },
   "placement": "top",
   "action": "click",
   "advanceOn": "click",
   "title": "Certify",
   "body": "Tick the box to confirm the record is accurate. It stays locked until every tab has its check. Not ready? Export the .json or print a hardcopy instead.",
   "example": null,
   "optional": false,
   "tab": "print",
   "wizard": "dossier"
  },
  {
   "id": "print-submit",
   "screen": "print",
   "wizardStep": "07",
   "anchor": {
    "dataTour": "print-submit",
    "fallback": {
     "css": "main button.btn.primary",
     "text": "SUBMIT & FILE"
    }
   },
   "placement": "left",
   "action": "click",
   "advanceOn": "click",
   "title": "Submit & File",
   "body": "Filing issues your Identity Network Tag and opens your live Freelancer sheet.",
   "example": "Tag RF-WKTKZM, BOLLARD-7 \"Bollard\" Seven.",
   "optional": false,
   "tab": "print",
   "wizard": "dossier"
  },
  {
   "id": "inventory-rack",
   "screen": "inventory",
   "wizardStep": null,
   "anchor": {
    "dataTour": "inventory-rack",
    "fallback": {
     "css": "main select"
    },
    "note": "Status select on each carried item: Stashed / Carried / Racked: <carry gear>"
   },
   "placement": "left",
   "action": "select",
   "advanceOn": "condition",
   "completeWhen": "Carry gear capacity filled (rack options disappear from other items)",
   "title": "Rack your carry gear",
   "body": "Open Inventory. Your belt or rig only racks while it's worn, so wear it first. Then set items to Racked on it. Each racked item weighs 1 less, but takes an action to pull out.",
   "example": "Engineering Toolkit (Swift Action to take out) and Flashlight (Free Action). Load drops to 7 / 11.",
   "optional": false,
   "tab": "gear",
   "wizard": null
  },
  {
   "id": "inventory-load",
   "screen": "inventory",
   "wizardStep": null,
   "anchor": {
    "dataTour": "inventory-load",
    "fallback": {
     "css": "main",
     "text": "LOAD"
    },
    "note": "LOAD n / threshold row at the top of the Stash panel"
   },
   "placement": "bottom",
   "action": "none",
   "advanceOn": "next",
   "title": "Load and cash",
   "body": "Load is what you're carrying against your Loadout's Load Budget. Your leftover Glimmer sits top right.",
   "example": "7 / 11, unencumbered. 𝒢120.",
   "optional": false,
   "tab": "gear",
   "wizard": null
  },
  {
   "id": "sheet-summary",
   "screen": "freelancer",
   "wizardStep": null,
   "anchor": {
    "dataTour": "sheet-vitals",
    "fallback": {
     "css": "main",
     "text": "FREELANCER"
    },
    "note": "Top stat row: DEF, DR, SPD, INIT, SIZE"
   },
   "placement": "bottom",
   "action": "none",
   "advanceOn": "next",
   "title": "You're on the #GRID",
   "body": "This is your live sheet. Overdrive, abilities, weapons, and loadout live in the Actions panel.",
   "example": "DEF 13, DR 3, SPD 8, INIT +4. Warhammer +5, 1d8+3.",
   "optional": false,
   "tab": "combat",
   "wizard": null
  },
  {
   "id": "social-contacts",
   "screen": "social",
   "wizardStep": null,
   "anchor": {
    "dataTour": "social-contacts",
    "fallback": {
     "css": "main",
     "text": "CONTACTS"
    }
   },
   "placement": "bottom",
   "action": "click",
   "advanceOn": "done",
   "optional": true,
   "title": "Your people",
   "body": "Open Social and tap CONTACTS. Your background contacts are waiting there. Add a fence, a tell, or a faction when the story needs it.",
   "example": "Mara Coil and Tuck Barrow, both Neutral.",
   "tab": "face",
   "wizard": null
  }
 ]
};
