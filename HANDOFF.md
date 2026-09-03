# Session handoff

Paste the block below into a fresh session to resume work. Written 2026-08-10, after
Environmental Hazards, the Status Changes panel and Armor Repair all merged to `main`.

---

Continuing work on the Elysium Nights Character Sheet
(`C:\Users\Popsc\OneDrive\Documents\Elysium Nights Character Sheet`). This is a LOCAL
session on my PC, so you can run a dev server and drive the real app.

**Do this first: `git pull`.** The last session ran in a cloud container and pushed a lot.
Your local clone is many commits behind, and the three feature branches it used
(`env-hazards-wip`, `armor-repair-wip`, `claude/elysium-nights-continuation-fg8qbb`) are
merged and deleted. Everything is on `main`, which is deployed to elysiumnightsrpg.com.

## Read these first, in this order

1. `DEFERRED-FIXES.md`: the running log, and the most important file in the repo. It
   carries the invariants this codebase paid for one at a time, each learned by getting
   it wrong. Do not relitigate them. It is long; read the section headings first and go
   deep only where you are about to touch.

   Two things about how to read it. It is an archaeological record, not a to-do list:
   entries are struck and annotated in place rather than deleted, so the reasoning
   survives. The "Live findings" section opens with a reconciliation naming exactly which
   of the thirteen L-numbered findings are still open, and that is the list to trust. And
   every `file.js:NNN` line reference in it is STALE, written before three branches merged
   into `main`; treat them as a hint about which file and find the site by the quoted
   code, which is still accurate.
2. `review-findings/README.md`: archived adversarial-review output, with an honest table
   of what has and has not been read.

## State

`main` is deployed and healthy, and there are no branches. Everything below shipped and
was verified on the live site: Environmental Hazards, the Status Changes panel, Armor
Repair with Shield Durability converted beside it, the `Zeroed In` rename, Pneumatic
Bypass wired into the unarmed engine, and a `migrate()` hardening pass.

## Open work, roughly in the order I would take it

1. **Two unread review files, and they cover shipped code.** `review-findings/wx7cb0612.json`
   was never opened, and only lens 0 of `review-findings/wmudlussk.json` was read in full.
   Both are Armor Repair, which is now live. Parse with `PYTHONIOENCODING=utf-8`; findings
   live under `result.verdicts`, an array of strings, one per lens.
2. **L1, the most player-visible open defect and it needs no import.** One Talent picked
   in two Universal Upgrade slots double-counts its unarmed step: pick Street Scrapper in
   slots 2 and 4 and a bare fist punches `1d6`. `uuTalentsOwned` already exists in
   `app/js/builder.js`, so the filter is one expression away. Full write-up in
   `DEFERRED-FIXES.md`.
3. **The action-type classifier cannot see bolded action types.** A plain-text regex
   matching `as an Action` (three copies: `app/js/combat.js`, `app/js/printsheet.js`,
   `app/js/pdfexport.js`) means a feature written `As an **Action**` falls through and
   renders PASSIVE on the sheet, the print sheet and the PDF. `DEFERRED-FIXES.md` names
   `Rig Fuel`, `Biological Meltdown` and `Chemical Warfare` as mis-tagged, but measure
   before you fix: there are **11 bolded occurrences across four class data files**, and
   widening the regex touches every one. Some of those features state their action type
   unbolded elsewhere in the same text and already classify correctly, so the blast radius
   is larger than the three. That is exactly why this wants a deliberate decision rather
   than a quiet patch.
4. **L2 through L7 and L13**, plus the 14 PART C rulings. All in `DEFERRED-FIXES.md`.
5. **Thermal Regulation Weave's Resistance** is neither applied nor displayed inside the
   hazard. Blocked on there being no damage pipeline to reduce, so it is a build, not a
   patch.

## Conventions

- Commit as you go. When you reach a stopping point, STOP, summarize what you want to
  push at a high level, and ask me whether I want to review or add anything first. Give
  me a phrase to type back that authorizes the push. Never push without it.
- Zero em dashes and en dashes anywhere. `LC_ALL=C.UTF-8 grep -rnP "[\x{2013}\x{2014}]"`
  must be clean before every commit, excluding `app/vendor` (third party).
- Also check for stray control characters: `grep -rlP "[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]"`,
  same exclusions. A literal backspace once hid inside a regex for a whole session and
  silently disabled the `?dev` bypass; `cat -A` is the only thing that finds it.
