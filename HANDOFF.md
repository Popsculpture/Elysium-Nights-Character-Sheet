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
   matching `as an Action` means `Rig Fuel`, `Biological Meltdown` and `Chemical Warfare`
   all render PASSIVE on the sheet, the print sheet and the PDF. Widening the regex to
   tolerate `**` fixes all three at once but reclassifies features, so it wants a
   deliberate decision rather than a quiet patch.
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
