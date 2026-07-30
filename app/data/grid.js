/* ===========================================================================
   ELYSIUM NIGHTS · The #GRID (hacking) data
   Nodes, scanning, ciphers, firewalls, IC, devices, LinkDeath, and the gear
   a Codebreaker / Standard User runs. Transcribed from "The #GRID" (Part 2).
   Prices in Glimmer (𝒢). The #GRID tab reads these tables; the engine derives
   the live Cipher Attack / Save DC / Link math from the character.
   =========================================================================== */
window.EN = window.EN || {};

EN.grid = {
  intro: "The #GRID is the city's shared nervous system, a distributed mesh of devices, vehicles, sensors, servers, and quiet cyberware all talking at once. Every connected object throws a digital reflection of itself into the mesh as a node; inside each node live elements. For most people the #GRID is wallpaper. For a Codebreaker or a Sourcerer it is a second battlefield with its own gravity.",

  coreConcepts: [
    { term: "Node", summary: "The digital representation of a device, system, or network segment." },
    { term: "Element", summary: "Anything inside a node: Personas, programs, IC, anomalies, or data caches." },
    { term: "Link", summary: "A live connection between your device and a node. Needed to inject most ciphers (⇋)." },
    { term: "Cipher", summary: "Illegal hardware modules that let you breach, subvert, or weaponize nodes." },
    { term: "System Integrity", summary: "A node's hit points. When they hit 0, the node is bricked." },
    { term: "Firewall", summary: "A node's armor. Its threshold subtracts from every incoming cipher damage roll." },
    { term: "Stability Check", summary: "The save that determines whether you keep your Links online under disruption." },
    { term: "LinkDeath", summary: "The violent severing of a Link instead of a clean close, with psychic backlash." },
    { term: "Cascade Failure", summary: "One involuntary disconnect dragging more Links down with it. Multi-Link only." }
  ],

  /* ---- Nodes (Tier → Security Rating / Cipher Save Bonus / System Integrity) ---- */
  nodeTiers: [
    { tier: "Rudimentary", t: 0, security: 10, saveBonus: 3, integrity: null },
    { tier: "Standard",    t: 1, security: 12, saveBonus: 4, integrity: null },
    { tier: "Improved",    t: 2, security: 14, saveBonus: 5, integrity: 20 },
    { tier: "Advanced",    t: 3, security: 16, saveBonus: 6, integrity: 30 },
    { tier: "Premium",     t: 4, security: 18, saveBonus: 7, integrity: 35 },
    { tier: "Elite",       t: 5, security: 20, saveBonus: 8, integrity: 40 },
    { tier: "Apex",        t: 6, security: 21, saveBonus: 9, integrity: 50 }
  ],
  hardenedNote: "A Hardened Node adds its Tier as a flat bonus to its Cipher Save Bonus, on the shared tier scale (Standard 0 → Apex 5): a Hardened Apex node has +9 + 5 = +14 to saves. Reserve for genuinely high-stakes targets: corporate vaults, military mainframes, Pre-Collapse black boxes.",
  lowSecurityNote: "Rudimentary nodes are the floor of the #GRID, cameras, cheap smartlocks, disposable consumer devices. No Integrity, no Firewall: a single successful Cipher Attack or Quick Hack bricks them. Standard nodes (civilian vehicles, commercial smartguns) still lack Integrity, but a Firewall might stand in the way; flip a coin on whether the owner paid for one.",
  quickHackNote: "A Quick Hack is the same roll as a Cipher Attack, plus your Smartdeck's Device Bonus. Burner Relays and B&E Buddies use their own baked-in Attack bonus instead of yours.",

  elements: [
    { kind: "Personas", text: "Player avatars and NPC user presence, Standard Users; Power Users like Codebreakers, Sourcerers, #GRID Guardians." },
    { kind: "Scripts", text: "Constructs (bots, IC), Anomalies (rogue AIs, Flow echoes), Programs (software, daemons)." },
    { kind: "Caches", text: "Files, Logs, Settings." }
  ],

  /* ---- Scanning & Detection ---- */
  scanIntro: "Finding what to hack is its own skill; half of what's worth hitting hides behind a node disguised as a vending machine. Anything loud enough to broadcast is already on your map, no roll required. For anything quieter, compare your Passive Systems (10 + Tech modifier + Systems Proficiency Bonus, plus always-on scanning gear) against the node's Scan DC; that is the default, and most scenes never need more. When a node hides better than your Passive can reach, stop and sweep: out of combat a Systems (Tech) Dice Pool, under fire a single Systems check or Quick Hack (d20 + Tech modifier + Systems Proficiency Bonus) that costs your Action. You cannot Link, breach, or target a node you have not found.",
  /* Scan DC measures concealment, not power: a Standard smartwatch can be Ghosted,
     an Apex server can sit wide open. Only nodes hidden on purpose (or strange by
     nature) get a Scan DC at all; everything else broadcasts. */
  scanning: [
    { quality: "Broadcasting",   dc: "none", reads: "Wants to be found: consumer gear, public infrastructure, anything advertising a service. Detected automatically." },
    { quality: "Obscured",       dc: 12,     reads: "Not hidden on purpose, just lost in the noise. One device in a crowded signal-space." },
    { quality: "Masked",         dc: 15,     reads: "Wearing another object's face. The camera disguised as a smoke detector." },
    { quality: "Stealth-Routed", dc: 18,     reads: "Actively dodging: decoy beacons, bounced signals, corporate concealment built to be overlooked." },
    { quality: "Ghosted",        dc: 21,     reads: "Barely there. Pre-Collapse black boxes, Flow-shrouded nodes, things that went dark on purpose and stayed that way." }
  ],
  /* What helps, what hurts: each grants Edge or Snag on the scan, never a DC shift. */
  scanMods: [
    { name: "High Interference", condition: "RF noise, Flow storms, active jamming",       d20: "Snag", pool: "+1 Snag Die" },
    { name: "Clear Space",       condition: "Few competing signals, open sight lines",     d20: "Edge", pool: "+1 Edge Die" },
    { name: "Familiar Ground",   condition: "Maps or prior intel on the target",           d20: "Edge", pool: "+1 Edge Die" },
    { name: "Specialized Gear",  condition: "A Flow-tuned scanner, a dedicated signal rig", d20: "Edge", pool: "+1 Edge Die" }
  ],
  scanCapNote: "Modifier Stack Cap: situational Edge caps at +2 Edge Dice on a Dice Pool scan. On a d20 or Passive scan, Edge does not stack: a second source adds nothing. Gear built to ignore this cap, like the Sweep Suite Plug-In, says so in its own text. A perfect setup makes a hard scan easy. Nothing makes a Ghosted node routine.",

  /* ---- Links ---- */
  linkEstablish: "1. Identify the target node within range. 2. Roll a Cipher Attack vs. the node's Security Rating. 3. On success you establish a Link; it persists until severed.",
  linkLimits: "Standard Users: 1 active Link at a time (opening a new one closes the old). Sourcerers: maximum active Links equal to Caliber, held open by sprites instead of hardware. Codebreakers: maximum active Links equal to 2 × Caliber; at Level 9 the SysAdmin (Root Access) feature removes the cap entirely (unlimited Links, bounded only by Stability Checks). Multi-linking is the signature loop of the class, and a tightrope: the more Links you hold, the worse a failed Stability Check becomes.",
  stabilityCheck: "A Link doesn't care that you're being shot at, only whether you're still upright. A Stability Check is a Body or Wits save, DC 10 or half the total damage taken that turn, whichever is higher. Roll one whenever you take damage from any source while holding one or more Links: gunfire, a blast wave, an IC Counterattack you intercepted, or LinkDeath feedback itself. Success: your Links hold and nothing else happens. Failure: one Link of your choice is torn away, and that severance is a LinkDeath graded by the margin of this same check; there is no second roll, and your remaining Links hold, for the moment. If the damage knocks you Unconscious outright, skip the check: falling Unconscious severs every Link on its own terms. Closing a Link voluntarily never requires a roll and carries no backlash of any kind. A Bricked deck is a forced disconnect instead: every Link tears away at once, with no check to save it.",

  /* ---- Ciphers ---- */
  cipherAttackFormula: "Cipher Attack: d20 + Tech mod + Systems Proficiency Bonus vs. node's Security Rating.",
  cipherSaveFormula: "Cipher Save DC: 8 + Tech mod + Systems Proficiency Bonus. Nodes resist save-based ciphers with d20 + Cipher Save Bonus.",
  cipherOutcomes: "Node fails its save: cipher takes full effect. Node succeeds: cipher is resisted, and IC automatically retaliates.",
  cipherComplexityNote: "Complexity 0-5. Standard Users run Complexity 0 on their own; Complexity 1+ is Power User territory, and a Codebreaker's Smartdeck sets their ceiling. The B&E Buddy is the exception: its baked-in suite scales to the Buddy's own tier and still works for a Standard User at Complexity 1 or 2. Casting cost (Codebreaker): Complexity 0 free; 1-3 cost 1 Bandwidth; 4-5 cost 2 Bandwidth; Signature ciphers a flat 1 Bandwidth.",
  cipherDamage: [
    { complexity: "Standard", c: 0, roll: "1d6" },
    { complexity: "Improved", c: 1, roll: "2d6" },
    { complexity: "Advanced", c: 2, roll: "3d6" },
    { complexity: "Premium",  c: 3, roll: "4d6" },
    { complexity: "Elite",    c: 4, roll: "5d6" },
    { complexity: "Apex",     c: 5, roll: "6d6" }
  ],
  cipherDamageNote: "Combat ciphers roll damage by Complexity. Subtract the target node's Firewall Damage Threshold (if any) from the roll; whatever remains comes off the node's System Integrity. A roll reduced to 0 or less is discarded entirely and the Firewall holds. At 0 System Integrity the node is bricked. Even an Apex cipher can be turned aside by an Elite Firewall on a low roll; the way through is layered (bypasses, drains, ciphers that target Cipher Saves instead of slamming the Firewall).",
  minionRule: "Rudimentary and Standard nodes ignore the Firewall-threshold rule: they have no Integrity to whittle down, so any successful cipher hit bricks them outright (Minion Rule).",

  /* ---- Firewalls (node armor) ---- */
  firewalls: [
    { tier: "Standard", price: 400,  securityBonus: 2, threshold: 2 },
    { tier: "Improved", price: 800,  securityBonus: 3, threshold: 3 },
    { tier: "Advanced", price: 1200, securityBonus: 4, threshold: 4 },
    { tier: "Premium",  price: 1800, securityBonus: 5, threshold: 5 },
    { tier: "Elite",    price: 2500, securityBonus: 6, threshold: 6 },
    { tier: "Apex",     price: 3500, securityBonus: 7, threshold: 7 }
  ],
  firewallNote: "Firewalls are armor, not hit points. Security Bonus adds to the node's Security Rating; the Damage Threshold subtracts from every incoming cipher damage roll before it touches System Integrity, and whatever remains comes off Integrity. Damage reduced to 0 or less is discarded.",

  /* ---- Intrusion Countermeasures ---- */
  icIntro: "IC are scripts that live inside nodes, waiting. When a node resists a cipher, whether by succeeding its Cipher Saving Throw or by turning aside a Cipher Attack that missed its Security Rating, the resident IC triggers ONE response. Higher tiers gain additional response types; the GM selects which fires based on the situation. No additional dice are needed to determine whether IC triggers.",
  ic: [
    { tier: "Basic",      price: 300,  detection: 1, responses: ["Alert"] },
    { tier: "Advanced",   price: 600,  detection: 2, responses: ["Alert", "Analyze"] },
    { tier: "Adaptive",   price: 900,  detection: 3, responses: ["Alert", "Analyze", "Counterattack"] },
    { tier: "Aggressive", price: 1300, detection: 4, responses: ["Alert", "Analyze", "Counterattack", "Lockdown"] }
  ],
  icCounter: [ { tier: "Adaptive", dmg: "3d6" }, { tier: "Aggressive", dmg: "4d6" } ],
  icDetectionNote: "Detection Bonus applies to IC's contested Wits-based checks against your Stealth, Systems, or Flow tricks (flat in combat; Edge Dice in Dice Pools).",
  icResponses: [
    { name: "Alert", text: "The IC silently logs the breach attempt and your digital signature. You are NOT notified. The GM tracks the trace, advancing a security clock, dispatching a #GRID Guardian, or triggering physical response forces." },
    { name: "Analyze", text: "The node's Cipher Save Bonus increases by +2 against this specific hacker for the rest of the scene. Stacks if Analyze triggers again. The longer you poke at a smart node, the smarter it gets." },
    { name: "Counterattack", text: "Hostile code fires back down the cipher's attack vector. Roll damage by IC tier (Adaptive 3d6 / Aggressive 4d6). The rolled damage always applies: it normally hits your Smartdeck or B&E Buddy, so subtract that device's Firewall Damage Threshold (if any) and the remainder comes off its System Integrity. A Codebreaker may intercept the hit personally instead. A Sourcerer has no device to eat the hit and no Firewall to reduce it: the rolled damage always lands in full as Psychic damage, then a Stability Check as normal." },
    { name: "Lockdown", text: "(Aggressive only) You cannot voluntarily disconnect for 1d4 rounds, AND a #GRID Guardian is dispatched. Wait it out (other ciphers still work, but every action draws attention) or cut bait and run (force-sever, triggers LinkDeath immediately)." }
  ],
  interceptionNote: "Codebreaker Damage Interception: when an IC Counterattack triggers, you may choose, before the damage is rolled, to intercept the hit personally instead of letting your Smartdeck eat it. Either way the damage is rolled once and reduced by the deck's Firewall Damage Threshold (if any); the only question is who takes what is left. Let the deck eat it and the remainder subtracts from the Smartdeck's System Integrity; intercept and the remainder lands on you as Psychic damage, and you must then make a Stability Check to maintain your Links. Decide before the damage roll; no peeking at the dice.",

  /* ---- Devices & System Integrity ---- */
  durabilityNote: "Carried gear always has an Integrity track: Smartdecks and B&E Buddies track System Integrity like any node, and damage subtracts from it. Cipher damage tests the device's Firewall first and the remainder comes off Integrity; physical damage ignores Firewalls and lands at full value. Unlike Rudimentary and Standard infrastructure, a device never bricks on a single hit; it dies by the numbers. At 0 Integrity the device is Bricked, completely inoperative; all active Links sever, triggering LinkDeath as a forced disconnect, and it must be repaired before reuse.",
  repair: "Downtime Repair (full restore): during an 8-hour Downtime, restore a device to full System Integrity at 𝒢10 per 5 Integrity restored (round up); a Bricked device also needs replacement parts at 𝒢100 × (Tier+1). Field Repair (partial): 1 hour plus a successful Engineering Dice Pool restores 5 System Integrity per successful Edge die, up to the missing total, but cannot recover a Bricked device. Only Downtime can do that.",

  /* ---- LinkDeath ---- */
  linkDeathIntro: "LinkDeath is what happens when a Link is torn out of your skull instead of closed cleanly. A Link severs involuntarily in one of two ways: a failed Stability Check tears away one Link of your choice, or a forced disconnect rips away every Link involved at once (your deck is Bricked while you hold Links, a device you are linked to is physically destroyed, or you 'cut bait and run' to escape a Lockdown). Either way, the price is paid per Link.",
  linkDeathResolution: "Every Link severed involuntarily deals 2d6 Psychic damage in feedback; when several go at once, roll 2d6 per severed Link as one pool. The margin of the failed Stability Check grades the landing. Failed by 4 or less, the soft landing: take half the feedback and be Dazed until the end of your next turn. Failed by 5 or more, the hard landing: take the full feedback and fall Unconscious (at the end of each of your turns while Unconscious, make a Wits Save against the same DC to wake, Dazed until the end of your next turn). On a forced disconnect the check cannot save the Links, it only grades the landing, and passing it counts as the soft landing. On a mass involuntary disconnect (a Bricked deck, or falling Unconscious while linked) your Smartdeck stands in the way first: the pool subtracts from its remaining System Integrity and no Firewall applies, because the surge comes up the Links themselves. If the deck hits 0 it is Bricked, and every point beyond what it absorbed spills into you as Psychic damage in full. A deckless user has no hardware in the way; the psychic price is the whole bill.",
  cascadeFailure: "Feedback is damage, and you are still linked. Each severed Link's feedback adds to the turn's damage total and immediately forces a fresh Stability Check for the Links you have left, at the higher DC that total now sets. Every failure tears away another Link, deals its own feedback, and asks the question again, harder. When one involuntary disconnect drags more Links down with it, that is a Cascade Failure. A cascade ends one of three ways: you pass a check and the survivors hold, you run out of Links, or you fall Unconscious and everything left discharges at once. The candle burning twice as bright: multi-linking is the Codebreaker's greatest weapon and greatest risk.",
  standardUserLinkDeath: "Standard Users don't connect deeply enough to take psychic damage from a disconnect. When a Standard User suffers LinkDeath, the feedback hits the B&E Buddy instead: roll it and subtract it from the Buddy's System Integrity. However hard the landing, the user is Dazed until the end of their next turn, takes no personal damage, and never falls Unconscious from the disconnect. If the feedback zeroes the Buddy it is Bricked and the rest of the surge dissipates; a Standard User does not run deep enough for the spill to reach them.",
  sourcererLinkDeath: "As an Impulse Action when LinkDeath lands on them, a Sourcerer may take 1 Wound to ground the feedback through their resonance: treat their landing as a soft landing (half the Psychic damage, Dazed until the end of their next turn) no matter how hard the severance hit. If something else has already dropped them and the severance fires while they are going down, they may still spend the Impulse and the Wound to ground the backlash to that same soft tier. It spares them the feedback; it does not undo the wound that put them there.",
  guardians: "#GRID Guardians are elite corporate counter-hackers with god-tier admin access over entire node clusters, not scripts. They build like Codebreakers, fight in the same digital space, and own the floor. Drawing one's attention can be fatal: if a Guardian tracks your signature, they can dispatch armed physical security to your exact location.",

  /* ---- Repertoire economy ---- */
  repertoireNote: "Acquire it clean: a Codebreaker integrates any rulebook cipher into their Repertoire by spending the Material Cost + one uninterrupted Downtime (8 hours), no Dice Pool checks, full price for certainty. Craft it instead and the materials cost half (the Craft column): a Project on the Dice Pool Method, Primary Skill Systems (Tech) or Engineering (Tech), Kit Codebreaker Suite with the Smartdeck Peripheral Kit helping, and the Project Tier scales to Complexity (0 to 1 Simple, 2 to 3 Standard, 4 to 5 Advanced). A Failure burns the interval and the parts; a Mixed Result lands a flawed cipher (a reduced Cipher Save DC, or an Alert that trips on first use each scene) until you tear it down and rebuild it. Inventing a wholly new cipher is its own animal: a Prototype-tier Project. Back up your Repertoire regularly; if you lose your deck, slotted ciphers stay usable until it's lost or Bricked.",
  /* Six tiers, Standard [0] through Apex [5]. craft = half materials as a Project,
     material = Acquire Clean (no roll), recovery = restore from backup. */
  cipherCosts: [
    { tier: "Standard", cx: 0, craft: 25,  material: 50,  recovery: 10 },
    { tier: "Improved", cx: 1, craft: 50,  material: 100, recovery: 20 },
    { tier: "Advanced", cx: 2, craft: 75,  material: 150, recovery: 30 },
    { tier: "Premium",  cx: 3, craft: 100, material: 200, recovery: 40 },
    { tier: "Elite",    cx: 4, craft: 150, material: 300, recovery: 50 },
    { tier: "Apex",     cx: 5, craft: 250, material: 500, recovery: 60 }
  ],

  /* ============================ EQUIPMENT ============================ */
  /* Smartdecks · the Codebreaker's Power-User rig. Mod Slots = Tier; System
     Integrity is listed per tier (gear runs tougher than infrastructure). */
  smartdecks: [
    { tier: "Standard", t: 0, price: 450,   deviceBonus: 0, trait: "Hacking tool",              modSlots: 0, integrity: 20 },
    { tier: "Improved", t: 1, price: 1200,  deviceBonus: 1, trait: "Encrypted comms",           modSlots: 1, integrity: 30 },
    { tier: "Advanced", t: 2, price: 3000,  deviceBonus: 1, trait: "Trace-resistant signature", modSlots: 2, integrity: 35 },
    { tier: "Premium",  t: 3, price: 6500,  deviceBonus: 2, trait: "Encrypted Channel",          modSlots: 3, integrity: 40 },
    { tier: "Elite",    t: 4, price: 11000, deviceBonus: 2, trait: "Adaptive Buffer",            modSlots: 4, integrity: 50 },
    { tier: "Apex",     t: 5, price: 18000, deviceBonus: 3, trait: "Quantum Core",               modSlots: 5, integrity: 55 }
  ],
  smartdeckTraitNote: "Each Smartdeck has the trait on its tier row, and keeps all lower traits too (an Apex deck has every trait). Governing Skill: Systems; Tech runs the load-bearing math (Bandwidth, Cipher Attacks, Cipher Save DC, Links); Wits applies to general Systems checks. A deck runs ciphers up to (Tier + 1) in Complexity.",
  smartdeckTraits: [
    { name: "Hacking Tool", text: "Baseline capability: execute Power-User ciphers, maintain Links, and apply the listed Device Bonus to Cipher Attacks. Every Smartdeck has this." },
    { name: "Encrypted Comms", text: "Voice, text, and data are encrypted by default. Tracking, intercepting, or decrypting requires a Systems check vs. the deck's Security Rating." },
    { name: "Trace-Resistant Signature", text: "Any IC Alert response against you rolls with Snag (+1 Snag Die on a Dice Pool). They still log a trace; it just points somewhere fuzzy." },
    { name: "Encrypted Channel", text: "Immune to passive Alert traces, the deck doesn't register in the slow corporate dragnets. Active hostile code still finds you." },
    { name: "Adaptive Buffer", text: "Stability Check DCs against you are reduced by 2." },
    { name: "Quantum Core", text: "Once per scene, reroll a failed Cipher Attack." }
  ],

  /* B&E Buddy · the Standard-User rig. System Integrity is listed per tier. */
  buddies: [
    { tier: "Standard", t: 0, price: 250, attack: 3, saveDc: 11, maxNode: 0, integrity: 15 },
    { tier: "Improved", t: 1, price: 500, attack: 5, saveDc: 13, maxNode: 1, integrity: 20 },
    { tier: "Advanced", t: 2, price: 900, attack: 7, saveDc: 15, maxNode: 2, integrity: 30 }
  ],
  buddyNote: "The Smartdeck's criminal cousin, handheld, ugly, dependable, for anyone who never trained as a Power User. Governing Skill: Systems (Tech). User Type: Standard User. Suite only: a Buddy runs its baked-in Cipher Suite and nothing else; it cannot execute Repertoire ciphers, mount a Firewall, or take hardware mods. Cipher Complexity: each suite cipher's Complexity matches the tier of the Buddy in use (Standard 0, Improved 1, Advanced 2), and the tier modifier applies as a flat bonus to whatever the cipher does (Save DC, duration, scanning bonus). Hardware Lockout: a Buddy lacks the architecture for high-end intrusion countermeasures, so attempting to breach a Premium or higher node makes it audibly spark and refuse the connection, taking 5 System Integrity damage from the rejection; the hack fails before it can begin.",
  buddyCiphers: [
    { name: "Node Sweeper", type: "Utility", exec: "1 Action", range: "Self (Area 6 radius)", text: "Sweep the area for devices and nodes. Automatically reveals every hidden node whose Scan DC is 12 + (3 × the Buddy's Tier) or lower: Obscured for a Standard [0] Buddy, Masked for an Improved [1], Stealth-Routed for an Advanced [2]. More deeply hidden nodes still require an active Systems (Tech) scan against their Scan DC. No Cipher Save is involved." },
    { name: "Access Spike", type: "Breach", exec: "1 Action", range: "12 spaces", text: "Cipher Attack vs. node Security Rating. On hit, establish a Link (lasts 8 hours)." },
    { name: "Access Override ⇋", type: "Utility", exec: "1 Action", range: "Touch (linked)", text: "Target an electronic lock on a linked node. Fail: lock/unlock the mechanism. Success: lock resists; IC retaliates." },
    { name: "Hijack Stream ⇋", type: "Detection", exec: "1 Action", range: "12 spaces", text: "Intercept video/audio from a linked device. Fail: clone or reroute the feed. Success: access denied; IC retaliates." },
    { name: "Data Probe ⇋", type: "Detection", exec: "1 Action", range: "Self (via Link)", text: "Probe a linked node for files/logs/configs. Grants Edge on d20 (or +1 Edge Die) for Investigation or Systems searches." },
    { name: "Data Extraction ⇋", type: "Utility", exec: "1 Swift Action", range: "Touch", text: "Copy identified files from a linked node. Fail: clean copy, no trace. Success: you still get the data, but IC retaliates and leaves a forensic trail." }
  ],

  /* Burner Relays · disposable single-shot, anyone can fire. */
  relays: [
    { tier: "Standard", t: 0, price: 100,  saveDc: 13, attack: 5,  maxNode: 0 },
    { tier: "Improved", t: 1, price: 200,  saveDc: 15, attack: 7,  maxNode: 1 },
    { tier: "Advanced", t: 2, price: 350,  saveDc: 17, attack: 9,  maxNode: 2 },
    { tier: "Premium",  t: 3, price: 500,  saveDc: 18, attack: 10, maxNode: 3 },
    { tier: "Elite",    t: 4, price: 750,  saveDc: 19, attack: 11, maxNode: 4 },
    { tier: "Apex",     t: 5, price: 1000, saveDc: 21, attack: 12, maxNode: 5 }
  ],
  relayNote: "Disposable, overclocked, single-shot; anyone can fire one, then both Relay and cipher are slag. If the cipher's Tier exceeds what the user can handle, roll Systems (Tech) DC 10 + cipher Tier (or Snag Dice = cipher Tier out of combat): success = full power; failure (margin -1 to -4) = Save DC & Attack reduced by 2; critical failure (Nat 1 / margin -5+) = the Relay sparks and dies, cipher lost. Codebreaker Special: extract an unused Relay's cipher into your Repertoire during Downtime.",

  /* Smartdeck hardware modifications. avail/legal drive the gray-market listing. */
  mods: [
    { key: "heatsinks",   name: "Reinforced Heatsinks", price: 600,  slots: 1, type: "System Integrity", avail: "Uncommon", legal: "Restricted",
      text: "Repurposed gaming-rig cooling: aluminum fins, copper piping, thermal paste applied with a steady hand. Increases the deck's System Integrity by +15. Once per deck.", bonus: { integrity: 15 } },
    { key: "sweep",       name: "Sweep Suite Plug-In", price: 800,  slots: 1, type: "Scanning", avail: "Uncommon", legal: "Restricted",
      text: "Military-grade detection libraries. +1 Edge Die on all Scanning Dice Pools (or Edge on d20 Systems checks) to detect hidden, camouflaged, or hardened nodes. Does not interact with the Modifier Stack Cap." },
    { key: "burnnotice",  name: "Burn Notice Module", price: 900,  slots: 1, type: "Trace Evasion", avail: "Rare", legal: "Contraband",
      text: "If the deck is Bricked by a LinkDeath failure (including Cascade), it wipes its memory and routes a false ping; the enemy node rolls with Snag to trace your physical location." },
    { key: "icebreaker",  name: "ICE-Breaker Algorithm", price: 1200, slots: 1, type: "Failure Mitigation", avail: "Rare", legal: "Contraband",
      text: "On a critical failure (margin -5 or worse on d20, or -3 or worse on a Dice Pool) of a Systems check to breach a node, spend 5 System Integrity from the Smartdeck to downgrade it to a standard Failure, preventing immediate lockout." },
    { key: "coprocessor", name: "Overclocked Coprocessor", price: 1500, slots: 1, type: "Action Economy", avail: "Rare", legal: "Contraband",
      text: "As an Impulse Action, spend 1 Bandwidth to accelerate one Cipher by one step (Action→Swift, Swift→Impulse). No per-encounter limit." },
    { key: "trigger",     name: "Trigger Cache", price: 1800, slots: 1, type: "Bandwidth", avail: "Rare", legal: "Contraband",
      text: "At the start of each combat, gain 2 Temporary Bandwidth (expire at end of encounter, stack on top of your max). Lost immediately if your deck is Bricked." },
    { key: "redline",     name: "Redline Lattice", price: 2800, slots: 2, type: "Multi-Link (Speed)", avail: "Rare", legal: "Contraband",
      text: "Maintain one additional active Link beyond your normal maximum. Downside: Stability Check DCs against you +2, and any Alert response upgrades to also include Analyze, even from Basic IC.", bonus: { links: 1 } },
    { key: "crown",       name: "Crown Spike Array", price: 3500, slots: 2, type: "Offensive Multi-Target", avail: "Rare", legal: "Contraband",
      text: "As an Action, cast one cipher and apply it to two Linked nodes simultaneously, paying its Bandwidth cost once (both save independently). Downside: IC Counterattack damage against you is rolled twice, taking the higher total (damage rolls never take Edge), and you land in corporate threat databases fast." },
    { key: "predator",    name: "Predator Stack", price: 4000, slots: 2, type: "Offensive Bonus", avail: "Rare", legal: "Contraband",
      text: "+2 to Cipher Attack rolls against Advanced or higher nodes, and +1 to your Cipher Save DC against the same. Downside: each successful breach of an Advanced+ node leaves a forensic hash; gain 1 Heat with that node's owning faction." }
  ]
};

