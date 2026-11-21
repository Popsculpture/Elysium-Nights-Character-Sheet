/* ===========================================================================
   ELYSIUM NIGHTS // #GRID OS login
   One card after the boot animation: JACK IN WITH DISCORD (EN.cloud.jackIn),
   and a quieter RUN OFFLINE. There are no codes anywhere (campaigns batch 1,
   the author, 7 Nov 2026). Where Discord sign-in cannot work (no cloud
   client, as on a file:// page) the card offers Run offline only, with one
   line saying sign-in needs the hosted app.

   DESKTOPS: coming through this card, by either button, lands on the
   Freelancer desktop (the author, 8 Nov 2026). A load that skips the card
   answers with no profile, so land() in app.js falls back to the remembered
   desktop (en_portal_v1). The settings tray's // WORKSPACE buttons cross
   between desktops, and the Admin desktop opens for everyone.

   REMEMBERING: the card shows until the device has a Discord session or has
   picked Run offline. The pick is en_login_v1 ("offline"). A device with a
   stored Discord session skips the card and its offline pick is cleared, so
   jacking out brings the card back on the next load. The old
   en_gate_ok_v1 and en_gate_admin_ok_v1 flags are ignored and left in place:
   every device sees the new card once, and meets Gizmo.

   GIZMO: the first time either button is pressed on this device
   (en_gizmo_hello_v1), Gizmo, the off-brand paperclip, pops up beside the
   card and helps you hack the mainframe, then the button goes through. A
   click anywhere skips straight to it. He is secretly a Nixie; this is the
   helpful side of that. His drawing, clipSvg() below, is finished work and
   comes through byte for byte: tour.js draws him from it (EN.gate.gizmoSvg)
   and turns his eyes by shifting his third and fourth circles, so even
   reordering the shapes changes where he looks.

   QUERY: ?dev and ?nogate skip the card (and record the offline pick, as the
   old bypass wrote its unlock, so a reload stays open). ?login forces it,
   for testing, and clears nothing. ?portal=admin lands on the Admin desktop
   for a load that skips the card; through the card it is Freelancer like
   everyone else.

   OTHER CARDS: panel() opens a card in this look over the app (the join card,
   js/campaigns.js), and denied() is Gizmo's ACCESS DENIED page (the fence in
   app.js). Both reuse the bubble and his drawing as they are.

   TO TURN IT OFF:       set CONFIG.enabled to false.
   TO REMOVE COMPLETELY: do not. tour.js reads Gizmo from this file, so a
                         missing gate is a tour with no Gizmo and no error.
   =========================================================================== */
