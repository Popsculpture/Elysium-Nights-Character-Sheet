/* ===========================================================================
   ELYSIUM NIGHTS // #GRID OS settings
   A settings tray opened from the gear at the right end of the tab rail.

   First section: Change Sheet Appearance > Color Theme. Each theme is a named
   palette that sets its own accent plus a tinted-dark panel/frame/background
   set, so the whole sheet recolors, not just the accent. The UI stays dark so
   the light text keeps its contrast. More panes can nest under the body as they
   are added; just append another section in rebuild().
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
  var THEMES = [
    { key: "grid",       name: "#GRID",        accent: "#00e5ff", dim: "#0a8aa0", bg: "#07090d", bg2: "#0f141d", border: "#233044", border2: "#34465f" },
    { key: "highheavens",name: "Elysium Nights", accent: "#ead6a0", dim: "#9c8a55", bg: "#100e1a", bg2: "#1c1930", border: "#403a5c", border2: "#5b5480" },
    { key: "slimegirl",  name: "Slime Time",   accent: "#4fe6a8", dim: "#1f8f68", bg: "#061611", bg2: "#0c2419", border: "#1f5d44", border2: "#2f8060" },
    { key: "pbandj",     name: "Flavor Wizard",     accent: "#eb9a3e", dim: "#9c5e1e", bg: "#150a1c", bg2: "#221033", border: "#4a2660", border2: "#6b3a86" },
    // Bubblegum Flapjack: gunmetal base (40%), toxic-mint accent (25%), bubblegum-pink
    // chrome/frames (18%), bone-white text (12%), blood-red dim punctuation (5%)
    { key: "bubblegum",  name: "Bubblegum Flapjack", accent: "#7cffb2", dim: "#8a0303", bg: "#18181d", bg2: "#221820", border: "#4e2640", border2: "#85406a", text: "#f2e9e1", text2: "#aea8a2", text3: "#7e7975", text4: "#524f4c" },
    { key: "manarift",   name: "Mana Rift",    accent: "#6f8cff", dim: "#2f3f99", bg: "#080c1c", bg2: "#0e1533", border: "#283a72", border2: "#3a4f96" },
    { key: "merlot",     name: "Merlot",       accent: "#e2506e", dim: "#8a2238", bg: "#16040a", bg2: "#270b13", border: "#5a1f2e", border2: "#7e3042" },
    { key: "evilcurse",  name: "Flowstate",    accent: "#a96ce2", dim: "#5e3a99", bg: "#100a1a", bg2: "#1b1232", border: "#3f2a62", border2: "#573a82" },
    // light mode: flips text dark and panels light, with a soft pink/cyan hex backdrop (see theme.css html.light)
    { key: "daybreak",   name: "Daybreak",     light: true, accent: "#d23f8c", dim: "#9c2e66", bg: "#eef1f7", bg2: "#ffffff", border: "#c7cfdc", border2: "#a6b4c6", text: "#1e2733", text2: "#4a5a6e", text3: "#74859a", text4: "#a3b2c4" }
  ];

  // managed variables: cleared on "#GRID" to fall back to the original :root values
  var MANAGED = ["--accent", "--accent-dim", "--glow-cyan", "--grid-line",
    "--bg", "--bg1", "--bg2", "--bg3", "--bg4", "--border", "--border2", "--panel", "--panel-solid"];

  function hexRgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function clamp(n) { n = Math.round(n); return n < 0 ? 0 : n > 255 ? 255 : n; }
  function h2(n) { var s = clamp(n).toString(16); return s.length < 2 ? "0" + s : s; }
  function rgba(hex, a) { var c = hexRgb(hex); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
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
  function deviceGet() { try { return localStorage.getItem(KEY) || "grid"; } catch (e) { return "grid"; } }
  function get() {
    if (inAdmin()) return adminGet();
    var ch = activeCh();
    return (ch && ch.theme) ? ch.theme : deviceGet();
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
    if (t.key === "grid") { MANAGED.forEach(function (v) { s.removeProperty(v); }); return; }
    s.setProperty("--accent", t.accent);
    s.setProperty("--accent-dim", t.dim || t.accent);
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
    { key: "droid",   name: "#GRIDroid",   sub: "design pending, author's spec",   cls: "skin-droid" }
  ];
  function findSkin(k) { for (var i = 0; i < SKINS.length; i++) { if (SKINS[i].key === k) return SKINS[i]; } return SKINS[0]; }
  function getSkin() { try { return findSkin(localStorage.getItem(SKIN_KEY) || "classic").key; } catch (e) { return "classic"; } }
  function applySkin(k) {
    var root = document.documentElement;
    SKINS.forEach(function (s) { if (s.cls) root.classList.remove(s.cls); });
    var s = findSkin(k);
    if (s.cls) root.classList.add(s.cls);
  }
  function setSkin(k) {
    try { localStorage.setItem(SKIN_KEY, findSkin(k).key); } catch (e) {}
    applySkin(k);
  }

  /* ---- wallpaper (the '98 desktop) ----
     Device-level like the skin: never on a character, never in an export. Presets come from
     EN.wallpapers (data/wallpapers.js), since file:// cannot list a folder. Customs are the
     user's own files, drawn through a canvas so they come out as a bounded JPEG data URL,
     which is what lets six of them sit in localStorage. theme.css paints --wall behind the
     '98 desktop while html.has-wall is set; every other skin ignores both. */
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
    var p = wallPresets().filter(function (w) { return w.key === key; })[0];
    return p ? "img/wallpapers/" + p.file : null;
  }
  // a stored key that is no longer listed (a removed custom, a preset renamed) reads as none
  function getWall() { var k; try { k = localStorage.getItem(WALL_KEY) || "none"; } catch (e) { k = "none"; } return wallUrl(k) ? k : "none"; }
  function wallOpt(k) { try { return !!WALL_OPTS[k] && localStorage.getItem(WALL_OPTS[k]) === "1"; } catch (e) { return false; } }
  function setWallOpt(k, on) { if (!WALL_OPTS[k]) return; try { localStorage.setItem(WALL_OPTS[k], on ? "1" : "0"); } catch (e) {} applyWall(); }
  function wallDim() { return wallOpt("dim"); }
  function applyWall() {
    var root = document.documentElement, url = wallUrl(getWall());
    var st = document.getElementById("en-wall");
    ["shadow", "glow"].forEach(function (k) { root.classList[url && wallOpt(k) ? "add" : "remove"]("wall-" + k); });
    if (!url) { root.classList.remove("has-wall"); if (st) st.parentNode.removeChild(st); return; }
    if (!st) { st = document.createElement("style"); st.id = "en-wall"; document.head.appendChild(st); }
    // Absolute, because Chrome resolves a relative url() inside a custom property against the
    // stylesheet that USES it (css/theme.css), which would send img/ looking under css/.
    if (url.slice(0, 5) !== "data:") { var a = document.createElement("a"); a.href = url; url = a.href; }
    st.textContent = ":root{ --wall:url(\"" + url + "\"); --wall-dim:" + (wallDim() ? ".45" : "0") + "; }";
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
    allThemes: allThemes, isCustom: isCustom, getCustom: getCustom, saveCustom: saveCustom,
    deleteCustom: deleteCustom, mergeCustom: mergeCustom, bundleFor: bundleFor, syncToActive: syncToActive,
    inAdmin: inAdmin,
    SKINS: SKINS, getSkin: getSkin, setSkin: setSkin,
    wallPresets: wallPresets, wallCustoms: wallCustoms, getWall: getWall, setWall: setWall,
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
    { k: "accent",  label: "Accent",     hint: "buttons, numbers, active tab, glow" },
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
    "  border-bottom:1px solid var(--border); position:sticky; top:0; background:linear-gradient(180deg,var(--bg2),var(--bg1)); }",
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
    ".set-col-row{ display:flex; align-items:center; gap:11px; padding:5px 0; cursor:pointer; }",
    ".set-col-input{ -webkit-appearance:none; -moz-appearance:none; appearance:none; width:40px; height:28px; padding:0;",
    "  border:1px solid var(--border2); border-radius:4px; background:transparent; cursor:pointer; flex:0 0 auto; }",
    ".set-col-input::-webkit-color-swatch-wrapper{ padding:2px; }",
    ".set-col-input::-webkit-color-swatch{ border:none; border-radius:2px; }",
    ".set-col-input::-moz-color-swatch{ border:none; border-radius:2px; }",
    ".set-col-meta{ display:flex; flex-direction:column; flex:1 1 auto; min-width:0; }",
    ".set-col-name{ font-family:var(--disp); font-weight:600; font-size:13px; color:var(--text); letter-spacing:.04em; }",
    ".set-col-hint{ font-size:10.5px; color:var(--text3); }",
    ".set-col-hex{ font-family:var(--mono); font-size:11px; color:var(--text2); flex:0 0 auto; letter-spacing:.04em; }",
    ".set-adv{ margin-top:12px; padding-top:12px; border-top:1px solid var(--border); }",
    ".set-adv-toggle{ display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text2); cursor:pointer; margin-bottom:4px; }",
    ".set-ed-name{ width:100%; margin-bottom:12px; }"
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
    return el("div.set-swatches", null, EN.theme.allThemes().map(function (t) {
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
  function colorRow(slot) {
    var v = normHex(_editing[slot.k]);
    var hex = el("span.set-col-hex", { text: v.toUpperCase() });
    var input = el("input.set-col-input", {
      type: "color", value: v, title: slot.label,
      oninput: function (e) { _editing[slot.k] = e.target.value; hex.textContent = e.target.value.toUpperCase(); EN.theme.preview(_editing); }
    });
    return el("label.set-col-row", null, [
      input,
      el("span.set-col-meta", null, [
        el("span.set-col-name", { text: slot.label }),
        slot.hint ? el("span.set-col-hint", { text: slot.hint }) : null
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
    if (wasSelected) EN.theme.set("grid");
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
      el("div.row", { style: { gap: "0", marginTop: "4px" } }, [
        el("button.btn.sm" + (physical ? "" : ".primary"), {
          style: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
          onclick: function () { cv.setDiceMode("digital"); rebuild(); } }, "\u2b22 DIGITAL DICE"),
        el("button.btn.sm" + (physical ? ".primary" : ""), {
          style: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginLeft: "-1px" },
          onclick: function () { cv.setDiceMode("physical"); rebuild(); } }, "\u2680 PHYSICAL DICE")
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
          onclick: function () { EN.theme.setSkin(s.key); rebuild(); }
        }, s.name);
      })),
      pending
        ? el("p.set-hint", { style: { color: "var(--warn)", marginTop: "8px" }, text: "This skin is wired but not yet styled: it looks like Classic until its design lands." })
        : null
    ];
  }

  /* Wallpaper picker, '98 only: the other skins have no desktop to hang one on. Presets are
     the author's art (data/wallpapers.js); customs come from the user's own files. Returns a
     flat array like skinSection, so rebuild() can run it into the same section. */
  function wallSection() {
    if (EN.theme.getSkin() !== "98") return [];
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
    function card(key, name, thumb, extra) {
      return el("div.set-wall" + (key === "none" ? ".set-wall-none" : "") + (cur === key ? ".on" : ""), {
        title: name, style: thumb ? { backgroundImage: "url(\"" + thumb + "\")" } : null,
        onclick: function () { EN.theme.setWall(key); rebuild(); }
      }, [el("div.set-wall-name", { text: name })].concat(extra || []));
    }
    var cards = [card("none", "None, the dither", null)];
    EN.theme.wallPresets().forEach(function (w) { cards.push(card(w.key, w.name, "img/wallpapers/" + w.thumb)); });
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
      el("p.set-hint", { text: "The desktop behind the windows. Presets are the author's art; add your own from a file, kept on this device only (resized to fit; as many as this device's storage has room for, six at most). Saved on this device." }),
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
        ? "Each palette recolors the accent, frames, backgrounds, and text. Stored on this device, not on any Freelancer, so whoever is loaded on the player side never repaints your table. Pick #GRID for the default."
        : "Each palette recolors the accent, frames, backgrounds, and text. Saved to this Freelancer and bundled into their .JSON export. Pick #GRID for the default." }),
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
  function gearTab() {
    return el("div.os-tab.os-gear", {
      title: "Settings",
      onclick: function () { if (document.getElementById("set-ov")) close(); else open(); }
    }, [el("span", { text: "⚙" })]);
  }

  return { open: open, close: close, gearTab: gearTab };
})();

EN.theme.init();
