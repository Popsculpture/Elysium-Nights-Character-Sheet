// Combat rules data — extracted verbatim from the Elysium Nights rulebook (part2.txt).
window.EN = window.EN || {};
EN.combat = {

  actionTypes: [
    {
      name: "Action",
      summary: "The main effort or task you perform during your turn.",
      text: "Your Action represents the primary effort of your turn.\n\nExamples\n- Melee Attack: Strike with a weapon or unarmed.\n- Ranged Attack: Fire or throw a weapon.\n- Channel Flow: Focus or project resonance energy using an Invocation.\n- Hack System: Access, override, or disrupt a device or terminal.\n- Use Device: Activate or operate an item or tool.\n- Reload (Action): Reload complex or Heavy Weapons such as tube-fed shotguns, belt-fed guns, launchers, or heavy energy weapons.\n- Dash: Move an additional distance equal to your Speed.\n- Skill or Ability Check: Attempt a challenging task that requires full focus."
    },
    {
      name: "Move",
      summary: "Movement or repositioning, often traded for other options.",
      text: "Movement uses your Speed, equal to 6 + Agility Modifier (minimum 3). Each point of Speed moves you 1 space.\n\nMovement Type — Speed Cost\n- Normal movement: 1 per space\n- Difficult terrain: 2 per space\n- Climb, vault, or leap: 2-3 per space depending on difficulty\n- Dash: Spend your Action to gain a new movement pool equal to your Speed\n\nAttribute Influence: Your Agility modifier adds directly to your Speed each turn. Even with a negative modifier, total Speed cannot drop below 3 due to Agility alone. Environmental effects, injuries, or abilities can still reduce Speed to 0."
    },
    {
      name: "Swift Action",
      summary: "Quick maneuver or minor action; replaces your Move Action.",
      text: "Swift Actions are brief maneuvers that can occur alongside or instead of movement. You may move up to half your speed when performing a Swift Action.\n\nExamples\n- Channel Burst: Quick Flow projection or defensive pulse.\n- Follow-Up Attack: Secondary strike with an off-hand or linked weapon.\n- Take Aim: Gain Edge on your next attack.\n- Reload (Swift): Reload weapons designed for fast handling, such as sidearms, bows, or light rifles.\n- Draw or Ready Weapon: Ready a two-handed or bulky weapon.\n- Stand Up: Rise from prone."
    },
    {
      name: "Impulse Action",
      summary: "A minor action triggered outside your turn (parry, dodge, intercept, or Help).",
      text: "Impulse Actions occur outside your turn, triggered by events or enemy actions. Unless you traded your Move Action, you may only perform one Impulse Action per round.\n\nExamples\n- Opportunity Attack: Strike when an enemy leaves your reach or acts carelessly in melee.\n- Dodge: Gain a brief defensive boost against a single attack you can see.\n- Parry: Contest a melee or thrown attack with your weapon to block or counter.\n- Brace: Reduce incoming damage by 1d10 + Body modifier from impact.\n- Intercept: Move up to half your Speed to protect an ally within 2 spaces.\n- Trip or Shove: Disrupt an enemy moving through your reach.\n- Help Action: When an ally makes a save or check, you may jump in to assist them, consuming your Impulse Action and your upcoming turn's Action."
    },
    {
      name: "Free Action",
      summary: "Minor narrative or functional actions (speaking, interacting with gear, etc.).",
      text: "Free Actions represent small, quick activities or narrative flavor that add realism without heavy mechanics. They should remain minor and cannot be stacked to gain advantage.\n\nExamples\n- Interact with Object: Open a door, press a switch, or pick up an item.\n- Quick Draw or Sheathe: Draw or stow a light weapon.\n- Short Dialogue or Signal: Speak briefly, call out a warning, or give a hand sign.\n- Glance or Check: Scan surroundings, check ammo, or glance at a display.\n- Dismiss Invocation: End a Flow effect or Invocation you are actively sustaining. Doing so releases the current safely and requires only a moment of focus.\n\nThe GM may limit Free Actions per turn if players begin using them to gain mechanical advantage beyond intent."
    },
    {
      name: "Complex Action",
      summary: "Consumes both Action and Move; used for continuous or powerful tasks (full defense, major channeling).",
      text: "Complex Actions require complete focus and time. They represent deliberate or multi-step tasks that dominate a turn.\n\nExamples\n- Channel Major Flow: Direct or shape powerful resonance currents.\n- Fire Full-Auto: Sustain a burst or continuous fire with Heavy Weapons.\n- Complex Device Use: Execute a multi-step hack, tune sensors, or manipulate unstable tech.\n- Full Defense (Complex): Enter a total defensive stance, improving your protection at the cost of all other actions."
    }
  ],

  tradingMove: "You may trade your Move Action for either:\n- 1 Swift Action, or\n- 1 extra Impulse Action\nThis trade can only be made once per turn. Excess Speed cannot be exchanged for multiple Swift or Impulse Actions in the same round.",

  combatSequence: "1. Initiative: Roll d20 + Caliber + Agility Modifier or Wits Modifier. Highest acts first.\n2. Declare Intent: Choose your main Action and any Flow or tactical choices.\n3. Resolve Actions: Roll using the d20 Method.\n4. Apply Damage and Effects: Vigor → Vitality → Wounds.\n5. End of Round: Apply conditions and ongoing effects.",

  commonActions: [
    { name: "Melee Attack", cost: "Action", text: "d20 + Body Modifier + Weapon Proficiency Bonus — Close-range weapon or unarmed attack." },
    { name: "Ranged Attack", cost: "Action", text: "d20 + Agility Modifier + Weapon Proficiency Bonus — Apply Snag if firing while engaged in melee." },
    { name: "Weapon Save DC", cost: "Action", text: "8 + Body or Agility modifier (whichever is higher) + Caliber — Sets the DC for enemies to resist your weapon effects." },
    { name: "Flow Attack", cost: "Action", text: "d20 + Flow Modifier + Caliber — Consumes FP as defined by the Invocation; effect varies." },
    { name: "Flow Save DC", cost: "Action", text: "8 + Flow Modifier + Caliber — Sets the DC for enemies to resist your Flow Invocations and effects." },
    { name: "Quick Hack", cost: "Action", text: "d20 + Tech Modifier + Systems Proficiency Bonus — Disrupt, override, or support allied systems in combat." },
    { name: "Use Device / Item", cost: "Action", text: "d20 (see description) — Activate or manipulate gear, doors, or terminals." },
    { name: "Charge / Rush", cost: "Action", text: "Double Speed; gain Edge on your next melee attack — Must move at least 2 spaces in a straight line toward the target." },
    { name: "Suppressive Fire", cost: "-", text: "See Full-Auto firing mode — Use Full-Auto in Suppress mode (see Firing Modes)." },
    { name: "Full Defense", cost: "Complex", text: "Auto +2 Defense; gain Edge on all Saves until next turn — No other actions this turn." },
    { name: "Help Action", cost: "Action / Impulse", text: "Add +1d4 to an ally's d20 result — Must have plausible positioning and relevant skill or tool. If used as an Impulse, it forfeits your upcoming Action." }
  ],

  flowModifierNote: "Each Flow-using class is tied to one Attribute: Mystique, Tech, Body, or Charm. That Attribute is your Flow Attribute, and its modifier is your Flow Modifier. You use your Flow Modifier for all Flow Attacks and to set your Flow Save DC.",

  defense: "Your Defense represents your ability to avoid, deflect, or absorb incoming harm. It blends agility, awareness, protective gear, and the advantages of cover.\n\nDefense = 10 + Agility Modifier + Cover + Active Defense Bonuses",

  activeDefenseRules: "Armor will only take you so far. When a hit is locked in and about to break bone, survival comes down to your reflexes. Active Defenses allow a Character to burn an Impulse Action to intercept, deflect, or absorb incoming damage before it depletes their health pools.\n\nThe Core Rules of Active Defense:\n- The Trigger: You may declare an Active Defense immediately after an Enemy's attack successfully meets or beats your Defense score, but before the final damage is applied to your Vigor or Vitality.\n- The Cost: It costs 1 Impulse Action (your reaction).\n- The Limit: A Character may only use one defensive Impulse per attacking Enemy's turn, regardless of how many total Impulse actions they have generated. You cannot spam defenses against a single, rapid-striking opponent.\n\nIf you meet the equipment requirements, you may choose one of the following defensive maneuvers.",

  activeDefenses: [
    {
      name: "Block",
      cost: "1 Impulse Action",
      requirement: "Physical Shield",
      trigger: "Any attack you can brace against",
      text: "You brace your stance and put solid mass between yourself and the incoming threat, letting the barrier eat the kinetic shock.\n- Requirement: Must have a physical Shield equipped.\n- The Effect: You reinforce your passive mitigation. Add the Shield's listed Block Value directly to your Armor DR against this specific attack.\n\nPlayer Advice: Tactical Note — Blocking is highly reliable because, offering a guaranteed spike in damage reduction without a die roll."
    },
    {
      name: "Dodge",
      cost: "1 Impulse Action",
      requirement: "-",
      trigger: "Melee or non-ballistic physical",
      text: "You push your reflexes to the absolute limit, slipping out of the way at the last instant and letting the attack cut through empty space.\n- Trigger Limit: Can only be used against Melee or non-ballistic physical attacks (unless explicitly enhanced by a Flow feature or specific gear).\n- The Effect: Add your Agility Modifier + your Acrobatics Proficiency Bonus to your Defense score against this specific attack. If this retroactive bonus raises your Defense higher than the incoming attack roll, the attack misses, and you may immediately shift 1 space into an adjacent unoccupied space.\n\nPlayer Advice: Tactical Note — You cannot Dodge what you cannot physically evade. Heavy armor often imposes Snag on mobility; the GM may rule a Freelancer cannot Dodge while wearing Siege Plate or if they are Grappled/Restrained."
    },
    {
      name: "Parry",
      cost: "1 Impulse Action",
      requirement: "Melee Weapon or Shield",
      trigger: "Melee attacks only",
      text: "You meet force with force, stepping into the strike to aggressively knock the Enemy's weapon offline before it lands clean.\n- Requirement: Must have a Simple Weapon, Martial Weapon, or physical Shield equipped.\n- Trigger Limit: Can only be used against Melee attacks.\n- The Effect: Roll your equipped weapon's base damage die (e.g., a d8 for a standard longsword). Subtract the result directly from the raw incoming damage.\n\nPlayer Advice: Tactical Note — If you are dual-wielding, you must choose which weapon you parry with and roll its specific damage die."
    },
    {
      name: "Resurge",
      cost: "1 Impulse Action + 1 FP",
      requirement: "Attuned",
      trigger: "Flow-based attacks or Invocations",
      text: "You answer hostile Flow with your own, forcing the clashing patterns to violently cancel or rebound before they strike you.\n- Requirement: Must be attuned to the Flow.\n- The Cost: 1 FP (in addition to the Impulse Action). Using Resurge while at 0 FP counts as Overdraw.\n- Trigger Limit: Can only be used against Flow-based attacks or Invocations.\n- The Effect: Roll your Resilience Die and subtract the result from the raw incoming damage. If this reduces the incoming damage to 0, the Flow effect rebounds; the attacker immediately takes Resonant damage equal to your Flow Modifier.\n\nPlayer Advice: Tactical Note — Unlike Ward, Resurge actively weaponizes the incoming current. It is your primary defense in Shaper-on-Shaper duels."
    },
    {
      name: "Siphon",
      cost: "1 Impulse Action + 1 FP",
      requirement: "Attuned",
      trigger: "Elemental or Flow-based damage",
      text: "You drink in hostile energy, turning what should have burned or shattered you into fuel for your own body.\n- Requirement: Must be attuned to the Flow.\n- The Cost: 1 FP (in addition to the Impulse Action). Using Siphon while at 0 FP counts as Overdraw.\n- Trigger Limit: Can only be used against Elemental (Fire, Cold, Electric) or Flow-based damage.\n- The Effect: Roll your Resilience Die and subtract the result from the raw incoming damage. You immediately restore Vigor equal to the exact amount of damage negated by this roll.\n\nPlayer Advice: Tactical Note — Siphon is a high-risk, high-reward maneuver that turns enemy casters into a resource pool, but it cannot absorb standard physical damage like bullets or blades."
    },
    {
      name: "Ward",
      cost: "1 Impulse Action",
      requirement: "Warding Focus or Class Feature",
      trigger: "Any standard damage",
      text: "You flare your internal resonance, weaving a transient barrier of hard light, localized gravity, or psychic static to catch the blow.\n- Requirement: Must have an equipped Warding Focus or possess an active Shaper class feature.\n- The Effect: Roll your class's Resilience Die and subtract the result directly from the raw incoming damage.\n\nPlayer Advice: Tactical Note — Because Ward requires a physical Warding Focus or a dedicated class feature, it does not cost FP to activate, making it a highly reliable, always-on mystic shield."
    }
  ],

  defenseNotes: "Defenses prevent direct harm but may not block secondary effects. Bleeding, Burning, Poisoned, and other conditions often bypass armor and partial defenses if the source is elemental, toxic, or metaphysical. If a defense meaningfully intercepts the cause (impact, energy, or Flow), it negates the effect; otherwise, the condition applies.",

  coverIntro: "Cover represents environmental protection between you and a source of harm. It makes you harder to hit, but by default it does not reduce damage once an attack connects.\n\nUse cover whenever a solid object is between attacker and defender.",

  cover: [
    {
      name: "Half Cover",
      effect: "You are roughly half hidden behind solid objects such as crates, railings, desks, or door frames.\n- You gain +2 Defense against attacks that must pass through that cover."
    },
    {
      name: "Three Quarter Cover",
      effect: "Most of your body is hidden behind sturdy objects such as large machinery, pillars, reinforced furniture, or vehicle frames.\n- You gain +5 Defense against attacks that must pass through that cover."
    },
    {
      name: "Total Cover",
      effect: "You are fully hidden and cannot be targeted directly by attacks that require line of sight.\n- You cannot attack targets you cannot see, unless an effect explicitly allows blind targeting or ignores line of sight.\n- Effects that ignore line of sight also ignore Total Cover."
    }
  ],

  coverAndDefense: "- Cover bonuses apply to Defense before any Defensive Impulse (Dodge, Block, Parry, Ward, etc.) is declared.\n- If you leave cover during your turn, you lose its benefits until you are back behind cover.\n- Attacks with Area, Explosive, or certain elemental effects may still affect characters behind cover if the blast or effect reasonably reaches them.",

  lineOfSight: "You have line of sight if you can trace a reasonable line from your space to the target without passing through a solid, opaque obstacle.\n- If there is no clear line, the target effectively has Total Cover from that attacker.",

  obscurement: "Some things block sight but not bullets.\n- Examples: smoke, fog, darkness, holographic haze\n- Obscurement does not grant Defense bonuses by itself.\n- Instead, it typically imposes Snag on attacks that depend on sight and can grant advantage to Stealth checks.\n\nA barrier can be both Cover and Obscurement if it is solid and vision blocking.",

  destructibleCover: "Destructible Cover (Optional Rule)\n\nIf you want cover to be something that can be shot to pieces, use this optional layer.\n\nEach discrete section of solid cover (about a 1 meter by 1 meter face that is actually protecting someone) has:\n- Structure - a damage threshold\n- Integrity - how much punishment that section can take before it is destroyed\n\nStructure\n- If an attack's damage is less than Structure, the cover takes no damage.\n- If damage is equal to or higher than Structure, that section of cover takes the full damage to its Integrity.\n\nIntegrity\n- When Integrity drops to 0, that section of cover is destroyed and no longer provides cover.\n- Remaining chunks can still exist as scenery but do not grant mechanical Cover.",

  coverMaterials: [
    { category: "Intangible", structure: 0, integrity: 0, meaning: "No physical protection. Obscures vision only.", examples: "Smoke, fog, darkness, holographic haze" },
    { category: "Fragile", structure: 5, integrity: 3, meaning: "Almost anything will punch through in one or two hits, even light pistols. Mostly concealment.", examples: "Standard glass, thin plastic panels, flimsy plaster, cardboard stacks, cheap signage" },
    { category: "Cheap", structure: 7, integrity: 8, meaning: "Slows bullets but does not stop sustained fire. Pistols chew through quickly, rifles punch through reliably.", examples: "Drywall, hollow core doors, cubicle walls, thin sheet metal, fiberboard barricades" },
    { category: "Average", structure: 9, integrity: 12, meaning: "Good emergency cover. Pistols sometimes fail to breach on low rolls; rifles and SMGs reliably damage it and will destroy it over a few volleys.", examples: "Solid wood doors, flipped desks, shipping crates, residential exterior walls, standard vehicle doors and body panels" },
    { category: "Heavy", structure: 11, integrity: 18, meaning: "Real protection against small arms. Pistols mostly bounce unless damage rolls are strong; rifles and heavy weapons do the real work.", examples: "Brick walls, concrete pillars, large trees or utility poles, structural metal columns, industrial machinery, cargo containers" },
    { category: "Fortified", structure: 14, integrity: 24, meaning: "Built to stop regular guns. Pistols are basically useless. Rifles may chip it with strong hits. Heavy weapons and explosives are the reasonable way to break it.", examples: "Reinforced concrete, security doors, sandbag lines, ballistic glass, reinforced vehicle bodies, secured checkpoints" },
    { category: "Hardened", structure: 18, integrity: 40, meaning: "Designed for war. Small arms bounce. Only heavy weapons and serious explosives can reliably crack it.", examples: "Armored vehicles, vault doors, bunker walls, blast shields, high grade safes, military grade fortifications" }
  ],

  overflowDamage: "If an attack destroys the cover protecting a character:\n- Any damage that reduces Integrity below 0 becomes overflow damage.\n- Apply that overflow directly to the protected character.\n- The character does not get an additional Defense or Defensive Impulse against the overflow, but still applies armor, Damage Reduction, and Resistances as normal.",

  shieldsAndCover: "Some shields create Cover on top of their Block bonus and static Defense bonus.\n\nFor example:\n- Riot Shield - grants Half Cover while you are using Full Defense.\n- Tower Shield - grants Three Quarter Cover while you are using Full Defense.\n\n(Optional): These use the same Cover rules as above. You do not track Structure and Integrity for shield cover; shield wear and tear is handled by Shield Durability instead, see the Shield Durability section for more information.",

  attackResolution: "All attacks in combat use the d20 Method. Dice Pools are never used for attack rolls or Saving Throws.\n\n1. Declare Attack Type:\n- Choose melee, ranged, or Flow attack.\n- Apply situational effects (Aim, Power Attack, Edge, etc.).\n\n2. Make the Attack Roll:\n- Roll d20 + Attribute Modifier + Proficiency Bonus + situational modifiers.\n- Apply Edge or Snag as appropriate.\n\n3. Determine Defense:\n- Defense = 10 + Agility Modifier + cover + active bonuses.\n\n4. Compare Totals:\n- If Attack ≥ Defense, the hit lands.\n- Compute Margin = Attack Total - Defense.\n\n5. Apply Damage:\n- Roll weapon or ability damage.\n- Subtract from Vigor, then Vitality.\n- Overflow becomes Wounds.\n\n6. Criticals:\n- Natural 20: Critical success on the attack; treat as at least a Strong Hit and apply any weapon or Invocation critical effects.\n- Natural 1: Automatic miss and a possible narrative mishap at GM discretion.",

  attackMargins: [
    { margin: "+10 or more", result: "Dominant Hit", outcome: "+1d6 damage or apply a strong weapon effect (disarm, knockdown, rupture, etc.)." },
    { margin: "+5 to +9", result: "Strong Hit", outcome: "Full damage; optional condition if fictionally justified." },
    { margin: "+1 to +4", result: "Standard Hit", outcome: "Normal damage." },
    { margin: "0 or less", result: "Miss or Graze", outcome: "No direct damage, but may cause minor setback or tension shift." }
  ],

  damagePipeline: "When a Target is targeted by an attack or damaging effect, follow these four steps in order:\n\n1. Determine the Hit (Avoidance)\n- Compare the incoming Attack Roll to the Target's Defense score (Cover is already calculated into the base score).\n- Evasion: At this exact moment, the Target may spend an Impulse Action to Dodge, retroactively boosting their Defense score. If this causes the attack to miss, the pipeline ends immediately.\n- If the attack roll still meets or exceeds the final Defense score, it hits.\n\n2. Active Mitigation (Impulse)\n- If the attack hits and the Target hasn't already used a defensive Impulse against this Enemy, they may spend one now to use Parry, Ward, Resurge, or Siphon.\n- Roll the defense's corresponding die and subtract the result directly from the raw incoming damage. Resolve any secondary effects of the defense immediately (such as Siphon restoring Vigor, or Resurge dealing rebound damage).\n\n3. Passive Mitigation (Armor DR)\n- Subtract the defending Target's Armor Damage Reduction (DR) from the remaining damage.\n- Bracing: If the Target chose to spend their Impulse Action to Block, they add their Shield's Block Value to their Armor DR before doing this subtraction.\n- Some damage types (like Spatial or Psychic) may ignore standard physical DR entirely.\n\n4. Apply Damage (Depletion)\n- Apply the final damage total to the Target's health pools in the following order:\n- Vigor: Subtract damage from Vigor first.\n- Vitality: Any leftover damage spills directly into Vitality.\n- Wounds: If Vitality is reduced to 0, the Target suffers a Wound. Apply the leftover damage to the Wound track and check for severe conditions.",

  damageTypeRules: "Every attack, hazard, or Invocation deals damage of one or more damage types. A damage type is what the damage actually is in the fiction: fire on the skin, current through the spine, decay eating outward, cells screaming and dividing.\n\nIt also tells you how the damage interacts with Resistance, Vulnerability, and Immunity.\n- Resistance: A Target with Resistance to a damage type takes half damage (rounded down) from that type. Multiple sources of Resistance to the same type do not stack.\n- Vulnerability: A Target with Vulnerability to a damage type takes double damage from that type. Multiple sources of Vulnerability to the same type do not stack.\n- Immunity: A Target with Immunity to a damage type takes no damage from that type. Multi-type attacks may still deal their other damage types normally.\n\nCancellation: Resistance and Vulnerability to the same damage type cancel each other; the Target takes normal damage. Immunity overrides both.\n\nA damage type on its own does not ignite, freeze, stun, or apply conditions. Those effects come from the attack, weapon, or Invocation delivering the damage. A flamethrower sets people on fire because the flamethrower says so. The Fire damage type just deals fire damage.",

  damageTypes: [
    { name: "Nonlethal", group: "Standard Physical", text: "Stun batons, riot munitions, concussive rounds, low-amplitude shocks. Nonlethal damage represents non-killing force designed to subdue rather than destroy. It cannot reduce a Target below 1 Vitality; a Target that would be reduced to 0 by Nonlethal damage instead falls Unconscious and is Stable, unless an effect explicitly states it can kill." },
    { name: "Ballistic", group: "Standard Physical", text: "Bullets, slugs, flechettes, shrapnel. The standard damage type for unaugmented firearms and shrapnel explosives." },
    { name: "Piercing", group: "Standard Physical", text: "Knives, rapiers, spears, spikes, needle weapons. Damage that concentrates force into a pinpoint to penetrate flesh or material." },
    { name: "Bludgeoning", group: "Standard Physical", text: "Hammers, batons, clubs, impact maces, falls. Damage from physical mass moving with momentum: a wielded weapon, a thrown body, a falling beam." },
    { name: "Slashing", group: "Standard Physical", text: "Swords, sabers, axes, whips, claws. Damage that cuts and opens flesh." },
    { name: "Acid", group: "Elemental", text: "Corrosive chemicals, dissolving sprays, caustic rounds. Damage that breaks down matter at a chemical level." },
    { name: "Cold", group: "Elemental", text: "Cryo emitters, frost edges, ice-based Invocations. Damage from extreme reduction of molecular motion." },
    { name: "Fire", group: "Elemental", text: "Flamethrowers, incendiary ammo, plasma wash, burning Invocations. Damage from rapid combustion and heat." },
    { name: "Electric", group: "Elemental", text: "Shock batons, tasers, arc weapons, EM bursts. Damage from focused electrical current." },
    { name: "Sonic", group: "Elemental", text: "Sound cannons, resonance blades, vibration pulses. Damage from concentrated acoustic or vibrational force." },
    { name: "Force", group: "Elemental", text: "Concussive blasts, gravity hammers, telekinetic impacts, spatial shearing. Damage from pure shaped pressure with no physical object behind it; gravity, telekinesis, kinetic shaping, dimensional shear." },
    { name: "Energy", group: "Elemental", text: "Lasers, particle beams, hard light, exotic directed energy. Damage from concentrated coherent light or particle streams." },
    { name: "Radiation", group: "Exotic and Thematic", text: "Irradiated zones, leaking reactor cores, depleted uranium munitions. Damage from ionizing particle exposure that breaks down cells at a molecular level." },
    { name: "Entropy", group: "Exotic and Thematic", text: "Decay, unraveling, time wear, reality breakdown. Damage that erodes matter and pattern. The metaphysical opposite of Genesis." },
    { name: "Genesis", group: "Exotic and Thematic", text: "Forced growth, overproliferation, unwanted regeneration, regression to raw potential. Damage that imposes new pattern on a Target faster than they can process it. The metaphysical opposite of Entropy." },
    { name: "Psychic", group: "Exotic and Thematic", text: "Telepathy, mind spikes, fear blasts, psionic storms. Damage that bypasses physical structure and attacks the mind directly. Psychic damage automatically deals 0 damage against Targets that lack consciousness; mindless Drones, Vehicles, and non-sapient Constructs. Clankers and other sapient Constructs possess full consciousness and are valid Psychic targets." },
    { name: "Toxic", group: "Exotic and Thematic", text: "Poisons, venoms, nano toxins, gas, disease. Damage from substances introduced into a Target's biological or chemical systems." },
    { name: "Resonant", group: "Resonant and Tech", text: "Raw Flow impact, resonance backlash, metaphysical disruption. Damage that threatens Shapers, Flow constructs, mystech devices, and anything attuned to the Flow." },
    { name: "Tech", group: "Resonant and Tech", text: "Data corruption, EM inversion, viral code, system overload. Damage that targets devices, drones, cyberware, active Links, smart weapons, and Smartdecks. Deals 0 damage to Unattuned Characters with no cybernetic augmentations or grid-linked gear." }
  ]
};
