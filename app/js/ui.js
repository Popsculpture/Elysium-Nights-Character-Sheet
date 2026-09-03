/* ===========================================================================
   ELYSIUM NIGHTS - UI helpers (tiny DOM toolkit, no framework)
   =========================================================================== */
window.EN = window.EN || {};

EN.ui = (function () {
  /* el("div.foo#bar", {attrs}, [children|string]) */
  function el(tag, attrs, children) {
    var m = tag.match(/^([a-z0-9]+)?(.*)$/i);
    var name = m[1] || "div";
    var node = document.createElement(name);
    var rest = m[2] || "";
    var idm = rest.match(/#([\w-]+)/); if (idm) node.id = idm[1];
    var classes = (rest.match(/\.([\w-]+)/g) || []).map(function (c) { return c.slice(1); });
    if (classes.length) node.className = classes.join(" ");
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null) return;
        if (k === "class") { node.className += (node.className ? " " : "") + v; }
        else if (k === "html") { node.innerHTML = v; }
        else if (k === "text") { node.textContent = v; }
        else if (k === "style" && typeof v === "object") { Object.assign(node.style, v); }
        else if (k.slice(0, 2) === "on" && typeof v === "function") { node.addEventListener(k.slice(2).toLowerCase(), v); }
        else if (k === "dataset" && typeof v === "object") { Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; }); }
        else if (typeof v === "boolean") { if (v) node.setAttribute(k, ""); }
        // "value" must be set as a DOM property, not an attribute: a <textarea>'s
        // displayed text is driven entirely by its .value property (there is no
        // HTML "value" attribute for textareas), so setAttribute("value", ...)
        // silently does nothing on a freshly created node. Works for <input>,
        // <textarea>, and <option> alike; no <select> in this codebase sets
        // "value" directly (they select via each <option>'s "selected" flag).
        else if (k === "value") { node.value = v; }
        else { node.setAttribute(k, v); }
      });
    }
    append(node, children);
    return node;
  }
  function append(node, children) {
    if (children == null) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      if (typeof c === "string" || typeof c === "number") node.appendChild(document.createTextNode(String(c)));
      else node.appendChild(c);
    });
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); return node; }
  function frag() { return document.createDocumentFragment(); }

  function panel(title, tag, bodyChildren, opts) {
    opts = opts || {};
    var body = el("div.panel-b", null, bodyChildren);
    var children = [];
    if (title) children.push(el("div.panel-h", null, [
      el("h3", { text: title }),
      tag ? el("span.tag", { text: tag }) : null,
      opts.headerRight ? el("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" } }, [].concat(opts.headerRight)) : null
    ]));
    children.push(body);
    var p = el("div.panel" + (opts.glow ? ".glow" : ""), null, children);
    if (opts.corners) { ["tl", "tr", "bl", "br"].forEach(function (c) { p.appendChild(el("span.corner." + c)); }); }
    p.bodyEl = body;
    return p;
  }
  function sectionTitle(txt) { return el("div.section-title", null, [document.createTextNode(txt), el("span.line")]); }
  function stat(k, v, sub, flow) {
    return el("div.stat", null, [
      el("div.k", { text: k }),
      el("div" + (flow ? ".v.flow" : ".v"), { text: v }),
      sub ? el("div.s", { text: sub }) : null
    ]);
  }

  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1900);
  }

  function applyInline(parent, text) {
    var parts = text.split(/(\*\*[^*]+\*\*|\*(?!\*)[^*]+\*(?!\*))/);
    parts.forEach(function (part) {
      if (part.slice(0, 2) === "**" && part.slice(-2) === "**") {
        parent.appendChild(el("strong", { text: part.slice(2, -2) }));
      } else if (part.charAt(0) === "*" && part.charAt(part.length - 1) === "*") {
        parent.appendChild(el("em", { text: part.slice(1, -1) }));
      } else if (part) {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }

  function renderText(text) {
    if (!text) return el("p", { text: "" });
    var blocks = text.split("\n\n");
    var nodes = [];
    blocks.forEach(function (block) {
      var lines = block.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) return;
      var bulletStart = -1;
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].charAt(0) === "•") { bulletStart = i; break; }
      }
      if (bulletStart === -1) {
        var p = el("p", { style: { margin: nodes.length ? "6px 0 0" : "0" } });
        applyInline(p, block.trim());
        nodes.push(p);
      } else {
        if (bulletStart > 0) {
          var p2 = el("p", { style: { margin: nodes.length ? "6px 0 0" : "0" } });
          applyInline(p2, lines.slice(0, bulletStart).join(" "));
          nodes.push(p2);
        }
        var ul = el("ul", { style: { margin: "4px 0 0", paddingLeft: "16px", fontSize: "13.5px", color: "rgb(147, 168, 192)", lineHeight: "1.45" } });
        lines.slice(bulletStart).forEach(function (line) {
          if (line.charAt(0) === "•") {
            var li = el("li", { style: { marginBottom: "3px" } });
            applyInline(li, line.slice(1).trim());
            ul.appendChild(li);
          }
        });
        nodes.push(ul);
      }
    });
    if (!nodes.length) return el("p", { text: "" });
    if (nodes.length === 1) return nodes[0];
    var wrap = el("div");
    nodes.forEach(function (n) { wrap.appendChild(n); });
    return wrap;
  }

  /* ---- Dice visuals, shared by every bench/console/tray that shows dice ----
     A die is drawn as its physical solid, not a generic token: each size has a
     silhouette with faint interior facet edges. dieFaceSvg is the single source
     of that art, so the #GRID dice pool (dieFace, below) and the combat damage
     tray render the same d4-to-d12 set. Each entry: the outer polygon, the inner
     facet edges (a "P:" prefix marks a polygon, otherwise it's a path), and the
     y the centered value sits at.
       d4  tetrahedron (triangle + medial triforce)
       d6  cube face (square + inset bevel)
       d8  octahedron (tall diamond + equator/spine ridge)
       d10 pentagonal-trapezohedron (kite)          <- authored for #GRID
       d12 dodecahedron (pentagon face + spokes)     <- authored for #GRID  */
  var DIE_GEOM = {
    4:  { outer: "50,5 92,87 8,87", facets: [], numY: 61 },
    6:  { outer: "14,14 86,14 86,86 14,86", facets: [], numY: 50 },
    8:  { outer: "50,3 93,26 93,74 50,97 7,74 7,26", facets: ["M50,3 L7,74 M50,3 L93,74 M7,74 L93,74"], numY: 54 },
    10: { outer: "50,2 97,52 50,96 3,52", facets: ["M50,2 L28,62 L50,84 L72,62 Z M28,62 L3,52 M72,62 L97,52 M3,52 L50,84 L97,52"], numY: 49 },
    12: { outer: "50,2 78.2,11.2 95.6,35.2 95.6,64.8 78.2,88.8 50,98 21.8,88.8 4.4,64.8 4.4,35.2 21.8,11.2",
          facets: ["P:50,24 74.7,42 65.3,71 34.7,71 25.3,42", "M50,24 L50,2 M74.7,42 L95.6,35.2 M65.3,71 L78.2,88.8 M34.7,71 L21.8,88.8 M25.3,42 L4.4,35.2"],
          numY: 50 }
  };
  // opts: { size (width px), edge (stroke), num (value color), value, animating, numSize, glow (drop-shadow color) }
  function dieFaceSvg(sides, opts) {
    opts = opts || {};
    var g = DIE_GEOM[sides] || DIE_GEOM[6];
    var w = opts.size || 24, h = Math.round(w * (opts.hRatio || 1.04));
    var edge = opts.edge || "var(--border2)", num = opts.num || "var(--text)";
    var shown = opts.animating ? "?" : (opts.value == null ? "" : String(opts.value));
    var fs = opts.numSize || (shown.length >= 2 ? 30 : 36);
    var inner = g.facets.map(function (f) {
      return f.charAt(0) === "P"
        ? '<polygon points="' + f.slice(2) + '" fill="none" style="stroke:' + edge + '" stroke-width="3" stroke-linejoin="round" opacity=".7"/>'
        : '<path d="' + f + '" fill="none" style="stroke:' + edge + '" stroke-width="3" stroke-linejoin="round" opacity=".7"/>';
    }).join("");
    var glow = opts.glow ? "filter:drop-shadow(0 0 " + Math.round(w / 5) + "px " + opts.glow + ");" : "";
    return '<svg viewBox="0 0 100 100" width="' + w + '" height="' + h + '" aria-hidden="true" style="' + glow + '">'
      + '<polygon points="' + g.outer + '" fill="rgba(0,0,0,.35)" style="stroke:' + edge + '" stroke-width="4" stroke-linejoin="round"/>'
      + inner
      + '<text x="50" y="' + g.numY + '" text-anchor="middle" dominant-baseline="central" style="fill:' + num + ';font-family:var(--mono);font-weight:700" font-size="' + fs + '">' + shown + '</text>'
      + '</svg>';
  }
  // one rolled Dice-Pool die (#GRID Deep Run + crafting Work Intervals). poolColor
  // is the row's own colour: var(--success) for an Edge row, var(--danger) for a
  // Snag row. A d10 is outlined in that colour; a sharpened d12 goes gold for
  // Edge or arc-violet (var(--fp)) for Snag, so a lone die still reads which
  // pool it came from. Hit count drives the number: dim for a miss, plain text
  // for one hit, glowing in the die's own colour for two. Shakes via
  // .tb-die.rolling with animatePoolRoll attrs.
  function dieFace(die, poolColor, animating) {
    var isD12 = die.sides === 12, isEdge = poolColor === "var(--success)";
    var faceColor = isD12 ? (isEdge ? "var(--gold)" : "var(--fp)") : poolColor;
    var hit2 = die.hits === 2 && !animating;
    var num = animating ? "var(--text)" : (hit2 ? faceColor : (die.hits === 1 ? "var(--text)" : "var(--text4)"));
    var svg = dieFaceSvg(die.sides, {
      size: isD12 ? 24 : 23, hRatio: 1.06, edge: faceColor,
      num: num, value: die.value, animating: animating, numSize: animating ? 32 : (die.value >= 10 ? 30 : 36),
      glow: hit2 ? faceColor : null
    });
    return el("span.tb-die" + (animating ? ".rolling" : ""), {
      title: "d" + die.sides + (animating ? "" : (die.hits ? ", counts " + die.hits : ", no effect")), html: svg,
      dataset: animating ? { die: "1", final: String(die.value), sides: String(die.sides) } : null,
      style: { display: "inline-flex", alignItems: "center" } });
  }
  // scramble every [data-die] under root for ~700ms with a staggered settle,
  // scrambling any [data-tot] counters, then call done() (which should re-render)
  function animatePoolRoll(root, done) {
    if (!root) { if (done) done(); return; }
    var dice = [].slice.call(root.querySelectorAll("[data-die]"));
    var tots = [].slice.call(root.querySelectorAll("[data-tot]"));
    var t = 0, dur = 700;
    var timer = setInterval(function () {
      t += 50;
      dice.forEach(function (w, i) {
        var txt = w.querySelector("text");
        if (!txt || !w.isConnected) return;
        var sides = Number(w.dataset.sides) || 10;
        if (t < dur - (dice.length - i) * 4) { txt.textContent = String(1 + Math.floor(Math.random() * sides)); return; }
        txt.textContent = w.dataset.final;
        w.classList.remove("rolling");
      });
      tots.forEach(function (n) { if (n.isConnected && t < dur) n.textContent = "= " + Math.floor(Math.random() * 8) + " " + n.dataset.word; });
      if (t >= dur) { clearInterval(timer); if (done) done(); }
    }, 50);
  }
  // the d20 art is Brandon's own vector, drawn in CorelDRAW and handed over as a
  // real SVG path (not a raster): the classic point-up icosahedron with a big
  // front-face triangle that holds the value. The path is used verbatim, so the
  // die matches his reference exactly. The svg viewBox is the path's own bounding
  // box (padded for the stroke); the value sits at the front face's centroid,
  // which the parser found at (10400, 13175). Edges are stroked in the state
  // colour over a faint dark body; the single <text> keeps the roll animation.
  var D20_VIEWBOX = "2773 4482 15438 17601";
  var D20_NUM_X = 10400, D20_NUM_Y = 13175;
  var D20_PATH = "M9837.74 20987.1c-1795.67,-1030.37 -4364.29,-2525.4 -6160.57,-3554.7l1829.87 -1066.62c1308.33,1409.54 2884.15,3350.04 4330.7,4621.32zm-3889.21 -5104.93l8939.57 16.44 -4481.34 -8162.21c-1426.82,2721.46 -3105.68,5421.49 -4458.23,8145.77zm8927.67 429.52l-8893.44 14.84c902.97,999.05 3928.33,4187.67 4500.81,4805.88l4392.63 -4820.72zm-4912.29 -8603.11c-1462.72,2634.41 -2981.31,5368.32 -4444.34,8002.57l-1859.27 -6469.45c2074.75,-519.22 4228.66,-1014.61 6303.61,-1533.12zm179.45 -490.76c-1926.69,481.01 -3962.76,958.69 -5885.31,1439.23l5957.55 -3322.55 -72.24 1883.32zm735.93 495.18c953.04,213.92 5921.66,1341.56 6561.35,1518.19 -709.3,2178.75 -1426.09,4387.38 -2136.08,6565.93l-4425.27 -8084.12zm325.01 13226.34l4059.11 -4422.92c720.09,356.76 1331.26,668.07 1860.19,985.83l-5919.3 3437.09zm6420.1 -10977.11l-121.75 7201.73c-596.55,-291.66 -1283.33,-672.82 -1880.29,-963.63l2002.04 -6238.1zm-14605.43 7617.75l7439.44 4303.68c387.13,-236.25 6517.57,-3740.32 7453.7,-4277.37l98.7 -8668.54 -7597.97 -4255.4 -7439.96 4255.4 46.09 8642.23zm2167.44 -1478.59l-1721.77 962.43 23.01 -6803.49 1698.76 5841.06zm5440.28 -8911.91c7.6,-613.19 17.23,-1275.81 24.08,-1889.01 1879.77,1077.1 4098.55,2239.72 5975.14,3316.42l-5999.22 -1427.41z";
  /* A single d20 for the roll tray. opts: { animating, kept, dropped, crit,
     fumble, fxCrit, fxFault }. When animating it carries data attrs so
     animatePoolRoll scrambles it (the value is the only <text>, so the
     scramble still finds it). fxCrit/fxFault add a one-shot CSS animation
     (the crit/fumble fanfare, played the instant a roll settles) on top of
     the plain crit/fumble steady state below: a fumble sits dimmer and with
     a weaker glow than a crit, so it reads as drained rather than a red
     copy of the same triumphant look. */
  function d20Face(value, opts) {
    opts = opts || {};
    var w = opts.size || 34, h = Math.round(w * 1.14);
    var edge = opts.crit ? "var(--gold)" : opts.fumble ? "var(--danger)" : opts.kept ? "var(--accent)" : "var(--border2)";
    var num = opts.animating ? "var(--text)" : opts.dropped ? "var(--text4)" : opts.crit ? "var(--gold)" : opts.fumble ? "var(--danger)" : "var(--text)";
    var shown = opts.animating ? "?" : String(value);
    var fs = shown.length >= 2 ? 4200 : 5400;
    var glowPx = opts.fumble ? Math.round(w / 10) : Math.round(w / 6);
    var glow = (opts.kept && !opts.animating) ? "filter:drop-shadow(0 0 " + glowPx + "px " + edge + ");" : "";
    var svg = '<svg viewBox="' + D20_VIEWBOX + '" width="' + w + '" height="' + h + '" aria-hidden="true" style="' + glow + '">'
      + '<path d="' + D20_PATH + '" fill="rgba(2,10,18,.55)" fill-rule="evenodd" style="stroke:' + edge + '" stroke-width="260" stroke-linejoin="round"/>'
      + '<text x="' + D20_NUM_X + '" y="' + D20_NUM_Y + '" text-anchor="middle" dominant-baseline="central" style="fill:' + num + ';font-family:var(--mono);font-weight:700" font-size="' + fs + '">' + shown + '</text>'
      + '</svg>';
    return el("span.tb-die" + (opts.animating ? ".rolling" : "") + (opts.fxCrit ? ".fx-die-crit" : "") + (opts.fxFault ? ".fx-die-fault" : ""), {
      title: "d20" + (opts.animating ? "" : ": " + value + (opts.dropped ? " (dropped)" : opts.kept ? " (kept)" : "")),
      html: svg,
      dataset: opts.animating ? { die: "1", final: String(value), sides: "20" } : null,
      style: { display: "inline-flex", alignItems: "center",
        opacity: (opts.dropped && !opts.animating) ? 0.4 : (opts.fumble && !opts.animating) ? 0.6 : 1 }
    });
  }

  /* ------------------------------------------------------------------ *
     "Record filed" confirmation animation. A reusable, dependency-free
     message-sent motion built from inline SVG + CSS keyframes (theme.css,
     `.fx-svg` / #filed-ov): an envelope closes, tilts, streaks away, then a
     ring draws and a checkmark lands. Single ~10.6s timeline; every element
     shares the duration and self-schedules via keyframe percentages, so a
     replay is just re-adding the `.play` class. prefers-reduced-motion skips
     straight to the drawn ring + check. playFiled() drops it on a paper card
     over a dim backdrop, and calls opts.onDone once the check has settled
     (or immediately on tap/Esc to skip). */
  function filedSvg() {
    return '' +
      '<svg class="fx-svg" viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<g class="fx-env-open">' +                                  // open envelope, crossfades out
          '<rect x="155" y="250" width="330" height="195" rx="16"/>' +
          '<path d="M155 250 L320 145 L485 250"/>' +                 // flap standing open
          '<path d="M155 445 L320 320 L485 445"/>' +                 // front pocket fold
          '<path d="M155 250 L320 320"/><path d="M485 250 L320 320"/>' +  // side folds
        '</g>' +
        '<g class="fx-env">' +                                       // closed / flying envelope
          '<rect x="155" y="250" width="330" height="195" rx="16"/>' +
          '<path d="M155 250 L320 352 L485 250"/>' +                 // folded flap crease
        '</g>' +
        '<line class="fx-trail" x1="470" y1="180" x2="512" y2="150"/>' +   // exit trail
        '<line class="fx-streak a" x1="196" y1="232" x2="230" y2="210"/>' +
        '<line class="fx-streak b" x1="168" y1="276" x2="206" y2="252"/>' +
        '<line class="fx-streak a" x1="440" y1="432" x2="474" y2="410"/>' +
        '<line class="fx-streak b" x1="470" y1="392" x2="508" y2="368"/>' +
        '<circle class="fx-ring" cx="320" cy="320" r="150" pathLength="100"/>' +
        '<path class="fx-check" d="M270 325 L305 360 L380 280"/>' +
        '<circle class="fx-dot" cx="300" cy="398" r="5"/><circle class="fx-dot" cx="330" cy="404" r="5"/>' +
      '</svg>';
  }
  function playFiled(opts) {
    opts = opts || {};
    if (document.getElementById("filed-ov")) return null;            // one at a time
    var reduce = false;
    try { reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

    var cap = el("div.filed-cap", { role: "status", "aria-live": "polite", text: reduce ? "" : "FILING TO REGISTRY" });
    var card = el("div.filed-card", null, [
      el("div.filed-svgwrap", { html: filedSvg() }),
      cap,
      el("div.filed-sub", { text: (opts.ref || "IDENTITY NETWORK TAG") + (opts.name ? " · " + opts.name : "") }),
      el("div.filed-skip", { text: "tap to skip" })
    ]);
    if (reduce) card.classList.add("filed-done");                   // final caption color without waiting on the swap
    var ov = el("div#filed-ov", { role: "dialog", "aria-modal": "true", "aria-label": "Record filing confirmation", tabindex: "-1" }, [card]);
    document.body.appendChild(ov);
    try { ov.focus(); } catch (e) {}
    if (reduce) setTimeout(function () { cap.textContent = "RECORD FILED"; }, 60);   // announce via the live region

    var done = false, tEnd, tCap;
    function finish() {
      if (done) return; done = true;
      clearTimeout(tEnd); clearTimeout(tCap);
      document.removeEventListener("keydown", onKey, true);
      ov.classList.add("out");
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); if (opts.onDone) opts.onDone(); }, 300);
    }
    function onKey(e) { if (e.key === "Escape") { e.preventDefault(); finish(); } }
    document.addEventListener("keydown", onKey, true);
    ov.addEventListener("click", finish);

    void ov.offsetWidth;                                             // reflow, then arm the timeline
    var svg = ov.querySelector(".fx-svg");
    if (svg) svg.classList.add("play");
    if (!reduce) tCap = setTimeout(function () { cap.textContent = "RECORD FILED"; card.classList.add("filed-done"); }, 7600);
    tEnd = setTimeout(finish, reduce ? 1500 : 8400);                 // navigate once the check has settled
    return { skip: finish };
  }

  /* ---- the currency marks, on devices whose fonts do not have them ----------
     Glimmer is U+1D4A2 MATHEMATICAL SCRIPT CAPITAL G and Nexus is U+25CE BULLSEYE. Both
     live outside the Latin display faces this app loads (Rajdhani, Barlow Condensed), so
     the browser falls through to whatever the device happens to have. Windows and macOS
     usually carry one; plenty of Android builds carry neither, and the player gets a tofu
     box where a price should be.

     Detected rather than assumed: the mark is measured against a private-use codepoint
     nothing maps, in the same font stack. Equal advance widths means both fell through to
     the same .notdef box, so the glyph is genuinely absent. Measured ONCE and cached,
     because it cannot change while the page is open.

     The substitution runs only on devices that need it, and it walks TEXT NODES, because
     most of these marks are not written by code at all: they are inside catalog prose
     ("Price: <G>60 (Common, Legal)"), so nothing short of touching the rendered text
     reaches them.

     The stand-in is a LETTER, deliberately, not a drawing of the mark. Reconstructing
     Brandon's glyph by eye is exactly the wrong move; when he supplies the real artwork
     this is the one function that has to change. */
  var GLIMMER = String.fromCodePoint(0x1D4A2), NEXUS = String.fromCodePoint(0x25CE);
  var _glyphOk = null;
  function glyphSupported(ch) {
    var probe = document.createElement("canvas").getContext("2d");
    var stack = getComputedStyle(document.body).fontFamily || "sans-serif";
    probe.font = "72px " + stack;
    var a = probe.measureText(ch).width;
    var b = probe.measureText(String.fromCodePoint(0xF8FF)).width;   // private use: nothing maps it
    return Math.abs(a - b) > 0.5;
  }
  function currencyGlyphsOk() {
    if (_glyphOk === null) {
      try { _glyphOk = { glimmer: glyphSupported(GLIMMER), nexus: glyphSupported(NEXUS) }; }
      catch (e) { _glyphOk = { glimmer: true, nexus: true }; }   // cannot measure: leave the text alone
    }
    return _glyphOk;
  }

  /* ---- the marks as REAL OUTLINES, so no device has to own a font ------------
     GLIMMER is U+1D4A2 MATHEMATICAL SCRIPT CAPITAL G, outlined from **Latin Modern Math
     1.959** (Jackowski, Strzelczyk and Pianowski), which carries the codepoint and ships
     under the **GUST Font License**, an instance of the LPPL: free to use, distribute and
     modify. That licence is the reason this glyph and not another. Brandon's first SVG was
     the same character set in Cambria and still LIVE TEXT, so it asked the device for a
     font exactly like the bare character did, and would have drawn the same tofu box on the
     phone that started this.

     Font coordinates are y-UP with the baseline at 0; SVG is y-down. Hence scale(1,-1) and
     a viewBox whose top is the glyph's ascent as a negative number. From the font: 1000
     units per em, advance 685, ink from x 39..644 and y -130..697.

     NEXUS is U+25CE BULLSEYE, which Latin Modern Math does not carry. It needs no font and
     no artwork: a bullseye IS a circle inside a circle, two concentric rings with an open
     middle, so it is drawn from the character's own definition rather than traced from
     anyone's typeface.

     fill: currentColor throughout, so both marks inherit the surrounding text colour and
     follow every theme without a second definition. */
  var GLIMMER_PATH = "M641 582C648 611 645 636 629 657C605 690 547 697 514 697C439 697 366 678 292 629C231 588 189 521 173 455C158 395 153 333 186 289C220 245 277 223 340 223C390 223 445 238 493 268L472 172C462 129 445 91 423 50C405 18 382 -13 352 -38C312 -70 266 -93 220 -93C190 -93 159 -87 143 -65C133 -52 133 -34 133 -16C134 -3 135 12 128 21C123 28 115 31 105 31C92 31 77 29 66 20C55 11 46 -2 43 -14C35 -43 42 -69 57 -89C81 -122 126 -130 171 -130C254 -130 337 -95 411 -36C449 -6 476 32 497 74C527 135 548 198 563 261L596 393L540 380C527 351 498 311 483 299C443 267 399 253 354 253C313 253 280 272 258 301C228 341 232 400 246 456C261 517 297 576 351 619C390 650 437 663 481 663C506 663 541 653 558 629C570 613 576 595 570 573C566 554 559 533 542 519C519 501 497 498 473 498L466 481C481 478 505 472 510 472C540 472 569 488 595 509C619 529 634 555 641 582Z";
  function glimmerSvg() {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 -697 685 827");
    svg.setAttribute("class", "cur-svg");
    svg.setAttribute("aria-hidden", "true");
    var g = document.createElementNS(NS, "g");
    g.setAttribute("transform", "scale(1,-1)");
    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", GLIMMER_PATH);
    g.appendChild(path);
    svg.appendChild(g);
    return svg;
  }
  function nexusSvg() {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 -700 700 700");
    // its own class, because a ring wants different metrics from a letter: it sits centred
    // on the x-height rather than on the baseline, and reads heavy at a letter's full height
    svg.setAttribute("class", "cur-svg cur-svg-nexus");
    svg.setAttribute("aria-hidden", "true");
    var g = document.createElementNS(NS, "g");
    g.setAttribute("transform", "translate(350,-350)");
    var ring = document.createElementNS(NS, "circle");
    /* Proportions taken from the printed bullseye rather than invented: a THIN ring, a
       small inner ring, and visible air between them. Sized by MEASUREMENT against the
       device font: 0.70em of ink sitting 0.69em above the baseline. */
    ring.setAttribute("r", "280");
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "currentColor");
    ring.setAttribute("stroke-width", "60");
    // TWO CONCENTRIC RINGS. The first cut drew a filled centre dot, which is a target
    // reticle, not a bullseye: U+25CE is a circle inside a circle and the middle is open.
    var inner = document.createElementNS(NS, "circle");
    inner.setAttribute("r", "112");
    inner.setAttribute("fill", "none");
    inner.setAttribute("stroke", "currentColor");
    inner.setAttribute("stroke-width", "60");
    g.appendChild(ring);
    g.appendChild(inner);
    svg.appendChild(g);
    return svg;
  }

  /* Runs at the end of every render and is a NO-OP on any device whose fonts carry both
     marks, which is the common case and costs one cached measurement. Only devices that
     would otherwise show a tofu box pay anything, and only they lose the ability to select
     and copy the mark as text, which is the trade that buys them a readable price.

     It walks TEXT NODES because most of these marks are not written by code at all: they
     are inside catalog prose ("Price: <G>60 (Common, Legal)"), so nothing short of touching
     the rendered text reaches them. */
  function substituteCurrencyGlyphs(root) {
    var ok = currencyGlyphsOk();
    if (ok.glimmer && ok.nexus) return;
    var subs = [];
    if (!ok.glimmer) subs.push([GLIMMER, glimmerSvg, "Glimmer"]);
    if (!ok.nexus) subs.push([NEXUS, nexusSvg, "Nexus"]);
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue) return NodeFilter.FILTER_REJECT;
        if (n.nodeValue.indexOf(GLIMMER) === -1 && n.nodeValue.indexOf(NEXUS) === -1) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode;
        if (p && (p.nodeName === "SCRIPT" || p.nodeName === "STYLE")) return NodeFilter.FILTER_REJECT;
        if (p && p.classList && p.classList.contains("cur-sub")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var hits = [], n;
    while ((n = walker.nextNode())) hits.push(n);
    hits.forEach(function (node) {
      var frag = document.createDocumentFragment();
      Array.from(node.nodeValue).forEach(function (chr) {
        var hit = subs.filter(function (x) { return x[0] === chr; })[0];
        if (!hit) { frag.appendChild(document.createTextNode(chr)); return; }
        var span = document.createElement("span");
        span.className = "cur-sub";
        span.title = hit[2];
        span.appendChild(hit[1]());
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* ===== CONFIRM WITHOUT window.confirm ==================================
     Every destructive action used to sit behind confirm(). That is not dependable: browsers
     suppress dialogs once a user ticks "prevent additional dialogs", and some block them
     outright. A suppressed confirm() returns FALSE INSTANTLY, so the guarded action silently
     does nothing and the app looks broken with no error anywhere. Measured here returning
     false in 2ms with no dialog shown, which is exactly what "I cannot delete my characters"
     looked like from the outside.

     So confirmation is in-app: the first click ARMS the button and it relabels, the second
     click commits. No dialog, no browser cooperation needed, and the armed state is visible
     rather than modal. Arming is a single global slot, so arming one button disarms any
     other; disarm() is called when a panel opens or closes. */
  var _armedKey = null;
  function disarm() { _armedKey = null; }
  function isArmed(key) { return _armedKey === key; }
  function armButton(key, opts) {
    opts = opts || {};
    var armed = _armedKey === key;
    // opts.cls lets a caller keep its own styling (a swatch mini-button, say) and still arm
    var cls = opts.cls ? ("button" + opts.cls + (armed ? ".primary" : ""))
                       : ("button.btn" + (opts.small === false ? "" : ".sm") + ".danger" + (armed ? ".primary" : ""));
    return el(cls, {
      title: armed ? (opts.armedTitle || "Click again to confirm. This cannot be undone.") : (opts.title || ""),
      onclick: function (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        if (armed) { _armedKey = null; if (opts.onConfirm) opts.onConfirm(); }
        // Arming rebuilds whoever drew the button, so it comes back armed. That is the app's
        // render for a button in #view; a surface render() never touches (the settings tray)
        // passes its own rebuild as opts.onArm, or its button re-arms forever and never confirms.
        else { _armedKey = key; if (opts.onArm) opts.onArm(); else EN.app.render(); }
      }
    }, armed ? (opts.armedLabel || "SURE?") : opts.label);
  }

  return { el: el, append: append, clear: clear, panel: panel, sectionTitle: sectionTitle, stat: stat, toast: toast, renderText: renderText, applyInline: applyInline,
           currencyGlyphsOk: currencyGlyphsOk, substituteCurrencyGlyphs: substituteCurrencyGlyphs,
           dieFace: dieFace, dieFaceSvg: dieFaceSvg, d20Face: d20Face, animatePoolRoll: animatePoolRoll, playFiled: playFiled,
           armButton: armButton, disarm: disarm, isArmed: isArmed };
})();
