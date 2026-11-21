/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDOS '98, THE PLAYFUL EXTRAS (phase 4 of the redesign, 21 Nov 2026).
   A screen saver you can turn on, a Tip of the Day, an error box for a natural 1, the visitor counter (on the desktop and in About), and
   Breach, a small game of its own; Gizmo (js/w98_gizmo.js) and the Control Panel (js/w98_cpanel.js) are their own files. All of it hangs on js/w98.js through EN.w98.ext (menu lists) and EN.w98.kit (its dialogs, menus and sounds), so
   the desktop stays the desktop; none of it runs on another skin.

   Original work only. Breach is a sweeper-genre game (find the hidden ICE from the counts around it) in its own dress: its own name,
   glyphs, colours and screen, none of the look of any game that shipped with a desktop of the era. The error box is a joke about the
   die, in its own words, not a copy of any system's message. No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
(function () {
  if (!EN.w98 || !EN.w98.kit) return;
  var K = EN.w98.kit, X = EN.w98.ext, el = K.el, store = K.store;
  function on(k, def) { var v = store(k); return v == null ? def : v !== "0"; }

  /* two more pixel icons, drawn here: a lit bulb, and a crystal of ICE */
  K.PIX.bulb = '<circle cx="8" cy="6" r="4.5" fill="#ffee55" stroke="#000"/><path d="M6.2 5.4Q8 3.4 9.8 5.4" stroke="#fff" fill="none"/><rect x="6" y="10.5" width="4" height="3.5" fill="#808080" stroke="#000" stroke-width=".8"/><rect x="6.6" y="11.6" width="2.8" height=".8" fill="#000"/>';
  K.PIX.ice = '<path d="M8 1l2.2 4.8L15 8l-4.8 2.2L8 15l-2.2-4.8L1 8l4.8-2.2z" fill="#b00000" stroke="#000" stroke-width=".8"/><circle cx="8" cy="8" r="1.6" fill="#fff"/>';

  /* ======================================================================== THE SCREEN SAVER
     Off until you ask (Start, Settings, Screen Saver): a sheet read slowly over a long turn is not idle. After the minutes you
     pick without a press, a key, a wheel or a touch, the desktop goes black and the #GRIDOS mark drifts about the screen,
     changing colour at every wall. Any input wakes it, and a key or a click is eaten, so it never does anything twice. */
  var SS = { key: "en_w98_ss_v1", timer: null, el: null, iv: null, p: null, last: 0 };
  function ssMins() { var n = parseInt(store(SS.key) || "0", 10); return n > 0 ? n : 0; }
  function ssSet(m) { store(SS.key, String(m)); ssArm(); }
  function ssArm() {
    clearTimeout(SS.timer);
    var m = ssMins();
    if (!m || SS.el || !K.active()) return;
    SS.timer = setTimeout(ssStart, m * 60000);
  }
  function ssStart() {
    if (SS.el || !K.active()) return;
    K.closeMenus();
    var logo = el("div.w98-saver-logo", { html: K.mark(44, "currentColor") + "<span><b>#GRID</b>OS '98</span>" });
    var box = el("div.w98-saver", { role: "presentation" }, [logo]);
    document.body.appendChild(box);
    SS.el = box; SS.p = null;
    var W = box.clientWidth || window.innerWidth, H = box.clientHeight || window.innerHeight, lw = logo.offsetWidth, lh = logo.offsetHeight;
    var x = Math.random() * Math.max(1, W - lw), y = Math.random() * Math.max(1, H - lh), vx = 2.4, vy = 1.9, ci = 0;
    var COL = ["#ffffff", "#00ffff", "#ff66cc", "#ffee00", "#66ff66"];
    function place() { logo.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)"; logo.setAttribute("data-x", Math.round(x)); }
    function step() {
      x += vx; y += vy;
      var hit = false;
      if (x <= 0) { x = 0; vx = Math.abs(vx); hit = true; } else if (x + lw >= W) { x = W - lw; vx = -Math.abs(vx); hit = true; }
      if (y <= 0) { y = 0; vy = Math.abs(vy); hit = true; } else if (y + lh >= H) { y = H - lh; vy = -Math.abs(vy); hit = true; }
      if (hit) { ci = (ci + 1) % COL.length; logo.style.color = COL[ci]; }
      place();
    }
    logo.style.color = COL[0];
    if (K.reduced()) { x = (W - lw) / 2; y = (H - lh) / 2; place(); } else { place(); SS.iv = setInterval(step, 30); }
  }
  function ssWake() {
    clearInterval(SS.iv); SS.iv = null;
    if (SS.el && SS.el.parentNode) SS.el.parentNode.removeChild(SS.el);
    SS.el = null; SS.p = null;
    ssArm();
  }
  function ssAct(e) {
    if (SS.el) {
      if (e.type === "pointermove") {
        var p = [e.clientX, e.clientY];
        if (!SS.p) { SS.p = p; return; }
        if (Math.abs(p[0] - SS.p[0]) + Math.abs(p[1] - SS.p[1]) < 8) return;
      }
      if (e.type !== "pointermove") { e.stopPropagation(); if (e.cancelable) e.preventDefault(); }
      ssWake();
      return;
    }
    var now = Date.now();
    if (now - SS.last < 1000) return;
    SS.last = now;
    ssArm();
  }
  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach(function (t) { document.addEventListener(t, ssAct, true); });
  X.settings.push(function () {
    var m = ssMins();
    function opt(min, text) { return { label: text, check: m === min, radio: true, go: function () { ssSet(min); } }; }
    return [{ label: "Screen &Saver", icon: K.pix("desk", 16), sub: [
      opt(0, "&None"), opt(1, "After &1 minute"), opt(5, "After &5 minutes"), opt(10, "After 1&0 minutes"), { sep: true },
      { label: "&Preview", go: ssStart }
    ] }];
  });
  X.runNames["screensaver"] = X.runNames["screen saver"] = ssStart;
  function group(legend, kids) { return el("fieldset.w98-grp", null, [el("legend", { text: legend })].concat(kids)); }
  function field(text, control) { return el("label.w98-ps-field", null, [el("span", null, K.label(text)), control]); }
  // Display Properties, Screen Saver tab (js/w98_cpanel.js asks X.display for tabs)
  X.display.push({ name: "Screen Saver", build: function () {
    var m = ssMins();
    var which = el("select", { "aria-label": "Screen Saver" }, [el("option", { value: "none", selected: !m, text: "(None)" }), el("option", { value: "mark", selected: !!m, text: "#GRIDOS Mark" })]);
    var wait = el("select", { "aria-label": "Wait", disabled: !m }, [1, 5, 10].map(function (n) { return el("option", { value: String(n), selected: (m || 5) === n, text: n + (n === 1 ? " minute" : " minutes") }); }));
    which.onchange = function () { var on = which.value === "mark"; wait.disabled = !on; ssSet(on ? parseInt(wait.value, 10) : 0); };
    wait.onchange = function () { ssSet(parseInt(wait.value, 10)); };
    return [
      el("div.w98-monitor", { "aria-hidden": "true" }, [el("div.w98-monitor-s", null, [el("span", { html: K.mark(26, "currentColor") })])]),
      group("Screen saver", [field("&Screen Saver:", which), field("&Wait:", wait), el("div.w98-ps-btns", null, [el("button.btn.sm", { type: "button", onclick: ssStart }, "Preview")])]),
      el("p.set-hint", { text: "The screen saver comes up after the wait without a key, a click or a touch. Any of them wakes it." })
    ];
  } });

  /* ======================================================================== TIP OF THE DAY
     Every sentence is true of this desktop. Shown once a session at start-up, until the box under it is unticked. */
  var TIPS = [
    "Press Ctrl+K from anywhere on the desktop to find a rule, a piece of your gear or someone you know.",
    "Start, Run understands dice. Type 2d6+3 and it rolls them.",
    "Double-click a window's title bar to fill the screen with it. Double-click it again to put it back.",
    "Where you put a window is remembered on this device, so the desktop is as you left it.",
    "The Show Desktop button beside Start puts every window away. Press it again to bring them all back.",
    "Click the speaker beside the clock to mute the sounds. Click it again to hear them.",
    "A window behind the others shows the last thing it drew. Click it and it comes alive.",
    "Start, Documents lists your Freelancers. Click one to open it, or add a new one from the same menu.",
    "The Codex is under Start, Help. On the Admin desktop it holds the Game Master's chapters too.",
    "Right-click the desktop to arrange the icons by name, or to open the Properties.",
    "Start, Settings, Screen Saver puts a drifting #GRIDOS on the screen after a few quiet minutes.",
    "There is a game under Start, Programs, Games. Breach is one of the few things on this Smartdeck with no rules to look up.",
    "Start, Shut Down, Restart in Classic mode takes you back to the look this sheet shipped with."
  ];
  var TIPS_KEY = "en_w98_tips_v1", TIPIX_KEY = "en_w98_tipix_v1";
  function showTip() {
    if (!K.active() || document.querySelector('.w98-dlg[data-dlg="tip"]')) return;
    var ix = (parseInt(store(TIPIX_KEY) || "0", 10) || 0) % TIPS.length;
    var txt = el("p.w98-tip-t", { text: TIPS[ix] });
    var chk = el("input.w98-chk", { type: "checkbox", id: "w98-tip-chk", checked: on(TIPS_KEY, true), onchange: function () { store(TIPS_KEY, chk.checked ? "1" : "0"); } });
    function advance() { ix = (ix + 1) % TIPS.length; store(TIPIX_KEY, String(ix)); }
    K.dialog({ id: "tip", title: "Tip of the Day", width: 430, sound: false, body: [
      el("div.w98-tip", null, [
        el("span.w98-tip-ic", { html: K.pix("bulb", 32) }),
        el("div.w98-tip-b", null, [el("div.w98-tip-h", { text: "Did you know..." }), txt])
      ]),
      el("label.w98-tip-c", null, [chk, el("span", null, K.label("&Show tips at start-up"))])
    ], buttons: [
      { label: "&Next Tip", keep: function () { advance(); txt.textContent = TIPS[ix]; return false; } },
      { label: "Close", def: true, cancel: true, go: advance }
    ] });
  }
  function nextTip() {
    var ix = (parseInt(store(TIPIX_KEY) || "0", 10) || 0) % TIPS.length;
    store(TIPIX_KEY, String((ix + 1) % TIPS.length));
    return TIPS[ix];
  }
  X.boot.push(function () {
    if (!on(TIPS_KEY, true)) return;
    try { if (sessionStorage.getItem("en_w98_tip_shown")) return; sessionStorage.setItem("en_w98_tip_shown", "1"); } catch (e) {}
    setTimeout(showTip, 700);
  });
  X.settings.push(function () {
    return [{ label: "&Tips at start-up", check: on(TIPS_KEY, true), go: function () { store(TIPS_KEY, on(TIPS_KEY, true) ? "0" : "1"); } }];
  });
  X.runNames["tip"] = X.runNames["tip of the day"] = X.runNames["tips"] = showTip;
  function checkRow(text, get, set, hint) {
    var box = el("input.w98-chk", { type: "checkbox", checked: !!get(), onchange: function () { set(box.checked); } });
    return el("div.w98-ps-row", null, [el("label.w98-tip-c", { style: { marginTop: "0" } }, [box, el("span", null, K.label(text))]), hint ? el("p.set-hint", { style: { margin: "3px 0 0 21px" }, text: hint }) : null]);
  }
  X.cplExtras.push(function () {
    return [checkRow("Show &tips at start-up", function () { return on(TIPS_KEY, true); }, function (v) { store(TIPS_KEY, v ? "1" : "0"); }, "One Tip of the Day when the desktop starts, once a session.")];
  });

  /* ======================================================================== THE FUMBLE ERROR
     combat.js calls EN.w98.fumble when a roll settles on a natural 1. On '98, with the joke left on, the die crashes. Not on any
     other skin, and not from a roll nobody is watching: the box waits for the die to finish turning. */
  var FUM_KEY = "en_w98_fumble_v1";
  function showFumble(roll) {
    if (!K.active() || document.querySelector('.w98-dlg[data-dlg="fumble"]')) return;
    var det = el("pre.w98-code", { style: { display: "none" }, text: "Fatal exception 01 at 0028:0001A20C\nModule LUCK.DLL (01) + 000041A2\nThe die read " + ((roll && roll.nat) || 1) + "\nStack  FORTUNE > FATE > D20" });
    K.dialog({ id: "fumble", title: "FORTUNE", icon: "error", width: 410, body: [
      el("p", { text: "A fatal error has occurred in module LUCK.DLL. The roll was terminated." }),
      el("p", { style: { marginTop: "8px" }, text: "A natural 1 was found. Close this box, or ignore the error and hope." }),
      det
    ], buttons: [
      { label: "Close", def: true, cancel: true, go: function () { if (EN.w98.say) EN.w98.say("A natural 1. The die did that. I saw nothing."); } },
      { label: "&Details >>", keep: function () { det.style.display = det.style.display === "none" ? "block" : "none"; return false; } }
    ] });
  }
  EN.w98.fumble = function (ctx, roll) {
    if (!K.active() || !on(FUM_KEY, true)) return false;
    setTimeout(function () { showFumble(roll); }, 450);
    return true;
  };
  X.settings.push(function () {
    return [{ label: "&Fumble errors", check: on(FUM_KEY, true), go: function () { store(FUM_KEY, on(FUM_KEY, true) ? "0" : "1"); } }];
  });
  X.cplExtras.push(function () {
    return [checkRow("Show an &error box for a natural 1", function () { return on(FUM_KEY, true); }, function (v) { store(FUM_KEY, v ? "1" : "0"); }, "The die crashes, with details. A joke, and only on this desktop.")];
  });

  /* ======================================================================== THE VISITOR COUNTER, in About
     The same count as ever: times this app has been opened on this device (js/app.js countVisit). Real, not a joke number. */
  X.about.push(function () {
    var n = (parseInt(store("en_visits_v1") || "1", 10) || 1) % 1000000, s = String(n);
    while (s.length < 6) s = "0" + s;
    return el("div.w98-vis", null, [
      el("span", { text: "You are visitor number" }),
      el("span.w98-vis-d", null, s.split("").map(function (d) { return el("i", { text: d }); }))
    ]);
  });

  /* THE COUNTER ON THE DESKTOP, bottom right, under the windows: the same real count, in the odometer cells the hit counters of the
     era had. A right-click on the desktop, or the Control Panel, puts it away. */
  var CNT_KEY = "en_w98_counter_v1";
  function visitDigits() {
    var n = (parseInt(store("en_visits_v1") || "1", 10) || 1) % 1000000, s = String(n);
    while (s.length < 6) s = "0" + s;
    return s;
  }
  function counterPaint() {
    var root = document.getElementById("w98");
    if (!root || !K.active()) return;
    var w = root.querySelector(".w98-hits");
    if (!on(CNT_KEY, true)) { if (w) w.parentNode.removeChild(w); return; }
    var d = visitDigits();
    if (!w) {
      w = el("div.w98-hits", { title: "Times this Smartdeck has been opened on this device" }, [el("span", { text: "visitors since 1998" }), el("span.w98-vis-d")]);
      root.insertBefore(w, root.querySelector(".w98-wins"));
    }
    var cell = w.querySelector(".w98-vis-d");
    if (cell.getAttribute("data-n") !== d) { EN.ui.clear(cell); d.split("").forEach(function (c) { cell.appendChild(el("i", { text: c })); }); cell.setAttribute("data-n", d); }
  }
  X.paint.push(counterPaint);
  X.desktop.push(function () { return [{ sep: true }, { label: "Visitor &Counter", check: on(CNT_KEY, true), go: function () { store(CNT_KEY, on(CNT_KEY, true) ? "0" : "1"); counterPaint(); } }]; });
  X.cplExtras.push(function () {
    return [checkRow("Show the &visitor counter on the desktop", function () { return on(CNT_KEY, true); }, function (v) { store(CNT_KEY, v ? "1" : "0"); counterPaint(); }, "How many times this Smartdeck has been opened on this device. A real count.")];
  });

  /* ======================================================================== BREACH
     A grid of nodes, some of them ICE. Open a node and it shows how many of the eight around it are ICE; open an ICE and the
     run is over. Mark the nodes you think are ICE (right-click, the F key, or the Mark button on a phone). Your first open is
     always safe. Open every node that is not ICE to breach the grid. Best times are kept per size on this device. */
  var BR_KEY = "en_w98_breach_v1", BR_SIZE = "en_w98_breach_size_v1";
  var SIZES = { s: { c: 8, r: 8, n: 10, name: "Small" }, m: { c: 10, r: 10, n: 16, name: "Medium" }, l: { c: 12, r: 12, n: 28, name: "Large" } };
  function bests() { try { var v = JSON.parse(store(BR_KEY) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }
  var FLAG = '<svg viewBox="0 0 16 16" width="14" height="14" shape-rendering="crispEdges"><rect x="3" y="2" width="1.6" height="12" fill="#000"/><path d="M4.6 2.5h8L9.8 5.2 12.6 8h-8z" fill="#e0a000" stroke="#000" stroke-width=".7"/></svg>';
  var CRYSTAL = '<svg viewBox="0 0 16 16" width="16" height="16">' + K.PIX.ice + '</svg>';
  var CROSS = '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 3l10 10M13 3L3 13" stroke="#c00000" stroke-width="2"/></svg>';

  K.APPS.breach = {
    size: [400, 540],
    title: function () { return "Breach"; },
    icon: function (px) { return K.pix("ice", px); },
    closed: function (w) { if (w._g) clearInterval(w._g.tm); },
    build: function (w) {
      w.client.classList.add("w98-bclient");
      var kind = store(BR_SIZE); if (!SIZES[kind]) kind = "s";
      var G = w._g = { kind: kind, cells: [], tm: null, mark: false };
      var sel = el("select", { "aria-label": "Size", onchange: function () { G.kind = sel.value; store(BR_SIZE, G.kind); fresh(); } },
        Object.keys(SIZES).map(function (k) { var z = SIZES[k]; return el("option", { value: k, selected: k === G.kind, text: z.name + " (" + z.c + " by " + z.r + ", " + z.n + " ICE)" }); }));
      var left = el("span.w98-bn", { text: "" }), clock = el("span.w98-bn", { text: "" });
      var markBtn = el("button.btn.sm", { type: "button", "aria-pressed": "false", title: "Mark nodes you think are ICE instead of opening them (the F key, or a right-click, does the same)", onclick: function () {
        G.mark = !G.mark; markBtn.setAttribute("aria-pressed", String(G.mark)); markBtn.classList.toggle("w98-mark-on", G.mark);
      } }, "Mark");
      var grid = el("div.w98-bgrid", { role: "grid", "aria-label": "Breach" });
      var msg = el("div.w98-bmsg", { role: "status", "aria-live": "polite" });
      w.client.appendChild(el("div.w98-b", null, [
        el("div.w98-brow", null, [sel, el("button.btn.sm", { type: "button", onclick: function () { fresh(); } }, "New Game"), markBtn]),
        el("div.w98-brow.w98-bstat", null, [el("span", null, ["ICE left ", left]), el("span", null, ["Time ", clock])]),
        el("div.w98-bwrap", null, [grid]),
        msg
      ]));
      function paintHead() {
        var z = SIZES[G.kind], b = bests()[G.kind];
        left.textContent = String(z.n - G.flags);
        clock.textContent = String(G.secs || 0) + " s";
        w.sb.querySelector(".w98-sb-a").textContent = z.name + (typeof b === "number" ? ", best " + b + " s" : ", no best time yet");
        w.sb.querySelector(".w98-sb-b").style.display = "none";
      }
      function nb(i) {
        var z = SIZES[G.kind], x = i % z.c, y = Math.floor(i / z.c), out = [];
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          var nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < z.c && ny < z.r) out.push(ny * z.c + nx);
        }
        return out;
      }
      function paint(i) {
        var c = G.cells[i], b = c.b;
        b.className = "w98-bc" + (c.open ? " on" : "") + (c.open && c.n > 0 ? " n" + c.n : "") + (c.flag ? " flag" : "") + (c.show ? " ice" : "") + (c.wrong ? " wrong" : "");
        b.innerHTML = c.wrong ? CROSS : c.show ? CRYSTAL : c.flag ? FLAG : (c.open && c.n > 0 ? String(c.n) : "");
        b.setAttribute("aria-label", c.open ? (c.n ? c.n + " ICE around" : "clear") : c.flag ? "marked" : "closed");
      }
      function fresh() {
        clearInterval(G.tm); G.tm = null;
        var z = SIZES[G.kind];
        G.cells = []; G.started = false; G.over = false; G.flags = 0; G.opened = 0; G.secs = 0;
        EN.ui.clear(grid);
        grid.style.gridTemplateColumns = "repeat(" + z.c + ", 26px)";
        for (var i = 0; i < z.c * z.r; i++) (function (i) {
          var b = el("button.w98-bc", { type: "button", dataset: { i: i },
            onclick: function () { if (G.mark) toggle(i); else open(i); },
            oncontextmenu: function (e) { e.preventDefault(); toggle(i); },
            onkeydown: function (e) { if (e.key === "f" || e.key === "F") { e.preventDefault(); toggle(i); } }
          });
          G.cells.push({ b: b, ice: false, open: false, flag: false, n: 0, show: false, wrong: false });
          grid.appendChild(b);
        })(i);
        G.cells.forEach(function (c, i) { paint(i); });
        msg.textContent = "Open a node to begin. The first one is always safe.";
        paintHead();
      }
      function plant(safe) {
        var z = SIZES[G.kind], keep = {}; keep[safe] = 1; nb(safe).forEach(function (j) { keep[j] = 1; });
        var pool = []; for (var i = 0; i < z.c * z.r; i++) if (!keep[i]) pool.push(i);
        for (var k = 0; k < z.n && pool.length; k++) { var at = Math.floor(Math.random() * pool.length); G.cells[pool[at]].ice = true; pool.splice(at, 1); }
        G.cells.forEach(function (c, i) { c.n = nb(i).filter(function (j) { return G.cells[j].ice; }).length; });
      }
      function toggle(i) {
        var c = G.cells[i]; if (G.over || c.open) return;
        c.flag = !c.flag; G.flags += c.flag ? 1 : -1; paint(i); paintHead();
      }
      function open(i) {
        var c = G.cells[i]; if (G.over || c.open || c.flag) return;
        if (!G.started) {
          G.started = true; plant(i);
          G.tm = setInterval(function () { G.secs++; paintHead(); }, 1000);
          msg.textContent = "A number counts the ICE in the eight nodes around it. Mark what you think is ICE.";
        }
        if (c.ice) { lose(i); return; }
        var stack = [i];
        while (stack.length) {
          var j = stack.pop(), d = G.cells[j];
          if (d.open || d.flag || d.ice) continue;
          d.open = true; G.opened++; paint(j);
          if (d.n === 0) nb(j).forEach(function (q) { if (!G.cells[q].open) stack.push(q); });
        }
        var z = SIZES[G.kind];
        if (G.opened === z.c * z.r - z.n) win();
      }
      function end() { G.over = true; clearInterval(G.tm); G.tm = null; }
      function lose(hit) {
        end();
        G.cells.forEach(function (c, i) {
          if (c.ice && !c.flag) { c.show = true; paint(i); }
          else if (!c.ice && c.flag) { c.wrong = true; paint(i); }
        });
        G.cells[hit].b.classList.add("hit");
        msg.textContent = "ICE tripped. The run is over.";
        K.dialog({ id: "breach-lose", title: "Breach", icon: "error", width: 340, body: "You opened a node that was ICE. It had been waiting for you.",
          buttons: [{ label: "OK", def: true, cancel: true, go: function () { if (EN.w98.say) EN.w98.say("That one was ICE. It usually is."); } }, { label: "&New Game", go: fresh }] });
      }
      function win() {
        end();
        G.cells.forEach(function (c, i) { if (c.ice && !c.flag) { c.flag = true; G.flags++; paint(i); } });
        var b = bests(), had = b[G.kind];
        var better = typeof had !== "number" || G.secs < had;
        if (better) { b[G.kind] = G.secs; store(BR_KEY, JSON.stringify(b)); }
        msg.textContent = "Grid breached in " + G.secs + " s.";
        paintHead();
        K.dialog({ id: "breach-win", title: "Breach", icon: "info", width: 340, sound: false,
          body: "Grid breached in " + G.secs + " seconds." + (better ? " That is a new best for this size." : ""),
          buttons: [{ label: "OK", def: true, cancel: true, go: function () { if (EN.w98.say) EN.w98.say("Grid breached. I knew you had it."); } }, { label: "&New Game", go: fresh }] });
        K.sound("ding");
      }
      fresh();
    }
  };
  X.programs.push(function () {
    return [{ label: "&Games", icon: K.pix("folder", 16), sub: [{ label: "&Breach", icon: K.pix("ice", 16), go: function () { K.openApp("breach"); } }] },
            { label: "&Accessories", icon: K.pix("folder", 16), sub: [{ label: "&Tip of the Day", icon: K.pix("bulb", 16), go: showTip }] }];
  });
  X.runNames["breach"] = function () { K.openApp("breach"); };

  EN.w98.extras = { showTip: showTip, nextTip: nextTip, ssStart: ssStart, ssWake: ssWake, ssActive: function () { return !!SS.el; }, tips: TIPS.length };
})();
