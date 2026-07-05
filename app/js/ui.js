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

  /* ---- Dice Pool visuals, shared by every bench/console that rolls pools ----
     dieFace draws a rolled die as its physical shape (d10 kite face, d12
     pentagon); while animating it shows "?", shakes via .tb-die.rolling, and
     carries data attrs for animatePoolRoll to scramble. */
  function dieFace(die, poolColor, animating) {
    var num = animating ? "var(--text)" : (die.hits === 2 ? poolColor : (die.hits === 1 ? "var(--text)" : "var(--text4)"));
    var edge = die.sides === 12 ? "var(--gold)" : "var(--border2)";
    var fs = animating ? 32 : (die.value >= 10 ? 30 : 36);
    var shown = animating ? "?" : die.value;
    var svg;
    if (die.sides === 12) {
      svg = '<svg viewBox="0 0 100 100" width="24" height="25" aria-hidden="true">'
        + '<polygon points="50,2 78.2,11.2 95.6,35.2 95.6,64.8 78.2,88.8 50,98 21.8,88.8 4.4,64.8 4.4,35.2 21.8,11.2" fill="rgba(0,0,0,.35)" style="stroke:' + edge + '" stroke-width="4" stroke-linejoin="round"/>'
        + '<polygon points="50,24 74.7,42 65.3,71 34.7,71 25.3,42" fill="none" style="stroke:' + edge + '" stroke-width="3" stroke-linejoin="round" opacity=".7"/>'
        + '<path d="M50,24 L50,2 M74.7,42 L95.6,35.2 M65.3,71 L78.2,88.8 M34.7,71 L21.8,88.8 M25.3,42 L4.4,35.2" fill="none" style="stroke:' + edge + '" stroke-width="3" opacity=".7"/>'
        + '<text x="50" y="50" text-anchor="middle" dominant-baseline="central" style="fill:' + num + ';font-family:var(--mono);font-weight:700" font-size="' + fs + '">' + shown + '</text>'
        + '</svg>';
    } else {
      svg = '<svg viewBox="0 0 100 100" width="23" height="25" aria-hidden="true">'
        + '<polygon points="50,2 97,52 50,96 3,52" fill="rgba(0,0,0,.35)" style="stroke:' + edge + '" stroke-width="4" stroke-linejoin="round"/>'
        + '<path d="M50,2 L28,62 L50,84 L72,62 Z M28,62 L3,52 M72,62 L97,52 M3,52 L50,84 L97,52" fill="none" style="stroke:' + edge + '" stroke-width="3" stroke-linejoin="round" opacity=".7"/>'
        + '<text x="50" y="49" text-anchor="middle" dominant-baseline="central" style="fill:' + num + ';font-family:var(--mono);font-weight:700" font-size="' + fs + '">' + shown + '</text>'
        + '</svg>';
    }
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

  /* A single d20 for the roll tray, drawn as a hexagon token with a faint
     inner triangle so it reads as a twenty-sider next to the pool dice.
     opts: { animating, kept, dropped, crit, fumble }. When animating it
     carries data attrs so animatePoolRoll (sides 20) scrambles it. */
  function d20Face(value, opts) {
    opts = opts || {};
    var w = opts.size || 34, h = Math.round(w * 1.03);
    var edge = opts.crit ? "var(--gold)" : opts.fumble ? "var(--danger)" : opts.kept ? "var(--accent)" : "var(--border2)";
    var num = opts.animating ? "var(--text)" : opts.dropped ? "var(--text4)" : opts.crit ? "var(--gold)" : opts.fumble ? "var(--danger)" : "var(--text)";
    var shown = opts.animating ? "?" : String(value);
    var glow = (opts.kept && !opts.animating) ? "filter:drop-shadow(0 0 " + Math.round(w / 6) + "px " + edge + ");" : "";
    var svg = '<svg viewBox="0 0 100 100" width="' + w + '" height="' + h + '" aria-hidden="true" style="' + glow + '">'
      + '<polygon points="50,3 92,27 92,73 50,97 8,73 8,27" fill="rgba(0,0,0,.35)" style="stroke:' + edge + '" stroke-width="4" stroke-linejoin="round"/>'
      + '<polygon points="27,34 73,34 50,74" fill="none" style="stroke:' + edge + '" stroke-width="2.5" stroke-linejoin="round" opacity=".4"/>'
      + '<text x="50" y="47" text-anchor="middle" dominant-baseline="central" style="fill:' + num + ';font-family:var(--mono);font-weight:700" font-size="33">' + shown + '</text>'
      + '</svg>';
    return el("span.tb-die" + (opts.animating ? ".rolling" : ""), {
      title: "d20" + (opts.animating ? "" : ": " + value + (opts.dropped ? " (dropped)" : opts.kept ? " (kept)" : "")),
      html: svg,
      dataset: opts.animating ? { die: "1", final: String(value), sides: "20" } : null,
      style: { display: "inline-flex", alignItems: "center", opacity: (opts.dropped && !opts.animating) ? 0.4 : 1 }
    });
  }

  return { el: el, append: append, clear: clear, frag: frag, panel: panel, sectionTitle: sectionTitle, stat: stat, toast: toast, renderText: renderText, applyInline: applyInline,
           dieFace: dieFace, d20Face: d20Face, animatePoolRoll: animatePoolRoll };
})();
