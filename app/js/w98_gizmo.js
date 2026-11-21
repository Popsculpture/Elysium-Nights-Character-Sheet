/* ===========================================================================
   ELYSIUM NIGHTS · #GRIDOS '98, GIZMO ON THE DESKTOP (phase 4, 21 Nov 2026, the author: "Gizmo as an assistant").
   Gizmo, the off-brand paperclip who walks the character-creation tour (js/tour.js, drawn by js/gate.js), lives in the corner of the
   '98 desktop. He is drawn from the author's own drawing (EN.gate.gizmoSvg), blink and all. He says hello, offers a tip when pressed,
   says a word about a program the first time you open it in a session, and has an opinion about a natural 1. Drag him out of the way;
   press him for his menu; turn him off in the Control Panel. He says only what is true of this app, and he never speaks over a dialog.

   Original work: the character is the author's own. No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
(function () {
  if (!EN.w98 || !EN.w98.kit || !EN.gate || !EN.gate.gizmoSvg) return;
  var K = EN.w98.kit, X = EN.w98.ext, el = K.el, store = K.store;
  var KEY = "en_w98_gizmo_v1", MET = "en_w98_gizmo_met_v1", POS = "en_w98_gizmo_pos_v1";
  var G = { box: null, fig: null, bubble: null, txt: null, timer: null, seen: {}, hidden: false, last: 0 };

  function on() { return store(KEY) !== "0"; }
  function setOn(v) { store(KEY, v ? "1" : "0"); G.hidden = false; paint(); }

  /* what he says about a program the first time it is opened: a sentence each, all of it true of that program */
  var HINT = {
    combat: "This is the HUD. Short Rest, Long Rest and Downtime are along the top.",
    face: "Social keeps how each room reads you, and the people you know.",
    grid: "Run Mode sets what a roll is: a d20 in a combat round, a dice pool outside one.",
    flow: "Flow is for whoever can shape. Your Reservoir and your patterns live here.",
    gear: "The Stash has your gear, your bills, the Workbench and the Gray Market.",
    codex: "The Codex has the rules. Search it, or open a chapter from the buttons.",
    print: "#PRINT is your identity record. The steps along the top walk you through it.",
    post: "#POST is the campaign's chat and mail.",
    sysop: "Sysop is the table itself: crew, house rules, data and the campaign.",
    table: "The Table holds initiative and the crew.",
    scenes: "Scenes are the sit-downs, chases and incursions that are not a fight.",
    gmpost: "#POST is your mail to the crew, and theirs to you.",
    jobs: "The Job Board rolls the jobs and lists the postings.",
    encounters: "Encounters budgets a fight against the crew.",
    threats: "Threats has the bestiary, the builder, your saved statblocks and the hazards.",
    people: "People are the contacts who are not in initiative.",
    downtime: "Downtime pays the crew and checks their Heat.",
    gmcodex: "The Codex here has the Game Master's chapters as well."
  };
  X.open.push(function (key) {
    if (!on() || G.hidden || G.seen[key] || !HINT[key]) return;
    G.seen[key] = true;
    say(HINT[key], { soft: true });
  });

  /* ---- the drawing */
  function build() {
    var root = document.getElementById("w98");
    if (!root) return null;
    var fig = el("button.w98-gz-fig", { type: "button", title: "Gizmo. Press for his menu, drag to move him.", "aria-label": "Gizmo, your assistant. Press for his menu.", "aria-haspopup": "menu" });
    fig.innerHTML = EN.gate.gizmoSvg("gate-clipsvg w98-gz-svg");
    var txt = el("span.w98-gz-t");
    var bubble = el("div.w98-gz-bubble", { role: "status", "aria-live": "polite", onclick: function () { hush(); } }, [txt]);
    var box = el("div.w98-gizmo", { dataset: { gizmo: "1" } }, [bubble, fig]);
    root.appendChild(box);
    G.box = box; G.fig = fig; G.bubble = bubble; G.txt = txt;
    place();
    drag(fig);
    return box;
  }
  function place() {
    if (!G.box) return;
    var p = null;
    try { p = JSON.parse(store(POS) || "null"); } catch (e) {}
    if (p && typeof p.r === "number" && typeof p.b === "number") { G.box.style.right = Math.max(0, p.r) + "px"; G.box.style.bottom = "calc(var(--w-task-h) + " + Math.max(0, p.b) + "px)"; }
    else { G.box.style.right = "14px"; G.box.style.bottom = "calc(var(--w-task-h) + 38px)"; }   // above the visitor counter
  }
  function paint() {
    if (!K.active() || !on() || G.hidden) { remove(); return; }
    var root = document.getElementById("w98");
    if (!root) return;
    if (!G.box || G.box.parentNode !== root) { G.box = null; build(); }
  }
  function remove() {
    clearTimeout(G.timer);
    if (G.box && G.box.parentNode) G.box.parentNode.removeChild(G.box);
    G.box = null;
  }
  X.paint.push(paint);

  /* ---- speech */
  function say(text, o) {
    o = o || {};
    if (!K.active() || !on() || G.hidden) return false;
    if (!G.box) paint();
    if (!G.box) return false;
    // never over a dialog, and a hint does not cut across what he is already saying
    if (document.querySelector(".w98-modal")) return false;
    if (o.soft && G.bubble.classList.contains("on")) return false;
    G.txt.textContent = text;
    G.bubble.classList.add("on");
    G.bubble.classList.remove("w98-gz-in"); void G.bubble.offsetWidth; if (!K.reduced()) G.bubble.classList.add("w98-gz-in");
    clearTimeout(G.timer);
    G.timer = setTimeout(hush, Math.min(14000, 4500 + text.length * 55));
    G.last = Date.now();
    return true;
  }
  function hush() { clearTimeout(G.timer); if (G.bubble) G.bubble.classList.remove("on"); }

  /* ---- dragging him out of the way; a press without a drag is his menu */
  function drag(fig) {
    var st = null;
    fig.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      var r = G.box.getBoundingClientRect(), root = document.getElementById("w98").getBoundingClientRect();
      st = { x: e.clientX, y: e.clientY, r: root.right - r.right, b: root.bottom - r.bottom - parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--w-task-h") || "28"), moved: false, id: e.pointerId };
      try { fig.setPointerCapture(e.pointerId); } catch (x) {}
    });
    fig.addEventListener("pointermove", function (e) {
      if (!st) return;
      var dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
      st.moved = true; K.closeMenus(); hush();
      var root = document.getElementById("w98").getBoundingClientRect(), th = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--w-task-h") || "28");
      var r = Math.max(0, Math.min(root.width - 60, st.r - dx)), b = Math.max(0, Math.min(root.height - th - 80, st.b - dy));
      G.box.style.right = r + "px"; G.box.style.bottom = "calc(var(--w-task-h) + " + b + "px)";
      st.nr = r; st.nb = b;
    });
    function up() {
      if (!st) return;
      var s = st; st = null;
      try { fig.releasePointerCapture(s.id); } catch (x) {}
      if (s.moved) store(POS, JSON.stringify({ r: s.nr, b: s.nb })); else menu();
    }
    fig.addEventListener("pointerup", up);
    fig.addEventListener("pointercancel", function () { st = null; });
    fig.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); menu(); } });
  }

  /* ---- his menu */
  function menu() {
    if (!G.fig) return;
    hush();
    var r = G.fig.getBoundingClientRect();
    var live = EN.app.activeTab();
    K.openMenu([
      { label: "Tell me a &tip", icon: K.pix("bulb", 16), go: function () { var t = EN.w98.extras && EN.w98.extras.nextTip && EN.w98.extras.nextTip(); say(t || "Press Ctrl+K to find a rule, your gear or someone you know."); } },
      { label: "What is &this?", go: function () { say(HINT[live] || "That is the open window. Its menu bar has File, View and Help.") } },
      { sep: true },
      { label: "&Hide me for now", go: function () { G.hidden = true; paint(); } },
      { label: "Turn Gizmo &off", go: function () { setOn(false); } },
      { label: "Gizmo &options...", go: function () { EN.w98.openControlPanel("extras"); } }
    ], r.left, r.top, { owner: null });
  }

  /* ---- he greets you, once the start-up box (if any) is out of the way */
  X.boot.push(function () {
    if (!on()) return;
    var met = store(MET) === "1", n = "";
    try { var ch = EN.store.active(); n = ch && ch.identity && ch.identity.handle ? ch.identity.handle : ""; } catch (e) {}
    function hello() {
      if (document.querySelector(".w98-modal")) { setTimeout(hello, 1500); return; }
      if (!met) { store(MET, "1"); say("I'm Gizmo. I live on this desktop now. Press me for a tip, drag me out of the way, or turn me off in the Control Panel.", { }); }
      else say("Welcome back" + (n ? ", " + n : "") + ".", { });
    }
    setTimeout(hello, 1800);
  });

  EN.w98.say = say;
  EN.w98.gizmo = { on: on, setOn: setOn, say: say, hush: hush, menu: menu, hint: function (k) { return HINT[k]; }, present: function () { return !!(G.box && document.documentElement.contains(G.box)); } };
  // Control Panel > Desktop Extras
  X.cplExtras.push(function () {
    var box = el("input.w98-chk", { type: "checkbox", checked: on(), onchange: function () { setOn(box.checked); } });
    return [el("div.w98-ps-row", null, [el("label.w98-tip-c", { style: { marginTop: "0" } }, [box, el("span", null, K.label("Show &Gizmo, your assistant"))]),
      el("p.set-hint", { style: { margin: "3px 0 0 21px" }, text: "He greets you, says a word about each program the first time you open it, and offers a tip when you press him." })])];
  });
})();
