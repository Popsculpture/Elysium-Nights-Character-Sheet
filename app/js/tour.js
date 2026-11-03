/* ===========================================================================
   ELYSIUM NIGHTS - Guided character-creation tour (the engine)

   A spotlight and a callout that walk a new player through #PRINT, one element at a time, from the
   author's tour (data/tour_creation.js). Compartmentalized on purpose (the author, 31 Oct 2026):
     - its own switch, a device setting (localStorage "en_tour_v1", on unless switched off), drawn as
       its own section in the settings tray through one guarded line in settings.js;
     - its own entry point on the empty-roster gate (one guarded line in builder.js rosterGate);
     - data-tour="..." attributes on the elements it points at, which do nothing on their own;
     - everything else lives here, on document.body, outside #os, with its own CSS.
   Switched off, nothing draws and nothing listens. To remove the feature, delete this script tag and
   data/tour_creation.js's from index.html; the guarded lines and data-tour attributes stay inert.

   HOW A STEP RUNS. On entry the tour moves the app to the step's tab (EN.app.gotoTab) and #PRINT step
   (EN.builder.goStep), then finds its anchor: [data-tour=<dataTour>] first, the JSON fallback (css plus
   text) second. It spotlights the anchor (a fixed box with a scrim made of its own shadow, pointer-events
   off, so every click still reaches the app) and places the callout beside it. advanceOn decides how it
   moves on: "click" when the player clicks inside the anchor, "condition" when the step's check turns
   true (DONE below), "next" and "done" on the callout's buttons. NEXT is always there, so nobody is
   stuck. A step is passed over only when it does not apply to the build (APPLIES below); the tour moves
   the app only when a step is entered, and a SHOW ME button brings back a player who wandered off. A condition already true on entry does not skip the step; the player reads it and presses NEXT.
   The tour pauses (hides) while another overlay owns the screen: the filing animation, the settings
   tray, the character manager, the gate, a Codex peek, and the background contacts dialog unless the
   step is the dialog. It re-finds its anchor after every render (a MutationObserver plus a short timer), on
   scroll and on resize, because app.js rebuilds #view on every change.
   =========================================================================== */
window.EN = window.EN || {};

