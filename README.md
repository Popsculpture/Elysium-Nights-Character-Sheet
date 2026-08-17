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

This repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that publishes the
`app/` folder to GitHub Pages. In the repo settings, set **Pages → Build and deployment → Source:
GitHub Actions**, then every push to `main` redeploys the live site.

**As currently configured the live site is NOT built by that workflow.** It is served from the
branch root: `https://elysiumnightsrpg.com/` returns this repo's root `index.html` (the redirect
stub) rather than `app/index.html`, the app lives under `/app/`, and `CNAME` sits at the repo
root. Switching Pages to the GitHub Actions source as described above would make `app/` the site
root and move every URL, so treat that paragraph as the intended setup, not the current one.

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
