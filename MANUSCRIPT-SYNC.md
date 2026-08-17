# Manuscript edits owed, to sync the book with the app

Every ruling that requires a change to the three live Google Docs. Rulings that only
moved the app are not listed here; rulings that moved neither are recorded in
`RULES-SYNC-CHANGELOG.md` and need nothing from you.

**Status of the quoted text.** The strings below are quoted from the 2026-08-01 sync pass,
not re-read from the documents as they stand today. They are accurate as of that pass and
the entries involved are unlikely to have moved, but the manuscript has changed since (the
currency codes, the Open Architecture rebuild, Disengage), so **treat the quotes as
locations to find rather than as strings to paste blind**. A paste-ready punchlist with
verified find strings needs a browser signed in to your Google account; ask for it when one
is available and it becomes a mechanical afternoon instead of a hunt.

**14 items.** Twelve are edits. One is a design task. One is blocked on you.

---

## The one with real reach

### M21. Heavy no longer adds Load

**Ruling:** the Axe is 2 Load, and the Heavy trait does not contribute Load.

**Edit:** the Heavy trait's definition, wherever it says Heavy "adds to encumbrance". That
clause comes out.

This is not an Axe fix. It changes what Heavy *does*, so it reaches every Heavy weapon in
the book and the encumbrance maths behind them. Some entries may have been balanced
assuming Heavy contributed a point.

**Do not apply this one first.** The app build for it starts with a sweep of every Heavy
item and a before-and-after Load table handed to you. Edit the book after you have seen
that table, in case it changes your mind.

**App status:** not built, pending the sweep.

---

## Part 2

### M1. Max Complexity is Tier + 1

Ruled 2026-07-28 and never applied. Two edits in the Smartdeck section.

Replace the **Max Complexity** bullet with, verbatim:

> **Max Complexity:** Equal to Tier + 1. The deck cannot execute a cipher above this line.

Then the Smartdeck table's **Max Complexity** column changes from `0/1/2/3/4/5` to
`1/2/3/4/5/5`. Apex caps at 5 because the cipher library stops there, not because the
formula does.

Part 1 already states this rule correctly and needs no edit.

**Why it matters:** under the old text a starting Codebreaker cannot run half their own
starting kit. **App status:** already correct.

---

## Part 1

### M2. Brownout's Cipher Save DC

Ruled 2026-07-28 and never applied. The Codebreaker feature **Brownout** reads
`(8 + your Tech Modifier + your Caliber)`. It should read
`(8 + your Tech Modifier + your Systems Proficiency Bonus)`, or simply
`against your Cipher Save DC` with no parenthetical, since the formula is defined in the
#GRID chapter. Part 2 is correct and stays.

**App status:** already correct.

### M22. Improvised Weapons gains an exception clause

The **No Proficiency** bullet currently reads:

> **No Proficiency:** Nobody trains on a fire extinguisher. You do not add a Weapon
> Proficiency Bonus to an improvised attack roll.

It needs "unless a feature says otherwise", because Street Scrapper and the Walking Anvil
both grant exactly that. Without the clause the chapter contradicts two features.

**App status:** already correct, it carries all three faithfully.

### M25. The legality worked example

The example says a Licensed pistol wearing a Suppressor and a Full-Auto Receiver
`reads as Contraband`. Both parts are Restricted, and the strictest of Licensed plus
Restricted plus Restricted is **Restricted**. Change Contraband to Restricted.

You ruled that combinations do NOT escalate, so the rule stands and only the example moves.
Contraband stays unreachable in the catalog.

**App status:** already correct, it implements the rule rather than the example.

---

## Gear and Parts entries

### M16. Shotgun Choke is an Accessory

Its entry says `**Part Type:** Mod`. Change it to **Accessory**, matching the summary table,
which was right all along.

A real play difference, not a label: an Accessory snaps on and off in the field with no
tools and no roll; a Mod wants downtime, a bench and a kit.

**App status: BUILT.** The chip, its tooltip and the install toast all follow from it.

### M17. Seven suits gain the Modular trait

Add **Modular** to all seven: **Laborframe Exorig**, **Bailiff Rig**, **Warframe Shell**,
**Veilskin**, **Resonant Carapace**, **Aegis Shroud**, **Reliquary Shell**.