/* Surface the hardware mods in the gray market (gear catalog), single source of
   truth: the mechanics live in EN.grid.mods, the storefront listing is derived
   from them. grid.js (data) loads after gear_tools.js, so the catalog exists. */
(function () {
  if (!EN.gearCatalog || !EN.gearCatalog.tools || !EN.grid) return;
  var items = EN.gearCatalog.tools.items;
  (EN.grid.mods || []).forEach(function (m) {
    if (items.some(function (i) { return i.name === m.name; })) return;   // idempotent
    items.push({
      name: m.name, bucket: "rigs", group: "Hardware Mods", modKey: m.key,
      price: m.price, availability: m.avail || "Rare", legality: m.legal || "Restricted",
      effect: "Smartdeck mod · " + m.type + " · " + m.slots + (m.slots === 1 ? " slot" : " slots") + ". Install on the #GRID tab.",
      desc: m.text
    });
  });
})();

/* ============================ CIPHER LIBRARY ============================
   The acquirable ciphers (Complexity 1-5). The universal suite that ships with
   every rig lives in EN.grid.buddyCiphers: Complexity 0 on a Smartdeck, and on a
   B&E Buddy the same six ciphers run at the Buddy's own tier. cat = Offense /
   Manipulation / Protection; link = the ⇋ "requires an active Link" flag;
   signature = the tier's flat-1-Bandwidth signature cipher. */