- Load the app with `?dev` to skip the sign-on gate, and add a cache-buster
  (`?dev&cb=x`). Open `app/index.html` directly, not the repo-root `index.html`, which is
  a redirect stub that races a meta refresh against a JS redirect. Gate password is in
  `app/js/gate.js` if you need it.
- The gate has two profiles, and the one you enter as is the desktop you land on.
  `?dev` skips the Freelancer login; `?dev&portal=admin` skips the Admin one and lands on
  Admin/Table. Each profile keeps its own unlock flag (`en_gate_ok_v1`, `en_gate_admin_ok_v1`)
  and the desktop is remembered in `en_portal_v1`, so the gate only paints for a profile that
  has not been unlocked on this device, or from the settings tray's "SWITCH USER". The Admin
  passphrase is `CONFIG.adminPassword` in `app/js/gate.js`, beside the Freelancer code.
- To get the login screen back for testing: `?login` forces the gate to paint even though the
  profile is unlocked (`?login&portal=admin` for the Admin card), and clears nothing. The
  settings tray's "SIGN OUT" is the in-app route: it forgets BOTH profiles' unlocks and reopens
  the current profile's login card.
- Looks are device state too: the OS skin in `en_skin_v1` (Classic when absent), and on '98 the
  wallpaper choice in `en_wall_v1`, custom wallpapers as JPEG data URLs in `en_wall_custom_v1`,
  and the desktop's three toggles in `en_wall_dim_v1`, `en_wall_shadow_v1` and `en_wall_glow_v1`. Presets are listed in `app/data/wallpapers.js` and sit
  in `app/img/wallpapers`. None of it rides a character or an export.
- Give parallel agents their own preview origin. Sharing one corrupts the roster.
- My loaded character is expendable. Do not spend effort preserving it.

## How this codebase expects you to work

Five things earned the hard way, and the reason the log is worth reading:

- **Reproduce a defect before fixing it, and re-check against that same repro after.**
  Several "fixes" in the history turned out to be fixes for a defect that was not there.
- **Drive the real UI, not just the engine.** Logic-only readings have been wrong twice.
- **Prove a change is a no-op where it claims to be**, by fingerprinting whole records
  with a seeded RNG before and after, rather than asserting it.
- **State things in the record; do not infer them from shape.** Whether a key is already
  converted, which hazard is applied, which rig is live: every one of these was a bug
  until it was written down explicitly.
- **Unattributable state is dropped, never moved.** Losing a number the player can see is
  recoverable; silently relocating it onto the wrong object is not.

## Manuscript source of truth

Three live Google Docs. The app is synced against these, never against a local copy.

| Part | Doc id |
| ----- | ----- |
| 1, Welcome and Building a Character | `10x_s1WJ-gWsFxKViuGQvlB1Ddz3MyA-FBAPaMQjsNpQ` |
| 2, Core Rules, Combat, Survival and Specialized Systems | `1P74ExjneDDSUvEXQpVuDYvAvNz_w3rOVzVGVg7w-XHM` |
| 3, Equipment | `1ehY_1lcqpugD1bdcpBTvq32c7SpxdYj0m5h7ClYPKgM` |

Read one at `https://docs.google.com/document/d/<id>/edit`, or pull raw text from
`https://docs.google.com/document/d/<id>/export?format=markdown`.

**Use the markdown export, not txt.** Plain text strips bold and heading levels, which
produced false negatives here: a probe for a bolded trait name found nothing and looked
like the edit had never landed.

**How to spill without burning context.** Navigate real Chrome to
`https://docs.google.com/robots.txt`, a lightweight same-origin page, then fetch the
export endpoint from there. Do NOT pass `credentials: "include"`; on a same-origin
request it makes the fetch fail. The Docs editor itself freezes the renderer and its
CSP blocks the fetch, so do not load the document.

**Freshness is a hard gate.** Compare each doc's modified time against any local copy
before auditing. Auditing against a stale spill once produced a report claiming a live
trait had been invented, and six commits were reverted.

Parts 2 and 3 have never been spilled in full: Chrome refuses downloads from
`docs.google.com` on this machine. Targeted extracts of the changed passages are the
working substitute. Allowing automatic downloads for that origin would fix it.
