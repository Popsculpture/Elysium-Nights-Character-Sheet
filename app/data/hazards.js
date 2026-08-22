/* ===========================================================================
   ELYSIUM NIGHTS · Environmental Hazards
   The chapter that sits between Conditions and The Flow: Exposure, Vacuum,
   Caustic Environments, and the mitigations already in the data that answer
   them. This file is the RULES only. Every live number the sheet shows comes
   out of EN.engine.hazardStats(ch), and every mutation goes through the
   Hazards panel on the Freelancer tab.

   No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.hazards = {

  intro: "Elysium kills with its weather as reliably as with its guns. Cold, heat, thin air and going without run on a clock rather than on damage: the clock ticks, you save, and a failure costs you a level of Fatigue. Vacuum and caustic air are faster and much less forgiving.",

  /* ---- 3.1 Exposure -----------------------------------------------------
     Clock-driven, not damage-driven. Every exposure runs its own escalating
     save. The escalation is PER EXPOSURE INSTANCE: two separate exposures each
     start at DC 10, and neither can read the other's DC. */
  exposure: {
    intro: "On each interval tick you make a Body Save. The first save in an exposure is DC 10, and each save after it is the previous DC plus 2. A failure costs 1 level of Fatigue. A success costs nothing and restarts the clock.",
    baseDC: 10,
    step: 2,
    onFail: "+1 level of Fatigue",
    onSuccess: "No effect, and the clock restarts. The DC does not reset; only leaving the exposure resets that.",
    onLeave: "Leaving the exposure resets both the clock and the DC. Fatigue already gained persists and comes off by the normal Fatigue recovery rules.",
    fatigueNote: "Fatigue from Exposure is ordinary Fatigue. It comes off by the normal Fatigue recovery rules: a Long Rest for levels 1 to 3, treatment for 4 to 6. Thin air is the one exception, below.",

    /* severity sets the interval, and nothing else */
    severities: [
      { key: "mild",   name: "Mild",   minutes: 60, interval: "1 hour" },
      { key: "harsh",  name: "Harsh",  minutes: 10, interval: "10 minutes" },
      { key: "lethal", name: "Lethal", minutes: 1,  interval: "1 minute" }
    ],

    /* the four exposure types and their per-type riders */
    types: [
      { key: "cold", name: "Cold", severityDriven: true,
        rider: "At Lethal severity, a failed save ALSO deals 1d6 Cold.",
        lethalDamage: { dice: "1d6", type: "Cold" } },
      { key: "heat", name: "Heat", severityDriven: true,
        rider: "At Lethal severity, a failed save ALSO deals 1d6 Fire.",
        lethalDamage: { dice: "1d6", type: "Fire" } },
      { key: "thinair", name: "Thin Air", severityDriven: true,
        rider: "Fatigue from thin air does NOT come off during a Long Rest taken at the same altitude. This restricts LONG RESTS ONLY; abilities that clear Fatigue are unaffected." },
      { key: "deprivation", name: "Deprivation", severityDriven: false,
        rider: "Ignores the severity table entirely. Runs one save per day at Mild once a threshold is crossed. Each of the three thresholds runs its own independent clock and stacks its own Fatigue." }
    ],

    /* Deprivation's three independent day-scale clocks. Each is its own
       exposure instance in every sense: its own days, its own escalating DC,
       and its own accumulated Fatigue. */
    deprivation: {
      intervalMinutes: 1440,           // one save per day, at Mild
      severity: "mild",
      tracks: [
        { key: "water", name: "Thirst",       thresholdDays: 1, unit: "day",  crossed: "1 day without water" },
        { key: "food",  name: "Hunger",       thresholdDays: 3, unit: "day",  crossed: "3 days without food" },
        { key: "sleep", name: "Sleeplessness", thresholdDays: 3, unit: "night", crossed: "3 nights without sleep" }
      ]
    }
  },

  /* The chapter closes on a GM Guidance box, and it is the rule that decides whether any
     of the above is rolled at all. Carried here because `intro` describes what exposure
     DOES and this says when to use it; the two are not interchangeable. Same `gmGuidance`
     convention as kits.js and resolution.js. */
  gmGuidance: "Exposure is a pacing tool, not a damage source. Roll it when the clock matters: a crew waiting out a patrol in a freezer, a job that runs long above the cloud line, a shuttle with a slow leak. If nobody is making a decision about the environment, do not roll for it. The point is to make the room a problem, not to tax the crew for existing in weather.",

  /* ---- 3.2 Vacuum -------------------------------------------------------
     Mirrors the existing Drowning condition exactly. The two share ONE spec so
     they cannot drift: EN.hazards.breath below is the single source, and both
     the Drowning condition rider and the Vacuum condition rider are built from
     it. If Drowning changes, change it here and Vacuum changes with it. */
  breath: {
    holdRule: "rounds equal to your Body score",
    holdFrom: "BOD",                  // the attribute SCORE that sets the held-breath rounds
    timing: "the start of each of your turns",
    dc: 10,
    step: 2,                          // +2 each round
    woundsOnFail: 1,
    unconsciousAtOrBelowHalfWounds: true,
    deathAtZeroWounds: true,
    // The two things that instantiate the spec. Everything mechanical is above;
    // only the fiction and the per-kind riders differ.
    kinds: [
      { key: "drowning", condition: "Drowning", name: "Drowning",
        ends: "Regain access to breathable air or an equivalent life support source.",
        riders: [] },
      { key: "vacuum", condition: "Vacuum", name: "Vacuum",
        ends: "Regain pressure and breathable air, or seal into a suit that holds vacuum.",
        riders: [
          "Every round regardless of the save: 1d6 Cold to exposed skin.",
          "You cannot speak.",
          "Nothing requiring air functions."
        ],
        everyRoundDamage: { dice: "1d6", type: "Cold" } }
    ],
    /* Vacuum sealing is NOT the Sealed trait. A suit holds vacuum only if its
       own entry says so. Exactly two paths exist, and a generic Sealed flag
       satisfies neither. */
    vacuumSeal: {
      rule: "A suit holds vacuum only if its own entry says so. The Sealed trait alone does NOT hold vacuum.",
      paths: [
        { name: "Warframe Shell", how: "Natively. Its own entry states that its seals hold against vacuum.", dataFlag: "vacuum on the armor row" },
        { name: "Rebreather Liner", how: "Fitted to a suit that is ALREADY Sealed, which upgrades that seal to hold vacuum. Fitted to an unsealed suit it only grants the Sealed benefit, which does not cover vacuum.", dataFlag: "sealToVacuum on the armor mod" }
      ]
    }
  },

  /* ---- 3.3 Caustic Environments ----------------------------------------- */
  caustic: {
    intro: "Caustic air and caustic sludge do not wait for you to fail a save. They burn while you stand in them, and they keep burning after you leave.",
    inside:    { dice: "1d6", type: "Acid", when: "at the end of each turn spent in it" },
    lingering: { dice: "1d6", type: "Acid", when: "at the end of each of your turns after you leave, until washed off" },
    wash: "Washing off costs an Action and requires something to wash with.",
    gearDegradation: {
      text: "After a full scene of exposure, unsealed armor loses 1 DR until repaired during Downtime, minimum 0.",
      drLost: 1,
      minimum: 0,
      repairedBy: "Downtime",
      // "Unsealed" means the worn suit does not carry the Sealed trait (and has
      // not been given one by a Rebreather Liner). A sealed suit takes nothing.
      appliesTo: "unsealed worn armor"
    }
  },

  /* ---- 3.4 Mitigations already in the data ------------------------------
     No new content. Each row names something that already exists elsewhere in
     EN, and `source` says where the engine goes to find it. The engine resolves
     each of these into a live effect on the hazard; nothing here is decorative.

     effects (the vocabulary the engine reads):
       noFatigue: [exposure type keys]     failure costs no Fatigue
       edgeOn:    [exposure/track keys]    Body Save rolls with Edge
       graceDays: {trackKey: extraDays}    deprivation threshold pushed back
       blocksCaustic / noCausticLinger / immuneCaustic
       thinAirMinutes: n                   n minutes before the clock starts
       breathMinutes: n                    held breath measured in minutes  */
  mitigations: [
    { key: "thermal-weave", name: "Thermal Regulation Weave", kind: "Armor Mod",
      source: { type: "armorMod", key: "thermal-regulation-weave" },
      summary: "No Fatigue from Exposure to the chosen Fire or Cold.",
      note: "The element is chosen at install. The suit records which one, so a weave tuned to Fire does nothing against Cold.",
      effects: { noFatigueChosen: { fire: "heat", cold: "cold" } } },

    { key: "hazmat", name: "Hazmat Suit", kind: "Gear",
      source: { type: "gear", name: "Hazmat Suit" },
      summary: "Blocks caustic air while intact.",
      note: "Its own entry: take damage that can tear or slice it and the seal fails until the suit is repaired and resealed. The sheet carries an INTACT toggle for exactly that.",
      effects: { blocksCaustic: true } },

    { key: "rebreather", name: "Rebreather", kind: "Gear",
      source: { type: "gear", name: "Rebreather" },
      summary: "1 hour of thin air.",
      note: "Its own entry gives up to 1 hour of active use, refreshing between scenes. Sixty minutes of a thin-air exposure pass with no save at all; the clock starts when the hour runs out. It does not cover vacuum.",
      effects: { thinAirMinutes: 60 } },

    { key: "radiation-callouses", name: "Radiation Callouses", kind: "FreeBorn Trait",
      source: { type: "lineageFeature", name: "Radiation Callouses" },
      summary: "Never gains Fatigue from cold.",
      note: "A failed Cold save still deals the Lethal rider's 1d6 Cold; only the Fatigue is refused.",
      effects: { noFatigue: ["cold"] } },

    { key: "ration-discipline", name: "Ration Discipline", kind: "FreeBorn Trait",
      source: { type: "lineageFeature", name: "Ration Discipline" },
      summary: "3 days against hunger and sleeplessness, then Edge on saves. Thirst and thin air get Edge ONLY, NOT the 3 day grace.",
      effects: { graceDays: { food: 3, sleep: 3 }, edgeOn: ["food", "sleep", "water", "thinair"] } },

    { key: "void-lung", name: "Void Lung", kind: "FreeBorn Trait",
      source: { type: "lineageFeature", name: "Void Lung" },
      summary: "15 minutes of held breath. The largest single vacuum mitigation in the game.",
      note: "Fifteen minutes outlasts any scene, so the save clock never starts on a Vacuum or Drowning exposure inside one. The app deliberately does not convert minutes into rounds: no rule anywhere in EN states how long a round is, and inventing one to divide by would be inventing a rule.",
      effects: { breathMinutes: 15 } },

    { key: "hearthglow", name: "Hearthglow", kind: "Cinder-Heart Feature",
      source: { type: "lineageFeature", name: "Hearthglow" },
      summary: "No Fatigue from cold, self and allies within 2 spaces.",
      note: "The sheet is one character, so it applies the self half. The 2 space aura is the GM's to run at the table.",
      effects: { noFatigue: ["cold"] } },

    { key: "hazard-seal", name: "Hazard Seal", kind: "Durabody Trait",
      source: { type: "lineageFeature", name: "Hazard Seal" },
      summary: "Immune to caustic damage.",
      note: "Immunity to the Acid, so both the damage inside and the lingering damage after exit are zero, and there is nothing to wash off.",
      effects: { immuneCaustic: true } },

    { key: "frictionless-stasis", name: "Frictionless Stasis", kind: "Harbinger Trait",
      source: { type: "lineageFeature", name: "Frictionless Stasis" },
      summary: "Stops the residue, not the acid: no lingering damage after exit.",
      note: "The 1d6 Acid while you stand in it is untouched. Nothing clings, so there is nothing to wash off either.",
      effects: { noCausticLinger: true } }
  ]
};

