/* ===========================================================================
   ELYSIUM NIGHTS · THE WAY INTO #GRIDOS '98 (23 Nov 2026, the author's call)

   Picking #GRIDOS '98 from the OS Skin buttons (js/settings.js) does not switch at once. A cascade of '98 warning boxes pops
   up in quick succession, each a little lower and to the right of the last, and ends on the one that matters: '98 is
   extremely immersive and made for a laptop or desktop. On a phone it breaks nothing, but it will be frustrating to use,
   if not impossible; #GRIDroid is the skin for a phone. Its three buttons open '98 anyway, switch to #GRIDroid, or keep
   the skin there is. Gizmo pops up beside it with a word for the device in hand (unless he has been switched off).

   It is drawn before '98 exists, over whatever skin is up (Classic or #GRIDroid), so it carries its own look (css/gridos_warn.css)
   and needs nothing of js/w98.js. Reduced motion skips the cascade and shows the last box alone. Escape is Cancel.
   EN.gridosWarn.open({ go, droid, cancel }). No em or en dashes anywhere (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.gridosWarn = (function () {
  var el = function (t, a, k) { return EN.ui.el(t, a, k); };
  var S = null;   // the open cascade: { root, timers, done, prev }

  function reduced() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  // a phone or a tablet: a narrow screen, or a finger for a pointer
  function small() {
    try { return window.matchMedia("(max-width: 759px), (pointer: coarse)").matches; } catch (e) { return window.innerWidth < 760; }
  }
  function gizmoOn() { try { return localStorage.getItem("en_w98_gizmo_v1") !== "0"; } catch (e) { return true; } }
  /* "Don't show this again" (the author's ask, the same day): kept on this device, saved when the player goes on (Open or
     #GRIDroid), not on Cancel. '98's Control Panel, Desktop Extras, turns the warning back on (js/w98_extras.js). */
  var SKIP_KEY = "en_gridos_warn_skip_v1";
  function skipped() { try { return localStorage.getItem(SKIP_KEY) === "1"; } catch (e) { return false; } }
  function setSkipped(v) { try { if (v) localStorage.setItem(SKIP_KEY, "1"); else localStorage.removeItem(SKIP_KEY); } catch (e) {} }

  /* the decoys: the boxes the cascade is made of, each said in a line, before the one that matters */
  function decoys() {
    return [
      { t: "Warning", m: "You are about to leave the present day." },
      { t: "#GRIDOS '98", m: "This skin is extremely immersive." },
      { t: "Caution", m: "Windows ahead. A lot of them." },
      { t: "Display Check", m: small() ? "Small screen detected." : "Checking your screen size..." },
      { t: "Are You Sure?", m: "Are you sure you are sure?" },
      { t: "Nostalgia Advisory", m: "Side effects may include dial-up tones." },
      { t: "System Notice", m: "Read the next one. It is the one that matters." }
    ];
  }
  var WARN = '<img src="img/pixel-32/warn-32.svg" width="32" height="32" alt="" draggable="false">';

  function titleBar(text, closeFn, id) {
    return el("div.gw-tb", null, [el("span.gw-tt", { id: id || null, text: text }),
      el("button.gw-x", { type: "button", "aria-label": "Close", tabindex: "-1", onclick: closeFn }, "x")]);
  }
  function decoyBox(d, i, n) {
    var box = el("div.gw-win.gw-decoy", { "aria-hidden": "true", dataset: { gwDecoy: String(i) } });
    function shut() { if (box.parentNode) box.parentNode.removeChild(box); }
    box.appendChild(titleBar(d.t, shut));
    box.appendChild(el("div.gw-body", null, [el("span.gw-ic", { html: WARN }), el("p", { text: d.m })]));
    box.appendChild(el("div.gw-btns", null, [el("button.gw-b", { type: "button", tabindex: "-1", onclick: shut }, "OK")]));
    // the cascade: each one down and to the right of the last, from the top left of the screen
    box.style.setProperty("--gw-i", String(i));
    box.style.zIndex = String(10 + i);
    return box;
  }
  function finalBox(go, droid, cancel) {
    var phone = small();
    var bGo = el("button.gw-b" + (phone ? "" : ".gw-def"), { type: "button", dataset: { gw: "go" }, onclick: go }, "Open #GRIDOS '98");
    var bDroid = el("button.gw-b" + (phone ? ".gw-def" : ""), { type: "button", dataset: { gw: "droid" }, onclick: droid }, "Use #GRIDroid");
    var bNo = el("button.gw-b", { type: "button", dataset: { gw: "cancel" }, onclick: cancel }, "Cancel");
    var chk = el("input", { type: "checkbox", id: "gw-skip", dataset: { gw: "skip" } });
    var box = el("div.gw-win.gw-final", { role: "alertdialog", "aria-modal": "true", "aria-labelledby": "gw-final-t", "aria-describedby": "gw-final-d" }, [
      titleBar("Before you open #GRIDOS '98", cancel, "gw-final-t"),
      el("div.gw-body", { id: "gw-final-d" }, [
        el("span.gw-ic", { html: WARN }),
        el("div.gw-copy", null, [
          el("p", null, [el("b", { text: "#GRIDOS '98 is extremely immersive." }), document.createTextNode(" It is a whole desktop: windows, a taskbar and a Start button. It is made for a laptop or a desktop computer only.")]),
          el("p", { text: "It will not break anything if you open it on a phone or tablet, but there it will be frustrating to use, if not impossible." }),
          el("p", { text: "On a phone and want something other than Classic? Use #GRIDroid, the skin made for it." })
        ])
      ]),
      el("label.gw-skip", { "for": "gw-skip" }, [chk, el("span", { text: "Don't show this again on this device" })]),
      el("div.gw-btns", null, [bGo, bDroid, bNo])
    ]);
    box._def = phone ? bDroid : bGo;
    box._btns = [chk, bGo, bDroid, bNo];
    box._chk = chk;
    return box;
  }
  // Gizmo, the author's still, with a word for the device in hand and a way to take his advice
  function gizmo(droid) {
    var phone = small();
    var hide;
    var bubble = el("div.gw-gz-bub", { role: "status" }, [
      el("p", { text: phone ? "Psst. Looks like you are on a phone. #GRIDroid is the comfy pick here. Want me to switch you?"
                            : "Big screen? You will be fine. Grab a mouse, mind the windows, and press me any time once you are in." }),
      el("div.gw-gz-btns", null, phone
        ? [el("button.gw-b", { type: "button", dataset: { gw: "gizmo-droid" }, onclick: droid }, "Yes, #GRIDroid"),
           el("button.gw-b", { type: "button", dataset: { gw: "gizmo-no" }, onclick: function () { hide(); } }, "No thanks")]
        : [el("button.gw-b", { type: "button", dataset: { gw: "gizmo-no" }, onclick: function () { hide(); } }, "Thanks, Gizmo")])
    ]);
    var g = el("div.gw-gizmo", { dataset: { gw: "gizmo" } }, [bubble,
      el("img.gw-gz-fig", { src: "img/gizmo/everyday-left.svg", width: "64", height: "84", alt: "Gizmo", draggable: "false" })]);
    hide = function () { bubble.style.display = "none"; };
    return g;
  }

  function close(why) {
    if (!S) return;
    var s = S; S = null;
    s.timers.forEach(clearTimeout);
    document.removeEventListener("keydown", s.onKey, true);
    if (s.root.parentNode) s.root.parentNode.removeChild(s.root);
    if (why !== "go" && s.prev && document.contains(s.prev)) { try { s.prev.focus({ preventScroll: true }); } catch (e) {} }
  }
  function open(o) {
    o = o || {};
    if (S) close("again");
    // asked not to be shown again: straight in
    if (skipped() && !o.force) { if (o.go) o.go(); return false; }
    function act(kind, fn) {
      return function () {
        if (kind !== "cancel" && S && S.fin && S.fin._chk && S.fin._chk.checked) setSkipped(true);
        close(kind);
        if (fn) try { fn(); } catch (e) { console.error(e); }
      };
    }
    var go = act("go", o.go), droid = act("droid", o.droid), cancel = act("cancel", o.cancel);
    var root = el("div#gw-root", { dataset: { gwRoot: "1" } });
    var stack = el("div.gw-stack");
    root.appendChild(el("div.gw-scrim"));
    root.appendChild(stack);
    document.body.appendChild(root);
    S = { root: root, timers: [], prev: document.activeElement };
    S.onKey = function (e) {
      if (!S) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); return; }
      if (e.key === "Tab" && S.fin) {   // the focus stays in the box that matters
        var b = S.fin._btns, i = b.indexOf(document.activeElement);
        e.preventDefault();
        b[(i + (e.shiftKey ? b.length - 1 : 1)) % b.length].focus();
      }
    };
    document.addEventListener("keydown", S.onKey, true);
    var list = reduced() ? [] : decoys(), STEP = 140;
    list.forEach(function (d, i) {
      S.timers.push(setTimeout(function () { if (S) stack.appendChild(decoyBox(d, i, list.length)); }, i * STEP));
    });
    S.timers.push(setTimeout(function () {
      if (!S) return;
      var fin = finalBox(go, droid, cancel);
      S.fin = fin;
      root.appendChild(fin);
      try { fin._def.focus({ preventScroll: true }); } catch (e) {}
      if (gizmoOn()) S.timers.push(setTimeout(function () { if (S) root.appendChild(gizmo(droid)); }, reduced() ? 0 : 450));
    }, list.length * STEP + (list.length ? 220 : 0)));
    return true;
  }
  return { open: open, close: close, isOpen: function () { return !!S; }, skipped: skipped, setSkipped: setSkipped };
})();
