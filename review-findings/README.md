# Verifier findings archive

Raw output from the adversarial review agents run during the 2026-08-09 manuscript
sync. Copied out of a session-scoped temp directory so they survive.

Each file is a JSON task result. The findings live under `result.verdicts`, an array
of strings, one per verifier lens, plus `result.done` which is the implementer's own
report. Parse with UTF-8; a naive print can choke on the arrow glyphs, so set
`PYTHONIOENCODING=utf-8`.

`DEFERRED-FIXES.md` cites these by their original task id, which is the filename here.

| File | Round | Read? |
| ----- | ----- | ----- |
| `wgxtatdtw.json` | Unarmed two-phase rewrite | read, in the consolidation pass |
| `w2e5slhtt.json` | Renames and gear values | read |
| `wvcpodf55.json` | Entry-key refactor | read |
| `w07f74fu1.json` | The consolidation pass itself | read; its merged list is the L-numbered section in `DEFERRED-FIXES.md` |
| `wiq3wag7g.json` | Migration ordering and qty predicates | read |
| `w4qe3petu.json` | Duplicate-id door | **all three lenses read 2026-08-10.** Both live findings fixed |
| `wx7cb0612.json` | Armor Repair build | **all three lenses read 2026-08-10.** Five findings were still live and are fixed in `cfc4886` |
| `wmudlussk.json` | Armor Repair defect fixes | **all three lenses read.** Lens 0 (migration mis-attribution) was read earlier and its blocker fixed; lenses 1 and 2 read 2026-08-10, four findings still live, all fixed in `cfc4886` |
| `wbkcw3wnd.json` | Environmental Hazards build | **both surviving lenses read 2026-08-10**, all five findings fixed. The vacuum lens DIED and is absent; that subsystem was verified directly instead |

**Nothing in this archive is unread.** Every lens is recorded in `DEFERRED-FIXES.md` with
its finding either fixed, closed by a later commit and re-checked against the current
code, or explicitly left open with a reason. The last two files are written up under
"The last two unread review files, read 2026-08-10, and the six live findings closed",
which also lists what those files raised that was left alone and why.
