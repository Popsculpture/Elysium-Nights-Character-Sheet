/* ===========================================================================
   ELYSIUM NIGHTS — The #GRID (hacking) data
   Nodes, scanning, ciphers, firewalls, IC, devices, LinkDeath, and the gear
   a Codebreaker / Standard User runs. Transcribed from "The #GRID" (Part 2).
   Prices in Glimmer (𝒢). The #GRID tab reads these tables; the engine derives
   the live Cipher Attack / Save DC / Link math from the character.
   =========================================================================== */
window.EN = window.EN || {};

EN.grid = {
  intro: "The #GRID is the city's shared nervous system — a distributed mesh of devices, vehicles, sensors, servers, and quiet cyberware all talking at once. Every connected object throws a digital reflection of itself into the mesh as a node; inside each node live elements. For most people the #GRID is wallpaper. For a Codebreaker or a Sourcerer it is a second battlefield with its own gravity.",

  coreConcepts: [
    { term: "Node", summary: "The digital representation of a device, system, or network segment." },
    { term: "Element", summary: "Anything inside a node: Personas, programs, IC, anomalies, or data caches." },
    { term: "Link", summary: "A live connection between your device and a node. Needed to inject most ciphers (⇋)." },
    { term: "Cipher", summary: "Illegal hardware modules that let you breach, subvert, or weaponize nodes." },
    { term: "System Integrity", summary: "A node's durability. When it hits 0, the node is bricked." },
    { term: "Firewall", summary: "A node's outer armor — a damage threshold against incoming cipher damage." },
    { term: "Stability Check", summary: "The save that determines whether you keep your Links online under disruption." },
    { term: "LinkDeath", summary: "Violent severing of your Links to the #GRID, with psychic backlash." },
    { term: "Cascade Failure", summary: "The catastrophic critical-failure state of LinkDeath. Multi-Link only." }
  ],

  /* ---- Nodes (Tier → Security Rating / Cipher Save Bonus / System Integrity) ---- */
  nodeTiers: [
    { tier: "Rudimentary", t: 0, security: 10, saveBonus: 3, integrity: null },
    { tier: "Standard",    t: 1, security: 12, saveBonus: 4, integrity: null },
    { tier: "Improved",    t: 2, security: 14, saveBonus: 5, integrity: 3 },
    { tier: "Advanced",    t: 3, security: 16, saveBonus: 6, integrity: 4 },
    { tier: "Premium",     t: 4, security: 18, saveBonus: 7, integrity: 5 },
    { tier: "Elite",       t: 5, security: 20, saveBonus: 8, integrity: 6 },
    { tier: "Apex",        t: 6, security: 21, saveBonus: 9, integrity: 7 }
  ],
  hardenedNote: "A Hardened Node adds its Tier as a flat bonus to its Cipher Save Bonus, on the shared tier scale (Standard 0 → Apex 5): a Hardened Apex node has +9 + 5 = +14 to saves. Reserve for genuinely high-stakes targets: corporate vaults, military mainframes, Pre-Collapse black boxes.",
  lowSecurityNote: "Rudimentary nodes are the floor of the #GRID — cameras, cheap smartlocks, disposable consumer devices. No Integrity, no Firewall: a single successful Cipher Attack or Quick Hack bricks them. Standard nodes (civilian vehicles, commercial smartguns) still lack Integrity, but a Firewall might stand in the way — flip a coin on whether the owner paid for one.",
  quickHackNote: "A Quick Hack is the same roll as a Cipher Attack, plus your Smartdeck's Device Bonus. Burner Relays and B&E Buddies use their own baked-in Attack bonus instead of yours.",

  elements: [
    { kind: "Personas", text: "Player avatars and NPC user presence — Standard Users; Power Users like Codebreakers, Sourcerers, #GRID Guardians." },
    { kind: "Scripts", text: "Constructs (bots, IC), Anomalies (rogue AIs, Flow echoes), Programs (software, daemons)." },
    { kind: "Caches", text: "Files, Logs, Settings." }
  ],

  /* ---- Scanning & Detection ---- */
  scanIntro: "Finding what to hack is its own skill — half of what's worth hitting hides behind a node disguised as a vending machine. Out of combat, scan via a Systems (Tech) Dice Pool; in combat, a d20 Systems check or Quick Hack.",
  scanning: [
    { quality: "Rudimentary device",     dc: 8,  snag: 1 },
    { quality: "Standard consumer gear", dc: 10, snag: 1 },
    { quality: "Improved security gear", dc: 11, snag: 2 },
    { quality: "Advanced infrastructure",dc: 12, snag: 2 },
    { quality: "Premium corporate",      dc: 13, snag: 3 },
    { quality: "Elite or black lab",     dc: 14, snag: 4 },
    { quality: "Apex or experimental",   dc: 15, snag: 5 }
  ],
  scanMods: [
    { name: "Camouflaged Node",   condition: "Disguised as something else", d20: "+2", pool: "+1 Snag Die" },
    { name: "High Interference",  condition: "RF noise, Flow storms, jamming", d20: "+4", pool: "+2 Snag Dice" },
    { name: "Hardened Security",  condition: "Stealth routing, decoy beacons", d20: "+6", pool: "+3 Snag Dice" },
    { name: "Rural / Clear Space",condition: "Few signals, open sight lines", d20: "−2", pool: "+1 Edge Die" },
    { name: "Familiar Ground",    condition: "You have maps or prior intel", d20: "−3", pool: "+1 Edge Die" },
    { name: "Specialized Scanner",condition: "Top shelf or Flow-tuned gear", d20: "−4", pool: "+2 Edge Dice" }
  ],
  scanCapNote: "Modifier Stack Cap: beneficial modifiers cannot reduce a scan DC by more than 6 total. A perfectly prepped scan can be easy, but never trivial.",

  /* ---- Links ---- */
  linkEstablish: "1. Identify the target node within range. 2. Roll a Cipher Attack vs. the node's Security Rating. 3. On success you establish a Link — it persists until severed.",
  linkLimits: "Standard Users: 1 active Link at a time (opening a new one closes the old). Codebreakers: maximum active Links equal to 2 × Caliber; at Level 9 the SysAdmin (Root Access) feature removes the cap entirely (unlimited Links, bounded only by Stability Checks). Multi-linking is the signature loop of the class — and a tightrope: the more Links you hold, the worse a failed Stability Check becomes.",
  stabilityCheck: "A Link doesn't care that you're being shot at, only whether you're still upright. A Stability Check is a Body or Wits save, DC 10 or half the total damage taken that turn, whichever is higher. Roll one whenever you take damage from outside the #GRID while holding any Links, or take direct psychic damage from an IC Counterattack you elected to intercept. Success: all Links hold. Failure: all Links sever and LinkDeath triggers. Falling unconscious severs all Links automatically; a clean voluntary shutdown has no backlash. If your deck is Bricked, no Stability Check is possible — all Links sever and LinkDeath triggers.",

  /* ---- Ciphers ---- */
  cipherAttackFormula: "Cipher Attack: d20 + Tech mod + Systems Proficiency Bonus vs. node's Security Rating.",
  cipherSaveFormula: "Cipher Save DC: 8 + Tech mod + Systems Proficiency Bonus. Nodes resist save-based ciphers with d20 + Cipher Save Bonus.",
  cipherOutcomes: "Node fails its save: cipher takes full effect. Node succeeds: cipher is resisted, and IC automatically retaliates.",
  cipherComplexityNote: "Complexity 0–5. Standard Users can use Complexity 0; Complexity 1+ is Power User territory. Casting cost (Codebreaker): Complexity 0 free; 1–3 cost 1 Bandwidth; 4–5 cost 2 Bandwidth; Signature ciphers a flat 1 Bandwidth.",
  cipherDamage: [
    { complexity: "Standard", c: 0, roll: "1d6" },
    { complexity: "Improved", c: 1, roll: "2d6" },
    { complexity: "Advanced", c: 2, roll: "3d6" },
    { complexity: "Premium",  c: 3, roll: "4d6" },
    { complexity: "Elite",    c: 4, roll: "5d6" },
    { complexity: "Apex",     c: 5, roll: "6d6" }
  ],
  cipherDamageNote: "Combat ciphers roll damage by Complexity, compared to the node's Firewall threshold. If the damage EXCEEDS the threshold, the node loses 1 System Integrity; if equal or less, it's discarded — the Firewall holds. Even an Apex cipher can be turned aside by an Elite Firewall on a low roll; the way through is layered (bypasses, drains, ciphers that target Cipher Saves).",
  minionRule: "Rudimentary and Standard nodes ignore the Firewall-threshold rule: any successful cipher hit deals 1 HP and bricks them outright (Minion Rule).",

  /* ---- Firewalls (node armor) ---- */
  firewalls: [
    { tier: "Standard", price: 400,  securityBonus: 2, threshold: 2 },
    { tier: "Improved", price: 800,  securityBonus: 3, threshold: 3 },
    { tier: "Advanced", price: 1200, securityBonus: 4, threshold: 4 },
    { tier: "Premium",  price: 1800, securityBonus: 5, threshold: 5 },
    { tier: "Elite",    price: 2500, securityBonus: 6, threshold: 6 },
    { tier: "Apex",     price: 3500, securityBonus: 7, threshold: 7 }
  ],
  firewallNote: "Firewalls are armor, not HP. Security Bonus adds to the node's Security Rating; incoming cipher damage must EXCEED the Damage Threshold to deal 1 HP to System Integrity. Rolls equal to or under the threshold are discarded.",

  /* ---- Intrusion Countermeasures ---- */
  icIntro: "IC are scripts that live inside nodes, waiting. When a node succeeds its Cipher Saving Throw, the resident IC triggers ONE response (the GM picks which, by tier). No extra dice — only the cipher save matters.",
  ic: [
    { tier: "Basic",      price: 300,  detection: 1, responses: ["Alert"] },
    { tier: "Advanced",   price: 600,  detection: 2, responses: ["Alert", "Analyze"] },
    { tier: "Adaptive",   price: 900,  detection: 3, responses: ["Alert", "Analyze", "Counterattack"] },
    { tier: "Aggressive", price: 1300, detection: 4, responses: ["Alert", "Analyze", "Counterattack", "Lockdown"] }
  ],
  icCounter: [ { tier: "Adaptive", dmg: "3d6" }, { tier: "Aggressive", dmg: "4d6" } ],
  icDetectionNote: "Detection Bonus applies to IC's contested Wits-based checks against your Stealth, Systems, or Flow tricks (flat in combat; Edge Dice in Dice Pools).",
  icResponses: [
    { name: "Alert", text: "The IC silently logs the breach attempt and your digital signature. You are NOT notified. The GM tracks the trace — advancing a security clock, dispatching a #GRID Guardian, or triggering physical response forces." },
    { name: "Analyze", text: "The node's Cipher Save Bonus increases by +2 against this specific hacker for the rest of the scene. Stacks if Analyze triggers again. The longer you poke at a smart node, the smarter it gets." },
    { name: "Counterattack", text: "Hostile code fires back down your attack vector. Damage by IC tier (Adaptive 3d6 / Aggressive 4d6). It normally hits your Smartdeck or B&E Buddy for 1 HP regardless of the roll; the rolled damage only applies if you choose to intercept." },
    { name: "Lockdown", text: "(Aggressive only) You cannot voluntarily disconnect for 1d4 rounds, AND a #GRID Guardian is dispatched. Wait it out (other ciphers still work, but every action draws attention) or cut bait and run (force-sever — triggers LinkDeath immediately)." }
  ],
  interceptionNote: "Codebreaker Damage Interception: when an IC Counterattack triggers, before the damage is rolled you may intercept the hit personally instead of letting the deck take 1 HP. The damage is rolled, reduced by your deck's Firewall threshold, and the remainder is taken as Psychic damage — then you make a Stability Check. Decide before the roll; no peeking.",

  /* ---- Devices & durability ---- */
  durabilityNote: "Smartdecks and B&E Buddies use durability HP: any successful hit deals exactly 1 HP regardless of the rolled damage. At 0 HP the device is Bricked — completely inoperative; all active Links sever, triggering LinkDeath; it must be repaired before reuse.",
  repair: "Downtime Repair (full HP): during an 8-hour Downtime, restore to full at 𝒢10 per HP (a Bricked device also needs replacement parts at 𝒢100 × (Tier+1)). Field Repair (partial): 1 hour + an Engineering Dice Pool restores 1 HP per successful Edge die, up to missing HP — but cannot recover a Bricked device.",

  /* ---- LinkDeath ---- */
  linkDeathIntro: "LinkDeath is what happens when a Link is torn out of your skull instead of closed cleanly. It triggers when you fail a Stability Check, your deck is Bricked while linked, you 'cut bait and run' out of Lockdown, or your device is physically destroyed while linked.",
  linkDeathResolution: "Make a single Stability Check vs. the disconnection DC (DC 10, or half the total damage taken that turn, whichever is higher). One save, one damage roll, no chaining. Success: you ride the disconnect — take half damage and are Dazed until the end of your next turn. Failure: take 2d6 Psychic + 1d6 per additional Link beyond the first, and fall Unconscious (at the end of each turn while Unconscious, make a Wits Save vs. the DC to wake, Dazed until end of next turn).",
  cascadeFailure: "Cascade Failure triggers only when you fail the LinkDeath Stability Check by 5 or more AND held 2+ active Links. All normal LinkDeath consequences apply, AND your Smartdeck is automatically Bricked regardless of remaining HP — full Downtime repair required. The candle burning twice as bright: multi-linking is the Codebreaker's greatest weapon and greatest risk.",
  standardUserLinkDeath: "Standard Users don't connect deeply enough to take psychic damage. LinkDeath hits the B&E Buddy directly (1 HP per dropped Link — always 1 for Standard Users); rolled damage is discarded. The user is Dazed until end of next turn but takes no personal damage. If the Buddy hits 0 HP it's Bricked.",
  sourcererLinkDeath: "As an Impulse Action, a Sourcerer may voluntarily take 1 Wound to ground the feedback through their resonance: they take half the rolled psychic damage and are Dazed until end of next turn, staying conscious even if Vitality drops to 0.",
  guardians: "#GRID Guardians are elite corporate counter-hackers with god-tier admin access over entire node clusters — not scripts. They build like Codebreakers, fight in the same digital space, and own the floor. Drawing one's attention can be fatal: if a Guardian tracks your signature, they can dispatch armed physical security to your exact location.",

  /* ---- Repertoire economy ---- */
  repertoireNote: "A Codebreaker integrates any rulebook cipher into their Repertoire by spending the Material Cost + one uninterrupted Downtime (8 hours) — no Dice Pool checks. Dice Pool checks (Engineering or Systems) are only needed to invent a wholly new cipher or to craft a standard one at a steep discount. Back up your Repertoire regularly; if you lose your deck, slotted ciphers stay usable until it's lost or Bricked.",
  cipherCosts: [
    { tier: "Rudimentary", material: 25,  recovery: 5 },
    { tier: "Standard",    material: 50,  recovery: 10 },
    { tier: "Improved",    material: 100, recovery: 20 },
    { tier: "Advanced",    material: 150, recovery: 30 },
    { tier: "Premium",     material: 200, recovery: 40 },
    { tier: "Elite",       material: 300, recovery: 50 },
    { tier: "Apex",        material: 500, recovery: 60 }
  ],

  /* ============================ EQUIPMENT ============================ */
  /* Smartdecks — the Codebreaker's Power-User rig. HP = Tier+3, Mod Slots = Tier. */
  smartdecks: [
    { tier: "Standard", t: 0, price: 450,   deviceBonus: 0, trait: "Hacking tool",              modSlots: 0, hp: 3 },
    { tier: "Improved", t: 1, price: 1200,  deviceBonus: 1, trait: "Encrypted comms",           modSlots: 1, hp: 4 },
    { tier: "Advanced", t: 2, price: 3000,  deviceBonus: 1, trait: "Trace-resistant signature", modSlots: 2, hp: 5 },
    { tier: "Premium",  t: 3, price: 6500,  deviceBonus: 2, trait: "Encrypted Channel",          modSlots: 3, hp: 6 },
    { tier: "Elite",    t: 4, price: 11000, deviceBonus: 2, trait: "Adaptive Buffer",            modSlots: 4, hp: 7 },
    { tier: "Apex",     t: 5, price: 18000, deviceBonus: 3, trait: "Quantum Core",               modSlots: 5, hp: 8 }
  ],
  smartdeckTraitNote: "Each Smartdeck has the trait on its tier row, and keeps all lower traits too (an Apex deck has every trait). Governing Skill: Systems — Tech runs the load-bearing math (Bandwidth, Cipher Attacks, Cipher Save DC, Links); Wits applies to general Systems checks. A deck runs ciphers up to (Tier + 1) in Complexity.",
  smartdeckTraits: [
    { name: "Hacking Tool", text: "Baseline capability: execute Power-User ciphers, maintain Links, and apply the listed Device Bonus to Cipher Attacks. Every Smartdeck has this." },
    { name: "Encrypted Comms", text: "Voice, text, and data are encrypted by default. Tracking, intercepting, or decrypting requires a Systems check vs. the deck's Security Rating." },
    { name: "Trace-Resistant Signature", text: "Any IC Alert response against you rolls with Snag (+1 Snag Die on a Dice Pool). They still log a trace — it just points somewhere fuzzy." },
    { name: "Encrypted Channel", text: "Immune to passive Alert traces — the deck doesn't register in the slow corporate dragnets. Active hostile code still finds you." },
    { name: "Adaptive Buffer", text: "Stability Check DCs against you are reduced by 2." },
    { name: "Quantum Core", text: "Once per scene, reroll a failed Cipher Attack." }
  ],

  /* B&E Buddy — the Standard-User rig. HP = Tier+2. */
  buddies: [
    { tier: "Standard", t: 0, price: 250, attack: 3, saveDc: 11, maxNode: 0, hp: 2 },
    { tier: "Improved", t: 1, price: 500, attack: 5, saveDc: 13, maxNode: 1, hp: 3 },
    { tier: "Advanced", t: 2, price: 900, attack: 7, saveDc: 15, maxNode: 2, hp: 4 }
  ],
  buddyNote: "The Smartdeck's criminal cousin — handheld, ugly, dependable, for anyone who never trained as a Power User. Governing Skill: Systems (Tech). User Type: Standard User. Hardware Lockout: breaching a Premium or higher node makes the Buddy audibly spark and refuse — taking 1 HP of durability damage; the hack fails before it begins.",
  buddyCiphers: [
    { name: "Node Sweeper", type: "Utility", exec: "1 Action", range: "Self (Area 6 radius)", text: "Scan for nearby devices and nodes. Hidden devices roll Cipher Save vs. the Buddy's DC or are revealed." },
    { name: "Access Spike", type: "Breach", exec: "1 Action", range: "12 spaces", text: "Cipher Attack vs. node Security Rating. On hit, establish a Link (lasts 8 hours)." },
    { name: "Access Override ⇋", type: "Utility", exec: "1 Action", range: "Touch (linked)", text: "Target an electronic lock on a linked node. Fail: lock/unlock the mechanism. Success: lock resists; IC retaliates." },
    { name: "Hijack Stream ⇋", type: "Detection", exec: "1 Action", range: "12 spaces", text: "Intercept video/audio from a linked device. Fail: clone or reroute the feed. Success: access denied; IC retaliates." },
    { name: "Data Probe ⇋", type: "Detection", exec: "1 Action", range: "Self (via Link)", text: "Probe a linked node for files/logs/configs. Grants Edge on d20 (or +1 Edge Die) for Investigation or Systems searches." },
    { name: "Data Extraction ⇋", type: "Utility", exec: "1 Swift Action", range: "Touch", text: "Copy identified files from a linked node. Fail: clean copy, no trace. Success: you still get the data, but IC retaliates and leaves a forensic trail." }
  ],

  /* Burner Relays — disposable single-shot, anyone can fire. */
  relays: [
    { tier: "Standard", t: 0, price: 100,  saveDc: 13, attack: 5,  maxNode: 0 },
    { tier: "Improved", t: 1, price: 200,  saveDc: 15, attack: 7,  maxNode: 1 },
    { tier: "Advanced", t: 2, price: 350,  saveDc: 17, attack: 9,  maxNode: 2 },
    { tier: "Premium",  t: 3, price: 500,  saveDc: 18, attack: 10, maxNode: 3 },
    { tier: "Elite",    t: 4, price: 750,  saveDc: 19, attack: 11, maxNode: 4 },
    { tier: "Apex",     t: 5, price: 1000, saveDc: 21, attack: 12, maxNode: 5 }
  ],
  relayNote: "Disposable, overclocked, single-shot — anyone can fire one, then both Relay and cipher are slag. If the cipher's Tier exceeds what the user can handle, roll Systems (Tech) DC 10 + cipher Tier (or Snag Dice = cipher Tier out of combat): success = full power; failure (margin −1 to −4) = Save DC & Attack reduced by 2; critical failure (Nat 1 / margin −5+) = the Relay sparks and dies, cipher lost. Codebreaker Special: extract an unused Relay's cipher into your Repertoire during Downtime.",

  /* Smartdeck hardware modifications. */
  mods: [
    { key: "heatsinks",   name: "Reinforced Heatsinks", price: 600,  slots: 1, type: "Durability",
      text: "Repurposed gaming-rig cooling. Increases the deck's Durability HP by +2. Once per deck.", bonus: { hp: 2 } },
    { key: "sweep",       name: "Sweep Suite Plug-In", price: 800,  slots: 1, type: "Scanning",
      text: "Military-grade detection libraries. +1 Edge Die on all Scanning Dice Pools (or Edge on d20 Systems checks) to detect hidden, camouflaged, or hardened nodes. Does not interact with the Modifier Stack Cap." },
    { key: "burnnotice",  name: "Burn Notice Module", price: 900,  slots: 1, type: "Trace Evasion",
      text: "If the deck is Bricked by a LinkDeath failure (including Cascade), it wipes its memory and routes a false ping — the enemy node rolls with Snag to trace your physical location." },
    { key: "icebreaker",  name: "ICE-Breaker Algorithm", price: 1200, slots: 1, type: "Failure Mitigation",
      text: "On a critical failure (margin −5 or worse on d20, or −3 or worse on a Dice Pool) of a Systems check to breach a node, spend 1 deck HP to downgrade it to a standard Failure, preventing immediate lockout." },
    { key: "coprocessor", name: "Overclocked Coprocessor", price: 1500, slots: 1, type: "Action Economy",
      text: "As an Impulse Action, spend 1 Bandwidth to accelerate one Cipher by one step (Action→Swift, Swift→Impulse). No per-encounter limit." },
    { key: "trigger",     name: "Trigger Cache", price: 1800, slots: 1, type: "Bandwidth",
      text: "At the start of each combat, gain 2 Temporary Bandwidth (expire at end of encounter, stack on top of your max). Lost immediately if your deck is Bricked." },
    { key: "redline",     name: "Redline Lattice", price: 2800, slots: 2, type: "Multi-Link (Speed)",
      text: "Maintain one additional active Link beyond your normal maximum. Downside: Stability Check DCs against you +2, and any Alert response upgrades to also include Analyze, even from Basic IC.", bonus: { links: 1 } },
    { key: "crown",       name: "Crown Spike Array", price: 3500, slots: 2, type: "Offensive Multi-Target",
      text: "As an Action, cast one cipher and apply it to two Linked nodes simultaneously, paying its Bandwidth cost once (both save independently). Downside: IC Counterattacks against you roll with Edge, and you land in corporate threat databases fast." },
    { key: "predator",    name: "Predator Stack", price: 4000, slots: 2, type: "Offensive Bonus",
      text: "+2 to Cipher Attack rolls against Advanced or higher nodes, and +1 to your Cipher Save DC against the same. Downside: each successful breach of an Advanced+ node leaves a forensic hash — gain 1 Heat with that node's owning faction." }
  ]
};
