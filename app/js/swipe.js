/* ===========================================================================
   ELYSIUM NIGHTS - swipe navigation between sibling tabs
   Drag the page sideways and a pill at the edge names the tab you are heading
   for; release past a threshold, or flick, and it commits. Short of that the
   page eases back. Vertical drags, drags that start in a form field, and drags
   aimed at something that scrolls sideways on its own are handed back to the
   browser untouched.

   Ported from the author's Edge of the Empire sheet by way of the "Swipe Tab
   Navigation" handoff, rewritten into this app's ES5, and wired by app.js for
   the #GRIDroid skin, where the rail is folded to the app you are in and this
   becomes the way between tabs. Touch only, by design: the rail stays the
   accessible path.

   Three requirements, all of which fail SILENTLY if broken:
     1. `container` is a persistent node whose CHILDREN are replaced, never
        the node itself. The listeners bind to it once. (#view is exactly that:
        render() clears its children and never swaps the node.)
     2. `onChange` is synchronous. The transform is cleared just before it
        runs, so an async tab change would show the old page snap back.
     3. `enabled` is a cheap in-memory read: it runs on the touchstart hot
        path. It is wrapped, so a throw only refuses that one gesture.
   =========================================================================== */
window.EN = window.EN || {};

EN.swipe = (function () {
  function num(v, d) { return typeof v === "number" && isFinite(v) ? v : d; }

  function create(opts) {
    opts = opts || {};
    var container = opts.container;
    if (!container) throw new Error("EN.swipe.create: container is required");
    var getOrder = opts.order, getCurrent = opts.current, onChange = opts.onChange;
    if (typeof getOrder !== "function" || typeof getCurrent !== "function" || typeof onChange !== "function") {
      throw new Error("EN.swipe.create: order(), current() and onChange() are required");
    }
    var getLabel = typeof opts.label === "function" ? opts.label : function (id) { return String(id); };
    var isEnabled = typeof opts.enabled === "function" ? opts.enabled : function () { return true; };

    var CFG = {
      /* How far the finger travels before the gesture's axis is decided. Deliberately large:
         once the axis locks to swipe the same touchmove calls preventDefault(), which per the
         touch spec suppresses the synthetic click for the WHOLE gesture, so a tap that jitters
         sideways must not cross this before it lifts or the tap's own click is eaten. Lowering
         it for "responsiveness" costs taps. */
      deadzone: num(opts.deadzone, 24),
      // how much more vertical than horizontal a drag must be to count as scrolling; 1.2 is a
      // cone of about fifty degrees that favours the swipe. Raise it for scroll-heavy pages.
      axisBias: num(opts.axisBias, 1.2),
      /* Commit distance is max(floor, fraction of the width). The floor stays well above the
         deadzone: on the lock frame |dx| can be as low as the deadzone, and if the threshold
         ever sat near it the pill would be born committed and the whole 0..1 ramp dead. */
      thresholdMin: num(opts.thresholdMin, 90),
      thresholdFrac: num(opts.thresholdFrac, 0.3),
      // a fast flick commits even when short, which is the dominant phone pager gesture
      flickVelocity: num(opts.flickVelocity, 0.5),   // px per ms
      flickMinDist: num(opts.flickMinDist, 30),
      holdMs: num(opts.holdMs, 100),                 // a pause this long before release means it was a drag, not a flick
      edgeResist: num(opts.edgeResist, 0.3),         // rubber-band damping where there is no neighbour
      edgeMax: num(opts.edgeMax, 80),                // and its cap, so it cannot run away
      commitMs: num(opts.commitMs, 180),
      snapBackMs: num(opts.snapBackMs, 220),
      commitEase: opts.commitEase || "ease-in",
      snapBackEase: opts.snapBackEase || "cubic-bezier(0.2,0.8,0.2,1)",
      /* Never start a gesture on these. Something that owns its own horizontal drag makes no
         scroll overflow, so the scroller probe below cannot see it: let it opt out by name. */
      exclude: opts.exclude || "input, textarea, select, [contenteditable], [data-no-swipe]",
      indicator: opts.indicator !== false,
      bodyClass: opts.bodyClass || "swiping-tabs"
    };

    /* ---- neighbour lookup: read live every time, so a rail that changes (a portal flip, a
       tab that appears once a record is filed) stays correct. Clamped, never wrapped, because
       wrapping makes the first and last tabs indistinguishable by feel. dir: +1 is the next tab
       (finger dragged left), -1 the previous. */
    function neighborId(dir) {
      // wrapped, so a throw from the caller's order() or current() reads as "no neighbour"
      // rather than stranding a half-slid page with its state half cleared
      var order, cur;
      try { order = getOrder() || []; cur = getCurrent(); } catch (err) { return null; }
      var i = order.indexOf(cur);
      if (i < 0) return null;
      var n = i + dir;
      return (n < 0 || n >= order.length) ? null : order[n];
    }
    function labelOf(id) { try { return getLabel(id); } catch (err) { return String(id); } }

    /* ---- the pill. Appended to <body>, NOT the container: the container is being translated,
       so a child would slide away with the page, and a transformed ancestor is the containing
       block for position:fixed descendants, so it could not stay pinned even if it were one. */
    var indicatorEl = null;
    function ensureIndicator() {
      if (indicatorEl) return indicatorEl;
      var el = document.createElement("div");
      el.className = "swipe-indicator";
      el.setAttribute("aria-hidden", "true");
      var arrow = document.createElement("span"); arrow.className = "swipe-indicator-arrow";
      var label = document.createElement("span"); label.className = "swipe-indicator-label";
      el.appendChild(arrow); el.appendChild(label);
      document.body.appendChild(el);
      indicatorEl = el;
      return el;
    }
    function showIndicator(dir) {
      if (!CFG.indicator) return;
      var id = neighborId(dir);
      if (id == null) return;
      var el = ensureIndicator();
      el.querySelector(".swipe-indicator-label").textContent = labelOf(id);
      el.querySelector(".swipe-indicator-arrow").textContent = dir === 1 ? "→" : "←";
      el.classList[dir === 1 ? "add" : "remove"]("swipe-indicator-right");
      el.classList[dir === -1 ? "add" : "remove"]("swipe-indicator-left");
      el.classList.remove("committed");
      el.classList.add("visible");
    }
    // progress: 0 at the start of the drag, 1 at or past the commit threshold
    function updateIndicator(progress) {
      if (!indicatorEl) return;
      var p = Math.max(0, Math.min(1, progress));
      indicatorEl.style.opacity = String(0.15 + p * 0.85);
      indicatorEl.style.setProperty("--swipe-scale", String(0.85 + p * 0.15));
      indicatorEl.classList[p >= 1 ? "add" : "remove"]("committed");
    }
    function hideIndicator() {
      if (!indicatorEl) return;
      indicatorEl.classList.remove("visible");
      indicatorEl.classList.remove("committed");
      // the inline opacity is cleared too, or the stylesheet's opacity:0 stays overridden and
      // the pill is hidden by visibility alone
      indicatorEl.style.opacity = "";
    }

    /* ---- gesture state */
    var active = false;
    var startX = 0, startY = 0, threshold = 0;
    var touchId = null;        // THE finger that started, never touches[0]
    var axis = null;           // null (undecided) | "swipe" | "scroll"
    var shownDir = 0;          // which neighbour the pill names right now
    var lastX = 0, lastT = 0, velocity = 0;
    var settleTimer = null;
    /* True from the moment a settle animation starts until its deferred commit runs. The tab
       change waits for the end of the animation and reads the current tab fresh then, so a
       second gesture released before that would resolve against a stale tab. A native pager
       ignores touches mid-transition; so does this. */
    var animating = false;

    function arm() { container.style.willChange = "transform"; document.body.classList.add(CFG.bodyClass); }
    function disarm() { container.style.willChange = ""; document.body.classList.remove(CFG.bodyClass); }
    function findTouch(list, id) {
      for (var i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i];
      return null;
    }
    function width() { return Math.min(container.clientWidth || 1, window.innerWidth || Infinity); }
    /* A drag that starts inside something position:fixed is not a page swipe. Fixed things are
       overlays (a roll tray, a rest sheet, the roster manager), and since a transformed page is
       the containing block for its fixed descendants they would slide off with it, still open.
       Checked by computed style, so an overlay fixed by the stylesheet counts as much as one
       fixed inline, which is the case an exclude selector on the style attribute missed. */
    function insideFixed(node) {
      for (var el = node; el && el !== container && el.nodeType === 1; el = el.parentElement) {
        if (getComputedStyle(el).position === "fixed") return true;
      }
      return false;
    }

    /* dir and committed describe the gesture AT RELEASE, not whatever the pill last showed
       mid-drag, so a reversed gesture always settles the right way. */
    function settle(dir, committed) {
      var fromId = getCurrent();
      animating = true;
      if (settleTimer) clearTimeout(settleTimer);
      var w = width();
      var ms = committed ? CFG.commitMs : CFG.snapBackMs;
      // one number for both the transition and the timeout, so they can never drift apart
      container.style.transition = "transform " + ms + "ms " + (committed ? CFG.commitEase : CFG.snapBackEase);
      container.style.transform = committed ? "translateX(" + (dir === 1 ? -w : w) + "px)" : "translateX(0)";
      hideIndicator();
      settleTimer = setTimeout(function () {
        settleTimer = null;
        container.style.transition = "";
        container.style.transform = "";
        disarm();
        animating = false;
        // if something else navigated during the animation (a tap on the rail), this gesture
        // must not stomp that choice
        if (committed && getCurrent() === fromId) {
          var id = neighborId(dir);
          if (id != null) onChange(id, dir);
        }
      }, ms);
    }

    /* ---- handlers */
    function onTouchStart(e) {
      // a second finger landing before the first lifts would otherwise strand the transform,
      // the pill and the body class with no cleanup and no commit
      if (axis === "swipe") settle(shownDir || 1, false);
      axis = null;
      shownDir = 0;
      var ok = false;
      try {
        ok = !animating && e.touches.length === 1 && isEnabled() && !(e.target.closest && e.target.closest(CFG.exclude)) && !insideFixed(e.target);
      } catch (err) { ok = false; }
      active = ok;
      if (!active) return;
      var t = e.touches[0];
      touchId = t.identifier;
      startX = lastX = t.clientX;
      startY = t.clientY;
      lastT = e.timeStamp;
      velocity = 0;
      threshold = Math.max(CFG.thresholdMin, width() * CFG.thresholdFrac);
    }

    function onTouchMove(e) {
      if (!active) return;
      var t = findTouch(e.touches, touchId);
      if (!t) return;
      var dx = t.clientX - startX, dy = t.clientY - startY;
      var dt = e.timeStamp - lastT;
      if (dt > 0) {
        // smoothed, so one jittery frame cannot fake a flick
        velocity = 0.7 * ((t.clientX - lastX) / dt) + 0.3 * velocity;
        lastX = t.clientX;
        lastT = e.timeStamp;
      }
      if (axis === null) {
        if (Math.abs(dx) < CFG.deadzone && Math.abs(dy) < CFG.deadzone) return;
        if (Math.abs(dy) > Math.abs(dx) * CFG.axisBias) { axis = "scroll"; return; }
        // a move that is no longer cancelable means the browser's own scroll has already begun
        // (its slop is under the deadzone on real hardware), and a page cannot be both scrolled
        // by the browser and slid by us; theme.css sets touch-action:pan-y on the page so a
        // sideways drag stays ours, and this is the guard for when it still is not
        if (!e.cancelable) { axis = "scroll"; return; }
        /* Defer to something between the finger and the container that scrolls sideways and
           still has room to scroll the way the finger is going (the Overclocked matrix, a wide
           reference table), or it becomes impossible to scroll. Overflow alone is not enough,
           since an element can overflow without being a scroller: the computed overflow-x
           has to say so too. */
        var wantDir = dx < 0 ? 1 : -1;
        for (var el = e.target; el && el !== container; el = el.parentElement) {
          if (el.scrollWidth <= el.clientWidth) continue;
          var ov = getComputedStyle(el).overflowX;
          if (ov !== "auto" && ov !== "scroll" && ov !== "overlay") continue;
          var room = wantDir === 1 ? el.scrollLeft < el.scrollWidth - el.clientWidth - 1 : el.scrollLeft > 1;
          if (room) { axis = "scroll"; return; }
        }
        axis = "swipe";
        arm();
        container.style.transition = "none";   // follow the finger one to one
      }
      if (axis !== "swipe") return;
      // claimed: stop the page scrolling underneath. Needs the listener registered
      // passive:false, and the event is not cancelable when a scroll is already in flight.
      if (e.cancelable) e.preventDefault();
      // direction is recomputed live rather than locked with the axis, so dragging back past
      // the start re-targets the other neighbour instead of committing to the first one
      var dir = dx < 0 ? 1 : dx > 0 ? -1 : shownDir;
      var w = width();
      if (dir && neighborId(dir) != null) {
        if (dir !== shownDir) { shownDir = dir; showIndicator(dir); }
        container.style.transform = "translateX(" + Math.max(-w, Math.min(w, dx)) + "px)";
        updateIndicator(Math.abs(dx) / threshold);
      } else {
        // no tab that way: a damped, capped rubber-band and no pill, which is how an edge feels
        if (shownDir !== 0) { shownDir = 0; hideIndicator(); }
        var band = Math.max(-CFG.edgeMax, Math.min(CFG.edgeMax, dx * CFG.edgeResist));
        container.style.transform = "translateX(" + band + "px)";
      }
    }

    /* Both exits MUST clear `axis`. touchstart's abandon branch keys off axis === "swipe" and
       resets it only afterwards, so an axis left set by a FINISHED gesture makes the next
       touchstart abandon a gesture that is not in flight, which sets animating and so computes
       active as false: every second swipe silently swallowed. The original had this bug, and
       it hides well, because a single swipe always works and any tap in between absorbs it. */
    function onTouchEnd(e) {
      if (!active) return;
      active = false;
      if (axis !== "swipe") { axis = null; return; }
      axis = null;
      var t = findTouch(e.changedTouches, touchId);
      var dx = t ? t.clientX - startX : 0;
      var dir = dx < 0 ? 1 : dx > 0 ? -1 : 0;
      var has = dir && neighborId(dir) != null;
      // a flick is speed AT RELEASE. A finger held still sends no moves, so the smoothed velocity
      // would otherwise be whatever the last movement left, however long ago; past a short
      // hold it counts for nothing, and the release does what the pill says it will
      if (e.timeStamp - lastT > CFG.holdMs) velocity = 0;
      // a long drag OR a fast flick the same way commits
      var flicked = Math.abs(velocity) >= CFG.flickVelocity && Math.abs(dx) >= CFG.flickMinDist && (velocity < 0 ? 1 : -1) === dir;
      settle(dir || 1, !!has && (Math.abs(dx) >= threshold || flicked));
    }
    function onTouchCancel() {
      if (!active) return;
      active = false;
      if (axis === "swipe") settle(shownDir || 1, false);
      axis = null;
    }

    // touchmove MUST be non-passive or preventDefault() is ignored and the page scrolls under
    // the drag; the other three never cancel anything, so they stay passive and keep scrolling smooth
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return {
      /* For the host to call when it rebuilds the container's children while a finger is down.
         A touch keeps targeting the element it started on even after that element is removed,
         and a detached node has no ancestors, so from that moment none of the finger's moves or
         its release reach the container: the page would sit half slid with the pill up until the
         next touch. Snap back now instead, and let the stranded touch's later events fall on
         nothing. A settle already in flight is left alone. */
      abort: function () {
        if (!active && axis !== "swipe") return;
        active = false;
        if (axis === "swipe") settle(shownDir || 1, false);
        axis = null;
      },
      destroy: function () {
        container.removeEventListener("touchstart", onTouchStart);
        container.removeEventListener("touchmove", onTouchMove);
        container.removeEventListener("touchend", onTouchEnd);
        container.removeEventListener("touchcancel", onTouchCancel);
        if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
        if (indicatorEl && indicatorEl.parentNode) indicatorEl.parentNode.removeChild(indicatorEl);
        indicatorEl = null;
        disarm();
        container.style.transition = "";
        container.style.transform = "";
        active = false; axis = null; animating = false;
      },
      // the same clamped step the gesture uses, for a button or a key that wants it
      go: function (dir) { var id = neighborId(dir); if (id != null) onChange(id, dir); return id; },
      neighborId: neighborId
    };
  }

  return { create: create };
})();
