/* ===========================================================================
   ELYSIUM NIGHTS · Wallpapers  (#GRIDOS '98 skin)
   The preset desktops behind the windows on the '98 skin: the author's art,
   sitting in app/img/wallpapers as JPEGs (the full 1672x941 frame and a
   360px thumb for the picker). Listed here because file:// cannot read a
   folder, so the settings tray has to be told what exists. A missing file
   is harmless: the picker shows a blank card and the desktop falls back to
   the dither. Custom wallpapers are not listed here; they live in
   localStorage (settings.js, EN.theme.wallCustoms). Device-level state,
   never on a character, never in an export.
   =========================================================================== */
window.EN = window.EN || {};
EN.wallpapers = [
  { key: "rolling-hill-day",   name: "Rolling Hill, Sector 7 · Day",   file: "rolling-hill-day.jpg",   thumb: "rolling-hill-day.thumb.jpg" },
  { key: "rolling-hill-night", name: "Rolling Hill, Sector 7 · Night", file: "rolling-hill-night.jpg", thumb: "rolling-hill-night.thumb.jpg" },
  { key: "flow-connects-all",  name: "Flow Connects All",              file: "flow-connects-all.jpg",  thumb: "flow-connects-all.thumb.jpg" },
  { key: "toasty-clankers",    name: "Toasty Clankers",                file: "toasty-clankers.jpg",    thumb: "toasty-clankers.thumb.jpg" },
  { key: "cyberrat-corridor",  name: "CyberRat Corridor",              file: "cyberrat-corridor.jpg",  thumb: "cyberrat-corridor.thumb.jpg" },
  { key: "grid-by-night",      name: "GRID by Night",                  file: "grid-by-night.jpg",      thumb: "grid-by-night.thumb.jpg" }
];
