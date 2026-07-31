window.EN = window.EN || {};

/* Classes of Elysium: the copy layer for the class and subclass pickers.
   The book carries three distinct layers per class. Choosing (this file: the
   overview blurb and the Play-if line, written for a player who has not decided
   yet), Arriving (the chapter epigraph, on EN.classes[key].tagline), and Playing
   (the Playbook, on EN.classes[key].extra.playbook). These Play-if lines are the
   only text in Part 1 written for the moment of the decision itself, so they are
   what a collapsed picker card shows. Verbatim from Part 1. */
EN.classPicker = {
  intro: [
    "Your Species and Lineage say who you are. Your Class says what you do when the shooting starts, and what people pay you for. Everyone in Elysium has an angle. This is yours: the thing you are better at than the person trying to kill you.",
    "Whether you hack the digital infrastructure, channel the metaphysical current, or dominate the physical battlefield, your class provides the tools you need to shift the odds in your favor."
  ],
  classes: {
    codebreaker: {
      blurb: "Codebreakers are the apex predators of the #GRID. While others simply interact with technology, Codebreakers dismantle it. Armed with specialized Smartdecks and a custom Repertoire of Ciphers, they manipulate the digital infrastructure of Elysium. A Codebreaker can breach secure nodes, spoof countermeasures, and weaponize the network against an enemy before a single shot is fired in the physical world.",
      playIf: "Play a Codebreaker if: You want to control the battlefield through screens, dismantle security systems, and outsmart the digital defenses of the city.",
      subs: {
        rigger: { blurb: "A master of hardware and mechanical coordination. Riggers build, maintain, and command customized drones and combat vehicles.", playIf: "Play a Rigger if: You want to command a swarm of mechanical allies, dominate the action economy, and bring heavy autonomous backup to a firefight." },
        gridweaver: { blurb: "A specialist in pure network control and matrix manipulation. They dive deeper into the digital infrastructure than anyone else, reshaping virtual space.", playIf: "Play a #GRID Weaver if: You want to be the ultimate digital operative, altering camera feeds, opening secured paths, and bending the network to your will." },
        burner: { blurb: "An aggressive offensive hacker who focuses on destroying hardware and frying circuits rather than quietly stealing data.", playIf: "Play a Burner if: You want to turn enemy cyberware into an explosive liability and deal massive damage through aggressive digital attacks." }
      }
    },
    fury: {
      blurb: "Furies do not rely on subtle tactics or smooth talk; they rely on sheer, unstoppable momentum. Fueled by adrenaline, heavy cybernetics, or untamed rage, they tap into a specialized resource called Overdrive to push past their bodily limits. A Fury is a living battering ram built to dictate the physical space of a battlefield, capable of shattering cover, scattering an enemy formation, and soaking up damage to protect their crew.",
      playIf: "Play a Fury if: You want to be the unyielding tip of the spear, absorbing punishment and dominating the physical space of every encounter.",
      subs: {
        juggernaut: { blurb: "A defensive powerhouse heavily invested in armor, damage mitigation, and structural resilience.", playIf: "Play a Juggernaut if: You want to be an immovable object that controls choke points and shields your allies from lethal harm." },
        reaver: { blurb: "A visceral, aggressive combatant who thrives in the chaos of close quarters combat, turning their own pain into offensive momentum.", playIf: "Play a Reaver if: You want to dive into the center of a fight, using raw, brutal power to tear through an enemy frontline." },
        arsenal: { blurb: "A heavy weapons specialist who treats suppressive fire as an art form, carrying the biggest mundane weaponry the streets have to offer.", playIf: "Play an Arsenal if: You want to lock down zones with overwhelming firepower and make sure nothing survives in your line of sight." }
      }
    },
    hustler: {
      blurb: "Hustlers are the social engineers and tactical manipulators of the streets. They treat conversations and combat as the exact same game, reading the room to find the perfect leverage. Armed with weaponized charisma, a Hustler can turn the tide of a fight by buffing an ally with high stakes pitches, or cripple an enemy by loudly broadcasting their structural flaws and dirty laundry.",
      playIf: "Play a Hustler if: You want to weaponize your charisma, control the narrative, and dictate the flow of an encounter without necessarily pulling a trigger.",
      subs: {
        the_suit: { blurb: "A corporate or high society infiltrator who uses authority, forged credentials, and immaculate style to open doors that bullets cannot.", playIf: "Play a Suit if: You want to command respect, manipulate Elysium's elite, and work the boardroom as easily as the back alleys." },
        the_grifter: { blurb: "A street level con artist who relies on misdirection, sleight of hand, and quick talking to exploit any target they meet.", playIf: "Play a Grifter if: You want to talk your way out of any corner, play factions against each other, and always have a trick up your sleeve." },
        the_fixer: { blurb: "A logistical mastermind who makes sure their crew always has the right gear, the best intel, and the perfect opening.", playIf: "Play a Fixer if: You want to be the vital support spine of the team, granting powerful buffs to an ally and securing the resources needed to survive." }
      }
    },
    operator: {
      blurb: "Operators are the disciplined core of any successful crew. They are battlefield commanders and tactical specialists who thrive in the chaos of a firefight. Relying on strict training and fluid engagement, an Operator controls the flow of combat. They excel at locking down sightlines, providing overwatch, and breaking enemy formations with overwhelming precision.",
      playIf: "Play an Operator if: You want to play a highly trained tactical specialist who relies on sharp positioning, discipline, and absolute weapon mastery.",
      subs: {
        the_vanguard: { blurb: "A frontline tactician who specializes in breach and clear maneuvers, leading the charge into hostile territory.", playIf: "Play a Vanguard if: You want to set the pace of the engagement, coordinating your allies in tight quarters and maintaining aggressive momentum." },
        the_deadeye: { blurb: "A sniper and long range specialist who controls the battlefield through threat of immediate, lethal precision.", playIf: "Play a Deadeye if: You want to eliminate a high value target from a mile away with absolute certainty and provide unmatched overwatch." },
        the_headhunter: { blurb: "A single target elimination expert, tracking bounties and isolating specific threats amid the chaos of a wider skirmish.", playIf: "Play a Headhunter if: You want to lock onto a specific enemy, exploit their weaknesses, and make sure they do not leave the battlefield alive." }
      }
    },
    scoundrel: {
      blurb: "Scoundrels survive by fighting dirty and staying one step ahead. They are the opportunists of Elysium, relying on street smarts, moxie, and uncanny evasion to stay half a step ahead of whatever is trying to kill them. When a target leaves an opening, a Scoundrel exploits it with a devastating cheap shot, dropping threats quickly before slipping back into the shadows to plan their next move.",
      playIf: "Play a Scoundrel if: You want to strike from the shadows, exploit weaknesses, and always have a quick exit strategy when things go wrong.",
      subs: {
        smuggler: { blurb: "An expert in evasive movement, driving, and getting illicit goods in and out of secured locations.", playIf: "Play a Smuggler if: You want to bypass security, move freely across the map, and make sure the payload always gets delivered." },
        wildcard: { blurb: "A gambler who treats every roll as a bet worth doubling down on, pushing the odds long after the smart money folds.", playIf: "Play a Wildcard if: You want to wager everything on the rolls that matter, hand your luck to an ally who needs it more, and go all in exactly when the math says you shouldn't." },
        shiv: { blurb: "A dirty, close-quarters brawler who does not need to be stronger or faster, just needs a target blind, off balance, and unable to run.", playIf: "Play a Shiv if: You want to fight in the gutter, stack debilitating conditions on anything you get your hands on, and make sure nothing you corner gets back up clean." }
      }
    },
    shaper: {
      blurb: "Shapers do not use weapons to change the world; they use their own resonance. As conduits for the metaphysical current known as the Flow, they tune their bodies to manipulate reality itself. A Shaper weaves raw energy into powerful Invocations, allowing them to bend kinetic gravity, thermal energy, and spatial dimensions to their will.",
      playIf: "Play a Shaper if: You want to tune into the metaphysical current, bend the laws of physics, and unleash devastating Flow effects.",
      subs: {
        harmonist: { blurb: "The purest practitioner of Flow channeling, focusing on mastering elemental and metaphysical balance.", playIf: "Play a Harmonist if: You want to be the ultimate adept, pushing the boundaries of raw resonance and mastering multiple Base Resonances.", flowAttribute: "Mystique" },
        kensei: { blurb: "A martial artist who infuses their physical strikes and weaponry with kinetic and spatial energy.", playIf: "Play a Kensei if: You want to fight on the frontline, using the Flow to enhance your physical attributes and deliver devastating melee Invocations.", flowAttribute: "Body" },
        icon: { blurb: "A radiant conduit who shapes reality through sheer force of personality, inspiring those around them.", playIf: "Play an Icon if: You want to lead by example, using the Flow to steady an ally's nerve and command the attention of a room.", flowAttribute: "Charm" },
        sourcerer: { blurb: "A techno-mage who bridges the gap between digital code and metaphysical current, hacking the Flow itself.", playIf: "Play a Sourcerer if: You want to blend arcane theory with digital infrastructure, creating bizarre and powerful synergies between magic and machines.", flowAttribute: "Tech" }
      }
    },
    stitcher: {
      blurb: "Stitchers are the combat medics and brilliant field chemists keeping the underworld alive. Armed with proprietary Triage Rigs, they synthesize potent compounds in the middle of a firefight. Whether they are stabilizing a dying ally, purging toxins, or providing preventative care through chemical enhancements, a Stitcher absolutely refuses to let anyone die on their watch.",
      playIf: "Play a Stitcher if: You want to hold the line against death itself, buffing your team and punishing threats with chemical warfare.",
      subs: {
        the_lifeline: { blurb: "A dedicated combat medic focused purely on stabilization, cellular repair, and keeping the crew in the fight.", playIf: "Play a Lifeline if: You want to be the ultimate safety net, so no ally falls on your watch no matter how bad the firefight gets." },
        the_toxicologist: { blurb: "A master of venoms, acids, and entropic decay, weaponizing biology against their foes.", playIf: "Play a Toxicologist if: You want to melt armor, apply debilitating debuffs, and watch an enemy slowly succumb to your custom compounds." },
        the_ripper: { blurb: "A cybernetics expert and aggressive chemist who pushes organic bodies past safe limits with dangerous combat stims.", playIf: "Play a Ripper if: You want to juice your crew with potent enhancements and perform aggressive, makeshift modifications in the field." }
      }
    }
  }
};
