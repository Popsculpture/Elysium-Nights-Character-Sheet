# Session handoff

Paste this into a fresh session to resume the manuscript sync work.

---

Continuing work on the Elysium Nights Character Sheet (`C:\Users\Popsc\OneDrive\Documents\Elysium Nights Character Sheet`). Previous session ran out of context. Everything is committed and pushed.

## Read these first, in this order

1. `DEFERRED-FIXES.md`: the running log. It carries five invariants this codebase paid for one at a time, each learned by getting it wrong. Do not relitigate them.
2. `STATUS-CHANGES-SPEC.md`: the next feature, fully specced.
3. `review-findings/README.md`: archived adversarial-review output. Rows `w4qe3petu`, `wmudlussk` and `wbkcw3wnd` still have unread lenses.

## State

`main` is deployed and healthy. Two branches carry unmerged work:

- **`armor-repair-wip`**: Armor Repair. One blocking defect: the migration's idempotency shortcut runs before attribution, so a legacy key that collides with a live entry key relocates armor wear onto the wrong piece. Three rounds have patched this. It needs a design change: make idempotency *stated* by the record rather than *inferred* from whether a key looks like an entry key.
- **`env-hazards-wip`**: Environmental Hazards. The thin-air Long Rest lock drifts, because the hazard row is never decremented when an ability clears Fatigue. The vacuum lens died on an API error, so that subsystem is unverified.

## Queued, cheapest first

1. `Dead-Eye Sniper` to `Zeroed In` rename, plus resorting Combat & Weapon Mastery so it sits last. Ruled, not applied. On `main`.
2. Status Changes panel, per the spec. Build on `env-hazards-wip`. Fold in Pneumatic Bypass's stale replacer prose while there.
3. Hazards defects, on that branch.
4. Armor attribution, on its branch.

## Conventions

- Commit to the current branch. Never push, I push. Remind me on its own line.
- Zero em dashes and en dashes anywhere. `LC_ALL=C.UTF-8 grep -rnP "[\x{2013}\x{2014}]"` must be clean before every commit.
- Load with `?dev` to skip the sign-on gate, and add a cache-buster (`?dev&cb=x`), since stale JS has produced false readings twice.
- Give parallel agents their own preview origin. Sharing 8777 corrupts the roster.
- My loaded character is expendable. Do not spend effort preserving it.

## Useful

Re-running a branch's workflow with `resumeFromRunId` replays cached agents instantly and only re-runs what changed. Much cheaper than starting over.
