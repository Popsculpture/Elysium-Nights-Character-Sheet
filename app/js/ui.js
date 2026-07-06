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
  // opts: { size (width px), edge (stroke), num (value color), value, animating, numSize }
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
    return '<svg viewBox="0 0 100 100" width="' + w + '" height="' + h + '" aria-hidden="true">'
      + '<polygon points="' + g.outer + '" fill="rgba(0,0,0,.35)" style="stroke:' + edge + '" stroke-width="4" stroke-linejoin="round"/>'
      + inner
      + '<text x="50" y="' + g.numY + '" text-anchor="middle" dominant-baseline="central" style="fill:' + num + ';font-family:var(--mono);font-weight:700" font-size="' + fs + '">' + shown + '</text>'
      + '</svg>';
  }
  // one rolled Dice-Pool die (#GRID); colored by how many hits it counts for,
  // gold-edged for a d12, shakes via .tb-die.rolling with animatePoolRoll attrs.
  function dieFace(die, poolColor, animating) {
    var num = animating ? "var(--text)" : (die.hits === 2 ? poolColor : (die.hits === 1 ? "var(--text)" : "var(--text4)"));
    var svg = dieFaceSvg(die.sides, {
      size: die.sides === 12 ? 24 : 23, hRatio: 1.06, edge: die.sides === 12 ? "var(--gold)" : "var(--border2)",
      num: num, value: die.value, animating: animating, numSize: animating ? 32 : (die.value >= 10 ? 30 : 36)
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

  // a geometrically exact icosahedron, projected straight down a 3-fold (face)
  // axis: a pointy-top hexagon silhouette with all 24 interior edges, which read
  // as the classic overlapping-triangle "d20 icon" (front face + back face form
  // the central hexagram). Coordinates come from the real 12 vertices, so every
  // line lands where a twenty-sider's edges actually project. viewBox is 100x116
  // (taller than wide) so the top and bottom apexes are not clipped. Interior
  // edges stay faint and the value sits opaque in the central void of the star.
  var D20_OUTER = "50,4.9 96,31.5 96,84.5 50,111.1 4,84.5 4,31.5";
  var D20_FACETS = "M78.4,74.4 L21.6,74.4 M78.4,74.4 L50,25.2 M78.4,74.4 L96,84.5"
    + " M78.4,74.4 L96,31.5 M78.4,74.4 L50,111.1 M21.6,74.4 L50,25.2 M21.6,74.4 L4,84.5"
    + " M21.6,74.4 L50,111.1 M21.6,74.4 L4,31.5 M50,25.2 L50,4.9 M50,25.2 L96,31.5"
    + " M50,25.2 L4,31.5 M4,84.5 L21.6,41.6 M4,84.5 L50,90.8 M50,4.9 L21.6,41.6"
    + " M50,4.9 L78.4,41.6 M96,84.5 L78.4,41.6 M96,84.5 L50,90.8 M96,31.5 L78.4,41.6"
    + " M50,111.1 L50,90.8 M4,31.5 L21.6,41.6 M21.6,41.6 L78.4,41.6 M21.6,41.6 L50,90.8"
    + " M78.4,41.6 L50,90.8";
  /* A single d20 for the roll tray. opts: { animating, kept, dropped, crit,
     fumble }. When animating it carries data attrs so animatePoolRoll scrambles
     it (the value is the only <text>, so the scramble still finds it). */
  function d20Face(value, opts) {
    opts = opts || {};
    var w = opts.size || 34, h = Math.round(w * 1.16);
    var edge = opts.crit ? "var(--gold)" : opts.fumble ? "var(--danger)" : opts.kept ? "var(--accent)" : "var(--border2)";
    var num = opts.animating ? "var(--text)" : opts.dropped ? "var(--text4)" : opts.crit ? "var(--gold)" : opts.fumble ? "var(--danger)" : "var(--text)";
    var shown = opts.animating ? "?" : String(value);
    var fs = shown.length >= 2 ? 28 : 36;
    var glow = (opts.kept && !opts.animating) ? "filter:drop-shadow(0 0 " + Math.round(w / 6) + "px " + edge + ");" : "";
    var svg = '<svg viewBox="0 0 100 116" width="' + w + '" height="' + h + '" aria-hidden="true" style="' + glow + '">'
      + '<polygon points="' + D20_OUTER + '" fill="rgba(0,0,0,.35)" style="stroke:' + edge + '" stroke-width="4" stroke-linejoin="round"/>'
      + '<path d="' + D20_FACETS + '" fill="none" style="stroke:' + edge + '" stroke-width="1.6" stroke-linejoin="round" opacity=".45"/>'
      + '<text x="50" y="58" text-anchor="middle" dominant-baseline="central" style="fill:' + num + ';font-family:var(--mono);font-weight:700" font-size="' + fs + '">' + shown + '</text>'
      + '</svg>';
    return el("span.tb-die" + (opts.animating ? ".rolling" : ""), {
      title: "d20" + (opts.animating ? "" : ": " + value + (opts.dropped ? " (dropped)" : opts.kept ? " (kept)" : "")),
      html: svg,
      dataset: opts.animating ? { die: "1", final: String(value), sides: "20" } : null,
      style: { display: "inline-flex", alignItems: "center", opacity: (opts.dropped && !opts.animating) ? 0.4 : 1 }
    });
  }

  return { el: el, append: append, clear: clear, frag: frag, panel: panel, sectionTitle: sectionTitle, stat: stat, toast: toast, renderText: renderText, applyInline: applyInline,
           dieFace: dieFace, dieFaceSvg: dieFaceSvg, d20Face: d20Face, animatePoolRoll: animatePoolRoll };
})();