EN.grid.cipherTierNames = ["Standard", "Improved", "Advanced", "Premium", "Elite", "Apex"];
EN.grid.ciphers = [
  /* ---- Complexity 1 · Improved ---- */
  { name: "Logic Bomb", cx: 1, cat: "Offense", sub: "Combat", exec: "1 Action", range: "12 spaces", runtime: "Instant", signature: true,
    text: "Inject malicious code into a target node. Cipher Attack vs. Security Rating. On hit, roll 2d6 damage. Subtract the node's Firewall Damage Threshold (if any); the remainder comes off its System Integrity." },
  { name: "Shrapnel Code", cx: 1, cat: "Offense", sub: "Combat", exec: "1 Action", range: "Area 6 cone", runtime: "Instant",
    text: "Spray corrupted code in a cone. Each node in the cone rolls Cipher Save vs. your DC. Roll 2d6 damage once; every node that fails subtracts its own Firewall Damage Threshold from that roll and takes the remainder to its System Integrity." },
  { name: "Hardline Tap", cx: 1, cat: "Offense", sub: "Breach", exec: "1 Action", range: "Touch", runtime: "Link lasts 8 hours", link: true,
    text: "Establish a Link to a node by physically interfacing with a wired access port. Cipher Attack vs. Security Rating, made with Edge. Wired Links cannot be detected by passive scans and are immune to Alert traces while you remain physically connected." },
  { name: "Spoof Persona", cx: 1, cat: "Manipulation", sub: "Utility", exec: "1 Action", range: "Self (via Link)", runtime: "10 minutes", link: true,
    text: "Forge your digital signature inside a Linked node, appearing as a legitimate user. Node rolls Cipher Save vs. your DC. On failure, IC and Guardians treat you as authorized for the duration. On success, your signature is flagged and Alert triggers automatically." },
  { name: "Cold Boot", cx: 1, cat: "Manipulation", sub: "Control", exec: "1 Action", range: "Touch (Linked)", runtime: "Instant", link: true,
    text: "Force a hard restart on a Linked node. Node rolls Cipher Save vs. your DC. On failure, the node reboots for 1d4 rounds, during which all IC is offline and all elements within are disabled. The Link breaks cleanly when reboot completes." },
  { name: "Tracker Scrub", cx: 1, cat: "Manipulation", sub: "Utility", exec: "1 Action", range: "Self (via Link)", runtime: "Instant", link: true,
    text: "Erase your access logs from a Linked node. Node rolls Cipher Save vs. your DC. On failure, all evidence of your presence in the node's logs is wiped. On success, the logs harden against tampering and any future Alert traces against you in this node gain Edge." },
  { name: "Hotwire", cx: 1, cat: "Manipulation", sub: "Control", exec: "1 Action", range: "Touch (Linked)", runtime: "Instant", link: true,
    text: "Force a Linked device to perform a single basic action you dictate, right now. Node rolls Cipher Save vs. your DC. On failure, the device does one thing it is built to do and you have the authority to command: a turret takes one shot at a target you pick, a door cycles, a parked car lurches forward a few spaces, a drone moves its Speed. One command, then your grip slips and the device belongs to its owner again. On success, the command is refused and IC retaliates." },
  { name: "Live Tap", cx: 1, cat: "Manipulation", sub: "Utility", exec: "1 Action", range: "Self (via Link)", runtime: "1 scene", link: true,
    text: "Open a quiet channel into a Linked node carrying audio or video and ride it live for the rest of the scene. Node rolls Cipher Save vs. your DC. On failure, you see and hear everything the node does, in real time, hands free, while you get on with other work. On success, the feed catches you in it and Alert triggers. The tap rides one node; move it and you cast again." },
  { name: "Firewall Patch", cx: 1, cat: "Protection", sub: "Defensive", exec: "1 Swift Action", range: "Touch (Linked friendly node)", runtime: "1 scene", link: true,
    text: "Bolster a Linked allied node's defenses. Increase the node's Firewall Damage Threshold by 1 for the remainder of the scene. Useful for protecting your own gear or temporarily fortifying compromised infrastructure." },
  { name: "Bounce Routing", cx: 1, cat: "Protection", sub: "Defensive", exec: "1 Impulse Action", range: "Self", runtime: "Instant",
    text: "When you would be detected by an Alert response, you may invoke Bounce Routing. The Alert is rerouted through dummy nodes; the trace continues, but it logs an incorrect signature. The GM does not advance whatever clock or response the Alert would have triggered." },

  /* ---- Complexity 2 · Advanced ---- */
  { name: "Daisy Chain", cx: 2, cat: "Offense", sub: "Breach", exec: "1 Action", range: "Self (via existing Link)", runtime: "Persistent", link: true, signature: true,
    text: "From a Linked node, automatically establish a new Link to any node directly networked to it. The new Link costs no additional Cipher Attack roll, but counts against your maximum Links. Cannot chain into a Hardened Node." },
  { name: "Brute Force", cx: 2, cat: "Offense", sub: "Combat", exec: "1 Action", range: "12 spaces", runtime: "Instant",
    text: "Hammer a node with raw processing pressure. Cipher Attack vs. Security Rating. On hit, roll 3d6 damage. This damage ignores the Firewall Damage Threshold entirely, but only half the roll (rounded down) comes off the node's System Integrity." },
  { name: "Smartgun Hijack", cx: 2, cat: "Offense", sub: "Combat", exec: "1 Action", range: "12 spaces", runtime: "1 round", link: true,
    text: "Target a Linked smartgun, smartweapon, or networked turret. Node rolls Cipher Save vs. your DC. On failure, the weapon is slaved to you until the start of your next turn: it fires at targets you choose, using its own attack bonus, and it will not turn on your crew no matter who has hands on it. Its owner can try to wrest it back on their turn with a contested Systems check, and until they win that contest the gun answers to you. On success, the weapon shakes off the intrusion and IC retaliates." },
  { name: "Feedback Loop", cx: 2, cat: "Manipulation", sub: "Control", exec: "1 Action", range: "Touch (Linked)", runtime: "1 scene", link: true,
    text: "Seize a Linked surveillance node and feed it its own past. Node rolls Cipher Save vs. your DC. On failure, for the rest of the scene anyone watching sees a recorded loop instead of live activity, and you and your crew do not register on that feed. On success, the picture stutters in a way a watching guard will notice, and Alert triggers automatically." },
  { name: "Puppet Vehicle", cx: 2, cat: "Manipulation", sub: "Control", exec: "1 Action", range: "Touch (Linked vehicle)", runtime: "1 minute", link: true,
    text: "Seize control of a Linked vehicle's primary systems. Vehicle rolls Cipher Save vs. your DC. On failure, you can steer, accelerate, brake, or open doors as if you were the driver. The vehicle's actual driver can attempt to wrest control back on their turn with a contested Drive or Systems check." },
  { name: "Echo Capture", cx: 2, cat: "Manipulation", sub: "Utility", exec: "1 Swift Action", range: "Self (via Link)", runtime: "Instant", link: true,
    text: "Capture a snapshot of a Linked node's recent activity. You receive a complete log of every cipher cast, command issued, and connection made through the node in the last 10 minutes. Useful for piecing together what happened before you arrived." },
  { name: "Blackout", cx: 2, cat: "Manipulation", sub: "Control", exec: "1 Action", range: "Touch (Linked grid node)", runtime: "1 scene", link: true,
    text: "Find the node that feeds power and networked light to a block, and tell it to stop. Node rolls Cipher Save vs. your DC. On failure, an Area 4 zone around the node goes dark for the scene: lights die, and anything leaning on cyber-optics or a networked sight loses its reference and rolls attacks with Snag. The dark falls on everyone, your crew included, so bring your own way to see. On success, the lights gutter and hold, and Alert triggers." },
  { name: "Static Cling", cx: 2, cat: "Protection", sub: "Defensive", exec: "1 Action", range: "12 spaces", runtime: "1 scene", link: true,
    text: "Lash a node you want kept alive to a second Linked node that can afford to bleed. Choose one Linked node to protect and one to serve as the buffer. While the bond holds, any damage the protected node takes is split evenly between the two (rounded down, minimum 1 to each). When the buffer is Bricked, the bond ends and the protected node stands on its own again. A buffer you do not control rolls a Cipher Save vs. your DC to refuse the bond; nodes you or your crew control come quietly." },
  { name: "Trace Cutter", cx: 2, cat: "Protection", sub: "Defensive", exec: "1 Impulse Action", range: "Self", runtime: "Instant",
    text: "When you would suffer the effects of an Alert response, you may invoke Trace Cutter. The Alert is wiped from the node's logs entirely. Usable once per scene." },
  { name: "Decoy Persona", cx: 2, cat: "Protection", sub: "Defensive", exec: "1 Action", range: "Self (via Link)", runtime: "1 hour", link: true,
    text: "Spawn a false Persona inside a Linked node that mimics your own digital signature. Any IC retaliation directed at you in this node targets the Decoy instead, until the Decoy is destroyed (treat as a Tier 1 node with no Firewall and 1 System Integrity)." },

  /* ---- Complexity 3 · Premium ---- */
  { name: "Glitchstorm", cx: 3, cat: "Offense", sub: "Combat", exec: "1 Action", range: "12 spaces, Area 4 sphere", runtime: "Instant",
    text: "Flood an area with corrupted code. All nodes in the radius roll Cipher Save vs. your DC. Roll 4d6 damage once; every node that fails subtracts its own Firewall Damage Threshold from that roll and takes the remainder to its System Integrity. Excellent for clearing camera clusters or networked turret nests." },
  { name: "Cascade Worm", cx: 3, cat: "Offense", sub: "Breach", exec: "1 Action", range: "Self (via Link)", runtime: "Persistent", link: true,
    text: "Deploy a self-replicating worm through your Linked node and into every node directly networked to it. The primary node and one networked node per Caliber you possess receive a Link to you automatically (no Cipher Attack roll). These chained Links count toward your maximum Links." },
  { name: "Puppet String", cx: 3, cat: "Manipulation", sub: "Control", exec: "1 Action", range: "Touch (Linked)", runtime: "1 minute", link: true, signature: true,
    text: "Seize direct control of any Linked node's primary function: a weapon, a vehicle, a lock, a drone, a fabricator, or the strange one-off device the lower ciphers never had a name for. Node rolls Cipher Save vs. your DC. On failure, you operate the device as its authorized operator for the full minute, issuing whatever commands it can take, not a single action but the run of it. Because you are rooted this deep, the owner wrests back with Snag on the contested Systems check, and must spend their Action to make the attempt. On success, the node throws you out and IC retaliates." },
  { name: "Identity Mirror", cx: 3, cat: "Manipulation", sub: "Utility", exec: "1 Action", range: "Touch (Linked)", runtime: "1 scene", link: true,
    text: "Copy a target Persona's full digital signature from a Linked node. For the remainder of the scene, you can adopt that Persona's appearance to any system that authenticates via the node's network. Authorized doors open, badges register, and security feeds confirm you are the copied target." },
  { name: "Dead Zone", cx: 3, cat: "Manipulation", sub: "Control", exec: "1 Action", range: "Touch (Linked node)", runtime: "1 scene", link: true,
    text: "Turn a Linked node into a wall of noise across every wireless band. For the rest of the scene, an Area 4 zone around the node is dead air. No new wireless Link forms inside it, and any hostile wireless Link already reaching in must succeed on a Cipher Save vs. your DC at the start of each of its owner's turns or drop. Networked weapons and remote drones caught inside go inert until they leave. You and allies you name are cut a clean channel through the noise; your own signatures pass. Wired Links (Hardline Tap) ignore the zone on both sides." },
  { name: "Phantom Shell", cx: 3, cat: "Protection", sub: "Defensive", exec: "1 Swift Action", range: "Self", runtime: "1 round", link: true,
    text: "Wrap your digital presence in a decoy shell. Until the start of your next turn, IC Counterattacks targeting you must first roll vs. your Cipher Save DC. On failure, the Counterattack hits the shell instead and is wasted entirely." },
  { name: "Hotpatch", cx: 3, cat: "Protection", sub: "Defensive", exec: "1 Action", range: "Touch (Linked friendly node or device)", runtime: "Instant", link: true,
    text: "Restore System Integrity equal to 5 × your Tech Modifier (minimum 5) to a Linked allied node or device (a Smartdeck, B&E Buddy, or drone). This cannot bring back something already at zero: Bricked nodes and devices still require standard repair. Usable once per scene per target." },

  /* ---- Complexity 4 · Elite ---- */
  { name: "System Cascade", cx: 4, cat: "Offense", sub: "Combat", exec: "1 Action", range: "Self (via Link)", runtime: "Instant", link: true, signature: true,
    text: "Detonate corrupted code through a Linked node and into every node it is networked to. The primary node takes 5d6 damage. Every node directly networked to it takes 3d6 damage, rolled once and applied to each. Both resolve as normal cipher damage: subtract each node's own Firewall Damage Threshold, and the remainder comes off its System Integrity." },
  { name: "Backtrace", cx: 4, cat: "Offense", sub: "Breach", exec: "1 Action", range: "Self (via Link)", runtime: "Instant", link: true,
    text: "When a hostile operator is reaching into a node you are Linked to, choose one: pin their physical location and hand it to your crew for the scene; or force that operator to make a Cipher Save vs. your DC and, on a failure, sever one of their active Links and deal them the standard LinkDeath feedback for the dropped connection." },
  { name: "Ghost in the Machine", cx: 4, cat: "Manipulation", sub: "Utility", exec: "1 Action", range: "Self (via Link)", runtime: "1 hour", link: true,
    text: "Embed a persistent backdoor in a Linked node. Even if your Link is severed, you can re-establish it as a Swift Action with no Cipher Attack roll for the duration. The backdoor is hidden from passive scans but can be detected by an active Systems check (DC equal to your Cipher Save DC)." },
  { name: "IC Inversion", cx: 4, cat: "Manipulation", sub: "Control", exec: "1 Action", range: "Touch (Linked)", runtime: "1 scene", link: true,
    text: "Subvert a Linked node's Intrusion Countermeasures. Node rolls Cipher Save vs. your DC at Snag. On failure, the node's IC treats other users (including its owner) as hostile intruders for the duration." },
  { name: "Deep Sync", cx: 4, cat: "Protection", sub: "Defensive", exec: "1 Swift Action", range: "Self", runtime: "1 scene",
    text: "You sink into a hardened sync state. While Deep Sync holds, you roll every Stability Check with Edge. If you intercept an IC Counterattack, the psychic damage is reduced by your Firewall Damage Threshold a second time (in addition to the standard interception reduction)." },

  /* ---- Complexity 5 · Apex ---- */
  { name: "Black Sun", cx: 5, cat: "Offense", sub: "Combat", exec: "1 Action", range: "Self (via Link)", runtime: "Instant", link: true, signature: true,
    text: "The legendary cipher. Roll 6d6 damage and subtract the Linked node's Firewall Damage Threshold. If any damage remains, the node loses System Integrity equal to half its MAXIMUM System Integrity (rounded down) instead of the rolled damage. A successful Black Sun against a damaged Apex node can brick it in a single strike. Using Black Sun automatically triggers Alert on the node regardless of save outcome." },
  { name: "Soul Transcription", cx: 5, cat: "Manipulation", sub: "Utility", exec: "1 Action (sustained 1 minute)", range: "Touch (Linked)", runtime: "Permanent", link: true,
    text: "Make a complete digital copy of a Linked node, including every element inside it (Personas, Scripts, Caches). The copy exists as a static snapshot in your Repertoire and can be analyzed at leisure during Downtime. If used on a node containing an AI Persona, the GM determines whether the copy 'wakes up.' This rarely ends well." },
  { name: "Override Reality", cx: 5, cat: "Manipulation", sub: "Control", exec: "1 Action", range: "Self (via Link)", runtime: "1 round", link: true,
    text: "For one round, you rewrite the rules of a Linked node. Within that node, you may declare one fundamental change to its function (e.g., 'this turret targets its own faction,' 'this door is open to me but locked to everyone else'). Node rolls Cipher Save vs. your DC. On failure, the change holds for one round. On success, IC triggers Lockdown automatically regardless of IC tier." },
  { name: "Severance", cx: 5, cat: "Protection", sub: "Defensive", exec: "1 Impulse Action", range: "Self", runtime: "Instant",
    text: "When you would suffer LinkDeath, when your deck would be Bricked, or when Lockdown catches you, you cut your consciousness clear of the stream a half-second before the feedback lands. The triggering effect is negated outright: no psychic damage, no System Integrity loss, your Links hold (or, against Lockdown, you disconnect freely and the Lockdown ends). Usable once per scene." }
];

