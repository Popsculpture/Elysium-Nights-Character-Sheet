/* ===========================================================================
   ELYSIUM NIGHTS // #GRID OS access gate
   A thematic, credential-locked splash shown after the boot animation and
   before the OS opens.

   IMPORTANT: this is a client-side gate for light gatekeeping and flavor only.
   The code and password live in the page source, so it deters casual visitors
   but is NOT real security. Anyone can read the files or open app/ directly.

   TO CHANGE THE CODE:   edit CONFIG.password below.
   TO TURN IT OFF:       set CONFIG.enabled to false.
   TO REMOVE COMPLETELY: delete the <script src="js/gate.js"></script> line in
                         index.html (the app then opens with no gate).

   EASTER EGG: three wrong codes summons an unseen Codebreaker who hijacks the
               node and walks the visitor past the gate. Pure flavor (the gate
               was never real security), and a reward for fumbling the password.

   BYPASS:     a deliberately quiet "// maintenance" button in the lower left of
               the node opens it with no code. It is dim until hovered so it reads
               as terminal furniture rather than an offer, and it writes the same
               unlock flag every other route does, so a reload will not ask again.
               Clearing site data (or removing en_gate_ok_v1) restores the gate.
   =========================================================================== */
window.EN = window.EN || {};
EN.gate = (function () {

  /* ===================== EDIT HERE ===================== */
  var CONFIG = {
    enabled: true,        // false turns the gate off without removing the file
    password: "EN763!",   // the access code
    remember: "local"     // "local" = ask once per device, "session" = once per tab, false = every load
  };
  /* ===================================================== */

  var KEY = "en_gate_ok_v1";
  function bin() { return CONFIG.remember === "session" ? window.sessionStorage : window.localStorage; }
  function unlocked() { try { return !!CONFIG.remember && bin().getItem(KEY) === "1"; } catch (e) { return false; } }
  function persist() { if (!CONFIG.remember) return; try { bin().setItem(KEY, "1"); } catch (e) {} }

  var CSS = [
    "#gate{ position:fixed; inset:0; z-index:100000; display:flex; align-items:center; justify-content:center;",
    "  background:radial-gradient(1100px 560px at 50% 28%, rgba(0,229,255,0.06), transparent 60%),",
    "  repeating-linear-gradient(0deg, rgba(0,229,255,0.035) 0 1px, transparent 1px 3px), var(--bg);",
    "  font-family:var(--mono); animation:gate-in .3s ease both; }",
    "#gate.ok{ animation:gate-out .45s ease forwards; pointer-events:none; }",
    "@keyframes gate-in{ from{opacity:0} to{opacity:1} }",
    "@keyframes gate-out{ to{opacity:0; visibility:hidden} }",
    ".gate-card{ width:min(92vw,430px); background:linear-gradient(180deg, var(--bg2), var(--bg1));",
    "  border:1px solid var(--accent-dim); border-radius:6px; padding:26px 26px 20px; position:relative; z-index:1;",
    "  box-shadow:0 0 0 1px rgba(0,229,255,0.08), 0 18px 60px rgba(0,0,0,.6), var(--glow-cyan); }",
    "#gate.deny .gate-card{ animation:gate-shake .42s cubic-bezier(.36,.07,.19,.97) both; border-color:var(--danger); }",
    "@keyframes gate-shake{ 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-7px)} 40%,60%{transform:translateX(7px)} }",
    ".gate-kick{ font-size:10px; letter-spacing:.22em; color:var(--text3); text-transform:uppercase; }",
    ".gate-logo{ font-family:var(--disp); font-weight:700; font-size:34px; letter-spacing:.12em; color:var(--text); margin:4px 0 2px; }",
    ".gate-logo b{ color:var(--accent); }",
    ".gate-warn{ font-size:11px; letter-spacing:.18em; color:var(--ember); margin-bottom:12px; }",
    ".gate-body{ font-size:12px; line-height:1.5; color:var(--text2); margin:0 0 18px; }",
    ".gate-label{ display:block; font-size:10px; letter-spacing:.16em; color:var(--text3); margin-bottom:6px; }",
    ".gate-inrow{ display:flex; align-items:center; gap:8px; background:var(--bg); border:1px solid var(--border2); border-radius:4px; padding:9px 11px; }",
    ".gate-inrow:focus-within{ border-color:var(--accent); box-shadow:var(--glow-cyan); }",
    ".gate-prompt{ color:var(--accent); font-size:14px; }",
    "#gate-pass{ flex:1; background:transparent; border:0; outline:0; color:var(--text); font-family:var(--mono); font-size:15px; letter-spacing:.18em; }",
    "#gate-pass::placeholder{ color:var(--text4); letter-spacing:.3em; }",
    ".gate-go{ width:100%; margin-top:14px; padding:10px; background:var(--accent); color:#04222a; border:0; border-radius:4px;",
    "  font-family:var(--disp); font-weight:700; font-size:14px; letter-spacing:.18em; cursor:pointer; transition:filter .15s; }",
    ".gate-go:hover{ filter:brightness(1.12); }",
    ".gate-err{ min-height:16px; margin-top:12px; font-size:11px; letter-spacing:.1em; color:var(--danger); text-align:center; }",
    ".gate-foot{ margin-top:16px; text-align:center; font-size:9px; letter-spacing:.2em; color:var(--text4); }",
    "/* ----- maintenance bypass: deliberately the quietest thing on the screen ----- */",
    ".gate-skip{ position:absolute; left:14px; bottom:12px; z-index:2; background:none; border:0; padding:7px 9px;",
    "  font-family:var(--mono); font-size:9px; letter-spacing:.18em; text-transform:uppercase;",
    "  color:var(--text4); opacity:.45; cursor:pointer; transition:opacity .18s, color .18s; }",
    ".gate-skip:hover{ opacity:1; color:var(--accent); }",
    ".gate-skip:focus-visible{ opacity:1; color:var(--accent); outline:1px solid var(--accent-dim); outline-offset:2px; }",
    "/* ----- 3-strikes Codebreaker hijack easter egg ----- */",
    ".gate-card.hijacked{ animation:gate-glitch .5s steps(2) 2; border-color:var(--accent); box-shadow:0 0 0 1px var(--accent), 0 0 44px rgba(0,229,255,.4); }",
    "@keyframes gate-glitch{ 0%,100%{transform:translate(0,0); filter:none} 20%{transform:translate(-3px,1px)} 40%{transform:translate(3px,-2px); filter:hue-rotate(45deg)} 60%{transform:translate(-2px,1px)} 80%{transform:translate(2px,-1px); filter:hue-rotate(-35deg)} }",
    "#gate.hijacking::before{ content:''; position:absolute; inset:0; z-index:0; pointer-events:none; mix-blend-mode:screen; background:repeating-linear-gradient(0deg, rgba(255,70,200,0.06) 0 1px, transparent 1px 4px), repeating-linear-gradient(0deg, rgba(0,229,255,0.05) 0 2px, transparent 2px 6px); animation:gate-bgglitch .85s steps(10) infinite; }",
    "@keyframes gate-bgglitch{ 0%{transform:translateY(0); opacity:.4} 18%{transform:translate(2px,-2px); opacity:.85} 36%{transform:translateY(2px); opacity:.3} 54%{transform:translate(-3px,1px); opacity:.7} 72%{transform:translateY(-1px); opacity:.5} 90%{transform:translate(1px,2px); opacity:.8} 100%{transform:translateY(0); opacity:.4} }",
    ".gate-hijack{ font-family:var(--mono); }",
    ".gate-term{ background:var(--bg); border:1px solid var(--accent-dim); border-radius:4px; padding:12px; height:208px; overflow:hidden; font-size:12px; line-height:1.5; }",
    ".gate-line{ white-space:pre-wrap; word-break:break-word; opacity:0; animation:gate-linein .16s ease forwards; }",
    "@keyframes gate-linein{ from{opacity:0; transform:translateY(3px)} to{opacity:1; transform:none} }",
    ".gate-sys{ color:var(--text3); }",
    ".gate-cb{ color:#ff46c8; text-shadow:0 0 8px rgba(255,70,200,.45); }",
    ".gate-cb::before{ content:'>> '; color:var(--text4); text-shadow:none; }",
    ".gate-ok-line{ color:var(--success); letter-spacing:.12em; }",
    ".gate-prog{ margin-top:12px; height:8px; border:1px solid var(--accent-dim); border-radius:3px; overflow:hidden; background:rgba(0,229,255,.06); }",
    ".gate-progfill{ height:100%; width:0; background:linear-gradient(90deg, var(--accent), #ff46c8); box-shadow:0 0 10px var(--accent); transition:width .7s linear; }"
  ].join("\n");

  function injectCss() {
    if (document.getElementById("gate-css")) return;
    var s = document.createElement("style");
    s.id = "gate-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ---- 3-strikes Codebreaker hijack easter egg ----
  function gateLine(term, cls, text) {
    var d = document.createElement("div");
    d.className = "gate-line " + cls;
    d.textContent = text;
    term.appendChild(d);
    term.scrollTop = term.scrollHeight;
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

  /* Dev bypass. This gate is atmosphere, not security: a real unlock writes one
     localStorage flag that anyone can set from the console in a second. Loading
     with ?dev (or ?nogate) in the query string skips the screen and drops you on
     the Identity step, which is where testing starts. It writes the same flag a
     real unlock does, so later reloads stay open without carrying the parameter,
     and clearing site data restores the gate. */
  function devBypass() {
    try { return /[?&](dev|nogate)/.test(window.location.search); } catch (e) { return false; }
  }

  function require(onUnlock) {
    if (devBypass()) {
      persist();
      onUnlock();
      setTimeout(function () {
        try { if (EN.app && EN.app.gotoTab) EN.app.gotoTab("print"); } catch (e) {}
      }, 0);
      return;
    }
    if (!CONFIG.enabled || unlocked()) { onUnlock(); return; }
    injectCss();
    var ov = document.createElement("div");
    ov.id = "gate";
    ov.innerHTML =
      '<div class="gate-card">' +
        '<div class="gate-kick">#MINT // SECURE NODE</div>' +
        '<div class="gate-logo">#GRID<b>OS</b></div>' +
        '<div class="gate-warn">⚠ RESTRICTED ACCESS</div>' +
        '<p class="gate-body">This node is credential-locked. Unauthorized access is logged and prosecuted.</p>' +
        '<label class="gate-label" for="gate-pass">ACCESS CODE</label>' +
        '<div class="gate-inrow"><span class="gate-prompt">&gt;</span>' +
          '<input id="gate-pass" type="password" autocomplete="off" spellcheck="false" placeholder="............"></div>' +
        '<button id="gate-go" class="gate-go" type="button">AUTHENTICATE</button>' +
        '<div id="gate-err" class="gate-err"></div>' +
        '<div class="gate-foot">NODE 763 // ELYSIUM NIGHTS</div>' +
      '</div>' +
      /* Sits in the corner of the NODE, not on the card, so it reads as part of the
         terminal furniture rather than an option the login screen is offering. */
      '<button id="gate-skip" class="gate-skip" type="button" title="Open the node without a code">// maintenance</button>';
    document.body.appendChild(ov);
    var input = ov.querySelector("#gate-pass");
    var err = ov.querySelector("#gate-err");
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);

    var tries = 0, hijacked = false;

    /* THE one way this node opens, shared by all three routes in: a correct code, the
       Codebreaker hijack, and the maintenance bypass. They differ only in how long the
       overlay lingers, so each passes its own fade, and none of them owns a private copy
       of "persist, mark ok, hand over, tidy up" that could drift from the others. */
    function openNode(fade) {
      persist();
      ov.classList.add("ok");
      onUnlock();
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, fade || 480);
    }

    // third failed code: an unseen Codebreaker takes over the node and bypasses the gate
    function codebreakerHijack() {
      var card = ov.querySelector(".gate-card");
      if (!card) { openNode(0); return; }   // nothing to glitch: open it without the theatre
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
          openNode(540);
        });
      }, 540);
    }

    function submit() {
      if (hijacked) return;
      if (input.value === CONFIG.password) {
        err.style.color = "var(--success)";
        err.textContent = "ACCESS GRANTED";
        openNode();
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

    /* Opens the node the same way a correct code does, flag and all, so a reload does not
       ask again. It costs nothing the gate was protecting: the code sits in this file in
       plain text a few lines up, and three wrong guesses already walk you in. */
    ov.querySelector("#gate-skip").addEventListener("click", function () { openNode(); });
  }

  return { require: require };
})();
