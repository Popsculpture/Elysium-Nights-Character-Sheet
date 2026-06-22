window.EN = window.EN || {};
EN.classes = EN.classes || {};

// Signature #GRID Exploits as structured sub-entries: the single source for the engine, the
// Class-tab picker, and the print sheet. The Bandwidth feature's prose (below) is composed from
// this list, so the displayed text and the machine-readable data can never drift apart. The
// Codebreaker knows the entire list; each Exploit costs 1 Bandwidth and has a recharge trigger.
var CODEBREAKER_GRID_EXPLOITS = [
  { name: "Flash Breach", action: "Swift Action", cost: 1, text: "When you would cast a Breach-type Cipher (such as Access Spike or Hardline Tap) as an Action, spend 1 Bandwidth to execute it as a Swift Action instead.", recharge: "Successfully establishing a Link via Flash Breach without triggering any IC response refunds the 1 Bandwidth at the end of the turn." },
  { name: "Cipher Overdrive", action: "Impulse Action", cost: 1, text: "Trigger: You cast a Cipher. Spend 1 Bandwidth to either add +1d6 to your Cipher Attack roll or increase your Cipher Save DC by +2 for that injection.", recharge: "If the Cipher succeeds and the target node fails its save by 5 or more, refund the 1 Bandwidth." },
  { name: "Trace Cutter", action: "Impulse Action", cost: 1, text: "Trigger: You would suffer the effects of an Alert response. Spend 1 Bandwidth to wipe the Alert from the node's logs before it propagates. The trace fails to advance.", recharge: "If you Brick a Node before the end of your next turn, refund the 1 Bandwidth." },
  { name: "Sympathetic Resonance", action: "Impulse Action", cost: 1, text: "Trigger: You would take damage from an IC Counterattack. Spend 1 Bandwidth to force the IC to roll its damage twice and take the lower result.", recharge: "If the higher of the two damage rolls would have exceeded your Firewall threshold but the lower roll does not, refund the 1 Bandwidth at the end of the turn." },
  { name: "Cold Read", action: "Swift Action", cost: 1, text: "Spend 1 Bandwidth to scan a target you can see (a visible person, vehicle, or device). You immediately learn the Tier and Cipher Save Bonus of any Node carried by, installed in, or operated by that target, and what IC tier (if any) defends those Nodes.", recharge: "If you establish a Link to, or Brick, one of the scanned target's Nodes before the end of your next turn, refund the 1 Bandwidth." },
  { name: "Brownout", action: "Action", cost: 1, text: "Target one enemy you can Scan and Breach that carries cybernetics or has the Machine Physiology trait. You force a cascading power dip through their hardware, dropping their systems into a momentary lockout. The target must make a Body Save against your Cipher Save DC (8 + your Tech Modifier + your Caliber). On a failure, until the start of your next turn they roll with Snag on attack rolls and their Speed is halved. This is a lockout, not a burnout. Nothing is permanently damaged.", recharge: "If the target is hit by an attack before the start of your next turn, refund the 1 Bandwidth at the end of the turn." },
  { name: "Targeting Spoof", action: "Impulse Action", cost: 1, text: "Trigger: An enemy you can see within 12 spaces targets you or an ally for an attack using networked optics, a Smart weapon, or similar targeting systems. You inject corrupted data into their targeting solution at the moment of firing, forcing the attacker to roll that attack with Snag.", recharge: "If the attack fails to hit its target, you regain the 1 spent Bandwidth." }
];
var CODEBREAKER_GRID_EXPLOITS_TEXT = "**Signature #GRID Exploits**\n\nYou have access to a suite of **Signature #GRID Exploits**: foundational class moves no other class can replicate. Each costs **1 Bandwidth** to activate and has a **recharge trigger** that, when met, refunds the spent Bandwidth. You may use any Exploit any number of times, provided you have the Bandwidth to spend or recharge it.\n\n" + CODEBREAKER_GRID_EXPLOITS.map(function (e) {
  return "**" + e.name + " (" + e.action + "):** " + e.text + (e.recharge ? "\n\n• **Recharge:** " + e.recharge : "");
}).join("\n\n");

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
    fuels: "Bandwidth represents your ability to force your will upon a node, overclock your Smartdeck, and execute the exploits that define the Codebreaker class. Bandwidth fuels every Cipher you cast above the most basic tier and powers Signature #GRID Exploits.",
    abilityNoun: "Signature #GRID Exploit",
    abilityNounPlural: "Signature #GRID Exploits",
    learn: { knowsAll: true, picks: [] },
    abilities: CODEBREAKER_GRID_EXPLOITS
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
      { name: "Bandwidth", text: "**Bandwidth** represents your ability to force your will upon a node, overclock your Smartdeck, and execute the exploits that define the Codebreaker class. Your mind is built for the #GRID's data streams.\n\n**Your Bandwidth Pool**\n\nYour maximum Bandwidth equals your **Caliber + your Tech Modifier** (minimum 1). You regain all spent Bandwidth at the end of a Short or Long Rest.\n\n**Your Repertoire**\n\nYou are a Power User on the #GRID. You begin play with a **Tier 1 (Improved) Smartdeck** and a custom **Repertoire** of Ciphers: your personal library of code. You start with **four Ciphers** of your choice from the Complexity 0 or Complexity 1 tiers.\n\nYou can integrate additional Ciphers into your Repertoire by spending the required Material Cost and one uninterrupted Downtime period (8 hours). There is no upper limit on how many Ciphers you can know. The only limit is what you can afford and what your Smartdeck can run.\n\nYour Smartdeck's tier determines which Ciphers you can execute. A Smartdeck can run Ciphers up to **(Smartdeck Tier + 1) in Complexity**: a Tier 1 (Improved) deck runs Complexity 0-2; a Tier 5 (Apex) deck runs the entire Cipher library. Ciphers above your deck's capacity can be added to your Repertoire, but they will not execute until you upgrade your hardware.\n\n**Multi-Link**\n\nYou can sustain multiple simultaneous Links, unlike Standard Users who are capped at one. Your active Link limit is **twice your Caliber**. More Links means more leverage, and more leverage means the consequences of a failed Stability Check hit harder.\n\n**Cipher Casting Costs**\n\nBandwidth fuels every Cipher above the most basic tier. Complexity 0 Ciphers are free. Complexity 1-3 cost 1 Bandwidth. Complexity 4-5 cost 2 Bandwidth. **Signature Ciphers** (Logic Bomb, Daisy Chain, Puppet String, System Cascade, Black Sun) cost a flat 1 Bandwidth regardless of Complexity.\n\n" + CODEBREAKER_GRID_EXPLOITS_TEXT },
      { name: "Second Language", text: "You read code the way other people read body language: patterns, intentions, weaknesses, visible at a glance.\n\nOnce per turn, when you would make a Cipher Attack against a Node, you may instead spend a **Swift Action** to study it. Your next Cipher Attack against that Node, made this turn or next, gains **+2 to hit** and **ignores 1 point of Firewall threshold**. If the Node is destroyed, switches networks, or you lose your Link to it before you make the follow-up attack, the benefit is lost." },
      { name: "Codebreaker Subclass", text: "You choose a Codebreaker subclass, representing your specialization. This subclass grants features at specific Codebreaker levels. You gain all subclass features for which you meet the required Codebreaker level, both now and as you continue to advance. You may only select one subclass." }
    ],
    "2": [
      { name: "Wireless Root Access", text: "Your operational reach expands. You no longer need line of sight to interact with the #GRID. You can Scan, Breach, and establish Links with any Node within **24 spaces**, even through solid walls, provided the target is not encased in a Faraday cage or shielded by Elite or Apex tier countermeasures." },
      { name: "Universal Upgrade", text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "3": [
      { name: "Subclass Feature", text: "You gain a feature granted by your chosen Codebreaker subclass at this level." }
    ],
    "4": [
      { name: "Universal Upgrade", text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "5": [
      { name: "Multi-Thread Processing", text: "Once per combat encounter, as a single Action, you may inject **two different Ciphers** into **two different Nodes** you are currently Linked to. Resolve both Cipher Attacks or Saves simultaneously. Each Cipher pays its full Bandwidth cost independently." }
    ],
    "6": [
      { name: "Tactical Execution", text: "Once per round, when you use your Action to establish a Link or inject a Cipher, you may immediately use your Swift Action to make a single standard attack with a Sidearm or SMG. If you are attacking a physical target whose Node you are currently Linked to, that weapon attack is made with **Edge**." },
      { name: "Universal Upgrade", text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "7": [
      { name: "Subclass Feature", text: "You gain a feature granted by your chosen Codebreaker subclass at this level." }
    ],
    "8": [
      { name: "Universal Upgrade", text: "Your Freelancer grows in a way that defines them. Choose one: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "9": [
      { name: "SysAdmin (Root Access)", text: "You are the absolute authority in #GRID architecture. You gain the following benefits:\n\n• **Unlimited Threading:** You no longer have a maximum cap on concurrent Links. The only limit is how many you can maintain through Stability Checks under fire.\n• **#GRID Initiative:** When you roll Initiative with 0 Bandwidth remaining, immediately regain 3 Bandwidth. You never start a fight empty.\n• **Hardware Mastery:** Your Downtime Repair cost drops from \u{1D4A2}10 per Durability to \u{1D4A2}5 per Durability. Bricked deck part costs (\u{1D4A2}100 x Tier) are unchanged." }
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
        { level: 1, name: "Hardware Integration", text: "You treat physical machines as extensions of your nervous system. You gain the following benefits:\n\n• **Tool Proficiency:** Proficiency with Engineering Tools, letting you repair and customize robotic assets.\n• **Persistent Link:** You begin play with a custom Companion Drone (profile below). You maintain a permanent Link to it that does not count against your maximum active Links. If the drone is destroyed, you can rebuild it during a Long Rest by spending 𝒢100 in salvage and succeeding on an Engineering Dice Pool check.", nested: [{ name: "Companion Drone (Base Profile)", text: "• **Size:** Small (a rotor-drone, mechanical hound, treaded scout, or similar).\n• **Speed:** 6. Choose Flying, Climbing, or Ground movement when you build it.\n• **Defense:** 12 + your Tech Modifier.\n• **Vitality:** 10 + (Codebreaker Level × 4).\n\n• **Action Economy:** On your turn, spend an Impulse Action to command the drone to move up to its Speed and take one Action (attack, interact with an object, or take the Help action).\n• **Attack:** Mounted Sidearm or Taser. d20 + your Tech Modifier vs Defense; deals 1d6 + Tech Modifier Piercing or Electric damage." }] },
        { level: 3, name: "Cybernetic Overclock", text: "As a **Swift Action**, spend 1 Bandwidth to grant your Companion Drone one of the following Overclock protocols for 1 minute:\n\n• **Aggressive Protocol:** The drone's attacks deal an additional 1d6 damage and gain Edge on attack rolls.\n• **Ablative Protocol:** The drone projects a localized shield, gaining Vigor equal to your Codebreaker Caliber + your Tech Modifier.\n• **Recon Protocol:** The drone gains Tremor Sense (or advanced optics) up to 6 spaces. Any enemy it hits loses the Hidden or Invisible condition until the end of your next turn." },
        { level: 7, name: "Swarm Commander", text: "Your Companion Drone now acts freely on your turn, without costing an Impulse Action.\n\nYou can also hijack hostile hardware. As an **Action**, spend 2 Bandwidth to target an enemy drone, turret, or automated vehicle you are Linked to, then make a Cipher Attack against its Security Rating. On a hit, you seize total control: for 1 minute the hardware acts on your turn as an allied unit using its own stat block. At the end of each of its turns, the target may make a Cipher Saving Throw to purge your control and end the effect early." },
        { level: 10, name: "Iron Reign", text: "You gain the following benefits:\n\n• **Multi-Drone Command:** You may build and maintain a second Companion Drone under the same rules. Both share your permanent Link, and neither counts against your maximum Links.\n• **Network Authority:** Hijacks from Swarm Commander last until you release the target, the target is destroyed, or you reduce another hijacked target to 0 Durability. You can only maintain one hijacked target at a time; taking another ends the first.\n• **Built to Last:** Companion Drones rebuilt during Downtime cost no salvage." }
      ]
    },
    {
      key: "gridweaver",
      name: "The #GRID Weaver",
      description: "To you, reality is just another data stream, and you know exactly how to edit it. You are a master psychological hacker, specializing in manipulating augmented reality, spoofing sensory data, and feeding false information into enemy comms and cyber optics. To fight you is to fight ghosts, shadows, and the enemy's own lying eyes.\n\nA Weaver does not destroy the world. A Weaver convinces the world to disagree with itself. You teach a corporate guard's HUD to lie about what is in front of him. You teach his ear-comm to lie about who is speaking. You teach his own cyber-optics to render his squadmates as enemies. By the time he realizes none of it was true, it does not matter.",
      features: [
        { level: 1, name: "AR Architect", text: "You inject false terrain and environmental cues into augmented perception. You gain Proficiency in Deception, and when using augmented reality, digital disguises, or cyber-optic manipulation to deceive, you may use your Tech modifier in place of Charm.\n\n• **Static Illusions:** As an **Impulse Action**, project minor static AR elements within 6 spaces (false signage, holographic barriers, fake wall panels, environmental warnings). They appear real to anyone relying on augmented vision or screen-based perception and persist for up to 1 minute.\n\n• **Localized AR Terrain Construct:** As a **Swift Action**, spend 1 Bandwidth to project a construct filling up to an Area 3 Cube within 12 spaces for 1 minute. **False Cover:** Enemies may take cover behind the projection but gain no Defense bonus or Damage Reduction. **Pathing Disruption:** Enemies relying on augmented perception path around hazards or reposition based on the illusion. **Perceptual Authority:** Observers treat the construct as real until they physically interact with it, see an object pass through it, or use an Action to examine it and pass a Wits (Intuition) d20 check against your Cipher Save DC. Once proven false, it becomes translucent to them and they can ignore it." },
        { level: 3, name: "Ghost Persona Protocol", text: "You maintain a secondary, heavily encrypted Ghost Persona in your Smartdeck. While it is active, Intrusion Countermeasures (IC) and automated security perceive you as a legitimate, benign user. This grants no actual clearance or privileged access; it only lets you operate on the #GRID with less initial scrutiny.\n\n• You gain Edge on in-combat Systems (Tech) d20 checks (or +1 Edge Die to out-of-combat Dice Pools) to bypass Firewalls or avoid IC detection.\n• Any attempt to scan, trace, or identify you on the #GRID resolves instead to a false civilian or corporate identity of your choosing.\n• Blatant missteps, repeated access failures, or obvious protocol violations still shatter the illusion and trigger a security response.\n\n**Ghost Decoy:** As a **Swift Action**, spend 1 Bandwidth to project a Ghost Decoy within 6 spaces, injecting your falsified identity into local AR and network perception. It appears as you or an ally and behaves as a seamless real-time duplicate. The decoy has 1 Vitality and your Defense score, and lasts up to 1 minute.\n\n• **Perceptual Priority:** Enemies and IC relying on augmented vision or network targeting treat the decoy as a valid target and may prioritize it.\n• **False Engagement:** If the decoy is attacked, the strike passes harmlessly through it and it shatters into visual static. The attacker's action is entirely wasted.\n• **Feedback Spike:** The attacker suffers Snag on their next attack roll.\n• **Trace Backlash:** The attacker's exact position is immediately pinged to your squad." },
        { level: 7, name: "Memetic Virus", text: "As an **Action**, spend 2 Bandwidth and force up to three enemies within 12 spaces to make a Wits Save (DC = 8 + your Tech Modifier + Systems Proficiency Bonus). On a failure, they perceive an inescapable threat for 1 minute: they are Frightened of you and must use their movement to get away from you on their turn. If a Frightened target willingly moves closer to you, the dissonance deals it 4d6 Psychic damage. An affected target may repeat the Wits Save at the end of each of its turns to end the effect." },
        { level: 10, name: "Reality Overwrite", text: "Once per Long Rest, as an **Action**, spend 2 Bandwidth to overwrite an Area 20×20 Cube for 1 minute. Your squad is immune to the illusion, and your hardware bypasses the hard-light. All enemies inside the zone suffer:\n\n• **Foveated Disorientation:** The shifting labyrinth counts as Difficult Terrain (halving Speed), and they suffer continuous Snag on all attack rolls.\n• **Asymmetric Reality:** Because the hard-light solidifies only in response to enemy interactions, you control the battlefield's physical layout. Projections intercept enemy fire and block enemy Line of Sight; you and your allies gain Total Cover against ranged attacks made by enemies inside the zone.\n• **Sensory Rejection:** At the start of each of their turns, enemies must make a Wits Save (DC = 8 + your Tech Modifier + your Systems Proficiency Bonus). **On a failure:** They take 4d6 Psychic damage. **On a success:** They take half damage and map the geometry. Until the end of that turn, they ignore the area's Difficult Terrain penalty and your squad's Total Cover benefit; if they start their next turn still inside, they make that Wits Save with Edge." }
      ]
    },
    {
      key: "burner",
      name: "The Burner",
      description: "You are not a quiet infiltrator; you are a digital demolitionist. To you, the #GRID is a weapon of mass destruction. You specialize in absolute brute force breaches, zero-day exploits, and malicious code that violently overclocks enemy hardware. When you hack a system, you do not just steal the data; you melt the servers and detonate the batteries.\n\nA Burner is the answer to a corporation's worst question: what if someone with your knowledge of our systems wanted to break them? You do not slip past defenses. You set them on fire on the way in. Your code is loud, hot, and irreversible. Your reputation precedes you in every server farm.",
      features: [
        { level: 1, name: "Scorched Earth Policy", text: "You weaponize security against its host. You gain the following benefits:\n\n• **Malicious Injection:** Whenever you deal damage to a Node's System Integrity (after surplus damage is calculated), the connected enemy (if any) takes an additional 1d6 damage of the appropriate type.\n• **Feedback Spike:** Once per turn, when a Node carried by or installed in an enemy fails a Cipher Saving Throw against you, or you hit that Node with a Cipher Attack, the connected enemy takes Electric damage equal to your Codebreaker Caliber + your Tech Modifier.\n• **Kickback:** When you deal damage to a Node, you may use an **Impulse Action** to redirect the recoil at a target within 6 spaces. It takes 1d6 damage of the same type as the cipher's damage, then must make a Body Save against your Cipher Save DC or be knocked Prone. The target must be visible to you with a clear line of effect; you cannot Kickback through walls or full cover." },
        { level: 3, name: "Hardware Override", text: "As a **Swift Action**, spend 1 Bandwidth and target one enemy whose cyberware, smart-tech, or internal Node you are Linked to. The target's hardware must make a Cipher Saving Throw against your Cipher Save DC. On a failure, choose one:\n\n• **Smart-Lockout:** Their smart-weapons and cyber-arms lock up. They drop whatever they are holding and cannot pick up or fire weapons until the end of their next turn.\n• **Servo Seizure:** Their synthetic muscles or motor-assists glitch. Their Speed drops to 0 and they cannot take Impulse Actions until the end of their next turn.\n• **Thermal Venting:** Their cooling limiters fail. They take 2d6 Fire damage and lose their next Swift Action." },
        { level: 7, name: "Vector Worm", text: "As an **Action**, spend 2 Bandwidth to inject a self-replicating worm into a Node you are Linked to. The target must make a Cipher Saving Throw against your Cipher Save DC.\n\n• **On a failure:** The connected enemy takes 4d6 Electric damage and loses all current Vigor as their defenses crash. The worm then jumps to the nearest enemy Node within 3 spaces of the primary target, forcing that Node to make the same Save.\n• **On a success:** The target takes half damage, keeps their Vigor, and the worm's replication ends.\n\n**The Chain:** The worm can jump up to three times (up to four targets total) and cannot hit the same target twice in one turn. You need no prior Link to the jump targets; the worm breaches them automatically." },
        { level: 10, name: "Kill Code", text: "Once per Long Rest, as an **Action**, spend 2 Bandwidth and target one enemy whose Node you are Linked to. They must make a Tech Save against your Cipher Save DC.\n\n• **On a failure:** Their systems suffer catastrophic meltdown. They take 8d10 Electric damage and their cybernetics are bricked (the Node's System Integrity drops to 0). For 1 minute, they suffer Snag on all physical attack rolls and saving throws and cannot use any abilities that rely on tech or cybernetics.\n• **On a success:** They hit their own emergency kill-switch, taking half of the 8d10 damage with no ongoing penalties, and Explosive Decompression does not occur.\n\n**Explosive Decompression:** If this damage reduces the target to 0 Wounds (or they die while bricked by this ability), their power core detonates. All other targets within 3 spaces must make an Agility Save against your Cipher Save DC, taking 4d6 Fire damage on a failure (half on a success)." }
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
    gridExploits: CODEBREAKER_GRID_EXPLOITS,
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

// Overdrive Maneuvers as structured sub-entries: the single source for the engine, the Class-tab
// picker, and the print sheet. The Overdrive feature's prose (below) is composed from this list,
// so the displayed text and the machine-readable data can never drift apart. The Fury learns two
// at Level 1 and two more at Level 5 via Expanded Overdrive; unless noted each costs 1 Overdrive.
var FURY_OVERDRIVE_INTRO = "The Fury runs on explosive bursts of adrenaline, cybernetic power, or pure rage. **Overdrive** represents physical feats that push past normal bodily limits.\n\n**Your Overdrive Pool**\n\nYour maximum Overdrive equals your **Caliber + your Body Modifier** (minimum 1). You regain all spent Overdrive at the end of a Short or Long Rest.\n\n**Overdrive Maneuvers**\n\nAt 1st Level, you learn two Overdrive Maneuvers. You learn two additional Maneuvers at 5th Level through Expanded Overdrive.\n\n**Cornered.** A Fury is never more dangerous than when their own blood is up. Some Maneuvers are marked *Cornered*. While you are **Bloodied**, a Cornered Maneuver gains the additional effect listed in its description.";
var FURY_OVERDRIVE_MANEUVERS = [
  { name: "Wrecking Ball", action: "Action", cost: 1, text: "Target one Enemy within your melee reach. Make a standard melee attack. On a hit, deal an additional 1d8 Bludgeoning damage and the target gains 1 stack of *Bleeding*.\n\n• **Cornered:** The target gains 2 stacks of *Bleeding* instead and is knocked *Prone*." },
  { name: "Clear the Path", action: "Action", cost: 1, text: "Target one Enemy within your melee reach. Make a standard melee attack. On a hit, deal normal damage and push the target up to 3 spaces directly away from you. If the target is pushed into a solid obstacle (a wall, a vehicle, another target), both the target and the obstacle take additional Bludgeoning damage equal to your Body Modifier." },
  { name: "Seismic Stomp", action: "Action", cost: 1, text: "You slam the ground with devastating force. All enemies within 3 spaces must make an Agility Save (DC = 8 + your Body Modifier + your Caliber). On a failure, they take Bludgeoning damage equal to your Caliber + your Body Modifier and gain the *Staggered* condition (Speed halved, lose Swift and Impulse Actions) until the end of their next turn." },
  { name: "Bring the House Down", action: "Action", cost: 1, text: "Target one wall, pillar, vehicle, barricade, or similar large structure within your melee reach, or a point on the ground within reach. The structure is torn apart or the floor is cratered. The area within 2 spaces of that point becomes Difficult Terrain from the wreckage, and any Cover the destroyed object was providing is gone. Each Enemy within 2 spaces must succeed on an Agility Save (DC = 8 + your Body Modifier + your Caliber) or be knocked *Prone* and take Bludgeoning damage equal to your Caliber from flying debris. Thanks to Collateral Damage, you can bring down reinforced structures that would normally be too solid to break in a single blow, though the GM may rule that truly massive or load-bearing targets require more than one." },
  { name: "Linebreaker", action: "Swift Action", cost: 1, text: "Until the end of your turn, you can move through spaces occupied by enemies. Any enemy whose space you pass through must make a Body Save (DC = 8 + your Body Modifier + your Caliber) or be knocked *Prone*." },
  { name: "Redline", action: "Swift Action", cost: 1, text: "You take Vitality damage equal to your Caliber (this damage cannot be reduced or prevented). Until the end of your turn, each of your weapon attacks deals an additional 1d10 damage of the weapon's type.\n\n• **Cornered:** Redline costs no Vitality, the bonus damage increases to 2d10, and your attacks ignore Resistance until the end of your turn." },
  { name: "Meat Shield", action: "Impulse Action", cost: 1, text: "Trigger: An ally within 2 spaces is hit by an attack. You instantly swap places with the ally and take the damage from the attack instead. You have Resistance to the damage taken this way.\n\n• **Cornered:** After you take the hit, you may immediately make a single standard melee attack against the attacker if they are within your reach." },
  { name: "Make an Example", action: "Impulse Action", cost: 1, text: "Trigger: You reduce an Enemy to 0 Vitality with a melee attack. Each Enemy within 3 spaces who can see you must succeed on a Wits Save (DC = 8 + your Body Modifier + your Caliber) or become *Shaken*.\n\n• **Cornered:** An Enemy that fails the save is *Frightened* instead of *Shaken*." }
];
var FURY_OVERDRIVE_TEXT = FURY_OVERDRIVE_INTRO + "\n\n" + FURY_OVERDRIVE_MANEUVERS.map(function (m) {
  return "**" + m.name + " (" + m.action + "):** " + m.text;
}).join("\n\n");

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
    fuels: "The Fury relies on explosive bursts of adrenaline, cybernetic power, or pure rage called Overdrive. Overdrive represents physical feats that push past normal bodily limits to shatter the battlefield. Overdrive fuels Overdrive Maneuvers.",
    abilityNoun: "Overdrive Maneuver",
    abilityNounPlural: "Overdrive Maneuvers",
    learn: { knowsAll: false, picks: [{ level: 1, count: 2 }, { level: 5, count: 2 }] },
    abilities: FURY_OVERDRIVE_MANEUVERS
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
      { name: "Overdrive", text: FURY_OVERDRIVE_TEXT },
      { name: "Collateral Damage", text: "Your melee attacks and Overdrive Maneuvers deal double damage to inanimate objects, structures, and Cover Integrity. Whenever you attempt to Intimidate someone by destroying an object, crushing something in your bare hands, or demonstrating raw physical power, you gain **Edge** on the Intimidation check." },
      { name: "Fury Subclass", text: "You choose a Fury subclass, representing your specialization. This subclass grants features at specific Fury levels. You gain all subclass features for which you meet the required Fury level, both now and as you continue to advance. You may only select one subclass." }
    ],
    "2": [
      { name: "Relentless Advance", text: "Whenever you spend an Action to **Dash**, or whenever you spend Overdrive to activate a Maneuver that alters physical positioning (such as *Linebreaker* or *Clear the Path*), you gain **Vigor** equal to your Caliber + your Body Modifier and ignore movement penalties from Difficult Terrain for the duration of that turn." },
      { name: "Universal Upgrade", text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "3": [
      { name: "Subclass Feature", text: "You gain a feature granted by your chosen Fury subclass at this level." }
    ],
    "4": [
      { name: "Universal Upgrade", text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "5": [
      { name: "Extra Attack", text: "Whenever you take the Attack Action on your turn, you can make two standard weapon attacks instead of one." },
      { name: "Expanded Overdrive", text: "You learn **two additional** Overdrive Maneuvers from the core list." }
    ],
    "6": [
      { name: "Shrug It Off", text: "Once per encounter, when you fail a Save against an effect that would inflict the *Stunned*, *Paralyzed*, or *Confused* condition, you can use your Impulse Action to force your body to ignore the stimulus. You succeed on the Save instead, taking Vitality damage equal to your Caliber. This damage cannot be resisted or reduced." },
      { name: "Universal Upgrade", text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "7": [
      { name: "Subclass Feature", text: "You gain a feature granted by your chosen Fury subclass at this level." }
    ],
    "8": [
      { name: "Universal Upgrade", text: "At levels 2, 4, 6, and 8, your Freelancer grows in a way that defines them. Choose one of the following: increase one Attribute by 2, or two Attributes by 1 each (to a maximum of 20), or select one Talent for which you meet the requirements." }
    ],
    "9": [
      { name: "Adrenaline Engine", text: "Whenever you score a Critical Success (Natural 20) on an attack roll, or **once per round** when you suffer Wound damage from an Enemy's attack, you immediately regain 1 spent Overdrive (this cannot exceed your maximum)." }
    ],
    "10": [
      { name: "Subclass Capstone", text: "You gain the capstone feature granted by your chosen Fury subclass at this level." }
    ]
  },
  progressionTable: [
    { level: 1, caliber: 1, features: ["Overdrive", "Collateral Damage", "Fury Subclass"], resource: "-" },
    { level: 2, caliber: 1, features: ["Relentless Advance", "Universal Upgrade"], resource: "-" },
    { level: 3, caliber: 2, features: ["Subclass Feature"], resource: "+5 Points" },
    { level: 4, caliber: 2, features: ["Universal Upgrade"], resource: "-" },
    { level: 5, caliber: 3, features: ["Extra Attack", "Expanded Overdrive"], resource: "-" },
    { level: 6, caliber: 3, features: ["Shrug It Off", "Universal Upgrade"], resource: "+5 Points" },
    { level: 7, caliber: 4, features: ["Subclass Feature"], resource: "-" },
    { level: 8, caliber: 4, features: ["Universal Upgrade"], resource: "-" },
    { level: 9, caliber: 5, features: ["Adrenaline Engine"], resource: "-" },
    { level: 10, caliber: 5, features: ["Subclass Capstone"], resource: "+5 Points" }
  ],
  subclasses: [
    {
      key: "juggernaut",
      name: "The Juggernaut",
      description: "You do not need millions of credits in proprietary cybernetics to be an unstoppable force; you just need gravity, momentum, and a heavy slab of metal. You are a master of physical conditioning and armor optimization. You turn whatever gear you can afford into an impenetrable fortress through perfect angling, staggering physical density, and a sheer, terrifying refusal to yield the right-of-way.",
      features: [
        { level: 1, name: "The Walking Anvil", text: "You gain Proficiency with Improvised Weapons, treating heavy debris, torn rebar, or broken furniture as lethal tools.\n\nWhile wearing Medium Armor, Heavy Armor, or wielding a Physical Shield, you gain Edge on all Saves and contested checks made to resist being pushed, pulled, or knocked Prone.\n\nWhenever you use the Wrecking Ball or Clear the Path Overdrive maneuver while wielding a melee weapon with the Heavy trait, an Improvised Weapon, or a Physical Shield, the target is shoved an additional 1 space back." },
        { level: 3, name: "Brace for Impact", text: "As an **Impulse Action** when you are hit by an attack that deals physical or energy damage, spend 1 Overdrive to brace against the strike. Reduce the incoming damage by 1d10 + your Body Modifier + your Caliber. If this reduces the damage to 0, the attacker takes physical damage equal to your Body Modifier." },
        { level: 7, name: "Unstoppable Momentum", text: "As a **Swift Action**, spend 2 Overdrive to enter this state for up to 1 minute (or until the encounter ends). While active, you gain Resistance to all physical damage, and your Speed cannot be reduced by external effects, difficult terrain, or conditions like Staggered. At the start of each of your turns, you lose Vigor equal to your Caliber (if you have no Vigor, you lose Vitality instead). You can end this state early as a free action on your turn." },
        { level: 10, name: "Earthbreaker", text: "Once per Long Rest, as an **Action**, launch yourself into the air and crash down into any unoccupied space you can see within 6 spaces.\n\nThe impact releases a seismic shockwave in an Area 4 centered on your landing space. The battlefield devastation resolves automatically, before any Saving Throw: the Area 4 becomes difficult terrain, and every section of Cover, door, or destructible object inside it that is Fortified or weaker is reduced to 0 Integrity and destroyed. Hardened cover (vault doors, bunker walls, armored vehicle hulls, and similar military-grade fortifications) remains standing but still loses Integrity equal to half the damage this shockwave deals, ignoring its Structure threshold.\n\nEvery enemy in the Area 4 must then make a Body Save (DC = 8 + your Body Modifier + your Caliber).\n\n• **On a failure:** They take 6d8 + your Body Modifier Bludgeoning damage, are pushed 2 spaces directly away from you, and are knocked Prone.\n• **On a success:** They take half damage and are not pushed or knocked Prone." }
      ]
    },
    {
      key: "reaver",
      name: "The Reaver",
      description: "You do not rely on supernatural speed or advanced targeting optics; you rely on terrifying, overwhelming physical power. You are an engine of brutal, relentless destruction, treating heavy, two-handed weapons as if they were toys. You wade into the center of the enemy formation and turn yourself into a walking meat grinder, effortlessly battering down defenses through sheer, unstoppable momentum.",
      features: [
        { level: 1, name: "Colossal Grip", text: "You ignore the Two-Handed trait for melee weapons, wielding them effectively in one hand. You can also use your **Swift Action** to make a Follow-Up Attack with any melee weapon in your other hand, ignoring the usual requirement that the off-hand weapon have the Light or Off hand trait." },
        { level: 3, name: "Cross-Block", text: "As an **Impulse Action** when you are hit by a physical melee attack or a ranged ballistic attack, spend 1 Overdrive to cross your weapons and catch the strike. Roll one of your weapon's damage dice and reduce the incoming damage by the result + your Body Modifier + your Caliber. If this reduces the damage to 0, you crush the attacker's momentum:\n\n• **Melee:** The attacker is pushed 1 space away and Staggered until the end of their next turn.\n• **Ranged Ballistic:** You swat the projectile from the air, and the shockwave grants you Vigor equal to your Body Modifier." },
        { level: 7, name: "Thresher Stance", text: "As a **Swift Action**, spend 2 Overdrive to enter Thresher Stance for up to 1 minute (or until the encounter ends). While in the stance, whenever you hit an enemy with a melee weapon, you may immediately apply half the damage dealt to a second enemy within your melee reach. You also gain Edge on all contested checks or Saves made to break free from grapples or physical restraints." },
        { level: 10, name: "Avalanche of Iron", text: "Once per Long Rest, as an **Action**, target a single enemy you can see within 6 spaces. Move up to your Speed directly toward it; if you reach it, make four standard melee attacks against it.\n\n• Every attack that hits deals maximum damage on the dice and drives the target 1 space backward; you advance into the space it left.\n• If the barrage drives the target into a solid obstacle (a wall, vehicle, or another target), the remaining attacks in the sequence automatically hit, and the target is Stunned until the end of its next turn." }
      ]
    },
    {
      key: "arsenal",
      name: "The Arsenal",
      description: "You do not need to be a sharpshooter when you have a high enough rate of fire. You are a walking weapons platform, utilizing your sheer physical mass to absorb the recoil of heavy artillery and dual-wield firearms that were never meant to be fired from the hip. You command the battlefield through absolute suppression, deafening noise, and a catastrophic volume of lead.",
      features: [
        { level: 1, name: "Walking Emplacement", text: "You ignore the Two-Handed, Heavy, Setup, and Crew Served traits of all ranged weapons: you do not suffer Snag, lose the ability to Sprint, or require an ally to operate these weapons on the move.\n\nBecause you rely on brute-force recoil control rather than precise targeting, you may use your Body modifier instead of your Agility modifier when calculating your Weapon Save DC. You still use your Agility modifier for standard ranged attack rolls.\n\nYou can also dual-wield ranged weapons. Use your **Swift Action** to make a Follow-Up Attack (a single standard shot) with a ranged weapon in your other hand, ignoring the usual requirement that the off-hand weapon have the Light or Off hand trait.\n\n**Heavy Weapon Limit:** You can operate a Crew Served weapon unassisted, but its mass requires both arms to stabilize; you cannot dual-wield if either equipped weapon has the Crew Served trait." },
        { level: 3, name: "Suppressive Counter", text: "As an **Impulse Action** when an enemy you can see makes an attack against you or an ally within your weapon's short range, spend 1 Overdrive to suppress them. You impose Snag on their attack roll. If your weapon has the Burst or Full-Auto firing mode, you also reduce the attack's damage by 1d10 + your Body Modifier; if the target is using Cover, its Integrity is reduced by the same amount." },
        { level: 7, name: "Bullet-Storm Protocol", text: "As a **Swift Action**, spend 2 Overdrive to enter this protocol for up to 1 minute (or until the encounter ends). While active:\n\n• Your ranged weapons do not consume standard ammunition.\n• Whenever a target takes damage from your ranged weapon (from an attack roll or a failed Weapon Save), they are shoved 1 space away from you and their Speed is halved until the end of their next turn.\n• Overdrive Maneuvers that normally require a melee attack (like Wrecking Ball or Clear the Path) can be performed as a point-blank ranged blast against an enemy or object within 2 spaces." },
        { level: 10, name: "Maximum Overdrive", text: "Once per Long Rest, as an **Action**, target an Area 6 Cone originating from you. Every enemy in the cone must make an Agility Save (DC = 8 + your Body Modifier + your Caliber).\n\n• **On a failure:** They take 6d10 + your Body Modifier Ballistic or Energy damage (depending on your equipped weapons), are Deafened, and are pinned, reducing their Speed to 0 until the end of their next turn.\n• **On a success:** They take half damage and are not Deafened or pinned.\n\nThe volume of fire instantly reduces the Integrity of all Cover, doors, and destructible objects in the cone to 0." }
      ]
    }
  ],
  extra: {
    overdriveManeuvers: FURY_OVERDRIVE_MANEUVERS
  }
};
