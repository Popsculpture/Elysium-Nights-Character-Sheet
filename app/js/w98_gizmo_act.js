/* ===========================================================================
   ELYSIUM NIGHTS · GIZMO'S ANTICS on the #GRIDOS '98 desktop (phase 1, 21 Nov 2026, the author's Gizmo animation handoff).
   Forty animated SVGs (img/gizmo/*.svg, each a self-contained CSS-keyframe scene on a transparent ground) play on a stage laid over
   his place in the corner. This file is the stage and the idle life: boot-up, the getaway when he is dismissed, "nothing to see here"
   when a pointer finds him, sleep mode, the idle spectacles with the Fidget story in order, and the double click. The triggers that
   hang off app events (sync, search, delete...) and the Gremlin episode are later phases and use play() from here.

   Rules from the handoff, kept here:
   - Nothing plays during the guided tour, the login egg, the access-denied page, an open dialog or a dice roll.
   - One setting, three presets: Quiet (functions only), Normal (a spectacle about every 10 idle minutes), Lively (every 4).
     The device's reduced-motion setting forces Quiet.
   - A spectacle is any Idle or Fidget piece except Sleep Mode. Idle picks are random, one slot in the rotation goes to the next
     Fidget piece, which advances a saved counter and wraps after Rebuilt.
   - Sleep Mode plays after 5 minutes with no input and holds until input returns.
   - A double click on him plays one spectacle (5 s cooldown, resets the idle timer).
   Saved per device (this app keeps Gizmo's other settings the same way): en_w98_gizmo_freq_v1, en_w98_gizmo_fid_v1.

   Original work: the character and every animation are the author's own. No em or en dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};
(function () {
  if (!EN.w98 || !EN.w98.kit || !EN.w98.gizmo || !EN.w98.gizmo.fig) return;
  var K = EN.w98.kit, X = EN.w98.ext, el = K.el, store = K.store, GZ = EN.w98.gizmo;
  var FREQ = "en_w98_gizmo_freq_v1", FID = "en_w98_gizmo_fid_v1";

  /* name: [viewBox width, viewBox height, seconds for one pass] (read from the files) */
  var M = {"back-alley-deal":[64,104,6],"black-ice":[84,92,8],"boot-up":[64,84,3],"chain-reaction":[150,100,9],"clean-getaway":[112,84,3],"copycat":[130,94,8],"core-envy":[100,96,8],"data-check":[96,84,5],"dead-drop":[72,96,8],"desync":[88,84,4],"evidence-disposal":[108,100,6],"eye-heist":[140,96,9],"gremlin-error":[112,104,5],"gremlin-fall":[108,104,10],"gremlin-idle":[108,104,6],"gremlin-notice":[112,108,4],"gremlin-redeemed":[124,104,10],"gremlin-success":[120,104,4],"gremlin-working":[120,104,4.5],"home-run":[172,130,8],"ice-encounter":[96,100,6],"knocked-askew":[120,96,9],"laser-limbo":[184,92,8],"light-switch":[140,92,8],"lights-out":[128,104,10],"lockpick":[88,90,8],"memory-leak":[72,92,5],"no-cameras":[112,84,6],"natural-one":[104,100,4],"faceplant":[138,100,4.5],"nothing-to-see-here":[200,140,6],"overheat":[84,104,6],"paperclip-maximizer":[130,100,10],"percussive-maintenance":[118,88,6],"plug-in":[104,84,4],"rebuilt":[160,96,10],"rewire":[104,92,9],"sleep-mode":[86,96,8],"stakeout":[86,104,10],"street-victory":[80,100,4],"unauthorized-upgrade":[96,112,6],"vending-trouble":[128,100,9]};
  var IDLE = ["lights-out", "stakeout", "unauthorized-upgrade", "rewire", "copycat", "chain-reaction", "paperclip-maximizer", "laser-limbo"];
  /* the rest of the spectacle pool: pieces that also have an event of their own (the events come in a later phase); the two fumbles are
     semi-rare, so each carries twice the weight. The Fidget story is one more slot, which is the only thing that moves its counter. */
  var EXTRA = ["no-cameras", "memory-leak", "overheat"], FUMBLES = ["natural-one", "faceplant"];
  var FUMBLE_POOL = ["natural-one", "faceplant", "black-ice", "core-envy", "eye-heist", "knocked-askew"], FUMBLE_QUIET = ["natural-one", "faceplant", "black-ice"];
  var STORY = ["light-switch", "core-envy", "eye-heist", "knocked-askew", "vending-trouble", "home-run", "rebuilt"];
  /* spectacle gap in minutes per preset; the sleep wait; the double click cooldown; hover cooldown */
  var GAP = { quiet: 0, normal: 10, lively: 4 }, SLEEP_MIN = 5, DBL_MS = 5000, HOVER_MS = 90000, AWAY_MS = 60000;
  /* ranks: the order when two events land together is crash, errors and refusals, successes, tips, then spectacles */
  var RANK = { crash: 5, error: 4, success: 3, tip: 2, spectacle: 1 };
  var PRIO = { sleep: 0, spectacle: 1, hover: 2, fn: 3 };
  var HOLD_MS = 3000, WAIT_MS = 20000;

  var Q = { list: [], pend: null, holdUntil: 0, flushT: null };
  /* the Gremlin episode (js/w98_gizmo_gremlin.js) plugs in here: what is rusted, a scene's name swapped, a tick each second */
  var HOOKS = { rusted: function () { return false; }, subst: null, tick: null, action: null, interrupted: null, cleared: null };
  var A = { cur: null, last: Date.now(), nextSpec: Date.now(), lastDbl: 0, lastHover: 0, hiddenAt: 0, asleep: false, timer: null, tick: null };

  /* ---- the setting */
  function freq() { var v = store(FREQ); return v === "quiet" || v === "lively" ? v : "normal"; }
  function setFreq(v) { store(FREQ, v === "quiet" || v === "lively" ? v : "normal"); A.nextSpec = Date.now(); }
  function eff() { return K.reduced() ? "quiet" : freq(); }

  /* ---- the protected moments: the tour, the login egg, the access-denied page, a dialog, a dice roll */
  function hardProtected() {
    try { if (EN.tour && EN.tour.active && EN.tour.active()) return true; } catch (e) {}
    try { if (EN.gate && EN.gate.deniedOpen && EN.gate.deniedOpen()) return true; } catch (e) {}
    return !!document.querySelector(".w98-modal, .gate-stage, .gate-card");
  }
  function rolling() { return !!document.querySelector(".tb-die.rolling"); }
  function holding() { return Date.now() < Q.holdUntil; }
  function protectedNow() { return hardProtected() || rolling() || holding(); }
  function ready() { return K.active() && GZ.on() && GZ.present() && !GZ.hidden(); }

  /* ---- the stage */
  /* one size for the still and every scene: a unit of his drawing is one whole pixel (every scene's width and height is even, so it also centres on whole pixels) */
  var SCALE = 1;
  function scale() { return SCALE; }
  function stop(why) {
    var c = A.cur;
    if (!c) return;
    if (c.ctl && why === "input" && c.ctl.wake()) return;   // asleep: his wake-up plays first, then he stands down
    A.cur = null; clearTimeout(c.t);
    if (c.ctl) c.ctl.dispose();
    if (c.img && c.img.parentNode) c.img.parentNode.removeChild(c.img);
    var f = GZ.fig();
    if (f) f.classList.remove("acting");
    var box = GZ.stage(); if (box) box.style.removeProperty("--gz-lift");
    if (c.name === "sleep-mode") A.asleep = false;
    if (c.done) { try { c.done(why || "stopped"); } catch (e) {} }
    kick();
  }
  /* play(name, opts): opts.prio (number), opts.kind ("fn" | "spectacle" | "sleep" | "hover"), opts.done(reason), opts.loop (hold until stop) */
  function play(name, o) {
    o = o || {}; o.kind = o.kind || "fn";
    var m = M[name];
    if (!m || !ready() || protectedNow()) return false;
    var prio = o.prio || PRIO[o.kind] || PRIO.fn;
    if (A.cur && A.cur.prio > prio) return false;
    if (A.cur && A.cur.name === "sleep-mode") A.last = Date.now();   // whatever cuts in on his sleep has woken him: he does not nod straight off again
    if (A.cur) stop("replaced");
    var f = GZ.fig(), s = scale(), w = m[0] * s, h = m[1] * s;
    var img, host = null;
    if (name === "sleep-mode" && sleepSvg && !K.reduced() && document.body.attachShadow) {
      /* his sleep is one drawing played in three parts: he nods off once, he sleeps in a loop, he wakes only when you wake him. It sits in a shadow root so its own style rules stay to itself. */
      img = el("div.w98-gz-stage", { "aria-hidden": "true" });
      host = img.attachShadow({ mode: "open" });
      host.innerHTML = "<style>svg{display:block;width:100%;height:100%}</style>" + sleepSvg;
    } else img = el("img.w98-gz-stage", { src: "img/gizmo/" + name + ".svg", alt: "", "aria-hidden": "true", draggable: "false" });
    img.style.width = w + "px"; img.style.height = h + "px";
    f.appendChild(img); f.classList.add("acting");
    if (!o.keep) GZ.hush();   // a scene that goes with what he is saying (a tip) leaves his bubble up
    var box = GZ.stage(); if (box) box.style.setProperty("--gz-lift", Math.max(0, h - f.getBoundingClientRect().height) + "px");
    keepOn(img);
    var c = { name: name, prio: prio, img: img, done: o.done, kind: o.kind };
    A.cur = c;
    if (host) { c.ctl = sleeper(host, c); c.ctl.start(); }
    if (name === "sleep-mode") A.asleep = true;
    if (!o.loop) c.t = setTimeout(function () { if (A.cur === c) stop("ended"); }, m[2] * 1000 + 150);
    return true;
  }
  /* ---- sleep in three parts, all from sleep-mode.svg (8 s): 0 to 3.4 s he nods off, 3.4 to 5.4 s is one breath of sleep that begins and ends in
     the same pose (so it loops with no seam), and from 6.45 s the jolt, the cap flying off and the neutral pose are the wake-up. */
  var SL = { from: 3400, to: 5400, wake: 6450, end: 8000 };
  var sleepSvg = "";
  try { fetch("img/gizmo/sleep-mode.svg").then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) { if (/<svg/.test(t)) sleepSvg = t; }).catch(function () {}); } catch (e) {}
  function sleeper(host, c) {
    /* its own clock (the three parts are cut where it says), and the drawing's animations are only moved to match at a cut */
    var S = { phase: "down", iv: 0, anims: [], waking: false, t0: Date.now() };
    function now() { return Date.now() - S.t0; }
    function seek(ms) { S.t0 = Date.now() - ms; S.anims.forEach(function (a) { try { a.currentTime = ms; } catch (e) {} }); }
    function tick() {
      if (!S.anims.length) S.anims = host.getAnimations ? host.getAnimations() : [];
      var t = now();
      if (S.phase === "down" && t >= SL.from) S.phase = "loop";
      if (S.phase === "loop") {
        if (S.waking) { S.phase = "wake"; seek(SL.wake); }
        else if (t >= SL.to) seek(SL.from + (t - SL.to));
      } else if (S.phase === "wake" && t >= SL.end) { S.dispose(); if (A.cur === c) stop("woke"); }
    }
    S.start = function () { S.t0 = Date.now(); S.iv = setInterval(tick, 40); };
    S.dispose = function () { if (S.iv) clearInterval(S.iv); S.iv = 0; };
    S.wake = function () { S.waking = true; return true; };
    S.state = function () { return { phase: S.phase, waking: S.waking, t: now() }; };
    return S;
  }
  /* a wide scene is centred on his place; if that runs off the desktop, slide it back on */
  function keepOn(img) {
    var root = document.getElementById("w98"), rr = root && root.getBoundingClientRect(), r = img.getBoundingClientRect(), dx = 0, dy = 0;
    if (!rr) return;
    if (r.left < rr.left + 4) dx = rr.left + 4 - r.left; else if (r.right > rr.right - 4) dx = rr.right - 4 - r.right;
    if (r.top < rr.top + 4) dy = rr.top + 4 - r.top;
    img.style.setProperty("--gz-dx", dx + "px"); img.style.setProperty("--gz-dy", dy + "px");
  }

  /* ---- the story: Fidget pieces in order, a counter kept on this device */
  function fidIndex() { var n = parseInt(store(FID), 10); return n >= 0 && n < STORY.length ? n : 0; }
  function nextFidget(peek) { var i = fidIndex(); if (!peek) store(FID, String((i + 1) % STORY.length)); return STORY[i]; }
  /* one spectacle: the idle pieces and the other event pieces (weight 1), the two fumbles (weight 2), and one slot for the next Fidget piece */
  var POOL = [];
  IDLE.concat(EXTRA).forEach(function (n) { POOL.push([n, 1]); });
  FUMBLES.forEach(function (n) { POOL.push([n, 2]); });
  POOL.push(["", 1]);
  var POOL_W = POOL.reduce(function (t, p) { return t + p[1]; }, 0);
  function pickSpectacle() {
    var x = Math.random() * POOL_W, i;
    for (i = 0; i < POOL.length; i++) { x -= POOL[i][1]; if (x < 0) break; }
    i = Math.min(i, POOL.length - 1);
    return POOL[i][0] || nextFidget(false);
  }
  /* a fumble: one at random, after the hold; Quiet blocks the Fidget pieces. It never touches the story counter. */
  function pickFumble() { var l = eff() === "quiet" ? FUMBLE_QUIET : FUMBLE_POOL; return l[Math.floor(Math.random() * l.length)]; }
  function spectacle() {
    if (!ready() || protectedNow() || A.cur || Q.pend) return false;
    var name = pickSpectacle(), ok = play(name, { kind: "spectacle" });
    return ok ? name : false;
  }

  /* ---- events: two that land together are put in order (crash, errors and refusals, successes, tips, spectacles); the top one plays, at most
     one more waits its turn, the rest are dropped. A roll starts a quiet window of about three seconds; what arrives in it plays after. */
  function fire(name, o) {
    o = o || {};
    if (HOOKS.subst) name = HOOKS.subst(name) || name;
    if (!M[name] || !ready() || (hardProtected() && !o.wait)) return false;
    Q.list.push({ name: name, rank: o.rank || RANK[o.kind] || RANK.success, o: o, t: Date.now(), n: Q.list.length });
    if (!Q.flushT) Q.flushT = setTimeout(flush, 0);
    return true;
  }
  function flush() {
    Q.flushT = null;
    var now = Date.now(), l = Q.list.concat(Q.pend ? [Q.pend] : []);
    Q.list = []; Q.pend = null;
    l = l.filter(function (e) { return now - e.t < WAIT_MS; });
    if (!l.length || !ready()) return;
    l.sort(function (a, b) { return b.rank - a.rank || a.t - b.t || a.n - b.n; });
    /* under a dialog or the tour nothing plays; an event that asked to wait (a roll, a game result) is kept for when it lifts */
    if (hardProtected()) { Q.pend = l.filter(function (e) { return e.o.wait; })[0] || null; return; }
    var top = l[0], cur = A.cur;
    var can = !holding() && !rolling() && (!cur || (cur.prio <= 1 && top.rank > cur.prio));
    if (can) {
      var o = top.o; o.kind = o.kind || "fn"; o.prio = top.rank;
      if (play(top.name, o)) { Q.pend = l[1] || null; return; }
      setTimeout(kick, 400);   // the desktop may be mid-redraw (a record just deleted): look again shortly
    }
    Q.pend = top;
  }
  function kick() { if (Q.pend && !Q.flushT) Q.flushT = setTimeout(flush, 0); }
  function hold(ms) {
    if (HOOKS.action) HOOKS.action("roll");
    ms = ms || HOLD_MS;
    Q.holdUntil = Math.max(Q.holdUntil, Date.now() + ms);
    if (A.cur && A.cur.prio <= 1) stop("hold");
    setTimeout(kick, ms + 60);
  }
  EN.w98.diceHold = function () { hold(); };

  /* ---- idle: the timer counts time with no input */
  function poke() { A.last = Date.now(); A.nextSpec = A.last; if (A.cur && A.cur.name === "sleep-mode") stop("input"); }
  ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"].forEach(function (t) { document.addEventListener(t, poke, { passive: true, capture: true }); });
  function gapMs() { var g = GAP[eff()]; return g ? g * 60000 : 0; }
  /* he nods off two minutes after his spectacle would have played (so the show comes first and the sleep after); with no shows (Quiet) at five minutes */
  function sleepMs() { var g = gapMs(); return g ? g + 2 * 60000 : SLEEP_MIN * 60000; }
  function step() {
    var now = Date.now();
    if (hardProtected()) { if (Q.pend && !Q.pend.o.wait) Q.pend = null; if (A.cur && A.cur.kind !== "fn") stop("protected"); return; }
    if (protectedNow()) return;
    if (!ready() || document.hidden) return;
    kick();
    if (HOOKS.tick) HOOKS.tick(now);
    if (A.cur && A.cur.name !== "sleep-mode") return;
    var idle = now - A.last, rust = HOOKS.rusted();
    /* a spectacle: the gap of no input since the last input or the last spectacle, while he is awake */
    var g = gapMs();
    if (A.cur) return;   // asleep, he stays asleep: only you (or something real happening) wakes him
    if (g && !rust && now - A.nextSpec >= g && idle >= g) { A.nextSpec = now; spectacle(); return; }
    if (idle >= sleepMs() && !A.asleep && !rust) play("sleep-mode", { kind: "sleep", loop: true });
  }
  A.tick = step;
  A.timer = setInterval(step, 1000);

  /* ---- a pointer finds him; the tab comes back after you were away */
  function hello() {
    var now = Date.now();
    if (now - A.lastHover < HOVER_MS) return false;
    if (play("nothing-to-see-here", { kind: "hover" })) { A.lastHover = now; return true; }
    return false;
  }
  document.addEventListener("pointerenter", function (e) {
    if (e.pointerType === "touch" || !e.target || !e.target.closest) return;
    if (e.target.closest(".w98-gz-fig")) hello();
  }, true);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { A.hiddenAt = Date.now(); return; }
    if (A.hiddenAt && Date.now() - A.hiddenAt >= AWAY_MS) { A.hiddenAt = 0; poke(); setTimeout(hello, 400); }
  });

  /* ---- a double click plays one spectacle */
  document.addEventListener("dblclick", function (e) {
    if (!e.target || !e.target.closest || !e.target.closest(".w98-gz-fig")) return;
    var now = Date.now();
    if (now - A.lastDbl < DBL_MS || protectedNow() || !ready() || HOOKS.rusted()) return;
    K.closeMenus();
    A.lastDbl = now; poke();
    if (A.cur) stop("replaced");
    spectacle();
  }, true);

  /* ---- boot-up when he arrives, getaway when he is sent away */
  function boot() {
    var tries = 0;
    (function go() {
      if (!GZ.on()) return;
      /* he closed while rusted: the next time he is up he is redeemed, once, in place of the boot-up */
      var rusted = !!(HOOKS.interrupted && HOOKS.interrupted());
      if (play(rusted ? "gremlin-redeemed" : "boot-up", { kind: "fn" })) { if (rusted && HOOKS.cleared) HOOKS.cleared(); return; }
      if (++tries < 20) setTimeout(go, 1000);
    })();
  }
  function leave(after) {
    if (!ready() || protectedNow() || !play("clean-getaway", { kind: "fn", done: function () { after(); } })) { after(); return; }
  }
  X.boot.push(boot);

  /* ---- Control Panel > Desktop Extras */
  X.cplExtras.push(function () {
    var sel = el("select", { "aria-label": "Gizmo's antics", onchange: function () { setFreq(sel.value); } },
      [["quiet", "Quiet"], ["normal", "Normal"], ["lively", "Lively"]].map(function (p) { return el("option", { value: p[0], selected: freq() === p[0], text: p[1] }); }));
    return [el("div.w98-ps-row", null, [
      el("div", null, [el("span", null, K.label("Gizmo's &antics ")), sel]),
      el("p.set-hint", { style: { margin: "3px 0 0 0" }, text: "Quiet: he only reacts. Normal: a little show when you have been away about every ten minutes. Lively: about every four. Reduced motion on your device forces Quiet." })])];
  });

  /* ---- moments the app reports (EN.w98.moment): a roll, a Margin roll, a filed record, a Breach result, a payday.
     Each waits out a dialog and the roll hold. A critical, a Flawless Margin success, a filed #PRINT, a Breach win and a payday are
     Street Victory, every time; a fumble draws from the fumble pool; a tripped Breach is Ice Encounter. */
  var MOMENT = {
    roll: function (d) { if (d.crit) return victory(); if (d.fumble) return fumble(); return false; },
    margin: function (d) { hold(); return d.margin >= 3 ? victory() : false; },
    filed: function () { return victory(); },
    "breach-win": function () { return victory(); },
    "breach-lose": function () { return fire("ice-encounter", { rank: RANK.error, wait: true }); },
    payday: function () { return victory(); }
  };
  function victory() { return fire("street-victory", { rank: RANK.success, wait: true }); }
  function fumble() { return fire(pickFumble(), { rank: RANK.success, wait: true }); }
  EN.w98.moment = function (kind, d) { try { var f = MOMENT[kind]; return f ? f(d || {}) : false; } catch (e) { return false; } };

  GZ.act = { idleMs: function () { return Date.now() - A.last; }, hooks: HOOKS, moments: MOMENT, fire: fire, hold: hold, rank: RANK, victory: victory, fumble: fumble, pickFumble: pickFumble, fumblePool: FUMBLE_POOL.slice(), pool: POOL.map(function (p) { return p.slice(); }),
    pending: function () { return Q.pend ? Q.pend.name : null; }, holding: holding, play: play, stop: stop, freq: freq, setFreq: setFreq, effective: eff, boot: boot, leave: leave, spectacle: spectacle, hello: hello,
    now: function () { return A.cur ? A.cur.name : null; }, asleep: function () { return A.asleep; }, sleepMs: sleepMs, sleeper: function () { return A.cur && A.cur.ctl ? A.cur.ctl.state() : null; }, protectedNow: protectedNow,
    story: STORY.slice(), idleSet: IDLE.slice(), nextFidget: nextFidget, files: Object.keys(M),
    test: { setIdle: function (ms, keepGap) { A.last = Date.now() - ms; if (!keepGap) A.nextSpec = A.last; }, step: step, pick: pickSpectacle } };
})();
