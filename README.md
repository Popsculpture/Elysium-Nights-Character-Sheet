# #GRID OS: Elysium Nights Character Sheet

An interactive, fully-automated character sheet for the **Elysium Nights** TTRPG, themed as a
cyberpunk "#GRID" Smartdeck operating system. Build a Freelancer, level them up, and run them at
the table. Attributes, skills, proficiencies, conditions, weapons, ammo, and class features are
all tracked and derived live.

## Tabs

- **#PRINT**: character creation & leveling (the foundation every other tab reads from). Export / import a record as JSON.
- **Freelancer**: the live play dashboard for vitality/wounds, conditions, saves, senses, attacks (equipped weapons with firing modes & ammo), and class features.
- **Inventory**: Stash, Chrome, and a gray-market storefront with selectable pricing modes.
- **Codex**: searchable rules reference (action economy, defenses, cover, damage types, conditions).
- **#GRID / Flow**: module stubs.

## Tech

Vanilla JS, no build step, no backend. Everything is static HTML/CSS/JS and runs straight from
the filesystem (`file://`-safe). Character data persists in the browser's `localStorage`; use the
**⤓ Export Record** button on #PRINT to move a Freelancer between devices.

## Run it locally

Open `app/index.html` in any modern browser. (Fonts load from Google Fonts when online, and fall
back to system fonts offline.)

## Deploy

GitHub Pages serves this repo **straight from the `main` branch root**, with no build step. Push to
`main` and the live site follows a minute later. `Pages -> Build and deployment -> Source` is set to
**Deploy from a branch**, and `CNAME` at the repo root is what points elysiumnightsrpg.com here.

That is why the layout is what it is: `https://elysiumnightsrpg.com/` serves the root `index.html`,
a redirect stub, and the app itself lives under `/app/`. Every published URL carries that `/app/`
prefix.

This repo used to also ship `.github/workflows/deploy.yml`, which uploaded `app/` as a Pages
artifact. It was deleted, and deliberately. It did not fail, which is what made it worth removing:
it succeeded on every push, so each commit produced TWO deployments to the same `github-pages`
environment about twenty seconds apart, the workflow's and the branch builder's. The branch builder
consistently landed second and won, which is the only reason the URL layout stayed stable. Had the
order ever flipped, `app/` would have become the site root, this stub would have vanished, and every
`/app/...` link would have broken. One publisher, no race.

**If a build step is ever needed**, that is the moment to reintroduce a workflow, and the switch has
to be made properly: set the Pages source to **GitHub Actions** at the same time, so only one
publisher is ever live. Be aware that doing so makes `app/` the site root and moves every URL on the
site.

### Before each deploy

Run this whenever anything under `app/` changed, then commit the result with your work:

    python tools/stamp_version.py

Pages serves every file with `Cache-Control: max-age=600` and that cannot be configured from the
repo, so without a version on the asset URLs a browser can pair a cached `js/ui.js` with a fresh
`data/rules.js` and run half of one build against half of another. Stamping makes a deploy atomic:
all 49 local assets change name together, so the build swaps in one piece. It does not make the
deploy arrive any sooner, because the HTML carries the same ten minute cache. `--strip` undoes it.

The stamped URLs do **not** break opening `app/index.html` straight from disk. Browsers ignore the
query when resolving a `file:` path, and this was confirmed by hand on Windows, so the app stays
usable offline with the versions in place.