/* Surface the cipher library in the gray market, derived from EN.grid.ciphers
   (single source of truth). Complexity 0 ships free with every rig, so only the
   acquirable Complexity 1-5 ciphers are sold here, priced at the Acquire-Clean
   Material Cost by tier. */
(function () {
  if (!EN.gearCatalog || !EN.gearCatalog.tools || !EN.grid) return;
  var items = EN.gearCatalog.tools.items;
  var PRICE = { 1: 100, 2: 150, 3: 200, 4: 300, 5: 500 };
  var AVAIL = { 1: "Uncommon", 2: "Uncommon", 3: "Rare", 4: "Rare", 5: "Rare" };
  var LEGAL = { 1: "Restricted", 2: "Contraband", 3: "Contraband", 4: "Contraband", 5: "Contraband" };
  (EN.grid.ciphers || []).forEach(function (cy) {
    if (items.some(function (i) { return i.name === cy.name && i.bucket === "ciphers"; })) return;   // idempotent
    var tier = EN.grid.cipherTierNames[cy.cx] || ("CX " + cy.cx);
    items.push({
      name: cy.name, bucket: "ciphers", group: tier + " (Complexity " + cy.cx + ")", cipher: true, cx: cy.cx,
      price: PRICE[cy.cx] || 100, availability: AVAIL[cy.cx] || "Rare", legality: LEGAL[cy.cx] || "Contraband",
      effect: cy.cat + " (" + cy.sub + ") · " + cy.exec + " · " + cy.range + (cy.signature ? " · Signature (flat 1 BW)" : "") + (cy.link ? " · needs Link" : ""),
      desc: cy.text
    });
  });
})();