/* ---- one derived helper the rules own, so the two breath conditions cannot
   drift: the sentence every surface prints for Drowning and for Vacuum is
   generated from the single spec above rather than typed twice. ---------- */
EN.hazards.breathNote = function (kindKey) {
  var b = EN.hazards.breath;
  var k = (b.kinds || []).filter(function (x) { return x.key === kindKey; })[0];
  if (!k) return "";
  var s = k.name + ": breath held " + b.holdRule + ", then Body Save DC " + b.dc
        + " (+" + b.step + "/round) at " + b.timing + " or take " + b.woundsOnFail
        + " Wound; at ≤half Wounds also fall Unconscious; Wounds at 0 while exposed is death";
  if (k.everyRoundDamage) s += ". Every round regardless of the save: " + k.everyRoundDamage.dice + " " + k.everyRoundDamage.type;
  return s;
};

/* index the severity + type tables by key (built once at load) */
EN.hazards.severityByKey = {};
EN.hazards.exposure.severities.forEach(function (s) { EN.hazards.severityByKey[s.key] = s; });
EN.hazards.typeByKey = {};
EN.hazards.exposure.types.forEach(function (t) { EN.hazards.typeByKey[t.key] = t; });
EN.hazards.mitigationByKey = {};
EN.hazards.mitigations.forEach(function (m) { EN.hazards.mitigationByKey[m.key] = m; });
