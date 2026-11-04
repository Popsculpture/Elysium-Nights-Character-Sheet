/* ===========================================================================
   ELYSIUM NIGHTS · Flow tab · Visualize window
   A pop-open window that DRAWS the Invocation being free-shaped: you at the centre of a grid,
   the range, and the Delivery's area at the size you have bought, in the Resonance's colour.
   Change anything in the builder (or in the window's own controls, which are the same controls)
   and the picture reshapes on the spot.

   What it draws is the book's, taken from the one place the app already settles it:
     EN.aoeGrid (js/aoegrid.js) owns the cell geometry (Sphere, Cube, Cone, Line, Aura on a
     square or hex grid, diagonals cost 1), so this window and the Codex's Area diagram can never
     disagree about what a Sphere or a Cone catches.
     EN.flow.deliveryTable owns the reach and size of each Delivery (Handbook, The Flow >
     Invocations): Remote and Cube and Sphere reach 12 spaces; Touch is adjacent; Sigil is a mark
     within reach; Aura, Cone and Line start on you. Each extra space bought (+1 FP) grows one
     dimension: a radius, a widest point, a length or an edge.
   Conventions this window CHOOSES (the book leaves them open, as aoegrid.js says of its own):
     where on the board a point-placed area sits (6 spaces out, on the facing line), which spaces
     the sample foes and spared allies stand on, and the 20 by 19 spaces of board it shows.

   Origin of the look: the grid, glow fill, tokens and square/hex toggle follow Brandon's Gridcast
   artifact (the neon HUD grid painter), redrawn in this app's own variables so every skin and
   palette reaches it. The Immersive version is its own switch (en_flowviz_immersive_v1),
   separate from the tab's, and rides the same Strain escalation (data-fx 1 to 5).

   Built as an SVG STRING handed to innerHTML (el() cannot make SVG; see aoegrid.js). No em or en
   dashes anywhere in this file (house style).
   =========================================================================== */
window.EN = window.EN || {};

