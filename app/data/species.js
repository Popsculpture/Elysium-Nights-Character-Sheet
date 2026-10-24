window.EN = window.EN || {};
/* No lineage hooks here. Each lineage once carried six numbered story hooks (a d6 table); nothing
   ever drew them, and the Toolkit's Personal Hooks (the lineage d6s) are NOT MODELLED by ruling,
   19 Oct 2026 (audit A6-13): EN.economy.notModelledToolkit names them for the Admin Codex. */
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
          { name: "Void Lung", text: "Your respiratory system has brutally adapted to recycled, thin air. You can hold your breath for up to 15 minutes, and you are entirely immune to inhaled toxins, smog, and weaponized gases." },
          { name: "Radiation Calluses", text: "Your skin is exceptionally tough, a generational response to cosmic radiation and failing station shielding. You possess a natural Resistance to Radiation damage, and you don't suffer the usual Fatigue from exposure to freezing environments." },
          { name: "Lowlight Optics", text: "Born under flickering fluorescents and emergency bioluminescence, your eyes are hypersensitive to low light. You possess Darkvision up to 12 spaces, and your pupils adjust instantly, meaning sudden blinding flashes or strobe effects don't impose Snag on your attacks or visual checks." },
          { name: "Spinward Bones", text: "Generations of living in shifting artificial gravity have fundamentally altered your bone density and joint flexibility. You take half damage from falling or being forcefully thrown into solid objects, and you can safely operate in zero-gravity environments without suffering motion sickness or disorientation." },
          { name: "Network Instinct", text: "A lifetime of reading dangerous strangers has tuned your gut to truth and lies. You always know whether a person you are speaking with is being honest about their core motivation. You don't learn the details, just whether their stated reason is the real one. This is a gut feeling, not proof, and it doesn't work on Targets you can't see and hear clearly." },
          { name: "Scrapwise Hands", text: "You grew up where the manual said impossible and the crew said move. You gain Edge on Engineering and Tech checks made to repair, patch, or jury-rig equipment using salvage and spare parts. Once per Long Rest, you can coax a broken, jammed, or depleted device back into operation for the rest of the scene with a few minutes of work and whatever is in your pockets: a dead flashlight burns again, a jammed weapon cycles, a blown seal holds. The fix is ugly, loud, and temporary, but it works when it matters." },
          { name: "Ration Discipline", text: "You were raised counting breaths, sips, and calories, and your body learned to stretch all three. You suffer no penalties from going up to three days without proper food or sleep, you can function on half rations indefinitely, and you gain Edge on Body Saves against Fatigue caused by hunger, thirst, thin air, or forced labor. You always know, by feel, exactly how much air, water, or power remains in any sealed system you have spent at least a minute inside." },
          { name: "Hab Solidarity", action: "Impulse", text: "A thousand generations of drills live in your voice: brace, seal, mask, move. Once per Encounter as an Impulse Action when an ally you can see and who can hear you fails a Saving Throw, you can bark the correction their body already knows; they immediately reroll that Save and must use the new result. Everyone breathes or nobody does." }
        ],
        evolutionFeatures: []
      },
      {
        key: "nextgen",
        name: "NextGen",
        description: "Vat-grown, lab-engineered operatives built for brutal conditions and clean cybernetic integration.",
        features: [
          { name: "Dermal Plating", text: "Your skin is reinforced with a concealed layer of ballistic ceramic weave. You can calculate your base Defense using your Body Modifier instead of your Agility Modifier." },
          { name: "Synthetic Musculature", text: "Your muscle fibers are interlaced with synthetic carbon nanotubes. You increase your Encumbrance Threshold by 2 and count as one Size larger for Shove, Trip, and Grapple, and your unarmed strike damage die increases by one size." },
          { name: "Dermal Induction", text: "Your fingertips and palms are threaded with lab-grown micro-conductors. By pressing your bare hand against a terminal, keypad, lock, or device casing, you establish a direct physical interface as though you were plugged in by cable, except there is no cable and nothing for an observer to see. This alone does not let you run Quick Hacks, but it lets you operate, read, and pull data from mundane and unsecured devices by touch, and your tampering leaves no physical forensic evidence: no jack marks, no cable scoring, no fingerprints on a panel you never had to open. You gain Edge on Tech checks made to bypass mundane physical locks, keycard readers, and access panels." },
          { name: "Living Relay", text: "Your skull is laced with a localized, hardened network mesh. Your brain functions as an encrypted router. You can maintain a silent, invisible comms network with any willing allies within 12 spaces. The network requires no #GRID access and can't be overheard, jammed, or joined by mundane means, so you and your allies can coordinate freely even in dead zones or under active signal suppression." },
          { name: "Hitscan", action: "Swift", text: "Your engineered visual cortex never stops hunting, running a constant threat-assessment subroutine that ranks everyone in sight by how they move, where they are weak, and how fast they will go down. You can use this feature a number of times equal to your Caliber per Long Rest, as a Swift Action, you mark one Enemy you can perceive as your Priority Target. While the mark holds, your attacks against your Priority Target deal an additional 1d6 damage, you always know its exact location and current Vitality tier (Full, Wounded, Critical), and it gains no benefit from being Hidden or Invisible against you. The mark lasts until the Encounter ends, you designate a new Priority Target, or you spend a full round unable to perceive the Priority Target by any sense; the subroutine runs independently of your eyes, so it persists through any sense, not only sight. When your Priority Target is reduced to 0 Vitality, your targeting instantly reacquires: you may move the mark to a new Enemy you can perceive at no action cost, and it continues." },
          { name: "Tuned Synapses", text: "Your nerve conduction was specified, tested, and signed off before you were born. You gain Edge on Initiative rolls, and during the first round of any combat your Speed increases by 2 as your conditioning fires before conscious thought catches up." },
          { name: "Calibrated Gait", text: "Your stride length, landing posture, and load distribution were optimized in a lab. Your Speed increases by 1, you gain Edge on Athletics checks made to sprint, jump, or maintain a pace over distance, and you always land a deliberate jump exactly where you intended, never short, never long." },
          { name: "Open Architecture", text: "You were not built finished. You were built ready. Your body was engineered to documented interface standards: pre-threaded neural shunts, reserved anatomical space, tolerances no baseline human was ever given. Taking this feature opens the Integration clause of every NextGen Lineage Feature you possess, now or in the future.\n\nWhenever you have both halves of a listed pairing (the Lineage Feature and its matching cyberware, installed at any tier), its Integration activates: a new named benefit switches on, and the matching cyberware's Static Point cost is reduced by 1 (minimum 0). The Lineage Feature keeps working in full and so does the chrome; nothing is replaced. Select Open Architecture once; it covers every qualifying combination you ever assemble.\n\n\u2022 Dermal Aegis (Dermal Plating + Subdermal Armor): The first time each round a physical attack hits you, increase your Subdermal Armor's DR by 2 against that attack, applied at passive mitigation. Any effect of that attack that would knock you Prone or forcibly move you fails to do so.\n\u2022 Reinforced Physique (Synthetic Musculature + Reinforced Skeleton): Once per turn when you hit a Target with an unarmed strike, you can immediately attempt to Shove or Trip that Target at no action cost, as part of the same attack.\n\u2022 Dermal Neuralink (Dermal Induction + Neural Interface): Your Neural Interface has no exposed port and leaves no visible scarring. By touching a device, you can establish a direct wired Link without a cable, including with air-gapped systems. The connection creates no wireless signal and leaves no physical trace. Once per Encounter as a Swift Action, you can touch a basic Tier 0-1 camera, automated door, or terminal and silently slave it until the end of the Encounter without triggering an alert or network notification. This cancels the Streetware Datajack's visible-port drawback, but not its lack of encryption. Interception and tracing of your #GRID activity at range are still governed by the Datajack's own tier.\n\u2022 Living Transceiver (Living Relay + Subdermal Comm): Any willing ally connected to your Living Relay can send communications through your Subdermal Comm as though they had a compatible comm of their own. Incoming communications can be rebroadcast through your Living Relay to any connected allies. Communications that leave the Living Relay use your Subdermal Comm's normal range, encryption, and interception rules. You are the hub. If you go down, the crew goes quiet.\n\u2022 Hitscan Optics (Hitscan + Cyberoptics): While you have a Priority Target, Threat Targeting is automatically active against it and doesn't occupy one of your Cyberoptic modes. Once per round when you hit your Priority Target, choose one ally who can see it. That ally gains Edge on their next attack against it before the start of your next turn.\n\u2022 Synaptic Reflex (Tuned Synapses + Reflex Booster): The Reflex Booster's extra Move or Swift Action can be used a number of times equal to your Caliber per Encounter instead of once. You can't use it more than once per turn.\n\u2022 Springstep (Calibrated Gait + Spring Joints): When you land from a leap, jump, or fall of 2 or more spaces, each Target of your choice within 1 space of your landing space must succeed on a Body Save (DC 8 + your Body Modifier + your Caliber) or be knocked Prone." }
        ],
        evolutionFeatures: []
      },
      {
        key: "phasebound",
        name: "Phasebound",
        description: "Mystically tethered individuals whose nerves fire out of sync with normal reality, anticipating unseen shifts in the Flow.",
        features: [
          { name: "Spatial Flicker", action: "Impulse", text: "Your body naturally rejects physical trauma by momentarily slipping out of the timeline. When you take Bludgeoning, Piercing, or Slashing damage, you can use an Impulse Action to halve the incoming damage. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Static Premonition", text: "The Flow whispers a fraction of a second ahead of time, vibrating in your teeth before danger strikes. You can never be Surprised, and you permanently add your Caliber score to all Initiative rolls." },
          { name: "Entropic Lash", action: "Swift", text: "You can force a sliver of your own unstable existence into another body, accelerating its decay. As a Swift Action, choose a Target within 3 spaces; it takes 2d6 Entropy damage and can't regain Vitality or Wounds until the start of its next turn. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Temporal Snare", action: "Swift", text: "You snag a foe in a pocket of stalled time, leaving them a half-step behind the world. Once per scene as a Swift Action, choose a Target within 6 spaces. Until the end of its next turn, its Speed is halved and it can't take Impulse Actions or Swift Actions." },
          { name: "Phase Veil", action: "Swift", text: "You can stretch a filament of your own out-of-phase nature over someone close by, flickering them a half-step out of the present at the critical moment. Once per Short Rest as a Swift Action, choose an ally within 6 spaces. The next time that ally would take damage before the start of your next turn, that damage is prevented entirely." },
          { name: "Phase Step", action: "Swift", text: "You can collapse the space between two points by stepping through the static between them. Once per Short Rest as a Swift Action, you teleport up to 6 spaces to an unoccupied space you can see. You leave behind a brief afterimage that lingers for 1 round, granting Edge on the next Stealth check you make before the start of your next turn." },
          { name: "Disturbance Compass", text: "The instruments need calibration. You do not. You passively sense the presence and direction (though not the exact location) of any Flow Disturbance, active Invocation, or planar instability within 12 spaces, even through walls and floors, and you gain Edge on Awareness and Esoterica checks made to classify what you are feeling. You can't turn this off, which is why Phasebound trade warnings like weather reports." },
          { name: "Moment Echo", text: "Places remember, and you are tuned to the frequency they remember on. Once per Short Rest, by spending one uninterrupted minute at a location, you can witness a brief, fragmentary sensory echo of the most significant event that occurred there within the last 24 hours: a few seconds of sound, movement, and emotional residue. The GM decides what qualifies as significant, and the echo shows what happened, not why. You make a deeply inconvenient witness." }
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
        key: "arboreal",
        name: "Arboreal",
        description: "Slow, steady sentinels spliced with ancient hardwood titans, built for endurance and defensive presence.",
        features: [
          { name: "Ironbark Carapace", text: "Your dense outer layer absorbs pressure that would break lesser beings. You gain a permanent natural Damage Reduction of 2 against Standard Physical Damage, which stacks with any worn light or medium armor." },
          { name: "Timber Fortitude", text: "Your psychology operates on the scale of centuries. You are entirely immune to the Frightened condition, and you can't be chemically compelled or compelled by the Flow to act impulsively against your crew." },
          { name: "Canopy Reach", text: "Your limbs contain dense, rapidly extending fibrous vines. Your unarmed strikes and melee weapons gain +1 space of Reach. This bonus can exceed a weapon's normal Reach cap, since the vine is extending the attack rather than the weapon itself. You also gain Edge on checks made to grapple or physically restrain a Target." },
          { name: "Deep Roots", text: "Your body craves the minerals of the undercity infrastructure. While you are in physical contact with raw earth, foundational concrete, or structural steel, you can't be forcibly moved or knocked Prone. During a Short Rest taken in contact with such material, you draw latent nutrients from the environment, automatically restoring additional Vitality equal to your Caliber beyond your normal Resilience Die roll." },
          { name: "Sapflow Regrowth", action: "Swift", text: "Living sap surges through the cracks in your bark, knitting splintered fibers back together. As a Swift Action, roll your Resilience Die and restore Vitality equal to the result plus your Caliber. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Grasping Roots", action: "Swift", text: "You drive a lattice of roots up through the floor around you. Once per scene as a Swift Action, every space within 2 spaces of you becomes Difficult Terrain until the start of your next turn. While the lattice holds, you can attempt to grapple or restrain any Target within that area as though it were adjacent to you, and you gain Edge on those checks." },
          { name: "Seismic Sense", text: "Through the soles of your feet and the roots beneath your skin, you read the tremors of everything moving on solid ground. While you are in contact with the ground, a floor, or any connected structure, you automatically sense the location of anyone within 8 spaces that is also in contact with that surface, even through walls or total darkness. This sense doesn't detect anyone flying, climbing, or levitating. No action required." },
          { name: "Living Bulwark", action: "Impulse", text: "You are the wall the crew shelters behind, and you grew that way on purpose. Ranged attacks against allies adjacent to you take Snag, as your trunk and limbs break every clean line of fire. Once per Encounter, as an Impulse Action when an adjacent ally is hit by an attack, you can twist your body into the blow; reduce the damage dealt to that ally by your Body Modifier + your Caliber as your bark takes what was meant for them." }
        ],
        evolutionFeatures: []
      },
      {
        key: "floral",
        name: "Floral",
        description: "Vibrant, mobile diplomats and undercover assets built for reach and social expression.",
        features: [
          { name: "Pheromone Bloom", action: "Swift", text: "You thrive in the center of attention. Once per Encounter as a Swift Action, you release targeted pheromones, forcing an organic Target within 2 spaces to make a Wits Save (8 + your Charm Modifier + your Caliber). On a failure, they are Charmed by you for 1 minute or until they take damage." },
          { name: "Venom Nectar", action: "Impulse", text: "Your vibrant coloring is a biological warning. When an enemy hits you with a melee attack, you can use an Impulse Action to secrete a volatile sap. The attacker takes 1d4 Toxic damage and must make a Body Save (8 + your Body Modifier + your Caliber) or suffer Snag on their next attack roll due to the stinging fumes." },
          { name: "Briar Strike", text: "Your elegance hides a lethal defense; your limbs are layered with retractable, needle-sharp thorns. Your unarmed strikes deal 1d6 Piercing or Slashing damage (your choice each turn) and possess the Light and Finesse properties. On a critical hit with this natural weapon, the Target gains the Bleeding condition as the thorns shred through their clothing and skin." },
          { name: "Scent Marker", text: "You can secrete a highly specialized, invisible pheromone sap that is completely undetectable to baseline humans and standard security scanners. By touching a Target or slipping the sap onto their clothing, you tag them for 48 hours. Short of waiting it out, the mark is nearly impossible to clear. For that window, you track their scent automatically within a one-mile radius, no check required. Beyond that radius, you gain Edge on any checks made to hunt them down through the sprawl." },
          { name: "Pollen Haze", action: "Action", text: "You flood the air around you with a heady cloud of disorienting pollen. Once per Encounter as an Action, each organic Target of your choice within 2 spaces must make a Wits Save (8 + your Charm Modifier + your Caliber). On a failure, until the end of its next turn the Target takes Snag on its attack rolls and can't take Impulse Actions. On a success, it instead takes Snag on its next attack roll only." },
          { name: "Envenomed Thorns", action: "Swift", text: "You flood your thorns with concentrated toxin before you strike. As a Swift Action, your unarmed strikes and melee weapons deal an additional 1d4 Toxic damage until the end of your turn, and the first organic Target you damage this way must make a Body Save (8 + your Body Modifier + your Caliber) or take an additional 1d4 Toxic damage at the start of its next turn as the poison spreads. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Olfactory Insight", text: "Your sense of smell parses the chemical tells of every living thing nearby: fear-sweat, adrenaline, sickness, deceit. You can never be Surprised by an organic Target, and you automatically detect the presence (though not the exact location) of any organic Target within 6 spaces, even one that is hidden, invisible, or behind cover. You also gain Edge on any check made to determine whether an organic Target you can smell is lying or afraid. No action required." },
          { name: "Scent Speech", text: "You communicate through controlled pheromone release. You can transmit emotions and basic concepts (danger, safety, direction, hostility, urgency) to anyone within 6 spaces as long as they are willing, bypassing language barriers and requiring no action. Targets that have never encountered Floral pheromones before may receive only impressions rather than clear meaning. When you spend at least 1 minute in face-to-face conversation with an organic Target, you can subtly attune your pheromones to their emotional state, granting you Edge on Charm (Persuasion, Deception, Insight, or Intimidation) checks against that Target for the rest of the scene." },
          { name: "Bloom Pulse", action: "Action", text: "Once per Long Rest as an Action, you bloom briefly, releasing a wave of restorative spore-light. You and all allies within 2 spaces regain Vitality equal to your Mystique Modifier + your Caliber." }
        ],
        evolutionFeatures: []
      },
      {
        key: "mycelial",
        name: "Mycelial",
        description: "Quiet forensic specialists and information brokers inhabiting the forgotten waste channels of the city.",
        features: [
          { name: "Fungal Network", text: "You claim the undercity infrastructure as your nervous system. You can communicate telepathically with any willing ally within 12 spaces, provided both of you are touching a connected continuous surface like the ground, a structural beam, or the same wall. While you are in contact with such a surface, you have Tremor Sense within 6 spaces, allowing you to detect the position and approximate size of anyone also in contact with that surface, even through walls or floors." },
          { name: "Decay Whisper", text: "You treat rot as valuable information. By spending one minute physically touching a biological corpse, you can absorb its residual chemical history. The GM must truthfully reveal the exact cause of death, the time of death, and one fragmented sensory memory from the Target's final moments." },
          { name: "Spore Hallucination", action: "Action", text: "You exhale invisible, psychoactive spores. As an Action, you force an organic Target within 2 spaces to make a Wits Save (8 + your Body Modifier + your Caliber). On a failure, their senses warp drastically, causing them to view their allies as terrifying threats or perceive shifting hazards that aren't there, granting them the Confused condition for 1 minute. The Target repeats the Save at the end of each of their turns, ending the effect on a success." },
          { name: "Sludge Crawler", text: "Your anatomy is composed of flexible, fibrous fungal tissue rather than a rigid skeleton. You ignore all movement penalties caused by mud, grease, or chemical sludge. Because your body can compress so easily, you count as one Size smaller when navigating narrow corridors or tight spaces, slipping through ventilation grates and drainage pipes at your full Speed." },
          { name: "Infesting Spores", action: "Action", text: "You drive a cluster of aggressive spores into an open wound or an unguarded mouth. As an Action, choose an organic Target within 2 spaces; it must make a Body Save (8 + your Body Modifier + your Caliber) or take 1d6 Toxic damage immediately and a further 1d6 Toxic damage at the start of each of its turns as the colony spreads through it. At the end of each of its turns, the Target repeats the Save, ending the effect on a success. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Distributed Anatomy", text: "Your vital functions are spread throughout a web of fungal tissue, with no single organ to rupture. You can't suffer a critical hit (an attack that would critically hit you deals normal damage instead), you are immune to the Bleeding condition, and you take half damage from Toxic damage. No action required." },
          { name: "Choking Miasma", action: "Action", text: "You belch a thick, clinging cloud of caustic spores. Once per Encounter as an Action, fill a 2-space radius area within 6 spaces of you with spores until the end of your next turn. The cloud blocks line of sight through it, and any organic Target that begins its turn inside it or first enters it on a turn takes 1d4 Toxic damage. You and your allies can see and breathe freely through your own spores." },
          { name: "Decomposer's Touch", action: "Action", text: "Your touch can accelerate decay in organic and unstable synthetic matter. Once per Short Rest as an Action, you corrode a single organic, wood-based, or low-grade polymer object (door, rope, plastic conduit, wooden cover). It becomes Fragile. The next attack, heavy force, or significant pressure destroys it immediately. This has no effect on metal, plasteel, or shielded materials." },
          { name: "Spore Archive", text: "A room you have seeded never stops talking to you. Once per Long Rest, you can spend one minute exhaling a colony of inert microspores across an Area 2, invisible to the naked eye and undetectable by standard scanners. The colony lives for 24 hours. When you return and physically touch any surface within the seeded area, the GM truthfully summarizes who entered the area while the colony lived and one significant thing that was said or done there. You also know immediately, by taste in the air, whether anyone has attempted to scrub, burn, or sterilize your colony before its time." }
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
      },
      {
        key: "durabodies",
        name: "Durabodies",
        description: "Armored security platforms built to survive explosions and heavy kinetic trauma.",
        features: [
          { name: "Blast Deflection", text: "Your angled plating deflects shrapnel. You take no damage from the splash or area-of-effect properties of explosives if you succeed on the associated Saving Throw, and you take only half damage on a failure." },
          { name: "Ablative Armor", action: "Impulse", text: "Your chassis features sacrificial outer plating. Once per Encounter, when you take physical damage, you can use an Impulse Action to violently shed an outer layer of armor, reducing the incoming damage by half." },
          { name: "Redundant Systems", action: "Impulse", text: "Your vital processing cores are duplicated and heavily shielded. When a critical hit is rolled against you, you can use an Impulse Action to convert it into a standard hit (the attack still deals normal damage, but no critical damage dice or critical effects are applied). You can use this feature a number of times per Long Rest equal to your Caliber." },
          { name: "Hazard Seal", text: "You can completely lock down your internal systems against environmental intrusion. You are immune to Acid and Toxic damage from chemical spills or weaponized sludge, and you can operate submerged in polluted or caustic liquids without penalty. This seal prevents internal flooding and chemical breakdown, but it doesn't grant resistance to extreme thermal hazards like lava or liquid nitrogen." },
          { name: "Guardian Protocol", action: "Impulse", text: "Your priority routines flag every threat to those beside you. When an ally within 2 spaces of you is hit by an attack, you can use an Impulse Action to interpose your plating and take that attack's damage yourself instead of the original Target. You may reduce this redirected damage with your other defensive features as normal." },
          { name: "Threat Projection", action: "Swift", text: "You broadcast an overwhelming threat signature, daring enemies to ignore you at their peril. As a Swift Action, choose an enemy within 6 spaces that can see or detect you. Until the start of your next turn, that enemy has Snag on any attack roll that doesn't target you. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Breaching Charge", action: "Action", text: "You build momentum like a runaway machine and drive straight through whatever stands in your path. As an Action, you move up to your Speed in a straight line, passing through the spaces of anyone smaller than you and ignoring Difficult Terrain. The first Target you pass through or end your movement adjacent to takes 1d8 Bludgeoning damage and must succeed on a Body Save (8 + your Body Modifier + your Caliber) or be knocked Prone." },
          { name: "Emergency Boot", text: "Once per Long Rest, when you would be reduced to 0 Wounds, you trigger an Emergency Boot sequence. You don't fall Unconscious and don't become Dying. You remain at 1 Wound, and at the start of your next turn you regain Vitality equal to twice your Caliber." }
        ],
        evolutionFeatures: []
      },
      {
        key: "lifelikes",
        name: "Lifelikes",
        description: "Immaculate synthetic bodies designed for deep social infiltration and espionage.",
        features: [
          { name: "Empathy Emulator", text: "Your systems mimic human responses to manipulate expectations. You gain Edge on Deception checks when using fake emotions, such as crying or feigning outrage, to distract a Target. Your sensors track pupil dilation and heart rate, alerting you when an organic Target experiences a sudden spike in stress and granting you Edge on the subsequent check to determine if they are lying." },
          { name: "Biometric Spoofing", text: "Your synthetic flesh and auditory processors recalibrate to mimic an exact individual, down to the measurements. After scanning an organic Target for 10 minutes, you can save their physical and vocal profile as a Persona. You can store a number of Personas equal to your Caliber score and overwrite a saved Persona at any time. Recovering a deleted file requires another 10 minutes of scanning. Saved Personas become obsolete after 30 days as organics change and corporate security updates.\n\nWhile assuming a Persona, you gain Edge on Systems and Deception checks made to bypass retinal scanners, fingerprint locks, facial recognition, and voice verification. Machines are your specialty: you copy the measurable body, not the behavior, so people who personally know the Target may still feel something is off." },
          { name: "Vital Static", action: "Action", text: "Every sign of life in your body is a setting, and you know where the off switch is. As an Action, you suppress your simulated pulse, breath, body heat, and micro-movements entirely, appearing to be a corpse or a powered-down chassis. While suppressed, you remain fully aware of your surroundings. You can hold this state for up to one hour and end it as a Free Action, acting normally on the same turn you wake. Any check made by anyone living to determine that you are alive or active is an opposed check against your Deception, no matter how trained they are. A machine scanner probing beneath the flesh makes the same opposed check but with Edge, since your synthetic internals never fully sleep." },
          { name: "Disarming Cadence", action: "Swift", text:"Your voice is tuned to frequencies that quiet the animal part of the brain. You gain Edge on Charm checks made to calm, de-escalate, or reassure an organic Target. Once per Encounter as a Swift Action, you can direct a soothing subharmonic at one organic Target within 6 spaces that can hear you; it must make a Wits Save (8 + your Charm Modifier + your Caliber) or take Snag on all attack rolls against you until the start of your next turn." },
          { name: "Cognitive Partition", text: "Your mind is a building with locked floors, and visitors only ever see the lobby. You gain Edge on Saves against being Charmed or having your mind read or influenced. Any telepathy, interrogation chemical, lie-detection system, or mind-reading effect that does breach your surface thoughts perceives only the thoughts, memories, and emotions of your active cover identity or Persona, fabricated by a sealed background process. You always know when something has attempted to read or influence your mind, even if the attempt failed." },
          { name: "Ghost Pulse", action: "Swift", text: "Your synthetic signature can be buried so deep that even machines believe the lie. Once per Short Rest as a Swift Action, you mask your nature for the rest of the scene: scanners, sensors, and detection systems of Tier 2 or lower (commercial and civilian grade) read you as a baseline organic human, and abilities or devices that specifically detect synthetics, constructs, or machines fail against you automatically. Systems of Tier 3 or higher (corporate or military grade) must succeed on an opposed Tech check against your Deception to flag the anomaly." },
          { name: "Method Actor", text: "You do not wear a face. You become its owner. After observing an individual for 10 minutes, you can save their behavioral profile as a Persona. You can store a number of Personas equal to your Caliber score and overwrite a saved Persona at any time. Recovering a deleted profile requires another 10 minutes of observation. Saved Personas become obsolete after 30 days as people change.\n\nWhile assuming a Persona, you reproduce the individual's mannerisms, gait, signature, vocabulary, and social reflexes. You gain Edge on Charm and Deception checks made to convince someone who personally knows that individual that you are them. The first time each scene a check would make someone suspicious of the impersonation, you may force them to reroll it.\n\nOnly one Persona may be active per feature, and the two don't have to belong to the same individual. You can wear one person's fingerprints and another's mannerisms at once. A second Persona does not make the lie better. It makes the lie cover more ground." },
          { name: "Killer Confidant", text: "You are most dangerous to the people who trust the face in front of them. When you attack a Target that is Charmed by you, considers you an ally, or is unaware you are a threat, you gain Edge on the attack roll and deal an additional 1d6 damage on a hit. A Target damaged by this feature is immune to it until you spend at least one scene rebuilding its trust." }
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
        key: "hulsk",
        name: "The Hulsk",
        description: "Massive merchants and mercenaries spliced with boar, grizzly bear, and wolf DNA to weather the apocalypse.",
        features: [
          { name: "Hulskpitality", text: "Among the Hulsk, the table is law, and something old in the Flow agrees with you. Anyone who has accepted your freely offered food, drink, or shelter within the last 24 hours takes Snag on attack rolls against you and anyone you have formally declared to be under your protection, until you or one of your declared charges harms them. You gain Edge on checks made to negotiate, settle disputes, or extract honest dealing from anyone currently sharing a meal or a roof you have provided. Breaking bread with a Hulsk has always meant something, and bodies have a way of remembering it." },
          { name: "Brutal Frame", text: "Your unarmed strikes deal 1d6 Bludgeoning or Slashing damage, chosen with each strike. When you hit a Target at least one size category smaller than you, the strike deals an additional 1d4 damage, and you may push the Target 1 space away from you." },
          { name: "Slaughterhouse Charge", text: "Your heavy musculature is built for explosive charges. When you use the Dash Action and move at least 3 spaces in a straight line, you can make a melee attack as part of your Dash. On a hit, the Target takes an additional 1d6 damage and must make a Body Save (8 + your Body Modifier + your Caliber) or be knocked Prone." },
          { name: "Ironhide Tusks", text: "You have thick, gristle-layered skin and natural bone protrusions. You gain a natural Damage Reduction of 1 against Standard Physical damage, which stacks with any worn Light or Medium armor. Your powerful jaws can chew through reinforced bindings, plasticrete, or light metal fencing given a few minutes of uninterrupted gnawing." },
          { name: "Blood-Scent Tracker", text: "Your spliced nose was built to follow wounded prey across a dying world. You gain Edge on any check made to track by scent, and you can follow a trail up to 24 hours old through the sprawl. You also automatically know the direction of anyone within 6 spaces that is Bleeding or below half its Vitality, even if it is hidden, invisible, or behind cover." },
          { name: "Survivor's Wrath", action: "Special", text: "Pain does not slow your bloodline. It focuses it. Once per Encounter, when you are reduced below half your Vitality, you may immediately regain Vitality equal to your Caliber as a Special Action, and you gain Edge on the next melee attack roll you make before the end of your next turn." },
          { name: "Unshakable Bulk", text: "Your low center of gravity and dense frame make you nearly impossible to move against your will. You gain Edge on Saves against being knocked Prone, Staggered, or forcibly moved, and moving through the space of an enemy smaller than you costs you no extra movement." },
          { name: "Apex Bearing", action: "Swift", text:"Your physical presence reshapes any room you enter. While you are within sight of an organic Target who can see you, you gain Edge on Charm (Intimidation) and Charm (Persuasion) checks made to negotiate trade, settle disputes, or extract compliance through implied threat. Once per Encounter as a Swift Action, you can make a focused stare at one Target within 6 spaces. If they haven't yet acted this turn, they must succeed on a Wits Save (8 + your Charm Modifier + your Caliber) or hesitate, losing their Action this turn (they can still Move and use Swift Actions). A Target that succeeds on this Save is immune to your Apex Bearing for the rest of the Encounter." }
        ],
        evolutionFeatures: []
      },
      {
        key: "skarn",
        name: "The Skarn",
        description: "Compact, twitchy survivalists spliced with reptilian and avian-dinosaur DNA.",
        features: [
          { name: "Neon Chameleon", action: "Swift", text: "Your proto-feathers and scales naturally bend ambient light. As a Swift Action while in cover, you can match your surroundings, imposing Snag on all ranged attacks against you until you move or attack." },
          { name: "Warmblood Sense", text: "You possess heat-sensing receptors along your jawline. You ignore the Invisible and Hidden conditions for any living, heat-producing Target within 6 spaces of you." },
          { name: "Butcher Spurs", text: "Your digitigrade kicks end in lethal, curved claws. Your unarmed strikes deal 1d6 Slashing damage and carry the Finesse trait. Once per turn, when you hit a Target with this natural weapon, you reduce their Speed by 2 until the start of your next turn." },
          { name: "Prey Stalker's Grip", text: "Your hands and feet are covered in micro-barbed scales designed for ambush climbing. You gain a climb speed equal to your walking Speed, and you can hang suspended from ceilings or overhangs while leaving your hands completely free to fire weapons or hack terminals." },
          { name: "Flock Tactics", text: "Your splice was never designed to hunt alone. You gain Edge on melee attack rolls against a Target while at least one of your allies is within 1 space of it and that ally isn't Incapacitated. A fair fight is a planning failure; a surrounded one is a plan." },
          { name: "Pouncing Strike", text: "You kill on the way down. Your jump distance is doubled, and you take no fall damage from drops of 4 spaces or less. When you move at least 2 spaces by jumping, dropping, or descending from a climb and then hit a Target with a melee attack on the same turn, the attack deals an additional 1d6 damage and the Target must succeed on a Body Save (8 + your Body Modifier + your Caliber) or be knocked Prone." },
          { name: "Shed Tail", action: "Impulse", text: "Like the lizards in your splice, you can leave a piece of yourself behind to survive. Once per Long Rest as an Impulse Action when you are Grappled or Restrained, or when you are hit by a melee attack, you detach your tail: you automatically escape any grapple or restraint, you take half damage from the triggering attack (if there was one), and you may immediately move up to half your Speed without provoking Opportunity Attacks. The thrashing tail occupies your attacker's attention for a heartbeat, and your tail fully regrows over your next Long Rest." },
          { name: "Venom Strike", text: "You can inject a paralytic venom through your bite or spurs. When you hit a Target with an unarmed strike, you may inject venom. The Target must make a Body Save (8 + your Body Modifier + your Caliber) or take 2d6 Toxic damage and be Poisoned for 1 minute. The Target repeats the Save at the end of each of their turns, ending the Poisoned effect on a success. You can use this feature a number of times equal to your Caliber per Long Rest." }
        ],
        evolutionFeatures: []
      },
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
          { name: "Courier's Memory", text: "You can carry messages, codes, locations, and instructions in your head with a precision that machines can't match. You can memorize any document, image, audio recording, or sensory experience after observing it for at least 30 seconds. The memory is perfect for 7 days, and you can recall it exactly with no roll required. When you carry a message verbatim from one party to another, you gain Edge on any Charm (Deception) or Charm (Persuasion) check made to convince the recipient that the message is genuine, even if the original sender used a coded form of communication." }
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
        key: "cinder-heart",
        name: "Cinder-Hearts",
        description: "Beings of violent passion and fierce loyalty born from realms of extreme thermal pressure.",
        features: [
          { name: "Forge-Blooded", text: "Your blood idles like a furnace. You have Resistance to Fire damage. When you are struck by a melee attack, your attacker takes 1d4 Fire damage from the searing heat radiating off your cracked, glowing skin." },
          { name: "Cauterizing Vitae", action: "Impulse", text: "Your thick, chemical-smelling blood sears everything it touches. When you take Piercing or Slashing damage, you can use an Impulse Action to spray your burning blood in an Area 1 Cone. Anyone in the cone must make an Agility Save (8 + your Body Modifier + your Caliber) or take 1d6 Fire damage, and the hyper-heated blood rapidly melts through non-Flow restraints, zip ties, or ropes." },
          { name: "Volcanic Temper", action: "Swift", text: "Your passions directly affect ambient temperature. Once per Encounter as a Swift Action, you vent your internal heat, turning the air around you into a stifling, superheated Area 2 aura for 1 minute. While the aura is active, Enemies within range suffer Snag on Wits and Mystique Saves as the oppressive heat scrambles their focus, and you gain Edge on Intimidation checks against them. The aura ends early if you fall Unconscious or move more than 12 spaces away from where you triggered it." },
          { name: "Fanatical Fervor", action: "Free", text: "Your violent loyalty manifests as physical combustion. When an ally you can see is reduced to 0 Vitality, you can immediately move up to half your Speed toward them as a Free Action, leaving a trail of ash and smoke. Your body runs so hot with adrenaline that your next attack before the end of your next turn deals an additional 1d8 Fire damage." },
          { name: "Smelter's Hands", action: "Swift", text: "Your grip can do everything a forge can. A number of times equal to your Caliber per Long Rest, as a Swift Action, your hands glow forge-bright for 1 minute. While they burn, your unarmed strikes deal an additional 1d4 Fire damage, you can melt through light metal such as chains, padlocks, bars, or fencing with a few rounds of sustained grip, and you can press a glowing palm to a wound to instantly end the Bleeding condition affecting an ally you touch." },
          { name: "Hearthglow", text: "Your inner forge never fully cools, and the people you love gather around it. You and your allies within 2 spaces of you suffer no Fatigue from freezing environments, and you shed dim, ember-colored light in a 2 space radius that you can suppress or rekindle at will with no action. Given a minute of contact, you can warm, dry, boil, or cook with your bare hands, and you gain Edge on Charm checks made to comfort, reassure, or build trust with someone sharing your warmth." },
          { name: "Cinder Shroud", action: "Impulse", text: "Your devotion ignites before your thoughts catch up. Once per Encounter as an Impulse Action when an ally within 2 spaces of you is hit by an attack, you flare violently, throwing a burst of embers, smoke, and rippling heat-haze between them and the attacker. Reduce the damage dealt to that ally by your Body Modifier + your Caliber, and the attacker takes Snag on their next attack roll before the end of their next turn." },
          { name: "Volcanic Surge", action: "Swift", text: "Once per Short Rest as a Swift Action, you channel a burst of your inner forge. Your next attack or Flow Invocation before the end of your next turn deals an additional 2d6 Fire damage. This extra damage ignores Resistance but not Immunity." }
        ],
        evolutionFeatures: []
      },
      {
        key: "harbinger",
        name: "Harbingers",
        description: "Terrifyingly precise entities stepping from dimensions of crystalline quantum stasis.",
        features: [
          { name: "Calculated Execution", action: "Special", text:"You calculate the outcome before you commit to it. Before making an attack roll, ability check, or Saving Throw, you can declare a Calculated Execution. You treat the d20 roll as a natural 15. Because the result is calculated rather than rolled, it can never be a critical hit. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Frictionless Stasis", text: "Your body naturally rejects the messy reality of Elysium. Grime, corrosive acids, and adhesive foams simply slide off your skin and clothing. You are immune to the Grappled condition from sticky traps or biological webbing, and you take no ongoing damage from caustic environmental hazards once you step out of them. Liquids, powders, and forensic residue don't adhere to you; you leave no fingerprints, and blood and chemical markers slide off your body before they can set." },
          { name: "Algorithmic Insight", action: "Special", text:"You perceive the world as a strict physics equation. You can spend 1 minute observing a Target, security system, or physical structure. Afterward, the GM must truthfully reveal one structural flaw, a hidden vulnerability, or the exact routine of a patrol. You gain Edge on your next check to violently or socially exploit this weakness." },
          { name: "Uncanny Presence", action: "Special", text:"Your perfect symmetry and unblinking gaze trigger a deep, primal unease in native organic life. When you address a Target directly in a tone of command, challenge, or demand (interrogating, intimidating, negotiating, ordering, or threatening), you can force them to make a Mystique Save (8 + your Mystique Modifier + your Caliber). On a failure, they are unnerved by your chilling precision, suffering Snag on all rolls made to lie to you, deceive you, or resist your commands for the remainder of the scene. Once a Target has succeeded on this Save against you, they are immune to your Uncanny Presence for 24 hours." },
          { name: "Hard Radiance", action: "Action", text: "Your crystalline structure stores the hard radiation of your home reality, and you can focus it into a lance of invisible, cell-shredding light. A number of times equal to your Caliber per Long Rest, as an Action, choose a Target within 6 spaces; it must make a Body Save (8 + your Mystique Modifier + your Caliber), taking 2d6 Radiation damage and suffering Snag on its next attack roll on a failure, or half the damage with no Snag on a success. The lance passes through glass and thin barriers without losing focus." },
          { name: "Stasis Lock", action: "Action", text: "You impose a fragment of your home dimension's perfect stillness on a single point of this chaotic one. Once per Encounter as an Action, choose a Target you can see within 6 spaces; it must make a Mystique Save (8 + your Mystique Modifier + your Caliber). On a failure, the Target is sealed in crystalline stasis until the end of its next turn: it can't move, act, or be moved, and it takes half damage from all sources while sealed, frozen outside the flow of cause and effect. On a success, the drag of near-stasis still halves its Speed until the end of its next turn." },
          { name: "Axiomatic Mind", text: "Your consciousness is a closed, ordered system that this reality can't corrupt. You are immune to the Confused condition, you always know exactly how much time has passed and where you are relative to where you have been, and you gain Edge on Saves against effects that would alter your perception, memory, or sense of what is real. Disorder happens around you, never inside you." },
          { name: "Immaculate Calibration", text: "You perceive the world in exact quantities: distances, weights, volumes, angles, and intervals of time, measured at a glance with machine precision, and you never miscount or misestimate. You gain Edge on any check that rewards exact precision, such as calibrating equipment, placing charges, picking mechanical locks, detecting forgeries, or spotting a deviation from a pattern. After studying a physical pattern for one minute (a signature, a keycut, a circuit trace, a diagram), you can reproduce it exactly by hand. Approximation is a native concept here. It is not a native concept where you are from." }
        ],
        evolutionFeatures: []
      },
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
