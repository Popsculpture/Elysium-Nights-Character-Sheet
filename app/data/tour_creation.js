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
 "version": "0.2.0",
 "changelog": [
  "0.2.0: the author's revised copy for all 40 steps (31 Oct 2026). Its three em dashes became a comma or a colon. Step 39 (You're on the #GRID) now points at the Actions panel its copy describes; step 22 (Read the core traits) points at the core trait chips; every card carries a pointer toward what it describes.",
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
   "body": "Welcome to the registry, Freelancer. Select Register to start a new #PRINT. If you've brought an exported .json file from another device, use Import. You can also open a pre-made below to see a finished record. It only saves if you decide to keep it.",
   "example": "We're starting fresh with BOLLARD-7, better known as Bollard.",
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
   "body": "We'll work through seven tabs: Identity, Attributes, Species, Background, Class, Advance, and #PRINT. Completed tabs get a check. Advance shows NOT YET until you have Training Points to spend, so don't worry when you see it. You can click any tab to go back and make changes.",
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
   "body": "Your name appears as First \"Handle\" Last. Use the handle people know you by, or leave it blank for now. You don't need one at level one. Give your crew time; they'll probably find something to call you.",
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
   "body": "If you've got a handle, tell us where it came from. Who first called you that, and what made it stick? A single moment is plenty to start with.",
   "example": "Bollard stood in front of an eviction truck at Marigold Court until it left empty. After that, the name stuck.",
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
   "body": "Imagine a fixer has ten seconds to introduce you to a client. What do they say? Give us a quick sense of what you do and what makes you worth remembering.",
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
   "body": "This is where your backstory goes. Start with a place, then tell us who you were before freelancing, what changed, and what you're after now. Include a line you won't cross to get it. You can start small and fill in the rest as you get to know your Freelancer.",
   "example": "Bollard's story starts in Clean Slate Demolition's yard in the Eastern Industrial Zone. From there, it runs through Marigold Court, the generator, and Kettle Street, and explains why he stays in doorways too long.",
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
   "body": "Inner Profile gives your Freelancer some texture: habits, sparks, tethers, fault lines, and appearance. These details don't grant bonuses, but they give you something to play and your Admin (GM) something to build a scene around.",
   "example": "Bollard's tell: he counts heads going into buildings and coming out.",
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
   "body": "Use Notes for anything that needs a home: your place in the crew, a personal item, or another detail you want to keep handy. A line each will do. Put your backstory in Where You Came From; the app tracks your languages for you.",
   "example": "Bollard keeps a note about his crew role and the grease-stained repair notebook he carries.",
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
   "body": "Ready to see what your Freelancer can do? Head to Attributes. You can come back to Identity whenever something occurs to you; everything here stays editable until you file.",
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
   "body": "Choose how to build your attributes. Point Buy gives you 27 points to spend. Standard Array gives you six scores to assign: 16, 16, 14, 12, 12, and 8. If this is your first Freelancer, Standard Array is an easy place to start.",
   "example": "Bollard uses Standard Array.",
   "warning": "This tab can show a check before you've changed anything. Scores of 10 across the board are valid, so choose a method and assign your scores before moving on.",
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
   "body": "Assign each entry in the array once. Your class lists its attribute priorities, so take a look before placing your highest scores. Each score also gives you a modifier: subtract 10, divide by 2, and round down. A score of 16, for example, gives you +3.",
   "example": "Bollard takes BOD 16, AGI 14, WIT 16, TEC 12, MYS 8, and PRE 12. Fury prioritizes Body, then Wits.",
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
   "body": "Choose from Humans, Verdine, Clankers, Chimera, and Outsiders. Each brings its own traits and a different place in Elysium. Read the cards and pick the one whose story you want to explore.",
   "example": "Bollard is a Clanker: a machine that woke up, much to the frustration of corporations still trying to reproduce the accident.",
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
   "title": "Get to know your species traits",
   "body": "Your species traits come included, so take a moment to see what they let you do. Your languages are listed here too: Common Trade and your species tongue. Humans choose their additional language here before filing. Chimera and Outsiders can also name their dialect.",
   "example": "Bollard's Machine Physiology means he's unaffected by disease, poison, and toxic gas, and doesn't need food, air, or sleep. Resonant Circuitry gives him Edge on Saves against EMP or Tech damage. He speaks Common Trade and Machine Cant.",
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
   "body": "Choose your height in feet and inches. The app converts it to centimeters and works out your Size for you.",
   "example": "Bollard stands 7 ft 8 in. He's still Medium, though he gets a lot of comments about doorways.",
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
   "body": "If your species has one lineage available, it's already selected. If there are several, choose your lineage first. Then pick one of its features to start with. You'll be able to unlock the others later through Lineage Evolution.",
   "example": "Bollard chooses Heavy Payload to lift wreckage and drag allies clear. Once per Encounter, it also lets him free a pinned ally with no roll.",
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
   "body": "Choose the life you led before freelancing. Your Background gives you a starting point for your story and some training to bring into the field. Each card names the skill it always grants.",
   "example": "Bollard takes Gearhead. When something breaks, he's usually the one everyone looks at.",
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
   "title": "Choose your background training",
   "body": "Solid chips show training you already have. Dashed chips give you a choice: select one in each row. It helps to check your class first so you can use these picks to cover something it doesn't already grant.",
   "example": "Bollard picks Systems, Engineering Tools, and Industrial / Mechs. Fury already grants Athletics, so Systems broadens his options.",
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
   "body": "Time to put two names in your contacts. Start with who they are and what they do. If you know why they still answer your calls, add that too. A little shared history gives you both somewhere to start.",
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
   "body": "Add your contacts here and set each one's starting relationship to Neutral or Friendly. Once you've filed, you'll find them under Social, Contacts, ready for whatever the next job brings.",
   "example": "Mara Coil owns a scrapyard; Bollard saved her gantry. Tuck Barrow runs parts; Bollard carried him out of a wreck.",
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
   "title": "A few ideas to work with",
   "body": "Personal Item and Backstory Hook are prompts to help you fill out your story. If one catches your interest, put the item in your Identity Notes and work the hook into Where You Came From.",
   "example": "Bollard built a generator for Marigold Court. Clean Slate Demolition still claims ownership of the generator, and of Bollard.",
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
   "body": "Now choose what you bring to the crew. There are seven classes, and each card shows its resource and Vitality die. Think about the jobs you want to take and the part you want to play when things get complicated.",
   "example": "Bollard takes Fury: Overdrive, d12. He's the one who gets between the crew and whatever's coming through the wall.",
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
   "body": "Take a moment to read your class's core traits. This is where you'll find Vitality, Resilience, attribute priority, focused saves, and your resource pool. You'll be using these throughout play, so it's worth knowing where they come from.",
   "example": "Fury gives Bollard VIT 12 + Body, RES d12, saves in Body and Presence, and an Overdrive pool of 4.",
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
   "body": "Choose your starting abilities until the counter is full. Each costs your class resource to use, so read what it does and what it costs. For a Fury, that resource is Overdrive. The Berserk lines on Fury abilities apply while you're Bloodied.",
   "example": "Bollard takes Pile Driver to shove a guard into a wall and Close Protection to take a hit for an ally.",
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
   "title": "Pick your class training",
   "body": "Choose your training from the dashed chips, just as you did for Background. A circled plus marks something you already have. You can still choose it; overlapping training earns you a Free Skill Focus.",
   "example": "Bollard picks Perception and Fieldcraft Tools.",
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
   "body": "If your background and class grant the same training, it stays Proficient. The overlap doesn't raise it to Expertise; it gives you a Free Skill Focus. Name a narrow specialty, then claim it.",
   "example": "Bollard claims Engineering Tools (heavy machinery repair). He's spent plenty of time keeping demolition equipment alive.",
   "warning": "Both Background and Class lose their checks until you claim the Free Skill Focus.",
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
   "body": "Your Subclass shapes how you put your class to work. Choose it now to unlock your Subclass Extra gear.",
   "example": "Bollard chooses The Juggernaut, which grants The Walking Anvil at level one. It suits him.",
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
   "body": "You've got 𝒢800 for your starting gear. Work through the Core Pack, Class Kit, and Subclass Extra, and collect your free Class Item. Wherever a slot offers two items, choose one. Any Glimmer left over goes onto your Glimmer Stick as cash.",
   "example": "Bollard takes a Warhammer, Composite Kit, and Utility Belt, plus the Juggernaut's Scrap Shield.",
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
   "body": "Keep an eye on what you're spending. Cheaper gear leaves you more cash for later; expensive choices can use the whole allowance. Every starting kit fits within 𝒢800, so you can focus on what you want to carry into your first job.",
   "example": "Bollard spends 𝒢680 and keeps 𝒢120.",
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
   "title": "Claim your gear",
   "body": "Happy with your choices? Claim your gear. The app equips your weapon, puts your armor on, and shows your Load against your Load Budget. If you change your mind, use Undo and make another selection.",
   "example": "Bollard's Load is 9 / 11 immediately after claiming his gear.",
   "warning": "Nothing is racked yet, so this first Load total will look high. We'll bring it down in the racking step after filing.",
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
   "title": "See what's coming",
   "body": "Want a look ahead? Your progression covers ten levels. Cyan entries belong to your class; purple entries belong to your subclass. Click a level to see what you'll gain as you go.",
   "example": "At level 2, Bollard gets Relentless Advance.",
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
   "body": "Advance is where you manage levels, Training Points, upgrades, and Languages. You start at level one with 0 TP, and your first 5 TP arrive at level 3. For now, NOT YET is expected. You can still record a language you've learned in Downtime here at any time.",
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
   "body": "Open Skill Loadout to check the training you've picked up. Everything granted by your background and class should show Proficient and GRANTED. It's a handy place to see what your Freelancer already knows how to do.",
   "example": "Bollard has Athletics, Acrobatics, Perception, Engineering, and Systems.",
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
   "body": "Here's your registry filing: Form RF-07. Give it a proper read and check that the details match the Freelancer you meant to build. You can still go back and make changes now. After filing, corrections need a re-verification request. Even in Elysium, there's more paperwork.",
   "example": "Bollard's record shows DEF 13, SPD 8, VIT 15, WND 16, RES d12, and Overdrive 4.",
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
   "body": "This list brings together your background training, class training, advances, and languages. Check the Focus row for any Free Skill Focus you've claimed.",
   "example": "Bollard's Focus row shows Engineering Tools (heavy machinery repair), marked FREE.",
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
   "body": "When everything looks right, tick the box to certify that your record is accurate. The box stays locked until every tab has its check. If you want to come back later, you can export the .json file or print a hardcopy instead.",
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
   "body": "Select Submit & File to register your Freelancer. Filing issues your Identity Network Tag and opens your live Freelancer sheet. Keep that tag handy. The registry has a lot of names to keep straight.",
   "example": "Bollard is filed as BOLLARD-7 \"Bollard\" Seven, tag RF-WKTKZM.",
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
   "body": "Open Inventory and wear your belt or rig first; it can only rack items while you're wearing it. Then assign items to it as Racked. Each racked item counts as 1 less Load, but takes an action to retrieve, so check how quickly you can get to what you need.",
   "example": "Bollard racks his Engineering Toolkit, which takes a Swift Action to retrieve, and his Flashlight, which takes a Free Action. His Load drops to 7 / 11.",
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
   "body": "Your Load readout compares what you're carrying with your Loadout's Load Budget. Check it as you pick up gear during play. Your remaining Glimmer is shown at the top right.",
   "example": "Bollard is at 7 / 11, unencumbered, with 𝒢120 left to spend.",
   "optional": false,
   "tab": "gear",
   "wizard": null
  },
  {
   "id": "sheet-summary",
   "screen": "freelancer",
   "wizardStep": null,
   "anchor": {
    "dataTour": "sheet-actions",
    "fallback": {
     "css": "[data-panel=\"actions\"]"
    },
    "note": "The Actions panel: abilities, weapons, loadout, the class resource"
   },
   "placement": "top",
   "action": "none",
   "advanceOn": "next",
   "title": "You're on the #GRID",
   "body": "Welcome to your live Freelancer sheet. The Actions panel keeps your abilities, weapons, and loadout together, along with your class resource: Overdrive, in Bollard's case. This is where you'll find them when the job gets moving.",
   "example": "Bollard has DEF 13, DR 3, SPD 8, and INIT +4. His Warhammer attacks at +5 and deals 1d8+3 damage.",
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
   "body": "Open Social, then select CONTACTS. The people you added during Background are already here. As the story grows, you can add a fence, a tell, or a faction. You're registered, equipped, and ready to take a job. Time to find out who picks up.",
   "example": "Mara Coil and Tuck Barrow are waiting in Bollard's contacts, both Neutral.",
   "tab": "face",
   "wizard": null
  }
 ]
};
