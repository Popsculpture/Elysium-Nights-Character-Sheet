window.EN = window.EN || {};
/* ALPHABETICAL BY NAME, and it has to stay that way: js/codex.js renders this array in
   order as the Conditions reference, and js/combat.js builds the tracker's "add a
   condition" picker from it in order too. Neither sorts, because the data already is
   sorted, so an entry appended in the wrong place surfaces in both views.

   Sorted case-insensitively, which is why LinkDeath sits under L rather than between
   Lagged and Mutating by its capital D. Re-sorted 2026-09-19, when Immunity had drifted
   behind Incapacitated and Soul Shock had drifted to the end of the S block.

   23 Oct 2026 handoff: the Strain entry no longer prints its own stage list. The Strain Track is
   one four-column table in The Flow (EN.flow.strainTrack, Codex panel fl-strain) and this entry
   points there (PHB:6174-6188).

   2026-10-24 rulings, section 9 item 2: Downtime leaves Strain alone while Breakflow is on. The
   How to End It bullet takes the book's batch 73 sentence. Item 8: the Strain condition is the
   Flow tab's one Strain value (ch.flow.strain, read through EN.engine.strainOf). */
/* The Codex style sample (the author, 5 Nov 2026): first line says what it is, then the rule in the book's own
   sentences, trimmed. Every number, die, DC, range and duration is the Handbook 5B's. Lore, flavour and examples are
   out; about 60 words, longer only as a list of separate effects. Names, and so anchors and links, are unchanged. */
