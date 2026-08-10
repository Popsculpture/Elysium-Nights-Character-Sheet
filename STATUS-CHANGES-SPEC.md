# Status Changes panel

Author spec, given 2026-08-10. Reworks the Conditions panel into one place for every
temporary state a Freelancer can be under. Not built yet.

**Where this belongs.** It surfaces Hazards, which live on branch `env-hazards-wip`.
Build it there, or after that branch merges. It also gives Pneumatic Bypass its home,
which closes a question that has been open since the unarmed rewrite.

## 1. Rename

The Conditions panel becomes **Status Changes**.

## 2. Conditions keep working exactly as they do now

The `- add a condition -` dropdown stays in the header. The `+ Apply` button stays on
the far right of the header. No change to how conditions apply, stack or clear.

## 3. Two more header dropdowns, each behaving identically to the conditions one

### 3a. `- add a Hazard -`

Selection headers, with their applicable sub options grouped under each:

- **Exposure**
- **Deprivation**
- **Environmental**

Applying one extends the panel with the relevant selected sub option, the same way a
condition extends it today.

Placement decisions:

- **Drowning moves to Conditions.** It is more a condition than an environmental hazard.
- **Environmental's sub options are Vacuum, and Caustic Air & Sludge.**
- **Gear Degradation stays a rider on Caustic Air & Sludge**, where it is most relevant,
  rather than becoming its own entry.

**Mitigations surface as chips or riders on the relevant Hazard, and only when the
player actually has them:**

- A mitigation that comes from GEAR surfaces only if that gear is in the affected
  player's stash. It renders greyed out when it is not active, meaning not worn, not
  equipped, or not applied, depending on what that piece requires.
- A mitigation that comes from an always-on source such as a trait surfaces only if the
  player possesses that trait. Because it is always on it needs NO toggle: show it as
  active and tell the player what they are benefiting from.

### 3b. `- add a Bonus -`

Selection headers, with their applicable sub options grouped under each:

- **Class Buffs**, which is where Hot-Wired Implants live for now, including
  **Pneumatic Bypass**.
- **Consumables**

Applying one extends the panel with the relevant selected sub option, as above. This
list will grow in later iterations, so build it to be extended rather than hardcoded.

## 4. Shared apply flow

All three dropdowns live in the header alongside the existing one, and all three
operate off the SAME `+ Apply` button. Once a Status Change is selected and applied:

- it is added to the panel exactly the way conditions are added today, and
- the dropdown RESETS to its default option at the top of the list, ready for the next
  selection.

## Why this matters beyond the immediate need

It gives Pneumatic Bypass a player-controlled toggle, which is what it always needed:
it is a Ripper Hot-Wired Implant a Stitcher installs on an ally, so the recipient's own
sheet has no way to know it is active. A Class Buffs toggle is exactly that missing
state, and the same shape serves every future buff of that kind.

It also gives the hazard mitigations somewhere to be seen. They are currently wired to
change outcomes but a player has no single place to look and learn that their Void Lung
or Hazard Seal is doing something.
