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
    "  border:1px solid var(--accent-dim); border-radius:6px; padding:26px 26px 20px; position:relative;",
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
    ".gate-foot{ margin-top:16px; text-align:center; font-size:9px; letter-spacing:.2em; color:var(--text4); }"
  ].join("\n");

  function injectCss() {
    if (document.getElementById("gate-css")) return;
    var s = document.createElement("style");
    s.id = "gate-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function require(onUnlock) {
    if (!CONFIG.enabled || unlocked()) { onUnlock(); return; }
    injectCss();
    var ov = document.createElement("div");
    ov.id = "gate";
    ov.innerHTML =
      '<div class="gate-card">' +
        '<div class="gate-kick">LUSTER INTERCHANGE // SECURE NODE</div>' +
        '<div class="gate-logo">#GRID<b>OS</b></div>' +
        '<div class="gate-warn">⚠ RESTRICTED ACCESS</div>' +
        '<p class="gate-body">This node is credential-locked. Unauthorized access is logged and prosecuted.</p>' +
        '<label class="gate-label" for="gate-pass">ACCESS CODE</label>' +
        '<div class="gate-inrow"><span class="gate-prompt">&gt;</span>' +
          '<input id="gate-pass" type="password" autocomplete="off" spellcheck="false" placeholder="............"></div>' +
        '<button id="gate-go" class="gate-go" type="button">AUTHENTICATE</button>' +
        '<div id="gate-err" class="gate-err"></div>' +
        '<div class="gate-foot">NODE 763 // ELYSIUM NIGHTS</div>' +
      '</div>';
    document.body.appendChild(ov);
    var input = ov.querySelector("#gate-pass");
    var err = ov.querySelector("#gate-err");
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);

    function submit() {
      if (input.value === CONFIG.password) {
        persist();
        err.style.color = "var(--success)";
        err.textContent = "ACCESS GRANTED";
        ov.classList.add("ok");
        onUnlock();
        setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 480);
      } else {
        err.textContent = "ACCESS DENIED :: INVALID CREDENTIALS";
        ov.classList.remove("deny"); void ov.offsetWidth; ov.classList.add("deny");
        input.value = ""; input.focus();
      }
    }
    ov.querySelector("#gate-go").addEventListener("click", submit);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
  }

  return { require: require };
})();
