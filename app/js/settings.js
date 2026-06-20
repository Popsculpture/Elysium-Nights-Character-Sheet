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
  var KEY = "en_theme_v1";

  // accent = the bright signature color; bg/bg2 = deep + panel surfaces; border/border2
  // = frame colors. Backgrounds are kept dark so light text stays readable. #GRID holds the
  // original values for its swatch but is applied by clearing overrides (see apply()).
  var THEMES = [
    { key: "grid",       name: "#GRID",        accent: "#00e5ff", dim: "#0a8aa0", bg: "#07090d", bg2: "#0f141d", border: "#233044", border2: "#34465f" },
    // light mode: flips text dark and panels light, with a soft pink/cyan hex backdrop (see theme.css html.light)
    { key: "daybreak",   name: "Daybreak",     light: true, accent: "#d23f8c", dim: "#9c2e66", bg: "#eef1f7", bg2: "#ffffff", border: "#c7cfdc", border2: "#a6b4c6", text: "#1e2733", text2: "#4a5a6e", text3: "#74859a", text4: "#a3b2c4" },
    { key: "slimegirl",  name: "Slime Time",   accent: "#4fe6a8", dim: "#1f8f68", bg: "#061611", bg2: "#0c2419", border: "#1f5d44", border2: "#2f8060" },
    { key: "pbandj",     name: "Flavor Wizard",     accent: "#eb9a3e", dim: "#9c5e1e", bg: "#150a1c", bg2: "#221033", border: "#4a2660", border2: "#6b3a86" },
    { key: "chaos",      name: "Elysium Nights", accent: "#d2d046", dim: "#7d7a22", bg: "#141021", bg2: "#1f1a30", border: "#463a55", border2: "#63573f" },
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

  function find(k) { for (var i = 0; i < THEMES.length; i++) { if (THEMES[i].key === k) return THEMES[i]; } return null; }
  function get() { try { return localStorage.getItem(KEY) || "grid"; } catch (e) { return "grid"; } }
  function apply(k) {
    var t = find(k) || THEMES[0], s = document.documentElement.style, root = document.documentElement;
    // light themes flip the text dark and toggle a class so the dark-only chrome rules invert
    if (t.light) {
      root.classList.add("light");
      s.setProperty("--text", t.text || "#1e2733");
      s.setProperty("--text2", t.text2 || "#4a5a6e");
      s.setProperty("--text3", t.text3 || "#74859a");
      s.setProperty("--text4", t.text4 || "#a3b2c4");
    } else {
      root.classList.remove("light");
      ["--text", "--text2", "--text3", "--text4"].forEach(function (v) { s.removeProperty(v); });
    }
    if (t.key === "grid") { MANAGED.forEach(function (v) { s.removeProperty(v); }); return; }
    s.setProperty("--accent", t.accent);
    s.setProperty("--accent-dim", t.dim);
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
  function set(k) { try { localStorage.setItem(KEY, k); } catch (e) {} apply(k); }
  function init() { apply(get()); }

  // colors for a theme's preview strip, dark to bright
  function ramp(t) { return [t.bg2, t.border, t.border2, t.dim, t.accent]; }

  return { THEMES: THEMES, find: find, get: get, set: set, apply: apply, init: init, ramp: ramp };
})();

/* ---- settings tray: the gear tab plus the modal it opens ---- */
EN.settings = (function () {
  var el = EN.ui.el, clear = EN.ui.clear;

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
    ".os-gear{ flex:0 0 auto; border-left:1px solid var(--border); background:var(--bg1); }",
    ".os-gear span{ display:inline-block; font-size:15px; transition:transform .25s; }",
    ".os-gear:hover{ color:var(--accent); }",
    ".os-gear:hover span{ transform:rotate(60deg); }"
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
    return el("div.set-swatches", null, EN.theme.THEMES.map(function (t) {
      return el("button.set-swatch" + (current === t.key ? ".on" : ""), {
        type: "button",
        title: t.name,
        onclick: function () { EN.theme.set(t.key); rebuild(); }
      }, [
        el("div.set-sw-name", { text: t.name }),
        el("div.set-strip", null, EN.theme.ramp(t).map(function (c) {
          return el("span.set-seg", { style: { background: c } });
        }))
      ]);
    }));
  }

  // (re)build the tray body. New settings sections get appended here.
  function rebuild() {
    var ov = document.getElementById("set-ov");
    if (!ov) return;
    var body = ov.querySelector(".set-body");
    clear(body);
    body.appendChild(el("div.set-sectitle", { text: "// CHANGE SHEET APPEARANCE" }));
    body.appendChild(el("label.set-label", { text: "Color Theme" }));
    body.appendChild(el("p.set-hint", { text: "Each palette recolors the accent, frames, and backgrounds. Saved to this device. Pick #GRID to restore the default." }));
    body.appendChild(themeSwatches());
  }

  function open() {
    injectCss();
    if (document.getElementById("set-ov")) return;
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
