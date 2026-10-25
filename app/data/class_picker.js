window.EN = window.EN || {};

/* Classes of Elysium: the copy layer for the class picker.
   The book carries three distinct layers per class. Choosing (this file: the intro
   paragraphs and the DESCRIPTION cell of the Classes of Elysium table, written for a
   player who has not decided yet), Arriving (the chapter epigraph, on
   EN.classes[key].tagline), and Playing (the Playbook, on EN.classes[key].extra.playbook).
   Transcribed from the Player's Handbook, Create / Your Freelancer / Classes, "Classes of
   Elysium". The table's other columns (Resilience Die, Saving Throw Focus, Weapons, Armor)
   are read off the class data itself, not copied here. The older "Play a X if" lines and the
   per-subclass blurbs are gone: the Handbook no longer prints them, and a subclass card now
   shows the subclass's own description. `subs` survives only for a non-copy field, the Shaper
   subclasses' flowAttribute. */
EN.classPicker = {
  intro: [
    "Your Species and Lineage say who you are. Your Class says what you do when the shooting starts, and what people pay you for. Everyone in Elysium has an angle. This is yours: the thing you're better at than the person trying to kill you.",
    "Seven classes work the city. Each comes with two subclasses, chosen at level 1, that decide how you do the job."
  ],
  classes: {
    codebreaker: {
      blurb: "Apex predators of the #GRID. They breach Nodes, spoof countermeasures and turn the network on an enemy before the first shot is fired. The #GRID Weaver, The Burner."
    },
    fury: {
      blurb: "A living battering ram running on adrenaline, chrome or rage. They burn Overdrive to shatter cover, scatter formations and soak the hits meant for the crew. The Juggernaut, The Reaver."
    },
    hustler: {
      blurb: "Social engineers who treat a conversation and a firefight as the same game. They find the leverage, talk an ally up and air an enemy's dirty laundry at volume. The Suit, The Grifter."
    },
    operator: {
      blurb: "The disciplined core of a crew. They lock down sightlines, call the fight and break formations with trained precision. The Vanguard, The Deadeye."
    },
    scoundrel: {
      blurb: "Opportunists who fight dirty and stay half a step ahead. When a target leaves an opening, a Scoundrel lands the cheap shot and is gone. The Smuggler, The Wildcard."
    },
    shaper: {
      blurb: "Conduits for the Flow. They tune their bodies to the current and weave it into Invocations that bend gravity, heat and space. The Harmonist (Mystique), The Sourcerer (Tech).",
      subs: {
        harmonist: { flowAttribute: "Mystique" },
        kensei: { flowAttribute: "Body" },
        icon: { flowAttribute: "Presence" },
        sourcerer: { flowAttribute: "Tech" }
      }
    },
    stitcher: {
      blurb: "Combat medics and field chemists. They synthesize compounds mid-firefight, pull the dying back and refuse to lose anyone on their watch. The Lifeline, The Toxicologist."
    }
  }
};