EN.conditions = [
  {
    name: "Bleeding",
    summary: "Lose Vitality each turn; stacks worsen",
    text: "An open wound that costs Vitality until it's closed.\n\n- Start of your turn, and each space you willingly move: lose 1d4, 2d4, or 3d4 Vitality (1, 2, or 3 stacks).\n- Ends: anyone's Action and a Medtech check, DC 10, 15, or 20 by stacks.\n- Vitality restoration removes 1 stack."
  },
  {
    name: "Blinded",
    summary: "Can't see; Snag on attacks and sight checks",
    text: "You can't see.\n\n- Everything is Obscured to you.\n- Snag on attacks and sight checks; attacks against you gain Edge.\n- Sight-dependent abilities fail; Low-Light, Thermal, Darkvision, and cyberoptics don't help.\n- Ends: Body Save DC 12 at turn end, or sensory restoration."
  },
  {
    name: "Bloodied",
    summary: "Speed reduced; can't take Complex Actions",
    text: "You're out of Vitality and still standing.\n\n- Trigger: Vitality reduced to 0.\n- Speed reduced by 50 percent; no Complex Actions (Impulse Actions, Free Actions, and movement within reduced Speed still allowed).\n- Ends when you next regain any Vitality."
  },
  {
    name: "Breached",
    summary: "Hostile code infiltrates system",
    text: "Hostile code runs in your system.\n\n- The attacker may siphon data, disrupt functions, or override commands.\n- System actions may take Snag, be delayed, or be taken over.\n- Ends when purged, counter-hacked, or rebooted (Engineering or Systems), or the attacker disconnects."
  },
  {
    name: "Breakflow",
    summary: "Connection to the Flow severed; can't channel or recover FP",
    text: "Your connection to the Flow has snapped.\n\n- Occurs automatically when Strain reaches Stage 5 or you fail a Breakflow Check.\n- Your Flow Points (FP) drop to 0. You can't channel, recover FP, or sustain effects; channeling automatically fails.\n- Ends only through Breakflow Restoration or Rough Restoration. A Short or Long Rest alone can't end it. See The Flow."
  },
  {
    name: "Bricked",
    summary: "Device or system inoperative",
    text: "A device or system that has stopped working until repaired.\n\n- It can't operate or accept commands; checks to interact with it automatically fail until partial function is restored.\n- Field repair (Engineering or Tech): a d20 check against the GM's DC in combat, or a Dice Pool check against GM-assigned Snag Dice out of combat, restores partial function. This doesn't apply to Smartdecks, B&E Buddies, or Nodes: their Field Repair (Partial) rule in The #GRID can't recover a Bricked device of that kind. Only Downtime can.\n- Full repair: tools, parts, and time, usually a Long Rest or Downtime task in a workshop."
  },
  {
    name: "Burning",
    summary: "Take fire damage each turn",
    text: "You're on fire.\n\n- Start of your turn: 1d6 Fire damage.\n- Ends on a Body Save DC 10 at end of your turn, or when you or an ally spends an Action with a plausible method (rolling, smothering, water, extinguisher)."
  },
  {
    name: "Cascade Failure",
    summary: "Linked system collapse",
    text: "A failure spreading through linked systems.\n\n- Linked devices check or save (original effect's DCs) against shutdown or overload.\n- Failures may deal Psychic damage to users (often LinkDeath), brick devices, or drop networks.\n- Ends: isolate, power down, remove the source, or stabilize with Engineering or Systems checks."
  },
  {
    name: "Charmed",
    summary: "Treat charmer as ally; can't harm them",
    text: "You trust someone you shouldn't.\n\n- You treat the charmer as a trusted ally and can't harm them directly.\n- They gain Edge on social checks against you.\n- Ends: they or their allies clearly harm you, an end-of-turn Presence Save (effect's DC), or anti-charm effects."
  },
  {
    name: "Confused",
    summary: "Erratic behavior, harmful actions",
    text: "You can't control what you do next.\n\n- Start of your turn, roll 1d8:\n  - 1 to 2: Do nothing this turn.\n  - 3 to 4: Move in a random direction, provoking Opportunity Attacks as normal.\n  - 5 to 6: Attack the nearest Character (friend or foe).\n  - 7 to 8: Harm yourself in some way (GM discretion).\n- Ends: Wits Save DC 15 at the end of each of your turns, or effects that restore clarity of mind or purge psychic interference."
  },
  {
    name: "Critical Condition",
    summary: "Severe trauma; risk of collapse",
    text: "A grievous wound that keeps threatening to drop you.\n\n- Trigger: at 50 percent or less of your total Wounds.\n- Snag on all Body and Agility checks and saves.\n- When you take Wound damage or attempt a strenuous action (Dashing, heavy melee, lifting), and at the end of your turn: Body Save (DC 12, or half the total damage taken that turn, whichever is higher). Failure at turn end: gain 1 level of Fatigue and fall Unconscious.\n- While Unconscious from this, repeat the save at the start of each of your turns. Success: you wake, still in Critical Condition.\n- Ends: heal above 50 percent of your Wound maximum, or significant medical or Flow-based treatment."
  },
  {
    name: "Critical Wound",
    summary: "Severe trauma based on injury table (head, limb, chest, and so on); penalties to attacks, movement, or checks",
    text: "A lasting injury to a part of your body.\n\n- You suffer one when you fail the Body Save against Wound damage (see Wounds), or when an effect specifies one. Roll d10. The penalties are permanent.\n  - 1 to 2, Eye or Ear (Head): Snag on Perception and Wits checks.\n  - 3, Vocal Cords (Neck): Snag on social checks and Flow Invocations.\n  - 4 to 5, Hand or Arm: drop items held in the limb. No Two-Handed weapons. Snag on Athletics and Acrobatics checks and melee attack rolls.\n  - 6 to 7, Foot or Leg: Speed halved, no Dash. Snag on Agility saves.\n  - 8 to 9, Vital Organ (Chest/Stomach): Snag on physical checks; gain 1 level of Fatigue.\n  - 10, Bloody Mess: roll twice more (ignoring 10) and suffer all penalties; fall Prone and Dazed until the end of your next turn.\n- A wound may prevent specific weapons, Dash, or Complex Actions until the anatomy is replaced.\n- Treatment can stop the bleeding, restore Vitality, and prevent death, but not remove the penalties.\n- Ends: replace the part with advanced surgery, Cyberware, or powerful Flow-based restoration."
  },
  {
    name: "Cursed",
    summary: "Warped fate, body, or mind",
    text: "A persistent mark that stays until removed.\n\n- The GM chooses or rolls d12:\n  - 1, Withering Flesh: Body -2, Speed -2. Dice Pools: add Snag Dice equal to 25 percent of the pool (rounded down, minimum 1) to all Body-based pools.\n  - 2, Hexed Fortune: once per turn the GM may force a d20 check with Snag. Dice Pools: add Snag Dice equal to 25 percent of the pool (rounded down, minimum 1) to all pools.\n  - 3, Gelded Victory: a critical success counts as a normal success.\n  - 4, Shattered Will: Snag on all Presence and Mystique Saving Throws.\n  - 5, Mark of the Damned: enemies and hostile entities gain Edge on all attacks and opposed checks against you.\n  - 6, Muted Essence: no Invocations or Mystech gear that relies on the Flow.\n  - 7, Ability Blight: the GM picks an Attribute. Snag on all checks and saves tied to it. Dice Pools: add Snag Dice equal to 25 percent of the pool (rounded down, minimum 1) to all pools using that Attribute.\n  - 8, Fading Lifeforce: maximum Vitality permanently reduced by 25 percent.\n  - 9, Elemental Bane: Vulnerability to one damage type the GM chooses.\n  - 10, Compulsion Brand: you must obey a trigger or command set by the GM or the curse's source.\n  - 11, Entropic Rot: at dawn each day, take 1d4 Wound damage that ignores Resistance and Immunity, then roll 1d6: 1 to 2, reduce maximum Vitality by the damage until the next dawn; 3 to 4, gain 1 Bleeding stack; 5 to 6, nothing more. At 0 Wounds from this, you die instantly.\n  - 12, Soul Leech: healing received is halved (rounded down, minimum 1). Other rest benefits are unaffected. Regenerating organs, regrowing limbs, or cybernetic self-repair takes 50 percent longer.\n- Ends: not by standard resting or basic medical care. Requires rare relics, specialized rituals, high-tier Flow Invocations, or advanced technology at the GM's discretion."
  },
  {
    name: "Dazed",
    summary: "Sluggish; limited action choices",
    text: "Your head hasn't caught up.\n\n- No Impulse Actions.\n- On your turn take only one Action, one Move, or one Swift Action, plus minor Free Actions.\n- Ends: Wits Save DC 12 at end of your turn, or effects that clear mental fog or shock."
  },
  {
    name: "Deafened",
    summary: "Can't hear; hearing checks fail automatically",
    text: "You can't hear.\n\n- Hearing checks fail automatically; abilities that need you to hear don't reach you.\n- Snag on Wits checks to notice anything you aren't already looking at.\n- Ends: Body Save DC 12 at end of your turn, or sensory restoration."
  },
  {
    name: "Drowning",
    summary: "Wound damage on failed save; risk of Unconsciousness and death",
    text: "You're out of air and running out of time.\n\n- Without air, hold your breath for rounds equal to Body score, then Body Save each turn start (DC 10, +2 per round).\n- Failure: 1 Wound damage; at half Wounds or below, Unconscious and sinking.\n- 0 Wounds: death.\n- Ends with air."
  },
  {
    name: "Drowsy",
    summary: "Slowed reflexes; risk Unconsciousness",
    text: "The edge of sleep: your body or systems keep trying to power down.\n\n- -2 to Initiative, -1 to all Saving Throws, Snag on Perception checks.\n- Another Drowsy effect while Drowsy: Body Save (DC 15). Failure: you fall Unconscious.\n- Ends in combat: another character spends their Action to wake you, then you make a Body Save (DC 12).\n- Ends out of combat: strong stimulants, cold water, sudden shocks, or about 10 minutes of active exertion, at the GM's discretion."
  },
  {
    name: "Fatigue",
    summary: "Progressive exhaustion",
    text: "Exhaustion, in levels. You suffer your current level plus all lower levels.\n\n- 1, Winded: lose 1 point of Speed from your pool; Snag on Agility checks.\n- 2, Tired: lose 2 additional points of Speed (total -3); Snag on Body and Agility checks and all attack rolls.\n- 3, Worn Out: Speed halved (rounded down, minimum 3); Snag on Body and Agility saves.\n- 4, Exhausted: you also gain Drowsy.\n- 5, Delirious: you also gain Hallucinating.\n- 6, Helpless: you fall Unconscious; only medical, mystical, or technological treatment can stabilize you.\n- Short Rest: no direct effect.\n- Long Rest (Fatigue 1 to 3): reduce by 1 level with safe shelter, food, and water (or equivalent maintenance and charge for Clankers).\n- Severe (4 to 6): requires medical, mystical, or technological treatment.\n- Medical Treatment: with supplies and a successful check (DC set by the GM), reduce by 1 level once per day.\n- Restorative Invocations, rituals, nanotech patches, repair cycles, relics, or blessings may reduce or purge it if the effect says so."
  },
  {
    name: "Frightened",
    summary: "Must retreat; Snag on attacks",
    text: "You can't make yourself go near what scares you.\n\n- Can't willingly approach the source; within 10 spaces, retreat to cover or away with movement.\n- In its sight: Snag on attacks and checks.\n- Ends: end-of-turn Presence Save DC 15, or fear removal."
  },
  {
    /* Added 2026-09-19. This condition exists BECAUSE of the Bricked timer collision recorded in
       DEFERRED-FIXES: six gear and threat sites applied Bricked with a hard "until the end of their
       next turn" duration, while Bricked's own entry has never had a self-clearing timer and ends
       only by repair. Rather than give Bricked a second tier, the author wrote the lookalike that
       those sites actually wanted. So this is not a new mechanic so much as the correct home for
       one that was already being used.

       Like Bricked, it targets a DEVICE, so it gets no COND_FX rider: there is no character-side
       effect to compute. Its COND_META row in combat.js carries the duration. */
    name: "Glitched",
    summary: "Device offline for a moment; clears itself",
    text: "A device knocked out for a moment.\n\n- It can't operate or accept commands; interaction checks automatically fail.\n- Ends on its own at the end of the affected target's next turn, with no repair or roll."
  },
  {
    name: "Grappled",
    summary: "Restrained by opponent",
    text: "Someone has hold of you.\n\n- Speed 0; you can act but can't change position.\n- Escape: an Action and Athletics (Body) or Acrobatics (Agility) contested by the grappler's Athletics (Body).\n- Also ends if the grappler is Incapacitated, moved away, or forced to release you."
  },
  {
    name: "Hallucinating",
    summary: "False perceptions, wasted actions",
    text: "Your senses are lying to you.\n\n- Sensory Distortion: Snag on Perception and Wits checks.\n- False Stimuli: the GM introduces false threats, hazards, or allies; you must treat them as real.\n- Breaking the Delusion: to ignore a hallucinated threat, walk into a perceived hazard, or attack a target your senses insist is an ally: Wits Save first (DC set by the source, or default DC 12). Failure: your Action is wasted.\n- Persistent: it doesn't end at the end of your turn. Ends when the drug wears off, the Invocation expires, or the program is shut down, or with successful Flow cleansing, medtech, or debug routines."
  },
  {
    name: "Hardwired",
    summary: "Targetable by hacks; Snag vs EMP and Electromagnetic effects",
    text: "Enough tech in your body that hacks can reach you.\n\n- Quick Hacks and abilities targeting systems, hardware, or networks can target you.\n- Snag on Saves against EMP, digital viruses, and Electromagnetic Invocations.\n- No Machine Physiology immunities.\n- Persistent: ends only when Total Static drops below Threshold 2 (5 SP)."
  },
  {
    /* Added 2026-09-28, when the manuscript gave Hidden its own entry. Hyper-Vigilant, Fox-Feint,
       Warmblood Sense and Hare-Trigger Instinct already name Hidden as a condition, so it was
       being referred to without being defined. Unlike Invisible it is a relation to ONE Target,
       not a state everyone sees, so its COND_FX rider is a note and sets no vsYou lane. */
    name: "Hidden",
    summary: "Unseen by one Target; it can't target you, Edge on your attacks",
    text: "One Target can't see you.\n\n- Unseen by a Target, equal or beat its Passive Perception with d20 Stealth (Action in combat).\n- It can't target you; you gain Edge attacking it.\n- Ends: you attack, its Perception equals or beats your Stealth, or it sees you clearly."
  },
  {
    name: "Immunity",
    summary: "Take no damage of specified type",
    text: "A damage type can't hurt you.\n\n- No damage of that type (narrative effects at GM discretion).\n- Overrides Resistance and Vulnerability to the same type.\n- Multiple sources don't stack."
  },
  {
    name: "Incapacitated",
    summary: "Conscious but unable to act",
    text: "Awake, but you can't act.\n\n- No Actions, Move, Swift, Impulse, or Complex Actions.\n- You may still speak and take very minor Free Actions if the fiction allows.\n- Ends when the disabling effect is removed, or with restorative abilities."
  },
  {
    name: "Invisible",
    summary: "Hidden from normal sight",
    text: "Normal sight can't find you.\n\n- Edge on Stealth checks.\n- Attacks against you take Snag unless the attacker can reliably perceive you.\n- Sensors, scent, Flow senses, noise, and traces still work.\n- Ends at duration, counter effect, or revealing act."
  },
  {
    name: "Lagged",
    summary: "Digital delay; slower resolution",
    text: "Interference delays everything you do.\n\n- Your Actions, Swift Actions, and Impulse Actions resolve at the end of the round.\n- Already last in initiative: Snag on contested actions.\n- Ends when the interference is removed, you exit the zone, or the source is disabled."
  },
  {
    name: "LinkDeath",
    summary: "Violent disconnection; psychic harm",
    text: "LinkDeath is the backlash from any Link severed against your will.\n\n- A failed Stability Check tears away one Link of your choice; a forced disconnect rips away every Link. Closing a Link yourself costs nothing.\n- Each Link severed this way deals 2d6 Psychic damage.\n- Failed by 4 or less: half the feedback, and Dazed until the end of your next turn.\n- Failed by 5 or more: the full feedback, and you fall Unconscious. At the end of each of your turns, Wits Save against that Stability Check DC (10, or half the total damage taken that turn, whichever is higher). Success: you wake, Dazed until the end of your next turn.\n- Falling Unconscious severs every Link you still hold, rolled as one pool; your Smartdeck stands in the way first. (See the #GRID chapter.)\n- Ends: pass the Wits Save, or revival through medical or Flow-based stabilization."
  },
  {
    name: "Mutating",
    summary: "Stacking growth; Snag, eventual physical manifestation",
    text: "Your body keeps growing what it shouldn't, in stacks.\n\n- When an attack with the Mutating Effect hits: Body Save (DC 12). Success: damage only. Failure: damage and 1 stack.\n- Start of your turn with 1 or more stacks: Body Save (DC 10 + current stacks). Success: no effect, stacks remain. Failure, by stacks:\n  - 1 to 2 (Mild): Snag on your next physical check or attack roll this turn.\n  - 3 to 4 (Severe): no Swift or Impulse Actions this turn; Speed reduced by 2. Fades at the start of your next turn.\n  - 5+ (Critical): gain 1 level of Fatigue and the GM picks from the table below. Stacks reset to 0; the result is persistent until removed.\n- Mutation Table (d8):\n  - 1, Vestigial Limb: Snag on Stealth and social checks.\n  - 2, Duplicated Organ: Snag on Body checks.\n  - 3, Cyberware Rejection: one installed piece (GM choice) is inoperative until surgically reset.\n  - 4, Runaway Tumor: 1 stack of Bleeding that can't be treated until the tumor is removed.\n  - 5, Sensory Overgrowth: Edge on Perception checks, Snag on all Wits saves.\n  - 6, Regressive Tissue: Defense drops by 1.\n  - 7, Skeletal Bloom: deal 1d4 Piercing damage on any successful melee attack; lose 1 point of Speed until treated.\n  - 8, Hostile Symbiote: the GM may force Snag on one check per session.\n- Treat: a Complex Action and a Medtech check (DC 12 + current stacks) removes 1 stack. A Visceral Resonance Patch or Purge effect, or a Genesis source carrying the Reversal Effect, removes 1 stack.\n- Downtime: surgery or Flow mending clears all stacks and any manifestations."
  },
  {
    name: "Panic",
    summary: "Instinct overrides reason",
    text: "Instinct takes over.\n\n- Start of your turn: Presence Save DC 12. Failure: roll 1d6:\n  - 1 to 3 (Flight): use your Move and Action to get as far from the source as possible, seeking the nearest exit or Total Cover.\n  - 4 to 5 (Fight): use your Move and Action to close and make a melee attack against the nearest Enemy. If you can't reach one, use your Action to move closer.\n  - 6 (Freeze): Speed 0. Drop Prone; no Action this turn.\n- Ends: Presence Save DC 12 at the end of each of your turns, or effects that remove fear or calm the mind."
  },
  {
    name: "Paralyzed",
    summary: "Completely unable to move",
    text: "Your body is locked rigid.\n\n- Can't move, speak, or take Actions, Swift, Impulse, or Complex Actions.\n- Automatically fail Body and Agility saves.\n- Melee attacks against you gain Edge and may be critical hits (GM discretion).\n- Ends: the effect's save, removing the agent, or restoration."
  },
  {
    name: "Poisoned",
    summary: "Snag on attacks, checks, and Body saves",
    text: "Something in your blood is working against you.\n\n- Snag on attack rolls, ability checks, and Body saves.\n- Specific poisons may add effects.\n- Ends: antitoxin, a Medtech or Tech check to neutralize, an antidote, or a Flow cure."
  },
  {
    name: "Prone",
    summary: "Vulnerable to melee",
    text: "You're on the ground.\n\n- Melee attacks against you gain Edge; ranged attacks against you take Snag.\n- Stand with half your movement or a Swift Action."
  },
  {
    name: "Resistance",
    summary: "Halve damage of specified type",
    text: "A damage type hurts you less.\n\n- Half damage from that type, rounded down.\n- Multiple sources don't stack.\n- Resistance and Vulnerability to the same type cancel out."
  },
  {
    name: "Restrained",
    summary: "Bound or immobilized; vulnerable",
    text: "You're held fast.\n\n- Speed 0 and no Speed bonuses.\n- Snag on attack rolls and Agility saves; attacks against you gain Edge.\n- Ends: an Athletics check, picking locks, or disabling or destroying the restraint, per the fiction."
  },
  {
    name: "Shaken",
    summary: "Doubt clouds judgment",
    text: "Doubt has hold of you.\n\n- Snag on attacks and Wits checks.\n- No Help Action; no Edge.\n- Ends: end-of-turn Presence Save DC 12; Ally encouragement may grant Edge on it or end it."
  },
  {
    name: "Signal Jammed",
    summary: "Wireless disabled; wired ok",
    text: "Interference cuts off your wireless gear.\n\n- No remote devices, drones, or wireless cyberware; wired and direct physical interfaces still work.\n- Ends when you leave the area, disable the jammer, or switch to wired alternatives."
  },
  {
    name: "Silenced",
    summary: "Can't speak or be heard; no Voice Ciphers or verbal Invocations",
    text: "No one can hear you.\n\n- Can't speak or be heard.\n- Abilities needing a Target to hear you, Ciphers with a Voice Component, and Invocations fail.\n- Ends with its cause or when you leave the area; medical or Flow restoration ends injury-caused silence."
  },
  {
    name: "Soul Shock",
    summary: "Mystic backlash; take damage and mental penalties",
    text: "Backlash from the Flow, to body and mind.\n\n- Take 1d6 Psychic or Resonant damage when inflicted, +1d6 per further instance before you rest.\n- Snag on Mystique and Wits checks.\n- Ends after a Short or Long Rest, or targeted Flow healing."
  },
  {
    name: "Staggered",
    summary: "Unsteady; slowed",
    text: "You can barely stay upright.\n\n- Speed halved.\n- No Swift or Impulse Actions.\n- Staggered again: you become Stunned.\n- Ends: Body Save DC 10 at end of your turn; an ally bracing you may grant Edge on it."
  },
  {
    name: "Strain",
    summary: "Penalties and Breakflow risk",
    text: "The cost of Overdraw, counted in Stages.\n\n- Each time Overdraw causes any Vitality loss, you accumulate Strain points equal to the Flow Points (FP) spent beyond your Reservoir. Gain 1 Stage of Strain for every 3 Strain points accumulated. Removing a Stage also clears any partial points; gaining a Stage another way leaves them where they are.\n- The five Stages and their effects are on the Strain Track in The Flow; each Stage keeps the effects of the Stages below it.\n- A Long Rest reduces Strain by 1 Stage. Ritual Recovery can remove additional Stages based on successes.\n- Downtime clears all Strain (unless you're in Breakflow), as described in the Recovery section. Breakflow Restoration ends the Breakflow condition and lowers Strain to Stage 2, not to zero. While you're in Breakflow, only Breakflow Restoration or Rough Restoration lowers your Strain; Long Rests and Ritual Recovery work again once it ends."
  },
  {
    name: "Stunned",
    summary: "Shock locks body; vulnerable",
    text: "Shock has locked you up.\n\n- Speed 0.\n- No Move or Impulse Actions; one Action or one Swift Action per turn.\n- Snag on Body and Agility saves; attacks against you gain Edge.\n- Ends: end-of-turn Body Save DC 15, or effects removing shock or heavy stun."
  },
  {
    name: "Suffocating",
    summary: "Lose 1d6 Vitality at the start of each of your turns",
    text: "You can't get air, and there's no holding your breath.\n\n- Can't speak; anything needing breath fails.\n- Lose 1d6 Vitality at each turn start; it can't be reduced or prevented.\n- Never applies with Drowning. Non-breathers, Clankers included, are immune.\n- Ends only with air (Rebreather, sealed suit, air-supplying effect); no save."
  },
  {
    name: "Suppressed",
    summary: "Snag on attack rolls; lose Impulse Actions",
    text: "Incoming fire has you pinned.\n\n- Snag on attack rolls.\n- No Impulse Actions.\n- Ends at the start of the suppressor's next turn unless its effect sets another duration, or early at GM discretion when the fire stops (shooter drops, loses line of sight, or switches targets)."
  },
  {
    name: "Surprised",
    summary: "Caught off guard; no actions on your first turn",
    text: "Combat started before you knew it.\n\n- Applies if you were unaware when combat began (beaten on Stealth against Perception, or GM ruling). Aware of any hostile, you aren't.\n- First turn: no Action, Move, Swift, or Impulse; Saves allowed.\n- Attacks against you gain Edge.\n- Ends when your second turn starts."
  },
  {
    /* Added 2026-09-19, closing the gap flagged when the Marking trait became Tracing. Traced was
       already being applied by the Tracing gear trait and by Tracer Rounds, but it had no entry
       here, so the app's canonical conditions reference did not define the thing its own gear
       inflicted. The mechanics are unchanged; they finally have a source.

       Not to be confused with Trace, the #GRID consequence you accrue. That is a different system,
       reached through the Smartdeck trait Trace-Resistant Signature, the Codebreaker's Trace Cutter
       Signature #GRID Exploit (there is no Trace Cutter cipher any more, it was cut from the book on
       2026-09-30), and Trace Evasion hardware mods such as the Burn Notice Module. Only the first of
       those three is actually a deck trait. */
    name: "Traced",
    summary: "Attacker and allies gain Edge on ranged attacks against you",
    text: "You're tagged for everyone shooting at you.\n\n- The first qualifying hit each round applies it.\n- The attacker and their allies gain Edge on ranged attacks against you.\n- Ends at the start of the attacker's next turn."
  },
  {
    name: "Unconscious",
    summary: "Drop items, Prone, can't act or perceive",
    text: "You're out.\n\n- Drop held items; fall Prone.\n- No actions, even meaningful Free Actions; unaware of surroundings.\n- Auto-fail Body and Agility saves (others at GM discretion).\n- Lose Focus on sustained effects; disconnect from networks.\n- Ends: healing, revival, or duration; some injuries prolong it."
  },
  {
    name: "Vacuum",
    /* The Handbook lists Vacuum under Environmental Hazards (PHB:8284), not among its conditions.
       It stays in this library so it can sit on the condition tracker beside Drowning (author
       ruling 10, 19 October 2026), and says so here; the library count stays 50. */
    summary: "Environmental Hazard (tracked here): Mirrors Drowning; plus 1d6 Cold every round and you can't speak",
    text: "The Handbook lists Vacuum under Environmental Hazards. It is tracked here as well so it can sit on the condition tracker beside Drowning.\n\n- It works the way Drowning works. Hold your breath a number of rounds equal to your Body score. After that, start of each of your turns: Body Save, DC 10, climbing by 2 each round. Failure: 1 Wound; at or below half your Wounds, also Unconscious.\n- If your Wounds reach 0 while exposed, you die.\n- Exposed skin takes 1d6 Cold damage each round regardless of the save.\n- You can't speak, and nothing that needs air works.\n- Sealed armor isn't enough on its own. A suit holds vacuum only if its entry says so: a Rebreather Liner fitted to a suit that is already Sealed upgrades that seal to hold.\n- Ends when you regain pressure and air, or seal into a suit that holds vacuum."
  },
  {
    name: "Vulnerability",
    summary: "Double damage of specified type",
    text: "A damage type hurts you more.\n\n- Double damage from that type.\n- Multiple sources don't stack.\n- Cancels with Resistance to the same type."
  }
];
