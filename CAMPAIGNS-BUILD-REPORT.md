# Campaigns build report: batch 1, one login and Gizmo

Built 8 Nov 2026 on `campaigns-batch-1`, cut from `main` at `d550e22`. Not merged: `main` is the live
site and waits for the author's sign-off. No database work in this batch.

The reasoning behind every call is in the plan doc, "Elysium Nights: Campaigns and Characters Plan".
Every decision taken where the spec left room is also logged under "Campaigns" in `DEFERRED-FIXES.md`.

## What is built

**0. Gizmo is untouched.** `gate.js` keeps its name and its line in `index.html`. `clipSvg()` and the
`gizmoSvg` export are byte for byte. Nothing in `tour.js` was edited or removed: the blink is new
rules only. (Its existing reduced-motion line gained a trailing comma because a line now follows it in
the array; its content is unchanged.) The Admin egg's bubble markup and CSS (`.gate-clip`,
`.gate-bubble`, `.gate-clipsvg`, `gate-clipwob`) are reused as they were, and no Gizmo art was drawn.

**1. The login card.** After the boot animation, one card: JACK IN WITH DISCORD (`EN.cloud.jackIn()`)
and a quieter RUN OFFLINE. Where `EN.cloud.available()` is false (a `file://` page), it offers Run
offline only, with "Discord sign-in needs the hosted app, elysiumnightsrpg.com/app." The card shows
until the device has a Discord session or has picked Run offline (`en_login_v1`). The old
`en_gate_ok_v1` and `en_gate_admin_ok_v1` are ignored and left in place. A jacked-in device skips the
card; jacking out brings it back on the next load. `?dev` and `?nogate` skip it, `?login` forces it.
The `// maintenance` bypass, `CONFIG.password` and `CONFIG.adminPassword` are gone.

**2. Desktops.** `require(land)` answers with no profile, so `land()` falls back to the remembered
desktop: Freelancer on a first landing, the last one after that. `switchUser` and `signOut` left the
gate's exports, so `// WORKSPACE` shows the plain FREELANCER and ADMIN buttons, and the footer SWITCH
USER is gone. The Admin desktop opens for everyone with no code. Jack out stays in `// CLOUD LINK`.

