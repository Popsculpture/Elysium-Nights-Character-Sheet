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
  { key: "grid-by-night",      name: "GRID by Night",                  file: "grid-by-night.jpg",      thumb: "grid-by-night.thumb.jpg" },

  /* THE TILES. Not photographs: the small repeating patterns a desktop of the era actually wore,
     and the half of this list that made a 1998 screen look like one. Written as inline SVG rather
     than as six more binaries, so they cost the repo nothing and stay crisp at any zoom or DPI.
     `tile` is what tells settings.js to paint one repeated at its own size instead of stretched to
     cover, and `size` is that size in CSS pixels. No `file` and no `thumb`: the art IS the
     thumbnail, and the picker draws it tiled at true size, since a tile is chosen for how it reads
     REPEATED. Each one is authored to meet itself at the edges. */
  { key: "stars-and-magic", name: "Stars and Magic", tile: true, size: 64,
    svg: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2764%27%20height%3D%2764%27%3E%3Crect%20width%3D%2764%27%20height%3D%2764%27%20fill%3D%27%2343158a%27%2F%3E%3Cg%20fill%3D%27%23b98bff%27%3E%3Cpath%20d%3D%27M14%208%20l1.6%204.4%204.4%201.6%20-4.4%201.6%20-1.6%204.4%20-1.6-4.4%20-4.4-1.6%204.4-1.6z%27%2F%3E%3Cpath%20d%3D%27M46%2040%20l1.6%204.4%204.4%201.6%20-4.4%201.6%20-1.6%204.4%20-1.6-4.4%20-4.4-1.6%204.4-1.6z%27%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%27%23ffffff%27%3E%3Crect%20x%3D%2734%27%20y%3D%2716%27%20width%3D%272%27%20height%3D%272%27%2F%3E%3Crect%20x%3D%2756%27%20y%3D%2752%27%20width%3D%272%27%20height%3D%272%27%2F%3E%3Crect%20x%3D%276%27%20y%3D%2746%27%20width%3D%272%27%20height%3D%272%27%2F%3E%3Crect%20x%3D%2724%27%20y%3D%2758%27%20width%3D%272%27%20height%3D%272%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E" },
  { key: "blue-skies", name: "Blue Skies", tile: true, size: 64,
    svg: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2764%27%20height%3D%2764%27%3E%3Crect%20width%3D%2764%27%20height%3D%2764%27%20fill%3D%27%2363c0f0%27%2F%3E%3Cg%20fill%3D%27%23ffffff%27%3E%3Ccircle%20cx%3D%2714%27%20cy%3D%2720%27%20r%3D%275.5%27%2F%3E%3Ccircle%20cx%3D%2721%27%20cy%3D%2717%27%20r%3D%277.5%27%2F%3E%3Ccircle%20cx%3D%2728%27%20cy%3D%2720%27%20r%3D%275%27%2F%3E%3Crect%20x%3D%278.5%27%20y%3D%2720%27%20width%3D%2724.5%27%20height%3D%275%27%2F%3E%3Ccircle%20cx%3D%2745%27%20cy%3D%2749%27%20r%3D%274.5%27%2F%3E%3Ccircle%20cx%3D%2751%27%20cy%3D%2746.5%27%20r%3D%276.5%27%2F%3E%3Ccircle%20cx%3D%2757%27%20cy%3D%2749%27%20r%3D%274%27%2F%3E%3Crect%20x%3D%2740.5%27%20y%3D%2749%27%20width%3D%2720.5%27%20height%3D%274.5%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E" },
  { key: "have-a-nice-day", name: "Have a Nice Day", tile: true, size: 48,
    svg: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2748%27%20height%3D%2748%27%3E%3Crect%20width%3D%2748%27%20height%3D%2748%27%20fill%3D%27%233ef07a%27%2F%3E%3Cg%20transform%3D%27translate%2812%2C12%29%27%3E%3Ccircle%20cx%3D%2712%27%20cy%3D%2712%27%20r%3D%2710%27%20fill%3D%27%23ffe14d%27%20stroke%3D%27%23000000%27%20stroke-width%3D%271.5%27%2F%3E%3Ccircle%20cx%3D%278.5%27%20cy%3D%279.5%27%20r%3D%271.6%27%2F%3E%3Ccircle%20cx%3D%2715.5%27%20cy%3D%279.5%27%20r%3D%271.6%27%2F%3E%3Cpath%20d%3D%27M6.5%2014%20a6%206%200%200%200%2011%200%27%20fill%3D%27none%27%20stroke%3D%27%23000000%27%20stroke-width%3D%271.5%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E" },
  { key: "teal-weave", name: "Teal Weave", tile: true, size: 16,
    svg: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2716%27%20height%3D%2716%27%3E%3Crect%20width%3D%2716%27%20height%3D%2716%27%20fill%3D%27%23008080%27%2F%3E%3Cg%20stroke%3D%27%230a9a9a%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27M0%200%20L16%2016%27%2F%3E%3Cpath%20d%3D%27M16%200%20L0%2016%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E" },
  { key: "blue-rivets", name: "Blue Rivets", tile: true, size: 32,
    svg: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2732%27%20height%3D%2732%27%3E%3Crect%20width%3D%2732%27%20height%3D%2732%27%20fill%3D%27%2341556f%27%2F%3E%3Cpath%20d%3D%27M0%200h32v1.5H0z%20M0%200h1.5v32H0z%27%20fill%3D%27%2366809e%27%2F%3E%3Cpath%20d%3D%27M0%2030.5h32v1.5H0z%20M30.5%200h1.5v32h-1.5z%27%20fill%3D%27%2327364a%27%2F%3E%3Cg%3E%3Ccircle%20cx%3D%276%27%20cy%3D%276%27%20r%3D%272.6%27%20fill%3D%27%237a93b0%27%2F%3E%3Ccircle%20cx%3D%276%27%20cy%3D%276%27%20r%3D%271.2%27%20fill%3D%27%2327364a%27%2F%3E%3Ccircle%20cx%3D%2726%27%20cy%3D%276%27%20r%3D%272.6%27%20fill%3D%27%237a93b0%27%2F%3E%3Ccircle%20cx%3D%2726%27%20cy%3D%276%27%20r%3D%271.2%27%20fill%3D%27%2327364a%27%2F%3E%3Ccircle%20cx%3D%276%27%20cy%3D%2726%27%20r%3D%272.6%27%20fill%3D%27%237a93b0%27%2F%3E%3Ccircle%20cx%3D%276%27%20cy%3D%2726%27%20r%3D%271.2%27%20fill%3D%27%2327364a%27%2F%3E%3Ccircle%20cx%3D%2726%27%20cy%3D%2726%27%20r%3D%272.6%27%20fill%3D%27%237a93b0%27%2F%3E%3Ccircle%20cx%3D%2726%27%20cy%3D%2726%27%20r%3D%271.2%27%20fill%3D%27%2327364a%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E" },
  { key: "neon-grid", name: "Neon Grid", tile: true, size: 32,
    svg: "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2732%27%20height%3D%2732%27%3E%3Crect%20width%3D%2732%27%20height%3D%2732%27%20fill%3D%27%230b0b16%27%2F%3E%3Cg%20stroke%3D%27%2300e5ff%27%20stroke-width%3D%271%27%20opacity%3D%27.5%27%3E%3Cpath%20d%3D%27M0%20.5h32%27%2F%3E%3Cpath%20d%3D%27M.5%200v32%27%2F%3E%3C%2Fg%3E%3Ccircle%20cx%3D%27.5%27%20cy%3D%27.5%27%20r%3D%271.8%27%20fill%3D%27%23ff2fb0%27%2F%3E%3C%2Fsvg%3E" }
];
