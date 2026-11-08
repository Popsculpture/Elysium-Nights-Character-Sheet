# #GRID OS: Elysium Nights Character Sheet

An interactive, fully-automated character sheet for the **Elysium Nights** TTRPG, themed as a
cyberpunk "#GRID" Smartdeck operating system. Build a Freelancer, level them up, and run them at
the table. Attributes, skills, proficiencies, conditions, weapons, ammo, and class features are
all tracked and derived live.

## Two desktops

After the boot animation one card asks you to **Jack in with Discord** or **Run offline**, and
there are no codes. Either button lands on the Freelancer desktop. A device that is jacked in, or
has picked Run offline, skips the card and opens on the last desktop you used. The settings cog's
// WORKSPACE buttons switch between them (`?portal=admin` lands on Admin for one load that skips the
card). `?dev` skips the card and `?login` forces it, for testing.

- **Freelancer portal**: the player's own sheet. #PRINT (character creation & leveling, the
  foundation every other tab reads from; export / import a record as JSON), Freelancer (the live
  play dashboard for vitality/wounds, conditions, saves, senses, attacks, class features), Social
  (the standing ledger; Contacts, the people you can reach; and #POST, an inbox that rides the
  record), #GRID, Flow, Inventory
  (Stash, Chrome, a gray-market storefront), Codex (searchable rules reference).
