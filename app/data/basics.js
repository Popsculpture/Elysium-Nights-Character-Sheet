/* ===========================================================================
   ELYSIUM NIGHTS · The Basics
   The primer chapter: enough vocabulary to read a class entry without getting
   lost.

   ONLY WHAT THE CODEX WAS MISSING (author's instruction, 2026-09-09). The
   chapter's first three sections, How Rolls Work, Edge and Snag, and Margin,
   are NOT carried here: Core Resolution already owns all three in far more
   detail, and a primer copy would have been a second set of thresholds to
   keep in step. What is here is what the Codex used freely and never defined.
   Checked against the rendered page with every panel expanded, all 78k
   characters of it: "five feet", "sphere", "cone", "Reservoir" and "Saving
   Throw Focus" appeared zero times; Caliber appeared nine times without its
   ladder; Speed twenty-four times without its formula; Node, Cipher and
   Bandwidth only ever in passing, inside a gear row or a condition.

   WHAT IS NOT IN THIS FILE, ON PURPOSE. The primer quotes a lot of numbers,
   and every number it quotes already lives somewhere in the app. A second
   copy is a second thing to forget, which is the exact fault that has been
   dug out of this codebase four times now (actionCost, parseUses, the action
   type vocabulary, the LIMITED labels). So the Codex DERIVES them instead:

     the Caliber ladder        from EN.rules.caliberByLevel
     every class resource      from EN.classes[k].resource and .saveFocus

   The one formula stated here as prose is Speed, because it lives in code
   rather than data: engine.js derive() computes Math.max(3, 6 + agiMod) plus
   cyberware, loadout and lineage adjustments. If that base or floor ever
   moves, this line has to move with it.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.basics = {

  intro: "This chapter introduces the terms you'll need to build your Freelancer and read the rules. When a class entry tells you to \"spend 1 Bandwidth to overclock your Cipher,\" you'll know what it's asking. Later chapters explain each system in full.\nNew to tabletop games: read this once before you pick a class. Veteran: skim for the terms that look unfamiliar.",

  // Rolls, Edge and Snag, and Margin live in Core Resolution, not here. This is the pointer.
  covered: "How rolls work, Edge and Snag, and reading a Margin all have their own panels under Core Resolution below.",

  /* ---- the battlefield, measured ---------------------------------------- */
  space: {
    intro: "Distance is counted in **spaces**. One space is about five feet, or one meter: a single stride, a grid square, the gap between you and the next pillar. Every range, reach and blast in the book is measured this way, so you never have to stop and convert anything.",
    speed: "Your **Speed** is how many spaces you can cover on your turn, equal to **6 plus your Agility Modifier**, minimum 3. Most Freelancers move five or six spaces before they have to choose between shooting, climbing, or just getting out of the light. Your sheet works this out for you, including chrome, armor and lineage adjustments. The Combat chapter handles the rest: difficult terrain, falling, and what happens when something shoves you into a wall.",
    areaIntro: "Some effects don't pick one Target. They fill a zone and catch whatever is standing in it: a thrown grenade, a sprayed cone of gel, a pulse of raw Flow. These are written **Area X**, where the number is the size in spaces and the word after it names the shape.",
    shapes: [
      { name: "Sphere", x: "radius", text: "A burst around a point. An Area with no shape word is a sphere, so Area 3 and Area 3 sphere mean the same thing." },
      { name: "Cone", x: "widest point", text: "Fans out from you in a direction you pick." },
      { name: "Line", x: "length", text: "Runs straight ahead, one space wide." },
      { name: "Cube", x: "edge", text: "A boxed off zone, equal on every edge." },
      { name: "Aura", x: "radius", text: "Stays centered on you and travels with you." }
    ],
    areaNote: "Anyone caught inside usually gets a Saving Throw to soften or dodge the worst of it. Combat Rules below has the details, including how a blast behaves when there's cover in the way."
  },

  /* ---- caliber: the table is derived from EN.rules.caliberByLevel -------- */
  caliber: {
    intro: "**Caliber** is a number determined by your class level. Features use it to calculate scaling bonuses, multiply resource pools, or determine how many times you can use an ability per rest.",
    reading: "When a class feature reads a number of times equal to your Caliber per Long Rest, or your maximum pool equals Caliber plus Tech Modifier, this is the number it means.",
    focus: "Every class also has a **Saving Throw Focus**. When you make a Saving Throw that matches your Focus, you add your Caliber to the roll alongside the Attribute Modifier. This is how seasoned Freelancers shrug off threats that would drop a rookie."
  },

  /* ---- class resources: the list is derived from EN.classes -------------- */
  resources: {
    intro: "Besides attacking, most classes have a resource pool they spend to use their signature abilities. Each class has its own named resource, calculated as Caliber plus a specific Attribute Modifier (minimum of 1), with one exception: the Shaper's Flow Points use their own formula (see The Flow, below).",
    refresh: "Unless a feature says otherwise, all class resources refresh fully at the end of a Short Rest or Long Rest. The Shaper is the standing exception: read the Reservoir line on the Flow tab.",
    note: "Triage is gated through a physical Triage Rig. If the rig is lost, the resource goes with it."
  },

  /* ---- the flow ---------------------------------------------------------- */
  flow: {
    intro: "The **Flow** is the universal metaphysical current that runs through everything in Elysium. People who can tune their bodies and minds to that current are called **Shapers**, and what they do is called shaping.",
    invocation: "A Shaper spends **Flow Points (FP)** out of their **Reservoir** to perform an **Invocation**, the formal act of bending reality into a specific effect. Their Flow Attribute (Mystique, Body, Charm or Tech, depending on subclass) drives both how much FP they have and how hard those Invocations land.",
    check: "Not every use of the current is an attack. Steadying your frequency after Strain, forcing a severed link open, joining resonances, sustaining a field, or knitting flesh with raw energy calls for a **Flow Attribute Check**: d20 plus your Flow Modifier plus your Caliber against a DC, or Edge Dice from the same two sources on the Dice Pool Method. It never uses skill proficiency. The current is no sidearm, and drilling alone cannot teach your body to carry it, so Caliber stands in for the Proficiency Bonus.",
    overdraw: "Pushing past your limits has a cost. Channeling Flow on an empty Reservoir is **Overdraw**, and it builds **Strain** on the Shaper's body and spirit. Five stages of Strain, or a failed Breakflow Check, will trigger **Breakflow**: a total disconnection from the current.",
    unattuned: "Most classes do not touch the Flow this way. Codebreakers, Furies, Hustlers, Operators, Scoundrels and Stitchers are **Unattuned**: zero FP, no Invocations, and no Overdraw to risk. They still defend against Flow effects with ordinary Saving Throws, and they still use Mystique for Awareness checks."
  },

  /* ---- the #GRID --------------------------------------------------------- */
  grid: {
    intro: "The **#GRID** is the city's shared nervous system: a sprawling mesh of devices, vehicles, sensors, servers, and cyberware, all talking at once. Every connected object projects a digital reflection of itself called a **Node**.",
    who: "For most people the #GRID is background noise. For Codebreakers and Sourcerers (a Shaper subclass) it is a second battlefield. Codebreakers operate inside it directly, running illegal hardware modules called **Ciphers** through a customized **Smartdeck**. They breach Nodes, dismantle security, and weaponize hostile networks before the shooting starts.",
    terms: [
      { name: "Node", text: "The digital representation of a device or system." },
      { name: "Link", text: "An active connection between your gear and a Node. You need one to push most Ciphers." },
      { name: "Cipher", text: "An illegal hardware module that lets you breach or weaponize a Node." },
      { name: "Bandwidth", text: "The Codebreaker's resource. See Class Resources above." },
      { name: "Quick Hack", text: "A single-action d20 hack made under fire, as opposed to a longer Dice Pool intrusion." }
    ]
  },

  /* ---- reading a class line ---------------------------------------------- */
  together: {
    intro: "When you read a class entry, you will see lines like this:",
    example: "As an Impulse Action when an ally within 6 spaces takes damage from an attack, spend 1 Leverage to cash in a micro-favor (a bribed grid worker cutting the lights, a street kid dropping an obstacle). Reduce the incoming damage by 1d6 + your Charm Modifier + your Caliber.",
    reading: "You now have the vocabulary to read that sentence. **Impulse Action** is a trigger-based reaction, covered in Action Economy below. Six spaces is about thirty feet. **Leverage** is the Hustler's resource. Your Charm Modifier comes from your Attributes, and Caliber climbs with your level, so the same favor pays out more as your Freelancer grows.",
    closing: "Refer back to this chapter if you encounter an unfamiliar term while building your Freelancer."
  }
};
