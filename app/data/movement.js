/* ===========================================================================
   ELYSIUM NIGHTS · Movement, Jumping, Falling & Forced Movement, Maneuvers, Wall-to-Wall
   A transcription of the rulebook, read by the Codex's Combat Rules chapter
   (js/codex_movement.js). RULES ONLY: nothing here is computed.

   SOURCES (manuscript pulled 2026-10-07 as markdown; the line numbers are that
   export's, for a later sync to find the text again):
     Part 2, "Core Rules, Combat, Survival, & Specialized Systems"
       modifiedTime 2026-10-04T07:31:16.171Z
       Timing, Action Economy & Combat
         > Movement & Distance > Speed (the reductions paragraph)      l.1658
         > Movement & Distance > Jumping                               l.1717-1739
         > Movement & Distance > Falling & Forced Movement             l.1741-1743
         > Move Actions (1 per Turn), Cinematic Momentum               l.1810-1812
         > Attacks and Maneuvers > Shove, Trip, Grapple                l.1943-1977
         > Movement                                                    l.2042-2049
       The Flow > Kinetic Resonance, the "Forced Movement" box           l.4054-4056
       (the Appendix: Optional Damage Effects, Concussive and Knockback, moved
        to EN.threats.optionalDamageEffects; see movingEffectNames below)
     Part 3, "Equipment"
       modifiedTime 2026-10-04T03:05:35.328Z
       Ammo > Specialty Launcher Shells > Wall-to-Wall                   l.1710-1722
       Gear and Equipment, Encumbrance > Lifting, Carrying, and Short Hauls
         > Dragging, Pushing, and Pulling                              l.6540-6556

   Every `text` is the book's wording with the export's backslash escapes
   removed. **bold** is kept where the book bolds a term (the Codex renders it).
   A `name` is the book's own label (a bullet's bold lead-in, a box title, a run-in
   heading) unless a comment beside it says it is the app's.

   Not here, because the Codex already shows it: Speed itself (Basics, Space, Speed
   & Area; Action Economy, Move), Size and Tight Geometry (Combat Rules, Size), the
   Opportunity Attacks bullet on forced movement (Action Economy), Drowning (the
   Conditions Library), Prone and Grappled (the Conditions Library).
   The book has no separate rules for climbing or swimming beyond the Speed cost
   below and the Athletics skill, so none are carried.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.movement = {

  /* ---- Part 2 > Timing, Action Economy & Combat > Movement (l.2042) ---------
     The book's quick list. Each row is a named line in the Codex, so
     "Difficult Terrain" has an anchor of its own. */
  movement: [
    { name: "Speed",          text: "Equal to **6 + Agility Modifier** (minimum 3). One point of Speed moves you 1 space." },
    { name: "Difficult Terrain", text: "Costs 2 Speed per space." },
    { name: "Through a Body", text: "An ally's space, or the space of an enemy at least one Size smaller than you, costs 2 Speed to cross. Anyone else is a wall. You can't end your movement there." },
    { name: "Jump / Leap",    text: "1 Speed per space crossed." },
    { name: "Vault / Climb",  text: "2-3 Speed per space depending on difficulty." },
    { name: "Dash",           text: "Spend your Action to gain a new movement pool equal to your Speed." }
  ],

  /* ---- Part 2 > Movement & Distance > Speed, second paragraph (l.1658) ------ */
  speedReductions: "When multiple Speed reductions apply, subtract all flat reductions first, then apply any halving or percentage reductions, rounding down. Speed can't fall below 0 (or its stated minimum).",

  /* ---- Part 2 > Move Actions (1 per Turn), Cinematic Momentum (l.1810; the Toolkit's own heading, plain paragraphs, no GM label) ------ */
  cinematicMomentum: {
    name: "Cinematic Momentum",
    text: "As GM, you can grant a small burst of movement for certain triggers such as critical hits, heroic effort, or story-based bursts that restore **1 to 2 points of Speed** mid-turn when a Freelancer is close to reaching a goal or enemy. Use it to reward intent and maintain pacing. Avoid granting it to enemies except in story-driven moments."
  },

  /* ---- Part 3 > Lifting, Carrying, and Short Hauls > Dragging, Pushing, and Pulling (l.6540) */
  dragging: {
    name: "Dragging, Pushing, and Pulling",
    intro: "A Character can usually move more weight by dragging or pushing than by lifting.",
    guidelinesLead: "Use these guidelines:",
    guidelines: [
      "Dragging or pushing one unconscious person, body-sized object, or similar heavy load treats you as **Encumbered**",
      "Dragging or pushing two similar loads at once, or something much larger than yourself, treats you as **Overloaded**",
      "Wheels, rails, sleds, carts, hoists, drones, or a clean surface may reduce the state by one step, at GM discretion"
    ],
    whileLead: "While dragging, pushing, or pulling:",
    whileMoving: [
      "Your Speed is usually **halved**, round down",
      "Don't stack this with the Encumbered Speed penalty",
      "Use the worse movement limit and move on",
      "You can't Dash",
      "The GM may call for a **Body-based check** to keep moving through rubble, stairs, mud, tight corridors, active fire, or bad footing"
    ]
  },

  /* ---- Part 2 > Movement & Distance > Jumping (l.1717-1739) ----------------- */
  jumping: {
    intro: "A jump crosses a gap or clears an obstacle, at a run or from a standing start.",
    distance: "Your **jump distance** is **2 spaces plus your Body or Agility Modifier, whichever is higher** (minimum 1, maximum 5). That is a **long jump**: horizontal, at a run. Your **high jump** is half your jump distance (rounded down, minimum 1). That is vertical.",
    runUp: "A running jump needs **2 spaces of movement** before you leave the ground. From a standing start, halve both distances (rounded down, minimum 1).",
    table: [
      { mod: "-1 or lower", long: 1, high: 1, standing: "1 long, 1 high" },
      { mod: "+0",          long: 2, high: 1, standing: "1 long, 1 high" },
      { mod: "+1",          long: 3, high: 1, standing: "1 long, 1 high" },
      { mod: "+2",          long: 4, high: 2, standing: "2 long, 1 high" },
      { mod: "+3 or higher", long: 5, high: 2, standing: "2 long, 1 high" }
    ],
    cost: "A jump costs **1 Speed per space crossed**. The run-up costs Speed too, because it is movement. Climbing and vaulting still cost 2-3 per space.",
    // the next three are the book's bold run-in heads ("Going farther.", "Landing.", "Doubling.")
    farther: { name: "Going farther", text: "To beat your jump distance, make an **Athletics (Body)** check as part of the jump: **DC 15** buys 1 more space, **DC 20** buys 2. Nothing buys a third. On a failure you come down at the edge of your normal distance. If there is nothing under you, see **Falling & Forced Movement**." },
    landing: { name: "Landing", text: "Make an **Acrobatics (Agility)** check to land only when the place you are coming down is unsafe: a ledge the width of your boot, wet rebar, a moving train car, a space someone is already standing in. Failure puts you **Prone** where you land." },
    doubling: { name: "Doubling", text: "Several features double your jump distance. The maximum of 5 applies to your base distance, so a doubling doubles the number after the cap, not before it. Doublings don't stack: if more than one applies, use the largest and let the rest go." }
  },

  /* ---- Part 2 > Movement & Distance > Falling & Forced Movement (l.1743) ----
     The whole section, one paragraph. */
  fallingForced: "When a character is forcibly moved and stopped by an obstacle, they take 1d6 Bludgeoning damage for each space the movement was cut short. If they slam into anyone, they both split the damage of the impact evenly. Falling deals 1d6 Bludgeoning damage for every 2 spaces fallen.",

  /* ---- Part 2 > The Flow > Kinetic Resonance, the box titled "Forced Movement" (l.4054) */
  kineticBox: {
    name: "Forced Movement",
    text: "Forced movement from a Kinetic push or pull doesn't trigger Opportunity Attacks. However, it can be used tactically to push Enemies into environmental hazards or out of cover."
  },

  /* ---- Optional Damage Effects that move a Target -------------------------------
     The appendix lives in the Game Master's Toolkit now, and its words live once, in
     EN.threats.optionalDamageEffects (data/threats.js, all 31 Effects). This list only
     NAMES the two that push a Target, so the Movement chapter's Admin panel mv-optfx
     (js/codex_movement.js) can read their rows from that list instead of keeping a copy
     (the copy and its older intro sentence were deleted 19 Oct 2026, audit A6-04). */
  movingEffectNames: ["Concussive", "Knockback"],

  /* ---- Part 2 > Attacks and Maneuvers > Shove, Trip, Grapple (l.1943-1977) --- */
  maneuvers: {
    intro: "Shove, Trip, and Grapple are each an Action against a Target within your reach, resolved as a contest. You can attempt them on a Target up to one Size larger than you. Anything two Sizes larger or more is out of reach without a feature or a very good angle.",
    list: [
      { name: "Shove", lead: "You drive a Target back.", points: [
        "**Contest:** your **Athletics (Body)** against the Target's **Athletics (Body)** or **Acrobatics (Agility)**. You win on a higher total, and ties go to the Target.",
        "On a win, push the Target **1 space** directly away from you, or **2 spaces** if you win by 5 or more.",
        "You choose the direction, so a shove can send a Target into a hazard, off a ledge, or out of a doorway."
      ] },
      { name: "Trip", lead: "You knock a Target down.", points: [
        "**Contest:** your **Athletics (Body)** against the Target's **Athletics (Body)** or **Acrobatics (Agility)**. You win on a higher total, and ties go to the Target.",
        "On a win, the Target is knocked **Prone**.",
        "A Prone Target is easier to hit in melee and has to spend a Half Move or a Swift Action to stand (see Prone)."
      ] },
      { name: "Grapple", lead: "You seize a Target and hold on. Grappling needs a free hand.", points: [
        "**Contest:** your **Athletics (Body)** against the Target's **Athletics (Body)** or **Acrobatics (Agility)**. You win on a higher total, and ties go to the Target.",
        "On a win, the Target gains the **Grappled** condition: its Speed becomes 0 and it can't move from its space, though it can still act.",
        "While you hold the grapple, you can drag a Target of your Size or smaller with you by moving at half Speed.",
        "The Target breaks free by taking an Action to win a contest of its Athletics (Body) or Acrobatics (Agility) against your Athletics (Body), or when you let go, go down, or are dragged out of reach (see Grappled)."
      ] }
    ],
    // the paragraph after Grapple; the name is the app's
    heldTarget: { name: "A Held Target", text: "You can put a held Target between you and incoming fire, swing them at someone else, or throw them outright (see People as Improvised Weapons in Equipment). All three depend on your Body score." }
  },

  /* ---- Part 3 > Ammo > Specialty Launcher Shells > Wall-to-Wall (l.1710-1722)
     The book's own section for explosives indoors, cited by Cover and Defense
     (Part 2), the Explosive and Pressure traits and the Thermobaric Shell. Each
     part keeps the book's bold run-in head as its name. */
  wallToWall: {
    intro: "Wall-to-Wall is what happens when a blast goes off in an enclosed space: it hits the walls and comes back through the room.",
    parts: [
      { name: "Trigger", text: "Any damaging Area effect, Sphere or Cube, that goes off in an enclosed space. A space is enclosed if the blast can't vent: a closed room, a corridor, a stairwell, a parked car, a sealed container. A blown-out wall, an open roof, or a doorway wide enough to bleed off the pressure means it isn't enclosed, and none of this applies. A lingering cloud such as smoke or gas doesn't rebound; it simply fills the space. Borderline calls are the GM's." },
      { name: "Rebound", text: "Place the Area on the grid and compare it to the room's tightest open dimension, counting in spaces. For each space the Area is wider than the room can hold, the blast gains one extra die of its own damage, up to a number of extra dice equal to its normal damage dice. This extra damage is part of the same attack, so a save that halves the damage halves the extra dice with it." },
      { name: "Where it goes", text: "The spaces of the Area that land in a wall the blast can't break come back into the room. They run straight out from the blast until they hit a wall, then splash left and right along it. Cover the blast doesn't break splits the flow, and the spaces straight behind it stay clear: they fill only when every other open space is full and the blast still has more to give. Anyone in a space the blast fills is caught." },
      { name: "Bounce", text: "When every open space is full and there's still blast left, it folds back off the wall it hit onto spaces it has already caught, never onto cover. A space against one wall takes it once, a corner twice. Each time is a Bounce, and a target adds one die of the blast's damage per Bounce on its space, up to a number of extra dice equal to the blast's normal damage dice. Roll the Bounce dice once, in a line: a target with 2 Bounces adds the first two. Like Rebound, they're part of the same attack." },
      { name: "In a sealed room", text: "The pressure fills every corner. Everyone the blast catches rolls their save with **Snag**, and **Half Cover** and **Three-Quarter Cover** grant no bonus, because the blast never passes anyone by." },
      { name: "Pressure", text: "Some ordnance is built to turn a room into a kill box. When an effect with the **Pressure** trait triggers Wall-to-Wall, treat the room as one space narrower than it is when counting Rebound." }
    ]
  }
};
