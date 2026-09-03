/* ===========================================================================
   ELYSIUM NIGHTS // #GRID OS access gate
   A thematic, credential-locked splash shown after the boot animation and
   before the OS opens. TWO PROFILES, one gate: the Freelancer login is the
   classic node front door; the Admin login is a tunnel to the operator
   console, styled like a corporate VPN, with its own passphrase. A SWITCH
   USER control on either card flips to a picker. The profile you enter as is
   the desktop you land on (app.js's portal), so this gate is also where the
   Freelancer/Admin choice is made; there is no separate chooser screen.

   IMPORTANT: this is a client-side gate for light gatekeeping and flavor only.
   Both codes live in the page source, so it deters casual visitors but is NOT
   real security. Anyone can read the files or open app/ directly.

   TO CHANGE A CODE:     edit CONFIG.password (Freelancer) or CONFIG.adminPassword.
   TO TURN IT OFF:       set CONFIG.enabled to false.
   TO REMOVE COMPLETELY: delete the <script src="js/gate.js"></script> line in
                         index.html. The app then boots straight into the
                         remembered desktop, and the settings tray's desktop
                         buttons are the only way across.

   REMEMBERING: each profile keeps its OWN unlock flag, so a reload lands
   straight on the desktop you were in, and Switch User to a profile you have
   already unlocked is one click. en_gate_ok_v1 is the Freelancer flag and
   keeps its old name on purpose: no device unlocked before the Admin profile
   existed gets asked again.

   EASTER EGGS: three wrong Freelancer codes summons an unseen Codebreaker who
               hijacks the node and walks the visitor past the gate. Three
               wrong Admin passphrases trip a trace and a lockdown, and then
               the #GRID Guardian (the bestiary's corporate counter-hacker, the
               one with admin authority over the whole cluster) overrides it
               through an off-brand paperclip assistant, takes a retinal scan
               off your cam, declares you valid, and opens the tunnel anyway.
               Both are pure flavor and a reward for fumbling. Both walk you
               in, which means neither code is a lock, only a deterrent; that
               was true of the Freelancer door from the start and the author
               chose parity on 2026-09-02.

   BYPASS:     a deliberately quiet "// maintenance" button in the lower left
               opens the FREELANCER node with no code. It is dim until hovered
               so it reads as terminal furniture rather than an offer, and it
               writes the same unlock flag every other route does. It is only
               drawn on the Freelancer card and never opens Admin.

   COG NOTE:   after an interactive login or pick (never a silent resume) a
               dismissible note points at the settings gear: the node
               remembers the choice, and the gear is where to change it.
   =========================================================================== */
