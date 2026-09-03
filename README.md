# #GRID OS: Elysium Nights Character Sheet

An interactive, fully-automated character sheet for the **Elysium Nights** TTRPG, themed as a
cyberpunk "#GRID" Smartdeck operating system. Build a Freelancer, level them up, and run them at
the table. Attributes, skills, proficiencies, conditions, weapons, ammo, and class features are
all tracked and derived live.

## Two desktops

The login gate has two profiles, Freelancer and Admin, each with its own code and its own look,
and the one you sign in as is the desktop you land on. Switch user from the gate or from the
settings cog. The choice is remembered per device (`?portal=admin` overrides it for one load).

- **Freelancer portal**: the player's own sheet. #PRINT (character creation & leveling, the
  foundation every other tab reads from; export / import a record as JSON), Freelancer (the live
  play dashboard for vitality/wounds, conditions, saves, senses, attacks, class features), Social,
  #GRID, Flow, Inventory (Stash, Chrome, a gray-market storefront), Codex (searchable rules
  reference).
- **Admin portal**: the GM toolkit, on its own rail. Table (initiative tracker), Threats (statblock
  builder), Bestiary (33 transcribed Part 4 entries), plus Encounters, Hazards, Job Board, and
  Payroll, named stubs for stages still to come.


## Skins and wallpapers

Settings has an OS Skin row beside the color themes: Classic (the look as shipped), #GRIDOS '98
(a Windows 98 homage: bevels, title bars with caption buttons, a taskbar with START, and an
Inventory tab that opens a "#GRID Explorer" window around a 1998 auction-site Gray Market), and
#GRIDroid (a cyberpunk phone OS: one phone-width screen in a HUD bezel at any width, the tab rail
an app list docked at the foot, folded to the open app and unfolding on a tap). On '98 and
#GRIDroid a Wallpaper row picks the desktop behind the windows: six presets from the author's art
in `app/img/wallpapers`, or your own image from a file (resized and kept on the device), with
toggles to dim it and to outline or glow the desktop's text. Skins and wallpapers are device
settings, never part of a character or its export.

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