EN.tour = (function () {
  var KEY = "en_tour_v1";
  var Z = 3950;   // above the contacts dialog (3900), under the filing animation (4000) and every other overlay
  var PAUSE_IDS = ["filed-ov", "mgr", "set-ov", "gmc-ov", "gate", "gate-coach", "recov", "codex-peek", "boot"];
  var S = null;   // { steps, i, entered, wasDone, scrolledFor, clickedAt }
  var spot = null, card = null, caret = null, gz = null, obs = null, timer = null, raf = 0;

  function el(t, a, c) { return EN.ui.el(t, a, c); }
  function enabled() { try { return localStorage.getItem(KEY) !== "0"; } catch (e) { return true; } }
  function setEnabled(on) { try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {} if (!on) stop(); }
  function data() { return (EN.tourData || {})["character-creation"] || null; }
  function E() { return EN.engine; }
  function ch() { return EN.store && EN.store.active(); }
  function realRecord() { var c = ch(); return !!c && !(EN.store.activeIsExample && EN.store.activeIsExample()); }
  function filed() { var c = ch(); return !!(c && c.meta && c.meta.filedAt) && realRecord(); }
  function step() { return S ? S.steps[S.i] : null; }

  /* ---- what "done" means for a condition step, read off the record (the JSON's completeWhen is prose) ---- */
  var DONE = {
    "attr-assign": function (c) {
      if (c.attributeMethod === "array" || c.attributeMethod === "overclocked") return Object.keys(c.arrayAssign || {}).length === 6;
      if (c.attributeMethod === "pointbuy" && E().pointBuySpent) { var p = E().pointBuySpent(c.attributes); return !!p && p.remaining === 0; }
      return true;
    },
    "species-height": function (c) { return E().lineageHeightFt ? E().lineageHeightFt(c) != null : false; },
    "background-chips": function (c) { return !!c.background && !(E().pendingChoices(c) || []).some(function (p) { return p.source === "Background"; }); },
    "contacts-modal": function (c) {
      var want = (EN.faceView && EN.faceView.bgContactsTarget) || 2;
      var have = ((c.face && c.face.contacts) || []).filter(function (x) { return x && x.origin === "background" && String(x.name || "").trim(); }).length;
      return have >= want && !document.getElementById("bgct-ov");
    },
    "class-maneuvers": function (c) { var n = E().resourcePicksAllowed(c); return n > 0 && (c.gambits || []).length >= n; },
    "class-proficiencies": function (c) { return !!c["class"] && !(E().pendingChoices(c) || []).some(function (p) { return p.source === "Class"; }); },
    "class-free-focus": function (c) {
      return (E().overlapGrants(c) || []).every(function (o) {
        return (c.skillFocuses || []).some(function (f) { return f && f.granted && f.type === o.type && f.parent === o.parent && String(f.aspect || "").trim(); });
      });
    },
    "gear-slots": function (c) {
      if (c.startingKit && c.startingKit.claimed) return true;
      var b = document.querySelector('[data-tour="claim-kit"]');
      return !!b && !b.disabled;
    },
    "inventory-rack": function (c) { return Object.keys(E().rackState(c).byItem || {}).length > 0; },
    // click steps whose result shows on the record or the page
    // a NEW record registered during this tour (the record open when the tour started does not count)
    "register": function () { return realRecord() && !document.querySelector('[data-tour="register-print"]') && !!S && ch().meta.id !== S.startId && !filed(); },
    "attr-method": function (c) {
      if (c.attributeMethod === "manual") return true;
      if (Object.keys(c.arrayAssign || {}).length) return true;
      var a = c.attributes || {};
      return Object.keys(a).some(function (k) { return a[k] !== 10; });
    },
    // left Identity, by the wizard's NEXT or a tab on the rail
    "next-button": function () { return !!(EN.builder && EN.builder.stepKey && EN.builder.stepKey() !== "identity"); },
    "species-cards": function (c) { return !!c.species; },
    "lineage-feature": function (c) { return !!(c.lineageFeatures || []).length; },
    "background-cards": function (c) { return !!c.background; },
    "background-contacts": function (c) { return DONE["contacts-modal"](c) || !!document.getElementById("bgct-ov"); },
    "class-cards": function (c) { return !!c["class"]; },
    "subclass": function (c) { return !!c.subclass; },
    "gear-claim": function (c) { return !!(c.startingKit && c.startingKit.claimed); },
    "print-certify": function () { return !!document.querySelector('[data-tour="print-certify"].on'); },
    "print-submit": function () { return filed(); }
  };
  /* steps that belong to only some builds. A step is passed over only when this says it does not
     apply to the record (a class with no starting picks, no Background/Class overlap, a background with
     no contacts), never because its element is momentarily off screen: a player who has not picked a
     lineage yet, or who clicked another wizard tab, sees the step with a pointer instead. Unknown yet
     (no class, no background) counts as applies. */
  function bgOf(c) { return c && c.background && E().getBackground ? E().getBackground(c.background) : null; }
  var APPLIES = {
    "class-maneuvers": function (c) { return !c["class"] || E().resourcePicksAllowed(c) > 0; },
    "class-free-focus": function (c) { return (E().overlapGrants(c) || []).length > 0; },
    "background-contacts": function (c) { var b = bgOf(c); return !b || !!b.contacts; },
    "contacts-modal": function (c) { var b = bgOf(c); return !b || !!b.contacts; },
    "background-prompts": function (c) { var b = bgOf(c); return !b || !!(b.personalItem || (b.hooks || []).length); }
  };
  function applies(st) { var f = APPLIES[st.id]; return !f || !realRecord() || !!f(ch()); }

  /* ---- finding the anchor ---- */
  function visible(n) { if (!n) return false; var r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function anchorFor(st) {
    if (!st || !st.anchor) return null;
    var list = st.anchor.dataTour ? document.querySelectorAll('[data-tour="' + st.anchor.dataTour + '"]') : [];
    for (var i = 0; i < list.length; i++) if (visible(list[i])) return list[i];
    var fb = st.anchor.fallback;
    if (fb && fb.css) {
      var want = fb.text ? String(fb.text).toLowerCase() : null, nodes = [];
      try { nodes = document.querySelectorAll(fb.css); } catch (e) {}
      for (var j = 0; j < nodes.length; j++) {
        if (!visible(nodes[j])) continue;
        if (!want || String(nodes[j].innerText || "").toLowerCase().indexOf(want) !== -1) return nodes[j];
      }
    }
    return null;
  }
  function paused() {
    if (EN.app && EN.app.portal && EN.app.portal() !== "freelancer") return true;
    // fixed overlays report offsetParent null, so ask the computed style whether each one is up
    for (var i = 0; i < PAUSE_IDS.length; i++) {
      var n = document.getElementById(PAUSE_IDS[i]);
      if (n) { var cs = getComputedStyle(n); if (cs.display !== "none" && cs.visibility !== "hidden") return true; }
    }
    if (document.getElementById("bgct-ov") && !(step() && step().id === "contacts-modal")) return true;
    return false;
  }

  /* ---- navigation into a step (once per entry, never on every reposition) ---- */
  function needsFiled(st) { return st.tab && st.tab !== "print"; }
  function navigate(st) {
    if (!EN.app) return;
    if (needsFiled(st)) {
      // not yet filed, or the filing animation still running: open the tab once, after the landing (tick)
      if (!filed() || document.getElementById("filed-ov") || Date.now() - S.overlayAt < 900) { S.pendingNav = true; return; }
      S.pendingNav = false;
      if (EN.app.activeTab() !== st.tab) EN.app.gotoTab(st.tab);
      return;
    }
    if (EN.app.activeTab() !== "print") EN.app.gotoTab("print");
    if (st.wizard && realRecord() && EN.builder && EN.builder.goStep && EN.builder.stepKey && EN.builder.stepKey() !== st.wizard) EN.builder.goStep(st.wizard);
  }

  /* ---- the callout ---- */
  function btn(label, cls, title, fn) { return el("button.btn.sm" + (cls || ""), { type: "button", title: title || "", onclick: fn }, label); }
  /* An action step (advanceOn click or condition) waits for the player to do the thing in the app; its card
     shows a prompt where NEXT would be (the author, 31 Oct 2026), because NEXT alone would move the tour on and
     leave the app behind. Once the move is made the tour moves on by itself; a step already done on entry
     shows NEXT. BACK and END are always there. */
  function isAction(st) { return st.advanceOn === "click" || st.advanceOn === "condition"; }
  function doneNow(st) {
    var f = DONE[st.id];
    if (!f) return false;
    if (st.id === "register") return f();
    return realRecord() && !!f(ch());
  }
  /* An action that cannot be done with this record shows NEXT instead of a prompt, with a note saying why,
     so no step is a dead end: racking needs an item that fits worn Carry Gear (a Holster takes Sidearms only,
     a Scabbard one-handed melee only). */
  function cannotAct(st) {
    if (st.id !== "inventory-rack" || !realRecord() || !filed()) return null;
    var c = ch(), e = E();
    var fits = (c.equipment || []).some(function (x) { return x && x.qty > 0 && (e.rackTargets(c, x) || []).length > 0; });
    var gear = (c.equipment || []).some(function (x) { return x && x.qty > 0 && e.isCarryGear(e.catalogItem(x.name)) && (c.carry || {})[x.id || x.name] !== "worn"; });
    if (fits || gear) return null;
    return "Nothing you carry fits your worn carry gear right now, so there is nothing to rack yet.";
  }
  function actionPrompt(st) {
    if (st.id === "register") return "Select REGISTER NEW #PRINT to continue.";
    if (st.id === "next-button") return "Click NEXT at the bottom of the page to continue.";
    if (st.id === "contacts-modal") return "Name both contacts, then close the window to continue.";
    if (st.id === "class-free-focus") return "Name your Focus and claim it to continue.";
    if (st.id === "print-certify") return "Tick the box to continue. It unlocks once every tab has its check.";
    if (st.id === "print-submit") return "Select SUBMIT & FILE to continue.";
    if ({ "species-cards": 1, "lineage-feature": 1, "background-cards": 1, "class-cards": 1, "subclass": 1 }[st.id]) return "Pick one of the highlighted cards to continue.";
    if (st.action === "select") return "Make your selection to continue.";
    if (st.action === "type") return "Fill it in to continue.";
    return st.advanceOn === "condition" ? "Make your picks to continue." : "Click the highlighted item to continue.";
  }
  // Gizmo, the off-brand paperclip (drawn by the gate); absent when the gate is, and the tour reads fine without
  function gizmo() {
    var g = EN.gate && EN.gate.gizmoSvg;
    if (!g) return document.createTextNode("");
    var w = document.createElement("span"); w.className = "tour-gizmo"; w.innerHTML = g("tour-gizmosvg"); return w;
  }
  var HELLO = "Hi,\nIt looks like you're building a character.\nWould you like help with that?";
  /* Step 1 only: Gizmo stands to the right of the card at full size, popping out from behind it, with his speech
     bubble above him, outside the card (above the card's top corner when there is no room beside it). His words type
     in once per tour (S.helloN counts the letters shown). Every later step he is the small icon in the header. */
  function buildGizmo() {
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (S.helloN == null) S.helloN = reduce ? HELLO.length : 0;
    var typed = el("span.tour-typed", { text: HELLO.slice(0, S.helloN) });
    var bubble = el("div.tour-bubble", null, [typed, el("span.tour-ghost", { "aria-hidden": "true", text: HELLO })]);   // the ghost holds the final height
    var fig = el("span.tour-gizmo-fig"); fig.innerHTML = EN.gate.gizmoSvg("tour-gizmosvg");
    gz.setAttribute("role", "img"); gz.setAttribute("aria-label", "Gizmo says: " + HELLO.replace(/\n/g, " "));
    gz.appendChild(bubble); gz.appendChild(fig);
    if (S.helloN < HELLO.length) {
      bubble.classList.add("typing");
      var run = S, tick = function () {
        if (S !== run || !typed.parentNode) return;
        if (run.helloN < HELLO.length) { run.helloN++; typed.textContent = HELLO.slice(0, run.helloN); setTimeout(tick, 26); }
        else bubble.classList.remove("typing");
      };
      setTimeout(tick, 450);
    }
  }
  function placeGizmo() {
    if (!gz) return;
    var show = !!S && S.i === 0 && card && card.style.display !== "none" && !!(EN.gate && EN.gate.gizmoSvg);
    if (!show) { gz.style.display = "none"; gz.className = ""; return; }
    if (!gz.firstChild) buildGizmo();
    var fresh = gz.style.display === "none" || gz.className !== "tour-gz-in";
    gz.style.display = "flex";
    var vw = window.innerWidth, c = card.getBoundingClientRect(), w = gz.offsetWidth || 196, h = gz.offsetHeight || 190, x, y;
    if (c.right + w + 6 <= vw - 4) { x = c.right + 6; y = c.bottom - h; }                  // beside the card, level with its foot
    else if (c.left - w - 6 >= 4) { x = c.left - w - 6; y = c.bottom - h; }                // no room on the right: its left
    else { x = vw - w - 8; y = c.top - h + 14; }                                          // a phone sheet: standing on its top edge
    gz.style.left = Math.round(Math.max(4, x)) + "px"; gz.style.top = Math.round(Math.max(4, y)) + "px";
    if (fresh) { gz.className = ""; void gz.offsetWidth; gz.className = "tour-gz-in"; }
  }
  function buildCard(st, anchor) {
    var n = S.steps.length, last = S.i === n - 1;
    var done = isAction(st) && doneNow(st);
    var stuck = isAction(st) && !done ? cannotAct(st) : null;
    var waiting = isAction(st) && !done && !last && !stuck;
    var notes = [], away = awayFrom(st);
    var noLineage = (st.id === "species-height" || st.id === "lineage-feature") && realRecord() && !ch().lineage;
    if (needsFiled(st) && !filed()) notes.push("This part opens once your record is filed.");
    else if (noLineage && !away) notes.push("Pick a lineage card first; this opens once you have one.");
    else if (!anchor && !away && st.id !== "register") notes.push("Look for it on this page; it may sit further down, or open once an earlier pick is made.");
    else if (!anchor && away) notes.push("This step is on another screen.");
    var extra = null;
    // the register step on a roster that already has records: the gate is not on screen, so offer the button here
    if (st.id === "register" && !document.querySelector('[data-tour="register-print"]') && EN.builder && EN.builder.newRecord)
      extra = btn("+ REGISTER NEW #PRINT", ".primary", "Open a blank record and start the tour on it", function () { EN.builder.newRecord(); go(S.i + 1); });
    var kids = [
      el("div.tour-head", null, [
        el("span.tour-who", null, [S.i === 0 ? document.createTextNode("") : gizmo(), el("span.tour-name", { text: "GIZMO" }), el("span.tour-count", { text: "TOUR · " + (S.i + 1) + " / " + n + (st.optional ? " · OPTIONAL" : "") })]),
        el("button.tour-x", { type: "button", title: "End the tour", "aria-label": "End the tour", onclick: stop }, "✕")
      ]),
      el("h4.tour-title", { text: st.title }),
      el("p.tour-body", { text: st.body })
    ];
    if (last) kids.splice(2, 0, el("p.tour-say", { text: "That's everything. Go be a Freelancer. Don't make me do this again." }));
    if (st.example) kids.push(el("p.tour-ex", null, [el("span.tour-exk", { text: "E.G. " }), document.createTextNode(st.example)]));
    if (st.warning) kids.push(el("p.tour-warn", { text: "⚠ " + st.warning }));
    notes.forEach(function (t) { kids.push(el("p.tour-note", { text: t })); });
    if (done && isAction(st)) kids.push(el("p.tour-done", { text: "✓ Done. Press NEXT." }));
    if (stuck) kids.push(el("p.tour-note", { text: stuck }));
    if (!extra && away && !(needsFiled(st) && !filed())) extra = btn("SHOW ME", "", "Go to this step's screen", function () { navigate(st); card.dataset.sig = ""; schedule(); });
    if (extra) kids.push(el("div.tour-extra", null, [extra]));
    kids.push(el("div.tour-btns", null, [
      S.i > 0 ? btn("◀ BACK", "", "Previous step", function () { go(S.i - 1, -1); }) : el("span"),
      waiting
        ? el("p.tour-act", { role: "status", text: "▶ " + actionPrompt(st) })
        : btn(last ? "FINISH" : (st.optional ? "SKIP ▶" : "NEXT ▶"), ".primary", last ? "End the tour" : "Next step", function () { last ? stop() : go(S.i + 1); })
    ]));
    return el("div#tour-card", { role: "dialog", "aria-live": "polite", "aria-label": "Character creation tour with Gizmo", dataset: { noSwipe: "1", step: st.id } }, kids);
  }

  // the player is on a different tab or #PRINT step than the step lives on
  function awayFrom(st) {
    if (!EN.app) return false;
    if (needsFiled(st)) return filed() && EN.app.activeTab() !== st.tab;
    if (EN.app.activeTab() !== "print") return true;
    return !!(st.wizard && realRecord() && EN.builder && EN.builder.stepKey && EN.builder.stepKey() !== st.wizard);
  }
  function place(anchor, st) {
    var vw = window.innerWidth, vh = window.innerHeight, pad = 6;
    if (anchor) {
      var r = anchor.getBoundingClientRect();
      spot.style.display = "block";
      spot.style.left = Math.max(2, r.left - pad) + "px"; spot.style.top = Math.max(2, r.top - pad) + "px";
      spot.style.width = Math.min(vw - 4, r.width + pad * 2) + "px"; spot.style.height = Math.min(vh - 4, r.height + pad * 2) + "px";
    } else spot.style.display = "none";
    var narrow = vw < 600;
    card.classList.toggle("tour-sheet", narrow);
    card.classList.toggle("tour-sheet-top", narrow && !!document.getElementById("bgct-ov"));
    if (narrow) {
      card.style.left = ""; card.style.top = "";
      // once per step: if the sheet covers the spotlit element, scroll it up clear of the sheet
      if (anchor && S.sheetFor !== S.i && !document.getElementById("bgct-ov")) {
        S.sheetFor = S.i;
        var ar = anchor.getBoundingClientRect(), ct = card.getBoundingClientRect().top;
        if (ar.bottom > ct - 8) window.scrollBy(0, Math.min(ar.top - 90, ar.bottom - ct + 16));
      }
      pointer(anchor); placeGizmo();
      return;
    }
    var cw = card.offsetWidth || 340, chh = card.offsetHeight || 180, x, y;
    if (!anchor) { x = (vw - cw) / 2; y = Math.max(70, (vh - chh) / 2); }
    else {
      var a = anchor.getBoundingClientRect(), want = st.placement || "bottom";
      var below = a.bottom + 14, above = a.top - chh - 14;
      if (want === "left" && a.left - cw - 14 > 8) { x = a.left - cw - 14; y = a.top; }
      else if (want === "right" && a.right + cw + 14 < vw - 8) { x = a.right + 14; y = a.top; }
      else if (want === "top" ? above > 60 : below + chh > vh - 50 && above > 60) { y = above; x = a.left; }
      // a tall element with no room above or below (the Actions panel on a short window): beside it, if it fits
      else if (below + chh > vh - 8 && above <= 60 && a.right + cw + 14 < vw - 8) { x = a.right + 14; y = Math.max(a.top, 70); }
      else if (below + chh > vh - 8 && above <= 60 && a.left - cw - 14 > 8) { x = a.left - cw - 14; y = Math.max(a.top, 70); }
      else { y = below; x = a.left; }
      if (y + chh > vh - 8) y = Math.max(60, vh - chh - 8);
    }
    card.style.left = Math.round(Math.max(8, Math.min(x, vw - cw - 8))) + "px";
    card.style.top = Math.round(Math.max(8, Math.min(y, vh - chh - 8))) + "px";
    pointer(anchor); placeGizmo();
  }
  /* The card's pointer (the author, 31 Oct 2026: "make each step point at the thing it is describing"):
     an arrow on whichever edge of the card faces the spotlit element, slid along that edge to line up
     with the visible middle of it. Works for the floating card and the phone sheet alike; no arrow when
     the card overlaps the element or there is nothing to point at. */
  function pointer(anchor) {
    // its own fixed element, not a pseudo-element on the card: the phone sheet scrolls, and would clip it
    if (!caret) return;
    caret.style.display = "none"; caret.removeAttribute("data-side");
    if (!anchor || card.style.display === "none") return;
    var a = anchor.getBoundingClientRect(), c = card.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    // the part of the element actually on screen
    var top = Math.max(a.top, 0), bot = Math.min(a.bottom, vh), left = Math.max(a.left, 0), right = Math.min(a.right, vw);
    if (bot <= top || right <= left) return;
    var mx = (left + right) / 2, my = (top + bot) / 2, side = null;
    // sides are judged against the part of the element on screen, so a tall one scrolled half out still counts
    if (c.top >= bot - 2) side = "top";
    else if (c.bottom <= top + 2) side = "bottom";
    else if (c.left >= right - 2) side = "left";
    else if (c.right <= left + 2) side = "right";
    // the card had to sit over a tall element: point up into the part showing above the card
    else if (c.top > top + 24) { side = "top"; my = (top + c.top) / 2; }
    if (!side) return;
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    var x, y;
    if (side === "top" || side === "bottom") { x = clamp(mx, c.left + 18, c.right - 18) - 7; y = side === "top" ? c.top - 7 : c.bottom - 7; }
    else { y = clamp(my, c.top + 18, c.bottom - 18) - 7; x = side === "left" ? c.left - 7 : c.right - 7; }
    caret.style.left = Math.round(x) + "px"; caret.style.top = Math.round(y) + "px";
    caret.setAttribute("data-side", side); caret.style.display = "block";
  }

  /* ---- the loop: find, draw, check ---- */
  function refresh() {
    raf = 0;
    if (!S) return;
    var st = step();
    if (paused()) { spot.style.display = "none"; card.style.display = "none"; if (gz) { gz.style.display = "none"; gz.className = ""; } if (caret) caret.style.display = "none"; return; }
    card.style.display = "";
    if (!applies(st)) { go(S.i + (S.dir < 0 ? -1 : 1), S.dir); return; }
    var anchor = anchorFor(st);
    if (anchor && S.scrolledFor !== S.i) { S.scrolledFor = S.i; if (EN.ui.scrollUnderChrome) EN.ui.scrollUnderChrome(anchor, true); }
    // rebuild the card only when what it says changes (never on every reposition, so focus and hover hold)
    var sig = S.i + "|" + !!anchor + "|" + awayFrom(st) + "|" + filed() + "|" + !!(realRecord() && ch().lineage) + "|" + (isAction(st) ? doneNow(st) + "/" + !!cannotAct(st) : "") + "|" + !!document.querySelector('[data-tour="register-print"]');
    if (card.dataset.sig !== sig) {
      var hadFocus = card.contains(document.activeElement);
      var fresh = buildCard(st, anchor);
      fresh.dataset.sig = sig; fresh.style.zIndex = Z + 1;
      card.parentNode.replaceChild(fresh, card); card = fresh;
      // a keyboard player who pressed NEXT, BACK or SKIP stays on the tour's buttons
      if (hadFocus) { var f = card.querySelector(".tour-btns .btn.primary") || card.querySelector("button"); if (f) f.focus(); }
    }
    place(anchor, st);
  }
  // a short timer rather than requestAnimationFrame: a background or headless window can hold rAF back
  // indefinitely, and the spotlight must still follow a re-render the moment the window is looked at
  function schedule() { if (S && !raf) raf = setTimeout(refresh, 30); }
  function tick() {
    if (!S || paused()) return;
    var st = step();
    // a condition step moves on when its check turns true (not when it was already true on entry)
    if (isAction(st) && DONE[st.id]) {
      var now = doneNow(st);
      if (now && S.wasDone === false && Date.now() - S.entered > 400) { go(S.i + 1); return; }
      S.wasDone = now;
    }
    // a post-filing step entered before the landing opens its tab once, after the filing animation has gone
    if (document.getElementById("filed-ov")) S.overlayAt = Date.now();
    if (S.pendingNav && needsFiled(st)) navigate(st);
    schedule();
  }
  function onClick(e) {
    if (!S || paused()) return;
    var st = step();
    if (!st || st.advanceOn !== "click") return;
    if (st.id === "print-certify") return;   // ticked is read off the row (DONE); a click on the locked row does nothing
    var a = anchorFor(st);
    if (!a || !a.contains(e.target)) return;
    var at = S.i;
    // let the app act on the click first (it re-renders), then move on
    setTimeout(function () { if (S && S.i === at) go(S.i + 1); }, 250);
  }
  function onKey(e) {
    if (!S || e.key !== "Escape" || paused() || document.getElementById("bgct-ov")) return;
    stop();
  }

  function go(i, dir) {
    if (!S) return;
    if (i < 0) i = 0;
    if (i >= S.steps.length) { stop(); return; }
    S.i = i; S.dir = dir || 1; S.entered = Date.now(); S.wasDone = null; S.scrolledFor = -1; S.sheetFor = -1; S.pendingNav = false;
    navigate(step());
    var st = step();
    S.wasDone = isAction(st) && DONE[st.id] ? doneNow(st) : null;
    card.dataset.sig = "";
    schedule();
  }

  function injectCss() {
    if (document.getElementById("tour-css")) return;
    var css = [
      "#tour-spot{position:fixed;z-index:" + Z + ";pointer-events:none;border:2px solid var(--accent);border-radius:var(--r,4px);",
      "  box-shadow:0 0 0 9999px rgba(4,6,12,.55),0 0 18px var(--accent-dim,rgba(0,229,255,.35));transition:left .15s,top .15s,width .15s,height .15s;}",
      "#tour-card{position:fixed;z-index:" + (Z + 1) + ";width:min(360px,calc(100vw - 24px));box-sizing:border-box;padding:12px 14px;",
      "  background:var(--bg2);border:1px solid var(--accent);border-radius:var(--r,4px);box-shadow:0 10px 30px rgba(0,0,0,.6);color:var(--text);font-family:var(--body);}",
      "#tour-card .tour-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}",
      "#tour-card .tour-who{display:flex;align-items:center;gap:6px;min-width:0;}",
      "#tour-card .tour-gizmo{display:inline-flex;flex:0 0 auto;}",
      "#tour-card .tour-gizmosvg{width:18px;height:24px;filter:drop-shadow(0 0 5px rgba(46,230,160,.55));animation:tourGizmo 2.4s ease-in-out infinite;transform-origin:50% 90%;}",
      "@keyframes tourGizmo{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(5deg)}}",
      "#tour-gizmo{position:fixed;z-index:" + (Z + 1) + ";width:196px;pointer-events:none;display:none;flex-direction:column;align-items:center;gap:12px;}",
      "#tour-gizmo .tour-gizmo-fig{display:inline-flex;}",
      "#tour-gizmo .tour-gizmosvg{width:84px;height:110px;filter:drop-shadow(0 0 14px rgba(46,230,160,.65));animation:tourGizmo 2.4s ease-in-out infinite;transform-origin:50% 90%;}",
      "#tour-gizmo.tour-gz-in{animation:tourGizmoPop .6s cubic-bezier(.2,.9,.3,1.3) both;}",
      "@keyframes tourGizmoPop{from{opacity:0;transform:translateX(-80px) scale(.4) rotate(-18deg)}to{opacity:1;transform:none}}",
      "#tour-gizmo .tour-bubble{position:relative;display:grid;align-self:stretch;box-sizing:border-box;padding:8px 10px;border:1px solid #2ee6a0;border-radius:var(--r,4px);background:var(--bg2);box-shadow:0 0 0 1px rgba(46,230,160,.12),0 6px 18px rgba(0,0,0,.5);color:var(--text);font-family:var(--body);font-size:13px;line-height:1.4;font-style:italic;font-weight:600;white-space:pre-line;}",
      "#tour-gizmo .tour-bubble::after{content:'';position:absolute;left:50%;bottom:-7px;width:12px;height:12px;margin-left:-6px;box-sizing:border-box;background:var(--bg2);border:1px solid #2ee6a0;border-left-color:transparent;border-top-color:transparent;transform:rotate(45deg);}",
      "#tour-gizmo .tour-bubble>span{grid-area:1/1;}",
      "#tour-gizmo .tour-ghost{visibility:hidden;}",
      "#tour-gizmo .tour-bubble.typing .tour-typed::after{content:'';display:inline-block;width:6px;height:1em;margin-left:2px;vertical-align:text-bottom;background:#2ee6a0;animation:tourCaret .7s steps(1) infinite;}",
      "@keyframes tourCaret{50%{opacity:0}}",
      "#tour-card .tour-name{font-family:var(--mono);font-size:10px;letter-spacing:.12em;color:#2ee6a0;}",
      "#tour-card .tour-say{color:var(--text);font-size:12.5px;font-style:italic;border-left:2px solid #2ee6a0;padding-left:8px;}",
      "#tour-card .tour-count{font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--text3);}",
      "#tour-card .tour-x{background:transparent;border:0;color:var(--text3);cursor:pointer;font-size:13px;padding:2px 4px;}",
      "#tour-card .tour-title{margin:0 0 6px;font-family:var(--disp);font-size:15px;letter-spacing:.04em;color:var(--accent);}",
      "#tour-card p{margin:0 0 8px;font-size:13px;line-height:1.45;}",
      "#tour-card .tour-ex{color:var(--text2);font-size:12.5px;}",
      "#tour-card .tour-exk{font-family:var(--mono);font-size:10px;letter-spacing:.08em;color:var(--gold);}",
      "#tour-card .tour-warn{color:var(--warn);font-size:12.5px;}",
      "#tour-card .tour-note{color:var(--text3);font-size:12px;font-style:italic;}",
      "#tour-card .tour-done{color:var(--success);font-size:12.5px;}",
      "#tour-card .tour-act{margin:0;align-self:center;text-align:right;font-family:var(--mono);font-size:11px;letter-spacing:.04em;color:var(--accent);max-width:72%;}",
      "#tour-card .tour-extra{margin:0 0 8px;}",
      "#tour-card .tour-btns{display:flex;justify-content:space-between;gap:8px;}",
      "#tour-card.tour-sheet{left:8px !important;right:8px;top:auto !important;bottom:12px;width:auto;max-height:46vh;overflow:auto;}",
      "html.skin-98 #tour-card.tour-sheet{bottom:52px;}",
      "html.skin-droid #tour-card.tour-sheet{bottom:96px;}",
      "#tour-card.tour-sheet.tour-sheet-top{top:8px !important;bottom:auto;}",
      "html.skin-98 #tour-spot,html.skin-98 #tour-card{border-radius:0;}",
      "@media (pointer:coarse){#tour-card .btn{min-height:40px;}}",
      // the pointer: a square turned 45 degrees on the card's edge, showing only the two borders that face out
      "#tour-caret{position:fixed;z-index:" + (Z + 2) + ";width:14px;height:14px;box-sizing:border-box;background:var(--bg2);border:1px solid var(--accent);transform:rotate(45deg);pointer-events:none;display:none;}",
      "#tour-caret[data-side=top]{border-right-color:transparent;border-bottom-color:transparent;}",
      "#tour-caret[data-side=bottom]{border-left-color:transparent;border-top-color:transparent;}",
      "#tour-caret[data-side=left]{border-top-color:transparent;border-right-color:transparent;}",
      "#tour-caret[data-side=right]{border-left-color:transparent;border-bottom-color:transparent;}",
      // the spotlight breathes, so the eye finds it
      "@keyframes tourPulse{0%,100%{outline:2px solid transparent;outline-offset:2px;}50%{outline:2px solid var(--accent);outline-offset:5px;}}",
      "#tour-spot{animation:tourPulse 1.8s ease-in-out infinite;}",
      "@media (prefers-reduced-motion:reduce){#tour-spot{transition:none;animation:none;}#tour-card .tour-gizmosvg,#tour-gizmo.tour-gz-in,#tour-gizmo .tour-gizmosvg,#tour-gizmo .tour-bubble.typing .tour-typed::after{animation:none;}}"
    ];
    var st = document.createElement("style"); st.id = "tour-css"; st.textContent = css.join("\n"); document.head.appendChild(st);
  }

  function start(fromStep) {
    if (!enabled() || !data() || !EN.ui) return false;
    stop();
    injectCss();
    S = { steps: data().steps.slice(), i: 0, dir: 1, entered: Date.now(), wasDone: null, scrolledFor: -1, sheetFor: -1, pendingNav: false, overlayAt: 0,
          startId: realRecord() ? ch().meta.id : null };   // step 1 needs a record registered after this
    spot = el("div#tour-spot", { "aria-hidden": "true" });
    card = el("div#tour-card", { dataset: { noSwipe: "1" } });
    caret = el("div#tour-caret", { "aria-hidden": "true" });
    gz = el("div#tour-gizmo");
    document.body.appendChild(spot); document.body.appendChild(card); document.body.appendChild(caret); document.body.appendChild(gz);
    obs = new MutationObserver(schedule);
    obs.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule); window.addEventListener("scroll", schedule, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    timer = setInterval(tick, 400);
    var at = 0;
    if (fromStep) S.steps.forEach(function (s, k) { if (s.id === fromStep) at = k; });
    // a real record already open in the wizard: begin there; the Register button on screen means begin at Register
    else if (realRecord() && !filed() && !document.querySelector('[data-tour="register-print"]')) at = 1;
    go(at);
    return true;
  }
  function stop() {
    if (obs) { obs.disconnect(); obs = null; }
    if (timer) { clearInterval(timer); timer = null; }
    window.removeEventListener("resize", schedule); window.removeEventListener("scroll", schedule, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey);
    if (spot && spot.parentNode) spot.parentNode.removeChild(spot);
    if (card && card.parentNode) card.parentNode.removeChild(card);
    if (caret && caret.parentNode) caret.parentNode.removeChild(caret);
    if (gz && gz.parentNode) gz.parentNode.removeChild(gz);
    spot = card = caret = gz = null; S = null;
  }

  /* ---- the entry points other modules ask for (each guarded at its call site) ---- */
  function gateButton() {
    if (!enabled() || !data()) return null;
    return el("div", { style: { marginTop: "12px" } }, [
      el("button.btn.ghost.tour-start", { type: "button", title: "A guided walk through registering a Freelancer, step by step",
        onclick: function () { start(); } }, "◈ TAKE THE TOUR")
    ]);
  }
  // the settings tray section (settings.js rebuild); api: { rebuild, close }
  function settingsSection(api) {
    if (!data()) return [];
    var on = enabled();
    return [
      el("div.set-sectitle", { text: "// GUIDED TOUR", dataset: { sum: on ? "ON" : "OFF" } }),
      el("label.set-label", { text: "Character creation tour" }),
      el("p.set-hint", { text: on ? "On: the new-player screen offers TAKE THE TOUR, and you can start it here any time." : "Off: no tour anywhere. Switch it on to bring it back." }),
      el("button.btn.sm.tour-toggle" + (on ? ".primary" : ""), { type: "button", title: "Turn the guided tour on or off on this device",
        onclick: function () { setEnabled(!on); if (EN.app) EN.app.render(); if (api && api.rebuild) api.rebuild(); } }, on ? "◈ TOUR: ON" : "◈ TOUR: OFF"),
      on ? el("button.btn.sm.tour-begin", { type: "button", style: { marginLeft: "8px" }, title: "Start the character creation tour now",
        onclick: function () { if (api && api.close) api.close(); if (EN.app && EN.app.portal && EN.app.portal() !== "freelancer" && EN.app.setPortal) EN.app.setPortal("freelancer"); start(); } }, "▶ START THE TOUR") : null
    ];
  }

  return { enabled: enabled, setEnabled: setEnabled, start: start, stop: stop, active: function () { return !!S; },
           current: function () { var s = step(); return s ? s.id : null; }, next: function () { if (S) go(S.i + 1); }, back: function () { if (S) go(S.i - 1, -1); },
           gateButton: gateButton, settingsSection: settingsSection };
})();
