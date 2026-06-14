/* ===========================================================================
   ELYSIUM NIGHTS — Cybernetics catalog
   Transcribed from "Part 3 — Equipment → Cybernetics". Each piece lists an
   Interface Zone, an optional Enhancement bonus, a core Effect, and one row per
   manufacturing Tier (Streetware / Brandware / Blackware, or Prototype) carrying
   its own SP, price (Glimmer), and legality. SP feeds Total Static and the
   Chrome Tax thresholds. Zone anchors are approximate body coordinates on the
   Chrome-tab silhouette (viewBox 0 0 220 470).
   =========================================================================== */
window.EN = window.EN || {};

EN.cyberware = {
  intro: "Cybernetics are mass-produced inorganic hardware: cut living tissue out, bolt something colder in. You get tactical advantages a flesh body cannot match — and Static, low-grade electromagnetic noise that grows with every piece of chrome.",

  /* Interface Zones + approximate silhouette anchor points */
  zones: {
    Neural:     { label: "Neural",     blurb: "Brain, eyes, ears, spinal cord",   at: { x: 110, y: 44 } },
    Core:       { label: "Core",       blurb: "Heart, lungs, organs, torso",       at: { x: 110, y: 168 } },
    Integument: { label: "Integument", blurb: "Skin & skeletal structure",         at: { x: 110, y: 224 } },
    Arms:       { label: "Arms",       blurb: "Shoulders, hands, forearms", sided: true, at: { x: 110, y: 188 }, left: { x: 56, y: 196 }, right: { x: 164, y: 196 } },
    Legs:       { label: "Legs",       blurb: "Hips, thighs, feet",         sided: true, at: { x: 110, y: 360 }, left: { x: 92, y: 372 }, right: { x: 128, y: 372 } },
    Hardware:   { label: "Hardware",   blurb: "External ports, concealed bays",    at: { x: 146, y: 252 } }
  },

  /* The Chrome Tax — Static Thresholds. index 0 = safe. Penalty value = index. */
  thresholds: [
    { index: 0, min: 0,  max: 2,        name: "Safe Capacity",        effects: [] },
    { index: 1, min: 3,  max: 4,        name: "Minor Friction",       effects: ["−1 max Resilience Die", "−1 max Reservoir (FP)"] },
    { index: 2, min: 5,  max: 6,        name: "System Integration",   effects: ["−2 max Resilience Dice", "−2 max FP", "Hardwired: targetable by Quick Hacks; Snag vs EMP & Electromagnetic Invocations"] },
    { index: 3, min: 7,  max: 8,        name: "Visceral Rejection / Resonant Dissonance", effects: ["−3 max Resilience Dice", "−3 max FP", "Resonant Feedback: failed Breakflow → 1d4 Electric per Threshold", "Healing Penalty: Visceral Patch (0 FP) fails on you"] },
    { index: 4, min: 9,  max: 10,       name: "Biological / Mechanical Stagnation", effects: ["−4 max Resilience Dice", "−4 max FP", "Maintenance Required: no natural Wound recovery on a Long Rest"] },
    { index: 5, min: 11, max: Infinity, name: "The Ghost Fades",       effects: ["−5 max Resilience Dice", "−5 max FP", "Dead Battery: lose the free Resilience Die at 0 dice on a Short Rest"] }
  ],

  qualityTiers: {
    Streetware: "Unlicensed clinics, harvested parts, refurbished junk. Cheap, visible welds and scars; no Enhancement Bonus.",
    Brandware:  "Licensed retailers and corp clinics. Reliable, registered, warrantied. Grants the listed Enhancement (+1).",
    Blackware:  "Stolen, prototype, military, experimental. Higher SP and price, extra capabilities. Enhancement doubled (+2).",
    Prototype:  "One-off mystech builds. Singular tier; rarely for sale."
  },

  /* base pieces — `short` drives the market listing name "<Tier> <short>" */
  items: [
    /* ---------------- Neural ---------------- */
    { key: "datajack", short: "Datajack", name: "Neural Interface (Datajack)", zone: "Neural", enhancement: "None",
      desc: "A direct neural-to-machine port at the base of the skull. The backbone of half the chrome in a head — Smartlinks, Cybereye recording, vehicle rigging all route through it. A door that opens both ways.",
      effect: "A neural port for #GRID hardware, Smartdecks, drones, and compatible cyberware; lets you run Quick Hacks. Operates as Surface Link (conscious, silent comms within 20 spaces) or Full Immersion (body helpless, Prone, attacks vs you at Edge).",
      street: "No encryption — intercept/trace your traffic at Edge against you; visible scarring, Snag on passing as un-chromed.",
      black: "Encrypted & dark (intercept at Snag against you), no registered identity/log, and installed Quick Hacks deal +1d4 on System Failure / Network Spread.",
      tiers: [
        { tier: "Streetware", sp: 1, price: 600,   legality: "Common" },
        { tier: "Brandware",  sp: 1, price: 3500,  legality: "Common" },
        { tier: "Blackware",  sp: 2, price: 14000, legality: "Restricted" }
      ] },
    { key: "cybereyes", short: "Cybereyes", name: "Cybereyes", zone: "Neural", enhancement: "+1 Wits",
      desc: "Replacement optical units that transcend organic vision. The most visible piece of common chrome — a statement of identity as much as a tactical investment.",
      effect: "Choose two modes (swap as a Free Action): Low-Light, Thermal, Telescopic Zoom (Edge vs distant), Threat Targeting (Edge on first attack/round), Visual Recording (1 hr, retrieved via datajack).",
      street: "One mode only, no Enhancement, swaps need a clinic; visibly mechanical → Snag on blending-in social checks.",
      black: "Three modes, and perceive Anomaly auras within 6 spaces (type + approximate Severity, no check).",
      tiers: [
        { tier: "Streetware", sp: 1, price: 1200,  legality: "Common" },
        { tier: "Brandware",  sp: 1, price: 5500,  legality: "Licensed" },
        { tier: "Blackware",  sp: 2, price: 22000, legality: "Restricted" }
      ] },
    { key: "reflex", short: "Reflex Booster", name: "Reflex Booster", zone: "Neural", enhancement: "+1 Agility",
      desc: "A neural co-processor woven through the brainstem that accelerates the speed of thought between perception and action. Combat freelancers consider this the essential investment.",
      effect: "+2 Initiative and +1 Speed. Once per combat, spend a Swift Action to gain an additional Move or Swift Action this turn.",
      street: "No Enhancement; jittery — first time you take combat damage each session, Body Save DC 12 or take 1d4 Vitality as it misfires.",
      black: "+4 Initiative, +2 Speed, and once per combat (Impulse) fully evade one ranged hit.",
      tiers: [
        { tier: "Streetware", sp: 2, price: 2500,  legality: "Restricted" },
        { tier: "Brandware",  sp: 2, price: 11000, legality: "Restricted" },
        { tier: "Blackware",  sp: 3, price: 28000, legality: "Restricted" }
      ] },
    { key: "disruption", short: "Disruption Lattice", name: "Disruption Lattice", zone: "Neural", enhancement: "None", mystech: true,
      desc: "Resonance-dampening circuitry through the upper spine and skull. Built to counter Shapers; it does not discriminate — it dampens the Flow for everyone near the wearer, including the wearer.",
      effect: "Passive Area 2 disruption field: all Invocations cost +1 FP, friend or foe, always on. Pulse (Impulse, 1/Short Rest): sustained Invocations within 3 spaces make a Focus Disruption check DC 14 or end.",
      street: "Field shrinks to Area 1, no Pulse; audible static → Snag on Stealth within 2 spaces of anyone.",
      black: "Area 3 field, Pulse up to 2/Short Rest, plus targeted suppression (3 charges/Long Rest): one Flow-user within 6 spaces casts at +2 FP with Snag.",
      tiers: [
        { tier: "Streetware", sp: 2, price: 4000,  legality: "Restricted" },
        { tier: "Brandware",  sp: 2, price: 13000, legality: "Restricted" },
        { tier: "Blackware",  sp: 3, price: 32000, legality: "Restricted" }
      ] },
    { key: "resonanceCrown", short: "Resonance Crown", name: "Resonance Crown", zone: "Neural", enhancement: "+1 Mystique", mystech: true,
      desc: "A circlet of hand-tuned mystech filaments in the skull's outer surface, visible as silver tracery along the brow. One of the few implants the Flow does not reject — it harmonizes chrome to the wearer's natural frequency.",
      effect: "Reduces the SP cost of up to 4 SP of your other cyberware by 1 each (min 1) for Threshold purposes. +1 FP at the end of a Short Rest. One Crown only; cannot harmonize itself, the Disruption Lattice, or the Convergence Engine.",
      tiers: [
        { tier: "Prototype", sp: 1, price: 28000, legality: "Restricted" }
      ] },

    /* ---------------- Core ---------------- */
    { key: "synthHeart", short: "Synthetic Heart", name: "Synthetic Heart", zone: "Core", enhancement: "None",
      desc: "A fully replaced cardiac unit. It doesn't get tired, doesn't panic, and can be revved during combat. Wearers describe feeling calm in firefights.",
      effect: "1/Long Rest, when you'd drop to 0 Vitality, drop to 1 instead (not Bloodied) and gain +2 Speed next turn. Immune to Panic; Edge on Wits Saves vs Frightened and Shaken.",
      street: "Irregular rhythm — medical ID is automatic; Snag on Stealth vs heartbeat detection.",
      black: "Death-prevention twice/Long Rest, plus Stillness Mode (Action): appear dead to scans for up to 1 minute.",
      tiers: [
        { tier: "Streetware", sp: 2, price: 3500,  legality: "Restricted" },
        { tier: "Brandware",  sp: 2, price: 9500,  legality: "Licensed" },
        { tier: "Blackware",  sp: 3, price: 24000, legality: "Restricted" }
      ] },
    { key: "biomonitor", short: "Biomonitor", name: "Biomonitor", zone: "Core", enhancement: "None",
      desc: "An internal pharmacy and diagnostic suite in your torso, releasing precise doses of stims, painkillers, or stabilizers on trauma or command. The exec's daily chrome and the operator's emergency reserve.",
      effect: "1/Short Rest (Free Action): regain 1d6 Vitality; OR remove one stack of Bleeding/Burning/Poisoned; OR Edge on your next Body Save this round.",
      street: "Imprecise — each use roll 1d6; on a 1 the effect fails (use still spent).",
      black: "Twice/Short Rest, any combination of effects, and +2 Speed automatically on round 1 of any combat.",
      tiers: [
        { tier: "Streetware", sp: 1, price: 1800,  legality: "Restricted" },
        { tier: "Brandware",  sp: 1, price: 6500,  legality: "Licensed" },
        { tier: "Blackware",  sp: 2, price: 16000, legality: "Restricted" }
      ] },
    { key: "toxinFilter", short: "Toxin Filter", name: "Toxin Filter", zone: "Core", enhancement: "+1 Body",
      desc: "A synthetic liver-and-kidney system that scrubs poisons, drugs, biohazards, and Flow-tainted compounds. Far more common than people assume.",
      effect: "Resistance to Toxic damage; auto-succeed Body Saves vs mundane environmental contaminants; choose to resist or accept any voluntarily consumed drug.",
      street: "No Enhancement; cycles loudly — heard from 2 spaces in silence, Snag on Stealth there.",
      black: "Immunity to mundane toxins, Resistance to Radiation, and scrubs minor Resonant contamination within 1 hour.",
      tiers: [
        { tier: "Streetware", sp: 1, price: 2000,  legality: "Common" },
        { tier: "Brandware",  sp: 1, price: 5500,  legality: "Common" },
        { tier: "Blackware",  sp: 2, price: 15000, legality: "Licensed" }
      ] },
    { key: "feedbackCore", short: "Resonance Feedback Core", name: "Resonance Feedback Core", zone: "Core", enhancement: "None", mystech: true,
      desc: "A reactive implant in the upper torso that absorbs incoming Flow and re-emits it as kinetic or thermal output. The rare chrome that lets an Unattuned character interact with the Flow, not just resist it.",
      effect: "Taking Invocation damage grants a Feedback Charge (max 3). Discharge (1, Impulse): +1d6 Resonant on an attack within 6. Surge (2, Action): Area 3, Body Save DC 14 or 2d6 Resonant + push 1. Burst (3, Action): Area 6 Cone, 4d6 Resonant, no save, then 1-hour cooldown. Charges expire in 10 min.",
      tiers: [
        { tier: "Prototype", sp: 2, price: 25000, legality: "Restricted" }
      ] },
    { key: "convergence", short: "Convergence Engine", name: "Convergence Engine", zone: "Core", enhancement: "None", mystech: true,
      desc: "An implant that is, by all measurable standards, both circuit and Flow construct at once. Should not exist; three are documented in Elysium. A campaign-level reward, not a purchase.",
      effect: "Unattuned: +1 Vitality max and Resistance to Resonant. Attuned: use any one implant as a Ritual Implement, route Invocations through your chrome, and once/Long Rest bypass a Static Threshold (Total Static −2 SP for one combat, then gain 1 Stage of Strain). Does not stack with the Resonance Crown.",
      tiers: [
        { tier: "Prototype", sp: 3, price: 45000, legality: "Restricted" }
      ] },

    /* ---------------- Integument ---------------- */
    { key: "subdermal", short: "Subdermal Armor", name: "Subdermal Armor", zone: "Integument", enhancement: "+1 Body",
      desc: "Plates of ballistic-grade composite under the skin. The signature chrome of street samurai and corp guards. It doesn't make you bulletproof — it turns lethal hits into survivable ones.",
      effect: "+1 DR against Ballistic, Piercing, Bludgeoning, and Slashing. Stacks with worn armor.",
      street: "No Enhancement; rough alignment — close inspection (DC 12) spots the bulges and scar lines through clothing.",
      black: "+2 DR vs all physical, plus a reactive surface: first melee hit each combat reflects 1d4 of the same type back.",
      tiers: [
        { tier: "Streetware", sp: 2, price: 2800,  legality: "Licensed" },
        { tier: "Brandware",  sp: 2, price: 8500,  legality: "Licensed" },
        { tier: "Blackware",  sp: 3, price: 21000, legality: "Restricted" }
      ] },
    { key: "skeleton", short: "Reinforced Skeleton", name: "Reinforced Skeleton", zone: "Integument", enhancement: "+1 Body",
      desc: "Composite woven through your bones. It doesn't make you stronger by itself, but it makes you durable enough to use strength you couldn't otherwise survive.",
      effect: "+1 Wound max; half damage from falls; Edge on Body Saves vs prone/grapple/forced movement; unarmed strikes deal 1d6 Bludgeoning.",
      street: "No Enhancement; 25% heavier — matters for vehicles, climbing, and weight sensors.",
      black: "+2 Wound max, 1d8 unarmed (one as a Swift Action 1/round), resist fall damage up to 12 spaces.",
      tiers: [
        { tier: "Streetware", sp: 2, price: 3000,  legality: "Licensed" },
        { tier: "Brandware",  sp: 2, price: 9000,  legality: "Licensed" },
        { tier: "Blackware",  sp: 3, price: 23000, legality: "Restricted" }
      ] },

    /* ---------------- Arms ---------------- */
    { key: "cyberarm", short: "Cyberarm", name: "Cyberarm", zone: "Arms", enhancement: "+1 Body (arm only)", sided: true, platform: true,
      desc: "A full prosthetic arm — the most \"this is a different person now\" piece of common chrome. A platform: compatible mods slot in without adding SP to your Total Static.",
      effect: "Unarmed strikes with the arm deal 1d6 Bludgeoning. Install compatible mods in its slots without adding their SP.",
      street: "2 mod slots, no Enhancement; lacks fine calibration → Snag on delicate handwork with that arm.",
      black: "4 mod slots, +2 Body for arm actions, 1d8 unarmed, cannot be disarmed, Edge on grapples with it.",
      tiers: [
        { tier: "Streetware", sp: 2, slots: 2, price: 4500,  legality: "Licensed" },
        { tier: "Brandware",  sp: 3, slots: 3, price: 14000, legality: "Licensed" },
        { tier: "Blackware",  sp: 4, slots: 4, price: 36000, legality: "Restricted" }
      ] },
    { key: "handRazors", short: "Hand Razors", name: "Hand Razors", zone: "Arms", enhancement: "None",
      desc: "Retractable monoblade claws inside the back of the hand. Always with you, always silent, always lethal at arm's length. Can slot into a Cyberarm without adding SP.",
      effect: "Swift Action to extend/retract. While extended, unarmed strikes deal 1d6 Slashing with Armor Piercing 1; silent on deployment and pass standard weapon scans.",
      street: "Audible clack on deploy (Snag on Stealth that turn); no Armor Piercing.",
      black: "1d8 Slashing, Armor Piercing 2; on a crit the target's worn armor loses 1 DR until repaired.",
      tiers: [
        { tier: "Streetware", sp: 1, price: 1500,  legality: "Restricted" },
        { tier: "Brandware",  sp: 1, price: 5000,  legality: "Restricted" },
        { tier: "Blackware",  sp: 2, price: 13000, legality: "Restricted" }
      ] },

    /* ---------------- Legs ---------------- */
    { key: "cyberlegs", short: "Cyberlegs", name: "Cyberlegs", zone: "Legs", enhancement: "+1 Agility", platform: true,
      desc: "Full prosthetic legs. Most people got them involuntarily and upgraded after. A platform with mod slots, like Cyberarms.",
      effect: "+2 Speed and Edge on Athletics for jumping, climbing, balance. Install compatible mods in its slots without adding their SP.",
      street: "+1 Speed only, 2 slots, no Enhancement; audible servos → Snag on Stealth while moving >half Speed.",
      black: "+3 Speed, 4 slots, plus Burst Sprint (Impulse, 1/combat): triple Speed for one Move, ignoring opportunity attacks.",
      tiers: [
        { tier: "Streetware", sp: 2, slots: 2, price: 4500,  legality: "Licensed" },
        { tier: "Brandware",  sp: 3, slots: 3, price: 14000, legality: "Licensed" },
        { tier: "Blackware",  sp: 4, slots: 4, price: 36000, legality: "Restricted" }
      ] },
    { key: "springJoints", short: "Spring Joints", name: "Spring Joints", zone: "Legs", enhancement: "None",
      desc: "Leg modifications that store and release kinetic energy explosively. Couriers, parkour operators, and roof-runners consider this essential. Can slot into a Cyberleg without adding SP.",
      effect: "Jump twice your distance; no damage from falls up to 4 spaces. Impulse 1/round: leap up to 3 spaces in any direction without provoking opportunity attacks.",
      street: "Audible clack (Snag on Stealth while moving); after the leap, can't reuse it for 1d4 rounds.",
      black: "Safe fall 8 spaces, leap 5 spaces, and store fall energy: next melee within 1 min of a 2+ space fall deals +1d6 Bludgeoning.",
      tiers: [
        { tier: "Streetware", sp: 1, price: 1800,  legality: "Common" },
        { tier: "Brandware",  sp: 1, price: 5500,  legality: "Common" },
        { tier: "Blackware",  sp: 2, price: 14000, legality: "Licensed" }
      ] },

    /* ---------------- Hardware ---------------- */
    { key: "smartlink", short: "Smartlink", name: "Smartlink", zone: "Hardware", enhancement: "+1 Tech",
      desc: "A neural-to-weapon interface, usually paired with a Datajack. Your firearms aim with your eyes and fire with your thoughts. The gunslinger's signature chrome. Requires a neural port.",
      effect: "+1 to attack rolls with a connected smart-weapon, and ignore Snag from cover/prone/partial visibility on your first attack each round.",
      street: "No Enhancement; firmware quirks — 1d6 on first connect, on a 1 it can't interface until a clinic patch.",
      black: "+2 to attacks, Snag-ignoring on every attack, plus tag a target (Swift, 1/combat) for Edge on all attacks vs it until end of next turn.",
      tiers: [
        { tier: "Streetware", sp: 1, price: 2200,  legality: "Licensed" },
        { tier: "Brandware",  sp: 1, price: 7500,  legality: "Licensed" },
        { tier: "Blackware",  sp: 2, price: 19000, legality: "Restricted" }
      ] },
    { key: "subdermalComm", short: "Subdermal Comm", name: "Subdermal Comm", zone: "Hardware", enhancement: "None",
      desc: "A hidden comm implant in the jaw, throat, or behind the ear. Speak silently with your crew without anyone seeing your mouth move. No Streetware version — the nerve calibration is beyond unlicensed clinics.",
      effect: "Silent subvocal comms with paired units within 1 mile (less in dense urban), invisible to casual observers; standard encryption.",
      black: "Military-grade encryption (decrypt at two Snag dice), 5-mile range, and passive threat-tone keyword detection.",
      tiers: [
        { tier: "Brandware", sp: 1, price: 3500,  legality: "Common" },
        { tier: "Blackware", sp: 2, price: 11000, legality: "Restricted" }
      ] },
    { key: "skinweave", short: "Skinweave", name: "Skinweave", zone: "Hardware", enhancement: "None",
      desc: "Discreet storage cavities embedded throughout the body, sealed against standard scans and keyed to trigger nerves. The smuggler's chrome, the spy's chrome.",
      effect: "3 concealed compartments (one small item each), undetectable by mundane search and standard scans. Accessing one is a Swift Action.",
      street: "2 compartments; focused inspection (DC 14) finds the scarring.",
      black: "5 compartments, Flow-shielded (beats resonance detection), and one can be a dead-man's switch that triggers an item when you fall Unconscious.",
      tiers: [
        { tier: "Streetware", sp: 1, price: 1500,  legality: "Restricted" },
        { tier: "Brandware",  sp: 1, price: 4500,  legality: "Restricted" },
        { tier: "Blackware",  sp: 2, price: 12000, legality: "Restricted" }
      ] },
    { key: "anomalySensor", short: "Anomaly Sensor Suite", name: "Anomaly Sensor Suite", zone: "Hardware", enhancement: "+1 Mystique", mystech: true,
      desc: "Micro-sensors across the inner ear, temples, and base of the spine that detect Flow Disturbances. Gives an Unattuned operator technical data the Shaper reads by intuition.",
      effect: "Passively detect Flow Disturbances within 6 spaces (classification + approximate Severity) and active Invocations within 3 spaces. Focused scan (Free, 1/turn): Edge on your next Awareness/Esoterica check about it.",
      street: "No Enhancement; 3-space / 1-space radius; may return false data on a silent GM 1d6=1.",
      black: "12-space / 6-space radius, exact Severity, and a threat-prediction warning granting Edge on your next Save/Reaction vs an approaching Anomaly.",
      tiers: [
        { tier: "Streetware", sp: 1, price: 3200,  legality: "Licensed" },
        { tier: "Brandware",  sp: 1, price: 8500,  legality: "Licensed" },
        { tier: "Blackware",  sp: 2, price: 22000, legality: "Restricted" }
      ] }
  ]
};
