/* ===========================================================================
   ELYSIUM NIGHTS · Vitality & Recovery
   Transcribed from the manuscript, Part 2 - Core Rules, Combat, Survival, &
   Specialized Systems (modifiedTime 2026-10-04T07:31:16.171Z), chapter
   "Vitality & Recovery" (export lines 2634 to 2904):
     Core Concepts · Vitality > Calculating Vitality · Wounds > Calculating
     Wounds, Wound Effects, Healing Wounds · Death and Dying > Thresholds,
     Dying, Stable, Stabilizing Someone, Coming Back, Dying Outright ·
     Resilience Dice > Spending, Regaining · Vigor · Recovery > Short Rest,
     Long Rest, Ritual Recovery, Downtime, Breakflow Restoration · Medical
     Treatment > Stabilize, Treat Wounds, Treat Fatigue · Other Recovery
     Sources · the closing Gameplay Summary.
   Part 1 (modifiedTime 2026-10-04T00:36:55.099Z) repeats the per-class
   numbers in each class's "Vitality & Resilience" block and in Building the
   Sheet, Steps 6 and 7; they agree with the table here.

   The book's words as written: the export's backslash escapes are removed and
   its **bold** is kept, since the Codex renders it. A list is an array of the
   book's bullets in order; a nested array holds the sub-bullets of the bullet
   before it. Nothing here is the app's own wording, except the one field
   marked APP NOTE (vitality.appNote), which says where the app departs from
   the book and is rendered as a note, never as rule text.

   Read by app/js/codex_recovery.js (the Codex chapter "Vitality & Recovery").
   The damage order itself (Vigor, then Vitality, then Wounds) is Combat's
   EN.combat.damagePipeline and is not repeated here. Ritual Recovery and
   Breakflow Restoration are kept as the book lists them among the rests, but
   their full rules are EN.flow's (the Flow chapter), so `inFlowChapter` marks
   the bullets that chapter already shows.
   2026-10-24 rulings, section 9 item 7: Ritual Recovery runs "10 minutes to 2 hours" (the
   Ritual of Alignment's longest row is 2 Hours since the Stage 5 row left).

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.recovery = {
  source: { part: 2, chapter: "Vitality & Recovery", modifiedTime: "2026-10-04T07:31:16.171Z" },

  intro: "Vitality is how much you can take before something gives. Wounds are the deep damage that stays until it's properly healed.",

  /* Core Concepts (a two column table in the book) */
  concepts: [
    { term: "Vitality", text: "Your short-term stamina and toughness: what you can take before damage starts reaching your Wounds." },
    { term: "Wounds", text: "Serious, lasting injuries that reduce maximum Vitality until healed." },
    { term: "Resilience Dice", text: "Your body's capacity for short-term recovery, used to restore Vitality during rest." },
    { term: "Vigor", text: "Temporary protection or Flow-infused shielding that absorbs damage before Vitality." },
    { term: "Fatigue", text: "Accumulated exhaustion or physical depletion from injury or overexertion." },
    { term: "Recovery", text: "The act of restoring Vitality, Wounds, or Flow stability through rest, care, or resonance." }
  ],

  vitality: {
    intro: "Vitality is short-term resilience, not the deep wound count underneath.",
    rules: [
      "When Vitality reaches **0**, you immediately gain **1 level of Fatigue** and the **Bloodied condition**.",
      "Any further damage beyond this point applies to **Wounds**.",
      "Fatigue gained this way remains until a **Long Rest** (see Fatigue), or medical or Flow-assisted recovery."
    ],
    // Calculating Vitality
    byClass: [
      { cls: "Codebreaker", die: "d6",  start: "6 + Body Modifier",  perLevel: "1d6 + Body Modifier" },
      { cls: "Operator",    die: "d10", start: "10 + Body Modifier", perLevel: "1d10 + Body Modifier" },
      { cls: "Fury",        die: "d12", start: "12 + Body Modifier", perLevel: "1d12 + Body Modifier" },
      { cls: "Hustler",     die: "d6",  start: "6 + Body Modifier",  perLevel: "1d6 + Body Modifier" },
      { cls: "Stitcher",    die: "d8",  start: "8 + Body Modifier",  perLevel: "1d8 + Body Modifier" },
      { cls: "Scoundrel",   die: "d8",  start: "8 + Body Modifier",  perLevel: "1d8 + Body Modifier" },
      { cls: "Shaper",      die: "d6",  start: "6 + Body Modifier",  perLevel: "1d6 + Body Modifier" }
    ],
    /* APP NOTE, not book text (author ruling #1, 2026-10-12): the book rolls the
       per level gain; the engine (js/engine.js, derive) takes a fixed average,
       EN.rules.dieAverage(die) + Body Modifier, at least 1 a level. The Codex adds
       each die's average from EN.rules.dieAverage after this line, so the figures
       follow the engine rather than being typed here. */
    appNote: "App note, not book text: the Handbook rolls 1dX + Body Modifier for each level after 1st. This app takes the fixed average instead (half the die, plus 1, plus Body Modifier, at least 1 a level), so a character's Vitality comes out the same every time the sheet works it out."
  },

  wounds: {
    intro: "Wounds are lasting trauma (burns, fractures, or deep injuries) that weaken both body and resonance until fully treated.",
    // Calculating Wounds (a one row Trait / Value table)
    max: { trait: "Maximum Wounds", value: "Equal to your **Body score** (not modifier)" },
    effects: [
      "Taking **Wound damage** reduces both **current** and **maximum Vitality** by the same amount.",
      "Critical hits or certain effects may bypass Vitality entirely and inflict **direct Wound damage**.",
      "When taking Wound damage, make a **Body Save** (DC 10 or half the Wound damage taken, whichever is higher).",
      ["**Failure:** Gain 1 Fatigue and suffer a Critical Wound (roll on the Critical Wound Table)."],
      "At **50 percent or less of total Wounds**, gain **Critical Condition**."
    ],
    healing: [
      "At the end of a **Long Rest**, recover **Wounds** equal to **your Body Modifier** (minimum 1).",
      "**Medical treatment** or **Flow-based restoration** can also heal Wounds, as described in the Recovery section."
    ]
  },

  dying: {
    intro: "Your Wound pool counts down. Wounds start at your **Body score** and fall as you take **Wound damage**. 0 Wounds is the bottom. Healing refills the pool toward your Body score; damage empties it toward 0.",
    thresholds: [
      "**0 Vitality:** Gain **1 level of Fatigue** and the **Bloodied** condition. Further damage applies to **Wounds**. You remain conscious and able to act.",
      "**50 percent or less of total Wounds:** Gain **Critical Condition**.",
      "**0 Wounds:** Fall **Unconscious** and become **Dying**."
    ],
    dying: "When your Wounds reach 0, you fall **Unconscious** (drop held items, Prone, can't act or perceive) and are **Dying**. This is the \"dead or dying\" state referenced by medical features and revival abilities.",
    deathSaves: [
      "At the **start of each of your turns** while Dying, make a **Death Save**: a **Body Save, DC 10**.",
      ["**Three successes:** you become **Stable**.",
       "**Three failures:** you die. Successes and failures need not be consecutive; track both until one reaches three."],
      "Taking any damage while Dying counts as **one failed Death Save**."
    ],
    // the boxed callout under Dying
    notDying: "Falling Unconscious from Critical Condition, Fatigue, or Nonlethal damage isn't the same as Dying. You only make Death Saves at 0 Wounds.",
    stable: {
      text: "A Stable character is **Unconscious**, no longer Dying, and makes no further Death Saves.",
      rules: [
        "You remain at **0 Wounds** and Unconscious until Wounds are restored.",
        "Taking damage while Stable returns you to **Dying**."
      ]
    },
    stabilizing: {
      text: "Use the **Stabilize** medical treatment (in combat: a d20 **Medtech, Tech, or Flow Attribute Check** against **DC 10**).",
      rules: [
        "On a success, a Dying character becomes **Unconscious and Stable**. The body remains at 0 Wounds."
      ]
    },
    comingBack: {
      text: "Restoring even **1 Wound** to a Dying or Stable character ends both states. They wake with that many Wounds.",
      rules: [
        "Restoring **Vitality** alone doesn't lift a character off 0 Wounds.",
        "Abilities that revive the dead-or-dying outright (such as **Not on My Watch**) state so in their own text and set the Wounds you return with."
      ]
    },
    outright: [
      "Some effects grant no Death Saves.",
      "If an effect states that you **die** or **die instantly** (a breath clock that runs out, certain Flow rot, an execution at point-blank range), you get no saves."
    ]
  },

  resilience: {
    intro: "Resilience Dice measure a character's ability to recover during rest.",
    rules: [
      "You have a number of **Resilience Dice equal to your level**.",
      "The **die size** is determined by your class.",
      "You spend Resilience Dice during **Short Rests** to regain Vitality."
    ],
    spending: [
      "During a Short Rest, spend one or more Resilience Dice.",
      "Roll each die and add your **Body Modifier** to each. Recover the total as Vitality."
    ],
    regaining: [
      "After a **Long Rest**, regain **all** Resilience Dice.",
      "If you begin a Short Rest with **0 dice**, regain **1 Resilience Die**, which may be spent during that rest."
    ]
  },

  vigor: {
    intro: "Vigor is a temporary buffer of adrenaline, shielding, or Flow resonance that absorbs damage before it reaches a Character's physical body.",
    noStack: "If a Character receives Vigor from a feature or ability while they already have Vigor, it doesn't add together. They simply keep the higher of the two numbers.",
    expiration: "Unless a feature states otherwise, all unspent Vigor dissipates at the end of a combat encounter."
  },

  /* Recovery: the rests, in the book's order */
  recoveryIntro: "Recovery comes through rest, medical care, or Flow realignment. The type of recovery determines what resources return and at what pace.",
  rests: [
    { key: "short", name: "Short Rest", duration: "about 1 hour of downtime",
      lines: [
        "Spend **Resilience Dice** to restore **Vitality**.",
        "If you begin the rest with **0 Resilience Dice**, regain **1 die** and may spend it during this rest.",
        "Some features and class abilities refresh after a Short Rest.",
        "Regain **Flow Points (FP)** equal to your **Flow Attribute Modifier** (minimum 1).",
        "No natural recovery of **Wounds**, but first aid can stabilize injuries or slow worsening conditions.",
        "Doesn't reduce **Strain**."
      ] },
    { key: "long", name: "Long Rest", duration: "about 8 hours of uninterrupted rest",
      lines: [
        "Fully restore **Vitality**.",
        "Regain all **Resilience Dice**.",
        "Recover **Wounds** equal to your **Body Modifier** (minimum 1).",
        "Regain your full **Flow Reservoir** (all FP).",
        "Reduce **Strain** by **1 stage**.",
        "Refresh all class features that recover on a Short or Long Rest.",
        "Remove the **Bloodied** condition if Vitality is restored.",
        "Reduce **Fatigue** by 1 level if you have safe shelter, food, and water (or equivalent maintenance and charge for Clankers).",
        ["**Severe Fatigue** (4 to 6) requires medical, mystical, or technological treatment to reduce."],
        "Reset the sleep clock. This is where the sleeping happens, or the maintenance cycle, for Clankers. (See Deprivation under Environmental Hazards.)"
      ] },
    { key: "ritual", name: "Ritual Recovery", duration: "10 minutes to 2 hours, scaling with current Strain Stage",
      lines: [
        "A Shaper realigns their resonance through guided meditation and a **Flow Dice Pool check**, reducing Strain and recovering Flow Points.",
        "Duration, Snag Dice, and full resolution (Flawless / Costly / Mixed / Failure) are governed by **The Ritual of Alignment** (see The Flow).",
        "**Resonant Saturation:** A Character may only benefit from Ritual Recovery once per 24-hour period. Any additional attempts automatically fail and inflict 1 Stage of Strain."
      ],
      // the Flow chapter's Ritual Recovery panel states Resonant Saturation (EN.flow.ritualRecovery.note)
      inFlowChapter: [2] },
    { key: "downtime", name: "Downtime", duration: "about 1 week of low activity or calm environment",
      lines: [
        "Fully restore **Vitality** and **FP**.",
        "Restore **all Wounds**.",
        "Remove **all Strain, unless you're in Breakflow**.",
        "Clear lingering **Fatigue** and **temporary conditions**.",
        "Recover from emotional or Flow-based instability."
      ] },
    { key: "breakflow", name: "Breakflow Restoration", duration: "8-hour Long Rest in a Flow-rich area (Anomaly Severity 0)",
      lines: [
        "Make a Flow Dice Pool check against 5 Snag Dice.",
        ["On a positive Margin, your Reservoir returns to half capacity and Strain drops to Stage 2.",
         "On a failure, you remain in Breakflow and take 2d6 Vitality loss."],
        "Requires meditation, ritual guidance, or assistance from another Flow adept."
      ],
      /* the book's sub-sub-bullet under the failure line, a pointer: "This is Breakflow
         Restoration; see The Flow." The Flow chapter's Full Restoration line states the check,
         both outcomes and the 2d6 (EN.flow.breakflowRestoration.full), so the first bullet and
         its two sub-bullets are its. Indices count top-level bullets; sub-bullets go with them. */
      pointer: "This is Breakflow Restoration; see The Flow.",
      inFlowChapter: [0] }
  ],

  medical: {
    intro: "Medical treatment is first aid, surgery, cybernetic repair, or Flow-assisted care beyond ordinary rest. It includes **Stabilize**, **Treat Wounds**, and **Treat Fatigue**.",
    rules: [
      "Each treatment requires **1 hour of focused care** unless stated otherwise.",
      "A character may only receive one attempt of each treatment per day.",
      "Flow-based or technological methods use the same mechanics unless noted."
    ],
    stabilize: {
      use: "Used when a character risks worsening injury or death.",
      lines: [
        "**Check (In Combat):** d20 Medtech, Tech, or Flow Attribute Check against DC 10 (or the condition's source DC).",
        "**Check (Out of Combat):** Medtech, Tech, or Flow Dice Pool check against 1 Snag Die (or equal to the condition's source Snag).",
        "**Effect:** Stops ongoing Vitality loss or prevents worsening.",
        "**Failure:** No effect; retry only with new conditions or tools."
      ]
    },
    treatWounds: {
      use: "Used to restore lasting trauma (requires 1 hour).",
      lines: [
        "**Check:** Medtech, Tech, or Flow Dice Pool check.",
        "**Snag Dice:** 2 Snag Dice for minor trauma, 4+ Snag Dice for critical trauma.",
        "**Equipment:** Basic Medkit (Advanced Medkit grants +2, or +1 Edge Die).",
        "**Effect (Costly Success / Margin +1 to +2):** Recover **1d4 Wounds**.",
        "**Flawless Success (Margin +3 or more):** Recover **1d6 Wounds**."
      ]
    },
    treatFatigue: {
      use: "Used to accelerate recovery from exhaustion (requires 1 hour or more).",
      rows: [
        { fatigue: "1-3 (Mild)",     snag: "2", equipment: "Basic Medkit", effect: "Reduce Fatigue by 1." },
        { fatigue: "4-5 (Severe)",   snag: "4", equipment: "Advanced Medkit (+2, or +1 Edge Die) or Flow-assisted", effect: "Reduce Fatigue by 1. A negative Margin (Failure) prevents further treatment until a Long Rest." },
        { fatigue: "6 (Helpless)",   snag: "5", equipment: "Specialized facility or Flow chamber", effect: "Reduce Fatigue by 1 and stabilize. Requires 8 hours." }
      ]
    }
  },

  otherSources: [
    "**Consumables:** Stims, nanotech patches, or Flow-infused relics may restore **Vitality, Wounds, or FP**.",
    "**Downtime Healing:** One uninterrupted week restores all **Wounds**, removes all **Strain**, and clears lingering **Fatigue**.",
    "**Restorative Effects:** Rare Flow phenomena or advanced technologies can instantly restore resources but may cause side effects.",
    "**Narrative Recovery:** Permanent or exotic injuries may require surgery, cybernetic repair, or high-level Flow rites to resolve."
  ],

  // the boxed "Gameplay Summary: Vitality & Recovery" that closes the chapter
  summary: "Track **Vitality** for short-term endurance. Apply **Wounds** when damage exceeds Vitality. Use **Resilience Dice** to restore Vitality during rests. Restore **Flow Points** and reduce **Strain** through rest or rituals. Treat **Fatigue** and injuries through medical or Flow-assisted care. Extended Downtime restores complete balance. Breakflow Restoration reopens your channel but leaves Strain at Stage 2."
};
