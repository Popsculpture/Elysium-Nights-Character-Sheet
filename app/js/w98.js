/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDOS '98, THE DESKTOP (phase 1 of the redesign, 20 Nov 2026, the author's call: "a full and
   complete redesign ... as close to a 1:1 recreation of Windows 98 as you can legally get").

   Under html.skin-98 the app is a desktop: icons on a teal field, a program window for every tab, a taskbar with
   Start, quick launch, a button per open window and a tray with the clock. Classic and #GRIDroid never see any of it:
   every rule is in css/w98.css under html.skin-98, and every entry point here returns at once on another skin.

   HOW THE WINDOWS WORK. The app draws ONE view at a time into #view (js/app.js render()). The program you are in
   (the open tab) is the LIVE window: #view itself is moved into that window's client area, so everything in it works
   as it always did. A window behind it keeps the last frame it showed: a copy of the view taken the moment you left
   it, with every id and form name stripped and the copy made inert, so nothing in it can be clicked or found by id.
   Clicking a window behind makes it the live one (a tab switch, so the app draws it fresh). Find, My Smartdeck and
   My Freelancers are windows of this file's own, always live.

   The page itself does not scroll on '98: the live window's client area does. EN.ui.scrollPos and friends ask
   scroller() which element that is.

   Original work only: no Microsoft name, logo, artwork, sound or font file. The program icons are the author's own
   tab icons, paths unchanged, set in an original pixel frame; the other icons are drawn here; the sounds are
   synthesized on the spot. No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.w98 = (function () {
  var el = EN.ui.el;
  var STATE_KEY = "en_w98_win_v1", SOUND_KEY = "en_w98_sound_v1", RUN_KEY = "en_w98_run_v1";
  var MIN_W = 260, MIN_H = 150, ICON_W = 76, ICON_H = 75;
  var D = null;          // the mounted desk: { root, icons, wins, bar, tasks, tray, ghosts, portal, iconSig }
  var W = {};            // the windows of this desktop, by id ("t:combat", "a:find")
  var ORDER = [];        // window ids, back to front
  var LIVE = null;       // the tab key #view is drawn under
  var SWITCHED = false;  // render() is moving to another program: restore its scroll, not the top
  var homes = {};        // where a node we borrowed lives on the other skins

  function is98() { return document.documentElement.classList.contains("skin-98"); }
  function portal() { try { return EN.app.portal(); } catch (e) { return "freelancer"; } }
  function landing() { try { return !!(EN.app.onLanding && EN.app.onLanding()); } catch (e) { return false; } }
  function liveKey() { return landing() ? "landing" : EN.app.activeTab(); }
  function reduced() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function deskW() { return Math.max(320, document.documentElement.clientWidth || window.innerWidth || 1024); }
  /* TOUCH. A phone, or any screen whose main pointer is a finger, gets bigger targets (css/w98.css, the same media query) and a
     taller taskbar. Narrow (under 760 px) is the one that also fills every window to the screen, since a window that size is
     a page; a tablet is touch but has the room for windows. */
  var TOUCH_Q = "(max-width: 759px), (pointer: coarse)";
  function touch() { try { return window.matchMedia(TOUCH_Q).matches; } catch (e) { return narrow(); } }
  function taskH() { return touch() ? 46 : 28; }   // css/w98.css --w-task-h
  function deskH() { return Math.max(240, (document.documentElement.clientHeight || window.innerHeight || 768) - taskH()); }
  function narrow() { return deskW() < 760; }
  // how far from the left the desktop's icon columns reach: a new window opens beside them, not on them
  function leftClear() {
    var per = Math.max(1, Math.floor((deskH() - 6) / ICON_H)), cols = Math.ceil(iconList().length / per);
    return 4 + cols * ICON_W + 16;
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function svg(markup) { return el("span.w98-ic", { html: markup, "aria-hidden": "true" }); }

  /* ======================================================================== ICONS
     The author's tab icons, paths and rules unchanged, inside an original 32px pixel frame (desktop, folders) or alone at
     16px (title bars, taskbar, menus). A tab without an icon (the Admin rail) shows its own glyph in the frame. */
  var INK = { combat: "#000080", post: "#806000", face: "#006060", grid: "#000000", flow: "#800080", gear: "#804000", codex: "#006000", print: "#800000" };
  function parts(markup) {
    var m = /<svg([^>]*)>([\s\S]*)<\/svg>\s*$/.exec(markup || "");
    if (!m) return null;
    var vb = /viewBox="([^"]+)"/.exec(m[1]), keep = "";
    ["fill-rule", "clip-rule", "stroke-linecap", "stroke-linejoin"].forEach(function (a) {
      var x = new RegExp(a + '="([^"]+)"').exec(m[1]); if (x) keep += " " + a + '="' + x[1] + '"';
    });
    return { vb: vb ? vb[1] : "0 0 16 16", keep: keep, inner: m[2] };
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var FRAME32 = '<g shape-rendering="crispEdges"><rect x="1" y="2" width="30" height="28" fill="#000"/><rect x="2" y="3" width="28" height="26" fill="#c0c0c0"/>' +
    '<rect x="2" y="3" width="27" height="1" fill="#fff"/><rect x="2" y="3" width="1" height="25" fill="#fff"/><rect x="29" y="4" width="1" height="25" fill="#808080"/>' +
    '<rect x="3" y="28" width="27" height="1" fill="#808080"/><rect x="4" y="5" width="24" height="5" fill="#000080"/><rect x="10" y="5" width="6" height="5" fill="#0842a8"/>' +
    '<rect x="16" y="5" width="12" height="5" fill="#1084d0"/><rect x="24" y="6" width="3" height="3" fill="#c0c0c0"/><rect x="4" y="11" width="24" height="16" fill="#808080"/>' +
    '<rect x="5" y="12" width="23" height="15" fill="#fff"/></g>';
  function tile32(p) {
    var ink = INK[p.key] || "#000080", g = parts(p.icon);
    var inside = g
      ? '<svg x="7" y="13" width="19" height="13" viewBox="' + g.vb + '" preserveAspectRatio="xMidYMid meet" fill="' + ink + '"' + g.keep + '>' + g.inner + '</svg>'
      : '<text x="16.5" y="24.5" font-size="12" text-anchor="middle" fill="' + ink + '" font-family="Segoe UI Symbol, Arial, sans-serif">' + esc(p.glyph || "?") + '</text>';
    return '<svg viewBox="0 0 32 32" width="32" height="32">' + FRAME32 + inside + '</svg>';
  }
  function glyph16(p, ink) {
    var g = parts(p.icon);
    ink = ink || INK[p.key] || "#000080";
    return g
      ? '<svg viewBox="' + g.vb + '" width="16" height="16" fill="' + ink + '"' + g.keep + '>' + g.inner + '</svg>'
      : '<svg viewBox="0 0 16 16" width="16" height="16"><text x="8" y="13" font-size="13" text-anchor="middle" fill="' + ink + '" font-family="Segoe UI Symbol, Arial, sans-serif">' + esc(p.glyph || "?") + '</text></svg>';
  }
  // the app's own mark, the same drawing as index.html's .os-badge, windowed to its ink
  var MARK = '<path fill-rule="evenodd" d="M 117.5 117.5 H 360.5 L 394.5 151.5 V 394.5 H 150.5 L 117.5 361.5 Z M 128.5 128.5 V 355.5 L 156.5 383.5 H 383.5 V 156.5 L 355.5 128.5 Z"/><polygon points="220.5,178.5 243.5,178.5 219,333.5 195.5,333.5"/><polygon points="292.5,178.5 315.5,178.5 291,333.5 267.5,333.5"/><rect x="178.5" y="216.5" width="155" height="24"/><rect x="178.5" y="271.5" width="155" height="24"/>';
  function mark(px, ink) { return '<svg viewBox="117.5 117.5 277 277" width="' + px + '" height="' + px + '" fill="' + (ink || "currentColor") + '">' + MARK + '</svg>'; }
  // original pixel icons, 16 units square, drawn at 16 or 32
  var PIX = {
    deck: '<rect x="2" y="1" width="12" height="9" fill="#000"/><rect x="3" y="2" width="10" height="7" fill="#c0c0c0"/><rect x="4" y="3" width="8" height="5" fill="#008080"/><rect x="5" y="4" width="3" height="1" fill="#fff"/><rect x="5" y="6" width="5" height="1" fill="#fff"/><rect x="6" y="10" width="4" height="2" fill="#808080"/><rect x="2" y="12" width="12" height="3" fill="#000"/><rect x="3" y="13" width="10" height="1" fill="#c0c0c0"/><rect x="10" y="13" width="2" height="1" fill="#008000"/>',
    folder: '<rect x="1" y="3" width="6" height="2" fill="#000"/><rect x="1" y="4" width="14" height="10" fill="#000"/><rect x="2" y="4" width="4" height="1" fill="#ffff9f"/><rect x="2" y="5" width="12" height="8" fill="#ffd24a"/><rect x="2" y="5" width="12" height="1" fill="#ffff9f"/>',
    docs: '<rect x="1" y="3" width="6" height="2" fill="#000"/><rect x="1" y="4" width="14" height="10" fill="#000"/><rect x="2" y="5" width="12" height="8" fill="#ffd24a"/><rect x="2" y="5" width="12" height="1" fill="#ffff9f"/><rect x="6" y="7" width="8" height="7" fill="#000"/><rect x="7" y="8" width="6" height="5" fill="#fff"/><rect x="7" y="8" width="6" height="2" fill="#000080"/>',
    page: '<rect x="3" y="1" width="8" height="14" fill="#000"/><rect x="11" y="4" width="2" height="11" fill="#000"/><rect x="4" y="2" width="7" height="12" fill="#fff"/><rect x="11" y="5" width="1" height="9" fill="#fff"/><rect x="10" y="2" width="1" height="3" fill="#808080"/><rect x="10" y="4" width="2" height="1" fill="#808080"/>',
    find: '<circle cx="6.5" cy="6.5" r="4" fill="#bfffff" stroke="#000" stroke-width="1.5"/><path d="M9.6 9.6L14 14" stroke="#000" stroke-width="2.6"/>',
    help: '<rect x="2" y="2" width="12" height="12" fill="#000"/><rect x="3" y="3" width="10" height="10" fill="#800080"/><rect x="3" y="3" width="2" height="10" fill="#c000c0"/><rect x="7" y="5" width="4" height="1" fill="#ff0"/><rect x="10" y="6" width="1" height="2" fill="#ff0"/><rect x="8" y="8" width="2" height="1" fill="#ff0"/><rect x="8" y="9" width="1" height="1" fill="#ff0"/><rect x="8" y="11" width="1" height="1" fill="#ff0"/>',
    run: '<rect x="1" y="2" width="14" height="11" fill="#000"/><rect x="2" y="3" width="12" height="9" fill="#fff"/><rect x="2" y="3" width="12" height="2" fill="#000080"/><rect x="4" y="7" width="6" height="1" fill="#000"/><rect x="4" y="9" width="3" height="1" fill="#000"/><rect x="9" y="12" width="6" height="3" fill="#000"/><rect x="10" y="13" width="4" height="1" fill="#c0c0c0"/>',
    key: '<circle cx="5" cy="8" r="3.2" fill="#ffd24a" stroke="#000"/><circle cx="4.2" cy="8" r="1" fill="#000"/><path d="M8 7h7v2h-1.5v2H12V9h-1v1.6H9.6V9H8z" fill="#ffd24a" stroke="#000" stroke-width=".8"/>',
    power: '<rect x="1" y="2" width="14" height="10" fill="#000"/><rect x="2" y="3" width="12" height="8" fill="#c0c0c0"/><rect x="3" y="4" width="10" height="6" fill="#000"/><rect x="7" y="5" width="2" height="4" fill="#ff0"/><rect x="6" y="6" width="1" height="2" fill="#ff0"/><rect x="6" y="12" width="4" height="1" fill="#808080"/><rect x="4" y="13" width="8" height="2" fill="#000"/><rect x="5" y="13" width="6" height="1" fill="#c0c0c0"/>',
    panel: '<rect x="1" y="1" width="14" height="14" fill="#000"/><rect x="2" y="2" width="12" height="12" fill="#c0c0c0"/><rect x="3" y="3" width="4" height="4" fill="#008080"/><rect x="9" y="3" width="4" height="4" fill="#800000"/><rect x="3" y="9" width="4" height="4" fill="#808000"/><rect x="9" y="9" width="4" height="4" fill="#000080"/>',
    desk: '<rect x="1" y="2" width="14" height="11" fill="#000"/><rect x="2" y="3" width="12" height="9" fill="#008080"/><rect x="3" y="4" width="2" height="2" fill="#fff"/><rect x="3" y="8" width="2" height="2" fill="#fff"/><rect x="7" y="13" width="2" height="1" fill="#808080"/><rect x="5" y="14" width="6" height="1" fill="#000"/>',
    speaker: '<path d="M2 6h3l4-3v10l-4-3H2z" fill="#c0c0c0" stroke="#000"/><path d="M11 6q1.5 2 0 4M12.6 4.4q3 3.6 0 7.2" stroke="#000" fill="none"/>',
    mute: '<path d="M2 6h3l4-3v10l-4-3H2z" fill="#c0c0c0" stroke="#000"/><path d="M11 6l4 4M15 6l-4 4" stroke="#c00000" stroke-width="1.4"/>',
    info: '<circle cx="8" cy="8" r="7" fill="#fff" stroke="#000"/><circle cx="8" cy="8" r="6" fill="#000080"/><rect x="7" y="6.5" width="2" height="5.5" fill="#fff"/><rect x="7" y="3.5" width="2" height="2" fill="#fff"/>',
    warn: '<path d="M8 1L15.5 14.5H.5z" fill="#ff0" stroke="#000"/><rect x="7.2" y="5" width="1.6" height="5.5" fill="#000"/><rect x="7.2" y="11.5" width="1.6" height="1.6" fill="#000"/>',
    error: '<circle cx="8" cy="8" r="7" fill="#c00000" stroke="#000"/><path d="M5 5l6 6M11 5l-6 6" stroke="#fff" stroke-width="2"/>',
    question: '<circle cx="8" cy="8" r="7" fill="#fff" stroke="#000"/><circle cx="8" cy="8" r="6" fill="#000080"/><path d="M5.6 6.2Q5.6 3.8 8 3.8T10.4 6.2Q10.4 7.6 8.8 8.4T8 10" stroke="#fff" stroke-width="1.6" fill="none"/><rect x="7.2" y="11" width="1.6" height="1.6" fill="#fff"/>'
  };
  function pix(name, px) { return '<svg viewBox="0 0 16 16" width="' + px + '" height="' + px + '" shape-rendering="crispEdges">' + (PIX[name] || PIX.page) + '</svg>'; }
  // a Freelancer record on the desktop: a page with the author's operative on it
  function docIcon(px) {
    var g = parts(EN.app.tabIcon("combat"));
    return '<svg viewBox="0 0 16 16" width="' + px + '" height="' + px + '"><g shape-rendering="crispEdges">' + PIX.page + '</g>' +
      (g ? '<svg x="5" y="5" width="5.5" height="7" viewBox="' + g.vb + '" fill="#000080"' + g.keep + '>' + g.inner + '</svg>' : '') + '</svg>';
  }
  // the caption buttons: the author's own window icons (the same paths theme.css draws on the panels)
  var CB = {
    min: '<svg viewBox="0 0 122.88 122.88" width="10" height="10" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.602,78.674h81.675c1.52,0,2.756,1.115,2.756,2.479l0.002,18.713c0,1.36-1.24,2.477-2.758,2.477l-81.675-0.003 c-1.52,0-2.758-1.111-2.758-2.474V81.149C17.844,79.787,19.083,78.676,20.602,78.674L20.602,78.674z"/></svg>',
    max: '<svg viewBox="0 0 122.88 122.88" width="9" height="9" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.996,0h96.887c7.148,0,12.997,5.849,12.997,12.997v96.887 c0,7.147-5.849,12.996-12.997,12.996H12.996C5.849,122.88,0,117.031,0,109.884V12.997C0,5.849,5.849,0,12.996,0L12.996,0z M110.555,27.728H12.325v72.436c0,5.717,4.674,10.391,10.391,10.391h77.448c5.717,0,10.391-4.674,10.391-10.391V27.728 L110.555,27.728z"/></svg>',
    close: '<svg viewBox="0 0 122.88 122.88" width="10" height="10" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.801,91.163C11.036,92.928 11.036,95.823 12.801,97.588L25.292,110.079C27.057,111.844 29.952,111.844 31.717,110.079L61.44,80.356L91.163,110.079C92.928,111.844 95.823,111.844 97.588,110.079L110.079,97.588C111.844,95.823 111.844,92.928 110.079,91.163L80.356,61.44L110.079,31.717C111.844,29.952 111.844,27.057 110.079,25.292L97.588,12.801C95.823,11.036 92.928,11.036 91.163,12.801L61.44,42.524L31.717,12.801C29.952,11.036 27.057,11.036 25.292,12.801L12.801,25.292C11.036,27.057 11.036,29.952 12.801,31.717L42.524,61.44L12.801,91.163Z"/></svg>',
    // restore: two of the author's maximize frames, one behind the other
    restore: '<svg viewBox="0 0 160 160" width="10" height="10" fill="currentColor"><g transform="translate(37,0)"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.996,0h96.887c7.148,0,12.997,5.849,12.997,12.997v96.887 c0,7.147-5.849,12.996-12.997,12.996H12.996C5.849,122.88,0,117.031,0,109.884V12.997C0,5.849,5.849,0,12.996,0L12.996,0z M110.555,27.728H12.325v72.436c0,5.717,4.674,10.391,10.391,10.391h77.448c5.717,0,10.391-4.674,10.391-10.391V27.728 L110.555,27.728z"/></g><g transform="translate(0,37)"><rect x="0" y="0" width="122.88" height="122.88" rx="13" fill="#c0c0c0"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12.996,0h96.887c7.148,0,12.997,5.849,12.997,12.997v96.887 c0,7.147-5.849,12.996-12.997,12.996H12.996C5.849,122.88,0,117.031,0,109.884V12.997C0,5.849,5.849,0,12.996,0L12.996,0z M110.555,27.728H12.325v72.436c0,5.717,4.674,10.391,10.391,10.391h77.448c5.717,0,10.391-4.674,10.391-10.391V27.728 L110.555,27.728z"/></g></svg>'
  };
  var ARROW = '<svg viewBox="0 0 4 7" width="4" height="7" fill="currentColor"><path d="M0 0l4 3.5L0 7z"/></svg>';

  /* ======================================================================== SOUNDS
     Synthesized here, nothing recorded or copied: a bell for a message, a low pair for an error, a rising chord to start
     and a falling one to stop. On by default; the speaker in the tray mutes them (this device only). A browser plays
     nothing before the first click or key, so a sound asked for before then is simply skipped. */
  var AC = null;
  function soundOn() { return store(SOUND_KEY) !== "0"; }
  function ctx() {
    if (!soundOn()) return null;
    try {
      if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); }
      if (AC.state === "suspended") { var p = AC.resume(); if (p && p.catch) p.catch(function () {}); }
      return AC;
    } catch (e) { return null; }
  }
  function note(ac, at, f, dur, type, vol) {
    var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  var TUNES = {
    ding:  [[0, 1318.5, 0.55, "sine", 0.16], [0, 2637, 0.25, "sine", 0.04]],
    chord: [[0, 392, 0.35, "triangle", 0.14], [0, 466.2, 0.35, "triangle", 0.11], [0.16, 311.1, 0.4, "triangle", 0.12]],
    start: [[0, 130.8, 2.8, "triangle", 0.10], [0.05, 329.6, 2.4, "sine", 0.07], [0.28, 392, 2.2, "sine", 0.07], [0.52, 493.9, 2.0, "sine", 0.07], [0.78, 587.3, 1.9, "sine", 0.08], [1.05, 784, 1.7, "sine", 0.06]],
    stop:  [[0, 784, 0.9, "sine", 0.07], [0.22, 587.3, 0.9, "sine", 0.07], [0.44, 493.9, 0.9, "sine", 0.07], [0.66, 392, 1.6, "sine", 0.08], [0.66, 196, 1.8, "triangle", 0.08]]
  };
  function sound(name) {
    var ac = ctx(), t = TUNES[name];
    if (!ac || !t) return;
    try { t.forEach(function (n) { note(ac, n[0], n[1], n[2], n[3], n[4]); }); } catch (e) {}
  }

  /* ======================================================================== WINDOW STATE
     Where each program's window sits is remembered per desktop on this device; which windows are open is not. Like the
     real thing, a restart opens only the program you were in. */
  function saved() { try { var v = JSON.parse(store(STATE_KEY) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }
  function remember(w) {
    if (!w || !D) return;
    var all = saved(), mine = all[D.portal] = all[D.portal] || {};
    mine[w.id] = { x: w.x, y: w.y, w: w.w, h: w.h, max: !!w.max };
    store(STATE_KEY, JSON.stringify(all));
  }
  var _cascade = 0;
  function makeWin(id, kind, key) {
    var s = (saved()[portal()] || {})[id], dw = deskW(), dh = deskH();
    var w = { id: id, kind: kind, key: key, open: false, min: false, max: false, x: 96, y: 10, w: 0, h: 0, frame: null, client: null, snap: null, scroll: 0 };
    if (s && typeof s.x === "number") { w.x = s.x; w.y = s.y; w.w = s.w; w.h = s.h; w.max = !!s.max; }
    else if (kind === "tab") {
      var off = (_cascade++ % 6) * 26, lx = leftClear();
      w.x = lx + off; w.y = 10 + off; w.w = Math.min(1180, dw - lx - 24 - off); w.h = dh - 10 - 14 - off;
    } else {
      var size = (APPS[key] && APPS[key].size) || { "a:find": [560, 420], "a:deck": [520, 360], "a:docs": [560, 380] }[id] || [480, 340];
      w.w = Math.min(size[0], dw - 40); w.h = Math.min(size[1], dh - 40);
      w.x = Math.max(8, Math.round((dw - w.w) / 2) + (_cascade % 4) * 20); w.y = Math.max(8, Math.round((dh - w.h) / 3) + (_cascade++ % 4) * 20);
    }
    fit(w);
    W[id] = w;
    return w;
  }
  // a window always keeps its title bar on the desktop, so it can be grabbed back
  function fit(w) {
    var dw = deskW(), dh = deskH();
    w.w = Math.max(MIN_W, Math.min(w.w || 600, dw)); w.h = Math.max(MIN_H, Math.min(w.h || 400, dh));
    w.x = Math.max(-w.w + 80, Math.min(w.x, dw - 80)); w.y = Math.max(0, Math.min(w.y, dh - 24));
  }
  function maxed(w) { return w.max || narrow(); }
  function rectOf(w) {
    if (maxed(w)) return { x: 0, y: 0, w: deskW(), h: deskH() };
    return { x: w.x, y: w.y, w: w.w, h: w.h };
  }
  function shown(w) { return !!w && w.open && !w.min; }
  function topId() {
    for (var i = ORDER.length - 1; i >= 0; i--) if (shown(W[ORDER[i]])) return ORDER[i];
    return null;
  }
  function raise(id) { ORDER = ORDER.filter(function (x) { return x !== id; }); ORDER.push(id); }

  /* ======================================================================== PROGRAMS */
  function programs() { try { return EN.app.programs(); } catch (e) { return []; } }
  function program(key) {
    if (key === "landing") return { key: "landing", label: "Campaigns", sub: "pick the campaign to run", glyph: "◆", icon: "" };
    return programs().filter(function (p) { return p.key === key; })[0] || { key: key, label: key, sub: "", glyph: "?", icon: "" };
  }
  function recordName() {
    var ch = EN.store.active();
    return ch && typeof ch.name === "string" && ch.name ? ch.name : "";
  }
  function titleOf(w) {
    if (w.kind === "app") return APPS[w.key] ? APPS[w.key].title() : w.key;
    var p = program(w.key), n = portal() === "freelancer" ? recordName() : "";
    return p.label + (n ? " - " + n : "");
  }
  function icon16(w) {
    if (w.kind === "app") return APPS[w.key] ? APPS[w.key].icon(16) : pix("folder", 16);
    if (w.key === "landing") return mark(16, "#000080");
    return glyph16(program(w.key));
  }
  // open a program the way the rail did: its onSelect, then the tab (render() then puts it in its window)
  function launch(key, from) {
    closeMenus();
    if (from) _from = from;
    _want = key;
    try { EN.app.openProgram(key); } catch (e) { EN.app.gotoTab(key); }
  }
  var _from = null;   // where the next window to open zooms out from (an icon's box)
  var _want = null;   // a program asked for by name: its window opens even if it is the one already drawn (closed or put away)

  /* ======================================================================== MOUNT
     The desk goes inside #os, so it is hidden with the rest until the boot reveals the app. #view, the tray and the
     Admin campaign picker are borrowed while '98 is up and go home when it is not. */
  function borrow(node, into) {
    if (!node || !into || node.parentNode === into) return;
    if (!homes[node.id || node.className]) homes[node.id || node.className] = { parent: node.parentNode, next: node.nextSibling };
    into.appendChild(node);
  }
  function giveBack(node) {
    var h = node && homes[node.id || node.className];
    if (!h) return;
    delete homes[node.id || node.className];
    if (h.next && h.next.parentNode === h.parent) h.parent.insertBefore(node, h.next); else if (h.parent) h.parent.appendChild(node);
  }
  /* EXTENSIONS (js/w98_extras.js): the screen saver, tips, the fumble error and the Breach game add to these lists, so this file stays the
     desktop and nothing else. Each list holds functions that answer with menu items (or, for `about`, an element). */
  var X = { settings: [], programs: [], desktop: [], about: [], boot: [], runNames: {}, open: [], paint: [], cpl: [], cplExtras: [], display: [], controlPanel: null };

  function mount() {
    var os = document.getElementById("os");
    if (!os) return false;
    D = { portal: portal(), iconSig: "" };
    D.icons = el("div.w98-icons", { role: "group", "aria-label": "Desktop" });
    D.wins = el("div.w98-wins");
    D.park = el("div.w98-park", { "aria-hidden": "true" });
    D.tasks = el("div.w98-tasks", { role: "toolbar", "aria-label": "Open windows" });
    D.band = el("div.w98-band");
    D.tray = el("div.w98-tray");
    D.start = el("button#w98-start.w98-start", { type: "button", "aria-haspopup": "menu", "aria-expanded": "false", title: "Click here to begin.",
      onclick: function () { if (MS.length && MS[0].start) closeMenus(); else openStart(); } }, [svg(mark(16)), el("span", { text: "Start" })]);
    D.bar = el("div.w98-bar", { role: "toolbar", "aria-label": "Taskbar" }, [
      D.start, el("span.w98-grip"), el("div.w98-quick"), el("span.w98-grip"), D.tasks, D.band, D.tray
    ]);
    D.root = el("div#w98", { onpointerdown: function (e) { if (e.target === D.root || e.target === D.icons) { closeMenus(); selectIcon(null); } },
      oncontextmenu: ctxMenu },
      [D.icons, D.wins, D.park, D.bar]);
    os.appendChild(D.root);
    window.addEventListener("resize", onResize);
    return true;
  }
  /* THE DESKTOP'S RIGHT-CLICK MENU: on the desktop itself, and on an icon (Open, in bold, the way a default action was shown).
     Inside a window the browser's own menu stays, since a field's copy and paste are worth more than a joke. */
  var ARR_KEY = "en_w98_arrange_v1";
  function arrangeMode() { return store(ARR_KEY) === "name" ? "name" : "default"; }
  function setArrange(m) { store(ARR_KEY, m); if (D) { D.iconSig = ""; paintIcons(); } }
  function ctxMenu(e) {
    if (!D || (e.target.closest && e.target.closest(".w98-win"))) return;
    e.preventDefault();
    closeMenus();
    var icon = e.target.closest && e.target.closest(".w98-di"), items;
    if (icon) {
      selectIcon(icon);
      items = [{ label: "&Open", bold: true, go: function () { if (icon._open) icon._open(); } }];
    } else {
      selectIcon(null);
      items = [
        { label: "Arrange &Icons", sub: [
          { label: "by &Name", check: arrangeMode() === "name", radio: true, go: function () { setArrange("name"); } },
          { label: "&Default order", check: arrangeMode() === "default", radio: true, go: function () { setArrange("default"); } }
        ] },
        { label: "&Line Up Icons", go: function () { D.iconSig = ""; paintIcons(); } },
        { sep: true },
        { label: "&Refresh", go: function () { EN.app.render(); } },
        { sep: true }
      ];
      if (portal() === "freelancer") items.push({ label: "Ne&w", sub: [{ label: "&Freelancer", icon: pix("page", 16), go: newRecord }] });
      X.desktop.forEach(function (fn) { try { items = items.concat(fn()); } catch (x) {} });
      items.push({ sep: true });
      items.push({ label: "P&roperties", go: function () { closeMenus(); if (X.controlPanel && EN.w98.openControlPanel) EN.w98.openControlPanel("display"); else openSettings(); } });
    }
    openMenu(items, e.clientX, e.clientY, {});
  }
  function unmount() {
    if (!D) return;
    closeMenus(); closeDialogs();
    var view = document.getElementById("view");
    if (view) { view.classList.remove("w98-hidden"); giveBack(view); }
    giveBack(document.getElementById("active-name"));
    var tray = D.tray.querySelector(".os-tray"); if (tray) giveBack(tray);
    if (D.root.parentNode) D.root.parentNode.removeChild(D.root);
    window.removeEventListener("resize", onResize);
    D = null; W = {}; ORDER = []; LIVE = null; SWITCHED = false;
  }
  function onResize() {
    if (!D) return;
    Object.keys(W).forEach(function (id) { fit(W[id]); });
    D.iconSig = "";
    paintIcons(); layout();
  }

  /* ======================================================================== THE LIVE WINDOW
     beforeRender(): called by render() before it clears #view. When the program is changing, the window being left keeps
     a copy of what it showed, and #view moves into the window of the program being opened, so it is drawn at that
     window's size. chrome(): called after the view is drawn, on every render. */
  function snapshot(w) {
    var view = document.getElementById("view");
    if (!view || !w || !w.client || view.parentNode !== w.client) return;
    w.scroll = w.client.scrollTop;
    var copy = view.cloneNode(true);
    copy.removeAttribute("id");
    copy.classList.add("w98-snap");
    Array.prototype.forEach.call(copy.querySelectorAll("[id]"), function (n) { n.removeAttribute("id"); });
    Array.prototype.forEach.call(copy.querySelectorAll("input[name], select[name], textarea[name], form[name], button[name]"), function (n) { n.removeAttribute("name"); });
    Array.prototype.forEach.call(copy.querySelectorAll("[autofocus]"), function (n) { n.removeAttribute("autofocus"); });
    var a = view.querySelectorAll("canvas"), b = copy.querySelectorAll("canvas");
    for (var i = 0; i < a.length && i < b.length; i++) { try { b[i].getContext("2d").drawImage(a[i], 0, 0); } catch (e) {} }
    copy.setAttribute("inert", "");
    copy.setAttribute("aria-hidden", "true");
    w.snap = copy;
  }
  function seat(w) {
    // #view into this window's client area: it goes first among the windows so a document-wide lookup meets it before any copy
    var view = document.getElementById("view");
    if (!view || !w.client) return;
    if (w.snap && w.snap.parentNode) w.snap.parentNode.removeChild(w.snap);
    w.snap = null;
    borrow(view, w.client);
    if (w.frame && D.wins.firstChild !== w.frame) D.wins.insertBefore(w.frame, D.wins.firstChild);
  }
  function unseat(w) {
    if (!w || !w.client) return;
    if (w.snap && w.snap.parentNode !== w.client) { w.client.appendChild(w.snap); w.client.scrollTop = w.scroll || 0; }
  }
  function beforeRender() {
    if (!D || !is98() || D.portal !== portal()) return;
    var k = liveKey();
    if (!k || k === LIVE) return;
    var old = LIVE ? W["t:" + LIVE] : null;
    if (old && old.open) { snapshot(old); }
    var w = W["t:" + k] || makeWin("t:" + k, "tab", k);
    frameFor(w);
    seat(w);
    unseat(old);
    SWITCHED = true;
  }
  // render() asks after drawing a new program: put back the scroll its window had, rather than the top
  function restoreScroll() {
    if (!D || !SWITCHED) return false;
    SWITCHED = false;
    var w = W["t:" + LIVE];
    if (w && w.client) w.client.scrollTop = w.scroll || 0;
    return true;
  }
  function scroller() {
    if (!D || !is98()) return null;
    var w = LIVE ? W["t:" + LIVE] : null;
    return w && w.client && shown(w) ? w.client : null;
  }

  function chrome() {
    if (!is98()) { unmount(); return; }
    if (D && D.portal !== portal()) unmount();
    if (!D && !mount()) return;
    var k = liveKey(), changed = k !== LIVE, asked = _want === k;
    _want = null;
    var w = W["t:" + k] || makeWin("t:" + k, "tab", k);
    frameFor(w);
    if (document.getElementById("view") && document.getElementById("view").parentNode !== w.client) seat(w);
    if (changed || asked) {
      var prev = LIVE ? W["t:" + LIVE] : null;
      if (prev && prev !== w) unseat(prev);
      LIVE = k;
      // a program opened (from a link, the Start menu, an icon): its window opens or comes back, in front
      var wasShut = !w.open;
      if (!w.open || w.min) { if (wasShut) w.opened = ++_opened; w.open = true; w.min = false; zoomIn(w, wasShut); }
      X.open.forEach(function (fn) { try { fn(k); } catch (e) {} });
      raise(w.id);
    }
    // a program the record no longer has (Flow, #GRID, #POST come and go) loses its window
    var have = {}; programs().forEach(function (p) { have[p.key] = true; });
    Object.keys(W).forEach(function (id) {
      var x = W[id];
      if (x.kind === "tab" && x.key !== LIVE && x.key !== "landing" && !have[x.key]) dropWin(x);
      if (x.kind === "tab" && x.key === "landing" && LIVE !== "landing") dropWin(x);
    });
    // a record opened in place of another: the copies behind belong to the old one, so their windows close
    var rid = (EN.store.active() && EN.store.active().meta && EN.store.active().meta.id) || "";
    if (D.rid !== undefined && D.rid !== rid) Object.keys(W).forEach(function (id) { if (W[id].kind === "tab" && W[id].key !== LIVE) dropWin(W[id]); });
    D.rid = rid;
    // the Admin desktop's campaign picker rides the taskbar, as a toolbar on it
    var an = document.getElementById("active-name");
    if (an) { if (D.portal === "admin") borrow(an, D.band); else giveBack(an); }
    // the tray app.js draws in the (hidden) tab rail comes down to the taskbar
    var tray = document.querySelector("#os-tabs .os-tray");
    if (tray) { Array.prototype.forEach.call(D.tray.querySelectorAll(".os-tray"), function (t) { if (t !== tray) t.parentNode.removeChild(t); }); delete homes[tray.id || tray.className]; borrow(tray, D.tray); }
    paintSpeaker();
    paintIcons();
    paintQuick();
    Object.keys(W).forEach(function (id) { if (W[id].kind === "app" && W[id].open && APPS[W[id].key].refresh) APPS[W[id].key].refresh(W[id]); });
    layout();
    _from = null;
    X.paint.forEach(function (fn) { try { fn(); } catch (e) {} });
  }
  function dropWin(w) {
    if (w.frame && w.frame.parentNode) w.frame.parentNode.removeChild(w.frame);
    delete W[w.id];
    ORDER = ORDER.filter(function (x) { return x !== w.id; });
  }

  /* ======================================================================== A WINDOW'S FRAME */
  function frameFor(w) {
    if (w.frame) return w.frame;
    var tb = el("div.w98-tb", {
      onpointerdown: function (e) { dragStart(e, w, "move"); },
      ondblclick: function (e) { if (!e.target.closest(".w98-cb")) toggleMax(w); }
    }, [
      el("span.w98-tb-ic"), el("span.w98-tt"),
      el("button.w98-cb", { type: "button", "aria-label": "Minimize", title: "Minimize", dataset: { cb: "min" }, html: CB.min, onclick: function () { minimize(w); } }),
      el("button.w98-cb", { type: "button", "aria-label": "Maximize", title: "Maximize", dataset: { cb: "max" }, html: CB.max, onclick: function () { toggleMax(w); } }),
      el("button.w98-cb.w98-cb-x", { type: "button", "aria-label": "Close", title: "Close", dataset: { cb: "close" }, html: CB.close, onclick: function () { closeWin(w); } })
    ]);
    var mb = el("div.w98-mb", { role: "menubar" });
    w.client = el("div.w98-client" + (w.kind === "app" ? ".w98-appc" : ""));
    var sb = el("div.w98-sb", null, [el("span.w98-sb-a"), el("span.w98-sb-b")]);
    var kids = [tb, mb, w.client, sb];
    ["n", "s", "e", "w", "ne", "nw", "se", "sw"].forEach(function (d) {
      kids.push(el("div.w98-rz.w98-rz-" + d, { onpointerdown: function (e) { dragStart(e, w, d); } }));
    });
    w.frame = el("div.w98-win", { dataset: { win: w.id, kind: w.kind }, role: "region",
      onpointerdown: function (e) { if (e.button === 0 || e.pointerType !== "mouse") focusWin(w); } }, kids);
    w.tb = tb; w.mb = mb; w.sb = sb;
    paintMenuBar(w);
    if (w.kind === "app" && APPS[w.key]) APPS[w.key].build(w);
    D.wins.appendChild(w.frame);
    return w.frame;
  }
  function paintFrame(w, z, active) {
    var f = w.frame, r = rectOf(w);
    if (!f) return;
    f.style.left = r.x + "px"; f.style.top = r.y + "px"; f.style.width = r.w + "px"; f.style.height = r.h + "px"; f.style.zIndex = z;
    f.classList.toggle("w98-max", maxed(w));
    f.classList.toggle("w98-off", !active);
    f.classList.toggle("w98-gone", !shown(w));
    f.classList.toggle("w98-live", w.kind === "tab" && w.key === LIVE);
    var t = titleOf(w);
    var tt = f.querySelector(".w98-tt"); if (tt.textContent !== t) tt.textContent = t;
    f.setAttribute("aria-label", t);
    var ic = f.querySelector(".w98-tb-ic"), want = icon16(w);
    if (ic.getAttribute("data-k") !== want.length + ":" + w.key) { ic.innerHTML = want; ic.setAttribute("data-k", want.length + ":" + w.key); }
    var mx = f.querySelector('[data-cb="max"]');
    var isMax = maxed(w);
    if (mx.getAttribute("data-on") !== String(isMax)) {
      mx.setAttribute("data-on", String(isMax)); mx.innerHTML = isMax ? CB.restore : CB.max;
      mx.setAttribute("aria-label", isMax ? "Restore" : "Maximize"); mx.title = isMax ? "Restore" : "Maximize";
    }
    mx.disabled = narrow();
    if (w.kind === "tab") {
      var p = program(w.key);
      var a = f.querySelector(".w98-sb-a"), b = f.querySelector(".w98-sb-b");
      var sub = "";
      try { var st = EN.app.subTab(w.key), hit = (p.subs || []).filter(function (s) { return s.key === st; })[0]; sub = hit ? hit.label : ""; } catch (e) {}
      var at = w.key === LIVE ? (sub ? sub.charAt(0) + sub.slice(1).toLowerCase() + ": " : "") + (p.sub || "") : "Click to bring this window to the front";
      if (a.textContent !== at) a.textContent = at;
      var bt = portal() === "freelancer" && recordName() ? (EN.store.activeIsExample && EN.store.activeIsExample() ? "Example, not saved" : "") : "";
      if (b.textContent !== bt) b.textContent = bt;
      b.style.display = bt ? "" : "none";
    }
  }
  function layout() {
    if (!D) return;
    var top = topId();
    ORDER.forEach(function (id, i) { paintFrame(W[id], 10 + i, id === top); });
    Object.keys(W).forEach(function (id) { if (ORDER.indexOf(id) === -1) paintFrame(W[id], 1, false); });
    // with the live program put away, #view waits in the park (still drawn, never seen)
    var lw = LIVE ? W["t:" + LIVE] : null, view = document.getElementById("view");
    if (view) view.classList.toggle("w98-hidden", !shown(lw));
    paintTasks(top);
  }

  /* ======================================================================== WINDOW ACTIONS */
  function focusWin(w) {
    if (!w || !w.open) return;
    closeMenus();
    if (w.kind === "tab" && w.key !== LIVE) {
      raise(w.id);
      if (w.key === "landing") { layout(); return; }
      EN.app.gotoTab(w.key);   // the program behind comes alive: the app draws it fresh in its window
      return;
    }
    if (topId() === w.id) return;
    raise(w.id);
    layout();
  }
  function minimize(w) {
    if (!shown(w)) return;
    var from = rectOf(w);
    w.min = true;
    closeMenus();
    layout();
    ghost(from, taskRect(w.id));
  }
  function restore(w) {
    if (!w.open) return;
    var wasMin = w.min;
    w.min = false;
    raise(w.id);
    if (w.kind === "tab" && w.key !== LIVE && w.key !== "landing") { EN.app.gotoTab(w.key); }
    else layout();
    if (wasMin) zoomIn(w, false);
  }
  function toggleMax(w) {
    if (narrow()) return;
    var from = rectOf(w);
    w.max = !w.max;
    remember(w);
    raise(w.id);
    if (w.kind === "tab" && w.key !== LIVE) { EN.app.gotoTab(w.key); return; }
    layout();
    ghost(from, rectOf(w));
  }
  function closeWin(w) {
    closeMenus();
    w.open = false; w.min = false;
    ORDER = ORDER.filter(function (x) { return x !== w.id; });
    if (w.kind === "app") { if (APPS[w.key].closed) APPS[w.key].closed(w); dropWin(w); layout(); return; }
    if (w.key !== LIVE) { dropWin(w); layout(); return; }
    // the live program closed: the next window down comes alive, or the desktop is left empty
    var next = null;
    for (var i = ORDER.length - 1; i >= 0; i--) { var x = W[ORDER[i]]; if (shown(x) && x.kind === "tab") { next = x; break; } }
    if (w.snap && w.snap.parentNode) w.snap.parentNode.removeChild(w.snap);
    if (next) { borrow(document.getElementById("view"), D.park); dropWinKeepLive(w); EN.app.gotoTab(next.key); return; }
    borrow(document.getElementById("view"), D.park);
    layout();
  }
  // the closed live window keeps its record (so render() still has somewhere to draw) but leaves the desktop
  function dropWinKeepLive(w) { if (w.frame && w.frame.parentNode) w.frame.parentNode.removeChild(w.frame); w.frame = null; w.client = null; }
  function taskClick(id) {
    var w = W[id];
    if (!w) return;
    if (w.min) restore(w);
    else if (topId() === id) minimize(w);
    else focusWin(w);
  }
  var _shown = null;   // what Show Desktop put away, to bring back on a second press
  function showDesktop() {
    closeMenus();
    var up = ORDER.filter(function (id) { return shown(W[id]); });
    if (up.length) { _shown = up; up.forEach(function (id) { W[id].min = true; }); layout(); return; }
    if (_shown) { _shown.forEach(function (id) { if (W[id] && W[id].open) W[id].min = false; }); var t = _shown[_shown.length - 1]; _shown = null; if (W[t]) { var w = W[t]; if (w.kind === "tab" && w.key !== LIVE) { raise(t); EN.app.gotoTab(w.key); return; } } layout(); }
  }

  /* ---- move and resize: the outline follows the pointer the way the real thing's "show window contents" did */
  var DRAG = null;
  function dragStart(e, w, dir) {
    if (e.button !== 0 || e.target.closest(".w98-cb")) return;
    if (dir !== "move" && maxed(w)) return;
    if (dir === "move" && maxed(w)) return;
    focusWin(w);
    DRAG = { w: w, dir: dir, sx: e.clientX, sy: e.clientY, r: { x: w.x, y: w.y, w: w.w, h: w.h }, el: e.currentTarget, id: e.pointerId };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {}
    e.currentTarget.addEventListener("pointermove", dragMove);
    e.currentTarget.addEventListener("pointerup", dragEnd);
    e.currentTarget.addEventListener("pointercancel", dragEnd);
    e.preventDefault();
  }
  function dragMove(e) {
    if (!DRAG) return;
    var d = DRAG, dx = e.clientX - d.sx, dy = e.clientY - d.sy, w = d.w, r = d.r;
    if (d.dir === "move") { w.x = r.x + dx; w.y = r.y + dy; }
    else {
      if (d.dir.indexOf("e") !== -1) w.w = Math.max(MIN_W, r.w + dx);
      if (d.dir.indexOf("s") !== -1) w.h = Math.max(MIN_H, r.h + dy);
      if (d.dir.indexOf("w") !== -1) { var nw = Math.max(MIN_W, r.w - dx); w.x = r.x + r.w - nw; w.w = nw; }
      if (d.dir.indexOf("n") !== -1) { var nh = Math.max(MIN_H, r.h - dy); w.y = r.y + r.h - nh; w.h = nh; }
    }
    fit(w);
    var f = w.frame; if (f) { f.style.left = w.x + "px"; f.style.top = w.y + "px"; f.style.width = w.w + "px"; f.style.height = w.h + "px"; }
  }
  function dragEnd() {
    if (!DRAG) return;
    var t = DRAG.el;
    t.removeEventListener("pointermove", dragMove); t.removeEventListener("pointerup", dragEnd); t.removeEventListener("pointercancel", dragEnd);
    try { t.releasePointerCapture(DRAG.id); } catch (x) {}
    remember(DRAG.w);
    DRAG = null;
  }

  /* ---- the zoom: a caption strip flies between a window and its taskbar button (or the icon it was opened from) */
  function taskRect(id) {
    var b = D && D.tasks.querySelector('[data-task="' + id + '"]');
    if (!b) return { x: 140, y: deskH() + 3, w: 150 };
    var r = b.getBoundingClientRect(), o = D.root.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top, w: r.width };
  }
  function ghost(from, to) {
    if (!D || reduced() || !from || !to) return;
    var g = el("div.w98-ghost", { style: { left: from.x + "px", top: from.y + "px", width: from.w + "px" } });
    D.root.appendChild(g);
    g.getBoundingClientRect();   // start where it is, then fly
    g.style.left = to.x + "px"; g.style.top = to.y + "px"; g.style.width = to.w + "px";
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 330);
  }
  function zoomIn(w, fromShut) {
    var to = rectOf(w), from = null;
    if (_from) { from = _from; _from = null; }
    else if (!fromShut) from = taskRect(w.id);
    if (!from || !w.frame || reduced()) return;
    w.frame.classList.add("w98-opening");
    ghost(from, to);
    setTimeout(function () { if (w.frame) w.frame.classList.remove("w98-opening"); }, 300);
  }

  /* ======================================================================== MENUS
     One stack of open menus. A menu item: { label ("&File": the letter after & is underlined and is its key), icon
     (markup), sub (items, or a function giving them), go (function), check, radio, disabled, sep }. Click opens; with a
     menu open, hovering another menu bar title or a submenu's parent moves to it, as it did. */
  var MS = [];   // [{ node, items, start, bar, owner }]
  function label(text) {
    var i = text.indexOf("&");
    if (i === -1) return [document.createTextNode(text)];
    return [document.createTextNode(text.slice(0, i)), el("u", { text: text.charAt(i + 1) }), document.createTextNode(text.slice(i + 2))];
  }
  function accel(text) { var i = text.indexOf("&"); return i === -1 ? "" : text.charAt(i + 1).toLowerCase(); }
  function closeMenus(from) {
    from = from || 0;
    while (MS.length > from) { var m = MS.pop(); if (m.node.parentNode) m.node.parentNode.removeChild(m.node); if (m.owner) m.owner.classList.remove("w98-on"); clearTimeout(m.t); }
    if (D) { D.start.classList.toggle("w98-on", !!(MS[0] && MS[0].start)); D.start.setAttribute("aria-expanded", MS[0] && MS[0].start ? "true" : "false"); }
    if (!MS.length) document.removeEventListener("pointerdown", outside, true);
  }
  function outside(e) {
    var t = e.target;
    if (MS.some(function (m) { return m.node.contains(t) || (m.owner && m.owner.contains(t)); })) return;
    if (D && D.start.contains(t)) return;
    closeMenus();
  }
  function rowFor(it, level, big) {
    if (it.sep) return el("div.w98-msep", { role: "separator" });
    var hasSub = !!it.sub;
    var row = el("button.w98-mi" + (big ? ".w98-mi-big" : "") + (it.disabled ? ".w98-dis" : "") + (it.bold ? ".w98-bold" : ""), {
      type: "button", role: "menuitem", disabled: !!it.disabled, "aria-haspopup": hasSub ? "menu" : null,
      dataset: { k: accel(it.label || "") },
      onpointerenter: function () { hover(row, it, level); },
      onclick: function (e) {
        e.stopPropagation();
        if (it.disabled) return;
        if (hasSub) { openSub(row, it, level); return; }
        closeMenus();
        if (it.go) it.go();
      }
    }, [
      el("span.w98-mi-ic", { html: it.icon || (it.check ? (it.radio ? '<svg viewBox="0 0 6 6" width="6" height="6"><circle cx="3" cy="3" r="2.5" fill="currentColor"/></svg>' : '<svg viewBox="0 0 7 7" width="7" height="7"><path d="M0 3l2 2 5-5v2L2 7 0 5z" fill="currentColor"/></svg>') : "") }),
      el("span.w98-mi-l", null, label(it.label || "")),
      it.keys ? el("span.w98-mi-k", { text: it.keys }) : null,
      hasSub ? el("span.w98-mi-a", { html: ARROW }) : null
    ]);
    row._it = it;
    return row;
  }
  function hover(row, it, level) {
    var m = MS[level];
    if (!m) return;
    Array.prototype.forEach.call(m.node.querySelectorAll(".w98-mi.w98-hot"), function (r) { if (r !== row) r.classList.remove("w98-hot"); });
    row.classList.add("w98-hot");
    clearTimeout(m.t);
    if (MS.length > level + 1 && MS[level + 1].owner === row) return;
    m.t = setTimeout(function () {
      if (MS[level] !== m) return;
      closeMenus(level + 1);
      if (it.sub && !it.disabled) openSub(row, it, level);
    }, it.sub ? 220 : 120);
  }
  function openSub(row, it, level) {
    if (MS.length > level + 1 && MS[level + 1].owner === row) return;
    closeMenus(level + 1);
    var items = typeof it.sub === "function" ? it.sub() : it.sub;
    var r = row.getBoundingClientRect();
    openMenu(items, r.right - 3, r.top - 3, { owner: row, level: level + 1, side: r.left });
  }
  function openMenu(items, x, y, opts) {
    opts = opts || {};
    var lv = opts.level || 0;
    var node = el("div.w98-menu" + (opts.start ? ".w98-startm" : "") + (opts.bar ? ".w98-down" : ""), { role: "menu" });
    var list = el("div.w98-mlist");
    (items || []).forEach(function (it) { list.appendChild(rowFor(it, lv, !!opts.start)); });
    if (!items || !items.length) list.appendChild(el("div.w98-mi.w98-dis.w98-empty", { text: "(Empty)" }));
    if (opts.start) node.appendChild(el("div.w98-sband", null, [el("span", null, [el("b", { text: "#GRID" }), document.createTextNode("OS '98")])]));
    node.appendChild(list);
    document.body.appendChild(node);
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    var r = node.getBoundingClientRect();
    if (opts.start) { x = 2; y = vh - taskH() - r.height + 2; }
    else {
      if (x + r.width > vw) x = Math.max(0, (opts.side != null ? opts.side - r.width + 3 : vw - r.width));
      if (y + r.height > vh) y = Math.max(0, (opts.below != null ? opts.below - r.height : vh - r.height));
    }
    node.style.left = Math.round(x) + "px"; node.style.top = Math.round(y) + "px";
    if (opts.owner) opts.owner.classList.add("w98-on");
    MS.push({ node: node, items: items, start: !!opts.start, bar: opts.bar || null, owner: opts.owner || null });
    if (MS.length === 1) document.addEventListener("pointerdown", outside, true);
    if (opts.start && D) { D.start.classList.add("w98-on"); D.start.setAttribute("aria-expanded", "true"); }
    return node;
  }

  /* ---- the Start menu */
  function freelancerDocs() {
    var roster = EN.store.roster(), ids = Object.keys(roster || {}), cur = EN.store.active();
    var curId = cur && cur.meta ? cur.meta.id : null, ex = EN.store.activeIsExample && EN.store.activeIsExample();
    var out = ids.map(function (id) {
      var r = roster[id], n = typeof r.name === "string" && r.name ? r.name : "Unnamed Freelancer";
      return { label: n, icon: docIcon(16), check: !ex && id === curId, go: function () { openRecord(id); } };
    });
    var exs = (EN.examples || []).map(function (x) {
      return { label: x.name + " (example)", icon: docIcon(16), check: !!(ex && cur && cur.meta.example === x.key), go: function () { openExample(x.key); } };
    });
    if (exs.length) out.push({ label: "&Examples", icon: pix("folder", 16), sub: exs });
    out.push({ sep: true });
    out.push({ label: "&New Freelancer...", icon: pix("page", 16), go: newRecord });
    out.push({ label: "&Manage Freelancers...", icon: pix("docs", 16), go: function () { if (EN.builder && EN.builder.openManager) EN.builder.openManager(); } });
    return out;
  }
  function programItems() {
    var list = programs().map(function (p) { return { label: p.label, icon: glyph16(p), go: function () { launch(p.key); } }; });
    var more = [];
    X.programs.forEach(function (fn) { try { more = more.concat(fn()); } catch (e) {} });
    if (more.length) { list.push({ sep: true }); list = list.concat(more); }
    list.push({ sep: true });
    list.push({ label: "My Smartdeck", icon: pix("deck", 16), go: function () { openApp("deck"); } });
    if (portal() === "freelancer") list.push({ label: "My Freelancers", icon: pix("docs", 16), go: function () { openApp("docs"); } });
    return list;
  }
  function settingsItems() {
    var out = [{ label: "&Control Panel", icon: pix("panel", 16), go: openSettings }];
    if (EN.app.hasAdmin()) out.push(portal() === "admin"
      ? { label: "&Freelancer desktop", icon: glyph16(program("combat"), "#000080"), go: function () { EN.app.setPortal("freelancer"); } }
      : { label: "&Admin desktop", icon: mark(16, "#806000"), go: function () { EN.app.enterAdmin(); } });
    var more = [];
    X.settings.forEach(function (fn) { try { more = more.concat(fn()); } catch (e) {} });
    if (more.length) { out.push({ sep: true }); out = out.concat(more); }
    return out;
  }
  function startItems() {
    var handle = "";
    try { var ch = EN.store.active(); handle = ch && ch.identity && ch.identity.handle ? ch.identity.handle : ""; } catch (e) {}
    var items = [
      { label: "&Programs", icon: pix("folder", 32), sub: programItems },
      portal() === "freelancer" ? { label: "&Documents", icon: pix("docs", 32), sub: freelancerDocs } : null,
      { label: "&Settings", icon: pix("panel", 32), sub: settingsItems },
      { label: "&Find", icon: pix("find", 32), sub: function () { return [{ label: "&Rules, Gear and People...", icon: pix("find", 16), keys: "Ctrl+K", go: function () { openApp("find"); } }]; } },
      { label: "&Help", icon: pix("help", 32), go: function () { launch(portal() === "admin" ? "gmcodex" : "codex"); } },
      { label: "&Run...", icon: pix("run", 32), go: runDialog },
      { sep: true },
      { label: "&Log Off" + (handle ? " " + handle : "") + "...", icon: pix("key", 32), go: logOffDialog },
      { label: "Sh&ut Down...", icon: pix("power", 32), go: shutDownDialog }
    ];
    return items.filter(Boolean);
  }
  function openStart() {
    if (!D) return;
    closeMenus();
    var r = D.start.getBoundingClientRect();
    var node = openMenu(startItems(), r.left, r.top, { start: true, owner: null });
    if (!reduced()) node.classList.add("w98-rise");
    focusFirst(node);
  }
  function focusFirst(node) { var b = node.querySelector(".w98-mi:not([disabled])"); if (b) try { b.focus({ preventScroll: true }); } catch (e) {} }

  /* ---- a window's menu bar */
  function menuItemsFor(w, name) {
    var codex = portal() === "admin" ? "gmcodex" : "codex";
    if (name === "file") {
      var f = [];
      if (w.kind === "tab" && portal() === "freelancer") {
        f.push({ label: "&New Freelancer...", go: newRecord });
        f.push({ label: "&Open...", go: function () { openApp("docs"); } });
        f.push({ sep: true });
      }
      f.push({ label: "&Close", keys: "", go: function () { closeWin(w); } });
      return f;
    }
    if (name === "view") {
      var v = [];
      var p = w.kind === "tab" ? program(w.key) : null;
      if (p && p.subs && p.subs.length) {
        var cur = EN.app.subTab(w.key);
        p.subs.forEach(function (s) { v.push({ label: s.label.charAt(0) + s.label.slice(1).toLowerCase(), check: s.key === cur, radio: true, go: function () { raise(w.id); EN.app.gotoTab(w.key, s.key); } }); });
        v.push({ sep: true });
      }
      v.push({ label: "&Refresh", go: function () { if (w.kind === "app" && APPS[w.key].refresh) APPS[w.key].refresh(w, true); else if (w.key === LIVE) EN.app.render(); else focusWin(w); } });
      return v;
    }
    return [
      { label: "&Help Topics", icon: pix("help", 16), go: function () { launch(codex); } },
      { sep: true },
      { label: "&About #GRIDOS '98", go: aboutDialog }
    ];
  }
  function paintMenuBar(w) {
    var names = [["file", "&File"], ["view", "&View"], ["help", "&Help"]];
    EN.ui.clear(w.mb);
    names.forEach(function (n) {
      var b = el("button.w98-mbi", { type: "button", role: "menuitem", "aria-haspopup": "menu",
        onclick: function (e) { e.stopPropagation(); if (MS[0] && MS[0].owner === b) { closeMenus(); return; } barMenu(w, n[0], b); },
        onpointerenter: function () { if (MS[0] && MS[0].bar === w && MS[0].owner !== b) barMenu(w, n[0], b); }
      }, label(n[1]));
      w.mb.appendChild(b);
    });
  }
  function barMenu(w, name, b) {
    closeMenus();
    focusWin(w);
    var r = b.getBoundingClientRect();
    openMenu(menuItemsFor(w, name), r.left, r.bottom, { owner: b, bar: w, below: r.top });
  }

  /* ======================================================================== THE DESKTOP'S ICONS */
  var _sel = null;
  function selectIcon(b) {
    if (_sel && _sel !== b) _sel.classList.remove("w98-sel");
    _sel = b; if (b) b.classList.add("w98-sel");
  }
  function iconList() {
    var out = [{ id: "deck", label: "My Smartdeck", art: pix("deck", 32), go: function (r) { openApp("deck", r); } }];
    if (portal() === "freelancer") out.push({ id: "docs", label: "My Freelancers", art: pix("docs", 32), go: function (r) { openApp("docs", r); } });
    programs().forEach(function (p) { out.push({ id: "p:" + p.key, label: p.label, art: tile32(p), go: function (r) { launch(p.key, r); } }); });
    if (arrangeMode() === "name") out.sort(function (a, b) { return a.label.replace(/^#/, "").localeCompare(b.label.replace(/^#/, ""), undefined, { sensitivity: "base" }); });
    return out;
  }
  function paintIcons() {
    if (!D) return;
    var list = iconList(), sig = deskH() + "|" + list.map(function (i) { return i.id + "=" + i.label; }).join(",");
    if (sig === D.iconSig) return;
    D.iconSig = sig;
    EN.ui.clear(D.icons);
    var per = Math.max(1, Math.floor((deskH() - 6) / ICON_H));
    list.forEach(function (it, i) {
      var b = el("button.w98-di", { type: "button", dataset: { icon: it.id }, title: it.label,
        style: { left: (4 + Math.floor(i / per) * ICON_W) + "px", top: (6 + (i % per) * ICON_H) + "px" },
        onpointerdown: function () { closeMenus(); selectIcon(b); },
        // a double click opens; so does a tap, and Enter or Space (a click with no clicks counted)
        onclick: function (e) { if (e.pointerType === "touch" || (e.detail === 0)) open(); },
        ondblclick: function () { open(); }
      }, [svg(it.art), el("span.w98-dl", { text: it.label })]);
      function open() {
        var r = b.querySelector(".w98-ic").getBoundingClientRect(), o = D.root.getBoundingClientRect();
        it.go({ x: r.left - o.left, y: r.top - o.top, w: r.width });
      }
      b._open = open;
      D.icons.appendChild(b);
    });
  }

  /* ======================================================================== THE TASKBAR */
  function paintQuick() {
    var q = D.bar.querySelector(".w98-quick");
    var first = programs()[0], codex = portal() === "admin" ? "gmcodex" : "codex";
    var sig = (first ? first.key : "") + "|" + codex;
    if (q.getAttribute("data-sig") === sig) return;
    q.setAttribute("data-sig", sig);
    EN.ui.clear(q);
    q.appendChild(el("button.w98-ql", { type: "button", title: "Show Desktop", "aria-label": "Show Desktop", html: pix("desk", 16), onclick: showDesktop }));
    if (first) q.appendChild(el("button.w98-ql", { type: "button", title: first.label, "aria-label": first.label, html: glyph16(first), onclick: function () { launch(first.key); } }));
    if (program(codex).label && first && first.key !== codex) q.appendChild(el("button.w98-ql", { type: "button", title: "Codex", "aria-label": "Codex", html: glyph16(program(codex)), onclick: function () { launch(codex); } }));
  }
  function paintTasks(top) {
    var want = ORDER.slice().sort(function (a, b) { return (W[a].opened || 0) - (W[b].opened || 0); });
    var have = {};
    Array.prototype.forEach.call(D.tasks.children, function (b) { have[b.getAttribute("data-task")] = b; });
    want.forEach(function (id, i) {
      var w = W[id], b = have[id];
      if (!b) {
        b = el("button.w98-task", { type: "button", dataset: { task: id }, onclick: function () { taskClick(id); } }, [el("span.w98-tk-ic"), el("span.w98-tk-l")]);
      }
      delete have[id];
      if (D.tasks.children[i] !== b) D.tasks.insertBefore(b, D.tasks.children[i] || null);
      var t = titleOf(w), ic = icon16(w);
      if (b.querySelector(".w98-tk-l").textContent !== t) { b.querySelector(".w98-tk-l").textContent = t; b.title = t; }
      if (b.querySelector(".w98-tk-ic").getAttribute("data-k") !== ic.length + ":" + w.key) { b.querySelector(".w98-tk-ic").innerHTML = ic; b.querySelector(".w98-tk-ic").setAttribute("data-k", ic.length + ":" + w.key); }
      b.classList.toggle("w98-on", id === top);
      b.setAttribute("aria-pressed", id === top ? "true" : "false");
    });
    Object.keys(have).forEach(function (id) { if (have[id].parentNode) have[id].parentNode.removeChild(have[id]); });
    // a strip that scrolls (a phone with many programs open) keeps the front window's button in view
    var cur = top && D.tasks.querySelector('[data-task="' + top + '"]');
    if (cur && D.tasks.scrollWidth > D.tasks.clientWidth + 1) {
      if (cur.offsetLeft < D.tasks.scrollLeft) D.tasks.scrollLeft = cur.offsetLeft;
      else if (cur.offsetLeft + cur.offsetWidth > D.tasks.scrollLeft + D.tasks.clientWidth) D.tasks.scrollLeft = cur.offsetLeft + cur.offsetWidth - D.tasks.clientWidth;
    }
  }
  var _opened = 0;
  function paintSpeaker() {
    var s = D.tray.querySelector(".w98-spk");
    if (!s) { s = el("button.w98-spk", { type: "button", onclick: function () { store(SOUND_KEY, soundOn() ? "0" : "1"); paintSpeaker(); if (soundOn()) sound("ding"); } }); D.tray.insertBefore(s, D.tray.firstChild); }
    var on = soundOn();
    s.innerHTML = pix(on ? "speaker" : "mute", 16);
    s.title = on ? "Sounds on. Click to mute." : "Sounds muted. Click to turn them on.";
    s.setAttribute("aria-label", s.title);
    s.setAttribute("aria-pressed", on ? "false" : "true");
  }

  /* ======================================================================== DIALOGS
     A dialog is a window of its own over the desktop. Clicking outside it does nothing but ring and flash its title, which
     is exactly what a modal dialog did. */
  var DL = [];
  function closeDialogs() { while (DL.length) { var d = DL.pop(); if (d.node.parentNode) d.node.parentNode.removeChild(d.node); } document.removeEventListener("keydown", dialogKey, true); }
  function dismiss(d) {
    var i = DL.indexOf(d); if (i !== -1) DL.splice(i, 1);
    if (d.node.parentNode) d.node.parentNode.removeChild(d.node);
    if (!DL.length) document.removeEventListener("keydown", dialogKey, true);
    if (d.from && d.from.focus) try { d.from.focus({ preventScroll: true }); } catch (e) {}
  }
  function dialogKey(e) {
    var d = DL[DL.length - 1];
    if (!d) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); var c = d.buttons.filter(function (b) { return b.cancel; })[0]; dismiss(d); if (c && c.go) c.go(); }
    else if (e.key === "Enter" && !(e.target && e.target.tagName === "BUTTON")) { var df = d.buttons.filter(function (b) { return b.def; })[0]; if (df) { e.preventDefault(); dismiss(d); if (df.go) df.go(d); } }
  }
  function dialog(o) {
    closeMenus();
    var d = { buttons: o.buttons || [{ label: "OK", def: true, cancel: true }], from: document.activeElement };
    var btns = d.buttons.map(function (b) {
      return el("button.w98-btn" + (b.def ? ".w98-def" : ""), { type: "button", dataset: { btn: b.label },
        onclick: function () { if (b.keep && b.keep(d) === false) return; dismiss(d); if (b.go) b.go(d); } }, label(b.label));
    });
    var box = el("div.w98-win.w98-dlg", { role: "alertdialog", "aria-modal": "true", "aria-label": o.title, dataset: { dlg: o.id || "" },
      style: { width: (o.width || 360) + "px" } }, [
      el("div.w98-tb", null, [el("span.w98-tt", { text: o.title }),
        el("button.w98-cb.w98-cb-x", { type: "button", "aria-label": "Close", html: CB.close, onclick: function () { var c = d.buttons.filter(function (b) { return b.cancel; })[0]; dismiss(d); if (c && c.go) c.go(); } })]),
      el("div.w98-dbody", null, [o.icon ? el("span.w98-dicon", { html: pix(o.icon, 32) }) : null, el("div.w98-dtext", null, [].concat(o.body))]),
      el("div.w98-dbtns", null, btns)
    ]);
    var scrim = el("div.w98-modal", { onpointerdown: function (e) { if (e.target === scrim) { e.preventDefault(); sound("ding"); flash(box); } } }, [box]);
    if (o.dim) scrim.classList.add("w98-dim");
    d.node = scrim; d.box = box;
    document.body.appendChild(scrim);
    DL.push(d);
    document.addEventListener("keydown", dialogKey, true);
    var focus = box.querySelector(o.focus || ".w98-def") || btns[0];
    if (focus) try { focus.focus({ preventScroll: true }); } catch (e) {}
    if (o.sound !== false) sound(o.sound || (o.icon === "error" ? "chord" : "ding"));
    return d;
  }
  function flash(box) {
    var n = 0, tb = box.querySelector(".w98-tb");
    var t = setInterval(function () { tb.classList.toggle("w98-blink"); if (++n >= 6) { clearInterval(t); tb.classList.remove("w98-blink"); } }, 70);
  }
  function msg(title, text, icon) { return dialog({ title: title, body: text, icon: icon || "info" }); }

  /* ---- About */
  var STAMP = (function () { try { var s = document.currentScript && document.currentScript.src; var m = /[?&]v=([\w.]+)/.exec(s || ""); return m ? m[1] : ""; } catch (e) { return ""; } })();
  function aboutDialog() {
    var n = recordName();
    dialog({ id: "about", title: "About #GRIDOS '98", width: 400, sound: false, body: [
      el("div.w98-about", null, [
        el("span.w98-about-m", { html: mark(40, "#000080") }),
        el("div", null, [
          el("div.w98-about-n", null, [el("b", { text: "#GRID" }), document.createTextNode("OS '98")]),
          el("div", { text: "Elysium Nights Smartdeck OS" }),
          el("div", { text: "Version 1.0" + (STAMP ? ", build " + STAMP : "") }),
          el("div.w98-hr"),
          el("div", { text: "This Smartdeck is licensed to:" }),
          el("div", { style: { paddingLeft: "12px" }, text: n || "An unregistered Freelancer" }),
          el("div.w98-hr"),
          el("div", { text: "Memory available to #GRIDOS: 640K. It will be enough." })
        ].concat(X.about.map(function (fn) { try { return fn(); } catch (e) { return null; } })))
      ])
    ] });
  }

  /* ---- Run */
  function runDialog() {
    var last = store(RUN_KEY) || "";
    var list = el("datalist#w98-run-list", null, programs().map(function (p) { return el("option", { value: p.label }); }));
    var inp = el("input.w98-field", { type: "text", value: last, list: "w98-run-list", "aria-label": "Open", spellcheck: "false" });
    dialog({ id: "run", title: "Run", width: 380, sound: false, focus: ".w98-field", body: [
      el("div.w98-runrow", null, [el("span.w98-runic", { html: pix("run", 32) }),
        el("p", { text: "Type the name of a program, or a roll like 2d6+3, and #GRIDOS will open it for you." })]),
      el("label.w98-runl", null, [el("span", null, label("&Open:")), inp, list])
    ], buttons: [
      { label: "OK", def: true, go: function () { run(inp.value); } },
      { label: "Cancel", cancel: true },
      { label: "&Browse...", go: function () { openApp("deck"); } }
    ] });
    try { inp.select(); } catch (e) {}
  }
  function run(text) {
    var t = String(text || "").trim();
    if (!t) return;
    store(RUN_KEY, t);
    var low = t.toLowerCase().replace(/^#/, "");
    var dice = /^(\d{0,2})\s*d\s*(\d{1,3})\s*(?:([+-])\s*(\d{1,3}))?$/i.exec(t);
    if (dice) {
      var n = Math.max(1, Math.min(20, parseInt(dice[1] || "1", 10))), s = Math.max(2, parseInt(dice[2], 10)), mod = dice[4] ? parseInt(dice[4], 10) * (dice[3] === "-" ? -1 : 1) : 0;
      var rolls = []; for (var i = 0; i < n; i++) rolls.push(1 + Math.floor(Math.random() * s));
      var sum = rolls.reduce(function (a, b) { return a + b; }, 0) + mod;
      msg("Run", "Rolled " + n + "d" + s + (mod ? (mod > 0 ? "+" : "") + mod : "") + ": " + rolls.join(", ") + (mod ? (mod > 0 ? " + " : " - ") + Math.abs(mod) : "") + " = " + sum + ".");
      return;
    }
    var hit = programs().filter(function (p) { return p.label.toLowerCase().replace(/^#/, "") === low || p.key === low; })[0];
    if (hit) { launch(hit.key); return; }
    var named = { "my smartdeck": "deck", "smartdeck": "deck", "my freelancers": "docs", "freelancers": "docs", "find": "find", "search": "find" };
    if (named[low]) { openApp(named[low]); return; }
    if (low === "control" || low === "control panel" || low === "settings") { openSettings(); return; }
    if (low === "winver" || low === "about") { aboutDialog(); return; }
    if (X.runNames[low]) { X.runNames[low](); return; }
    dialog({ id: "runerr", title: t, icon: "error", body: "#GRIDOS cannot find '" + t + "'. Check the name and try again, or type a roll like 2d6+3.",
      buttons: [{ label: "OK", def: true, cancel: true, go: runDialog }] });
  }

  /* ---- Log Off and Shut Down */
  function logOffDialog() {
    var b = [], cloud = EN.cloud && EN.cloud.signedIn && EN.cloud.signedIn();
    if (EN.app.hasAdmin()) b.push(portal() === "admin"
      ? { label: "&Freelancer", def: true, go: function () { EN.app.setPortal("freelancer"); } }
      : { label: "&Admin", def: true, go: function () { EN.app.enterAdmin(); } });
    if (cloud) b.push({ label: "&Jack Out", def: !b.length, go: function () { EN.cloud.jackOut(); } });
    b.push({ label: "Cancel", cancel: true, def: !b.length });
    dialog({ id: "logoff", title: "Log Off #GRIDOS", icon: "question", sound: false, width: 380,
      body: (EN.app.hasAdmin() ? "Leave this desktop for the " + (portal() === "admin" ? "Freelancer" : "Admin") + " desktop?" : "There is no other desktop on this Smartdeck.") +
        (cloud ? " Or jack out, and this device stops syncing your Freelancers." : ""),
      buttons: b });
  }
  function shutDownDialog() {
    var pick = "off";
    function opt(k, text) {
      return el("label.w98-opt", null, [el("input.w98-radio", { type: "radio", name: "w98-shut", value: k, checked: k === pick, onchange: function () { pick = k; } }), el("span", null, label(text))]);
    }
    dialog({ id: "shutdown", title: "Shut Down #GRIDOS", icon: "power", dim: true, sound: false, width: 380, body: [
      el("p", { style: { margin: "0 0 8px" }, text: "What do you want the Smartdeck to do?" }),
      opt("standby", "&Stand by"), opt("off", "Sh&ut down"), opt("restart", "&Restart"), opt("classic", "Restart in &Classic mode")
    ], focus: ".w98-def", buttons: [
      { label: "OK", def: true, go: function () { shutDown(pick); } },
      { label: "Cancel", cancel: true },
      { label: "&Help", go: function () { launch(portal() === "admin" ? "gmcodex" : "codex"); } }
    ] });
  }
  function screen(cls, text, sub, onWake) {
    var s = el("div.w98-screen." + cls, { tabindex: "-1", role: "dialog", "aria-label": text || "Stand by" }, [
      text ? el("p.w98-safe", { text: text }) : null, sub ? el("p.w98-safe-s", { text: sub }) : null
    ]);
    function wake() { document.removeEventListener("keydown", wake, true); if (s.parentNode) s.parentNode.removeChild(s); if (onWake) onWake(); }
    s.addEventListener("pointerdown", wake);
    setTimeout(function () { document.addEventListener("keydown", wake, true); }, 300);
    document.body.appendChild(s);
    try { s.focus({ preventScroll: true }); } catch (e) {}
    return s;
  }
  function shutDown(how) {
    if (how === "classic") { EN.theme.setSkin("classic"); EN.app.render(); return; }
    if (how === "standby") { screen("w98-standby", "", ""); return; }
    sound("stop");
    if (how === "restart") { screen("w98-black", "", ""); setTimeout(function () { location.reload(); }, 900); return; }
    var wait = screen("w98-black", "", "");
    setTimeout(function () {
      if (wait.parentNode) wait.parentNode.removeChild(wait);
      screen("w98-black", "It is now safe to switch off your Smartdeck.", "Click anywhere to start it again.", function () { location.reload(); });
    }, 1200);
  }

  /* ---- things the Start menu opens */
  function openSettings() { closeMenus(); if (X.controlPanel) X.controlPanel(); else if (EN.settings && EN.settings.open) EN.settings.open({ overlay: true }); }
  function newRecord() { if (EN.builder && EN.builder.newRecord) { EN.builder.newRecord(); EN.app.gotoTab("print"); } }
  function afterOpen() { EN.app.gotoTab(EN.app.registered() ? "combat" : "print"); }
  function openRecord(id) { EN.store.setActive(id); afterOpen(); }
  function openExample(k) { EN.store.setExample(k); afterOpen(); }

  /* ======================================================================== THIS FILE'S OWN WINDOWS (always live) */
  function openApp(k, from) {
    closeMenus();
    if (!D || !APPS[k]) return;
    var id = "a:" + k, w = W[id] || makeWin(id, "app", k), was = w.open;
    frameFor(w);
    if (!was) w.opened = ++_opened;
    w.open = true; w.min = false; raise(id);
    if (from) _from = from;
    if (APPS[k].refresh) APPS[k].refresh(w, true);
    layout();
    if (!was) zoomIn(w, true);
    if (APPS[k].focus) APPS[k].focus(w);
  }
  function largeIcons(w, items) {
    EN.ui.clear(w.client);
    var box = el("div.w98-lg", { role: "listbox", "aria-label": titleOf(w) });
    items.forEach(function (it) {
      var b = el("button.w98-lgi", { type: "button", role: "option", title: it.label,
        onpointerdown: function () { Array.prototype.forEach.call(box.querySelectorAll(".w98-sel"), function (x) { x.classList.remove("w98-sel"); }); b.classList.add("w98-sel"); },
        ondblclick: function () { it.go(); },
        onclick: function (e) { if (e.pointerType === "touch" || e.detail === 0) it.go(); }
      }, [svg(it.art), el("span.w98-dl", { text: it.label })]);
      box.appendChild(b);
    });
    w.client.appendChild(box);
    var a = w.sb.querySelector(".w98-sb-a"); a.textContent = items.length + " object" + (items.length === 1 ? "" : "s");
    w.sb.querySelector(".w98-sb-b").style.display = "none";
  }
  var APPS = {
    deck: {
      title: function () { return "My Smartdeck"; }, icon: function (px) { return pix("deck", px); },
      build: function () {},
      refresh: function (w) {
        var items = programs().map(function (p) { return { label: p.label, art: tile32(p), go: function () { launch(p.key); } }; });
        if (portal() === "freelancer") items.push({ label: "My Freelancers", art: pix("docs", 32), go: function () { openApp("docs"); } });
        items.push({ label: "Control Panel", art: pix("panel", 32), go: openSettings });
        var sig = items.map(function (i) { return i.label; }).join("|");
        if (w._sig === sig) return; w._sig = sig;
        largeIcons(w, items);
      }
    },
    docs: {
      title: function () { return "My Freelancers"; }, icon: function (px) { return pix("docs", px); },
      build: function () {},
      refresh: function (w) {
        var roster = EN.store.roster(), ids = Object.keys(roster || {});
        var items = ids.map(function (id) { var r = roster[id]; return { label: typeof r.name === "string" && r.name ? r.name : "Unnamed Freelancer", art: docIcon(32), go: function () { openRecord(id); } }; });
        (EN.examples || []).forEach(function (x) { items.push({ label: x.name + " (example)", art: docIcon(32), go: function () { openExample(x.key); } }); });
        items.push({ label: "New Freelancer", art: pix("page", 32), go: newRecord });
        var sig = items.map(function (i) { return i.label; }).join("|");
        if (w._sig === sig) return; w._sig = sig;
        largeIcons(w, items);
      }
    },
    find: {
      title: function () { return "Find: Rules, Gear and People"; }, icon: function (px) { return pix("find", px); },
      build: function (w) {
        var inp = el("input.w98-field", { type: "text", "aria-label": "Named", spellcheck: "false", onkeydown: function (e) { if (e.key === "Enter") { e.preventDefault(); go(); } } });
        var list = el("div.w98-list", { role: "listbox", "aria-label": "Results" });
        function go() {
          var q = inp.value.trim(), res = [];
          if (q && EN.w98.moment) EN.w98.moment("find");   // Gizmo: a search in progress (js/w98_gizmo_events.js)
          try { res = EN.deck && EN.deck.find && q ? EN.deck.find.results(q) : []; } catch (e) { res = []; }
          EN.ui.clear(list);
          list.appendChild(el("div.w98-lh", null, [el("span", { text: "Name" }), el("span", { text: "In Folder" })]));
          res.forEach(function (r) {
            var row = el("button.w98-lr", { type: "button", role: "option", title: r.title,
              onclick: function () { Array.prototype.forEach.call(list.querySelectorAll(".w98-sel"), function (x) { x.classList.remove("w98-sel"); }); row.classList.add("w98-sel"); },
              ondblclick: function () { r.go(); },
              onkeydown: function (e) { if (e.key === "Enter") { e.preventDefault(); r.go(); } }
            }, [el("span", { text: r.title + (r.count > 1 ? " (" + r.count + ")" : "") }), el("span", { text: [r.group, r.hint].filter(Boolean).join(", ") })]);
            list.appendChild(row);
          });
          w.sb.querySelector(".w98-sb-a").textContent = q ? res.length + " item" + (res.length === 1 ? "" : "s") + " found" : "Type a name, then Find Now";
        }
        w.client.appendChild(el("div.w98-find", null, [
          el("div.w98-tabs", null, [el("span.w98-tab.w98-tab-on", null, label("&Name"))]),
          el("div.w98-tabpane", null, [el("label.w98-runl", null, [el("span", null, label("&Named:")), inp])]),
          el("div.w98-findb", null, [
            el("button.w98-btn.w98-def", { type: "button", onclick: go }, label("F&ind Now")),
            el("button.w98-btn", { type: "button", onclick: function () { inp.value = ""; go(); try { inp.focus(); } catch (e) {} } }, label("Ne&w Search"))
          ]),
          list
        ]));
        w.sb.querySelector(".w98-sb-b").style.display = "none";
        w._inp = inp; w._go = go;
        go();
      },
      focus: function (w) { try { w._inp.focus({ preventScroll: true }); } catch (e) {} }
    }
  };

  /* ======================================================================== KEYS AND THE BOOT SCREEN */
  document.addEventListener("keydown", function (e) {
    if (!D || !is98()) return;
    if (e.key === "Escape" && MS.length) { e.preventDefault(); e.stopPropagation(); closeMenus(MS.length - 1); return; }
    if (e.key === "Escape" && e.ctrlKey) { e.preventDefault(); if (MS.length) closeMenus(); else openStart(); return; }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && String(e.key).toLowerCase() === "k") { e.preventDefault(); openApp("find"); return; }
    if (MS.length && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "ArrowLeft" || (e.key.length === 1 && /\w/.test(e.key)))) {
      var m = MS[MS.length - 1], rows = Array.prototype.slice.call(m.node.querySelectorAll(".w98-mi:not([disabled])"));
      var i = rows.indexOf(document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); var n = rows[(i + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length]; if (n) n.focus(); return; }
      if (e.key === "ArrowRight" && i !== -1 && rows[i]._it.sub) { e.preventDefault(); openSub(rows[i], rows[i]._it, MS.length - 1); focusFirst(MS[MS.length - 1].node); return; }
      if (e.key === "ArrowLeft" && MS.length > 1) { e.preventDefault(); var own = MS[MS.length - 1].owner; closeMenus(MS.length - 1); if (own) own.focus(); return; }
      var hit = rows.filter(function (r) { return r.getAttribute("data-k") === e.key.toLowerCase(); })[0];
      if (hit) { e.preventDefault(); hit.click(); if (MS.length && hit._it.sub) focusFirst(MS[MS.length - 1].node); }
    }
  }, true);
  // the boot screen's art, drawn into #boot now; css/w98.css shows it on '98 alone
  (function dressBoot() {
    var b = document.getElementById("boot");
    if (!b || b.querySelector(".w98-boot")) return;
    b.appendChild(el("div.w98-boot", { "aria-hidden": "true" }, [
      el("div.w98-boot-grid"),
      el("div.w98-boot-lock", null, [
        el("span.w98-boot-m", { html: mark(96, "#fff") }),
        el("span.w98-boot-w", null, [el("b", { text: "#GRID" }), el("i", { text: "OS" }), el("em", { text: "'98" })])
      ]),
      el("div.w98-boot-sub", { text: "ELYSIUM NIGHTS SMARTDECK OS" }),
      el("div.w98-boot-go", { text: "Starting #GRIDOS '98..." }),
      el("div.w98-boot-band")
    ]));
  })();
  // app.js calls this as the desktop is revealed: the start-up chord, if the browser lets a page make a sound yet
  function booted() {
    if (!is98()) return;
    X.boot.forEach(function (fn) { try { fn(); } catch (e) {} });
    try { if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; } catch (e) {}
    sound("start");
  }

  return {
    chrome: chrome, beforeRender: beforeRender, restoreScroll: restoreScroll, scroller: scroller, booted: booted,
    // for the tests, and for anything else that wants to drive the desktop
    openStart: openStart, closeMenus: closeMenus, openApp: openApp, launch: launch, run: run,
    minimize: function (id) { if (W[id]) minimize(W[id]); }, restore: function (id) { if (W[id]) restore(W[id]); },
    toggleMax: function (id) { if (W[id]) toggleMax(W[id]); }, close: function (id) { if (W[id]) closeWin(W[id]); },
    focus: function (id) { if (W[id]) focusWin(W[id]); }, taskClick: taskClick, showDesktop: showDesktop,
    state: function () {
      return { live: LIVE, top: topId(), order: ORDER.slice(), wins: Object.keys(W).map(function (id) { var w = W[id]; return { id: id, open: w.open, min: w.min, max: maxed(w), x: w.x, y: w.y, w: w.w, h: w.h }; }) };
    },
    ext: X,
    kit: {
      el: el, label: label, dialog: dialog, msg: msg, openMenu: openMenu, closeMenus: closeMenus, pix: pix, PIX: PIX, mark: mark, sound: sound, soundOn: soundOn,
      store: store, APPS: APPS, openApp: openApp, launch: launch, programs: programs, portal: portal, reduced: reduced, is98: is98,
      tile32: tile32, glyph16: glyph16, closeApp: function (k) { if (W["a:" + k]) closeWin(W["a:" + k]); }, winOf: function (id) { return W[id] || null; },
      active: function () { return !!D && is98(); }, openSettings: openSettings, recordName: recordName, deskSize: function () { return { w: deskW(), h: deskH() }; }
    },
    sound: sound, soundOn: soundOn, aboutDialog: aboutDialog, runDialog: runDialog, shutDownDialog: shutDownDialog, logOffDialog: logOffDialog, closeDialogs: closeDialogs
  };
})();
