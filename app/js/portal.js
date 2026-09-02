/* ===========================================================================
   ELYSIUM NIGHTS // #GRID OS portal splash
   After the access gate, before the OS: which side of the table are you on.
   Two desktops share one node and nothing else. The Freelancer portal is the
   seven player tabs, unchanged. The Admin portal is the GM toolkit, finally on
   its own rail instead of a ninth tab on a player's sheet.

   THE CHOICE IS REMEMBERED (app.js owns en_portal_v1), so this screen is a
   first-run screen and a deliberate detour, never a toll booth on every load.
   choose() resolves instantly, with no UI at all, whenever a query bypass
   applies or a desktop is already on file. It only paints when neither is
   true, or when the caller asks for the detour outright (the `force`
   argument, used by the settings tray's "return to portal").

   Built self-contained in raw DOM, the same way gate.js is: this and the gate
   are the two overlays that run before the rest of the app can be trusted to
   exist, and each is independently deletable (see index.html).

   TO REMOVE: delete the <script src="js/portal.js"></script> line in
   index.html. app.js falls back to booting straight into the remembered (or
   default Freelancer) desktop with no chooser at all.
   =========================================================================== */
window.EN = window.EN || {};

EN.portal = (function () {

  var CSS = [
    "#portal-splash{ position:fixed; inset:0; z-index:100002; display:flex; align-items:center; justify-content:center;",
    "  background:radial-gradient(1100px 560px at 50% 28%, rgba(0,229,255,0.05), transparent 60%),",
    "  repeating-linear-gradient(0deg, rgba(0,229,255,0.03) 0 1px, transparent 1px 3px), var(--bg);",
    "  font-family:var(--mono); animation:portal-in .3s ease both; padding:20px; }",
    "#portal-splash.out{ animation:portal-out .3s ease forwards; pointer-events:none; }",
    "@keyframes portal-in{ from{opacity:0} to{opacity:1} }",
    "@keyframes portal-out{ to{opacity:0; visibility:hidden} }",
    ".pf-wrap{ width:min(92vw,640px); }",
    ".pf-kick{ text-align:center; font-size:10px; letter-spacing:.22em; color:var(--text3); text-transform:uppercase; }",
    ".pf-logo{ text-align:center; font-family:var(--disp); font-weight:700; font-size:30px; letter-spacing:.12em; color:var(--text); margin:4px 0 2px; }",
    ".pf-logo b{ color:var(--accent); }",
    ".pf-sub{ text-align:center; font-size:11px; letter-spacing:.18em; color:var(--accent); text-transform:uppercase; margin-bottom:18px; }",
    ".pf-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }",
    "@media(max-width:560px){ .pf-grid{ grid-template-columns:1fr; } }",
    ".pf-grid.solo{ grid-template-columns:1fr; max-width:300px; margin:0 auto; }",
    ".pf-card{ background:linear-gradient(180deg, var(--bg2), var(--bg1)); border:1px solid var(--border2);",
    "  border-radius:6px; padding:18px 16px 14px; cursor:pointer; text-align:left; position:relative;",
    "  transition:transform .15s, box-shadow .15s; font-family:var(--body); }",
    ".pf-card:hover{ transform:translateY(-2px); }",
    ".pf-card:focus-visible{ outline:2px solid var(--pf-c); outline-offset:2px; }",
    ".pf-glyph{ font-size:22px; line-height:1; color:var(--pf-c); }",
    ".pf-title{ font-family:var(--disp); font-weight:700; font-size:16px; letter-spacing:.16em; text-transform:uppercase; color:var(--pf-c); margin-top:6px; }",
    ".pf-desc{ font-size:12.5px; color:var(--text2); line-height:1.4; margin:7px 0 10px; }",
    ".pf-list{ font-family:var(--mono); font-size:10px; letter-spacing:.04em; color:var(--text3); line-height:1.7; }",
    ".pf-go{ margin-top:12px; width:100%; padding:8px; border:0; border-radius:4px; background:var(--pf-c); color:var(--pf-on);",
    "  font-family:var(--disp); font-weight:700; font-size:12px; letter-spacing:.18em; cursor:pointer; transition:filter .15s; }",
    ".pf-go:hover{ filter:brightness(1.12); }",
    ".pf-file{ margin-top:9px; text-align:center; font-size:9px; letter-spacing:.14em; color:var(--text4); text-transform:uppercase; }",
    ".pf-foot{ margin-top:16px; text-align:center; font-size:9px; letter-spacing:.2em; color:var(--text4); }",
    "/* ----- the settings-cog coachmark, shown once per splash pick ----- */",
    "#portal-coach{ position:fixed; z-index:100003; width:270px; background:linear-gradient(180deg, var(--bg2), var(--bg1));",
    "  border:1px solid var(--pf-c); border-radius:5px; padding:13px 14px 11px;",
    "  box-shadow:0 0 20px var(--pf-glow), 0 14px 40px rgba(0,0,0,.55); animation:portal-in .2s ease both; }",
    "#portal-coach::before{ content:''; position:absolute; top:-7px; width:12px; height:12px; background:var(--bg2);",
    "  border-left:1px solid var(--pf-c); border-top:1px solid var(--pf-c); transform:rotate(45deg); }",
    ".pc-kick{ font-family:var(--mono); font-size:8.5px; letter-spacing:.2em; color:var(--pf-c); text-transform:uppercase; opacity:.8; }",
    ".pc-title{ font-family:var(--disp); font-weight:700; font-size:13px; letter-spacing:.08em; color:var(--text); margin:3px 0 6px; }",
    ".pc-body{ font-size:12px; line-height:1.5; color:var(--text2); }",
    ".pc-go{ margin-top:10px; font-family:var(--disp); font-weight:600; font-size:11px; letter-spacing:.12em; text-transform:uppercase;",
    "  background:transparent; color:var(--pf-c); border:1px solid var(--pf-c); border-radius:4px; padding:5px 13px; cursor:pointer; }"
  ].join("\n");

  function injectCss() {
    if (document.getElementById("portal-css")) return;
    var s = document.createElement("style");
    s.id = "portal-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* Two different mechanics get two different readers. gate.js's ?dev skips a
     PASSWORD; this skips a CHOOSER. Regex shape copied verbatim from
     gate.js:153: a literal backspace once hid inside that exact pattern and
     silently disabled ?dev for a whole session. */
  function queryPortal() {
    try {
      if (/[?&]portal=admin\b/.test(window.location.search)) return "admin";
      if (/[?&](dev|nogate)/.test(window.location.search)) return "freelancer";
    } catch (e) {}
    return null;
  }

  function accentOf(themeKey, fallback) {
    try {
      var t = EN.theme && EN.theme.find && EN.theme.find(themeKey);
      return (t && t.accent) || fallback;
    } catch (e) { return fallback; }
  }

  // accent hex -> a translucent glow, for the coachmark's box-shadow
  function glowOf(hex) {
    var h = (hex || "#00e5ff").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return "rgba(" + r + "," + g + "," + b + ",0.3)";
  }

  function rosterCount() {
    try { return Object.keys((EN.store && EN.store.roster && EN.store.roster()) || {}).length; }
    catch (e) { return 0; }
  }
  function bestiaryCount() {
    try { return (EN.bestiary && EN.bestiary.entries && EN.bestiary.entries.length) || 0; }
    catch (e) { return 0; }
  }

  /* THE one way this screen resolves, whether or not it ever paints, so a
     caller cannot tell the difference except by whether the coachmark shows
     up afterward (paint() alone decides that). */
  function choose(onPick, force) {
    if (!force) {
      var qp = queryPortal();
      if (qp) { onPick(qp); return; }
      if (EN.app && EN.app.hasStoredPortal && EN.app.hasStoredPortal()) { onPick(EN.app.portal()); return; }
    }
    paint(onPick);
  }

  function paint(onPick) {
    injectCss();
    var freeAccent = accentOf((EN.theme && EN.theme.get && EN.theme.get()) || "grid", "#00e5ff");
    var adminAccent = accentOf("highheavens", "#ead6a0");
    // The Admin card is drawn only when the GM modules are present. Showing
    // it anyway would offer a desktop that does not exist: usePortal() would
    // silently correct the pick back to Freelancer, and a card whose "Enter"
    // quietly does something else is worse than a card that is not there.
    var hasAdmin = !!(EN.app && EN.app.hasAdmin && EN.app.hasAdmin());

    var ov = document.createElement("div");
    ov.id = "portal-splash";
    ov.innerHTML =
      '<div class="pf-wrap">' +
        '<div class="pf-kick">Node 763 // session open</div>' +
        '<div class="pf-logo">#GRID<b>OS</b></div>' +
        '<div class="pf-sub">select portal</div>' +
        '<div class="pf-grid' + (hasAdmin ? "" : " solo") + '">' +
          '<button type="button" class="pf-card" id="pf-freelancer" style="--pf-c:' + freeAccent + '">' +
            '<div class="pf-glyph">&#10022;</div>' +
            '<div class="pf-title">Freelancer</div>' +
            '<p class="pf-desc">Your #PRINT, your crew, your gear.</p>' +
            '<div class="pf-list">&#10022; Freelancer &nbsp; &#9681; Social &nbsp; &#9132; #GRID<br>' +
              '&#10059; Flow &nbsp; &#9635; Inventory &nbsp; &#9618; Codex<br>&#9636; #PRINT</div>' +
            '<div class="pf-go" style="--pf-on:#04222a">Enter</div>' +
            '<div class="pf-file">' + rosterCount() + ' on file</div>' +
          '</button>' +
          (hasAdmin ?
          '<button type="button" class="pf-card" id="pf-admin" style="--pf-c:' + adminAccent + '">' +
            '<div class="pf-glyph">&#9670;</div>' +
            '<div class="pf-title">Admin</div>' +
            '<p class="pf-desc">The other side of the table.</p>' +
            '<div class="pf-list">&#9670; Table &nbsp; &#10022; Threats &nbsp; &#9618; Bestiary<br>' +
              '&#8862; Encounters &nbsp; &#9888; Hazards<br>&#9636; Job Board &nbsp; &#9930; Payroll</div>' +
            '<div class="pf-go" style="--pf-on:#2a2408">Enter</div>' +
            '<div class="pf-file">' + bestiaryCount() + ' statblocks</div>' +
          '</button>' : "") +
        '</div>' +
        '<div class="pf-foot">Node 763 // Elysium Nights</div>' +
      '</div>';
    document.body.appendChild(ov);

    function land(p, accent) {
      ov.classList.add("out");
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 320);
      // onPick runs the caller's setPortal, which renders synchronously (and,
      // at boot, reveals #os synchronously too), so .os-gear already has real
      // layout by the time we return here.
      onPick(p);
      showCoachmark(p, accent);
    }
    ov.querySelector("#pf-freelancer").addEventListener("click", function () { land("freelancer", freeAccent); });
    if (hasAdmin) ov.querySelector("#pf-admin").addEventListener("click", function () { land("admin", adminAccent); });
  }

  /* Points at the settings cog once, right after a splash pick, and only
     then: a silent resume shows nothing, and so does a flip from the tray,
     where the user is already looking at the control. */
  function showCoachmark(portal, accent) {
    var gear = document.querySelector(".os-gear");
    if (!gear) return;               // nothing to point at; say nothing rather than float in space
    var r = gear.getBoundingClientRect();

    var box = document.createElement("div");
    box.id = "portal-coach";
    box.style.setProperty("--pf-c", accent);
    box.style.setProperty("--pf-glow", glowOf(accent));
    // position: right edge under the gear, caret pointing up at it
    var left = Math.max(10, Math.min(window.innerWidth - 280, r.right - 270));
    box.style.left = left + "px";
    box.style.top = (r.bottom + 10) + "px";
    box.innerHTML =
      '<div class="pc-kick">' + (portal === "admin" ? "Admin desktop" : "Freelancer desktop") + '</div>' +
      '<div class="pc-title">You are on the ' + (portal === "admin" ? "table" : "player") + ' side</div>' +
      '<div class="pc-body">The node remembers this, so the portal will not ask again. Swap desktops any time from the cog.</div>' +
      '<button type="button" class="pc-go">Got it</button>';
    var caretLeft = Math.max(10, r.left + r.width / 2 - left - 6);
    var styleTag = document.createElement("style");
    styleTag.textContent = "#portal-coach::before{ left:" + caretLeft + "px; }";
    document.head.appendChild(styleTag);
    document.body.appendChild(box);

    function dismiss() {
      if (box.parentNode) box.parentNode.removeChild(box);
      if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag);
      document.removeEventListener("keydown", onKey);
      gear.removeEventListener("click", dismiss);
    }
    function onKey(e) { if (e.key === "Escape") dismiss(); }
    box.querySelector(".pc-go").addEventListener("click", dismiss);
    document.addEventListener("keydown", onKey);
    // clicking the cog means the user already did the thing this was pointing
    // at; leaving the note up past that click would be nagging, not guiding
    gear.addEventListener("click", dismiss);
  }

  return { choose: choose };
})();