Each already lists Mod Slots, but three separate rules say slots only exist on Modular
armor, so as written none of them can take a mod.

**App status:** not built. It gates on the trait, so those seven take no mods today and
will take their listed counts once the trait is added.

### M18. Match Trigger Group grants Precision Frame in full

The mod reads:

> Apply Precision Frame. **Single Shot and Semi-Auto** attacks with this weapon score a
> critical hit on a roll of 19 or 20.

Strike the second sentence's limitation so it grants the trait unconditionally, matching
the trait's own definition. A Match-Trigger rifle firing Burst crits on 19 or 20.

**App status:** needs a check for whether the grant is mode-gated in data.

### M19. "Resonance Energy" means Resonant

Three occurrences, all inside the **Resonant Shield Elixir** entry, and the only three in
the book. Each becomes **Resonant**.

The phrase is not a damage type; the chapter defines Energy and Resonant as two distinct
types and this is neither.

**Consequence you accepted:** the elixir now stacks Resistance and DR on one type, and does
nothing against lasers or plasma. Its second clause trades the redundant Resistance for a
second point of DR, so the stacking is not wasted.

**App status: BUILT.**

### M20. Surgical Instruments converts to Edge Dice

Currently grants `+2 on the primary out-of-combat Medtech Dice Pool (or in-combat d20
check)`. Dice Pools take no flat modifiers, so reword to match the Advanced Medkit entry,
which states the same thing correctly:

> +2 on in-combat Medtech d20 checks (or +1 Edge Die on out-of-combat Dice Pools)

**App status: BUILT**, dropped from 2 Edge Dice to 1. Corroborated by the catalog, where
this was the only tool above 1.

### M24. Cyberarm and Cyberlegs stop hard-coding a slot count

Both base Effect lines say `up to 3 compatible mods`, while the tier table in the same
entry gives Streetware 2 / Brandware 3 / Blackware 4. Change the base line to defer to the
table, e.g. "in its slots".

**App status:** already correct, it says only "in its slots".

### M26. Drop the Powered Assist Grip exclusion

The Grip `cannot share a build with a Breakdown Frame`. The Grip is Handling and fits
Longarm; the only Breakdown Frame is Utility and fits Any Melee. No weapon can hold both,
so the clause can never fire. You ruled it vestigial, so no ranged Breakdown Frame is being
added. Delete the sentence.

**App status:** no change needed, though the clause should come out of the Part's data text
if it is carried there.

---

## Not an edit

### M27. Write the Heavy/Two-Handed Parts

You ruled to keep the `Heavy/Two-Handed` Fits frame rather than drop it. It is listed in
Core Concepts as a valid Fits value, appears once in the whole book, and no catalog entry
uses it, so it needs Parts written for it.

This is the one item the app cannot act on. It is new content, and the app needs the Part
list before it can carry anything. Until then the frame sits unused and harmless.

### M23. BLOCKED, and the block is mine

You ruled to rename the Fury's Overdrive Impulse to **You'll Do**, keeping Meat Shield for
the generic grapple-cover stance. **Do not apply that yet.** The question I asked described
the ability wrongly.

PART C summarised the Fury Impulse as redirecting a hit onto a grappled Target. The app's
own data says the opposite:

> Trigger: An ally within 2 spaces is hit by an attack. You instantly swap places with the
> ally and take the damage from the attack instead. You have Resistance to the damage taken
> this way.

One uses a grappled enemy as cover. The other is a sacrifice to save a teammate. **"You'll
Do" fits the first and actively misdescribes the second.** Confirm which the ability
actually is and the name follows; if it is the sacrificial version, it wants a different
name entirely.

---

## Optional clarifications

Neither is a contradiction. Both are places where the book is silent and the app had to
decide, so writing the decision down stops the question being reopened.

- **One Smartdeck live at a time.** You own as many as you buy, but you are jacked into one
  and the rest sit in the bag. The app is being rebuilt around this.
- **A wielded body does not get the Walking Anvil step-up.** The Walking Anvil steps
  improvised weapons up one die size and a wielded body is explicitly a Heavy improvised
  weapon, so the exemption is worth stating rather than leaving to be re-derived.