**3. Gizmo greets everyone once.** The first press of either button on a device
(`en_gizmo_hello_v1`) brings Gizmo beside the card (under it on narrow screens and #GRIDroid): "It
looks like you're trying to hack the mainframe! Want some help with that?" with Yes please / I've got
it. Either answer: "Say no more." and a short patch on the card. Then "You're in. I was never here.
I'm just a paperclip." and the button goes through. A click anywhere (or Escape) skips straight to
it. The Codebreaker hijack and the Guardian lockdown are retired.

**4. Gizmo blinks.** One keyframe set in `gate.js` for both places, with the resting gaze in
`--gz-rest`: 0 on the login card, `-3px` in the tour. Every 10 s he blinks (120 ms), looks straight at
you for 1.5 s, blinks again and goes back. The four eye circles squash to `scaleY(.08)` around their
own centers, and the pupils swap gaze while his eyes are shut. On the big tour Gizmo and the login
Gizmo, not on the 18 px icon. Off under `prefers-reduced-motion`.

Also: the asset stamp is `?v=20261108.1`. '98's full-width card buttons no longer run into the card's
right edge. The theme.css rules for retired classes are gone. README and HANDOFF describe the new
login.

## Commits

- `f58ecc0` one login card, Gizmo greets the device once, Gizmo blinks
- `5ceae93` README, HANDOFF and DEFERRED-FIXES for the new login
- this report

## Checked, and how

| Done when | Result | How |
| --- | --- | --- |
| `EN.gate.gizmoSvg()` fingerprints identical | Pass | SHA-256 of `gizmoSvg()`, `gizmoSvg("tour-gizmosvg")` and `gizmoSvg("gate-clipsvg")`, loaded from `gate.js` in Node before and after: all three identical. The bubble's 11 CSS lines diffed identical against `main`. The new test pins the literal string. |
| Tour step 1: Gizmo, bubble, eyes on the card, the blink | Pass | Browser pane: step 1 shows him beside the card with his typed bubble. Sampling his pupils every 20 ms for one full cycle: at rest `-3px` (on the card), 1.5 s at `-1px`, the change only while scaleY is below 1, never an in-between position. The 18 px icon on step 2 has no animation. Same in all three skins. |
| Fresh device: card, Gizmo greets, Run offline lands on Freelancer; reload: no card, no greeting | Pass | Browser pane (Classic, wide) and the suite's new `campaigns_login` chain (`file://`, no `?dev`). |
| `?login` shows the card, `?dev` skips it | Pass | Browser pane and the chain's step 3. `?dev` is also every other suite run. |
| `// WORKSPACE` switches desktops with no code | Pass | Browser pane: clicked ADMIN in the tray, landed on the Table, no card; the chain's step 2 clicks both. |
| Checked in all three skins | Pass | Browser pane: the card and the greeting in Classic (wide), '98 (wide) and #GRIDroid (375 px), and the tour blink in all three. |

Also checked: a stored Discord session skips the card and spends the offline pick; no session brings
the card back; a `?code=` return from Discord skips it; with sign-in available the card leads with
Jack in, the press reaches `EN.cloud.jackIn("discord")` (stubbed, so the pane never left for Discord),
and a sign-in that never leaves the page brings the card back after 4 s with COULD NOT REACH DISCORD.
The console stayed clean. The dash, control-character and syntax sweeps are clean.

The new suite chain is `campaigns_login`, three steps, 52 checks, all passing. The full suite on the
branch (round 196, run before the chain was added): 483 chains, 501 runs, 0 bad. The chain on its own
(rounds 196c and 196d): 3 runs, 0 bad once the tests carried `@no-pack`.

## Waiting for the author

- **The real Jack in round trip** on the live site, after a merge: the card, Gizmo, Discord, and back
  to the app with no card. Localhost is not on the sign-in redirect list, so I stubbed the call instead.
- **Reduced motion, seen on a device.** The rules are in place and checked in the stylesheet, but the
  browser pane cannot emulate `prefers-reduced-motion`.
- **The blink against the reference loops** (`gizmo-blink.gif`, `gizmo-blink-tour.gif`). They are not
  in this session, so the timing was built from the spec's numbers (with a 120 ms blink, not the
  loops' 160 ms). Tune by feel.
- **Gizmo's lines**, which the spec calls a draft. They are `LINES` and `PATCH` near the middle of
  `gate.js`.

## Decisions

1. **Run offline opens the remembered desktop.** On a fresh device that is Freelancer, as section 3
   says. On a device that last used Admin it is Admin, because section 2 has the gate answer with no
   profile. One word in `runOffline()` changes it.
2. **`?portal=admin` still lands on Admin** for one load: the suite's default query is
   `?dev&portal=admin`.
3. **`?dev` keeps its old habits**: Freelancer on #PRINT unless `?portal=admin`, and it records the
   offline pick the way it used to record the unlock.
4. **Jacked in is read from the stored session at boot**, not from the asynchronous `getSession()`,
   plus the `?code=` return from Discord, so the boot never waits on the network.
5. **Finding a session clears the offline pick**, which is how jacking out brings the card back
   without cloud.js knowing about the gate.
6. **The greeting is recorded as Gizmo arrives**, so a reload mid-greeting does not repeat him.
7. **He stands in a wrapper beside the card**, not inside it, because '98 and #GRIDroid clip the card.
8. **The keyframes load with gate.js itself**, not with the card's styles, so the tour has them on a
   device that never sees the card.
9. **The cog note fires after Run offline only**, and says Running offline.
10. **Left open on purpose:** the login Gizmo's sway still ignores reduced motion, as it always has
    (the spec asked for the blink only). One line fixes it.
