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

  intro: "Elysium has its own vocabulary. This is enough of it to read the rest without getting lost. Everything here is explained in full later, in its own chapter. The goal right now is that when a class entry tells you to spend 1 Bandwidth to overclock your Cipher, you already know what those words mean.\nNew to tabletop games: read this once before you pick a class. Veteran: skim for the terms that look unfamiliar.",

  // Rolls, Edge and Snag, and Margin live in Core Resolution, not here. This is the pointer.
  covered: "How rolls work, Edge and Snag, and reading a Margin all have their own panels under Core Resolution below.",

  /* ---- the battlefield, measured ---------------------------------------- */
  space: {
    intro: "Distance is counted in **spaces**. One space is about five feet, or one meter: a single stride, a grid square, the gap between you and the next pillar. Every range, reach and blast in the book is measured this way, so you never have to stop and convert anything.",
    speed: "Your **Speed** is how many spaces you can cover on your turn, equal to **6 plus your Agility modifier**, minimum 3. Most Freelancers move five or six spaces before they have to choose between shooting, climbing, or just getting out of the light. Your sheet works this out for you, including chrome, armor and lineage adjustments.",
    areaIntro: "Some effects do not pick one Target. They fill a zone and catch whatever is standing in it: a thrown grenade, a sprayed cone of gel, a pulse of raw Flow. These are written **Area X**, where the number is the size in spaces and the word after it names the shape.",
    shapes: [
      { name: "Sphere", text: "A burst around a point. An Area with no shape word is a sphere, so Area 3 and Area 3 sphere mean the same thing." },
      { name: "Cone", text: "Fans out from you in a direction you pick." },
      { name: "Line", text: "Runs straight ahead, one space wide." },
      { name: "Cube", text: "A boxed off zone, equal on every edge." },
      { name: "Aura", text: "Stays centered on you and travels with you." }
    ],
    areaNote: "Anyone caught inside usually gets a Saving Throw to soften or dodge the worst of it. Combat Rules below has the details, including how a blast behaves when there is cover in the way."
  },

  /* ---- caliber: the table is derived from EN.rules.caliberByLevel -------- */
  caliber: {
    intro: "**Caliber** is your class's growth dial. It is a small number tied directly to your level, and it gets used everywhere: as a scaling bonus, as a multiplier for resource pools, as a counter for how many times per rest you can fire off a signature feature.",
    reading: "When a class feature reads a number of times equal to your Caliber per Long Rest, or your maximum pool equals Caliber plus Tech Modifier, this is the number it means.",
    focus: "Every class also has a **Saving Throw Focus**. When you make a Saving Throw that matches your Focus, you add your Caliber to the roll alongside the Attribute modifier. This is how seasoned Freelancers shrug off threats that would drop a rookie."
  },

  /* ---- class resources: the list is derived from EN.classes -------------- */
  resources: {
    intro: "Most classes do not just attack on their turn. They draw from a personal resource pool that fuels their signature plays. Each class has its own named resource, sized from Caliber and one Attribute.",
    refresh: "Unless a feature says otherwise, a class resource refreshes fully at the end of a Short Rest or a Long Rest. The Shaper is the standing exception: read the Reservoir line on the Flow tab.",
    note: "Triage is gated through a physical Triage Rig. If the rig is lost, the resource goes with it."
  },

  /* ---- the flow ---------------------------------------------------------- */
  flow: {
    intro: "The **Flow** is the universal metaphysical current that runs through everything in Elysium. People who can tune their bodies and minds to that current are called **Shapers**, and what they do is called shaping.",
    invocation: "A Shaper spends **Flow Points (FP)** out of their **Reservoir** to perform an **Invocation**, the formal act of bending reality into a specific effect. Their Flow Attribute (Mystique, Body, Charm or Tech, depending on subclass) drives both how much FP they have and how hard those Invocations land.",
    overdraw: "Pushing past your limits has a cost. Channeling Flow on an empty Reservoir is **Overdraw**, and it builds **Strain** on the Shaper's body and spirit. Five stages of Strain, or a critical failure on a Flow roll, can trigger **Breakflow**: total disconnection from the current.",
    unattuned: "Most classes do not touch the Flow this way. Codebreakers, Furies, Hustlers, Operators, Scoundrels and Stitchers are **Unattuned**: zero FP, no Invocations, and no Overdraw to risk. They still defend against Flow effects with ordinary Saving Throws, and they still use Mystique for Awareness checks."
  },

  /* ---- the #GRID --------------------------------------------------------- */
  grid: {
    intro: "The **#GRID** is the city's shared nervous system: a sprawling mesh of devices, vehicles, sensors, servers and ghostware, all talking at once. Every connected object projects a digital reflection of itself called a **Node**.",
    who: "For most people the #GRID is background noise. For Codebreakers and Sourcerers (a Shaper subclass) it is a second battlefield. Codebreakers operate inside it directly, running illegal hardware modules called **Ciphers** through a customized **Smartdeck**. They breach Nodes, dismantle security, and weaponize hostile networks before the shooting starts.",
    terms: [
      { name: "Node", text: "The digital representation of a device or system." },
      { name: "Link", text: "An active connection between your gear and a Node. You need one to push most Ciphers." },
      { name: "Cipher", text: "An illegal hardware module that lets you breach or weaponize a Node." },
      { name: "Bandwidth", text: "The Codebreaker's resource. See Class Resources above." },
      { name: "Quick Hack", text: "A single action d20 hack made under fire, as opposed to a longer Dice Pool intrusion." }
    ]
  },

  /* ---- reading a class line ---------------------------------------------- */
  together: {
    intro: "When you read a class entry, you will see lines like this:",
    example: "Spend 1 Overdrive as an Impulse Action to gain Edge on your next melee attack and ignore the first Wound die from the next hit you take.",
    reading: "You now have the vocabulary for that sentence. **Overdrive** is the Fury's resource. **Impulse Action** is a trigger based reaction, covered in Action Economy below. **Edge** is mechanical advantage on the roll. **Wound** is the heavier of Elysium's two damage tracks, covered in Vitality and Recovery.",
    closing: "All of it gets the full treatment in its own chapter. For now, just keep these shapes in mind while you choose a class and start building a Freelancer."
  }
};
