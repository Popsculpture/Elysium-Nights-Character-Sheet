/* ===========================================================================
   ELYSIUM NIGHTS // #GRID OS settings
   A settings tray opened from the gear at the right end of the tab rail.

   First section: Change Sheet Appearance > Color Theme. Each theme is a named
   palette that sets its own accent plus a tinted-dark panel/frame/background
   set, so the whole sheet recolors, not just the accent. Most palettes are dark
   with light text; two are not (Daybreak, and #GRIDOS '98, which is the actual
   Windows scheme in black on grey), and applyVars flags those with pal-light and
   face-light so the fixed inks can be re-tuned. More panes can nest under the
   body as they are added; just append another section in rebuild().
   =========================================================================== */
window.EN = window.EN || {};

/* ---- theme engine: each palette sets accent + chrome variables on the document
        root, persisted per device. "#GRID" clears the overrides to restore the
        original neutral look. ---- */
EN.theme = (function () {
  var KEY = "en_theme_v1";                 // device fallback selection (used before any character is active)
  var CUSTOM_KEY = "en_custom_themes_v1";  // device library of user-authored palettes, shown in the picker
  var _applied = null;                     // theme key currently painted on the document (lets syncToActive skip no-ops)

  // accent = the bright signature color; bg/bg2 = deep + panel surfaces; border/border2
  // = frame colors. Backgrounds are kept dark so light text stays readable. #GRID holds the
  // original values for its swatch but is applied by clearing overrides (see apply()).
  //
  // ORDER IS THE PICKER'S ORDER, and Elysium Nights leads it because it is the default: the
  // game's own palette should be the one you land on and the first one you see. #GRID follows
  // as the neutral it always was. Nothing keys off the position except the picker and apply()'s
  // unknown-key fallback to THEMES[0], which now lands on the default rather than beside it.
  var THEMES = [
    { key: "highheavens",name: "Elysium Nights", accent: "#ead6a0", dim: "#9c8a55", bg: "#100e1a", bg2: "#1c1930", border: "#403a5c", border2: "#5b5480" },
    { key: "grid",       name: "#GRID",        accent: "#00e5ff", dim: "#0a8aa0", bg: "#07090d", bg2: "#0f141d", border: "#233044", border2: "#34465f" },
    /* Promoted from the author's own custom palette on 2026-09-08, and the reason the #GRIDOS '98
       skin now seeds a palette at all: it is not a mood, it is the actual Windows 98 scheme, so
       the skin looks wrong in anything else until you have chosen otherwise. #bdbdbd is the button
       face, #000582 the active title bar, #747474 the desktop, and every text slot is black
       because that is what Windows drew inside a window.

       The two accent slots traded places on 2026-09-08, when the '98 title bar moved from
       --accent-dim to --accent. The navy is the title bar, so the navy is the accent now; the
       #d9d9d9 face grey it displaces is the 3D highlight, which is what --accent-dim was always
       going to be on a Windows scheme. Nothing about the palette's colours changed, only which
       slot each sits in, and the title bars are pixel-identical before and after: the whole
       visible difference is that everything drawn in --accent went from invisible light grey on
       light grey to navy. */
    { key: "gridos98",   name: "#GRIDOS '98",  accent: "#000582", dim: "#d9d9d9", bg: "#747474", bg2: "#bdbdbd", border: "#777879", border2: "#e7e7e7", text: "#000000", text2: "#000000", text3: "#000000", text4: "#000000" },
    { key: "slimegirl",  name: "Slime Time",   accent: "#4fe6a8", dim: "#1f8f68", bg: "#061611", bg2: "#0c2419", border: "#1f5d44", border2: "#2f8060" },
    { key: "pbandj",     name: "Flavor Wizard",     accent: "#eb9a3e", dim: "#9c5e1e", bg: "#150a1c", bg2: "#221033", border: "#4a2660", border2: "#6b3a86" },
    /* Pastel Smasher, promoted from the author's own custom palette on 2026-09-08 and replacing
       Bubblegum Flapjack, which is removed outright. Retuned by him the same day, and the retune
       is two swaps rather than new colours: the grounds trade places so the deepest surface is
       near-black navy with gunmetal PANELS raised on it, which is the reverse of the first cut,
       and the frame colours trade so hot pink draws the lines while highlighter yellow is the
       brighter highlight on top of them. A toxic-mint accent over both.

       The dim slot is bone white rather than a darkened accent, which is unusual enough to say
       out loud: muted chrome here reads LIGHTER than the accent beside it, not darker, so
       anything leaning on --accent-dim to recede will instead step forward on this palette. */
    { key: "pastelsmasher", name: "Pastel Smasher", accent: "#7cffb2", dim: "#f2e9e1", bg: "#0d0d21", bg2: "#18181d", border: "#ff4fa3", border2: "#f3e500", text: "#f2e9e1", text2: "#93a8c0", text3: "#5b7188", text4: "#3a4a5e" },
    { key: "manarift",   name: "Mana Rift",    accent: "#6f8cff", dim: "#2f3f99", bg: "#080c1c", bg2: "#0e1533", border: "#283a72", border2: "#3a4f96" },
    { key: "merlot",     name: "Merlot",       accent: "#e2506e", dim: "#8a2238", bg: "#16040a", bg2: "#270b13", border: "#5a1f2e", border2: "#7e3042" },
    { key: "evilcurse",  name: "Flowstate",    accent: "#a96ce2", dim: "#5e3a99", bg: "#100a1a", bg2: "#1b1232", border: "#3f2a62", border2: "#573a82" },
    // light mode: flips text dark and panels light, with a soft pink/cyan hex backdrop (see theme.css html.light)
    { key: "daybreak",   name: "Daybreak",     light: true, accent: "#d23f8c", dim: "#9c2e66", bg: "#eef1f7", bg2: "#ffffff", border: "#c7cfdc", border2: "#a6b4c6", text: "#1e2733", text2: "#4a5a6e", text3: "#74859a", text4: "#a3b2c4" }
  ];

  // managed variables: cleared on "#GRID" to fall back to the original :root values
  var MANAGED = ["--accent", "--accent-dim", "--accent-hi", "--accent-ink", "--accent-ink-2", "--glow-cyan", "--grid-line",
    "--bg", "--bg1", "--bg2", "--bg3", "--bg4", "--border", "--border2", "--panel", "--panel-solid"];

  function hexRgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function clamp(n) { n = Math.round(n); return n < 0 ? 0 : n > 255 ? 255 : n; }
  function h2(n) { var s = clamp(n).toString(16); return s.length < 2 ? "0" + s : s; }
  function rgba(hex, a) { var c = hexRgb(hex); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  /* Lighten while KEEPING the hue and saturation. A plain mix toward white desaturates, which
     is exactly what a title bar must not do: Windows 98's own active bar runs #000080 to #1084D0,
     a lighter blue, not a paler grey. Used for --accent-hi below. */
  function rgbHsl(hex) {
    var c = hexRgb(hex), r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, sa = 0;
    if (mx !== mn) {
      var d = mx - mn;
      sa = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, sa, l];
  }
  function hslHex(h, sa, l) {
    function hue(p, q, t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var r, g, b;
    if (sa === 0) { r = g = b = l; }
    else {
      var q = l < 0.5 ? l * (1 + sa) : l + sa - l * sa, p = 2 * l - q;
      r = hue(p, q, h + 1 / 3); g = hue(p, q, h); b = hue(p, q, h - 1 / 3);
    }
    return "#" + h2(r * 255) + h2(g * 255) + h2(b * 255);
  }
  /* `by` is a fraction of the HEADROOM left above the colour, not a flat step, so the result is
     ALWAYS lighter than what went in and a title bar can never run backwards. The old flat step
     carried a 0.62 ceiling, which was safe while this was fed the dimmed accent and wrong the
     moment it was fed the accent: four palettes ship an accent already lighter than 0.62, and
     Elysium Nights at 0.77 would have produced a bar running pale gold into darker gold. */
  function lighten(hex, by) {
    var v = rgbHsl(hex);
    return hslHex(v[0], Math.min(1, v[1] * 1.05), v[2] + (1 - v[2]) * by);
  }
  function relLum(hex) {
    var c = hexRgb(hex);
    function ch(x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  }
  function contrast(a, b) {
    var x = relLum(a), y = relLum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  /* The ink that survives ON TOP of the accent. The accent is a fill in two different places, a
     '98 title bar and a primary button, and each used to hardcode its own text: white on the bar
     (safe while the bar was the DIMMED accent) and black on the button (safe while the accent was
     the bright one). Neither holds once one slot has to serve both, so the ink is chosen per
     palette instead, which is also how Windows 98 did it: the Appearance tab set a scheme's title
     bar colour and its font colour as two separate choices. Judged against the accent AND its
     lighter partner, because the bar is a gradient between them and the caption crosses both. */
  function inkFor(a, b) {
    var white = Math.min(contrast("#ffffff", a), contrast("#ffffff", b));
    var black = Math.min(contrast("#000000", a), contrast("#000000", b));
    return black >= white ? "#000000" : "#ffffff";
  }
  function mix(a, b, t) { var A = hexRgb(a), B = hexRgb(b); return "#" + h2(A[0] + (B[0] - A[0]) * t) + h2(A[1] + (B[1] - A[1]) * t) + h2(A[2] + (B[2] - A[2]) * t); }

  /* ---- custom-theme library: device-level, editable, listed in the picker ---- */
  function newKey() { return "custom_" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function isCustom(k) { return /^custom_/.test(k || ""); }
  function readCustom() {
    try { var a = JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]"); return Array.isArray(a) ? a.filter(function (t) { return t && t.key && t.accent; }) : []; }
    catch (e) { return []; }
  }
  function writeCustom(list) { try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)); } catch (e) {} }
  function getCustom() { return readCustom(); }
  function allThemes() { return THEMES.concat(readCustom()); }
  // upsert one palette by key; keeps only known fields; assigns a key when new
  function saveCustom(t) {
    var list = readCustom(), copy = { custom: true };
    ["key", "name", "accent", "dim", "bg", "bg2", "border", "border2", "text", "text2", "text3", "text4"]
      .forEach(function (f) { if (t[f] != null && t[f] !== "") copy[f] = t[f]; });
    if (!copy.key) copy.key = newKey();
    var i = list.map(function (x) { return x.key; }).indexOf(copy.key);
    if (i >= 0) list[i] = copy; else list.push(copy);
    writeCustom(list);
    return copy;
  }
  function deleteCustom(k) { writeCustom(readCustom().filter(function (t) { return t.key !== k; })); }
  // merge palettes carried in on an imported character; keep local copies (add only new keys)
  function mergeCustom(arr) {
    if (!Array.isArray(arr) || !arr.length) return;
    var list = readCustom(), have = {}, changed = false;
    list.forEach(function (t) { have[t.key] = true; });
    arr.forEach(function (t) { if (t && t.key && t.accent && !have[t.key]) { t.custom = true; list.push(t); have[t.key] = true; changed = true; } });
    if (changed) writeCustom(list);
  }
  // the custom palette(s) a character needs to render on another device (for export bundling)
  function bundleFor(ch) {
    if (!ch || !isCustom(ch.theme)) return [];
    var t = find(ch.theme);
    return t ? [t] : [];
  }

  /* A custom palette that has since been PROMOTED to a built-in. Matched on the name, because a
     custom's key is a random per-device id and the built-in cannot know it. Returns the built-in's
     key, so a record still pointing at the old custom paints the permanent one, highlights the
     right swatch, and quietly heals itself the next time the picker is touched.

     Nothing is deleted. The orphan stays in the device library where find() can still resolve it,
     which is what keeps an untouched record working on a device that never ran this migration,
     and means the promotion can be undone without having destroyed anything. */
  function canonKey(k) {
    if (!isCustom(k)) return k;
    var list = readCustom(), c = null, i;
    for (i = 0; i < list.length; i++) { if (list[i].key === k) { c = list[i]; break; } }
    if (!c) return k;
    var n = String(c.name || "").trim().toLowerCase();
    for (i = 0; i < THEMES.length; i++) {
      if (String(THEMES[i].name).trim().toLowerCase() === n) return THEMES[i].key;
    }
    return k;
  }
  /* What the PICKER lists: a custom is hidden when a built-in of the same name exists, so a
     promoted palette appears once rather than twice. find() and allThemes() are left alone on
     purpose; they still resolve the hidden one. */
  function pickerThemes() {
    var taken = {};
    THEMES.forEach(function (t) { taken[String(t.name).trim().toLowerCase()] = 1; });
    return THEMES.concat(readCustom().filter(function (c) {
      return !taken[String(c.name || "").trim().toLowerCase()];
    }));
  }
  function find(k) {
    var all = allThemes();
    for (var i = 0; i < all.length; i++) { if (all[i].key === k) return all[i]; }
    return null;
  }

  /* ---- selection: per-character when one is loaded, device fallback otherwise.
          The Admin desktop is neither: it is not about a character, so its
          selection lives under its own device key and get()/set() branch to it
          FIRST, before either path below can run. That storage location is the
          whole guarantee: bundleFor(ch) below reads ch.theme only and has no
          path to ADMIN_KEY, so an Admin selection can never ride a .json into
          another player's app, the same promise en_gm_mode_v1 used to need a
          comment to make. ---- */
  var ADMIN_KEY = "en_admin_theme_v1";
  function inAdmin() { try { return !!(EN.app && EN.app.portal && EN.app.portal() === "admin"); } catch (e) { return false; } }
  function adminGet() { try { return localStorage.getItem(ADMIN_KEY) || "highheavens"; } catch (e) { return "highheavens"; } }
  function activeCh() { try { return (EN.store && EN.store.active) ? EN.store.active() : null; } catch (e) { return null; } }
  /* The device fallback, used before any character is active and by every character that has
     not chosen a palette; a stored one on the record always wins. Elysium Nights rather than
     #GRID since 2026-09-08, which also brings this into line with Admin, whose own fallback has
     always been Elysium Nights. Note this is ONE default and not one per skin: the tray's own
     copy promises that a palette and a skin are independent axes, "any color theme wears any
     skin", so a default that moved when you changed skin would break that promise. */
  function deviceGet() { try { return localStorage.getItem(KEY) || "highheavens"; } catch (e) { return "highheavens"; } }
  function get() {
    if (inAdmin()) return canonKey(adminGet());
    var ch = activeCh();
    return canonKey((ch && ch.theme) ? ch.theme : deviceGet());
  }

  /* ---- paint the document from a palette object (no persistence) ---- */
  function applyVars(t) {
    var s = document.documentElement.style, root = document.documentElement;
    // light themes flip the text dark and toggle a class so the dark-only chrome rules invert
    if (t.light) root.classList.add("light");
    else root.classList.remove("light");
    // a theme may carry its own text ramp (dark OR light). Light themes that omit it
    // fall back to dark-on-light defaults; dark themes fall back to the stylesheet.
    if (t.text) {
      s.setProperty("--text", t.text);
      s.setProperty("--text2", t.text2 || t.text);
      s.setProperty("--text3", t.text3 || t.text2 || t.text);
      s.setProperty("--text4", t.text4 || t.text3 || t.text2 || t.text);
    } else if (t.light) {
      s.setProperty("--text", "#1e2733");
      s.setProperty("--text2", "#4a5a6e");
      s.setProperty("--text3", "#74859a");
      s.setProperty("--text4", "#a3b2c4");
    } else {
      ["--text", "--text2", "--text3", "--text4"].forEach(function (v) { s.removeProperty(v); });
    }
    /* Is this palette light enough that the app's fixed dark-theme semantics stop reading on it?
       Measured on the PANEL ground, since that is what chips and labels actually sit on. The class
       lets CSS re-tune those colours the same way the '98 paper sub-views already do. */
    var ground = t.bg2 || t.bg;
    root.classList.toggle("pal-light", !!ground && relLum(ground) > 0.45);
    /* A second, narrower question, asked of a different surface: is the FACE of the '98 caption
       buttons too light for the pale glyphs baked into their sprite? The face is --bg3, mixed
       below out of bg2 and border, so a palette can be dark by the test above and still mix a
       light face. Measured rather than guessed; theme.css swaps in the black-glyph copy.
       Computed before the #GRID early return, which clears the managed vars: #GRID then falls
       back to the stylesheet's own --bg3, the same near-black this mix produces for it. */
    var face = mix(t.bg2 || t.bg, t.border || t.bg2 || t.bg, 0.5);
    root.classList.toggle("face-light", contrast("#e9f1fb", face) < 3);
    if (t.key === "grid") { MANAGED.forEach(function (v) { s.removeProperty(v); }); return; }
    s.setProperty("--accent", t.accent);
    s.setProperty("--accent-dim", t.dim || t.accent);
    /* The far end of a '98 title bar, and the ink that goes on it. Derived rather than slots of
       their own: Windows let you pick both title colours and the caption font colour, this app
       has one accent, so the other two are computed from it. */
    var hi = lighten(t.accent, 0.30);
    s.setProperty("--accent-hi", hi);
    var ink = inkFor(t.accent, hi);
    s.setProperty("--accent-ink", ink);
    s.setProperty("--accent-ink-2", ink === "#000000" ? "rgba(0,0,0,.68)" : "rgba(255,255,255,.72)");
    s.setProperty("--glow-cyan", "0 0 18px " + rgba(t.accent, 0.30));
    s.setProperty("--grid-line", rgba(t.accent, 0.05));
    s.setProperty("--bg", t.bg);
    s.setProperty("--bg1", mix(t.bg, t.bg2, 0.5));
    s.setProperty("--bg2", t.bg2);
    s.setProperty("--bg3", mix(t.bg2, t.border, 0.5));
    s.setProperty("--bg4", mix(t.border, t.border2, 0.45));
    s.setProperty("--border", t.border);
    s.setProperty("--border2", t.border2);
    s.setProperty("--panel-solid", t.bg2);
    s.setProperty("--panel", rgba(t.bg2, 0.72));
  }
  // paint a live, unsaved palette (theme-editor preview); does not touch the recorded selection
  function preview(t) { applyVars(t); }
  function apply(k) { applyVars(find(k) || THEMES[0]); _applied = k; }

  /* ---- record a selection. With a character loaded it is a per-character choice
          (stored on the record); with none loaded it sets the device default that
          unthemed characters and the intake screen fall back to. ---- */
  function set(k) {
    // The Admin desktop is not about a character, so its selection can never
    // reach a record and therefore can never ride a .json into another app.
    if (inAdmin()) { try { localStorage.setItem(ADMIN_KEY, k); } catch (e) {} apply(k); return; }
    var ch = activeCh();
    if (ch && EN.store && EN.store.update) EN.store.update(function (c) { c.theme = k; });
    else { try { localStorage.setItem(KEY, k); } catch (e) {} }
    apply(k);
  }
  // repaint whatever the active character (or the device) currently selects; called every render.
  // ch.customThemes only ever exists on an export/import copy (builder.js's
  // bundleFor callers, store.js's import), never on a stored record, so this
  // merge is portal-neutral: the Admin picker already lists every custom
  // palette on the device with no separate path needed for it.
  function syncToActive() {
    var ch = activeCh();
    if (ch && Array.isArray(ch.customThemes)) mergeCustom(ch.customThemes);
    var k = get();
    if (k !== _applied) apply(k);
  }
  function init() { apply(get()); applySkin(getSkin()); applyWall(); }

  /* ---- SKIN: the shape of the interface, independent of the palette --------
     A second axis beside color: type, corners, chrome, effects. Any palette
     wears any skin. DEVICE-LEVEL, on purpose: a palette is the character's
     (it rides in their export), but the skin is the OS this device runs, so
     it is neither per-character nor per-desktop, and never exported.

     Each skin is a root class (html.skin-98, html.skin-droid) that theme.css
     overrides against, the same mechanism as html.light. Classic is the
     absence of any skin class, so it can never be broken by a skin's rules.
     The '98 and Droid rule blocks land when the author's designs do. ---- */
  var SKIN_KEY = "en_skin_v1";
  var SKINS = [
    { key: "classic", name: "Classic",     sub: "the look as shipped",             cls: null },
    { key: "98",      name: "#GRIDOS '98", sub: "bevels, title bars, a taskbar with START", cls: "skin-98" },
    { key: "droid",   name: "#GRIDroid",   sub: "a cyberpunk phone OS: one column at any width, the rail an app list",   cls: "skin-droid" }
  ];
  function findSkin(k) { for (var i = 0; i < SKINS.length; i++) { if (SKINS[i].key === k) return SKINS[i]; } return SKINS[0]; }
  function getSkin() { try { return findSkin(localStorage.getItem(SKIN_KEY) || "classic").key; } catch (e) { return "classic"; } }
  function applySkin(k) {
    var root = document.documentElement;
    SKINS.forEach(function (s) { if (s.cls) root.classList.remove(s.cls); });
    root.classList.remove("rail-open");   // #GRIDroid's unfolded app list; no other skin owns it
    var s = findSkin(k);
    if (s.cls) root.classList.add(s.cls);
    // the wallpaper resolves per skin (a preset is '98-only), so a skin change re-reads it
    applyWall();
  }
  /* A skin may nominate the palette it was designed for, applied the FIRST time that skin is
     chosen on this device and never again. #GRIDOS '98 is not a mood board, it is the Windows
     scheme, so landing on the skin in someone else's neon is the wrong first impression; but a
     palette is a choice, and re-applying it on every visit would be the app arguing with the
     person using it. One flag per skin, so the seed fires once and then gets out of the way.

     It is deliberately NOT in init(): a device that has always run '98 should keep whatever
     palette it is wearing, so this fires only when the skin is actively picked. */
  var SEED_KEY = "en_skin_seeded_v1";
  var SKIN_SEED = { "98": "gridos98" };
  function seedSkinPalette(skin) {
    var want = SKIN_SEED[skin];
    if (!want || !find(want)) return;
    var done;
    try { done = JSON.parse(localStorage.getItem(SEED_KEY) || "{}"); } catch (e) { done = {}; }
    if (!done || typeof done !== "object" || done[skin]) return;
    done[skin] = 1;
    try { localStorage.setItem(SEED_KEY, JSON.stringify(done)); } catch (e) {}
    set(want);   // through set(), so it lands wherever a palette normally lives and is remembered
  }
  function setSkin(k) {
    var key = findSkin(k).key;
    try { localStorage.setItem(SKIN_KEY, key); } catch (e) {}
    seedSkinPalette(key);
    applySkin(key);
  }

  /* ---- wallpaper (the '98 desktop) ----
     Device-level like the skin: never on a character, never in an export. Presets come from
     EN.wallpapers (data/wallpapers.js), since file:// cannot list a folder. Customs are the
     user's own files, drawn through a canvas so they come out as a bounded JPEG data URL,
     which is what lets six of them sit in localStorage. theme.css paints --wall behind the
     '98 and #GRIDroid desktops while html.has-wall is set; Classic ignores both. The presets
     hang on '98 alone (author's ruling 2026-09-05); #GRIDroid gets the dither, the user's own
     files, and the three text toggles. */
  var WALL_KEY = "en_wall_v1", WALL_CUSTOM_KEY = "en_wall_custom_v1";
  // the desktop's three toggles, each its own device key: DIM scrims the wallpaper, SHADOW gives
  // the desktop's text a slim outline and drop shadow, GLOW gives it a soft light halo
  var WALL_OPTS = { dim: "en_wall_dim_v1", shadow: "en_wall_shadow_v1", glow: "en_wall_glow_v1" };
  var WALL_MAX = 6, WALL_EDGE = 1920;
  var WALL_BUDGET = 1800000;   // data-URL characters across every custom: three or four photographs, and room to spare on a 5 MB origin (Firefox, Safari)
  function wallPresets() { return (EN.wallpapers || []).slice(); }
  function wallCustoms() {
    try { var v = JSON.parse(localStorage.getItem(WALL_CUSTOM_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function saveWallCustoms(list) { try { localStorage.setItem(WALL_CUSTOM_KEY, JSON.stringify(list)); return true; } catch (e) { return false; } }
  function wallUrl(key) {
    if (!key || key === "none") return null;
    if (key.slice(0, 7) === "custom:") {
      var c = wallCustoms().filter(function (w) { return "custom:" + w.id === key; })[0];
      return c ? c.data : null;
    }
    // A preset resolves on '98 only. On any other skin a stored preset reads as nothing, so the
    // dither shows there, and the choice itself is left in storage for the next time '98 is up.
    if (getSkin() !== "98") return null;
    var p = wallPresets().filter(function (w) { return w.key === key; })[0];
    if (!p) return null;
    // A TILE carries its art inline as an SVG data URL instead of naming a file, and paints
    // repeated at its own size rather than stretched to cover (see wallTileSize).
    return p.tile ? p.svg : "img/wallpapers/" + p.file;
  }
  /* The repeat size, in CSS pixels, or 0 for a wallpaper that covers. Photographs are one
     picture stretched over the desktop; the pattern tiles are small squares repeated, which
     is the whole of what made a 90s desktop look like one, so the two need different paint
     and theme.css keys that off html.wall-tiled. Customs are always photographs. */
  function wallTileSize(key) {
    if (!key || key === "none" || key.slice(0, 7) === "custom:") return 0;
    var p = wallPresets().filter(function (w) { return w.key === key; })[0];
    return p && p.tile ? (p.size || 64) : 0;
  }
  // a stored key that is no longer listed (a removed custom, a preset renamed) reads as none
  function getWall() { var k; try { k = localStorage.getItem(WALL_KEY) || "none"; } catch (e) { k = "none"; } return wallUrl(k) ? k : "none"; }
  function wallOpt(k) { try { return !!WALL_OPTS[k] && localStorage.getItem(WALL_OPTS[k]) === "1"; } catch (e) { return false; } }
  function setWallOpt(k, on) { if (!WALL_OPTS[k]) return; try { localStorage.setItem(WALL_OPTS[k], on ? "1" : "0"); } catch (e) {} applyWall(); }
  function wallDim() { return wallOpt("dim"); }
  function applyWall() {
    var root = document.documentElement, url = wallUrl(getWall()), tile = wallTileSize(getWall());
    var st = document.getElementById("en-wall");
    ["shadow", "glow"].forEach(function (k) { root.classList[url && wallOpt(k) ? "add" : "remove"]("wall-" + k); });
    root.classList[url && tile ? "add" : "remove"]("wall-tiled");
    if (!url) { root.classList.remove("has-wall"); if (st) st.parentNode.removeChild(st); return; }
    if (!st) { st = document.createElement("style"); st.id = "en-wall"; document.head.appendChild(st); }
    // Absolute, because Chrome resolves a relative url() inside a custom property against the
    // stylesheet that USES it (css/theme.css), which would send img/ looking under css/.
    if (url.slice(0, 5) !== "data:") { var a = document.createElement("a"); a.href = url; url = a.href; }
    st.textContent = ":root{ --wall:url(\"" + url + "\"); --wall-dim:" + (wallDim() ? ".45" : "0") + (tile ? "; --wall-size:" + tile + "px " + tile + "px" : "") + "; }";
    root.classList.add("has-wall");
  }
  function setWall(key) { try { localStorage.setItem(WALL_KEY, wallUrl(key) ? key : "none"); } catch (e) {} applyWall(); }
  function setWallDim(on) { setWallOpt("dim", on); }
  // Room for the records. Customs share this origin's storage with every character on the
  // device, and a wallpaper that merely squeezes in leaves the roster's next save to fail
  // silently. So a custom is refused when the customs would pass their budget, and after the
  // write a probe the size of everything else on the device (doubled, so the records can
  // grow) has to fit as well, or the write is rolled back.
  function wallRecordsSize() {
    var n = 0;
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k !== WALL_CUSTOM_KEY) n += (localStorage.getItem(k) || "").length; } } catch (e) {}
    return n;
  }
  function wallHeadroomOk() {
    var need = Math.max(300000, wallRecordsSize() * 2), probe = new Array(need + 1).join("x");
    try { localStorage.setItem("en_wall_probe", probe); localStorage.removeItem("en_wall_probe"); return true; }
    catch (e) { try { localStorage.removeItem("en_wall_probe"); } catch (e2) {} return false; }
  }
  // done(err) with a sentence for the toast, or done(null) once the new wallpaper is up
  function addWall(file, done) {
    var list = wallCustoms();
    if (list.length >= WALL_MAX) return done("Six custom wallpapers is the limit here. Remove one first.");
    if (!file || !/^image\//.test(file.type)) return done("That file is not an image.");
    var isSvg = /svg/.test(file.type);
    var rd = new FileReader();
    rd.onerror = function () { done("Could not read that file."); };
    rd.onload = function () {
      var img = new Image();
      img.onerror = function () { done("Could not decode that image."); };
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) return done("Could not size that image.");
        // a raster only ever shrinks; a vector is drawn at the full edge, so a viewBox-only SVG
        // (which reports a tiny intrinsic size) does not come out as a blown-up thumbnail
        var k = WALL_EDGE / Math.max(w, h); if (!isSvg) k = Math.min(1, k);
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        var g = c.getContext("2d");
        // JPEG has no alpha, so transparent areas land on the desktop color rather than black
        var bg = ""; try { bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(); } catch (e) {}
        g.fillStyle = bg || "#07090d"; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        var data;
        try { data = c.toDataURL("image/jpeg", 0.82); } catch (e) { return done("Could not encode that image."); }
        var used = list.reduce(function (n, x) { return n + (x.data || "").length; }, 0);
        if (used + data.length > WALL_BUDGET) return done("That wallpaper would crowd out this device's records. Remove a custom wallpaper first.");
        var entry = { id: Date.now().toString(36), name: String(file.name || "Custom").replace(/\.[^.]+$/, "").slice(0, 40), data: data };
        list.push(entry);
        if (!saveWallCustoms(list) || !wallHeadroomOk()) {
          list.pop(); saveWallCustoms(list);
          return done("This device's storage has no room for that wallpaper. Remove a custom wallpaper first.");
        }
        setWall("custom:" + entry.id);
        done(null);
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  function removeWall(id) {
    saveWallCustoms(wallCustoms().filter(function (w) { return w.id !== id; }));
    setWall(getWall());   // re-reads: a removed selection resolves to none
  }

  // colors for a theme's preview strip, dark to bright
  function ramp(t) { return [t.bg2, t.border, t.border2, t.dim, t.accent]; }

  return {
    THEMES: THEMES, find: find, get: get, set: set, apply: apply, preview: preview, init: init, ramp: ramp,
    pickerThemes: pickerThemes,
    allThemes: allThemes, isCustom: isCustom, getCustom: getCustom, saveCustom: saveCustom,
    deleteCustom: deleteCustom, mergeCustom: mergeCustom, bundleFor: bundleFor, syncToActive: syncToActive,
    inAdmin: inAdmin,
    SKINS: SKINS, getSkin: getSkin, setSkin: setSkin,
    wallPresets: wallPresets, wallCustoms: wallCustoms, wallTileSize: wallTileSize, getWall: getWall, setWall: setWall,
    wallDim: wallDim, setWallDim: setWallDim, wallOpt: wallOpt, setWallOpt: setWallOpt,
    addWall: addWall, removeWall: removeWall, wallUrl: wallUrl
  };
})();

/* ---- settings tray: the gear tab plus the modal it opens ---- */
EN.settings = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;

  // theme-editor state: the palette currently being authored/edited, or null when just picking
  var _editing = null;
  // the six core slots exposed as color wheels, with a plain-language note on what each paints
  var SLOTS = [
    { k: "accent",  label: "Accent",     hint: "buttons, numbers, active tab, glow, and the '98 title bars" },
    { k: "dim",     label: "Accent Dim", hint: "muted accent, scrollbar, settings frame" },
    { k: "bg",      label: "Background", hint: "the deepest surface behind everything" },
    { k: "bg2",     label: "Panel",      hint: "cards and raised surfaces" },
    { k: "border",  label: "Border",     hint: "frame lines around panels" },
    { k: "border2", label: "Border 2",   hint: "brighter frame highlights" }
  ];
  var TEXT_SLOTS = [
    { k: "text",  label: "Text",   hint: "primary body copy" },
    { k: "text2", label: "Text 2", hint: "secondary text" },
    { k: "text3", label: "Text 3", hint: "labels and hints" },
    { k: "text4", label: "Text 4", hint: "faintest text" }
  ];
  function normHex(v) {
    if (!v) return "#000000";
    v = String(v).trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(v)) return "#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    return "#000000";
  }

  var CSS = [
    "#set-ov{ position:fixed; inset:0; z-index:100001; display:flex; align-items:center; justify-content:center;",
    "  background:rgba(4,7,11,.72); backdrop-filter:blur(4px); animation:set-in .18s ease both; }",
    "@keyframes set-in{ from{opacity:0} to{opacity:1} }",
    ".set-card{ width:min(94vw,540px); max-height:86vh; overflow:auto; background:linear-gradient(180deg,var(--bg2),var(--bg1));",
    "  border:1px solid var(--accent-dim); border-radius:6px;",
    "  box-shadow:0 0 0 1px rgba(255,255,255,.03), 0 24px 70px rgba(0,0,0,.65), var(--glow-cyan); }",
    ".set-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:18px 20px 12px;",
    // z-index, because a sticky element with none paints in DOM order among the tray's other
    // positioned things, and a chamfered button or a wallpaper card's label lower in the body
    // then rolls OVER the head as the tray scrolls, where it should roll behind it
    "  border-bottom:1px solid var(--border); position:sticky; top:0; z-index:2; background:linear-gradient(180deg,var(--bg2),var(--bg1)); }",
    ".set-kick{ font-family:var(--mono); font-size:10px; letter-spacing:.2em; color:var(--text3); }",
    ".set-title{ font-size:22px; letter-spacing:.06em; color:var(--text); margin-top:2px; }",
    ".set-close{ flex:0 0 auto; background:transparent; border:1px solid var(--border2); color:var(--text2);",
    "  width:30px; height:30px; border-radius:4px; cursor:pointer; font-size:13px; transition:.15s; }",
    ".set-close:hover{ color:var(--accent); border-color:var(--accent); box-shadow:var(--glow-cyan); }",
    ".set-body{ padding:16px 20px 22px; }",
    ".set-sectitle{ font-family:var(--mono); font-size:10px; letter-spacing:.2em; color:var(--accent); margin-bottom:12px; }",
    ".set-label{ display:block; font-family:var(--disp); font-weight:600; font-size:14px; letter-spacing:.08em;",
    "  color:var(--text); text-transform:uppercase; }",
    ".set-hint{ font-size:12px; color:var(--text3); margin:3px 0 14px; line-height:1.45; }",
    ".set-swatches{ display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; }",
    ".set-swatch{ display:flex; flex-direction:column; gap:7px; align-items:stretch; text-align:left; padding:9px 10px;",
    "  background:var(--bg); border:1px solid var(--border2); border-radius:5px; cursor:pointer; transition:.15s; }",
    ".set-swatch:hover{ border-color:var(--text2); }",
    ".set-swatch.on{ border-color:var(--accent); box-shadow:var(--glow-cyan); background:rgba(255,255,255,.02); }",
    ".set-sw-name{ font-family:var(--disp); font-weight:600; font-size:13px; letter-spacing:.04em; color:var(--text);",
    "  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }",
    ".set-swatch.on .set-sw-name{ color:var(--accent); }",
    ".set-strip{ display:flex; height:16px; border-radius:3px; overflow:hidden; border:1px solid rgba(0,0,0,.45); }",
    ".set-seg{ flex:1 1 0; }",
    ".os-gear{ flex:0 0 auto; background:var(--bg1); }",
    ".os-gear span{ display:inline-block; font-size:15px; transition:transform .25s; }",
    ".os-gear:hover{ color:var(--accent); }",
    ".os-gear:hover span{ transform:rotate(60deg); }",
    // custom-theme controls on a swatch
    ".set-sw-actions{ display:flex; gap:6px; margin-top:2px; }",
    ".set-sw-mini{ flex:1 1 auto; font-family:var(--mono); font-size:9px; letter-spacing:.1em; padding:3px 4px;",
    "  background:transparent; border:1px solid var(--border2); color:var(--text3); border-radius:3px; cursor:pointer; transition:.15s; }",
    ".set-sw-mini:hover{ color:var(--accent); border-color:var(--accent); }",
    ".set-walls{ display:grid; grid-template-columns:repeat(auto-fill,minmax(118px,1fr)); gap:8px; }",
    ".set-wall{ position:relative; aspect-ratio:16/9; background:var(--bg1) center/cover no-repeat; border:1px solid var(--border);",
    "  border-radius:var(--r); cursor:pointer; overflow:hidden; transition:border-color .15s; }",
    ".set-wall:hover{ border-color:var(--text2); }",
    ".set-wall.on{ border-color:var(--accent); box-shadow:var(--glow-cyan); }",
    ".set-wall-none{ background-image:repeating-linear-gradient(0deg, transparent 0 1px, rgba(255,255,255,.07) 1px 2px); }",
    ".set-wall-name{ position:absolute; left:0; right:0; bottom:0; padding:3px 6px; font-family:var(--mono); font-size:9px; letter-spacing:.1em;",
    "  text-transform:uppercase; color:#fff; background:rgba(0,0,0,.6); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }",
    ".set-wall.on .set-wall-name{ color:var(--accent); }",
    ".set-wall-add{ border-style:dashed; border-color:var(--border2); background-image:none; }",
    ".set-wall-add .set-wall-name{ position:static; height:100%; background:none; display:flex; align-items:center; justify-content:center; color:var(--text2); }",
    ".set-wall-x{ position:absolute; top:4px; right:4px; }",
    ".set-wall-x .set-sw-mini{ flex:none; background:rgba(0,0,0,.6); }",
    ".set-newbtn{ margin-top:12px; }",
    // theme editor
    ".set-editor{ margin-top:16px; padding:15px 16px; border:1px solid var(--accent-dim); border-radius:6px;",
    "  background:var(--bg1); box-shadow:var(--glow-cyan); }",
    ".set-editor-h{ font-family:var(--mono); font-size:10px; letter-spacing:.2em; color:var(--accent); margin-bottom:12px; }",
    ".set-cols{ display:flex; flex-direction:column; gap:4px; }",
    ".set-col-row{ display:flex; align-items:center; gap:11px; padding:5px 0; }",
    ".set-col-lab{ display:flex; align-items:center; gap:11px; flex:1 1 auto; min-width:0; cursor:pointer; }",
    ".set-col-input{ -webkit-appearance:none; -moz-appearance:none; appearance:none; width:40px; height:28px; padding:0;",
    "  border:1px solid var(--border2); border-radius:4px; background:transparent; cursor:pointer; flex:0 0 auto; }",
    ".set-col-input::-webkit-color-swatch-wrapper{ padding:2px; }",
    ".set-col-input::-webkit-color-swatch{ border:none; border-radius:2px; }",
    ".set-col-input::-moz-color-swatch{ border:none; border-radius:2px; }",
    ".set-col-meta{ display:flex; flex-direction:column; flex:1 1 auto; min-width:0; }",
    ".set-col-name{ font-family:var(--disp); font-weight:600; font-size:13px; color:var(--text); letter-spacing:.04em; }",
    ".set-col-hint{ font-size:10.5px; color:var(--text3); }",
    /* Geometry and type only. Border, ground and corners are deliberately left to whichever
       skin is on, so the field matches every other input around it without being told to. */
    "input.set-col-hex{ flex:0 0 auto; width:82px; padding:4px 7px; font-family:var(--mono); font-size:11px;",
    "  letter-spacing:.04em; text-align:right; text-transform:uppercase; color:var(--text2); }",
    "input.set-col-hex:focus{ color:var(--text); }",
    ".set-adv{ margin-top:12px; padding-top:12px; border-top:1px solid var(--border); }",
    ".set-adv-toggle{ display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text2); cursor:pointer; margin-bottom:4px; }",
    ".set-ed-name{ width:100%; margin-bottom:12px; }",
    /* ---- live preview -------------------------------------------------------
       Sticky, because the whole point is watching it while the wheels below are
       being turned; at the top of a scrolling editor it would leave the screen
       exactly when you started adjusting. pointer-events:none so the mock cannot
       be clicked: everything in it is real app chrome and a stray click on a
       preview button would be baffling. */
    ".set-prev{ position:sticky; top:-2px; z-index:3; margin:0 0 13px; padding:9px 9px 10px;",
    "  border:1px solid var(--border2); background:var(--bg); pointer-events:none; }",
    ".set-prev-cap{ font-family:var(--mono); font-size:9px; letter-spacing:.18em; color:var(--text3); margin-bottom:7px; }",
    ".set-prev .panel{ margin:0; }",
    ".set-prev .panel-b{ padding:9px 10px 10px; }",
    ".set-prev .stat{ flex:1 1 0; min-width:0; padding:5px 6px; }",
    ".set-prev .stat .k{ font-size:8.5px; }",
    ".set-prev .stat .v{ font-size:17px; }",
    ".set-prev .stat .s{ font-size:8.5px; }",
    ".set-prev p{ margin:8px 0 9px; font-size:11px; line-height:1.45; color:var(--text2); }",
    ".set-prev p b{ color:var(--text); font-weight:600; }",
    ".set-prev p i{ color:var(--text3); font-style:normal; }",
  ].join("\n");

  function injectCss() {
    if (document.getElementById("set-css")) return;
    var s = document.createElement("style");
    s.id = "set-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function onKey(e) { if (e.key === "Escape") close(); }

  function themeSwatches() {
    var current = EN.theme.get();
    // swatches are divs (not buttons) so the custom edit/delete controls can nest legally
    return el("div.set-swatches", null, EN.theme.pickerThemes().map(function (t) {
      var kids = [
        el("div.set-sw-name", { text: t.name }),
        el("div.set-strip", null, EN.theme.ramp(t).map(function (c) { return el("span.set-seg", { style: { background: c } }); }))
      ];
      if (EN.theme.isCustom(t.key)) {
        kids.push(el("div.set-sw-actions", null, [
          el("button.set-sw-mini", { type: "button", title: "Edit this theme", onclick: function (e) { e.stopPropagation(); editExisting(t); } }, "✎ EDIT"),
          EN.ui.armButton("swatch:" + t.key, { cls: ".set-sw-mini", label: "✕", armedLabel: "✕?", onArm: rebuild,
            title: "Delete this theme", onConfirm: function () { deleteTheme(t.key); } })
        ]));
      }
      return el("div.set-swatch" + (current === t.key ? ".on" : ""), {
        title: t.name,
        onclick: function () { EN.theme.set(t.key); rebuild(); }
      }, kids);
    }));
  }

  /* ---- theme editor: color-wheel inputs for each slot, live preview, save/delete ---- */
  /* The hex is a FIELD, not a readout, and that is the answer to "make hex the default when I
     click the colour selector". It cannot be answered where it was asked: the picker that opens
     from an <input type="color"> is the browser's own chrome and no page can choose which format
     tab it lands on. What a page CAN do is make the trip unnecessary. The value sits here, selects
     itself on focus, and typing or pasting one drives the swatch and the whole live preview
     without the picker opening at all.

     It sits OUTSIDE the label on purpose. A <label> forwards clicks to its control, so a hex field
     inside one would pop the native picker the instant you clicked into the text to edit it. The
     label now wraps only the swatch and the name, which is also the honest hit area for it. */
  function colorRow(slot) {
    var v = normHex(_editing[slot.k]);
    var hex, input;
    function push(val, typed) {
      _editing[slot.k] = val;
      input.value = val;
      if (!typed) hex.value = val.toUpperCase();   // never rewrite the field under the cursor
      EN.theme.preview(_editing);
    }
    hex = el("input.set-col-hex", {
      type: "text", value: v.toUpperCase(), spellcheck: "false", maxlength: "7",
      title: "Type or paste a hex value",
      onfocus: function (e) { e.target.select(); },
      oninput: function (e) {
        var t = e.target.value.trim().replace(/^#/, "");
        /* 3-digit shorthand is expanded so #f0a works; anything else is left alone WHILE it is
           being typed, because rejecting a half-finished value fights the person typing it. */
        if (/^[0-9a-fA-F]{3}$/.test(t)) t = t[0] + t[0] + t[1] + t[1] + t[2] + t[2];
        if (/^[0-9a-fA-F]{6}$/.test(t)) push("#" + t.toLowerCase(), true);
      },
      onblur: function (e) { e.target.value = normHex(_editing[slot.k]).toUpperCase(); }
    });
    input = el("input.set-col-input", {
      type: "color", value: v, title: slot.label,
      oninput: function (e) { push(e.target.value, false); }
    });
    return el("div.set-col-row", null, [
      el("label.set-col-lab", null, [
        input,
        el("span.set-col-meta", null, [
          el("span.set-col-name", { text: slot.label }),
          slot.hint ? el("span.set-col-hint", { text: slot.hint }) : null
        ])
      ]),
      hex
    ]);
  }
  function textSection() {
    var hasText = !!_editing.text;
    var toggle = el("label.set-adv-toggle", null, [
      el("input", {
        type: "checkbox", checked: hasText,
        onchange: function (e) {
          if (e.target.checked) {
            // seed from the dark-theme defaults so the wheels start somewhere sensible
            _editing.text = _editing.text || "#e9f1fb";
            _editing.text2 = _editing.text2 || "#93a8c0";
            _editing.text3 = _editing.text3 || "#5b7188";
            _editing.text4 = _editing.text4 || "#3a4a5e";
          } else {
            ["text", "text2", "text3", "text4"].forEach(function (f) { delete _editing[f]; });
          }
          EN.theme.preview(_editing); rebuild();
        }
      }),
      document.createTextNode(" Custom text colors (otherwise auto)")
    ]);
    return el("div.set-adv", null, [toggle].concat(hasText ? el("div.set-cols", null, TEXT_SLOTS.map(colorRow)) : []));
  }
  /* ---- the live preview -------------------------------------------------
     The editor already repainted the whole app on every wheel turn, through
     EN.theme.preview, and that was the trouble: the tray is a full-screen
     overlay, so the sheet it was repainting sat behind the form nobody could
     see. Nothing here needs its own colour plumbing for the same reason. The
     mock is built from the app's REAL classes and inherits the in-progress
     palette off the document root like everything else, so it repaints itself
     for free and can never disagree with the thing it is previewing.

     Building it from real classes buys the skins too: .panel, .panel-h, .stat,
     .btn and .chip are already restyled per skin, so ALL THREE get their own
     chrome out of one piece of markup. That last one was first built as a
     drawing of the Windows 98 Display Properties dialog, which is what it was
     asked for, and which looked right and served nothing: the parts on show, an
     inactive window and a message box, belong to a different program, so turning
     a wheel told you what a fake dialog would do rather than what your own
     panels would. Under html.skin-98 this same markup already renders as a Win98
     window, gradient title bar and window buttons and sunken cells and all, so
     the homage survives and every element in it is real. */
  function prevApp() {
    return el("div.panel", null, [
      el("div.panel-h", null, [
        el("h3", { text: "Vitality" }),
        el("span.tag", { text: "SAMPLE" })
      ]),
      el("div.panel-b", null, [
        el("div.row", { style: { gap: "8px" } }, [
          EN.ui.stat("DEF", "12", "Agility"),
          EN.ui.stat("SPD", "8", "spaces")
        ]),
        el("p", null, [
          el("b", { text: "Body text" }),
          document.createTextNode(" on the panel surface, with "),
          el("i", { text: "a quieter second line" }),
          document.createTextNode(" under it.")
        ]),
        el("div.row", { style: { gap: "6px", flexWrap: "wrap" } }, [
          el("span.btn.sm.primary", { text: "PRIMARY" }),
          el("span.btn.sm", { text: "BUTTON" }),
          /* a real <button disabled>, not a span, because :disabled is what styles it. Safe to
             put a live control here since the whole pane is pointer-events:none. It earns its
             place: disabled is the only state showing --text3 against --border, and it is the
             third state Windows 98 own dialog put on show beside Normal and Selected. */
          el("button.btn.sm", { type: "button", disabled: true, text: "DISABLED" }),
          el("span.chip", { text: "CHIP" }),
          el("span.chip.on", { text: "ON" })
        ])
      ])
    ]);
  }
  function previewPane() {
    return el("div.set-prev", null, [
      el("div.set-prev-cap", { text: "LIVE PREVIEW" }),
      prevApp()
    ]);
  }
  function editorPanel() {
    var nameInput = el("input.set-ed-name", {
      type: "text", value: _editing.name || "", placeholder: "Theme name",
      oninput: function (e) { _editing.name = e.target.value; }
    });
    var actions = el("div.row.wrap", { style: { gap: "8px", marginTop: "14px", alignItems: "center" } }, [
      el("button.btn.sm.primary", { onclick: saveEditing }, _editing.isNew ? "✓ SAVE THEME" : "✓ SAVE CHANGES"),
      el("button.btn.sm", { onclick: cancelEditing }, "CANCEL")
    ].concat(_editing.isNew ? [] : [
      el("span", { style: { marginLeft: "auto" } }),
      EN.ui.armButton("theme:" + _editing.key, { label: "✕ DELETE", armedLabel: "SURE?", onArm: rebuild,
        title: "Delete this custom theme", onConfirm: function () { deleteTheme(_editing.key); } })
    ]));
    return el("div.set-editor", null, [
      el("div.set-editor-h", { text: _editing.isNew ? "NEW CUSTOM THEME" : "EDIT THEME" }),
      previewPane(),
      nameInput,
      el("div.set-cols", null, SLOTS.map(colorRow)),
      textSection(),
      actions
    ]);
  }
  function startNew() {
    var base = EN.theme.find(EN.theme.get());
    // #GRID carries no palette fields (it clears overrides); fall back to its :root defaults
    var seed = (base && base.accent) ? base : { accent: "#00e5ff", dim: "#0a8aa0", bg: "#07090d", bg2: "#0f141d", border: "#233044", border2: "#34465f" };
    _editing = {
      key: "", name: "My Theme", isNew: true,
      accent: seed.accent, dim: seed.dim || seed.accent, bg: seed.bg, bg2: seed.bg2, border: seed.border, border2: seed.border2
    };
    EN.theme.preview(_editing);
    rebuild();
  }
  function editExisting(t) {
    _editing = {
      key: t.key, name: t.name, isNew: false,
      accent: t.accent, dim: t.dim || t.accent, bg: t.bg, bg2: t.bg2, border: t.border, border2: t.border2,
      text: t.text, text2: t.text2, text3: t.text3, text4: t.text4
    };
    EN.theme.preview(_editing);
    rebuild();
  }
  function saveEditing() {
    _editing.name = (_editing.name || "").trim() || "Custom Theme";
    var saved = EN.theme.saveCustom(_editing);   // assigns a key when new
    EN.theme.set(saved.key);                       // select it (records on the active Freelancer)
    _editing = null;
    rebuild();
  }
  function cancelEditing() {
    _editing = null;
    EN.theme.apply(EN.theme.get());   // revert the live preview to the recorded selection
    rebuild();
  }
  // no browser dialog here either: both callers arm first, see EN.ui.armButton
  function deleteTheme(k) {
    var wasSelected = EN.theme.get() === k;
    EN.theme.deleteCustom(k);
    _editing = null;
    if (wasSelected) EN.theme.set("highheavens");   /* the default, so deleting the palette you are wearing lands you on it */
    else EN.theme.apply(EN.theme.get());
    rebuild();
  }

  // Freelancer-only: the panel-layout customization toggle, formerly its own
  // ⚙ popover in the Freelancer header. Shown here only while that tab is
  // active, since it edits that tab's own panel arrangement; it takes
  // priority at the top of the tray when it applies (see rebuild()).
  function freelancerLayoutSection() {
    var cv = EN.combatView;
    var em = cv.isLayoutEditMode();
    var kids = [
      el("div.set-sectitle", { text: "// FREELANCER LAYOUT" }),
      el("label.set-label", { text: "Panel Customization" }),
      el("p.set-hint", { text: em
        ? "Drag ⠿ on a panel to rearrange; − / + sets its width (1-6 columns)."
        : "Customization is off; panels are locked and headers slimmed for play." }),
      el("button.btn.sm" + (em ? ".primary" : ""), {
        title: "Show the layout controls on every panel, drag to rearrange, − / + width, attribute view toggle",
        onclick: function () { cv.setLayoutEditMode(!em); EN.app.render(); rebuild(); }
      }, em ? "🔧 CUSTOMIZE LAYOUT: ON" : "🔧 CUSTOMIZE LAYOUT: OFF")
    ];
    if (em) kids.push(el("button.btn.sm", {
      title: "Restore the default panel arrangement and widths", style: { marginTop: "8px" },
      onclick: function () { cv.resetLayout(); EN.app.render(); rebuild(); }
    }, "⊞ RESET LAYOUT"));
    return kids;
  }

  /* The author's wireframe die, for the DIGITAL DICE button. Its CorelDRAW export is an A4
     page, so the drawing sits in the middle of a 21000x29700 canvas and covers about seven
     tenths of its width and half its height; the viewBox here windows the ink instead
     (measured with getBBox: 14883.95 by 14679.89 at 4380.97,6625.75), which is what makes a
     1em button icon draw 1em of die rather than a fraction of one. No coordinate is touched:
     a viewBox is the window, not the drawing.
     The file's <style> block does not survive being inlined, so its five classes are resolved
     onto the elements: fil0/fil1 become a fill, fil2 becomes fill:none, str0/str1 become the
     stroke and its width, and fill-rule rides along (nonzero on the numerals, evenodd on the
     cube, which is the root default). black becomes currentColor so CSS can colour it, and
     .dice-neon does, in the neon green the author asked for. */
  var ICON_DIGITAL_DICE = '<svg viewBox="4380.97 6625.75 14883.95 14679.89" fill="currentColor" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" stroke="currentColor" stroke-width="140.41" stroke-miterlimit="22.9256" d="M16433.38 9115.64l-11310.27 -61.05 1735.46 -1917.14 11493.43 -67.34 -1918.62 2045.53zm2746.01 -2489.89l-12613.39 138.18 -2185.03 2287.08 26.35 12241.46 12287.54 13.17 2570.06 -2310.08 -85.53 -12369.81zm-14197.8 3008.16l11227.88 36.22 69.13 10984.43 -11293.71 13.17 -3.3 -11033.82zm11820.25 10912.04l-26.34 -10971.26 2010.71 -2185.03 46.05 11353.01 -2030.42 1803.28z"/><path fill="currentColor" fill-rule="nonzero" clip-rule="nonzero" d="M13460.68 13764.1l-1663.45 194.34c-41.95,-232.55 -114.38,-397.62 -215.88,-493.82 -102.91,-96.18 -227.98,-144.57 -379.44,-146.54 -270.65,-1.3 -481.64,134.49 -634.38,405.98 -111.1,196.94 -194.29,618.09 -251.02,1263.46 200.81,-201.64 407.54,-350.03 618.75,-445.15 211.21,-96.54 454.95,-142.76 731.21,-141.49 537.11,4.03 989.72,197.84 1357.86,584.23 368.13,384.99 550.33,871.99 545.19,1460.98 -2,396.86 -98.16,757.78 -287.05,1085.57 -190.31,326.38 -452.57,573.24 -785.39,739.15 -334.23,165.92 -750.25,248.17 -1250.9,243.94 -603,-3.67 -1084.58,-108.98 -1447.52,-317.3 -362.94,-206.93 -650.85,-537.68 -865.09,-988.03 -214.26,-451.75 -319.94,-1048.54 -314.25,-1790.39 6.6,-1085.4 240.58,-1880.4 700.56,-2382.18 459.96,-501.77 1095.23,-749.29 1905.79,-743.98 478.2,2.96 857.14,61.16 1134.02,173.2 276.87,113.46 506.35,276.25 688.45,491.19 180.68,214.96 319.6,483.42 412.54,806.84zm-3095.52 2660.51c-2.4,325.34 77.54,581.52 241.25,767.11 162.29,185.61 363.33,278.45 600.34,281.34 220.15,0.18 403.4,-82.17 552.53,-247.06 149.12,-166.3 224.87,-414.93 225.83,-745.88 2.33,-339.37 -72.03,-598.38 -224.46,-777.03 -151.05,-178.66 -340.85,-268.75 -568.04,-270.3 -232.79,-1.51 -428.64,82.32 -587.55,254.28 -157.5,171.96 -238.88,416.4 -239.9,737.54z"/><path fill="none" fill-rule="nonzero" clip-rule="nonzero" stroke="currentColor" stroke-width="30.32" stroke-miterlimit="22.9256" d="M13460.68 13764.1l-1663.45 194.34c-41.95,-232.55 -114.38,-397.62 -215.88,-493.82 -102.91,-96.18 -227.98,-144.57 -379.44,-146.54 -270.65,-1.3 -481.64,134.49 -634.38,405.98 -111.1,196.94 -194.29,618.09 -251.02,1263.46 200.81,-201.64 407.54,-350.03 618.75,-445.15 211.21,-96.54 454.95,-142.76 731.21,-141.49 537.11,4.03 989.72,197.84 1357.86,584.23 368.13,384.99 550.33,871.99 545.19,1460.98 -2,396.86 -98.16,757.78 -287.05,1085.57 -190.31,326.38 -452.57,573.24 -785.39,739.15 -334.23,165.92 -750.25,248.17 -1250.9,243.94 -603,-3.67 -1084.58,-108.98 -1447.52,-317.3 -362.94,-206.93 -650.85,-537.68 -865.09,-988.03 -214.26,-451.75 -319.94,-1048.54 -314.25,-1790.39 6.6,-1085.4 240.58,-1880.4 700.56,-2382.18 459.96,-501.77 1095.23,-749.29 1905.79,-743.98 478.2,2.96 857.14,61.16 1134.02,173.2 276.87,113.46 506.35,276.25 688.45,491.19 180.68,214.96 319.6,483.42 412.54,806.84zm-3095.52 2660.51c-2.4,325.34 77.54,581.52 241.25,767.11 162.29,185.61 363.33,278.45 600.34,281.34 220.15,0.18 403.4,-82.17 552.53,-247.06 149.12,-166.3 224.87,-414.93 225.83,-745.88 2.33,-339.37 -72.03,-598.38 -224.46,-777.03 -151.05,-178.66 -340.85,-268.75 -568.04,-270.3 -232.79,-1.51 -428.64,82.32 -587.55,254.28 -157.5,171.96 -238.88,416.4 -239.9,737.54z"/><path fill="currentColor" fill-rule="nonzero" clip-rule="nonzero" d="M17925.36 14823.18l-850.75 438.39 -2.37 -455.81 844.5 -1638.55 406.57 -209.5 6.39 1226.63 211.51 -108.99 2.23 429.33 -211.51 108.99 1.95 373.56 -406.58 209.51 -1.94 -373.56zm-2.24 -429.33l-3.27 -630.05 -445.99 861.56 449.26 -231.51z"/><path fill="currentColor" fill-rule="nonzero" clip-rule="nonzero" d="M17074.54 15247.97l850.75 -438.39 0.14 27.2 -850.75 438.39 -11.54 -7.69 11.4 -19.51zm0.14 27.2l-11.47 5.91 -0.07 -13.6 11.54 7.69zm9.03 -475.32l2.37 455.81 -22.94 11.82 -2.37 -455.81 2.65 -10.14 20.29 -1.68zm-22.94 11.82l-0.03 -4.95 2.68 -5.19 -2.65 10.14zm864.79 -1640.23l-844.5 1638.55 -17.64 -8.46 844.5 -1638.55 8.75 -9.37 8.89 17.83zm-17.64 -8.46l3.41 -6.62 5.34 -2.75 -8.75 9.37zm415.46 -191.67l-406.57 209.5 -0.14 -27.2 406.57 -209.5 11.54 7.69 -11.4 19.51zm-0.14 -27.2l11.47 -5.91 0.07 13.6 -11.54 -7.69zm-5.01 1246.14l-6.39 -1226.63 22.94 -11.82 6.39 1226.63 -11.4 19.51 -11.54 -7.69zm11.54 7.69l-11.47 5.91 -0.07 -13.6 11.54 7.69zm211.51 -108.99l-211.51 108.99 -0.14 -27.2 211.51 -108.99 11.54 7.69 -11.4 19.51zm-0.14 -27.2l11.47 -5.91 0.07 13.6 -11.54 -7.69zm-9.17 448.84l-2.23 -429.33 22.94 -11.82 2.23 429.33 -11.4 19.51 -11.54 -7.69zm22.94 -11.82l0.07 13.6 -11.47 5.91 11.4 -19.51zm-223.05 101.3l211.51 -108.99 0.14 27.2 -211.51 108.99 -11.54 -7.69 11.4 -19.51zm-11.4 19.51l-0.07 -13.6 11.47 -5.91 -11.4 19.51zm1.95 373.56l-1.95 -373.56 22.94 -11.82 1.95 373.56 -11.4 19.51 -11.54 -7.69zm22.94 -11.82l0.07 13.6 -11.47 5.91 11.4 -19.51zm-418.12 201.82l406.58 -209.51 0.14 27.2 -406.58 209.51 -11.54 -7.69 11.4 -19.51zm0.14 27.2l-11.47 5.91 -0.07 -13.6 11.54 7.69zm9.46 -393.07l1.94 373.56 -22.94 11.82 -1.94 -373.56 11.4 -19.51 11.54 7.69zm-11.54 -7.69l11.47 -5.91 0.07 13.6 -11.54 -7.69zm6.03 -1051.69l3.27 630.05 -22.94 11.82 -3.27 -630.05 2.67 -10.18 20.27 -1.64zm-20.27 1.64l20.08 -38.79 0.19 37.15 -20.27 1.64zm-445.99 861.56l445.99 -861.56 17.6 8.54 -445.99 861.56 -8.73 9.33 -8.87 -17.87zm8.87 17.87l-24.71 12.73 15.84 -30.6 8.87 17.87zm449.26 -231.51l-449.26 231.51 -0.14 -27.2 449.26 -231.51 11.54 7.69 -11.4 19.51zm11.4 -19.51l0.07 13.6 -11.47 5.91 11.4 -19.51z"/><path fill="currentColor" fill-rule="nonzero" clip-rule="nonzero" d="M11578.25 7388.19l1926.43 11.93 -196.84 305.58 -1304.69 -8.07 -202.07 205.52c102.59,-19.3 201.4,-33.8 296.21,-43.18 94.84,-9.38 185.21,-13.97 271.6,-13.43 291.82,1.8 502.41,44.91 630.39,129.32 128.18,84.08 151.85,189.39 70.34,315.92 -57.15,88.72 -158.98,173.64 -304.98,255.05 -146.69,81.43 -319.59,143.06 -519.53,185.25 -199.96,42.17 -434.18,62.27 -702.2,60.61 -192.5,-1.19 -352.22,-10.87 -478.5,-29.01 -126.47,-17.83 -226.76,-44.5 -300.8,-79.05 -74.51,-34.87 -127.3,-73.78 -159.3,-117.4 -32,-43.61 -47.01,-97.74 -45.46,-162.69l847.6 -37.19c-20.29,62.25 -3.9,109.95 48.04,142.76 52.64,32.8 129.39,49.35 230.06,49.98 113.61,0.7 219.78,-18.9 319.25,-58.8 100.15,-39.91 175.68,-99.9 227.27,-179.98 52.81,-81.99 53.99,-142.13 4.4,-180.7 -49.61,-38.58 -136.55,-58.41 -259.67,-59.18 -78.21,-0.48 -160.17,8.01 -244.71,25.82 -62.9,12.8 -138.02,36.13 -224.93,70.33l-661.49 -51.37 733.58 -738.02z"/><path fill="currentColor" fill-rule="nonzero" clip-rule="nonzero" d="M13494.77 7415.5l-1926.43 -11.93 19.82 -30.76 1926.43 11.93 22.74 15.58 -42.56 15.18zm19.82 -30.76l32.65 0.2 -9.91 15.38 -22.74 -15.58zm-239.4 320.76l196.84 -305.58 65.3 0.4 -196.84 305.58 -42.55 15.18 -22.75 -15.58zm65.3 0.4l-9.91 15.38 -32.64 -0.2 42.55 -15.18zm-1327.44 -23.65l1304.69 8.07 -19.8 30.76 -1304.69 -8.07 -20.8 -17.99 40.6 -12.77zm-40.6 12.77l12.73 -12.94 27.87 0.17 -40.6 12.77zm-202.07 205.52l202.07 -205.52 61.4 5.22 -202.07 205.52 -25.79 11.39 -35.61 -16.61zm35.61 16.61l-63.73 11.99 28.12 -28.6 35.61 16.61zm293.36 -72.18l-4.12 30 0 0 -8.65 0.87 -8.68 0.9 -8.71 0.93 -8.72 0.96 -8.8 0.99 -8.74 1.01 -8.8 1.05 -8.87 1.08 -8.86 1.1 -8.82 1.12 -8.9 1.17 -8.98 1.2 -8.99 1.22 -8.96 1.24 -8.96 1.27 -9.02 1.31 -9.08 1.34 -9.07 1.35 -9.09 1.4 -9.16 1.42 -9.14 1.45 -9.17 1.47 -9.18 1.51 -9.21 1.53 -9.28 1.57 -9.26 1.59 -9.29 1.62 -9.34 1.65 -9.33 1.67 -9.39 1.71 -9.38 1.72 -9.41 1.76 -9.82 -28 9.81 -1.84 9.78 -1.8 9.73 -1.77 9.75 -1.75 9.7 -1.71 9.71 -1.7 9.68 -1.65 9.62 -1.63 9.65 -1.61 9.62 -1.57 9.61 -1.55 9.58 -1.51 9.52 -1.48 9.53 -1.46 9.51 -1.43 9.46 -1.4 9.48 -1.37 9.48 -1.35 9.44 -1.3 9.37 -1.28 9.34 -1.24 9.36 -1.23 9.4 -1.2 9.32 -1.16 9.25 -1.12 9.28 -1.11 9.3 -1.07 9.18 -1.03 9.22 -1.02 9.19 -0.97 9.16 -0.96 9.15 -0.91 0 0zm279.44 -13.81l-19.8 30.76 -0.01 0 -7.85 -0.04 -7.87 0 -7.9 0.02 -7.92 0.06 -7.96 0.07 -7.97 0.12 -8.03 0.14 -8.02 0.16 -8 0.19 -8.06 0.24 -8.14 0.25 -8.11 0.28 -8.15 0.31 -8.16 0.34 -8.24 0.37 -8.21 0.39 -8.2 0.42 -8.31 0.46 -8.29 0.48 -8.31 0.51 -8.4 0.54 -8.36 0.56 -8.4 0.59 -8.42 0.62 -8.5 0.66 -8.47 0.67 -8.5 0.71 -8.57 0.73 -8.56 0.76 -8.62 0.79 -8.61 0.81 -8.64 0.84 4.12 -30 9.12 -0.9 9.09 -0.85 9.04 -0.83 9.04 -0.8 8.97 -0.77 9 -0.75 8.97 -0.71 8.9 -0.68 8.92 -0.66 8.9 -0.63 8.88 -0.6 8.8 -0.56 8.83 -0.55 8.79 -0.5 8.73 -0.48 8.8 -0.46 8.73 -0.41 8.66 -0.39 8.68 -0.36 8.65 -0.33 8.63 -0.3 8.56 -0.27 8.58 -0.24 8.6 -0.21 8.54 -0.18 8.47 -0.14 8.49 -0.12 8.46 -0.09 8.44 -0.06 8.42 -0.02 8.39 0 8.37 0.04 -0.01 0zm650.34 133.8l-59.7 21.8 -0.03 -0.02 -11.81 -7.52 -12.27 -7.29 -12.74 -7.04 -13.19 -6.82 -13.66 -6.57 -14.12 -6.34 -14.58 -6.11 -15.04 -5.87 -15.51 -5.64 -15.98 -5.41 -16.44 -5.18 -16.91 -4.94 -17.36 -4.71 -17.85 -4.48 -18.32 -4.25 -18.78 -4.01 -19.28 -3.79 -19.73 -3.55 -20.22 -3.32 -20.69 -3.1 -21.16 -2.85 -21.66 -2.63 -22.12 -2.39 -22.63 -2.16 -23.1 -1.93 -23.58 -1.69 -24.06 -1.46 -24.55 -1.23 -25.05 -0.98 -25.53 -0.76 -26 -0.52 -26.49 -0.28 19.8 -30.76 27.75 0.3 27.28 0.54 26.81 0.8 26.33 1.04 25.89 1.29 25.4 1.54 24.94 1.79 24.46 2.05 23.99 2.28 23.52 2.55 23.04 2.79 22.58 3.05 22.07 3.3 21.6 3.54 21.13 3.81 20.64 4.05 20.16 4.31 19.66 4.57 19.17 4.8 18.68 5.07 18.19 5.32 17.7 5.58 17.18 5.81 16.71 6.08 16.2 6.31 15.7 6.59 15.18 6.82 14.7 7.07 14.19 7.32 13.68 7.58 13.17 7.81 12.67 8.06 -0.03 -0.02zm73.14 327.02l-65.3 -0.4 0 0 7.12 -11.47 6.53 -11.35 5.92 -11.21 5.32 -11.07 4.72 -10.95 4.11 -10.82 3.52 -10.69 2.92 -10.56 2.32 -10.42 1.73 -10.31 1.14 -10.18 0.54 -10.05 -0.05 -9.93 -0.64 -9.8 -1.24 -9.68 -1.82 -9.56 -2.42 -9.43 -3 -9.32 -3.59 -9.19 -4.18 -9.06 -4.78 -8.96 -5.37 -8.84 -5.95 -8.71 -6.55 -8.6 -7.15 -8.48 -7.74 -8.38 -8.32 -8.25 -8.93 -8.14 -9.53 -8.03 -10.12 -7.91 -10.72 -7.8 -11.33 -7.67 59.7 -21.8 12.09 8.21 11.48 8.34 10.84 8.49 10.23 8.61 9.59 8.74 8.96 8.87 8.34 9.02 7.69 9.14 7.07 9.28 6.43 9.41 5.79 9.54 5.16 9.68 4.52 9.8 3.89 9.93 3.24 10.06 2.6 10.19 1.98 10.32 1.32 10.44 0.7 10.56 0.05 10.69 -0.58 10.81 -1.22 10.94 -1.85 11.05 -2.5 11.18 -3.12 11.3 -3.76 11.41 -4.39 11.54 -5.02 11.67 -5.66 11.77 -6.28 11.89 -6.91 12.01 -7.54 12.13 0 0zm-313.58 262.32l-48.1 -14.94 -0.07 0.04 13.23 -7.45 12.96 -7.48 12.72 -7.49 12.44 -7.5 12.18 -7.52 11.95 -7.55 11.69 -7.55 11.41 -7.57 11.17 -7.6 10.92 -7.62 10.65 -7.63 10.4 -7.64 10.15 -7.68 9.9 -7.68 9.63 -7.71 9.39 -7.72 9.12 -7.75 8.89 -7.76 8.61 -7.78 8.37 -7.82 8.12 -7.82 7.86 -7.84 7.61 -7.88 7.35 -7.89 7.1 -7.9 6.84 -7.93 6.61 -7.96 6.34 -7.98 6.09 -7.99 5.83 -8.02 5.58 -8.04 5.34 -8.07 65.3 0.4 -5.64 8.55 -5.92 8.52 -6.19 8.5 -6.45 8.49 -6.74 8.46 -6.99 8.44 -7.26 8.41 -7.54 8.4 -7.81 8.37 -8.07 8.34 -8.34 8.34 -8.62 8.3 -8.87 8.28 -9.15 8.26 -9.41 8.24 -9.68 8.21 -9.95 8.18 -10.21 8.17 -10.48 8.14 -10.73 8.12 -11.02 8.1 -11.27 8.07 -11.54 8.04 -11.79 8.02 -12.07 8.01 -12.33 7.97 -12.57 7.95 -12.86 7.94 -13.12 7.9 -13.36 7.87 -13.64 7.86 -13.89 7.83 -0.07 0.04zm-536.95 191.44l-13.26 -27.32 -0.01 0 18.08 -3.88 17.9 -4 17.78 -4.11 17.59 -4.2 17.43 -4.33 17.28 -4.42 17.12 -4.54 16.96 -4.65 16.8 -4.76 16.68 -4.87 16.49 -4.97 16.31 -5.08 16.19 -5.2 16.06 -5.32 15.89 -5.41 15.72 -5.53 15.6 -5.63 15.42 -5.75 15.29 -5.87 15.15 -5.98 15 -6.08 14.84 -6.2 14.71 -6.32 14.55 -6.41 14.4 -6.55 14.29 -6.66 14.12 -6.77 13.97 -6.88 13.85 -7 13.7 -7.11 13.54 -7.23 13.41 -7.35 48.1 14.94 -14.25 7.81 -14.42 7.69 -14.58 7.57 -14.73 7.46 -14.91 7.34 -15.08 7.23 -15.23 7.1 -15.4 6.99 -15.59 6.89 -15.73 6.74 -15.9 6.64 -16.06 6.52 -16.21 6.4 -16.39 6.29 -16.58 6.17 -16.7 6.05 -16.88 5.93 -17.05 5.81 -17.18 5.68 -17.35 5.58 -17.55 5.46 -17.69 5.33 -17.82 5.21 -18 5.1 -18.16 4.97 -18.32 4.86 -18.48 4.74 -18.63 4.61 -18.79 4.5 -18.92 4.37 -19.1 4.26 -19.26 4.14 -0.01 0zm-718.73 62.33l19.8 -30.76 0.01 0 24.68 0.09 24.46 -0.03 24.25 -0.16 24.06 -0.29 23.86 -0.41 23.62 -0.53 23.43 -0.67 23.23 -0.79 23 -0.91 22.81 -1.04 22.59 -1.16 22.36 -1.29 22.18 -1.41 21.96 -1.54 21.74 -1.66 21.54 -1.79 21.33 -1.9 21.11 -2.04 20.91 -2.15 20.69 -2.28 20.47 -2.4 20.26 -2.53 20.05 -2.65 19.86 -2.78 19.64 -2.89 19.42 -3.02 19.23 -3.14 19 -3.26 18.79 -3.38 18.58 -3.5 18.37 -3.63 18.18 -3.75 13.26 27.32 -19.52 4.03 -19.71 3.89 -19.92 3.76 -20.11 3.62 -20.3 3.48 -20.47 3.34 -20.68 3.22 -20.86 3.07 -21.04 2.94 -21.25 2.81 -21.42 2.67 -21.63 2.54 -21.81 2.4 -21.99 2.27 -22.19 2.14 -22.37 2 -22.54 1.87 -22.76 1.74 -22.94 1.6 -23.1 1.47 -23.32 1.35 -23.51 1.2 -23.67 1.08 -23.88 0.95 -24.05 0.81 -24.25 0.69 -24.44 0.55 -24.62 0.43 -24.8 0.29 -25.01 0.18 -25.2 0.03 -25.38 -0.09 0.01 0zm-486.47 -29.57l35.74 -29.64 0.13 0.02 11.62 1.63 11.82 1.58 12.04 1.54 12.19 1.49 12.42 1.44 12.65 1.4 12.81 1.35 13.02 1.3 13.22 1.25 13.41 1.21 13.61 1.15 13.82 1.11 14.01 1.06 14.21 1.01 14.41 0.97 14.61 0.91 14.82 0.87 15 0.82 15.18 0.77 15.4 0.72 15.61 0.67 15.79 0.63 15.99 0.57 16.19 0.53 16.38 0.48 16.58 0.43 16.78 0.38 16.97 0.33 17.16 0.28 17.37 0.24 17.56 0.18 17.75 0.13 -19.8 30.76 -18.15 -0.15 -17.96 -0.18 -17.77 -0.24 -17.58 -0.28 -17.39 -0.35 -17.2 -0.38 -17.02 -0.45 -16.82 -0.48 -16.63 -0.55 -16.45 -0.59 -16.25 -0.65 -16.05 -0.69 -15.88 -0.74 -15.7 -0.79 -15.5 -0.86 -15.28 -0.89 -15.11 -0.95 -14.93 -0.99 -14.73 -1.05 -14.55 -1.1 -14.36 -1.15 -14.17 -1.21 -13.97 -1.25 -13.78 -1.31 -13.6 -1.36 -13.39 -1.41 -13.19 -1.46 -13.02 -1.5 -12.85 -1.57 -12.62 -1.62 -12.44 -1.66 -12.26 -1.73 0.13 0.02zm-310.49 -81.71l55.12 -24.32 -0.02 -0.01 6.75 3.1 6.88 3.04 7.03 2.99 7.2 2.96 7.36 2.92 7.49 2.87 7.64 2.82 7.8 2.79 7.94 2.73 8.11 2.7 8.25 2.65 8.4 2.59 8.57 2.56 8.69 2.51 8.87 2.47 9.03 2.42 9.16 2.38 9.32 2.32 9.47 2.28 9.63 2.23 9.77 2.19 9.94 2.13 10.1 2.1 10.24 2.04 10.39 2 10.55 1.94 10.71 1.91 10.85 1.84 11.02 1.8 11.17 1.76 11.33 1.7 11.47 1.66 -35.74 29.64 -12.09 -1.74 -11.93 -1.8 -11.77 -1.84 -11.62 -1.9 -11.49 -1.96 -11.31 -2.01 -11.17 -2.06 -11.01 -2.12 -10.86 -2.16 -10.7 -2.22 -10.56 -2.27 -10.41 -2.33 -10.25 -2.37 -10.09 -2.44 -9.94 -2.48 -9.8 -2.54 -9.61 -2.58 -9.49 -2.63 -9.33 -2.69 -9.15 -2.74 -9.02 -2.79 -8.87 -2.85 -8.69 -2.88 -8.56 -2.95 -8.38 -2.99 -8.24 -3.04 -8.09 -3.11 -7.9 -3.14 -7.76 -3.18 -7.63 -3.25 -7.46 -3.3 -7.29 -3.34 -0.02 -0.01zm-164.5 -121.33l65.52 -16.46 0.01 0 2.94 3.93 3.06 3.89 3.19 3.87 3.31 3.86 3.42 3.81 3.54 3.81 3.65 3.77 3.77 3.74 3.9 3.72 4.02 3.69 4.14 3.68 4.25 3.64 4.38 3.62 4.51 3.61 4.61 3.57 4.75 3.56 4.86 3.52 4.99 3.51 5.1 3.48 5.23 3.45 5.36 3.44 5.47 3.41 5.6 3.38 5.74 3.38 5.85 3.35 5.97 3.32 6.08 3.29 6.25 3.28 6.35 3.26 6.46 3.22 6.62 3.22 6.72 3.19 -55.12 24.32 -7.12 -3.37 -6.98 -3.4 -6.86 -3.42 -6.73 -3.46 -6.59 -3.46 -6.5 -3.51 -6.35 -3.54 -6.21 -3.55 -6.08 -3.58 -5.98 -3.6 -5.85 -3.65 -5.7 -3.66 -5.59 -3.69 -5.46 -3.72 -5.33 -3.75 -5.2 -3.78 -5.07 -3.8 -4.95 -3.83 -4.81 -3.85 -4.7 -3.88 -4.57 -3.92 -4.44 -3.94 -4.32 -3.97 -4.18 -4 -4.07 -4.02 -3.93 -4.07 -3.8 -4.07 -3.68 -4.11 -3.55 -4.14 -3.43 -4.17 -3.3 -4.19 -3.18 -4.23 0.01 0zm-6.41 -186.23l-12.58 30.62 40.41 -19.43 -0.1 5.96 0 5.89 0.1 5.82 0.2 5.76 0.28 5.7 0.39 5.64 0.47 5.56 0.57 5.5 0.67 5.44 0.76 5.37 0.86 5.31 0.96 5.24 1.05 5.18 1.14 5.11 1.24 5.04 1.33 4.99 1.44 4.93 1.52 4.86 1.61 4.78 1.71 4.72 1.82 4.68 1.89 4.6 2 4.53 2.09 4.48 2.18 4.41 2.29 4.34 2.36 4.28 2.48 4.22 2.56 4.16 2.65 4.09 2.75 4.03 2.83 3.96 -65.52 16.46 -3.07 -4.28 -2.95 -4.33 -2.85 -4.39 -2.74 -4.46 -2.64 -4.5 -2.54 -4.58 -2.43 -4.64 -2.32 -4.69 -2.23 -4.76 -2.12 -4.83 -2.01 -4.86 -1.92 -4.94 -1.81 -5 -1.71 -5.06 -1.6 -5.12 -1.5 -5.17 -1.41 -5.25 -1.3 -5.3 -1.2 -5.37 -1.09 -5.42 -1 -5.48 -0.9 -5.55 -0.8 -5.61 -0.69 -5.66 -0.61 -5.74 -0.49 -5.78 -0.39 -5.86 -0.3 -5.9 -0.2 -5.98 -0.1 -6.04 0 -6.09 0.1 -6.16 40.41 -19.43zm-40.41 19.43l0.42 -17.68 39.99 -1.75 -40.41 19.43zm875.43 -26l-847.6 37.19 12.58 -30.62 847.6 -37.19 27.47 13.24 -40.05 17.38zm12.58 -30.62l32.25 -1.41 -4.78 14.65 -27.47 -13.24zm71.29 146.98l-59.08 22.18 -0.08 -0.05 -5.2 -3.4 -4.95 -3.49 -4.72 -3.57 -4.5 -3.68 -4.27 -3.76 -4.03 -3.85 -3.8 -3.95 -3.57 -4.03 -3.34 -4.12 -3.1 -4.2 -2.88 -4.3 -2.65 -4.39 -2.4 -4.46 -2.19 -4.54 -1.95 -4.64 -1.73 -4.72 -1.49 -4.8 -1.27 -4.88 -1.04 -4.97 -0.81 -5.04 -0.6 -5.14 -0.36 -5.21 -0.13 -5.3 0.08 -5.38 0.32 -5.45 0.53 -5.53 0.75 -5.63 0.99 -5.7 1.2 -5.78 1.43 -5.86 1.64 -5.94 1.86 -6.02 67.52 -4.14 -1.72 5.56 -1.52 5.48 -1.31 5.38 -1.1 5.3 -0.89 5.2 -0.69 5.11 -0.49 5.03 -0.28 4.93 -0.08 4.84 0.13 4.76 0.32 4.65 0.52 4.58 0.73 4.48 0.92 4.39 1.11 4.3 1.31 4.22 1.51 4.12 1.71 4.04 1.89 3.94 2.08 3.86 2.27 3.77 2.48 3.68 2.66 3.6 2.84 3.52 3.03 3.41 3.22 3.35 3.41 3.25 3.59 3.18 3.78 3.08 3.98 3.01 4.15 2.93 4.34 2.84 -0.08 -0.05zm210.42 45.69l-19.8 30.76 -0.01 0 -10.04 -0.12 -9.95 -0.21 -9.79 -0.32 -9.64 -0.41 -9.57 -0.52 -9.35 -0.63 -9.22 -0.71 -9.14 -0.83 -8.94 -0.93 -8.82 -1.02 -8.69 -1.15 -8.49 -1.23 -8.43 -1.34 -8.2 -1.45 -8.09 -1.54 -7.93 -1.66 -7.75 -1.74 -7.65 -1.87 -7.46 -1.96 -7.29 -2.06 -7.16 -2.16 -6.99 -2.27 -6.84 -2.36 -6.67 -2.47 -6.51 -2.56 -6.36 -2.67 -6.19 -2.77 -6.03 -2.87 -5.86 -2.96 -5.71 -3.06 -5.54 -3.16 -5.39 -3.26 59.08 -22.18 4.63 2.8 4.74 2.7 4.87 2.62 5 2.52 5.11 2.43 5.23 2.33 5.34 2.25 5.49 2.16 5.59 2.07 5.72 1.98 5.83 1.89 5.96 1.8 6.11 1.72 6.22 1.64 6.31 1.53 6.49 1.46 6.59 1.38 6.71 1.28 6.88 1.21 6.95 1.12 7.15 1.03 7.25 0.95 7.38 0.86 7.56 0.79 7.62 0.69 7.84 0.61 7.97 0.53 8.05 0.44 8.26 0.35 8.37 0.28 8.51 0.17 8.7 0.1 -0.01 0zm291.13 -53.63l36.44 20.42 0.12 -0.05 -10.04 3.96 -10.09 3.83 -10.17 3.72 -10.25 3.59 -10.29 3.48 -10.38 3.35 -10.4 3.22 -10.48 3.11 -10.56 2.98 -10.62 2.86 -10.66 2.72 -10.71 2.59 -10.77 2.48 -10.82 2.34 -10.89 2.22 -10.93 2.07 -10.94 1.95 -11.02 1.82 -11.05 1.69 -11.06 1.56 -11.13 1.43 -11.2 1.3 -11.16 1.15 -11.19 1.04 -11.29 0.9 -11.28 0.76 -11.27 0.64 -11.33 0.51 -11.35 0.38 -11.35 0.25 -11.39 0.13 -11.42 -0.01 19.8 -30.76 9.84 0.01 9.77 -0.11 9.75 -0.21 9.65 -0.32 9.57 -0.43 9.57 -0.54 9.46 -0.64 9.35 -0.76 9.39 -0.86 9.32 -0.97 9.2 -1.06 9.19 -1.19 9.18 -1.28 9.09 -1.39 9.06 -1.5 9.04 -1.61 8.97 -1.71 8.93 -1.82 8.9 -1.92 8.89 -2.04 8.87 -2.15 8.82 -2.26 8.8 -2.36 8.76 -2.48 8.76 -2.59 8.78 -2.72 8.7 -2.81 8.71 -2.94 8.69 -3.05 8.67 -3.18 8.69 -3.29 8.64 -3.4 0.12 -0.05zm212.84 -169.97l65.3 0.4 0 0 -5.04 7.66 -5.19 7.55 -5.36 7.44 -5.5 7.33 -5.66 7.22 -5.81 7.1 -5.97 7 -6.12 6.88 -6.29 6.78 -6.43 6.66 -6.61 6.55 -6.75 6.46 -6.95 6.34 -7.09 6.22 -7.25 6.11 -7.42 6 -7.59 5.9 -7.77 5.8 -7.95 5.67 -8.1 5.56 -8.27 5.45 -8.45 5.33 -8.63 5.23 -8.78 5.1 -9 5.01 -9.17 4.88 -9.31 4.75 -9.49 4.64 -9.68 4.53 -9.86 4.4 -10.01 4.28 -10.2 4.16 -36.44 -20.42 8.44 -3.44 8.33 -3.56 8.2 -3.66 8.08 -3.79 7.99 -3.9 7.89 -4.03 7.75 -4.12 7.62 -4.25 7.54 -4.38 7.43 -4.49 7.31 -4.63 7.21 -4.73 7.08 -4.86 6.97 -4.99 6.85 -5.1 6.75 -5.24 6.62 -5.36 6.51 -5.49 6.41 -5.62 6.25 -5.72 6.15 -5.86 6.03 -5.99 5.91 -6.12 5.79 -6.24 5.66 -6.36 5.53 -6.48 5.41 -6.62 5.28 -6.74 5.16 -6.87 5.02 -6.98 4.89 -7.11 4.78 -7.24 0 0zm6.28 -170.26l61.54 -20.48 0 0 4.97 4.07 4.63 4.19 4.31 4.34 3.95 4.45 3.62 4.58 3.29 4.7 2.96 4.85 2.63 4.97 2.28 5.07 1.96 5.2 1.64 5.33 1.3 5.46 0.99 5.56 0.66 5.68 0.34 5.81 0.02 5.93 -0.29 6.04 -0.62 6.16 -0.92 6.28 -1.24 6.4 -1.57 6.52 -1.86 6.63 -2.17 6.76 -2.49 6.87 -2.79 6.99 -3.09 7.11 -3.41 7.24 -3.71 7.35 -4.03 7.47 -4.31 7.58 -4.63 7.72 -4.94 7.83 -65.3 -0.4 4.66 -7.41 4.37 -7.28 4.07 -7.14 3.77 -7.01 3.47 -6.87 3.17 -6.74 2.87 -6.59 2.59 -6.47 2.29 -6.33 1.99 -6.18 1.7 -6.07 1.41 -5.92 1.12 -5.78 0.84 -5.64 0.54 -5.5 0.27 -5.38 -0.02 -5.23 -0.3 -5.11 -0.58 -4.96 -0.85 -4.84 -1.12 -4.7 -1.4 -4.55 -1.68 -4.44 -1.94 -4.31 -2.19 -4.17 -2.48 -4.03 -2.73 -3.92 -3 -3.78 -3.25 -3.67 -3.51 -3.54 -3.77 -3.41 -4.03 -3.29 0 0zm-238.8 -54.04l19.8 -30.76 0.01 0 12.13 0.14 11.9 0.26 11.71 0.37 11.53 0.49 11.3 0.62 11.1 0.73 10.91 0.86 10.69 0.97 10.47 1.1 10.25 1.22 10.06 1.34 9.84 1.46 9.63 1.58 9.39 1.72 9.18 1.82 8.98 1.97 8.73 2.08 8.49 2.19 8.27 2.32 8.06 2.45 7.8 2.56 7.58 2.69 7.36 2.81 7.09 2.94 6.85 3.04 6.61 3.16 6.39 3.28 6.14 3.4 5.89 3.52 5.64 3.63 5.4 3.74 5.16 3.86 -61.54 20.48 -4.36 -3.26 -4.56 -3.16 -4.76 -3.07 -4.93 -2.94 -5.12 -2.84 -5.33 -2.74 -5.51 -2.64 -5.73 -2.54 -5.91 -2.44 -6.08 -2.33 -6.3 -2.23 -6.5 -2.14 -6.68 -2.03 -6.89 -1.92 -7.11 -1.85 -7.31 -1.74 -7.48 -1.63 -7.72 -1.54 -7.93 -1.44 -8.11 -1.34 -8.34 -1.24 -8.56 -1.14 -8.79 -1.04 -8.99 -0.94 -9.21 -0.85 -9.41 -0.74 -9.64 -0.63 -9.88 -0.54 -10.07 -0.43 -10.31 -0.33 -10.54 -0.22 -10.75 -0.12 0.01 0zm-228.73 24.22l-12.16 -27.56 -0.53 0.11 8.4 -1.74 8.4 -1.69 8.39 -1.62 8.32 -1.57 8.36 -1.52 8.41 -1.47 8.3 -1.39 8.31 -1.35 8.32 -1.28 8.25 -1.24 8.35 -1.18 8.27 -1.11 8.21 -1.05 8.18 -1 8.23 -0.96 8.22 -0.88 8.19 -0.84 8.16 -0.77 8.11 -0.71 8.14 -0.67 8.12 -0.6 8.05 -0.54 8.07 -0.5 8.05 -0.43 7.99 -0.37 7.96 -0.32 7.98 -0.27 7.97 -0.2 7.94 -0.15 7.86 -0.09 7.85 -0.04 7.86 0.02 -19.8 30.76 -6.82 -0.02 -6.89 0.04 -6.9 0.07 -6.88 0.13 -6.89 0.18 -6.92 0.23 -6.98 0.28 -6.99 0.33 -6.97 0.37 -6.99 0.42 -7.07 0.48 -7.02 0.52 -7.04 0.57 -7.11 0.63 -7.08 0.67 -7.11 0.72 -7.12 0.78 -7.13 0.82 -7.22 0.88 -7.23 0.93 -7.21 0.97 -7.17 1.02 -7.29 1.08 -7.26 1.12 -7.29 1.19 -7.36 1.23 -7.27 1.27 -7.34 1.34 -7.42 1.39 -7.39 1.44 -7.4 1.49 -7.44 1.54 -0.53 0.11zm-245.48 71.74l28.94 -30.38 -32.45 4.88 8.32 -3.25 8.28 -3.21 8.21 -3.13 8.13 -3.07 8.12 -3.03 8.01 -2.94 7.94 -2.89 7.93 -2.83 7.81 -2.75 7.77 -2.71 7.73 -2.65 7.67 -2.59 7.6 -2.51 7.5 -2.45 7.47 -2.4 7.44 -2.34 7.32 -2.26 7.31 -2.23 7.27 -2.15 7.16 -2.09 7.15 -2.04 7.04 -1.96 7 -1.9 6.97 -1.86 6.88 -1.77 6.82 -1.73 6.83 -1.67 6.77 -1.61 6.66 -1.53 6.6 -1.48 6.63 -1.42 6.49 -1.35 12.16 27.56 -5.37 1.11 -5.39 1.16 -5.54 1.24 -5.64 1.29 -5.67 1.35 -5.75 1.41 -5.9 1.49 -5.98 1.55 -6.03 1.6 -6.16 1.68 -6.24 1.74 -6.29 1.78 -6.4 1.87 -6.45 1.91 -6.53 1.99 -6.68 2.06 -6.7 2.12 -6.81 2.18 -6.9 2.25 -6.96 2.31 -7.03 2.37 -7.11 2.43 -7.21 2.51 -7.29 2.57 -7.33 2.63 -7.46 2.71 -7.53 2.76 -7.54 2.81 -7.69 2.91 -7.73 2.95 -7.82 3.03 -7.9 3.09 -32.45 4.88zm32.45 -4.88l-15.71 6.18 -16.74 -1.3 32.45 -4.88zm-665 -76.87l661.49 51.37 -28.94 30.38 -661.49 -51.37 -16.16 -17.87 45.1 -12.51zm-28.94 30.38l-31.49 -2.45 15.33 -15.42 16.16 17.87zm778.68 -750.53l-733.58 738.02 -61.26 -5.36 733.58 -738.02 40.54 -12.7 20.72 18.06zm-61.26 -5.36l12.79 -12.87 27.75 0.17 -40.54 12.7z"/></svg>';

  /* ...and the die you roll in your hand, the author's own drawing again: a d6 in three-quarter
     view with two more dice behind it. Unlike the last two exports this one needs no windowing:
     the ink measures 118.91 x 122.89 inside a 118.91 x 122.88 viewBox, so it already fills its
     box to the pixel and there is nothing for contain to crop. Its <style> block is the same trap
     as before and does not survive being inlined, so .st0 is resolved onto the path as fill-rule
     and clip-rule. It takes currentColor rather than a fixed colour, which is the whole
     difference from the digital die: this one is the button's own text colour, so it flips with
     .primary and cannot lose contrast against the fill the way the neon green did. */
  var ICON_PHYSICAL_DICE = '<svg viewBox="0 0 118.91 122.88" fill="currentColor" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M6.41,23.43l49.53,20.15c1.57,0.64,4.17,1.04,5.74,0.4l52.42-21.41c1.57-0.64-0.02-3.49-1.62-4.05L59.62,0 c-0.4-0.14-10.33,3.48-11.72,3.97L4.79,19.38C3.12,19.97,4.26,22.55,6.41,23.43L6.41,23.43z M116.87,94.34l-51.73,28.06 c-1.49,0.81-3.56,0.69-3.56-1.01l-0.01-66.03c0-1.7,0.14-3.36,1.7-4.03l51.92-22.12c1.56-0.66,3.73-0.07,3.72,1.62l-0.34,59.48 C118.56,92,118.36,93.53,116.87,94.34L116.87,94.34z M104.99,71.09c3.52,1.5,4.55,6.77,2.28,11.78c-2.26,5-6.96,7.84-10.48,6.34 c-3.52-1.5-4.55-6.77-2.28-11.78C96.78,72.43,101.47,69.59,104.99,71.09L104.99,71.09z M86.22,57.28c3.65,1.55,4.7,7.01,2.36,12.19 c-2.34,5.18-7.2,8.12-10.85,6.57c-3.65-1.55-4.7-7.01-2.36-12.19C77.71,58.66,82.57,55.72,86.22,57.28L86.22,57.28z M1.81,93.89 l51.26,27.75c1.49,0.81,3.56,0.69,3.56-1.01l0.01-65.42c0-1.7-0.14-3.36-1.7-4.03L3.72,29.22C2.16,28.55,0,29.15,0,30.85 l0.11,59.02C0.11,91.56,0.32,93.08,1.81,93.89L1.81,93.89z M6.91,75.74c3.21-2.04,7.99,0.29,10.66,5.2s2.24,10.56-0.97,12.6 c-3.21,2.04-7.99-0.29-10.66-5.2C3.27,83.42,3.7,77.78,6.91,75.74L6.91,75.74z M22.06,64.37c3.4-2.06,8.45,0.29,11.28,5.26 c2.83,4.97,2.38,10.67-1.02,12.73c-3.4,2.06-8.45-0.29-11.28-5.26C18.2,72.14,18.66,66.44,22.06,64.37L22.06,64.37z M38.12,52.37 c3.42-2.07,8.51,0.29,11.36,5.26c2.85,4.97,2.39,10.68-1.03,12.74c-3.42,2.07-8.51-0.29-11.36-5.26 C34.24,60.14,34.7,54.44,38.12,52.37L38.12,52.37z M59.16,15.48c6.04,0,10.93,2.34,10.93,5.22c0,2.88-4.89,5.22-10.93,5.22 c-6.03,0-10.93-2.34-10.93-5.22C48.23,17.82,53.13,15.48,59.16,15.48L59.16,15.48z"/></svg>';

  // Freelancer-only: how dice get rolled. Digital lets the sheet roll and makes
  // HIT and DMG pressable; Physical assumes real dice at the table, so those go
  // back to plain numbers and only the things that SPEND something keep a
  // button, since the app is still tracking the magazine.
  function diceSection() {
    var cv = EN.combatView;
    var physical = cv.diceMode() === "physical";
    return [
      el("div.set-sectitle", { text: "// DICE" }),
      el("label.set-label", { text: "How You Roll" }),
      el("p.set-hint", { text: physical
        ? "Physical: you roll at the table. HIT and DMG are plain numbers to read off, and a weapon that spends ammo keeps a FIRE button so the sheet still tracks the magazine."
        : "Digital: the sheet rolls for you. HIT and DMG are pressable and open the roll trays." }),
      // stretch, not the .row default of centre: both buttons carry an SVG now, but they are
      // different drawings at the same 14px, and stretch is what keeps the pair reading as one
      // bar whatever either one's content box measures
      el("div.row", { style: { gap: "0", marginTop: "4px", alignItems: "stretch" } }, [
        el("button.btn.sm" + (physical ? "" : ".primary"), {
          style: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
          onclick: function () { cv.setDiceMode("digital"); rebuild(); } }, 
          [el("span.dice-neon", { html: ICON_DIGITAL_DICE }), document.createTextNode(" DIGITAL DICE")]),
        el("button.btn.sm" + (physical ? ".primary" : ""), {
          style: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginLeft: "-1px" },
          onclick: function () { cv.setDiceMode("physical"); rebuild(); } },
          [el("span.dice-real", { html: ICON_PHYSICAL_DICE }), document.createTextNode(" PHYSICAL DICE")])
      ])
    ];
  }

  // Flow-only: the Immersive toggle + intensity for the animated Flow tab.
  // Shown here only while the Flow tab is active; takes priority at the top.
  function flowSection() {
    var fv = EN.flowView;
    var imm = fv.isImmersive();
    var intensity = fv.getIntensity();
    var kids = [
      el("div.set-sectitle", { text: "// FLOW" }),
      el("label.set-label", { text: "Immersive Flow" }),
      el("p.set-hint", { text: imm
        ? "The Flow tab reveals a live metaphysical layer that reacts to your Strain. Reduced-motion is respected automatically."
        : "Turn on a live, animated Flow tab: the occult bleeding through the interface, escalating with Strain." }),
      el("button.btn.sm" + (imm ? ".primary" : ""), {
        title: "Enable the animated Flow tab", onclick: function () { fv.setImmersive(!imm); EN.app.render(); rebuild(); }
      }, imm ? "◇ IMMERSIVE: ON" : "◇ IMMERSIVE: OFF")
    ];
    if (imm) {
      kids.push(el("label.set-label", { style: { marginTop: "14px" }, text: "Intensity" }));
      kids.push(el("p.set-hint", { text: "Auto follows your current Strain. Pick 1-5 to pin the animation to that level." }));
      kids.push(el("div.row.wrap", { style: { gap: "6px" } },
        [{ k: "auto", label: "Auto" }, { k: "1", label: "1" }, { k: "2", label: "2" }, { k: "3", label: "3" }, { k: "4", label: "4" }, { k: "5", label: "5" }].map(function (o) {
          var on = String(intensity) === o.k;
          return el("button.btn.sm" + (on ? ".primary" : ""), { onclick: function () { fv.setIntensity(o.k); EN.app.render(); rebuild(); } }, o.label);
        })));
    }
    return kids;
  }

  /* WORKSPACE. Device state, not character state: which desktop you are on.
     Storage lives entirely in app.js's en_portal_v1, so this section only
     ever calls EN.app's exported functions rather than touching a key of its
     own. This is now the ONLY route between desktops (the top bar carries no
     switcher), so unlike the GM-tab toggle it replaces, it is never gated off
     when the GM modules are present: hiding it would strand a GM with no way
     back to Freelancer, or a player with no way to reach Admin. */
  function portalSection() {
    var admin = EN.app.portal() === "admin";
    var kids = [
      el("div.set-sectitle", { text: "// WORKSPACE" }),
      el("label.set-label", { text: "Current desktop" }),
      el("p.set-hint", { text: "Two desktops share one node. Freelancer is a player's own sheet; Admin is the table you run. Switching repaints the app and swaps the tab rail." })
    ];
    if (!EN.app.hasAdmin()) {
      kids.push(el("p.set-hint", { style: { color: "var(--text3)" }, text: "The GM toolkit is not installed on this device, so only the Freelancer desktop is available." }));
      return kids;
    }
    /* The bare desktop buttons only exist for a build with gate.js deleted,
       where nothing else could cross. With the gate present, Switch user is
       the one control: it flips straight to the other profile when that one
       is already unlocked, and to its login card when it is not. */
    if (!(EN.gate && EN.gate.switchUser)) {
      kids.push(el("div.row.wrap", { style: { gap: "8px" } }, [
        el("button.btn.sm" + (!admin ? ".primary" : ""), {
          title: "Switch to the Freelancer desktop", onclick: function () { EN.app.setPortal("freelancer"); rebuild(); }
        }, "✦ FREELANCER"),
        el("button.btn.sm" + (admin ? ".primary" : ""), {
          title: "Switch to the Admin desktop", onclick: function () { EN.app.setPortal("admin"); rebuild(); }
        }, "◆ ADMIN")
      ]));
      return kids;
    }
    kids.push(el("div.row.wrap", { style: { gap: "8px" } }, [
      el("button.btn.sm", {
        title: admin ? "Switch to the Freelancer profile" : "Switch to the Admin profile",
        onclick: function () { close(); EN.gate.switchUser(EN.app.setPortal); }
      }, "⇄ SWITCH USER"),
      /* Forgets BOTH profiles' unlocks and returns to this profile's login
         card, so the gate asks again on every side and on the next reload.
         Useful for handing the device over, and for testing the login screens
         (so is ?login). */
      el("button.btn.sm", {
        title: "Lock both profiles and return to the login",
        onclick: function () { close(); EN.gate.signOut(EN.app.setPortal); }
      }, "⊘ SIGN OUT")
    ]));
    return kids;
  }

  function gridSection() {
    var gv = EN.gridView;
    var on = gv.isDamage();
    var intensity = gv.getDmgIntensity();
    var kids = [
      el("div.set-sectitle", { text: "// #GRID" }),
      el("label.set-label", { text: "Battle Damage" }),
      el("p.set-hint", { text: on
        ? "The #GRID tab physically degrades as your rig's System Integrity drops: pulsing glow, jittering chips, glitching buttons and letters, TV static in the last quarter, and a dead black-and-white screen when bricked. Reduced-motion is respected automatically."
        : "Let the #GRID tab take visible battle damage as your rig loses System Integrity, all the way to a bricked screen." }),
      el("button.btn.sm" + (on ? ".primary" : ""), {
        title: "Toggle the #GRID battle-damage layer", onclick: function () { gv.setDamage(!on); EN.app.render(); rebuild(); }
      }, on ? "◈ BATTLE DAMAGE: ON" : "◈ BATTLE DAMAGE: OFF")
    ];
    if (on) {
      kids.push(el("label.set-label", { style: { marginTop: "14px" }, text: "Intensity" }));
      kids.push(el("p.set-hint", { text: "Auto follows your rig's live System Integrity. Pick 1-4 to preview a damage stage (4 is bricked)." }));
      kids.push(el("div.row.wrap", { style: { gap: "6px" } },
        [{ k: "auto", label: "Auto" }, { k: "1", label: "1" }, { k: "2", label: "2" }, { k: "3", label: "3" }, { k: "4", label: "4" }].map(function (o) {
          var sel = String(intensity) === o.k;
          return el("button.btn.sm" + (sel ? ".primary" : ""), { onclick: function () { gv.setDmgIntensity(o.k); EN.app.render(); rebuild(); } }, o.label);
        })));
    }
    return kids;
  }

  /* The skin picker sits above the palettes in the same section: shape first,
     color second. Device-level, so it reads the same on both desktops. */
  function skinSection() {
    var cur = EN.theme.getSkin();
    var pending = EN.theme.SKINS.some(function (s) { return s.key === cur && /pending/.test(s.sub); });
    return [
      el("div.set-sectitle", { text: "// CHANGE SHEET APPEARANCE" }),
      el("label.set-label", { text: "OS Skin" }),
      el("p.set-hint", { text: "The shape of the interface: type, corners, chrome. Independent of the palette below, so any color theme wears any skin. Saved on this device." }),
      el("div.row.wrap", { style: { gap: "6px" } }, EN.theme.SKINS.map(function (s) {
        return el("button.btn.sm" + (s.key === cur ? ".primary" : ""), {
          title: s.sub,
          /* EN.app.render() so a skin change rebuilds the view, matching the layout, Flow and
             #GRID toggles above. setSkin alone only swaps a root class, which was fine while every
             skin difference was CSS; it stopped being fine once EN.ui.panel started placing the
             header controls differently per skin, since a panel built under one skin would keep
             the other's arrangement until something else forced a rebuild. */
          onclick: function () { EN.theme.setSkin(s.key); EN.app.render(); rebuild(); }
        }, s.name);
      })),
      pending
        ? el("p.set-hint", { style: { color: "var(--warn)", marginTop: "8px" }, text: "This skin is wired but not yet styled: it looks like Classic until its design lands." })
        : null
    ];
  }

  /* Wallpaper picker, '98 and #GRIDroid only: Classic has no desktop to hang one on. The presets
     (data/wallpapers.js) are offered on '98 alone; customs come from the user's own files on
     either. Returns a flat array like skinSection, so rebuild() can run it into the same section. */
  function wallSection() {
    var sk = EN.theme.getSkin();
    if (sk !== "98" && sk !== "droid") return [];   // the two skins with a desktop to hang one on
    var cur = EN.theme.getWall();
    function toggle(key, label, title) {
      var on = EN.theme.wallOpt(key);
      return el("button.btn.sm" + (on ? ".primary" : ""), { title: title, onclick: function () { EN.theme.setWallOpt(key, !on); rebuild(); } }, label);
    }
    var picker = el("input", { type: "file", accept: "image/*", style: { display: "none" },
      onchange: function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        EN.theme.addWall(f, function (err) { if (err) EN.ui.toast(err); rebuild(); });
      } });
    /* tile: the repeat size in pixels, for the pattern presets. Their card shows the pattern
       tiled at true size rather than one square blown up to fill the thumbnail, since a tile
       is chosen for how it reads REPEATED and a magnified single cell tells you nothing. */
    function card(key, name, thumb, extra, tile) {
      var st = thumb ? { backgroundImage: "url(" + JSON.stringify(thumb) + ")" } : null;
      if (st && tile) { st.backgroundSize = tile + "px " + tile + "px"; st.backgroundRepeat = "repeat"; }
      return el("div.set-wall" + (key === "none" ? ".set-wall-none" : "") + (cur === key ? ".on" : ""), {
        title: name, style: st,
        onclick: function () { EN.theme.setWall(key); rebuild(); }
      }, [el("div.set-wall-name", { text: name })].concat(extra || []));
    }
    var cards = [card("none", "None, the dither", null)];
    if (sk === "98") EN.theme.wallPresets().forEach(function (w) {
      cards.push(w.tile ? card(w.key, w.name, w.svg, null, EN.theme.wallTileSize(w.key))
                        : card(w.key, w.name, "img/wallpapers/" + w.thumb));
    });
    EN.theme.wallCustoms().forEach(function (w) {
      cards.push(card("custom:" + w.id, w.name, w.data, [
        // its own click boundary, so arming the remove never also selects the card
        el("div.set-wall-x", { onclick: function (e) { e.stopPropagation(); } }, [
          EN.ui.armButton("wall:" + w.id, { cls: ".set-sw-mini", label: "✕", armedLabel: "✕?", onArm: rebuild,
            title: "Remove this wallpaper", onConfirm: function () { EN.theme.removeWall(w.id); rebuild(); } })
        ])
      ]));
    });
    cards.push(el("div.set-wall.set-wall-add", { title: "Add a wallpaper from a file on this device", onclick: function () { picker.click(); } },
      [el("div.set-wall-name", { text: "+ From file" })]));
    return [
      el("label.set-label", { style: { marginTop: "14px" }, text: "Wallpaper" }),
      el("p.set-hint", { text: "The desktop behind the windows. Add your own from a file, kept on this device only (resized to fit; as many as this device's storage has room for, six at most). Saved on this device." }),
      el("div.set-walls", null, cards),
      // three independent toggles for reading the desktop over any wallpaper; any mix works
      el("div.row.wrap", { style: { gap: "6px", marginTop: "8px" } }, [
        toggle("dim", "◐ DIM WALLPAPER", "Darken the wallpaper behind the windows"),
        toggle("shadow", "◪ TEXT OUTLINE", "A slim black outline and drop shadow on the desktop's text, for bright wallpapers"),
        toggle("glow", "✦ TEXT GLOW", "A soft glow on the desktop's text, for dark wallpapers")
      ]),
      picker
    ];
  }

  function themeSection() {
    var admin = EN.theme.inAdmin();
    var kids = [
      el("label.set-label", { style: { marginTop: "14px" }, text: admin ? "Admin Theme" : "Color Theme" }),
      el("p.set-hint", { text: admin
        ? "Each palette recolors the accent, frames, backgrounds, and text. Stored on this device, not on any Freelancer, so whoever is loaded on the player side never repaints your table. Pick Elysium Nights for the default."
        : "Each palette recolors the accent, frames, backgrounds, and text. Saved to this Freelancer and bundled into their .JSON export. Pick Elysium Nights for the default." }),
      themeSwatches()
    ];
    kids.push(_editing ? editorPanel() : el("button.btn.sm.set-newbtn", { onclick: startNew }, "+ NEW CUSTOM THEME"));
    return kids;
  }

  // (re)build the tray body. Context-sensitive sections (tied to whichever
  // tab is active) take priority at the top; general settings sit below.
  // New general sections get appended after that split.
  function rebuild() {
    var ov = document.getElementById("set-ov");
    if (!ov) return;
    var body = ov.querySelector(".set-body");
    clear(body);
    var sections = [];
    if (EN.app.activeTab() === "combat" && EN.combatView) sections.push(freelancerLayoutSection());
    if (EN.app.activeTab() === "combat" && EN.combatView && EN.combatView.diceMode) sections.push(diceSection());
    if (EN.app.activeTab() === "flow" && EN.flowView && EN.flowView.isImmersive) sections.push(flowSection());
    if (EN.app.activeTab() === "grid" && EN.gridView && EN.gridView.isDamage) sections.push(gridSection());
    // general sections, shown regardless of which tab settings was opened from
    sections.push(portalSection());
    // skin and palette are one section under one title: skinSection carries
    // the title, themeSection continues it, so the two are pushed as one
    sections.push(skinSection().concat(wallSection(), themeSection()));
    sections.forEach(function (kids, i) {
      kids = kids.filter(function (n) { return n; });
      if (i > 0) Object.assign(kids[0].style, { marginTop: "22px", paddingTop: "18px", borderTop: "1px solid var(--border)" });
      kids.forEach(function (n) { body.appendChild(n); });
    });
  }

  function open() {
    injectCss();
    if (document.getElementById("set-ov")) return;
    // #GRIDroid reaches Settings from its unfolded app list; the tray covers everything, so the
    // list folds now rather than still standing open when the tray closes. Inert elsewhere.
    try { document.documentElement.classList.remove("rail-open"); } catch (e) {}
    _editing = null;   // always open on the picker, never a stale editor
    var ov = el("div#set-ov", {
      onclick: function (e) { if (e.target === ov) close(); }
    }, [
      el("div.set-card", null, [
        el("div.set-head", null, [
          el("div", null, [
            el("div.set-kick", { text: "#GRIDOS // PREFERENCES" }),
            el("h3.set-title", { text: EN.theme.inAdmin() ? "Admin Settings" : "Settings" })
          ]),
          el("button.set-close", { type: "button", title: "Close (Esc)", onclick: close }, "✕")
        ]),
        el("div.set-body")
      ])
    ]);
    document.body.appendChild(ov);
    document.addEventListener("keydown", onKey);
    rebuild();
  }

  function close() {
    // if closed mid-edit, drop the unsaved live preview back to the recorded selection
    if (_editing) { _editing = null; EN.theme.apply(EN.theme.get()); }
    var ov = document.getElementById("set-ov");
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    document.removeEventListener("keydown", onKey);
  }

  // the gear at the right end of the tab rail (toggles the tray)
  // the author's gear, replacing the ⚙ glyph; inline so it takes the tab's own colour on every
  // skin, exactly like the rail's other icons (Codex, Inventory, Chrome, Gray Market)
  var ICON_SETTINGS = '<svg viewBox="0 0 122.88 122.88" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M73.48,15.84A46.87,46.87,0,0,1,84.87,21L91,14.84a7.6,7.6,0,0,1,10.72,0L108,21.15a7.6,7.6,0,0,1,0,10.72l-6.6,6.6a46.6,46.6,0,0,1,4.34,10.93h9.52A7.6,7.6,0,0,1,122.88,57V65.9a7.6,7.6,0,0,1-7.58,7.58h-9.61a46.83,46.83,0,0,1-4.37,10.81L108,91a7.6,7.6,0,0,1,0,10.72L101.73,108A7.61,7.61,0,0,1,91,108l-6.34-6.35a47.22,47.22,0,0,1-11.19,5v8.59a7.6,7.6,0,0,1-7.58,7.58H57a7.6,7.6,0,0,1-7.58-7.58v-7.76a47.39,47.39,0,0,1-12.35-4.68L31.87,108a7.62,7.62,0,0,1-10.72,0l-6.31-6.31a7.61,7.61,0,0,1,0-10.72l4.72-4.72A47.38,47.38,0,0,1,14,73.48H7.58A7.6,7.6,0,0,1,0,65.9V57A7.6,7.6,0,0,1,7.58,49.4h6.35a47.2,47.2,0,0,1,5.51-12.94l-4.6-4.59a7.62,7.62,0,0,1,0-10.72l6.31-6.31a7.6,7.6,0,0,1,10.72,0l5,5A46.6,46.6,0,0,1,49.4,15V7.58A7.6,7.6,0,0,1,57,0H65.9a7.6,7.6,0,0,1,7.58,7.58v8.26ZM59.86,36.68a24.6,24.6,0,1,1-24.6,24.59,24.59,24.59,0,0,1,24.6-24.59Z"/></svg>';
  function gearTab() {
    return el("div.os-tab.os-gear", {
      title: "Settings",
      onclick: function () { if (document.getElementById("set-ov")) close(); else open(); }
    }, [el("span", { html: ICON_SETTINGS })]);
  }

  return { open: open, close: close, gearTab: gearTab };
})();

EN.theme.init();
