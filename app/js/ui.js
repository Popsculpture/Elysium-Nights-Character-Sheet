/* ===========================================================================
   ELYSIUM NIGHTS — UI helpers (tiny DOM toolkit, no framework)
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

  return { el: el, append: append, clear: clear, frag: frag, panel: panel, sectionTitle: sectionTitle, stat: stat, toast: toast };
})();
