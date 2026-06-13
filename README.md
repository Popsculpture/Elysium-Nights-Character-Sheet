# #GRID OS — Elysium Nights Character Sheet

An interactive, fully-automated character sheet for the **Elysium Nights** TTRPG, themed as a
cyberpunk "#GRID" Smartdeck operating system. Build a Freelancer, level them up, and run them at
the table — attributes, skills, proficiencies, conditions, weapons, ammo, and class features are
all tracked and derived live.

## Tabs

- **#PRINT** — character creation & leveling (the foundation every other tab reads from). Export / import a record as JSON.
- **Freelancer** — the live play dashboard: vitality/wounds, conditions, saves, senses, attacks (equipped weapons with firing modes & ammo), and class features.
- **Inventory** — Stash, Chrome, and a gray-market storefront with selectable pricing modes.
- **Codex** — searchable rules reference (action economy, defenses, cover, damage types, conditions).
- **#GRID / Flow** — module stubs.

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
