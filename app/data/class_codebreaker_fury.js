window.EN = window.EN || {};
EN.classes = EN.classes || {};

EN.classes.codebreaker = {
  key: "codebreaker",
  name: "The Codebreaker",
  tagline: "Armed with a Smartdeck and a Repertoire of custom Ciphers, you do not merely access systems. You weaponize them. You make doors lie. You make turrets switch sides. You make a corporate vault apologize for being closed. And when the situation calls for it, you make a building's power core forget that it was ever meant to contain energy.",
  vitality: { text: "Starting Vitality: 6 + Body Modifier. Vitality Per Level: 1d6 + Body Modifier." },
  resilience: { text: "Resilience Die: d6" },
  attributePriorities: ["Tech", "Wits", "Agility"],
  attributePriorityNotes: [
    "1. Tech (Primary): Drives your Bandwidth pool, Systems checks, Cipher Save DC, and Cipher Attacks.",
    "2. Wits (Secondary): Fuels Investigation and Perception. Helps you analyze node architecture, spot incoming IC responses, and detect physical threats while your mind is partially elsewhere.",
    "3. Agility (Tertiary): Maintains your physical Defense and Speed. Codebreakers caught in firefights survive by being hard to hit, not by being hard to kill."
  ],
  saveFocus: "Tech and Mystique",
  resource: {
    name: "Bandwidth",
    attribute: "Tech",
    maxFormula: "Caliber + Tech Modifier (minimum of 1)",
    refresh: "You regain all spent Bandwidth at the end of a Short or Long Rest.",
    fuels: "Bandwidth represents your ability to force your will upon a node, overclock your Smartdeck, and execute the exploits that define the Codebreaker class. Bandwidth fuels every Cipher you cast above the most basic tier and powers Signature #GRID Exploits."
  },
  startingProficiencies: {
    weapons: ["Simple Weapons", "Sidearms"],
    armor: ["Light Armor"],
    shields: [],
    skills: ["Systems", "Stealth", "and choose one (Intuition, Investigation, or Acrobatics)"],
    saves: ["Tech", "Mystique"],
    tools: ["Systems Tools", "and choose one (Infiltration Tools, Security Tools, Media Tools, or Bureaucracy Tools)"]
  },
  startingEquipment: [
    "A Tier 1 (Improved) Smartdeck with one open Mod Slot.",
    "A starter Repertoire of four Ciphers of your choice from the Complexity 0 or Complexity 1 tiers.",
    "Light Armor of your choice.",
    "A Sidearm of your choice with two reloads.",
    "A Hackers Kit and one chosen Tool set."
  ],
  featuresByLevel: {
    "1": [
      { name: "Bandwidth", text: "Your mind is acclimated to processing the immense data streams of the #GRID. Bandwidth represents your ability to force your will upon a node, overclock your Smartdeck, and execute the exploits that define the Codebreaker class.\n\nYour Bandwidth Pool\nYour maximum Bandwidth is equal to your Caliber + your Tech Modifier (minimum of 1). You regain all spent Bandwidth at the end of a Short or Long Rest.\n\nYour Repertoire\nYou are a Power User on the #GRID. You begin play with a Tier 1 (Improved) Smartdeck and a custom Repertoire of Ciphers: your personal library of code. You start with four Ciphers of your choice from the Complexity 0 or Complexity 1 tiers.\n\nThroughout your career, you can integrate additional Ciphers into your Repertoire by spending the required Material Cost and one uninterrupted Downtime period (8 hours). There is no upper limit on how many Ciphers you can know; the only limit is what you can afford and what your Smartdeck can run.\n\nYour Smartdeck's tier determines which Ciphers you can actually cast. A Smartdeck can run Ciphers up to (Smartdeck Tier + 1) in Complexity. A Tier 1 (Improved) deck can run Complexity 0-2 Ciphers; a Tier 5 (Apex) deck can run the entire Cipher library. Ciphers above your deck's capacity can be integrated into your Repertoire, but they will not execute until you upgrade your hardware.\n\nMulti-Link\nYou possess the unique ability to sustain numerous simultaneous Links, a sharp contrast to Standard Users who are limited to just one. The upper limit for your active Links is calculated as twice your Caliber. While this multi-linking capability serves as the core mechanic of the class, it functions as a high-stakes balancing act: as your total number of active Links increases, the consequences of failing a Stability Check become significantly more severe.\n\nCipher Casting Costs\nBandwidth fuels every Cipher you cast above the most basic tier. Complexity 0 Ciphers are free to cast. Complexity 1-3 Ciphers cost 1 Bandwidth. Complexity 4-5 Ciphers cost 2 Bandwidth. Signature Ciphers (Logic Bomb, Daisy Chain, Puppet String, System Cascade, Black Sun) cost a flat 1 Bandwidth regardless of their Complexity.\n\nSignature #GRID Exploits\nYou have access to a suite of Signature #GRID Exploits: foundational class moves that no other class can replicate. Each costs 1 Bandwidth to activate. Each has a recharge trigger that, when met, refunds the spent Bandwidth. You may use any Signature #GRID Exploit any number of times, provided you have the Bandwidth to spend or recharge it through play.\n\nFlash Breach (Swift Action): When you would cast a Breach-type Cipher (such as Access Spike or Hardline Tap) as an Action, spend 1 Bandwidth to execute it as a Swift Action instead. Recharge: Successfully establishing a Link via Flash Breach without triggering any IC response refunds the 1 Bandwidth at the end of the turn.\n\nCipher Overdrive (Impulse Action): Trigger: You cast a Cipher. Spend 1 Bandwidth to either add +1d6 to your Cipher Attack roll or increase your Cipher Save DC by +2 for that injection. Recharge: If the Cipher succeeds AND the target node fails its save by 5 or more, refund the 1 Bandwidth.\n\nTrace Cutter (Impulse Action): Trigger: You would suffer the effects of an Alert response. Spend 1 Bandwidth to wipe the Alert from the node's logs before it propagates. The trace fails to advance. Recharge: If the Alert was triggered by an action that resulted in successfully bricking a Node, refund the 1 Bandwidth.\n\nSympathetic Resonance (Impulse Action): Trigger: You would take damage from an IC Counterattack. Spend 1 Bandwidth to force the IC to roll its damage twice and take the lower result. Recharge: If the IC's damage roll (after the lower result is taken) does not exceed your Smartdeck's Firewall threshold, refund the 1 Bandwidth.\n\nCold Read (Swift Action): Spend 1 Bandwidth to scan a target you can see (visible person, vehicle, or device). You immediately learn the Tier and Cipher Save Bonus of any Node carried by, installed in, or operated by that target. You also learn what IC tier (if any) defends those Nodes. Recharge: If the scan reveals a Hardened Node, refund the 1 Bandwidth." },
      { name: "Second Language", text: "You read code the way other people read body language. Patterns, intentions, weaknesses, all visible to you in a glance at a running system.\n\nOnce per turn, when you would make a Cipher Attack against a Node, you may instead spend a Swift Action to study the Node. Your next Cipher Attack against that Node, made this turn or next, gains +2 to hit and ignores 1 point of Firewall threshold. If the studied Node is destroyed, switches networks, or you lose your Link to it before you make the follow-up attack, the benefit is lost." },
      { name: "Codebreaker Subclass", text: "You choose a Codebreaker subclass, representing your specialization. This subclass grants features at specific Codebreaker levels. You gain all subclass features for which you meet the required Codebreaker level, both now and as you continue to advance. You may only select one subclass." }
    ],
    "2": [
      { name: "Wireless Root Access", text: "Your operational reach expands. You no longer require line of sight to interact with the #GRID. You can Scan, Breach, and establish Links with any Node within 24 spaces, even through solid walls, provided the target is not encased in a Faraday cage or shielded by Elite or Apex tier countermeasures." },
      { name: "Universal Upgrade", text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "3": [
      { name: "Subclass Feature", text: "You gain a feature granted by your chosen Codebreaker subclass at this level." }
    ],
    "4": [
      { name: "Universal Upgrade", text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "5": [
      { name: "Multi-Thread Processing", text: "You can partition your consciousness to execute simultaneous attacks across multiple Nodes. Once per combat encounter, as a single Action, you may inject two different Ciphers into two different Nodes you are currently Linked to. You resolve both Cipher Attacks or Saves simultaneously. Each Cipher pays its full Bandwidth cost independently." }
    ],
    "6": [
      { name: "Tactical Execution", text: "You know how to capitalize on the digital chaos you create. Once per round, when you use your Action to establish a Link or inject a Cipher, you may immediately use your Swift Action to make a single standard attack with a Sidearm or SMG. If you are attacking a physical target whose Node you are currently Linked to, this weapon attack is made with Edge." },
      { name: "Universal Upgrade", text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "7": [
      { name: "Subclass Feature", text: "You gain a feature granted by your chosen Codebreaker subclass at this level." }
    ],
    "8": [
      { name: "Universal Upgrade", text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "9": [
      { name: "SysAdmin (Root Access)", text: "You are the absolute authority in the architecture. You gain the following benefits:\n\nUnlimited Threading. You no longer have a maximum cap on your concurrent Links. The only limit is how many you can maintain through Stability Checks under fire.\n\n#GRID Initiative. When you roll Initiative with 0 Bandwidth remaining, immediately regain 3 Bandwidth. You never start a fight empty.\n\nHardware Mastery. Your familiarity with Smartdeck repair is unmatched. Your Downtime Repair cost drops from 10 per HP to 5 per HP. Bricked deck part costs (100 x Tier) are unchanged." }
    ],
    "10": [
      { name: "Subclass Capstone", text: "You gain the capstone feature granted by your chosen Codebreaker subclass at this level." }
    ]
  },
  progressionTable: [
    { level: 1, caliber: 1, features: ["Bandwidth", "Second Language", "Codebreaker Subclass"], resource: "0 Training Points" },
    { level: 2, caliber: 1, features: ["Wireless Root Access", "Universal Upgrade"], resource: "0 Training Points" },
    { level: 3, caliber: 2, features: ["Subclass Feature"], resource: "+5 Points" },
    { level: 4, caliber: 2, features: ["Universal Upgrade"], resource: "0 Training Points" },
    { level: 5, caliber: 3, features: ["Multi-Thread Processing"], resource: "0 Training Points" },
    { level: 6, caliber: 3, features: ["Tactical Execution", "Universal Upgrade"], resource: "+5 Points" },
    { level: 7, caliber: 4, features: ["Subclass Feature"], resource: "0 Training Points" },
    { level: 8, caliber: 4, features: ["Universal Upgrade"], resource: "0 Training Points" },
    { level: 9, caliber: 5, features: ["SysAdmin (Root Access)"], resource: "0 Training Points" },
    { level: 10, caliber: 5, features: ["Subclass Capstone"], resource: "+5 Points" }
  ],
  subclasses: [
    {
      key: "rigger",
      name: "The Rigger",
      description: "You do not just manipulate data; you manipulate chrome. You are an absolute master of remote physical assets, using your Smartdeck and Bandwidth to command drones, vehicles, and automated turrets. By forming a seamless neural link with your machines, you ensure that you are never fighting alone.\n\nTo a Rigger, the dividing line between \"code\" and \"metal\" is a polite lie. Every drone, every vehicle, every networked turret is a vessel waiting for instruction. You speak in patterns of intent that flow through fiber and antenna and short-burst radio. Your battlefield is not the place where you stand; it is the constellation of machines that move at your command.",
      features: [
        { level: 1, name: "Hardware Integration", text: "You treat physical machines as extensions of your own nervous system. You gain the following benefits:\n\nTool Proficiency. You gain Proficiency with Engineering Tools, allowing you to repair and customize robotic assets.\n\nPersistent Link. You begin play with a custom Companion Drone (see profile below). You automatically maintain a permanent Link to your drone that does not count against your maximum active Links. If your drone is destroyed, you can rebuild it during a Long Rest by spending 100 in salvage and making a successful Engineering Dice Pool check." },
        { level: 3, name: "Cybernetic Overclock", text: "You can flood your drone's chassis with raw Bandwidth, pushing it past its factory limits. As a Swift Action, spend 1 Bandwidth to grant your Companion Drone one of the following Overclock protocols for the next minute:\n\nAggressive Protocol. The drone's attacks deal an additional 1d6 damage and gain Edge on attack rolls.\n\nAblative Protocol. The drone projects a localized shield, gaining Vigor equal to your Codebreaker Caliber + your Tech Modifier.\n\nRecon Protocol. The drone gains Tremor Sense (or advanced optics) up to 6 spaces. Any enemy it hits with an attack loses the Hidden or Invisible condition until the end of your next turn." },
        { level: 7, name: "Swarm Commander", text: "Your ability to thread multiple physical commands reaches a new tier. You can now command your Companion Drone without spending an Impulse Action (it acts freely on your turn).\n\nFurthermore, you can temporarily hijack hostile hardware. As an Action, spend 2 Bandwidth to target an enemy drone, turret, or automated vehicle you are currently Linked to. Make a Cipher Attack against its Security Rating. On a hit, you seize total control of the hardware. For the next minute, it acts on your turn as an allied unit using its own stat block. The target may make a Cipher Saving Throw at the end of each of its turns to purge your control and end the effect early." },
        { level: 10, name: "Iron Reign", text: "You are the throne to which all machines bend. You gain the following benefits:\n\nMulti-Drone Command. You may build and maintain a second Companion Drone, following the same construction rules. Both drones share your permanent Link and neither counts against your maximum Links.\n\nNetwork Authority. Hijack durations from Swarm Commander become permanent until you choose to release the target, the target is destroyed, or you reduce another hijacked target to 0 HP (you may only maintain one hijacked target at a time without conscious effort; the hijack ends if you would gain another).\n\nBuilt To Last. Companion Drones rebuilt during Downtime are restored at no salvage cost." }
      ]
    },
    {
      key: "gridweaver",
      name: "The #GRID Weaver",
      description: "To you, reality is just another data stream, and you know exactly how to edit it. You are a master psychological hacker, specializing in manipulating augmented reality, spoofing sensory data, and feeding false information into enemy comms and cyber optics. To fight you is to fight ghosts, shadows, and the enemy's own lying eyes.\n\nA Weaver does not destroy the world. A Weaver convinces the world to disagree with itself. You teach a corporate guard's HUD to lie about what is in front of him. You teach his ear-comm to lie about who is speaking. You teach his own cyber-optics to render his squadmates as enemies. By the time he realizes none of it was true, it does not matter.",
      features: [
        { level: 1, name: "AR Architect", text: "You treat the physical world as a programmable canvas, injecting false terrain and environmental cues directly into augmented perception.\n\nYou gain Proficiency in Deception. When using augmented reality, digital disguises, or cyber-optic manipulation to deceive, you may use your Tech modifier in place of Charm.\n\nStatic Illusions. As an Impulse Action, project minor, static AR elements within 6 spaces (false signage, holographic barriers, fake wall panels, environmental warnings). These illusions appear real to anyone relying on augmented vision or screen-based perception and persist for up to 1 minute.\n\nLocalized AR Terrain Construct. As a Swift Action, spend 1 Bandwidth to project a Localized AR Terrain Construct filling up to an Area 3 Cube within 12 spaces. Duration: 1 minute.\n\nFalse Cover: Enemies may take cover behind the projection but receive no Defense bonus or Damage Reduction.\n\nPathing Disruption: Enemies relying on augmented perception path around hazards or reposition based on the illusion.\n\nPerceptual Authority: Observers treat the construct as real until they physically interact with it, witness an object pass through it, or use an Action to examine it and pass a Wits (Intuition) d20 check against your Cipher Save DC. Once proven false, it becomes translucent to them and they can ignore its effects." },
        { level: 3, name: "Ghost Persona Protocol", text: "You do not just hide on the #GRID; you rewrite how the system perceives you.\n\nYou maintain a secondary, highly encrypted Ghost Persona within your Smartdeck. While this persona is active, Intrusion Countermeasures (IC) and automated security systems perceive you as a legitimate, benign user. This does not grant actual security clearance or privileged access, but it lets you exist on the #GRID with significantly less initial scrutiny.\n\nYou gain Edge on in-combat Systems (Tech) d20 checks (or +1 Edge Die to out-of-combat Dice Pools) to bypass Firewalls or avoid IC detection.\n\nAny attempt to scan, trace, or identify you on the #GRID instead resolves to a false civilian or corporate identity of your choosing.\n\nBlatant missteps, repeated access failures, or obvious protocol violations will still shatter the illusion and trigger a security response.\n\nGhost Decoy. As a Swift Action, spend 1 Bandwidth to project a Ghost Decoy within 6 spaces, injecting your falsified identity into local AR and network perception. The decoy appears as you or an ally and behaves as a seamless real-time duplicate.\n\nThe decoy has 1 Vitality and your Defense score. It lasts up to 1 minute.\n\nPerceptual Priority: Enemies and IC relying on augmented vision or network targeting treat the decoy as a valid target and may prioritize it.\n\nFalse Engagement: If the decoy is attacked, the strike passes harmlessly through it. The decoy shatters into visual static. The attacker's action is entirely consumed and wasted.\n\nFeedback Spike: The attacker suffers Snag on their next attack roll.\n\nTrace Backlash: The attacker's exact position is immediately pinged to your entire squad.\n\nYou may flavor your Ghost Persona and decoy identity to match any fabricated profile, reinforcing your control over both digital and perceived reality." },
        { level: 7, name: "Memetic Virus", text: "You inject a terrifying AR hallucination directly into the visual cortex of your enemies. As an Action, spend 2 Bandwidth and force up to three enemies within 12 spaces to make a Wits Save (DC = 8 + your Tech Modifier + Systems Proficiency Bonus).\n\nOn a failure, they perceive a horrific, inescapable threat for 1 minute. They become Frightened of you and must use their movement to get away from you on their turn. If they attempt to push through the hallucination and willingly move closer to you, their nervous system suffers massive dissonance, and they immediately take 4d6 Psychic damage.\n\nAffected targets may repeat the Wits Save at the end of each of their turns to purge the virus." },
        { level: 10, name: "Reality Overwrite", text: "You project a massive, arena-wide AR overlay backed by a foveated hard-light rendering engine. Instead of projecting a blanket physical illusion, your Smartdeck tracks enemy cyber-optics and triangulates organic gaze trajectories, generating pinpoint micro-barriers of solid light exactly where enemies look, step, or shoot.\n\nOnce per Long Rest, as an Action, spend 2 Bandwidth to overwrite an Area 20x20 Cube. For the next minute, your squad is immune to the illusion and your hardware seamlessly bypasses the hard-light. All enemies inside the zone suffer:\n\nFoveated Disorientation. The shifting, tangible labyrinth counts as Difficult Terrain (halving Speed), and they suffer continuous Snag on all attack rolls.\n\nAsymmetric Reality. Because the hard-light solidifies only in response to enemy interactions, you control the physical layout of the battlefield. Projections automatically intercept enemy fire and block their line of sight. You and your allies gain Total Cover against ranged attacks made by enemies inside the zone.\n\nSensory Rejection. At the start of each of their turns, enemies must make a Wits Save (DC = 8 + your Tech Modifier + your Systems Proficiency Bonus).\n\nFailure: They take 4d6 Psychic damage as their brain violently rejects the dissonance.\n\nSuccess: They take half damage and their mind maps the geometry. Until the end of their current turn, they ignore the area's Difficult Terrain penalty and your squad's Total Cover benefit. If they start their next turn still inside the area, they make their next Wits Save with Edge." }
      ]
    },
    {
      key: "burner",
      name: "The Burner",
      description: "You are not a quiet infiltrator; you are a digital demolitionist. To you, the #GRID is a weapon of mass destruction. You specialize in absolute brute force breaches, zero-day exploits, and malicious code that violently overclocks enemy hardware. When you hack a system, you do not just steal the data; you melt the servers and detonate the batteries.\n\nA Burner is the answer to a corporation's worst question: what if someone with your knowledge of our systems wanted to break them? You do not slip past defenses. You set them on fire on the way in. Your code is loud, hot, and irreversible. Your reputation precedes you in every server farm.",
      features: [
        { level: 1, name: "Scorched Earth Policy", text: "You do not just bypass security; you weaponize it against the host. You gain the following benefits:\n\nMalicious Injection: Whenever you successfully deal damage to a Node's System Integrity (after surplus damage is calculated), the connected enemy (if any) takes an additional 1d6 damage of the appropriate type as feedback from the corrupted hardware lashes back through their nervous system.\n\nFeedback Spike: Once per turn, when a Node carried by or installed in an enemy fails a Cipher Saving Throw against you, or you hit that Node with a Cipher Attack, the hardware violently sparks. The connected enemy takes guaranteed Electric damage equal to your Codebreaker Caliber + your Tech Modifier.\n\nKickback: When you successfully deal damage to a Node, you may use an Impulse Action to redirect the cipher's recoil at a target within 6 spaces. The target takes 1d6 damage of the same type as the cipher's damage, then must make a Body Save against your Cipher Save DC or be knocked Prone. The target must be visible to you and have a clear line of effect; you cannot Kickback through walls or full cover." },
        { level: 3, name: "Hardware Override", text: "You flood an enemy's personal gear with raw Bandwidth, forcing catastrophic physical malfunctions in their cybernetics and smart-weapons. As a Swift Action, spend 1 Bandwidth and target one enemy whose cyberware, smart-tech, or internal Node you are currently Linked to. The target's hardware must make a Cipher Saving Throw against your Cipher Save DC. On a failure, choose one of the following:\n\nSmart-Lockout. Their smart-weapons and cyber-arms lock up. They immediately drop whatever they are holding and cannot pick up or fire weapons until the end of their next turn.\n\nServo Seizure. Their synthetic muscles or motor-assists glitch. Their Speed is reduced to 0 and they cannot take Impulse Actions until the end of their next turn.\n\nThermal Venting. You disable the cooling limiters on their gear. They take 2d6 Fire damage and lose their next Swift Action as they frantically clear the heat warning." },
        { level: 7, name: "Vector Worm", text: "You unleash an aggressive, self-replicating virus designed to tear through squad networks. As an Action, spend 2 Bandwidth to inject the worm into a Node you are currently Linked to. The target must make a Cipher Saving Throw against your Cipher Save DC.\n\nOn a failure: The connected enemy takes 4d6 Electric damage, and their defensive systems crash, stripping away any Vigor they currently have. The worm immediately attempts a hostile jump to the nearest enemy Node within 3 spaces of the primary target, forcing that new Node to make the same Save.\n\nThe Chain. The worm can jump up to a maximum of three times (hitting up to four targets total). It cannot hit the same target twice in a single turn. You do not need a prior Link to the jump targets; the worm breaches them automatically.\n\nOn a success: The target takes half damage, retains their Vigor, and the worm's replication terminates." },
        { level: 10, name: "The Kill Code (Zero-Day Exploit)", text: "You have engineered the ultimate digital execution: a rootkit that bypasses all biological and mechanical limiters, instructing the target's power core or neural processor to permanently overload.\n\nOnce per Long Rest, as an Action, spend 2 Bandwidth and target one enemy whose Node you are currently Linked to. They must make a Tech Save (to physically resist the overload) against your Cipher Save DC.\n\nOn a failure: Their internal systems undergo catastrophic meltdown. They take 8d10 Electric damage and their cybernetics are completely bricked (reducing the Node's System Integrity to 0). For the next minute, they suffer Snag on all physical attack rolls and saving throws, and they cannot use any abilities relying on tech or cybernetics.\n\nExplosive Decompression. If this damage reduces the target to 0 Wounds (or if they die while their cybernetics are bricked by this ability), their power core violently detonates. All other Targets within 3 spaces must make an Agility Save against your Cipher Save DC or take 4d6 Fire damage from the shrapnel and explosion (half on a success).\n\nOn a success: They hit the emergency physical kill-switch on their own hardware. They take half of the 8d10 damage, suffer no ongoing penalties, and the explosive decompression does not occur." }
      ]
    }
  ],
  extra: {
    smartdeck: "You begin play with a Tier 1 (Improved) Smartdeck. Your Smartdeck's tier determines which Ciphers you can actually cast. A Smartdeck can run Ciphers up to (Smartdeck Tier + 1) in Complexity. A Tier 1 (Improved) deck can run Complexity 0-2 Ciphers; a Tier 5 (Apex) deck can run the entire Cipher library.",
    repertoire: "You are a Power User on the #GRID. You begin play with a custom Repertoire of Ciphers: your personal library of code. You start with four Ciphers of your choice from the Complexity 0 or Complexity 1 tiers. Throughout your career, you can integrate additional Ciphers into your Repertoire by spending the required Material Cost and one uninterrupted Downtime period (8 hours). There is no upper limit on how many Ciphers you can know; the only limit is what you can afford and what your Smartdeck can run.",
    ciphers: "Ciphers above your deck's capacity can be integrated into your Repertoire, but they will not execute until you upgrade your hardware. Signature Ciphers include: Logic Bomb, Daisy Chain, Puppet String, System Cascade, Black Sun.",
    bandwidth: "Your maximum Bandwidth is equal to your Caliber + your Tech Modifier (minimum of 1). You regain all spent Bandwidth at the end of a Short or Long Rest.",
    multiLink: "You possess the unique ability to sustain numerous simultaneous Links, a sharp contrast to Standard Users who are limited to just one. The upper limit for your active Links is calculated as twice your Caliber. While this multi-linking capability serves as the core mechanic of the class, it functions as a high-stakes balancing act: as your total number of active Links increases, the consequences of failing a Stability Check become significantly more severe.",
    cipherCastingCosts: "Bandwidth fuels every Cipher you cast above the most basic tier. Complexity 0 Ciphers are free to cast. Complexity 1-3 Ciphers cost 1 Bandwidth. Complexity 4-5 Ciphers cost 2 Bandwidth. Signature Ciphers (Logic Bomb, Daisy Chain, Puppet String, System Cascade, Black Sun) cost a flat 1 Bandwidth regardless of their Complexity.",
    gridExploits: [
      { name: "Flash Breach", action: "Swift Action", text: "When you would cast a Breach-type Cipher (such as Access Spike or Hardline Tap) as an Action, spend 1 Bandwidth to execute it as a Swift Action instead. Recharge: Successfully establishing a Link via Flash Breach without triggering any IC response refunds the 1 Bandwidth at the end of the turn." },
      { name: "Cipher Overdrive", action: "Impulse Action", text: "Trigger: You cast a Cipher. Spend 1 Bandwidth to either add +1d6 to your Cipher Attack roll or increase your Cipher Save DC by +2 for that injection. Recharge: If the Cipher succeeds AND the target node fails its save by 5 or more, refund the 1 Bandwidth." },
      { name: "Trace Cutter", action: "Impulse Action", text: "Trigger: You would suffer the effects of an Alert response. Spend 1 Bandwidth to wipe the Alert from the node's logs before it propagates. The trace fails to advance. Recharge: If the Alert was triggered by an action that resulted in successfully bricking a Node, refund the 1 Bandwidth." },
      { name: "Sympathetic Resonance", action: "Impulse Action", text: "Trigger: You would take damage from an IC Counterattack. Spend 1 Bandwidth to force the IC to roll its damage twice and take the lower result. Recharge: If the IC's damage roll (after the lower result is taken) does not exceed your Smartdeck's Firewall threshold, refund the 1 Bandwidth." },
      { name: "Cold Read", action: "Swift Action", text: "Spend 1 Bandwidth to scan a target you can see (visible person, vehicle, or device). You immediately learn the Tier and Cipher Save Bonus of any Node carried by, installed in, or operated by that target. You also learn what IC tier (if any) defends those Nodes. Recharge: If the scan reveals a Hardened Node, refund the 1 Bandwidth." }
    ],
    companionDrone: {
      title: "The Companion Drone (Base Profile)",
      size: "Small (a rotor-drone, mechanical hound, treaded scout, or similar).",
      speed: "6. Choose one of Flying, Climbing, or Ground movement at the time of build.",
      defense: "12 + your Tech Modifier.",
      vitality: "10 + (Codebreaker Level x 4).",
      actionEconomy: "On your turn, you may spend an Impulse Action to command the drone to move up to its speed and take one Action (attacking, interacting with an object, or taking the Help action).",
      attack: "Mounted Sidearm or Taser: d20 + your Tech Modifier vs Defense. Deals 1d6 + Tech Modifier Piercing or Electric damage."
    }
  }
};

EN.classes.fury = {
  key: "fury",
  name: "The Fury",
  tagline: "You do not just survive the frontline; you are the frontline. You rely on kinetic supremacy, sheer resilience, and overwhelming physical force to dictate the terms of engagement. Whether you are heavily chromed, naturally massive, or fueled by pure adrenaline, your purpose is to break enemy formations, shatter cover, and force the opposition to deal with you before anyone else. You do not train to fight fair; you train to hit hardest.",
  vitality: { text: "Starting Vitality: 12 + Body Modifier. Vitality Per Level: 1d12 + Body Modifier." },
  resilience: { text: "Resilience Die: d12" },
  attributePriorities: ["Body", "Wits", "Agility"],
  attributePriorityNotes: [
    "1. Body (Primary): Drives your maximum Wounds, Vitality, melee attacks, and Overdrive pool.",
    "2. Wits (Secondary): Powers Perception and Intuition to ensure you spot an Enemy ambush.",
    "3. Agility (Tertiary): Maintains your Speed so you can rapidly close the gap to a Target."
  ],
  saveFocus: "Body and Charm",
  resource: {
    name: "Overdrive",
    attribute: "Body",
    maxFormula: "Caliber + Body Modifier (minimum of 1)",
    refresh: "You regain all spent Overdrive at the end of a Short or Long Rest.",
    fuels: "The Fury relies on explosive bursts of adrenaline, cybernetic power, or pure rage called Overdrive. Overdrive represents physical feats that push past normal bodily limits to shatter the battlefield. Overdrive fuels Overdrive Maneuvers."
  },
  startingProficiencies: {
    weapons: ["Simple Weapons", "Martial Weapons", "Sidearms", "Thrown Weapons"],
    armor: ["Light Armor", "Medium Armor", "Heavy Armor", "Physical Shields"],
    shields: ["Physical Shields"],
    skills: ["Athletics", "Acrobatics", "and choose one (Perception, Engineering, or Intuition)"],
    saves: ["Body", "Charm"],
    tools: ["Engineering Tools", "and choose one (Fieldcraft Tools, Security Tools, or Medical Tools)"]
  },
  featuresByLevel: {
    "1": [
      { name: "Overdrive", text: "The Fury relies on explosive bursts of adrenaline, cybernetic power, or pure rage called Overdrive. Overdrive represents physical feats that push past normal bodily limits to shatter the battlefield.\n\nYour Overdrive Pool\nYour maximum Overdrive is equal to your Caliber + your Body Modifier (minimum of 1). You regain all spent Overdrive at the end of a Short or Long Rest.\n\nOverdrive Maneuvers\nAt 1st Level, you learn two Overdrive Maneuvers of your choice from the list below. You learn two additional Maneuvers at 5th Level. (Unless otherwise noted, all Overdrive Maneuvers cost 1 Overdrive to activate)." },
      { name: "Collateral Damage", text: "You treat the physical world as highly breakable, and people know better than to stand in your way when you start swinging. Your melee attacks and Overdrive Maneuvers deal double damage to inanimate objects, structures, and Cover Integrity. Additionally, whenever you attempt to Intimidate someone by destroying an object, crushing something in your bare hands, or demonstrating raw physical power, you gain Edge on the Intimidation check." },
      { name: "Fury Subclass", text: "You choose a Fury subclass, representing your specialization. This subclass grants features at specific Fury levels. You gain all subclass features for which you meet the required Fury level, both now and as you continue to advance. You may only select one subclass." }
    ],
    "2": [
      { name: "Juggernaut Momentum", text: "Relentless Advance. You are terrifying once you commit to the attack. Whenever you spend an Action to Dash, or whenever you spend Overdrive to activate a Maneuver that alters physical positioning (such as moving yourself with Linebreaker or violently pushing an enemy with Clear the Path), you gain Vigor equal to your Caliber + your Body Modifier. Furthermore, you ignore the movement penalties of Difficult Terrain for the duration of that turn." },
      { name: "Universal Upgrade", text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "3": [
      { name: "Subclass Feature", text: "You gain a feature granted by your chosen Fury subclass at this level." }
    ],
    "4": [
      { name: "Universal Upgrade", text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "5": [
      { name: "Extra Attack", text: "Your brutality becomes a rhythm. Whenever you take the Attack Action on your turn, you can make two standard weapon attacks instead of one." },
      { name: "Expanded Overdrive", text: "You learn two additional Overdrive Maneuvers from the core list." }
    ],
    "6": [
      { name: "Shrug It Off", text: "Pain is just another form of information, and you've learned to ignore it. Once per encounter, when you fail a Save against an effect that would inflict you with the Stunned, Paralyzed, or Confused condition, you can use your Impulse Action to violently force your body to ignore the stimulus. You succeed on the Save instead, taking Vitality damage equal to your Caliber as your body protests the exertion. This damage cannot be resisted or reduced." },
      { name: "Universal Upgrade", text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "7": [
      { name: "Subclass Feature", text: "You gain a feature granted by your chosen Fury subclass at this level." }
    ],
    "8": [
      { name: "Universal Upgrade", text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute score by 1 (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "9": [
      { name: "Adrenaline Engine", text: "The violence sustains you. Whenever you score a Critical Success (Natural 20) on an attack roll, or once per round when you suffer Wound damage from an Enemy's attack, your adrenaline violently spikes, instantly refueling your momentum. You immediately regain 1 spent Overdrive (this cannot exceed your maximum)." }
    ],
    "10": [
      { name: "Subclass Capstone", text: "You gain the capstone feature granted by your chosen Fury subclass at this level." }
    ]
  },
  progressionTable: [
    { level: 1, caliber: 1, features: ["Overdrive", "Collateral Damage", "Fury Subclass"], resource: "-" },
    { level: 2, caliber: 2, features: ["Juggernaut Momentum", "Universal Upgrade"], resource: "+5 Points" },
    { level: 3, caliber: 3, features: ["Subclass Feature"], resource: "-" },
    { level: 4, caliber: 4, features: ["Universal Upgrade"], resource: "+5 Points" },
    { level: 5, caliber: 5, features: ["Extra Attack", "Expanded Overdrive"], resource: "-" },
    { level: 6, caliber: null, features: ["Shrug It Off", "Universal Upgrade"], resource: "+5 Points" },
    { level: 7, caliber: null, features: ["Subclass Feature"], resource: "-" },
    { level: 8, caliber: null, features: ["Universal Upgrade"], resource: "-" },
    { level: 9, caliber: null, features: ["Adrenaline Engine"], resource: "-" },
    { level: 10, caliber: null, features: ["Subclass Capstone"], resource: "-" }
  ],
  subclasses: [
    {
      key: "juggernaut",
      name: "The Juggernaut",
      description: "You do not need millions of credits in proprietary cybernetics to be an unstoppable force; you just need gravity, momentum, and a heavy slab of metal. You are a master of physical conditioning and armor optimization. You turn whatever gear you can afford into an impenetrable fortress through perfect angling, staggering physical density, and a sheer, terrifying refusal to yield the right-of-way.",
      features: [
        { level: 1, name: "The Walking Anvil", text: "You know exactly how to brace your weight and angle your equipment to absorb kinetic energy, and you view your environment as a rack of potential armaments. You gain Proficiency with Improvised Weapons, treating heavy debris, torn rebar, or broken furniture as lethal tools in your hands.\n\nWhile you are wearing Medium Armor, Heavy Armor, or wielding a Physical Shield, you treat your mass as absolute. You gain Edge on all Saves and contested checks made to resist being pushed, pulled, or knocked Prone.\n\nAdditionally, you weaponize the sheer weight of your gear. Whenever you use the Shatterstrike or Clear the Path Overdrive maneuvers while wielding a melee weapon with the Heavy trait, an Improvised Weapon, or a Physical Shield, the target is violently shoved an additional 1 space back by the sheer force of the impact." },
        { level: 3, name: "Brace for Impact", text: "You know how to catch a blow on the thickest part of your plating and disperse the kinetic energy. When you are hit by an attack that deals physical or energy damage, you can use your Impulse Action and spend 1 Overdrive to instantly brace yourself against the strike.\n\nYou reduce the incoming damage by 1d10 + your Body Modifier + your Caliber. If this reduces the damage to 0, you perfectly redirect the kinetic energy into a counter-maneuver; the attacker takes physical damage equal to your Body Modifier as they brutally overextend against your unyielding defense." },
        { level: 7, name: "Unstoppable Momentum", text: "You can temporarily flood your system with adrenaline, turning yourself into a living battering ram that ignores pain and friction. As a Swift Action, you can spend 2 Overdrive to enter this state for up to 1 minute (or until the encounter ends).\n\nWhile active, you gain Resistance to all physical damage, and your movement speed cannot be reduced by external effects, difficult terrain, or conditions like Staggered.\n\nHowever, pushing your body this hard is physically destructive. At the start of each of your turns while this is active, you lose Vigor equal to your Caliber (if you have no Vigor, you lose Vitality instead). You can end this state early as a free action on your turn." },
        { level: 10, name: "Earthbreaker", text: "You treat your own body as heavy ordnance. Once per Long Rest, as an Action, you can channel every ounce of your physical strength to launch yourself into the air, crashing down into any unoccupied space you can see within 6 spaces.\n\nUpon impact, your staggering mass releases a localized seismic shockwave. All enemies within 4 spaces of your landing zone must make a Body Save (DC = 8 + your Body Modifier + your Caliber).\n\nOn a failure, they take 6d8 + your Body Modifier in Bludgeoning damage, are violently pushed 2 spaces away from you, and are knocked Prone.\n\nOn a successful save, they take half damage and are not pushed or knocked prone.\n\nFurthermore, the sheer devastation of your landing creates difficult terrain in the entire Area 4, and instantly reduces any Cover in the area to 0 Integrity." }
      ]
    },
    {
      key: "reaver",
      name: "The Reaver",
      description: "You do not rely on supernatural speed or advanced targeting optics; you rely on terrifying, overwhelming physical power. You are an engine of brutal, relentless destruction, treating heavy, two-handed weapons as if they were toys. You wade into the center of the enemy formation and turn yourself into a walking meat grinder, effortlessly battering down defenses through sheer, unstoppable momentum.",
      features: [
        { level: 1, name: "Colossal Grip", text: "You treat the physical limitations of standard weaponry as a joke, utilizing your massive strength to dual-wield armaments that would normally require two hands. You ignore the Two-Handed trait for melee weapons, allowing you to wield them effectively in a single hand.\n\nFurthermore, to fully utilize this grip, you can use your Swift Action to make a Follow-Up Attack with any melee weapon you are holding in your other hand, completely ignoring the usual rule that the off-hand weapon must possess the Light or Off hand trait." },
        { level: 3, name: "Cross-Block", text: "You use the massive real estate of your dual-wielded weapons to create an impenetrable wall of steel. When you are hit by a physical melee attack or a ranged ballistic attack, you can use your Impulse Action and spend 1 Overdrive to cross your weapons and violently catch the strike.\n\nYou reduce the incoming damage by one of your weapon's damage dice + your Body Modifier + your Caliber. If this reduces the damage to 0, you completely crush the attacker's kinetic momentum:\n\nMelee: You bind their weapon and throw them off balance. The attacker is instantly pushed 1 space away and left Staggered until the end of their next turn.\n\nRanged Ballistic: You swat the projectile out of the air with such force that the concussive shockwave grants you Vigor equal to your Body Modifier." },
        { level: 7, name: "Thresher Stance", text: "You use the immense weight of your weapons to build an unstoppable pendulum of momentum. As a Swift Action, you can spend 2 Overdrive to enter Thresher Stance for up to 1 minute (or until the encounter ends).\n\nWhile in this stance, you become a living blender. Whenever you successfully hit an enemy with a melee weapon, the follow-through of your swing is so violently powerful that you may immediately apply half of the damage dealt to a second enemy within your melee reach. Furthermore, your sheer momentum makes you incredibly difficult to lock down; you gain Edge on all contested checks or Saves made to break free from grapples or physical restraints." },
        { level: 10, name: "Avalanche of Iron", text: "You don't need to teleport to be terrifying; you just walk forward and hack them to pieces until there is nowhere left to run. Once per Long Rest, as an Action, you channel all of your adrenaline into a relentless, earth-shattering onslaught against a single enemy you can see within 6 spaces.\n\nYou instantly move up to your Speed directly toward the target. If you reach them, you unleash a catastrophic barrage of strikes. You immediately make four standard melee attacks against them.\n\nFor every attack that hits, the target takes maximum damage on the dice, and you violently drive them 1 space backward. You automatically advance into the space they just left.\n\nIf this barrage drives the target into a solid obstacle (like a wall, vehicle, or another target), the onslaught pins them. Any remaining attacks in the sequence automatically hit, and the target is inflicted with the Stunned condition until the end of their next turn as their body is systematically crushed against the barrier." }
      ]
    },
    {
      key: "arsenal",
      name: "The Arsenal",
      description: "You do not need to be a sharpshooter when you have a high enough rate of fire. You are a walking weapons platform, utilizing your sheer physical mass to absorb the recoil of heavy artillery and dual-wield firearms that were never meant to be fired from the hip. You command the battlefield through absolute suppression, deafening noise, and a catastrophic volume of lead.",
      features: [
        { level: 1, name: "Walking Emplacement", text: "You treat your own body as a heavy weapon mount. You ignore the Two-Handed, Heavy, Setup, and Crew Served traits of all ranged weapons. You do not suffer Snag, lose the ability to Sprint, or require an ally to operate these weapons effectively on the move.\n\nBecause you rely on brute-force recoil control rather than precise targeting, you may use your Body modifier instead of your Agility modifier when calculating your Weapon Save DC. You still use your Agility modifier for standard ranged attack rolls.\n\nFurthermore, you can dual-wield ranged weapons to lay down a terrifying volume of fire. You can use your Swift Action to make a Follow-Up Attack (a single standard shot) with a ranged weapon you are holding in your other hand, completely ignoring the usual requirement that the off-hand weapon must have the Light or Off hand trait.\n\nHeavy Weapon Limit: While your sheer strength allows you to operate a Crew Served weapon entirely unassisted, its staggering mass still requires both of your arms to stabilize; you cannot dual-wield if either of your equipped weapons possesses the Crew Served trait." },
        { level: 3, name: "Suppressive Counter", text: "You don't need a physical shield when you can just fill the air between you and the enemy with lead. When an enemy you can see makes an attack against you or an ally within your weapon's short range, you can use your Impulse Action and spend 1 Overdrive to violently suppress them.\n\nYou unleash a preemptive burst of fire, imposing Snag on their attack roll. Additionally, if the weapon you are holding has the Burst or Full-Auto firing mode, the sheer kinetic shock of your covering fire forces them to flinch; you reduce the damage of their attack by 1d10 + your Body Modifier. If they are utilizing Cover, its Integrity is instantly reduced by the same amount." },
        { level: 7, name: "Bullet-Storm Protocol", text: "You can temporarily bypass the thermal limiters on your weapons and your own nervous system, entering a state of relentless, deafening sustained fire. As a Swift Action, you can spend 2 Overdrive to enter this protocol for up to 1 minute (or until the encounter ends).\n\nWhile active, you become a terrifying engine of suppression:\n\nYour ranged weapons do not consume standard ammunition.\n\nWhenever a target takes damage from your ranged weapon (whether from an attack roll or a failed Weapon Save), the sheer kinetic impact violently shoves them 1 space away from you and reduces their Speed by half until the end of their next turn.\n\nYour Overdrive Maneuvers that normally require a melee attack (like Shatterstrike or Clear the Path) can now be performed using a ranged weapon attack as a point-blank blast (targeting an enemy or object within 2 spaces)." },
        { level: 10, name: "Maximum Overdrive", text: "You plant your feet, hold down the triggers, and refuse to let go until the barrels melt. Once per Long Rest, as an Action, you channel every ounce of your adrenaline into a catastrophic barrage, targeting an Area 6 Cone originating from you.\n\nEvery Enemy in the cone must make an Agility Save (DC = 8 + your Body Modifier + your Caliber).\n\nOn a failure, they take 6d10 + your Body Modifier in Ballistic or Energy damage (depending on your equipped weapons), are inflicted with the Deafened condition, and are pinned down, reducing their Speed to 0 until the end of their next turn.\n\nOn a successful save, they take half damage and are not deafened or pinned.\n\nThe sheer, apocalyptic volume of fire instantly reduces the Integrity of all Cover, doors, and destructible objects within the entire cone to 0, completely flattening the battlefield." }
      ]
    }
  ],
  extra: {
    overdriveManeuvers: [
      { name: "Shatterstrike", cost: "1 Overdrive (Action)", text: "Target one Enemy or object within melee reach. Make a standard melee attack. On a hit, you deal an additional 1d8 Bludgeoning damage. If the target is utilizing Cover, that Cover's Integrity is reduced by the total damage dealt, potentially destroying it outright." },
      { name: "Clear the Path", cost: "1 Overdrive (Action)", text: "Target one Enemy within your melee reach. You put your entire body weight into a single, devastating swing designed to clear your immediate airspace. Make a standard melee attack. On a hit, you deal normal damage, and the target is violently pushed up to 3 spaces directly away from you. If the target is pushed into a solid obstacle (such as a wall, a vehicle, or another target), the target and the obstacle take additional Bludgeoning damage equal to your Body Modifier." },
      { name: "Meat Shield", cost: "1 Overdrive (Impulse Action)", text: "Trigger: An ally within 2 spaces is hit by an attack. You throw your own body into the line of fire. You instantly swap places with the ally and take the damage from the attack instead of them. You have Resistance to the damage taken this way (halving the incoming damage)." },
      { name: "Linebreaker", cost: "1 Overdrive (Swift Action)", text: "You drop your shoulder and become a living battering ram. Until the end of your turn, you can move through spaces occupied by enemies. If you pass through an enemy's space, they must make a Body Save (DC = 8 + your Body Modifier + your Caliber) or be knocked Prone." },
      { name: "Seismic Stomp", cost: "1 Overdrive (Action)", text: "You slam the ground with devastating force. All enemies within 3 spaces of you must make an Agility Save (DC = 8 + your Body Modifier + your Caliber). On a failure, they take Bludgeoning damage equal to your Caliber + your Body Modifier and are inflicted with the Staggered condition (Speed halved, lose Swift/Impulse actions) until the end of their next turn." }
    ]
  }
};
