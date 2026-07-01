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
    // light mode: flips text dark and panels light, with a soft pink/cyan hex backdrop (see theme.css html.light)
    { key: "daybreak",   name: "Daybreak",     light: true, accent: "#d23f8c", dim: "#9c2e66", bg: "#eef1f7", bg2: "#ffffff", border: "#c7cfdc", border2: "#a6b4c6", text: "#1e2733", text2: "#4a5a6e", text3: "#74859a", text4: "#a3b2c4" },
    { key: "slimegirl",  name: "Slime Time",   accent: "#4fe6a8", dim: "#1f8f68", bg: "#061611", bg2: "#0c2419", border: "#1f5d44", border2: "#2f8060" },
    { key: "pbandj",     name: "Flavor Wizard",     accent: "#eb9a3e", dim: "#9c5e1e", bg: "#150a1c", bg2: "#221033", border: "#4a2660", border2: "#6b3a86" },
    // Bubblegum Flapjack: gunmetal base (40%), toxic-mint accent (25%), bubblegum-pink
    // chrome/frames (18%), bone-white text (12%), blood-red dim punctuation (5%)
    { key: "bubblegum",  name: "Bubblegum Flapjack", accent: "#7cffb2", dim: "#8a0303", bg: "#18181d", bg2: "#221820", border: "#4e2640", border2: "#85406a", text: "#f2e9e1", text2: "#aea8a2", text3: "#7e7975", text4: "#524f4c" },
    { key: "manarift",   name: "Mana Rift",    accent: "#6f8cff", dim: "#2f3f99", bg: "#080c1c", bg2: "#0e1533", border: "#283a72", border2: "#3a4f96" },
    { key: "merlot",     name: "Merlot",       accent: "#e2506e", dim: "#8a2238", bg: "#16040a", bg2: "#270b13", border: "#5a1f2e", border2: "#7e3042" },
    { key: "evilcurse",  name: "Flowstate",    accent: "#a96ce2", dim: "#5e3a99", bg: "#100a1a", bg2: "#1b1232", border: "#3f2a62", border2: "#573a82" },
    { key: "highheavens",name: "Elysium Heights", accent: "#ead6a0", dim: "#9c8a55", bg: "#100e1a", bg2: "#1c1930", border: "#403a5c", border2: "#5b5480" }
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

  /* ---- selection: per-character when one is loaded, device fallback otherwise ---- */
  function activeCh() { try { return (EN.store && EN.store.active) ? EN.store.active() : null; } catch (e) { return null; } }
  function deviceGet() { try { return localStorage.getItem(KEY) || "grid"; } catch (e) { return "grid"; } }
  function get() { var ch = activeCh(); return (ch && ch.theme) ? ch.theme : deviceGet(); }

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
    var ch = activeCh();
    if (ch && EN.store && EN.store.update) EN.store.update(function (c) { c.theme = k; });
    else { try { localStorage.setItem(KEY, k); } catch (e) {} }
    apply(k);
  }
  // repaint whatever the active character (or the device) currently selects; called every render
  function syncToActive() {
    var ch = activeCh();
    if (ch && Array.isArray(ch.customThemes)) mergeCustom(ch.customThemes);
    var k = get();
    if (k !== _applied) apply(k);
  }
  function init() { apply(get()); }

  // colors for a theme's preview strip, dark to bright
  function ramp(t) { return [t.bg2, t.border, t.border2, t.dim, t.accent]; }

  return {
    THEMES: THEMES, find: find, get: get, set: set, apply: apply, preview: preview, init: init, ramp: ramp,
    allThemes: allThemes, isCustom: isCustom, getCustom: getCustom, saveCustom: saveCustom,
    deleteCustom: deleteCustom, mergeCustom: mergeCustom, bundleFor: bundleFor, syncToActive: syncToActive
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
          el("button.set-sw-mini", { type: "button", title: "Delete this theme", onclick: function (e) { e.stopPropagation(); deleteTheme(t.key); } }, "✕")
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
      el("button.btn.sm.danger", { style: { marginLeft: "auto" }, onclick: function () { deleteTheme(_editing.key); } }, "✕ DELETE")
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
  function deleteTheme(k) {
    if (!confirm("Delete this custom theme? This cannot be undone.")) return;
    var wasSelected = EN.theme.get() === k;
    EN.theme.deleteCustom(k);
    _editing = null;
    if (wasSelected) EN.theme.set("grid");
    else EN.theme.apply(EN.theme.get());
    rebuild();
  }

  // (re)build the tray body. New settings sections get appended here.
  function rebuild() {
    var ov = document.getElementById("set-ov");
    if (!ov) return;
    var body = ov.querySelector(".set-body");
    clear(body);
    body.appendChild(el("div.set-sectitle", { text: "// CHANGE SHEET APPEARANCE" }));
    body.appendChild(el("label.set-label", { text: "Color Theme" }));
    body.appendChild(el("p.set-hint", { text: "Each palette recolors the accent, frames, backgrounds, and text. Saved to this Freelancer and bundled into their .JSON export. Pick #GRID for the default." }));
    body.appendChild(themeSwatches());
    if (_editing) body.appendChild(editorPanel());
    else body.appendChild(el("button.btn.sm.set-newbtn", { onclick: startNew }, "+ NEW CUSTOM THEME"));
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
            el("h3.set-title", { text: "Settings" })
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
