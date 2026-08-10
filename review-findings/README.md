# Verifier findings archive

Raw output from the adversarial review agents run during the 2026-08-09 manuscript
sync. Copied out of a session-scoped temp directory so they survive.

Each file is a JSON task result. The findings live under `result.verdicts`, an array
of strings, one per verifier lens, plus `result.done` which is the implementer's own
report. Parse with UTF-8; a naive print can choke on the arrow glyphs, so set
`PYTHONIOENCODING=utf-8`.

`DEFERRED-FIXES.md` cites these by their original task id, which is the filename here.

| File | Round | Unread findings still in it |
| ----- | ----- | ----- |
| `wgxtatdtw.json` | Unarmed two-phase rewrite | none, all read in the consolidation pass |
| `w2e5slhtt.json` | Renames and gear values | none, all read |
| `wvcpodf55.json` | Entry-key refactor | none, all read |
| `w07f74fu1.json` | The consolidation pass itself | the merged prioritized list |
| `wiq3wag7g.json` | Migration ordering and qty predicates | none |
| `w4qe3petu.json` | Duplicate-id door | TWO unread lenses |
| `wx7cb0612.json` | Armor Repair build | the three lens reports |
| `wmudlussk.json` | Armor Repair defect fixes | TWO unread lenses |
| `wbkcw3wnd.json` | Environmental Hazards build | remaining clock findings; the vacuum lens DIED and is absent |

The three rows worth opening first are `w4qe3petu`, `wmudlussk` and `wbkcw3wnd`.
