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

  return { el: el, append: append, clear: clear, frag: frag, panel: panel, sectionTitle: sectionTitle, stat: stat, toast: toast, renderText: renderText, applyInline: applyInline };
})();
