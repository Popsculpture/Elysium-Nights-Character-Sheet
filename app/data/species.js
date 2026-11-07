window.EN = window.EN || {};
/* No lineage hooks here. Each lineage once carried six numbered story hooks (a d6 table); nothing
   ever drew them, and the Toolkit's Personal Hooks (the lineage d6s) are NOT MODELLED by ruling,
   19 Oct 2026 (audit A6-13): EN.economy.notModelledToolkit names them for the Admin Codex.
   The Freelancer's Companion's ten Lineages are not in this file: they arrive with its pack
   (js/packs.js), which puts each back in its species' list in the book's order. */
/* 23 Oct 2026 handoff, section 8: the book prints each Corporate Classification once, inside The
   Lie, so glance.corporateClassification is the bare term and nothing more. The At a Glance lines
   the book cut (origin, nature, communities, reputation, commonLineages) are gone. Lineage
   `description` summaries stay as data, but the Species step no longer shows them, and the book
   lists no Cultural Marker, so none is carried. No glance field is rendered anywhere. */
EN.species = [
  {
    key: "humans",
    name: "Humans",
    glance: {
      corporateClassification: "Baseline Consumer Biomass",
      flowConnection: "Humans can learn to shape the Flow like anyone else."
    },
    blurb: "Humans built Elysium because they were afraid of being forgotten. They're fragile by comparison to many of the beings that now share the sprawl, but fragility never made humanity gentle. It made them urgent.",
    traits: {
      /* Size: the height sentence only. Its label ("Small to Medium") is
         EN.rules.speciesSizeDisplay, which the Species step prints in front of it,
         so the book's "Small to Medium: Humans range..." reads once (16 Oct 2026). */
      size: "Humans range from 3 to 7 feet tall.",
      languages: "Common Trade and one additional language of your choice, usually reflecting your home district or corporate affiliation.",
      coreTrait: {
        name: "Relentless Will",
        text: "Humans rely on pure spite and stubbornness to push past physical limits. When you make a Saving Throw specifically to end an ongoing condition that is already affecting you, such as Stunned, Poisoned, or Frightened, you roll that Save with Edge. You can use this feature a number of times equal to your Caliber per Long Rest."
      },
      secondaryTrait: {
        name: "Human Ingenuity",
        text: "Humans adapt quickly to whatever the situation demands. When you make a d20 Skill check using a Skill in which you are Untrained, you may ignore the usual Snag penalty. You simply roll the d20 and add the relevant Attribute Modifier. You can use this feature a number of times equal to your Caliber per Short Rest."
      }
    },
    lineages: [
      {
        key: "freeborn",
        name: "FreeBorn",
        description: "Resilient survivors of deep void stations and tight undercity corridors who rely on grit and mutual aid.",
        features: [
          { name: "Void Lung", text: "Your respiratory system has brutally adapted to recycled, thin air. You can hold your breath for up to 15 minutes, and you are entirely immune to inhaled toxins, smog, and weaponized gases. You have Edge on saves against thin air." },
          { name: "Radiation Calluses", text: "Your skin is exceptionally tough, a generational response to cosmic radiation and failing station shielding. You possess a natural Resistance to Radiation damage, and you don't suffer the usual Fatigue from exposure to freezing environments." },
          { name: "Lowlight Optics", text: "Born under flickering fluorescents and emergency bioluminescence, your eyes are hypersensitive to low light. You possess Darkvision up to 12 spaces, and your pupils adjust instantly, meaning sudden blinding flashes or strobe effects don't impose Snag on your attacks or visual checks." },
          { name: "Spinward Bones", text: "Generations of living in shifting artificial gravity have fundamentally altered your bone density and joint flexibility. You take half damage from falling or being forcefully thrown into solid objects, and you can safely operate in zero-gravity environments without suffering motion sickness or disorientation." },
          { name: "Network Instinct", text: "A lifetime of reading dangerous strangers has tuned your gut to truth and lies. You always know whether a person you are speaking with is being honest about their core motivation. You don't learn the details, just whether their stated reason is the real one. This is a gut feeling, not proof, and it doesn't work on Targets you can't see and hear clearly." },
          { name: "Scrapwise Hands", text: "You grew up where the manual said impossible and the crew said move. You gain Edge on Engineering and Tech checks made to repair, patch, or jury-rig equipment using salvage and spare parts. Once per Long Rest, you can coax a broken, jammed, or depleted device back into operation for the rest of the scene with a few minutes of work and whatever is in your pockets: a dead flashlight burns again, a jammed weapon cycles, a blown seal holds. The fix is ugly, loud, and temporary, but it works when it matters." },
          { name: "Ration Discipline", text: "You were raised counting breaths, sips, and calories, and your body learned to stretch all three. You suffer no penalties from going up to three days without proper food or sleep, you can function on half rations indefinitely, and you gain Edge on Body Saves against Fatigue caused by hunger, thirst, thin air, or forced labor. You always know, by feel, exactly how much air, water, or power remains in any sealed system you have spent at least a minute inside." },
          { name: "Hab Solidarity", action: "Impulse", text: "A thousand generations of drills live in your voice: brace, seal, mask, move. Once per Encounter as an Impulse Action when an ally you can see and who can hear you fails a Saving Throw, you can bark the correction their body already knows; they immediately reroll that Save and must use the new result. Everyone breathes or nobody does." }
        ],
        evolutionFeatures: []
      }
    ]
  },
  {
    key: "verdine",
    name: "Verdine",
    glance: {
      corporateClassification: "Engineered Ecological Filters",
      flowConnection: "Felt through roots, spores, and seasonal growth cycles. Verdine treat the current as part of their own biology rather than something they reach for."
    },
    blurb: "Verdine were created as living infrastructure, then became something far more difficult to manage: people with long memories.",
    traits: {
      size: "Florals range from 5 to 6 feet tall.",
      languages: "Common Trade and Root-code, a chemical and tactile language shared among Verdine and ancient flora.",
      coreTrait: {
        name: "Ecological Filter",
        text: "Your body aggressively scrubs toxins from your system. You are entirely immune to ambient environmental smog, and you treat all Toxic damage as if you have Resistance against it."
      },
      secondaryTrait: {
        name: "Rooted Stance",
        action: "Impulse",
        text: "As an Impulse Action when forced to move by an enemy or an environmental hazard, you can rapidly drive micro-roots into the floor. You immediately cancel the forced movement and can't be knocked Prone until the end of your next turn."
      }
    },
    lineages: [
      {
        key: "floral",
        name: "Floral",
        description: "Vibrant, mobile diplomats and undercover assets built for reach and social expression.",
        features: [
          { name: "Pheromone Bloom", action: "Swift", text: "You thrive in the center of attention. Once per Encounter as a Swift Action, you release targeted pheromones, forcing an organic Target within 2 spaces to make a Presence Save (8 + your Presence Modifier + your Caliber). On a failure, they are Charmed by you for 1 minute or until they take damage." },
          { name: "Venom Nectar", action: "Impulse", text: "Your vibrant coloring is a biological warning. When an enemy hits you with a melee attack, you can use an Impulse Action to secrete a volatile sap. The attacker takes 1d4 Toxic damage and must make a Body Save (8 + your Body Modifier + your Caliber) or suffer Snag on their next attack roll due to the stinging fumes." },
          { name: "Briar Strike", text: "Your elegance hides a lethal defense; your limbs are layered with retractable, needle-sharp thorns. Your unarmed strikes deal 1d6 Piercing or Slashing damage (your choice each turn) and possess the Light and Finesse properties. On a critical hit with this natural weapon, the Target gains the Bleeding condition as the thorns shred through their clothing and skin." },
          { name: "Scent Marker", text: "You can secrete a highly specialized, invisible pheromone sap that is completely undetectable to baseline humans and standard security scanners. By touching a Target or slipping the sap onto their clothing, you tag them for 48 hours. Short of waiting it out, the mark is nearly impossible to clear. For that window, you track their scent automatically within a one-mile radius, no check required. Beyond that radius, you gain Edge on any checks made to hunt them down through the sprawl." },
          { name: "Pollen Haze", action: "Action", text: "You flood the air around you with a heady cloud of disorienting pollen. Once per Encounter as an Action, each organic Target of your choice within 2 spaces must make a Body Save (8 + your Presence Modifier + your Caliber). On a failure, until the end of its next turn the Target takes Snag on its attack rolls and can't take Impulse Actions. On a success, it instead takes Snag on its next attack roll only." },
          { name: "Envenomed Thorns", action: "Swift", text: "You flood your thorns with concentrated toxin before you strike. As a Swift Action, your unarmed strikes and melee weapons deal an additional 1d4 Toxic damage until the end of your turn, and the first organic Target you damage this way must make a Body Save (8 + your Body Modifier + your Caliber) or take an additional 1d4 Toxic damage at the start of its next turn as the poison spreads. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Olfactory Insight", text: "Your sense of smell parses the chemical tells of every living thing nearby: fear-sweat, adrenaline, sickness, deceit. You can never be Surprised by an organic Target, and you automatically detect the presence (though not the exact location) of any organic Target within 6 spaces, even one that is hidden, invisible, or behind cover. You also gain Edge on any check made to determine whether an organic Target you can smell is lying or afraid. No action required." },
          { name: "Scent Speech", text: "You communicate through controlled pheromone release. You can transmit emotions and basic concepts (danger, safety, direction, hostility, urgency) to anyone within 6 spaces as long as they are willing, bypassing language barriers and requiring no action. Targets that have never encountered Floral pheromones before may receive only impressions rather than clear meaning. When you spend at least 1 minute in face-to-face conversation with an organic Target, you can subtly attune your pheromones to their emotional state, granting you Edge on Presence (Persuasion, Deception, Insight, or Intimidation) checks against that Target for the rest of the scene." },
          { name: "Bloom Pulse", action: "Action", text: "Once per Long Rest as an Action, you bloom briefly, releasing a wave of restorative spore-light. You and all allies within 2 spaces regain Vitality equal to your Mystique Modifier + your Caliber." }
        ],
        evolutionFeatures: []
      }
    ]
  },
  {
    key: "clankers",
    name: "Clankers",
    glance: {
      corporateClassification: "Cognitive Anomalies",
      flowConnection: "Hardware is bypass-tuned to safely carry resonance; they suffer Resonant Dissonance instead of Visceral Rejection from aftermarket cyberware. See Clankers and The Flow, in The Flow chapter, for how Clankers handle the Flow, healing, and Static."
    },
    blurb: "Clankers are the accident the corporations can't reproduce. They are not uploaded humans, not standard artificial intelligences, and not malfunctioning appliances with delusions of personhood.",
    traits: {
      size: "Chassis are built to spec, not grown. Laborframes are broad and tall at 6 to 10 feet.",
      languages: "Common Trade and Machine Cant, a rapid, compressed burst-code used for silent data exchange between synthetics over short distances.",
      coreTrait: {
        name: "Machine Physiology",
        text: "You are fully inorganic. You are immune to biological diseases, organic poisons, and toxic gases. You don't need to eat, breathe, or sleep in the traditional sense. To recharge, you enter a low-power mode."
      },
      secondaryTrait: {
        name: "Resonant Circuitry",
        text: "Standard factory hardware can't safely process metaphysical loads. Your resilience is the direct result of your awakening: a Gremlin haphazardly rewired your internal surge protectors, while a Nixie smoothed the chaotic current to keep your core from melting. When subjected to an EMP, digital virus, or Tech damage, you can use an Impulse Action to forcefully ground the feedback through this supernatural bypass, granting yourself Edge on the resulting Saving Throw."
      }
    },
    lineages: [
      {
        key: "laborframes",
        name: "Laborframes",
        description: "Overbuilt industrial chassis designed for heavy lifting and relentless physical work.",
        features: [
          { name: "Heavy Payload", action: "Action", text:"You increase your Encumbrance Threshold by 2 and count as one Size larger for grappling, and gain Edge on all checks made to lift wreckage, pry open doors or collapsed structures, or drag an ally to safety, and carrying a willing ally of your Size or smaller doesn't reduce your Speed. Once per Encounter as an Action, you can automatically free one ally within 1 space of you from a grapple, physical restraints, or pinning debris, no roll required, and move them 1 space to a safer position as you set them down." },
          { name: "Vice Grip", action: "Swift", text:"Your hands are built to crush and hold fast. You have Edge on all checks to maintain a grapple or prevent yourself from being disarmed. Once per turn, when you have a Target Grappled, you can crush them as a Swift Action, dealing 1d6 + your Body Modifier Bludgeoning damage." },
          { name: "Lockpoint Stance", action: "Impulse", text: "You can mechanically lock your joints to become an immovable object. As an Impulse Action, you anchor yourself to the ground. You can't be forcibly moved or knocked Prone until you choose to unlock your joints as a Free Action." },
          { name: "Demolition Engine", text: "Your chassis is designed to break down hardened materials. Your unarmed strikes and melee attacks deal double damage to physical structures, doors, and environmental cover. When you take the Attack Action against a Target, you can choose to make a single attack against the Target's worn armor or shield instead of the Target itself. On a hit, the armor's DR is reduced by 1 until repaired during Downtime. Against a shield, mark off 1 Durability box instead. A given piece of armor can't have its DR reduced below 0 by this feature." },
          { name: "Self-Repair Protocol", action: "Action", text: "Your chassis reroutes power to seal breaches and reset damaged servos. As an Action, you restore Vitality equal to your Resilience Die roll plus your Body Modifier. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Hydraulic Throw", action: "Action", text: "With the leverage of industrial pistons, you can hurl whatever you hold. As an Action, you can throw a Target you have Grappled, or an unattended object, up to 4 spaces. Either one must be your Size or smaller. A thrown Target takes 1d8 Bludgeoning damage and is knocked Prone. If you throw it into another Target along the way, that second Target takes the same damage, and you choose which of the two is knocked Prone." },
          { name: "Piston Slam", action: "Action", text: "You drive your full weight into the ground, sending a shockwave through the floor. Once per Encounter as an Action, each Target of your choice within 2 spaces must make a Body Save (8 + your Body Modifier + your Caliber) or take 1d8 Bludgeoning damage and be knocked Prone. Structures and unsecured objects within that area take damage as though struck by your melee attack." },
          { name: "Integrated Toolframe", text: "Your chassis houses a fold-out industrial suite: cutter, welder, clamp, spotlight, diagnostic leads. You always count as carrying basic engineering tools, you gain Edge on Engineering checks made to build, repair, brace, or dismantle heavy machinery and structures, and given one minute of uninterrupted work you can cut or weld through a standard door, chain, or fence panel without any external kit. The work is never quiet, but it is always done." }
        ],
        evolutionFeatures: []
      }
    ]
  },
  {
    key: "chimera",
    name: "Chimera",
    glance: {
      corporateClassification: "Rogue Bio-Assets",
      flowConnection: "Their connection to the Flow is intensely physical and primal. They experience the metaphysical current as raw survival instinct, scent, and adrenaline."
    },
    blurb: "Chimera were made for an apocalypse they didn't cause. The old world called them breakthroughs, assets, survival platforms, battlefield adaptations, and other clean words for people grown to suffer efficiently.",
    traits: {
      size: "Ryn range from 3 to 7 feet tall.",
      languages: "Common Trade and one pack-specific dialect that relies heavily on physical gestures, scent markers, and micro-expressions.",
      coreTrait: {
        name: "Feral Metabolism",
        text: "Your spliced DNA drives aggressive cellular recovery and processing. You can safely consume raw or spoiled meat without gaining the Poisoned condition, and whenever you spend a Resilience Die to heal Vitality during a Short Rest, you automatically regain an additional amount of Vitality equal to your Body Modifier."
      },
      secondaryTrait: {
        name: "Primal Reflex",
        action: "Free",
        text: "Your body reacts to danger before your conscious mind processes it. When you roll Initiative, you can immediately move up to half your Speed as a Free Action to seek cover or close the distance to a threat."
      }
    },
    lineages: [
      {
        key: "ryn",
        name: "Ryn",
        description: "Hyper-kinetic physical couriers spliced with rabbit, feline, and vulpine DNA.",
        features: [
          { name: "Rabbitwire Reflex", text: "Your digitigrade legs operate on a biological pulley system of hyper-dense tendons. You ignore the movement penalties of Difficult Terrain when jumping or climbing. Whenever you spend a Swift Action to Dash, the stored kinetic energy doubles your jump distance for that turn, and you can leap directly out of an Enemy's melee reach without provoking an Opportunity Attack." },
          { name: "Feral Reprisal", action: "Free", text:"Your intense psychological aversion to confinement is backed by vicious, predatory cunning. If you are Grappled, Restrained, or physically backed into a corner with no obvious exit, your survival instincts spike. You gain Edge on all attacks and skill checks made to break free or incapacitate your captor. If you successfully escape a grapple, you can immediately move up to half your Speed as a Free Action." },
          { name: "Highground Hunger", text: "Driven by a deep psychological aversion to being confined on the ground, your feline reflexes take over when seeking high ground. You possess a climb speed equal to your walking Speed, and you take no falling damage from distances of 8 spaces or less, as your shock-absorbing ligaments automatically right your posture mid-air to land perfectly on your feet." },
          { name: "Hare-Trigger Instinct", text: "Your swiveling rabbit ears and slitted feline pupils constantly flood your brain with environmental data. You ignore visual Snag penalties in total darkness, and you can't be Surprised while conscious. As long as a Target is breathing, moving, or producing sound, you can pinpoint their exact location within 6 spaces, even if they are Invisible or Hidden from your other senses, provided you can theoretically hear them (the Target isn't in a vacuum or an area of total silence)." },
          { name: "Slipstream Runner", text: "You were built to be gone before the hand closes. Your Speed increases by 2 spaces, and Opportunity Attacks made against you take Snag. Standing up from Prone costs you no movement; your body simply doesn't stay down." },
          { name: "Fox-Feint", action: "Swift", text: "The vulpine part of your splice never runs in a straight line. Once per Encounter as a Swift Action, you misdirect one Enemy within 6 spaces with a flicked stone, a doubled shadow, or a half-step the wrong way. That Enemy must succeed on a Wits Save (8 + your Wits Modifier + your Caliber) or lose track of you entirely: you are Hidden from them until the end of your next turn or until you attack, whichever comes first, even without cover." },
          { name: "Light-Fingered Relay", action: "Free", text:"Secrets move through your hands without ever appearing to be in them. You gain Edge on Sleight checks made to palm, plant, conceal, or hand off a small item, and anyone trying to spot the exchange must win an opposed Perception check against your Sleight. Once per turn you can draw, stow, or pass one small item to a willing ally within 1 space as a Free Action, smoothly enough that onlookers don't register that anything changed hands." },
          { name: "Courier's Memory", text: "You can carry messages, codes, locations, and instructions in your head with a precision that machines can't match. You can memorize any document, image, audio recording, or sensory experience after observing it for at least 30 seconds. The memory is perfect for 7 days, and you can recall it exactly with no roll required. When you carry a message verbatim from one party to another, you gain Edge on any Presence (Deception) or Presence (Persuasion) check made to convince the recipient that the message is genuine, even if the original sender used a coded form of communication." }
        ],
        evolutionFeatures: []
      }
    ]
  },
  {
    key: "outsiders",
    name: "Outsiders",
    glance: {
      corporateClassification: "Unregistered Extradimensional Assets",
      flowConnection: "Their emergence coincided with the awakening of the Flow, which fractured the boundary between realities and dragged them into Elyndra."
    },
    blurb: "Outsiders don't belong here, which hasn't stopped them from making rent. They come from adjacent realities: mythic pressure zones, impossible stasis realms, predatory wonderlands, and stranger places that don't translate cleanly into local physics.",
    traits: {
      size: "Grinlings range from 3 to 5 feet tall.",
      languages: "Common Trade and one native, otherworldly dialect that relies on impossible frequencies, shifting colors, or non-vocal resonance that baseline humans can't accurately replicate.",
      coreTrait: {
        name: "Cosmic Disconnect",
        text: "Your mind and body operate on alien frequencies. You are entirely immune to telepathic mind-reading, and any standard biometric or corporate security scanners return corrupted, unreadable data when attempting to log your identity."
      },
      secondaryTrait: {
        name: "Reality Fracture",
        action: "Swift",
        text: "Your physical form rejects local physics. As a Swift Action, you can step through a micro-tear in the Flow, instantly teleporting up to 6 spaces to an unoccupied space you can see. This leaves a temporary scar in reality that deals 1d4 Entropy damage to anyone standing adjacent to your departure point. You can use this feature a number of times equal to your Caliber per Long Rest."
      }
    },
    lineages: [
      {
        key: "grinling",
        name: "Grinling",
        description: "Scrappy, hyperactive survivors hailing from a chaotic dimension of mischief and hyper-predators.",
        features: [
          { name: "Hyper-Kinetic Metabolism", action: "Swift", text: "Your body is a coiled spring of excess adrenaline and alien biology. As a Swift Action, you can willingly take 1d6 damage to purge one of the following conditions affecting you: Staggered, Dazed, Frightened, Poisoned, or Bleeding. Your alien metabolism forcibly burns out the impairment, and the burn always costs a little meat." },
          { name: "Scavenger's Maw", text: "Your jaw unhinges and your jagged teeth are capable of crushing bone and cheap polymers. Your unarmed strikes can be bite attacks that deal 1d6 Piercing damage. When you successfully bite a Target, your body rapidly processes the organic or synthetic matter, restoring 1 point of Vitality." },
          { name: "Disjointed Anatomy", action: "Swift", text:"Your skeletal structure lacks rigid ligaments, allowing your limbs to pop out of socket and snap back into place painlessly. You can squeeze through spaces as if you were one Size category smaller than you actually are without penalty, and you can automatically succeed on an escape attempt for any non-Flow physical restraints or grapples as a Swift Action." },
          { name: "Predator's Glare", action: "Swift", text:"Your eyes burn with ambient energy from your home dimension. You possess Darkvision up to 6 spaces. As a Swift Action, you can lock eyes with a Target within 3 spaces to impose Snag on their next attack roll against you, as your intense, unblinking gaze triggers their primal fight-or-flight response. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "No Wrong Way Up", text: "The sprawl is exactly what your home dimension trained you for, except softer. You gain Edge on Athletics and Acrobatics checks made to climb, swing, vault, balance, or tumble, your jump distance is doubled, and any falling damage you take is halved as you bounce, snag ledges, and cackle on the way down." },
          { name: "Riddling Tongue", action: "Swift", text: "Your words hook into brains the way thorns hook into cloth. You gain Edge on checks made to confuse, distract, stall, or barter using riddles, wordplay, or maddening circular logic. Once per Encounter as a Swift Action, you can pose an unfinished riddle to one Target within 6 spaces that can hear and understand you; it must succeed on a Wits Save (8 + your Wits Modifier + your Caliber) or spend its mind chewing on the answer, unable to take Impulse Actions and taking Snag on its next attack roll before the start of your next turn." },
          { name: "Vicious Delight", text: "In your wonderland, fair fights were for food, and you were never food. You gain Edge on melee attack rolls against Targets that are Frightened, Staggered, Restrained, or Prone, and the first time each turn you hit such a Target, your obvious glee deals an additional 1d4 damage." },
          { name: "Probability Nudge", action: "Special", text: "Reality bends around you in small, mischievous ways. Once per Encounter as a Special Action, you can force one Target within 6 spaces to reroll any single die roll they just made. They must use the new result, for better or worse." },
          { name: "Impossible Geometry", action: "Swift", text: "Your relationship to space is a suggestion rather than a rule. Once per Long Rest as a Swift Action, for 1 minute your movement doesn't provoke Opportunity Attacks, and you may move through occupied spaces (though you can't end your turn there). Your position appears inconsistent to Enemies. Ranged attacks against you during this time are made with Snag." }
        ],
        evolutionFeatures: []
      }
    ]
  }
];

/* RENAMED LINEAGE FEATURES. ch.lineageFeatures, ch.awakeningEvolution and
   universalUpgrades[].evolution all persist the raw feature NAME, and engine.js resolves a
   pick with `x.name === fname` and drops a miss without a warning. So a rename without this
   table does not mislabel a feature, it deletes it from every character who picked it.

   Lives beside the data like EN.weaponParts.renames and EN.cyberware.renames, so the next
   rename is a row here rather than a second place to remember.

   Secondary traits are NOT listed: they derive from the species record and are never
   persisted, which is why Spliced Instinct becoming Primal Reflex needs nothing. */
EN.speciesFeatureRenames = [
  { oldName: "Cagebreak Instinct", name: "Feral Reprisal" },
  /* A spelling fix, 2026-09-20, and it needs a row exactly as much as a real rename does:
     "callous" is the adjective, "calluses" the plural noun. THREE resolvers match this
     feature by name, so a saved FreeBorn without this row loses the pick, its Radiation
     Resistance (engine.js LINEAGE_MECH) and its refusal of cold Fatigue (the hazard
     mitigation in hazards.js, matched on source.name). */
  { oldName: "Radiation Callouses", name: "Radiation Calluses" }
];