EN.flowViz = (function () {
  var el = EN.ui.el;

  var GRID_KEY = "en_flowviz_grid_v1", IMM_KEY = "en_flowviz_immersive_v1";
  var _open = false, _grid = "square", _imm = false, _win = null, _pos = null, _last = null, _poll = null;
  try { if (localStorage.getItem(GRID_KEY) === "hex") _grid = "hex"; } catch (e) {}
  try { _imm = localStorage.getItem(IMM_KEY) === "1"; } catch (e) {}

  /* the board: 21 by 19 spaces, you at column 5, row 10 of it (so there is room to your east for a 12 space reach) */
  var C = 20, COLS = 21, ROWS = 19, OX = 4, OY = 9;
  var W = COLS * C, H = ROWS * C;
  var HEXR = C / Math.sqrt(3);
  var RANGE = 12;

  /* one colour per Resonance (a hex, because an SVG fill in a style string needs a literal) */
  var RES = { kinetic: "#ffb347", thermal: "#ff5a3c", electromagnetic: "#4cc9ff", visceral: "#6ee07a",
              spatial: "#b98bff", cognitive: "#ff7ad9", synthetica: "#3fe0c5", temporal: "#e9d6a8" };
  function resColor(key) { return RES[key] || "#b98bff"; }

  /* ---- scene geometry ----------------------------------------------------------------------- */
  function G() { return EN.aoeGrid || null; }
  function dist(a) { return _grid === "hex" ? G().hexDist(a.q, a.r) : G().sqDist(a.x, a.y); }
  function cell(a, b) { return _grid === "hex" ? { q: a, r: b } : { x: a, y: b }; }
  function add(c, a, b) { return _grid === "hex" ? { q: c.q + a, r: c.r + b } : { x: c.x + a, y: c.y + b }; }
  function ck(c) { return _grid === "hex" ? c.q + ":" + c.r : c.x + ":" + c.y; }
  function pt(c) {
    if (_grid === "hex") return { x: (OX + 0.5) * C + HEXR * Math.sqrt(3) * (c.q + c.r / 2), y: (OY + 0.5) * C + HEXR * 1.5 * c.r };
    return { x: (OX + c.x + 0.5) * C, y: (OY + c.y + 0.5) * C };
  }
  function visible(c) { var p = pt(c); return p.x > -C * 0.4 && p.x < W + C * 0.4 && p.y > -C * 0.4 && p.y < H + C * 0.4; }
  function hexPoly(cx, cy, r) {
    var s = [], i, a;
    for (i = 0; i < 6; i++) { a = Math.PI / 180 * (60 * i - 30); s.push((cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1)); }
    return s.join(" ");
  }
  // every space of the board, in paint order
  function boardCells() {
    var out = [], a, b;
    if (_grid === "hex") { for (b = -12; b <= 12; b++) for (a = -16; a <= 20; a++) { var h = { q: a, r: b }; if (visible(h)) out.push(h); } }
    else { for (a = -OX; a < COLS - OX; a++) for (b = -OY; b < ROWS - OY; b++) out.push({ x: a, y: b }); }
    return out;
  }
  function shapeCells(shape, n) { return _grid === "hex" ? G().hexCells(shape, n) : G().sqCells(shape, n); }

  /* Delivery option label ("Cube (2 spaces)") -> its key and the size the book gives it; extra spaces
     bought grow it one for one */
  var BASE_SIZE = { cube: 2, sigil: 2, aura: 2, cone: 3, sphere: 3, line: 6 };
  var SHAPE_OF = { cube: "cube", sigil: "cube", aura: "aura", cone: "cone", sphere: "sphere", line: "line" };
  function optKey(opt) { return String(opt || "").replace(/ \([^)]*\)$/, "").toLowerCase(); }

  /* Build the whole scene: the cells caught, the targets, the range and the words */
  function scene(form, inv, d) {
    var key = optKey(form.deliveryOption), band = form.deliveryBand;
    var fMod = (d && d.flow && d.flow.attribute && d.attributes[d.flow.attribute]) ? d.attributes[d.flow.attribute].mod : 0;
    var S = { key: key, band: band, area: [], foes: [], allies: [], spared: {}, range: 0, anchor: null, origin: cell(0, 0), size: 0, shape: null, object: null, text: "", where: "" };
    var o = cell(0, 0), ex = Math.max(0, form.extraSpaces | 0), et = Math.max(0, form.extraTargets | 0);
    function at(a, b) { return cell(a, b); }
    if (band === "directed") {
      if (key === "touch") { S.range = 1; S.foes.push(at(1, 0)); S.where = "a target you touch"; }
      else if (key === "imbue") { S.range = 1; S.object = at(2, 0); S.where = "an object or weapon; waits up to 1 minute"; }
      else { S.range = RANGE; S.foes.push(at(6, 0)); S.where = "a target you can clearly see within " + RANGE + " spaces"; }
      var extraAt = [[6, -2], [6, 2], [8, 0], [8, -2], [8, 2], [4, -2], [4, 2], [10, 0]];
      for (var i = 0; i < et && i < extraAt.length; i++) S.foes.push(at(extraAt[i][0], extraAt[i][1]));
      S.text = (key === "touch" ? "Touch" : key === "imbue" ? "Imbue" : "Remote") + ": one target" + (et ? " and " + et + " more" : "");
      return S;
    }
    var n = (BASE_SIZE[key] || 2) + ex, shape = SHAPE_OF[key] || "sphere";
    S.size = n; S.shape = shape;
    var base = shapeCells(shape, n), shift = [0, 0];
    if (key === "sphere") { shift = [6, 0]; S.range = RANGE; S.where = "a point you can see within " + RANGE + " spaces, 6 spaces out"; }
    else if (key === "cube") { shift = [6, -Math.floor((n - 1) / 2)]; S.range = RANGE; S.where = "a point you can see within " + RANGE + " spaces, near corner 6 spaces out"; }
    else if (key === "sigil") { shift = [2, -Math.floor((n - 1) / 2)]; S.range = 3; S.where = "a mark within your reach; waits up to 1 minute"; }
    else if (key === "aura") { S.where = "on you; it moves with you"; }
    else if (key === "cone") { S.where = "from you, widest point " + n + " spaces across"; }
    else { S.where = "from you, " + n + " spaces long, 1 wide"; }
    S.area = base.map(function (c) { return add(c, shift[0], shift[1]); });
    if (key === "sphere" || key === "cube" || key === "sigil") S.anchor = key === "sphere" ? at(6, 0) : (key === "sigil" ? at(2, 0) : at(6, 0));
    // sample foes and (with Precision Shaping) the allies it spares, spread through the area
    var cells = S.area.filter(function (c) { return !(c.x === 0 && c.y === 0 && _grid !== "hex") && !(c.q === 0 && c.r === 0 && _grid === "hex"); });
    var m = cells.length, used = {};
    function pick(frac) { var i = Math.min(m - 1, Math.max(0, Math.floor(m * frac))); while (used[i] && i < m - 1) i++; while (used[i] && i > 0) i--; used[i] = 1; return cells[i]; }
    if (m) {
      [0.12, 0.5, 0.86].forEach(function (f) { if (S.foes.length < Math.min(3, m)) S.foes.push(pick(f)); });
      var spare = (form.precision && (band === "focused" || band === "wide")) ? Math.max(0, Math.min(fMod, 5, m - S.foes.length)) : 0;
      var fr = [0.3, 0.66, 0.92, 0.2, 0.78];
      for (var k = 0; k < spare; k++) { var c = pick(fr[k % fr.length]); S.allies.push(c); S.spared[ck(c)] = 1; }
    }
    S.text = shape.charAt(0).toUpperCase() + shape.slice(1) + " (Area " + n + "): " + S.area.length + " spaces";
    return S;
  }

  /* ---- drawing ------------------------------------------------------------------------------ */
  function cellShape(c, cls, extra) {
    var p = pt(c);
    if (_grid === "hex") return '<polygon class="' + cls + '" points="' + hexPoly(p.x, p.y, HEXR - 0.6) + '"' + (extra || "") + '/>';
    return '<rect class="' + cls + '" x="' + (p.x - C / 2) + '" y="' + (p.y - C / 2) + '" width="' + C + '" height="' + C + '"' + (extra || "") + '/>';
  }
  function token(c, cls, glyph) {
    var p = pt(c);
    return '<g class="fv-tok ' + cls + '" transform="translate(' + p.x.toFixed(1) + " " + p.y.toFixed(1) + ')"><circle r="' + (C * 0.36) + '"/>' + (glyph || "") + '</g>';
  }
  function draw(form, inv, d, S) {
    var board = boardCells(), hit = {}, svg = [];
    S.area.forEach(function (c) { hit[ck(c)] = 1; });
    var inRange = function (c) { return S.range > 0 && S.range <= RANGE && dist(c) <= S.range && dist(c) > 0; };
    var lay = inv && inv.layer;
    svg.push('<defs><pattern id="fv-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="none"/><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="2"/></pattern></defs>');
    var field = "", ranged = "", over = "";
    board.forEach(function (c) {
      var k = ck(c);
      if (hit[k]) return;
      if (inRange(c)) ranged += cellShape(c, "fv-cell fv-range"); else field += cellShape(c, "fv-cell");
    });
    svg.push(field, ranged);
    // the area, over the field; each space carries its distance from you so the Immersive ripple can run outward
    var zone = inv && ((inv.empoweredEffect && inv.empoweredEffect.zone) || (inv.layer && inv.layer.empoweredEffect && inv.layer.empoweredEffect.zone));
    var sustain = form.duration === "sustain" && inv && inv.sustainable !== false;
    var spaces = 0;
    S.area.forEach(function (c, i) {
      if (!visible(c)) return;
      var cls = "fv-cell fv-hit" + (S.spared[ck(c)] ? " fv-spared" : "") + (lay && (i % 2 === 0) ? " fv-braid" : "");
      var dd = Math.round(dist(c));
      over += cellShape(c, cls, ' style="--d:' + dd + '"');
      if (!S.spared[ck(c)]) spaces++;
      if (zone && !S.spared[ck(c)]) over += cellShape(c, "fv-zone");
    });
    S.caught = spaces;
    svg.push('<g class="fv-area' + (sustain ? " fv-sustain" : "") + '">' + over + '</g>');
    // the reach, outlined at its far edge
    if (S.range > 1 && S.range <= RANGE) {
      var ring = "";
      board.forEach(function (c) { if (Math.round(dist(c)) === S.range) ring += cellShape(c, "fv-ring"); });
      svg.push('<g class="fv-rangering">' + ring + "</g>");
    }
    // the line from you to where it lands
    var tgt = S.anchor || S.object || (S.band === "directed" ? S.foes[0] : null);
    if (tgt) {
      var a0 = pt(cell(0, 0)), b0 = pt(tgt);
      svg.push('<line class="fv-beam" x1="' + a0.x + '" y1="' + a0.y + '" x2="' + b0.x + '" y2="' + b0.y + '"/>');
    }
    if (S.anchor) { var ap = pt(S.anchor); svg.push('<g class="fv-anchor" transform="translate(' + ap.x + " " + ap.y + ')"><circle r="3.2"/><circle class="fv-anchor-ring" r="7"/></g>'); }
    if (S.object) { var op = pt(S.object); svg.push('<g class="fv-obj" transform="translate(' + op.x + " " + op.y + ')"><path d="M0,-7 L7,0 L0,7 L-7,0 Z"/></g>'); }
    S.foes.forEach(function (c) { if (visible(c)) svg.push(token(c, "fv-foe", '<path d="M-3.4,-3.4 L3.4,3.4 M3.4,-3.4 L-3.4,3.4"/>')); });
    S.allies.forEach(function (c) { if (visible(c)) svg.push(token(c, "fv-ally", '<path d="M-3.6,0.4 L-1,3 L3.8,-3"/>')); });
    svg.push(token(cell(0, 0), "fv-you", '<circle class="fv-you-dot" r="3"/>'));
    return '<svg class="fv-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + S.text.replace(/"/g, "") + '">' + svg.join("") + "</svg>";
  }

  /* ---- the window --------------------------------------------------------------------------- */
  function isOpen() { return _open; }
  function stageSummary(form, inv, d, S) {
    var lines = [];
    lines.push(S.text + (S.where ? " · " + S.where : ""));
    if (S.shape && S.caught != null) lines.push(S.caught + " space" + (S.caught === 1 ? "" : "s") + " caught" + (S.allies.length ? ", " + S.allies.length + " spared by Precision Shaping" : ""));
    if (inv && inv.layer) lines.push("Layered: " + (inv.resonance ? inv.resonance.name : "") + " + " + inv.layer.resonance.name + ", one Complex Action");
    if (form.duration === "sustain") lines.push("Sustained: holds 1 minute (10 rounds), +1 FP each extra minute");
    return lines;
  }
  function build(ctx) {
    var form = ctx.form, inv = ctx.inv, d = ctx.d;
    var S = scene(form, inv, d);
    var svg = draw(form, inv, d, S);
    var resKey = form.resonance, col = resColor(resKey), col2 = inv && inv.layer ? resColor(form.layer && form.layer.resonance) : col;
    var cost = inv ? inv.fp : 0;
    var stage = ctx.fx != null ? ctx.fx : (d.flow && d.flow.strainStage) || 0;

    var stage_ = el("div.fv-stage");
    stage_.innerHTML = svg;
    var legend = el("div.fv-legend", null, [
      el("span.fv-lg.fv-lg-you", { text: "YOU" }), el("span.fv-lg.fv-lg-foe", { text: "FOE" }),
      el("span.fv-lg.fv-lg-ally", { text: "SPARED" }), el("span.fv-lg.fv-lg-range", { text: "REACH" })
    ]);
    stage_.appendChild(legend);

    var read = el("div.fv-read", null, [
      el("div.row.between.wrap", { style: { alignItems: "baseline", gap: "8px" } }, [
        el("div.mono.fv-fp" + (inv && inv.overCap ? ".over" : ""), { html: cost + " <span>FP · cap " + (inv ? inv.cap : "") + "</span>" }),
        inv && inv.damageText ? EN.ui.damageText(el("span.mono.dmg-readout.fv-dmg"), inv.damageText) : el("span.mono.fv-dmg", { text: "no damage" })
      ]),
      el("p.fv-res", { text: inv ? inv.resolutionText : "" })
    ].concat(stageSummary(form, inv, d, S).map(function (t) { return el("p.fv-line", { text: t }); }))
      .concat((inv && inv.warnings || []).map(function (w) { return el("p.fv-line.fv-warn", { text: w }); })));

    var head = [
      el("button.btn.sm.fv-tog" + (_grid === "square" ? ".primary" : ""), { type: "button", title: "Square grid", onclick: function () { setGrid("square"); } }, "SQUARE"),
      el("button.btn.sm.fv-tog" + (_grid === "hex" ? ".primary" : ""), { type: "button", title: "Hex grid", onclick: function () { setGrid("hex"); } }, "HEX"),
      el("button.btn.sm.fv-tog" + (_imm ? ".primary" : ""), { type: "button", dataset: { fvImm: "1" }, title: "Immersive: the window breathes with the Resonance and the Strain you are carrying", onclick: function () { setImm(!_imm); } }, "IMMERSIVE"),
      el("button.btn.sm", { type: "button", dataset: { fvClose: "1" }, title: "Close the window", onclick: close }, "✕")
    ];
    var pan = EN.ui.panel("Visualize", "SCALE AND DELIVERY", [stage_, read, el("div.fv-ctl", null, [ctx.controls || null])], { corners: true, headerRight: head });
    var win = el("div#fv-win.fv-win" + (_imm ? ".fv-immersive" : ""), { dataset: { fx: String(Math.max(0, Math.min(5, stage))), grid: _grid, res: resKey || "" }, role: "dialog", "aria-label": "Visualize the Invocation" }, [pan]);
    win.style.setProperty("--fv-res", col); win.style.setProperty("--fv-res2", col2);
    win.style.setProperty("--fv-pulse", String(1 + Math.max(0, stage) * 0.35));
    return win;
  }
  function place(win) {
    var vw = window.innerWidth || 1200, vh = window.innerHeight || 800;
    if (vw < 700) { win.style.left = "0"; win.style.right = "0"; win.style.bottom = "0"; win.style.top = "auto"; win.classList.add("fv-sheet"); return; }
    var p = _pos || { right: 18, bottom: 18 };
    win.style.right = p.right + "px"; win.style.bottom = p.bottom + "px"; win.style.left = "auto"; win.style.top = "auto";
  }
  function dragHandle(win) {
    var h = win.querySelector(".panel-h"); if (!h) return;
    h.style.cursor = "move";
    h.addEventListener("pointerdown", function (ev) {
      if (ev.target.closest && ev.target.closest("button")) return;
      var r = win.getBoundingClientRect(), sx = ev.clientX, sy = ev.clientY, vw = window.innerWidth, vh = window.innerHeight;
      function mv(e) {
        var right = Math.max(0, Math.min(vw - 120, vw - (r.right + (e.clientX - sx)))), bottom = Math.max(0, Math.min(vh - 60, vh - (r.bottom + (e.clientY - sy))));
        _pos = { right: right, bottom: bottom }; win.style.right = right + "px"; win.style.bottom = bottom + "px";
      }
      function up() { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }
      document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
      ev.preventDefault();
    });
  }
  /* Called by the Flow tab's builder on every render with everything the picture needs; a no-op
     while the window is closed. ctx = { ch, d, form, inv, controls (a node), fx } */
  function refresh(ctx) {
    _last = ctx;
    if (!_open) return;
    var keepScroll = _win ? (_win.querySelector(".fv-scroll") || _win).scrollTop : 0;
    var win = build(ctx);
    if (_win && _win.parentNode) _win.parentNode.replaceChild(win, _win); else document.body.appendChild(win);
    _win = win; place(win); dragHandle(win);
    win.style.display = "";
    var sc = win.querySelector(".panel-b"); if (sc) sc.scrollTop = keepScroll;
    watch();
  }
  // the window belongs to the Flow tab: hide it on any other tab, show it again on return
  function watch() {
    if (_poll) return;
    _poll = setInterval(function () {
      if (!_open) { clearInterval(_poll); _poll = null; return; }
      var tab = null; try { tab = EN.app.activeTab(); } catch (e) {}
      if (_win) _win.style.display = (tab === "flow") ? "" : "none";
    }, 400);
  }
  function open() { _open = true; if (_last) refresh(_last); }
  function close() {
    _open = false;
    if (_win && _win.parentNode) _win.parentNode.removeChild(_win);
    _win = null;
    try { EN.app.render(); } catch (e) {}   // the builder's VISUALIZE button reads its state back
  }
  function toggle() { if (_open) close(); else { _open = true; EN.app.render(); } }
  function setGrid(g) { _grid = g === "hex" ? "hex" : "square"; try { localStorage.setItem(GRID_KEY, _grid); } catch (e) {} if (_last) refresh(_last); }
  function setImm(on) { _imm = !!on; try { localStorage.setItem(IMM_KEY, _imm ? "1" : "0"); } catch (e) {} if (_last) refresh(_last); }

  return { isOpen: isOpen, open: open, close: close, toggle: toggle, refresh: refresh, scene: scene, grid: function () { return _grid; }, immersive: function () { return _imm; }, setGrid: setGrid, setImmersive: setImm, resColor: resColor };
})();