window.EN = window.EN || {};
EN.gate = (function () {

  /* ===================== EDIT HERE ===================== */
  var CONFIG = {
    enabled: true,               // false turns the gate off without removing the file
    password: "EN763!",          // the Freelancer access code
    adminPassword: "GM763!",     // the Admin operator passphrase
    remember: "local"            // "local" = ask once per device, "session" = once per tab, false = every load
  };
  /* ===================================================== */

  var KEYS = { freelancer: "en_gate_ok_v1", admin: "en_gate_admin_ok_v1" };
  function bin() { return CONFIG.remember === "session" ? window.sessionStorage : window.localStorage; }
  function unlocked(p) {
    if (!CONFIG.enabled) return true;
    try { return !!CONFIG.remember && bin().getItem(KEYS[p]) === "1"; } catch (e) { return false; }
  }
  function persist(p) { if (!CONFIG.remember) return; try { bin().setItem(KEYS[p], "1"); } catch (e) {} }

  var CSS = [
    "#gate{ position:fixed; inset:0; z-index:100000; display:flex; align-items:center; justify-content:center;",
    "  background:radial-gradient(1100px 560px at 50% 28%, rgba(0,229,255,0.06), transparent 60%),",
    "  repeating-linear-gradient(0deg, rgba(0,229,255,0.035) 0 1px, transparent 1px 3px), var(--bg);",
    "  font-family:var(--mono); animation:gate-in .3s ease both; }",
    "#gate.admin{ background:radial-gradient(1100px 560px at 50% 28%, var(--gc-glow-bg), transparent 60%),",
    "  repeating-linear-gradient(0deg, var(--gc-scan) 0 1px, transparent 1px 3px), var(--bg); }",
    "#gate.ok{ animation:gate-out .45s ease forwards; pointer-events:none; }",
    "@keyframes gate-in{ from{opacity:0} to{opacity:1} }",
    "@keyframes gate-out{ to{opacity:0; visibility:hidden} }",
    ".gate-card{ width:min(92vw,430px); background:linear-gradient(180deg, var(--bg2), var(--bg1));",
    "  border:1px solid var(--accent-dim); border-radius:6px; padding:26px 26px 20px; position:relative; z-index:1;",
    "  box-shadow:0 0 0 1px rgba(0,229,255,0.08), 0 18px 60px rgba(0,0,0,.6), var(--glow-cyan); }",
    "#gate.admin .gate-card{ border-color:var(--gcd); box-shadow:0 0 0 1px var(--gc-ring), 0 18px 60px rgba(0,0,0,.6), 0 0 18px var(--gc-glow); }",
    "#gate.deny .gate-card{ animation:gate-shake .42s cubic-bezier(.36,.07,.19,.97) both; border-color:var(--danger); }",
    "@keyframes gate-shake{ 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-7px)} 40%,60%{transform:translateX(7px)} }",
    ".gate-kick{ font-size:10px; letter-spacing:.22em; color:var(--text3); text-transform:uppercase; }",
    ".gate-logo{ font-family:var(--disp); font-weight:700; font-size:34px; letter-spacing:.12em; color:var(--text); margin:4px 0 2px; }",
    ".gate-logo b{ color:var(--accent); }",
    "#gate.admin .gate-logo b{ color:var(--gc); }",
    ".gate-logo .op{ font-family:var(--mono); font-size:11px; letter-spacing:.22em; color:var(--gcd); font-weight:400; margin-left:8px; vertical-align:middle; }",
    ".gate-warn{ font-size:11px; letter-spacing:.18em; color:var(--ember); margin-bottom:12px; }",
    "#gate.admin .gate-warn{ color:var(--gc); }",
    ".gate-body{ font-size:12px; line-height:1.5; color:var(--text2); margin:0 0 18px; }",
    ".gate-label{ display:block; font-size:10px; letter-spacing:.16em; color:var(--text3); margin-bottom:6px; }",
    ".gate-inrow{ display:flex; align-items:center; gap:8px; background:var(--bg); border:1px solid var(--border2); border-radius:4px; padding:9px 11px; }",
    ".gate-inrow:focus-within{ border-color:var(--accent); box-shadow:var(--glow-cyan); }",
    "#gate.admin .gate-inrow:focus-within{ border-color:var(--gc); box-shadow:0 0 18px var(--gc-glow); }",
    ".gate-prompt{ color:var(--accent); font-size:14px; }",
    "#gate.admin .gate-prompt{ color:var(--gc); }",
    ".gate-pass{ flex:1; background:transparent; border:0; outline:0; color:var(--text); font-family:var(--mono); font-size:15px; letter-spacing:.18em; min-width:0; }",
    ".gate-pass::placeholder{ color:var(--text4); letter-spacing:.3em; }",
    ".gate-pass:disabled{ opacity:.4; }",
    ".gate-go{ width:100%; margin-top:14px; padding:10px; background:var(--accent); color:#04222a; border:0; border-radius:4px;",
    "  font-family:var(--disp); font-weight:700; font-size:14px; letter-spacing:.18em; cursor:pointer; transition:filter .15s; }",
    ".gate-go:hover{ filter:brightness(1.12); }",
    ".gate-go:disabled{ opacity:.35; cursor:not-allowed; filter:none; }",
    "#gate.admin .gate-go{ background:var(--gc); color:#2a2408; }",
    ".gate-err{ min-height:16px; margin-top:12px; font-size:11px; letter-spacing:.1em; color:var(--danger); text-align:center; }",
    ".gate-foot{ margin-top:16px; text-align:center; font-size:9px; letter-spacing:.2em; color:var(--text4); }",
    "/* ----- switch user row, under the button on either login card ----- */",
    ".gate-sw{ margin-top:14px; padding-top:12px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; gap:10px; }",
    ".gate-sw .who{ font-size:9.5px; letter-spacing:.18em; color:var(--text4); text-transform:uppercase; }",
    ".gate-sw .who b{ font-weight:400; color:var(--accent); }",
    "#gate.admin .gate-sw .who b{ color:var(--gc); }",
    ".gate-swb{ font-family:var(--disp); font-weight:600; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--text3);",
    "  background:transparent; border:1px solid var(--border2); border-radius:4px; padding:6px 11px; cursor:pointer; transition:color .15s, border-color .15s; white-space:nowrap; }",
    ".gate-swb:hover{ color:var(--text); border-color:var(--accent); }",
    "#gate.admin .gate-swb:hover{ border-color:var(--gc); }",
    "/* ----- the profile picker ----- */",
    ".gate-pick{ font-size:11px; letter-spacing:.18em; color:var(--accent); text-transform:uppercase; margin:2px 0 12px; }",
    ".gate-prof{ display:flex; align-items:center; gap:14px; width:100%; text-align:left; padding:13px 14px; margin-top:8px;",
    "  background:var(--bg); border:1px solid var(--border2); border-radius:5px; cursor:pointer; transition:transform .15s, border-color .15s; font-family:var(--body); color:var(--text); }",
    ".gate-prof:hover{ transform:translateY(-1px); }",
    ".gate-prof .gl{ font-size:20px; line-height:1; color:var(--pc); }",
    ".gate-prof .nm{ font-family:var(--disp); font-weight:700; font-size:15px; letter-spacing:.14em; text-transform:uppercase; color:var(--pc); }",
    ".gate-prof .ds{ font-family:var(--mono); font-size:10.5px; color:var(--text3); margin-top:2px; }",
    ".gate-prof .st{ margin-left:auto; font-family:var(--mono); font-size:9px; letter-spacing:.16em; color:var(--text4); text-transform:uppercase; white-space:nowrap; }",
    ".gate-prof:hover{ border-color:var(--pc); }",
    "/* ----- maintenance bypass: deliberately the quietest thing on the screen ----- */",
    ".gate-skip{ position:absolute; left:14px; bottom:12px; z-index:2; background:none; border:0; padding:7px 9px;",
    "  font-family:var(--mono); font-size:9px; letter-spacing:.18em; text-transform:uppercase;",
    "  color:var(--text4); opacity:.45; cursor:pointer; transition:opacity .18s, color .18s; }",
    ".gate-skip:hover{ opacity:1; color:var(--accent); }",
    ".gate-skip:focus-visible{ opacity:1; color:var(--accent); outline:1px solid var(--accent-dim); outline-offset:2px; }",
    "/* ----- 3-strikes Codebreaker hijack easter egg (Freelancer) ----- */",
    ".gate-card.hijacked{ animation:gate-glitch .5s steps(2) 2; border-color:var(--accent); box-shadow:0 0 0 1px var(--accent), 0 0 44px rgba(0,229,255,.4); }",
    "@keyframes gate-glitch{ 0%,100%{transform:translate(0,0); filter:none} 20%{transform:translate(-3px,1px)} 40%{transform:translate(3px,-2px); filter:hue-rotate(45deg)} 60%{transform:translate(-2px,1px)} 80%{transform:translate(2px,-1px); filter:hue-rotate(-35deg)} }",
    "#gate.hijacking::before{ content:''; position:absolute; inset:0; z-index:0; pointer-events:none; mix-blend-mode:screen; background:repeating-linear-gradient(0deg, rgba(255,70,200,0.06) 0 1px, transparent 1px 4px), repeating-linear-gradient(0deg, rgba(0,229,255,0.05) 0 2px, transparent 2px 6px); animation:gate-bgglitch .85s steps(10) infinite; }",
    "@keyframes gate-bgglitch{ 0%{transform:translateY(0); opacity:.4} 18%{transform:translate(2px,-2px); opacity:.85} 36%{transform:translateY(2px); opacity:.3} 54%{transform:translate(-3px,1px); opacity:.7} 72%{transform:translateY(-1px); opacity:.5} 90%{transform:translate(1px,2px); opacity:.8} 100%{transform:translateY(0); opacity:.4} }",
    ".gate-hijack{ font-family:var(--mono); }",
    ".gate-term{ background:var(--bg); border:1px solid var(--accent-dim); border-radius:4px; padding:12px; height:208px; overflow:hidden; font-size:12px; line-height:1.5; }",
    "/* the Admin tunnel log is a short live feed above the prompt, not a full-height terminal */",
    ".gate-term.vpn{ height:auto; min-height:96px; border-color:var(--gcd); font-size:11.5px; margin:2px 0 14px; }",
    ".gate-line{ white-space:pre-wrap; word-break:break-word; opacity:0; animation:gate-linein .16s ease forwards; }",
    "@keyframes gate-linein{ from{opacity:0; transform:translateY(3px)} to{opacity:1; transform:none} }",
    ".gate-sys{ color:var(--text3); }",
    ".gate-cb{ color:#ff46c8; text-shadow:0 0 8px rgba(255,70,200,.45); }",
    ".gate-cb::before{ content:'>> '; color:var(--text4); text-shadow:none; }",
    ".gate-ok-line{ color:var(--success); letter-spacing:.12em; }",
    ".gate-au-line{ color:var(--gc); }",
    ".gate-bad-line{ color:var(--danger); }",
    ".gate-cur::after{ content:'_'; animation:gate-blink 1s steps(2) infinite; }",
    "@keyframes gate-blink{ 50%{opacity:0} }",
    ".gate-prog{ margin-top:12px; height:8px; border:1px solid var(--accent-dim); border-radius:3px; overflow:hidden; background:rgba(0,229,255,.06); }",
    ".gate-progfill{ height:100%; width:0; background:linear-gradient(90deg, var(--accent), #ff46c8); box-shadow:0 0 10px var(--accent); transition:width .7s linear; }",
    "/* ----- 3-strikes #GRID Guardian override easter egg (Admin) ----- */",
    "#gate.guardian{ background:radial-gradient(1100px 560px at 50% 28%, rgba(46,230,160,0.07), transparent 60%),",
    "  repeating-linear-gradient(0deg, rgba(46,230,160,0.04) 0 1px, transparent 1px 3px), var(--bg); }",
    "#gate.guardian .gate-card{ animation:gate-glitch .5s steps(2) 2; border-color:var(--success); box-shadow:0 0 0 1px var(--success), 0 0 44px rgba(46,230,160,.35); }",
    "#gate.guardian .gate-term.vpn{ border-color:var(--success); }",
    "#gate.guardian .gate-logo b{ color:var(--success); }",
    "#gate.guardian .gate-kick, #gate.guardian .gate-warn{ color:var(--success); }",
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
    "/* ----- the settings-cog note, shown once after an interactive login or pick ----- */",
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

  /* ---- colors ------------------------------------------------------------
     The Freelancer card wears the live theme accent, exactly as it always did.
     The Admin card wears the Admin desktop's own default palette (Elysium
     Nights, gold), read from the theme table rather than hardcoded, with a
     fallback so a missing theme module cannot blank the card. */
  function hexRgba(hex, a) {
    var h = (hex || "#ead6a0").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return "rgba(" + parseInt(h.substr(0, 2), 16) + "," + parseInt(h.substr(2, 2), 16) + "," + parseInt(h.substr(4, 2), 16) + "," + a + ")";
  }
  function adminPalette() {
    var t = null;
    try { t = EN.theme && EN.theme.find && EN.theme.find("highheavens"); } catch (e) {}
    return { accent: (t && t.accent) || "#ead6a0", dim: (t && t.dim) || "#9c8a55" };
  }
  function freelancerAccent() {
    try { return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#00e5ff"; } catch (e) { return "#00e5ff"; }
  }
  function hasAdmin() { try { return !!(EN.app && EN.app.hasAdmin && EN.app.hasAdmin()); } catch (e) { return false; } }
  function rememberedProfile() {
    try { var p = EN.app && EN.app.portal && EN.app.portal(); return p === "admin" ? "admin" : "freelancer"; } catch (e) { return "freelancer"; }
  }

  // ---- 3-strikes Codebreaker hijack easter egg (Freelancer) ----
  function gateLine(term, cls, text) {
    var d = document.createElement("div");
    d.className = "gate-line " + cls;
    d.textContent = text;
    term.appendChild(d);
    term.scrollTop = term.scrollHeight;
    return d;
  }
  // stream the intrusion script into the terminal, advancing the bypass bar, then call done()
  function runHijackScript(term, fill, done) {
    var steps = [
      { t: 0,   cls: "gate-sys",     text: "// INTRUSION DETECTED on NODE 763" },
      { t: 520, cls: "gate-sys",     text: "// foreign process has attached to this terminal" },
      { t: 720, cls: "gate-cb",      text: "three misses. that was never your door." },
      { t: 950, cls: "gate-cb",      text: "relax. i have been camped inside this node the whole time. i will walk you in." },
      { t: 820, cls: "gate-sys",     text: "injecting cipher  ::  ACCESS_SPIKE", prog: 20 },
      { t: 620, cls: "gate-sys",     text: "spoofing credential handshake .........", prog: 48 },
      { t: 640, cls: "gate-sys",     text: "rotating session token ................", prog: 72 },
      { t: 600, cls: "gate-sys",     text: "flushing trace logs ...................", prog: 93 },
      { t: 640, cls: "gate-ok-line", text: "FIREWALL  ::  BYPASSED", prog: 100 },
      { t: 840, cls: "gate-cb",      text: "door's open. you were never here. neither was i." },
      { t: 760, cls: "gate-ok-line", text: "ACCESS GRANTED" }
    ];
    var i = 0;
    (function next() {
      if (i >= steps.length) {
        // a deliberately slow "opening the channel" bar, purely to give time to read the terminal
        gateLine(term, "gate-sys", "// opening secure channel, stand by ...");
        if (fill) {
          fill.style.transition = "none"; fill.style.width = "0%";
          void fill.offsetWidth;
          fill.style.transition = "width 3.4s linear"; fill.style.width = "100%";
        }
        setTimeout(done, 3600);
        return;
      }
      var s = steps[i++];
      setTimeout(function () {
        gateLine(term, s.cls, s.text);
        if (s.prog != null && fill) fill.style.width = s.prog + "%";
        next();
      }, s.t);
    })();
  }

  // ---- 3-strikes #GRID Guardian override easter egg (Admin) ----
  // progressively resolve a line out of noise: each frame, more characters
  // settle on the target while the rest keep churning through block glyphs
  function scramble(node, target, finalCls, done) {
    var glyphs = "░▒▓█#@%&*<>/|=+_~^:;01";
    var frames = 16, i = 0;
    (function tick() {
      if (!node.parentNode) return;
      i++;
      if (i <= frames) {
        var s = "";
        for (var k = 0; k < target.length; k++) {
          s += (target[k] === " " || Math.random() < (i / frames) * (i / frames)) ? target[k] : glyphs[Math.floor(Math.random() * glyphs.length)];
        }
        node.textContent = s;
        setTimeout(tick, 70);
      } else {
        node.textContent = target;
        node.className = "gate-line " + finalCls;
        done();
      }
    })();
  }
  // typewriter into a span; the trailing block cursor is CSS while .typing is on
  function typeInto(span, text, done) {
    span.textContent = "";
    span.classList.add("typing");
    var i = 0;
    (function tick() {
      if (!span.parentNode) return;
      if (i < text.length) { span.textContent += text.charAt(i++); setTimeout(tick, 18); }
      else { span.classList.remove("typing"); done(); }
    })();
  }
  // the off-brand paperclip: a bent wire with eyes, nothing anyone could sue over
  function clipSvg() {
    return '<svg class="gate-clipsvg" viewBox="0 0 64 84" aria-hidden="true">' +
      '<path d="M19 76 V22 a13 13 0 0 1 26 0 V62 a7 7 0 0 1 -14 0 V30" fill="none" stroke="#2ee6a0" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="27" cy="41" r="4.6" fill="#e9f1fb"/><circle cx="39" cy="41" r="4.6" fill="#e9f1fb"/>' +
      '<circle cx="28" cy="41.5" r="2" fill="#07090d"/><circle cx="40" cy="41.5" r="2" fill="#07090d"/>' +
      '<path d="M22 33 l7 -3 M44 30 l-7 3" stroke="#2ee6a0" stroke-width="2.2" stroke-linecap="round"/>' +
      '</svg>';
  }

  /* Dev bypass. This gate is atmosphere, not security: a real unlock writes one
     localStorage flag that anyone can set from the console in a second. Loading
     with ?dev (or ?nogate) in the query string skips the screen and drops you on
     the Identity step, which is where testing starts. It writes the same flag a
     real unlock does, so later reloads stay open without carrying the parameter,
     and clearing site data restores the gate. ?portal=admin picks the Admin
     profile instead (and with ?dev, skips its passphrase too). */
  function devBypass() {
    try { return /[?&](dev|nogate)/.test(window.location.search); } catch (e) { return false; }
  }
  function queryAdmin() {
    try { return /[?&]portal=admin\b/.test(window.location.search); } catch (e) { return false; }
  }
  /* ?login forces the gate to paint even though the profile is already
     unlocked, for testing the login screens themselves. It clears nothing, so
     a reload without it resumes silently as before. ?login&portal=admin opens
     straight on the Admin card. */
  function queryLogin() {
    try { return /[?&](login|gate)\b/.test(window.location.search); } catch (e) { return false; }
  }

  /* ---- the overlay ---------------------------------------------------------
     One overlay, re-rendered per state. `state.mode` is "login" or "pick";
     `state.profile` is which login card, or which profile the picker opened
     from. `onDone(profile)` is the single exit, whether by code, hijack,
     maintenance, or picking a profile that was already unlocked. */
  var _ov = null, _state = null;

  function open(opts) {
    injectCss();
    // the cog note outranks the gate in z-order (it must sit above the tab
    // rail), so a live one would float over the picker; it has said its piece
    var oldCoach = document.getElementById("gate-coach");
    if (oldCoach && oldCoach.parentNode) oldCoach.parentNode.removeChild(oldCoach);
    _state = { profile: opts.profile || "freelancer", mode: opts.mode || "login",
               onDone: opts.onDone, cancelable: !!opts.cancelable };
    if (!_ov || !_ov.parentNode) {
      _ov = document.createElement("div");
      _ov.id = "gate";
      document.body.appendChild(_ov);
    }
    _ov.className = "";
    renderState();
  }

  function closeOverlay(fade) {
    var ov = _ov; _ov = null; _state = null;
    if (!ov) return;
    ov.classList.add("ok");
    setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, fade || 480);
  }

  /* THE one way this node opens, shared by every route in: a correct code on
     either card, the Codebreaker hijack, the maintenance bypass, and a picker
     row for an already-unlocked profile. They differ only in how long the
     overlay lingers, so each passes its own fade, and none owns a private copy
     of "persist, hand over, tidy up, point at the gear" that could drift. */
  function finish(profile, fade) {
    var done = _state && _state.onDone;
    persist(profile);
    closeOverlay(fade);
    if (done) done(profile);
    // onDone ran setPortal (a synchronous render) and, at boot, revealed #os,
    // so the gear has real layout by the time this looks for it
    coach(profile);
  }

  function renderState() {
    var ov = _ov, st = _state;
    ov.classList.remove("hijacking");
    var pal = adminPalette();
    ov.style.setProperty("--gc", pal.accent);
    ov.style.setProperty("--gcd", pal.dim);
    ov.style.setProperty("--gc-glow", hexRgba(pal.accent, 0.30));
    ov.style.setProperty("--gc-ring", hexRgba(pal.accent, 0.08));
    ov.style.setProperty("--gc-glow-bg", hexRgba(pal.accent, 0.06));
    ov.style.setProperty("--gc-scan", hexRgba(pal.accent, 0.035));
    if (st.mode === "pick") renderPicker();
    else if (st.profile === "admin") renderAdminLogin();
    else renderFreelancerLogin();
  }

  function switchRow(profile) {
    var who = profile === "admin" ? "&#9670; Admin" : "&#10022; Freelancer";
    return '<div class="gate-sw"><span class="who">Profile &nbsp;<b>' + who + '</b></span>' +
           '<button type="button" class="gate-swb" id="gate-switch" title="Sign in as the other profile">&#8646; Switch user</button></div>';
  }

  function renderFreelancerLogin() {
    var ov = _ov;
    ov.classList.remove("admin");
    ov.innerHTML =
      '<div class="gate-card">' +
        '<div class="gate-kick">#MINT // SECURE NODE</div>' +
        '<div class="gate-logo">#GRID<b>OS</b></div>' +
        '<div class="gate-warn">&#9888; RESTRICTED ACCESS</div>' +
        '<p class="gate-body">This node is credential-locked. Unauthorized access is logged and prosecuted.</p>' +
        '<label class="gate-label" for="gate-pass">ACCESS CODE</label>' +
        '<div class="gate-inrow"><span class="gate-prompt">&gt;</span>' +
          '<input id="gate-pass" class="gate-pass" type="password" autocomplete="off" spellcheck="false" placeholder="............"></div>' +
        '<button id="gate-go" class="gate-go" type="button">AUTHENTICATE</button>' +
        '<div id="gate-err" class="gate-err"></div>' +
        switchRow("freelancer") +
        '<div class="gate-foot">NODE 763 // ELYSIUM NIGHTS</div>' +
      '</div>' +
      /* Sits in the corner of the NODE, not on the card, so it reads as part of the
         terminal furniture rather than an option the login screen is offering. */
      '<button id="gate-skip" class="gate-skip" type="button" title="Open the node without a code">// maintenance</button>';
    var input = ov.querySelector("#gate-pass");
    var err = ov.querySelector("#gate-err");
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);

    var tries = 0, hijacked = false;

    // third failed code: an unseen Codebreaker takes over the node and bypasses the gate
    function codebreakerHijack() {
      var card = ov.querySelector(".gate-card");
      if (!card) { finish("freelancer", 0); return; }   // nothing to glitch: open it without the theatre
      card.classList.add("hijacked");
      ov.classList.add("hijacking");   // glitch the whole node background while the break is live
      setTimeout(function () {
        card.innerHTML =
          '<div class="gate-hijack">' +
            '<div class="gate-kick" style="color:#ff46c8; margin-bottom:10px">UNKNOWN NODE // SESSION HIJACKED</div>' +
            '<div class="gate-term"></div>' +
            '<div class="gate-prog"><div class="gate-progfill"></div></div>' +
          '</div>';
        runHijackScript(card.querySelector(".gate-term"), card.querySelector(".gate-progfill"), function () {
          finish("freelancer", 540);
        });
      }, 540);
    }

    function submit() {
      if (hijacked) return;
      if (input.value === CONFIG.password) {
        err.style.color = "var(--success)";
        err.textContent = "ACCESS GRANTED";
        finish("freelancer");
        return;
      }
      tries++;
      if (tries >= 3) {            // strike three: hand the keys to the Codebreaker
        hijacked = true;
        codebreakerHijack();
        return;
      }
      err.textContent = "ACCESS DENIED :: INVALID CREDENTIALS";
      ov.classList.remove("deny"); void ov.offsetWidth; ov.classList.add("deny");
      input.value = ""; input.focus();
    }
    ov.querySelector("#gate-go").addEventListener("click", submit);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    ov.querySelector("#gate-switch").addEventListener("click", function () { _state.mode = "pick"; renderState(); });

    /* Opens the Freelancer node the same way a correct code does, flag and all,
       so a reload does not ask again. It costs nothing the gate was protecting:
       the code sits in this file in plain text a few lines up, and three wrong
       guesses already walk you in. It never opens Admin. */
    ov.querySelector("#gate-skip").addEventListener("click", function () { finish("freelancer"); });
  }

  function renderAdminLogin() {
    var ov = _ov;
    ov.classList.add("admin");
    ov.innerHTML =
      '<div class="gate-card">' +
        '<div class="gate-kick">CORPSEC VPN // BACKEND ACCESS</div>' +
        '<div class="gate-logo">#GRID<b>OS</b><span class="op">OPERATOR</span></div>' +
        '<div class="gate-warn">&#9670; PRIVILEGED SESSION &middot; ALL ACTIVITY IS AUDITED</div>' +
        '<div class="gate-term vpn" id="gate-vpn"></div>' +
        '<label class="gate-label" for="gate-pass">operator@node763:~$</label>' +
        '<div class="gate-inrow"><span class="gate-prompt">$</span>' +
          '<input id="gate-pass" class="gate-pass" type="password" autocomplete="off" spellcheck="false" placeholder="............"></div>' +
        '<button id="gate-go" class="gate-go" type="button">ESTABLISH TUNNEL</button>' +
        '<div id="gate-err" class="gate-err"></div>' +
        switchRow("admin") +
        '<div class="gate-foot">NODE 763 // OPERATOR CONSOLE</div>' +
      '</div>';
    var input = ov.querySelector("#gate-pass");
    var err = ov.querySelector("#gate-err");
    var go = ov.querySelector("#gate-go");
    var term = ov.querySelector("#gate-vpn");

    // the handshake log streams in on open; the prompt is live the whole time,
    // so an operator who knows the passphrase never waits on the theatre
    var lines = [
      { t: 0,   cls: "gate-sys",     text: "> resolving gm.node763.internal ……… OK" },
      { t: 260, cls: "gate-sys",     text: "> negotiating tunnel ……… TLS 1.3" },
      { t: 260, cls: "gate-sys",     text: "> pinning operator cert ……… OK" },
      { t: 300, cls: "gate-au-line", text: "> challenge: operator passphrase required", cur: true }
    ];
    var li = 0, alive = true;
    (function next() {
      if (!alive || li >= lines.length || !term.parentNode) return;
      var s = lines[li++];
      setTimeout(function () {
        if (!alive || !term.parentNode) return;
        var d = gateLine(term, s.cls, s.text);
        if (s.cur) d.classList.add("gate-cur");
        next();
      }, s.t);
    })();
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);

    var tries = 0, cooling = false;
    function stripCursor() {
      var c = term.querySelector(".gate-cur"); if (c) c.classList.remove("gate-cur");
    }
    function submit() {
      if (cooling) return;
      stripCursor();
      if (input.value === CONFIG.adminPassword) {
        gateLine(term, "gate-ok-line", "> tunnel established. session audited.");
        err.style.color = "var(--success)";
        err.textContent = "TUNNEL ESTABLISHED";
        input.disabled = true; go.disabled = true;
        finish("admin", 700);
        return;
      }
      tries++;
      gateLine(term, "gate-bad-line", "> handshake rejected :: attempt " + tries + " logged");
      err.textContent = "HANDSHAKE REJECTED :: PASSPHRASE INVALID";
      ov.classList.remove("deny"); void ov.offsetWidth; ov.classList.add("deny");
      input.value = "";
      if (tries >= 3) {
        /* Strike three: the trace lands, the node locks, and about five seconds
           later the #GRID Guardian overrides it. The Guardian is the bestiary's
           corporate counter-hacker with admin authority over the whole cluster,
           so it is the one thing in the setting that can wave a trace away and
           call you valid. Mirrors the Freelancer hijack: a reward for fumbling,
           and a walk in. */
        cooling = true; input.disabled = true; go.disabled = true;
        var traceLine = gateLine(term, "gate-bad-line", "> trace initiated. cooling down.");
        err.textContent = "TRACE INITIATED :: NODE LOCKED";
        setTimeout(function () { if (term.parentNode) guardianOverride(traceLine); }, 5000);
        return;
      }
      input.focus();
    }

    function guardianOverride(traceLine) {
      var card = ov.querySelector(".gate-card");
      alive = false;
      stripCursor();
      // the trace line itself is what the Guardian rewrites, glyph by glyph
      scramble(traceLine, "> override :: #GRID GUARDIAN attached", "gate-ok-line", function () {
        ov.classList.add("guardian");
        err.style.color = "var(--success)";
        err.textContent = "OVERRIDE :: GUARDIAN ATTACHED";
        // the prompt, the button and Switch user all go quiet; the Guardian has the floor
        Array.prototype.forEach.call(card.querySelectorAll(".gate-inrow, .gate-label, #gate-go, .gate-sw"), function (n) { n.classList.add("gate-hide"); });
        var clip = document.createElement("div");
        clip.className = "gate-clip";
        clip.innerHTML = '<div class="gate-bubble"><span class="k">#GRID Guardian // assistive override</span><span class="t" id="gate-bubble"></span></div>' + clipSvg();
        err.parentNode.insertBefore(clip, err);
        var bubble = clip.querySelector("#gate-bubble");
        setTimeout(function () {
          typeInto(bubble, "It looks like you're trying to gain Admin access. Would you like help with that?", function () {
            setTimeout(function () {
              typeInto(bubble, "Hold still. Borrowing your cam for a quick retinal scan.", function () {
                var scan = [
                  { t: 350, cls: "gate-sys",     text: "> cam0 ……… ACQUIRED" },
                  { t: 550, cls: "gate-sys",     text: "> retinal pattern ……… MATCH" },
                  { t: 550, cls: "gate-ok-line", text: "> operator identity ……… VALID" }
                ];
                var si = 0;
                (function nextScan() {
                  if (si >= scan.length) {
                    setTimeout(function () {
                      typeInto(bubble, "Yep. Valid user. I ate the trace. Don't make me do this again.", function () {
                        setTimeout(function () {
                          gateLine(term, "gate-ok-line", "> tunnel established (guardian override). session audited.");
                          finish("admin", 900);
                        }, 1300);
                      });
                    }, 500);
                    return;
                  }
                  var s = scan[si++];
                  setTimeout(function () { if (term.parentNode) { gateLine(term, s.cls, s.text); nextScan(); } }, s.t);
                })();
              });
            }, 1400);
          });
        }, 450);
      });
    }
    go.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    ov.querySelector("#gate-switch").addEventListener("click", function () { alive = false; _state.mode = "pick"; renderState(); });
  }

  function renderPicker() {
    var ov = _ov, st = _state;
    ov.classList.remove("admin");
    var pal = adminPalette();
    var rows =
      '<button type="button" class="gate-prof" data-p="freelancer" style="--pc:' + freelancerAccent() + '">' +
        '<span class="gl">&#10022;</span><span><div class="nm">Freelancer</div><div class="ds">Your #PRINT, your crew, your gear.</div></span>' +
        '<span class="st">' + (unlocked("freelancer") ? "unlocked" : "needs code") + '</span></button>';
    if (hasAdmin()) rows +=
      '<button type="button" class="gate-prof" data-p="admin" style="--pc:' + pal.accent + '">' +
        '<span class="gl">&#9670;</span><span><div class="nm">Admin</div><div class="ds">Operator console. The other side of the table.</div></span>' +
        '<span class="st">' + (unlocked("admin") ? "unlocked" : "needs passphrase") + '</span></button>';
    ov.innerHTML =
      '<div class="gate-card">' +
        '<div class="gate-kick">#MINT // SECURE NODE</div>' +
        '<div class="gate-logo">#GRID<b>OS</b></div>' +
        '<div class="gate-pick">Select profile</div>' +
        rows +
        '<div class="gate-sw"><span class="who">The node remembers your pick</span>' +
          '<button type="button" class="gate-swb" id="gate-back">' + (st.cancelable ? "&#10005; Cancel" : "&#8592; Back") + '</button></div>' +
        '<div class="gate-foot">NODE 763 // ELYSIUM NIGHTS</div>' +
      '</div>';
    Array.prototype.forEach.call(ov.querySelectorAll(".gate-prof"), function (b) {
      b.addEventListener("click", function () {
        var p = b.getAttribute("data-p");
        if (unlocked(p)) finish(p);
        else { _state.profile = p; _state.mode = "login"; renderState(); }
      });
    });
    ov.querySelector("#gate-back").addEventListener("click", function () {
      if (st.cancelable) closeOverlay();
      else { _state.mode = "login"; renderState(); }
    });
  }

  /* Points at the settings cog once, right after an interactive login or
     pick, and only then: a silent resume never opens the overlay, so it never
     reaches here. Dismisses on its button, on Escape, and on clicking the cog
     itself, since at that point the user has done the thing it points at. */
  function coach(profile) {
    var old = document.getElementById("gate-coach");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var gear = document.querySelector(".os-gear");
    if (!gear) return;               // nothing to point at; say nothing rather than float in space
    var accent = profile === "admin" ? adminPalette().accent : freelancerAccent();
    var r = gear.getBoundingClientRect();
    var box = document.createElement("div");
    box.id = "gate-coach";
    box.style.setProperty("--cc", accent);
    box.style.setProperty("--cc-glow", hexRgba(accent, 0.3));
    var left = Math.max(10, Math.min(window.innerWidth - 280, r.right - 270));
    box.style.left = left + "px";
    box.style.top = (r.bottom + 10) + "px";
    box.innerHTML =
      '<div class="gc-kick">' + (profile === "admin" ? "Admin desktop" : "Freelancer desktop") + '</div>' +
      '<div class="gc-title">You are on the ' + (profile === "admin" ? "table" : "player") + ' side</div>' +
      '<div class="gc-body">The node remembers this profile, so the gate will not ask again. Switch user any time from the cog.</div>' +
      '<button type="button" class="gc-go">Got it</button>';
    var caretLeft = Math.max(10, r.left + r.width / 2 - left - 6);
    var styleTag = document.createElement("style");
    styleTag.textContent = "#gate-coach::before{ left:" + caretLeft + "px; }";
    document.head.appendChild(styleTag);
    document.body.appendChild(box);
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

  /* ---- entry points ------------------------------------------------------ */

  /* Boot. Resolves the target profile (query override, else the remembered
     desktop), and either hands over silently when that profile is already
     unlocked, or paints its login card. */
  function require(onUnlock) {
    var target = queryAdmin() ? "admin" : (devBypass() ? "freelancer" : rememberedProfile());
    if (devBypass()) {
      persist(target);
      onUnlock(target);
      setTimeout(function () {
        // ?dev's "land on Identity" habit is a Freelancer-side habit; on Admin
        // it would jump a ?dev&portal=admin tester straight back out.
        try { if (target !== "admin" && EN.app && EN.app.gotoTab) EN.app.gotoTab("print"); } catch (e) {}
      }, 0);
      return;
    }
    if (!CONFIG.enabled || (unlocked(target) && !queryLogin())) { onUnlock(target); return; }
    open({ profile: target, mode: "login", onDone: onUnlock, cancelable: false });
  }

  /* From the settings tray. Opens straight on the picker; a profile already
     unlocked is one click, the other asks for its code. Cancel closes it. */
  function switchUser(onPick) {
    open({ profile: rememberedProfile(), mode: "pick", onDone: onPick, cancelable: true });
  }

  /* From the settings tray. Forgets BOTH profiles' unlocks (author's call:
     sign out means the whole node, not one side of it) and reopens the
     current profile's login card over the desktop, so the next reload asks
     too. Switch user from that card still reaches the other profile, which
     now asks for its code as well. Backing out through Switch user then
     Cancel leaves the desktop up but the flags cleared, which is the honest
     state. */
  function signOut(onDone) {
    try { bin().removeItem(KEYS.freelancer); bin().removeItem(KEYS.admin); } catch (e) {}
    open({ profile: rememberedProfile(), mode: "login", onDone: onDone, cancelable: true });
  }

  return { require: require, switchUser: switchUser, signOut: signOut, coach: coach };
})();