- **Admin portal**: the GM toolkit, on its own rail, built from the Elysium Nights Game Master's
  Handbook. Table (initiative tracker, with the running plan, the Security Response clock, the Room's
  hazards and the XP award), Threats (statblock builder, initiative by the book's formula), Bestiary
  (all 48 statblocks with subgroups, Species Templates and Hostile Vehicles), Encounters (the XP
  budget, waves, objectives, saved plans, and RUN ON THE TABLE), Hazards (the eight Set Pieces at any
  Grade, custom hazards, stalemate and falling tools), Job Board (the five roll tables and the Twelve
  Postings, a job log, sending a posting to #POST), Payroll (contract pay, bounties, salvage, the
  split, milestones, and crediting the crew), Heat (the Downtime Heat check across the crew, events,
  Bounties and cooling off), People (contact cards with Resolve by Role, and the name and street
  handle roller), and Scenes (Sit-Down, chase and Incursion trackers). Table rows take damage by an
  amount, expand to their full statblock, carry conditions and notes, track a Solo's Surges and
  Breakpoint, and can have a Hostile Vehicle attached; Bestiary People cards take Species Templates. A
  GM'S CARD drawer on every Admin tab prints the book's quick reference. Every write the GM makes to a
  Freelancer's record is confirmed, logged and undoable, and GM data can be exported and imported from
  the Admin settings tray.


## Skins and wallpapers

Each skin remembers the last color theme you gave it, so the three can look like three different
machines: switch to #GRIDOS '98 and it comes back in the Windows scheme, switch to Classic and it
comes back in whatever you left there. Switching skins repaints the loaded Freelancer and saves
that palette to them, so a skin change is also a change to what that character exports.

Settings has an OS Skin row beside the color themes: Classic (the look as shipped), #GRIDOS '98
(a Windows 98 homage: bevels, title bars with caption buttons, a taskbar with START, an Explorer
toolbar under the header whose address bar names the view you have open, an
Inventory tab that opens a "#GRID Explorer" window around a 1998 auction-site Gray Market, and a
#POST inbox that opens in "#POST Express", a mail client with a folder pane and a preview pane), and
#GRIDroid (a cyberpunk phone OS: one phone-width screen in a HUD bezel at any width, the tab rail
an app list docked at the foot, folded to the open app and unfolding on a tap with Settings as its
last row, and a sideways swipe
that pages between tabs with a pill naming where you are heading). On '98 and
#GRIDroid a Wallpaper row picks the desktop behind the windows: your own image from a file
(resized and kept on the device), or on '98 alone one of the twelve presets: six photographs in
`app/img/wallpapers`, and six repeating patterns drawn as inline SVG in `app/data/wallpapers.js`
and tiled at their own size. Toggles dim the wallpaper and outline or glow the desktop's text. Skins and wallpapers are device
settings, never part of a character or its export.

## Tech

Vanilla JS, no build step. Everything is static HTML/CSS/JS and runs straight from the filesystem
(`file://`-safe). Character data persists in the browser's `localStorage`; use the
**⤓ Export Record** button on #PRINT to move a Freelancer between devices. On the live site a
player can also jack in with Discord: their characters then save to their account (Supabase,
`supabase/migrations`), and the content packs below download for them.

## Content packs

Some content is not in this repo at all. The Freelancer's Companion (catalog code EN1101) is a
**content pack**: it lives in the private repo `Popsculpture/Elysium-Nights-Packs`, the database
serves it (`content_packs`) only to an account that holds it, and the app downloads it, caches it per
account, and merges it back into the data it came from (`app/js/packs.js`). Jacking out takes it off
the device again. `app/data/launch.js` keeps the public manifest: the keys and names of what the pack
owns, so a character that uses it can be recognised without it. On a device without the pack such a
character is locked: read-only, stored exactly as it was, and never pushed to the account, until the
pack loads.

Who holds a pack is decided in the database, never in the app. `products.rule` is `signed_in` (any
account that has jacked in, whatever the sign-in provider) or `granted` (only accounts with a row in
`entitlements`). During the playtest the Companion is `granted`, and the Play tester role grants it
(below). At launch it goes back to `signed_in`.

### Publish a pack

From a checkout of the packs repo, with the Supabase CLI logged in once (`npx supabase@2 login`):

    node tools/publish.js --dry-run
    node tools/publish.js

1. Edit the pack source (`src/EN1101/`) and commit it.
2. Run the dry run. It runs the real upsert against the live database inside a transaction that is
   always rolled back, and checks that the stored pack reads back byte for byte. Nothing is published.
3. Run the publish. It stores the build as the live version plus one, so every publish bumps the
   version. A player's app downloads it the next time it checks (on start, and when they jack in);
   an app whose cache already holds the live version downloads nothing.

Instead of the CLI login, `--via db` reads a connection string from `DATABASE_URL`, and `--via rest`
reads the service role key from `SUPABASE_SERVICE_ROLE_KEY`. Keep both in your shell or an untracked
`.env`. Never commit them, and never put either in this repo or the app.

### Grant an entitlement

For a `granted` product (a backer reward, a paid supplement), one row per account:

1. Find the player's user id: Supabase dashboard, **Authentication**, **Users**, the player's row
   (their Discord name is under the user's metadata), copy the **UID**.
2. Open **Table Editor**, the `entitlements` table, **Insert row**: `user_id` is that UID, `sku` is
   the product (for example `EN1201`), `source` says why (`backer`, `purchase`, `comp`). `granted_at`
   fills itself.
3. Save. The player's app picks the pack up the next time it checks; jacking out and in again makes
   it check at once.

To take a grant back, delete the row; the pack leaves that player's device the next time the app
checks. Players can read their own rows and nothing else, and no player can write to `entitlements`
or `content_packs` (`supabase/tests/entitlements_checks.sql` proves both against the live project).
A `signed_in` product needs no rows at all.

### The playtest gate

While the Companion is in playtest, an account holds it when its Discord member has the **Play
tester** role in the Elysium Nights server. Jacking in asks Discord for one extra permission
(`guilds.members.read`, reading the player's own membership in a server). Right after the sign-in
the app sends Discord's token for that sign-in to the `discord-role` Edge Function
(`supabase/functions/discord-role`). The function checks that the token belongs to that account's
Discord, reads the player's roles in the server, and writes the grant (`source` = `discord_role`) or
removes it. Grants from any other source are never touched, so a backer or comp grant stays
whatever the roles say.

The check runs only at sign-in: a player who gains the role (or loses it) is updated the next time
they jack in. Jacked in without the role, Settings, // CONTENT reads COMPANION: PLAYTEST and offers
**CHECK MY ROLE AGAIN**, which jacks in again. Players who sign in some other way than Discord have
no role to check; grant them by hand as above.

Setup, once:

1. Discord, with Developer Mode on (User Settings, Advanced): right-click the server, **Copy Server
   ID**; Server Settings, Roles, right-click Play tester, **Copy Role ID**.
2. Supabase dashboard, **Edge Functions**, **Secrets**: add `DISCORD_GUILD_ID` and
   `DISCORD_ROLE_ID`. They are IDs, not secrets, but they live there so they never ship in the app.
   Until both are set the function decides nothing and changes no grants.
3. Deploy the function: `npx supabase@2 functions deploy discord-role --project-ref
   ggjgkcnhfpjwyrhakqun --use-api`.
4. Switch the Companion to `granted`: apply `supabase/migrations/20261108000000_playtest_gate.sql`
   (or, in the Table Editor, set `products.rule` for `EN1101` to `granted`).

At launch, set `products.rule` for `EN1101` back to `signed_in`. The grants can stay; they do
nothing for a `signed_in` product.

## Install it on a phone

The app ships a web app manifest, so a phone browser offers **Add to Home screen** (Chrome on
Android puts it in the three-dot menu; Safari on iOS under Share). Launched from that icon it runs
as an installed app with no address bar, which is the way #GRIDroid is meant to be used. The icon
is the `#` badge from the phone skin's header, in gold. Nothing changes for a plain browser tab.

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
all 60 local assets change name together, so the build swaps in one piece. It does not make the
deploy arrive any sooner, because the HTML carries the same ten minute cache. `--strip` undoes it.

The stamped URLs do **not** break opening `app/index.html` straight from disk. Browsers ignore the
query when resolving a `file:` path, and this was confirmed by hand on Windows, so the app stays
usable offline with the versions in place.