window.EN = window.EN || {};
EN.gate = (function () {

  var CONFIG = {
    enabled: true                // false skips the card without removing the file
  };

  var PICK = "en_login_v1";          // "offline": this device chose Run offline
  var HELLO = "en_gizmo_hello_v1";   // "1": Gizmo has greeted this device
  function getKey(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function setKey(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  function dropKey(k) { try { window.localStorage.removeItem(k); } catch (e) {} }

  function pickedOffline() { return getKey(PICK) === "offline"; }
  function cloudReady() { try { return !!(EN.cloud && EN.cloud.available && EN.cloud.available()); } catch (e) { return false; } }
  // the vendored Supabase client's stored session, read the same way js/packs.js reads it at boot
  function hasSession() { try { return !!(EN.packs && EN.packs.storedSession && EN.packs.storedSession()); } catch (e) { return false; } }
  /* Back from Discord: the redirect carries ?code= while the client trades it for a session, which
     can still be in flight when the boot animation ends. That load is a jack in, not a new visitor. */
  function returning() { try { return /[?&]code=/.test(window.location.search); } catch (e) { return false; } }

  var CSS = [
    "#gate{ position:fixed; inset:0; z-index:100000; display:flex; align-items:center; justify-content:center;",
    "  background:radial-gradient(1100px 560px at 50% 28%, rgba(0,229,255,0.06), transparent 60%),",
    "  repeating-linear-gradient(0deg, rgba(0,229,255,0.035) 0 1px, transparent 1px 3px), var(--bg);",
    "  font-family:var(--mono); animation:gate-in .3s ease both; }",
    "#gate.ok{ animation:gate-out .45s ease forwards; pointer-events:none; }",
    "@keyframes gate-in{ from{opacity:0} to{opacity:1} }",
    "@keyframes gate-out{ to{opacity:0; visibility:hidden} }",
    "/* the card and, during the greeting, Gizmo beside it */",
    ".gate-stage{ position:relative; display:flex; flex-direction:column; align-items:center; }",
    ".gate-stage > .gate-clip{ width:min(92vw,430px); }",
    "@media (min-width:900px){ .gate-stage > .gate-clip{ position:absolute; left:calc(100% + 18px); bottom:0; width:330px; margin:0; } }",
    ".gate-card{ width:min(92vw,430px); background:linear-gradient(180deg, var(--bg2), var(--bg1));",
    "  border:1px solid var(--accent-dim); border-radius:6px; padding:26px 26px 20px; position:relative; z-index:1;",
    "  box-shadow:0 0 0 1px rgba(0,229,255,0.08), 0 18px 60px rgba(0,0,0,.6), var(--glow-cyan); }",
    ".gate-kick{ font-size:10px; letter-spacing:.22em; color:var(--text3); text-transform:uppercase; }",
    ".gate-logo{ font-family:var(--disp); font-weight:700; font-size:34px; letter-spacing:.12em; color:var(--text); margin:4px 0 2px; }",
    ".gate-logo b{ color:var(--accent); }",
    ".gate-warn{ font-size:11px; letter-spacing:.18em; color:var(--ember); margin-bottom:12px; }",
    ".gate-body{ font-size:12px; line-height:1.5; color:var(--text2); margin:0 0 18px; }",
    ".gate-go{ width:100%; margin-top:14px; padding:10px; background:var(--accent); color:var(--accent-ink); border:0; border-radius:4px;",
    "  font-family:var(--disp); font-weight:700; font-size:14px; letter-spacing:.18em; cursor:pointer; transition:filter .15s; }",
    ".gate-go:hover{ filter:brightness(1.12); }",
    ".gate-go:disabled{ opacity:.35; cursor:not-allowed; filter:none; }",
    "/* Run offline: there, and plainly a choice, but the quieter of the two */",
    ".gate-alt{ width:100%; margin-top:8px; padding:8px; background:transparent; color:var(--text3); border:1px solid var(--border2); border-radius:4px;",
    "  font-family:var(--disp); font-weight:600; font-size:12px; letter-spacing:.16em; text-transform:uppercase; cursor:pointer; transition:color .15s, border-color .15s; }",
    ".gate-alt:hover{ color:var(--text); border-color:var(--accent); }",
    ".gate-only{ margin-top:14px; }",
    ".gate-err{ min-height:16px; margin-top:12px; font-size:11px; letter-spacing:.1em; color:var(--danger); text-align:center; }",
    ".gate-foot{ margin-top:16px; text-align:center; font-size:9px; letter-spacing:.2em; color:var(--text4); }",
    "/* ----- Gizmo's patch: the card glitches while he works ----- */",
    ".gate-card.patching{ animation:gate-glitch .5s steps(2) 2; border-color:var(--success); box-shadow:0 0 0 1px var(--success), 0 0 44px rgba(46,230,160,.35); }",
    "@keyframes gate-glitch{ 0%,100%{transform:translate(0,0); filter:none} 20%{transform:translate(-3px,1px)} 40%{transform:translate(3px,-2px); filter:hue-rotate(45deg)} 60%{transform:translate(-2px,1px)} 80%{transform:translate(2px,-1px); filter:hue-rotate(-35deg)} }",
    ".gate-term{ background:var(--bg); border:1px solid var(--accent-dim); border-radius:4px; padding:12px; height:208px; overflow:hidden; font-size:12px; line-height:1.5; }",
    "/* the patch log is a short live feed on the card, not a full-height terminal */",
    ".gate-term.vpn{ height:auto; min-height:96px; border-color:var(--success); font-size:11.5px; margin:14px 0 0; }",
    ".gate-line{ white-space:pre-wrap; word-break:break-word; opacity:0; animation:gate-linein .16s ease forwards; }",
    "@keyframes gate-linein{ from{opacity:0; transform:translateY(3px)} to{opacity:1; transform:none} }",
    ".gate-sys{ color:var(--text3); }",
    ".gate-ok-line{ color:var(--success); letter-spacing:.12em; }",
    "@keyframes gate-blink{ 50%{opacity:0} }",
    ".gate-prog{ margin-top:12px; height:8px; border:1px solid var(--success); border-radius:3px; overflow:hidden; background:rgba(46,230,160,.06); }",
    ".gate-progfill{ height:100%; width:0; background:var(--success); box-shadow:0 0 10px var(--success); transition:width .7s linear; }",
    ".gate-hide{ display:none !important; }",
    ".gate-clip{ display:flex; align-items:flex-end; gap:12px; margin-top:14px; animation:gate-clipin .45s cubic-bezier(.2,.9,.3,1.25) both; }",
    "@keyframes gate-clipin{ from{opacity:0; transform:translateY(14px) scale(.85)} to{opacity:1; transform:none} }",
    ".gate-bubble{ flex:1; position:relative; min-height:46px; background:var(--bg); border:1px solid var(--success); border-radius:8px 8px 2px 8px;",
    "  padding:10px 12px; font-family:var(--body); font-size:13.5px; line-height:1.45; color:var(--text); }",
    ".gate-bubble::after{ content:''; position:absolute; right:-7px; bottom:10px; width:12px; height:12px; background:var(--bg);",
    "  border-right:1px solid var(--success); border-bottom:1px solid var(--success); transform:rotate(-45deg); }",
    ".gate-bubble .k{ display:block; font-family:var(--mono); font-size:8.5px; letter-spacing:.2em; color:var(--success); text-transform:uppercase; margin-bottom:4px; }",
    ".gate-bubble .t{ white-space:pre-wrap; }",
    ".gate-bubble .t.typing::after{ content:'█'; color:var(--success); animation:gate-blink .7s steps(2) infinite; }",
    ".gate-clipsvg{ width:58px; height:78px; flex:0 0 auto; filter:drop-shadow(0 0 10px rgba(46,230,160,.55)); animation:gate-clipwob 2.4s ease-in-out infinite; transform-origin:50% 90%; }",
    "@keyframes gate-clipwob{ 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(5deg)} }",
    "/* after the rule it overrides, at the same specificity: his sway stops under reduced motion */",
    "@media (prefers-reduced-motion:reduce){ .gate-clipsvg{ animation:none; } }",
    "/* his two answers, under his first line */",
    ".gate-acts{ display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }",
    ".gate-act{ font-family:var(--disp); font-weight:600; font-size:11px; letter-spacing:.12em; text-transform:uppercase; padding:6px 12px; border-radius:4px;",
    "  cursor:pointer; background:transparent; color:var(--success); border:1px solid var(--success); }",
    ".gate-act.yes{ background:var(--success); color:#04130c; }",
    ".gate-act:focus-visible{ outline:1px solid var(--success); outline-offset:2px; }",
    ".gate-skiphint{ margin-top:8px; text-align:right; font-family:var(--mono); font-size:8.5px; letter-spacing:.18em; color:var(--text4); text-transform:uppercase; }",
    "/* ----- the settings-cog note, shown once after Run offline ----- */",
    "#gate-coach{ position:fixed; z-index:100003; width:270px; background:linear-gradient(180deg, var(--bg2), var(--bg1));",
    "  border:1px solid var(--cc); border-radius:5px; padding:13px 14px 11px; font-family:var(--body);",
    "  box-shadow:0 0 20px var(--cc-glow), 0 14px 40px rgba(0,0,0,.55); animation:gate-in .2s ease both; }",
    "#gate-coach::before{ content:''; position:absolute; top:-7px; width:12px; height:12px; background:var(--bg2);",
    "  border-left:1px solid var(--cc); border-top:1px solid var(--cc); transform:rotate(45deg); }",
    ".gc-kick{ font-family:var(--mono); font-size:8.5px; letter-spacing:.2em; color:var(--cc); text-transform:uppercase; opacity:.8; }",
    ".gc-title{ font-family:var(--disp); font-weight:700; font-size:13px; letter-spacing:.08em; color:var(--text); margin:3px 0 6px; }",
    ".gc-body{ font-size:12px; line-height:1.5; color:var(--text2); }",
    ".gc-go{ margin-top:10px; font-family:var(--disp); font-weight:600; font-size:11px; letter-spacing:.12em; text-transform:uppercase;",
    "  background:transparent; color:var(--cc); border:1px solid var(--cc); border-radius:4px; padding:5px 13px; cursor:pointer; }"
  ].join("\n");

  function injectCss() {
    if (document.getElementById("gate-css")) return;
    var s = document.createElement("style");
    s.id = "gate-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---- Gizmo blinks (campaigns batch 1, the author, 7 Nov 2026) --------------------------
     Every 10 seconds he blinks, looks straight at you for about a second and a half, blinks
     again, and goes back to where the scene has him looking. CSS only, on the drawing as it is:
     the four eye circles squash around their own centers, and the pupils (his third and fourth
     circles) swap gaze while his eyes are shut, so it never reads as a slide. The resting gaze is
     --gz-rest: the drawing's own (0) here, and tour.js sets the -3px that turns him toward its
     card. A running transform animation replaces a static transform rule, so the keyframes
     carry the resting offset at rest. This one keyframe set serves both places, and it is
     injected when this file loads (not with the card's styles) so the tour has it on a device
     that never sees the card. */
  var BLINK_CSS = [
    "@keyframes gizmoBlinkEye{0%,60%{transform:scaleY(1)}60.6%{transform:scaleY(.08)}61.2%,76.2%{transform:scaleY(1)}76.8%{transform:scaleY(.08)}77.4%,100%{transform:scaleY(1)}}",
    "@keyframes gizmoBlinkPupil{0%,60%{transform:translateX(var(--gz-rest,0px)) scaleY(1)}60.6%{transform:translateX(var(--gz-rest,0px)) scaleY(.08)}" +
      "60.61%{transform:translateX(-1px) scaleY(.08)}61.2%,76.2%{transform:translateX(-1px) scaleY(1)}76.8%{transform:translateX(-1px) scaleY(.08)}" +
      "76.81%{transform:translateX(var(--gz-rest,0px)) scaleY(.08)}77.4%,100%{transform:translateX(var(--gz-rest,0px)) scaleY(1)}}",
    ".gate-clipsvg circle{transform-box:fill-box;transform-origin:center;animation:gizmoBlinkEye 10s linear infinite;}",
    ".gate-clipsvg circle:nth-of-type(n+3){animation-name:gizmoBlinkPupil;}",
    "@media (prefers-reduced-motion:reduce){.gate-clipsvg circle{animation:none;}}"
  ].join("\n");
  (function injectBlink() {
    try {
      if (document.getElementById("gizmo-blink-css")) return;
      var s = document.createElement("style");
      s.id = "gizmo-blink-css";
      s.textContent = BLINK_CSS;
      document.head.appendChild(s);
    } catch (e) {}
  })();

  function hexRgba(hex, a) {
    var h = (hex || "#ead6a0").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return "rgba(" + parseInt(h.substr(0, 2), 16) + "," + parseInt(h.substr(2, 2), 16) + "," + parseInt(h.substr(4, 2), 16) + "," + a + ")";
  }
  // the cog note wears the desktop's colour: the live accent, or on Admin its own default palette
  function adminAccent() {
    var t = null;
    try { t = EN.theme && EN.theme.find && EN.theme.find("highheavens"); } catch (e) {}
    return (t && t.accent) || "#ead6a0";
  }
  function freelancerAccent() {
    try { return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#00e5ff"; } catch (e) { return "#00e5ff"; }
  }
  function currentDesktop() {
    try { return EN.app && EN.app.portal && EN.app.portal() === "admin" ? "admin" : "freelancer"; } catch (e) { return "freelancer"; }
  }

  function gateLine(term, cls, text) {
    var d = document.createElement("div");
    d.className = "gate-line " + cls;
    d.textContent = text;
    term.appendChild(d);
    term.scrollTop = term.scrollHeight;
    return d;
  }
  // typewriter into a span; the trailing block cursor is CSS while .typing is on
  function typeInto(span, text, done) {
    span.textContent = "";
    span.classList.add("typing");
    var i = 0;
    (function tick() {
      if (!span.parentNode) return;
      if (i < text.length) { span.textContent += text.charAt(i++); setTimeout(tick, 22); }
      else { span.classList.remove("typing"); done(); }
    })();
  }
  // Gizmo, the off-brand paperclip: a bent wire with eyes, nothing anyone could sue over
  function clipSvg(cls) {
    return '<svg class="' + (cls || "gate-clipsvg") + '" viewBox="0 0 64 84" aria-hidden="true">' +
      '<path d="M19 76 V22 a13 13 0 0 1 26 0 V62 a7 7 0 0 1 -14 0 V30" fill="none" stroke="#2ee6a0" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="27" cy="41" r="4.6" fill="#e9f1fb"/><circle cx="39" cy="41" r="4.6" fill="#e9f1fb"/>' +
      '<circle cx="28" cy="41.5" r="2" fill="#07090d"/><circle cx="40" cy="41.5" r="2" fill="#07090d"/>' +
      '<path d="M22 33 l7 -3 M44 30 l-7 3" stroke="#2ee6a0" stroke-width="2.2" stroke-linecap="round"/>' +
      '</svg>';
  }

  /* Query switches. This card is a front door, not security: the pick is one localStorage key
     anyone can set from the console. */
  function devBypass() {
    try { return /[?&](dev|nogate)/.test(window.location.search); } catch (e) { return false; }
  }
  function queryAdmin() {
    try { return /[?&]portal=admin\b/.test(window.location.search); } catch (e) { return false; }
  }
  function queryLogin() {
    try { return /[?&](login|gate)\b/.test(window.location.search); } catch (e) { return false; }
  }
  // a load that skips the card keeps the remembered desktop; only ?portal=admin, a testing switch, names one
  function landing() { return queryAdmin() ? "admin" : undefined; }

  /* ---- the card ------------------------------------------------------------ */
  var _ov = null, _onDone = null;

  function closeOverlay(fade) {
    var ov = _ov; _ov = null;
    if (!ov) return;
    ov.classList.add("ok");
    setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, fade || 480);
  }

  // Run offline, the one way this card closes itself (Jack in leaves the page for Discord)
  function runOffline(fade) {
    var done = _onDone;
    setKey(PICK, "offline");
    closeOverlay(fade);
    if (done) done("freelancer");   // through the card is always the Freelancer desktop
    // land() ran setPortal (a synchronous render) and revealed #os, so the gear has real layout.
    // On a join link the join card is up, and the note would sit on top of it.
    if (!(EN.campaigns && EN.campaigns.pendingJoin && EN.campaigns.pendingJoin())) coach();
  }

  function jackIn() {
    var ov = _ov, err = ov && ov.querySelector("#gate-err");
    if (err) { err.style.color = "var(--success)"; err.textContent = "OPENING DISCORD…"; }
    /* Through the card is always the Freelancer desktop. The redirect back skips the card and lands
       on the remembered desktop, so that is written now, before the page leaves. A Jack in from
       Settings does not come through here, and keeps the desktop it left from. */
    try { if (EN.app && EN.app.setPortal) EN.app.setPortal("freelancer"); } catch (e) {}
    var p = null;
    try { p = EN.cloud.jackIn("discord"); } catch (e) { p = null; }
    /* A redirect leaves the page. If it is still here a few seconds after the request settled,
       Discord could not be reached (cloud.js has toasted it): the card is usable again. */
    Promise.resolve(p).then(function () {
      setTimeout(function () {
        if (_ov !== ov || !ov) return;
        reset();
        var e2 = ov.querySelector("#gate-err");
        if (e2) { e2.style.color = ""; e2.textContent = "COULD NOT REACH DISCORD :: TRY AGAIN"; }
      }, 4000);
    });
  }

  function open(onDone) {
    injectCss();
    // the cog note outranks the gate in z-order (it must sit above the tab rail); it has said its piece
    var oldCoach = document.getElementById("gate-coach");
    if (oldCoach && oldCoach.parentNode) oldCoach.parentNode.removeChild(oldCoach);
    _onDone = onDone;
    if (!_ov || !_ov.parentNode) {
      _ov = document.createElement("div");
      _ov.id = "gate";
      document.body.appendChild(_ov);
    }
    _ov.className = "";
    render();
  }

  function render() {
    var ov = _ov, online = cloudReady();
    ov.innerHTML =
      '<div class="gate-stage">' +
        '<div class="gate-card" role="dialog" aria-modal="true" aria-label="#GRID OS login">' +
          '<div class="gate-kick">#MINT // SECURE NODE</div>' +
          '<div class="gate-logo">#GRID<b>OS</b></div>' +
          '<div class="gate-warn">&#9888; NODE 763 // JACK IN</div>' +
          (online
            ? '<p class="gate-body">Jack in with Discord and your Freelancers save to your account, so they follow you to any browser. Run offline and they stay on this device.</p>' +
              '<button id="gate-jack" class="gate-go" type="button">JACK IN WITH DISCORD</button>' +
              '<button id="gate-offline" class="gate-alt" type="button">Run offline</button>'
            : '<p class="gate-body">Your Freelancers save to this device.</p>' +
              '<p class="gate-body gate-only">Discord sign-in needs the hosted app, elysiumnightsrpg.com/app.</p>' +
              '<button id="gate-offline" class="gate-go" type="button">RUN OFFLINE</button>') +
          '<div id="gate-err" class="gate-err" aria-live="polite"></div>' +
          '<div class="gate-foot">NODE 763 // ELYSIUM NIGHTS</div>' +
        '</div>' +
      '</div>';
    var jack = ov.querySelector("#gate-jack"), off = ov.querySelector("#gate-offline");
    if (jack) jack.addEventListener("click", function () { press(jackIn); });
    off.addEventListener("click", function () { press(function () { runOffline(); }); });
    setTimeout(function () { try { (jack || off).focus(); } catch (e) {} }, 60);
  }
  // the buttons back, after a jack in that never left the page
  function reset() {
    if (!_ov) return;
    Array.prototype.forEach.call(_ov.querySelectorAll(".gate-clip, .gate-term, .gate-prog"), function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
    var card = _ov.querySelector(".gate-card");
    if (card) card.classList.remove("patching");
    Array.prototype.forEach.call(_ov.querySelectorAll("#gate-jack, #gate-offline"), function (b) { b.classList.remove("gate-hide"); b.disabled = false; });
  }

  // either button: Gizmo first, once per device, then the button goes through
  function press(go) {
    if (getKey(HELLO) === "1") {
      Array.prototype.forEach.call(_ov.querySelectorAll("#gate-jack, #gate-offline"), function (b) { b.disabled = true; });
      go();
      return;
    }
    setKey(HELLO, "1");   // once per device, written as he arrives, so a reload mid-greeting does not repeat him
    greet(go);
  }

  /* ---- Gizmo greets the device ---------------------------------------------
     The Codebreaker hijack and the #GRID Guardian lockdown merged into this one moment. The
     lines are a draft; the author may rewrite them. A click anywhere but his two answers, or
     Escape, skips straight to the action. */
  var LINES = {
    hello: "It looks like you're trying to hack the mainframe! Want some help with that?",
    yes: "Yes please",
    no: "I've got it",
    patch: "Say no more.",
    done: "You're in. I was never here. I'm just a paperclip."
  };
  var PATCH = [
    { t: 250, text: "> gizmo.exe attached to NODE 763" },
    { t: 520, text: "> patching the handshake ……… OK", prog: 34 },
    { t: 560, text: "> rerouting the trace ……… OK", prog: 68 },
    { t: 560, text: "> wiping his fingerprints ……… OK", prog: 100 },
    { t: 520, text: "> ACCESS GRANTED", ok: true }
  ];

  function greet(go) {
    var ov = _ov;
    var stage = ov.querySelector(".gate-stage"), card = ov.querySelector(".gate-card");
    var err = ov.querySelector("#gate-err");
    var fired = false, timers = [];
    function later(fn, ms) { timers.push(setTimeout(function () { if (!fired) fn(); }, ms)); }
    function fire() {
      if (fired) return;
      fired = true;
      timers.forEach(clearTimeout);
      ov.removeEventListener("click", onAny, true);
      document.removeEventListener("keydown", onKey, true);
      go();
    }
    function onAny(e) {
      var t = e.target;
      if (t && t.closest && t.closest(".gate-act")) return;   // his answers advance; they do not skip
      e.preventDefault(); e.stopPropagation();
      fire();
    }
    function onKey(e) { if (e.key === "Escape") { e.preventDefault(); fire(); } }

    Array.prototype.forEach.call(card.querySelectorAll("#gate-jack, #gate-offline"), function (b) { b.classList.add("gate-hide"); });
    var clip = document.createElement("div");
    clip.className = "gate-clip";
    clip.innerHTML = '<div class="gate-bubble"><span class="k">Gizmo // assistive override</span><span class="t" id="gate-bubble" aria-live="polite"></span>' +
      '<div class="gate-acts gate-hide"><button type="button" class="gate-act yes">' + LINES.yes + '</button><button type="button" class="gate-act">' + LINES.no + '</button></div>' +
      '<div class="gate-skiphint">click anywhere to skip</div></div>' + clipSvg();
    stage.appendChild(clip);
    var bubble = clip.querySelector("#gate-bubble"), acts = clip.querySelector(".gate-acts");
    // added after this click has finished dispatching, so the press that summoned him is not a skip
    setTimeout(function () {
      if (fired) return;
      ov.addEventListener("click", onAny, true);
      document.addEventListener("keydown", onKey, true);
    }, 0);

    later(function () {
      typeInto(bubble, LINES.hello, function () {
        if (fired) return;
        acts.classList.remove("gate-hide");
        try { acts.querySelector(".yes").focus(); } catch (e) {}
      });
    }, 450);
    Array.prototype.forEach.call(acts.querySelectorAll(".gate-act"), function (b) {
      b.addEventListener("click", function () { if (!fired) answered(); });
    });

    var going = false;
    function answered() {
      if (going) return;
      going = true;
      acts.classList.add("gate-hide");
      typeInto(bubble, LINES.patch, function () {
        if (fired) return;
        card.classList.add("patching");
        var term = document.createElement("div");
        term.className = "gate-term vpn";
        var prog = document.createElement("div");
        prog.className = "gate-prog";
        prog.innerHTML = '<div class="gate-progfill"></div>';
        card.insertBefore(term, err);
        card.insertBefore(prog, err);
        var fill = prog.firstChild, i = 0;
        (function next() {
          if (fired) return;
          if (i >= PATCH.length) {
            later(function () {
              typeInto(bubble, LINES.done, function () { later(fire, 1700); });
            }, 380);
            return;
          }
          var s = PATCH[i++];
          later(function () {
            gateLine(term, s.ok ? "gate-ok-line" : "gate-sys", s.text);
            if (s.prog != null) fill.style.width = s.prog + "%";
            next();
          }, s.t);
        })();
      });
    }
  }

  /* ---- other cards in this look (campaigns batch 2) ------------------------------------
     What goes on them can be someone else's words (a campaign's name, an Admin's Discord name),
     so everything from outside is set as text, never as HTML. */
  function mountOverlay() {
    injectCss();
    // the login card closes with a fade, and only one #gate belongs on the page
    var old = document.getElementById("gate");
    if (old && old.classList.contains("ok") && old.parentNode) old.parentNode.removeChild(old);
    var ov = document.createElement("div");
    ov.id = "gate";
    document.body.appendChild(ov);
    return ov;
  }
  function shutOverlay(ov) {
    ov.classList.add("ok");
    setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 480);
  }
  function shell(ov, warn, label) {
    ov.innerHTML =
      '<div class="gate-stage">' +
        '<div class="gate-card" role="dialog" aria-modal="true">' +
          '<div class="gate-kick">#MINT // SECURE NODE</div>' +
          '<div class="gate-logo">#GRID<b>OS</b></div>' +
          '<div class="gate-warn"></div>' +
          '<div id="gate-err" class="gate-err" aria-live="polite"></div>' +
          '<div class="gate-foot">NODE 763 // ELYSIUM NIGHTS</div>' +
        '</div>' +
      '</div>';
    var card = ov.querySelector(".gate-card");
    card.setAttribute("aria-label", label || warn);
    ov.querySelector(".gate-warn").textContent = "\u26A0 " + warn;
    return card;
  }
  /* A card with lines and buttons. The first button is the card's main one, the rest are the
     quieter style; all of them sit straight on the card, where '98's side margins reach them. */
  function panel(o) {
    var ov = mountOverlay();
    var api = {
      show: function (next) {
        var card = shell(ov, next.warn, o.label), err = card.querySelector("#gate-err");
        (next.lines || []).forEach(function (t) {
          var p = document.createElement("p");
          p.className = "gate-body";
          p.textContent = t;
          card.insertBefore(p, err);
        });
        var first = null;
        (next.actions || []).forEach(function (a, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = i ? "gate-alt" : "gate-go";
          b.textContent = a.label;
          b.setAttribute("data-gate-act", a.key || "");
          b.addEventListener("click", function () { a.onClick(); });
          card.insertBefore(b, err);
          if (!first) first = b;
        });
        if (first) setTimeout(function () { try { first.focus(); } catch (e) {} }, 60);
      },
      busy: function (text) {
        Array.prototype.forEach.call(ov.querySelectorAll("button"), function (b) { b.disabled = true; });
        var err = ov.querySelector("#gate-err");
        if (err) { err.style.color = "var(--success)"; err.textContent = text; }
      },
      close: function () { shutOverlay(ov); }
    };
    api.show(o);
    return api;
  }

  /* ACCESS DENIED, Gizmo's polite no. app.js decides who gets it (see EN.campaigns.crewOn): this
     only draws it, once, however many times it is asked. */
  var NO = {
    first: function (campaign) { return "It looks like you're trying to open the Admin console! You're crew on " + campaign + ", so that's a no from me."; },
    second: "Let's get you back to your Freelancer.",
    back: "Take me back"
  };
  var _no = null, _noKey = null;
  function closeDenied() {
    var ov = _no;
    _no = null;
    if (_noKey) { document.removeEventListener("keydown", _noKey, true); _noKey = null; }
    if (ov) shutOverlay(ov);
  }
  function denied(campaign) {
    if (_no) return;
    if (EN.settings && EN.settings.close) { try { EN.settings.close(); } catch (e) {} }
    var ov = _no = mountOverlay();
    shell(ov, "ACCESS DENIED", "Access denied");
    var clip = document.createElement("div");
    clip.className = "gate-clip";
    clip.innerHTML = '<div class="gate-bubble"><span class="k">Gizmo // assistive override</span><span class="t" id="gate-bubble" aria-live="polite"></span>' +
      '<div class="gate-acts gate-hide"><button type="button" class="gate-act yes"></button></div></div>' + clipSvg();
    ov.querySelector(".gate-stage").appendChild(clip);
    var bubble = clip.querySelector("#gate-bubble"), acts = clip.querySelector(".gate-acts"), back = clip.querySelector(".gate-act");
    back.textContent = NO.back;
    back.addEventListener("click", closeDenied);
    _noKey = function (e) { if (e.key === "Escape") { e.preventDefault(); closeDenied(); } };
    document.addEventListener("keydown", _noKey, true);
    setTimeout(function () {
      if (_no !== ov) return;
      typeInto(bubble, NO.first(campaign), function () {
        setTimeout(function () {
          if (_no !== ov) return;
          typeInto(bubble, NO.second, function () {
            acts.classList.remove("gate-hide");
            try { back.focus(); } catch (e) {}
          });
        }, 1400);
      });
    }, 350);
  }

  /* Points at the settings cog once, right after Run offline, and only then: a silent resume
     never opens the card, so it never reaches here. Dismisses on its button, on Escape, and on
     clicking the cog itself, since at that point the user has done the thing it points at. */
  function coach() {
    injectCss();   // callable on its own; without this a note after a silent resume would have no styles at all
    var old = document.getElementById("gate-coach");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var gear = document.querySelector(".os-gear");
    if (!gear) return;               // nothing to point at; say nothing rather than float in space
    var desk = currentDesktop();
    var accent = desk === "admin" ? adminAccent() : freelancerAccent();
    var r = gear.getBoundingClientRect();
    var box = document.createElement("div");
    box.id = "gate-coach";
    box.style.setProperty("--cc", accent);
    box.style.setProperty("--cc-glow", hexRgba(accent, 0.3));
    var left = Math.max(10, Math.min(window.innerWidth - 280, r.right - 270));
    box.style.left = left + "px";
    box.innerHTML =
      '<div class="gc-kick">' + (desk === "admin" ? "Admin desktop" : "Freelancer desktop") + '</div>' +
      '<div class="gc-title">Running offline</div>' +
      '<div class="gc-body">Your Freelancers save to this device. Jack in with Discord, or switch desktops, any time from the cog.</div>' +
      '<button type="button" class="gc-go">Got it</button>';
    var caretLeft = Math.max(10, r.left + r.width / 2 - left - 6);
    var styleTag = document.createElement("style");
    document.head.appendChild(styleTag);
    document.body.appendChild(box);
    /* The gear is normally in the top rail, so the note hangs below it with
       the caret on top. The '98 skin moves the rail to a bottom taskbar, so
       when the gear sits in the lower half of the viewport the note goes
       ABOVE it instead, caret on the bottom edge. Measured after append, so
       the note's real height decides where its top lands. */
    var below = r.top < window.innerHeight / 2;
    if (below) {
      box.style.top = (r.bottom + 10) + "px";
      styleTag.textContent = "#gate-coach::before{ left:" + caretLeft + "px; }";
    } else {
      box.style.top = Math.max(10, r.top - box.offsetHeight - 10) + "px";
      styleTag.textContent = "#gate-coach::before{ left:" + caretLeft + "px; top:auto; bottom:-7px; transform:rotate(225deg); }";
    }
    function dismiss() {
      if (box.parentNode) box.parentNode.removeChild(box);
      if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag);
      document.removeEventListener("keydown", onKey);
      gear.removeEventListener("click", dismiss);
    }
    function onKey(e) { if (e.key === "Escape") dismiss(); }
    box.querySelector(".gc-go").addEventListener("click", dismiss);
    document.addEventListener("keydown", onKey);
    gear.addEventListener("click", dismiss);
  }

  /* ---- entry point --------------------------------------------------------
     Boot. Hands over silently when the device is jacked in (or coming back from Discord) or
     has picked Run offline, with no profile (only ?portal=admin names one), so app.js lands on
     the remembered desktop. Otherwise it paints the card, which answers "freelancer". */
  function require(onUnlock) {
    if (devBypass()) {
      setKey(PICK, "offline");
      // ?dev's habits from the two-profile gate: the Freelancer side unless ?portal=admin, on Identity
      onUnlock(queryAdmin() ? "admin" : "freelancer");
      setTimeout(function () {
        try { if (!queryAdmin() && EN.app && EN.app.gotoTab) EN.app.gotoTab("print"); } catch (e) {}
      }, 0);
      return;
    }
    if (!CONFIG.enabled) { onUnlock(landing()); return; }
    var session = hasSession();
    if (session) dropKey(PICK);       // jacked in: an earlier offline pick is spent, so jacking out brings the card back
    if (!queryLogin() && (session || returning() || pickedOffline())) { onUnlock(landing()); return; }
    open(onUnlock);
  }

  return { require: require, coach: coach, gizmoSvg: clipSvg, panel: panel, denied: denied, closeDenied: closeDenied,
           deniedOpen: function () { return !!_no; } };
})();
