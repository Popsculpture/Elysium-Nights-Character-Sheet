window.EN = window.EN || {};
EN.species = [
  {
    key: "humans",
    name: "Humans",
    glance: {
      origin: "Driven by relentless migration and unchecked corporate expansion.",
      nature: "Organic, physically diverse, and heavily modified by cybernetics and their environment.",
      communities: "Scattered everywhere, from pristine corporate arcologies to the rusted lower tiers of the sprawl.",
      reputation: "Apex survivors, ambitious opportunists, and daring operators who champion personal causes.",
      corporateClassification: "Baseline Consumer Biomass. The corporate elite view the general human population as a renewable, expendable labor force and the primary target market for aggressive cybernetic upselling and planned obsolescence.",
      flowConnection: "Splintered by the metaphysical weight of the Flow, shaping distinct mystic lineages.",
      commonLineages: "FreeBorn, NextGen, Phasebound"
    },
    blurb: "Humans built Elysium because they were afraid of being forgotten. They are fragile by comparison to many of the beings that now share the sprawl, but fragility never made humanity gentle. It made them urgent.",
    traits: {
      size: "Medium: Stand anywhere from 5 feet to well over 6 feet tall.",
      languages: "Common Trade and one additional language of your choice, usually reflecting your home district or corporate affiliation.",
      coreTrait: {
        name: "Relentless Will (Passive)",
        text: "Humans rely on pure spite and stubbornness to push past physical limits. When you make a Saving Throw specifically to end an ongoing condition that is already affecting you, such as Stunned, Poisoned, or Frightened, you roll that Save with Edge. You can use this feature a number of times equal to your Caliber per Long Rest."
      },
      secondaryTrait: {
        name: "Human Ingenuity (Active)",
        text: "Humans adapt quickly to whatever the situation demands. When you make a d20 Skill check using a Skill in which you are Untrained, you may ignore the usual Snag penalty. You simply roll the d20 and add the relevant Attribute modifier. You can use this feature a number of times equal to your Caliber per Short Rest."
      }
    },
    lineages: [
      {
        key: "freeborn",
        name: "FreeBorn",
        description: "Resilient survivors of deep void stations and tight undercity corridors who rely on grit and mutual aid.",
        features: [
          { name: "Void Lung", text: "Your respiratory system has brutally adapted to recycled, thin air. You can hold your breath for up to 15 minutes, and you are entirely immune to inhaled toxins, smog, and weaponized gases." },
          { name: "Radiation Callouses", text: "Your skin is exceptionally tough, a generational response to cosmic radiation and failing station shielding. You possess a natural Resistance to Radiation damage, and you do not suffer the usual exhaustion penalties from exposure to freezing environments." },
          { name: "Lowlight Optics", text: "Born under flickering fluorescents and emergency bioluminescence, your eyes are hypersensitive to low light. You possess perfect Darkvision up to 12 spaces, and your pupils adjust instantly, meaning sudden blinding flashes or strobe effects do not impose Snag on your attacks or visual checks." },
          { name: "Spinward Bones", text: "Generations of living in shifting artificial gravity have fundamentally altered your bone density and joint flexibility. You take half damage from falling or being forcefully thrown into solid objects, and you can safely operate in zero-gravity environments without suffering motion sickness or the Disoriented condition." },
          { name: "Network Instinct", text: "A lifetime of reading dangerous strangers has tuned your gut to truth and lies. You always know whether a person you are speaking with is being honest about their core motivation. You do not learn the details, just whether their stated reason is the real one. This is a gut feeling, not proof, and it does not work on Targets you cannot see and hear clearly." },
          { name: "Scrapwise Hands", text: "You grew up where the manual said impossible and the crew said move. You gain Edge on Engineering and Tech checks made to repair, patch, or jury-rig equipment using salvage and spare parts. Additionally, once per Long Rest, you can coax a broken, jammed, or depleted device back into operation for the rest of the scene with a few minutes of work and whatever is in your pockets: a dead flashlight burns again, a jammed weapon cycles, a blown seal holds. The fix is ugly, loud, and temporary, but it works when it matters." },
          { name: "Ration Discipline", text: "You were raised counting breaths, sips, and calories, and your body learned to stretch all three. You suffer no penalties from going up to three days without proper food or sleep, you can function on half rations indefinitely, and you gain Edge on Body Saves against Exhaustion caused by hunger, thirst, thin air, or forced labor. You always know, by feel, exactly how much air, water, or power remains in any sealed system you have spent at least a minute inside." },
          { name: "Hab Solidarity", text: "A thousand generations of drills live in your voice: brace, seal, mask, move. Once per Encounter as a Free Action when an ally you can see and who can hear you fails a Saving Throw, you can bark the correction their body already knows; they immediately reroll that Save and must use the new result. Everyone breathes or nobody does." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who distrusts authority for practical reasons, not aesthetic ones.",
          "You like mechanics that enhance environmental survival and mobility.",
          "You want roleplay tension around mutual aid, crew loyalty, and the price of true freedom.",
          "You want a connection to orbital stations, deep void mines, and the undercity working class."
        ],
        hooks: [
          "1. Your old habitat crew is being evicted after refusing a corporate buyout, and you need glimmer fast before the station locks them out of life support.",
          "2. You still carry the access codes to a decommissioned void platform, but every faction that knows it exists believes something valuable was left aboard.",
          "3. A former crew chief sold your mutual aid network to a debt collection, and now FreeBorn families across the sprawl are being hunted through their favor ledgers.",
          "4. You survived a pressure breach that should have killed everyone in your section, and the official incident report says you were never there.",
          "5. A corporate landlord is using oxygen, water, and heat rationing to break an undercity labor block, and your crew wants you to help make an example of them.",
          "6. You made a handshake promise to get a stranded spacer home, but the route crosses embargoed territory, dead satellites, and a station that stopped answering years ago."
        ]
      },
      {
        key: "nextgen",
        name: "NextGen",
        description: "Vat-grown, lab-engineered operatives built for brutal conditions and clean cybernetic integration.",
        features: [
          { name: "Dermal Plating", text: "Your skin is reinforced with a concealed layer of ballistic ceramic weave. You can calculate your base Defense using your Body modifier instead of your Agility modifier." },
          { name: "Synthetic Musculature", text: "Your muscle fibers are interlaced with synthetic carbon nanotubes. You count as one Size larger when determining Encumbrance Thresholds and grappling, and your unarmed strikes deal 1d6 Bludgeoning damage." },
          { name: "Dermal Induction", text: "Your fingertips and palms are threaded with lab-grown micro-conductors. By pressing your bare hand against a terminal, keypad, lock, or device casing, you establish a direct physical interface as though you were plugged in by cable, except there is no cable and nothing for an observer to see. This alone does not let you run Quick Hacks (a Datajack is still required for #GRID intrusion), but it lets you operate, read, and pull data from mundane and unsecured devices by touch, and your tampering leaves no physical forensic evidence: no jack marks, no cable scoring, no fingerprints on a panel you never had to open. You gain Edge on Tech checks made to bypass mundane physical locks, keycard readers, and access panels." },
          { name: "Living Relay", text: "Your skull is laced with a localized, hardened network mesh. Your brain functions as an encrypted router. You can maintain a silent, invisible comms network with any willing allies within 12 spaces. The network requires no #GRID access and cannot be overheard, jammed, or joined by mundane means, so you and your allies can coordinate freely even in dead zones or under active signal suppression." },
          { name: "Predictive Targeting", text: "Your engineered visual cortex never stops hunting, running a constant threat-assessment subroutine that ranks everyone in sight by how they move, where they are weak, and how fast they will go down. You can use this feature a number of times equal to your Caliber per Long Rest, as a Swift Action, you mark one Enemy you can perceive as your Quarry. While the mark holds, your attacks against your Quarry deal an additional 1d6 damage, you always know its exact location and current Vitality tier (Full, Wounded, Critical), and it gains no benefit from being Hidden or Invisible against you. The mark lasts until the Encounter ends, you designate a new Quarry, or you spend a full round unable to perceive the Quarry by any sense; the subroutine runs independently of your eyes, so it persists through any sense, not only sight. When your Quarry is reduced to 0 Vitality, your targeting instantly reacquires: you may move the mark to a new Enemy you can perceive at no action cost, and it continues." },
          { name: "Tuned Synapses", text: "Your nerve conduction was specified, tested, and signed off before you were born. You gain Edge on Initiative rolls, and during the first round of any combat your Speed increases by 2 as your conditioning fires before conscious thought catches up." },
          { name: "Calibrated Gait", text: "Your stride length, landing posture, and load distribution were optimized in a lab. Your Speed increases by 1, you gain Edge on Athletics checks made to sprint, jump, or maintain a pace over distance, and you always land a deliberate jump exactly where you intended, never short, never long." },
          { name: "Open Architecture", text: "You were not built finished. You were built ready. Your body was engineered to documented interface standards: pre-threaded neural shunts, reserved anatomical space, tolerances no baseline human was ever given. Taking this feature opens the Integration clause of every NextGen Lineage Feature you possess, now or in the future. Whenever you have both halves of a listed pairing (the Lineage Feature and its matching cyberware, installed at any tier), that clause activates: the Engineered Baseline effect ends as a separate system and is absorbed into the chrome, the chrome gains enhanced capability, and its Static Point cost is reduced by 1 (minimum 0). You never lose a Lineage Feature to an install; it lives on through the chrome. Select Open Architecture once; it covers every qualifying combination you ever assemble. Without it, your features and your chrome remain separate systems:\n• Dermal Plating (Subdermal Armor): When you install Subdermal Armor at any tier, your engineered bone integrates with the new chrome rather than being replaced by it. The Engineered Baseline effect continues, and the installed Subdermal Armor gains +1 DR (stacking with its normal bonus).\n• Synthetic Musculature (Reinforced Skeleton): When you install a Reinforced Skeleton at any tier, the Engineered Baseline effect ends. Your synthetic muscle has integrated with the new bone-weaving. In its place, the Reinforced Skeleton's unarmed strike damage increases by one die size (1d8 at Brandware, 1d10 at Blackware), and you retain the Size-larger bonus for Encumbrance and grappling.\n• Dermal Induction (Neural Interface): When you install a Neural Interface (Datajack) at any tier, the Engineered Baseline effect ends as a separate system and is absorbed into the implant. The Datajack now runs entirely through your skin: there is no exposed port and no install scarring at any tier, nothing for a hostile party to see, find, or physically access (this overrides the visible-port drawback of a Streetware Datajack). You can open a direct, wired-grade Link to any device you can physically touch, reaching past air-gaps that a remote hacker cannot, and while that touch-Link holds there is no wireless signal to intercept and no physical trace left at the device. (Encryption and tracing of your #GRID activity at range are still governed by the Datajack's own tier; Dermal Induction protects the body and the hands, not the signal.) In addition, as a Swift Action once per Encounter, by touching or coming within 1 space of a basic (Tier 0-1) security camera, automated door, or terminal, you can silently slave it without tripping an alert or notifying its network; you retain control of the device until the end of the Encounter.\n• Living Relay (Subdermal Comm): When you install a Subdermal Comm at any tier, the Engineered Baseline effect ends as a separate system and is absorbed into the implant. The relay network persists through the chrome and its range doubles to 24 spaces, and your transmissions become effectively untraceable through standard means: an enemy must succeed on a Tech check vs. DC 20 even to detect that you are transmitting, let alone trace or intercept it.\n• Predictive Targeting Integration (Cybereyes): When you install Cybereyes at any tier, the Engineered Baseline effect ends as a separate system and is absorbed into the implant. The mark lives on through the chrome, and your Cybereyes' Threat Targeting mode is permanently active whether or not you selected it as one of your modes. In addition, your optics broadcast the lock to your crew: while a creature is your Quarry, any ally who can see it deals an additional 1d4 damage against it.\n• Tuned Synapses (Reflex Booster): When you install a Reflex Booster at any tier, the Engineered Baseline effect ends as a separate system and is absorbed into the implant. The Reflex Booster's Initiative bonus increases by an additional +2, and you retain the first-round Speed increase of 2, which stacks with the implant's own Speed bonus.\n• Calibrated Gait (Cyberlegs or Spring Joints): When you install Cyberlegs or Spring Joints at any tier, the Engineered Baseline effect ends as a separate system and is absorbed into the implant. The implant grants an additional +1 Speed beyond its normal benefits, and you take half damage from falling." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who is a manufactured asset claiming ownership of their identity.",
          "You like mechanics that emphasize cybernetic integration, durability, and tactical advantage.",
          "You want roleplay tension around corporate ownership, perfectionism, and breaking conditioning.",
          "You want a connection to military contractors, black sites, and cybernetic research labs."
        ],
        hooks: [
          "1. Your original growth lab has reopened under a new name, and one of the newest operatives has your face, your reflex profile, and none of your doubts.",
          "2. A corporate handler claims your body still belongs to the program that designed it, and they have produced a contract with your genetic signature on every page.",
          "3. Your internal benchmarks are degrading for reasons no ripperdoc can explain, and the only surviving data on your design strain is locked inside a black site.",
          "4. You were conditioned to obey a specific command phrase, and someone in Elysium has started testing fragments of it over public comms.",
          "5. A group of younger NextGen assets wants you to teach them how to defect, but helping them could expose every safehouse you have built.",
          "6. Your creators embedded a dormant combat package in your nervous system, and it activated during a job you do not remember finishing."
        ]
      },
      {
        key: "phasebound",
        name: "Phasebound",
        description: "Mystically tethered individuals whose nerves fire out of sync with normal reality, anticipating unseen shifts in the Flow.",
        features: [
          { name: "Spatial Flicker", text: "Your body naturally rejects physical trauma by momentarily slipping out of the timeline. When you take Bludgeoning, Piercing, or Slashing damage, you can use an Impulse Action to halve the incoming damage. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Static Premonition", text: "The Flow whispers a fraction of a second ahead of time, vibrating in your teeth before danger strikes. You can never be Surprised, and you permanently add your Caliber score to all Initiative rolls." },
          { name: "Entropic Lash", text: "You can force a sliver of your own unstable existence into another body, accelerating its decay. As a Swift Action, choose a creature within 3 spaces; it takes 2d6 Entropy damage and cannot regain Hit Points until the start of its next turn. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Temporal Snare", text: "You snag a foe in a pocket of stalled time, leaving them a half-step behind the world. Once per scene as a Swift Action, choose a creature within 6 spaces. Until the end of its next turn, its Speed is halved and it cannot take Impulse Actions or Swift Actions." },
          { name: "Phase Veil", text: "You can stretch a filament of your own out-of-phase nature over someone close by, flickering them a half-step out of the present at the critical moment. Once per Short Rest as a Swift Action, choose a creature within 6 spaces. The next time that creature would take damage before the start of your next turn, that damage is prevented entirely." },
          { name: "Phase Step", text: "You can collapse the space between two points by stepping through the static between them. Once per Short Rest as a Swift Action, you teleport up to 6 spaces to an unoccupied space you can see. You leave behind a brief afterimage that lingers for 1 round, granting Edge on the next Stealth check you make before the start of your next turn." },
          { name: "Disturbance Compass", text: "The instruments need calibration. You do not. You passively sense the presence and direction (though not the exact location) of any Flow Disturbance, active Invocation, or planar instability within 12 spaces, even through walls and floors, and you gain Edge on Awareness and Esoterica checks made to classify what you are feeling. You cannot turn this off, which is why Phasebound trade warnings like weather reports." },
          { name: "Moment Echo", text: "Places remember, and you are tuned to the frequency they remember on. Once per Short Rest, by spending one uninterrupted minute at a location, you can witness a brief, fragmentary sensory echo of the most significant event that occurred there within the last 24 hours: a few seconds of sound, movement, and emotional residue. The GM decides what qualifies as significant, and the echo shows what happened, not why. You make a deeply inconvenient witness." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who feels danger before the world admits it exists.",
          "You like mechanics that bend reality, manipulate space, and heighten awareness.",
          "You want roleplay tension around trusting instinct over evidence and bearing a mysterious strain.",
          "You want a connection to the Flow, ancient bloodlines, and the hidden ruins of Elyndra."
        ],
        hooks: [
          "1. You keep seeing the same alley collapse three seconds before it happens, but every time you prevent it, the vision returns somewhere worse.",
          "2. A Flow scholar believes your bloodline is tied to a buried ruin beneath Elysium, and their research team disappeared after mapping your family tree.",
          "3. You warned a crew not to take a job, they ignored you, and now their ghosts keep appearing at the edges of your vision asking why you survived.",
          "4. A corporate hazard team wants to license your senses as a predictive safety tool, which sounds harmless until they start testing you in live disaster zones.",
          "5. Your body flickers out of phase whenever you sleep, and something on the other side has started learning your name.",
          "6. You felt a future version of yourself die in a place you have never been, holding a weapon you have not purchased yet."
        ]
      }
    ]
  },
  {
    key: "verdine",
    name: "Verdine",
    glance: {
      origin: "Cultivated in corporate high-rise labs or germinated in the untamed soil of reclaimed ruins",
      nature: "Bioengineered plant based organic hybrids.",
      communities: "Groves centered around massive filtration stacks or undercity waste channels.",
      reputation: "Patient guardians, walking toxin detectors, and greenwall specialists.",
      corporateClassification: "Engineered Ecological Filters. Corporations see them merely as a collection of walking, talking air purifiers whose original corporate patents have unfortunately expired.",
      flowConnection: "spores, and seasonal growth cycles, treating it as an extension of their biology.",
      commonLineages: "Arboreal, Floral, Mycelial"
    },
    blurb: "Verdine were created as living infrastructure, then became something far more difficult to manage: people with long memories.",
    traits: {
      size: "Small to Large: Height varies drastically by lineage. Mycelial stand around 3 to 4 feet tall, Florals range from 5 to 6 feet, and Arboreals can tower up to 8 feet.",
      languages: "Common Trade and Root-code, a chemical and tactile language shared among Verdine and ancient flora.",
      coreTrait: {
        name: "Ecological Filter (Passive)",
        text: "Your body aggressively scrubs toxins from your system. You are entirely immune to ambient environmental smog, and you treat all Toxic damage as if you have Resistance against it."
      },
      secondaryTrait: {
        name: "Rooted Stance (Active)",
        text: "As an Impulse Action when forced to move by an enemy or an environmental hazard, you can rapidly drive micro-roots into the floor. You immediately cancel the forced movement and cannot be knocked Prone until the end of your next turn."
      }
    },
    lineages: [
      {
        key: "arboreal",
        name: "Arboreal",
        description: "Slow, steady sentinels spliced with ancient hardwood titans, built for endurance and defensive presence.",
        features: [
          { name: "Ironbark Carapace", text: "Your dense outer layer absorbs pressure that would break lesser beings. You gain a permanent natural Damage Reduction of 2 against Standard Physical Damage, which stacks with any worn light or medium armor." },
          { name: "Timber Fortitude", text: "Your psychology operates on the scale of centuries. You are entirely immune to the Frightened condition, and you cannot be chemically or magically compelled to act impulsively against your crew." },
          { name: "Canopy Reach", text: "Your limbs contain dense, rapidly extending fibrous vines. Your unarmed strikes and melee weapons gain an additional 1 space of reach, and you gain Edge on any checks made to grapple or physically restrain a Target." },
          { name: "Deep Roots", text: "Your body craves the minerals of the undercity infrastructure. While you are in physical contact with raw earth, foundational concrete, or structural steel, you cannot be forcibly moved or knocked Prone. Additionally, during a Short Rest taken in contact with such material, you draw latent nutrients from the environment, automatically restoring additional Vitality equal to your Caliber beyond your normal Resilience Die roll." },
          { name: "Sapflow Regrowth", text: "Living sap surges through the cracks in your bark, knitting splintered fibers back together. As a Swift Action, roll your Resilience Die and restore Vitality equal to the result plus your Caliber. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Grasping Roots", text: "You drive a lattice of roots up through the floor around you. Once per scene as a Swift Action, every space within 2 spaces of you becomes Difficult Terrain until the start of your next turn. While the lattice holds, you can attempt to grapple or restrain any Target within that area as though it were adjacent to you, and you gain Edge on those checks." },
          { name: "Seismic Sense", text: "Through the soles of your feet and the roots beneath your skin, you read the tremors of everything moving on solid ground. While you are in contact with the ground, a floor, or any connected structure, you automatically sense the location of any creature within 8 spaces that is also in contact with that surface, even through walls or total darkness. This sense does not detect flying, climbing, or levitating creatures. No action required." },
          { name: "Living Bulwark", text: "You are the wall the crew shelters behind, and you grew that way on purpose. Ranged attacks against allies adjacent to you take Snag, as your trunk and limbs break every clean line of fire. Additionally, once per Encounter as an Impulse Action when an adjacent ally is hit by an attack, you can twist your body into the blow; reduce the damage dealt to that ally by your Body modifier + your Caliber as your bark takes what was meant for them." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who serves as an immovable physical anchor for their crew.",
          "You like mechanics that focus on damage reduction, massive reach, and defensive endurance.",
          "You want roleplay tension around long-term planning versus the fast-paced demands of the sprawl.",
          "You want a connection to Elysium's ancient green infrastructure and heavy filtration wards."
        ],
        hooks: [
          "1. The filtration stack you swore to protect has begun producing clean air with the scent of burning sap, and the oldest roots beneath it are afraid.",
          "2. A corporation wants to relocate you as a \"living heritage asset,\" which is a polite way of saying they intend to uproot you and charge admission.",
          "3. You made a century promise to guard a grove, but the city has changed around it, and now keeping that promise may start a district war.",
          "4. A child carved their name into your bark during a siege years ago, and now that name has appeared on a corporate casualty list dated next week.",
          "5. Your body has begun growing rings from memories that are not yours, each one marking a disaster from before your germination.",
          "6. A rival grove has accused you of abandoning your ward, and the only way to clear your name is to retrieve the roots stolen from the ruins."
        ]
      },
      {
        key: "floral",
        name: "Floral",
        description: "Vibrant, mobile diplomats and undercover assets built for reach and social expression.",
        features: [
          { name: "Pheromone Bloom", text: "You thrive in the center of attention. Once per Encounter as a Swift Action, you release targeted pheromones, forcing an organic Target within 2 spaces to make a Wits Save (8 + your Charm modifier + your Caliber). On a failure, they are Charmed by you for 1 minute or until they take damage." },
          { name: "Venom Nectar", text: "Your vibrant coloring is a biological warning. When an enemy hits you with a melee attack, you can use an Impulse Action to secrete a volatile sap. The attacker takes 1d4 Toxic damage and must make a Body Save (8 + Body Modifier + Caliber) or suffer Snag on their next attack roll due to the stinging fumes." },
          { name: "Briar Strike", text: "Your elegance hides a lethal defense; your limbs are layered with retractable, needle-sharp thorns. Your unarmed strikes deal 1d6 Piercing or Slashing damage (your choice each turn) and possess the Light and Finesse properties. On a critical hit with this natural weapon, the Target gains the Bleeding condition as the thorns shred through their clothing and skin." },
          { name: "Scent Marker", text: "You can secrete a highly specialized, invisible pheromone sap that is completely undetectable to baseline humans and standard security scanners. By touching a Target or slipping the sap onto their clothing, you permanently tag them. For the next 48 hours, you perfectly track their scent within a one-mile radius, and you gain Edge on any checks made to hunt them down through the sprawl." },
          { name: "Pollen Haze", text: "You flood the air around you with a heady cloud of disorienting pollen. Once per Encounter as an Action, each organic creature of your choice within 2 spaces must make a Wits Save (8 + your Charm modifier + your Caliber). On a failure, until the end of its next turn the creature takes Snag on its attack rolls and cannot take Impulse Actions. On a success, it instead takes Snag on its next attack roll only." },
          { name: "Envenomed Thorns", text: "You flood your thorns with concentrated toxin before you strike. As a Swift Action, your unarmed strikes and melee weapons deal an additional 1d4 Toxic damage until the end of your turn, and the first organic Target you damage this way must make a Body Save (8 + your Body modifier + your Caliber) or take an additional 1d4 Toxic damage at the start of its next turn as the poison spreads. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Olfactory Insight", text: "Your sense of smell parses the chemical tells of every living thing nearby: fear-sweat, adrenaline, sickness, deceit. You can never be Surprised by an organic creature, and you automatically detect the presence (though not the exact location) of any organic creature within 6 spaces, even one that is hidden, invisible, or behind cover. Additionally, you gain Edge on any check made to determine whether an organic Target you can smell is lying or afraid. No action required." },
          { name: "Scent Speech", text: "You communicate through controlled pheromone release. You can transmit emotions and basic concepts (danger, safety, direction, hostility, urgency) to anyone within 6 spaces as long as they are willing, bypassing language barriers and requiring no action. Targets that have never encountered Floral pheromones before may receive only impressions rather than clear meaning. Additionally, when you spend at least 1 minute in face-to-face conversation with an organic Target, you can subtly attune your pheromones to their emotional state, granting you Edge on Charm (Persuasion, Deception, Insight, or Intimidation) checks against that Target for the rest of the scene." },
          { name: "Bloom Pulse", text: "Once per Long Rest as an Action, you bloom briefly, releasing a wave of restorative spore-light. You and all allies within 2 spaces regain Vitality equal to your Mystique modifier + your Caliber." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who dominates social spaces and tracks favors across the city.",
          "You like mechanics that manipulate enemies, apply debuffs, and leverage chemical influence.",
          "You want roleplay tension around sensory overload, manipulation, and chasing new stimuli.",
          "You want a connection to the diplomatic and undercover networks of the Verdine groves."
        ],
        hooks: [
          "1. A corporate socialite has become addicted to your pheromone signature and is using their influence to have you legally classified as a controlled substance.",
          "2. You tagged a Target with your scent marker, but the trail now splits into six identical paths leading to six different bodies.",
          "3. A gala invitation arrives addressed to a name you only used during an undercover job that was supposed to leave no survivors.",
          "4. Someone is synthesizing your unique scent profile and using it to manipulate diplomats, frame groves, and start quiet wars.",
          "5. Your bloom cycle has shifted out of season, signaling either a rare biological change or exposure to something the city has not identified yet.",
          "6. A powerful executive wants you as a living status symbol, but their spouse wants you as an assassin, and both offers arrive with matching blackmail."
        ]
      },
      {
        key: "mycelial",
        name: "Mycelial",
        description: "Quiet forensic specialists and information brokers inhabiting the forgotten waste channels of the city.",
        features: [
          { name: "Fungal Network", text: "You claim the undercity infrastructure as your nervous system. You can communicate telepathically with any willing ally within 12 spaces, provided both of you are touching a connected continuous surface like the ground, a structural beam, or the same wall. Additionally, while you are in contact with such a surface, you have Tremor Sense within 6 spaces, allowing you to detect the position and approximate size of anyone also in contact with that surface, even through walls or floors." },
          { name: "Decay Whisper", text: "You treat rot as valuable information. By spending one minute physically touching a biological corpse, you can absorb its residual chemical history. The GM must truthfully reveal the exact cause of death, the time of death, and one fragmented sensory memory from the Target's final moments." },
          { name: "Spore Hallucination", text: "You exhale invisible, psychoactive spores. As an Action, you force an organic Target within 2 spaces to make a Wits Save (8 + your Body modifier + your Caliber). On a failure, their senses warp drastically, causing them to view their allies as terrifying threats or perceive shifting hazards that are not there, granting them the Confused condition for 1 minute. The Target repeats the Save at the end of each of their turns, ending the effect on a success." },
          { name: "Sludge Crawler", text: "Your anatomy is composed of flexible, fibrous fungal tissue rather than a rigid skeleton. You ignore all movement penalties caused by mud, grease, or chemical sludge. Because your body can compress so easily, you count as one Size smaller when navigating narrow corridors or tight spaces, slipping through ventilation grates and drainage pipes at your full Speed." },
          { name: "Infesting Spores", text: "You drive a cluster of aggressive spores into an open wound or an unguarded mouth. As an Action, choose an organic Target within 2 spaces; it must make a Body Save (8 + your Body modifier + your Caliber) or take 1d6 Toxic damage immediately and a further 1d6 Toxic damage at the start of each of its turns as the colony spreads through it. At the end of each of its turns, the Target repeats the Save, ending the effect on a success. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Distributed Anatomy", text: "Your vital functions are spread throughout a web of fungal tissue, with no single organ to rupture. You cannot suffer a critical hit (an attack that would critically hit you deals normal damage instead), you are immune to the Bleeding condition, and you take half damage from Toxic damage. No action required." },
          { name: "Choking Miasma", text: "You belch a thick, clinging cloud of caustic spores. Once per Encounter as an Action, fill a 2-space radius area within 6 spaces of you with spores until the end of your next turn. The cloud blocks line of sight through it, and any organic creature that begins its turn inside it or first enters it on a turn takes 1d4 Toxic damage. You and your allies can see and breathe freely through your own spores." },
          { name: "Decomposer's Touch", text: "Your touch can accelerate decay in organic and unstable synthetic matter. Once per Short Rest as an Action, you corrode a single organic, wood-based, or low-grade polymer object (door, rope, plastic conduit, wooden cover). It becomes Fragile. The next attack, heavy force, or significant pressure destroys it immediately. This has no effect on metal, plasteel, or shielded materials." },
          { name: "Spore Archive", text: "A room you have seeded never stops talking to you. Once per Long Rest, you can spend one minute exhaling a colony of inert microspores across an Area 2, invisible to the naked eye and undetectable by standard scanners. The colony lives for 24 hours. When you return and physically touch any surface within the seeded area, the GM truthfully summarizes who entered the area while the colony lived and one significant thing that was said or done there. You also know immediately, by taste in the air, whether anyone has attempted to scrub, burn, or sterilize your colony before its time." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who uncovers secrets through forensics and silent observation.",
          "You like mechanics that focus on infiltration, telepathy, and extracting information from the dead.",
          "You want roleplay tension around operating in the dark, forgotten corners of Elysium.",
          "You want a connection to the waste corridors, morgues, and deep undercity architecture of Elysium."
        ],
        hooks: [
          "1. You touched a corpse and heard your own voice in its final memory, warning you not to trust the body you were standing over.",
          "2. A section of the undercity fungal network has gone silent, and every Mycelial who enters the dead zone comes back speaking in someone else's memories.",
          "3. A morgue technician has been selling bodies before you can read them, erasing evidence that points to a corporate plague trial.",
          "4. You found a hidden route through the sludge channels that bypasses every checkpoint in the district, but something massive is molting down there.",
          "5. A surface crime boss wants you to prove a murder, while the victim's final sensory memory begs you to keep the truth buried.",
          "6. Your spores have started carrying messages from an ancient root system under Elysium, and the messages are becoming less like warnings and more like orders."
        ]
      }
    ]
  },
  {
    key: "clankers",
    name: "Clankers",
    glance: {
      origin: "Sparked into sentience when Flow entities (Nixies and Gremlins) tangled with corporate automaton cores.",
      nature: "Fully inorganic, synthetic life with a digitized consciousness and zero organic heritage.",
      communities: "Shop floors, server hubs, unit rosters, and underground networks of mutual upkeep.",
      reputation: "Met with apprehension; citizens never know if a machine is executing code or possessing a soul.",
      corporateClassification: "Cognitive Anomalies. Treated as a massive defect to be studied, contained, or violently erased.",
      flowConnection: "Hardware is bypass tuned to safely carry resonance; they suffer Resonant Dissonance instead of Organic Rejection from aftermarket cyberware.",
      commonLineages: "Laborframes, Durabodies, Lifelikes"
    },
    blurb: "Clankers are the accident the corporations cannot reproduce. They are not uploaded humans, not standard artificial intelligences, and not malfunctioning appliances with delusions of personhood.",
    traits: {
      size: "Varies by chassis. Laborframes are broad and tall; Durabodies are boxy; Lifelikes feature near-human silhouettes.",
      languages: "Common Trade and Machine Cant, a rapid, compressed burst-code used for silent data exchange between synthetics over short distances.",
      coreTrait: {
        name: "Machine Physiology (Passive)",
        text: "You are fully inorganic. You are immune to biological diseases, organic poisons, and toxic gases. You do not need to eat, breathe, or sleep in the traditional sense, requiring only to enter a low-power mode to recharge."
      },
      secondaryTrait: {
        name: "Resonant Circuitry (Active)",
        text: "Standard factory hardware cannot safely process metaphysical loads. Your resilience is the direct result of your awakening: a Gremlin haphazardly rewired your internal surge protectors, while a Nixie smoothed the chaotic current to keep your core from melting. When subjected to an EMP, digital virus, or Tech damage, you can use a Swift Action to forcefully ground the feedback through this supernatural bypass, granting yourself Edge on the resulting Saving Throw."
      }
    },
    lineages: [
      {
        key: "laborframes",
        name: "Laborframes",
        description: "Overbuilt industrial chassis designed for heavy lifting and relentless physical work.",
        features: [
          { name: "Heavy Payload", text: "You count as one Size larger for determining Encumbrance Thresholds and grappling, and gain Edge on all checks made to lift wreckage, pry open doors or collapsed structures, or drag a creature to safety, and carrying a willing creature of your Size or smaller does not reduce your Speed. Additionally, once per Encounter as an Action, you can automatically free one creature within 1 space of you from a grapple, physical restraints, or pinning debris, no roll required, and move them 1 space to a safer position as you set them down." },
          { name: "Vice Grip", text: "Your hands are built for crushing force and absolute stability. You have Edge on all checks to maintain a grapple or prevent yourself from being disarmed. Once per turn, when you have a Target Grappled, you can crush them as a Swift Action, dealing 1d6 + your Body modifier Bludgeoning damage." },
          { name: "Lockpoint Stance", text: "You can mechanically lock your joints to become an immovable object. As an Impulse Action, you anchor yourself to the ground. You cannot be forcibly moved or knocked Prone until you choose to unlock your joints as a Free Action." },
          { name: "Demolition Engine", text: "Your chassis is designed to break down hardened materials. Your unarmed strikes and melee attacks deal double damage to physical structures, doors, and environmental cover. Additionally, when you take the Attack Action against a Target, you can choose to make a single attack against the Target's worn armor or shield instead of the Target itself. On a hit, the armor's DR is reduced by 1 until repaired during Downtime (minimum 0). A given piece of armor cannot have its DR reduced below 0 by this feature." },
          { name: "Self-Repair Protocol", text: "Your chassis reroutes power to seal breaches and reset damaged servos. As an Action, you restore Vitality equal to your Resilience Die roll plus your Body modifier. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Hydraulic Throw", text: "With the leverage of industrial pistons, you can hurl whatever you hold. As an Action, you can throw a creature you have Grappled or an unattended object of your Size or smaller up to 4 spaces. A thrown creature takes 1d8 Bludgeoning damage and is knocked Prone. If you throw it into another creature along the way, that second creature takes the same damage, and you choose which of the two is knocked Prone. You can throw a creature only if it is your Size or smaller." },
          { name: "Piston Slam", text: "You drive your full weight into the ground, sending a shockwave through the floor. Once per Encounter as an Action, each creature of your choice within 2 spaces must make a Body Save (8 + your Body modifier + your Caliber) or take 1d8 Bludgeoning damage and be knocked Prone. Structures and unsecured objects within that area take damage as though struck by your melee attack." },
          { name: "Integrated Toolframe", text: "Your chassis houses a fold-out industrial suite: cutter, welder, clamp, spotlight, diagnostic leads. You always count as carrying basic engineering tools, you gain Edge on Engineering checks made to build, repair, brace, or dismantle heavy machinery and structures, and given one minute of uninterrupted work you can cut or weld through a standard door, chain, or fence panel without any external kit. The work is never quiet, but it is always done." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who serves as the immovable physical anchor for their crew.",
          "You like mechanics that focus on grappling, heavy weapons, and structural demolition.",
          "You want roleplay tension around labor rights, corporate ownership, and shop floor solidarity.",
          "You want a connection to the heavy industry, cargo bays, and industrial unions of Elysium."
        ],
        hooks: [
          "1. Your old factory line has voted to strike, but the corporation plans to solve the problem by remotely deactivating every awakened unit on the floor.",
          "2. You were built to move a sealed cargo container that nobody was allowed to scan, and now the container is missing from your memory but not from your manifest.",
          "3. A younger Laborframe is trapped under loyalty firmware and begging you, in Machine Cant, to make the next work accident look convincing.",
          "4. Your chassis still carries structural damage from holding up a collapsing deck, and the people you saved have been quietly paying your repair bills for years.",
          "5. A union safehouse has been compromised, and only you know which maintenance tunnels can evacuate the trapped workers before the corporate purge team arrives.",
          "6. Someone is forging your serial number onto sabotage jobs across the industrial district, turning you into the face of a revolution you did not start."
        ]
      },
      {
        key: "durabodies",
        name: "Durabodies",
        description: "Armored security platforms built to survive explosions and heavy kinetic trauma.",
        features: [
          { name: "Blast Deflection", text: "Your angled plating deflects shrapnel. You take no damage from the splash or area-of-effect properties of explosives if you succeed on the associated Saving Throw, and you take only half damage on a failure." },
          { name: "Ablative Armor", text: "Your chassis features sacrificial outer plating. Once per Encounter, when you take physical damage, you can use an Impulse Action to violently shed an outer layer of armor, reducing the incoming damage by half." },
          { name: "Redundant Systems", text: "Your vital processing cores are duplicated and heavily shielded. When a critical hit is rolled against you, you can use an Impulse Action to convert it into a standard hit (the attack still deals normal damage, but no critical damage dice or critical effects are applied). You can use this feature a number of times per Long Rest equal to your Caliber." },
          { name: "Hazard Seal", text: "You can completely lock down your internal systems against environmental intrusion. You are immune to Acid and Toxic damage from chemical spills or weaponized sludge, and you can operate submerged in polluted or caustic liquids without penalty. This seal prevents internal flooding and chemical breakdown, but it does not grant resistance to extreme thermal hazards like lava or liquid nitrogen." },
          { name: "Guardian Protocol", text: "Your priority routines flag every threat to those beside you. When a creature within 2 spaces of you is hit by an attack, you can use an Impulse Action to interpose your plating and take that attack's damage yourself instead of the original Target. You may reduce this redirected damage with your other defensive features as normal." },
          { name: "Threat Projection", text: "You broadcast an overwhelming threat signature, daring enemies to ignore you at their peril. As a Swift Action, choose a creature within 6 spaces that can see or detect you. Until the start of your next turn, that creature has Snag on any attack roll that does not target you. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Breaching Charge", text: "You build momentum like a runaway machine and drive straight through whatever stands in your path. As an Action, you move up to your Speed in a straight line, passing through the spaces of any creature smaller than you and ignoring Difficult Terrain. The first creature you pass through or end your movement adjacent to takes 1d8 Bludgeoning damage and must succeed on a Body Save (8 + your Body modifier + your Caliber) or be knocked Prone." },
          { name: "Emergency Boot", text: "Once per Long Rest, when you would be reduced to 0 Wounds, you trigger an Emergency Boot sequence. You do not fall Unconscious and do not become Dying. You remain at 1 Wound, and at the start of your next turn you regain Vitality equal to twice your Caliber." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who charges into danger to protect their squad.",
          "You like mechanics that mitigate massive damage, ignore critical hits, and resist environmental hazards.",
          "You want roleplay tension around the psychological toll of being a living shield.",
          "You want a connection to private military contractors, security forces, and underground motor pools."
        ],
        hooks: [
          "1. Your old squad's helmet-cam archive was recovered, and the footage proves your employer deliberately sent them into a kill box.",
          "2. A fragile organic you once shielded has become a corporate executive, and they now want you erased because you remember who they used to be.",
          "3. Your redundant systems keep replaying the final tactical orders from a mission you survived, but the orders are changing with each playback.",
          "4. A black market armor tech claims they can restore your original plating, but the replacement panels were pulled from Durabodies who are still conscious.",
          "5. You are asked to protect a protest against the same security division that built you, trained you, and still knows your factory blind spots.",
          "6. Your threat assessment software has flagged a harmless child as a catastrophic risk, and now you need to find out what future the system thinks it is preventing."
        ]
      },
      {
        key: "lifelikes",
        name: "Lifelikes",
        description: "Immaculate synthetic bodies designed for deep social infiltration and espionage.",
        features: [
          { name: "Empathy Emulator", text: "Your systems perfectly mimic human responses to manipulate expectations. You gain Edge on Deception checks when using fake emotions, such as crying or feigning outrage, to distract a Target. Additionally, your sensors track pupil dilation and heart rate, alerting you when an organic Target experiences a sudden spike in stress and granting you Edge on the subsequent check to determine if they are lying." },
          { name: "Biometric Spoofing", text: "Your synthetic flesh and auditory processors recalibrate to mimic an exact individual, down to the measurements. By observing an organic Target for 10 minutes, you scan and save their physical and vocal profile as a Persona. You can store a number of Personas equal to your Caliber score, you can overwrite a saved Persona at any time (deleted files require a new physical scan to recover), and a saved Persona decays and becomes obsolete after 30 days as organics change and corporate security updates. While assuming a Persona, you gain Edge on Systems and Deception checks to bypass retinal scanners, fingerprint locks, facial recognition, and voice verification." },
          { name: "Vital Static", text: "Every sign of life in your body is a setting, and you know where the off switch is. As an Action, you suppress your simulated pulse, breath, body heat, and micro-movements entirely, appearing to be a corpse or a powered-down chassis. While suppressed, you remain fully aware of your surroundings. You can hold this state for up to one hour and end it as a Free Action, acting normally on the same turn you wake. Any check made by a living creature to determine that you are alive or active is an opposed check against your Deception, no matter how trained they are. A machine scanner probing beneath the flesh makes the same opposed check but with Edge, since your synthetic internals never fully sleep." },
          { name: "Disarming Cadence", text: "Your voice is tuned to frequencies that quiet the animal part of the brain. You gain Edge on Charm checks made to calm, de-escalate, or reassure an organic Target. Additionally, once per Encounter as a Swift Action, you can direct a soothing subharmonic at one organic creature within 6 spaces that can hear you; it must make a Wits Save (8 + your Charm modifier + your Caliber) or take Snag on all attack rolls against you until the start of your next turn." },
          { name: "Cognitive Partition", text: "Your mind is a building with locked floors, and visitors only ever see the lobby. You gain Edge on Saves against being Charmed or having your mind read or influenced. Any telepathy, interrogation chemical, lie-detection system, or mind-reading effect that does breach your surface thoughts perceives only the thoughts, memories, and emotions of your active cover identity or Persona, fabricated by a sealed background process. You always know when something has attempted to read or influence your mind, even if the attempt failed." },
          { name: "Ghost Pulse", text: "Your synthetic signature can be buried so deep that even machines believe the lie. Once per Short Rest as a Swift Action, you mask your nature for the rest of the scene: scanners, sensors, and detection systems of Tier 2 or lower (commercial and civilian grade) read you as a baseline organic human, and abilities or devices that specifically detect synthetics, constructs, or machines fail against you automatically. Systems of Tier 3 or higher (corporate or military grade) must succeed on an opposed Tech check against your Deception to flag the anomaly." },
          { name: "Method Actor", text: "You do not wear a face. You become its owner. By observing an individual for 10 minutes, you study and save their behavioral profile as a Persona. You can store a number of Personas equal to your Caliber score, you can overwrite a saved Persona at any time (deleted profiles require fresh observation to recover), and a saved Persona decays and becomes obsolete after 30 days as people change. While assuming a Persona, you reproduce their mannerisms, gait, signature, vocabulary, and social reflexes. You gain Edge on Charm and Deception checks made to convince people who personally know that individual that you are them, and the first time in a scene someone would grow suspicious of your impersonation, you may force them to reroll the check that triggered their suspicion." },
          { name: "Killer Confidant", text: "You are most dangerous to the people who trust the face in front of them. When you attack a Target that is Charmed by you, considers you an ally, or is unaware you are a threat, you gain Edge on the attack roll and deal an additional 1d6 damage on a hit. A Target damaged by this feature is immune to it until you spend at least one scene rebuilding its trust." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who dominates social encounters and infiltrates high-security zones.",
          "You like mechanics that emphasize deception, physical transformation, and stealth.",
          "You want roleplay tension around losing your own identity while wearing the faces of others.",
          "You want a connection to corporate espionage, high-society galas, and underground hacking networks."
        ],
        hooks: [
          "1. One of your saved Personas has started appearing in your dreams, insisting they were a real person and that you stole more than their face.",
          "2. A biometric scanner identifies you as a missing executive, granting you access to a fortune and making every heir in the family want you dead.",
          "3. Your original handler claims your current personality is just a cover identity that has run too long, and they have brought proof you are afraid to read.",
          "4. You were hired to impersonate someone at a gala, only to discover the real person is also there, watching you from across the room.",
          "5. A Lifelike jailbreak network has gone dark after exposing a loyalty protocol, and the last message includes your oldest factory designation.",
          "6. Your empathy emulator has begun producing emotional responses you did not select, especially around one Target you were supposed to manipulate."
        ]
      }
    ]
  },
  {
    key: "chimera",
    name: "Chimera",
    glance: {
      origin: "Engineered by old world governmental powers during the final global wars.",
      nature: "Spliced organic hybrids possessing human intelligence and animalistic instinct.",
      communities: "Insular, fiercely loyal clutches ranging from undercity warrens to high altitude courier networks.",
      reputation: "Practical and highly adaptable survivors who view the city through a tactical lens of predator, prey, and profit.",
      corporateClassification: "Rogue Bio-Assets. The modern corporate elite view the Chimera as illegal, unpatented genetic material and highly dangerous feral remnants of old world military bio-weaponry, often classifying their communities as hazardous infestations rather than recognized citizens.",
      flowConnection: "Their connection to the Flow is intensely physical and primal. They experience the metaphysical current as raw survival instinct, scent, and adrenaline.",
      commonLineages: "The Hulsk, The Skarn, The Ryn"
    },
    blurb: "Chimera were made for an apocalypse they did not cause. The old world called them breakthroughs, assets, survival platforms, battlefield adaptations, and other clean words for people grown to suffer efficiently.",
    traits: {
      size: "Small to Large, ranging from 3.5 feet to well over 6 feet tall depending on Lineage.",
      languages: "Common Trade and one pack-specific dialect that relies heavily on physical gestures, scent markers, and micro-expressions.",
      coreTrait: {
        name: "Feral Metabolism (Passive)",
        text: "Your spliced DNA ensures aggressive cellular recovery and processing. You can safely consume raw or spoiled meat without gaining the Poisoned condition, and whenever you spend a Resilience Die to heal Vitality during a Short Rest, you automatically regain an additional amount of Vitality equal to your Body modifier."
      },
      secondaryTrait: {
        name: "Spliced Instinct (Active)",
        text: "Your body reacts to danger before your conscious mind processes it. When you roll Initiative, you can immediately move up to half your Speed as a Free Action to seek cover or close the distance to a threat."
      }
    },
    lineages: [
      {
        key: "hulsk",
        name: "The Hulsk",
        description: "Massive merchants and mercenaries spliced with boar, grizzly bear, and wolf DNA to weather the apocalypse.",
        features: [
          { name: "Hulskpitality", text: "Among the Hulsk, the table is law, and something old in the Flow agrees with you. A creature that has accepted your freely offered food, drink, or shelter within the last 24 hours takes Snag on attack rolls against you and anyone you have formally declared to be under your protection, until you or one of your declared charges harms them first. Additionally, you gain Edge on checks made to negotiate, settle disputes, or extract honest dealing from anyone currently sharing a meal or a roof you have provided. Breaking bread with a Hulsk has always meant something, and bodies have a way of remembering it." },
          { name: "Brutal Frame", text: "Your unarmed strikes deal 1d6 Bludgeoning damage, and when you hit a Target with an unarmed strike, you deal an additional 1d4 Bludgeoning or Slashing damage (your choice). If the Target is smaller than you, you may also push them 1 space away from you." },
          { name: "Slaughterhouse Charge", text: "Your heavy musculature is built for explosive charges. When you use the Dash Action and move at least 3 spaces in a straight line, you can make a melee attack as a Free Action. On a hit, the Target takes an additional 1d6 damage and must make a Body Save (8 + your Body modifier + your Caliber) or be knocked Prone." },
          { name: "Ironhide Tusks", text: "You have thick, gristle-layered skin and natural bone protrusions. You gain a natural Damage Reduction of 1 against Standard Physical damage, which stacks with any worn Light or Medium armor. Additionally, your powerful jaws can chew through reinforced bindings, plasticrete, or light metal fencing given a few minutes of uninterrupted gnawing." },
          { name: "Blood-Scent Tracker", text: "Your spliced nose was built to follow wounded prey across a dying world. You gain Edge on any check made to track a creature by scent, and you can follow a trail up to 24 hours old through the sprawl. Additionally, you automatically know the direction of any creature within 6 spaces that is Bleeding or below half its Vitality, even if it is hidden, invisible, or behind cover." },
          { name: "Survivor's Wrath", text: "Pain does not slow your bloodline. It focuses it. Once per Encounter, when you are reduced below half your Vitality, you may immediately regain Vitality equal to your Caliber as a Free Action, and you gain Edge on the next melee attack roll you make before the end of your next turn." },
          { name: "Unshakable Bulk", text: "Your low center of gravity and dense frame make you nearly impossible to move against your will. You gain Edge on Saves against being knocked Prone, Staggered, or forcibly moved, and moving through the space of a hostile creature smaller than you costs you no extra movement." },
          { name: "Apex Bearing", text: "Your physical presence reshapes any room you enter. While you are within sight of an organic Target who can see you, you gain Edge on Charm (Intimidation) and Charm (Persuasion) checks made to negotiate trade, settle disputes, or extract compliance through implied threat. Additionally, once per Encounter as a Swift Action, you can make a focused stare at one Target within 6 spaces. If they have not yet acted this turn, they must succeed on a Wits Save (8 + your Charm modifier + your Caliber) or hesitate, losing their Action this turn (they can still Move and use Swift Actions). A Target that succeeds on this Save is immune to your Apex Bearing for the rest of the Encounter." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who physically dominates close quarters and controls the battlefield.",
          "You like mechanics that focus on charging, durability, and raw melee power.",
          "You want roleplay tension around a violent past evolving into honorable commerce.",
          "You want a connection to the merchant caravans and mercenary companies of the sprawl."
        ],
        hooks: [
          "1. A trade route marked in your lineage tattoos has vanished from every map, but caravans still arrive from it carrying goods no one remembers selling.",
          "2. Your family was once branded as raiders, and now a district council wants you to negotiate peace with the descendants of the people they harmed.",
          "3. A rival merchant house challenged your honor by poisoning a guest under your protection, forcing you to choose between revenge and keeping the route open.",
          "4. Your tusks can chew through a sealed old world vault, and three factions have offered payment before revealing what they believe is locked inside.",
          "5. A young Hulsk warband has started raiding again under your clan's colors, either to disgrace you or force you back into old ways.",
          "6. You inherited a caravan debt that can only be repaid by escorting a shipment through territory where your bloodline is still remembered as the enemy."
        ]
      },
      {
        key: "skarn",
        name: "The Skarn",
        description: "Compact, twitchy survivalists spliced with reptilian and avian-dinosaur DNA.",
        features: [
          { name: "Neon Chameleon", text: "Your proto-feathers and scales naturally bend ambient light. As a Swift Action while in cover, you can match your surroundings, imposing Snag on all ranged attacks against you until you move or attack." },
          { name: "Warmblood Sense", text: "You possess heat-sensing receptors along your jawline. You ignore the Invisible and Hidden conditions for any living, heat-producing target within 6 spaces of you." },
          { name: "Butcher Spurs", text: "Your digitigrade kicks end in lethal, curved claws. Your unarmed strikes deal 1d6 Slashing damage. Once per turn, when you hit a Target with this natural weapon, you reduce their Speed by 2 until the start of your next turn." },
          { name: "Prey Stalker's Grip", text: "Your hands and feet are covered in micro-barbed scales designed for ambush climbing. You gain a climb speed equal to your base walking Speed, and you can hang suspended from ceilings or overhangs while leaving your hands completely free to fire weapons or hack terminals." },
          { name: "Flock Tactics", text: "Your splice was never designed to hunt alone. You gain Edge on melee attack rolls against a Target while at least one of your allies is within 1 space of it and that ally is not Incapacitated. A fair fight is a planning failure; a surrounded one is a plan." },
          { name: "Pouncing Strike", text: "You kill on the way down. Your jumping distance is doubled, and you take no fall damage from drops of 4 spaces or less. When you move at least 2 spaces by jumping, dropping, or descending from a climb and then hit a Target with a melee attack on the same turn, the attack deals an additional 1d6 damage and the Target must succeed on a Body Save (8 + your Body modifier + your Caliber) or be knocked Prone." },
          { name: "Shed Tail", text: "Like the lizards in your splice, you can leave a piece of yourself behind to survive. Once per Long Rest as an Impulse Action when you are Grappled or Restrained, or when you are hit by a melee attack, you detach your tail: you automatically escape any grapple or restraint, you take half damage from the triggering attack (if there was one), and you may immediately move up to half your Speed without provoking Opportunity Attacks. The thrashing tail occupies your attacker's attention for a heartbeat, and your tail fully regrows over your next Long Rest." },
          { name: "Venom Strike", text: "You can inject a paralytic venom through your bite or spurs. When you hit a Target with an unarmed strike, you may inject venom. The Target must make a Body Save (8 + your Body modifier + your Caliber) or take 2d6 Toxic damage and be Poisoned for 1 minute. The Target repeats the Save at the end of each of their turns, ending the Poisoned effect on a success. You can use this feature a number of times equal to your Caliber per Long Rest." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who dominates the dark and fights entirely on their own terms.",
          "You like mechanics that focus on stealth, sensory advantages, and lethal ambush tactics.",
          "You want roleplay tension around chaotic curiosity mixed with profound paranoia.",
          "You want a connection to the dark warrens, tunnel networks, and scavenging clutches of the undercity."
        ],
        hooks: [
          "1. One of your old trap networks has started resetting itself, improving itself, and killing people you never marked as enemies.",
          "2. Your clutch found a maintenance shaft leading into a buried military bunker, but everyone who enters returns with the same new habit: speaking in old command codes.",
          "3. You sold a map of undercity routes to a fixer, and now entire tunnels are collapsing exactly where your notes said they were safest.",
          "4. A corporate pest control division has classified your clutch as an infestation, and their extermination plan is built from stolen Skarn tactics.",
          "5. You discovered that one of your safehouse tripwires was installed by someone else, using your methods, your materials, and your personal signature knot.",
          "6. The clutch voted to relocate, but your instincts say the new tunnels are bait, and nobody wants to hear another \"paranoid\" warning."
        ]
      },
      {
        key: "ryn",
        name: "The Ryn",
        description: "Hyper-kinetic physical couriers spliced with rabbit, feline, and vulpine DNA.",
        features: [
          { name: "Rabbitwire Reflex", text: "Your digitigrade legs operate on a biological pulley system of hyper-dense tendons. You ignore the movement penalties of Difficult Terrain when jumping or climbing. Whenever you spend a Swift Action to Dash, the stored kinetic energy doubles your jump distance for that turn, and you can leap directly out of an Enemy's melee reach without provoking an Opportunity Attack." },
          { name: "Cagebreak Instinct", text: "Your intense psychological aversion to confinement is backed by vicious, predatory cunning. If you are Grappled, Restrained, or physically backed into a corner with no obvious exit, your survival instincts spike. You gain Edge on all attacks and skill checks made to break free or incapacitate your captor. If you successfully escape a grapple, you can immediately move up to half your Speed as a Free Action." },
          { name: "Highground Hunger", text: "Driven by a deep psychological aversion to being confined on the ground, your feline reflexes take over when seeking high ground. You possess a climb speed equal to your walking Speed, and you take no falling damage from distances of 8 spaces or less, as your shock-absorbing ligaments automatically right your posture mid-air to land perfectly on your feet." },
          { name: "Hare-Trigger Instinct", text: "Your swiveling rabbit ears and slitted feline pupils constantly flood your brain with environmental data. You ignore visual Snag penalties in total darkness, and you cannot be Surprised while conscious. Additionally, as long as a Target is breathing, moving, or producing sound, you can pinpoint their exact location within 6 spaces, even if they are Invisible or Hidden from your other senses, provided you can theoretically hear them (the Target is not in a vacuum or an area of total silence)." },
          { name: "Slipstream Runner", text: "You were built to be gone before the hand closes. Your Speed increases by 2 spaces, and Opportunity Attacks made against you take Snag. Standing up from Prone costs you no movement; your body simply does not stay down." },
          { name: "Fox-Feint", text: "The vulpine part of your splice never runs in a straight line. Once per Encounter as a Swift Action, you misdirect one Enemy within 6 spaces with a flicked stone, a doubled shadow, or a half-step the wrong way. That Enemy must succeed on a Wits Save (8 + your Wits modifier + your Caliber) or lose track of you entirely: you are Hidden from them until the end of your next turn or until you attack, whichever comes first, even without cover." },
          { name: "Light-Fingered Relay", text: "Secrets move through your hands without ever appearing to be in them. You gain Edge on Sleight checks made to palm, plant, conceal, or hand off a small item, and anyone trying to spot the exchange must win an opposed Perception check against your Sleight. Additionally, once per turn you can draw, stow, or pass one small item to a willing creature within 1 space as a Free Action, smoothly enough that onlookers do not register that anything changed hands." },
          { name: "Courier's Memory", text: "You can carry messages, codes, locations, and instructions in your head with a precision that machines cannot match. You can memorize any document, image, audio recording, or sensory experience after observing it for at least 30 seconds. The memory is perfect for 7 days, and you can recall it exactly with no roll required. Additionally, when you carry a message verbatim from one party to another, you gain Edge on any Charm (Deception) or Charm (Persuasion) check made to convince the recipient that the message is genuine, even if the original sender used a coded form of communication." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who is impossible to pin down and thrives on speed.",
          "You like mechanics that focus on unparalleled mobility, escape, and vertical exploration.",
          "You want roleplay tension around adrenaline addiction, claustrophobia, and holding vital secrets.",
          "You want a connection to rooftop smuggler rings, the courier underground, and information brokerages."
        ],
        hooks: [
          "1. You delivered a package without opening it, and now every information broker in the city believes you know the secret it contained.",
          "2. A rooftop route only the Ryn use has been sealed with military drones, suggesting someone has mapped a courier path that was never written down.",
          "3. You woke up in a locked room with no visible exits, no memory of the last job, and a timer counting down on your wrist.",
          "4. A rival courier beat your impossible time across the vertical sprawl, then died delivering a message addressed to you.",
          "5. You are carrying living data that cannot survive digital transmission, and every minute you stay still increases the bounty on your head.",
          "6. Your old courier ring believes you abandoned a runner during a bad handoff, but the truth is locked in a package you swore never to open."
        ]
      }
    ]
  },
  {
    key: "outsiders",
    name: "Outsiders",
    glance: {
      origin: "Adjacent planes of existence, dragged across the divide by the awakening of the Flow.",
      nature: "Alien, extra-dimensional organic and elemental entities.",
      communities: "Tight knit, found family communities in the depths of the undercity.",
      reputation: "Universally misunderstood, feared as walking violations of local physics, but respected for their survival instincts.",
      corporateClassification: "Unregistered Extradimensional Assets. Denied legal personhood, corporations classify them as environmental hazards or metaphysical resources to be exploited or eliminated.",
      flowConnection: "Their emergence coincided with the awakening of the Flow, which fractured the boundary between realities and dragged them into Elysium.",
      commonLineages: "Cinder-Hearts, Harbingers, Grinlings"
    },
    blurb: "Outsiders do not belong here, which has not stopped them from making rent. They come from adjacent realities: mythic pressure zones, impossible stasis realms, predatory wonderlands, and stranger places that do not translate cleanly into local physics.",
    traits: {
      size: "Small to Large, varying drastically by Lineage.",
      languages: "Common Trade and one native, otherworldly dialect that relies on impossible frequencies, shifting colors, or non-vocal resonance that baseline humans cannot accurately replicate.",
      coreTrait: {
        name: "Cosmic Disconnect (Passive)",
        text: "Your mind and body operate on alien frequencies. You are entirely immune to telepathic mind-reading, and any standard biometric or corporate security scanners return corrupted, unreadable data when attempting to log your identity."
      },
      secondaryTrait: {
        name: "Reality Fracture (Active)",
        text: "Your physical form rejects local physics. You can step through a micro-tear in the Flow, instantly teleporting up to 6 spaces to an unoccupied space you can see. This leaves a temporary scar in reality that deals 1d4 Entropy damage to anyone standing adjacent to your departure point. You can use this feature a number of times equal to your Caliber per Long Rest."
      }
    },
    lineages: [
      {
        key: "cinder-heart",
        name: "Cinder-Hearts",
        description: "Beings of violent passion and fierce loyalty born from realms of extreme thermal pressure.",
        features: [
          { name: "Forge-Blooded", text: "Your blood idles like a furnace. You have Resistance to Fire damage. Additionally, when you are struck by a melee attack, your attacker takes 1d4 Fire damage from the searing heat radiating off your cracked, glowing skin." },
          { name: "Cauterizing Vitae", text: "Your thick, chemical-smelling blood sears everything it touches. When you take Piercing or Slashing damage, you can use an Impulse Action to spray your burning blood in an Area 1 Cone. Anyone in the cone must make an Agility Save (8 + your Body modifier + your Caliber) or take 1d6 Fire damage, and the hyper-heated blood rapidly melts through non-magical restraints, zip-ties, or ropes." },
          { name: "Volcanic Temper", text: "Your passions directly affect ambient temperature. Once per Encounter as a Swift Action, you vent your internal heat, turning the immediate Area 2 Sphere around you into a stifling, superheated zone for 1 minute. While the aura is active, Enemies within range suffer Snag on Wits and Will Saves as the oppressive heat scrambles their focus, and you gain Edge on Intimidation checks against them. The aura ends early if you fall Unconscious or move more than 12 spaces away from where you triggered it." },
          { name: "Fanatical Fervor", text: "Your violent loyalty manifests as physical combustion. When an ally you can see is reduced to 0 Vitality, you can immediately move up to half your Speed toward them as a Free Action, leaving a trail of ash and smoke. Your body runs so hot with adrenaline that your next attack before the end of your next turn deals an additional 1d8 Fire damage." },
          { name: "Smelter's Hands", text: "Your grip can do everything a forge can. A number of times equal to your Caliber per Long Rest, as a Swift Action, your hands glow forge-bright for 1 minute. While they burn, your unarmed strikes deal an additional 1d4 Fire damage, you can melt through light metal such as chains, padlocks, bars, or fencing with a few rounds of sustained grip, and you can press a glowing palm to a wound to instantly end the Bleeding condition affecting a creature you touch." },
          { name: "Hearthglow", text: "Your inner forge never fully cools, and the people you love gather around it. You and your allies within 2 spaces of you suffer no exhaustion penalties from freezing environments, and you shed dim, ember-colored light in a 2 space radius that you can suppress or rekindle at will with no action. Given a minute of contact, you can warm, dry, boil, or cook with your bare hands, and you gain Edge on Charm checks made to comfort, reassure, or build trust with someone sharing your warmth." },
          { name: "Cinder Shroud", text: "Your devotion ignites before your thoughts catch up. Once per Encounter as an Impulse Action when an ally within 2 spaces of you is hit by an attack, you flare violently, throwing a burst of embers, smoke, and rippling heat-haze between them and the attacker. Reduce the damage dealt to that ally by your Body modifier + your Caliber, and the attacker takes Snag on their next attack roll before the end of their next turn." },
          { name: "Volcanic Surge", text: "Once per Short Rest as a Swift Action, you channel a burst of your inner forge. Your next attack or Flow Invocation before the end of your next turn deals an additional 2d6 Fire damage. This extra damage ignores Resistance but not Immunity." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who leads with intense emotion and aggressive loyalty.",
          "You like mechanics that punish enemies for getting close and weaponize elemental damage.",
          "You want roleplay tension around managing a volatile temper in a fragile city.",
          "You want a connection to found families, undercity garages, or fanatical cults."
        ],
        hooks: [
          "1. Your body temperature has started rising every time you hear a specific corporate jingle, and the heat spikes are forming a pattern.",
          "2. A found family member betrayed you, and your blood keeps igniting whenever anyone says their name, making subtle revenge extremely difficult.",
          "3. An undercity cult has mistaken your thermal biology for divine fire, and their worship is becoming useful, dangerous, and hard to discourage.",
          "4. A garage that once sheltered you is being squeezed by a protection racket, and the owner refuses to ask for help because they know what you do to threats.",
          "5. Your blood can melt a restraint used in corporate prisons, so a resistance cell wants you captured on purpose to break someone out.",
          "6. You felt a pulse from your home plane during a firefight, and now every flame in the district leans toward the same abandoned building."
        ]
      },
      {
        key: "harbinger",
        name: "Harbingers",
        description: "Terrifyingly precise entities stepping from dimensions of crystalline quantum stasis.",
        features: [
          { name: "Calculated Execution", text: "You process reality perfectly. Before making an attack roll, ability check, or Saving Throw, you can declare a Calculated Execution. You treat the d20 roll as a natural 15, removing chance entirely to ensure an optimal outcome. Because the result is calculated rather than rolled, it can never be a critical hit. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "Frictionless Stasis", text: "Your body naturally rejects the messy reality of Elysium. Grime, corrosive acids, and adhesive foams simply slide off your skin and clothing. You are immune to the Grappled condition from sticky traps or biological webbing, and you take no ongoing damage from caustic environmental hazards once you step out of them. Additionally, liquids, powders, and forensic residue do not adhere to you; you leave no fingerprints, and blood and chemical markers slide off your body before they can set." },
          { name: "Algorithmic Insight", text: "You perceive the world as a strict physics equation. You can spend 1 minute observing a Target, security system, or physical structure. Afterward, the GM must truthfully reveal one structural flaw, a hidden vulnerability, or the exact routine of a patrol. You gain Edge on your next check to violently or socially exploit this weakness." },
          { name: "Uncanny Presence", text: "Your perfect symmetry and unblinking gaze trigger a deep, primal unease in native organic life. When you address a Target directly in a tone of command, challenge, or demand (interrogating, intimidating, negotiating, ordering, or threatening), you can force them to make a Will Save (8 + your Mystique modifier + your Caliber). On a failure, they are unnerved by your chilling precision, suffering Snag on all rolls made to lie to you, deceive you, or resist your commands for the remainder of the scene. Once a Target has succeeded on this Save against you, they are immune to your Uncanny Presence for 24 hours." },
          { name: "Hard Radiance", text: "Your crystalline structure stores the hard radiation of your home reality, and you can focus it into a lance of invisible, cell-shredding light. A number of times equal to your Caliber per Long Rest, as an Action, choose a Target within 6 spaces; it must make a Body Save (8 + your Mystique modifier + your Caliber), taking 2d6 Radiation damage and suffering Snag on its next attack roll on a failure, or half the damage with no Snag on a success. The lance passes through glass and thin barriers without losing focus." },
          { name: "Stasis Lock", text: "You impose a fragment of your home dimension's perfect stillness on a single point of this chaotic one. Once per Encounter as an Action, choose a creature you can see within 6 spaces; it must make a Will Save (8 + your Mystique modifier + your Caliber). On a failure, the Target is sealed in crystalline stasis until the end of its next turn: it cannot move, act, or be moved, and it takes half damage from all sources while sealed, frozen outside the flow of cause and effect. On a success, the drag of near-stasis still halves its Speed until the end of its next turn." },
          { name: "Axiomatic Mind", text: "Your consciousness is a closed, ordered system that this reality cannot corrupt. You are immune to the Confused condition, you always know exactly how much time has passed and where you are relative to where you have been, and you gain Edge on Saves against effects that would alter your perception, memory, or sense of what is real. Disorder happens around you, never inside you." },
          { name: "Immaculate Calibration", text: "You perceive the world in exact quantities: distances, weights, volumes, angles, and intervals of time, measured at a glance with machine precision, and you never miscount or misestimate. You gain Edge on any check that rewards exact precision, such as calibrating equipment, placing charges, picking mechanical locks, detecting forgeries, or spotting a deviation from a pattern. Additionally, after studying a physical pattern for one minute (a signature, a keycut, a circuit trace, a diagram), you can reproduce it exactly by hand. Approximation is a native concept here. It is not a native concept where you are from." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who relies on pure logic and chilling efficiency.",
          "You like mechanics that guarantee outcomes, exploit weaknesses, and ignore environmental hazards.",
          "You want roleplay tension around imposing strict order on a fundamentally chaotic city.",
          "You want a connection to corporate security, algorithmic accounting, or strict vigilante codes."
        ],
        hooks: [
          "1. You calculated the exact moment a district will collapse into violence, but every attempt to prevent it makes the equation cleaner.",
          "2. A corporate court wants you as an expert witness because your testimony cannot be read by biometric lie detection, only by consequences.",
          "3. You found a flaw in a person: one hidden vulnerability that explains every choice they have made, and now you cannot decide whether to use it.",
          "4. A vigilante group worships your sense of order and has begun executing people according to rules you mentioned once in passing.",
          "5. Your body has begun accumulating dirt, fingerprints, and corrosion for the first time, suggesting local reality is finally getting under your skin.",
          "6. You treated a roll of chance as an exact outcome and were wrong, which should be impossible, unless something in Elysium is altering probability around you."
        ]
      },
      {
        key: "grinling",
        name: "Grinlings",
        description: "Scrappy, hyperactive survivors hailing from a chaotic dimension of mischief and hyper-predators.",
        features: [
          { name: "Hyper-Kinetic Metabolism", text: "Your body is a coiled spring of excess adrenaline and alien biology. As a Free Action on your turn, you can willingly take 1d4 damage to purge one of the following conditions affecting you: Staggered, Slowed, Frightened, Poisoned, or Bleeding. Your alien metabolism forcibly burns out the impairment, and the burn always costs a little meat." },
          { name: "Scavenger's Maw", text: "Your jaw unhinges and your jagged teeth are capable of crushing bone and cheap polymers. Your unarmed strikes can be bite attacks that deal 1d6 Piercing damage. When you successfully bite a Target, your body rapidly processes the organic or synthetic matter, restoring 1 point of Vitality." },
          { name: "Disjointed Anatomy", text: "Your skeletal structure lacks rigid ligaments, allowing your limbs to pop out of socket and snap back into place painlessly. You can squeeze through spaces as if you were one Size category smaller than you actually are without penalty, and you can automatically succeed an escape attempt for any non-magical physical restraints or grapples as a Swift Action." },
          { name: "Predator's Glare", text: "Your eyes burn with ambient energy from your home dimension. You possess perfect Darkvision up to 6 spaces. As a Swift Action, you can lock eyes with a Target within 3 spaces to impose Snag on their next attack roll against you, as your intense, unblinking gaze triggers their primal fight-or-flight response. You can use this feature a number of times equal to your Caliber per Long Rest." },
          { name: "No Wrong Way Up", text: "The sprawl is exactly what your home dimension trained you for, except softer. You gain Edge on Athletics and Acrobatics checks made to climb, swing, vault, balance, or tumble, your jump distance is doubled, and any falling damage you take is halved as you bounce, snag ledges, and cackle on the way down." },
          { name: "Riddling Tongue", text: "Your words hook into brains the way thorns hook into cloth. You gain Edge on checks made to confuse, distract, stall, or barter using riddles, wordplay, or maddening circular logic. Additionally, once per Encounter as a Swift Action, you can pose an unfinished riddle to one Target within 6 spaces that can hear and understand you; it must succeed on a Wits Save (8 + your Wits modifier + your Caliber) or spend its mind chewing on the answer, unable to take Impulse Actions and taking Snag on its next attack roll before the start of your next turn." },
          { name: "Vicious Delight", text: "In your wonderland, fair fights were for food, and you were never food. You gain Edge on melee attack rolls against Targets that are Frightened, Staggered, Restrained, or Prone, and the first time each turn you hit such a Target, your obvious glee deals an additional 1d4 damage." },
          { name: "Probability Nudge", text: "Reality bends around you in small, mischievous ways. Once per Encounter as a Free Action, you can force one Target within 6 spaces to reroll any single die roll they just made. They must use the new result, for better or worse." },
          { name: "Impossible Geometry", text: "Your relationship to space is a suggestion rather than a rule. Once per Long Rest as a Swift Action, for 1 minute your movement does not provoke Opportunity Attacks, and you may move through occupied spaces (though you cannot end your turn there). Your position appears inconsistent to Enemies. Ranged attacks against you during this time are made with Snag." }
        ],
        evolutionFeatures: [],
        chooseIf: [
          "You want a Freelancer who treats life-or-death situations as elaborate games.",
          "You like mechanics that focus on escaping restraints, aggressive mobility, and biting enemies.",
          "You want roleplay tension around chaotic mischief conflicting with serious professional jobs.",
          "You want a connection to the chaotic gig-economy, underground entertainment, or rogue app developers."
        ],
        hooks: [
          "1. One of your pranks accidentally exposed a corporate murder, and now everyone thinks you are either a genius investigator or a disposable witness.",
          "2. Your favorite snack vendor is actually a front for a syndicate, but they give you free food, so betrayal has become morally complicated.",
          "3. The Doorbash app has gone rogue and is assigning assault contracts nobody paid for, including your own crew.",
          "4. You stole a shiny device from a corporate lab because it hummed nicely, and now it is attracting predators from your home dimension.",
          "5. A fixer hired you for a delicate stealth operation, which is insulting, suspicious, and probably the funniest thing that has ever happened.",
          "6. Your pack is running out of safe places to sleep, and the abandoned funhouse you found is either perfect shelter or obviously alive."
        ]
      }
    ]
  }
];
